// Satellite-style renderer: biome albedo blended by elevation, multi-light hillshade,
// depth-graded ocean with a turquoise shelf, rivers by flow, optional realm borders.
// Returns RGBA Uint8ClampedArray (works for canvas ImageData and for PNG in Node).
import { BIOME } from './continent.js';
import { clamp, lerp, smoothstep } from '../rng.js';
import { makeNoise } from './noise.js';

// Muted, natural albedos sampled from real satellite mosaics (not saturated cartoon greens).
const ALBEDO = {
  [BIOME.BEACH]: [205, 192, 160],
  [BIOME.GRASSLAND]: [128, 140, 82],
  [BIOME.TEMPERATE_FOREST]: [62, 92, 50],
  [BIOME.BOREAL_FOREST]: [52, 72, 52],
  [BIOME.STEPPE]: [160, 150, 102],
  [BIOME.DESERT]: [206, 178, 128],
  [BIOME.SCRUB]: [140, 128, 86],
  [BIOME.WETLAND]: [72, 92, 66],
  [BIOME.TUNDRA]: [134, 132, 112],
  [BIOME.ALPINE]: [120, 112, 100],
  [BIOME.SNOW]: [236, 238, 242],
  [BIOME.RAINFOREST]: [40, 78, 40],
};

export function renderMap(map, opts = {}) {
  const scale = opts.scale ?? 1; // output pixels per map cell (LOD: >1 adds detail noise)
  const { W, H, elev, biome, acc, moist, temp } = map;
  const reg = opts.region ?? { x: 0, y: 0, w: W, h: H };
  const OW = Math.round(reg.w * scale), OH = Math.round(reg.h * scale);
  const out = new Uint8ClampedArray(OW * OH * 4);
  const det = makeNoise(map.seed + ':detail');
  const sampleE = (x, y) => bilinear(elev, W, H, x, y);
  const t = opts.time ?? 0; // animation time in seconds (cloud drift, water shimmer)
  const showBorders = opts.borders && map.provinces;
  const realmOf = opts.realmOfProvince;
  const borderColor = opts.borderColor ?? [250, 240, 210];

  for (let oy = 0; oy < OH; oy++) for (let ox = 0; ox < OW; ox++) {
    const x = reg.x + ox / scale, y = reg.y + oy / scale;
    const xi = clamp(Math.round(x), 0, W - 1), yi = clamp(Math.round(y), 0, H - 1), k = yi * W + xi;
    // detail octaves appear only when zoomed in (level of detail)
    const lod = scale > 1 ? det.fbm(x * 0.35, y * 0.35, 4) * 0.012 * Math.min(1, (scale - 1) / 3) : 0;
    let e = sampleE(x, y) + (sampleE(x, y) > 0 ? lod : 0);
    let r, g, b;
    if (e <= 0) {
      const od = map.oceanDepth ? bilinear(map.oceanDepth, W, H, x, y) : e;
      const d = clamp(-Math.min(e, od * 0.7 + e * 0.3) / 0.3, 0, 1);
      const shallow = [86, 150, 160], mid = [32, 80, 112], deep = [14, 34, 62];
      const c = d < 0.18 ? mix(shallow, mid, smoothstep(0, 0.18, d)) : mix(mid, deep, smoothstep(0.18, 1, d));
      if (biome[k] === BIOME.LAKE) { c[0] = 46; c[1] = 92; c[2] = 118; }
      const shimmer = opts.animate ? 6 * Math.sin(x * 0.9 + y * 0.6 + t * 1.4) * (1 - d) : 0;
      [r, g, b] = [c[0] + shimmer, c[1] + shimmer, c[2] + shimmer * 1.2];
      // surf: lighter band right at the coast
      const coast = map.coastDist ? 0 : 0;
      const surf = 1 - smoothstep(0, 0.012, -e); r += 16 * surf; g += 20 * surf; b += 16 * surf;
    } else {
      // blend albedo of neighbouring biomes so edges are soft, like real vegetation gradients
      // continuous climate colour (no hard biome blobs) + fine mottling texture
      const m = bilinear(moist, W, H, x, y), tc = bilinear(temp, W, H, x, y);
      const c = climateColor(tc, m);
      const mott = 1 + det.fbm(x * 0.6, y * 0.6, 3) * 0.16 + det.fbm(x * 2.2, y * 2.2, 2) * 0.08 * Math.min(1, scale / 2);
      c[0] *= mott; c[1] *= mott; c[2] *= mott;
      if (biome[k] === BIOME.WETLAND) { c[0] *= 0.85; c[1] *= 0.92; }
      if (biome[k] === BIOME.BEACH) { const bc = ALBEDO[BIOME.BEACH]; c[0] = lerp(c[0], bc[0], 0.5); c[1] = lerp(c[1], bc[1], 0.5); c[2] = lerp(c[2], bc[2], 0.5); }
      // bare rock on steep high ground
      const slope = gradMag(sampleE, x, y);
      const rock = smoothstep(0.004, 0.012, slope) * smoothstep(0.12, 0.32, e);
      const rockC = [118, 108, 98];
      const snowLine = 0.42 - (temp[k] - 0) * 0.002;
      const snow = smoothstep(snowLine - 0.04, snowLine + 0.03, e) * (1 - smoothstep(0.012, 0.03, slope) * 0.5);
      let col = mix(c, rockC, rock * 0.7);
      col = mix(col, [238, 240, 244], clamp(snow, 0, 1));
      // hillshade: key light from NW + soft fill
      const sh = hillshade(sampleE, x, y, scale);
      const ao = 0.85 + 0.15 * smoothstep(0, 0.2, e);
      const lit = (0.42 + 0.8 * sh) * ao;
      [r, g, b] = [col[0] * lit, col[1] * lit, col[2] * lit];
      // rivers
      if (opts.rivers === 'raster') {
        const a = acc[k];
        const thr = opts.riverThreshold ?? 260;
        if (a > thr && biome[k] !== BIOME.SNOW) {
          const w = clamp(Math.log(a / thr) / 3, 0.25, 1);
          const river = [58, 98, 122];
          r = lerp(r, river[0], w); g = lerp(g, river[1], w); b = lerp(b, river[2], w);
        }
      }
    }
    // atmospheric haze + cloud shadows (subtle, animated if requested)
    if (opts.clouds) {
      const cl = det.fbm(x / 60 + t * 0.01, y / 60 + t * 0.004, 5);
      const cover = smoothstep(0.12, 0.42, cl);
      r = lerp(r, 245, cover * 0.55); g = lerp(g, 247, cover * 0.55); b = lerp(b, 250, cover * 0.55);
      const shadow = smoothstep(0.12, 0.42, det.fbm((x + 4) / 60 + t * 0.01, (y + 5) / 60 + t * 0.004, 5));
      r *= 1 - shadow * 0.18; g *= 1 - shadow * 0.18; b *= 1 - shadow * 0.15;
    }
    if (showBorders) {
      const o = map.provinces.owner;
      const k2 = clamp(Math.round(y), 0, H - 1) * W + clamp(Math.round(x) + 1, 0, W - 1);
      const k3 = clamp(Math.round(y) + 1, 0, H - 1) * W + clamp(Math.round(x), 0, W - 1);
      const a = o[k], bR = o[k2], bD = o[k3];
      const ra = realmOf ? realmOf(a) : a, rb = realmOf ? realmOf(bR) : bR, rc = realmOf ? realmOf(bD) : bD;
      if (a >= 0 && ((bR >= 0 && ra !== rb) || (bD >= 0 && ra !== rc))) {
        r = lerp(r, borderColor[0], 0.75); g = lerp(g, borderColor[1], 0.75); b = lerp(b, borderColor[2], 0.75);
      }
    }
    if (Math.abs(e) < 0.004 && e > 0) { const a = smoothstep(0, 0.004, e); r = lerp(150, r, a); g = lerp(170, g, a); b = lerp(160, b, a); }
    const p = (oy * OW + ox) * 4;
    out[p] = r; out[p + 1] = g; out[p + 2] = b; out[p + 3] = 255;
  }
  return { width: OW, height: OH, data: out };
}

