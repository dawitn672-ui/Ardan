// One realistic continent: plates -> uplift -> noise detail -> hydraulic erosion ->
// sea level -> single landmass guarantee -> rivers -> climate -> biomes -> provinces.
// Pure JS, no DOM. Deterministic from seed.
import { makeNoise } from './noise.js';
import { makeRng, clamp, smoothstep } from '../rng.js';

export const BIOME = {
  OCEAN: 0, SHALLOW: 1, BEACH: 2, GRASSLAND: 3, TEMPERATE_FOREST: 4, BOREAL_FOREST: 5,
  STEPPE: 6, DESERT: 7, SCRUB: 8, WETLAND: 9, TUNDRA: 10, ALPINE: 11, SNOW: 12, RAINFOREST: 13, LAKE: 14,
};
export const BIOME_NAME = Object.fromEntries(Object.entries(BIOME).map(([k, v]) => [v, k.toLowerCase().replace('_', ' ')]));

export function generateContinent(opts = {}) {
  const W = opts.width ?? 640, H = opts.height ?? 440;
  const seed = opts.seed ?? 'ardan';
  const landFraction = opts.landFraction ?? 0.37;
  const latTop = opts.latTop ?? 62, latBottom = opts.latBottom ?? 28; // degrees north
  const rng = makeRng(seed);
  const N = makeNoise(seed + ':n');
  const N2 = makeNoise(seed + ':m');
  const n = W * H;
  const elev = new Float32Array(n);
  const idx = (x, y) => y * W + x;

  // ---- 1. plates: a connected cluster of continental plates near the middle
  const plateCount = opts.plates ?? 11;
  const plates = [];
  for (let i = 0; i < plateCount; i++) {
    plates.push({ x: rng.float(0.05, 0.95) * W, y: rng.float(0.05, 0.95) * H,
      dx: rng.float(-1, 1), dy: rng.float(-1, 1), continental: false, base: 0 });
  }
  const cx = W * rng.float(0.45, 0.55), cy = H * rng.float(0.45, 0.55);
  const byCenter = plates.map((p, i) => [i, Math.hypot((p.x - cx) / W, (p.y - cy) / H)]).sort((a, b) => a[1] - b[1]);
  const contN = opts.continentalPlates ?? 5;
  byCenter.slice(0, contN).forEach(([i]) => { plates[i].continental = true; });
  plates.forEach((p) => { p.base = p.continental ? rng.float(0.25, 0.45) : rng.float(-0.55, -0.35); });

  const plateOf = new Int16Array(n);
  const boundary = new Float32Array(n); // 1 at boundary, 0 far
  const converge = new Float32Array(n);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const [wx, wy] = N.warp(x / W * 3, y / H * 3, 0.55, 1.2);
    const px = wx / 3 * W, py = wy / 3 * H;
    let b1 = -1, b2 = -1, d1 = 1e9, d2 = 1e9;
    for (let i = 0; i < plates.length; i++) {
      const d = (plates[i].x - px) ** 2 + (plates[i].y - py) ** 2;
      if (d < d1) { d2 = d1; b2 = b1; d1 = d; b1 = i; } else if (d < d2) { d2 = d; b2 = i; }
    }
    const k = idx(x, y);
    plateOf[k] = b1;
    const gap = Math.sqrt(d2) - Math.sqrt(d1);
    boundary[k] = Math.exp(-gap / (W * 0.035));
    const a = plates[b1], b = plates[b2];
    let nx = b.x - a.x, ny = b.y - a.y; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
    converge[k] = ((a.dx - b.dx) * nx + (a.dy - b.dy) * ny) * 0.5; // >0 colliding
  }

  // ---- 2. base elevation from plates, blurred so shelves slope naturally
  for (let k = 0; k < n; k++) elev[k] = plates[plateOf[k]].base;
  blur(elev, W, H, Math.round(W * 0.05), 3);

  // ---- 3. edge falloff keeps the continent off the frame edges (ocean all round)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const [fx, fy] = N2.warp(x / W * 2.5, y / H * 2.5, 0.35, 1.3);
    const dxn = (fx / 2.5 - 0.5) * 2, dyn = (fy / 2.5 - 0.5) * 2;
    const r = Math.pow(Math.pow(Math.abs(dxn), 2.6) + Math.pow(Math.abs(dyn), 2.6), 1 / 2.6);
    const e = 1 - smoothstep(0.7, 0.97, r);
    const k = idx(x, y);
    elev[k] = elev[k] * (0.25 + 0.75 * e) - (1 - e) * 0.6;
  }

  // ---- 4. detail: warped fBm coastlines, ridged ranges on convergent boundaries, old worn hills
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const k = idx(x, y);
    const u = x / W * 4, v = y / H * 4;
    const [wu, wv] = N2.warp(u, v, 1.5, 0.8);
    let h = elev[k];
    h += 0.95 * N.fbm(wu * 0.7, wv * 0.7, 3) + 0.75 * N.fbm(wu * 1.6, wv * 1.6, 4) + 0.45 * N.fbm(wu * 4.5, wv * 4.5, 6);
    const conv = clamp(converge[k], -1, 1);
    const ridge = N.ridged(wu * 1.6 + 3, wv * 1.6 - 2, 6);
    const isCont = plates[plateOf[k]].continental;
    if (conv > 0) h += boundary[k] * (0.2 + 0.85 * conv) * ridge * (isCont ? 1.0 : 0.7);
    else h += boundary[k] * conv * 0.55 * (0.6 + ridge * 0.6); // rifts: gulfs and inland seas
    h += 0.10 * smoothstep(0.35, 0.8, N2.fbm(u * 0.7 + 8, v * 0.7, 3)) * ridge; // interior worn uplands
    elev[k] = h;
  }

  // ---- 5. hydraulic erosion (droplets)
  normalize(elev);
  erode(elev, W, H, rng, opts.droplets ?? Math.round(n * 0.9));

  // ---- 6. sea level by quantile, then guarantee a single continent
  let sea = quantile(elev, 1 - landFraction);
  for (let k = 0; k < n; k++) elev[k] -= sea; // sea level = 0
  // a continent, not a crop: keep a band of open sea around the frame
  const band = Math.max(3, Math.round(Math.min(W, H) * 0.02));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = Math.min(x, y, W - 1 - x, H - 1 - y);
    if (d < band * 2) { const k = idx(x, y); const t = d / (band * 2); elev[k] = Math.min(elev[k], -0.03 + t * 0.06 * (elev[k] > 0 ? 1 : 0)); if (d < band) elev[k] = Math.min(elev[k], -0.03); }
  }
  const comps = components(elev, W, H);
  const mainId = comps.largest;
  let removed = 0, keptIslands = 0;
  for (const c of comps.list) {
    if (c.id === mainId) continue;
    const tiny = c.size < n * 0.0012;
    if (tiny && keptIslands < (opts.maxIslands ?? 14)) { keptIslands++; continue; }
    for (const k of c.cells) elev[k] = -0.07 - Math.abs(elev[k]) * 0.5; // drown below the shelf
    removed++;
  }
  // reshape land: broad lowlands, peaky highlands (real hypsometry: most land is low)
  let maxE = 0; for (let k = 0; k < n; k++) if (elev[k] > maxE) maxE = elev[k];
  for (let k = 0; k < n; k++) if (elev[k] > 0) elev[k] = 0.62 * Math.pow(elev[k] / maxE, 1.7);
  // lakes: inland water bodies that are not ocean-connected
  const ocean = oceanMask(elev, W, H);

  // ---- 7. climate
  const temp = new Float32Array(n), moist = new Float32Array(n);
  for (let y = 0; y < H; y++) {
    const lat = latTop + (latBottom - latTop) * (y / (H - 1));
    for (let x = 0; x < W; x++) {
      const k = idx(x, y);
      const e = Math.max(0, elev[k]);
      temp[k] = 30 - (lat - 20) * 0.62 - e * 40 + N2.fbm(x / W * 3, y / H * 3, 3) * 4; // deg C, rough annual mean
    }
  }
  // prevailing westerlies: moisture carried west->east, dropped on land, more on uplift
  for (let y = 0; y < H; y++) {
    let carry = 1.0;
    for (let x = 0; x < W; x++) {
      const k = idx(x, y);
      if (elev[k] <= 0) { carry = Math.min(1.2, carry + 0.06); moist[k] = carry; continue; }
      const prev = x > 0 ? Math.max(0, elev[k - 1]) : 0;
      const uplift = Math.max(0, elev[k] - prev) * 40;
      const drop = carry * (0.0011 + uplift * 0.05);
      moist[k] = clamp(carry * 0.85 + uplift * 0.25 + N.fbm(x / W * 5 + 3, y / H * 5, 4) * 0.35, 0, 1.4);
      carry = Math.max(0.05, carry - drop);
    }
  }
  blur(moist, W, H, 4, 2);
  // a little moisture from the south/east coasts too
  const coastDist = distanceToWater(elev, W, H);
  for (let k = 0; k < n; k++) if (elev[k] > 0) moist[k] = clamp(moist[k] * 0.92 + 0.15 * Math.exp(-coastDist[k] / 25), 0, 1.4);

  // ---- 8. rivers (priority-flood fill + D8 accumulation)
  const { flowTo, acc } = rivers(elev, moist, W, H);

  // ---- 9. biomes
  const biome = new Uint8Array(n);
  const shelf = 0.06;
  for (let k = 0; k < n; k++) {
    const e = elev[k], t = temp[k], m = moist[k];
    if (e <= 0) { biome[k] = ocean[k] ? (e > -shelf ? BIOME.SHALLOW : BIOME.OCEAN) : BIOME.LAKE; continue; }
    if (e > 0.5 || t < -6) { biome[k] = BIOME.SNOW; continue; }
    if (e > 0.36) { biome[k] = BIOME.ALPINE; continue; }
    if (coastDist[k] < 1.5 && e < 0.012 && m < 0.9) { biome[k] = BIOME.BEACH; continue; }
    if (t < 0) biome[k] = BIOME.TUNDRA;
    else if (t < 5) biome[k] = m > 0.35 ? BIOME.BOREAL_FOREST : BIOME.TUNDRA;
    else if (t < 15) biome[k] = m > 0.95 && e < 0.03 ? BIOME.WETLAND : m > 0.55 ? BIOME.TEMPERATE_FOREST : m > 0.3 ? BIOME.GRASSLAND : m > 0.16 ? BIOME.STEPPE : BIOME.DESERT;
    else biome[k] = m > 1.0 ? BIOME.RAINFOREST : m > 0.6 ? BIOME.TEMPERATE_FOREST : m > 0.38 ? BIOME.SCRUB : m > 0.2 ? BIOME.STEPPE : BIOME.DESERT;
  }

  const oceanDepth = Float32Array.from(elev, (v) => Math.min(0, v)); blur(oceanDepth, W, H, 3, 2);
  const map = { W, H, seed, elev, oceanDepth, temp, moist, biome, flowTo, acc, ocean, coastDist, latTop, latBottom,
    stats: { removedLandmasses: removed, keptIslands, plates: plates.length } };
  map.provinces = makeProvinces(map, rng, opts.provinces ?? 160);
  return map;
}

