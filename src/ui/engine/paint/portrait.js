// A portrait, painted (characters.md §11): look -> anatomy.model (the sculpted mesh in mm) -> layers (skin, eyes, cloth,
// metal, hair) -> visibility buffer -> light -> pixels. paint(look, opt) returns { rgba, W, H, ms }: a pure function of
// the look and the options (no dice, no clock, no page; ms is only reported).
// opt: { W, H, tier 'S'|'M'|'L', view 'three'|'front'|'profile', crop 'bust'|'head'|'wide'|'figure', ground '#hex' }
import { model as anatomyModel, sstep, clamp, lerp, hv } from '../../../people/engine/anatomy.js';
import { rotY, rotX, mmul, mvec } from './surface.js';
import { rasterize, resolve, normals, lightDepth, makeShadow } from './mesh.js';
import { trace } from './raster.js';
import { diffuse, specular, rim, out, KEY, INK } from './light.js';
import { lin, mix3, SKIN, EYES } from './materials.js';
import { prepare as prepRelief, sample as reliefAt } from './relief.js';
import { noise2, noise3, fbm2, cell2, strHash } from './noise.js';
import { hairLayers, shadeHair, browHair, beardShadow, hairSDF, sdfGroup } from './hair.js';
import { garmentLayers, shadeCloth, accessorySDF } from './garments.js';

const VIEWS = { three: [-0.5, -0.28, 0.02], front: [-0.06, -0.03, 0], profile: [-1.5708, -1.0, 0], away: [0.5, 0.28, 0] };
const TIERS = { S: { head: 0.54, eye: 0.46 }, M: { head: 0.46, eye: 0.44 }, L: { head: 0.38, eye: 0.41 } };

export function build(look, opt = {}) {
  const m = anatomyModel(look), Mk = m.marks, nv = m.V.length / 3;
  const [yawH, yawB, pitch0] = VIEWS[opt.view || 'three'] || VIEWS.three;
  const pitch = pitch0 + (look.pitch || 0) + 0.12 * Mk.A.frail;
  // the head turns on the neck: full above the jaw, none below the collar
  const P = new Float32Array(nv * 3), V = m.V, hs = Mk.cr;
  const neck = [0, Mk.chinY - 10 * hs, -45 * hs], shoulderY = Mk.chinY - 110 * hs;
  for (let i = 0; i < nv; i++) {
    const x = V[i * 3], y = V[i * 3 + 1], z = V[i * 3 + 2];
    const w = sstep(Mk.chinY - 70 * hs, Mk.chinY + 15 * hs, y);
    // the head's own turn and nod about the top of the neck
    let p = [x - neck[0], y - neck[1], z - neck[2]];
    p = mvec(mmul(rotY((yawH - yawB) * w), rotX(pitch * w)), p);
    p = [p[0] + neck[0], p[1] + neck[1], p[2] + neck[2]];
    // and the body's turn about the spine
    p = mvec(rotY(yawB), [p[0], p[1] - shoulderY, p[2] + 40 * hs]);
    P[i * 3] = p[0]; P[i * 3 + 1] = p[1] + shoulderY; P[i * 3 + 2] = p[2] - 40 * hs;
  }
  const ctx = { look, m, P, tier: opt.tier || 'L', yawH, yawB, pitch, neck, shoulderY, toWorld: null };
  // a point in the model to the world (for solids added round the head: hair, a helm, a patch)
  ctx.toWorld = (x, y, z) => {
    const w = sstep(Mk.chinY - 70 * hs, Mk.chinY + 15 * hs, y);
    let p = mvec(mmul(rotY((yawH - yawB) * w), rotX(pitch * w)), [x - neck[0], y - neck[1], z - neck[2]]);
    p = [p[0] + neck[0], p[1] + neck[1], p[2] + neck[2]];
    p = mvec(rotY(yawB), [p[0], p[1] - shoulderY, p[2] + 40 * hs]);
    return [p[0], p[1] + shoulderY, p[2] - 40 * hs];
  };
  ctx.headR = mmul(rotY(yawB), mmul(rotY(yawH - yawB), rotX(pitch)));
  ctx.bodyR = rotY(yawB);
  const M = m.mesh, Q = M.quads, [b0, b1] = M.ranges.body;
  const skinFaces = new Uint8Array(M.nq), SO = M.marks.socket;
  for (let f = b0; f < b1; f++) { let so = 0; for (let e = 0; e < 4; e++) so += SO[Q[f * 4 + e]]; skinFaces[f] = m.removed[f] || so >= 3 ? 0 : 1; }
  const N = normals(P, Q, skinFaces);
  const layers = [{ name: 'skin', mat: 'skin', P, M: V, N, quads: Q, faces: skinFaces }];

  ctx.skinAttr = skinAttributes(m);
  ctx.skinLayerN = N; ctx.skinFaces = skinFaces;
  for (const L of hairLayers(ctx)) layers.push(L);
  for (const L of garmentLayers(ctx)) layers.push(L);
  for (const L of layers) if (!L.N) L.N = normals(L.P, Q, L.faces);
  const sdf = [...hairSDF(ctx), ...accessorySDF(ctx)];
  // the eyeballs, as true spheres behind the lids
  for (const e of m.eyes) if (!e.shut || e.shut === 'blind') sdf.push(sdfGroup(ctx, [{ t: 0, c: e.c, r: [e.r, e.r, e.r], k: 0 }], 'eye', 'eye', { eye: e }));
  return { m, ctx, layers, sdf };
}

