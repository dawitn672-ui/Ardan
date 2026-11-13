// Gate 2 · dress, armour and arms. Every piece is its own ITEM: a function that draws one thing on the rig, into the
// layer it belongs to, from its options (dye, trim, quality). A person's gear is a list of items in the order they
// are put on, so pieces are swapped, re-dyed or regraded without touching the others. Quality q is 1 plain,
// 2 fine, 3 masterwork: the same cut, with better metal, edging and engraving.
import { lerp, clamp, sstep, add, sub, mul, mix, norm, perp, len, rad, dir, rot, spl, splPts, poly, polyPts, polyline, ell, ellPts, offset, ink, taper, fade, swell, part, along, blade, stream, mixc, n1 } from './g.js';
import { cloth, metal } from './palette.js';

// ---------------------------------------------------------------- helpers -------------------------------------------
// a limb's covering: a centre line through joints and a radius at each
function tube(pts, radii, per = 6, tens = .8) {
  const c = splPts(pts, false, tens, per);
  const rAt = t => { const x = clamp(t) * (radii.length - 1), i = Math.min(radii.length - 2, Math.floor(x)); return lerp(radii[i], radii[i + 1], x - i); };
  const A = offset(c, t => rAt(t)), B = offset(c, t => -rAt(t));
  return { c, A, B, rAt, d: polyline([...A, ...B.slice().reverse()], true) };
}
const leftRight = (p, q) => (p[0] <= q[0] ? [p, q] : [q, p]);
const across = T => leftRight(along(T.A, .5), along(T.B, .5));
// soft tone across a form: light on the screen-left edge, shadow on the right (the one light of the page)
function tone(S, d, m, a, b, o = {}) {
  S.fill(d, S.lin(a, b, [[0, m.l, o.hi ?? .5], [.28, m.l, 0], [.5, m.s, 0], [1, m.s, o.sh ?? .95]]));
}
// polished plate: hard bands of light and dark across the form
function steel(S, d, m, a, b, o = {}) {
  S.fill(d, S.lin(a, b, [[0, m.s], [.07, m.b], [.2, m.l], [.27, m.hi], [.34, m.hi], [.35, m.b], [.58, m.s], [.8, m.d], [.92, m.d], [1, m.s]]));
  if (o.sky) S.fill(d, S.lin(o.sky[0], o.sky[1], [[0, m.hi, .5], [.4, m.hi, 0], [1, m.d, .45]]));
}
// an edging inside a shape's border: a band of trim with a dark line on its inner side
function edging(S, d, m, px, lw = .8) { S.within(d, () => { S.stroke(d, m.k, (px + lw) * 2); S.stroke(d, m.b, px * 2); S.stroke(d, m.l, px * .7, { op: .7 }); }); }
// engraved scrollwork along a line
function scrolls(S, pts, size, col, op = .9) {
  const n = Math.max(2, Math.round(len(sub(pts[0], pts[pts.length - 1])) / (size * 2.2))); let d = '';
  for (let i = 0; i < n; i++) { const t = (i + .5) / n, p = along(pts, t), tg = norm(sub(along(pts, Math.min(1, t + .02)), along(pts, Math.max(0, t - .02)))), nn = perp(tg), sg = i % 2 ? 1 : -1;
    const a = add(p, mul(tg, -size)), b = add(p, mul(tg, size)), c1 = add(p, add(mul(tg, -size * .2), mul(nn, sg * size * 1.1))), c2 = add(p, add(mul(tg, size * .9), mul(nn, sg * size * .9))), e = add(p, add(mul(tg, size * .35), mul(nn, sg * size * .25)));
    d += `M${n1(a[0])} ${n1(a[1])}Q${n1(c1[0])} ${n1(c1[1])} ${n1(b[0])} ${n1(b[1])}Q${n1(c2[0])} ${n1(c2[1])} ${n1(e[0])} ${n1(e[1])}`; }
  S.stroke(d, col, .9, { op });
}
const rivets = (S, pts, n, r, m) => { let d = ''; for (let i = 0; i < n; i++) { const p = along(pts, (i + .5) / n); d += `M${n1(p[0] - r)} ${n1(p[1])}a${n1(r)} ${n1(r)} 0 1 0 ${n1(2 * r)} 0a${n1(r)} ${n1(r)} 0 1 0 ${n1(-2 * r)} 0`; } S.fill(d, m.l); S.stroke(d, m.k, .6); };
// tufts of fur along an edge (pts), pointing along `out` (a function of 0..1 giving a direction)
function furEdge(S, r, pts, m, o = {}) {
  const n = o.n || 16, L = o.len || 22, w = o.w || 12;
  for (let i = 0; i < n; i++) { const t = (i + r() * .8) / n, p = along(pts, t), tg = norm(sub(along(pts, Math.min(1, t + .03)), along(pts, Math.max(0, t - .03)))), o2 = rot(perp(tg), (o.side || 1) > 0 ? 0 : Math.PI), d2 = norm(add(o2, mul(tg, r.s() * .7))), b = blade(sub(p, mul(o2, w * .3)), add(p, mul(d2, L * (.6 + .7 * r()))), w, r.s() * .2); S.fill(b.d, i % 3 === 0 ? m.s : m.b); S.stroke(b.e, m.k, .8, { op: .8 }); }
}
// hanging cloth: from a top edge a-b to a hem c-d, with pipe folds, a stepped hem and an optional trim band
function drape(S, r, a, b, c, d, m, o = {}) {
  const n = o.n ?? 5, wave = o.wave ?? 9, sag = o.sag ?? 6, fs = [];
  for (let i = 0; i < n; i++) fs.push((i + .5 + r.s() * .26) / n);
  const hemAt = t => add(mix(c, d, t), [0, Math.sin(Math.PI * t) * sag + (o.point ? (1 - Math.abs(2 * t - 1)) * o.point : 0)]), topAt = t => mix(a, b, t);
  const hem = [c]; for (const f of fs) { const p = hemAt(f); hem.push(add(p, [-wave * .5, wave * .45]), add(p, [wave * .35, -wave * .4])); } hem.push(d);
  const bow = o.bow ?? 8, sl = add(mix(a, c, .55), [-bow, 0]), sr = add(mix(b, d, .55), [bow, 0]);
  const pts = [a, b, sr, ...hem.slice().reverse(), sl], k = [.15, .15, .9, .3, ...hem.slice(1, -1).map(() => .45), .3, .9];
  const path = poly(pts, k), lit = leftRight(sl, sr);
  S.both(path, m.b, m.k, 1.1);
  const starts = fs.map((f, i) => mix(topAt(lerp(.5, f, o.gather ?? .7)), hemAt(f), o.from != null ? o.from : .06 + r() * .3));
  S.within(path, () => {
    tone(S, path, m, lit[0], lit[1], { sh: .85 });
    fs.forEach((f, i) => {
      const p = hemAt(f), st = starts[i];
      S.fill(polyline([st, add(p, [wave * .35, -wave * .4]), add(hemAt(Math.min(1, f + .55 / n)), [0, 10])], true), m.s, { op: .62 });
      S.fill(polyline([st, add(hemAt(Math.max(0, f - .4 / n)), [0, 10]), add(p, [-wave * .5, wave * .45])], true), m.l, { op: .3 });
    });
    if (o.inside) o.inside(path);
    if (o.trim) { const tw = o.trimW || 14, up = hem.map(p => [p[0], p[1] - tw]); S.fill(polyline([...hem, ...up.slice().reverse()], true), o.trim.b); S.stroke(polyline(up), o.trim.k, .8); S.stroke(polyline(hem.map(p => [p[0], p[1] - tw * .5])), o.trim.l, .7, { op: .7, dash: `${n1(tw * .12)} ${n1(tw * .5)}` , units: 0 }); }
  });
  fs.forEach((f, i) => { const p = hemAt(f), st = starts[i]; S.fill(ink(splPts([st, add(mix(st, p, .5), [r.s() * 5, 0]), add(p, [wave * .1, -wave * .3])], false, 1, 5), fade(S.lw(1.25), 1)), m.k, { op: .85 }); });
  S.stroke(path, m.k, 1.1);
  return { path, hem, hemAt };
}
// creases where a sleeve or a leg bends, and at a cuff
function creases(S, r, T, at, m, n = 3) {
  for (let i = 0; i < n; i++) { const t = at + (i - (n - 1) / 2) * .055 + r.s() * .012, a = along(T.A, t), b = along(T.B, t + r.s() * .05), sw = r() < .5; const p0 = sw ? a : b, p1 = mix(sw ? a : b, sw ? b : a, .5 + r() * .3); S.fill(ink(splPts([p0, add(mix(p0, p1, .5), [0, 3]), p1], false, 1, 4), fade(S.lw(1.15))), m.k, { op: .8 }); }
}
// a point along the shoulder from the root of the neck (0) to the shoulder's tip (1)
const onSh = (F, i, t) => (t < .4 ? mix(F.nb[i], F.trap[i], t / .4) : mix(F.trap[i], F.sh[i], (t - .4) / .6));
const SG = [-1, 1];

// ---------------------------------------------------------------- the body under the dress ---------------------------
function armTube(F, i, e = 0, cuff = 0, to = 1) {
  const A = F.arm[i], R = F.armR, fore = mix(A.el, A.wr, .25);
  if (to < 1) return tube([A.sh, mix(A.sh, A.el, to * 2)], [R[0] + e, lerp(R[0], R[1], to * 2) + e]);
  return tube([A.sh, A.el, fore, A.wr], [R[0] + e, R[1] + e * .9, R[2] + e * .9, R[3] + e * .7 + cuff]);
}
// the round of the shoulder that a sleeve or an arm starts from: filled, and lined only on its outer side
function shoulderBall(S, F, i, m, e = 0) {
  const A = F.arm[i], R = F.armR[0] + e, u = norm(sub(A.el, A.sh)), n0 = perp(u), n = (n0[0] * A.s > -n0[0] * A.s) ? n0 : mul(n0, -1);
  const a0 = Math.atan2(-.9, -A.s * .5), a1 = Math.atan2(n[1], n[0]); let da = a1 - a0; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
  const arc = []; for (let k = 0; k <= 8; k++) { const a = a0 + da * k / 8; arc.push([A.sh[0] + Math.cos(a) * R, A.sh[1] + Math.sin(a) * R]); }
  const bd = ell(A.sh, R, R); S.fill(bd, m.b); tone(S, bd, m, [A.sh[0] - R, A.sh[1]], [A.sh[0] + R, A.sh[1]]); return arc;
}
function legTube(F, i, e = 0, from = 0, to = 1) {
  const G = F.leg[i], R = F.legR, calf = mix(G.kn, G.an, .3), pts = [G.hip, G.kn, calf, G.an], rr = [R[0] + e, R[1] + e * .8, R[2] + e * .8, R[3] + e * .6];
  if (from === 0 && to === 1) return tube(pts, rr);
  const full = tube(pts, rr, 8), n = full.c.length - 1, i0 = Math.round(from * n), i1 = Math.round(to * n), c = full.c.slice(i0, i1 + 1);
  const A = full.A.slice(i0, i1 + 1), B = full.B.slice(i0, i1 + 1);
  return { c, A, B, d: polyline([...A, ...B.slice().reverse()], true) };
}
function limbFill(S, T, m, o = {}) {
  S.fill(T.d, m.b);
  const [a, b] = across(T);
  S.within(T.d, () => { o.metal ? steel(S, T.d, m, a, b) : tone(S, T.d, m, a, b); o.inside && o.inside(a, b); });
  S.stroke(polyline(T.A), m.k, 1.1); S.stroke(polyline(T.B), m.k, 1.1);
  if (o.cap !== false) S.stroke(polyline([T.A[T.A.length - 1], T.B[T.B.length - 1]]), m.k, 1.1);
}
// hands, in the wrist's own frame: x runs on from the forearm, y toward the body
const HAND = {
  relaxed: { main: [[0, -.2], [.3, -.26], [.55, -.25], [.8, -.19], [.97, -.08], [1, .04], [.9, .1], [.72, .08], [.55, .1], [.45, .18], [.3, .2], [0, .2]], thumb: [[.14, .1], [.34, .17], [.5, .22], [.6, .3], [.57, .37], [.44, .33], [.28, .28], [.12, .22]], lines: [[[.58, -.17], [.97, -.05]], [[.6, -.09], [.99, .01]], [[.6, -.01], [.93, .07]]] },
  fist: { main: [[0, -.2], [.28, -.28], [.52, -.27], [.63, -.14], [.64, .06], [.56, .24], [.3, .3], [0, .2]], thumb: [[.2, .14], [.44, .1], [.6, .16], [.62, .27], [.46, .3], [.24, .27]], lines: [[[.5, -.2], [.64, -.12]], [[.54, -.08], [.66, -.02]], [[.55, .04], [.65, .1]]] },
};
function hand(S, F, i, m, kind, plate) {
  const A = F.arm[i], L = F.handL, x = A.dirF, y = mul(perp(x), A.s), base = add(A.wr, mul(x, -L * .04));
  const shape = HAND[kind === 'relaxed' || kind === 'flat' ? 'relaxed' : 'fist'], k = x, ky = mul(perp(k), A.s);
  const W = p => add(base, add(mul(k, p[0] * L), mul(ky, p[1] * L * .86)));
  S.layer('hands');
  const dm = poly(shape.main.map(W), .75), dt = poly(shape.thumb.map(W), .8);
  S.both(dm, m.b, m.k, 1.05); S.within(dm, () => S.fill(dm, S.lin(W([.2, -.2]), W([.8, .25]), [[0, m.s, 0], [1, m.s, .8]])));
  for (const ln of shape.lines) S.stroke(polyline(ln.map(W)), m.k, .9, { op: .8 });
  if (plate) for (const u of [.2, .36, .5]) S.stroke(spl([W([u, -.25]), W([u + .05, 0]), W([u, .2])]), m.k, .9, { op: .75 });
  S.both(dt, m.b, m.k, 1.05);
}
// a shoe seen three-quarters on: the heel under the ankle, the toe out and a little down; +y is the sole's side
function foot(S, F, i, m, kind = 'turn', o = {}) {
  const G = F.leg[i], sg = G.s, t = sg * rad(60 + 10 * G.free - (F.male ? 0 : 8)), x = dir(t), y = mul(perp(x), sg), L = F.footL * .5, Wd = F.footL * .4 * (1 + .1 * F.wt), tip = kind === 'poulaine' ? .3 : kind === 'sabaton' ? .12 : 0;
  const W = p => add(G.an, add(mul(x, p[0] * L), mul(y, (p[1] + .42) * Wd)));
  const pts = [[-.34, -.06], [-.28, -.46], [.12, -.58], [.5, -.42], [.84, -.26], [1.02 + tip, tip ? .08 : -.06], [.98, .18], [.5, .2], [-.26, .2]].map(W);
  const d = poly(pts, [.8, .7, .6, .9, .9, tip ? .25 : .9, .6, .3, .6]);
  S.both(d, m.b, m.k, 1.1);
  S.within(d, () => { o.metal ? steel(S, d, m, W([.3, -.5]), W([.3, .25])) : S.fill(d, S.lin(W([.3, -.5]), W([.3, .22]), [[0, m.l, .5], [.35, m.l, 0], [.5, m.s, 0], [1, m.s, .95]])); o.inside && o.inside(W); });
  if (kind !== 'bare') S.stroke(poly([W([1 + tip, tip ? .1 : -.02]), W([.97, .18]), W([.5, .2]), W([-.22, .2]), W([-.3, -.06])], [0, .6, .3, .6, 0], false), m.k, 2.8);
  if (kind === 'bare') for (const q of [.72, .82, .9]) S.stroke(polyline([W([q, -.18 + (q - .72) * .5]), W([q + .05, .12])]), m.k, .8, { op: .7 });
  if (kind === 'turn' || kind === 'poulaine') { S.stroke(spl([W([.02, -.5]), W([.2, -.2]), W([.12, .16])]), m.k, .9, { op: .8 }); S.stroke(spl([W([.2, -.44]), W([.55, -.2]), W([.9, -.06])]), m.k, .8, { op: .5 }); }
  return W;
}

