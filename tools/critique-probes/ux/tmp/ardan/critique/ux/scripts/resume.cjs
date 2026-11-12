// Title screen with a save present, and the Random life button
const { chromium, open, shot, HELPERS } = require('./lib.cjs');
(async () => {
  const browser = await chromium.launch();
  for (const [W, H] of [[420, 900], [1366, 768]]) {
    const { ctx, page } = await open(browser, W, H);
    await page.evaluate(HELPERS);
    await page.evaluate(() => { T.enter({ seed: 4242, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 9 }); });
    await page.waitForTimeout(300);
    await page.click('[data-a="save"]').catch(e => console.log('no save btn', e.message.slice(0, 80)));
    await page.waitForTimeout(1500);
    await page.reload();
    await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
    await page.waitForTimeout(1200);
    const t = await page.evaluate(() => ({ screen: UI.screen, text: document.body.innerText.replace(/\n+/g, ' / ').slice(0, 900), acts: [...document.querySelectorAll('[data-a]')].filter(e => e.getBoundingClientRect().width).map(e => e.getAttribute('data-a') + '=' + e.innerText.replace(/\s+/g, ' ').slice(0, 40)) }));
    console.log(W, JSON.stringify(t, null, 1));
    await shot(page, 'title-with-save');
    // Random life from the title
    const rl = await page.$('[data-a="randomLife"]');
    if (rl) { await rl.click(); await page.waitForTimeout(1500); const s2 = await page.evaluate(() => ({ screen: UI.screen, ov: UI.ov && UI.ov.type, text: document.body.innerText.replace(/\n+/g, ' / ').slice(0, 400) })); console.log('after random life', JSON.stringify(s2)); await shot(page, 'random-life'); }
    await ctx.close();
  }
  await browser.close();
})();
