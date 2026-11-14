// A look at one piece while drawing it.
//   node docs/design/legendaries/src/preview.mjs --id=01-free-hand [--view=full,0,1,plain] [--w=300] [--zoom=1.6] [--out=/tmp/x.png] [--dsf=2]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from './compose.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=').slice(1).join('=') || null;
const ids = (arg('id') || '').split(','), views = (arg('view') || 'full').split(','), out = arg('out') || '/tmp/leg-preview.png', dsf = +(arg('dsf') || 1);
let html = '<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#222;display:flex;gap:10px;padding:10px;align-items:flex-start;flex-wrap:wrap}div{background:radial-gradient(90% 70% at 40% 35%,var(--a),var(--b));border-radius:6px}div.p{background:#efe6d2}svg{display:block}</style>';
for (const id of ids) {
  const mod = await import(path.join(here, id + '.mjs')), def = mod.default;
  for (const v of views) {
    const plain = v === 'plain', d = plain ? def.plain : def, full = v === 'full' || plain, box = v === 'full' ? (d.hero || d.box) : plain ? d.box : def.details[+v].box;
    const w = full ? +(arg('w') || 300) : +(arg('dw') || 420);
    const t0 = performance.now(), R = render(d, box, { width: plain ? +(arg("pw") || 520) : w, tag: v, flat: plain || !!arg("flat"), deg: v === "full" ? undefined : (def.upright ?? -90) }), t1 = performance.now();
    console.log(id, v, 'shapes', R.shapes, 'svg', (R.svg.length / 1024).toFixed(0) + ' KB', 'compose', (t1 - t0).toFixed(1) + ' ms');
    const g = arg('bg') ? arg('bg').split('/') : (def.ground || ['#4a5568', '#1a202c']);
    html += `<div class="${plain ? 'p' : ''}" style="--a:${g[0]};--b:${g[1]}">${R.svg}</div>`;
  }
}
const page = out.replace(/\.png$/, '.html');
fs.writeFileSync(page, html);
const { chromium } = await import(process.env.PLAYWRIGHT_PATH ? path.join(process.env.PLAYWRIGHT_PATH, 'index.mjs') : '/opt/node-tools/node_modules/playwright/index.mjs');
const b = await chromium.launch();
try {
  const pg = await (await b.newContext({ viewport: { width: +(arg('vw') || 1400), height: 900 }, deviceScaleFactor: dsf })).newPage(), errs = [];
  pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await pg.goto('file://' + page); await pg.screenshot({ path: out, fullPage: true });
  if (errs.length) console.log('PAGE ERRORS', errs.join('\n'));
} finally { await b.close(); }
console.log('wrote', out);
