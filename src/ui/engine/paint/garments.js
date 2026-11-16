// Dress (characters.md §9): layers in order, each the body's own surface pushed out by its thickness and cut at its
// neckline, openings and hem, so it fits every height, build and age without being redrawn. Materials differ by how
// they take light (materials.js); small parts (a buckle, a brooch, a neck ring, a helm, a hat) are solids. A kit is data:
// kit(look) returns the pieces for a station, culture mark, wealth and role; garmentLayers turns them into layers.
import { lin, mix3, DYES, METAL, MATERIALS } from './materials.js';
import { noise2, noise3, fbm2, cell2, hash32 } from './noise.js';
import { sstep, clamp, lerp, hv } from '../../../people/engine/anatomy.js';
import { diffuse, specular, rim, room, KEY } from './light.js';
import { ELL, CAP, BOX, TOR, place, mmul, rotY, rotX, rotZ, mvec, mT } from './surface.js';
import { sdfGroup } from './hair.js';

// ---------- the kits (§9 Station, Roles), the North's items ----------
// a piece: { slot, mat, col, t (mm), neck: 'round'|'v'|'square'|'high'|'open'|'none', hem (share of stature from the feet),
// sleeve: 'long'|'short'|'none', trim: { col, mat, w }, folds, wear (patches, fray), pattern, charge }
export const STATIONS = ['slave', 'serf', 'peasant', 'artisan', 'merchant', 'gentry', 'noble', 'royal'];
export const ROLES = ['levy', 'archer', 'infantry', 'knight', 'clergy'];
export function kit(look) {
  const K = kit0(look);
  // legs and feet for the figure: hose and shoes under every cut (bare feet for the unfree)
  if (!K.pieces.some(p => p.slot === 'habit')) {
    K.pieces.unshift({ slot: 'hose', mat: 'wool', col: look.station === 'slave' ? '#7d705a' : look.role ? '#3d3a35' : '#4a4238', t: 1.4, neck: 'none', legs: 1, folds: 1.2 });
    if (look.station !== 'slave') K.pieces.unshift({ slot: 'shoes', mat: 'leather', col: '#3b2a1d', t: 3, neck: 'none', feet: 1, folds: 0.3 });
  }
  return K;
}
function kit0(look) {
  const st = look.station || 'peasant', role = look.role, id = look.id ?? 'x', w = look.wealth ?? { slave: 0, serf: 0, peasant: 1, artisan: 2, merchant: 3, gentry: 3, noble: 4, royal: 4 }[st] ?? 1;
  const pick = (arr, ch) => arr[Math.floor((hv(id, ch) * 0.5 + 0.5) * arr.length * 0.999)];
  const P = [], acc = [];
  const shirt = (col = DYES.linen, neck = 'round') => P.push({ slot: 'shirt', mat: 'linen', col, t: 1.2, neck, nlDrop: 10, hem: 0.48, sleeve: 'long', folds: 1.6 });
  const child = (look.age ?? 30) < 7;
  if (child && !role) { P.push({ slot: 'gown', mat: 'wool', col: pick([DYES.undyed, DYES.russet, DYES.woad, DYES.oatmeal], 'cg'), t: 2.5, neck: 'round', nlDrop: 6, hem: 0.1, sleeve: 'long', folds: 3 }); return { pieces: P, acc, st, w }; }
  if (role === 'clergy') {
    P.push({ slot: 'habit', mat: 'wool', col: pick([DYES.black, DYES.brown, DYES.grey, DYES.white], 'hb'), t: 4, neck: 'high', hem: 0.02, sleeve: 'long', folds: 4 });
    acc.push({ k: 'cowl' }, { k: 'cord' });
    return { pieces: P, acc, st, w };
  }
  if (role === 'levy') {
    shirt(DYES.linen); P.push({ slot: 'tunic', mat: 'wool', col: pick([DYES.russet, DYES.brown, DYES.grey], 'lt'), t: 3, neck: 'round', nlDrop: 14, hem: 0.42, sleeve: 'long', folds: 3 });
    P.push({ slot: 'gambeson', mat: 'padded', col: '#b9a57e', t: 9, neck: 'high', hem: 0.4, sleeve: 'long', folds: 1.2, badge: look.badge || DYES.madder });
    acc.push({ k: 'kettle' }, { k: 'belt', col: '#4a3322' });
    return { pieces: P, acc, st, w };
  }
  if (role === 'archer') {
    shirt(DYES.linen); P.push({ slot: 'gambeson', mat: 'padded', col: '#a89870', t: 6, neck: 'round', nlDrop: 12, hem: 0.42, sleeve: 'short', folds: 1.5 });
    acc.push({ k: 'hoodRoll', col: DYES.green }, { k: 'quiver' }, { k: 'bracer' }, { k: 'belt', col: '#4a3322' });
    return { pieces: P, acc, st, w };
  }
  if (role === 'infantry' || role === 'cavalry') {
    P.push({ slot: 'gambeson', mat: 'padded', col: '#b4a27c', t: 7, neck: 'high', hem: 0.38, sleeve: 'long', folds: 1 });
    P.push({ slot: 'mail', mat: 'mail', col: METAL.iron, t: 4, neck: 'high', hem: 0.36, sleeve: 'long', folds: 0.6, rust: w < 2 ? 0.5 : 0.1 });
    if (role === 'cavalry') P.push({ slot: 'surcoat', mat: 'linen', col: look.arms?.[0] || DYES.azure, t: 2, neck: 'round', nlDrop: 16, hem: 0.3, sleeve: 'none', folds: 2, charge: look.arms || [DYES.azure, DYES.or, 'cross'] });
    acc.push({ k: 'coifDown' }, { k: 'shieldStrap' }, { k: 'belt', col: '#3a2a1c' });
    return { pieces: P, acc, st, w };
  }
  if (role === 'knight') {
    P.push({ slot: 'gambeson', mat: 'padded', col: '#a8946c', t: 7, neck: 'high', hem: 0.38, sleeve: 'long', folds: 1 });
    P.push({ slot: 'mail', mat: 'mail', col: METAL.steel, t: 4, neck: 'high', hem: 0.36, sleeve: 'long', folds: 0.5 });
    P.push({ slot: 'plate', mat: 'plate', col: METAL.steel, t: 9, neck: 'plate', hem: 0.56, sleeve: 'none', folds: 0 });
    P.push({ slot: 'surcoat', mat: 'linen', col: (look.arms || [DYES.crimson])[0], t: 2.2, neck: 'round', nlDrop: 26, hem: 0.28, sleeve: 'none', folds: 1.6, charge: look.arms || [DYES.crimson, DYES.or, 'chevron'], open: 'plateShow' });
    acc.push({ k: 'pauldrons' }, { k: 'gorget' }, { k: 'belt', col: '#2e2016', metal: 'gold' });
    return { pieces: P, acc, st, w };
  }
  // the stations of the North (§9)
  if (st === 'shirt') { P.push({ slot: 'shirt', mat: 'linen', col: look.shirt || '#cfc3a6', t: 1.6, neck: 'round', nlDrop: 18, hem: 0.45, sleeve: 'long', folds: 2.2 }); return { pieces: P, acc, st, w }; }
  if (st === 'slave') { P.push({ slot: 'shift', mat: 'linen', col: '#a89a7c', t: 1.6, neck: 'square', nlDrop: 34, hem: 0.36, sleeve: 'none', folds: 2.2, wear: 1, coarse: 1 }); acc.push({ k: 'neckring' }, { k: 'rope' }); }
  if (st === 'serf') { shirt('#b9ae92'); P.push({ slot: 'tunic', mat: 'wool', col: pick(['#b8ad94', '#8f877a', '#a49276'], 'sw'), t: 3.5, neck: 'round', nlDrop: 14, hem: 0.38, sleeve: 'long', folds: 3, wear: 1, patches: 1 }); acc.push({ k: 'coif', col: '#cfc6ad' }, { k: 'belt', col: '#5a4330', thong: 1 }); }
  if (st === 'peasant') { shirt(DYES.linen); P.push({ slot: 'tunic', mat: 'wool', col: pick([DYES.russet, DYES.brown, DYES.green, DYES.ochre, DYES.grey], 'pt'), t: 3.2, neck: 'round', nlDrop: 16, hem: 0.36, sleeve: 'long', folds: 3, wear: 0.4 }); acc.push({ k: 'hoodRoll', col: pick([DYES.russet, DYES.brown, DYES.green], 'ph') }, { k: 'belt', col: '#4d3524', knife: 1 }); }
  if (st === 'artisan') { shirt(DYES.linen); P.push({ slot: 'tunic', mat: 'wool', col: pick([DYES.woad, DYES.brown, DYES.grey, DYES.green], 'at'), t: 3, neck: 'round', nlDrop: 12, hem: 0.38, sleeve: 'long', folds: 2.5 }); P.push({ slot: 'apron', mat: 'leather', col: '#6b4a30', t: 3, neck: 'bib', hem: 0.3, sleeve: 'none', folds: 0.8, front: 1, scorch: 1 }); acc.push({ k: 'flatcap', col: DYES.brown }, { k: 'badge', metal: 'pewter' }); }
  if (st === 'merchant') { shirt(DYES.white); P.push({ slot: 'gown', mat: 'wool', col: pick([DYES.murrey, DYES.woad, DYES.green, DYES.black], 'mg'), t: 4.5, neck: 'v', nlDrop: 40, hem: 0.08, sleeve: 'long', folds: 3.5, trim: { mat: 'fur', col: '#5a3d26', w: 22 } }); acc.push({ k: 'chaperon', col: pick([DYES.black, DYES.madder, DYES.murrey], 'mc') }, { k: 'purse' }); }
  if (st === 'gentry') { shirt(DYES.white); P.push({ slot: 'doublet', mat: 'wool', col: pick([DYES.scarlet, DYES.azure, DYES.vert, DYES.saffron], 'gd'), t: 3.5, neck: 'high', hem: 0.42, sleeve: 'long', folds: 1.3, buttons: 1, fitted: 1 }); acc.push({ k: 'cap', col: DYES.black, feather: 1 }, { k: 'swordbelt' }); }
  if (st === 'noble') { shirt(DYES.white); P.push({ slot: 'cotte', mat: 'silk', col: look.house || pick([DYES.crimson, DYES.azure, DYES.vert, DYES.purple], 'nc'), t: 3, neck: 'round', nlDrop: 10, hem: 0.1, sleeve: 'long', folds: 2, pattern: 'damask', trim: { mat: 'silk', col: DYES.or, w: 9, emb: 1 } }); P.push({ slot: 'mantle', mat: 'velvet', col: look.house2 || DYES.sable, t: 7, neck: 'mantle', hem: 0.25, sleeve: 'none', folds: 4, trim: { mat: 'fur', col: '#6b5038', w: 34 } }); acc.push({ k: 'chain', metal: 'gold' }, look.court ? { k: 'coronet' } : { k: 'none' }); }
  if (st === 'royal') { shirt(DYES.white); P.push({ slot: 'cotte', mat: 'silk', col: '#b08a3a', t: 3, neck: 'round', nlDrop: 10, hem: 0.08, sleeve: 'long', folds: 2, pattern: 'cloth-of-gold', trim: { mat: 'silk', col: DYES.crimson, w: 10, emb: 1 } }); P.push({ slot: 'mantle', mat: 'velvet', col: DYES.crimson, t: 8, neck: 'mantle', hem: 0.05, sleeve: 'none', folds: 4, trim: { mat: 'fur', col: '#e9e4d8', w: 60, ermine: 1 } }); acc.push({ k: 'crown' }, { k: 'chain', metal: 'gold' }); }
  return { pieces: P, acc, st, w };
}

