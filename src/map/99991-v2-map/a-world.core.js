// The v2 continent as the game's world (step 2 of docs/V2_SPEC.md, complaints 3 and 4).
// A.V2MAP.build(seed, base) turns Ardan v2's procedural continent (A.V2.continent.generateContinent) into the game's
// map: a 700 x 450 grid of province ids (10 km cells, the release's frame) and, for each of the release's 306
// provinces, every field the map decides (x, y, sx, sy, adj, sea, coast, terr, biome, elev, cells). The realms keep
// who they are (LORE, the Codex); the generated land decides their borders:
//   1. land: the continent is generated on a coarser grid (A.V2MAP.GW x GH, about 15 km cells, for speed), sampled
//      bilinearly onto the game's grid, and cut to its one 4-connected landmass;
//   2. placement: each realm's capital (and each unclaimed wild) is carried to the new land by a warp that keeps the
//      share of land to its west and, within its band, to its north, so the realms that bordered tend to border;
//   3. growth: every realm grows from its seat over the cheapest ground (slope, rivers and heights cost more), the
//      least filled first, until it holds the share of the land it held in the release; then each realm's land is
//      split the same way among its provinces, seeded where they lay inside the realm;
//   4. fields: centroids, the seat as the town site, land adjacency, coast, height in metres, the release's biome and
//      terrain words read from v2's biomes (terrain by quotas, so the world keeps the release's mix of hills).
// Pure: no DOM, no A.S, no A.rand (the generator has its own seeded stream; ties break by cell index).
// Step X7 (phone speed): the file is one function, A.V2MAP.define(A), run here on the page and, from its own source, in
// a Web Worker (e-ahead.core.js), which builds a new life's continent ahead with exactly this code. It reads only
// A.V2MAP and A.V2.continent.
(A.V2MAP = A.V2MAP || {}).define = function (A) {
const VM = A.V2MAP;
VM.VERSION = 3;                                 // 2: sea realms on the shore (playtest 1, #21); a v1 save rebuilds as v1
                                                // 3 (D9, D-061): towns on water, oases on dry land, terrain read from the
                                                // ground with no word on more than a third; a v2 save rebuilds as v2
VM.GW = 467; VM.GH = 300;                       // the generator's grid: 15 km cells over the release's 7,000 x 4,500 km
// erosion at 0.5 droplets a cell (v2's default is 0.9): the same look at this grid, a third less time
VM.OPTS = { landFraction: 0.38, latTop: 56, latBottom: 16, maxIslands: 0, provinces: 1, droplets: Math.round(VM.GW * VM.GH * 0.5) };
VM.ELEV_M = 8000;
VM.RIVER_T = 120;                               // flow (v2's accumulated moisture) where a river begins
VM.STREAM_T = 40;                               // D9: where a stream begins (the tributaries drawn close in; a town may stand on one)
VM.TERR_SHARE = { mountains: 0.065, hills: 0.41 };   // the release's mix: 20 and 126 of 306 provinces (map versions 1 and 2)
// D9 (map version 3): the terrain word is read from each province's own ground (its height, its relief, how much of it
// is wood, marsh, sand or ice); hills are rough or high country, not a quota, and settled lowland in a wooded climate is
// cleared farmland. No word may cover more than VM.TERR_CAP of the provinces: past it, the provinces with the weakest
// claim take their next best word (read from the same ground).
VM.TERR_CAP = 0.31;
VM.HILL = { relief: 250, elev: 800 };            // a province is hilly when its heights spread this much (sd, metres) or it stands this high
VM.SITE_R = 18;                                 // a town moves at most this many cells (180 km) from its seed to stand on water
VM.DRY_PAY = 2.5; VM.GREEN_PAY = 1.5;           // what a dry realm pays for a green cell, and a green realm for a dry one
VM.ARID_REALM = 0.5;                            // a realm whose release land was this share dry (desert, steppe, savanna) is seated on dry land
VM.ISLE_RX = /\b(isles?|islands?|archipelago)\b/i;            // a realm named for islands: a peninsula on the shore
VM.COAST_RX = /\b(coast|shore|bay|strand|sea)\b|reef\b/i;       // a realm named for the sea: a seat on the shore
// the realms C7 renamed (D-058) keep the sea their old names promised, by id
VM.SEA_ID = { 'POL-32': 'peninsula', 'POL-21': 'coast', 'POL-33': 'coast' };
VM.seedOf = s => 'ardan-v2-map:' + String(s);
const now = () => (typeof performance !== 'undefined' ? performance.now() : 0);

// a hash of a cell index in [0, 1): the costs' grain, so equal costs never fall back on scan order
const hash01 = k => { let h = Math.imul(k ^ 0x9e3779b9, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };

// a small binary heap of (cost, cell) on typed arrays
function Heap() { this.k = new Float64Array(256); this.v = new Int32Array(256); this.n = 0; }
Heap.prototype.push = function (key, val) {
  if (this.n === this.k.length) { const k2 = new Float64Array(this.n * 2), v2 = new Int32Array(this.n * 2); k2.set(this.k); v2.set(this.v); this.k = k2; this.v = v2; }
  const K = this.k, V = this.v; let i = this.n++;
  while (i > 0) { const p = (i - 1) >> 1; if (K[p] < key || (K[p] === key && V[p] <= val)) break; K[i] = K[p]; V[i] = V[p]; i = p; }
  K[i] = key; V[i] = val;
};
Heap.prototype.pop = function () {
  const K = this.k, V = this.v, top = V[0]; this.key = K[0]; const n = --this.n;
  if (n > 0) {
    const lk = K[n], lv = V[n]; let i = 0;
    for (;;) {
      const l = 2 * i + 1, r = l + 1; let m = -1, mk = lk, mv = lv;
      if (l < n && (K[l] < mk || (K[l] === mk && V[l] < mv))) { m = l; mk = K[l]; mv = V[l]; }
      if (r < n && (K[r] < mk || (K[r] === mk && V[r] < mv))) { m = r; mk = K[r]; mv = V[r]; }
      if (m < 0) break;
      K[i] = K[m]; V[i] = V[m]; i = m;
    }
    K[i] = lk; V[i] = lv;
  }
  return top;
};

// Grow regions from seeds over the cells where allowed[k] === tag: each region claims its cheapest frontier cell, the
// region least filled against its target first, until it is full or walled in; cells left over go to the region
// that reaches them first. owner[k] receives the region index. Every region is one connected piece.
function grow(gw, gh, allowed, tag, seeds, targets, cost, owner, bias) {
  const R = seeds.length, heaps = [], count = new Float64Array(R), active = new Uint8Array(R), dist = new Float64Array(R);
  const nb = [0, 0, 0, 0];
  const pushNb = (r, k, d) => {
    const x = k % gw;
    nb[0] = x > 0 ? k - 1 : -1; nb[1] = x < gw - 1 ? k + 1 : -1; nb[2] = k >= gw ? k - gw : -1; nb[3] = k + gw < gw * gh ? k + gw : -1;
    for (let i = 0; i < 4; i++) { const j = nb[i]; if (j >= 0 && allowed[j] === tag && owner[j] < 0) heaps[r].push(d + cost[j] + (bias && bias[r] ? bias[r][j] : 0), j); }
  };
  for (let r = 0; r < R; r++) { heaps.push(new Heap()); const k = seeds[r]; owner[k] = r; count[r] = 1; active[r] = count[r] < targets[r] ? 1 : 0; pushNb(r, k, 0); }
  // first to the targets; then whatever a walled-in region could not take goes to its neighbours, the least
  // overfilled first, so the overflow is shared out rather than handed to whoever touches it
  for (let phase = 0; phase < 2; phase++) {
    if (phase) for (let r = 0; r < R; r++) active[r] = heaps[r].n ? 1 : 0;
    for (;;) {
      let best = -1, bf = Infinity;
      for (let r = 0; r < R; r++) if (active[r]) { const f = count[r] / targets[r]; if (f < bf) { bf = f; best = r; } }
      if (best < 0) break;
      const H = heaps[best]; let got = -1;
      while (H.n) { const k = H.pop(); if (owner[k] < 0) { got = k; break; } }
      if (got < 0) { active[best] = 0; continue; }
      owner[got] = best; count[best]++; pushNb(best, got, H.key);
      if (!phase && count[best] >= targets[best]) active[best] = 0;
    }
  }
  // anything still left (nothing, as every cell next to a claimed one is on a frontier): breadth first
  const q = [];
  for (let k = 0; k < gw * gh; k++) if (allowed[k] === tag && owner[k] >= 0) q.push(k);
  for (let h = 0; h < q.length; h++) {
    const k = q[h], x = k % gw, o = owner[k];
    nb[0] = x > 0 ? k - 1 : -1; nb[1] = x < gw - 1 ? k + 1 : -1; nb[2] = k >= gw ? k - gw : -1; nb[3] = k + gw < gw * gh ? k + gw : -1;
    for (let i = 0; i < 4; i++) { const j = nb[i]; if (j >= 0 && allowed[j] === tag && owner[j] < 0) { owner[j] = o; count[o]++; q.push(j); } }
  }
  return count;
}

// the nearest cell to (x, y) where ok(k), searched in growing squares (ties: the lowest index on the ring)
function nearestCell(gw, gh, x, y, ok) {
  x = Math.max(0, Math.min(gw - 1, Math.round(x))); y = Math.max(0, Math.min(gh - 1, Math.round(y)));
  if (ok(y * gw + x)) return y * gw + x;
  for (let r = 1; r < Math.max(gw, gh); r++) {
    let best = -1, bd = Infinity;
    for (let yy = y - r; yy <= y + r; yy++) {
      if (yy < 0 || yy >= gh) continue;
      const edge = yy === y - r || yy === y + r;
      for (let xx = x - r; xx <= x + r; xx += edge ? 1 : 2 * r) {
        if (xx < 0 || xx >= gw) continue;
        const k = yy * gw + xx; if (!ok(k)) continue;
        const d = (xx - x) * (xx - x) + (yy - y) * (yy - y);
        if (d < bd || (d === bd && k < best)) { bd = d; best = k; }
      }
    }
    if (best >= 0) return best;
  }
  return -1;
}

// the nearest cell to (x, y) where ok(k) that keeps its distance from the seeds already placed (each seed carries
// the radius of the disc its target would fill); the spacing relaxes until a cell is found
function spacedCell(gw, gh, x, y, ok, placed, r) {
  for (let f = 0.7; f > 0.01; f -= 0.15) {
    const k = nearestCell(gw, gh, x, y, j => { if (!ok(j)) return false; const jx = j % gw, jy = (j / gw) | 0;
      for (const s of placed) { const d = f * (r + s.r); if ((s.x - jx) * (s.x - jx) + (s.y - jy) * (s.y - jy) < d * d) return false; } return true; });
    if (k >= 0) { placed.push({ x: k % gw, y: (k / gw) | 0, r }); return k; }
  }
  const k = nearestCell(gw, gh, x, y, ok); if (k >= 0) placed.push({ x: k % gw, y: (k / gw) | 0, r }); return k;
}

// A warp from the release's land to the new land that keeps the share of land to the west of a point and, within a
// band of columns around it, to its north.
function landWarp(gw, gh, oldLand, newLand) {
  const cum = land => { const c = new Int32Array(gw * (gh + 1)); for (let x = 0; x < gw; x++) { let s = 0; for (let y = 0; y < gh; y++) { c[x * (gh + 1) + y] = s; s += land[y * gw + x] ? 1 : 0; } c[x * (gh + 1) + gh] = s; } return c; };
  const cO = cum(oldLand), cN = cum(newLand);
  const colX = c => { const a = new Float64Array(gw + 1); for (let x = 0; x < gw; x++) a[x + 1] = a[x] + c[x * (gh + 1) + gh]; return a; };
  const xO = colX(cO), xN = colX(cN);
  const inv = (A, q) => { // the column position where the cumulative share reaches q
    const tot = A[A.length - 1], t = q * tot; let lo = 0, hi = A.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (A[m] < t) lo = m; else hi = m; }
    const span = A[hi] - A[lo]; return lo + (span > 0 ? (t - A[lo]) / span : 0.5);
  };
  const band = 25;
  const below = (c, x0, y) => { let s = 0, t = 0; const yi = Math.max(0, Math.min(gh, Math.floor(y))), f = y - Math.floor(y);
    for (let x = Math.max(0, x0 - band); x <= Math.min(gw - 1, x0 + band); x++) {
      const base = x * (gh + 1); t += c[base + gh]; s += c[base + yi] + (yi < gh ? f * (c[base + Math.min(gh, yi + 1)] - c[base + yi]) : 0);
    } return [s, t]; };
  return (x, y) => { // release cell coordinates -> new cell coordinates
    const qx = (xO[Math.max(0, Math.min(gw, Math.floor(x)))] + (x - Math.floor(x)) * (xO[Math.min(gw, Math.floor(x) + 1)] - xO[Math.max(0, Math.min(gw, Math.floor(x)))])) / xO[gw];
    const nx = inv(xN, Math.max(0, Math.min(1, qx)));
    const [s, t] = below(cO, Math.round(x), y), qy = t > 0 ? s / t : 0.5;
    let lo = 0, hi = gh;
    for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2, [s2, t2] = below(cN, Math.round(nx), m); if ((t2 > 0 ? s2 / t2 : 0.5) < qy) lo = m; else hi = m; }
    return [nx, (lo + hi) / 2];
  };
}

