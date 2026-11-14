import { render } from './relief.mjs';
import { buildHead } from './head2.mjs';
import { writePNG } from './png.mjs';
const o = { sex: 'M', age: 44, hair: 'crop', dress: 'mail', coif: 1, id: 'e', wounds: { browCut: -1, nose: 1, eye: 1 }, g: { jawW: 0.7, jawSq: 0.6, brow: 0.7 }, quad: 3 };
const o2 = { sex: 'F', age: 27, hair: 'long', dress: 'tunic', cloth: '#3f5a4a', hairCol: '#5a3a1e', id: 'b', g: { jawW: -0.5, lips: 0.5, noseLen: -0.4, cheek: 0.5 }, quad: 3 };
for (const [n, oo] of [['mail', o], ['tunic', o2]]) for (const S of [64, 92, 176, 240, 400, 480]) { const hd = buildHead(Object.assign({ pxmm: 1 }, oo)), sc = S / (hd.meta.headH * 1.72), m = buildHead(Object.assign({ pxmm: sc }, oo)), r = render(m, S, S, { ss: 1, scale: sc, oy: S * 0.07 }); const b = writePNG(`/tmp/claude-0/-home-user-Ardan/76879393-358c-55c2-b023-d0be520d4c7b/scratchpad/c8r/sz-${n}-${S}.png`, r.rgba, S, S); console.log(n, S, 'raw KB', (S * S * 4 / 1024).toFixed(0), 'png KB', (b / 1024).toFixed(1)); }
