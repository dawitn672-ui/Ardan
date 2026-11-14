// The figure library · arms. Every weapon and shield is a made thing: a blade with its shoulders, fuller, ridge and honed
// edge; a guard, a bound grip and a pommel; a scabbard with its locket, bands and chape; a haft with langets, rivets and a
// shod butt; a bow with its nocks, grip and string. Each is drawn from its FORM (what it is: an arming sword, a bearded
// axe, a halberd), its MAKE (q: 0 crude .. 3 masterwork, the smith's care), its RARITY (r: 0 common .. 3 legendary, what it
// is made of) and its STYLE (st: whose hands made it: north, solen, desert, dwarf, elf, orc). Sizes are true: millimetres.
// Pure: nothing here reads the page, the clock or a die; a piece's wear comes from a stream seeded by its own measures.
// A detail is drawn only where it can be seen (see()), and a piece that lies outside the picture costs nothing (gone()).
import { lerp, clamp, add, sub, mul, mix, norm, perp, dir, spl, poly, polyline, ell, ellPts, stream, mixc, n1 } from './g.js';
import { cloth, metal } from './palette.js';
import { mats, GEM, scrolls, dull } from './make.js';

const LIGHT = [-.5, -.86];
// a detail `mm` millimetres across is worth drawing in this picture
const see = (S, mm) => !S.minPx || mm * S.px >= S.minPx * S.coarse;
// the piece's own frame: u runs from G along a (0 = down the page), v across it; o.bend curves the line toward −v
function frame(G, a, bend = 0, L = 1) {
  const x = dir(a), y = perp(x), W = (u, v = 0) => { const c = bend ? v + bend * u * u / L : v; return [G[0] + x[0] * u + y[0] * c, G[1] + x[1] * u + y[1] * c]; };
  return { G, a, x, y, W, P: pts => pts.map(p => W(p[0], p[1])), lit: y[0] * LIGHT[0] + y[1] * LIGHT[1] > 0 ? 1 : -1, lu: x[0] * LIGHT[0] + x[1] * LIGHT[1] > 0 ? 1 : -1 };
}
// is everything from u0 to u1, reaching r to each side, outside the picture?
function gone(S, F, u0, u1, r) {
  const v = S.view; if (!v) return false; const a = F.W(u0, 0), b = F.W(u1, 0);
  return Math.max(a[0], b[0]) + r < v[0] || Math.min(a[0], b[0]) - r > v[0] + v[2] || Math.max(a[1], b[1]) + r < v[1] || Math.min(a[1], b[1]) - r > v[1] + v[3];
}
const STEEL = m => [[0, m.s], [.07, m.b], [.2, m.l], [.27, m.hi], [.34, m.hi], [.35, m.b], [.58, m.s], [.8, m.d], [.92, m.d], [1, m.s]];
const SOFT = m => [[0, m.b], [.2, m.l], [.46, m.b], [.82, m.s], [1, m.d || m.s]];
// ONE PART of a piece: an outline in (u, v), filled and lined, turned from its lit side when it is big enough to show.
// o.k roundness of its corners · o.al: the part lies across the axis (a guard, a band), so it turns along u
// o.flat: no turn · o.in(d): more paint, clipped to it. Returns its path ('' when it cannot be seen).
function part(S, F, pts, m, o = {}) {
  const d = o.sm != null ? spl(F.P(pts), true, o.sm) : poly(F.P(pts), o.k ?? .3); if (S.cut(d)) return '';
  let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9; for (const p of pts) { if (p[0] < u0) u0 = p[0]; if (p[0] > u1) u1 = p[0]; if (p[1] < v0) v0 = p[1]; if (p[1] > v1) v1 = p[1]; }
  let fill = m.b;
  if (!o.flat && see(S, (o.al ? u1 - u0 : v1 - v0) * .34)) {
    const um = (u0 + u1) / 2, vm = (v0 + v1) / 2, a = o.al ? F.W(F.lu > 0 ? u1 : u0, vm) : F.W(um, F.lit > 0 ? v1 : v0), b = o.al ? F.W(F.lu > 0 ? u0 : u1, vm) : F.W(um, F.lit > 0 ? v0 : v1);
    fill = S.lin(a, b, (m.hi ? STEEL : SOFT)(m));
  }
  S.both(d, fill, m.k, o.lw ?? 1.05);
  if (o.in) S.within(d, () => o.in(d));
  return d;
}
const seg = (F, a, b) => polyline([F.W(a[0], a[1]), F.W(b[0], b[1])]);
const dotsAt = (F, pts, r) => { let d = ''; for (const q of pts) { const p = F.W(q[0], q[1]); d += `M${n1(p[0] - r)} ${n1(p[1])}a${n1(r)} ${n1(r)} 0 1 0 ${n1(2 * r)} 0a${n1(r)} ${n1(r)} 0 1 0 ${n1(-2 * r)} 0`; } return d; };
// rivets or studs: a light head with a dark line under it
const studs = (S, F, pts, r, m) => { if (!see(S, r * 2)) return; const d = dotsAt(F, pts, r); S.fill(d, m.l); S.stroke(d, m.k, .6); };
const WOODS = ['#b39a6f', '#b58f5c', '#8a6740', '#4f3626'];                       // raw ash, ash, oiled oak, dark walnut: by make
const LEATHERS = [['hemp', 'brown', 'dark', 'crimson'], ['brown', 'navy', 'navy', 'blue'], ['dark', 'black', 'black', 'murrey'], ['linen', 'white', 'white', 'white']];
const BONE = { b: '#e6dcc8', s: '#c5b594', d: '#96835f', l: '#f6f0e3', k: '#4a3d28' }, HORN = { b: '#3d2f26', s: '#2a201a', d: '#1a1310', l: '#77604c', k: '#0d0806' };
export const STYLES = ['north', 'solen', 'desert', 'dwarf', 'elf', 'orc'];

// ---------------------------------------------------------------- blades ---------------------------------------------
// Sword and dagger forms. Lengths are fractions of the blade's length L: w its half-width at the shoulder, grip, cross
// (half the guard's span). t: stations along the blade; B, E: its half-width at each toward the back (−v) and the edge
// (+v), as fractions of w; tip: where the point lies. fl: how far the fuller runs. one: one-edged. bend: a curved blade.
const T4 = [0, .34, .68, .9];
const BLADES = {
  arming:   { w: .034, grip: .128, cross: .112, fl: .62, B: [1, .93, .83, .68], pom: 'wheel' },
  long:     { w: .028, grip: .205, cross: .122, fl: .42, B: [1, .9, .76, .56], pom: 'scent', two: 1 },
  great:    { w: .027, grip: .285, cross: .16, fl: .34, t: [0, .115, .13, .42, .72, .91], B: [.74, .74, 1.02, .95, .82, .62], pom: 'scent', two: 1, lugs: .122 },
  short:    { w: .05, grip: .2, cross: .13, fl: .7, B: [1, .98, .9, .74], pom: 'wheel' },
  estoc:    { w: .018, grip: .2, cross: .1, fl: 0, B: [1, .8, .6, .4], pom: 'scent', two: 1 },
  falchion: { w: .04, grip: .15, cross: .1, fl: .52, one: 1, t: [0, .34, .7, .86], B: [.62, .64, .66, .5], E: [.82, 1.02, 1.34, 1.3], tip: [1, -.34], tipK: .05, pom: 'wheel' },
  sabre:    { w: .03, grip: .14, cross: .08, fl: .6, one: 1, bend: -.15, B: [.7, .68, .62, .44], E: [1, 1, .96, .8], tip: [1, -.42], pom: 'cap' },
  leaf:     { w: .031, grip: .14, cross: .085, fl: .5, B: [.8, .86, 1.16, .92], pom: 'bud' },
  cleaver:  { w: .05, grip: .17, cross: .075, fl: 0, one: 1, t: [0, .34, .7, .88], B: [.5, .52, .54, .5], E: [.8, 1.12, 1.4, 1.42], tip: [1, .5], tipB: [[.96, -.9], [1.02, -.2]], tipK: .2, pom: 'spike' },
  // daggers: the same parts on a blade a third the length
  dagger:   { w: .078, grip: .4, cross: .21, fl: .5, B: [1, .86, .66, .4], pom: 'wheel' },
  parry:    { w: .07, grip: .36, cross: .27, fl: .4, B: [1, .84, .62, .38], pom: 'scent', ring: 1 },
  rondel:   { w: .05, grip: .4, cross: .15, fl: 0, B: [1, .8, .58, .34], pom: 'disc', guard: 'disc' },
  knife:    { w: .085, grip: .5, cross: 0, fl: 0, one: 1, B: [.5, .5, .46, .3], E: [1, 1, .9, .6], tip: [1, -.4], pom: 'none', guard: 'none', scale: 1 },
  seax:     { w: .075, grip: .38, cross: 0, fl: .5, one: 1, t: [0, .34, .62, .74], B: [.56, .58, .6, .6], E: [1, 1, 1, .92], tip: [1, .6], tipB: [[.76, -.6]], tipK: .1, pom: 'none', guard: 'none', scale: 1 },
};
// what a people's smiths make when the item names no form of its own
const OWN = { sword: { desert: 'sabre', elf: 'leaf', orc: 'cleaver', dwarf: 'short' }, dagger: { orc: 'seax', north: 'dagger' } };
const formOf = (kind, o) => BLADES[o.form] ? o.form : (OWN[kind][o.st] || (kind === 'dagger' ? 'dagger' : o.long ? 'long' : 'arming'));

// how long a sword's blade is on a person (a fraction of their height), and how far behind the guard its pommel lies
// (a fraction of the blade): what a hand resting on the pommel needs to know
const ON_BODY = { arming: .41, long: .5, great: .58, short: .3, estoc: .52, falchion: .37, sabre: .43, leaf: .4, cleaver: .34 };
export const swordLen = o => ON_BODY[formOf('sword', o)] || .41;
export const swordHilt = o => BLADES[formOf('sword', o)].grip + .056;

