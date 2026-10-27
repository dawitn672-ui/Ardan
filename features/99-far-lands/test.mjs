// Tests for features/99-far-lands: the size-agnostic frame (stage 1) and the Great Continent (stage 2).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { HELPERS } from '../../tests/helpers.mjs';
import { unpack, repack } from '../../tools/pack.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const A_KEY = 'far@2';
import { execFileSync } from 'node:child_process';
const ROOT = path.join(HERE, '../..');
// the commit that shipped far@1 (Oct 26): its data makes a real far@1 save for flFar1Save
const FAR1_COMMIT = '1c17403';

// The same build without this feature: its code files cut from the core blob and its patches undone, so "before" is
// exactly the page the other features make. (This feature's edits inside 62-inked-map stay; they are the identity by
// construction at today's size and are covered by 62's own pixel tests.)
async function beforeBuild(file) {
  const html = fs.readFileSync(file, 'utf8'), parts = unpack(html);
  // this feature's code files are appended to the core blob as ";(function(){ // features/99-far-lands/<file>" chunks
  // (tools/build.mjs); each runs to the next feature's chunk or to the end of the blob
  let core = parts['ardan-core'];
  const MARK = '\n;(function(){ // features/', mine = MARK + '99-far-lands/';
  for (let at = core.indexOf(mine); at >= 0; at = core.indexOf(mine)) {
    const next = core.indexOf(MARK, at + 1);
    core = core.slice(0, at) + (next >= 0 ? core.slice(next) : '');
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

// the same build with far@1's data in place of this feature's own: it writes saves of far@1
function far1Build(file) {
  let old;
  try { old = execFileSync('git', ['show', `${FAR1_COMMIT}:features/99-far-lands/b-data.core.js`], { cwd: ROOT, maxBuffer: 1 << 26 }).toString(); } catch (e) { return null; }
  const html = fs.readFileSync(file, 'utf8'), parts = unpack(html);
  let core = parts['ardan-core'];
  const a = core.indexOf('A.FL_DATA = {'), b = core.indexOf('};\n', a);
  const o1 = old.indexOf('A.FL_DATA = {'), o2 = old.indexOf('};\n', o1);
  if (a < 0 || b < 0 || o1 < 0 || o2 < 0) return null;
  parts['ardan-core'] = core.slice(0, a) + old.slice(o1, o2) + core.slice(b);
  const out = path.join(os.tmpdir(), `ardan-fl-far1-${process.pid}.html`);
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
      const S = A.S, far = Object.keys(A.FAR.D.realms), bad = [];
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
      const out = { tNew, prov: S.prov.length, far: S.prov.length - A.FAR.D.base, realms: Object.keys(S.realms).length, people: Object.keys(S.people).length,
        world: S.world, frame: [MAP.KW, MAP.KH], g: FLT.graph(), rl: FLT.realms(), lore: A.FAR.D.lore,
        regions: S.prov.filter(p => p.id >= A.FAR.D.base && /^[A-Z]-\d\d$/.test(p.region || '')).length };
      const t1 = performance.now(); out.play = T.play(10); out.secs = Math.round((performance.now() - t1) / 100) / 10;
      out.year = A.S.year; out.alive = Object.keys(A.FAR.D.realms).filter(id => A.S.realms[id] && A.S.realms[id].alive).length;
      out.farWars = A.S.wars.filter(w => w.att.concat(w.def).some(x => A.FAR.D.realms[x])).length;
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
      const known = () => ({ active: A.FAR.active, frame: [MAP.KW, MAP.KH], prov: A.S.prov.length, lore: Object.keys(LORE.realms).length, cult: Object.keys(LORE.cultures).length,
        gd: Object.keys(GD.REALM_CULTURE).filter(k => A.FAR.D.realms[k]).length, houses: Object.keys(LORE.houses).filter(k => A.FAR.D.houses[k]).length });
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
      const wasGreat = A.FAR.active && MAP.KW > 7000;
      const bin = atob(old.b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      const d = await SAVES.decode(u), okLoad = UI.enterSave(d);
      const out = { wasGreat, okLoad, active: A.FAR.active, frame: [MAP.KW, MAP.KH], prov: A.S.prov.length, world: A.S.world || null,
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
      const D = A.FAR.D, far = Object.keys(D.realms), a = far.find(id => D.realms[id].land === 'R'), b = A.neighbors(a).find(x => D.realms[x]);
      A.startWar(a, b, null, 'conquest'); A.advance(2); A.S.queue = [];
      A.wrOpen && A.wrOpen({});
      const s0 = JSON.stringify(A.S), r0 = A.rngState, out = { views: {}, miss: [] };
      const site = D.provinces.sx.map((x, k) => [x, D.provinces.sy[k], D.provinces.id[k]]).filter((_, k) => D.provinces.realm[k] !== 'unclaimed').filter((_, k) => k % 97 === 0);
      const pick = (cv, v, list) => {   // the pixel at each far site is land (not the sea), and a click there finds the province
        const ctx = cv.getContext('2d'); let land = 0, hit = 0, n = 0;
        // the sea's colour: the release's relief (and MAP.relief past it) paints open sea rgb(36, 57, 74)
        const seaPx = [36, 57, 74];
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
        out.ink = { gw: g.gw, far: g.coastLoops.filter(o => o.x0 >= 7000).length, farLines: g.provPieces.filter(o => o.a >= A.FAR.D.base || o.b >= A.FAR.D.base).length };
        if (g.gw !== MAP.gw || out.ink.far < 20 || out.ink.farLines < 1000) out.miss.push('ink geometry ' + JSON.stringify(out.ink));
      }
      return out;
    });
    const nViews = Object.values(r.views).reduce((s, V) => s + Object.keys(V).length, 0);
    return { ok: r.pure && !r.miss.length && nViews >= 18, detail: `${nViews} views (world tab, title strip, full map fitted and at zoom 1, 3, 8, war room at 1.5, 4, 9; inked and release) draw the far lands at their sites` +
      (r.ink ? `; the inked ground traces ${r.ink.far} far coasts and ${r.ink.farLines} pieces of far province bounds` : '') +
      (r.miss.length ? `; MISSING ${r.miss.join(', ')}` : '') + `; drawing left the state and stream ${r.pure ? 'unchanged' : 'CHANGED'}` };
  },

  // menu games start on the Great Continent; the Known World only is the other choice; code keeps the Known World
  async flMenuDefault(pg) {
    const r = await pg.evaluate(() => {
      UI.set.hints = false;
      const out = {};
      A.newGame({ seed: 9951, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 });
      out.code = { active: A.FAR.active, prov: A.S.prov.length, world: A.S.world || null };
      UI.A.newLife();
      out.menu = { lands: UI.cr.lands, active: A.FAR.active, realms: Object.keys(LORE.realms).length };
      // the field, and the realm list grouped by land
      let html = '';
      for (let s = 0; s < 8 && !html.includes('fl-lands'); s++) { UI.step = s; UI.render(); html = document.getElementById('app').innerHTML; }
      const f = document.querySelector('.fl-lands');
      out.field = f ? { cards: f.querySelectorAll('.opt').length, sel: (f.querySelector('.opt.sel .t') || {}).textContent || '' } : null;
      const findRealm = () => { for (let s = 0; s < 8; s++) { UI.step = s; UI.render(); const el = document.querySelector('[data-c="crRealm"]'); if (el) return el; } return null; };
      let sel = findRealm();
      out.groups = sel ? [...sel.querySelectorAll('optgroup')].map(g => g.label + ' ' + g.children.length) : [];
      out.options = sel ? sel.querySelectorAll('option').length : 0;
      // Randomize keeps the lands; the Known World only is a click away and lists no groups
      UI.crRandomize(); out.randomized = UI.cr.lands;
      UI.A.crSet('lands:known'); out.known = { lands: UI.cr.lands, active: A.FAR.active, realms: Object.keys(LORE.realms).length };
      sel = findRealm(); out.knownGroups = sel ? sel.querySelectorAll('optgroup').length : -1;
      UI.crRandomize(); out.randomizedKnown = UI.cr.lands;
      UI._newLifeOk = true; UI.startLife(); UI._newLifeOk = false;
      out.knownStart = { world: A.S.world || null, prov: A.S.prov.length };
      // Random life (the title's quick start) is on the Great Continent
      UI.screen = 'title'; UI.render();
      UI._newLifeOk = true; UI.A.randomLife(); UI._newLifeOk = false;
      out.quick = { world: A.S.world && A.S.world.parts.join('+'), prov: A.S.prov.length };
      return out;
    });
    const ok = !r.code.active && r.code.prov === 306 && !r.code.world && r.menu.lands === 'great' && r.menu.active && r.menu.realms > 140 &&
      r.field && r.field.cards === 2 && /Great Continent/.test(r.field.sel) && r.groups.length >= 10 && r.randomized === 'great' &&
      r.known.lands === 'known' && !r.known.active && r.knownGroups === 0 && r.randomizedKnown === 'known' && !r.knownStart.world && r.knownStart.prov === 306 &&
      r.quick.world === 'ardan+' + A_KEY && r.quick.prov > 1800;
    return { ok, detail: `A.newGame by code: ${r.code.active ? 'FAR LANDS' : 'the Known World'} (${r.code.prov} provinces); New life: lands ${r.menu.lands}, ${r.menu.realms} realms, the field's ${r.field ? r.field.cards : 0} cards with "${r.field && r.field.sel}" chosen; ` +
      `birthplaces in ${r.groups.length} groups (${r.groups.slice(0, 4).join(', ')}...), ${r.options} realms; Randomize keeps ${r.randomized}; the Known World only: ${r.known.realms} realms, ${r.knownGroups} groups, Randomize keeps ${r.randomizedKnown}, a life there has ${r.knownStart.prov} provinces; Random life: ${r.quick.world}, ${r.quick.prov} provinces` };
  },

  // far@2's land: each land's area against the lore's, and each realm's holdings region by region against the
  // lore's holds_km2, measured from a new game's provinces
  async flAreasQuotas(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 9961, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16, lands: 'great' });
      const D = A.FAR.D, S = A.S, land = {}, held = {};
      for (const p of S.prov) { if (p.id < D.base) continue; const L = p.region[0]; land[L] = (land[L] || 0) + p.cells * 100; (held[p.owner] = held[p.owner] || {})[p.region] = (held[p.owner][p.region] || 0) + p.cells * 100; }
      const lands = Object.keys(D.lands).sort().map(L => ({ L, name: D.lands[L].name, got: land[L] || 0, lore: D.lands[L].lore || 0 }));
      let want = 0, off = 0, n = 0, within = 0;
      for (const id in D.realms) { const H = D.realms[id].holds; if (!H) continue; const G = held[id] || {}; for (const g of new Set(Object.keys(H).concat(Object.keys(G)))) { const h = H[g] || 0, x = G[g] || 0; want += h; off += Math.abs(x - h); n++; if (Math.abs(x - h) <= Math.max(0.25 * h, 20000)) within++; } }
      return { lands, total: lands.reduce((s, x) => s + x.got, 0), lore: lands.reduce((s, x) => s + x.lore, 0), want, off, n, within, key: D.key };
    });
    const far = x => Math.abs(x.got / x.lore - 1);
    const T = r.lands.find(x => x.L === 'T'), N = r.lands.find(x => x.L === 'N'), err = r.off / r.want;
    // the Black Pines and the Rime Coast near the lore; the whole within 10%; quotas off by under 40% (far@1: 85% and 70%)
    const ok = r.key === A_KEY && far(T) < 0.1 && far(N) < 0.25 && Math.abs(r.total / r.lore - 1) < 0.1 && err < 0.4 && r.lands.every(x => far(x) < 0.55);
    return { ok, detail: `${(r.total / 1e6).toFixed(1)}M km² of far land against the lore's ${(r.lore / 1e6).toFixed(1)}M: ` + r.lands.map(x => `${x.name.replace(/^The /, '')} ${(x.got / 1e6).toFixed(2)}/${(x.lore / 1e6).toFixed(2)}`).join(', ') +
      `; realms' holdings off the lore's holds_km2 by ${(100 * err).toFixed(1)}% (${(r.off / 1e6).toFixed(1)}M of ${(r.want / 1e6).toFixed(1)}M km²), ${r.within} of ${r.n} realm-regions within a quarter` };
  },

  // every far province is named from its people's own place list: no name twice in the world, no markup
  async flNames(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 9971, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16, lands: 'great' });
      const D = A.FAR.D, S = A.S, seen = new Map(), dup = [], bad = [], off = [];
      for (const p of S.prov) { const k = p.name.toLowerCase(); if (seen.has(k)) dup.push(p.name); seen.set(k, p.id); if (!p.name || /[<>"&]/.test(p.name)) bad.push(p.name); }
      // the land's peoples' lists: a name is one of them, or made from one (a root of the list with an ending of it, or a side of the country)
      const lists = {}; for (const id in D.cultures) { const c = D.cultures[id]; if (c.places) (lists[c.land] = lists[c.land] || []).push(...c.places); }
      let exact = 0, made = 0, n = 0;
      for (const p of S.prov) {
        if (p.id < D.base) continue; n++;
        // its people: those of its land, and of the land and culture of the realm that holds it (or of its neighbours, unheld)
        const R = D.realms[p.owner], near = p.adj.map(j => S.prov[j]).filter(q => q && D.realms[q.owner]).map(q => D.realms[q.owner]);
        const L = [].concat(lists[p.region[0]] || [], ...[R].concat(near).filter(Boolean).map(x => (lists[x.land] || []).concat((D.cultures[x.cult] || {}).places || [])));
        const nm = p.name.replace(/^The (.+) (Hills|Heights|Woods|Waste|Grass|Barrens|Fens|Downs|Pines|Wilds)$/, '$1').replace(/^(Upper|Lower|East|West|North|South|Old|High) /, '');
        if (L.some(x => x.toLowerCase() === nm.toLowerCase())) exact++;
        else if (L.some(x => nm.toLowerCase().startsWith(x.slice(0, 3).toLowerCase()) || nm.toLowerCase().endsWith(x.slice(-3).toLowerCase()))) made++;
        else off.push(p.name);
      }
      return { n, exact, made, off: off.length, offs: off.slice(0, 6), dup: dup.length, dups: dup.slice(0, 4), bad: bad.length, sample: S.prov.filter((p, i) => p.id >= D.base && i % 211 === 0).map(p => p.name) };
    });
    const ok = r.dup === 0 && r.bad === 0 && r.off <= r.n * 0.02;
    return { ok, detail: `${r.n} far provinces: ${r.exact} named with a place of their land's peoples, ${r.made} made from those lists, ${r.off} otherwise${r.off ? ' (' + r.offs.join(', ') + ')' : ''}; ${r.dup} names twice in the world, ${r.bad} with markup; e.g. ${r.sample.join(', ')}` };
  },

  // the lore's great routes are roads and sea lanes the caravans and carters use, and the Silk Road runs on into the
  // Known World at Kraoth (canon TR-09); the lore's ties to the Known World's realms exist
  async flRoutes(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 9981, race: 'human', realm: 'POL-34', status: 'peasant', sex: 'M', startAge: 16, race: 'orc', lands: 'great' });
      const D = A.FAR.D, S = A.S, MT = A.MT, E = A.ECON, out = { routes: (D.routes || []).length, ids: new Set((D.routes || []).map(x => x.id)).size };
      let gaps = 0, edges = 0;
      for (const rt of D.routes || []) for (let i = 1; i < rt.p.length; i++) { const a = S.prov[rt.p[i - 1]], b = rt.p[i]; edges++; if (!a || !(a.adj.includes(b) || (a.sea || []).includes(b))) gaps++; }
      out.gaps = gaps; out.edges = edges;
      const silk = (D.routes || []).filter(x => x.id === 'TR-17' || x.id === 'TR-09'), kw = new Set(silk.flatMap(x => x.p.filter(id => id < D.base)));
      out.silkKnown = [...kw].map(id => S.prov[id].name + ' (' + S.prov[id].owner + ')');
      out.tr09 = (D.routes || []).some(x => x.id === 'TR-09');
      const e0 = (D.routes || [])[0], a = e0.p[0], b = e0.p[1];
      out.roadF = MT && MT.roadF ? [MT.roadF(a, b), MT.roadF(0, 1)] : null;
      const rs = Object.values(S.realms).filter(x => x.alive && !x.isRebel), T = E.roads(rs);
      out.routed = T.routed || 0;
      const f62 = E.road('POL-34', 'POL-62'), f62d = E.ROAD + E.HOP * f62.dist / 250;
      out.f62 = [Math.round(f62.f * 1000) / 1000, Math.round(f62d * 1000) / 1000];
      for (let m = 0; m < 3; m++) A.advance(30);
      const on = new Set(); for (const rr of A.FAR.routeRealms()) { const ids = [...rr.realms]; for (const x of ids) for (const y of ids) if (x !== y) on.add(x + '>' + y); }
      const car = (S.eco && S.eco.car) || [];
      out.car = car.length; out.carRoute = car.filter(c => on.has(c.f + '>' + c.t)).length;
      out.carSeam = car.filter(c => on.has(c.f + '>' + c.t) && (!!D.realms[c.f]) !== (!!D.realms[c.t])).length;
      // the lore's ties that touch the Known World
      const canon = D.relations.filter(x => !D.realms[x.a] || !D.realms[x.b]);
      out.canon = canon.length; out.canonSet = canon.filter(x => S.realms[x.a] && S.realms[x.b] && A.relOf && true).length;
      out.tusk = ['POL-60', 'POL-61', 'POL-62'].map(id => (S.realms['POL-34'].rel || {})[id]);
      out.trade = Object.keys(S.realms['POL-34'].pacts.trade || {}).filter(id => D.realms[id]);
      // the Known World alone has no routes
      A.newGame({ seed: 9982, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 });
      out.knownF = MT && MT.roadF ? MT.roadF(a, b) : 1;
      return out;
    });
    const ok = r.routes >= 50 && r.ids >= 25 && r.gaps === 0 && r.silkKnown.length >= 2 && r.tr09 && r.roadF && r.roadF[0] < 1 && r.roadF[1] === 1 && r.routed > 100 &&
      r.f62[0] < r.f62[1] && r.carRoute > 0 && r.canon >= 9 && r.tusk.every(v => v > 0) && r.trade.length >= 2 && r.knownF === 1;
    return { ok, detail: `${r.routes} strands of ${r.ids} routes, ${r.edges} steps, ${r.gaps} not a road or a lane; the Silk Road runs into the Known World at ${r.silkKnown.join(', ')}${r.tr09 ? ' and on as TR-09' : ''}; ` +
      `a route's step costs x${r.roadF && r.roadF[0]} for the carters (66), ${r.routed} realm pairs share a route (45), Kraoth to the Tusk road's last crossing ${r.f62[0]} of the base price against ${r.f62[1]} off the road; ` +
      `three months: ${r.carRoute} of ${r.car} caravans along a route, ${r.carSeam} of them across the old edge; ${r.canon} lore ties to Known World realms, the Tusk Clans' with the Old Mare and the escorts ${r.tusk.join('/')}, trade pacts with ${r.trade.join(', ')}; the Known World alone: x${r.knownF}` };
  },

  // the inked map writes the far lands' names at their zooms (lands far off, seas, regions, ranges, rivers, lakes,
  // straits, passes, the routes dotted), fast enough with 2,033 provinces, and drawing stays pure
  async flMapLabels(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 9991, race: 'human', realm: 'POL-36', status: 'peasant', sex: 'M', startAge: 22, lands: 'great' });
      UI.set.hints = false; A.S.queue = []; UI.set.inkMap = true; if (UI.INKMAP) { UI.INKMAP.reset(); UI.INKMAP.budgetMs = 1e9; }
      UI.screen = 'game'; UI.tab = 'world'; UI.worldView = 'map'; UI.ov = null; UI.render();
      const s0 = JSON.stringify(A.S), r0 = A.rngState;
      const P = CanvasRenderingContext2D.prototype, ft = P.fillText, sd = P.setLineDash; let texts = [], dashes = 0;
      P.fillText = function (t) { texts.push(String(t)); return ft.apply(this, arguments); };
      P.setLineDash = function (a) { if (a && a.length) dashes++; return sd.apply(this, arguments); };
      const out = { z: {}, t: {} };
      try {
        UI.A.ov('bigmap');
        const at = (cx, cy, z) => { const w = 7000 / z; UI.gm.view = UI.wrClampView({ x0: cx - w / 2, y0: cy - w / 3.06, w, h: 0 }); };
        const D = A.FAR.D, AT = D.atlas;
        const has = (list, names) => names.filter(n => list.includes(n)).length;
        for (const [tag, cx, cy, z] of [['far', 11000, 1500, 0.45], ['mid', 9500, 1700, 1.5], ['near', 9300, 1800, 3], ['close', 9300, 2900, 8]]) {
          texts = []; dashes = 0; at(cx, cy, z); UI.gmDraw();
          out.z[tag] = { n: A.FAR.atlasDrawn, dashes, lands: has(texts, Object.values(D.lands).map(l => l.name.toUpperCase())), seas: has(texts, AT.seas.map(x => x[0])),
            regions: has(texts, Object.values(AT.regions).map(x => x.replace(/^The /, '').toUpperCase())), ranges: has(texts, AT.ranges.map(x => x[0])), rivers: has(texts, AT.rivers.map(x => x[0])),
            passes: has(texts, AT.passes.map(x => x[0])), roads: has(texts, D.routes.map(x => x.n.replace(/:.*$/, ''))) };
        }
        // timings: a cold full draw (every tile made) and pans, at zoom 1, 3 and 8, at the seam and in the east
        for (const [tag, cx, cy] of [['seam', 7600, 1500], ['east', 15200, 2300]]) for (const z of [1, 3, 8]) {
          UI.INKMAP.reset(); at(cx, cy, z);
          let t0 = performance.now(); UI.gmDraw(); const cold = performance.now() - t0, pans = [];
          for (let k = 0; k < 6; k++) { const v = UI.gm.view; UI.gm.view = UI.wrClampView({ x0: v.x0 + v.w * 0.08, y0: v.y0 + v.h * 0.03, w: v.w, h: 0 }); t0 = performance.now(); UI.gmDraw(); pans.push(performance.now() - t0); }
          pans.sort((a, b) => a - b);
          out.t[tag + ' z' + z] = [Math.round(cold), Math.round(pans[3])];
        }
      } finally { P.fillText = ft; P.setLineDash = sd; UI.ov = null; UI.render(); }
      out.pure = JSON.stringify(A.S) === s0 && A.rngState === r0;
      return out;
    });
    const Z = r.z;
    const ok = r.pure && Z.far.lands >= 6 && Z.far.seas >= 2 && Z.mid.regions >= 5 && Z.mid.ranges >= 1 && Z.near.rivers >= 1 && Z.near.roads >= 1 && Z.near.dashes > 0 && Z.close.passes >= 1 &&
      Object.values(r.t).every(([c, p]) => p < 250);
    return { ok, detail: Object.entries(Z).map(([k, v]) => `${k}: ${v.n} names (lands ${v.lands}, seas ${v.seas}, regions ${v.regions}, ranges ${v.ranges}, rivers ${v.rivers}, passes ${v.passes}, routes ${v.roads}), ${v.dashes} dotted roads`).join('; ') +
      `; full map ms (cold, median pan): ${Object.entries(r.t).map(([k, v]) => `${k} ${v[0]}/${v[1]}`).join(', ')}; drawing left the state and stream ${r.pure ? 'unchanged' : 'CHANGED'}` };
  },

  // a save of far@1 (the first data, Oct 26) opens: on its own provinces, its state untouched, its map drawn and
  // clicked where it is drawn, and it plays on. The far@1 build is made from the commit that shipped it; a save of
  // far@2 relabelled far@1 checks the same path when that commit is not in the checkout.
  async flFar1Save(pg, pageErrors, { browser, file }) {
    let saves = [], how = 'far@1 data from ' + FAR1_COMMIT;
    const old = far1Build(file);
    if (old) {
      const B = await openPage(browser, old);
      try {
        saves.push(await B.pg.evaluate(async () => {
          A.newGame({ seed: 9935, race: 'human', realm: 'POL-30', status: 'peasant', sex: 'M', startAge: 20, lands: 'great' }); T.play(1);
          const enc = await SAVES.encode(A.S, A.J); let s = ''; for (const b of enc.bytes) s += String.fromCharCode(b);
          return { b64: btoa(s), hash: T.hash(A.S.prov) + '|' + T.hash(A.S.people) + '|' + T.hash(A.S.realms), world: A.S.world.parts.join('+'), far: A.S.prov.length - A.FAR.D.base };
        }));
        if (B.errs.length) saves[0].err = B.errs[0];
      } finally { await B.ctx.close(); fs.rmSync(old, { force: true }); }
    } else how = 'no far@1 data in this checkout: a far@2 save relabelled far@1';
    const r = await pg.evaluate(async (saves) => {
      if (!saves.length) {
        A.newGame({ seed: 9936, race: 'human', realm: 'POL-30', status: 'peasant', sex: 'M', startAge: 20, lands: 'great' }); T.play(1);
        A.S.world.parts = ['ardan', 'far@1'];
        const enc = await SAVES.encode(A.S, A.J); let s = ''; for (const b of enc.bytes) s += String.fromCharCode(b);
        saves.push({ b64: btoa(s), hash: T.hash(A.S.prov) + '|' + T.hash(A.S.people) + '|' + T.hash(A.S.realms), world: 'ardan+far@1', far: A.S.prov.length - A.FAR.D.base });
      }
      const o = saves[0];
      A.newGame({ seed: 9937, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 });
      const bin = atob(o.b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      const d = await SAVES.decode(u), okLoad = UI.enterSave(d);
      const out = { saved: o.world, far: o.far, okLoad, part: A.FAR.part && A.FAR.part.key, active: A.FAR.active, frame: [MAP.KW, MAP.KH], prov: A.S.prov.length,
        same: T.hash(A.S.prov) + '|' + T.hash(A.S.people) + '|' + T.hash(A.S.realms) === o.hash };
      // the map draws its provinces where they are, in both styles, and a click on a site finds the province
      UI.set.hints = false; A.S.queue = []; UI.screen = 'game'; UI.tab = 'world'; UI.worldView = 'map'; UI.ov = null; UI.render();
      let hit = 0, n = 0;
      for (const ink of [true, false]) {
        UI.set.inkMap = ink; if (UI.INKMAP) { UI.INKMAP.reset(); UI.INKMAP.budgetMs = 1e9; } UI.render();
        const wm = UI.$('#worldmap'); MAP.draw(wm, { mode: 'political' });
        for (const p of A.S.prov.filter((p, i) => i >= A.FAR.D.base && i % 41 === 0)) {
          const [x, y] = MAP.toCanvas(wm, p.sx, p.sy), rc = wm.getBoundingClientRect(); n++;
          const got = MAP.provAt(wm, { clientX: rc.left + x / wm.width * rc.width, clientY: rc.top + y / wm.height * rc.height });
          if (got === p.id || (p.adj || []).includes(got)) hit++;
        }
        UI.A.ov('bigmap'); UI.gm.view = null; UI.gmDraw(); UI.ov = null; UI.render();
      }
      out.hit = hit; out.n = n;
      out.res = T.play(1); out.year = A.S.year;
      out.meta = SAVES.meta(A.S).world;
      return out;
    }, saves);
    const ok = r.okLoad && r.part === 'far@1' && r.active && r.frame[0] > 7000 && r.same && r.hit >= r.n * 0.9 && r.meta === 'ardan+far@1' && r.res !== undefined && !(saves[0] && saves[0].err);
    return { ok, detail: `${how}: a save of ${r.saved} (${r.far} far provinces) opened after a Known World game: ${r.okLoad ? 'loaded' : 'NOT loaded'} on part ${r.part}, frame ${r.frame.join('x')}, ${r.prov} provinces, state ${r.same ? 'as saved' : 'DIFFERENT'}; ` +
      `${r.hit} of ${r.n} clicks on far sites find their province (inked and release maps); played on to ${r.year}; its saves still say ${r.meta}` + (saves[0] && saves[0].err ? '; page error in the far@1 build: ' + saves[0].err : '') };
  },
};
