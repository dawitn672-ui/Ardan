// Skills rebuild, step 1 (docs/design/skills-v2.md §2.7, §10): the data in data/skills/ passes the validator's ten
// checks, and each check fails on a fault planted in a copy of it.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSkills2, validate } from '../../tools/lib/skills2-check.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const S1 = JSON.parse(fs.readFileSync(path.join(root, 'data/skills.json'), 'utf8'));
const fresh = () => JSON.parse(JSON.stringify(loadSkills2(root)));
const by = (D, id) => D.skills.find(s => s.id === id);
const checks = (D, opt) => validate(D, opt).map(e => e.check);
const SPEC = () => ({ cooldown: null, cost: null, effect: null, duration: null, conditions: [] });
const named = (o) => Object.assign({ rarity: 'basic', kind: 'passive', category: 'mind.focus', family: null, reads: [], levels: [{ at: 1, effects: [] }],
  acquire: [{ via: 'practice' }], transfer: { teach: 'any' }, spec: SPEC(), text: 'A planted skill.' }, o);

test('the data passes every check', () => {
  const D = fresh(), errs = validate(D, { s1: S1 });
  assert.deepEqual(errs, []);
  assert.equal(D.families.families.length, 28);
  assert.equal(D.skills.length, 194, '28 families x (D, C, B, A and the common S rung), the first eight merge results (step 8) and the first 46 arts of the three kinds (step 11, D-186)');
  assert.equal(D.recipes.length, 8);
  // every rung carries the full specification's fields (§15.6), without range (the owner, 2026-11-25)
  for (const s of D.skills) { assert.deepEqual(Object.keys(s.spec).sort(), ['conditions', 'cooldown', 'cost', 'duration', 'effect']); }
  // the release's 114 perk rows ride on the C, B and A rungs, once each
  const legacy = D.skills.flatMap(s => s.levels.flatMap(b => b.effects.filter(e => e.type === 'perk').map(e => e.legacy)));
  assert.equal(legacy.length, 114); assert.equal(new Set(legacy).size, 114);
  // no S1 measure word is left on a concept
  for (const f of D.families.families) for (const c of f.concepts) { assert.equal(c.word, undefined); assert.ok(c.opens && c.opens.rank); }
});

test('check 1, schema: a bad rank, a long text, a spec without a field, a range', () => {
  let D = fresh(); by(D, 'measured_blade').rank = 'Z'; assert.ok(checks(D).includes(1));
  D = fresh(); by(D, 'measured_blade').text = 'word '.repeat(41); assert.ok(checks(D).includes(1));
  D = fresh(); delete by(D, 'measured_blade').spec.cooldown; assert.ok(checks(D).includes(1));
  D = fresh(); by(D, 'measured_blade').spec.range = { v: 3, unit: 'yards' }; assert.ok(validate(D).some(e => e.check === 1 && /no range/.test(e.msg)));
  D = fresh(); by(D, 'measured_blade').spec.reach = 'strikes a man two spears off'; assert.deepEqual(checks(D), [], 'a reach note is allowed');
  D = fresh(); D.skills.push(Object.assign({}, by(D, 'measured_blade'))); assert.ok(checks(D).includes(1), 'an id twice');
});

test('check 2, references: a concept, a deed and a tag that do not exist', () => {
  let D = fresh(); by(D, 'basic_swordsmanship').acquire[0].needs.concept = ['sword:no-such']; assert.ok(checks(D).includes(2));
  D = fresh(); by(D, 'measured_blade').acquire[0].needs.deed.kind = 'slew_a_dragon'; assert.ok(checks(D).includes(2));
  D = fresh(); by(D, 'measured_blade').levels[0].effects.push({ type: 'edge', tag: 'nowhere', v: 1 }); assert.ok(checks(D).includes(2));
  D = fresh(); by(D, 'measured_blade').levels[0].effects.push({ type: 'fight', tag: 'music', part: 'atk', v: 1 }); assert.ok(checks(D).includes(2), 'music is no weapon');
});

test('check 3, the budget: example 6 of §9.2 is refused at Lv 1 and passes with its active at Lv 2', () => {
  const fx = [{ type: 'fight', tag: 'sword', part: 'atk', v: 3 }, { type: 'active', name: 'The Single Time', cost: 'stamina', limit: '1/duel', do: { type: 'surge', tag: 'sword', v: 1 } }];
  let D = fresh(); by(D, 'long_edge_master').levels = [{ at: 1, effects: fx }];
  assert.ok(validate(D).some(e => e.check === 3 && /Lv 1 spends 9 of a budget of 8/.test(e.msg)));
  D = fresh(); by(D, 'long_edge_master').levels = [{ at: 1, effects: [fx[0]] }, { at: 2, effects: [fx[1]] }];
  assert.deepEqual(checks(D), []);
  // a flaw must spend at least its budget
  D = fresh(); D.skills.push(named({ id: 'weak_flaw', name: 'Weak Flaw', rank: 'B', kind: 'flaw', category: 'flaw.nerve', levels: [{ at: 1, effects: [{ type: 'social', group: 'soldiers', v: -5 }] }] }));
  assert.ok(checks(D).includes(3));
});

