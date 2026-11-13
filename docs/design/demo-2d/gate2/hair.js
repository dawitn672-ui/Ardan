// Gate 2 · hair and beards. A style is DATA: a cap (the mass on the skull) and groups of locks placed by where their
// TIPS fall (a fringe across the brow, tufts past the outline, curtains down the cheeks); one renderer reads them all.
// A lock is a blade with its own outline, so where locks overlap, the line work of the clumps draws itself.
import { lerp, clamp, sstep, add, sub, mul, mix, norm, perp, len, rad, dir, spl, splPts, polyline, ell, offset, ink, taper, fade, part, along, blade, stream, mixc, n1 } from './g.js';

// cap: vol (lift on top), side (lift at the sides), sideV (how far down the sides reach, mm from the eye line)
// fringe: tips in a row across the forehead at height v (zig = how ragged, edge = how much lower at the temples, sweep = combed aside)
// side: tips down the temples. tuft: tips past the outline. back: locks combed back off the brow.
// curtain: long locks from the parting down each cheek to `to`. mass: the hair behind the shoulders, down to `to`.
export const HAIRS = {
  bald:       { name: 'Shaved', cap: null },
  stubble:    { name: 'Cropped to the skull', cap: { vol: 2.5, side: 1.5, sideV: -6, flat: 1 } },
  cropped:    { name: 'Cropped', cap: { vol: 6, side: 4, sideV: -4 }, fringe: { n: 9, v: -50, zig: 4, span: 50, w: [15, 19], root: .45, bend: .06 }, tuft: { n: 10, out: [3, 8], w: [14, 18] } },
  messy:      { name: 'Short and tousled', part: 10, cap: { vol: 13, side: 8, sideV: 4 }, fringe: { n: 8, v: -27, zig: 9, edge: 8, span: 56, w: [22, 28], root: .2, bend: .16 }, side: { n: 3, v: [-12, 22], w: [17, 21], out: 6 }, tuft: { n: 9, out: [5, 13], w: [18, 24], bend: .22, swirl: 9 }, fly: 5 },
  spiky:      { name: 'Short and spiked', part: 0, cap: { vol: 12, side: 5, sideV: -6 }, fringe: { n: 7, v: -46, zig: 7, span: 50, w: [16, 20], root: .4, bend: .08 }, tuft: { n: 13, out: [14, 30], w: [15, 20], bend: .1, swirl: 6 }, side: { n: 2, v: [-20, 0], w: [13, 16], out: 3 } },
  sidepart:   { name: 'Side parting', part: -30, cap: { vol: 10, side: 6, sideV: 0 }, fringe: { n: 7, v: -34, zig: 5, edge: -6, span: 54, w: [22, 28], root: .18, bend: .2, sweep: .5 }, side: { n: 3, v: [-14, 12], w: [16, 20], out: 4 }, tuft: { n: 5, out: [3, 8], w: [18, 22], swirl: 20 } },
  swept:      { name: 'Swept back', part: 0, cap: { vol: 12, side: 6, sideV: 0 }, back: { n: 9, w: [16, 22] }, side: { n: 3, v: [-22, 2], w: [14, 18], out: 3, backward: 1 }, nape: { n: 4, len: [20, 32] } },
  curtain:    { name: 'Parted, to the ears', part: 0, cap: { vol: 9, side: 8, sideV: 6 }, curtain: { n: 3, to: 44, w: [20, 26], wave: .2, flare: 4, tipIn: 1 }, nape: { n: 4, len: [26, 36] } },
  bowl:       { name: 'Bowl cut', part: 0, cap: { vol: 10, side: 9, sideV: 14 }, fringe: { n: 12, v: -30, zig: 1.5, edge: 2, span: 60, w: [15, 17], root: .5, bend: .03 }, side: { n: 5, v: [-20, 26], w: [14, 16], out: 5, inward: 1 } },
  shoulder:   { name: 'Loose to the shoulder', part: 6, cap: { vol: 9, side: 8, sideV: 0 }, curtain: { n: 3, to: 150, w: [24, 30], wave: .5, flare: 10 }, mass: { to: 150, wave: .5, flare: 12 }, fly: 5 },
  tied:       { name: 'Tied back', part: 0, cap: { vol: 8, side: 5, sideV: -2 }, back: { n: 8, w: [16, 20] }, tail: { to: 150, w: 26, side: 1 }, fly: 3 },
  topknot:    { name: 'Topknot', part: 0, cap: { vol: 6, side: 4, sideV: -4 }, back: { n: 8, w: [15, 19] }, knot: { r: 17, up: 16 } },
  tonsure:    { name: 'Tonsured', part: 0, cap: { vol: 6, side: 6, sideV: 6, bare: 1, ring: 1 }, fringe: { n: 11, v: -46, zig: 2, span: 56, w: [13, 16], root: .6, bend: .04 }, side: { n: 3, v: [-10, 12], w: [13, 16], out: 3 } },
  balding:    { name: 'Thin on top', part: 0, cap: { vol: 3, side: 1.5, sideV: 0, bare: 1 } },
  crest:      { name: 'Shaved sides, a crest', part: 0, cap: { vol: 16, side: 1, sideV: -34, narrow: .52 }, fringe: { n: 5, v: -48, zig: 8, span: 26, w: [16, 20], root: .3, bend: .2, sweep: .3 }, tuft: { n: 8, out: [10, 24], w: [14, 18], swirl: 14, span: .5 } },
  coily:      { name: 'Coily, short', cap: { vol: 12, side: 9, sideV: -4, coil: 1 } },
  coilyfull:  { name: 'Coily, full', cap: { vol: 30, side: 24, sideV: 6, coil: 1 } },
  locs:       { name: 'Locks', part: 0, cap: { vol: 9, side: 7, sideV: 0 }, curtain: { n: 5, to: 130, w: [10, 12], wave: .12, flare: 8, rope: 1 }, mass: { to: 120, wave: .1, flare: 8, rope: 1 } },
  long:       { name: 'Long and straight', part: 4, cap: { vol: 8, side: 7, sideV: 0 }, curtain: { n: 3, to: 300, w: [26, 34], wave: .1, flare: 6 }, mass: { to: 330, wave: .1, flare: 10 }, fly: 7 },
  wavy:       { name: 'Long and waved', part: -8, cap: { vol: 11, side: 10, sideV: 0 }, curtain: { n: 3, to: 270, w: [28, 36], wave: 1, flare: 14 }, mass: { to: 290, wave: 1, flare: 20 }, fly: 8 },
  curls:      { name: 'Long curls', part: 6, cap: { vol: 14, side: 13, sideV: 0 }, curtain: { n: 4, to: 200, w: [26, 32], wave: 2.2, flare: 20 }, mass: { to: 220, wave: 2.2, flare: 28 }, fly: 6 },
  bob:        { name: 'Cut at the jaw', part: 0, cap: { vol: 9, side: 9, sideV: 0 }, fringe: { n: 11, v: -24, zig: 2, edge: 3, span: 52, w: [15, 18], root: .45, bend: .04 }, curtain: { n: 3, to: 72, w: [26, 32], wave: .1, flare: 8, tipIn: 1 }, mass: { to: 76, wave: 0, flare: 8 } },
  braid:      { name: 'One braid over the shoulder', part: 6, cap: { vol: 8, side: 6, sideV: 0 }, curtain: { n: 2, to: 30, w: [24, 30], wave: .3, flare: 2, tuck: 1 }, braid: { n: 1, to: 300, w: 30 } },
  braids:     { name: 'Two braids', part: 0, cap: { vol: 8, side: 6, sideV: 0 }, curtain: { n: 2, to: 24, w: [22, 28], wave: .2, flare: 2, tuck: 1 }, braid: { n: 2, to: 250, w: 24 } },
  crownbraid: { name: 'Braided crown', part: 0, cap: { vol: 9, side: 6, sideV: 0 }, curtain: { n: 2, to: 16, w: [22, 28], wave: .2, flare: 0, tuck: 1 }, band: { w: 15 } },
  bun:        { name: 'Coiled at the nape', part: -6, cap: { vol: 8, side: 6, sideV: 0 }, curtain: { n: 2, to: 20, w: [24, 30], wave: .3, flare: 0, tuck: 1 }, bunLow: { r: 30 } },
  buns:       { name: 'Coiled over the ears', part: 0, cap: { vol: 7, side: 5, sideV: -4 }, curtain: { n: 2, to: 4, w: [22, 28], wave: .2, flare: 0, tuck: 1 }, earBuns: { r: 24 } },
  ponytail:   { name: 'High tail', part: 10, cap: { vol: 8, side: 5, sideV: -2 }, fringe: { n: 6, v: -30, zig: 10, edge: 14, span: 52, w: [18, 24], root: .2, bend: .2 }, tail: { to: 240, w: 34, side: 1, high: 1 }, fly: 6 },
  pigtails:   { name: 'Two tails', part: 0, cap: { vol: 8, side: 5, sideV: 0 }, fringe: { n: 9, v: -28, zig: 5, edge: 4, span: 52, w: [16, 20], root: .4, bend: .08 }, tails: { to: 150, w: 26 } },
};
export const BEARDS = {
  none: { name: 'Clean-shaven' }, stubble: { name: 'Stubble', shade: .2 }, moustache: { name: 'Moustache', mo: 1 }, handlebar: { name: 'Long moustache', mo: 1.7 },
  goatee: { name: 'Chin beard', mo: 1, chin: 16 }, chinstrap: { name: 'Jaw-line beard', band: 9, ext: 3, lock: 5 }, short: { name: 'Short beard', mo: 1, band: 26, ext: 6, lock: 8 },
  full: { name: 'Full beard', mo: 1.2, band: 34, ext: 16, lock: 16 }, long: { name: 'Long beard', mo: 1.4, band: 36, ext: 22, lock: 20, hang: 110 }, forked: { name: 'Forked beard', mo: 1.3, band: 30, ext: 12, lock: 12, fork: 80 },
  chops: { name: 'Side whiskers', band: 26, ext: 6, lock: 8, open: 1 },
};