// v2's biomes in the release's words
const BIO = (A.V2 && A.V2.continent && A.V2.continent.BIOME) || {};
VM.biomeWord = (b, t) => {
  switch (b) {
    case BIO.GRASSLAND: return t > 17 ? 'Savanna' : 'Dry woodland';
    case BIO.TEMPERATE_FOREST: return 'Temperate forest';
    case BIO.BOREAL_FOREST: return 'Taiga';
    case BIO.STEPPE: return t > 18 ? 'Savanna' : 'Steppe';
    case BIO.DESERT: return 'Desert';
    case BIO.SCRUB: return t > 19 ? 'Savanna' : 'Dry woodland';
    case BIO.WETLAND: return 'Marsh';
    case BIO.TUNDRA: return 'Tundra';
    case BIO.ALPINE: return 'Alpine highland';
    case BIO.SNOW: return 'Glacier';
    case BIO.RAINFOREST: return t > 20 ? 'Tropical rainforest' : 'Temperate rainforest';
    default: return null;   // beach, water
  }
};
// the release's dry words, and v2's dry cells (desert, steppe, and the hot grassland and scrub the release calls savanna)
VM.ARID_WORDS = /^(Desert|Steppe|Savanna|Salt flat)$/;
VM.aridCell = (b, t) => b === BIO.DESERT || b === BIO.STEPPE || (b === BIO.GRASSLAND && t > 17) || (b === BIO.SCRUB && t > 19);
// the smoothed river paths (in km) laid on the game's grid: each cell a path runs through keeps the largest flow there
VM.riverRaster = function (rivers, gw, gh) {
  const r = new Float32Array(gw * gh);
  for (const a of rivers) for (let i = 0; i + 5 < a.length; i += 3) {
    const x0 = a[i] / 10, y0 = a[i + 1] / 10, x1 = a[i + 3] / 10, y1 = a[i + 4] / 10, f = Math.min(a[i + 2], a[i + 5]);
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
    for (let s = 0; s <= n; s++) {
      const x = Math.floor(x0 + (x1 - x0) * s / n), y = Math.floor(y0 + (y1 - y0) * s / n);
      if (x < 0 || y < 0 || x >= gw || y >= gh) continue;
      const k = y * gw + x; if (f > r[k]) r[k] = f;
    }
  }
  return r;
};
const TERR_OF = { 'Temperate forest': 'forest', Taiga: 'forest', 'Tropical rainforest': 'forest', 'Temperate rainforest': 'forest',
  Steppe: 'steppe', Savanna: 'steppe', 'Dry woodland': 'plains', Desert: 'desert', Marsh: 'marsh', Tundra: 'tundra', Glacier: 'tundra', 'Alpine highland': 'hills' };

