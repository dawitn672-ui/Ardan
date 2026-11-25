// Skills rebuild, step 2 (docs/design/skills-v2.md §3, §2.4, §10; §15): the pure engine, src/people/engine/skills2.js.
// The bands sit on S1's values, the costs are S1's, the budget doubles past S (SS 32, SSS 64), the caps weigh and bind
// and rise by rank, the needs of a route are read, evolution keeps the old skill, a merge absorbs its parts, an advance
// is once a life, and the data's graph of evolution and merging has no loop.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as E from '../../src/people/engine/skills2.js';
import * as S1 from '../../src/people/engine/skills.js';
import { loadSkills2 } from '../../tools/lib/skills2-check.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
S1.setData(JSON.parse(fs.readFileSync(path.join(root, 'data/skills.json'), 'utf8')));
const D = loadSkills2(root), IX = E.index(D);

test('band values equal S1\'s VALUES: every S1 level is a rung that reads the same, and back', () => {
  assert.deepEqual(E.S1_VALUES, S1.VALUES);
  for (let lv = 1; lv <= 35; lv++) {
    const r = E.rungOfS1(lv);
    assert.equal(E.value(r.rank, r.lv), S1.value(lv), `S1 ${lv} -> ${r.rank} ${r.lv}`);
    assert.equal(E.s1OfRung(r.rank, r.lv), lv);
    assert.deepEqual(E.rungOfValue(S1.value(lv)), r, 'an NPC\'s number lands on the odd level of its step');
  }
  // §3.1's table, rounded as the design prints it
  assert.deepEqual(E.BANDS.D.map(Math.round), [1, 4, 7, 9, 12, 15, 19, 23, 27, 31]);
  assert.deepEqual(E.BANDS.C, [35, 37, 39, 41, 43, 45, 47, 49, 51, 53]);
  assert.deepEqual(E.BANDS.S.map(Math.round), [88, 90, 91, 93, 94, 96, 97, 98, 99, 100]);
  assert.equal(Math.round(E.value('B', 10) * 10) / 10, 70.3); assert.equal(Math.round(E.value('A', 10) * 10) / 10, 86.4);
  // above S: off the human scale, the top of it
  for (const r of ['SS', 'SSS', 'X']) assert.equal(E.value(r, 1), 100);
  assert.equal(E.value('D', 0), 0); assert.equal(E.rungOfValue(0.5), null);
  // a focus shifts by S1 steps exactly as S1 did (two up, one down)
  for (let lv = 1; lv <= 35; lv++) { const r = E.rungOfS1(lv); for (const st of [2, -1]) assert.equal(E.shifted(r.rank, r.lv, st), S1.value(Math.max(1, Math.min(35, lv + st)))); }
});

test('costs equal S1\'s: D and S one for one, C, B and A two levels to a step, totals the same', () => {
  assert.equal(E.cost('D', 0), S1.cost(0));
  for (let l = 1; l <= 10; l++) assert.equal(E.cost('D', l), S1.cost(l));
  for (const [r, b] of [['C', 10], ['B', 15], ['A', 20]]) for (let s = 1; s <= 5; s++) assert.ok(Math.abs(E.cost(r, 2 * s - 1) + E.cost(r, 2 * s) - S1.cost(b + s)) <= 1, `${r} step ${s}`);
  for (let l = 1; l <= 9; l++) assert.equal(E.cost('S', l), S1.cost(25 + l));
  assert.ok(Math.abs(E.totalTo('A', 1) - S1.totalTo(21)) <= 10);
  assert.equal(E.totalTo('C', 1), S1.totalTo(11));
  // above S each rank's levels cost twice the one below's
  assert.equal(E.cost('SS', 3), 2 * E.cost('S', 3)); assert.equal(E.cost('SSS', 3), 4 * E.cost('S', 3));
  assert.equal(E.cost('Z', 1), Infinity);   // an unknown rank (X is the rank above SSS since order 83)
});

test('S1 entries become rungs: the read is S1\'s, no experience is lost', () => {
  for (let lv = 1; lv <= 35; lv++) for (const share of [0, 0.3, 0.5, 0.9]) {
    const xp = lv < 35 ? share * S1.cost(lv) : 0, r = E.fromS1(lv, xp);
    assert.equal(E.value(r.rank, r.lv), S1.value(lv));
    assert.ok(Math.abs(r.xp + (r.held || 0) - xp) < 0.02, `S1 ${lv} at ${share}`);
    assert.ok(r.xp < E.cost(r.rank, r.lv), 'the bar never overflows');
  }
  assert.equal(E.fromS1(0, 5), null);
});