// make the hair's shapes for one head; drawHair then puts them in their layers
export function buildHair(Hd, F, look, hc) {
  const st = HAIRS[look.hair] || HAIRS.cropped, { D, hp, P, s } = Hd, r = stream(look.id || 'x', 'hair|' + look.hair);
  const H = { st, cap: null, locks: [], back: [], shadow: [], extra: [], fly: [], hc };
  if (!st.cap) return H;
  const g = look.g || {}, thick = 1 + .2 * (g.hairThick || 0) - .22 * D.old, c = st.cap, vol = c.vol * thick, sd = c.side * thick, nar = c.narrow || 1;
  const rec = clamp((g.hairline || 0) * .5 + D.old * .45 * (D.male ? 1 : .25), 0, 1), hv = D.hairV - 6 * rec, pu = st.part || 0;
  const cyc = D.crown * .47, Rx = D.cran + sd, Ry = -D.crown * .53 + vol;
  const outer = sg => [[sg * D.cran * .5 * nar, D.crown - vol * .93 + 6, -10], [sg * (D.cran * .9 + vol * .5) * nar, D.crown + 28 - vol * .35, -12], [sg * Rx * nar, cyc, -12], [sg * (D.zyg + 3.5 + sd * .9) * nar, -22, 20], [sg * (D.zyg + 2.5 + sd * .75) * (c.sideV < -10 ? nar : 1), c.sideV, 18]];
  const inner = sg => [[sg * (D.zyg - 4), c.sideV - 1, 34], [sg * (D.zyg - 8 - rec * 5), -26, 44], [sg * (41 + D.templeW - rec * 8), hv + 14 + rec * 5, 62], [sg * 20, hv + 2.5, 80]];
  const ring = [[0, D.crown - vol, -8], ...outer(1), ...inner(1), [0, hv + 1.5, 84], ...inner(-1).reverse(), ...outer(-1).reverse()];
  const pp = ring.map(p => hp(p[0], p[1], p[2]));
  H.cap = spl(pp, true, ring.map((_, i) => (i === 5 || i === ring.length - 5 ? .5 : 1)));
  H.capPts = pp; H.top = hp(0, D.crown - vol, -8);
  if (c.bare) { // a bare crown: only the band round the sides and back is left
    const top = c.ring ? D.crown + 34 : cyc - 6;
    H.cap = null; H.sideCaps = [1, -1].map(sg => spl([[sg * D.cran * .8, top - 22, -16], [sg * (Rx - .5), cyc + 2, -12], [sg * (D.zyg + 3.5 + sd * .9), -22, 20], [sg * (D.zyg + 2.5 + sd * .75), c.sideV, 18], [sg * (D.zyg - 4), c.sideV - 1, 34], [sg * (D.zyg - 9), -27, 42], [sg * (D.cran * .84), top + 2, 16]].map(p => hp(p[0], p[1], p[2])), true, [.5, 1, 1, .6, .6, 1, 1]));
    if (c.ring) H.ringBand = splPts([[-(D.cran * .8 + sd), top + 2, -16], [-D.cran * .5, hv + 4, 60], [0, hv + 8, 82], [D.cran * .5, hv + 4, 60], [D.cran * .8 + sd, top + 2, -16]].map(p => hp(p[0], p[1], p[2])), false, 1, 6);
  }
  // one lock, root and tip given in head space; dw lifts it off the skull
  const L = (root, tip, w, bend, z = 'locks', dw = 3, sh = false) => {
    const a = P(root[0], root[1], dw), b = P(tip[0], tip[1], dw + 1), bl = blade(a, b, w * s * thick, bend, .45);
    bl.w = w * s * thick; bl.len = len(sub(b, a)); H[z].push(bl); if (sh) H.shadow.push(bl.d); return bl;
  };
  const f = st.fringe;
  if (f) {
    const n = f.n, rootV = hv - 26, idx = [...Array(n).keys()], order = [...idx.filter(i => i % 2), ...idx.filter(i => !(i % 2))];
    for (const i of order) {
      const t = n === 1 ? .5 : i / (n - 1), q = 2 * t - 1, tu = lerp(-f.span, f.span, t) + r.s() * 3 + (f.sweep || 0) * 16;
      const tv = f.v + (i % 2 ? 1 : -1) * f.zig * (.4 + .6 * r()) + (f.edge || 0) * q * q - 7 * rec;
      const root = [pu + (tu - pu) * f.root - (f.sweep || 0) * 18, rootV + q * q * 10];
      L(root, [tu, tv], lerp(f.w[0], f.w[1], r()), (f.sweep ? -Math.sign(f.sweep) : (tu > pu ? -1 : 1)) * f.bend * (.7 + .6 * r()), 'locks', 4, true);
    }
  }
  if (st.back) for (let i = 0; i < st.back.n; i++) {
    const t = i / (st.back.n - 1), q = 2 * t - 1, u = q * (44 + D.templeW);
    L([u * .8, cyc - Ry * .75 + Math.abs(q) * 22], [u, hv + 3 + q * q * 13], lerp(st.back.w[0], st.back.w[1], r()), q * -.08, 'locks', 2);
  }
  if (st.side) for (const sg of [-1, 1]) for (let i = 0; i < st.side.n; i++) {
    const g2 = st.side, t = (i + .5) / g2.n, tip = [sg * (D.zyg + sd * .6 + g2.out * (.4 + .6 * r()) - (g2.inward ? 6 * t : 0)), lerp(g2.v[0], g2.v[1], t)];
    const root = g2.backward ? [sg * (D.zyg - 8), tip[1] - 6] : [sg * D.cran * .62, cyc - 14 + t * 22];
    if (g2.backward) L(root, [sg * (D.zyg + sd + 4), tip[1] - 14], lerp(g2.w[0], g2.w[1], r()), sg * .1, 'locks', 0);
    else L(root, tip, lerp(g2.w[0], g2.w[1], r()), sg * (g2.inward ? .14 : -.14), 'locks', 0, true);
  }
  const tf = st.tuft;
  if (tf) for (let i = 0; i < tf.n; i++) {
    const span = (tf.span || 1) * 112, a = rad(lerp(-span, span, (i + .5) / tf.n) + r.s() * 5), sw = rad((tf.swirl || 0) * (.5 + r())), out = lerp(tf.out[0], tf.out[1], r());
    L([Math.sin(a) * Rx * .7 * nar, cyc - Math.cos(a) * Ry * .72], [Math.sin(a + sw) * (Rx * nar + out), cyc - Math.cos(a + sw) * (Ry + out)], lerp(tf.w[0], tf.w[1], r()), (tf.bend || .1) * (i % 2 ? 1 : -1), 'locks', -6);
  }
  if (st.nape) for (const sg of [-1, 1]) for (let i = 0; i < st.nape.n; i++) { const a = hp(sg * (D.zyg - 4 - i * 6), 22 + i * 4, -30), ln = lerp(st.nape.len[0], st.nape.len[1], r()) * s; H.back.push(blade(a, add(a, mul(dir(rad(sg * (10 + i * 8) + r.s() * 5)), ln)), 12 * s * thick, sg * .12)); }
  // long hair: the mass behind the shoulders, then curtains from the parting down each cheek
  const wob = (v, k, ph) => Math.sin(v * (.022 + .012 * k) + ph) * k * 7;
  const ms = st.mass;
  if (ms) {
    const ph = r() * 6, edge = sg => [[Rx * .8, cyc - Ry * .55], [Rx * 1.0, -30], [D.zyg + sd + 9, 30], [D.zyg + sd + 12 + ms.flare, ms.to * .5], [D.zyg + sd + 8 + ms.flare * 1.2, ms.to * .86]].map(p => [sg * (p[0] + wob(p[1], ms.wave, ph + sg)), p[1]]);
    const m = ms.rope ? 9 : 7, tips = []; const half = D.zyg + sd + ms.flare * 1.2;
    for (let k = 0; k <= m * 2; k++) tips.push([lerp(half, -half, k / (m * 2)), ms.to - (k % 2 ? 0 : 20 + r() * 12) - Math.abs(k - m) * 1.5]);
    const pts = [...edge(1), ...tips, ...edge(-1).reverse()].map(p => hp(p[0], p[1], -42));
    H.back.push({ d: spl(pts, true, .85), mass: 1 });
    for (let k = 1; k < m * 2; k += 2) { const tp = tips[k], top = [tp[0] * .55, 10]; H.back.push({ line: ink(splPts([hp(top[0], top[1], -42), hp(lerp(top[0], tp[0], .6) + wob(ms.to * .5, ms.wave, ph + k), lerp(top[1], tp[1], .55), -42), hp(tp[0], tp[1] - 26, -42)]), fade(1.2 * s)) }); }
  }
  const cu = st.curtain;
  if (cu) for (const sg of [-1, 1]) for (let j = cu.n - 1; j >= 0; j--) {
    const ph = r() * 6, w = lerp(cu.w[0], cu.w[1], r()), to = cu.tuck ? Math.max(cu.to, -4) + j * 6 : cu.to * (1 - .12 * j) + r.s() * 5, fl = cu.flare;
    const gpts = [[pu + sg * 2, hv - 26, 0], [sg * (24 + 9 * j) + pu * .4, hv - 8 + 4 * j, 1], [sg * (D.zyg - 9 + 5 * j), -14 + 5 * j, 2], [sg * (D.zyg + 1 + 4 * j), Math.min(26, to * .5), 3]];
    if (!cu.tuck && to > 50) gpts.push([sg * (D.zyg + 1 + 4 * j + fl * .5), Math.min(to * .55, 100), 4]);
    if (!cu.tuck && to > 120) gpts.push([sg * (D.zyg - 4 + 6 * j + fl), to * .78, 5]);
    gpts.push(cu.tuck ? [sg * (D.zyg + 5), to, 6] : [sg * (D.zyg - 2 + 5 * j + fl * (cu.tipIn ? -.6 : 1.1)), to, 6]);
    const pts = gpts.map((p, i) => { const u = p[0] + (i > 2 ? wob(p[1], cu.wave, ph) * (i / gpts.length) : 0); return i < 3 ? P(u, p[1], 5) : hp(u, p[1], lerp(34, 16, clamp((p[1] - 20) / 100))); });
    const c2 = splPts(pts, false, 1, 6), prof = q => w * s * thick * (q < .16 ? lerp(.62, 1, q / .16) : cu.rope ? 1 - .2 * q : q > .62 ? Math.sqrt(clamp((1 - q) / .38)) * .96 + .04 : 1);
    const b = { d: ink(c2, prof), c: c2, w: w * s * thick, rope: cu.rope }; H.extra.push(b); H.shadow.push(b.d);
  }
  if (st.fly) for (let i = 0; i < st.fly; i++) { const a = rad(lerp(-100, 100, r())), p0 = hp(Math.sin(a) * Rx, cyc - Math.cos(a) * Ry, -10), p1 = add(p0, mul([Math.sin(a + r.s() * .6), -Math.cos(a + r.s() * .6)], (12 + r() * 16) * s)); H.fly.push(ink(splPts([p0, add(mix(p0, p1, .5), [r.s() * 4 * s, 2 * s]), p1]), fade(.9 * s))); }
  // gathered hair: tails, braids, knots
  const rope = (pts, w, z) => { const c2 = splPts(pts, false, 1, 5); H[z].push({ d: ink(c2, q => w * (q < .1 ? lerp(.6, 1, q / .1) : Math.sqrt(clamp(1.03 - q)))), c: c2, w }); };
  const plait = (pts, w, z) => { const c2 = splPts(pts, false, 1, 6), n = Math.max(5, Math.round(len(sub(pts[0], pts[pts.length - 1])) / (w * .62))); for (let i = 0; i < n; i++) { const a = along(c2, i / n), b = along(c2, (i + 1.25) / n), sg = i % 2 ? 1 : -1, nn = norm(perp(sub(b, a))), k = 1 - .35 * (i / n); H[z].push({ d: spl([add(a, mul(nn, sg * w * .08 * k)), add(mix(a, b, .35), mul(nn, sg * w * .55 * k)), add(b, mul(nn, sg * w * .2 * k)), add(mix(a, b, .6), mul(nn, -sg * w * .12 * k))], true), braid: 1 }); } const e = along(c2, 1); H[z].push(blade(e, add(e, [0, w * 1.1]), w * .7, 0)); };
  const shx = i => F.sh[i][0];
  if (st.tail) { const sg = st.tail.side, a = st.tail.high ? hp(sg * 34, D.crown + 12, -70) : hp(sg * 14, 30, -70); rope([a, add(a, [sg * 40 * s, 26 * s]), hp(sg * (D.zyg + 30), 70, -60), hp(sg * (D.zyg + 18), st.tail.to, -50)], st.tail.w * s * thick, 'back'); }
  if (st.tails) for (const sg of [-1, 1]) { const a = hp(sg * (D.zyg + 2), 4, -20); rope([a, add(a, [sg * 22 * s, 16 * s]), hp(sg * (D.zyg + 24), 70, -20), hp(sg * (D.zyg + 14), st.tails.to, -16)], st.tails.w * s * thick, 'extra'); }
  if (st.braid) for (const sg of st.braid.n === 1 ? [1] : [-1, 1]) { const i = sg > 0 ? 1 : 0, a = hp(sg * (D.zyg + 3), 24, -14), end = st.braid.n === 1 ? [F.cxS + sg * F.chestHalf * .5, F.y.chest + F.B * .1] : [F.cxS + sg * F.chestHalf * .62, F.y.chest + F.B * .03]; plait([a, hp(sg * (D.zyg + 6), 70, 0), [lerp(shx(i), F.cxS, .42), F.y.sh + F.Hh * .1], end], st.braid.w * s * thick, 'extra'); }
  if (st.knot) H.knot = { c: hp(0, D.crown - vol - st.knot.up * .4, -30), r: st.knot.r * s };
  if (st.bunLow) H.bun = { c: hp(22, 36, -90), r: st.bunLow.r * s };
  if (st.earBuns) H.buns = [-1, 1].map(sg => ({ c: hp(sg * (D.zyg + 9), 12, 4), r: st.earBuns.r * s }));
  if (st.band) H.band = splPts([hp(-D.cran * .9, -50, -6), P(-42, D.crown + 22, -6), P(0, D.crown + 12, -4), P(42, D.crown + 22, -6), hp(D.cran * .9, -50, -6)], false, 1, 6);
  return H;
}