// the frame: by tier the head fills a share of the width; a tall man's eyes sit higher in a bust (§5)
export function frameFor(m, look, opt) {
  const T = TIERS[opt.tier || 'L'] || TIERS.L, W = opt.W || 256, H = opt.H || W, Mk = m.marks;
  const headW = 168 * Mk.cr;
  let wmm = headW / T.head, eye = T.eye;
  if (opt.crop === 'head') { wmm = headW / 0.6; eye = 0.45; }
  if (opt.crop === 'scar') { wmm = headW / 0.5; eye = 0.44; }
  if (opt.crop === 'wide') { wmm = headW / 0.26; eye = 0.3; }
  if (opt.crop === 'figure') { const hmm = 2150; wmm = hmm * W / H; const mmpp0 = hmm / H; return { W, H, x0: -wmm / 2, y0: Mk.feet + 2100 + 20, mmpp: mmpp0 }; }
  if (opt.mmpp) wmm = opt.mmpp * W;
  if (typeof opt.center === 'string') { const S = Mk.stature, f = Mk.feet; opt = { ...opt, center: { chest: [-40, f + 0.735 * S], waist: [0, f + 0.6 * S], neckline: [40, Mk.chinY - 0.55 * Mk.headH], shoulder: [-0.11 * S, f + 0.79 * S] }[opt.center] || [0, 0] }; }
  if (opt.center) { const mp = wmm / W; return { W, H, x0: opt.center[0] - W * mp / 2, y0: opt.center[1] + H * mp / 2, mmpp: mp }; }
  if (look.height && m.age >= 17 && opt.crop !== 'head') eye = lerp(eye + 0.04, eye - 0.06, clamp((look.height - 150) / 45, 0, 1));
  const mmpp = wmm / W, hmm = mmpp * H;
  const x0 = -wmm / 2 + (opt.view === 'profile' ? -wmm * 0.06 : opt.view === 'front' ? 0 : -wmm * 0.035);
  return { W, H, x0, y0: eye * hmm, mmpp };
}

export function paint(look, opt = {}) {
  const t0 = now();
  const B = build(look, opt), { m, ctx, layers, sdf } = B;
  const view = frameFor(m, look, opt), { W, H, mmpp } = view;
  const R = rasterize(layers, view), S = resolve(R);
  // solids traced as surfaces (hair masses, buckles, a helm): only where they come in front of the meshes
  let SD = null;
  if (sdf.length) SD = traceSDF(sdf, view, S, ctx);
  const t1 = now();
  // the window's shadows: every layer and solid seen from the light
  const bounds = [view.x0, view.y0 - H * mmpp, -180, view.x0 + W * mmpp, view.y0 + 60, 180];
  const smm = Math.max(mmpp * 0.9, 0.4);
  const LD = lightDepth(layers.filter(L => !L.noShadow), KEY, bounds, smm);
  if (sdf.length) addSDFShadow(LD, sdf);
  const shadow = opt.noShadow ? () => 1 : makeShadow(LD, 3.2 + 0.8 * mmpp);
  const t2 = now();
  // occlusion from the depth buffer
  const depth = new Float32Array(W * H), nrmBuf = new Float32Array(W * H * 3);
  const sel = new Int32Array(W * H).fill(-1);   // -1 none, >=0 mesh layer, 1000+ sdf
  for (let k = 0; k < W * H; k++) {
    if (S.tri[k] >= 0) { depth[k] = S.depth[k]; sel[k] = R.triL[S.tri[k]]; }
    else depth[k] = -1e30;
    if (SD && SD.hit[k] && SD.z[k] > depth[k]) { depth[k] = SD.z[k]; sel[k] = 1000 + SD.g[k]; }
  }
  const ao = ssao(depth, W, H, mmpp, m.marks.cr);
  const rgba = new Uint8ClampedArray(W * H * 4);
  const ground = lin(opt.ground || '#2a2f45');
  const seed = strHash(look.id ?? 'x');
  const relief = prepRelief(m.relief, mmpp, ctx.tier);
  const PS = { look, m, ctx, mmpp, seed, relief, skin: skinOf(look, m), eyeCol: lin(EYES[look.eyes ?? 1] || EYES[1]), tier: ctx.tier, view: opt.view || 'three' };
  const Lp = [0, 0, 0], Wp = [0, 0, 0], n = [0, 0, 0], c = [0, 0, 0], at = new Float32Array(8), c2 = [0, 0, 0];
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = j * W + i, s = sel[k], bg = groundAt(ground, i / W, j / H);
    if (s < 0) { rgba[k * 4] = bg[0] * 255; rgba[k * 4 + 1] = bg[1] * 255; rgba[k * 4 + 2] = bg[2] * 255; rgba[k * 4 + 3] = 255; continue; }
    let cover = 1;
    if (s >= 1000) {
      const gi = s - 1000, G = sdf[gi];
      Wp[0] = SD.px[k * 3]; Wp[1] = SD.px[k * 3 + 1]; Wp[2] = SD.px[k * 3 + 2]; n[0] = SD.n[k * 3]; n[1] = SD.n[k * 3 + 1]; n[2] = SD.n[k * 3 + 2];
      G.toModel(Wp[0], Wp[1], Wp[2], Lp);
      const sh = shadow(Wp[0] + n[0] * 0.8, Wp[1] + n[1] * 0.8, Wp[2] + n[2] * 0.8);
      if (G.mat === 'hair') shadeHair(PS, G, Lp, n, ao[k], sh, c, Wp);
      else if (G.mat === 'eye') shadeEye(PS, G, Lp, n, ao[k], sh, c);
      else shadeCloth(PS, G, Lp, n, ao[k] * SD.ao[k], sh, c, Wp);
      cover = SD.cov[k];
      // a soft edge of hair over what is behind it
      if (cover < 1 && S.tri[k] >= 0) { shadeMeshPixel(PS, R, S, k, layers, shadow, ao, Lp, Wp, n, at, c2); for (let q = 0; q < 3; q++) c[q] = c[q] * cover + c2[q] * (1 - cover); cover = Math.max(cover, S.cov[k]); }
    } else {
      shadeMeshPixel(PS, R, S, k, layers, shadow, ao, Lp, Wp, n, at, c);
      cover = S.cov[k];
    }
    out(c, k * 4, rgba, cover, bg);
  }
  const t3 = now();
  if (opt.register === 'ink') inkFinish(rgba, W, H, sel, depth, mmpp, opt);
  else if (opt.finish !== false) paintFinish(rgba, W, H, sel, opt);
  if (opt.crop === 'figure' && opt.door !== false) doorway(rgba, W, H, view, m.marks.feet);
  if ((opt.tier || 'L') === 'S' || W <= 96) edge(rgba, W, H, sel);
  return { rgba, W, H, ms: { raster: t1 - t0, shadow: t2 - t1, shade: t3 - t2, total: now() - t0 } };
}
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

