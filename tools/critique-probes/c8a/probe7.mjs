// C8a probe 7: the "gene ladder" measure. How much of a 120 px bust changes between the two ends of one face parameter:
// today's renderer (the stored face, brow, mouth, nose, eyeShape) against the prototype rig's planned ranges.
import { createRequire } from 'node:module';
import { head, GENE_KEYS } from './rig.mjs';
const require = createRequire(import.meta.url);
const pw = require('/opt/node-tools/node_modules/playwright');
const [file] = process.argv.slice(2);
const b = await pw.chromium.launch();
const pg = await b.newPage({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
await pg.goto('file://' + file);
await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 180000 });
const zero = {}; for (const k of GENE_KEYS) zero[k] = 0;
const protoPairs = GENE_KEYS.map(k => [k, head({ genes: { ...zero, [k]: -1 }, size: 120 }), head({ genes: { ...zero, [k]: 1 }, size: 120 })]);
const res = await pg.evaluate(async (protoPairs) => {
  A.newGame({ seed: 42, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
  const base = A.pc();
  const mk = (app) => { const p = JSON.parse(JSON.stringify(base)); p.id = 'c8_param'; p.sex = 'M'; p.born = A.S.year - 30; p.status = 'peasant'; p.cult = 'CUL-22'; p.traits = []; p.quirks = []; p.wounds = []; p.happy = 50; p.rel = {}; p.mil = null; p.job = null; p.noble = null; p.ruler = null; p.house = null;
    p.app = Object.assign({ skin: '#d9a77f', hair: 2, eye: 1, hstyle: 'shaved', beard: 'none', build: 'average', height: 168, face: 1, brow: 1, mouth: 1, nose: 1, eyeShape: 1, paint: 'none', jewel: 'none' }, app); return p; };
  const raster = svg => new Promise((ok, bad) => { const u = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })); const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 120; const x = c.getContext('2d'); x.drawImage(im, 0, 0, 120, 120); ok(x.getImageData(0, 0, 120, 120).data); }; im.onerror = bad; im.src = u; });
  const diff = async (s1, s2) => { const a = await raster(s1), b2 = await raster(s2); let n = 0; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b2[i]) + Math.abs(a[i + 1] - b2[i + 1]) + Math.abs(a[i + 2] - b2[i + 2]) > 36) n++; return +(n / 144).toFixed(2); };
  const out = { today: {}, rig: {} };
  // today: each stored parameter at its two most different values (the widest pair is reported)
  for (const [k, vals] of [['face', [0, 1, 2, 3]], ['brow', [0, 1, 2]], ['mouth', [0, 1, 2]], ['nose', [0, 1, 2]], ['eyeShape', [0, 1, 2]]]) {
    let best = 0; const svgs = vals.map(v => UI.ANIME.svg(mk({ [k]: v }), 120, { bust: true }));
    for (let i = 0; i < svgs.length; i++) for (let j = i + 1; j < svgs.length; j++) best = Math.max(best, await diff(svgs[i], svgs[j]));
    out.today[k] = best;
  }
  // all five at once, most different combination tried
  out.today.allFive = await diff(UI.ANIME.svg(mk({ face: 3, brow: 2, mouth: 2, nose: 2, eyeShape: 1 }), 120, { bust: true }), UI.ANIME.svg(mk({ face: 2, brow: 1, mouth: 1, nose: 1, eyeShape: 2 }), 120, { bust: true }));
  for (const [k, a, b2] of protoPairs) out.rig[k] = await diff(a, b2);
  return out;
}, protoPairs);
console.log(JSON.stringify(res, null, 1));
await b.close();