// D9 (map version 3): each province's terrain word from its own ground, in this order: mountains (the roughest and highest,
// by the release's quota), then what the ground plainly is (sand, marsh, ice), then hills (rough or high), then wood
// (unless it is settled lowland, which a medieval people had cleared to fields), then dry grass, then open plains. No word
// on more than VM.TERR_CAP of the provinces: past it, the provinces with the weakest claim to the word (the least rough,
// the least wooded, the least dry) take the next word their ground gives.
const WOOD_RX = /forest|Taiga|rainforest/i, SETTLED = { 'capital city': 1, city: 1, 'market town': 1, town: 1 };
VM.terrainOf = function (prov, M) {
  const share = (q, re) => { let c = 0; for (const w in q.bio) if (re.test(w)) c += q.bio[w]; return c / Math.max(1, q.n); };
  const score = q => q.elev + 2.5 * q.relief;
  const rank = prov.slice().sort((a, b) => score(b) - score(a) || a.id - b.id), nM = Math.round(M * VM.TERR_SHARE.mountains);
  const mount = new Set(); rank.forEach((q, i) => { if (i < nM && q.elev >= 1200) mount.add(q); });
  // each province's claims, strongest word first; the strength orders who gives way under the cap
  const claims = q => {
    const out = [];
    if (mount.has(q)) out.push(['mountains', 9]);
    const sand = share(q, /^Desert$/), marsh = share(q, /^Marsh$/), cold = share(q, /^(Tundra|Glacier)$/), wood = share(q, WOOD_RX), grass = share(q, /^(Steppe|Savanna)$/);
    if (sand >= 0.45) out.push(['desert', 2 + sand]);
    if (marsh >= 0.35) out.push(['marsh', 2 + marsh]);
    if (cold >= 0.45) out.push(['tundra', 2 + cold]);
    // hilly: the heights spread (relief, the sd of a province's heights); high country counts only where it is broken too, so
    // a high flat plateau stays open ground
    const rough = q.relief / VM.HILL.relief + Math.max(0, q.elev - VM.HILL.elev) / (4 * VM.HILL.elev);
    if (rough >= 1) out.push(['hills', rough]);
    const cleared = SETTLED[q.type] && q.elev < 400 && q.relief < VM.HILL.relief * 0.6;
    if (wood >= 0.5 && !cleared) out.push(['forest', wood]);
    if (grass >= 0.4) out.push(['steppe', grass]);
    if (wood >= 0.3 && !cleared && !out.some(c => c[0] === 'forest')) out.push(['forest', wood * 0.5]);
    // open plains, as strong as the province is open; its weaker leanings come after, for the cap
    const lean = [['forest', wood], ['steppe', grass], ['hills', rough * 0.6], ['marsh', marsh]].filter(c => c[1] >= 0.15 && !out.some(o => o[0] === c[0])).sort((a, b) => b[1] - a[1]);
    out.push(['plains', 1 - (lean.length ? lean[0][1] : 0)], ...lean);
    return out;
  };
  const C = prov.map(claims), at = prov.map(() => 0);
  for (let i = 0; i < prov.length; i++) prov[i].terr = C[i][0][0];
  const cap = Math.floor(M * VM.TERR_CAP);
  for (let round = 0; round < 12; round++) {
    const by = {}; prov.forEach((q, i) => { (by[q.terr] = by[q.terr] || []).push(i); });
    let moved = false;
    for (const t of Object.keys(by).sort()) {
      if (by[t].length <= cap) continue;
      const list = by[t].sort((a, b) => C[a][at[a]][1] - C[b][at[b]][1] || a - b);
      for (const i of list.slice(0, list.length - cap)) if (at[i] < C[i].length - 1) { at[i]++; prov[i].terr = C[i][at[i]][0]; moved = true; }
    }
    if (!moved) break;
  }
  for (const q of prov) if (q.terr === 'mountains' && !/Alpine|Glacier|Taiga/.test(q.biome)) q.biome = 'Alpine highland';
};

