// The figure library · a person to a look. The game hands over a SHEET (plain data it read from a person: who they
// are, the appearance it stores, what they wear and carry, their wounds); lookOf(sheet) returns the look that
// compose() draws. Pure: one sheet, one look. Everything that seems random comes from a stream seeded by the person's
// id and a channel name, never from the world's dice, the clock or Math.random.
//
// The face is the game's 23-character code (src/people/engine/face.js, 39 features), kept in app.g. A second code of
// 11 characters, app.g2, holds the eleven features the drawn head added and the seven measures of the build
// (docs/DECISIONS.md D-036); only a face made by hand at creation stores it. A person without a code (an old save
// before its upgrade, a preview, a test's clone) gets the face faceFor() makes from their id and the appearance
// fields they do have, so the same person is always the same face.
import * as face from '../../../people/engine/face.js';
import { stream, clamp } from './g.js';
import { HAIRS, BEARDS } from './hair.js';
import { kit } from './wardrobe.js';

// ---- the second code: [key, steps] ---------------------------------------------------------------------------------
export const EXTRA = [
  ['foreheadW', 8], ['cleft', 8], ['irisSize', 8], ['lashes', 8], ['browTilt', 8], ['browGap', 8], ['noseProj', 8], ['lowerLip', 8], ['mouthCurve', 8], ['earPoint', 8], ['lobes', 8],
  ['weight', 16], ['muscle', 16], ['shoulders', 16], ['hips', 16], ['legs', 16], ['neck', 16], ['posture', 16],
];
export const FACE_EXTRA = EXTRA.slice(0, 11).map(e => e[0]), BUILD = EXTRA.slice(11).map(e => e[0]);
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const bitsOf = n => Math.ceil(Math.log2(n)), BITS2 = EXTRA.reduce((s, e) => s + bitsOf(e[1]), 0);
export const CODE2_LEN = Math.ceil(BITS2 / 6);
export function pack2(x) {
  const bits = [];
  for (const [k, n] of EXTRA) { const b = bitsOf(n), v = face.toStep(x[k] ?? 0, n); for (let i = b - 1; i >= 0; i--) bits.push((v >> i) & 1); }
  while (bits.length % 6) bits.push(0);
  let out = ''; for (let i = 0; i < bits.length; i += 6) { let v = 0; for (let b = 0; b < 6; b++) v = v * 2 + bits[i + b]; out += B64[v]; }
  return out;
}
export function unpack2(code) {
  if (typeof code !== 'string' || code.length !== CODE2_LEN) return null;
  const bits = [];
  for (const ch of code) { const v = B64.indexOf(ch); if (v < 0) return null; for (let b = 5; b >= 0; b--) bits.push((v >> b) & 1); }
  const x = {}; let p = 0;
  for (const [k, n] of EXTRA) { const b = bitsOf(n); let v = 0; for (let i = 0; i < b; i++) v = v * 2 + bits[p++]; if (v > n - 1) return null; x[k] = face.fromStep(v, n); }
  return x;
}

// ---- peoples: what a people's faces and bodies lean toward (the features' means), and their frame --------------------
export const PEOPLES = {
  human:   { mean: {}, ear: -1, stock: 0 },
  halfelf: { mean: { jawW: -.2, cheekbones: .2, eyeTilt: .25, noseW: -.2 }, ear: .45, stock: 0 },
  elf:     { mean: { jawW: -.45, chin: -.2, chinW: -.3, cheekbones: .45, eyeTilt: .5, eyeSize: .2, noseW: -.4, browRidge: -.4, lips: -.1, faceLen: .2, beardGrowth: -1 }, ear: 1, stock: -.08 },
  dwarf:   { mean: { jawW: .55, jawShape: .4, noseW: .5, tipShape: .6, browRidge: .45, browWeight: .5, faceLen: -.35, cheeks: .3, beardGrowth: 1 }, ear: -1, stock: 1 },
  orc:     { mean: { jawW: .75, jawShape: .7, chin: .5, browRidge: .9, browWeight: .6, noseW: .75, noseLen: -.4, noseBridge: -.3, bite: .9, eyeSize: -.3, eyeDepth: -.5, lips: -.2 }, ear: .6, stock: .15, tusks: 1 },
  halforc: { mean: { jawW: .4, jawShape: .35, browRidge: .45, noseW: .35, bite: .5, eyeDepth: -.2 }, ear: .25, stock: .08, tusks: .5 },
  giant:   { mean: { jawW: .4, browRidge: .55, faceLen: .2, noseLen: .3, noseW: .3, chin: .3 }, ear: -1, stock: -.12 },
};
const peopleOf = race => PEOPLES[race] || PEOPLES.human;

