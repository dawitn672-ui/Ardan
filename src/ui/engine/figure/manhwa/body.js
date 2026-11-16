// The manhwa layer · the body from the waist up: the frame (where the shoulders, the waist and the hands are), the
// arms in a pose, the hands, and the main garment in a people's cut. Cloth is a flat cel form with tapered fold lines,
// a trim with the people's motif at the neck, the front and the cuffs, and a woven or printed pattern where one is worn.
import { clamp, lerp, mixc, n1, splPts, add, sub, mul, norm, perp } from '../g.js';
import { cloth } from '../palette.js';
import { pt, P, PZ, blob, curve, sliver, elli, circ, tube, cel, rect } from './ink.js';

export function makeFrame(Hd, o = {}) {
  const male = Hd.male, b = clamp(o.build ?? 0, -1, 1), cx = o.bx ?? Hd.cx - Hd.yaw * 2.5;
  const yS = Hd.chinY + (male ? 17 : 15.5), sw = (male ? 73 : 55) + b * 6, cw = sw - (male ? 11 : 8), ww = (male ? 49 : 35) + b * 7, yW = yS + (male ? 116 : 106), neckW = (male ? 13.5 : 10.4) + b * 1.2;
  return { cx, yS, sw, cw, ww, yW, neckW, male, b, arm: male ? [15.5, 13, 9.5] : [11.5, 9.6, 7.2], hand: male ? 1 : .82 };
}
// the trunk's outline, let out by g (a coat is wider than a shirt)
export function torsoPts(F, g = 0) {
  const { cx, yS, sw, cw, ww, yW, neckW } = F, half = sg => [[cx + sg * (neckW + 5), yS - 9 - g * .3], [cx + sg * (sw * .6), yS - 3 - g * .5], [cx + sg * (sw - 1 + g), yS + 9], [cx + sg * (sw - 2 + g), yS + 26], [cx + sg * (cw + 1 + g), yS + 54], [cx + sg * (ww + g), yW], [cx + sg * (ww + 9 + g), yW + 48], [cx + sg * (ww + 12 + g), 520]];
  return [...half(-1), ...half(1).reverse()];
}
export const torsoD = (F, g = 0) => { const p = torsoPts(F, g); return blob(p, p.map((_, i) => (i === 7 || i === 8 ? .1 : i === 0 || i === 15 ? .5 : 1))); };

