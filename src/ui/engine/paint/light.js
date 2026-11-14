// Light on form (characters.md §1): one window up and to the left, a cool fill toward indigo, a warm bounce from below
// and a thin edge light on the shadowed side. Skin lets light in (a warm terminator, blood at the shadow's edge), hair
// shines in a band across its strands, metal mirrors the room, wool drinks light and velvet glows at the turn.
// Everything is in linear light; out() tone-maps to sRGB bytes. No pure black or white: the darkest dark is the ink.

const nrm = (x, y, z) => { const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
export const KEY = nrm(-0.46, 0.5, 0.74);
export const FILL = nrm(0.8, 0.05, 0.6);
export const BOUNCE = nrm(0.1, -1, 0.35);
export const RIM = nrm(0.9, 0.3, -0.35);
export const KEY_C = [1.8, 1.68, 1.5], FILL_C = [0.15, 0.15, 0.25], BOUNCE_C = [0.1, 0.075, 0.055], SKY_C = [0.05, 0.05, 0.075], RIM_C = [0.55, 0.6, 0.78];
const H_KEY = nrm(KEY[0], KEY[1], KEY[2] + 1);
export const INK = [0.0108, 0.0084, 0.0296];   // #1b1730 in linear light

const C3 = [0, 0, 0];
// diffuse and ambient for a surface; wrap is per channel for skin (light reaches round the terminator in red first)
export function diffuse(alb, n, ao, sh, wrap, out = C3, opt = {}) {
  const ndl = n[0] * KEY[0] + n[1] * KEY[1] + n[2] * KEY[2];
  const fill = 0.5 + 0.5 * (n[0] * FILL[0] + n[1] * FILL[1] + n[2] * FILL[2]);
  const bnc = Math.max(0, n[0] * BOUNCE[0] + n[1] * BOUNCE[1] + n[2] * BOUNCE[2]);
  const sky = 0.6 + 0.4 * n[1];
  const aoD = Math.sqrt(ao);
  for (let c = 0; c < 3; c++) {
    const w = wrap[c];
    let d = (ndl + w) / (1 + w); d = d < 0 ? 0 : d;
    if (w > 0.3) d = d * d * (3 - 2 * Math.min(1, d)) * 0.5 + d * 0.5;   // a soft turn
    // shadow edges bleed warm in skin (opt.sss)
    const s = opt.sss ? Math.pow(sh, c === 0 ? 0.9 : c === 1 ? 0.98 : 1.02) : sh;
    const aoc = opt.sss ? Math.pow(ao, c === 0 ? 0.95 : c === 1 ? 1.0 : 1.04) : ao;
    out[c] = alb[c] * (KEY_C[c] * d * s * aoD + (FILL_C[c] * fill + BOUNCE_C[c] * bnc + SKY_C[c] * sky) * aoc);
  }
  return out;
}
// a lobe of light from the window, with Fresnel; p is tightness
export function specular(n, sh, p, k) {
  const nh = Math.max(0, n[0] * H_KEY[0] + n[1] * H_KEY[1] + n[2] * H_KEY[2]);
  const f = 0.04 + 0.96 * Math.pow(1 - Math.max(0, n[2]), 5);
  return k * Math.pow(nh, p) * (0.35 + f) * sh * (p + 8) / 60;
}
export function rim(n, k = 1) {
  const fr = Math.pow(1 - Math.max(0, n[2]), 3), d = Math.max(0, n[0] * RIM[0] + n[1] * RIM[1] + n[2] * RIM[2]);
  return fr * d * k;
}
// the room as seen in metal: a bright window high on the left, dark beams, a warm floor, the cool far wall
export function room(rx, ry, rz) {
  const up = ry, side = rx;
  let c0 = 0.05 + 0.05 * up, c1 = 0.05 + 0.05 * up, c2 = 0.07 + 0.07 * up;
  if (up < -0.1) { const t = Math.min(1, (-up - 0.1) * 2); c0 = 0.12 * t + c0 * (1 - t); c1 = 0.08 * t + c1 * (1 - t); c2 = 0.05 * t + c2 * (1 - t); }
  // the window: a soft rectangle up-left, with a mullion
  const wx = side + 0.55, wy = up - 0.5;
  if (Math.abs(wx) < 0.35 && Math.abs(wy) < 0.4 && rz > -0.3) {
    const e = (1 - Math.max(Math.abs(wx) / 0.35, Math.abs(wy) / 0.4)) * 6, m = Math.abs(wx) < 0.025 || Math.abs(wy) < 0.025 ? 0.35 : 1;
    const b = Math.min(1, e) * m * 3.2; c0 += b; c1 += b * 0.97; c2 += b * 0.9;
  }
  // the fire's glow low on the right
  if (side > 0.4 && up < 0.1) { const t = Math.min(1, (side - 0.4) * 2) * Math.min(1, (0.1 - up) * 3) * 0.25; c0 += t; c1 += t * 0.6; c2 += t * 0.3; }
  // the horizon line of the room
  const hz = Math.exp(-Math.pow((up + 0.05) / 0.06, 2)) * 0.12; c0 += hz; c1 += hz; c2 += hz * 1.1;
  return [c0, c1, c2];
}
// filmic curve to bytes, keeping the ink as the floor
export function out(c, i, buf, a = 1, bg = null) {
  for (let k = 0; k < 3; k++) {
    let x = Math.max(0, c[k]);
    x = (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14);
    x = INK[k] + x * (0.985 - INK[k]);
    let s = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
    if (bg && a < 1) s = s * a + bg[k] * (1 - a);
    buf[i + k] = s * 255;
  }
  buf[i + 3] = 255;
}