test('talent reach (S1\'s letters through the bands)', () => {
  assert.equal(E.pastReach('C', 'B', 10), false); assert.equal(E.pastReach('C', 'A', 1), true);
  assert.equal(E.pastReach('F', 'D', 9), false); assert.equal(E.pastReach('F', 'D', 10), true);
  assert.equal(E.pastReach('SSS', 'S', 10), false);
});

test('the budget: D 1 to S 16 a level, SS 32 and SSS 64 (§15.1), rarity\'s share from unique up; the design\'s examples cost what it says', () => {
  const sk = (rank, rarity = 'common') => ({ rank, rarity });
  assert.deepEqual(['D', 'C', 'B', 'A', 'S', 'SS', 'SSS', 'X'].map(r => E.budget(IX, sk(r), 1)), [1, 2, 4, 8, 16, 32, 64, 128]);
  assert.equal(E.budget(IX, sk('A', 'unique'), 1), 10); assert.equal(E.budget(IX, sk('S', 'legendary'), 2), 48); assert.equal(E.budget(IX, sk('B', 'rare'), 3), 12);
  const c = e => E.effectCost(IX, e);
  assert.equal(c({ type: 'edge', tag: 'persuasion:the-bargain', v: 2 }), 2);      // a focus: narrow
  assert.equal(c({ type: 'edge', tag: 'persuasion', v: 3 }), 6);                  // a family
  assert.equal(c({ type: 'edge', tag: 'arms', v: 1 }), 4);                        // a group
  assert.equal(c({ type: 'fight', tag: 'sword', part: 'atk', v: 3 }), 6); assert.equal(c({ type: 'fight', tag: 'all', part: 'def', v: 1 }), 4);
  assert.equal(c({ type: 'trigger', on: 'wounded', do: { type: 'resist', of: 'fear', v: 1 } }), 1.5);
  assert.equal(c({ type: 'trigger', on: 'ambushed', do: { type: 'resist', of: 'fear', v: 1 } }), 0.75);
  assert.equal(c({ type: 'active', name: 'x', limit: '1/duel', do: { type: 'surge', tag: 'sword', v: 1 } }), 3);
  assert.equal(c({ type: 'active', name: 'x', limit: '1/year', do: { type: 'aura', of: 'morale', scale: 'army', v: 2 } }), 6);
  assert.equal(c({ type: 'social', group: 'soldiers', v: -10 }), 4); assert.equal(c({ type: 'stat', stat: 'wil', v: 3 }), 12);
  assert.equal(c({ type: 'perk', key: 'sword', name: 'x', legacy: 'perk:sword:40' }), 0);
  // a later band replaces an earlier effect of the same slot (example 9: [3/4], [9/16], [18/32])
  const gl = { rank: 'B', rarity: 'rare', kind: 'aura', levels: [
    { at: 1, effects: [{ type: 'aura', of: 'morale', scale: 'squad', v: 1 }] },
    { at: 4, effects: [{ type: 'aura', of: 'morale', scale: 'company', v: 1 }, { type: 'aura', of: 'discipline', scale: 'squad', v: 1 }] },
    { at: 8, effects: [{ type: 'aura', of: 'morale', scale: 'company', v: 2 }, { type: 'aura', of: 'discipline', scale: 'company', v: 1 }] }] };
  assert.deepEqual([1, 4, 8].map(l => E.spendAt(IX, gl, l)), [3, 9, 18]);
  assert.deepEqual(E.budgetFaults(IX, gl), []);
  assert.equal(E.effectsAt(gl, 3).length, 1); assert.equal(E.effectsAt(gl, 10).length, 2);
});