// ---------------------------------------------------------------- charges (Ardan's own, plain shapes) ----------------
export const CHARGES = ['sun', 'tower', 'antlers', 'star', 'crescent', 'tree', 'chevron'];
export function charge(S, kind, c, z, m) {
  const P2 = (x, y) => [c[0] + x * z, c[1] + y * z], line = (...p) => polyline(p.map(q => P2(q[0], q[1])), true);
  let d = '';
  if (kind === 'sun') { for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283, b = a + .13, e = a - .13, ro = i % 2 ? 1 : .8; d += polyline([P2(Math.cos(e) * .5, Math.sin(e) * .5), P2(Math.cos(a) * ro, Math.sin(a) * ro), P2(Math.cos(b) * .5, Math.sin(b) * .5)], true); } d += ell(c, z * .42, z * .42); }
  else if (kind === 'tower') d = line([-.5, 1], [-.5, -.35], [-.68, -.35], [-.68, -1], [-.4, -1], [-.4, -.72], [-.14, -.72], [-.14, -1], [.14, -1], [.14, -.72], [.4, -.72], [.4, -1], [.68, -1], [.68, -.35], [.5, -.35], [.5, 1], [.17, 1], [.17, .45], [0, .25], [-.17, .45], [-.17, 1]);
  else if (kind === 'antlers') { for (const sg of [-1, 1]) d += line([sg * .08, .9], [sg * .2, .3], [sg * .55, -.1], [sg * .5, -.55], [sg * .68, -.2], [sg * .95, -.55], [sg * .8, -.05], [sg * 1, .1], [sg * .7, .2], [sg * .4, .5], [sg * .22, .95]); d += line([-.22, .6], [0, 1.05], [.22, .6], [0, .78]); }
  else if (kind === 'star') { const p = []; for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283 - 1.5708, ro = i % 2 ? .38 : (i % 4 ? .72 : 1); p.push(P2(Math.cos(a) * ro, Math.sin(a) * ro)); } d = polyline(p, true); }
  else if (kind === 'crescent') d = `M${n1(c[0] - z * .9)} ${n1(c[1] - z * .1)}A${n1(z * .9)} ${n1(z * .9)} 0 1 0 ${n1(c[0] + z * .9)} ${n1(c[1] - z * .1)}A${n1(z * 1.1)} ${n1(z * 1.1)} 0 0 1 ${n1(c[0] - z * .9)} ${n1(c[1] - z * .1)}Z`;
  else if (kind === 'tree') d = line([-.1, 1], [-.1, .35], [-.75, .35], [-.35, -.15], [-.6, -.15], [-.2, -.6], [-.38, -.6], [0, -1.05], [.38, -.6], [.2, -.6], [.6, -.15], [.35, -.15], [.75, .35], [.1, .35], [.1, 1]);
  else d = line([-1, .1], [0, -.75], [1, .1], [1, .6], [0, -.25], [-1, .6]);
  S.fill(d, m.b); S.stroke(d, m.k, .8);
}

// ---------------------------------------------------------------- make and rarity -----------------------------------
// Two measures on every piece of arms and armour. MAKE (q: 0 crude, 1 plain, 2 fine, 3 masterwork) is the smith's
// care: finish, edging, engraving. RARITY (r: 0 common, 1 rare, 2 epic, 3 legendary) is what the thing is: its metal and
// its own shape. A common masterwork blade is bright steel, gilt and engraved; a rare plain one is blued and bare.
export const MAKES = ['Crude', 'Plain', 'Fine', 'Masterwork'], RARITIES = ['Common', 'Rare', 'Epic', 'Legendary'];
const PLATE = [['iron', 'steel', 'steel', 'bright'], ['blued', 'blued', 'blued', 'blued'], ['black', 'black', 'black', 'black'], ['sunsteel', 'sunsteel', 'sunsteel', 'sunsteel']];
const FIT = [['iron', 'iron', 'bronze', 'gold'], ['iron', 'bronze', 'silver', 'gold'], ['bronze', 'bronze', 'gold', 'gold'], ['gold', 'gold', 'gold', 'gold']];
const dull = m => ({ b: mixc(m.b, '#6d655d', .45), s: mixc(m.s, '#48423d', .4), d: m.d, l: mixc(m.l, m.b, .65), hi: mixc(m.hi, m.b, .75), k: m.k });
export function mats(o = {}) {
  const q = clamp(o.q ?? 1, 0, 3), r = clamp(o.r || 0, 0, 3); let st = metal(o.metal || PLATE[r][q]); if (q === 0) st = dull(st);
  return { q, r, st, fit: metal(FIT[r][q]), edge: q > 1 || r > 1, scroll: q > 2 || r > 2, rivet: q < 2 && r < 2 };
}
const GEM = ['#9c1f2c', '#2f5fa8', '#6a2f9c', '#f2c94c'];
// G: where the guard crosses the blade; a: the blade's direction (radians, 0 = down); L: blade length; q: make; o.r: rarity
export function swordArt(S, G, a, L, q = 1, o = {}) {
  const M = mats({ q, r: o.r }), { st, fit, r } = M, x = dir(a), y = perp(x), W = (u, v) => add(G, add(mul(x, u), mul(y, v)));
  const lea = cloth(o.leather || [['hemp', 'brown', 'dark', 'crimson'], ['brown', 'navy', 'navy', 'blue'], ['dark', 'black', 'black', 'murrey'], ['linen', 'white', 'white', 'white']][r][M.q]);
  const bw = L * (.034 + .003 * r), gl = L * (.1 + .012 * M.q + .008 * r), grip = L * .125, pr = L * (.026 + .003 * M.q + .002 * r);
  const prof = [[1, .93, .83, .7], [1, .95, .87, .72], [1, .84, .99, .8], [1.08, .9, 1.13, .86]][r], ts = [0, .33, .66, .88];
  if (o.sheathed) {
    const d = poly([W(L * .012, -bw * 1.25), W(L * .9, -bw * .95), W(L * 1.02, 0), W(L * .9, bw * .95), W(L * .012, bw * 1.25)], [0, .3, .7, .3, 0]);
    S.both(d, lea.b, lea.k, 1.05); S.within(d, () => { const lr = leftRight(W(L * .5, -bw), W(L * .5, bw)); tone(S, d, lea, lr[0], lr[1]); if (M.q === 0) for (const u of [.3, .55, .75]) S.stroke(polyline([W(L * u, -bw), W(L * (u + .02), bw)]), lea.k, .8, { op: .5 }); });
    const band = (u0, u1, m) => { const b = polyline([W(u0, -bw * 1.3), W(u1, -bw * lerp(1.3, .95, u1 / (L * .9))), W(u1, bw * lerp(1.3, .95, u1 / (L * .9))), W(u0, bw * 1.3)], true); S.both(b, m.b, m.k, .9); S.within(b, () => { const lr = leftRight(W(u0, -bw), W(u0, bw)); steel(S, b, m, lr[0], lr[1]); }); };
    if (M.q > 0) { band(L * .012, L * .1, fit); band(L * .86, L * 1.0, fit); } if (M.q > 1) band(L * .3, L * .345, fit); if (r > 1) band(L * .58, L * .62, fit);
    if (M.scroll) { scrolls(S, [W(L * .12, 0), W(L * .28, 0)], bw * .5, fit.l); scrolls(S, [W(L * .37, 0), W(L * .56, 0)], bw * .5, fit.b, .8); scrolls(S, [W(L * .64, 0), W(L * .84, 0)], bw * .5, fit.b, .8); }
  } else {
    if (r === 3) S.fill(ell(W(L * .5, 0), L * .56, bw * 4.5, Math.atan2(x[1], x[0])), '#fff1b8', { op: .55, filter: S.blur(bw * 1.7) });
    const up = ts.map((t, i) => W(L * t, -bw * prof[i])), dn = ts.map((t, i) => W(L * t, bw * prof[i])).reverse(), kk = [0, .7, .7, .5];
    const d = poly([...up, W(L, 0), ...dn], [...kk, .15, ...kk.slice().reverse()]);
    S.both(d, st.b, st.k, 1.05);
    S.within(d, () => {
      S.fill(polyline([W(0, -bw * 1.3), W(L, -bw * 1.3), W(L, 0), W(0, 0)], true), st.l); S.fill(polyline([W(0, 0), W(L, 0), W(L, bw * 1.3), W(0, bw * 1.3)], true), st.s);
      const fl = r === 1 ? .78 : .6;
      if (r === 2) for (const v of [-.36, .36]) S.fill(polyline([W(L * .03, bw * (v - .12)), W(L * .56, bw * (v - .08)), W(L * .6, bw * v), W(L * .56, bw * (v + .08)), W(L * .03, bw * (v + .12))], true), st.d, { op: .7 });
      else S.fill(polyline([W(L * .02, -bw * .3), W(L * fl, -bw * .2), W(L * (fl + .04), 0), W(L * fl, bw * .2), W(L * .02, bw * .3)], true), r === 3 ? fit.b : st.d, { op: r === 3 ? .9 : .55 });
      if (M.q > 0) S.fill(polyline([W(L * .3, -bw * 1.3), W(L * .42, -bw * 1.3), W(L * .36, bw * 1.3), W(L * .24, bw * 1.3)], true), st.hi, { op: M.q > 1 ? .75 : .45 });
      if (r === 1) for (const v of [-.62, .62]) S.stroke(spl([0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => W(L * (.06 + i * .1), bw * (v + (i % 2 ? .12 : -.12))))), st.hi, .8, { op: .55 });        // the pattern-welded edge
      if (r === 2 && M.q > 0) { let rn = ''; for (let i = 0; i < 9; i++) { const p = W(L * (.1 + i * .05), 0), z = bw * .2; rn += `M${n1(p[0] - z)} ${n1(p[1] - z)}l${n1(z)} ${n1(2 * z)}l${n1(z)} ${n1(-2 * z)}`; } S.stroke(rn, fit.l, .9, { op: .9 }); }
      if (M.q === 0) for (const [u, v] of [[.22, -1], [.47, 1], [.63, -1], [.8, 1]]) S.fill(polyline([W(L * u, v * bw * 1.2), W(L * (u + .012), v * bw * .62), W(L * (u + .03), v * bw * 1.2)], true), st.k, { op: .8 });   // nicks in a crude edge
    });
    if (r === 3) scrolls(S, [W(L * .05, 0), W(L * .56, 0)], bw * .26, fit.k, .8); else if (M.q > 2) scrolls(S, [W(L * .05, 0), W(L * .32, 0)], bw * .3, fit.b);
  }
  // guard, grip, pommel
  const curve = [0, 0, .12, .26][M.q] * gl + (r > 0 ? gl * .1 : 0), gw = L * (.016 + .003 * M.q), fl2 = r > 0 ? 1.5 : 1, wing = r === 3 ? [W(gw * 3.4, gl * .7), W(gw * 3.4, -gl * .7)] : null;
  const gpts = [W(-gw * fl2, -gl), W(-gw * 1.2, 0), W(-gw * fl2, gl), W(gw * fl2 + curve, gl * 1.04), ...(wing ? [wing[0]] : []), W(gw * .9, gl * .4), W(gw * 1.3, 0), W(gw * .9, -gl * .4), ...(wing ? [wing[1]] : []), W(gw * fl2 + curve, -gl * 1.04)];
  const gd = poly(gpts, r === 2 ? .2 : M.q < 2 ? .25 : .6), gp = polyline([W(-gw, -bw * .72), W(-grip, -bw * .56), W(-grip, bw * .56), W(-gw, bw * .72)], true), nw = [3, 5, 9, 11][M.q];
  S.both(gp, lea.b, lea.k, 1); S.within(gp, () => { const lr = leftRight(W(-grip * .5, -bw), W(-grip * .5, bw)); tone(S, gp, lea, lr[0], lr[1]); for (let i = 1; i < nw; i++) { const u = -gw - (grip - gw) * i / nw; S.stroke(polyline([W(u, -bw), W(u - bw * .5, bw)]), M.q > 1 ? fit.l : lea.k, .8, { op: .8 }); } });
  S.both(gd, fit.b, fit.k, 1.05); S.within(gd, () => { const lr = leftRight(W(0, -gl), W(0, gl)); steel(S, gd, fit, lr[0], lr[1]); });
  if (M.scroll) { scrolls(S, [W(0, -gl * .85), W(0, -gl * .2)], gw * .5, fit.k, .7); scrolls(S, [W(0, gl * .2), W(0, gl * .85)], gw * .5, fit.k, .7); }
  const pc = W(-grip - pr * .8, 0), pn = [12, 10, 6, 8][r], pd = M.q === 0 ? poly(ellPts(pc, pr * .95, pr * .8, a, 7), .5) : poly(ellPts(pc, pr * (r === 1 ? .9 : 1.08), pr * (r === 1 ? 1.25 : 1.08), a, pn), r === 2 ? .35 : .85);
  if (r === 3) { const ring = ell(pc, pr * 1.5, pr * 1.5); S.stroke(ring, fit.k, 5.4); S.stroke(ring, fit.b, 3.6); }
  S.both(pd, fit.b, fit.k, 1.05); S.within(pd, () => steel(S, pd, fit, add(pc, [-pr, -pr]), add(pc, [pr, pr])));
  if (M.q > 1) S.stroke(ell(pc, pr * .55, pr * .55), fit.k, .8);
  if (M.q > 2 || r > 1) { const gem = ell(pc, pr * .4, pr * .4); S.both(gem, GEM[r], '#1b0b10', .8); S.fill(ell(add(pc, [-pr * .12, -pr * .14]), pr * .13, pr * .1), '#ffffff', { op: .85 }); }
  return { pommel: pc, W };
}
// one layered shoulder piece (three lames); c: the shoulder's top, R: its size, sg: which side, q: make, o.r: rarity
export function pauldronArt(S, c, R, sg, q = 1, o = {}) {
  const M = mats({ ...o, q }), { st, fit } = M, W = p => [c[0] + sg * p[0] * R, c[1] + p[1] * R];
  for (let j = 2; j >= 0; j--) {
    const pts = [[-.95, .08 + .06 * j], [-.62, -.5 + .05 * j], [.1, -.64 + .12 * j], [.78 + .07 * j, -.3 + .22 * j], [1.02 + .09 * j, .36 + .44 * j], [.55, .64 + .47 * j], [-.2, .5 + .44 * j], [-.82, .38 + .3 * j]].map(W);
    const d = poly(pts, [.7, .9, .9, .9, M.r === 2 ? .15 : .5, .8, .8, .6]), lr = leftRight(W([-.9, 0]), W([1, .3]));
    S.both(d, st.b, st.k, 1.1);
    S.within(d, () => { steel(S, d, st, lr[0], lr[1], { sky: [W([0, -.6]), W([0, .9 + .4 * j])] }); if (M.q === 0) for (const p of [[-.3, .1 + .4 * j], [.4, .2 + .4 * j]]) S.fill(ell(W(p), R * .08, R * .05, .4), st.d, { op: .6 }); });
    const low = polyPts([pts[4], pts[5], pts[6], pts[7]], .8, false, 4);
    if (M.edge) { S.within(d, () => { S.stroke(polyline(low), fit.k, 5.4); S.stroke(polyline(low), fit.b, 3.6); S.stroke(polyline(low), fit.l, 1, { op: .8 }); }); S.stroke(d, st.k, 1.1); }
    if (M.rivet) rivets(S, low.map(p => [p[0], p[1] - R * .09]), 4, R * .028, st);
    if (M.r > 1 && j === 0) for (const u of [-.35, 0, .35]) S.stroke(spl([W([-.1 + u * .5, -.56]), W([u * 1.1, -.1]), W([.1 + u * 1.5, .34])]), st.k, .8, { op: .45 });   // fluting on a rarer piece
    if (M.scroll && j === 0) scrolls(S, [W([-.5, -.1]), W([.1, -.28]), W([.7, .1])], R * .09, fit.b);
    if (M.scroll && j > 0) scrolls(S, low.map(p => [p[0], p[1] - R * .15]), R * .05, fit.b, .8);
  }
  if (M.edge) { const b = W([-.5, -.22]); S.both(ell(b, R * .1, R * .1), M.r > 1 ? GEM[M.r] : fit.b, fit.k, .9); S.fill(ell(add(b, [-R * .03, -R * .03]), R * .035, R * .03), fit.hi); }
}