// temperature (-6..26 C) x moisture (0..1.2) palette, bilinear
const PAL_T = [-6, 4, 13, 22];
const PAL = [ // rows: temp bands; cols: dry, mid, wet
  [[150, 146, 128], [128, 128, 112], [104, 110, 96]],
  [[150, 142, 108], [92, 104, 70], [50, 70, 50]],
  [[170, 158, 112], [122, 134, 78], [60, 90, 50]],
  [[212, 184, 134], [156, 140, 92], [46, 82, 44]],
];
function climateColor(t, m) {
  let i = 0; while (i < PAL_T.length - 2 && t > PAL_T[i + 1]) i++;
  const tt = clamp((t - PAL_T[i]) / (PAL_T[i + 1] - PAL_T[i]), 0, 1);
  const mm = clamp(m / 1.0, 0, 1) * 2; const j = Math.min(1, Math.floor(mm)); const mf = mm - j;
  const row = (r) => mix(PAL[r][j], PAL[r][j + 1], mf);
  return mix(row(i), row(i + 1), tt);
}

function mix(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }

function bilinear(a, W, H, x, y) {
  x = clamp(x, 0, W - 1.001); y = clamp(y, 0, H - 1.001);
  const xi = Math.floor(x), yi = Math.floor(y), u = x - xi, v = y - yi, k = yi * W + xi;
  return a[k] * (1 - u) * (1 - v) + a[k + 1] * u * (1 - v) + a[k + W] * (1 - u) * v + a[k + W + 1] * u * v;
}

