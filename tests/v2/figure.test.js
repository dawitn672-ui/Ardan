// The figure library (src/ui/engine/figure): one look, one drawing; the parts are sane across a sweep of people; the
// second code survives; a face is made the same way every time and leans the way old appearance fields say; gear is
// drawn by item; a small picture leaves out what cannot be seen; text from the state never reaches the SVG raw.
import test from 'node:test';
import assert from 'node:assert/strict';
import { compose, lookOf, lookKey, faceFor, codeFor, extraFor, pack2, unpack2, EXTRA, CODE2_LEN, artOf, registerGear, GEAR_ART, HAIRS, BEARDS, POSES, OUTFITS, HEADWEAR, SKIN, face, stream } from '../../src/ui/engine/figure/index.js';

const SK = ['#f3d6c1', '#e8c0a0', '#d9a77f', '#c08a5e', '#a06c45', '#7e5132', '#5c3a23', '#3f2817', '#748a5c', '#c4b8ac'];
const sheet = (i, o = {}) => ({
  id: 'p' + i, name: 'N' + i, sex: i % 2 ? 'F' : 'M', race: 'human', age: 30, alive: true, estate: 'peasant',
  app: { skin: SK[i % 8], hair: i % 11, eye: i % 8, hstyle: ['short', 'cropped', 'long', 'braided', 'topknot', 'shaved', 'wild', 'tied', 'curly', 'ponytail', 'locks', 'mohawk', 'bald'][i % 13], beard: ['none', 'stubble', 'short', 'full', 'long', 'braided', 'forked', 'goatee', 'mustache', 'muttonchops'][i % 10], build: ['slight', 'lean', 'average', 'sturdy', 'heavy', 'muscular', 'gaunt', 'stout'][i % 8], height: i % 2 ? 160 : 172, face: i % 4, brow: i % 3, mouth: i % 3, nose: i % 3, eyeShape: i % 3 },
  gear: {}, wounds: [], traits: [], quirks: [], colors: { realm: '#3d6aa8', field: '#7a2a24', charge: '#d8c48a', device: 'M0 -10 L2.4 -3 L9.5 -3 L3.8 1.2 L6 8 L0 4 L-6 8 L-3.8 1.2 L-9.5 -3 L-2.4 -3 Z' }, mood: 0, ...o,
});
const draw = (sh, o) => compose(lookOf(sh), { crop: 'list', width: 64, tier: 1, id: 'x_', ...o });

test('one look, one drawing: the same sheet gives the same look and the same SVG, byte for byte', () => {
  for (let i = 0; i < 12; i++) {
    const a = lookOf(sheet(i)), b = lookOf(sheet(i));
    assert.equal(lookKey(a), lookKey(b));
    assert.equal(compose(a, { crop: 'tall', width: 176, tier: 2, id: 'x_' }).svg, compose(b, { crop: 'tall', width: 176, tier: 2, id: 'x_' }).svg);
  }
  assert.notEqual(lookKey(lookOf(sheet(1))), lookKey(lookOf(sheet(3))));
});

