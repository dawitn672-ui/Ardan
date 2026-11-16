// Gate 2 · the scene: named layers of SVG shapes, written out in one fixed order. A part draws into the layer it
// belongs to (S.layer('hair')), so the order parts are *called* in never decides what covers what.
import { n1 } from './g.js';

const n2 = x => (Math.round(x * 100) / 100).toString();
export const ORDER = ['ground', 'back', 'backHair', 'propBack', 'armsBack', 'skin', 'legs', 'skirt', 'torso', 'belt', 'weapon', 'arms', 'shoulder', 'collar',
  'head', 'face', 'hair', 'headwear', 'propFront', 'hands', 'fx'];

export class Scene {
  // id: a prefix that keeps gradient and clip ids apart when many portraits share a page; px: output pixels per unit
  constructor(id, o = {}) {
    this.id = id; this.px = o.px || 1; this.lod = o.lod ?? 2; this.defs = []; this.layers = {}; this.cur = []; this.n = 0; this.memo = new Map();
    this.shapes = 0;
  }
  layer(name) { this.cur = this.layers[name] || (this.layers[name] = []); return this; }
  lw(px) { return px / this.px; }                    // a line `px` output pixels wide, in drawing units
  uid() { return this.id + (this.n++).toString(36); }
  def(key, make) { let id = this.memo.get(key); if (!id) { id = this.uid(); this.memo.set(key, id); this.defs.push(make(id)); } return id; }
  stops(st) { return st.map(s => `<stop offset="${n2(s[0])}" stop-color="${s[1]}"${s[2] != null && s[2] < 1 ? ` stop-opacity="${n2(s[2])}"` : ''}/>`).join(''); }
  // paints: a gradient from p0 to p1, or round a centre; stops are [offset, colour, alpha]
  lin(p0, p1, st) {
    const k = 'l' + [p0, p1].map(p => n1(p[0]) + ',' + n1(p[1])).join(' ') + JSON.stringify(st);
    return `url(#${this.def(k, id => `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${n1(p0[0])}" y1="${n1(p0[1])}" x2="${n1(p1[0])}" y2="${n1(p1[1])}">${this.stops(st)}</linearGradient>`)})`;
  }
  radial(c, r, st, o = {}) {
    const tf = o.rx ? ` gradientTransform="translate(${n1(c[0])} ${n1(c[1])}) rotate(${n1(o.rot || 0)}) scale(${n2(o.rx / r)} ${n2((o.ry || o.rx) / r)}) translate(${n1(-c[0])} ${n1(-c[1])})"` : '';
    const k = 'r' + n1(c[0]) + ',' + n1(c[1]) + ',' + n1(r) + tf + JSON.stringify(st);
    return `url(#${this.def(k, id => `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${n1(c[0])}" cy="${n1(c[1])}" r="${n1(r)}"${tf}>${this.stops(st)}</radialGradient>`)})`;
  }
  clip(d) { const ds = Array.isArray(d) ? d : [d]; return this.def('c' + ds.join('|'), id => `<clipPath id="${id}">${ds.map(x => `<path d="${x}"/>`).join('')}</clipPath>`); }
  blur(sd) { const s = n1(sd); return this.def('b' + s, id => `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${s}"/></filter>`); }
  pattern(key, w, h, body, tf = '') { return `url(#${this.def('p' + key, id => `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${n2(w)}" height="${n2(h)}"${tf ? ` patternTransform="${tf}"` : ''}>${body}</pattern>`)})`; }
  attrs(o) {
    if (!o) return '';
    let s = '';
    if (o.op != null && o.op < 1) s += ` opacity="${n2(o.op)}"`;
    if (o.clip) s += ` clip-path="url(#${o.clip})"`;
    if (o.filter) s += ` filter="url(#${o.filter})"`;
    if (o.blend) s += ` style="mix-blend-mode:${o.blend}"`;
    if (o.cap) s += ` stroke-linecap="${o.cap}"`;
    if (o.join) s += ` stroke-linejoin="${o.join}"`;
    if (o.dash) s += ` stroke-dasharray="${o.dash}"`;
    if (o.rule) s += ` fill-rule="${o.rule}"`;
    if (o.tf) s += ` transform="${o.tf}"`;
    return s;
  }
  fill(d, c, o) { if (!d) return this; this.shapes++; this.cur.push(`<path d="${d}" fill="${c}"${this.attrs(o)}/>`); return this; }
  // a line of constant width (in output pixels unless o.units)
  stroke(d, c, px = 1, o) { if (!d) return this; this.shapes++; this.cur.push(`<path d="${d}" fill="none" stroke="${c}" stroke-width="${n2(o && o.units ? px : this.lw(px))}" stroke-linecap="${(o && o.cap) || 'round'}" stroke-linejoin="${(o && o.join) || 'round'}"${this.attrs(o && { ...o, cap: 0, join: 0 })}/>`); return this; }
  // a filled shape with its outline
  both(d, c, k, px = 1, o) { if (!d) return this; this.shapes++; this.cur.push(`<path d="${d}" fill="${c}" stroke="${k}" stroke-width="${n2(this.lw(px))}" stroke-linejoin="round"${this.attrs(o)}/>`); return this; }
  raw(s) { this.cur.push(s); return this; }
  g(o, fn) { this.cur.push(`<g${this.attrs(o)}>`); fn(); this.cur.push('</g>'); return this; }
  // everything drawn by fn is clipped to d
  within(d, fn, o) { return this.g({ ...(o || {}), clip: this.clip(d) }, fn); }
  body(order = ORDER) { let s = ''; for (const k of order) if (this.layers[k]) s += this.layers[k].join(''); return s; }
  svg(vb, o = {}) {
    const [x, y, w, h] = vb;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${n1(x)} ${n1(y)} ${n1(w)} ${n1(h)}"${o.w ? ` width="${o.w}" height="${o.h}"` : ''}${o.cls ? ` class="${o.cls}"` : ''}${o.label ? ` role="img" aria-label="${o.label}"` : ''}><defs>${this.defs.join('')}</defs>${o.pre || ''}${this.body(o.order)}${o.post || ''}</svg>`;
  }
}