// ---------------- helpers ----------------
function normalize(a) {
  let lo = Infinity, hi = -Infinity;
  for (const v of a) { if (v < lo) lo = v; if (v > hi) hi = v; }
  for (let i = 0; i < a.length; i++) a[i] = (a[i] - lo) / (hi - lo);
}

function quantile(a, q) {
  const s = Float32Array.from(a).sort();
  return s[Math.floor(clamp(q, 0, 1) * (s.length - 1))];
}

export function blur(a, W, H, r, passes = 1) {
  if (r < 1) return;
  const tmp = new Float32Array(a.length);
  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < H; y++) {
      let s = 0, c = 0;
      for (let x = -r; x <= r; x++) { const xx = clamp(x, 0, W - 1); s += a[y * W + xx]; c++; }
      for (let x = 0; x < W; x++) {
        tmp[y * W + x] = s / c;
        const add = clamp(x + r + 1, 0, W - 1), sub = clamp(x - r, 0, W - 1);
        s += a[y * W + add] - a[y * W + sub];
      }
    }
    for (let x = 0; x < W; x++) {
      let s = 0, c = 0;
      for (let y = -r; y <= r; y++) { const yy = clamp(y, 0, H - 1); s += tmp[yy * W + x]; c++; }
      for (let y = 0; y < H; y++) {
        a[y * W + x] = s / c;
        const add = clamp(y + r + 1, 0, H - 1), sub = clamp(y - r, 0, H - 1);
        s += tmp[add * W + x] - tmp[sub * W + x];
      }
    }
  }
}

