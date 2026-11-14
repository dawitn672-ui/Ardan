// The sketches of docs/design/war.md (D12a), drawn by code. Mock-ups only: nothing here is game code.
//   node docs/design/war/build.mjs      writes 1-theatre.svg, 2-by-rank.svg, 3-field.svg, 4-press.svg beside this file
// Everything that looks random is a seeded stream, so the same run gives the same pictures. The front in sketches 1
// and 2 is not drawn by hand: it is the edge of a spread worked out over the map's ground (fast along roads, slow in
// woods and hills, stopped by the river except at the bridge and the ford, held off by a castle), which is the
// design's "burn". The enemy line in sketch 4 is drawn by the game's own figure library (src/ui/engine/figure, read
// and not changed); everything else is drawn here, in its palette.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compose, lookOf } from '../../../src/ui/engine/figure/index.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const f = n => (Math.round(n * 10) / 10).toString();
const mk = seed => { let s = seed >>> 0; const r = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; r.s = () => r() * 2 - 1; r.i = (a, b) => a + Math.floor(r() * (b - a + 1)); return r; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---- the hand: the game's day-print palette (docs/design/brief.md §1, §7.3) ----------------------------------------
const INK = '#1b1730', SHADE = '#3a2f6b', PAPER = '#efe6d2', PAPER2 = '#e4d8bd', VERM = '#c23c27', GOLD = '#e8b04a', GOLD_D = '#8a5a10';
const SEA_L = '#8fb2d6', SEA_D = '#2b4f86', LAPIS = '#2f4a7a';
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
const line = pts => 'M' + pts.map(p => `${f(p[0])} ${f(p[1])}`).join('L');
// points along a polyline every `step`, with the direction there
function along(pts, step, from = 0) {
  const out = []; let need = from;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], L = Math.hypot(x1 - x0, y1 - y0); let t = need;
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
    const id0 = key(...p0) + '>' + key(...q0); if (used.has(id0)) continue;
    const loop = [p0]; let p = p0, q = q0;
    for (let guard = 0; guard < 20000; guard++) {
      used.add(key(...p) + '>' + key(...q)); used.add(key(...q) + '>' + key(...p)); loop.push(q);
      const nxt = (segs.get(key(...q)) || []).find(([a, b]) => !used.has(key(...a) + '>' + key(...b)));
      if (!nxt) break; p = nxt[0]; q = nxt[1];
    }
    if (loop.length > 8) loops.push(loop);
  }
  return loops;
}

