// Gate 1 of the 2D character plan (docs/design/characters.md §15): the style frame.
//   node docs/design/demo-2d/build.mjs              writes gate1.html (one offline page) and gate1.png (1600 px wide)
//   node docs/design/demo-2d/build.mjs --preview=/tmp/x.png [--who=0] [--finish=tone|line] [--px=900]
// The page is made from the engine (src/ui/engine/draw/) and the parts (assets/parts/) alone: nothing in the game.
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';
import { loadLib, SITTERS, root } from './lib.mjs';
import { quantize, recompress } from './pngq.mjs';

const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const here = path.join(root, 'docs/design/demo-2d');
const lib = loadLib();

const eng = await build({ entryPoints: [path.join(root, 'src/ui/engine/draw/index.js')], bundle: true, minify: true, format: 'iife', globalName: 'DRAW', write: false, target: 'es2020', legalComments: 'none' });
const engine = eng.outputFiles[0].text;
// the page's JSON: the parts without their authoring notes
const strip = o => JSON.stringify(o, (k, v) => (k === '_note' ? undefined : v));

const fonts = path.join(root, 'assets/fonts');
const font = (f, fam, w, st = 'normal') => `@font-face{font-family:${fam};src:url(data:font/woff2;base64,${fs.readFileSync(path.join(fonts, f)).toString('base64')}) format('woff2');font-weight:${w};font-style:${st}}`;

const css = `
${font('cinzel-normal-600-700-latin.woff2', 'Cinzel', '600 700')}
${font('literata-normal-400-700-latin.woff2', 'Literata', '400 700')}
${font('literata-italic-400-600-latin.woff2', 'Literata', '400 600', 'italic')}
:root{--ink:#2a2233;--paper:#efe6d4;--paper2:#e4d8c0;--rule:#b9a888;--muted:#6b5d55;--card:#f6efe2;--back1:#cdbfa6;--back2:#a99b86}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--ink:#efe6d4;--paper:#1f1b24;--paper2:#2a2430;--rule:#4a4050;--muted:#b3a79a;--card:#29232f;--back1:#4b4352;--back2:#2e2833}}
:root[data-theme="dark"]{--ink:#efe6d4;--paper:#1f1b24;--paper2:#2a2430;--rule:#4a4050;--muted:#b3a79a;--card:#29232f;--back1:#4b4352;--back2:#2e2833}
*{box-sizing:border-box}html,body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.5 Literata,Georgia,serif}
main{max-width:800px;margin:0 auto;padding:22px 16px 30px}
h1{font:700 26px/1.1 Cinzel,serif;letter-spacing:.04em;margin:0 0 4px}
.sub{color:var(--muted);font-style:italic;margin:0 0 14px;font-size:14px}
.head{display:grid;grid-template-columns:240px 240px 1fr;gap:12px;align-items:end;border-bottom:1px solid var(--rule);padding-bottom:6px;margin-bottom:10px}
.head b{font:600 13px Cinzel,serif;letter-spacing:.08em;text-transform:uppercase}
.head span{display:block;color:var(--muted);font-size:12px;font-style:italic}
.row{display:grid;grid-template-columns:240px 240px 1fr;gap:12px;margin:0 0 16px;align-items:start}
.frame{position:relative;width:240px;height:288px;border-radius:3px;overflow:hidden;background:var(--back1);box-shadow:inset 0 0 0 1px var(--rule)}
.frame canvas{display:block;width:240px;height:288px}
.side{display:flex;flex-direction:column;gap:8px}
.who{font:700 15px Cinzel,serif;letter-spacing:.03em}
.line{font-size:13px;color:var(--muted);margin:0}
.smalls{display:flex;gap:10px;align-items:flex-end}
.smalls figure{margin:0;text-align:center;font-size:10px;color:var(--muted)}
.smalls .tile{width:46px;height:46px;border-radius:50%;overflow:hidden;background:var(--back1);box-shadow:inset 0 0 0 1px var(--rule)}
.smalls .tile canvas{display:block;width:46px;height:46px}
.smalls .tile.m{width:88px;height:88px;border-radius:4px}.smalls .tile.m canvas{width:88px;height:88px}
.zoom{margin:2px 0 0;font-size:10px;color:var(--muted)}.zf{width:264px;height:180px;border-radius:3px;overflow:hidden;background:var(--back1);box-shadow:inset 0 0 0 1px var(--rule)}.zf canvas{display:block;width:264px;height:180px}
.side .line{margin-bottom:0}.times{font:12px/1.4 ui-monospace,Menlo,monospace;color:var(--muted)}
.foot{border-top:1px solid var(--rule);padding-top:10px;color:var(--muted);font-size:12.5px}
.foot p{margin:0 0 6px}
`;