// ---- arms -------------------------------------------------------------------------------------------------------------
// a pose is where the elbow and the wrist are, measured from the frame: [ex, ey, wx, wy] in units of the frame
// (x from the centre toward that arm's own side, y down from the shoulder line), and how the hand is held
export const POSES = {
  down:  { e: [1.06, 98], w: [.98, 196], hand: 'none' },
  hip:   { e: [1.36, 84], w: ['w', 126], hand: 'fist', wx: 6 },
  chest: { e: [1.06, 98], w: [.16, 60], hand: 'open' },
  heart: { e: [1.02, 100], w: [-.06, 56], hand: 'open' },
  belt:  { e: [1.1, 96], w: [.26, 122], hand: 'fist' },
  raise: { e: [1.36, 72], w: [1.2, 14], hand: 'grip' },
  mid:   { e: [1.32, 88], w: [1.18, 42], hand: 'grip' },
  offer: { e: [1.1, 98], w: [1.2, 70], hand: 'palm' },
  fold:  { e: [1.02, 96], w: [-.3, 84], hand: 'tuck' },
  hold:  { e: [1.08, 100], w: [.5, 96], hand: 'grip' },
  pommel: { e: [1.18, 90], w: [.82, 132], hand: 'open' },
  pray:  { e: [.98, 102], w: [.06, 74], hand: 'open' },
  chin:  { e: [.8, 104], w: [.3, 26], hand: 'fist' },
};
export function armOf(F, sg, pose) {
  const p = POSES[pose] || POSES.down, X = v => (v === 'w' ? F.ww + (p.wx || 0) : v * F.sw);
  const S0 = [F.cx + sg * (F.sw - 9), F.yS + 13], E = [F.cx + sg * X(p.e[0]), F.yS + p.e[1]], W = [F.cx + sg * X(p.w[0]), F.yS + p.w[1]];
  return { sg, pose, S0, E, W, hand: p.hand, dir: norm(sub(W, E)) };
}
// a sleeve (or a bare arm): kind long, wide, short, rolled, none
export function drawArm(S, F, A, o) {
  const [r0, r1, r2] = F.arm, sk = o.sk, kind = o.sleeve || 'long', g = o.g || 0, pal = o.pal;
  const skin = { b: sk.b, s: sk.s, k: sk.k, rim: sk.l };
  const bare = (a, b, ra, rb) => S.form(tube([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], b], [ra, (ra + rb) / 2 + .6, rb], { caps: [1, .8] }), skin, { rim: false });
  if (kind === 'none') { bare(A.S0, A.E, r0 - 1, r1 - .5); bare(A.E, A.W, r1 - .5, r2); if (o.band) armBand(S, A, o.band, r0); return; }
  if (kind === 'short' || kind === 'rolled') bare(A.E, A.W, r1 - .5, r2);
  if (kind === 'short') { const m = [lerp(A.S0[0], A.E[0], .58), lerp(A.S0[1], A.E[1], .58)]; S.form(tube([A.S0, m], [r0 + 1 + g, r0 + 2.5 + g]), pal, { in: s => o.trim && s.band([add(m, mul(perp(norm(sub(m, A.S0))), r0 + 6)), add(m, mul(perp(norm(sub(m, A.S0))), -r0 - 6))].map(p => add(p, mul(norm(sub(A.S0, m)), 3))), o.trim.w, o.trim.pal, o.trim.motif, o.trim.c2) }); return; }
  const wide = kind === 'wide', end = kind === 'rolled' ? [lerp(A.E[0], A.W[0], .16), lerp(A.E[1], A.W[1], .16)] : wide ? [lerp(A.E[0], A.W[0], .86), lerp(A.E[1], A.W[1], .86)] : [lerp(A.E[0], A.W[0], .94), lerp(A.E[1], A.W[1], .94)];
  const radii = kind === 'rolled' ? [r0 + 1.5 + g, r1 + 2.5 + g, r1 + 4 + g] : wide ? [r0 + 2 + g, r1 + 4 + g, r1 + 9 + g] : [r0 + 1.5 + g, r1 + 2 + g, r2 + 1.6 + g * .6];
  if (wide) bare(end, A.W, r2 + .5, r2);
  const ax = norm(sub(end, A.E)), nn = perp(ax), u = norm(sub(A.E, A.S0)), un = perp(u), k = pal.k, e = A.E, fc = mixc(pal.s, k, .45);
  const seg = (p, q, ra, rb) => tube([p, [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], q], [ra, (ra + rb) / 2 + (wide ? 0 : .6), rb], { caps: [1, wide ? .25 : .7] });
  // the upper arm, then the forearm over it: the line where they meet is the fold at the elbow
  S.form(seg(A.S0, add(e, mul(u, radii[1] * .4)), radii[0], radii[1]), pal, { in: s => {
    s.pen([add(A.S0, add(mul(u, 12), mul(un, -4))), add(A.S0, add(mul(u, 36), mul(un, -2))), add(e, mul(u, -14))], 1.1, fc, { op: .6 });
    s.pen([add(e, add(mul(un, radii[1]), mul(u, -10))), add(e, add(mul(u, -12), mul(un, 1))), add(e, add(mul(un, -radii[1] * .3), mul(u, -6)))], 1.3, fc, { op: .8 });
    if (o.armBand) { const m = add(A.S0, mul(u, 30)); s.band([add(m, mul(un, r0 + 8)), add(m, mul(un, -r0 - 8))], o.armBand.w, o.armBand.pal, o.armBand.motif, o.armBand.c2); }
    if (o.patch) { const m = add(A.S0, mul(u, 46)); s.both(PZ([add(m, [-6, -5]), add(m, [5, -6]), add(m, [6, 5]), add(m, [-5, 6])]), o.patch, k, .7); s.line(P([add(m, [-6, -5]), add(m, [-8, -7])]) + P([add(m, [6, 5]), add(m, [8, 7])]) + P([add(m, [5, -6]), add(m, [7, -8])]), k, .6); }
  } });
  S.form(seg(add(e, mul(ax, -radii[1] * .35)), end, radii[1], radii[2]), pal, { in: s => {
    s.pen([add(e, mul(ax, 8)), add(e, add(mul(ax, 30), mul(nn, 3))), add(end, mul(ax, -8))], 1.1, fc, { op: .6 });
    if (wide) s.pen([add(e, add(mul(ax, 12), mul(nn, -6))), add(end, add(mul(ax, -5), mul(nn, -radii[2] * .55)))], 1.2, fc, { op: .6 });
    if (o.pattern) o.pattern(s);
    if (o.trim && kind !== 'rolled') s.band([add(end, add(mul(nn, radii[2] + 4), mul(ax, -o.trim.w * .6))), add(end, add(mul(nn, -radii[2] - 4), mul(ax, -o.trim.w * .6)))], o.trim.w, o.trim.pal, o.trim.motif, o.trim.c2);
  } });
  if (kind === 'rolled') { S.form(tube([add(end, mul(ax, -5)), add(end, mul(ax, 3))], [radii[2] + 1.2, radii[2] + 1.2]), pal, {}); }
  if (o.band) armBand(S, A, o.band, r0);
}
// a ring on the upper arm or the wrist (silver for a northern oath, gold or copper in the south)
function armBand(S, A, b, r0) {
  const u = norm(sub(A.E, A.S0)), un = perp(u), at = b.wrist ? add(A.W, mul(A.dir, -7)) : add(A.S0, mul(u, b.at || 34)), rr = b.wrist ? r0 * .62 : r0 + (b.over || 0);
  for (let i = 0; i < (b.n || 1); i++) { const m = add(at, mul(b.wrist ? A.dir : u, -i * 4.2)), q = [add(m, mul(b.wrist ? perp(A.dir) : un, rr)), add(m, mul(b.wrist ? perp(A.dir) : un, -rr))]; S.line(P(q), b.m.k, 4.4); S.line(P(q), b.m.b, 3); S.line(P([q[0], [(q[0][0] + q[1][0]) / 2, (q[0][1] + q[1][1]) / 2]]), b.m.hi, 1, .9); }
}
// a hand at the end of an arm: a fist (knuckles to us), a grip round a shaft, an open hand laid flat, a palm held up
export function drawHand(S, F, A, sk, o = {}) {
  const kind = o.kind || A.hand; if (kind === 'none' || kind === 'tuck') return null;
  const k = F.hand, d = A.dir, n = perp(d), c = add(A.W, mul(d, 7 * k)), skin = { b: sk.b, s: sk.s, k: sk.k, rim: sk.l };
  const at = (a, b) => add(c, add(mul(d, a * k), mul(n, b * k)));
  if (o.glove) { skin.b = o.glove.b; skin.s = o.glove.s; skin.k = o.glove.k; }
  if (kind === 'open' || kind === 'palm') {
    S.form(blob([at(-8, -7), at(2, -8), at(13, -6.5), at(15, -1), at(14, 5), at(3, 8), at(-8, 6.5)], .9), skin, { rim: false, in: s => { for (const b of [-3, .6, 4]) s.pen([at(3, b), at(14, b * 1.05)], .8, sk.k, { op: .7 }); } });
    S.both(blob([at(-4, -6.5 * A.sg * (kind === 'palm' ? -1 : 1) - 1), at(3, -11 * (A.sg > 0 ? 1 : -1) * 0 - 10.5), at(7, -9), at(2, -5.5)], .9), sk.b, sk.k, .9);
    return c;
  }
  // fist or grip: the back of the hand, four fingers folded across, the thumb over them
  S.form(blob([at(-8, -7.5), at(3, -8.5), at(8, -6), at(9, 0), at(8, 6), at(2, 8.5), at(-8, 7)], .9), skin, { rim: false, in: s => {
    s.fill(blob([at(2, -9), at(10, -7), at(10, 7), at(2, 9), at(4.6, 0)], .8), sk.s, .7);
    for (const b of [-3.8, 0, 3.8]) s.pen([at(2.4, b), at(9.4, b)], .8, sk.k, { op: .75 });
  } });
  return c;
}