const dots = (pts, rad2) => { let d = ''; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = rad2(i); d += `M${n1(p[0] - q)} ${n1(p[1])}a${n1(q)} ${n1(q)} 0 1 0 ${n1(2 * q)} 0a${n1(q)} ${n1(q)} 0 1 0 ${n1(-2 * q)} 0`; } return d; };

export function drawHair(S, Hd, F, look, H) {
  const { hc, st } = H, { s, D, P, hp } = Hd, lod = S.lod, r = stream(look.id || 'x', 'hairdraw'), grey = clamp(look.grey ?? 0);
  if (!st.cap) return;
  const hi = mixc(hc.b, hc.l, .62), col = () => (grey > 0 && r() < grey ? mixc(hc.b, '#bfbfc6', .72) : hc.b);
  // behind the neck and shoulders
  S.layer('backHair');
  for (const b of H.back) {
    if (b.line) { S.fill(b.line, hc.k, { op: .6 }); continue; }
    S.both(b.d, b.mass ? mixc(hc.b, hc.s, .6) : hc.s, hc.k, 1.05);
    if (b.c && lod > 0) S.fill(ink(part(b.c, .1, .85), S.lw(.8)), hc.k, { op: .5 });
  }
  if (H.bun) { S.both(ell(H.bun.c, H.bun.r, H.bun.r * .86), hc.s, hc.k, 1); S.stroke(ell(H.bun.c, H.bun.r * .55, H.bun.r * .45), hc.k, .8, { op: .6 }); }
  S.layer('hair');
  if (H.knot) { S.both(ell(H.knot.c, H.knot.r, H.knot.r * .9), hc.b, hc.k, 1); S.stroke(ell(H.knot.c, H.knot.r * .55, H.knot.r * .45), hc.k, .8, { op: .6 }); }
  if (H.buns) for (const b of H.buns) { S.both(ell(b.c, b.r * .8, b.r), hc.b, hc.k, 1); for (const k of [.7, .42]) S.stroke(ell(b.c, b.r * .8 * k, b.r * k), hc.k, .8, { op: .65 }); S.fill(ell(add(b.c, [-b.r * .2, -b.r * .3]), b.r * .3, b.r * .2), hi, { op: .6 }); }
  const cap = H.cap ? [H.cap] : H.sideCaps || [];
  let coil = null;
  if (st.cap.coil) { // coily hair grows out, not down: a scalloped edge and small turned marks, never locks
    const edge = splPts(H.capPts, true, 1, 3); coil = dots(edge, () => (3.4 + r() * 2.4) * s);
    S.fill(coil, hc.b); S.stroke(coil, hc.k, 1);
  }
  const capCol = grey > 0 ? mixc(hc.b, '#b4b4bb', grey * .7) : hc.b;
  for (const d of cap) st.cap.coil ? S.fill(d, capCol) : S.both(d, capCol, hc.k, 1.1);
  for (const d of cap) S.within(coil ? [d, coil] : d, () => {
    const top = H.top || P(0, D.crown, 0);
    S.fill(d, S.lin(add(top, [0, 34 * s]), add(top, [30 * s, 130 * s]), [[0, hc.s, 0], [1, hc.s, .95]]));
    S.fill(ell(add(top, [-14 * s, 30 * s]), 46 * s, 13 * s, -.12), hi, { op: .5, filter: S.blur(5 * s) });
    if (st.cap.flat) { const pts = []; for (let i = 0; i < 90; i++) pts.push(P(r.s() * D.cran, lerp(D.crown, -20, r()), -6)); S.fill(dots(pts, () => .8 * s), hc.k, { op: .35 }); }
    if (st.cap.coil) for (let i = 0; i < (lod > 0 ? 170 : 60); i++) { const p = hp(r.s() * (D.cran + st.cap.side), lerp(D.crown - st.cap.vol, st.cap.sideV, r()), -6), q = (1.6 + r() * 1.8) * s, a = r() * 6.28; S.stroke(`M${n1(p[0])} ${n1(p[1])}a${n1(q)} ${n1(q)} 0 0 1 ${n1(Math.cos(a) * q * 1.6)} ${n1(Math.sin(a) * q * 1.6)}`, i % 3 ? hc.k : hc.l, .9, { op: .6 }); }
  });
  if (H.ringBand) S.fill(ink(H.ringBand, [8 * s, 13 * s, 8 * s]), hc.b), S.stroke(polyline(offset(H.ringBand, -6.5 * s)), hc.k, 1);
  if (H.band) { const w = st.band.w * s; S.fill(ink(H.band, [w * .7, w, w * .7]), hc.b); S.stroke(polyline(offset(H.band, w * .5)), hc.k, 1); S.stroke(polyline(offset(H.band, -w * .5)), hc.k, 1); for (let i = 1; i < 14; i++) { const a = along(H.band, i / 14), n = norm(perp(sub(along(H.band, i / 14 + .01), a))); S.stroke(polyline([add(a, mul(n, w * .45)), add(a, add(mul(n, -w * .45), [5 * s * (i > 7 ? 1 : -1), 0]))]), hc.k, .8, { op: .7 }); } }
  // the locks, each with its own outline; then a streak of light on the broad ones and a strand line
  for (const b of H.locks) {
    S.fill(b.d, col()); S.stroke(b.e, hc.k, 1.05);
    if (b.w > 13 * s) { const m0 = mix(b.a, b.b, .5), h2 = blade(mix(m0, b.mid, .5), mix(b.mid, b.tip, .5), b.w * .36, 0); S.fill(h2.d, hi, { op: .55 }); }
    if (lod > 0 && b.len > 30 * s) S.fill(ink(splPts([mix(mix(b.a, b.b, .3), b.mid, .3), add(b.mid, mul(b.n, -b.w * .2)), mix(b.mid, b.tip, .75)]), fade(S.lw(.8))), hc.k, { op: .5 });
  }
  for (const b of H.extra) {
    if (b.braid) { S.both(b.d, hc.b, hc.k, 1); continue; }
    S.fill(b.d, col()); S.stroke(b.e || b.d, hc.k, 1.05);
    if (b.c) { S.fill(ink(offset(part(b.c, .14, .6), -b.w * .12), taper(b.w * .26)), hi, { op: .55 }); if (lod > 0) { S.fill(ink(offset(part(b.c, .06, .92), b.w * .14), fade(S.lw(.8))), hc.k, { op: .5 }); S.fill(ink(offset(part(b.c, .3, .96), -b.w * .2), fade(S.lw(.7))), hc.k, { op: .4 }); } if (b.rope && lod > 0) for (let i = 2; i < 12; i++) { const a = along(b.c, i / 12), n = norm(perp(sub(along(b.c, i / 12 + .01), a))); S.stroke(polyline([add(a, mul(n, b.w * .4)), add(a, mul(n, -b.w * .4))]), hc.k, .7, { op: .5 }); } }
  }
  for (const d of H.fly) S.fill(d, hc.k, { op: .85 });
}

