// The shape of the far lands from the lore's regions (loreplan.mjs). The lore gives every region a box, a middle and
// an area, and the boxes of neighbours overlap; the land is cut from them so that every region holds about the land
// it is owed and the sea lies where the lore's boxes face no neighbour:
//   - each region bids for the cells of its box (and a margin round it); a cell is cheap near the region's middle,
//     cheaper deep inside the lore's lands (so neighbours meet and the coast falls on the outer side), and moved by
//     one shared noise, so a coast wanders the same way across a region bound
//   - cells go to the cheapest bid until each region has its area: the mainland first, all its regions at once
//   - islands bid inside their own boxes, kept a channel's width from the mainland; an archipelago's bid is mostly
//     noise, so its land breaks into many islands; a chain's noise is drawn out along the chain
//   - a capital's ground and a strait's two shores are cheap for their region; a strait itself is never land
// Then the pieces are tidied: a region's stray fragments join the region round them, enclosed sea that is no lake
// becomes land, and the edges are softened. Deterministic: no random stream, only seeded noise.
import { perlin, fbm, edt, clamp, smooth, Heap, blur as blurA } from './lib.mjs';

export function loreShape(F, GW, GH, plan, seed, isBase, baseLand) {
  const N = GW * GH, C = 10, regs = plan.regions;
  const kmX = i => F.x0 + (i % GW) * C + 5, kmY = i => F.y0 + ((i / GW) | 0) * C + 5;
  const blur = (a, axis, r) => blurA(a, GW, GH, axis, r);
  const span = (bb, m) => ({ x0: clamp(Math.floor((bb.x0 - m - F.x0) / C), 0, GW - 1), x1: clamp(Math.ceil((bb.x1 + m - F.x0) / C) - 1, 0, GW - 1),
    y0: clamp(Math.floor((bb.y0 - m - F.y0) / C), 0, GH - 1), y1: clamp(Math.ceil((bb.y1 + m - F.y0) / C) - 1, 0, GH - 1) });
  // ---- noise shared by every region (normalised: about -0.5 to 0.5)
  const big = fbm(perlin(seed + 41), 5, 2.05, 0.5), mid = fbm(perlin(seed + 42), 4, 2.1, 0.5);
  const wA = fbm(perlin(seed + 43), 3), wB = fbm(perlin(seed + 44), 3), archN = fbm(perlin(seed + 45), 4, 2.0, 0.55);
  const nz = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const kx = kmX(i), ky = kmY(i), wx = kx / 1100, wy = ky / 1100;
    const qx = wx + 0.9 * wA(wx * 0.7, wy * 0.7), qy = wy + 0.9 * wB(wx * 0.7 + 5.2, wy * 0.7 - 1.3);
    nz[i] = 0.75 * big(qx, qy) + 0.4 * mid(kx / 300 + 0.4 * wA(kx / 900, ky / 900), ky / 300);
  }
  // ---- depth inside the lore's lands: the mainland boxes and the Known World's land
  const U = new Uint8Array(N);
  for (const r of regs) if (r.kind === 'main') { const s = span(r.bb, 0); for (let y = s.y0; y <= s.y1; y++) U.fill(1, y * GW + s.x0, y * GW + s.x1 + 1); }
  for (let i = 0; i < N; i++) if (isBase(i)) U[i] = baseLand(i) ? 1 : 0;
  const uD = edt(GW, GH, i => !U[i]);
  // ---- where land may never be: the Known World's box (its own), the straits, the frame's north and east edges
  const banned = new Uint8Array(N);
  for (let i = 0; i < N; i++) { const x = i % GW, y = (i / GW) | 0; if (isBase(i) || y < 4 || x >= GW - 4) banned[i] = 1; }
  for (const s of plan.straits || []) { const cx = (s.x - F.x0) / C, cy = (s.y - F.y0) / C, rr = clamp(s.w / 2, 8, 150) / C;
    for (let y = Math.floor(cy - rr); y <= Math.ceil(cy + rr); y++) for (let x = Math.floor(cx - rr); x <= Math.ceil(cx + rr); x++) if (x >= 0 && y >= 0 && x < GW && y < GH && (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= rr * rr) banned[y * GW + x] = 1; }
  // ---- a region's bid for a cell
  const segD = (px, py, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1, t = clamp(((px - a[0]) * dx + (py - a[1]) * dy) / L2, 0, 1); return Math.hypot(px - a[0] - t * dx, py - a[1] - t * dy); };
  const PAR = { main: { m: 160, lam: 0.62, sig: 0.55 }, island: { m: 110, lam: 0, sig: 0.6 }, arch: { m: 60, lam: 0, sig: 1.25 }, chain: { m: 60, lam: 0, sig: 1.0 } };
  const bidder = (r, k) => {
    const P = PAR[r.kind], bb = r.bb, a = (bb.x1 - bb.x0) / 2, b = (bb.y1 - bb.y0) / 2, cx = (bb.x0 + bb.x1) / 2, cy = (bb.y0 + bb.y1) / 2;
    // an archipelago's noise, its grain set by its box (a chain's drawn out along it)
    const g = clamp(Math.min(a, b) * (r.kind === 'chain' ? 0.9 : 0.55), 45, 260), st = r.kind === 'chain' || r.kind === 'arch' ? clamp(Math.sqrt(Math.max(a, b) / Math.min(a, b)), 1, 3.2) : 1;
    const gx = a >= b ? g * st : g, gy = a >= b ? g : g * st, ox = k * 37.1, oy = k * 11.7;
    return i => {
      const kx = kmX(i), ky = kmY(i), dx = Math.abs(kx - cx) / a, dy = Math.abs(ky - cy) / b;
      const rho = Math.cbrt(dx * dx * dx + dy * dy * dy), out = Math.hypot(Math.max(0, Math.abs(kx - cx) - a), Math.max(0, Math.abs(ky - cy) - b));
      let c = (r.kind === 'arch' || r.kind === 'chain' ? 0.45 : 1) * rho + out / (r.kind === 'main' ? 90 : 45) - P.lam * clamp(uD[i] * C / 420, 0, 1);
      c += r.kind === 'arch' || r.kind === 'chain' ? -P.sig * archN(kx / gx + ox, ky / gy + oy) : P.sig * nz[i];
      for (const cp of r.caps) { const d = Math.hypot(kx - cp.x, ky - cp.y); if (d < 110) c -= 1.4 * (1 - smooth(35, 110, d)); }
      for (const l of r.lanes) { const d = segD(kx, ky, l.a, l.b); if (d < 75) c -= 1.1 * (1 - smooth(30, 75, d)); }
      if (r.kind !== 'main' && kmY(i) > F.y0 + F.H - 40) c += 3;          // whole islands, not ones the frame cuts
      return c;
    };
  };
  const owner = new Int16Array(N).fill(-1), count = new Int32Array(regs.length), target = regs.map(r => Math.round(r.area / (C * C)));
  // the cheapest bids win, region by region until each is full; ties go to the lower cell, then the lower region
  const auction = (list, ok) => {
    const ri = [], ci = [], cost = [];
    for (const k of list) {
      const r = regs[k], s = span(r.bb, PAR[r.kind].m), f = bidder(r, k);
      for (let y = s.y0; y <= s.y1; y++) for (let x = s.x0; x <= s.x1; x++) { const i = y * GW + x; if (banned[i] || !ok(i, k)) continue; ri.push(k); ci.push(i); cost.push(f(i)); }
    }
    const order = Uint32Array.from(cost.keys()).sort((p, q) => cost[p] - cost[q] || ci[p] - ci[q] || ri[p] - ri[q]);
    for (const o of order) { const k = ri[o], i = ci[o]; if (owner[i] >= 0 || count[k] >= target[k]) continue; owner[i] = k; count[k]++; }
  };
  const idx = kind => regs.map((r, k) => r.kind === kind ? k : -1).filter(k => k >= 0);
  const nbr4 = i => { const x = i % GW, o = []; if (x > 0) o.push(i - 1); if (x < GW - 1) o.push(i + 1); if (i >= GW) o.push(i - GW); if (i < N - GW) o.push(i + GW); return o; };
  // a region's stray pieces (under a third of its largest, and under 150,000 km2) go to the region they touch most;
  // touching none they stay
  const tidy = kinds => {
    const seen = new Uint8Array(N), all = new Map();
    for (let s = 0; s < N; s++) {
      if (seen[s] || owner[s] < 0 || !kinds.includes(regs[owner[s]].kind)) continue;
      const k = owner[s], q = [s]; seen[s] = 1;
      for (let h = 0; h < q.length; h++) for (const j of nbr4(q[h])) if (!seen[j] && owner[j] === k) { seen[j] = 1; q.push(j); }
      if (!all.has(k)) all.set(k, []); all.get(k).push(q);
    }
    for (const [k, list] of all) {
      const parts = list.sort((a, b) => b.length - a.length), big = parts[0].length;
      for (const q of parts.slice(1)) {
        if (q.length >= big / 3 || q.length > 1500) continue;
        const tally = new Map(); for (const i of q) for (const j of nbr4(i)) { const o = owner[j]; if (o >= 0 && o !== k) tally.set(o, (tally.get(o) || 0) + 1); }
        if (!tally.size) continue;
        const to = [...tally.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
        for (const i of q) owner[i] = to;
      }
    }
  };
  // ---- the mainland. Each cell near the lore's boxes is one region's: the region it lies deepest in (for its box's
  // size); a cell outside every box, the nearest box's. A cell's worth is how deep it lies in the lore's lands (km to
  // their outer edge, the boxes' union rounded and its edges bent by a slow warp, so no coast runs along a box side),
  // moved near the coast by the shared noise. All of it is land at first, out to 60 km past the lands' edge; then the
  // sea comes in from outside, always taking the least worth cell it touches, and takes a region's cells only while
  // the region holds more than its area, never deeper than 320 km in, and never through one region into the next. So a region with land to spare loses it from
  // its sea side, in bays and gulfs where the noise runs low, and a region the lore boxes in keeps the rest of its box
  // rather than open a sea in the middle of the continent. A capital's ground and a strait's shores are worth more, so the sea leaves them.
  const main = idx('main'), own = new Int16Array(N).fill(-1), ownD = new Float32Array(N).fill(-1e9);
  for (const k of main) {
    const r = regs[k], bb = r.bb, s = span(bb, 300), W2 = bb.x1 - bb.x0, H2 = bb.y1 - bb.y0;
    for (let y = s.y0; y <= s.y1; y++) for (let x = s.x0; x <= s.x1; x++) {
      const i = y * GW + x; if (banned[i]) continue;
      const kx = kmX(i), ky = kmY(i), inside = kx >= bb.x0 && kx <= bb.x1 && ky >= bb.y0 && ky <= bb.y1;
      const d = inside ? Math.min((kx - bb.x0) / W2, (bb.x1 - kx) / W2, (ky - bb.y0) / H2, (bb.y1 - ky) / H2)
        : -1 - Math.hypot(Math.max(0, bb.x0 - kx, kx - bb.x1), Math.max(0, bb.y0 - ky, ky - bb.y1)) / 1000;
      if (d > ownD[i] || (d === ownD[i] && k < own[i])) { ownD[i] = d; own[i] = k; }
    }
  }
  // the lands' outline: the boxes' union, rounded (a blur and a cut) and bent (sampled through a warp of ~250 km)
  const Uf = new Float32Array(N); for (let i = 0; i < N; i++) Uf[i] = U[i];
  const Us = blur(blur(Uf, 0, 9), 1, 9), U2 = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    if (isBase(i)) { U2[i] = U[i]; continue; }
    const kx = kmX(i), ky = kmY(i), x = i % GW, y = (i / GW) | 0;
    const sx = clamp(Math.round(x + 26 * wA(kx / 1300, ky / 1300)), 0, GW - 1), sy = clamp(Math.round(y + 26 * wB(kx / 1300 + 3.1, ky / 1300 - 2.2)), 0, GH - 1);
    U2[i] = Us[sy * GW + sx] >= 0.5 ? 1 : 0;
  }
  const inD = edt(GW, GH, i => !U2[i]), outD = edt(GW, GH, i => U2[i] === 1), worth = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const k = own[i]; if (k < 0) continue;
    const r = regs[k], kx = kmX(i), ky = kmY(i);
    const dep = (U2[i] ? inD[i] - 0.5 : 0.5 - outD[i]) * C;
    let w = dep + 330 * nz[i] * (1 - 0.7 * smooth(220, 650, dep));
    for (const cp of r.caps) { const d = Math.hypot(kx - cp.x, ky - cp.y); if (d < 110) w += 420 * (1 - smooth(35, 110, d)); }
    for (const l of r.lanes) { const d = segD(kx, ky, l.a, l.b); if (d < 75) w += 300 * (1 - smooth(30, 75, d)); }
    worth[i] = w;
  }
  // enclosed sea in the mainland that is no lake (the lakes are cut later) is land of the region round it: before
  // the sea comes in (so it comes only from the open sea) and after
  const fillHoles = () => {
    const seen = new Uint8Array(N);
    for (let s = 0; s < N; s++) {
      if (seen[s] || owner[s] >= 0 || isBase(s) && baseLand(s)) continue;
      const q = [s]; seen[s] = 1; let open = false;
      for (let h = 0; h < q.length; h++) { const i = q[h], x = i % GW, y = (i / GW) | 0; if (x === 0 || y === 0 || x === GW - 1 || y === GH - 1 || isBase(i)) open = true;
        for (const j of nbr4(i)) if (!seen[j] && owner[j] < 0 && !(isBase(j) && baseLand(j))) { seen[j] = 1; q.push(j); } }
      if (open) continue;
      // grow the regions round it inward
      const inQ = new Set(q), g = [];
      for (const i of q) { let o = -1; for (const j of nbr4(i)) if (owner[j] >= 0 && (o < 0 || owner[j] < o)) o = owner[j]; if (o >= 0) { owner[i] = o; g.push(i); } }
      for (let h = 0; h < g.length; h++) for (const j of nbr4(g[h])) if (inQ.has(j) && owner[j] < 0) { owner[j] = owner[g[h]]; g.push(j); }
    }
  };
  for (let i = 0; i < N; i++) if (own[i] >= 0 && worth[i] > -60) { owner[i] = own[i]; count[own[i]]++; }
  fillHoles();
  count.fill(0);
  for (let i = 0; i < N; i++) if (owner[i] >= 0) count[owner[i]]++;
  if (process.env.FL_DEBUG) { const c0 = new Int32Array(regs.length); for (let i = 0; i < N; i++) if (own[i] >= 0) c0[own[i]]++; console.log('own', main.map(k => regs[k].id + ':' + (c0[k] / target[k]).toFixed(2) + '/' + (count[k] / target[k]).toFixed(2)).join(' ')); }
  {
    // the sea comes in from the far seas only: within 250 km of the Known World the land runs on as its coast does
    // (geo.mjs eases it into the old map's own), so a bay of the old map is no road into the new
    const toBox = edt(GW, GH, i => isBase(i)), hp = new Heap(), queued = new Uint8Array(N), DEEP = 320;
    for (let i = 0; i < N; i++) if (toBox[i] * C < 250) queued[i] = 1;
    const touch = i => nbr4(i).some(j => owner[j] < 0 && !isBase(j));
    for (let i = 0; i < N; i++) if (owner[i] >= 0 && !queued[i] && touch(i)) { hp.push(worth[i], i); queued[i] = 1; }
    while (hp.size) {
      const i = hp.pop(), k = owner[i];
      if (hp.lastKey > DEEP) break;
      if (k < 0 || count[k] <= target[k]) continue;
      owner[i] = -1; count[k]--;
      // a region's own bays go on into it; the sea never follows one region's bay into the next
      for (const j of nbr4(i)) if (owner[j] === k && !queued[j]) { queued[j] = 1; hp.push(worth[j], j); }
    }
  }
  const dbg = tag => { if (!process.env.FL_DEBUG) return; const c0 = new Int32Array(regs.length); for (let i = 0; i < N; i++) if (owner[i] >= 0) c0[owner[i]]++; console.log(tag, ['B-08', 'N-02', 'F-01', 'T-08', 'M-10'].map(id => { const k = regs.findIndex(r => r.id === id); return id + ':' + (c0[k] / target[k]).toFixed(2); }).join(' ')); };
  dbg('eroded');
  tidy(['main']);
  dbg('tidied');
  fillHoles();
  dbg('filled');
  // ---- islands, archipelagos and chains, a channel off the mainland and off each other
  const off = (min) => { const d = edt(GW, GH, i => owner[i] >= 0); return i => d[i] * C >= min; };
  const offMain = off(40);
  const isl = idx('island').sort((a, b) => regs[b].area - regs[a].area || a - b);
  for (const k of isl) { const away = off(30); auction([k], i => offMain(i) && away(i)); }
  const arch = idx('arch').concat(idx('chain')).sort((a, b) => regs[b].area - regs[a].area || a - b);
  for (const k of arch) { const away = off(25); auction([k], i => offMain(i) && away(i)); }
  // ---- soften: a blur and a cut takes the stair-steps and the one-cell spits off every coast
  const lf = new Float32Array(N); for (let i = 0; i < N; i++) lf[i] = owner[i] >= 0 ? 1 : 0;
  const sm = blur(blur(lf, 0, 2), 1, 2);
  const design = new Uint8Array(N), label = new Int16Array(N).fill(-1);
  for (let i = 0; i < N; i++) if (!banned[i] && sm[i] >= 0.5) design[i] = 1;
  // labels: a cell keeps its owner; a cell the softening made land takes the nearest owner over land
  const q = [];
  for (let i = 0; i < N; i++) if (design[i] && owner[i] >= 0) { label[i] = owner[i]; q.push(i); }
  for (let h = 0; h < q.length; h++) for (const j of nbr4(q[h])) if (design[j] && label[j] < 0) { label[j] = label[q[h]]; q.push(j); }
  // the shores of a strait that is a region of its own (the Strait of Suraeng): the land nearest the narrows
  for (const k of idx('shore')) {
    const r = regs[k], st = (plan.straits || []).find(s => s.x >= r.bb.x0 && s.x <= r.bb.x1 && s.y >= r.bb.y0 && s.y <= r.bb.y1);
    const at = st ? [st.x, st.y] : r.c, s = span(r.bb, 0), cand = [];
    for (let y = s.y0; y <= s.y1; y++) for (let x = s.x0; x <= s.x1; x++) { const i = y * GW + x; if (design[i]) cand.push([Math.hypot(kmX(i) - at[0], kmY(i) - at[1]), i]); }
    cand.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    for (const [, i] of cand.slice(0, target[k])) label[i] = k;
  }
  const got = regs.map(() => 0); for (let i = 0; i < N; i++) if (label[i] >= 0) got[label[i]]++;
  return { design, label, owner, got: got.map((n, k) => ({ id: regs[k].id, want: target[k], got: n })), uD };
}
