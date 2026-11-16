// Browser tests for a built game (Playwright + Chromium).
//
//   node tests/run.mjs                               test index.html: tests/suites/* and every src/<system>/NN-name/test.mjs
//   node tests/run.mjs vendor/ardan-b593143.html     the same tests against another build (the untouched release)
//   node tests/run.mjs --only=xssSave,tokens         run some tests by name
//   node tests/run.mjs --features=chronicle          core suites plus the named features' tests
//   node tests/run.mjs --lives=12 --json=tools/bench/reports/tests.json
//
// A test is `async name(page, pageErrors, { browser, file, lives, expectError, cpu })` returning { ok, detail }, or
// { ok: true, skip: 'why' } when what it tests is not in this build (reported as SKIP, neither pass nor fail). Each test
// gets a fresh browser context (its own storage), the page already booted with window.T helpers (tests/helpers.mjs).
// Any uncaught page error, any console.error and any Content-Security-Policy violation fails the test (round 2 A3a:
// features report their caught faults with console.error, which no test used to see). The few messages that are not
// the game's faults are listed, with reasons, in tools/lib/page-errors.mjs; a test that provokes an error on purpose
// calls expectError(/pattern/) before it does. cpu() is the page's main-thread CPU time in ms (Chrome's ThreadTime):
// time with it, not the wall clock, which a loaded machine inflates (CRITIQUE Q8).
//
// The runner outlives the browser (CRITIQUE Q5): a test that crashes the browser fails with "the browser crashed", a
// new browser is launched, and the run goes on to its summary. Each test has a time limit (--limit=seconds, default
// 1800, half an hour, well inside a CI shard's two hours; a test file may give some of its tests their own: `export const limits = { testName: seconds }`).
//
// Two tiers (T1, D-063). tests/long-tests.json lists the long tests (bot lives of 200 to 1800 s); tests/test-times.json holds
// each test's measured seconds on CI (four workers). --tier=quick runs the rest (every push), --tier=long the listed ones
// (nightly, [full ci], release branches), --tier=all (the default, and what a local run does) both. --shard=k/n splits the
// chosen tier by measured time (longest first onto the lightest shard), not by count, and a shard runs its longest tests first.
//   node tests/run.mjs --tier=quick --shard=2/8 --plan      print the tier split and each shard's estimate, run nothing
//   node tests/run.mjs --check-tiers                        fail if a test over the threshold is not in the long list
//   node tests/run.mjs --times-out=t.json                   write this run's seconds (tools/test-times.mjs merges them)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { HELPERS } from './helpers.mjs';
import { featureDirs, featurePath } from '../tools/lib/features.mjs';
import { watchPage, allowed } from '../tools/lib/page-errors.mjs';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright'); }

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = k => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const file = path.resolve(root, args.find(a => !a.startsWith('--')) || 'index.html');
const only = opt('only') ? opt('only').split(',') : null;
const featFilter = opt('features') ? opt('features').split(',') : null;
const LIVES = +(opt('lives') || 6);

