// 96-moments: cut-ins for the big moments, at most one a month, skippable, honouring reduced motion; the Motion setting.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);

const SETUP = () => {
  window.MOT = {
    start(o, motion = 'off') {
      T.enter(o || { seed: 31, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 24 });
      UI.set.hints = false; UI.set.cutins = true; UI.set.motion = motion; UI.applySettings();
      A.S.queue = []; UI.MOMENTS.skip(); UI.render();
    },
    shown() { const el = document.getElementById('mo-cut'); return el ? (el.querySelector('.mo-word') || {}).textContent : null; },
    moving(sel) {
      return document.getAnimations().filter(a => { const t = a.effect && a.effect.target; return t && t.closest && t.closest(sel) && a.effect.getKeyframes().some(k => k.transform && k.transform !== 'none'); }).length;
    },
    anims(sel) { return document.getAnimations().filter(a => { const t = a.effect && a.effect.target; return t && t.closest && t.closest(sel); }).length; },
  };
};
const open = async (browser, file, errs, opts = {}) => {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, ...opts });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(String(e.stack || e).slice(0, 300)));
  await p.goto(pathToFileURL(file).href);
  await p.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
  const { HELPERS } = await import('../../tests/helpers.mjs');
  await p.evaluate(HELPERS); await p.evaluate(SETUP);
  return { ctx, p };
};

