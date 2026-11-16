// Legendary arms · the drawing kit. Every piece is designed in MILLIMETRES along its own axis: u runs from the hilt (or
// the butt) toward the point, v across it, and v < 0 is the side the light falls on. A frame puts that axis on the page
// the way the figure library's swordArt(S, G, a, L, ...) does, so the same record draws upright on a plate, lying flat
// on a card, or in a figure's hand. The scene, the curves and the seeded dice are the figure library's own
// (src/ui/engine/figure, read and not changed). Nothing here calls Math.random or the clock: a scratch, a nick, the
// watering of a blade all come from a stream seeded by the piece's id, so a piece never changes.
import { lerp, clamp, sstep, add, sub, mul, mix, norm, perp, len, dist, spl, splPts, poly, polyline, ell, ellPts, offset, along, stream, mixc, hex2rgb, rgb2hex, hsl, fromHsl, n1, setPrec } from '../../../../src/ui/engine/figure/g.js';
import { Scene } from '../../../../src/ui/engine/figure/scene.js';

export { lerp, clamp, sstep, add, sub, mul, mix, norm, perp, len, dist, spl, splPts, poly, polyline, ell, ellPts, offset, along, stream, mixc, n1, Scene, setPrec };

// ---------------------------------------------------------------- materials -------------------------------------------
// k line · d deep shadow · s shadow · b base · l light · hi highlight · r the colour a shadow picks up from the room
export const MET = {
  steel:   { k: '#161a22', d: '#343b49', s: '#6a7382', b: '#a4acb8', l: '#dde3ea', hi: '#ffffff', r: '#8e9db4' },
  bright:  { k: '#181c25', d: '#3a4354', s: '#788293', b: '#b9c1cc', l: '#ebeff4', hi: '#ffffff', r: '#a3b2c8' },
  iron:    { k: '#121419', d: '#262a33', s: '#474c57', b: '#747a85', l: '#a9afb9', hi: '#d5dae2', r: '#5d6676' },
  dwarf:   { k: '#090b10', d: '#181c26', s: '#2c3340', b: '#4b5564', l: '#8794a6', hi: '#cdd8e6', r: '#3b4a60' },   // dark dwarf-steel
  black:   { k: '#050608', d: '#0d0f14', s: '#1b1e26', b: '#2e323c', l: '#636b7b', hi: '#b9c2d2', r: '#2a3344' },
  blued:   { k: '#070b18', d: '#101a33', s: '#1f3157', b: '#33508a', l: '#7095d0', hi: '#d8e6ff', r: '#3a4f86' },
  silverS: { k: '#22262e', d: '#555c68', s: '#8d95a2', b: '#cdd3db', l: '#f3f6f9', hi: '#ffffff', r: '#b4c2d6' },   // pale silver-steel
  silver:  { k: '#23262d', d: '#4f5560', s: '#8c929c', b: '#d0d4d9', l: '#f4f6f8', hi: '#ffffff', r: '#aab3c2' },
  gold:    { k: '#2f1c05', d: '#5a390c', s: '#95651b', b: '#cf9f36', l: '#f2d478', hi: '#fff7d2', r: '#b56f1e' },
  redgold: { k: '#2a1206', d: '#57270f', s: '#96502a', b: '#cf8848', l: '#f2bb80', hi: '#ffe9cc', r: '#b0532a' },
  bronze:  { k: '#1e1306', d: '#3d2810', s: '#684b21', b: '#9a763a', l: '#caa560', hi: '#f0dca8', r: '#7d5a2a' },
  copper:  { k: '#24100a', d: '#48200f', s: '#7f4021', b: '#b6663b', l: '#e39c6a', hi: '#fddcc0', r: '#974a26' },
};
// anything that is not metal (wood, leather, ivory, horn, cloth, enamel): a ramp worked out from one colour, shadows
// cooler and deeper, lights warmer. o overrides any step.
export function stuff(hex, o = {}) {
  const [h, s, l] = hsl(hex), cool = (h > 40 && h < 250) ? 1 : -1;
  return {
    b: hex,
    s: o.s || fromHsl(h + cool * 8, clamp(s * 1.08), clamp(l - .1 - l * .1)),
    d: o.d || fromHsl(h + cool * 16, clamp(s * 1.12), clamp(l - .2 - l * .2)),
    l: o.l || fromHsl(h - cool * 6, s * .9, clamp(l + .07 + (1 - l) * .14)),
    hi: o.hi || fromHsl(h - cool * 8, s * .6, clamp(l + .16 + (1 - l) * .4)),
    k: o.k || fromHsl(h + cool * 18, clamp(s * .9 + .04), clamp(l * .22, .035, .16)),
    r: o.r || fromHsl(h + cool * 10, clamp(s * 1.05), clamp(l - .04)),
  };
}
export const WOOD = {
  ash: stuff('#c2a070', { k: '#33240f' }), oak: stuff('#8a6740', { k: '#22160a' }), walnut: stuff('#5d3d27', { k: '#150b05' }),
  ebony: stuff('#2b2422', { l: '#57493f', hi: '#93847a', k: '#070505' }), yewHeart: stuff('#a04a26', { k: '#2b0f06' }), yewSap: stuff('#e3c995', { k: '#4c3718' }),
  pear: stuff('#7a4a2c', { k: '#1d0f07' }), bog: stuff('#3a2d25', { k: '#0c0806' }),
};
export const IVORY = stuff('#ece0c6', { s: '#cdb991', d: '#a08a62', l: '#f8f1e2', hi: '#ffffff', k: '#4d3e25' });
export const BONE = stuff('#e6dcc8', { s: '#c5b594', d: '#96835f', l: '#f6f0e3', hi: '#ffffff', k: '#4a3d28' });
export const HORN = stuff('#3d2f26', { l: '#77604c', hi: '#c9ac8a', k: '#0d0806' });

