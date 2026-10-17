// The inked map: draws at every zoom with the style on and off, stays pure and repeatable, keeps to its time budget,
// raises standards over armies once zoomed in, and its two settings work.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

// a world at war with the player enlisted, the full map and the war room ready to draw
const WAR = () => {
  A.newGame({ seed: 621, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22 });
  const pc = A.pc(), enemy = A.neighbors('POL-01')[0];
  A.startWar('POL-01', enemy, null, 'conquest'); A.enlist(pc); A._idIdx = null; A.advance(2); A._idIdx = null;
  A.S.queue = []; UI.screen = 'game'; UI.set.hints = false; UI.tab = 'world'; UI.worldView = 'map';
  UI.INKMAP.budgetMs = 1e9; UI.render();
  window.__T = {
    // views centred on the player's division, at zoom z (7000 / view width)
    gm(z) { const d = A.divById(A.pc().mil.div), p = A.S.prov[d.loc], w = 7000 / z; UI.gm.view = UI.wrClampView({ x0: p.sx - w / 2, y0: p.sy - w / 3.06, w, h: 0 }); UI.gmDraw(); return UI.$('#gmap'); },
    war(z) { const d = A.divById(A.pc().mil.div), p = A.S.prov[d.loc], w = 7000 / z; UI.wr.view = UI.wrClamp({ x0: p.sx - w / 2, y0: p.sy - w / 3.06, w, h: w / 1.5277 }); const c = UI.$('#warmap'); UI.drawWar(c); return c; },
    hash(c) { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 2166136261; for (let i = 0; i < d.length; i += 3) { h ^= d[i]; h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); },
    // median time of a drawn frame (the read-back forces the canvas to finish its work)
    time(fn, n = 9) { const ts = []; for (let i = 0; i < n; i++) { const t0 = performance.now(); const c = fn(); c.getContext('2d').getImageData(0, 0, 1, 1); ts.push(performance.now() - t0); } ts.sort((a, b) => a - b); return ts[n >> 1]; },
    set(on) { UI.set.inkMap = on; UI.INKMAP.reset(); },
  };
};