// Particle hydraulic erosion (after H. T. Beyer, 2015).
function erode(h, W, H, rng, drops) {
  const inertia = 0.05, capacityF = 4, minCap = 0.01, erodeS = 0.3, depositS = 0.3, evap = 0.015, gravity = 4, maxSteps = 48;
  const radius = 2;
  const brushOff = [], brushW = [];
  let wsum = 0;
  for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
    const d = Math.hypot(dx, dy); if (d > radius) continue;
    const w = 1 - d / radius; brushOff.push([dx, dy]); brushW.push(w); wsum += w;
  }
  for (let i = 0; i < brushW.length; i++) brushW[i] /= wsum;
  const scale = 0.06; // erosion strength relative to normalized height
  // height and gradient at (x, y), bilinear, written to gH, gX, gY: the same arithmetic, no object per step
  let gH = 0, gX = 0, gY = 0;
  const hg = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), u = x - xi, v = y - yi;
    const k = yi * W + xi;
    const a = h[k], b = h[k + 1], c = h[k + W], d = h[k + W + 1];
    gH = a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
    gX = (b - a) * (1 - v) + (d - c) * v; gY = (c - a) * (1 - u) + (d - b) * u;
  };
  const nB = brushOff.length, bOX = Int32Array.from(brushOff, (o) => o[0]), bOY = Int32Array.from(brushOff, (o) => o[1]), bW = Float64Array.from(brushW);
  for (let i = 0; i < drops; i++) {
    let x = rng.float(1, W - 2), y = rng.float(1, H - 2), dx = 0, dy = 0, speed = 1, water = 1, sed = 0;
    for (let s = 0; s < maxSteps; s++) {
      const xi = Math.floor(x), yi = Math.floor(y), u = x - xi, v = y - yi;
      hg(x, y); const g0 = gH;
      dx = dx * inertia - gX * (1 - inertia); dy = dy * inertia - gY * (1 - inertia);
      const len = Math.hypot(dx, dy); if (len < 1e-9) break;
      dx /= len; dy /= len;
      const nx = x + dx, ny = y + dy;
      if (nx < 1 || ny < 1 || nx >= W - 2 || ny >= H - 2) break;
      hg(nx, ny);
      const dh = gH - g0;
      const cap = Math.max(-dh * speed * water * capacityF, minCap * scale);
      const k = yi * W + xi;
      if (sed > cap || dh > 0) {
        const dep = dh > 0 ? Math.min(dh, sed) : (sed - cap) * depositS;
        sed -= dep;
        h[k] += dep * (1 - u) * (1 - v); h[k + 1] += dep * u * (1 - v); h[k + W] += dep * (1 - u) * v; h[k + W + 1] += dep * u * v;
      } else {
        const amt = Math.min((cap - sed) * erodeS, -dh);
        for (let b = 0; b < nB; b++) {
          const bx = xi + bOX[b], by = yi + bOY[b];
          if (bx < 0 || by < 0 || bx >= W || by >= H) continue;
          const kk = by * W + bx; const take = Math.min(h[kk], amt * bW[b]);
          h[kk] -= take; sed += take;
        }
      }
      speed = Math.min(4, Math.sqrt(Math.max(0, speed * speed - dh * gravity)));
      water *= 1 - evap; x = nx; y = ny;
    }
  }
}

