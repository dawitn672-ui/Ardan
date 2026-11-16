// Gate 2 · the head. Every feature is set out in HEAD SPACE: millimetres on a grown face seen from the front, u across
// (+ to screen right), v down from the eye line, w toward the viewer. One projection (a turn, a nod, a tilt) carries
// every point to the figure, so a slider moves the true feature and the turned face follows without a second drawing.
import { lerp, clamp, sstep, add, sub, mul, mix, norm, perp, len, rad, spl, splPts, poly, polyline, ell, ellPts, offset, ink, taper, swell, fade, part, along, stream, mixc, n1 } from './g.js';

// the hand-set features: [key, low word, high word, group]. The first 27 keys are the game's face code (src/people/engine/face.js).
export const FACE = [
  ['faceLen', 'short', 'long', 'Face'], ['jawW', 'narrow', 'broad', 'Face'], ['jawShape', 'tapered', 'square', 'Face'], ['chin', 'weak', 'strong', 'Face'],
  ['chinW', 'pointed', 'broad', 'Face'], ['cheekbones', 'flat', 'high', 'Face'], ['cheeks', 'hollow', 'full', 'Face'], ['forehead', 'low', 'high', 'Face'],
  ['foreheadW', 'narrow', 'wide', 'Face'], ['cleft', 'smooth chin', 'cleft chin', 'Face'],
  ['eyeSize', 'small', 'large', 'Eyes'], ['eyeGap', 'close-set', 'wide-set', 'Eyes'], ['eyeTilt', 'drooping', 'lifted', 'Eyes'], ['lids', 'heavy', 'open', 'Eyes'],
  ['eyeDepth', 'deep-set', 'prominent', 'Eyes'], ['irisSize', 'small', 'large', 'Eyes'], ['lashes', 'sparse', 'long', 'Eyes'],
  ['browRidge', 'smooth', 'heavy', 'Brows'], ['browShape', 'straight', 'arched', 'Brows'], ['browWeight', 'fine', 'heavy', 'Brows'], ['browTilt', 'gentle', 'stern', 'Brows'], ['browGap', 'apart', 'close', 'Brows'],
  ['noseLen', 'short', 'long', 'Nose'], ['noseBridge', 'scooped', 'hooked', 'Nose'], ['noseTip', 'upturned', 'drooping', 'Nose'], ['noseW', 'narrow', 'broad', 'Nose'],
  ['tipShape', 'fine', 'bulbous', 'Nose'], ['noseProj', 'flat', 'jutting', 'Nose'],
  ['mouthW', 'small', 'wide', 'Mouth'], ['lips', 'thin', 'full', 'Mouth'], ['lowerLip', 'slight', 'heavy', 'Mouth'], ['upperLip', 'short', 'long', 'Mouth'],
  ['bite', 'overbite', 'underbite', 'Mouth'], ['mouthCurve', 'downturned', 'upturned', 'Mouth'],
  ['earSize', 'small', 'large', 'Ears'], ['earSet', 'flat', 'standing out', 'Ears'], ['earPoint', 'round', 'pointed', 'Ears'], ['lobes', 'attached', 'long', 'Ears'],
];
const tab = (t, x) => { let i = 0; while (i < t.length - 2 && x > t[i + 1][0]) i++; const [a, va] = t[i], [b, vb] = t[i + 1]; return lerp(va, vb, clamp((x - a) / (b - a))); };