function shadeMeshPixel(PS, R, S, k, layers, shadow, ao, Lp, Wp, n, at, c) {
  const t = S.tri[k], li = R.triL[t], L = layers[li];
  const a = R.triA[t], b = R.triB[t], cc = R.triC[t], w0 = S.b0[k], w1 = S.b1[k], w2 = 1 - w0 - w1;
  for (let q = 0; q < 3; q++) {
    Wp[q] = w0 * L.P[a * 3 + q] + w1 * L.P[b * 3 + q] + w2 * L.P[cc * 3 + q];
    Lp[q] = w0 * L.M[a * 3 + q] + w1 * L.M[b * 3 + q] + w2 * L.M[cc * 3 + q];
    n[q] = w0 * L.N[a * 3 + q] + w1 * L.N[b * 3 + q] + w2 * L.N[cc * 3 + q];
  }
  const nl = Math.hypot(n[0], n[1], n[2]) || 1; n[0] /= nl; n[1] /= nl; n[2] /= nl;
  const ndl = n[0] * KEY[0] + n[1] * KEY[1] + n[2] * KEY[2], sh = ndl < -0.05 ? 0 : Math.max(1 - sstep(0.02, 0.32, ndl), shadow(Wp[0] + n[0] * 1.2, Wp[1] + n[1] * 1.2, Wp[2] + n[2] * 1.2));
  if (L.mat === 'skin') {
    const A = PS.ctx.skinAttr, K = A.K;
    for (let q = 0; q < K; q++) at[q] = w0 * A.a[a * K + q] + w1 * A.a[b * K + q] + w2 * A.a[cc * K + q];
    shadeSkin(PS, Lp, n, ao[k], sh, c, at, Wp);
  } else if (L.mat === 'eye') shadeEye(PS, L, Lp, n, ao[k], sh, c);
  else if (L.mat === 'hair') shadeHair(PS, L, Lp, n, ao[k], sh, c, Wp);
  else shadeCloth(PS, L, Lp, n, ao[k], sh, c, Wp);
}

// ---------- solids by distance (hair masses, metal fittings), traced only in front of the meshes ----------
function traceSDF(groups, view, S, ctx) {
  const { pack } = SDF_LIB;
  const scene = { groups, P: pack(groups), n: groups.reduce((s, g) => s + g.prims.length, 0) };
  for (const g of groups) if (g.dispModel) { const L = [0, 0, 0], f = g.dispModel; g.disp = (x, y, z) => { g.toModel(x, y, z, L); return f(L[0], L[1], L[2]); }; }
  const T = trace(scene, { ...view, V: [1, 0, 0, 0, 1, 0, 0, 0, 1] }, { margin: 10, aoScale: 0.8 * ctx.m.marks.cr, zFloor: S.depth });
  const N = view.W * view.H, hit = new Uint8Array(N), z = new Float32Array(N), cov = new Float32Array(N);
  for (let k = 0; k < N; k++) if (T.grp[k] >= 0 && T.alpha[k] > 0) { hit[k] = 1; z[k] = T.depth[k]; cov[k] = T.alpha[k]; }
  return { hit, z, cov, g: T.grp, px: T.pos, n: T.nrm, ao: T.ao };
}
import * as SDF_SURF from './surface.js';
import { shadowMap } from './raster.js';
const SDF_LIB = { pack: SDF_SURF.pack };
function addSDFShadow(LD, groups) {
  const scene = { groups, P: SDF_SURF.pack(groups), n: groups.reduce((s, g) => s + g.prims.length, 0) };
  const T = trace(scene, LD.view, { light: true });
  for (let k = 0; k < LD.D.length; k++) if (T.grp[k] >= 0 && T.depth[k] > LD.D[k]) LD.D[k] = T.depth[k];
}

