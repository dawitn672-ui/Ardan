// Provinces of the far lands, grown from the geography (step 5-7 of the plan's stage 2): seeds by Poisson disc,
// spaced by how many people the ground can feed (small in the river basins and deltas, huge in steppe, desert and
// taiga); grown by a flood fill whose cost follows the slope, so bounds fall on ridges; merged when tiny; joined by
// shared edges, by straits under 50 km, and by sea lanes until every province can be reached.
import { rng, edt, Heap, clamp, smooth, blur } from './lib.mjs';
import { CELL } from './geo.mjs';
import * as PLAN from './plan.mjs';

export const DENS = {      // people a km2, by biome, before rivers, coasts and height
  Glacier: 0.01, 'Alpine highland': 0.7, Desert: 0.12, Tundra: 0.05, Taiga: 0.45, Steppe: 2.2, 'Temperate forest': 9,
  'Temperate rainforest': 5, 'Dry woodland': 13, Savanna: 5, 'Tropical monsoon forest': 20, 'Tropical rainforest': 7, Marsh: 14,
};

export function provinces(G, base, seed, KA = 50000) {
  const { N, GW, GH, land, inBase, elev, biome, river, toSeaD } = G;
  const far = i => land[i] && !inBase(i);
  const R = rng(seed + 101);
  // ---- people the ground holds
  const toBig = edt(GW, GH, i => river[i] === 2), toMtn = edt(GW, GH, i => elev[i] > 2600 && land[i]);
  const dens = new Float32Array(N), landOf = landOfCells(G);
  for (let i = 0; i < N; i++) {
    if (!far(i)) continue;
    const b = biome[i]; let d = (DENS[b] ?? 1) * (PLAN.CROWD[landOf[i]] || 1);
    if (river[i] === 1) d *= 2.2; else if (river[i] === 2) d *= 4;
    if (b !== 'Glacier' && b !== 'Tundra') d *= 1 + 2.2 * Math.exp(-toBig[i] / 3);
    if (toSeaD[i] <= 2 && b !== 'Desert' && b !== 'Tundra' && b !== 'Glacier') d *= 1.5;
    d *= 1 - 0.55 * smooth(1500, 3800, elev[i]);
    if (b === 'Desert' && (river[i] || toMtn[i] < 5)) d = Math.max(d, 2.5);      // the oases at the mountains' feet
    dens[i] = d;
  }
  // with the lore, each region holds the people the lore gives it, spread as the ground would have them
  if (G.plan && G.plan.lore) {
    const sum = new Float64Array(G.regions.length);
    for (let i = 0; i < N; i++) if (far(i) && G.label[i] >= 0) sum[G.label[i]] += dens[i] * CELL * CELL;
    const k = G.regions.map((r, j) => sum[j] > 0 ? r.people / sum[j] : 1);
    for (let i = 0; i < N; i++) if (far(i) && G.label[i] >= 0) dens[i] *= k[G.label[i]];
  }
  // ---- seeds, spaced by the ground (the people averaged over about 100 km, so a river through a desert gives a few
  // round provinces along it, not a comb of strips)
  const densS = blur(blur(dens, GW, GH, 0, 8), GW, GH, 1, 8);
  const rad = i => 0.93 * Math.sqrt(clamp(KA / Math.sqrt(Math.max(dens[i] * 0.35, densS[i]) + 0.05), 4500, 180000)) / CELL;   // in cells
  // no far seed within 220 km of the old map's edge: the Known World's own edge provinces grow across it first, so
  // its realms' borders run on into the new land instead of along a ruler line
  const dbox = i => { const bx = (i % GW) - G.OX, by = ((i / GW) | 0) - G.OY; return Math.hypot(Math.max(0, bx - base.gw + 0.5, -bx - 0.5), Math.max(0, by - base.gh + 0.5, -by - 0.5)) * CELL; };
  const cand = []; for (let i = 0; i < N; i++) if (far(i) && dbox(i) >= 220) cand.push(i);
  R.shuffle(cand);
  const B = 6, BW = Math.ceil(GW / B), buckets = new Map(), seeds = [], seedR = [];
  const near = (i, r) => {
    const x = i % GW, y = (i / GW) | 0, bx = Math.floor(x / B), by = Math.floor(y / B), k = Math.ceil(r / B) + 1;
    for (let yy = by - k; yy <= by + k; yy++) for (let xx = bx - k; xx <= bx + k; xx++) {
      const l = buckets.get(yy * BW + xx); if (!l) continue;
      for (const s of l) { const sx = seeds[s] % GW, sy = (seeds[s] / GW) | 0, dd = Math.hypot(sx - x, sy - y); if (dd < Math.min(r, seedR[s])) return true; }
    }
    return false;
  };
  const addSeed = i => { const s = seeds.length; seeds.push(i); seedR.push(rad(i)); const k = Math.floor(((i / GW) | 0) / B) * BW + Math.floor((i % GW) / B); let l = buckets.get(k); if (!l) buckets.set(k, l = []); l.push(s); };
  for (const i of cand) if (!near(i, rad(i))) addSeed(i);
  // every piece of land (an island) has a seed of its own
  const comp = new Int32Array(N).fill(-1), comps = [];
  for (let s = 0; s < N; s++) {
    if (!far(s) || comp[s] >= 0) continue;
    const q = [s]; comp[s] = comps.length;
    for (let h = 0; h < q.length; h++) { const i = q[h], x = i % GW; for (const j of [x > 0 ? i - 1 : -1, x < GW - 1 ? i + 1 : -1, i - GW, i + GW]) if (j >= 0 && j < N && far(j) && comp[j] < 0) { comp[j] = comps.length; q.push(j); } }
    comps.push(q);
  }
  const seeded = new Set(seeds.map(i => comp[i]));
  comps.forEach((q, c) => { if (!seeded.has(c)) { let best = q[0]; for (const i of q) if (toSeaD[i] > toSeaD[best]) best = i; addSeed(best); } });

  // ---- grow: every seed floods outward; a step costs more uphill and downhill, so the fronts meet on the ridges
  // labels: 0.. a far seed; -1 nobody; -2 - q the Known World's province q, carried across the seam
  const own = new Int32Array(N).fill(-1), dist = new Float64Array(N).fill(Infinity), hp = new Heap();
  seeds.forEach((i, s) => { own[i] = s; dist[i] = 0; hp.push(0, i); });
  const baseAt = i => G.baseCell(i);
  for (let i = 0; i < N; i++) {
    if (!far(i) || own[i] >= 0) continue;
    const x = i % GW, y = (i / GW) | 0;
    for (const j of [x > 0 ? i - 1 : -1, y > 0 ? i - GW : -1, x < GW - 1 ? i + 1 : -1, y < GH - 1 ? i + GW : -1]) { const q = j >= 0 ? baseAt(j) : -1; if (q >= 0) { own[i] = -2 - q; dist[i] = 0; hp.push(0, i); break; } }
  }
  const step = (i, j) => 1 + Math.abs(elev[j] - elev[i]) / 110 + (river[j] === 2 && river[i] !== 2 ? 1.5 : 0) + (biome[j] !== biome[i] ? 0.4 : 0);
  while (hp.size) {
    const i = hp.pop(), d = hp.lastKey; if (d > dist[i]) continue;
    const x = i % GW;
    for (const j of [x > 0 ? i - 1 : -1, x < GW - 1 ? i + 1 : -1, i - GW, i + GW]) {
      if (j < 0 || j >= N || !far(j)) continue;
      const nd = d + step(i, j) * (own[i] <= -2 ? 0.8 : 1);
      if (nd < dist[j]) { dist[j] = nd; own[j] = own[i]; hp.push(nd, j); }
    }
  }
  // ---- merge the tiny: a province under 25 cells joins the neighbour it shares most border with (an islet, the
  // nearest province across the water within 150 km)
  const relabel = () => {
    const size = new Map(); for (let i = 0; i < N; i++) if (own[i] >= 0) size.set(own[i], (size.get(own[i]) || 0) + 1);
    return size;
  };
  for (let round = 0; round < 6; round++) {
    const size = relabel(), small = [...size.entries()].filter(([, n]) => n < 25).map(([s]) => s).sort((a, b) => a - b);
    if (!small.length) break;
    const border = new Map(), cellsOf = new Map();
    for (let i = 0; i < N; i++) {
      const a = own[i]; if (a < 0 || size.get(a) >= 25) continue;
      let cl = cellsOf.get(a); if (!cl) cellsOf.set(a, cl = []); cl.push(i);
      const x = i % GW;
      for (const j of [x > 0 ? i - 1 : -1, x < GW - 1 ? i + 1 : -1, i - GW, i + GW]) {
        if (j < 0 || j >= N) continue; const b = own[j]; if (b === -1 || b === a) continue;
        let m = border.get(a); if (!m) border.set(a, m = new Map()); m.set(b, (m.get(b) || 0) + 1);
      }
    }
    const into = new Map();
    for (const a of small) {
      const m = border.get(a);
      if (m && m.size) { let best = -1, bn = -1; for (const [b, n] of [...m.entries()].sort((p, q) => p[0] - q[0])) if (n > bn) { bn = n; best = b; } if (best !== -1 && !into.has(best)) into.set(a, best); continue; }
      // an islet: the nearest other province within 15 cells across the water
      const cells = cellsOf.get(a) || [];
      const seen = new Map(cells.map(i => [i, 0])), q = cells.slice(); let hit = -1;
      for (let h = 0; h < q.length && hit < 0; h++) {
        const i = q[h], dd = seen.get(i); if (dd >= 15) continue; const x = i % GW;
        for (const j of [x > 0 ? i - 1 : -1, x < GW - 1 ? i + 1 : -1, i - GW, i + GW]) {
          if (j < 0 || j >= N || seen.has(j)) continue; seen.set(j, dd + 1);
          if (own[j] !== -1 && own[j] !== a) { hit = own[j]; break; }
          if (!land[j]) q.push(j);
        }
      }
      if (hit !== -1 && size.get(a) < 12 && !into.has(hit)) into.set(a, hit);
    }
    if (!into.size) break;
    for (let i = 0; i < N; i++) if (into.has(own[i])) own[i] = into.get(own[i]);
  }
  // renumber 0..n-1 by the first cell in reading order (west to east within rows, north to south)
  const order = new Map(); for (let i = 0; i < N; i++) if (own[i] >= 0 && !order.has(own[i])) order.set(own[i], order.size);
  for (let i = 0; i < N; i++) if (own[i] >= 0) own[i] = order.get(own[i]);
  const n = order.size, nb = base.provinces.length;

  // ---- province records
  const P = Array.from({ length: n }, (_, k) => ({ k, id: nb + k, cells: 0, sx: 0, sy: 0, e: 0, e2: 0, pop: 0, bio: {}, river: 0, coast: false, list: [] }));
  for (let i = 0; i < N; i++) {
    const k = own[i]; if (k < 0) continue;
    const p = P[k], x = i % GW, y = (i / GW) | 0;
    p.cells++; p.sx += x; p.sy += y; p.e += elev[i]; p.e2 += elev[i] * elev[i]; p.pop += dens[i] * CELL * CELL; p.list.push(i);
    p.bio[biome[i]] = (p.bio[biome[i]] || 0) + 1 + dens[i] * 0.02;
    if (river[i] > p.river) p.river = river[i];
    for (const j of [x > 0 ? i - 1 : -1, x < GW - 1 ? i + 1 : -1, y > 0 ? i - GW : -1, y < GH - 1 ? i + GW : -1]) if (j >= 0 && !land[j]) p.coast = true;
  }
  for (const p of P) {
    p.cx = p.sx / p.cells; p.cy = p.sy / p.cells; p.elev = Math.round(p.e / p.cells); p.relief = Math.sqrt(Math.max(0, p.e2 / p.cells - (p.e / p.cells) ** 2));
    p.biome = Object.entries(p.bio).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0][0];
    // the site: a well-peopled cell near the middle (the town the name belongs to)
    let best = p.list[0], bs = -1;
    for (const i of p.list) { const x = i % GW, y = (i / GW) | 0, dd = Math.hypot(x - p.cx, y - p.cy) / Math.sqrt(p.cells), s = (dens[i] + 0.2) * Math.exp(-2.2 * dd * dd) * (toSeaD[i] >= 1 ? 1 : 0.6); if (s > bs) { bs = s; best = i; } }
    p.site = best;
    p.x = Math.round(G.F.x0 + p.cx * CELL + 5); p.y = Math.round(G.F.y0 + p.cy * CELL + 5);
    p.sx = G.F.x0 + (best % GW) * CELL + 5; p.sy = G.F.y0 + ((best / GW) | 0) * CELL + 5;
    if (G.plan && G.plan.lore) { const t = new Map(); for (const i of p.list) { const l = G.label[i]; if (l >= 0) t.set(l, (t.get(l) || 0) + 1); } const top = [...t.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]; const r = G.regions[top ? top[0] : 0]; p.region = r.id; p.land = r.land; }
    p.pop = Math.round(p.pop);
    p.comp = comp[p.list[0]];
    p.compCells = comps[p.comp].length;
  }
  // what the Known World's edge provinces gained across the seam
  const ext = new Map();
  for (let i = 0; i < N; i++) {
    if (own[i] > -2) continue;
    const q = -2 - own[i], x = i % GW, y = (i / GW) | 0;
    let e = ext.get(q); if (!e) ext.set(q, e = { cells: 0, coast: false });
    e.cells++;
    for (const j of [x > 0 ? i - 1 : -1, x < GW - 1 ? i + 1 : -1, y > 0 ? i - GW : -1, y < GH - 1 ? i + GW : -1]) if (j >= 0 && !land[j]) e.coast = true;
  }

  // ---- adjacency: shared edges, with the Known World across the seam
  const adj = Array.from({ length: n }, () => new Set()), seam = new Map(), baseBase = new Map();
  const provAt = i => own[i] >= 0 ? nb + own[i] : own[i] <= -2 ? -2 - own[i] : baseAt(i);
  const linkBase = (q, idf) => { let l = seam.get(q); if (!l) seam.set(q, l = new Set()); l.add(idf); };
  const baseAdj = new Map(base.provinces.map(p => [p.id, new Set(p.adj.concat(p.sea || []))]));
  for (let i = 0; i < N; i++) {
    if (inBase(i) || !land[i]) continue;
    const a = provAt(i); if (a < 0) continue; const x = i % GW, y = (i / GW) | 0;
    for (const j of [x < GW - 1 ? i + 1 : -1, y < GH - 1 ? i + GW : -1, x > 0 ? i - 1 : -1, y > 0 ? i - GW : -1]) {
      if (j < 0 || j >= N) continue;
      const b = provAt(j); if (b < 0 || b === a) continue;
      if (a >= nb && b >= nb) { adj[a - nb].add(b); adj[b - nb].add(a); }
      else if (a >= nb) { adj[a - nb].add(b); linkBase(b, a); }
      else if (b >= nb) { adj[b - nb].add(a); linkBase(a, b); }
      else if (!baseAdj.get(a).has(b)) {   // two of the Known World's provinces that now meet across the seam
        for (const [u, v] of [[a, b], [b, a]]) { let l = baseBase.get(u); if (!l) baseBase.set(u, l = new Set()); l.add(v); }
      }
    }
  }
  // straits: land within 5 cells (50 km) across the water
  let straits = 0;
  for (let i = 0; i < N; i++) {
    const a = own[i]; if (a < 0 || !P[a].coast) continue;   // (the Known World's own straits are its own)
    const x = i % GW, y = (i / GW) | 0;
    if (![x > 0 ? i - 1 : -1, x < GW - 1 ? i + 1 : -1, y > 0 ? i - GW : -1, y < GH - 1 ? i + GW : -1].some(j => j >= 0 && !land[j])) continue;
    const seen = new Map([[i, 0]]), q = [i];
    for (let h = 0; h < q.length; h++) {
      const c = q[h], dd = seen.get(c); if (dd >= 5) continue; const cx = c % GW;
      for (const j of [cx > 0 ? c - 1 : -1, cx < GW - 1 ? c + 1 : -1, c - GW, c + GW]) {
        if (j < 0 || j >= N || seen.has(j)) continue; seen.set(j, dd + 1);
        if (!land[j]) { q.push(j); continue; }
        if (dd === 0) continue;                       // land right next to us is a shared edge, not a strait
        const b = provAt(j); if (b < 0 || b === nb + a || adj[a].has(b)) continue;
        adj[a].add(b); straits++;
        if (b >= nb) adj[b - nb].add(nb + a); else linkBase(b, nb + a);
      }
    }
  }
  // sea lanes: join every piece the land and the straits leave apart, by its nearest crossing
  const sea = Array.from({ length: n }, () => new Set()), seaBase = new Map();
  const all = nb + n, par = Int32Array.from({ length: all }, (_, k) => k), find = k => { while (par[k] !== k) { par[k] = par[par[k]]; k = par[k]; } return k; };
  const unite = (a, b) => { a = find(a); b = find(b); if (a !== b) par[Math.max(a, b)] = Math.min(a, b); };
  base.provinces.forEach(p => { for (const j of p.adj.concat(p.sea || [])) unite(p.id, j); });
  for (const [u, l] of baseBase) for (const v of l) unite(u, v);
  for (let k = 0; k < n; k++) for (const j of adj[k]) unite(nb + k, j);
  let lanes = 0;
  const baseCells = new Map(); for (let i = 0; i < N; i++) { const q = own[i] <= -2 ? -2 - own[i] : baseAt(i); if (q >= 0) { let l = baseCells.get(q); if (!l) baseCells.set(q, l = []); l.push(i); } }
  const cellsOfProv = id => id >= nb ? P[id - nb].list : (baseCells.get(id) || []);
  for (let guard = 0; guard < 600; guard++) {
    const roots = new Map(); for (let k = 0; k < all; k++) { const r = find(k); roots.set(r, (roots.get(r) || 0) + 1); }
    if (roots.size <= 1) break;
    const main = find(0);
    // the smallest piece not joined to the main land looks outward across the water for the nearest other land
    const pieces = [...roots.entries()].filter(([r]) => r !== main).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    const r0 = pieces[0][0];
    const src = []; for (let id = 0; id < all; id++) if (find(id) === r0) for (const i of cellsOfProv(id)) src.push(i);
    const seen = new Uint8Array(N); for (const i of src) seen[i] = 1;
    let q = src.slice(), hit = null;
    for (let d = 0; d < 400 && q.length && !hit; d++) {
      const nq = [];
      for (const c of q) {
        const cx = c % GW;
        for (const j of [cx > 0 ? c - 1 : -1, cx < GW - 1 ? c + 1 : -1, c - GW, c + GW]) {
          if (j < 0 || j >= N || seen[j]) continue; seen[j] = 1;
          const b = provAt(j);
          if (b >= 0 && find(b) !== r0) { hit = [c, b]; break; }
          if (!land[j]) nq.push(j);
        }
        if (hit) break;
      }
      q = nq;
    }
    if (!hit) break;
    // the province on our side: walk back to the nearest cell of the piece
    let from = -1, bd = 1e9; const hx = hit[0] % GW, hy = (hit[0] / GW) | 0;
    for (const i of src) { const dd = Math.hypot(i % GW - hx, ((i / GW) | 0) - hy); if (dd < bd) { bd = dd; from = provAt(i); } }
    const a = from, b = hit[1];
    const addSea = (u, v) => { if (u >= nb) sea[u - nb].add(v); else { let l = seaBase.get(u); if (!l) seaBase.set(u, l = new Set()); l.add(v); } };
    addSea(a, b); addSea(b, a); unite(a, b); lanes++;
  }
  return { own, P, n, adj, sea, seam, seaBase, baseBase, ext, dens, straits, lanes, comps: comps.length };
}

