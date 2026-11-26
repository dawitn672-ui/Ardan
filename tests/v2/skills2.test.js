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

test('the switch (step 5): an S1 entry lands on the rung that holds it, the even level counted, and prints as a level', () => {
  for (let lv = 1; lv <= 35; lv++) {
    const c1 = S1.cost(lv);
    // nothing past the odd level's bar: the odd rung, reading S1's value (the day of the switch)
    const a = E.landed(lv, 0); assert.equal(E.value(a.rank, a.lv), S1.VALUES[lv], `S1 ${lv} at the start of its bar`);
    if (!isFinite(c1)) continue;
    const b = E.landed(lv, c1 * 0.75), r = E.rungOfS1(lv);
    if (r.rank === 'C' || r.rank === 'B' || r.rank === 'A') {
      // three quarters of an S1 step's bar is past the odd level's (the first half is cheaper: the curve rises)
      assert.equal(b.lv, r.lv + 1, `S1 ${lv}: the even level`); assert.ok(b.xp >= 0 && b.xp < E.cost(b.rank, b.lv), `S1 ${lv}: xp on the even bar`);
      assert.ok(E.value(b.rank, b.lv) > S1.VALUES[lv] && E.value(b.rank, b.lv) < S1.VALUES[lv + 1]);
      // the two levels' prices are the S1 step's, give or take the rounding of each
      assert.ok(Math.abs(E.cost(r.rank, r.lv) + E.cost(r.rank, r.lv + 1) - c1) <= 2, `S1 ${lv}: the price kept`);
    } else assert.equal(b.lv, r.lv, `S1 ${lv}: D and S one for one`);
    assert.equal(E.s1OfRung(b.rank, b.lv), lv, `S1 ${lv}: the rung stands in its step`);
  }
  assert.equal(E.label('C', 3), 'C · Lv 3'); assert.equal(E.label(null, 0), 'untried');
  assert.equal(E.s1Label(12, 0), 'C · Lv 3'); assert.equal(E.s1Label(0, 0), 'untried');
  assert.deepEqual([1, 2, 3, 4, 5, 6].map(E.gateLabel), ['D · Lv 6', 'rank C', 'rank B', 'rank A', 'rank S', 'S · Lv 6']);
  // no word of S1's in what the engines print
  const W = /\b(Beginner|Intermediate|Advanced|Expert|Master|Grandmaster|Legend)\b|\b[IV]+$/;
  for (let lv = 0; lv <= 35; lv++) assert.ok(!W.test(S1.levelName(lv)), S1.levelName(lv));
});

// ---- step 6 (D-180): the effects in play and their caps -------------------------------------------------------------
// a copy of the data with planted effects on the sword family's rungs of these ranks, at Lv 1
const planted = (effects, ranks = ['D', 'C', 'B'], vocab) => {
  const D2 = JSON.parse(JSON.stringify(D)); if (vocab) Object.assign(D2.vocab, vocab);
  for (const s of D2.skills) if (s.family === 'sword' && ranks.includes(s.rank)) s.levels = [{ at: 1, effects: s.levels[0].effects.concat(JSON.parse(JSON.stringify(effects))) }, { at: 5, effects: [] }];
  return E.index(D2);
};

