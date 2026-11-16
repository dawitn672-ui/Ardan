// Gate 2 · the figure's rig: a person's age, sex, height and build become joints and widths, in millimetres, feet on
// y = 0 and the crown at y = -height. Sides are the SCREEN's: 0 is screen-left, 1 is screen-right (sign -1, +1).
// Proportions are the manhwa figure of the owner's references: a grown man eight heads tall and long in the leg.
import { lerp, clamp, sstep, add, sub, mul, norm, perp, len, dir, rad, mix } from './g.js';

const tab = (t, x) => { let i = 0; while (i < t.length - 2 && x > t[i + 1][0]) i++; const [a, va] = t[i], [b, vb] = t[i + 1]; return lerp(va, vb, clamp((x - a) / (b - a))); };
// fraction of grown height, and heads tall, by age
const GROW_M = [[0, .29], [2, .49], [4, .58], [6, .66], [8, .72], [10, .78], [12, .84], [14, .91], [16, .97], [18, 1], [60, 1], [75, .98], [90, .955]];
const GROW_F = [[0, .29], [2, .49], [4, .59], [6, .67], [8, .74], [10, .81], [12, .89], [14, .96], [16, .99], [18, 1], [60, 1], [75, .975], [90, .95]];
const HEADS = [[0, 4], [2, 4.4], [4, 5], [6, 5.5], [8, 5.9], [10, 6.3], [12, 6.75], [14, 7.25], [16, 7.8], [19, 8.3], [60, 8.3], [80, 8.0]];

export const BUILD_KEYS = [
  ['weight', 'gaunt', 'heavy'], ['muscle', 'slight', 'brawny'], ['shoulders', 'narrow', 'broad'], ['hips', 'narrow', 'wide'],
  ['legs', 'short-legged', 'long-legged'], ['neck', 'slender', 'thick'], ['posture', 'stooped', 'proud'],
];

// stances: where each wrist goes (a function of the rig), how the weight sits, and which hand shapes to draw
export const POSES = {
  ease:    { name: 'At ease',           sway: 0.7,  wide: .115, arm: [{ hang: [9, 9] }, { hang: [11, 12] }], hand: ['relaxed', 'relaxed'] },
  hip:     { name: 'Hand on hip',       sway: -0.9, wide: .125, arm: [{ hang: [8, 8] }, { to: F => [F.wa[1][0] + F.H * .012, F.y.waist + F.B * .03], fs: [.95, .8] }], hand: ['relaxed', 'fist'] },
  belt:    { name: 'Thumbs in belt',    sway: 0.5,  wide: .14,  arm: [{ to: F => [F.cx - F.waistHalf * .62, F.y.belt + F.H * .006], fs: [.97, .86] }, { to: F => [F.cx + F.waistHalf * .62, F.y.belt + F.H * .006], fs: [.97, .86] }], hand: ['fist', 'fist'] },
  folded:  { name: 'Arms folded',       sway: 0.35, wide: .15,  arm: [{ to: F => [F.cxS + F.chestHalf * .66, F.y.chest + F.B * .064], el: (F, i, s) => [F.sh[i][0] + s * F.armR[0] * .35, F.y.chest + F.B * .1] }, { to: F => [F.cxS - F.chestHalf * .98, F.y.chest + F.B * .098], el: (F, i, s) => [F.sh[i][0] + s * F.armR[0] * .35, F.y.chest + F.B * .105] }], hand: ['flat', 'tucked'], folded: true },
  pommel:  { name: 'Hand on the pommel', sway: -0.5, wide: .14, arm: [{ hang: [10, 10] }, { to: F => [F.hi[1][0] + F.H * .02, F.y.belt + F.H * .012], fs: [.96, .84] }], hand: ['relaxed', 'rest'] },
  sleeves: { name: 'Hands in sleeves',  sway: 0.2,  wide: .1,   arm: [{ to: F => [F.cx - F.H * .012, F.y.waist + F.B * .012], fs: [.97, .86] }, { to: F => [F.cx + F.H * .012, F.y.waist + F.B * .02], fs: [.97, .86] }], hand: ['hidden', 'hidden'], muff: true },
  staff:   { name: 'Leaning on a staff', sway: 0.8, wide: .13,  arm: [{ to: F => [F.sh[0][0] - F.H * .045, F.y.chest + F.B * .02], fs: [.9, .82], staff: true }, { hang: [10, 10] }], hand: ['grip', 'relaxed'] },
  clasped: { name: 'Hands clasped',     sway: 0.3,  wide: .09,  arm: [{ to: F => [F.cx - F.H * .012, F.y.hip - F.B * .02], fs: [.99, .95] }, { to: F => [F.cx + F.H * .012, F.y.hip - F.B * .014], fs: [.99, .95] }], hand: ['clasp', 'hidden'] },
  behind:  { name: 'Hands behind',      sway: -0.3, wide: .1,   arm: [{ to: F => [F.cx - F.waistHalf * .7, F.y.hip - F.B * .03], fs: [.97, .9], back: true }, { to: F => [F.cx + F.waistHalf * .7, F.y.hip - F.B * .03], fs: [.97, .9], back: true }], hand: ['hidden', 'hidden'] },
  sword:   { name: 'Hands on the sword', sway: 0.05, wide: .15, arm: [{ to: F => [F.cx - F.H * .011, F.y.hip + F.B * .012], fs: [.98, .94] }, { to: F => [F.cx + F.H * .011, F.y.hip + F.B * .004], fs: [.98, .94] }], hand: ['rest', 'rest'], planted: true },
};

