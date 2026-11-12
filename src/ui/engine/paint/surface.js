// The surfaces of a person (characters.md §2): big volumes in millimetres joined smoothly, features pushed in or out,
// layers (hair, cloth, metal) as their own surfaces over the body. Each surface is a signed distance: negative inside.
// A scene is a list of groups; a group is a run of primitives combined in order (smooth add, smooth cut, smooth keep)
// and has one material. The painter (raster.js) finds where a ray first meets any group.

export const ELL = 0, CAP = 1, BOX = 2, TOR = 3, PLANE = 4, EYE = 5;
export const ADD = 0, SUB = 1, INT = 2;
export const STRIDE = 28;
// record: 0 type, 1 op, 2 k (blend mm), 3 group, 4-6 c / a, 7-9 b, 10-12 r (ell radii; cap r1 r2; box half; tor R r),
// 13-21 inverse rotation (row-major), 22 rotated?, 23 bound radius, 24-26 bound centre, 27 box rounding

export const vec = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
  len: a => Math.hypot(a[0], a[1], a[2]),
  norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
};
// 3x3 rotations, row-major
export const rotY = a => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 1, 0, -s, 0, c]; };
export const rotX = a => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; };
export const rotZ = a => { const c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, s, c, 0, 0, 0, 1]; };
export const mmul = (A, B) => { const R = new Array(9); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) R[i * 3 + j] = A[i * 3] * B[j] + A[i * 3 + 1] * B[3 + j] + A[i * 3 + 2] * B[6 + j]; return R; };
export const mvec = (M, v) => [M[0] * v[0] + M[1] * v[1] + M[2] * v[2], M[3] * v[0] + M[4] * v[1] + M[5] * v[2], M[6] * v[0] + M[7] * v[1] + M[8] * v[2]];
export const mT = M => [M[0], M[3], M[6], M[1], M[4], M[7], M[2], M[5], M[8]];
export const ID = [1, 0, 0, 0, 1, 0, 0, 0, 1];

// primitive builders (plain objects; the scene packs them)
export const ell = (c, r, o = {}) => ({ t: ELL, c, r: typeof r === 'number' ? [r, r, r] : r, ...o });
export const cap = (a, b, r1, r2 = r1, o = {}) => ({ t: CAP, a, b, r1, r2, ...o });
export const box = (c, half, round = 0, o = {}) => ({ t: BOX, c, half, round, ...o });
export const tor = (c, R, r, o = {}) => ({ t: TOR, c, R, r2: r, ...o });
export const plane = (n, off, o = {}) => ({ t: PLANE, n: vec.norm(n), off, ...o });
// a primitive mirrored to the person's other side
export function mirror(p) {
  const q = { ...p };
  const fx = v => v && [-v[0], v[1], v[2]];
  if (p.c) q.c = fx(p.c); if (p.a) q.a = fx(p.a); if (p.b) q.b = fx(p.b); if (p.n) q.n = fx(p.n);
  if (p.rot) { const R = p.rot; q.rot = [R[0], -R[1], -R[2], -R[3], R[4], R[5], -R[6], R[7], R[8]]; }
  return q;
}
export const both = p => [p, mirror(p)];

// transform a primitive by rotation M about pivot P (row-major M maps model to world)
export function place(p, M, P = [0, 0, 0], T = [0, 0, 0]) {
  const tp = v => { const w = mvec(M, vec.sub(v, P)); return [w[0] + P[0] + T[0], w[1] + P[1] + T[1], w[2] + P[2] + T[2]]; };
  const q = { ...p };
  if (p.c) q.c = tp(p.c); if (p.a) q.a = tp(p.a); if (p.b) q.b = tp(p.b);
  if (p.n) { q.n = mvec(M, p.n); q.off = p.off + vec.dot(q.n, vec.add(vec.sub(P, mvec(M, P)), T)); }
  if (p.t === ELL || p.t === BOX || p.t === TOR || p.t === EYE) q.rot = mmul(M, p.rot || ID);
  return q;
}

// pack groups of primitive objects into one Float64Array; groups: [{ prims, mat, ... }]
export function pack(groups) {
  let n = 0; for (const g of groups) n += g.prims.length;
  const P = new Float64Array(n * STRIDE); let i = 0;
  groups.forEach((g, gi) => {
    for (const p of g.prims) {
      const o = i * STRIDE, k = p.k ?? g.k ?? 0;
      P[o] = p.t; P[o + 1] = p.op ?? ADD; P[o + 2] = k; P[o + 3] = gi;
      let bc, br;
      if (p.t === ELL || p.t === BOX || p.t === TOR) {
        P[o + 4] = p.c[0]; P[o + 5] = p.c[1]; P[o + 6] = p.c[2];
        if (p.t === ELL) { P[o + 10] = p.r[0]; P[o + 11] = p.r[1]; P[o + 12] = p.r[2]; br = Math.max(...p.r); }
        if (p.t === BOX) { P[o + 10] = p.half[0]; P[o + 11] = p.half[1]; P[o + 12] = p.half[2]; P[o + 27] = p.round || 0; br = Math.hypot(...p.half); }
        if (p.t === TOR) { P[o + 10] = p.R; P[o + 11] = p.r2; br = p.R + p.r2; }
        const Ri = mT(p.rot || ID); for (let j = 0; j < 9; j++) P[o + 13 + j] = Ri[j]; P[o + 22] = p.rot ? 1 : 0;
        bc = p.c;
      } else if (p.t === CAP) {
        P[o + 4] = p.a[0]; P[o + 5] = p.a[1]; P[o + 6] = p.a[2]; P[o + 7] = p.b[0]; P[o + 8] = p.b[1]; P[o + 9] = p.b[2];
        P[o + 10] = p.r1; P[o + 11] = p.r2;
        bc = vec.lerp(p.a, p.b, 0.5); br = vec.len(vec.sub(p.b, p.a)) / 2 + Math.max(p.r1, p.r2);
      } else if (p.t === EYE) {
        // the opening between the lids: an almond (eye-local x from inner to outer corner, y up) pushed forward
        P[o + 4] = p.c[0]; P[o + 5] = p.c[1]; P[o + 6] = p.c[2];
        P[o + 7] = p.yi; P[o + 8] = p.yo; P[o + 9] = p.side; P[o + 10] = p.half; P[o + 11] = p.up; P[o + 12] = p.lo; P[o + 27] = p.z0 || 0;
        const Ri = mT(p.rot || ID); for (let j = 0; j < 9; j++) P[o + 13 + j] = Ri[j]; P[o + 22] = 1;
        bc = p.c; br = p.half + 30;
      } else if (p.t === PLANE) {
        P[o + 4] = p.n[0]; P[o + 5] = p.n[1]; P[o + 6] = p.n[2]; P[o + 7] = p.off; bc = [0, 0, 0]; br = 1e6;
      }
      P[o + 23] = br + k; P[o + 24] = bc[0]; P[o + 25] = bc[1]; P[o + 26] = bc[2];
      i++;
    }
  });
  return P;
}

