// The sketches of docs/design/war.md (D12a), drawn by code. Mock-ups only: nothing here is game code.
//   node docs/design/war/build.mjs      writes 1-theatre.svg, 2-by-rank.svg, 3-field.svg, 4-press.svg beside this file
// Everything that looks random is a seeded stream, so the same run gives the same pictures. The front in sketches 1
// and 2 is not drawn by hand: it is the edge of a spread worked out over the map's ground (fast along roads, slow in
// woods and hills, stopped by the river except at the bridge and the ford, held off by a castle that has not fallen),
// which is the design's "burn". The enemy rank in sketch 4 is drawn by the game's own figure library
// (src/ui/engine/figure, read and not changed); everything else is drawn here, in its palette.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compose, lookOf } from '../../../src/ui/engine/figure/index.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const f = n => (Math.round(n * 10) / 10).toString();
const mk = seed => { let s = seed >>> 0; const r = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; r.s = () => r() * 2 - 1; r.i = (a, b) => a + Math.floor(r() * (b - a + 1)); return r; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---- the hand: the game's day-print palette (docs/design/brief.md §1, §7.3) ----------------------------------------
const INK = '#1b1730', SHADE = '#3a2f6b', PAPER = '#efe6d2', VERM = '#c23c27', GOLD = '#e8b04a', GOLD_D = '#8a5a10';
const SEA_L = '#8fb2d6', SEA_D = '#2b4f86', LAPIS = '#2f4a7a', CARD = '#fbf6ea';
const OURS = { ink: '#2f5d43', wash: '#a9c59a', flag: '#3f7a57', charge: '#f0d27a', name: 'Aldmark' };
const THEIRS = { ink: '#9a4a22', wash: '#ecc98f', flag: '#b0562f', charge: '#f6e7c1', name: 'Varenna' };
const SERIF = `'Literata', Georgia, 'Times New Roman', serif`, CAPS = `'Cinzel', 'Trajan Pro', Georgia, serif`;

// ---- geometry -------------------------------------------------------------------------------------------------------
const lerp = (a, b, t) => a + (b - a) * t;
// a smooth path through points (Catmull-Rom as cubic Béziers)
function smooth(pts, closed = false) {
  const n = pts.length; if (n < 2) return '';
  const P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + (closed ? 'Z' : '');
}
const line = (pts, closed) => 'M' + pts.map(p => `${f(p[0])} ${f(p[1])}`).join('L') + (closed ? 'Z' : '');
// points along a polyline every `step`, with the direction there
function along(pts, step, from = 0) {
  const out = []; let need = from;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], L = Math.hypot(x1 - x0, y1 - y0) || 1; let t = need;
    while (t <= L) { out.push([lerp(x0, x1, t / L), lerp(y0, y1, t / L), (x1 - x0) / L, (y1 - y0) / L]); t += step; }
    need = t - L;
  }
  return out;
}
// a denser copy of a polyline, rounded by corner cutting (Chaikin)
function chaikin(pts, times = 2, closed = false) {
  for (let k = 0; k < times; k++) {
    const out = [], n = pts.length;
    for (let i = 0; i < (closed ? n : n - 1); i++) { const a = pts[i], b = pts[(i + 1) % n]; out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); }
    if (!closed) { out.unshift(pts[0]); out.push(pts[n - 1]); }
    pts = out;
  }
  return pts;
}
const distToPoly = (x, y, pts) => { let best = 1e9; for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], dx = x1 - x0, dy = y1 - y0, t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy || 1))), d = Math.hypot(x - x0 - t * dx, y - y0 - t * dy); if (d < best) best = d; } return best; };
// the closed loops where a field on a grid crosses a level (marching squares, stitched)
function contours(F, w, h, level) {
  const segs = new Map(), key = (x, y) => Math.round(x * 64) + ':' + Math.round(y * 64), put = (a, b) => { const k = key(a[0], a[1]); (segs.get(k) || segs.set(k, []).get(k)).push([a, b]); };
  const v = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? -1e9 : F[y * w + x]) - level;
  for (let y = -1; y < h; y++) for (let x = -1; x < w; x++) {
    const a = v(x, y), b = v(x + 1, y), c = v(x + 1, y + 1), d = v(x, y + 1);
    const idx = (a > 0 ? 8 : 0) | (b > 0 ? 4 : 0) | (c > 0 ? 2 : 0) | (d > 0 ? 1 : 0); if (idx === 0 || idx === 15) continue;
    const cl = t => Math.max(0.02, Math.min(0.98, t));
    const T = [x + cl(a / (a - b)), y], R = [x + 1, y + cl(b / (b - c))], Bm = [x + cl(d / (d - c)), y + 1], L = [x, y + cl(a / (a - d))];
    const S = { 1: [[L, Bm]], 2: [[Bm, R]], 3: [[L, R]], 4: [[T, R]], 5: [[T, L], [Bm, R]], 6: [[T, Bm]], 7: [[T, L]], 8: [[T, L]], 9: [[T, Bm]], 10: [[T, R], [L, Bm]], 11: [[T, R]], 12: [[L, R]], 13: [[Bm, R]], 14: [[L, Bm]] }[idx];
    for (const [p, q] of S) { put(p, q); put(q, p); }
  }
  const loops = [], used = new Set();
  for (const [, list] of segs) for (const [p0, q0] of list) {
    if (used.has(key(...p0) + '>' + key(...q0))) continue;
    const loop = [p0]; let p = p0, q = q0;
    for (let guard = 0; guard < 20000; guard++) {
      used.add(key(...p) + '>' + key(...q)); used.add(key(...q) + '>' + key(...p)); loop.push(q);
      const nxt = (segs.get(key(...q)) || []).find(([a, b]) => !used.has(key(...a) + '>' + key(...b)));
      if (!nxt) break; p = nxt[0]; q = nxt[1];
    }
    if (loop.length > 10) loops.push(loop);
  }
  return loops;
}

// ---- the country of sketches 1 and 2 (world units: 1 is about a kilometre; 1,700 by 1,000) ---------------------------
const WW = 1700, WH = 1000;
const COAST = [[-40, 150], [140, 122], [300, 165], [470, 130], [620, 168], [780, 138], [930, 172], [1060, 150], [1128, 196], [1160, 236], [1196, 226], [1230, 192], [1330, 158], [1480, 184], [1600, 150], [1760, 160]];
const BORDER = [[905, 150], [890, 260], [922, 340], [880, 430], [916, 520], [884, 610], [930, 700], [900, 800], [940, 900], [922, 1010]];
const RIVERS = {
  glenwash: { w: 4.2, pts: [[1322, 968], [1282, 862], [1214, 762], [1182, 662], [1152, 560], [1176, 462], [1142, 362], [1166, 284], [1164, 232]] },
  vite: { w: 2.4, pts: [[1560, 640], [1470, 612], [1392, 600], [1300, 572], [1220, 566], [1156, 548]] },
  yew: { w: 2.4, pts: [[560, 640], [532, 560], [546, 470], [506, 360], [532, 246], [512, 150]] },
};
const PLACES = {
  kingsmere: { n: 'Kingsmere', x: 150, y: 520, k: 'capital', r: 0 }, thornstone: { n: 'Thornstone', x: 480, y: 556, k: 'town', r: 0 },
  crossmarch: { n: 'Crossmarch', x: 800, y: 500, k: 'town', r: 0 }, briarbrook: { n: 'Briarbrook', x: 724, y: 306, k: 'town', r: 0 },
  northmoor: { n: 'Northmoor', x: 566, y: 196, k: 'town', r: 0 }, yewmarch: { n: 'Yewmarch', x: 640, y: 716, k: 'town', r: 0 },
  camia: { n: 'Camia', x: 1000, y: 470, k: 'town', r: 1 }, rocca: { n: 'Rocca Pavice', x: 1046, y: 640, k: 'castle', r: 1 },
  vitina: { n: 'Vitina', x: 1152, y: 506, k: 'town', r: 1 }, castella: { n: 'Castella', x: 1338, y: 470, k: 'town', r: 1 },
  varenna: { n: 'Varenna', x: 1560, y: 410, k: 'capital', r: 1 }, norona: { n: 'Norona', x: 1306, y: 190, k: 'town', r: 1 },
  calena: { n: 'Calena', x: 1300, y: 738, k: 'town', r: 1 },
};
const P = k => [PLACES[k].x, PLACES[k].y];
const BRIDGE = [1164, 506], FORD = [1205, 736];
const ROADS = [
  { rank: 1, pts: [P('kingsmere'), [320, 548], P('thornstone'), [640, 520], P('crossmarch'), [905, 482], P('camia'), [1080, 492], P('vitina'), BRIDGE, [1250, 492], P('castella'), [1450, 430], P('varenna')] },
  { rank: 2, pts: [P('crossmarch'), [770, 400], P('briarbrook'), [650, 240], P('northmoor')] },
  { rank: 2, pts: [P('crossmarch'), [880, 590], [960, 636], P('rocca'), [1130, 700], FORD, P('calena'), [1330, 600], P('castella')] },
  { rank: 2, pts: [P('vitina'), [1128, 400], [1150, 300], [1230, 236], P('norona')] },
  { rank: 2, pts: [P('yewmarch'), [720, 610], P('crossmarch')] },
];
const KINGS_ROAD = ROADS[0].pts;
const WOODS = [[620, 700, 118], [560, 760, 80], [1340, 300, 92], [1420, 330, 64], [968, 372, 46], [330, 360, 88], [250, 760, 96], [1480, 590, 46]];
const HILLS = [[1010, 650, 80], [1090, 720, 70], [960, 760, 70], [1460, 500, 60], [760, 620, 50], [1120, 610, 40], [420, 700, 70]];
// a range in the south-east, with the Harrow Pass through it
const PEAKS = (() => { const r = mk(31), out = []; for (let t = 0; t <= 1.001; t += 0.045) { const x = 1290 + 420 * t, y = 806 - 190 * t * t; if (Math.abs(t - 0.5) < 0.05) continue; out.push([x + r.s() * 8, y + r.s() * 8, 20 + r() * 14]); out.push([x + 22 + r.s() * 8, y + 44 + r() * 14, 17 + r() * 12]); if (r() < 0.7) out.push([x + 40 + r.s() * 10, y + 92 + r() * 18, 16 + r() * 12]); } return out.sort((a, b) => a[1] - b[1]); })();
const polyY = (pts, x) => { for (let i = 0; i < pts.length - 1; i++) if (x >= pts[i][0] && x <= pts[i + 1][0]) return lerp(pts[i][1], pts[i + 1][1], (x - pts[i][0]) / (pts[i + 1][0] - pts[i][0])); return pts[0][1]; };
const polyX = (pts, y) => { for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; if ((y >= a[1] && y <= b[1]) || (y <= a[1] && y >= b[1])) return lerp(a[0], b[0], (y - a[1]) / ((b[1] - a[1]) || 1)); } return pts[0][0]; };
const coastY = x => polyY(COAST, x), borderX = y => polyX(BORDER, y), glenX = y => polyX(RIVERS.glenwash.pts, y);
const inWood = (x, y) => WOODS.some(([cx, cy, r]) => (x - cx) ** 2 + (y - cy) ** 2 < r * r * (0.8 + 0.25 * Math.sin(x * 0.07) * Math.cos(y * 0.09)));
const inHills = (x, y) => HILLS.some(([cx, cy, r]) => (x - cx) ** 2 + (y - cy) ** 2 < r * r);