// the face's measures, from sex, age, build and the hand-set features
export function headDims(look) {
  const male = look.sex !== 'F', age = look.age ?? 30, g0 = look.g || {}, bd = look.build || {};
  const kid = 1 - sstep(4, 17, age), old = sstep(50, 86, age), wt = bd.weight || 0, mu = bd.muscle || 0;
  const st = lerp(1, .55, kid), g = k => (g0[k] || 0), gs = k => (g0[k] || 0) * st;   // a child's own features are held back
  const B = (M, W, K) => lerp(male ? M : W, K, kid);
  const D = {
    male, age, kid, old, wt,
    crown: B(-113, -112, -118), cran: B(75, 73, 72), zyg: B(67, 64, 62), gon: B(49, 43.5, 45), gonV: B(69, 61, 47), chinW: B(9.5, 6.5, 8.5), chinV: B(106, 96, 74),
    eyeU: B(31.5, 31.5, 29.5), eyeW: B(38, 38.5, 37), eyeH: B(9.4, 13.8, 18.5), irisR: B(7.3, 8.4, 9.4), browV: B(-12.5, -18.5, -23), browT: B(3.9, 3.2, 2.7), browDrop: B(3.2, .6, 0),
    noseV: B(45, 41, 28), noseW: B(15, 12.5, 11), noseP: B(27, 23, 14), mouthV: B(66, 60, 44.5), mouthW: B(22.5, 20, 16), lipU: B(2.8, 4, 3.4), lipL: B(4.4, 6, 4.8),
    earT: B(-12, -11, -6), earB: B(42, 37, 34), hairV: B(-72, -74, -70), lash: B(3.4, 3.9, 2.8), lipTint: B(.3, .95, .55), jawK: B(.45, .8, .95), tilt0: B(.38, .32, 0),
  };
  const fl = 1 + .07 * gs('faceLen');
  D.chinV = D.chinV * fl + 4.5 * gs('chin') + 2 * old; D.noseV = D.noseV * (1 + .045 * gs('faceLen')) + 5 * gs('noseLen') + 3 * old;
  D.mouthV = D.mouthV * (1 + .06 * gs('faceLen')) + 3 * gs('noseLen') + 2.6 * gs('upperLip') + 2 * old; D.gonV = D.gonV * (1 + .05 * gs('faceLen')) + 5 * gs('jawShape');
  D.gon += 7.5 * gs('jawW') + 3 * Math.max(wt, 0) + 2 * gs('jawShape') + 1.5 * mu; D.jawK = clamp(D.jawK - .32 * gs('jawShape'), .25, 1);
  D.chinW = Math.max(4, D.chinW + 5.5 * gs('chinW') + 2 * Math.max(wt, 0)); D.zyg += 3.5 * gs('cheekbones') + 1.5 * Math.max(wt, 0);
  D.cheekB = 4.2 * gs('cheeks') + 5 * wt - 3 * old * (1 - Math.max(wt, 0)) + 2.5 * kid; D.jowl = clamp(old * .7 + Math.max(wt, 0) * .7 - .1, 0, 1.3);
  D.hairV += -8 * g('forehead'); D.templeW = 2.5 * g('foreheadW'); D.cleft = Math.max(0, g('cleft')) * (1 - kid);
  D.eyeW *= 1 + .09 * g('eyeSize'); D.eyeH *= (1 + .1 * g('eyeSize')) * (1 + .3 * g('lids')) * (1 - .2 * old); D.irisR *= 1 + .04 * g('eyeSize') + .08 * g('irisSize');
  D.eyeU += 3.2 * g('eyeGap'); D.tilt = D.tilt0 + g('eyeTilt') - .5 * old; D.depth = -g('eyeDepth') + .5 * old; D.lash *= 1 + .35 * g('lashes');
  D.browV += 2.2 * g('browRidge') + 1.5 * old - 1.2 * g('eyeDepth'); D.arch = g('browShape') + (male ? 0 : .45); D.browT *= 1 + .45 * g('browWeight') + (male ? .25 * old : 0);
  D.browDrop += 2.4 * g('browTilt'); D.browGap = -2.5 * g('browGap'); D.ridge = g('browRidge');
  D.bridge = gs('noseBridge'); D.tipV = 3 * gs('noseTip') + 1.5 * old; D.noseW += 3 * gs('noseW') + 1 * old; D.tipR = 1 + .32 * g('tipShape'); D.noseP *= 1 + .22 * gs('noseProj');
  D.mouthW += 3.5 * g('mouthW'); const lp = (1 + .42 * g('lips')) * (1 - .38 * old); D.lipU *= lp; D.lipL *= lp * (1 + .3 * g('lowerLip')); D.under = g('bite'); D.curve = g('mouthCurve');
  D.earS = 1 + .16 * g('earSize') + .1 * old; D.earOut = 1 + .5 * g('earSet'); D.earPoint = Math.max(0, g('earPoint')); D.lobe = g('lobes') + .5 * old;
  D.nosebreak = 0;
  for (const sc of look.scars || []) if (sc.k === 'nosebreak') D.nosebreak = (sc.side ?? 1) * 1;
  return D;
}