export default {
  // the world tab, the full map at three zooms and the war room at three zooms, with the inked map on and off
  async inkDrawsAtZooms(pg) {
    await pg.evaluate(WAR);
    const out = await pg.evaluate(() => {
      const T = window.__T, res = {}, errs = [];
      for (const on of [true, false]) {
        T.set(on); UI.ov = null; UI.render();
        const wm = UI.$('#worldmap'); MAP.draw(wm, { mode: 'political' });
        const k = on ? 'on' : 'off';
        res[k] = { ground: MAP.ground(wm.getContext('2d'), 10, 10, null), world: T.hash(wm) };
        UI.A.ov('bigmap');
        for (const z of [1, 3, 8]) { try { res[k]['gm' + z] = T.hash(T.gm(z)); } catch (e) { errs.push('gm' + z + ' ' + e.message); } }
        UI.ov = null; UI.render(); UI.warRoomOpen();
        for (const z of [1.5, 4, 9]) { try { res[k]['war' + z] = T.hash(T.war(z)); } catch (e) { errs.push('war' + z + ' ' + e.message); } }
        UI.ov = null; UI.render();
        // the sea under the inked map is ruled vellum, under the release a dark blue
        const c = UI.$('#worldmap'), g = UI.INKMAP.geo(); let sea = -1;
        for (let i = 0; i < g.grid.length && sea < 0; i += 997) if (g.grid[i] < 0 && g.toLand[i] >= 10) sea = i;
        const px = c.getContext('2d').getImageData(Math.floor((sea % g.gw) / g.gw * c.width), Math.floor(Math.floor(sea / g.gw) / g.gh * c.height), 1, 1).data;
        res[k].sea = [px[0], px[1], px[2]];
      }
      const tiles = UI.INKMAP.stats.tiles;
      T.set(true);
      return { res, errs, tiles };
    });
    const on = out.res.on, off = out.res.off, keys = ['world', 'gm1', 'gm3', 'gm8', 'war1.5', 'war4', 'war9'];
    const differ = keys.filter(k => on[k] && off[k] && on[k] !== off[k]).length;
    const ok = !out.errs.length && on.ground === true && off.ground === false && differ === keys.length && on.sea[0] > 180 && off.sea[2] > off.sea[0];
    return { ok, detail: `${keys.length} views drawn with the style on and off, ${differ} differ; sea pixel inked ${on.sea.join(',')} vs release ${off.sea.join(',')}; ${out.tiles} tiles drawn${out.errs.length ? '; ERR ' + out.errs.join('; ') : ''}` };
  },

  // drawing every map, and the redraw a late tile asks for, changes nothing in the game and draws no random number
  async inkPure(pg) {
    await pg.evaluate(WAR);
    const r = await pg.evaluate(async () => {
      // opening the war room is an engine step (A.wrOpen raises any war started since the last day's tick); take it
      // first, so what is measured is the drawing
      A.wrOpen({});
      const T = window.__T, s0 = JSON.stringify(A.S), r0 = JSON.stringify(A.rngState);
      UI.INKMAP.budgetMs = 0;                 // force tiles to come late, so the next-frame redraw runs too
      for (const on of [true, false, true]) {
        T.set(on); UI.render(); MAP.draw(UI.$('#worldmap'), { mode: 'political' });
        UI.A.ov('bigmap'); for (const z of [1, 3, 8]) T.gm(z);
        UI.ov = null; UI.render(); UI.warRoomOpen(); for (const z of [1.5, 4, 9]) T.war(z);
        await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
        UI.ov = null; UI.render();
      }
      const late = UI.INKMAP.stats.deferred;
      UI.INKMAP.budgetMs = 1e9;
      return { same: JSON.stringify(A.S) === s0, rng: JSON.stringify(A.rngState) === r0, late };
    });
    return { ok: r.same && r.rng, detail: `state unchanged ${r.same}; random stream unchanged ${r.rng}; ${r.late} tiles left for a later frame and redrawn` };
  },

  // the same world draws the same pixels: twice in a row, after the cache is thrown away, and in a fresh copy of the
  // world. (A frame drawn while the scale is still changing is laid straight on the canvas and may differ from the
  // settled frame by rounding; the test measures by how much.)
  async inkSamePixels(pg) {
    await pg.evaluate(WAR);
    const settle = () => pg.evaluate(() => {
      const T = window.__T; UI.A.ov('bigmap');
      const d0 = T.gm(3).getContext('2d').getImageData(0, 0, 1100, 720).data.slice();   // the first frame at this scale
      const a = T.hash(T.gm(3)), b = T.hash(T.gm(3));
      const d1 = UI.$('#gmap').getContext('2d').getImageData(0, 0, 1100, 720).data;
      let maxd = 0, n = 0; for (let i = 0; i < d1.length; i++) { const x = Math.abs(d1[i] - d0[i]); if (x > maxd) maxd = x; if (x > 8) n++; }
      UI.INKMAP.reset(); T.gm(3); const c = T.hash(T.gm(3));
      T.gm(8); const w1 = T.hash(T.gm(8));
      return { a, b, c, w1, maxd, share: n / d1.length };
    });
    const r = await settle();
    await pg.evaluate(WAR);
    const r2 = await settle();
    const ok = r.a === r.b && r.b === r.c && r.c === r2.c && r.w1 === r2.w1 && r.share < 0.01;
    return { ok, detail: `full map at zoom 3: ${r.a} / ${r.b} / after reset ${r.c} / fresh world ${r2.c}; zoom 8 ${r.w1} / ${r2.w1}; a frame mid-zoom differs from the settled one by at most ${r.maxd} levels, ${(100 * r.share).toFixed(2)}% of channels by more than 8` };
  },

  // a warm frame costs at most about twice the release's; a cold start (geometry and first tiles) is reported
  async inkTiming(pg) {
    await pg.evaluate(WAR);
    const r = await pg.evaluate(() => {
      const T = window.__T, t = {};
      const geo0 = performance.now(); UI.INKMAP.geo(); const geoMs = UI.INKMAP.geo().ms;
      for (const on of [false, true]) {
        T.set(on); const k = on ? 'on' : 'off'; t[k] = {};
        UI.ov = null; UI.render();
        t[k].world = T.time(() => { const c = UI.$('#worldmap'); MAP.draw(c, { mode: 'political' }); return c; });
        UI.A.ov('bigmap');
        for (const z of [1, 3, 8]) { T.gm(z); t[k]['gm' + z] = T.time(() => T.gm(z)); }
        T.gm(3); t[k].gmPan = T.time(() => { UI.gm.view.x0 += 12; UI.gmDraw(); return UI.$('#gmap'); });
        // a wheel step in, then out again: the scale changes every frame (tiles warm, the kept view laid again)
        { let i = 0; const zs = [3, 3.75]; zs.forEach(z => T.gm(z)); t[k].gmZoom = T.time(() => T.gm(zs[i++ % 2])); }
        UI.ov = null; UI.render(); UI.warRoomOpen();
        for (const z of [1.5, 4, 9]) { T.war(z); t[k]['war' + z] = T.time(() => T.war(z)); }
        T.war(4); t[k].warPan = T.time(() => { UI.wr.view.x0 += 10; const c = UI.$('#warmap'); UI.drawWar(c); return c; });
        UI.ov = null; UI.render();
      }
      const st = UI.INKMAP.stats;
      return { t, geoMs, tileMs: st.tileMs / Math.max(1, st.tiles), tiles: st.tiles };
    });
    const keys = Object.keys(r.t.on), over = keys.filter(k => r.t.on[k] > 2 * r.t.off[k] + 3);
    const sum = o => keys.reduce((a, k) => a + o[k], 0);
    const ok = over.length <= 1 && sum(r.t.on) <= 2 * sum(r.t.off) + 6;
    return { ok, detail: `warm frame ms, release -> inked: ${keys.map(k => `${k} ${r.t.off[k].toFixed(1)}->${r.t.on[k].toFixed(1)}`).join(', ')}; total ${sum(r.t.off).toFixed(1)}->${sum(r.t.on).toFixed(1)}; cold: geometry ${r.geoMs.toFixed(0)} ms once, ${r.tileMs.toFixed(1)} ms per tile (${r.tiles} tiles)${over.length ? '; over 2x: ' + over.join(',') : ''}` };
  },

  // on a world at war, zoomed in, the war room and the full map raise standards; zoomed out, or with banners off, boxes
  async inkBanners(pg) {
    await pg.evaluate(WAR);
    const r = await pg.evaluate(() => {
      const T = window.__T, IM = UI.INKMAP, std = IM.standard; let n = 0; IM.standard = function () { n++; return std.apply(this, arguments); };
      const count = f => { n = 0; f(); return n; };
      UI.warRoomOpen();
      const near = count(() => T.war(4)), deep = count(() => T.war(9)), far = count(() => T.war(1.2));
      UI.set.banners = false; const off = count(() => T.war(4)); UI.set.banners = true;
      const hits = (T.war(4), (UI.wr.hits || []).filter(h => h.t === 'stack').length);
      UI.ov = null; UI.render(); UI.A.ov('bigmap');
      const gmNear = count(() => T.gm(3)), gmFar = count(() => T.gm(1));
      IM.standard = std; UI.ov = null; UI.render();
      return { near, deep, far, off, hits, gmNear, gmFar, armies: (A.S.armies || []).length };
    });
    const ok = r.near > 0 && r.deep > 0 && r.far === 0 && r.off === 0 && r.hits === r.near && r.gmFar === 0 && (r.armies === 0 || r.gmNear > 0);
    return { ok, detail: `war room: ${r.near} standards at zoom 4 (each still a click target: ${r.hits}), ${r.deep} at zoom 9, ${r.far} at zoom 1.2, ${r.off} with banners off; full map: ${r.gmNear} at zoom 3, ${r.gmFar} at zoom 1 (${r.armies} armies)` };
  },

  // the menu carries both settings and their handlers turn the inked map and the banners off and on again
  async inkToggles(pg) {
    await pg.evaluate(WAR);
    const r = await pg.evaluate(() => {
      UI.overlay = null; UI.ov = { type: 'menu' }; UI.render();
      const m = document.querySelector('#modal') ? document.querySelector('#modal').innerHTML : document.body.innerHTML;
      const has = ['setInkMap', 'setBanners'].every(k => m.includes(`data-c="${k}"`));
      const cb = k => document.querySelector(`input[data-c="${k}"]`);
      const ink0 = cb('setInkMap') && cb('setInkMap').checked, ban0 = cb('setBanners') && cb('setBanners').checked;
      UI.C.setInkMap({ checked: false }); const offGround = MAP.ground(document.createElement('canvas').getContext('2d'), 4, 4, null);
      const offSet = UI.set.inkMap, stored = JSON.parse(UI.store.get(UI.SET_KEY) || '{}').inkMap;
      UI.C.setInkMap({ checked: true }); const onGround = MAP.ground(document.createElement('canvas').getContext('2d'), 4, 4, null);
      UI.C.setBanners({ checked: false }); const b0 = UI.set.banners; UI.C.setBanners({ checked: true });
      UI.ov = null; UI.render();
      return { has, ink0, ban0, offGround, offSet, stored, onGround, b0, b1: UI.set.banners };
    });
    const ok = r.has && r.ink0 && r.ban0 && r.offGround === false && r.offSet === false && r.stored === false && r.onGround === true && r.b0 === false && r.b1 === true;
    return { ok, detail: `menu toggles ${r.has}, on by default ${r.ink0}/${r.ban0}; inked map off -> ground declines ${r.offGround === false}, saved ${r.stored}; on again ${r.onGround}; banners off/on ${r.b0}/${r.b1}` };
  },

  // the world tab with the inked map passes axe (WCAG 2.1 AA), as does the full map
  async inkAxe(pg, errs) {
    await pg.evaluate(fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8'));
    const scan = () => pg.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } })).violations.map(v => `${v.id}(${v.nodes.map(n => n.target.join(' ')).join(';')})`));
    await pg.evaluate(WAR);
    const found = (await scan()).map(v => 'world:' + v);
    await pg.evaluate(() => { UI.A.ov('bigmap'); window.__T.gm(3); });
    found.push(...(await scan()).map(v => 'fullmap:' + v));
    for (let i = errs.length - 1; i >= 0; i--) if (/Refused to connect to 'https:\/\/fonts\.googleapis\.com/.test(errs[i])) errs.splice(i, 1);
    return { ok: !found.length, detail: `${found.length} axe violations on the world tab and the full map${found.length ? ': ' + found.slice(0, 6).join(', ') : ''}` };
  },
};
