// Hair (characters.md §6): a mass first, strands second. A style is data: how thick the mass lies on the skull, where it
// is cut (the hairline, the nape, over or under the ears), which way it is combed (a part, a crown, combed back), and the
// masses that hang or are bound (a fall of loose hair, tails, braids, buns) as solids round the head. The mass takes the
// window's light and casts its shadow; strands are relief along each lock, and the light runs across them in a band.
// Texture bends the locks; grey comes lock by lock from its age; balding takes the temples and the crown.
import { lin, HAIR, GREY, WHITE, mix3 } from './materials.js';
import { noise2, noise3, fbm3, hash32 } from './noise.js';
import { sstep, clamp, lerp, hv } from '../../../people/engine/anatomy.js';
import { diffuse, specular, rim, KEY } from './light.js';
import { ELL, CAP, ADD, SUB, place, mmul, rotY, rotX, mvec, mT } from './surface.js';

// ---------- the catalogue: 38 styles (§6) ----------
// vol: mm of hair on the crown; side: on the sides; nape: how low at the back (mm below the eye line, grown head);
// ears: 'over' covers them; flow: 'crown' | 'side' | 'centre' | 'back' | 'fwd'; fringe: mm the front falls over the brow;
// mass: the hanging or bound solids; shaved: stubble only; part: the part's side offset
export const STYLES = [
  // short
  { id: 'shaved', name: 'shaved', group: 'short', vol: 0.8, side: 0.8, nape: -40, flow: 'crown', shaved: 1 },
  { id: 'cropped', name: 'cropped', group: 'short', vol: 4, side: 2.5, nape: -45, flow: 'crown' },
  { id: 'bowl', name: 'bowl cut', group: 'short', vol: 11, side: 9, nape: -30, flow: 'crown', fringe: 22, ears: 'half', bowl: 1 },
  { id: 'sidepart', name: 'side-parted', group: 'short', vol: 12, side: 6, nape: -45, flow: 'side', part: 22 },
  { id: 'tonsure', name: 'tonsure', group: 'short', vol: 6, side: 5, nape: -40, flow: 'crown', tonsure: 34 },
  { id: 'soldier', name: "soldier's crop", group: 'short', vol: 6, side: 2, nape: -40, flow: 'fwd', fringe: 4 },
  { id: 'combed', name: 'combed back', group: 'short', vol: 14, side: 6, nape: -48, flow: 'back' },
  { id: 'curlcrop', name: 'short curls', group: 'short', vol: 15, side: 9, nape: -42, flow: 'crown', tex: 0.6 },
  // medium
  { id: 'bob', name: 'bob', group: 'medium', vol: 13, side: 11, nape: -70, flow: 'centre', ears: 'over', mass: 'bob', len: 95 },
  { id: 'shag', name: 'shag', group: 'medium', vol: 18, side: 13, nape: -70, flow: 'crown', ears: 'over', fringe: 18, mass: 'bob', len: 105, rough: 1 },
  { id: 'halftied', name: 'half-tied', group: 'medium', vol: 13, side: 8, nape: -60, flow: 'back', ears: 'over', mass: 'fall', len: 150, knot: 1 },
  { id: 'mop', name: 'mop', group: 'medium', vol: 22, side: 16, nape: -60, flow: 'crown', ears: 'over', fringe: 26, mass: 'bob', len: 80, rough: 1 },
  { id: 'pageboy', name: 'page-boy', group: 'medium', vol: 12, side: 11, nape: -72, flow: 'crown', ears: 'over', fringe: 20, mass: 'bob', len: 100, curlIn: 1 },
  { id: 'chinlen', name: 'chin-length, parted', group: 'medium', vol: 12, side: 10, nape: -72, flow: 'side', part: 20, ears: 'over', mass: 'bob', len: 110 },
  { id: 'tucked', name: 'tucked behind the ears', group: 'medium', vol: 12, side: 7, nape: -70, flow: 'centre', mass: 'fall', len: 135 },
  { id: 'warrior', name: "warrior's mane", group: 'medium', vol: 20, side: 12, nape: -70, flow: 'back', ears: 'over', mass: 'fall', len: 160, rough: 1 },
  // long
  { id: 'loose', name: 'loose and long', group: 'long', vol: 12, side: 10, nape: -80, flow: 'centre', ears: 'over', mass: 'fall', len: 330 },
  { id: 'looseside', name: 'long, side-parted', group: 'long', vol: 13, side: 10, nape: -80, flow: 'side', part: 22, ears: 'over', mass: 'fall', len: 300 },
  { id: 'tail', name: 'tail at the nape', group: 'long', vol: 10, side: 5, nape: -55, flow: 'back', mass: 'tail', len: 260 },
  { id: 'hightail', name: 'high tail', group: 'long', vol: 9, side: 4, nape: -40, flow: 'back', mass: 'hightail', len: 280 },
  { id: 'mane', name: 'mane', group: 'long', vol: 24, side: 18, nape: -80, flow: 'crown', ears: 'over', mass: 'fall', len: 300, rough: 1 },
  { id: 'sidebraids', name: 'side braids', group: 'long', vol: 10, side: 6, nape: -55, flow: 'centre', mass: 'sidebraids', len: 260 },
  { id: 'waves', name: 'long waves', group: 'long', vol: 16, side: 13, nape: -80, flow: 'side', part: 16, ears: 'over', mass: 'fall', len: 290, tex: 0.3 },
  { id: 'veiled', name: 'long under a fillet', group: 'long', vol: 11, side: 9, nape: -80, flow: 'centre', ears: 'over', mass: 'fall', len: 300, fillet: 1 },
  // bound
  { id: 'braid', name: 'one braid', group: 'bound', vol: 9, side: 5, nape: -50, flow: 'back', mass: 'braid', len: 300 },
  { id: 'crownbraid', name: 'crown braid', group: 'bound', vol: 9, side: 6, nape: -45, flow: 'back', mass: 'crownbraid' },
  { id: 'bun', name: 'low bun', group: 'bound', vol: 6, side: 5, nape: -45, flow: 'back', mass: 'bun' },
  { id: 'highbun', name: 'high bun', group: 'bound', vol: 8, side: 4, nape: -42, flow: 'back', mass: 'highbun' },
  { id: 'twinbuns', name: 'twin buns', group: 'bound', vol: 9, side: 5, nape: -45, flow: 'centre', mass: 'twinbuns' },
  { id: 'topknot', name: 'topknot', group: 'bound', vol: 7, side: 2, nape: -38, flow: 'back', mass: 'topknot' },
  { id: 'rows', name: 'tight rows', group: 'bound', vol: 5, side: 4, nape: -45, flow: 'back', rows: 1 },
  { id: 'locks', name: 'locks', group: 'bound', vol: 16, side: 12, nape: -70, flow: 'crown', ears: 'over', mass: 'locks', len: 240, tex: 1 },
  { id: 'coiled', name: 'coiled braids', group: 'bound', vol: 9, side: 6, nape: -45, flow: 'centre', mass: 'coils' },
  { id: 'netted', name: 'netted bun', group: 'bound', vol: 9, side: 6, nape: -45, flow: 'back', mass: 'bun', net: 1 },
  // shaped
  { id: 'crest', name: 'crest', group: 'shaped', vol: 26, side: 0.6, nape: -50, flow: 'back', crest: 1 },
  { id: 'undercut', name: 'undercut', group: 'shaped', vol: 16, side: 0.8, nape: -45, flow: 'side', part: 24, undercut: 1 },
  { id: 'fringecrown', name: 'a fringe round a bald crown', group: 'shaped', vol: 9, side: 8, nape: -45, flow: 'crown', bald: 1 },
  { id: 'shornslave', name: 'shorn', group: 'shaped', vol: 1.5, side: 1.5, nape: -40, flow: 'crown', shaved: 1 },
];
export const BEARDS = [
  { id: 'none', name: 'clean-shaven' }, { id: 'stubble', name: 'stubble', stub: 1 }, { id: 'moustache', name: 'moustache', mou: 1, len: 5 },
  { id: 'droop', name: 'drooping moustache', mou: 1, len: 6, droop: 1 }, { id: 'short', name: 'short full beard', full: 1, len: 7, mou: 1 },
  { id: 'full', name: 'full beard', full: 1, len: 16, mou: 1, hang: 30 }, { id: 'long', name: 'long beard', full: 1, len: 18, mou: 1, hang: 120 },
  { id: 'goatee', name: 'goatee', chin: 1, len: 9, mou: 1 }, { id: 'chinstrap', name: 'chin strap', strap: 1, len: 5 },
  { id: 'chops', name: 'side-whiskers', chops: 1, len: 8 }, { id: 'forked', name: 'forked beard', full: 1, len: 16, mou: 1, hang: 110, fork: 1 },
  { id: 'braided', name: 'braided beard', full: 1, len: 14, mou: 1, hang: 120, braid: 1 }, { id: 'spade', name: 'spade beard', full: 1, len: 14, mou: 1, hang: 60, spade: 1 },
  { id: 'vandyke', name: 'moustache and point', chin: 1, len: 10, mou: 1, hang: 35, point: 1 },
];
export const styleOf = id => STYLES.find(s => s.id === id) || STYLES[3];
export const beardOf = id => BEARDS.find(b => b.id === id) || BEARDS[0];