// the blade itself, bare. Returns its outline's points in (u, v)
function blade(S, F, L, w, f, M) {
  const { st, fit, q, r } = M, ts = f.t || T4, B = f.B, E = f.E || B, n = ts.length;
  const up = ts.map((t, i) => [L * t, -w * B[i]]), dn = ts.map((t, i) => [L * t, w * E[i]]), tp = [L * (f.tip ? f.tip[0] : 1), w * (f.tip ? f.tip[1] : 0)], tb = (f.tipB || []).map(p => [L * p[0], w * p[1]]);
  const kk = ts.map((t, i) => (i ? .7 : 0)); if (f.lugs) { kk[1] = kk[2] = .1; }
  const out = [...up, ...tb, tp, ...dn.slice().reverse()], d = poly(F.P(out), [...kk, ...tb.map(() => .25), f.tipK ?? .15, ...kk.slice().reverse()]);
  if (S.cut(d)) return out;
  S.both(d, st.b, st.k, 1.05);
  if (!see(S, w * .9)) return out;
  const rm = f.one ? -w * B[0] * .3 : 0, mid = ts.map(t => [L * t, rm]), lite = F.lit < 0, r0 = stream('arm' + Math.round(L) + q + r, 'wear');
  S.within(d, () => {
    // the two faces (or, on a backsword, the flat of the back and the long bevel to the edge)
    S.fill(polyline(F.P([[0, -w * 2], [L * 1.05, -w * 2], tp, ...mid.slice().reverse()]), true), f.one ? (lite ? st.b : st.s) : lite ? st.l : st.s);
    S.fill(polyline(F.P([...mid, tp, [L * 1.05, w * 2], [0, w * 2]]), true), f.one ? (lite ? st.l : mixc(st.l, st.b, .5)) : lite ? st.s : st.l);
    const fw = w * (f.one ? .2 : .3), fc = f.one ? rm - fw * 1.3 : 0, fl = f.fl * (r === 1 ? 1.2 : 1), full = (c, k, col, op) => {
      // a groove: its wall on the lit side falls in shade, its far wall catches the light
      const sg = lite ? -1 : 1, wall = (a, b2) => polyline(F.P([[L * .025, c + sg * fw * k * a], [L * fl * .5, c + sg * fw * k * a * .9], [L * fl, c + sg * fw * k * a * .6], [L * (fl + .03), c], [L * fl, c + sg * fw * k * b2 * .6], [L * fl * .5, c + sg * fw * k * b2 * .9], [L * .025, c + sg * fw * k * b2]]), true);
      if (col !== st.d || !see(S, fw * 1.6)) { S.fill(wall(1, -1), col, { op }); return; }
      S.fill(wall(1, 0), st.d, { op: .85 }); S.fill(wall(0, -1), mixc(st.s, st.b, .5), { op: .9 });
      S.stroke(polyline(F.P([[L * .03, c - sg * fw * k * .86], [L * fl * .5, c - sg * fw * k * .78], [L * fl, c - sg * fw * k * .5]])), st.hi, .8, { op: .7 });
    };
    if (fl) { if (r === 2 && !f.one) { full(-w * .36, .42, st.d, .7); full(w * .36, .42, st.d, .7); } else full(fc, 1, r === 3 ? fit.b : st.d, r === 3 ? .9 : .55); }
    // the honed edges: a bright bevel that a crude blade never got
    if (q > 0) { const bev = (E2, sg, op) => S.fill(polyline(F.P([...E2, tp, ...E2.slice().reverse().map(p => [p[0], p[1] - sg * w * .2])]), true), st.hi, { op });
      bev(dn, 1, lite ? .34 : .6); if (!f.one) bev(up, -1, lite ? .6 : .3); }
    // the polish: the room thrown back across a bright blade
    if (q > 0) S.fill(polyline(F.P([[L * .3, -w * 2], [L * .41, -w * 2], [L * .35, w * 2], [L * .24, w * 2]]), true), st.hi, { op: q > 1 ? .7 : .4 });
    if (q > 2) S.fill(polyline(F.P([[L * .455, -w * 2], [L * .475, -w * 2], [L * .415, w * 2], [L * .395, w * 2]]), true), st.hi, { op: .7 });
    if (fl && fl < .8 && !f.one && q > 0 && r !== 2) S.stroke(seg(F, [L * (fl + .04), 0], [tp[0] - w, tp[1]]), st.hi, .9, { op: .7 });        // the ridge beyond the fuller
    // what the steel is: pattern-welded, cut with marks, or let in with gold
    if (r === 1) for (const v of [-.6, .6]) S.stroke(spl(F.P([0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => [L * (.06 + i * .1), w * (v + (i % 2 ? .13 : -.13))]))), st.hi, .8, { op: .55 });
    if (r === 2 && q > 0) { let rn = ''; for (let i = 0; i < 9; i++) { const p = F.W(L * (.1 + i * .05), 0), z = w * .2; rn += `M${n1(p[0] - z)} ${n1(p[1] - z)}l${n1(z)} ${n1(2 * z)}l${n1(z)} ${n1(-2 * z)}`; } S.stroke(rn, fit.l, .9, { op: .9 }); }
    if (r === 3) scrolls(S, [F.W(L * .06, fc), F.W(L * Math.max(.3, fl - .04), fc)], w * .26, fit.k, .85);
    // the maker's mark let into the forte; on a masterwork, a line of letters after it
    if (q > 1 && r < 2 && see(S, w * .5)) { const c = [L * .085, fc], z = w * .17; S.stroke(ell(F.W(c[0], c[1]), z, z) + seg(F, [c[0] - z * 1.5, c[1]], [c[0] + z * 1.5, c[1]]) + seg(F, [c[0], c[1] - z * 1.5], [c[0], c[1] + z * 1.5]), fit.l, .9);
      if (q > 2 && fl > .3) S.stroke(seg(F, [L * .13, fc], [L * (fl - .08), fc]), fit.l, w * .24, { units: 1, dash: `${n1(w * .12)} ${n1(w * .2)}`, cap: 'butt', op: .95 }); }
    // a crude blade: hammer-marked, nicked, with the fire's scale still on it
    if (q === 0) { for (const t of [.2, .46, .63, .8]) { const sg = r0() < .5 ? -1 : 1, e = sg < 0 ? B : E, k = e[Math.min(n - 1, Math.round(t * (n - 1)))]; S.fill(polyline(F.P([[L * t, sg * w * k * 1.1], [L * (t + .012), sg * w * k * .56], [L * (t + .03), sg * w * k * 1.1]]), true), st.k, { op: .8 }); }
      if (see(S, w * .6)) for (let i = 0; i < 3; i++) S.fill(ell(F.W(L * (.12 + r0() * .7), w * (r0() - .5)), w * (.3 + r0() * .3), w * .22, F.a), st.d, { op: .35 }); }
  });
  if (f.lugs && q > 0) for (const sg of [-1, 1]) part(S, F, [[L * (f.lugs - .028), sg * w * .7], [L * f.lugs, sg * w * 1.75], [L * (f.lugs + .012), sg * w * .9]], st, { k: .2, flat: 1 });   // parrying lugs above the ricasso
  S.stroke(d, st.k, 1.05);
  return out;
}

// the scabbard: leather over wood on the blade's own line, with what the make gives it: a rawhide binding, or a locket,
// bands with their rings and a chape, tooled and chased
function scabbard(S, F, L, w, f, M, o) {
  const { fit, q, r } = M, lea = cloth(o.leather || LEATHERS[r][q]), ts = f.t || T4, B = f.B, E = f.E || B, g = w * .26 + L * .004, wide = Math.max(...B, ...E);
  const bk = t => { const x = t * (ts.length - 1), i = Math.min(ts.length - 2, Math.floor(x)); return -(w * (f.one ? lerp(B[i], B[i + 1], x - i) : Math.min(wide, lerp(B[i], B[i + 1], x - i) + .08)) + g) * (t > .86 ? lerp(1, .74, (t - .86) / .14) : 1); };
  const ed = t => { const x = t * (ts.length - 1), i = Math.min(ts.length - 2, Math.floor(x)); return (w * (f.one ? lerp(E[i], E[i + 1], x - i) : Math.min(wide, lerp(E[i], E[i + 1], x - i) + .08)) + g) * (t > .86 ? lerp(1, .74, (t - .86) / .14) : 1); };
  const T = [.012, .2, .4, .6, .8, .92], tipV = f.tip ? w * f.tip[1] * .5 : 0, end = [L * 1.035, tipV];
  const body = part(S, F, [...T.map(t => [L * t, bk(t)]), end, ...T.slice().reverse().map(t => [L * t, ed(t)])], lea, { k: [0, .6, .6, .6, .6, .6, .7, .6, .6, .6, .6, .6, 0], in: () => {
    if (!see(S, w)) return;
    if (q < 2) S.stroke(polyline(F.P(T.map(t => [L * t, bk(t) * .62]))), lea.l, .7, { op: .6, dash: '2.6 2.4' });                           // the seam's stitches
    else { S.stroke(polyline(F.P(T.map(t => [L * t, bk(t) * .7]))) + polyline(F.P(T.map(t => [L * t, ed(t) * .7]))), lea.l, .7, { op: .5 });  // tooled lines
      if (q > 2 && see(S, w * .5)) { let dz = ''; for (let i = 0; i < 7; i++) { const t = .39 + i * .028 * (r > 1 ? .8 : 1), p = [L * t, 0], z = w * .3; dz += polyline(F.P([[p[0] - z, 0], [p[0], -z * .8], [p[0] + z, 0], [p[0], z * .8]]), true); } S.stroke(dz, fit.l, .7, { op: .8 }); } }
    if (q === 0) { for (const t of [.3, .55, .75]) S.stroke(seg(F, [L * t, bk(t) * 1.1], [L * (t + .02), ed(t) * 1.1]), lea.k, .8, { op: .5 }); S.fill(polyline(F.P([[L * .44, bk(.44) * .9], [L * .5, bk(.5) * .9], [L * .5, 0], [L * .45, ed(.45) * .3]]), true), lea.l, { op: .35 }); }
  } });
  if (!body) return;
  const band = (t0, t1, sh) => part(S, F, [[L * t0, bk(t0) * 1.07], [L * t1, bk(t1) * 1.07], ...(sh ? [[L * (t1 + sh), (bk(t1) + ed(t1)) / 2]] : []), [L * t1, ed(t1) * 1.07], [L * t0, ed(t0) * 1.07]], fit, { k: sh ? [.1, .3, .1, .3, .1] : .12 });
  if (q === 0) { for (const t of [.035, .07, .9, .94]) S.stroke(seg(F, [L * t, bk(t) * 1.08], [L * t, ed(t) * 1.08]), cloth('linen').b, 2.2, { op: .9 }); return; }     // rawhide bound round throat and tip
  band(.012, .1, q > 1 ? .035 : 0);
  part(S, F, [[L * .85, bk(.85) * 1.07], [L * .93, bk(.93) * 1.07], [L * 1.045, tipV], [L * .93, ed(.93) * 1.07], [L * .85, ed(.85) * 1.07], ...(q > 1 ? [[L * .815, (bk(.85) + ed(.85)) / 2]] : [])], fit, { k: q > 1 ? [.1, .5, .6, .5, .1, .1] : [.1, .5, .6, .5, .1] });
  if (q > 1 && see(S, w * .5)) S.both(ell(F.W(L * 1.056, tipV), w * .2, w * .2), fit.l, fit.k, .7);
  for (const t of [...(q > 1 ? [.3] : []), ...(r > 1 ? [.58] : [])]) { band(t, t + .04); if (see(S, w * .5)) { const p = F.W(L * (t + .02), bk(t) * 1.07 - w * .34); S.stroke(ell(p, w * .32, w * .32), fit.k, 2.6); S.stroke(ell(p, w * .32, w * .32), fit.l, 1.2); } }
  if (M.scroll && see(S, w * .5)) { scrolls(S, [F.W(L * .03, 0), F.W(L * .09, 0)], w * .42, fit.k, .8); scrolls(S, [F.W(L * .87, 0), F.W(L * .96, tipV)], w * .36, fit.k, .8); }
}