// ---------------------------------------------------------------- the items ------------------------------------------
// C: { S, F, Hd, sk, r, look, st: {} } · each item: (C, o) => draws
export const ITEMS = {
  // --- legs and feet ---
  hose(C, o) {
    const { S, F } = C, m = cloth(o.dye || 'brown'); S.layer('legs');
    const hips = poly([F.hi[0], F.belt[0], F.belt[1], F.hi[1], add(F.leg[1].hip, [F.legR[0], 60]), add(F.crotch, [0, 26]), add(F.leg[0].hip, [-F.legR[0], 60])], .5);
    S.both(hips, m.b, m.k, 1.1);
    for (const i of [0, 1]) { const T = legTube(F, i, o.loose ? 9 : 2); limbFill(S, T, m, { cap: false }); if (o.loose) { creases(S, C.r, T, .5, m, 3); creases(S, C.r, T, .93, m, 2); } else creases(S, C.r, T, .5, m, 2); }
    S.stroke(polyline([add(F.crotch, [0, 4]), add(F.crotch, [0, 30])]), m.k, 1);
  },
  barelegs(C, o) { const { S, F, sk } = C; S.layer('legs'); for (const i of [0, 1]) { const T = legTube(F, i, 0, o.from ?? .45, 1); limbFill(S, T, sk, { cap: false }); } },
  wraps(C, o) { // cloth bound round the shins
    const { S, F } = C, m = cloth(o.dye || 'hemp'); S.layer('legs');
    for (const i of [0, 1]) { const T = legTube(F, i, 3, .56, 1); limbFill(S, T, m, { cap: false }); for (let k = 1; k < 8; k++) S.stroke(polyline([along(T.A, k / 8), along(T.B, k / 8 + .07)]), m.k, .9, { op: .75 }); }
  },
  shoes(C, o) {
    const { S, F, sk } = C, kind = o.kind || 'turn', M = mats(o), m = kind === 'bare' ? sk : kind === 'sabaton' ? M.st : cloth(o.leather || 'brown'); S.layer('legs');
    for (const i of [0, 1]) {
      if (kind === 'boot' || kind === 'ankle') { const T = legTube(F, i, kind === 'boot' ? 7 : 5, kind === 'boot' ? (o.high ? .46 : .58) : .86, 1); foot(S, F, i, m, 'boot'); limbFill(S, T, m); S.stroke(polyline([T.A[0], T.B[0]]), m.k, 1.1); creases(S, C.r, T, .85, m, 2); if (o.cuff) { const cf = polyline([add(T.A[0], [0, -3]), add(T.B[0], [0, -3]), T.B[2], T.A[2]], true); S.both(cf, cloth(o.cuff).b, m.k, 1); } if (kind === 'boot') S.fill(ink(part(T.c, .1, .8), S.lw(.9)), m.k, { op: .4 }); }
      else if (kind === 'sabaton') foot(S, F, i, m, 'sabaton', { metal: 1, inside: W => { for (const u of [.2, .4, .6, .8]) S.stroke(spl([W([u, -.56]), W([u + .09, -.1]), W([u + .04, .22])]), m.k, .9); if (M.edge) for (const u of [.2, .6]) S.stroke(spl([W([u + .03, -.56]), W([u + .12, -.1]), W([u + .07, .22])]), M.fit.b, 1.6); } });
      else foot(S, F, i, m, kind);
    }
  },
  // --- the tunic family: a body, a skirt to any length, sleeves of several cuts ---
  tunic(C, o) {
    const { S, F, r } = C, m = cloth(o.dye || 'russet'), e = o.ease ?? 10, male = F.male, trim = o.trim ? cloth(o.trim) : null;
    const nk = F.neckHalf * ({ round: 1.35, slit: 1.3, v: 1.35, high: 1.12, wide: 2.3, laced: 1.5 }[o.neck || 'round']), tN = clamp((nk - F.neckHalf * 1.06) / (F.shHalf - F.neckHalf * 1.06));
    const NL = onSh(F, 0, tN * .9), NR = onSh(F, 1, tN * .9), dip = { round: .07, slit: .07, v: .34, high: -.1, wide: .16, laced: .3 }[o.neck || 'round'], NB = [F.cxS, F.pit[1] + F.Hh * dip];
    const SLv = i => { const R0 = F.armR[0] + e * (o.sleeves === 'none' ? .2 : 1); return [F.arm[i].sh[0] + SG[i] * R0 * .74, F.arm[i].sh[1] - R0 * .68]; };
    const side = i => [SLv(i), add(F.ax[i], [SG[i] * e, 0]), ...(male ? [] : [add(F.ch[i], [SG[i] * (e + F.H * .006 * (1 - F.kid) * F.grown), F.B * .012])]), add(F.wa[i], [SG[i] * e * (o.fitted ? .5 : 1.5), 0]), add(F.belt[i], [SG[i] * e * (o.fitted ? .5 : 1.1), 0])];
    const L = side(0), R = side(1), ks = L.map((_, j) => (j === 0 ? .7 : j === L.length - 1 ? .15 : .85));
    const body = poly([NL, ...L, ...R.slice().reverse(), NR, NB], [.3, ...ks, ...ks.slice().reverse(), .3, o.neck === 'v' || o.neck === 'laced' ? .35 : .95]);
    // skirt first (it sits under the body's edge and the belt)
    const len2 = o.len ?? .3, hy = lerp(F.y.hip, F.y.ankle, len2), fl = (o.flare ?? 26) * (1 + len2 * 1.6) + F.hipHalf * .08;
    const bl = L[L.length - 1], br = R[R.length - 1];
    S.layer('skirt');
    const sk2 = drape(S, r, add(bl, [0, -8]), add(br, [0, -8]), [F.cx - F.hipHalf - fl, hy + (len2 > .9 ? 12 : 0)], [F.cx + F.hipHalf + fl, hy + (len2 > .9 ? 12 : 0)], m, { n: o.folds ?? (len2 > .6 ? 7 : 5), wave: o.wave ?? (8 + len2 * 8), trim: o.trimHem ? cloth(o.trimHem) : null, trimW: o.trimW || 13, bow: 6 + len2 * 10, sag: 5, point: o.point, from: o.from,
      inside: path => { if (o.mail) S.fill(path, mailPat(S)); if (o.quilt) for (let k = 1; k < 9; k++) S.stroke(polyline([mix(bl, br, k / 9), [lerp(F.cx - F.hipHalf - fl, F.cx + F.hipHalf + fl, k / 9), hy]]), m.k, .8, { op: .6 }); if (o.patch) { const p = [F.cx - F.hipHalf * .5, lerp(F.y.hip, hy, .6)], pm = cloth(o.patch); S.both(polyline([p, add(p, [44, 5]), add(p, [40, 50]), add(p, [-4, 44])], true), pm.b, m.k, .8); S.stroke(polyline([add(p, [4, 6]), add(p, [38, 10]), add(p, [35, 44]), add(p, [1, 39])], true), pm.k, .7, { dash: '3 3', op: .7 }); } } });
    if (o.split) { const top = mix(bl, br, .5), bot = sk2.hemAt(.5); const sp = polyline([add(top, [0, 30]), add(bot, [-fl * .2 - 16, 4]), add(bot, [fl * .2 + 16, 4])], true); S.fill(sp, cloth(o.under || 'charcoal').d); S.stroke(polyline([add(bot, [-fl * .2 - 16, 4]), add(top, [0, 30]), add(bot, [fl * .2 + 16, 4])]), m.k, 1.1); }
    C.st.hem = hy; C.st.skirt = sk2;
    S.layer('torso'); S.both(body, m.b, m.k, 1.1);
    S.within(body, () => {
      tone(S, body, m, [F.ax[0][0] - e, F.y.chest], [F.ax[1][0] + e, F.y.chest]);
      if (o.mail) S.fill(body, mailPat(S));
      if (o.quilt) for (let k = 1; k < 8; k++) S.stroke(polyline([mix(onSh(F, 0, .9), onSh(F, 1, .9), k / 8), mix(bl, br, k / 8)]), m.k, .8, { op: .6 });
      if (!male && F.grown > .5) for (const i of [0, 1]) S.fill(ell([F.cxS + SG[i] * F.chestHalf * .5, F.y.chest + F.B * .028], F.chestHalf * .5, F.B * .02), m.s, { op: .5, filter: S.blur(5) });
      S.fill(ell(mix(bl, br, .5), F.waistHalf * 1.3, F.B * .03), m.s, { op: .5, filter: S.blur(6) });       // the pull of the belt
      S.fill(ell([F.cxS + F.Hh * .05, F.pit[1] + F.Hh * .2], F.neckHalf * 2.4, F.Hh * .2), m.s, { op: .45, filter: S.blur(7) });   // under the chin
      if (trim) { const ed = poly([NL, NB, NR], [0, o.neck === 'v' || o.neck === 'laced' ? .35 : .95, 0], false); S.stroke(ed, trim.k, 9.6); S.stroke(ed, trim.b, 8); S.stroke(ed, trim.l, .7, { dash: '2 4', op: .8 }); }
    });
    // pulls from the arm pits to the belt and tucks above it
    for (const i of [0, 1]) { const a = add(F.ax[i], [-SG[i] * 6, 8]), b = [lerp(F.wa[i][0], F.cx, .45), F.y.waist + F.B * .01]; S.fill(ink(splPts([a, add(mix(a, b, .5), [SG[i] * 8, 6]), b], false, 1, 5), fade(S.lw(1.15))), m.k, { op: .7 }); }
    for (let k = 0; k < 5; k++) { const x = lerp(bl[0], br[0], (k + .5 + r.s() * .2) / 5), y0 = lerp(bl[1], br[1], (k + .5) / 5); S.fill(ink([[x, y0 - 6], [x + r.s() * 3, y0 - 22 - r() * 22], [x + r.s() * 5, y0 - 44 - r() * 26]], fade(S.lw(1.1))), m.k, { op: .65 }); }
    if (o.neck === 'slit') S.stroke(polyline([NB, add(NB, [0, F.Hh * .22])]), m.k, 1.1);
    if (o.neck === 'laced') for (let k = 0; k < 4; k++) { const y = lerp(F.pit[1] + F.Hh * .04, NB[1] - 4, k / 3), w = (1 - k / 4) * nk * .5; S.stroke(polyline([[F.cxS - w, y], [F.cxS + w, y + 7]]), cloth('cream').b, 1.2); }
    if (o.buttons) { const g = metal(o.buttons), pts = [NB, mix(bl, br, .5)]; for (let k = 0; k < 7; k++) { const p = along(pts, (k + .7) / 7.5); S.both(ell(p, 4.6, 4.6), g.b, g.k, .7); S.fill(ell(add(p, [-1.2, -1.2]), 1.6, 1.4), g.hi); } }
    if (o.neck === 'high') { S.layer('collar'); const hc = poly([add(NL, [3, 2]), add(F.nb[0], [-3, -F.Hh * .13]), [F.cxS, F.pit[1] - F.Hh * .2], add(F.nb[1], [3, -F.Hh * .13]), add(NR, [-3, 2]), [F.cxS, F.pit[1] + F.Hh * .0]], [.3, .6, .9, .6, .3, .9]); S.both(hc, m.b, m.k, 1.1); S.within(hc, () => tone(S, hc, m, NL, NR)); if (trim) S.stroke(spl([add(F.nb[0], [-2, -F.Hh * .12]), [F.cxS, F.pit[1] - F.Hh * .19], add(F.nb[1], [2, -F.Hh * .12])]), trim.b, 3); }
    // sleeves
    const cut = o.sleeves || 'long';
    if (cut !== 'none') for (const i of C.armOrder) {
      const A = F.arm[i]; S.layer(A.back ? 'armsBack' : 'arms');
      const wide = cut === 'wide' ? 34 : cut === 'bell' ? 20 : 0, toEl = cut === 'short' || cut === 'rolled';
      if (toEl) {
        const arc = shoulderBall(S, F, i, m, e), T = armTube(F, i, e, 0, cut === 'rolled' ? .52 : .4); limbFill(S, T, m); S.stroke(polyline(arc), m.k, 1.1);
        if (cut === 'rolled') { const a = T.A[T.A.length - 1], b = T.B[T.B.length - 1], n = mul(norm(sub(a, b)), 4), dn = mul(norm(sub(A.el, A.sh)), 16); const cf = poly([add(a, n), sub(b, n), sub(add(b, dn), n), add(add(a, dn), n)], .5); S.both(cf, m.l, m.k, 1); }
        if (!A.back) { const U = tube([mix(A.sh, A.el, cut === 'rolled' ? .96 : .8), A.el, mix(A.el, A.wr, .25), A.wr], [F.armR[1] * 1.08, F.armR[1], F.armR[2], F.armR[3]]); S.layer('arms'); const sk = C.sk; S.fill(U.d, sk.b); S.within(U.d, () => { const [a, b] = across(U); tone(S, U.d, sk, a, b, { sh: .8 }); }); S.stroke(polyline(U.A), sk.k, 1.1); S.stroke(polyline(U.B), sk.k, 1.1); if (F.mu > .3) S.fill(ink(part(U.c, .3, .7), S.lw(1)), sk.k, { op: .4 }); }
      } else {
        const arc = shoulderBall(S, F, i, m, e), T = armTube(F, i, e, wide);
        limbFill(S, T, m, { inside: () => { if (o.mail) S.fill(T.d, mailPat(S)); } }); S.stroke(polyline(arc), m.k, 1.1);
        creases(S, r, T, .5, m, A.hang ? 3 : 5); creases(S, r, T, .9, m, 2);
        S.fill(ink(part(offset(T.c, A.s * (F.armR[0] + e) * .34), .1, .4), fade(S.lw(1.05))), m.k, { op: .55 }); S.fill(ink(part(offset(T.c, -A.s * (F.armR[1] + e) * .3), .56, .82), fade(S.lw(1))), m.k, { op: .5 });
        if (trim && cut !== 'wide') { const a = T.A[T.A.length - 1], b = T.B[T.B.length - 1], up = mul(norm(sub(A.el, A.wr)), 12); S.both(polyline([a, b, add(b, up), add(a, up)], true), trim.b, trim.k, .8); }
        if (wide) { // a hanging cuff
          const a = T.A[T.A.length - 1], b = T.B[T.B.length - 1], lo = a[1] > b[1] ? a : b, hang = poly([a, b, add(lo, [SG[i] * -6, wide * 2.2]), add(lo, [SG[i] * 10, wide * 1.6])], [.2, .2, .6, .7]); S.both(hang, m.b, m.k, 1.1); S.within(hang, () => S.fill(hang, m.s, { op: .5 })); if (trim) S.stroke(polyline([add(lo, [SG[i] * -6, wide * 2.2]), add(lo, [SG[i] * 10, wide * 1.6])]), trim.b, 3); }
      }
    }
  },
  apron(C, o) {
    const { S, F, r } = C, m = cloth(o.leather || 'tan'), bw = F.chestHalf * .62, top = F.y.chest - F.B * .012, by = F.y.belt, hy = lerp(F.y.hip, F.y.ankle, o.len ?? .42);
    S.layer('skirt'); drape(S, r, [F.cx - F.waistHalf * .92, by], [F.cx + F.waistHalf * .92, by], [F.cx - F.hipHalf * .96, hy], [F.cx + F.hipHalf * .96, hy], m, { n: 3, wave: 5, bow: 3, sag: 3, from: .5 });
    S.layer('torso'); const bib = poly([[F.cxS - bw, top], [F.cxS + bw, top], [F.cx + F.waistHalf * .96, by + 4], [F.cx - F.waistHalf * .96, by + 4]], .2); S.both(bib, m.b, m.k, 1.1); S.within(bib, () => tone(S, bib, m, [F.cxS - bw, top], [F.cxS + bw, top]));
    for (const i of [0, 1]) { const a = [F.cxS + SG[i] * bw * .92, top + 2], b = onSh(F, i, .22); S.stroke(polyline([a, b]), m.k, 5.2); S.stroke(polyline([a, b]), m.b, 3.6); }
    S.stroke(polyline([[F.cxS - bw + 8, top + 9], [F.cxS + bw - 8, top + 9]]), m.k, .8, { dash: '3 3', op: .7 });
    const pk = poly([[F.cx - 50, by + 60], [F.cx + 50, by + 60], [F.cx + 44, by + 140], [F.cx - 44, by + 140]], .3); S.layer('skirt').stroke(pk, m.k, 1); S.fill(pk, m.s, { op: .35 });
  },
  belt(C, o) {
    const { S, F, r } = C, m = cloth(o.leather || 'brown'), w = o.w || 30, [a, b] = F.belt, sagc = add(mix(a, b, .5), [0, 7 + 16 * Math.max(0, F.wt)]);
    const top = splPts([add(a, [-9, -w / 2]), add(sagc, [0, -w / 2]), add(b, [9, -w / 2])], false, 1, 8), bot = top.map(p => [p[0], p[1] + w]);
    S.layer('belt'); const band = polyline([...top, ...bot.slice().reverse()], true);
    if (o.rope) { S.both(band, m.b, m.k, 1.1); for (let k = 0; k < 22; k++) { const p = along(top, k / 22), q = along(bot, k / 22 + .03); S.stroke(polyline([p, q]), m.k, .8, { op: .7 }); } const kn = add(along(top, .58), [0, w / 2]); for (const dx of [-8, 12]) { const e = add(kn, [dx, 150 + dx * 3]); S.stroke(spl([kn, add(mix(kn, e, .5), [dx, 0]), e]), m.k, 7); S.stroke(spl([kn, add(mix(kn, e, .5), [dx, 0]), e]), m.b, 5); S.both(ell(e, 7, 9), m.b, m.k, 1); } S.both(ell(kn, 12, 11), m.b, m.k, 1); return; }
    S.both(band, m.b, m.k, 1.1); S.within(band, () => { tone(S, band, m, a, b); for (const k of [.17, .83]) S.stroke(polyline(top.map(p => [p[0], p[1] + w * k])), m.l, .75, { op: .65, dash: '2.6 2.4' }); });
    const fit = metal(o.metal || 'iron'), bc = add(along(top, o.at ?? .42), [0, w / 2]), bh = w * .78;
    if (o.plaques) for (let k = 0; k < 9; k++) { const p = add(along(top, (k + .5) / 9), [0, w / 2]); if (Math.abs(p[0] - bc[0]) < w) continue; const q = poly([add(p, [-w * .3, 0]), add(p, [0, -w * .32]), add(p, [w * .3, 0]), add(p, [0, w * .32])], .2); S.both(q, fit.b, fit.k, .8); S.fill(ell(add(p, [-2, -2]), 2.5, 2), fit.hi); }
    const fr = poly([add(bc, [-bh * .62, -bh]), add(bc, [bh * .62, -bh]), add(bc, [bh * .62, bh]), add(bc, [-bh * .62, bh])], .35); S.stroke(fr, fit.k, 6.5); S.stroke(fr, fit.b, 4.6); S.stroke(fr, fit.hi, 1, { op: .8 }); S.stroke(polyline([add(bc, [-bh * .5, 0]), add(bc, [bh * .6, 0])]), fit.k, 2.2);
    const e0 = add(bc, [bh * .7, w * .1]), e1 = add(bc, [bh * 1.1, w * 1.5 + (o.hang || 60)]); const tail = poly([add(e0, [-w * .26, 0]), add(e0, [w * .3, 0]), add(e1, [w * .3, 0]), add(e1, [0, w * .5]), add(e1, [-w * .26, 0])], .3); S.both(tail, m.b, m.k, 1.05); if (o.metal && o.metal !== 'iron') { const tp = poly([add(e1, [-w * .26, -w * .3]), add(e1, [w * .3, -w * .3]), add(e1, [w * .3, 0]), add(e1, [0, w * .5]), add(e1, [-w * .26, 0])], .3); S.both(tp, fit.b, fit.k, .9); }
    C.st.beltY = sagc[1]; C.st.beltW = w;
  },
  pouch(C, o) {
    const { S, F } = C, m = cloth(o.leather || 'tan'), sgn = o.side ?? -1, p = [F.cx + sgn * F.waistHalf * .7, (C.st.beltY || F.y.belt) + 8], z = o.z || 1; S.layer('belt');
    const d = poly([add(p, [-30 * z, 0]), add(p, [30 * z, 0]), add(p, [40 * z, 60 * z]), add(p, [0, 82 * z]), add(p, [-40 * z, 60 * z])], [.2, .2, .9, .9, .9]); S.both(d, m.b, m.k, 1.05); S.within(d, () => tone(S, d, m, add(p, [-40, 30]), add(p, [40, 30])));
    S.both(poly([add(p, [-32 * z, -2]), add(p, [32 * z, -2]), add(p, [26 * z, 34 * z]), add(p, [0, 44 * z]), add(p, [-26 * z, 34 * z])], [.2, .2, .7, .8, .7]), m.l, m.k, 1); const g = metal(o.metal || 'bronze'); S.both(ell(add(p, [0, 36 * z]), 5 * z, 5 * z), g.b, g.k, .8);
    if (o.keys) { const k0 = add(p, [sgn * -64, 6]); const kg = metal('iron'); S.stroke(ell(add(k0, [0, 16]), 12, 12), kg.k, 3.4); S.stroke(ell(add(k0, [0, 16]), 12, 12), kg.b, 2); for (const dx of [-7, 6]) { S.stroke(polyline([add(k0, [dx, 28]), add(k0, [dx * 1.8, 92]), add(k0, [dx * 1.8 + 10, 92]), add(k0, [dx * 1.8, 92]), add(k0, [dx * 1.8, 80]), add(k0, [dx * 1.8 + 8, 80])]), kg.k, 3.4); S.stroke(polyline([add(k0, [dx, 28]), add(k0, [dx * 1.8, 92])]), kg.l, 1.4); } }
  },
  tool(C, o) { // a hammer or a knife hung at the belt
    const { S, F } = C, sgn = o.side ?? 1, p = [F.cx + sgn * F.waistHalf * .8, (C.st.beltY || F.y.belt) - 6], wd = cloth('walnut'), ir = metal('iron'); S.layer('belt');
    if (o.kind === 'knife') { const sh = poly([add(p, [-11, 0]), add(p, [11, 0]), add(p, [7, 120]), add(p, [0, 138]), add(p, [-7, 120])], .3); S.both(sh, cloth('dark').b, cloth('dark').k, 1); S.both(poly([add(p, [-8, -52]), add(p, [8, -52]), add(p, [9, 0]), add(p, [-9, 0])], .4), wd.b, wd.k, 1); S.stroke(polyline([add(p, [-13, 0]), add(p, [13, 0])]), ir.b, 3); }
    else if (o.kind === 'axe') { const h = polyline([add(p, [-8, -40]), add(p, [8, -40]), add(p, [10, 300]), add(p, [-10, 300])], true); S.both(h, wd.b, wd.k, 1); S.within(h, () => tone(S, h, wd, add(p, [-9, 0]), add(p, [9, 0]))); const hd = poly([add(p, [sgn * 8, -34]), add(p, [sgn * 84, -62]), add(p, [sgn * 104, 6]), add(p, [sgn * 70, 44]), add(p, [sgn * 8, 12]), add(p, [-sgn * 22, 6]), add(p, [-sgn * 22, -26])], [.2, .5, .7, .5, .2, .3, .3]); S.both(hd, ir.b, ir.k, 1.05); S.within(hd, () => { steel(S, hd, ir, add(p, [0, -60]), add(p, [0, 40])); S.fill(poly([add(p, [sgn * 78, -58]), add(p, [sgn * 104, 6]), add(p, [sgn * 70, 44]), add(p, [sgn * 62, 30]), add(p, [sgn * 88, 2]), add(p, [sgn * 66, -46])], .6), ir.hi, { op: .7 }); }); }
    else { const h = polyline([add(p, [-7, -20]), add(p, [7, -20]), add(p, [9, 170]), add(p, [-9, 170])], true); S.both(h, wd.b, wd.k, 1); const hd = poly([add(p, [-40, -62]), add(p, [34, -62]), add(p, [42, -44]), add(p, [34, -22]), add(p, [-40, -22])], .25); S.both(hd, ir.b, ir.k, 1.05); S.within(hd, () => steel(S, hd, ir, add(p, [0, -62]), add(p, [0, -22]))); }
  },
  // --- over the shoulders ---
  hood(C, o) { // a hood thrown back: a roll round the neck and a short cape on the shoulders
    const { S, F, r } = C, m = cloth(o.dye || 'forest'), y0 = F.y.sh, dn = F.Hh * (o.cape ?? .62);
    S.layer('back').both(ell([F.cxS + F.Hh * .05, y0 - F.Hh * .2], F.neckHalf * 2.5, F.Hh * .3), m.s, m.k, 1.1);
    S.layer('shoulder'); const pts = [onSh(F, 0, .12), add(F.sh[0], [-F.armR[0] * 1.1, F.Hh * .12]), add(F.sh[0], [-F.armR[0] * 1.0, dn * .8]), [F.cxS - F.chestHalf * .5, y0 + dn], [F.cxS, y0 + dn * 1.12], [F.cxS + F.chestHalf * .5, y0 + dn], add(F.sh[1], [F.armR[0] * 1.0, dn * .8]), add(F.sh[1], [F.armR[0] * 1.1, F.Hh * .12]), onSh(F, 1, .12), [F.cxS, F.pit[1] + F.Hh * .05]];
    const d = poly(pts, [.3, .9, .7, o.dag ? .1 : .8, o.dag ? .1 : .9, o.dag ? .1 : .8, .7, .9, .3, .9]); S.both(d, m.b, m.k, 1.1);
    S.within(d, () => { tone(S, d, m, pts[1], pts[7]); S.fill(ell([F.cxS + F.Hh * .06, F.pit[1] + F.Hh * .14], F.neckHalf * 2.6, F.Hh * .2), m.s, { op: .6, filter: S.blur(6) }); });
    for (const i of [0, 1]) S.fill(ink(splPts([onSh(F, i, .5), add(F.sh[i], [-SG[i] * F.armR[0] * .2, dn * .4]), add(F.sh[i], [-SG[i] * F.armR[0] * .7, dn * .78])], false, 1, 5), fade(S.lw(1.1))), m.k, { op: .7 });
    S.layer('collar'); const roll = poly([add(F.nb[0], [-F.neckHalf * .7, F.Hh * .02]), add(F.nb[0], [-F.neckHalf * .1, -F.Hh * .1]), [F.cxS, F.pit[1] - F.Hh * .03], add(F.nb[1], [F.neckHalf * .1, -F.Hh * .1]), add(F.nb[1], [F.neckHalf * .7, F.Hh * .02]), [F.cxS + F.neckHalf * .6, F.pit[1] + F.Hh * .13], [F.cxS, F.pit[1] + F.Hh * .17], [F.cxS - F.neckHalf * .6, F.pit[1] + F.Hh * .13]], .9);
    S.both(roll, m.b, m.k, 1.1); S.within(roll, () => { tone(S, roll, m, F.nb[0], F.nb[1]); });
    S.fill(ink(splPts([add(F.nb[0], [-F.neckHalf * .3, F.Hh * .02]), [F.cxS - F.neckHalf * .2, F.pit[1] + F.Hh * .09], [F.cxS + F.neckHalf * .5, F.pit[1] + F.Hh * .1]], false, 1, 5), fade(S.lw(1.1))), m.k, { op: .7 });
  },
  cloak(C, o) {
    const { S, F, r } = C, m = cloth(o.dye || 'navy'), lin = cloth(o.lining || o.dye || 'navy'), hy = lerp(F.y.hip, F.y.ankle, o.len ?? .82), out = F.H * (o.spread ?? .06), trim = o.trim ? metal(o.trim) : null;
    const tl = add(F.sh[0], [-F.armR[0] * .8, -4]), tr = add(F.sh[1], [F.armR[0] * .8, -4]);
    S.layer('back'); drape(S, r, tl, tr, [F.cx - F.hipHalf - out * 1.9, hy], [F.cx + F.hipHalf + out * 1.9, hy], { ...lin, b: lin.s, s: lin.d, l: lin.b }, { n: 8, wave: 13, bow: out * .9, sag: 10, gather: .9, from: .25 });
    // the outer face turns forward down each side
    for (const i of [0, 1]) { const sg = SG[i], a = add(F.sh[i], [sg * F.armR[0] * .95, 0]), w = F.H * .035; const R2 = drape(S, r, add(a, [-sg * w * .3, 0]), add(a, [sg * w * .5, 4]), [F.cx + sg * (F.hipHalf + out * 1.9) - sg * w * 1.3, hy + 2], [F.cx + sg * (F.hipHalf + out * 1.9) + sg * w * .1, hy - 6], m, { n: 2, wave: 7, bow: sg * out * .4, sag: 2, from: .3, trim: trim ? { b: trim.b, k: trim.k, l: trim.hi } : null, trimW: 11 }); if (trim) { S.stroke(polyline([add(a, [-sg * w * .3, 0]), [F.cx + sg * (F.hipHalf + out * 1.9) - sg * w * 1.3, hy + 2]]), trim.k, 4.4); S.stroke(polyline([add(a, [-sg * w * .3, 0]), [F.cx + sg * (F.hipHalf + out * 1.9) - sg * w * 1.3, hy + 2]]), trim.b, 3); } }
    // a mantle over the shoulders, clasped at the breast
    if (o.mantle !== false) {
      S.layer('shoulder'); const dn = F.Hh * (o.mantle ?? .5);
      for (const i of [0, 1]) { const sg = SG[i], pts = [onSh(F, i, .1), add(F.sh[i], [sg * F.armR[0] * 1.25, F.Hh * .1]), add(F.sh[i], [sg * F.armR[0] * 1.3, dn]), [F.cxS + sg * F.chestHalf * .55, F.y.sh + dn * 1.25], [F.cxS + sg * F.neckHalf * .9, F.pit[1] + F.Hh * .2]]; const d = poly(pts, [.3, .9, .5, .35, .7]); S.both(d, m.b, m.k, 1.1); S.within(d, () => { tone(S, d, m, pts[i ? 4 : 1], pts[i ? 1 : 4]); if (trim) { const ed = poly([pts[2], pts[3], pts[4]], [0, .35, 0], false); S.stroke(ed, trim.k, 11); S.stroke(ed, trim.b, 9); S.stroke(ed, trim.hi, 1, { op: .8 }); } }); S.stroke(d, m.k, 1.1); S.fill(ink(splPts([onSh(F, i, .55), add(F.sh[i], [sg * F.armR[0] * .2, dn * .5]), add(F.sh[i], [sg * F.armR[0] * .5, dn * .95])], false, 1, 5), fade(S.lw(1.1))), m.k, { op: .7 }); if (o.q > 2 && trim) scrolls(S, [mix(pts[0], pts[3], .3), mix(pts[1], pts[2], .6)], 7, trim.b, .8); }
      const g = metal(o.clasp || 'bronze'), c0 = [F.cxS, F.pit[1] + F.Hh * .2]; S.stroke(polyline([add(c0, [-F.neckHalf * .9, 0]), add(c0, [F.neckHalf * .9, 0])]), g.k, 4.4); S.stroke(polyline([add(c0, [-F.neckHalf * .9, 0]), add(c0, [F.neckHalf * .9, 0])]), g.b, 2.8); for (const sg of SG) { const p = add(c0, [sg * F.neckHalf * .9, 0]); S.both(ell(p, 9, 9), g.b, g.k, .9); S.fill(ell(add(p, [-2.5, -2.5]), 3, 2.5), g.hi); }
    }
  },
  furcollar(C, o) {
    const { S, F, r } = C, m = cloth(o.fur || 'wolf'), z = F.Hh * (o.z ?? .3);
    S.layer('back'); const bk = splPts([add(F.sh[0], [-F.armR[0] * .4, 0]), add(F.nb[0], [-F.neckHalf * .6, -z * 1.0]), [F.cxS, F.y.sh - F.Hh * .3 - z * .6], add(F.nb[1], [F.neckHalf * .6, -z * 1.0]), add(F.sh[1], [F.armR[0] * .4, 0])], false, 1, 6); S.fill(polyline(bk, true), m.s); furEdge(S, r, bk, m, { n: 26, len: z * .5, w: z * .3, side: 1 });
    S.layer('collar');
    for (const i of [0, 1]) { const sg = SG[i], pts = [add(F.nb[i], [-sg * F.neckHalf * .2, -z * .5]), add(F.trap[i], [0, -z * .75]), add(F.sh[i], [sg * F.armR[0] * .9, -z * .1]), add(F.sh[i], [sg * F.armR[0] * .7, z * .8]), [F.cxS + sg * F.chestHalf * .5, F.y.sh + z * 1.3], [F.cxS + sg * F.neckHalf * .7, F.pit[1] + z * .7]]; const d = spl(pts, true); S.fill(d, m.b); S.within(d, () => { S.fill(d, S.lin(pts[1], pts[4], [[0, m.l, .6], [.5, m.l, 0], [1, m.s, .9]])); for (let k = 0; k < 26; k++) { const p = mix(mix(pts[1], pts[4], r()), mix(pts[2], pts[5], r()), r()), b = blade(p, add(p, [sg * (3 + r() * 6), z * (.2 + r() * .2)]), z * .15, r.s() * .2); S.fill(b.d, k % 2 ? m.s : m.l, { op: .7 }); } }); furEdge(S, r, splPts([pts[1], pts[2], pts[3], pts[4], pts[5]], false, 1, 5), m, { n: 34, len: z * .36, w: z * .24, side: sg }); furEdge(S, r, splPts([pts[5], pts[0], pts[1]], false, 1, 5), m, { n: 12, len: z * .28, w: z * .22, side: sg }); if (o.fur === 'ermine') for (let k = 0; k < 5; k++) { const p = mix(mix(pts[1], pts[4], .25 + r() * .5), mix(pts[2], pts[5], r()), .3 + r() * .5), b = blade(p, add(p, [sg * 2, z * .26]), z * .12, 0); S.fill(b.d, '#1d1a1c'); } }
  },
  bracers(C, o) { // leather guards laced on the forearm
    const { S, F } = C, m = cloth(o.leather || 'dark'), g = metal(o.metal || 'iron');
    for (const i of C.armOrder) {
      const A = F.arm[i]; if (A.back) continue; S.layer('arms');
      const T = tube([mix(A.el, A.wr, .3), mix(A.el, A.wr, .97)], [F.armR[2] * 1.1 + 3, F.armR[3] * 1.22 + 3]);
      limbFill(S, T, m); S.stroke(polyline([T.A[0], T.B[0]]), m.k, 1.1);
      for (const t of [.08, .92]) { S.stroke(polyline([along(T.A, t), along(T.B, t)]), m.k, 3.6); S.stroke(polyline([along(T.A, t), along(T.B, t)]), m.l, 1.6); }
      let d = ''; for (let k = 2; k < 8; k++) { const p = along(T.c, k / 9), q = 3.4; d += `M${n1(p[0] - q)} ${n1(p[1] - q)}l${n1(2 * q)} ${n1(2 * q)}m${n1(-2 * q)} 0l${n1(2 * q)} ${n1(-2 * q)}`; }
      S.stroke(d, o.studs ? g.l : m.l, .9, { op: .85 });
    }
  },
  baldric(C, o) { // a strap from one shoulder to the far hip
    const { S, F } = C, m = cloth(o.leather || 'brown'), g = metal(o.metal || 'iron'), i = o.from ?? 0, a = onSh(F, i, .42), b = add(F.belt[1 - i], [(i ? -1 : 1) * 4, 6]), w = o.w || 22;
    S.layer('belt'); const n = mul(norm(perp(sub(b, a))), w / 2), d = polyline([add(a, n), add(b, n), sub(b, n), sub(a, n)], true);
    S.both(d, m.b, m.k, 1.05); S.within(d, () => { tone(S, d, m, F.ax[0], F.ax[1]); for (const k of [-.62, .62]) S.stroke(polyline([add(a, mul(n, k)), add(b, mul(n, k))]), m.l, .7, { dash: '2.6 2.4', op: .6 }); });
    const c = mix(a, b, o.at ?? .42), t = norm(sub(b, a)), fr = polyline([add(add(c, mul(t, -w * .5)), mul(n, 1.25)), add(add(c, mul(t, w * .5)), mul(n, 1.25)), add(add(c, mul(t, w * .5)), mul(n, -1.25)), add(add(c, mul(t, -w * .5)), mul(n, -1.25))], true);
    S.stroke(fr, g.k, 5.6); S.stroke(fr, g.b, 3.8); S.stroke(fr, g.hi, .9, { op: .8 });
    if (o.studs) for (let k = 1; k < 8; k++) { if (Math.abs(k / 8 - (o.at ?? .42)) < .09) continue; const p = mix(a, b, k / 8); S.both(ell(p, 3.4, 3.4), g.b, g.k, .7); }
  },
  // --- armour ---
  tabard(C, o) {
    const { S, F, r } = C, m = cloth(o.field || 'white'), m2 = cloth(o.pale || 'blue'), g = metal(o.trim || 'gold'), e = 5;
    const top = i => onSh(F, i, .3), sh2 = i => onSh(F, i, .8), side = i => [sh2(i), add(F.ax[i], [-SG[i] * 10, 26]), add(F.wa[i], [SG[i] * e, 0]), add(F.belt[i], [SG[i] * e, 0])];
    const L = side(0), R = side(1), NB = [F.cxS, F.pit[1] + F.Hh * .12], body = poly([top(0), ...L, ...R.slice().reverse(), top(1), NB], [.3, .5, .9, .8, .1, .1, .8, .9, .5, .3, .7]);
    const hy = lerp(F.y.hip, F.y.ankle, o.len ?? .5), bl = L[3], br = R[3], hw = F.hipHalf * (o.w ?? .92);
    S.layer('skirt');
    const pale = path => { for (const sg of SG) { const x0 = F.cx + sg * hw * .5; S.fill(polyline([[x0, F.y.sh - 40], [x0 + sg * hw * 3, F.y.sh - 40], [x0 + sg * hw * 3, hy + 200], [x0 + sg * 8, hy + 200]], true), m2.b); S.stroke(polyline([[x0, F.y.sh], [x0 + sg * 8, hy + 200]]), g.k, 6); S.stroke(polyline([[x0, F.y.sh], [x0 + sg * 8, hy + 200]]), g.b, 4.2); } };
    const skr = drape(S, r, add(bl, [0, -6]), add(br, [0, -6]), [F.cx - hw - 12, hy], [F.cx + hw + 12, hy], m, { n: 4, wave: 9, bow: 5, sag: 2, point: o.point ?? F.B * .05, from: .2, trim: { b: g.b, k: g.k, l: g.hi }, trimW: 12, inside: pale });
    if (o.device && o.deviceLow) charge(S, o.device, [F.cx, lerp(F.y.hip, hy, .55)], F.hipHalf * .3, g);
    S.layer('torso'); S.both(body, m.b, m.k, 1.1);
    S.within(body, () => { pale(body); tone(S, body, m, L[1], R[1], { sh: .7 }); S.fill(ell(mix(bl, br, .5), F.waistHalf * 1.3, F.B * .028), m.s, { op: .5, filter: S.blur(6) }); const nk = poly([top(0), NB, top(1)], [0, .7, 0], false); S.stroke(nk, g.k, 10); S.stroke(nk, g.b, 8); for (const i of [0, 1]) { const ah = poly(side(i).slice(0, 3), .9, false); S.stroke(ah, g.k, 8); S.stroke(ah, g.b, 6.4); } });
    if (o.device) charge(S, o.device, [F.cxS, lerp(F.pit[1], F.y.waist, .52)], F.chestHalf * .36, g);
    for (const i of [0, 1]) { const a = add(F.ax[i], [-SG[i] * 16, 30]), b = [lerp(F.wa[i][0], F.cx, .5), F.y.waist + 6]; S.fill(ink(splPts([a, add(mix(a, b, .5), [SG[i] * 6, 5]), b], false, 1, 5), fade(S.lw(1.1))), m.k, { op: .55 }); }
  },
  // --- the harness: every piece is its own item, with its own make (q) and rarity (r) ---
  padding(C, o) { ITEMS.tunic(C, { dye: 'cream', len: .36, ease: 13, neck: 'high', sleeves: 'long', quilt: 1, ...o }); },
  mail(C, o) { ITEMS.tunic(C, { dye: 'grey', len: .28, ease: 15, neck: 'round', sleeves: 'short', mail: 1, ...o }); },
  mailcollar(C, o) { // a mail standard: round the throat and out over the shoulders
    const { S, F } = C, m = metal('steel'), py = F.pit[1], H = F.Hh; S.layer('collar');
    const pts = [add(F.nb[0], [-F.neckHalf * .2, -H * .12]), add(F.trap[0], [-6, -4]), add(F.sh[0], [-F.armR[0] * .2, 8]), [F.cxS - F.chestHalf * .6, py + H * .26], [F.cxS - F.chestHalf * .3, py + H * .21], [F.cxS, py + H * .3], [F.cxS + F.chestHalf * .3, py + H * .21], [F.cxS + F.chestHalf * .6, py + H * .26], add(F.sh[1], [F.armR[0] * .2, 8]), add(F.trap[1], [6, -4]), add(F.nb[1], [F.neckHalf * .2, -H * .12]), [F.cxS, py - H * .1]];
    const d = poly(pts, [.5, .9, .7, .2, .5, .2, .5, .2, .7, .9, .5, .9]); S.both(d, m.s, m.k, 1.1);
    S.within(d, () => { S.fill(d, mailPat(S)); tone(S, d, { l: m.l, s: m.d }, F.sh[0], F.sh[1], { hi: .3, sh: .6 }); S.fill(ell([F.cxS + H * .05, py + H * .12], F.neckHalf * 2.2, H * .16), m.d, { op: .5, filter: S.blur(6) }); }); S.stroke(d, m.k, 1.1);
  },
  breastplate(C, o) {
    const { S, F } = C, M = mats(o), { st, fit } = M; S.layer('torso');
    const side = i => [onSh(F, i, .7), add(F.ax[i], [-SG[i] * 14, 20]), add(F.ch[i], [SG[i] * 4, F.B * .02]), add(F.wa[i], [SG[i] * 6, -6])], L = side(0), R = side(1), NB = [F.cxS, F.pit[1] + F.Hh * .1];
    const d = poly([onSh(F, 0, .28), ...L, [F.cx, F.y.waist + F.B * .02], ...R.slice().reverse(), onSh(F, 1, .28), NB], [.3, .5, .9, .9, .4, .5, .4, .9, .9, .5, .3, .8]); S.both(d, st.b, st.k, 1.1);
    S.within(d, () => { steel(S, d, st, L[2], R[2], { sky: [NB, [F.cx, F.y.waist]] }); S.fill(ell([F.cxS - F.chestHalf * .35, F.y.chest - F.B * .01], F.chestHalf * .3, F.B * .05), st.hi, { op: M.q ? .6 : .2, filter: S.blur(5) }); if (M.edge) { S.stroke(d, fit.k, 8); S.stroke(d, fit.b, 6); } }); S.stroke(d, st.k, 1.1);
    S.stroke(polyline([NB, [F.cx, F.y.waist + F.B * .015]]), st.k, 1, { op: .7 }); S.stroke(polyline([add(NB, [-3, 6]), [F.cx - 3, F.y.waist]]), st.hi, 1, { op: .7 });
    if (M.r > 1) for (const sg of SG) for (const k of [.3, .55]) S.stroke(spl([[F.cxS + sg * F.chestHalf * k, F.pit[1] + F.Hh * .2], [F.cx + sg * F.waistHalf * k * .8, F.y.chest + F.B * .04], [F.cx + sg * F.waistHalf * k * .5, F.y.waist - 4]]), st.k, .8, { op: .4 });
    if (M.scroll) for (const sg of SG) scrolls(S, [[F.cxS + sg * F.chestHalf * .2, F.y.chest - F.B * .03], [F.cxS + sg * F.chestHalf * .7, F.y.chest + F.B * .01]], 7, fit.b);
    if (M.rivet) for (const X of [L, R]) rivets(S, [add(X[1], [X === L ? 10 : -10, 0]), add(X[3], [X === L ? 8 : -8, 0])], 4, 2.6, st);
  },
  fauld(C, o) { // the hooped skirt of lames under the breastplate
    const { S, F } = C, M = mats(o), { st, fit } = M; S.layer('skirt');
    for (let j = 2; j >= 0; j--) { const y0 = F.y.waist + F.B * (.005 + j * .026), w0 = lerp(F.waistHalf, F.hipHalf, (j + .4) / 3) + 9, lm = poly([[F.cx - w0, y0], [F.cx + w0, y0], [F.cx + w0 + 5, y0 + F.B * .034], [F.cx, y0 + F.B * .044], [F.cx - w0 - 5, y0 + F.B * .034]], .35); S.both(lm, st.b, st.k, 1.1); S.within(lm, () => { steel(S, lm, st, [F.cx - w0, y0], [F.cx + w0, y0]); if (M.edge) S.stroke(polyline([[F.cx + w0 + 5, y0 + F.B * .034], [F.cx, y0 + F.B * .044], [F.cx - w0 - 5, y0 + F.B * .034]]), fit.b, 4); }); S.stroke(lm, st.k, 1.1); if (M.rivet) rivets(S, [[F.cx - w0 + 8, y0 + 9], [F.cx + w0 - 8, y0 + 9]], 5, 2.2, st); }
  },
  tassets(C, o) { // a plate hung from the fauld over each thigh
    const { S, F } = C, M = mats(o), { st, fit } = M, y0 = F.y.waist + F.B * .08; S.layer('skirt');
    for (const sg of SG) { const x0 = F.cx + sg * F.hipHalf * .1, x1 = F.cx + sg * (F.hipHalf + 9), d = poly([[x0, y0], [x1, y0 - 4], [x1 + sg * 3, y0 + F.B * .062], [lerp(x0, x1, .55), y0 + F.B * .11], [x0 + sg * 3, y0 + F.B * .072]], [.2, .3, .7, .6, .7]);
      S.both(d, st.b, st.k, 1.1); S.within(d, () => { const lr = leftRight([x0, y0], [x1, y0]); steel(S, d, st, lr[0], lr[1]); if (M.edge) { S.stroke(d, fit.k, 6.4); S.stroke(d, fit.b, 4.8); } }); S.stroke(d, st.k, 1.1);
      S.stroke(polyline([[lerp(x0, x1, .5), y0 + 5], [lerp(x0, x1, .55), y0 + F.B * .1]]), st.k, .9, { op: .55 });
      for (const k of [.3, .7]) { const p = [lerp(x0, x1, k), y0 - 2]; S.stroke(polyline([p, add(p, [0, 12])]), cloth('dark').k, 4.4); S.stroke(polyline([p, add(p, [0, 12])]), cloth('dark').b, 2.8); }
      if (M.scroll) scrolls(S, [[lerp(x0, x1, .3), y0 + F.B * .035], [lerp(x0, x1, .75), y0 + F.B * .045]], 5, fit.b, .85); }
  },
  cuisses(C, o) { const { S, F } = C, M = mats(o), { st, fit } = M; S.layer('legs'); for (const i of [0, 1]) { const T = legTube(F, i, 8, .2, .46); limbFill(S, T, st, { metal: 1 }); S.stroke(polyline(offset(part(T.c, .1, .9), 3)), st.hi, .9, { op: .5 }); if (M.edge) S.stroke(polyline([T.A[T.A.length - 1], T.B[T.B.length - 1]]), fit.b, 3); if (M.rivet) S.stroke(polyline([along(T.A, .4), along(T.B, .4)]), cloth('dark').b, 4.4); if (M.scroll) scrolls(S, part(offset(T.c, F.legR[0] * .5), .2, .85), 6, fit.b, .8); } },
  greaves(C, o) {
    const { S, F } = C, M = mats(o), { st, fit } = M; S.layer('legs');
    for (const i of [0, 1]) { const T2 = legTube(F, i, 8, .56, .97); limbFill(S, T2, st, { metal: 1 }); S.fill(ink(part(T2.c, .02, .98), S.lw(1.1)), st.k, { op: .55 }); S.stroke(polyline(offset(part(T2.c, .05, .95), 3)), st.hi, .9, { op: .6 });
      if (M.edge) for (const t of [.02, .98]) S.stroke(polyline([along(T2.A, t), along(T2.B, t)]), fit.b, 3.2); if (M.scroll) scrolls(S, part(offset(T2.c, F.legR[2] * .55), .1, .9), 6, fit.b, .85);
      if (M.rivet) for (const t of [.2, .75]) S.stroke(polyline([along(T2.A, t), along(T2.B, t)]), cloth('dark').b, 4.5); }
  },
  poleyns(C, o) { // the knee: a cop, its side wing, and a lame above and below
    const { S, F } = C, M = mats(o), { st, fit } = M; S.layer('legs');
    for (const i of [0, 1]) { const G = F.leg[i], sg = SG[i], kc = add(G.kn, [0, F.B * .012]), R = F.legR[1] * 1.2 + 5;
      const wing = poly([add(kc, [sg * R * .6, -R * .7]), add(kc, [sg * R * 1.5, -R * .1]), add(kc, [sg * R * .6, R * .7])], .75); S.both(wing, st.s, st.k, 1); if (M.edge) S.stroke(wing, fit.b, 1.8);
      for (const dy of [-1, 1]) { const lm = poly([add(kc, [-R * .78, dy * R * .9]), add(kc, [R * .78, dy * R * .9]), add(kc, [R * .66, dy * R * 1.5]), add(kc, [-R * .66, dy * R * 1.5])], .4); S.both(lm, st.s, st.k, 1); }
      const cop = poly([add(kc, [0, -R * 1.25]), add(kc, [R, -R * .35]), add(kc, [R * .8, R * .7]), add(kc, [0, R * 1.2]), add(kc, [-R * .8, R * .7]), add(kc, [-R, -R * .35])], [.5, .9, .8, .5, .8, .9]); S.both(cop, st.b, st.k, 1.1);
      S.within(cop, () => { steel(S, cop, st, add(kc, [-R, -R * .3]), add(kc, [R, R * .3]), { sky: [add(kc, [0, -R]), add(kc, [0, R * 1.2])] }); if (M.edge) { S.stroke(cop, fit.k, 6); S.stroke(cop, fit.b, 4.4); } }); S.stroke(cop, st.k, 1.1); S.stroke(polyline([add(kc, [0, -R * 1.2]), add(kc, [0, R * 1.15])]), st.k, .9, { op: .6 }); }
  },
  sabatons(C, o) { ITEMS.shoes(C, { ...o, kind: 'sabaton' }); },
  rerebraces(C, o) { const { S, F } = C, M = mats(o), { st, fit } = M; for (const i of C.armOrder) { const A = F.arm[i]; if (A.back) continue; S.layer('arms'); const up = tube([mix(A.sh, A.el, .32), mix(A.sh, A.el, .9)], [F.armR[0] * 1.12 + 3, F.armR[1] * 1.25 + 3]); limbFill(S, up, st, { metal: 1 }); for (const t of [.3, .55]) S.stroke(polyline([along(up.A, t), along(up.B, t + .06)]), st.k, .9, { op: .7 }); if (M.edge) S.stroke(polyline([up.A[up.A.length - 1], up.B[up.B.length - 1]]), fit.b, 3); if (M.rivet) S.stroke(polyline([along(up.A, .8), along(up.B, .8)]), cloth('dark').b, 3.6); } },
  vambraces(C, o) {
    const { S, F } = C, M = mats(o), { st, fit } = M;
    for (const i of C.armOrder) { const A = F.arm[i]; if (A.back) continue; S.layer('arms');
      const lo = tube([mix(A.el, A.wr, .12), mix(A.el, A.wr, .45), mix(A.el, A.wr, .98)], [F.armR[2] * 1.22 + 3, F.armR[2] * 1.2 + 3, F.armR[3] * 1.35 + 3]); limbFill(S, lo, st, { metal: 1 }); S.fill(ink(part(lo.c, .05, .95), S.lw(1)), st.k, { op: .5 });
      if (M.edge) for (const t of [0, .97]) S.stroke(polyline([along(lo.A, t), along(lo.B, t)]), fit.b, 3.2); if (M.scroll) scrolls(S, part(offset(lo.c, F.armR[2] * .5), .15, .85), 5, fit.b, .85);
      if (M.rivet) for (const t of [.25, .7]) S.stroke(polyline([along(lo.A, t), along(lo.B, t)]), cloth('dark').b, 4); }
  },
  couters(C, o) { const { S, F } = C, M = mats(o), { st, fit } = M; for (const i of C.armOrder) { const A = F.arm[i]; if (A.back) continue; S.layer('arms'); const ec = A.el, R = F.armR[1] * 1.22 + 2, fan = poly([add(ec, [SG[i] * R * .7, -R * .7]), add(ec, [SG[i] * R * 1.7, 0]), add(ec, [SG[i] * R * .7, R * .7])], .7), cop = poly(ellPts(ec, R, R * 1.18, 0, 8), .9); S.both(fan, st.s, st.k, 1); S.both(cop, st.b, st.k, 1.1); S.within(cop, () => steel(S, cop, st, add(ec, [-R, -R * .4]), add(ec, [R, R * .4]))); if (M.edge) S.stroke(cop, fit.b, 2.2); S.stroke(cop, st.k, 1.1); if (M.rivet) S.both(ell(ec, R * .14, R * .14), st.l, st.k, .6); } },
  gauntlets(C, o) { // the flared cuff; the hand itself is drawn last, in plate
    const { S, F } = C, M = mats(o), { st, fit } = M;
    for (const i of C.armOrder) { const A = F.arm[i]; if (A.back || A.hand === 'hidden' || A.hand === 'tucked') continue;
      const x = A.dirF, y = perp(x), w0 = F.armR[3] * 1.5 + 3, w1 = F.armR[2] * 1.45 + 4, c0 = add(A.wr, mul(x, 6)), c1 = add(A.wr, mul(x, -F.armL[1] * .3));
      const cuff = poly([add(c0, mul(y, w0)), add(c1, mul(y, w1)), add(c1, mul(y, -w1)), add(c0, mul(y, -w0))], .2); S.layer('hands'); S.both(cuff, st.b, st.k, 1.1); S.within(cuff, () => { const lr = leftRight(add(c1, mul(y, w1)), add(c1, mul(y, -w1))); steel(S, cuff, st, lr[0], lr[1]); });
      if (M.edge) { S.stroke(polyline([add(c1, mul(y, w1)), add(c1, mul(y, -w1))]), fit.k, 4.4); S.stroke(polyline([add(c1, mul(y, w1 * .96)), add(c1, mul(y, -w1 * .96))]), fit.b, 3); } if (M.scroll) scrolls(S, [mix(c0, c1, .25), mix(c0, c1, .8)], 4, fit.b, .8); }
    C.st.handMat = st; C.st.handMetal = true;
  },
  gloves(C, o) { C.st.handMat = cloth(o.leather || 'dark'); C.st.handMetal = false; },
  pauldrons(C, o) { const { S, F } = C; S.layer('shoulder'); for (const i of [0, 1]) pauldronArt(S, add(F.sh[i], [-SG[i] * F.armR[0] * .1, F.armR[0] * .1]), F.armR[0] * (o.z ?? 1.75), SG[i], o.q ?? 1, o); },
  gorget(C, o) { const { S, F } = C, M = mats(o), { st, fit } = M; S.layer('collar'); const d = poly([add(F.nb[0], [-F.neckHalf * .9, F.Hh * .06]), add(F.nb[0], [F.neckHalf * .02, -F.Hh * .15]), [F.cxS, F.pit[1] - F.Hh * .14], add(F.nb[1], [-F.neckHalf * .02, -F.Hh * .15]), add(F.nb[1], [F.neckHalf * .9, F.Hh * .06]), [F.cxS + F.neckHalf, F.pit[1] + F.Hh * .14], [F.cxS, F.pit[1] + F.Hh * .2], [F.cxS - F.neckHalf, F.pit[1] + F.Hh * .14]], .8); S.both(d, st.b, st.k, 1.1); S.within(d, () => { steel(S, d, st, F.nb[0], F.nb[1]); if (M.edge) { S.stroke(d, fit.k, 6.5); S.stroke(d, fit.b, 5); } }); S.stroke(d, st.k, 1.1); if (M.rivet) rivets(S, [[F.cxS - F.neckHalf * .8, F.pit[1] + F.Hh * .08], [F.cxS + F.neckHalf * .8, F.pit[1] + F.Hh * .08]], 5, 2, st); },
  helm(C, o) { const h = HEADWEAR[o.kind || 'kettle']; if (h && h.draw) h.draw(C, o); },
  shield(C, o) { // a heater shield stood on its point by the leg, the hanging hand on its rim
    const { S, F } = C, M = mats(o), { st, fit } = M, i = [o.arm ?? 0, 1 - (o.arm ?? 0)].find(k => F.arm[k].hang && F.arm[k].hand === 'relaxed'); if (i == null) return;
    const A = F.arm[i], sg = SG[i], m = cloth(o.field || 'white'), m2 = cloth(o.pale || 'blue'), top = A.wr[1] + F.handL * .42, h = 22 - top, w = h * .46, cx0 = A.wr[0] - sg * w * .1, W = (u, v) => [cx0 + u * w / 2, top + v * h];
    const d = poly([W(-1, 0), W(1, 0), W(1, .4), W(.62, .74), W(0, 1), W(-.62, .74), W(-1, .4)], [.15, .15, .8, .9, .25, .9, .8]);
    S.layer('propFront'); S.both(d, m.b, st.k, 1.2);
    S.within(d, () => { S.fill(polyline([W(0, -.1), W(1.2, -.1), W(1.2, 1.1), W(0, 1.1)], true), m2.b); S.fill(d, S.lin(W(-1, .3), W(1, .3), [[0, '#ffffff', .28], [.35, '#ffffff', 0], [.55, '#1d1533', 0], [1, '#1d1533', .42]])); S.stroke(d, st.k, 13); S.stroke(d, M.edge ? fit.b : st.b, 10.4); S.stroke(d, M.edge ? fit.hi : st.hi, 1.2, { op: .8 }); if (M.q === 0) for (const p of [[-.4, .3], [.5, .55], [.1, .72]]) S.stroke(polyline([W(p[0], p[1]), W(p[0] + .16, p[1] + .05)]), '#2a2420', 1.4, { op: .6 }); });
    S.stroke(d, st.k, 1.2); if (o.device) charge(S, o.device, W(0, .36), w * .2, metal(M.q > 1 ? 'gold' : 'bronze'));
    if (M.rivet) rivets(S, [W(-.84, .06), W(.84, .06)], 5, 2.4, st); if (M.scroll) scrolls(S, [W(-.6, .12), W(.6, .12)], w * .028, fit.k, .7);
  },
  // --- sword at the hip, or planted before the feet; and staves ---
  sword(C, o) {
    const { S, F } = C, q = o.q ?? 1, P = F.pose;
    if (P.planted) { const hy = (F.arm[0].wr[1] + F.arm[1].wr[1]) / 2 + F.handL * .42, L = (16 - hy) / 1.19; S.layer('propFront'); swordArt(S, [F.cx, 16 - L], 0, L, q, { sheathed: false, r: o.r }); return; }
    const L = F.H * (o.long ? .5 : .41), A = F.arm[1], rest = A.hand === 'rest', a = rad(rest ? 7 : 13), by = C.st.beltY || F.y.belt; let G;
    if (rest) { const pm = add(A.wr, mul(A.dirF, F.handL * .5)); G = add(pm, mul(dir(a), L * (.125 + .03 + .026))); } else G = [F.hi[1][0] - F.hipHalf * .1, by + F.H * .035];
    S.layer('weapon'); const lea = cloth('dark'), hang = [[F.belt[1][0] - F.waistHalf * .5, by], add(G, mul(dir(a), L * .06))];
    S.stroke(polyline(hang), lea.k, 6.4); S.stroke(polyline(hang), lea.b, 4.6);
    swordArt(S, G, a, L, q, { sheathed: true, leather: o.leather, r: o.r });
  },
  staff(C, o) {
    const { S, F } = C, i = F.arm[0].staff ? 0 : 1, A = F.arm[i], kind = o.kind || 'staff', wd = cloth(o.wood || 'walnut'), ir = metal(o.metal || 'iron');
    const x = A.wr[0] + A.dirF[0] * F.handL * .35, yh = A.wr[1] + A.dirF[1] * F.handL * .35, top = kind === 'spear' ? -F.H * 1.1 : kind === 'crook' ? -F.H * 1.08 : kind === 'hoe' ? yh - F.H * .09 : -F.H * 1.02, lean = (o.lean ?? .02) * F.H, w = kind === 'spear' ? 13 : 16;
    S.layer('weapon'); const a = [x + lean, 0], b = [x - lean * (top / -F.H), top], d = polyline([add(a, [-w / 2, 0]), add(a, [w / 2, 0]), add(b, [w / 2 * .85, 0]), add(b, [-w / 2 * .85, 0])], true);
    S.both(d, wd.b, wd.k, 1.05); S.within(d, () => tone(S, d, wd, add(a, [-w / 2, 0]), add(a, [w / 2, 0])));
    if (kind === 'spear') { const h = F.H * .15, hd = poly([add(b, [-w * .6, 6]), add(b, [-w * 1.5, -h * .35]), add(b, [0, -h]), add(b, [w * 1.5, -h * .35]), add(b, [w * .6, 6])], [.2, .6, .1, .6, .2]); S.both(hd, ir.b, ir.k, 1.05); S.within(hd, () => { S.fill(polyline([add(b, [0, 6]), add(b, [0, -h]), add(b, [-w * 1.6, -h * .35])], true), ir.l); S.fill(polyline([add(b, [0, 6]), add(b, [0, -h]), add(b, [w * 1.6, -h * .35])], true), ir.s); }); S.stroke(polyline([add(b, [0, 4]), add(b, [0, -h * .96])]), ir.k, .8); const sk = polyline([add(b, [-w * .7, 6]), add(b, [w * .7, 6]), add(b, [w * .6, 50]), add(b, [-w * .6, 50])], true); S.both(sk, ir.s, ir.k, 1); if (o.pennon) { const pm = cloth(o.pennon), p0 = add(b, [w * .5, 56]); const pd = poly([p0, add(p0, [150, 22]), add(p0, [96, 52]), add(p0, [156, 90]), add(p0, [0, 76])], [0, .2, .4, .2, 0]); S.both(pd, pm.b, pm.k, 1.05); S.within(pd, () => { S.fill(polyline([add(p0, [60, 0]), add(p0, [84, 100]), add(p0, [110, 100]), add(p0, [86, 0])], true), pm.s, { op: .6 }); }); } }
    if (kind === 'hoe') { const bl = poly([add(a, [-8, -26]), add(a, [-74, -42]), add(a, [-92, -6]), add(a, [-10, -4])], .25); S.both(bl, ir.b, ir.k, 1.05); S.within(bl, () => steel(S, bl, ir, add(a, [-90, -40]), add(a, [-10, 0]))); }
    if (kind === 'crook') { const hk = spl([b, add(b, [0, -70]), add(b, [-40, -118]), add(b, [-92, -84]), add(b, [-84, -30])]); S.stroke(hk, wd.k, 17, { cap: 'round' }); S.stroke(hk, wd.b, 14.4, { cap: 'round' }); }
    if (kind === 'crozier') { const g = metal('gold'); const hk = spl([b, add(b, [0, -60]), add(b, [44, -112]), add(b, [96, -72]), add(b, [66, -24]), add(b, [38, -52])]); S.stroke(hk, g.k, 15, { cap: 'round' }); S.stroke(hk, g.b, 12.4, { cap: 'round' }); S.stroke(hk, g.hi, 2, { op: .8 }); S.both(ell(add(b, [0, 4]), 14, 10), g.b, g.k, 1); }
    C.st.staffX = x;
  },
  book(C, o) { const { S, F } = C, m = cloth(o.leather || 'red'), c = [F.cx + 6, F.y.waist + F.B * .03], g = metal('bronze'); S.layer('propFront'); const d = poly([add(c, [-62, -84]), add(c, [58, -92]), add(c, [66, 70]), add(c, [-56, 78])], .12); S.both(d, m.b, m.k, 1.1); S.within(d, () => tone(S, d, m, add(c, [-60, 0]), add(c, [60, 0]))); S.stroke(polyline([add(c, [-46, -78]), add(c, [-42, 72])]), m.k, 1); for (const p of [[-40, -66], [42, -72], [48, 54], [-36, 60]]) S.both(ell(add(c, p), 6, 6), g.b, g.k, .8); charge(S, 'sun', add(c, [6, -8]), 22, g); },
  amulet(C, o) { const { S, F } = C, g = metal(o.metal || 'bronze'), c = [F.cxS, F.pit[1] + F.Hh * (o.drop ?? .62)]; S.layer('belt'); S.stroke(spl([onSh(F, 0, .16), mix(onSh(F, 0, .16), c, .6), c, mix(onSh(F, 1, .16), c, .6), onSh(F, 1, .16)]), g.k, 1.6); S.both(ell(c, 15, 15), g.b, g.k, 1); charge(S, o.device || 'sun', c, 11, { b: g.l, k: g.k }); },
  chain(C, o) { const { S, F } = C, g = metal(o.metal || 'gold'); S.layer('belt'); const c = spl([onSh(F, 0, .5), [F.cxS - F.chestHalf * .5, F.y.chest - F.B * .01], [F.cxS, F.y.chest + F.B * .028], [F.cxS + F.chestHalf * .5, F.y.chest - F.B * .01], onSh(F, 1, .5)]); S.stroke(c, g.k, 8.5); S.stroke(c, g.b, 6.4, { dash: '6 3' }); S.stroke(c, g.hi, 1.4, { dash: '2 7', op: .9 }); const p = [F.cxS, F.y.chest + F.B * .05]; S.both(poly(ellPts(p, 17, 19, 0, 8), .8), g.b, g.k, 1); S.both(ell(p, 8, 9), o.gem || '#7a1f2a', '#30090e', .8); S.fill(ell(add(p, [-2.5, -3]), 2.6, 2.2), '#ffd9d9', { op: .9 }); },
};

