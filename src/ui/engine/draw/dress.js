// Small parts and patterns of dress (characters.md §9): mail as rows of linked rings, rivets along a path, a fur edge,
// embroidery motifs, stitches, quilting and an inker's hatching. Each is generated from a few authored numbers in a
// piece's file, batched into one path a colour, and given a level: full size draws rings, cards draw dashes, the
// smallest size only the garment's own tones.
import { parse, mapPath, toBez, sample, frame, band, ellipse, h01 } from './geom.js';

// arc-length walker over sampled points
export function walker(P) {
  const acc = [0]; for (let i = 1; i < P.length; i++) acc.push(acc[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const total = acc[acc.length - 1];
  const at = d => {
    let lo = 1, hi = P.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (acc[m] < d) lo = m + 1; else hi = m; }
    const i = Math.max(1, lo), t = Math.max(0, Math.min(1, (d - acc[i - 1]) / ((acc[i] - acc[i - 1]) || 1)));
    const dx = P[i][0] - P[i - 1][0], dy = P[i][1] - P[i - 1][1], l = Math.hypot(dx, dy) || 1;
    return [P[i - 1][0] + dx * t, P[i - 1][1] + dy * t, dx / l, dy / l];
  };
  return { total, at };
}
const path = (s, warp) => toBez(mapPath(parse(s), warp));
// a quarter-or-so arc of an ellipse as cubics, from angle a0 to a1 (radians, < pi/2 each piece)
function arc(cx, cy, rx, ry, rot, a0, a1) {
  const out = [], c = Math.cos(rot), s = Math.sin(rot), P = (x, y) => [cx + x * c - y * s, cy + x * s + y * c];
  const n = Math.max(1, Math.ceil(Math.abs(a1 - a0) / (Math.PI / 2))), da = (a1 - a0) / n, k = 4 / 3 * Math.tan(da / 4);
  let p0 = P(rx * Math.cos(a0), ry * Math.sin(a0)); out.push(0, p0[0], p0[1]);
  for (let i = 0; i < n; i++) {
    const t0 = a0 + i * da, t1 = t0 + da;
    const q1 = P(rx * (Math.cos(t0) - k * Math.sin(t0)), ry * (Math.sin(t0) + k * Math.cos(t0)));
    const q2 = P(rx * (Math.cos(t1) + k * Math.sin(t1)), ry * (Math.sin(t1) - k * Math.cos(t1)));
    const q3 = P(rx * Math.cos(t1), ry * Math.sin(t1));
    out.push(2, q1[0], q1[1], q2[0], q2[1], q3[0], q3[1]);
  }
  return out;
}

// mail: rows between a top and a bottom guide, rings offset by half a ring a row
function mail(D, ctx, key) {
  const { warp, lod, emit } = ctx, m = D.metal || 'metal';
  if (lod < 1) return;
  const T = walker(sample(path(D.top, warp), 16)), B = walker(sample(path(D.bot, warp), 16)), rows = D.rows || 12, r = D.ring || 14;
  const rings = [], lit = [], glint = [], dash = [];
  for (let j = 0; j < rows; j++) {
    const v = j / (rows - 1), n = Math.max(2, Math.round((T.total * (1 - v) + B.total * v) / (r * 0.92)));
    for (let i = 0; i <= n; i++) {
      const u = (i + (j % 2 ? 0.5 : 0)) / n; if (u > 1) continue;
      const a = T.at(u * T.total), b = B.at(u * B.total), x = a[0] + (b[0] - a[0]) * v, y = a[1] + (b[1] - a[1]) * v;
      const tx = a[2] + (b[2] - a[2]) * v, ty = a[3] + (b[3] - a[3]) * v, rot = Math.atan2(ty, tx), h = h01(key + j + ',' + i);
      if (lod >= 2) {
        rings.push(...ellipse(x, y, r * 0.56, r * 0.44, rot));
        lit.push(...arc(x, y, r * 0.5, r * 0.38, rot, Math.PI * 0.95, Math.PI * 1.55));
        if (h < 0.3) glint.push(...ellipse(x - r * 0.22, y - r * 0.26, r * 0.12, r * 0.08, rot));
      } else {
        dash.push(...band(frame([[x - tx * r * 0.32, y - ty * r * 0.32, 0], [x, y, 0.5], [x + tx * r * 0.32, y + ty * r * 0.32, 1]], [r * 0.22]), -1, 1, 0, 1, 0.3));
        if (h < 0.12) glint.push(...ellipse(x - r * 0.1, y - r * 0.15, r * 0.16, r * 0.12, rot));
      }
    }
  }
  if (lod >= 2) {
    emit(`${m}.deep`, rings, { lod: 2, stroke: r * 0.2 });
    emit(`${m}.light`, lit, { lod: 2, stroke: r * 0.13 });
  } else emit(`${m}.light`, dash, { lod: 1 });
  if (glint.length) emit(`${m}.hl`, glint, { lod: 1 });
}

function rivets(D, ctx) {
  const { warp, lod, emit } = ctx, m = D.metal || 'metal';
  if (lod < 1) return;
  const W = walker(sample(path(D.along, warp), 12)), n = Math.max(1, Math.round(W.total / (D.gap || 24))), r = D.r || 4;
  const dark = [], head = [], gl = [];
  for (let i = 0; i <= n; i++) {
    if (D.skipEnds && (i === 0 || i === n)) continue;
    const [x, y] = W.at(i / n * W.total);
    dark.push(...ellipse(x + r * 0.15, y + r * 0.2, r * 1.05, r * 1.05));
    head.push(...ellipse(x, y, r * 0.8, r * 0.8));
    gl.push(...ellipse(x - r * 0.3, y - r * 0.35, r * 0.32, r * 0.26));
  }
  emit(`${m}.deep`, dark, { lod: 1 });
  emit(`${m}.light`, head, { lod: 1 });
  if (lod >= 2) emit(`${m}.hl`, gl, { lod: 2 });
}

// a fur edge: tufts grown outward from a path (side +1 or -1 of its direction), in three values
function fur(D, ctx, key) {
  const { warp, lod, emit } = ctx, f = D.ramp || 'fur';
  const W = walker(sample(path(D.along, warp), 14)), n = Math.round(W.total / (D.gap || (lod >= 2 ? 6 : 12)));
  const sets = { shadow: [], half: [], light: [], hl: [] }, side = D.side || 1, len = D.len || 26;
  for (let i = 0; i <= n; i++) {
    const h = h01(key + 'f' + i), h2 = h01(key + 'g' + i), [x, y, tx, ty] = W.at((i + 0.5 * h2) / (n + 1) * W.total);
    const nx = -ty * side, ny = tx * side, ang = (h - 0.5) * 0.9 + (D.lean || 0), L = len * (0.55 + 0.7 * h2);
    const dx = nx * Math.cos(ang) - ny * Math.sin(ang), dy = nx * Math.sin(ang) + ny * Math.cos(ang);
    const back = len * (D.root ?? 0.45), x0 = x - dx * back, y0 = y - dy * back, ex = x + dx * L, ey = y + dy * L, wd = (D.w || 7) * (0.7 + 0.6 * h);
    const pts = [[x0, y0, 0], [x0 + (ex - x0) * 0.5 + tx * side * 3 * (h - 0.5), y0 + (ey - y0) * 0.5 + ty * side * 3 * (h - 0.5), 1], [ex, ey, 2]];
    const s = band(frame(pts, [wd, wd * 0.8, 0.4]), -1, 1, 0, 1, 0);
    const which = i % 4 === 0 ? 'shadow' : i % 4 === 2 ? 'light' : 'half';
    sets[which].push(...s);
    if (lod >= 2 && h > 0.55) sets.hl.push(...band(frame(pts, [wd * 0.3, wd * 0.25, 0.2]), -1, 1, 0.35, 0.9, 0.2));
  }
  for (const k of ['shadow', 'half', 'light', 'hl']) if (sets[k].length) emit(`${f}.${k}`, sets[k], { lod: k === 'hl' ? 2 : 0 });
}

// embroidery, studs or any small motif repeated along a path, turned with it
function motif(D, ctx) {
  const { warp, lod, emit } = ctx;
  if (lod < (D.lod ?? 2)) return;
  const W = walker(sample(path(D.along, warp), 12)), n = Math.max(1, Math.round(W.total / (D.gap || 20)));
  const parts = D.m.map(p => ({ role: p.role, b: toBez(parse(p.d)), stroke: p.stroke })), acc = parts.map(() => []);
  const sc = D.scale || 1;
  for (let i = 0; i <= n; i++) {
    if (D.skipEnds && (i === 0 || i === n)) continue;
    const [x, y, tx, ty] = W.at(i / n * W.total);
    parts.forEach((p, k) => {
      const b = p.b.slice();
      for (let q = 0; q < b.length;) { const op = b[q], c = op === 0 || op === 1 ? 2 : op === 2 ? 6 : 0; for (let j = 1; j <= c; j += 2) { const lx = b[q + j] * sc, ly = b[q + j + 1] * sc; b[q + j] = x + lx * tx - ly * ty; b[q + j + 1] = y + lx * ty + ly * tx; } q += 1 + c; }
      acc[k].push(...b);
    });
  }
  parts.forEach((p, k) => emit(p.role, acc[k], { lod: D.lod ?? 2, stroke: p.stroke }));
}

function stitch(D, ctx) {
  const { warp, lod, emit } = ctx;
  if (lod < 2) return;
  const W = walker(sample(path(D.along, warp), 12)), gap = D.gap || 9, n = Math.floor(W.total / gap), out = [];
  for (let i = 0; i < n; i++) {
    const [x, y, tx, ty] = W.at((i + 0.15) * gap), L = gap * (D.dash ?? 0.55), a = D.ang || 0;
    const dx = tx * Math.cos(a) - ty * Math.sin(a), dy = tx * Math.sin(a) + ty * Math.cos(a);
    out.push(...band(frame([[x, y, 0], [x + dx * L / 2, y + dy * L / 2, 0.5], [x + dx * L, y + dy * L, 1]], [D.w || 1.6]), -1, 1, 0, 1, 0.3));
  }
  emit(D.role, out, { lod: 2 });
}

// an inker's hatching: parallel tapered strokes at an angle, over a box, clipped by the caller (finish 'line' only)
function hatch(D, ctx, key) {
  const { warp, emit } = ctx;
  const [x0, y0, x1, y1] = D.box, gap = D.gap || 7, a = D.ang ?? -0.9, tx = Math.cos(a), ty = Math.sin(a), out = [];
  const nx = -ty, ny = tx, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2, n = Math.ceil(2 * R / gap);
  for (let i = 0; i <= n; i++) {
    const o = -R + i * gap, h = h01(key + i), L = (D.len ? D.len[0] + (D.len[1] - D.len[0]) * h : R), s = (h01(key + 'o' + i) - 0.5) * (D.jit ?? 10);
    const px = cx + nx * o + tx * s, py = cy + ny * o + ty * s;
    const p0 = warp(px - tx * L / 2, py - ty * L / 2), p1 = warp(px + tx * L / 2, py + ty * L / 2);
    out.push(...band(frame([[p0[0], p0[1], 0], [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, 0.5], [p1[0], p1[1], 1]], [D.w || 1.8]), -1, 1, 0, 1, 0.5));
  }
  emit(D.role, out, { lod: D.lod ?? 1, clip: D.clip, finish: 'line' });
}

// ribs: n lines from a top guide to a bottom guide (quilting channels, pleats, gathers), each a tapered line with an
// optional light line beside it (the lit side of the ridge)
function ribs(D, ctx, key) {
  const { warp, lod, emit } = ctx;
  if (lod < (D.lod ?? 1)) return;
  const T = walker(sample(path(D.top, warp), 12)), B = walker(sample(path(D.bot, warp), 12)), n = D.n || 8, dark = [], lit = [];
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n + (D.jit || 0) * (h01(key + i) - 0.5) / n, a = T.at(u * T.total), b = B.at(u * B.total);
    const s0 = D.from ?? 0, s1 = (D.to ?? 1) - (D.short || 0) * h01(key + 'l' + i);
    const P = [0, 0.5, 1].map(t => { const s = s0 + (s1 - s0) * t, bow = (D.bow || 0) * (t * (1 - t)) * 4; return [a[0] + (b[0] - a[0]) * s + bow, a[1] + (b[1] - a[1]) * s, t]; });
    dark.push(...band(frame(P, D.w || [0.6, 2, 0.6]), -1, 1, 0, 1, 0.2));
    if (D.lit) lit.push(...band(frame(P.map(p => [p[0] - (D.litOff ?? 2.4), p[1], p[2]]), D.lw || [0.4, 1.6, 0.4]), -1, 1, 0, 1, 0.2));
  }
  emit(D.role, dark, { lod: D.lod ?? 1, clip: D.clip });
  if (lit.length) emit(D.lit, lit, { lod: (D.lod ?? 1) + (D.litLod ?? 0), clip: D.clip });
}

export const PATTERNS = { mail, rivets, fur, motif, stitch, hatch, ribs };
