// The eight sheets of the first gate (characters.md §14), as data: each cell is a look, the painter's options and a
// caption. Sizes are CSS pixels; the painter draws at twice that (two device pixels to a CSS pixel, §11).
import { make } from '../../../src/people/engine/face.js';
import { STYLES, BEARDS } from '../../../src/ui/engine/paint/hair.js';

const h = (s, ch) => { let x = 2166136261; for (const c of s + '|' + ch) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619); } x ^= x >>> 13; return ((Math.imul(x, 0x5bd1e995) >>> 0) % 10000) / 10000; };
const pick = (arr, id, ch) => arr[Math.floor(h(id, ch) * arr.length)];
const NORTH_HAIR = [0, 1, 2, 3, 4, 5, 6, 7, 9, 11, 12, 13, 14, 15, 17];
// a person of the North (one people): features with a signature, a skin from fair to light olive, a natural colour
export function person(id, sex, o = {}) {
  return { id, sex, age: o.age ?? Math.round(24 + 18 * h(id, 'age')), g: make(id, { sex }), skin: o.skin ?? pick([0, 1, 2, 2, 3, 3, 4, 5], id, 'sk'), hairColor: o.hairColor ?? pick(NORTH_HAIR, id, 'hc'), eyes: o.eyes ?? pick([0, 1, 1, 2, 4, 5, 6, 7, 8, 9], id, 'ey'), height: o.height ?? Math.round((sex === 'F' ? 162 : 175) + 7 * (h(id, 'ht') * 2 - 1)), ...o };
}
const cell = (look, opt, cap) => ({ look, opt, cap });
const P = (W, tier = 'L', extra = {}) => ({ W: W * 2, H: Math.round((extra.Hc ?? W) * 2), tier, view: 'three', ...extra });

