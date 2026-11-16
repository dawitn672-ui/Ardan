// Gate 2 · geometry, dice and colour. Plain functions on [x, y] points; nothing here touches the page.
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const mix = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
export const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
export const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
export const mul = (p, k) => [p[0] * k, p[1] * k];
export const len = p => Math.hypot(p[0], p[1]);
export const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
export const norm = p => { const l = Math.hypot(p[0], p[1]) || 1; return [p[0] / l, p[1] / l]; };
export const perp = p => [-p[1], p[0]];
export const rot = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; };
export const rad = d => d * Math.PI / 180;
export const dir = a => [Math.sin(a), Math.cos(a)];          // 0 = straight down the page, + = toward screen right
export const n1 = x => (Math.round(x * 10) / 10).toString();
const pt = p => n1(p[0]) + ' ' + n1(p[1]);

// --- dice: one seeded stream per (id, channel); the parts never call Math.random -------------------------------------
export function stream(id, ch = '') {
  let h = 2166136261; const s = String(id) + '|' + ch;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  let a = h >>> 0;
  const r = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  r.f = (lo, hi) => lo + (hi - lo) * r();
  r.i = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  r.s = () => r() * 2 - 1;
  r.pick = arr => arr[Math.floor(r() * arr.length)];
  return r;
}

// --- curves ---------------------------------------------------------------------------------------------------------
// A curve THROUGH its points (Catmull-Rom as cubics). t: smoothness of each point, 1 smooth .. 0 a corner (number or array).
function crSegs(pts, closed, t) {
  const n = pts.length, T = i => (Array.isArray(t) ? (t[i] ?? 1) : t);
  const P = i => closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)];
  const tan = i => { const a = P(i - 1), b = P(i + 1), k = T(((i % n) + n) % n) / 6; return [(b[0] - a[0]) * k, (b[1] - a[1]) * k]; };
  const segs = [], m = closed ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const p0 = P(i), p1 = P(i + 1), t0 = tan(i), t1 = tan(i + 1);
    segs.push([p0, [p0[0] + t0[0], p0[1] + t0[1]], [p1[0] - t1[0], p1[1] - t1[1]], p1]);
  }
  return segs;
}
export function spl(pts, closed = false, t = 1) {
  if (pts.length < 2) return '';
  let d = 'M' + pt(pts[0]);
  for (const s of crSegs(pts, closed, t)) d += 'C' + pt(s[1]) + ' ' + pt(s[2]) + ' ' + pt(s[3]);
  return d + (closed ? 'Z' : '');
}
// the same curve continued from where a path already is (to join curves into one outline)
export function splTo(pts, t = 1) { let d = ''; for (const s of crSegs(pts, false, t)) d += 'C' + pt(s[1]) + ' ' + pt(s[2]) + ' ' + pt(s[3]); return d; }
// the same curve as points (for offsetting, inking and clipping)
export function splPts(pts, closed = false, t = 1, per = 6) {
  if (pts.length < 2) return pts.slice();
  const out = [];
  for (const [p0, c0, c1, p1] of crSegs(pts, closed, t)) for (let j = 0; j < per; j++) {
    const s = j / per, a = (1 - s) ** 3, b = 3 * (1 - s) ** 2 * s, c = 3 * (1 - s) * s * s, e = s ** 3;
    out.push([a * p0[0] + b * c0[0] + c * c1[0] + e * p1[0], a * p0[1] + b * c0[1] + c * c1[1] + e * p1[1]]);
  }
  if (!closed) out.push(pts[pts.length - 1]);
  return out;
}
// A control polygon with rounded corners: k = 1 a smooth blob through the edge midpoints .. 0 the sharp polygon.
export function poly(pts, k = 1, closed = true) {
  const n = pts.length; if (n < 2) return '';
  const K = i => clamp(Array.isArray(k) ? (k[i] ?? 1) : k, 0, 1) / 2;
  if (closed) {
    let d = '';
    for (let i = 0; i < n; i++) {
      const a = pts[(i + n - 1) % n], b = pts[i], c = pts[(i + 1) % n], kk = K(i);
      d += (i ? 'L' : 'M') + pt(mix(b, a, kk)) + (kk > 0 ? 'Q' + pt(b) + ' ' + pt(mix(b, c, kk)) : '');
    }
    return d + 'Z';
  }
  let d = 'M' + pt(pts[0]);
  for (let i = 1; i < n - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1], kk = K(i);
    d += 'L' + pt(mix(b, a, kk)) + (kk > 0 ? 'Q' + pt(b) + ' ' + pt(mix(b, c, kk)) : '');
  }
  return d + 'L' + pt(pts[n - 1]);
}
export const polyline = (pts, closed = false) => 'M' + pts.map(pt).join('L') + (closed ? 'Z' : '');
// the rounded polygon as points
export function polyPts(pts, k = 1, closed = true, per = 5) {
  const n = pts.length, out = [], K = i => clamp(Array.isArray(k) ? (k[i] ?? 1) : k, 0, 1) / 2;
  const i0 = closed ? 0 : 1, i1 = closed ? n : n - 1;
  if (!closed) out.push(pts[0]);
  for (let i = i0; i < i1; i++) {
    const a = pts[(i + n - 1) % n], b = pts[i], c = pts[(i + 1) % n], kk = K(i);
    if (kk <= 0) { out.push(b); continue; }
    const e = mix(b, a, kk), x = mix(b, c, kk);
    for (let j = 0; j <= per; j++) { const s = j / per, u = 1 - s; out.push([u * u * e[0] + 2 * u * s * b[0] + s * s * x[0], u * u * e[1] + 2 * u * s * b[1] + s * s * x[1]]); }
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
}
export const circle = (c, r, n = 12) => { const o = []; for (let i = 0; i < n; i++) { const a = i / n * 2 * Math.PI; o.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]); } return o; };
export const ellPts = (c, rx, ry, a = 0, n = 12) => circle([0, 0], 1, n).map(p => add(c, rot([p[0] * rx, p[1] * ry], a)));
export const ell = (c, rx, ry, a = 0) => spl(ellPts(c, rx, ry, a, 8), true);

