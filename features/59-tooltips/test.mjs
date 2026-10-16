// Nested tooltips: every number on the profile and the top bar explains itself, popovers open three deep by keyboard
// and by click, Esc closes only the top one, a tap opens and a tap outside closes on a phone, the breakdown of
// fighting worth adds up to the number on the chip, showing anything changes nothing, and axe finds nothing.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);

// a grown-up life on the game screen (seeded), with a few years lived so there are wounds, traits and skills
const enter = (seed, o = {}) => {
  A.newGame(Object.assign({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22 }, o));
  UI.screen = 'game'; UI.tab = 'life'; UI.ov = null;
  for (let i = 0; i < 3; i++) { A.advance(400); let h, g = 0; while ((h = A.headReady()) && g++ < 200) { if (h.type === 'event') A.eventAuto(); else A.S.queue.shift(); } }
  A.S.queue = []; UI.ov = null; UI.render();
};
const ENTER = `(${enter.toString()})`;

// numbers on screen: elements whose own text holds a digit; covered when it or an ancestor has a tooltip
function countIn(sel) {
  const root = document.querySelector(sel); if (!root) return { n: 0, covered: 0, miss: [] };
  const out = { n: 0, covered: 0, miss: [] };
  for (const el of root.querySelectorAll('*')) {
    if (el.closest('svg') || el.closest('[hidden]')) continue;
    const own = [...el.childNodes].filter(x => x.nodeType === 3).map(x => x.textContent).join('');
    if (!/\d/.test(own)) continue;
    out.n++;
    if (el.closest('[data-tt],[data-tip],[title]')) out.covered++; else out.miss.push(own.trim().slice(0, 30));
  }
  return out;
}

