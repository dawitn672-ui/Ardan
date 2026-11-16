// C8a probe 8: how different are 20 hair-cropped men of one skin, pair by pair, inside the head's box at 120 px.
import { createRequire } from 'node:module';
import { head, GENE_KEYS } from './rig.mjs';
const require = createRequire(import.meta.url);
const pw = require('/opt/node-tools/node_modules/playwright');
const [file] = process.argv.slice(2);
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rng = mulberry(5);
const gauss = () => { let u = 0, v = 0; while (!u) u = rng(); v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const person = () => { const g = {}; for (const k of GENE_KEYS) g[k] = clamp(gauss() * .4, -1, 1); const n = 3 + Math.floor(rng() * 3), ks = GENE_KEYS.slice().sort(() => rng() - .5).slice(0, n); for (const k of ks) g[k] = (rng() < .5 ? -1 : 1) * (.7 + rng() * .3); g.browThick = clamp(gauss() * .5, -1, 1); g.ears = clamp(gauss() * .5, -1, 1); return g; };
const proto = []; for (let i = 0; i < 20; i++) proto.push(head({ genes: person(), size: 120 }));
const b = await pw.chromium.launch();
const pg = await b.newPage({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
await pg.goto('file://' + file);
await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 180000 });
const res = await pg.evaluate(async (proto) => {
  A.newGame({ seed: 42, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
  const alive = Object.values(A.S.people).filter(p => p.alive && p.race === 'human' && p.sex === 'M' && A.age(p) >= 20 && A.age(p) <= 55);
  const step = Math.floor(alive.length / 20), men = []; for (let i = 0; i < 20; i++) men.push(alive[i * step]);
  const today = men.map(p => { const q = JSON.parse(JSON.stringify(p)); q.born = A.S.year - 30; Object.assign(q, { status: 'peasant', ruler: null, noble: null, house: null, cult: 'CUL-22', mil: null, job: null, quirks: [], traits: [], happy: 50, rel: {}, wounds: [] }); q.app = Object.assign({}, q.app, { hstyle: 'shaved', beard: 'none', paint: 'none', jewel: 'none', skin: '#d9a77f', eye: 1, hair: 1 }); return UI.ANIME.svg(q, 120, { bust: true }); });
  const raster = svg => new Promise((ok, bad) => { const u = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })); const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 120; const x = c.getContext('2d'); x.drawImage(im, 0, 0, 120, 120); ok(x.getImageData(0, 0, 120, 120).data); }; im.onerror = bad; im.src = u; });
  const stats = async (svgs, box) => {
    const R = []; for (const s of svgs) R.push(await raster(s));
    const [x0, y0, x1, y1] = box, area = (x1 - x0) * (y1 - y0), d = [];
    for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) { let n = 0; for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const k = (y * 120 + x) * 4; if (Math.abs(R[i][k] - R[j][k]) + Math.abs(R[i][k + 1] - R[j][k + 1]) + Math.abs(R[i][k + 2] - R[j][k + 2]) > 36) n++; } d.push(n / area * 100); }
    d.sort((a, b2) => a - b2);
    return { pairs: d.length, min: +d[0].toFixed(2), p10: +d[Math.floor(d.length * .1)].toFixed(2), median: +d[Math.floor(d.length / 2)].toFixed(2), max: +d[d.length - 1].toFixed(2), identicalPairs: d.filter(v => v < 0.2).length };
  };
  return { today: await stats(today, [34, 17, 86, 77]), rig: await stats(proto, [20, 5, 100, 91]) };
}, proto);
console.log(JSON.stringify(res, null, 1));
await b.close();