// place the head on the rig and make the projection
export function makeHead(F, look) {
  const D = headDims(look), s = F.Hh / (D.chinV - D.crown);
  const yawD = look.yaw ?? 12, yaw = rad(yawD), pitch = rad((look.pitch ?? 4) - F.stoop * 9), roll = rad((look.roll ?? 0) - F.sway * 2);
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
  const O = [F.headX, -F.H - D.crown * s + F.stoop * F.Hh * .06], pv = D.chinV * .75, w0 = 60;
  const hp = (u, v, w = 0) => { const x = u * cy - w * sy, y = v * cp - (w - w0) * sp - pv; return [O[0] + s * (x * cr - y * sr), O[1] + s * (pv + x * sr + y * cr)]; };
  const relief = v => tab([[-113, -60], [-95, -30], [-75, -9], [-45, -2], [0, 0], [45, 2], [66, 4], [100, 0], [115, -8]], v);
  const fw = (u, v) => 88 - .0055 * u * u - 9e-7 * u ** 4 + relief(v);
  const P = (u, v, dw = 0) => hp(u, v, fw(u, v) + dw);
  const far = yawD >= 0 ? -1 : 1, dent = Math.min(4, Math.abs(yawD) * .16);
  const cheekU = lerp(D.zyg, D.gon, .52) + D.cheekB, cheekV = lerp(14, D.gonV, .52);
  const side = sg => [
    [sg * D.cran * .5, D.crown + 7, -10], [sg * D.cran * .9, D.crown + 30, -12], [sg * D.cran, D.crown * .47, -12],
    [sg * (D.zyg + 3 + D.templeW - (sg === far ? dent * .3 : 0)), -20, 28], ...(sg === far ? [[sg * (D.zyg + 1 - dent), -3, 32]] : []),
    [sg * (D.zyg + (sg === far ? dent * .35 : 0)), 15, 30], [sg * cheekU, cheekV, 22], [sg * D.gon, D.gonV, 8],
    [sg * (lerp(D.gon, D.chinW, .56) + D.jowl * 3), lerp(D.gonV, D.chinV, .6) + D.jowl * 2.5, 46], [sg * D.chinW, D.chinV - 3.4, 76],
  ];
  const R = side(1), L = side(-1), tens = a => a.map((p, i) => (i === a.length - 3 ? D.jawK : i === a.length - 1 ? .75 : 1));
  const ring = [[0, D.crown, -8], ...R, [0, D.chinV, 80], ...L.slice().reverse()];
  const tn = [1, ...tens(R), .9, ...tens(L).reverse()];
  const pts = ring.map(p => hp(p[0], p[1], p[2]));
  const out = spl(pts, true, tn), outPts = splPts(pts, true, tn, 6);
  const nR = R.length, jaw = splPts([...R.slice(nR - 5).map(p => hp(...p)), hp(0, D.chinV, 80), ...L.slice(L.length - 5).reverse().map(p => hp(...p))], false, [1, 1, D.jawK, 1, .75, .9, .75, 1, D.jawK, 1, 1], 6);
  const nw = F.neckHalf / s;
  return { D, s, hp, P, fw, yawD, far, out, outPts, jaw, O, nw, male: D.male, neckTop: [hp(-nw, D.gonV - 16, -6), hp(nw, D.gonV - 16, -6)] };
}

// neck, shoulders and upper chest in skin (dress is drawn over them)
export function drawNeck(S, Hd, F, sk) {
  const { D, hp, s } = Hd, [TL, TR] = Hd.neckTop, yb = F.y.chest - F.B * .005, bw = F.chestHalf * .55;
  const in0 = [F.sh[0][0] + F.armR[0] * .55, F.sh[0][1] + 4], in1 = [F.sh[1][0] - F.armR[0] * .55, F.sh[1][1] + 4];
  const pts = [TL, F.nb[0], F.trap[0], in0, [F.cxS - bw, yb], [F.cxS + bw, yb], in1, F.trap[1], F.nb[1], TR];
  const d = poly(pts, [0, .6, .9, .6, .3, .3, .6, .9, .6, 0]);
  S.layer('skin').both(d, sk.b, sk.k, 1.1);
  S.within(d, () => {
    // the jaw's shadow on the neck: the head's own outline, dropped and filled (the hard-edged neck shadow of the style)
    const c = hp(0, D.chinV + 30, 20);
    S.fill(ell(add(c, [F.Hh * .1, F.Hh * .04]), F.Hh * .42, F.Hh * .4), S.radial(add(c, [F.Hh * .1, F.Hh * .04]), F.Hh * .42, [[0, sk.s, .75], [.6, sk.s, .4], [1, sk.s, 0]]));
    S.fill(Hd.out, mixc(sk.s, sk.d, .7), { tf: `translate(${n1(F.Hh * .03)} ${n1(F.Hh * (.115 + .03 * D.old))})` });
  });
  // the cords of the neck and the collar bones
  const pit = F.pit, a = D.male ? .55 : .3;
  for (const i of [0, 1]) {
    const sg = i ? 1 : -1, top = mix(Hd.neckTop[i], F.nb[i], .22), end = add(pit, [sg * F.neckHalf * .22, -F.Hh * .03]);
    S.fill(ink(splPts([add(top, [-sg * F.neckHalf * .12, 0]), mix(top, end, .55), end]), S.lw(1.1)), sk.k, { op: a * (.6 + .5 * D.old) });
    const c0 = add(pit, [sg * F.neckHalf * .5, F.Hh * .012]), c1 = [lerp(pit[0], F.sh[i][0], .78), lerp(pit[1], F.sh[i][1], .5) + F.Hh * .03];
    S.fill(ink(splPts([c0, add(mix(c0, c1, .5), [0, F.Hh * .022]), c1]), S.lw(1.1)), sk.k, { op: a * .8 });
  }
  if (D.old > .3) for (const k of [0, 1]) S.fill(ink(splPts([hp(-Hd.nw * .5, D.chinV + 14 + k * 9, 30), hp(0, D.chinV + 18 + k * 9, 36), hp(Hd.nw * .55, D.chinV + 13 + k * 9, 30)]), S.lw(.9)), sk.k, { op: .35 * D.old });
}

