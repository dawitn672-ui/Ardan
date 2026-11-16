// Fine relief (characters.md §2, §7): lines, folds, the lips of a scar, pox pits and a burn's ridges are too fine for the
// surfaces; they bend the light pixel by pixel. Items come from anatomy.model(): polylines in the head's own x, y (mm)
// with a width and depth, or areas with a centre and radii. The floor on small sizes (§7): a mark is never drawn thinner
// than 1.2 px on cards and lists, and at the smallest only what changes a whole feature shows.
import { cell2, fbm2, noise2 } from './noise.js';

export function prepare(items, mmpp, tier) {
  const out = [];
  for (const it of items) {
    const minW = tier === 'S' ? 0 : 0.6 * mmpp;   // 1.2 px across
    if (tier === 'S' && it.kind !== 'burn' && it.kind !== 'fold' && it.kind !== 'ear') continue;
    const q = { ...it };
    if (q.pts) {
      q.w = Math.max(q.w, minW);
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const p of q.pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
      const m = q.w * 3.2 + 2; q.bb = [x0 - m, y0 - m, x1 + m, y1 + m];
    } else if (q.c) { const m = 4; q.bb = [q.c[0] - q.r[0] - m, q.c[1] - q.r[1] - m, q.c[0] + q.r[0] + m, q.c[1] + q.r[1] + m]; }
    else continue;
    out.push(q);
  }
  return out;
}

function segDist(px, py, pts) {
  let best = 1e9, along = 0, acc = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const ax = pts[i][0], ay = pts[i][1], bx = pts[i + 1][0] - ax, by = pts[i + 1][1] - ay, L2 = bx * bx + by * by || 1;
    let t = ((px - ax) * bx + (py - ay) * by) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t;
    const dx = px - ax - bx * t, dy = py - ay - by * t, d = dx * dx + dy * dy, L = Math.sqrt(L2);
    if (d < best) { best = d; along = acc + t * L; }
    acc += L;
  }
  SEG.along = along; SEG.len = acc; return Math.sqrt(best);
}
const SEG = { along: 0, len: 1 };

// height (mm, + out) of the relief at (x, y); fills OUT.mark for colour (scar, burn) as a side effect
const OUT = { h: 0, mark: 0, fresh: 0, red: 0, burn: 0, cav: 0, gap: 0 };
function height(items, x, y, seed, wantMark) {
  let h = 0, mark = 0, fresh = 0, red = 0, burn = 0, cav = 0;
  for (let i = 0; i < items.length; i++) {
    const it = items[i], bb = it.bb;
    if (x < bb[0] || x > bb[2] || y < bb[1] || y > bb[3]) continue;
    if (it.pts) {
      const d = segDist(x, y, it.pts);
      // lines fade at their ends
      const endF = Math.min(1, SEG.along / (it.w * 3 + 1), (SEG.len - SEG.along) / (it.w * 3 + 1));
      const e = d / it.w;
      if (it.kind === 'scar') {
        const H = it.heal || { fresh: 0, red: 0, pale: 1, thin: 0 };
        const rag = 1 + 0.35 * noise2(SEG.along * 0.6, 0.5, seed);
        const trough = Math.exp(-e * e * rag), lips = Math.exp(-Math.pow((d - 1.5 * it.w) / (0.7 * it.w), 2));
        h += endF * (-it.depth * trough + 0.35 * it.depth * lips + H.fresh * 0.8 * Math.exp(-e * e * 0.3));
        if (wantMark) { const mk = endF * Math.exp(-e * e * 0.55); if (mk > mark) { mark = mk; fresh = H.fresh; red = H.red; } }
      } else {
        const g = Math.exp(-e * e);
        h -= it.depth * endF * g;
        if (wantMark) cav += it.depth * endF * g;
      }
    } else {
      const ex = (x - it.c[0]) / it.r[0], ey = (y - it.c[1]) / it.r[1], rr = Math.sqrt(ex * ex + ey * ey);
      if (it.kind === 'burn') {
        const edge = 1 - smooth(0.55, 1.05, rr + 0.25 * fbm2(x * 0.08, y * 0.08, 3, seed + 5));
        if (edge > 0) {
          const ridge = 1 - Math.abs(fbm2(x * 0.22, y * 0.22, 3, seed + 9));
          h += edge * it.depth * (ridge * ridge - 0.3) * 1.6;
          if (wantMark) burn = Math.max(burn, edge);
        }
      } else if (it.kind === 'pox') {
        const m = 1 - smooth(0.6, 1.0, rr);
        if (m > 0) { const c = cell2(x / 3.4, y / 3.4, seed + 3); if ((c.id & 7) < 5) { const pit = m * Math.max(0, 1 - c.d / 0.36) ** 2; h -= it.depth * pit; if (wantMark) cav += pit * 2.2; } }
      } else if (it.kind === 'star') {
        if (rr < 1.6) { const a = Math.atan2(y - it.c[1], x - it.c[0]); h += -it.depth * Math.exp(-rr * rr * 2) + 0.3 * it.depth * Math.cos(a * 5) * Math.exp(-rr * rr) ; if (wantMark) { const mk = Math.exp(-rr * rr * 1.2); if (mk > mark) { mark = mk; red = it.heal ? it.heal.red : 0; } } }
      } else if (it.kind === 'brand') {
        if (rr < 1.3) { const ring = Math.exp(-Math.pow((rr - 0.7) / 0.18, 2)); h += 0.5 * ring; if (wantMark) mark = Math.max(mark, ring); }
      }
    }
  }
  OUT.h = h; OUT.mark = mark; OUT.fresh = fresh; OUT.red = red; OUT.burn = burn; OUT.cav = cav;
  return h;
}
const smooth = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

// relief at a point: slope (dh/dx, dh/dy) and the marks for colour
export const RELIEF = { gx: 0, gy: 0, h: 0, mark: 0, fresh: 0, red: 0, burn: 0, cav: 0 };
export function sample(items, x, y, seed, e = 0.35) {
  const h1 = height(items, x + e, y, seed, false), h2 = height(items, x, y + e, seed, false);
  const h0 = height(items, x, y, seed, true);
  RELIEF.gx = (h1 - h0) / e; RELIEF.gy = (h2 - h0) / e; RELIEF.h = h0;
  RELIEF.mark = OUT.mark; RELIEF.fresh = OUT.fresh; RELIEF.red = OUT.red; RELIEF.burn = OUT.burn; RELIEF.cav = OUT.cav;
  return RELIEF;
}