// ---------- occlusion from depth: how much of the sky round a point the nearby surfaces hide ----------
function ssao(D, W, H, mmpp, hs) {
  const A = new Float32Array(W * H).fill(1);
  const R = Math.max(2, Math.min(28, (14 * hs) / mmpp));
  const dirs = [[1, 0], [0.707, 0.707], [0, 1], [-0.707, 0.707], [-1, 0], [-0.707, -0.707], [0, -1], [0.707, -0.707]];
  const steps = [0.18, 0.4, 0.7, 1.0];
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = j * W + i, z = D[k]; if (z < -1e29) continue;
    let occ = 0;
    for (let d = 0; d < 8; d++) {
      let best = 0;
      for (const s of steps) {
        const r = s * R, ii = Math.round(i + dirs[d][0] * r), jj = Math.round(j + dirs[d][1] * r);
        if (ii < 0 || jj < 0 || ii >= W || jj >= H) continue;
        const zz = D[jj * W + ii]; if (zz < -1e29) continue;
        const dz = zz - z, dist = r * mmpp;
        if (dz > 0.4 && dz < 40 * hs) { const e = dz / Math.hypot(dz, dist); const f = 1 - (dz / (40 * hs)); if (e * f > best) best = e * f; }
      }
      occ += best;
    }
    A[k] = Math.max(0.3, 1 - 0.6 * occ / 8);
  }
  return A;
}

