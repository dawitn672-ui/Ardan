// Geography of the far lands, cell by cell (10 km cells): land and sea, relief, rivers, climate and biome.
// Layer one of docs/research/world-foundations.md: plates make the walls (the ranges), latitude makes the belts,
// distance from the sea and the rain shadows make the deserts (G2), rivers run from the wet mountains to the sea (G3).
// The plan is the lore's (loreplan.mjs: its regions, ranges, lakes, straits, rivers and climates) or, without the
// lore, the hand plan (plan.mjs). The Known World's cells are read, never written; the frame may reach past any of its
// edges (the lore's runs north of it to 75 N).
import { rng, perlin, fbm, ridged, edt, fillPolygon, drawLine, spline, Heap, clamp, smooth, lerp, blur as blurA } from './lib.mjs';
import { loreShape } from './shape.mjs';

export const CELL = 10;
// latitude of a row: the Known World runs from 54.5 N at y 0 to 14 N at y 4,500 km (canon), 111.1 km a degree
export const latOf = ykm => 54.5 - ykm / 111.1;

export function geography(base, seed, plan) {
  const F = plan.frame, GW = F.W / CELL, GH = F.H / CELL, N = GW * GH, OX = Math.round(-F.x0 / CELL), OY = Math.round(-F.y0 / CELL), BW = base.gw, BH = base.gh;
  const bxOf = i => (i % GW) - OX, byOf = i => ((i / GW) | 0) - OY;
  const inBase = i => { const x = bxOf(i), y = byOf(i); return x >= 0 && y >= 0 && x < BW && y < BH; };
  const baseCell = i => inBase(i) ? base.grid[byOf(i) * BW + bxOf(i)] : -1;
  const kmX = x => F.x0 + x * CELL + 5, kmY = y => F.y0 + y * CELL + 5;
  const toCells = pts => pts.map(([x, y]) => [(x - F.x0) / CELL, (y - F.y0) / CELL]);
  const curve = (pts, closed = true) => spline(toCells(pts), 8, closed);
  const blur = (a, axis, r) => blurA(a, GW, GH, axis, r);
  const noise = perlin(seed), n2 = perlin(seed + 1), n3 = perlin(seed + 2), n4 = perlin(seed + 3);
  const warpA = fbm(perlin(seed + 11), 4), warpB = fbm(perlin(seed + 12), 4);
  const coastN = fbm(noise, 6, 2.07, 0.52), fineN = fbm(n2, 4, 2.2, 0.5);
  const disc = (x, y, r, put) => { const cx = (x - F.x0) / CELL, cy = (y - F.y0) / CELL, rr = r / CELL; for (let yy = Math.floor(cy - rr); yy <= Math.ceil(cy + rr); yy++) for (let xx = Math.floor(cx - rr); xx <= Math.ceil(cx + rr); xx++) if (xx >= 0 && yy >= 0 && xx < GW && yy < GH && (xx + 0.5 - cx) ** 2 + (yy + 0.5 - cy) ** 2 <= rr * rr) put(yy * GW + xx); };

  // ---- 1. the land as designed, and which region each piece is
  const regions = plan.regions || [], label = new Int16Array(N).fill(-1);
  const design = new Uint8Array(N);
  let shape = null;
  if (plan.lore) {
    // the lore's regions cut the land (shape.mjs): each holds about its area, neighbours meet, islands stand apart
    shape = loreShape(F, GW, GH, plan, seed, inBase, i => baseCell(i) >= 0);
    design.set(shape.design); label.set(shape.label);
  } else {
    for (const c of plan.coasts) fillPolygon(GW, GH, curve(c.pts, true), i => { design[i] = 1; });
    const R = rng(seed + 5);
    for (const ch of plan.chains || []) {
      const line = spline(toCells(ch.pts), 12, false); let acc = 0;
      for (let i = 1; i < line.length; i++) {
        acc += Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]) * CELL; if (acc < ch.step) continue; acc = 0;
        const r = R.range(ch.r[0], ch.r[1]) / CELL, cx = line[i][0] + R.range(-2, 2), cy = line[i][1] + R.range(-2, 2), pts = [];
        for (let a = 0; a < 9; a++) { const t = a / 9 * Math.PI * 2, rr = r * R.range(0.65, 1.3); pts.push([cx + Math.cos(t) * rr, cy + Math.sin(t) * rr * R.range(0.7, 1.2)]); }
        fillPolygon(GW, GH, pts, i => { design[i] = 1; });
      }
    }
  }
  const lake = new Int8Array(N).fill(-1);
  (plan.lakes || []).forEach((L, li) => fillPolygon(GW, GH, plan.lore ? toCells(L.pts) : curve(L.pts, true), i => { if (!inBase(i)) lake[i] = Math.min(li, 126); }));
  for (let i = 0; i < N; i++) if (inBase(i)) design[i] = baseCell(i) >= 0 ? 1 : 0;
  const keepM = new Uint8Array(N), waterM = new Uint8Array(N);
  for (const k of plan.keep || []) disc(k.x, k.y, k.r, i => { if (!inBase(i)) keepM[i] = 1; });
  for (const w of plan.water || []) disc(w.x, w.y, w.r, i => { if (!inBase(i)) waterM[i] = 1; });
  for (let i = 0; i < N; i++) if (keepM[i]) design[i] = 1;
  for (let i = 0; i < N; i++) if (keepM[i]) lake[i] = -1;          // a capital at a lakeside stands on the shore

  // ---- 2. signed distance (km, + on land) of the design, and of the Known World carried straight outward
  const sdOf = mask => { const toLand = edt(GW, GH, i => mask[i] === 1), toSea = edt(GW, GH, i => mask[i] === 0); const s = new Float32Array(N); for (let i = 0; i < N; i++) s[i] = (mask[i] ? toSea[i] - 0.5 : -(toLand[i] - 0.5)) * CELL; return s; };
  const sdDesign = sdOf(design);
  const ext = new Uint8Array(N);
  for (let i = 0; i < N; i++) { const x = clamp(bxOf(i), 0, BW - 1), y = clamp(byOf(i), 0, BH - 1); ext[i] = base.grid[y * BW + x] >= 0 ? 1 : 0; }
  const sdBase = sdOf(ext);
  const nearKeep = plan.keep && plan.keep.length ? edt(GW, GH, i => keepM[i] === 1) : null;

  // ---- 3. the coast: the design pushed about by domain-warped noise, eased into the Known World's own coast at the
  // seams so a coast that reaches the old map's edge carries on across it
  const A = plan.lore ? [0, 42, 16] : [210, 95, 24];
  const land = new Uint8Array(N);
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    const i = y * GW + x;
    if (inBase(i)) { land[i] = baseCell(i) >= 0 ? 1 : 0; continue; }
    const kx = kmX(x), ky = kmY(y), bx = bxOf(i), by = byOf(i);
    const dbox = Math.hypot(Math.max(0, bx - BW + 1, -bx), Math.max(0, by - BH + 1, -by)) * CELL;
    const wx = kx / 1500, wy = ky / 1500;
    const qx = wx + 1.6 * warpA(wx * 0.9, wy * 0.9), qy = wy + 1.6 * warpB(wx * 0.9 + 3.3, wy * 0.9 - 1.7);
    let nz = (A[0] * coastN(qx, qy) + A[1] * fineN(kx / 240, ky / 240) + A[2] * n3(kx / 55, ky / 55)) * smooth(0, 320, dbox);
    if (nearKeep) nz *= smooth(4, 14, nearKeep[i]);           // a capital's shore keeps its place
    // the Known World carried outward only straight across an edge (east, south, north), fading round its corners
    const ox = Math.max(0, bx - BW + 1, -bx), oy = Math.max(0, by - BH + 1, -by), diag = ox > 0 && oy > 0 ? Math.min(ox, oy) * CELL : 0;
    const t = 1 - (1 - smooth(0, 300, dbox)) * (1 - smooth(0, 150, diag));
    const dEdge = Math.min(ky - F.y0, F.x0 + F.W - kx, F.y0 + F.H - ky, by >= 0 && by < BH ? 1e9 : kx - F.x0);
    const f = lerp(sdBase[i], sdDesign[i] + nz, t) - (plan.edgeSea || 0) * 3.3 * smooth(plan.edgeSea || 1, 0, dEdge) * t;
    land[i] = (f > 0 || keepM[i]) && lake[i] < 0 && !waterM[i] ? 1 : 0;
  }
  // islets under 5 cells sink; enclosed water under 40 cells that is no lake or strait becomes land (never in the box)
  const comps = want => {
    const id = new Int32Array(N).fill(-1), list = [];
    for (let s = 0; s < N; s++) {
      if (id[s] >= 0 || land[s] !== want) continue;
      const q = [s]; id[s] = list.length; let touchesBox = false, edge = false;
      for (let h = 0; h < q.length; h++) {
        const i = q[h], x = i % GW, y = (i / GW) | 0;
        if (inBase(i)) touchesBox = true;
        if (x === 0 || y === 0 || x === GW - 1 || y === GH - 1) edge = true;
        for (const j of [x > 0 ? i - 1 : -1, x < GW - 1 ? i + 1 : -1, y > 0 ? i - GW : -1, y < GH - 1 ? i + GW : -1]) if (j >= 0 && id[j] < 0 && land[j] === want) { id[j] = list.length; q.push(j); }
      }
      list.push({ cells: q, touchesBox, edge });
    }
    return { id, list };
  };
  for (const c of comps(1).list) if (c.cells.length < 5 && !c.touchesBox && !c.cells.some(i => keepM[i])) for (const i of c.cells) land[i] = 0;
  for (const c of comps(0).list) if (c.cells.length < 40 && !c.touchesBox && !c.edge && !c.cells.some(i => lake[i] >= 0 || waterM[i])) for (const i of c.cells) land[i] = 1;
  // every far land cell belongs to a region: the shape it lies in, or the nearest one over land
  if (plan.lore) {
    const q = [];
    for (let i = 0; i < N; i++) { if (!land[i] || inBase(i)) label[i] = -1; else if (label[i] >= 0) q.push(i); }
    for (let h = 0; h < q.length; h++) { const i = q[h], x = i % GW; for (const j of [x > 0 ? i - 1 : -1, x < GW - 1 ? i + 1 : -1, i - GW, i + GW]) if (j >= 0 && j < N && land[j] && !inBase(j) && label[j] < 0) { label[j] = label[i]; q.push(j); } }
    // land the flood never reached (an islet made by the noise): the nearest region by centre
    for (let i = 0; i < N; i++) if (land[i] && !inBase(i) && label[i] < 0) { let b = -1, bd = 1e18; regions.forEach((r, k) => { if (r.kind === 'shore') return; const d = (r.c[0] - kmX(i % GW)) ** 2 + (r.c[1] - kmY((i / GW) | 0)) ** 2; if (d < bd) { bd = d; b = k; } }); label[i] = b; }
  }

  // ---- 4. relief
  const toSeaD = edt(GW, GH, i => !land[i]);
  const rid = ridged(n4, 5), relN = fbm(n2, 4);
  const elev = new Float32Array(N);
  const rangeD = (plan.ranges || []).map(r => { const m = new Uint8Array(N); drawLine(GW, GH, spline(toCells(r.pts), 10, false), i => { m[i] = 1; }); return edt(GW, GH, i => m[i] === 1); });
  const platSD = (plan.plateaus || []).map(p => { const m = new Uint8Array(N); fillPolygon(GW, GH, curve(p.pts, true), i => { m[i] = 1; }); return sdOf(m); });
  // the lore gives each region its heights and climate: they are laid as fields and softened across region bounds
  let regE = null, regRel = null, regT = null, regP = null;
  if (plan.lore) {
    regE = new Float32Array(N); regRel = new Float32Array(N); regT = new Float32Array(N); regP = new Float32Array(N);
    const stat = regions.map(r => {
      const mtn = r.terr[0] === 'mountains', lo = r.emin, hi = Math.max(r.emin, r.emax);
      return { e: Math.min(mtn ? lo + 0.25 * (hi - lo) : lo + 0.32 * (hi - lo), 5000), rel: Math.min(1500, (hi - lo) * 0.22),
        T: r.warm != null && r.cold != null ? (r.warm + r.cold) / 2 : null, P: r.rain };
    });
    // where a region says nothing of its climate, latitude speaks for it
    for (let i = 0; i < N; i++) {
      const k = label[i], lat = latOf(kmY((i / GW) | 0)), Tl = 27 - 0.0094 * lat * lat;
      if (k < 0) { regE[i] = land[i] ? 300 : -200; regRel[i] = 100; regT[i] = Tl; regP[i] = 600; continue; }
      const s = stat[k]; regE[i] = s.e; regRel[i] = s.rel; regT[i] = s.T != null ? s.T : Tl; regP[i] = s.P != null ? s.P : 600;
    }
    regE = blur(blur(regE, 0, 9), 1, 9); regRel = blur(blur(regRel, 0, 9), 1, 9); regT = blur(blur(regT, 0, 7), 1, 7); regP = blur(blur(regP, 0, 7), 1, 7);
  }
  for (let i = 0; i < N; i++) {
    if (!land[i]) { elev[i] = -200; continue; }
    const x = i % GW, y = (i / GW) | 0, kx = kmX(x), ky = kmY(y);
    const wx = Math.round(9 * warpA(kx / 700, ky / 700)), wy = Math.round(9 * warpB(kx / 700, ky / 700));
    const iw = clamp(y + wy, 0, GH - 1) * GW + clamp(x + wx, 0, GW - 1);
    const crest = rid(kx / 150 + 0.5 * warpA(kx / 300, ky / 300), ky / 150 + 0.5 * warpB(kx / 300, ky / 300));
    let e = plan.lore ? regE[i] * (0.45 + 0.55 * smooth(0, 160, toSeaD[i] * CELL)) + regRel[i] * (0.6 * relN(kx / 420, ky / 420) + 0.4 * (crest - 0.5))
      : 30 + 480 * (1 - Math.exp(-toSeaD[i] * CELL / 700));
    let mtn = 0;
    (plan.ranges || []).forEach((r, k) => {
      const d = rangeD[k][iw] * CELL, w = r.w * (0.8 + 0.45 * (noise(kx / 600 + 7 * k, ky / 600) + 0.5));
      if (d > w * 2.6) return;
      const env = Math.exp(-(d / w) * (d / w)), along = 0.7 + 0.3 * noise(kx / 380 + 3 * k, ky / 380 - k);
      const top = plan.lore ? Math.max(0, r.h - e) : r.h;
      mtn = Math.max(mtn, top * env * along * (0.3 + 0.7 * Math.pow(crest, 1.3)) + 0.25 * top * env * env);
    });
    e += mtn;
    (plan.plateaus || []).forEach((p, k) => { const t = smooth(-p.edge * 0.5, p.edge * 0.5, platSD[k][i]); e += p.h * t * (p.h > 2000 ? 0.88 + 0.22 * crest : 1); });
    if (!plan.lore) e += 260 * relN(kx / 420, ky / 420) + 90 * n3(kx / 70, ky / 70) + 220 * Math.pow(crest, 3) * smooth(400, 2000, e);
    elev[i] = plan.lore ? Math.max(-150, e) : Math.max(2, e);
  }

  // ---- 5. climate. The lore's regions give their months and rain (laid as fields above, the temperature moved by
  // height against the region's own); the hand plan works them out: latitude, height and distance from the sea, rain
  // carried by four winds with their rain shadows
  const T = new Float32Array(N), P = new Float32Array(N);
  const elevS = blur(blur(elev, 0, 6), 1, 6);
  if (plan.lore) {
    for (let i = 0; i < N; i++) { if (!land[i]) continue; T[i] = regT[i] - 6 * (elev[i] - regE[i]) / 1000; P[i] = regP[i] * (1 + 0.6 * clamp((elev[i] - elevS[i]) / 1500, -0.5, 0.8)); }
  } else {
    const northSea = edt(GW, GH, i => !land[i] && lake[i] < 0 && kmY((i / GW) | 0) < 1500);
    const cont = edt(GW, GH, i => !land[i] && lake[i] < 0);
    for (let i = 0; i < N; i++) {
      const y = (i / GW) | 0, lat = latOf(kmY(y)), al = Math.abs(lat);
      const c = clamp(cont[i] * CELL / 1600, 0, 1), e = Math.max(0, elev[i]);
      T[i] = 25.5 - 0.0094 * lat * lat - 3 * c * clamp((al - 25) / 25, 0, 1) - 5.6 * e / 1000 + 1.5 * smooth(2500, 4500, e) - 5 * Math.exp(-northSea[i] * CELL / 350) * clamp((lat - 40) / 10, 0, 1);
    }
    const sweep = (order, decayKm, rise, h0, recharge) => {
      const out = new Float32Array(N);
      for (const line of order) {
        let h = h0, prevE = 0;
        for (const i of line) {
          if (!land[i]) { h += (1 - h) * recharge; prevE = 0; out[i] = h; continue; }
          const up = Math.max(0, elevS[i] - prevE); prevE = elevS[i];
          const shed = 1 - Math.exp(-up / rise);
          out[i] = h * (1 + 2.2 * shed); h *= Math.exp(-CELL / decayKm) * (1 - 0.85 * shed);
        }
      }
      return out;
    };
    const rows = dir => { const out = []; if (dir === 'E' || dir === 'W') for (let y = 0; y < GH; y++) { const l = []; for (let x = 0; x < GW; x++) l.push(y * GW + x); out.push(dir === 'E' ? l : l.reverse()); } else for (let x = 0; x < GW; x++) { const l = []; for (let y = 0; y < GH; y++) l.push(y * GW + x); out.push(dir === 'S' ? l : l.reverse()); } return out; };
    const west = blur(sweep(rows('E'), 2600, 1600, 0.3, 0.02), 1, 14), east = blur(sweep(rows('W'), 1300, 1200, 1, 0.08), 1, 14);
    const south = blur(sweep(rows('N'), 1050, 800, 1, 0.08), 0, 14), north = blur(sweep(rows('S'), 500, 900, 1, 0.05), 0, 14);
    for (let i = 0; i < N; i++) {
      if (!land[i]) continue;
      const lat = latOf(kmY((i / GW) | 0));
      const wW = clamp((lat - 28) / 12, 0, 1), wE = clamp(1 - Math.abs(lat - 30) / 26, 0, 1), wS = clamp((36 - lat) / 14, 0, 1) * (lat > -12 ? 1 : 0.6), wN = clamp((lat - 40) / 12, 0, 1);
      P[i] = 60 + 700 * west[i] * wW + 1500 * east[i] * wE + 2300 * south[i] * wS + 380 * north[i] * wN + 1700 * Math.exp(-(lat * lat) / 70) * (0.45 + 0.55 * Math.max(east[i], south[i], 0.3));
    }
    const Ps = blur(blur(P, 0, 4), 1, 4); for (let i = 0; i < N; i++) P[i] = land[i] ? Ps[i] : 0;
  }

  // ---- 6. rivers: the lore's courses; or (the hand plan) every drop sent to the sea by a priority flood
  const river = new Uint8Array(N), flow = new Float32Array(N);
  if (plan.lore) {
    for (const r of plan.rivers || []) drawLine(GW, GH, spline(toCells(r.pts), 10, false), i => { if (land[i] && !inBase(i)) river[i] = Math.max(river[i], r.big ? 2 : 1); });
  } else {
    const filled = new Float32Array(N), done = new Uint8Array(N), down = new Int32Array(N).fill(-1), hp = new Heap();
    const nb8 = i => { const x = i % GW, y = (i / GW) | 0, o = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < GW && Y < GH) o.push(Y * GW + X); } return o; };
    for (let i = 0; i < N; i++) if (!land[i] || inBase(i)) { done[i] = 1; filled[i] = land[i] ? elev[i] : -1; }
    for (let i = 0; i < N; i++) if (done[i]) for (const j of nb8(i)) if (!done[j]) { hp.push(filled[i], i); break; }
    const order = [];
    while (hp.size) { const i = hp.pop(); for (const j of nb8(i)) { if (done[j]) continue; done[j] = 1; filled[j] = Math.max(elev[j], filled[i] + 0.01); down[j] = i; order.push(j); hp.push(filled[j], j); } }
    for (let i = 0; i < N; i++) if (land[i] && !inBase(i)) flow[i] = P[i] / 1000;
    for (let k = order.length - 1; k >= 0; k--) { const i = order[k], d = down[i]; if (d >= 0 && land[d] && !inBase(d)) flow[d] += flow[i]; }
    for (let i = 0; i < N; i++) if (land[i] && !inBase(i) && flow[i] > 400) river[i] = flow[i] > 2500 ? 2 : 1;
  }

  // ---- 7. biome per cell
  const biome = new Array(N).fill(null);
  for (let i = 0; i < N; i++) {
    if (!land[i] || inBase(i)) continue;
    const t = T[i], pet = 280 + 48 * Math.max(0, t), m = P[i] / pet, e = elev[i], lat = latOf(kmY((i / GW) | 0));
    let b;
    if (e > 6100 || (t < -15 && e > 3500)) b = 'Glacier';
    else if (e > 3200) b = m > 0.2 ? 'Alpine highland' : 'Desert';
    else if (t < -4.5) b = e > 2400 ? (m > 0.25 ? 'Alpine highland' : 'Desert') : lat > 47 ? 'Tundra' : m > 0.3 ? 'Steppe' : 'Desert';
    else if (t < 3.5) b = m > 0.5 ? 'Taiga' : m > 0.26 ? 'Steppe' : lat > 49 && e < 1200 ? 'Tundra' : 'Desert';
    else if (t < 11) b = m < 0.28 ? 'Desert' : m < 0.62 ? 'Steppe' : m > 2.2 && t > 6 ? 'Temperate rainforest' : 'Temperate forest';
    else if (t < 19.5) b = m < 0.24 ? 'Desert' : m < 0.5 ? 'Steppe' : m < 0.78 ? 'Dry woodland' : 'Temperate forest';
    else b = m < 0.22 ? 'Desert' : m < 0.55 ? 'Savanna' : m < 1.05 ? 'Tropical monsoon forest' : 'Tropical rainforest';
    if ((b === 'Desert' || b === 'Steppe') && river[i] && e < 3300) b = river[i] === 2 || m > 0.18 ? (t > 19 ? 'Savanna' : 'Dry woodland') : b;
    biome[i] = b;
  }
  for (let i = 0; i < N; i++) if (land[i] && !inBase(i) && river[i] === 2 && toSeaD[i] <= 8 && elev[i] < 200 && biome[i] !== 'Desert') biome[i] = 'Marsh';
  return { N, GW, GH, OX, OY, F, kmX, kmY, inBase, baseCell, land, lake, elev, T, P, flow, river, biome, toSeaD, label, regions, plan, shape };
}