// ---- the country of the sketches (world units: 1 = about 1 km; 1,700 x 1,000) ----------------------------------------
const WW = 1700, WH = 1000;
const COAST = [[-40, 150], [140, 122], [300, 165], [470, 130], [620, 168], [780, 138], [930, 172], [1060, 150], [1128, 196], [1160, 236], [1196, 226], [1230, 192], [1330, 158], [1480, 184], [1600, 150], [1760, 160]];
const BORDER = [[905, 150], [890, 260], [922, 340], [880, 430], [916, 520], [884, 610], [930, 700], [900, 800], [940, 900], [922, 1010]];
const RIVERS = {
  glenwash: { name: 'the Glenwash', w: 4.2, pts: [[1322, 968], [1282, 862], [1214, 762], [1182, 662], [1152, 560], [1176, 462], [1142, 362], [1166, 284], [1164, 232]] },
  vite: { name: '', w: 2.4, pts: [[1560, 640], [1470, 612], [1392, 600], [1300, 572], [1220, 566], [1156, 548]] },
  yew: { name: '', w: 2.4, pts: [[560, 640], [532, 560], [546, 470], [506, 360], [532, 246], [512, 150]] },
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
const WOODS = [[620, 700, 118], [560, 760, 80], [1340, 300, 92], [1420, 330, 64], [968, 372, 46], [330, 360, 88], [1480, 720, 70]];
const HILLS = [[1010, 650, 80], [1090, 720, 70], [960, 760, 70], [1460, 560, 80], [760, 620, 50], [1120, 610, 40]];
const PEAKS = (() => { const r = mk(31), out = []; for (let x = 800; x < 1680; x += 34) { const y = 930 + 26 * Math.sin(x * 0.011) + r.s() * 14; out.push([x + r.s() * 8, y, 20 + r() * 16]); if (r() < 0.6) out.push([x + 16 + r.s() * 6, y + 34 + r() * 10, 16 + r() * 10]); } return out.sort((a, b) => a[1] - b[1]); })();
const coastY = x => { for (let i = 0; i < COAST.length - 1; i++) if (x >= COAST[i][0] && x <= COAST[i + 1][0]) return lerp(COAST[i][1], COAST[i + 1][1], (x - COAST[i][0]) / (COAST[i + 1][0] - COAST[i][0])); return 150; };
const borderX = y => { for (let i = 0; i < BORDER.length - 1; i++) if (y >= BORDER[i][1] && y <= BORDER[i + 1][1]) return lerp(BORDER[i][0], BORDER[i + 1][0], (y - BORDER[i][1]) / (BORDER[i + 1][1] - BORDER[i][1])); return 900; };
const inWood = (x, y) => WOODS.some(([cx, cy, r]) => (x - cx) ** 2 + (y - cy) ** 2 < r * r * (0.8 + 0.25 * Math.sin(x * 0.07) * Math.cos(y * 0.09)));
const inHills = (x, y) => HILLS.some(([cx, cy, r]) => (x - cx) ** 2 + (y - cy) ** 2 < r * r);

// ---- the burn: how far Aldmark's hold has spread into Varenna by "now", and a week ago -------------------------------
// A spread over 5 km cells from the border crossings: cheap along roads, dear in woods and hills, the river a wall but
// for the bridge and the ford, a castle that has not fallen holding its own country. (The game's rule is the same
// idea run week by week from the armies' reach; this is its picture.)
const CS = 5, GW = WW / CS, GH = WH / CS, NOW = +(process.env.NOW || 66);
const BURN = (() => {
  const cost = new Float32Array(GW * GH), T = new Float64Array(GW * GH).fill(1e9);   // Float64: a Float32 store makes the popped key look late, and nodes are skipped
  for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) {
    const x = gx * CS + CS / 2, y = gy * CS + CS / 2, i = gy * GW + gx;
    if (y < coastY(x) + 4 || x < borderX(y)) { cost[i] = 1e6; continue; }
    let c = 1 + 0.35 * Math.sin(x * 0.045) * Math.cos(y * 0.05);
    if (inWood(x, y)) c *= 2.0; if (inHills(x, y)) c *= 1.35; if (y < 345) c *= 3.4;
    const rd = Math.min(...ROADS.map(R => distToPoly(x, y, R.pts) + (R.rank === 2 ? 3 : 0))); if (rd < 9) c *= rd < 5 ? 0.3 : 0.55;
    const rv = Math.min(distToPoly(x, y, RIVERS.glenwash.pts), distToPoly(x, y, RIVERS.vite.pts) + 2);
    if (rv < 7 && Math.hypot(x - BRIDGE[0], y - BRIDGE[1]) > 9 && Math.hypot(x - FORD[0], y - FORD[1]) > 9) c *= 40;
    const dc = Math.hypot(x - PLACES.rocca.x, y - PLACES.rocca.y); if (dc < 34) c *= 30;          // Rocca Pavice holds its country
    if (x > 1166 + (y - 500) * 0.05) c *= 11;                                                     // beyond the river their host stands near
    cost[i] = c;
  }
  // the spread starts where the roads cross the border
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
  const time = (x, y) => T[Math.floor(y / CS) * GW + Math.floor(x / CS)];
  if (process.argv.includes('--times')) for (const [n, x, y] of [['bridge', 1164, 506], ['east bank', 1190, 506], ['ford', 1205, 736], ['beyond ford', 1232, 736], ['south', 1100, 770], ['north', 1000, 330], ['behind Rocca', 1090, 664], ['Rocca', 1046, 640], ['Vitina', 1152, 506], ['far south', 1000, 800]]) console.log(n, Math.round(time(x, y)));
  return { now: at(NOW), before: at(NOW - 9), time };
})();

// ---- the armies and what they know ------------------------------------------------------------------------------------
const HOSTS = [
  { id: 'you', side: 0, x: 1112, y: 500, n: 'Your host', men: '9,400', arm: 'foot', you: true },
  { id: 'count', side: 0, x: 1066, y: 668, n: 'The Count of Briarbrook', men: '2,100', arm: 'foot', siege: true },
  { id: 'duke', side: 0, x: 1178, y: 742, n: 'The Duke of Yewmarch', men: '5,800', arm: 'horse', age: 'two days old' },
  { id: 'king', side: 1, x: 1296, y: 486, n: 'King Aurel’s host', men: 'about 11,000', arm: 'foot', age: 'seen yesterday' },
  { id: 'north', side: 1, x: 1262, y: 236, n: '', men: 'about 3,000?', arm: 'horse', age: 'seen six days ago', ghost: true },
  { id: 'raid', side: 1, x: 934, y: 548, n: 'riders', men: 'a few hundred', arm: 'raid', age: 'this morning' },
];