// ---- the burn: how far Aldmark's hold has spread into Varenna by "now", and a week ago -------------------------------
// A spread over 5 km cells from where the roads cross the border: cheap along roads, dear in woods and hills, the
// river a wall but for the bridge and the ford, a castle that has not fallen holding its own country, and slow going
// beyond the river where their host stands. (The game's rule is the same idea run week by week from the armies'
// reach; this is its picture.)
const CS = 5, GW = WW / CS, GH = WH / CS, NOW = 70;
const BURN = (() => {
  const cost = new Float32Array(GW * GH), T = new Float64Array(GW * GH).fill(1e9);   // Float64: a Float32 store makes a popped key look late, and nodes are skipped
  for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) {
    const x = gx * CS + CS / 2, y = gy * CS + CS / 2, i = gy * GW + gx;
    if (y < coastY(x) + 4 || x < borderX(y)) { cost[i] = 1e6; continue; }
    let c = 1 + 0.35 * Math.sin(x * 0.045) * Math.cos(y * 0.05);
    if (inWood(x, y)) c *= 2.0; if (inHills(x, y)) c *= 1.35; if (y < 345) c *= 3.4;
    const rd = Math.min(...ROADS.map(R => distToPoly(x, y, R.pts) + (R.rank === 2 ? 3 : 0))); if (rd < 9) c *= rd < 5 ? 0.3 : 0.55;
    const rv = Math.min(distToPoly(x, y, RIVERS.glenwash.pts), distToPoly(x, y, RIVERS.vite.pts) + 2);
    if (rv < 7 && Math.hypot(x - BRIDGE[0], y - BRIDGE[1]) > 9 && Math.hypot(x - FORD[0], y - FORD[1]) > 9) c *= 40;
    if (Math.hypot(x - PLACES.rocca.x, y - PLACES.rocca.y) < 34) c *= 30;                // Rocca Pavice holds its country
    if (x > glenX(y) + 4) c *= Math.abs(y - FORD[1]) < 40 ? 4 : 11;                        // beyond the river their host stands near
    cost[i] = c;
  }
  const open = []; const push = (i, t) => { if (t < T[i]) { T[i] = t; open.push([t, i]); } };
  for (const [x, y] of [[905, 482], [884, 592]]) push(Math.floor(y / CS) * GW + Math.floor(x / CS) + 1, 0);
  while (open.length) {
    let bi = 0; for (let k = 1; k < open.length; k++) if (open[k][0] < open[bi][0]) bi = k;
    const [t, i] = open.splice(bi, 1)[0]; if (t > T[i] || t > 120) continue;
    const gx = i % GW, gy = (i / GW) | 0;
    for (const [dx, dy, m] of [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.41], [1, -1, 1.41], [-1, 1, 1.41], [-1, -1, 1.41]]) {
      const x = gx + dx, y = gy + dy; if (x < 0 || y < 0 || x >= GW || y >= GH) continue; const j = y * GW + x; if (cost[j] > 1e5) continue;
      push(j, t + m * (cost[i] + cost[j]) / 2);
    }
  }
  // soften the arrival times a little, so the edge is a living line and not the grid's
  const S = new Float32Array(GW * GH);
  for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) { let s = 0, n = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const x = gx + dx, y = gy + dy; if (x < 0 || y < 0 || x >= GW || y >= GH) continue; s += Math.min(T[y * GW + x], 160); n++; } S[gy * GW + gx] = -s / n; }
  const at = t => contours(S, GW, GH, -t).map(lp => chaikin(lp.filter((_, k) => k % 2 === 0).map(([x, y]) => [x * CS + CS / 2, y * CS + CS / 2]), 1, true));
  // the front is the part of the edge that is not the old border
  const fronts = loops => { const out = []; for (const lp of loops) { const n = lp.length, on = lp.map(([x, y]) => x > borderX(y) + 11); if (on.every(Boolean)) { out.push([...lp, lp[0]]); continue; } const s0 = on.findIndex((v, k) => v && !on[(k + n - 1) % n]); if (s0 < 0) continue; let run = []; for (let k = 0; k < n; k++) { const q = (s0 + k) % n; if (on[q]) run.push(lp[q]); else { if (run.length > 3) out.push(run); run = []; } } if (run.length > 3) out.push(run); } return out; };
  const now = at(NOW), before = at(NOW - 9);
  return { now, before, front: fronts(now), frontBefore: fronts(before) };
})();

// ---- the armies ---------------------------------------------------------------------------------------------------------
const HOSTS = [
  { id: 'you', side: 0, x: 1112, y: 500, men: '9,400', arm: 'foot', you: true },
  { id: 'count', side: 0, x: 1070, y: 668, men: '2,100', arm: 'foot', age: 'at the siege' },
  { id: 'duke', side: 0, x: 1180, y: 742, men: '5,800', arm: 'horse', age: 'news two days old' },
  { id: 'king', side: 1, x: 1296, y: 486, men: 'about 11,000', arm: 'foot', age: 'seen yesterday' },
  { id: 'north', side: 1, x: 1262, y: 236, men: 'about 3,000?', arm: 'horse', age: 'seen six days ago', ghost: true },
  { id: 'raid', side: 1, x: 940, y: 552, men: 'riders, a few hundred', arm: 'raid', age: 'this morning' },
];

// ---- drawing the map -----------------------------------------------------------------------------------------------------
function flag(x, y, side, o = {}) {
  // a standard on a pole: square for foot, swallowtail for horse, a small pennon for riders out raiding
  const C = side === 0 ? OURS : THEIRS, s = o.s || 1, w = 17 * s, h = 12 * s, ph = 25 * s, g = o.ghost;
  const shape = o.arm === 'horse' ? `M0 0H${f(w)}L${f(w - 5 * s)} ${f(h / 2)}L${f(w)} ${f(h)}H0Z` : o.arm === 'raid' ? `M0 0L${f(w * 0.9)} ${f(h * 0.4)}L0 ${f(h * 0.8)}Z` : `M0 0H${f(w)}V${f(h)}H0Z`;
  const charge = side === 0 ? `<circle cx="${f(w * 0.45)}" cy="${f(h / 2)}" r="${f(2.6 * s)}" fill="${C.charge}"/>` : `<path d="M${f(w * 0.2)} ${f(h * 0.75)}L${f(w * 0.46)} ${f(h * 0.3)}L${f(w * 0.72)} ${f(h * 0.75)}" fill="none" stroke="${C.charge}" stroke-width="${f(1.8 * s)}"/>`;
  return `<g transform="translate(${f(x)} ${f(y)})" ${g ? 'opacity=".55"' : ''}>`
    + `<ellipse cx="0" cy="0" rx="${f(5 * s)}" ry="${f(2 * s)}" fill="${INK}" opacity=".25"/>`
    + `<line x1="0" y1="0" x2="0" y2="${f(-ph)}" stroke="${INK}" stroke-width="${f(1.5 * s)}" stroke-linecap="round"/>`
    + `<g transform="translate(0.6 ${f(-ph)})"><path d="${shape}" fill="${C.flag}" stroke="${o.you ? GOLD : INK}" stroke-width="${f(o.you ? 2 * s : s)}" ${g ? 'stroke-dasharray="3 2"' : ''}/>${o.arm === 'raid' ? '' : charge}</g>`
    + (o.you ? `<circle cx="0" cy="${f(-ph - 3 * s)}" r="${f(2.4 * s)}" fill="${GOLD}" stroke="${INK}" stroke-width=".7"/>` : '') + `</g>`;
}
// a slip of paper with a few words
function slip(x, y, text, o = {}) {
  const fs_ = o.size || 12.5, w = o.w || text.length * fs_ * 0.53 + 14, h = fs_ + 8, ax = o.anchor === 'start' ? x : o.anchor === 'end' ? x - w : x - w / 2;
  return `<g><rect x="${f(ax)}" y="${f(y - h / 2)}" width="${f(w)}" height="${f(h)}" rx="2.5" fill="${o.fill || CARD}" fill-opacity="${o.op ?? 0.95}" stroke="${o.edge || INK}" stroke-width="${o.sw || 0.8}"/>`
    + `<text x="${f(ax + w / 2)}" y="${f(y + fs_ * 0.34)}" text-anchor="middle" font-family="${SERIF}" font-size="${fs_}" ${o.italic ? 'font-style="italic"' : ''} ${o.bold ? 'font-weight="700"' : ''} fill="${o.color || INK}">${esc(text)}</text></g>`;
}
const label = (x, y, text, o = {}) => `<text x="${f(x)}" y="${f(y)}" text-anchor="${o.anchor || 'middle'}" font-family="${o.caps ? CAPS : SERIF}" font-size="${o.size || 12}" ${o.italic ? 'font-style="italic"' : ''} ${o.bold ? 'font-weight="700"' : ''} ${o.spacing ? `letter-spacing="${o.spacing}"` : ''} fill="${o.color || INK}" ${o.op ? `opacity="${o.op}"` : ''} stroke="${o.halo || PAPER}" stroke-width="${o.hw ?? 3}" paint-order="stroke" stroke-linejoin="round">${esc(text)}</text>`;
const note = (n, x, y) => `<g><circle cx="${f(x)}" cy="${f(y)}" r="9.5" fill="${INK}" stroke="${PAPER}" stroke-width="1.4"/><text x="${f(x)}" y="${f(y + 4.2)}" text-anchor="middle" font-family="${SERIF}" font-size="12" font-weight="700" fill="${PAPER}">${n}</text></g>`;
const scaleIcon = (x, y, tip = -6, c = INK) => `<g transform="translate(${f(x)} ${f(y)})"><line x1="0" y1="-12" x2="0" y2="8" stroke="${c}" stroke-width="1.4"/><line x1="-13" y1="${f(-11 - tip / 2)}" x2="13" y2="${f(-11 + tip / 2)}" stroke="${c}" stroke-width="1.6"/><path d="M-17 ${f(-6 - tip / 2)}a4 4 0 0 0 8 0zM9 ${f(-6 + tip / 2)}a4 4 0 0 0 8 0z" fill="${GOLD}" stroke="${c}" stroke-width=".9"/><path d="M-6 9h12" stroke="${c}" stroke-width="2"/></g>`;