// ---- the face ------------------------------------------------------------------------------------------------------
// what the release's five face fields lean a face toward (app.face 0-3, brow 0-2, mouth 0-2, nose 0-2, eyeShape 0-2),
// so a face chosen on the old creation screen keeps its character
const OLD = {
  face: [{}, { faceLen: .55, jawW: -.25, cheekbones: .2 }, { jawW: .55, jawShape: .6, chinW: .4, faceLen: -.15 }, { faceLen: -.45, cheeks: .55, jawShape: -.4 }],
  brow: [{}, { browShape: .7, browWeight: -.2 }, { browWeight: .7, browRidge: .45, browShape: -.3 }],
  mouth: [{}, { lips: -.6, mouthW: .2 }, { lips: .6, mouthW: -.1 }],
  nose: [{ noseLen: -.55, noseW: -.3, noseBridge: -.3 }, {}, { noseLen: .45, noseBridge: .55, noseW: .3 }],
  eyeShape: [{ lids: .6, eyeSize: .35 }, { lids: -.65, eyeSize: -.1 }, { eyeTilt: .45, lids: -.1 }],
  build: { slight: { frame: -.6, bulk: -.4 }, lean: { bulk: -.6 }, average: {}, sturdy: { frame: .45, bulk: .2 }, heavy: { bulk: .8, frame: .2 }, muscular: { frame: .65, bulk: .1 }, gaunt: { bulk: -.9 }, stout: { bulk: .6, frame: .2, legs: -.3 } },
};
const lean = (g, to) => { for (const k in to) g[k] = clamp((g[k] || 0) * .55 + to[k], -1, 1); };
// a face for a person who has none stored: from the parents' codes when they have them (inheritance by group, as
// face.inherit), else made round the people's mean; then leaned by the old appearance fields. o: { sex, race, app,
// father, mother } (father and mother are codes)
export function faceFor(id, o = {}) {
  const P = peopleOf(o.race), mean = P.mean, app = o.app || {};
  const fg = face.unpack(o.father), mg = face.unpack(o.mother);
  let g;
  if (fg || mg) g = face.inherit(fg || face.make(id + '|f', { mean, sex: 'M' }), mg || face.make(id + '|m', { mean, sex: 'F' }), id, { mean });
  else g = face.make(id, { mean, sex: o.sex });
  delete g._from;
  for (const k of ['face', 'brow', 'mouth', 'nose', 'eyeShape']) { const t = OLD[k][app[k]]; if (t) lean(g, t); }
  if (OLD.build[app.build]) lean(g, OLD.build[app.build]);
  // freckles and moles are the exception, not the rule (a plain roll of the feature gives half the world freckles)
  const r = stream(id, 'marks');
  g.freckles = app.freckles ? 1 : r() < .12 ? (r() < .5 ? -.33 : .33) : -1;
  g.moles = r() < .16 ? (r() < .6 ? -.33 : .33) : -1;
  if (o.sex === 'F') { g.balding = -1; g.beardGrowth = -1; }
  return face.snap(g);
}
export const codeFor = (id, o) => face.pack(faceFor(id, o));
// the eleven further features and the build's seven, for a person who stores no second code: small, from the id
export function extraFor(id, o = {}) {
  const r = stream(id, 'extra'), x = {}, gs = () => clamp((r() + r() + r() - 1.5) * .9, -1, 1);
  for (const k of FACE_EXTRA) x[k] = gs() * .7;
  x.cleft = r() < .14 ? .4 + r() * .6 : -1; x.earPoint = -1; x.lobes = gs() * .6;
  for (const k of BUILD) x[k] = gs() * .35;
  return x;
}