async function load(p, owner) {
  const m = await import(pathToFileURL(p).href), mod = m.default || {}, lim = m.limits || {};
  return Object.entries(mod).map(([name, fn]) => ({ name, fn, owner, limit: lim[name] }));
}
const tests = [];
for (const f of fs.readdirSync(path.join(root, 'tests/suites')).filter(f => f.endsWith('.test.mjs')).sort()) tests.push(...await load(path.join(root, 'tests/suites', f), 'suites/' + f));
for (const d of featureDirs().sort()) {
  const t = featurePath(d, 'test.mjs');
  if (!fs.existsSync(t)) continue;
  if (featFilter && !featFilter.includes(d.replace(/^\d+-/, ''))) continue;
  if (!featFilter && fs.existsSync(featurePath(d, '.wip'))) continue; // work in progress: only when named
  tests.push(...await load(t, path.relative(root, featurePath(d))));
}
const seen = new Set();
for (const t of tests) { if (seen.has(t.name)) throw new Error(`duplicate test name ${t.name} (${t.owner})`); seen.add(t.name); }
const readJson = (p, d) => { try { return JSON.parse(fs.readFileSync(path.join(root, p), 'utf8')); } catch { return d; } };
const LONG = readJson('tests/long-tests.json', { threshold: 200, tests: [] });
const TIMES = readJson('tests/test-times.json', {});
const LONGSET = new Set(LONG.tests), UNMEASURED = +(LONG.unmeasured || 30); // an unmeasured test is planned at 30 s
const est = t => TIMES[t.name] != null ? TIMES[t.name] : UNMEASURED;
const tierOf = t => LONGSET.has(t.name) ? 'long' : 'quick';
if (args.includes('--check-tiers')) {
  const names = new Set(tests.map(t => t.name)), bad = [];
  for (const n of LONG.tests) if (!names.has(n)) bad.push(`${n} is in tests/long-tests.json but is not a test`);
  for (const t of tests) if ((TIMES[t.name] || 0) >= LONG.threshold && !LONGSET.has(t.name)) bad.push(`${t.name} took ${TIMES[t.name]} s on CI (threshold ${LONG.threshold}) and is not in tests/long-tests.json`);
  for (const n of Object.keys(TIMES)) if (!names.has(n)) bad.push(`${n} is in tests/test-times.json but is not a test (remove it)`);
  if (bad.length) { console.error('tiers FAIL\n  ' + bad.join('\n  ')); process.exit(1); }
  console.log(`tiers ok (${LONG.tests.length} long of ${tests.length}; threshold ${LONG.threshold} s)`); process.exit(0);
}
const TIER = opt('tier') || 'all';
if (!['all', 'quick', 'long'].includes(TIER)) throw new Error(`--tier must be quick, long or all, not ${TIER}`);
if (args.includes('--list')) { for (const t of tests) console.log(t.name.padEnd(22), tierOf(t).padEnd(6), String(est(t)).padStart(5) + 's', t.owner); process.exit(0); }
// --shard=k/n: longest-first onto the lightest shard (deterministic: ties by name), over the chosen tier
const [SK, SN] = (opt('shard') || '0/1').split('/').map(Number);
const inTier = tests.filter(t => TIER === 'all' || tierOf(t) === TIER);
function plan(list, n) {
  const shards = Array.from({ length: n }, () => ({ secs: 0, tests: [] }));
  for (const t of [...list].sort((a, b) => est(b) - est(a) || (a.name < b.name ? -1 : 1))) {
    const s = shards.reduce((m, x) => x.secs < m.secs ? x : m);
    s.tests.push(t); s.secs += est(t);
  }
  return shards;
}
if (args.includes('--plan')) {
  const W = Math.max(1, +(opt('workers') || 4)), shards = plan(inTier.filter(t => !only || only.includes(t.name)), SN);
  const longest = shards.map(s => Math.max(0, ...s.tests.map(est)));
  shards.forEach((s, k) => console.log(`shard ${k}/${SN}: ${String(s.tests.length).padStart(3)} tests, ${String(s.secs).padStart(5)} s of work, about ${Math.round(Math.max(s.secs / W, longest[k]) / 60)} min on ${W} workers (longest ${longest[k]} s)${k === SK && SN > 1 ? '  <- this shard' : ''}`));
  const total = shards.reduce((a, s) => a + s.secs, 0);
  console.log(`tier ${TIER}: ${inTier.length} tests, ${total} s of work in all; slowest shard about ${Math.round(Math.max(...shards.map((s, k) => Math.max(s.secs / W, longest[k]))) / 60)} min`);
  process.exit(0);
}

