// C8a realism prototype (throwaway): the head as measurements in millimetres.
// buildHead({ sex, age, g: genes -1..1, fat, wounds, hair, dress, yaw }) -> a model for relief.mjs
import { E, EA, symE, blob, stroke, sym, mirB, MAT, hexLin, groupsFor, lerp, clamp, sstep, rngOf, strHash } from './relief.mjs';

// growth: [age, cranium, face height, face width, nose, eye ball, eye spacing, jaw forward (mm), baby fat]
const GROW = [
  [0,  0.63, 0.50, 0.58, 0.42, 0.72, 0.64, -7, 1.0],
  [1,  0.82, 0.62, 0.70, 0.50, 0.86, 0.72, -6, 1.0],
  [3,  0.89, 0.70, 0.77, 0.58, 0.93, 0.78, -5, 0.8],
  [6,  0.92, 0.79, 0.83, 0.68, 0.95, 0.83, -4, 0.5],
  [10, 0.95, 0.86, 0.88, 0.77, 0.97, 0.89, -3, 0.25],
  [14, 0.975, 0.93, 0.94, 0.89, 0.985, 0.95, -1.5, 0.1],
  [18, 1, 1, 1, 1, 1, 1, 0, 0],
  [120, 1, 1, 1, 1, 1, 1, 0, 0],
];
const grow = age => { for (let i = 1; i < GROW.length; i++) if (age <= GROW[i][0]) { const a = GROW[i - 1], b = GROW[i], t = (age - a[0]) / (b[0] - a[0]); return a.map((v, k) => lerp(v, b[k], t)); } return GROW[GROW.length - 1]; };