export function components(elev, W, H) {
  const n = W * H, comp = new Int32Array(n).fill(-1), list = [];
  let largest = -1, best = 0;
  const stack = [];
  for (let s = 0; s < n; s++) {
    if (elev[s] <= 0 || comp[s] >= 0) continue;
    const id = list.length, cells = [];
    comp[s] = id; stack.push(s);
    while (stack.length) {
      const k = stack.pop(); cells.push(k);
      const x = k % W, y = (k / W) | 0;
      if (x > 0 && elev[k - 1] > 0 && comp[k - 1] < 0) { comp[k - 1] = id; stack.push(k - 1); }
      if (x < W - 1 && elev[k + 1] > 0 && comp[k + 1] < 0) { comp[k + 1] = id; stack.push(k + 1); }
      if (y > 0 && elev[k - W] > 0 && comp[k - W] < 0) { comp[k - W] = id; stack.push(k - W); }
      if (y < H - 1 && elev[k + W] > 0 && comp[k + W] < 0) { comp[k + W] = id; stack.push(k + W); }
    }
    list.push({ id, size: cells.length, cells });
    if (cells.length > best) { best = cells.length; largest = id; }
  }
  return { comp, list, largest };
}

function oceanMask(elev, W, H) {
  const n = W * H, o = new Uint8Array(n), q = [];
  for (let x = 0; x < W; x++) { q.push(x, (H - 1) * W + x); }
  for (let y = 0; y < H; y++) { q.push(y * W, y * W + W - 1); }
  for (const k of q) o[k] = 1;
  while (q.length) {
    const k = q.pop(), x = k % W, y = (k / W) | 0;
    for (const kk of [x > 0 ? k - 1 : -1, x < W - 1 ? k + 1 : -1, y > 0 ? k - W : -1, y < H - 1 ? k + W : -1]) {
      if (kk >= 0 && !o[kk] && elev[kk] <= 0) { o[kk] = 1; q.push(kk); }
    }
  }
  return o;
}

