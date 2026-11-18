// W1-5 "surrender or defeat" (war.md §11.3, D-064 point 10, D-091): src/war/engine/surrender.js, the two pans, defeat as
// a fact, what terms cost, the pathway; with the one way of deciding (src/people/engine/why.js), the labs of §11.4:
// a temper bends who asks first, and a victor who demands everything fights a longer war than one who asks what his
// cause named.
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../../src/core/engine/rng.js';
import { decide } from '../../src/people/engine/why.js';
import { will, lean, defeated, termCost, termsCost, pathOf, T, PATHS } from '../../src/war/engine/surrender.js';

const sum = rs => rs.reduce((a, r) => a + r.weight, 0);
const ask = (mind, f, rand) => { const P = will(f); return decide(mind, 'yield', [{ id: 'fight', at: 'X', reasons: P.fight }, { id: 'ask', at: 'X', reasons: P.ask }], { rand, band: T.band, year: 1110 }); };

test('the two pans: each fact goes to its own side, in words, with a source', () => {
  const beaten = { attacker: false, months: 20, ratio: .4, kept: .3, lost: 3, lastLost: 'the Battle of Camia', lostShare: .5, capLost: true, cap: 'Varenna', weary: 90, broke: true, foe: 'Aldmark' };
  const P = will(beaten);
  const labels = P.ask.map(r => r.label).join(' | ');
  assert.match(labels, /hosts broken/i);
  assert.match(labels, /Battle of Camia/);
  assert.match(labels, /Varenna is in enemy hands/);
  assert.match(labels, /worn out/);
  assert.match(labels, /chest is empty/);
  assert.ok(P.ask.every(r => r.source && r.source.t && isFinite(r.weight)), 'every reason has a source and a weight');
  assert.ok(P.fight.some(r => /Defending his own land/.test(r.label)), 'a defender fights for his land');
  assert.ok(![...P.ask, ...P.fight].some(r => /\d/.test(r.label) && !/Battle of/.test(r.label)), 'no numbers in the labels');
  const winning = { attacker: true, cb: 'conquest', months: 8, ratio: 2.5, kept: 1, won: 2, lastWon: 'the Battle of Kelmoor', heldShare: .6, capHeld: true, foeCap: 'Brodava', weary: 20 };
  assert.ok(lean(beaten) > 2, `the beaten side leans toward asking (${lean(beaten)})`);
  assert.ok(lean(winning) < -2, `the winning side leans toward fighting on (${lean(winning)})`);
});

test('defeat is a fact: five conditions, and a side that can still fight is not defeated', () => {
  assert.equal(defeated({ realms: 0 }).path, 8);
  assert.equal(defeated({ leaderGone: true }).path, 3);
  assert.equal(defeated({ capLost: true, cap: 'Tessar', field: 50, field0: 1000 }).path, 3);
  assert.match(defeated({ capLost: true, cap: 'Tessar', field: 50, field0: 1000 }).label, /Tessar has fallen/);
  assert.equal(defeated({ field: 20, field0: 1000, lostShare: .7 }).path, 1);
  assert.equal(defeated({ rebelLeaderGone: true, field: 900, field0: 1000 }).path, 1);
  assert.equal(defeated({ capLost: true, field: 400, field0: 1000, lostShare: .6 }), null, 'a host still in the field: not defeated');
  assert.equal(defeated({ field: 20, field0: 1000, lostShare: .2 }), null, 'strongholds still holding: not defeated');
});

test('terms cost what they are: land by its people, the capital, tribute, coin by years of income', () => {
  assert.ok(termCost({ k: 'land', share: .3, capital: true }) > termCost({ k: 'land', share: .3 }));
  assert.ok(termCost({ k: 'trib' }) > termCost({ k: 'humble' }));
  assert.equal(termCost({ k: 'peace' }), 0);
  assert.ok(termCost({ k: 'coin', years: 1 }) > termCost({ k: 'coin', years: .2 }));
  assert.ok(termCost({ k: 'pay', years: 1 }) < 0, 'what the other side pays is a gain');
  assert.ok(termsCost([{ k: 'land', share: .4 }, { k: 'trib' }, { k: 'coin', years: .5 }]) > termsCost([{ k: 'coin', years: .2 }, { k: 'peace' }]));
  // harsher terms are a reason to fight on (war.md: "a victor who asks for everything meets a loser with nothing to lose")
  const f = { attacker: false, months: 12, ratio: .6, kept: .6, weary: 60 };
  assert.ok(lean(Object.assign({}, f, { terms: 3 })) < lean(Object.assign({}, f, { terms: .3 })));
});

