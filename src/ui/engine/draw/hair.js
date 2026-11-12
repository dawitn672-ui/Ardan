// Hair (characters.md §6): an outline first (a mass in the hair's deep value, with air left where it should show),
// then locks. A lock is a guide curve with a width at its root, middle and tip; it is drawn as five layers: a ribbon in
// the hair's light, the shadow where it lies under its neighbour, a highlight band at its own height (so the sheen breaks
// lock by lock and is never a ring), strand lines at full size, and a contour on its outer edge only. Braids are one
// plait repeated along a guide. Brows and beards are the same locks, rooted on the face.
import { parse, mapPath, toBez, sample, frame, band, ellipse, h01 } from './geom.js';

const LIGHT = [-0.6, -0.8];   // the window: up and to the left

// which side of a guide faces the light: -1 or +1 (a band's "across" sign)
function litSide(F) {
  const m = F[Math.floor(F.length / 2)] || F[0];
  return m.nx * LIGHT[0] + m.ny * LIGHT[1] >= 0 ? 1 : -1;
}

// one lock -> layers through emit(role, flatPath, opts)
export function lock(L, ctx, key) {
  const { warp, lod, emit, kSteps } = ctx;
  const g = toBez(mapPath(parse(L.g), warp));
  const F = frame(sample(g, kSteps), L.w, L.ws ?? 1);
  if (F.length < 3) return;
  const s = L.lit ?? litSide(F), ramp = L.ramp || 'hair', base = L.t === 'half' ? 'half' : 'light';
  const tipT = L.tip ?? 0.06;
  // the body: shadow underneath, the light ribbon over it leaving the shadow strip on the far side
  // a lock over the face casts a hard shadow down and right onto the skin under it
  if (L.cast || ctx.cast) {
    const [cx, cy] = L.cast || ctx.cast, G = F.map(f => ({ ...f, x: f.x + cx, y: f.y + cy }));
    emit('skin.shadow', band(G, -1, 1, 0, 1, tipT), { lod: 0, z: 'face', clip: 'head.skin', name: null });
  }
  emit(`${ramp}.${L.t === 'half' ? 'shadow' : 'half'}`, band(F, -1, 1, 0, 1, tipT), { lod: 0 });
  const lo = s > 0 ? -0.45 : -1, hi = s > 0 ? 1 : 0.45;
  emit(`${ramp}.${base}`, band(F, lo, hi, 0, L.lu ?? 1, tipT), { lod: 0 });
  if (lod >= 1 && L.hl !== false) {
    const hc = typeof L.hl === 'number' ? L.hl : 0.22 + 0.36 * h01(key + 'hl'), hw = L.hw ?? 0.13;
    const a = s > 0 ? 0.05 : -0.8, b = s > 0 ? 0.8 : -0.05;
    emit(`${ramp}.hl`, band(F, a, b, Math.max(0, hc - hw), Math.min(1, hc + hw), hw * 0.9), { lod: 1 });
  }
  if (lod >= 2 && L.strands !== 0) {
    const n = L.strands ?? (L.w[1] > 14 ? 3 : 2);
    for (let i = 0; i < n; i++) {
      const c = -0.65 + 1.3 * (i + 0.5) / n + 0.18 * (h01(key + 's' + i) - 0.5), u0 = 0.08 + 0.25 * h01(key + 'a' + i), u1 = 0.62 + 0.36 * h01(key + 'b' + i);
      const lit = c * s > 0, d = L.sd ?? 0.07;
      emit(lit ? `${ramp}.half` : `${ramp}.deep`, band(F, c - d, c + d, u0, u1, 0.3), { lod: 2 });
    }
  }
  // the contour: on a lock of the outline, its outer edge in the line colour; inside the mass only a fine dark seam
  // on its shadow side, where it lies against its neighbour
  const k = ctx.lineK || 1;
  if (L.edge) {
    const e = L.edge, cw = Math.min(0.5, 0.2 * k);
    const a = e > 0 ? 1.04 - cw : -1.04, b = e > 0 ? 1.04 : -1.04 + cw;
    emit(`${ramp}.line`, band(F, a, b, L.e0 ?? 0.1, 1, 0.22), { lod: 0, line: 'contour' });
  } else if (lod >= 1 && L.seam !== false) {
    const e = -s, cw = Math.min(0.3, 0.1 * k);
    const a = e > 0 ? 1 - cw : -1, b = e > 0 ? 1 : -1 + cw;
    emit(`${ramp}.deep`, band(F, a, b, 0.15, 0.95, 0.3), { lod: 1 });
  }
}

