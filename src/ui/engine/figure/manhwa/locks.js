// The manhwa layer · hair and beards, drawn in locks (owner order 54: much more work on hair). Every lock is its own
// blade with a line round it, a flat shadow down its unlit side and now and then a light strand; a jagged band of light
// crosses the crown; long hair is a mass behind the shoulders plus locks that fall in front of them.
import { clamp, lerp, mixc, add, sub, mul, norm, perp, n1, splPts } from '../g.js';
import { pt, P, PZ, blob, curve, sliver, elli, circ, tube } from './ink.js';

// style: cap (lift on top, at the sides), fringe (n locks, how low, how ragged), side (locks before the ears, to y),
// mass (behind the shoulders, to y), fall (locks in front of the shoulders, to y), and the tied forms
export const STYLES = {
  bald:   { name: 'Shaved' },
  crop:   { name: 'Cropped', cap: [4, 2.5], fringe: { n: 7, y: -25, zig: 2.5, w: 9 }, tuft: 7 },
  short:  { name: 'Short and tousled', cap: [8, 5], fringe: { n: 7, y: -15, zig: 6, w: 12, sweep: .5 }, side: { n: 2, y: 6 }, tuft: 9 },
  swept:  { name: 'Swept back', cap: [9, 4], back: 7, side: { n: 2, y: 2 }, nape: 16 },
  mid:    { name: 'Parted, to the jaw', cap: [7, 6], fringe: { n: 6, y: -9, zig: 5, w: 13, part: 1 }, side: { n: 3, y: 34 }, mass: { y: 46, flare: 6 } },
  long:   { name: 'Long and straight', cap: [6, 6], fringe: { n: 6, y: -10, zig: 4, w: 13, part: 1 }, side: { n: 2, y: 30 }, mass: { y: 150, flare: 14 }, fall: { y: 140, n: 1 } },
  wavy:   { name: 'Long and waved', cap: [8, 8], fringe: { n: 6, y: -11, zig: 6, w: 14, part: 1, sweep: .4 }, side: { n: 2, y: 26 }, mass: { y: 138, flare: 22, wave: 1 }, fall: { y: 128, n: 2, wave: 1 } },
  tail:   { name: 'Tied back', cap: [6, 4], back: 6, fringe: { n: 4, y: -17, zig: 7, w: 10, sweep: .8, thin: 1 }, side: { n: 1, y: 14 }, tail: { y: 120 } },
  knot:   { name: 'Topknot', cap: [5, 3], back: 7, side: { n: 1, y: 4 }, knot: 1 },
  bun:    { name: 'Coiled at the nape', cap: [6, 5], fringe: { n: 5, y: -14, zig: 4, w: 13, part: 1 }, side: { n: 1, y: 16 }, bun: 1 },
  braids: { name: 'Two braids', cap: [6, 5], fringe: { n: 6, y: -13, zig: 3, w: 12, part: 1 }, side: { n: 1, y: 10 }, braid: { n: 2, y: 150 } },
  braid:  { name: 'One braid over the shoulder', cap: [7, 5], fringe: { n: 6, y: -12, zig: 5, w: 13, sweep: .6 }, side: { n: 1, y: 14 }, braid: { n: 1, y: 160 } },
  plaits: { name: 'A rider\'s plaits', cap: [5, 3], back: 6, side: { n: 1, y: 2 }, braid: { n: 2, y: 96, thin: 1 } },
  coils:  { name: 'Coily, short', cap: [8, 6], coil: 1 },
  coilsfull: { name: 'Coily, full', cap: [19, 15], coil: 1 },
  locs:   { name: 'Locks, with rings', cap: [6, 5], back: 6, rope: { n: 7, y: 80 } },
  wild:   { name: 'Long and unkempt', cap: [10, 8], fringe: { n: 8, y: -8, zig: 9, w: 12, sweep: .3 }, side: { n: 3, y: 28 }, mass: { y: 96, flare: 20, wave: .6, ragged: 1 }, tuft: 9 },
};

