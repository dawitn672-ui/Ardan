import test from 'node:test';
import assert from 'node:assert/strict';
import { FEATURES, BITS, make, pack, unpack, distance, clearlyDiffer, inherit, takesAfter, parentsFor, snap } from '../../src/people/engine/face.js';

test('39 features in 138 bits, a code of 23 characters', () => {
  assert.equal(FEATURES.length, 39);
  assert.equal(BITS, 138);
  const c = pack(make('a'));
  assert.equal(c.length, 23);
});

test('a face set by hand survives its code exactly (faceHand)', () => {
  const g = {}; FEATURES.forEach(([k, s], i) => { g[k] = -1 + 2 * ((i * 7) % s) / (s - 1); });
  const back = unpack(pack(g));
  for (const [k] of FEATURES) assert.equal(back[k], snap(g)[k], k);
});

test('a pasted code is checked character by character', () => {
  assert.equal(unpack('not a code'), null);
  assert.equal(unpack('A'.repeat(22) + '<'), null);
  assert.equal(unpack(42), null);
});

test('the same id makes the same face; ids differ', () => {
  assert.deepEqual(make('x7'), make('x7'));
  assert.ok(distance(make('x7'), make('x8')) > 0.1);
});

test('faceSpread: the closest pair of 20 differs clearly on 5 features in 95 sheets of 100', () => {
  let ok = 0;
  for (let s = 0; s < 100; s++) {
    const f = [...Array(20)].map((_, i) => make(`sheet${s}-${i}`)); let m = 99;
    for (let i = 0; i < 20; i++) for (let j = i + 1; j < 20; j++) m = Math.min(m, clearlyDiffer(f[i], f[j]));
    if (m >= 5) ok++;
  }
  assert.ok(ok >= 95, `${ok} sheets of 100`);
});

test('faceKin: children are nearer their parents than strangers, and siblings are not clones', () => {
  let pc = 0, st = 0, sib = 0, n = 60;
  for (let i = 0; i < n; i++) {
    const f = make('f' + i), m = make('m' + i), a = inherit(f, m, 'c' + i), b = inherit(f, m, 'd' + i);
    pc += (distance(a, f) + distance(a, m)) / 2; st += distance(a, make('s' + i)); sib += distance(a, b);
  }
  assert.ok(pc / st <= 0.75, `parent ${(pc / st).toFixed(2)} of a stranger`);
  assert.ok(sib / st >= 0.2, `siblings ${(sib / st).toFixed(2)} of a stranger`);
});

test('takesAfter names a parent; parentsFor gives every group to one parent', () => {
  const c = inherit(make('F'), make('M'), 'kid');
  assert.match(takesAfter(c, 'F'), /^(Her|Her face)/);
  const you = make('you'), { father, mother } = parentsFor(you, 'you');
  for (const [k] of FEATURES) assert.ok(father[k] === you[k] || mother[k] === you[k] || Math.abs(father[k] - you[k]) < 0.07 || Math.abs(mother[k] - you[k]) < 0.07, k);
});
