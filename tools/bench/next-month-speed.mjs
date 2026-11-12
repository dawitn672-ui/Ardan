// The press harness (round 2 A0, docs/CRITIQUE.md Q7; the measuring tool step A1 builds its CI gate on): real "Next
// month" presses through the page's own click router, measured in main-thread CPU time (CDP Performance metrics,
// timeDomain threadTicks), never wall time.
//
//   node tools/bench/next-month-speed.mjs [built.html] [--state=save.json | --new=seed:status:sex:age] [--n=30] [--w=1366]
//        [--tag=x] [--out=dir] [--hints=on|off] [--death] [--notimed] [--settle=250] [--ablate=has,hasbody,log2,passes,sweep]
//        [--dump=state.json] [--shot=shot.png]
//
// Each press: click the visible Next month (or Next week on campaign) button; answer every card by clicking its first
// enabled choice, then its Close; other prompts are skipped; the press ends when the stepper stops with an empty queue.
// --death: the player dies first (the engine's own A.pcDeath, the death screen drawn) and play goes on as an heir, the
// "after a death" state of A1's budget. --notimed: UI.clkLight's 1.5 s wall-clock redraw is held off. Reports per press:
// CPU, CPU with the settle, script, layout and style time, forced layouts and style recalcs, and counts of UI.refresh,
// refreshTab, render, renderModal, clkPaint and day ticks; a summary line of medians. Writes <out>/press-<tag>.json and
// .log (default out: /tmp/ardan/press, private scratch).
//
// Moved here from tools/critique-probes/engineering/.../final/press.cjs (the deciding engineering critic's harness,
// docs/reviews/round-2/final-engineering.md); cleaned to take the build's path and an output folder.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { watchPage } from '../lib/page-errors.mjs';

const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright'); }
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const arg = (k, d) => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const flag = k => args.includes(`--${k}`) || arg(k, '0') === '1';
const HTML = path.resolve(args.find(a => !a.startsWith('--')) || path.join(root, 'index.html'));
const TAG = arg('tag', 'press'), W = +arg('w', 1366), N = +arg('n', 30), STATE = arg('state', null), NEW = arg('new', null), NOTIMED = flag('notimed');
const SETTLE = +arg('settle', 250), DUMP = arg('dump', null), SHOT = arg('shot', null), DEATH = flag('death');
const ABL = (arg('ablate', '') || '').split(',').filter(Boolean), HINTS = arg('hints', 'on');
const OUT = path.resolve(arg('out', '/tmp/ardan/press'));
const log = (...a) => { fs.mkdirSync(OUT, { recursive: true }); const s = `[${new Date().toISOString().slice(11, 19)}] ${TAG}: ` + a.join(' '); console.log(s); fs.appendFileSync(`${OUT}/press-${TAG}.log`, s + '\n'); };

