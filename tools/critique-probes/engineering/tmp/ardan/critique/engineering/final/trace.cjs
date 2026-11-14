// Deciding critic: a devtools trace of real Next month presses: who forces style recalcs and layouts, how many
// elements each recalc touches, and where the main thread's time goes by event kind.
//   node trace.cjs --tag=x --w=1366 --state=file|--new=seed:status:sex:age --warm=2 --n=4
const fs = require('fs');
const path = require('path');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const TAG = arg('tag', 'trace'), W = +arg('w', 1366), N = +arg('n', 4), WARM = +arg('warm', 2), STATE = arg('state', null), NEW = arg('new', null);
const OUT = '/tmp/ardan/critique/engineering/final/out';
const pressSrc = fs.readFileSync(__dirname + '/press.cjs', 'utf8');
const INSTALL = eval('(' + pressSrc.slice(pressSrc.indexOf('const INSTALL = ') + 16, pressSrc.indexOf('\n(async () => {')).replace(/;\s*$/, '') + ')');
(async () => {
  const browser = await chromium.launch({ args: ['--enable-precise-memory-info', '--js-flags=--expose-gc'] });
  const phone = W < 500;
  const ctx = await browser.newContext({ viewport: { width: W, height: phone ? 860 : 900 }, deviceScaleFactor: 1, hasTouch: phone, isMobile: phone });
  const page = await ctx.newPage(); page.setDefaultTimeout(1800000);
  const cdp = await ctx.newCDPSession(page);
  const scripts = new Map();
  cdp.on('Debugger.scriptParsed', e => scripts.set(e.scriptId, { url: e.url, len: e.length }));
  await cdp.send('Debugger.enable');
  await page.goto('file:///tmp/ardan/snap/index.html');
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 1800000 });
  await new Promise(r => setTimeout(r, 300));
  for (const [sid, s] of scripts) {
    if (s.len < 2000000) continue;
    const { scriptSource } = await cdp.send('Debugger.getScriptSource', { scriptId: sid });
    if (!/\/\/ features\//.test(scriptSource)) continue;
    const ls = [0]; for (let i = 0; i < scriptSource.length; i++) if (scriptSource.charCodeAt(i) === 10) ls.push(i + 1);
    s.lineStarts = ls; s.markers = [{ off: 0, name: 'vendor' }];
    const re = /\/\/ features\/([^\n]+)/g; let m; while ((m = re.exec(scriptSource))) s.markers.push({ off: m.index, name: m[1].trim() });
    s.src = scriptSource;
  }
  await cdp.send('Debugger.disable');
  const where = f => {
    if (!f) return '(none)';
    const s = scripts.get(String(f.scriptId));
    let feat = '?';
    if (s && s.markers) { const off = (s.lineStarts[f.lineNumber] || 0) + f.columnNumber; let m = null; for (const mk of s.markers) { if (mk.off <= off) m = mk; else break; } feat = m ? m.name : '?'; }
    else if (s) feat = s.url ? path.basename(s.url) : 'pack';
    return `${f.functionName || '(anon)'} @ ${feat}`;
  };
  if (STATE) { const s = fs.readFileSync(STATE, 'utf8'); await page.evaluate(s => { A.deserialize(JSON.parse(s)); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render(); }, s); }
  else { const [seed, status, sex, age] = (NEW || '42:noble:M:16').split(':'); await page.evaluate(o => { A.newGame(o); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render(); }, { seed: +seed, race: 'human', realm: 'POL-01', status, sex, startAge: +age }); }
  await page.evaluate(INSTALL, true);
  for (let i = 0; i < WARM; i++) await page.evaluate(() => __P.press());
  await page.evaluate(() => new Promise(r => setTimeout(r, 1500)));
  const events = [];
  cdp.on('Tracing.dataCollected', e => { for (const ev of e.value) events.push(ev); });
  const done = new Promise(r => cdp.once('Tracing.tracingComplete', r));
  await cdp.send('Tracing.start', { transferMode: 'ReportEvents', traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.stack', 'disabled-by-default-devtools.timeline.invalidationTracking', 'v8', 'blink_gc'], excludedCategories: ['*'] } });
  const presses = [];
  for (let i = 0; i < N; i++) { presses.push(await page.evaluate(() => __P.press())); await page.evaluate(() => new Promise(r => setTimeout(r, 300))); }
  await cdp.send('Tracing.end'); await done;
  // ---- the renderer main thread: the thread with the most UpdateLayoutTree events
  const tcount = {}; for (const e of events) if (e.name === 'UpdateLayoutTree' || e.name === 'Layout') tcount[e.pid + ':' + e.tid] = (tcount[e.pid + ':' + e.tid] || 0) + 1;
  const main = Object.entries(tcount).sort((a, b) => b[1] - a[1])[0][0];
  const mine = events.filter(e => e.pid + ':' + e.tid === main);
  const X = mine.filter(e => e.ph === 'X' && e.dur != null).sort((a, b) => a.ts - b.ts || b.dur - a.dur);
  // self time by event name (thread time where given)
  const self = {}, total = {}, count = {};
  const stack = [];
  for (const e of X) {
    const d = (e.tdur != null ? e.tdur : e.dur);
    while (stack.length && stack[stack.length - 1].end <= e.ts) stack.pop();
    if (stack.length) { const p = stack[stack.length - 1]; self[p.name] -= d; }
    self[e.name] = (self[e.name] || 0) + d; total[e.name] = (total[e.name] || 0) + d; count[e.name] = (count[e.name] || 0) + 1;
    stack.push({ name: e.name, end: e.ts + e.dur });
  }
  const top = o => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 22).map(([k, v]) => [k, Math.round(v / 1000), count[k]]);
  // style recalcs: forced by whom, how many elements
  const recalc = {}, layout = {};
  let rc = 0, rcEl = 0, rcMs = 0, rcForced = 0, lay = 0, layMs = 0, layForced = 0, layDirty = 0, layTotal = 0;
  for (const e of X) {
    if (e.name === 'UpdateLayoutTree') {
      const d = (e.tdur != null ? e.tdur : e.dur) / 1000, n = (e.args && e.args.elementCount) || 0, st = e.args && e.args.beginData && e.args.beginData.stackTrace;
      rc++; rcEl += n; rcMs += d;
      const k = st && st.length ? where(st[0]) : '(not forced: frame update)'; if (st && st.length) rcForced++;
      const r = recalc[k] = recalc[k] || { n: 0, ms: 0, el: 0 }; r.n++; r.ms += d; r.el += n;
    }
    if (e.name === 'Layout') {
      const d = (e.tdur != null ? e.tdur : e.dur) / 1000, b = (e.args && e.args.beginData) || {}, st = b.stackTrace;
      lay++; layMs += d; layDirty += b.dirtyObjects || 0; layTotal += b.totalObjects || 0;
      const k = st && st.length ? where(st[0]) : '(not forced: frame update)'; if (st && st.length) layForced++;
      const r = layout[k] = layout[k] || { n: 0, ms: 0, dirty: 0 }; r.n++; r.ms += d; r.dirty += b.dirtyObjects || 0;
    }
  }
  // why style was invalidated
  const reasons = {}, sched = {};
  for (const e of mine) {
    if (e.name === 'StyleRecalcInvalidationTracking') { const d = (e.args && e.args.data) || {}; const k = (d.reason || '?') + (d.extraData ? ' / ' + d.extraData : ''); reasons[k] = (reasons[k] || 0) + 1; }
    if (e.name === 'ScheduleStyleRecalculation') { const st = e.args && e.args.data && e.args.data.stackTrace; const k = st && st.length ? where(st[0]) : '(none)'; sched[k] = (sched[k] || 0) + 1; }
  }
  const tops = (o, f, n = 14) => Object.entries(o).sort((a, b) => f(b[1]) - f(a[1])).slice(0, n);
  const res = { tag: TAG, W, presses: presses.map(p => ({ cards: p.cards, days: p.days, c: p.c })), selfMsByEvent: top(self), totalMsByEvent: top(total),
    recalcs: { n: rc, forced: rcForced, ms: Math.round(rcMs), elements: rcEl, perRecalcEl: Math.round(rcEl / Math.max(1, rc)), byForcer: tops(recalc, v => v.ms).map(([k, v]) => [k, v.n, Math.round(v.ms), Math.round(v.el / v.n)]) },
    layouts: { n: lay, forced: layForced, ms: Math.round(layMs), dirtyPer: Math.round(layDirty / Math.max(1, lay)), totalPer: Math.round(layTotal / Math.max(1, lay)), byForcer: tops(layout, v => v.ms).map(([k, v]) => [k, v.n, Math.round(v.ms), Math.round(v.dirty / v.n)]) },
    invalidationReasons: tops(reasons, v => v, 16), scheduledBy: tops(sched, v => v, 12) };
  fs.writeFileSync(`${OUT}/trace-${TAG}.json`, JSON.stringify(res, null, 1));
  fs.writeFileSync(`${OUT}/trace-${TAG}-raw.json`, JSON.stringify(mine.filter(e => ['UpdateLayoutTree', 'Layout', 'ParseHTML', 'FunctionCall', 'TimerFire', 'EventDispatch', 'MajorGC', 'MinorGC'].includes(e.name))));
  console.log(JSON.stringify(res, null, 1));
  await browser.close();
})().catch(e => { console.error('FATAL', e.stack || e); process.exit(1); });
