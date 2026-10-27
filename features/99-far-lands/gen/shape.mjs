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
  for (const s of plan.straits || []) { const cx = (s.x - F.x0) / C, cy = (s.y - F.y0) / C, rr = clamp(s.w / 2, 12, 150) / C;
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
    // far@2: where two lands must stay one shore (the Rime Coast and the Black Pines), the ground either side of their
    // meeting is never the sea's
    for (const [a, b] of (plan.tight && plan.tight.keepPairs) || []) {
      const dA = edt(GW, GH, i => owner[i] >= 0 && regs[owner[i]].land === a), dB = edt(GW, GH, i => owner[i] >= 0 && regs[owner[i]].land === b), w = (plan.tight.keepKm || 80) / C;
      for (let i = 0; i < N; i++) if (owner[i] >= 0 && ((regs[owner[i]].land === a && dB[i] <= w) || (regs[owner[i]].land === b && dA[i] <= w))) queued[i] = 1;
    }
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
  // ---- far@2: a land the lore boxes in on most sides keeps far more than its area after the sea above (the Black
  // Pines held 17.3 M km² against the lore's 9.4 M). Its regions' boxes are the boxes of ragged shapes, so the land
  // is cut a second time by land, not by region: the sea comes in again from the open sea, least worth first, with
  // no depth limit, and takes any cell of a land while the land holds more than its regions' areas together (lands
  // can be joined to count as one, plan.tight.join). A region already at its area is crossed only at a cost. It never
  // takes the ground round a capital, a strait's shores, or the coast within 250 km of the Known World. Then the
  // land's cells are shared out again among its regions, each bidding for the cells nearest its box, so every region
  // holds its area. A cell's worth here also rises toward its region's middle, so the land stays round the lore's
  // centres and the sea comes in at the boxes' corners and margins.
  function tighten() {
    const T = plan.tight, grp = k => (T.join && T.join[regs[k].land]) || regs[k].land;
    const want = {}, have = {};
    for (const k of main) { const g = grp(k); want[g] = (want[g] || 0) + target[k]; }
    for (let i = 0; i < N; i++) { const k = owner[i]; if (k >= 0 && regs[k].kind === 'main') { const g = grp(k); have[g] = (have[g] || 0) + 1; } }
    const over = Object.keys(want).filter(g => (T.lands ? T.lands.includes(g) : true) && have[g] > want[g] * (T.slack || 1.04));
    if (!over.length) return;
    const isOver = new Set(over), toBox = edt(GW, GH, i => isBase(i)), hp = new Heap(), queued = new Uint8Array(N), safe = new Uint8Array(N);
    for (let i = 0; i < N; i++) if (toBox[i] * C < 250) safe[i] = 1;
    // a land the sea must not cut off from the mainland keeps the ground next to it (the Rime Coast is the pines' shore)
    if (T.keepBy && T.keepBy.length) {
      const by = new Set(T.keepBy), d = edt(GW, GH, i => owner[i] >= 0 && by.has(regs[owner[i]].land));
      for (let i = 0; i < N; i++) if (d[i] * C <= (T.keepKm || 80)) safe[i] = 1;
    }
    for (const r of regs) {
      for (const cp of r.caps) disc(cp.x, cp.y, T.capR || 90, i => { safe[i] = 1; });
      for (const l of r.lanes) { const n = Math.ceil(Math.hypot(l.b[0] - l.a[0], l.b[1] - l.a[1]) / 20); for (let s = 0; s <= n; s++) disc(l.a[0] + (l.b[0] - l.a[0]) * s / n, l.a[1] + (l.b[1] - l.a[1]) * s / n, 40, i => { safe[i] = 1; }); }
    }
    const w2 = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const k = owner[i]; if (k < 0) continue;
      const bb = regs[k].bb, a = (bb.x1 - bb.x0) / 2, b = (bb.y1 - bb.y0) / 2, cx = regs[k].c[0], cy = regs[k].c[1];
      const rho = Math.hypot((kmX(i) - cx) / a, (kmY(i) - cy) / b);
      w2[i] = worth[i] + (T.mid || 300) * (1 - clamp(rho, 0, 1.5) / 1.5) + (T.noise || 0) * nz[i];
    }
    const cand = i => { const k = owner[i]; return k >= 0 && regs[k].kind === 'main' && isOver.has(grp(k)) && !safe[i]; };
    const touch = i => nbr4(i).some(j => owner[j] < 0 && !isBase(j));
    for (let i = 0; i < N; i++) if (cand(i) && touch(i)) queued[i] = 1;
    count.fill(0); for (let i = 0; i < N; i++) if (owner[i] >= 0) count[owner[i]]++;
    for (let i = 0; i < N; i++) if (queued[i]) hp.push(w2[i] + (count[owner[i]] > target[owner[i]] ? 0 : (T.pass || 500)), i);
    // a region that already holds no more than its area is crossed only where the land behind it must give way
    count.fill(0); for (let i = 0; i < N; i++) if (owner[i] >= 0) count[owner[i]]++;
    const PASS = T.pass || 500, key = i => w2[i] + (count[owner[i]] > target[owner[i]] ? 0 : PASS);
    while (hp.size) {
      const i = hp.pop(), at = hp.lastKey, k = owner[i];
      if (k < 0) continue;
      const g = grp(k); if (have[g] <= want[g]) continue;
      const now = key(i); if (now > at + 1e-3) { hp.push(now, i); continue; }
      if (!simple(i)) continue;   // the sea never cuts the land in two: no channel, no new island
      owner[i] = -1; have[g]--; count[k]--;
      for (const j of nbr4(i)) if (!queued[j] && cand(j)) { queued[j] = 1; hp.push(key(j), j); }
    }
    // the land's cells shared out again among its regions: a region short of its area takes the cells it bids
    // least for along its border with a neighbour of the same land that holds more than its own (so the Rime Coast
    // follows the new Arctic shore south into the pines, and each region stays in one piece round its middle)
    for (let round = 0; round < 3; round++) {
      count.fill(0); for (let i = 0; i < N; i++) if (owner[i] >= 0) count[owner[i]]++;
      const bids = new Map(), hq = new Heap(), seen = new Set();
      const bid = (k, i) => { let f = bids.get(k); if (!f) bids.set(k, f = bidder(regs[k], k)); return f(i); };
      const short = k => count[k] < target[k], long = k => count[k] > target[k];
      const offer = (k, i) => { const key = i * 128 + k; if (seen.has(key)) return; seen.add(key); hq.push(bid(k, i), key); };
      for (let i = 0; i < N; i++) {
        const k = owner[i]; if (k < 0 || regs[k].kind !== 'main' || !isOver.has(grp(k)) || !short(k)) continue;
        for (const j of nbr4(i)) { const o = owner[j]; if (o >= 0 && o !== k && grp(o) === grp(k) && long(o) && !safe2(j, o)) offer(k, j); }
      }
      let moved = 0;
      while (hq.size) {
        const key = hq.pop(), i = Math.floor(key / 128), k = key % 128, o = owner[i];
        if (o < 0 || o === k || !short(k) || !long(o)) continue;
        owner[i] = k; count[k]++; count[o]--; moved++;
        for (const j of nbr4(i)) { const p = owner[j]; if (p >= 0 && p !== k && grp(p) === grp(k) && long(p) && !safe2(j, p)) offer(k, j); }
      }
      if (!moved) break;
    }
  }
  // a capital's own ground stays its region's
  function safe2(i, k) { for (const cp of regs[k].caps) if (Math.hypot(kmX(i) - cp.x, kmY(i) - cp.y) < 60) return true; return false; }
  // ---- far@2: a land the lore boxes in on every side (the High Steppes, the Twin Rivers) cannot lose land to the sea
  // without opening seas inside the continent. Its excess becomes high waste along the lore's own ranges instead:
  // the cells nearest its ranges' lines (moved by the shared noise, so the band is ragged), taken while the land holds
  // more than its regions' areas, go to the land's waste region (kind 'waste', code L-00: no realm, few people,
  // mountains). The ground round a capital, a strait's shores and the seam with the Known World stay as they are.
  function wastes() {
    const T = plan.tight, toBox = edt(GW, GH, i => isBase(i));
    for (const L of T.waste) {
      const wk = regs.findIndex(r => r.kind === 'waste' && r.land === L); if (wk < 0) continue;
      const mine = new Set(main.filter(k => regs[k].land === L));
      let have = 0, want = 0; for (const k of mine) want += target[k];
      for (let i = 0; i < N; i++) if (owner[i] >= 0 && mine.has(owner[i])) have++;
      want = Math.round(want * ((T.wasteSlack && T.wasteSlack[L]) || 1));   // province bounds later shift a little land between waste and region
      if (have <= want) continue;
      const lines = (plan.ranges || []).filter(g => g.land === L || (T.wasteRanges && T.wasteRanges[L] && T.wasteRanges[L].includes(g.id)));
      if (!lines.length) continue;
      const m = new Uint8Array(N);
      for (const g of lines) { const pts = g.pts.map(([x, y]) => [(x - F.x0) / C, (y - F.y0) / C]); for (let a = 1; a < pts.length; a++) { const n = Math.ceil(Math.hypot(pts[a][0] - pts[a - 1][0], pts[a][1] - pts[a - 1][1])); for (let t = 0; t <= n; t++) { const x = Math.round(pts[a - 1][0] + (pts[a][0] - pts[a - 1][0]) * t / n), y = Math.round(pts[a - 1][1] + (pts[a][1] - pts[a - 1][1]) * t / n); if (x >= 0 && y >= 0 && x < GW && y < GH) m[y * GW + x] = 1; } } }
      const dR = edt(GW, GH, i => m[i] === 1), safe = new Uint8Array(N);
      for (let i = 0; i < N; i++) if (toBox[i] * C < 200) safe[i] = 1;
      for (const r of regs) { for (const cp of r.caps) disc(cp.x, cp.y, T.capR || 90, i => { safe[i] = 1; }); }
      const cand = [];
      for (let i = 0; i < N; i++) if (owner[i] >= 0 && mine.has(owner[i]) && !safe[i] && dR[i] * C < (T.wasteKm || 450)) cand.push([dR[i] * C - (T.wasteNoise || 160) * nz[i], i]);
      cand.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      for (const [, i] of cand) { if (have <= want) break; count[owner[i]]--; owner[i] = wk; count[wk]++; have--; }
    }
  }
  // ---- far@2: a land the lore's boxes give less ground than its area (the Deep Southland) grows into the sea round
  // its boxes, nearest them first, by the region beside it that is shortest of its area; never into the Known
  // World's box or within 150 km of it, never nearer than 60 km to another land, never past 350 km from a box
  function grow() {
    const T = plan.tight, toBox = edt(GW, GH, i => isBase(i));
    for (const L of T.grow) {
      const mine = main.filter(k => regs[k].land === L), set = new Set(mine);
      let have = 0, want = 0; for (const k of mine) want += target[k];
      want = Math.round(want * ((T.growGain && T.growGain[L]) || 1));   // the coast's noise, the lakes and the seam with the Known World take some back
      for (let i = 0; i < N; i++) if (owner[i] >= 0 && set.has(owner[i])) have++;
      if (process.env.FL_DEBUG) console.log('grow', L, have, want);
      if (have >= want) continue;
      const other = edt(GW, GH, i => owner[i] >= 0 && !set.has(owner[i]));
      const boxOut = i => { let b = 1e9; const kx = kmX(i), ky = kmY(i); for (const k of mine) { const bb = regs[k].bb; b = Math.min(b, Math.hypot(Math.max(0, bb.x0 - kx, kx - bb.x1), Math.max(0, bb.y0 - ky, ky - bb.y1))); } return b; };
      const ok = i => owner[i] < 0 && !banned[i] && !isBase(i) && toBox[i] * C >= 150 && other[i] * C >= 60;
      const hp = new Heap(), seen = new Uint8Array(N);
      const push = i => { if (seen[i] || !ok(i)) return; const b = boxOut(i); if (b > (T.growKm || 350)) return; seen[i] = 1; hp.push(b - 120 * nz[i], i); };
      for (let i = 0; i < N; i++) if (owner[i] >= 0 && set.has(owner[i])) for (const j of nbr4(i)) push(j);
      while (hp.size && have < want) {
        const i = hp.pop(); if (owner[i] >= 0) continue;
        let best = -1, bs = -Infinity; for (const j of nbr4(i)) { const k = owner[j]; if (k >= 0 && set.has(k)) { const sc = target[k] - count[k]; if (sc > bs) { bs = sc; best = k; } } }
        if (best < 0) continue;
        owner[i] = best; count[best]++; have++;
        for (const j of nbr4(i)) push(j);
      }
      if (process.env.FL_DEBUG) console.log('grown', L, have, want);
    }
  }
  // a land cell the sea may take without cutting the land in two: its land neighbours, round the ring (a corner
  // counts only with both its sides, as land joins by edges), make at most one run
  function simple(i) {
    const x = i % GW, y = (i / GW) | 0, L = (dx, dy) => { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= GW || yy >= GH) return false; const j = yy * GW + xx; return owner[j] >= 0 || (isBase(j) && baseLand(j)); };
    const o = [L(0, -1), L(1, -1), L(1, 0), L(1, 1), L(0, 1), L(-1, 1), L(-1, 0), L(-1, -1)];
    for (const d of [1, 3, 5, 7]) o[d] = o[d] && o[d - 1] && o[(d + 1) % 8];
    let runs = 0; for (let k = 0; k < 8; k++) if (o[k] && !o[(k + 7) % 8]) runs++;
    return runs <= 1;
  }
  function disc(x, y, r, put) { const cx = (x - F.x0) / C, cy = (y - F.y0) / C, rr = r / C; for (let yy = Math.floor(cy - rr); yy <= Math.ceil(cy + rr); yy++) for (let xx = Math.floor(cx - rr); xx <= Math.ceil(cx + rr); xx++) if (xx >= 0 && yy >= 0 && xx < GW && yy < GH && (xx + 0.5 - cx) ** 2 + (yy + 0.5 - cy) ** 2 <= rr * rr) put(yy * GW + xx); }
  const dbg = tag => { if (!process.env.FL_DEBUG) return; const c0 = new Int32Array(regs.length); for (let i = 0; i < N; i++) if (owner[i] >= 0) c0[owner[i]]++; const col = x => { const seg = []; let cur = null; for (let y = 0; y < 300; y++) { const o = owner[y * GW + Math.round((x - F.x0) / C)], id = o >= 0 ? regs[o].id : '~'; if (id !== cur) { seg.push((F.y0 + y * C) + ':' + id); cur = id; } } return seg.join(' '); }; console.log(tag, 'top@10000', JSON.stringify(col(10000)), 'top@9500', JSON.stringify(col(9500)), ['N-01', 'T-05', 'F-01', 'T-08', 'M-10'].map(id => { const k = regs.findIndex(r => r.id === id); return id + ':' + (c0[k] / target[k]).toFixed(2); }).join(' ')); };
  dbg('eroded');
  if (plan.tight) tighten();
  if (plan.tight && plan.tight.waste) wastes();
  if (plan.tight && plan.tight.grow) grow();
  dbg('tightened');
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