function distanceToWater(elev, W, H) {
  const n = W * H, d = new Float32Array(n).fill(1e9), q = [];
  for (let k = 0; k < n; k++) if (elev[k] <= 0) { d[k] = 0; q.push(k); }
  let head = 0;
  while (head < q.length) {
    const k = q[head++], x = k % W, y = (k / W) | 0;
    for (const kk of [x > 0 ? k - 1 : -1, x < W - 1 ? k + 1 : -1, y > 0 ? k - W : -1, y < H - 1 ? k + W : -1]) {
      if (kk >= 0 && d[kk] > d[k] + 1) { d[kk] = d[k] + 1; q.push(kk); }
    }
  }
  return d;
}

// A binary min-heap on typed arrays (keys as doubles). Sifts move a hole instead of swapping pairs; the comparisons
// are the ones the pair-swapping version made, so the pop order (ties included) is the same.
class MinHeap {
  constructor(cap = 1024) { this.k = new Float64Array(cap); this.v = new Int32Array(cap); this.n = 0; this.lastKey = 0; }
  push(key, val) {
    if (this.n === this.k.length) { const k2 = new Float64Array(this.n * 2), v2 = new Int32Array(this.n * 2); k2.set(this.k); v2.set(this.v); this.k = k2; this.v = v2; }
    const K = this.k, V = this.v; let i = this.n++;
    while (i > 0) { const p = (i - 1) >> 1; if (K[p] <= key) break; K[i] = K[p]; V[i] = V[p]; i = p; }
    K[i] = key; V[i] = val;
  }
  pop() {
    const K = this.k, V = this.v; const top = V[0], tk = K[0]; const n = --this.n;
    if (n > 0) {
      const lk = K[n], lv = V[n]; let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1; let m = -1, mk = lk;
        if (l < n && K[l] < mk) { m = l; mk = K[l]; } if (r < n && K[r] < mk) { m = r; mk = K[r]; }
        if (m < 0) break;
        K[i] = K[m]; V[i] = V[m]; i = m;
      }
      K[i] = lk; V[i] = lv;
    }
    this.lastKey = tk; return top;
  }
  get size() { return this.n; }
}

function rivers(elev, moist, W, H) {
  const n = W * H, filled = Float32Array.from(elev), done = new Uint8Array(n), flowTo = new Int32Array(n).fill(-1);
  const heap = new MinHeap();
  for (let k = 0; k < n; k++) if (elev[k] <= 0) { done[k] = 1; heap.push(filled[k], k); }
  const order = [];
  const D = [-1, 1, -W, W, -W - 1, -W + 1, W - 1, W + 1];
  while (heap.size) {
    const k = heap.pop(); order.push(k);
    const x = k % W;
    for (const d of D) {
      const kk = k + d; if (kk < 0 || kk >= n) continue;
      const xx = kk % W; if (Math.abs(xx - x) > 1) continue;
      if (done[kk]) continue;
      done[kk] = 1;
      filled[kk] = Math.max(filled[kk], filled[k] + 1e-6);
      flowTo[kk] = k;
      heap.push(filled[kk], kk);
    }
  }
  const acc = new Float32Array(n);
  for (let k = 0; k < n; k++) acc[k] = elev[k] > 0 ? 0.2 + moist[k] : 0;
  for (let i = order.length - 1; i >= 0; i--) { const k = order[i]; const t = flowTo[k]; if (t >= 0 && elev[k] > 0) acc[t] += acc[k]; }
  return { flowTo, acc };
}

