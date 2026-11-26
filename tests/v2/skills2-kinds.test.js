// Skills rebuild, step 11 (docs/design/skills-v2.md §3.5, §10, §16; the owner's order 92; D-186): the three kinds of skill,
// active, passive and buff, in the pure engine (src/people/engine/skills2.js §11) and the data (data/skills/kinds/).
// sk2Kinds: the validator's check 11 refuses a malformed art of each kind.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as E from '../../src/people/engine/skills2.js';
import { loadSkills2, validate } from '../../tools/lib/skills2-check.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const fresh = () => JSON.parse(JSON.stringify(loadSkills2(root)));
const D0 = fresh(), IX = E.index(D0);
const ARTS = D0.skills.filter(E.isArt);
const by = (D, id) => D.skills.find(s => s.id === id);
const checks11 = D => validate(D).filter(e => e.check === 11).map(e => e.msg);

test('the first library: at least 40 arts of the three kinds, each whole, inside its budget, with routes', () => {
  const n = k => ARTS.filter(s => s.kind === k).length;
  assert.ok(ARTS.length >= 40, `${ARTS.length} arts`);
  assert.ok(n('active') >= 15 && n('passive') >= 10 && n('buff') >= 8, `active ${n('active')}, passive ${n('passive')}, buff ${n('buff')}`);
  assert.deepEqual(validate(D0), []);
  for (const s of ARTS) {
    assert.deepEqual(E.kindFaults(IX, s), [], s.id);
    assert.deepEqual(E.budgetFaults(IX, s), [], s.id);
    assert.equal(s.family, null, s.id + ': no family rung');
    // fully specified (§15.6): a cooldown and a cost for every active and buff, an effect and conditions for all
    if (s.kind !== 'passive') { assert.ok(s.spec.cooldown && s.spec.cost.length, s.id); assert.equal(s.slot, true, s.id); }
    assert.ok(s.spec.effect && Array.isArray(s.spec.conditions), s.id);
    assert.ok(!('range' in s.spec), s.id + ': no range (order 83)');
    // routes: a person's art by practice, a teacher, an evolution or a deed; a being's by birth
    const vias = new Set(s.acquire.map(r => r.via));
    if (s.trains) assert.ok([...vias].every(v => ['practice', 'teacher', 'evolve', 'deed'].includes(v)), s.id + ' ' + [...vias]);
    else assert.deepEqual([...vias], ['birth'], s.id);
  }
  // the families the owner named: sword, spear, bow, shield, brawling, mounted, healing, battle buffs, mana-based, conditional
  for (const c of ['arms.sword', 'arms.spear', 'arms.bow', 'arms.shield', 'body.brawling', 'arms.mounted', 'body.healing', 'body.vigour']) assert.ok(ARTS.some(s => s.category === c), c);
  assert.ok(ARTS.filter(E.usesMana).length >= 4, 'mana-based arts');
  const ons = new Set(ARTS.filter(s => s.kind === 'passive').map(s => s.levels[0].effects[0].on));
  for (const on of ['wounded', 'near_death', 'outnumbered', 'dawn', 'foe_stronger', 'first_strike', 'night']) assert.ok(ons.has(on), 'a passive on ' + on);
  // ranked D to S where they fit (an SS hide for the oldest dragons)
  for (const r of ['D', 'C', 'B', 'A', 'S']) assert.ok(ARTS.some(s => s.rank === r), 'rank ' + r);
  // the library stays under the 200 at which check 9's shares bind (the rest of step 9's library brings its D and C)
  assert.ok(D0.skills.length < D0.vocab.shares.from);
});

