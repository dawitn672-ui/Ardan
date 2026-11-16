import { render } from './relief.mjs';
import { buildHead } from './head2.mjs';
import { writePNG, sheet } from './png.mjs';
const [out, size = '300', ss = '2', which = 'cast', cols = '4'] = process.argv.slice(2);
const S = +size;
export const CAST = {
  cast: [
    { sex: 'M', age: 32, hair: 'crop', dress: 'tunic', id: 'a' },
    { sex: 'F', age: 27, hair: 'long', dress: 'tunic', cloth: '#3f5a4a', hairCol: '#5a3a1e', id: 'b', g: { jawW: -0.5, lips: 0.5, noseLen: -0.4, cheek: 0.5 } },
    { sex: 'M', age: 71, hair: 'crop', bald: 0.8, grey: 0.9, dress: 'tunic', cloth: '#4a4250', id: 'c', g: { noseLen: 0.6, noseBridge: 0.8, chin: 0.4 }, fat: -0.4 },
    { sex: 'M', age: 6, hair: 'crop', dress: 'tunic', cloth: '#7a6a4a', hairCol: '#6b4a2a', id: 'd' },
    { sex: 'M', age: 44, hair: 'crop', dress: 'mail', coif: 1, id: 'e', wounds: { browCut: -1, nose: 1, eye: 1 }, g: { jawW: 0.7, jawSq: 0.6, brow: 0.7 } },
    { sex: 'M', age: 38, hair: 'crop', dress: 'tunic', id: 'f', wounds: { burn: 1, cheekCut: -1 }, g: { noseW: 0.5, lips: -0.4 } },
    { sex: 'F', age: 58, hair: 'long', grey: 0.6, dress: 'tunic', cloth: '#5a2f3a', id: 'g', fat: 0.5, g: { noseTip: 0.6, mouthW: 0.5 } },
    { sex: 'M', age: 32, hair: 'crop', dress: 'tunic', id: 'a', finish: 'cel' },
  ],
};
if (process.argv[1].endsWith('sheetA.mjs')) {
  const list = CAST[which], tiles = [], ms = [];
  for (const o of list) { const hd = buildHead(Object.assign({ pxmm: S / 400 * +ss }, o)); const sc = S / 400 * (400 / (hd.meta.headH * 1.72)); const m = buildHead(Object.assign({ pxmm: sc * +ss }, o)); const r = render(m, S, S, { ss: +ss, scale: sc, finish: o.finish, oy: S * 0.07 }); tiles.push(r.rgba); ms.push(Math.round(r.ms.total)); }
  const sh = sheet(tiles, +cols, S, S); writePNG(out, sh.rgba, sh.W, sh.H); console.log('ms', ms.join(' '));
}