function placeGlyph(p, s = 1, at) {
  const [x, y] = at || [p.x, p.y], C = p.r ? THEIRS : OURS, k = p.k;
  if (k === 'castle') return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path d="M-7 4V-6H-4.5V-9H-2V-6H2V-9H4.5V-6H7V4Z" fill="#f4eee0" stroke="${INK}" stroke-width="1.1"/><path d="M-1.6 4V-0.5A1.6 1.6 0 0 1 1.6 -0.5V4Z" fill="${INK}"/><line x1="0" y1="-9" x2="0" y2="-16" stroke="${INK}" stroke-width="1"/><path d="M0 -16H6L4.5 -13.8L6 -11.6H0Z" fill="${C.flag}" stroke="${INK}" stroke-width=".6"/></g>`;
  if (k === 'capital') return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path d="M-10 5V-4H-7V-7H-4V-4H-2V-11H2V-4H4V-7H7V-4H10V5Z" fill="#f4eee0" stroke="${INK}" stroke-width="1.2"/><line x1="0" y1="-11" x2="0" y2="-20" stroke="${INK}" stroke-width="1.1"/><path d="M0 -20H8V-14.5H0Z" fill="${C.flag}" stroke="${INK}" stroke-width=".7"/><circle cx="4" cy="-17.2" r="1.3" fill="${C.charge}"/></g>`;
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path d="M-6 4V-1L-2.5 -5L1 -1V4Z" fill="#f4eee0" stroke="${INK}" stroke-width="1"/><path d="M1 4V-3H6V4Z" fill="#f4eee0" stroke="${INK}" stroke-width="1"/><path d="M3 -3V-7L4.5 -9L6 -7V-3" fill="#f4eee0" stroke="${INK}" stroke-width=".9"/></g>`;
}

// everything a map needs, once: filters, patterns, glyphs, the ground (id + 'ground') and the burn (id + 'burn')
function mapDefs(id) {
  const r = mk(11), land = smooth([...COAST, [WW + 60, WH + 60], [-60, WH + 60]], true), b = smooth(BORDER);
  let d = `
<filter id="${id}grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.27  0 0 0 0 0.16  0 0 0 0.09 0"/></filter>
<filter id="${id}soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="5"/></filter>
<filter id="${id}veil" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14"/></filter>
<linearGradient id="${id}sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${SEA_D}"/><stop offset=".3" stop-color="${SEA_L}"/></linearGradient>
<pattern id="${id}hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><rect width="7" height="7" fill="${OURS.wash}" fill-opacity=".5"/><line x1="0" y1="0" x2="0" y2="7" stroke="${OURS.ink}" stroke-width="1.5" stroke-opacity=".5"/></pattern>
<pattern id="${id}gain" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-38)"><line x1="0" y1="0" x2="0" y2="5" stroke="${VERM}" stroke-width="1.3" stroke-opacity=".6"/></pattern>
<pattern id="${id}rain" width="9" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(22)"><line x1="2" y1="1" x2="2" y2="10" stroke="${LAPIS}" stroke-width="1" stroke-opacity=".34"/></pattern>
<radialGradient id="${id}ember"><stop offset="0" stop-color="#ffd27a" stop-opacity=".95"/><stop offset=".5" stop-color="${VERM}" stop-opacity=".5"/><stop offset="1" stop-color="${VERM}" stop-opacity="0"/></radialGradient>
<symbol id="${id}tree" overflow="visible"><path d="M0 0v4" stroke="${INK}" stroke-width=".8"/><circle cx="0" cy="-1.2" r="4" fill="#7fa37a" stroke="${INK}" stroke-width=".7"/><path d="M1 2.5A4 4 0 0 0 3.8 -0.4" fill="none" stroke="${SHADE}" stroke-width="1" stroke-opacity=".35"/></symbol>
<symbol id="${id}hill" overflow="visible"><path d="M-7 0Q0 -8 7 0" fill="none" stroke="${INK}" stroke-width=".9" stroke-opacity=".55"/><path d="M1 -3.6L3 -0.6M3.4 -2.6L5 -0.4" stroke="${INK}" stroke-width=".7" stroke-opacity=".4"/></symbol>
<symbol id="${id}peak" overflow="visible"><path d="M-8 0L0 -10L8 0Z" fill="#e9e2d2" stroke="${INK}" stroke-width=".55"/><path d="M0 -10L8 0L1.2 0Z" fill="${SHADE}" fill-opacity=".34"/><path d="M-3 -6.2L0 -10L3 -6.2L0.8 -7.2L-1 -5.6Z" fill="#fff" stroke="${INK}" stroke-width=".25"/></symbol>
<clipPath id="${id}land"><path d="${land}"/></clipPath>
<path id="${id}now" d="${BURN.now.map(lp => line(lp, true)).join('')}"/>
<path id="${id}gainp" fill-rule="evenodd" d="${[...BURN.now, ...BURN.before].map(lp => line(lp, true)).join('')}"/>
<path id="${id}front" d="${BURN.front.map(lp => line(lp)).join('')}"/>
<path id="${id}frontb" d="${BURN.frontBefore.map(lp => line(lp)).join('')}"/>`;
  // the ground: sea with ripple lines, land, the realms as a wash (stronger in a ribbon along the border), rivers,
  // hills, woods and peaks as glyphs on a seeded lattice (as 62-inked-map places them), the border, roads in two ranks
  let g = `<rect x="-60" y="-60" width="${WW + 120}" height="${WH + 120}" fill="url(#${id}sea)"/>`;
  for (const [w, op] of [[26, 0.16], [15, 0.2], [7, 0.3]]) g += `<path d="${land}" fill="none" stroke="#dfeaf2" stroke-width="${w}" stroke-opacity="${op}" stroke-linejoin="round"/>`;
  g += `<path d="${land}" fill="${PAPER}" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>`;
  g += `<g clip-path="url(#${id}land)"><path d="${b}L-60 ${WH + 60}L-60 -60L905 -60Z" fill="${OURS.wash}" fill-opacity=".42"/><path d="${b}L${WW + 60} ${WH + 60}L${WW + 60} -60L905 -60Z" fill="${THEIRS.wash}" fill-opacity=".5"/>`
    + `<path d="${b}" fill="none" stroke="${OURS.wash}" stroke-width="16" stroke-opacity=".5" transform="translate(-8 0)"/><path d="${b}" fill="none" stroke="${THEIRS.wash}" stroke-width="16" stroke-opacity=".6" transform="translate(8 0)"/></g>`;
  for (const k in RIVERS) { const R = RIVERS[k], p = smooth(R.pts); g += `<path d="${p}" fill="none" stroke="${SEA_D}" stroke-width="${R.w + 1.6}" stroke-linecap="round" stroke-opacity=".85"/><path d="${p}" fill="none" stroke="${SEA_L}" stroke-width="${R.w - 0.6}" stroke-linecap="round"/>`; }
  let gl = '';
  for (const [cx, cy, rad] of HILLS) for (let k = 0; k < rad * 0.5; k++) { const a = r() * 6.283, dd = Math.sqrt(r()) * rad; gl += `<use href="#${id}hill" x="${f(cx + Math.cos(a) * dd)}" y="${f(cy + Math.sin(a) * dd * 0.8)}"/>`; }
  const trees = [];
  for (const [cx, cy, rad] of WOODS) for (let k = 0; k < rad * rad / 62; k++) { const a = r() * 6.283, dd = Math.sqrt(r()) * rad, x = cx + Math.cos(a) * dd, y = cy + Math.sin(a) * dd * 0.85; if (inWood(x, y) && y > coastY(x) + 8) trees.push([x, y]); }
  trees.sort((p, q) => p[1] - q[1]);
  for (const [x, y] of trees) gl += `<use href="#${id}tree" x="${f(x)}" y="${f(y)}"/>`;
  for (const [x, y, s] of PEAKS) gl += `<use href="#${id}peak" transform="translate(${f(x)} ${f(y)}) scale(${f(s / 10)})"/>`;
  g += `<g clip-path="url(#${id}land)">${gl}</g>`;
  g += `<path d="${b}" fill="none" stroke="${INK}" stroke-width="1.6" stroke-dasharray="1 5" stroke-linecap="round" clip-path="url(#${id}land)"/>`;
  for (const R of ROADS) { const p = smooth(R.pts); g += `<path d="${p}" fill="none" stroke="${PAPER}" stroke-width="${R.rank === 1 ? 4.6 : 3}" stroke-opacity=".8"/><path d="${p}" fill="none" stroke="#6b4a2b" stroke-width="${R.rank === 1 ? 2 : 1.1}" ${R.rank === 2 ? 'stroke-dasharray="6 3"' : ''} stroke-linecap="round"/>`; }
  g += `<g transform="translate(${BRIDGE[0]} ${BRIDGE[1]})"><rect x="-7" y="-3" width="14" height="6" fill="#f4eee0" stroke="${INK}" stroke-width="1"/><path d="M-7 -3V-6M7 -3V-6M-7 3V6M7 3V6" stroke="${INK}" stroke-width="1"/></g>`;
  g += `<g transform="translate(${FORD[0]} ${FORD[1]})">${[-5, -1.5, 2, 5.5].map((dx, k) => `<circle cx="${dx}" cy="${k % 2 ? 1.2 : -1}" r="1.5" fill="#f4eee0" stroke="${INK}" stroke-width=".7"/>`).join('')}</g>`;
  d += `<g id="${id}ground">${g}</g>`;
  // the burn: the scorch creeping ahead of the line, land held (hatched in the holder's ink), the week's gain, last
  // week's line, and the edge itself: char, then ember
  d += `<g id="${id}burn" clip-path="url(#${id}land)">`
    + `<use href="#${id}front" fill="none" stroke="#3b2a1c" stroke-opacity=".42" stroke-width="20" stroke-linecap="round" filter="url(#${id}soft)"/>`
    + `<use href="#${id}now" fill="url(#${id}hatch)" fill-rule="evenodd"/>`
    + `<use href="#${id}gainp" fill="url(#${id}gain)"/>`
    + `<use href="#${id}frontb" fill="none" stroke="${INK}" stroke-width="1" stroke-dasharray="2 4" stroke-opacity=".7"/>`
    + `<use href="#${id}front" fill="none" stroke="#2a1a12" stroke-width="3.6" stroke-linejoin="round" stroke-linecap="round"/>`
    + `<use href="#${id}front" fill="none" stroke="${VERM}" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/></g>`;
  return d;
}
const rain = (id, x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id}rain)" clip-path="url(#${id}land)"/>`;
function carts(pts, from, to, step = 26) {
  let s = '';
  for (const [x, y, dx] of along(chaikin(pts, 2), step, from)) { if (to && x > to) break; s += `<g transform="translate(${f(x)} ${f(y - 1.5)}) scale(${dx < 0 ? -1 : 1} 1)"><rect x="-3.6" y="-3.4" width="7.2" height="3.6" rx=".8" fill="#f4eee0" stroke="${INK}" stroke-width=".8"/><circle cx="-2" cy=".9" r="1.3" fill="${INK}"/><circle cx="2.2" cy=".9" r="1.3" fill="${INK}"/></g>`; }
  return s;
}
function scorch(id, x, y, rad, seed) {
  const r = mk(seed); let s = `<circle cx="${x}" cy="${y}" r="${rad}" fill="#2a1a12" fill-opacity=".3" filter="url(#${id}soft)"/>`;
  for (let k = 0; k < rad * 1.6; k++) { const a = r() * 6.283, d = Math.sqrt(r()) * rad; s += `<circle cx="${f(x + Math.cos(a) * d)}" cy="${f(y + Math.sin(a) * d * 0.8)}" r="${f(0.6 + r() * 0.9)}" fill="#2a1a12" fill-opacity=".7"/>`; }
  return s;
}
const smoke = (x, y, s = 1) => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})" opacity=".75"><path d="M0 0C-5 -7 4 -10 -1 -17C-5 -23 3 -27 0 -33" fill="none" stroke="#4a4038" stroke-width="2.6" stroke-linecap="round" stroke-opacity=".55"/><path d="M4 -2C1 -8 8 -11 5 -17" fill="none" stroke="#4a4038" stroke-width="1.8" stroke-linecap="round" stroke-opacity=".4"/></g>`;
const flame = (id, x, y, s = 1) => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><circle r="8" fill="url(#${id}ember)"/><path d="M0 2C-3.4 1 -3 -2.6 -1 -4.2C-1 -2.4 0.4 -2.6 0.2 -5.6C2.8 -3.6 3.6 0.6 0 2Z" fill="#ffcf6a" stroke="${VERM}" stroke-width=".7"/></g>`;
const arrowHead = (x, y, dx, dy, c, s = 1) => `<path d="M0 0L-9 -4.2L-6.6 0L-9 4.2Z" fill="${c}" transform="translate(${f(x)} ${f(y)}) rotate(${f(Math.atan2(dy, dx) * 180 / Math.PI)}) scale(${s})"/>`;
function moveArrow(pts, c, o = {}) { const q = chaikin(pts, 2), n = q.length, [x1, y1] = q[n - 1], [x0, y0] = q[n - 2]; return `<path d="${line(q)}" fill="none" stroke="${o.halo || PAPER}" stroke-width="${(o.w || 2.4) + 2.2}" stroke-opacity=".75" stroke-linecap="round"/><path d="${line(q)}" fill="none" stroke="${c}" stroke-width="${o.w || 2.4}" stroke-linecap="round" ${o.dash ? `stroke-dasharray="${o.dash}"` : ''}/>${arrowHead(x1, y1, x1 - x0, y1 - y0, c, o.hs || 1)}`; }
const tent = (x, y, s = 1) => `<path d="M${f(x - 4 * s)} ${f(y)}l${f(4 * s)} ${f(-6 * s)}l${f(4 * s)} ${f(6 * s)}z" fill="#f4eee0" stroke="${INK}" stroke-width="${f(0.8 * s)}"/>`;
const frame = (id, W, H) => `<rect width="${W}" height="${H}" filter="url(#${id}grain)" opacity=".8"/><rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" fill="none" stroke="${INK}" stroke-width="1"/>`;
const button = (x, y, w, h, t, main, o = {}) => `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${main ? GOLD : o.fill || CARD}" stroke="${main ? GOLD_D : o.edge || INK}" stroke-width="1.3"/><text x="${x + w / 2}" y="${y + h / 2 + (o.size || 16) * 0.35}" text-anchor="middle" font-family="${SERIF}" font-size="${o.size || 16}" font-weight="700" fill="${main ? '#1a1206' : o.color || '#1a1206'}">${esc(t)}</text></g>`;

