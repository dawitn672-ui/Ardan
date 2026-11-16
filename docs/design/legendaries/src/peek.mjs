// A look at one block of the built page.  node docs/design/legendaries/src/peek.mjs --sel=#lg-01 --out=/tmp/x.png [--dsf=1]
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=').slice(1).join('=') || null;
const { chromium } = await import(process.env.PLAYWRIGHT_PATH ? path.join(process.env.PLAYWRIGHT_PATH, 'index.mjs') : '/opt/node-tools/node_modules/playwright/index.mjs');
const b = await chromium.launch();
try {
  const pg = await (await b.newContext({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: +(arg('dsf') || 1) })).newPage(), errs = [];
  pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await pg.goto('file://' + path.join(here, '../legendaries.html'));
  await pg.waitForFunction(() => window.DONE === true, null, { timeout: 240000 });
  if (errs.length) console.log('PAGE ERRORS\n' + errs.join('\n'));
  for (const [i, sel] of (arg('sel') || '#lg-01').split(',').entries()) { const out = (arg('out') || '/tmp/peek.png').replace(/\.png$/, (i ? '-' + i : '') + '.png'); await pg.locator(sel).screenshot({ path: out }); console.log('wrote', out); }
  console.log('height', await pg.evaluate(() => document.documentElement.scrollHeight));
} finally { await b.close(); }
