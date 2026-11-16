// A throwaway trial behind docs/design/economy-and-items.md §1.8: how long would one month of the E1 economy take,
// and how big are its stores in a save? It is not game code and nothing builds from it.
//
//   node docs/design/trials/economy-month.mjs [goods=28] [caravans=240] [known=12]
//
// What it does: every province that is not wild land is a market (281); stores are integers on typed arrays; routes
// are the lore map's land borders (a wild province is crossed by a road to the two nearest markets beyond it);
// production and need are random numbers scaled so the world makes 1.06 of what it uses (45-economy's rule), so the
// prices it reaches mean nothing: only the amount of arithmetic is like the design's. A month is: make and use, price
// every cell, carters on every route from the month's opening prices, then caravans that arrive, sell, and weigh the
// `known` nearest markets for their next run. Measured 2026-11-13 on the shared 4-core container, node 22:
//   28 goods, 240 caravans, 12 known markets: median 1.1 to 1.4 ms, 95th 1.6 to 2.3 ms; stores 32 KB raw, 15 KB gzipped
//   40 goods, 480 caravans, 24 known markets: median 2.5 to 2.6 ms; stores 46 KB raw, 21 KB gzipped
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const L = JSON.parse(fs.readFileSync(path.join(root, 'src/core/release/core/00-lore.json'), 'utf8'));
const provs = L.map.provinces;
const NG = +(process.argv[2] || 28), NC = +(process.argv[3] || 240), KNOWN = +(process.argv[4] || 12);

// markets, and the routes between them
const mIdx = new Int32Array(provs.length).fill(-1), mk = [];
for (const p of provs) if (p.type !== 'unclaimed land') { mIdx[p.id] = mk.length; mk.push(p); }
const NM = mk.length;
const seen = new Set(), E = [];
const add = (a, b, len) => { if (a < 0 || b < 0 || a === b) return; const k = a < b ? a * 1000 + b : b * 1000 + a; if (seen.has(k)) return; seen.add(k); E.push([a, b, len]); };
const steps = (p, q) => Math.hypot(p.x - q.x, p.y - q.y) / 250;
for (const p of provs) for (const q of p.adj) {
  const P = provs[q];
  if (mIdx[p.id] >= 0 && mIdx[q] >= 0) add(mIdx[p.id], mIdx[q], steps(p, P));
  else if (mIdx[p.id] >= 0) {
    const far = P.adj.filter(x => mIdx[x] >= 0 && x !== p.id).map(x => [steps(p, provs[x]), x]).sort((a, b) => a[0] - b[0]).slice(0, 2);
    for (const [d, x] of far) add(mIdx[p.id], mIdx[x], d * 1.3);
  }
}
const NE = E.length;
const ea = Int32Array.from(E.map(e => e[0])), eb = Int32Array.from(E.map(e => e[1])), el = Float32Array.from(E.map(e => e[2]));

// a seeded stream (the v2 engine's generator), so every run is the same run
let s = 12345;
const rnd = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

const N = NM * NG;
const base = new Float32Array(NG); for (let g = 0; g < NG; g++) base[g] = 3 + Math.floor(rnd() * rnd() * 400);
const stock = new Int32Array(N), need = new Float32Array(N), made = new Float32Array(N), price = new Float32Array(N), delta = new Int32Array(N);
for (let m = 0; m < NM; m++) {
  const pop = mk[m].pop / 1e4;
  for (let g = 0; g < NG; g++) { const i = m * NG + g; need[i] = pop * (0.02 + rnd() * 0.5); made[i] = need[i] * (rnd() < 0.3 ? 2.6 * rnd() + 0.6 : 0.55 * rnd() + 0.2); stock[i] = Math.round(need[i] * 300); }
}
for (let g = 0; g < NG; g++) {
  let a = 0, b = 0;
  for (let m = 0; m < NM; m++) { a += made[m * NG + g]; b += need[m * NG + g]; }
  for (let m = 0; m < NM; m++) made[m * NG + g] *= 1.06 * b / a;
}
// a store is hundredths of a load; three months of need is its normal level
const prices = () => { for (let i = 0; i < N; i++) { const n = need[i] * 300, st = stock[i] > n * 0.05 ? stock[i] : n * 0.05; let f = Math.sqrt(n / st); if (f < 0.6) f = 0.6; else if (f > 4) f = 4; price[i] = base[i % NG] * f; } };

