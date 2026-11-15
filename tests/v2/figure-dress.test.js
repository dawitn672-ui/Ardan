// The figure library's wardrobe (C8c, D-060): a person is dressed by station, people, occasion and place; the same
// sheet always gives the same clothes; every cut, estate, occasion and headwear draws with no bad number.
import test from 'node:test';
import assert from 'node:assert/strict';
import { compose, lookOf, lookKey, kit, WEARS, CUTS, CULTURES, cultureOf, dyesFor, liveryOf, HEADWEAR, ITEMS, DYES } from '../../src/ui/engine/figure/index.js';

const ESTATES = ['slave', 'serf', 'prisoner', 'peasant', 'artisan', 'merchant', 'gentry', 'noble', 'royal', 'priest'];
const sheet = (i, o = {}) => ({ id: 'd' + i, name: '', sex: i % 2 ? 'F' : 'M', race: 'human', age: 22 + (i * 7) % 40, alive: true, estate: 'peasant', app: { skin: '#d9a77f', hair: i % 11, eye: i % 8, hstyle: ['short', 'long', 'braided', 'tied'][i % 4], beard: 'none', build: 'average' },
  gear: {}, wounds: [], traits: [], quirks: [], colors: { realm: '#3d6aa8', field: '#7a2a24', charge: '#d8c48a', device: null }, mood: 0, ...o });
const has = (L, id) => L.gear.some(g => g.id === id);

test('every culture has a row with a cut the wardrobe draws, and every estate of every culture draws in every outfit', () => {
  const ids = Object.keys(CULTURES); assert.equal(ids.length, 24);
  let n = 0;
  for (const cid of ids) {
    const c = cultureOf(cid); assert.ok(CUTS.includes(c.cut), cid); assert.equal(c.hat.length, 2);
    for (const d of c.dyes || []) assert.ok(DYES[d], cid + ' ' + d);
    for (const estate of ESTATES) for (const wear of WEARS) {
      const sh = sheet(n++, { estate, cult: c, wear, where: wear === 'travel' ? 'out' : 'in', ruler: estate === 'royal' && n % 2 === 0, rung: n % 6, married: n % 3 === 0, gear: n % 5 === 0 ? { armor: { id: 'mail' }, weapon: { id: 'sword' } } : {} });
      const L = lookOf(sh); assert.equal(lookKey(L), lookKey(lookOf(sh)));
      assert.equal(L.wear, wear); assert.equal(L.cut, c.cut);
      for (const g of L.gear) assert.ok(ITEMS[g.id], 'an item the library draws: ' + g.id);
      assert.ok(HEADWEAR[L.headwear], L.headwear);
      if (n % 7 === 0) { const s = compose(L, { crop: 'tall', width: 120, tier: 1, id: 'x_' }).svg; assert.ok(!/NaN|undefined|Infinity/.test(s), cid + ' ' + estate + ' ' + wear); assert.equal(s, compose(L, { crop: 'tall', width: 120, tier: 1, id: 'x_' }).svg); }
    }
  }
  assert.equal(cultureOf('CUL-99'), null); assert.equal(cultureOf('__proto__'), null);
  assert.equal(lookOf(sheet(1, { cult: { cut: '"><b>', hat: ['<i>', 7], dye: 'red', dyes: ['<b>'] }, wear: '<script>', where: 7, dye: '"><i>', job: {}, role: 5, livery: { field: 'javascript:1' } })).cut, 'tunic');
});

test('every new headwear and garment draws on a man, a woman and a child at three sizes', () => {
  for (const hw of ['turban', 'headwrap', 'kerchief', 'furhat', 'conehat', 'cap', 'fillet', 'mailcoif', 'armingcap']) for (const [sex, age] of [['M', 30], ['F', 40], ['M', 9]]) for (const [crop, width, tier] of [['chip', 30, 0], ['list', 64, 1], ['tall', 176, 2]]) {
    const L = { ...lookOf(sheet(3, { sex, age })), headwear: hw, headwearOpts: { dye: 'madder', band: 'ochre', jewel: '#9c1f2c', fur: 'fox', big: 1, tail: 1, tall: 1, leaves: 'sage', feathers: 'white', badge: 'gold', feather: 'white' } };
    assert.ok(!/NaN|undefined|Infinity/.test(compose(L, { crop, width, tier, id: 'x_' }).svg), hw + ' ' + crop);
  }
  const extra = [{ id: 'tunic', dye: 'teal', len: .9, neck: 'v', wrap: 1, trim: 'ochre', stripes: 'cream', open: 'white', yoke: 'mustard', hemPat: 'cream', armband: 'crimson', quilt: 2, patch: 'walnut' }, { id: 'sash', dye: 'crimson', stripe: 'ochre', fringe: 'ochre' }, { id: 'wrapcloth', dye: 'ochre', edge: 'mustard', pat: 'zig', knot: 'gold' },
    { id: 'beads', rows: 3 }, { id: 'beads', metal: 'gold', gem: '#9c1f2c' }, { id: 'beads', rows: 1, fangs: 1 }, { id: 'torc' }, { id: 'brooch', gem: '#2f5fa8' }, { id: 'brooch', throat: 1 }, { id: 'badge', field: '#2a4a7a', pale: '#d8c48a', device: 'tower' }, { id: 'badge' },
    { id: 'stole', trim: 'mustard' }, { id: 'neckcloth' }, { id: 'shawl', edge: 'cream', fringe: 1 }, { id: 'tabard', plain: 1 }, { id: 'tabard', party: 1 }];
  for (const sex of ['M', 'F']) for (const [crop, width, tier] of [['list', 64, 1], ['tall', 176, 2], ['figure', 200, 2]]) { const L = { ...lookOf(sheet(5, { sex })), gear: extra }; assert.ok(!/NaN|undefined|Infinity/.test(compose(L, { crop, width, tier, id: 'x_' }).svg)); }
});