test('sk2Kinds: check 11 refuses a malformed active, passive and buff, and a mana art a person could reach', () => {
  // an active without its cooldown, with a cost in coin, without a base, doing a raise
  let D = fresh(); by(D, 'quick_cut').spec.cooldown = null; assert.ok(checks11(D).some(m => /quick_cut: no cooldown/.test(m)));
  D = fresh(); by(D, 'quick_cut').spec.cost = [{ res: 'coin', v: 3 }]; assert.ok(checks11(D).some(m => /cost in coin/.test(m)));
  D = fresh(); by(D, 'quick_cut').levels[0].effects[0].base = 'dance'; assert.ok(checks11(D).some(m => /base dance/.test(m)));
  D = fresh(); by(D, 'quick_cut').levels[0].effects[0].do = [{ type: 'raise', stat: 'str', v: 1 }]; assert.ok(checks11(D).some(m => /an active cannot raise/.test(m)));
  D = fresh(); by(D, 'quick_cut').slot = false; assert.ok(checks11(D).some(m => /takes a slot/.test(m)));
  D = fresh(); by(D, 'quick_cut').spec.effect = { share: 0.5, unit: 'share' }; assert.ok(checks11(D).some(m => /not the Lv-1 band/.test(m)));
  // a passive acting by an active, on a trigger nobody knows, taking a slot, an always-on edge
  D = fresh(); by(D, 'last_stand').levels[0].effects[0].type = 'active'; assert.ok(checks11(D).some(m => /a passive acts by a trigger/.test(m)));
  D = fresh(); by(D, 'last_stand').levels[0].effects[0].on = 'full_moon'; assert.ok(validate(D).some(e => /full_moon/.test(e.msg)));
  D = fresh(); by(D, 'last_stand').slot = true; assert.ok(checks11(D).some(m => /a passive takes no slot/.test(m)));
  D = fresh(); by(D, 'last_stand').levels[0].effects.push({ type: 'edge', tag: 'melee', v: 1 }); assert.ok(checks11(D).some(m => /an art acts only in its moment/.test(m)));
  // a buff that raises without a duration, a heal without its amount, a heal of something unknown
  D = fresh(); by(D, 'war_cry').spec.duration = null; assert.ok(checks11(D).some(m => /war_cry: a buff that raises or guards has no duration/.test(m)));
  D = fresh(); by(D, 'bind_the_wound').levels[0].effects[0].do = [{ type: 'heal', of: 'hp' }]; assert.ok(checks11(D).some(m => /heal without its amount/.test(m)));
  D = fresh(); by(D, 'bind_the_wound').levels[0].effects[0].do = [{ type: 'heal', of: 'soul', share: 0.1 }]; assert.ok(checks11(D).some(m => /heal of soul/.test(m)));
  // mana only for beings with mana: a practice route to a mana art, and a mana art whose conditions ask no magic
  D = fresh(); by(D, 'ember_breath').acquire.push({ via: 'practice', needs: { family: { sword: 30 } } }); assert.ok(checks11(D).some(m => /reachable without mana/.test(m)));
  D = fresh(); by(D, 'ember_breath').spec.conditions = []; assert.ok(checks11(D).some(m => /conditions ask no being with mana/.test(m)));
  // a person's art that trains nothing; a kind 'buff' without art: true; an art that is a family's rung
  D = fresh(); delete by(D, 'quick_cut').trains; assert.ok(checks11(D).some(m => /trains undefined/.test(m)));
  D = fresh(); delete by(D, 'war_cry').art; assert.ok(checks11(D).some(m => /a buff is an art/.test(m)));
  D = fresh(); by(D, 'quick_cut').family = 'sword'; assert.ok(validate(D).some(e => e.check === 11 && /no family's rung/.test(e.msg)));
  // and the budget binds an art too (its cooldown's factor): a D-rank blow of half his worth at Lv 1
  D = fresh(); by(D, 'quick_cut').levels[0].effects[0].do = [{ type: 'strike', share: 0.5, tag: 'sword' }]; by(D, 'quick_cut').spec.effect = { share: 0.5, unit: 'share' };
  assert.ok(validate(D).some(e => e.check === 3 && /quick_cut/.test(e.msg)));
});

test('costs: a share is 40 points a whole for a blow or a heal, 30 for a guard; the cooldown sets the factor', () => {
  const s = by(D0, 'quick_cut');
  assert.equal(E.effectCost(IX, { type: 'strike', share: 0.25, tag: 'sword' }), 10);
  assert.equal(E.effectCost(IX, { type: 'strike', share: 0.25, tag: 'all' }), 15);
  assert.equal(E.effectCost(IX, { type: 'guard', share: 0.5 }), 15);
  assert.equal(E.effectCost(IX, { type: 'heal', of: 'wounds', v: 2 }), 8);
  assert.equal(E.effectCost(IX, { type: 'status', of: 'stun', v: 2 }), 6);
  assert.equal(E.coolFactor({ v: 1, per: 'duel' }), 1);
  assert.equal(E.coolFactor({ v: 3, per: 'round' }), 1.5);
  assert.equal(E.coolFactor({ v: 1, per: 'month' }), 0.5);
  assert.equal(E.coolFactor({ v: 1, per: 'year' }), 0.25);
  assert.equal(E.spendAt(IX, s, 10), 10);
  // a month's raise costs more than a fight's
  const hs = by(D0, 'hunters_season'), wc = by(D0, 'war_cry');
  assert.equal(E.effectCost(IX, { type: 'raise', stat: 'ins', v: 2 }, hs), 6);
  assert.equal(E.effectCost(IX, { type: 'raise', stat: 'str', v: 2 }, wc), 4);
});

test('slots for actives (§3.5): 1 at 12, 2 at 16, +1 for wits and will, +1 at 30 for B, +1 for A, at most 5', () => {
  assert.equal(E.slots({ age: 11 }), 0);
  assert.equal(E.slots({ age: 12 }), 1);
  assert.equal(E.slots({ age: 16, int: 40, wil: 60 }), 2);
  assert.equal(E.slots({ age: 16, int: 50, wil: 50 }), 3);
  assert.equal(E.slots({ age: 29, int: 50, wil: 50, best: 'A' }), 3);
  assert.equal(E.slots({ age: 30, int: 50, wil: 50, best: 'B' }), 4);
  assert.equal(E.slots({ age: 40, int: 90, wil: 90, best: 'S' }), 5);
});

test('use: once a fight, every n rounds, once a month; the wind and the mana it costs; its own trigger', () => {
  const u = id => E.artUse(IX, by(D0, id), 5);
  const qc = u('quick_cut');
  assert.equal(qc.kind, 'active'); assert.equal(qc.base, 'strike'); assert.equal(qc.do[0].share, 0.12);
  assert.ok(E.ready(qc, { used: {}, fat: 10 }, { round: 1 }));
  assert.ok(!E.ready(qc, { used: { quick_cut: 1 }, fat: 10 }, { round: 4 }), 'once a fight');
  assert.ok(!E.ready(qc, { used: {}, fat: 88 }, { round: 1 }), 'no wind left for it');
  const hs = u('haft_sweep');
  assert.equal(E.nextRound(hs, 2), 7);
  assert.ok(!E.ready(hs, { next: { haft_sweep: 7 } }, { round: 6 }) && E.ready(hs, { next: { haft_sweep: 7 } }, { round: 7 }));
  const fd = u('field_dressing');
  assert.ok(!E.ready(fd, { last: { field_dressing: 100 } }, { month: 100 }) && E.ready(fd, { last: { field_dressing: 100 } }, { month: 101 }));
  const lt = u('long_thrust');
  assert.ok(E.ready(lt, {}, { round: 1 }) && !E.ready(lt, {}, { round: 2 }), 'the first exchange only');
  const eb = u('ember_breath');
  assert.ok(!E.ready(eb, { mana: 7 }, { round: 1 }) && E.ready(eb, { mana: 8 }, { round: 1 }), 'mana');
  // a person has no mana: a mana art is no use to him whatever his weapon
  assert.ok(!E.condOk(IX, eb, { weapon: 'sword' }));
  assert.ok(E.condOk(IX, eb, { beast: 'x', being: { fam: 'dragons', magic: 9 }, mana: 90 }));
  assert.ok(!E.condOk(IX, eb, { beast: 'x', being: { fam: 'hounds', magic: 9 }, mana: 90 }), 'not a hound');
  // the weapon in hand: an axe is the spear family's, a sword is not a spear
  assert.ok(E.condOk(IX, u('splitting_blow'), { weapon: 'axe' }) && !E.condOk(IX, u('splitting_blow'), { weapon: 'sword' }));
  assert.ok(E.condOk(IX, u('long_thrust'), { weapon: 'axe' }), 'axe reads the spear family');
  assert.ok(E.condOk(IX, u('shell_of_oak'), { weapon: 'sword', shield: true }) && !E.condOk(IX, u('shell_of_oak'), { weapon: 'sword' }));
});

test('plan: the choice is pure and has its reasons (move, blood, a buff early or when behind); ties by id', () => {
  const U = ['quick_cut', 'second_wind', 'war_cry', 'shell_of_oak'].map(id => E.artUse(IX, by(D0, id), 5));
  const st = { used: {}, fat: 10, inForce: [] };
  assert.equal(E.plan(U, st, { act: 'strike', round: 2, hp: 0.9 }), 'quick_cut');
  assert.equal(E.plan(U, st, { act: 'guard', round: 5, hp: 0.9 }), null, 'whole and past the first rounds: no buff, no heal');
  assert.equal(E.plan(U, st, { act: 'guard', round: 5, hp: 0.4 }), 'second_wind', 'under half his blood: the heal');
  assert.equal(E.plan(U, st, { act: 'guard', round: 1, hp: 0.9 }), 'shell_of_oak', 'a guard early');
  assert.equal(E.plan(U, st, { act: 'press', round: 6, hp: 0.9, behind: true }), 'war_cry', 'behind: the cry');
  assert.equal(E.plan(U, Object.assign({}, st, { inForce: [{ id: 'war_cry' }] }), { act: 'press', round: 2, hp: 0.9 }), null, 'already in force');
  // the same inputs, the same answer
  for (let i = 0; i < 3; i++) assert.equal(E.plan(U, st, { act: 'strike', round: 2, hp: 0.9 }), 'quick_cut');
  // readying: the best by worth, a buff among two places or more
  const all = ARTS.filter(s => s.trains).map(s => E.artUse(IX, s, 10));
  const two = E.chooseReady(all, 2, { ix: IX, weapon: 'sword' });
  assert.equal(two.length, 2); assert.ok(two.some(id => by(D0, id).kind === 'buff'));
  assert.ok(two.every(id => E.condOk(IX, all.find(u => u.id === id), { weapon: 'sword' })));
  assert.deepEqual(E.chooseReady(all, 2, { ix: IX, weapon: 'sword' }), two);
  assert.deepEqual(E.chooseReady(all, 0, { ix: IX }), []);
});

test('fires: each condition of a passive in a fight', () => {
  assert.ok(E.fires('wounded', { hp: 0.4 }) && !E.fires('wounded', { hp: 0.6 }));
  assert.ok(E.fires('near_death', { hp: 0.15 }) && !E.fires('near_death', { hp: 0.3 }));
  assert.ok(E.fires('first_strike', { round: 1 }) && !E.fires('first_strike', { round: 2 }));
  assert.ok(E.fires('attacked_first', { round: 1, foeAct: 'press' }) && !E.fires('attacked_first', { round: 1, foeAct: 'guard' }));
  assert.ok(E.fires('dawn', { light: 'dusk' }) && !E.fires('dawn', { light: 'noon' }));
  assert.ok(E.fires('night', { light: 'torch' }));
  assert.ok(E.fires('outnumbered', { outnumbered: true }) && E.fires('foe_stronger', { foeStronger: true }));
  assert.ok(!E.fires('siege', { round: 1 }), 'a duel has no siege');
});

test('beings: a monster is born with its arts, mana-based only with magic; a person in the closed form never holds one', () => {
  const dragon = E.beingArts(IX, { fam: 'dragons', magic: 10, level: 692 }).map(x => x.id);
  for (const id of ['wyrmfire', 'ancient_hide', 'ember_breath', 'frost_veil', 'dread_gaze']) assert.ok(dragon.includes(id), id);
  assert.equal(E.beingArts(IX, { fam: 'dragons', magic: 10, level: 692 })[0].lv, 9);
  const wolf = E.beingArts(IX, { fam: 'hounds', magic: 0, level: 5 }).map(x => x.id);
  assert.deepEqual(wolf, ['cornered_fury']);
  assert.ok(E.beingArts(IX, { fam: 'spirits', magic: 0, level: 50 }).every(x => !E.usesMana(by(D0, x.id))), 'no magic, no mana art');
  assert.equal(E.manaOf({ magic: 7 }), 70); assert.equal(E.manaOf({ magic: 0 }), 0); assert.equal(E.manaOf(null), 0);
  // (H-157: Lv 1 up to a soldier's level 100, Lv 10 at 1,000; a wolf of 225 at Lv 4)
  assert.equal(E.beingLevel(1), 1); assert.equal(E.beingLevel(100), 1); assert.equal(E.beingLevel(225), 4); assert.equal(E.beingLevel(1000), 10);
  // a swordsman of C · Lv 5 (read 42) and a D-rank brawler: what their reads open, at levels from the margin
  const reads = { sword: 42, melee: 20, unarmed: 13, athletics: 0 };
  const held = E.npcArts(IX, f => reads[f] || 0, { age: 30, stat: { str: 40, wil: 40 } });
  const ids = held.map(x => x.id);
  assert.ok(ids.includes('quick_cut') && ids.includes('binding_parry') && ids.includes('first_blood') && ids.includes('headbutt'), ids.join());
  assert.ok(!ids.includes('heart_seeker') && !ids.some(id => E.usesMana(by(D0, id))));
  assert.equal(held.find(x => x.id === 'quick_cut').lv, 10);
  assert.equal(held.find(x => x.id === 'binding_parry').lv, 2);
  // twin cut by its evolution: quick cut at Lv 10 and the sword at 35
  assert.ok(ids.includes('twin_cut'));
});

test('words: a share, a cooldown, a cost and a duration said without a number', () => {
  for (const x of [0.025, 0.12, 0.2, 0.25, 0.3, 0.4, 0.5, 0.8]) assert.ok(!/\d|%/.test(E.shareWord(x)), x);
  assert.equal(E.shareWord(0.2), 'a fifth'); assert.equal(E.shareWord(0.25), 'a quarter');
  assert.equal(E.coolWord({ v: 1, per: 'duel' }), 'once a fight');
  assert.equal(E.coolWord({ v: 5, per: 'round' }), 'once in five exchanges');
  assert.equal(E.coolWord({ v: 3, per: 'month' }), 'once in three months');
  assert.equal(E.costWord([{ res: 'stamina', v: 6 }]), 'some wind');
  assert.equal(E.costWord([{ res: 'mana', v: 30 }]), 'a great draw of mana');
  assert.equal(E.durWord({ v: 3, unit: 'round' }), 'for three exchanges');
  for (const s of ARTS) { const u = E.artUse(IX, s, 10); for (const w of [E.coolWord(u.cd), E.costWord(u.cost), E.durWord(u.dur)]) assert.ok(!/\d|%/.test(w), s.id + ': ' + w); }
});