test('the parts are sane (partsSane): estates, peoples, ages, armour, wounds and 150 strangers draw with no bad number', () => {
  const cast = []; let i = 0;
  for (const estate of ['slave', 'serf', 'prisoner', 'peasant', 'artisan', 'merchant', 'gentry', 'noble', 'royal', 'priest']) for (const sex of ['M', 'F']) cast.push(sheet(i++, { estate, sex, ruler: estate === 'royal' && sex === 'M', married: i % 2 === 0 }));
  for (const armor of ['padded', 'leather', 'hide', 'mail', 'dwarfmail', 'scale', 'brigandine', 'lamellar', 'mailplate', 'plate', 'dwarfplate', 'robes']) for (const weapon of ['sword', 'spear', 'axe', 'mace', 'dagger', 'staff', 'longsword']) cast.push(sheet(i++, { estate: i % 3 ? 'peasant' : 'noble', officer: i % 4 === 0, gear: { armor: { id: armor }, weapon: { id: weapon }, helm: { id: ['kettle', 'helm', 'bascinet', 'coif'][i % 4] }, shield: i % 2 ? { id: 'heater' } : null, cloak: { id: ['cloak', 'furcloak', 'finecloak', 'tabard'][i % 4] } } }));
  for (const race of ['elf', 'halfelf', 'dwarf', 'orc', 'halforc', 'giant']) for (const sex of ['M', 'F']) for (const age of [0, 4, 12, 30, 80]) cast.push(sheet(i++, { race, sex, age, app: { ...sheet(i).app, skin: SK[8 + (i % 2)], height: { elf: 180, halfelf: 172, dwarf: 135, orc: 185, halforc: 178, giant: 290 }[race] } }));
  for (const age of [0, .5, 1, 2, 3, 5, 8, 11, 14, 17, 20, 45, 62, 80, 100]) for (const sex of ['M', 'F']) cast.push(sheet(i++, { age, sex, estate: i % 3 ? 'peasant' : 'noble' }));
  cast.push(sheet(i++, { alive: false, age: 66 }), sheet(i++, { wounds: [{ k: 'scar_face' }, { k: 'lost_eye' }, { k: 'broken_nose' }, { k: 'burn' }, { k: 'deep_cut', fresh: true }, { k: 'brand' }, { k: 'frostbite' }, { k: 'no_such_wound' }] }));
  for (let k = 0; k < 150; k++) {
    const r = stream('sweep', String(k)), est = r.pick(['slave', 'serf', 'peasant', 'artisan', 'merchant', 'gentry', 'noble', 'royal', 'priest']);
    cast.push(sheet(i++, { sex: r() < .5 ? 'M' : 'F', age: r.i(0, 95), estate: est, mood: r.s(), strength: r.s(), married: r() < .5, gear: r() < .4 ? { armor: { id: r.pick(['padded', 'mail', 'plate', 'scale']), make: r.i(0, 3), rarity: r.i(0, 3) }, weapon: { id: r.pick(['sword', 'spear', 'axe']), make: r.i(0, 3), rarity: r.i(0, 3) } } : {} }));
  }
  let n = 0;
  for (const sh of cast) for (const [crop, width, tier] of [['chip', 30, 0], ['list', 88, 1], ['tall', 176, 2], ['figure', 200, 2]]) {
    const svg = compose(lookOf(sh), { crop, width, tier, id: 'x_', tint: sh.alive === false ? 'dead' : null, ground: { a: '#5d6f96', b: '#2b3350' }, frame: { c: '#c9a64a', w: 1.5 } }).svg; n++;
    assert.ok(!/NaN|undefined|Infinity/.test(svg), `${sh.id} ${sh.race} ${sh.estate} age ${sh.age} at ${crop}: a bad number`);
    assert.ok((svg.match(/<path/g) || []).length > 12, `${sh.id} at ${crop}: nearly nothing drawn`);
  }
  assert.ok(n > 1200);
});

test('every hair, beard, stance, outfit and headwear of the library draws on a man, a woman, a child and an elder', () => {
  const base = lookOf(sheet(2));
  for (const p of [{ sex: 'M', age: 30 }, { sex: 'F', age: 30 }, { sex: 'F', age: 6 }, { sex: 'M', age: 82 }]) {
    const all = [...Object.keys(HAIRS).map(hair => ({ hair })), ...Object.keys(BEARDS).map(beard => ({ beard })), ...Object.keys(HEADWEAR).map(headwear => ({ headwear })), ...Object.keys(POSES).map(pose => ({ pose, staff: 'crook' })), ...Object.keys(OUTFITS).map(outfit => ({ outfit, gear: null }))];
    for (const ch of all) { const svg = compose({ ...base, ...p, ...ch }, { crop: 'figure', id: 'x_' }).svg; assert.ok(!/NaN|undefined|Infinity/.test(svg), JSON.stringify({ ...p, ...ch })); }
  }
});

test('the second code: eleven features and seven measures in 11 characters, checked like the first', () => {
  assert.equal(EXTRA.length, 18); assert.equal(CODE2_LEN, 11);
  const x = {}; EXTRA.forEach(([k, n], i) => { x[k] = -1 + 2 * ((i * 5) % n) / (n - 1); });
  const back = unpack2(pack2(x));
  for (const [k] of EXTRA) assert.ok(Math.abs(back[k] - x[k]) < 1e-9, k);
  assert.equal(unpack2('short'), null); assert.equal(unpack2('<'.repeat(11)), null); assert.equal(unpack2(7), null);
});