// beards: a band along the jaw with locks on its edge; moustaches are blades from under the nose
export function drawBeard(S, Hd, look, hc, sk) {
  const bd = BEARDS[look.beard] || BEARDS.none, { D, P, s } = Hd, r = stream(look.id || 'x', 'beard');
  if (!D.male || D.age < 16 || look.beard === 'none' || !look.beard) return;
  S.layer('face');
  const MV = D.mouthV, mw = D.mouthW, grey = clamp(look.grey ?? 0), col = grey > .6 ? mixc(hc.b, '#c9c9cf', .5) : hc.b;
  const jaw = sg => [[sg * (D.zyg - 1), 16], [sg * (D.gon + 1), D.gonV], [sg * (D.chinW + 6), D.chinV - 1]];
  if (bd.shade) {
    const reg = spl([P(-D.zyg + 3, 20), P(-mw - 10, MV - 12), P(-D.noseW - 1, D.noseV + 4), P(0, D.noseV + 5), P(D.noseW + 1, D.noseV + 4), P(mw + 10, MV - 12), P(D.zyg - 3, 20), ...jaw(1).slice(1).map(p => P(p[0], p[1])), P(0, D.chinV + 1), ...jaw(-1).slice(1).reverse().map(p => P(p[0], p[1]))], true);
    S.within(Hd.out, () => S.fill(reg, hc.b, { op: bd.shade, filter: S.blur(2 * s) }));
    if (S.lod > 0) { let d = ''; for (let i = 0; i < 170; i++) { const u = r.s() * (D.gon - 3), v = lerp(D.noseV + 6, D.chinV - 1, r() ** .7); if (Math.abs(u) < mw * .8 && v > MV - 3 && v < MV + D.lipL + 2) continue; const lim = lerp(D.gon - 4, D.chinW + 4, clamp((v - D.gonV) / (D.chinV - D.gonV))); if (Math.abs(u) > lim) continue; const p = P(u, v); d += `M${n1(p[0])} ${n1(p[1])}l${n1(.5 * s)} ${n1(1.3 * s)}`; } S.stroke(d, hc.k, .75, { op: .5 }); }
    return;
  }
  if (bd.band) {
    const e = bd.ext, top = sg => [[sg * (D.zyg - 2), 10], [sg * (D.zyg - 5 - bd.band * .12), 34], ...(bd.open ? [[sg * (D.gon - bd.band * .7), D.gonV - 6], [sg * (D.gon - 6), D.gonV + 5]] : [[sg * (mw + 10), MV - 8], [sg * (mw + 3), MV + D.lipL + 3], [sg * 6, MV + D.lipL + 3.5]])];
    const bot = sg => [[sg * (D.zyg + 1), 18], [sg * (D.gon + 2 + e * .25), D.gonV + e * .3], ...(bd.open ? [] : [[sg * (D.chinW + 8 + e * .5), D.chinV + e * .7], [sg * 4, D.chinV + e + (bd.hang || 0) * (bd.fork ? .2 : 1)]])];
    const sides = bd.open ? [1, -1].map(sg => [...top(sg), ...bot(sg).reverse()]) : [[...top(1), ...top(-1).reverse(), ...bot(-1), ...bot(1).reverse()]];
    for (const ring of sides) {
      const pts = ring.map(p => P(p[0], p[1])), d = spl(pts, true, .8);
      S.both(d, col, hc.k, 1);
      S.within(d, () => S.fill(d, S.lin(P(0, MV), P(0, D.chinV + e + (bd.hang || 0)), [[0, hc.s, 0], [1, hc.s, .85]])));
    }
    for (const sg of [-1, 1]) { const edge = splPts(bot(sg).map(p => P(p[0], p[1])), false, 1, 6), n = Math.round(7 + bd.lock * .3); for (let i = 1; i <= n; i++) { const t = i / n, a = along(edge, t * .98), ln = (bd.lock * (.7 + .6 * r()) + (bd.hang || 0) * sstep(.55, 1, t) * (.5 + .5 * r()) + (bd.fork || 0) * sstep(.75, 1, t) * (.6 + .4 * r())) * s, ang = rad(sg * (26 * (1 - t) + (bd.fork ? 10 * sstep(.7, 1, t) : 0)) + r.s() * 8), b = blade(add(a, [0, -3 * s]), add(a, mul(dir(ang), ln)), (7 + bd.lock * .25) * s, r.s() * .12); S.fill(b.d, grey > 0 && r() < grey ? mixc(hc.b, '#c4c4ca', .75) : col); S.stroke(b.e, hc.k, .95); } }
  }
  if (bd.chin) { for (let i = -2; i <= 2; i++) { const a = P(i * 3.4, MV + D.lipL + 3), b = blade(a, P(i * 2.2 + r.s(), D.chinV + bd.chin * (.6 + .4 * r()) - Math.abs(i) * 3), 7.5 * s, r.s() * .1); S.fill(b.d, col); S.stroke(b.e, hc.k, .95); } }
  if (bd.mo) for (const sg of [-1, 1]) { const a = P(sg * 1.2, D.noseV + 4.2, 4), b = blade(a, P(sg * (mw + 2 + bd.mo * 3.5), MV - 1 + bd.mo * 2.6, 2), (5.2 + bd.mo * 1.5) * s, sg * -.16, .5); S.fill(b.d, col); S.stroke(b.e, hc.k, .95); if (S.lod > 0) S.fill(ink(splPts([mix(a, b.mid, .4), b.mid, mix(b.mid, b.tip, .7)]), fade(S.lw(.8))), hc.k, { op: .5 }); }
}
