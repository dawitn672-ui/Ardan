// The sculpted base (characters.md §2, the fallback named there): MakeHuman's CC0 mesh and shape targets, decoded once.
// shape(weights) sums targets onto the base; landmarks are found from the mesh itself (the lid and lip margins are the
// mesh's own open edges; a feature's points are the ones its target moves most), so nothing is hand-numbered.
import { MESH, TARGETS } from './basemesh.data.js';

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const LUT = new Uint8Array(128); for (let i = 0; i < 64; i++) LUT[B64.charCodeAt(i)] = i;
function unb64(s) {
  const n = s.length, pad = s.endsWith('==') ? 2 : s.endsWith('=') ? 1 : 0, out = new Uint8Array((n * 3) / 4 - pad);
  let o = 0;
  for (let i = 0; i < n; i += 4) {
    const a = LUT[s.charCodeAt(i)], b = LUT[s.charCodeAt(i + 1)], c = LUT[s.charCodeAt(i + 2)], d = LUT[s.charCodeAt(i + 3)];
    const v = (a << 18) | (b << 12) | (c << 6) | d;
    if (o < out.length) out[o++] = v >> 16; if (o < out.length) out[o++] = (v >> 8) & 255; if (o < out.length) out[o++] = v & 255;
  }
  return out;
}

let CACHE = null;
export function base() {
  if (CACHE) return CACHE;
  const nv = MESH.nv, pb = unb64(MESH.pos), p16 = new Int16Array(pb.buffer, pb.byteOffset, nv * 3);
  const pos = new Float32Array(nv * 3); for (let i = 0; i < nv * 3; i++) pos[i] = p16[i] / 20;   // mm
  const qb = unb64(MESH.quads), quads = new Uint16Array(qb.buffer.slice(qb.byteOffset, qb.byteOffset + MESH.nq * 8));
  const targets = {};
  for (const [name, t] of Object.entries(TARGETS)) {
    const ib = unb64(t.i), idx = new Uint16Array(t.n); let k = 0, prev = -1;
    for (let j = 0; j < ib.length && k < t.n;) { let d = 0, sh = 0, b; do { b = ib[j++]; d |= (b & 127) << sh; sh += 7; } while (b & 128); prev = prev + 1 + d; idx[k++] = prev; }
    const db = unb64(t.d), D = t.p === 2 ? new Int16Array(db.buffer.slice(db.byteOffset, db.byteOffset + t.n * 6)) : new Int8Array(db.buffer.slice(db.byteOffset, db.byteOffset + t.n * 3));
    targets[name] = { idx, D, s: t.s };
  }
  CACHE = { nv, nq: MESH.nq, pos, quads, ranges: MESH.ranges, targets };
  CACHE.marks = findMarks(CACHE);
  return CACHE;
}

// the sum of weighted targets on the base, in mm
export function shape(weights) {
  const M = base(), P = new Float32Array(M.pos);
  for (const [name, w] of Object.entries(weights)) {
    if (!w) continue; const t = M.targets[name]; if (!t) continue;
    const k = w * t.s, I = t.idx, D = t.D;
    for (let j = 0; j < I.length; j++) { const o = I[j] * 3; P[o] += D[j * 3] * k; P[o + 1] += D[j * 3 + 1] * k; P[o + 2] += D[j * 3 + 2] * k; }
  }
  return P;
}

// how far each vertex is moved by a target (a mask of where a feature lives)
export function reach(name) {
  const M = base(), t = M.targets[name], out = new Float32Array(M.nv); if (!t) return out;
  for (let j = 0; j < t.idx.length; j++) out[t.idx[j]] = Math.hypot(t.D[j * 3], t.D[j * 3 + 1], t.D[j * 3 + 2]) * t.s;
  return out;
}