// guard, grip and pommel: the guard lies at u = 0 and the grip runs back from it
function hilt(S, F, L, w, f, M, o) {
  const { st, fit, q, r } = M, sty = o.st || 'north', gm = q === 0 ? st : fit, lea = cloth(o.grip || o.leather || LEATHERS[r][q]);
  const gk = { north: [1, 1, 0], solen: [1, 1, 0], desert: [.66, 1, 0], dwarf: [.8, 1.7, 0], elf: [1.05, .8, 0], orc: [.72, 1.35, 0] }[sty] || [1, 1, 0];
  const gl = L * f.cross * gk[0] * (q === 0 ? .9 : 1), gw = Math.max(L * .013, w * .4) * gk[1], grip = L * f.grip, gh = Math.max(w * (f.one ? .5 : .56), L * .014), big = see(S, gh * 1.2);
  // ---- the grip: cord on a crude one, leather over cord risers, wire, wire crossed over dyed leather
  const scale = f.scale ? cloth(sty === 'orc' ? '#d9cdb4' : WOODS[Math.min(3, q + 1)]) : null;
  part(S, F, [[-gw * .5, -gh], [-grip * .5, -gh * (f.two ? 1.04 : 1.1)], [-grip, -gh * .8], [-grip, gh * .8], [-grip * .5, gh * (f.two ? 1.04 : 1.1)], [-gw * .5, gh]], scale || (q === 0 ? cloth('hemp') : lea), { k: [.1, .8, .2, .2, .8, .1], in: () => {
    if (!big) return;
    const u0 = -gw * .6, span = grip - gw * .6, wire = q > 1 ? fit.l : lea.k, turn = (n, sl, col, px, op) => { let d = ''; for (let i = 1; i < n; i++) { const u = u0 - span * i / n; d += seg(F, [u + sl, -gh * 1.2], [u - sl, gh * 1.2]); } S.stroke(d, col, px, { op }); };
    if (scale) { studs(S, F, [.25, .5, .75].map(t => [u0 - span * t, 0]), gh * .2, q > 1 ? fit : st); return; }
    if (q === 0) turn(Math.round(span / (gh * .7)), gh * .34, cloth('hemp').k, .9, .75);
    else if (q === 1) { turn(Math.round(span / (gh * .5)), gh * .2, lea.k, .7, .45); for (const t of f.two ? [.2, .5, .8] : [.28, .7]) S.stroke(seg(F, [u0 - span * t, -gh * 1.2], [u0 - span * t, gh * 1.2]), lea.l, 1.6, { op: .7 }); }
    else { turn(Math.round(span / (gh * .34)), gh * .3, wire, .7, .9); if (q > 2) turn(Math.round(span / (gh * .68)), -gh * .6, fit.hi, .8, .8); }
  } });
  if (q > 1 && big) for (const u of [-gw * .9, -grip + gh * .2, ...(f.two ? [-grip * .52] : [])]) part(S, F, [[u - gh * .22, -gh * 1.16], [u + gh * .22, -gh * 1.16], [u + gh * .22, gh * 1.16], [u - gh * .22, gh * 1.16]], fit, { k: .2, al: 1 });
  // ---- the guard
  const G0 = f.guard || 'cross';
  if (G0 === 'disc') part(S, F, [[-gw * .9, -gl], [gw * .5, -gl], [gw * .5, gl], [-gw * .9, gl]], gm, { k: .4, al: 1 });
  else if (G0 === 'cross' && gl > 0) {
    const cv = (sty === 'solen' ? [.1, .16, .26, .32] : sty === 'north' ? [0, 0, .1, .2] : [0, 0, 0, 0])[q] * gl, fl2 = (sty === 'elf' ? [.5, .5, .45, .4] : sty === 'desert' ? [1.2, 1.4, 1.5, 1.6] : [1, 1.12, 1.3, 1.36])[q], ecu = sty === 'dwarf' ? 0 : [0, .3, .5, .75][q], s = sty === 'elf' ? gl * .28 : 0;
    const pts = [[-gw * fl2 + cv - s, -gl], [-gw * .82, -gl * .36], [-gw * .9, 0], [-gw * .82, gl * .36], [-gw * fl2 + cv + s, gl], [gw * fl2 + cv + s, gl * 1.02], [gw * .78, gl * .36], [gw * (.92 + ecu), 0], [gw * .78, -gl * .36], [gw * fl2 + cv - s, -gl * 1.02]];
    if (sty === 'desert') part(S, F, [[-gw * 2.4, -w * .34], [gw * 3.4, -w * .34], [gw * 4, 0], [gw * 3.4, w * .34], [-gw * 2.4, w * .34]], gm, { k: .3, flat: 1 });                 // langets up the blade and down the grip
    part(S, F, pts, gm, { k: sty === 'dwarf' ? .1 : q < 2 ? .25 : .6, al: 1, in: () => {
      if (!big) return;
      if (sty === 'dwarf') S.stroke(seg(F, [-gw * .5, -gl * .6], [gw * .5, -gl * .6]) + seg(F, [-gw * .5, gl * .6], [gw * .5, gl * .6]) + seg(F, [-gw * .5, 0], [gw * .5, 0]), gm.k, .9, { op: .7 });
      else if (M.scroll) { scrolls(S, [F.W(cv * .6, -gl * .86), F.W(0, -gl * .2)], gw * .5, gm.k, .7); scrolls(S, [F.W(0, gl * .2), F.W(cv * .6, gl * .86)], gw * .5, gm.k, .7); }
      else if (q === 2) S.stroke(seg(F, [cv * .5, -gl * .8], [0, -gl * .2]) + seg(F, [0, gl * .2], [cv * .5, gl * .8]), gm.k, .7, { op: .5 });
    } });
    if (big && (q > 2 || sty === 'desert') && sty !== 'elf' && sty !== 'dwarf') for (const sg of [-1, 1]) S.both(ell(F.W(cv + (sty === 'desert' ? 0 : -gw * .1), sg * gl * 1.02), gw * .92, gw * .92), gm.l, gm.k, .8);          // the quillons end in knobs
    if (sty === 'orc' && big) for (const sg of [-1, 1]) part(S, F, [[gw * .6, sg * gl * .5], [gw * 3.2, sg * gl * .7], [gw * .6, sg * gl * .95]], gm, { k: .15, flat: 1 });
    if ((f.ring || (sty === 'solen' && q > 1)) && big) { const c = F.W(gw * 1.9, 0), e = ell(c, gw * 1.5, Math.min(gl * .42, w * 1.25), -F.a); S.stroke(e, gm.k, 3.2); S.stroke(e, gm.b, 1.8); }           // a ring for the finger
  }
  if (q > 2 && G0 === 'cross' && big && sty !== 'elf') part(S, F, [[gw * .6, -w * .84], [gw * 1.7, -w * .76], [gw * 2.2, 0], [gw * 1.7, w * .76], [gw * .6, w * .84]], cloth(LEATHERS[r][3]), { k: [.1, .4, .5, .4, .1], flat: 1 });   // the rain-guard
  // ---- the pommel
  const pr = Math.max(L * (.024 + .003 * q + .002 * r), gh * 1.05), pk = f.pom === 'none' ? 'none' : q === 0 && f.pom !== 'disc' ? 'nut' : sty === 'desert' ? 'cap' : sty === 'dwarf' ? 'block' : sty === 'elf' ? 'bud' : sty === 'orc' ? 'spike' : f.pom;
  const pc = F.W(-grip - pr * .82, 0), pm = pk === 'spike' ? BONE : gm; let pd = '';
  if (pk === 'wheel' || pk === 'block') { pd = poly(ellPts(pc, pr * 1.06, pr * 1.06, F.a, pk === 'block' ? 8 : 12), pk === 'block' ? .12 : r === 2 ? .35 : .85);
    if (!S.cut(pd)) { S.both(pd, big ? S.radial(add(pc, mul(LIGHT, pr * .4)), pr * 1.6, [[0, pm.hi], [.22, pm.l], [.5, pm.b], [.8, pm.s], [1, pm.d]]) : pm.b, pm.k, 1.05);
      if (big) { S.stroke(ell(pc, pr * .6, pr * .6), pm.k, .8, { op: .8 }); if (q > 1) S.both(ell(pc, pr * .36, pr * .36), q > 2 || r > 1 ? GEM[r] : pm.l, q > 2 || r > 1 ? '#1b0b10' : pm.k, .8); if (q > 2 || r > 1) S.fill(ell(add(pc, mul(LIGHT, pr * .16)), pr * .12, pr * .09), '#ffffff', { op: .85 }); } } }
  else if (pk === 'nut') pd = part(S, F, [[-grip, -gh * .7], [-grip - pr * .5, -pr * 1.1], [-grip - pr * 1.25, -pr * .7], [-grip - pr * 1.4, 0], [-grip - pr * 1.25, pr * .7], [-grip - pr * .5, pr * 1.1], [-grip, gh * .7]], pm, { k: .7 });
  else if (pk === 'scent') { pd = part(S, F, [[-grip + pr * .1, -gh * .8], [-grip - pr * .9, -pr * 1.02], [-grip - pr * 1.9, -pr * .62], [-grip - pr * 2.2, 0], [-grip - pr * 1.9, pr * .62], [-grip - pr * .9, pr * 1.02], [-grip + pr * .1, gh * .8]], pm, { k: [.2, .7, .5, .3, .5, .7, .2], in: () => { if (big && q > 0) S.stroke(seg(F, [-grip - pr * .2, -pr * .6], [-grip - pr * 2, -pr * .2]) + seg(F, [-grip - pr * .2, pr * .6], [-grip - pr * 2, pr * .2]) + seg(F, [-grip - pr * .1, 0], [-grip - pr * 2.1, 0]), pm.k, .7, { op: .5 }); } });
    if (big && (q > 2 || r > 1)) { const c = F.W(-grip - pr * 1.05, 0); S.both(ell(c, pr * .3, pr * .3), GEM[r], '#1b0b10', .8); S.fill(ell(add(c, mul(LIGHT, pr * .12)), pr * .1, pr * .08), '#ffffff', { op: .85 }); } }
  else if (pk === 'cap') pd = part(S, F, [[-grip + pr * .2, -gh * .86], [-grip - pr * .9, -gh * 1.02], [-grip - pr * 1.7, -gh * .5], [-grip - pr * 1.9, gh * .9], [-grip - pr * 1.2, gh * 1.9], [-grip - pr * .5, gh * 1.3], [-grip + pr * .2, gh * .86]], pm, { k: [.2, .7, .8, .7, .5, .7, .2] });
  else if (pk === 'bud') pd = part(S, F, [[-grip + pr * .1, -gh * .7], [-grip - pr * .8, -pr * .86], [-grip - pr * 2.1, -pr * .3], [-grip - pr * 3, 0], [-grip - pr * 2.1, pr * .3], [-grip - pr * .8, pr * .86], [-grip + pr * .1, gh * .7]], pm, { k: [.2, .9, .6, .1, .6, .9, .2] });
  else if (pk === 'spike') pd = part(S, F, [[-grip + pr * .1, -gh * .9], [-grip - pr * 1.2, -gh * .7], [-grip - pr * 2.8, gh * .5], [-grip - pr * 1.1, gh * .9], [-grip + pr * .1, gh * .9]], pm, { k: [.2, .6, .1, .6, .2] });
  else if (pk === 'disc') pd = part(S, F, [[-grip - gw * .2, -gl * .9], [-grip + gw * 1.1, -gl * .9], [-grip + gw * 1.1, gl * .9], [-grip - gw * .2, gl * .9]], gm, { k: .4, al: 1 });
  if (q > 0 && big && (pk === 'wheel' || pk === 'scent')) S.both(polyline(F.P([[-grip - pr * (pk === 'scent' ? 2.2 : 1.86), -pr * .16], [-grip - pr * (pk === 'scent' ? 2.5 : 2.12), -pr * .13], [-grip - pr * (pk === 'scent' ? 2.5 : 2.12), pr * .13], [-grip - pr * (pk === 'scent' ? 2.2 : 1.86), pr * .16]]), true), gm.s, gm.k, .7);   // the tang's peened end
  return pc;
}

// A SWORD. G: where the guard crosses the blade; a: the blade's direction (radians, 0 = down the page); L: the blade's
// length; q: make; o: { r rarity, st style, form, long, sheathed, leather }. Returns { pommel, W }.
export function swordArt(S, G, a, L, q = 1, o = {}) { return bladeArt(S, G, a, L, q, o, 'sword'); }
// A DAGGER or knife: the same parts on a short blade. o.form: dagger, parry, rondel, knife, seax
export function daggerArt(S, G, a, L, q = 1, o = {}) { return bladeArt(S, G, a, L, q, o, 'dagger'); }
function bladeArt(S, G, a, L, q, o, kind) {
  const M = mats({ q, r: o.r }), f = BLADES[formOf(kind, o)], F = frame(G, a, f.bend || 0, L), w = L * (f.w + .003 * M.r);
  const out = { pommel: F.W(-L * f.grip - L * .03, 0), W: F.W };
  if (gone(S, F, -L * (f.grip + .09), L * 1.06, L * .2)) return out;
  if (o.sheathed) scabbard(S, F, L, w, f, M, o); else blade(S, F, L, w, f, M);
  out.pommel = hilt(S, frame(G, a), L, w, f, M, o);
  return out;
}

