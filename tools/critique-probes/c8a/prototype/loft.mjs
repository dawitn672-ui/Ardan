// C8a realism prototype (throwaway): a "loft" is a surface given as a radius around an upright axis, R(angle, height),
// in millimetres. A head is one loft: big volumes joined smoothly, then features pushed out or in along the radius, so a
// cheekbone or a jaw moves the outline too. The same data gives the front, the three-quarter and the profile view.
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

// angles: dense across the face, sparse round the back
export function phis(front = 1.0, back = 4.0, lim = 78) {
  const out = []; let a = -180;
  while (a < 180 - 1e-6) { out.push(a * Math.PI / 180); a += Math.abs(a) < lim ? front : Math.abs(a) < lim + 25 ? (front + back) / 2 : back; }
  out.push(Math.PI); return out;
}
export function ysOf(y0, y1, step) { const out = []; for (let y = y0; y <= y1 + 1e-6; y += step) out.push(y); return out; }

// prims: ellipsoids { c, r, Q (columns = axes), k }; blobs: radial pushes { c, r, amt }; ridges: { pts, w, amt }
export function makeLoft({ axisZ = -8, axisX = 0, ys, ph, prims, blobs = [], ridges = [], shells = [], minR = 0 }) {
  const nu = ph.length, nv = ys.length, R = new Float32Array(nu * nv).fill(minR), sn = ph.map(Math.sin), cs = ph.map(Math.cos);
  // 1. the union of the volumes: where a level ray from the axis leaves each ellipsoid
  for (const p of prims) {
    const Q = p.Q || [1, 0, 0, 0, 1, 0, 0, 0, 1], r = p.r, k = p.k == null ? 8 : p.k;
    // rows of the inverse: (column i of Q) / r_i
    const b = [[Q[0] / r[0], Q[3] / r[0], Q[6] / r[0]], [Q[1] / r[1], Q[4] / r[1], Q[7] / r[1]], [Q[2] / r[2], Q[5] / r[2], Q[8] / r[2]]];
    const ey = Math.hypot(Q[3] * r[0], Q[4] * r[1], Q[5] * r[2]);
    const dcol = new Float32Array(nu * 3), acol = new Float32Array(nu);
    for (let i = 0; i < nu; i++) { const d0 = b[0][0] * sn[i] + b[0][2] * cs[i], d1 = b[1][0] * sn[i] + b[1][2] * cs[i], d2 = b[2][0] * sn[i] + b[2][2] * cs[i]; dcol[i * 3] = d0; dcol[i * 3 + 1] = d1; dcol[i * 3 + 2] = d2; acol[i] = d0 * d0 + d1 * d1 + d2 * d2; }
    for (let j = 0; j < nv; j++) {
      const y = ys[j]; if (y < p.c[1] - ey || y > p.c[1] + ey) continue;
      const ox = axisX - p.c[0], oy = y - p.c[1], oz = axisZ - p.c[2];
      const o0 = b[0][0] * ox + b[0][1] * oy + b[0][2] * oz, o1 = b[1][0] * ox + b[1][1] * oy + b[1][2] * oz, o2 = b[2][0] * ox + b[2][1] * oy + b[2][2] * oz, cc = o0 * o0 + o1 * o1 + o2 * o2 - 1;
      for (let i = 0; i < nu; i++) {
        const a = acol[i], bb = o0 * dcol[i * 3] + o1 * dcol[i * 3 + 1] + o2 * dcol[i * 3 + 2], disc = bb * bb - a * cc;
        if (disc <= 0) continue;
        const sq = Math.sqrt(disc), t = (sq - bb) / a; if (t <= 0) continue;
        const n = j * nu + i, old = R[n], d = t - old, ad = d < 0 ? -d : d;
        let v = d > 0 ? t : old;
        if (k > 0 && ad < k && old > minR + 1e-3) { const h = (k - ad) / k, e = sq / a / (0.5 * k + 1); v += h * h * k * 0.25 * (e > 1 ? 1 : e); }
        R[n] = v;
      }
    }
  }
  const P = (i, j, out) => { const r = R[j * nu + i]; out[0] = axisX + r * sn[i]; out[1] = ys[j]; out[2] = axisZ + r * cs[i]; return out; };
  // 2. features pushed along the radius. Each is measured at the surface as it stood before any push.
  const base = R.slice(), tmp = [0, 0, 0];
  const Pb = (i, j, out) => { const r = base[j * nu + i]; out[0] = axisX + r * sn[i]; out[1] = ys[j]; out[2] = axisZ + r * cs[i]; return out; };
  for (const b of blobs) {
    const r = b.r, ix = 1 / r[0], iy = 1 / r[1], iz = 1 / r[2];
    for (let j = 0; j < nv; j++) { if (ys[j] < b.c[1] - r[1] || ys[j] > b.c[1] + r[1]) continue;
      for (let i = 0; i < nu; i++) { if (base[j * nu + i] <= minR) continue; Pb(i, j, tmp); const qx = (tmp[0] - b.c[0]) * ix, qy = (tmp[1] - b.c[1]) * iy, qz = (tmp[2] - b.c[2]) * iz, q = qx * qx + qy * qy + qz * qz; if (q < 1) R[j * nu + i] += b.amt * (1 - q) * (1 - q); } }
  }
  for (const g of ridges) {
    const pts = g.pts, w = g.w, reach = w * 2.4; let ylo = 1e9, yhi = -1e9; for (const p of pts) { ylo = Math.min(ylo, p[1]); yhi = Math.max(yhi, p[1]); }
    for (let j = 0; j < nv; j++) { if (ys[j] < ylo - reach || ys[j] > yhi + reach) continue;
      for (let i = 0; i < nu; i++) { if (base[j * nu + i] <= minR) continue; Pb(i, j, tmp); let best = 1e9, bt = 0;
        for (let n = 0; n < pts.length - 1; n++) { const a = pts[n], c = pts[n + 1], abx = c[0] - a[0], aby = c[1] - a[1], abz = c[2] - a[2], L2 = abx * abx + aby * aby + abz * abz || 1e-6; let t = ((tmp[0] - a[0]) * abx + (tmp[1] - a[1]) * aby + (tmp[2] - a[2]) * abz) / L2; t = clamp(t, 0, 1); const ex = tmp[0] - a[0] - abx * t, ey = tmp[1] - a[1] - aby * t, ez = tmp[2] - a[2] - abz * t, d = ex * ex + ey * ey + ez * ez; if (d < best) { best = d; bt = (n + t) / (pts.length - 1); } }
        const u = Math.sqrt(best) / w; if (u < 2.4) { const tp = g.taper ? Math.pow(Math.sin(Math.PI * clamp(bt, 0, 1)), 0.6) : 1; R[j * nu + i] += g.amt * Math.exp(-u * u * 1.6) * tp; } } }
  }
  // 3. shells laid over the carved surface afterwards (eyelids over the socket): a sphere seen from the axis
  for (const s of shells) {
    for (let j = 0; j < nv; j++) { const y = ys[j]; if (y < s.c[1] - s.r || y > s.c[1] + s.r) continue; const ox = axisX - s.c[0], oy = y - s.c[1], oz = axisZ - s.c[2], cc = ox * ox + oy * oy + oz * oz - s.r * s.r;
      for (let i = 0; i < nu; i++) { const bb = ox * sn[i] + oz * cs[i], disc = bb * bb - cc; if (disc <= 0) continue; const sq = Math.sqrt(disc), t = sq - bb; if (t <= 0) continue; const n = j * nu + i, old = R[n], d = t - old, ad = Math.abs(d), k = s.k || 3; if (d < -k) continue; let v = d > 0 ? t : old; if (ad < k) { const h = (k - ad) / k; v += h * h * k * 0.25 * Math.min(1, sq / (0.5 * k + 1)); } R[n] = v; } }
  }
  const pos = new Float32Array(nu * nv * 3);
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { P(i, j, tmp); const n = (j * nu + i) * 3; pos[n] = tmp[0]; pos[n + 1] = tmp[1]; pos[n + 2] = tmp[2]; }
  return { nu, nv, pos, R, ys, ph };
}
// the same surface pushed out by a thickness (a garment, a coif, a head of hair lies over what is under it)
export function offsetLoft(l, by, axisZ = -8, axisX = 0) {
  const { nu, nv, ys, ph } = l, R = new Float32Array(nu * nv), pos = new Float32Array(nu * nv * 3);
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const n = j * nu + i, add = typeof by === 'function' ? by(ph[i], ys[j], l.R[n]) : by, r = l.R[n] > 0.01 ? l.R[n] + add : 0; R[n] = r; pos[n * 3] = axisX + r * Math.sin(ph[i]); pos[n * 3 + 1] = ys[j]; pos[n * 3 + 2] = axisZ + r * Math.cos(ph[i]); }
  return { nu, nv, pos, R, ys, ph };
}
