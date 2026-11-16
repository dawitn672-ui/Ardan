// The face's features (characters.md §3, §4): 39 features, each read as -1..+1, the ends the real human range. Set by
// hand first (the player's are exactly what the controls wrote), inherited second (NPCs, children). A face is a code
// of 23 characters (138 bits). Plain functions; dice only from a seeded stream, never the world's.

// [key, steps, low word, high word, group]
export const FEATURES = [
  ['faceLen', 32, 'short', 'long', 'skull'], ['jawW', 32, 'narrow', 'broad', 'skull'], ['jawShape', 16, 'tapered', 'square', 'skull'],
  ['chin', 32, 'weak', 'strong', 'skull'], ['chinW', 8, 'pointed', 'broad', 'skull'], ['cheekbones', 32, 'flat', 'high', 'skull'],
  ['forehead', 8, 'low and sloped', 'high', 'skull'], ['cheeks', 16, 'hollow', 'full', 'skull'],
  ['eyeSize', 16, 'small', 'large', 'eyes'], ['eyeGap', 16, 'close-set', 'wide-set', 'eyes'], ['eyeTilt', 16, 'drooping', 'lifted', 'eyes'],
  ['lids', 16, 'heavy', 'open', 'eyes'], ['eyeDepth', 8, 'deep-set', 'prominent', 'eyes'],
  ['browRidge', 16, 'smooth', 'heavy', 'brows'], ['browShape', 8, 'straight', 'arched', 'brows'], ['browWeight', 8, 'fine', 'heavy', 'brows'],
  ['noseLen', 32, 'short', 'long', 'nose'], ['noseBridge', 32, 'scooped', 'hooked', 'nose'], ['noseTip', 16, 'upturned', 'drooping', 'nose'],
  ['noseW', 16, 'narrow', 'broad', 'nose'], ['tipShape', 8, 'fine', 'bulbous', 'nose'],
  ['mouthW', 16, 'small', 'wide', 'mouth'], ['lips', 16, 'thin', 'full', 'mouth'], ['upperLip', 8, 'short', 'long', 'mouth'], ['bite', 8, 'overbite', 'underbite', 'mouth'],
  ['earSize', 8, 'small', 'large', 'ears'], ['earSet', 8, 'flat', 'standing out', 'ears'],
  ['hairTex', 4, 'straight', 'coily', 'hair'], ['hairThick', 8, 'thin', 'thick', 'hair'], ['hairline', 8, 'low', 'high', 'hair'], ['balding', 8, 'never', 'early', 'hair'],
  ['greyOnset', 4, 'early grey', 'late grey', 'hair'], ['beardGrowth', 8, 'sparse', 'full', 'hair'],
  ['frame', 16, 'slight', 'broad', 'body'], ['bulk', 16, 'lean', 'heavy', 'body'], ['legs', 8, 'short-legged', 'long-legged', 'body'], ['neck', 8, 'slender', 'thick', 'body'],
  ['freckles', 4, 'none', 'many', 'body'], ['moles', 4, 'none', 'several', 'body'],
];
export const KEYS = FEATURES.map(f => f[0]);
export const GROUPS = ['skull', 'eyes', 'brows', 'nose', 'mouth', 'ears', 'hair', 'body'];
const bitsOf = steps => Math.ceil(Math.log2(steps));
export const BITS = FEATURES.reduce((s, f) => s + bitsOf(f[1]), 0);   // 138
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

// a value -1..1 to its step and back
export const toStep = (v, steps) => Math.max(0, Math.min(steps - 1, Math.round((Math.max(-1, Math.min(1, v)) + 1) / 2 * (steps - 1))));
export const fromStep = (i, steps) => -1 + 2 * i / (steps - 1);
export const snap = g => { const o = {}; for (const [k, s] of FEATURES) o[k] = fromStep(toStep(g[k] ?? 0, s), s); return o; };

// 23 characters, 6 bits each
export function pack(g) {
  const bits = [];
  for (const [k, s] of FEATURES) { const n = bitsOf(s), v = toStep(g[k] ?? 0, s); for (let b = n - 1; b >= 0; b--) bits.push((v >> b) & 1); }
  while (bits.length % 6) bits.push(0);
  let out = ''; for (let i = 0; i < bits.length; i += 6) { let v = 0; for (let b = 0; b < 6; b++) v = v * 2 + bits[i + b]; out += B64[v]; }
  return out;
}
// a pasted code is checked character by character before it is used (§10); null if it is not a face
export function unpack(code) {
  if (typeof code !== 'string' || code.length !== Math.ceil(BITS / 6)) return null;
  const bits = [];
  for (const ch of code) { const v = B64.indexOf(ch); if (v < 0) return null; for (let b = 5; b >= 0; b--) bits.push((v >> b) & 1); }
  const g = {}; let p = 0;
  for (const [k, s] of FEATURES) { const n = bitsOf(s); let v = 0; for (let b = 0; b < n; b++) v = v * 2 + bits[p++]; if (v > s - 1) return null; g[k] = fromStep(v, s); }
  return g;
}

