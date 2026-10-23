// The balance check (Road to Ten, Balance 1 and 3): target numbers per path, and a build that fails when they drift.
// Plays a small league with fixed seeds (the game is deterministic, so the same build always gives the same numbers),
// groups the lives by the path they started on, and checks each group against the bands in bench/targets.mjs.
//   node bench/balance.mjs [built.html] [--lives-per=12] [--workers=3] [--json=reports/balance.json]
// Lives run on --workers pages at once. Each life starts a new game from its own seed, and the lives are dealt to the
// pages in a fixed order, so the numbers do not depend on timing.
// Exit code 1 if any number is outside its band. tools/check.mjs runs it, so CI does too.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { BOT } from './bot.mjs';
import { TARGETS } from './targets.mjs';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const opt = k => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };
const file = path.resolve(process.argv.slice(2).find(a => !a.startsWith('--')) || path.join(root, 'index.html'));
const PER = +(opt('lives-per') || 12), WORKERS = Math.max(1, +(opt('workers') || 3));
const median = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const r1 = x => x == null ? null : Math.round(x * 10) / 10;

const browser = await pw.chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined });
const errs = [];
const pages = [];
for (let w = 0; w < WORKERS; w++) {
  const page = await browser.newPage();
  page.on('pageerror', e => errs.push(String(e.message || e)));
  await page.goto(pathToFileURL(file).href);
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
  await page.evaluate(BOT);
  pages.push(page);
}

const out = { file: path.relative(root, file), build: await pages[0].evaluate(() => window.ARDAN_BUILD), lives: PER, paths: {}, global: {}, failures: [] };
// every life of the league, in a fixed order; page w plays lives w, w + WORKERS, ...
const jobs = [];
for (const [name, P] of Object.entries(TARGETS.paths)) for (let i = 0; i < PER; i++) jobs.push({ name, P, i });
const played = new Array(jobs.length);
const playLife = (page, { name, P, i }) => {
  // engaged and passive alternate; personalities rotate; seeds are fixed per path and slot
  const pers = ['careful', 'reckless', 'greedy', 'random'][i % 4], engaged = i % 2 === 0;
  return page.evaluate(([o, p, e]) => {
    const L = B.life(o, p, e, 70), S = L.samples || [];
    const max = k => Math.max(0, ...S.map(s => typeof s[k] === 'number' ? s[k] : 0));
    const at = age => (S.find(s => s.age >= age) || S[S.length - 1] || {});
    const out = { deathAge: L.deathAge, years: L.years, arc: L.arc, wins: L.wins, checks: L.checks, peakCoin: max('coin'), peakFame: max('fame'),
      coinAt40: at(40).coin || 0, freed: !!(S[0] && S[0].unfree && !(S[S.length - 1] || {}).unfree), kids: max('kids') };
    return out;
  }, [Object.assign({ seed: 7001 + i * 104729 + name.length * 31, sex: i % 2 ? 'F' : 'M' }, P.start), pers, engaged]);
};
await Promise.all(pages.map(async (page, w) => {
  for (let k = w; k < jobs.length; k += WORKERS) { played[k] = await playLife(page, jobs[k]); process.stdout.write('.'); }
}));
const all = [];
for (const [name, P] of Object.entries(TARGETS.paths)) {
  const lives = jobs.map((j, k) => (j.name === name ? played[k] : null)).filter(Boolean);
  all.push(...lives);
  const deaths = lives.filter(l => l.deathAge != null).map(l => l.deathAge);
  const quiet = new Set(['quiet life', 'working life', 'bound for life', 'cut short']);
  out.paths[name] = {
    lives: lives.length,
    medianDeathAge: median(deaths.length ? deaths : lives.map(l => l.years + (P.start.startAge || 0))),
    medianPeakCoin: median(lives.map(l => l.peakCoin)),
    medianPeakFame: median(lives.map(l => l.peakFame)),
    notableSharePct: r1(100 * lives.filter(l => !quiet.has(l.arc)).length / lives.length),
    freedSharePct: r1(100 * lives.filter(l => l.freed).length / lives.length),
    arcs: lives.map(l => l.arc),
    each: lives.map(l => ({ deathAge: l.deathAge, years: l.years, peakCoin: l.peakCoin, peakFame: l.peakFame })),   // for studies of the spread
  };
}
process.stdout.write('\n');
out.global = {
  checkWinRate: r1(100 * all.reduce((a, l) => a + l.wins, 0) / Math.max(1, all.reduce((a, l) => a + l.checks, 0))),
  arcTypes: new Set(all.map(l => l.arc)).size,
  pageErrors: errs.length,
};
await browser.close();

// compare
const check = (where, key, v, band) => {
  if (!band) return;
  const [lo, hi] = band, ok = v != null && v >= lo && v <= hi;
  if (!ok) out.failures.push(`${where}.${key} = ${v}, outside ${lo}–${hi}`);
  return ok;
};
const rows = [];
for (const [name, P] of Object.entries(TARGETS.paths)) for (const [k, band] of Object.entries(P.bands)) { const v = out.paths[name][k]; rows.push([name, k, v, band, check(name, k, v, band)]); }
for (const [k, band] of Object.entries(TARGETS.global)) { const v = out.global[k]; rows.push(['all', k, v, band, check('all', k, v, band)]); }
for (const [p, k, v, b, ok] of rows) console.log(`${ok ? 'ok  ' : 'FAIL'} ${p.padEnd(10)} ${k.padEnd(16)} ${String(v).padStart(7)}   target ${b[0]}–${b[1]}`);
const json = opt('json') || path.join(root, 'reports', 'balance.json');
fs.mkdirSync(path.dirname(json), { recursive: true });
fs.writeFileSync(json, JSON.stringify(out, null, 1));
console.log(out.failures.length ? `${out.failures.length} out of band` : 'all within their bands');
if (out.failures.length) process.exitCode = 1;
