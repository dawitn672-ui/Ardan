// Where boot time goes: CPU profile from navigation to ARDAN_CONTENT_READY, plus the main thread's CPU time.
const fs = require('fs');
const path = require('path');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const OUT = '/tmp/ardan/critique/engineering/out';
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable', { timeDomain: 'threadTicks' });
  const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  await page.goto('about:blank');
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 500 }); await cdp.send('Profiler.start');
  const m0 = await metrics();
  await page.goto('file:///tmp/ardan/snap/index.html');
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 300000, polling: 50 });
  const m1 = await metrics();
  const { profile } = await cdp.send('Profiler.stop');
  const boot = await page.evaluate(() => window.ARDAN_BOOT);
  const info = await page.evaluate(() => ({ events: Object.keys(A.EV).length, retired: A.EV_RETIRED ? (A.EV_RETIRED.size || Object.keys(A.EV_RETIRED).length) : null, aFns: Object.keys(A).filter(k => typeof A[k] === 'function').length, uiFns: Object.keys(UI).filter(k => typeof UI[k] === 'function').length,
    onMonth: A.onMonth.length, onDay: A.onDay.length, onYear: (A.onYear || []).length, scripts: document.scripts.length, styles: document.querySelectorAll('style').length,
    styleBytes: [...document.querySelectorAll('style')].reduce((a, s) => a + s.textContent.length, 0), scriptBytes: [...document.scripts].reduce((a, s) => a + s.textContent.length, 0), heap: performance.memory ? performance.memory.usedJSHeapSize : null }));
  // script names
  const scripts = new Map();
  cdp.on('Debugger.scriptParsed', e => scripts.set(e.scriptId, { url: e.url, len: e.length }));
  await cdp.send('Debugger.enable'); await new Promise(r => setTimeout(r, 500));
  for (const [sid, s] of scripts) {
    if (s.url || s.len < 2000) { s.name = s.url ? path.basename(s.url) : 'inline'; continue; }
    const { scriptSource } = await cdp.send('Debugger.getScriptSource', { scriptId: sid });
    const mm = scriptSource.slice(0, 200).match(/\/\/ features\/([^\n]+)/);
    s.name = mm ? mm[1].trim() : (scriptSource.length > 3e6 ? 'core' : 'pack:' + scriptSource.slice(0, 30));
  }
  const byId = new Map(profile.nodes.map(n => [n.id, n]));
  const self = new Map(); const dt = profile.timeDeltas;
  for (let i = 0; i < profile.samples.length; i++) self.set(profile.samples[i], (self.get(profile.samples[i]) || 0) + (dt[i] || 0));
  const byScript = new Map(), byFn = new Map(); let total = 0;
  for (const [id, us] of self) {
    const n = byId.get(id), f = n.callFrame; total += us;
    const s = scripts.get(f.scriptId); const sn = s ? s.name : (f.url || f.functionName);
    byScript.set(sn, (byScript.get(sn) || 0) + us);
    const k = `${f.functionName || '(anon)'} @ ${sn}`; byFn.set(k, (byFn.get(k) || 0) + us);
  }
  const top = m => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, us]) => `${(us / 1000).toFixed(0)} ms ${(100 * us / total).toFixed(1)}% ${k}`);
  const res = { boot, info, cpuMs: Math.round((m1.ThreadTime - m0.ThreadTime) * 1000), profileMs: Math.round(total / 1000), byScript: top(byScript), byFn: top(byFn) };
  fs.writeFileSync(`${OUT}/bootprof.json`, JSON.stringify(res, null, 1));
  console.log(JSON.stringify(res, null, 1));
  await browser.close();
})();
