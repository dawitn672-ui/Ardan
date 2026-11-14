// Boot the built game headless and run an in-page script file; prints/writes its JSON result.
// usage: node run.mjs script.js [out.json] [--timeout=ms]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const args = process.argv.slice(2);
const script = fs.readFileSync(args[0], 'utf8');
const out = args[1] && !args[1].startsWith('--') ? args[1] : null;
const tmo = +(args.find(a => a.startsWith('--timeout=')) || '--timeout=1800000').slice(10);
const t0 = Date.now();
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(String(e.stack || e).slice(0, 400)));
page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)); if (m.text().startsWith('LOG:')) console.log(m.text()); });
page.setDefaultTimeout(tmo);
await page.goto('file:///tmp/ardan/snap/index.html');
await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 180000 });
const boot = Date.now() - t0;
const res = await page.evaluate(`(async () => { ${script} })()`);
const json = JSON.stringify({ boot, secs: (Date.now() - t0) / 1000, errs: errs.slice(0, 20), res }, null, 1);
if (out) fs.writeFileSync(out, json);
console.log(out ? `wrote ${out} (${json.length} bytes) boot ${boot}ms total ${(Date.now() - t0) / 1000}s errs ${errs.length}` : json.slice(0, 20000));
if (errs.length) console.log('ERRS', errs.slice(0, 5));
await browser.close();
