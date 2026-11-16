import test from 'node:test';
import assert from 'node:assert/strict';
import { paint } from '../../src/ui/engine/paint/portrait.js';
import { make } from '../../src/people/engine/face.js';
import { STYLES, BEARDS } from '../../src/ui/engine/paint/hair.js';
import { lin, hexOk } from '../../src/ui/engine/paint/materials.js';
import { hash32, noise3 } from '../../src/ui/engine/paint/noise.js';

const look = (o = {}) => ({ id: 'p1', sex: 'M', age: 30, g: make('p1'), station: 'peasant', hair: 'cropped', ...o });
const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 9) n++; return n / (a.length / 4); };

test('looksSame: one look painted twice gives the same bytes', () => {
  const a = paint(look(), { W: 64, H: 64, tier: 'S' }), b = paint(look(), { W: 64, H: 64, tier: 'S' });
  assert.deepEqual(Buffer.from(a.rgba), Buffer.from(b.rgba));
});

test('order cannot matter: painting someone else first changes nothing', () => {
  const a = paint(look(), { W: 64, H: 64, tier: 'S' });
  paint(look({ id: 'other', sex: 'F', hair: 'loose', station: 'noble' }), { W: 64, H: 64, tier: 'S' });
  const b = paint(look(), { W: 64, H: 64, tier: 'S' });
  assert.deepEqual(Buffer.from(a.rgba), Buffer.from(b.rgba));
});

test('looksLadder: a feature at its two ends changes the head visibly', () => {
  for (const k of ['jawW', 'noseLen', 'eyeSize']) {
    const lo = paint(look({ g: { ...make('p1'), [k]: -1 } }), { W: 150, H: 150, tier: 'M', finish: false }), hi = paint(look({ g: { ...make('p1'), [k]: 1 } }), { W: 150, H: 150, tier: 'M', finish: false });
    assert.ok(diff(lo.rgba, hi.rgba) > 0.0025, `${k} ${(diff(lo.rgba, hi.rgba) * 100).toFixed(2)}%`);
  }
});

test('ages and scars show: 30 against 75, a burn', () => {
  const a = paint(look(), { W: 120, H: 120, tier: 'M', finish: false });
  const b = paint(look({ age: 75 }), { W: 120, H: 120, tier: 'M', finish: false });
  const c = paint(look({ wounds: [{ k: 'burn', at: 'cheek_l', age: 25 }] }), { W: 120, H: 120, tier: 'M', finish: false });
  assert.ok(diff(a.rgba, b.rgba) > 0.05); assert.ok(diff(a.rgba, c.rgba) > 0.005);
});

test('the catalogue: 38 styles and 14 kinds of facial hair', () => {
  assert.equal(STYLES.length, 38); assert.equal(BEARDS.length, 14);
  assert.equal(new Set(STYLES.map(s => s.id)).size, 38);
});

test('colours are checked as hex; noise is integer-hashed', () => {
  assert.ok(hexOk('#a0b0c0') && !hexOk('red') && !hexOk('#12345'));
  assert.deepEqual(lin('javascript:1'), lin('#808080'));
  assert.equal(hash32(1, 2, 3), hash32(1, 2, 3));
  assert.equal(noise3(1.5, 2.25, 3.125, 9), noise3(1.5, 2.25, 3.125, 9));
});