function drawEar(S, Hd, sk, sg) {
  const { D, hp } = Hd, u0 = D.zyg + 1, T = D.earT, Bv = D.earB, e = D.earS, o = D.earOut, h = Bv - T;
  const Pe = (du, v, w) => hp(sg * (u0 + du * o * e), T + (v - T) * 1, w);
  const pts = [Pe(-2 / o / e, T + h * .08, 2), Pe(5, T - 1 - D.earPoint * 5, -8), Pe(12.5, T + h * .1 - D.earPoint * 3, -19), Pe(14.5, T + h * .38, -21), Pe(10.5, T + h * .7, -15), Pe(5, T + h * (.98 + .08 * D.lobe), -7), Pe(-1.5 / o / e, T + h * (.84 + .05 * D.lobe), 0)];
  const d = spl(pts, true, [.6, 1, 1, 1, 1, 1, .6]);
  S.both(d, sk.b, sk.k, 1.05);
  S.within(d, () => {
    S.fill(spl([Pe(2, T + h * .3, -4), Pe(8.5, T + h * .22, -14), Pe(10, T + h * .45, -16), Pe(6, T + h * .68, -10), Pe(3, T + h * .55, -5)], true), sk.s);
    S.fill(d, sk.blush, { op: .16 });
  });
  if (S.lod > 0) {
    S.fill(ink(splPts([Pe(1.5, T + h * .2, -2), Pe(6, T + h * .08, -9), Pe(11.5, T + h * .2, -18), Pe(12, T + h * .45, -19), Pe(8.5, T + h * .66, -13)]), S.lw(.9)), sk.k, { op: .7 });
    S.fill(ink(splPts([Pe(4, T + h * .34, -6), Pe(7.5, T + h * .4, -11), Pe(5.5, T + h * .62, -8)]), S.lw(.8)), sk.k, { op: .6 });
  }
}

// the head's flat tone, its ears and its soft shading (the features come after, in drawFace)
export function drawHead(S, Hd, F, look, sk, hairShadow = []) {
  const { D, hp, P, s } = Hd;
  S.layer('head');
  drawEar(S, Hd, sk, -1); drawEar(S, Hd, sk, 1);
  S.both(Hd.out, sk.b, sk.k, 1.1);
  const bl = S.blur(4.2 * s), bs = S.blur(2 * s), bw = S.blur(7 * s);
  S.within(Hd.out, () => {
    // the turn of the form: the side plane on screen right falls away from the light
    const sh = [P(40, -60), P(48, -30), P(54, -6), P(51, 16), P(44, 40), P(34, 66), P(21, 92), P(8, D.chinV + 6), hp(70, D.chinV + 14, 20), hp(120, 60, 0), hp(120, -70, 0)];
    S.fill(spl(sh, true), sk.s, { op: .72 + .2 * D.old - .2 * D.kid, filter: bl });
    // hollows that come with years or hunger
    const hol = clamp(-D.cheekB / 6 + D.old * .5, 0, 1);
    if (hol > .05) for (const sg of [-1, 1]) S.fill(spl([P(sg * 50, 22), P(sg * 44, 36), P(sg * 34, 58), P(sg * 26, 70), P(sg * 40, 62), P(sg * 53, 40)], true), sk.s, { op: .55 * hol, filter: bs });
    // sockets
    for (const sg of [-1, 1]) {
      S.fill(ell(P(sg * (D.eyeU - D.eyeW * .42), -6 - D.depth), 7.5 * s, 6 * s), sk.s, { op: .42 + .16 * D.depth + (sg > 0 ? .1 : 0), filter: bs });
      S.fill(ell(P(sg * (D.eyeU + 1), D.eyeH * .42 + 4.5), 13 * s, 3.4 * s), sk.s, { op: .3, filter: bs });
      if (D.depth > .3 || D.old > .3) S.fill(ell(P(sg * D.eyeU, 9), 13 * s, 5 * s), sk.s, { op: .22 * Math.max(D.depth, D.old), filter: bs });
    }
    S.fill(ell(P(5, D.chinV - 2), 30 * s, 9 * s), sk.s, { op: .5, filter: bl });
    // what the hair shades
    for (const d of hairShadow) S.fill(d, sk.s, { op: .9, tf: `translate(${n1(2.5 * s)} ${n1(9 * s)})` });
    // warmth, then the light
    const blush = D.male ? .14 : .3;
    for (const sg of [-1, 1]) S.fill(ell(P(sg * (D.eyeU + 5), D.noseV * .7), 15 * s, 8.5 * s), sk.blush, { op: blush + .12 * D.kid, filter: bl });
    S.fill(ell(P(0, D.noseV - 8, D.noseP), 7 * s, 5.5 * s), sk.blush, { op: .16 + .1 * D.kid, filter: bs });
    S.fill(ell(P(-20, -44), 27 * s, 15 * s), sk.l, { op: .5, filter: bw });
    S.fill(ell(P(-37, 26), 12 * s, 8 * s), sk.l, { op: .4, filter: bl });
  });
}

