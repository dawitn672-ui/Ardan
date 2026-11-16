// The figure library · the scene: named layers of SVG shapes, written out in one fixed order. A part draws into the layer it
// belongs to (S.layer('hair')), so the order parts are *called* in never decides what covers what.
import { n1 } from './g.js';

const n2 = x => (Math.round(x * 100) / 100).toString();
// text that came from the game's state (a name) goes into an attribute only through this
export const xml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const ORDER = ['ground', 'back', 'backHair', 'propBack', 'armsBack', 'skin', 'legs', 'skirt', 'torso', 'belt', 'weapon', 'arms', 'shoulder', 'collar',
  'head', 'face', 'hair', 'headwear', 'propFront', 'hands', 'fx'];

export class Scene {
  // id: a prefix that keeps gradient and clip ids apart when many portraits share a page; px: output pixels per unit
  constructor(id, o = {}) {
    this.id = id; this.px = o.px || 1; this.lod = o.lod ?? 2; this.defs = []; this.layers = {}; this.cur = []; this.n = 0; this.memo = new Map();
    this.shapes = 0;
    // soft: false for the smallest pictures, where a blurred shape is a few pixels and a filter is the costliest thing
    // on the page: blur() then gives no filter and the shape is drawn as it is
    this.soft = o.soft !== false;
    // tint: every colour written goes through it (the dead are drawn with their colour drained); null leaves colours alone
    this.tint = o.tint || null; this.tints = new Map();
    // the smallest thing drawn, in output pixels: on the face (minPx), and on dress and gear (minPx * coarse)
    this.minPx = 0; this.coarse = 1; this.fine = false;
  }
  col(c) {
    if (!this.tint || typeof c !== 'string' || c[0] !== '#') return c;
    let v = this.tints.get(c); if (v === undefined) { v = this.tint(c); this.tints.set(c, v); } return v;
  }
  // is a path wholly outside the picture's frame (S.view, set by compose)? Its absolute points are read; a relative run
  // (the small arcs of dots and rivets) starts at one of them and is covered by the margin. A path this cannot read is kept.
  out(d) {
    const v = this.view; if (!v) return false;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, cmd = '', k = 0, px = 0, rel = false;
    const n = d.length;
    for (let i = 0; i < n;) {
      const c = d.charCodeAt(i);
      if (c === 32 || c === 44) { i++; continue; }
      if (c >= 65 && c !== 101) {                       // a command letter (not the e of an exponent)
        cmd = d[i]; k = 0; i++;
        if (cmd === 'H' || cmd === 'V' || cmd === 'S' || cmd === 'T') return false;
        if (c >= 97 && cmd !== 'z') rel = true;
        continue;
      }
      let j = i + 1; while (j < n) { const e = d.charCodeAt(j); if ((e >= 48 && e <= 57) || e === 46) j++; else break; }
      if (cmd === 'M' || cmd === 'L' || cmd === 'C' || cmd === 'Q' || cmd === 'A') {
        const isA = cmd === 'A', at = isA ? k % 7 : k % 2;
        if (!isA || at >= 5) {
          const val = +d.slice(i, j);
          if ((isA ? at === 5 : at === 0)) px = val;
          else { if (px < x0) x0 = px; if (px > x1) x1 = px; if (val < y0) y0 = val; if (val > y1) y1 = val; }
        }
      }
      k++; i = j;
    }
    if (x0 > x1) return false;
    const m = Math.max(v[2], v[3]) * .06;
    if (x1 < v[0] - m || x0 > v[0] + v[2] + m || y1 < v[1] - m || y0 > v[1] + v[3] + m) return true;
    // ... or too small to be seen at this size (a rivet in a 46 px portrait)
    return this.minPx > 0 && !rel && Math.max(x1 - x0, y1 - y0) * this.px < (this.fine ? this.minPx : this.minPx * this.coarse);
  }
  cut(d, o) { return !d || (this.view && !(o && o.tf) && this.out(d)); }
  layer(name) { this.cur = this.layers[name] || (this.layers[name] = []); this.fine = name === 'face' || name === 'head' || name === 'hair'; return this; }
  lw(px) { return px / this.px; }                    // a line `px` output pixels wide, in drawing units
  uid() { return this.id + (this.n++).toString(36); }
  def(key, make) { let id = this.memo.get(key); if (!id) { id = this.uid(); this.memo.set(key, id); this.defs.push([id, make(id)]); } return id; }
  stops(st) { return st.map(s => `<stop offset="${n2(s[0])}" stop-color="${this.col(s[1])}"${s[2] != null && s[2] < 1 ? ` stop-opacity="${n2(s[2])}"` : ''}/>`).join(''); }
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
  blur(sd) { if (!this.soft) return ''; const s = n2(sd); return this.def('b' + s, id => `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${s}"/></filter>`); }
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
  fill(d, c, o) { if (this.cut(d, o)) return this; this.shapes++; this.cur.push(`<path d="${d}" fill="${this.col(c)}"${this.attrs(o)}/>`); return this; }
  // a line of constant width (in output pixels unless o.units)
  stroke(d, c, px = 1, o) { if (this.cut(d, o)) return this; this.shapes++; this.cur.push(`<path d="${d}" fill="none" stroke="${this.col(c)}" stroke-width="${n2(o && o.units ? px : this.lw(px))}" stroke-linecap="${(o && o.cap) || 'round'}" stroke-linejoin="${(o && o.join) || 'round'}"${this.attrs(o && { ...o, cap: 0, join: 0 })}/>`); return this; }
  // a filled shape with its outline
  both(d, c, k, px = 1, o) { if (this.cut(d, o)) return this; this.shapes++; this.cur.push(`<path d="${d}" fill="${this.col(c)}" stroke="${this.col(k)}" stroke-width="${n2(this.lw(px))}" stroke-linejoin="round"${this.attrs(o)}/>`); return this; }
  raw(s) { this.cur.push(s); return this; }
  // a group; one that ends up empty (everything in it fell outside the frame) is taken out again
  g(o, fn) { const cur = this.cur, at = cur.length; cur.push(`<g${this.attrs(o)}>`); fn(); this.cur = cur; if (cur.length === at + 1) cur.pop(); else cur.push('</g>'); return this; }
  // everything drawn by fn is clipped to d
  within(d, fn, o) { return this.g({ ...(o || {}), clip: this.clip(d) }, fn); }
  body(order = ORDER) { let s = ''; for (const k of order) if (this.layers[k]) s += this.layers[k].join(''); return s; }
  svg(vb, o = {}) {
    const [x, y, w, h] = vb, body = (o.pre || '') + this.body(o.order) + (o.post || '');
    // only the gradients, clips and filters the drawing still points at are written (a culled shape leaves its own behind)
    const used = new Set(body.match(/#[A-Za-z0-9_-]+(?=[)"])/g) || []);
    let defs = ''; for (const df of this.defs) { if (typeof df === 'string') defs += df; else if (used.has('#' + df[0])) defs += df[1]; }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${n1(x)} ${n1(y)} ${n1(w)} ${n1(h)}"${o.w ? ` width="${o.w}" height="${o.h}"` : ''}${o.cls ? ` class="${xml(o.cls)}"` : ''}${o.label ? ` role="img" aria-label="${xml(o.label)}"` : ' aria-hidden="true"'}><defs>${defs}</defs>${body}</svg>`;
  }
}
