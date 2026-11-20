// M1, map version 4 (orders 72 and 73; D-153, D-154): the designed continent. A.V2MAP.buildV4(seed, base) builds the one
// continent from the design (docs/design/m1/map-design.md), shipped as data (data/map/v4.json, A.DATA['map/v4'], made by
// tools/m1/v4-data.mjs from the design's own files): authored control data, generated detail.
//   - authored: the province of every cell (the design's grid, used as given, never regrown), sea, lakes and their names,
//     the ground word of every cell, the height guide, the 306 seats, every river's line, the ranges, passes, peaks,
//     regions and the ferries to the islands;
//   - generated: the fine relief (the engine's noise from a fixed seed string, under the guide's grain), the rivers carved
//     downhill along their authored lines, the lesser streams grown from the carved field, the ocean's depth, the climate
//     (the design's latitudes, 65 to 11 degrees, with moisture pulled to the ground), and D9's ground (cover, roads, fords,
//     passes) over it all.
// The result has the shape A.V2MAP.build gives (w.grid, w.prov, w.gen, w.rivers, w.riv, w.ocean, the ground), plus the
// design's names: w.waters (every named water), w.waterAt (each water cell's water), w.riverNames (aligned with w.rivers),
// w.features (ranges, peaks, passes, regions). Pure: no DOM, no A.S, no A.rand; ties break by index. Like a-world.core.js
// it is one function, run on the page and, from its own source, in the worker that builds the continent ahead.
(A.V2MAP = A.V2MAP || {}).defineV4 = function (A) {
const VM = A.V2MAP;
VM.V4 = VM.V4 || null;                 // the design's data (A.DATA['map/v4'] on the page; posted to the worker)
VM.V4_FLOW = { small: 500, big: 3000, ships: 6000 };   // an authored river's flow at its mouth (D9: bridges from 700, barges 300)
VM.V4_SNAP = 3;                         // a seat moves at most this many cells (30 km) to stand on its water
const BIO = A.V2.continent.BIOME;
// the design's ground words -> v2's biomes; the moisture each pulls toward (the renderer colours land by climate)
const G2B = { sea: BIO.OCEAN, lake: BIO.LAKE, ice: BIO.SNOW, tundra: BIO.TUNDRA, rock: BIO.ALPINE, taiga: BIO.BOREAL_FOREST, forest: BIO.TEMPERATE_FOREST,
  jungle: BIO.RAINFOREST, grass: BIO.GRASSLAND, scrub: BIO.SCRUB, steppe: BIO.STEPPE, desert: BIO.DESERT, ash: BIO.SCRUB, marsh: BIO.WETLAND };
const MOIST = { sea: 1, lake: 1, ice: 0.5, tundra: 0.4, rock: 0.4, taiga: 0.85, forest: 1.0, jungle: 1.25, grass: 0.74, scrub: 0.46, steppe: 0.26, desert: 0.05, ash: 0.3, marsh: 1.1 };
const unrle = (b64, n) => {
  const bin = atob(b64), u = new Uint16Array(bin.length / 2);
  for (let i = 0; i < u.length; i++) u[i] = bin.charCodeAt(2 * i) | (bin.charCodeAt(2 * i + 1) << 8);
  const out = new Uint16Array(n); let k = 0; for (let i = 0; i < u.length; i += 2) { out.fill(u[i], k, k + u[i + 1]); k += u[i + 1]; }
  if (k !== n) throw new Error('map v4: a layer of ' + k + ' cells, not ' + n);
  return out;
};
const now = () => (typeof performance !== 'undefined' ? performance.now() : 0);

VM.buildV4 = function (seed, base) {
  const T = { t0: now() }, D = VM.V4;
  if (!D) throw new Error('map v4: no design data');
  const C = A.V2.continent, Nz = A.V2.noise.makeNoise(String(seed) + ':v4'), Nm = A.V2.noise.makeNoise(String(seed) + ':v4m');
  const gw = D.gw, gh = D.gh, N = gw * gh, GW = VM.GW, GH = VM.GH, GN = GW * GH, fx = GW / gw, fy = GH / gh;
  const words = D.grounds, wix = Object.fromEntries(words.map((w, i) => [w, i]));
  // ---- 1. the grid, the waters and the ground, as the design drew them
  const cells = unrle(D.cells, N), gcode = unrle(D.ground, N);
  const grid = new Int16Array(N).fill(-1), waterAt = new Int16Array(N).fill(-1), lakeCell = new Uint8Array(N);
  let nLand = 0;
  for (let k = 0; k < N; k++) {
    const c = cells[k];
    if (c >= 1 && c <= 997) { grid[k] = c - 1; nLand++; }
    else if (c >= 1000) { waterAt[k] = c - 1000; if (D.waters[c - 1000].enclosed) lakeCell[k] = 1; }
    else if (c === 998) lakeCell[k] = 1;
  }
  // the sea that reaches the frame (a water the design calls enclosed is a lake, whatever its size)
  const ocean = new Uint8Array(N), q0 = [];
  for (let k = 0; k < N; k++) { const x = k % gw, y = (k / gw) | 0; if ((x === 0 || y === 0 || x === gw - 1 || y === gh - 1) && grid[k] < 0 && !lakeCell[k]) { ocean[k] = 1; q0.push(k); } }
  for (let h = 0; h < q0.length; h++) { const k = q0[h], x = k % gw; for (const j of [x > 0 ? k - 1 : -1, x < gw - 1 ? k + 1 : -1, k - gw, k + gw]) if (j >= 0 && j < N && grid[j] < 0 && !lakeCell[j] && !ocean[j]) { ocean[j] = 1; q0.push(j); } }
  const gcell = (x, y) => Math.min(gh - 1, Math.max(0, Math.floor((y + 0.5) / fy))) * gw + Math.min(gw - 1, Math.max(0, Math.floor((x + 0.5) / fx)));   // a generator cell's game cell

  // ---- 2. the height: the guide (half the grid, bilinear), the engine's noise under its grain; the sea by its distance
  const RW = D.reliefW, RH = D.reliefH, rbin = atob(D.relief), rel = new Float32Array(RW * RH);
  for (let i = 0; i < rel.length; i++) rel[i] = rbin.charCodeAt(i) / 360;
  const guide = (gx, gy) => { // a generator cell's guide height, read from the half grid
    const u = Math.max(0, Math.min(RW - 1.001, ((gx + 0.5) / fx) / 2 - 0.5)), v = Math.max(0, Math.min(RH - 1.001, ((gy + 0.5) / fy) / 2 - 0.5));
    const xi = Math.floor(u), yi = Math.floor(v), a = u - xi, b = v - yi, k = yi * RW + xi;
    return rel[k] * (1 - a) * (1 - b) + rel[k + 1] * a * (1 - b) + rel[k + RW] * (1 - a) * b + rel[k + RW + 1] * a * b;
  };
  const elev = new Float32Array(GN), gground = new Uint8Array(GN), gland = new Uint8Array(GN), gocean = new Uint8Array(GN);
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    const k = y * GW + x, c = gcell(x, y);
    gland[k] = grid[c] >= 0 ? 1 : 0; gocean[k] = ocean[c]; gground[k] = gcode[c];
  }
  // distance (generator cells) from land, for the sea's depth; from water, for the land's lowlands
  const dist = from => { const d = new Float32Array(GN).fill(1e9), q = []; for (let k = 0; k < GN; k++) if (from(k)) { d[k] = 0; q.push(k); }
    for (let h = 0; h < q.length; h++) { const k = q[h], x = k % GW; for (const j of [x > 0 ? k - 1 : -1, x < GW - 1 ? k + 1 : -1, k - GW, k + GW]) if (j >= 0 && j < GN && d[j] > d[k] + 1) { d[j] = d[k] + 1; q.push(j); } }
    return d; };
  const toLand = dist(k => gland[k]), toWater = dist(k => !gland[k]);
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    const k = y * GW + x, u = x / GW, v = y / GH;
    if (!gland[k]) {
      const d = toLand[k];
      elev[k] = gocean[k] ? -0.03 - 0.45 * Math.min(1, d / 26) - 0.05 * Nz.fbm(u * 6, v * 6, 3) : -0.02 - 0.05 * Math.min(1, d / 6);
      continue;
    }
    const g = guide(x, y), shore = Math.min(1, toWater[k] / 3);
    // the guide's own height, roughened where it is high (ranges show ridges, lowlands lie flat), never below the shore's
    const rough = 0.006 + 0.12 * Math.pow(g, 1.4), hi = Math.max(0, Math.min(1, (g - 0.12) / 0.15));
    const n = Nz.fbm(u * 9 + 3, v * 9 - 1, 4) * rough + Nz.ridged(u * 14 - 2, v * 14 + 5, 4) * rough * 0.7 * hi;
    elev[k] = Math.max(0.0025 + 0.004 * shore, g * 0.95 + n * shore);
  }

  // ---- 3. the authored rivers, carved downhill along their lines from source to mouth
  const rivPts = D.rivers.map(r => { // the line densified to the generator grid (cells), in order
    const out = []; for (let i = 0; i + 1 < r.km.length; i++) { const [x0, y0] = r.km[i], [x1, y1] = r.km[i + 1], n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 10 * fx * 1.5));
      for (let s = 0; s < n; s++) out.push([(x0 + (x1 - x0) * s / n) / 10 * fx - 0.5, (y0 + (y1 - y0) * s / n) / 10 * fy - 0.5]); }
    const [xl, yl] = r.km[r.km.length - 1]; out.push([xl / 10 * fx - 0.5, yl / 10 * fy - 0.5]);
    return out; });
  const carved = new Uint8Array(GN);
  rivPts.forEach(pts => {
    const ks = []; for (const [u, v] of pts) { const k = Math.min(GH - 1, Math.max(0, Math.round(v))) * GW + Math.min(GW - 1, Math.max(0, Math.round(u))); if (ks[ks.length - 1] !== k) ks.push(k); }
    // the stretch over land, to the first water
    let end = ks.findIndex(k => !gland[k]); if (end < 0) end = ks.length;
    let h = Infinity; const n = end;
    for (let i = 0; i < n; i++) {
      const k = ks[i], floor = 0.0015 + (n - i) * 2e-6;
      h = Math.max(floor, Math.min(h - 2e-6, elev[k] * 0.97));
      elev[k] = h; carved[k] = 1;
      // the valley's sides fall toward it
      const x = k % GW; for (const j of [x > 0 ? k - 1 : -1, x < GW - 1 ? k + 1 : -1, k - GW, k + GW]) if (j >= 0 && j < GN && gland[j] && !carved[j]) elev[j] = Math.max(h + 1e-5, Math.min(elev[j], h + (elev[j] - h) * 0.7));
    }
  });
  T.relief = now() - T.t0;

  // ---- 4. the climate: the design's latitudes and heights; moisture pulled to the ground
  const temp = new Float32Array(GN), moist = new Float32Array(GN);
  for (let y = 0; y < GH; y++) {
    const lat = D.latTop + (D.latBottom - D.latTop) * (y / (GH - 1));
    for (let x = 0; x < GW; x++) {
      const k = y * GW + x, w = words[gground[k]] || 'grass', e = Math.max(0, elev[k]);
      let t = 30 - (lat - 20) * 0.62 - e * 40 + Nm.fbm(x / GW * 3, y / GH * 3, 3) * 3;
      if (w === 'ice') t = Math.min(t, -8); else if (w === 'tundra') t = Math.min(t, -1); else if (w === 'taiga') t = Math.max(-2, Math.min(t, 4));
      else if (w === 'jungle') t = Math.max(t, 22); else if (w === 'desert') t = Math.max(t, 15);
      temp[k] = t;
      moist[k] = gland[k] ? MOIST[w] != null ? MOIST[w] : 0.5 : 1;
    }
  }
  C.blur(moist, GW, GH, 2, 1);
  for (let k = 0; k < GN; k++) if (gland[k]) moist[k] = Math.max(0, Math.min(1.4, moist[k] + Nm.fbm((k % GW) / GW * 7 + 9, ((k / GW) | 0) / GH * 7, 3) * 0.08));
  // the biomes: the design's ground, ash on the heights as rock; the sea shallow on the shelf
  const biome = new Uint8Array(GN), tint = new Float32Array(GN);
  for (let k = 0; k < GN; k++) {
    const w = words[gground[k]];
    if (!gland[k]) { biome[k] = gocean[k] ? (elev[k] > -0.06 ? BIO.SHALLOW : BIO.OCEAN) : BIO.LAKE; continue; }
    let b = G2B[w]; if (b == null || b === BIO.OCEAN || b === BIO.LAKE) b = BIO.GRASSLAND;
    if (w === 'ash') { tint[k] = 1; if (elev[k] > 0.3) b = BIO.ALPINE; }
    biome[k] = b;
  }
  C.blur(tint, GW, GH, 2, 2);   // the ash's edge fades, as the picture paints it
  for (let k = 0; k < GN; k++) if (!gland[k]) tint[k] = 0;
  const oceanDepth = Float32Array.from(elev, v => Math.min(0, v)); C.blur(oceanDepth, GW, GH, 3, 2);
  const coastDist = C.distanceToWater(elev, GW, GH);
  const { flowTo, acc } = C.flowField(elev, moist, GW, GH);
  const gen = { W: GW, H: GH, seed, elev, oceanDepth, temp, moist, biome, flowTo, acc, ocean: gocean, coastDist, tint,
    latTop: D.latTop, latBottom: D.latBottom, stats: { designed: true } };
  T.climate = now() - T.t0;

  // ---- 5. the rivers: the authored first (their flow growing to the mouth), then the streams the carved field grows
  const smooth = pts => { let p = pts; for (let r = 0; r < 2; r++) { const o = [p[0]]; for (let i = 0; i + 1 < p.length; i++) { const a = p[i], b = p[i + 1]; o.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } o.push(p[p.length - 1]); p = o; } return p; };
  const rivers = [], riverNames = [], riverTo = [], riverShips = [];
  D.rivers.forEach(r => {
    const p = smooth(r.km), mouth = r.ships ? VM.V4_FLOW.ships : r.big ? VM.V4_FLOW.big : VM.V4_FLOW.small;
    let L = 0; const cum = [0]; for (let i = 1; i < p.length; i++) { L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); cum.push(L); }
    // a river that rises out of a lake or another river starts big; one from the hills starts as a stream
    const start = /^(the )?(Lake|Western Lakes|Glenmere|Grey Water|Lake Portage|Tolek|border reach)/i.test(r.from || '') ? 0.35 : 0.08;
    const a = new Float32Array(p.length * 3);
    p.forEach(([x, y], i) => { const t = L > 0 ? cum[i] / L : 1; a[3 * i] = x; a[3 * i + 1] = y; a[3 * i + 2] = Math.max(VM.STREAM_T + 5, mouth * (start + (1 - start) * Math.pow(t, 1.2))); });
    rivers.push(a); riverNames.push(r.name); riverTo.push(r.to || null); riverShips.push(!!r.ships);
  });
  const authored = VM.riverRaster(rivers, gw, gh), near = new Uint8Array(N);
  for (let k = 0; k < N; k++) if (authored[k] > 0) { const x = k % gw, y = (k / gw) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < gw && yy < gh) near[yy * gw + xx] = 1; } }
  for (const pts of C.riverPaths(gen, VM.STREAM_T)) {
    const a = []; let shared = 0;
    for (const [u, v, f] of pts) {
      const xk = (u + 0.5) / fx * 10, yk = (v + 0.5) / fy * 10, k = Math.min(gh - 1, Math.floor(yk / 10)) * gw + Math.min(gw - 1, Math.floor(xk / 10));
      a.push(xk, yk, Math.min(f, VM.RIVER_T * 2.4));   // a stream never outgrows a named river
      if (near[k]) { shared++; break; }               // it joins the authored river there
    }
    if (a.length >= 12 && shared <= 1) { rivers.push(Float32Array.from(a)); riverNames.push(null); riverTo.push(null); riverShips.push(false); }
  }
  const riv = VM.riverRaster(rivers, gw, gh);
  T.rivers = now() - T.t0;

  // ---- 6. the provinces: the design's seats, terrain and ferries; the rest read from the grid as A.V2MAP.build reads it
  const P = base.provinces, M = P.length, byId = new Map(D.provinces.map(p => [p.id, p]));
  const coastWater = j => ocean[j] || (waterAt[j] >= 0 && D.waters[waterAt[j]].coast);
  const accP = Array.from({ length: M }, () => ({ n: 0, x: 0, y: 0, e: 0, coast: false, adj: new Set(), bio: {} }));
  const gelev = new Float32Array(N), gi = new Int32Array(N);
  for (let y = 0; y < gh; y++) {
    const v = Math.max(0, Math.min(GH - 1.001, (y + 0.5) * fy - 0.5)), yi = Math.floor(v), b = v - yi;
    for (let x = 0; x < gw; x++) {
      const u = Math.max(0, Math.min(GW - 1.001, (x + 0.5) * fx - 0.5)), xi = Math.floor(u), a = u - xi, k = yi * GW + xi;
      gelev[y * gw + x] = elev[k] * (1 - a) * (1 - b) + elev[k + 1] * a * (1 - b) + elev[k + GW] * (1 - a) * b + elev[k + GW + 1] * a * b;
      gi[y * gw + x] = Math.min(GH - 1, Math.round(v)) * GW + Math.min(GW - 1, Math.round(u));
    }
  }
  for (let k = 0; k < N; k++) {
    const id = grid[k]; if (id < 0) continue;
    const a = accP[id], x = k % gw, y = (k / gw) | 0;
    a.n++; a.x += x; a.y += y; a.e += Math.max(0, gelev[k]) * VM.ELEV_M;
    const w = VM.biomeWord(biome[gi[k]], temp[gi[k]]); if (w) a.bio[w] = (a.bio[w] || 0) + 1;
    for (const j of [x > 0 ? k - 1 : -1, x < gw - 1 ? k + 1 : -1, y > 0 ? k - gw : -1, y < gh - 1 ? k + gw : -1]) {
      if (j < 0) continue; const o = grid[j];
      if (o >= 0 && o !== id) a.adj.add(o); else if (o < 0 && coastWater(j)) a.coast = true;
    }
  }
  const nearest = (id, x, y) => { let best = -1, bd = Infinity; const x0 = Math.max(0, Math.floor(x) - 40), x1 = Math.min(gw - 1, Math.floor(x) + 40), y0 = Math.max(0, Math.floor(y) - 40), y1 = Math.min(gh - 1, Math.floor(y) + 40);
    for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) { const k = yy * gw + xx; if (grid[k] !== id) continue; const d = (xx - x) ** 2 + (yy - y) ** 2; if (d < bd) { bd = d; best = k; } }
    if (best < 0) for (let k = 0; k < N; k++) if (grid[k] === id) { const d = (k % gw - x) ** 2 + (((k / gw) | 0) - y) ** 2; if (d < bd) { bd = d; best = k; } }
    return best; };
  // a seat the design set beside its water (a ford, a mouth, a shore) stands on it: the nearest cell of its province on a
  // river or stream or on the shore, within VM.V4_SNAP cells (30 km, under the picture's grain); else where the design put it
  const wet = k => { if (riv[k] >= VM.STREAM_T) return 2; const x = k % gw; for (const j of [x > 0 ? k - 1 : -1, x < gw - 1 ? k + 1 : -1, k - gw, k + gw]) if (j >= 0 && j < N && grid[j] < 0) return 1; return 0; };
  const onWater = (id, k0) => { if (wet(k0)) return k0; const x0 = k0 % gw, y0 = (k0 / gw) | 0, R = VM.V4_SNAP; let best = k0, bd = Infinity;
    for (let y = Math.max(0, y0 - R); y <= Math.min(gh - 1, y0 + R); y++) for (let x = Math.max(0, x0 - R); x <= Math.min(gw - 1, x0 + R); x++) {
      const k = y * gw + x; if (grid[k] !== id || !wet(k)) continue; const d = Math.hypot(x - x0, y - y0); if (d <= R && d < bd - 1e-9) { bd = d; best = k; } }
    return best; };
  const prov = P.map(p => {
    const a = accP[p.id], n = Math.max(1, a.n), d = byId.get(p.id) || {};
    const kc = nearest(p.id, a.x / n, a.y / n), ks = onWater(p.id, nearest(p.id, (d.sx != null ? d.sx : (kc % gw) * 10) / 10 - 0.5, (d.sy != null ? d.sy : ((kc / gw) | 0) * 10) / 10 - 0.5));
    let bio = null, bn = -1; for (const w of Object.keys(a.bio).sort()) if (a.bio[w] > bn) { bn = a.bio[w]; bio = w; }
    const sea = (d.sea || []).filter(j => j !== p.id).sort((x, y) => x - y);
    return { id: p.id, x: (kc % gw) * 10 + 5, y: ((kc / gw) | 0) * 10 + 5, sx: (ks % gw) * 10 + 5, sy: ((ks / gw) | 0) * 10 + 5,
      cells: a.n, adj: [...a.adj].sort((x, y) => x - y), sea, coast: a.coast, elev: Math.round(a.e / n), biome: bio || 'Dry woodland', terr: d.terr || 'plains' };
  });
  for (const q of prov) if (q.terr === 'mountains' && !/Alpine|Glacier|Taiga/.test(q.biome)) q.biome = 'Alpine highland';
  // D-061's rule holds on the designed map: an oasis the design set off dry ground (wells in the hills, a ford on the grass)
  // is a town named for its water; the save keeps its old name (q.retype, read by A.V2MAP.onProv)
  for (const q of prov) {
    if (P[q.id].type !== 'oasis' || /^(Desert|Steppe|Savanna|Salt flat)$/.test(q.biome) || /^(desert|steppe)$/.test(q.terr)) continue;
    const k = Math.floor(q.sy / 10) * gw + Math.floor(q.sx / 10), x = k % gw, nb = [x > 0 ? k - 1 : -1, x < gw - 1 ? k + 1 : -1, k - gw, k + gw].filter(j => j >= 0 && j < N);
    const word = riv[k] >= VM.STREAM_T ? 'Ford' : nb.some(j => ocean[j]) ? 'Haven' : nb.some(j => grid[j] < 0) ? 'Mere' : q.terr === 'forest' ? 'Wood' : q.terr === 'hills' || q.terr === 'mountains' ? 'Hill' : 'Field';
    const was = P[q.id].name || '';
    q.retype = { type: 'town', name: /\bOasis\b/.test(was) ? was.replace(/\bOasis\b/, word) : was, was };
  }
  T.ms = now() - T.t0;
  const units = Object.keys(D.realms).sort().map(r => ({ key: r, seat: (() => { const q = prov[D.realms[r].capital]; return q ? Math.floor(q.sy / 10) * gw + Math.floor(q.sx / 10) : -1; })(), target: 0 }));
  const w = { seed, v: 4, gw, gh, grid, prov, gen, rivers, riv, ocean, land: nLand, units, T, designed: true,
    waters: D.waters.map(x => ({ name: x.name, kind: x.kind, enclosed: x.enclosed, coast: x.coast })), waterAt, riverNames, riverTo, riverShips,
    features: { ranges: D.ranges, peaks: D.peaks, passes: D.passes, regions: D.regions, roads: D.roads, isles: D.isles, ferries: D.ferries } };
  // D9: the ground the game reads, made when first read (as A.V2MAP.build does)
  if (A.V2.ground && typeof A.V2.ground.buildGround === 'function') {
    const G0 = A.V2.ground, args = { elev: gelev, gi, metres: VM.ELEV_M,
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
A.V2MAP.defineV4(A);
if (typeof A.DATA !== 'undefined' && A.DATA && A.DATA['map/v4'] && !A.V2MAP.V4) A.V2MAP.V4 = A.DATA['map/v4'];
