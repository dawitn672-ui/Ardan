// The demo of the first gate (characters.md §14): paints every sheet from the engine modules alone (in Node, four
// workers), and writes docs/design/demo/characters.html (self-contained, opens offline: pictures as WebP inside it, the
// painter bundled inside it for the live face maker) and docs/design/demo/sheet-<name>.png (1600 px wide: 800 CSS px at
// two device pixels). Nothing of the game is touched.
//   node docs/design/demo/build.mjs [--only=faces,ages] [--no-png] [--cache=/tmp/ardan-demo-cache]
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { sheets } from './sheets.mjs';
import { quantize } from './pngq.mjs';

const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '../../..');
const arg = k => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : null; };
const only = arg('only') ? arg('only').split(',') : null;
const cache = arg('cache') || path.join(os.tmpdir(), 'ardan-demo-cache');
fs.mkdirSync(cache, { recursive: true });

// the engine's own source decides whether a cached picture is still good
const engineFiles = [...fs.readdirSync(path.join(root, 'src/ui/engine/paint')).map(f => 'src/ui/engine/paint/' + f), 'src/people/engine/anatomy.js', 'src/people/engine/basemesh.js', 'src/people/engine/face.js'];
const engineHash = crypto.createHash('sha1').update(engineFiles.map(f => fs.readFileSync(path.join(root, f))).join('|')).digest('hex').slice(0, 10);

const S = sheets().filter(s => !only || only.includes(s.id));
const jobs = [];
for (const s of S) for (const g of s.groups) for (const c of g.cells) { c.key = crypto.createHash('sha1').update(engineHash + JSON.stringify([c.look, c.opt])).digest('hex').slice(0, 16); jobs.push(c); }
console.log('cells', jobs.length, 'engine', engineHash);

