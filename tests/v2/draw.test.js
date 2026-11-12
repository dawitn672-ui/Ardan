// The 2D portrait engine (src/ui/engine/draw/, characters.md §12): one look gives one display list (looksSame), nothing
// from outside the look leaks in, the sliders, wounds and finishes do what they say, and each tier stays in its level.
import test from 'node:test';
import assert from 'node:assert/strict';
import { compose, listHash, rig } from '../../src/ui/engine/draw/compose.js';
import { svg } from '../../src/ui/engine/draw/svg.js';
import { parse, toBez, warpPt } from '../../src/ui/engine/draw/geom.js';
import { loadLib, SITTERS } from '../../docs/design/demo-2d/lib.mjs';

const lib = loadLib();
const clone = o => JSON.parse(JSON.stringify(o));
const L = (look, o = {}) => compose(look, { tier: 'L', px: 480, ...o }, lib);

test('looksSame: the same look gives the same display list, every tier and finish', () => {
  for (const s of SITTERS) for (const tier of ['S', 'M', 'L']) for (const finish of ['line', 'tone']) {
    const a = compose(clone(s), { tier, finish, px: 96 }, lib), b = compose(clone(s), { tier, finish, px: 96 }, lib);
    assert.equal(listHash(a), listHash(b), `${s.id} ${tier} ${finish}`);
  }
});

test('order cannot matter: composing someone else first changes nothing, and the look is not written to', () => {
  const look = clone(SITTERS[3]), before = JSON.stringify(look), a = listHash(L(look));
  for (const s of SITTERS) L(clone(s));
  assert.equal(listHash(L(look)), a);
  assert.equal(JSON.stringify(look), before);
});

test('the SVG writer is a pure function of the list', () => {
  const l = L(clone(SITTERS[1]));
  assert.equal(svg(l, 480), svg(l, 480));
  assert.match(svg(l, 480), /^<svg xmlns/);
});

test('the list is plain numbers and colours, rounded to a tenth of a unit', () => {
  const l = L(clone(SITTERS[0]));
  for (const it of l.items) {
    assert.ok(Array.isArray(it.d) && it.d.length > 2);
    for (const v of it.d) assert.ok(Number.isFinite(v) && Math.round(v * 10) === v * 10);
    assert.ok(typeof it.f === 'string' ? /^#[0-9a-f]{6}$/.test(it.f) : it.f.g === 'r', JSON.stringify(it.f));
  }
});

test('every colour role resolves (nothing falls back to the missing-colour magenta)', () => {
  for (const s of SITTERS) for (const finish of ['line', 'tone']) {
    const l = L(clone(s), { finish });
    assert.ok(!JSON.stringify(l.items).includes('#ff00ff'), `${s.id} ${finish}`);
  }
});

test('a slider at its two ends changes the drawing (jaw, nose, eyes)', () => {
  const base = clone(SITTERS[0]);
  for (const k of ['jawW', 'noseLen', 'noseBridge', 'eyeSize', 'lips']) {
    const lo = L({ ...base, g: { ...base.g, [k]: -1 } }), hi = L({ ...base, g: { ...base.g, [k]: 1 } });
    assert.notEqual(listHash(lo), listHash(hi), k);
  }
});

test('a wound redraws its part: a broken nose moves the nose and leaves the eyes alone', () => {
  const a = clone(SITTERS[1]), b = { ...clone(SITTERS[1]), wounds: [{ k: 'broken_nose', y: 5 }] };
  const la = L(a), lb = L(b);
  assert.notEqual(listHash(la), listHash(lb));
  // the catchlight of the near eye (a small pale ellipse) is the same shape in both
  const catchOf = l => l.items.filter(it => it.f === lib.palettes.eye.hl).map(it => it.d.join(',')).sort().join('|');
  assert.equal(catchOf(la), catchOf(lb));
});

test('a cut through a brow removes the brow hairs rooted in its band', () => {
  const s = clone(SITTERS[3]), cut = L(s), whole = L({ ...s, wounds: s.wounds.filter(w => w.k !== 'cut') });
  const size = l => l.items.reduce((n, it) => n + it.d.length, 0);
  assert.ok(size(cut) !== size(whole));
});

test('age, sex and the strength of a face (rig)', () => {
  const child = rig({ age: 6, sex: 'F' }), woman = rig({ age: 27, sex: 'F' }), man = rig({ age: 32, sex: 'M' }), old = rig({ age: 71, sex: 'M' });
  assert.equal(child.child, 1); assert.equal(child.female, 0.5);
  assert.equal(woman.female, 1); assert.equal(man.female, 0); assert.equal(man.elder, 0);
  assert.ok(old.elder > 0.5 && old.elder < 1);
  assert.ok(child.strength < woman.strength && woman.strength === 1);
});

test('the finishes differ, and the small tier draws only level 0', () => {
  const s = clone(SITTERS[0]);
  assert.notEqual(listHash(L(s, { finish: 'line' })), listHash(L(s, { finish: 'tone' })));
  const S = compose(s, { tier: 'S', px: 92 }, lib), Lg = L(s);
  assert.ok(S.items.length < Lg.items.length);
  assert.ok(Lg.items.length <= 1500, `L ${Lg.items.length}`);
  assert.ok(S.items.length <= 250, `S ${S.items.length}`);
});

test('geometry: smooth runs close, and a warp moves only what is within its reach', () => {
  const b = toBez(parse('M 0 0 S 100 0 100 100 0 100 Z'));
  assert.equal(b[0], 0); assert.equal(b[b.length - 1], 3);
  assert.deepEqual(warpPt([[0, 0, 10, 0, 50]], 0, 0), [10, 0]);
  assert.deepEqual(warpPt([[0, 0, 10, 0, 50]], 60, 0), [60, 0]);
});
