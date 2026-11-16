// D9 (CRITIQUE §17, D-061): the ground the game can read, from one generated continent.
//   - cover: each 10 km cell of land is open, wood or marsh (the climate's woods, broken by clearings and cleared round
//     the towns; copses in dry grass; marsh in the wetlands and the fens of big lowland rivers);
//   - roads in two ranks: a track between every two neighbouring towns that the ground allows (the cheapest way over
//     slope, wood, marsh, height and water, inside the two provinces), and high roads over the tracks from each
//     realm's seat to its cities and market towns and to the seats of the realms it borders;
//   - a crossing (a ford, or a bridge on a big river, in a town or on a high road) wherever a road meets running water;
//   - passes: where a road climbs over high ground well above both its ends;
//   - river links: neighbouring provinces a navigable river runs between (supply goes by barge);
//   - features to name: the biggest rivers, the mountain ranges, the forests and the seas round the coast.
// Pure: no DOM, no game state, no Math.random (the cover's noise is seeded from the world's seed; ties break by index).
// Input: a world from A.V2MAP.build ({ gw, gh, grid, prov, gen, rivers, riv, ocean, seed }) and { elev (the game
// grid's heights, v2 units), gi (each game cell's generator cell), metres, places: [{ type, realm }] }.
import { makeNoise } from './noise.js';
import { BIOME } from './continent.js';

export const GROUND_V = 1;
export const COVER = { OPEN: 0, WOOD: 1, MARSH: 2 };
export const RANK = { NONE: 0, HIGH: 1, TRACK: 2 };
export const DEFAULTS = {
  STREAM_T: 40,      // flow where a stream begins (a road over one has a ford)
  RIVER_T: 120,      // flow where a river begins (it stops an army but at a crossing; the battle names it)
  BRIDGE_T: 700,     // a river this big has no ford: every crossing of it is a bridge
  NAV_T: 300,        // a river this big carries barges (supply)
  PASS_M: 1000,      // a road's highest point is a pass when it stands this high (m)...
  PASS_RISE: 300,    // ...and this far above the higher of its two ends
  TRACK_MAX: 3.4,    // a way that costs more than this per cell of straight distance is no road (cross-country only)
  RANGE_M: 1800,     // mountains to name: land this high (m), in pieces of at least RANGE_MIN cells (a long range by stretches)
  RANGE_MIN: 60,
  WOOD_MIN: 160,     // forests to name: woods of at least this many cells
  RIVER_NAME: 500,   // rivers to name: this much flow at the mouth, and at least RIVER_KM long
  RIVER_KM: 250,
  CLEAR_R: 2,        // fields round a town: woods cleared within this many cells of its site
};

// a binary heap of (cost, cell) on typed arrays
function heap() {
  let K = new Float64Array(1024), V = new Int32Array(1024), n = 0;
  return {
    get n() { return n; }, key: 0, clear() { n = 0; },
    push(k, v) {
      if (n === K.length) { const K2 = new Float64Array(n * 2), V2 = new Int32Array(n * 2); K2.set(K); V2.set(V); K = K2; V = V2; }
      let i = n++;
      while (i > 0) { const p = (i - 1) >> 1; if (K[p] < k || (K[p] === k && V[p] <= v)) break; K[i] = K[p]; V[i] = V[p]; i = p; }
      K[i] = k; V[i] = v;
    },
    pop() {
      const top = V[0]; this.key = K[0]; const m = --n;
      if (m > 0) {
        const lk = K[m], lv = V[m]; let i = 0;
        for (;;) {
          const l = 2 * i + 1, r = l + 1; let c = -1, ck = lk, cv = lv;
          if (l < m && (K[l] < ck || (K[l] === ck && V[l] < cv))) { c = l; ck = K[l]; cv = V[l]; }
          if (r < m && (K[r] < ck || (K[r] === ck && V[r] < cv))) { c = r; ck = K[r]; cv = V[r]; }
          if (c < 0) break;
          K[i] = K[c]; V[i] = V[c]; i = c;
        }
        K[i] = lk; V[i] = lv;
      }
      return top;
    },
  };
}

