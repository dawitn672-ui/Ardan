// M1 (D-154): the built game's map of the one continent, for the owner. Writes, from a built page:
//   <out>/v4-ground.png   the satellite ground alone (v2's renderer over the designed continent): to hold against his picture
//   <out>/v4-realms.png   the game's full map at its widest, as a life sees it (realms, borders, roads, names)
//   <out>/v4-close.png    the full map at zoom 3 on the Middle Sea
//   <out>/v4-map-full.jpg the same full map at its widest, drawn three times larger (3300 x 2160): the names and roads legible
//   <out>/v4-compare.jpg  the owner's picture, the design laid on it, the built ground and the built map, side by side
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
// the full map at its widest, drawn into a backing canvas three times the game's own (the game's draw fills whatever size it has)
const full = await pg.evaluate(() => {
  const cv = document.getElementById('gmap'), w0 = cv.width, h0 = cv.height;
  cv.width = w0 * 3; cv.height = h0 * 3;
  UI.gm.view = UI.wrClampView({ x0: 0, y0: 0, w: 7000, h: 0 }); UI.gmDraw(); UI.gmDraw();
  const url = cv.toDataURL('image/jpeg', 0.88);
  cv.width = w0; cv.height = h0; UI.gmDraw();
  return url;
});
fs.writeFileSync(path.join(OUT, 'v4-map-full.jpg'), Buffer.from(full.split(',')[1], 'base64'));
// the comparison sheet: four panels of one size, each captioned
const src = f => { const p = path.join(OUT, f); return fs.existsSync(p) ? `data:image/${/\.webp$/.test(f) ? 'webp' : /\.jpe?g$/.test(f) ? 'jpeg' : 'png'};base64,` + fs.readFileSync(p).toString('base64') : null; };
const panels = [['reference/owner-continent.webp', "The owner's picture"], ['design-on-picture.jpg', 'The design laid on it (map-design.md)'],
  ['v4-ground.png', 'Built: the ground (map version 4)'], ['v4-map-full.jpg', 'Built: the map a life sees']].map(([f, t]) => [src(f), t]).filter(x => x[0]);
const sheet = await pg.evaluate(async P => {
  const W = 1400, H = 920, CAP = 48, cv = document.createElement('canvas'); cv.width = W * 2; cv.height = (H + CAP) * Math.ceil(P.length / 2);
  const ctx = cv.getContext('2d'); ctx.fillStyle = '#10141c'; ctx.fillRect(0, 0, cv.width, cv.height);
  for (let i = 0; i < P.length; i++) {
    const im = new Image(); im.src = P[i][0]; await im.decode();
    const x = (i % 2) * W, y = Math.floor(i / 2) * (H + CAP), k = Math.min(W / im.width, H / im.height), dw = im.width * k, dh = im.height * k;
    ctx.drawImage(im, x + (W - dw) / 2, y + CAP + (H - dh) / 2, dw, dh);
    ctx.fillStyle = '#e8dcc0'; ctx.font = '600 28px Georgia, serif'; ctx.fillText(P[i][1], x + 20, y + 34);
  }
  return cv.toDataURL('image/jpeg', 0.86);
}, panels);
fs.writeFileSync(path.join(OUT, 'v4-compare.jpg'), Buffer.from(sheet.split(',')[1], 'base64'));
await b.close();
if (errs.length) { console.error('page errors: ' + errs.slice(0, 3).join(' | ')); process.exit(1); }
console.log(`wrote ${['v4-ground.png', 'v4-realms.png', 'v4-close.png', 'v4-map-full.jpg', 'v4-compare.jpg'].map(f => path.relative(process.cwd(), path.join(OUT, f))).join(', ')}`);
