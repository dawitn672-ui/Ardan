const fs = require('fs');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const S = fs.readFileSync('/tmp/ardan/critique/engineering/out/noble-y50-state.json', 'utf8');
  const browser = await chromium.launch({ args: ['--js-flags=--expose-gc'] });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable');
  const nodes = async () => { await page.evaluate(() => { gc(); gc(); }); return (await cdp.send('Performance.getMetrics')).metrics.find(m => m.name === 'Nodes').value; };
  await page.goto('file:///tmp/ardan/snap/index.html');
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 300000 });
  await page.evaluate(s => { A.deserialize(JSON.parse(s)); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render(); }, S);
  await page.waitForTimeout(2500);
  const out = { base: await nodes() };
  await page.evaluate(() => { for (let i = 0; i < 50; i++) { UI.tab = ['life', 'people', 'realm'][i % 3]; UI.render(); } UI.tab = 'life'; UI.render(); });
  out.right = await nodes();
  await page.waitForTimeout(3000);
  out.after3s = await nodes();
  // the same 50 redraws with MOTION.play stubbed
  await page.evaluate(() => { const M = UI.MOTION; M.__p = M.play; M.play = () => {}; for (let i = 0; i < 50; i++) { UI.tab = ['life', 'people', 'realm'][i % 3]; UI.render(); } UI.tab = 'life'; UI.render(); M.play = M.__p; });
  out.rightNoMotion = await nodes();
  console.log(JSON.stringify(out));
  await browser.close();
})();