export function buildHair(Hd, style, hc, r, o = {}) {
  const st = STYLES[style] || STYLES.short, { hp, w, y0, cx, yaw } = Hd, cover = o.cover || 0;   // cover: 0 bare, 1 a hat over the crown (no fringe), 2 all hidden
  const H = { st, hc, behind: [], crown: [], fall: [] };
  if (!st.cap || cover === 2) return H;
  const [vol, sd] = st.cap, part = (r() < .5 ? -1 : 1) * (st.fringe && st.fringe.part ? r.f(2, 9) : r.f(0, 12));
  const top = -47.5 - vol, hl = -27 + (o.recede || 0) * 5;                                       // the hairline's height at the middle
  const out = sg => [[sg * 16, top + 1.5], [sg * (w * .78 + sd * .6), top + 10 + vol * .2], [sg * (w + sd), -28], [sg * (w + sd * .9 + 1), -8], [sg * (w + sd * .5 + .5), 3]];
  const inn = sg => [[sg * (w - 2.2), 3], [sg * (w - 3.4), -10], [sg * (w - 9), hl + 5.5], [sg * 12, hl + 1]];
  const ring = [[0, top], ...out(1), ...inn(1), [0, hl], ...inn(-1).reverse(), ...out(-1).reverse()].map(p => hp(p[0], p[1]));
  H.capD = blob(ring, ring.map((_, i) => (i === 5 || i === 6 || i === ring.length - 5 || i === ring.length - 6 ? .4 : 1)));
  H.top = y0 + top; H.vol = vol; H.sd = sd; H.part = part; H.hl = hl; H.cover = cover;
  // one lock: a blade, its shadow side, a strand of light
  const lock = (list, root, tip, wd, bend, q = {}) => list.push({ root, tip, w: wd, bend, ...q });
  // the fringe: locks that start near the parting and end across the brow
  if (st.fringe && !cover) {
    const f = st.fringe, n = f.n, px = part;
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? .5 : i / (n - 1), tx = lerp(-w + 2.5, w - 2.5, t) + r.s() * 2, sdn = tx < px ? -1 : 1, edge = Math.abs(tx) / w;
      let ty = f.y + (i % 2 ? f.zig : 0) + r.s() * f.zig * .5 + edge * edge * (f.part ? 16 : 7);
      if (f.part && Math.abs(tx - px) < 9) ty -= 9;
      if (f.thin && Math.abs(t - .5) < .3) continue;
      const root = hp(px + (tx - px) * .32 + (f.sweep ? -sdn * 2 : 0), top + 6 + Math.abs(tx - px) * .16), tip = hp(tx + (f.sweep || 0) * sdn * 4, ty);
      lock(H.crown, root, tip, f.w * (1 + r.s() * .15), -sdn * (.16 + r() * .12) * (f.sweep ? 1.5 : 1), { z: -Math.abs(tx - px) });
    }
  }
  // locks combed back off the brow (no fringe): ridges running from the hairline over the crown
  if (st.back) H.ridges = st.back;
  // tufts that break the outline
  if (st.tuft && !cover) for (let i = 0; i < st.tuft; i++) {
    const a = lerp(-2.25, -.9, (i + .5) / st.tuft) + r.s() * .06, ca = Math.cos(a), sa = Math.sin(a), R = [w + sd - 1, 47.5 + vol - 26];
    const root = hp(R[0] * ca * .8, -26 + R[1] * sa * .8), tip = hp((R[0] + r.f(3, 3 + vol * .7)) * ca + r.s() * 3, -26 + (R[1] + r.f(2, 2 + vol * .6)) * sa);
    lock(H.behind, root, tip, 10 + r() * 3, (ca < 0 ? 1 : -1) * .25, { tuft: 1 });
  }
  if (st.side) for (const sg of [-1, 1]) for (let i = 0; i < st.side.n; i++) {
    const len = st.side.y - i * 7 + r.s() * 3, root = hp(sg * (w - 7 - i * 3), -30 - i * 3), tip = hp(sg * (w - 1.5 + (st.side.y > 20 ? 2 : 0) - i * 2.4 + r.s()), len);
    lock(H.crown, root, tip, 9.5 - i, sg * (.14 + i * .04), { z: -40 + i, k0: .2 });
  }
  return H;
}
// a lock's outline: narrow at the root, widest a third of the way down, a point at the tip, bent sideways
const lockD = (root, tip, w, bend, k0 = .4) => {
  const ax = sub(tip, root), L = Math.hypot(ax[0], ax[1]) || 1, n = [-ax[1] / L, ax[0] / L], N = 7, a = [], b = [];
  for (let i = 0; i <= N; i++) { const t = i / N, c = [root[0] + ax[0] * t + n[0] * bend * L * 4 * t * (1 - t) * .5, root[1] + ax[1] * t + n[1] * bend * L * 4 * t * (1 - t) * .5], wd = w * .5 * (t < .32 ? lerp(k0, 1, Math.sin(t / .32 * Math.PI / 2)) : Math.cos((t - .32) / .68 * Math.PI / 2) ** .8); a.push([c[0] + n[0] * wd, c[1] + n[1] * wd]); b.push([c[0] - n[0] * wd, c[1] - n[1] * wd]); }
  return { d: 'M' + a.map(pt).join('L') + 'L' + b.reverse().map(pt).join('L') + 'Z', n, mid: [root[0] + ax[0] * .45 + n[0] * bend * L * .5, root[1] + ax[1] * .45 + n[1] * bend * L * .5] };
};
const drawLock = (S, l, hc, o = {}) => {
  const b = lockD(l.root, l.tip, l.w, l.bend, l.k0), nx = b.n[0] >= 0 ? 1 : -1, n = mul(b.n, nx);
  S.both(b.d, o.fill || hc.b, hc.k, o.lw ?? .9);
  S.fill(lockD(add(l.root, mul(n, l.w * .2)), add(l.tip, mul(n, .1)), l.w * .4, l.bend * 1.1, l.k0).d, hc.s);
  if (l.w > 8 && !l.tuft) { const a = add(l.root, mul(n, -l.w * .12)), m = add(b.mid, mul(n, -l.w * .22)); S.pen([a, m, mixTip(m, l.tip)], .8, hc.l, { op: .75 }); }
};
const mixTip = (m, t) => [m[0] + (t[0] - m[0]) * .6, m[1] + (t[1] - m[1]) * .6];