test('a face is made the same way every time, differs between people, and leans the way the old fields say', () => {
  assert.equal(codeFor('a1', { sex: 'M', race: 'human', app: {} }), codeFor('a1', { sex: 'M', race: 'human', app: {} }));
  const codes = new Set(); for (let i = 0; i < 300; i++) codes.add(codeFor('q' + i, { sex: i % 2 ? 'F' : 'M', race: 'human', app: {} }));
  assert.equal(codes.size, 300);
  const mean = (app, k) => { let s = 0; for (let i = 0; i < 200; i++) s += faceFor('m' + i, { sex: 'M', race: 'human', app })[k]; return s / 200; };
  assert.ok(mean({ nose: 2 }, 'noseLen') > mean({ nose: 0 }, 'noseLen') + .5);
  assert.ok(mean({ eyeShape: 0 }, 'lids') > mean({ eyeShape: 1 }, 'lids') + .5);
  assert.ok(mean({ face: 2 }, 'jawW') > mean({ face: 1 }, 'jawW') + .4);
  assert.ok(mean({ build: 'heavy' }, 'bulk') > mean({ build: 'gaunt' }, 'bulk') + 1);
  // a woman carries no beard and no balding; freckles are the exception
  let fr = 0; for (let i = 0; i < 300; i++) { const g = faceFor('f' + i, { sex: 'F', race: 'human', app: {} }); assert.equal(g.beardGrowth, -1); assert.equal(g.balding, -1); if (g.freckles > -1) fr++; }
  assert.ok(fr > 10 && fr < 80, 'freckled: ' + fr);
  // a child takes after its parents: nearer to them than to strangers
  let near = 0, far = 0;
  for (let i = 0; i < 80; i++) {
    const f = codeFor('fa' + i, { sex: 'M', race: 'human', app: {} }), m = codeFor('mo' + i, { sex: 'F', race: 'human', app: {} }), kid = faceFor('kid' + i, { sex: 'M', race: 'human', app: {}, father: f, mother: m });
    near += (face.distance(kid, face.unpack(f)) + face.distance(kid, face.unpack(m))) / 2; far += face.distance(kid, faceFor('st' + i, { sex: 'M', race: 'human', app: {} }));
  }
  assert.ok(near < far * .85, `${near} against ${far}`);
  // a people's mean shows: elves' ears, an orc's jaw
  assert.ok(lookOf(sheet(1, { race: 'elf' })).g.earPoint === 1 && lookOf(sheet(1)).g.earPoint === -1);
  assert.ok(lookOf(sheet(1, { race: 'orc' })).tusks === 1 && lookOf(sheet(1, { race: 'dwarf' })).stock === 1);
});

test('a stored face is drawn as stored; a bad code falls back to the made face', () => {
  const g = face.snap({ jawW: 1, noseBridge: 1, eyeTilt: -1 }), x = extraFor('zz'); x.cleft = 1; x.muscle = 1;
  // a royal sitter wears a circlet or a crown, which leaves the hair as it is (a hat or a veil would not; see below)
  const s4 = app => sheet(4, { estate: 'royal', app: { ...sheet(4).app, ...app } });
  const L = lookOf(s4({ g: face.pack(g), g2: pack2(x), hs: 'crest', bd: 'forked' }));
  assert.equal(L.g.jawW, 1); assert.equal(L.g.noseBridge, 1); assert.equal(L.g.eyeTilt, -1); assert.equal(L.g.cleft, 1); assert.equal(L.hair, 'crest'); assert.equal(L.beard, 'forked');
  const bad = lookOf(s4({ g: '<script>alert(1)</script>!!', g2: 5, hs: '"><b>', bd: {} }));
  assert.equal(lookKey(bad), lookKey(lookOf(s4({}))));
  // under a hat a tall style is cropped, and under a veil long hair is bound up
  const hat = lookOf(sheet(4, { app: { ...sheet(4).app, hs: 'crest' } }));
  if (hat.headwear === 'strawhat') assert.equal(hat.hair, 'cropped');
});

