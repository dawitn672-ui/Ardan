// node sweeprun.mjs <tag> '<json lives>' years every : one page, one evaluate per life, one JSON file per life
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const [tag, livesJson, years, every] = process.argv.slice(2);
const lives = JSON.parse(livesJson);
const lib = fs.readFileSync('/tmp/ardan/critique/world/sweeplib.js', 'utf8');
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage();
const errs = [];
page.on('pageerror', e => errs.push(String(e.stack || e).slice(0, 300)));
page.setDefaultTimeout(5400000);
await page.goto('file:///tmp/ardan/snap/index.html');
await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 300000 });
await page.evaluate(`window.__CFG = { years: ${+years}, every: ${+every} };`);
console.log(await page.evaluate(`(async () => { ${lib} })()`));
for (const cfg of lives) {
  const t0 = Date.now();
  let L;
  try { L = await page.evaluate(c => window.__runLife(c), cfg); } catch (e) { L = { cfg, error: 'evaluate: ' + String(e.message || e).slice(0, 300) }; }
  fs.writeFileSync(`/tmp/ardan/critique/world/out/life-${tag}-${cfg.seed}.json`, JSON.stringify({ errs: errs.splice(0), res: [L] }));
  console.log(`life ${cfg.seed} done in ${Math.round((Date.now() - t0) / 1000)}s`);
}
await browser.close();