// ---- the game's appearance words to the library's parts -------------------------------------------------------------
// GD.HAIR's eleven colours and GD.EYES' eight, by index
export const HAIR_OF = ['black', 'darkbrown', 'chestnut', 'tawny', 'darkblond', 'blond', 'flaxen', 'auburn', 'copper', 'silver', 'white'];
export const EYES_OF = ['darkbrown', 'brown', 'hazel', 'blue', 'greyblue', 'grey', 'amber', 'black'];
// the game's hair words (GD.HAIRSTYLES) to the styles drawn: [men's], [women's]; one is taken by the person's id
export const HSTYLE = {
  short: [['messy', 'sidepart', 'curtain', 'spiky', 'bowl'], ['bob', 'curtain', 'messy']],
  cropped: [['cropped', 'cropped', 'stubble'], ['cropped', 'bob']],
  long: [['shoulder', 'long', 'shoulder'], ['long', 'wavy', 'shoulder', 'long']],
  braided: [['braid', 'tied'], ['braid', 'braids', 'crownbraid']],
  topknot: [['topknot'], ['bun', 'topknot', 'buns']],
  shaved: [['stubble'], ['stubble', 'cropped']],
  wild: [['messy', 'spiky', 'shoulder'], ['wavy', 'curls', 'messy']],
  tied: [['tied'], ['bun', 'tied', 'ponytail']],
  curly: [['coily', 'messy', 'coilyfull'], ['curls', 'coilyfull', 'curls']],
  ponytail: [['tied', 'ponytail'], ['ponytail', 'ponytail', 'pigtails']],
  locks: [['locs'], ['locs']],
  mohawk: [['crest'], ['crest']],
  bald: [['bald'], ['bald']],
};
export const BEARD_OF = { none: ['none'], stubble: ['stubble'], short: ['short', 'chinstrap'], full: ['full'], long: ['long'], braided: ['forked', 'long'], forked: ['forked'], goatee: ['goatee'], mustache: ['moustache', 'handlebar'], muttonchops: ['chops'] };
// the game's builds (GD.BUILDS) as the rig's measures
export const BUILD_OF = {
  slight: { weight: -.4, muscle: -.6, shoulders: -.5 }, lean: { weight: -.65, muscle: .1 }, average: {}, sturdy: { muscle: .45, shoulders: .45, weight: .2 },
  heavy: { weight: .85, hips: .3, neck: .35 }, muscular: { muscle: .95, shoulders: .75, neck: .55, weight: .1 }, gaunt: { weight: -1, muscle: -.5, posture: -.2 }, stout: { weight: .65, shoulders: .2, legs: -.4, neck: .3 },
};
// wounds (GD.WOUNDS) that show on the face: [scar, which side is free to fall by the id]
const SCAR_OF = { scar_face: ['cheek', 'brow', 'jaw'], deep_cut: ['jaw', 'forehead'], lost_eye: ['eye'], broken_nose: ['nosebreak'], burn: ['burn'], brand: ['forehead'], concussion: null, frostbite: ['nose'] };
const pickBy = (id, ch, arr) => arr[Math.floor(stream(id, ch)() * arr.length) % arr.length];
const HEXOK = /^#[0-9a-fA-F]{6}$/;

// the grey in the hair, 0..1, from the years (a people's years made human: sheet.ageH) and the face's grey onset
export function greyOf(ageH, g) { const onset = [26, 34, 42, 52][Math.round((clamp(g.greyOnset ?? 0, -1, 1) + 1) * 1.5)]; return clamp((ageH - onset - 6) / 26, 0, 1); }