// ---------------------------------------------------------------- hafted arms ----------------------------------------
// Axes, maces and hammers, spears and pole arms: a haft from its butt (u = 0) to its top (u = L), and a head by form.
// Heads are true to size whatever the haft's length. o: { form, r, st, flip (the blade to the other side), wood, pennon }
export const HAFT_LEN = { axe: 760, hand: 470, great: 1450, cleaver: 600, mace: 640, star: 760, flail: 540, hammer: 780, pick: 720, maul: 1300, club: 720, spear: 2000, boar: 1800, pike: 2900, lance: 2800, glaive: 1700, halberd: 1750, bill: 1750, poleaxe: 1600, partisan: 1850, staff: 1750 };
const POLE = new Set(['spear', 'boar', 'pike', 'lance', 'glaive', 'halberd', 'bill', 'poleaxe', 'partisan', 'great', 'maul', 'staff']);
// a flat blade or head: an outline, its two faces meeting on a ridge from a to b, a bright bevel at the edge
function head(S, F, pts, m, o = {}) {
  return part(S, F, pts, m, { k: o.k ?? .4, flat: 1, in: () => {
    let v0 = 1e9, v1 = -1e9, u0 = 1e9, u1 = -1e9; for (const p of pts) { if (p[1] < v0) v0 = p[1]; if (p[1] > v1) v1 = p[1]; if (p[0] < u0) u0 = p[0]; if (p[0] > u1) u1 = p[0]; }
    if (!see(S, (v1 - v0) * .4)) return;
    const lite = F.lit < 0;
    if (o.mid) { const [a, b] = o.mid; S.fill(polyline(F.P([[u0 - 9, v0 - 9], [u1 + 9, v0 - 9], b, a]), true), lite ? m.l : m.s); S.fill(polyline(F.P([a, b, [u1 + 9, v1 + 9], [u0 - 9, v1 + 9]]), true), lite ? m.s : m.l); S.stroke(seg(F, a, b), m.hi, .8, { op: .7 }); }
    else S.fill(polyline(F.P([[u0, v0], [u1, v0], [u1, v1], [u0, v1]]), true), S.lin(F.W((u0 + u1) / 2, o.from ?? v0), F.W((u0 + u1) / 2, o.to ?? v1), [[0, m.s], [.5, m.b], [1, m.l]]));
    if (o.bev) S.fill(polyline(F.P(o.bev), true), m.hi, { op: o.q === 0 ? .25 : .7 });
    if (o.in) o.in();
  } });
}
export function haftArt(S, G, a, L, q = 1, o = {}) {
  const form = HAFT_LEN[o.form] ? o.form : 'spear', pole = POLE.has(form), M = mats({ q, r: o.r }), { st, fit, r } = M, F0 = frame(G, a);
  const F = o.flip ? { ...F0, W: (u, v = 0) => F0.W(u, -v), P: pts => pts.map(p => F0.W(p[0], -p[1])), lit: -F0.lit } : F0;
  if (gone(S, F, -80, L + 480, 240)) return;
  const hw = form === 'lance' ? 12 : pole ? 15.5 : form === 'hand' ? 11.5 : 13.5, wd = cloth(o.wood || WOODS[q]), fm = q > 1 ? fit : st, r0 = stream('haft' + form + q, 'w'), big = see(S, hw * 1.4), T = L;
  // ---- the haft: a crude one keeps its bend and its knots; a good one is straight, shod at the butt, bound where the hands go
  const kink = q === 0 ? hw * .4 : 0, sw = pole ? 1 : 1.22;
  const shaft = form === 'club' ? [[0, -hw * .9], [L * .5, -hw * 1.1 + kink], [L * .84, -hw * 2.1], [L * .97, -hw * 1.9], [L, -hw], [L, hw], [L * .97, hw * 1.9], [L * .84, hw * 2.1], [L * .5, hw * 1.1 + kink], [0, hw * .9]]
    : form === 'lance' ? [[0, -hw * .8], [L * .1, -hw * 1.5], [L * .27, -hw * 1.75], [L * .29, -hw * 1.05], [L * .36, -hw * 1.05], [L * .38, -hw * 1.7], [L, -hw * .62], [L, hw * .62], [L * .38, hw * 1.7], [L * .36, hw * 1.05], [L * .29, hw * 1.05], [L * .27, hw * 1.75], [L * .1, hw * 1.5], [0, hw * .8]]
    : [[0, -hw * sw], [L * .12, -hw], [L * .5, -hw + kink], [L, -hw * .92], [L, hw * .92], [L * .5, hw + kink], [L * .12, hw], [0, hw * sw]];
  part(S, F, shaft, wd, { k: form === 'club' ? .8 : form === 'lance' ? .5 : [.4, .5, .8, .1, .1, .8, .5, .4], in: () => {
    if (!big) return;
    let g = ''; for (let i = 0; i < 4; i++) { const v = (r0() - .5) * hw * 1.4, u = L * (.05 + r0() * .5); g += seg(F, [u, v], [u + L * (.14 + r0() * .25), v + (r0() - .5) * 3]); } S.stroke(g, wd.k, .6, { op: .32 });
    if (q === 0) for (let i = 0; i < 3; i++) S.fill(ell(F.W(L * (.2 + r0() * .6), (r0() - .5) * hw), hw * .34, hw * .2, F.a), wd.k, { op: .5 });       // knots
    if (form === 'club') studs(S, F, [[L * .8, -hw], [L * .88, hw * .6], [L * .92, -hw * .9], [L * .84, hw * 1.2], [L * .76, hw * .3], [L * .94, hw * .2]].slice(0, q === 0 ? 0 : 6), hw * .26, fm);
  } });
  const ring = (u, len2, m = fm, k = 1.1) => part(S, F, [[u, -hw * k], [u + len2, -hw * k], [u + len2, hw * k], [u, hw * k]], m, { k: .15 });
  if (form !== 'club' || q > 1) {
    // where the hands go: leather, wire over dyed leather on a masterwork
    const grips = pole ? [[L * .26, L * .34], [L * .5, L * .58]] : [[L * .05, L * .3]];
    if (q > 1 && form !== 'lance') for (const [u0, u1] of grips) { const lea = cloth(LEATHERS[r][q]); part(S, F, [[u0, -hw * 1.1], [u1, -hw * 1.1], [u1, hw * 1.1], [u0, hw * 1.1]], lea, { k: .2, in: () => { if (!big) return; let d = ''; const n = Math.round((u1 - u0) / (hw * .7)); for (let i = 1; i < n; i++) { const u = u0 + (u1 - u0) * i / n; d += seg(F, [u - hw * .3, -hw * 1.2], [u + hw * .3, hw * 1.2]); } S.stroke(d, q > 2 ? fit.l : lea.k, .7, { op: q > 2 ? .9 : .5 }); } }); if (q > 2 && big) { ring(u0 - 6, 6, fit, 1.2); ring(u1, 6, fit, 1.2); } }
    // the butt: shod in iron, spiked on a pole arm
    if (q > 0 && form !== 'club') { if (pole && q > 1 && form !== 'staff') part(S, F, [[hw * 2.4, -hw * 1.12], [0, -hw * 1.05], [-70, 0], [0, hw * 1.05], [hw * 2.4, hw * 1.12]], fm, { k: [.1, .4, .1, .4, .1] }); else ring(-2, hw * 1.7, fm, sw * 1.08); }
    if (q > 1 && !pole && big) { const p = F.W(hw * 3.4, 0); S.fill(ell(p, hw * .3, hw * .3), wd.k, { op: .8 }); const l2 = spl(F.P([[hw * 3.4, 0], [-30, hw * 2.4], [-70, hw * .6], [-34, -hw * 1.6], [hw * 3.4, 0]])); S.stroke(l2, cloth('dark').k, 2.6); S.stroke(l2, cloth('tan').b, 1.3); }   // a wrist loop
  }
  const langets = (ll, w2 = 3.6) => { if (!big) return; for (const sg of [-1, 1]) part(S, F, [[T - ll, sg * (hw - 2.4)], [T + 4, sg * (hw - 2.4)], [T + 4, sg * (hw + w2)], [T - ll, sg * (hw + w2)]], st, { k: .2, flat: 1 }); studs(S, F, [.2, .5, .8].map(t => [T - ll * t, 0]), hw * .2, st); };
  const lash = (u0, u1) => { let d = ''; for (let u = u0; u < u1; u += hw * .5) d += seg(F, [u, -hw * 1.16], [u + hw * .3, hw * 1.16]); S.stroke(d, cloth('hemp').k, 3.4, { units: 1 }); S.stroke(d, cloth('hemp').b, 2.2, { units: 1 }); };
  const E = (pts, m, oo = {}) => head(S, F, pts.map(p => [T + p[0], p[1]]), m, { q, ...oo, mid: oo.mid ? oo.mid.map(p => [T + p[0], p[1]]) : null, bev: oo.bev ? oo.bev.map(p => [T + p[0], p[1]]) : null });
  const tassel = (u) => { if (q < 3 || !big) return; const dye = cloth(o.pennon || 'crimson'); part(S, F, [[T + u, -hw * 1.1], [T + u - 70, -hw * 2.3], [T + u - 78, 0], [T + u - 70, hw * 2.3], [T + u, hw * 1.1]], dye, { k: [.2, .5, .8, .5, .2], in: () => { let d = ''; for (let i = -3; i <= 3; i++) d += seg(F, [T + u - 4, i * hw * .3], [T + u - 74, i * hw * .68]); S.stroke(d, dye.k, .6, { op: .5 }); } }); ring(T + u - 4, 8, fit, 1.2); };
  // ---- the head
  if (form === 'axe' || form === 'hand' || form === 'great') {
    const z = form === 'hand' ? .66 : 1, gr = form === 'great', B = (gr ? [[-12, hw], [44, hw + 44], [116, 152], [8, 192], [-124, 182], [-218, 140], [-142, 66], [-106, hw]] : [[-8, hw], [14, hw + 30], [38, 104], [-36, 120], [-116, 106], [-156, 90], [-116, 48], [-82, hw]]).map(p => [p[0] * z, p[1] === hw ? hw : p[1] * z]);
    const inset = B.slice(2, 6).reverse().map((p, i) => [p[0] + (i < 2 ? 12 : -2) * z, p[1] - (gr ? 20 : 15) * z]);
    if (q > 1 && form !== 'hand') { tassel(-96 * z - 20); langets(gr ? 300 : 190); }
    E(B, st, { k: [.2, .6, .2, .85, .85, .15, .7, .2], from: hw, to: 130 * z, bev: [...B.slice(2, 6), ...inset], in: () => {
      if (q < 2) S.stroke(spl(F.P(inset.map((p, i) => [T + p[0] + (i % 2 ? 4 : -4) * z, p[1] - 12 * z]))), st.d, .9, { op: .5 });                         // where the steel edge was welded to the iron
      else { S.stroke(spl(F.P(inset.map(p => [T + p[0], p[1] - 5 * z]))), fit.l, .9, { op: .9 }); if (q > 2) scrolls(S, [F.W(T + (gr ? -100 : -84) * z, 56 * z), F.W(T + (gr ? 30 : 0) * z, 70 * z)], 9 * z, fit.k, .8); }
      if (q === 0) for (const t of [.25, .6]) { const p = mix(B[3], B[4], t); S.fill(polyline(F.P([[T + p[0] - 8, p[1] + 3], [T + p[0], p[1] - 9], [T + p[0] + 8, p[1] + 3]]), true), st.k, { op: .8 }); }
    } });
    if (q === 0) lash(T - 96 * z, T - 4); else {
      part(S, F, [[T - 90 * z, -hw - 5], [T - 2, -hw - 5], [T - 2, hw + 5], [T - 90 * z, hw + 5]], st, { k: .2 });                                         // the eye
      if (q > 1) part(S, F, [[T - 70 * z, -hw - 4], [T - 48 * z, -hw - 66 * z], [T - 26 * z, -hw - 4]], st, { k: [.2, .05, .2], flat: 1 }); else part(S, F, [[T - 76 * z, -hw - 4], [T - 76 * z, -hw - 19], [T - 16 * z, -hw - 19], [T - 16 * z, -hw - 4]], st, { k: .3, flat: 1 });   // a spike behind, or a plain poll
    }
  } else if (form === 'cleaver') {
    E([[40, hw], [56, 150], [-150, 176], [-250, 128], [-262, 60], [-220, hw]], st, { k: [.2, .3, .5, .7, .5, .2], from: hw, to: 170, bev: [[56, 150], [-150, 176], [-250, 128], [-236, 116], [-146, 158], [44, 134]], in: () => { if (!big) return; S.both(ell(F.W(T + 6, 110), 13, 13), wd.k, st.k, .8);
      if (q > 1) S.stroke(seg(F, [T - 206, hw + 17], [T + 38, hw + 17]), st.d, 1, { op: .7 }); if (q > 2) scrolls(S, [F.W(T - 196, 62), F.W(T - 50, 70)], 9, fit.k, .8); } });
    if (q === 0) lash(T - 200, T + 30); else { ring(T - 216, 22, st, 1.25); ring(T + 10, 22, st, 1.25); }
  } else if (form === 'mace') {
    if (q > 0) { ring(T - 150, 160, st, .82); if (q > 1) langets(120, 3); }
    if (q === 0) { const c = F.W(T - 44, 0); S.both(ell(c, 40, 37), st.b, st.k, 1.05); if (big) { S.fill(ell(add(c, mul(LIGHT, 12)), 16, 12), st.l, { op: .6 }); studs(S, F, [[T - 70, -20], [T - 44, -30], [T - 18, -18], [T - 66, 16], [T - 36, 6], [T - 16, 24], [T - 46, 30]], 6.5, st); } lash(T - 130, T - 84); }
    else { for (const sg of [-1, 1]) E([[-132, sg * hw * .8], [-118, sg * 36], [-88, sg * 54], [-40, sg * 44], [-10, sg * hw * .8]], st, { k: [.2, .3, .2, .4, .2], from: 0, to: sg * 54, in: () => { S.stroke(seg(F, [T - 120, sg * 20], [T - 86, sg * 30]) + seg(F, [T - 86, sg * 30], [T - 22, sg * 22]), st.k, .9, { op: .6 }); if (q > 2) S.fill(ell(F.W(T - 80, sg * 40), 5, 5), st.k, { op: .85 }); } });
      part(S, F, [[T - 126, -4.5], [T - 12, -4.5], [T - 12, 4.5], [T - 126, 4.5]], st, { k: .3, flat: 1, in: () => S.fill(polyline(F.P([[T - 126, -4.5], [T - 12, -4.5], [T - 12, 0], [T - 126, 0]]), true), st.hi, { op: .8 }) });
      part(S, F, q > 2 ? [[T - 6, -9], [T + 10, -11], [T + 44, 0], [T + 10, 11], [T - 6, 9]] : [[T - 6, -9], [T + 10, -11], [T + 22, 0], [T + 10, 11], [T - 6, 9]], q > 1 ? fit : st, { k: [.2, .7, .3, .7, .2] });
      if (q > 1) { ring(T - 146, 9, fit, 1.05); ring(T - 16, 7, fit, 1); } }
  } else if (form === 'star' || form === 'flail') {
    let c = [T - 46, 0];
    if (form === 'flail') { const gu = F0.x[1], gv = (o.flip ? -1 : 1) * F0.y[1], n2 = Math.hypot(.5 + gu * .8, gv * .8) || 1, du = (.5 + gu * .8) / n2, dv = gv * .8 / n2; ring(T - 14, 18, fm, 1.2);
      let p = [T + 10, 0]; for (let i = 0; i < 5; i++) { const q2 = [p[0] + du * 26, p[1] + dv * 26]; if (big) { const pa = F.W(p[0], p[1]), pb = F.W(q2[0], q2[1]), e = ell(mix(pa, pb, .5), i % 2 ? 15 : 6, i % 2 ? 6 : 15, Math.atan2(pb[1] - pa[1], pb[0] - pa[0]) + Math.PI / 2); S.stroke(e, st.k, 4.4); S.stroke(e, st.l, 2); } p = q2; } c = [p[0] + du * 30, p[1] + dv * 30]; if (!big) S.stroke(seg(F, [T + 10, 0], c), st.k, 2); }
    else if (q > 0) { ring(T - 120, 120, st, 1.16); if (q > 1) langets(150); } else lash(T - 120, T - 84);
    const R0 = form === 'flail' ? 34 : 42, cc = F.W(c[0], c[1]), n3 = 8; let sp = '';
    for (let i = 0; i < n3; i++) { const an = i / n3 * Math.PI * 2 + .2, ca = Math.cos(an), sa = Math.sin(an), w2 = q === 0 ? 4 : 8, len2 = R0 * (q === 0 ? 1.5 : 1.75); sp += polyline(F.P([[c[0] + ca * R0 * .8 - sa * w2, c[1] + sa * R0 * .8 + ca * w2], [c[0] + ca * len2, c[1] + sa * len2], [c[0] + ca * R0 * .8 + sa * w2, c[1] + sa * R0 * .8 - ca * w2]]), true); }
    S.both(sp, st.l, st.k, .9); const ball = q === 0 && form === 'star' ? cloth(WOODS[2]) : st;
    S.both(ell(cc, R0, R0), big ? S.radial(add(cc, mul(LIGHT, R0 * .4)), R0 * 1.5, [[0, ball.hi || ball.l], [.25, ball.l], [.55, ball.b], [1, ball.d || ball.s]]) : ball.b, ball.k, 1.05);
    if (big) { studs(S, F, [[c[0] - 12, c[1] - 14], [c[0] + 14, c[1] - 6], [c[0] - 4, c[1] + 14]], q === 0 ? 4 : 6, st); if (q > 1) { const e = ell(cc, R0 * .98, R0 * .3, F.a); S.stroke(e, fit.k, 3.6); S.stroke(e, fit.b, 2); } }
  } else if (form === 'hammer' || form === 'pick') {
    const pk = form === 'pick';
    if (q > 0) langets(pk ? 150 : 190); else lash(T - 110, T - 80);
    E(pk ? [[-20, hw + 3], [-30, hw + 66], [-70, hw + 178], [-72, hw + 70], [-74, hw + 3]] : [[-22, -hw - 3], [-30, -hw - 50], [-60, -hw - 120], [-66, -hw - 52], [-76, -hw - 3]], st, { k: [.2, .7, .05, .7, .2], mid: pk ? [[-48, hw], [-70, hw + 176]] : [[-48, -hw], [-60, -hw - 118]] });       // the beak
    const sg = pk ? -1 : 1, hf = pk ? .7 : 1;                                                                                                              // the hammer's face
    part(S, F, [[T - 80, sg * (hw + 3)], [T - 80, sg * (hw + 40 * hf)], [T - 73, sg * (hw + 52 * hf)], [T - 23, sg * (hw + 52 * hf)], [T - 16, sg * (hw + 40 * hf)], [T - 16, sg * (hw + 3)]], st, { k: .16, al: 1, in: () => { if (big && q > 1) S.stroke(seg(F, [T - 76, sg * (hw + 40 * hf)], [T - 20, sg * (hw + 40 * hf)]), q > 2 ? fit.l : st.k, 1, { op: .8 }); } });
    if (q > 2 && !pk) for (const u of [-70, -57, -44, -31]) part(S, F, [[T + u - 5, sg * (hw + 51)], [T + u, sg * (hw + 66)], [T + u + 5, sg * (hw + 51)]], st, { k: .1, flat: 1 });                 // a face cut to four points
    part(S, F, [[T - 96, -hw - 4.5], [T + 4, -hw - 4.5], [T + 4, hw + 4.5], [T - 96, hw + 4.5]], st, { k: .16, in: () => { if (M.scroll && big) scrolls(S, [F.W(T - 86, 0), F.W(T - 6, 0)], 7, fit.l, .9); } });
    if (q > 0) part(S, F, [[T + 2, -8], [T + (q > 1 ? 70 : 44), 0], [T + 2, 8]], st, { k: [.2, .05, .2], flat: 1 });
    if (q > 1) { ring(T - 104, 8, fit, 1.36); ring(T - 2, 6, fit, .9); }
  } else if (form === 'maul') {
    const hm = q > 1 ? st : cloth(WOODS[2]);
    part(S, F, [[T - 176, -80], [T - 14, -80], [T - 6, -70], [T - 6, 70], [T - 14, 80], [T - 176, 80], [T - 184, 70], [T - 184, -70]], hm, { k: .14, al: q > 1, in: () => { if (!big) return; if (q < 2) { let d = ''; for (const v of [-50, -20, 12, 44]) d += seg(F, [T - 180, v], [T - 10, v + 4]); S.stroke(d, hm.k, .6, { op: .35 }); } } });
    for (const sg of [-1, 1]) part(S, F, [[T - 186, sg * 50], [T - 4, sg * 50], [T - 4, sg * 72], [T - 186, sg * 72]], q > 2 ? fit : q === 0 ? dull(metal('iron')) : st, { k: .1, flat: q < 1 });
    part(S, F, [[T - 6, -hw * .9], [T + 14, -hw * .8], [T + 14, hw * .8], [T - 6, hw * .9]], wd, { k: .2, flat: 1 });
  } else if (form === 'club') {
    if (q > 1) { ring(L * .74, 16, fm, 2.1); ring(L * .9, 16, fm, 2.05); part(S, F, [[T - 4, -9], [T + 70, 0], [T - 4, 9]], fm, { k: [.2, .05, .2], flat: 1 }); }
  } else if (form !== 'staff') {
    // ---- spears and pole arms: a socket, and a blade that carries on from the haft
    const sock = (len2 = 74, tip2 = 40) => { part(S, F, [[T - len2, -hw - 1.6], [T + tip2, -9], [T + tip2, 9], [T - len2, hw + 1.6]], st, { k: .15 }); studs(S, F, [[T - len2 * .5, 0]], hw * .22, st); if (q > 1) { ring(T - len2 - 4, 8, fit, 1.2); ring(T + tip2 - 6, 7, fit, .78); } };
    const bevOf = (pts, k = .8) => [...pts, ...pts.slice().reverse().map(p => [p[0], p[1] * k])];
    if (form === 'spear' || form === 'boar' || form === 'pike' || form === 'lance') {
      const Lb = form === 'boar' ? 300 : form === 'pike' ? 170 : form === 'lance' ? 150 : (o.st === 'desert' ? 330 : 250), wb = form === 'boar' ? 47 : form === 'pike' ? 15 : form === 'lance' ? 17 : o.st === 'desert' ? 22 : 30, u0 = 36;
      if (form === 'pike') langets(430, 3); else if (q > 1 && form !== 'lance') langets(170, 3);
      tassel(-80);
      if (o.pennon && form === 'lance' && q > 0) { const pm = cloth(o.pennon); part(S, F, [[T - 30, hw], [T - 20, 190], [T - 90, 120], [T - 150, 196], [T - 170, hw]], pm, { k: [0, .2, .4, .2, 0], flat: 1, in: () => S.fill(polyline(F.P([[T - 30, 60], [T - 170, 60], [T - 170, 100], [T - 30, 100]]), true), pm.s, { op: .5 }) }); }
      if (form === 'lance' && q > 1) part(S, F, [[L * .385, -24], [L * .398, -70], [L * .404, -70], [L * .404, 70], [L * .398, 70], [L * .385, 24]], st, { k: .2, al: 1 });                                 // the vamplate
      sock(form === 'lance' ? 60 : 78);
      if (form === 'boar' || (form === 'spear' && q > 0 && (o.st || 'north') === 'north')) for (const sg of [-1, 1]) part(S, F, form === 'boar' ? [[T + 2, sg * 9], [T + 6, sg * 62], [T + 22, sg * 62], [T + 28, sg * 9]] : [[T + 4, sg * 9], [T + 12, sg * 40], [T + 30, sg * 9]], st, { k: form === 'boar' ? .3 : [.2, .1, .2], flat: 1 });   // the lugs
      const ed = [[u0, -9], [u0 + Lb * .16, -wb], [u0 + Lb * .46, -wb * .88], [u0 + Lb, 0]];
      E([...ed, ...ed.slice(0, 3).reverse().map(p => [p[0], -p[1]])], st, { k: [.2, .7, .8, .05, .8, .7, .2], mid: [[u0, 0], [u0 + Lb, 0]], bev: q > 0 ? [...bevOf(ed, .76), ...bevOf(ed, .76).map(p => [p[0], -p[1]])] : null });
    } else if (form === 'glaive') {
      if (q > 0) langets(200, 3); tassel(-84); sock(80, 30);
      const back = [[26, -12], [90, -17], [340, -30], [470, -6]], edge = [[430, 36], [290, 62], [110, 58], [34, 34], [26, 12]];
      if (q > 0) part(S, F, [[T + 150, -20], [T + 186, -66], [T + 214, -23]], st, { k: [.2, .05, .2], flat: 1 });
      E([...back, ...edge], st, { k: [.2, .7, .8, .05, .7, .8, .8, .6, .2], mid: [[26, -4], [460, -8]], bev: [[470, -6], ...edge.slice(0, 4), [44, 22], [110, 44], [290, 48], [424, 26]] });
    } else if (form === 'halberd') {
      langets(q > 1 ? 420 : 240); tassel(-90);
      E([[40, -10], [140, -13], [430, 0], [140, 13], [40, 10]], st, { k: [.2, .6, .05, .6, .2], mid: [[40, 0], [430, 0]] });                                               // the spike
      E([[-10, -hw], [8, -70], [-34, -126], [-22, -66], [-52, -hw]], st, { k: [.2, .7, .05, .7, .2], from: -hw, to: -120 });                                              // the fluke behind
      const B = [[22, hw], [36, 58], [88, 134], [-6, 118], [-104, 140], [-60, 60], [-58, hw]];
      E(B, st, { k: [.2, .6, .15, .7, .15, .6, .2], from: hw, to: 140, bev: [B[2], B[3], B[4], [-92, 122], [-6, 102], [76, 116]], in: () => { if (!big) return; if (q > 2) scrolls(S, [F.W(T - 50, 98), F.W(T + 40, 102)], 8, fit.k, .8);
        if (q > 1) S.fill(dotsAt(F, [[T - 6, 50], [T - 17, 68], [T + 5, 68]], 6), st.k, { op: .75 }); else if (q > 0) S.fill(ell(F.W(T - 6, 62), 7, 7), st.k, { op: .7 }); } });
      part(S, F, [[T - 66, -hw - 4], [T + 44, -hw - 2], [T + 44, hw + 2], [T - 66, hw + 4]], st, { k: .16 });
    } else if (form === 'bill') {
      if (q > 0) langets(260); else lash(T - 120, T - 20);
      // a broad blade whose top curls forward into a hook, a spike above it and another behind
      const B = [[-30, hw], [10, 46], [150, 54], [234, 62], [262, 112], [246, 152], [302, 124], [324, 62], [318, 20], [446, -2], [300, -16], [190, -18], [176, -80], [150, -18], [-30, -hw]];
      E(B, st, { k: [.2, .6, .8, .5, .8, .05, .8, .8, .5, .05, .6, .3, .05, .3, .2], from: -hw, to: 120, bev: [[10, 46], [150, 54], [234, 62], [262, 112], [246, 152], [252, 112], [226, 74], [150, 43], [14, 35]], in: () => {
        if (!big || q < 2) return; const c = [T + 40, 14]; S.stroke(ell(F.W(c[0], c[1]), 6, 6) + seg(F, [c[0] - 10, c[1]], [c[0] + 10, c[1]]) + seg(F, [c[0], c[1] - 10], [c[0], c[1] + 10]), q > 2 ? fit.l : st.k, .9, { op: .85 });
        if (q > 2) scrolls(S, [F.W(T + 70, 16), F.W(T + 220, 22)], 8, fit.k, .8); } });
      part(S, F, [[T - 70, -hw - 3.5], [T - 20, -hw - 2.5], [T - 20, hw + 2.5], [T - 70, hw + 3.5]], st, { k: .16 });
      if (q > 1) ring(T - 80, 8, fit, 1.3);
    } else if (form === 'poleaxe') {
      langets(520); if (q > 1) part(S, F, [[T - 560, -44], [T - 548, -44], [T - 548, 44], [T - 560, 44]], st, { k: .4, al: 1 });                                         // the rondel that guards the hand
      E([[100, -9], [330, 0], [100, 9]], st, { k: [.2, .05, .2], mid: [[100, 0], [330, 0]] });
      const B = [[96, -hw], [120, -70], [152, -134], [60, -120], [-30, -134], [0, -70], [22, -hw]];
      E(B, st, { k: [.2, .6, .15, .7, .15, .6, .2], from: -hw, to: -134, bev: [B[2], B[3], B[4], [-18, -118], [60, -104], [140, -118]] });
      part(S, F, [[T + 30, hw + 2], [T + 30, hw + 48], [T + 38, hw + 58], [T + 84, hw + 58], [T + 92, hw + 48], [T + 92, hw + 2]], st, { k: .16, al: 1 });
      if (q > 1) for (const u of [40, 54, 68, 82]) part(S, F, [[T + u - 5, hw + 57], [T + u, hw + 70], [T + u + 5, hw + 57]], st, { k: .1, flat: 1 });
      part(S, F, [[T - 16, -hw - 4.5], [T + 112, -hw - 4.5], [T + 112, hw + 4.5], [T - 16, hw + 4.5]], st, { k: .16, in: () => { if (M.scroll && big) scrolls(S, [F.W(T, 0), F.W(T + 100, 0)], 7, fit.l, .9); } });
      if (q > 1) { ring(T - 24, 8, fit, 1.36); ring(T + 110, 7, fit, 1.1); }
    } else if (form === 'partisan') {
      if (q > 0) langets(200, 3); tassel(-84); sock(80, 30);
      for (const sg of [-1, 1]) part(S, F, [[T + 26, sg * 12], [T + 40, sg * 84], [T + 96, sg * 100], [T + 70, sg * 60], [T + 60, sg * 26]], st, { k: [.2, .7, .05, .7, .3], flat: 1 });
      const ed = [[26, -12], [56, -52], [100, -58], [400, 0]];
      E([...ed, ...ed.slice(0, 3).reverse().map(p => [p[0], -p[1]])], st, { k: [.2, .7, .8, .05, .8, .7, .2], mid: [[26, 0], [400, 0]], bev: [...bevOf(ed, .8), ...bevOf(ed, .8).map(p => [p[0], -p[1]])], in: () => { if (q > 2) scrolls(S, [F.W(T + 60, 0), F.W(T + 230, 0)], 9, fit.k, .8); } });
    }
  }
}