test('station shows: each estate carries its own marks in each of the four cuts', () => {
  for (const cid of ['CUL-02', 'CUL-04', 'CUL-03', 'CUL-08']) for (let i = 0; i < 16; i++) {
    const c = cultureOf(cid), L = e => lookOf(sheet(i, { estate: e, cult: c, ...(e === 'royal' ? { ruler: true } : {}) }));
    const serf = L('serf'), art = L('artisan'), mer = L('merchant'), pr = L('priest'), ro = L('royal'), no = L('noble');
    assert.ok(serf.gear.some(g => g.id === 'belt' && g.rope), cid + ' serf: a rope belt'); assert.ok(serf.gear.find(g => g.id === 'tunic').patch || serf.gear.find(g => g.id === 'tunic').wave, cid + ' serf: patched or ragged');
    assert.ok(has(art, 'apron') || has(art, 'tool'), cid + ' artisan: the apron or the tool');
    assert.ok(mer.gear.some(g => g.id === 'pouch' && g.keys), cid + ' merchant: purse and keys');
    assert.ok(has(pr, 'amulet') && pr.gear.some(g => g.id === 'belt' && g.rope), cid + ' clergy: the sun and the cord');
    assert.equal(ro.headwear, 'crown');
    assert.ok(no.gear.some(g => g.metal === 'gold' || g.trim === 'gold' || g.knot === 'gold' || g.clasp === 'gold' || g.trim === 'mustard'), cid + ' noble: gold');
    assert.ok(!serf.gear.some(g => g.metal === 'gold' || g.keys) && serf.headwear !== 'crown');
  }
  // nobody wears above their purse
  for (let i = 0; i < 60; i++) for (const e of ['serf', 'peasant']) { const t = lookOf(sheet(i, { estate: e, cult: cultureOf('CUL-12') })).gear.find(g => g.id === 'tunic'); assert.ok(!['crimson', 'navy', 'purple', 'scarlet', 'murrey', 'black'].includes(t.dye), e + ' in ' + t.dye); }
  assert.ok(dyesFor('serf').every(d => ['undyed', 'hemp', 'cream', 'linen', 'brown'].includes(d))); assert.ok(dyesFor('noble').includes('purple')); assert.ok(!dyesFor('peasant').includes('purple'));
});

test('a soldier is marked at every rank; the rank and file of a realm share a coat; a captain wears the sash', () => {
  const coats = new Set();
  for (let rank = 0; rank < 10; rank++) for (const armor of [null, 'padded', 'leather', 'mail', 'brigandine', 'mailplate', 'plate', 'robes']) for (let i = 0; i < 4; i++) {
    const L = lookOf(sheet(i * 2, { mil: { rank, troop: 'SP' }, officer: rank >= 6, where: 'list', gear: { ...(armor ? { armor: { id: armor } } : {}), weapon: { id: 'spear' }, helm: { id: 'kettle' } } }));
    assert.ok(['kettle', 'nasal', 'mailcoif', 'armingcap'].includes(L.headwear) || L.gear.some(g => ['mailcollar', 'gorget', 'pauldrons'].includes(g.id) || (g.id === 'padding' && g.quilt > 1)), `rank ${rank} in ${armor}`);
    const tab = L.gear.find(g => g.id === 'tabard'); if (tab && rank < 4) coats.add([tab.field, tab.pale, tab.plain, tab.party].join());
    if (rank >= 4 && armor && armor !== 'padded' && armor !== 'robes') assert.ok(has(L, 'sash') || L.gear.some(g => g.id === 'belt'), 'girt');
    if (rank >= 4) assert.equal(L.headwear, 'none', 'a captain is bare-headed');
    assert.equal(L.livery, true);
  }
  assert.equal(coats.size, 1);
  assert.deepEqual(liveryOf('#3d6aa8'), liveryOf('#3d6aa8'));
  // the player's helm is off
  assert.equal(lookOf(sheet(2, { pc: true, mil: { rank: 0, troop: 'SP' }, gear: { armor: { id: 'padded' }, helm: { id: 'kettle' } } })).headwear, 'none');
});