// the hair behind the head and the shoulders (drawn before the neck and the body)
export function drawHairBehind(S, Hd, H, F) {
  const st = H.st, hc = H.hc; if (!H.capD) return;
  const { hp, w, cx, y0 } = Hd, r = Hd.rHair;
  if (st.mass && H.cover < 2) {
    const m = st.mass, yb = m.y, fl = m.flare, wv = m.wave || 0, n = Math.max(5, Math.round((w * 2 + fl * 2) / 9)), pts = [];
    const sideL = [[-w - H.sd, -30], [-w - H.sd - 2 - fl * .3 + wv * 3, 12], [-w - H.sd - fl * .8 - wv * 3, yb * .55], [-w - fl - (yb > 100 ? 8 : 0), yb - 8]];
    pts.push(...sideL);
    for (let i = 0; i <= n; i++) { const t = i / n, x = lerp(-w - fl - (yb > 100 ? 8 : 0), w + fl + (yb > 100 ? 8 : 0), t); pts.push([x, yb + (i % 2 ? 0 : (m.ragged ? 13 : 8)) + Math.sin(t * Math.PI) * 6 + r.s() * 2]); }
    pts.push(...sideL.map(p => [-p[0], p[1]]).reverse());
    const q = pts.map(p => [cx + p[0], y0 + p[1]]);
    S.form(blob(q, q.map((_, i) => (i > 3 && i < q.length - 4 ? .35 : 1))), { b: hc.s, s: mixc(hc.s, hc.k, .5), k: hc.k, rim: hc.l }, { sh: 1.6, in: s => {
      for (let i = 0; i < n; i++) { const t = (i + .5) / n, x = cx + lerp(-w - fl, w + fl, t); s.pen([[cx + (x - cx) * .7, y0 - 10], [x + wv * 4 * (i % 2 ? 1 : -1), y0 + yb * .5], [x, y0 + yb]], 1.1, i % 3 ? hc.k : hc.b, { op: i % 3 ? .55 : .9 }); }
    } });
  }
  for (const l of H.behind) drawLock(S, l, hc);
  if (st.tail && H.cover < 2) { const sg = Hd.yaw >= 0 ? -1 : 1, a = hp(sg * (w - 4), -6), d = blob([[a[0], a[1] - 10], [a[0] + sg * 15, a[1] + 6], [a[0] + sg * 19, a[1] + 50], [a[0] + sg * 9, a[1] + st.tail.y], [a[0] + sg * 3, a[1] + st.tail.y - 22], [a[0] + sg * 6, a[1] + 40], [a[0] - sg * 2, a[1] + 8]]);
    S.form(d, { b: hc.b, s: hc.s, k: hc.k, rim: hc.l }, { in: s => { s.pen([[a[0] + sg * 8, a[1]], [a[0] + sg * 13, a[1] + 50], [a[0] + sg * 7, a[1] + st.tail.y - 8]], 1, hc.k, { op: .6 }); s.pen([[a[0] + sg * 4, a[1] + 4], [a[0] + sg * 9, a[1] + 46], [a[0] + sg * 5, a[1] + st.tail.y - 20]], 1.2, hc.l, { op: .7 }); } }); }
  if (st.nape && H.cover < 2) for (const sg of [-1, 1]) for (let i = 0; i < 3; i++) drawLock(S, { root: hp(sg * (w - 6 - i * 5), 2), tip: hp(sg * (w + 3 - i * 6), 14 + st.nape - i * 3), w: 9, bend: sg * .2 }, hc);
  if (st.bun && H.cover < 2) { const c = hp(-Math.sign(Hd.yaw || 1) * (w - 4), 14); S.form(circ(c[0], c[1], 13), { b: hc.b, s: hc.s, k: hc.k, rim: hc.l }, { in: s => { s.pen([[c[0] - 10, c[1] - 3], [c[0], c[1] - 9], [c[0] + 10, c[1] - 2]], 1, hc.k, { op: .6 }); s.pen([[c[0] - 9, c[1] + 4], [c[0], c[1] - 2], [c[0] + 9, c[1] + 5]], 1, hc.k, { op: .6 }); } }); }
}

