// The body in millimetres (characters.md §2, §5, §7): one model of a person, grown from birth to old age, shaped by the
// face's features (face.js), sex, build and the wounds of a life. model(look) returns the volumes the painter lights
// (src/ui/engine/paint) and the named points and relief lines of the face. Plain numbers in, plain objects out; it
// touches nothing of the page and uses no dice: every choice that looks random hashes from the id.
//
// Frame: millimetres, x to the person's left as we face them (the viewer's right), y up, z toward the viewer; the origin
// is the midpoint between the pupils of a grown man. The head turns about its pivot at the top of the neck.

import { base, shape, ageWeights } from './basemesh.js';

// ---------- small maths ----------
export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function h32(s) { s = String(s); let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); return (h ^ (h >>> 15)) >>> 0; }
// a value -1..1 hashed from the id and a channel: steady through a life
export const hv = (id, ch) => (h32(id + '|' + ch) / 4294967296) * 2 - 1;

// ---------- growth (§5) ----------
// [age, cranium, face height, face width, nose, eyeball, eye spacing, jaw back (mm), baby fat, body size]
// Tuned so crown-to-chin is 128, 165, 180, 190, 202, 218, 225 mm at 0, 1, 3, 6, 10, 14, 18 (the table of §5).
const GROW = [
  [0, 0.660, 0.45, 0.60, 0.42, 0.74, 0.70, -7, 1.0, 0.285],
  [1, 0.800, 0.60, 0.72, 0.52, 0.86, 0.77, -6, 0.95, 0.43],
  [3, 0.865, 0.68, 0.79, 0.60, 0.93, 0.82, -5, 0.75, 0.55],
  [6, 0.915, 0.75, 0.84, 0.69, 0.96, 0.86, -4, 0.45, 0.665],
  [10, 0.950, 0.83, 0.89, 0.78, 0.98, 0.90, -3, 0.18, 0.785],
  [14, 0.980, 0.94, 0.95, 0.90, 0.99, 0.95, -1.5, 0.05, 0.93],
  [18, 1, 1, 1, 1, 1, 1, 0, 0, 1],
  [999, 1, 1, 1, 1, 1, 1, 0, 0, 1],
];
export function grow(age) {
  for (let i = 1; i < GROW.length; i++) if (age <= GROW[i][0]) {
    const a = GROW[i - 1], b = GROW[i], t = (age - a[0]) / (b[0] - a[0]);
    const r = a.map((v, k) => lerp(v, b[k], t));
    return { cranium: r[1], faceH: r[2], faceW: r[3], nose: r[4], eye: r[5], eyeGap: r[6], jawBack: r[7], baby: r[8], body: r[9] };
  }
}
// WHO-median stature as a share of grown height (boys; girls run two years ahead in the spurt), then the loss of old age
const STAT_M = [[0, 0.285], [1, 0.43], [2, 0.5], [3, 0.55], [4, 0.595], [6, 0.665], [8, 0.73], [10, 0.785], [12, 0.84], [14, 0.93], [16, 0.98], [18, 1]];
const STAT_F = [[0, 0.30], [1, 0.46], [2, 0.53], [3, 0.585], [4, 0.63], [6, 0.705], [8, 0.775], [10, 0.84], [12, 0.92], [14, 0.975], [16, 0.995], [18, 1]];
export function statureShare(age, sex) {
  const T = sex === 'F' ? STAT_F : STAT_M;
  let s = 1;
  for (let i = 1; i < T.length; i++) if (age <= T[i][0]) { const a = T[i - 1], b = T[i]; s = lerp(a[1], b[1], (age - a[0]) / (b[0] - a[0])); break; }
  // height lost in old age (§5): a man about 3 cm by 70 and 5 by 80, a woman 5 and 8, on 172 / 160 cm
  const loss = sex === 'F' ? [[50, 0], [70, 0.031], [80, 0.05], [95, 0.07]] : [[50, 0], [70, 0.017], [80, 0.029], [95, 0.045]];
  if (age > 50) for (let i = 1; i < loss.length; i++) if (age <= loss[i][0] || i === loss.length - 1) { const a = loss[i - 1], b = loss[i]; s -= lerp(a[1], b[1], clamp((age - a[0]) / (b[0] - a[0]), 0, 1)); break; }
  return s;
}

// ---------- ageing (§5) ----------
// how far each sign of age has come, 0..1, at a human age, with wear (a hard life ages up to a fifth faster)
export function ageing(age, wear = 0) {
  const a = age * (1 + 0.2 * clamp(wear, -0.5, 1));
  return {
    a,
    lines: sstep(27, 62, a),        // first lines from 30
    sag: sstep(40, 78, a),          // the soft cheek slides
    old: sstep(58, 85, a),          // deep folds, hollow temples, a dropped tip
    frail: sstep(72, 95, a),        // thin loose skin, cords in the neck, the head forward
    spots: sstep(55, 85, a),
    earGrow: Math.max(0, a - 20) * 0.2,   // mm the ear has lengthened
    thin: sstep(45, 80, a),         // lips thin
  };
}

// ---------- the people (§5, other peoples): base offsets in the same frame ----------
export const PEOPLES = {
  human: { scale: 1, faceLen: 0, jaw: 0, brow: 0, nose: 1, ear: 0, eye: 0 },
  elf: { scale: 0.98, faceLen: 0.35, jaw: -0.45, brow: -0.5, nose: 0.95, ear: 1, eye: 0.15, cheek: 0.55 },
  dwarf: { scale: 1.06, faceLen: -0.45, jaw: 0.6, brow: 0.9, nose: 1.15, ear: 0, eye: -0.2, cheek: 0.2 },
  orc: { scale: 1.08, faceLen: 0.1, jaw: 0.9, brow: 1.0, nose: 1.05, ear: 0.5, eye: -0.3, tusks: 1 },
};

