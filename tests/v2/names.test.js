import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { makeRng } from '../../src/core/engine/rng.js';
import { setNameData, hasNameData, makeNamer, sees, stockOf, poolKey, hash32, LEGACY } from '../../src/world/engine/names.js';

const DATA = JSON.parse(fs.readFileSync(new URL('../../data/names.json', import.meta.url), 'utf8'));
const CULS = Array.from({ length: 24 }, (_, i) => `CUL-${String(i + 1).padStart(2, '0')}`);
const lc = (s) => s.toLowerCase();

test('without data the namer still names (a worker, a bare module)', () => {
  setNameData(null);
  assert.equal(hasNameData(), false);
  const n = makeNamer(makeRng(1));
  for (const c of ['aldic', 'CUL-02', 'nonsense']) { assert.ok(n.given(c, 'male')); assert.ok(n.house(c)); assert.ok(n.place(c)); }
});

test('the data: one big common pool, nine others, every culture resolves to a pool with all four lists', () => {
  setNameData(DATA);
  assert.ok(DATA.common.male.length >= 1500 && DATA.common.female.length >= 1500, 'given names');
  assert.ok(DATA.common.family.length >= 4000, 'family names');
  for (const c of CULS) {
    const s = sees(c);
    for (const f of ['male', 'female', 'family', 'places']) assert.ok(s[f].length >= 40, `${c} ${f}: ${s[f].length}`);
    assert.ok(poolKey(c) === 'common' || DATA.pools[poolKey(c)], c);
  }
  // the four old keys map onto cultures
  for (const [k, id] of Object.entries(LEGACY)) assert.equal(stockOf(k).id, id);
  assert.equal(stockOf('unknown').id, 'CUL-02', 'an unknown culture falls back to the common pool');
});

test('names are plain: ASCII, 3 to 9 letters for a given name in the common pool, no markup', () => {
  for (const sx of ['male', 'female']) for (const n of DATA.common[sx]) assert.match(n, /^[A-Za-z]{2,12}$/, n);
  for (const k of Object.keys(DATA.pools)) for (const f of ['male', 'female', 'family', 'places']) for (const n of DATA.pools[k][f]) assert.match(n, /^[A-Za-z][A-Za-z' -]*$/, `${k} ${f} ${n}`);
});

test('a given name has one sex, and no given name belongs to two peoples (N11, N12)', () => {
  const seen = new Map();
  const put = (n, sx, who) => {
    const u = seen.get(lc(n));
    if (u) assert.ok(u.sx === sx && u.race === who, `${n}: ${u.sx}/${u.race} and ${sx}/${who}`);
    seen.set(lc(n), { sx, race: who });
  };
  for (const sx of ['male', 'female']) for (const n of DATA.common[sx]) put(n, sx, 'common');
  const grp = (k) => (k.startsWith('elf') ? 'elf' : k.startsWith('orc') ? 'orc' : k); // the two elf pools are one people, so are the two orc ones
  for (const [k, p] of Object.entries(DATA.pools)) for (const sx of ['male', 'female']) for (const n of p[sx]) put(n, sx, grp(k));
});

test('the same seed gives the same names; a culture draws from its own pool', () => {
  setNameData(DATA);
  const run = (seed) => { const n = makeNamer(makeRng(seed)); return CULS.flatMap((c) => [n.given(c, 'male', { realm: 'POL-01' }), n.given(c, 'female'), n.house(c), n.place(c)]); };
  assert.deepEqual(run(9), run(9));
  assert.notDeepEqual(run(9), run(10));
  // every name drawn for a non-common culture is in its pool (or its accent: there is none for these)
  const n = makeNamer(makeRng(3));
  for (const [c, key] of [['CUL-21', 'dwarf'], ['CUL-22', 'orc-horde'], ['CUL-19', 'elf-wood'], ['CUL-24', 'giant'], ['CUL-03', 'steppe']]) {
    const P = DATA.pools[key];
    for (let i = 0; i < 60; i++) { assert.ok(P.male.includes(n.given(c, 'male')), c); assert.ok(P.family.includes(n.house(c)), c); assert.ok(P.places.includes(n.place(c)), c); }
  }
});

test('realms of one people differ: a subset of the common pool per culture, a smaller one per realm, and a lean', () => {
  setNameData(DATA);
  const a = new Set(sees('CUL-02', 'POL-01').male), b = new Set(sees('CUL-02', 'POL-05').male), c = new Set(sees('CUL-01').male);
  const common = DATA.common.male.length;
  for (const s of [a, b, c]) assert.ok(s.size > common * 0.3 && s.size < common * 0.8, `a realm sees ${s.size} of ${common}`);
  const both = [...a].filter((x) => b.has(x)).length;
  assert.ok(both / a.size < 0.95 && both / a.size > 0.3, `two realms of one people share ${both}/${a.size}`);
  // the leaning realms: Northreach reaches for Norse names far more often than Aldmark does
  const count = (realm, rx) => { const n = makeNamer(makeRng(5)); let k = 0; for (let i = 0; i < 400; i++) if (rx.test(n.given('CUL-02', 'male', { realm }))) k++; return k; };
  const norse = /^(Ragnar|Bjorn|Einar|Gunnar|Halvard|Ivar|Knut|Leif|Magnus|Olaf|Sven|Ulf)$/;
  assert.ok(count('POL-08', norse) > count('POL-01', norse) + 40, 'Northreach leans Norse');
});

test('avoid: a name the caller holds is not drawn while another is to be had', () => {
  setNameData(DATA);
  const n = makeNamer(makeRng(2)), avoid = new Set(DATA.lean['POL-02'].male.slice(0, 3));
  let hits = 0;
  for (let i = 0; i < 600; i++) if (avoid.has(n.given('CUL-01', 'male', { realm: 'POL-02', avoid }))) hits++;
  assert.equal(hits, 0, `${hits} avoided names still drawn`);
});

test('the hash is fixed (the subsets must not change between machines)', () => {
  assert.equal(hash32('Thomas|CUL-02'), hash32('Thomas|CUL-02'));
  assert.equal(hash32(''), 0x811c9dc5);
  assert.equal(hash32('a'), 0xe40c292c);
});
