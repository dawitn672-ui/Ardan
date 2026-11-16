// as ladder.mjs, with a second, finer threshold: a just-visible change (more than 3 steps a channel) against a plain one (12 a channel)
import { render } from './relief.mjs';
import { buildHead } from './head2.mjs';
const S = 120, ss = 2;
const draw = (o, finish) => { const hd = buildHead(Object.assign({ pxmm: 1 }, o)), sc = S / (hd.meta.headH * 1.72), m = buildHead(Object.assign({ pxmm: sc * ss }, o)); return render(m, S, S, { ss, scale: sc, finish, oy: S * 0.07 }).rgba; };
const diff = (a, b, th) => { let n = 0; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > th) n++; return +(n / (S * S) * 100).toFixed(1); };
const base = { sex: 'M', age: 32, hair: 'crop', dress: 'tunic', id: 'a' };
const P = (name, a, b) => { const A = Object.assign({}, base, a), B = Object.assign({}, base, b), pa = draw(A, 'paint'), pb = draw(B, 'paint'), ca = draw(A, 'cel'), cb = draw(B, 'cel'); console.log(`${name.padEnd(24)} paint: seen ${String(diff(pa, pb, 9)).padStart(5)}%  plain ${String(diff(pa, pb, 36)).padStart(5)}%    flat: seen ${String(diff(ca, cb, 9)).padStart(5)}%  plain ${String(diff(ca, cb, 36)).padStart(5)}%`); };
P('age 30 to 45', { age: 30 }, { age: 45 }); P('age 45 to 60', { age: 45 }, { age: 60 }); P('age 60 to 75', { age: 60 }, { age: 75 });
P('a little heavier', { fat: 0 }, { fat: 0.35 }); P('a cheekbone stove in', {}, { wounds: { dent: 1 } }); P('pox scars', {}, { wounds: { pox: 1 } }); P('a burn', {}, { wounds: { burn: 1 } });
P('a broken nose', {}, { wounds: { nose: 1 } }); P('a cut through the brow', {}, { wounds: { browCut: -1 } }); P('a lost eye', {}, { wounds: { eye: -1 } });
P('wool to mail', {}, { dress: 'mail' });
