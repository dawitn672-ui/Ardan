const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch();
  for (const [w, h, tag] of [[420, 900, 'p'], [1366, 768, 'd']]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(String(e)));
    page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0,300)); });
    const t0 = Date.now();
    await page.goto('file:///tmp/ardan/snap/index.html');
    await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
    console.log(tag, 'boot ms', Date.now() - t0);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `/tmp/ardan/critique/ux/shots/${tag}-01-title.png`, fullPage: false });
    await page.screenshot({ path: `/tmp/ardan/critique/ux/shots/${tag}-01-title-full.png`, fullPage: true });
    const info = await page.evaluate(() => ({ screen: UI.screen, text: document.body.innerText.slice(0, 3000), words: document.body.innerText.split(/\s+/).filter(Boolean).length, buttons: document.querySelectorAll('button,[data-a]').length, scrollH: document.documentElement.scrollHeight, scrollW: document.documentElement.scrollWidth }));
    console.log(JSON.stringify(info, null, 1));
    console.log('errors', errs);
    await ctx.close();
  }
  await browser.close();
})();