// ---------- the ground: the realm's tint, lighter behind the shadowed side ----------
function groundAt(G, u, v) {
  const t = 0.5 + 0.7 * u - 0.2 * v, r = Math.hypot(u - 0.66, v - 0.38);
  const k = (0.55 + 0.6 * t) * (1 - 0.4 * r);
  return [0, 1, 2].map(c => { const x = Math.min(1, G[c] * k + 0.004); return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055; });
}
// a painter's finish (§1): each pixel takes the calmest of the four squares round it (Kuwahara), so tones group into
// strokes and edges stay; then a faint grain of brush along the strokes. Only the figure, never the ground.
function paintFinish(rgba, W, H, sel, opt) {
  const r = opt.brush ?? (W >= 400 ? 2 : W >= 180 ? 1 : 0); if (!r) return;
  const N = W * H, src = new Float32Array(N * 3), lum = new Float32Array(N);
  for (let k = 0; k < N; k++) { for (let q = 0; q < 3; q++) src[k * 3 + q] = rgba[k * 4 + q]; lum[k] = 0.3 * src[k * 3] + 0.59 * src[k * 3 + 1] + 0.11 * src[k * 3 + 2]; }
  // summed-area tables of colour, luminance and its square
  const W1 = W + 1, S = new Float64Array((W + 1) * (H + 1) * 5);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = j * W + i, o = ((j + 1) * W1 + i + 1) * 5, a = (j * W1 + i + 1) * 5, b = ((j + 1) * W1 + i) * 5, c = (j * W1 + i) * 5;
    const v = [src[k * 3], src[k * 3 + 1], src[k * 3 + 2], lum[k], lum[k] * lum[k]];
    for (let q = 0; q < 5; q++) S[o + q] = v[q] + S[a + q] + S[b + q] - S[c + q];
  }
  const box = (i0, j0, i1, j1, q) => S[((j1 + 1) * W1 + i1 + 1) * 5 + q] - S[(j0 * W1 + i1 + 1) * 5 + q] - S[((j1 + 1) * W1 + i0) * 5 + q] + S[(j0 * W1 + i0) * 5 + q];
  for (let j = r; j < H - r; j++) for (let i = r; i < W - r; i++) {
    const k = j * W + i; if (sel[k] < 0) continue;
    let best = 1e18, bi = 0;
    const Q = [[i - r, j - r, i, j], [i, j - r, i + r, j], [i - r, j, i, j + r], [i, j, i + r, j + r]];
    for (let q = 0; q < 4; q++) { const [a, b, c, d] = Q[q], n = (c - a + 1) * (d - b + 1), m = box(a, b, c, d, 3) / n, v = box(a, b, c, d, 4) / n - m * m; if (v < best) { best = v; bi = q; } }
    const [a, b, c, d] = Q[bi], n = (c - a + 1) * (d - b + 1);
    for (let q = 0; q < 3; q++) rgba[k * 4 + q] = 0.35 * src[k * 3 + q] + 0.65 * box(a, b, c, d, q) / n;
  }
}
// the other register (§1, the registers sheet): ink and flat tone on the same model. Three tones a colour, and an ink
// line where one form overlaps another or a surface turns away.
function inkFinish(rgba, W, H, sel, depth, mmpp, opt) {
  const src = new Uint8ClampedArray(rgba), ink = [27, 23, 48];
  const lum = k => 0.3 * src[k * 4] + 0.59 * src[k * 4 + 1] + 0.11 * src[k * 4 + 2];
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = j * W + i; if (sel[k] < 0) continue;
    const l = lum(k) + 1, q = l > 150 ? 205 : l > 85 ? 130 : 62, f = q / l;
    for (let c = 0; c < 3; c++) rgba[k * 4 + c] = Math.min(255, src[k * 4 + c] * f * 0.85 + 22);
  }
  const lw = Math.max(1, Math.round(W / 220)), th = Math.max(3, 2.5 * mmpp * 3);
  for (let j = lw; j < H - lw; j++) for (let i = lw; i < W - lw; i++) {
    const k = j * W + i; let line = false;
    for (const d of [1, W]) for (let r = 1; r <= lw && !line; r++) {
      const a = k - d * r, b = k + d * r;
      if (sel[a] !== sel[b] && (sel[k] >= 0 || sel[a] >= 0 || sel[b] >= 0)) { if (sel[k] >= 0 || r === 1) line = sel[k] >= 0 || sel[a] >= 0; }
      else if (sel[k] >= 0 && Math.abs(depth[a] + depth[b] - 2 * depth[k]) > th) line = true;
    }
    if (line) for (let c = 0; c < 3; c++) rgba[k * 4 + c] = ink[c];
  }
}
// the doorway everyone stands in (§5): 210 cm, with marks at 150, 172 and 195
function doorway(rgba, W, H, view, feet) {
  const px = y => Math.round((view.y0 - (feet + y)) / view.mmpp), x0 = Math.round(W * 0.08), x1 = Math.round(W * 0.92);
  const put = (i, j, c, a) => { if (i < 0 || j < 0 || i >= W || j >= H) return; const k = (j * W + i) * 4; for (let q = 0; q < 3; q++) rgba[k + q] = rgba[k + q] * (1 - a) + c[q] * a; };
  const top = px(2100), fl = px(0), wood = [70, 52, 38];
  for (let j = top; j <= fl; j++) for (let t = 0; t < 4; t++) { put(x0 - t, j, wood, 0.9); put(x1 + t, j, wood, 0.9); }
  for (let i = x0 - 3; i <= x1 + 3; i++) for (let t = 0; t < 4; t++) { put(i, top - t, wood, 0.9); put(i, fl + t, [40, 32, 28], 0.8); }
  for (const h of [1500, 1720, 1950]) { const j = px(h); for (let i = x0; i < x0 + 10; i++) put(i, j, [200, 190, 160], 0.8); for (let i = x1 - 10; i < x1; i++) put(i, j, [200, 190, 160], 0.8); }
}
// one thin dark edge holds a small head off the ground
function edge(rgba, W, H, sel) {
  const cp = new Uint8ClampedArray(rgba);
  for (let j = 1; j < H - 1; j++) for (let i = 1; i < W - 1; i++) {
    const k = j * W + i; if (sel[k] >= 0) continue;
    if (sel[k - 1] >= 0 || sel[k + 1] >= 0 || sel[k - W] >= 0 || sel[k + W] >= 0) for (let q = 0; q < 3; q++) rgba[k * 4 + q] = cp[k * 4 + q] * 0.5 + [27, 23, 48][q] * 0.5;
  }
}

