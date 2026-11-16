// Rays to buffers (characters.md §11): for each pixel, where the first surface is (depth), which way it faces (normal),
// what it is (group, so material), how shut in it is (occlusion) and, from the light's own view, whether the window sees it
// (the shadow map). Orthographic, "as through a long lens". Primitives are culled per tile of 8 x 8 pixels so a pixel
// only weighs the volumes that can reach it.
import { STRIDE, ADD, primDist, combine } from './surface.js';

const TILE = 8;

// scene: { P, n, groups: [{ disp?(x,y,z) -> mm, dispAmp }] } ; view: { W, H, x0, y0, mmpp, V (world -> view rows) }
export function makeTiles(scene, view, margin = 0) {
  const { W, H, x0, y0, mmpp } = view, V = view.V;
  const tw = Math.ceil(W / TILE), th = Math.ceil(H / TILE), P = scene.P;
  const lists = Array.from({ length: tw * th }, () => []), zTop = new Float64Array(tw * th).fill(-1e9), zBot = new Float64Array(tw * th).fill(1e9);
  for (let i = 0; i < scene.n; i++) {
    const o = i * STRIDE;
    if (P[o] === 4) { for (let t = 0; t < lists.length; t++) lists[t].push(i); continue; } // planes reach everywhere
    const cx = P[o + 24], cy = P[o + 25], cz = P[o + 26], R = P[o + 23] + margin + (scene.groups[P[o + 3]].dispAmp || 0);
    const u = V[0] * cx + V[1] * cy + V[2] * cz, v = V[3] * cx + V[4] * cy + V[5] * cz, w = V[6] * cx + V[7] * cy + V[8] * cz;
    const i0 = Math.max(0, Math.floor((u - R - x0) / mmpp / TILE)), i1 = Math.min(tw - 1, Math.floor((u + R - x0) / mmpp / TILE));
    const j0 = Math.max(0, Math.floor((y0 - v - R) / mmpp / TILE)), j1 = Math.min(th - 1, Math.floor((y0 - v + R) / mmpp / TILE));
    for (let tj = j0; tj <= j1; tj++) for (let ti = i0; ti <= i1; ti++) {
      const t = tj * tw + ti; lists[t].push(i);
      if (P[o + 1] === ADD) { if (w + R > zTop[t]) zTop[t] = w + R; if (w - R < zBot[t]) zBot[t] = w - R; }
    }
  }
  // drop groups that have no adding primitive in a tile
  const out = lists.map((L, t) => {
    const has = new Set(); for (const i of L) if (P[i * STRIDE + 1] === ADD && P[i * STRIDE] !== 4) has.add(P[i * STRIDE + 3]);
    return Int32Array.from(L.filter(i => has.has(P[i * STRIDE + 3])));
  });
  return { tw, th, lists: out, zTop, zBot };
}

// the scene's distance at a world point, over one tile's primitives; sets HIT.g to the nearest group
export const HIT = { g: -1 };
export function sceneDist(scene, L, x, y, z) {
  const P = scene.P, G = scene.groups; let best = 1e9, bg = -1, g = -1, d = 1e9;
  for (let m = 0; m < L.length; m++) {
    const o = L[m] * STRIDE, pg = P[o + 3];
    if (pg !== g) {
      if (g >= 0) { const gg = G[g]; if (gg.disp && d < gg.dispAmp * 2 + 2) d += gg.disp(x, y, z); if (d < best) { best = d; bg = g; } }
      g = pg; d = 1e9;
    }
    const op = P[o + 1];
    // a primitive whose bound the point is far outside cannot change a smooth add
    if (op === ADD) {
      const bx = x - P[o + 24], by = y - P[o + 25], bz = z - P[o + 26], R = P[o + 23];
      const far = Math.sqrt(bx * bx + by * by + bz * bz) - R;
      if (far > 0 && far > d) continue;
    }
    d = combine(d, primDist(P, o, x, y, z), op, P[o + 2]);
  }
  if (g >= 0) { const gg = G[g]; if (gg.disp && d < gg.dispAmp * 2 + 2) d += gg.disp(x, y, z); if (d < best) { best = d; bg = g; } }
  HIT.g = bg; return best;
}