// ---- the main garment ---------------------------------------------------------------------------------------------------
// neck: round, key (a slit), v, cross (one side lapped over the other to the far hip: 'crossR' laps to our right),
//       high (a standing collar), wide; body kinds: tunic, robe, kaftan, drape (one shoulder bare), wrap (both bare)
export function neckPts(F, kind) {
  const { cx, yS, neckW: nw } = F;
  if (kind === 'v') return [[cx - nw - 6, yS - 10], [cx - nw * .5, yS + 14], [cx, yS + 36], [cx + nw * .5, yS + 14], [cx + nw + 6, yS - 10]];
  if (kind === 'wide') return [[cx - nw - 20, yS - 6], [cx - nw - 6, yS + 9], [cx, yS + 14], [cx + nw + 6, yS + 9], [cx + nw + 20, yS - 6]];
  if (kind === 'deep') return [[cx - nw - 9, yS - 9], [cx - nw - 2, yS + 22], [cx, yS + 40], [cx + nw + 2, yS + 22], [cx + nw + 9, yS - 9]];
  if (kind === 'high') return [[cx - nw - 2, yS - 13], [cx - nw * .5, yS - 9], [cx, yS - 7.5], [cx + nw * .5, yS - 9], [cx + nw + 2, yS - 13]];
  return [[cx - nw - 7, yS - 10], [cx - nw - 1, yS + 5], [cx, yS + 11], [cx + nw + 1, yS + 5], [cx + nw + 7, yS - 10]];
}
export const foldsOn = (s, F, pal, o = {}) => {
  const { cx, yS, cw, ww, yW } = F, c = mixc(pal.s, pal.k, .45), g = o.g || 0;
  // the unlit side of the trunk: one flat shape from under the far arm to the hem
  s.fill(blob([[cx + cw * .5, yS + 30], [cx + cw + 14, yS + 20], [cx + ww + 40, 520], [cx + ww * .35, 520], [cx + ww * .5, yW], [cx + cw * .62, yS + 70]], .9), pal.s, .8);
  for (const sg of [-1, 1]) {
    s.pen([[cx + sg * (cw + g - 2), yS + 50], [cx + sg * (cw - 13), yS + 70], [cx + sg * (ww * .5), yW - 10]], 1.5, c, { op: .8 });
    s.pen([[cx + sg * (cw + g - 5), yS + 60], [cx + sg * (cw - 6), yS + 86], [cx + sg * (ww - 6), yW - 4]], 1.2, c, { op: .6 });
    if (o.belted !== false) s.pen([[cx + sg * (ww + g - 4), yW - 16], [cx + sg * ww * .6, yW - 8], [cx + sg * ww * .3, yW - 2]], 1.3, c, { op: .7 });
  }
  s.pen([[cx - 12, yS + 34], [cx - 3, yS + 62], [cx - 8, yW - 12]], 1.1, c, { op: .45 });
  s.pen([[cx + 16, yS + 40], [cx + 10, yS + 70], [cx + 14, yW - 8]], 1.1, c, { op: .5 });
  // under the chest on a woman
  if (!F.male) s.pen([[cx - cw + 8, yS + 60], [cx - 10, yS + 66], [cx, yS + 62], [cx + 10, yS + 66], [cx + cw - 8, yS + 60]], 1.2, c, { op: .45 });
};
// what the head and the chin throw on the chest
export const castOn = (s, F, pal, w = 1) => s.fill(blob([[F.cx - F.neckW - 8, F.yS - 12], [F.cx + F.neckW * w + 16, F.yS - 12], [F.cx + F.neckW * w + 24, F.yS + 4], [F.cx + 12, F.yS + 22 * w], [F.cx - 6, F.yS + 14 * w]], .9), pal.s, .9);

