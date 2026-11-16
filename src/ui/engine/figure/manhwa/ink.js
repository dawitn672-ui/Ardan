// The manhwa layer of the figure library (C8d gate 1, D-068) · the pen. One Ink holds one drawing's shapes and its
// <defs>. Pure string building: nothing here reads the page, the clock or the dice.
//
// The look is made by three habits, all of them here:
//   form()   a flat cel form: its shadow is the form itself moved toward the light (two flat steps, a hard edge), with
//            a thin rim of light down the far side; then one coloured outline. The path is written once and used again.
//   pen()    a tapered line (a filled sliver, thick in the middle, a point at each end) for folds, lids and strands
//   band()   a trim: a ribbon along a line, with a people's own motif stitched on it
import { n1, mixc, spl, splPts, offset, add, sub, mul, norm, perp, len, along, hsl, fromHsl } from '../g.js';

export const pt = p => n1(p[0]) + ' ' + n1(p[1]);
export const P = pts => 'M' + pts.map(pt).join('L');
export const PZ = pts => P(pts) + 'Z';
export const circ = (x, y, r) => `M${n1(x - r)} ${n1(y)}a${n1(r)} ${n1(r)} 0 1 0 ${n1(2 * r)} 0a${n1(r)} ${n1(r)} 0 1 0 ${n1(-2 * r)} 0Z`;
export const elli = (x, y, rx, ry) => `M${n1(x - rx)} ${n1(y)}a${n1(rx)} ${n1(ry)} 0 1 0 ${n1(2 * rx)} 0a${n1(rx)} ${n1(ry)} 0 1 0 ${n1(-2 * rx)} 0Z`;
export const rect = (x, y, w, h) => `M${n1(x)} ${n1(y)}h${n1(w)}v${n1(h)}h${n1(-w)}Z`;
// a smooth closed outline through points; a smooth open line through points
export const blob = (pts, t = 1) => spl(pts, true, t);
export const curve = (pts, t = 1) => spl(pts, false, t);
// a tapered sliver along a line through pts: w at the middle, a point at both ends (or w0 -> w1 with `to`)
export function sliver(pts, w, o = {}) {
  const q = splPts(pts, false, 1, o.per || 5), at = o.at ?? .5;
  const wf = t => (o.flat ? w * Math.min(1, t * 6, (1 - t) * 6) : t < at ? w * Math.sin(Math.PI / 2 * t / at) ** .8 : w * Math.cos(Math.PI / 2 * (t - at) / (1 - at)) ** .9);
  const L = offset(q, t => wf(t) / 2), R = offset(q, t => -wf(t) / 2).reverse();
  return 'M' + L.map(pt).join('L') + 'L' + R.map(pt).join('L') + 'Z';
}
// a tube (a sleeve, a braid's core, a strap): a centre line and a radius at each of its points
export function tube(pts, radii, o = {}) {
  const q = splPts(pts, false, 1, 6), n = q.length - 1, m = radii.length - 1;
  const rf = t => { const x = t * m, i = Math.min(m - 1, Math.floor(x)); return radii[i] + (radii[i + 1] - radii[i]) * (x - i); };
  const L = offset(q, t => rf(t)), R = offset(q, t => -rf(t)).reverse();
  if (o.sides) return { L, R: R.slice().reverse(), q };
  if (o.caps) {
    // round ends: a half circle of the end's radius about each end of the centre line
    const cap = (c, from, r, k) => { const a0 = Math.atan2(from[1] - c[1], from[0] - c[0]), out = []; for (let i = 1; i < 4; i++) { const a = a0 + i * Math.PI / 4; out.push([c[0] + Math.cos(a) * r * k, c[1] + Math.sin(a) * r * k]); } return out; };
    const e = q[n], b = q[0], k1 = o.caps[1] ?? 1, k0 = o.caps[0] ?? 1;
    return spl([...L, ...cap(e, L[L.length - 1], radii[m], k1), ...R, ...cap(b, R[R.length - 1], radii[0], k0)], true, 1);
  }
  return spl([...L, ...R], true, o.t ?? .9);
}
// a colour set for a cel form from a ramp of the palette ({ b, s, d, l, k })
export const cel = (r, o = {}) => ({ b: r.b, s: o.deep ? r.d : r.s, k: o.k || r.k, l: r.l, rim: o.rim || mixc(r.l, '#fff4dc', .55) });
export const tint = (c, to, t) => mixc(c, to, t);
export const darker = (c, k = .12) => { const [h, s, l] = hsl(c); return fromHsl(h + (h > 40 && h < 250 ? 10 : -10), Math.min(1, s * 1.1), Math.max(0, l - k)); };
export const lighter = (c, k = .12) => { const [h, s, l] = hsl(c); return fromHsl(h, s * .9, Math.min(1, l + k)); };