// ---------- paint (cached raw RGBA)
const todo = jobs.filter(c => !fs.existsSync(path.join(cache, c.key + '.bin')));
const t0 = Date.now(), timing = {};
await new Promise(resolve => {
  if (!todo.length) return resolve();
  const n = Math.min(4, os.cpus().length, todo.length); let next = 0, doneN = 0;
  for (let w = 0; w < n; w++) {
    const wk = new Worker(path.join(here, 'worker.mjs'));
    const feed = () => { if (next < todo.length) { const i = next++; wk.postMessage({ i, look: todo[i].look, opt: todo[i].opt }); } else wk.terminate(); };
    wk.on('message', m => {
      const c = todo[m.i];
      if (m.err) { console.error('FAILED', c.cap, m.err); fs.writeFileSync(path.join(cache, c.key + '.bin'), Buffer.alloc(0)); }
      else { const hd = Buffer.alloc(8); hd.writeUInt32LE(m.W, 0); hd.writeUInt32LE(m.H, 4); fs.writeFileSync(path.join(cache, c.key + '.bin'), Buffer.concat([hd, Buffer.from(m.rgba.buffer)])); const kk = `${c.opt.tier}${m.W}`; (timing[kk] = timing[kk] || []).push(m.ms.total); }
      if (++doneN % 20 === 0 || doneN === todo.length) console.log(`  painted ${doneN}/${todo.length} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
      if (doneN === todo.length) resolve(); else feed();
    });
    feed();
  }
});
if (Object.keys(timing).length) fs.writeFileSync(path.join(cache, 'timing-' + engineHash + '.json'), JSON.stringify(timing));

// ---------- encode as WebP in the browser, bundle the painter, write the page
const PW = process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright';
const { chromium } = await import(path.join(PW, 'index.mjs')).catch(() => import(PW));
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<canvas id=c></canvas>');
const webp = {};
for (const c of jobs) {
  const f = path.join(cache, c.key + '.bin'), b = fs.readFileSync(f);
  if (b.length < 8) { webp[c.key] = ''; continue; }
  const wf = path.join(cache, c.key + '.webp');
  if (fs.existsSync(wf)) { webp[c.key] = fs.readFileSync(wf, 'utf8'); continue; }
  const W = b.readUInt32LE(0), H = b.readUInt32LE(4);
  webp[c.key] = await page.evaluate(([b64, W, H]) => { const raw = atob(b64), a = new Uint8ClampedArray(raw.length); for (let i = 0; i < raw.length; i++) a[i] = raw.charCodeAt(i); const cv = document.getElementById('c'); cv.width = W; cv.height = H; cv.getContext('2d').putImageData(new ImageData(a, W, H), 0, 0); return cv.toDataURL('image/webp', 0.86); }, [b.subarray(8).toString('base64'), W, H]);
  fs.writeFileSync(wf, webp[c.key]);
}
const { build } = await import(path.join(root, 'node_modules/esbuild/lib/main.js')).catch(() => import('esbuild'));
const bundle = (await build({ entryPoints: [path.join(here, 'maker-entry.js')], bundle: true, minify: true, format: 'iife', globalName: 'ARDAN_PAINT', write: false, target: 'es2020', legalComments: 'none' })).outputFiles[0].text;

// timings per portrait size (this machine, one core each)
const allTiming = {}; for (const f of fs.readdirSync(cache).filter(f => f.startsWith('timing-' + engineHash))) Object.assign(allTiming, JSON.parse(fs.readFileSync(path.join(cache, f))));
const med = a => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const timeRows = Object.entries(allTiming).map(([k, a]) => [k, a.length, med(a)]).sort((a, b) => parseInt(a[0].slice(1)) - parseInt(b[0].slice(1)));

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sec = s => `<section class="sheet" id="sheet-${s.id}"><h2>${esc(s.title)}</h2><p class="blurb">${esc(s.blurb)}</p>${s.groups.map(g => `<h3>${esc(g.name)}</h3><div class="grid${g.small ? ' small' : ''}" style="--cols:${g.cols}">${g.cells.map(c => `<figure><img alt="${esc(c.cap)}" src="${webp[c.key]}" width="${c.opt.W / 2}" height="${c.opt.H / 2}"><figcaption>${esc(c.cap)}</figcaption></figure>`).join('')}</div>`).join('')}</section>`;
const css = fs.readFileSync(path.join(here, 'page.css'), 'utf8');
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Ardan characters</title><style>${css}</style></head><body>
<header><h1>Ardan: the people, painted</h1><p>The first gate of C8b (characters.md §14): eight sheets and a live face maker, drawn by the engine modules alone (anatomy.js, face.js, src/ui/engine/paint), before anything is built into the game. One sculpted model in millimetres (MakeHuman's CC0 base, the plan's §2 fallback), grown, aged, scarred and dressed by rule, lit by one window and finished as a painting. Every picture is a pure function of the person: the same look always paints the same.</p>
<nav>${S.map(s => `<a href="#sheet-${s.id}">${esc(s.title)}</a>`).join('')}<a href="#maker-sec">Face maker</a><a href="#cost">Cost</a></nav></header>
${S.map(sec).join('\n')}
<section class="sheet" id="maker-sec"><h2>The face maker</h2><p class="blurb">Every feature of §3 by hand, with colours, hair, body and dress; front and profile; and the age strip (0 to 70) that shows the face you will grow into. Words at the ends of each slider, never numbers. The face's code (23 characters) can be copied and pasted back. Painting runs in a worker, from the same engine as the sheets.</p><div id="maker"></div></section>
<section class="sheet" id="cost"><h2>Cost</h2><p class="blurb">Median time to paint one portrait on this build machine (one core each, Node, unoptimised), by size in device pixels. The plan's budgets (§11) are 3 ms at 64, 5 to 18 ms at 96 to 192, 30 to 105 ms at 256 to 480; these are over them, and C8b's first sprint is to win that back (see the report).</p><table><tr><th>Tier and size</th><th>Portraits</th><th>Median ms</th></tr>${timeRows.map(r => `<tr><td>${esc(r[0])}</td><td>${r[1]}</td><td>${Math.round(r[2])}</td></tr>`).join('')}</table></section>
<footer><p>Base mesh and shape targets: MakeHuman (makehumancommunity.org), released as CC0 in September 2020; only the numbers are used. Built ${esc(engineHash)}.</p></footer>
<script>window.ARDAN_PAINT_SRC=${JSON.stringify(bundle)};</script><script>${bundle}</script><script>${fs.readFileSync(path.join(here, 'maker-ui.js'), 'utf8')}</script>
</body></html>`;
const outHtml = path.join(here, 'characters.html');
if (!only) fs.writeFileSync(outHtml, html); else fs.writeFileSync(path.join(cache, 'partial.html'), html);
console.log('page', (html.length / 1048576).toFixed(1), 'MB');

// ---------- the sheets as PNG
if (!process.argv.includes('--no-png')) {
  const ctx = await browser.newContext({ viewport: { width: 800, height: 1000 }, deviceScaleFactor: 2 });
  const p2 = await ctx.newPage();
  await p2.goto('file://' + (only ? path.join(cache, 'partial.html') : outHtml));
  await p2.waitForTimeout(500);
  for (const s of S) {
    const el = await p2.$('#sheet-' + s.id), f = path.join(here, `sheet-${s.id}.png`);
    let png = await el.screenshot();
    if (png.length > 1.4 * 1048576) png = quantize(png, 256);
    fs.writeFileSync(f, png);
    console.log(' ', path.basename(f), (fs.statSync(f).size / 1048576).toFixed(2), 'MB');
  }
}
await browser.close();
for (const r of timeRows) console.log('timing', r[0], 'n', r[1], 'median ms', Math.round(r[2]));
process.exit(0);