// one browser, relaunched when it dies (a crash ends every context at once; the tests running then fail, the rest go on)
let browser = null, launching = null;
const getBrowser = async () => {
  if (browser && browser.isConnected()) return browser;
  if (!launching) launching = pw.chromium.launch().then(b => { browser = b; launching = null; return b; });
  return launching;
};
const results = [];
let failed = 0, skipped = 0, crashes = 0;
// tests are independent (each gets its own browser context), so several can run at once: --workers=N (CI uses 4)
const WORKERS = Math.max(1, +(opt('workers') || 1));
const LIMIT = +(opt('limit') || 1800);
console.log('testing', path.relative(root, file) || file, WORKERS > 1 ? `(${WORKERS} at a time)` : '');
// the queue: this shard's tests of the chosen tier, longest first (so no worker starts a 30-minute test last)
const queue = plan(inTier.filter(t => !only || only.includes(t.name)), SN)[SK].tests;
const crashed = e => /Target page, context or browser has been closed|Browser has been closed|browser has disconnected|Target crashed|Page crashed/i.test(String(e && e.message || e));
async function runOne({ name, fn, owner, limit: own }) {
  const t0 = Date.now(), limit = +(own || LIMIT);
  let res, ctx = null, timer = null, b = null;
  const errs = [], allow = [];
  try {
    b = await getBrowser();
    ctx = await b.newContext({ acceptDownloads: true });
    const pg = await ctx.newPage();
    watchPage(pg, t => errs.push(t), { allow, max: 300 });
    // anything the page's own security policy blocks is a bug in the policy or the page (watchPage counts the console
    // message; a refused request can also come as a warning)
    pg.on('console', m => { if (m.type() !== 'error' && /Content.Security.Policy/i.test(m.text()) && !allowed(m.text(), allow)) errs.push('CSP: ' + m.text().slice(0, 300)); });
    pg.on('crash', () => errs.push('the page crashed'));
    let cdp = null;
    const cpu = async () => { cdp = cdp || await ctx.newCDPSession(pg); if (!cdp._on) { await cdp.send('Performance.enable', { timeDomain: 'threadTicks' }); cdp._on = 1; } return (await cdp.send('Performance.getMetrics')).metrics.find(x => x.name === 'ThreadTime').value * 1000; };
    const body = (async () => {
      await pg.goto(pathToFileURL(file).href);
      await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
      await pg.evaluate(HELPERS);
      return fn(pg, errs, { browser: b, file, lives: LIVES, expectError: rx => allow.push(rx), cpu });
    })();
    body.catch(() => {});
    res = await Promise.race([body, new Promise(r => { timer = setTimeout(() => r({ ok: false, detail: `timed out after ${limit} s`, timeout: true }), limit * 1000); })]);
    res = res && typeof res === 'object' ? res : { ok: false, detail: 'the test returned ' + String(res) };
    if (errs.length && res.ok && !res.skip) res = { ok: false, detail: (res.detail || '') + `; ${errs.length} page error${errs.length > 1 ? 's' : ''}, first: ${errs[0]}` };
  } catch (e) {
    if (crashed(e) || (b && !b.isConnected())) { crashes++; res = { ok: false, detail: 'the browser crashed: ' + String(e.message || e).slice(0, 300) }; }
    else res = { ok: false, detail: String(e.message || e).slice(0, 400) };
  } finally { clearTimeout(timer); }
  const state = res.skip ? 'SKIP' : res.ok ? 'PASS' : 'FAIL';
  if (state === 'FAIL') failed++; else if (state === 'SKIP') skipped++;
  const secs = (Date.now() - t0) / 1000;
  results.push({ name, owner, ok: !!res.ok && !res.skip, state, secs, detail: res.skip ? res.skip : res.detail, data: res.data });
  console.log(`${state}  ${name.padEnd(20)} ${secs.toFixed(1).padStart(5)}s  ${res.skip ? 'skipped: ' + res.skip : res.detail}`);
  // a test that ran out of time may still be running in its page: close it, and if that hangs, drop the browser
  if (ctx) {
    const closed = await Promise.race([ctx.close().then(() => true, () => false), new Promise(r => setTimeout(() => r(false), 30000))]);
    if (!closed && b && b.isConnected()) { crashes++; await b.close().catch(() => {}); }
  }
}
await Promise.all(Array.from({ length: Math.min(WORKERS, queue.length) }, async () => { while (queue.length) await runOne(queue.shift()); }));
if (browser) await browser.close().catch(() => {});
const passed = results.length - failed - skipped;
console.log(`${passed} passed, ${failed} failed, ${skipped} skipped of ${results.length}${crashes ? `; ${crashes} lost to a browser crash or hang (a new browser took over)` : ''}`);
if (opt('times-out')) {
  const out = {};
  for (const r of results) if (r.state === 'PASS') out[r.name] = Math.round(r.secs);
  fs.mkdirSync(path.dirname(path.resolve(root, opt('times-out'))), { recursive: true });
  fs.writeFileSync(path.resolve(root, opt('times-out')), JSON.stringify(out, null, 1));
}
if (opt('json')) {
  fs.mkdirSync(path.dirname(path.resolve(root, opt('json'))), { recursive: true });
  fs.writeFileSync(path.resolve(root, opt('json')), JSON.stringify({ file: path.relative(root, file), build: null, passed, failed, skipped, crashes, results }, null, 1));
}
process.exit(failed ? 1 : 0);
