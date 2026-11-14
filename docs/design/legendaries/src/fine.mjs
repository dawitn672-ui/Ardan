// Legendary arms · the fine work: cut stones, trim of one metal on another, veins of wire, the watering of steel,
// crossed bindings. Everything in kit.mjs is passed on, so a piece imports from here alone.
import { MET, LIGHT, line, facet, mixc, mix, add, mul, lerp, clamp, spl, winding } from './kit.mjs';
export * from './kit.mjs';

// outlines of cuts, in a box about -1..1 (x across the piece, y along it)
export const CUTS = {
  lozenge: [[0, -1.3], [.8, 0], [0, 1.3], [-.8, 0]],
  kite: [[0, -1.5], [.72, -.4], [0, 1.05], [-.72, -.4]],
  square: [[-.82, -.82], [.82, -.82], [.82, .82], [-.82, .82]],
  hex: [0, 1, 2, 3, 4, 5].map(i => [Math.sin(i * Math.PI / 3), -Math.cos(i * Math.PI / 3)]),
  oct: [0, 1, 2, 3, 4, 5, 6, 7].map(i => [Math.sin((i + .5) * Math.PI / 4), -Math.cos((i + .5) * Math.PI / 4)]),
  drop: [[0, -1.35], [.52, -.55], [.74, .2], [.46, .86], [0, 1.06], [-.46, .86], [-.74, .2], [-.52, -.55]],
  oval: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => [Math.sin(i * Math.PI / 5) * .78, -Math.cos(i * Math.PI / 5) * 1.12]),
};
// A CUT STONE in its collet. c: (u, v); cut: a name from CUTS or an outline; r: size in mm; col: the stone.
// o.set: the collet's metal (null: none) · o.rot · o.table: size of the table (0..1) · o.step: a second ring of facets
export function gem(D, c, cut, r, col, o = {}) {
  const { S, F } = D, shape = typeof cut === 'string' ? CUTS[cut] : cut, n = shape.length, rot = o.rot || 0, cs = Math.cos(rot), sn = Math.sin(rot);
  const ring = k => shape.map(p => { const x = p[0] * k * r, y = p[1] * k * r; return [c[0] + y * cs - x * sn, c[1] + x * cs + y * sn]; });
  const Pc = F.W(c[0], c[1]), G0 = ring(1), T = ring(o.table ?? .52), M = o.step ? ring(o.step) : null, set = o.set === undefined ? MET.gold : o.set;
  const toward = (a, b) => { const m = F.W((a[0] + b[0]) / 2, (a[1] + b[1]) / 2), dx = m[0] - Pc[0], dy = m[1] - Pc[1], l = Math.hypot(dx, dy) || 1; return (dx * LIGHT[0] + dy * LIGHT[1]) / l; };
  S.layer(o.layer || 'over');
  if (set) {
    const B = ring(o.collet ?? 1.3), bd = line(F, B, true); if (o.shadow !== false) D.sil.push(bd);
    S.fill(bd, set.b); for (let i = 0; i < n; i++) { const j = (i + 1) % n; S.fill(line(F, [B[i], B[j], G0[j], G0[i]], true), facet(set, toward(B[i], B[j]) * 1.1)); }
    S.stroke(bd, set.k, .9); let sp = ''; for (let i = 0; i < n; i++) sp += line(F, [B[i], G0[i]]); S.stroke(sp, set.k, .5, { op: .55 });
  }
  const deep = mixc(col, '#04020a', .74), dark = mixc(col, '#04020a', .46), lite = mixc(col, '#ffffff', .4), fire = mixc(col, '#ffffff', .82);
  const tone = t => (t > .62 ? fire : t > .22 ? lite : t > -.2 ? col : t > -.6 ? dark : deep);
  S.fill(line(F, G0, true), dark);
  const rings = M ? [G0, M, T] : [G0, T];
  for (let k = 0; k < rings.length - 1; k++) for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, A = rings[k], B2 = rings[k + 1], t = toward(A[i], A[j]);
    S.fill(line(F, [A[i], A[j], B2[j], B2[i]], true), tone(t * (k ? .7 : 1.05) + (k ? .18 : 0)));
    if (o.brilliant) S.fill(line(F, [A[i], mix(A[i], A[j], .5), mix(B2[i], B2[j], .5), B2[i]], true), tone(t + (i % 2 ? .28 : -.22)), { op: .6 });
  }
  S.fill(line(F, T, true), S.lin(add(Pc, mul(LIGHT, r * .5)), add(Pc, mul(LIGHT, -r * .5)), [[0, fire], [.3, lite], [.62, col], [1, dark]]));
  let ed = line(F, G0, true) + line(F, T, true); if (M) ed += line(F, M, true); for (let i = 0; i < n; i++) ed += line(F, M ? [G0[i], M[i], T[i]] : [G0[i], T[i]]);
  S.stroke(ed, deep, .5, { op: .7 });
  // the window of light on the table
  const tl = T.map(p => mix(p, c, .12)), wi = [tl[n - 1], tl[0], mix(tl[0], tl[1], .45), mix(tl[n - 1], c, .55)];
  S.fill(line(F, wi, true), '#ffffff', { op: .78 });
  S.stroke(line(F, G0, true), mixc(col, '#000000', .85), .8);
  return Pc;
}
// an edging of another metal just inside a shape's border (gold on dark steel): d must be a closed path
export function trim(S, d, m, w) {
  S.within(d, () => { S.stroke(d, m.k, (w + .45) * 2, { units: 1 }); S.stroke(d, m.b, w * 2, { units: 1 }); S.stroke(d, m.l, w * 1.1, { units: 1, op: .9 }); S.stroke(d, m.hi, w * .3, { units: 1, op: .7 }); });
}
// VEINS · wire let into a channel like the roots of a plant: a few trunks that wander toward +u, fork, thin and end.
// hw(u): half the room they have across. Returns paths by rank (trunks, boughs, twigs) for inlay at falling widths.
export function roots(F, r, u0, u1, hw, o = {}) {
  const out = ['', '', ''], step = o.step || 6, n = o.trunks || 2;
  const grow = (u, v, dv, L, depth) => {
    const pts = [[u, v]]; let s = 0;
    while (s < L && u < u1) {
      dv = dv * .86 + (r() - .5) * (o.wander ?? .5); u += step; v += dv * step; s += step;
      const lim = hw(u) * (o.fill ?? .8); if (Math.abs(v) > lim) { v = Math.sign(v) * lim; dv = -dv * .6; }
      pts.push([u, v]);
      if (depth < 2 && r() < (o.fork ?? .13) * (depth ? .7 : 1)) grow(u, v, dv + (r() < .5 ? -1 : 1) * (.22 + r() * .3), L * (.2 + r() * .3) * (1 - s / L * .5), depth + 1);
    }
    if (pts.length > 1) out[depth] += spl(F.P(pts));
  };
  for (let i = 0; i < n; i++) grow(u0, (n === 1 ? 0 : lerp(-1, 1, i / (n - 1))) * hw(u0) * .5, 0, (u1 - u0) * (1 - i * (o.shorter ?? .12)), 0);
  return out;
}
// WATERED STEEL · the grain of crucible or folded steel between two edges: long lines that wander together, close and
// part. hw(u): half-width; o.c(u): centre line. Returns { light, dark, rung }.
export function watering(F, r, u0, u1, hw, o = {}) {
  const n = o.lines || 9, du = o.du || 7, c = o.c || (() => 0), ph = [], light = [], dark = [];
  for (let j = 0; j < n; j++) ph.push([r() * 6.28, r() * 6.28, .7 + r() * .7]);
  for (let j = 0; j < n; j++) {
    const pts = [], base = lerp(-1, 1, (j + .5) / n);
    for (let u = u0; u <= u1; u += du) { const w = hw(u), k = ph[j], v = base * w * .94 + (Math.sin(u * (o.f1 || .045) * k[2] + k[0]) * .5 + Math.sin(u * (o.f2 || .017) + k[1] + j * .7) * .8 + Math.sin(u * .11 + j * 1.9) * .22) * w / n * (o.amp ?? 1.5); pts.push([u, c(u) + clamp(v, -w, w)]); }
    (j % 2 ? light : dark).push(spl(F.P(pts)));
  }
  // rungs of a ladder: where the smith cut across the bar the grain crowds into a band
  let rung = '';
  for (const ur of (o.rungs || [])) for (let k = -1; k <= 1; k++) { const pts = [], w = hw(ur); for (let t = -1; t <= 1.001; t += .25) pts.push([ur + k * 2.2 + Math.sin(t * 5 + ur) * 1.6, c(ur) + t * w]); rung += spl(F.P(pts)); }
  return { light: light.join(''), dark: dark.join(''), rung };
}
// a binding that crosses itself (straps or cord laid both ways round a grip): the two sets of turns
export function xwrap(F, T, pitch, slant) { return { a: winding(F, T, pitch, slant), b: winding(F, T, pitch, -slant, { phase: pitch / 2 }) }; }
