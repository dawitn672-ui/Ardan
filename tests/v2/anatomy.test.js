import test from 'node:test';
import assert from 'node:assert/strict';
import { model, statureShare, ageing, healing, featureWeights } from '../../src/people/engine/anatomy.js';
import { make } from '../../src/people/engine/face.js';

const look = (o = {}) => ({ id: 'a', sex: 'M', age: 30, g: make('a'), height: 172, ...o });
const yRange = m => { let lo = 1e9, hi = -1e9; for (let i = 0; i < 13380; i++) { const y = m.V[i * 3 + 1]; lo = Math.min(lo, y); hi = Math.max(hi, y); } return [lo, hi]; };

test('looksTrue: stature and the head follow the growth curves (within 3%)', () => {
  const want = { 0: [490, 128], 1: [740, 165], 3: [946, 180], 6: [1144, 190], 10: [1350, 202], 14: [1600, 218], 18: [1720, 225] };
  for (const [a, [st, hh]] of Object.entries(want)) {
    const m = model(look({ age: +a })), [lo, hi] = yRange(m);
    assert.ok(Math.abs((hi - lo) / st - 1) < 0.03, `age ${a}: stature ${(hi - lo).toFixed(0)} want ${st}`);
    assert.ok(Math.abs(m.marks.headH / hh - 1) < 0.03, `age ${a}: head ${m.marks.headH.toFixed(0)} want ${hh}`);
  }
});

test('heads tall: about 4 at birth and 7 to 8 grown', () => {
  const b = model(look({ age: 0 })), g = model(look({ age: 25 }));
  const ht = m => { const [lo, hi] = yRange(m); return (hi - lo) / m.marks.headH; };
  assert.ok(ht(b) > 3.6 && ht(b) < 4.2, `newborn ${ht(b).toFixed(2)}`);
  assert.ok(ht(g) > 7.2 && ht(g) < 8.0, `grown ${ht(g).toFixed(2)}`);
});

test('height is lost in old age', () => {
  assert.ok(statureShare(80, 'M') < 0.975 && statureShare(80, 'F') < statureShare(80, 'M'));
  assert.equal(statureShare(30, 'M'), 1);
});

test('the years come in order and wear speeds them', () => {
  assert.ok(ageing(60).sag > ageing(45).sag && ageing(45).lines > ageing(30).lines);
  assert.ok(ageing(40, 1).lines > ageing(40, 0).lines);
});

test('features reach the mesh: every feature of the face changes its weights', () => {
  const base = featureWeights(look({ g: {} })).W;
  for (const k of ['faceLen', 'jawW', 'chin', 'cheekbones', 'eyeSize', 'noseLen', 'noseBridge', 'mouthW', 'lips', 'earSize', 'earSet', 'bite', 'lids', 'browRidge']) {
    const w = featureWeights(look({ g: { [k]: 1 } })).W;
    assert.notDeepEqual(w, base, k);
  }
});

test('looksForm: a broken nose and a lost eye move the form where they lie, and nowhere far', () => {
  const a = model(look()), b = model(look({ wounds: [{ k: 'nose', at: 'nose_l', age: 25 }] })), c = model(look({ wounds: [{ k: 'eye', at: 'eye_l', how: 'shut', age: 25 }] }));
  const moved = (p, q, near) => { let mx = 0, far = 0; for (let i = 0; i < 13380; i++) { const d = Math.hypot(p.V[i * 3] - q.V[i * 3], p.V[i * 3 + 1] - q.V[i * 3 + 1], p.V[i * 3 + 2] - q.V[i * 3 + 2]); const r = Math.hypot(p.V[i * 3] - near[0], p.V[i * 3 + 1] - near[1], p.V[i * 3 + 2] - near[2]); if (r < 30) mx = Math.max(mx, d); else if (r > 80) far = Math.max(far, d); } return [mx, far]; };
  const [n1, n2] = moved(a, b, a.marks.nose.tip); assert.ok(n1 >= 1 && n2 < 0.01, `nose ${n1} far ${n2}`);
  const [e1, e2] = moved(a, c, a.eyes[0].c); assert.ok(e1 >= 1 && e2 < 0.01, `eye ${e1} far ${e2}`);
  assert.equal(c.eyes[0].shut, 'shut');
});

test('wounds wait for their year, and heal by stages', () => {
  const m = model(look({ age: 20, wounds: [{ k: 'cut', at: 'brow_l', age: 30 }] }));
  assert.equal(m.marks.wounds.list.length, 0);
  const h0 = healing(0), h1 = healing(1), h20 = healing(20);
  assert.ok(h0.fresh > 0.9 && h1.red > 0 && h20.pale === 1 && h20.thin > 0.5);
});

test('the model is a pure function of the look', () => {
  const a = model(look({ id: 'q' })), b = model(look({ id: 'q' }));
  assert.deepEqual(Array.from(a.V.slice(0, 300)), Array.from(b.V.slice(0, 300)));
});
