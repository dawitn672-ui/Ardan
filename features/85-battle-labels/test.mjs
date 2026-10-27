// A crowded battle, drawn in each of its three views: no two unit labels overlap, and drawing changes nothing.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
// the tooltip suite's battle kit (59-tooltips) builds a 3,000-a-side battle with a crowded centre
const src = fs.readFileSync(path.join(here, '../59-tooltips/test.mjs'), 'utf8');
const KIT = src.slice(src.indexOf('const KIT2 = () => {') + 'const KIT2 = '.length, src.indexOf('\nconst PCT')).trim().replace(/;$/, '');

export default {
  async blNoOverlap(pg) {
    await pg.evaluate(`(${KIT})()`);
    const r = await pg.evaluate(() => {
      TT2.life(5967, { status: 'noble', realm: 'POL-02', startAge: 25, years: 1 });
      const B = TT2.battle(); A.S.queue = [{ type: 'battle', b: B }]; UI.ov = null; UI.render(); if (UI.renderModal) UI.renderModal();
      const s0 = JSON.stringify(A.S), g0 = JSON.stringify(A.rngState), out = [];
      const views = [...document.querySelectorAll('[data-a="bView"]')].map(b => b.getAttribute('data-v'));
      for (const v of views.length ? views : ['']) {
        const btn = document.querySelector(`[data-a="bView"][data-v="${v}"]`); if (btn) btn.click();
        const cv = [...document.querySelectorAll('canvas')].find(c => c.getContext('2d').__lb);
        const ctx = cv && cv.getContext('2d'), bx = (ctx && ctx.__lb) || [];
        let over = 0;
        for (let i = 0; i < bx.length; i++) for (let j = i + 1; j < bx.length; j++) { const a = bx[i], b = bx[j]; if (a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1) over++; }
        out.push({ v, n: bx.length, over, short: ((ctx && ctx.__lbText) || []).filter(t => /^[\d.]+k?$/.test(t)).length });
      }
      return { out, same: JSON.stringify(A.S) === s0, rng: JSON.stringify(A.rngState) === g0 };
    });
    const ok = r.out.length >= 1 && r.out.every(o => o.n >= 4 && o.over === 0) && r.same && r.rng;
    return { ok, detail: r.out.map(o => `view ${o.v || '?'}: ${o.n} labels, ${o.over} overlapping, ${o.short} shortened to a count`).join('; ') + `; state unchanged ${r.same}, random stream unchanged ${r.rng}` };
  },

  // cycle 1 visual I3: with the colour prints on, the field is a woodblock print (sky band, ridges, ground) and the
  // units are banner masses; the field shows counts only and each unit's full name is kept for hover; with the prints
  // off the release's field is drawn. Drawing changes nothing.
  async bfPrint(pg) {
    await pg.evaluate(`(${KIT})()`);
    const r = await pg.evaluate(() => {
      TT2.life(5967, { status: 'noble', realm: 'POL-02', startAge: 25, years: 1 });
      const B = TT2.battle(); A.S.queue = [{ type: 'battle', b: B }]; UI.ov = null; UI.render(); if (UI.renderModal) UI.renderModal();
      const s0 = JSON.stringify(A.S), g0 = JSON.stringify(A.rngState);
      const cv = document.getElementById('battlecv'), ctx = cv && cv.getContext('2d');
      const on = UI.bfGroundOn, labels = ((ctx && ctx.__lbText) || []).slice(), hov = ((cv && cv.__bfHov) || []).map(h => h.t);
      // the sky band's top pixel is the hour's sky, not the release's olive
      const px = ctx ? [...ctx.getImageData(cv.width / 2, 30, 1, 1).data].slice(0, 3) : null;
      UI.set.skies = false; UI.renderModal();
      const off = UI.bfGroundOn;
      UI.set.skies = true; UI.renderModal();
      return { on, off, labels: labels.length, counts: labels.filter(t => /^[\d.]+k?$/.test(t)).length, named: hov.filter(t => /[A-Za-z]/.test(t)).length, px, same: JSON.stringify(A.S) === s0, rng: JSON.stringify(A.rngState) === g0 };
    });
    const ok = r.on && !r.off && r.labels >= 4 && r.counts === r.labels && r.named >= 4 && r.same && r.rng;
    return { ok, detail: `print on ${r.on} (off with the prints off: ${!r.off}); ${r.counts} of ${r.labels} field labels are counts, ${r.named} full names kept for hover; sky pixel ${r.px}; state unchanged ${r.same}, random stream unchanged ${r.rng}` };
  },
};