test('the pathway follows the heaviest reason', () => {
  const rec = t => ({ why: [['x', 2, 'reckoning', { t }, 0]] });
  assert.equal(pathOf({}, rec('battles')), 1);
  assert.equal(pathOf({}, rec('weary')), 2);
  assert.equal(pathOf({}, rec('capital')), 3);
  assert.equal(pathOf({}, rec('faction')), 4);
  assert.equal(pathOf({ kept: .4 }, rec('count')), 5);
  assert.equal(pathOf({ heir: true, attacker: true }, rec('battles')), 6);
  assert.equal(pathOf({}, null), 7);
  assert.equal(Object.keys(PATHS).length, 8);
});

// the same beaten defender under two tempers (war.md §11.3: "a cautious man yields early, while he can bargain; a proud
// man holds until he is deposed, taken or defeated"): over 50 seeded months each, the cautious king asks far more often
const CAUTIOUS = { caution: .8, pride: -.3, wrath: -.2, patience: .4 };
const PROUD = { caution: -.4, pride: .9, wrath: .6, patience: -.3 };
const temperW = Tm => .6 * Math.log(Math.min(3, Math.max(.06, Math.exp(1.8 * (1.8 * (Tm.caution || 0) - 2.1 * (Tm.pride || 0) - .9 * (Tm.wrath || 0))))));
test('lab: the cautious king asks for terms while he can bargain; the proud king holds on', () => {
  const f = { attacker: false, months: 14, ratio: .55, kept: .55, lost: 2, lastLost: 'the Battle of Camia', lostShare: .3, weary: 65, foe: 'Aldmark' };
  const run = Tm => { let n = 0; for (let s = 1; s <= 50; s++) if (ask({ id: 'k', temper: Tm, feel: [] }, Object.assign({}, f, { temperW: temperW(Tm), temperLabel: 'his temper' }), makeRng(s).next).chose === 'ask') n++; return n; };
  const c = run(CAUTIOUS), p = run(PROUD);
  assert.ok(c >= 35, `the cautious king asked in ${c} of 50`);
  assert.ok(p <= 15, `the proud king asked in ${p} of 50`);
});

// a toy war, month by month: the stronger side wins most months' fighting and takes land; each month the weaker decides
// whether to ask; the victor names terms by his demand; the asker accepts or refuses the terms named. A victor who demands
// everything he holds meets refusals and the war runs on; one who asks his cause's terms is answered sooner.
function toyWar(seed, demand) {
  const rng = makeRng(seed);
  let held = 0, kept = 1, months = 0, weary = 0, quiet = 0;
  for (; months < 240; months++) {
    // the month's fighting: the attacker (stronger) usually gains ground
    if (rng.next() < .62) { held = Math.min(.95, held + .04); kept = Math.max(.15, kept - .03); } else { held = Math.max(0, held - .02); }
    weary = Math.min(100, weary + 2.5);
    if (quiet > 0) { quiet--; continue; }
    const f = { attacker: false, months, ratio: .5 + .3 * kept, kept, lostShare: held, weary, foe: 'them' };
    const casusCost = 1.2 * held + .2, allCost = 3 * held + 1.2 + .8;   // the cause names part of the land; everything is all of it, tribute and coin
    const mind = { id: 'loser', temper: { pride: .2, caution: .1 }, feel: [] };
    const want = demand === 'all' ? allCost : casusCost;
    if (ask(mind, Object.assign({}, f, { terms: casusCost }), rng.next).chose !== 'ask') continue;
    // the victor names his terms; the loser weighs them
    const P = will(Object.assign({}, f, { terms: want }));
    const ans = decide(mind, 'terms', [{ id: 'accept', reasons: P.ask }, { id: 'refuse', reasons: P.fight }], { rand: rng.next, band: .6 });
    if (ans.chose === 'accept') return months;
    quiet = 4;
  }
  return months;
}
test('lab: a victor who demands everything fights a longer war than one who asks what his cause named (7 of 10 seeds or more)', () => {
  let longer = 0; const pairs = [];
  for (let s = 1; s <= 10; s++) { const a = toyWar(1000 + s, 'all'), c = toyWar(1000 + s, 'casus'); pairs.push(`${a}/${c}`); if (a > c) longer++; }
  assert.ok(longer >= 7, `everything against the cause, months: ${pairs.join(' ')} (longer in ${longer} of 10)`);
});