const eyeGeom = (Hd, sg) => {
  const { D, P } = Hd, ew = D.eyeW, hU = D.eyeH * (D.male ? .64 : .6), hL = D.eyeH * (D.male ? .36 : .4), t = D.tilt;
  const E = (x, y, dw = 0) => P(sg * (D.eyeU + x), y, dw - 5);
  const I = [-ew / 2, 2 + t * .6], O = [ew / 2, -1.6 - t * 2.4];
  const up = [I, [-ew * .34, -hU * .52], [-ew * .08, -hU * .97], [ew * .22, -hU], [ew * .41, -hU * .6 + O[1] * .4], O];
  const lo = [O, [ew * .3, hL * .72], [ew * .02, hL], [-ew * .28, hL * .7], I];
  return { E, I, O, ew, hU, hL, upPts: splPts(up.map(p => E(p[0], p[1])), false, 1, 5), loPts: splPts(lo.map(p => E(p[0], p[1])), false, 1, 5) };
};

// the features: eyes, brows, nose, mouth, the jaw's line; then what a life adds (lines, marks, scars)
export function drawFace(S, Hd, F, look, sk, hair, iris) {
  const { D, hp, P, s } = Hd, lod = S.lod, rnd = stream(look.id || 'x', 'face');
  S.layer('face');
  const lash = mixc(hair.k, '#1a1014', .55);
  const blind = (look.scars || []).filter(x => x.k === 'eye').map(x => x.side ?? 1);

  // --- eyes ---
  for (const sg of [-1, 1]) {
    const G = eyeGeom(Hd, sg), { E, ew, hU, hL, upPts, loPts } = G;
    const white = polyline([...upPts, ...loPts.slice(1, -1)], true), isBlind = blind.includes(sg), ir = isBlind ? { ring: '#8b9099', b: '#c8ccd1', l: '#e6e8ea' } : iris;
    S.fill(white, D.old > .5 ? '#e9e1d5' : '#f3eeeb');
    S.within(white, () => {
      const r = D.irisR, c = [(look.gaze || 0) * 2.5 - .6, (hL - hU) * .28 - .1], ip = ellPts(c, r, r, 0, 14).map(p => E(p[0], p[1])), id = spl(ip, true);
      const cc = E(c[0], c[1]), lo = E(c[0], c[1] + r * .55), top = E(c[0], c[1] - r), bot = E(c[0], c[1] + r * .3);
      S.fill(id, S.radial(lo, r * 1.5 * s, [[0, ir.l], [.5, ir.b], [.9, ir.ring]]));
      S.fill(id, S.lin(top, bot, [[0, ir.ring, .92], [.55, ir.ring, .45], [1, ir.ring, 0]]));
      if (lod > 1 && !isBlind) S.stroke(spl(ellPts(c, r * .7, r * .7, 0, 12).map(p => E(p[0], p[1])), true), ir.ring, r * .46 * s, { units: 1, cap: 'butt', dash: `${n1(.45 * s)} ${n1(1.05 * s)}`, op: .32 });
      S.stroke(id, ir.ring, lod > 1 ? 1.4 : 1);
      if (!isBlind) S.fill(spl(ellPts(c, r * .4, r * .4, 0, 10).map(p => E(p[0], p[1])), true), '#0e0b10');
      // the lid's shadow on the ball, then the catch-lights
      S.fill(polyline([...upPts, ...offset(upPts, -2.6 * s).reverse()], true), '#7b6d86', { op: .5 });
      S.fill(spl(ellPts([c[0] - sg * 0 - r * .36, c[1] - r * .34], r * .25, r * .2, -.5, 8).map(p => E(p[0], p[1])), true), '#ffffff', { op: .95 });
      if (lod > 0) S.fill(spl(ellPts([c[0] + r * .4, c[1] + r * .42], r * .11, r * .11, 0, 6).map(p => E(p[0], p[1])), true), '#ffffff', { op: .7 });
    });
    // lashes: one swelling stroke along the upper lid, out to a wing
    const wing = E(ew / 2 + 2.6 + D.lash * .5, G.O[1] + (D.male ? .5 : -1.1) - D.tilt * .6);
    const T = D.lash * s, lp = [...upPts, wing];
    S.fill(ink(offset(lp, t => T * .32 * Math.min(1, t * 3)), swell(T * .3, T, .8)), lash);
    if (!D.male && lod > 0) for (const k of [0, 1, 2]) { const a = along(upPts, .8 + k * .08), b = add(a, mul(norm([sg * (1.2 + k * .5), -1.3 + k * .3]), (3 + D.lash * .7) * s)); S.fill(ink([a, mix(a, b, .5), b], fade(T * .5)), lash); }
    S.fill(ink(part(loPts, .02, .42), S.lw(D.male ? .95 : .85)), sk.k, { op: .8 });
    if (lod > 0) {
      const cr = offset(part(upPts, .1, .9, 12), (1.6 + D.eyeH * .13 + (D.male ? 0 : .5)) * s * (1 - .3 * D.old));
      S.fill(ink(cr, S.lw(.8)), sk.k, { op: D.male ? .5 : .62 });
      S.fill(ink(part(loPts, .85, 1), S.lw(.7)), sk.k, { op: .45 });
    }
  }
  // --- brows: a blade from the heavy inner end to a point ---
  const brow = D.male ? mixc(hair.s, hair.k, .45) : mixc(mixc(hair.s, hair.k, .3), sk.d, .22);
  for (const sg of [-1, 1]) {
    const ew = D.eyeW, E = (x, y) => P(sg * (D.eyeU + x), y, D.ridge * 1.5);
    const cut = (look.scars || []).find(x => x.k === 'brow' && (x.side ?? 1) === sg);
    const c = splPts([E(-ew / 2 - 1.5 + D.browGap, D.browV + D.browDrop), E(-ew * .1, D.browV - .8 - D.arch * 1.2), E(ew * .2, D.browV - 1.6 - D.arch * 2.4), E(ew / 2 + 5.5, D.browV + .4 + D.arch * 1.2 - D.browDrop * .25)], false, 1, 8);
    const w = t => D.browT * s * (t < .1 ? lerp(.6, 1, t / .1) : 1 - .93 * ((t - .1) / .9) ** 1.5);
    S.fill(ink(c, w), brow);
    if (D.old > .4 && D.male && lod > 0) for (let k = 0; k < 7; k++) { const a = along(c, .1 + k * .1), b = add(a, [sg * 2.4 * s, (-2.6 + (k % 2)) * s]); S.fill(ink([a, mix(a, b, .5), b], fade(S.lw(1))), brow); }
    if (cut) S.fill(ink([along(c, .5), add(along(c, .5), [s * 1, s * 5])].map((p, i) => add(p, [0, i ? 0 : -5 * s])), [2.6 * s, 2.6 * s, 2.6 * s]), sk.b);
  }
  // --- nose ---
  const NV = D.noseV, NW = D.noseW, NP = D.noseP, nb = D.nosebreak * 2.2;
  const rdg = v => hp(nb * sstep(0, 14, v) * (1 - sstep(18, NV, v) * .6), v, tab([[-7, 87], [10, 95 + 3 * D.bridge + Math.abs(nb)], [NV - 18, 88 + NP * .62 + 2.5 * D.bridge], [NV - 7 + D.tipV, 88 + NP], [NV - 2.5 + D.tipV * .5, 88 + NP * .8], [NV, 97]], v));
  const tip = rdg(NV - 7 + D.tipV);
  S.fill(spl([hp(1.5 + nb, -3, 87), hp(2.5 + nb, 12, 95), hp(3.5, NV - 14, 86 + NP * .7), hp(NW * .6, NV - 6, 86 + NP * .6), hp(NW + 1, NV - 4, 84), hp(NW + 4, NV - 14, 80), hp(9, 6, 84), hp(6, -4, 85)], true), S.lin(hp(2, 14, 95), hp(NW + 6, 16, 80), [[0, sk.s, .8], [1, sk.s, 0]]), { filter: S.blur(1.1 * s) });
  S.fill(spl([hp(-NW * .62, NV - 2.2, 90), hp(-NW * .3, NV + .6, 96), hp(0, NV + 1.6, 97), hp(NW * .45, NV + .8, 95), hp(NW * .95, NV - 2.5, 86), hp(NW * .5, NV - 4.6 + D.tipV * .3, 96), hp(0, NV - 3.4 + D.tipV * .4, 86 + NP * .7), hp(-NW * .4, NV - 4.2 + D.tipV * .3, 97)], true), sk.d, { op: .85 });
  S.fill(ink(splPts([hp(NW * .2, NV - 2.2, 99), hp(NW * .5, NV - 3.4, 95), hp(NW * .8, NV - 3.2, 89)]), 1.7 * s * D.tipR), sk.k);
  S.fill(ink(splPts([hp(-NW * .22, NV - 2.2, 99), hp(-NW * .5, NV - 3.2, 95), hp(-NW * .72, NV - 2.8, 90)]), 1.4 * s), sk.k, { op: .85 });
  S.fill(ink(splPts([hp(NW * .93, NV - 9.5, 86), hp(NW + 1.4, NV - 5, 84), hp(NW * .8, NV - 1, 87)]), S.lw(1)), sk.k, { op: .75 });
  const yk = clamp(Math.abs(Hd.yawD) / 10);
  if (yk > .1) S.fill(ink(splPts([rdg(NV * .22), rdg(NV * .5), rdg(NV - 15), tip, rdg(NV - 2.5 + D.tipV * .5)], false, 1, 6), swell(0, S.lw(1.25), .8)), sk.k, { op: .35 + .5 * yk });
  S.fill(ell(add(tip, [-2 * s, -2.5 * s]), 2.3 * s * D.tipR, 1.7 * s * D.tipR), sk.l, { op: .6 });
  if (lod > 0) S.fill(ell(rdg(NV * .3), 1.6 * s, 8 * s), sk.l, { op: .45 });

  // --- mouth ---
  const MV = D.mouthV, mw = D.mouthW, M = (x, y) => P(x, MV + y, 3 - .004 * x * x + (y > 0 ? D.under * 1.5 : 0));
  const sm = (look.smile ?? 0) + D.curve * .5, lU = D.lipU, lL = D.lipL;
  const mline = [[-mw, .6 - sm * 2.2], [-mw * .6, .5 - sm * .7], [-mw * .2, -.4], [0, .15], [mw * .2, -.4], [mw * .6, .5 - sm * .7], [mw, .6 - sm * 2.2]].map(p => M(p[0], p[1]));
  const utop = [[-mw * .94, .2 - sm * 2], [-mw * .5, -lU * .7], [-mw * .16, -lU], [0, -lU * .74], [mw * .16, -lU], [mw * .5, -lU * .7], [mw * .94, .2 - sm * 2]].map(p => M(p[0], p[1]));
  const lbot = [[-mw * .84, 1 - sm * 1.6], [-mw * .42, lL * .82], [0, lL], [mw * .42, lL * .82], [mw * .84, 1 - sm * 1.6]].map(p => M(p[0], p[1]));
  const mP = splPts(mline, false, 1, 5), uP = splPts(utop, false, 1, 5), lP = splPts(lbot, false, 1, 5);
  S.fill(spl([M(-mw * .5, lL + .4), M(0, lL + 1), M(mw * .5, lL + .4), M(mw * .34, lL + 4.6), M(0, lL + 5.6), M(-mw * .34, lL + 4.6)], true), S.lin(M(0, lL + .6), M(0, lL + 6), [[0, sk.s, .95], [1, sk.s, 0]]));
  S.fill(polyline([...uP, ...mP.slice().reverse()], true), mixc(sk.s, sk.lip, D.lipTint * .8));
  S.fill(polyline([...mP, ...lP.slice().reverse()], true), mixc(sk.b, sk.lip, D.lipTint * .78));
  S.fill(ell(M(-mw * .14, lL * .46), mw * .24 * s, lL * .2 * s), sk.l, { op: .25 + .3 * D.lipTint });
  S.fill(ink(mP, taper((D.male ? 1.55 : 1.35) * s, .45)), mixc(sk.k, '#3a1418', .4));
  for (const sg of [-1, 1]) S.fill(ink([M(sg * mw, .6 - sm * 2.2), M(sg * (mw + 1.6), 1.2 - sm * 3.2)], [1.2 * s, .9 * s, 0]), sk.k, { op: .8 });
  if (D.cleft > .1) S.fill(ink([P(0, D.chinV - 13), P(.4, D.chinV - 9), P(0, D.chinV - 5)], S.lw(1)), sk.k, { op: .6 * D.cleft });

  // --- the jaw's line, heavier where it turns from the light ---
  S.fill(ink(Hd.jaw, t => S.lw(.6 + 1.5 * Math.sin(Math.PI * clamp(t * .92)) ** 1.2 * (t < .5 ? 1 : .75))), sk.k);
  if (D.jowl > .5) for (const sg of [-1, 1]) S.fill(ink(splPts([P(sg * (mw + 6), MV + 8), P(sg * (mw + 8), MV + 20), P(sg * (mw + 3), D.chinV - 12)]), S.lw(.9)), sk.k, { op: .45 * (D.jowl - .3) });

  drawYears(S, Hd, sk, D);
  drawMarks(S, Hd, look, sk, rnd);
  // stubble and beard shadow come from the hair module (it knows the beard); freckles and moles here
  const fr = Math.max(0, ((look.g || {}).freckles ?? -1) + 1) / 2;
  if (fr > 0 && lod > 0) {
    const r2 = stream(look.id || 'x', 'freckles'), n = Math.round(70 * fr), col = mixc(sk.s, '#9a5a34', .55); let d = '';
    for (let i = 0; i < n; i++) { const u = r2.s() * 46, v = D.noseV * .62 + r2.s() * 15 - Math.abs(u) * .12, p = P(u, v), q = (.5 + r2() * .6) * s; d += `M${n1(p[0] - q)} ${n1(p[1])}a${n1(q)} ${n1(q)} 0 1 0 ${n1(2 * q)} 0a${n1(q)} ${n1(q)} 0 1 0 ${n1(-2 * q)} 0`; }
    S.fill(d, col, { op: .6 });
  }
}

