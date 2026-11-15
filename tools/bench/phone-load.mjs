// The phone bench (step X7, owner order 34: "the game takes a very long time to load up and process on a phone"). Loads
// the built page as a phone (Playwright's 'Pixel 7': 412 px, touch, DPR 2.6) under CDP CPU throttling and reports what a
// player waits for: the title screen, the title's world, a new life's first Life screen, and a Next month press at year
// 0 and year 50 (the committed saves in tests/saves/press/).
//
//   node tools/bench/phone-load.mjs [built.html] [--rates=1,4,6] [--runs=1] [--presses=6] [--device="Pixel 7"]
//        [--profile] [--top=40] [--tag=x] [--out=tools/bench/reports] [--json-only]
//
// Two kinds of number, both per throttle rate:
//   wait: in-page performance.now() from navigation (the boot marks of the page's own loader, window.ARDAN_BOOT, plus
//         this bench's), the time a phone player actually waits. At rate 4 or 6 this stands for a mid-range phone.
//   cpu:  main-thread CPU (CDP Performance metrics, timeDomain threadTicks) over the same span. At rate 1 it is the work
//         itself; throttled, CDP's throttler inflates it, so read the wait column there.
// --profile: a V8 CPU profile (CDP Profiler) of the boot and the new life at rate 1, folded by function and by source
//   (core blob, event packs, lore, the loader), the top --top self-time rows written into the report.
// Writes <out>/phone-<tag>.json and .md. Exit code 1 if the page logged an error.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { watchPage } from '../lib/page-errors.mjs';
import { INSTALL } from './next-month-speed.mjs';