// ---------------------------------------------------------------- the light, the frame --------------------------------
export const LIGHT = norm([-.5, -.86]);            // toward the light: up and to the left of the page
// G: where the piece's origin sits on the page · deg: which way +u points (−90 up the page, 0 to the right)
export function frame(G = [0, 0], deg = -90) {
  const a = deg * Math.PI / 180, ux = [Math.cos(a), Math.sin(a)], vx = [-ux[1], ux[0]];
  const W = (u, v = 0) => [G[0] + ux[0] * u + vx[0] * v, G[1] + ux[1] * u + vx[1] * v];
  return { G, deg, ux, vx, W, P: pts => pts.map(p => W(p[0], p[1])) };
}
// the same frame with v turned, if need be, so that v < 0 is the side toward the light (for parts painted by side)
export function litFrame(F) {
  if (F.vx[0] * LIGHT[0] + F.vx[1] * LIGHT[1] <= 0) return F;
  return { ...F, flip: true, W: (u, v = 0) => F.W(u, -v), P: pts => pts.map(p => F.W(p[0], -p[1])) };
}
// a drawing in progress: the scene, the frame, the piece's own dice, every silhouette (for the one ground shadow)
export function begin(id, F, o = {}) {
  const S = new Scene(id, { px: o.px || 1, lod: o.lod ?? 2 });
  if (o.view) S.view = o.view;
  return { S, F, id, lod: o.lod ?? 2, sil: [], r: ch => stream(o.seed || id, ch) };
}
export const LAYERS = ['shadow', 'under', 'main', 'over', 'top', 'fx'];
export function finish(D, vb, o = {}) {
  const { S } = D;
  if (D.sil.length && o.shadow !== false) {
    const sd = o.shadowBlur ?? 5, off = o.shadowOff || [5, 8], m = sd * 3.5;
    const f = S.def('gs' + sd, id => `<filter id="${id}" filterUnits="userSpaceOnUse" x="${n1(vb[0] - m)}" y="${n1(vb[1] - m)}" width="${n1(vb[2] + 2 * m)}" height="${n1(vb[3] + 2 * m)}"><feGaussianBlur stdDeviation="${sd}"/></filter>`);
    S.layer('shadow'); S.fill(D.sil.join(''), o.shadowCol || '#05040a', { op: o.shadowOp ?? .5, filter: f, tf: `translate(${off[0]} ${off[1]})` });
  }
  return S.svg(vb, { order: LAYERS, w: o.w, h: o.h, cls: o.cls, label: o.label });
}

// ---------------------------------------------------------------- outlines --------------------------------------------
// points in (u, v) to a path on the page. t: how smooth each point is (1 a curve through it .. 0 a corner)
export const curve = (F, pts, t = 1, closed = true) => spl(F.P(pts), closed, t);
export const line = (F, pts, closed = false) => polyline(F.P(pts), closed);
// a half outline (the v <= 0 side, from one end to the other) mirrored to a whole one
export function sym(half, t) {
  const back = half.slice().reverse().filter(p => Math.abs(p[1]) > 1e-6).map(p => [p[0], -p[1]]);
  const pts = [...half, ...back];
  if (!Array.isArray(t)) return { pts, t };
  const tb = half.map((p, i) => [p, t[i] ?? 1]).reverse().filter(x => Math.abs(x[0][1]) > 1e-6).map(x => x[1]);
  return { pts, t: [...t.slice(0, half.length), ...tb] };
}
export const disc = (c, ru, rv = ru, n = 28, a0 = 0) => { const o = []; for (let i = 0; i < n; i++) { const a = a0 + i / n * Math.PI * 2; o.push([c[0] + Math.cos(a) * ru, c[1] + Math.sin(a) * rv]); } return o; };
export function bbox(P) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of P) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; } return [x0, y0, x1, y1]; }
// how far a set of page points reaches along a page direction n: [min, max] of p·n
const reach = (P, n) => { let a = 1e9, b = -1e9; for (const p of P) { const q = p[0] * n[0] + p[1] * n[1]; if (q < a) a = q; if (q > b) b = q; } return [a, b]; };
// the two ends of a gradient across a shape, lit end first: along page direction n (flipped to face the light)
export function across(P, n) {
  const m = (n[0] * LIGHT[0] + n[1] * LIGHT[1]) >= 0 ? n : [-n[0], -n[1]], [a, b] = reach(P, m), bb = bbox(P), c = [(bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2], cc = c[0] * m[0] + c[1] * m[1];
  return [add(c, mul(m, b - cc)), add(c, mul(m, a - cc))];
}

// ---------------------------------------------------------------- paint -----------------------------------------------
// a soft-edged shape: a blur whose room is set from the shape's own box (so a thin streak keeps its blur)
export function soft(S, d, P, sd, c, op = 1, o = {}) {
  const b = bbox(P), m = sd * 3.2, key = 'sf' + [b[0] - m, b[1] - m, b[2] - b[0] + 2 * m, b[3] - b[1] + 2 * m].map(n1).join(',') + '|' + n1(sd);
  const f = S.def(key, id => `<filter id="${id}" filterUnits="userSpaceOnUse" x="${n1(b[0] - m)}" y="${n1(b[1] - m)}" width="${n1(b[2] - b[0] + 2 * m)}" height="${n1(b[3] - b[1] + 2 * m)}"><feGaussianBlur stdDeviation="${n1(sd)}"/></filter>`);
  S.fill(d, c, { op, filter: f, ...o });
}
// a soft round patch of light or shade at a page point
export function puff(S, p, rx, ry, c, op = .5, rot = 0) { soft(S, ell(p, rx, ry, rot), [[p[0] - Math.max(rx, ry), p[1] - Math.max(rx, ry)], [p[0] + Math.max(rx, ry), p[1] + Math.max(rx, ry)]], Math.min(rx, ry) * .45, c, op); }
// STOPS · the turn of a form from its lit edge (0) to its far edge (1)
export const TURN = {
  // a polished round bar: a hard light, a dark core, light thrown back from the ground on the far edge
  bar: m => [[0, m.s], [.06, m.b], [.19, m.l], [.26, m.hi], [.31, m.hi], [.37, m.l], [.5, m.b], [.68, m.s], [.84, m.d], [.93, m.d], [1, m.r || m.s]],
  // dark steel, satin: it stays dark and takes one quiet light
  dark: m => [[0, m.s], [.09, m.b], [.2, m.l], [.27, m.l], [.4, m.b], [.64, m.s], [.9, m.d], [1, m.s]],
  // a duller round (wood, leather, horn): no hard light
  round: m => [[0, m.s], [.1, m.b], [.26, m.l], [.4, m.b], [.66, m.s], [.9, m.d], [1, m.s]],
  // a flat polished face tilted to the light
  face: m => [[0, m.hi], [.12, m.l], [.45, m.b], [.8, m.s], [1, m.d]],
  // a flat face turned from the light
  shade: m => [[0, m.s], [.5, m.d], [1, m.s]],
  // a flat plate with a bright bevel at each edge
  plate: m => [[0, m.hi], [.05, m.l], [.09, m.b], [.5, m.l], [.56, m.b], [.9, m.s], [.95, m.d], [1, m.r || m.s]],
};
export function turn(S, d, P, n, stops) { const [a, b] = across(P, n); S.fill(d, S.lin(a, b, stops)); }
// a ball: the light high on the lit side, a core shadow, a rim of thrown-back light
export function ball(S, d, c, r, m, o = {}) {
  const lc = add(c, mul(LIGHT, r * .42));
  S.fill(d, S.radial(lc, r * 1.5, [[0, m.hi], [.1, m.l], [.34, m.b], [.62, m.s], [.84, m.d], [1, m.r || m.s]]));
  if (o.spec !== false) { const h = add(c, mul(LIGHT, r * .5)); puff(S, h, r * .2, r * .13, '#ffffff', .9, -.6); }
}
// the tone of a flat facet from how squarely it faces the light (t: −1 turned away .. 1 full on)
export function facet(m, t) {
  t = clamp(t, -1, 1);
  if (t > .5) return mixc(m.l, m.hi, (t - .5) * 2);
  if (t > 0) return mixc(m.b, m.l, t * 2);
  if (t > -.5) return mixc(m.s, m.b, (t + .5) * 2);
  return mixc(m.d, m.s, (t + 1) * 2);
}

// ONE PIECE of anything, given as an outline in (u, v). o.t smoothness · o.shade 'bar' (a bar lying along u) | 'cross' (a
// bar lying across it) | 'face' | 'plate' | 'round' | 'ball' | fn(S, d, P) · o.inside(d, P): more paint, clipped to it
export function piece(D, pts, m, o = {}) {
  const { S, F } = D, P = F.P(pts), d = o.d || (o.poly != null ? poly(P, o.poly) : spl(P, true, o.t ?? 1));
  if (o.shadow !== false) D.sil.push(d);
  S.layer(o.layer || 'main');
  S.fill(d, m.b);
  S.within(d, () => {
    const sh = o.shade ?? 'bar';
    if (typeof sh === 'function') sh(S, d, P);
    else if (sh === 'ball') { const b = bbox(P), c = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]; ball(S, d, c, Math.max(b[2] - b[0], b[3] - b[1]) / 2, m, o); }
    else if (sh === 'cross') turn(S, d, P, F.ux, (TURN[o.turn] || TURN.bar)(m));
    else if (sh !== 'none') turn(S, d, P, F.vx, (TURN[o.turn || sh] || TURN.bar)(m));
    if (o.inside) o.inside(d, P);
  });
  if (o.line !== false) S.stroke(d, m.k, o.lw ?? 1.05);
  return { d, P };
}
// a tube along the axis: stations [u, half-width, centre v]; returns its outline and its two edges
export function tube(F, st, o = {}) {
  const A = st.map(s => [s[0], (s[2] ?? 0) - s[1]]), B = st.map(s => [s[0], (s[2] ?? 0) + s[1]]);
  const sm = o.t ?? .6, a = splPts(A, false, sm, 8), b = splPts(B, false, sm, 8);
  return { pts: [...a, ...b.slice().reverse()], A: a, B: b };
}
// the dark where one part sits on another: a soft band across the axis at u, reaching `d` mm toward +u (or −u)
export function seat(D, u, hw, d, o = {}) {
  const { S, F } = D, a = F.W(u, 0), b = F.W(u + d, 0);
  S.fill(line(F, [[u, -hw], [u + d, -hw], [u + d, hw], [u, hw]], true), S.lin(a, b, [[0, o.col || '#05060a', o.op ?? .6], [1, o.col || '#05060a', 0]]));
}