// ---------- skin ----------
// per-vertex skin channels: 0 upper lash line, 1 lower lash line, 2 lips, 3 inside the mouth, 4 nostril, 5 ear
function skinAttributes(m) {
  const K = 6, nv = m.V.length / 3, a = new Float32Array(nv * K), V = m.V, Mk = m.marks, hs = Mk.cr;
  for (const e of m.eyes) {
    const up = e.upper, lo = e.lower;
    for (let i = 0; i < nv; i++) {
      const x = V[i * 3], y = V[i * 3 + 1], z = V[i * 3 + 2];
      if (Math.abs(x - e.c[0]) > 24 * hs || Math.abs(y - e.c[1]) > 18 * hs || z < e.c[2]) continue;
      let du = 1e9, dl = 1e9;
      for (const p of up) du = Math.min(du, Math.hypot(x - p[0], y - p[1], z - p[2]));
      for (const p of lo) dl = Math.min(dl, Math.hypot(x - p[0], y - p[1], z - p[2]));
      a[i * K] = Math.max(a[i * K], Math.exp(-Math.pow(du / (1.3 * hs), 2)));
      a[i * K + 1] = Math.max(a[i * K + 1], Math.exp(-Math.pow(dl / (1.0 * hs), 2)));
    }
  }
  // the lips: from where the lip targets reach, sharpened
  const lipU = reachOf(m, 'mouth/mouth-upperlip-volume-incr'), lipL = reachOf(m, 'mouth/mouth-lowerlip-volume-incr');
  const mo = Mk.mouth;
  for (let i = 0; i < nv; i++) {
    const v = Math.max(lipU[i], lipL[i]);
    a[i * K + 2] = sstep(0.35, 0.75, v);
    const x = V[i * 3], y = V[i * 3 + 1], z = V[i * 3 + 2];
    if (Math.abs(x) < mo.w + 3 && Math.abs(y - mo.y) < 9 * hs) { const zf = mo.corner[2] + 12 * hs * Math.sqrt(Math.max(0, 1 - Math.pow(x / (mo.w + 2), 2))); a[i * K + 3] = sstep(-4, -9, z - zf); }
    if (m.mesh.marks.earMask[i]) a[i * K + 5] = 1;
  }
  return { a, K };
}
const REACH = {};
function reachOf(m, name) {
  if (REACH[name]) return REACH[name];
  const t = m.mesh.targets[name], out = new Float32Array(m.mesh.nv); if (!t) return out;
  let mx = 0; for (let j = 0; j < t.idx.length; j++) { const d = Math.hypot(t.D[j * 3], t.D[j * 3 + 1], t.D[j * 3 + 2]); out[t.idx[j]] = d; mx = Math.max(mx, d); }
  for (let i = 0; i < out.length; i++) out[i] /= mx || 1;
  return (REACH[name] = out);
}
function skinOf(look, m) {
  let base = lin(SKIN[clamp(look.skin ?? 3, 0, 11)] || SKIN[3]);
  if (look.skinHex) base = lin(look.skinHex);
  const w = clamp(look.wear || 0, -0.5, 1);
  if (w > 0) base = mix3(base, [base[0] * 0.9, base[1] * 0.83, base[2] * 0.77], 0.6 * w);
  if (w < 0) base = mix3(base, [base[0] * 1.04, base[1] * 1.04, base[2] * 1.06], -w);
  base = mix3(base, [base[0] * 1.05, base[1] * 0.93, base[2] * 0.93], 0.5 * m.marks.baby);
  return base;
}
const SK = [0, 0, 0], NN = [0, 0, 0], WR = [0.34, 0.18, 0.12];
function shadeSkin(PS, L, n, ao, sh, c, at, Wp) {
  const m = PS.m, M = m.marks, x = L[0], y = L[1], z = L[2], ax = Math.abs(x), look = PS.look, hs = M.cr;
  let a0 = PS.skin[0], a1 = PS.skin[1], a2 = PS.skin[2];
  const head = y > M.chinY - 40 * hs;
  let spec = 0.07, specP = 26, oil = 0;
  // the normal, bent by fine relief (in the model's frame, then back to the world by the head's turn)
  const R = head ? PS.ctx.headR : PS.ctx.bodyR;
  let lx = R[0] * n[0] + R[3] * n[1] + R[6] * n[2], ly = R[1] * n[0] + R[4] * n[1] + R[7] * n[2], lz = R[2] * n[0] + R[5] * n[1] + R[8] * n[2];
  let mark = 0, fresh = 0, red = 0, burn = 0, cav = 0;
  if (head && z > -40 * hs && PS.relief.length) {
    const r = reliefAt(PS.relief, x, y, PS.seed);
    const k = 0.85, f = Math.max(0.25, lz);
    lx -= r.gx * k * f; ly -= r.gy * k * f;
    mark = r.mark; fresh = r.fresh; red = r.red; burn = r.burn; cav = r.cav;
  }
  if (PS.mmpp < 0.8) {
    // pores and the grain of skin, where a pixel can hold them
    const f = 1.3, amp = (0.05 + 0.05 * M.mal + 0.05 * M.A.lines) * clamp(1.0 - PS.mmpp, 0, 1);
    lx += noise3(x * f, y * f, z * f, 11) * amp; ly += noise3(x * f + 7.1, y * f, z * f - 3.3, 12) * amp;
  }
  const ll = Math.hypot(lx, ly, lz) || 1; lx /= ll; ly /= ll; lz /= ll;
  NN[0] = R[0] * lx + R[1] * ly + R[2] * lz; NN[1] = R[3] * lx + R[4] * ly + R[5] * lz; NN[2] = R[6] * lx + R[7] * ly + R[8] * lz;
  if (head) {
    const front = sstep(-20 * hs, 30 * hs, z);
    // the colour zones of a face (§1 Skin): forehead yellower; cheeks, nose and ears redder; a shaved jaw cooler
    const cheek = Math.exp(-Math.pow((ax - M.eyeX * 1.15) / (20 * hs), 2) - Math.pow((y + 30 * hs) / (20 * hs), 2)) * front;
    const nose = Math.exp(-Math.pow(x / (11 * hs), 2) - Math.pow((y - M.nose.tip[1] - 6 * hs) / (16 * hs), 2)) * sstep(M.nose.tip[2] - 30 * hs, M.nose.tip[2] - 5 * hs, z);
    const ear = at[5];
    const flush = clamp(0.6 + 0.4 * (look.flush || 0) + 0.3 * M.baby + 0.3 * clamp(look.wear || 0, 0, 1), 0, 1.3);
    const redz = (cheek * 0.85 + nose * 0.95 + ear * 0.8) * flush;
    a0 *= 1 + 0.08 * redz; a1 *= 1 - 0.14 * redz; a2 *= 1 - 0.13 * redz;
    const fore = sstep(M.browY + 8 * hs, M.browY + 40 * hs, y) * front;
    a0 *= 1 + 0.02 * fore; a2 *= 1 - 0.06 * fore;
    const ue = Math.exp(-Math.pow((ax - M.eyeX) / (11 * hs), 2) - Math.pow((y + 10 * hs) / (5 * hs), 2)) * (0.5 + 0.7 * M.A.sag + 0.5 * (look.tired || 0));
    a0 *= 1 - 0.08 * ue; a1 *= 1 - 0.12 * ue; a2 *= 1 - 0.05 * ue;
    const bs = beardShadow(PS, x, y, z);
    if (bs > 0) { a0 *= 1 - 0.24 * bs; a1 *= 1 - 0.19 * bs; a2 *= 1 - 0.08 * bs; }
    // lips
    const lp = at[2];
    if (lp > 0.01) {
      const sat = 0.5 + 0.35 * M.fem + 0.2 * M.baby - 0.25 * M.A.thin;
      a0 = lerp(a0, a0 * (0.95 + 0.04 * sat), lp); a1 = lerp(a1, a1 * (0.85 - 0.5 * sat), lp); a2 = lerp(a2, a2 * (0.88 - 0.42 * sat), lp);
      spec = lerp(spec, 0.2, lp); specP = lerp(specP, 55, lp);
    }
    // the parting of the lips and the nostrils: the painter's few darks
    const inner = at[3];
    if (inner > 0.01) { const t = Math.min(1, inner * 1.1); a0 = lerp(a0, 0.04, t); a1 = lerp(a1, 0.012, t); a2 = lerp(a2, 0.014, t); spec *= 1 - t; }
    // lash lines and lashes
    const lash = Math.max(at[0] * 0.95, at[1] * 0.45);
    if (lash > 0.02) { const hc = PS.ctx.lashCol; a0 = lerp(a0, hc[0], lash); a1 = lerp(a1, hc[1], lash); a2 = lerp(a2, hc[2], lash); spec *= 1 - lash; }
    const bw = browHair(PS, x, y, z);
    if (bw > 0) { const hc = PS.ctx.browCol; a0 = lerp(a0, hc[0], bw); a1 = lerp(a1, hc[1], bw); a2 = lerp(a2, hc[2], bw); spec *= 1 - 0.6 * bw; }
    // the oily T of the face shines; the skin of the old is drier
    oil = (sstep(M.browY + 4 * hs, M.browY + 30 * hs, y) * Math.exp(-Math.pow(x / (34 * hs), 2)) * 0.6 + nose * 1.1 + cheek * 0.3) * front * (1 - 0.45 * M.A.old);
    // freckles, moles, age spots
    const g = look.g || {};
    if ((g.freckles ?? -1) > -0.6 && front > 0.3) {
      const cl = cell2(x / (2.2 * hs), y / (2.2 * hs), PS.seed + 21); const on = ((cl.id >>> 4) & 255) / 255 < (g.freckles + 0.6) * 0.5 * (cheek + nose + 0.3);
      if (on && cl.d < 0.32) { const t = 0.4 * (1 - cl.d / 0.32); a0 *= 1 - 0.16 * t; a1 *= 1 - 0.28 * t; a2 *= 1 - 0.4 * t; }
    }
    if (M.A.spots > 0.1) { const cl = cell2(x / 5, y / 5, PS.seed + 23); if (((cl.id >>> 6) & 255) / 255 < 0.18 * M.A.spots && cl.d < 0.4) { const t = 0.3 * (1 - cl.d / 0.4) * M.A.spots; a0 *= 1 - 0.18 * t; a1 *= 1 - 0.3 * t; a2 *= 1 - 0.42 * t; } }
    if ((g.moles ?? -1) > -0.4 && front > 0.2) { const cl = cell2(x / 9, y / 9, PS.seed + 29); if (((cl.id >>> 8) & 255) / 255 < (g.moles + 0.4) * 0.1 && cl.d < 0.11) { const t = 1 - cl.d / 0.11; a0 = lerp(a0, a0 * 0.45, t); a1 = lerp(a1, a1 * 0.38, t); a2 = lerp(a2, a2 * 0.35, t); } }
    if (cav > 0) { const t = Math.min(0.5, cav * 0.35); a0 *= 1 - 0.15 * t; a1 *= 1 - 0.27 * t; a2 *= 1 - 0.27 * t; }
    // scars (§7): pale and a little shiny, red for a year, raw while fresh
    if (mark > 0) {
      const tone = clamp(look.skin ?? 3, 0, 11) / 11;
      const pale = [a0 * (1.16 - 0.45 * tone) + 0.03, a1 * (1.12 - 0.35 * tone) + 0.025, a2 * (1.15 - 0.4 * tone) + 0.025];
      const rd = [a0 * 1.12, a1 * 0.6, a2 * 0.6], raw = [0.4, 0.06, 0.05];
      let s0 = lerp(pale[0], rd[0], red), s1 = lerp(pale[1], rd[1], red), s2 = lerp(pale[2], rd[2], red);
      s0 = lerp(s0, raw[0], fresh); s1 = lerp(s1, raw[1], fresh); s2 = lerp(s2, raw[2], fresh);
      a0 = lerp(a0, s0, mark * 0.9); a1 = lerp(a1, s1, mark * 0.9); a2 = lerp(a2, s2, mark * 0.9);
      spec += 0.12 * mark; specP = lerp(specP, 70, mark);
    }
    if (burn > 0) {
      const mt = fbm2(x * 0.15, y * 0.15, 3, PS.seed + 41);
      const cA = mt > 0.1 ? mix3([0.5, 0.2, 0.18], [0.56, 0.45, 0.4], clamp((mt - 0.1) * 4, 0, 1)) : mix3([0.5, 0.2, 0.18], [a0 * 0.6, a1 * 0.45, a2 * 0.4], clamp(-mt * 4, 0, 1));
      a0 = lerp(a0, cA[0], burn * 0.8); a1 = lerp(a1, cA[1], burn * 0.8); a2 = lerp(a2, cA[2], burn * 0.8);
      spec += 0.25 * burn; specP = lerp(specP, 90, burn);
    }
  } else {
    const t = 0.05 * sstep(M.chinY - 260 * hs, M.chinY - 160 * hs, y);
    a0 *= 1 + t; a1 *= 1 - t; a2 *= 1 - t;
  }
  SK[0] = a0; SK[1] = a1; SK[2] = a2;
  diffuse(SK, NN, ao, sh, WR, c, { sss: 1 });
  const sp = specular(NN, sh, specP, spec + 0.32 * oil) + specular(NN, sh, 140, 0.25 * oil);
  const rm = rim(NN, 0.2);
  c[0] += sp * 0.95 + rm * a0 * 2.2; c[1] += sp * 0.93 + rm * a1 * 2.4; c[2] += sp * 0.9 + rm * a2 * 3;
}