// each market's `known` nearest markets within four steps of road: what a caravan there weighs
const nb = Array.from({ length: NM }, () => []);
for (let e = 0; e < NE; e++) { nb[ea[e]].push(eb[e]); nb[eb[e]].push(ea[e]); }
const reach = [], hops = [];
for (let m = 0; m < NM; m++) {
  const d = new Map([[m, 0]]); let fr = [m];
  for (let h = 1; h <= 4; h++) { const nx = []; for (const u of fr) for (const v of nb[u]) if (!d.has(v)) { d.set(v, h); nx.push(v); } fr = nx; }
  d.delete(m);
  const near = [...d.entries()].sort((a, b) => a[1] - b[1] || a[0] - b[0]).slice(0, KNOWN);
  reach.push(Int32Array.from(near.map(x => x[0]))); hops.push(Int8Array.from(near.map(x => x[1])));
}
const cav = []; for (let c = 0; c < NC; c++) cav.push({ at: Math.floor(rnd() * NM), eta: Math.floor(rnd() * 4), g: -1, n: 0, to: -1 });

const HARVEST = [0, 0, 0, 0, 0, 0.4, 1.4, 3.2, 3.6, 2.4, 0.6, 0.4];   // 45-economy's grain year, for good 0
function month(mo) {
  const hv = HARVEST[mo % 12];
  // 1. make and use
  for (let m = 0; m < NM; m++) { const o = m * NG; for (let g = 0; g < NG; g++) { const i = o + g; const v = stock[i] + Math.round((made[i] * (g === 0 ? hv : 1) - need[i]) * 100); stock[i] = v < 0 ? 0 : v; } }
  prices();
  // 2. carters on every route, from the opening prices, applied together
  delta.fill(0);
  for (let e = 0; e < NE; e++) {
    const a = ea[e] * NG, b = eb[e] * NG, len = el[e];
    for (let g = 0; g < NG; g++) {
      const c1 = base[g] * (0.03 + 0.03 * len), c2 = 0.2 + 0.2 * len, cart = c1 > c2 ? c1 : c2;   // 66-markets' carting
      let gap = price[b + g] - price[a + g], from = a + g, to = b + g;
      if (gap < 0) { gap = -gap; from = b + g; to = a + g; }
      if (gap <= cart) continue;
      const spare = stock[from] - need[from] * 120; if (spare <= 0) continue;
      const want = need[to] * 360 - stock[to]; if (want <= 0) continue;
      const q = Math.round((spare < want ? spare : want) * 0.25 * (gap - cart) / gap);
      if (q > 0) { delta[from] -= q; delta[to] += q; }
    }
  }
  for (let i = 0; i < N; i++) { const v = stock[i] + delta[i]; stock[i] = v < 0 ? 0 : v; }
  // 3. caravans: those that arrive sell, weigh the markets they know, load and leave
  for (let c = 0; c < NC; c++) {
    const C = cav[c]; if (--C.eta > 0) continue;
    if (C.to >= 0) { stock[C.to * NG + C.g] += C.n; C.at = C.to; }
    const R = reach[C.at], H = hops[C.at], o = C.at * NG; let best = 0, bg = -1, bt = -1;
    for (let j = 0; j < R.length; j++) {
      const d = R[j] * NG, h = H[j];
      for (let g = 0; g < NG; g++) { const gain = price[d + g] - price[o + g] * 1.1 - base[g] * (0.06 + 0.02 * h); if (gain > best && stock[o + g] > need[o + g] * 120) { best = gain; bg = g; bt = R[j]; } }
    }
    if (bg >= 0) { const n = Math.min(1500, Math.round((stock[o + bg] - need[o + bg] * 120) * 0.3)); stock[o + bg] -= n; C.g = bg; C.n = n; C.to = bt; C.eta = 1 + (rnd() < 0.5 ? 1 : 0); }
    else { C.to = -1; C.eta = 1; }
  }
}

for (let i = 0; i < 240; i++) month(i);   // twenty years to warm up
const T = [];
for (let i = 0; i < 1200; i++) { const t0 = performance.now(); month(i); T.push(performance.now() - t0); }
T.sort((a, b) => a - b);
const raw = JSON.stringify(Array.from(stock));
console.log(JSON.stringify({ markets: NM, goods: NG, cells: N, routes: NE, caravans: NC, known: KNOWN,
  monthMs: { median: +T[600].toFixed(2), p95: +T[1140].toFixed(2), worst: +T[1199].toFixed(2) },
  storesInASave: { rawBytes: raw.length, gzipBytes: zlib.gzipSync(raw).length } }));
