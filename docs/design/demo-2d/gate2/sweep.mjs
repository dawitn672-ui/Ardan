// Gate 2 · a sweep of the parts library: every outfit in every stance on a man, a woman, a child and an elder; every
// hair, beard and headwear; every feature at both ends; 300 seeded strangers. It fails on a throw, on a NaN in the
// drawing, and if one look ever gives two different drawings.   node docs/design/demo-2d/gate2/sweep.mjs
import { compose } from './figure.js';
import { SITTERS } from './sitters.js';
import { HAIRS, BEARDS } from './hair.js';
import { OUTFITS, HEADWEAR } from './gear.js';
import { POSES, BUILD_KEYS } from './rig.js';
import { FACE } from './head.js';
import { SKIN, HAIR, EYES } from './palette.js';
import { stream } from './g.js';

let n = 0, bad = 0; const fails = [];
const draw = (look, o, what) => {
  n++;
  try { const a = compose(look, { id: 'x', ...o }).svg; if (/NaN|undefined|Infinity/.test(a)) throw new Error('a bad number in the drawing'); return a; }
  catch (e) { bad++; if (fails.length < 12) fails.push(what + ': ' + e.message); return ''; }
};
const base = SITTERS.find(s => s.id === 'wat'), people = [['man', { sex: 'M', age: 30 }], ['woman', { sex: 'F', age: 30 }], ['child', { sex: 'F', age: 6 }], ['elder', { sex: 'M', age: 82 }]];
for (const [who, p] of people) for (const outfit of Object.keys(OUTFITS)) for (const pose of Object.keys(POSES)) draw({ ...base, ...p, outfit, pose, staff: 'crook' }, { crop: 'figure' }, `${who} ${outfit} ${pose}`);
for (const [who, p] of people) {
  for (const hair of Object.keys(HAIRS)) draw({ ...base, ...p, hair }, { crop: 'bust' }, `${who} hair ${hair}`);
  for (const beard of Object.keys(BEARDS)) draw({ ...base, ...p, beard }, { crop: 'bust' }, `${who} beard ${beard}`);
  for (const headwear of Object.keys(HEADWEAR)) draw({ ...base, ...p, headwear }, { crop: 'bust' }, `${who} headwear ${headwear}`);
  for (const f of FACE) for (const v of [-1, 1]) draw({ ...base, ...p, g: { [f[0]]: v } }, { crop: 'face' }, `${who} ${f[0]}=${v}`);
  for (const b of BUILD_KEYS) for (const v of [-1, 1]) draw({ ...base, ...p, build: { [b[0]]: v } }, { crop: 'figure' }, `${who} build ${b[0]}=${v}`);
  for (const yaw of [-18, 0, 18]) draw({ ...base, ...p, yaw }, { crop: 'face' }, `${who} yaw ${yaw}`);
}
const keys = o => Object.keys(o);
for (let i = 0; i < 300; i++) {
  const r = stream('sweep', String(i)), g = {}; for (const f of FACE) g[f[0]] = r.s();
  const build = {}; for (const b of BUILD_KEYS) build[b[0]] = r.s();
  const look = { id: 's' + i, sex: r() < .5 ? 'M' : 'F', age: r.i(4, 90), height: r.i(150, 200), skin: r.pick(keys(SKIN)), hair: r.pick(keys(HAIRS)), hairColor: r.pick(keys(HAIR)), eyes: r.pick(keys(EYES)), beard: r.pick(keys(BEARDS)), grey: r(), g, build,
    outfit: r.pick(keys(OUTFITS)), pose: r.pick(keys(POSES)), headwear: r.pick(keys(HEADWEAR)), quality: r() < .5 ? r.i(0, 3) : null, rarity: r() < .5 ? r.i(0, 3) : null, shield: r.pick([null, 'shield', 'none']), weapon: r.pick([null, 'sword', 'none']), yaw: r.i(-18, 18), roll: r.i(-5, 5), smile: r.s(), scars: [{ k: r.pick(['cheek', 'brow', 'lip', 'nose', 'jaw', 'forehead', 'burn', 'eye', 'nosebreak']), side: r() < .5 ? -1 : 1, fresh: r() < .3 }] };
  const a = draw(look, { crop: 'card', width: 250 }, 'stranger ' + i), b = draw(look, { crop: 'card', width: 250 }, 'stranger ' + i + ' again');
  if (a !== b) { bad++; fails.push('stranger ' + i + ': two drawings of one look differ'); }
}
console.log(`${n} drawings, ${bad} bad`); if (fails.length) console.log(fails.join('\n'));
process.exitCode = bad ? 1 : 0;