// a braid: a chain of leaning lobes down a line, with a tie at the end
export function braidDown(S, pts, wd, hc, o = {}) {
  const q = splPts(pts, false, 1, 8), n = Math.max(4, Math.round(q.length / 2.2));
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1.25) / n, a = q[Math.min(q.length - 1, Math.round(t0 * (q.length - 1)))], b = q[Math.min(q.length - 1, Math.round(Math.min(1, t1) * (q.length - 1)))];
    const ax = norm(sub(b, a)), nn = perp(ax), k = wd * (1 - t0 * .3) * .5, sg = i % 2 ? 1 : -1, m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const d = `M${pt(add(a, mul(nn, -sg * k * .2)))}Q${pt(add(m, mul(nn, sg * k * 1.9)))} ${pt(add(b, mul(nn, sg * k * .1)))}Q${pt(add(m, mul(nn, -sg * k * .3)))} ${pt(add(a, mul(nn, -sg * k * .2)))}Z`;
    S.both(d, sg > 0 ? hc.s : hc.b, hc.k, .8);
    if (sg < 0) S.pen([add(a, mul(nn, -k * .4)), add(m, mul(nn, -k * .9))], .8, hc.l, { op: .8 });
  }
  const e = q[q.length - 1], e0 = q[q.length - 3], ax = norm(sub(e, e0));
  S.both(blob([add(e, mul(perp(ax), wd * .32)), add(e, mul(perp(ax), -wd * .32)), add(e, add(mul(ax, 9), mul(perp(ax), -wd * .2))), add(e, mul(ax, 13)), add(e, add(mul(ax, 8), mul(perp(ax), wd * .22)))]), hc.b, hc.k, .8);
  S.line(P([add(e, mul(perp(ax), wd * .34)), add(e, mul(perp(ax), -wd * .34))]), o.tie || '#b98a3a', 2.4);
}

