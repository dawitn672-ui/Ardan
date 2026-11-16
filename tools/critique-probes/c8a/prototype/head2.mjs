// C8a realism prototype (throwaway): the head as a loft in millimetres (see loft.mjs), finished per pixel (relief.mjs).
// buildHead({ sex, age, g: genes -1..1, fat, wounds, hair, dress, yaw, pxmm }) -> a model for relief.render
import { E, EA, symE, blob, stroke, sym, MAT, hexLin, groupsFor, lerp, clamp, sstep, rngOf, strHash } from './relief.mjs';
import { makeLoft, offsetLoft, phis, ysOf } from './loft.mjs';

// growth: [age, cranium, face height, face width, nose, eye ball, eye spacing, jaw back (mm), baby fat]
const GROW = [
  [0,  0.63, 0.50, 0.58, 0.42, 0.72, 0.64, -7, 1.0],
  [1,  0.82, 0.62, 0.70, 0.50, 0.86, 0.72, -6, 1.0],
  [3,  0.89, 0.70, 0.77, 0.58, 0.93, 0.78, -5, 0.8],
  [6,  0.92, 0.79, 0.83, 0.68, 0.95, 0.83, -4, 0.5],
  [10, 0.95, 0.86, 0.88, 0.77, 0.97, 0.89, -3, 0.25],
  [14, 0.975, 0.93, 0.94, 0.89, 0.985, 0.95, -1.5, 0.1],
  [18, 1, 1, 1, 1, 1, 1, 0, 0],
  [200, 1, 1, 1, 1, 1, 1, 0, 0],
];
export const grow = age => { for (let i = 1; i < GROW.length; i++) if (age <= GROW[i][0]) { const a = GROW[i - 1], b = GROW[i], t = (age - a[0]) / (b[0] - a[0]); return a.map((v, k) => lerp(v, b[k], t)); } return GROW[GROW.length - 1]; };
const mb = (c, r, amt) => ({ c, r: typeof r === 'number' ? [r, r, r] : r, amt });
const symM = (c, r, amt) => [mb(c, r, amt), mb([-c[0], c[1], c[2]], r, amt)];

