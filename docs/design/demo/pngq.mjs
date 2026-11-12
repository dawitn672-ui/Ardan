// Keeps a sheet's PNG under its size: decode an RGBA/RGB PNG, reduce it to a palette of 256 (median cut, then
// Floyd-Steinberg dither, which paint survives well), and write an indexed PNG. Plain Node, zlib only.
import zlib from 'node:zlib';

export function decode(buf) {
  let p = 8, W = 0, H = 0, ct = 0; const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString('latin1', p + 4, p + 8), d = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { W = d.readUInt32BE(0); H = d.readUInt32BE(4); ct = d[9]; if (d[8] !== 8) throw new Error('8-bit only'); }
    if (type === 'IDAT') idat.push(d);
    p += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat)), bpp = ct === 6 ? 4 : 3, stride = W * bpp, out = new Uint8Array(W * H * 3);
  let prev = new Uint8Array(stride), cur = new Uint8Array(stride);
  for (let y = 0; y < H; y++) {
    const f = raw[y * (stride + 1)], row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0, b = prev[i], c = i >= bpp ? prev[i - bpp] : 0;
      let v = row[i];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      cur[i] = v & 255;
    }
    for (let x = 0; x < W; x++) for (let k = 0; k < 3; k++) out[(y * W + x) * 3 + k] = cur[x * bpp + k];
    [prev, cur] = [cur, prev];
  }
  return { W, H, rgb: out };
}

function palette(rgb, n = 256) {
  // median cut on a 5-bit histogram
  const hist = new Map();
  for (let i = 0; i < rgb.length; i += 3) { const k = (rgb[i] >> 3) << 10 | (rgb[i + 1] >> 3) << 5 | (rgb[i + 2] >> 3); hist.set(k, (hist.get(k) || 0) + 1); }
  const cols = [...hist].map(([k, c]) => [((k >> 10) & 31) * 8 + 4, ((k >> 5) & 31) * 8 + 4, (k & 31) * 8 + 4, c]);
  let boxes = [cols];
  while (boxes.length < n) {
    let bi = -1, best = 0, ch = 0;
    boxes.forEach((b, i) => { if (b.length < 2) return; for (let c = 0; c < 3; c++) { let lo = 255, hi = 0; for (const v of b) { lo = Math.min(lo, v[c]); hi = Math.max(hi, v[c]); } const s = (hi - lo) * Math.sqrt(b.reduce((a, v) => a + v[3], 0)); if (s > best) { best = s; bi = i; ch = c; } } });
    if (bi < 0) break;
    const b = boxes[bi].sort((x, y) => x[ch] - y[ch]); let tot = b.reduce((a, v) => a + v[3], 0) / 2, m = 0, acc = 0;
    for (; m < b.length - 1; m++) { acc += b[m][3]; if (acc >= tot) break; }
    boxes.splice(bi, 1, b.slice(0, m + 1), b.slice(m + 1));
  }
  return boxes.filter(b => b.length).map(b => { const w = b.reduce((a, v) => a + v[3], 0); return [0, 1, 2].map(c => Math.round(b.reduce((a, v) => a + v[c] * v[3], 0) / w)); });
}

const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc = b => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };

export function quantize(pngBuf, n = 256) {
  const { W, H, rgb } = decode(pngBuf), pal = palette(rgb, n);
  const err = new Float32Array(W * 3 * 2), idx = Buffer.alloc((W + 1) * H);
  const cache = new Map();
  const nearest = (r, g, b) => { const k = (r >> 2) << 12 | (g >> 2) << 6 | (b >> 2); let v = cache.get(k); if (v !== undefined) return v; let bd = 1e9; v = 0; for (let i = 0; i < pal.length; i++) { const p = pal[i], d = (p[0] - r) ** 2 * 3 + (p[1] - g) ** 2 * 4 + (p[2] - b) ** 2 * 2; if (d < bd) { bd = d; v = i; } } cache.set(k, v); return v; };
  for (let y = 0; y < H; y++) {
    const cr = (y & 1) * W * 3, nr = ((y + 1) & 1) * W * 3; err.fill(0, nr, nr + W * 3);
    idx[y * (W + 1)] = 0;
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 3, c = [0, 1, 2].map(k => Math.max(0, Math.min(255, rgb[o + k] + err[cr + x * 3 + k] * 0.8)));
      const i = nearest(c[0] | 0, c[1] | 0, c[2] | 0), p = pal[i]; idx[y * (W + 1) + 1 + x] = i;
      for (let k = 0; k < 3; k++) { const e = c[k] - p[k]; if (x + 1 < W) err[cr + (x + 1) * 3 + k] += e * 7 / 16; if (x > 0) err[nr + (x - 1) * 3 + k] += e * 3 / 16; err[nr + x * 3 + k] += e * 5 / 16; if (x + 1 < W) err[nr + (x + 1) * 3 + k] += e / 16; }
    }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 3;
  const plte = Buffer.from(pal.flat());
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('PLTE', plte), chunk('IDAT', zlib.deflateSync(idx, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
