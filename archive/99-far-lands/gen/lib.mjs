// Small deterministic tools for the far-lands generator: a seeded random stream, gradient noise, exact Euclidean
// distance transforms, polygon and polyline rasterising, a binary heap and a PNG writer. Plain JS, no dependencies.
import zlib from 'node:zlib';

// ---- random: mulberry32, and a hash of integers for noise lattices
export function rng(seed) {
  let a = seed >>> 0;
  const f = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  f.int = (lo, hi) => lo + Math.floor(f() * (hi - lo + 1));
  f.pick = arr => arr[Math.floor(f() * arr.length)];
  f.range = (lo, hi) => lo + f() * (hi - lo);
  f.shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(f() * (i + 1)); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; };
  f.wpick = (arr, w) => { let s = 0; for (const x of arr) s += Math.max(0, w(x)); let r = f() * s; for (const x of arr) { r -= Math.max(0, w(x)); if (r <= 0) return x; } return arr[arr.length - 1]; };
  return f;
}
export const hash3 = (i, j, k) => {
  let h = Math.imul(i | 0, 374761393) ^ Math.imul(j | 0, 668265263) ^ Math.imul(k | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

// ---- gradient noise (2D Perlin with a seeded permutation), in [-1, 1] roughly
export function perlin(seed) {
  const r = rng(seed), p = new Uint8Array(512), g = new Float64Array(512);
  const perm = Array.from({ length: 256 }, (_, i) => i); r.shuffle(perm);
  for (let i = 0; i < 512; i++) { p[i] = perm[i & 255]; g[i] = perm[(i * 7 + 3) & 255] / 256 * Math.PI * 2; }
  const gx = new Float64Array(256), gy = new Float64Array(256);
  for (let i = 0; i < 256; i++) { gx[i] = Math.cos(g[i]); gy[i] = Math.sin(g[i]); }
  const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
  return (x, y) => {
    const X = Math.floor(x), Y = Math.floor(y), xf = x - X, yf = y - Y, xi = X & 255, yi = Y & 255;
    const h = (i, j) => p[p[(xi + i) & 255] + ((yi + j) & 255)];
    const d = (k, dx, dy) => gx[k] * dx + gy[k] * dy;
    const n00 = d(h(0, 0), xf, yf), n10 = d(h(1, 0), xf - 1, yf), n01 = d(h(0, 1), xf, yf - 1), n11 = d(h(1, 1), xf - 1, yf - 1);
    const u = fade(xf), v = fade(yf);
    return 1.41 * ((n00 + u * (n10 - n00)) + v * ((n01 + u * (n11 - n01)) - (n00 + u * (n10 - n00))));
  };
}
export function fbm(noise, oct = 5, lac = 2.03, gain = 0.5) {
  return (x, y) => { let s = 0, a = 1, f = 1, n = 0; for (let o = 0; o < oct; o++) { s += a * noise(x * f + o * 17.31, y * f - o * 9.73); n += a; a *= gain; f *= lac; } return s / n; };
}
export function ridged(noise, oct = 5, lac = 2.1, gain = 0.55) {
  return (x, y) => { let s = 0, a = 1, f = 1, n = 0; for (let o = 0; o < oct; o++) { const v = 1 - Math.abs(noise(x * f + o * 31.7, y * f + o * 11.1)); s += a * v * v; n += a; a *= gain; f *= lac; } return s / n; };
}

// ---- exact squared Euclidean distance transform (Felzenszwalb and Huttenlocher), in cells
const INF = 1e20;
function dt1(f, n, d, v, z) {
  let k = 0; v[0] = 0; z[0] = -INF; z[1] = INF;
  for (let q = 1; q < n; q++) {
    let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
    k++; v[k] = q; z[k] = s; z[k + 1] = INF;
  }
  k = 0;
  for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; }
}
// distance (in cells) from every cell to the nearest cell where src(i) is true
export function edt(w, h, src) {
  const n = Math.max(w, h), f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
  const g = new Float64Array(w * h);
  for (let i = 0; i < w * h; i++) g[i] = src(i) ? 0 : INF;
  for (let x = 0; x < w; x++) { for (let y = 0; y < h; y++) f[y] = g[y * w + x]; dt1(f, h, d, v, z); for (let y = 0; y < h; y++) g[y * w + x] = d[y]; }
  for (let y = 0; y < h; y++) { for (let x = 0; x < w; x++) f[x] = g[y * w + x]; dt1(f, w, d, v, z); for (let x = 0; x < w; x++) g[y * w + x] = Math.sqrt(d[x]); }
  return g;
}

// ---- rasterising, in cell units (a cell's centre is at i + 0.5)
export function fillPolygon(w, h, pts, put) {   // even-odd scanline fill; pts: [[x, y], ...] in cells
  for (let y = 0; y < h; y++) {
    const yc = y + 0.5, xs = [];
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [x1, y1] = pts[j], [x2, y2] = pts[i];
      if ((y1 <= yc && y2 > yc) || (y2 <= yc && y1 > yc)) xs.push(x1 + (yc - y1) / (y2 - y1) * (x2 - x1));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const a = Math.max(0, Math.ceil(xs[k] - 0.5)), b = Math.min(w - 1, Math.floor(xs[k + 1] - 0.5));
      for (let x = a; x <= b; x++) put(y * w + x);
    }
  }
}
export function drawLine(w, h, pts, put) {      // a polyline, one cell wide; pts in cells
  for (let i = 0; i + 1 < pts.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[i + 1], n = Math.ceil(Math.hypot(x2 - x1, y2 - y1) * 2) + 1;
    for (let k = 0; k <= n; k++) {
      const x = Math.floor(x1 + (x2 - x1) * k / n), y = Math.floor(y1 + (y2 - y1) * k / n);
      if (x >= 0 && y >= 0 && x < w && y < h) put(y * w + x);
    }
  }
}
// a smooth curve through control points (Catmull-Rom), for coasts and ranges drawn by hand
export function spline(pts, steps = 6, closed = false) {
  const out = [], n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    for (let s = 0; s < steps; s++) {
      const t = s / steps, t2 = t * t, t3 = t2 * t;
      out.push([0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
    }
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
}

// ---- a binary min-heap of (key, value) pairs
export class Heap {
  constructor() { this.k = []; this.v = []; }
  get size() { return this.k.length; }
  push(key, val) {
    const K = this.k, V = this.v; let i = K.length; K.push(key); V.push(val);
    while (i > 0) { const p = (i - 1) >> 1; if (K[p] < key || (K[p] === key && V[p] <= val)) break; K[i] = K[p]; V[i] = V[p]; i = p; }
    K[i] = key; V[i] = val;
  }
  pop() {
    const K = this.k, V = this.v, top = V[0], tk = K[0], lk = K.pop(), lv = V.pop(), n = K.length;
    if (n) {
      let i = 0;
      for (;;) {
        let c = 2 * i + 1; if (c >= n) break;
        if (c + 1 < n && (K[c + 1] < K[c] || (K[c + 1] === K[c] && V[c + 1] < V[c]))) c++;
        if (lk < K[c] || (lk === K[c] && lv <= V[c])) break;
        K[i] = K[c]; V[i] = V[c]; i = c;
      }
      K[i] = lk; V[i] = lv;
    }
    this.lastKey = tk;
    return top;
  }
}

// ---- PNG (RGB, 8 bits), for the generator's previews
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc = b => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
export function png(w, h, rgb) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; Buffer.from(rgb.buffer, rgb.byteOffset + y * w * 3, w * 3).copy(raw, y * (w * 3 + 1) + 1); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// box blur along one axis (x: 0, y: 1), r cells each side, three passes (close to a gaussian)
export function blur(a, W, H, axis, r) {
  let src = a; const N = W * H;
  for (let pass = 0; pass < 3; pass++) {
    const out = new Float32Array(N), L = axis ? H : W, M = axis ? W : H, st = axis ? W : 1, rowSt = axis ? 1 : W;
    for (let m = 0; m < M; m++) {
      let acc = 0, n = 0; const at = k => m * rowSt + k * st;
      for (let k = -r; k <= r; k++) if (k >= 0 && k < L) { acc += src[at(k)]; n++; }
      for (let k = 0; k < L; k++) {
        out[at(k)] = acc / n;
        const add = k + r + 1, sub = k - r;
        if (add < L) { acc += src[at(add)]; n++; }
        if (sub >= 0) { acc -= src[at(sub)]; n--; }
      }
    }
    src = out;
  }
  return src;
}
export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const lerp = (a, b, t) => a + (b - a) * t;