// Provinces: seeds on land grown by travel cost (mountains and big rivers are expensive), then realms.
function makeProvinces(map, rng, count) {
  const { W, H, elev, acc } = map, n = W * H;
  const land = [];
  for (let k = 0; k < n; k++) if (elev[k] > 0 && elev[k] < 0.4) land.push(k);
  const seeds = [];
  const minD = Math.sqrt(land.length / count) * 0.8;
  let tries = 0;
  while (seeds.length < count && tries++ < count * 60) {
    const k = rng.pick(land), x = k % W, y = (k / W) | 0;
    if (seeds.every((s) => Math.hypot(s.x - x, s.y - y) > minD)) seeds.push({ k, x, y });
  }
  const owner = new Int16Array(n).fill(-1), cost = new Float64Array(n).fill(Infinity);
  const heap = new MinHeap();
  seeds.forEach((s, i) => { cost[s.k] = 0; heap.push(0, s.k); owner[s.k] = i; });
  while (heap.size) {
    const k = heap.pop(); const c = heap.lastKey; if (c > cost[k]) continue;
    const x = k % W;
    for (const d of [-1, 1, -W, W]) {
      const kk = k + d; if (kk < 0 || kk >= n) continue; if (Math.abs((kk % W) - x) > 1) continue;
      if (elev[kk] <= 0) continue;
      const step = 1 + Math.abs(elev[kk] - elev[k]) * 400 + (acc[kk] > 400 ? 6 : 0) + elev[kk] * 8;
      const nc = c + step;
      if (nc < cost[kk]) { cost[kk] = nc; owner[kk] = owner[k]; heap.push(nc, kk); }
    }
  }
  const provs = seeds.map((s, i) => ({ id: i, x: s.x, y: s.y, cells: 0, neighbors: new Set() }));
  for (let k = 0; k < n; k++) {
    const o = owner[k]; if (o < 0) continue; provs[o].cells++;
    const r = k + 1, b = k + W;
    if ((k % W) < W - 1 && owner[r] >= 0 && owner[r] !== o) { provs[o].neighbors.add(owner[r]); provs[owner[r]].neighbors.add(o); }
    if (b < n && owner[b] >= 0 && owner[b] !== o) { provs[o].neighbors.add(owner[b]); provs[owner[b]].neighbors.add(o); }
  }
  provs.forEach((p) => { p.neighbors = [...p.neighbors]; });
  return { owner, list: provs };
}

// Smoothed river polylines for vector drawing (canvas in the browser, AA splats in Node).
// Each path runs from a source down to the sea; width grows with flow.
export function riverPaths(map, threshold = 260) {
  const { W, elev, acc, flowTo } = map;
  const n = elev.length, isRiver = new Uint8Array(n), upstream = new Int32Array(n);
  for (let k = 0; k < n; k++) if (elev[k] > 0 && acc[k] > threshold) { isRiver[k] = 1; const t = flowTo[k]; if (t >= 0) upstream[t]++; }
  const paths = [];
  const visited = new Uint8Array(n);
  for (let k = 0; k < n; k++) {
    if (!isRiver[k]) continue;
    // a source: a river cell with no river cell flowing into it
    let hasUp = false;
    // cheap check via upstream count of river cells
    if (upstream[k] > 0) { hasUp = true; }
    if (hasUp) continue;
    const pts = []; let c = k;
    while (c >= 0) {
      pts.push([c % W, (c / W) | 0, acc[c]]);
      if (visited[c] || elev[c] <= 0) break;
      visited[c] = 1; c = flowTo[c];
    }
    if (pts.length > 3) paths.push(chaikin(chaikin(chaikin(relax(relax(pts))))));
  }
  return paths;
}
function relax(p) {
  return p.map((q, i) => {
    if (i === 0 || i === p.length - 1) return q;
    const a = p[Math.max(0, i - 2)], b = p[i - 1], c = p[i + 1], d = p[Math.min(p.length - 1, i + 2)];
    return [(a[0] + b[0] + q[0] + c[0] + d[0]) / 5, (a[1] + b[1] + q[1] + c[1] + d[1]) / 5, q[2]];
  });
}
function chaikin(p) {
  const o = [p[0]];
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i], b = p[i + 1];
    o.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25, a[2]], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75, b[2]]);
  }
  o.push(p[p.length - 1]);
  return o;
}
