import { render } from './relief.mjs';
import { buildHead } from './head.mjs';
import { writePNG } from './png.mjs';
const [out, size = '480', ss = '2'] = process.argv.slice(2);
const S = +size, m = buildHead({ sex: 'M', age: 32, id: 'p1' });
let best = null; for (let i = 0; i < 4; i++) { const r = render(m, S, S, { ss: +ss, scale: S / 380 }); if (!best || r.ms.total < best.ms.total) best = r; }
writePNG(out, best.rgba, S, S);
console.log(JSON.stringify(Object.fromEntries(Object.entries(best.ms).map(([k, v]) => [k, +v.toFixed(1)]))), 'prims', m.prims.length, 'brushes', m.brushes.length + m.late.length, 'px', best.px);