// ---------- the body's own landmarks (model frame) ----------
function bodyMarks(Mk, V) {
  const S = Mk.stature, f = Mk.feet;
  // the neck's own centre and girth, measured a little above its base
  const yN = Mk.chinY - 0.2 * Mk.headH; let x1 = 0, z0 = 1e9, z1 = -1e9;
  for (let i = 0; i < 13380; i++) { const y = V[i * 3 + 1]; if (Math.abs(y - yN) > 6 || Math.abs(V[i * 3]) > 90 * Mk.cr) continue; x1 = Math.max(x1, Math.abs(V[i * 3])); z0 = Math.min(z0, V[i * 3 + 2]); z1 = Math.max(z1, V[i * 3 + 2]); }
  return { nz: (z0 + z1) / 2, nR: Math.max(x1, (z1 - z0) / 2), yN, S, feet: f, neckBase: Mk.chinY - 0.27 * Mk.headH, shoulder: f + 0.815 * S, chest: f + 0.73 * S, waist: f + 0.61 * S, hip: f + 0.52 * S, knee: f + 0.28 * S, wrist: f + 0.48 * S, elbow: f + 0.63 * S, ankle: f + 0.045 * S, shX: 0.115 * S };
}

// ---------- layers ----------
export function garmentLayers(ctx) {
  const look = ctx.look, m = ctx.m, Mk = m.marks, hs = Mk.cr, V = m.V, nv = V.length / 3, Q = m.mesh.quads;
  if (look.nude) { ctx.kit = { pieces: [], acc: [] }; ctx.bm = bodyMarks(Mk, V); return []; }
  const K = ctx.kit = kit(look), B = ctx.bm = bodyMarks(Mk, V);
  const N = ctx.skinLayerN, P = ctx.P, [b0, b1] = m.mesh.ranges.body;
  const out = [];
  let under = 0;   // the summed thickness of what lies beneath
  K.pieces.forEach((pc, idx) => {
    const cut = cutOf(pc, B, Mk, hs, look);
    const t = pc.t + under + 0.6 * idx;
    const off = new Float32Array(nv), keep = new Uint8Array(nv);
    const fold = (pc.folds || 0) * (pc.mat === 'plate' ? 0 : 1);
    for (let i = 0; i < nv; i++) {
      const x = V[i * 3], y = V[i * 3 + 1], z = V[i * 3 + 2];
      if (y > Mk.chinY + 10 * hs) continue;
      const c = cut(x, y, z); if (c < -30) continue;
      keep[i] = 1;
      // folds hang from the shoulders and the belt; a fitted cut lies close
      const hang = sstep(B.shoulder, B.waist, y);
      let d = t;
      if (fold) d += fold * (0.6 + 0.8 * hang) * (noise3(x * 0.035, y * 0.008, z * 0.035, 300 + idx) + 0.45 * noise3(x * 0.09, y * 0.02, z * 0.09, 310 + idx));
      if (pc.slot === 'mantle' || pc.slot === 'gown' || pc.slot === 'habit') d += 6 * sstep(B.chest, B.hip, y) * (Math.abs(x) > B.shX * 0.9 ? 1 : 0.4);
      if (pc.mat === 'plate') d += 2 * Math.max(0, z) / 100;
      off[i] = Math.max(0.6, d);
    }
    const faces = new Uint8Array(m.mesh.nq);
    for (let f = b0; f < b1; f++) { let ok = 1; for (let e = 0; e < 4; e++) if (!keep[Q[f * 4 + e]]) ok = 0; if (ok && !m.removed[f]) faces[f] = 1; }
    const GP = new Float32Array(nv * 3);
    for (let i = 0; i < nv; i++) for (let c = 0; c < 3; c++) GP[i * 3 + c] = P[i * 3 + c] + N[i * 3 + c] * off[i];
    out.push({ name: pc.slot, mat: pc.mat, piece: pc, P: GP, M: V, quads: Q, faces, cut, N: null, idx });
    under += pc.t * 0.8;
  });
  ctx.dressT = under;
  return out;
}