// ---------- colour: the stored colour, greyed lock by lock with the years ----------
export function greyShare(look) {
  const g = look.g || {}, onset = [26, 34, 42, 52][clamp(Math.round(((g.greyOnset ?? 0.3) + 1) * 1.5), 0, 3)];
  const a = look.age ?? 30;
  return 0.12 * sstep(onset - 2, onset + 6, a) + 0.88 * sstep(onset + 4, onset + 52, a);
}
// how far the hair has gone at the temples and the crown (men, by feature; §6)
export function baldness(look) {
  if (look.sex === 'F' || look.race === 'elf') return { temples: 0, crown: 0 };
  const b = ((look.g || {}).balding ?? -0.5), a = look.age ?? 30;
  const k = clamp((b + 0.6) / 1.6, 0, 1);
  return { temples: k * sstep(22, 55, a), crown: k * k * sstep(32, 70, a) };
}

// ---------- the hairline and the cut: where hair grows on this head (model frame) ----------
function hairField(ctx) {
  const m = ctx.m, Mk = m.marks, hs = Mk.cr, look = ctx.look, st = ctx.style;
  const g = look.g || {}, bald = baldness(look);
  const top = Mk.top, yH = Mk.browY + (40 + 6 * (g.hairline || 0) - 3 * Mk.fem) * hs + 26 * bald.temples * hs;
  const zc = -18 * hs;   // the skull's axis, a little behind the ears' front
  const nape = (st.nape ?? -45) * hs;
  const crownC = [0, top - 18 * hs, -45 * hs];
  // the line round the head, by angle from the front (degrees)
  const T = [[0, yH], [25, yH - 2 * hs + 6 * bald.temples * hs], [45, yH - 6 * hs + 22 * bald.temples * hs], [60, yH - 26 * hs + 14 * bald.temples * hs], [70, -2 * hs], [79, -30 * hs], [86, -30 * hs], [92, 14 * hs], [112, 16 * hs], [126, -14 * hs], [150, nape], [180, nape - 6 * hs]];
  const lineAt = deg => { for (let i = 1; i < T.length; i++) if (deg <= T[i][0]) { const a = T[i - 1], b = T[i]; return lerp(a[1], b[1], (deg - a[0]) / (b[0] - a[0])); } return T[T.length - 1][1]; };
  return (x, y, z) => {
    const deg = Math.abs(Math.atan2(x, z - zc)) * 57.2958;
    let f = y - lineAt(deg) + 1.5 * hs * noise2(x * 0.5, z * 0.5, 17);
    // over the ears: covered only by styles that fall over them
    if (st.ears === 'over' && deg > 74 && deg < 130) f = Math.max(f, y + 30 * hs);
    // crown thinning and the bald crown with a fringe round it
    const dc = Math.hypot(x - crownC[0], y - crownC[1], z - crownC[2]);
    const cr = st.bald ? 62 * hs : st.tonsure ? st.tonsure * hs : 75 * hs * bald.crown;
    if (cr > 0) f = Math.min(f, (dc - cr) * 0.8 + (st.bald || st.tonsure ? 0 : 3 * hs * noise2(x * 0.3, z * 0.3, 19)));
    // a crest keeps a strip; an undercut leaves the sides shaven
    if (st.crest) f = Math.min(f, (22 * hs - Math.abs(x)) * 0.8);
    return f;
  };
}

