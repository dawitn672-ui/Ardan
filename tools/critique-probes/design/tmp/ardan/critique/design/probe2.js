const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto('file:///tmp/ardan/snap/index.html');
  await page.waitForTimeout(2000);
  await page.click('[data-a="newLife"]');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'shot-create-1366.png', fullPage: true });
  const txt = await page.evaluate(() => document.body.innerText.slice(0, 6000));
  console.log(txt);
  const btns = await page.evaluate(() => [...document.querySelectorAll('button,[data-a],select,input')].slice(0, 150).map(b => b.tagName + '|' + (b.getAttribute('data-a') || b.getAttribute('data-c') || b.name || b.id || '') + '|' + (b.getAttribute('data-v') || b.value || '') + '|' + (b.innerText||'').trim().slice(0, 40)));
  console.log(btns.join('\n'));
  console.log('ERRS', errs);
  await b.close();
})();