// ---------------------------------------------------------------- bows, quivers, crossbows ---------------------------
// A BOW, strung. G: the middle of its grip; a: the way its upper limb points; L: nock to nock. Its belly and its string
// lie toward −v (o.flip: toward +v). o.form: self (a plain stave), long (yew, heartwood and sapwood), recurve (horn,
// wood and sinew, bound in bark, with ears)
export const BOW_LEN = { self: 1500, long: 1880, recurve: 1280 };
const RECURVE = [[0, 0], [.1, -.012], [.24, -.066], [.36, -.118], [.42, -.13], [.46, -.118], [.5, -.07]];        // (u, v) / L: grip to nock
export function bowArt(S, G, a, L, q = 1, o = {}) {
  const form = BOW_LEN[o.form] ? o.form : 'long', M = mats({ q, r: o.r }), { fit, r } = M, F0 = frame(G, a), rec = form === 'recurve';
  const F = o.flip ? { ...F0, W: (u, v = 0) => F0.W(u, -v), P: pts => pts.map(p => F0.W(p[0], -p[1])), lit: -F0.lit } : F0;
  if (gone(S, F, -L * .52, L * .52, L * .16)) return;
  const sag = L * .085, h0 = rec ? 15 : form === 'long' ? 15.5 : 13, big = see(S, h0 * 1.3), n = 12, C = [];
  for (let i = -n; i <= n; i++) { const t = i / n * .5, at = Math.abs(t); let v;
    if (rec) { let k = 1; while (k < RECURVE.length - 1 && RECURVE[k][0] < at) k++; const p0 = RECURVE[k - 1], p1 = RECURVE[k]; v = lerp(p0[1], p1[1], clamp((at - p0[0]) / (p1[0] - p0[0]))) * L; } else v = -sag * (2 * t) ** 2;
    C.push([t * L, v, lerp(h0, h0 * .42, (at * 2) ** 1.2)]); }
  const side = k => C.map(p => [p[0], p[1] + k * p[2]]), nock = [C[0], C[C.length - 1]];
  const wood = cloth(form === 'long' ? '#a2512a' : rec ? '#3b2c22' : q === 0 ? '#a58f66' : '#b08d5a'), back = cloth(form === 'long' ? '#e3c995' : rec ? '#b89a6a' : '#000000');
  // the string, behind the stave: hemp on a crude bow, linen, then silk served in colour. o.only: 'stave' or 'string',
  // for a bow slung on the back, whose string crosses the chest in front of the body
  if (o.only !== 'stave') { const a2 = [nock[0][0] + 8, nock[0][1] - nock[0][2] * .5], b2 = [nock[1][0] - 8, nock[1][1] - nock[1][2] * .5], sp = rec ? [a2, [-.42 * L, -.13 * L - 12], [.42 * L, -.13 * L - 12], b2] : [a2, b2], d = polyline(F.P(sp)), sc = cloth(q === 0 ? 'hemp' : 'linen');
    S.stroke(d, sc.k, Math.max(1.6, 3.4 * S.px)); S.stroke(d, sc.b, Math.max(.8, 2 * S.px));
    if (q > 0 && big) { const m0 = sp[rec ? 1 : 0], m1 = sp[rec ? 2 : 1], sv = polyline(F.P([mix(m0, m1, .46), mix(m0, m1, .55)])); S.stroke(sv, cloth(q > 2 ? 'crimson' : q > 1 ? 'forest' : 'dark').b, Math.max(1.4, 3.6 * S.px)); } }
  if (o.only === 'string') return;
  // the stave
  const d = polyline(F.P([...side(-1), ...side(1).reverse()]), true); if (S.cut(d)) return;
  S.both(d, wood.b, wood.k, 1.05);
  if (big) S.within(d, () => {
    if (form !== 'self') S.fill(polyline(F.P([...side(.3), ...side(1.1).reverse()]), true), back.b);                                  // the sapwood left on the back, or the sinew laid on it
    const lite = F.lit < 0 ? -1 : 1;
    S.stroke(polyline(F.P(side(lite * .5))), wood.l, h0 * .34, { units: 1, op: .6, cap: 'butt' }); S.stroke(polyline(F.P(side(-lite * .7))), wood.s, h0 * .5, { units: 1, op: .55, cap: 'butt' });
    if (q === 0) for (const t of [-.3, .14, .36]) S.fill(ell(F.W(t * L, -sag * (2 * t) ** 2), h0 * .9, h0 * .5, F0.a), wood.k, { op: .4 });        // knots and bark left on
    if (rec) { let w2 = ''; for (const t of [-.4, -.3, -.2, -.13, .13, .2, .3, .4]) { const i = Math.round((t + .5) * 2 * n), p = C[i]; w2 += seg(F, [p[0] - 9, p[1] - p[2] * 1.1], [p[0] - 9, p[1] + p[2] * 1.1]) + seg(F, [p[0] + 9, p[1] - p[2] * 1.1], [p[0] + 9, p[1] + p[2] * 1.1]); } S.stroke(w2, q > 1 ? fit.b : cloth('tan').b, 2.2, { units: 1, op: .9 });   // bark and sinew bindings
      if (q > 1) { let z = ''; for (const sg of [-1, 1]) for (let t = .15; t < .29; t += .02) { const i = Math.round((sg * t + .5) * 2 * n), p = C[i]; z += polyline(F.P([[p[0] - 8, p[1] - 5], [p[0], p[1] + 5], [p[0] + 8, p[1] - 5]])); } S.stroke(z, cloth(q > 2 ? 'crimson' : 'ochre').b, 1.3, { units: 1, op: .9 }); } }
    if (q > 2 && !rec) S.stroke(polyline(F.P(side(.62))), fit.l, .9, { op: .8 });                                                     // a line of inlay down the back
  });
  S.stroke(d, wood.k, 1.05);
  // the grip, the arrow's pass, the nocks
  const gh = h0 * 1.12, gl = rec ? L * .055 : L * .04;
  if (q > 0) part(S, F, [[-gl, -gh], [gl, -gh], [gl, gh], [-gl, gh]], cloth(LEATHERS[r][q]), { k: .3, in: () => { if (!big) return; let w2 = ''; for (let u = -gl + 5; u < gl; u += q > 1 ? 5 : 9) w2 += seg(F, [u, -gh * 1.1], [u + 3, gh * 1.1]); S.stroke(w2, q > 2 ? fit.l : cloth(LEATHERS[r][q]).k, .7, { op: q > 2 ? .9 : .5 }); } });
  else if (big) { let w2 = ''; for (let u = -gl; u < gl; u += 7) w2 += seg(F, [u, -gh], [u + 4, gh]); S.stroke(w2, cloth('hemp').b, 2.2, { units: 1 }); }
  if (q > 1 && big) { part(S, F, [[gl + 4, -gh * .95], [gl + 34, -gh * .9], [gl + 34, -gh * .2], [gl + 4, -gh * .25]], BONE, { k: .3, flat: 1 }); for (const u of [-gl - 5, gl + (q > 2 ? 38 : 0)]) if (q > 2) part(S, F, [[u, -gh * 1.02], [u + 5, -gh * 1.02], [u + 5, gh * 1.02], [u, gh * 1.02]], fit, { k: .2 }); }
  for (const sg of [-1, 1]) { const p = sg < 0 ? C[0] : C[C.length - 1], p1 = sg < 0 ? C[1] : C[C.length - 2], T = norm(sub([p[0], p[1]], [p1[0], p1[1]])), N = [-T[1], T[0]], at = (x, y) => [p[0] + T[0] * x + N[0] * y, p[1] + T[1] * x + N[1] * y], w2 = p[2];
    if (q > 0) part(S, F, [at(-22, -w2 * 1.1), at(4, -w2 * .95), at(22, -w2 * .2), at(22, w2 * .2), at(4, w2 * .95), at(-22, w2 * 1.1)], q > 1 || rec ? BONE : HORN, { k: [.2, .6, .6, .6, .6, .2], flat: !big });
    if (big) S.stroke(seg(F, at(q > 0 ? 4 : -8, -w2 * 1.2), at(q > 0 ? 2 : -10, w2 * .3)), '#1c120a', 1.6, { units: 1 });
    if (q > 2 && big) part(S, F, [at(-30, -w2 * 1.16), at(-23, -w2 * 1.16), at(-23, w2 * 1.16), at(-30, w2 * 1.16)], fit, { k: .2 }); }
}
// A QUIVER with its arrows. G: its foot; a: the way its mouth points; L: its length
export function quiverArt(S, G, a, L, q = 1, o = {}) {
  const M = mats({ q, r: o.r }), { fit, r } = M, F = frame(G, a), w0 = L * .075, w1 = L * (q === 0 ? .12 : .1);
  if (gone(S, F, -20, L * 1.4, L * .2)) return;
  const lea = cloth(q === 0 ? 'hemp' : o.leather || LEATHERS[r][q]), big = see(S, w0), n = [4, 5, 7, 8][q], fl = [['#8f8a80', '#6f6a60'], ['#b9b4a8', '#e6e2d8'], ['#efece4', '#d9d5cc'], ['#a02a2e', '#efece4']][q];
  // the arrows: shafts, three vanes to each, a nock
  for (let i = 0; i < n; i++) { const k = n === 1 ? 0 : (i / (n - 1)) * 2 - 1, v0 = k * (w1 - 9), up = L * (.24 + .08 * (1 - Math.abs(k)) + .03 * ((i * 7) % 3 - 1)), sl = k * L * .05, p0 = [L - 10, v0], p1 = [L + up, v0 + sl];
    S.stroke(seg(F, p0, p1), '#4a3a1c', Math.max(1.2, 5 * S.px)); S.stroke(seg(F, p0, p1), '#d8c7a0', Math.max(.6, 3.4 * S.px));
    const T = norm(sub(p1, p0)), N = [-T[1], T[0]], at = (x, y) => [p0[0] + T[0] * x + N[0] * y, p0[1] + T[1] * x + N[1] * y], f0 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) - L * .2, fh = L * .022, fL = L * .17;
    for (const sg of [-1, 1]) S.both(poly(F.P([at(f0, sg * 1), at(f0 + fL * .16, sg * fh), at(f0 + fL * .9, sg * fh * .9), at(f0 + fL, sg * 1)]), [.1, .7, .6, .1]), fl[(i + (sg > 0 ? 1 : 0)) % 2], '#4c4032', .7); }
  // the body: a rawhide bag, or stitched leather with what the make gives it
  part(S, F, [[0, -w0], [L * .5, -lerp(w0, w1, .55)], [L, -w1], [L, w1], [L * .5, lerp(w0, w1, .55)], [0, w0], [-L * .03, 0]], lea, { k: [.5, .9, .15, .15, .9, .5, .9], in: () => {
    if (!big) return;
    if (q === 0) { let d = ''; for (const t of [.2, .5, .8]) d += seg(F, [L * t, -w1 * 1.1], [L * t + 8, w1 * 1.1]); S.stroke(d, lea.k, 1.6, { op: .6 }); }
    else S.stroke(seg(F, [L * .04, -w0 * .62], [L * .97, -w1 * .66]), lea.l, .7, { op: .6, dash: '2.6 2.4' });
    if (q > 2) { let dz = ''; for (let i = 0; i < 6; i++) { const u = L * (.3 + i * .08), z = w0 * .42; dz += polyline(F.P([[u - z, 0], [u, -z], [u + z, 0], [u, z]]), true); } S.stroke(dz, fit.l, .8, { op: .85 }); }
  } });
  if (q > 0) part(S, F, [[L * .955, -w1 * 1.06], [L * 1.005, -w1 * 1.08], [L * 1.005, w1 * 1.08], [L * .955, w1 * 1.06]], q > 1 ? fit : lea, { k: .2, flat: q < 2 });
  if (q > 1) { part(S, F, [[L * .1, -w0 * 1.12], [0, -w0 * 1.04], [-L * .045, 0], [0, w0 * 1.04], [L * .1, w0 * 1.12], [L * .075, 0]], fit, { k: [.2, .6, .8, .6, .2, .8] }); part(S, F, [[L * .5, -lerp(w0, w1, .55) * 1.06], [L * .53, -lerp(w0, w1, .58) * 1.06], [L * .53, lerp(w0, w1, .58) * 1.06], [L * .5, lerp(w0, w1, .55) * 1.06]], fit, { k: .2 }); }
}
// A CROSSBOW, unspanned. G: the butt of its tiller; a: the way it points; L: butt to stirrup. Its bow lies across it.
export function crossbowArt(S, G, a, L, q = 1, o = {}) {
  const M = mats({ q, r: o.r }), { st, fit, r } = M, F = frame(G, a), hs = L * (q > 1 ? .4 : .46);
  if (gone(S, F, -20, L * 1.1, hs * 1.1)) return;
  const wd = cloth(q > 2 ? '#4a3020' : q > 1 ? '#6b4a2e' : WOODS[q]), up = L * .86, big = see(S, 20), steelBow = q > 1, pm = steelBow ? (q > 2 ? metal('blued') : st) : cloth(q === 0 ? '#9c8a62' : '#b08d5a'), dp = L * (steelBow ? .1 : .13);
  const prod = []; for (let i = 0; i <= 12; i++) { const v = lerp(-hs, hs, i / 12); prod.push([up - dp * (v / hs) ** 2, v]); }
  const pw = v => (steelBow ? 7 : 14) * (1 - .45 * Math.abs(v) / hs);
  // the cord, straight between the bow's ends
  { const d = seg(F, [prod[0][0] - 3, prod[0][1] + 6], [prod[12][0] - 3, prod[12][1] - 6]), sc = cloth(q === 0 ? 'hemp' : 'linen'); S.stroke(d, sc.k, Math.max(1.6, 4.4 * S.px)); S.stroke(d, sc.b, Math.max(.8, 2.8 * S.px)); if (q > 0 && big) S.stroke(seg(F, [up - dp - 3, -16], [up - dp - 3, 16]), cloth(q > 2 ? 'crimson' : 'dark').b, Math.max(1.4, 4.6 * S.px)); }
  // the stirrup
  if (q > 0) { const e = spl(F.P([[up + 6, -30], [L * .97, -36], [L * 1.02, 0], [L * .97, 36], [up + 6, 30]])), sm = q > 2 ? fit : st; S.stroke(e, sm.k, Math.max(2.4, 9 * S.px)); S.stroke(e, sm.b, Math.max(1.2, 5.6 * S.px)); if (big) S.stroke(e, sm.hi, 1, { op: .7 }); }
  // the bow
  const pd = part(S, F, [...prod.map(p => [p[0] + pw(p[1]), p[1]]), ...prod.slice().reverse().map(p => [p[0] - pw(p[1]), p[1]])], pm, { k: .5, al: 1, in: () => { if (!big) return; if (!steelBow) { S.stroke(polyline(F.P(prod.map(p => [p[0] + pw(p[1]) * .3, p[1]]))), pm.k, .6, { op: .3 }); if (q > 0) for (const sg of [-1, 1]) S.stroke(seg(F, [prod[sg < 0 ? 1 : 11][0] - 16, sg * hs * .86], [prod[sg < 0 ? 1 : 11][0] + 16, sg * hs * .86]), cloth('tan').b, 5, { units: 1 }); } else if (q > 2) scrolls(S, [F.W(up - 4, -hs * .5), F.W(up - 1, -hs * .14)], 5, fit.l, .9); } });
  // the tiller
  part(S, F, [[0, -19], [L * .2, -21], [L * .42, -25], [L * .6, -20], [L * .9, -16], [L * .9, 16], [L * .6, 20], [L * .42, 25], [L * .2, 21], [0, 19], [-L * .02, 0]], wd, { k: [.4, .8, .8, .8, .2, .2, .8, .8, .8, .4, .8], in: () => {
    if (!big) return;
    S.stroke(seg(F, [L * .44, 0], [L * .89, 0]), wd.k, 2.4, { units: 1, op: .6 });                                                     // the bolt's groove
    if (q > 1) { S.fill(polyline(F.P([[L * .46, -9], [L * .86, -7], [L * .86, 7], [L * .46, 9]]), true), BONE.b, { op: .95 }); S.stroke(seg(F, [L * .46, 0], [L * .86, 0]), BONE.k, 1.6, { units: 1, op: .6 }); }                       // a top plate of horn
    if (q > 2) { scrolls(S, [F.W(L * .04, 0), F.W(L * .3, 0)], 8, fit.l, .9); S.stroke(polyline(F.P([[L * .03, -14], [L * .4, -19]])) + polyline(F.P([[L * .03, 14], [L * .4, 19]])), fit.l, .8, { op: .8 }); }
    if (q === 0) for (const t of [.15, .7]) S.fill(ell(F.W(L * t, 4), 10, 6, F.a), wd.k, { op: .4 });
  } });
  // the nut, the long trigger under the tiller, the binding that holds the bow in
  if (big) { const c = F.W(L * .42, 0); S.both(ell(c, 12, 12), BONE.b, BONE.k, .9); S.stroke(polyline([F.W(L * .42, -12), F.W(L * .42, 12)]), BONE.k, 1.2, { op: .7 }); }
  if (q > 0) { const tg = polyline(F.P([[L * .4, 24], [L * .3, 36], [L * .1, 40]])); S.stroke(tg, st.k, Math.max(2, 7 * S.px)); S.stroke(tg, st.b, Math.max(1, 4 * S.px)); }
  if (big) { if (q < 2) { const b = seg(F, [up - 26, -22], [up + 14, 22]) + seg(F, [up - 26, 22], [up + 14, -22]) + seg(F, [up - 20, -22], [up - 20, 22]); S.stroke(b, cloth('hemp').k, 7, { units: 1 }); S.stroke(b, cloth('hemp').b, 5, { units: 1 }); }
    else for (const sg of [-1, 1]) part(S, F, [[up - 30, sg * 15], [up + 16, sg * 12], [up + 16, sg * 20], [up - 30, sg * 23]], q > 2 ? fit : st, { k: .2, flat: 1 }); }
  if (q > 2 && big) part(S, F, [[-L * .02, -15], [L * .03, -20.5], [L * .03, 20.5], [-L * .02, 15]], fit, { k: .3 });
}