// ---------- layers ----------
export function hairLayers(ctx) {
  const look = ctx.look, m = ctx.m, Mk = m.marks, hs = Mk.cr;
  const st = ctx.style = styleOf(look.hair || (look.sex === 'F' ? 'loose' : 'sidepart'));
  const bd = ctx.beard = beardOf(look.age < 16 || look.sex === 'F' ? 'none' : look.beard || 'none');
  const base = lin(HAIR[clamp(look.hairColor ?? 3, 0, HAIR.length - 1)] || HAIR[3]);
  ctx.hairBase = base; ctx.grey = greyShare(look) * (look.race === 'elf' ? 0.3 : 1);
  ctx.hairCol = base;
  ctx.browCol = mix3(base.map(v => v * 0.55 + 0.012), lin(GREY), ctx.grey * 0.6);
  ctx.lashCol = [0.018, 0.013, 0.012].map((v, i) => v + base[i] * 0.15);
  const P = ctx.P, V = m.V, nv = V.length / 3, Q = m.mesh.quads, N = ctx.skinN || null;
  const layers = [];
  const baby = Mk.baby;
  const field = ctx.hairField = hairField(ctx);
  const skinN = ctx.skinNormals;
  // the mass on the skull: the skin pushed out by the hair's thickness, cut at the hairline
  const volK = (1 - 0.88 * sstep(3, 0, look.age ?? 30)) * (1 - 0.3 * baby) * (look.g && look.g.hairThick != null ? 1 + 0.35 * look.g.hairThick : 1);
  const texK = st.tex ?? texOf(look);
  const thick = new Float32Array(nv);
  const zc = -18 * hs;
  for (let i = 0; i < nv; i++) {
    const x = V[i * 3], y = V[i * 3 + 1], z = V[i * 3 + 2];
    if (y < Mk.chinY - 10 * hs) continue;
    const f = field(x, y, z); if (f < -14 * hs) { thick[i] = 0.45; continue; }
    const upness = sstep(-10 * hs, Mk.top - 20 * hs, y), back = sstep(10, -60, z);
    let t = lerp(st.side, st.vol, upness) * volK * (1 + 0.6 * texK * 0.5);
    if (st.crest) t = Math.abs(x) < 24 * hs ? st.vol * (0.4 + 0.6 * upness) : 0.7;
    if (st.undercut && (Math.abs(x) > 40 * hs && y < Mk.top - 40 * hs)) t = 0.7;
    if (st.fringe && z > 20 * hs && y > Mk.browY) t += st.fringe * 0.35 * sstep(Mk.browY + 60 * hs, Mk.browY + 20 * hs, y);
    if (st.bowl) t *= 1 + 0.2 * upness;
    // the mass thins to nothing at its edge so it grows out of the skin; locks break its surface
    t *= 0.35 + 0.65 * sstep(0, 9 * hs, f);
    const lk = lockNoise(x, y, z, hs, texK, st);
    t += lk * Math.min(t, 3.5 + 3 * texK) + 0.4;
    thick[i] = Math.max(0.45, Math.min(t, (st.crest ? 40 : st.group === 'bound' ? 11 : 22) * hs));
    if (m.mesh.marks.earMask[i]) thick[i] = 0.45;
  }
  ctx.hairThick = thick;
  const faces = new Uint8Array(m.mesh.nq), [b0, b1] = m.mesh.ranges.body, EM = m.mesh.marks.earMask;
  for (let f = b0; f < b1; f++) { if (m.removed[f]) continue; let ok = 0, ear = 0; for (let e = 0; e < 4; e++) { const v = Q[f * 4 + e]; if (thick[v] > 0) ok++; if (EM[v]) ear++; } if (ok === 4 && ear < 2) { let near = 0; for (let e = 0; e < 4; e++) { const v = Q[f * 4 + e]; if (field(V[v * 3], V[v * 3 + 1], V[v * 3 + 2]) > -10 * hs) near = 1; } faces[f] = near; } }
  const sk = ctx.skinLayerN;
  const HP = new Float32Array(nv * 3), HM = new Float32Array(nv * 3);
  for (let i = 0; i < nv; i++) for (let c = 0; c < 3; c++) { HP[i * 3 + c] = P[i * 3 + c] + sk[i * 3 + c] * thick[i]; HM[i * 3 + c] = V[i * 3 + c]; }
  // the cut is ragged at the scale of single hairs, so the line is soft without being blurred
  const rag = (x, y, z) => noise3(x * 1.1 / hs, y * 1.1 / hs, z * 1.1 / hs, 71) * 2.2 * hs + noise3(x * 0.3 / hs, y * 0.3 / hs, z * 0.3 / hs, 72) * 1.5 * hs;
  layers.push({ name: 'hair', mat: 'hair', kind: 'scalp', P: HP, M: HM, quads: Q, faces, cut: (x, y, z) => field(x, y, z) + rag(x, y, z) - 1.2 * hs, N: null });
  // the beard: the skin of the lower face pushed out by its length
  if (bd.full || bd.mou || bd.chin || bd.strap || bd.chops) {
    const grow = clamp(((look.g || {}).beardGrowth ?? 0.4) * 0.5 + 0.7, 0.25, 1.2) * sstep(15, 24, look.age);
    const bf = ctx.beardField = beardField(ctx, bd);
    const bt = new Float32Array(nv);
    for (let i = 0; i < nv; i++) {
      const x = V[i * 3], y = V[i * 3 + 1], z = V[i * 3 + 2];
      if (y < Mk.chinY - 60 * hs || y > 20 * hs) continue; const f = bf(x, y, z); if (f < -6 * hs) { bt[i] = 0.4; continue; }
      const under = sstep(Mk.chinY + 10 * hs, Mk.chinY - 25 * hs, y);
      let t = (bd.len || 6) * grow * (0.35 + 0.65 * sstep(0, 7 * hs, f)) * (1 + 0.5 * under);
      if (bd.mou && Math.abs(y - (Mk.mouth.y + 6 * hs)) < 7 * hs && Math.abs(x) < Mk.mouth.w + 8 * hs) t = Math.max(t * 0.7, 3.5 * grow);
      t += lockNoise(x, y, z, hs, 0.5, st) * Math.min(t, 3) + 0.4;
      bt[i] = Math.max(0.4, t);
    }
    const bfaces = new Uint8Array(m.mesh.nq);
    for (let f = b0; f < b1; f++) { if (m.removed[f]) continue; let ok = 0, near = 0; for (let e = 0; e < 4; e++) { const v = Q[f * 4 + e]; if (bt[v] > 0) ok++; if (bt[v] > 0.45) near = 1; } if (ok === 4 && near) bfaces[f] = 1; }
    const BP = new Float32Array(nv * 3);
    for (let i = 0; i < nv; i++) for (let c = 0; c < 3; c++) BP[i * 3 + c] = P[i * 3 + c] + sk[i * 3 + c] * bt[i];
    layers.push({ name: 'beard', mat: 'hair', kind: 'beard', P: BP, M: HM, quads: Q, faces: bfaces, cut: (x, y, z) => bf(x, y, z) + noise3(x * 1.2 / hs, y * 1.2 / hs, z * 1.2 / hs, 73) * 1.8 * hs - 0.5 * hs, N: null });
  }
  return layers;
}
const texOf = look => [0, 0.3, 0.65, 1][clamp(Math.round((((look.g || {}).hairTex ?? -1) + 1) * 1.5), 0, 3)];
// locks: grooves that run with the comb, rougher and rounder for curls
function lockNoise(x, y, z, hs, tex, st) {
  const f = (0.11 + 0.08 * tex) / hs;
  const a = noise3(x * f, y * f * (0.35 + tex * 0.6), z * f, 5), b = noise3(x * f * 2.1, y * f * 1.2, z * f * 2.1, 6);
  return (1 - Math.abs(a)) * 0.7 + b * 0.3 * (st.rough ? 1.6 : 1) - 0.45;
}