// a braid: one plait (two lobes a turn) repeated along the guide, upper lobes over lower ones, a tie and a tuft
export function braid(B, ctx, key) {
  const { warp, lod, emit } = ctx;
  const g = toBez(mapPath(parse(B.g), warp)), P = sample(g, 12), n = B.n || 8, w = B.w || 30, ramp = B.ramp || 'hair';
  // arc-length positions
  const acc = [0]; for (let i = 1; i < P.length; i++) acc.push(acc[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const total = acc[acc.length - 1], at = d => {
    let i = 1; while (i < P.length - 1 && acc[i] < d) i++;
    const t = (d - acc[i - 1]) / ((acc[i] - acc[i - 1]) || 1), x = P[i - 1][0] + (P[i][0] - P[i - 1][0]) * t, y = P[i - 1][1] + (P[i][1] - P[i - 1][1]) * t;
    const dx = P[i][0] - P[i - 1][0], dy = P[i][1] - P[i - 1][1], l = Math.hypot(dx, dy) || 1;
    return [x, y, dx / l, dy / l];
  };
  const len = total * (B.body ?? 0.86), step = len / n, lobes = [];
  for (let i = 0; i < n; i++) {
    const taper = 1 - 0.35 * i / n, [x, y, tx, ty] = at(step * (i + 0.5)), side = i % 2 ? 1 : -1, nx = -ty, ny = tx;
    const cx = x + nx * side * w * 0.2 * taper, cy = y + ny * side * w * 0.2 * taper, rot = Math.atan2(ty, tx) + side * 0.62;
    lobes.push({ cx, cy, rx: step * 1.12, ry: w * 0.36 * taper, rot, side });
  }
  emit(`${ramp}.deep`, band(frame(P, [w * 0.95, w * 0.85, w * 0.6]), -1, 1, 0, B.body ?? 0.86, 0.02), { lod: 0 });
  for (let i = lobes.length - 1; i >= 0; i--) {
    const o = lobes[i];
    emit(`${ramp}.shadow`, ellipse(o.cx, o.cy, o.rx, o.ry, o.rot), { lod: 0 });
    emit(`${ramp}.light`, ellipse(o.cx - 0.12 * o.ry * Math.sin(o.rot) * -1 - 1.5, o.cy - 0.18 * o.ry - 1, o.rx * 0.86, o.ry * 0.62, o.rot), { lod: 0 });
    if (lod >= 1) emit(`${ramp}.hl`, ellipse(o.cx - 0.25 * o.rx * Math.cos(o.rot) - 2, o.cy - 0.25 * o.rx * Math.sin(o.rot) - 0.3 * o.ry, o.rx * 0.38, o.ry * 0.2, o.rot), { lod: 1 });
    if (lod >= 2) for (let k = -1; k <= 1; k += 2) emit(`${ramp}.half`, ellipse(o.cx + k * 0.25 * o.ry * Math.sin(o.rot), o.cy - k * 0.25 * o.ry * Math.cos(o.rot), o.rx * 0.7, 0.9, o.rot), { lod: 2 });
    emit(`${ramp}.line`, ellipse(o.cx, o.cy, o.rx, o.ry, o.rot), { lod: 0, stroke: 1.6, line: 'contour' });
  }
  // the tie and the tuft below it
  const [tx0, ty0, ux, uy] = at(len + 2), nx = -uy, ny = ux, tw = w * 0.42;
  const tuft = B.tuft ?? 5;
  for (let k = 0; k < tuft; k++) {
    const sp = (k / (tuft - 1) - 0.5), ang = sp * 0.7, ex = ux * Math.cos(ang) - uy * Math.sin(ang), ey = ux * Math.sin(ang) + uy * Math.cos(ang);
    const L = 26 + 22 * h01(key + 't' + k), x0 = tx0 + nx * sp * tw * 0.9, y0 = ty0 + ny * sp * tw * 0.9;
    const gg = `M ${Math.round(x0)} ${Math.round(y0)} S ${Math.round(x0 + ex * L * 0.5 + nx * sp * 6)} ${Math.round(y0 + ey * L * 0.5 + ny * sp * 6)} ${Math.round(x0 + ex * L + nx * sp * 12)} ${Math.round(y0 + ey * L + ny * sp * 12)}`;
    lock({ g: gg, w: [7, 6, 1], ramp, strands: 1, e0: 0.3 }, { ...ctx, warp: (x, y) => [x, y] }, key + 'k' + k);
  }
  if (B.tie) {
    const role = B.tie;
    emit(`${role}.shadow`, ellipse(tx0, ty0, tw * 0.95, 6.5, Math.atan2(ny, nx)), { lod: 0 });
    emit(`${role}.light`, ellipse(tx0 - 1, ty0 - 1.5, tw * 0.85, 4.2, Math.atan2(ny, nx)), { lod: 0 });
    emit(`${role}.line`, ellipse(tx0, ty0, tw * 0.95, 6.5, Math.atan2(ny, nx)), { lod: 1, stroke: 1.3, line: 'form' });
  }
}

// brow or beard hairs: short tapered strokes grown from points inside a band along a guide, angled by a growth field
// (`ang` at the guide's start and end, in radians), skipped where a cut crosses (cuts: lists of points with a reach)
export function hairs(H, ctx, key, cuts = []) {
  const { warp, emit } = ctx;
  const g = toBez(mapPath(parse(H.g), warp)), F = frame(sample(g, 10), H.w);
  const n = H.n || 30, out = [], cut = (x, y) => cuts.some(c => c.pts.some(p => (p[0] - x) * (p[0] - x) + (p[1] - y) * (p[1] - y) < c.r * c.r));
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n + 0.6 / n * (h01(key + 'u' + i) - 0.5), j = Math.min(F.length - 1, Math.max(0, Math.round(u * (F.length - 1)))), f = F[j];
    // roots lie toward the lower edge (lo > 0): hairs grow up and along, over each other
    const across = (h01(key + 'v' + i) - 0.5) * 1.6 + (H.lo || 0), x = f.x + f.nx * across * f.w / 2, y = f.y + f.ny * across * f.w / 2;
    if (cut(x, y)) continue;
    const jit = 0.3 * (h01(key + 'a' + i) - 0.5);
    const a = H.lean ? Math.atan2(-f.nx, f.ny) + H.lean[0] + (H.lean[1] - H.lean[0]) * u + jit : H.ang[0] + (H.ang[1] - H.ang[0]) * u + jit;
    const L = (H.len[0] + (H.len[1] - H.len[0]) * u) * (0.75 + 0.5 * h01(key + 'l' + i));
    const bend = (H.bend || 0) * L;
    const ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L, mx = (x + ex) / 2 - Math.sin(a) * bend, my = (y + ey) / 2 + Math.cos(a) * bend;
    out.push({ x, y, ex, ey, mx, my, u, i });
  }
  return out;
}
// strokes -> one flat path of tapered slivers (batched: one item per colour)
export function strokePath(S, wid = 1.4) {
  const out = [];
  for (const s of S) {
    const dx = s.ex - s.x, dy = s.ey - s.y, l = Math.hypot(dx, dy) || 1, nx = -dy / l * wid / 2, ny = dx / l * wid / 2;
    out.push(0, s.x + nx, s.y + ny, 2, s.mx + nx * 1.2, s.my + ny * 1.2, s.mx + nx * 0.6, s.my + ny * 0.6, s.ex, s.ey,
      2, s.mx - nx * 0.6, s.my - ny * 0.6, s.mx - nx * 1.2, s.my - ny * 1.2, s.x - nx, s.y - ny, 3);
  }
  return out;
}
