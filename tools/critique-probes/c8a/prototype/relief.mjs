// C8a realism prototype (throwaway, not the game's code).
// A head sculpted from primitives in MILLIMETRES, splatted to a depth buffer, lit and painted per pixel.
// Head space: x to the picture's right, y down from the top of the skull, z toward the viewer.
// Question it answers: can one lit form carry identity, age, structural scars and materials, and what does a pixel cost?

export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
export const hexLin = h => [lin(parseInt(h.slice(1, 3), 16)), lin(parseInt(h.slice(3, 5), 16)), lin(parseInt(h.slice(5, 7), 16))];
const GAM = new Uint8ClampedArray(4097); for (let i = 0; i <= 4096; i++) { const v = i / 4096; GAM[i] = Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055)); }
const toS = v => GAM[v <= 0 ? 0 : v >= 1 ? 4096 : (v * 4096) | 0];

// integer hash noise: bit-identical on every engine
export const ih = (x, y, s) => { let h = Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1) ^ Math.imul(s | 0, 0x9e3779b1); h = Math.imul(h ^ (h >>> 15), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
export const vnoise = (x, y, s) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); return lerp(lerp(ih(xi, yi, s), ih(xi + 1, yi, s), u), lerp(ih(xi, yi + 1, s), ih(xi + 1, yi + 1, s), u), v); };
export const fbm = (x, y, s) => vnoise(x, y, s) * 0.5 + vnoise(x * 2.03, y * 2.03, s + 7) * 0.3 + vnoise(x * 4.1, y * 4.1, s + 13) * 0.2;
export const strHash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
export const rngOf = seed => { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };

// ---- matrices (row-major 3x3)
const I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const mul3 = (a, b) => { const o = new Array(9); for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) o[r * 3 + c] = a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c]; return o; };
const rotY = t => { const c = Math.cos(t), s = Math.sin(t); return [c, 0, s, 0, 1, 0, -s, 0, c]; };
const rotX = t => { const c = Math.cos(t), s = Math.sin(t); return [1, 0, 0, 0, c, -s, 0, s, c]; };
const rotZ = t => { const c = Math.cos(t), s = Math.sin(t); return [c, -s, 0, s, c, 0, 0, 0, 1]; };
const tr3 = m => [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
const mv = (m, v) => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
// a frame whose first axis runs along d
function frameAlong(d) {
  const n = Math.hypot(d[0], d[1], d[2]) || 1, a = [d[0] / n, d[1] / n, d[2] / n];
  const up = Math.abs(a[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let b = [a[1] * up[2] - a[2] * up[1], a[2] * up[0] - a[0] * up[2], a[0] * up[1] - a[1] * up[0]]; const bn = Math.hypot(...b); b = b.map(v => v / bn);
  const c = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  return [a[0], b[0], c[0], a[1], b[1], c[1], a[2], b[2], c[2]];   // columns a, b, c
}

// ---- model helpers
export const MAT = { bg: 0, skin: 1, eye: 2, hair: 3, cloth: 4, mail: 5, plate: 6, leather: 7, fur: 8 };
export const E = (c, r, o = {}) => ({ t: 'e', c, r: typeof r === 'number' ? [r, r, r] : r, Q: o.Q || null, k: o.k == null ? 6 : o.k, mat: o.mat || MAT.skin, grp: o.grp || 1, tag: o.tag || 0, clip: o.clip || null });
export const EA = (p0, p1, rc, o = {}) => { const d = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]], L = Math.hypot(...d); return E([(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2], [L / 2 + rc * (o.cap == null ? 0.6 : o.cap), rc, o.rc2 || rc], Object.assign({}, o, { Q: frameAlong(d) })); };
export const symE = (c, r, o = {}) => [E(c, r, o), E([-c[0], c[1], c[2]], r, Object.assign({}, o, o.Q ? { Q: mirQ(o.Q) } : {}))];
const mirQ = Q => [Q[0], -Q[1], -Q[2], -Q[3], Q[4], Q[5], -Q[6], Q[7], Q[8]];
export const blob = (c, r, amt, o = {}) => ({ t: 'b', c, r: typeof r === 'number' ? [r, r, r] : r, amt, grp: o.grp || 1, col: o.col || null, a: o.a == null ? 1 : o.a, only: o.only || 0 });
export const stroke = (pts, w, amt, o = {}) => ({ t: 's', pts, w, amt, prof: o.prof || 'g', grp: o.grp || 1, col: o.col || null, a: o.a == null ? 1 : o.a, rag: o.rag || 0, seed: o.seed || 1 });
export const mirB = b => b.t === 'b' ? Object.assign({}, b, { c: [-b.c[0], b.c[1], b.c[2]] }) : Object.assign({}, b, { pts: b.pts.map(p => [-p[0], p[1], p[2]]) });
export const sym = b => [b, mirB(b)];

// ---- the renderer
export function render(model, W, H, o = {}) {
  const t0 = performance.now();
  const ss = o.ss || 1, w = W * ss, h = H * ss, N = w * h;
  const s = (o.scale || (H / 360)) * ss;                        // pixels per millimetre
  const ox = (o.ox == null ? W / 2 : o.ox) * ss, oy = (o.oy == null ? H * 0.085 : o.oy) * ss;
  const Z = new Float32Array(N).fill(-1e9), M = new Uint8Array(N), GR = new Uint8Array(N), TG = new Uint8Array(N), SRC = new Uint8Array(N), CL = new Uint8Array(N);
  const LX = new Float32Array(N), LY = new Float32Array(N), LZ = new Float32Array(N);
  const NX = new Float32Array(N), NY = new Float32Array(N), NZ = new Float32Array(N), DZ = new Float32Array(N);
  const groups = model.groups;                                  // id -> { R, pivot }
  const toView = (g, p) => { const G = groups[g], q = mv(G.R, [p[0] - G.pivot[0], p[1] - G.pivot[1], p[2] - G.pivot[2]]); return [q[0] + G.pivot[0] + (G.off ? G.off[0] : 0), q[1] + G.pivot[1] + (G.off ? G.off[1] : 0), q[2] + G.pivot[2]]; };

  // 0. lofts: a grid of points round an axis, drawn as small triangles into the depth buffer, each pixel keeping its
  //    place in the model's own space. A clip function may cut a pixel out (an eye opening, a hairline, a neckline).
  let tris = 0;
  for (const L of model.lofts || []) {
    const { nu, nv, pos } = L.grid, G = groups[L.grp], Rm = G.R, pv = G.pivot, n = nu * nv, SX = new Float32Array(n), SY = new Float32Array(n), SZ = new Float32Array(n);
    for (let v = 0; v < n; v++) { const x = pos[v * 3] - pv[0], y = pos[v * 3 + 1] - pv[1], z = pos[v * 3 + 2] - pv[2]; SX[v] = ox + (Rm[0] * x + Rm[1] * y + Rm[2] * z + pv[0]) * s; SY[v] = oy + (Rm[3] * x + Rm[4] * y + Rm[5] * z + pv[1]) * s; SZ[v] = Rm[6] * x + Rm[7] * y + Rm[8] * z + pv[2]; }
    const mat = L.mat, grp = L.grp, tag = L.tag || 0, clip = L.clip || null, bias = L.bias || 0;
    const VN = new Float32Array(n * 3);
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const v = j * nu + i, a = j * nu + (i > 0 ? i - 1 : i), b = j * nu + (i < nu - 1 ? i + 1 : i), c = (j > 0 ? j - 1 : j) * nu + i, d = (j < nv - 1 ? j + 1 : j) * nu + i;
      const ux = SX[b] - SX[a], uy = SY[b] - SY[a], uz = (SZ[b] - SZ[a]) * s, vx = SX[d] - SX[c], vy = SY[d] - SY[c], vz = (SZ[d] - SZ[c]) * s;
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1;
      VN[v * 3] = nx / l; VN[v * 3 + 1] = ny / l; VN[v * 3 + 2] = nz / l;
    }
    const tri = (a, b, c) => {
      const x0 = SX[a], y0 = SY[a], x1 = SX[b], y1 = SY[b], x2 = SX[c], y2 = SY[c];
      const area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0); if (area >= -1e-9) return;            // back-facing or empty
      const minx = Math.max(0, Math.ceil(Math.min(x0, x1, x2) - 0.5)), maxx = Math.min(w - 1, Math.floor(Math.max(x0, x1, x2) - 0.5)), miny = Math.max(0, Math.ceil(Math.min(y0, y1, y2) - 0.5)), maxy = Math.min(h - 1, Math.floor(Math.max(y0, y1, y2) - 0.5));
      if (minx > maxx || miny > maxy) return;
      tris++;
      const ia = 1 / area, z0 = SZ[a], z1 = SZ[b], z2 = SZ[c];
      const a3 = a * 3, b3 = b * 3, c3 = c * 3;
      for (let y = miny; y <= maxy; y++) { const py = y + 0.5;
        for (let x = minx; x <= maxx; x++) { const px = x + 0.5;
          const w0 = ((x1 - px) * (y2 - py) - (x2 - px) * (y1 - py)) * ia, w1 = ((x2 - px) * (y0 - py) - (x0 - px) * (y2 - py)) * ia, w2 = 1 - w0 - w1;
          if (w0 < -1e-4 || w1 < -1e-4 || w2 < -1e-4) continue;
          const z = w0 * z0 + w1 * z1 + w2 * z2 + bias, i = y * w + x; if (z <= Z[i]) continue;
          const lx = w0 * pos[a3] + w1 * pos[b3] + w2 * pos[c3], ly = w0 * pos[a3 + 1] + w1 * pos[b3 + 1] + w2 * pos[c3 + 1], lz = w0 * pos[a3 + 2] + w1 * pos[b3 + 2] + w2 * pos[c3 + 2];
          if (clip) { const cc = clip(lx, ly, lz); if (cc !== 1) { if (cc > 1 && !M[i]) CL[i] = cc; continue; } }
          Z[i] = z; M[i] = mat; GR[i] = grp; TG[i] = tag; SRC[i] = 1; CL[i] = 0; LX[i] = lx; LY[i] = ly; LZ[i] = lz;
          NX[i] = w0 * VN[a3] + w1 * VN[b3] + w2 * VN[c3]; NY[i] = w0 * VN[a3 + 1] + w1 * VN[b3 + 1] + w2 * VN[c3 + 1]; NZ[i] = w0 * VN[a3 + 2] + w1 * VN[b3 + 2] + w2 * VN[c3 + 2];
        } }
    };
    for (let j = 0; j < nv - 1; j++) for (let i = 0; i < nu - 1; i++) { const a = j * nu + i, b = a + 1, c = a + nu, d = c + 1; tri(a, c, b); tri(b, c, d); }
  }
  const tL = performance.now();

  // 1. base primitives: ellipsoids joined by a smooth maximum of depth
  for (const p of model.prims) {
    const G = groups[p.grp], RQ = p.Q ? mul3(G.R, p.Q) : G.R, r = p.r, c = toView(p.grp, p.c);
    const ex = Math.hypot(RQ[0] * r[0], RQ[1] * r[1], RQ[2] * r[2]), ey = Math.hypot(RQ[3] * r[0], RQ[4] * r[1], RQ[5] * r[2]);
    const Xc = ox + c[0] * s, Yc = oy + c[1] * s;
    const x0 = Math.max(0, Math.ceil(Xc - ex * s - 0.5)), x1 = Math.min(w - 1, Math.floor(Xc + ex * s - 0.5)), y0 = Math.max(0, Math.ceil(Yc - ey * s - 0.5)), y1 = Math.min(h - 1, Math.floor(Yc + ey * s - 0.5));
    const i0 = RQ[0] / r[0] / s, i1 = RQ[1] / r[1] / s, i2 = RQ[2] / r[2] / s, j0 = RQ[3] / r[0] / s, j1 = RQ[4] / r[1] / s, j2 = RQ[5] / r[2] / s;
    const w0 = RQ[6] / r[0], w1 = RQ[7] / r[1], w2 = RQ[8] / r[2], a = w0 * w0 + w1 * w1 + w2 * w2, ia = 1 / a;
    const k = p.k, mat = p.mat, grp = p.grp, tag = p.tag, kf = 1 / (0.5 * k + 1), clip = p.clip || null, CT = clip ? tr3(G.R) : null;
    for (let y = y0; y <= y1; y++) {
      const dy = y + 0.5 - Yc, row = y * w;
      for (let x = x0; x <= x1; x++) {
        const dx = x + 0.5 - Xc, u0 = i0 * dx + j0 * dy, u1 = i1 * dx + j1 * dy, u2 = i2 * dx + j2 * dy;
        const b = u0 * w0 + u1 * w1 + u2 * w2, disc = b * b - a * (u0 * u0 + u1 * u1 + u2 * u2 - 1);
        if (disc <= 0) continue;
        const sq = Math.sqrt(disc), z = c[2] + (sq - b) * ia, i = row + x, zo = Z[i];
        if (clip) { const px = (x + 0.5 - ox) / s - G.pivot[0], py = (y + 0.5 - oy) / s - G.pivot[1], pz = z - G.pivot[2]; if (!clip(CT[0] * px + CT[1] * py + CT[2] * pz + G.pivot[0], CT[3] * px + CT[4] * py + CT[5] * pz + G.pivot[1], CT[6] * px + CT[7] * py + CT[8] * pz + G.pivot[2])) continue; }
        if (zo < -1e8) { Z[i] = z; M[i] = mat; GR[i] = grp; TG[i] = tag; SRC[i] = 2; continue; }
        const d = z - zo, ad = d < 0 ? -d : d;
        let zn = d > 0 ? z : zo;
        if (k > 0 && ad < k && M[i] === mat) { const hh = (k - ad) / k, e = sq * ia * kf; zn += hh * hh * k * 0.25 * (e > 1 ? 1 : e); }
        if (d > 0) { M[i] = mat; GR[i] = grp; TG[i] = tag; SRC[i] = 2; }
        Z[i] = zn;
      }
    }
  }
  const t1 = performance.now();

  // 2. each pixel's place in its own group's space (so brushes and paint are written once, in head space)
  const RT = {}; for (const g in groups) RT[g] = tr3(groups[g].R);
  const local = () => {
    for (let y = 0; y < h; y++) for (let x = 0, i = y * w; x < w; x++, i++) {
      const g = GR[i]; if (!g || SRC[i] !== 2) continue;
      const G = groups[g], T = RT[g], px = (x + 0.5 - ox) / s - G.pivot[0] - (G.off ? G.off[0] : 0), py = (y + 0.5 - oy) / s - G.pivot[1] - (G.off ? G.off[1] : 0), pz = Z[i] - G.pivot[2];
      LX[i] = T[0] * px + T[1] * py + T[2] * pz + G.pivot[0]; LY[i] = T[3] * px + T[4] * py + T[5] * pz + G.pivot[1]; LZ[i] = T[6] * px + T[7] * py + T[8] * pz + G.pivot[2];
    }
  };
  local();
  // albedo, in linear light
  const AR = new Float32Array(N), AG = new Float32Array(N), AB = new Float32Array(N), RO = new Float32Array(N); // RO: gloss 0..1
  const baseCol = model.cols;
  for (let i = 0; i < N; i++) { const m = M[i]; if (!m) continue; const c = (m === MAT.cloth && TG[i] === 6 ? baseCol.shirt : baseCol[m]) || baseCol[1]; AR[i] = c[0]; AG[i] = c[1]; AB[i] = c[2]; RO[i] = m === MAT.eye ? 1 : m === MAT.plate ? 0.9 : m === MAT.mail ? 0.7 : m === MAT.skin ? 0.25 : 0.05; }

  // 3. sculpt and paint brushes
  const bbox = (g, c, rad) => { const v = toView(g || 1, c), X = ox + v[0] * s, Y = oy + v[1] * s, R = (rad + (g ? 0 : 30)) * s + 1; return [Math.max(0, Math.floor(X - R)), Math.min(w - 1, Math.ceil(X + R)), Math.max(0, Math.floor(Y - R)), Math.min(h - 1, Math.ceil(Y + R))]; };
  const applyBlob = b => {
    const [x0, x1, y0, y1] = bbox(b.grp, b.c, Math.max(b.r[0], b.r[1], b.r[2]));
    const cx = b.c[0], cy = b.c[1], cz = b.c[2], ix = 1 / b.r[0], iy = 1 / b.r[1], iz = 1 / b.r[2], col = b.col, amt = b.amt, g = b.grp, only = b.only;
    for (let y = y0; y <= y1; y++) for (let x = x0, i = y * w + x0; x <= x1; x++, i++) {
      if (GR[i] !== g || (only && M[i] !== only)) continue;
      const qx = (LX[i] - cx) * ix, qy = (LY[i] - cy) * iy, qz = (LZ[i] - cz) * iz, q = qx * qx + qy * qy + qz * qz;
      if (q >= 1) continue;
      const f = (1 - q) * (1 - q);
      if (amt) DZ[i] += amt * f;
      if (col) { const t = f * b.a > 1 ? 1 : f * b.a; AR[i] += (col[0] - AR[i]) * t; AG[i] += (col[1] - AG[i]) * t; AB[i] += (col[2] - AB[i]) * t; if (col[3] != null) RO[i] += (col[3] - RO[i]) * t; }
    }
  };
  const applyStroke = b => {
    const P = b.pts, g = b.grp, wd = b.w, col = b.col, amt = b.amt, prof = b.prof, reach = prof === 'scar' ? wd * 2.6 : wd * 2.2;
    for (let n = 0; n < P.length - 1; n++) {
      const a = P[n], c = P[n + 1], mid = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2], ab = [c[0] - a[0], c[1] - a[1], c[2] - a[2]], L2 = ab[0] * ab[0] + ab[1] * ab[1] + ab[2] * ab[2] || 1e-6;
      const [x0, x1, y0, y1] = bbox(g, mid, Math.sqrt(L2) / 2 + reach);
      // taper toward the stroke's two ends
      const tA = b.taper ? n / (P.length - 1) : 0.5, tB = b.taper ? (n + 1) / (P.length - 1) : 0.5;
      for (let y = y0; y <= y1; y++) for (let x = x0, i = y * w + x0; x <= x1; x++, i++) {
        if ((g && GR[i] !== g) || M[i] === MAT.eye || !M[i]) continue;
        const px = LX[i] - a[0], py = LY[i] - a[1], pz = LZ[i] - a[2];
        let t = (px * ab[0] + py * ab[1] + pz * ab[2]) / L2; if (n > 0 && t < 0) continue; if (t > 1) { if (n < P.length - 2) continue; t = 1; } if (t < 0) t = 0;
        const ex = px - ab[0] * t, ey = py - ab[1] * t, ez = pz - ab[2] * t; let d = Math.sqrt(ex * ex + ey * ey + ez * ez);
        if (b.rag) d += (vnoise(LX[i] * 0.6, LY[i] * 0.6, b.seed) - 0.5) * b.rag;
        const u = d / wd; if (u >= 2.6) continue;
        let tp = 1; if (b.taper) { const tt = lerp(tA, tB, t); tp = Math.sin(Math.PI * clamp(tt, 0, 1)); tp = Math.pow(tp, 0.6); }
        let f;
        if (prof === 'g') f = Math.exp(-u * u * 1.6);                                             // a soft groove or ridge
        else if (prof === 'v') f = u < 1 ? (1 - u) * (1 - u) : 0;                                 // a sharp crease
        else f = Math.exp(-u * u * 2.2) - 0.45 * Math.exp(-(u - 1.5) * (u - 1.5) * 3);            // a scar: a trough with raised lips
        if (amt) DZ[i] += amt * f * tp;
        if (col) { const tcol = clamp(Math.exp(-u * u * 1.2) * b.a * tp, 0, 1); AR[i] += (col[0] - AR[i]) * tcol; AG[i] += (col[1] - AG[i]) * tcol; AB[i] += (col[2] - AB[i]) * tcol; if (col[3] != null) RO[i] += (col[3] - RO[i]) * tcol; }
      }
    }
  };
  for (const b of model.brushes) (b.t === 'b' ? applyBlob : applyStroke)(b);
  const t2 = performance.now();

  // 4. eyes: the head's clip cut the opening between the lids; the ball shows through it
  (model.eyes || []).forEach((e, ei) => {
    const c = toView(1, e.c), Xc = ox + c[0] * s, Yc = oy + c[1] * s, R = (e.r + 6) * s;
    const x0 = Math.max(0, Math.floor(Xc - R)), x1 = Math.min(w - 1, Math.ceil(Xc + R)), y0 = Math.max(0, Math.floor(Yc - R)), y1 = Math.min(h - 1, Math.ceil(Yc + R));
    const T = RT[1], G = groups[1], gz = toViewDir(G.R, e.gaze), sk = baseCol[1];
    for (let y = y0; y <= y1; y++) for (let x = x0, i = y * w + x0; x <= x1; x++, i++) {
      if (CL[i] !== ei + 2) continue;
      const dx = (x + 0.5 - Xc) / s, dy = (y + 0.5 - Yc) / s, d2 = dx * dx + dy * dy, hit = d2 < e.r * e.r;
      const ze = hit ? c[2] + Math.sqrt(e.r * e.r - d2) : c[2] + 2;
      if (ze <= Z[i]) continue;
      const px = c[0] + dx - G.pivot[0], py = c[1] + dy - G.pivot[1], pz = ze - G.pivot[2];
      const hx = T[0] * px + T[1] * py + T[2] * pz + G.pivot[0], hy = T[3] * px + T[4] * py + T[5] * pz + G.pivot[1], hz = T[6] * px + T[7] * py + T[8] * pz + G.pivot[2];
      Z[i] = ze; GR[i] = 1; SRC[i] = 3; LX[i] = hx; LY[i] = hy; LZ[i] = hz;
      if (!hit) { M[i] = MAT.skin; AR[i] = sk[0] * 0.45; AG[i] = sk[1] * 0.28; AB[i] = sk[2] * 0.26; RO[i] = 0.5; continue; }   // the wet corner
      M[i] = MAT.eye;
      const tt = (hx * e.side - e.xi) / (e.xo - e.xi), base = lerp(e.yi, e.yo, tt), tu = Math.pow(clamp(tt, 0, 1), 0.8), yu = base - e.up * 4 * tu * (1 - tu);
      const nx = dx / e.r, ny = dy / e.r, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)), cosg = nx * gz[0] + ny * gz[1] + nz * gz[2], rr = Math.sqrt(Math.max(0, 1 - cosg * cosg)) * e.r;
      let col = model.cols.sclera;
      if (cosg > 0 && rr < e.iris) {
        const ang = Math.atan2(ny - gz[1] * cosg, nx - gz[0] * cosg), fib = 0.75 + 0.5 * vnoise(ang * 9, rr * 1.5, e.seed), q = rr / e.iris;
        const ic = model.cols.iris, ring = sstep(0.78, 1, q), inner = sstep(0.55, 0.25, q);
        col = [ic[0] * fib * (1 - 0.7 * ring) * (1 + 0.5 * inner), ic[1] * fib * (1 - 0.7 * ring) * (1 + 0.35 * inner), ic[2] * fib * (1 - 0.7 * ring) * (1 + 0.1 * inner)];
        if (rr < e.pupil) col = [0.004, 0.004, 0.006]; else if (rr < e.pupil + 0.5) { const k2 = (rr - e.pupil) / 0.5; col = [col[0] * k2, col[1] * k2, col[2] * k2]; }
        if (e.blind) { const m2 = 0.75 * sstep(1.05, 0.2, q); col = [lerp(col[0], 0.62, m2), lerp(col[1], 0.66, m2), lerp(col[2], 0.70, m2)]; }   // a scarred, milky eye
        TG[i] = 9;
      } else { const red = 0.12 * sstep(0.5, 1, Math.abs(tt - 0.5) * 2); col = [col[0], col[1] * (1 - red), col[2] * (1 - red * 1.2)]; TG[i] = 8; }
      const lidSh = 1 - 0.55 * sstep(3.2, 0, hy - yu);                                   // the upper lid's shadow on the ball
      AR[i] = col[0] * lidSh; AG[i] = col[1] * lidSh; AB[i] = col[2] * lidSh; RO[i] = 1;
    }
  });
  for (const b of model.late || []) (b.t === 'b' ? applyBlob : applyStroke)(b);
  const t3 = performance.now();

  // 5. surface detail from materials: pores, weave, rings (height and colour), scaled out when a texel is under a pixel
  const mmpp = 1 / s;                                             // millimetres per pixel
  if (model.detail !== false) for (let y = 0; y < h; y++) for (let x = 0, i = y * w; x < w; x++, i++) {
    const m = M[i]; if (!m) continue;
    const lx = LX[i], ly = LY[i], lz = LZ[i];
    if (m === MAT.skin) {
      if (mmpp < 0.9) { const n = vnoise(lx * 2.2, ly * 2.2 + lz * 1.3, 11) - 0.5; DZ[i] += n * 0.22 * (model.rough || 1); }
      const n2 = fbm(lx * 0.09 + lz * 0.05, ly * 0.09, 5) - 0.5; AR[i] *= 1 + n2 * 0.10; AG[i] *= 1 + n2 * 0.14; AB[i] *= 1 + n2 * 0.16;   // blotch
    } else if (m === MAT.cloth) {
      const wv = TG[i] === 6 ? 0.7 : (model.weave || 1.6), u = (lx + lz * 0.6) / wv, v = ly / wv;
      if (mmpp < wv * 0.45) { const a = Math.sin(u * Math.PI), b2 = Math.sin(v * Math.PI); const hh = ((Math.floor(u) + Math.floor(v)) & 1) ? a * a : b2 * b2; DZ[i] += hh * 0.3; const sh = 0.88 + 0.24 * hh; AR[i] *= sh; AG[i] *= sh; AB[i] *= sh; }
      else { const tw = 0.94 + 0.12 * ih(Math.floor(lx / mmpp), Math.floor(ly / mmpp), 19); AR[i] *= tw; AG[i] *= tw; AB[i] *= tw; }
      const n = fbm(lx * 0.05, ly * 0.05 + lz * 0.03, 23) - 0.5; AR[i] *= 1 + n * 0.22; AG[i] *= 1 + n * 0.22; AB[i] *= 1 + n * 0.22;
      // folds: cloth hangs from the shoulders in long soft ridges
      const fo = Math.sin(lx * 0.085 + Math.sin(ly * 0.02) * 2 + lz * 0.05) * 0.5 + Math.sin(lx * 0.19 + ly * 0.013) * 0.25; DZ[i] += fo * 2.4 * sstep(0, 60, ly - (model.meta ? model.meta.shY : 0));
    } else if (m === MAT.mail) {
      // rings in rows, each row lying over the next; too far to see a ring, it is rows with a glint
      const Pp = model.ring || 7, u = (lx + lz * 0.5) / Pp, v = ly / (Pp * 0.62), row = Math.floor(v), uu = u + (row & 1) * 0.5, fu = uu - Math.floor(uu) - 0.5, fv = v - row - 0.5;
      if (mmpp < Pp * 0.3) { const rr = Math.sqrt(fu * fu + fv * fv * 0.6), ring = Math.exp(-Math.pow((rr - 0.36) / 0.10, 2)); DZ[i] += ring * 1.5 - 0.7; const dk = 0.32 + 0.95 * ring; AR[i] *= dk; AG[i] *= dk; AB[i] *= dk; }
      else { const band = 0.5 + 0.5 * Math.cos(fv * Math.PI * 2), tw = 0.55 + 0.35 * band + 0.3 * ih(Math.floor(uu * 2), row, 3); DZ[i] += band * 0.8; AR[i] *= tw; AG[i] *= tw; AB[i] *= tw; RO[i] = 0.55; }
    } else if (m === MAT.hair) {
      const sw = Math.max(1.1, 2.4 * mmpp), fl = (model.hairFlow ? model.hairFlow(lx, ly, lz) : lx + lz * 0.35) / sw, n = vnoise(fl, ly * 0.03 + lz * 0.015, 31), n2 = vnoise(fl * 0.31, ly * 0.012, 37);
      DZ[i] += (n - 0.5) * 1.6 + (n2 - 0.5) * 2.6;
      const sh = 0.72 + 0.4 * n + 0.25 * n2; AR[i] *= sh; AG[i] *= sh; AB[i] *= sh;
      if (model.grey) { const g = ih(Math.floor(fl * 0.9), Math.floor(ly * 0.01), 41) < model.grey ? 1 : 0; if (g) { AR[i] = lerp(AR[i], 0.60, 0.85); AG[i] = lerp(AG[i], 0.60, 0.85); AB[i] = lerp(AB[i], 0.58, 0.85); } }
    }
  }
  const t4 = performance.now();

  // 6. normals, a swept cast shadow, and occlusion from a blurred depth
  for (let y = 0; y < h; y++) for (let x = 0, i = y * w; x < w; x++, i++) {
    if (!M[i]) continue;
    const src = SRC[i], B = src === 1 ? DZ : null;
    if (src === 1) { // the mesh's own normal, bent by the slope of the fine relief
      const d = DZ[i], dl = x > 0 && SRC[i - 1] === 1 ? DZ[i - 1] : d, dr = x < w - 1 && SRC[i + 1] === 1 ? DZ[i + 1] : d, du = y > 0 && SRC[i - w] === 1 ? DZ[i - w] : d, dd = y < h - 1 && SRC[i + w] === 1 ? DZ[i + w] : d;
      const nx = NX[i] - (dr - dl) * 0.5 * s, ny = NY[i] - (dd - du) * 0.5 * s, nz = NZ[i] < 0.05 ? 0.05 : NZ[i], il = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz); NX[i] = nx * il; NY[i] = ny * il; NZ[i] = nz * il;
      continue;
    }
    const z = Z[i] + DZ[i], zl = x > 0 && M[i - 1] ? Z[i - 1] + DZ[i - 1] : z, zr = x < w - 1 && M[i + 1] ? Z[i + 1] + DZ[i + 1] : z, zu = y > 0 && M[i - w] ? Z[i - w] + DZ[i - w] : z, zd = y < h - 1 && M[i + w] ? Z[i + w] + DZ[i + w] : z;
    let gx = (zr - zl) * 0.5 * s, gy = (zd - zu) * 0.5 * s;
    const lim = 3.2; if (gx > lim) gx = lim; else if (gx < -lim) gx = -lim; if (gy > lim) gy = lim; else if (gy < -lim) gy = -lim;
    const il = 1 / Math.sqrt(gx * gx + gy * gy + 1); NX[i] = -gx * il; NY[i] = -gy * il; NZ[i] = il;
  }
  for (let i = 0; i < N; i++) if (M[i]) Z[i] += DZ[i];
  const Lk = norm3(o.light || [-0.52, -0.62, 0.59]);
  const SH = new Float32Array(N);
  { // sweep along the light: each pixel inherits the shadow horizon of the pixel one step toward the light
    const lxy = Math.hypot(Lk[0], Lk[1]), dxs = Lk[0] / lxy, dys = Lk[1] / lxy, m = Math.max(Math.abs(dxs), Math.abs(dys)), sx = dxs / m, sy = dys / m, drop = Math.hypot(sx, sy) / s * (Lk[2] / lxy);
    const HZ = new Float32Array(N).fill(-1e9), soft = 2.2;
    const ys = sy < 0 ? 0 : h - 1, ye = sy < 0 ? h : -1, yst = sy < 0 ? 1 : -1, xs = sx < 0 ? 0 : w - 1, xe = sx < 0 ? w : -1, xst = sx < 0 ? 1 : -1;
    for (let y = ys; y !== ye; y += yst) for (let x = xs; x !== xe; x += xst) {
      const i = y * w + x, fx = x + sx, fy = y + sy; let hz = -1e9;
      if (fx >= 0 && fx <= w - 1 && fy >= 0 && fy <= h - 1) {
        const x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0, x1 = Math.min(w - 1, x0 + 1), y1 = Math.min(h - 1, y0 + 1);
        const a = HZ[y0 * w + x0], b = HZ[y0 * w + x1], c = HZ[y1 * w + x0], d = HZ[y1 * w + x1];
        hz = Math.max(a, b, c, d) < -1e8 ? -1e9 : lerp(lerp(Math.max(a, -1e3), Math.max(b, -1e3), tx), lerp(Math.max(c, -1e3), Math.max(d, -1e3), tx), ty) - drop;
      }
      const z = M[i] ? Z[i] : -1e9;
      SH[i] = M[i] ? sstep(0.3, soft, hz - z) : 0;
      HZ[i] = hz > z ? hz : z;
    }
  }
  // occlusion: how far a pixel sits below the average of its neighbourhood, at two radii (box blurs by running sums)
  const AO = new Float32Array(N).fill(1);
  for (const [radMM, gain] of [[5, 0.055], [16, 0.022]]) {
    const r = Math.max(1, Math.round(radMM * s)), T1 = new Float32Array(N), T2 = new Float32Array(N), C1 = new Float32Array(N), C2 = new Float32Array(N);
    for (let y = 0; y < h; y++) { let sz = 0, sc = 0; const row = y * w; for (let x = -r; x < w; x++) { const xa = x + r, xb = x - r - 1; if (xa < w && M[row + xa]) { sz += Z[row + xa]; sc++; } if (xb >= 0 && M[row + xb]) { sz -= Z[row + xb]; sc--; } if (x >= 0) { T1[row + x] = sz; C1[row + x] = sc; } } }
    for (let x = 0; x < w; x++) { let sz = 0, sc = 0; for (let y = -r; y < h; y++) { const ya = y + r, yb = y - r - 1; if (ya < h) { sz += T1[ya * w + x]; sc += C1[ya * w + x]; } if (yb >= 0) { sz -= T1[yb * w + x]; sc -= C1[yb * w + x]; } if (y >= 0) { T2[y * w + x] = sz; C2[y * w + x] = sc; } } }
    for (let i = 0; i < N; i++) if (M[i] && C2[i] > 0) { const dz = T2[i] / C2[i] - Z[i]; if (dz > 0) AO[i] *= 1 / (1 + dz * gain * 3); }
  }
  const t5 = performance.now();

  // 7. light and paint
  const out = new Float32Array(N * 3), cov = new Float32Array(N);
  const fin = o.finish || 'paint', Hh = norm3([Lk[0], Lk[1], Lk[2] + 1]);
  const key = [1.0 * 2.05, 0.94 * 2.05, 0.84 * 2.05], fill = [0.07, 0.09, 0.13], sky = [0.10, 0.11, 0.14], bounce = [0.07, 0.05, 0.035];
  const bgA = hexLin('#232a40'), bgB = hexLin('#0c101c');
  const ink = hexLin('#1b1730');
  for (let y = 0; y < h; y++) for (let x = 0, i = y * w; x < w; x++, i++) {
    const m = M[i], o3 = i * 3;
    // the ground: lighter behind the shadow side, darker behind the lit side
    const gx = x / w, gy = y / h, gt = clamp(0.25 + 0.75 * gx - 0.2 * gy + (ih(x >> (ss > 1 ? 1 : 0), y >> (ss > 1 ? 1 : 0), 77) - 0.5) * 0.06, 0, 1);
    let r = lerp(bgB[0], bgA[0], gt), g = lerp(bgB[1], bgA[1], gt), b = lerp(bgB[2], bgA[2], gt);
    if (m) {
      const nx = NX[i], ny = NY[i], nz = NZ[i], ndl = nx * Lk[0] + ny * Lk[1] + nz * Lk[2], sh = SH[i], ao = AO[i];
      let ar = AR[i], ag = AG[i], ab = AB[i];
      if (fin === 'cel') {
        // two flat tones and no gradient: what a line-and-flat register keeps of the same form
        const litv = ndl * (1 - sh);
        const t = litv > 0.12 ? 1 : 0.52; const tint = t < 1 ? [0.80, 0.78, 1.0] : [1, 1, 1];
        const c0 = baseCol[m === MAT.eye ? (TG[i] === 9 ? 'iris' : 'sclera') : m] || baseCol[1];
        r = (m === MAT.eye ? ar : c0[0]) * t * tint[0] * 1.9; g = (m === MAT.eye ? ag : c0[1]) * t * tint[1] * 1.9; b = (m === MAT.eye ? ab : c0[2]) * t * tint[2] * 1.9;
      } else {
        const wrap = m === MAT.skin ? 0.2 : m === MAT.hair ? 0.2 : 0.08, dif = clamp((ndl + wrap) / (1 + wrap), 0, 1) * (1 - sh);
        const fl = clamp(0.5 + 0.5 * (nx * 0.6 + ny * 0.25 + nz * 0.55), 0, 1), up = clamp(0.5 - 0.5 * ny, 0, 1), dn = clamp(0.5 + 0.5 * ny, 0, 1);
        let lr = key[0] * dif + (fill[0] * fl + sky[0] * up + bounce[0] * dn) * ao, lg = key[1] * dif + (fill[1] * fl + sky[1] * up + bounce[1] * dn) * ao, lb = key[2] * dif + (fill[2] * fl + sky[2] * up + bounce[2] * dn) * ao;
        const gl = RO[i]; let spec = 0;
        const ndh = nx * Hh[0] + ny * Hh[1] + nz * Hh[2];
        if (m === MAT.skin) {
          // blood under the skin shows where light turns to shadow
          const tm = Math.exp(-Math.pow((ndl - 0.02) / 0.22, 2)) * (1 - 0.6 * sh) + 0.35 * sh * clamp(ndl + 0.3, 0, 1);
          lr += 0.34 * tm; lg += 0.06 * tm; lb += 0.02 * tm;
          spec = (Math.pow(Math.max(ndh, 0), 34) * 0.42 + Math.pow(Math.max(ndh, 0), 7) * 0.05) * gl * 4 * (1 - sh);
        } else if (m === MAT.eye) { spec = Math.pow(Math.max(ndh, 0), 420) * 9 * (1 - sh) + Math.pow(Math.max(ndh, 0), 60) * 0.25; lr = lr * 0.8 + 0.1; lg = lg * 0.8 + 0.1; lb = lb * 0.8 + 0.1; }
        else if (m === MAT.mail || m === MAT.plate) {
          // metal mirrors its room: a bright window up and to the left, a dark floor
          const rx = 2 * nz * nx, ry = 2 * nz * ny, rz = 2 * nz * nz - 1, win = Math.pow(clamp(rx * Lk[0] + ry * Lk[1] + rz * Lk[2], 0, 1), m === MAT.plate ? 9 : 14), env = clamp(0.5 - 0.5 * ry, 0, 1);
          const k = m === MAT.plate ? 1 : 0.8; lr = lr * 0.35 + (0.10 + 0.55 * env) * ao * k + win * 3.2 * (1 - sh * 0.8); lg = lg * 0.35 + (0.10 + 0.56 * env) * ao * k + win * 3.1 * (1 - sh * 0.8); lb = lb * 0.35 + (0.11 + 0.60 * env) * ao * k + win * 2.9 * (1 - sh * 0.8);
        } else if (m === MAT.hair) { spec = Math.pow(Math.max(1 - Math.abs(ny * Hh[1] + nz * Hh[2] - 0.72) * 2.2, 0), 6) * 0.22 * (1 - sh); }
        else if (m === MAT.cloth) { const sheen = Math.pow(1 - nz, 3) * 0.10; lr += sheen; lg += sheen; lb += sheen; }
        r = ar * lr + spec; g = ag * lg + spec; b = ab * lb + spec;
        // a cool edge light from behind on the shadow side keeps the figure off the ground
        const rim = Math.pow(1 - nz, 2.5) * clamp(nx * 0.9 + 0.2, 0, 1) * 0.35; r += rim * 0.55; g += rim * 0.68; b += rim * 0.95;
      }
      cov[i] = 1;
    }
    out[o3] = r; out[o3 + 1] = g; out[o3 + 2] = b;
  }
  if (fin === 'cel') { // contour lines where depth or material breaks
    const lw = Math.max(1, Math.round(0.9 * s));
    const edge = new Uint8Array(N);
    for (let y = 1; y < h - 1; y++) for (let x = 1, i = y * w + 1; x < w - 1; x++, i++) {
      const m = M[i]; let e = 0;
      for (const j of [i - 1, i + 1, i - w, i + w]) { if (M[j] !== m && (m > M[j])) e = 1; else if (m && M[j] && Z[i] - Z[j] > 2.4) e = 1; else if (m && M[j] && (NX[i] * NX[j] + NY[i] * NY[j] + NZ[i] * NZ[j]) < 0.86 && Z[i] < Z[j] + 0.3) e = 1; }
      edge[i] = e;
    }
    for (let y = lw; y < h - lw; y++) for (let x = lw, i = y * w + lw; x < w - lw; x++, i++) {
      let e = 0; for (let dy = -lw + 1; dy < lw && !e; dy++) for (let dx = -lw + 1; dx < lw; dx++) if (edge[i + dy * w + dx] && dx * dx + dy * dy < lw * lw) { e = 1; break; }
      if (e) { out[i * 3] = ink[0]; out[i * 3 + 1] = ink[1]; out[i * 3 + 2] = ink[2]; }
    }
  }
  const t6 = performance.now();

  // 8. down-sample (box) and encode
  const rgba = new Uint8ClampedArray(W * H * 4), inv = 1 / (ss * ss);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let r = 0, g = 0, b = 0;
    for (let yy = 0; yy < ss; yy++) for (let xx = 0, i = ((y * ss + yy) * w + x * ss) * 3; xx < ss; xx++, i += 3) { r += out[i]; g += out[i + 1]; b += out[i + 2]; }
    r *= inv; g *= inv; b *= inv;
    if (fin !== 'cel') { // a painter's finish: filmic shoulder, a breath of grain
      const gr = (ih(x, y, 91) - 0.5) * 0.012; r = r / (1 + r * 0.55) * 1.3 + gr; g = g / (1 + g * 0.55) * 1.3 + gr; b = b / (1 + b * 0.55) * 1.3 + gr;
    }
    const j = (y * W + x) * 4; rgba[j] = toS(r); rgba[j + 1] = toS(g); rgba[j + 2] = toS(b); rgba[j + 3] = 255;
  }
  const t7 = performance.now();
  return { rgba, ms: { loft: tL - t0, splat: t1 - tL, brush: t2 - t1, eyes: t3 - t2, detail: t4 - t3, geom: t5 - t4, light: t6 - t5, out: t7 - t6, total: t7 - t0 }, px: N, tris, Z, M };
}
function norm3(v) { const n = Math.hypot(v[0], v[1], v[2]); return [v[0] / n, v[1] / n, v[2] / n]; }
function toViewDir(R, d) { const v = mv(R, d); return norm3(v); }
export const groupsFor = (yaw, pitch = 0, bodyYaw = yaw * 1.3, roll = 0) => ({ 1: { R: mul3(rotZ(roll), mul3(rotY(yaw), rotX(pitch))), pivot: [0, 150, -15] }, 2: { R: rotY(bodyYaw), pivot: [0, 300, -25] } });
export { rotX, rotY, rotZ, mul3, I3 };