// ---------- the beard's ground ----------
function beardField(ctx, bd) {
  const Mk = ctx.m.marks, hs = Mk.cr, mo = Mk.mouth, ch = Mk.chinY;
  return (x, y, z) => {
    if (z < -30 * hs) return -9;
    const ax = Math.abs(x);
    // the cheek line from the sideburn to the corner of the mouth
    const cheekY = lerp(-12 * hs, mo.y + 12 * hs, sstep(66 * hs, mo.w + 10 * hs, ax));
    let f = -9;
    if (bd.full) f = Math.min(cheekY - y, y - (ch - 34 * hs));
    if (bd.chops) f = Math.min(-8 * hs - y + 0 * ax, y - (mo.y + 2 * hs), ax - (mo.w + 22 * hs));
    if (bd.strap) f = Math.min(cheekY - y, y - (ch - 20 * hs), Math.max(ax - (mo.w + 14 * hs), (mo.y - 22 * hs) - y + 4 * hs));
    if (bd.chin) f = Math.max(f, Math.min((mo.w * 0.8) - ax, (mo.y - 9 * hs) - y, y - (ch - 18 * hs)));
    if (bd.mou) { const fm = Math.min((mo.w + 6 * hs) - ax, (mo.y + 14 * hs) - y, y - (mo.y + 2 * hs) + (bd.droop ? 1 : 0) * sstep(mo.w - 6, mo.w + 6, ax) * 14 * hs); f = Math.max(f, fm); }
    // no hair on the lips, nor in a scar
    const onLip = ax < mo.w + 1 && y < mo.y + 6 * hs && y > mo.y - 8 * hs;
    if (onLip) f = Math.min(f, -2);
    return f + 1.2 * hs * noise2(x * 0.4, y * 0.4, 23);
  };
}