export function buildHead(o = {}) {
  const g = Object.assign({ jawW: 0, jawSq: 0, chin: 0, cheek: 0, brow: 0, noseLen: 0, noseBridge: 0, noseTip: 0, noseW: 0, eyeSize: 0, eyeGap: 0, lips: 0, mouthW: 0, faceLen: 0, lid: 0 }, o.g || {});
  const age = o.age == null ? 30 : o.age, F = o.sex === 'F', W = o.wounds || {};
  const [, kc, kfh, kfw, kn, ke, kes, jawF, baby] = grow(age);
  const sx = age < 12 ? 0 : sstep(12, 19, age);                         // how far the sexes have parted
  const fem = F ? sx : 0, mal = F ? 0 : sx;
  const old = sstep(42, 78, age), mid = sstep(28, 50, age), veryOld = sstep(66, 88, age);
  const fat = (o.fat || 0) + baby * 0.9;                                // -1 gaunt .. +1 heavy
  const S = (F ? lerp(1, 0.945, sx) : 1);                               // a woman's head is a little smaller all round

  // ---- the frame of the head. y runs down from the top of the skull.
  const cr = kc * S;                                                    // cranium
  const browY = 98 * cr;                                                // the brow line: the vault above it grows early
  const fh = kfh * S * (1 + 0.09 * g.faceLen), fw = kfw * S;
  const Y = y => browY + (y - 98) * fh;                                 // a face height below the brow
  const X = x => x * fw;
  const Zf = z => z * lerp(cr, fw, 0.5);                                // depth of the face

  const prims = [], br = [], late = [];
  // cranium and forehead
  prims.push(E([0, 92 * cr, -5 * cr], [76 * cr, 92 * cr, 100 * cr], { k: 0 }));
  prims.push(E([0, 70 * cr, Zf(40)], [60 * cr, 44 * cr, 54 * cr + baby * 3], { k: 10 }));
  // the mask of the face, the tooth cylinder, the chin and the jaw
  const jawHalf = (54 + 8 * g.jawW - 5 * fem + 3 * mal - 54) + 54;      // gonion half-width, adult
  prims.push(E([0, Y(150), Zf(30)], [X(63 + 3 * g.jawW + 3 * g.cheek) + fat * 4, 80 * fh, Zf(66)], { k: 12 }));
  prims.push(E([0, Y(172), Zf(60) + jawF * 0.5], [X(30), 27 * fh, Zf(37)], { k: 14 }));
  const chinZ = Zf(76) + jawF + 4.5 * g.chin - 2.5 * fem + 1.5 * mal, chinY = Y(208) + 3 * g.chin;
  prims.push(E([0, chinY, chinZ], [X(21 + 3 * g.jawSq - 4 * fem + 2 * mal), 16 * fh + 2 * g.chin, 18 * fw], { k: 12 }));
  const go = [X(jawHalf), Y(195 + 4 * g.jawSq), Zf(5)], cs = [X(15 + 4 * g.jawSq), chinY + 9 * fh, chinZ - 6];
  for (const sgn of [1, -1]) prims.push(EA([go[0] * sgn, go[1], go[2]], [cs[0] * sgn, cs[1], cs[2]], (13 + 2 * mal - 2 * fem + 2 * g.jawSq) * fw, { k: 14, cap: 0.2 }));
  for (const sgn of [1, -1]) prims.push(EA([go[0] * sgn * 1.0, go[1] - 4, go[2] + 2], [X(66) * sgn, Y(128), Zf(6)], 12 * fw, { k: 14, cap: 0.1 })); // the ramus, up to the ear
  // cheekbones
  prims.push(...symE([X(51 + 4.5 * g.cheek), Y(131 - 2 * g.cheek), Zf(50 + 3 * g.cheek)], [21 * fw, 15 * fh, 24 * fw], { k: 14 }));
  // brow ridge and glabella
  const brF = 3 * g.brow + 2.2 * mal - 1.8 * fem - baby * 3;
  prims.push(...symE([X(30), browY + 1, Zf(77) + brF], [27 * fw, 8 * cr, 14 * cr], { k: 9 }));
  prims.push(E([0, browY + 2, Zf(85) + brF], [13 * fw, 9 * cr, 10 * cr], { k: 9 }));
  // the nose: a chain down the bridge, a tip, two wings
  const nl = kn / kfh * (1 + 0.12 * g.noseLen + 0.04 * mal - 0.05 * fem + 0.06 * old);   // length against the face
  const nScale = lerp(fw, 1, 0.3) * (kn / Math.max(kfw, 0.5)) * 0.92 + 0.08;
  const nz0 = Zf(85) - baby * 4, tipY = Y(108) + 42 * fh * nl + 2.5 * g.noseTip + 2.5 * veryOld, tipZ = nz0 + (22 + 3 * g.noseBridge * 0.3) * nScale * (1 + 0.1 * mal - 0.08 * fem) - baby * 3;
  const brk = W.nose || 0;                                              // a broken nose: the bridge sets to one side, with a knot
  const dors = [[0, Y(113), nz0, 7.5], [brk * 4.5, lerp(Y(113), tipY, 0.33), lerp(nz0, tipZ, 0.33) + 3.6 * g.noseBridge + brk * 1.5, 8], [brk * 3.2, lerp(Y(113), tipY, 0.66), lerp(nz0, tipZ, 0.68) + 2.2 * g.noseBridge - brk * 1.2, 9], [brk * 0.6, tipY - 5 * nScale, tipZ - 4 * nScale, 10]];
  for (const [x, y, z, r] of dors) prims.push(E([x, y, z - r * nScale], [r * nScale * (0.9 + 0.12 * g.noseW), r * nScale * 1.25, r * nScale], { k: 7 }));
  prims.push(E([brk * 0.4, tipY, tipZ - 10.5 * nScale], [10.5 * nScale * (1 + 0.14 * g.noseW), 9.5 * nScale, 10.5 * nScale], { k: 6 }));
  const alX = (13 + 3.5 * g.noseW + 1.2 * mal - 1 * fem + 1.5 * old) * nScale;
  prims.push(...symE([alX, tipY + 2.5 * nScale, tipZ - 24 * nScale], [8.2 * nScale, 7.2 * nScale, 9.5 * nScale], { k: 5 }));
  const snY = tipY + 8.5 * nScale, snZ = tipZ - 20 * nScale;
  prims.push(E([0, snY - 2.5 * nScale, snZ - 2], [6.5 * nScale, 4.5 * nScale, 9 * nScale], { k: 5 }));
  // lips
  const lipT = (1 + 0.42 * g.lips + 0.12 * fem - 0.08 * mal - 0.28 * old + baby * 0.1), mw = (26 + 4 * g.mouthW) * fw;
  const stY = Math.max(snY + 15 * fh, Y(181)), lipZ = Zf(89) + jawF * 0.6;
  prims.push(E([0, stY - 4.6 * lipT, lipZ], [mw * 0.92, 6.4 * lipT, 11 * fw], { k: 6, tag: 3 }));
  prims.push(E([0, stY + 5.4 * lipT, lipZ - 2], [mw * 0.8, 7.2 * lipT, 10.5 * fw], { k: 6, tag: 3 }));
  // ears
  const earS = cr * (1 + 0.13 * old);
  for (const sgn of [1, -1]) prims.push(E([77 * cr * sgn, browY + 33 * earS, -12 * cr], [6.5 * earS, 31 * earS, 18 * earS], { k: 5, Q: [Math.cos(0.42 * sgn), 0, Math.sin(0.42 * sgn), 0, 1, 0, -Math.sin(0.42 * sgn), 0, Math.cos(0.42 * sgn)], tag: 4 }));

  // ---- neck and shoulders (group 2 turns with the body)
  const bS = S * lerp(0.45, 1, sstep(0, 18, age)) ;                     // the body's scale against the grown head (bust view only)
  const neckR = (56 + 6 * mal - 6 * fem + fat * 6 - 8 * veryOld) * lerp(0.62, 1, sstep(0, 18, age)) * S;
  const chinB = Y(225) , nk0 = [0, Y(170), -12 * cr], nk1 = [0, chinB + 100 * bS, -24 * bS];
  prims.push(EA(nk0, nk1, neckR, { grp: 2, k: 10, cap: 0.3 }));
  const shY = chinB + (118 - 14 * veryOld) * bS, shW = (200 + 8 * mal - 22 * fem) * bS * (1 - 0.06 * veryOld);
  for (const sgn of [1, -1]) prims.push(EA([34 * bS * sgn, chinB + 52 * bS, -30 * bS], [shW * 0.86 * sgn, shY - 6 * bS, -32 * bS], (40 + 8 * mal) * bS, { grp: 2, k: 22, cap: 0.2 }));   // trapezius
  prims.push(...[1, -1].map(sgn => E([shW * 0.93 * sgn, shY + 26 * bS, -30 * bS], [(60 + 8 * mal - 6 * fem) * bS, 64 * bS, 62 * bS], { grp: 2, k: 24 })));
  prims.push(E([0, shY + 92 * bS, -22 * bS], [(172 + fat * 14) * bS, 128 * bS, (112 + fat * 16) * bS], { grp: 2, k: 26 }));
  prims.push(E([0, shY + 8 * bS, 8 * bS], [150 * bS, 52 * bS, 82 * bS], { grp: 2, k: 26 }));

  // ---- sculpt brushes (head space)
  const eyeX = 31.5 * kes * S + 3 * g.eyeGap, eyeY = browY + 14 * lerp(cr, fh, 0.5), eR = 12.2 * ke, eyeZ = Zf(73) - baby * 2;
  const sock = 1 + 0.25 * old;
  br.push(...sym(blob([eyeX, eyeY - 1, eyeZ + 20], [25 * fw, 15.5 * cr, 22], -12.5 * sock * lerp(0.6, 1, 1 - baby))));          // the socket
  br.push(...sym(blob([eyeX - 12 * fw, eyeY + 3, eyeZ + 14], [9, 10, 12], -3.5)));                                              // the inner corner sits deep
  br.push(blob([0, Y(108), Zf(92)], [10, 8, 10], -2.5 - 1.5 * mal + baby));                                                     // root of the nose
  br.push(...sym(blob([X(62), browY - 6, Zf(50)], [24, 26, 26], -3.5 - 3.5 * old + fat * 2)));                                  // temples
  br.push(...sym(blob([X(47), Y(166), Zf(56)], [19, 28, 24], -3.2 - 3.5 * old * (1 - clamp(fat, 0, 1)) + fat * 6)));            // under the cheekbone: hollow, or full
  br.push(blob([0, lerp(stY, chinY, 0.55), chinZ + 12], [15 * fw, 6.5 * fh, 10], -3.6 + baby * 2));                             // the fold above the chin
  br.push(...sym(blob([7.2 * nScale + brk * 0.4, snY - 0.6 * nScale, snZ + 3.5], [4.4 * nScale, 3.2 * nScale, 6], -6, { col: [0.02, 0.012, 0.012], a: 1.6 })));  // nostrils
  br.push(...sym(blob([mw + 1, stY + 0.3, lipZ - 3], [6.5, 6, 9], -3.2)));                                                      // corners of the mouth
  br.push(stroke([[-mw, stY + 0.5, lipZ + 2], [-mw * 0.5, stY - 0.4, lipZ + 9], [0, stY + 0.6, lipZ + 11], [mw * 0.5, stY - 0.4, lipZ + 9], [mw, stY + 0.5, lipZ + 2]], 1.25, -2.6, { col: [0.05, 0.015, 0.015], a: 0.9 }));   // the parting of the lips
  br.push(stroke([[0, snY + 1, snZ + 4], [0, stY - 9 * lipT, lipZ + 11]], 3.2, -1.3));                                           // philtrum
  if (baby > 0.05) br.push(...sym(blob([X(40), Y(168), Zf(62)], [26, 26, 24], 9 * baby)));                                      // a baby's cheeks
  if (mal > 0.3) br.push(blob([0, chinB + 38 * bS, 36 * bS], [11, 13, 12], 5 * mal, { grp: 2 }));                              // Adam's apple
  br.push(blob([0, chinB + 78 * bS, 36 * bS], [17, 14, 16], -7 * lerp(0.4, 1, sx + 0.3 * (age > 12 ? 1 : 0)), { grp: 2 }));     // the pit of the neck
  for (const sgn of [1, -1]) {
    br.push(stroke([[52 * sgn * bS, chinB - 30 * bS, -20 * bS], [34 * sgn * bS, chinB + 30 * bS, 12 * bS], [10 * sgn * bS, chinB + 72 * bS, 34 * bS]], 9 * bS, (3.5 + 2 * veryOld + 1.5 * mal) * lerp(0.3, 1, sx), { grp: 2 }));  // the long neck muscle
    br.push(stroke([[12 * sgn * bS, chinB + 84 * bS, 40 * bS], [90 * sgn * bS, chinB + 92 * bS, 30 * bS], [shW * 0.8 * sgn, chinB + 96 * bS, -4 * bS]], 7 * bS, (4.2 - fat * 2.5 + 2 * veryOld) * lerp(0.3, 1, sstep(4, 18, age)), { grp: 2 }));  // collarbone
  }
  // the fold from nose to mouth: there from childhood as a soft turn, cut deeper by years and weight
  const nlab = 0.5 + 1.0 * mid + 1.4 * old + 0.5 * Math.max(0, fat);
  for (const sgn of [1, -1]) br.push(stroke([[(alX + 4) * sgn, tipY - 2, tipZ - 22 * nScale], [(alX + 9) * sgn, lerp(tipY, stY, 0.5), lipZ + 3], [(mw + 6) * sgn, stY + 3, lipZ - 5], [(mw + 5) * sgn, stY + 11 * old, lipZ - 8]], 2.6, -nlab, { taper: 1 }));
  // ---- age: every line has its place from the start; the years only deepen it
  if (mid > 0.02) {
    for (const sgn of [1, -1]) {
      for (let k = 0; k < 3; k++) br.push(stroke([[(eyeX + 16.5 * fw) * sgn, eyeY - 1 + k * 0.5, eyeZ + 3], [(eyeX + 24 * fw) * sgn, eyeY - 5 + k * 5.5, eyeZ - 6]], 0.9, -(0.5 * mid + 0.7 * old), { taper: 1 }));  // crow's feet
      br.push(blob([eyeX * sgn, eyeY + 12, eyeZ + 12], [13, 6.5, 9], 1.6 * old + 0.5 * mid));                                   // the bag under the eye
      br.push(stroke([[(eyeX - 11) * sgn, eyeY + 9, eyeZ + 10], [eyeX * sgn, eyeY + 15.5, eyeZ + 11], [(eyeX + 12) * sgn, eyeY + 13, eyeZ + 6]], 1.6, -(0.5 * mid + 1.1 * old), { taper: 1 }));
      br.push(stroke([[(mw + 4) * sgn, stY + 4, lipZ - 4], [(mw + 6.5) * sgn, stY + 16, lipZ - 7], [(mw + 3) * sgn, stY + 27, lipZ - 10]], 2.0, -1.5 * old, { taper: 1 }));   // from the mouth's corner down
      br.push(blob([X(36) * sgn, chinY + 2, chinZ - 22], [15, 13, 15], 5.5 * old * (0.6 + 0.6 * Math.max(0, fat + 0.3))));     // jowl
      br.push(stroke([[5 * sgn, browY - 13, Zf(93) + brF], [4.2 * sgn, browY - 1, Zf(94) + brF]], 1.1, -(0.9 * mid + 0.6 * old) * (o.stern == null ? 0.6 : o.stern), { taper: 1 })); // between the brows
    }
    for (let k = 0; k < 4; k++) br.push(stroke([[-40 * cr, browY - 16 - k * 9.5 + 2, Zf(84)], [-18 * cr, browY - 19 - k * 9.5, Zf(94)], [8 * cr, browY - 17.5 - k * 9.5, Zf(96)], [38 * cr, browY - 16 - k * 9.5 + 3, Zf(85)]], 1.25, -(0.35 * mid + 0.95 * old) * (k < 3 ? 1 : 0.6), { taper: 1 }));   // forehead
    if (old > 0.05) {
      for (const sgn of [1, -1]) for (let k = 0; k < 5; k++) br.push(stroke([[(k * 4.6 - 9) * 1, stY - 8.5 * lipT - 1, lipZ + 9 - Math.abs(k - 2) * 1.2], [(k * 4.9 - 9.8) * 1, stY - 8.5 * lipT - 9, lipZ + 8 - Math.abs(k - 2) * 1.5]].map(p => [p[0] * sgn + 0, p[1], p[2]]), 0.7, -0.75 * veryOld, { taper: 1 }));  // lines above the lip
      br.push(blob([0, chinB + 16 * bS, 30 * bS], [30, 24, 26], 9 * veryOld + 5 * old * Math.max(0, fat), { grp: 2 }));          // loose skin under the chin
      for (const sgn of [1, -1]) br.push(stroke([[9 * sgn, chinB + 4, 46 * bS], [12 * sgn, chinB + 60 * bS, 40 * bS]], 4.5, 3.2 * veryOld, { grp: 2 }));   // cords of the old neck
    }
  }
  // freckles and age spots are paint only
  const rnd = rngOf(strHash(o.id || 'x') ^ 0x51ed);
  if (old > 0.3) for (let k = 0; k < 26 * old; k++) { const a = rnd() * 6.28, rr = 20 + rnd() * 50; br.push(blob([Math.cos(a) * rr, Y(120) + Math.sin(a) * rr * 0.9 - 20, Zf(60)], [2 + rnd() * 3.5, 2 + rnd() * 3, 60], 0, { col: [0.30, 0.17, 0.10], a: 0.35 + rnd() * 0.3 })); }
  if (o.freckles) for (let k = 0; k < 150; k++) { const x = (rnd() - 0.5) * 100, y = Y(112) + rnd() * 50 - 8; br.push(blob([x, y, Zf(60)], [0.9 + rnd() * 0.9, 0.9 + rnd() * 0.9, 60], 0, { col: [0.36, 0.17, 0.08], a: 0.5 + rnd() * 0.5 })); }

  // ---- colour: one swatch is not skin. Forehead gold, the middle band red with blood, the jaw cooler (and blue-grey where a beard is shaved)
  const skin = hexLin(o.skin || '#d9a77f'), mel = 1 - (skin[0] + skin[1] + skin[2]) / 3;
  const red = lerp(0.20, 0.07, mel);
  br.push(...sym(blob([X(40), Y(140), Zf(64)], [30, 24, 40], 0, { col: [skin[0] * 1.08, skin[1] * (1 - red * 1.1), skin[2] * (1 - red * 1.25)], a: 0.75 - 0.25 * old + baby * 0.3 })));
  br.push(blob([0, tipY - 6, tipZ - 8], [15, 15, 22], 0, { col: [skin[0] * 1.06, skin[1] * (1 - red), skin[2] * (1 - red * 1.1)], a: 0.6 + 0.3 * old }));
  br.push(...[1, -1].map(sgn => blob([77 * cr * sgn, browY + 33 * earS, -8], [16, 34, 26], 0, { col: [skin[0] * 1.1, skin[1] * (1 - red * 1.2), skin[2] * (1 - red * 1.3)], a: 0.7 })));
  br.push(...sym(blob([eyeX, eyeY + 2, eyeZ + 12], [20, 13, 20], 0, { col: [skin[0] * 0.80, skin[1] * 0.70, skin[2] * 0.78], a: 0.45 + 0.35 * old })));   // thin skin round the eye
  if (mal > 0.5 && !o.beard) br.push(blob([0, Y(196), Zf(52)], [X(64), 44 * fh, 62], 0, { col: [skin[0] * 0.74, skin[1] * 0.76, skin[2] * 0.84], a: 0.42 * mal }));   // a shaved beard's shadow
  // lips are painted by place, the brows as hair
  const lipC = [skin[0] * lerp(0.92, 0.78, mel) , skin[1] * lerp(0.52, 0.5, mel), skin[2] * lerp(0.56, 0.52, mel), 0.6];
  late.push(blob([0, stY - 4.2 * lipT, lipZ + 6], [mw * 0.95, 5.0 * lipT, 14], 0, { col: lipC, a: 1.7 * (0.75 + 0.25 * fem - 0.2 * old) }));
  late.push(blob([0, stY + 5.0 * lipT, lipZ + 5], [mw * 0.8, 5.6 * lipT, 14], 0, { col: lipC, a: 1.7 * (0.75 + 0.25 * fem - 0.2 * old) }));
  const hairC = hexLin(o.hairCol || '#3a2a1c'), browC = [lerp(hairC[0], 0.5, 0.75 * veryOld), lerp(hairC[1], 0.5, 0.75 * veryOld), lerp(hairC[2], 0.5, 0.75 * veryOld), 0.05];
  const bw = (2.6 + 0.9 * mal - 0.5 * fem + (g.browW || 0)) * lerp(0.6, 1, sstep(1, 14, age)), bDrop = 2.2 * old * (1 + mal * 0.3), arch = 2.5 * fem + 2 * (g.browArch || 0);
  for (const sgn of [1, -1]) {
    const gap = W.browCut === sgn;                                      // a cut through the brow: no hair grows in a scar
    const pts = [[(eyeX - 14 * fw) * sgn, eyeY - 11.5 + bDrop * 0.4 + (o.stern || 0) * 2, eyeZ + 22 + brF], [(eyeX - 3 * fw) * sgn, eyeY - 14.5 - arch * 0.5 + bDrop * 0.5, eyeZ + 23 + brF], [(eyeX + 8 * fw) * sgn, eyeY - 15.5 - arch + bDrop * 0.8, eyeZ + 19 + brF], [(eyeX + 19 * fw) * sgn, eyeY - 11 + bDrop * 1.6, eyeZ + 9 + brF]];
    if (!gap) late.push(stroke(pts, bw, 0.6, { col: browC, a: 1.5, taper: 0, rag: 1.6, seed: 5 }));
    else { late.push(stroke(pts.slice(0, 2).concat([[lerp(pts[1][0], pts[2][0], 0.45), lerp(pts[1][1], pts[2][1], 0.45), pts[1][2]]]), bw, 0.6, { col: browC, a: 1.5, rag: 1.6, seed: 5 })); late.push(stroke([[lerp(pts[1][0], pts[2][0], 0.9), lerp(pts[1][1], pts[2][1], 0.9), pts[2][2]], pts[2], pts[3]], bw, 0.6, { col: browC, a: 1.5, rag: 1.6, seed: 5 })); }
  }

  // ---- wounds change the form itself
  const scarC = [lerp(skin[0], 0.9, 0.5), lerp(skin[1], 0.62, 0.55), lerp(skin[2], 0.58, 0.55), 0.55];
  if (W.browCut) { const sgn = W.browCut; late.push(stroke([[(eyeX + 6) * sgn, eyeY - 34, eyeZ + 20], [(eyeX + 3.5) * sgn, eyeY - 15, eyeZ + 21 + brF], [(eyeX + 5) * sgn, eyeY - 9, eyeZ + 14]], 1.5, -1.5, { prof: 'scar', col: scarC, a: 1.2, rag: 1.2, seed: 9 })); late.push(stroke([[(eyeX + 7.5) * sgn, eyeY + 9, eyeZ + 10], [(eyeX + 11) * sgn, Y(140), Zf(72)], [(eyeX + 12) * sgn, Y(158), Zf(66)]], 1.5, -1.5, { prof: 'scar', col: scarC, a: 1.2, rag: 1.2, seed: 9, taper: 0 })); }
  if (W.cheekCut) { const sgn = W.cheekCut; late.push(stroke([[X(58) * sgn, Y(128), Zf(46)], [X(44) * sgn, Y(152), Zf(66)], [(mw + 3) * sgn, stY - 2, lipZ], [(mw - 6) * sgn, stY + 9, lipZ + 5]], 1.7, -1.9, { prof: 'scar', col: scarC, a: 1.25, rag: 1.5, seed: 12 })); }
  if (W.burn) { const sgn = W.burn; const c = [X(44) * sgn, Y(168), Zf(50)]; const r = [44, 58, 60];
    late.push(blob(c, r, -1.2, { col: [lerp(skin[0], 0.72, 0.6), lerp(skin[1], 0.36, 0.6), lerp(skin[2], 0.33, 0.6), 0.7], a: 2.4 }));
    for (let k = 0; k < 46; k++) { const a = rnd() * 6.28, rr = Math.sqrt(rnd()), p = [c[0] + Math.cos(a) * rr * r[0] * 0.85, c[1] + Math.sin(a) * rr * r[1] * 0.85, c[2] + 10]; const pale = rnd() < 0.5;
      late.push(blob(p, [3 + rnd() * 7, 3 + rnd() * 8, 60], (rnd() - 0.35) * 1.8, { col: pale ? [0.86, 0.66, 0.60, 0.8] : [0.42, 0.17, 0.14, 0.75], a: 0.55 + rnd() * 0.5 })); }
    for (let k = 0; k < 7; k++) { const y0 = c[1] - 40 + k * 12 + rnd() * 6; late.push(stroke([[c[0] - 26 * sgn + rnd() * 10, y0, c[2] + 14], [c[0] + rnd() * 10, y0 + 8 + rnd() * 10, c[2] + 14], [c[0] + 24 * sgn, y0 + 3 + rnd() * 12, c[2]]], 1.6, 1.1, { rag: 2.5, seed: 20 + k, col: [0.9, 0.7, 0.64, 0.8], a: 0.5 })); } }
  if (W.pox) for (let k = 0; k < 90; k++) { const x = (rnd() - 0.5) * 2 * X(58), y = Y(118) + rnd() * 84; late.push(blob([x, y, Zf(60)], [1.5 + rnd() * 1.6, 1.5 + rnd() * 1.6, 70], -0.9 - rnd() * 0.7, { col: [skin[0] * 0.92, skin[1] * 0.80, skin[2] * 0.78], a: 0.5 })); }
  if (W.dent) { const sgn = W.dent; late.push(blob([X(52) * sgn, Y(132), Zf(58)], [20, 15, 30], -7)); }                           // a cheekbone stove in

  // ---- eyes
  const eyes = [];
  const lidUp = (6.4 * (1 + 0.14 * g.eyeSize) - 1.5 * old - 0.9 * g.lid + baby * 0.8) * ke * (1 + 0.06 * fem), lidLo = 4.1 * ke * (1 + 0.14 * g.eyeSize);
  const half = 15 * kes * S * lerp(1, 0.94, baby) * (1 + 0.1 * g.eyeSize);
  for (const sgn of [1, -1]) eyes.push({ c: [eyeX * sgn, eyeY, eyeZ], side: sgn, r: eR, lid: 1.5, xi: eyeX - half - 0.5, xo: eyeX + half, yi: eyeY + 1.6, yo: eyeY - 0.8 - 1.2 * (g.eyeTilt || 0) + 1.2 * old, up: lidUp, lo: lidLo, iris: 5.9 * Math.min(1, ke * 1.16), pupil: 1.9, gaze: [0.10, 0.02, 1], seed: 3, shut: W.eye === sgn });
  if (W.eye) { const sgn = W.eye; br.push(blob([eyeX * sgn, eyeY, eyeZ + 16], [17, 12, 16], -7.5)); }     // the lids fall in over an empty socket
  // the crease of the upper lid, and its hooding with age
  for (const sgn of [1, -1]) late.push(stroke([[(eyeX - half + 2) * sgn, eyeY - lidUp - 1.2, eyeZ + 11], [eyeX * sgn, eyeY - lidUp - 4.2 + 1.6 * old, eyeZ + 13.6], [(eyeX + half - 1) * sgn, eyeY - lidUp + 0.5 + 2.5 * old, eyeZ + 8]], 0.95, -(1.1 + 0.6 * old) * (1 - baby * 0.6), { taper: 1, col: [skin[0] * 0.55, skin[1] * 0.42, skin[2] * 0.40], a: 0.5 }));
  // lash line: the one place a painter restates an edge in dark
  for (const sgn of [1, -1]) if (W.eye !== sgn) late.push(stroke(Array.from({ length: 7 }, (_, k) => { const tt = k / 6, tu = Math.pow(tt, 0.8), x = lerp(eyeX - half - 0.5, eyeX + half, tt), y = lerp(eyeY + 1.6, eyeY - 0.8 + 1.2 * old, tt) - lidUp * 4 * tu * (1 - tu); return [x * sgn, y - 0.2, eyeZ + 13.2 - Math.abs(tt - 0.45) * 7]; }), 0.62 + 0.25 * fem, 0, { col: [0.03, 0.02, 0.02, 0.1], a: 1.5 * (0.7 + 0.3 * fem) * (1 - 0.4 * old), taper: 0 }));

  // ---- hair, as a mass that takes light (strands are noise along its flow)
  if (o.hair && o.hair !== 'none') {
    const thin = o.bald || 0, hl = (o.hairline == null ? 44 : o.hairline) + 10 * thin;
    const HL = [[0, hl], [0.55, hl + 4 + 14 * thin], [0.95, hl + 34], [1.3, hl + 70], [1.62, hl + 56], [2.15, hl + 112], [3.2, hl + 132]];
    const line = (hx, hy, hz) => { const ph = Math.atan2(Math.abs(hx), hz + 8); let yl = HL[HL.length - 1][1]; for (let i = 1; i < HL.length; i++) if (ph <= HL[i][0]) { yl = lerp(HL[i - 1][1], HL[i][1], (ph - HL[i - 1][0]) / (HL[i][0] - HL[i - 1][0])); break; } return hy < yl * cr + (Math.sin(hx * 0.9) + Math.sin(hx * 2.3 + 1)) * 1.2; };
    const hp = [E([0, 88 * cr, -9 * cr], [80 * cr, 91 * cr, 103 * cr], { k: 0, mat: MAT.hair, tag: 5, clip: line })];
    if (o.hair === 'long') { hp.push(E([0, 150 * cr, -52 * cr], [84 * cr, 150 * cr, 62 * cr], { k: 18, mat: MAT.hair })); hp.push(...symE([70 * cr, 190, -20], [26, 110, 44], { k: 18, mat: MAT.hair })); }
    prims.push(...hp);
    // the hairline is cut afterwards (see cutHair)
  }
  const model = { groups: groupsFor(o.yaw == null ? -0.44 : o.yaw, o.pitch || 0, o.bodyYaw == null ? -0.62 : o.bodyYaw, o.roll || 0), prims, brushes: br, eyes, late,
    cols: { 1: skin, 3: hexLin(o.hairCol || '#3a2a1c'), 4: hexLin(o.cloth || '#6b5a3e'), 5: hexLin('#8d9099'), 6: hexLin('#b9bcc4'), 7: hexLin('#5a3b24'), 8: hexLin('#7a6248'), sclera: [0.80, 0.76, 0.70], iris: hexLin(o.eye || '#5b4a32') },
    rough: 1 + 1.2 * old, grey: o.grey || 0, meta: { browY, eyeY, eyeX, chinB, shY, bS, stY, tipY, headH: chinB, cr, hairline: (o.hairline == null ? 46 : o.hairline) * cr } };
  // dress: one layer over the shoulders
  if (o.dress) addDress(model, o, { chinB, shY, shW, bS, neckR });
  return model;
}