// ---- sketch 1: the theatre, as a General sees it -----------------------------------------------------------------------
function theatre() {
  const W = 1000, H = 640, vx = 640, vy = 150, id = 'T_';
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${SERIF}"><title>The theatre: a war seen from above, at a General's rank</title><defs>${mapDefs(id)}<clipPath id="${id}view"><rect width="${W}" height="${H}"/></clipPath></defs>`;
  s += `<g clip-path="url(#${id}view)"><g transform="translate(${-vx} ${-vy})"><use href="#${id}ground"/><use href="#${id}burn"/>`;
  // what the General does not know: beyond his riders' reach the map is pale, and the enemy there is a guess
  const seen = HOSTS.filter(h => h.side === 0).map(h => `<circle cx="${h.x}" cy="${h.y}" r="${h.you ? 176 : 120}"/>`).join('') + `<path d="${smooth(KINGS_ROAD.slice(4, 9))}" fill="none" stroke="#000" stroke-width="120" stroke-linecap="round"/>`;
  s += `<mask id="${id}fog" maskUnits="userSpaceOnUse" x="0" y="0" width="${WW}" height="${WH}"><rect x="0" y="0" width="${WW}" height="${WH}" fill="#fff"/><g filter="url(#${id}veil)" fill="#000" stroke="#000">${seen}</g></mask>`;
  s += `<rect x="${vx}" y="${vy}" width="${W}" height="${H}" fill="#f6f0e2" fill-opacity=".55" mask="url(#${id}fog)"/>`;
  // weather: rain on the coast road
  s += rain(id, 640, 150, 1000, 140);
  // the supply road: carts from Crossmarch to the host, cut where the riders struck
  s += carts(KINGS_ROAD.slice(4, 9), 14, 884) + carts(KINGS_ROAD.slice(4, 9), 152, 1100);
  s += scorch(id, 934, 498, 20, 5) + flame(id, 922, 492, 1) + flame(id, 944, 506, 0.8) + smoke(930, 486, 0.9);
  s += `<path d="M898 471l14 18m0 -18l-14 18" stroke="${VERM}" stroke-width="2.6" stroke-linecap="round"/>`;
  // the siege of Rocca Pavice: a ring, tents, smoke
  s += `<circle cx="${PLACES.rocca.x}" cy="${PLACES.rocca.y}" r="19" fill="none" stroke="${OURS.ink}" stroke-width="2" stroke-dasharray="5 3"/>` + smoke(PLACES.rocca.x + 4, PLACES.rocca.y - 12, 0.8);
  for (const [dx, dy] of [[-24, 8], [-16, 20], [2, 27]]) s += tent(PLACES.rocca.x + dx, PLACES.rocca.y + dy);
  // embers along the stretches of front where there is fighting this week
  for (const [x, y] of [[1222, 494], [1208, 512], [1202, 478], [1226, 728], [1232, 748]]) s += flame(id, x, y, 0.8);
  // places and their names
  for (const k in PLACES) { const p = PLACES[k]; if (p.x < vx - 20) continue; s += placeGlyph(p, 1.15); const dy = k === 'rocca' ? -24 : k === 'vitina' ? 24 : k === 'castella' ? -16 : 19, dx = k === 'vitina' ? -22 : k === 'rocca' ? -34 : k === 'castella' ? 26 : 0; s += label(p.x + dx, p.y + dy, p.n, { size: p.k === 'capital' ? 14 : 12.5, italic: p.k !== 'capital', bold: p.k === 'capital' }); }
  s += label(1124, 334, 'the Glenwash', { italic: true, size: 12, color: SEA_D }) + label(1500, 722, 'Harrow Pass', { italic: true, size: 12 }) + label(1500, 737, 'snow shuts it in three weeks', { italic: true, size: 11 });
  s += label(760, 420, 'ALDMARK', { caps: true, size: 19, spacing: 5, color: OURS.ink, op: 0.75 }) + label(1486, 330, 'VARENNA', { caps: true, size: 19, spacing: 5, color: THEIRS.ink, op: 0.75 });
  s += label(1456, 268, 'rain on the coast: the north road is mud', { italic: true, size: 12, color: LAPIS });
  // planned marches for the week (gold: yours; green: your side's; their riders' road is a guess)
  s += moveArrow([[1126, 496], [1160, 502], [1200, 496], [1236, 492]], GOLD_D, { w: 2.8 }) + moveArrow([[1194, 742], [1240, 738], [1280, 737]], OURS.ink, { w: 2, dash: '7 4' });
  s += moveArrow([[946, 560], [962, 640], [940, 720], [960, 780]], THEIRS.ink, { w: 1.6, dash: '3 4', hs: 0.8 });
  // the hosts
  for (const h of HOSTS) {
    s += flag(h.x, h.y, h.side, { arm: h.arm, you: h.you, ghost: h.ghost, s: h.arm === 'raid' ? 0.85 : 1.25 });
    const right = h.id !== 'you' && h.id !== 'count' && h.id !== 'raid', lx = h.x + (right ? 13 : -12), ly = h.y + (h.id === 'raid' ? 4 : 13);
    s += slip(lx, ly, h.men, { anchor: right ? 'start' : 'end', edge: h.you ? GOLD_D : h.side ? THEIRS.ink : OURS.ink, sw: h.you ? 1.6 : 1, bold: h.you, italic: h.side === 1, size: h.id === 'raid' ? 11.5 : 12.5 });
    if (h.age) s += label(lx, ly + 21, h.age, { anchor: right ? 'start' : 'end', italic: true, size: 11.5, op: 0.9 });
  }
  s += `</g></g>`;
  // the page's own furniture: a cartouche, the two buttons that move time (in the top bar on a desktop, in the dock
  // on a phone), how the war stands, and numbered notes for the document
  s += `<g><rect x="14" y="14" width="318" height="62" rx="3" fill="${CARD}" fill-opacity=".95" stroke="${INK}" stroke-width="1.2"/><rect x="18" y="18" width="310" height="54" rx="2" fill="none" stroke="${GOLD_D}" stroke-width=".8"/>`
    + `<text x="30" y="42" font-family="${CAPS}" font-size="17" font-weight="700" letter-spacing="1.5" fill="${INK}">THE WAR FOR THE GLENWASH</text><text x="30" y="62" font-size="13" font-style="italic" fill="${INK}">October 1123 · the twenty-sixth week · first frost</text></g>`;
  s += button(W - 290, 16, 132, 38, 'Next day', false) + button(W - 148, 16, 132, 38, 'Next week', true);
  s += `<g><rect x="14" y="${H - 58}" width="392" height="44" rx="3" fill="${CARD}" fill-opacity=".95" stroke="${INK}" stroke-width="1"/><text x="26" y="${H - 39}" font-size="13" fill="${INK}"><tspan font-weight="700">How the war stands:</tspan> in your favour.</text><text x="26" y="${H - 22}" font-size="12.5" font-style="italic" fill="${INK}">Camia is yours; the bridge is not; bread for nine days.</text>${scaleIcon(380, H - 34)}</g>`;
  for (const [n, x, y] of [[1, 1206, 450], [2, 1094, 634], [3, 902, 448], [4, 1150, 770], [5, 1290, 440], [6, 1236, 196], [7, 1596, 264], [8, 1420, 708]]) s += note(n, x - vx, y - vy);
  return s + frame(id, W, H) + `</svg>`;
}