// ---------- solids round the head: falls, tails, braids, buns, a long beard ----------
export function hairSDF(ctx) {
  const st = ctx.style, bd = ctx.beard, Mk = ctx.m.marks, hs = Mk.cr, look = ctx.look;
  const prims = [], top = Mk.top, zb = -50 * hs;
  const body = Math.max(0.35, Mk.stature / 1740);
  const E = (c, r, k = 6) => prims.push({ t: ELL, c, r, k });
  const C = (a, b, r1, r2, k = 6) => prims.push({ t: CAP, a, b, r1, r2, k });
  const len = (st.len || 0) * lerp(0.4, 1, sstep(1, 12, look.age)) * body;
  const sideW = 74 * hs;
  if (st.mass === 'fall' || st.mass === 'bob') {
    const L = st.mass === 'bob' ? (st.len || 95) * hs : len, y0 = 10 * hs, bob = st.mass === 'bob';
    // the fall behind: wide over the back of the skull, narrowing as it hangs
    E([0, y0 - L * 0.45, -62 * hs - 0.08 * L], [72 * hs + 0.06 * L, L * 0.55 + 40 * hs, 46 * hs], 18);
    E([0, 30 * hs, -40 * hs], [80 * hs, 70 * hs, 70 * hs], 18);
    for (const s of [1, -1]) {
      if (st.part && s < 0 && !bob) continue;
      // the side falls framing the face, from the temple down past the jaw
      const fx = s * (sideW - 2 * hs), lowY = y0 - (bob ? L * 0.95 : L * 0.8);
      E([fx + s * 4 * hs, (30 * hs + lowY) / 2, -6 * hs], [16 * hs, (30 * hs - lowY) / 2, 34 * hs], 14);
    }
  }
  if (st.mass === 'tail' || st.mass === 'hightail') {
    const y = st.mass === 'hightail' ? top - 40 * hs : -20 * hs, z = st.mass === 'hightail' ? -85 * hs : -95 * hs;
    E([0, y, z], [12 * hs, 12 * hs, 12 * hs], 6);
    C([0, y, z - 6 * hs], [0, y - len * 0.5, z - 18 * hs], 13 * hs, 11 * hs, 8);
    C([0, y - len * 0.5, z - 18 * hs], [0, y - len, z - 10 * hs], 11 * hs, 4 * hs, 8);
  }
  if (st.mass === 'braid' || st.mass === 'sidebraids') {
    const sides = st.mass === 'braid' ? [0] : [1, -1];
    for (const s of sides) {
      const x0 = s * (sideW - 10 * hs), z0 = s ? 0 : -95 * hs, y0 = s ? -20 * hs : -10 * hs;
      const n = Math.max(4, Math.round(len / (16 * hs)));
      for (let i = 0; i < n; i++) { const t = i / n; E([x0 + s * 6 * hs * t, y0 - t * len, z0 + (s ? 10 * hs : -12 * hs) + 4 * hs * Math.sin(i * 1.7)], [10 * hs * (1 - 0.35 * t), 10 * hs, 9 * hs * (1 - 0.3 * t)], 2.5); }
    }
  }
  if (st.mass === 'bun' || st.mass === 'highbun') { const hi = st.mass === 'highbun'; E([0, hi ? top - 20 * hs : -12 * hs, hi ? -60 * hs : -100 * hs], [32 * hs, 26 * hs, 24 * hs], 10); }
  if (st.mass === 'twinbuns') for (const s of [1, -1]) E([s * 52 * hs, top - 38 * hs, -45 * hs], [22 * hs, 22 * hs, 20 * hs], 10);
  if (st.mass === 'topknot') { E([0, top + 8 * hs, -25 * hs], [17 * hs, 20 * hs, 17 * hs], 8); }
  if (st.mass === 'crownbraid') for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; E([Math.sin(a) * 66 * hs, top - 40 * hs + 6 * hs * Math.cos(a) + 3 * hs * Math.sin(i * 2.3), -18 * hs + Math.cos(a) * 78 * hs], [10 * hs, 9 * hs, 10 * hs], 3); }
  if (st.mass === 'coils') for (const s of [1, -1]) for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; E([s * (64 * hs + 4 * hs * Math.cos(a)), 2 * hs + 22 * hs * Math.sin(a), -16 * hs + 22 * hs * Math.cos(a)], [8 * hs, 8 * hs, 8 * hs], 3); }
  if (st.mass === 'locks') for (let i = 0; i < 18; i++) { const a = (i / 18 - 0.5) * Math.PI * 1.5, x = Math.sin(a) * 70 * hs, z = -20 * hs - Math.cos(a) * 70 * hs; C([x, 10 * hs, z], [x * 1.08, 10 * hs - len * (0.75 + 0.25 * hv(look.id, 'lk' + i)), z - 10 * hs], 6 * hs, 5 * hs, 1.5); }
  if (st.knot) E([0, top - 50 * hs, -92 * hs], [16 * hs, 12 * hs, 10 * hs], 6);
  // a long beard: a mass under the chin, forked or braided or cut square
  if (bd.hang && look.age >= 18) {
    const L = bd.hang * hs * clamp(((look.g || {}).beardGrowth ?? 0.4) * 0.4 + 0.8, 0.4, 1.2), ch = Mk.chinY, cz = Mk.chinZ;
    const bp = [];
    if (bd.fork) for (const s of [1, -1]) bp.push({ t: CAP, a: [s * 8 * hs, ch - 4 * hs, cz - 6 * hs], b: [s * 18 * hs, ch - L, cz + 2 * hs], r1: 16 * hs, r2: 5 * hs, k: 8 });
    else if (bd.braid) { bp.push({ t: CAP, a: [0, ch, cz - 8 * hs], b: [0, ch - 26 * hs, cz - 2 * hs], r1: 28 * hs, r2: 14 * hs, k: 10 }); for (let i = 0; i < 6; i++) bp.push({ t: ELL, c: [0, ch - 30 * hs - i * (L - 30 * hs) / 6, cz - 2 * hs], r: [9 * hs, 9 * hs, 8 * hs], k: 2 }); }
    else if (bd.point) bp.push({ t: CAP, a: [0, ch - 2 * hs, cz - 6 * hs], b: [0, ch - L, cz + 4 * hs], r1: 12 * hs, r2: 2 * hs, k: 6 });
    else bp.push({ t: CAP, a: [0, ch + 6 * hs, cz - 14 * hs], b: [0, ch - L, cz - 6 * hs], r1: (bd.spade ? 36 : 30) * hs, r2: (bd.spade ? 30 : 10) * hs, k: 12 }, { t: ELL, c: [0, ch - 5 * hs, cz - 22 * hs], r: [40 * hs, 26 * hs, 26 * hs], k: 12 });
    const g = sdfGroup(ctx, bp, 'beard');
    g.dispModel = (x, y, z) => -lockNoise(x, y, z, hs, 0.5, st) * 2.2;
    g.dispAmp = 3;
    var beardG = g;
  }
  const out = [];
  if (prims.length) {
    const g = sdfGroup(ctx, prims, 'mass');
    const tex = st.tex ?? texOf(look);
    g.dispModel = (x, y, z) => -lockNoise(x, y * (st.mass === 'fall' || st.mass === 'bob' ? 0.4 : 1), z, hs, tex, st) * (2.4 + 2.5 * tex);
    g.dispAmp = 3 + 3 * tex;
    out.push(g);
  }
  if (beardG) out.push(beardG);
  return out;
}
// a group of solids carried by the head, placed in the world
export function sdfGroup(ctx, prims, kind, mat = 'hair', extra = {}) {
  const Mw = mmul(ctx.bodyR, mmul(rotY(ctx.yawH - ctx.yawB), rotX(ctx.pitch)));
  const C0 = [0, ctx.shoulderY, -40 * ctx.m.marks.cr], nk = ctx.neck;
  const d = [nk[0] - C0[0], nk[1] - C0[1], nk[2] - C0[2]], rd = mvec(ctx.bodyR, d);
  const T = [rd[0] + C0[0] - nk[0], rd[1] + C0[1] - nk[1], rd[2] + C0[2] - nk[2]];
  const Mi = mT(Mw);
  return {
    mat, kind, ...extra,
    prims: prims.map(p => place(p, Mw, nk, T)),
    toModel: (x, y, z, o) => { const a = x - nk[0] - T[0], b = y - nk[1] - T[1], c = z - nk[2] - T[2]; o[0] = Mi[0] * a + Mi[1] * b + Mi[2] * c + nk[0]; o[1] = Mi[3] * a + Mi[4] * b + Mi[5] * c + nk[1]; o[2] = Mi[6] * a + Mi[7] * b + Mi[8] * c + nk[2]; return o; },
  };
}

