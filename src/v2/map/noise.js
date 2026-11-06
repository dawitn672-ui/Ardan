// 2D gradient (Perlin-style) noise, fBm, ridged noise and domain warping.
import { makeRng } from '../rng.js';

export function makeNoise(seed) {
  const rng = makeRng(seed);
  const perm = new Uint8Array(512);
  const p = rng.shuffle([...Array(256).keys()]);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const gx = new Float32Array(256), gy = new Float32Array(256);
  for (let i = 0; i < 256; i++) { const a = rng.float(0, Math.PI * 2); gx[i] = Math.cos(a); gy[i] = Math.sin(a); }
  // inlined corner gradients (same arithmetic as gx[h] * dx + gy[h] * dy per corner): no closure per call
  function noise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const X = xi & 255, Y = yi & 255;
    const py0 = perm[Y], py1 = perm[Y + 1];
    const h00 = perm[X + py0], h10 = perm[X + 1 + py0], h01 = perm[X + py1], h11 = perm[X + 1 + py1];
    const n00 = gx[h00] * xf + gy[h00] * yf, n10 = gx[h10] * (xf - 1) + gy[h10] * yf;
    const n01 = gx[h01] * xf + gy[h01] * (yf - 1), n11 = gx[h11] * (xf - 1) + gy[h11] * (yf - 1);
    const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10), v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
    return (n00 + u * (n10 - n00)) + v * ((n01 + u * (n11 - n01)) - (n00 + u * (n10 - n00)));
  }
  function fbm(x, y, oct = 6, lac = 2, gain = 0.5) {
    let a = 1, f = 1, s = 0, n = 0;
    for (let i = 0; i < oct; i++) { s += a * noise(x * f + i * 17.3, y * f - i * 9.1); n += a; a *= gain; f *= lac; }
    return s / n;
  }
  function ridged(x, y, oct = 5) {
    let a = 0.5, f = 1, s = 0, w = 1;
    for (let i = 0; i < oct; i++) {
      let r = 1 - Math.abs(noise(x * f + 31.7 * i, y * f + 11.3 * i));
      r *= r; r *= w; w = Math.min(1, Math.max(0, r * 2));
      s += r * a; a *= 0.5; f *= 2.05;
    }
    return s;
  }
  function warp(x, y, amt = 1, freq = 1) {
    return [x + amt * fbm(x * freq + 5.2, y * freq + 1.3, 4), y + amt * fbm(x * freq + 9.7, y * freq + 2.8, 4)];
  }
  return { noise, fbm, ridged, warp };
}
