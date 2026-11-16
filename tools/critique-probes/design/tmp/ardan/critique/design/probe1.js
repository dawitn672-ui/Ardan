const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.goto('file:///tmp/ardan/snap/index.html');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'shot-start-1366.png' });
  const txt = await page.evaluate(() => document.body.innerText.slice(0, 3000));
  console.log(txt);
  const btns = await page.evaluate(() => [...document.querySelectorAll('button,[data-a]')].slice(0, 80).map(b => (b.getAttribute('data-a') || '') + '|' + (b.getAttribute('data-v') || '') + '|' + b.innerText.trim().slice(0, 40)));
  console.log(btns.join('\n'));
  console.log('ERRS', errs);
  await b.close();
})();