// ---------- shading: a mass with strands, the light in a band across them ----------
const T3 = [0, 0, 0];
export function shadeHair(PS, G, L, n, ao, sh, c, Wp) {
  const ctx = PS.ctx, Mk = PS.m.marks, hs = Mk.cr, st = ctx.style, x = L[0], y = L[1], z = L[2];
  const R = ctx.headR;
  // which way the hair runs here (model frame)
  let tx, ty, tz;
  const kind = G.kind;
  if (kind === 'beard') { tx = x * 0.15; ty = -1; tz = 0.25; }
  else if (kind === 'mass' && y < 0) { tx = x * 0.004; ty = -1; tz = -0.1; }
  else {
    const top = Mk.top, fl = st.flow;
    let sx = 0, sy = top - 15 * hs, sz = -50 * hs;
    if (fl === 'side' || fl === 'centre') { sx = fl === 'side' ? (st.part || 20) * hs : 0; sy = top - 4 * hs; sz = Math.min(Math.max(z, -40 * hs), 60 * hs); }
    if (fl === 'back') { sx = x; sy = y + 30 * hs; sz = z + 120 * hs; }
    if (fl === 'fwd') { sx = x; sy = top; sz = z - 80 * hs; }
    tx = x - sx; ty = y - sy; tz = z - sz;
    const l = Math.hypot(tx, ty, tz) || 1; tx /= l; ty /= l; tz /= l;
    const grav = sstep(20 * hs, -40 * hs, y); ty -= grav * 1.2;
  }
  // the model normal, and the tangent laid along the surface
  const nmx = R[0] * n[0] + R[3] * n[1] + R[6] * n[2], nmy = R[1] * n[0] + R[4] * n[1] + R[7] * n[2], nmz = R[2] * n[0] + R[5] * n[1] + R[8] * n[2];
  const dn = tx * nmx + ty * nmy + tz * nmz; tx -= dn * nmx; ty -= dn * nmy; tz -= dn * nmz;
  let tl = Math.hypot(tx, ty, tz) || 1; const tconf = Math.min(1, tl * 2.5); tx /= tl; ty /= tl; tz /= tl;
  // strands: fine noise smeared along the hair's own direction, so streaks follow the comb wherever it turns
  const tex = st.tex ?? texOf(PS.look);
  const fine = PS.mmpp < 0.45 ? 1 : PS.mmpp < 0.9 ? 0.6 : 0.25;
  const fq = 1.5 / hs, fq2 = 0.32 / hs, dl = 2.2 * hs;
  let s1 = 0, s2 = 0, gl = 0;
  const wav = tex * 2.5 * hs;
  for (let k = -2; k <= 2; k++) {
    const ox = x + tx * k * dl, oy = y + ty * k * dl, oz = z + tz * k * dl;
    const wv = wav * Math.sin((ox + oy + oz) * 0.35 / hs);
    s1 += noise3((ox + wv) * fq, oy * fq, (oz + wv) * fq, 41);
    s2 += noise3(ox * fq2, oy * fq2, oz * fq2, 43);
    if (k === 0 || k === 2 || k === -2) gl += noise3(ox * 0.09 / hs, oy * 0.09 / hs, oz * 0.09 / hs, 47);
  }
  s1 /= 5; s2 /= 5; gl /= 3;
  const strand = clamp(0.5 + 0.5 * (s1 * 1.6 * fine + s2 * 1.1), 0, 1);
  // grey lock by lock: a lock once grey stays grey
  const temple = sstep(20 * hs, 70 * hs, Math.abs(x)) * sstep(40 * hs, -10 * hs, z) + (kind === 'beard' ? 0.3 : 0);
  const gshare = clamp(ctx.grey * (1 + 0.6 * temple), 0, 1);
  const lockId = clamp(0.5 + gl * 0.25 + 1.5 * s1 + 0.3 * s2, 0, 1);
  const greyMix = gshare > 0 ? sstep(1 - gshare - 0.1, 1 - gshare + 0.1, lockId) : 0;
  let alb = ctx.hairBase;
  if (greyMix > 0) alb = mix3(alb, mix3(lin('#827e78'), lin('#c2bdb3'), clamp((ctx.grey - 0.5) * 2, 0, 1)), greyMix);
  // shaved and thin hair shows the scalp
  let skinShow = kind === 'scalp' ? 0.7 * (1 - sstep(0.3, 2.5, PS.look.age ?? 30)) : 0;
  if (st.shaved || (kind === 'scalp' && ctx.hairThick && st.vol < 2)) skinShow = 0.55 - 0.25 * strand;
  const dark = 0.5 + 0.7 * strand;
  const a = [alb[0] * dark, alb[1] * dark, alb[2] * dark];
  // a soft hairline: near its edge the hair is sparse and the skin shows through
  if (kind === 'scalp' && ctx.hairField) { const f = ctx.hairField(x, y, z), dens = sstep(-2 * hs, 6 * hs, f); skinShow = Math.max(skinShow, 0.45 * (1 - dens)); }
  if (kind === 'beard' && ctx.beardField) { const f = ctx.beardField(x, y, z), dens = sstep(-0.5 * hs, 5 * hs, f + 2 * hs * (strand - 0.5)); skinShow = Math.max(skinShow, (1 - dens) * 0.8); }
  if (skinShow > 0) { const sk = PS.skin; for (let q = 0; q < 3; q++) a[q] = lerp(a[q], sk[q] * 0.82, skinShow); }
  // the light: soft diffuse, two lobes along the strands
  diffuse(a, n, Math.pow(ao, 1.4), sh, [0.25, 0.25, 0.25], c);
  const twx = R[0] * tx + R[1] * ty + R[2] * tz, twy = R[3] * tx + R[4] * ty + R[5] * tz, twz = R[6] * tx + R[7] * ty + R[8] * tz;
  const hx = KEY[0], hy = KEY[1], hz = KEY[2] + 1, hl = Math.hypot(hx, hy, hz);
  const lobe = (shift, p) => { let ux = twx + n[0] * shift, uy = twy + n[1] * shift, uz = twz + n[2] * shift; const ul = Math.hypot(ux, uy, uz); const th = (ux * hx + uy * hy + uz * hz) / ul / hl; return Math.pow(Math.max(0, Math.sqrt(Math.max(0, 1 - th * th))), p); };
  const lum = 0.2 + alb[0] + alb[1];
  const sp1 = lobe(0.12, 80) * 0.2 * sh * (0.3 + strand) * tconf, sp2 = lobe(-0.18, 20) * 0.26 * sh * (0.3 + 0.7 * strand) * tconf;
  c[0] += sp1 * 0.9 * (0.5 + lum) + sp2 * alb[0] * 1.6; c[1] += sp1 * 0.86 * (0.5 + lum) + sp2 * alb[1] * 1.6; c[2] += sp1 * 0.8 * (0.5 + lum) + sp2 * alb[2] * 1.6;
  const rm = rim(n, 0.35) * (0.5 + strand);
  c[0] += rm * (0.12 + alb[0]); c[1] += rm * (0.13 + alb[1]); c[2] += rm * (0.17 + alb[2]);
}