function addDress(model, o, m) {
  const { chinB, shY, shW, bS, neckR } = m, mat = o.dress === 'mail' ? MAT.mail : MAT.cloth, P = model.prims, add = 5 * bS + (o.dress === 'mail' ? 6 : 0);
  const k = 20;
  P.push(E([0, shY + 96 * bS, -22 * bS], [(176) * bS + add, 130 * bS, (114) * bS + add], { grp: 2, k, mat }));
  P.push(E([0, shY + 12 * bS, 8 * bS], [152 * bS + add, 50 * bS, 82 * bS + add], { grp: 2, k, mat }));
  for (const sgn of [1, -1]) { P.push(E([shW * 0.93 * sgn, shY + 28 * bS, -30 * bS], [(64) * bS + add, 66 * bS + add, 64 * bS + add], { grp: 2, k, mat })); P.push(EA([40 * bS * sgn, chinB + 66 * bS, -30 * bS], [shW * 0.86 * sgn, shY - 4 * bS, -32 * bS], 42 * bS + add * 0.7, { grp: 2, k, mat, cap: 0.2 })); }
  if (o.dress === 'mail') { // a coif's collar round the neck, and a padded edge under it
    P.push(EA([0, chinB + 20 * bS, -14 * bS], [0, chinB + 96 * bS, -24 * bS], neckR + 9, { grp: 2, k: 8, mat, cap: 0.2 }));
  } else { // the rolled collar of a tunic, and a linen shirt's edge inside it
    for (let a = 0; a < 16; a++) { const t = a / 16 * Math.PI * 2, x = Math.sin(t) * (neckR + 12), z = Math.cos(t) * (neckR + 10) - 22 * bS, y = chinB + 84 * bS + (Math.cos(t) > 0 ? 14 : -6) * Math.abs(Math.cos(t)); P.push(E([x, y, z], [13, 9, 13], { grp: 2, k: 9, mat })); }
  }
}
