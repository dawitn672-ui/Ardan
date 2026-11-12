// The coherency checks over many lives (round 2, Foundations item 3). Plays lives of every class by code and, every
// --every years, runs A.COHERENCY.run() (src/core/08-coherency-checks and every check a feature registers). Prints each
// contradiction found, with the seed, the year and ids, and exits 1 if there was any. Run it after every update and
// fix what it finds before calling the update done.
//
//   node tools/coherency.mjs [built.html] [--seeds=3] [--years=30] [--every=5] [--workers=3] [--json=out.json]
//                            [--only=checkA,checkB] [--quick]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { HELPERS } from '../tests/helpers.mjs';

const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright'); }
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const quick = args.includes('--quick');
const file = path.resolve(root, args.find(a => !a.startsWith('--')) || 'index.html');
const SEEDS = +opt('seeds', quick ? 1 : 3), YEARS = +opt('years', quick ? 12 : 30), EVERY = +opt('every', quick ? 4 : 5), WORKERS = +opt('workers', 3);
const ONLY = opt('only') ? opt('only').split(',') : null;

// every class and the paths the owner plays: born a peasant, a noble who joins the army, a soldier, a royal heir...
export const STARTS = [
  { status: 'peasant', startAge: 0, sex: 'M', realm: 'POL-01' },
  { status: 'noble', startAge: 16, sex: 'M', realm: 'POL-03', enlist: true },
  { status: 'peasant', startAge: 17, sex: 'M', realm: 'POL-06', enlist: true },
  { status: 'noble', startAge: 20, sex: 'F', realm: 'POL-01' },
  { status: 'merchant', startAge: 25, sex: 'M', realm: 'POL-04' },
  { status: 'royal', startAge: 18, sex: 'M', realm: 'POL-02' },
  { status: 'serf', startAge: 20, sex: 'F', realm: 'POL-05' },
  { status: 'artisan', startAge: 30, sex: 'M', realm: 'POL-20', race: 'dwarf' },
];
const jobs = [];
for (let s = 0; s < SEEDS; s++) for (const st of STARTS) jobs.push({ seed: 7100 + s * 13 + jobs.length, ...st });

async function runLife(page, j) {
  return page.evaluate(async ([j, YEARS, EVERY, ONLY]) => {
    const o = { seed: j.seed, race: j.race || 'human', realm: j.realm, status: j.status, sex: j.sex, startAge: j.startAge };
    T.enter(o);
    const found = [];
    const check = () => { for (const f of A.COHERENCY.run(ONLY)) found.push({ year: A.S.year, age: A.age(A.pc()), ...f }); };
    check();
    // a soldier's life: take the enlisting offer when it comes (the bot would refuse it as often as not)
    const enlist = () => { if (!j.enlist || !A.pc() || A.pc().mil) return; const h = A.headReady(); if (!h || h.type !== 'event') return;
      const v = A.eventView(h); const k = v && v.choices ? v.choices.findIndex(c => /enlist|join|take the coin|sign|swear/i.test(c.t || c.label || '')) : -1; if (k >= 0) { A.eventChoose(k); A.eventClose(); } };
    for (let y = 0; y < YEARS; y += EVERY) {
      const r = T.play(EVERY, { each: enlist });
      check();
      if (r === 'dead') break;
    }
    return { o, found, end: A.S.year, alive: !!(A.pc() && A.pc().alive) };
  }, [j, YEARS, EVERY, ONLY]);
}

const browser = await pw.chromium.launch();
const results = [];
const t0 = Date.now();
await Promise.all(Array.from({ length: Math.min(WORKERS, jobs.length) }, async () => {
  const ctx = await browser.newContext(), page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  await page.goto(pathToFileURL(file).href);
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 180000 });
  await page.evaluate(HELPERS);
  while (jobs.length) {
    const j = jobs.shift();
    try { const r = await runLife(page, j); r.errs = errs.splice(0); results.push(r); process.stdout.write(r.found.length ? 'x' : '.'); }
    catch (e) { results.push({ o: j, found: [{ check: 'the life itself', problems: [String(e.message || e).slice(0, 200)], n: 1, year: null }], errs: errs.splice(0) }); process.stdout.write('E'); }
  }
  await ctx.close();
}));
await browser.close();
console.log(`\n${results.length} lives, ${YEARS} years each, checked every ${EVERY} years, in ${Math.round((Date.now() - t0) / 1000)} s`);
const byCheck = {};
for (const r of results) for (const f of r.found) {
  const b = byCheck[f.check] = byCheck[f.check] || { owner: f.owner, lives: new Set(), n: 0, examples: [] };
  b.lives.add(r.o.seed); b.n += f.n;
  if (b.examples.length < 6) b.examples.push(`seed ${r.o.seed} ${r.o.status} from ${r.o.startAge}, ${f.year} (age ${f.age}): ${f.problems[0]}`);
}
const pageErrs = results.flatMap(r => (r.errs || []).map(e => `seed ${r.o.seed}: ${e}`));
if (!Object.keys(byCheck).length && !pageErrs.length) console.log('coherent: no contradiction found');
for (const [k, b] of Object.entries(byCheck)) {
  console.log(`\nFAIL ${k} (${b.owner}): ${b.n} problems in ${b.lives.size} of ${results.length} lives`);
  for (const e of b.examples) console.log('   ' + e);
}
if (pageErrs.length) { console.log(`\npage errors: ${pageErrs.length}`); for (const e of pageErrs.slice(0, 8)) console.log('   ' + e); }
if (opt('json')) fs.writeFileSync(path.resolve(root, opt('json')), JSON.stringify(results, null, 1));
process.exitCode = Object.keys(byCheck).length || pageErrs.length ? 1 : 0;