// where a piece covers (>= 0 inside), on the body's own point
function cutOf(pc, B, Mk, hs, look) {
  const S = B.S, nb = B.neckBase, ax = x => Math.abs(x);
  const hemY = B.feet + pc.hem * S;
  const front = z => sstep(-20, 30, z);
  if (pc.legs) return (x, y, z) => Math.min(B.hip + 30 * hs - y, y - B.ankle + 10 * hs);
  if (pc.feet) return (x, y, z) => B.ankle + 25 * hs - y;
  return (x, y, z) => {
    let c = y - hemY;                                  // above the hem
    // the neckline
    let nl;
    if (pc.neck === 'high') nl = nb + 22 * hs + 6 * hs * front(z);
    else if (pc.neck === 'round') nl = nb - (pc.nlDrop || 10) * hs * front(z) * (1 - Math.pow(ax(x) / (70 * hs), 2) * 0.6) + 4 * hs;
    else if (pc.neck === 'v') nl = nb - (pc.nlDrop || 30) * hs * front(z) * Math.max(0, 1 - ax(x) / (60 * hs)) + 6 * hs;
    else if (pc.neck === 'square') nl = ax(x) < 70 * hs && z > 0 ? nb - (pc.nlDrop || 30) * hs : nb + 2 * hs;
    else if (pc.neck === 'mantle') nl = nb + 10 * hs - (z > 10 ? 90 * hs * sstep(30 * hs, 0, ax(x)) * 0 + 150 * hs * sstep(70 * hs, 20 * hs, ax(x)) : 0);
    else if (pc.neck === 'bib') nl = z > 10 && ax(x) < 90 * hs ? B.chest + 10 * hs : -1e9;
    else if (pc.neck === 'plate') nl = nb - 14 * hs;
    else nl = nb;
    c = Math.min(c, nl - y);
    if (pc.neck === 'bib') { c = Math.min(c, 95 * hs - ax(x), z - 8 * hs); if (y > B.waist + 30 * hs) c = Math.min(c, 70 * hs - ax(x)); }
    if (pc.front) c = Math.min(c, z + 10);
    // sleeves: long to the wrist, short to the elbow, none at the shoulder
    if (ax(x) > B.shX * 0.98) {
      if (pc.sleeve === 'none') c = Math.min(c, B.shX * 1.06 - ax(x) + (y - B.shoulder) * 0.5);
      else if (pc.sleeve === 'short') c = Math.min(c, y - B.elbow - 30 * hs);
      else c = Math.min(c, y - B.wrist - 8 * hs);
    }
    if (pc.slot === 'plate') c = Math.min(c, y - B.waist + 30 * hs, B.shX * 1.02 - ax(x));
    if (pc.open === 'plateShow') c = Math.min(c, Math.max(y - B.chest + 10 * hs, 0) + 200);
    return c;
  };
}