export function drawGarment(S, F, G, sk, ctx = {}) {
  const pal = cel(cloth(G.c), { deep: G.deep }), { cx, yS, sw, cw, ww, yW, neckW: nw } = F, g = G.g ?? 1.5, trim = G.trim ? { w: G.trim.w || 5, pal: cloth(G.trim.c), motif: G.trim.motif, c2: G.trim.c2 || cloth(G.trim.c).l } : null;
  const tex = G.pat ? patternOf(S, G) : null, under = G.under ? cloth(G.under) : null;
  if (G.cut === 'drape' || G.cut === 'wrap') {
    // a length of cloth: over our left shoulder and under the right arm (drape), or bound across the chest (wrap)
    const sh = G.side || -1, top = G.cut === 'drape'
      ? [[cx + sh * (nw + 3), yS - 10], [cx + sh * sw * .62, yS - 5], [cx + sh * (sw - 2), yS + 8], [cx + sh * (sw - 3), yS + 28], [cx + sh * (cw + 2), yS + 56], [cx + sh * (ww + 2), yW], [cx + sh * (ww + 14), 520], [cx - sh * (ww + 14), 520], [cx - sh * (ww + 2), yW], [cx - sh * (cw + 2), yS + 54], [cx - sh * (cw - 4), yS + 40], [cx - sh * 14, yS + 26], [cx + sh * 6, yS + 6]]
      : [[cx - cw - 2, yS + 36], [cx - cw * .5, yS + 30], [cx, yS + 33], [cx + cw * .5, yS + 30], [cx + cw + 2, yS + 36], [cx + cw + 2, yS + 54], [cx + ww + 2, yW], [cx + ww + 14, 520], [cx - ww - 14, 520], [cx - ww - 2, yW], [cx - cw - 2, yS + 54]];
    const edge = G.cut === 'drape' ? [[cx - sh * (cw + 4), yS + 50], [cx - sh * (cw - 4), yS + 40], [cx - sh * 14, yS + 26], [cx + sh * 6, yS + 6], [cx + sh * (nw + 3), yS - 12]] : [[cx - cw - 4, yS + 36], [cx - cw * .5, yS + 30], [cx, yS + 33], [cx + cw * .5, yS + 30], [cx + cw + 4, yS + 36]];
    S.form(blob(top, G.cut === 'drape' ? [.6, 1, 1, 1, 1, 1, .1, .1, 1, 1, .8, 1, 1] : [.5, 1, 1, 1, .5, 1, 1, .1, .1, 1, 1]), pal, { in: s => {
      if (tex) s.fill(rect(0, 0, 300, 520), tex);
      const c = mixc(pal.s, pal.k, .45);
      if (G.cut === 'drape') { for (let i = 0; i < 6; i++) { const t = i / 5; s.pen([[cx + sh * lerp(nw + 10, sw - 6, t), yS + lerp(0, 22, t)], [cx + sh * lerp(4, cw * .5, t), yS + 46 + i * 9], [cx - sh * lerp(cw - 14, ww - 4, t), yS + lerp(56, 112, t)]], 1.6 - t * .5, c, { op: .8 }); if (i % 2) s.pen([[cx + sh * lerp(nw + 12, sw - 8, t), yS + lerp(3, 25, t)], [cx + sh * lerp(2, cw * .5, t) - 3, yS + 48 + i * 9]], 1.3, pal.l, { op: .5 }); } }
      else foldsOn(s, F, pal);
      if (trim) s.band(edge.map(p => [p[0] + (G.cut === 'drape' ? sh * 3.5 : 0), p[1] + (G.cut === 'drape' ? 3 : 4)]), trim.w, trim.pal, trim.motif, trim.c2);
      if (ctx.inside) ctx.inside(s, pal);
    } });
    return { pal, trim };
  }
  const tp = torsoPts(F, g);
  S.form(blob(tp, tp.map((_, i) => (i === 7 || i === 8 ? .1 : i === 0 || i === 15 ? .5 : 1))), pal, { in: s => {
    if (tex) s.fill(rect(0, 0, 300, 520), tex);
    castOn(s, F, pal);
    foldsOn(s, F, pal, { g });
    const np = neckPts(F, G.neck === 'key' ? 'round' : G.neck && G.neck.startsWith('cross') ? 'v' : G.neck || 'round');
    if (G.neck && G.neck.startsWith('cross')) {
      // the lapped front: the upper flap runs from one shoulder to the far side at the waist
      const sg = G.neck === 'crossR' ? 1 : -1, line = [[cx - sg * (nw + 5), yS - 11], [cx - sg * 2, yS + 16], [cx + sg * (ww * .42), yS + 62], [cx + sg * (ww * .78), yW + 2], [cx + sg * (ww + 2), yW + 60]];
      s.fill(blob([...line, [cx + sg * 140, yW + 60], [cx + sg * 140, yS - 30]], .8), pal.s, .35);
      if (trim) s.band(line, trim.w, trim.pal, trim.motif, trim.c2); else s.pen(line, 1.6, pal.k, { flat: 1 });
      if (G.toggles) for (const t of [.3, .52, .74]) { const p = splPts(line, false, 1, 8)[Math.round(t * 32)]; s.line(P([[p[0] - sg * 6, p[1] - 1], [p[0] + sg * 5, p[1] + 1]]), G.toggles, 2); s.both(circ(p[0] + sg * 5, p[1] + 1, 2), G.toggles, pal.k, .6); }
      // the small v of the under-layer at the throat
      s.both(PZ([[cx - nw - 4, yS - 11], [cx + sg * 1, yS + 15], [cx + nw + 4, yS - 11]]), under ? under.b : sk.b, pal.k, .9);
      if (!under) s.fill(PZ([[cx - nw - 4, yS - 11], [cx + sg * 1, yS + 15], [cx + nw + 4, yS - 11], [cx + nw, yS - 4]]), sk.s, .8);
    } else if (G.neck !== 'high') {
      const d = curve(np) + 'Z';
      s.fill(d, under && G.neck !== 'round' ? under.b : sk.b);
      s.clip(d, q => { q.fill(blob([[cx - nw - 12, yS - 14], [cx + nw + 12, yS - 14], [cx + nw + 12, yS + 2], [cx + 6, yS + 18], [cx - 10, yS + 8]], .9), under && G.neck !== 'round' ? under.s : sk.s);
        if (under && G.neck !== 'round') { const u = curve(neckPts(F, 'round')) + 'Z'; q.both(u, sk.b, under.k, .9); q.fill(blob([[cx - nw - 8, yS - 12], [cx + nw + 8, yS - 12], [cx + nw + 6, yS], [cx + 5, yS + 9], [cx - 8, yS + 4]], .9), sk.s, .8); } });
      if (trim) s.band(np, trim.w, trim.pal, trim.motif, trim.c2); else s.line(curve(np), pal.k, 1.1);
      if (G.neck === 'key') { s.both(PZ([[cx - 2.2, yS + 10], [cx, yS + 32], [cx + 2.2, yS + 10]]), sk.s, pal.k, .8); if (G.lace) s.line(P([[cx - 4, yS + 14], [cx + 4, yS + 19]]) + P([[cx + 4, yS + 14], [cx - 4, yS + 19]]) + P([[cx - 3.5, yS + 21], [cx + 3.5, yS + 26]]) + P([[cx + 3.5, yS + 21], [cx - 3.5, yS + 26]]), G.lace, .9); }
    }
    if (G.front) {
      // a front opening down the middle: a placket with its fastenings (buttons, frogs, studs, laces)
      const y0 = G.neck === 'v' ? yS + 36 : G.neck === 'deep' ? yS + 40 : yS + 12, line = [[cx, y0], [cx + .5, yW + 60]];
      if (trim && G.front.band !== false) s.band(line, trim.w + 1, trim.pal, G.front.motif ?? trim.motif, trim.c2); else s.pen(line, 1.4, pal.k, { flat: 1 });
      const fc = G.front.c || '#c9a24a', n = G.front.n || 5;
      for (let i = 0; i < n; i++) { const y = y0 + 9 + i * ((yW - y0 - 6) / n);
        if (G.front.k === 'frogs') { s.line(P([[cx - 8, y], [cx + 8, y]]), fc, 1.6); s.fill(circ(cx - 8, y, 1.6) + circ(cx + 8, y, 1.6) + circ(cx, y, 1.9), fc); }
        else if (G.front.k === 'laces') s.line(P([[cx - 4, y - 3], [cx + 4, y + 3]]) + P([[cx + 4, y - 3], [cx - 4, y + 3]]), fc, .9);
        else s.both(circ(cx + (G.front.side || 0), y, G.front.r || 2), fc, pal.k, .6); }
    }
    if (G.hem) s.band([[cx - ww - 16, yW + 38], [cx, yW + 44], [cx + ww + 16, yW + 38]], G.hem.w || 6, cloth(G.hem.c), G.hem.motif, G.hem.c2 || cloth(G.hem.c).l);
    if (G.patches) for (const [dx, dy] of G.patches) { const m = [cx + dx, yS + dy]; s.both(PZ([[m[0] - 7, m[1] - 6], [m[0] + 6, m[1] - 7], [m[0] + 7, m[1] + 6], [m[0] - 6, m[1] + 7]]), G.patchC || pal.s, pal.k, .7); s.line(P([[m[0] - 7, m[1] - 6], [m[0] - 9.5, m[1] - 8]]) + P([[m[0] + 7, m[1] + 6], [m[0] + 9.5, m[1] + 8]]) + P([[m[0] + 6, m[1] - 7], [m[0] + 8, m[1] - 9.5]]) + P([[m[0] - 6, m[1] + 7], [m[0] - 8, m[1] + 9.5]]), pal.k, .6); }
    if (G.yoke) { const y = G.yoke, yp = [[cx - sw * .78, yS + 4], [cx - nw - 14, yS + 22], [cx, yS + (y.d || 34)], [cx + nw + 14, yS + 22], [cx + sw * .78, yS + 4]]; s.band(yp, y.w || 9, cloth(y.c), y.motif, y.c2 || cloth(y.c).l); }
    if (ctx.inside) ctx.inside(s, pal);
  } });
  if (G.neck === 'high') {
    const col = G.trim ? cel(cloth(G.trim.c)) : pal, d = blob([[cx - nw - 3.5, yS - 20], [cx - nw - 6, yS - 5], [cx, yS + 1], [cx + nw + 6, yS - 5], [cx + nw + 3.5, yS - 20], [cx + nw * .4, yS - 15.5], [cx, yS - 14.5], [cx - nw * .4, yS - 15.5]], .7);
    S.form(d, col, { in: s => { s.pen([[cx, yS - 14], [cx + .4, yS + 1]], 1, col.k, { flat: 1 }); if (trim && trim.motif) s.band([[cx - nw - 5, yS - 11], [cx, yS - 6.5], [cx + nw + 5, yS - 11]], 3, trim.pal, trim.motif, trim.c2, { edge: false }); } });
  }
  return { pal, trim };
}
// a woven or printed cloth as a tile: stripes, checks, brocade (roundels), zig, dots, diaper, ikat
export function patternOf(S, G) {
  const a = cloth(G.patC || 'cream'), c = a.b, c2 = G.patC2 ? cloth(G.patC2).b : a.l, k = G.pat, op = G.patOp ?? .75;
  if (k === 'stripes') return S.tile(G.patW || 11, 10, `<rect width="${G.patW2 || 3}" height="10" fill="${c}" opacity="${op}"/>` + (G.patC2 ? `<rect x="${(G.patW2 || 3) + 1.4}" width="1" height="10" fill="${c2}" opacity="${op}"/>` : ''), { rot: G.patRot || 0 });
  if (k === 'bands') return S.tile(10, G.patW || 26, `<rect width="10" height="${G.patW2 || 7}" fill="${c}" opacity="${op}"/><path d="M0 ${(G.patW2 || 7) + 3}h10" stroke="${c2}" stroke-width="1.2" opacity="${op}"/><path d="M0 3.5l2.5-2.5l2.5 2.5l2.5-2.5l2.5 2.5" fill="none" stroke="${c2}" stroke-width=".9" opacity="${op}"/>`, { rot: G.patRot || 0 });
  if (k === 'checks') return S.tile(14, 14, `<rect width="7" height="7" fill="${c}" opacity="${op}"/><rect x="7" y="7" width="7" height="7" fill="${c}" opacity="${op}"/>`, { rot: G.patRot ?? 45 });
  if (k === 'brocade') return S.tile(18, 18, `<g fill="none" stroke="${c}" stroke-width=".9" opacity="${op}"><circle cx="9" cy="9" r="5"/><path d="M9 5.5v7M5.5 9h7M0 0l3 3M18 0l-3 3M0 18l3-3M18 18l-3-3"/></g><circle cx="9" cy="9" r="1.3" fill="${c2}" opacity="${op}"/>`);
  if (k === 'stars') return S.tile(16, 16, `<path d="M8 2.5l1.6 3.9l3.9 1.6l-3.9 1.6l-1.6 3.9l-1.6-3.9l-3.9-1.6l3.9-1.6z" fill="${c}" opacity="${op}"/><path d="M0 0l1.5 1.5M16 0l-1.5 1.5M0 16l1.5-1.5M16 16l-1.5-1.5" stroke="${c2}" stroke-width=".9" opacity="${op}"/>`);
  if (k === 'zig') return S.tile(12, G.patW || 20, `<path d="M0 6l3-4l3 4l3-4l3 4" fill="none" stroke="${c}" stroke-width="1.6" opacity="${op}"/><path d="M0 12h12" stroke="${c2}" stroke-width="2.4" opacity="${op}"/><path d="M0 16h12" stroke="${c}" stroke-width=".9" opacity="${op}"/>`, { rot: G.patRot || 0 });
  if (k === 'dots') return S.tile(9, 9, `<circle cx="2" cy="2" r="1.1" fill="${c}" opacity="${op}"/><circle cx="6.5" cy="6.5" r="1.1" fill="${c}" opacity="${op}"/>`);
  if (k === 'clouds') return S.tile(22, 18, `<path d="M3 11q0-5 5-4q1-4 5-2q4-1 4 3q3 1 1 3" fill="none" stroke="${c}" stroke-width="1" opacity="${op}"/><circle cx="16" cy="15" r="1" fill="${c2}" opacity="${op}"/>`);
  if (k === 'diaper') return S.tile(12, 12, `<path d="M6 0l6 6l-6 6l-6-6z" fill="none" stroke="${c}" stroke-width=".8" opacity="${op}"/><circle cx="6" cy="6" r="1" fill="${c2}" opacity="${op}"/>`);
  return null;
}
