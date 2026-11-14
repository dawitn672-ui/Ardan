const { chromium, open, shot, HELPERS } = require('./lib.cjs');
(async () => {
  const browser = await chromium.launch();
  const { ctx, page } = await open(browser, 420, 900);
  await page.evaluate(HELPERS);
  await page.evaluate(() => { T.enter({ seed: 4242, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 9 }); });
  await page.click('[data-a="menu"]');
  for (const t of [50, 400, 1500]) {
    await page.waitForTimeout(t);
    const txt = await page.evaluate(() => { const m = document.querySelector('#modal'); const i = m.innerText.indexOf('Text size'); return m.innerText.slice(i, i + 80).replace(/\n/g, ' / '); });
    console.log(t, txt);
  }
  await page.evaluate(() => { const el = [...document.querySelectorAll('#modal *')].find(e => e.textContent.trim() === 'Text size'); el && el.scrollIntoView({ block: 'center' }); });
  await page.waitForTimeout(300);
  await shot(page, 'menu-textsize');
  // which code rewrites percentages? look for an observer
  const obs = await page.evaluate(() => Object.keys(window).filter(k => /pct|percent|words/i.test(k)).slice(0, 20));
  console.log('globals', obs);
  await browser.close();
})();