// ---- drawing the map ---------------------------------------------------------------------------------------------------
const DEFS = id => `
<filter id="${id}grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.27  0 0 0 0 0.16  0 0 0 0.09 0"/></filter>
<filter id="${id}soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="5"/></filter>
<filter id="${id}soft2" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2"/></filter>
<filter id="${id}veil" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="16"/></filter>
<linearGradient id="${id}sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${SEA_D}"/><stop offset="1" stop-color="${SEA_L}"/></linearGradient>
<pattern id="${id}hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><rect width="7" height="7" fill="${OURS.wash}" fill-opacity=".5"/><line x1="0" y1="0" x2="0" y2="7" stroke="${OURS.ink}" stroke-width="1.5" stroke-opacity=".5"/></pattern>
<pattern id="${id}gain" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-38)"><line x1="0" y1="0" x2="0" y2="5" stroke="${VERM}" stroke-width="1.2" stroke-opacity=".5"/></pattern>
<pattern id="${id}rain" width="9" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(22)"><line x1="2" y1="1" x2="2" y2="10" stroke="${LAPIS}" stroke-width="1" stroke-opacity=".34"/></pattern>
<radialGradient id="${id}ember"><stop offset="0" stop-color="#ffd27a" stop-opacity=".95"/><stop offset=".5" stop-color="${VERM}" stop-opacity=".5"/><stop offset="1" stop-color="${VERM}" stop-opacity="0"/></radialGradient>`;

const landPath = () => smooth([...COAST, [WW + 60, 150], [WW + 60, WH + 60], [-60, WH + 60], [-60, 150]].slice(0, COAST.length).concat([[WW + 60, 1060], [-60, 1060]]), true);

function flag(x, y, side, o = {}) {
  // a standard on a pole: square for foot, swallowtail for horse, a small pennon for riders out raiding
  const C = side === 0 ? OURS : THEIRS, s = o.s || 1, w = 17 * s, h = 12 * s, ph = 25 * s, g = o.ghost;
  const shape = o.arm === 'horse' ? `M0 0H${f(w)}L${f(w - 5 * s)} ${f(h / 2)}L${f(w)} ${f(h)}H0Z` : o.arm === 'raid' ? `M0 0L${f(w * 0.9)} ${f(h * 0.4)}L0 ${f(h * 0.8)}Z` : `M0 0H${f(w)}V${f(h)}H0Z`;
  const charge = side === 0 ? `<circle cx="${f(w * 0.45)}" cy="${f(h / 2)}" r="${f(2.6 * s)}" fill="${C.charge}"/>` : `<path d="M${f(w * 0.2)} ${f(h * 0.75)}L${f(w * 0.46)} ${f(h * 0.3)}L${f(w * 0.72)} ${f(h * 0.75)}" fill="none" stroke="${C.charge}" stroke-width="${f(1.8 * s)}"/>`;
  return `<g transform="translate(${f(x)} ${f(y)})" ${g ? 'opacity=".5"' : ''}>`
    + `<ellipse cx="0" cy="0" rx="${f(5 * s)}" ry="${f(2 * s)}" fill="${INK}" opacity=".25"/>`
    + `<line x1="0" y1="0" x2="0" y2="${f(-ph)}" stroke="${INK}" stroke-width="${f(1.5 * s)}" stroke-linecap="round"/>`
    + `<g transform="translate(0.6 ${f(-ph)})"><path d="${shape}" fill="${C.flag}" stroke="${o.you ? GOLD : INK}" stroke-width="${o.you ? 2 * s : 1 * s}" ${g ? 'stroke-dasharray="3 2"' : ''}/>${o.arm === 'raid' ? '' : charge}</g>`
    + (o.you ? `<circle cx="0" cy="${f(-ph - 3 * s)}" r="${f(2.4 * s)}" fill="${GOLD}" stroke="${INK}" stroke-width=".7"/>` : '') + `</g>`;
}
// a slip of paper with a few words
function slip(x, y, text, o = {}) {
  const fs_ = o.size || 12.5, w = o.w || text.length * fs_ * 0.54 + 12, h = fs_ + 8, ax = o.anchor === 'start' ? x : o.anchor === 'end' ? x - w : x - w / 2;
  return `<g><rect x="${f(ax)}" y="${f(y - h / 2)}" width="${f(w)}" height="${f(h)}" rx="2.5" fill="${o.fill || '#fbf6ea'}" fill-opacity="${o.op ?? 0.94}" stroke="${o.edge || INK}" stroke-width="${o.sw || 0.8}"/>`
    + `<text x="${f(ax + w / 2)}" y="${f(y + fs_ * 0.34)}" text-anchor="middle" font-family="${SERIF}" font-size="${fs_}" ${o.italic ? 'font-style="italic"' : ''} ${o.bold ? 'font-weight="700"' : ''} fill="${o.color || INK}">${esc(text)}</text></g>`;
}
const label = (x, y, text, o = {}) => `<text x="${f(x)}" y="${f(y)}" text-anchor="${o.anchor || 'middle'}" font-family="${o.caps ? CAPS : SERIF}" font-size="${o.size || 12}" ${o.italic ? 'font-style="italic"' : ''} ${o.bold ? 'font-weight="700"' : ''} ${o.spacing ? `letter-spacing="${o.spacing}"` : ''} fill="${o.color || INK}" ${o.op ? `opacity="${o.op}"` : ''} stroke="${o.halo || PAPER}" stroke-width="${o.hw ?? 3}" paint-order="stroke" stroke-linejoin="round">${esc(text)}</text>`;
const note = (n, x, y) => `<g><circle cx="${f(x)}" cy="${f(y)}" r="9.5" fill="${INK}" stroke="${PAPER}" stroke-width="1.4"/><text x="${f(x)}" y="${f(y + 4.2)}" text-anchor="middle" font-family="${SERIF}" font-size="12" font-weight="700" fill="${PAPER}">${n}</text></g>`;