// ---------------------------------------------------------------- lines on metal --------------------------------------
// wire let into a surface (gold or silver inlay): the dark cut, the metal, a hair of light. w in millimetres
export function inlay(S, d, m, w, o = {}) {
  if (!d) return;
  S.stroke(d, o.cut || m.k, w * 1.55, { units: 1, op: (o.op ?? 1) * .85, cap: o.cap, join: o.join });
  S.stroke(d, m.b, w, { units: 1, op: o.op ?? 1, cap: o.cap, join: o.join });
  S.stroke(d, m.hi, w * .34, { units: 1, op: (o.op ?? 1) * .8, cap: o.cap, join: o.join, tf: `translate(${n1(-w * .16)} ${n1(-w * .2)})` });
}
// a line cut into metal (engraving): a dark cut with a lit lip under it
export function engrave(S, d, m, w, o = {}) {
  if (!d) return;
  S.stroke(d, m.hi, w * .8, { units: 1, op: (o.op ?? .9) * .6, tf: `translate(${n1(w * .45)} ${n1(w * .6)})` });
  S.stroke(d, o.col || m.k, w, { units: 1, op: o.op ?? .9 });
}
// a raised line (a rope moulding, a bead of chasing): light on top, dark under
export function ridge(S, d, m, w, o = {}) {
  S.stroke(d, m.k, w * 1.5, { units: 1, op: .9 }); S.stroke(d, m.b, w, { units: 1 }); S.stroke(d, m.hi, w * .36, { units: 1, op: .85, tf: `translate(${n1(-w * .2)} ${n1(-w * .24)})` });
}
// a sparkle where the polish is highest: four hair-thin rays and a bright heart. Light on metal, never a glow.
export function glint(D, p, r, o = {}) {
  const { S } = D, a = o.a ?? .35, q = r * .055, c = Math.cos(a), s = Math.sin(a);
  const pt = (x, y) => [p[0] + x * c - y * s, p[1] + x * s + y * c];
  const star = polyline([pt(r, 0), pt(q, q), pt(0, r * .7), pt(-q, q), pt(-r, 0), pt(-q, -q), pt(0, -r * .7), pt(q, -q)], true);
  S.layer('fx'); puff(S, p, r * .3, r * .3, '#ffffff', o.core ?? .8);
  S.fill(star, '#ffffff', { op: o.op ?? .95 });
}