const page = (body, script) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Ardan Style Frame</title><meta name="description" content="Gate 1 of the 2D character plan: four portraits in two finishes, at 480 and 46 px.">
<style>${css}</style></head><body>${body}<script>${engine}</script><script>const LIB=${strip(lib)};const SITTERS=${JSON.stringify(SITTERS)};${script}</script></body></html>`;

// the page's own script: compose each sitter at each tier and finish, draw it, time it
const script = `
const DPR = window.devicePixelRatio || 1;
function paint(cv, look, tier, finish, cssW, cssH, cropName) {
  const pxW = Math.round(cssW * DPR), pxH = Math.round(cssH * DPR);
  cv.width = pxW; cv.height = pxH;
  const t0 = performance.now();
  const L = DRAW.compose(look, { tier, finish, px: pxW, cropW: cropName === 'face' ? 440 : tier === 'L' ? 1000 : tier === 'M' ? 700 : 560 }, LIB);
  const t1 = performance.now();
  const crop = window.CROP || (cropName ? L.crops[cropName] : tier === 'L' ? [0, 0, 1000, 1200] : L.crop);
  DRAW.draw(L, cv.getContext('2d'), pxW, crop);
  const t2 = performance.now();
  return { compose: t1 - t0, draw: t2 - t1, shapes: L.items.length };
}
const T = {};
for (const cv of document.querySelectorAll('canvas[data-who]')) {
  const look = SITTERS[+cv.dataset.who], r = paint(cv, look, cv.dataset.tier, cv.dataset.finish, +cv.dataset.w, +cv.dataset.h, cv.dataset.crop);
  const k = cv.dataset.tier; (T[k] = T[k] || []).push(r);
}
// timing: each tier drawn 12 more times off screen, the median kept
const off = document.createElement('canvas'), med = a => a.sort((x, y) => x - y)[a.length >> 1];
const timing = {};
for (const [tier, w, h] of [['S', 64, 64], ['M', 144, 144], ['L', 480, 576]]) {
  const c = [], d = [], n = [];
  for (let i = 0; i < 12; i++) for (const look of SITTERS) { off.width = w; off.height = h;
    const t0 = performance.now(); const L = DRAW.compose(look, { tier, finish: 'tone', px: w, cropW: tier === 'L' ? 1000 : tier === 'M' ? 700 : 520 }, LIB);
    const t1 = performance.now(); DRAW.draw(L, off.getContext('2d'), w, tier === 'L' ? [0, 0, 1000, 1200] : L.crop); const t2 = performance.now();
    c.push(t1 - t0); d.push(t2 - t1); n.push(L.items.length); }
  timing[tier] = { px: w, compose: +med(c).toFixed(2), draw: +med(d).toFixed(2), shapes: Math.round(n.reduce((a, b) => a + b) / n.length) };
}
const tEl = document.getElementById('times');
if (tEl) tEl.textContent = Object.entries(timing).map(([k, v]) => k + ' (' + v.px + ' px): compose ' + v.compose + ' ms + draw ' + v.draw + ' ms, ' + v.shapes + ' shapes').join('  ·  ');
window.TIMING = timing; window.DONE = true;
`;

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const cv = (who, tier, finish, w, h, crop) => `<canvas data-who="${who}" data-tier="${tier}" data-finish="${finish}" data-w="${w}" data-h="${h}"${crop ? ` data-crop="${crop}"` : ''} width="${w}" height="${h}"></canvas>`;

function gatePage() {
  const rows = SITTERS.map((s, i) => `<section class="row">
  <div class="frame">${cv(i, 'L', 'line', 240, 288)}</div>
  <div class="frame">${cv(i, 'L', 'tone', 240, 288)}</div>
  <div class="side"><div class="who">${esc(s.name)}</div><p class="line">${esc(s.line)}</p>
    <div class="smalls">
      <figure><div class="tile">${cv(i, 'S', 'line', 46, 46)}</div>46 · line</figure>
      <figure><div class="tile">${cv(i, 'S', 'tone', 46, 46)}</div>46 · tone</figure>
      <figure><div class="tile m">${cv(i, 'M', 'tone', 88, 88)}</div>88 · tone</figure>
    </div>
    <figure class="zoom"><div class="zf">${cv(i, 'L', 'tone', 264, 180, 'face')}</div>the face at 2.4× tier L, every level of detail</figure></div>
