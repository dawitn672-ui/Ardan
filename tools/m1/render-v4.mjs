// M1 (D-154): the built game's map of the one continent, for the owner. Writes, from a built page:
//   <out>/v4-ground.png   the satellite ground alone (v2's renderer over the designed continent): to hold against his picture
//   <out>/v4-realms.png   the game's full map at its widest, as a life sees it (realms, borders, roads, names)
//   <out>/v4-close.png    the full map at zoom 3 on the Middle Sea
//   node tools/m1/render-v4.mjs <built.html> [--out=docs/design/m1]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright'); }
const args = process.argv.slice(2), opt = (k, d) => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const html = args.find(a => !a.startsWith('--'));
if (!html) { console.error('usage: node tools/m1/render-v4.mjs <built.html> [--out=docs/design/m1]'); process.exit(1); }
const OUT = path.resolve(opt('out', 'docs/design/m1'));
fs.mkdirSync(OUT, { recursive: true });
const b = await pw.chromium.launch();
const pg = await (await b.newContext({ viewport: { width: 1500, height: 1000 } })).newPage();
const errs = []; pg.on('pageerror', e => errs.push(String(e.message || e)));
await pg.goto(pathToFileURL(path.resolve(html)).href);
await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 180000 });
// the ground alone: the renderer's picture of the whole generator grid, at twice its scale
const png = await pg.evaluate(() => {
  const VM = A.V2MAP, w = VM.world(VM.ONE), img = A.V2.render.renderMap(w.gen, { scale: 3.2 });
  const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
  cv.getContext('2d').putImageData(new ImageData(img.data, img.width, img.height), 0, 0);
  // the authored rivers over it, as the game draws them (wider with flow)
  const ctx = cv.getContext('2d'), k = img.width / (w.gw * 10);
  ctx.strokeStyle = 'rgba(52,96,124,0.9)'; ctx.lineCap = 'round';
  w.rivers.forEach((a, i) => { if (!w.riverNames[i]) return; ctx.lineWidth = Math.max(1, Math.log(a[a.length - 1] / 100)); ctx.beginPath(); for (let j = 0; j < a.length; j += 3) ctx[j ? 'lineTo' : 'moveTo'](a[j] * k, a[j + 1] * k); ctx.stroke(); });
  return cv.toDataURL('image/png');
});
fs.writeFileSync(path.join(OUT, 'v4-ground.png'), Buffer.from(png.split(',')[1], 'base64'));
await pg.evaluate(() => {
  A.newGame({ seed: 620, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22 });
  UI.screen = 'game'; UI.set.hints = false; UI.set.atlasFog = false; UI.tab = 'world'; A.S.queue = []; UI.render();
  A.V2MAP.SAT.budgetMs = 1e9; if (UI.INKMAP) UI.INKMAP.budgetMs = 1e9;
  UI.A.ov('bigmap');
  UI.gm.view = UI.wrClampView({ x0: 0, y0: 0, w: 7000, h: 0 }); UI.gmDraw(); UI.gmDraw();
});
await (await pg.$('#gmap')).screenshot({ path: path.join(OUT, 'v4-realms.png') });
await pg.evaluate(() => { const w = 7000 / 3; UI.gm.view = UI.wrClampView({ x0: 3400 - w / 2, y0: 2250 - w / 3.06, w, h: 0 }); UI.gmDraw(); UI.gmDraw(); });
await (await pg.$('#gmap')).screenshot({ path: path.join(OUT, 'v4-close.png') });
await b.close();
if (errs.length) { console.error('page errors: ' + errs.slice(0, 3).join(' | ')); process.exit(1); }
console.log(`wrote ${['v4-ground.png', 'v4-realms.png', 'v4-close.png'].map(f => path.relative(process.cwd(), path.join(OUT, f))).join(', ')}`);