// the hair over the head (after the face): the cap, the locks, the band of light
export function drawHair(S, Hd, H, o = {}) {
  const st = H.st, hc = H.hc; if (!H.capD) return;
  const { hp, w, y0, cx } = Hd, r = Hd.rHair, top = H.top - y0;
  if (st.coil) {
    // coily hair: a cloud of small rounds along the outline, tight curls marked inside
    const [vol, sd] = st.cap, n = 15 + Math.round(vol), bumps = [];
    for (let i = 0; i <= n; i++) { const a = Math.PI * (1.02 + .96 * i / n), c = hp((w + sd * .7) * Math.cos(a), -22 + (26 + vol) * Math.sin(a)); bumps.push(circ(c[0], c[1], 5.2 + vol * .2 + (i % 2) * .8)); }
    const all = H.capD + bumps.join('');
    S.line(all, hc.k, 2.2); S.fill(all, hc.b);
    S.clip(all, s => {
      s.fill(blob([[w * .1, top - 8], [w + sd + 8, -30], [w + sd + 8, 6], [w - 6, 4], [w - 2, -20], [w * .4, H.hl - 3]].map(p => hp(p[0], p[1]))), hc.s);
      let c = '', l = '';
      for (let i = 0; i < 36 + vol * 2; i++) { const x = r.s() * (w + sd), y = lerp(top, -8, r()), p = hp(x, y), q = `M${n1(p[0] - 2.2)} ${n1(p[1])}a2.2 2.2 0 1 1 2.6 2.1`; if (x < -4 && y < -30) l += q; else c += q; }
      s.line(c, hc.k, .8, .7); s.line(l, hc.l, .9, .8);
    });
    return;
  }
  S.form(H.capD, { b: hc.b, s: hc.s, k: hc.k, rim: hc.l }, { sh: 1.5, in: s => {
    // strands: lines that run from the parting (or back from the hairline) over the skull
    const px = H.part, n = 9;
    for (let i = 0; i < n; i++) {
      const t = (i + .5) / n, x = lerp(-w - H.sd, w + H.sd, t);
      const a = H.ridges ? hp(x * .78, H.hl + 2 + Math.abs(x) * .14) : hp(px + (x - px) * .2, top + 5), b = H.ridges ? hp(x * .95, top + 9 + Math.abs(x) * .5) : hp(x, -24 + Math.abs(x) * .3);
      const m = H.ridges ? hp(x * .9, (H.hl + top) / 2) : hp(px + (x - px) * .66, top + 9 + Math.abs(x - px) * .12);
      s.pen([a, m, b], 1.1, hc.k, { op: .5 });
      if (i % 2 === 0) s.pen([[a[0] - 2, a[1]], [m[0] - 2.2, m[1]], [b[0] - 2, b[1]]], 1.2, hc.l, { op: .5 });
    }
  } });
  const ls = H.crown.slice().sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
  for (const l of ls) drawLock(S, l, hc);
  // the band of light across the crown: jagged, as the cel painters cut it
  if (H.cover === 0) {
    const yb = top + 13 + H.vol * .25, n = 11, up = [], dn = [];
    for (let i = 0; i <= n; i++) { const t = i / n, x = lerp(-w * .78, w * .5, t), arc = (x / w) ** 2 * 9; up.push(hp(x, yb + arc - (i % 2 ? 2.2 : 0))); dn.push(hp(x + 1.5, yb + arc + 3.4 + (i % 2 ? 0 : 2.8) + (i === 0 || i === n ? -3 : 0))); }
    S.clip(H.capD, s => s.fill(PZ([...up, ...dn.reverse()]), hc.l, .8));
  }
  if (st.knot && H.cover === 0) { const c = hp(0, top - 7); S.form(blob([[c[0] - 9, c[1] + 6], [c[0] - 11, c[1] - 5], [c[0] - 2, c[1] - 13], [c[0] + 9, c[1] - 8], [c[0] + 10, c[1] + 5], [c[0], c[1] + 9]]), { b: hc.b, s: hc.s, k: hc.k, rim: hc.l }, { in: s => { s.pen([[c[0] - 7, c[1] + 3], [c[0] - 2, c[1] - 8], [c[0] + 5, c[1] - 6]], 1, hc.k, { op: .6 }); s.pen([[c[0] - 5, c[1] - 2], [c[0] - 1, c[1] - 9]], 1.2, hc.l, { op: .8 }); } }); S.line(P([[c[0] - 8, c[1] + 7], [c[0] + 8, c[1] + 7]]), o.tie || '#8a3a2a', 2.6); }
}