test('the caps: largest first, weighed 1, 1/2, 1/4, 1/8, bound by the cap, which rises past S', () => {
  assert.equal(E.stack([4, 8, 2], 12), 8 + 2 + 0.5);
  assert.equal(E.stack([10, 10, 10, 10, 10], 12), 12);
  assert.equal(E.stack([6, -3], 12), 3); assert.equal(E.stack([-20], 12), -12);
  assert.equal(E.capOf(IX, 'edge', 'B'), 12); assert.equal(E.capOf(IX, 'edge', 'SS'), 18); assert.equal(E.capOf(IX, 'edge', 'SSS'), 24);
  assert.equal(E.capOf(IX, 'fightShare', 'A'), 0.15); assert.ok(E.capOf(IX, 'fightShare', 'SSS') > E.capOf(IX, 'fightShare', 'SS'));
  for (const k of ['edge', 'fightShare', 'aura', 'blunderSurge', 'resist', 'growth', 'stat']) for (let i = 1; i < E.RANKS.length; i++) assert.ok(E.capOf(IX, k, E.RANKS[i]) >= E.capOf(IX, k, E.RANKS[i - 1]), `${k} never falls with rank`);
  assert.equal(E.topRank(['C', 'SS', 'A']), 'SS');
});

test('needs: each kind is read; not inverts', () => {
  const f = { stat: { spd: 50 }, family: { sword: 60 }, skills: { measured_blade: { lv: 7 } }, age: 31, culture: 'CUL-03', concepts: ['sword:the-measure'],
    deeds: [{ kind: 'won_vs', rank: 'A' }, { kind: 'battle_survived' }, { kind: 'battle_survived' }], flags: { solstice: 1 }, talent: { command: 'A' }, fame: 40, teacher: n => n.rank === 'B', months: 12 };
  assert.deepEqual(E.missing({ stat: { spd: 45 }, family: { sword: 55 }, skill: { measured_blade: { lv: 7 } }, age: [25, 99], culture: ['CUL-03'], concept: ['sword:the-measure'],
    deed: { kind: 'won_vs', rank: 'B' }, flag: 'solstice', talent: { command: 'B' }, fame: 30, teacher: { rank: 'B' }, months: 12 }, f), []);
  assert.deepEqual(E.missing({ deed: { kind: 'battle_survived', n: 3 } }, f), ['deed:battle_survived']);
  assert.deepEqual(E.missing({ deed: { kind: 'won_vs', rank: 'S' } }, f), ['deed:won_vs']);
  assert.deepEqual(E.missing({ age: [40, 99], concept: ['sword:the-bind'], teacher: { rank: 'A' } }, f), ['age', 'concept:sword:the-bind', 'teacher']);
  assert.deepEqual(E.missing({ not: { culture: 'CUL-03' } }, f), ['not']);
  assert.deepEqual(E.missing({ talent: { command: 'S' } }, f), ['talent:command']);
  assert.deepEqual(E.missing({ wings: 1 }, f), ['unknown:wings']);
});

test('evolution: only at Lv 10 with its route\'s conditions; the old skill stays beside the new one (§15.2)', () => {
  const facts = { skills: { basic_swordsmanship: { lv: 10 } }, concepts: ['sword:the-measure', 'sword:the-bind'], deeds: [{ kind: 'proved', rank: 'B' }] };
  const [r] = E.canEvolve(IX, { id: 'basic_swordsmanship', lv: 10 }, facts);
  assert.deepEqual(r, { to: 'measured_blade', ok: true, missing: [] });
  assert.deepEqual(E.canEvolve(IX, { id: 'basic_swordsmanship', lv: 9 }, facts)[0].missing, ['level']);
  assert.deepEqual(E.canEvolve(IX, { id: 'basic_swordsmanship', lv: 10 }, Object.assign({}, facts, { deeds: [] }))[0].missing, ['deed:proved']);
  assert.ok(E.canEvolve(IX, { id: 'basic_swordsmanship', lv: 10 }, Object.assign({}, facts, { concepts: [] }))[0].missing.includes('concept:sword:the-measure'));
  const t = { basic_swordsmanship: { lv: 10, xp: 0 } };
  E.evolve(t, 'basic_swordsmanship', 'measured_blade', 40);
  assert.deepEqual(Object.keys(t).sort(), ['basic_swordsmanship', 'measured_blade']);
  assert.equal(t.basic_swordsmanship.lv, 10); assert.equal(t.measured_blade.lv, 1);
  // the family reads the best of what it holds: the new rung, from its first level
  assert.equal(E.familyRead(IX, Object.entries(t).map(([id, e]) => Object.assign({ id }, e)), 'sword'), 55);
  assert.equal(E.familyRead(IX, [{ id: 'measured_blade', lv: 1, rust: 3 }], 'sword'), 52);
  assert.equal(E.familyRead(IX, [{ id: 'measured_blade', lv: 1 }], 'bow'), 0);
});