const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright'); }
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const arg = (k, d) => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const HTML = path.resolve(args.find(a => !a.startsWith('--')) || path.join(root, 'index.html'));
const RATES = arg('rates', '1,4,6').split(',').map(Number), RUNS = +arg('runs', 1), PRESSES = +arg('presses', 6);
const DEVICE = arg('device', 'Pixel 7'), PROFILE = args.includes('--profile'), TOP = +arg('top', 40), TAG = arg('tag', 'phone');
const OUT = path.resolve(arg('out', path.join(root, 'tools/bench/reports')));
const SAVES = path.join(root, 'tests/saves/press');
const TMP = '/tmp/ardan/phone-load';
const med = a => { const b = a.filter(x => x != null).sort((x, y) => x - y); return b.length ? b[b.length >> 1] : null; };
const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${TAG}:`, ...a);

// the page's own timeline: each mark is ms from navigation start
const STAGES = [
  ['core ran', 'the core blob unpacked and run'],
  ['title shown', 'UI.init: the title screen drawn'],
  ['title painted', 'the first frame after it'],
  ['content ran', 'the event packs run (ARDAN_CONTENT_READY)'],
  ['title world', 'the title\'s world made and its map drawn'],
  ['lore unpacked', 'the lore tables unpacked in the background'],
  ['idle', 'the main thread quiet (no task over 50 ms for 500 ms)'],
  ['continent ready', 'the new life\'s continent built ahead in a worker (X7; worker time scaled by the rate)'],
];

async function openPage(browser, rate, errs, profile) {
  const ctx = await browser.newContext({ ...pw.devices[DEVICE] });
  const page = await ctx.newPage(); page.setDefaultTimeout(1800000);
  watchPage(page, errs);
  // a blank file page first, so the CDP session (throttle, metrics, profiler) is on the renderer the game will use
  fs.mkdirSync(TMP, { recursive: true }); fs.writeFileSync(path.join(TMP, 'blank.html'), '<!doctype html><title>blank</title>');
  await page.goto(pathToFileURL(path.join(TMP, 'blank.html')).href);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable', { timeDomain: 'threadTicks' });
  if (rate > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate });
  if (profile) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start'); }
  await page.addInitScript(() => {
    // long tasks and the bench's own marks; the loader's marks are in window.ARDAN_BOOT
    const L = window.__LT = [];
    try { new PerformanceObserver(l => { for (const e of l.getEntries()) L.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type: 'longtask', buffered: true }); } catch (e) {}
  });
  const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  return { ctx, page, cdp, metrics };
}

const nextFrame = () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));

async function boot(browser, rate, errs, profile) {
  const P = await openPage(browser, rate, errs, profile);
  const { page, metrics } = P;
  const m0 = await metrics();
  await page.goto(pathToFileURL(HTML).href);
  // the first frame after the title is drawn (the loader sets ARDAN_READY right after UI.init)
  await page.waitForFunction(() => window.ARDAN_READY === true, null, { polling: 'raf' });
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => { window.ARDAN_BOOT['title painted'] = Math.round(performance.now()); r(); })));
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { polling: 50 });
  await page.waitForFunction(() => typeof A !== "undefined" && A.S && A.S.prov && A.S.prov.length > 0, null, { polling: 50 });
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => { window.ARDAN_BOOT['title world'] = Math.round(performance.now()); r(); })));
  await page.waitForFunction(() => window.ARDAN_BOOT['ardan-lore unpacked'] != null, null, { polling: 50 });
  // quiet: no long task for 500 ms
  const idle = await page.evaluate(() => new Promise(r => {
    const t0 = performance.now(), check = () => { const L = window.__LT, last = L.length ? L[L.length - 1][0] + L[L.length - 1][1] : 0, now = performance.now(); if (now - Math.max(last, t0) > 500 || now - t0 > 60000) r(Math.round(Math.max(last, t0))); else setTimeout(check, 100); }; check();
  }));
  const m1 = await metrics();
  const marks = await page.evaluate(() => Object.assign({}, window.ARDAN_BOOT));
  marks['lore unpacked'] = marks['ardan-lore unpacked'];
  marks.idle = idle;
  // the continent built ahead in a worker (99991-v2-map/e-ahead.core.js), when the build has one: when it was ready
  const ahead = await page.evaluate(async () => {
    const H = typeof A !== 'undefined' && A.V2MAP && A.V2MAP.AHEAD; if (!H) return null;
    const t0 = performance.now(); while (!(H.built || H.failed || H.err) && performance.now() - t0 < 180000) await new Promise(r => setTimeout(r, 50));
    return { sent: H.sent || null, at: H.at || null, built: H.built, ms: H.ms[0] || null, failed: H.failed, err: H.err };
  });
  // CDP cannot throttle a worker ("only supported for pages"), and a phone's other cores are about as slow as its first:
  // the worker's time from the request to the world's arrival is scaled by the rate, as if it had run throttled
  if (ahead && ahead.at && ahead.sent != null) ahead.atPhone = Math.round(ahead.sent + (ahead.at - ahead.sent) * rate);
  marks['continent ready'] = ahead && (ahead.atPhone || ahead.at);
  const lt = await page.evaluate(() => window.__LT.slice());
  return Object.assign(P, { marks, bootCpu: Math.round((m1.ThreadTime - m0.ThreadTime) * 1000), bootScript: Math.round((m1.ScriptDuration - m0.ScriptDuration) * 1000),
    bootStyle: Math.round((m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000), bootLayout: Math.round((m1.LayoutDuration - m0.LayoutDuration) * 1000), longTasks: lt, ahead });
}

// Begin a new life with the creation screen's defaults and a fixed seed, to the first Life screen
async function newLife(P) {
  const { page, metrics } = P;
  const a = await metrics();
  const r = await page.evaluate(async () => {
    const frame = () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));
    const t0 = performance.now();
    document.querySelector('[data-a="newLife"]').click();
    await frame();
    const tCreate = performance.now();
    // no seed typed: the life's seed is the one drawn ahead (UI.lifeSeed), as for a player who leaves it blank
    const builds0 = A.V2MAP && A.V2MAP.stats ? A.V2MAP.stats.builds : 0;
    const b = [...document.querySelectorAll('[data-a="startLife"]')].find(x => x.getClientRects().length);
    if (b) b.click(); else UI.A.startLife();
    for (let g = 0; g < 400 && UI.screen !== 'game'; g++) await frame();
    await frame();
    return { built: (A.V2MAP && A.V2MAP.stats ? A.V2MAP.stats.builds : 0) - builds0, create: Math.round(tCreate - t0), life: Math.round(performance.now() - tCreate), screen: UI.screen, tab: UI.tab, modal: !!document.querySelector('#modal'), year: A.S.year };
  });
  const b = await metrics();
  return Object.assign(r, { cpu: Math.round((b.ThreadTime - a.ThreadTime) * 1000), script: Math.round((b.ScriptDuration - a.ScriptDuration) * 1000), style: Math.round((b.RecalcStyleDuration - a.RecalcStyleDuration) * 1000), layout: Math.round((b.LayoutDuration - a.LayoutDuration) * 1000) });
}

// N real Next month presses on a committed save, on the phone layout
async function presses(browser, rate, save, n, errs) {
  const P = await openPage(browser, 1, errs, false);
  const { page, metrics, cdp } = P;
  await page.goto(pathToFileURL(HTML).href);
  // the boot's background work done (the title's world, the lore), so it is not counted in the save's opening
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true && typeof A !== 'undefined' && A.S && A.S.prov && A.S.prov.length > 0 && window.ARDAN_BOOT['ardan-lore unpacked'] != null, null, { polling: 50 });
  await page.evaluate(() => new Promise(r => setTimeout(r, 300)));
  const b64 = fs.readFileSync(path.join(SAVES, save)).toString('base64');
  const a0 = await metrics();
  const load = await page.evaluate(async b64 => {
    const t0 = performance.now();
    const bin = atob(b64), bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const d = await SAVES.decode(bytes); const ok = UI.enterSaveSafe(d); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render();
    await new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));
    return { ok, wall: Math.round(performance.now() - t0) };
  }, b64);
  const a1 = await metrics();
  if (load.ok === false) throw new Error('save did not load: ' + save);
  await page.evaluate(INSTALL, false);
  if (rate > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate });
  const rows = [];
  for (let i = 0; i < n; i++) {
    const a = await metrics();
    const r = await page.evaluate(() => __P.press());
    await page.evaluate(() => new Promise(r => setTimeout(r, 250)));
    const b = await metrics();
    rows.push({ why: r.why, kind: r.kind, days: r.days, cards: r.cards, wall: r.wall, cpu: Math.round((b.ThreadTime - a.ThreadTime) * 1000), engine: r.engine });
    if (r.why !== 'ok') break;
  }
  await P.ctx.close();
  const months = rows.filter(r => r.kind === 'v2Next' && r.days >= 25), quiet = months.filter(r => r.cards === 0);
  return { save, loadCpu: Math.round((a1.ThreadTime - a0.ThreadTime) * 1000), months: months.length, quiet: quiet.length,
    wall: med(months.map(r => r.wall)), quietWall: med(quiet.map(r => r.wall)), cpu: med(months.map(r => r.cpu)), quietCpu: med(quiet.map(r => r.cpu)), engine: med(months.map(r => r.engine)), rows };
}

// fold a V8 CPU profile: self time by function and by source
function fold(profile, sources) {
  const byId = new Map(profile.nodes.map(n => [n.id, n]));
  const self = new Map();
  const dt = profile.timeDeltas; let i = 0;
  for (const id of profile.samples) { self.set(id, (self.get(id) || 0) + (dt[i++] || 0)); }
  const fn = new Map(), src = new Map();
  for (const [id, us] of self) {
    const n = byId.get(id), cf = n.callFrame;
    const where = sources(cf);
    const key = `${cf.functionName || '(anonymous)'} ${where}:${cf.lineNumber + 1}`;
    fn.set(key, (fn.get(key) || 0) + us);
    src.set(where, (src.get(where) || 0) + us);
  }
  const top = m => [...m].sort((a, b) => b[1] - a[1]).map(([k, us]) => [k, Math.round(us / 1000)]);
  return { total: Math.round([...self.values()].reduce((a, b) => a + b, 0) / 1000), byFunction: top(fn).slice(0, TOP), bySource: top(src) };
}

async function main() {
  const browser = await pw.chromium.launch({ args: ['--enable-precise-memory-info'] });
  const errs = [];
  const res = { tag: TAG, html: path.relative(root, HTML) || HTML, device: DEVICE, rates: {}, when: new Date().toISOString() };
  for (const rate of RATES) {
    const runs = [];
    for (let k = 0; k < RUNS; k++) {
      const prof = PROFILE && rate === 1 && k === 0;
      const P = await boot(browser, rate, errs, prof);
      const nl = await newLife(P);
      let profile = null;
      if (prof) {
        const { profile: pr } = await P.cdp.send('Profiler.stop');
        // the scripts: the loader and fzstd are in the page, the blobs run as inline <script>s with no URL; tell them apart by script id order
        const ids = [...new Set(pr.nodes.map(n => n.callFrame.scriptId))].map(Number).filter(x => x > 0).sort((a, b) => a - b);
        const urlOf = new Map(pr.nodes.map(n => [n.callFrame.scriptId, n.callFrame.url]));
        const named = new Map();
        // the core blob is the largest by line numbers seen; the event packs are the many small no-URL scripts after it
        const maxLine = new Map(); for (const n of pr.nodes) maxLine.set(n.callFrame.scriptId, Math.max(maxLine.get(n.callFrame.scriptId) || 0, n.callFrame.lineNumber));
        let coreId = null; for (const id of ids) { const s = String(id); if (!urlOf.get(s) && (coreId === null || maxLine.get(s) > maxLine.get(coreId))) coreId = s; }
        for (const id of ids) { const s = String(id); named.set(s, urlOf.get(s) ? 'page' : s === coreId ? 'core' : +s < +coreId ? 'loader' : 'pack#' + s); }
        profile = fold(pr, cf => cf.scriptId === '0' ? (cf.functionName.startsWith('(') ? cf.functionName : 'native') : (named.get(cf.scriptId) || 'script#' + cf.scriptId).replace(/^pack#\d+$/, m => 'packs'));
        fs.mkdirSync(TMP, { recursive: true }); fs.writeFileSync(path.join(TMP, `profile-${TAG}.cpuprofile`), JSON.stringify(pr));
      }
      await P.ctx.close();
      runs.push({ marks: P.marks, bootCpu: P.bootCpu, bootScript: P.bootScript, bootStyle: P.bootStyle, bootLayout: P.bootLayout, longest: P.longTasks.reduce((a, t) => Math.max(a, t[1]), 0), newLife: nl, profile });
      log(`rate ${rate} run ${k}: title ${P.marks['title painted']} ms, content ${P.marks['content ran']}, title world ${P.marks['title world']}, idle ${P.marks.idle}; boot cpu ${P.bootCpu} (script ${P.bootScript}, style ${P.bootStyle}, layout ${P.bootLayout}); new life: create ${nl.create} + life ${nl.life} ms, cpu ${nl.cpu}, built ${nl.built}${P.ahead ? '; continent ahead ' + JSON.stringify(P.ahead) : ''}`);
    }
    const y0 = await presses(browser, rate, 'y0-noble.ardan', PRESSES, errs);
    log(`rate ${rate} y0: press median wall ${y0.wall} ms (quiet ${y0.quietWall}), cpu ${y0.cpu}, engine ${y0.engine}; load cpu ${y0.loadCpu}`);
    const y50 = await presses(browser, rate, 'y50-noble.ardan', PRESSES, errs);
    log(`rate ${rate} y50: press median wall ${y50.wall} ms (quiet ${y50.quietWall}), cpu ${y50.cpu}, engine ${y50.engine}; load cpu ${y50.loadCpu}`);
    const M = k => med(runs.map(r => r.marks[k]));
    res.rates[rate] = {
      marks: Object.fromEntries(STAGES.map(([k]) => [k, M(k)])), bootCpu: med(runs.map(r => r.bootCpu)), bootScript: med(runs.map(r => r.bootScript)), longest: med(runs.map(r => r.longest)),
      newLife: { create: med(runs.map(r => r.newLife.create)), life: med(runs.map(r => r.newLife.life)), cpu: med(runs.map(r => r.newLife.cpu)) },
      toFirstLife: med(runs.map(r => Math.max(r.marks['title world'], r.marks['continent ready'] || 0) + r.newLife.create + r.newLife.life)),
      builtOnBegin: med(runs.map(r => r.newLife.built)),
      y0: { wall: y0.wall, quietWall: y0.quietWall, cpu: y0.cpu, engine: y0.engine, months: y0.months, loadCpu: y0.loadCpu },
      y50: { wall: y50.wall, quietWall: y50.quietWall, cpu: y50.cpu, engine: y50.engine, months: y50.months, loadCpu: y50.loadCpu },
      runs,
    };
  }
  await browser.close();
  res.errors = errs;
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, `phone-${TAG}.json`), JSON.stringify(res, null, 1));
  // the table
  const L = [`# Phone bench: ${res.html} (${DEVICE}), ${res.when.slice(0, 16)}`, '',
    'Wait = in-page ms from navigation (what the player waits); CPU = main-thread CPU at rate 1 (throttled CPU is inflated by the throttler).', '',
    `| | ${RATES.map(r => r + 'x').join(' | ')} |`, `| --- | ${RATES.map(() => '---:').join(' | ')} |`];
  const row = (name, f) => L.push(`| ${name} | ${RATES.map(r => { const v = f(res.rates[r]); return v == null ? '-' : v; }).join(' | ')} |`);
  for (const [k, what] of STAGES) row(`${k} (${what})`, x => x.marks[k]);
  row('boot CPU to idle', x => x.bootCpu);
  row('longest task in the boot', x => x.longest);
  row('new life: the creation screen', x => x.newLife.create);
  row('new life: Begin to the first Life screen', x => x.newLife.life);
  row('continents built on the page after Begin', x => x.builtOnBegin);
  row('**to the first Life screen** (the later of title world and continent ready, + create + begin)', x => x.toFirstLife);
  row('Next month, year 0 (median wall)', x => x.y0.wall);
  row('Next month, year 0 (quiet, wall)', x => x.y0.quietWall);
  row('Next month, year 50 (median wall)', x => x.y50.wall);
  row('Next month, year 50 (quiet, wall)', x => x.y50.quietWall);
  row('Next month, year 50: engine share', x => x.y50.engine);
  row('opening the year 50 save (CPU)', x => x.y50.loadCpu);
  const pr = res.rates[1] && res.rates[1].runs[0].profile;
  if (pr) {
    L.push('', `## Where the time goes (rate 1, boot and new life, ${pr.total} ms of samples)`, '', '| source | ms |', '| --- | ---: |');
    for (const [k, v] of pr.bySource.slice(0, 14)) L.push(`| ${k} | ${v} |`);
    L.push('', '| function (self time) | ms |', '| --- | ---: |');
    for (const [k, v] of pr.byFunction) L.push(`| \`${k.replace(/\|/g, '/')}\` | ${v} |`);
  }
  if (errs.length) L.push('', `**Errors (${errs.length}):** ` + errs.slice(0, 5).join(' / '));
  fs.writeFileSync(path.join(OUT, `phone-${TAG}.md`), L.join('\n') + '\n');
  console.log(L.join('\n'));
  if (errs.length) process.exitCode = 1;
}

main().catch(e => { console.error(e.stack || e); process.exit(1); });