// ---------- the eye (§1 Eyes): a wet ball under the lid's shadow, one catchlight from the window ----------
function shadeEye(PS, Ly, L, n, ao, sh, c) {
  const e = Ly.eye, dx = L[0] - e.c[0], dy = L[1] - e.c[1], dz = L[2] - e.c[2], r = Math.hypot(dx, dy, dz) || 1;
  const ux = dx / r, uy = dy / r, uz = dz / r;
  // the sitter looks toward us: the gaze is the view direction brought into the head's frame, a little of the head's own
  const H = PS.ctx.headR, gw = [0.08 * hv(PS.look.id ?? 'x', 'gz'), 0.0, 1];
  let gx = H[2] * gw[2] * 0.8 + 0.2 * 0, gy = H[5] * gw[2] * 0.8 + 0.02, gz = H[8] * gw[2] * 0.8 + 0.2;
  gx += gw[0]; const gl = Math.hypot(gx, gy, gz); gx /= gl; gy /= gl; gz /= gl;
  // the eye's centre sits to the side of its own ball: aim each eye at a point a metre ahead
  const tx = -e.c[0] / 1000 * 0; gx += tx;
  const cosA = ux * gx + uy * gy + uz * gz, sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA)) * e.r;
  const irisR = e.iris * e.r / 12, pupR = e.pupil * e.r / 12;
  let col;
  if (sinA < irisR && cosA > 0) {
    const t = sinA / irisR, ang = Math.atan2(uy - gy * cosA, ux - gx * cosA);
    const fib = 0.72 + 0.28 * noise2(ang * 9, t * 3, PS.seed + 31) + 0.14 * noise2(ang * 30, t * 6, PS.seed + 37);
    const base = PS.eyeCol;
    col = [base[0] * fib, base[1] * fib, base[2] * fib];
    col = mix3(col, [base[0] * 1.7 + 0.03, base[1] * 1.5 + 0.02, base[2] * 1.1], Math.exp(-Math.pow((t - 0.42) / 0.12, 2)) * 0.25);
    col = mix3(col, [base[0] * 0.22, base[1] * 0.22, base[2] * 0.28], sstep(0.8, 1.0, t) * 0.85);
    if (sinA < pupR) col = [0.012, 0.01, 0.014];
    if (e.shut === 'blind') col = mix3(col, [0.42, 0.44, 0.46], 0.85);
  } else {
    const corner = sstep(0.25, 0.9, Math.abs(ux));
    col = [0.5 + 0.08 * corner, 0.45 - 0.05 * corner, 0.43 - 0.06 * corner];
    if (PS.m.marks.A.old > 0.2) col = mix3(col, [0.5, 0.44, 0.3], 0.3 * PS.m.marks.A.old);
  }
  diffuse(col, n, ao, sh, [0.2, 0.2, 0.2], c);
  // the catchlight: a small square of window on the cornea's bulge
  const cb = sinA < irisR * 1.25 && cosA > 0 ? 0.45 : 0;
  const nn = [n[0] + cb * (H[2]), n[1] + cb * H[5], n[2] + cb * H[8]], nl = Math.hypot(...nn);
  nn[0] /= nl; nn[1] /= nl; nn[2] /= nl;
  const sp = specular(nn, Math.max(0.3, sh), 700, 8) + specular(nn, sh, 50, 0.25);
  c[0] += sp; c[1] += sp; c[2] += sp * 1.02;
}
