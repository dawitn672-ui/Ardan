// R2 "every relationship needs a base" (owner order 55, rule 19, D-065, D-080): src/people/engine/reach.js.
// The owner's own cases, as pure decisions: a peasant and a king; the same peasant knighted, renowned or introduced;
// a baron risen from commoners and a duke born to gold; need opening a door.
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../../src/core/engine/rng.js';
import { decide } from '../../src/people/engine/why.js';
import { options, judge, say, ACTS } from '../../src/people/engine/reach.js';

const EVEN = { id: 'k', temper: {}, feel: [] };
const PROUD = { id: 'd', temper: { pride: .8, warmth: -.2 }, feel: [] };
const WARM = { id: 'b', temper: { pride: -.2, warmth: .6 }, feel: [] };
const peasantKing = extra => Object.assign({ act: 'befriend', gap: 7, lowWord: 'peasant', highWord: 'king', op: 0, yes: [] }, extra || {});
const share = (mind, c, n = 200) => {
  let y = 0;
  for (let s = 1; s <= n; s++) if (decide(mind, 'reach', options(c), { rand: makeRng(s).next }).chose === 'yes') y++;
  return y / n;
};

test('a peasant cannot befriend the king without a base', () => {
  const j = judge(EVEN, peasantKing());
  assert.equal(j.state, 'closed');
  assert.match(j.nay, /a peasant is far beneath a king/);
  assert.equal(share(EVEN, peasantKing()), 0);
  assert.equal(say('King Osric', 'befriend', false, j.nay), 'King Osric will not make a friend of you: a peasant is far beneath a king.');
});

test('the same peasant, knighted, renowned or introduced, can sometimes', () => {
  const knight = peasantKing({ gap: 5, lowWord: 'knight', yes: [{ kind: 'duty', weight: .8, label: 'a knight of your name is worth an hour' }, { kind: 'duty', weight: .8, label: 'your word is known to be good' }] });
  const famed = peasantKing({ yes: [{ kind: 'merit', weight: 3, label: 'your name is in every hall' }] });
  const intro = peasantKing({ yes: [{ kind: 'loyalty', weight: 2.8, label: 'Lady Edith speaks for you' }] });
  for (const [name, c] of [['knighted', knight], ['renowned', famed], ['introduced', intro]]) {
    const j = judge(EVEN, c), s = share(EVEN, c);
    assert.equal(j.state, 'try', `${name}: an attempt, not a sure thing (${j.state})`);
    assert.ok(s > .05 && s < .6, `${name}: sometimes (${s})`);
  }
  // the reason he is given names the shift
  const rec = decide(EVEN, 'reach', options(knight), { rand: () => 0 });
  assert.equal(rec.chose, 'yes');
  assert.match(say('Lord Aymer', 'audience', true, rec.why[0][0]), /^Lord Aymer will hear you now: a knight of your name is worth an hour\.$/);
});

test('the risen baron agrees more often than the duke born to gold', () => {
  const baron = { act: 'know', gap: 3.5, lowWord: 'peasant', highWord: 'baron', born: 'low', origWord: 'a smith\'s son', traits: [] };
  const duke = { act: 'know', gap: 5, lowWord: 'peasant', highWord: 'duke', born: 'gold', traits: ['proud'] };
  const sameRankBorn = Object.assign({}, baron, { born: 'gold' });
  const b = share(WARM, baron), d = share(PROUD, duke), bb = share(EVEN, sameRankBorn), br = share(EVEN, baron);
  assert.ok(b > .5, `the risen baron mostly agrees (${b})`);
  assert.equal(d, 0, 'the duke born to gold never does');
  assert.ok(br > bb, `at the same rank, the risen one agrees more (${br} > ${bb})`);
  assert.equal(judge(WARM, baron).top, "he was born a smith's son himself");
});

test('need opens doors', () => {
  const c = { act: 'audience', gap: 4.5, lowWord: 'peasant', highWord: 'count', yes: [] };
  assert.equal(judge(EVEN, c).state, 'closed');
  const sword = Object.assign({}, c, { yes: [{ kind: 'want', weight: 1.6, label: 'he needs your sword' }] });
  const j = judge(EVEN, sword);
  assert.notEqual(j.state, 'closed');
  assert.equal(j.top, 'he needs your sword');
  const silence = Object.assign({}, c, { yes: [{ kind: 'want', weight: 3.5, label: 'he wants your silence' }] });
  assert.equal(judge(EVEN, silence).state, 'open');
});

test('near-equals and kin need no decision; pride, acts and her words', () => {
  assert.equal(judge(EVEN, { act: 'befriend', gap: 1 }).state, 'equal');
  assert.equal(judge(EVEN, { act: 'befriend', gap: 7, kin: true }).state, 'kin');
  // a proud man weighs the gap more; a wedding asks more than a meeting
  const c = { act: 'know', gap: 3, yes: [{ kind: 'merit', weight: 1, label: 'x' }] };
  assert.ok(judge(PROUD, c).yes < judge(EVEN, c).yes);
  assert.ok(judge(EVEN, Object.assign({}, c, { act: 'wed' })).yes < judge(EVEN, c).yes);
  assert.ok(ACTS.audience.k < ACTS.befriend.k);
  const j = judge(EVEN, { act: 'know', gap: 4, born: 'low', origWord: 'a serf', she: true });
  assert.equal(j.top, 'she was born a serf herself');
  assert.equal(say('Lady Maud', 'court', true, null, 'her'), 'Lady Maud will let you court her.');
});

test('the decision is a seeded draw only when close; the same seed gives the same answer', () => {
  const c = peasantKing({ gap: 5, yes: [{ kind: 'duty', weight: 1, label: 'k' }] });
  const a = [], b = [];
  for (let s = 1; s <= 30; s++) { a.push(decide(EVEN, 'reach', options(c), { rand: makeRng(s).next }).chose); b.push(decide(EVEN, 'reach', options(c), { rand: makeRng(s).next }).chose); }
  assert.deepEqual(a, b);
  const closed = decide(EVEN, 'reach', options(peasantKing()), { rand: () => { throw new Error('no draw for a closed door'); } });
  assert.equal(closed.chose, 'no');
});