test('step 6: what a person holds and what it gathers (rungs below at Lv 10, perks served apart, actives and triggers listed)', () => {
  assert.deepEqual(E.heldOfRung(IX, 'sword', 'B', 4), [{ id: 'stick_and_lath', lv: 10 }, { id: 'basic_swordsmanship', lv: 10 }, { id: 'measured_blade', lv: 4 }]);
  assert.deepEqual(E.heldOfRung(IX, 'sword', 'D', 12), [{ id: 'stick_and_lath', lv: 10 }]);
  assert.deepEqual(E.heldOfRung(IX, 'sword', 'D', 0), []);
  // today's data: only perks, so every profile is empty
  const P0 = E.profile(IX, E.heldOfRung(IX, 'sword', 'A', 10));
  assert.deepEqual([P0.edges, P0.fight, P0.resist, P0.unlocks], [{}, {}, {}, []]);
  const ix = planted([{ type: 'edge', tag: 'sword', v: 3 }, { type: 'unlock', what: 'activity:drill' }, { type: 'active', name: 'the single time', limit: '1/duel', do: { type: 'fight', tag: 'sword', part: 'burst', v: 2 } },
    { type: 'trigger', on: 'parried', do: { type: 'fight', tag: 'sword', part: 'atk', v: 1 } }]);
  const G = E.gather(ix, E.heldOfRung(ix, 'sword', 'B', 4));
  assert.equal(G.src['edge|sword'].length, 3);
  assert.deepEqual(G.unlocks, ['activity:drill']); assert.equal(G.actives.length, 3); assert.equal(G.triggers.length, 3);
  assert.ok(!Object.keys(G.src).some(k => k.startsWith('perk') || k.startsWith('fight')), 'perks, actives and triggers are not summed');
  // a later band replaces an earlier one slot by slot, and a band above the level is not held
  const D3 = JSON.parse(JSON.stringify(D)), mb = D3.skills.find(s => s.id === 'measured_blade');
  mb.levels = [{ at: 1, effects: [{ type: 'edge', tag: 'sword', v: 2 }] }, { at: 5, effects: [{ type: 'edge', tag: 'sword', v: 4 }] }, { at: 9, effects: [{ type: 'resist', of: 'fear', v: 1 }] }];
  const ix3 = E.index(D3);
  assert.deepEqual(E.gather(ix3, [{ id: 'measured_blade', lv: 6 }]).src, { 'edge|sword': [[4, 'B', 'measured_blade']] });
});

test('step 6: an edge on one check is at most +12, the sources weighed 1, 1/2, 1/4, 1/8, across every tag the check reads', () => {
  const ix = planted([{ type: 'edge', tag: 'sword', v: 4 }]);
  const G = E.gather(ix, E.heldOfRung(ix, 'sword', 'B', 1));
  assert.equal(E.edgeOn(ix, G, ['dagger', 'sword', 'all']), 4 + 2 + 1);
  assert.equal(E.edgeOn(ix, G, ['persuasion', 'all']), 0, 'another family reads none of it');
  const big = planted([{ type: 'edge', tag: 'sword', v: 1000 }, { type: 'edge', tag: 'arms', v: 4 }, { type: 'edge', tag: 'all', v: 9 }]);
  const Gb = E.gather(big, E.heldOfRung(big, 'sword', 'B', 1));
  assert.equal(E.edgeOn(big, Gb, ['sword', 'arms', 'all']), 12);
  const Pb = E.profile(big, E.heldOfRung(big, 'sword', 'B', 1));
  assert.deepEqual([Pb.edges.arms, Pb.edges.all, Pb.edges.sword], [4 + 2 + 1, 12, 12], 'the profile: each tag on its own, capped');
  // a malus counts in full, down to minus the cap
  const neg = planted([{ type: 'edge', tag: 'sword', v: -9 }]);
  assert.equal(E.edgeOn(neg, E.gather(neg, E.heldOfRung(neg, 'sword', 'B', 1)), ['sword']), -12);
  // no data can lift a human rank's cap: vocab.json tuned to 100 still gives 12
  const lifted = planted([{ type: 'edge', tag: 'sword', v: 1000 }], ['D', 'C', 'B'], { caps: Object.assign({}, D.vocab.caps, { edge: Object.fromEntries(E.RANKS.map(r => [r, 100])) }) });
  assert.equal(E.edgeOn(lifted, E.gather(lifted, E.heldOfRung(lifted, 'sword', 'B', 1)), ['sword']), 12);
  for (const [k, v] of Object.entries(E.CAP_HUMAN)) assert.ok(E.capOf(lifted, k, 'S') <= v, k);
  // above S the cap rises by rank (§15.1): an SS source lifts it to the data's 18
  const D4 = JSON.parse(JSON.stringify(D));
  D4.skills.push({ id: 'planted_ss', name: 'Planted', rank: 'SS', rarity: 'rare', kind: 'passive', category: 'arms.sword', family: null, reads: [], levels: [{ at: 1, effects: [{ type: 'edge', tag: 'sword', v: 1000 }] }] });
  const ix4 = E.index(D4);
  assert.equal(E.edgeOn(ix4, E.gather(ix4, [{ id: 'planted_ss', lv: 1 }]), ['sword']), 18);
});