function gradMag(sample, x, y) {
  const dx = sample(x + 1, y) - sample(x - 1, y), dy = sample(x, y + 1) - sample(x, y - 1);
  return Math.hypot(dx, dy) * 0.5;
}

function hillshade(sample, x, y, scale) {
  const s = 1 / Math.max(1, scale) + 0.5;
  const dx = (sample(x + s, y) - sample(x - s, y)) / (2 * s);
  const dy = (sample(x, y + s) - sample(x, y - s)) / (2 * s);
  const z = 90; // vertical exaggeration
  let nx = -dx * z, ny = -dy * z, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
  const key = Math.max(0, nx * -0.55 + ny * -0.55 + nz * 0.63);
  const fill = Math.max(0, nx * 0.4 + ny * 0.2 + nz * 0.9) * 0.25;
  return clamp(key * 0.85 + fill, 0, 1.2);
}

function blendBiome(map, x, y) {
  const { W, H, biome } = map;
  let r = 0, g = 0, b = 0, w = 0;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const xx = clamp(Math.round(x) + dx, 0, W - 1), yy = clamp(Math.round(y) + dy, 0, H - 1);
    const c = ALBEDO[biome[yy * W + xx]]; if (!c) continue;
    const ww = dx === 0 && dy === 0 ? 2 : 1;
    r += c[0] * ww; g += c[1] * ww; b += c[2] * ww; w += ww;
  }
  return w ? [r / w, g / w, b / w] : [120, 120, 100];
}

// Anti-aliased river drawing into an RGBA buffer (Node / offscreen). Browser can use canvas paths instead.
export function drawRivers(img, paths, scale, threshold = 260) {
  const { width, height, data } = img;
  const col = [58, 98, 122];
  for (const p of paths) for (let i = 0; i < p.length - 1; i++) {
    const [x0, y0, a0] = p[i], [x1, y1] = p[i + 1];
    const wdt = Math.max(0.35, Math.min(1.6, Math.log(a0 / threshold) * 0.45 + 0.35)) * scale * 0.4;
    const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * scale * 2) + 1;
    for (let s = 0; s <= steps; s++) {
      const cx = (x0 + (x1 - x0) * s / steps) * scale, cy = (y0 + (y1 - y0) * s / steps) * scale;
      const R = Math.ceil(wdt + 1);
      for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
        const px = Math.round(cx + dx), py = Math.round(cy + dy);
        if (px < 0 || py < 0 || px >= width || py >= height) continue;
        const d = Math.hypot(px - cx, py - cy); const a = clamp(wdt - d + 0.5, 0, 1) * 0.9;
        if (a <= 0) continue;
        const q = (py * width + px) * 4;
        data[q] = Math.max(Math.min(data[q], lerp(data[q], col[0], a)), 0); data[q + 1] = lerp(data[q + 1], col[1], a * 0.95); data[q + 2] = lerp(data[q + 2], col[2], a);
      }
    }
  }
  return img;
}
