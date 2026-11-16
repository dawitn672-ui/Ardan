// Pictures of the generator's work, for a person to look at (not part of the game): node gen/preview.mjs <out-dir>
// Writes geo.png (biomes and relief, the Known World greyed) and, once provinces exist, provinces.png and realms.png.
import fs from 'node:fs';
import path from 'node:path';
import { png } from './lib.mjs';

export const BIOME_RGB = {
  'Glacier': [235, 240, 245], 'Alpine highland': [170, 160, 140], 'Tundra': [190, 196, 180], 'Taiga': [70, 105, 80],
  'Steppe': [196, 186, 120], 'Desert': [226, 205, 150], 'Temperate forest': [92, 140, 78], 'Temperate rainforest': [60, 120, 90],
  'Dry woodland': [170, 170, 100], 'Savanna': [200, 190, 105], 'Tropical monsoon forest': [80, 150, 70], 'Tropical rainforest': [40, 115, 60],
  'Marsh': [100, 140, 120], 'Salt flat': [230, 225, 215], 'Lake': [70, 110, 150],
};
export function geoPicture(G, base, GW_, GH_, scale = 2, marks = []) {
  const GW = G.GW, GH = G.GH, W = Math.floor(GW / scale), H = Math.floor(GH / scale), rgb = new Uint8Array(W * H * 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * scale) * GW + x * scale, o = (y * W + x) * 3;
    let c;
    if (G.inBase(i)) { const p = G.baseCell(i); c = p < 0 ? [38, 58, 82] : [150, 150, 140]; }
    else if (!G.land[i]) c = G.lake[i] >= 0 ? [60, 100, 140] : [30, 50, 78];
    else {
      c = (BIOME_RGB[G.biome[i]] || [255, 0, 255]).slice();
      const e = G.elev[i], ex = G.elev[Math.min(G.N - 1, i + GW + 1)] || e, sh = Math.max(-0.35, Math.min(0.35, (e - ex) / 900));
      c = c.map(v => Math.max(0, Math.min(255, v * (1 + sh))));
      if (G.river && G.river[i]) c = G.river[i] === 2 ? [40, 80, 150] : [70, 110, 160];
    }
    rgb.set(c, o);
  }
  for (const m of marks) {   // points in km: a red cross where land was wanted and is missing, a black dot where it is there
    const cx = Math.floor((m.x - G.F.x0) / 10 / scale), cy = Math.floor((m.y - G.F.y0) / 10 / scale); if (cx < 1 || cy < 1 || cx >= W - 1 || cy >= H - 1) continue;
    const i = Math.floor((m.y - G.F.y0) / 10) * GW + Math.floor((m.x - G.F.x0) / 10), ok = m.water ? !G.land[i] : G.land[i];
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) rgb.set(ok ? [10, 10, 10] : [255, 30, 30], ((cy + dy) * W + cx + dx) * 3);
  }
  return png(W, H, rgb);
}
export function regionPicture(owner, colorOf, GW, GH, scale = 2, edge) {
  const W = Math.floor(GW / scale), H = Math.floor(GH / scale), rgb = new Uint8Array(W * H * 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * scale) * GW + x * scale, o = (y * W + x) * 3, v = owner[i];
    let c = colorOf(v, i);
    if (edge && v >= 0) { const r = owner[i + scale] , d = owner[i + scale * GW]; if ((r !== undefined && r !== v) || (d !== undefined && d !== v)) c = c.map(q => q * 0.55); }
    rgb.set(c, o);
  }
  return png(W, H, rgb);
}
export const write = (dir, name, buf) => { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, name), buf); };