// ---------------------------------------------------------------- stones and enamel -----------------------------------
// a cabochon in a rubbed-over setting. c: (u, v) · r in mm · col: the stone
export function cabochon(D, c, r, col, set = MET.gold, o = {}) {
  const { S, F } = D, p = F.W(c[0], c[1]), ry = r * (o.ry ?? 1), rot = o.rot ?? 0, deep = mixc(col, '#06030a', .68), lite = mixc(col, '#ffffff', .42);
  S.layer(o.layer || 'over');
  const bez = ell(p, r * 1.3, ry * 1.3, rot); if (o.shadow !== false) D.sil.push(bez);
  S.fill(bez, set.b); S.within(bez, () => ball(S, bez, p, r * 1.3, set, { spec: false })); S.stroke(bez, set.k, .9);
  if (o.claws) for (let i = 0; i < o.claws; i++) { const a = (i + .5) / o.claws * Math.PI * 2 + rot, q0 = add(p, [Math.cos(a) * r * .86, Math.sin(a) * ry * .86]), q1 = add(p, [Math.cos(a) * r * 1.34, Math.sin(a) * ry * 1.34]), nn = mul(perp(norm(sub(q1, q0))), r * .15); S.both(polyline([add(q1, nn), sub(q1, nn), q0], true), set.l, set.k, .6); }
  const g = ell(p, r, ry, rot);
  S.fill(g, S.radial(add(p, mul(LIGHT, -r * .38)), r * 1.35, [[0, lite], [.3, col], [.72, deep], [1, mixc(col, '#000000', .86)]]));
  S.stroke(g, mixc(col, '#000000', .8), .8);
  // the window of light on its crown, and the spark that comes back through the stone from the foil behind
  const h = add(p, mul(LIGHT, r * .42));
  S.fill(ell(h, r * .34, ry * .2, -.55 + rot), '#ffffff', { op: .92 });
  S.fill(ell(add(p, mul(LIGHT, r * .72)), r * .08, r * .06), '#ffffff', { op: .8 });
  puff(S, add(p, mul(LIGHT, -r * .5)), r * .42, ry * .24, lite, .7, -.5);
  return p;
}
// a pearl
export function pearl(D, c, r, o = {}) {
  const { S, F } = D, p = F.W(c[0], c[1]), d = ell(p, r, r); D.sil.push(d); S.layer(o.layer || 'over');
  S.fill(d, S.radial(add(p, mul(LIGHT, r * .4)), r * 1.5, [[0, '#ffffff'], [.25, '#f5efe6'], [.6, '#cfc6c0'], [.85, '#8f8794'], [1, '#c9c2cc']]));
  S.stroke(d, '#4b4350', .7); S.fill(ell(add(p, mul(LIGHT, r * .45)), r * .22, r * .16, -.5), '#ffffff', { op: .95 });
}
// enamel laid in a cell: flat glassy colour, a soft window of light, a dark rim where it meets the metal
export function enamel(S, d, P, col, o = {}) {
  const b = bbox(P), deep = mixc(col, '#05030a', .45), lite = mixc(col, '#ffffff', .3);
  S.fill(d, S.lin([b[0], b[1]], [b[2], b[3]], [[0, lite], [.3, col], [.75, col], [1, deep]]));
  if (o.gloss !== false) S.within(d, () => puff(S, [lerp(b[0], b[2], .32), lerp(b[1], b[3], .26)], (b[2] - b[0]) * .26, (b[3] - b[1]) * .13, '#ffffff', .5, -.5));
  S.stroke(d, mixc(col, '#000000', .7), .7, { op: .9 });
}

// ---------------------------------------------------------------- lettering -------------------------------------------
// Inscriptions are wire let into the steel, as on a medieval blade: plain capitals of straight strokes and arcs. Each
// glyph is a set of strokes in a box 0..w wide, 0 (top) .. 1 (foot); a stroke that ends in 1 is a curve.
const GL = {
  A: [.8, [[0, 1], [.4, 0], [.8, 1]], [[.16, .62], [.64, .62]]], B: [.66, [[0, 0], [0, 1]], [[0, 0], [.4, 0], [.6, .12], [.6, .36], [.4, .48], [0, .48], 1], [[0, .48], [.46, .48], [.66, .62], [.66, .86], [.46, 1], [0, 1], 1]],
  C: [.72, [[.72, .16], [.5, .01], [.24, .04], [.04, .3], [.04, .7], [.24, .96], [.5, .99], [.72, .84], 1]], D: [.74, [[0, 0], [0, 1]], [[0, 0], [.36, 0], [.66, .2], [.74, .5], [.66, .8], [.36, 1], [0, 1], 1]],
  E: [.6, [[.6, 0], [0, 0], [0, 1], [.6, 1]], [[0, .5], [.46, .5]]], F: [.58, [[.58, 0], [0, 0], [0, 1]], [[0, .5], [.44, .5]]],
  G: [.76, [[.72, .16], [.5, .01], [.24, .04], [.04, .3], [.04, .7], [.24, .96], [.52, .99], [.74, .84], 1], [[.74, .84], [.74, .54], [.44, .54]]],
  H: [.72, [[0, 0], [0, 1]], [[.72, 0], [.72, 1]], [[0, .5], [.72, .5]]], I: [.1, [[.05, 0], [.05, 1]]], K: [.68, [[0, 0], [0, 1]], [[.66, 0], [0, .56]], [[.22, .4], [.68, 1]]],
  L: [.56, [[0, 0], [0, 1], [.56, 1]]], M: [.9, [[0, 1], [0, 0], [.45, .7], [.9, 0], [.9, 1]]], N: [.74, [[0, 1], [0, 0], [.74, 1], [.74, 0]]],
  O: [.8, [[.4, 0], [.14, .1], [.02, .36], [.02, .64], [.14, .9], [.4, 1], [.66, .9], [.78, .64], [.78, .36], [.66, .1], [.4, 0], 1]],
  P: [.64, [[0, 0], [0, 1]], [[0, 0], [.42, 0], [.62, .14], [.62, .4], [.42, .54], [0, .54], 1]], R: [.68, [[0, 0], [0, 1]], [[0, 0], [.42, 0], [.62, .14], [.62, .38], [.42, .52], [0, .52], 1], [[.3, .52], [.68, 1]]],
  S: [.62, [[.6, .14], [.42, .01], [.18, .03], [.03, .2], [.14, .42], [.46, .56], [.6, .76], [.46, .96], [.2, .99], [.01, .84], 1]],
  T: [.72, [[0, 0], [.72, 0]], [[.36, 0], [.36, 1]]], U: [.72, [[0, 0], [0, .68], [.12, .92], [.36, 1], [.6, .92], [.72, .68], [.72, 0], 1]],
  V: [.78, [[0, 0], [.39, 1], [.78, 0]]], W: [1.06, [[0, 0], [.26, 1], [.53, .2], [.8, 1], [1.06, 0]]], X: [.7, [[0, 0], [.7, 1]], [[.7, 0], [0, 1]]], Y: [.72, [[0, 0], [.36, .52], [.72, 0]], [[.36, .52], [.36, 1]]],
  '+': [.6, [[.3, .14], [.3, .86]], [[0, .5], [.6, .5]]], '.': [.16, [[.08, .44], [.08, .56]]], ' ': [.42],
};
// text set along the axis from (u, v), reading toward +u, the letters' feet toward +v (o.flip: toward −v). h: cap height
// in mm. Returns the path of every stroke, and how long the line is.
export function lettering(F, text, u, v, h, o = {}) {
  const gap = (o.gap ?? .26) * h, fl = o.flip ? -1 : 1; let x = 0, d = '';
  const width = [...text].reduce((a, ch) => a + ((GL[ch] || GL[' '])[0]) * h + gap, -gap);
  const x0 = o.center ? -width / 2 : 0;
  for (const ch of text) {
    const g = GL[ch] || GL[' '];
    for (let i = 1; i < g.length; i++) {
      const st = g[i], smooth = st[st.length - 1] === 1, pts = (smooth ? st.slice(0, -1) : st).map(p => F.W(u + fl * (x0 + x + p[0] * h), v + fl * (p[1] - .5) * h));
      d += smooth ? spl(pts) : polyline(pts);
    }
    x += g[0] * h + gap;
  }
  return { d, width };
}