// lines the years draw: each set has an age it starts at and an age it is full
function drawYears(S, Hd, sk, D) {
  const { P, s } = Hd, a = D.age, at = (from, full) => clamp((a - from) / (full - from)), L = (pts, k, w = 1) => k > .04 && S.fill(ink(splPts(pts, false, 1, 6), S.lw(w * (.6 + .6 * k))), sk.k, { op: .2 + .5 * k });
  const MV = D.mouthV, NV = D.noseV, mw = D.mouthW;
  for (const sg of [-1, 1]) {
    const k1 = at(34, 66); L([P(sg * (D.noseW + 2), NV - 6), P(sg * (D.noseW + 7.5), NV + 6), P(sg * (mw + 5), MV - 3 + 6 * k1)], k1, 1.1);          // nose to mouth
    const k2 = at(40, 68); L([P(sg * (D.eyeU - 10), 8.5), P(sg * (D.eyeU + 1), 12 + 2 * k2), P(sg * (D.eyeU + 11), 9)], k2);                       // under the eye
    const k3 = at(38, 66); for (const j of [-1, 0, 1]) L([P(sg * (D.eyeU + D.eyeW / 2 + 3), -1 + j * 2.5), P(sg * (D.eyeU + D.eyeW / 2 + 9), -2 + j * 5.5)], k3 * (j ? .8 : 1), .8);   // crow's feet
    const k4 = at(52, 80); L([P(sg * (mw + 2.5), MV + 4), P(sg * (mw + 4.5), MV + 12), P(sg * (mw + 1), MV + 19)], k4);                           // mouth corner down
    const k5 = at(56, 84); L([P(sg * 50, 20), P(sg * 44, 38), P(sg * 36, 56)], k5 * .9);                                                            // the cheek's hollow
  }
  const k6 = at(40, 72); for (const j of [0, 1, 2]) L([P(-30 + j * 3, -40 - j * 9.5), P(-8, -42.5 - j * 9.5), P(12, -41 - j * 9.5), P(30 - j * 3, -42 - j * 9.5)], k6 * (j === 1 ? 1 : .75), .9);
  const k7 = at(36, 62) * (D.male ? 1 : .7); for (const sg of [-1, 1]) L([P(sg * 3.6, D.browV - 7), P(sg * 4.4, D.browV + 3)], k7, .9);
}

