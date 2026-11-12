// Meshes to buffers (characters.md §11, raster): the skin and every layer pushed out from it (cloth, mail, a hood) are
// drawn as triangles into a visibility buffer of 2 x 2 samples a pixel: which triangle is nearest at each sample. Light is
// then worked once a pixel, from the triangle that covers it most; the samples give the outline its soft edge, so
// edges are softened from coverage, not by painting four times the pixels. A layer may carry a cut, a test on the
// model's own point (a neckline, a hairline, a hem), so its edge is sharp at every size.

// layers: [{ P (world xyz), M (model xyz), quads, faces? (Uint8Array mask of quads to draw), cut?(mx,my,mz)->signed }]
// view: { W, H, x0, y0, mmpp, V? (world -> view rows; identity if absent) }
export function rasterize(layers, view, opt = {}) {
  const { W, H, x0, y0, mmpp } = view, SW = W * 2, SH = H * 2, NS = SW * SH;
  const zb = new Float32Array(NS).fill(-1e30), tb = new Int32Array(NS).fill(-1);
  const V = view.V;
  const tris = [];   // flat: layer, a, b, c
  let triCount = 0;
  const SX = [], SY = [], SZ = [];
  layers.forEach((L, li) => {
    const P = L.P, n = P.length / 3, sx = new Float32Array(n), sy = new Float32Array(n), sz = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      let x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2];
      if (V) { const a = x, b = y, c = z; x = V[0] * a + V[1] * b + V[2] * c; y = V[3] * a + V[4] * b + V[5] * c; z = V[6] * a + V[7] * b + V[8] * c; }
      sx[i] = (x - x0) / mmpp * 2; sy[i] = (y0 - y) / mmpp * 2; sz[i] = z;
    }
    SX.push(sx); SY.push(sy); SZ.push(sz);
  });
  const triL = [], triA = [], triB = [], triC = [];
  layers.forEach((L, li) => {
    const Q = L.quads, nq = Q.length / 4, sx = SX[li], sy = SY[li], sz = SZ[li], mask = L.faces, cut = L.cut, M = L.M;
    for (let f = 0; f < nq; f++) {
      if (mask && !mask[f]) continue;
      const q0 = Q[f * 4], q1 = Q[f * 4 + 1], q2 = Q[f * 4 + 2], q3 = Q[f * 4 + 3];
      for (let t = 0; t < 2; t++) {
        const a = q0, b = t ? q2 : q1, c = t ? q3 : q2;
        if (b === c || a === c) continue;
        const id = triL.length; triL.push(li); triA.push(a); triB.push(b); triC.push(c);
        // edge functions over the sample grid
        const ax = sx[a], ay = sy[a], bx = sx[b], by = sy[b], cx = sx[c], cy = sy[c];
        const area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
        if (Math.abs(area) < 1e-9) continue;
        if (opt.cull && area > 0) continue;
        let i0 = Math.max(0, Math.floor(Math.min(ax, bx, cx))), i1 = Math.min(SW - 1, Math.ceil(Math.max(ax, bx, cx)));
        let j0 = Math.max(0, Math.floor(Math.min(ay, by, cy))), j1 = Math.min(SH - 1, Math.ceil(Math.max(ay, by, cy)));
        if (i0 > i1 || j0 > j1) continue;
        const ia = 1 / area, za = sz[a], zbv = sz[b], zc = sz[c];
        for (let j = j0; j <= j1; j++) {
          const py = j + 0.5;
          for (let i = i0; i <= i1; i++) {
            const px = i + 0.5;
            const w0 = ((bx - px) * (cy - py) - (by - py) * (cx - px)) * ia;
            const w1 = ((cx - px) * (ay - py) - (cy - py) * (ax - px)) * ia;
            const w2 = 1 - w0 - w1;
            if (w0 < 0 || w1 < 0 || w2 < 0) continue;
            const z = w0 * za + w1 * zbv + w2 * zc, k = j * SW + i;
            if (z <= zb[k]) continue;
            if (cut) { const mx = w0 * M[a * 3] + w1 * M[b * 3] + w2 * M[c * 3], my = w0 * M[a * 3 + 1] + w1 * M[b * 3 + 1] + w2 * M[c * 3 + 1], mz = w0 * M[a * 3 + 2] + w1 * M[b * 3 + 2] + w2 * M[c * 3 + 2]; if (cut(mx, my, mz) < 0) continue; }
            zb[k] = z; tb[k] = id;
          }
        }
      }
    }
  });
  return { W, H, SW, SH, zb, tb, triL: Int32Array.from(triL), triA: Int32Array.from(triA), triB: Int32Array.from(triB), triC: Int32Array.from(triC), SX, SY, SZ, layers };
}