export default {
  // three moments in one month show one cut-in, the most important; a fourth in the same month waits for nothing; the
  // next month shows the next; a click skips; a key skips and does not reach the scene under it; and over three years
  // of a real life drawn month by month, no two cut-ins share a month
  async moOnePerMonth(pg) {
    await pg.setViewportSize({ width: 1366, height: 768 });
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const out = {};
      MOT.start();
      const MO = UI.MOMENTS, pc = A.pc();
      const s = A.makeAcquaintance(pc, 'friend'); A.link(pc, s, 'spouse', 40, 'spouse'); pc.spouse = s.id; s.spouse = pc.id;
      const kid = A.newPerson({ parents: [pc.id, s.id], race: pc.race, cult: pc.cult, realm: pc.realm, home: pc.home, born: A.S.year, given: 'Edric', sex: 'M' });
      pc.children.push(kid.id); s.children.push(kid.id);
      pc.epithet = 'the Patient';
      UI.refresh();
      out.first = MOT.shown(); out.log1 = JSON.parse(JSON.stringify(MO.log[MO.log.length - 1]));
      // the same month: a death among your kin, the weightiest moment there is, still waits for the next month
      const f = A.P(pc.parents[0]); if (f) { f.alive = false; f.died = A.S.year; }
      UI.refresh();
      out.same = MOT.shown(); out.log2 = JSON.parse(JSON.stringify(MO.log[MO.log.length - 1]));
      document.getElementById('mo-cut').dispatchEvent(new MouseEvent('click', { bubbles: true }));
      out.clicked = MOT.shown();
      // the next month
      const k0 = A.S.year * 12 + A.monthOf(A.today()).m;
      for (let g = 0; g < 60 && A.S.year * 12 + A.monthOf(A.today()).m === k0; g++) { A.advance(31); A.S.queue = []; }
      UI.refresh(); UI.MOMENTS.skip();   // whatever the month brought by itself
      pc.epithet = 'the Grim';
      UI.refresh();
      out.next = MOT.shown();
      return out;
    });
    // a key skips it, and is spent on the skip: the scene under it is not chosen
    await pg.evaluate(() => { A.defEvents([{ id: 'mot_door', title: 'A door', cond: () => false, w: 0, text: 'A door in the wall.', choices: [{ t: 'Open it', r: 'It opens.' }, { t: 'Leave it', r: 'You leave it.' }] }]);
      A.S.queue.unshift({ type: 'event', ev: 'mot_door', ctx: {} }); UI.renderModal(); if (!document.getElementById('mo-cut')) UI.MOMENTS.show({ k: 'named', word: 'Named', sub: 'They call you the Grim', who: A.S.pc }); });
    const before = await pg.evaluate(() => !!document.getElementById('mo-cut'));
    await pg.keyboard.press('1');
    const key = await pg.evaluate(() => ({ cut: !!document.getElementById('mo-cut'), chosen: !!(A.S.queue[0] && A.S.queue[0].result) }));
    // three years of a life, drawn after every month
    const life = await pg.evaluate(() => {
      MOT.start({ seed: 909, race: 'human', realm: 'POL-03', status: 'peasant', sex: 'F', startAge: 19 });
      const MO = UI.MOMENTS; MO.log.length = 0;
      const end = A.S.year + 3;
      for (let g = 0; g < 200 && A.S.year < end && A.pc().alive; g++) {
        A.advance(31);
        for (let k = 0; k < 40; k++) { const h = A.headReady(); if (!h) break; if (h.type === 'event') A.eventAuto(); else if (A.skipPrompt) A.skipPrompt(); else A.S.queue.shift(); }
        UI.refresh(); MO.skip();
      }
      const shown = MO.log.filter(x => x.shown), keys = shown.map(x => x.key);
      return { n: shown.length, months: new Set(keys).size, kinds: shown.map(x => x.shown).join(','), years: shown.filter(x => x.shown === 'year').length };
    });
    const ok = r.first === 'Wedded' && r.log1.passed.includes('birth') && r.log1.passed.includes('named') && r.same === 'Wedded' && r.log2.shown === null && r.log2.passed.includes('death') &&
      r.clicked === null && r.next === 'Named' && before && !key.cut && !key.chosen && life.n === life.months && life.years >= 3;
    return { ok, detail: `a marriage, a birth and an epithet in one month: "${r.first}" shown, passed over ${r.log1.passed.join(', ')}; a death the same month: still "${r.same}", passed over ${r.log2.passed.join(', ')}; ` +
      `a click skips (${r.clicked === null}); next month "${r.next}"; a key skips it (${!key.cut}) without choosing the scene under it (${!key.chosen}); ` +
      `three years drawn month by month: ${life.n} cut-ins in ${life.months} months (${life.kinds})` };
  },

  // reduced motion: a still banner that fades (no transform anywhere in it) and goes after about 1.5 s; full: the band
  // moves and it is gone by 1.2 s; off: no animation at all; the Motion setting in the menu, saved, on <html>
  async moMotion(pg, errs, { browser, file }) {
    const res = {};
    for (const [name, reducedMotion, motion] of [['system-reduce', 'reduce', 'system'], ['system-full', 'no-preference', 'system'], ['set-reduced', 'no-preference', 'reduced'], ['set-full', 'reduce', 'full'], ['set-off', 'no-preference', 'off']]) {
      const { ctx, p } = await open(browser, file, errs, { reducedMotion });
      try {
        res[name] = await p.evaluate(async motion => {
          MOT.start(undefined, motion);
          UI.MOMENTS.show({ k: 'promoted', word: 'Promoted', sub: 'File-Leader', who: A.S.pc });
          const el = document.getElementById('mo-cut');
          const o = { cls: el.className, moving: MOT.moving('#mo-cut'), anims: MOT.anims('#mo-cut'), attr: document.documentElement.dataset.motion || 'none' };
          await new Promise(r => setTimeout(r, 1320));
          o.at1320 = !!document.getElementById('mo-cut');
          await new Promise(r => setTimeout(r, 600));
          o.at1920 = !!document.getElementById('mo-cut');
          return o;
        }, motion);
      } finally { await ctx.close(); }
    }
    // the menu
    await pg.evaluate(SETUP);
    const menu = await pg.evaluate(() => { MOT.start(undefined, 'system'); UI.ov = { type: 'menu' }; UI.render(); const s = document.querySelector('#modal select[data-c="setMotion"]'); return s ? [...s.options].map(o => o.value).join(',') : null; });
    await pg.selectOption('#modal select[data-c="setMotion"]', 'reduced');
    const saved = await pg.evaluate(() => ({ set: UI.set.motion, attr: document.documentElement.dataset.motion, stored: (() => { try { return JSON.parse(UI.store.get(UI.SET_KEY)).motion; } catch (e) { return null; } })(), cut: !!document.querySelector('#modal input[data-c="setCutins"]') }));
    await pg.evaluate(() => { UI.ov = null; UI.render(); });
    const R = res;
    const ok = /mo-reduced/.test(R['system-reduce'].cls) && R['system-reduce'].moving === 0 && R['system-reduce'].at1320 && !R['system-reduce'].at1920 &&
      /mo-full/.test(R['system-full'].cls) && R['system-full'].moving > 0 && !R['system-full'].at1320 &&
      /mo-reduced/.test(R['set-reduced'].cls) && R['set-reduced'].moving === 0 && R['set-reduced'].attr === 'reduced' &&
      /mo-full/.test(R['set-full'].cls) && R['set-full'].moving > 0 &&
      /mo-off/.test(R['set-off'].cls) && R['set-off'].anims === 0 && R['set-off'].at1320 && !R['set-off'].at1920 &&
      menu === 'system,full,reduced,off' && saved.set === 'reduced' && saved.attr === 'reduced' && saved.stored === 'reduced' && saved.cut;
    return { ok, detail: Object.entries(R).map(([k, o]) => `${k}: ${o.cls.replace('mo-cut ', '')}, ${o.moving} moving, ${o.anims} animations, there at 1.32 s ${o.at1320}, at 1.92 s ${o.at1920}`).join('; ') +
      `; menu ${menu}; set Reduced: saved ${saved.stored}, <html data-motion="${saved.attr}">` };
  },

  // drawing and reading the moments never touch the world: a life drawn every step with cut-ins on reaches the same
  // world and random stream as the same life never drawn
  async moPure(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const run = look => {
        MOT.start({ seed: 777, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 18 });
        T.play(5, { each: () => { if (look) { UI.refresh(); UI.MOMENTS.skip(); } } });
        return T.hash(A.S.people) + ':' + T.hash(A.S.realms) + ':' + A.rngState;
      };
      const a = run(false), b = run(true);
      return { a, b, shown: UI.MOMENTS.log.filter(x => x.shown).length };
    });
    return { ok: r.a === r.b, detail: r.a === r.b ? `same world with and without the moments drawn (${r.shown} cut-ins shown on the way)` : `worlds differ (${r.a} vs ${r.b})` };
  },

  // axe-core on a cut-in, still and moving, in both themes
  async moAxe(pg, errs) {
    await pg.evaluate(fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8'));
    await pg.evaluate(SETUP);
    const found = [];
    for (const theme of ['dark', 'light']) for (const motion of ['off', 'full']) {
      await pg.evaluate(([theme, motion]) => { MOT.start(undefined, motion); UI.set.theme = theme; UI.applySettings(); UI.MOMENTS.TIME[motion] = 60000; UI.MOMENTS.show({ k: 'wedded', word: 'Wedded', sub: 'to Maud of Kingsmere', who: A.S.pc }); }, [theme, motion]);
      await pg.waitForTimeout(500);
      const v = await pg.evaluate(async () => (await axe.run({ include: [['#mo-cut']] }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } })).violations.map(v => `${v.id}(${v.nodes.length})`));
      for (const x of v) found.push(`${theme}/${motion}:${x}`);
      await pg.evaluate(() => { UI.MOMENTS.TIME = { full: 1200, reduced: 1740, off: 1500 }; UI.MOMENTS.skip(); });
    }
    for (let i = errs.length - 1; i >= 0; i--) if (/Refused to connect to 'https:\/\/fonts\.googleapis\.com/.test(errs[i])) errs.splice(i, 1);
    return { ok: !found.length, detail: `${found.length} axe violations on a cut-in${found.length ? ': ' + found.join(', ') : ''} (dark and light, still and moving)` };
  },
  // toasts (§5.10): three in a row stack, newest on top and in #toast (the live region), at most three; each wears its
  // kind (a refusal danger, a gain ok); a fourth drops the oldest; hovering pauses; nothing touches the game
  async toastStack(pg) {
    const r = await pg.evaluate(async () => {
      T.enter({ seed: 9601, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
      const h0 = T.hash(A.S), g0 = JSON.stringify(A.S.rng);
      UI.toast('You buy a spear for 3 suns.');
      UI.toast('Not enough coin for a horse.');
      UI.toast('You gain 2 renown.');
      const t = document.getElementById('toast'), st = document.getElementById('toast-stack');
      const one = { text: t.textContent, kind: t.dataset.kind, live: t.getAttribute('aria-live'), old: [...st.children].map(e => e.dataset.kind + ':' + e.textContent), hidden: st.getAttribute('aria-hidden') };
      const tb = t.getBoundingClientRect(), sb = st.getBoundingClientRect();
      one.above = tb.bottom <= sb.top + 1;
      UI.toast('The road is long.');
      one.four = st.children.length + 1;
      one.fourOld = [...st.children].map(e => e.textContent);
      // a pause while the pointer is on it
      t.dispatchEvent(new MouseEvent('mouseenter'));
      await new Promise(res => setTimeout(res, 4300));
      one.held = +getComputedStyle(t).opacity > 0.5;
      t.dispatchEvent(new MouseEvent('mouseleave'));
      await new Promise(res => setTimeout(res, 1800));
      one.gone = +t.style.opacity === 0;
      one.pure = T.hash(A.S) === h0 && JSON.stringify(A.S.rng) === g0;
      return one;
    });
    const ok = r.text === 'You gain 2 renown.' && r.kind === 'ok' && r.live === 'polite' && r.old.length === 2 && /^danger:Not enough/.test(r.old[0]) && /^accent:You buy/.test(r.old[1]) && r.hidden === 'true' &&
      r.above && r.four === 3 && !r.fourOld.some(x => /spear/.test(x)) && r.held && r.gone && r.pure;
    return { ok, detail: `newest "${r.text}" (${r.kind}, aria-live ${r.live}) above ${r.old.length} older [${r.old.join(' | ')}] ${r.above}; a fourth keeps ${r.four} (oldest dropped ${!r.fourOld.some(x => /spear/.test(x))}); held on hover ${r.held}, gone after ${r.gone}; pure ${r.pure}` };
  },

  // cycle 1 visual I5, I6 and I3: a duel opens on a VS cut-in with both busts, your own death on a muted FAREWELL, and
  // a battle lost on DEFEAT. The openings are not held to one a month.
  async moOpenings(pg) {
    const r = await pg.evaluate(async () => {
      const MO = UI.MOMENTS;
      T.enter({ seed: 9601, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22 }); UI.set.cutins = true; UI.set.hints = false; MO.skip(); UI.render(); MO.skip();
      const pc = A.pc(), foe = A.makeFoe({ realm: pc.realm, tier: 2 }); foe.npcTemp = false; A.S.people[foe.id] = foe; A.S.queue = [];
      MO.lastKey = A.S.year * 12 + A.monthOf(A.today()).m;   // a cut-in already shown this month
      A.startDuel(pc, foe, { kind: 'duel', lethal: false, toYield: true }); UI.render();
      const duel = MO.el ? { k: MO.shown.k, busts: MO.el.querySelectorAll('.mo-bust').length, sub: MO.shown.sub } : null;
      MO.skip(); UI.render(); const again = !!MO.el;      // once for each duel
      A.S.queue = []; UI.render(); MO.skip();
      const rs = Object.values(A.S.realms).filter(x => x.alive && x.id !== pc.realm);
      const B = A.newBattle({ title: 'Battle of the Test Ford', terr: 'hills', weather: 'clear', sideA: { realm: pc.realm, men: 3000, q: 0.9 }, sideB: { realm: rs[0].id, men: 3000, q: 0.9 } });
      A.S.queue = [{ type: 'battle', b: B }]; B.phase = 'end'; B.winner = B.pcSide === 'A' ? 'B' : 'A'; MO.lastKey = null; MO.check();
      const lost = MO.el ? MO.shown.k : null;
      MO.skip(); A.S.queue = []; MO.prev = null; UI.render(); MO.skip();
      MO.lastKey = A.S.year * 12 + A.monthOf(A.today()).m;
      A.pcDeath('a fever'); UI.render();
      const gone = MO.el ? MO.shown.k : null;
      MO.skip();
      return { duel, again, lost, gone };
    });
    const ok = r.duel && r.duel.k === 'duel' && r.duel.busts === 2 && / · /.test(r.duel.sub) && !r.again && r.lost === 'defeat' && r.gone === 'farewell';
    return { ok, detail: JSON.stringify(r) };
  },

  // cycle 2, the motion system (motion.core.js): a tab change slides the panel in and its sections in sequence; a stat
  // that changes tweens its bar and counts its number while the text holds the real value at once; a toast slides in;
  // a map zoom asked for by the player eases while the view is set at once, and a view set by code is drawn at once.
  // Reduced: no transform runs and nothing lasts over 120 ms; Off: nothing of ours animates. Pure throughout.
  async motionSystem(pg, errs, { browser, file }) {
    const MINE = /^(mo[A-Z]|sc[A-Z]|tl[A-Z]|bm[A-Z])/;
    const run = async (opts, motion) => {
      const { ctx, p } = await open(browser, file, errs, opts);
      const r = await p.evaluate(async ([motion, MINE]) => {
        const rx = new RegExp(MINE);
        MOT.start(null, motion);
        const mine = () => document.getAnimations().filter(a => rx.test(a.animationName || ''));
        const moving = () => mine().filter(a => a.effect && a.effect.getKeyframes().some(k => k.transform && k.transform !== 'none')).length;
        const longest = () => Math.max(0, ...mine().map(a => { const t = a.effect.getTiming(); return (+t.duration || 0) + (+t.delay || 0); }));
        let h0 = T.hash(A.S), rng0 = JSON.stringify(A.rngState);
        UI.A.group('people');
        const pure1 = T.hash(A.S) === h0 && JSON.stringify(A.rngState) === rng0;
        const tab = { cls: document.getElementById('tabbody').className, n: mine().length, moving: moving(), longest: longest(), seq: document.querySelectorAll('.mo-rise').length };
        UI.A.group('life');
        for (const a of document.getAnimations()) a.finish();
        const pc = A.pc(), st0 = (document.querySelector('#profile .lk-stats .barrow .val') || {}).textContent;
        pc.coin = (+pc.coin || 0) + 41; pc.happy = Math.max(1, (pc.happy || 50) - 20);
        h0 = T.hash(A.S);
        UI.refresh();
        const cnt = [...document.querySelectorAll('.mo-cnt')].map(e => ({ text: e.textContent.trim(), from: e.style.getPropertyValue('--mo-n0') }));
        const coinText = (document.querySelector('#topbar .top-coin > b') || {}).textContent;
        const tw = document.querySelectorAll('.bar > i.mo-tw').length;
        const num = { cnt, coinText, tw, moving: moving(), longest: longest() };
        UI.toast('You gained 2 suns');
        await Promise.resolve();
        const toast = { anim: mine().filter(a => a.animationName === 'moToast').length };
        // the map: a view set by code is drawn at once; a zoom the player asked for eases, and the view is set at once
        UI.ov = { type: 'bigmap' }; UI.renderModal();
        let map = null;
        if (UI.gmDraw && UI.gm) {
          UI.gmDraw();
          const V = UI.MOTION.views.gm;
          UI.gm.view = Object.assign({}, UI.gm.view, { w: UI.gm.view.w / 1.5, h: UI.gm.view.h / 1.5 }); UI.gmDraw();
          const byCode = !!(V && V.anim);
          V.user = performance.now();
          const want = { w: UI.gm.view.w / 1.25 };
          UI.gm.view = Object.assign({}, UI.gm.view, { w: UI.gm.view.w / 1.25, h: UI.gm.view.h / 1.25 }); UI.gmDraw();
          map = { byCode, asked: !!V.anim, viewSet: Math.abs(UI.gm.view.w - want.w) < 1e-6 };
        }
        UI.ov = null; UI.renderModal();
        return { tab, num, toast, map, pure: pure1 && T.hash(A.S) === h0 && JSON.stringify(A.rngState) === rng0, st0 };
      }, [motion, MINE.source]);
      await ctx.close();
      return r;
    };
    const full = await run({}, 'system');
    const red = await run({ reducedMotion: 'reduce' }, 'system');
    const off = await run({}, 'off');
    const okFull = full.tab.cls.includes('mo-tabin') && full.tab.moving > 0 && full.tab.seq > 0 && full.num.cnt.some(c => /suns/.test(c.text) && c.from !== '') && /suns/.test(full.num.coinText || '') &&
      full.num.cnt.every(c => c.text.length > 0) && full.toast.anim === 1 && (!full.map || (!full.map.byCode && full.map.asked && full.map.viewSet));
    const okRed = red.tab.moving === 0 && red.tab.longest <= 120 && red.num.cnt.length === 0 && red.num.moving === 0 && (!red.map || !red.map.asked);
    const okOff = off.tab.n === 0 && off.num.cnt.length === 0 && off.toast.anim === 0;
    const ok = okFull && okRed && okOff && full.pure && red.pure && off.pure;
    const d = (k, r) => `${k}: tab ${r.tab.n} anims (${r.tab.moving} moving, longest ${Math.round(r.tab.longest)} ms, ${r.tab.seq} in sequence), counting ${r.num.cnt.map(c => c.from + '->' + c.text).join(', ') || 'none'}, bars tweening ${r.num.tw}, toast ${r.toast.anim}` +
      (r.map ? `, map by code eased ${r.map.byCode}, asked eased ${r.map.asked}, view set at once ${r.map.viewSet}` : '') + `, pure ${r.pure}`;
    return { ok, detail: [d('full', full), d('reduced', red), d('off', off)].join(' | ') };
  },

  // cycle 2 (visual B2): an eased zoom of the full map no longer redraws the map each frame: the tween scales the last
  // picture (drawImage), and the map is drawn for real after it (62 may lay late tiles with more draws); a tween frame
  // costs a copy, not a redraw
  async mapEaseCheap(pg) {
    await pg.setViewportSize({ width: 1366, height: 768 });
    const r = await pg.evaluate(async () => {
      T.enter({ seed: 777, race: 'human', realm: 'POL-02', status: 'noble', sex: 'F', startAge: 24, lands: 'great' });
      UI.set.motion = 'full'; UI.applySettings(); A.S.queue = [];
      UI.ov = { type: 'bigmap' }; UI.renderModal();
      if (!UI.gm || !document.getElementById('gmap')) return { none: true };
      UI.gmDraw();
      const S = UI.MOTION.mapStats, V = UI.MOTION.views.gm;
      const t0 = performance.now(); UI.gmDraw(); const realMs = performance.now() - t0;
      const before = { real: S.real, frames: S.frames, tweens: S.tweens };
      V.user = performance.now();
      UI.gm.view = Object.assign({}, UI.gm.view, { w: UI.gm.view.w / 1.25, h: UI.gm.view.h / 1.25 });
      const t1 = performance.now(); UI.gmDraw(); const startMs = performance.now() - t1;
      const during = { real: S.real - before.real };
      await new Promise(res => setTimeout(res, 1500));
      const after = { real: S.real - before.real, frames: S.frames - before.frames, tweens: S.tweens - before.tweens };
      UI.ov = null; UI.renderModal();
      return { realMs, startMs, during, after };
    });
    const ok = r.none || (r.during.real === 0 && r.after.tweens >= 1 && r.after.real >= 1 && r.after.frames >= 1 && r.startMs < Math.max(30, r.realMs / 2));
    return { ok, detail: r.none ? 'no full map' : `a real draw ${r.realMs.toFixed(1)} ms; the tween's first frame ${r.startMs.toFixed(1)} ms; real draws during the tween ${r.during.real}, after it ${r.after.real}; tweens ${r.after.tweens}, tween frames ${r.after.frames}` };
  },
};