export function buildHead(o = {}) {
  const g = Object.assign({ jawW: 0, jawSq: 0, chin: 0, cheek: 0, brow: 0, noseLen: 0, noseBridge: 0, noseTip: 0, noseW: 0, eyeSize: 0, eyeGap: 0, eyeTilt: 0, lips: 0, mouthW: 0, faceLen: 0, lid: 0, browW: 0, browArch: 0 }, o.g || {});
  const age = o.age == null ? 30 : o.age, F = o.sex === 'F', W = o.wounds || {};
  const [, kc, kfh, kfw, kn, ke, kes, jawF, baby] = grow(age);
  const sx = sstep(11, 19, age), fem = F ? sx : 0, mal = F ? 0 : sx;
  const old = sstep(42, 78, age), mid = sstep(28, 50, age), veryOld = sstep(66, 88, age);
  const fat = (o.fat || 0), S = F ? lerp(1, 0.945, sx) : 1;
  const cr = kc * S, browY = 98 * cr, fh = kfh * S * (1 + 0.09 * g.faceLen), fw = kfw * S;
  const Y = y => browY + (y - 98) * fh, X = x => x * fw, Zf = z => z * lerp(cr, fw, 0.5);
  const pxmm = o.pxmm || 1.3, step = clamp((o.quad || 2.0) / pxmm, 0.9, o.quad ? 16 : 6), AZ = -8 * cr;

  // ---------------- the head: volumes
  const P = [], B = [], RG = [], shells = [];
  P.push(E([0, 92 * cr, -5 * cr], [76 * cr, 92 * cr, 100 * cr], { k: 0 }));
  P.push(E([0, 70 * cr, Zf(40)], [60 * cr, 44 * cr, 54 * cr + baby * 3], { k: 10 }));
  P.push(E([0, Y(146), Zf(30)], [X(62 + 2 * g.jawW + 1.5 * g.cheek) + fat * 3 + baby * 3, 86 * fh, Zf(66)], { k: 12 }));
  P.push(E([0, Y(172), Zf(60) + jawF * 0.5], [X(31), 27 * fh, Zf(37)], { k: 14 }));
  const chinZ = Zf(77) + jawF + 4.5 * g.chin - 2.5 * fem + 1.5 * mal, chinY = Y(208) + 3 * g.chin, chinB = chinY + 16 * fh + 2 * g.chin;
  P.push(E([0, chinY - 1, chinZ - 1], [X(23 + 4 * g.jawSq - 4 * fem + 2 * mal), 15 * fh + 2 * g.chin, 16 * fw], { k: 16 }));
  P.push(E([0, chinB - 15 * fh, Zf(26)], [X(34 + 4 * g.jawW), 12 * fh + fat * 4, Zf(40)], { k: 16 }));                // the floor of the mouth, under the jaw
  const goX = X(52 + 8 * g.jawW - 5 * fem + 3 * mal), go = [goX, Y(194 + 5 * g.jawSq), Zf(6)], cs = [X(15 + 5 * g.jawSq), chinB - 7 * fh, chinZ - 8];
  for (const sg of [1, -1]) P.push(EA([go[0] * sg * 0.84, go[1] - 12, go[2] + 6], [cs[0] * sg, cs[1] - 6, cs[2] - 6], (13 + 1.5 * mal - 1.5 * fem + 1.5 * g.jawSq) * fw, { k: 22, cap: 0.3 }));
  // the nose
  const nl = kn / kfh * (1 + 0.12 * g.noseLen + 0.04 * mal - 0.05 * fem + 0.06 * old), nS = clamp(kn / Math.max(kfw, 0.5), 0.6, 1.1) * fw;
  const nz0 = Zf(86) - baby * 4, tipY = Y(108) + 42 * fh * nl + 2.5 * g.noseTip + 2.5 * veryOld, tipZ = nz0 + (27 + 3 * g.noseBridge) * nS * (1 + 0.08 * mal - 0.08 * fem) - baby * 3;
  const brk = W.nose || 0, n0y = Y(111);
  const dors = [[0, n0y - 4 * fh, nz0 + 3, 7.6], [brk * 4.8, lerp(n0y, tipY, 0.3), lerp(nz0, tipZ, 0.33) + 1.5 + 3.4 * g.noseBridge + Math.abs(brk) * 1.6, 7.6], [brk * 3.6, lerp(n0y, tipY, 0.58), lerp(nz0, tipZ, 0.62) + 1 + 2.2 * g.noseBridge - Math.abs(brk) * 1.0, 8.2], [brk * 1.4, lerp(n0y, tipY, 0.82), lerp(nz0, tipZ, 0.86), 8.6]];
  for (const [x, y, z, r] of dors) P.push(E([x, y, z - r * nS], [r * nS * (0.86 + 0.12 * g.noseW), r * nS * 1.5, r * nS], { k: 7 }));
  P.push(E([brk * 0.5, tipY - 1 * nS, tipZ - 8.6 * nS], [9.2 * nS * (1 + 0.14 * g.noseW), 8 * nS, 8.6 * nS], { k: 5 }));
  const alX = (12.5 + 3.5 * g.noseW + 1.2 * mal - 1 * fem + 1.5 * old) * nS, alZ = tipZ - 21 * nS;
  P.push(...symE([alX, tipY + 2.2 * nS, alZ - 6 * nS], [8.0 * nS, 7.0 * nS, 9.5 * nS], { k: 4 }));
  const snY = tipY + 8.2 * nS, snZ = tipZ - 19 * nS;

  // lips
  const lipT = (1 + 0.42 * g.lips + 0.12 * fem - 0.08 * mal - 0.28 * old + baby * 0.1), mw = (25.5 + 4 * g.mouthW) * fw;
  const stY = Math.max(snY + 14 * fh, Y(180)), lipZ = Zf(88.5) + jawF * 0.6;
  P.push(E([0, stY - 4.6 * lipT, lipZ - 3], [mw * 0.92, 6.2 * lipT, 12 * fw], { k: 7 }));
  P.push(E([0, stY + 5.4 * lipT, lipZ - 5], [mw * 0.8, 7.0 * lipT, 12 * fw], { k: 7 }));
  // the neck belongs to the head as far as the collar
  const bS = S * lerp(0.42, 1, sstep(0, 18, age)), neckR = (52 + 5 * mal - 6 * fem + fat * 6 - 7 * veryOld) * lerp(0.6, 1, sstep(0, 18, age)) * S;
  P.push(EA([0, Y(165), -14 * cr], [0, chinB + 105 * bS, -26 * bS], neckR, { k: 12, cap: 0.3 }));

  // ---------------- the head: features pushed along the radius
  const eyeX = 31.5 * kes * S + 3 * g.eyeGap, eyeY = browY + 14.5 * lerp(cr, fh, 0.5), eR = 12.2 * ke, eyeZ = Zf(72) - baby * 2, sock = 1 + 0.25 * old;
  const brF = 3 * g.brow + 2.2 * mal - 1.8 * fem - baby * 3;
  B.push(...symM([X(58 + 3 * g.cheek), Y(129 - 2 * g.cheek), Zf(46)], [27 * fw, 17 * fh, 32], 4.5 + 3.2 * g.cheek - baby * 3));                 // cheekbones
  B.push(...symM([goX, Y(190), Zf(8)], [24, 26 * fh, 30], 4 + 5 * g.jawW + 2 * g.jawSq + 2 * mal - 2 * fem));                                  // the jaw's angle
  B.push(...symM([eyeX, eyeY - 1, eyeZ + 20], [26 * fw, 16 * cr, 24], -12.5 * sock * lerp(0.55, 1, 1 - baby)));                                // sockets
  B.push(...symM([eyeX - 13 * fw, eyeY + 3, eyeZ + 15], [9, 10, 13], -3.5));
  B.push(mb([0, Y(108), Zf(92)], [10, 8, 12], -0.8 - 1.0 * mal + baby));                                                                        // root of the nose
  B.push(...symM([X(60), browY - 8, Zf(52)], [24, 26, 28], -3 - 3.5 * old + fat * 2));                                                         // temples
  B.push(...symM([X(46), Y(167), Zf(57)], [19, 27 * fh, 26], -2.6 - 3.8 * old * (1 - clamp(fat, 0, 1)) + fat * 5 - 2.2 * g.cheek * 0.5));       // under the cheekbone
  B.push(mb([0, lerp(stY + 6 * lipT, chinY, 0.5), chinZ + 12], [16 * fw, 6.5 * fh, 12], -2.4 + baby * 1.5));
  B.push(...symM([X(34), Y(158), Zf(70)], [22, 24 * fh, 26], 2.2 + fat * 2));                                                                     // the front of the cheek                                      // the fold above the chin
  B.push(...symM([mw + 1.5, stY + 0.3, lipZ - 2], [6.5, 6, 10], -2.8));                                                                        // corners of the mouth
  if (baby > 0.05) B.push(...symM([X(42), Y(170), Zf(60)], [27, 27, 28], 8 * baby));                                                           // a baby's cheeks
  if (fat > 0) { B.push(...symM([X(40), Y(180), Zf(55)], [30, 34, 34], 5 * fat)); B.push(mb([0, chinB + 6, chinZ - 30], [36, 20, 40], 12 * fat)); }   // a heavy face; a second chin
  B.push(...symM([X(36), chinY + 3, chinZ - 20], [15, 12, 18], 5 * old * (0.6 + 0.6 * Math.max(0, fat + 0.3))));                               // jowls
  B.push(...symM([eyeX, eyeY + 12.5, eyeZ + 12], [13, 6, 12], 1.5 * old + 0.4 * mid));                                                        // bags under the eyes
  if (W.dent) B.push(mb([X(58) * W.dent, Y(130), Zf(50)], [20, 15, 30], -8));                                                                  // a cheekbone stove in
  if (W.eye) B.push(mb([eyeX * W.eye, eyeY, eyeZ + 16], [17, 12, 18], -6));                                                                    // lids sunk over an empty socket
  if (mal > 0.3) B.push(mb([0, chinB + 40 * bS, 34 * bS], [11, 13, 14], 4.5 * mal));                                                           // Adam's apple
  if (old > 0.05) B.push(mb([0, chinB + 14 * bS, 28 * bS], [30, 24, 30], 9 * veryOld + 5 * old * Math.max(0, fat)));                           // loose skin under the chin
  for (const sg of [1, -1]) RG.push({ pts: [[X(7) * sg, browY + 1, Zf(92)], [X(29) * sg, browY - 2, Zf(84)], [X(50) * sg, browY + 3, Zf(64)]], w: 6.5, amt: 2.6 + brF, taper: 0 });   // the brow's ridge
  for (const sg of [1, -1]) shells.push({ c: [eyeX * sg, eyeY, eyeZ], r: eR + 1.5 + (W.eye === sg ? -3 : 0), k: 3.5 });

  // ---------------- eyes: the opening between the lids is cut from the head, pixel by pixel
  const lidUp = (5.5 * (1 + 0.14 * g.eyeSize) - 1.5 * old - 0.9 * g.lid + baby * 0.8) * ke * (1 + 0.06 * fem), lidLo = 5.2 * ke * (1 + 0.14 * g.eyeSize);
  const half = 15 * kes * S * lerp(1, 0.94, baby) * (1 + 0.1 * g.eyeSize);
  const eyes = [1, -1].map(sg => ({ c: [eyeX * sg, eyeY, eyeZ], side: sg, r: eR, xi: eyeX - half - 0.5, xo: eyeX + half, yi: eyeY + 1.6, yo: eyeY - 0.8 - 1.4 * g.eyeTilt + 1.2 * old, up: lidUp, lo: lidLo, iris: 5.9 * Math.min(1, ke * 1.16), pupil: 1.9, gaze: [0.10, 0.02, 1], seed: 3, shut: W.eye === sg, blind: W.blind === sg }));
  const headClip = (hx, hy, hz) => {
    if (hz < eyeZ || hy < eyeY - 10 || hy > eyeY + 8) return 1;
    const sg = hx > 0 ? 1 : -1, e = sg > 0 ? eyes[0] : eyes[1]; if (e.shut) return 1;
    const tt = (hx * sg - e.xi) / (e.xo - e.xi); if (tt <= 0 || tt >= 1) return 1;
    const base = lerp(e.yi, e.yo, tt), tu = Math.pow(tt, 0.8), tl = Math.pow(tt, 1.25);
    return hy > base - e.up * 4 * tu * (1 - tu) && hy < base + e.lo * 4 * tl * (1 - tl) ? (sg > 0 ? 2 : 3) : 1;
  };
  const ph = phis(Math.max(0.6, step * 0.55), Math.max(3, step * 2.4)), ys = ysOf(0.4, chinB + 100 * bS, step);
  const headLoft = makeLoft({ axisZ: AZ, ys, ph, prims: P, blobs: B, ridges: RG, shells });

  // ---------------- ears (splatted ellipsoids)
  const prims = [], earS = cr * (1 + 0.13 * old);
  for (const sg of [1, -1]) { const a = 0.5 * sg, Q = [Math.cos(a), 0, Math.sin(a), 0, 1, 0, -Math.sin(a), 0, Math.cos(a)]; prims.push(E([(73 + 3 * (g.ears || 0)) * cr * sg, browY + 33 * earS, -16 * cr], [3.4 * earS, 27 * earS, 16.5 * earS], { k: 0, Q, tag: 4 })); prims.push(E([(74 + 3 * (g.ears || 0)) * cr * sg, browY + 19 * earS, -19 * cr], [3.6 * earS, 15 * earS, 15 * earS], { k: 5, Q, tag: 4 })); prims.push(E([(72.5 + 3 * (g.ears || 0)) * cr * sg, browY + 54 * earS, -9 * cr], [4.2 * earS, 9 * earS, 8 * earS], { k: 4, Q, tag: 4 })); }

  // ---------------- the body: neck, shoulders, chest (group 2 turns with the body)
  const BP = [], BB = [], shY = chinB + (112 - 14 * veryOld) * bS, shW = (198 + 10 * mal - 22 * fem) * bS * (1 - 0.06 * veryOld), BZ = -26 * bS;
  BP.push(EA([0, chinB - 30 * bS, -16 * bS], [0, chinB + 110 * bS, -26 * bS], neckR, { k: 12, cap: 0.3 }));
  for (const sg of [1, -1]) BP.push(EA([30 * bS * sg, chinB + 50 * bS, -36 * bS], [shW * 0.84 * sg, shY + 2 * bS, -38 * bS], (32 + 10 * mal + fat * 6) * bS, { k: 20, cap: 0.2 }));
  BP.push(...[1, -1].map(sg => E([shW * 0.9 * sg, shY + 40 * bS, -34 * bS], [(46 + 10 * mal - 6 * fem + fat * 8) * bS, 78 * bS, (52 + fat * 8) * bS], { k: 18 })));
  BP.push(E([0, shY + 130 * bS, -30 * bS], [(168 + fat * 22 + 8 * mal) * bS, 180 * bS, (100 + fat * 24 + 6 * mal) * bS], { k: 18 }));
  BP.push(E([0, shY + 30 * bS, -22 * bS], [150 * bS, 44 * bS, 80 * bS], { k: 18 }));
  BB.push(mb([0, chinB + 80 * bS, 34 * bS], [17, 14, 18], -6 * lerp(0.4, 1, sx)));                                                                // the pit of the neck
  const bph = phis(Math.max(0.8, step * 0.6), Math.max(1.6, step * 1.0), 110), bys = ysOf(chinB - 28 * bS, shY + 235 * bS, step * 1.3);
  const bodyLoft = makeLoft({ axisZ: BZ, ys: bys, ph: bph, prims: BP, blobs: BB });

  // ---------------- per-pixel work: lines too fine for the mesh, and all the paint
  const br = [], late = [], rnd = rngOf(strHash(o.id || 'x') ^ 0x51ed);
  br.push(...sym(blob([7.0 * nS + brk * 0.4, snY - 0.9 * nS, snZ + 2], [4.2 * nS, 3.0 * nS, 7], -5, { col: [0.02, 0.012, 0.012], a: 1.7 })));             // nostrils
  br.push(stroke([[-mw, stY + 0.6, lipZ + 1], [-mw * 0.5, stY - 0.5, lipZ + 8], [0, stY + 0.7, lipZ + 10], [mw * 0.5, stY - 0.5, lipZ + 8], [mw, stY + 0.6, lipZ + 1]], 1.2, -2.4, { col: [0.05, 0.015, 0.015], a: 0.95 }));
  br.push(stroke([[0, snY + 1, snZ + 2], [0, stY - 9 * lipT, lipZ + 10]], 3.0, -1.2));                                                                    // philtrum
  for (const sg of [1, -1]) {
    br.push(stroke([[50 * sg * bS, chinB - 34 * bS, -22 * bS], [34 * sg * bS, chinB + 30 * bS, 10 * bS], [10 * sg * bS, chinB + 74 * bS, 32 * bS]], 9 * bS, (3.2 + 2 * veryOld + 1.5 * mal) * lerp(0.3, 1, sx), { grp: 0 }));
    br.push(stroke([[12 * sg * bS, chinB + 86 * bS, 38 * bS], [86 * sg * bS, chinB + 94 * bS, 30 * bS], [shW * 0.78 * sg, chinB + 100 * bS, -2 * bS]], 7 * bS, (4.0 - fat * 2.5 + 2 * veryOld) * lerp(0.3, 1, sstep(4, 18, age)), { grp: 2 }));
  }
  const nlab = 0.45 + 0.9 * mid + 1.4 * old + 0.5 * Math.max(0, fat) + baby * 0.3;
  for (const sg of [1, -1]) br.push(stroke([[(alX + 4) * sg, tipY - 3, alZ - 2], [(alX + 9) * sg, lerp(tipY, stY, 0.5), lipZ + 2], [(mw + 6) * sg, stY + 3, lipZ - 6], [(mw + 5) * sg, stY + 11 * old, lipZ - 9]], 2.6, -nlab, { taper: 1 }));
  // age: every line has its place from the start; the years only deepen it
  if (mid > 0.02) {
    const stern = o.stern == null ? 0.6 : o.stern, merry = o.merry == null ? 0.6 : o.merry;
    for (const sg of [1, -1]) {
      for (let k = 0; k < 3; k++) br.push(stroke([[(eyeX + 16.5 * fw) * sg, eyeY - 1 + k * 0.5, eyeZ + 3], [(eyeX + 24 * fw) * sg, eyeY - 5 + k * 5.5, eyeZ - 6]], 0.9, -(0.5 * mid + 0.75 * old) * (0.4 + merry), { taper: 1 }));
      br.push(stroke([[(eyeX - 11) * sg, eyeY + 9, eyeZ + 10], [eyeX * sg, eyeY + 15.5, eyeZ + 11], [(eyeX + 12) * sg, eyeY + 13, eyeZ + 6]], 1.6, -(0.5 * mid + 1.1 * old), { taper: 1 }));
      br.push(stroke([[(mw + 4) * sg, stY + 4, lipZ - 4], [(mw + 6.5) * sg, stY + 16, lipZ - 7], [(mw + 3) * sg, stY + 27, lipZ - 10]], 2.0, -1.5 * old, { taper: 1 }));
      br.push(stroke([[5 * sg, browY - 13, Zf(93) + brF], [4.2 * sg, browY - 1, Zf(94) + brF]], 1.1, -(0.9 * mid + 0.7 * old) * (0.3 + stern), { taper: 1 }));
    }
    for (let k = 0; k < 4; k++) br.push(stroke([[-40 * cr, browY - 16 - k * 9.5 + 2, Zf(84)], [-18 * cr, browY - 19 - k * 9.5, Zf(94)], [8 * cr, browY - 17.5 - k * 9.5, Zf(96)], [38 * cr, browY - 16 - k * 9.5 + 3, Zf(85)]], 1.25, -(0.35 * mid + 0.95 * old) * (k < 3 ? 1 : 0.6), { taper: 1 }));
    if (old > 0.05) {
      for (const sg of [1, -1]) for (let k = 0; k < 4; k++) br.push(stroke([[(2.5 + k * 5) * sg, stY - 8.5 * lipT - 1, lipZ + 9 - k * 1.2], [(2.7 + k * 5.4) * sg, stY - 8.5 * lipT - 9, lipZ + 8 - k * 1.5]], 0.7, -0.8 * veryOld, { taper: 1 }));
      for (const sg of [1, -1]) br.push(stroke([[9 * sg, chinB + 4, 44 * bS], [12 * sg, chinB + 60 * bS, 38 * bS]], 4.5, 3.0 * veryOld, { grp: 0 }));
    }
  }
  if (old > 0.3) for (let k = 0; k < 26 * old; k++) { const a = rnd() * 6.28, rr = 20 + rnd() * 50; br.push(blob([Math.cos(a) * rr, Y(120) + Math.sin(a) * rr * 0.9 - 20, Zf(60)], [2 + rnd() * 3.5, 2 + rnd() * 3, 60], 0, { col: [0.30, 0.17, 0.10], a: 0.35 + rnd() * 0.3, only: MAT.skin })); }
  if (o.freckles) for (let k = 0; k < 170; k++) { const x = (rnd() - 0.5) * 104, y = Y(112) + rnd() * 52 - 8; br.push(blob([x, y, Zf(60)], [0.8 + rnd() * 0.9, 0.8 + rnd() * 0.9, 60], 0, { col: [0.36, 0.17, 0.08], a: 0.5 + rnd() * 0.5, only: MAT.skin })); }
  // colour: one swatch is not skin. Forehead gold, the middle band red with blood, the jaw cooler
  const skin = hexLin(o.skin || '#d9a77f'), mel = 1 - (skin[0] + skin[1] + skin[2]) / 3, red = lerp(0.22, 0.07, mel), SK = MAT.skin;
  br.push(...sym(blob([X(40), Y(141), Zf(64)], [30, 24, 44], 0, { col: [skin[0] * 1.08, skin[1] * (1 - red * 1.1), skin[2] * (1 - red * 1.25)], a: 0.75 - 0.25 * old + baby * 0.3, only: SK })));
  br.push(blob([0, tipY - 6, tipZ - 8], [15, 15, 24], 0, { col: [skin[0] * 1.06, skin[1] * (1 - red), skin[2] * (1 - red * 1.1)], a: 0.6 + 0.3 * old, only: SK }));
  br.push(...[1, -1].map(sg => blob([77 * cr * sg, browY + 33 * earS, -8], [16, 34, 26], 0, { col: [skin[0] * 1.1, skin[1] * (1 - red * 1.2), skin[2] * (1 - red * 1.3)], a: 0.7, only: SK })));
  br.push(...sym(blob([eyeX, eyeY + 2, eyeZ + 12], [20, 13, 22], 0, { col: [skin[0] * 0.80, skin[1] * 0.70, skin[2] * 0.78], a: 0.45 + 0.35 * old, only: SK })));
  if (mal > 0.5 && !o.beard) br.push(blob([0, Y(197), Zf(50)], [X(64), 44 * fh, 66], 0, { col: [skin[0] * 0.72, skin[1] * 0.75, skin[2] * 0.84], a: 0.45 * mal * (o.shadow == null ? 1 : o.shadow), only: SK }));
  const lipC = [skin[0] * lerp(0.92, 0.78, mel), skin[1] * lerp(0.50, 0.48, mel), skin[2] * lerp(0.54, 0.50, mel), 0.6], lipA = 1.7 * (0.72 + 0.28 * fem - 0.2 * old);
  late.push(blob([0, stY - 4.0 * lipT, lipZ + 6], [mw * 0.93, 4.6 * lipT, 15], 0, { col: lipC, a: lipA, only: SK }));
  late.push(blob([0, stY + 4.8 * lipT, lipZ + 4], [mw * 0.78, 5.4 * lipT, 15], 0, { col: lipC, a: lipA, only: SK }));
  const hairC = hexLin(o.hairCol || '#3a2a1c'), gr = clamp((o.grey || 0) * 1.1, 0, 1), browC = [lerp(hairC[0], 0.5, 0.8 * gr), lerp(hairC[1], 0.5, 0.8 * gr), lerp(hairC[2], 0.5, 0.8 * gr), 0.05];
  const bw = (2.5 + 0.9 * mal - 0.5 * fem + g.browW) * lerp(0.55, 1, sstep(1, 14, age)), bDrop = 2.2 * old * (1 + mal * 0.3), arch = 2.5 * fem + 2 * g.browArch, sternK = (o.stern == null ? 0 : o.stern - 0.5) * 3;
  for (const sg of [1, -1]) {
    const pts = [[(eyeX - 14 * fw) * sg, eyeY - 11.5 + bDrop * 0.4 + sternK, eyeZ + 23 + brF], [(eyeX - 3 * fw) * sg, eyeY - 14.5 - arch * 0.5 + bDrop * 0.5, eyeZ + 24 + brF], [(eyeX + 8 * fw) * sg, eyeY - 15.5 - arch + bDrop * 0.8, eyeZ + 19 + brF], [(eyeX + 19 * fw) * sg, eyeY - 11 + bDrop * 1.6, eyeZ + 8 + brF]];
    const bo = { col: browC, a: 1.5, rag: 1.6, seed: 5 };
    if (W.browCut !== sg) late.push(stroke(pts, bw, 0.5, bo));
    else { late.push(stroke([pts[0], pts[1], [lerp(pts[1][0], pts[2][0], 0.4), lerp(pts[1][1], pts[2][1], 0.4), pts[1][2]]], bw, 0.5, bo)); late.push(stroke([[lerp(pts[1][0], pts[2][0], 0.95), lerp(pts[1][1], pts[2][1], 0.95), pts[2][2]], pts[2], pts[3]], bw, 0.5, bo)); }
  }
  // wounds change the form itself
  const scarC = [lerp(skin[0], 0.9, 0.5), lerp(skin[1], 0.62, 0.55), lerp(skin[2], 0.58, 0.55), 0.6], so = { prof: 'scar', col: scarC, a: 1.25, rag: 1.3 };
  if (W.browCut) { const sg = W.browCut; late.push(stroke([[(eyeX + 7) * sg, eyeY - 36, eyeZ + 20], [(eyeX + 3.5) * sg, eyeY - 15, eyeZ + 22 + brF], [(eyeX + 5) * sg, eyeY - 8.5, eyeZ + 14]], 1.5, -1.6, Object.assign({ seed: 9 }, so))); late.push(stroke([[(eyeX + 7.5) * sg, eyeY + 8, eyeZ + 10], [(eyeX + 11) * sg, Y(140), Zf(72)], [(eyeX + 12) * sg, Y(160), Zf(66)]], 1.5, -1.6, Object.assign({ seed: 9 }, so))); }
  if (W.cheekCut) { const sg = W.cheekCut; late.push(stroke([[X(60) * sg, Y(126), Zf(42)], [X(46) * sg, Y(152), Zf(64)], [(mw + 3) * sg, stY - 2, lipZ], [(mw - 6) * sg, stY + 9, lipZ + 5]], 1.8, -2.0, Object.assign({ seed: 12 }, so))); }
  if (W.burn) { const sg = W.burn, c = [X(46) * sg, Y(170), Zf(48)], r = [44, 60, 64];
    late.push(blob(c, r, -1.0, { col: [lerp(skin[0], 0.70, 0.6), lerp(skin[1], 0.34, 0.6), lerp(skin[2], 0.31, 0.6), 0.75], a: 2.4, only: SK }));
    for (let k = 0; k < 50; k++) { const a = rnd() * 6.28, rr = Math.sqrt(rnd()), p = [c[0] + Math.cos(a) * rr * r[0] * 0.85, c[1] + Math.sin(a) * rr * r[1] * 0.85, c[2] + 10], pale = rnd() < 0.5; late.push(blob(p, [3 + rnd() * 7, 3 + rnd() * 8, 60], (rnd() - 0.35) * 1.7, { col: pale ? [0.86, 0.66, 0.60, 0.85] : [0.42, 0.17, 0.14, 0.8], a: 0.55 + rnd() * 0.5, only: SK })); }
    for (let k = 0; k < 7; k++) { const y0 = c[1] - 40 + k * 12 + rnd() * 6; late.push(stroke([[c[0] - 26 * sg + rnd() * 10, y0, c[2] + 14], [c[0] + rnd() * 10, y0 + 8 + rnd() * 10, c[2] + 14], [c[0] + 24 * sg, y0 + 3 + rnd() * 12, c[2]]], 1.6, 1.0, { rag: 2.5, seed: 20 + k, col: [0.9, 0.7, 0.64, 0.85], a: 0.5 })); } }
  if (W.pox) for (let k = 0; k < 110; k++) { const x = (rnd() - 0.5) * 2 * X(58), y = Y(116) + rnd() * 86; late.push(blob([x, y, Zf(60)], [1.4 + rnd() * 1.6, 1.4 + rnd() * 1.6, 70], -0.9 - rnd() * 0.7, { col: [skin[0] * 0.92, skin[1] * 0.80, skin[2] * 0.78], a: 0.5, only: SK })); }
  // the crease of the upper lid, and the lash line: the one place a painter restates an edge in dark
  for (const sg of [1, -1]) late.push(stroke([[(eyeX - half + 2) * sg, eyeY - lidUp - 1.2, eyeZ + 11], [eyeX * sg, eyeY - lidUp - 4.2 + 1.6 * old, eyeZ + 13.6], [(eyeX + half - 1) * sg, eyeY - lidUp + 0.5 + 2.5 * old, eyeZ + 8]], 0.95, -(1.0 + 0.6 * old) * (1 - baby * 0.6), { taper: 1, col: [skin[0] * 0.55, skin[1] * 0.42, skin[2] * 0.40], a: 0.5 }));
  for (const sg of [1, -1]) { const e = sg > 0 ? eyes[0] : eyes[1]; const lash = Array.from({ length: 9 }, (_, k) => { const tt = k / 8, tu = Math.pow(tt, 0.8), tl = Math.pow(tt, 1.25), x = lerp(e.xi, e.xo, tt), y = e.shut ? lerp(e.yi, e.yo, tt) + e.lo * 2.2 * tl * (1 - tl) : lerp(e.yi, e.yo, tt) - e.up * 4 * tu * (1 - tu); return [x * sg, y - 0.25, eyeZ + eR + 1.2 - Math.abs(tt - 0.45) * 7]; }); late.push(stroke(lash, 0.6 + 0.25 * fem, e.shut ? -0.8 : 0, { col: [0.03, 0.02, 0.02, 0.1], a: 1.5 * (0.7 + 0.3 * fem) * (1 - 0.35 * old) })); }

  // ---------------- lofts to draw
  const lofts = [{ grid: bodyLoft, grp: 2, mat: MAT.skin }, { grid: headLoft, grp: 1, mat: MAT.skin, clip: headClip }];
  // hair: a layer over the skull, cut at a hairline that the years move
  if (o.hair && o.hair !== 'none') {
    const thin = o.bald || 0, hl = (o.hairline == null ? 44 : o.hairline) + 12 * thin, long = o.hair === 'long', len = long ? 1 : 0;
    const HL = [[0, hl], [0.5, hl + 5 + 18 * thin], [0.95, hl + 34], [1.28, hl + 72 - 20 * fem], [1.62, hl + 54], [2.1, hl + 112], [3.2, hl + 132]];
    const lineY = phA => { for (let i = 1; i < HL.length; i++) if (phA <= HL[i][0]) return lerp(HL[i - 1][1], HL[i][1], (phA - HL[i - 1][0]) / (HL[i][0] - HL[i - 1][0])); return HL[HL.length - 1][1]; };
    const thick = o.hair === 'crop' ? 3.5 : 9;
    const hairGrid = offsetLoft(headLoft, (phi, y) => { const a = Math.abs(phi), below = y - lineY(a) * cr; return below > 14 && !long ? -60 : thick + (long && a > 1.2 ? clamp((y - 90) * 0.12, 0, 16) : 0) - (a < 1.0 ? clamp((y - 20) * 0.02, 0, 2) : 0); }, AZ);
    const crown = thin > 0.5 ? (hx, hy, hz) => (hy < 34 * cr && hz < 62 && hz > -70 && Math.abs(hx) < 52 ? 0 : 1) : null;
    lofts.push({ grid: hairGrid, grp: 1, mat: MAT.hair, tag: 5, clip: (hx, hy, hz) => { const a = Math.atan2(Math.abs(hx), hz - AZ); let yl = lineY(a) * cr + (Math.sin(hx * 0.9) + Math.sin(hx * 2.3 + 1)) * 1.1; if (long && a > 1.75) yl += 160; if (hy > yl) return 0; return crown ? crown(hx, hy, hz) : 1; } });
  }
  // dress: a layer over the body, cut at a neckline; mail lies over padding and has its own collar
  if (o.dress) {
    const mail = o.dress === 'mail', add = mail ? 9 : 5, yN = chinB + (mail ? 50 : 58) * bS;
    const neck = (lx, lz) => yN + (mail ? 0 : clamp(lz - BZ, -60, 60) * 0.42 * bS + Math.abs(lx) * -0.10);                    // a tunic's neck dips in front
    const g2 = offsetLoft(bodyLoft, (phi, y) => { const yy = yN + (mail ? 0 : Math.cos(phi) * 22 * bS); return add + (mail ? 0 : 4.5 * Math.exp(-Math.pow((y - yy - 7) / 6, 2))); }, BZ);
    lofts.push({ grid: g2, grp: 2, mat: mail ? MAT.mail : MAT.cloth, clip: (lx, ly, lz) => (ly > neck(lx, lz) ? 1 : 0) });
    if (!mail && o.shirt !== false) { const g3 = offsetLoft(bodyLoft, 2.2, BZ); lofts.push({ grid: g3, grp: 2, mat: MAT.cloth, tag: 6, clip: (lx, ly, lz) => (ly > neck(lx, lz) - 9 * bS ? 1 : 0) }); }
    if (mail && o.coif) { const cg = offsetLoft(headLoft, 7, AZ); lofts.push({ grid: cg, grp: 1, mat: MAT.mail, clip: (hx, hy, hz) => { const q = Math.pow(hx / (X(57)), 2) + Math.pow((hy - (eyeY + 24 * fh)) / (76 * fh), 2); return hz > 10 && q < 1 ? 0 : 1; } }); }
  }
  return { groups: groupsFor(o.yaw == null ? -0.44 : o.yaw, o.pitch || 0, o.bodyYaw == null ? (o.yaw == null ? -0.62 : o.yaw * 1.4) : o.bodyYaw, o.roll || 0), lofts, prims, brushes: br, eyes, late,
    cols: { 1: skin, 3: hairC, 4: hexLin(o.cloth || '#6b4a3a'), 5: hexLin('#8d9099'), 6: hexLin('#b9bcc4'), 7: hexLin('#5a3b24'), 8: hexLin('#7a6248'), sclera: [0.80, 0.76, 0.70], iris: hexLin(o.eye || '#5b4a32'), shirt: hexLin('#d8d0bc') },
    rough: 1 + 1.2 * old, grey: o.grey || 0, weave: o.weave || 1.6, ring: o.ring || 7, meta: { browY, eyeY, chinB, shY, bS, cr, headH: chinB, step, verts: headLoft.nu * headLoft.nv + bodyLoft.nu * bodyLoft.nv } };
}
