// Usage: node harness.mjs <inpage.js> [jsonArg]  -- inpage.js must define `async function main(arg) {...}` returning JSON-able
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const pw = require('/opt/node-tools/node_modules/playwright');
const { HELPERS } = await import('/home/user/Ardan/tests/helpers.mjs');
const file = process.env.HTML || '/home/user/Ardan/index.html';
const script = fs.readFileSync(process.argv[2], 'utf8');
const arg = process.argv[3] ? JSON.parse(process.argv[3]) : null;
const browser = await pw.chromium.launch();
const ctx = await browser.newContext();
const pg = await ctx.newPage();
const errs = [];
pg.on('pageerror', e => errs.push(String(e.stack || e).slice(0, 300)));
pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)); });
await pg.goto(pathToFileURL(file).href);
await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 180000 });
await pg.evaluate(HELPERS);
pg.setDefaultTimeout(0);
const t0 = Date.now();
let res;
try {
  res = await pg.evaluate(new Function('arg', script + '\nreturn main(arg);'), arg);
} catch (e) { res = { error: String(e.message || e).slice(0, 2000) }; }
console.log(JSON.stringify(res, null, 1));
if (errs.length) console.error('PAGE ERRORS (' + errs.length + '):\n' + [...new Set(errs)].slice(0, 15).join('\n'));
console.error('secs', ((Date.now() - t0) / 1000).toFixed(1));
await browser.close();
