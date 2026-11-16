// W1-2 "minds" (R1's core, D-064 point 9, D-069): the one way of deciding, src/people/engine/why.js.
// The owner's two lab tests (order 54): the proud king insulted before his court declares the war his Generals told
// him he would lose, and his record says so; the cold king given the same insult waits, and strikes later, when the
// reckoning favours him.
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../../src/core/engine/rng.js';
import { decide, feel, cool, tell, hotness, weigh, heatAt, T } from '../../src/people/engine/why.js';

const INSULT = { t: 'insult', at: 'VAR', y: 1112, label: "the insult of Varenna's envoy at the Midsummer feast", pub: 1 };
const PROUD = { pride: .8, wrath: .5, patience: -.3, caution: -.2, ambition: .3 };
const COLD = { pride: .3, wrath: .4, patience: .8, caution: .6, ambition: .2 };

// the king's council on Varenna: the same three options for both kings
const council = reckon => [
  { id: 'war', at: 'VAR', feeds: ['pride', 'anger', 'grudge'], reasons: [
    { kind: 'reckoning', weight: reckon, label: reckon < 0 ? "His Generals' count: Varenna's spears outnumber his" : "His Generals' count: Varenna's host is away in the east", source: { t: 'count', ratio: reckon < 0 ? .6 : 1.8 } },
    { kind: 'cost', weight: -1, label: 'The cost of a war in men and coin', source: { t: 'treasury' } },
  ] },
  { id: 'redress', at: 'VAR', reasons: [{ kind: 'insult', weight: 1, label: 'An apology demanded would mend his honour', source: INSULT }] },
  { id: 'wait', at: 'VAR', reasons: [{ kind: 'reckoning', weight: 1, label: 'Peace keeps the host whole', source: { t: 'count' } }] },
];
const king = (id, temper) => ({ id, temper, feel: [], grudges: [] });