// ---------- wounds (§7): places and kinds ----------
export const WOUND_KINDS = ['cut', 'nose', 'eye', 'burn', 'pox', 'ear', 'arrow', 'bite', 'dent', 'brand'];
// where a wound sits on the head, in the model frame of a grown man (scaled with the head)
export const PLACES = {
  forehead: [18, 45, 78], brow: [30, 18, 80], eye: [31.5, 0, 76], cheek: [42, -28, 66], ear: [74, -12, -8], jaw: [44, -78, 38],
  nose: [0, -20, 96], lip: [10, -58, 88], chin: [8, -100, 76], scalp: [30, 85, 40], neck: [30, -150, 20],
};
// healing (§7): raw while fresh, red for a year, pale by the third, thinner after 15
export function healing(yearsSince) {
  const y = Math.max(0, yearsSince);
  return { fresh: y < 0.15 ? 1 - y / 0.15 : 0, red: y < 3 ? clamp(1 - (y - 0.15) / 2.85, 0, 1) : 0, pale: sstep(0.5, 3, y), thin: sstep(10, 25, y) };
}
export function wound(kind, at, o = {}) { return { k: kind, at: at || 'cheek_l', age: o.age ?? 30, n: o.n ?? 1, how: o.how }; }

// ---------- build (§5) ----------
export function build(look) {
  const g = look.g || {}, b = look.build || {};
  const frame = clamp((g.frame || 0) * 0.7 + (b.frame || 0), -1.2, 1.2);
  const muscle = clamp((b.muscle ?? 0) + (g.bulk || 0) * 0.3, -1, 1.2);
  const fat = clamp((b.fat ?? 0) + (g.bulk || 0) * 0.3, -1, 1.5);
  return { frame, muscle, fat, shoulders: 1 + 0.16 * frame, neck: 1 + 0.12 * muscle + 0.16 * Math.max(0, fat) + 0.08 * (g.neck || 0), waist: 1 + 0.35 * Math.max(0, fat) - 0.08 * Math.min(0, fat) };
}

// ---------- the model ----------
// look: { id, sex 'M'|'F', age, race, g (features -1..1, face.js), height (cm, grown), build, wounds, wear, temper }
// Returns the person's skin as a mesh in millimetres (the sculpted CC0 base, shaped by age, sex, build, features and
// wounds), with the named points the painter needs: eyes and lid margins, the lips' parting, nose, chin, brows, and the
// relief lines of age and of scars.
const HEADH = [[0, 128], [1, 165], [3, 180], [6, 190], [10, 202], [14, 218], [18, 225], [70, 227], [100, 229]];
const interp = (T, x) => { if (x <= T[0][0]) return T[0][1]; for (let i = 1; i < T.length; i++) if (x <= T[i][0]) { const a = T[i - 1], b = T[i]; return lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0])); } return T[T.length - 1][1]; };

