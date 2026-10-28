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
        // the sea under the inked map is cycle 2's stepped Prussian blue (IM.SEA_STYLE; 'vellum' is the old ruled sea), under
        // the release a darker, greyer blue
        const c = UI.$('#worldmap'), g = UI.INKMAP.geo(); let sea = -1;
        for (let i = 0; i < g.grid.length && sea < 0; i += 997) if (g.grid[i] < 0 && g.toLand[i] >= 10) sea = i;
        const px = c.getContext('2d').getImageData(Math.floor((sea % g.gw) / g.gw * c.width), Math.floor(Math.floor(sea / g.gw) / g.gh * c.height), 1, 1).data;
        res[k].sea = [px[0], px[1], px[2]];
      }
      const tiles = UI.INKMAP.stats.tiles;
      T.set(true);
      return { res, errs, tiles, seaStyle: UI.INKMAP.SEA_STYLE };
    });
    const on = out.res.on, off = out.res.off, keys = ['world', 'gm1', 'gm3', 'gm8', 'war1.5', 'war4', 'war9'];
    const differ = keys.filter(k => on[k] && off[k] && on[k] !== off[k]).length;
    const ok = !out.errs.length && on.ground === true && off.ground === false && differ === keys.length && (out.seaStyle === 'vellum' ? on.sea[0] > 180 : on.sea[2] > on.sea[0] && on.sea.join() !== off.sea.join()) && off.sea[2] > off.sea[0];
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

  // brief 7.3's marks: close neighbours hatched, the selected realm's glow, the armies' next moves as arrows; pure
  async inkBriefMarks(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 621, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22 });
      const pc = A.pc(), enemy = A.neighbors('POL-01')[0];
      A.startWar('POL-01', enemy, null, 'conquest'); A.enlist(pc); A._idIdx = null; A.advance(20); A._idIdx = null;
      A.S.queue = []; UI.screen = 'game'; UI.set.hints = false; UI.tab = 'world'; UI.worldView = 'map'; UI.set.inkMap = true; UI.set.banners = true;
      const IM = UI.INKMAP; IM.budgetMs = 1e9; IM.reset(); UI.render();
      const out = {};
      IM.hatched = 0; MAP.overlay(); out.hatched = IM.hatched;
      UI.A.ov('bigmap');
      const s0 = JSON.stringify(A.S), r0 = A.rngState;
      const P = A.prov(A.realm('POL-01').capitalProv), at = z => { const w = 7000 / z; UI.gm.view = UI.wrClampView({ x0: P.sx - w / 2, y0: P.sy - w / 3, w, h: 0 }); };
      UI.mapHl = 'POL-01'; IM.glowPieces = 0; at(1.4); UI.gmDraw(); out.glow = IM.glowPieces;
      UI.mapHl = null; IM.glowPieces = 0; UI.gmDraw(); out.glowOff = IM.glowPieces;
      IM.arrows = 0; at(1); UI.gmDraw(); out.arrowsFar = IM.arrows;
      const d = A.divById(A.pc().mil.div), L = A.S.prov[d.loc]; IM.arrows = 0; const w = 7000 / 4; UI.gm.view = UI.wrClampView({ x0: L.sx - w / 2, y0: L.sy - w / 3, w, h: 0 }); UI.gmDraw(); out.arrowsNear = IM.arrows;
      out.paths = A.allDivs().filter(x => x.path && x.path.length).length;
      out.pure = JSON.stringify(A.S) === s0 && A.rngState === r0;
      UI.ov = null; UI.render();
      return out;
    });
    const ok = r.hatched > 0 && r.glow > 0 && r.glowOff === 0 && r.arrowsFar === 0 && (r.arrowsNear > 0 || r.paths === 0) && r.pure;
    return { ok, detail: `${r.hatched} realms hatched beside a neighbour of near the same colour; the selected realm's border glows in ${r.glow} pieces (${r.glowOff} with none selected); arrows for marching divisions: ${r.arrowsFar} at zoom 1, ${r.arrowsNear} at zoom 4 (${r.paths} divisions on the march); drawing ${r.pure ? 'pure' : 'CHANGED the state'}` };
  },

  // cycle 1 visual B7 and world B8: the full map's legend names the realms in view (it listed the same 40 at every
  // zoom, under the zoom buttons), sits in its own row under the map, and the wash paints each far realm in the
  // colour it is shown in elsewhere, so neighbours that shared one pink on the Twin Rivers now differ.
  async inkLegendView(pg) {
    const r = await pg.evaluate(async () => {
      A.newGame({ seed: 7101, lands: 'great', race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 20 });
      UI.screen = 'game'; A.S.queue = []; UI.set.hints = false; if (UI.INKMAP) UI.INKMAP.budgetMs = 1e9; UI.render();
      UI.ov = { type: 'bigmap' }; UI.renderModal(); UI.gmDraw && UI.gmDraw();
      const L = document.getElementById('imLegendList');
      const list = () => L ? [...L.children].map(e => e.textContent).join(',') : '';
      const a = list();
      const v = UI.gm.view; UI.gm.view = { x0: v.x0 + v.w * 0.6, y0: v.y0 + v.h * 0.3, w: v.w / 6, h: v.h / 6 }; UI.gmDraw();
      const b = list();
      const lg = document.querySelector('.greatmap .im-legend'), cv = document.querySelector('.greatmap .wr-map');
      const below = !!(lg && cv && lg.getBoundingClientRect().top >= cv.getBoundingClientRect().bottom - 1);
      // neighbouring far realms closer than 0.08 in OKLab, in the release's colours and in the map's
      const ok = h => { const v3 = [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16) / 255).map(c => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
        const l = Math.cbrt(0.4122214708 * v3[0] + 0.5363325363 * v3[1] + 0.0514459929 * v3[2]), m = Math.cbrt(0.2119034982 * v3[0] + 0.6806995451 * v3[1] + 0.1073969566 * v3[2]), q = Math.cbrt(0.0883024619 * v3[0] + 0.2817188376 * v3[1] + 0.6299787005 * v3[2]);
        return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * q, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * q, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * q]; };
      const pairs = new Set();
      for (const p of A.S.prov) for (const j of p.adj || []) { const q = A.S.prov[j]; if (!q || !p.owner || !q.owner || p.owner === q.owner) continue; pairs.add(p.owner < q.owner ? p.owner + '|' + q.owner : q.owner + '|' + p.owner); }
      let near0 = 0, near1 = 0;
      for (const k of pairs) {
        const [x, y] = k.split('|').map(id => A.S.realms[id]); if (!x || !y) continue;
        const d = (h1, h2) => { if (!/^#[0-9a-f]{6}$/i.test(h1 || '') || !/^#[0-9a-f]{6}$/i.test(h2 || '')) return 1; const p1 = ok(h1), p2 = ok(h2); return Math.hypot(p1[0] - p2[0], p1[1] - p2[1], p1[2] - p2[2]); };
        const far = !(LORE.realms[x.id] && LORE.realms[y.id] && /^POL-(0\d|1\d|2\d|3[0-5])$/.test(x.id) && /^POL-(0\d|1\d|2\d|3[0-5])$/.test(y.id));
        if (!far) continue;
        if (d(x.color, y.color) < 0.08) near0++;
        if (d(MAP.realmColor(x), MAP.realmColor(y)) < 0.08) near1++;
      }
      const kw = Object.values(A.S.realms).filter(x => /^POL-(0\d|1\d|2\d|3[0-4])$/.test(x.id)).every(x => MAP.realmColor(x) === x.color);
      return { a: a.split(',').length, b: b.split(',').length, differ: a !== b, below, pairs: pairs.size, near0, near1, kw };
    });
    const ok = r.differ && r.a >= 10 && r.b >= 3 && r.below && r.near1 === 0 && r.kw;
    return { ok, detail: `legend: ${r.a} realms at the whole view, ${r.b} zoomed in (differ ${r.differ}), under the map ${r.below}; far neighbours within 0.08 in OKLab: ${r.near0} in the stored colours, ${r.near1} on the map (of ${r.pairs} borders; the Known World's near pairs are hatched); Known World colours kept ${r.kw}` };
  },

  // cycle 2 (lane G, styling): the sea is a Prussian-blue bokashi, light at the coast and deep offshore; the realm
  // under the pointer is outlined in gold, and the hint lives in UI state only
  async inkSeaHover(pg) {
    await pg.evaluate(WAR);
    const r = await pg.evaluate(() => {
      UI.A.ov('bigmap');
      const cv = document.getElementById('gmap'); if (!cv) return { none: true };
      UI.gmDraw();
      const ctx = cv.getContext('2d');
      // the ground itself, the whole world on a canvas of its own (the atlas's fog, 9991, lies over the live map)
      const oc = document.createElement('canvas'); oc.width = 400; oc.height = 260; MAP.ground(oc.getContext('2d'), 400, 260, null);
      const d = oc.getContext('2d').getImageData(0, 0, 400, 260).data;
      let blue = 0, n = 0, light = 0;
      for (let i = 0; i < d.length; i += 4 * 7) { n++; const R = d[i], G = d[i + 1], B = d[i + 2]; if (B > R + 30 && B > G) { blue++; if (B > 150) light++; } }
      const s0 = JSON.stringify(A.S), g0 = JSON.stringify(A.rngState);
      const rid = Object.values(A.S.realms).find(x => x.alive && x.id !== UI.mapHl).id;
      UI.mapHov = rid;
      const lines = UI.INKMAP.hoverLine(ctx, cv.width, cv.height, UI.gm.view);
      UI.mapHov = null; UI.gmDraw();
      return { blue: blue / n, light: light / Math.max(1, blue), lines, pure: s0 === JSON.stringify(A.S) && g0 === JSON.stringify(A.rngState) };
    });
    const ok = !r.none && r.blue > 0.15 && r.light > 0.01 && r.lines > 0 && r.pure;
    return { ok, detail: r.none ? 'no map' : `sea share ${(r.blue * 100).toFixed(0)}% of the map, ${(r.light * 100).toFixed(0)}% of it the light coastal steps; hover outline ${r.lines} border pieces; pure ${r.pure}` };
  },
};