// march every pixel; returns buffers in view space plus world positions
export function trace(scene, view, opt = {}) {
  const { W, H, x0, y0, mmpp } = view, V = view.V;
  const tiles = makeTiles(scene, view, opt.margin || 0);
  const N = W * H, depth = new Float32Array(N).fill(-1e9), grp = new Int16Array(N).fill(-1), alpha = new Float32Array(N);
  const pos = opt.light ? null : new Float32Array(N * 3), nrm = opt.light ? null : new Float32Array(N * 3), ao = opt.light ? null : new Float32Array(N);
  const eps = Math.max(0.03, 0.2 * mmpp), stepK = opt.light ? 0.85 : 0.8;
  const r0 = [V[0], V[1], V[2]], r1 = [V[3], V[4], V[5]], r2 = [V[6], V[7], V[8]];
  const hN = Math.max(0.1, 0.5 * mmpp), aoK = opt.aoScale || 1;
  for (let tj = 0; tj < tiles.th; tj++) for (let ti = 0; ti < tiles.tw; ti++) {
    const t = tj * tiles.tw + ti, L = tiles.lists[t]; if (!L.length) continue;
    const zt = tiles.zTop[t], zb = tiles.zBot[t];
    for (let j = tj * TILE; j < Math.min(H, tj * TILE + TILE); j++) for (let i = ti * TILE; i < Math.min(W, ti * TILE + TILE); i++) {
      const u = x0 + (i + 0.5) * mmpp, v = y0 - (j + 0.5) * mmpp;
      const bx = u * r0[0] + v * r1[0], by = u * r0[1] + v * r1[1], bz = u * r0[2] + v * r1[2];
      let z = zt, dmin = 1e9, zmin = z, hit = false, d = 0;
      const floor = opt.zFloor ? Math.max(zb, opt.zFloor[j * W + i] - 0.3) : zb;
      if (floor >= zt) continue;
      for (let s = 0; s < 160; s++) {
        d = sceneDist(scene, L, bx + z * r2[0], by + z * r2[1], bz + z * r2[2]);
        if (d < dmin) { dmin = d; zmin = z; }
        if (d < eps) { hit = true; break; }
        z -= Math.max(d * stepK, eps * 0.5);
        if (z < floor) break;
      }
      const k = j * W + i;
      if (!hit) { if (opt.light || dmin > mmpp * 0.6) continue; z = zmin; alpha[k] = Math.max(0, 0.5 - dmin / mmpp); }
      else alpha[k] = 1;
      // one bisection-free refinement: step back onto the surface
      const wx = bx + z * r2[0], wy = by + z * r2[1], wz = bz + z * r2[2];
      depth[k] = z; sceneDist(scene, L, wx, wy, wz); grp[k] = HIT.g;
      if (opt.light) continue;
      pos[k * 3] = wx; pos[k * 3 + 1] = wy; pos[k * 3 + 2] = wz;
      // the normal, by four taps of a tetrahedron
      const a = sceneDist(scene, L, wx + hN, wy - hN, wz - hN), b = sceneDist(scene, L, wx - hN, wy - hN, wz + hN);
      const c = sceneDist(scene, L, wx - hN, wy + hN, wz - hN), e = sceneDist(scene, L, wx + hN, wy + hN, wz + hN);
      let nx = a - b - c + e, ny = -a - b + c + e, nz = -a + b - c + e; const nl = Math.hypot(nx, ny, nz) || 1;
      nx /= nl; ny /= nl; nz /= nl; nrm[k * 3] = nx; nrm[k * 3 + 1] = ny; nrm[k * 3 + 2] = nz;
      // occlusion: how much the surface round the point closes over it
      let occ = 0, wsum = 0;
      for (let q = 1; q <= 4; q++) {
        const h = aoK * (q * q * 1.6 + 0.6);
        const dd = sceneDist(scene, L, wx + nx * h, wy + ny * h, wz + nz * h);
        occ += (h - Math.max(-h, Math.min(h, dd))) / h / q; wsum += 1 / q;
      }
      ao[k] = Math.max(0, Math.min(1, 1 - 0.85 * occ / wsum));
    }
  }
  return { W, H, depth, grp, alpha, pos, nrm, ao, view };
}

// a shadow map from the window's side; returns lookup(x, y, z) -> lit share 0..1 (soft)
export function shadowMap(scene, bounds, L, mmpp, soft = 3) {
  // view basis with z toward the light
  const z = L, up = Math.abs(z[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  let x = [up[1] * z[2] - up[2] * z[1], up[2] * z[0] - up[0] * z[2], up[0] * z[1] - up[1] * z[0]]; const xl = Math.hypot(...x); x = x.map(c => c / xl);
  const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
  const V = [...x, ...y, ...z];
  // project the bounds' corners to find the light's frame
  let umin = 1e9, umax = -1e9, vmin = 1e9, vmax = -1e9;
  for (const cx of [bounds[0], bounds[3]]) for (const cy of [bounds[1], bounds[4]]) for (const cz of [bounds[2], bounds[5]]) {
    const u = x[0] * cx + x[1] * cy + x[2] * cz, v = y[0] * cx + y[1] * cy + y[2] * cz;
    umin = Math.min(umin, u); umax = Math.max(umax, u); vmin = Math.min(vmin, v); vmax = Math.max(vmax, v);
  }
  const W = Math.min(900, Math.ceil((umax - umin) / mmpp) + 2), H = Math.min(900, Math.ceil((vmax - vmin) / mmpp) + 2);
  const mp = Math.max((umax - umin) / (W - 2), (vmax - vmin) / (H - 2));
  const view = { W, H, x0: umin - mp, y0: vmax + mp, mmpp: mp, V };
  const sm = trace(scene, view, { light: true });
  const D = sm.depth;
  const look = (x1, y1, z1) => {
    const u = V[0] * x1 + V[1] * y1 + V[2] * z1, v = V[3] * x1 + V[4] * y1 + V[5] * z1, w = V[6] * x1 + V[7] * y1 + V[8] * z1;
    const fi = (u - view.x0) / mp - 0.5, fj = (view.y0 - v) / mp - 0.5;
    const r = Math.max(1, soft / mp), step = Math.max(1, r / 2); let lit = 0, n = 0;
    for (let dj = -r; dj <= r + 1e-6; dj += step) for (let di = -r; di <= r + 1e-6; di += step) {
      const ii = Math.round(fi + di), jj = Math.round(fj + dj); n++;
      if (ii < 0 || jj < 0 || ii >= W || jj >= H) { lit++; continue; }
      const dz = D[jj * W + ii]; if (dz < w + 1.2 + 0.6 * mp) lit++;
    }
    return lit / n;
  };
  return { look, view, depth: D };
}