test('merging absorbs its parts and keeps their read as a floor; advancing is once a life at a named moment', () => {
  const ix = E.index(Object.assign({}, D, { skills: D.skills.concat([{ id: 'riverwind_form', name: 'Riverwind Form', rank: 'A', rarity: 'rare', kind: 'active', category: 'arms.sword', family: null, reads: ['sword', 'melee'], levels: [{ at: 1, effects: [] }], acquire: [{ via: 'merge', recipe: 'riverwind' }], transfer: { teach: 'culture' } }]),
    recipes: [{ id: 'riverwind', kind: 'known', parts: [{ id: 'measured_blade', lv: 7 }, { id: 'fleet_fighter', lv: 7 }], result: 'riverwind_form' }] }));
  const R = ix.RECIPE.riverwind;
  const facts = { skills: { measured_blade: { lv: 7 }, fleet_fighter: { lv: 8 } }, knows: id => id === 'riverwind' };
  assert.deepEqual(E.canMerge(ix, R, facts), { ok: true, missing: [] });
  assert.deepEqual(E.canMerge(ix, R, Object.assign({}, facts, { knows: () => false })).missing, ['known']);
  assert.deepEqual(E.canMerge(ix, R, { skills: { measured_blade: { lv: 6 }, fleet_fighter: { lv: 8 } }, knows: () => true }).missing, ['part:measured_blade']);
  const t = { measured_blade: { lv: 7 }, fleet_fighter: { lv: 8 }, basic_swordsmanship: { lv: 10 } };
  E.merge(ix, t, R);
  assert.deepEqual(Object.keys(t).sort(), ['basic_swordsmanship', 'riverwind_form'], 'the parts are gone into it');
  assert.equal(t.riverwind_form.floor, E.value('B', 8));
  const read = E.familyRead(ix, Object.entries(t).map(([id, e]) => Object.assign({ id }, e)), 'melee');
  assert.equal(read, E.value('A', 1), 'an A result reads its own level, above its parts');
  assert.equal(E.familyRead(ix, [{ id: 'riverwind_form', lv: 1, floor: 90 }], 'sword'), 90, 'nobody\'s odds fall when they merge: the floor holds');
  // advancing
  const a = E.canAdvance(IX, { id: 'footwork', lv: 5 }, { skills: { footwork: { lv: 5 } }, moment: 'near_death', advances: 0 });
  assert.deepEqual(a, { ok: true, missing: [], to: 'fleet_fighter' });
  assert.deepEqual(E.canAdvance(IX, { id: 'footwork', lv: 5 }, { moment: 'near_death', advances: 1 }).missing, ['once']);
  assert.deepEqual(E.canAdvance(IX, { id: 'footwork', lv: 4 }, { moment: 'a fair day', advances: 0 }).missing, ['level', 'moment']);
});

test('the data\'s graph of evolution and merging is acyclic; a planted loop is found', () => {
  const G = E.graph(IX);
  assert.equal(E.findCycle(G), null);
  assert.ok(E.descendants(G, 'stick_and_lath').has('edge_beyond_teaching'));
  assert.equal(E.descendants(G, 'edge_beyond_teaching').size, 0);
  G.get('edge_beyond_teaching') || G.set('edge_beyond_teaching', new Set());
  G.get('edge_beyond_teaching').add('stick_and_lath');
  const c = E.findCycle(G);
  assert.ok(c && c[0] === c[c.length - 1] && c.includes('measured_blade'));
});

test('the index: every family has its ladder, the ten legacy keys read their family', () => {
  assert.equal(Object.keys(IX.RUNG).length, 28);
  for (const f in IX.RUNG) assert.deepEqual(Object.keys(IX.RUNG[f]).sort(), ['A', 'B', 'C', 'D', 'S']);
  assert.equal(E.famOf(IX, 'xbow'), 'bow'); assert.equal(E.famOf(IX, 'sword'), 'sword'); assert.equal(E.famOf(IX, 'nothing'), null);
  assert.equal(Object.keys(IX.LEG).length, 10);
  assert.equal(E.rungOf(IX, 'sword', 'B'), 'measured_blade');
});