test('gear is drawn by item, with its make and its rarity; a new item is one registration', () => {
  assert.deepEqual(artOf({ id: 'sword' }), { art: 'sword', q: 1, r: 0 });
  assert.deepEqual(artOf({ id: 'sword', make: 3, rarity: 3 }), { art: 'sword', q: 3, r: 3 });
  assert.equal(artOf({ id: 'never_heard_of' }), null);
  assert.equal(artOf({ id: 'new_glaive', kind: 'polearm' }).art, 'spear');
  assert.equal(artOf({ id: 'sword', make: '"><b>', rarity: NaN }).q, 1);
  registerGear('e2_sunblade', { art: 'sword', q: 3, r: 3, long: 1 });
  const L = lookOf(sheet(6, { estate: 'gentry', sex: 'M', gear: { weapon: { id: 'e2_sunblade' } } }));
  assert.deepEqual(L.gear.find(g => g.id === 'sword'), { id: 'sword', q: 3, r: 3, long: 1 });
  delete GEAR_ART.e2_sunblade;
  const plate = lookOf(sheet(8, { estate: 'noble', sex: 'M', gear: { armor: { id: 'plate', make: 3, rarity: 2 }, weapon: { id: 'longsword' } } })).gear;
  for (const id of ['cuisses', 'greaves', 'poleyns', 'sabatons', 'breastplate', 'fauld', 'tassets', 'rerebraces', 'vambraces', 'couters', 'gauntlets', 'besagews', 'pauldrons', 'gorget']) assert.ok(plate.some(g => g.id === id && g.q === 3 && g.r === 2), id);
  // children carry nothing
  assert.ok(!lookOf(sheet(8, { age: 8, gear: { armor: { id: 'plate' }, weapon: { id: 'sword' } } })).gear.some(g => g.id === 'sword' || g.id === 'breastplate'));
});

test('a small picture leaves out what cannot be seen; the passes of light are for large ones only', () => {
  const L = lookOf(sheet(10, { estate: 'noble', sex: 'M', gear: { armor: { id: 'plate' }, weapon: { id: 'sword' }, shield: { id: 'heater' } } }));
  const chip = compose(L, { crop: 'chip', width: 30, tier: 0, id: 'x_' }), list = compose(L, { crop: 'list', width: 46, tier: 1, id: 'x_' }), tall = compose(L, { crop: 'tall', width: 176, tier: 2, id: 'x_' }), fig = compose(L, { crop: 'figure', id: 'x_' });
  assert.ok(chip.shapes < list.shapes && list.shapes < fig.shapes, `${chip.shapes} ${list.shapes} ${fig.shapes}`);
  assert.ok(chip.svg.length < fig.svg.length / 2);
  assert.ok(!/<filter/.test(chip.svg) && !/<filter/.test(list.svg.replace(/<filter id="x_[0-9a-z]+" x="-30%"[^>]*><feGaussianBlur[^>]*\/><\/filter>/g, '')), 'no light or depth pass on a list portrait');
  assert.ok(/feMorphology/.test(tall.svg), 'the light pass on a large portrait');
  assert.ok(!/feGaussianBlur/.test(chip.svg), 'no blur at all on the smallest');
});

test('text and colours from the state: a name is escaped, a bad colour or device is not drawn', () => {
  const sh = sheet(12, { name: '<img src=x onerror=alert(1)>"\'&', estate: 'noble', gear: { armor: { id: 'plate' } }, colors: { realm: 'red"/><script>', field: 'url(javascript:1)', charge: '"><b>', device: 'M0 0"/><script>alert(1)</script>' } });
  const svg = compose(lookOf(sh), { crop: 'tall', width: 176, tier: 2, id: 'x_', label: sh.name, ground: { a: 'red"><b>', b: '#112233' }, frame: { c: '"><i>' } }).svg;
  assert.ok(!/<(img|script|b|i)\b/.test(svg.slice(4))); assert.ok(!/javascript:/.test(svg)); assert.ok(/aria-label="&lt;img src=x onerror=alert\(1\)&gt;&quot;&#39;&amp;"/.test(svg));
  for (const m of svg.matchAll(/(?:fill|stroke|stop-color|flood-color)="([^"]*)"/g)) assert.ok(/^(#[0-9a-fA-F]{3,6}|none|url\(#[A-Za-z0-9_]+\))$/.test(m[1]), m[1]);
});

test('the dead are drawn with their eyes shut and their colour drained', () => {
  const sh = sheet(14, { alive: false }), L = lookOf(sh);
  assert.equal(L.closed, true);
  const a = compose(L, { crop: 'list', width: 88, tier: 1, id: 'x_', tint: 'dead' }).svg, b = compose({ ...L, closed: false }, { crop: 'list', width: 88, tier: 1, id: 'x_' }).svg;
  const sat = s => { let t = 0, n = 0; for (const m of s.matchAll(/fill="#([0-9a-f]{6})"/g)) { const v = parseInt(m[1], 16), r = v >> 16, g = (v >> 8) & 255, bl = v & 255; t += Math.max(r, g, bl) - Math.min(r, g, bl); n++; } return t / n; };
  assert.ok(sat(a) < sat(b) * .5, `${sat(a)} against ${sat(b)}`);
});