export default {
  // the profile and the top bar, with the wiring off (the release, plus the engine) and on
  async ttCoverage(pg) {
    const r = await pg.evaluate(`(() => { ${ENTER}(5901); const count = ${countIn.toString()};
      const res = {};
      for (const on of [false, true]) {
        UI.TT.wired = on; UI.render();
        res[on ? 'after' : 'before'] = { profile: count('#profile'), top: count('#topbar') };
      }
      return res; })()`);
    const b = r.before, a = r.after, all = x => x.covered === x.n;
    const ok = all(a.profile) && all(a.top) && a.profile.n >= 15 && b.profile.covered < a.profile.covered;
    return { ok, detail: `profile numbers with a tooltip: before ${b.profile.covered} of ${b.profile.n}, after ${a.profile.covered} of ${a.profile.n}; top bar: before ${b.top.covered} of ${b.top.n}, after ${a.top.covered} of ${a.top.n}${a.profile.miss.length || a.top.miss.length ? '; missing: ' + a.profile.miss.concat(a.top.miss).join(' | ') : ''}`, data: r };
  },

  // keyboard: Enter on the tier chip, Tab to Body, Enter, Tab to Strength, Enter: three open; Esc closes the top only
  async ttNestedKeyboard(pg) {
    await pg.evaluate(`${ENTER}(5902)`);
    const st = () => pg.evaluate(() => ({ depth: UI.TT.depth(), lvl: (document.activeElement.closest('.tt-pop') || { dataset: {} }).dataset.lvl || null, focus: document.activeElement.dataset.tt || document.activeElement.dataset.tip || document.activeElement.id || document.activeElement.tagName }));
    const tabTo = async key => { for (let i = 0; i < 12; i++) { await pg.keyboard.press('Tab'); const s = await st(); if (s.focus === key || s.focus.startsWith(key)) return true; } return false; };
    await pg.focus('#profile .chip.tier');
    await pg.keyboard.press('Enter');
    const s1 = await st();
    const t1 = await tabTo('worthBody'); await pg.keyboard.press('Enter');
    const s2 = await st();
    const t2 = await tabTo('stat'); await pg.keyboard.press('Enter');
    const s3 = await st();
    const t3 = await tabTo('potential'); await pg.keyboard.press('Enter');
    const s4 = await st();
    await pg.keyboard.press('Escape'); const e1 = await st();
    await pg.keyboard.press('Escape'); const e2 = await st();
    await pg.keyboard.press('Escape'); const e3 = await st();
    while ((await st()).depth) await pg.keyboard.press('Escape');
    const e4 = await st();
    const want = t3 && s4.depth === 4;
    const ok = s1.depth === 1 && s1.lvl === '1' && t1 && s2.depth === 2 && s2.lvl === '2' && t2 && s3.depth === 3 && s3.lvl === '3' && want &&
      e1.depth === s4.depth - 1 && e2.depth === s4.depth - 2 && e3.depth === s4.depth - 3 && e4.depth === 0 && /^worth:/.test(e4.focus);
    return { ok, detail: `Enter: depth ${s1.depth} (focus in level ${s1.lvl}); Body: ${s2.depth}; Strength: ${s3.depth}; its potential: ${s4.depth}; Esc, Esc, Esc: ${e1.depth}, ${e2.depth}, ${e3.depth} (focus back on ${e1.focus}, then ${e2.focus}); all closed, focus on ${e4.focus}` };
  },

  // inside the full profile (a modal dialog): the popover joins the dialog, Tab stays in it, Esc closes it, not the dialog
  async ttInModal(pg) {
    await pg.evaluate(`${ENTER}(5910); UI.A.ov('profile');`);
    const st = () => pg.evaluate(() => ({ depth: UI.TT.depth(), inModal: !!(UI.TT.stack[0] && UI.TT.stack[0].el.closest('#modal')), focusInPop: !!document.activeElement.closest('.tt-pop'), modal: !!document.querySelector('#modal .mbox') }));
    await pg.focus('#modal .barrow .lbl [data-tt="stat"]');
    await pg.keyboard.press('Enter'); const s1 = await st();
    await pg.keyboard.press('Tab'); await pg.keyboard.press('Tab'); const s2 = await st();
    await pg.keyboard.press('Escape'); const s3 = await st();
    const ok = s1.depth === 1 && s1.inModal && s1.focusInPop && s2.focusInPop && s3.depth === 0 && s3.modal;
    return { ok, detail: `Enter on a stat in the full profile: ${s1.depth} open, inside the dialog ${s1.inModal}; after two Tabs focus is still in the popover: ${s2.focusInPop}; Esc: ${s3.depth} open, the dialog still open ${s3.modal}` };
  },

  // mouse: click opens, a click in a lower popover closes the ones above it, a click outside closes all; hover opens too
  async ttNestedClick(pg) {
    await pg.evaluate(`${ENTER}(5903)`);
    const depth = () => pg.evaluate(() => UI.TT.depth());
    await pg.click('#profile .chip.tier'); const d1 = await depth();
    await pg.click('#tt-pop-1 [data-tt="worthBody"]'); const d2 = await depth();
    await pg.click('#tt-pop-2 [data-tt="stat"]'); const d3 = await depth();
    await pg.click('#tt-pop-1 .tip-f', { position: { x: 4, y: 4 } }); const back = await depth();
    await pg.click('#tt-pop-1 [data-tt="worthGear"]'); const g2 = await depth();
    await pg.click('#profile .pname'); const out = await depth();
    // hover: open on the way in, gone after the pointer leaves
    await pg.hover('#profile .barrow .val[data-tt="health"]'); await pg.waitForTimeout(50); const h1 = await depth();
    const kind = await pg.evaluate(() => UI.TT.stack[0] && UI.TT.stack[0].a.dataset.tt);
    if (!h1) return { ok: false, detail: 'hover on the health number opened nothing; ' + JSON.stringify(await pg.evaluate(() => [UI.TT.depth(), document.activeElement.outerHTML.slice(0, 120)])) };
    if (!(await pg.$('#tt-pop-1 [data-tt="stat"]'))) return { ok: false, detail: 'no stat link: ' + JSON.stringify(await pg.evaluate(() => { const v = document.querySelector('#profile .barrow .val[data-tt="health"]'), r = v.getBoundingClientRect(); return [UI.TT.stack.map(s => s.how + ' ' + s.a.outerHTML.slice(0, 80)), [r.x, r.y, r.width, r.height], document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2).outerHTML.slice(0, 100)]; })) };
    await pg.hover('#tt-pop-1 [data-tt="stat"]'); await pg.waitForTimeout(50); const h2 = await depth();
    await pg.hover('#profile .pname'); await pg.waitForTimeout(600); const h0 = await depth();
    // Esc with three open closes one
    await pg.click('#profile .chip.tier'); await pg.click('#tt-pop-1 [data-tt="worthBody"]'); await pg.click('#tt-pop-2 [data-tt="stat"]');
    const before = await depth(); await pg.keyboard.press('Escape'); const after = await depth();
    const ok = d1 === 1 && d2 === 2 && d3 === 3 && back === 1 && g2 === 2 && out === 0 && h1 === 1 && kind === 'health' && h2 === 2 && h0 === 0 && before === 3 && after === 2;
    return { ok, detail: `click: ${d1}, ${d2}, ${d3} deep; a click in the first closes the others (${back}); gear opens (${g2}); outside closes all (${out}). Hover on the health number: ${h1}, its stat link: ${h2}, away: ${h0}. Esc with ${before} open leaves ${after}` };
  },

  // a phone: tap opens, a tap on a word inside opens the next, the popover fits a 375 px screen, a tap outside closes all
  async ttPhoneTap(pg, errs, { browser, file }) {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 740 }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(String(e).slice(0, 300)));
    try {
      await p.goto(pathToFileURL(file).href);
      await p.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
      await p.evaluate(`${ENTER}(5904); UI.tab = 'you'; UI.render();`);
      const box = () => p.evaluate(() => UI.TT.stack.map(s => { const r = s.el.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right), Math.round(r.bottom)]; }));
      await p.tap('.phone-profile .barrow .lbl [data-tt="health"]'); const b1 = await box();
      await p.tap('#tt-pop-1 [data-tt="stat"]'); const b2 = await box();
      await p.tap('#tt-pop-2 [data-tt="worth"], #tt-pop-2 [data-tt="health"], #tt-pop-2 [data-tt="charm"]'); const b3 = await box();
      const fits = b3.every(([l, r, bt]) => l >= 0 && r <= 375 && bt <= 740);
      const top = await p.evaluate(() => document.querySelector('#topbar').getBoundingClientRect().bottom);
      await p.tap('#tt-pop-3 .tt-x'); const b4 = await box();
      await p.touchscreen.tap(187, Math.round(top) + 4); const b5 = await box();
      const scroll = await p.evaluate(() => document.documentElement.scrollWidth);
      await ctx.close();
      const ok = b1.length === 1 && b2.length === 2 && b3.length === 3 && fits && b4.length === 2 && b5.length === 0 && scroll <= 375;
      return { ok, detail: `taps open ${b1.length}, ${b2.length}, ${b3.length}; all inside 375 px: ${fits} (${JSON.stringify(b3)}); the close button leaves ${b4.length}; a tap outside leaves ${b5.length}; page width ${scroll}` };
    } catch (e) { await ctx.close(); throw e; }
  },

  // fighting worth: body + skill + gear is the number on the chip, for the player and 200 others; the popover shows
  // the same sum; the parts are real (a rounding row is at most a point or two)
  async ttWorthSums(pg) {
    const r = await pg.evaluate(`(() => { ${ENTER}(5905);
      const TT = UI.TT, bad = [], rnd = { worth: 0, body: 0, skill: 0, gear: 0, stat: 0 };
      const people = [A.pc(), ...Object.values(A.S.people).filter(p => p.alive && p.st && A.isAdult(p)).slice(0, 200)];
      const sumOf = P => P.reduce((a, x) => a + Math.round(x[1]), 0);
      for (const p of people) {
        const W = A.worthParts(p), w = A.fightWorth(p);
        if (W.body + W.skill + W.gear !== w || W.total !== w) bad.push(p.id + ' parts');
        for (const [k, f, tot] of [['body', TT.bodyParts, W.body], ['skill', TT.skillParts, W.skill], ['gear', TT.gearParts, W.gear]]) {
          const S = f(p); if (S.total !== tot) bad.push(p.id + ' ' + k + ' total');
          rnd[k] = Math.max(rnd[k], Math.abs(tot - sumOf(S.parts)));
        }
        for (const k of GD.STATS) { const S = TT.statParts(p, k); rnd.stat = Math.max(rnd.stat, Math.abs(S.total - sumOf(S.parts))); }
      }
      // what the player sees: the chip's number, the popover's rows and its total
      const pc = A.pc(), chip = document.querySelector('#profile .chip.tier'), shown = +(/· (\\d+)/.exec(chip.textContent) || [])[1];
      const box = document.createElement('div'); box.innerHTML = UI.TIPS.worth(pc.id);
      const rows = [...box.querySelectorAll('.tip-row')], sum = rows.filter(x => !x.classList.contains('tt-sum')).reduce((a, x) => a + parseInt(x.querySelector('b').textContent.replace('−', '-'), 10), 0);
      const total = +rows.find(x => x.classList.contains('tt-sum')).querySelector('b').textContent;
      const W = A.worthParts(pc);
      return { n: people.length, bad: bad.slice(0, 5), rnd, shown, sum, total, W: [W.body, W.skill, W.gear] };
    })()`);
    const ok = !r.bad.length && r.shown === r.total && r.sum === r.total && r.rnd.worth === 0 && r.rnd.gear === 0 && r.rnd.skill === 0 && r.rnd.body <= 2 && r.rnd.stat <= 2;
    return { ok, detail: `chip ${r.shown} = body ${r.W[0]} + skill ${r.W[1]} + gear ${r.W[2]} = popover rows ${r.sum} = its total ${r.total}; ${r.n} people: body + skill + gear = worth in all${r.bad.length ? ' but ' + r.bad.join(', ') : ''}; largest rounding row: body ${r.rnd.body}, skill ${r.rnd.skill}, gear ${r.rnd.gear}, stats ${r.rnd.stat}` };
  },

  // every entry, for several lives, and the wired views: the state and the random stream are untouched
  async ttPure(pg) {
    const r = await pg.evaluate(`(() => {
      const runs = [];
      for (const o of [{ seed: 5906 }, { seed: 5907, status: 'noble', sex: 'F', startAge: 40 }, { seed: 5908, race: 'elf', status: 'artisan', startAge: 60 }]) {
        ${ENTER}(o.seed, o);
        const pc = A.pc();
        if (o.status === 'noble' && A.realm(pc.realm)) { const r = A.realm(pc.realm); const old = A.P(r.ruler); r.ruler = pc.id; pc.ruler = r.id; r.playerRun = true; }
        UI.render();
        const s0 = JSON.stringify(A.S), g0 = JSON.stringify(A.rngState);
        const args = { stat: GD.STATS, potential: GD.STATS, worth: [pc.id], worthBody: [pc.id], worthSkill: [pc.id], worthGear: [pc.id], tier: GD.TIERS.map(t => t.k),
          skill: Object.keys(GD.SKILLS), profTier: GD.PROF_TIERS.map(x => x[1]), trait: Object.keys(GD.TRAITS), quirk: Object.keys(GD.QUIRKS || {}), race: Object.keys(GD.RACES), stage: Object.keys(GD.RACES),
          opinion: Object.keys(pc.rel || {}).slice(0, 10), realmStab: [pc.realm, pc.ruler, 'POL-02'], realmLegit: [pc.realm], realmGold: [pc.realm, 'POL-03'], realmWeary: [pc.realm], infamy: [pc.realm],
          need: ['rest', 'company', 'purpose', 'comfort'], mood: ['rest', 'company', 'purpose', 'comfort', 'content'], age: [pc.id], faith: [pc.faith], wound: Object.keys(GD.WOUNDS) };
        let n = 0, empty = [];
        for (const k of Object.keys(UI.TIPS)) for (const a of (args[k] || [''])) { const h = UI.TIPS[k](a); n++; if (!h && !['blood', 'rep', 'house', 'need', 'needs', 'mood', 'quirk', 'opinion', 'score'].includes(k)) empty.push(k + ':' + a); }
        for (const t of ['life', 'people', 'realm', 'you']) { UI.tab = t; UI.render(); }
        UI.tab = 'life'; UI.render();
        for (const el of [...document.querySelectorAll('[data-tt],[data-tip]')].slice(0, 80)) { UI.TT.open(el, 1, 'click'); const a = UI.TT.stack[0] && UI.TT.stack[0].el.querySelector('[data-tt],[data-tip]'); a && UI.TT.open(a, 2, 'click'); UI.TT.closeAll(); }
        runs.push({ n, empty: empty.slice(0, 6), same: JSON.stringify(A.S) === s0, rng: JSON.stringify(A.rngState) === g0 });
      }
      return runs; })()`);
    const ok = r.every(x => x.same && x.rng && !x.empty.length);
    return { ok, detail: r.map((x, i) => `life ${i + 1}: ${x.n} entries shown and 80 triggers opened two deep; state unchanged ${x.same}, random stream unchanged ${x.rng}${x.empty.length ? '; empty ' + x.empty.join(', ') : ''}`).join('; ') };
  },

  // axe-core with three popovers open, in the dark and the light theme
  async ttAxe(pg, errs) {
    await pg.evaluate(fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8'));
    await pg.evaluate(`${ENTER}(5909)`);
    const found = [];
    for (const theme of ['dark', 'light']) {
      await pg.evaluate(t => { document.documentElement.dataset.theme = t; UI.TT.closeAll(); }, theme);
      await pg.click('#profile .chip.tier'); await pg.click('#tt-pop-1 [data-tt="worthBody"]'); await pg.click('#tt-pop-2 [data-tt="stat"]');
      const v = await pg.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } })).violations.map(v => `${v.id}(${v.nodes.length}: ${v.nodes.slice(0, 2).map(n => n.target.join(' ')).join(', ')})`));
      found.push(...v.map(x => theme + ':' + x));
    }
    const open = await pg.evaluate(() => UI.TT.depth());
    for (let i = errs.length - 1; i >= 0; i--) if (/Refused to connect to 'https:\/\/fonts\.googleapis\.com/.test(errs[i])) errs.splice(i, 1);
    return { ok: !found.length && open === 3, detail: `${open} popovers open; ${found.length} axe violations${found.length ? ': ' + found.slice(0, 6).join('; ') : ''}` };
  },
};