// the land of each cell: its nearest anchor
export function landOfCells(G) {
  const { GW } = G;
  if (G.plan && G.plan.lore) return Array.from(G.label, (l, i) => G.land[i] && !G.inBase(i) && l >= 0 ? G.regions[l].land : null);
  const anchors = []; for (const code in PLAN.LANDS) for (const [x, y] of PLAN.LANDS[code].anchors) anchors.push({ code, x: x / CELL, y: y / CELL });
  const out = new Array(G.N).fill(null);
  for (let i = 0; i < G.N; i++) {
    if (!G.land[i] || G.inBase(i)) continue;
    const x = i % GW, y = (i / GW) | 0; let best = null, bd = 1e18;
    for (const a of anchors) { const d = (a.x - x) ** 2 + (a.y - y) ** 2; if (d < bd) { bd = d; best = a.code; } }
    out[i] = best;
  }
  return out;
}
// ---- the ten Far Lands and their regions of about 400,000 km2 (rule G6)
export function regions(P, G) {
  if (G && G.plan && G.plan.lore) {      // the lore's lands and regions, read from the cells
    const out = {};
    for (const p of P) { const o = out[p.land] || (out[p.land] = { name: (G.plan.landNames || {})[p.land] || p.land, area: 0, regions: new Set() }); o.area += p.cells * 100; o.regions.add(p.region); }
    for (const k in out) out[k].regions = [...out[k].regions].sort();
    return Object.fromEntries(Object.keys(out).sort().map(k => [k, out[k]]));
  }
  const anchors = [];
  for (const code in PLAN.LANDS) for (const [x, y] of PLAN.LANDS[code].anchors) anchors.push({ code, x, y });
  for (const p of P) {
    let best = null, bd = 1e12;
    for (const a of anchors) { const d = (a.x - p.x) ** 2 + (a.y - p.y) ** 2; if (d < bd) { bd = d; best = a.code; } }
    if (p.elev >= 3000 && p.x < 12000 && p.x > 7000 && p.y > 2250 && p.y < 3600) best = 'H';
    if ((p.biome === 'Tundra' || p.biome === 'Glacier') && p.y < 1000) best = 'N';
    p.land = best;
  }
  const byLand = {};
  for (const p of P) (byLand[p.land] = byLand[p.land] || []).push(p);
  const out = {};
  for (const code of Object.keys(byLand).sort()) {
    const L = byLand[code], area = L.reduce((s, p) => s + p.cells * 100, 0), k = Math.max(1, Math.round(area / 400000));
    // farthest-point start from the westernmost province, then k-means weighted by area
    const C = [L.slice().sort((a, b) => a.x - b.x || a.y - b.y)[0]].map(p => ({ x: p.x, y: p.y }));
    while (C.length < k) { let best = null, bd = -1; for (const p of L) { const d = Math.min(...C.map(c => (c.x - p.x) ** 2 + (c.y - p.y) ** 2)); if (d > bd) { bd = d; best = p; } } C.push({ x: best.x, y: best.y }); }
    for (let it = 0; it < 12; it++) {
      const acc = C.map(() => ({ x: 0, y: 0, w: 0 }));
      for (const p of L) { let bi = 0, bd = 1e18; C.forEach((c, i) => { const d = (c.x - p.x) ** 2 + (c.y - p.y) ** 2; if (d < bd) { bd = d; bi = i; } }); p._r = bi; acc[bi].x += p.x * p.cells; acc[bi].y += p.y * p.cells; acc[bi].w += p.cells; }
      C.forEach((c, i) => { if (acc[i].w) { c.x = acc[i].x / acc[i].w; c.y = acc[i].y / acc[i].w; } });
    }
    const rank = C.map((c, i) => ({ c, i })).sort((a, b) => a.c.x - b.c.x || a.c.y - b.c.y), codeOf = new Map(rank.map((r, j) => [r.i, `${code}-${String(j + 1).padStart(2, '0')}`]));
    for (const p of L) { p.region = codeOf.get(p._r); delete p._r; }
    out[code] = { name: PLAN.LANDS[code].name, area, regions: [...codeOf.values()].sort() };
  }
  return out;
}
