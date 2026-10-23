// Read and write the packed blobs inside an Ardan build (base-122 style text over zstd).
// The page's bootloader decodes: chars < 128 carry 7 bits; a 2-byte char carries an
// "illegal" 7-bit group (NUL, CR, '<') plus the next group, or (k = 7) one final group.
import zlib from 'node:zlib';

export const BLOBS = ['ardan-core', 'ardan-content', 'ardan-lore'];
const ILL = [0, 13, 60];

const blobRe = id => new RegExp(`(<script type="text/plain" id="${id}" data-n=")(\\d+)(">)([\\s\\S]*?)(</script>)`);

export function decodeText(s, n) {
  const out = new Uint8Array(n);
  let o = 0, acc = 0, bits = 0;
  const push = v => { acc = (acc << 7) | v; bits += 7; if (bits >= 8) { bits -= 8; if (o < n) out[o++] = (acc >> bits) & 255; acc &= (1 << bits) - 1; } };
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 128) { push(c); continue; }
    const d = c - 128, k = d >> 7, v = d & 127;
    if (k < 7) push(ILL[k]);
    push(v);
  }
  return out;
}

export function encodeBytes(bytes) {
  const groups = [];
  let acc = 0, bits = 0;
  for (const b of bytes) {
    acc = (acc << 8) | b; bits += 8;
    while (bits >= 7) { bits -= 7; groups.push((acc >> bits) & 127); acc &= (1 << bits) - 1; }
  }
  if (bits > 0) groups.push((acc << (7 - bits)) & 127);
  let s = '';
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i], k = ILL.indexOf(g);
    if (k < 0) { s += String.fromCharCode(g); continue; }
    if (i + 1 < groups.length) { s += String.fromCharCode(128 + (k << 7) + groups[++i]); }
    else s += String.fromCharCode(128 + (7 << 7) + g);
  }
  return s;
}

export function unpack(html) {
  const parts = {};
  for (const id of BLOBS) {
    const m = html.match(blobRe(id));
    if (!m) throw new Error('blob not found: ' + id);
    const bytes = decodeText(m[4], +m[2]);
    parts[id] = Buffer.from(zlib.zstdDecompressSync(bytes)).toString('utf8');
  }
  return parts;
}

export function repack(html, parts, level = 19) {
  for (const id of BLOBS) {
    if (parts[id] == null) continue;
    const z = zlib.zstdCompressSync(Buffer.from(parts[id], 'utf8'), {
      params: { [zlib.constants.ZSTD_c_compressionLevel]: level, [zlib.constants.ZSTD_c_checksumFlag]: 1 },
    });
    const enc = encodeBytes(z);
    html = html.replace(blobRe(id), (_, a, _n, b, _s, c) => a + z.length + b + enc + c);
  }
  return html;
}
