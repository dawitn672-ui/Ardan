// Tap targets (I1-2): at 375 x 667, on the title, the thirteen pages of a noble's life and an event card, every control's hit
// area (its box joined with an absolutely positioned ::before/::after hit box) is at least 44 x 44. No exceptions (the skills rows
// were an exception until S1b's skills page landed).
// The same measurement as docs/research/ios/tap-probe.mjs.
import { HELPERS } from '../../../tests/helpers.mjs';
import { PERSONAS, PAGES, START, SETTLE } from '../../../tools/lib/clutter.mjs';

const PROBE = () => {
  const W = innerWidth, H = innerHeight, bad = [];
  const vis = el => { const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; const cs = getComputedStyle(el); return cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const hit = el => {
    const r = el.getBoundingClientRect(); let l = r.left, t = r.top, rt = r.right, bt = r.bottom;
    for (const ps of ['::before', '::after']) {
      const c = getComputedStyle(el, ps); if (c.content === 'none' || c.position !== 'absolute') continue;
      const w = parseFloat(c.width), h = parseFloat(c.height), x = parseFloat(c.left), y = parseFloat(c.top); if (!(w > 0 && h > 0) || isNaN(x) || isNaN(y)) continue;
      const pl = r.left + x, pt = r.top + y; l = Math.min(l, pl); t = Math.min(t, pt); rt = Math.max(rt, pl + w); bt = Math.max(bt, pt + h);
    }
    return { w: rt - l, h: bt - t };
  };
  let n = 0;
  for (const el of document.querySelectorAll('button, a[href], [data-a], input, select, summary, [role=button], [role=tab], [data-note]')) {
    if (el.disabled || !vis(el)) continue;
    n++; const h = hit(el);
    if (h.w < 43.5 || h.h < 43.5) bad.push((el.id ? '#' + el.id : el.tagName.toLowerCase()) + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/)[0] : '') + ' ' + Math.round(h.w) + 'x' + Math.round(h.h));
  }
  return { n, bad, hscroll: Math.max(0, document.documentElement.scrollWidth - W) };
};

export default {
  async tapTargets44(pg, errs, { browser, file }) {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const bad = []; let total = 0;
    try {
      const p = await ctx.newPage();
      p.on('pageerror', e => errs.push(String(e.message || e)));
      await p.goto('file://' + file);
      await p.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 180000 });
      await p.evaluate(HELPERS);
      let r = await p.evaluate(PROBE); total += r.n; for (const b of r.bad) bad.push('title ' + b);
      await p.evaluate(START(PERSONAS.noble.o, false));
      for (const [nm, tab, extra] of PAGES) {
        await p.evaluate(`(() => { UI.ov = null; A.S.queue = []; UI.tab = ${JSON.stringify(tab)}; ${extra} UI.render(); window.scrollTo(0, 0); })()`);
        await p.evaluate(SETTLE);
        r = await p.evaluate(PROBE); total += r.n;
        for (const b of r.bad) bad.push(nm + ' ' + b);
        if (r.hscroll) bad.push(nm + ' scrolls sideways ' + r.hscroll);
      }
      // the skills sheet and the person view (S1b, R2): after the pages, as overlays
      for (const [nm, js] of [['skills', `UI.ov = { type: 'profs' };`], ['met', `{ const pc = A.pc(); UI.ov = { type: 'person', id: (pc.rel && Object.keys(pc.rel)[0]) || pc.father || pc.mother }; }`]]) {
        await p.evaluate(`(() => { A.S.queue = []; ${js} UI.render(); UI.renderModal && UI.renderModal(); window.scrollTo(0, 0); })()`);
        await p.evaluate(SETTLE);
        r = await p.evaluate(PROBE); total += r.n;
        for (const b of r.bad) bad.push(nm + ' ' + b);
      }
    } finally { await ctx.close(); }
    return { ok: !bad.length && total > 250, detail: `${total} controls on the title and 13 pages at 375 x 667: ${bad.length ? bad.length + ' under 44 x 44 (' + bad.slice(0, 6).join('; ') + ')' : 'none under 44 x 44, none scrolls sideways'}` };
  },
};