// per pixel: the triangle that covers it most (nearest wins ties), its barycentrics at the pixel's centre, and coverage
export function resolve(R) {
  const { W, H, SW, tb, zb } = R, N = W * H;
  const tri = new Int32Array(N).fill(-1), cov = new Float32Array(N), depth = new Float32Array(N).fill(-1e30), b0 = new Float32Array(N), b1 = new Float32Array(N);
  const ids = [0, 0, 0, 0], zs = [0, 0, 0, 0];
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = j * W + i, s0 = (j * 2) * SW + i * 2;
    ids[0] = tb[s0]; ids[1] = tb[s0 + 1]; ids[2] = tb[s0 + SW]; ids[3] = tb[s0 + SW + 1];
    zs[0] = zb[s0]; zs[1] = zb[s0 + 1]; zs[2] = zb[s0 + SW]; zs[3] = zb[s0 + SW + 1];
    let n = 0, best = -1, bz = -1e30;
    for (let q = 0; q < 4; q++) if (ids[q] >= 0) { n++; if (zs[q] > bz) { bz = zs[q]; best = ids[q]; } }
    if (!n) continue;
    // prefer the layer most samples show (a cut edge, an outline)
    let bl = R.triL[best], cnt = 0; for (let q = 0; q < 4; q++) if (ids[q] >= 0 && R.triL[ids[q]] === bl) cnt++;
    if (cnt < 2) { for (let q = 0; q < 4; q++) if (ids[q] >= 0) { let c2 = 0; for (let r = 0; r < 4; r++) if (ids[r] >= 0 && R.triL[ids[r]] === R.triL[ids[q]]) c2++; if (c2 > cnt) { cnt = c2; best = ids[q]; bz = zs[q]; } } }
    tri[k] = best; cov[k] = n / 4; depth[k] = bz;
    // barycentrics of the pixel centre in that triangle (in sample units)
    const li = R.triL[best], a = R.triA[best], b = R.triB[best], c = R.triC[best], sx = R.SX[li], sy = R.SY[li];
    const px = i * 2 + 1, py = j * 2 + 1;
    const ax = sx[a], ay = sy[a], bx = sx[b], by = sy[b], cx = sx[c], cy = sy[c];
    const area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax) || 1e-9;
    let w0 = ((bx - px) * (cy - py) - (by - py) * (cx - px)) / area, w1 = ((cx - px) * (ay - py) - (cy - py) * (ax - px)) / area;
    // keep the point on the triangle (an edge pixel's centre may lie just off it)
    w0 = Math.max(-0.2, Math.min(1.2, w0)); w1 = Math.max(-0.2, Math.min(1.2, w1));
    b0[k] = w0; b1[k] = w1;
  }
  return { tri, cov, depth, b0, b1 };
}

// interpolate a per-vertex array (stride s, channel c) of a layer at pixel k
export function lerpAttr(R, S, k, arrOf, s, out, n = s) {
  const t = S.tri[k], li = R.triL[t], A = arrOf(li); if (!A) return null;
  const a = R.triA[t], b = R.triB[t], c = R.triC[t], w0 = S.b0[k], w1 = S.b1[k], w2 = 1 - w0 - w1;
  for (let q = 0; q < n; q++) out[q] = w0 * A[a * s + q] + w1 * A[b * s + q] + w2 * A[c * s + q];
  return out;
}

// vertex normals of a quad mesh (area-weighted), optionally only over masked faces
export function normals(P, quads, mask) {
  const n = P.length / 3, N = new Float32Array(n * 3), nq = quads.length / 4;
  for (let f = 0; f < nq; f++) {
    if (mask && !mask[f]) continue;
    const a = quads[f * 4], b = quads[f * 4 + 1], c = quads[f * 4 + 2], d = quads[f * 4 + 3];
    // the quad's normal from its diagonals
    const ux = P[c * 3] - P[a * 3], uy = P[c * 3 + 1] - P[a * 3 + 1], uz = P[c * 3 + 2] - P[a * 3 + 2];
    const vx = P[d * 3] - P[b * 3], vy = P[d * 3 + 1] - P[b * 3 + 1], vz = P[d * 3 + 2] - P[b * 3 + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const v of (c === d ? [a, b, c] : [a, b, c, d])) { N[v * 3] += nx; N[v * 3 + 1] += ny; N[v * 3 + 2] += nz; }
  }
  for (let i = 0; i < n; i++) { const l = Math.hypot(N[i * 3], N[i * 3 + 1], N[i * 3 + 2]) || 1; N[i * 3] /= l; N[i * 3 + 1] /= l; N[i * 3 + 2] /= l; }
  return N;
}

