import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../../src/v2/rng.js';
import { makeGenes, newBody, stats, fightingWorth, describe, breakthrough, practise, train } from '../../src/v2/body.js';
import { attempt, oddsWords } from '../../src/v2/odds.js';
import { People, bloodTerm, relationLabel, canCallMutualFriend, notableKin } from '../../src/v2/kin.js';
import { lineOfSuccession } from '../../src/v2/succession.js';
import { recordDeed, renown, promotionCheck } from '../../src/v2/renown.js';
import { makeDiplomacy, setFactor, statusOf, houseBond, houseStatus } from '../../src/v2/diplomacy.js';

const mk = (rng, race, sex, opts = {}) => ({ id: opts.id ?? 1, race, sex, age: opts.age ?? 25, genes: { ...makeGenes(rng, race, sex), ...(opts.avg ? avgGenes(race, sex) : {}) }, body: newBody(), gear: opts.gear ?? 'none' });
function avgGenes(race, sex) { const g = { lift: 1, sprint: 1, march: 1, reaction: 1, toughness: 1, liftCeil: 1, sprintCeil: 1, marchCeil: 1, reactionCeil: 1, toughnessCeil: 1, heightZ: 0, build: 1, wits: 100, learning: 100, judgment: 100, will: 100, presence: 100, cunning: 100 }; return g; }

test('height grows from infancy and stops at adulthood', () => {
  const rng = makeRng(1); const p = mk(rng, 'human', 'male', { avg: true }); p.genes.adultHeight = 172;
  const h = (a) => stats(p, a).height;
  assert.ok(h(0) < 55 && h(0) > 45, `newborn ${h(0)}`);
  assert.ok(h(1) > 70 && h(1) < 80, `1y ${h(1)}`);
  assert.ok(h(10) > 130 && h(10) < 142);
  assert.equal(h(25), 172); assert.equal(h(40), 172);
});

test('strength grows through youth, peaks, then declines', () => {
  const rng = makeRng(2); const p = mk(rng, 'human', 'male', { avg: true });
  const L = (a) => stats(p, a).lift;
  assert.ok(L(1) < L(8) && L(8) < L(16) && L(16) < L(25));
  assert.ok(L(28) >= L(40) && L(40) > L(65));
  assert.ok(L(1) < 15, `toddler lifts ${L(1)}`);
});

test('races differ: giant > orc > human; dwarf sturdier than elf', () => {
  const rng = makeRng(3);
  const L = (r) => stats(mk(rng, r, 'male', { avg: true })).lift;
  assert.ok(L('giant') > 5 * L('orc') / 2 && L('orc') > 1.8 * L('human'));
  const T = (r) => stats(mk(rng, r, 'male', { avg: true })).toughness;
  assert.ok(T('dwarf') > T('elf'));
});

test('fighting worth calibration (in levies)', () => {
  const rng = makeRng(4);
  const human = (tierHrs, cond, gear) => { const p = mk(rng, 'human', 'male', { avg: true, gear }); p.body.skills.sword = tierHrs; Object.assign(p.body.cond, cond); return fightingWorth(p, 'sword', gear).worth; };
  const levy = human(30, { lift: 1.1 }, 'levy');
  assert.ok(Math.abs(levy - 1) < 0.15, `levy ${levy}`);
  const maa = human(800, { lift: 1.4, sprint: 1.1, reaction: 1.087, toughness: 1.2 }, 'mail');
  assert.ok(maa > 2 && maa < 3.2, `man-at-arms ${maa}`);
  const elite = human(12000, { lift: 4, sprint: 1.6, reaction: 1.4, toughness: 3 }, 'order');
  assert.ok(elite > 12 && elite < 32, `elite ${elite}`);
  const giant = mk(rng, 'giant', 'male', { avg: true, age: 70 }); giant.body.skills.axe = 30;
  const gw = fightingWorth(giant, 'axe', 'club').worth;
  assert.ok(gw > 12 && gw < 30, `giant ${gw}`);
  assert.ok(elite > gw * 0.8, 'an elite order member stands on equal footing with an ordinary giant');
});

test('descriptions are concrete words, not x/100', () => {
  const rng = makeRng(5); const d = describe({ ...mk(rng, 'human', 'male', { avg: true }), age: 25 });
  assert.match(d.lift.value, /kg/); assert.match(d.lift.words, /can lift about/);
  assert.match(d.sprint.words, /runs as fast as/);
  assert.ok(d.wits.words && d.wits.rarity);
});