export function featureWeights(look) {
  const F = look.sex === 'F', age = look.age ?? 30, sex = F ? 'female' : 'male';
  const g = Object.assign({}, look.g || {}), R = PEOPLES[look.race] || PEOPLES.human;
  const A = ageing(age, look.wear || 0), Bd = build(look);
  const W = {}, add = (k, v) => { if (v) W[k] = (W[k] || 0) + v; };
  // MakeHuman's ends are caricature; the real human range is about seven tenths of them
  const two = (v, dec, inc, k = 1) => { v = (v || 0) * k * 0.72; if (v < 0) add(dec, -v); else add(inc, v); };
  const aw = ageWeights(age);
  for (const k of ['baby', 'child', 'young', 'old']) add(`age/${sex}-${k}`, aw[k]);
  const adult = sstep(9, 18, age);
  add(`build/${sex}-muscle`, Math.max(0, Bd.muscle) * adult); add(`build/${sex}-lean`, Math.max(0, -Bd.muscle) * 0.8 * adult);
  add(`build/${sex}-heavy`, Math.max(0, Bd.fat) * (0.35 + 0.65 * adult)); add(`build/${sex}-thin`, Math.max(0, -Bd.fat) * (0.35 + 0.65 * adult));
  // the features of §3, each onto the targets that carry it (the people's mean first)
  const P = (k, v) => clamp((g[k] || 0) + (v || 0), -1.4, 1.4);
  const grown = 0.45 + 0.55 * adult;   // a child's face holds its features more softly
  two(P('faceLen', R.faceLen) * grown, 'head/head-scale-vert-decr', 'head/head-scale-vert-incr', 0.55);
  two(P('faceLen', R.faceLen) * grown, 'chin/chin-height-decr', 'chin/chin-height-incr', 0.7);
  two(P('jawW', R.jaw) * grown, 'chin/chin-bones-decr', 'chin/chin-bones-incr', 1);
  two(P('jawShape') * grown, 'head/head-triangular', 'head/head-square', 0.7);
  two(P('chin') * grown, 'chin/chin-prominent-decr', 'chin/chin-prominent-incr', 1);
  two(P('chinW') * grown, 'chin/chin-width-decr', 'chin/chin-width-incr', 1);
  two(P('cheekbones', R.cheek) * grown, 'cheek/cheek-bones-decr', 'cheek/cheek-bones-incr', 0.6);
  two(P('forehead'), 'forehead/forehead-scale-vert-decr', 'forehead/forehead-scale-vert-incr', 0.8);
  two(P('forehead'), 'forehead/forehead-trans-backward', 'forehead/forehead-trans-forward', 0.4);
  two(P('cheeks'), 'cheek/cheek-volume-decr', 'cheek/cheek-volume-incr', 0.55);
  two(P('eyeSize', R.eye), 'eyes/eye-scale-decr', 'eyes/eye-scale-incr', 0.5);
  two(P('eyeGap'), 'eyes/eye-trans-in', 'eyes/eye-trans-out', 0.7);
  two(P('eyeTilt'), 'eyes/eye-corner2-down', 'eyes/eye-corner2-up', 0.8);
  two(P('lids'), 'eyes/eye-eyefold-down', 'eyes/eye-eyefold-up', 0.9);
  two(P('eyeDepth'), 'eyes/eye-push1-in', 'eyes/eye-push1-out', 0.8);
  two(P('browRidge', R.brow) * grown, 'eyebrows/eyebrows-trans-backward', 'eyebrows/eyebrows-trans-forward', 0.9);
  two(P('browShape'), 'eyebrows/eyebrows-angle-down', 'eyebrows/eyebrows-angle-up', 0.6);
  two(P('noseLen') * grown, 'nose/nose-scale-vert-decr', 'nose/nose-scale-vert-incr', 0.7);
  two(P('noseBridge') * grown, 'nose/nose-hump-decr', 'nose/nose-hump-incr', 1);
  two(P('noseBridge') * grown, 'nose/nose-curve-concave', 'nose/nose-curve-convex', 0.4);
  two(P('noseTip'), 'nose/nose-point-up', 'nose/nose-point-down', 0.9);
  two(P('noseW'), 'nose/nose-scale-horiz-decr', 'nose/nose-scale-horiz-incr', 0.55);
  two(P('noseW'), 'nose/nose-nostrils-width-decr', 'nose/nose-nostrils-width-incr', 0.6);
  two(P('tipShape'), 'nose/nose-point-width-decr', 'nose/nose-point-width-incr', 0.9);
  two(P('mouthW'), 'mouth/mouth-scale-horiz-decr', 'mouth/mouth-scale-horiz-incr', 0.6);
  two(P('lips'), 'mouth/mouth-upperlip-volume-decr', 'mouth/mouth-upperlip-volume-incr', 0.8);
  two(P('lips'), 'mouth/mouth-lowerlip-volume-decr', 'mouth/mouth-lowerlip-volume-incr', 0.8);
  two(P('upperLip'), 'mouth/mouth-trans-up', 'mouth/mouth-trans-down', 0.7);
  two(P('bite'), 'chin/chin-prognathism-decr', 'chin/chin-prognathism-incr', 0.8);
  two(P('earSize'), 'ears/ear-scale-decr', 'ears/ear-scale-incr', 0.7);
  two(P('earSet'), 'ears/ear-wing-decr', 'ears/ear-wing-incr', 1);
  two(P('neck'), 'neck/neck-scale-horiz-decr', 'neck/neck-scale-horiz-incr', 0.6);
  // the people's own marks
  if (R.ear > 0.5) add('ears/ear-shape-pointed', 1);
  if (look.race === 'dwarf') { add('nose/nose-volume-incr', 0.6); add('neck/neck-scale-horiz-incr', 0.8); add('head/head-square', 0.4); }
  if (look.race === 'orc') { add('chin/chin-prognathism-incr', 0.8); add('nose/nose-flaring-incr', 0.8); add('nose/nose-hump-decr', 0.6); }
  if (look.race === 'elf') { add('head/head-oval', 0.5); add('chin/chin-width-decr', 0.5); }
  // the years in the face (§5): the soft cheek slides, the bags, the neck; the lean and old hollow
  add('head/head-age-incr', 0.55 * A.old + 0.25 * A.sag);
  add('eyes/eye-bag-incr', 0.7 * A.sag + 0.35 * Math.max(0, Bd.fat));
  add('neck/neck-double-incr', 0.7 * Math.max(0, Bd.fat) + 0.4 * A.sag * Math.max(0.3, Bd.fat + 0.6));
  add('head/head-fat-incr', 0.8 * Math.max(0, Bd.fat));
  add('head/head-fat-decr', 0.6 * Math.max(0, -Bd.fat) + 0.35 * A.old);
  add('forehead/forehead-temple-decr', 0.6 * A.old + 0.4 * Math.max(0, -Bd.fat));
  add('mouth/mouth-laugh-lines-in', 0.6 * A.sag);
  add('mouth/mouth-angles-down', 0.35 * A.sag + 0.2 * A.old - 0.25 * ((look.temper || {}).laugh || 0));
  add('mouth/mouth-upperlip-volume-decr', 0.5 * A.thin); add('mouth/mouth-lowerlip-volume-decr', 0.4 * A.thin);
  add('nose/nose-point-down', 0.4 * A.old);
  for (const k of Object.keys(W)) if (W[k] <= 0) delete W[k];
  return { W, A, Bd };
}

