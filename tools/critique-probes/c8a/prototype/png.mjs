// minimal PNG writer (RGBA8), for the throwaway C8a realism prototype
import zlib from 'node:zlib';
import fs from 'node:fs';
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc = b => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
export function writePNG(path, rgba, W, H) {
  const raw = Buffer.alloc((W * 4 + 1) * H);
  for (let y = 0; y < H; y++) { raw[y * (W * 4 + 1)] = 0; Buffer.from(rgba.buffer, rgba.byteOffset + y * W * 4, W * 4).copy(raw, y * (W * 4 + 1) + 1); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 6;
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 6 })), chunk('IEND', Buffer.alloc(0))]);
  fs.writeFileSync(path, png); return png.length;
}
// paste tiles into a sheet
export function sheet(tiles, cols, W, H, gap = 6, bg = [13, 17, 32, 255]) {
  const rows = Math.ceil(tiles.length / cols), SW = cols * W + (cols + 1) * gap, SH = rows * H + (rows + 1) * gap;
  const out = new Uint8ClampedArray(SW * SH * 4);
  for (let i = 0; i < SW * SH; i++) { out[i * 4] = bg[0]; out[i * 4 + 1] = bg[1]; out[i * 4 + 2] = bg[2]; out[i * 4 + 3] = 255; }
  tiles.forEach((t, i) => { const cx = gap + (i % cols) * (W + gap), cy = gap + Math.floor(i / cols) * (H + gap); for (let y = 0; y < H; y++) out.set(t.subarray(y * W * 4, (y + 1) * W * 4), ((cy + y) * SW + cx) * 4); });
  return { rgba: out, W: SW, H: SH };
}