// ---- a sheet to a look ----------------------------------------------------------------------------------------------
// sheet: { id, name, sex, race, age (human-equivalent years), alive, app, estate, ruler, rung, officer, armed, gear,
//          wounds: [{ k, fresh }], traits, quirks, colors: { realm, field, charge, device }, cult: { hat, dye }, mood,
//          strength (-1..1), married, pc }
export function lookOf(sh) {
  const id = String(sh.id ?? 'x'), app = sh.app || {}, male = sh.sex !== 'F', P = peopleOf(sh.race), age = Math.max(0, +sh.age || 0);
  const g = face.unpack(app.g) || faceFor(id, { sex: sh.sex, race: sh.race, app });
  const x = unpack2(app.g2) || extraFor(id, sh);
  const gx = { ...g }; for (const k of FACE_EXTRA) gx[k] = x[k];
  gx.earPoint = Math.max(gx.earPoint ?? -1, P.ear);
  if (P.ear > 0) gx.earSize = Math.max(gx.earSize || 0, P.ear * .5);
  // hair, beard, grey
  const dark = typeof app.skin === 'string' && HEXOK.test(app.skin) && parseInt(app.skin.slice(1, 3), 16) < 150;
  let hair = Object.prototype.hasOwnProperty.call(HAIRS, app.hs) ? app.hs : null;
  if (!hair) {
    const row = HSTYLE[app.hstyle] || HSTYLE.short; let opts = row[male ? 0 : 1];
    if (app.hstyle === 'curly' && !dark) opts = male ? ['messy', 'curtain'] : ['curls', 'wavy'];
    if (app.hstyle === 'short' && dark && (g.hairTex || 0) > .2) opts = ['coily', 'cropped'];
    hair = pickBy(id, 'hstyle', opts);
    if (!male && age < 12 && (hair === 'bun' || hair === 'buns' || hair === 'crownbraid')) hair = pickBy(id, 'hkid', ['pigtails', 'braids', 'bob']);
    if (sh.estate === 'priest' && male && age >= 18 && stream(id, 'tonsure')() < .55 && !['long', 'braided', 'locks'].includes(app.hstyle)) hair = 'tonsure';
    // thinning comes with the years to the men who carry it
    if (male && age > 34 + (1 - (g.balding || 0)) * 18 && (g.balding || 0) > 0 && ['messy', 'sidepart', 'curtain', 'spiky', 'bowl', 'cropped', 'stubble', 'swept'].includes(hair)) hair = 'balding';
  }
  if (age < 1.5) hair = 'stubble'; else if (age < 3 && !['bald', 'stubble', 'cropped'].includes(hair)) hair = 'cropped';
  let beard = 'none';
  if (male && age >= 17 && (sh.race !== 'elf')) {
    beard = typeof app.bd === 'string' && Object.prototype.hasOwnProperty.call(BEARDS, app.bd) ? app.bd : pickBy(id, 'beard', BEARD_OF[app.beard] || ['none']);
    if (age < 20 && !['none', 'stubble', 'moustache'].includes(beard)) beard = 'stubble';
  }
  const hairColor = typeof app.hair === 'number' ? HAIR_OF[app.hair] || 'darkbrown' : 'darkbrown';
  const grey = app.hair === 9 || app.hair === 10 ? 0 : greyOf(age, g);
  // the body
  const base = BUILD_OF[app.build] || {}, build = {};
  for (const k of BUILD) build[k] = (base[k] || 0) + (x[k] || 0);
  build.shoulders += .3 * (g.frame || 0); build.weight += .3 * (g.bulk || 0); build.legs += .5 * (g.legs || 0); build.neck += .4 * (g.neck || 0);
  build.muscle += .45 * clamp(sh.strength || 0, -1, 1);
  const proud = ['noble', 'royal'].includes(sh.estate) || sh.officer || sh.ruler, low = ['slave', 'serf', 'prisoner'].includes(sh.estate);
  build.posture += proud ? .35 : low ? -.4 : 0;
  if ((sh.quirks || []).includes('bigframe')) { build.shoulders += .4; build.muscle += .2; }
  if ((sh.quirks || []).includes('lithe')) { build.weight -= .3; build.shoulders -= .2; }
  if (sh.race === 'giant') { build.muscle += .5; build.shoulders += .4; build.neck += .4; }
  if (sh.race === 'orc') { build.muscle += .4; build.shoulders += .3; build.neck += .3; }
  if (sh.race === 'elf') { build.weight -= .3; build.legs += .3; }
  if (age < 14) { build.muscle *= .3; build.weight *= .5; }
  for (const k of BUILD) build[k] = clamp(build[k], -1, 1);
  // what a life marked
  const scars = [], seen = new Set();
  for (const w of sh.wounds || []) {
    const opts = SCAR_OF[w.k]; if (!opts) continue;
    const k = pickBy(id, 'scar|' + w.k, opts); if (seen.has(k)) continue; seen.add(k);
    scars.push({ k, side: stream(id, 'side|' + w.k)() < .5 ? -1 : 1, fresh: !!w.fresh });
  }
  // dress, arms and stance
  const K = kit(sh, { male, age, id });
  // hair under what is worn on the head: a veil, a coif or a closed helm covers it (long hair is bound up under them),
  // and a hat or an open helm sits on a head, not on a topknot
  if (K.headwear && K.headwear !== 'none' && K.headwear !== 'circlet' && K.headwear !== 'crown') {
    const st = HAIRS[hair] || {}, covers = ['veil', 'coif', 'bascinet'].includes(K.headwear);
    const long = st.mass || st.braid || st.tail || st.tails || st.knot || st.earBuns || (st.curtain && st.curtain.to > 40), tall = ['topknot', 'spiky', 'crest', 'coilyfull', 'buns', 'ponytail', 'pigtails', 'messy'].includes(hair);
    if (covers ? long || tall : tall) hair = male ? 'cropped' : covers ? 'bun' : 'bob';
  }
  // bearing: the head turned a little from the light or toward it, and tipped; the face at rest follows the mood
  const r = stream(id, 'bearing'), yaw = Math.round((r() < .7 ? 1 : -1) * (9 + r() * 7)), roll = Math.round(r.s() * 3);
  const mood = clamp(sh.mood ?? 0, -1, 1);
  return {
    id, name: sh.name || '', sex: male ? 'M' : 'F', age, height: clamp(+app.height || (male ? 172 : 160), 40, 560), build, stock: P.stock, tusks: P.tusks || 0,
    skin: typeof app.skin === 'string' && HEXOK.test(app.skin) ? app.skin.toLowerCase() : 'warm', eyes: EYES_OF[app.eye] || 'brown', hair, hairColor, grey, beard, g: gx, scars,
    pose: K.pose, gear: K.gear, headwear: K.headwear, headwearOpts: K.headwearOpts, staff: K.staff,
    yaw, roll, smile: mood * .55, mood, closed: sh.alive === false || (age < .5 && mood >= 0 && r() < .5),
  };
}
// the key of a look: everything compose reads, as one string (the game keeps drawn pictures by it)
export const lookKey = look => JSON.stringify(look, (k, v) => (typeof v === 'number' ? Math.round(v * 100) / 100 : v));
export { face };