// ---------------------------------------------------------------- shields --------------------------------------------
// A SHIELD, upright. T: the middle of its top edge; h: its height; o.form: heater, kite, round, targe, buckler, pavise;
// o.field, o.pale: its colours; o.device(S, c, size, metal): draws its charge. Returns its width.
export const SHIELD_H = { heater: 760, kite: 1080, round: 820, targe: 540, buckler: 330, pavise: 1250 };
const SHIELD_W = { heater: .68, kite: .5, round: 1, targe: 1, buckler: 1, pavise: .54 };
export function shieldArt(S, T, h, q = 1, o = {}) {
  const form = SHIELD_H[o.form] ? o.form : 'heater', M = mats({ q, r: o.r }), { st, fit, r } = M, w = h * (o.wr || SHIELD_W[form]), W = (u, v) => [T[0] + u * w / 2, T[1] + v * h];
  { const vw = S.view; if (vw && (T[0] + w / 2 < vw[0] || T[0] - w / 2 > vw[0] + vw[2] || T[1] + h < vw[1] || T[1] > vw[1] + vw[3])) return w; }
  const disc = form === 'round' || form === 'targe' || form === 'buckler', c = W(0, .5), big = see(S, w * .08), rm = q > 1 ? fit : st;
  const m = cloth(form === 'targe' ? (q > 2 ? LEATHERS[r][3] : 'brown') : o.field || 'white'), m2 = cloth(o.pale || 'blue'), bare = form === 'buckler' || (q === 0 && form !== 'targe');
  const d = disc ? ell(c, w / 2, h / 2) : form === 'kite' ? poly([W(-1, .2), W(-.72, .03), W(0, -.02), W(.72, .03), W(1, .2), W(.8, .52), W(0, 1), W(-.8, .52)], [.9, .9, .6, .9, .9, .9, .2, .9])
    : form === 'pavise' ? poly([W(-1, .05), W(-.8, 0), W(.8, 0), W(1, .05), W(.93, 1), W(-.93, 1)], [.7, .5, .5, .7, .15, .15])
    : poly([W(-1, 0), W(1, 0), W(1, .4), W(.62, .74), W(0, 1), W(-.62, .74), W(-1, .4)], [.15, .15, .8, .9, .25, .9, .8]);
  if (S.cut(d)) return w;
  const face = form === 'buckler' ? st : bare ? cloth(q === 0 ? '#9b8762' : '#a58a5c') : m;
  S.both(d, face.b, st.k, 1.2);
  S.within(d, () => {
    // its painting: parted down the middle, quartered on a round one, a broad pale down a pavise's ridge
    if (!bare && form !== 'targe') { if (form === 'round') S.fill(polyline([W(0, 0), W(1.1, 0), W(1.1, .5), W(-1.1, .5), W(-1.1, 1), W(0, 1)], true), m2.b); else if (form === 'pavise') S.fill(polyline([W(-.3, -.1), W(.3, -.1), W(.3, 1.1), W(-.3, 1.1)], true), m2.b); else S.fill(polyline([W(0, -.1), W(1.2, -.1), W(1.2, 1.1), W(0, 1.1)], true), m2.b); }
    if (big && (bare || q < 2) && form !== 'buckler') { let pl = ''; for (const u of [-.5, 0, .5]) pl += polyline([W(u, -.05), W(u + .02, 1.05)]); S.stroke(pl, face.k, .8, { op: bare ? .5 : .22 }); }                    // the planks under the paint
    if (form === 'pavise') { S.fill(polyline([W(-.24, -.1), W(0, -.1), W(0, 1.1), W(-.24, 1.1)], true), '#ffffff', { op: .16 }); S.fill(polyline([W(0, -.1), W(.24, -.1), W(.24, 1.1), W(0, 1.1)], true), '#1d1533', { op: .2 }); }
    S.fill(d, S.lin(W(-1, .3), W(1, .3), [[0, '#ffffff', .28], [.35, '#ffffff', 0], [.55, '#1d1533', 0], [1, '#1d1533', .42]]));
    if (form === 'targe' && big) { for (const k of [.82, .56]) S.stroke(ell(c, w / 2 * k, h / 2 * k), m.k, .9, { op: .6 }); const pts = []; for (let i = 0; i < 16; i++) { const a2 = i / 16 * 6.283; pts.push([c[0] + Math.cos(a2) * w * .41, c[1] + Math.sin(a2) * h * .41]); if (i % 2 === 0) pts.push([c[0] + Math.cos(a2 + .2) * w * .28, c[1] + Math.sin(a2 + .2) * h * .28]); } let sd = ''; const rr = w * .016; for (const p of pts) sd += `M${n1(p[0] - rr)} ${n1(p[1])}a${n1(rr)} ${n1(rr)} 0 1 0 ${n1(2 * rr)} 0a${n1(rr)} ${n1(rr)} 0 1 0 ${n1(-2 * rr)} 0`; S.fill(sd, rm.l); S.stroke(sd, rm.k, .6); }
    // the rim: rawhide on a crude one, iron, then bronze or gilt
    if (q === 0 && form !== 'buckler') { S.stroke(d, cloth('hemp').k, Math.max(4, w * .045) * S.px); S.stroke(d, cloth('hemp').b, Math.max(2.4, w * .03) * S.px); if (big) S.stroke(d, cloth('hemp').k, .8, { dash: '3 5', op: .7 }); }
    else { if (q > 1 && form !== 'buckler') { S.stroke(d, face.k, Math.max(9, w * .064 * S.px + 8.5), { op: .5 }); S.stroke(d, q > 2 ? fit.l : m2.l, Math.max(7.4, w * .064 * S.px + 6.6)); }                 // a painted line inside the rim
      S.stroke(d, st.k, Math.max(5, w * .064 * S.px + 3)); S.stroke(d, rm.b, Math.max(3.4, w * .064 * S.px)); S.stroke(d, rm.hi, 1.2, { op: .8 }); }
    if (q === 0 && big) { for (const p of [[-.4, .3], [.5, .55], [.1, .72]]) S.stroke(polyline([W(p[0], p[1]), W(p[0] + .16, p[1] + .05)]), '#2a2420', 1.4, { op: .6 }); S.stroke(polyline([W(.3, .02), W(.26, .2), W(.3, .34)]), '#2a2420', 1.2, { op: .7 }); }      // cuts, and a split from the rim
  });
  S.stroke(d, st.k, 1.2);
  // the boss, on a round shield, a targe and a buckler
  if (disc) { const R0 = form === 'buckler' ? w * .26 : form === 'targe' ? w * .13 : w * .15, bm = form === 'targe' && q > 1 ? fit : st;
    S.both(ell(c, R0 * 1.28, R0 * 1.28), bm.s, bm.k, 1); S.both(ell(c, R0, R0), big ? S.radial(add(c, mul(LIGHT, R0 * .4)), R0 * 1.5, [[0, bm.hi], [.22, bm.l], [.5, bm.b], [.82, bm.s], [1, bm.d]]) : bm.b, bm.k, 1);
    if (big) { let sd = ''; const rr = R0 * .09; for (let i = 0; i < 6; i++) { const a2 = i / 6 * 6.283 + .4, p = [c[0] + Math.cos(a2) * R0 * 1.14, c[1] + Math.sin(a2) * R0 * 1.14]; sd += `M${n1(p[0] - rr)} ${n1(p[1])}a${n1(rr)} ${n1(rr)} 0 1 0 ${n1(2 * rr)} 0a${n1(rr)} ${n1(rr)} 0 1 0 ${n1(-2 * rr)} 0`; } S.fill(sd, bm.l); S.stroke(sd, bm.k, .6);
      if (form === 'targe' && q > 0) S.both(poly([[c[0] - R0 * .3, c[1] - R0 * .2], [c[0] - R0 * .12, c[1] - R0 * 1.1], [c[0] + R0 * .26, c[1] - R0 * .14]], [.3, .1, .3]), bm.l, bm.k, .8);                         // a spike in the boss
      if (form === 'buckler' && q > 1) S.stroke(ell(c, w * .38, h * .38), q > 2 ? fit.b : st.k, q > 2 ? 2 : 1, { op: .9 }); } }
  else if (o.device && !bare) o.device(S, W(0, form === 'kite' ? .3 : form === 'pavise' ? .3 : .36), w * (form === 'pavise' ? .19 : .2), metal(q > 1 ? 'gold' : 'bronze'));
  if (!disc && big) { if (q > 0) { let sd = ''; const rr = Math.max(2.4, w * (q > 1 ? .016 : .012)), n5 = q > 1 ? 3 : 5; for (let i = 0; i < n5; i++) { const p = W(q > 1 ? -.78 + i * .78 : -.84 + i * .42, form === 'kite' ? .16 : .06); sd += `M${n1(p[0] - rr)} ${n1(p[1])}a${n1(rr)} ${n1(rr)} 0 1 0 ${n1(2 * rr)} 0a${n1(rr)} ${n1(rr)} 0 1 0 ${n1(-2 * rr)} 0`; } S.fill(sd, rm.l); S.stroke(sd, rm.k, .6); }
    if (M.scroll) { scrolls(S, [W(-.6, form === 'kite' ? .2 : .12), W(.6, form === 'kite' ? .2 : .12)], w * .028, fit.k, .7); scrolls(S, [W(-.2, form === 'pavise' ? .9 : .7), W(.2, form === 'pavise' ? .9 : .7)], w * .024, fit.k, .7); } }
  return w;
}