test('step 6: fight at most +15% of the fighter\'s worth, the parts scaled together; blunder and surge 2 steps; resist 3', () => {
  const ix = planted([{ type: 'fight', tag: 'sword', part: 'atk', v: 6 }, { type: 'fight', tag: 'all', part: 'def', v: 4 }, { type: 'fight', tag: 'sword', part: 'burst', v: 2 }]);
  const G = E.gather(ix, E.heldOfRung(ix, 'sword', 'B', 1));
  // under the cap: each part weighed (6 + 3 + 1.5, 4 + 2 + 1, 2 + 1 + 0.5)
  const f = E.fightOn(ix, G, ['sword', 'all'], 1000);
  assert.deepEqual([f.atk, f.def, f.burst, f.total], [10.5, 7, 3.5, 21]);
  // over it: scaled to 15% of the worth, in the same proportions
  const g = E.fightOn(ix, G, ['sword', 'all'], 100);
  assert.ok(Math.abs(g.total - 15) < 1e-9 && Math.abs(g.atk / g.def - 1.5) < 1e-9, JSON.stringify(g));
  // a bow reads only what is tagged 'all'
  const b = E.fightOn(ix, G, ['bow', 'all'], 1000);
  assert.deepEqual([b.atk, b.def], [0, 7]);
  assert.equal(E.fightOn(IX, E.gather(IX, E.heldOfRung(IX, 'sword', 'A', 5)), ['sword', 'all'], 100).total, 0, 'today\'s data: nothing');
  const m = planted([{ type: 'blunder', tag: 'sword', v: 5 }, { type: 'surge', tag: 'all', v: 1 }, { type: 'resist', of: 'fear', v: 4 }, { type: 'resist', of: 'wounds', v: 1 }]);
  const Gm = E.gather(m, E.heldOfRung(m, 'sword', 'B', 1));
  assert.equal(E.stepsOn(m, Gm, 'blunder', ['sword', 'all']), 2); assert.equal(E.stepsOn(m, Gm, 'blunder', ['bow', 'all']), 0);
  assert.equal(E.stepsOn(m, Gm, 'surge', ['bow', 'all']), 1.75);
  assert.equal(E.resistOn(m, Gm, 'fear'), 3); assert.equal(E.resistOn(m, Gm, 'wounds'), 1.75); assert.equal(E.resistOn(m, Gm, 'poison'), 0);
  const P = E.profile(m, E.heldOfRung(m, 'sword', 'B', 1));
  assert.deepEqual([P.blunder.sword, P.surge.all, P.resist.fear], [2, 1.75, 3]);
  // auras: the best of each `of` and scale (two rungs at the squad, one at the army); at most 3 steps of one `of`
  const D5 = JSON.parse(JSON.stringify(D)), au = (id, scale, v) => { D5.skills.find(s => s.id === id).levels = [{ at: 1, effects: [{ type: 'aura', of: 'morale', scale, v }] }]; };
  au('stick_and_lath', 'squad', 1); au('basic_swordsmanship', 'squad', 2); au('measured_blade', 'army', 2);
  const a = E.index(D5), Pa = E.profile(a, E.heldOfRung(a, 'sword', 'B', 1));
  assert.deepEqual(Pa.auras.morale, { army: 2, squad: 2, total: 3 });
});

test('step 6: the perks the rungs carry are the release\'s knacks, at S1\'s crossings, in order', () => {
  const R = E.perkRows(IX);
  assert.equal(Object.keys(R).length, 38);
  for (const k in R) { assert.deepEqual(R[k].map(x => x[0]), [35, 55, 72], k); for (const x of R[k]) assert.ok(x[1] && x[2] && typeof x[3] === 'object', `${k} ${x[1]}: a name, a text and its effects`); }
  assert.deepEqual(R.sword[0], [35, 'Riposte', 'Guarding turns into counter-cuts', { skill: 3 }]);
  assert.equal(R.dagger[0][1], 'Inside the guard'); assert.equal(R.dagger[1][1], 'Gap-finder');
});