</section>`).join('\n');
  return `<main><h1>Ardan · the style frame</h1>
<p class="sub">Gate 1 of the 2D character plan. Four sitters drawn by the part system (masters blended by the face's sliders, anchors, layered locks, wounds that redraw the part, layered dress), in the plan's two finishes. Pick one, or say what to change.</p>
<div class="head"><div><b>Line-led</b><span>heavier contour, two tones, feathering</span></div><div><b>Tone-led</b><span>fine line, all five values</span></div><div><b>Small sizes</b><span>as the game shows them in lists</span></div></div>
${rows}
<div class="foot"><p>Large portraits are drawn at 480 device pixels across (the plan's tier L); the round tiles at 46 px (tier S, level 0: outline, main tones and the station's cue); the square at 88 px (tier M).</p>
<p id="times" class="times"></p><p>Source: <code>assets/parts/</code> (path data), engine <code>src/ui/engine/draw/</code>. Deterministic: one look gives one display list (<code>tests/v2/draw.test.js</code>).</p></div></main>`;
}

const { chromium } = await import(process.env.PLAYWRIGHT_PATH ? path.join(process.env.PLAYWRIGHT_PATH, 'index.mjs') : '/opt/node-tools/node_modules/playwright/index.mjs').catch(() => import('playwright'));
const browser = await chromium.launch();
try {
  if (arg('preview')) {
    const who = (arg('who') ?? '0').split(',').map(Number), finish = arg('finish') || 'tone', px = +(arg('px') || 600), tier = arg('tier') || 'L';
    const h = tier === 'L' ? Math.round(px * 1.2) : px;
    const body = `<div style="display:flex;gap:8px;padding:8px;background:#b9ab95">${who.map(i => `<div style="background:radial-gradient(120% 90% at 30% 22%,#d6c8ae,#a99b86)">${cv(i, tier, finish, px, h)}</div>`).join('')}</div>`;
    const crop = arg('crop') ? `window.CROP=[${arg('crop')}];` : '';
    const html = page(body, crop + script).replace('</style>', 'canvas{display:block}</style>');
    const ctx = await browser.newContext({ viewport: { width: who.length * (px + 8) + 8, height: h + 16 }, deviceScaleFactor: 1 });
    const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => m.type() === 'error' && errs.push(m.text()));
    await pg.setContent(html); await pg.waitForFunction(() => window.DONE || false, null, { timeout: 60000 }).catch(() => {});
    if (errs.length) console.error(errs.join('\n'));
    await pg.screenshot({ path: arg('preview') });
    console.log('preview', arg('preview'), JSON.stringify(await pg.evaluate(() => window.TIMING)));
  } else {
    const html = page(gatePage(), script);
    fs.writeFileSync(path.join(here, 'gate1.html'), html);
    const ctx = await browser.newContext({ viewport: { width: 800, height: 1000 }, deviceScaleFactor: 2, colorScheme: 'light' });
    const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => m.type() === 'error' && errs.push(m.text()));
    await pg.goto('file://' + path.join(here, 'gate1.html')); await pg.waitForFunction(() => window.DONE || false, null, { timeout: 60000 });
    if (errs.length) { console.error(errs.join('\n')); process.exitCode = 1; }
    let png = await pg.screenshot({ fullPage: true });
    png = recompress(png); if (png.length > 1.45 * 1048576) png = quantize(png, 256);   // over the budget: 256 colours, dithered
    fs.writeFileSync(path.join(here, 'gate1.png'), png);
    const t = await pg.evaluate(() => window.TIMING);
    console.log('gate1.html', (html.length / 1024).toFixed(0), 'KB; gate1.png', (fs.statSync(path.join(here, 'gate1.png')).size / 1024).toFixed(0), 'KB');
    console.log(JSON.stringify(t));
  }
} finally { await browser.close(); }