// ---------- small parts: hats, helms, a neck ring, buckles, a brooch, a crown ----------
export function accessorySDF(ctx) {
  const look = ctx.look, Mk = ctx.m.marks, hs = Mk.cr;
  if (!ctx.kit) return [];
  const B = ctx.bm, top = Mk.top, out = [], body = [], head = [], bt = ctx.dressT || 4;
  const met = n => lin(METAL[n] || METAL.iron);
  const headG = (prims, mat, extra) => out.push(sdfGroup(ctx, prims, 'acc', mat, extra));
  const bodyG = (prims, mat, extra) => out.push(bodyGroup(ctx, prims, mat, extra));
  const nb = B.neckBase, nr = 52 * hs;
  for (const a of ctx.kit.acc) {
    switch (a.k) {
      case 'neckring': bodyG([{ t: TOR, c: [0, B.yN - 14 * hs, B.nz - 4], R: B.nR + 7, r2: 4.5 * hs, rot: rotX(0.3), k: 0 }, { t: BOX, c: [0, B.yN - 22 * hs, B.nz + B.nR + 9], half: [5, 6, 3], round: 1.5, k: 1 }], 'metal', { col: met('iron'), rough: 0.5 }); break;
      case 'rope': bodyG([{ t: TOR, c: [0, B.waist, -20 * hs], R: 150 * hs + bt, r2: 4.5, rot: rotX(0.04), k: 0 }], 'rope', { col: lin('#9c8a63') }); break;
      case 'belt': {
        const R0 = 145 * hs * (1 + 0.25 * Math.max(0, Mk.fat)) + bt + 3;
        bodyG([{ t: TOR, c: [0, B.waist - 10 * hs, -18 * hs], R: R0, r2: 5, rot: mmul(rotX(0.05), [1, 0, 0, 0, 3.2, 0, 0, 0, 1].map((v, i) => i === 4 ? 1 : v)), k: 0 }], 'leather', { col: lin(a.col || '#4a3322') });
        if (!a.thong) bodyG([{ t: TOR, c: [0, B.waist - 10 * hs, R0 - 30 * hs], R: 13, r2: 2.2, rot: rotX(Math.PI / 2), k: 0 }, { t: CAP, a: [0, B.waist - 10 * hs, R0 - 18 * hs], b: [9, B.waist - 10 * hs, R0 - 18 * hs], r1: 1.3, r2: 1.3, k: 0 }], 'metal', { col: met(a.metal || 'brass'), rough: 0.3 });
        break;
      }
      case 'coif': headG([{ t: ELL, c: [0, top - 52 * hs, -62 * hs], r: [82 * hs, 72 * hs, 98 * hs], k: 0 }, { t: ELL, c: [0, 0, 70 * hs], r: [70 * hs, 140 * hs, 60 * hs], op: 1, k: 6 }, { t: ELL, c: [0, -80 * hs, -40 * hs], r: [120 * hs, 70 * hs, 120 * hs], op: 1, k: 6 }], 'linen', { col: lin(a.col || '#d6ccb2') }); break;
      case 'flatcap': headG([{ t: ELL, c: [0, top - 12 * hs, -55 * hs], r: [86 * hs, 22 * hs, 104 * hs], k: 0 }, { t: ELL, c: [0, top - 38 * hs, -55 * hs], r: [76 * hs, 26 * hs, 92 * hs], k: 6 }], 'wool', { col: lin(a.col || DYES.brown) }); break;
      case 'chaperon': headG([{ t: TOR, c: [0, top - 22 * hs, -56 * hs], R: 74 * hs, r2: 22 * hs, rot: rotX(-0.15), k: 0 }, { t: ELL, c: [0, top - 6 * hs, -60 * hs], r: [70 * hs, 34 * hs, 80 * hs], k: 10 }, { t: CAP, a: [-60 * hs, top - 24 * hs, -80 * hs], b: [-95 * hs, top - 120 * hs, -60 * hs], r1: 24 * hs, r2: 18 * hs, k: 8 }], 'wool', { col: lin(a.col) }); break;
      case 'cap': headG([{ t: ELL, c: [-6 * hs, top - 16 * hs, -50 * hs], r: [84 * hs, 26 * hs, 96 * hs], rot: rotZ(0.12), k: 0 }], 'velvet', { col: lin(a.col || DYES.black) }); if (a.feather) headG([{ t: CAP, a: [52 * hs, top - 10 * hs, -40 * hs], b: [95 * hs, top + 70 * hs, -90 * hs], r1: 6 * hs, r2: 1.5 * hs, k: 3 }], 'feather', { col: lin('#e9e2cf') }); break;
      case 'hood': headG([{ t: ELL, c: [0, top - 52 * hs, -66 * hs], r: [90 * hs, 82 * hs, 106 * hs], k: 0 }, { t: ELL, c: [0, -5 * hs, 60 * hs], r: [64 * hs, 120 * hs, 70 * hs], op: 1, k: 8 }, { t: ELL, c: [0, nb - 30 * hs, -30 * hs], r: [180 * hs, 70 * hs, 140 * hs], k: 20 }, { t: ELL, c: [0, nb - 10 * hs, 30 * hs], r: [70 * hs, 50 * hs, 60 * hs], op: 1, k: 10 }], 'wool', { col: lin(a.col || DYES.green) }); break;
      case 'cowl': bodyG([{ t: TOR, c: [0, B.yN - 26 * hs, B.nz - 8], R: B.nR + 22 * hs + bt, r2: 16 * hs, rot: rotX(0.45), k: 0 }, { t: ELL, c: [0, nb - 10 * hs, -90 * hs], r: [90 * hs, 60 * hs, 40 * hs], k: 16 }], 'wool', { col: lin(ctx.kit.pieces[0].col) }); break;
      case 'hoodRoll': { const g = bodyGroup(ctx, [{ t: TOR, c: [0, B.yN - 28 * hs, B.nz - 6], R: B.nR + 20 * hs + bt, r2: 13 * hs, rot: rotX(0.42), k: 0 }, { t: ELL, c: [0, B.yN - 52 * hs, B.nz - 40 * hs], r: [110 * hs, 30 * hs, 70 * hs], k: 14 }], 'wool', { col: lin(a.col) }); g.dispModel = (x, y, z) => -2.2 * (1 - Math.abs(noise3(x * 0.08, y * 0.05, z * 0.08, 121))); g.dispAmp = 2.5; out.push(g); break; } break;
      case 'kettle': headG([{ t: ELL, c: [0, top - 22 * hs, -52 * hs], r: [84 * hs, 54 * hs, 100 * hs], k: 0 }, { t: ELL, c: [0, top - 70 * hs, -52 * hs], r: [100 * hs, 70 * hs, 120 * hs], op: 1, k: 0 }, { t: ELL, c: [0, top - 52 * hs, -52 * hs], r: [132 * hs, 7 * hs, 150 * hs], k: 3 }], 'plate', { col: met('iron'), rough: 0.35 }); break;
      case 'coifDown': bodyG([{ t: TOR, c: [0, B.yN - 24 * hs, B.nz - 4], R: B.nR + 14 * hs + bt, r2: 14 * hs, rot: rotX(0.4), k: 0 }], 'mail', { col: met('iron') }); break;
      case 'gorget': bodyG([{ t: CAP, a: [0, B.yN - 6 * hs, B.nz], b: [0, B.yN - 40 * hs, B.nz - 4], r1: B.nR + 4 + bt * 0.3, r2: B.nR + 22 * hs + bt, k: 0 }, { t: CAP, a: [0, B.yN + 4 * hs, B.nz], b: [0, B.yN - 48 * hs, B.nz - 4], r1: B.nR + 1, r2: B.nR + 16 * hs + bt, op: 1, k: 0 }, { t: ELL, c: [0, B.yN + 20, B.nz], r: [200, 26 * hs, 200], op: 1, k: 0 }], 'plate', { col: met('steel') }); break;
      case 'pauldrons': for (const s of [1, -1]) bodyG([{ t: ELL, c: [s * (B.shX - 6 * hs), B.shoulder - 6 * hs, -30 * hs], r: [62 * hs, 46 * hs, 66 * hs], rot: rotZ(s * -0.5), k: 0 }, { t: ELL, c: [s * (B.shX - 6 * hs), B.shoulder - 36 * hs, -30 * hs], r: [74 * hs, 40 * hs, 80 * hs], op: 1, k: 2 }, { t: ELL, c: [s * (B.shX + 0 * hs), B.shoulder - 40 * hs, -30 * hs], r: [62 * hs, 30 * hs, 66 * hs], rot: rotZ(s * -0.6), k: 3 }], 'plate', { col: met('steel') }); break;
      case 'shieldStrap': bodyG([{ t: CAP, a: [-110 * hs, B.shoulder + 4 * hs, 30 * hs + bt], b: [95 * hs, B.waist + 10 * hs, 80 * hs + bt], r1: 4, r2: 4, k: 0 }, { t: CAP, a: [-110 * hs, B.shoulder + 4 * hs, -70 * hs], b: [-115 * hs, B.shoulder + 4 * hs, 30 * hs + bt], r1: 4, r2: 4, k: 2 }], 'leather', { col: lin('#3a2818') }); break;
      case 'quiver': bodyG([{ t: CAP, a: [75 * hs, B.shoulder + 60 * hs, -120 * hs], b: [-60 * hs, B.waist, -130 * hs], r1: 34 * hs, r2: 30 * hs, k: 0 }], 'leather', { col: lin('#5b3c25') }); bodyG([{ t: CAP, a: [-110 * hs, B.shoulder - 4 * hs, 50 * hs + bt], b: [95 * hs, B.waist + 30 * hs, 75 * hs + bt], r1: 3.5, r2: 3.5, k: 0 }], 'leather', { col: lin('#4a3020') }); for (let i = 0; i < 6; i++) bodyG([{ t: CAP, a: [(70 + i * 6) * hs, B.shoulder + 60 * hs, (-112 + i * 4) * hs], b: [(84 + i * 7) * hs, B.shoulder + 125 * hs, (-110 + i * 5) * hs], r1: 5 * hs, r2: 2 * hs, k: 0 }], 'feather', { col: lin(i % 2 ? '#e7dfcc' : '#8e2c22') }); break;
      case 'bracer': break;
      case 'chain': { const R = 120 * hs + bt; const prims = []; for (let i = 0; i < 26; i++) { const a = -1.2 + i * 2.4 / 25; prims.push({ t: TOR, c: [Math.sin(a) * R * 0.75, nb - 30 * hs - Math.cos(a) * 70 * hs * 0 - (1 - Math.cos(a)) * 0 - 60 * hs * Math.cos(a * 1.1) * 0.6, 40 * hs + Math.cos(a) * 60 * hs + bt], R: 7 * hs, r2: 2.4 * hs, rot: i % 2 ? rotY(Math.PI / 2) : rotX(Math.PI / 2), k: 0 }); } prims.push({ t: ELL, c: [0, nb - 110 * hs, 100 * hs + bt], r: [16 * hs, 18 * hs, 6], k: 0 }); bodyG(prims, 'metal', { col: met(a.metal || 'gold'), rough: 0.25 }); break; }
      case 'badge': bodyG([{ t: ELL, c: [-62 * hs, B.chest + 30 * hs, 110 * hs + bt], r: [11, 11, 3], k: 0 }], 'metal', { col: met('pewter'), rough: 0.4 }); break;
      case 'purse': bodyG([{ t: ELL, c: [60 * hs, B.waist - 70 * hs, 115 * hs + bt], r: [30 * hs, 38 * hs, 14 * hs], k: 0 }], 'leather', { col: lin('#5c3a22') }); break;
      case 'swordbelt': bodyG([{ t: CAP, a: [-120 * hs, B.waist - 20 * hs, 50 * hs + bt], b: [110 * hs, B.hip, 80 * hs + bt], r1: 4, r2: 4, k: 0 }], 'leather', { col: lin('#2e1f14') }); break;
      case 'coronet': { const pr = [{ t: TOR, c: [0, top - 30 * hs, -55 * hs], R: 80 * hs, r2: 4 * hs, rot: rotX(-0.12), k: 0 }]; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; pr.push({ t: ELL, c: [Math.sin(a) * 80 * hs, top - 22 * hs, -55 * hs + Math.cos(a) * 80 * hs], r: [5 * hs, 9 * hs, 5 * hs], k: 1 }); } headG(pr, 'metal', { col: met('gold'), rough: 0.22 }); break; }
      case 'crown': { const pr = [{ t: TOR, c: [0, top - 30 * hs, -55 * hs], R: 84 * hs, r2: 7 * hs, rot: [1, 0, 0, 0, 3, 0, 0, 0, 1].map((v, i) => i === 4 ? 1 : v), k: 0 }, { t: CAP, a: [0, top - 36 * hs, -55 * hs], b: [0, top - 22 * hs, -55 * hs], r1: 86 * hs, r2: 86 * hs, k: 2 }, { t: CAP, a: [0, top - 40 * hs, -55 * hs], b: [0, top - 10 * hs, -55 * hs], r1: 80 * hs, r2: 80 * hs, op: 1, k: 1 }]; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; pr.push({ t: CAP, a: [Math.sin(a) * 84 * hs, top - 20 * hs, -55 * hs + Math.cos(a) * 84 * hs], b: [Math.sin(a) * 86 * hs, top + 18 * hs, -55 * hs + Math.cos(a) * 86 * hs], r1: 7 * hs, r2: 3 * hs, k: 2 }); pr.push({ t: ELL, c: [Math.sin(a) * 86 * hs, top + 20 * hs, -55 * hs + Math.cos(a) * 86 * hs], r: [6 * hs, 6 * hs, 6 * hs], k: 1 }); } headG(pr, 'metal', { col: met('gold'), rough: 0.18, gems: 1 }); break; }
    }
  }
  // a long cut hangs as a skirt from the hips, not round each leg
  for (const pc of ctx.kit.pieces) if (pc.hem != null && pc.hem < 0.33 && !pc.legs && !pc.feet && pc.slot !== 'apron') {
    const S = B.S, hemY = B.feet + pc.hem * S, r1 = 0.098 * S * (1 + 0.2 * Math.max(0, Mk.fat)), r2 = (0.13 + 0.07 * (0.33 - pc.hem)) * S;
    const g = bodyGroup(ctx, [{ t: CAP, a: [0, B.hip + 0.03 * S, -0.012 * S], b: [0, hemY + 0.02 * S, -0.02 * S], r1: r1 + bt * 0.5, r2, k: 0 }, { t: ELL, c: [0, hemY - 0.2 * S, 0], r: [0.4 * S, 0.2 * S, 0.4 * S], op: 1, k: 0 }], pc.mat, { piece: pc, col: lin(pc.col) });
    g.dispModel = (x, y, z) => -(pc.folds || 2) * 1.3 * (1 - Math.abs(noise2(Math.atan2(x, z) * 9, y * 0.004, 131))) * sstep(B.hip, hemY, y);
    g.dispAmp = (pc.folds || 2) * 1.4;
    out.push(g);
  }
  // an eye lost under a patch on a cord (§7)
  for (const e of ctx.m.eyes) if (e.shut === 'patch') {
    headG([{ t: ELL, c: [e.c[0], e.c[1] + 1, e.c[2] + e.r + 1], r: [17 * hs, 13 * hs, 6 * hs], k: 0 }], 'leather', { col: lin('#1f1814') });
    headG([{ t: CAP, a: [e.c[0] - e.side * 14 * hs, e.c[1] + 9 * hs, e.c[2] + e.r], b: [-e.side * 66 * hs, 52 * hs, -60 * hs], r1: 1.6, r2: 1.6, k: 0 }, { t: CAP, a: [e.c[0] + e.side * 15 * hs, e.c[1] - 4 * hs, e.c[2] + e.r - 3], b: [e.side * 76 * hs, 4 * hs, -50 * hs], r1: 1.6, r2: 1.6, k: 0 }], 'leather', { col: lin('#2a1f18') });
  }
  return out;
}
// a group of solids carried by the body
export function bodyGroup(ctx, prims, mat, extra = {}) {
  const Rb = ctx.bodyR, C0 = [0, ctx.shoulderY, -40 * ctx.m.marks.cr], Mi = mT(Rb);
  return { mat, kind: 'acc', ...extra, prims: prims.map(p => place(p, Rb, C0)),
    toModel: (x, y, z, o) => { const a = x - C0[0], b = y - C0[1], c = z - C0[2]; o[0] = Mi[0] * a + Mi[1] * b + Mi[2] * c + C0[0]; o[1] = Mi[3] * a + Mi[4] * b + Mi[5] * c + C0[1]; o[2] = Mi[6] * a + Mi[7] * b + Mi[8] * c + C0[2]; return o; } };
}