// seeded stream (mulberry32) from a string id and channel: features have their own dice (§4)
export function streamOf(id, ch = 'face') {
  let h = 2166136261; const s = String(id) + '|' + ch; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  let a = h >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const gauss = r => { let u = 0, v = 0; while (u === 0) u = r(); v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const FACE27 = KEYS.slice(0, 27);
const FLATTER = ['eyeSize', 'cheekbones', 'lips'], HARD = ['noseLen', 'noseBridge', 'earSize', 'chin', 'noseW'];

// a new face around a people's mean: spread 0.40, then three to five features pushed out to 0.7 or more (the signature)
export function make(id, o = {}) {
  const r = streamOf(id, 'face'), mean = o.mean || {}, g = {};
  for (const k of KEYS) g[k] = Math.max(-1, Math.min(1, (mean[k] || 0) + 0.4 * gauss(r)));
  const n = 3 + Math.floor(r() * 3), looks = o.looks ?? 50;
  const pool = looks >= 70 ? [...FLATTER, ...FACE27] : looks <= 30 ? [...HARD, ...FACE27] : FACE27;
  const used = new Set();
  for (let i = 0; i < n; i++) {
    let k; do k = pool[Math.floor(r() * pool.length)]; while (used.has(k));
    used.add(k); const s = r() < 0.5 ? -1 : 1; g[k] = s * (0.7 + 0.3 * r());
  }
  if (o.sex === 'F') { g.balding = -1; g.beardGrowth = -1; }
  return snap(g);
}

// distance between two faces (the 27 face features), 0..2 a feature, averaged
export function distance(a, b, keys = FACE27) { let s = 0; for (const k of keys) s += Math.abs((a[k] || 0) - (b[k] || 0)); return s / keys.length; }
// how many features differ clearly (by a quarter of the range, 0.5)
export function clearlyDiffer(a, b, keys = FACE27) { let n = 0; for (const k of keys) if (Math.abs((a[k] || 0) - (b[k] || 0)) >= 0.5) n++; return n; }

// inheritance by group (§4): father's four in ten, mother's four in ten, an even blend otherwise; a little noise and a
// 10% pull to the people's mean. Balding and beard growth are carried by mothers too (her father's), never shown.
export function inherit(father, mother, id, o = {}) {
  const r = streamOf(id, 'inherit'), mean = o.mean || {}, g = {}, from = {};
  for (const grp of GROUPS) {
    const x = r(), w = x < 0.4 ? 0.8 : x < 0.8 ? 0.2 : 0.5;
    from[grp] = w > 0.6 ? 'father' : w < 0.4 ? 'mother' : 'both';
    for (const [k, , , , gg] of FEATURES) if (gg === grp) {
      let fv = father[k] ?? 0, mv = mother[k] ?? 0;
      if (k === 'balding' || k === 'beardGrowth') mv = (mother._carry && mother._carry[k]) ?? mv;
      let v = w * fv + (1 - w) * mv + 0.12 * gauss(r);
      v = v * 0.9 + (mean[k] || 0) * 0.1;
      g[k] = Math.max(-1, Math.min(1, v));
    }
  }
  const out = snap(g); out._from = from; return out;
}
// the line for the birth card: "Her father's jaw, her mother's eyes."
export function takesAfter(child, sex = 'M') {
  const f = child._from || {}, pos = sex === 'F' ? 'Her' : 'His', low = pos.toLowerCase();
  const nm = { skull: 'jaw', eyes: 'eyes', brows: 'brows', nose: 'nose', mouth: 'mouth', ears: 'ears' };
  const fa = Object.keys(nm).filter(k => f[k] === 'father'), mo = Object.keys(nm).filter(k => f[k] === 'mother');
  const parts = [];
  if (fa.length) parts.push(`${parts.length ? low : pos} father's ${nm[fa[0]]}`);
  if (mo.length) parts.push(`${parts.length ? low : pos} mother's ${nm[mo[0]]}`);
  if (!parts.length) return `${pos} face is both parents' at once.`;
  return parts.join(', ') + '.';
}
// your family fits your face (§4): each of your groups is given to one parent; the rest of each parent is their people's
export function parentsFor(you, id, o = {}) {
  const r = streamOf(id, 'parents'), father = make(id + '|f', { mean: o.mean, sex: 'M' }), mother = make(id + '|m', { mean: o.mean, sex: 'F' });
  for (const grp of GROUPS) {
    const toFather = r() < 0.5;
    for (const [k, , , , gg] of FEATURES) if (gg === grp) {
      const tgt = toFather ? father : mother, other = toFather ? mother : father;
      tgt[k] = you[k] ?? 0; other[k] = Math.max(-1, Math.min(1, 0.4 * (you[k] ?? 0) + 0.6 * other[k]));
    }
  }
  return { father: snap(father), mother: snap(mother) };
}
// words at a feature's ends, for the creation screen (no percentages: §10)
export function words(k, v) { const f = FEATURES.find(x => x[0] === k); if (!f) return ''; return v < -0.33 ? f[2] : v > 0.33 ? f[3] : 'middling'; }
