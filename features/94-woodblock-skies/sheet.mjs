// Contact sheets of the colour prints, for art review (not a test):
//   node features/94-woodblock-skies/sheet.mjs <built.html> <out-dir> [--tag=r1]
// writes <tag>-shapes.png (the 25 compositions at their own hour), <tag>-hours.png (four scenes at every hour),
// <tag>-terrain.png (two scenes on every terrain, a coast and in winter), and <tag>-contact.png (all 25 x 6 hours).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }
const args = process.argv.slice(2);
const file = path.resolve(args.find(a => !a.startsWith('--')));
const out = path.resolve(args.filter(a => !a.startsWith('--'))[1] || '.');
const tag = (args.find(a => a.startsWith('--tag=')) || '--tag=sheet').slice(6);
fs.mkdirSync(out, { recursive: true });

const b = await pw.chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1920, height: 1000 }, reducedMotion: 'reduce' });
const pg = await ctx.newPage();
pg.on('pageerror', e => console.log('page error', String(e).slice(0, 300)));
await pg.goto(pathToFileURL(file).href);
await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });

// cells: [label, shape, key, month, opts]; cols: cells per row; w: cell width in px
const sheet = async (name, cells, cols, w) => {
  await pg.evaluate(({ cells, cols, w }) => {
    const SK = UI.SKIES;
    document.body.innerHTML = `<div style="display:grid;grid-template-columns:repeat(${cols},${w}px);gap:14px 10px;padding:12px;background:#0d1120;width:max-content">` +
      cells.map(([label, sh, key, mo, o]) => `<figure style="margin:0"><div class="woodcut-wrap sky-wrap" style="margin:0">${SK.svg(sh, key, mo, o)}${SK.cartouche(o.place)}</div>` +
        `<figcaption style="font:12px/1.3 system-ui;color:#bdb8cc;margin-top:3px">${UI.esc(label)} · ${(SK.svg(sh, key, mo, o).length / 1024).toFixed(1)} KB</figcaption></figure>`).join('') + '</div>';
    document.body.style.margin = '0';
  }, { cells, cols, w });
  await pg.waitForTimeout(400);
  const el = await pg.$('body > div');
  const p = path.join(out, `${tag}-${name}.png`);
  await el.screenshot({ path: p });
  console.log('wrote', p);
};

const shapes = await pg.evaluate(() => Object.keys(UI.SKIES.SCENE));
const hours = await pg.evaluate(() => UI.SKIES.HOUR_KEYS);
const place = 'Kingsmere';
const own = await pg.evaluate(sh => sh.map(s => UI.SKIES.hourFor(s, 'ev_sheet|1105', '')), shapes);
await sheet('shapes', shapes.map((s, i) => [`${s} · ${own[i]}`, s, 'ev_sheet|1105', 4, { hour: own[i], terr: 'hills', place }]), 5, 380);
const four = ['travel', 'kin', 'faith', 'letter'];
await sheet('hours', four.flatMap(s => hours.map(h => [`${s} · ${h}`, s, 'ev_sheet|1105', 5, { hour: h, terr: 'forest', place }])), 6, 310);
const terr = await pg.evaluate(() => UI.SKIES.TERRAIN_KEYS);
const tcells = [];
for (const s of ['travel', 'subordinate']) {
  for (const t of terr) tcells.push([`${s} · ${t}`, s, 'ev_t|1107', 6, { hour: 'day', terr: t, place: 'Hollowmere' }]);
  tcells.push([`${s} · coast`, s, 'ev_t|1107', 6, { hour: 'golden', terr: 'hills', coast: true, place: 'Saltgate' }]);
  tcells.push([`${s} · winter`, s, 'ev_t|1107', 0, { hour: 'day', terr: 'hills', place: 'Wintermarch' }]);
}
await sheet('terrain', tcells, 5, 380);
if (!args.includes('--quick')) await sheet('contact', shapes.flatMap(s => hours.map(h => [`${s} · ${h}`, s, 'ev_c|1110', 7, { hour: h, terr: 'hills', place }])), 6, 300);
await b.close();