export function buildGround(w, o = {}) {
  const C = Object.assign({}, DEFAULTS, o.params || {});
  const gw = w.gw, gh = w.gh, N = gw * gh, grid = w.grid, gen = w.gen, gi = o.gi, riv = w.riv, ocean = w.ocean;
  const prov = w.prov, M = prov.length, places = o.places || [];
  const hm = new Float32Array(N); for (let k = 0; k < N; k++) hm[k] = grid[k] >= 0 ? Math.max(0, o.elev[k]) * (o.metres || 8000) : 0;
  const siteOf = p => Math.min(gh - 1, Math.floor(p.sy / 10)) * gw + Math.min(gw - 1, Math.floor(p.sx / 10));
  const sites = prov.map(siteOf);

  // ---- 1. cover
  const nz = makeNoise(String(w.seed) + ':d9-cover'), cover = new Uint8Array(N);
  for (let k = 0; k < N; k++) {
    if (grid[k] < 0) continue;
    const g = gi[k], b = gen.biome[g], x = k % gw, y = (k / gw) | 0, n = nz.fbm(x / 16, y / 16, 3);
    if (b === BIOME.WETLAND || (riv[k] >= 400 && hm[k] < 90 && gen.moist[g] > 0.7)) cover[k] = COVER.MARSH;
    else if (b === BIOME.TEMPERATE_FOREST || b === BIOME.BOREAL_FOREST || b === BIOME.RAINFOREST) cover[k] = n < -0.16 ? COVER.OPEN : COVER.WOOD;
    else if ((b === BIOME.GRASSLAND || b === BIOME.SCRUB) && n > 0.3) cover[k] = COVER.WOOD;
  }
  for (const s of sites) {   // the fields round every town
    const x0 = s % gw, y0 = (s / gw) | 0, R = C.CLEAR_R;
    for (let y = Math.max(0, y0 - R); y <= Math.min(gh - 1, y0 + R); y++) for (let x = Math.max(0, x0 - R); x <= Math.min(gw - 1, x0 + R); x++)
      if ((x - x0) ** 2 + (y - y0) ** 2 <= R * R + 1 && cover[y * gw + x] === COVER.WOOD) cover[y * gw + x] = COVER.OPEN;
  }

  // ---- 2. the cheapest way between two neighbouring towns, inside their two provinces (8 directions)
  const dist = new Float64Array(N), prev = new Int32Array(N), stamp = new Int32Array(N), done = new Int32Array(N), H = heap();
  let tick = 0;
  const DX = [1, -1, 0, 0, 1, 1, -1, -1], DY = [0, 0, 1, -1, 1, -1, 1, -1];
  const stepCost = (k, j, diag) => {
    const sl = Math.abs(hm[j] - hm[k]) / (diag ? 1.414 : 1);
    let c = 1 + sl / 70 + (cover[j] === COVER.WOOD ? 0.5 : cover[j] === COVER.MARSH ? 1.8 : 0) + (hm[j] > 1800 ? 0.6 : 0);
    c *= diag ? 1.414 : 1;
    if (riv[j] >= C.STREAM_T && riv[k] < C.STREAM_T) c += riv[j] >= C.RIVER_T ? 5 + Math.log(riv[j] / C.RIVER_T) : 1.2;
    return c;
  };
  function way(a, b) {
    const s = sites[a], t = sites[b], tx = t % gw, ty = (t / gw) | 0;
    tick++; H.clear();
    dist[s] = 0; prev[s] = -1; stamp[s] = tick; H.push(Math.hypot(s % gw - tx, ((s / gw) | 0) - ty), s);
    while (H.n) {
      const k = H.pop();
      if (done[k] === tick) continue; done[k] = tick;
      if (k === t) break;
      const x = k % gw, y = (k / gw) | 0, dk = dist[k];
      for (let d = 0; d < 8; d++) {
        const xx = x + DX[d], yy = y + DY[d]; if (xx < 0 || yy < 0 || xx >= gw || yy >= gh) continue;
        const j = yy * gw + xx, g = grid[j]; if (g !== a && g !== b) continue;
        if (d >= 4 && grid[y * gw + xx] < 0 && grid[yy * gw + x] < 0) continue;   // no slipping across a strait
        const nd = dk + stepCost(k, j, d >= 4);
        if (stamp[j] !== tick || nd < dist[j]) { stamp[j] = tick; dist[j] = nd; prev[j] = k; H.push(nd + Math.hypot(xx - tx, yy - ty), j); }
      }
    }
    if (done[t] !== tick) return null;
    const path = []; for (let k = t; k >= 0; k = prev[k]) path.push(k);
    path.reverse();
    let km = 0; for (let i = 1; i < path.length; i++) { const p = path[i - 1], q = path[i]; km += (p % gw !== q % gw && ((p / gw) | 0) !== ((q / gw) | 0)) ? 14.14 : 10; }
    return { path: Int32Array.from(path), cost: dist[t], km, straight: Math.hypot(s % gw - tx, ((s / gw) | 0) - ty) };
  }
  const edges = [];
  for (let a = 0; a < M; a++) for (const b of prov[a].adj) {
    if (b <= a) continue;
    const r = way(a, b); if (!r) continue;
    const diff = r.cost / Math.max(1, r.straight);
    edges.push({ a, b, rank: diff <= C.TRACK_MAX ? RANK.TRACK : RANK.NONE, km: Math.round(r.km), cost: Math.round(r.cost * 10) / 10, diff: Math.round(diff * 100) / 100, path: r.path, cross: [], pass: -1, wet: 0 });
  }

  // ---- 3. high roads: the realm's seat to its cities and market towns, and to the seats of the realms beside it
  const nbE = Array.from({ length: M }, () => []);
  edges.forEach((e, i) => { if (e.rank) { nbE[e.a].push(i); nbE[e.b].push(i); } });
  const seatOf = {}, realmOf = i => (places[i] && places[i].realm) || null;
  for (let i = 0; i < M; i++) { const pl = places[i]; if (pl && pl.type === 'capital city' && pl.realm && pl.realm !== 'unclaimed' && !(pl.realm in seatOf)) seatOf[pl.realm] = i; }
  const tree = from => {   // the cheapest roads from one place to every other (by cost), over tracks
    const d = new Float64Array(M).fill(Infinity), pe = new Int32Array(M).fill(-1), Q = heap(); d[from] = 0; Q.push(0, from);
    while (Q.n) { const u = Q.pop(), du = Q.key; if (du > d[u]) continue;
      for (const ei of nbE[u]) { const e = edges[ei], v = e.a === u ? e.b : e.a, nd = du + e.cost; if (nd < d[v] - 1e-9) { d[v] = nd; pe[v] = ei; Q.push(nd, v); } } }
    return { d, pe };
  };
  const mark = (T, from, to) => { if (!isFinite(T.d[to])) return; for (let v = to; v !== from && T.pe[v] >= 0;) { const e = edges[T.pe[v]]; e.rank = RANK.HIGH; v = e.a === v ? e.b : e.a; } };
  const realmNb = {};
  for (const e of edges) { const ra = realmOf(e.a), rb = realmOf(e.b); if (ra && rb && ra !== rb && ra !== 'unclaimed' && rb !== 'unclaimed') { (realmNb[ra] = realmNb[ra] || new Set()).add(rb); } }
  for (const rid of Object.keys(seatOf).sort()) {
    const s = seatOf[rid], T = tree(s);
    for (let i = 0; i < M; i++) { const pl = places[i]; if (pl && pl.realm === rid && i !== s && (pl.type === 'city' || pl.type === 'market town' || pl.type === 'capital city')) mark(T, s, i); }
    for (const ob of [...(realmNb[rid] || [])].sort()) if (seatOf[ob] != null && ob > rid) mark(T, s, seatOf[ob]);
  }

  // ---- 4. rivers on the grid: which path runs through each cell (the largest flow there)
  const rivId = new Int32Array(N).fill(-1), rivF = new Float32Array(N);
  const rivers = w.rivers || [];
  rivers.forEach((a, r) => {
    for (let i = 0; i + 5 < a.length; i += 3) {
      const x0 = a[i] / 10, y0 = a[i + 1] / 10, x1 = a[i + 3] / 10, y1 = a[i + 4] / 10, f = Math.min(a[i + 2], a[i + 5]);
      const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
      for (let s = 0; s <= n; s++) { const x = Math.floor(x0 + (x1 - x0) * s / n), y = Math.floor(y0 + (y1 - y0) * s / n); if (x < 0 || y < 0 || x >= gw || y >= gh) continue; const k = y * gw + x; if (f > rivF[k]) { rivF[k] = f; rivId[k] = r; } }
    }
  });

  // ---- 5. crossings: each run of a road over running water; merged where roads cross at the same place
  const crossings = [], crossAt = new Map();
  const isSite = new Uint8Array(N); for (const s of sites) isSite[s] = 1;
  edges.forEach((e, ei) => {
    if (!e.rank) return;
    const p = e.path;
    for (let i = 0; i < p.length; i++) {
      if (riv[p[i]] < C.STREAM_T) continue;
      let j = i, best = p[i], town = false; while (j + 1 < p.length && riv[p[j + 1]] >= C.STREAM_T) j++;
      for (let q = i; q <= j; q++) { if (riv[p[q]] > riv[best]) best = p[q]; if (isSite[p[q]]) town = true; }
      const ends = i === 0 || j === p.length - 1;
      i = j;
      if (ends) continue;   // a town on the water: the road leaves it on its own bank (the town's bridge is in the town)
      const f = riv[best];
      let ci = -1;
      for (const dk of [0, -1, 1, -gw, gw, -gw - 1, -gw + 1, gw - 1, gw + 1]) { const c = crossAt.get(best + dk); if (c != null && crossings[c].river === rivId[best]) { ci = c; break; } }
      const kind = f >= C.BRIDGE_T || town || (e.rank === RANK.HIGH && f >= C.RIVER_T * 2) ? 'bridge' : 'ford';
      if (ci < 0) { ci = crossings.length; crossings.push({ k: best, x: (best % gw) * 10 + 5, y: ((best / gw) | 0) * 10 + 5, kind, flow: Math.round(f), river: rivId[best], town, prov: grid[best], edges: [] }); crossAt.set(best, ci); }
      else if (kind === 'bridge') crossings[ci].kind = 'bridge';
      const c = crossings[ci]; if (!c.edges.includes(ei)) c.edges.push(ei);
      e.cross.push(ci); if (f > e.wet) e.wet = Math.round(f);
    }
  });

  // ---- 6. passes: a road's highest point, high and well above both its ends
  const passes = [];
  edges.forEach((e, ei) => {
    if (!e.rank) return;
    const p = e.path; let top = p[0];
    for (let i = 1; i < p.length; i++) if (hm[p[i]] > hm[top]) top = p[i];
    const ends = Math.max(hm[p[0]], hm[p[p.length - 1]]);
    if (hm[top] < C.PASS_M || hm[top] - ends < C.PASS_RISE) return;
    let pi = passes.findIndex(q => Math.abs(q.k % gw - top % gw) <= 4 && Math.abs(((q.k / gw) | 0) - ((top / gw) | 0)) <= 4);
    if (pi < 0) { pi = passes.length; passes.push({ k: top, x: (top % gw) * 10 + 5, y: ((top / gw) | 0) * 10 + 5, m: Math.round(hm[top]), prov: grid[top], edges: [] }); }
    passes[pi].edges.push(ei); e.pass = pi;
  });

  // ---- 7. river links: a navigable river from one province into the next
  const links = new Map();
  rivers.forEach(a => {
    let last = -1;
    for (let i = 0; i < a.length; i += 3) {
      const f = a[i + 2]; const x = Math.floor(a[i] / 10), y = Math.floor(a[i + 1] / 10); if (x < 0 || y < 0 || x >= gw || y >= gh) continue;
      const g = grid[y * gw + x]; if (g < 0) { last = -1; continue; }
      if (f >= C.NAV_T && last >= 0 && g !== last && prov[last].adj.includes(g)) { const key = Math.min(g, last) * 4096 + Math.max(g, last); links.set(key, Math.max(links.get(key) || 0, Math.round(f))); }
      last = f >= C.NAV_T ? g : -1;
    }
  });
  const riverLinks = [...links.keys()].sort((x, y) => x - y).map(key => [Math.floor(key / 4096), key % 4096, links.get(key)]);

  // ---- 8. features to name
  const nearProv = (x, y) => { const k = Math.min(gh - 1, Math.max(0, Math.round(y))) * gw + Math.min(gw - 1, Math.max(0, Math.round(x))); if (grid[k] >= 0) return grid[k];
    let best = -1, bd = Infinity; for (let i = 0; i < M; i++) { const d = (sites[i] % gw - x) ** 2 + (((sites[i] / gw) | 0) - y) ** 2; if (d < bd) { bd = d; best = i; } } return best; };
  // rivers: the biggest paths, labelled at the middle of their course
  const named = [];
  rivers.forEach((a, r) => {
    const n = a.length / 3; if (n < 4) return;
    const mouth = a[a.length - 1]; if (mouth < C.RIVER_NAME) return;
    let km = 0; for (let i = 3; i < a.length; i += 3) km += Math.hypot(a[i] - a[i - 3], a[i + 1] - a[i - 2]);
    if (km < C.RIVER_KM) return;
    const m = Math.floor(n * 0.55) * 3, m2 = Math.min(a.length - 3, m + 9);
    named.push({ r, flow: Math.round(mouth), km: Math.round(km), x: a[m], y: a[m + 1], ang: Math.atan2(a[m2 + 1] - a[m + 1], a[m2] - a[m]), prov: nearProv(a[m] / 10, a[m + 1] / 10) });
  });
  named.sort((p, q) => q.flow * q.km - p.flow * p.km || p.r - q.r);
  const riverNames = named.slice(0, 28);
  // pieces of the grid where ok(k), 4-connected, at least min cells: centre, size, the long axis's angle
  // A piece bigger than a block (BxB cells) is named block by block: a great forest or a long range has names along it
  const pieces = (ok, min, B) => {
    const lab = new Int32Array(N).fill(-1), groups = [];
    for (let s = 0; s < N; s++) {
      if (lab[s] >= 0 || !ok(s)) continue;
      const st = [s], all = []; lab[s] = 1;
      while (st.length) { const k = st.pop(); all.push(k); const x = k % gw; for (const j of [x > 0 ? k - 1 : -1, x < gw - 1 ? k + 1 : -1, k - gw, k + gw]) if (j >= 0 && j < N && lab[j] < 0 && ok(j)) { lab[j] = 1; st.push(j); } }
      if (all.length < min) continue;
      if (all.length <= B * B * 0.6) { groups.push(all); continue; }
      const blk = new Map();
      for (const k of all) { const b = Math.floor((k % gw) / B) * 1000 + Math.floor(((k / gw) | 0) / B); let g = blk.get(b); if (!g) blk.set(b, g = []); g.push(k); }
      for (const b of [...blk.keys()].sort((x, y) => x - y)) if (blk.get(b).length >= min) groups.push(blk.get(b));
    }
    const out = [];
    for (const cells of groups) {
      let sx = 0, sy = 0; for (const k of cells) { sx += k % gw; sy += (k / gw) | 0; }
      const cx = sx / cells.length, cy = sy / cells.length; let xx = 0, yy = 0, xy = 0, peak = 0;
      for (const k of cells) { const dx = k % gw - cx, dy = ((k / gw) | 0) - cy; xx += dx * dx; yy += dy * dy; xy += dx * dy; if (hm[k] > peak) peak = hm[k]; }
      let ang = 0.5 * Math.atan2(2 * xy, xx - yy); if (ang > Math.PI / 2) ang -= Math.PI; if (ang < -Math.PI / 2) ang += Math.PI;
      // the label stands on the piece: its cell nearest the centre
      let lk = cells[0], ld = Infinity; for (const k of cells) { const d = (k % gw - cx) ** 2 + (((k / gw) | 0) - cy) ** 2; if (d < ld) { ld = d; lk = k; } }
      const span = Math.sqrt(Math.max(xx, yy) / cells.length) * 2;
      out.push({ n: cells.length, x: (lk % gw) * 10 + 5, y: ((lk / gw) | 0) * 10 + 5, ang: Math.round(ang * 100) / 100, span: Math.round(span * 10), peak: Math.round(peak), prov: nearProv(lk % gw, (lk / gw) | 0) });
    }
    return out.sort((p, q) => q.n - p.n || p.x - q.x || p.y - q.y);
  };
  const ranges = pieces(k => grid[k] >= 0 && hm[k] >= C.RANGE_M, C.RANGE_MIN, 45).slice(0, 24);
  const forests = pieces(k => grid[k] >= 0 && cover[k] === COVER.WOOD, C.WOOD_MIN, 40).slice(0, 30);
  // seas: the water round the coast in eight sectors about the land's middle, each named at its sea off the coast
  let lx = 0, ly = 0, ln = 0; for (let k = 0; k < N; k++) if (grid[k] >= 0) { lx += k % gw; ly += (k / gw) | 0; ln++; }
  lx /= Math.max(1, ln); ly /= Math.max(1, ln);
  const toLand = new Int32Array(N).fill(1e9), q = [];
  for (let k = 0; k < N; k++) if (grid[k] >= 0) { toLand[k] = 0; q.push(k); }
  for (let h = 0; h < q.length; h++) { const k = q[h], x = k % gw; for (const j of [x > 0 ? k - 1 : -1, x < gw - 1 ? k + 1 : -1, k - gw, k + gw]) if (j >= 0 && j < N && toLand[j] > toLand[k] + 1) { toLand[j] = toLand[k] + 1; q.push(j); } }
  const SECT = 8, acc = Array.from({ length: SECT }, () => ({ n: 0, x: 0, y: 0, coast: new Map() }));
  for (let k = 0; k < N; k++) {
    if (!ocean[k] || toLand[k] < 6 || toLand[k] > 16) continue;
    const x = k % gw, y = (k / gw) | 0, s = Math.floor(((Math.atan2(y - ly, x - lx) + Math.PI) / (2 * Math.PI)) * SECT) % SECT;
    acc[s].n++; acc[s].x += x; acc[s].y += y;
  }
  const seas = [];
  acc.forEach((a, s) => {
    if (a.n < 200) return;
    const cx = a.x / a.n, cy = a.y / a.n;
    // the label on open water in this sector nearest its centre
    let lk = -1, ld = Infinity;
    for (let k = 0; k < N; k++) { if (!ocean[k] || toLand[k] < 5 || toLand[k] > 18) continue; const x = k % gw, y = (k / gw) | 0;
      if (Math.floor(((Math.atan2(y - ly, x - lx) + Math.PI) / (2 * Math.PI)) * SECT) % SECT !== s) continue; const d = (x - cx) ** 2 + (y - cy) ** 2; if (d < ld) { ld = d; lk = k; } }
    if (lk < 0) return;
    seas.push({ s, n: a.n, x: (lk % gw) * 10 + 5, y: ((lk / gw) | 0) * 10 + 5, prov: nearProv(lk % gw, (lk / gw) | 0) });
  });

  // the edges as flat, cloneable arrays
  return {
    v: GROUND_V, cover, rivId,
    edges: edges.map(e => ({ a: e.a, b: e.b, rank: e.rank, km: e.km, cost: e.cost, diff: e.diff, path: e.path, cross: e.cross, pass: e.pass, wet: e.wet })),
    crossings, passes, riverLinks, rivers: riverNames, ranges, forests, seas,
  };
}

// the edge between provinces a and b in a ground (a lookup built once per ground)
export function edgeIndex(G) {
  const m = new Map();
  G.edges.forEach((e, i) => { m.set(e.a * 4096 + e.b, i); m.set(e.b * 4096 + e.a, i); });
  return (a, b) => { const i = m.get(a * 4096 + b); return i == null ? null : G.edges[i]; };
}