// ---------- brows: hairs laid in strokes (§3 brow weight, shape) ----------
export function browHair(PS, x, y, z) {
  const m = PS.m, Mk = m.marks, hs = Mk.cr;
  if (z < Mk.eyeZ - 2 * hs) return 0;
  let best = 0;
  for (const b of m.brows) {
    const s = b.side, p = b.pts;
    if ((x - p[0][0]) * s < -4 * hs || (x - p[3][0]) * s > 4 * hs) continue;
    // distance to the brow's line and how far along it (0 inner .. 1 outer)
    let bd = 1e9, bt = 0, acc = 0, tot = 0;
    for (let i = 0; i < 3; i++) tot += Math.hypot(p[i + 1][0] - p[i][0], p[i + 1][1] - p[i][1]);
    for (let i = 0; i < 3; i++) {
      const ax = p[i][0], ay = p[i][1], vx = p[i + 1][0] - ax, vy = p[i + 1][1] - ay, L2 = vx * vx + vy * vy, Ls = Math.sqrt(L2);
      let t = ((x - ax) * vx + (y - ay) * vy) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const d = Math.hypot(x - ax - vx * t, y - ay - vy * t); if (d < bd) { bd = d; bt = (acc + t * Ls) / tot; }
      acc += Ls;
    }
    const half = b.w * lerp(0.75, 0.32, Math.pow(bt, 1.3));
    const side = (y - (p[0][1] + (p[3][1] - p[0][1]) * bt)) ;
    const edge = half + 0.6 * hs * noise2(x * 1.3 / hs, y * 1.3 / hs, 51);
    if (bd > edge + 1.2 * hs) continue;
    // hairs: up at the inner end, out and down at the tail
    const ang = lerp(1.25, -0.25, sstep(0, 0.6, bt)) * s;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const u = (x * ca + y * sa), v = (-x * sa + y * ca);
    const fine = PS.mmpp < 0.6 ? 1 : 0.4;
    const hair = 0.55 + 0.45 * fine * noise2(v * 2.4 / hs, u * 0.35 / hs, 53);
    let a = clamp((edge - bd) / (0.9 * hs) + 0.5, 0, 1) * hair * lerp(1.0, 0.75, bt);
    if (b.gap) { const gx = p[1][0] + (p[2][0] - p[1][0]) * 0.55; if (Math.abs(x - gx) < 1.6 * hs) a *= 0.05; }
    if (a > best) best = a;
  }
  return Math.min(0.92, best);
}

// ---------- a shaved jaw shows the beard's shadow; stubble is dots in the skin ----------
export function beardShadow(PS, x, y, z) {
  const ctx = PS.ctx, Mk = PS.m.marks, hs = Mk.cr;
  if (PS.look.sex === 'F' || Mk.mal < 0.5 || z < -35 * hs) return 0;
  const grow = clamp(((PS.look.g || {}).beardGrowth ?? 0.4) * 0.5 + 0.6, 0.15, 1.1);
  const bf = ctx.shadowField || (ctx.shadowField = beardField(ctx, { full: 1, mou: 1 }));
  const f = bf(x, y, z);
  if (f <= -3 * hs) return 0;
  let v = sstep(-3 * hs, 6 * hs, f) * grow * Mk.mal;
  const stub = ctx.beard && ctx.beard.stub;
  if (stub || PS.mmpp < 0.5) {
    const s = noise2(x * 2.2 / hs, y * 2.2 / hs, 61);
    v *= stub ? 0.9 + 0.9 * (s > 0.1 ? 1 : 0.2) : 0.75 + 0.3 * s;
  } else v *= 0.6;
  return Math.min(1.25, v * (stub ? 1.4 : 1));
}
