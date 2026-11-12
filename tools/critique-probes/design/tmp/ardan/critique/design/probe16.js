const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
  await page.goto('file:///tmp/ardan/snap/index.html');
  await page.waitForTimeout(1500);
  await page.click('[data-a="newLife"]'); await page.waitForTimeout(500);
  await page.click('[data-a="crStep"][data-v="0"]'); await page.waitForTimeout(400);
  const opts = await page.evaluate(() => [...document.querySelectorAll('select[data-c="crRealm"] option')].map(o => o.value + '|' + o.textContent));
  console.log(opts.join('\n'));
  await b.close();
})();
