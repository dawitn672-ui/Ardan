// The illuminated look: woodcuts for every event shape, the Chronicle on vellum, an inked map, sound on request.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

export default {
  // every shape draws a valid picture; the same event and year draw the same picture, others differ
  async woodcutsEveryShape(pg) {
    const r = await pg.evaluate(() => {
      const W = UI.WOODCUT, bad = [], sizes = [], norm = s => s.replace(/wc\d+_/g, 'wc_');
      for (const sh of W.SHAPES) for (const mo of [0, 4, 9]) {
        const svg = W.svg(sh, 'ev_test|1105', mo);
        const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
        if (doc.querySelector('parsererror')) bad.push(sh + ' parse');
        if (norm(svg) !== norm(W.svg(sh, 'ev_test|1105', mo))) bad.push(sh + ' unstable');
        sizes.push(svg.length);
      }
      const keys = Array.from({ length: 12 }, (_, i) => 'ev_' + i + '|1105');
      const distinct = W.SHAPES.map(sh => new Set(keys.map(k => norm(W.svg(sh, k, 4)))).size);
      return { shapes: W.SHAPES.length, bad, max: Math.max(...sizes), avg: Math.round(sizes.reduce((a, x) => a + x, 0) / sizes.length), minDistinct: Math.min(...distinct), variants: distinct.reduce((a, x) => a + x, 0) };
    });
    const ok = r.shapes >= 25 && !r.bad.length && r.max < 16000 && r.minDistinct >= 6;
    return { ok, detail: `${r.shapes} scenes; ${r.variants} distinct pictures from 12 events each in May (at least ${r.minDistinct} per scene); size avg ${r.avg} B, max ${r.max} B${r.bad.length ? '; BAD ' + r.bad.join(', ') : ''}` };
  },

  // real events get a picture that fits: their own shape, or one guessed from their words; few fall back to the ornament
  async eventsGetPictures(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 611, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'M', startAge: 25 });
      const W = UI.WOODCUT, by = {}, ids = Object.keys(A.EV).filter(id => !A.EV[id].trigger);
      let own = 0, guessed = 0, none = 0, n = 0;
      for (let i = 0; i < ids.length; i += 7) {
        const e = A.EV[ids[i]], q = { type: 'event', ev: e.id, ctx: {} };
        let v; try { v = A.eventView(q); } catch (err) { continue; }
        if (v.skip) continue;
        n++;
        const sh = W.shapeOf(q, v), had = A.evShape && A.evShape(e);
        by[sh] = (by[sh] || 0) + 1;
        if (sh === 'none') none++; else if (had) own++; else guessed++;
      }
      // the modal carries the picture at its head, and a scene without one when woodcuts are off
      const q = { type: 'event', ev: ids[0], ctx: {} };
      const on = UI.eventModal(q); UI.set.woodcuts = false; const off = UI.eventModal(q); UI.set.woodcuts = true;
      return { n, own, guessed, none, shapes: !!A.evShape, top: Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 6).map(x => x.join(' ')).join(', '), on: /class="woodcut"/.test(on), off: !/class="woodcut"/.test(off) };
    });
    // without 25-variety-guard's shapes every picture is guessed from the words, and more fall back to the ornament
    const ok = r.on && r.off && r.none / r.n <= (r.shapes ? 0.12 : 0.2);
    return { ok, detail: `${r.shapes ? '' : '(no event shapes in this build) '}${r.n} events sampled: ${r.own} by their own shape, ${r.guessed} guessed from their words, ${r.none} (${Math.round(100 * r.none / r.n)}%) fall back to the ornament; most common ${r.top}; the toggle works: ${r.on && r.off}` };
  },

  // drawing the event, the Chronicle and the map changes nothing in the game and draws no random number
  async renderPure(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 612, race: 'human', realm: 'POL-03', status: 'noble', sex: 'F', startAge: 30 });
      UI.screen = 'game';
      A.S.queue = [{ type: 'event', ev: Object.keys(A.EV).find(id => A.evShape && A.evShape(A.EV[id]) === 'court' && !A.EV[id].trigger), forced: true, ctx: {} }];
      UI.render();
      const s0 = JSON.stringify(A.S), r0 = JSON.stringify(A.rngState);
      for (const t of ['book', 'world', 'life']) { UI.tab = t; UI.render(); }
      UI.render();
      return { same: JSON.stringify(A.S) === s0 && JSON.stringify(A.rngState) === r0, woodcut: !!document.querySelector('svg.woodcut'), compass: true };
    });
    return { ok: r.same && r.woodcut, detail: `state and random stream unchanged by drawing: ${r.same}; woodcut on screen: ${r.woodcut}` };
  },

  // small motion: lines written since the last drawing ink in, a new year turns in like a page, steel flashes across a
  // fight the first time it opens; none of it touches the game, and nothing moves for reduced motion (CSS)
  async motion(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 615, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22 });
      UI.screen = 'game'; UI.tab = 'life'; UI.set.hints = false; A.S.queue = []; UI.render();
      const first = document.querySelectorAll('#log .il-new').length;
      A.log('A line written for the test.'); A.log('And a second.'); UI.render();
      const two = document.querySelectorAll('#log .il-new').length;
      UI.render(); const again = document.querySelectorAll('#log .il-new').length;
      let g = 0; const y0 = A.S.year; while (A.S.year === y0 && g++ < 30) { A.advance(31); A.S.queue = []; }
      UI.render(); const turn = document.querySelectorAll('#log .il-turn').length;
      const pc = A.pc(), foe = Object.values(A.S.people).find(x => x.alive && x.id !== pc.id && A.age(x) > 18);
      A.S.queue = []; const D = A.startDuel(pc, foe, { kind: 'spar' });
      const s0 = JSON.stringify(A.S), r0 = JSON.stringify(A.rngState);
      UI.render(); const steel = document.querySelectorAll('.il-steel').length;
      UI.render(); const steel2 = document.querySelectorAll('.il-steel').length;
      return { first, two, again, turn, steel, steel2, duel: !!D, pure: JSON.stringify(A.S) === s0 && JSON.stringify(A.rngState) === r0 };
    });
    const ok = r.first === 0 && r.two === 2 && r.again === 0 && r.turn === 1 && r.steel === 1 && r.steel2 === 0 && r.pure;
    return { ok, detail: `first drawing inks nothing (${r.first}); two new lines ink in (${r.two}), then rest (${r.again}); the new year turns in (${r.turn}); steel on the duel's first drawing ${r.steel}, not the second ${r.steel2}; drawing pure ${r.pure}` };
  },

  // the settings: woodcuts, vellum and sound; sound stays silent (no audio context) until turned on
  async settingsAndSound(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 613, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
      UI.screen = 'game'; UI.overlay = { type: 'menu' }; UI.render();
      const menu = document.body.innerHTML;
      const has = ['setWoodcuts', 'setVellum', 'setSound'].every(k => menu.includes(`data-c="${k}"`));
      UI.overlay = null;
      let made = 0; const C = window.AudioContext; window.AudioContext = function () { made++; return new C(); };
      UI.set.sound = false; UI.ILLUM.play('quill');
      const silent = made === 0;
      UI.set.sound = true; UI.ILLUM.play('quill'); UI.ILLUM.play('bell');
      UI.set.sound = false; window.AudioContext = C;
      UI.set.vellum = false; UI.ILLUM.applyVellum(); const v0 = document.documentElement.dataset.vellum;
      UI.set.vellum = true; UI.ILLUM.applyVellum(); const v1 = document.documentElement.dataset.vellum;
      return { has, silent, made, v0, v1 };
    });
    const ok = r.has && r.silent && r.made === 1 && r.v0 === '0' && r.v1 === '1';
    return { ok, detail: `menu toggles ${r.has}; no audio until asked ${r.silent}, one context once asked (${r.made}); vellum off/on ${r.v0}/${r.v1}` };
  },

  // accessibility holds on the new screens: an event with its woodcut, the Chronicle on vellum, the inked map
  async illuminationAxe(pg, errs) {
    await pg.evaluate(fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8'));
    const scan = () => pg.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } })).violations.map(v => `${v.id}(${v.nodes.map(n => n.target.join(' ')).join(';')})`));
    const found = [];
    await pg.evaluate(() => { A.newGame({ seed: 614, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 22 }); UI.screen = 'game'; UI.set.hints = false; UI.tab = 'book'; UI.render(); });
    found.push(...(await scan()).map(v => 'book:' + v));
    await pg.evaluate(() => { UI.tab = 'world'; UI.render(); });
    found.push(...(await scan()).map(v => 'world:' + v));
    await pg.evaluate(() => { A.S.queue = [{ type: 'event', ev: Object.keys(A.EV).find(id => !A.EV[id].trigger), forced: true, ctx: {} }]; UI.render(); });
    found.push(...(await scan()).map(v => 'event:' + v));
    for (let i = errs.length - 1; i >= 0; i--) if (/Refused to connect to 'https:\/\/fonts\.googleapis\.com/.test(errs[i])) errs.splice(i, 1);
    return { ok: !found.length, detail: `${found.length} axe violations${found.length ? ': ' + found.slice(0, 6).join(', ') : ''} on the Chronicle on vellum, the inked map, and an event with its woodcut` };
  },
};