function mailPat(S) { const m = metal('steel'); return S.pattern('mail', 7, 5, `<rect width="7" height="5" fill="${m.d}" opacity=".5"/><path d="M.4 2.1a3 2 0 0 1 6 0M-3.1 4.6a3 2 0 0 1 6 0M3.9 4.6a3 2 0 0 1 6 0" fill="none" stroke="${m.l}" stroke-width=".8" opacity=".85"/><path d="M.4 2.5a3 2 0 0 0 6 0" fill="none" stroke="${m.k}" stroke-width=".5" opacity=".7"/>`); }

// ---------------------------------------------------------------- headwear -------------------------------------------
export const HEADWEAR = {
  none: { name: 'Bare-headed' },
  circlet: { name: 'Circlet', draw(C, o) { const { S, Hd } = C, { D, hp, s } = Hd, g = metal(o.metal || 'gold'), v = D.hairV - 6, c = splPts([hp(-D.cran * .98, v + 16, -10), hp(-D.cran * .62, v + 3, 44), hp(0, v, 70), hp(D.cran * .62, v + 3, 44), hp(D.cran * .98, v + 16, -10)], false, 1, 6); S.layer('headwear'); S.fill(ink(c, [4.5 * s, 5.5 * s, 4.5 * s]), g.b); S.stroke(polyline(offset(c, 2.6 * s)), g.k, .9); S.stroke(polyline(offset(c, -2.6 * s)), g.k, .9); S.stroke(polyline(c), g.hi, .8, { op: .8 }); const p = along(c, .5); S.both(poly(ellPts(p, 5.5 * s, 6.5 * s, 0, 4), .5), o.gem || '#2f5fa8', '#101c3a', .8); S.fill(ell(add(p, [-1.4 * s, -1.6 * s]), 1.5 * s, 1.2 * s), '#e8f2ff'); } },
  crown: { name: 'Crown', draw(C, o) { const { S, Hd } = C, { D, hp, s } = Hd, g = metal('gold'), v = D.hairV - 12, pt = (u, dv) => hp(u, v + dv + Math.abs(u) * .12, 68 - Math.abs(u) * .9); S.layer('headwear'); const us = [-74, -52, -27, 0, 27, 52, 74], top = [], pts = []; us.forEach((u, i) => { top.push(pt(u, -16 - (i % 2 ? 0 : 15))); if (i < us.length - 1) top.push(pt((u + us[i + 1]) / 2, -11)); }); const base = us.map(u => pt(u, 6)).reverse(), d = poly([...top, ...base], [...top.map((_, i) => (i % 2 ? .7 : .25)), ...base.map(() => .6)]); S.both(d, g.b, g.k, 1.1); S.within(d, () => { steel(S, d, g, pt(-74, 0), pt(74, 0)); S.fill(polyline([pt(-74, -3), pt(74, -3), pt(74, 7), pt(-74, 7)], true), g.s, { op: .7 }); }); S.stroke(spl(us.map(u => pt(u, -4))), g.k, .9); const gems = ['#8c1f2b', '#2f5fa8', '#2f7a4f']; us.forEach((u, i) => { if (i % 2 === 0) { const p = pt(u, -33); S.both(ell(p, 3.4 * s, 3.4 * s), '#f2ede0', g.k, .8); } const q = pt(u, 1); S.both(poly(ellPts(q, 3.6 * s, 4 * s, 0, 4), .5), gems[i % 3], '#1b0b10', .7); S.fill(ell(add(q, [-1 * s, -1.1 * s]), 1 * s, .8 * s), '#ffffff', { op: .8 }); }); } },
  coif: { name: 'Linen coif', hides: 1, draw(C, o) { const { S, Hd } = C, { D, hp, s } = Hd, m = cloth(o.dye || 'linen'), v = D.hairV + 2; S.layer('headwear'); const d = spl([hp(0, D.crown - 6, -8), hp(D.cran * .62, D.crown + 12, -10), hp(D.cran + 4, D.crown * .47, -12), hp(D.zyg + 7, 4, 10), hp(D.zyg + 3, 36, 12), hp(D.zyg - 5, 30, 30), hp(D.zyg - 8, -20, 42), hp(34, v + 9, 64), hp(0, v, 82), hp(-34, v + 9, 64), hp(-D.zyg + 8, -20, 42), hp(-D.zyg + 5, 30, 30), hp(-D.zyg - 3, 36, 12), hp(-D.zyg - 7, 4, 10), hp(-D.cran - 4, D.crown * .47, -12), hp(-D.cran * .62, D.crown + 12, -10)], true); S.both(d, m.b, m.k, 1.1); S.within(d, () => tone(S, d, m, hp(-D.cran, -50, 0), hp(D.cran, -50, 0))); S.stroke(spl([hp(0, D.crown - 5, -8), hp(2, D.crown * .6, 60), hp(0, v, 82)]), m.k, .8, { op: .5 }); for (const sg of [-1, 1]) S.stroke(spl([hp(sg * (D.zyg - 1), 34, 14), hp(sg * D.gon * .8, D.gonV + 8, 30), hp(sg * 4, D.chinV + 5, 60)]), m.k, 1.6); } },
  veil: { name: 'Veil and wimple', hides: 1, draw(C, o) { const { S, Hd, F } = C, { D, hp, s } = Hd, m = cloth(o.dye || 'white'); S.layer('backHair'); const fall = spl([hp(-D.cran - 6, -40, -20), hp(-D.zyg - 26, 60, -30), [F.sh[0][0] * .8, F.y.sh + F.Hh * .25], [F.cxS, F.y.sh + F.Hh * .5], [F.sh[1][0] * .8, F.y.sh + F.Hh * .25], hp(D.zyg + 26, 60, -30), hp(D.cran + 6, -40, -20)], true); S.both(fall, m.s, m.k, 1.1); S.layer('collar'); const wy = F.pit[1] + F.Hh * .1, wm = spl([hp(-D.zyg + 3, 22, 30), hp(-D.gon - 4, D.gonV + 4, 10), add(F.nb[0], [-F.neckHalf * .9, F.Hh * .02]), [F.cxS - F.neckHalf * 1.5, wy], [F.cxS, wy + F.Hh * .07], [F.cxS + F.neckHalf * 1.5, wy], add(F.nb[1], [F.neckHalf * .9, F.Hh * .02]), hp(D.gon + 4, D.gonV + 4, 10), hp(D.zyg - 3, 22, 30)], true); S.both(wm, m.b, m.k, 1.1); S.within(wm, () => { tone(S, wm, m, add(F.nb[0], [-F.neckHalf, 0]), add(F.nb[1], [F.neckHalf, 0])); S.fill(Hd.out, m.s, { tf: `translate(${n1(F.Hh * .02)} ${n1(F.Hh * .08)})`, op: .85 }); }); for (const k of [.38, .62, .86]) { const y0 = lerp(hp(0, D.chinV, 70)[1], wy, k); S.fill(ink(splPts([[F.cxS - F.neckHalf * (1.05 + k * .3), y0 - F.Hh * .05], [F.cxS, y0 + F.Hh * .02], [F.cxS + F.neckHalf * (1.05 + k * .3), y0 - F.Hh * .05]], false, 1, 6), taper(S.lw(1.2), .5)), m.k, { op: .5 }); } S.layer('headwear'); const v = D.hairV + 4, d = spl([hp(0, D.crown - 9, -8), hp(D.cran * .66, D.crown + 10, -10), hp(D.cran + 8, D.crown * .47, -12), hp(D.zyg + 16, 10, 6), hp(D.zyg + 22, 64, 0), hp(D.zyg + 6, 58, 16), hp(D.zyg - 5, 0, 36), hp(D.zyg - 10, -24, 44), hp(30, v + 5, 66), hp(0, v, 82), hp(-30, v + 5, 66), hp(-D.zyg + 10, -24, 44), hp(-D.zyg + 5, 0, 36), hp(-D.zyg - 6, 58, 16), hp(-D.zyg - 22, 64, 0), hp(-D.zyg - 16, 10, 6), hp(-D.cran - 8, D.crown * .47, -12), hp(-D.cran * .66, D.crown + 10, -10)], true); S.both(d, m.b, m.k, 1.1); S.within(d, () => { tone(S, d, m, hp(-D.cran, -50, 0), hp(D.cran, -50, 0)); }); for (const sg of [-1, 1]) S.fill(ink(splPts([hp(sg * 30, D.crown + 6, 0), hp(sg * (D.cran - 4), -40, 0), hp(sg * (D.zyg + 12), 40, 4)], false, 1, 6), fade(S.lw(1.1))), m.k, { op: .55 }); if (o.fillet) { const g = metal('gold'), c = splPts([hp(-D.cran * 1.0, v + 4, -10), hp(-D.cran * .6, v - 6, 44), hp(0, v - 9, 70), hp(D.cran * .6, v - 6, 44), hp(D.cran * 1.0, v + 4, -10)], false, 1, 6); S.fill(ink(c, [4 * s, 5 * s, 4 * s]), g.b); S.stroke(polyline(offset(c, 2.4 * s)), g.k, .8); S.stroke(polyline(offset(c, -2.4 * s)), g.k, .8); } } },
  strawhat: { name: 'Straw hat', draw(C, o) { const { S, Hd } = C, { D, hp, s } = Hd, m = cloth('#cdb26a'); S.layer('headwear'); const c = hp(0, D.hairV - 16, 10), br = ell(c, 128 * s, 30 * s, -.04); S.both(br, m.b, m.k, 1.1); S.within(br, () => { S.fill(br, S.lin(add(c, [0, -30 * s]), add(c, [0, 30 * s]), [[0, m.l, .5], [.5, m.s, 0], [1, m.s, .9]])); for (let k = 1; k < 4; k++) S.stroke(ell(c, 128 * s * k / 4, 30 * s * k / 4, -.04), m.k, .7, { op: .45 }); }); const dm = spl([add(c, [-70 * s, 0]), add(c, [-62 * s, -44 * s]), add(c, [0, -66 * s]), add(c, [62 * s, -44 * s]), add(c, [70 * s, 0]), add(c, [0, 12 * s])], true); S.both(dm, m.b, m.k, 1.1); S.within(dm, () => { tone(S, dm, m, add(c, [-70 * s, 0]), add(c, [70 * s, 0])); for (let k = 1; k < 5; k++) S.stroke(spl([add(c, [-70 * s, -k * 11 * s]), add(c, [0, -k * 11 * s + 9 * s]), add(c, [70 * s, -k * 11 * s])]), m.k, .7, { op: .4 }); }); } },
  chaperon: { name: 'Rolled hat', draw(C, o) { const { S, Hd, F } = C, { D, hp, s } = Hd, m = cloth(o.dye || 'murrey'); S.layer('headwear'); const c = hp(0, D.hairV - 12, 20), bag = spl([add(c, [-30 * s, -30 * s]), add(c, [20 * s, -64 * s]), add(c, [86 * s, -40 * s]), add(c, [112 * s, 20 * s]), add(c, [96 * s, 74 * s]), add(c, [70 * s, 40 * s]), add(c, [40 * s, -6 * s])], true); S.both(bag, m.b, m.k, 1.1); S.within(bag, () => { tone(S, bag, m, add(c, [-30 * s, 0]), add(c, [110 * s, 0])); }); S.fill(ink(splPts([add(c, [30 * s, -44 * s]), add(c, [80 * s, -10 * s]), add(c, [94 * s, 50 * s])], false, 1, 5), fade(S.lw(1.1))), m.k, { op: .7 }); const roll = spl([add(c, [-86 * s, 4 * s]), add(c, [-70 * s, -26 * s]), add(c, [0, -40 * s]), add(c, [70 * s, -26 * s]), add(c, [86 * s, 4 * s]), add(c, [60 * s, 16 * s]), add(c, [0, 8 * s]), add(c, [-60 * s, 16 * s])], true); S.both(roll, m.b, m.k, 1.1); S.within(roll, () => { S.fill(roll, S.lin(add(c, [0, -40 * s]), add(c, [0, 16 * s]), [[0, m.l, .6], [.45, m.l, 0], [1, m.s, .95]])); for (let k = -3; k <= 3; k++) S.stroke(polyline([add(c, [k * 22 * s - 6 * s, -40 * s]), add(c, [k * 22 * s + 8 * s, 18 * s])]), m.k, .9, { op: .5 }); }); if (o.badge) { const g = metal('gold'), p = add(c, [-30 * s, -12 * s]); S.both(ell(p, 6 * s, 6 * s), g.b, g.k, .8); S.fill(ell(add(p, [-1.5 * s, -1.5 * s]), 2 * s, 1.6 * s), g.hi); } } },
  bascinet: { name: 'Bascinet and aventail', hides: 1, draw(C, o) { const { S, Hd, F } = C, { D, hp, s } = Hd, M = mats(o), m = M.st, ml = metal('steel'); S.layer('headwear');
    const av = poly([hp(-D.zyg - 4, 30, 6), add(F.trap[0], [-10, 2]), add(F.sh[0], [-F.armR[0] * .1, 10]), [F.cxS - F.chestHalf * .56, F.pit[1] + F.Hh * .3], [F.cxS, F.pit[1] + F.Hh * .36], [F.cxS + F.chestHalf * .56, F.pit[1] + F.Hh * .3], add(F.sh[1], [F.armR[0] * .1, 10]), add(F.trap[1], [10, 2]), hp(D.zyg + 4, 30, 6), hp(D.chinW + 10, D.chinV + 6, 60), hp(-D.chinW - 10, D.chinV + 6, 60)], [.4, .9, .7, .3, .6, .3, .7, .9, .4, .7, .7]);
    S.both(av, ml.s, ml.k, 1.1); S.within(av, () => { S.fill(av, mailPat(S)); tone(S, av, { l: ml.l, s: ml.d }, F.sh[0], F.sh[1], { hi: .3, sh: .6 }); S.fill(Hd.out, ml.d, { tf: `translate(${n1(F.Hh * .02)} ${n1(F.Hh * .1)})`, op: .6 }); }); S.stroke(av, ml.k, 1.1);
    const outer = [hp(2, D.crown - 30, -30), hp(D.cran * .6, D.crown - 12, -14), hp(D.cran + 10, D.crown * .47, -12), hp(D.zyg + 12, 10, 6), hp(D.zyg + 8, 46, 8), hp(D.gon + 6, D.gonV + 10, 12), hp(D.gon - 8, D.gonV + 2, 20), hp(-D.gon + 8, D.gonV + 2, 20), hp(-D.gon - 6, D.gonV + 10, 12), hp(-D.zyg - 8, 46, 8), hp(-D.zyg - 12, 10, 6), hp(-D.cran - 10, D.crown * .47, -12), hp(-D.cran * .6, D.crown - 12, -14)];
    const inner = [hp(0, D.browV - 13, 86), hp(38, D.browV - 10, 70), hp(D.zyg - 6, -6, 40), hp(D.zyg - 9, 40, 32), hp(D.gon - 9, D.gonV + 1, 20), hp(-D.gon + 9, D.gonV + 1, 20), hp(-D.zyg + 9, 40, 32), hp(-D.zyg + 6, -6, 40), hp(-38, D.browV - 10, 70)];
    const di = spl(inner, true, [1, 1, 1, 1, .5, .5, 1, 1, 1]), d = spl(outer, true, [.6, 1, 1, 1, 1, .5, .4, .4, .5, 1, 1, 1, 1]) + spl(inner.slice().reverse(), true, [1, 1, 1, .5, .5, 1, 1, 1, 1]);
    S.within(di, () => S.fill(di, S.lin(hp(0, D.browV - 13, 86), hp(0, 10, 80), [[0, '#1b1426', .45], [1, '#1b1426', 0]])));
    S.fill(d, m.b); S.within(d, () => { steel(S, d, m, hp(-D.cran - 10, -50, 0), hp(D.cran + 10, -50, 0), { sky: [hp(0, D.crown - 30, 0), hp(0, 20, 0)] }); if (M.edge) { S.stroke(di, M.fit.k, 9); S.stroke(di, M.fit.b, 7); } else S.stroke(di, m.d, 8, { op: .6 }); });
    S.stroke(spl(outer, true, [.6, 1, 1, 1, 1, .5, .4, .4, .5, 1, 1, 1, 1]), m.k, 1.1); S.stroke(di, m.k, 1.1); S.stroke(spl([hp(2, D.crown - 29, -30), hp(3, D.crown * .5, 70), hp(0, D.browV - 13, 86)]), m.k, .9, { op: .5 });
    for (const sg of [-1, 1]) rivets(S, splPts([hp(sg * (D.zyg + 9), 14, 6), hp(sg * (D.zyg + 6), 44, 8), hp(sg * (D.gon + 2), D.gonV + 6, 12)], false, 1, 5), 5, 1.5 * s, m);
    if (M.scroll) scrolls(S, splPts([hp(-D.cran * .7, D.crown * .5, 30), hp(0, D.crown * .62, 60), hp(D.cran * .7, D.crown * .5, 30)], false, 1, 6), 3 * s, M.fit.b, .8); } },
  nasal: { name: 'Nasal helm', draw(C, o) { const { S, Hd } = C, { D, hp, s } = Hd, M = mats(o), m = M.st; S.layer('headwear');
    const d = spl([hp(2, D.crown - 34, -20), hp(D.cran * .62, D.crown - 6, -12), hp(D.cran + 8, D.crown * .47, -12), hp(D.zyg + 8, D.browV - 12, 20), hp(40, D.browV - 9, 66), hp(0, D.browV - 7, 86), hp(-40, D.browV - 9, 66), hp(-D.zyg - 8, D.browV - 12, 20), hp(-D.cran - 8, D.crown * .47, -12), hp(-D.cran * .62, D.crown - 6, -12)], true, [.5, 1, 1, .6, 1, 1, 1, .6, 1, 1]);
    S.both(d, m.b, m.k, 1.1); S.within(d, () => { steel(S, d, m, hp(-D.cran - 8, -60, 0), hp(D.cran + 8, -60, 0), { sky: [hp(0, D.crown - 34, 0), hp(0, D.browV, 0)] }); const band = spl([hp(-D.zyg - 8, D.browV - 14, 20), hp(-40, D.browV - 11, 66), hp(0, D.browV - 9, 86), hp(40, D.browV - 11, 66), hp(D.zyg + 8, D.browV - 14, 20)]); S.stroke(band, m.k, 13); S.stroke(band, M.edge ? M.fit.b : m.s, 11); }); S.stroke(d, m.k, 1.1);
    const nb = poly([hp(-5, D.browV - 10, 88), hp(5, D.browV - 10, 88), hp(4.4, D.noseV - 6, 88 + D.noseP), hp(0, D.noseV - 2, 88 + D.noseP), hp(-4.4, D.noseV - 6, 88 + D.noseP)], [.2, .2, .6, .8, .6]); S.both(nb, m.b, m.k, 1.1); S.within(nb, () => steel(S, nb, m, hp(-6, 10, 90), hp(6, 10, 90)));
    S.stroke(spl([hp(2, D.crown - 33, -20), hp(3, D.crown * .55, 60), hp(0, D.browV - 9, 86)]), m.k, .9, { op: .5 }); rivets(S, splPts([hp(-D.zyg - 4, D.browV - 13, 20), hp(0, D.browV - 8, 86), hp(D.zyg + 4, D.browV - 13, 20)], false, 1, 6), 8, 1.4 * s, m); } },
  kettle: { name: 'Kettle helm', draw(C, o) { const { S, Hd } = C, { D, hp, s } = Hd, M = mats(o), m = M.st; S.layer('headwear'); const c = hp(0, D.hairV - 4, 10), br = ell(c, 116 * s, 26 * s, 0); S.both(br, m.s, m.k, 1.1); S.within(br, () => steel(S, br, m, add(c, [-116 * s, 0]), add(c, [116 * s, 0]))); const dm = spl([add(c, [-78 * s, -2 * s]), add(c, [-70 * s, -52 * s]), add(c, [0, -84 * s]), add(c, [70 * s, -52 * s]), add(c, [78 * s, -2 * s]), add(c, [0, 10 * s])], true); S.both(dm, m.b, m.k, 1.1); S.within(dm, () => steel(S, dm, m, add(c, [-78 * s, -30 * s]), add(c, [78 * s, -30 * s]), { sky: [add(c, [0, -84 * s]), add(c, [0, 10 * s])] })); S.stroke(spl([add(c, [0, -84 * s]), add(c, [3 * s, -40 * s]), add(c, [0, 8 * s])]), m.k, .9, { op: .6 }); rivets(S, splPts([add(c, [-74 * s, -6 * s]), add(c, [0, 4 * s]), add(c, [74 * s, -6 * s])], false, 1, 6), 9, 1.6 * s, m); } },
  hood: { name: 'Hood, raised', draw(C, o) { const { S, Hd, F } = C, { D, hp, s } = Hd, m = cloth(o.dye || 'charcoal'); S.layer('headwear');
    const outer = [hp(4, D.crown - 30, -30), hp(D.cran * .72, D.crown - 8, -14), hp(D.cran + 20, D.crown * .47, -12), hp(D.zyg + 25, 22, 0), hp(D.zyg + 17, 84, 0), add(F.trap[1], [4, 8]), [F.cxS, F.pit[1] + F.Hh * .13], add(F.trap[0], [-4, 8]), hp(-D.zyg - 17, 84, 0), hp(-D.zyg - 25, 22, 0), hp(-D.cran - 20, D.crown * .47, -12), hp(-D.cran * .72, D.crown - 8, -14)];
    const inner = [hp(0, D.hairV - 15, 80), hp(40, D.hairV - 3, 62), hp(D.zyg - 2, -12, 36), hp(D.zyg - 3, 40, 30), hp(D.gon - 3, D.gonV + 8, 14), hp(D.chinW + 9, D.chinV + 11, 60), hp(-D.chinW - 9, D.chinV + 11, 60), hp(-D.gon + 3, D.gonV + 8, 14), hp(-D.zyg + 3, 40, 30), hp(-D.zyg + 2, -12, 36), hp(-40, D.hairV - 3, 62)];
    const di = spl(inner, true), d = spl(outer, true) + spl(inner.slice().reverse(), true);
    S.within(di, () => S.fill(di, S.lin(hp(0, D.hairV - 15, 80), hp(0, 30, 80), [[0, '#1b1426', .5], [1, '#1b1426', 0]])));      // the hood's shade on the brow
    S.fill(d, m.b); S.within(d, () => { tone(S, d, m, hp(-D.cran - 20, -40, 0), hp(D.cran + 20, -40, 0)); S.stroke(di, m.d, 16, { op: .6 }); });
    S.stroke(spl(outer, true), m.k, 1.1); S.stroke(di, m.k, 1.1);
    for (const sg of [-1, 1]) S.fill(ink(splPts([hp(sg * D.cran * .5, D.crown - 4, -14), hp(sg * (D.cran + 10), -30, -10), hp(sg * (D.zyg + 14), 60, 0)], false, 1, 6), fade(S.lw(1.1))), m.k, { op: .55 }); } },
  mitre: { name: 'Skullcap', draw(C, o) { const { S, Hd } = C, { D, hp, s } = Hd, m = cloth(o.dye || 'black'); S.layer('headwear'); const d = spl([hp(-D.cran * .78, D.crown + 26, -10), hp(-D.cran * .5, D.crown + 2, -8), hp(0, D.crown - 8, -6), hp(D.cran * .5, D.crown + 2, -8), hp(D.cran * .78, D.crown + 26, -10), hp(0, D.crown + 22, 40)], true); S.both(d, m.b, m.k, 1.1); S.within(d, () => tone(S, d, m, hp(-D.cran, D.crown + 10, 0), hp(D.cran, D.crown + 10, 0))); } },
};

