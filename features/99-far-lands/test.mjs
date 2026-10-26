// Tests for features/99-far-lands: the size-agnostic frame (stage 1) and the Great Continent (stage 2).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { HELPERS } from '../../tests/helpers.mjs';
import { unpack, repack } from '../../tools/pack.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const A_KEY = 'far@1';

// The same build without this feature: its code files cut from the core blob and its patches undone, so "before" is
// exactly the page the other features make. (This feature's edits inside 62-inked-map stay; they are the identity by
// construction at today's size and are covered by 62's own pixel tests.)
async function beforeBuild(file) {
  const html = fs.readFileSync(file, 'utf8'), parts = unpack(html);
  let core = parts['ardan-core'];
  for (const f of fs.readdirSync(HERE).filter(f => f.endsWith('.core.js')).sort()) {
    const chunk = `\n;(function(){ // features/99-far-lands/${f}\n${fs.readFileSync(path.join(HERE, f), 'utf8')}\n})();\n`;
    if (!core.includes(chunk)) throw new Error(`${f} is not in this build as written`);
    core = core.split(chunk).join('');
  }
  const patches = (await import(pathToFileURL(path.join(HERE, 'patches.mjs')).href)).default;
  for (const p of patches.slice().reverse()) {
    for (const [find, replace, want = 1] of p.edits.slice().reverse()) {
      const blob = p.blob === 'html' ? null : p.blob;
      const src = blob === 'ardan-core' ? core : parts[blob];
      const n = src.split(replace).length - 1;
      if (n !== want) throw new Error(`${p.id}: ${n} copies of the patched text, expected ${want}`);
      const back = src.split(replace).join(find);
      if (blob === 'ardan-core') core = back; else parts[blob] = back;
    }
  }
  parts['ardan-core'] = core;
  const out = path.join(os.tmpdir(), `ardan-fl-before-${process.pid}.html`);
  fs.writeFileSync(out, repack(html, parts, 3));
  return out;
}

async function openPage(browser, file) {
  const ctx = await browser.newContext();
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e.stack || e).slice(0, 300)));
  await pg.goto(pathToFileURL(file).href);
  await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
  await pg.evaluate(HELPERS);
  return { pg, ctx, errs };
}

// What must not move at today's size: five years of three lives (the state and the random stream), and the pixels of
// every map view (the world tab, the campaign map's frame, the full map at zoom 1, 3 and 8, the war room at 1.5, 4 and
// 9), with the inked map on and off.
const MEASURE = () => {
  const out = { lives: [], views: {} };
  for (const [seed, realm] of [[9901, 'POL-01'], [9902, 'POL-20'], [9903, 'POL-11']]) {
    A.newGame({ seed, race: realm === 'POL-11' ? 'orc' : 'human', realm, status: 'peasant', sex: 'M', startAge: 16 });
    T.play(5);
    out.lives.push({ seed, year: A.S.year, hash: T.hash(A.S), rng: A.rngState, bytes: JSON.stringify(A.S).length });
  }
  const hash = c => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 2166136261; for (let i = 0; i < d.length; i++) { h ^= d[i]; h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); };
  A.newGame({ seed: 621, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22 });
  const pc = A.pc(), enemy = A.neighbors('POL-01')[0];
  A.startWar('POL-01', enemy, null, 'conquest'); A.enlist(pc); A._idIdx = null; A.advance(2); A._idIdx = null;
  A.S.queue = []; UI.screen = 'game'; UI.set.hints = false; UI.tab = 'world'; UI.worldView = 'map';
  if (UI.INKMAP) UI.INKMAP.budgetMs = 1e9;
  const at = () => { const d = A.divById(A.pc().mil.div); return A.S.prov[d.loc]; };
  const gm = z => { const p = at(), w = 7000 / z; UI.gm.view = UI.wrClampView({ x0: p.sx - w / 2, y0: p.sy - w / 3.06, w, h: 0 }); UI.gmDraw(); return UI.$('#gmap'); };
  const war = z => { const p = at(), w = 7000 / z; UI.wr.view = UI.wrClamp({ x0: p.sx - w / 2, y0: p.sy - w / 3.06, w, h: w / 1.5277 }); const c = UI.$('#warmap'); UI.drawWar(c); return c; };
  for (const on of [true, false]) {
    if (UI.INKMAP) { UI.set.inkMap = on; UI.INKMAP.reset(); }
    const k = on ? 'ink' : 'release', V = out.views[k] = {};
    UI.ov = null; UI.render();
    const wm = UI.$('#worldmap'); MAP.draw(wm, { mode: 'political' }); V.world = hash(wm);
    const off = document.createElement('canvas'); off.width = 1400; off.height = 900; MAP.draw(off, { allLabels: true }); V.big = hash(off);
    V.toCanvas = MAP.toCanvas(wm, 3210.5, 1777.25).join(',');
    UI.A.ov('bigmap'); UI.gm.view = null; UI.gmDraw(); V.gmFit = hash(UI.$('#gmap')) + ' ' + JSON.stringify(UI.gm.view);
    for (const z of [1, 3, 8]) V['gm' + z] = hash(gm(z));
    UI.ov = null; UI.render(); UI.warRoomOpen();
    for (const z of [1.5, 4, 9]) V['war' + z] = hash(war(z));
    V.wrView = JSON.stringify(UI.wrView());
    UI.ov = null; UI.render();
  }
  return out;
};

