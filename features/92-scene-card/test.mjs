// 92-scene-card: every event as a scene card, docked in the centre column (a sheet on the phone), with the result in
// place and a chip for every number that changed.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);

const SETUP = () => {
  window.SCT = {
    // no hints, no cut-ins, no motion: the card is measured where it rests
    quiet() {
      UI.set.hints = false;
      if (UI.MOMENTS) { UI.set.cutins = false; UI.MOMENTS.skip(); }
      document.documentElement.dataset.motion = 'off';
    },
    start(o) { T.enter(o); SCT.quiet(); UI.render(); },
    // the next event a life brings up (results left open are closed, other prompts skipped); null when the life ends
    next(limit = 6000) {
      for (let g = 0; g < limit; g++) {
        const h = A.headReady();
        if (h && h.type === 'event') {
          if (h.result) { A.eventClose(); continue; }
          const v = A.eventView(h);
          if (v && !v.skip) return h;
          A.eventAuto(); continue;
        }
        if (h) { if (A.skipPrompt) A.skipPrompt(); else A.S.queue.shift(); continue; }
        if (!A.pc() || !A.pc().alive) return null;
        A.advance(31);
      }
      return null;
    },
    // the card as drawn: tokens, overflow, every choice in reach and in key order
    measure(q, phone) {
      const m = document.getElementById('modal'), card = m && m.querySelector(':scope > .sc-card');
      if (!card) return { ev: q.ev, err: 'no card' };
      const v = A.eventView(q), inn = card.querySelector('.sc-in');
      const cr = card.getBoundingClientRect(), W = innerWidth, H = innerHeight;
      let place;
      if (phone) place = m.classList.contains('sc-sheet') && cr.left <= 1 && cr.right >= W - 1 && cr.bottom >= H - 1;
      else { const lw = document.getElementById('logwrap').getBoundingClientRect(); place = m.classList.contains('sc-dock') && cr.left >= lw.left - 1 && cr.right <= lw.right + 1 && cr.top >= lw.top - 1 && cr.bottom <= lw.bottom + 1; }
      const inView = cr.left >= -1 && cr.top >= -1 && cr.right <= W + 1 && cr.bottom <= H + 1;
      const btns = [...card.querySelectorAll('.choices > button')];
      let unreachable = 0, rowOver = 0, order = 0, tagOut = 0, small = 0;
      btns.forEach((b, i) => {
        if (+b.dataset.v !== i) order++;
        if (b.scrollWidth > b.clientWidth + 1) rowOver++;
        b.scrollIntoView({ block: 'nearest' });
        const r = b.getBoundingClientRect();
        if (phone ? r.height < 52 - 0.5 : r.height < 44 - 0.5) small++;
        for (const t of b.querySelectorAll('.sc-tags > *')) { const tr = t.getBoundingClientRect(); if (tr.right > r.right + 1 || tr.left < r.left - 1) tagOut++; }
        const hit = document.elementFromPoint(r.left + Math.min(r.width / 2, 60), r.top + r.height / 2);
        if (!hit || !(hit === b || b.contains(hit))) unreachable++;
      });
      if (inn) inn.scrollTop = 0;
      return { ev: q.ev, n: v.choices.length, btns: btns.length, raw: T.raw.test(card.textContent), place, inView, hOver: !!inn && inn.scrollWidth > inn.clientWidth + 1,
        rowOver, unreachable, order, tagOut, small, scrolls: !!inn && inn.scrollHeight > inn.clientHeight + 1 };
    },
    // events from real lives, each drawn and measured as it comes up
    sample(n, starts, phone) {
      const out = [], seen = new Set();
      for (const o of starts) {
        SCT.start(o);
        for (let k = 0; k < 400 && out.length < n; k++) {
          const q = SCT.next(); if (!q) break;
          if (!seen.has(q.ev)) { seen.add(q.ev); UI.renderModal(); out.push(SCT.measure(q, phone)); }
          A.eventAuto();
        }
        if (out.length >= n) break;
      }
      return out;
    },
    // the reading a result's chips must match: stats and skills as shown, vitals rounded, coin to a tenth, their regard
    read(q) {
      const pc = A.pc(), o = { st: {}, v: {}, sk: {}, coin: pc.coin, fam: A.S.family && typeof A.S.family.wealth === 'number' ? A.S.family.wealth : null, tr: pc.traits.slice(), wd: pc.wounds.map(w => w.k) };
      for (const s of GD.STATS) o.st[s] = A.stat(pc, s);
      for (const k of ['health', 'happy', 'looks', 'fame', 'honor', 'piety']) o.v[k] = Math.round(pc[k]);
      for (const k of Object.keys(GD.SKILLS)) o.sk[k] = A.skill(pc, k);
      const t = q.ctx && q.ctx.pid ? A.P(q.ctx.pid) : null;
      o.op = t && t.id !== pc.id && t.rel && t.rel[pc.id] ? Math.round(t.rel[pc.id].op) : null;
      return o;
    },
    want(a, b) {
      const w = [];
      for (const s of GD.STATS) if (b.st[s] !== a.st[s]) w.push(['st.' + s, b.st[s] - a.st[s]]);
      for (const k in b.v) if (b.v[k] !== a.v[k]) w.push(['v.' + k, b.v[k] - a.v[k]]);
      const dc = Math.round((b.coin - a.coin) * 10) / 10; if (dc) w.push(['coin', dc]);
      if (a.fam != null && b.fam != null) { const df = Math.round((b.fam - a.fam) * 10) / 10; if (df) w.push(['fam', df]); }
      if (b.op != null && (a.op == null ? b.op : b.op - a.op)) w.push(['them', a.op == null ? b.op : b.op - a.op]);
      for (const k in b.sk) if (b.sk[k] !== a.sk[k]) w.push(['sk.' + k, b.sk[k] - a.sk[k]]);
      for (const t of b.tr) if (!a.tr.includes(t)) w.push(['tr.' + t, 1]);
      for (const t of a.tr) if (!b.tr.includes(t)) w.push(['tr.' + t, -1]);
      const wa = a.wd.slice(); for (const x of b.wd) { const i = wa.indexOf(x); if (i >= 0) wa.splice(i, 1); else w.push(['wd.' + x, -1]); }
      return w.map(x => x.join('=')).sort();
    },
    // a choice worth testing: one with a check, else one with an effect, else the first
    pick(q) {
      const v = A.eventView(q), e = A.EV[q.ev];
      let i = v.choices.findIndex(c => c.odds != null);
      if (i < 0) i = v.choices.findIndex(c => c.i >= 0 && e.choices[c.i] && e.choices[c.i].fx);
      return Math.max(0, i);
    },
    defs() {
      if (A.EV.sct_keys) return;
      A.defEvents([
        { id: 'sct_keys', title: 'Three doors', cond: () => false, w: 0, text: 'Three doors stand in the wall of the old keep. One is warm to the touch.',
          choices: [{ t: 'The first door', r: 'A cellar, and nothing in it.', fx: { happy: 2 } }, { t: 'The second door', r: 'A purse on a nail. You take it.', fx: { coin: 5, honor: -3 } },
            { t: 'Force the third door', check: { s: 'str', d: 45 }, win: { r: 'It gives.', fx: { str: 1 } }, lose: { r: 'It holds, and your shoulder does not.', fx: { health: -5 } } }] },
        { id: 'sct_keys2', title: 'The stair', cond: () => false, w: 0, text: 'Past the door a stair goes down into the dark.',
          choices: [{ t: 'Go down', r: 'Cold, and wet, and empty.', fx: { happy: -1 } }, { t: 'Go back', r: 'You go back.' }, { t: 'Call out', r: 'Nobody answers.' }] },
        { id: 'sct_long', title: 'The long night at the ford', cond: () => false, w: 0,
          text: 'The river is up and the ford is gone under brown water. On the far bank a carter waits with his wagon and his two sons, and he shouts across that the bridge at Millrun is down as well. Behind you the road goes back to the inn, and the inn is full of soldiers who drink and do not pay. The light is going. A boatman with one eye offers to take you over for a price he will not name until you are in the boat.',
          choices: [{ t: 'Take the boat', check: { s: 'wil', d: 45 }, win: { r: 'He names a fair price.' }, lose: { r: 'He names a robber\'s price.', fx: { coin: -3 } } },
            { t: 'Wade it with a rope', check: { s: 'sta', s2: 'str', d: 50 }, win: { r: 'You cross, soaked.' }, lose: { r: 'The river takes your pack.', fx: { health: -5 } } },
            { t: 'Go back to the inn', r: 'You sleep on a bench among the soldiers.', fx: { happy: -2 } }, { t: 'Wait for the water to fall', r: 'It falls by noon.' }] },
      ]);
    },
    hashS() { return T.hash(A.S); },
  };
};
const LIVES = [
  { seed: 7103, race: 'human', realm: 'POL-03', status: 'peasant', sex: 'F', startAge: 17 },
  { seed: 4242, race: 'elf', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 22 },
  { seed: 5150, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 8 },
  { seed: 818, race: 'dwarf', realm: 'POL-03', status: 'noble', sex: 'F', startAge: 34 },
  { seed: 2024, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 45 },
];
const summary = rows => {
  const bad = rows.filter(r => r.err || r.raw || !r.place || !r.inView || r.hOver || r.rowOver || r.unreachable || r.order || r.tagOut || r.small || r.btns !== r.n);
  const why = r => r.err || [r.raw && 'raw token', !r.place && 'not placed', !r.inView && 'off screen', r.hOver && 'overflows', r.rowOver && 'row overflows', r.unreachable && `${r.unreachable} out of reach`,
    r.order && 'key order', r.tagOut && 'tag outside its row', r.small && 'row too small', r.btns !== r.n && `${r.btns} of ${r.n} choices`].filter(Boolean).join(', ');
  return { bad, why, scrolled: rows.filter(r => r.scrolls).length };
};

