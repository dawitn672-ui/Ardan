// The coherency checks over many lives (round 2 A3). Plays lives of every class by code and, every --every years, runs
// A.COHERENCY.run() (src/core/08-coherency-checks: the v2 invariants and A.V2F's title audit, one holder per seat, no dead or
// child holders, and every check a feature registers). Prints each contradiction found, with the seed, the year and
// ids. Any page error or console.error fails the run, as does a check that changes the state or draws from the stream.
//
//   node tools/coherency.mjs [built.html] [--seeds=3] [--years=30] [--every=5] [--workers=3] [--json=out.json]
//                            [--only=checkA,checkB] [--quick]
//   node tools/coherency.mjs --baseline=nightly        the nightly run (8 lives x 60 years, settings from the baseline
//                                                      file): fails only where a check found more than its baseline
//   node tools/coherency.mjs --baseline=quick --write  play a section's settings and write its counts as the baseline
//
// The baseline (tests/coherency-baseline.json) holds the known contradictions, counted per check, that later steps of
// round 2 remove (A2 one holder per post, C6 households...). Counts may only shrink: lower them when a step removes
// some (the run says so), and never raise one without a line in docs/DECISIONS.md. tests/suites/coherency.test.mjs
// holds the "quick" section in CI; .github/workflows/nightly.yml runs the "nightly" one.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { HELPERS } from '../tests/helpers.mjs';
import { watchPage } from './lib/page-errors.mjs';
import { jobsFor, runLife, countsOf, compare } from './lib/coherency-life.mjs';
export { STARTS } from './lib/coherency-life.mjs';

const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright'); }
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASEFILE = path.join(root, 'tests/coherency-baseline.json');
const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const quick = args.includes('--quick');
const file = path.resolve(root, args.find(a => !a.startsWith('--')) || 'index.html');
const SECTION = opt('baseline', null);
const BASE = fs.existsSync(BASEFILE) ? JSON.parse(fs.readFileSync(BASEFILE, 'utf8')) : {};
const sec = SECTION ? BASE[SECTION] : null;
if (SECTION && !sec) { console.error(`no section "${SECTION}" in ${path.relative(root, BASEFILE)}`); process.exit(2); }
const SEEDS = +opt('seeds', sec ? sec.seeds : quick ? 1 : 3), YEARS = +opt('years', sec ? sec.years : quick ? 12 : 30);
const EVERY = +opt('every', sec ? sec.every : quick ? 4 : 5), WORKERS = +opt('workers', 3);
const ONLY = opt('only') ? opt('only').split(',') : null;

const jobs = jobsFor(SEEDS).slice(0, sec && sec.lives ? sec.lives : Infinity);
const browser = await pw.chromium.launch();
const results = [];
const t0 = Date.now();
await Promise.all(Array.from({ length: Math.min(WORKERS, jobs.length) }, async () => {
  const ctx = await browser.newContext(), page = await ctx.newPage();
  const errs = []; watchPage(page, errs, { max: 200 });
  await page.goto(pathToFileURL(file).href);
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 180000 });
  await page.evaluate(HELPERS);
  while (jobs.length) {
    const j = jobs.shift();
    try { const r = await runLife(page, j, { years: YEARS, every: EVERY, only: ONLY }); r.errs = errs.splice(0); results.push(r); process.stdout.write(r.found.length ? 'x' : '.'); }
    catch (e) { results.push({ o: j, found: [{ check: 'the life itself', problems: [String(e.message || e).slice(0, 200)], n: 1, year: null }], impure: [], errs: errs.splice(0) }); process.stdout.write('E'); }
  }
  await ctx.close();
}));
await browser.close();
results.sort((a, b) => a.o.seed - b.o.seed);
console.log(`\n${results.length} lives, ${YEARS} years each, checked every ${EVERY} years, in ${Math.round((Date.now() - t0) / 1000)} s`);
const byCheck = {};
for (const r of results) for (const f of r.found) {
  const b = byCheck[f.check] = byCheck[f.check] || { owner: f.owner, lives: new Set(), n: 0, examples: [] };
  b.lives.add(r.o.seed); b.n += f.n;
  if (b.examples.length < 6) b.examples.push(`seed ${r.o.seed} ${r.o.status} from ${r.o.startAge}, ${f.year} (age ${f.age}): ${f.problems[0]}`);
}
const pageErrs = results.flatMap(r => (r.errs || []).map(e => `seed ${r.o.seed}: ${e}`));
const impure = results.filter(r => (r.impure || []).length).map(r => `seed ${r.o.seed}: the checks changed the game in ${r.impure.join(', ')}`);
if (!Object.keys(byCheck).length && !pageErrs.length) console.log('coherent: no contradiction found');
for (const [k, b] of Object.entries(byCheck)) {
  console.log(`\nFAIL ${k} (${b.owner}): ${b.n} problems in ${b.lives.size} of ${results.length} lives`);
  for (const e of b.examples) console.log('   ' + e);
}
if (pageErrs.length) { console.log(`\npage errors and console.errors: ${pageErrs.length}`); for (const e of pageErrs.slice(0, 8)) console.log('   ' + e); }
if (impure.length) { console.log('\nimpure checks:'); for (const e of impure) console.log('   ' + e); }
if (opt('json')) fs.writeFileSync(path.resolve(root, opt('json')), JSON.stringify(results, null, 1));
const counts = countsOf(results);
let bad = Object.keys(byCheck).length > 0;
if (SECTION) {
  if (args.includes('--write')) {
    BASE[SECTION] = { ...sec, counts };
    fs.writeFileSync(BASEFILE, JSON.stringify(BASE, null, 2) + '\n');
    console.log(`\nwrote the "${SECTION}" baseline: ${JSON.stringify(counts)}`);
  } else {
    const { rose, fell } = compare(counts, sec.counts);
    console.log(`\nagainst the "${SECTION}" baseline: ${rose.length ? 'ROSE ' + rose.join('; ') : 'no check rose'}${fell.length ? '; fell (lower the baseline): ' + fell.join('; ') : ''}`);
    bad = rose.length > 0;
  }
}
process.exitCode = bad || pageErrs.length || impure.length ? 1 : 0;
