// The page's style engine (round 2 A0, docs/CRITIQUE.md P1). Four body:has(#modal ...) rules and two rules with a
// structural pseudo-class after a :has() made every DOM insert restyle the whole page (about 2,900 elements at year 50)
// once a hint or the dead player's bar had been drawn, until the page was reloaded: half the cost of every month.
// tools/bench/style-probe.mjs is the same probe as a bench, over more states and a saved year-50 game.

// --- the lint -----------------------------------------------------------------------------------------------------
// In the CSS the page actually has (every stylesheet, after every tab, a death and the phone layout have been drawn):
//   A. no :has() on a page-wide element (html, body, :root, #app, #game, #tabbody): the browser must then re-check it
//      on every insert anywhere in the page;
//   B. no structural pseudo-class (:first-child, :nth-child() and the like) to the right of a :has(), outside the
//      open dialog (#modal): measured, this is what turns a small insert into a whole-page restyle.
// And in the page's script text: no "body:has(" or the like written as text, for a stylesheet not yet drawn.
const PAGE_WIDE = /^(html|body|:root|#app|#game|#tabbody)(?![\w-])/;
const STRUCT = /:(first-child|last-child|only-child|nth-child|nth-last-child|first-of-type|last-of-type|only-of-type|nth-of-type|nth-last-of-type)\b/;
// split a selector at its top-level commas, and a complex selector into its compounds (outside brackets)
function splitTop(s, seps) {
  const out = []; let depth = 0, cur = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth--;
    if (depth === 0 && seps.includes(ch)) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur);
  return out.map(x => x.trim()).filter(Boolean);
}
// the compound without the arguments of its :has(), :is(), :not() and :where()
const own = c => { let depth = 0, o = ''; for (const ch of c) { if (ch === '(') { depth++; continue; } if (ch === ')') { depth--; continue; } if (!depth) o += ch; } return o; };
export function lintSelector(sel) {
  const bad = [];
  for (const one of splitTop(sel, ',')) {
    if (!one.includes(':has(')) continue;
    const parts = splitTop(one.replace(/\s*([>+~])\s*/g, ' $1 '), ' ').filter(x => !/^[>+~]$/.test(x));
    const hasAt = parts.findIndex(c => c.includes(':has('));
    parts.forEach((c, i) => {
      if (!c.includes(':has(')) return;
      // the element the :has() hangs on: its own type, id, class and attributes (":root[data-theme] body:has(" too)
      const o = own(c).replace(/:has$/, '');
      const simple = o.split(/(?=[.#[:])/);
      if (simple.some(x => PAGE_WIDE.test(x)) || PAGE_WIDE.test(o)) bad.push(`A ${one}`);
    });
    const inDialog = parts.slice(0, hasAt + 1).some(c => /#modal(?![\w-])/.test(own(c)));
    if (!inDialog && parts.slice(hasAt + 1).some(c => STRUCT.test(own(c)))) bad.push(`B ${one}`);
  }
  return bad;
}

export default {
  async cssHasLint(pg) {
    // the rules this lint is for, as they were: each must be caught
    const known = ['body:has(#modal .obit) #agebar', 'body:has(#modal > .hint) #tabbody .hint', ':root[data-theme] body:has(#modal) .x', 'html:has(.y) .z', '#game:has(.x)',
      '#game.phone .barrow:is(:has(.lbl [data-tt="health"])) > :nth-child(2)', '#game:not(.phone) #profile .profs .prow:has(.v2-tier) > span:first-child'];
    const missed = known.filter(s => !lintSelector(s).length);
    const fine = ['#modal:has(> .obit.en-moment)', '#modal.ph-sheet .mbox > .row:has(> .grow > h2) > :first-child:not(.grow)', '.prow:has(.v2-tier) > .bar', 'body.lk-mbox #clk .hint'];
    const wrong = fine.filter(s => lintSelector(s).length);
    const r = await pg.evaluate(async () => {
      // draw what injects stylesheets: every tab, a person, a death, the phone layout
      T.enter({ seed: 3, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 16 });
      try { T.renderAll(); } catch (e) {}
      A.S.queue.length = 0; UI.ov = null; A.pcDeath('a fever'); UI.render();
      const sels = [];
      const walk = L => { for (const r of L) { if (r.selectorText) sels.push(r.selectorText); if (r.cssRules) walk(r.cssRules); } };
      for (const sh of document.styleSheets) { try { walk(sh.cssRules); } catch (e) {} }
      const text = [...document.scripts].map(s => s.textContent).join('\n');
      const asText = [...new Set((text.match(/(?:^|[\s,{}'"`])(?:html|body|:root|#app|#game|#tabbody)(?:[.#[][^\s,{>+~'"`]*)?:has\(/g) || []).map(s => s.trim()))];
      return { sels, asText, sheets: document.styleSheets.length };
    });
    const bad = [...new Set(r.sels.flatMap(lintSelector))];
    return {
      ok: !missed.length && !wrong.length && !bad.length && !r.asText.length,
      detail: (missed.length ? `the lint misses ${missed.join(' | ')}; ` : '') + (wrong.length ? `the lint flags ${wrong.join(' | ')}; ` : '') +
        (bad.length ? `${bad.length} rules: ${bad.slice(0, 4).join(' | ')}; ` : '') + (r.asText.length ? `in the scripts: ${r.asText.slice(0, 4).join(' | ')}; ` : '') +
        `${r.sels.length} selectors in ${r.sheets} stylesheets, ${r.sels.filter(s => s.includes(':has(')).length} with :has()`,
    };
  },

  // the probe: one empty <span> appended to #tabbody and a style read, 12 times, in each state that switched the
  // whole-page restyle on. Style time per recalculation, in main-thread CPU (threadTicks), under 1 ms (healthy: about
  // 0.01; before A0, 4 to 8 ms in a new game and 13 to 21 at year 50)
  async styleInsertProbe(pg) {
    const cdp = await pg.context().newCDPSession(pg);
    await cdp.send('Performance.enable', { timeDomain: 'threadTicks' });
    const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
    const probe = async () => {
      await pg.evaluate(() => new Promise(r => setTimeout(r, 200)));
      const a = await metrics();
      await pg.evaluate(() => { const tb = document.getElementById('tabbody') || document.body; for (let i = 0; i < 12; i++) { const sp = document.createElement('span'); tb.appendChild(sp); void tb.offsetHeight; sp.remove(); void tb.offsetHeight; } });
      const b = await metrics();
      return +(((b.RecalcStyleDuration - a.RecalcStyleDuration) * 1000) / Math.max(1, b.RecalcStyleCount - a.RecalcStyleCount)).toFixed(3);
    };
    const out = [];
    const step = async (label, f) => { const info = await pg.evaluate(f); out.push({ label, ms: await probe(), info }); };
    await step('fresh', () => { UI.set.hints = false; T.enter({ seed: 42, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 16 }); A.S.queue.length = 0; UI.render(); return ''; });
    await step('hint', () => { UI.set.hints = true; UI.set.hintsSeen = { clock: 1 }; if (UI.hintUsed) UI.hintUsed.clock = 1; UI.render(); return document.querySelectorAll('.hint').length + ' hints'; });
    await step('hint gone', () => { for (const h of document.querySelectorAll('.hint')) h.remove(); return ''; });
    await step('death screen', () => { UI.set.hints = false; A.S.queue.length = 0; UI.ov = null; A.pcDeath('a fever'); UI.render(); return document.body.className + (document.getElementById('agebar') ? ' agebar' : ''); });
    await step('dead, the bar', () => { UI.ov = null; A.S.queue.length = 0; UI.render(); return document.body.className + (document.getElementById('agebar') ? ' agebar' : ''); });
    await step('the heir', () => {
      const pc = A.pc(), all = Object.values(A.S.people).filter(p => p.alive && p.id !== pc.id);
      const k = all.find(p => (pc.children || []).includes(p.id)) || all.find(p => p.realm === pc.realm && A.age(p) >= 16 && A.age(p) <= 40);
      if (k) { A.continueAs(k.id); A.S.queue.length = 0; UI.ov = null; UI.screen = 'game'; UI.tab = 'life'; UI.render(); }
      return k ? 'as ' + k.given : 'no heir';
    });
    // the classes that replaced body:has(): the death screen sets en-obit and lk-mbox, and they go with it
    const flags = out.find(o => o.label === 'death screen').info, after = out.find(o => o.label === 'dead, the bar').info;
    const flagsOk = /en-obit/.test(flags) && /lk-mbox/.test(flags) && !/en-obit|lk-mbox/.test(after) && /agebar/.test(after);
    const hintOk = /^[1-9]/.test(out.find(o => o.label === 'hint').info);
    const slow = out.filter(o => !(o.ms < 1));
    return { ok: !slow.length && flagsOk && hintOk, detail: out.map(o => `${o.label} ${o.ms} ms${o.info ? ' (' + o.info + ')' : ''}`).join('; ') + (flagsOk ? '' : '; body classes wrong') + (hintOk ? '' : '; no hint was drawn') };
  },
};