function placeGlyph(p, s = 1) {
  const { x, y, k } = p, C = p.r ? THEIRS : OURS;
  if (k === 'castle') return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path d="M-7 4V-6H-4.5V-9H-2V-6H2V-9H4.5V-6H7V4Z" fill="#f4eee0" stroke="${INK}" stroke-width="1.1"/><path d="M-1.6 4V-0.5A1.6 1.6 0 0 1 1.6 -0.5V4Z" fill="${INK}"/><line x1="0" y1="-9" x2="0" y2="-16" stroke="${INK}" stroke-width="1"/><path d="M0 -16H6L4.5 -13.8L6 -11.6H0Z" fill="${C.flag}" stroke="${INK}" stroke-width=".6"/></g>`;
  if (k === 'capital') return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path d="M-10 5V-4H-7V-7H-4V-4H-2V-11H2V-4H4V-7H7V-4H10V5Z" fill="#f4eee0" stroke="${INK}" stroke-width="1.2"/><line x1="0" y1="-11" x2="0" y2="-20" stroke="${INK}" stroke-width="1.1"/><path d="M0 -20H8V-14.5H0Z" fill="${C.flag}" stroke="${INK}" stroke-width=".7"/><circle cx="4" cy="-17.2" r="1.3" fill="${C.charge}"/></g>`;
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path d="M-6 4V-1L-2.5 -5L1 -1V4Z" fill="#f4eee0" stroke="${INK}" stroke-width="1"/><path d="M1 4V-3H6V4Z" fill="#f4eee0" stroke="${INK}" stroke-width="1"/><path d="M3 -3V-7L4.5 -9L6 -7V-3" fill="#f4eee0" stroke="${INK}" stroke-width=".9"/></g>`;
}

// the whole map as one group in world units. o: { id, held: draw the burn, weather, plain: no war marks }
function drawMap(o) {
  const id = o.id, r = mk(11), parts = [];
  // sea, with ripple lines along the coast
  parts.push(`<rect x="-60" y="-60" width="${WW + 120}" height="${WH + 120}" fill="url(#${id}sea)"/>`);
  const land = smooth([...COAST, [WW + 60, WH + 60], [-60, WH + 60]], true);
  for (const [w, op] of [[26, 0.16], [15, 0.2], [7, 0.3]]) parts.push(`<path d="${land}" fill="none" stroke="#dfeaf2" stroke-width="${w}" stroke-opacity="${op}" stroke-linejoin="round"/>`);
  parts.push(`<path d="${land}" fill="${PAPER}" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>`);
  parts.push(`<clipPath id="${id}land"><path d="${land}"/></clipPath>`);
  // the realms as a wash, stronger in a ribbon along the border
  const b = smooth(BORDER), west = `${b}L-60 ${WH + 60}L-60 -60L905 -60Z`, east = `${b}L${WW + 60} ${WH + 60}L${WW + 60} -60L905 -60Z`;
  parts.push(`<g clip-path="url(#${id}land)"><path d="${west}" fill="${OURS.wash}" fill-opacity=".42"/><path d="${east}" fill="${THEIRS.wash}" fill-opacity=".5"/>`
    + `<path d="${b}" fill="none" stroke="${OURS.wash}" stroke-width="16" stroke-opacity=".5" transform="translate(-8 0)"/><path d="${b}" fill="none" stroke="${THEIRS.wash}" stroke-width="16" stroke-opacity=".6" transform="translate(8 0)"/></g>`);
  // the burn: land held (hatched in the holder's ink), the week's gain, the smouldering edge
  if (o.held) {
    const now = BURN.now.map(lp => smooth(lp, true)).join(''), before = BURN.before.map(lp => smooth(lp, true)).join('');
    parts.push(`<g clip-path="url(#${id}land)">`
      + `<path d="${now}" fill="#3b2a1c" fill-opacity=".34" filter="url(#${id}soft)" stroke="#3b2a1c" stroke-opacity=".5" stroke-width="16"/>`            // the scorch creeping ahead of the line
      + `<path d="${now}" fill="url(#${id}hatch)" fill-rule="evenodd"/>`
      + `<path d="${now}${before}" fill="url(#${id}gain)" fill-rule="evenodd"/>`                                                                           // ground won this week
      + `<path d="${before}" fill="none" stroke="${INK}" stroke-width="1" stroke-dasharray="2 4" stroke-opacity=".6"/>`
      + `<path d="${now}" fill="none" stroke="#2a1a12" stroke-width="3.4" stroke-linejoin="round"/>`
      + `<path d="${now}" fill="none" stroke="${VERM}" stroke-width="1.7" stroke-linejoin="round"/>`
      + `</g>`);
  }
  // rivers
  for (const k in RIVERS) { const R = RIVERS[k], d = smooth(R.pts); parts.push(`<path d="${d}" fill="none" stroke="${SEA_D}" stroke-width="${R.w + 1.6}" stroke-linecap="round" stroke-opacity=".85"/><path d="${d}" fill="none" stroke="${SEA_L}" stroke-width="${R.w - 0.6}" stroke-linecap="round"/>`); }
  // hills, woods, peaks (glyphs placed by a seeded lattice, as 62-inked-map does)
  let g = '';
  for (const [cx, cy, rad] of HILLS) for (let k = 0; k < rad * 0.5; k++) { const a = r() * 6.283, d = Math.sqrt(r()) * rad, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.8; g += `<path d="M${f(x - 7)} ${f(y)}Q${f(x)} ${f(y - 8)} ${f(x + 7)} ${f(y)}" fill="none" stroke="${INK}" stroke-width=".9" stroke-opacity=".55"/><path d="M${f(x + 1)} ${f(y - 3.6)}L${f(x + 3)} ${f(y - 0.6)}M${f(x + 3.4)} ${f(y - 2.6)}L${f(x + 5)} ${f(y - 0.4)}" stroke="${INK}" stroke-width=".7" stroke-opacity=".4"/>`; }
  const trees = [];
  for (const [cx, cy, rad] of WOODS) for (let k = 0; k < rad * rad / 60; k++) { const a = r() * 6.283, d = Math.sqrt(r()) * rad, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.85; if (inWood(x, y) && y > coastY(x) + 8) trees.push([x, y, 3.4 + r() * 1.8]); }
  trees.sort((a, b2) => a[1] - b2[1]);
  for (const [x, y, s] of trees) g += `<path d="M${f(x)} ${f(y)}v${f(s * 0.9)}" stroke="${INK}" stroke-width=".8"/><circle cx="${f(x)}" cy="${f(y - s * 0.3)}" r="${f(s)}" fill="#7fa37a" stroke="${INK}" stroke-width=".7"/><path d="M${f(x + s * 0.2)} ${f(y - s * 0.3 + s * 0.9)}A${f(s)} ${f(s)} 0 0 0 ${f(x + s * 0.95)} ${f(y - s * 0.1)}" fill="none" stroke="${SHADE}" stroke-width="1" stroke-opacity=".35"/>`;
  for (const [x, y, s] of PEAKS) g += `<path d="M${f(x - s * 0.8)} ${f(y)}L${f(x)} ${f(y - s)}L${f(x + s * 0.8)} ${f(y)}Z" fill="#e9e2d2" stroke="${INK}" stroke-width="1"/><path d="M${f(x)} ${f(y - s)}L${f(x + s * 0.8)} ${f(y)}L${f(x + s * 0.12)} ${f(y)}Z" fill="${SHADE}" fill-opacity=".34"/><path d="M${f(x - s * 0.3)} ${f(y - s * 0.62)}L${f(x)} ${f(y - s)}L${f(x + s * 0.3)} ${f(y - s * 0.62)}L${f(x + s * 0.08)} ${f(y - s * 0.72)}L${f(x - s * 0.1)} ${f(y - s * 0.56)}Z" fill="#fff" stroke="${INK}" stroke-width=".5"/>`;
  parts.push(`<g clip-path="url(#${id}land)">${g}</g>`);
  // the border, as a dotted ink line that cannot be taken for a road
  parts.push(`<path d="${b}" fill="none" stroke="${INK}" stroke-width="1.6" stroke-dasharray="1 5" stroke-linecap="round" clip-path="url(#${id}land)"/>`);
  // roads in two ranks, on a paper halo
  for (const R of ROADS) { const d = smooth(R.pts); parts.push(`<path d="${d}" fill="none" stroke="${PAPER}" stroke-width="${R.rank === 1 ? 4.6 : 3}" stroke-opacity=".8"/><path d="${d}" fill="none" stroke="#6b4a2b" stroke-width="${R.rank === 1 ? 2 : 1.1}" ${R.rank === 2 ? 'stroke-dasharray="6 3"' : ''} stroke-linecap="round"/>`); }
  // the bridge and the ford
  parts.push(`<g transform="translate(${BRIDGE[0]} ${BRIDGE[1]})"><rect x="-7" y="-3" width="14" height="6" fill="#f4eee0" stroke="${INK}" stroke-width="1"/><path d="M-7 -3V-6M7 -3V-6M-7 3V6M7 3V6" stroke="${INK}" stroke-width="1"/></g>`);
  parts.push(`<g transform="translate(${FORD[0]} ${FORD[1]})">${[-5, -1.5, 2, 5.5].map((dx, k) => `<circle cx="${dx}" cy="${k % 2 ? 1.2 : -1}" r="1.5" fill="#f4eee0" stroke="${INK}" stroke-width=".7"/>`).join('')}</g>`);
  return parts.join('\n');
}

// a rain band, a siege ring, a scorch, carts on a road
const rain = (id, x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id}rain)" clip-path="url(#${id}land)"/>`;
function carts(pts, from, to, step = 26) {
  let s = '';
  for (const [x, y, dx] of along(chaikin(pts, 2), step, from)) { if (to && x > to) break; s += `<g transform="translate(${f(x)} ${f(y - 1.5)}) scale(${dx < 0 ? -1 : 1} 1)"><rect x="-3.6" y="-3.4" width="7.2" height="3.6" rx=".8" fill="#f4eee0" stroke="${INK}" stroke-width=".8"/><circle cx="-2" cy=".9" r="1.3" fill="${INK}"/><circle cx="2.2" cy=".9" r="1.3" fill="${INK}"/></g>`; }
  return s;
}
function scorch(x, y, rad, seed) {
  const r = mk(seed); let s = `<circle cx="${x}" cy="${y}" r="${rad}" fill="#2a1a12" fill-opacity=".3" filter="url(#T_soft)"/>`;
  for (let k = 0; k < rad * 1.6; k++) { const a = r() * 6.283, d = Math.sqrt(r()) * rad; s += `<circle cx="${f(x + Math.cos(a) * d)}" cy="${f(y + Math.sin(a) * d * 0.8)}" r="${f(0.6 + r() * 0.9)}" fill="#2a1a12" fill-opacity=".7"/>`; }
  return s;
}
const smoke = (x, y, s = 1) => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})" opacity=".75"><path d="M0 0C-5 -7 4 -10 -1 -17C-5 -23 3 -27 0 -33" fill="none" stroke="#4a4038" stroke-width="2.6" stroke-linecap="round" stroke-opacity=".55"/><path d="M4 -2C1 -8 8 -11 5 -17" fill="none" stroke="#4a4038" stroke-width="1.8" stroke-linecap="round" stroke-opacity=".4"/></g>`;
const flame = (x, y, s = 1) => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><circle r="8" fill="url(#T_ember)"/><path d="M0 2C-3.4 1 -3 -2.6 -1 -4.2C-1 -2.4 0.4 -2.6 0.2 -5.6C2.8 -3.6 3.6 0.6 0 2Z" fill="#ffcf6a" stroke="${VERM}" stroke-width=".7"/></g>`;
const arrowHead = (x, y, dx, dy, c, s = 1) => { const a = Math.atan2(dy, dx) * 180 / Math.PI; return `<path d="M0 0L-9 -4.2L-6.6 0L-9 4.2Z" fill="${c}" transform="translate(${f(x)} ${f(y)}) rotate(${f(a)}) scale(${s})"/>`; };
function moveArrow(pts, c, o = {}) { const q = chaikin(pts, 2), n = q.length, [x1, y1] = q[n - 1], [x0, y0] = q[n - 2]; return `<path d="${line(q)}" fill="none" stroke="${PAPER}" stroke-width="${(o.w || 2.4) + 2.2}" stroke-opacity=".75" stroke-linecap="round"/><path d="${line(q)}" fill="none" stroke="${c}" stroke-width="${o.w || 2.4}" stroke-linecap="round" ${o.dash ? `stroke-dasharray="${o.dash}"` : ''}/>${arrowHead(x1, y1, x1 - x0, y1 - y0, c, o.hs || 1)}`; }

// ---- sketch 1: the theatre, as a General sees it -------------------------------------------------------------------------
function theatre() {
  const W = 1000, H = 640, vx = 640, vy = 150, id = 'T_';
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${SERIF}"><title>The theatre: a war seen from above, at a General's rank</title><defs>${DEFS(id)}<clipPath id="${id}view"><rect width="${W}" height="${H}"/></clipPath></defs>`;
  s += `<g clip-path="url(#${id}view)"><g transform="translate(${-vx} ${-vy})">`;
  s += drawMap({ id, held: true });
  // what the General does not know: beyond his riders' reach the map is pale, and the enemy there is a guess
  const seen = HOSTS.filter(h => h.side === 0).map(h => `<circle cx="${h.x}" cy="${h.y}" r="${h.you ? 172 : 120}"/>`).join('') + `<path d="${smooth(ROADS[0].pts.slice(4, 9))}" fill="none" stroke="#000" stroke-width="120" stroke-linecap="round"/>`;
  s += `<mask id="${id}fog"><rect x="0" y="0" width="${WW}" height="${WH}" fill="#fff"/><g filter="url(#${id}veil)" fill="#000" stroke="#000">${seen}</g></mask>`;
  s += `<rect x="${vx}" y="${vy}" width="${W}" height="${H}" fill="#f6f0e2" fill-opacity=".52" mask="url(#${id}fog)"/>`;
  // weather: rain on the coast road, the first snow on the peaks
  s += rain(id, 640, 150, 1000, 150) + label(1420, 262, 'rain on the coast: the north road is mud', { italic: true, size: 12.5, color: LAPIS });
  // the supply road: carts from Crossmarch to the host, cut where the riders struck
  s += carts(ROADS[0].pts.slice(4, 9), 14, 880) + carts(ROADS[0].pts.slice(4, 9), 150, 1100);
  s += scorch(934, 500, 20, 5) + flame(922, 492, 1) + flame(942, 508, 0.8) + smoke(930, 486, 0.9);
  s += `<path d="M898 472l14 18m0 -18l-14 18" stroke="${VERM}" stroke-width="2.6" stroke-linecap="round"/>`;
  // the siege of Rocca Pavice: a ring, tents, smoke
  s += `<circle cx="${PLACES.rocca.x}" cy="${PLACES.rocca.y}" r="19" fill="none" stroke="${OURS.ink}" stroke-width="2" stroke-dasharray="5 3"/>` + smoke(PLACES.rocca.x + 4, PLACES.rocca.y - 12, 0.8);
  for (const [dx, dy] of [[-22, 10], [-14, 20], [20, 14]]) s += `<path d="M${PLACES.rocca.x + dx - 4} ${PLACES.rocca.y + dy}l4 -6l4 6z" fill="#f4eee0" stroke="${INK}" stroke-width=".8"/>`;
  // the embers along the stretch of front where fighting goes on this week
  for (const [x, y] of [[1178, 492], [1186, 512], [1170, 474], [1212, 730], [1222, 746]]) s += flame(x, y, 0.8);
  // places and their names
  for (const k in PLACES) { const p = PLACES[k]; if (p.x < vx - 20) continue; s += placeGlyph(p, 1.15); s += label(p.x + (k === 'vitina' ? -14 : 0), p.y + (k === 'rocca' ? 36 : k === 'vitina' ? 24 : 19), p.n, { size: p.k === 'capital' ? 14 : 12.5, italic: p.k !== 'capital', bold: p.k === 'capital' }); }
  s += label(1132, 318, 'the Glenwash', { italic: true, size: 12, color: SEA_D }) + label(1260, 960, 'Harrow Pass: shut by snow in three weeks', { italic: true, size: 12 }) + label(780, 214, 'ALDMARK', { caps: true, size: 19, spacing: 5, color: OURS.ink, op: 0.75 }) + label(1470, 330, 'VARENNA', { caps: true, size: 19, spacing: 5, color: THEIRS.ink, op: 0.75 });
  // planned marches for the week (gold: yours; green: your side's)
  s += moveArrow([[1124, 494], [1160, 500], [1206, 494], [1246, 490]], GOLD_D, { w: 2.8 }) + moveArrow([[1190, 742], [1240, 738], [1284, 736]], OURS.ink, { w: 2, dash: '7 4' });
  s += moveArrow([[950, 556], [1000, 600], [1030, 690], [1100, 770]], THEIRS.ink, { w: 1.8, dash: '3 4', hs: 0.8 });
  // the hosts
  for (const h of HOSTS) {
    s += flag(h.x, h.y, h.side, { arm: h.arm, you: h.you, ghost: h.ghost, s: h.arm === 'raid' ? 0.8 : 1.25 });
    const right = h.id === 'king' || h.id === 'north' || h.id === 'duke';
    s += slip(h.x + (right ? 14 : -12), h.y + 13, h.men, { anchor: right ? 'start' : 'end', edge: h.you ? GOLD_D : h.side ? THEIRS.ink : OURS.ink, sw: h.you ? 1.6 : 1, bold: h.you, italic: h.side === 1 });
    if (h.age) s += label(h.x + (right ? 14 : -12), h.y + 34, h.age, { anchor: right ? 'start' : 'end', italic: true, size: 11.5, op: 0.85 });
  }
  s += `</g></g>`;
  // the page's own furniture: a cartouche, the two buttons that move time, and numbered notes for the document
  s += `<g><rect x="14" y="14" width="318" height="62" rx="3" fill="#fbf6ea" fill-opacity=".95" stroke="${INK}" stroke-width="1.2"/><rect x="18" y="18" width="310" height="54" rx="2" fill="none" stroke="${GOLD_D}" stroke-width=".8"/>`
    + `<text x="30" y="42" font-family="${CAPS}" font-size="17" font-weight="700" letter-spacing="1.5" fill="${INK}">THE WAR FOR THE GLENWASH</text><text x="30" y="62" font-size="13" font-style="italic" fill="${INK}">October 1123 · the twenty-sixth week · the leaves are turning</text></g>`;
  const btn = (x, t, main) => `<g><rect x="${x}" y="${H - 54}" width="132" height="38" rx="5" fill="${main ? GOLD : '#fbf6ea'}" stroke="${main ? GOLD_D : INK}" stroke-width="1.3"/><text x="${x + 66}" y="${H - 29}" text-anchor="middle" font-size="16" font-weight="700" fill="#1a1206">${t}</text></g>`;
  s += btn(W - 290, 'Next day', false) + btn(W - 148, 'Next week', true);
  s += `<g><rect x="14" y="${H - 56}" width="372" height="42" rx="3" fill="#fbf6ea" fill-opacity=".95" stroke="${INK}" stroke-width="1"/><text x="26" y="${H - 38}" font-size="12.5" fill="${INK}"><tspan font-weight="700">How the war stands:</tspan> in your favour.</text><text x="26" y="${H - 22}" font-size="12" font-style="italic" fill="${INK}">Camia is yours; the bridge is not; bread for nine days.</text>`
    + `<g transform="translate(360 ${H - 35})"><line x1="0" y1="-12" x2="0" y2="8" stroke="${INK}" stroke-width="1.4"/><line x1="-13" y1="-8" x2="13" y2="-14" stroke="${INK}" stroke-width="1.6"/><path d="M-17 -3a4 4 0 0 0 8 0zM9 -9a4 4 0 0 0 8 0z" fill="${GOLD}" stroke="${INK}" stroke-width=".9"/><path d="M-6 9h12" stroke="${INK}" stroke-width="2"/></g></g>`;
  const N = [[1, 1180 - vx, 460 - vy], [2, 1076 - vx, 612 - vy], [3, 902 - vx, 452 - vy], [4, 1010 - vx, 540 - vy], [5, 1318 - vx, 436 - vy], [6, 1262 - vx, 196 - vy], [7, 700, 138], [8, 930, 566]];
  for (const [n, x, y] of N) s += note(n, x, y);
  return s + `<rect width="${W}" height="${H}" filter="url(#${id}grain)" opacity=".8"/><rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" fill="none" stroke="${INK}" stroke-width="1"/></svg>`;
}

fs.writeFileSync(path.join(here, '1-theatre.svg'), theatre());
console.log('1-theatre.svg', (fs.statSync(path.join(here, '1-theatre.svg')).size / 1024).toFixed(0), 'KB');
