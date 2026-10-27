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
};