// the locks that fall in front of the shoulders, and braids (after the body and the mantle)
export function drawHairFall(S, Hd, H, F, o = {}) {
  const st = H.st, hc = H.hc; if (!H.capD || H.cover === 2) return;
  const { hp, w, y0, cx } = Hd, r = Hd.rHair;
  if (st.fall) for (const sg of [-1, 1]) for (let i = 0; i < st.fall.n; i++) {
    const wv = st.fall.wave || 0, a = hp(sg * (w - 2), -2), y = st.fall.y - i * 26 + r.s() * 6, bx = cx + sg * (w + 4 + i * 9);
    const pts = [a, [bx + sg * 1, y0 + 34], [bx + sg * (12 + wv * 4), y0 + y * .58], [bx + sg * (8 - wv * 4) + i * sg * 4, y0 + y * .8], [bx + sg * 2 + wv * 3, y0 + y]];
    const d = tube(pts, [2.5, 7, 8.5 - i, 6 - i, .4]);
    S.form(d, { b: hc.b, s: hc.s, k: hc.k, rim: hc.l }, { sh: .8, in: s => s.pen(pts.map(p => [p[0] - 1.6, p[1]]), 1.3, hc.l, { op: .7 }) });
  }
  if (st.braid) { const b = st.braid, sides = b.n === 2 ? [-1, 1] : [Hd.yaw >= 0 ? -1 : 1];
    for (const sg of sides) { const a = hp(sg * (w - 1), 10), x = cx + sg * (b.thin ? w + 9 : w + 6); braidDown(S, [a, [x, y0 + 44], [x + sg * (b.thin ? 2 : -6), y0 + b.y * .7], [x + sg * (b.thin ? 0 : -10), y0 + b.y]], b.thin ? 8 : 12.5, hc, { tie: o.tie }); } }
  if (st.rope) for (let i = 0; i < st.rope.n; i++) { const t = i / (st.rope.n - 1), sg = t < .5 ? -1 : 1, k = Math.abs(t - .5) * 2, a = hp(sg * (w - 1 - (1 - k) * 8), -4 - (1 - k) * 8), y = st.rope.y - (1 - k) * 16 + r.s() * 6, x = cx + sg * (w + 3 + k * 9);
    const pts = [a, [x, y0 + y * .45], [x + sg * 2, y0 + y]];
    S.both(tube(pts, [3, 3.1, 2.4]), i % 2 ? hc.b : hc.s, hc.k, .8); S.pen(pts.map(p => [p[0] - .9, p[1]]), .8, hc.l, { op: .6 });
    if (o.cuffs) { const c = pts[1]; S.line(P([[c[0] - 3.2, c[1] + 6 + i % 3 * 5], [c[0] + 3.2, c[1] + 7 + i % 3 * 5]]), o.cuffs, 2.2); } }
}

