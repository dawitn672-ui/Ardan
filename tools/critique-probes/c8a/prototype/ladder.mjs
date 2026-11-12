// C8a realism prototype: how much of a 120 px bust changes between two states of one person, in paint and in line-and-flat.
import { render } from './relief.mjs';
import { buildHead } from './head2.mjs';
const S = 120, ss = 2;
const draw = (o, finish) => { const hd = buildHead(Object.assign({ pxmm: 1 }, o)), sc = S / (hd.meta.headH * 1.72), m = buildHead(Object.assign({ pxmm: sc * ss }, o)); return render(m, S, S, { ss, scale: sc, finish, oy: S * 0.07 }).rgba; };
const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 36) n++; return +(n / (S * S) * 100).toFixed(2); };
const base = { sex: 'M', age: 32, hair: 'crop', dress: 'tunic', id: 'a' };
const P = (name, a, b) => { const A = Object.assign({}, base, a), B = Object.assign({}, base, b); return { name, paint: diff(draw(A, 'paint'), draw(B, 'paint')), flat: diff(draw(A, 'cel'), draw(B, 'cel')) }; };
// the head is always fitted to the frame, so a child's smaller head does not count as change
const rows = [
  P('age 30 to 45', { age: 30 }, { age: 45 }), P('age 45 to 60', { age: 45 }, { age: 60 }), P('age 60 to 75', { age: 60 }, { age: 75 }),
  P('gaunt to heavy', { fat: -0.6 }, { fat: 0.8 }),
  P('a cheekbone stove in', {}, { wounds: { dent: 1 } }), P('pox scars', {}, { wounds: { pox: 1 } }), P('a burn', {}, { wounds: { burn: 1 } }),
  P('a broken nose', {}, { wounds: { nose: 1 } }), P('a cut through the brow', {}, { wounds: { browCut: -1 } }), P('a lost eye', {}, { wounds: { eye: -1 } }),
];
for (const k of ['jawW', 'jawSq', 'chin', 'cheek', 'brow', 'noseLen', 'noseBridge', 'noseTip', 'noseW', 'eyeSize', 'eyeGap', 'lips', 'mouthW', 'faceLen']) rows.push(P('gene ' + k, { g: { [k]: -1 } }, { g: { [k]: 1 } }));
for (const r of rows) console.log(`${r.name.padEnd(26)} paint ${String(r.paint).padStart(6)}%   line-and-flat ${String(r.flat).padStart(6)}%`);