// installed in the page: counters on the redraw functions, and __P.press(), one real press
export const INSTALL = (NOTIMED) => {
  const P = window.__P = { c: {}, timed: 0, changed: 0 };
  const cnt = (o, k, name) => { const f = o[k]; if (typeof f !== 'function') return; o[k] = function () { P.c[name] = (P.c[name] || 0) + 1; return f.apply(this, arguments); }; };
  cnt(UI, 'render', 'render'); cnt(UI, 'refresh', 'refresh'); cnt(UI, 'refreshTab', 'refreshTab'); cnt(UI, 'renderModal', 'renderModal'); cnt(UI, 'clkPaint', 'clkPaint'); cnt(A, 'dayTick', 'dayTick'); cnt(UI, 'toast', 'toast');
  const cl = UI.clkLight;
  if (typeof cl === 'function') UI.clkLight = function () {
    P.c.clkLight = (P.c.clkLight || 0) + 1;
    try {
      const S = A.S, logN = S.log.reduce((a, e) => a + e.lines.length, 0) + S.log.length, changed = logN !== UI.clk.lastLog || UI.clk.dirty, timed = Date.now() - UI.clk.lastRefresh > 1500;
      if (changed) P.changed++; else if (timed) { P.timed++; if (NOTIMED) UI.clk.lastRefresh = Date.now(); }
    } catch (e) {}
    return cl.apply(this, arguments);
  };
  P.nextBtn = () => [...document.querySelectorAll('[data-a="v2Next"],[data-a="v2Week"],[data-a="v2Day"],[data-a="stepGo"]')].filter(b => b.getClientRects().length && b.getAttribute('aria-disabled') !== 'true').sort((a, b) => ['v2Next', 'v2Week', 'stepGo', 'v2Day'].indexOf(a.dataset.a) - ['v2Next', 'v2Week', 'stepGo', 'v2Day'].indexOf(b.dataset.a))[0];
  P.press = async () => {
    const ST = UI.stepper, sleep = ms => new Promise(r => setTimeout(r, ms)), t0 = performance.now(), day0 = A.absDay();
    let cards = 0, prompts = 0, guard = 0, fallback = 0, why = 'ok';
    P.c = {}; P.timed = 0; P.changed = 0;
    const btn = P.nextBtn(), kind = btn ? btn.dataset.a : null;
    if (btn) btn.click();
    for (; ;) {
      if (++guard > 8000) { why = 'timeout'; break; }
      const pc = A.pc(); if (!pc || !pc.alive) { why = 'dead'; break; }
      const q = A.S.queue[0], modal = document.querySelector('#modal');
      if (q && modal) {
        if (q.type === 'event') {
          if (!q.result) {
            const b = modal.querySelector('button[data-a="evChoose"]:not([disabled]):not([aria-disabled="true"])');
            if (b) { b.click(); cards++; } else { fallback++; try { A.eventAuto(); } catch (e) { A.skipPrompt(); } UI.refresh(); cards++; }
          } else { const c = modal.querySelector('[data-a="evClose"]'); if (c) c.click(); else { fallback++; A.eventClose(); UI.refresh(); } }
        } else { prompts++; A.skipPrompt(); UI.refresh(); }
        await sleep(0); continue;
      }
      if (q && !modal) { if (A.headReady()) UI.refresh(); await sleep(0); continue; }
      if (ST && ST.run && !ST.wait) { await sleep(4); continue; }
      if (ST && ST.run && ST.wait) { if (UI.stepGo) UI.stepGo(); await sleep(0); continue; }
      if (!btn) { why = 'no button'; }
      break;
    }
    return { why, kind, cards, prompts, fallback, days: A.absDay() - day0, wall: Math.round(performance.now() - t0), c: P.c, timed: P.timed, changed: P.changed, year: A.S.year, age: A.pc() ? A.age(A.pc()) : null,
      logLines: A.S.log.reduce((a, e) => a + e.lines.length, 0), doc: document.getElementsByTagName('*').length };
  };
};