// ---------------------------------------------------------------- ornament --------------------------------------------
// a running scroll along a line of (u, v) points (the engraver's vine): a wavy stem, a curl turned back into every bay,
// a leaf on every crest. Returns { lines, leaves }: the leaves are closed, to be filled.
export function vine(F, pts, amp, o = {}) {
  const c = splPts(pts, false, 1, 10), L = c.reduce((a, p, i) => a + (i ? dist(p, c[i - 1]) : 0), 0), n = Math.max(2, Math.round(L / (o.step || amp * 3)));
  const at = t => along(c, clamp(t)), tan = t => norm(sub(at(Math.min(1, t + .01)), at(Math.max(0, t - .01))));
  const stem = []; let lines = '', leaves = '';
  for (let i = 0; i <= n * 8; i++) { const t = i / (n * 8), p = at(t), nn = perp(tan(t)); stem.push(add(p, mul(nn, Math.sin(t * n * Math.PI) * amp * .6))); }
  lines += spl(F.P(stem));
  for (let i = 0; i < n; i++) {
    const sg = i % 2 ? -1 : 1, t0 = i / n, o0 = at(t0), T = tan(t0 + .3 / n), N = perp(T), R0 = amp * (o.curl ?? .62), turns = o.turns ?? 1.3, sp = [];
    for (let j = 0; j <= 14; j++) { const ph = j / 14 * Math.PI * 2 * turns, R = R0 * (1 - .82 * j / 14), x = R0 * .5 + Math.sin(ph) * R, y = -sg * R0 + sg * Math.cos(ph) * R; sp.push(add(o0, add(mul(T, x), mul(N, y)))); }
    lines += spl(F.P(sp));
    const tc = (i + .5) / n, Tc = tan(tc), Nc = perp(Tc), pc = add(at(tc), mul(Nc, sg * amp * .6)), z = amp * (o.leaf ?? .6);
    const tip = add(pc, add(mul(Nc, sg * z * .95), mul(Tc, z * .5))), s1 = add(pc, add(mul(Nc, sg * z * .62), mul(Tc, -z * .12))), s2 = add(pc, add(mul(Nc, sg * z * .18), mul(Tc, z * .52)));
    const q = F.P([pc, s1, tip, s2]);
    leaves += `M${n1(q[0][0])} ${n1(q[0][1])}Q${n1(q[1][0])} ${n1(q[1][1])} ${n1(q[2][0])} ${n1(q[2][1])}Q${n1(q[3][0])} ${n1(q[3][1])} ${n1(q[0][0])} ${n1(q[0][1])}Z`;
  }
  return { lines, leaves };
}
// the vine let into a surface in wire and leaf (m: the inlaid metal), or cut into it (o.cut)
export function vineOn(S, F, pts, amp, m, w, o = {}) {
  const v = vine(F, pts, amp, o);
  if (o.cut) { engrave(S, v.lines + v.leaves, m, w, o); return; }
  inlay(S, v.lines, m, w, o); S.fill(v.leaves, m.b); S.stroke(v.leaves, m.k, w * .45, { units: 1, op: .8 });
}
// a plait of two cords along a line (knotwork): returns { under, over } so the crossings read
export function plait(F, pts, w, o = {}) {
  const c = splPts(pts, false, 1, 10), L = c.reduce((a, p, i) => a + (i ? dist(p, c[i - 1]) : 0), 0), n = Math.max(2, Math.round(L / (o.step || w * 1.5)));
  const at = t => along(c, clamp(t)), tan = t => norm(sub(at(Math.min(1, t + .01)), at(Math.max(0, t - .01))));
  const strand = ph => { const s = []; for (let i = 0; i <= n * 8; i++) { const t = i / (n * 8); s.push(add(at(t), mul(perp(tan(t)), Math.sin(t * n * Math.PI + ph) * w / 2))); } return s; };
  const a = strand(0), b = strand(Math.PI); let over = ''; const under = spl(F.P(a)) + spl(F.P(b));
  for (let i = 0; i <= n; i++) { const s = i % 2 ? a : b, j = clamp(i * 8, 2, n * 8 - 2); over += spl(F.P(s.slice(Math.max(0, j - 2), j + 3))); }
  return { under, over };
}
// a square fret (a key pattern) along u from u0 to u1, at v, of height h
export function fret(F, u0, u1, v, h) {
  const n = Math.max(1, Math.round(Math.abs(u1 - u0) / (h * 1.5))), s = (u1 - u0) / n, pts = [];
  for (let i = 0; i < n; i++) { const a = u0 + i * s; pts.push([a, v + h / 2], [a, v - h / 2], [a + s * .75, v - h / 2], [a + s * .75, v + h * .2], [a + s * .38, v + h * .2], [a + s * .38, v - h * .12], [a + s * .38, v + h * .2], [a + s * .75, v + h * .2], [a + s * .75, v + h / 2]); }
  pts.push([u1, v + h / 2]);
  return polyline(F.P(pts));
}
// rows of small dots (granulation, nail heads, a pearled edge): one path
export function dots(F, pts, r) { let d = ''; for (const q of pts) { const p = F.W(q[0], q[1]); d += `M${n1(p[0] - r)} ${n1(p[1])}a${n1(r)} ${n1(r)} 0 1 0 ${n1(2 * r)} 0a${n1(r)} ${n1(r)} 0 1 0 ${n1(-2 * r)} 0`; } return d; }
export function beads(D, pts, r, m) {
  const { S, F } = D, d = dots(F, pts, r); S.fill(d, m.b); S.stroke(d, m.k, .5, { op: .9 });
  S.fill(dots(F, pts, r * .42), m.hi, { op: .85, tf: `translate(${n1(LIGHT[0] * r * .34)} ${n1(LIGHT[1] * r * .34)})` });
}
export const row = (a, b, n) => { const o = []; for (let i = 0; i < n; i++) o.push(mix(a, b, n === 1 ? .5 : i / (n - 1))); return o; };