test('odds: favourites usually win, but blunder; underdogs usually lose, but surge', () => {
  const rng = makeRng(6); let fav = 0, blunders = 0, dog = 0, surgeWins = 0, N = 6000;
  for (let i = 0; i < N; i++) {
    const a = attempt(rng, { capability: 1.5, difficulty: 1 }); fav += a.success; blunders += a.blundered && !a.success;
    const b = attempt(rng, { capability: 1, difficulty: 3, stakes: 0.9, will: 125 }); dog += b.success; surgeWins += b.success && b.surged;
  }
  assert.ok(fav / N > 0.66 && fav / N < 0.82, `one tier up wins ${fav / N}`);
  assert.ok(blunders > 0, 'favourites sometimes lose to their own mistakes');
  assert.ok(dog / N > 0.03 && dog / N < 0.25, `long odds ${dog / N}`);
  assert.ok(surgeWins > 0, 'will carries underdogs sometimes');
});

test('odds: poor judgment blunders more; strong will surges more', () => {
  const rng = makeRng(7); const N = 8000; let fool = 0, sage = 0, weak = 0, iron = 0;
  for (let i = 0; i < N; i++) {
    fool += attempt(rng, { capability: 3, difficulty: 1, judgment: 70 }).blundered;
    sage += attempt(rng, { capability: 3, difficulty: 1, judgment: 130 }).blundered;
    weak += attempt(rng, { capability: 1, difficulty: 2.5, will: 75, stakes: 1 }).success;
    iron += attempt(rng, { capability: 1, difficulty: 2.5, will: 135, stakes: 1 }).success;
  }
  assert.ok(fool > sage * 3, `fool ${fool} sage ${sage}`);
  assert.ok(iron > weak * 1.3, `iron ${iron} weak ${weak}`);
});

test('odds words, no percentages', () => {
  assert.equal(oddsWords(1, 1).words, 'evenly matched');
  assert.equal(oddsWords(10, 1).words, 'a certainty');
  assert.ok(!/%/.test(JSON.stringify(oddsWords(2, 1))));
});

test('breakthroughs raise the ceiling for good', () => {
  const rng = makeRng(8); const p = mk(rng, 'human', 'male', { avg: true });
  for (let i = 0; i < 400; i++) train(p, 'lift', 1);
  const capped = p.body.cond.lift; breakthrough(p, 'lift', 1.5);
  for (let i = 0; i < 400; i++) train(p, 'lift', 1);
  assert.ok(p.body.cond.lift > capped * 1.1);
});

function family() {
  const P = new People(); let id = 1; const add = (name, sex, by, f, m) => { const p = P.add({ id: id++, name, sex, birthYear: by }); if (f || m) P.link(p, f, m); return p; };
  const gf = add('Gramps', 'male', 1040), gm = add('Gran', 'female', 1042); P.marry(gf, gm, 1062);
  const dad = add('Dad', 'male', 1065, gf, gm), uncle = add('Uncle', 'male', 1068, gf, gm), aunt = add('Aunt', 'female', 1070, gf, gm);
  const mum = add('Mum', 'female', 1068); P.marry(dad, mum, 1088);
  const uWife = add('UWife', 'female', 1070); P.marry(uncle, uWife, 1090);
  const me = add('Me', 'male', 1092, dad, mum), sis = add('Sis', 'female', 1090, dad, mum), bro = add('Bro', 'male', 1095, dad, mum);
  const cousin = add('Cousin', 'male', 1092, uncle, uWife); const cKid = add('CKid', 'female', 1115, cousin, null);
  uncle.office = 'General of the Western March'; cousin.heirTo = 'County of Hollinford';
  return { P, gf, gm, dad, mum, uncle, aunt, uWife, me, sis, bro, cousin, cKid };
}

test('kinship terms are exact', () => {
  const f = family();
  const t = (o) => relationLabel(f.P, f.me, o).primary;
  assert.equal(t(f.dad), 'father'); assert.equal(t(f.mum), 'mother'); assert.equal(t(f.gf), 'grandfather');
  assert.equal(t(f.uncle), 'uncle'); assert.equal(t(f.aunt), 'aunt'); assert.equal(t(f.cousin), 'first cousin');
  assert.equal(t(f.cKid), 'first cousin once removed'); assert.equal(t(f.uWife), 'aunt by marriage');
  assert.equal(relationLabel(f.P, f.mum, f.dad).primary, 'husband');
  assert.equal(relationLabel(f.P, f.dad, f.me).primary, 'son');
});

