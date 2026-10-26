// Geography of the far lands, cell by cell (10 km cells): land and sea, relief, rivers, climate and biome.
// Layer one of docs/research/world-foundations.md: plates make the walls (the ranges of plan.mjs), latitude makes the
// belts, distance from the sea and the rain shadows make the deserts (G2), rivers run from the wet mountains to the
// sea or to a salt lake (G3). The Known World's cells are read, never written.
import { rng, perlin, fbm, ridged, edt, fillPolygon, drawLine, spline, Heap, clamp, smooth, lerp, blur as blurA } from './lib.mjs';
import * as PLAN from './plan.mjs';

export const CELL = 10;
export const GW = PLAN.FRAME.W / CELL, GH = PLAN.FRAME.H / CELL;

// latitude of a row: the Known World runs from 54.5 N at y 0 to 14 N at y 4,500 km (canon), so 111 km a degree
export const latOf = ykm => 54.5 - ykm / 111;

export function geography(base, seed) {
  const N = GW * GH, BW = base.gw, BH = base.gh;
  const inBase = i => (i % GW) < BW && Math.floor(i / GW) < BH;
  const baseAt = (x, y) => base.grid[y * BW + x];
  const toCells = pts => pts.map(([x, y]) => [x / CELL, y / CELL]);
  const curve = (pts, closed = true) => spline(toCells(pts), 8, closed);
  const noise = perlin(seed), n2 = perlin(seed + 1), n3 = perlin(seed + 2), n4 = perlin(seed + 3);
  const warpA = fbm(perlin(seed + 11), 4), warpB = fbm(perlin(seed + 12), 4);
  const coastN = fbm(noise, 6, 2.07, 0.52), fineN = fbm(n2, 4, 2.2, 0.5);

  // ---- 1. the land as designed (curves), plus the Known World's own land
  const design = new Uint8Array(N);
  for (const k in PLAN.LANDS_POLY) {
    const closedSeam = k === 'great' || k === 'deepSouth';
    fillPolygon(GW, GH, curve(PLAN.LANDS_POLY[k], true), i => { design[i] = 1; });
    if (closedSeam) { /* the seam ends are on the box edge; the box itself is the Known World's */ }
  }
  const R = rng(seed + 5);
  for (const ch of PLAN.CHAINS) {
    const line = spline(toCells(ch.pts), 12, false);
    let acc = 0;
    for (let i = 1; i < line.length; i++) {
      acc += Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]) * CELL;
      if (acc < ch.step) continue;
      acc = 0;
      const r = R.range(ch.r[0], ch.r[1]) / CELL, cx = line[i][0] + R.range(-2, 2), cy = line[i][1] + R.range(-2, 2), pts = [];
      for (let a = 0; a < 9; a++) { const t = a / 9 * Math.PI * 2, rr = r * R.range(0.65, 1.3); pts.push([cx + Math.cos(t) * rr, cy + Math.sin(t) * rr * R.range(0.7, 1.2)]); }
      fillPolygon(GW, GH, pts, i => { design[i] = 1; });
    }
  }
  const lake = new Int8Array(N).fill(-1);
  PLAN.LAKES.forEach((L, li) => fillPolygon(GW, GH, curve(L.pts, true), i => { if (!inBase(i)) lake[i] = li; }));
  for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) design[y * GW + x] = baseAt(x, y) >= 0 ? 1 : 0;

  // ---- 2. signed distance (km, + on land) of the design, and of the Known World carried straight outward
  const sdOf = mask => { const toLand = edt(GW, GH, i => mask[i] === 1), toSea = edt(GW, GH, i => mask[i] === 0); const s = new Float32Array(N); for (let i = 0; i < N; i++) s[i] = (mask[i] ? toSea[i] - 0.5 : -(toLand[i] - 0.5)) * CELL; return s; };
  const sdDesign = sdOf(design);
  const ext = new Uint8Array(N);
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) ext[y * GW + x] = baseAt(Math.min(x, BW - 1), Math.min(y, BH - 1)) >= 0 ? 1 : 0;
  const sdBase = sdOf(ext);

  // ---- 3. the coast: the design pushed about by domain-warped noise, eased into the Known World's own coast at the
  // seams so a coast that reaches the old map's edge carries on across it
  const land = new Uint8Array(N);
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    const i = y * GW + x;
    if (x < BW && y < BH) { land[i] = baseAt(x, y) >= 0 ? 1 : 0; continue; }
    const km = [x * CELL + 5, y * CELL + 5];
    const dbox = Math.hypot(Math.max(0, km[0] - BW * CELL), Math.max(0, km[1] - BH * CELL));
    const wx = km[0] / 1500, wy = km[1] / 1500;
    const qx = wx + 1.6 * warpA(wx * 0.9, wy * 0.9), qy = wy + 1.6 * warpB(wx * 0.9 + 3.3, wy * 0.9 - 1.7);
    const big = 210 * coastN(qx, qy), mid = 70 * fineN(km[0] / 260, km[1] / 260), fine = 22 * n3(km[0] / 55, km[1] / 55);
    const nz = (big + mid + fine) * smooth(0, 320, dbox);
    const t = smooth(0, 300, dbox);
    // the frame's own edges are open sea, except where the Known World already runs off them
    const dEdge = Math.min(km[1], PLAN.FRAME.W - km[0], PLAN.FRAME.H - km[1], km[1] < BH * CELL ? 1e9 : km[0]);
    const f = lerp(sdBase[i], sdDesign[i] + nz, t) - 300 * smooth(90, 0, dEdge) * t;
    land[i] = f > 0 && lake[i] < 0 ? 1 : 0;
  }
  // islets under 5 cells sink; enclosed water under 40 cells that is no designed lake becomes land (never in the box)
  const comps = (want) => {
    const id = new Int32Array(N).fill(-1), list = [];
    for (let s = 0; s < N; s++) {
      if (id[s] >= 0 || land[s] !== want) continue;
      const q = [s]; id[s] = list.length; let touchesBox = false, edge = false;
      for (let h = 0; h < q.length; h++) {
        const i = q[h], x = i % GW, y = (i / GW) | 0;
        if (x < BW && y < BH) touchesBox = true;
        if (x === 0 || y === 0 || x === GW - 1 || y === GH - 1) edge = true;
        for (const j of [x > 0 ? i - 1 : -1, x < GW - 1 ? i + 1 : -1, y > 0 ? i - GW : -1, y < GH - 1 ? i + GW : -1]) if (j >= 0 && id[j] < 0 && land[j] === want) { id[j] = list.length; q.push(j); }
      }
      list.push({ cells: q, touchesBox, edge });
    }
    return { id, list };
  };
  for (const c of comps(1).list) if (c.cells.length < 5 && !c.touchesBox) for (const i of c.cells) land[i] = 0;
  for (const c of comps(0).list) if (c.cells.length < 40 && !c.touchesBox && !c.edge && !c.cells.some(i => lake[i] >= 0)) for (const i of c.cells) land[i] = 1;

  // ---- 4. relief
  const water = i => !land[i];
  const toSeaD = edt(GW, GH, i => !land[i]);          // cells to the nearest water
  const rid = ridged(n4, 5), relN = fbm(n2, 4);
  const elev = new Float32Array(N);
  const rangeD = PLAN.RANGES.map(r => { const m = new Uint8Array(N); drawLine(GW, GH, spline(toCells(r.pts), 10, false), i => { m[i] = 1; }); return edt(GW, GH, i => m[i] === 1); });
  const platSD = PLAN.PLATEAUS.map(p => { const m = new Uint8Array(N); fillPolygon(GW, GH, curve(p.pts, true), i => { m[i] = 1; }); return sdOf(m); });
  for (let i = 0; i < N; i++) {
    if (!land[i]) { elev[i] = -200; continue; }
    const x = i % GW, y = (i / GW) | 0, kx = x * CELL + 5, ky = y * CELL + 5;
    let e = 30 + 480 * (1 - Math.exp(-toSeaD[i] * CELL / 700));
    const wx = Math.round(9 * warpA(kx / 700, ky / 700)), wy = Math.round(9 * warpB(kx / 700, ky / 700));
    const xw = clamp(x + wx, 0, GW - 1), yw = clamp(y + wy, 0, GH - 1), iw = yw * GW + xw;
    const crest = rid(kx / 150 + 0.5 * warpA(kx / 300, ky / 300), ky / 150 + 0.5 * warpB(kx / 300, ky / 300));
    let mtn = 0;
    PLAN.RANGES.forEach((r, k) => {
      const d = rangeD[k][iw] * CELL, w = r.w * (0.8 + 0.45 * (noise(kx / 600 + 7 * k, ky / 600) + 0.5));
      if (d > w * 2.6) return;
      const env = Math.exp(-(d / w) * (d / w)), along = 0.7 + 0.3 * noise(kx / 380 + 3 * k, ky / 380 - k);
      mtn = Math.max(mtn, r.h * env * along * (0.3 + 0.7 * Math.pow(crest, 1.3)) + 0.25 * r.h * env * env);
    });
    e += mtn;
    PLAN.PLATEAUS.forEach((p, k) => { const t = smooth(-p.edge * 0.5, p.edge * 0.5, platSD[k][i]); e += p.h * t * (p.h > 2000 ? 0.88 + 0.22 * crest : 1); });
    e += 260 * relN(kx / 420, ky / 420) + 90 * n3(kx / 70, ky / 70) + 220 * Math.pow(crest, 3) * smooth(400, 2000, e);
    elev[i] = Math.max(2, e);
  }

  // ---- 5. climate: temperature from latitude, height and distance from the sea; rain carried by four winds
  const T = new Float32Array(N), P = new Float32Array(N);
  const cont = edt(GW, GH, i => !land[i] && lake[i] < 0);   // to the open sea
  // the northern sea is cold: its shore is tundra, as the Known World's own north is at the same latitude
  const northSea = edt(GW, GH, i => !land[i] && lake[i] < 0 && ((i / GW) | 0) * CELL < 1500);
  for (let i = 0; i < N; i++) {
    const y = (i / GW) | 0, lat = latOf(y * CELL + 5), al = Math.abs(lat);
    const c = clamp(cont[i] * CELL / 1600, 0, 1), e = Math.max(0, elev[i]);
    T[i] = 25.5 - 0.0094 * lat * lat - 3 * c * clamp((al - 25) / 25, 0, 1) - 5.6 * e / 1000 + 1.5 * smooth(2500, 4500, e)
      - 5 * Math.exp(-northSea[i] * CELL / 350) * clamp((lat - 40) / 10, 0, 1);
  }
  const blur = (a, axis, r) => blurA(a, GW, GH, axis, r);
  const elevS = blur(blur(elev, 0, 6), 1, 6);           // the ground as the wind feels it
  const sweep = (order, decayKm, rise, h0, recharge) => {   // order: an array of rows of cell indices, upwind first
    const out = new Float32Array(N);
    for (const line of order) {
      let h = h0, prevE = 0;
      for (const i of line) {
        if (!land[i]) { h += (1 - h) * recharge; prevE = 0; out[i] = h; continue; }
        const up = Math.max(0, elevS[i] - prevE); prevE = elevS[i];
        const shed = 1 - Math.exp(-up / rise);
        out[i] = h * (1 + 2.2 * shed);
        h *= Math.exp(-CELL / decayKm) * (1 - 0.85 * shed);
      }
    }
    return out;
  };
  const rows = (dir) => {
    const out = [];
    if (dir === 'E' || dir === 'W') for (let y = 0; y < GH; y++) { const l = []; for (let x = 0; x < GW; x++) l.push(y * GW + x); out.push(dir === 'E' ? l : l.reverse()); }
    else for (let x = 0; x < GW; x++) { const l = []; for (let y = 0; y < GH; y++) l.push(y * GW + x); out.push(dir === 'S' ? l : l.reverse()); }
    return out;
  };
  const west = blur(sweep(rows('E'), 2600, 1600, 0.3, 0.02), 1, 14);   // the westerlies, already dry when they reach the seam
  const east = blur(sweep(rows('W'), 1300, 1200, 1, 0.08), 1, 14);     // the summer monsoon off the eastern ocean
  const south = blur(sweep(rows('N'), 1050, 800, 1, 0.08), 0, 14);     // the monsoon off the southern ocean, stopped by the wall
  const north = blur(sweep(rows('S'), 500, 900, 1, 0.05), 0, 14);      // the arctic damp
  for (let i = 0; i < N; i++) {
    if (!land[i]) continue;
    const y = (i / GW) | 0, lat = latOf(y * CELL + 5);
    const wW = clamp((lat - 28) / 12, 0, 1), wE = clamp(1 - Math.abs(lat - 30) / 26, 0, 1), wS = clamp((36 - lat) / 14, 0, 1) * (lat > -12 ? 1 : 0.6), wN = clamp((lat - 40) / 12, 0, 1);
    const itcz = 1700 * Math.exp(-(lat * lat) / 70);
    P[i] = 60 + 700 * west[i] * wW + 1500 * east[i] * wE + 2300 * south[i] * wS + 380 * north[i] * wN + itcz * (0.45 + 0.55 * Math.max(east[i], south[i], 0.3));
  }

  // ---- 6. rivers: fill the hollows (priority flood) so every drop finds the sea or a salt lake, then gather the rain
  const sinkLake = new Set(PLAN.SINKS.map(n => PLAN.LAKES.findIndex(L => L.name === n)));
  const filled = new Float32Array(N), done = new Uint8Array(N), down = new Int32Array(N).fill(-1), hp = new Heap();
  const nb8 = i => { const x = i % GW, y = (i / GW) | 0, o = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < GW && Y < GH) o.push(Y * GW + X); } return o; };
  for (let i = 0; i < N; i++) {
    if (land[i] && !inBase(i)) continue;
    // outlets: the sea, open lakes, the Known World (its rivers are its own), the salt lakes
    if (!land[i] || inBase(i)) { done[i] = 1; filled[i] = land[i] ? elev[i] : -1; }
  }
  for (let i = 0; i < N; i++) if (done[i]) for (const j of nb8(i)) if (!done[j]) { hp.push(filled[i], i); break; }
  let order = [];
  while (hp.size) {
    const i = hp.pop();
    for (const j of nb8(i)) {
      if (done[j]) continue;
      done[j] = 1; filled[j] = Math.max(elev[j], filled[i] + 0.01); down[j] = i; order.push(j); hp.push(filled[j], j);
    }
  }
  const flow = new Float32Array(N);
  { const Ps = blur(blur(P, 0, 4), 1, 4); for (let i = 0; i < N; i++) P[i] = land[i] ? Ps[i] : 0; }
  for (let i = 0; i < N; i++) if (land[i] && !inBase(i)) flow[i] = P[i] / 1000;
  for (let k = order.length - 1; k >= 0; k--) { const i = order[k], d = down[i]; if (d >= 0 && land[d] && !inBase(d)) flow[d] += flow[i]; }
  void sinkLake; void water;

  // ---- 7. biome and ground word per cell
  const biome = new Array(N).fill(null);
  const river = new Uint8Array(N);
  for (let i = 0; i < N; i++) if (land[i] && !inBase(i) && flow[i] > 400) river[i] = flow[i] > 2500 ? 2 : 1;
  for (let i = 0; i < N; i++) {
    if (!land[i] || inBase(i)) continue;
    const t = T[i], pet = 280 + 48 * Math.max(0, t), m = P[i] / pet, e = elev[i];
    let b;
    if (e > 6100 || (t < -15 && e > 3500)) b = 'Glacier';
    else if (e > 3200) b = m > 0.2 ? 'Alpine highland' : 'Desert';
    else if (t < -4.5) b = e > 2400 ? (m > 0.25 ? 'Alpine highland' : 'Desert') : 'Tundra';
    else if (t < 3.5) b = m > 0.5 ? 'Taiga' : m > 0.26 ? 'Steppe' : e > 1500 ? 'Desert' : 'Tundra';
    else if (t < 11) b = m < 0.28 ? 'Desert' : m < 0.62 ? 'Steppe' : m > 2.2 && t > 6 ? 'Temperate rainforest' : 'Temperate forest';
    else if (t < 19.5) b = m < 0.24 ? 'Desert' : m < 0.5 ? 'Steppe' : m < 0.78 ? 'Dry woodland' : 'Temperate forest';
    else b = m < 0.22 ? 'Desert' : m < 0.55 ? 'Savanna' : m < 1.05 ? 'Tropical monsoon forest' : 'Tropical rainforest';
    if ((b === 'Desert' || b === 'Steppe') && river[i] && e < 3300) b = river[i] === 2 || m > 0.18 ? (t > 19 ? 'Savanna' : 'Dry woodland') : b;
    biome[i] = b;
  }
  // marsh where a great river meets the sea on flat ground, and in the wet lowland
  for (let i = 0; i < N; i++) {
    if (!land[i] || inBase(i)) continue;
    if (river[i] === 2 && toSeaD[i] <= 8 && elev[i] < 200 && biome[i] !== 'Desert') biome[i] = 'Marsh';
  }
  return { N, land, lake, elev, T, P, flow, river, biome, toSeaD, inBase, filled, down };
}
