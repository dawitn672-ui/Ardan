const { chromium, open, shot } = require('./lib.cjs');
(async () => {
  const browser = await chromium.launch();
  for (const [w, h] of [[420, 900], [1366, 768]]) {
    const { ctx, page } = await open(browser, w, h);
    console.log('title', JSON.stringify(await shot(page, '01-title', { full: true })));
    await page.click('text=Begin a new life');
    await page.waitForTimeout(800);
    let i = 2;
    console.log('step', i, JSON.stringify(await shot(page, `0${i}-newgame`, { full: true })));
    const txt = await page.evaluate(() => document.body.innerText.slice(0, 4000));
    console.log(txt);
    const btns = await page.evaluate(() => [...document.querySelectorAll('button,[data-a]')].filter(e => e.offsetParent).map(e => (e.getAttribute('data-a') || '') + ' | ' + e.innerText.replace(/\s+/g, ' ').slice(0, 60)));
    console.log(btns.join('\n'));
    await ctx.close();
  }
  await browser.close();
})();
