// A look at the portraits while drawing them.
//   node docs/design/legendaries/src/preview-figs.mjs [--only=winter-wheat,thaw] [--w=300] [--out=/tmp/x.png]
import fs from 'node:fs';
import path from 'node:path';
import { LEGENDS } from './index.mjs';
import { portrait } from './figure.mjs';

const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=').slice(1).join('=') || null;
const only = arg('only') ? arg('only').split(',') : null, out = arg('out') || '/tmp/leg-figs.png', w = +(arg('w') || 300);
let html = '<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#222;display:flex;gap:8px;padding:8px;flex-wrap:wrap}svg{display:block;border-radius:5px}</style>';
for (const def of LEGENDS) {
  if (only && !only.includes(def.id)) continue;
  const R = portrait(def, { width: w });
  console.log(def.id, 'shapes', R.shapes, 'svg', (R.svg.length / 1024).toFixed(0) + ' KB', 'compose', R.ms.toFixed(1) + ' ms');
  html += `<div>${R.svg}</div>`;
}
const page = out.replace(/\.png$/, '.html'); fs.writeFileSync(page, html);
const { chromium } = await import(process.env.PLAYWRIGHT_PATH ? path.join(process.env.PLAYWRIGHT_PATH, 'index.mjs') : '/opt/node-tools/node_modules/playwright/index.mjs');
const b = await chromium.launch();
try { const pg = await (await b.newContext({ viewport: { width: +(arg('vw') || 1600), height: 900 }, deviceScaleFactor: +(arg('dsf') || 1) })).newPage(), errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => m.type() === 'error' && errs.push(m.text())); await pg.goto('file://' + page); await pg.screenshot({ path: out, fullPage: true }); if (errs.length) console.log('PAGE ERRORS', errs.join('\n')); } finally { await b.close(); }
console.log('wrote', out);