// ---- sketch 2: the same war at four ranks --------------------------------------------------------------------------------
function byRank() {
  const W = 1000, H = 632, id = 'R_', pw = 484, ph = 268;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${SERIF}"><title>The same war as four ranks see it</title><defs>${mapDefs(id)}</defs><rect width="${W}" height="${H}" fill="${PAPER}"/>`;
  // one panel: a window on the world; world() draws in world units, pixels(w2p, k) draws on top at a fixed size
  const panel = (n, ox, oy, view, title, sub, world, pixels) => {
    const [vx, vy, vw] = view, k = pw / vw, vh = ph / k, w2p = (x, y) => [ox + (x - vx) * k, oy + (y - vy) * k];
    return `<g><clipPath id="${id}c${n}"><rect x="${ox}" y="${oy}" width="${pw}" height="${ph}" rx="3"/></clipPath><g clip-path="url(#${id}c${n})"><svg x="${ox}" y="${oy}" width="${pw}" height="${ph}" viewBox="${f(vx)} ${f(vy)} ${f(vw)} ${f(vh)}" preserveAspectRatio="none"><use href="#${id}ground"/>${world(vx, vy, vw, vh, k)}</svg>${pixels(w2p, k)}</g>`
      + `<rect x="${ox}" y="${oy}" width="${pw}" height="${ph}" rx="3" fill="none" stroke="${INK}" stroke-width="1.2"/>`
      + `<text x="${ox + 2}" y="${oy - 21}" font-family="${CAPS}" font-size="15" font-weight="700" letter-spacing="1" fill="${INK}">${esc(title)}</text><text x="${ox + 2}" y="${oy - 6}" font-size="12.5" font-style="italic" fill="${INK}">${esc(sub)}</text></g>`;
  };
  const veil = (n, vx, vy, vw, vh, holes, op, blur) => `<filter id="${id}vb${n}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${blur}"/></filter><mask id="${id}vm${n}" maskUnits="userSpaceOnUse" x="${f(vx)}" y="${f(vy)}" width="${f(vw)}" height="${f(vh)}"><rect x="${f(vx)}" y="${f(vy)}" width="${f(vw)}" height="${f(vh)}" fill="#fff"/><g filter="url(#${id}vb${n})" fill="#000" stroke="#000">${holes}</g></mask><rect x="${f(vx)}" y="${f(vy)}" width="${f(vw)}" height="${f(vh)}" fill="#f1e9d6" fill-opacity="${op}" mask="url(#${id}vm${n})"/>`;
  const road = smooth([[1000, 470], [1040, 482], [1080, 492], [1118, 500]]);

  // a levy-man: the road he marched, the camp, smoke ahead, and what the men say
  s += panel(1, 10, 44, [1000, 438, 232], 'A LEVY-MAN', 'the road, the camp, and what the men say',
    (vx, vy, vw, vh) => veil(1, vx, vy, vw, vh, `<path d="${road}" fill="none" stroke-width="26" stroke-linecap="round"/><circle cx="1118" cy="500" r="24"/>`, 0.95, 6)
      + [[1104, 493], [1111, 489], [1119, 492], [1109, 502], [1118, 505], [1127, 500], [1100, 503]].map(([x, y]) => tent(x, y, 0.5)).join('')
      + smoke(1166, 498, 0.5) + smoke(1160, 512, 0.42) + flame(id, 1163, 504, 0.5),
    (w2p) => { const [cx, cy] = w2p(1114, 497), [sx, sy] = w2p(1163, 478); return `<circle cx="${f(cx)}" cy="${f(cy + 4)}" r="5" fill="${GOLD}" stroke="${INK}" stroke-width="1.2"/>` + label(cx, cy + 34, 'your company’s fires', { size: 12.5, italic: true })
      + label(sx + 62, sy + 22, 'smoke over the river', { size: 12.5, italic: true }) + label(sx + 62, sy + 37, 'since dawn', { size: 12.5, italic: true })
      + slip(26, 80, '“They say the bridge is held against us.”', { anchor: 'start', italic: true, size: 12.5 }) + slip(26, 106, '“A carter saw a wagon train burning behind us.”', { anchor: 'start', italic: true, size: 12.5 })
      + slip(26, 290, 'Bread for four days · day 33 of your forty', { anchor: 'start', size: 12.5, edge: OURS.ink, bold: true }) + label(372, 266, 'the rest you know only by hearsay', { size: 12, italic: true, op: 0.75, halo: '#f1e9d6' }); });

  // a captain: the country a ride round his company; his wing; his orders
  s += panel(2, 506, 44, [1062, 452, 170], 'A CAPTAIN', 'a ride round his company; his wing; his orders',
    (vx, vy, vw, vh) => veil(2, vx, vy, vw, vh, `<circle cx="1136" cy="500" r="38"/><path d="M1080 492L1136 500" fill="none" stroke-width="22" stroke-linecap="round"/>`, 0.9, 7)
      + `<rect x="1088" y="512" width="26" height="15" fill="url(#${id}hatch)" stroke="${OURS.ink}" stroke-width=".5" stroke-dasharray="2 1.5"/>`
      + [[1156, 484], [1157, 492], [1158, 500], [1159, 508], [1160, 516]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.1" fill="${OURS.flag}" stroke="${INK}" stroke-width=".3"/>`).join(''),
    (w2p) => { const c = w2p(1146, 503), a = w2p(1140, 486), b = w2p(1138, 520), r2 = w2p(1120, 502), e = w2p(1178, 500), fg = w2p(1101, 520), br = w2p(1164, 506);
      return flag(a[0], a[1], 0, { s: 0.95 }) + flag(b[0], b[1], 0, { s: 0.95 }) + flag(r2[0], r2[1], 0, { s: 0.95, arm: 'horse' }) + flag(c[0], c[1], 0, { s: 1.25, you: true }) + flag(e[0] + 16, e[1], 1, { s: 0.95, ghost: true })
        + moveArrow([[c[0] + 8, c[1] - 6], [br[0] - 6, br[1] - 3]], GOLD_D, { w: 2.6 })
        + label(c[0] - 52, c[1] + 6, 'your company', { size: 12.5, bold: true, anchor: 'end' }) + label(e[0] + 30, e[1] + 18, 'their pickets,', { size: 12, italic: true }) + label(e[0] + 30, e[1] + 32, 'seen at dawn', { size: 12, italic: true })
        + label(fg[0], fg[1] + 34, 'forage: two days left', { size: 12, italic: true }) + label(r2[0] - 6, r2[1] - 38, 'the wing’s horse', { size: 12, italic: true })
        + slip(522, 80, 'Orders, by courier at noon: “Hold the bridge end until the horns.”', { anchor: 'start', size: 12.5, edge: GOLD_D, sw: 1.4 }); });

  // a general: the theatre, as far as his riders see
  s += panel(3, 10, 356, [748, 356, 800], 'A GENERAL', 'the theatre, as far as his riders see; the rest is a guess',
    (vx, vy, vw, vh) => `<use href="#${id}burn"/>` + veil(3, vx, vy, vw, vh, HOSTS.filter(h => h.side === 0).map(h => `<circle cx="${h.x}" cy="${h.y}" r="${h.you ? 150 : 100}"/>`).join('') + `<path d="${smooth(KINGS_ROAD.slice(4, 9))}" fill="none" stroke-width="100" stroke-linecap="round"/>`, 0.6, 16)
      + carts(KINGS_ROAD.slice(4, 9), 14, 884, 30) + carts(KINGS_ROAD.slice(4, 9), 152, 1100, 30) + `<circle cx="${PLACES.rocca.x}" cy="${PLACES.rocca.y}" r="19" fill="none" stroke="${OURS.ink}" stroke-width="2" stroke-dasharray="5 3"/>`,
    (w2p) => { let o = ''; for (const key of ['camia', 'vitina', 'castella', 'rocca', 'crossmarch', 'calena']) { const p = PLACES[key], q = w2p(p.x, p.y); o += placeGlyph(p, 0.95, q) + label(q[0] + (key === 'vitina' ? -20 : key === 'rocca' ? -34 : key === 'castella' ? 22 : 0), q[1] + (key === 'rocca' || key === 'castella' ? -14 : 18), p.n, { size: 11.5, italic: true }); }
      for (const h of HOSTS) { const q = w2p(h.x, h.y); o += flag(q[0], q[1], h.side, { arm: h.arm, you: h.you, ghost: h.ghost, s: h.arm === 'raid' ? 0.7 : 1.05 }); if (h.id !== 'raid' && h.id !== 'north') o += slip(q[0] + (h.side || h.id === 'duke' ? 12 : -10), q[1] + 12, h.men, { anchor: h.side || h.id === 'duke' ? 'start' : 'end', size: 11.5, edge: h.you ? GOLD_D : h.side ? THEIRS.ink : OURS.ink, italic: h.side === 1, bold: h.you }); }
      const a = w2p(1126, 496), b = w2p(1236, 492); return o + moveArrow([a, [(a[0] + b[0]) / 2, a[1] + 3], b], GOLD_D, { w: 2.6 }); });

  // the crown, or its Marshal: every army, by courier, days late; who is called and who is paid
  s += panel(4, 506, 356, [0, 96, 1700], 'THE CROWN, OR ITS MARSHAL', 'every army, by courier and days late; who is called, who is paid',
    () => `<use href="#${id}burn"/>`,
    (w2p) => { let o = ''; const K = w2p(150, 520);
      for (const [key, days] of [['you', 'five days'], ['duke', 'seven days'], ['count', '']]) { const h = HOSTS.find(x => x.id === key), q = w2p(h.x, h.y); if (days) { const mid = [(K[0] + q[0]) / 2, (K[1] + q[1]) / 2 + (key === 'duke' ? 30 : -26)]; o += `<path d="M${f(K[0])} ${f(K[1])}Q${f(mid[0])} ${f(mid[1])} ${f(q[0])} ${f(q[1])}" fill="none" stroke="${INK}" stroke-width="1" stroke-dasharray="1.5 4" stroke-linecap="round"/>` + label(mid[0], mid[1] + (key === 'duke' ? 2 : 6), `news ${days} old`, { size: 11.5, italic: true }); } o += flag(q[0], q[1], 0, { s: 0.9, arm: h.arm }); }
      for (const key of ['king', 'north']) { const h = HOSTS.find(x => x.id === key), q = w2p(h.x, h.y); o += flag(q[0], q[1], 1, { s: 0.9, arm: h.arm, ghost: true }); }
      for (const [x, y] of [[330, 549], [520, 548], [610, 228]]) { const q = w2p(x, y); o += flag(q[0], q[1], 0, { s: 0.7 }); }
      o += moveArrow([w2p(360, 549), w2p(520, 536), w2p(700, 512)], OURS.ink, { w: 1.8, dash: '6 3', hs: 0.8 }) + moveArrow([w2p(628, 236), w2p(700, 300), w2p(760, 420)], OURS.ink, { w: 1.8, dash: '6 3', hs: 0.8 });
      for (const key of ['kingsmere', 'varenna', 'crossmarch']) { const p = PLACES[key], q = w2p(p.x, p.y); o += placeGlyph(p, key === 'crossmarch' ? 0.8 : 1, q) + label(q[0], q[1] + 19, p.n, { size: 11.5, italic: p.k !== 'capital', bold: p.k === 'capital' }); }
      o += `<circle cx="${f(K[0])}" cy="${f(K[1] - 30)}" r="4.5" fill="${GOLD}" stroke="${INK}" stroke-width="1.1"/>` + label(K[0] + 8, K[1] - 38, 'you, at court', { size: 12, italic: true, anchor: 'start' })
        + slip(522, 380, 'Called at Michaelmas: three more banners, on the road', { anchor: 'start', size: 12, edge: OURS.ink })
        + slip(522, 606, 'The Duke’s forty days end at Martinmas · the chest holds pay for two months', { anchor: 'start', size: 12, edge: OURS.ink });
      return o; });
  return s + frame(id, W, H) + `</svg>`;
}

// ---- sketch 3: the field -------------------------------------------------------------------------------------------------
// A field of 1,200 by 820 metres seen from behind your own side, from a hill: north is up, the far side is the enemy's.
function field() {
  const W = 1000, H = 640, id = 'F_', r = mk(77);
  const Z = (X, Y) => 26 * Math.exp(-(((Y - 655 - 14 * Math.sin(X / 190)) / 88) ** 2)) + 2.5 * Math.sin(X / 150) * Math.cos(Y / 130);
  const pr = (X, Y, z) => [20 + X * 0.8, 566 - Y * 0.57 - (z ?? Z(X, Y)) * 1.25];
  const STREAM = [[-20, 396], [90, 410], [200, 388], [330, 398], [450, 384], [560, 402], [660, 392], [760, 402], [880, 394], [1000, 414], [1110, 404], [1230, 418]];
  const streamY = X => polyY(STREAM, X);
  const ROAD = [[610, -10], [640, 180], [712, 330], [760, 400], [772, 520], [780, 650], [792, 830]];
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${SERIF}"><title>The field: an engagement seen close, from behind your own line</title><defs>
<filter id="${id}grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="9"/><feColorMatrix values="0 0 0 0 0.3  0 0 0 0 0.25  0 0 0 0 0.15  0 0 0 0.09 0"/></filter>
<filter id="${id}soft"><feGaussianBlur stdDeviation="3"/></filter>
<linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f7fc8"/><stop offset="1" stop-color="#cfe6ee"/></linearGradient>
<pattern id="${id}plough" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(8)"><rect width="6" height="6" fill="#d8c79a"/><line x1="0" y1="1" x2="6" y2="1" stroke="#8a6a3c" stroke-width="1" stroke-opacity=".45"/></pattern>
<clipPath id="${id}clip"><rect x="0" y="46" width="${W}" height="526"/></clipPath>
<symbol id="${id}tree" overflow="visible"><ellipse cx="1" cy="1" rx="6" ry="2" fill="${INK}" opacity=".2"/><path d="M0 1v-7" stroke="#4a3626" stroke-width="1.6"/><circle cx="0" cy="-12" r="8" fill="#6f9a6a" stroke="${INK}" stroke-width=".8"/><path d="M-5 -15a6.5 6.5 0 0 1 6 -4" fill="none" stroke="#cfe0b4" stroke-width="1.4" stroke-linecap="round"/><path d="M2 -4.6a8 8 0 0 0 5.6 -5.6" fill="none" stroke="${SHADE}" stroke-width="1.6" stroke-opacity=".4"/></symbol>
<symbol id="${id}house" overflow="visible"><ellipse cx="2" cy="1" rx="11" ry="2.6" fill="${INK}" opacity=".2"/><path d="M-8 0v-8h16v8z" fill="#efe3c8" stroke="${INK}" stroke-width=".8"/><path d="M-10 -8l10 -8l10 8z" fill="#a8623a" stroke="${INK}" stroke-width=".8"/><path d="M0 -16l10 8h-8z" fill="${SHADE}" fill-opacity=".3"/><rect x="-1.6" y="-5" width="3.2" height="5" fill="${INK}"/></symbol>
<symbol id="${id}dead" overflow="visible"><path d="M-3 0h6M-1 -1.2l2 2.4" stroke="${INK}" stroke-width="1" stroke-opacity=".55" stroke-linecap="round"/></symbol>
${figureSymbols(id)}</defs>`;
  // the sky and the far country
  s += `<rect x="0" y="46" width="${W}" height="80" fill="url(#${id}sky)"/><rect x="0" y="46" width="${W}" height="7" fill="#2f5f9e" opacity=".5"/>`;
  { const pts = []; let v = 0; for (let i = 0; i <= 30; i++) { v = v * 0.6 + r.s() * 6; pts.push([i / 30 * W, 84 + v]); } s += `<path d="${line(pts)}L${W} 140L0 140Z" fill="#9db7bd"/>`; }
  // the ground as strips from the far edge to the near, each lit by its slope (the light is from the upper left)
  let g = '';
  for (let Y = 820; Y > -20; Y -= 20) {
    const top = [], bot = []; for (let X = -30; X <= 1230; X += 42) { top.push(pr(X, Y)); bot.push(pr(X, Y - 20)); }
    const slope = (Z(600, Y) - Z(600, Y - 20)) / 20, far = Y > 668;
    const tone = far ? '#aab78f' : slope > 0.12 ? '#eef0cf' : slope > 0.04 ? '#e3e8c2' : Y < 300 ? '#d4dcae' : '#dbe1b6';
    g += `<path d="${line(top)}L${[...bot].reverse().map(p => `${f(p[0])} ${f(p[1] + 1)}`).join('L')}Z" fill="${tone}"/>`;
  }
  // ploughland and a hedged close this side of the stream; the slope's hachures
  const quad = (a, b, c, d, fill, extra = '') => `<path d="${line([pr(...a), pr(...b), pr(...c), pr(...d)], true)}" fill="${fill}" ${extra}/>`;
  g += quad([820, 60], [1130, 80], [1150, 250], [840, 240], `url(#${id}plough)`, `stroke="#5c7a4a" stroke-width="2.2" stroke-linejoin="round"`) + quad([120, 40], [400, 50], [410, 150], [110, 150], `url(#${id}plough)`, `stroke="#5c7a4a" stroke-width="2.2" stroke-linejoin="round" opacity=".8"`);
  for (let X = 10; X < 1200; X += 13) for (const Y of [548, 574, 600, 624]) { const a = pr(X + r.s() * 5, Y), b = pr(X + r.s() * 5 - 2, Y - 15); g += `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="${INK}" stroke-width=".7" stroke-opacity="${f(0.16 + 0.18 * r())}"/>`; }
  { const crest = []; for (let X = -30; X <= 1230; X += 30) crest.push(pr(X, 668 + 14 * Math.sin(X / 190))); g += `<path d="${smooth(crest)}" fill="none" stroke="${INK}" stroke-width="1.1" stroke-opacity=".6"/>`; }
  // the road, the stream with its ford and bridge
  g += `<path d="${smooth(ROAD.map(p => pr(...p)))}" fill="none" stroke="#c9b48a" stroke-width="7" stroke-linecap="round"/><path d="${smooth(ROAD.map(p => pr(...p)))}" fill="none" stroke="#8a6a3c" stroke-width="7" stroke-opacity=".25" stroke-dasharray="1 9"/>`;
  const st = smooth(STREAM.map(p => pr(...p, 0)));
  g += `<path d="${st}" fill="none" stroke="#2b4f86" stroke-width="13" stroke-linecap="round" stroke-opacity=".85"/><path d="${st}" fill="none" stroke="#86acd2" stroke-width="10" stroke-linecap="round"/><path d="${st}" fill="none" stroke="#d6e6f2" stroke-width="1.2" stroke-dasharray="14 22" stroke-opacity=".9" transform="translate(0 -2)"/>`;
  { const [fx, fy] = pr(330, streamY(330), 0); for (let k = 0; k < 12; k++) g += `<ellipse cx="${f(fx - 22 + k * 4 + r.s() * 2)}" cy="${f(fy + r.s() * 4)}" rx="${f(1.8 + r())}" ry="1.2" fill="#eee6d0" stroke="${INK}" stroke-width=".5"/>`; }
  { const a = pr(752, 386, 0), b = pr(768, 418, 0); g += `<path d="M${f(a[0] - 7)} ${f(a[1])}L${f(b[0] - 7)} ${f(b[1])}L${f(b[0] + 9)} ${f(b[1])}L${f(a[0] + 9)} ${f(a[1])}Z" fill="#b9966a" stroke="${INK}" stroke-width="1"/><path d="M${f(a[0] - 7)} ${f(a[1])}L${f(b[0] - 7)} ${f(b[1])}M${f(a[0] + 9)} ${f(a[1])}L${f(b[0] + 9)} ${f(b[1])}" stroke="${INK}" stroke-width="2"/>`; }
  s += `<g clip-path="url(#${id}clip)">${g}`;

  // things that stand up, sorted from the far edge to the near: trees, houses, stakes, men, standards
  const tall = [], put = (Y, svg, bias = 0) => tall.push([Y + bias, svg]);
  for (let k = 0; k < 64; k++) { const a = r() * 6.283, d = Math.sqrt(r()), X = 140 + Math.cos(a) * d * 128, Y = 540 + Math.sin(a) * d * 112; const [x, y] = pr(X, Y); put(Y, `<use href="#${id}tree" x="${f(x)}" y="${f(y)}"/>`); }
  for (const [X, Y] of [[60, 240], [96, 250], [1168, 300], [1140, 320], [470, 80], [1010, 30], [1046, 36]]) { const [x, y] = pr(X, Y); put(Y, `<use href="#${id}tree" x="${f(x)}" y="${f(y)}"/>`); }
  for (const [X, Y] of [[1010, 500], [1068, 536], [1124, 492], [1050, 462], [1150, 548], [1094, 590]]) { const [x, y] = pr(X, Y); put(Y, `<use href="#${id}house" x="${f(x)}" y="${f(y)}"/>`); }
  { const [x, y] = pr(1098, 448); put(448, `<g transform="translate(${f(x)} ${f(y)})"><path d="M-7 0v-12h14v12z" fill="#efe3c8" stroke="${INK}" stroke-width=".8"/><path d="M-8 -12l8 -9l8 9z" fill="#7d5a44" stroke="${INK}" stroke-width=".8"/><path d="M0 -21v-8M-3 -26h6" stroke="${INK}" stroke-width="1.2"/></g>`); }
  { const [x, y] = pr(818, 414); put(414, `<g transform="translate(${f(x)} ${f(y)})"><path d="M-9 0v-10h18v10z" fill="#efe3c8" stroke="${INK}" stroke-width=".8"/><path d="M-11 -10l11 -8l11 8z" fill="#a8623a" stroke="${INK}" stroke-width=".8"/><circle cx="-11" cy="-1" r="6" fill="none" stroke="#5a4630" stroke-width="1.6"/><path d="M-17 -1h12M-11 -7v12M-15.2 -5.2l8.4 8.4M-15.2 3.2l8.4 -8.4" stroke="#5a4630" stroke-width=".9"/></g>`); }

  // the companies. cols x rows of small men, each standing for about six; state loosens the block
  const U = [], unit = o => { U.push(o); return o; };
  // theirs, on the ridge and before it
  for (const X of [330, 470, 610, 750, 890]) unit({ side: 1, arm: 'spear', X, Y: 668 + 14 * Math.sin(X / 190), cols: 11, rows: 3 });
  unit({ side: 1, arm: 'archer', X: 560, Y: 560, cols: 13, rows: 2, loose: 1, stakes: 1 });
  unit({ side: 1, arm: 'xbow', X: 842, Y: 444, cols: 6, rows: 2, loose: 0.5 });
  unit({ side: 1, arm: 'levy', X: 330, Y: 452, cols: 10, rows: 3, state: 'wavering' });
  unit({ side: 1, arm: 'knight', X: 150, Y: 700, cols: 6, rows: 2, ghost: 1 });
  // ours
  const you = unit({ side: 0, arm: 'spear', X: 330, Y: 366, cols: 11, rows: 3, you: 1, state: 'wading' });
  unit({ side: 0, arm: 'spear', X: 480, Y: 330, cols: 11, rows: 3 });
  unit({ side: 0, arm: 'spear', X: 628, Y: 336, cols: 11, rows: 3 });
  unit({ side: 0, arm: 'foot', X: 748, Y: 352, cols: 4, rows: 7, column: 1 });
  unit({ side: 0, arm: 'archer', X: 545, Y: 262, cols: 13, rows: 2, loose: 1 });
  unit({ side: 0, arm: 'levy', X: 400, Y: 190, cols: 12, rows: 3 });
  unit({ side: 0, arm: 'levy', X: 580, Y: 176, cols: 12, rows: 3 });
  const kn = unit({ side: 0, arm: 'knight', X: 986, Y: 300, cols: 7, rows: 2, moving: 1 });
  unit({ side: 0, arm: 'knight', X: 1060, Y: 236, cols: 6, rows: 2, moving: 1 });
  unit({ side: 0, arm: 'lhorse', X: 96, Y: 330, cols: 5, rows: 1 });
  const res = unit({ side: 0, arm: 'foot', X: 660, Y: 84, cols: 9, rows: 3, general: 1 });
  for (const u of U) {
    const horse = u.arm === 'knight' || u.arm === 'lhorse', cw = horse ? 13 : 7.4, rh = horse ? 8.5 : 5.2, jit = u.state === 'wavering' ? 3.2 : u.state === 'wading' ? 1.8 : u.loose ? 2.4 * u.loose : 0.5;
    const sym = `#${id}${u.side ? 'e' : 'o'}${horse ? 'h' : u.arm === 'archer' || u.arm === 'xbow' ? 'a' : u.arm === 'foot' ? 'm' : u.arm === 'levy' ? 'l' : 's'}`;
    const [bx, by] = pr(u.X, u.Y);
    for (let rr = 0; rr < u.rows; rr++) for (let c = 0; c < u.cols; c++) {
      // row 0 is the front rank: for us it is the far one (higher on the page), for them the near one
      const dyRow = (u.side === 0 ? -1 : 1) * (u.rows / 2 - rr - 0.5) * rh * (u.loose ? 1.5 : 1);
      let x = bx + (c - (u.cols - 1) / 2) * cw * (u.loose ? 1.25 : 1) + r.s() * jit, y = by + dyRow + r.s() * jit * 0.7;
      if (u.state === 'wavering' && r() < 0.22) { y -= 10 + r() * 16; x += r.s() * 8; }                      // men edging back up the slope
      if (u.moving) x += rr * 5;
      put(u.Y, `<use href="${sym}" x="${f(x)}" y="${f(y)}"${u.ghost ? ' opacity=".3"' : ''}/>`, (y - by) / 100);
    }
    if (u.stakes) for (let c = 0; c < 22; c++) { const [x, y] = pr(u.X - 150 + c * 14 + r.s() * 2, u.Y - 26); put(u.Y - 26, `<path d="M${f(x)} ${f(y)}l2.4 -7" stroke="#5a4630" stroke-width="1.3" stroke-linecap="round"/>`); }
    // the company's standard, behind its ranks
    const fy = by + (u.side === 0 ? 1 : -1) * (u.rows * rh * 0.5 + 3) + (u.side === 0 ? 6 : -2);
    put(u.Y, `<g ${u.ghost ? 'opacity=".4"' : ''}>${flag(bx + (u.column ? 16 : 0), fy, u.side, { arm: horse ? 'horse' : 'foot', you: u.you, s: u.general ? 1.5 : 1.05, ghost: u.ghost })}${u.state === 'wavering' ? `<path d="M${f(bx - 6)} ${f(fy - 34)}q6 -5 12 0" fill="none" stroke="${VERM}" stroke-width="1.6"/>` : ''}</g>`, u.side === 0 ? -0.3 : 0.3);
  }
  // the fallen, where the ford was forced and where the arrows fell
  for (let k = 0; k < 16; k++) { const [x, y] = pr(300 + r() * 80, 404 + r() * 26, 0); put(410, `<use href="#${id}dead" x="${f(x)}" y="${f(y)}" transform="rotate(${r.i(-30, 30)} ${f(x)} ${f(y)})"/>`, -1); }
  for (let k = 0; k < 9; k++) { const [x, y] = pr(480 + r() * 150, 284 + r() * 30); put(290, `<use href="#${id}dead" x="${f(x)}" y="${f(y)}"/>`, -1); }
  tall.sort((a, b) => b[0] - a[0]);
  s += tall.map(t => t[1]).join('');
  // arrows in the air: two volleys crossing, each shaft with its shadow on the ground
  const volley = (from, to, n, c) => { let o = ''; for (let k = 0; k < n; k++) { const a = pr(from[0] + r.s() * 70, from[1] + r.s() * 10), b = pr(to[0] + r.s() * 80, to[1] + r.s() * 14), t = 0.25 + r() * 0.6, mx = lerp(a[0], b[0], t), my = lerp(a[1], b[1], t) - 62 * 4 * t * (1 - t), dx = b[0] - a[0], dy = b[1] - a[1] - 62 * 4 * (1 - 2 * t), L = Math.hypot(dx, dy) || 1; o += `<path d="M${f(mx)} ${f(my)}l${f(-dx / L * 9)} ${f(-dy / L * 9)}" stroke="${c}" stroke-width="1" stroke-linecap="round"/><path d="M${f(mx)} ${f(lerp(a[1], b[1], t))}l${f(-dx / L * 6)} 0" stroke="${INK}" stroke-width="1" stroke-opacity=".14"/>`; } return o; };
  s += volley([545, 262], [560, 552], 26, INK) + volley([560, 560], [550, 330], 20, '#5a2c1c');
  // dust behind the horse
  for (let k = 0; k < 12; k++) { const [x, y] = pr(960 + r() * 150, 196 + r() * 60); s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(5 + r() * 7)}" fill="#cdbb8f" opacity="${f(0.16 + r() * 0.16)}" filter="url(#${id}soft)"/>`; }
  // orders, as arrows a commander draws: gold for what is ordered, a thin vermilion for what the enemy is seen to do
  const P2 = a => a.map(p => pr(...p));
  s += moveArrow(P2([[1000, 330], [1180, 420], [1190, 560], [1010, 640]]), GOLD_D, { w: 3 });                  // the horse: round the village onto their flank
  s += moveArrow(P2([[750, 380], [764, 430], [770, 500]]), GOLD_D, { w: 2.6 });                                // the bridge
  s += moveArrow(P2([[330, 386], [330, 430]]), GOLD_D, { w: 2.6, hs: 0.9 });                                   // the ford
  s += moveArrow(P2([[176, 690], [130, 600], [110, 470]]), VERM, { w: 1.6, dash: '4 4', hs: 0.8 });            // horse behind the wood?
  // a courier with the order for the horse, on his way from the standard
  { const a = pr(res.X + 20, res.Y + 10), b = pr(kn.X - 40, kn.Y - 30), m = [lerp(a[0], b[0], 0.62), lerp(a[1], b[1], 0.62)]; s += `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="${GOLD_D}" stroke-width="1.4" stroke-dasharray="2 5" stroke-linecap="round"/><use href="#${id}oh" x="${f(m[0])}" y="${f(m[1])}"/>` + slip(m[0] - 8, m[1] + 16, 'the order rides: two minutes', { size: 11.5, italic: true, edge: GOLD_D }); }
  // a few words on the field itself, as the game would write them on a press of a company
  { const [x, y] = pr(you.X, you.Y); s += slip(x - 6, y + 34, 'YOUR COMPANY · in the ford, order lost', { size: 11.5, bold: true, edge: GOLD_D, sw: 1.5 }); }
  { const [x, y] = pr(330, 452); s += slip(x - 96, y - 26, 'their levy: wavering', { size: 11.5, italic: true, edge: VERM }); }
  { const [x, y] = pr(150, 700); s += slip(x + 6, y - 44, 'horse behind the wood?', { size: 11.5, italic: true, edge: VERM }); }
  { const [x, y] = pr(res.X, res.Y); s += label(x + 70, y + 8, 'the General, and the reserve', { size: 11.5, italic: true, anchor: 'start' }); }
  s += `</g>`;
  // the bar of phases (top), and the three controls that never change their names (bottom)
  s += `<rect x="0" y="0" width="${W}" height="46" fill="#141a2c"/>`;
  ['Skirmish', 'Clash', 'Press', 'Decision'].forEach((p, k) => { const x = 330 + k * 118; s += `<rect x="${x}" y="10" width="110" height="26" rx="3" fill="${k === 1 ? GOLD : k < 1 ? '#2c3654' : '#1b2338'}" stroke="${k === 1 ? GOLD_D : '#6e7bab'}" stroke-width="1"/><text x="${x + 55}" y="28" text-anchor="middle" font-size="14" font-weight="${k === 1 ? 700 : 400}" fill="${k === 1 ? '#1a1206' : '#bdb8cc'}">${p}</text>`; });
  s += `<text x="16" y="21" font-family="${CAPS}" font-size="14" font-weight="700" letter-spacing="1" fill="#eee8da">THE FORD AT CAMIA</text><text x="16" y="38" font-size="12" font-style="italic" fill="#bdb8cc">about the third hour · wind from the west</text>`;
  s += `<text x="${W - 60}" y="21" text-anchor="end" font-size="12" fill="#bdb8cc">How it goes</text><text x="${W - 60}" y="38" text-anchor="end" font-size="13.5" font-weight="700" fill="#eee8da">evenly matched</text>${scaleIcon(W - 30, 28, 0, '#eee8da')}`;
  s += `<rect x="0" y="572" width="${W}" height="68" fill="#141a2c"/>`;
  s += `<g><rect x="12" y="582" width="560" height="48" rx="4" fill="#1b2338" stroke="#6e7bab" stroke-width="1"/><text x="24" y="602" font-size="13.5" font-weight="700" fill="#f0c062">Oswin’s Hundred · spears of Crossmarch · about 170 men</text><text x="24" y="621" font-size="12.5" fill="#eee8da">steady · winded · plain kit · The Moving Wall, a Basic art: Lock Rims, Turn the Point</text></g>`;
  s += button(596, 586, 118, 40, 'Pause', false, { fill: '#1b2338', edge: '#6e7bab', color: '#eee8da' }) + button(726, 586, 118, 40, 'Orders', false, { fill: '#1b2338', edge: '#6e7bab', color: '#eee8da' }) + button(856, 586, 130, 40, 'Watch', true);
  for (const [n, X, Y, dx, dy] of [[1, 330, 366, -70, -6], [2, 560, 560, 108, -8], [3, 1150, 500, 26, -14], [4, 150, 700, -52, 14], [5, 800, 170, 118, 34], [6, 610, 668, 0, -52], [7, 330, 452, 58, -16]]) { const [x, y] = pr(X, Y); s += note(n, x + dx, y + dy); }
  s += note(8, 842, 566);
  return s + `<rect y="46" width="${W}" height="526" filter="url(#${id}grain)" opacity=".7"/><rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" fill="none" stroke="${INK}" stroke-width="1"/></svg>`;
}
// small men for the field, each about 15 px tall, feet at the origin: o = ours (seen from behind), e = theirs (seen
// from the front); s spear, l levy, m man-at-arms, a bowman, h horseman
function figureSymbols(id) {
  const shadow = `<ellipse cx="0.5" cy="0.4" rx="3.2" ry="1" fill="${INK}" opacity=".22"/>`, legs = `<path d="M-1.5 0V-5M1.5 0V-5" stroke="#3d2f26" stroke-width="1.5"/>`;
  const body = (c, w = 3.1) => `<path d="M${-w} -5L${-w - 0.2} -10.4Q0 -12.2 ${w + 0.2} -10.4L${w} -5Z" fill="${c}" stroke="${INK}" stroke-width=".55"/>`;
  const helm = (c = '#b9bcc4') => `<circle cx="0" cy="-12.8" r="2.1" fill="${c}" stroke="${INK}" stroke-width=".55"/><path d="M-1.2 -14.2A2 2 0 0 1 0.8 -14.7" stroke="#fff" stroke-width=".5" fill="none" opacity=".8"/>`;
  const face = `<circle cx="0" cy="-12.6" r="2" fill="#e0b48e" stroke="${INK}" stroke-width=".5"/><path d="M-2.1 -13A2.1 2.1 0 0 1 2.1 -13Z" fill="#b9bcc4" stroke="${INK}" stroke-width=".45"/>`;
  const spear = (x0, x1) => `<path d="M${x0} -3L${x1} -21" stroke="#5a4630" stroke-width=".8"/><path d="M${x1} -21l-.9 2.4h1.7z" fill="#d8dbe0" stroke="${INK}" stroke-width=".3"/>`;
  const bow = x => `<path d="M${x} -4Q${x + 4.4} -9 ${x} -14.5" fill="none" stroke="#5a4630" stroke-width=".9"/><path d="M${x} -4V-14.5" stroke="${INK}" stroke-width=".3"/>`;
  const horse = (c, dir) => `<g transform="scale(${dir} 1)"><ellipse cx="0" cy="0.6" rx="8" ry="1.6" fill="${INK}" opacity=".22"/><path d="M-6 -1V-6.5M-3.4 -1V-6M3 -1V-6M5.6 -1V-6.5" stroke="#3a2a20" stroke-width="1.3"/><path d="M-7.2 -6.4Q-7.8 -10.6 -3.6 -10.8L4.4 -10.8Q6.6 -10.9 7.4 -13.6L9.6 -15L11 -12.2L9 -11.4Q8.2 -7.4 5.8 -6.6L-6.4 -6.2Z" fill="${c}" stroke="${INK}" stroke-width=".55"/><path d="M-7.2 -9Q-10 -8 -9.4 -4.6" fill="none" stroke="#3a2a20" stroke-width="1"/></g>`;
  const rider = (c, dir) => `<g transform="scale(${dir} 1)"><path d="M-2.6 -10.4L-2.8 -15Q0 -16.6 2.8 -15L2.6 -10.4Z" fill="${c}" stroke="${INK}" stroke-width=".55"/><circle cx="0.2" cy="-17.4" r="2" fill="#b9bcc4" stroke="${INK}" stroke-width=".55"/><path d="M1.8 -12L11 -26" stroke="#5a4630" stroke-width=".9"/><path d="M11 -26l-1.6 1.4l1.9 .6z" fill="#d8dbe0" stroke="${INK}" stroke-width=".3"/></g>`;
  const shieldB = `<ellipse cx="-3.3" cy="-8" rx="1.8" ry="2.7" fill="#d9c9a2" stroke="${INK}" stroke-width=".5"/>`;
  const shieldF = c => `<path d="M-4.4 -10.6h4.2v3.2q0 2.6 -2.1 3.6q-2.1 -1 -2.1 -3.6z" fill="${c}" stroke="${INK}" stroke-width=".5"/><circle cx="-2.3" cy="-8.4" r=".8" fill="${THEIRS.charge}"/>`;
  const sym = (k, inner) => `<symbol id="${id}${k}" overflow="visible">${inner}</symbol>`;
  return sym('os', shadow + legs + spear(3, 5.2) + body(OURS.flag) + shieldB + helm())
    + sym('ol', shadow + legs + spear(3, 4.6) + body('#8fae86') + `<circle cx="0" cy="-12.6" r="2" fill="#7a5a3c" stroke="${INK}" stroke-width=".5"/>`)
    + sym('om', shadow + legs + body('#aab0bb', 3.3) + `<path d="M-1 -11.4v6.2h2v-6.2z" fill="${OURS.flag}"/>` + `<path d="M3.4 -5L6.4 -15" stroke="#d8dbe0" stroke-width="1.1"/>` + helm('#cfd2d8'))
    + sym('oa', shadow + legs + body('#6f8f66', 2.8) + bow(3.2) + `<circle cx="0" cy="-12.6" r="2" fill="#6b4a34" stroke="${INK}" stroke-width=".5"/>`)
    + sym('oh', horse('#6b4a34', 1) + rider(OURS.flag, 1))
    + sym('es', shadow + legs + spear(3.4, 2.2) + body(THEIRS.flag) + shieldF(THEIRS.flag) + face)
    + sym('el', shadow + legs + spear(3.2, 2.6) + body('#c98f5e') + `<circle cx="0" cy="-12.6" r="2" fill="#e0b48e" stroke="${INK}" stroke-width=".5"/><path d="M-2 -13.2A2 2 0 0 1 2 -13.2Z" fill="#6b4a34"/>`)
    + sym('ea', shadow + legs + body('#b98a5a', 2.8) + bow(-4.2) + `<circle cx="0" cy="-12.6" r="2" fill="#e0b48e" stroke="${INK}" stroke-width=".5"/><path d="M-2 -13.2A2 2 0 0 1 2 -13.2Z" fill="#4a3626"/>`)
    + sym('eh', horse('#3f352c', -1) + rider(THEIRS.flag, -1));
}

// ---- sketch 4: the press, on a phone ---------------------------------------------------------------------------------------
function press() {
  const W = 420, H = 880, id = 'P_', r = mk(5), NIGHT = '#0d1120', SURF = '#141a2c', RAISED = '#1b2338', TXT = '#eee8da', TXT2 = '#bdb8cc', LINE = '#6e7bab', ACC = '#f0c062';
  const SK = ['#f3d6c1', '#e8c0a0', '#d9a77f', '#c08a5e'];
  const sheet = (i, o = {}) => ({ id: 'var' + i, name: '', sex: 'M', race: 'human', age: 22 + (i * 7) % 22, alive: true, estate: 'peasant',
    app: { skin: SK[i % 4], hair: i % 6, eye: i % 8, hstyle: ['short', 'cropped', 'wild', 'short'][i % 4], beard: ['stubble', 'short', 'none', 'full'][i % 4], build: ['sturdy', 'average', 'muscular', 'lean'][i % 4] },
    gear: {}, wounds: i === 2 ? [{ k: 'scar_face' }] : [], traits: [], quirks: [], colors: { realm: THEIRS.flag, field: THEIRS.flag, charge: THEIRS.charge }, mood: -0.6, ...o });
  const KIT = [
    { armed: true, gear: { armor: { id: 'mail' }, weapon: { id: 'spear' }, shield: { id: 'kite' }, helm: { id: 'kettle' } } },
    { armed: true, gear: { armor: { id: 'gambeson' }, weapon: { id: 'spear' }, shield: { id: 'heater' }, helm: { id: 'spangen' } } },
    { armed: true, gear: { armor: { id: 'mail' }, weapon: { id: 'spear' }, shield: { id: 'kite' }, helm: { id: 'helm' } } },
    { armed: true, gear: { armor: { id: 'padded' }, weapon: { id: 'spear' }, shield: { id: 'heater' }, helm: { id: 'kettle' } } },
  ];
  const fw = 102, foe = KIT.map((v, i) => compose(lookOf(sheet(i, v)), { crop: 'figure', width: fw, tier: 1, id: `${id}f${i}_` }));
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${SERIF}"><title>The press: your own place in the line, on a phone</title><defs>
<linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b4f8f"/><stop offset=".62" stop-color="#f1b467"/><stop offset="1" stop-color="#ffd58a"/></linearGradient>
<linearGradient id="${id}bank" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9b06a"/><stop offset="1" stop-color="#8f8a52"/></linearGradient>
<linearGradient id="${id}water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6d94bd"/><stop offset="1" stop-color="#2b4f86"/></linearGradient>
<linearGradient id="${id}fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1730" stop-opacity="0"/><stop offset="1" stop-color="#1b1730" stop-opacity=".5"/></linearGradient>
<filter id="${id}haze"><feGaussianBlur stdDeviation="1.6"/></filter>
<filter id="${id}grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 0.3  0 0 0 0 0.25  0 0 0 0 0.15  0 0 0 0.08 0"/></filter>
<clipPath id="${id}scene"><rect x="0" y="52" width="${W}" height="408"/></clipPath></defs>`;
  s += `<rect width="${W}" height="${H}" fill="${NIGHT}"/>`;
  // the place and the phase; a small plan of the line with your place in it
  s += `<text x="16" y="24" font-family="${CAPS}" font-size="14" font-weight="700" letter-spacing="1" fill="${TXT}">THE FORD AT CAMIA</text><text x="16" y="42" font-size="12.5" font-style="italic" fill="${TXT2}">the Clash · your company is in the water</text>`;
  s += `<g transform="translate(${W - 92} 7)"><rect width="78" height="39" rx="4" fill="${RAISED}" stroke="${LINE}" stroke-width="1"/>${[0, 1, 2].map(k => `<rect x="${8 + k * 21}" y="18" width="18" height="7" rx="1" fill="${OURS.flag}" stroke="${k === 0 ? ACC : 'none'}" stroke-width="1.2"/><rect x="${8 + k * 21}" y="7" width="18" height="6" rx="1" fill="${THEIRS.flag}" opacity="${k === 0 ? 0.6 : 1}"/>`).join('')}<circle cx="13" cy="21.5" r="2.6" fill="${ACC}" stroke="${INK}" stroke-width=".8"/><text x="39" y="35" text-anchor="middle" font-size="8" fill="${TXT2}">your place in the line</text></g>`;
  // the scene: sky, the ridge and their second line far off, the bank, the water, their rank, and your own from behind
  let sc = `<rect x="0" y="52" width="${W}" height="260" fill="url(#${id}sky)"/><rect x="0" y="52" width="${W}" height="9" fill="#27336b" opacity=".6"/>`;
  { const pts = []; let v = 0; for (let i = 0; i <= 24; i++) { v = v * 0.6 + r.s() * 6; pts.push([i / 24 * W, 150 + v - 16 * Math.sin(i / 24 * 3.1)]); } sc += `<path d="${line(pts)}L${W} 260L0 260Z" fill="#8a7d86"/>`; for (let k = 0; k < 7; k++) { const x = 40 + k * 54 + r.s() * 8, y = 136 + r.s() * 4 - 14 * Math.sin((x / W) * 3.1); sc += `<path d="M${f(x)} ${f(y + 16)}v-22" stroke="#3b3048" stroke-width="1.2"/><path d="M${f(x)} ${f(y - 6)}h9v6h-9z" fill="${THEIRS.flag}" opacity=".85"/>`; } for (let k = 0; k < 60; k++) { const x = r() * W, y = 142 + r() * 8 - 15 * Math.sin((x / W) * 3.1); sc += `<path d="M${f(x)} ${f(y + 8)}v-${f(7 + r() * 4)}" stroke="#3b3048" stroke-width=".8" opacity=".7"/>`; } }
  sc += `<rect x="0" y="196" width="${W}" height="120" fill="url(#${id}bank)"/><path d="M0 196h${W}" stroke="#ffe7a6" stroke-width="1.4" opacity=".8"/>`;
  for (let k = 0; k < 9; k++) { const x = 30 + r() * 360, y = 70 + r() * 70; sc += `<path d="M${f(x)} ${f(y)}l-7 13" stroke="${INK}" stroke-width="1.1" stroke-linecap="round" opacity=".7"/>`; }   // arrows coming over
  sc += `<rect x="0" y="300" width="${W}" height="160" fill="url(#${id}water)"/>`;
  for (let k = 0; k < 26; k++) { const x = r() * W, y = 306 + r() * 140; sc += `<path d="M${f(x)} ${f(y)}q${f(8 + r() * 10)} -3 ${f(18 + r() * 16)} 0" fill="none" stroke="#dbe8f3" stroke-width="1.1" opacity="${f(0.25 + r() * 0.4)}"/>`; }
  // their rank, drawn by the game's figure library: four men of Varenna on the far bank
  const fh = fw * foe[0].vb[3] / foe[0].vb[2];
  foe.forEach((fg, i) => { const x = 4 + i * 103 + (i % 2 ? 3 : 0), y = 326 - fh + (i % 2 ? 7 : 0); sc += `<g transform="translate(${f(x)} ${f(y)})">${fg.svg}</g>`; });
  sc += `<rect x="0" y="290" width="${W}" height="30" fill="#dbe8f3" opacity=".16" filter="url(#${id}haze)"/>`;
  // your own rank from behind, close: helms, shoulders, shields and spear shafts, with the light on their left edges
  const back = (x, y, k, you, name, tag) => {
    const w = 62 * k, hh = 26 * k;
    let o = `<g transform="translate(${f(x)} ${f(y)})">`;
    o += `<path d="M${f(w * 0.72)} ${f(-hh * 0.4)}L${f(w * 0.98)} ${f(-hh * 9.4)}" stroke="#4a3a28" stroke-width="${f(4.6 * k)}" stroke-linecap="round"/><path d="M${f(w * 0.98)} ${f(-hh * 9.4)}l${f(-5 * k)} ${f(22 * k)}h${f(9 * k)}z" fill="#d8dbe0" stroke="${INK}" stroke-width="1"/>`;   // the spear
    o += `<path d="M${f(-w)} ${f(hh * 3.4)}C${f(-w * 1.02)} ${f(hh * 0.6)} ${f(-w * 0.7)} ${f(-hh * 0.1)} ${f(-w * 0.3)} ${f(-hh * 0.3)}L${f(w * 0.3)} ${f(-hh * 0.3)}C${f(w * 0.7)} ${f(-hh * 0.1)} ${f(w * 1.02)} ${f(hh * 0.6)} ${f(w)} ${f(hh * 3.4)}Z" fill="${OURS.flag}" stroke="${INK}" stroke-width="1.6"/>`;        // shoulders and back
    o += `<path d="M${f(-w * 0.2)} ${f(-hh * 0.3)}v${f(hh * 3.7)}h${f(w * 0.4)}v${f(-hh * 3.7)}z" fill="${OURS.charge}" opacity=".85"/>`;                                                              // the pale of the tabard
    o += `<path d="M${f(-w * 0.96)} ${f(hh * 3.2)}C${f(-w)} ${f(hh * 0.8)} ${f(-w * 0.72)} ${f(0)} ${f(-w * 0.34)} ${f(-hh * 0.24)}" fill="none" stroke="#ffe7a6" stroke-width="${f(2.2 * k)}" opacity=".75"/>`;   // the lit edge
    o += `<path d="M${f(-w * 0.26)} ${f(-hh * 0.2)}q${f(w * 0.26)} ${f(hh * 0.5)} ${f(w * 0.52)} 0v${f(-hh * 0.7)}h${f(-w * 0.52)}z" fill="#8f949e" stroke="${INK}" stroke-width="1.2"/>`;              // mail at the neck
    o += `<path d="M${f(-w * 0.36)} ${f(-hh * 0.8)}C${f(-w * 0.4)} ${f(-hh * 2.5)} ${f(w * 0.4)} ${f(-hh * 2.5)} ${f(w * 0.36)} ${f(-hh * 0.8)}Z" fill="#b9bcc4" stroke="${INK}" stroke-width="1.6"/><path d="M${f(-w * 0.5)} ${f(-hh * 0.8)}h${f(w)}" stroke="${INK}" stroke-width="${f(5 * k)}" stroke-linecap="round"/><path d="M${f(-w * 0.5)} ${f(-hh * 0.8)}h${f(w)}" stroke="#cfd2d8" stroke-width="${f(2.6 * k)}" stroke-linecap="round"/>`;   // a kettle helm from behind
    o += `<path d="M${f(-w * 0.26)} ${f(-hh * 1.5)}C${f(-w * 0.2)} ${f(-hh * 2.1)} ${f(0)} ${f(-hh * 2.2)} ${f(w * 0.1)} ${f(-hh * 2.16)}" fill="none" stroke="#fff" stroke-width="${f(2 * k)}" opacity=".7" stroke-linecap="round"/>`;
    o += `<path d="M${f(-w * 1.16)} ${f(hh * 3.6)}V${f(hh * 1.1)}Q${f(-w * 0.86)} ${f(hh * 0.5)} ${f(-w * 0.56)} ${f(hh * 1.1)}V${f(hh * 3.6)}Z" fill="#d9c9a2" stroke="${you ? ACC : INK}" stroke-width="${you ? 2.4 : 1.6}"/>`;   // the shield's rim on the left arm
    if (name) o += `<g transform="translate(${f(w * 0.12)} ${f(hh * 1.12)})"><rect x="${f(-name.length * 3.9 - 8)}" y="-11" width="${f(name.length * 7.8 + 16)}" height="21" rx="3" fill="${you ? ACC : CARD}" stroke="${INK}" stroke-width="1"/><text x="0" y="4.4" text-anchor="middle" font-size="13" font-weight="700" fill="#1a1206">${esc(name)}</text>${tag ? `<text x="0" y="24" text-anchor="middle" font-size="11.5" font-style="italic" fill="#fff" stroke="${INK}" stroke-width="2.6" paint-order="stroke">${esc(tag)}</text>` : ''}</g>`;
    return o + `</g>`;
  };
  sc += back(64, 396, 1.0, false, 'Bastian', 'beside you, hurt') + back(356, 398, 1.0, false, 'Oswin', 'a veteran') + back(210, 410, 1.14, true, 'You', '');
  sc += `<rect x="0" y="400" width="${W}" height="60" fill="url(#${id}fade)"/>`;
  s += `<g clip-path="url(#${id}scene)">${sc}<rect x="0" y="52" width="${W}" height="408" filter="url(#${id}grain)" opacity=".6"/></g><path d="M0 52h${W}M0 460h${W}" stroke="${INK}" stroke-width="2"/>`;
  // what your eye tells you
  s += `<text x="16" y="484" font-size="13.5" fill="${TXT}"><tspan font-weight="700" fill="${ACC}">Your eye:</tspan> their second man is blown and his shield</text><text x="16" y="502" font-size="13.5" fill="${TXT}">hangs low. The bank is slick. Bastian cannot hold long.</text>`;
  // the forms of your art, as choices; the odds in words and a tipped scale, never a percentage
  s += `<text x="16" y="530" font-family="${CAPS}" font-size="12.5" font-weight="700" letter-spacing="1" fill="${ACC}">YOUR ART · THE MOVING WALL</text>`;
  const choice = (y, t, sub, odds, tip, col) => `<g><rect x="12" y="${y}" width="${W - 24}" height="62" rx="5" fill="${RAISED}" stroke="${LINE}" stroke-width="1"/><text x="24" y="${y + 25}" font-size="15" font-weight="700" fill="${TXT}">${esc(t)}</text><text x="24" y="${y + 46}" font-size="12.5" font-style="italic" fill="${TXT2}">${esc(sub)}</text>${scaleIcon(W - 60, y + 28, tip, TXT)}<text x="${W - 60}" y="${y + 54}" text-anchor="middle" font-size="11" font-weight="700" fill="${col}">${esc(odds)}</text></g>`;
  s += choice(540, 'Lock Rims with Bastian', 'the First Form: hold, and cover him', 'in your favour', -7, '#6fd49a');
  s += choice(608, 'Turn the Point, and step in', 'the Second Form: inside the tired man’s spear', 'evenly matched', 0, '#f5c451');
  s += choice(676, 'Go for their standard', 'no form of yours answers this', 'long odds', 9, '#ff8a73');
  s += `<text x="16" y="760" font-size="12" font-style="italic" fill="${TXT2}">Your art wants a strong arm, and yours is: it sits well on you.</text><text x="16" y="777" font-size="12" font-style="italic" fill="${TXT2}">The Rim Blow and The Wall Walks are not yet yours.</text>`;
  // the three controls, in their fixed places
  s += `<rect x="0" y="${H - 84}" width="${W}" height="84" fill="${SURF}"/><path d="M0 ${H - 84}h${W}" stroke="#2c3654" stroke-width="1"/>`;
  s += button(12, H - 70, 122, 50, 'Pause', false, { fill: RAISED, edge: LINE, color: TXT }) + button(146, H - 70, 122, 50, 'Orders', false, { fill: RAISED, edge: LINE, color: TXT }) + button(280, H - 70, 128, 50, 'Watch', true);
  return s + `</svg>`;
}

for (const [name, make] of [['1-theatre.svg', theatre], ['2-by-rank.svg', byRank], ['3-field.svg', field], ['4-press.svg', press]]) {
  const svg = make(); fs.writeFileSync(path.join(here, name), svg);
  console.log(name.padEnd(16), (svg.length / 1024).toFixed(0).padStart(5), 'KB');
}
