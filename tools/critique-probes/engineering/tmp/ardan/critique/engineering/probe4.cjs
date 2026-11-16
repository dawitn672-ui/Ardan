const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable', { timeDomain: 'threadTicks' });
  const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  await page.goto('file:///tmp/ardan/snap/index.html');
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 300000 });
  await new Promise(r => setTimeout(r, 3000));
  const pre = await page.evaluate(() => ({ screen: UI.screen, hasWorld: !!(A.S && A.S.prov && A.S.prov.length), people: A.S ? Object.keys(A.S.people || {}).length : 0, v2map: !!(A.S && A.S.v2map), seed: A.S && A.S.seed }));
  console.log('before newGame (title screen):', JSON.stringify(pre));
  const out = [];
  for (const seed of [7, 8]) {
    const m0 = await metrics();
    const w = await page.evaluate(seed => { const t = performance.now(); A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 16 }); return performance.now() - t; }, seed);
    const m1 = await metrics();
    out.push({ seed, wall: Math.round(w), cpu: Math.round((m1.ThreadTime - m0.ThreadTime) * 1000) });
  }
  console.log('newGame:', JSON.stringify(out));
  // the hooks: how many, and how long one month of each costs (CPU via performance.now inside, quiet machine bias)
  const hooks = await page.evaluate(() => {
    UI.screen = 'game'; UI.tab = 'life'; UI.render();
    for (let i = 0; i < 3; i++) { A.advance(30); let h, k = 0; while ((h = A.headReady()) && k++ < 50) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); } }
    const t = A.onMonth.map(() => 0), d = A.onDay.map(() => 0);
    const om = A.onMonth.slice(), od = A.onDay.slice();
    A.onMonth.forEach((f, i) => { A.onMonth[i] = function () { const s = performance.now(); try { return f.apply(this, arguments); } finally { t[i] += performance.now() - s; } }; });
    A.onDay.forEach((f, i) => { A.onDay[i] = function () { const s = performance.now(); try { return f.apply(this, arguments); } finally { d[i] += performance.now() - s; } }; });
    const t0 = performance.now();
    for (let m = 0; m < 12; m++) { A.advance(31); let h, k = 0; while ((h = A.headReady()) && k++ < 50) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); } }
    const all = performance.now() - t0;
    A.onMonth.splice(0, A.onMonth.length, ...om); A.onDay.splice(0, A.onDay.length, ...od);
    const name = f => { const s = String(f); return s.slice(0, 90).replace(/\s+/g, ' '); };
    return { all: Math.round(all), month: om.map((f, i) => [Math.round(t[i]), name(f)]).sort((a, b) => b[0] - a[0]).slice(0, 12), monthSum: Math.round(t.reduce((a, b) => a + b, 0)), day: od.map((f, i) => [Math.round(d[i]), name(f)]).sort((a, b) => b[0] - a[0]).slice(0, 5), daySum: Math.round(d.reduce((a, b) => a + b, 0)) };
  });
  console.log(JSON.stringify(hooks, null, 1));
  await browser.close();
})();