test('lab 1: the proud king, insulted before his court, declares the war his Generals said he would lose', () => {
  let wars = 0, rec = null;
  for (let s = 1; s <= 50; s++) {
    const m = king('proud', PROUD);
    feel(m, 'pride', INSULT, 1, { year: 1112 });
    rec = decide(m, 'war', council(-3.5), { rand: makeRng(s).next, year: 1112, at: 'VAR' });
    if (rec.chose === 'war') wars++;
  }
  assert.equal(wars, 50, `the proud king declared in ${wars} of 50 worlds`);
  // his record says so: because of the insult, despite his Generals' count, true to form
  assert.ok(rec.why.some(r => /insult of Varenna/.test(r[0]) && r[2] === 'feeling'), JSON.stringify(rec.why));
  assert.equal(rec.why[0][3].t, 'insult', 'the heaviest reason points at the insult');
  assert.ok(rec.not.some(r => /Generals' count/.test(r[0])), JSON.stringify(rec.not));
  assert.equal(rec.form, 1, 'true to form');
  assert.equal(rec.drawn, false, 'not a close call: no dice');
  assert.match(tell(rec), /^Because: wounded pride: the insult of Varenna.*Despite: .*Generals' count/);
});

test('lab 2: the cold king, given the same insult, waits, and strikes later when the reckoning favours him', () => {
  let waited = 0, struck = 0, late = null;
  for (let s = 1; s <= 50; s++) {
    const m = king('cold', COLD), rng = makeRng(s);
    feel(m, 'pride', INSULT, 1, { year: 1112 });
    const now = decide(m, 'war', council(-3.5), { rand: rng.next, year: 1112, at: 'VAR' });
    if (now.chose !== 'war') waited++;
    // four years pass: the heat is gone, the grudge stays in his ledger
    cool(m, 48);
    assert.ok(heatAt(m, 'VAR') < .1, 'the heat has all but gone after four years');
    assert.equal(m.grudges.length, 1, 'the grudge is kept');
    late = decide(m, 'war', council(2.5), { rand: rng.next, year: 1116, at: 'VAR' });
    if (late.chose === 'war') struck++;
  }
  assert.equal(waited, 50, `the cold king waited in ${waited} of 50 worlds`);
  assert.equal(struck, 50, `and struck later in ${struck} of 50`);
  assert.ok(late.why.some(r => /insult of Varenna.*carried 4 years/.test(r[0]) && r[2] === 'grudge'), JSON.stringify(late.why));
  assert.ok(late.why.some(r => /away in the east/.test(r[0])), JSON.stringify(late.why));
});

test('the same insult, the same reckoning: only the temper differs', () => {
  assert.ok(hotness(PROUD) > .9 && hotness(COLD) < .2, `${hotness(PROUD)} ${hotness(COLD)}`);
  const p = king('p', PROUD), c = king('c', COLD);
  feel(p, 'pride', INSULT, 1, { year: 1112 }); feel(c, 'pride', INSULT, 1, { year: 1112 });
  const wp = weigh(p, council(-3.5)[0], { year: 1112 }), wc = weigh(c, council(-3.5)[0], { year: 1112 });
  assert.ok(wp.disc > .8 && wc.disc < .1, `heat discounts the hot man's reckoning only: ${wp.disc} ${wc.disc}`);
  assert.ok(wp.score > wc.score + 5);
});

test('a draw only between close options; a clear choice draws nothing', () => {
  let calls = 0;
  const rand = () => { calls++; return .99; };
  const opts = [{ id: 'a', reasons: [{ kind: 'merit', weight: 3 }] }, { id: 'b', reasons: [{ kind: 'merit', weight: 0 }] }];
  const r = decide({ id: 1 }, 'x', opts, { rand });
  assert.equal(r.chose, 'a'); assert.equal(calls, 0); assert.equal(r.drawn, false);
  const near = [{ id: 'a', reasons: [{ kind: 'merit', weight: 1 }] }, { id: 'b', reasons: [{ kind: 'merit', weight: .5 }] }];
  const seen = new Set();
  for (let s = 1; s <= 40; s++) { const x = decide({ id: 1 }, 'x', near, { rand: makeRng(s).next }); assert.equal(x.drawn, true); seen.add(x.chose); }
  assert.deepEqual([...seen].sort(), ['a', 'b'], 'close options both come up');
  // the same seed, the same choice
  const a1 = decide({ id: 1 }, 'x', near, { rand: makeRng(9).next }), a2 = decide({ id: 1 }, 'x', near, { rand: makeRng(9).next });
  assert.deepEqual(a1, a2);
  // the band is a parameter
  assert.equal(decide({ id: 1 }, 'x', opts, { rand, band: 4 }).drawn, true);
});

test('temper bends the kinds of reason', () => {
  const opts = [{ id: 'take', reasons: [{ kind: 'coin', weight: 1, label: 'gold' }] }, { id: 'leave', reasons: [{ kind: 'duty', weight: 1, label: 'an oath' }] }];
  assert.equal(decide({ id: 1, temper: { greed: .9, honor: -.5 } }, 'x', opts, { band: 0 }).chose, 'take');
  assert.equal(decide({ id: 1, temper: { greed: -.5, honor: .9 } }, 'x', opts, { band: 0 }).chose, 'leave');
  assert.equal(decide({ id: 1, temper: { greed: .9, honor: -.5 } }, 'x', opts, { band: 0 }).form, 1);
});

test('feelings: bounded, merged, cooled; grudges bounded; a forgiving man cools faster', () => {
  const m = king('m', {});
  for (let i = 0; i < 9; i++) feel(m, 'anger', { at: 'R' + i, label: 'a raid' }, 1, { year: 1100 });
  assert.equal(m.feel.length, T.maxFeel); assert.equal(m.grudges.length, T.maxGrudge);
  const a = king('a', {}); feel(a, 'anger', { at: 'X' }, .5); const h0 = a.feel[0].heat; feel(a, 'anger', { at: 'X' }, .5);
  assert.equal(a.feel.length, 1); assert.ok(a.feel[0].heat > h0, 'the same feeling at the same target merges hotter');
  const fg = king('f', { wrath: -.6 }), vg = king('v', { wrath: .6 });
  feel(fg, 'anger', { at: 'X' }, 1); feel(vg, 'anger', { at: 'X' }, 1);
  cool(fg, 6); cool(vg, 6);
  assert.ok(fg.feel.length === 0 || fg.feel[0].heat < vg.feel[0].heat * .5, 'a forgiving man\'s anger is gone in a season');
  assert.ok(vg.feel.length === 1);
});

test('record shape; what anyone could know', () => {
  const m = king('k', PROUD); feel(m, 'pride', INSULT, 1, { year: 1112 });
  const r = decide(m, 'war', council(-3.5), { year: 1112, at: 'VAR' });
  for (const key of ['y', 'who', 'k', 'at', 'chose', 's', 'why', 'not', 'rej', 'drawn', 'form']) assert.ok(key in r, key);
  assert.ok(r.why.length <= 3 && r.not.length <= 2 && r.rej.length <= 3);
  assert.equal(JSON.parse(JSON.stringify(r)).chose, 'war', 'the record is plain data');
  const pub = tell(r, true);
  assert.match(pub, /insult of Varenna/); assert.doesNotMatch(pub, /Generals' count/, 'the count of spears is the council\'s secret');
  assert.equal(decide(m, 'x', []), null);
});
