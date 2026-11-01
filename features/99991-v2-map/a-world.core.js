// The v2 continent as the game's world (step 2 of docs/v2/V2_SPEC.md, complaints 3 and 4).
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
const VM = A.V2MAP = A.V2MAP || {};
VM.VERSION = 1;
VM.GW = 467; VM.GH = 300;                       // the generator's grid: 15 km cells over the release's 7,000 x 4,500 km
VM.OPTS = { landFraction: 0.38, latTop: 56, latBottom: 16, maxIslands: 0, provinces: 1 };
VM.ELEV_M = 8000;
VM.RIVER_T = 120;                               // flow (v2's accumulated moisture) where a river begins                               // v2's land height (0 to 0.62) in metres
VM.TERR_SHARE = { mountains: 0.065, hills: 0.41 };   // the release's mix: 20 and 126 of 306 provinces
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
function grow(gw, gh, allowed, tag, seeds, targets, cost, owner) {
  const R = seeds.length, heaps = [], count = new Float64Array(R), active = new Uint8Array(R), dist = new Float64Array(R);
  const nb = [0, 0, 0, 0];
  const pushNb = (r, k, d) => {
    const x = k % gw;
    nb[0] = x > 0 ? k - 1 : -1; nb[1] = x < gw - 1 ? k + 1 : -1; nb[2] = k >= gw ? k - gw : -1; nb[3] = k + gw < gw * gh ? k + gw : -1;
    for (let i = 0; i < 4; i++) { const j = nb[i]; if (j >= 0 && allowed[j] === tag && owner[j] < 0) heaps[r].push(d + cost[j], j); }
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
  const k = nearestCell(gw, gh, x, y, ok); placed.push({ x: k % gw, y: (k / gw) | 0, r }); return k;
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
const TERR_OF = { 'Temperate forest': 'forest', Taiga: 'forest', 'Tropical rainforest': 'forest', 'Temperate rainforest': 'forest',
  Steppe: 'steppe', Savanna: 'steppe', 'Dry woodland': 'plains', Desert: 'desert', Marsh: 'marsh', Tundra: 'tundra', Glacier: 'tundra', 'Alpine highland': 'hills' };

// base: { gw, gh, grid (the release's province grid), provinces: [{ id, realm, sx, sy, cells }] } (the map as written)
VM.build = function (seed, base) {
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
  // the biggest realms are placed first, so the small ones fit in around them
  const order = units.map((u, i) => i).sort((a, b) => units[b].cells - units[a].cells || a - b), seatU = new Int32Array(units.length);
  for (const i of order) {
    const u = units[i], t = nLand * u.cells / totalCells;
    const cap = u.provs.find(p => p.type === 'capital city') || u.provs.slice().sort((a, b) => (b.pop || 0) - (a.pop || 0) || a.id - b.id)[0];
    const [nx, ny] = warp(cap.sx / 10 - 0.5, cap.sy / 10 - 0.5);
    const k = spacedCell(gw, gh, nx, ny, j => land[j] && !used[j], placedU, Math.sqrt(t / Math.PI));
    used[k] = 1; seatU[i] = k;
  }
  units.forEach((u, i) => { u.seat = seatU[i]; seedsU.push(seatU[i]); targetsU.push(Math.max(u.provs.length, nLand * u.cells / totalCells)); });
  const uOwner = new Int16Array(N).fill(-1);
  grow(gw, gh, land, 1, seedsU, targetsU, cost, uOwner);
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
    for (const p of ordered) {
      let k; const t = Math.max(1, cells.length * Math.max(1, p.cells) / u.cells), r = Math.sqrt(t / Math.PI);
      if (p.type === 'capital city' && !pick[u.seat]) { k = u.seat; placed.push({ x: k % gw, y: (k / gw) | 0, r }); }
      else k = spacedCell(gw, gh, n[0] + (p.sx / 10 - o[0]) / o[2] * n[2] * 0.8, n[1] + (p.sy / 10 - o[1]) / o[3] * n[3] * 0.8, j => tag[j] === ui && !pick[j], placed, r);
      pick[k] = 1; seeds.push(k); targets.push(t);
    }
    const own = new Int16Array(N).fill(-1);
    grow(gw, gh, tag, ui, seeds, targets, cost, own);
    for (const k of cells) grid[k] = ordered[own[k]].id;
    ordered.forEach((p, i) => { seatOf[p.id] = seeds[i]; });
  });
  T.provs = now() - T.t0;

  // ---- 4. the fields the map decides
  const M = P.length, acc = Array.from({ length: M }, () => ({ n: 0, x: 0, y: 0, e: 0, e2: 0, t: 0, coast: false, adj: new Set(), bio: {} }));
  for (let k = 0; k < N; k++) {
    const id = grid[k]; if (id < 0) continue;
    const a = acc[id], x = k % gw, y = (k / gw) | 0, em = Math.max(0, elev[k]) * VM.ELEV_M;
    a.n++; a.x += x; a.y += y; a.e += em; a.e2 += em * em; a.t += gen.temp[gi[k]];
    const w = VM.biomeWord(gen.biome[gi[k]], gen.temp[gi[k]]); if (w) a.bio[w] = (a.bio[w] || 0) + 1;
    for (const j of [x > 0 ? k - 1 : -1, x < gw - 1 ? k + 1 : -1, y > 0 ? k - gw : -1, y < gh - 1 ? k + gw : -1]) {
      if (j < 0) continue; const o = grid[j];
      if (o >= 0 && o !== id) a.adj.add(o); else if (o < 0 && ocean[j]) a.coast = true;
    }
  }
  const prov = P.map(p => {
    const a = acc[p.id], n = Math.max(1, a.n), cx = a.x / n, cy = a.y / n;
    const kc = nearestCell(gw, gh, cx, cy, j => grid[j] === p.id), ks = seatOf[p.id] >= 0 ? seatOf[p.id] : kc;
    const mean = a.e / n, sd = Math.sqrt(Math.max(0, a.e2 / n - mean * mean));
    let bio = null, bn = -1; for (const w of Object.keys(a.bio).sort()) if (a.bio[w] > bn) { bn = a.bio[w]; bio = w; }
    return { id: p.id, x: (kc % gw) * 10 + 5, y: ((kc / gw) | 0) * 10 + 5, sx: (ks % gw) * 10 + 5, sy: ((ks / gw) | 0) * 10 + 5,
      cells: a.n, adj: [...a.adj].sort((x, y) => x - y), sea: [], coast: a.coast, elev: Math.round(mean), relief: sd, temp: a.t / n, biome: bio || 'Dry woodland' };
  });
  // terrain: mountains and hills by quota over the roughest, highest provinces; the rest by their biome
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
  for (const q of prov) { delete q.relief; delete q.temp; }
  T.ms = now() - T.t0;
  const rivers = C.riverPaths(gen, VM.RIVER_T).map(pts => { const a = new Float32Array(pts.length * 3); pts.forEach(([u, v, f], i) => { a[3 * i] = (u + 0.5) / fx * 10; a[3 * i + 1] = (v + 0.5) / fy * 10; a[3 * i + 2] = f; }); return a; });
  return { seed, v: VM.VERSION, gw, gh, grid, prov, gen, rivers, land: nLand, units: units.map((u, i) => ({ key: u.key, seat: u.seat, target: targetsU[i] })), T };
};
