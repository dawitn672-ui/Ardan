// The v2 continent in play: every new world is built on it, and the map's grid follows whichever world is loaded.
//   - A.initWorld (patch V2MAP-PROV) hands the freshly made provinces to A.V2MAP.onProv, which writes the generated
//     geometry into them before anything reads them (the realms' seats, Tessaria's split, the varied worlds of 43 and
//     70, the scale index of 09) and marks the state with its map: A.S.v2map = { seed, v }.
//   - The map's seed is the one continent's (M1, D-142: A.V2MAP.ONE, the same for every life; A.V2MAP.mapSeed): building
//     the map never draws A.rand, so the game's dice fall as they would on the release's map. Before M1 it was the game's
//     own seed, salted (A.V2MAP.seedOf); such a save keeps that seed in A.S.v2map and so its own continent.
//   - MAP.init is wrapped: the grid on screen is the loaded world's. A save carries only the seed; its provinces carry
//     their own geometry, and the grid is regenerated from the seed the first time the map is drawn after a load.
//     A state without A.S.v2map (a save from before, or the 09-engine-at-scale clone harness) keeps the map as written.
//   - Worlds are cached by seed (the last few, and the one continent always), so a reload, a replay, a second life or a
//     second look costs nothing.
const VM = A.V2MAP;
VM.OFF = false;
VM.cache = new Map(); VM.CACHE = 3;
VM.stats = { builds: 0, ms: [] };

// the map as written: the release's grid and provinces, for the warp and for states without a v2 map
VM.release = function () {
  if (VM._rel) return VM._rel;
  const m = LORE.map, g = new Int16Array(m.gw * m.gh), bin = atob(m.rle), u16 = new Uint16Array(bin.length / 2);
  for (let i = 0; i < u16.length; i++) u16[i] = bin.charCodeAt(i * 2) | (bin.charCodeAt(i * 2 + 1) << 8);
  let k = 0; for (let i = 0; i < u16.length; i += 2) { const v = u16[i] - 1, n = u16[i + 1]; g.fill(v, k, k + n); k += n; }
  VM._rel = { gw: m.gw, gh: m.gh, grid: g, n: m.provinces.length,
    realmNames: Object.fromEntries(Object.keys(LORE.realms).map(id => [id, LORE.realms[id].name])),
    provinces: m.provinces.map(p => ({ id: p.id, realm: p.realm, sx: p.sx, sy: p.sy, cells: p.cells, type: p.type, pop: p.pop, biome: p.biome, name: p.name })) };
  return VM._rel;
};
// on unless switched off or the province list is not the release's (the 09-engine-at-scale clone harness copies it K times)
VM.on = () => !VM.OFF && typeof LORE !== 'undefined' && LORE.map && LORE.map.provinces.length === VM.release().n;

// a world is keyed by its seed and the version of the map that made it, so a save keeps the map it was made on
VM.world = function (seed, v = VM.VERSION) {
  const key = seed + '#' + v;
  let w = VM.cache.get(key);
  if (w) { VM.cache.delete(key); VM.cache.set(key, w); return w; }
  w = VM.build(seed, VM.release(), v); w.key = key;
  VM.stats.builds++; VM.stats.ms.push(Math.round(w.T.ms)); if (VM.stats.ms.length > 20) VM.stats.ms.shift();
  VM.cache.set(key, w);
  VM.trim();
  return w;
};
// M1: the cache keeps the last VM.CACHE worlds besides the one continent, which is never let go (every life is on it)
VM.pinned = key => !!VM.ONE && key === VM.ONE + '#' + VM.VERSION;
VM.trim = function () {
  for (const k of [...VM.cache.keys()]) { if (VM.cache.size <= VM.CACHE + (VM.cache.has(VM.ONE + '#' + VM.VERSION) ? 1 : 0)) break; if (!VM.pinned(k)) VM.cache.delete(k); }
};

// the fields the map decides, on the state's provinces
VM.FIELDS = ['x', 'y', 'sx', 'sy', 'coast', 'terr', 'biome', 'elev', 'cells'];
VM.onProv = function (S) {
  if (!S || !Array.isArray(S.prov)) return;
  if (!VM.on()) { delete S.v2map; return; }
  const seed = VM.mapSeed(S.seed), w = VM.world(seed);
  for (const p of S.prov) {
    const q = w.prov[p.id]; if (!q) continue;
    for (const f of VM.FIELDS) p[f] = q[f];
    p.adj = q.adj.slice(); p.sea = q.sea.slice();
    // D9 (map v3): an oasis the land left off dry ground is a town named for its water; it keeps its old name as `oname`
    if (q.retype && p.type === 'oasis') { p.type = q.retype.type; p.oname = p.name; p.name = q.retype.name; }
  }
  S.v2map = { seed, v: VM.VERSION };
  VM.use(w);
};