async function main() {
  const browser = await pw.chromium.launch({ args: ['--enable-precise-memory-info', '--js-flags=--expose-gc'] });
  const phone = W < 500;
  const ctx = await browser.newContext({ viewport: { width: W, height: phone ? 860 : 900 }, deviceScaleFactor: 1, hasTouch: phone, isMobile: phone });
  const page = await ctx.newPage(); page.setDefaultTimeout(1800000);
  const errs = [];
  watchPage(page, errs);   // a press that logs an error fails the harness (round 2 A3a); warnings are kept apart
  const warns = []; page.on('console', m => { if (m.type() === 'warning') warns.push('warning: ' + m.text().slice(0, 300)); });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable', { timeDomain: 'threadTicks' });
  const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  await page.goto(pathToFileURL(HTML).href);
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 1800000 });
  if (STATE) { const s = fs.readFileSync(STATE, 'utf8'); await page.evaluate(s => { A.deserialize(JSON.parse(s)); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render(); }, s); }
  else { const [seed, status, sex, age] = (NEW || '42:noble:M:16').split(':'); await page.evaluate(o => { A.newGame(o); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render(); }, { seed: +seed, race: 'human', realm: 'POL-01', status, sex, startAge: +age }); }
  await page.evaluate(INSTALL, NOTIMED);
  if (HINTS === 'off') await page.evaluate(() => { UI.set.hints = false; UI.render(); });
  if (DEATH) {
    const d = await page.evaluate(async () => {
      A.S.queue.length = 0; UI.ov = null; A.pcDeath('a fever'); UI.render();
      await new Promise(r => setTimeout(r, 300));
      UI.ov = null; A.S.queue.length = 0; UI.render();
      const pc = A.pc(), all = Object.values(A.S.people).filter(p => p.alive && p.id !== pc.id);
      const k = all.find(p => (pc.children || []).includes(p.id) && A.age(p) >= 14 && A.age(p) <= 50) || all.find(p => p.house && p.house === pc.house && A.age(p) >= 16 && A.age(p) <= 50) || all.find(p => p.realm === pc.realm && A.age(p) >= 16 && A.age(p) <= 40) || all.find(p => A.age(p) >= 16);
      if (!k) return 'no heir';
      A.continueAs(k.id);
      // whatever waits for the heir is answered by the engine's own bot, so the first press starts on an empty queue
      for (let g = 0, h; g < 50 && (h = A.headReady()); g++) { if (h.type === 'event') { A.eventView(h); A.eventAuto(); } else A.skipPrompt(); }
      UI.ov = null; UI.screen = 'game'; UI.tab = 'life'; UI.render();
      return `${k.given}, ${A.age(k)}`;
    });
    log('died and continued as', d);
  }
  if (ABL.length) {
    const ab = await page.evaluate(ABL => {
      const out = {};
      const delRules = test => { let n = 0; const ex = []; const walk = owner => { const L = owner.cssRules; for (let i = L.length - 1; i >= 0; i--) { const r = L[i]; if (r.type === 1) { if (test(r.selectorText || '')) { if (ex.length < 80) ex.push(r.selectorText); owner.deleteRule(i); n++; } } else if (r.cssRules) walk(r); } }; for (const sh of document.styleSheets) { try { walk(sh); } catch (e) {} } return { n, ex }; };
      if (ABL.includes('has')) out.has = delRules(s => s.includes(':has('));
      if (ABL.includes('hasbody')) out.hasbody = delRules(s => /(^|,)\s*(body|html|:root|#app|#game)[^,]*:has\(/.test(s));
      if (ABL.includes('log2')) { const f = UI.renderLogWrap; UI.renderLogWrap = function () { const L = A.S.log; A.S.log = L.slice(-2); try { return f.apply(this, arguments); } finally { A.S.log = L; } }; out.log2 = true; }
      if (ABL.includes('passes')) { const F = UI.FOLD, L = UI.LOOK, M = UI.MOTION; F.cards = () => {}; L.fitLife = () => {}; L.chipFit = () => {}; L.nameFit = () => {}; M.play = () => {}; out.passes = true; }
      if (ABL.includes('sweep')) { const VS = A.V2S; VS.sweep = () => {}; out.sweep = true; }
      UI.render();
      return out;
    }, ABL);
    log('ablation', JSON.stringify(ab).slice(0, 6000));
    fs.writeFileSync(`${OUT}/press-${TAG}-ablation.json`, JSON.stringify(ab, null, 1));
  }
  const st = await page.evaluate(() => ({ hints: document.querySelectorAll('.hint').length, year: A.S.year, name: A.pc().given, age: A.age(A.pc()), phone: !!(document.querySelector('#game') && document.querySelector('#game').classList.contains('phone')), q: A.S.queue.length, autosave: !!(UI.set && UI.set.autosave), motion: document.documentElement.dataset.motion || '' }));
  log('start', JSON.stringify(st), 'html', path.relative(root, HTML) || HTML, 'W', W, 'notimed', NOTIMED, 'death', DEATH);
  const presses = [];
  const D = (a, b, k) => b[k] - a[k];
  for (let i = 0; i < N; i++) {
    const a = await metrics();
    const r = await page.evaluate(() => __P.press());
    const b = await metrics();
    if (SETTLE) await page.evaluate(ms => new Promise(r => setTimeout(r, ms)), SETTLE);
    const c = await metrics();
    const row = Object.assign(r, { i, cpu: Math.round(D(a, b, 'ThreadTime') * 1000), cpuSettled: Math.round(D(a, c, 'ThreadTime') * 1000), script: Math.round(D(a, c, 'ScriptDuration') * 1000), layoutMs: Math.round(D(a, c, 'LayoutDuration') * 1000), styleMs: Math.round(D(a, c, 'RecalcStyleDuration') * 1000),
      layouts: D(a, c, 'LayoutCount'), recalcs: D(a, c, 'RecalcStyleCount'), nodes: c.Nodes, heapMB: +(c.JSHeapUsedSize / 1e6).toFixed(1), listeners: c.JSEventListeners });
    presses.push(row);
    log(`#${i} ${r.kind} ${r.why} y${r.year} age ${r.age} days ${r.days} cards ${r.cards} prompts ${r.prompts}${r.fallback ? ' fallback ' + r.fallback : ''} | cpu ${row.cpu} (+settle ${row.cpuSettled}) script ${row.script} layout ${row.layoutMs} style ${row.styleMs} | layouts ${row.layouts} recalcs ${row.recalcs} | refresh ${r.c.refresh || 0} refreshTab ${r.c.refreshTab || 0} render ${r.c.render || 0} modal ${r.c.renderModal || 0} clkLight ${r.c.clkLight || 0} (changed ${r.changed} timed ${r.timed}) clkPaint ${r.c.clkPaint || 0} ticks ${r.c.dayTick || 0} | nodes ${row.nodes} heap ${row.heapMB}`);
    if (r.why !== 'ok') { log('stopping:', r.why); break; }
  }
  if (SHOT) await page.screenshot({ path: SHOT });
  if (DUMP) { const s = await page.evaluate(() => A.serialize()); fs.writeFileSync(DUMP, s); }
  const med = a => { const b = a.slice().sort((x, y) => x - y); return b.length ? b[b.length >> 1] : null; };
  const ok = presses.filter(p => p.kind === 'v2Next' && p.days >= 25);
  const quiet = ok.filter(p => p.cards === 0 && p.prompts === 0), busy = ok.filter(p => p.cards > 0);
  const summary = { months: ok.length, cpuMedian: med(ok.map(p => p.cpuSettled)), cpuMean: Math.round(ok.reduce((a, p) => a + p.cpuSettled, 0) / Math.max(1, ok.length)), quiet: quiet.length, quietMedian: med(quiet.map(p => p.cpuSettled)),
    withCards: busy.length, withCardsMedian: med(busy.map(p => p.cpuSettled)), cardsPerMonth: +(ok.reduce((a, p) => a + p.cards, 0) / Math.max(1, ok.length)).toFixed(2), styleMedian: med(ok.map(p => p.styleMs)), layoutsMedian: med(ok.map(p => p.layouts)), errors: errs.length };
  fs.writeFileSync(`${OUT}/press-${TAG}.json`, JSON.stringify({ tag: TAG, html: HTML, W, NOTIMED, DEATH, st, summary, presses, errs }, null, 0));
  log(`SUMMARY months ${summary.months}: cpu median ${summary.cpuMedian} mean ${summary.cpuMean}; quiet ${summary.quiet}: median ${summary.quietMedian}; with cards ${summary.withCards}: median ${summary.withCardsMedian}, cards/mo ${summary.cardsPerMonth}; style median ${summary.styleMedian}; layouts/mo median ${summary.layoutsMedian}; errors ${errs.length}`);
  if (errs.length) { log('errors:', errs.slice(0, 5).join(' | ')); process.exitCode = 1; }
  if (warns.length) log('warnings:', warns.length, warns[0]);
  await browser.close();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(e => { log('FATAL', e.stack || e); process.exit(1); });