test('check 4, stats apart: a stat on a passive is refused, on a blessing allowed', () => {
  let D = fresh(); by(D, 'measured_blade').levels.push({ at: 5, effects: [{ type: 'stat', stat: 'str', v: 1 }] }); assert.ok(checks(D).includes(4));
  D = fresh(); D.skills.push(named({ id: 'small_grace', name: 'Small Grace', rank: 'C', rarity: 'epic', census: 'one', kind: 'blessing', category: 'faith.blessing', levels: [{ at: 1, effects: [] }, { at: 2, effects: [{ type: 'stat', stat: 'wil', v: 1 }] }] }));
  assert.deepEqual(checks(D).filter(c => c === 4), []);
});

test('check 5, ladders whole: a missing rung, a broken step, a key S1 names that resolves to nothing', () => {
  let D = fresh(); D.skills = D.skills.filter(s => s.id !== 'measured_blade'); assert.ok(checks(D).includes(5));
  D = fresh(); by(D, 'basic_swordsmanship').evolvesTo = []; assert.ok(checks(D).includes(5));
  D = fresh(); D.families.families.find(f => f.id === 'bow').legacy = ['xbow']; assert.ok(checks(D, { s1: S1 }).includes(5), 'throwing lost');
});

test('check 6, reachable: a skill no route opens', () => {
  let D = fresh(); D.skills.push(named({ id: 'lost_art', name: 'Lost Art', rank: 'C', acquire: [{ via: 'evolve', from: 'lost_art_root' }] }));
  D.skills.push(named({ id: 'lost_art_root', name: 'Lost Root', rank: 'D', acquire: [{ via: 'evolve', from: 'lost_art' }], evolvesTo: [{ id: 'lost_art' }] }));
  assert.ok(checks(D).includes(6));
  // a ladder rung only a culture opens is closed to "every newborn"
  D = fresh(); by(D, 'stick_and_lath').acquire = [{ via: 'culture', needs: { culture: ['CUL-03'] } }]; assert.ok(checks(D).includes(6));
});

test('check 7, no loops: a rung that evolves back down, a route that needs what comes after it', () => {
  let D = fresh(); by(D, 'long_edge_master').evolvesTo.push({ id: 'stick_and_lath' }); assert.ok(checks(D).includes(7));
  D = fresh(); by(D, 'basic_swordsmanship').acquire[0].needs.skill = { measured_blade: { lv: 1 } }; assert.ok(checks(D).includes(7));
});

test('check 8, up never down: an evolution two ranks up, a merge result below its parts', () => {
  let D = fresh(); by(D, 'stick_and_lath').evolvesTo.push({ id: 'measured_blade' }); assert.ok(checks(D).includes(8));
  D = fresh(); D.recipes.push({ id: 'down', kind: 'known', parts: [{ id: 'measured_blade', lv: 7 }, { id: 'fleet_fighter', lv: 7 }], result: 'basic_archery' });
  assert.ok(checks(D).includes(8));
});

test('check 8, merges (step 8, D-182): only level-10 parts of different families, a result reading them all, one recipe a result', () => {
  const plant = f => { const D = fresh(); f(D); return validate(D).filter(e => e.check === 8).map(e => e.msg); };
  assert.ok(plant(D => { D.recipes[0].parts[0].lv = 7; }).some(m => /only a level-10 skill merges/.test(m)));
  assert.ok(plant(D => { D.recipes[0].parts[1] = { id: 'stick_and_lath', lv: 10 }; }).some(m => /both read sword/.test(m)));
  assert.ok(plant(D => { by(D, 'sword_and_buckler').reads = ['sword']; }).some(m => /does not read shield/.test(m)));
  assert.ok(plant(D => { D.recipes.push(Object.assign({}, D.recipes[0], { id: 'again' })); }).some(m => /make the same/.test(m)));
  assert.ok(plant(D => { D.recipes[0].result = 'measured_blade'; }).some(m => /ladder's rung|no merge route/.test(m)));
  assert.ok(plant(D => { D.recipes[6].moment = 'a fair day'; }).some(m => /moment/.test(m)));
  // a merge that feeds back into its own parts is a loop (check 7)
  const D = fresh(); by(D, 'sword_and_buckler').evolvesTo = [{ id: 'basic_swordsmanship' }];
  assert.ok(checks(D).includes(7));
});

test('check 9, shares: a library of 200 that is all D fails; a legendary without a census fails', () => {
  let D = fresh();
  for (let i = 0; i < 70; i++) D.skills.push(named({ id: 'filler_' + i, name: 'Filler ' + i, rank: 'D' }));
  assert.ok(validate(D).some(e => e.check === 9 && /rank D/.test(e.msg)));
  D = fresh(); by(D, 'edge_beyond_teaching').rarity = 'legendary'; assert.ok(checks(D).includes(9));
  D = fresh(); by(D, 'edge_beyond_teaching').rarity = 'uncommon'; assert.ok(checks(D).includes(1), 'a word of no ladder (D-200)');
});

test('check 10, names: a level word as a level, and a denied name', () => {
  let D = fresh(); by(D, 'measured_blade').name = 'Swordsmanship Expert II'; assert.ok(checks(D).includes(10));
  D = fresh(); by(D, 'measured_blade').name = 'Sword Master'; assert.ok(checks(D).includes(10));
  D = fresh(); by(D, 'measured_blade').name = 'Great Sage of Blades'; assert.ok(checks(D).includes(10));
  D = fresh(); by(D, 'measured_blade').name = 'Master of Blades'; assert.deepEqual(checks(D), [], '"Master" may stand in a name (§15.3)');
});