// M1: the one continent's facts the creation screen shows before any world is built: each home town's terrain word, and the
// new name of an oasis the land left off dry ground (data/map/one-continent.json, written by tools/m1/facts.mjs from the built
// world and checked against it by the test m1OneContinent). Null when the data is not this map's (another seed or version).
VM.oneFacts = function () {
  const D = A.DATA && A.DATA['map/one-continent'];
  return D && VM.ONE && D.seed === VM.ONE && D.v === VM.VERSION && Array.isArray(D.terr) && VM.on() ? D : null;
};

// which world the grid shows: the loaded state's
VM.cur = null;
VM.want = () => (A.S && A.S.v2map && A.S.v2map.seed && VM.on() ? String(A.S.v2map.seed) + '#' + (A.S.v2map.v || 1) : null);
VM.use = function (w) {
  const key = w ? w.key : null;
  if (VM.cur === key && MAP.grid) return;
  if (w) { MAP.grid = w.grid; MAP.gw = w.gw; MAP.gh = w.gh; VM.w = w; }
  else { const r = VM.release(); MAP.grid = r.grid; MAP.gw = r.gw; MAP.gh = r.gh; VM.w = null; }
  VM.cur = key;
  MAP.overlayCache = null; MAP.ownerKey = null; MAP.frontCache = null; MAP.frontKey = null;
  try { if (UI.INKMAP && UI.INKMAP.reset) UI.INKMAP.reset(); } catch (e) {}
  try { if (UI.wrOvCache) UI.wrOvCache = null; } catch (e) {}
  if (VM.onUse) VM.onUse(w);
};
VM.sync = function () {
  const s = VM.want();
  if (s === VM.cur && MAP.grid) return;
  VM.use(s ? VM.world(s.slice(0, s.lastIndexOf('#')), +s.slice(s.lastIndexOf('#') + 1)) : null);
};
const init0 = MAP.init;
MAP.init = function () {
  const r = init0.apply(this, arguments);
  VM.sync();
  return r;
};

// 76-beast-habitats keeps each beast to its canon regions (by province name, which the generated map keeps) and, within
// them, to the provinces whose terrain words fit it, waiving the words only in a region where no province fits them.
// 76 reads that waiver from the map as written (LORE.map). On a generated continent a region's terrain is the new
// land's, so on a v2 map the waiver is read from the live provinces instead: a beast keeps to fitting ground where its
// region has any, and is met across the whole region where it has none, so no beast is met nowhere. (Before, the region
// alone decided on a v2 map, which put S-07's marsh leech on the hills and forests beside its marsh: CI run 88.)
if (A.BH && typeof A.BH.canonSays === 'function') {
  const says = A.BH.canonSays;
  let looseKey = null, looseMemo = null;
  // the provinces of beast `id`'s range where the map in play waives its terrain words (module data, never state)
  A.BH.looseOf = function (id) {
    const r = A.BH.resolve(), e = r.E[id];
    if (!e) return new Set();
    if (!(A.S && A.S.v2map && Array.isArray(A.S.prov))) return e.loose;
    const key = A.S.v2map.seed + '|' + A.S.v2map.v + '|' + A.S.prov.length;
    if (key !== looseKey) { looseKey = key; looseMemo = new Map(); }
    if (looseMemo.has(id)) return looseMemo.get(id);
    const byCode = {}, out = new Set();
    for (const P of A.S.prov) if (P && e.inRange.has(P.id)) { const c = r.regionOf[P.name] || r.regionOf[P.oname]; (byCode[c] = byCode[c] || []).push(P); }
    for (const c in byCode) if (!byCode[c].some(P => A.BH.terrOk(A.BEASTS[id], P.terr))) for (const P of byCode[c]) out.add(P.id);
    looseMemo.set(id, out);
    return out;
  };
  A.BH.canonSays = function (id, P) {
    if (!(A.S && A.S.v2map)) return says.apply(this, arguments);
    const r = A.BH.resolve(), e = r.E[id];
    if (!e || !P || !(r.regionOf[P.name] || r.regionOf[P.oname])) return null;
    return e.inRange.has(P.id) && (A.BH.looseOf(id).has(P.id) || A.BH.terrOk(A.BEASTS[id], P.terr));
  };
}