// base: { gw, gh, grid (the release's province grid), provinces: [{ id, realm, sx, sy, cells }] } (the map as written)
VM.build = function (seed, base, v = VM.VERSION) {
  const T = { t0: now() };
  const C = A.V2.continent;
  const gen = C.generateContinent(Object.assign({ width: VM.GW, height: VM.GH, seed }, VM.OPTS));
  T.gen = now() - T.t0;
  const gw = base.gw, gh = base.gh, N = gw * gh, GW = gen.W, GH = gen.H, fx = GW / gw, fy = GH / gh;
  // ---- 1. the land on the game's grid
  const elev = new Float32Array(N), gi = new Int32Array(N);
  for (let y = 0; y < gh; y++) {
    const v = Math.max(0, Math.min(GH - 1.001, (y + 0.5) * fy - 0.5)), yi = Math.floor(v), b = v - yi;
    for (let x = 0; x < gw; x++) {
      const u = Math.max(0, Math.min(GW - 1.001, (x + 0.5) * fx - 0.5)), xi = Math.floor(u), a = u - xi, k = yi * GW + xi;
      const e = gen.elev;
      elev[y * gw + x] = e[k] * (1 - a) * (1 - b) + e[k + 1] * a * (1 - b) + e[k + GW] * (1 - a) * b + e[k + GW + 1] * a * b;
      gi[y * gw + x] = Math.min(GH - 1, Math.round(v)) * GW + Math.min(GW - 1, Math.round(u));
    }
  }
  const landAll = new Uint8Array(N); for (let k = 0; k < N; k++) landAll[k] = elev[k] > 0 && gen.biome[gi[k]] !== BIO.LAKE ? 1 : 0;
  const comp = C.components(Float32Array.from(landAll, v => v ? 1 : -1), gw, gh);
  const land = new Uint8Array(N); let nLand = 0;
  if (comp.largest >= 0) for (const k of comp.list[comp.largest].cells) { land[k] = 1; nLand++; }
  // the sea that reaches the frame (lakes and drowned scraps are water, but not the sea)
  const ocean = new Uint8Array(N), q0 = [];
  for (let k = 0; k < N; k++) { const x = k % gw, y = (k / gw) | 0; if ((x === 0 || y === 0 || x === gw - 1 || y === gh - 1) && !land[k]) { ocean[k] = 1; q0.push(k); } }
  for (let h = 0; h < q0.length; h++) { const k = q0[h], x = k % gw; for (const j of [x > 0 ? k - 1 : -1, x < gw - 1 ? k + 1 : -1, k - gw, k + gw]) if (j >= 0 && j < N && !land[j] && !ocean[j]) { ocean[j] = 1; q0.push(j); } }
  // the cost of crossing each cell: slope, big rivers, height, and a fixed grain
  const cost = new Float32Array(N);
  for (let k = 0; k < N; k++) {
    if (!land[k]) continue;
    const x = k % gw, e = elev[k];
    const sl = Math.max(x > 0 ? Math.abs(e - elev[k - 1]) : 0, x < gw - 1 ? Math.abs(e - elev[k + 1]) : 0, k >= gw ? Math.abs(e - elev[k - gw]) : 0, k + gw < N ? Math.abs(e - elev[k + gw]) : 0);
    cost[k] = 1 + sl * 300 + (gen.acc[gi[k]] > 500 ? 5 : 0) + e * 6 + hash01(k) * 0.8;
  }
  // the dry cells, and the rivers on the game's grid (the drawn paths, so a town on a river is on the line you see)
  const arid = new Uint8Array(N), aridList = []; let nArid = 0;
  for (let k = 0; k < N; k++) if (land[k] && VM.aridCell(gen.biome[gi[k]], gen.temp[gi[k]])) { arid[k] = 1; nArid++; aridList.push(k); }
  const rivers = C.riverPaths(gen, VM.STREAM_T).map(pts => { const a = new Float32Array(pts.length * 3); pts.forEach(([u, v, f], i) => { a[3 * i] = (u + 0.5) / fx * 10; a[3 * i + 1] = (v + 0.5) / fy * 10; a[3 * i + 2] = f; }); return a; });
  const riv = VM.riverRaster(rivers, gw, gh);
  T.land = now() - T.t0;

  // ---- 2. who goes where: realms (and each unclaimed wild) carried by the warp
  const oldLand = new Uint8Array(N); for (let k = 0; k < N; k++) oldLand[k] = base.grid[k] >= 0 ? 1 : 0;
  const warp = landWarp(gw, gh, oldLand, land);
  const P = base.provinces, units = [], unitOf = {};
  for (const p of P) {
    const key = p.realm === 'unclaimed' || !p.realm ? 'u:' + p.id : p.realm;
    let u = unitOf[key]; if (!u) { u = unitOf[key] = { key, provs: [], cells: 0 }; units.push(u); }
    u.provs.push(p); u.cells += Math.max(1, p.cells || 1);
  }
  const totalCells = units.reduce((s, u) => s + u.cells, 0), used = new Uint8Array(N), placedU = [];
  const seedsU = [], targetsU = [];
  // realms whose names promise the sea (isles, a coast, a reef) take a seat on the shore, the isles on a peninsula,
  // and grow along the coast rather than inland, so the name fits the land
  const names = base.realmNames || {};
  for (const u of units) { const nm = names[u.key] || ''; u.sea = v < 2 ? null : VM.SEA_ID[u.key] || (VM.ISLE_RX.test(nm) ? 'peninsula' : VM.COAST_RX.test(nm) ? 'coast' : null); }
  // D9: a realm of the dry country in the release (its oases with it) is seated on dry land and keeps to it
  for (const u of units) { let a = 0, t = 0; for (const p of u.provs) { const c = Math.max(1, p.cells || 1); t += c; if (VM.ARID_WORDS.test(p.biome || '')) a += c; } u.arid = v >= 3 && nArid > 0 && t > 0 && a / t >= VM.ARID_REALM; }
  const toSea = new Float32Array(N).fill(1e9), qs = [];
  for (let k = 0; k < N; k++) if (ocean[k]) { toSea[k] = 0; qs.push(k); }
  for (let h = 0; h < qs.length; h++) { const k = qs[h], x = k % gw; for (const j of [x > 0 ? k - 1 : -1, x < gw - 1 ? k + 1 : -1, k - gw, k + gw]) if (j >= 0 && j < N && toSea[j] > toSea[k] + 1) { toSea[j] = toSea[k] + 1; qs.push(j); } }
  let expo = null;
  if (units.some(u => u.sea)) {     // the share of open sea within 12 cells of each cell (a summed-area table)
    const R = 12, sat = new Int32Array((gw + 1) * (gh + 1));
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) sat[(y + 1) * (gw + 1) + x + 1] = ocean[y * gw + x] + sat[y * (gw + 1) + x + 1] + sat[(y + 1) * (gw + 1) + x] - sat[y * (gw + 1) + x];
    expo = k => { const x = k % gw, y = (k / gw) | 0, x0 = Math.max(0, x - R), y0 = Math.max(0, y - R), x1 = Math.min(gw, x + R + 1), y1 = Math.min(gh, y + R + 1);
      return (sat[y1 * (gw + 1) + x1] - sat[y0 * (gw + 1) + x1] - sat[y1 * (gw + 1) + x0] + sat[y0 * (gw + 1) + x0]) / ((x1 - x0) * (y1 - y0)); };
  }
  // the share of dry land within R cells of each cell (a summed-area table, built once per radius)
  const drySat = (() => { if (!nArid) return null; const t = new Int32Array((gw + 1) * (gh + 1)); for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) t[(y + 1) * (gw + 1) + x + 1] = arid[y * gw + x] + t[y * (gw + 1) + x + 1] + t[(y + 1) * (gw + 1) + x] - t[y * (gw + 1) + x]; return t; })();
  const dryAround = R => k => { const x = k % gw, y = (k / gw) | 0, x0 = Math.max(0, x - R), y0 = Math.max(0, y - R), x1 = Math.min(gw, x + R + 1), y1 = Math.min(gh, y + R + 1), W1 = gw + 1;
    return (drySat[y1 * W1 + x1] - drySat[y0 * W1 + x1] - drySat[y1 * W1 + x0] + drySat[y0 * W1 + x0]) / ((x1 - x0) * (y1 - y0)); };
  // the sea realms are placed first (the shore is scarce), then the biggest, so the small ones fit in around them
  // (v3: the dry realms right after them, as dry country is scarce too)
  const order = units.map((u, i) => i).sort((a, b) => (units[b].sea ? 1 : 0) - (units[a].sea ? 1 : 0) || (units[b].arid ? 1 : 0) - (units[a].arid ? 1 : 0) || units[b].cells - units[a].cells || a - b), seatU = new Int32Array(units.length);
  for (const i of order) {
    const u = units[i], t = nLand * u.cells / totalCells, r = Math.sqrt(t / Math.PI);
    const cap = u.provs.find(p => p.type === 'capital city') || u.provs.slice().sort((a, b) => (b.pop || 0) - (a.pop || 0) || a.id - b.id)[0];
    const [nx, ny] = warp(cap.sx / 10 - 0.5, cap.sy / 10 - 0.5);
    let k = -1;
    if (u.sea) {   // the best shore cell: open to the sea (a peninsula's tip for the isles), not far from where the warp put it
      let best = -Infinity;
      for (let f = 0.7; k < 0 && f > 0.01; f -= 0.15) for (let j = 0; j < N; j++) {
        if (!land[j] || used[j] || toSea[j] > 1) continue;
        const jx = j % gw, jy = (j / gw) | 0;
        // the score first, the spacing test only for a cell that would win: the same cell, at a fraction of the cost
        const sc = (u.sea === 'peninsula' ? 2 : 0.6) * expo(j) - Math.hypot(jx - nx, jy - ny) / (gw * 0.35);
        if (!(sc > best)) continue;
        if (placedU.some(s => { const d = f * (r + s.r); return (s.x - jx) ** 2 + (s.y - jy) ** 2 < d * d; })) continue;
        best = sc; k = j;
      }
      if (k >= 0) placedU.push({ x: k % gw, y: (k / gw) | 0, r });
    }
    if (k < 0 && u.arid) {   // D9 (v3): the dry realm's seat is the dry cell with the most dry land around it, not far from the warp's
      const R = Math.max(4, Math.round(r)), dd = dryAround(R); let best = -Infinity;
      // over the dry cells only, in the same order (the whole grid was scanned for each dry realm: speed, CI long run 12)
      for (let f = 0.7; k < 0 && f > 0.01; f -= 0.15) for (const j of aridList) {
        if (used[j]) continue;
        const jx = j % gw, jy = (j / gw) | 0;
        // the score first, the spacing test only for a cell that would win (the same cell as testing every one, at a
        // fraction of the cost: the spacing test against every seat placed was most of a new game's map time, CI long run 12)
        const sc = 4 * dd(j) - Math.hypot(jx - nx, jy - ny) / (gw * 0.35);
        if (!(sc > best)) continue;
        if (placedU.some(s => { const d = f * (r + s.r); return (s.x - jx) ** 2 + (s.y - jy) ** 2 < d * d; })) continue;
        best = sc; k = j;
      }
      if (k >= 0) placedU.push({ x: k % gw, y: (k / gw) | 0, r });
    }
    if (k < 0) k = spacedCell(gw, gh, nx, ny, j => land[j] && !used[j], placedU, r);
    used[k] = 1; seatU[i] = k;
  }
  // a sea realm pays for every cell it holds away from the shore
  const bias = units.map(u => { if (!u.sea && !u.arid) return null; const b = new Float32Array(N);
    for (let k = 0; k < N; k++) if (land[k]) b[k] = (u.sea ? Math.max(0, toSea[k] - 2) * (u.sea === 'peninsula' ? 3 : 1.2) : 0) + (u.arid && !arid[k] ? VM.DRY_PAY : 0);
    return b; });
  // and a realm of green country pays a little for dry land, so the dry country is left to the dry realms (v3)
  if (units.some(u => u.arid)) { const g = new Float32Array(N); for (let k = 0; k < N; k++) if (arid[k]) g[k] = VM.GREEN_PAY; units.forEach((u, i) => { if (!u.arid && !bias[i]) bias[i] = g; }); }
  T.dry = nArid / Math.max(1, nLand);
  units.forEach((u, i) => { u.seat = seatU[i]; seedsU.push(seatU[i]); targetsU.push(Math.max(u.provs.length, nLand * u.cells / totalCells)); });
  const uOwner = new Int16Array(N).fill(-1);
  grow(gw, gh, land, 1, seedsU, targetsU, cost, uOwner, bias);
  T.realms = now() - T.t0;

  // ---- 3. each realm's land among its provinces, seeded where they lay inside the realm
  const grid = new Int16Array(N).fill(-1), seatOf = new Int32Array(P.length).fill(-1);
  const byUnit = units.map(() => []);
  for (let k = 0; k < N; k++) if (uOwner[k] >= 0) byUnit[uOwner[k]].push(k);
  const tag = new Int16Array(N).fill(-1); for (let k = 0; k < N; k++) tag[k] = uOwner[k];
  units.forEach((u, ui) => {
    const cells = byUnit[ui];
    if (u.provs.length === 1) { for (const k of cells) grid[k] = u.provs[0].id; seatOf[u.provs[0].id] = u.seat; return; }
    // fit the realm's old footprint (mean and spread of its provinces' sites) to the new one (mean and spread of its land)
    const st = pts => { let sx = 0, sy = 0, sw = 0; for (const [x, y, w] of pts) { sx += x * w; sy += y * w; sw += w; } const mx = sx / sw, my = sy / sw; let vx = 0, vy = 0; for (const [x, y, w] of pts) { vx += (x - mx) ** 2 * w; vy += (y - my) ** 2 * w; } return [mx, my, Math.sqrt(vx / sw) || 1, Math.sqrt(vy / sw) || 1]; };
    const o = st(u.provs.map(p => [p.sx / 10, p.sy / 10, Math.max(1, p.cells)]));
    const n = st(cells.map(k => [k % gw, (k / gw) | 0, 1]));
    const seeds = [], targets = [], pick = new Uint8Array(N), placed = [];
    const ordered = u.provs.slice().sort((a, b) => (a.type === 'capital city' ? -1 : 0) - (b.type === 'capital city' ? -1 : 0) || a.id - b.id);
    // D9: an oasis is seeded on the realm's dry land when it has any, and grows over dry land first
    const dryHere = v >= 3 && cells.some(k => arid[k]) && u.provs.some(p => p.type === 'oasis'), oasisBias = [];
    let wetPay = null, dryPay = null;
    for (const p of ordered) {
      let k = -1; const t = Math.max(1, cells.length * Math.max(1, p.cells) / u.cells), r = Math.sqrt(t / Math.PI);
      const tx = n[0] + (p.sx / 10 - o[0]) / o[2] * n[2] * 0.8, ty = n[1] + (p.sy / 10 - o[1]) / o[3] * n[3] * 0.8;
      const oasis = dryHere && p.type === 'oasis';
      if (p.type === 'capital city' && !pick[u.seat]) { k = u.seat; placed.push({ x: k % gw, y: (k / gw) | 0, r }); }
      else if (oasis) k = spacedCell(gw, gh, tx, ty, j => tag[j] === ui && !pick[j] && arid[j], placed, r);
      if (k < 0) k = spacedCell(gw, gh, tx, ty, j => tag[j] === ui && !pick[j], placed, r);
      if (dryHere && !wetPay) { wetPay = new Float32Array(N); dryPay = new Float32Array(N); for (const c of cells) { wetPay[c] = arid[c] ? 0 : 4; dryPay[c] = arid[c] ? 1.5 : 0; } }
      oasisBias.push(oasis ? wetPay : dryPay);   // the oases take the realm's dry land first; its other places leave it to them
      pick[k] = 1; seeds.push(k); targets.push(t);
    }
    const own = new Int16Array(N).fill(-1);
    grow(gw, gh, tag, ui, seeds, targets, cost, own, wetPay ? oasisBias : null);
    for (const k of cells) grid[k] = ordered[own[k]].id;
    ordered.forEach((p, i) => { seatOf[p.id] = seeds[i]; });
  });
  T.provs = now() - T.t0;

  // ---- 4. the fields the map decides
  const M = P.length, acc = Array.from({ length: M }, () => ({ n: 0, x: 0, y: 0, e: 0, e2: 0, t: 0, coast: false, adj: new Set(), bio: {}, dry: 0 }));
  for (let k = 0; k < N; k++) {
    const id = grid[k]; if (id < 0) continue;
    const a = acc[id], x = k % gw, y = (k / gw) | 0, em = Math.max(0, elev[k]) * VM.ELEV_M;
    a.n++; a.x += x; a.y += y; a.e += em; a.e2 += em * em; a.t += gen.temp[gi[k]];
    const w = VM.biomeWord(gen.biome[gi[k]], gen.temp[gi[k]]); if (w) a.bio[w] = (a.bio[w] || 0) + 1;
    if (arid[k]) a.dry++;
    for (const j of [x > 0 ? k - 1 : -1, x < gw - 1 ? k + 1 : -1, y > 0 ? k - gw : -1, y < gh - 1 ? k + gw : -1]) {
      if (j < 0) continue; const o = grid[j];
      if (o >= 0 && o !== id) a.adj.add(o); else if (o < 0 && ocean[j]) a.coast = true;
    }
  }
  // D9 (v3): a town stands on water. Its site moves from the seed to the nearest cell of its province on a river, a lake
  // shore or the sea's shore (within VM.SITE_R cells), a bigger river and an inland cell (not on the province's edge)
  // preferred; a province with no water in reach keeps its seed. Ties break by cell index.
  VM.waterSite = function (id, k0) {
    const x0 = k0 % gw, y0 = (k0 / gw) | 0, R = VM.SITE_R; let best = k0, bs = Infinity;
    for (let y = Math.max(0, y0 - R); y <= Math.min(gh - 1, y0 + R); y++) for (let x = Math.max(0, x0 - R); x <= Math.min(gw - 1, x0 + R); x++) {
      const k = y * gw + x; if (grid[k] !== id) continue;
      const d = Math.hypot(x - x0, y - y0); if (d > R) continue;
      let sea = false, lake = false, edge = false;
      for (const j of [x > 0 ? k - 1 : -1, x < gw - 1 ? k + 1 : -1, y > 0 ? k - gw : -1, y < gh - 1 ? k + gw : -1]) {
        if (j < 0) continue;
        if (grid[j] < 0) { if (ocean[j]) sea = true; else lake = true; } else if (grid[j] !== id) edge = true;
      }
      const f = riv[k]; if (!(f >= VM.STREAM_T || sea || lake)) continue;
      const sc = d - (f >= VM.STREAM_T ? Math.min(3, 0.5 + Math.log(f / VM.STREAM_T)) : 0) - (sea ? 1.5 : lake ? 1 : 0) + (edge ? 2.5 : 0);
      if (sc < bs - 1e-9) { bs = sc; best = k; }
    }
    return best;
  };
  const prov = P.map(p => {
    const a = acc[p.id], n = Math.max(1, a.n), cx = a.x / n, cy = a.y / n;
    const kc = nearestCell(gw, gh, cx, cy, j => grid[j] === p.id), ks = seatOf[p.id] >= 0 ? seatOf[p.id] : kc;
    const mean = a.e / n, sd = Math.sqrt(Math.max(0, a.e2 / n - mean * mean));
    let bio = null, bn = -1; for (const w of Object.keys(a.bio).sort()) if (a.bio[w] > bn) { bn = a.bio[w]; bio = w; }
    const site = v >= 3 && P[p.id].type !== 'oasis' ? VM.waterSite(p.id, ks) : ks;
    return { id: p.id, x: (kc % gw) * 10 + 5, y: ((kc / gw) | 0) * 10 + 5, sx: (site % gw) * 10 + 5, sy: ((site / gw) | 0) * 10 + 5,
      cells: a.n, adj: [...a.adj].sort((x, y) => x - y), sea: [], coast: a.coast, elev: Math.round(mean), relief: sd, temp: a.t / n, biome: bio || 'Dry woodland',
      bio: a.bio, n: a.n, dry: a.dry / n, type: P[p.id].type };
  });
  // terrain: mountains and hills by quota over the roughest, highest provinces; the rest by their biome (v1, v2); read
  // from the ground (v3, D9)
  if (v >= 3) VM.terrainOf(prov, M);
  else {
  const score = q => q.elev + 2.5 * q.relief;
  const rank = prov.slice().sort((a, b) => score(b) - score(a) || a.id - b.id);
  const nM = Math.round(M * VM.TERR_SHARE.mountains), nH = Math.round(M * VM.TERR_SHARE.hills);
  let hills = 0;
  rank.forEach((q, i) => {
    const t = TERR_OF[q.biome] || 'plains';
    if (i < nM && q.elev >= 1200) { q.terr = 'mountains'; if (!/Alpine|Glacier|Taiga/.test(q.biome)) q.biome = 'Alpine highland'; return; }
    if (t === 'desert' || t === 'marsh' || t === 'tundra') { q.terr = t; return; }
    if (hills < nH && q.elev >= 250) { q.terr = 'hills'; hills++; return; }
    q.terr = t === 'hills' ? 'mountains' : t;
  });
  }
  // D9 (v3): an oasis is a spring in dry country. One the land left off dry ground (its realm found too little of it) is no
  // oasis: it becomes a town named for the water it stands on, and the save keeps its old name (q.retype)
  if (v >= 3) for (const q of prov) {
    if (q.type !== 'oasis') continue;
    const site = Math.floor(q.sy / 10) * gw + Math.floor(q.sx / 10);
    if (VM.ARID_WORDS.test(q.biome) && arid[site]) continue;
    const k = VM.waterSite(q.id, site), x = k % gw, nb = [x > 0 ? k - 1 : -1, x < gw - 1 ? k + 1 : -1, k - gw, k + gw].filter(j => j >= 0 && j < N);
    const word = riv[k] >= VM.STREAM_T ? 'Ford' : nb.some(j => ocean[j]) ? 'Haven' : nb.some(j => grid[j] < 0) ? 'Mere'
      : q.terr === 'forest' ? 'Wood' : q.terr === 'hills' || q.terr === 'mountains' ? 'Hill' : 'Field';
    const was = P[q.id].name || '';
    q.retype = { type: 'town', name: /\bOasis\b/.test(was) ? was.replace(/\bOasis\b/, word) : was, was };
    q.sx = x * 10 + 5; q.sy = ((k / gw) | 0) * 10 + 5;
  }
  for (const q of prov) { delete q.relief; delete q.temp; delete q.bio; delete q.n; delete q.dry; delete q.type; }
  T.ms = now() - T.t0;
  const w = { seed, v, gw, gh, grid, prov, gen, rivers, riv, ocean, land: nLand, units: units.map((u, i) => ({ key: u.key, seat: u.seat, target: targetsU[i] })), T };
  // D9: the ground the game reads (roads, crossings, passes, cover, named features), from this world alone
  // Made when first read, not with the world (CI long run 12: it was a sixth of every new game, about 0.25 s, paid by every
  // life a test or the title screen makes and never plays; a life that plays reads it in its first month, for supply). The
  // inputs are taken now, so the ground is the same whenever it is made; w.ground is an enumerable getter, so a world the
  // worker builds (e-ahead) makes its ground there, off the page, when it is posted.
  if (A.V2.ground && typeof A.V2.ground.buildGround === 'function') {
    const G0 = A.V2.ground, args = { elev, gi, metres: VM.ELEV_M,
      places: P.map(p => ({ type: (prov[p.id].retype || {}).type || p.type, realm: p.realm })), params: { STREAM_T: VM.STREAM_T, RIVER_T: VM.RIVER_T } };
    const snap = { seed, gw, gh, grid, riv, ocean, rivers, gen: { biome: gen.biome, moist: gen.moist }, prov: prov.map(q => ({ sx: q.sx, sy: q.sy, adj: q.adj })) };
    let ground;
    Object.defineProperty(w, 'ground', { enumerable: true, configurable: true,
      get() { if (ground === undefined) { const t0 = now(); ground = G0.buildGround(snap, args); T.ground = now() - t0; args.elev = args.gi = null; } return ground; },
      set(v) { ground = v; } });
  }
  return w;
};
};
A.V2MAP.define(A);