export const BEARDS = ['none', 'stubble', 'moustache', 'long-moustache', 'goatee', 'short', 'full', 'pointed', 'forked', 'braided'];
export function drawBeard(S, Hd, kind, hc, sk, r) {
  if (!kind || kind === 'none') return;
  const { hp, fx, y0, w, chin, jawX, jawY } = Hd, my = 26.6, col = { b: hc.b, s: hc.s, k: hc.k, rim: hc.l };
  const fxo = fx - Hd.cx;
  if (kind === 'stubble') { S.clip(Hd.outline, s => s.fill(blob([[-w, 8], [-w * .6, 19], [-9, 21.5], [0, 20], [9, 21.5], [w * .6, 19], [w, 8], [w, 50], [-w, 50]].map(p => hp(p[0], p[1])), .8), mixc(sk.s, hc.b, .35), .5)); return; }
  const mo = (len, drop) => { for (const sg of [-1, 1]) S.both(blob([[fx + sg * .4, y0 + my - 3.6], [fx + sg * 5, y0 + my - 3.4], [fx + sg * len, y0 + my - 1 + drop * .3], [fx + sg * (len + 1.4), y0 + my + drop], [fx + sg * 5.5, y0 + my - .2], [fx + sg * .6, y0 + my - 1.3]], .9), hc.b, hc.k, .8); };
  if (kind === 'moustache') { mo(9.5, 1.5); return; }
  if (kind === 'long-moustache') { mo(11, 15); return; }
  const band = { goatee: 0, short: 5, full: 9, pointed: 5.5, forked: 8, braided: 9 }[kind] ?? 5, hang = { goatee: 7, short: 3.5, full: 12, pointed: 16, forked: 20, braided: 30 }[kind] ?? 4;
  let pts;
  if (kind === 'goatee') pts = [[-6.5, my + 4.5], [0, my + 3.4], [6.5, my + 4.5], [5.5, chin + 2], [0, chin + hang], [-5.5, chin + 2]];
  else {
    const n = 7, low = [];
    for (let i = 0; i <= n; i++) { const t = i / n, x = lerp(jawX + 1.5, -jawX - 1.5, t), c = 1 - Math.abs(t - .5) * 2; let y = jawY + 3 + c * (chin - jawY + hang) * (kind === 'pointed' ? c : 1) + (i % 2 ? 2.2 : 0); if (kind === 'forked' && i === Math.round(n / 2)) y -= 9; low.push([x, y]); }
    pts = [[-w + 1.2, -2], [-w + band * .6 + 2, 9], [-9, my - 3.5 + (band > 6 ? -1 : 2)], [0, my - 4.6], [9, my - 3.5 + (band > 6 ? -1 : 2)], [w - band * .6 - 2, 9], [w - 1.2, -2], ...low];
  }
  const q = pts.map(p => hp(p[0] + (kind === 'goatee' ? fxo : 0), p[1]));
  S.form(blob(q, q.map((_, i) => (i > 6 ? .5 : .9))), col, { sh: 1.2, in: s => {
    for (let i = 0; i < 9; i++) { const x = lerp(-jawX, jawX, (i + .5) / 9); s.pen([hp(x * .8, my + 6), hp(x * .95, chin - 2 + hang * .4), hp(x * .8, chin + hang)], .9, i % 2 ? hc.k : hc.l, { op: .55 }); }
  } });
  // the mouth shows through the beard
  S.fill(blob([[fx - 6.6, y0 + my - .8], [fx, y0 + my - 1.8], [fx + 6.6, y0 + my - .8], [fx + 4.5, y0 + my + 3.2], [fx - 4.5, y0 + my + 3.2]]), sk.s);
  S.pen([[fx - 6, y0 + my], [fx, y0 + my + .6], [fx + 6, y0 + my]], 1.1, mixc(sk.k, sk.lip, .3));
  mo(kind === 'full' || kind === 'braided' || kind === 'forked' ? 10.5 : 8.5, kind === 'pointed' ? 5 : 3);
  if (kind === 'braided') { const c = hp(fxo, chin + hang - 6); braidDown(S, [c, [c[0] + 1, c[1] + 12], [c[0], c[1] + 24]], 8, hc, { tie: '#b9b9c4' }); }
}