export class Ink {
  constructor(id, o = {}) { this.id = id; this.defs = []; this.buf = []; this.k = 0; this.lw = o.lw || 1.25; this.light = o.light || [-4.4, -2.8]; this.shapes = 0; this.memo = new Map(); }
  uid() { return this.id + (this.k++).toString(36); }
  put(s) { this.buf.push(s); return this; }
  fill(d, c, op) { this.shapes++; this.buf.push(`<path d="${d}" fill="${c}"${op != null && op < 1 ? ` opacity="${op}"` : ''}/>`); return this; }
  line(d, c, w, op) { this.shapes++; this.buf.push(`<path d="${d}" fill="none" stroke="${c}" stroke-width="${n1(w ?? this.lw)}"${op != null && op < 1 ? ` opacity="${op}"` : ''}/>`); return this; }
  both(d, c, k, w) { this.shapes++; this.buf.push(`<path d="${d}" fill="${c}" stroke="${k}" stroke-width="${n1(w ?? this.lw)}"/>`); return this; }
  pen(pts, w, c, o) { return this.fill(sliver(pts, w, o), c, o && o.op); }
  // run fn and return what it drew as a string (not yet placed)
  sub(fn) { const keep = this.buf; this.buf = []; fn(this); const s = this.buf.join(''); this.buf = keep; return s; }
  group(attrs, fn) { const s = this.sub(fn); if (s) this.buf.push(`<g ${attrs}>${s}</g>`); return this; }
  clipId(d) { const id = this.uid(); this.defs.push(`<clipPath id="${id}"><path d="${d}"/></clipPath>`); return id; }
  clip(d, fn) { const s = this.sub(fn); if (s) this.buf.push(`<g clip-path="url(#${this.clipId(d)})">${s}</g>`); return this; }
  // a flat cel form. pal { b, s, k, rim }; o.in(S) draws inside it (folds, trim, pattern); o.sh scales the shadow's
  // width; o.rim false leaves the rim light out; o.w the outline's width (0 none); o.flat no shadow at all
  form(d, pal, o = {}) {
    const id = this.uid(), cid = id + 'c', [lx, ly] = this.light, k = o.sh ?? 1; this.shapes += 4;
    this.defs.push(`<path id="${id}" d="${d}"/><clipPath id="${cid}"><use href="#${id}"/></clipPath>`);
    const inner = o.in ? this.sub(o.in) : '';
    const u = (c, x, y) => `<use href="#${id}" fill="${c}"${x || y ? ` transform="translate(${n1(x)} ${n1(y)})"` : ''}/>`;
    let s;
    if (o.flat) s = u(pal.b) + (inner ? `<g clip-path="url(#${cid})">${inner}</g>` : '');
    else s = (o.rim === false ? u(pal.s) : u(pal.rim)) + `<g clip-path="url(#${cid})">` + (o.rim === false ? '' : u(pal.s, -1.5, -.2)) + u(pal.b, lx * k, ly * k) + inner + '</g>';
    const w = o.w ?? this.lw;
    if (w > 0) s += `<use href="#${id}" fill="none" stroke="${pal.k}" stroke-width="${n1(w)}"/>`;
    this.buf.push(s); return this;
  }
  lin(x1, y1, x2, y2, stops) {
    const key = 'l' + [x1, y1, x2, y2, stops].join(); if (this.memo.has(key)) return this.memo.get(key);
    const id = this.uid();
    this.defs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${n1(x1)}" y1="${n1(y1)}" x2="${n1(x2)}" y2="${n1(y2)}">${stops.map(s => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] != null ? ` stop-opacity="${s[2]}"` : ''}/>`).join('')}</linearGradient>`);
    const u = `url(#${id})`; this.memo.set(key, u); return u;
  }
  rad(cx, cy, r, stops) {
    const id = this.uid();
    this.defs.push(`<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(r)}">${stops.map(s => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] != null ? ` stop-opacity="${s[2]}"` : ''}/>`).join('')}</radialGradient>`);
    return `url(#${id})`;
  }
  // a tiled texture (mail, scales, quilting, stripes, brocade): body is the tile's own shapes
  tile(w, h, body, o = {}) {
    const key = 't' + w + ',' + h + body + (o.rot || 0); if (this.memo.has(key)) return this.memo.get(key);
    const id = this.uid();
    this.defs.push(`<pattern id="${id}" width="${n1(w)}" height="${n1(h)}" patternUnits="userSpaceOnUse"${o.rot ? ` patternTransform="rotate(${o.rot})"` : ''}>${body}</pattern>`);
    const u = `url(#${id})`; this.memo.set(key, u); return u;
  }
  blur(sd) { const key = 'b' + sd; if (this.memo.has(key)) return this.memo.get(key); const id = this.uid(); this.defs.push(`<filter id="${id}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${sd}"/></filter>`); const u = `url(#${id})`; this.memo.set(key, u); return u; }
  // a trim along a line: a ribbon of width w in colour pal.b with edge lines, and a motif stitched on it in `c2`
  //   motif: dots, zig, diamonds, bars, scroll, key, knots, waves or none
  band(pts, w, pal, motif, c2, o = {}) {
    const q = splPts(pts, false, 1, 5), d = P(q);
    this.line(d, pal.k, w + 1.4); this.line(d, pal.b, w);
    if (o.edge !== false && w > 3) { const e = offset(q, w / 2 - .7), f = offset(q, -(w / 2 - .7)); this.line(P(e) + P(f), o.edgeC || pal.s, .6, .9); }
    if (!motif || motif === 'none') return this;
    let L = 0; for (let i = 1; i < q.length; i++) L += len(sub(q[i], q[i - 1]));
    const step = o.step || w * 1.25, n = Math.max(2, Math.round(L / step)), h = w * .28; let m = '', fillIt = false;
    for (let i = 0; i < n; i++) {
      const t = (i + .5) / n, c = along(q, t), tg = norm(sub(along(q, Math.min(1, t + .5 / n)), along(q, Math.max(0, t - .5 / n)))), nn = perp(tg), at = (a, b) => pt(add(c, add(mul(tg, a), mul(nn, b)))), hs = step / 2;
      if (motif === 'dots') { fillIt = true; const r = Math.max(.6, w * .17); m += circ(c[0], c[1], r); }
      else if (motif === 'zig') m += `M${at(-hs, h)}L${at(0, -h)}L${at(hs, h)}`;
      else if (motif === 'diamonds') { fillIt = true; m += `M${at(-hs * .6, 0)}L${at(0, -h * 1.1)}L${at(hs * .6, 0)}L${at(0, h * 1.1)}Z`; }
      else if (motif === 'bars') m += `M${at(0, -h * 1.2)}L${at(0, h * 1.2)}`;
      else if (motif === 'scroll') m += `M${at(-hs * .8, h)}Q${at(-hs * .2, -h * 2)} ${at(hs * .4, -h * .2)}Q${at(hs * .5, h * 1.2)} ${at(0, h * .5)}`;
      else if (motif === 'key') m += `M${at(-hs, h)}L${at(-hs, -h)}L${at(hs * .3, -h)}L${at(hs * .3, h * .3)}L${at(-hs * .3, h * .3)}`;
      else if (motif === 'knots') m += `M${at(-hs, i % 2 ? h : -h)}Q${at(0, i % 2 ? -h * 2.2 : h * 2.2)} ${at(hs, i % 2 ? h : -h)}M${at(-hs, i % 2 ? -h : h)}Q${at(0, i % 2 ? h * 2.2 : -h * 2.2)} ${at(hs, i % 2 ? -h : h)}`;
      else if (motif === 'waves') m += `M${at(-hs, 0)}Q${at(-hs * .5, -h * 1.6)} ${at(0, 0)}Q${at(hs * .5, h * 1.6)} ${at(hs, 0)}`;
    }
    if (fillIt) this.fill(m, c2); else this.line(m, c2, Math.max(.6, w * .12));
    return this;
  }
  svg(vb, o = {}) {
    const [x, y, w, h] = vb;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}"${o.w ? ` width="${o.w}" height="${o.h}"` : ''}${o.cls ? ` class="${o.cls}"` : ''} role="img"${o.label ? ` aria-label="${o.label}"` : ''} stroke-linejoin="round" stroke-linecap="round"><defs>${this.defs.join('')}</defs>${this.buf.join('')}</svg>`;
  }
}
