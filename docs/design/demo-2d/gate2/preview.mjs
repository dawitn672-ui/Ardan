// Gate 2 · a look at the drawing while it is being made (the "look, then correct" loop of characters.md §11).
//   node docs/design/demo-2d/gate2/preview.mjs --out=/tmp/x.png [--who=id,id] [--crop=face|bust|half|figure] [--size=420] [--set=key=val,...] [--bg=#d9d4de]
// Looks come from sitters.js; --set overrides fields of every look (dots reach into g and build: g.jawW=1).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const { compose } = await import(pathToFileURL(path.join(here, 'figure.js')).href);
const { SITTERS } = await import(pathToFileURL(path.join(here, 'sitters.js')).href);

const who = arg('who', '') ? arg('who').split(',') : SITTERS.map(s => s.id);
const crop = arg('crop', 'bust'), size = +arg('size', 420), bg = arg('bg', '#e4e0e8');
const sets = arg('set', '') ? arg('set').split(',').map(kv => kv.split('=')) : [];
const val = v => (v === 'true' ? true : v === 'false' ? false : v !== '' && !isNaN(+v) ? +v : v);
const vary = arg('vary', '');   // --vary=g.jawW:-1:0:1  draws each sitter once per value
const cells = [];
for (const id of who) {
  const base = SITTERS.find(s => s.id === id); if (!base) { console.error('no sitter', id); continue; }
  const variants = vary ? vary.split(':').slice(1).map(v => [[vary.split(':')[0], v]]) : [[]];
  for (const extra of variants) {
    const look = JSON.parse(JSON.stringify(base));
    for (const [k, v] of [...sets, ...extra]) { const ks = k.split('.'); let o = look; for (const kk of ks.slice(0, -1)) o = o[kk] = o[kk] || {}; o[ks.at(-1)] = val(v); }
    const t0 = performance.now();
    const r = compose(look, { crop, width: size, id: 'p' + cells.length + '_', ...(crop === 'figure' ? { w: 900, top: 2140, px: size / 900 } : {}) });
    const ms = performance.now() - t0;
    cells.push({ svg: r.svg, vb: r.vb, ms, kb: r.svg.length / 1024, shapes: r.shapes, label: (look.name || id) + (extra.length ? ' ' + extra[0].join('=') : '') });
  }
}
const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:${bg};font:11px sans-serif;color:#333}.row{display:flex;flex-wrap:wrap;gap:6px;padding:6px}.c{background:${bg}}svg{display:block}</style><div class="row">${cells.map(c => `<div class="c"><div style="width:${size}px">${c.svg.replace('<svg ', `<svg width="${size}" height="${Math.round(size * c.vb[3] / c.vb[2])}" `)}</div>${c.label} · ${c.ms.toFixed(1)} ms · ${c.kb.toFixed(0)} KB · ${c.shapes} shapes</div>`).join('')}</div>`;
if (arg('html', '')) fs.writeFileSync(arg('html'), html);
const { chromium } = await import(process.env.PLAYWRIGHT_PATH ? path.join(process.env.PLAYWRIGHT_PATH, 'index.mjs') : '/opt/node-tools/node_modules/playwright/index.mjs');
const browser = await chromium.launch();
try {
  const per = +arg('per', Math.min(cells.length, 6));
  const pg = await (await browser.newContext({ viewport: { width: per * (size + 6) + 12, height: 600 }, deviceScaleFactor: +arg('dpr', 1) })).newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await pg.setContent(html);
  await pg.screenshot({ path: arg('out', '/tmp/gate2-preview.png'), fullPage: true });
  if (errs.length) console.error(errs.join('\n'));
  console.log(cells.map(c => `${c.label}: ${c.ms.toFixed(1)} ms, ${c.kb.toFixed(0)} KB, ${c.shapes} shapes`).join('\n'));
} finally { await browser.close(); }