// ---------------------------------------------------------------- the blade --------------------------------------------
// A straight two-edged blade. o.st: stations [u, half-width]; o.tip: u of the point; o.mat; o.fuller: { u0, u1, w, w1,
// inside }; o.bevel: width of the honed edge (mm); o.nicks: [[u, side(-1|1), depth]]; o.inside({ half }): more paint
// (inlay, etching), clipped to the blade. Painted as polished steel is: a lit face and a shaded face meeting at the
// ridge, the room reflected down its length in slanting bands, a bright honed bevel, a seat of shadow at the hilt.
export function blade(D, o) {
  // whichever way the piece is turned on the page, the face toward the light is painted as the lit one
  const { S } = D, F = litFrame(D.F), fl = F.flip ? -1 : 1, m = o.mat, st = o.st, u0 = st[0][0], uT = o.tip, r = D.r('blade'), w0 = Math.max(...st.map(s => s[1]));
  const A = splPts(st.map(s => [s[0], -s[1]]), false, st.some(s => s[2] != null) ? st.map(s => s[2] ?? .9) : (o.t ?? .9), 12), half = u => { for (let i = 0; i < A.length - 1; i++) if (A[i + 1][0] >= u) return -lerp(A[i][1], A[i + 1][1], (u - A[i][0]) / ((A[i + 1][0] - A[i][0]) || 1)); return 0; };
  const L = A.map(p => [p[0], p[1]]), R = A.map(p => [p[0], -p[1]]);
  for (const [u, sd, dep] of (o.nicks || [])) { const side = sd * fl, E = side < 0 ? L : R; let j = 1; while (j < E.length - 2 && E[j][0] < u) j++; const p = E[j]; E.splice(j, 1, [p[0] - dep * 1.1, p[1]], [p[0], p[1] - side * dep], [p[0] + dep * .7, p[1]]); }
  const tip = [uT, 0], out = [...L, tip, ...R.slice().reverse()], d = line(F, out, true), P = F.P(out);
  D.sil.push(d); S.layer(o.layer || 'main'); S.fill(d, m.b);
  const fu = o.fuller, ridgeFrom = fu ? fu.u1 + (fu.w1 ?? fu.w * .55) * .9 : o.core ? o.core.u1 + (o.core.point ?? 8) : u0, a = F.W(u0, 0), b = F.W(uT, 0), LEN = uT - u0;
  S.within(d, () => {
    const lit = line(F, [...L, tip, [u0, 0]], true), far = line(F, [[u0, 0], tip, ...R.slice().reverse()], true);
    // the two faces
    S.fill(lit, S.lin(F.W(u0, -w0), F.W(u0, 0), o.litStops || [[0, m.l], [.28, mixc(m.l, m.b, .6)], [.7, m.l], [1, m.hi]]));
    S.fill(far, S.lin(F.W(u0, 0), F.W(u0, w0), o.farStops || [[0, m.d], [.2, m.s], [.72, mixc(m.s, m.b, .62)], [1, m.s]]));
    // the sky in the upper half of it, the ground in the lower
    { const up = b[1] <= a[1], lo = up ? a : b, hi = up ? b : a; S.fill(d, S.lin(lo, hi, [[0, '#2b1f16', o.earth ?? .2], [.3, '#2b1f16', 0], [.55, '#c9dcff', 0], [.8, '#c9dcff', o.sky ?? .16], [1, '#ffffff', (o.sky ?? .16) * .6]])); }
    // the fuller: a groove, its near wall in shade, its far wall catching the light
    let fd = null;
    if (fu) {
      const n = 16, w1 = fu.w1 ?? fu.w * .55, a1 = [], b1 = [];
      for (let i = 0; i <= n; i++) { const t = i / n, u = lerp(fu.u0, fu.u1, t), w = lerp(fu.w, w1, t) / 2; a1.push([u, -w]); b1.push([u, w]); }
      const fp = [...a1, [fu.u1 + w1 * .9, 0], ...b1.slice().reverse()]; fd = line(F, fp, true);
      S.fill(fd, S.lin(F.W(fu.u0, -fu.w / 2), F.W(fu.u0, fu.w / 2), [[0, m.k], [.14, m.d], [.4, m.s], [.68, m.b], [.9, m.l], [1, m.hi]]));
      S.stroke(line(F, a1), m.k, .9, { op: .7 }); S.stroke(line(F, b1.map(p => [p[0], p[1] - .5])), m.hi, .8, { op: .75 });
    }
    // a core of another steel down the middle (a dark, patterned heart between bright bevels): o.core = { mat, hw(u) or
    // [w0, w1], u0, u1, point, inside(cd, hw) }. It sits a hair below the bevels: a dark step on the lit side, light on the far.
    if (o.core) {
      const c = o.core, cm = c.mat, n = 34, a1 = [], b1 = [], cu0 = c.u0 ?? u0, hwf = typeof c.hw === 'function' ? c.hw : (u => lerp(c.hw[0], c.hw[1], clamp((u - cu0) / (c.u1 - cu0))));
      for (let i = 0; i <= n; i++) { const u = lerp(cu0, c.u1, i / n), w = hwf(u); a1.push([u, -w]); b1.push([u, w]); }
      const cp = [...a1, [c.u1 + (c.point ?? hwf(c.u1) * 3), 0], ...b1.slice().reverse()], cd = line(F, cp, true), wm = Math.max(hwf(cu0), hwf((cu0 + c.u1) / 2));
      // the wall of the channel: a narrow second bevel between the bright one and the heart
      if (c.wall) { const k = c.wall, a2 = a1.map(p => [p[0], p[1] - k * clamp((c.u1 - p[0]) / 90 + .3)]), b2 = b1.map(p => [p[0], p[1] + k * clamp((c.u1 - p[0]) / 90 + .3)]), pt = [c.u1 + (c.point ?? hwf(c.u1) * 3) + k * 2, 0];
        S.fill(line(F, [...a2, pt, ...a1.slice().reverse()], true), mixc(m.s, m.b, .35), { op: .85 }); S.fill(line(F, [...b1, pt, ...b2.slice().reverse()], true), m.d, { op: .7 });
        S.stroke(line(F, a2), m.hi, .7, { op: .7 }); S.stroke(line(F, b2), m.k, .7, { op: .5 }); }
      S.fill(cd, S.lin(F.W(cu0, -wm), F.W(cu0, wm), [[0, cm.s], [.18, cm.b], [.5, cm.s], [1, cm.d]]));
      S.within(cd, () => { if (c.inside) c.inside(cd, hwf); });
      S.stroke(line(F, [...a1, [c.u1 + (c.point ?? hwf(c.u1) * 3), 0]]), cm.k, 1.1, { op: .9 }); S.stroke(line(F, a1.map(p => [p[0], p[1] - .55])), m.hi, .7, { op: .55 });
      S.stroke(line(F, [...b1, [c.u1 + (c.point ?? hwf(c.u1) * 3), 0]]), cm.k, .9, { op: .8 }); S.stroke(line(F, b1.map(p => [p[0], p[1] + .6])), m.hi, .8, { op: .8 });
    }
    // the room, reflected: slanting bands, soft on one side and hard on the other (a polished blade is a mirror)
    const sk = o.skew ?? w0 * 2.3, e = norm([sk, 2 * w0]), gdir = [e[1], -e[0]];
    for (const [t0, t1, kind, op] of (o.bands || [[.1, .25, 'dk', .4], [.25, .37, 'lt', .62], [.52, .66, 'dk2', .24], [.72, .86, 'lt2', .4]])) {
      const ua = u0 + LEN * t0 - sk / 2, ub = u0 + LEN * t1 - sk / 2, pd = line(F, [[ua, -w0 - 1], [ub, -w0 - 1], [ub + sk, w0 + 1], [ua + sk, w0 + 1]], true), dd = (ub - ua) * gdir[0];
      const p0 = F.W(ua, -w0 - 1), p1 = F.W(ua + gdir[0] * dd, -w0 - 1 + gdir[1] * dd), c = kind[0] === 'd' ? m.d : m.hi;
      const stops = kind === 'dk' ? [[0, c, 0], [.8, c, op], [1, m.k, op * .9]] : kind === 'lt' ? [[0, c, op], [.25, c, op * .7], [1, c, 0]] : [[0, c, 0], [.5, c, op], [1, c, 0]];
      S.fill(pd, S.lin(p0, p1, stops));
    }
    // the ridge beyond the fuller
    S.stroke(line(F, [[ridgeFrom, 0], tip]), m.hi, 1, { op: .85 }); S.stroke(line(F, [[ridgeFrom, .6], [uT - 6, .3]]), m.d, .8, { op: .5 });
    // the honed bevels
    const ev = o.bevel ?? 2.4, inner = (E, sg) => E.map(p => [p[0], p[1] - sg * ev * clamp((uT - p[0]) / 60 + .25)]);
    S.fill(line(F, [...L, tip, ...inner(L, -1).reverse()], true), m.hi, { op: o.hone ?? .8 });
    S.fill(line(F, [...R, tip, ...inner(R, 1).reverse()], true), o.honeFar || mixc(m.l, m.b, .3), { op: (o.hone ?? .8) * .85 });
    S.stroke(line(F, inner(L, -1)), m.s, .7, { op: .6 }); S.stroke(line(F, inner(R, 1)), m.k, .7, { op: .5 });
    // slashes of light across the lit face, crisp as the style has them
    for (const [t0, wd, op] of (o.slashes || [[.4, .035, .55], [.445, .009, .7]])) {
      const u = u0 + LEN * t0, h = half(u) + 4, dl = LEN * wd;
      S.fill(line(F, [[u - h * 1.1, -h], [u - h * 1.1 + dl, -h], [u + dl, 0], [u, 0]], true), '#ffffff', { op });
    }
    // what its years have done: clouds in the polish, fine scratches
    if (o.wear) {
      for (let i = 0; i < 7; i++) { const u = u0 + LEN * (.08 + r() * .84), p = F.W(u, (r() * 2 - 1) * half(u) * .6); puff(S, p, 5 + r() * 9, 14 + r() * 30, i % 2 ? m.d : m.hi, .1 + r() * .08, F.deg * Math.PI / 180 + Math.PI / 2); }
      let sc = '', sk2 = '';
      for (let i = 0; i < o.wear * 30; i++) { const u = lerp(u0 + 8, uT - 30, r()), h = half(u), v = (r() * 2 - 1) * h * .8, l = 3 + r() * 16, an = (r() - .5) * .7, s = line(F, [[u, v], [u + l * Math.cos(an), v + l * Math.sin(an)]]); if (i % 3) sc += s; else sk2 += s; }
      S.stroke(sc, m.hi, .45, { op: .4 }); S.stroke(sk2, m.d, .45, { op: .3 });
    }
    if (fu && fu.inside) S.within(fd, () => fu.inside(fd));
    if (o.inside) o.inside({ d, half, lit, far });
    // the seat: the blade goes dark where it enters the hilt
    if (o.seat !== false) seat(D, u0 - 1, w0 + 2, 13, { col: m.k, op: .75 });
  });
  S.stroke(line(F, R.map(p => [p[0], p[1] - .7])), m.hi, .8, { op: .45 });
  S.stroke(d, m.k, 1.1);
  return { d, half, L, R, P };
}

