// How much does each rank's battle move the war-map fight it belongs to (Road to Ten, War 1: "each layer must move the
// result by 10 to 20%")? Freezes the moment a fight with the player's division starts (the whole state and the random
// stream), applies a result for a layer, runs the fight out, and records whether the player's side won. The same
// fights are replayed for every arm, so the arms differ only by the result applied.
//   node bench/rankfx.mjs [built.html] [--fights=60] [--json=reports/rankfx.json]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { RANKFX_LAB } from './rankfx-lab.mjs';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const opt = k => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };
const file = path.resolve(process.argv.slice(2).find(a => !a.startsWith('--')) || path.join(root, 'index.html'));
const N = +(opt('fights') || 60);

const browser = await pw.chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined });
const page = await browser.newPage();
await page.goto(pathToFileURL(file).href);
await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
await page.evaluate(RANKFX_LAB);
const res = await page.evaluate(n => {
  const fights = window.RANKFX_FIGHTS(n);
  const arms = {
    none: () => {},
    lineBest: k => A.RANKFX.apply(k, 'line', 1), lineSuccess: k => A.RANKFX.apply(k, 'line', 0.5), lineWorst: k => A.RANKFX.apply(k, 'line', -0.8),
    partBest: k => A.RANKFX.apply(k, 'part', 1), partWorst: k => A.RANKFX.apply(k, 'part', -1),
  };
  const out = {};
  for (const [name, fn] of Object.entries(arms)) {
    let w = 0, m = 0;
    for (const f of fights) { const r = window.RANKFX_RUN(f, fn); if (r != null) { m++; if (r) w++; } }
    out[name] = { won: w, of: m, pct: Math.round(100 * w / Math.max(1, m)) };
  }
  return { fights: fights.length, arms: out };
}, N).catch(async e => { await browser.close(); throw e; });
await browser.close();
const a = res.arms;
res.swing = { line: a.lineBest.pct - a.lineWorst.pct, part: a.partBest.pct - a.partWorst.pct };
console.log(JSON.stringify(res));
const json = opt('json') || path.join(root, 'reports', 'rankfx.json');
fs.mkdirSync(path.dirname(json), { recursive: true });
fs.writeFileSync(json, JSON.stringify(res, null, 1));