// what a life marks: scars set where the look says, each drawn as a pale seam with a dark lip
function drawMarks(S, Hd, look, sk, rnd) {
  const { D, P, s } = Hd;
  const seam = (pts, fresh, w = 2) => {
    const c = splPts(pts, false, 1, 8), pale = fresh ? mixc(sk.blush, '#b0353a', .55) : mixc(sk.l, sk.blush, .4);
    S.fill(ink(offset(c, .7 * s), taper(w * 1.1 * s, .4)), sk.d, { op: .7 });
    S.fill(ink(c, taper(w * s, .4)), pale);
    if (S.lod > 0) for (let i = 1; i < 6; i++) { const p = along(c, i / 6), q = along(c, i / 6 + .01), n = mul(norm(perp(sub(q, p))), w * 1.25 * s); S.stroke(polyline([sub(p, n), add(p, n)]), fresh ? '#7a2428' : sk.d, .8, { op: fresh ? .9 : .55 }); }
  };
  for (const sc of look.scars || []) {
    const sg = sc.side ?? 1, f = !!sc.fresh, ey = D.eyeU;
    if (sc.k === 'cheek') seam([P(sg * 20, 19), P(sg * 31, 29), P(sg * 46, 46)], f, 2.2);
    else if (sc.k === 'brow' || sc.k === 'eye') seam([P(sg * (ey - 3), D.browV - 15), P(sg * (ey - .5), D.browV - 2), P(sg * (ey + 1.5), 9), P(sg * (ey + 5), 22)], f, 1.9);
    else if (sc.k === 'lip') seam([P(sg * 7, D.mouthV - 11), P(sg * 9, D.mouthV), P(sg * 12, D.mouthV + 10)], f, 1.6);
    else if (sc.k === 'nose') seam([P(-11, 10), P(0, 8), P(12, 13)], f, 1.7);
    else if (sc.k === 'jaw') seam([P(sg * 26, D.gonV + 14), P(sg * 37, D.gonV + 2), P(sg * 47, D.gonV - 14)], f, 2);
    else if (sc.k === 'forehead') seam([P(sg * 8, -60), P(sg * 20, -50), P(sg * 35, -41)], f, 2);
    else if (sc.k === 'burn') {
      const c = [sg * 43, 34], pts = []; for (let i = 0; i < 11; i++) { const a = i / 11 * 6.283, r = 15 + rnd.s() * 4.5; pts.push(P(c[0] + Math.cos(a) * r * .8, c[1] + Math.sin(a) * r * 1.25)); }
      const d = spl(pts, true), col = mixc(sk.blush, sk.d, .35);
      S.within(Hd.out, () => { S.fill(d, col, { op: .7 }); S.stroke(d, sk.d, 1.1, { op: .6 }); for (let i = 0; i < 9; i++) { const p = P(c[0] + rnd.s() * 9, c[1] + rnd.s() * 15); S.fill(ell(p, (1.5 + rnd() * 2.5) * s, (1 + rnd() * 2) * s, rnd() * 3), i % 2 ? sk.l : sk.d, { op: .45 }); } });
    }
  }
  const moles = Math.round(Math.max(0, ((look.g || {}).moles ?? -1) + 1) * 1.5), r3 = stream(look.id || 'x', 'moles');
  for (let i = 0; i < moles; i++) { const sg = r3() < .5 ? -1 : 1; S.fill(ell(P(sg * (12 + r3() * 30), 18 + r3() * 60), .95 * s, .95 * s), mixc(sk.k, sk.d, .4), { op: .85 }); }
}