// ---------------------------------------------------------------- grips, hafts, bindings -------------------------------
// windings round a tube T (from tube()): o.pitch mm between turns, slant mm a turn climbs across the width
export function winding(F, T, pitch, slant, o = {}) {
  const u0 = T.A[0][0], u1 = T.A[T.A.length - 1][0], lo = Math.min(u0, u1), hi = Math.max(u0, u1); let d = '';
  const wAt = u => { for (let i = 0; i < T.A.length - 1; i++) { const a = T.A[i], b = T.A[i + 1]; if ((a[0] - u) * (b[0] - u) <= 0) { const t = (u - a[0]) / ((b[0] - a[0]) || 1); return [lerp(a[1], b[1], t), lerp(T.B[i][1], T.B[i + 1][1], t)]; } } return u < lo + 1e-6 === (u0 < u1) ? [T.A[0][1], T.B[0][1]] : [T.A[T.A.length - 1][1], T.B[T.B.length - 1][1]]; };
  for (let u = lo - Math.abs(slant) + (o.phase || 0); u < hi + Math.abs(slant); u += pitch) {
    const [a] = wAt(clamp(u, lo, hi)), [, b] = wAt(clamp(u + slant, lo, hi)), bow = o.bow ?? .18;
    d += spl(F.P([[u, a - 1], [u + slant * .5 + pitch * bow, (a + b) / 2], [u + slant, b + 1]]));
  }
  return d;
}
// a grain of long wandering lines down a haft or stave (wood, horn), one path. v0..v1: across; n lines
export function grain(F, r, u0, u1, v0, v1, n, o = {}) {
  let d = '';
  for (let j = 0; j < n; j++) {
    const v = lerp(v0, v1, (j + .2 + r() * .6) / n), a = u0 + r() * (u1 - u0) * .5, b = Math.min(u1, a + (u1 - u0) * (.25 + r() * .6)), ph = r() * 6.28, f = (o.freq || .02) * (.6 + r() * .9), amp = (o.amp ?? .5) * (v1 - v0) / n, pts = [];
    for (let u = a; u <= b; u += (o.du || 14)) pts.push([u, v + Math.sin(u * f + ph) * amp]);
    if (pts.length > 1) d += spl(F.P(pts));
  }
  return d;
}
// a wooden haft or stave along u: stations [u, half-width, centre v]; grain; its round turn
export function haft(D, st, m, o = {}) {
  const { S, F } = D, T = tube(F, st, { t: o.t ?? .5 }), r = D.r('haft' + (o.key || ''));
  const u0 = st[0][0], u1 = st[st.length - 1][0], w = Math.max(...st.map(s => s[1]));
  piece(D, T.pts, m, { t: 0, shade: 'round', layer: o.layer, inside: (d, P) => {
    const g = grain(F, r, Math.min(u0, u1), Math.max(u0, u1), -w, w, o.grain ?? 9, { freq: o.freq, amp: o.amp ?? .7, du: o.du });
    S.stroke(g, m.d, .5, { units: 1, op: o.grainOp ?? .4 });
    S.stroke(grain(F, r, Math.min(u0, u1), Math.max(u0, u1), -w, w * .2, 4, { amp: .6 }), m.hi, .4, { units: 1, op: .3 });
    if (o.inside) o.inside(d, P, T);
  } });
  return T;
}
// a pelt bound round a bar from u0 to u1 (half-width hw): three coats of tufts, dark under light, ragged at its edges
export function pelt(D, u0, u1, hw, cols, o = {}) {
  const { S, F } = D, r = D.r('pelt' + u0), m = stuff(cols[1]), body = tube(F, [[u0, hw - 1], [(u0 + u1) / 2, hw + .5], [u1, hw - 1]]);
  piece(D, body.pts, m, { t: 0, shade: 'round', line: false });
  S.layer(o.layer || 'main');
  const rows = Math.round(hw * 2 / 4.2), coat = (col, n, L, w, op, sh = 0) => {
    let d = ''; for (let j = 0; j <= rows; j++) { const v = lerp(-hw, hw, j / rows) + sh; d += tufts(F, r, [[u0 + 2, v], [u1 - 6, v]], n, L, { w, lean: [1, (v / hw) * .5], spread: .8 }); }
    S.fill(d, col, { op });
  };
  coat(cols[0], Math.round((u1 - u0) / 5), 20, 2.2, .95);
  coat(cols[1], Math.round((u1 - u0) / 4), 17, 1.7, .95, 1.3);
  // the form under the coat: lighter where the light falls, darker on the far side
  S.fill(curve(F, body.pts, 0), S.lin(...across(F.P(body.pts), F.vx), [[0, '#000000', .1], [.25, '#ffffff', .16], [.5, '#000000', 0], [1, '#05040a', .55]]));
  coat(cols[2], Math.round((u1 - u0) / 7), 13, 1.1, .8, -1);
  if (cols[3]) coat(cols[3], Math.round((u1 - u0) / 16), 16, .7, .7, .6);
}
// tufts of hair or fur thrown off a line of (u, v) points, leaning along `lean` (a (u, v) vector); one path of blades
export function tufts(F, r, pts, n, lenMm, o = {}) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const t = (i + r()) / n, p = along(pts, clamp(t)), L = lenMm * (.55 + r() * .7), w = (o.w || 1.4) * (.6 + r() * .8), ln = o.lean || [0, 1], j = (r() - .5) * (o.spread ?? .9);
    const dx = [ln[0] * Math.cos(j) - ln[1] * Math.sin(j), ln[0] * Math.sin(j) + ln[1] * Math.cos(j)], tipp = add(p, mul(dx, L)), nn = perp(dx), bend = (r() - .5) * L * (o.bend ?? .35);
    const mid = add(mix(p, tipp, .5), mul(nn, bend)), a = F.W(p[0] + nn[0] * w, p[1] + nn[1] * w), b = F.W(p[0] - nn[0] * w, p[1] - nn[1] * w), m1 = F.W(mid[0] + nn[0] * w * .7, mid[1] + nn[1] * w * .7), m2 = F.W(mid[0] - nn[0] * w * .7, mid[1] - nn[1] * w * .7), tp = F.W(tipp[0], tipp[1]);
    d += `M${n1(a[0])} ${n1(a[1])}Q${n1(m1[0])} ${n1(m1[1])} ${n1(tp[0])} ${n1(tp[1])}Q${n1(m2[0])} ${n1(m2[1])} ${n1(b[0])} ${n1(b[1])}Z`;
  }
  return d;
}