// ---------------------------------------------------------------- outfits: lists of items ----------------------------
const set = (o, ...ids) => ids.map(id => ({ id, ...o }));
export const OUTFITS = {
  serf:     { name: 'Bondman: patched hemp, rope belt', gear: [{ id: 'barelegs', from: .12 }, { id: 'wraps', dye: 'hemp' }, { id: 'shoes', kind: 'turn', leather: 'dark' }, { id: 'tunic', dye: 'undyed', len: .34, ease: 14, neck: 'slit', sleeves: 'long', patch: 'hemp' }, { id: 'belt', rope: 1, leather: 'hemp', w: 16 }] },
  peasant:  { name: 'Countryman: tunic, hood and hose', gear: [{ id: 'hose', dye: 'brown' }, { id: 'shoes', kind: 'ankle', leather: 'dark' }, { id: 'tunic', dye: 'russet', len: .36, ease: 12, neck: 'round', sleeves: 'long', trim: 'ochre' }, { id: 'belt', leather: 'brown', w: 26 }, { id: 'pouch', side: -1 }, { id: 'hood', dye: 'forest' }] },
  smock:    { name: 'Child\'s smock', gear: [{ id: 'barelegs', from: .12 }, { id: 'shoes', kind: 'bare' }, { id: 'tunic', dye: 'woad', len: .5, ease: 12, neck: 'round', sleeves: 'long', patch: 'undyed', flare: 34 }] },
  kirtle:   { name: 'Countrywoman: laced kirtle and apron', gear: [{ id: 'shoes', kind: 'turn', leather: 'brown' }, { id: 'tunic', dye: 'madder', len: .97, ease: 5, fitted: 1, neck: 'laced', sleeves: 'long', flare: 60, folds: 8 }, { id: 'apron', leather: 'linen', len: .7 }, { id: 'belt', leather: 'tan', w: 18 }] },
  smith:    { name: 'Smith: rolled sleeves, leather apron', gear: [{ id: 'hose', dye: 'walnut' }, { id: 'shoes', kind: 'boot', leather: 'dark' }, { id: 'tunic', dye: 'cream', len: .26, ease: 9, neck: 'slit', sleeves: 'rolled' }, { id: 'apron', leather: 'brown', len: .5 }, { id: 'belt', leather: 'dark', w: 34, metal: 'iron' }, { id: 'tool', kind: 'hammer', side: 1 }] },
  merchant: { name: 'Merchant: fur-edged gown, purse and keys', gear: [{ id: 'shoes', kind: 'turn', leather: 'dark' }, { id: 'tunic', dye: 'teal', len: .93, ease: 16, neck: 'v', sleeves: 'bell', trim: 'ochre', trimHem: 'bear', trimW: 30, flare: 44, folds: 7, buttons: 'bronze' }, { id: 'belt', leather: 'red', w: 26, metal: 'bronze', plaques: 1 }, { id: 'pouch', side: -1, z: 1.25, keys: 1, leather: 'red' }, { id: 'furcollar', fur: 'bear', z: .2 }] },
  priest:   { name: 'Priest: habit, cowl and cord', gear: [{ id: 'shoes', kind: 'turn', leather: 'tan' }, { id: 'tunic', dye: 'walnut', len: .96, ease: 18, neck: 'round', sleeves: 'wide', flare: 30, folds: 6 }, { id: 'belt', rope: 1, leather: 'linen', w: 15 }, { id: 'hood', dye: 'walnut', cape: .5 }, { id: 'amulet', metal: 'bronze', device: 'sun' }] },
  soldier:  { name: 'Man-at-arms: mail over a padded coat, his lord\'s colours', gear: [{ id: 'hose', dye: 'charcoal' }, { id: 'shoes', kind: 'boot', leather: 'dark', high: 1 }, ...set({ q: 0 }, 'greaves', 'poleyns'), { id: 'padding' }, { id: 'mail' }, { id: 'mailcollar' }, { id: 'tabard', field: 'crimson', pale: 'ochre', trim: 'bronze', len: .32, device: 'tower', point: 0 }, { id: 'belt', leather: 'dark', w: 30, metal: 'iron' }, ...set({ q: 1 }, 'vambraces', 'couters'), { id: 'gloves', leather: 'dark' }, { id: 'sword', q: 1 }, { id: 'shield', q: 1, field: 'crimson', pale: 'ochre', device: 'tower' }] },
  knight:   { name: 'Knight: full harness, tabard and cloak', gear: [{ id: 'hose', dye: 'charcoal' }, { id: 'shoes', kind: 'turn', leather: 'dark' }, { id: 'padding', dye: 'navy', trim: 'ochre' }, { id: 'mail' }, ...set({ q: 3 }, 'cuisses', 'greaves', 'poleyns', 'sabatons', 'breastplate', 'fauld', 'tassets', 'rerebraces', 'vambraces', 'couters', 'gauntlets'), { id: 'cloak', dye: 'blue', lining: 'navy', trim: 'gold', len: .86, q: 3, clasp: 'gold', mantle: .46 }, { id: 'tabard', field: 'white', pale: 'blue', trim: 'gold', len: .62, device: 'sun' }, { id: 'belt', leather: 'brown', w: 34, metal: 'gold', plaques: 1 }, ...set({ q: 3 }, 'pauldrons', 'gorget'), { id: 'furcollar', fur: 'ermine', z: .2 }, { id: 'sword', q: 3 }, { id: 'shield', q: 3, field: 'white', pale: 'blue', device: 'sun' }] },
  lady:     { name: 'Lady: fitted gown, hanging sleeves, a jewelled girdle', gear: [{ id: 'shoes', kind: 'poulaine', leather: 'red' }, { id: 'tunic', dye: 'forest', len: 1.0, ease: 4, fitted: 1, neck: 'wide', sleeves: 'wide', trim: 'mustard', trimHem: 'mustard', flare: 70, folds: 9 }, { id: 'belt', leather: 'red', w: 20, metal: 'gold', plaques: 1, hang: 240, at: .5 }, { id: 'chain', metal: 'gold', gem: '#2f5fa8' }] },
  royal:    { name: 'King: robe of state, ermine and gold', gear: [{ id: 'shoes', kind: 'poulaine', leather: 'red' }, { id: 'tunic', dye: 'crimson', len: .97, ease: 15, neck: 'round', sleeves: 'bell', trim: 'mustard', trimHem: 'mustard', trimW: 22, flare: 40, folds: 7, buttons: 'gold' }, { id: 'belt', leather: 'dark', w: 30, metal: 'gold', plaques: 1 }, { id: 'cloak', dye: 'purple', lining: 'ermine', trim: 'gold', len: 1.0, q: 3, clasp: 'gold', mantle: .5, spread: .075 }, { id: 'furcollar', fur: 'ermine', z: .34 }, { id: 'chain', metal: 'gold' }, { id: 'sword', q: 3, r: 3, long: 1 }] },
  squire:   { name: 'Squire: short livery coat and hose', gear: [{ id: 'hose', dye: 'navy' }, { id: 'shoes', kind: 'ankle', leather: 'brown' }, { id: 'tunic', dye: 'woad', len: .2, ease: 7, neck: 'high', sleeves: 'long', trim: 'cream', buttons: 'bronze', fitted: 1 }, { id: 'belt', leather: 'dark', w: 24, metal: 'bronze' }, { id: 'tool', kind: 'knife', side: 1 }] },
  huntsman: { name: 'Huntsman: leather jerkin, tall boots', gear: [{ id: 'hose', dye: 'forest', loose: 1 }, { id: 'shoes', kind: 'boot', leather: 'brown', high: 1 }, { id: 'tunic', dye: 'sage', len: .22, ease: 9, neck: 'slit', sleeves: 'long' }, { id: 'tunic', dye: 'brown', len: .16, ease: 11, neck: 'v', sleeves: 'none' }, { id: 'belt', leather: 'dark', w: 30, metal: 'bronze' }, { id: 'tool', kind: 'knife', side: 1 }, { id: 'hood', dye: 'walnut', cape: .45 }] },
  rogue:    { name: 'Outrider: dark leather, cloak and blades', gear: [{ id: 'hose', dye: 'charcoal', loose: 1 }, { id: 'shoes', kind: 'boot', leather: 'black', high: 1 }, { id: 'tunic', dye: 'charcoal', len: .22, ease: 8, neck: 'high', sleeves: 'long' }, { id: 'tunic', dye: 'black', len: .15, ease: 10, neck: 'v', sleeves: 'none', trim: 'charcoal' }, { id: 'cloak', dye: 'charcoal', lining: 'black', len: .8, mantle: false, spread: .05 }, { id: 'belt', leather: 'black', w: 30, metal: 'iron' }, { id: 'baldric', leather: 'dark', from: 1, studs: 1 }, { id: 'tool', kind: 'knife', side: 1 }, { id: 'tool', kind: 'knife', side: -1 }, { id: 'bracers', leather: 'black', studs: 1 }, { id: 'hood', dye: 'charcoal', cape: .5 }] },
  northman: { name: 'Northman: fur, leather and a bearded axe', gear: [{ id: 'hose', dye: 'walnut', loose: 1 }, { id: 'shoes', kind: 'boot', leather: 'brown', high: 1, cuff: 'bear' }, { id: 'tunic', dye: 'madder', len: .3, ease: 8, neck: 'v', sleeves: 'none', trimHem: 'dark', trimW: 16 }, { id: 'belt', leather: 'dark', w: 40, metal: 'bronze', plaques: 1 }, { id: 'baldric', leather: 'dark', from: 0, studs: 1, metal: 'bronze' }, { id: 'baldric', leather: 'dark', from: 1, studs: 1, metal: 'bronze', at: .56 }, { id: 'tool', kind: 'axe', side: -1 }, { id: 'bracers', leather: 'dark', studs: 1, metal: 'bronze' }, { id: 'furcollar', fur: 'bear', z: .34 }] },
  dame:     { name: 'Lady knight: a black gown under harness', gear: [{ id: 'sabatons', q: 3, r: 2 }, { id: 'tunic', dye: 'black', len: .97, ease: 5, fitted: 1, neck: 'high', sleeves: 'long', trim: 'mustard', trimHem: 'mustard', trimW: 16, flare: 56, folds: 8, split: 1, under: 'murrey' }, ...set({ q: 3, r: 2 }, 'breastplate', 'fauld'), { id: 'belt', leather: 'black', w: 26, metal: 'gold', plaques: 1, hang: 200 }, ...set({ q: 3, r: 2 }, 'rerebraces', 'vambraces', 'couters', 'gauntlets'), { id: 'pauldrons', q: 3, r: 2, z: 1.6 }, { id: 'gorget', q: 3, r: 2 }, { id: 'cloak', dye: 'murrey', lining: 'black', trim: 'gold', len: .9, mantle: false, q: 3 }, { id: 'sword', q: 2, r: 2 }] },
  sellsword: { name: 'Sellsword: a red coat of plates', gear: [{ id: 'hose', dye: 'charcoal' }, { id: 'shoes', kind: 'boot', leather: 'dark', high: 1 }, ...set({ q: 1 }, 'greaves', 'poleyns'), { id: 'tunic', dye: 'crimson', len: .3, ease: 9, fitted: 1, neck: 'high', sleeves: 'long', quilt: 1, trimHem: 'dark', trim: 'dark' }, { id: 'tunic', dye: 'dark', len: .12, ease: 11, neck: 'v', sleeves: 'none' }, { id: 'belt', leather: 'dark', w: 30, metal: 'bronze' }, { id: 'baldric', leather: 'brown', from: 0, metal: 'bronze' }, { id: 'bracers', leather: 'brown', studs: 1, metal: 'bronze' }, { id: 'pauldrons', q: 1, z: 1.35 }, { id: 'sword', q: 1, r: 1 }] },
  cuirassier: { name: 'Serjeant: breastplate over mail', gear: [{ id: 'hose', dye: 'walnut' }, { id: 'shoes', kind: 'boot', leather: 'dark' }, ...set({ q: 2 }, 'cuisses', 'greaves', 'poleyns'), { id: 'mail', sleeves: 'long', len: .3 }, { id: 'mailcollar' }, ...set({ q: 2 }, 'breastplate', 'fauld'), { id: 'belt', leather: 'dark', w: 30, metal: 'bronze' }, ...set({ q: 2 }, 'rerebraces', 'vambraces', 'couters', 'gauntlets', 'pauldrons', 'gorget'), { id: 'sword', q: 2 }] },
};