export function model(look) {
  const M = base(), mk = M.marks;
  const id = look.id ?? 'x', F = look.sex === 'F', age = look.age ?? 30;
  const { W, A, Bd } = featureWeights(look);
  const V = shape(W), nv = M.nv;
  const sx = sstep(11, F ? 17 : 19, age), fem = F ? sx : 0, mal = F ? 0 : sx;
  const R = PEOPLES[look.race] || PEOPLES.human;
  // ----- size: the body to its stature, the head to its own growth curve (a head hardly grows with height)
  const [b0, b1] = M.ranges.body;
  let ymin = 1e9, ymax = -1e9; for (let i = 0; i < nv; i++) { const y = V[i * 3 + 1]; if (y < ymin) ymin = y; if (y > ymax) ymax = y; }
  const grownH = (look.height || (F ? 162 : 174)) * 10 * (look.race === 'dwarf' ? 1 : 1);
  const stature = grownH * statureShare(age, F ? 'F' : 'M');
  const sAll = stature / (ymax - ymin);
  const chin0 = V[mk.chinV * 3 + 1], top0 = V[mk.topV * 3 + 1];
  const headWant = interp(HEADH, age) * (F ? lerp(1, 0.945, sx) : 1) * R.scale * Math.pow(grownH / (F ? 1620 : 1740), 0.12);
  const sHead = headWant / ((top0 - chin0) * sAll);
  const pivot = [0, chin0 - 0.12 * (top0 - chin0), V[mk.chinV * 3 + 2] - 0.55 * (top0 - chin0)];
  for (let i = 0; i < nv; i++) {
    const o = i * 3; let x = V[o], y = V[o + 1], z = V[o + 2];
    const w = sstep(chin0 - 0.32 * (top0 - chin0), chin0 + 0.02 * (top0 - chin0), y);
    const s = lerp(1, sHead, w);
    x = pivot[0] + (x - pivot[0]) * s; y = pivot[1] + (y - pivot[1]) * s; z = pivot[2] + (z - pivot[2]) * s;
    V[o] = x * sAll; V[o + 1] = (y - ymin) * sAll; V[o + 2] = z * sAll;
  }
  // ----- the head is its own size, so the rest of the body gives way to keep the stature true
  {
    let lo = 1e9, hi = -1e9; for (let i = 0; i < nv; i++) { const y = V[i * 3 + 1]; if (y < lo) lo = y; if (y > hi) hi = y; }
    const cy = V[mk.chinV * 3 + 1], k = (stature - (hi - cy)) / (cy - lo);
    for (let i = 0; i < nv; i++) { const y = V[i * 3 + 1]; V[i * 3 + 1] = y <= cy ? lo + (y - lo) * k : y + (lo + (cy - lo) * k - cy); }
  }
  // ----- the arms brought down from the sculptor's A-pose to hang at the sides (§5, the figure stands)
  {
    const ys = stature * lerp(0.79, 0.815, adultOf(age)), xs = stature * lerp(0.085, 0.104, adultOf(age)), zs = -0.012 * stature;
    const drop = (look.armDrop ?? 0.5);   // radians toward the body
    for (let i = 0; i < nv; i++) {
      const o = i * 3, x = V[o], y = V[o + 1], ax = Math.abs(x);
      if (y > ys + 0.05 * stature || y < 0.4 * stature) continue;
      const w = sstep(-0.02 * stature, 0.03 * stature, ax - xs - 0.18 * Math.max(0, ys - y) * 0.25) * sstep(ys + 0.05 * stature, ys - 0.01 * stature, y) ;
      const ww = Math.max(w, sstep(xs + 0.02 * stature, xs + 0.06 * stature, ax)) * sstep(0.4 * stature, 0.47 * stature, y);
      if (ww <= 0) continue;
      const s = x > 0 ? 1 : -1, a = -s * drop * ww, c = Math.cos(a), sn = Math.sin(a);
      const dx = x - s * xs, dy = y - ys;
      V[o] = s * xs + c * dx - sn * dy; V[o + 1] = ys + sn * dx + c * dy; V[o + 2] += (V[o + 2] - zs) * 0 ;
    }
  }
  // ----- frame: broad or slight shoulders and chest (§5)
  const chinY1 = V[mk.chinV * 3 + 1];
  if (Bd.frame) for (let i = 0; i < nv; i++) {
    const y = V[i * 3 + 1], w = sstep(chinY1 - 40 * sAll * 0, chinY1 - 80, y) * (1 - sstep(stature * 0.62, stature * 0.5, y)) * (1 - sstep(chinY1 - 30, chinY1 - 10, y));
    V[i * 3] *= 1 + 0.11 * Bd.frame * w * adultOf(age);
  }
  // ----- asymmetry (§3): a lower eye, a leaning nose, by a millimetre or two, hashed from the id
  const eyeC = side => helperCentre(M, V, side);
  const eL0 = eyeC(1), eR0 = eyeC(-1);
  const asE = 1.1 * hv(id, 'asymE'), asN = 0.9 * hv(id, 'asymN');
  for (let i = 0; i < nv; i++) {
    const o = i * 3, x = V[o], y = V[o + 1], z = V[o + 2];
    const dl = Math.hypot(x - eL0[0], y - eL0[1], z - eL0[2]);
    if (dl < 24) V[o + 1] += asE * (1 - dl / 24);
    const nt = V[mk.noseTipV * 3 + 1], dn = Math.hypot(x, y - nt + 8, z - V[mk.noseTipV * 3 + 2] + 10);
    if (dn < 26 && z > V[mk.noseTipV * 3 + 2] - 32) V[o] += asN * (1 - dn / 26);
  }
  // ----- the eye-line origin
  const eL = eyeC(1), eR = eyeC(-1), ox = (eL[0] + eR[0]) / 2, oy = (eL[1] + eR[1]) / 2, oz = (eL[2] + eR[2]) / 2;
  const feet = -oy;
  for (let i = 0; i < nv; i++) { V[i * 3] -= ox; V[i * 3 + 1] -= oy; V[i * 3 + 2] -= oz; }
  // ----- wounds that change the form (§7)
  const Wd = woundsOf(look, age), removed = new Uint8Array(M.nq);
  const P3 = i => [V[i * 3], V[i * 3 + 1], V[i * 3 + 2]];
  const headH = headWant, hs = headH / 225;
  const tip = P3(mk.noseTipV), chin = P3(mk.chinV);
  if (Wd.nose.amt) {
    // the bridge set to one side with a knot; a second break flattens it
    for (let i = 0; i < nv; i++) {
      const o = i * 3, y = V[o + 1], z = V[o + 2], x = V[o];
      if (Math.abs(x) > 24 * hs || z < tip[2] - 30 * hs || y > 14 * hs || y < tip[1] - 4) continue;
      const t = clamp((14 * hs - y) / (14 * hs - tip[1]), 0, 1), along = Math.sin(Math.PI * Math.min(1, t * 1.15));
      const front = sstep(tip[2] - 30 * hs, tip[2] - 8 * hs, z);
      V[o] += Wd.nose.side * Wd.nose.amt * 3.6 * hs * along * front;
      const knot = Math.exp(-Math.pow((t - 0.42) / 0.12, 2) - Math.pow(x / 7, 2)) * front;
      V[o + 2] += (1.8 - 2.6 * Math.max(0, Wd.nose.amt - 1)) * knot * hs;
      if (Wd.nose.amt > 1) { V[o + 2] -= 2.2 * along * front * hs; V[o] *= 1 + 0.12 * front * along; }
    }
  }
  for (const w of Wd.list) if (w.k === 'dent') {
    const c = [w.side * 46 * hs, -24 * hs, tip[2] - 36 * hs];
    for (let i = 0; i < nv; i++) { const o = i * 3, d = Math.hypot(V[o] - c[0], V[o + 1] - c[1], V[o + 2] - c[2]); if (d < 22 * hs) { const f = Math.pow(1 - d / (22 * hs), 2) * 6 * hs; V[o] -= w.side * f * 0.6; V[o + 2] -= f; } }
  }
  for (const w of Wd.list) if (w.k === 'burn') {
    // the skin drawn tight toward the burn's middle; it pulls the mouth's corner and the lower lid
    const c = burnCentre(w, hs, tip);
    for (let i = 0; i < nv; i++) { const o = i * 3, dx = V[o] - c[0], dy = V[o + 1] - c[1], d = Math.hypot(dx, dy); if (d < 34 * hs && V[o + 2] > c[2] - 40) { const f = (1 - d / (34 * hs)) * 0.1; V[o] -= dx * f; V[o + 1] -= dy * f; } }
  }
  const eyes = [1, -1].map(side => {
    const c = eyeC(side), rr = (side > 0 ? M.marks.eyes[0] : M.marks.eyes[1]).r * hs * sAll * 1.0;
    const ring = mk.lids[side > 0 ? 0 : 1].map(P3);
    let r = 0; { const [r0, r1] = M.ranges[side > 0 ? 'helper-l-eye' : 'helper-r-eye']; let mn = 1e9, mx = -1e9; for (let f = r0; f < r1; f++) for (let e = 0; e < 4; e++) { const v = M.quads[f * 4 + e]; mn = Math.min(mn, V[v * 3]); mx = Math.max(mx, V[v * 3]); } r = (mx - mn) / 2; }
    const cc = c;
    // split the lid margin into upper and lower by the line between its corners
    ring.sort((a, b) => a[0] - b[0]);
    const inner = side > 0 ? ring[0] : ring[ring.length - 1], outer = side > 0 ? ring[ring.length - 1] : ring[0];
    const lineY = x => lerp(inner[1], outer[1], (x - inner[0]) / ((outer[0] - inner[0]) || 1));
    const upper = ring.filter(p => p[1] >= lineY(p[0]) - 0.05), lower = ring.filter(p => p[1] < lineY(p[0]) - 0.05 || p === inner || p === outer);
    const sh = Wd.eye[side > 0 ? 'l' : 'r'];
    // the ball itself: a real eye's size (it hardly grows after two), set so the cornea fills the opening
    const er = 12 * lerp(0.8, 1, sstep(0, 7, age)) * (F ? 0.985 : 1);
    const marg = [...upper, ...lower], zf = marg.reduce((a, p) => a + p[2], 0) / (marg.length || 1);
    const cy = marg.reduce((a, p) => a + p[1], 0) / (marg.length || 1), cx = (inner[0] + outer[0]) / 2;
    const ec = [cx, cy, zf + 1.2 * hs - er];
    return { side, c: ec, r: er, upper, lower, inner, outer, shut: sh ? sh.how : null, iris: 5.9 * lerp(0.92, 1, sstep(0, 3, age)), pupil: 1.8 + 0.5 * sstep(1, 0, age) };
  });
  // a lost eye: the lids drawn shut over the empty socket and sunk
  for (const e of eyes) if (e.shut && e.shut !== 'blind') {
    const mid = x => lerp(e.inner[1], e.outer[1], clamp((x - e.inner[0]) / ((e.outer[0] - e.inner[0]) || 1), 0, 1)) - 0.6;
    for (let i = 0; i < nv; i++) {
      const o = i * 3, x = V[o], y = V[o + 1], z = V[o + 2];
      const d = Math.hypot(x - e.c[0], y - e.c[1], z - e.c[2]); if (d > e.r * 2.0 || z < e.c[2]) continue;
      const lim = Math.abs(x - e.c[0]) / (Math.abs(e.outer[0] - e.inner[0]) / 2 + 3); if (lim > 1.1) continue;
      const wv = clamp(1 - (d - e.r) / (e.r * 0.9), 0, 1) * clamp(1.1 - lim, 0, 1) / 1.1;
      V[o + 1] = lerp(y, mid(x), wv * 0.92); V[o + 2] = z - 2.6 * hs * wv;
    }
    e.upper = e.upper.map(p => [p[0], mid(p[0]), p[2] - 2.6 * hs]); e.lower = e.upper;
  }
  // half an ear: the upper ear gone, its edge ragged
  for (const [side, lost] of [[1, Wd.ear.l], [-1, Wd.ear.r]]) if (lost) {
    let cy = 0, n = 0; for (let i = 0; i < nv; i++) if (mk.earMask[i] && V[i * 3] * side > 0) { cy += V[i * 3 + 1]; n++; } cy /= n || 1;
    for (let f = b0; f < b1; f++) { let all = true, yy = 0; for (let e = 0; e < 4; e++) { const v = M.quads[f * 4 + e]; if (!mk.earMask[v] || V[v * 3] * side <= 0) all = false; yy += V[v * 3 + 1] / 4; } if (all && yy > cy - 2 + 4 * hv(id, 'ear' + f)) removed[f] = 1; }
  }
  // ----- the named points
  const corner = P3(mk.cornerL), lips = mk.lipsRing.map(P3).sort((a, b) => a[0] - b[0]);
  const stY = lips.filter(p => Math.abs(p[0]) < 6).reduce((s, p, _, a) => s + p[1] / a.length, 0) || corner[1];
  const mw = Math.abs(corner[0]);
  // the lips meet: the sculpted mouth is a little open, so its inner surfaces are drawn together (no dark slot)
  for (let i = 0; i < 13380; i++) {
    const o = i * 3, x = V[o], y = V[o + 1], z = V[o + 2];
    if (Math.abs(x) > mw + 3 * hs || Math.abs(y - stY) > 8 * hs) continue;
    const zf = corner[2] + 12 * hs * Math.sqrt(Math.max(0, 1 - Math.pow(x / (mw + 2 * hs), 2)));
    const t = sstep(zf - 1.5 * hs, zf - 4.5 * hs, z) * (1 - sstep(6 * hs, 8 * hs, Math.abs(y - stY)));
    if (t > 0) V[o + 1] = lerp(y, stY + (y - stY) * 0.12, t);
  }
  const nostril = P3(mk.nostrilV), top = P3(mk.topV);
  const eyeX = (eyes[0].c[0] - eyes[1].c[0]) / 2, browY = 15.5 * hs + 0.8 * fem - 1.2 * mal;
  const fw = eyeX / 31.5, fh = (chin[1] - 0) / -116;
  const marks = { browY, chinY: chin[1], chinZ: chin[2], top: top[1], eyeX, eyeY: 0, eyeZ: eyes[0].c[2], fw, fh, cr: hs, fem, mal, baby: 1 - sstep(0, 6, age), lean: Math.max(0, -Bd.fat), fat: Bd.fat, A, wounds: Wd, feet,
    nose: { tip, nostrils: nostril, alX: Math.abs(nostril[0]) + 2, nS: hs }, mouth: { w: mw, y: stY, z: corner[2] + 8, lips, corner }, headH, stature, sAll };
  const relief = lines(look, { X: x => x * fw, Y: y => y * fh, fw, fh, cr: hs, eyeX, eyeY: 0, eyes, stY, mw, snY: tip[1] - 8 * hs, tipY: tip[1], alX: marks.nose.alX, chinY: chin[1], browY, A, fem, mal, lean: marks.lean, fat: Bd.fat, nS: hs });
  for (const w of Wd.list) relief.push(...woundMarks(w, look, { X: x => x * fw, Y: y => y * fh, fw, fh, cr: hs, eyeX, eyes, stY, mw, chinY: chin[1], browY, age }));
  const brows = browsOf(look, eyes, hs, fem, mal, A, Wd, marks);
  return { id, sex: F ? 'F' : 'M', age, race: look.race || 'human', mesh: M, V, removed, eyes, brows, relief, marks, pivot: [0, chin[1] + 20 * hs, -40 * hs] };
}
const adultOf = age => sstep(10, 18, age);
function helperCentre(M, V, side) {
  const [r0, r1] = M.ranges[side > 0 ? 'helper-l-eye' : 'helper-r-eye']; const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
  for (let f = r0; f < r1; f++) for (let e = 0; e < 4; e++) { const v = M.quads[f * 4 + e]; for (let c = 0; c < 3; c++) { mn[c] = Math.min(mn[c], V[v * 3 + c]); mx[c] = Math.max(mx[c], V[v * 3 + c]); } }
  return [0, 1, 2].map(c => (mn[c] + mx[c]) / 2);
}
function burnCentre(w, hs, tip) { return w.place === 'jaw' ? [w.side * 42 * hs, -76 * hs, tip[2] - 40] : [w.side * 40 * hs, -26 * hs, tip[2] - 30]; }
// brows (§3 ridge, shape, weight): a band of hair the painter lays in strokes, set over the lid margin
function browsOf(look, eyes, hs, fem, mal, A, Wd, m) {
  const g = look.g || {};
  const w = (2.7 + 1.5 * (g.browWeight || 0) + 0.9 * mal - 0.5 * fem) * (1 - 0.35 * m.baby);
  const arch = 2.4 * (g.browShape || 0) + 1.6 * fem - 0.6 * mal;
  return eyes.map(e => {
    const s = e.side, top = Math.max(...e.upper.map(p => p[1]));
    const y0 = top + (7.5 + 1.2 * fem - 1.3 * mal - 1.6 * A.sag) * hs;
    const pts = [[e.c[0] - s * 15.5 * hs, y0 - 0.5 * hs], [e.c[0] - s * 5 * hs, y0 + 1.6 * hs + 0.5 * arch * hs], [e.c[0] + s * 6.5 * hs, y0 + 2.3 * hs + arch * hs], [e.c[0] + s * 17 * hs, y0 - 2.5 * hs + 0.3 * arch * hs]];
    return { side: s, pts, w: w * hs, gap: Wd.browGap[s > 0 ? 'l' : 'r'] };
  });
}


