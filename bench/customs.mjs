// Customs a typical life runs into (Road to Ten, World 2; docs/benchmarks/world-lore-uniqueness.md, W2). The plan's
// gate: "bots show 90% of realms have at least 2 rules a typical life actually runs into". The benchmark's form: in 90%
// of realms, at least 2 customs fire in a median 60-year life there.
// Plays --seeds lives in each of the 34 realms (a commoner of the realm's own people, from 16, for up to 60 years) and
// counts the realm's customs each life met (47-realm-bible keeps them in pc.rb).
//   node bench/customs.mjs [built.html] [--seeds=3] [--years=60] [--workers=2] [--json=reports/customs.json]
// Exit code 1 if fewer than 90% of realms pass.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { BOT } from './bot.mjs';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const opt = k => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };
const file = path.resolve(process.argv.slice(2).find(a => !a.startsWith('--')) || path.join(root, 'index.html'));
const SEEDS = +(opt('seeds') || 3), YEARS = +(opt('years') || 60), WORKERS = Math.max(1, +(opt('workers') || 2));
const median = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };

const browser = await pw.chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined });
const errs = [], pages = [];
for (let w = 0; w < WORKERS; w++) {
  const page = await browser.newPage();
  page.on('pageerror', e => errs.push(String(e.message || e)));
  await page.goto(pathToFileURL(file).href);
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
  await page.evaluate(BOT);
  pages.push(page);
}
const realms = await pages[0].evaluate(() => Object.values(LORE.realms).map(r => ({ id: r.id, short: r.short, race: r.race })));
const jobs = [];
for (const R of realms) for (let s = 0; s < SEEDS; s++) jobs.push({ R, s });
const played = new Array(jobs.length);
const play = (page, { R, s }) => page.evaluate(([R, s, years]) => {
  const o = { seed: 9001 + s * 7919 + +R.id.slice(4) * 101, race: R.race, realm: R.id, status: 'peasant', sex: s % 2 ? 'F' : 'M', startAge: 16 };
  const L = B.life(o, ['careful', 'greedy', 'random'][s % 3], s % 2 === 0, years);
  const pc = A.P(A.S.pc) || {}, mine = (A.BIBLE && A.BIBLE.of(R.id) || { customs: [] }).customs.map(c => c.id);
  const rb = pc.rb || {};
  return { years: L.years, death: L.deathAge, met: mine.filter(id => rb[id]), realmNow: pc.realm, kinds: mine.filter(id => rb[id]).map(id => A.BIBLE.custom(id).kind) };
}, [R, s, YEARS]);
await Promise.all(pages.map(async (page, w) => {
  for (let k = w; k < jobs.length; k += WORKERS) { played[k] = await play(page, jobs[k]); process.stdout.write('.'); }
}));
process.stdout.write('\n');
const out = { file: path.relative(root, file), seeds: SEEDS, years: YEARS, realms: {}, pass: 0, errors: errs.slice(0, 5) };
const kinds = {};
for (const R of realms) {
  const lives = jobs.map((j, k) => (j.R.id === R.id ? played[k] : null)).filter(Boolean);
  const n = lives.map(l => l.met.length), m = median(n);
  out.realms[R.id] = { short: R.short, median: m, met: n, years: lives.map(l => l.years) };
  if (m >= 2) out.pass++;
  for (const l of lives) for (const k of l.kinds) kinds[k] = (kinds[k] || 0) + 1;
  console.log(`${m >= 2 ? 'ok  ' : 'FAIL'} ${R.id} ${R.short.padEnd(12)} median ${m} met (${n.join(', ')}), years ${lives.map(l => l.years).join(', ')}`);
}
out.passPct = Math.round(100 * out.pass / realms.length);
out.kindsMet = kinds;
console.log(`${out.pass} of ${realms.length} realms (${out.passPct}%): a median life meets at least 2 customs. Kinds met: ${JSON.stringify(kinds)}`);
if (errs.length) console.log('page errors:', errs.slice(0, 5).join(' | '));
const json = opt('json');
if (json) { fs.mkdirSync(path.dirname(path.resolve(json)), { recursive: true }); fs.writeFileSync(path.resolve(json), JSON.stringify(out, null, 1)); }
await browser.close();
process.exit(out.passPct >= 90 && !errs.length ? 0 : 1);