export function sheets() {
  const S = [];
  // ---- faces
  {
    const men = [...Array(20)].map((_, i) => person('north-m' + i, 'M', { station: 'shirt', hair: 'cropped', beard: 'none' }));
    const women = [...Array(20)].map((_, i) => person('north-f' + i, 'F', { station: 'shirt', hair: 'bun' }));
    const cells = [...men, ...women].map((L, i) => cell(L, P(150), `${L.sex === 'M' ? 'Man' : 'Woman'} ${i % 20 + 1}, ${L.age}`));
    const six = [men[2], men[7], men[13], women[1], women[9], women[16]];
    const views = [];
    for (const L of six) for (const v of ['front', 'three', 'profile']) views.push(cell(L, P(150, 'L', { view: v }), `${L.sex === 'M' ? 'Man' : 'Woman'} ${(L.sex === 'M' ? men : women).indexOf(L) + 1}, ${v === 'three' ? 'three-quarter' : v}`));
    S.push({ id: 'faces', title: 'Faces', blurb: 'Twenty men and twenty women of one people (the North), bare-headed in one shirt, at 150 px. No two are alike: each face has three to five features pushed toward a real extreme. Below, six of them at front, three-quarter and profile, from the same model.', groups: [{ name: 'Twenty men', cells: cells.slice(0, 20), cols: 5 }, { name: 'Twenty women', cells: cells.slice(20), cols: 5 }, { name: 'Six of them, three views', cells: views, cols: 3 }] });
  }
  // ---- ages
  {
    const AG = [0, 1, 3, 6, 10, 14, 18, 30, 45, 60, 75, 90];
    const m = person('grow-m', 'M', { hair: 'sidepart', hairColor: 5, station: 'shirt', height: 176, skin: 2, eyes: 8 }), f = person('grow-f', 'F', { hair: 'braid', hairColor: 13, station: 'shirt', height: 163, skin: 1, eyes: 2 });
    const row = (L, cap) => AG.map(a => cell({ ...L, age: a, beard: a >= 30 && L.sex === 'M' ? 'short' : 'none', hair: a < 2 ? 'cropped' : L.hair }, P(120), `${cap} at ${a}`));
    const fig = AG.map(a => cell({ ...m, age: a, beard: 'none' }, { W: 120, H: 360, tier: 'L', view: 'front', crop: 'figure', brush: 0 }, `${a}`));
    const elf = [3, 10, 18, 40, 70, 90].map(a => cell(person('elf-1', 'F', { race: 'elf', age: a, hair: 'loose', hairColor: 16, station: 'shirt', skin: 0, eyes: 9 }), P(120), `Elf at ${a} (human years)`));
    const dw = [3, 10, 18, 40, 70, 90].map(a => cell(person('dwarf-1', 'M', { race: 'dwarf', age: a, hair: 'warrior', hairColor: 8, beard: a >= 18 ? 'braided' : 'none', station: 'shirt', height: 140, skin: 3 }), P(120), `Dwarf at ${a}`));
    S.push({ id: 'ages', title: 'Ages', blurb: 'One man and one woman at 0, 1, 3, 6, 10, 14, 18, 30, 45, 60, 75 and 90, the same face throughout: growth comes from the sculpted base\'s own infant, child, young and old shapes, the head on its growth curve (128 mm at birth, 225 grown), stature on the WHO medians, and the years in skin, lids, jowls and hair. Below: the man\'s stature at each age in one doorway (210 cm), and an elf and a dwarf at six ages.', groups: [{ name: 'A man', cells: row(m, 'Man'), cols: 6 }, { name: 'A woman', cells: row(f, 'Woman'), cols: 6 }, { name: 'The man\'s stature, one doorway', cells: fig, cols: 12, small: 1 }, { name: 'An elf', cells: elf, cols: 6 }, { name: 'A dwarf', cells: dw, cols: 6 }] });
  }
  // ---- scars
  {
    const vet = person('veteran', 'M', { age: 40, hair: 'soldier', hairColor: 4, station: 'shirt', skin: 2, eyes: 6, beard: 'none', wear: 0.5 });
    const kinds = [['A cut through the brow', { k: 'cut', at: 'brow_l' }], ['A broken nose', { k: 'nose', at: 'nose_l' }], ['A lost eye, the lids shut', { k: 'eye', at: 'eye_l', how: 'shut' }], ['A lost eye, under a patch', { k: 'eye', at: 'eye_l', how: 'patch' }], ['A blind eye, left open', { k: 'eye', at: 'eye_l', how: 'blind' }], ['A burn', { k: 'burn', at: 'cheek_l' }], ['The pox', { k: 'pox', at: 'cheek_l' }], ['Half an ear', { k: 'ear', at: 'ear_l' }], ['A cheekbone stove in', { k: 'dent', at: 'cheek_l' }], ['A sword cut down the cheek', { k: 'cut', at: 'cheek_l' }]];
    const SC = () => P(230, 'L', { crop: 'scar' });
    const cells = [cell(vet, SC(), 'Before, at 40'), cell(vet, P(230, 'L', { crop: 'scar', view: 'front' }), 'Before, from the front')];
    const groups = [{ name: 'The veteran before', cells, cols: 3 }];
    for (const [cap, w] of kinds) groups.push({ name: cap, cols: 3, cells: [['fresh', 40], ['a year on', 39], ['twenty years on', 20]].map(([t, wa]) => cell({ ...vet, wounds: [{ ...w, age: wa }] }, SC(), `${cap}: ${t}`)) });
    S.push({ id: 'scars', title: 'Scars', blurb: 'One veteran of 40 before and after. Each wound changes the form where it lies (the bridge set aside with a knot, the lids drawn shut and sunk, the cheekbone stove in, the upper ear gone) or the skin (a trough with raised lips, a burn\'s ridges and mottle, pits): fresh, at a year (red), and at twenty years (pale, thinner). No hair grows in a scar: see the brow.', groups });
  }
  // ---- builds
  {
    const fig = (L, cap) => cell(L, { W: 150, H: 360, tier: 'L', view: 'front', crop: 'figure', brush: 0 }, cap);
    const b = (id, o) => person(id, 'M', { hair: 'cropped', hairColor: 4, station: 'peasant', skin: 2, age: 32, beard: 'none', ...o });
    S.push({ id: 'builds', title: 'Builds', blurb: 'Height, frame and flesh, all in one doorway of 210 cm (marks at 150, 172 and 195). A head hardly grows with height, so the short man stands about seven heads and the tall one eight and a half. Then gaunt to heavy, slight to broad, and a smith beside a clerk: the smith\'s shoulders and arms, the clerk\'s soft middle.', groups: [
      { name: '150, 172 and 195 cm', cols: 3, cells: [150, 172, 195].map(hh => fig(b('ht' + hh, { height: hh }), `${hh} cm`)) },
      { name: 'Gaunt to heavy', cols: 5, cells: [-1, -0.5, 0, 0.6, 1.2].map((fa, i) => fig(b('fat' + i, { build: { fat: fa } }), ['gaunt', 'lean', 'middling', 'stout', 'heavy'][i])) },
      { name: 'Slight to broad', cols: 5, cells: [-1, -0.5, 0, 0.5, 1].map((fr, i) => fig(b('fr' + i, { build: { frame: fr } }), ['slight', 'narrow', 'middling', 'wide', 'broad'][i])) },
      { name: 'A smith and a clerk', cols: 2, cells: [fig(b('smith', { build: { muscle: 1.1, fat: 0.1, frame: 0.6 }, station: 'artisan', beard: 'short', hairColor: 2 }), 'Smith'), fig(b('clerk', { build: { muscle: -0.7, fat: 0.4, frame: -0.5 }, station: 'merchant', age: 44, hairColor: 11 }), 'Clerk')] },
    ] });
  }
  // ---- hair
  {
    const head = person('hair-head', 'F', { age: 28, hairColor: 6, skin: 1, station: 'shirt', eyes: 4 });
    const man = person('hair-man', 'M', { age: 40, hairColor: 3, skin: 2, station: 'shirt', hair: 'cropped', eyes: 6 });
    const styles = STYLES.map(s => cell({ ...head, hair: s.id }, P(120), s.name));
    const tex = ['straight', 'wavy', 'curly', 'coily'].map((t, i) => cell({ ...head, hair: 'mop', g: { ...head.g, hairTex: [-1, -0.33, 0.33, 1][i] } }, P(120), t));
    const grey = [30, 45, 60, 75].map(a => cell({ ...man, age: a, g: { ...man.g, greyOnset: -0.33 }, beard: 'short' }, P(120), `greying at ${a}`));
    const bald = [25, 40, 55, 70].map(a => cell({ ...man, age: a, hair: 'sidepart', g: { ...man.g, balding: 1, greyOnset: 1 } }, P(120), `balding at ${a}`));
    const beards = BEARDS.map(bd => cell({ ...man, beard: bd.id, g: { ...man.g, beardGrowth: 0.8 } }, P(120), bd.name));
    S.push({ id: 'hair', title: 'Hair', blurb: 'The 38 styles on one head (eight short, eight medium, eight long, ten bound, four shaped); one style in four textures; greying from the temples at 30, 45, 60 and 75; a man balding early; and the 14 kinds of facial hair. Each style is data: how thick the mass lies, where it is cut, which way it is combed, and what hangs or is bound.', groups: [{ name: 'The 38 styles', cells: styles, cols: 6 }, { name: 'One style, four textures', cells: tex, cols: 4 }, { name: 'Greying', cells: grey, cols: 4 }, { name: 'Balding', cells: bald, cols: 4 }, { name: 'Facial hair', cells: beards, cols: 6 }] });
  }
  // ---- outfits
  {
    const base = (id, sex, o) => person(id, sex, { age: 34, ...o });
    const cast = [
      ['Slave', base('o-slave', 'M', { station: 'slave', hair: 'shornslave', skin: 4, hairColor: 2, wear: 0.8 })], ['Serf', base('o-serf', 'F', { station: 'serf', hair: 'bun', hairColor: 4, wear: 0.6 })],
      ['Peasant', base('o-peasant', 'M', { station: 'peasant', hair: 'bowl', hairColor: 5, beard: 'stubble', wear: 0.5 })], ['Artisan', base('o-artisan', 'M', { station: 'artisan', hair: 'cropped', hairColor: 3, beard: 'short' })],
      ['Merchant', base('o-merchant', 'M', { station: 'merchant', hair: 'combed', hairColor: 1, age: 46 })], ['Gentry', base('o-gentry', 'M', { station: 'gentry', hair: 'sidepart', hairColor: 9 })],
      ['Noble', base('o-noble', 'F', { station: 'noble', court: 1, hair: 'crownbraid', hairColor: 13, skin: 0, house: '#2b4f86', house2: '#1d1b1d' })], ['Royal', base('o-royal', 'M', { station: 'royal', hair: 'chinlen', hairColor: 12, beard: 'short', age: 52, skin: 1 })],
      ['Levy', base('o-levy', 'M', { role: 'levy', hair: 'cropped', hairColor: 4, beard: 'stubble', wear: 0.7 })], ['Archer', base('o-archer', 'M', { role: 'archer', hair: 'soldier', hairColor: 7, wear: 0.5 })],
      ['Man in mail', base('o-mail', 'M', { role: 'infantry', hair: 'soldier', hairColor: 2, beard: 'short', wear: 0.4 })], ['Knight in plate, with his arms', base('o-knight', 'M', { role: 'knight', hair: 'combed', hairColor: 0, arms: ['#7a1b29', '#c7a14a', 'chevron'], age: 38 })],
    ];
    const big = cast.map(([n, L]) => cell(L, P(150), n));
    const small = cast.map(([n, L]) => cell(L, P(46, 'S'), n));
    const close = [
      cell(cast[10][1], { W: 300, H: 300, tier: 'L', view: 'front', center: 'chest', mmpp: 0.3 }, 'Mail: rings in rows, each its glint'),
      cell(cast[2][1], { W: 300, H: 300, tier: 'L', view: 'front', center: 'waist', mmpp: 0.35 }, 'A belt and its buckle'),
      cell(cast[6][1], { W: 300, H: 300, tier: 'L', view: 'front', center: 'neckline', mmpp: 0.4 }, 'Embroidered trim and damask'),
      cell(cast[7][1], { W: 300, H: 300, tier: 'L', view: 'front', center: 'shoulder', mmpp: 0.45 }, 'Ermine on a mantle'),
    ];
    S.push({ id: 'outfits', title: 'Outfits', blurb: 'The eight stations of the North, a levy, an archer, a man in mail and a knight in plate with his own arms, each at full size and at 46 px (the cue that must survive: the neck ring, the patches, the hood roll, the apron, the fur edge, the buttons, the fur shoulders, the ermine; the kettle hat, the fletchings, the grey mail, the bright plate). Below, close-ups of mail, a buckle, embroidery and fur.', groups: [{ name: 'At full size', cells: big, cols: 4 }, { name: 'At 46 px', cells: small, cols: 12, small: 1 }, { name: 'Close up', cells: close, cols: 4 }] });
  }
  // ---- sizes
  {
    const six = [person('north-m2', 'M', { station: 'peasant', hair: 'cropped', beard: 'none' }), person('north-f9', 'F', { station: 'noble', hair: 'crownbraid' }), person('o-knight2', 'M', { role: 'knight', hair: 'combed', hairColor: 0, arms: ['#2b4f86', '#c7a14a', 'cross'] }), person('size-old', 'F', { age: 72, station: 'serf', hair: 'bun' }), person('size-boy', 'M', { age: 9, station: 'peasant', hair: 'mop' }), person('size-vet', 'M', { age: 50, role: 'infantry', hair: 'soldier', beard: 'full', wounds: [{ k: 'cut', at: 'brow_l', age: 30 }, { k: 'nose', at: 'nose_l', age: 35 }] })];
    const sizes = [[32, 'S'], [46, 'S'], [88, 'M'], [150, 'L'], [240, 'L']];
    const groups = six.map((L, i) => ({ name: ['A peasant', 'A noblewoman', 'A knight', 'An old serf', 'A boy of nine', 'A scarred veteran'][i], cols: 5, row: 1, cells: sizes.map(([w, t]) => cell(L, P(w, t), `${w} px`)) }));
    S.push({ id: 'sizes', title: 'Sizes', blurb: 'Six people at 32, 46, 88, 150 and 240 px. The small tier frames the head closer, groups the tones and restates one thin edge; marks thinner than 1.2 px are dropped there, and only what changes a whole feature shows.', groups });
  }
  // ---- registers
  {
    const six = [person('north-m7', 'M', { station: 'peasant', hair: 'cropped' }), person('north-f1', 'F', { station: 'gentry', hair: 'loose' }), person('o-knight3', 'M', { role: 'knight', hair: 'combed', hairColor: 2, arms: ['#2f5a33', '#d8d8d4', 'bend'] }), person('reg-old', 'M', { age: 70, station: 'merchant', hair: 'fringecrown', beard: 'long' }), person('reg-girl', 'F', { age: 12, station: 'peasant', hair: 'sidebraids' }), person('reg-vet', 'M', { age: 45, role: 'archer', hair: 'soldier', wounds: [{ k: 'eye', at: 'eye_l', how: 'patch', age: 30 }] })];
    const cells = [];
    for (const L of six) { cells.push(cell(L, P(150), 'Paint')); cells.push(cell(L, P(150, 'L', { register: 'ink' }), 'Ink and flat tone')); }
    S.push({ id: 'registers', title: 'Registers', blurb: 'Six of the cast in the chosen register, paint over a lit form, beside ink and flat tone drawn from the very same model and light (three tones a colour, an ink line where a form overlaps another). The model is the same either way; only the finish differs.', groups: [{ name: 'Paint and ink, side by side', cells, cols: 4 }] });
  }
  return S;
}
