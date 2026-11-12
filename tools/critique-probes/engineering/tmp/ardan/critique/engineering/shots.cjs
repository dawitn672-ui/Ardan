const fs = require('fs');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const S = fs.readFileSync('/tmp/ardan/critique/engineering/out/noble-y50-state.json', 'utf8');
  const browser = await chromium.launch();
  for (const [w, h] of [[1366, 900], [420, 900]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto('file:///tmp/ardan/snap/index.html');
    await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 300000 });
    const info = await page.evaluate(s => { A.deserialize(JSON.parse(s)); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render();
      const lg = document.getElementById('log'); return { logNodes: lg ? lg.getElementsByTagName('*').length : 0, logLines: lg ? lg.querySelectorAll('.ll').length : 0, doc: document.getElementsByTagName('*').length, year: A.S.year }; }, S);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `/tmp/ardan/critique/engineering/shots/y50-life-${w}.png` });
    console.log(w, JSON.stringify(info));
    await ctx.close();
  }
  await browser.close();
})();