export function makeRig(look) {
  const male = look.sex !== 'F', age = look.age ?? 30, bd = look.build || {};
  const wt = bd.weight || 0, mu = bd.muscle || 0, sw = bd.shoulders || 0, hw = bd.hips || 0, po = bd.posture || 0, lg = bd.legs || 0, nk = bd.neck || 0;
  const kid = 1 - sstep(5, 17, age), old = sstep(55, 85, age);
  const sexT = male ? 1 : 0, grown = sstep(11, male ? 19 : 17, age);       // how far the sex's build has come in
  const m = (a, f, c) => lerp(male ? a : f, c, kid);                       // grown man, grown woman, child
  const stoop = Math.max(0, -po) * .6 + old * .5;
  const H = (look.height || (male ? 178 : 165)) * 10 * tab(male ? GROW_M : GROW_F, age) * (1 - .028 * stoop);
  const heads = tab(HEADS, age) - (male ? 0 : .2 * grown) - old * .15;
  const Hh = H / heads, B = H - Hh, chinY = -H + Hh;
  const F = { male, age, H, Hh, B, heads, kid, old, grown, wt, mu, po, stoop, look };

  // heights, as fractions of the body below the chin
  const crotchF = m(.408, .414, .47) - lg * .022, neckF = m(.062, .068, .06) * (1 - .3 * stoop + .1 * Math.max(0, po)) * (1 - .08 * Math.max(0, wt));
  const y = F.y = {
    chin: chinY, sh: chinY + B * neckF, chest: chinY + B * m(.152, .156, .165), waist: chinY + B * m(.272, .262, .292),
    hip: chinY + B * (crotchF - m(.04, .046, .05)), crotch: chinY + B * crotchF, ankle: -H * m(.052, .05, .05), sole: 0,
  };
  y.knee = lerp(y.crotch, y.ankle, .5) - B * .012;
  y.belt = lerp(y.waist, y.hip, male ? .45 : .12);

  // half widths
  const wide = 1 + .09 * sw + .035 * mu + .02 * wt - .05 * old - .03 * stoop;
  F.shHalf = H * m(.113, .098, .104) * wide;
  F.chestHalf = H * m(.091, .079, .084) * (1 + .08 * mu + .1 * Math.max(wt, 0) + .04 * Math.min(wt, 0) + .04 * sw);
  F.waistHalf = H * m(.073, .06, .078) * (1 + .34 * Math.max(wt, 0) + .1 * Math.min(wt, 0) + .04 * mu);
  F.hipHalf = H * m(.083, .092, .082) * (1 + .12 * hw + .16 * Math.max(wt, 0) + .05 * Math.min(wt, 0));
  F.neckHalf = H * m(.0275, .0212, .0215) * (1 + .17 * mu + .14 * Math.max(wt, 0) + .1 * nk - .06 * old);
  const armK = 1 + .2 * mu + .18 * Math.max(wt, 0) + .12 * Math.min(wt, 0), legK = 1 + .14 * mu + .22 * Math.max(wt, 0) + .12 * Math.min(wt, 0);
  F.armR = [m(.027, .021, .02), m(.0205, .017, .0165), m(.023, .018, .017), m(.0138, .0118, .012)].map((r, i) => r * H * (i === 3 ? 1 + (armK - 1) * .35 : armK));   // shoulder, elbow, forearm, wrist
  F.legR = [m(.049, .051, .043), m(.0305, .029, .028), m(.032, .0295, .026), m(.0168, .0152, .016)].map((r, i) => r * H * (i === 3 ? 1 + (legK - 1) * .4 : legK));   // thigh, knee, calf, ankle
  F.armL = [H * m(.172, .166, .158), H * m(.146, .14, .132)]; F.handL = H * m(.106, .1, .098); F.footL = H * m(.152, .145, .15);

  // the weight: the pelvis slides over the standing leg and tips, the shoulders tip back the other way
  const P = F.pose = POSES[look.pose] || POSES.ease, sway = P.sway * (1 - .5 * kid);
  const cx = F.cx = sway * H * .02, cxS = F.cxS = -sway * H * .006, tiltP = sway * H * .0105, tiltS = -sway * H * .008;
  F.sway = sway;
  const side = [-1, 1];
  F.hipJ = side.map(s => [cx + s * F.hipHalf * .5, y.hip + B * .012 - s * tiltP]);
  F.hi = side.map(s => [cx + s * F.hipHalf, y.hip - s * tiltP]);
  F.wa = side.map(s => [lerp(cx, cxS, .5) + s * F.waistHalf, y.waist - s * tiltP * .4]);
  F.ch = side.map(s => [cxS + s * F.chestHalf, y.chest - s * tiltS * .6]);
  F.ax = side.map(s => [cxS + s * F.chestHalf * .97, y.chest - B * .042 - s * tiltS * .8]);
  F.sh = side.map(s => [cxS + s * F.shHalf, y.sh - s * tiltS + stoop * Hh * .03]);
  F.del = side.map((s, i) => [F.sh[i][0] + s * F.armR[0] * .62, F.sh[i][1] + Hh * .2]);
  F.nb = side.map(s => [cxS + s * F.neckHalf * 1.06, y.sh - Hh * (.17 + .05 * mu - .04 * stoop) - s * tiltS * .3]);            // where the neck's column meets the trapezius
  F.trap = side.map((s, i) => [lerp(F.nb[i][0], F.sh[i][0], .4), y.sh - Hh * (.115 + .06 * Math.max(0, mu)) - s * tiltS * .6]);
  F.pit = [cxS, y.sh + Hh * .03];                                                 // the pit of the throat
  F.crotch = [cx, y.crotch];
  F.belt = side.map(s => [lerp(cx, cxS, .3) + s * lerp(F.waistHalf, F.hipHalf, male ? .45 : .12) * 1.02, y.belt - s * tiltP * .7]);
  F.shJ = side.map((s, i) => [F.sh[i][0] - s * F.armR[0] * .3, F.sh[i][1] + F.armR[0] * .95]);

  // legs: ankles are set down, the knee is found between
  const wideA = (P.wide + (male ? 0 : -.012)) * H * (1 + .1 * mu);
  F.leg = side.map((s, i) => {
    const free = (sway >= 0 ? -1 : 1) === s ? Math.abs(sway) : 0;              // the leg that carries no weight
    const an = [s * wideA / 2 + cx * .35 + s * free * H * .012, y.ankle], hip = F.hipJ[i];
    const kn = add(mix(hip, an, .5), [s * H * (.004 + .015 * free), -B * .012 + free * H * .005]);
    const toe = rad(s * (16 + 16 * free + (male ? 4 : -4)));
    return { hip, kn, an, toe, free, s };
  });
  // arms: a hanging arm by its angles, or a hand sent to a place (two bones, elbow kept outside)
  F.arm = side.map((s, i) => {
    const A = P.arm[i], S = F.shJ[i], fs = A.fs || [1, 1], L1 = F.armL[0] * fs[0], L2 = F.armL[1] * fs[1];
    let el, wr;
    if (A.hang) { const a = rad(A.hang[0] + 2 * mu + 3 * Math.max(wt, 0)), b = rad(A.hang[1]); el = add(S, mul(dir(s * a), L1)); wr = add(el, mul(dir(s * (a - b)), L2)); }
    else {
      const T = A.to(F), v = sub(T, S), d0 = len(v), d = clamp(d0, Math.abs(L1 - L2) + 2, L1 + L2 - 2), u = norm(v);
      const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - a * a)), n = perp(u);
      const e1 = add(S, add(mul(u, a), mul(n, h))), e2 = add(S, add(mul(u, a), mul(n, -h)));
      const sc = e => e[1] + .6 * (e[0] - S[0]) * s; el = sc(e1) > sc(e2) ? e1 : e2;   // the elbow hangs low, and outward when in doubt
      wr = add(S, mul(u, d));
      if (A.el) { el = A.el(F, i, s); wr = T; }                               // a stance may set the elbow itself
    }
    return { sh: S, el, wr, s, back: !!A.back, staff: !!A.staff, hang: !!A.hang, hand: P.hand[i], dirF: norm(sub(wr, el)) };
  });
  // the head: crown at -H before the tilt; the head model's own units are scaled to Hh in head.js
  F.headX = cxS + sway * H * .003;
  return F;
}