export default {
  // 200 events from five lives at 1366 x 768: docked in the centre column, nothing raw, nothing overflowing, every
  // choice in reach (scrolled to if the card scrolls) and in key order; then 60 at 390 x 844 as a sheet
  async scEvery(pg, errs, { browser, file }) {
    await pg.setViewportSize({ width: 1366, height: 768 });
    await pg.evaluate(SETUP);
    const rows = await pg.evaluate(L => SCT.sample(200, L, false), LIVES);
    const d = summary(rows);
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    let prow = [];
    try {
      p.on('pageerror', e => errs.push(String(e.stack || e).slice(0, 300)));
      await p.goto(pathToFileURL(file).href);
      await p.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
      const { HELPERS } = await import('../../tests/helpers.mjs');
      await p.evaluate(HELPERS); await p.evaluate(SETUP);
      prow = await p.evaluate(L => SCT.sample(60, L, true), LIVES.slice(0, 3));
    } finally { await ctx.close(); }
    const e = summary(prow);
    const ok = rows.length >= 200 && !d.bad.length && prow.length >= 60 && !e.bad.length;
    return { ok, detail: `desktop: ${rows.length} events, ${d.bad.length} bad${d.bad.length ? ' (' + d.bad.slice(0, 4).map(r => r.ev + ': ' + d.why(r)).join('; ') + ')' : ''}, ${d.scrolled} scroll inside the card; ` +
      `phone: ${prow.length} events, ${e.bad.length} bad${e.bad.length ? ' (' + e.bad.slice(0, 4).map(r => r.ev + ': ' + e.why(r)).join('; ') + ')' : ''}, ${e.scrolled} scroll inside the sheet` };
  },

  // the keys: focus on the first choice, Escape never dismisses, Tab stays in the card, 2 chooses, Enter continues (on
  // the button or not), a held Enter does not fall through into the next card, and focus goes back where it was
  async scKeys(pg) {
    await pg.setViewportSize({ width: 1366, height: 768 });
    await pg.evaluate(SETUP);
    const st = () => pg.evaluate(() => {
      const q = A.S.queue[0], ae = document.activeElement, card = document.querySelector('#modal > .sc-card');
      return { ev: q && q.ev, result: !!(q && q.result), phase: card && card.dataset.sc, focus: ae ? (ae.dataset.a || ae.tagName) + ':' + (ae.dataset.v || '') : '', inModal: !!(ae && ae.closest('#modal')) };
    });
    const opener = await pg.evaluate(() => {
      SCT.start({ seed: 31, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 }); SCT.defs();
      A.S.queue = []; UI.render();
      const t = document.querySelector('#tabs [data-a]'); t.focus();
      A.S.queue.push({ type: 'event', ev: 'sct_keys', ctx: {} }, { type: 'event', ev: 'sct_keys2', ctx: {} });
      UI.renderModal();
      return { a: t.dataset.a, v: t.dataset.v || '' };
    });
    const out = {};
    out.open = await st();
    await pg.keyboard.press('Escape'); out.esc = await st();
    let trapped = true;
    for (let i = 0; i < 9; i++) { await pg.keyboard.press('Tab'); if (!(await st()).inModal) trapped = false; }
    await pg.keyboard.press('2'); out.two = await st();
    out.chips = await pg.evaluate(() => [...document.querySelectorAll('#modal .sc-deltas > li')].map(li => li.dataset.k + '=' + li.dataset.d).sort().join(' '));
    out.chose = await pg.evaluate(() => (document.querySelector('#modal .sc-chose-t') || {}).textContent || '');
    await pg.keyboard.press('Escape'); out.esc2 = await st();
    await pg.keyboard.down('Enter'); out.next = await st();
    await pg.keyboard.down('Enter'); out.held = await st();
    await pg.keyboard.up('Enter');
    await pg.keyboard.press('3'); out.three = await st();
    await pg.evaluate(() => document.activeElement.blur());
    await pg.keyboard.press('Enter');
    await pg.waitForTimeout(80);
    out.closed = await pg.evaluate(o => { const ae = document.activeElement; return { modal: !!document.getElementById('modal'), back: !!ae && ae.dataset.a === o.a && (ae.dataset.v || '') === o.v, inert: !!document.getElementById('app').inert }; }, opener);
    const ok = out.open.ev === 'sct_keys' && out.open.focus === 'evChoose:0' && out.esc.phase === 'choose' && trapped &&
      out.two.result && out.two.focus === 'evClose:' && out.chips === 'coin=5 v.honor=-3' && /second door/.test(out.chose) && out.esc2.phase === 'result' &&
      out.next.ev === 'sct_keys2' && out.next.phase === 'choose' && out.held.phase === 'choose' && out.three.result && !out.closed.modal && out.closed.back && !out.closed.inert;
    return { ok, detail: `opens on ${out.open.focus}; Escape keeps it (${out.esc.phase}); Tab stays inside ${trapped}; 2 gives ${out.two.result ? 'the result' : 'nothing'}, focus ${out.two.focus}, chips "${out.chips}"; ` +
      `Escape on the result keeps it (${out.esc2.phase}); Enter: ${out.next.ev} ${out.next.phase}; a held Enter: ${out.held.phase}; 3 then Enter off the button closes it: ${!out.closed.modal}; focus back on the opener ${out.closed.back}; page live again ${!out.closed.inert}` };
  },

  // the chips against the state: 40 events from real lives, the choice made through the button's action, the player
  // read before and after by the test's own reading; every chip must be a change and every change a chip
  async scDeltas(pg) {
    await pg.setViewportSize({ width: 1366, height: 768 });
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(L => {
      const res = { n: 0, chips: 0, withChips: 0, bad: [] };
      for (const o of L) {
        SCT.start(o);
        for (let k = 0; k < 200 && res.n < 40; k++) {
          const q = SCT.next(); if (!q) break;
          UI.renderModal();
          const a = SCT.read(q), i = SCT.pick(q);
          UI.A.evChoose(i);
          if (A.S.queue[0] !== q || !q.result || !A.pc().alive) continue;   // a fight came first, or the life ended
          const b = SCT.read(q), want = SCT.want(a, b);
          const got = [...document.querySelectorAll('#modal .sc-deltas > li')].map(li => li.dataset.k + '=' + (+li.dataset.d)).sort();
          res.n++; res.chips += got.length; if (got.length) res.withChips++;
          if (want.join() !== got.join()) res.bad.push(`${q.ev}: want ${want.join(' ')} / got ${got.join(' ')}`);
          A.eventClose();
        }
        if (res.n >= 40) break;
      }
      return res;
    }, LIVES);
    return { ok: r.n >= 40 && r.withChips >= 15 && !r.bad.length, detail: `${r.n} results, ${r.withChips} with chips (${r.chips} in all); mismatches ${r.bad.length}${r.bad.length ? ': ' + r.bad.slice(0, 3).join('; ') : ''}` };
  },

  // drawing is pure: the card drawn three times in each phase leaves A.S and the random stream as they were, and the
  // second and third drawings are the same markup (the first carries the entrance)
  async scPure(pg) {
    await pg.setViewportSize({ width: 1366, height: 768 });
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(L => {
      const res = { n: 0, moved: [], differ: [] };
      for (const o of L.slice(0, 3)) {
        SCT.start(o);
        for (let k = 0; k < 200 && res.n < 30; k++) {
          const q = SCT.next(); if (!q) break;
          A.eventView(q);
          for (const phase of ['choose', 'result']) {
            const h0 = SCT.hashS(), g0 = JSON.stringify(A.rngState);
            const html = [];
            for (let t = 0; t < 3; t++) { UI.renderModal(); UI.refresh(); html.push((document.getElementById('modal') || {}).innerHTML || ''); }
            if (SCT.hashS() !== h0 || JSON.stringify(A.rngState) !== g0) res.moved.push(q.ev + ':' + phase);
            if (html[1] !== html[2]) res.differ.push(q.ev + ':' + phase);
            if (phase === 'choose') { UI.A.evChoose(SCT.pick(q)); if (A.S.queue[0] !== q || !q.result) break; }
          }
          res.n++;
          if (A.S.queue[0] === q && q.result) A.eventClose();
        }
      }
      return res;
    }, LIVES);
    return { ok: r.n >= 30 && !r.moved.length && !r.differ.length, detail: `${r.n} events drawn three times in each phase: state or random stream moved by drawing ${r.moved.length}${r.moved.length ? ' (' + r.moved.slice(0, 3).join(', ') + ')' : ''}; markup differs between draws ${r.differ.length}${r.differ.length ? ' (' + r.differ.slice(0, 3).join(', ') + ')' : ''}` };
  },

  // the phone: a full-screen sheet with its own scroll; the page behind does not move; rows of 52 px and up
  async scPhone(pg, errs, { browser, file }) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    let r;
    try {
      p.on('pageerror', e => errs.push(String(e.stack || e).slice(0, 300)));
      await p.goto(pathToFileURL(file).href);
      await p.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
      const { HELPERS } = await import('../../tests/helpers.mjs');
      await p.evaluate(HELPERS); await p.evaluate(SETUP);
      r = await p.evaluate(() => {
        SCT.start({ seed: 7103, race: 'human', realm: 'POL-03', status: 'peasant', sex: 'F', startAge: 17 });
        UI.set.tx = 1.5; UI.applySettings();   // large text, so the sheet must scroll
        SCT.defs(); const id = 'sct_long';
        A.S.queue = [{ type: 'event', ev: id, ctx: {} }]; UI.render();
        const m = document.getElementById('modal'), card = m.querySelector('.sc-card'), inn = card.querySelector('.sc-in'), cr = card.getBoundingClientRect();
        const rows = [...card.querySelectorAll('.choices > button')].map(b => Math.round(b.getBoundingClientRect().height));
        return { id, sheet: m.classList.contains('sc-sheet'), fills: cr.left <= 1 && cr.right >= innerWidth - 1 && cr.bottom >= innerHeight - 1, scroller: getComputedStyle(inn).overflowY, scrolls: inn.scrollHeight > inn.clientHeight + 4, rows, y0: scrollY };
      });
      const box = await p.$eval('#modal .sc-in', el => { const b = el.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
      await p.mouse.move(box.x, box.y); await p.mouse.wheel(0, 600); await p.waitForTimeout(150);
      r.after = await p.evaluate(() => ({ inner: document.querySelector('#modal .sc-in').scrollTop, page: scrollY }));
    } finally { await ctx.close(); }
    const ok = r.sheet && r.fills && /auto|scroll/.test(r.scroller) && r.scrolls && r.rows.length >= 4 && r.rows.every(h => h >= 52) && r.after.inner > 0 && r.after.page === r.y0;
    return { ok, detail: `${r.id} at 150% text: a sheet ${r.sheet}, fills the screen ${r.fills}, scrolls itself (${r.scroller}, ${r.scrolls}); rows ${r.rows.join('/')} px; a wheel scrolls the sheet ${r.after.inner} px and the page ${r.after.page - r.y0} px` };
  },

  // axe-core on the card, choosing and after, in both themes (the dialog only: the page behind is inert)
  async scAxe(pg, errs) {
    await pg.setViewportSize({ width: 1366, height: 768 });
    await pg.evaluate(fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8'));
    await pg.evaluate(SETUP);
    const found = [];
    const scan = tag => pg.evaluate(async () => (await axe.run({ include: [['#modal']] }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } })).violations.map(v => `${v.id}(${v.nodes.length}: ${v.nodes[0].target.join(' ')})`));
    for (const theme of ['dark', 'light']) {
      const shown = await pg.evaluate(theme => {
        SCT.start({ seed: 7103, race: 'human', realm: 'POL-03', status: 'peasant', sex: 'F', startAge: 17 });
        UI.set.theme = theme; UI.applySettings();
        // an event about a person, with checks: the bust, the chips, the badges
        let q = null;
        for (let k = 0; k < 120; k++) { const h = SCT.next(); if (!h) break; const v = A.eventView(h); if (h.ctx && h.ctx.pid && v.choices.some(c => c.odds != null)) { q = h; break; } A.eventAuto(); }
        if (!q) { SCT.defs(); A.S.queue.unshift(q = { type: 'event', ev: 'sct_keys', ctx: {} }); }
        UI.render();
        return q.ev;
      }, theme);
      for (const v of await scan()) found.push(`${theme}/${shown}/choose:${v}`);
      await pg.evaluate(() => { UI.A.evChoose(SCT.pick(A.S.queue[0])); });
      for (const v of await scan()) found.push(`${theme}/result:${v}`);
    }
    for (let i = errs.length - 1; i >= 0; i--) if (/Refused to connect to 'https:\/\/fonts\.googleapis\.com/.test(errs[i])) errs.splice(i, 1);
    return { ok: !found.length, detail: `${found.length} axe violations${found.length ? ': ' + found.slice(0, 4).join('; ') : ''} (choosing and the result, dark and light)` };
  },

  // reduced motion: after a choice nothing in the card runs a transform; full motion does
  async scMotion(pg, errs, { browser, file }) {
    const run = async (reducedMotion, setting) => {
      const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion });
      const p = await ctx.newPage();
      try {
        p.on('pageerror', e => errs.push(String(e.stack || e).slice(0, 300)));
        await p.goto(pathToFileURL(file).href);
        await p.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
        const { HELPERS } = await import('../../tests/helpers.mjs');
        await p.evaluate(HELPERS); await p.evaluate(SETUP);
        return await p.evaluate(setting => {
          SCT.start({ seed: 31, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 }); SCT.defs();
          if (setting) { UI.set.motion = setting; UI.applySettings(); } else delete document.documentElement.dataset.motion;
          const moving = () => document.getAnimations().filter(a => { const t = a.effect && a.effect.target; if (!t || !t.closest || !t.closest('#modal')) return false; return a.effect.getKeyframes().some(k => k.transform && k.transform !== 'none'); }).length;
          A.S.queue = [{ type: 'event', ev: 'sct_keys', ctx: {} }]; UI.renderModal();
          const open = moving();
          UI.A.evChoose(1);
          return { open, result: moving(), motion: document.documentElement.dataset.motion || 'system' };
        }, setting);
      } finally { await ctx.close(); }
    };
    const red = await run('reduce', null), full = await run('no-preference', null);
    const out = { red, full };
    if (await pg.evaluate(() => !!UI.MOMENTS)) { out.setRed = await run('no-preference', 'reduced'); out.setFull = await run('reduce', 'full'); }
    const ok = red.open === 0 && red.result === 0 && full.open > 0 && full.result > 0 && (!out.setRed || (out.setRed.open === 0 && out.setRed.result === 0)) && (!out.setFull || out.setFull.open > 0);
    return { ok, detail: `system reduced: ${red.open} moving on opening, ${red.result} after the choice; system full: ${full.open} and ${full.result}` +
      (out.setRed ? `; Motion Reduced on a full system: ${out.setRed.open}/${out.setRed.result}; Motion Full on a reduced system: ${out.setFull.open}/${out.setFull.result}` : '') };
  },
};
