// Browser tests for a built game (Playwright + Chromium).
//
//   node tests/run.mjs                               test index.html: tests/suites/* and every features/*/test.mjs
//   node tests/run.mjs vendor/ardan-b593143.html     the same tests against another build (the untouched release)
//   node tests/run.mjs --only=xssSave,tokens         run some tests by name
//   node tests/run.mjs --features=chronicle          core suites plus the named features' tests
//   node tests/run.mjs --lives=12 --json=reports/tests.json
//
// A test is `async name(page, pageErrors, { browser, file, lives })` returning { ok, detail }. Each test gets a fresh
// browser context (its own storage), the page already booted with window.T helpers (tests/helpers.mjs). Any page error
// or Content-Security-Policy violation fails the test.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { HELPERS } from './helpers.mjs';

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
  const mod = (await import(pathToFileURL(p).href)).default || {};
  return Object.entries(mod).map(([name, fn]) => ({ name, fn, owner }));
}
const tests = [];
for (const f of fs.readdirSync(path.join(root, 'tests/suites')).filter(f => f.endsWith('.test.mjs')).sort()) tests.push(...await load(path.join(root, 'tests/suites', f), 'suites/' + f));
for (const d of fs.readdirSync(path.join(root, 'features')).sort()) {
  const t = path.join(root, 'features', d, 'test.mjs');
  if (!fs.existsSync(t)) continue;
  if (featFilter && !featFilter.includes(d.replace(/^\d+-/, ''))) continue;
  if (!featFilter && fs.existsSync(path.join(root, 'features', d, '.wip'))) continue; // work in progress: only when named
  tests.push(...await load(t, 'features/' + d));
}
const seen = new Set();
for (const t of tests) { if (seen.has(t.name)) throw new Error(`duplicate test name ${t.name} (${t.owner})`); seen.add(t.name); }
if (args.includes('--list')) { for (const t of tests) console.log(t.name.padEnd(22), t.owner); process.exit(0); }

const browser = await pw.chromium.launch();
const results = [];
let failed = 0;
console.log('testing', path.relative(root, file) || file);
for (const { name, fn, owner } of tests) {
  if (only && !only.includes(name)) continue;
  const ctx = await browser.newContext({ acceptDownloads: true });
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e.stack || e).slice(0, 300)));
  // anything the page's own security policy blocks is a bug in the policy or the page
  pg.on('console', m => { if (/Content.Security.Policy/i.test(m.text()) && !/__csp|data-pwn|\/x'/.test(m.text())) errs.push('CSP: ' + m.text().slice(0, 300)); });
  const t0 = Date.now();
  let res;
  try {
    await pg.goto(pathToFileURL(file).href);
    await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
    await pg.evaluate(HELPERS);
    res = await fn(pg, errs, { browser, file, lives: LIVES });
    if (errs.length && res.ok) res = { ok: false, detail: res.detail + `; page error: ${errs[0]}` };
  } catch (e) { res = { ok: false, detail: String(e.message || e).slice(0, 400) }; }
  if (!res.ok) failed++;
  const secs = (Date.now() - t0) / 1000;
  results.push({ name, owner, ok: res.ok, secs, detail: res.detail, data: res.data });
  console.log(`${res.ok ? 'PASS' : 'FAIL'}  ${name.padEnd(20)} ${secs.toFixed(1).padStart(5)}s  ${res.detail}`);
  await ctx.close();
}
await browser.close();
console.log(failed ? `${failed} of ${results.length} failed` : `all ${results.length} passed`);
if (opt('json')) {
  fs.mkdirSync(path.dirname(path.resolve(root, opt('json'))), { recursive: true });
  fs.writeFileSync(path.resolve(root, opt('json')), JSON.stringify({ file: path.relative(root, file), build: null, results }, null, 1));
}
process.exit(failed ? 1 : 0);