// a depth map from the window's side: the meshes drawn from the light; lookup gives the lit share 0..1, soft
export function lightDepth(layers, L, bounds, mmpp) {
  const z = L, up = Math.abs(z[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  let x = [up[1] * z[2] - up[2] * z[1], up[2] * z[0] - up[0] * z[2], up[0] * z[1] - up[1] * z[0]]; const xl = Math.hypot(...x); x = x.map(c => c / xl);
  const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
  const V = [...x, ...y, ...z];
  let umin = 1e9, umax = -1e9, vmin = 1e9, vmax = -1e9;
  for (const cx of [bounds[0], bounds[3]]) for (const cy of [bounds[1], bounds[4]]) for (const cz of [bounds[2], bounds[5]]) {
    const u = x[0] * cx + x[1] * cy + x[2] * cz, v = y[0] * cx + y[1] * cy + y[2] * cz;
    umin = Math.min(umin, u); umax = Math.max(umax, u); vmin = Math.min(vmin, v); vmax = Math.max(vmax, v);
  }
  const W = Math.min(700, Math.ceil((umax - umin) / mmpp) + 2), H = Math.min(700, Math.ceil((vmax - vmin) / mmpp) + 2);
  const mp = Math.max((umax - umin) / (W - 2), (vmax - vmin) / (H - 2));
  const view = { W, H, x0: umin - mp, y0: vmax + mp, mmpp: mp, V };
  const R = rasterize(layers, view);
  // fold the 2 x 2 samples to one depth a texel (the nearest)
  const D = new Float32Array(W * H).fill(-1e30);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const s = j * 2 * R.SW + i * 2; D[j * W + i] = Math.max(R.zb[s], R.zb[s + 1], R.zb[s + R.SW], R.zb[s + R.SW + 1]); }
  return { view, D, V, W, H, mp };
}
export function makeShadow(SM, soft) {
  const { view, D, V, W, H, mp } = SM;
  const r = Math.max(1, soft / mp), step = Math.max(0.7, r / 3);
  const at = (i, j) => { i = i < 0 ? 0 : i >= W ? W - 1 : i; j = j < 0 ? 0 : j >= H ? H - 1 : j; return D[j * W + i]; };
  return (x1, y1, z1) => {
    const u = V[0] * x1 + V[1] * y1 + V[2] * z1, v = V[3] * x1 + V[4] * y1 + V[5] * z1, w = V[6] * x1 + V[7] * y1 + V[8] * z1;
    const fi = (u - view.x0) / mp - 0.5, fj = (view.y0 - v) / mp - 0.5, ci = Math.round(fi), cj = Math.round(fj);
    // the receiver's own slope in the map, so a surface never shades itself
    const c0 = at(ci, cj);
    let gx = 0, gy = 0;
    if (Math.abs(c0 - w) < 4 + 2 * mp) { const a = at(ci + 1, cj), b = at(ci - 1, cj), c = at(ci, cj + 1), d = at(ci, cj - 1); gx = Math.abs(a - b) / 2; gy = Math.abs(c - d) / 2; if (gx > 6) gx = 6; if (gy > 6) gy = 6; }
    const ramp = 0.6 + mp;
    let lit = 0, n = 0;
    for (let dj = -r; dj <= r + 1e-6; dj += step) for (let di = -r; di <= r + 1e-6; di += step) {
      const ii = Math.round(fi + di), jj = Math.round(fj + dj); n++;
      if (ii < 0 || jj < 0 || ii >= W || jj >= H) { lit++; continue; }
      const bias = 0.6 + 0.5 * mp + gx * (Math.abs(di) + 0.7) + gy * (Math.abs(dj) + 0.7);
      const t = (w + bias - D[jj * W + ii]) / ramp + 0.5; lit += t < 0 ? 0 : t > 1 ? 1 : t;
    }
    return lit / n;
  };
}