// one primitive's distance at (x, y, z)
export function primDist(P, o, x, y, z) {
  const t = P[o];
  if (t === CAP) {
    const ax = P[o + 4], ay = P[o + 5], az = P[o + 6], bx = P[o + 7] - ax, by = P[o + 8] - ay, bz = P[o + 9] - az;
    const px = x - ax, py = y - ay, pz = z - az;
    let h = (px * bx + py * by + pz * bz) / (bx * bx + by * by + bz * bz); h = h < 0 ? 0 : h > 1 ? 1 : h;
    const dx = px - bx * h, dy = py - by * h, dz = pz - bz * h;
    return Math.sqrt(dx * dx + dy * dy + dz * dz) - (P[o + 10] + (P[o + 11] - P[o + 10]) * h);
  }
  if (t === PLANE) return P[o + 4] * x + P[o + 5] * y + P[o + 6] * z - P[o + 7];
  let qx = x - P[o + 4], qy = y - P[o + 5], qz = z - P[o + 6];
  if (P[o + 22]) { const a = qx, b = qy, c = qz; qx = P[o + 13] * a + P[o + 14] * b + P[o + 15] * c; qy = P[o + 16] * a + P[o + 17] * b + P[o + 18] * c; qz = P[o + 19] * a + P[o + 20] * b + P[o + 21] * c; }
  if (t === ELL) {
    const rx = P[o + 10], ry = P[o + 11], rz = P[o + 12];
    const ax = qx / rx, ay = qy / ry, az = qz / rz, k0 = Math.sqrt(ax * ax + ay * ay + az * az);
    const bx = ax / rx, by = ay / ry, bz = az / rz, k1 = Math.sqrt(bx * bx + by * by + bz * bz);
    return k1 < 1e-9 ? -Math.min(rx, ry, rz) : k0 * (k0 - 1) / k1;
  }
  if (t === BOX) {
    const rr = P[o + 27];
    const dx = Math.abs(qx) - P[o + 10] + rr, dy = Math.abs(qy) - P[o + 11] + rr, dz = Math.abs(qz) - P[o + 12] + rr;
    const mx = dx > 0 ? dx : 0, my = dy > 0 ? dy : 0, mz = dz > 0 ? dz : 0;
    const inside = Math.max(dx, dy, dz);
    return Math.sqrt(mx * mx + my * my + mz * mz) + (inside < 0 ? inside : 0) - rr;
  }
  if (t === EYE) {
    const half = P[o + 10], xs = qx * P[o + 9];
    let tt = (xs + half) / (2 * half);
    const dx = (tt < 0 ? -tt : tt > 1 ? tt - 1 : 0) * 2 * half;
    tt = tt < 0 ? 0 : tt > 1 ? 1 : tt;
    const base = P[o + 7] + (P[o + 8] - P[o + 7]) * tt, tu = Math.pow(tt, 0.85), tl = Math.pow(tt, 1.2);
    const upper = base + P[o + 11] * 4 * tu * (1 - tu), lower = base - P[o + 12] * 4 * tl * (1 - tl);
    const dy = Math.max(qy - upper, lower - qy) * 0.75;
    const d2 = dx > 0 ? Math.sqrt(dx * dx + Math.max(0, dy) * Math.max(0, dy)) : dy;
    return Math.max(d2, P[o + 27] - qz);
  }
  if (t === TOR) { const a = Math.sqrt(qx * qx + qz * qz) - P[o + 10]; return Math.sqrt(a * a + qy * qy) - P[o + 11]; }
  return 1e9;
}

// combine one primitive into a running distance
export function combine(d, e, op, k) {
  if (op === ADD) {
    if (k <= 0) return d < e ? d : e;
    let h = 0.5 + 0.5 * (e - d) / k; if (h <= 0) return e; if (h >= 1) return d;
    return e + (d - e) * h - k * h * (1 - h);
  }
  if (op === SUB) {
    if (k <= 0) return d > -e ? d : -e;
    let h = 0.5 - 0.5 * (d + e) / k; if (h <= 0) return d; if (h >= 1) return -e;
    return d + (-e - d) * h + k * h * (1 - h);
  }
  if (k <= 0) return d > e ? d : e;
  let h = 0.5 - 0.5 * (e - d) / k; if (h <= 0) return e; if (h >= 1) return d;
  return e + (d - e) * h + k * h * (1 - h);
}
