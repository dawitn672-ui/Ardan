// What accumulates in a long-lived page: animations, timers, style attributes, node counts after GC
const fs = require('fs');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const S = fs.readFileSync('/tmp/ardan/critique/engineering/out/noble-y50-state.json', 'utf8');
  const browser = await chromium.launch({ args: ['--js-flags=--expose-gc'] });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable', { timeDomain: 'threadTicks' });
  const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  await page.goto('file:///tmp/ardan/snap/index.html');
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 300000 });
  await page.evaluate(s => { A.deserialize(JSON.parse(s)); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render(); }, S);
  const snap = async label => {
    await page.evaluate(() => { if (window.gc) { gc(); gc(); } });
    const m = await metrics();
    const d = await page.evaluate(() => ({ anims: document.getAnimations().length, styled: document.querySelectorAll('[style]').length, rootStyle: document.documentElement.getAttribute('style') ? document.documentElement.getAttribute('style').length : 0, bodyStyle: document.body.getAttribute('style') ? document.body.getAttribute('style').length : 0, doc: document.getElementsByTagName('*').length, heap: Math.round(performance.memory.usedJSHeapSize / 1e6) }));
    const a = await metrics();
    await page.evaluate(() => { for (let i = 0; i < 6; i++) { UI.refresh(); void document.body.offsetHeight; } });
    const b = await metrics();
    const r = { label, blinkNodesAfterGC: m.Nodes, layoutObjects: m.LayoutObjects, listeners: m.JSEventListeners, ...d, cpuPerRefresh: Math.round((b.ThreadTime - a.ThreadTime) * 1000 / 6), styleMs: Math.round((b.RecalcStyleDuration - a.RecalcStyleDuration) * 1000 / 6), layoutMs: Math.round((b.LayoutDuration - a.LayoutDuration) * 1000 / 6) };
    console.log(JSON.stringify(r)); return r;
  };
  const out = [await snap('fresh page, year-50 state')];
  for (const n of [100, 300]) {
    await page.evaluate(n => { for (let i = 0; i < n; i++) { UI.tab = ['life', 'people', 'life', 'realm', 'life'][i % 5]; UI.render(); } UI.tab = 'life'; UI.render(); }, n);
    out.push(await snap(`after ${n} more redraws`));
  }
  fs.writeFileSync('/tmp/ardan/critique/engineering/out/probe5.json', JSON.stringify(out, null, 1));
  await browser.close();
})();
