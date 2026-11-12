const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--enable-precise-memory-info', '--js-flags=--expose-gc'] });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable', { timeDomain: 'threadTicks' });
  await page.goto('about:blank');
  const m = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  const a = await m();
  const w = await page.evaluate(() => { const t = performance.now(); let s = 0; for (let i = 0; i < 5e7; i++) s = (s * 31 + i) | 0; return performance.now() - t; });
  const b = await m();
  console.log(Object.keys(a).join(' '));
  console.log('wall', w.toFixed(0), 'ThreadTime', ((b.ThreadTime - a.ThreadTime) * 1000).toFixed(0), 'TaskDuration', ((b.TaskDuration - a.TaskDuration) * 1000).toFixed(0), 'ScriptDuration', ((b.ScriptDuration - a.ScriptDuration) * 1000).toFixed(0), 'ProcessTime', ((b.ProcessTime - a.ProcessTime) * 1000).toFixed(0));
  await browser.close();
})();