const HARNESS = new Set(['breastplate', 'fauld', 'tassets', 'cuisses', 'greaves', 'poleyns', 'sabatons', 'rerebraces', 'vambraces', 'couters', 'gauntlets', 'pauldrons', 'gorget', 'helm', 'shield', 'sword']);
export function dress(S, F, Hd, look, sk, H) {
  const C = { S, F, Hd, sk, look, r: stream(look.id || 'x', 'dress'), st: {}, armOrder: F.pose.folded ? [1, 0] : [0, 1] };
  const base = OUTFITS[look.outfit] || OUTFITS.peasant;
  let gear = (look.gear || base.gear).map(g => ({ ...g }));
  // the look may re-dye the main garment, regrade the arms, or swap one item for another, without touching the rest
  if (look.dye) { const main = [...gear].reverse().find(g => g.id === 'tunic' && !g.mail && !g.quilt) || gear.find(g => g.id === 'tabard'); if (main) main.id === 'tabard' ? (main.pale = look.dye) : (main.dye = look.dye); }
  const PIECE = g => 'q' in g || HARNESS.has(g.id);
  if (look.quality != null) for (const g of gear) if (PIECE(g)) g.q = look.quality;
  if (look.rarity != null) for (const g of gear) if (PIECE(g)) g.r = look.rarity;
  if (look.shield === 'none') gear = gear.filter(g => g.id !== 'shield'); else if (look.shield && !gear.find(g => g.id === 'shield')) gear.push({ id: 'shield', q: look.quality ?? 1, r: look.rarity || 0, field: look.dye || 'crimson', pale: 'ochre', device: 'tower' });
  if (look.cloak) gear = [...gear.filter(g => g.id !== 'cloak'), ...(look.cloak === 'none' ? [] : [{ id: 'cloak', dye: look.cloak, mantle: .46, clasp: 'bronze' }])];
  if (look.weapon === 'none') gear = gear.filter(g => g.id !== 'sword');
  else if (look.weapon && !gear.find(g => g.id === 'sword')) gear.push({ id: 'sword', q: look.quality ?? 1, r: look.rarity || 0 });
  if (F.pose.arm.some(a => a.staff) && !gear.find(g => g.id === 'staff')) gear.push({ id: 'staff', kind: look.staff || 'staff' });
  if (!gear.some(g => g.id === 'tunic' && (g.sleeves || 'long') !== 'none')) for (const i of C.armOrder) {
    const A = F.arm[i]; S.layer(A.back ? 'armsBack' : 'arms'); const arc = shoulderBall(S, F, i, sk, 0), T = armTube(F, i, 0);
    limbFill(S, T, sk, { cap: false }); S.stroke(polyline(arc), sk.k, 1.1);
    if (F.mu > .2) { S.fill(ink(part(offset(T.c, A.s * F.armR[0] * .3), .1, .36), fade(S.lw(1.1))), sk.k, { op: .5 }); S.fill(ink(part(offset(T.c, -A.s * F.armR[0] * .25), .22, .44), fade(S.lw(1))), sk.k, { op: .4 }); S.fill(ink(part(offset(T.c, -A.s * F.armR[2] * .25), .56, .8), fade(S.lw(1))), sk.k, { op: .4 }); }
  }
  for (const g of gear) { const it = ITEMS[g.id]; if (it) it(C, g); }
  const hw = HEADWEAR[look.headwear]; if (hw && hw.draw) hw.draw(C, { ...(look.headwearOpts || {}), ...(look.quality != null ? { q: look.quality } : {}), ...(look.rarity != null ? { r: look.rarity } : {}) });
  // hands last: bare, gloved or in plate
  const hm = C.st.handMat || sk;
  for (const i of C.armOrder) { const A = F.arm[i]; if (A.back || A.hand === 'hidden' || A.hand === 'tucked') continue; hand(S, F, i, hm, A.hand, C.st.handMetal); }
  if (F.pose.planted) { /* both hands rest on the pommel: drawn above by hand() */ }
}