// ---------- landmarks, found once from the neutral mesh ----------
function findMarks(M) {
  const P = M.pos, Q = M.quads, [b0, b1] = M.ranges.body;
  // open edges of the skin: the lid margins and the lips' parting
  const edges = new Map();
  for (let f = b0; f < b1; f++) for (let e = 0; e < 4; e++) {
    const a = Q[f * 4 + e], b = Q[f * 4 + ((e + 1) & 3)]; if (a === b) continue;
    const key = a < b ? a * 65536 + b : b * 65536 + a; edges.set(key, (edges.get(key) || 0) + 1);
  }
  const open = []; for (const [k, n] of edges) if (n === 1) open.push([Math.floor(k / 65536), k % 65536]);
  const eyeC = side => { const [r0, r1] = M.ranges[side > 0 ? 'helper-l-eye' : 'helper-r-eye']; let s = [0, 0, 0], n = 0, mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; for (let f = r0; f < r1; f++) for (let e = 0; e < 4; e++) { const v = Q[f * 4 + e]; for (let c = 0; c < 3; c++) { mn[c] = Math.min(mn[c], P[v * 3 + c]); mx[c] = Math.max(mx[c], P[v * 3 + c]); } } return { c: [0, 1, 2].map(c => (mn[c] + mx[c]) / 2), r: (mx[0] - mn[0]) / 2 }; };
  const eyes = [1, -1].map(eyeC);
  // group open-edge vertices by what they ring
  const near = (v, c, r) => Math.hypot(P[v * 3] - c[0], P[v * 3 + 1] - c[1], P[v * 3 + 2] - c[2]) < r;
  const ringOf = test => { const set = new Set(); for (const [a, b] of open) if (test(a) && test(b)) { set.add(a); set.add(b); } return [...set]; };
  const lids = eyes.map(e => { const out = []; for (let v = 0; v < M.nv; v++) { if (v >= 13380) continue; const d = Math.hypot(P[v * 3] - e.c[0], P[v * 3 + 1] - e.c[1], P[v * 3 + 2] - e.c[2]) - e.r; if (d > -1.8 && d < 1.0 && P[v * 3 + 2] > e.c[2] + 5) out.push(v); } return out; });
  const noseTipV = argBest(M, v => Math.abs(P[v * 3]) < 0.6 && P[v * 3 + 1] > eyes[0].c[1] - 80 && P[v * 3 + 1] < eyes[0].c[1] - 10 ? P[v * 3 + 2] : -1e9);
  const lipT = M.targets['mouth/mouth-scale-horiz-incr'];
  const cornerL = argBest(M, v => P[v * 3] > 0 ? (dispOf(lipT, v)) : -1e9);
  const lipsRing = ringOf(v => Math.abs(P[v * 3]) < 40 && P[v * 3 + 1] < P[noseTipV * 3 + 1] - 8 && P[v * 3 + 1] > P[noseTipV * 3 + 1] - 50 && P[v * 3 + 2] > P[noseTipV * 3 + 2] - 45);
  const chinV = argBest(M, v => Math.abs(P[v * 3]) < 0.6 && P[v * 3 + 1] < P[noseTipV * 3 + 1] - 40 && P[v * 3 + 1] > P[noseTipV * 3 + 1] - 110 ? P[v * 3 + 2] - 0.15 * (P[v * 3 + 1]) : -1e9);
  const topV = argBest(M, v => P[v * 3 + 1]);
  const earT = M.targets['ears/ear-wing-incr'];
  const earMask = new Uint8Array(M.nv); if (earT) { let mx = 0; for (let j = 0; j < earT.idx.length; j++) mx = Math.max(mx, Math.hypot(earT.D[j * 3], earT.D[j * 3 + 1], earT.D[j * 3 + 2])); for (let j = 0; j < earT.idx.length; j++) { const v = earT.idx[j]; if (Math.hypot(earT.D[j * 3], earT.D[j * 3 + 1], earT.D[j * 3 + 2]) > 0.1 * mx && Math.abs(P[v * 3]) > 55) earMask[v] = 1; } }
  const nostT = M.targets['nose/nose-nostrils-width-incr'];
  const nostrilV = argBest(M, v => P[v * 3] > 0 ? dispOf(nostT, v) : -1e9);
  // the inside of the socket, behind the lid margins (the painter draws a true eyeball there)
  const socket = new Uint8Array(M.nv);
  eyes.forEach((e, k) => { const zm = lids[k].reduce((a, v) => a + P[v * 3 + 2], 0) / (lids[k].length || 1); for (let v = 0; v < 13380; v++) { const d = Math.hypot(P[v * 3] - e.c[0], P[v * 3 + 1] - e.c[1], P[v * 3 + 2] - e.c[2]) - e.r; if (d < 1.5 && P[v * 3 + 2] < zm - 0.8) socket[v] = 1; } });
  return { socket, eyes, lids, lipsRing, noseTipV, cornerL, chinV, topV, earMask, nostrilV };
}
function dispOf(t, v) { if (!t) return 0; let lo = 0, hi = t.idx.length - 1; while (lo <= hi) { const m = (lo + hi) >> 1; if (t.idx[m] === v) return Math.hypot(t.D[m * 3], t.D[m * 3 + 1], t.D[m * 3 + 2]) * t.s; if (t.idx[m] < v) lo = m + 1; else hi = m - 1; } return 0; }
function argBest(M, score) { const [b0, b1] = M.ranges.body; let best = -1e18, bi = 0; const seen = new Uint8Array(M.nv); for (let f = b0; f < b1; f++) for (let e = 0; e < 4; e++) { const v = M.quads[f * 4 + e]; if (seen[v]) continue; seen[v] = 1; const s = score(v); if (s > best) { best = s; bi = v; } } return bi; }

// MakeHuman's age weights: baby at 1 year, child at 11, young at 25, old at 90
export function ageWeights(years) {
  const y = Math.max(1, years);
  const v = y < 11 ? (y - 1) / 10 * 0.1875 : y < 25 ? 0.1875 + (y - 11) / 14 * 0.3125 : Math.min(1, 0.5 + (y - 25) / 65 * 0.5);
  if (v < 0.5) { const young = Math.max(0, (v - 0.1875) * 3.2), baby = Math.max(0, 1 - v * 5.333); return { baby, child: Math.max(0, Math.min(1, 5.333 * v) - young), young, old: 0 }; }
  const old = Math.max(0, v * 2 - 1); return { baby: 0, child: 0, young: 1 - old, old };
}