// points offset to the left of travel by d (a number or a function of 0..1)
export function offset(pts, d) {
  const n = pts.length, out = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], t = norm(sub(b, a));
    const w = typeof d === 'function' ? d(i / (n - 1)) : d;
    out.push([pts[i][0] + t[1] * w, pts[i][1] - t[0] * w]);
  }
  return out;
}
// width profiles for an inked stroke
export const taper = (w, a = 0.6) => t => w * Math.sin(Math.PI * clamp(t)) ** a;                      // thin at both ends
export const swell = (w0, w1, at = 0.7) => t => (t < at ? lerp(w0, w1, t / at) : w1 * Math.sqrt(Math.max(0, 1 - ((t - at) / (1 - at)) ** 2)));
export const fade = (w, from = 0) => t => w * (from ? clamp(t * 4) : 1) * Math.sqrt(clamp(1 - t));          // full, then to a point
// an inked stroke: a centre line and a width along it (a number tapers both ends; a function of 0..1; or [w0, wMid, w1])
export function ink(pts, w) {
  const wf = typeof w === 'function' ? w : Array.isArray(w) ? (t => t < 0.5 ? lerp(w[0], w[1], t * 2) : lerp(w[1], w[2], t * 2 - 1)) : taper(w);
  const L = offset(pts, t => wf(t) / 2), R = offset(pts, t => -wf(t) / 2).reverse();
  return 'M' + L.map(pt).join('L') + 'L' + R.map(pt).join('L') + 'Z';
}
export const along = (pts, t) => { const x = clamp(t) * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(x)); return mix(pts[i], pts[i + 1], x - i); };
export const part = (pts, t0, t1, n = 10) => { const o = []; for (let i = 0; i <= n; i++) o.push(along(pts, lerp(t0, t1, i / n))); return o; };
export const tangentAt = (pts, t) => norm(sub(along(pts, Math.min(1, t + 0.02)), along(pts, Math.max(0, t - 0.02))));
// a blade (a lock of hair, a tuft of fur, a leaf): from a root of width w to a point, bent sideways by `bend`
export function blade(root, tip, w, bend = 0, belly = 0.4) {
  const ax = sub(tip, root), n = norm(perp(ax)), l = len(ax);
  const c = add(mix(root, tip, belly), mul(n, bend * l));
  const a = add(root, mul(n, w / 2)), b = sub(root, mul(n, w / 2));
  const ca = add(c, mul(n, w * 0.55)), cb = sub(c, mul(n, w * 0.55));
  return { d: 'M' + pt(a) + 'Q' + pt(ca) + ' ' + pt(tip) + 'Q' + pt(cb) + ' ' + pt(b) + 'Z', e: 'M' + pt(a) + 'Q' + pt(ca) + ' ' + pt(tip) + 'Q' + pt(cb) + ' ' + pt(b), mid: c, n, a, b, tip };
}
// --- colour ---------------------------------------------------------------------------------------------------------
export const hex2rgb = h => { const x = parseInt(h.slice(1), 16); return [(x >> 16) & 255, (x >> 8) & 255, x & 255]; };
export const rgb2hex = c => '#' + c.map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
export const mixc = (a, b, t) => { const p = hex2rgb(a), q = hex2rgb(b); return rgb2hex([lerp(p[0], q[0], t), lerp(p[1], q[1], t), lerp(p[2], q[2], t)]); };
export function hsl(h) {
  const [r, g, b] = hex2rgb(h).map(v => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1)); const hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(hh * 60 + 360) % 360, s, l];
}
export function fromHsl(h, s, l) {
  h = ((h % 360) + 360) % 360; s = clamp(s); l = clamp(l);
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return rgb2hex([(r + m) * 255, (g + m) * 255, (b + m) * 255]);
}
// a ramp from one local colour: shadows turn cooler and richer, lights warmer (never a plain darkening)
export function ramp(base, o = {}) {
  const [h, s, l] = hsl(base), toward = (h > 40 && h < 250) ? 1 : -1;   // the hue walks toward blue-violet in shadow
  const sh = (dl, ds, dh) => fromHsl(h + toward * dh, clamp(s * ds + (s < 0.08 ? 0.03 : 0)), clamp(l + dl));
  return {
    b: base,
    s: o.s || sh(-0.10 - l * 0.09, 1.1, 8),
    d: o.d || sh(-0.20 - l * 0.18, 1.15, 16),
    l: o.l || fromHsl(h - toward * 6, s * 0.85, clamp(l + 0.08 + (1 - l) * 0.16)),
    k: o.k || fromHsl(h + toward * 18, clamp(s * 0.9 + 0.05), clamp(l * 0.24, 0.045, 0.17)),
  };
}
