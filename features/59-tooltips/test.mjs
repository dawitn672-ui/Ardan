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


// ---- part two: the War tab and War Room, Holdings, the Path tab, the odds of a choice, the duel and battle screens,
// the Realm tab (not ruling), the Codex and the Dynasty page, and the phone.
//
// A number on a screen is a numeric token in its text: digits, with a sign, thousands commas and decimals, as "+1,072"
// or "38%" or "0.80". Not counted: prose (a block of 12 words or more, or a running log: the battle's and the duel's
// log, the chronicle, an event's text), years (a lone 700 to 1299), ordinals ("5th"), codes ("POL-01"), keyboard hints,
// and quantity controls ("+1", "+5", a speed button "3"). A number is covered when it sits in a trigger of the engine
// (data-tt or data-tip); a plain title= is reported apart and does not count.
const KIT2 = () => {
  const TT2 = window.TT2 = {
    tokens(root) {
      const out = [];
      if (!root) return out;
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        const el = n.parentElement, t = n.textContent;
        if (!el || !/\d/.test(t)) continue;
        if (el.closest('svg,canvas,[hidden],.tt-pop,select,option,textarea,script,style,.key,.sr-only')) continue;
        const blk = el.closest('p,li,td,th,h1,h2,h3,h4,button,label,summary,div,section') || el, bt = blk.textContent.trim();
        if ((bt.split(/\s+/).length >= 12 && /[.!?](\s|$)/.test(bt)) || el.closest('.blog,.duellog,.chron-line,.mtext,.lore-body,#log')) continue;
        const btn = el.closest('button'); if (btn && /^\s*[+−-]?\d{1,2}\s*$/.test(btn.textContent)) continue;
        const re = /[A-Z]{2,4}-\d+|\d+(?:st|nd|rd|th)\b|[+−-]?\d(?:[\d,]*\d)?(?:\.\d+)*/g;
        let m;
        while ((m = re.exec(t))) {
          if (/^[A-Z]|\d(st|nd|rd|th)$/.test(m[0])) continue;
          const after = t.slice(m.index + m[0].length);
          if (/^\d{3,4}$/.test(m[0]) && +m[0] >= 700 && +m[0] < 1300 && !/^\s*(%|suns?|men|loads|k\b|km|days)/.test(after)) continue;
          out.push({ tok: m[0], tt: !!el.closest('[data-tt],[data-tip]'), title: !!el.closest('[title]'), text: t.trim().slice(0, 40) });
        }
      }
      return out;
    },
    count(root) { const t = TT2.tokens(root); return { n: t.length, tt: t.filter(x => x.tt).length, title: t.filter(x => !x.tt && x.title).length, miss: t.filter(x => !x.tt).map(x => x.text).slice(0, 4) }; },
    // a screen drawn with the wiring off (the build without part two, and without part one) and on
    screen(name, sel, setup) {
      const q = () => document.querySelector(sel);
      UI.TT.wired = false; setup(); UI.render(); const before = TT2.count(q());
      UI.TT.wired = true; setup(); UI.render(); const after = TT2.count(q());
      return { name, before, after };
    },
    settle() { let h, g = 0; while ((h = A.headReady()) && g++ < 300) { if (h.type === 'event') A.eventAuto(); else if (h.type === 'duel' && A.duelAuto) { A.duelAuto(h.d); A.duelClose && A.duelClose(); } else A.S.queue.shift(); } },
    // advance stops at each scene that wants the player: settle it and go on, until the years have passed
    play(years) { const end = A.S.year + years; for (let g = 0; g < 3000 && A.S.year < end; g++) { const r = A.advance(400); TT2.settle(); if (!A.pc() || !A.pc().alive || (r && r.why === 'dead')) return false; } return true; },
    life(seed, o = {}) {
      A.newGame(Object.assign({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22 }, o));
      UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.set.hints = false;
      TT2.play(o.years != null ? o.years : 4);
      A.S.queue = []; UI.ov = null; return A.pc();
    },
    soldier(seed) {
      A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22 });
      const pc = A.pc(); A.startWar('POL-01', A.neighbors('POL-01')[0], null, 'conquest'); A.enlist(pc); A._idIdx = null; A.advance(2); A._idIdx = null;
      UI.screen = 'game'; UI.set.hints = false; TT2.play(1); A.S.queue = []; UI.ov = null; return A.pc();
    },
    ruler(seed) {
      A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 30 });
      const pc = A.pc(), r = A.realm('POL-01'); r.ruler = pc.id; pc.ruler = r.id; r.playerRun = true;
      A.startWar('POL-01', A.neighbors('POL-01')[0], null, 'conquest'); A._idIdx = null; A.advance(40); A._idIdx = null;
      UI.screen = 'game'; UI.set.hints = false; A.S.queue = []; UI.ov = null; return A.pc();
    },
    // events whose choices carry odds: plain checks and fights
    oddsEvents(n) {
      const out = [];
      for (const id of Object.keys(A.EV)) {
        const e = A.EV[id]; if ((A.EV_RETIRED || {})[id] || e.trigger || !e.choices || !e.choices.some(c => c.check)) continue;
        const q = { type: 'event', ev: id, ctx: {} }; A.S.queue = [q]; let v;
        try { v = A.eventView(q); } catch (err) { continue; }
        if (!v || v.skip || !v.choices.some(c => c.odds != null)) continue;
        out.push(q); if (out.length >= n) break;
      }
      A.S.queue = []; return out;
    },
    duel(pc) { A.S.queue = []; const foe = A.makeFoe({ realm: pc.realm, tier: 2 }); foe.npcTemp = false; A.S.people[foe.id] = foe; return A.startDuel(pc, foe, { kind: 'duel', lethal: true, toYield: true }); },
    battle() { const B = A.newBattle({ title: 'Battle of the Test Field', terr: 'hills', weather: 'rain', sideA: { realm: 'POL-01', men: 3000, q: 0.9 }, sideB: { realm: 'POL-03', men: 2600, q: 0.9 } }); B.pcSide = 'A'; A.S.queue = [{ type: 'battle', b: B }]; return B; },
    // the rows of a popover: [label, number] for each row, and its sum row
    rows(html) {
      const d = document.createElement('div'); d.innerHTML = html;
      const num = s => { const m = /[+−-]?[\d,]+(?:\.\d+)?/.exec(String(s).replace(/−/g, '-')); return m ? parseFloat(m[0].replace(/,/g, '')) : null; };
      const all = [...d.querySelectorAll('.tip-row')].map(r => ({ l: r.querySelector('span').textContent, v: num(r.querySelector('b').textContent), sum: r.classList.contains('tt-sum'), sub: r.classList.contains('tt-sub') }));
      return all;
    },
  };
};
const PCT = (a, b) => (b ? Math.round(1000 * a / b) / 10 : 100);
const line = s => `${s.name} ${s.before.tt}/${s.before.n} → ${s.after.tt}/${s.after.n} (${PCT(s.after.tt, s.after.n)}%)${s.after.tt < s.after.n ? ' [' + s.after.miss.join(' | ') + ']' : ''}`;
// the bar: each screen at least 90% covered (and not empty), and enough numbers in all to mean something
const cover = (list, total) => { const bad = list.filter(s => s.after.n < 1 || s.after.tt / s.after.n < 0.9), n = list.reduce((a, s) => a + s.after.n, 0); return { ok: !bad.length && n >= total, bad, n }; };

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
        // the release's Realm tab recounts a realm's workshops from its provinces as it draws (UI.forcesSummary calls
        // A.indCount); the count is a cache, stale whenever a province changed hands since. Bring it up to date first
        for (const id in A.S.realms) { const x = A.S.realms[id]; if (x.alive && x.ind) A.indCount(x); }
        const s0 = JSON.stringify(A.S), g0 = JSON.stringify(A.rngState);
        const args = { stat: GD.STATS, potential: GD.STATS, worth: [pc.id], worthBody: [pc.id], worthSkill: [pc.id], worthGear: [pc.id], tier: GD.TIERS.map(t => t.k),
          skill: Object.keys(GD.SKILLS), profTier: GD.PROF_TIERS.map(x => x[1]), trait: Object.keys(GD.TRAITS), quirk: Object.keys(GD.QUIRKS || {}), race: Object.keys(GD.RACES), stage: Object.keys(GD.RACES),
          opinion: Object.keys(pc.rel || {}).slice(0, 10), realmStab: [pc.realm, pc.ruler, 'POL-02'], realmLegit: [pc.realm], realmGold: [pc.realm, 'POL-03'], realmWeary: [pc.realm], infamy: [pc.realm],
          need: ['rest', 'company', 'purpose', 'comfort'], mood: ['rest', 'company', 'purpose', 'comfort', 'content'], age: [pc.id], faith: [pc.faith], wound: Object.keys(GD.WOUNDS) };
        let n = 0, empty = [];
        // part two's entries take a screen's own arguments (a division, a good, a choice): ttPure2 opens them where they are drawn
        for (const k of Object.keys(UI.TIPS).filter(k => !UI.TT.part2 || !UI.TT.part2.has(k))) for (const a of (args[k] || [''])) { const h = UI.TIPS[k](a); n++; if (!h && !['blood', 'rep', 'house', 'need', 'needs', 'mood', 'quirk', 'opinion', 'score'].includes(k)) empty.push(k + ':' + a); }
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

  // coverage, war: the War tab, the War Room's panels (a soldier, then a ruler), a division, an army, a fight, a province
  async ttCov2War(pg) {
    await pg.evaluate(KIT2);
    const r = await pg.evaluate(() => {
      const T2 = window.TT2, out = [];
      let pc = T2.soldier(5951);
      out.push(T2.screen('War tab (soldier)', '#tabbody', () => { UI.ov = null; UI.tab = 'war'; }));
      UI.warRoomOpen();
      for (const t of UI.wrTabs(A.cmdRole(pc))) out.push(T2.screen(`War Room ${t.k} (soldier)`, '#modal', () => { UI.wr.tab = t.k; UI.wr.sel = null; }));
      const d = A.divById(pc.mil.div);
      out.push(T2.screen('War Room: your division', '#modal', () => { UI.wr.tab = 'cmd'; UI.wr.sel = { k: 'divs', ids: [d.id] }; }));
      UI.ov = null;
      pc = T2.ruler(5952);
      out.push(T2.screen('War tab (ruler)', '#tabbody', () => { UI.ov = null; UI.tab = 'war'; }));
      UI.warRoomOpen();
      for (const t of UI.wrTabs(A.cmdRole(pc))) out.push(T2.screen(`War Room ${t.k} (ruler)`, '#modal', () => { UI.wr.tab = t.k; UI.wr.sel = null; }));
      const a = A.armiesOf('POL-01')[0];
      out.push(T2.screen('War Room: an army', '#modal', () => { UI.wr.tab = 'cmd'; UI.wr.sel = { k: 'army', id: a.id }; }));
      out.push(T2.screen('War Room: a division', '#modal', () => { UI.wr.tab = 'cmd'; UI.wr.sel = { k: 'divs', ids: [a.divs[0]] }; }));
      out.push(T2.screen('War Room: a province', '#modal', () => { UI.wr.tab = 'cmd'; UI.wr.sel = { k: 'prov', pid: A.divById(a.divs[0]).loc }; }));
      const F = Object.values(A.S.fights || {})[0];
      if (F) out.push(T2.screen('War Room: a fight', '#modal', () => { UI.wr.tab = 'cmd'; UI.wr.sel = { k: 'fight', pid: F.loc }; }));
      UI.ov = null; UI.render();
      return out;
    });
    const c = cover(r, 150);
    return { ok: c.ok && r.length >= 14, detail: r.map(line).join('; '), data: r };
  },

  // coverage, money and work: Holdings (a peasant, a noble, a merchant) and the Path tab (the same, and a soldier)
  async ttCov2Hold(pg) {
    await pg.evaluate(KIT2);
    const r = await pg.evaluate(() => {
      const T2 = window.TT2, out = [];
      for (const [nm, seed, o] of [['peasant', 5953, {}], ['noble', 5954, { status: 'noble', realm: 'POL-02', sex: 'F', startAge: 35 }], ['merchant', 5955, { status: 'merchant', realm: 'POL-03', startAge: 30 }]]) {
        T2.life(seed, o);
        out.push(T2.screen(`Holdings (${nm})`, '#tabbody', () => { UI.tab = 'holdings'; }));
        out.push(T2.screen(`Path (${nm})`, '#tabbody', () => { UI.tab = 'path'; }));
      }
      // a trade run planned: the plan's numbers too
      const run = A.bestRuns(A.pc())[0];
      if (run) out.push(T2.screen('Holdings, a run planned', '#tabbody', () => { UI.tab = 'holdings'; UI.run.dest = run.id; }));
      UI.run.dest = null;
      T2.soldier(5956);
      out.push(T2.screen('Path (soldier)', '#tabbody', () => { UI.tab = 'path'; }));
      return out;
    });
    const c = cover(r, 1000);
    return { ok: c.ok && r.length >= 7, detail: r.map(line).join('; '), data: r };
  },

  // coverage, scenes: events with odds (checks and fights), the duel screen, and a battle at its start, midway and end
  async ttCov2Scenes(pg) {
    await pg.evaluate(KIT2);
    const r = await pg.evaluate(() => {
      const T2 = window.TT2, out = [], pc = T2.life(5957, { startAge: 28, years: 1 });
      pc.skills.melee = 40; pc.skills.unarmed = 35;
      const fight = A.FL ? A.FL.CONVERTED.find(x => x.id === 'tavern_brawl') : null;
      const qs = (fight ? [{ type: 'event', ev: fight.id, ctx: {} }] : []).concat(T2.oddsEvents(24));
      const sum = { name: `Events with odds (${qs.length})`, before: { n: 0, tt: 0, title: 0, miss: [] }, after: { n: 0, tt: 0, title: 0, miss: [] } };
      for (const q of qs) { const s = T2.screen('ev', '#modal', () => { A.S.queue = [q]; UI.ov = null; }); for (const k of ['before', 'after']) { sum[k].n += s[k].n; sum[k].tt += s[k].tt; sum[k].title += s[k].title; sum[k].miss.push(...s[k].miss); } }
      sum.after.miss = sum.after.miss.slice(0, 4); out.push(sum);
      A.S.queue = [];
      const D0 = T2.duel(pc);
      out.push(T2.screen('Duel', '#modal', () => { A.S.queue = [{ type: 'duel', d: D0 }]; }));
      const B = T2.battle();
      out.push(T2.screen('Battle, deployment', '#modal', () => { A.S.queue = [{ type: 'battle', b: B }]; }));
      for (let g = 0; B.phase !== 'end' && g < 3; g++) A.battleStep();
      out.push(T2.screen('Battle, midway', '#modal', () => { A.S.queue = [{ type: 'battle', b: B }]; }));
      A.battleAuto(B);
      out.push(T2.screen('Battle, the end', '#modal', () => { A.S.queue = [{ type: 'battle', b: B }]; }));
      A.S.queue = []; UI.render();
      return out;
    });
    const c = cover(r, 60);
    return { ok: c.ok && r.length >= 5 && r[0].after.n >= 30, detail: r.map(line).join('; '), data: r };
  },

  // coverage, the realm and the books: the Realm tab as a commoner and as a noble (neither rules), the Codex's Power &
  // scale, the Dynasty page
  async ttCov2Realm(pg) {
    await pg.evaluate(KIT2);
    const r = await pg.evaluate(() => {
      const T2 = window.TT2, out = [];
      for (const [nm, seed, o] of [['commoner', 5958, { years: 6 }], ['noble', 5959, { status: 'noble', realm: 'POL-02', sex: 'F', startAge: 35, years: 6 }]]) {
        const pc = T2.life(seed, o);
        if (pc.ruler) continue;
        out.push(T2.screen(`Realm, not ruling (${nm})`, '#tabbody', () => { UI.tab = 'realm'; }));
        out.push(T2.screen(`Codex, Power & scale (${nm})`, '#tabbody', () => { UI.tab = 'codex'; UI.codex = 'power'; }));
        out.push(T2.screen(`Dynasty (${nm})`, '#tabbody', () => { UI.tab = 'legacy'; }));
      }
      UI.tab = 'life'; UI.render();
      return out;
    });
    const c = cover(r, 120);
    return { ok: c.ok && r.length >= 6, detail: r.map(line).join('; '), data: r };
  },

  // the sums: what a popover adds up is the number on screen. Odds in points (checks, fights, the duel, the court),
  // money (the year's book, the crown's purse, the run's net), counts (a faction's swords, a template's battalions);
  // products for prices and a division's figures. Each case is checked against the engine's own number.
  async ttSums2(pg) {
    await pg.evaluate(KIT2);
    const r = await pg.evaluate(() => {
      const T2 = window.TT2, TT = UI.TT, R = {}, bad = [];
      const rec = (k, diff, ok) => { const x = R[k] = R[k] || { n: 0, worst: 0, other: 0 }; x.n++; x.worst = Math.max(x.worst, Math.abs(diff)); if (!ok) bad.push(k); };
      const sumR = P => P.reduce((a, x) => a + Math.round(x[1]), 0);
      const other = P => P.some(x => /Other things in play/.test(x[0]));
      const pc = T2.life(5960, { startAge: 28, years: 3 });
      // odds of checks and fights, as the choice shows them
      const qs = T2.oddsEvents(80).concat(A.FL ? A.FL.CONVERTED.slice(0, 60).map(e => ({ type: 'event', ev: e.id, ctx: {} })) : []);
      for (const q of qs) {
        A.S.queue = [q]; let v; try { v = A.eventView(q); } catch (e) { continue; } if (!v || v.skip) continue;
        UI.TT.cur.ev = q;
        v.choices.forEach((vc, vi) => {
          const c = A.EV[q.ev].choices[vc.i]; if (vc.odds == null || !c || !c.check) return;
          const S = c.check.fight ? TT.fightParts(pc, c.check.fight, q.ctx, c.check, vc.odds, q.ev) : TT.checkParts(pc, c.check, q.ctx, vc.odds, q.ev);
          if (S.parts && S.parts.some(x => /remember/.test(x[0]))) rec('odds with a memory', 0, true);
          if (!S.parts) return;
          const d = vc.odds - sumR(S.parts); rec(c.check.fight ? 'fight odds' : 'check odds', d, Math.abs(d) <= 1 && !other(S.parts));
          // the popover shows the same: its rows add to its total
          if (vi === 0) { const rows = T2.rows(UI.TIPS.odds(vi)), sumRow = rows.filter(x => x.sum).pop(), parts = rows.filter(x => !x.sum); rec('odds popover', sumRow ? sumRow.v - parts.reduce((a, x) => a + x.v, 0) : 99, !!sumRow && sumRow.v === vc.odds && sumRow.v === parts.reduce((a, x) => a + x.v, 0)); }
        });
      }
      A.S.queue = []; UI.TT.cur.ev = null;
      // the duel's measure and your instincts' read, over 30 foes
      for (let i = 0; i < 30; i++) {
        const foe = A.makeFoe({ realm: 'POL-01', tier: 1 + (i % 4) }); foe.npcTemp = false; A.S.people[foe.id] = foe;
        const D0 = A.startDuel(pc, foe, { kind: i % 3 ? 'duel' : 'brawl', lethal: i % 3 !== 0, toYield: i % 2 === 0 }); UI.TT.cur.duel = D0;
        const P = TT.duelParts(D0); if (P) { const d = D0.measure.pct - sumR(P); rec('duel odds', d, Math.abs(d) <= 1 && !other(P)); }
        if (D0.readHint) { const rows = T2.rows(UI.TIPS.duelRead()), sumRow = rows.filter(x => x.sum).pop(), parts = rows.filter(x => !x.sum); rec('duel read', sumRow.v - parts.reduce((a, x) => a + x.v, 0), sumRow.v === D0.readHint.conf && !rows.some(x => /Since then/.test(x.l))); }
        A.S.queue = [];
      }
      UI.TT.cur.duel = null;
      // being taken on: every career open to three lives
      for (const [seed, o] of [[5961, {}], [5962, { status: 'merchant', realm: 'POL-03', startAge: 30 }], [5963, { status: 'noble', realm: 'POL-02', startAge: 30 }]]) {
        const p = T2.life(seed, o);
        for (const x of A.jobOptions(p)) { const S = TT.jobOddsParts(p, x.k), d = Math.round(x.chance * 100) - sumR(S.parts); rec('job odds', d, Math.abs(d) <= 1 && !other(S.parts)); }
        // the year's book: its lines add to "All told" on the card
        for (const w of ['cur', 'last']) { const S = TT.bookParts(w); if (!S) continue; UI.tab = 'holdings'; UI.render(); rec('money book', S.total - sumR(S.parts), S.total === sumR(S.parts)); }
        // prices: the factors multiply to the price shown
        const rid = A.homeMkt(p);
        for (const k of Object.keys(GD.GOODS)) for (const side of ['buy', 'sell']) { const P = TT.mktParts(rid, k, side); const d = Math.round(TT.prodOf(P.start, P.factors)) - Math.round(P.total); rec('market price', d, d === 0); }
        for (const k of GD.SHOP) { if (!GD.GEAR[k]) continue; for (const q of Object.keys(GD.QUAL)) { const P = TT.priceParts(k, q, rid); const d = Math.max(1, Math.round(TT.prodOf(P.start, P.factors))) - P.total; rec('gear price', d, d === 0); } }
        // the court and the crown's purse, for every realm with something before its court
        for (const rr of Object.values(A.S.realms)) {
          if (!rr.alive) continue;
          const C = TT.courtParts(rr); if (C) { const d = C.total - sumR(C.parts); rec('court odds', d, Math.abs(d) <= 1); }
          const B = TT.crownParts(rr); if (B) rec('crown purse', 0, B.total === B.rows.reduce((a, x) => a + Math.round(x[1]), 0));
          for (const f of A.factionsOf(rr.id)) { const S = TT.facParts(f), d = S.now - A.factionPower(f); rec('faction power', d * 100, Math.abs(d) < 1e-9); }
        }
      }
      // a division's figures: the template's battalions times each multiplier, for every division of a ruler's host
      T2.ruler(5964);
      for (const d of A.realm('POL-01').forces.divs) {
        const c = A.divCombat(d);
        for (const k of ['soft', 'hard', 'def', 'brk', 'hp']) { const P = TT.divStatParts(d, k), v = TT.prodOf(P.start, P.f), dd = c[k] ? (v - c[k]) / c[k] : 0; rec('division figure', dd * 100, Math.abs(dd) < 1e-6); }
        const O = TT.maxOrgParts(d), mo = (O.base + O.cmd) * O.ord; rec('most organization', mo - O.total, Math.abs(mo - O.total) < 1e-6);
      }
      for (const t of Object.values(A.realm('POL-01').forces.tpl)) { const s = A.tplS('POL-01', t.id); for (const k of ['soft', 'hard', 'def', 'men']) { const rows = T2.rows(UI.TIPS.tplStat('POL-01|' + t.id + '|' + k)), sumRow = rows.filter(x => x.sum).pop(), parts = rows.filter(x => !x.sum); rec('template figure', sumRow.v - parts.reduce((a, x) => a + x.v, 0), Math.round(s[k]) === sumRow.v && !rows.some(x => /Rounding/.test(x.l) && Math.abs(x.v) > 1)); } }
      return { R, bad: [...new Set(bad)], nBad: bad.length, has: { FL: !!A.FL, RI: !!A.RI } };
    });
    // what is measured depends on what is built: the fights and the duel's measure need 48-fight-ladder, the book, the
    // court and the crown's purse 56-realm-inside
    const R = r.R, need = ['check odds', 'odds popover', 'duel read', 'job odds', 'market price', 'gear price', 'division figure', 'most organization', 'template figure']
      .concat(r.has.FL ? ['fight odds', 'duel odds'] : [], r.has.RI ? ['money book', 'court odds', 'crown purse'] : []);
    const enough = need.every(k => R[k] && R[k].n >= 3) && R['check odds'].n >= 40;
    return { ok: !r.nBad && enough, detail: Object.entries(R).map(([k, x]) => `${k}: ${x.n}, largest gap ${Math.round(x.worst * 100) / 100}`).join('; ') + (r.nBad ? `; FAILED: ${r.bad.join(', ')} (${r.nBad})` : '') + (enough ? '' : '; too few cases'), data: r };
  },

  // nested: a price opens its trade skill, which opens its tiers; a division's strength opens its organization, which
  // opens its general; a choice's odds open by a tap on the odds (the choice is not taken), then the stat, then its
  // potential; by keyboard, Right arrow on the choice opens its odds and Esc gives focus back to the choice
  async ttNested2(pg) {
    await pg.evaluate(KIT2);
    const depth = () => pg.evaluate(() => UI.TT.depth());
    const out = {};
    await pg.evaluate(() => { TT2.life(5965, { status: 'merchant', realm: 'POL-03', startAge: 30, years: 2 }); UI.tab = 'holdings'; UI.render(); });
    await pg.click('#tabbody table.mkt-t td[data-tt="mktPrice"]'); out.h1 = await depth();
    await pg.click('#tt-pop-1 [data-tt="skill"]'); out.h2 = await depth();
    await pg.click('#tt-pop-2 [data-tt="profTier"]'); out.h3 = await depth();
    await pg.click('#tabbody .card.purse', { position: { x: 4, y: 4 } }); out.h0 = await depth();
    await pg.evaluate(() => { TT2.soldier(5966); UI.warRoomOpen(); UI.wr.tab = 'cmd'; UI.wr.sel = { k: 'divs', ids: [A.pc().mil.div] }; UI.render(); });
    await pg.click('#modal .wr-div .barrow [data-tt="divOrg"]'); out.w1 = await depth();
    out.wHasGen = !!(await pg.$('#tt-pop-1 [data-tt="genSkills"]'));
    if (out.wHasGen) { await pg.click('#tt-pop-1 [data-tt="genSkills"]'); out.w2 = await depth(); }
    await pg.keyboard.press('Escape'); await pg.keyboard.press('Escape');
    await pg.evaluate(() => { UI.TT.closeAll(); UI.ov = null; const pc = A.pc(); const q = TT2.oddsEvents(40).find(x => A.EV[x.ev].choices.some(c => c.check && !c.check.fight && (GD.STATS.includes(c.check.s)))); window.__q = q; A.S.queue = [q]; UI.render(); });
    const before = await pg.evaluate(() => A.S.queue[0] === window.__q && !window.__q.result);
    await pg.click('#modal [data-tt="odds"][data-tt-tap]'); out.e1 = await depth();
    out.notChosen = await pg.evaluate(() => A.S.queue[0] === window.__q && !window.__q.result);
    await pg.click('#tt-pop-1 [data-tt="stat"]'); out.e2 = await depth();
    await pg.click('#tt-pop-2 [data-tt="potential"]'); out.e3 = await depth();
    await pg.evaluate(() => UI.TT.closeAll());
    await pg.focus('#modal button[data-a="evChoose"]:has([data-tt-tap])');
    await pg.keyboard.press('ArrowRight'); out.k1 = await depth(); out.kFocus = await pg.evaluate(() => !!document.activeElement.closest('.tt-pop'));
    await pg.keyboard.press('Escape'); out.k0 = await depth(); out.kBack = await pg.evaluate(() => document.activeElement.matches('button[data-a="evChoose"]'));
    out.stillNot = await pg.evaluate(() => A.S.queue[0] === window.__q && !window.__q.result);
    const ok = out.h1 === 1 && out.h2 === 2 && out.h3 === 3 && out.h0 === 0 && out.w1 === 1 && (!out.wHasGen || out.w2 === 2) && before && out.e1 === 1 && out.notChosen && out.e2 === 2 && out.e3 === 3 && out.k1 === 1 && out.kFocus && out.k0 === 0 && out.kBack && out.stillNot;
    return { ok, detail: `Holdings: a price ${out.h1}, its trade skill ${out.h2}, the tiers ${out.h3}, a click outside ${out.h0}. War Room: organization ${out.w1}, its general ${out.w2 || 'none'}. Event: a tap on the odds ${out.e1} (choice not taken: ${out.notChosen}), the stat ${out.e2}, its potential ${out.e3}; Right arrow on the choice ${out.k1} (focus inside ${out.kFocus}), Esc ${out.k0} (focus back on the choice ${out.kBack}); still not chosen ${out.stillNot}`, data: out };
  },

  // render purity on each screen: draw it, open every trigger and the first word inside it, close; the state and the
  // random stream are as they were
  async ttPure2(pg) {
    await pg.evaluate(KIT2);
    const r = await pg.evaluate(() => {
      const T2 = window.TT2, res = [];
      const probe = (name, draw) => {
        draw(); UI.render();
        const s0 = JSON.stringify(A.S), g0 = JSON.stringify(A.rngState);
        let n = 0, empty = 0;
        for (let round = 0; round < 2; round++) { draw(); UI.render(); }
        for (const el of [...document.querySelectorAll('[data-tt]')].filter(x => !x.closest('.tt-pop')).slice(0, 150)) {
          const p1 = UI.TT.open(el, 1, 'click'); n++; if (!p1) { empty++; continue; }
          const a = p1.querySelector('[data-tt],[data-tip]'); if (a) { UI.TT.open(a, 2, 'click'); n++; }
          UI.TT.closeAll();
        }
        draw(); UI.render();
        res.push({ name, n, empty, same: JSON.stringify(A.S) === s0, rng: JSON.stringify(A.rngState) === g0 });
      };
      T2.life(5967, { status: 'noble', realm: 'POL-02', startAge: 35, years: 4 });
      for (const t of ['holdings', 'path', 'realm', 'legacy']) probe(t, () => { UI.ov = null; UI.tab = t; });
      probe('codex', () => { UI.ov = null; UI.tab = 'codex'; UI.codex = 'power'; });
      const qs = T2.oddsEvents(6);
      qs.forEach((q, i) => probe('event ' + q.ev, () => { A.S.queue = [q]; UI.ov = null; }));
      const D0 = T2.duel(A.pc()); probe('duel', () => { A.S.queue = [{ type: 'duel', d: D0 }]; });
      const B = T2.battle(); A.battleAuto(B); probe('battle', () => { A.S.queue = [{ type: 'battle', b: B }]; });
      A.S.queue = [];
      const pc = T2.soldier(5968);
      probe('war tab', () => { UI.ov = null; UI.tab = 'war'; });
      UI.warRoomOpen();
      for (const t of UI.wrTabs(A.cmdRole(pc))) probe('war room ' + t.k, () => { UI.wr.tab = t.k; UI.wr.sel = null; });
      probe('war room division', () => { UI.wr.tab = 'cmd'; UI.wr.sel = { k: 'divs', ids: [pc.mil.div] }; });
      UI.ov = null; T2.ruler(5969); UI.warRoomOpen();
      for (const t of ['tpl', 'ind', 'mp']) probe('war room ' + t + ' (ruler)', () => { UI.wr.tab = t; UI.wr.sel = null; });
      UI.ov = null; UI.render();
      return res;
    });
    const ok = r.length >= 18 && r.every(x => x.same && x.rng && x.n > 0 && x.empty === 0);
    return { ok, detail: `${r.length} screens, ${r.reduce((a, x) => a + x.n, 0)} popovers opened (${r.filter(x => !x.same || !x.rng).map(x => x.name).join(', ') || 'state and random stream unchanged on every one'})${r.some(x => x.empty) ? '; empty: ' + r.filter(x => x.empty).map(x => x.name + ' ' + x.empty).join(', ') : ''}`, data: r };
  },

  // axe-core with popovers open: the War Room (two deep), Holdings (two deep) and an event (two deep); dark and light
  async ttAxe2(pg, errs) {
    await pg.evaluate(fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8'));
    await pg.evaluate(KIT2);
    const found = [], opened = [];
    const run = async (label) => {
      const v = await pg.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } })).violations.map(v => `${v.id}(${v.nodes.length}: ${v.nodes.slice(0, 2).map(n => n.target.join(' ')).join(', ')})`));
      found.push(...v.map(x => label + ':' + x)); opened.push(label + ' ' + (await pg.evaluate(() => UI.TT.depth())));
    };
    for (const theme of ['dark', 'light']) {
      await pg.evaluate(t => { document.documentElement.dataset.theme = t; UI.TT.closeAll(); TT2.soldier(5970); UI.warRoomOpen(); UI.wr.tab = 'cmd'; UI.wr.sel = { k: 'divs', ids: [A.pc().mil.div] }; UI.render(); }, theme);
      await pg.click('#modal .wr-stats [data-tt="divStat"]'); const g = await pg.$('#tt-pop-1 [data-tt]'); if (g) await g.click();
      await run(theme + ' war room');
      await pg.evaluate(() => { UI.TT.closeAll(); UI.ov = null; TT2.life(5971, { years: 2 }); UI.tab = 'holdings'; UI.render(); });
      await pg.click('#tabbody table.mkt-t td[data-tt="mktPrice"]'); await pg.click('#tt-pop-1 [data-tt="skill"]');
      await run(theme + ' holdings');
      await pg.evaluate(() => { UI.TT.closeAll(); const q = TT2.oddsEvents(30).find(x => A.EV[x.ev].choices.some(c => c.check && !c.check.fight)); A.S.queue = [q]; UI.ov = null; UI.render(); });
      await pg.click('#modal [data-tt="odds"][data-tt-tap]'); const s2 = await pg.$('#tt-pop-1 [data-tt="stat"], #tt-pop-1 [data-tt="skill"]'); if (s2) await s2.click();
      await run(theme + ' event');
      await pg.evaluate(() => { UI.TT.closeAll(); A.S.queue = []; UI.ov = null; UI.render(); });
    }
    for (let i = errs.length - 1; i >= 0; i--) if (/Refused to connect to 'https:\/\/fonts\.googleapis\.com/.test(errs[i])) errs.splice(i, 1);
    const deep = opened.every(x => / 2$/.test(x));
    return { ok: !found.length && deep, detail: `open: ${opened.join(', ')}; ${found.length} axe violations${found.length ? ': ' + found.slice(0, 6).join('; ') : ''}` };
  },

  // the phone (71-phone's layout, when it is in the build): at 375 × 740 by touch, a tap opens a price, a word inside
  // opens the next, both fit the screen, the × closes one and a tap outside the rest; a tap on a choice's odds opens
  // them without taking the choice; a tap on a number in the War tab opens it; no sideways scroll
  async ttPhone2(pg, errs, { browser, file }) {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 740 }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(String(e).slice(0, 300)));
    try {
      await p.goto(pathToFileURL(file).href);
      await p.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
      await p.evaluate(KIT2);
      const box = () => p.evaluate(() => UI.TT.stack.map(s => { const r = s.el.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right), Math.round(r.top), Math.round(r.bottom)]; }));
      const fit = b => b.every(([l, r, t, bt]) => l >= 0 && r <= 375 && t >= 0 && bt <= 740);
      const phone = await p.evaluate(() => !!(UI.PHONE || document.querySelector('style#phone-css') || A.PHONE || window.PHONE));
      await p.evaluate(() => { TT2.life(5972, { status: 'merchant', realm: 'POL-03', startAge: 30, years: 2 }); UI.tab = 'holdings'; UI.render(); });
      const cell = await p.$('#tabbody table.mkt-t td[data-tt="mktPrice"]'); await cell.scrollIntoViewIfNeeded();
      await cell.tap(); const b1 = await box();
      await p.tap('#tt-pop-1 [data-tt="skill"]'); const b2 = await box();
      const fits = fit(b2);
      await p.tap('#tt-pop-2 .tt-x'); const b3 = await box();
      const top = await p.evaluate(() => document.querySelector('#topbar').getBoundingClientRect().bottom);
      await p.touchscreen.tap(187, Math.round(top) + 4); const b4 = await box();
      const w1 = await p.evaluate(() => document.documentElement.scrollWidth);
      // an event: the odds by tap
      await p.evaluate(() => { const q = TT2.oddsEvents(30).find(x => A.EV[x.ev].choices.some(c => c.check)); window.__q = q; A.S.queue = [q]; UI.ov = null; UI.render(); });
      const pill = await p.$('#modal [data-tt="odds"][data-tt-tap]'); await pill.scrollIntoViewIfNeeded(); await pill.tap(); const e1 = await box();
      const kept = await p.evaluate(() => A.S.queue[0] === window.__q && !window.__q.result);
      const eFits = fit(e1);
      await p.evaluate(() => { UI.TT.closeAll(); A.S.queue = []; UI.ov = null; UI.render(); });
      // the War tab
      await p.evaluate(() => { TT2.soldier(5973); UI.tab = 'war'; UI.render(); });
      const n = await p.$('#tabbody [data-tt="divStr"]'); await n.scrollIntoViewIfNeeded(); await n.tap(); const war = await box();
      const w2 = await p.evaluate(() => document.documentElement.scrollWidth);
      await ctx.close();
      const ok = b1.length === 1 && b2.length === 2 && fits && b3.length === 1 && b4.length === 0 && w1 <= 375 && e1.length === 1 && kept && eFits && war.length === 1 && fit(war) && w2 <= 375;
      return { ok, detail: `${phone ? '71-phone in the build' : 'no 71-phone in this build'}; Holdings: taps open ${b1.length}, ${b2.length}, inside 375 × 740: ${fits} (${JSON.stringify(b2)}); × leaves ${b3.length}; a tap outside leaves ${b4.length}; page width ${w1}. Event: a tap on the odds opens ${e1.length}, inside: ${eFits}, the choice not taken: ${kept}. War tab: ${war.length} open, inside: ${fit(war)}; page width ${w2}` };
    } catch (e) { await ctx.close(); throw e; }
  },
};