test('a parent is never "a mutual friend"', () => {
  const f = family();
  assert.equal(canCallMutualFriend(f.P, f.me, f.mum, f.dad), false);
  const bonds = { get: () => ({ kind: 'friend' }) };
  const lab = relationLabel(f.P, f.mum, f.dad, bonds);
  assert.equal(lab.primary, 'husband'); assert.ok(!/acquaintance|mutual/.test(lab.text));
});

test('notable kin surfaces the general uncle and the cousin heir your age', () => {
  const f = family(); const nk = notableKin(f.P, f.me, { year: 1105 });
  const names = nk.map((k) => k.person.name);
  assert.ok(names.includes('Uncle') && names.includes('Cousin'));
  const c = nk.find((k) => k.person.name === 'Cousin');
  assert.ok(c.why.includes('your age') && c.why.some((w) => /heir/.test(w)));
});

test('succession follows the house law, not a menu', () => {
  const f = family();
  const mp = lineOfSuccession(f.P, f.dad, { law: 'male-preference', fitness: 'none' }, 1105).line.map((e) => e.person.name);
  assert.deepEqual(mp.slice(0, 3), ['Me', 'Bro', 'Sis']);
  const ab = lineOfSuccession(f.P, f.dad, { law: 'absolute', fitness: 'none' }, 1105).line.map((e) => e.person.name);
  assert.deepEqual(ab.slice(0, 3), ['Sis', 'Me', 'Bro']);
  f.me.traits = ['craven'];
  const unfit = lineOfSuccession(f.P, f.dad, { law: 'male-preference', fitness: 'unfit-passed-over' }, 1105);
  assert.equal(unfit.line[0].person.name, 'Bro'); assert.equal(unfit.skipped[0].person.name, 'Me');
  const strict = lineOfSuccession(f.P, f.dad, { law: 'male-preference', fitness: 'none' }, 1105);
  assert.equal(strict.line[0].person.name, 'Me', 'houses without a fitness rule keep the law');
});

test('renown: one great deed outweighs many small ones; promotion is not linear', () => {
  const a = { deeds: [] }, b = { deeds: [] };
  for (let i = 0; i < 20; i++) recordDeed(a, { weight: 1, witnesses: 'comrades', year: 1100 + (i % 5), text: 'solid work' });
  recordDeed(b, { weight: 20, witnesses: 'army', year: 1104, text: 'held the ford alone' });
  assert.ok(renown(b, 1105) > renown(a, 1105) * 2);
  const rng = makeRng(9); const gaps = [];
  for (let run = 0; run < 60; run++) {
    const p = { deeds: [], rankIndex: 0 }; let last = 0;
    for (let m = 0; m < 240; m++) {
      if (rng.chance(0.03)) recordDeed(p, { weight: rng.chance(0.1) ? 30 : 2, witnesses: 'company', year: 1100 + Math.floor(m / 12), month: m % 12, text: 'deed' });
      const pr = promotionCheck(rng, p, { year: 1100 + Math.floor(m / 12), month: m % 12, ladder: ['a', 'b', 'c', 'd', 'e', 'f'], vacancy: rng.float(0.05, 0.6) });
      if (pr) { gaps.push(m - last); last = m; }
    }
  }
  const mean = gaps.reduce((s, x) => s + x, 0) / gaps.length;
  const sd = Math.sqrt(gaps.reduce((s, x) => s + (x - mean) ** 2, 0) / gaps.length);
  assert.ok(gaps.some((g) => g <= 12) && gaps.some((g) => g >= 60), 'sometimes fast, sometimes years');
  assert.ok(sd / mean > 0.6, `irregular promotions cv=${(sd / mean).toFixed(2)}`);
});

test('marriage plus feud reads as an uneasy alliance, never a contradiction', () => {
  const d = makeDiplomacy([{ id: 0 }, { id: 1 }], makeRng(10));
  setFactor(d, 0, 1, 'marriage-1101', 16, { text: 'royal marriage in 1101' });
  setFactor(d, 0, 1, 'feud-hollin', -25, { text: 'feud over Hollin' });
  assert.equal(statusOf(d, 0, 1), 'uneasy marriage alliance');
  const hb = houseBond(); hb.factors.set('marriage-x', { value: 15, text: 'married in 1101 to end the feud' }); hb.factors.set('feud-x', { value: -20, text: 'the feud smoulders' });
  const hs = houseStatus(hb); assert.equal(hs.status, 'uneasy marriage alliance'); assert.equal(hs.why.length, 2);
});