// ---------- relief lines of age (§5): every line has its place from the start; the years deepen it ----------
function lines(look, m) {
  const id = look.id ?? 'x', L = [], A = m.A, t = look.temper || {};
  const dLine = (amt) => Math.max(0, amt);
  const fr = 1 + 0.6 * (t.frown || 0), la = 1 + 0.6 * (t.laugh || 0);
  const push = (pts, w, depth, kind = 'line') => { if (depth > 0.02) L.push({ pts, w, depth, kind }); };
  // forehead: three or four, wavy, broken
  const fn = 3 + (hv(id, 'fhN') > 0.3 ? 1 : 0);
  for (let i = 0; i < fn; i++) {
    const y = m.browY + 20 + i * 9 + 2 * hv(id, 'fh' + i), span = 34 - i * 4 + 6 * hv(id, 'fs' + i);
    const pts = []; for (let k = 0; k <= 8; k++) { const x = -span + 2 * span * k / 8; pts.push([x * m.fw, y + 1.4 * Math.sin(k * 0.9 + 3 * hv(id, 'fw' + i)) + 0.004 * x * x]); }
    push(pts, 1.2, dLine(0.55 * (A.lines * 1.1 - 0.15 * i) + 0.25 * A.old) * (0.9 + 0.3 * hv(id, 'fd' + i)));
  }
  // between the brows
  for (const s of [1, -1]) push([[s * 4.5, m.browY - 4], [s * 6, m.browY + 9]], 1.0, dLine(0.5 * A.lines * fr + 0.3 * A.old - 0.25) * (1 + 0.4 * hv(id, 'gl' + s)));
  // crow's feet: three fanned at the outer corner
  for (const s of [1, -1]) for (let i = 0; i < 3; i++) {
    const a = -0.5 + i * 0.45 + 0.1 * hv(id, 'cf' + s + i), x0 = s * (m.eyeX + 19 * m.fw), y0 = m.eyeY + 1;
    push([[x0, y0 + 3 * Math.sin(a)], [x0 + s * 12 * Math.cos(a), y0 + 12 * Math.sin(a)]], 0.9, dLine(0.55 * A.lines * la + 0.3 * A.old - 0.1));
  }
  // under the eye
  for (const s of [1, -1]) push([[s * (m.eyeX - 8), m.eyeY - 9 - 2 * A.sag], [s * m.eyeX, m.eyeY - 12 - 3 * A.sag], [s * (m.eyeX + 12), m.eyeY - 9 - 2 * A.sag]], 1.3, dLine(0.5 * A.sag + 0.3 * A.lines - 0.1));
  // nose to mouth: the fold deepens with age and is there faintly from youth
  for (const s of [1, -1]) {
    const pts = [[s * (m.alX + 5), m.tipY + 4], [s * (m.alX + 9 + 3 * A.sag), m.stY + 8], [s * (m.mw + 6 + 3 * A.sag), m.stY - 4 - 5 * A.sag]];
    push(pts, 2.4 + 1.6 * A.sag, 0.25 + 0.9 * A.lines * la + 1.2 * A.sag + 0.3 * m.fat, 'fold');
  }
  // marionette lines and the corner of the mouth
  for (const s of [1, -1]) push([[s * (m.mw + 2), m.stY - 3], [s * (m.mw + 7), m.chinY + 12]], 1.8, dLine(1.1 * A.sag + 0.5 * A.old - 0.15), 'fold');
  // lip lines above the mouth
  for (let i = 0; i < 6; i++) { const x = (-15 + i * 6 + 2 * hv(id, 'll' + i)) * m.fw; push([[x, m.stY + 7], [x + 0.6, m.stY + 13]], 0.6, dLine(0.7 * A.old - 0.15)); }
  // the upper lid crease
  for (const e of m.eyes) {
    const up = [...e.upper].sort((a, b) => a[0] - b[0]); if (up.length < 3) continue;
    const off = (3.6 + 1.6 * ((look.g || {}).lids || 0) - 1.2 * A.sag) * m.cr;
    const pts = [0.08, 0.3, 0.55, 0.8, 0.95].map(t => { const p = up[Math.round(t * (up.length - 1))]; return [p[0], p[1] + off * Math.sin(Math.PI * (0.15 + 0.7 * t))]; });
    push(pts, 0.9 * m.cr, 0.45 + 0.25 * A.sag, 'crease');
  }
  // the cheek under the bone in the lean and old
  for (const s of [1, -1]) push([[s * m.X(54), m.Y(-20)], [s * m.X(48), m.Y(-55)]], 5, dLine(0.5 * m.lean + 0.6 * A.old - 0.1), 'fold');
  // neck rings
  for (let i = 0; i < 2; i++) push([[-30, m.chinY - 40 - i * 14], [0, m.chinY - 44 - i * 14], [30, m.chinY - 40 - i * 14]], 1.4, dLine(0.6 * A.sag + 0.3 * A.old - 0.2), 'neck');
  return L;
}