// ---------- shading cloth, leather, fur, mail, plate, metal ----------
const NN = [0, 0, 0], A3 = [0, 0, 0];
export function shadeCloth(PS, G, L, n, ao, sh, c, Wp) {
  const pc = G.piece || {}, matName = G.mat, mat = MATERIALS[matName] || MATERIALS.wool, x = L[0], y = L[1], z = L[2];
  const Mk = PS.m.marks, hs = Mk.cr, fine = PS.mmpp < 0.5 ? 1 : PS.mmpp < 1.0 ? 0.5 : 0.15;
  let col = G.col || lin(pc.col || '#777777');
  let nx = n[0], ny = n[1], nz = n[2];
  // the body's cylinder coordinates for weaves and rings: u round the body, v down it
  const u = Math.atan2(x, z + 40) * 120, v = y;
  let spec = mat.spec || 0.03, rough = mat.rough || 0.8, metal = !!mat.metal;
  let trimK = 0;
  if (pc.trim && G.cut) { const d = G.cut(x, y, z); trimK = d < pc.trim.w * hs ? 1 : 0; }
  const useMat = trimK ? (MATERIALS[pc.trim.mat] || mat) : mat;
  if (trimK) col = lin(pc.trim.col);
  const mn = trimK ? pc.trim.mat : matName;
  if (mn === 'linen' || mn === 'wool' || mn === 'padded' || mn === 'silk' || mn === 'velvet' || mn === 'feather' || mn === 'rope') {
    // the weave: fine threads across and along, a nap on wool
    const w1 = Math.sin(u * 2.4) * Math.sin(v * 2.4), w2 = noise2(u * 0.9, v * 0.9, 81);
    const wk = (mn === 'linen' ? 0.06 : mn === 'wool' ? 0.04 : 0.02) * fine;
    nx += w1 * wk; ny += w2 * wk;
    let shade = 1 + (w2 * 0.06 + noise2(u * 0.06, v * 0.06, 83) * 0.08);
    // drape: soft folds that fall from the shoulders, creases where cloth gathers
    const fk = (pc.folds || 1) * 0.12, fd = noise2(u * 0.035, v * 0.009, 84 + (G.idx || 0)), fc = noise2(u * 0.11, v * 0.03, 86);
    nx += fd * fk * 1.6 + fc * fk * 0.5; shade *= 1 - 0.1 * Math.max(0, -fd) * (pc.folds || 1) * 0.5;
    if (pc.coarse) shade += noise2(u * 0.5, v * 2, 85) * 0.08;
    if (mn === 'padded') { const ch = Math.abs(Math.sin(v * Math.PI / (22 * hs))); nx += 0; ny += (ch < 0.3 ? 0.35 : 0) * Math.sign(Math.cos(v * Math.PI / (22 * hs))); shade *= 0.88 + 0.18 * ch; }
    // patches with their stitches; frayed, faded hems on a hard life
    if (pc.patches) { const cl = cell2(u / 70, v / 70, 87); if ((cl.id & 3) === 0 && cl.d < 0.38) { col = mix3(col, lin('#8b7e66'), 0.45); if (Math.abs(cl.d - 0.36) < 0.02) shade *= 0.6; } }
    if (pc.wear) shade *= 1 - 0.12 * pc.wear * (0.5 + 0.5 * noise2(u * 0.05, v * 0.05, 89));
    if (pc.pattern === 'damask') { const pm = Math.sin(u * 0.16) * Math.sin(v * 0.16) + 0.5 * Math.sin((u + v) * 0.11); if (pm > 0.6) { col = mix3(col, col.map(q => q * 1.5 + 0.02), 0.5); spec += 0.15; } }
    if (pc.pattern === 'cloth-of-gold') { const pm = Math.sin(u * 0.2) * Math.sin(v * 0.2); col = mix3(col, lin('#d8b25a'), pm > 0.3 ? 0.6 : 0.15); spec += 0.3; metal = pm > 0.3; }
    if (trimK && pc.trim.emb) { const zz = Math.abs(((u * 0.25) % 2 + 2) % 2 - 1); if (zz < 0.25 || Math.abs(Math.sin(v * 0.6)) > 0.92) { col = mix3(col, lin(DYES.or), 0.7); spec += 0.25; } }
    col = col.map(q => q * shade);
    // the badge of a levy's lord
    if (pc.badge && z > 30 && Math.abs(x + 60 * hs) < 18 * hs && Math.abs(y - (PS.ctx.bm.chest + 25 * hs)) < 18 * hs) col = lin(pc.badge);
    // a surcoat's arms, painted as cloth
    if (pc.charge && z > -20) col = heraldry(pc.charge, x / hs, (y - PS.ctx.bm.chest + 30 * hs) / hs * 0.8, col);
    if (pc.buttons && z > 40 && Math.abs(x) < 3 * hs) { const b = ((y / (16 * hs)) % 1 + 1) % 1; if (b < 0.35) { col = lin('#2c2420'); spec = 0.2; } }
  }
  if (mn === 'leather') {
    const gr = noise2(u * 0.7, v * 0.7, 91) * 0.06 + noise2(u * 0.12, v * 0.12, 92) * 0.1;
    nx += gr * 0.4 * fine; col = col.map(q => q * (0.9 + gr));
    if (pc.scorch) { const sc = fbm2(u * 0.02, v * 0.02, 3, 93); if (sc > 0.2) col = col.map(q => q * 0.55); }
    spec = 0.12; rough = 0.45;
  }
  if (mn === 'fur') {
    const fn = noise2(u * 1.2, v * 0.35, 95), fl = noise2(u * 0.2, v * 0.2, 96);
    col = col.map(q => q * (0.65 + 0.35 * fn + 0.2 * fl));
    if (pc.trim && pc.trim.ermine) { const cl = cell2(u / 30, v / 34, 97); const dx = cl.d; if (dx < 0.2 && ((cl.id >>> 3) & 1)) col = lin('#141012'); }
    nx += fn * 0.25; ny += fl * 0.2; spec = 0.03;
  }
  let lx = nx, ly = ny, lz = nz; const nl = Math.hypot(lx, ly, lz) || 1; NN[0] = lx / nl; NN[1] = ly / nl; NN[2] = lz / nl;
  if (mn === 'mail') {
    // rings in rows, each row over the next, each ring its glint; rust on poor kit
    const rs = 3.2 * hs, ru = u / rs, rv = v / rs, row = Math.floor(rv), off = (row & 1) * 0.5, cu = ru + off - Math.floor(ru + off) - 0.5, cv = rv - row - 0.5;
    const d = Math.hypot(cu, cv * 1.25), ring = Math.exp(-Math.pow((d - 0.32) / 0.12, 2));
    const k = fine;
    NN[0] += cu * ring * 1.6 * k; NN[1] += cv * ring * 1.6 * k; const l2 = Math.hypot(NN[0], NN[1], NN[2]); NN[0] /= l2; NN[1] /= l2; NN[2] /= l2;
    const gap = (1 - ring) * k;
    const base = G.col || lin(METAL.iron), rust = pc.rust || 0;
    const r0 = mix3(base, lin('#6a3a1e'), rust * (0.5 + 0.5 * noise2(u * 0.1, v * 0.1, 99)) * 0.6);
    const env = room(-NN[0] * 0.3 + 2 * NN[0] * NN[2], 2 * NN[1] * NN[2], 2 * NN[2] * NN[2] - 1);
    const dk = 1 - 0.75 * gap;
    for (let q = 0; q < 3; q++) c[q] = (r0[q] * 0.18 * (ao * 0.7 + 0.3) + env[q] * r0[q] * 0.9 * (0.4 + 0.6 * sh)) * dk;
    const sp = specular(NN, sh, 120, 2.2) * (0.5 + ring);
    c[0] += sp * r0[0] * 1.2; c[1] += sp * r0[1] * 1.2; c[2] += sp * r0[2] * 1.2;
    return;
  }
  if (metal || mn === 'plate' || G.mat === 'metal' || G.mat === 'plate') {
    // plate mirrors the room: the window, the dark beams, the warm floor; dents and scratches of battles fought
    const base = G.col || col;
    const sc = noise2(u * 0.5, v * 3, 101) > 0.85 ? 0.15 : 0, dent = noise3(x * 0.03, y * 0.03, z * 0.03, 103) * 0.08;
    NN[0] += dent; const l2 = Math.hypot(NN[0], NN[1], NN[2]); NN[0] /= l2; NN[1] /= l2; NN[2] /= l2;
    const rx = 2 * NN[0] * NN[2], ry = 2 * NN[1] * NN[2], rz = 2 * NN[2] * NN[2] - 1;
    const env = room(rx, ry, rz), rgh = G.rough ?? 0.2;
    const env2 = room(rx * 0.6, ry * 0.6 + 0.1, rz);
    for (let q = 0; q < 3; q++) c[q] = base[q] * ((env[q] * (1 - rgh) + env2[q] * rgh) * 1.25 * (0.35 + 0.65 * sh) + 0.05 * ao) + sc * 0.1;
    const sp = specular(NN, sh, 200, 4) + specular(NN, sh, 30, 0.4);
    c[0] += sp * base[0] * 1.3; c[1] += sp * base[1] * 1.3; c[2] += sp * base[2] * 1.3;
    if (G.gems && Math.abs(Math.sin(x * 0.3)) > 0.97) { c[0] = 0.35; c[1] = 0.02; c[2] = 0.05; }
    return;
  }
  diffuse(col, NN, ao, sh, [useMat.wrap || 0.3, useMat.wrap || 0.3, useMat.wrap || 0.3], c);
  const sheen = (useMat.sheen || 0) * Math.pow(1 - Math.max(0, NN[2]), 2) * (0.5 + 0.5 * sh);
  const sp = specular(NN, sh, rough < 0.5 ? 60 : 14, spec);
  for (let q = 0; q < 3; q++) c[q] += sp + sheen * col[q] * 2.2;
  const rm = rim(NN, 0.12); for (let q = 0; q < 3; q++) c[q] += rm * col[q] * 2;
}

// a house's arms painted on cloth: field, ordinary, tincture (PORTRAIT.coat's shapes stand in at C8c)
function heraldry(arms, x, y, col) {
  const [field, tinc, ord] = arms, F = lin(field), T = lin(tinc);
  let on = false; const ax = Math.abs(x);
  if (ord === 'cross') on = ax < 16 || Math.abs(y - 10) < 16;
  else if (ord === 'chevron') { const yy = y + 50 - ax * 0.9; on = yy > 0 && yy < 28; }
  else if (ord === 'bend') on = Math.abs(x + y) < 22;
  else if (ord === 'pale') on = ax < 26;
  else if (ord === 'fess') on = Math.abs(y + 10) < 22;
  else if (ord === 'saltire') on = Math.abs(ax - Math.abs(y + 10)) < 14;
  else if (ord === 'mullet') { const a = Math.atan2(y + 10, x), r = Math.hypot(x, y + 10); on = r < 34 * (0.55 + 0.45 * Math.abs(Math.cos(a * 2.5))); }
  return on ? T : F;
}
