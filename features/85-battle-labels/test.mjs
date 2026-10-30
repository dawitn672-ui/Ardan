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

  // cycle 2, the field in motion (n-motion.core.js): every wing shows its intent, a pulse brings clash flashes where
  // men fell, the decisive wing is named and framed by the camera (full motion only), banners sway for the pulse and
  // stop; drawing changes neither the battle nor the random stream
  async bfMotion(pg) {
    await pg.evaluate(`(${KIT})()`);
    const r = await pg.evaluate(async () => {
      TT2.life(5968, { status: 'noble', realm: 'POL-02', startAge: 25, years: 1 });
      UI.set.motion = 'full'; UI.applySettings();
      const B = TT2.battle(); A.S.queue = [{ type: 'battle', b: B }]; UI.ov = null; UI.render(); if (UI.renderModal) UI.renderModal();
      const s0 = JSON.stringify(A.S), g0 = JSON.stringify(A.rngState);
      const cv = document.getElementById('battlecv');
      UI.drawBattle(cv, B); UI.drawBattle(cv, B);
      const s1 = JSON.stringify(A.S), g1 = JSON.stringify(A.rngState);
      const deploy = { arrows: document.querySelectorAll('.bm-ov .bm-arrow').length, fresh: !!document.querySelector('.bm-ov .bm-fresh') };
      try { UI.A.bStep(); } catch (e) {}
      const cv2 = document.getElementById('battlecv');
      const pulse = { arrows: document.querySelectorAll('.bm-ov .bm-arrow').length, clash: document.querySelectorAll('.bm-ov .bm-clash').length, std: document.querySelectorAll('.bm-ov .bm-std').length,
        fresh: !!document.querySelector('.bm-ov .bm-fresh'), decisive: UI.BMOTION.last && UI.BMOTION.last.decisive, cam: !!UI.BMOTION.cams.get(cv2) };
      const sway = document.getAnimations().filter(a => a.animationName === 'bmSway').map(a => a.effect.getTiming().iterations);
      // Motion off: the same pulse draws no camera and no moving marks
      UI.set.motion = 'off'; UI.applySettings(); UI.drawBattle(cv2, B);
      const off = { cam: !!UI.BMOTION.cams.get(cv2), anims: document.getAnimations().filter(a => /^bm/.test(a.animationName || '')).length };
      UI.set.motion = 'system'; UI.applySettings();
      return { deploy, pulse, sway: [...new Set(sway)], off, pure: s0 === s1 && g0 === g1 };
    });
    const ok = r.deploy.arrows > 0 && !r.deploy.fresh && r.pulse.fresh && r.pulse.clash > 0 && r.pulse.std > 0 && !!r.pulse.decisive && r.pulse.cam && r.sway.every(n => n === 3) && !r.off.cam && r.off.anims === 0 && r.pure;
    return { ok, detail: `deployment: ${r.deploy.arrows} intent marks; after a pulse: ${r.pulse.arrows} marks, ${r.pulse.clash} clashes, ${r.pulse.std} standards (sway ${r.sway.join('/')} beats), decisive ${r.pulse.decisive}, camera ${r.pulse.cam}; Motion off: camera ${r.off.cam}, ${r.off.anims} animations; pure ${r.pure}` };
  },

  async bfYouAndSides(pg) {
    // cycle 2 (visual B5, B6): the player's company is marked on the field, the two sides use one colour code
    // (legend, bands, unit edges), the side bands are painted by UI.bfBands (so the camera can repaint them), and the
    // action row sticks to the bottom of the side column; drawing changes nothing
    const r = await pg.evaluate(() => {
      for (let seed = 9704; seed < 9712; seed++) {
        A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22 });
        const pc = A.pc(); A.startWar('POL-01', A.neighbors('POL-01')[0], null, 'conquest'); A.enlist(pc); pc.mil.rank = 4;
        let F = null;
        for (let day = 0; day < 400 && !F; day++) {
          A.advance(1); let h, k = 0; while ((h = A.headReady()) && k++ < 50) { if (h.type === 'event') A.eventAuto(); else A.S.queue.shift(); }
          const d = A.divById(pc.mil.div); if (!d) continue;
          for (const pid in A.S.fights) { const f = A.S.fights[pid]; if ((f.aIds.includes(d.id) || f.dIds.includes(d.id)) && (d.atk === +pid || d.loc === +pid)) { F = f; break; } }
        }
        if (!F || !A.CO) continue;
        A.CO.place(pc);
        A._battlePlace = F.loc; let B; try { B = A.newBattleForPC(pc, F.war, F.aIds.includes(pc.mil.div) ? F.b : F.a); } finally { A._battlePlace = null; }
        if (!B.co) continue;
        A.S.queue.unshift({ type: 'battle', b: B }); A.battleStep();
        const h0 = T.hash(A.S), rng0 = A.rngState;
        let mine = 0, bands = 0;
        const m0 = UI.bfMine, b0 = UI.bfBands;
        UI.bfMine = function (ctx, u) { if (u && u.coMine === 'me') mine++; return m0.apply(this, arguments); };
        UI.bfBands = function () { bands++; return b0.apply(this, arguments); };
        UI.screen = 'game'; UI.ov = null; UI.render();
        UI.bfMine = m0; UI.bfBands = b0;
        const html = (document.querySelector('#modal') || {}).innerHTML || '';
        const S = UI.bfSides();
        return { mine, bands, legend: /bf-key bf-us/.test(html) && /bf-key bf-them/.test(html), act: /class="row bf-act"/.test(html), sides: S.us !== S.them, pure: T.hash(A.S) === h0 && A.rngState === rng0 };
      }
      return { none: true };
    });
    if (r.none) return { ok: false, detail: 'no company battle found' };
    return { ok: r.mine >= 1 && r.bands >= 1 && r.legend && r.act && r.sides && r.pure, detail: `your company marked in ${r.mine} draw(s); side bands painted by UI.bfBands ${r.bands}; legend in the side code ${r.legend}; sticky action row ${r.act}; two distinct side colours ${r.sides}; drawing pure ${r.pure}` };
  },
};