// ---------- wounds read from the look ----------
function woundsOf(look, age) {
  const W = { list: [], nose: { side: 0, amt: 0 }, eye: {}, ear: {}, browGap: {}, burn: [], pox: 0 };
  for (const w0 of look.wounds || []) {
    const at = w0.at || 'cheek_l', side = /_r$/.test(at) ? -1 : 1, place = at.replace(/_[lr]$/, '');
    if (w0.age != null && w0.age > age) continue;   // not yet
    const w = { ...w0, side, place, since: age - (w0.age ?? age) };
    W.list.push(w);
    if (w.k === 'nose') { W.nose.side = side; W.nose.amt = Math.min(1.6, W.nose.amt + 0.9); }
    if (w.k === 'eye') W.eye[side > 0 ? 'l' : 'r'] = { how: w.how || 'shut' };
    if (w.k === 'ear') W.ear[side > 0 ? 'l' : 'r'] = 1;
    if (w.k === 'cut' && (place === 'brow' || place === 'eye')) W.browGap[side > 0 ? 'l' : 'r'] = 1;
    if (w.k === 'burn') W.burn.push(w);
    if (w.k === 'pox') W.pox = 1;
  }
  return W;
}

// a wound's marks on the skin: troughs with raised lips, puckers, pits, mottles
function woundMarks(w, look, m) {
  const out = [], s = w.side, id = (look.id ?? 'x') + '|' + w.k + '|' + w.at + '|' + (w.n || 1);
  const H = healing(w.since);
  const jag = (pts, amp) => pts.map((p, i) => [p[0] + amp * hv(id, 'jx' + i), p[1] + amp * hv(id, 'jy' + i)]);
  const base = { heal: H, kind: 'scar', wound: w.k };
  if (w.k === 'cut') {
    let pts;
    if (w.place === 'brow' || w.place === 'eye') pts = [[s * (m.eyeX + 6), m.browY + 16], [s * (m.eyeX + 2), m.browY + 2], [s * (m.eyeX - 3), m.eyes[0].c[1] - 9], [s * (m.eyeX - 6), m.eyes[0].c[1] - 20]];
    else if (w.place === 'cheek') pts = [[s * m.X(58), m.Y(-6)], [s * m.X(44), m.Y(-30)], [s * m.X(30), m.Y(-48)]];
    else if (w.place === 'lip') pts = [[s * 9, m.stY + 14], [s * 11, m.stY - 2], [s * 13, m.stY - 10]];
    else if (w.place === 'jaw') pts = [[s * m.X(54), m.Y(-60)], [s * m.X(34), m.chinY + 4], [s * m.X(16), m.chinY - 6]];
    else if (w.place === 'forehead') pts = [[s * 34, m.browY + 52], [s * 10, m.browY + 34], [s * -6, m.browY + 26]];
    else if (w.place === 'chin') pts = [[s * 16, m.chinY + 8], [s * 2, m.chinY - 4]];
    else pts = [[s * 30, -30], [s * 20, -50]];
    out.push({ ...base, pts: jag(pts, 1.2), w: 1.9 + 1.0 * H.fresh - 0.4 * H.thin, depth: 1.5 + 0.8 * H.fresh });
  } else if (w.k === 'burn') {
    const c = w.place === 'cheek' ? [s * m.X(40), m.Y(-24)] : w.place === 'jaw' ? [s * m.X(42), m.Y(-74)] : [s * m.X(34), m.Y(-30)];
    out.push({ ...base, kind: 'burn', c, r: [26, 22], depth: 0.8 });
  } else if (w.k === 'pox') {
    out.push({ ...base, kind: 'pox', c: [0, m.Y(-28)], r: [62, 34], depth: 1.4 });
  } else if (w.k === 'arrow') {
    out.push({ ...base, kind: 'star', c: [s * m.X(40), m.Y(-34)], r: [7, 7], depth: 1.4 });
  } else if (w.k === 'eye') {
    // a scar round the lid
    out.push({ ...base, pts: jag([[s * (m.eyeX - 8), m.browY + 8], [s * (m.eyeX + 3), m.browY - 6], [s * (m.eyeX + 6), -14], [s * (m.eyeX + 3), -24]], 1), w: 1.4, depth: 0.9 });
  } else if (w.k === 'ear') {
    out.push({ ...base, kind: 'ear', depth: 0 });
  } else if (w.k === 'brand') {
    out.push({ ...base, kind: 'brand', c: [s * m.X(44), m.Y(-30)], r: [8, 8], depth: -0.6 });
  }
  return out;
}

// rotation helpers (row-major), local so the module stands alone
export function rotXm(a) { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; }
export function rotYm(a) { const c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 1, 0, -s, 0, c]; }
export function rotZm(a) { const c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, s, c, 0, 0, 0, 1]; }
export function mmulm(A, B) { const R = new Array(9); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) R[i * 3 + j] = A[i * 3] * B[j] + A[i * 3 + 1] * B[3 + j] + A[i * 3 + 2] * B[6 + j]; return R; }