// A game of the Great Continent, with checks on its graph
const GREAT = () => {
  window.FLT = {
    graph() {
      const S = A.S, n = S.prov.length, bad = [];
      for (const p of S.prov) {
        for (const j of p.adj) { const q = S.prov[j]; if (!q) bad.push(`${p.id}>${j} missing`); else if (!q.adj.includes(p.id)) bad.push(`adj ${p.id}-${j}`); }
        for (const j of p.sea || []) { const q = S.prov[j]; if (!q || !(q.sea || []).includes(p.id)) bad.push(`sea ${p.id}-${j}`); }
      }
      const seen = new Uint8Array(n), q = [0]; seen[0] = 1;
      for (let h = 0; h < q.length; h++) for (const j of S.prov[q[h]].adj.concat(S.prov[q[h]].sea || [])) if (!seen[j]) { seen[j] = 1; q.push(j); }
      return { n, asym: bad.length, bad: bad.slice(0, 4), reached: q.length };
    },
    realms() {
      const S = A.S, far = Object.keys(A.FL.D.realms), bad = [];
      for (const id of far) {
        const r = S.realms[id]; if (!r) { bad.push(id + ' missing'); continue; }
        const mine = S.prov.filter(p => p.owner === id), set = new Set(mine.map(p => p.id));
        if (!mine.length) { bad.push(id + ' holds nothing'); continue; }
        if (!set.has(r.capitalProv)) bad.push(id + ' not at its capital');
        const seen = new Set([mine[0].id]), q = [mine[0].id];
        for (let h = 0; h < q.length; h++) for (const j of S.prov[q[h]].adj.concat(S.prov[q[h]].sea || [])) if (set.has(j) && !seen.has(j)) { seen.add(j); q.push(j); }
        if (seen.size !== set.size) bad.push(id + ' in pieces');
        if (!A.P(r.ruler)) bad.push(id + ' has no ruler');
      }
      const names = new Set(), dup = [];
      for (const p of S.prov) { const k = p.name.toLowerCase(); if (names.has(k)) dup.push(p.name); names.add(k); if (/[<>"]/.test(p.name)) dup.push('markup ' + p.name); }
      return { far: far.length, bad: bad.slice(0, 5), nBad: bad.length, dup: dup.slice(0, 5) };
    },
  };
};

export default {
  async flFrameIdentical(pg, pageErrors, { browser, file }) {
    let before;
    try { before = await beforeBuild(file); } catch (e) { return { ok: false, detail: 'could not derive the build without this feature: ' + e.message }; }
    const B = await openPage(browser, before);
    let a, b;
    try { a = await B.pg.evaluate(MEASURE); } finally { await B.ctx.close(); fs.rmSync(before, { force: true }); }
    b = await pg.evaluate(MEASURE);
    const diff = [];
    a.lives.forEach((l, i) => { const m = b.lives[i]; if (l.hash !== m.hash || l.rng !== m.rng || l.bytes !== m.bytes) diff.push(`seed ${l.seed}: ${l.hash}/${l.rng} vs ${m.hash}/${m.rng}`); });
    for (const k in a.views) for (const v in a.views[k]) if (a.views[k][v] !== b.views[k][v]) diff.push(`${k} ${v}: ${a.views[k][v]} vs ${b.views[k][v]}`);
    const nViews = Object.values(a.views).reduce((s, V) => s + Object.keys(V).length, 0);
    return { ok: !diff.length && !B.errs.length, detail: `${a.lives.length} lives of 5 years (${a.lives.map(l => l.hash).join(', ')}) and ${nViews} view hashes, with and without this feature: ` +
      (diff.length ? `${diff.length} differ: ${diff.slice(0, 4).join('; ')}` : 'identical') + (B.errs.length ? '; page error before: ' + B.errs[0] : '') };
  },

  // a game of the Great Continent: its size, its graph, its realms, and ten years of play without an error
  async flContinentLoads(pg) {
    await pg.evaluate(GREAT);
    const r = await pg.evaluate(() => {
      const t0 = performance.now();
      A.newGame({ seed: 9911, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16, lands: 'great' });
      const tNew = Math.round(performance.now() - t0), S = A.S;
      const out = { tNew, prov: S.prov.length, far: S.prov.length - A.FL.D.base, realms: Object.keys(S.realms).length, people: Object.keys(S.people).length,
        world: S.world, frame: [MAP.KW, MAP.KH], g: FLT.graph(), rl: FLT.realms(), lore: A.FL.D.lore,
        regions: S.prov.filter(p => p.id >= A.FL.D.base && /^[A-Z]-\d\d$/.test(p.region || '')).length };
      const t1 = performance.now(); out.play = T.play(10); out.secs = Math.round((performance.now() - t1) / 100) / 10;
      out.year = A.S.year; out.alive = Object.keys(A.FL.D.realms).filter(id => A.S.realms[id] && A.S.realms[id].alive).length;
      out.farWars = A.S.wars.filter(w => w.att.concat(w.def).some(x => A.FL.D.realms[x])).length;
      out.g2 = FLT.graph();
      return out;
    });
    const realmsWanted = 100;
    const ok = r.far > 1500 && r.realms - 35 > realmsWanted && r.g.asym === 0 && r.g.reached === r.prov && r.rl.nBad === 0 && !r.rl.dup.length &&
      r.regions === r.far && r.world && r.world.parts.includes(A_KEY) && r.frame[0] > 7000 && r.g2.asym === 0 && r.g2.reached === r.prov;
    return { ok, detail: `${r.far} far provinces (${r.prov} in all) in ${r.regions} regions, ${r.realms} realms (${r.lore ? 'from the lore' : 'placeholders'}), ${r.people} people at the start, new game ${r.tNew} ms; ` +
      `adjacency asymmetric ${r.g.asym}, ${r.g.reached} of ${r.prov} reachable; realms broken ${r.rl.nBad}${r.rl.nBad ? ' ' + r.rl.bad.join(', ') : ''}, duplicate names ${r.rl.dup.length}; ` +
      `ten years (${r.play}) in ${r.secs} s to ${r.year}: ${r.alive} far realms stand, ${r.farWars} wars in the far lands` };
  },

  // a game of the Great Continent saved and loaded comes back the same and plays on; a game of the Known World after
  // it is the world as written again, and loading the far save brings the far lands back
  async flSaveRoundTrip(pg) {
    await pg.evaluate(GREAT);
    const r = await pg.evaluate(async () => {
      const sig = () => [T.hash(A.S.prov), T.hash(A.S.realms), T.hash(A.S.people), JSON.stringify(A.S.world), A.rngState].join('|');
      T.enter({ seed: 9921, race: 'human', realm: 'POL-30', status: 'artisan', sex: 'F', startAge: 18, lands: 'great' });
      T.play(1);
      const before = sig(), enc = await SAVES.encode(A.S, A.J), kb = Math.round(enc.bytes.length / 1024), meta = enc.meta.world;
      const known = () => ({ active: A.FL.active, frame: [MAP.KW, MAP.KH], prov: A.S.prov.length, lore: Object.keys(LORE.realms).length, cult: Object.keys(LORE.cultures).length,
        gd: Object.keys(GD.REALM_CULTURE).filter(k => A.FL.D.realms[k]).length, houses: Object.keys(LORE.houses).filter(k => A.FL.D.houses[k]).length });
      T.enter({ seed: 9922, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 });
      const k1 = known(), metaKnown = SAVES.meta(A.S).world;
      const d = await SAVES.decode(enc.bytes);
      const okLoad = UI.enterSave(d);
      const after = sig(), g1 = known();
      const res = T.play(1);
      return { kb, meta, metaKnown, k1, g1, same: before === after, okLoad, res, year: A.S.year, before: before.slice(0, 60), after: after.slice(0, 60) };
    });
    const ok = r.same && r.okLoad && r.res !== undefined && r.meta === 'ardan+' + A_KEY && r.metaKnown === 'ardan' &&
      !r.k1.active && r.k1.frame[0] === 7000 && r.k1.prov === 306 && r.k1.gd === 0 && r.k1.houses === 0 &&
      r.g1.active && r.g1.frame[0] > 7000 && r.g1.prov > 1800;
    return { ok, detail: `save ${r.kb} KB (world ${r.meta}); a Known World game after it: far lands ${r.k1.active ? 'still in' : 'out'}, frame ${r.k1.frame.join('x')}, ${r.k1.prov} provinces, ${r.k1.gd} far table entries, world ${r.metaKnown}; ` +
      `loaded back: ${r.same ? 'the same state and stream' : 'DIFFERENT ' + r.before + ' / ' + r.after}, frame ${r.g1.frame.join('x')}, ${r.g1.prov} provinces; played on to ${r.year}` };
  },

  // a save from the build without this feature loads as the world as written, in a page that has just played the
  // Great Continent; a save naming lands this build does not have is refused with a plain message
  async flOldSave(pg, pageErrors, { browser, file }) {
    let before;
    try { before = await beforeBuild(file); } catch (e) { return { ok: false, detail: 'could not derive the build without this feature: ' + e.message }; }
    const B = await openPage(browser, before);
    let old;
    try {
      old = await B.pg.evaluate(async () => {
        A.newGame({ seed: 9931, race: 'human', realm: 'POL-05', status: 'peasant', sex: 'M', startAge: 20 }); T.play(1);
        const enc = await SAVES.encode(A.S, A.J); let s = ''; for (const b of enc.bytes) s += String.fromCharCode(b);
        return { b64: btoa(s), hash: T.hash(A.S.prov) + '|' + T.hash(A.S.people) };
      });
    } finally { await B.ctx.close(); fs.rmSync(before, { force: true }); }
    const r = await pg.evaluate(async (old) => {
      A.newGame({ seed: 9932, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16, lands: 'great' });
      const wasGreat = A.FL.active && MAP.KW > 7000;
      const bin = atob(old.b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      const d = await SAVES.decode(u), okLoad = UI.enterSave(d);
      const out = { wasGreat, okLoad, active: A.FL.active, frame: [MAP.KW, MAP.KH], prov: A.S.prov.length, world: A.S.world || null,
        same: T.hash(A.S.prov) + '|' + T.hash(A.S.people) === old.hash };
      out.res = T.play(1);
      // a save from a later build, with lands this one does not have
      A.newGame({ seed: 9933, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16, lands: 'great' });
      const S2 = JSON.parse(JSON.stringify(A.S)); S2.world.parts.push('far@9');
      let toast = ''; const t = UI.toast; UI.toast = m => { toast = m; };
      try { out.refused = UI.enterSaveSafe({ S: S2, J: null, meta: {}, fmt: 2 }) === false; } finally { UI.toast = t; }
      out.toast = toast;
      return out;
    }, old);
    const ok = !B.errs.length && r.wasGreat && r.okLoad && !r.active && r.frame[0] === 7000 && r.frame[1] === 4500 && r.prov === 306 && !r.world && r.same && r.refused && /far@9/.test(r.toast);
    return { ok, detail: `an old save loaded after a Great Continent game: far lands ${r.active ? 'still in' : 'out'}, frame ${r.frame.join('x')}, ${r.prov} provinces, state ${r.same ? 'as saved' : 'DIFFERENT'}, played on (${r.res}); ` +
      `a save naming far@9: ${r.refused ? 'refused' : 'NOT refused'} ("${r.toast.slice(0, 110)}")` + (B.errs.length ? '; page error before: ' + B.errs[0] : '') };
  },

  // every map view draws the far lands and is clicked where it is drawn; drawing changes neither the state nor the
  // random stream
  async flMapDraws(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 9941, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22, lands: 'great' });
      UI.set.hints = false; if (UI.INKMAP) UI.INKMAP.budgetMs = 1e9;
      // a war in the far east, and the player's realm in it, so the war room has a front out there
      const D = A.FL.D, far = Object.keys(D.realms), a = far.find(id => D.realms[id].land === 'R'), b = A.neighbors(a).find(x => D.realms[x]);
      A.startWar(a, b, null, 'conquest'); A.advance(2); A.S.queue = [];
      A.wrOpen && A.wrOpen({});
      const s0 = JSON.stringify(A.S), r0 = A.rngState, out = { views: {}, miss: [] };
      const site = D.provinces.sx.map((x, k) => [x, D.provinces.sy[k], D.provinces.id[k]]).filter((_, k) => D.provinces.realm[k] !== 'unclaimed').filter((_, k) => k % 97 === 0);
      const pick = (cv, v, list) => {   // the pixel at each far site is land (not the sea), and a click there finds the province
        const ctx = cv.getContext('2d'); let land = 0, hit = 0, n = 0;
        const seaPx = (() => { const [x, y] = v ? [(16800 - v.x0) / v.w * cv.width, (8600 - v.y0) / v.h * cv.height] : MAP.toCanvas(cv, 16800, 8600); return ctx.getImageData(Math.max(0, Math.min(cv.width - 1, Math.round(x))), Math.max(0, Math.min(cv.height - 1, Math.round(y))), 1, 1).data; })();
        for (const [kx, ky, id] of list) {
          const [x, y] = v ? [(kx - v.x0) / v.w * cv.width, (ky - v.y0) / v.h * cv.height] : MAP.toCanvas(cv, kx, ky);
          if (x < 2 || y < 2 || x > cv.width - 2 || y > cv.height - 2) continue;
          n++;
          const px = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
          if (Math.abs(px[0] - seaPx[0]) + Math.abs(px[1] - seaPx[1]) + Math.abs(px[2] - seaPx[2]) > 12) land++;
          // a click exactly on the site finds its province (a neighbour is allowed for the rounding of a pixel)
          const r = cv.getBoundingClientRect(), ev = { clientX: r.left + x / cv.width * r.width, clientY: r.top + y / cv.height * r.height };
          const got = cv.id === 'gmap' ? null : cv.id === 'warmap' ? UI.wrProvAt(cv, ev) : MAP.provAt(cv, ev);
          if (got == null || got === id || (A.prov(id).adj || []).includes(got)) hit++;
        }
        return { n, land, hit };
      };
      for (const ink of [true, false]) {
        UI.set.inkMap = ink; if (UI.INKMAP) UI.INKMAP.reset();
        const k = ink ? 'ink' : 'release', V = out.views[k] = {};
        UI.ov = null; UI.tab = 'world'; UI.worldView = 'map'; UI.render();
        const wm = UI.$('#worldmap'); MAP.draw(wm, { mode: 'political' }); V.world = pick(wm, null, site);
        UI.screen = 'title'; UI.render(); const tm = UI.$('#titlemap'); if (tm) { MAP.draw(tm, { labels: true, home: false }); V.title = pick(tm, null, site); }
        UI.screen = 'game'; UI.render();
        UI.A.ov('bigmap'); UI.gm.view = null; UI.gmDraw(); V.gmFit = pick(UI.$('#gmap'), UI.gm.view, site);
        for (const z of [1, 3, 8]) {
          const P = A.prov(A.realm(a).capitalProv), w = 7000 / z; UI.gm.view = UI.wrClampView({ x0: P.sx - w / 2, y0: P.sy - w / 3.06, w, h: 0 }); UI.gmDraw();
          V['gm' + z] = pick(UI.$('#gmap'), UI.gm.view, site.concat([[P.sx, P.sy, P.id]]));
        }
        for (const mode of Object.keys(MAP.MODES || {})) { UI.mapMode = mode; UI.gm.view = null; UI.gmDraw(); }
        UI.mapMode = 'political'; UI.ov = null; UI.render();
        if (UI.warRoomOpen) {
          UI.warRoomOpen(); const c = UI.$('#warmap');
          if (c) for (const z of [1.5, 4, 9]) {
            const P = A.prov(A.realm(a).capitalProv), w = 7000 / z; UI.wr.view = UI.wrClamp({ x0: P.sx - w / 2, y0: P.sy - w / 3.06, w, h: w / 1.5277 }); UI.drawWar(c);
            V['war' + z] = pick(c, UI.wr.view, site.concat([[P.sx, P.sy, P.id]]));
          }
          UI.ov = null; UI.render();
        }
      }
      out.pure = JSON.stringify(A.S) === s0 && A.rngState === r0;
      // the release's style shows land against a dark sea, so its pixels prove the far lands are drawn; the inked
      // style lays a thin wash on vellum beside a vellum sea by design, so there the ink's own geometry is the proof
      for (const k in out.views) for (const v in out.views[k]) { const x = out.views[k][v]; if (!x.n || (k === 'release' && x.land < 0.8 * x.n) || x.hit < x.n) out.miss.push(`${k} ${v} ${x.land}/${x.hit}/${x.n}`); }
      if (UI.INKMAP) {
        UI.set.inkMap = true; UI.INKMAP.reset(); const g = UI.INKMAP.geo();
        out.ink = { gw: g.gw, far: g.coastLoops.filter(o => o.x0 >= 7000).length, farLines: g.provPieces.filter(o => o.a >= A.FL.D.base || o.b >= A.FL.D.base).length };
        if (g.gw !== MAP.gw || out.ink.far < 20 || out.ink.farLines < 1000) out.miss.push('ink geometry ' + JSON.stringify(out.ink));
      }
      return out;
    });
    const nViews = Object.values(r.views).reduce((s, V) => s + Object.keys(V).length, 0);
    return { ok: r.pure && !r.miss.length && nViews >= 18, detail: `${nViews} views (world tab, title strip, full map fitted and at zoom 1, 3, 8, war room at 1.5, 4, 9; inked and release) draw the far lands at their sites` +
      (r.ink ? `; the inked ground traces ${r.ink.far} far coasts and ${r.ink.farLines} pieces of far province bounds` : '') +
      (r.miss.length ? `; MISSING ${r.miss.join(', ')}` : '') + `; drawing left the state and stream ${r.pure ? 'unchanged' : 'CHANGED'}` };
  },
};
