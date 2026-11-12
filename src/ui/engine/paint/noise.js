// Integer-hashed noise for the painter: the same bits in every browser (characters.md §11, "Determinism").
// Every choice that looks random in a portrait (pores, a strand's path, a crease's place, a scar's ragged edge)
// is a hash of the person's id and a named channel, never A.rand, Math.random or the clock.

export function hash32(a, b = 0, c = 0) {
  let h = Math.imul(a | 0, 0x9e3779b1) ^ Math.imul(b | 0, 0x85ebca77) ^ Math.imul(c | 0, 0xc2b2ae3d);
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; h = Math.imul(h, 0x297a2d39); h ^= h >>> 15;
  return h >>> 0;
}
// a string (an id, a channel name) to 32 bits
export function strHash(s) {
  s = String(s); let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return hash32(h, s.length);
}
// a stream of floats 0..1 from a seed: for one-off choices (where a crease lies, which tooth is gone)
export function stream(seed) {
  let s = seed >>> 0 || 1;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const U = 1 / 4294967296;
const fade = t => t * t * (3 - 2 * t);
// value noise in 3D, -1..1, smooth; seed picks an independent field
export function noise3(x, y, z, seed = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const fx = fade(x - xi), fy = fade(y - yi), fz = fade(z - zi);
  const h = (i, j, k) => hash32(xi + i + seed * 7919, yi + j, zi + k) * U;
  const x00 = h(0, 0, 0) + (h(1, 0, 0) - h(0, 0, 0)) * fx, x10 = h(0, 1, 0) + (h(1, 1, 0) - h(0, 1, 0)) * fx;
  const x01 = h(0, 0, 1) + (h(1, 0, 1) - h(0, 0, 1)) * fx, x11 = h(0, 1, 1) + (h(1, 1, 1) - h(0, 1, 1)) * fx;
  const y0 = x00 + (x10 - x00) * fy, y1 = x01 + (x11 - x01) * fy;
  return (y0 + (y1 - y0) * fz) * 2 - 1;
}
export function noise2(x, y, seed = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = fade(x - xi), fy = fade(y - yi);
  const a = hash32(xi + seed * 7919, yi) * U, b = hash32(xi + 1 + seed * 7919, yi) * U;
  const c = hash32(xi + seed * 7919, yi + 1) * U, d = hash32(xi + 1 + seed * 7919, yi + 1) * U;
  return ((a + (b - a) * fx) + ((c + (d - c) * fx) - (a + (b - a) * fx)) * fy) * 2 - 1;
}
export function fbm3(x, y, z, oct = 4, seed = 0) {
  let a = 0.5, s = 0, n = 0, f = 1;
  for (let i = 0; i < oct; i++) { s += a * noise3(x * f, y * f, z * f, seed + i * 13); n += a; a *= 0.5; f *= 2.03; }
  return s / n;
}
export function fbm2(x, y, oct = 4, seed = 0) {
  let a = 0.5, s = 0, n = 0, f = 1;
  for (let i = 0; i < oct; i++) { s += a * noise2(x * f, y * f, seed + i * 13); n += a; a *= 0.5; f *= 2.03; }
  return s / n;
}
// cellular noise in 2D: distance to the nearest jittered point (pits, pores, rivets, pox)
export function cell2(x, y, seed = 0) {
  const xi = Math.floor(x), yi = Math.floor(y); let best = 9, id = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const hh = hash32(xi + i + seed * 7919, yi + j, 77);
    const px = xi + i + (hh & 1023) / 1023, py = yi + j + ((hh >>> 10) & 1023) / 1023;
    const d = (x - px) * (x - px) + (y - py) * (y - py);
    if (d < best) { best = d; id = hh; }
  }
  return { d: Math.sqrt(best), id };
}