test('only a livery is shared: retainers wear the house\'s coat, and 600 others are each dressed their own way', () => {
  const liv = { field: '#2a4a7a', charge: '#d8c48a', device: 'tower' };
  const g1 = lookOf(sheet(2, { estate: 'gentry', role: 'guard', livery: liv, gear: { armor: { id: 'mail' }, weapon: { id: 'sword' } } })), g2 = lookOf(sheet(4, { estate: 'gentry', role: 'guard', livery: liv, gear: { armor: { id: 'mail' }, weapon: { id: 'sword' } } }));
  const t1 = g1.gear.find(g => g.id === 'tabard'), t2 = g2.gear.find(g => g.id === 'tabard');
  assert.deepEqual(t1, t2); assert.equal(t1.field, '#2a4a7a'); assert.equal(t1.device, 'tower'); assert.ok(g1.livery);
  const m1 = lookOf(sheet(1, { role: 'maid', livery: liv })), m2 = lookOf(sheet(3, { role: 'maid', livery: liv }));
  assert.equal(m1.gear.find(g => g.id === 'tunic').dye, '#2a4a7a'); assert.equal(m2.gear.find(g => g.id === 'tunic').dye, '#2a4a7a'); assert.ok(has(m1, 'badge') && has(m1, 'apron'));
  for (const cid of ['CUL-02', 'CUL-04', 'CUL-03', 'CUL-08']) for (const estate of ['serf', 'peasant', 'artisan', 'merchant', 'noble']) {
    const seen = new Set();
    for (let i = 0; i < 30; i++) { const L = lookOf(sheet(i * 2, { id: cid + estate + i, estate, cult: cultureOf(cid) })); assert.ok(!L.livery); seen.add(JSON.stringify(L.gear)); }
    assert.equal(seen.size, 30, cid + ' ' + estate + ': ' + seen.size + ' outfits on 30 men');
  }
});

test('hoods: never raised in a list or under a roof; on the road, out of doors, some are', () => {
  let out = 0;
  for (let i = 0; i < 400; i++) for (const estate of ['serf', 'peasant', 'artisan']) {
    const base = { id: 'h' + estate + i, estate, cult: cultureOf(i % 2 ? 'CUL-02' : 'CUL-18') };
    for (const where of ['list', 'in']) for (const wear of WEARS) assert.notEqual(lookOf(sheet(i, { ...base, where, wear })).headwear, 'hood');
    if (lookOf(sheet(i, { ...base, where: 'out', wear: 'travel' })).headwear === 'hood') out++;
  }
  assert.ok(out > 100 && out < 900, 'raised on the road: ' + out + ' of 1200');
});

test('occasions: a harness is put off for a feast and for mourning, mourning is dark, the road has a cloak, the chosen dye is worn', () => {
  for (let i = 0; i < 20; i++) {
    const kn = w => lookOf(sheet(i * 2, { estate: 'noble', rung: 5, wear: w, gear: { armor: { id: 'plate' }, weapon: { id: 'longsword' }, shield: { id: 'heater' } } }));
    assert.ok(has(kn('day'), 'breastplate') && has(kn('arms'), 'breastplate') && has(kn('travel'), 'breastplate'));
    for (const w of ['best', 'mourning', 'work']) { assert.ok(!has(kn(w), 'breastplate'), w); assert.ok(!has(kn(w), 'shield')); }
    assert.ok(has(kn('best'), 'sword'), 'a knight keeps his sword at a feast');
    const pe = w => lookOf(sheet(i, { estate: 'peasant', wear: w, where: w === 'travel' ? 'out' : 'in', gear: { weapon: { id: 'spear' } } }));
    assert.ok(has(pe('travel'), 'cloak')); assert.ok(!has(pe('best'), 'apron')); assert.equal(pe('best').staff, null, 'no spear at a feast');
    assert.ok(['charcoal', 'walnut', 'grey', 'black'].includes(pe('mourning').gear.find(g => g.id === 'tunic').dye));
    assert.equal(lookOf(sheet(i, { estate: 'artisan', dye: 'teal' })).gear.filter(g => g.id === 'tunic').some(g => g.dye === 'teal'), true);
    assert.notEqual(lookOf(sheet(i, { estate: 'serf', dye: 'purple' })).gear.find(g => g.id === 'tunic').dye, 'purple');
  }
  assert.deepEqual(kit(sheet(1), { male: true, age: 30, id: 'k' }), kit(sheet(1), { male: true, age: 30, id: 'k' }));
});
