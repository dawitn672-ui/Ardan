const { chromium, open, shot, HELPERS } = require('./lib.cjs');
(async () => {
  const browser = await chromium.launch();
  const { ctx, page } = await open(browser, +(process.argv[2] || 1366), +(process.argv[3] || 768));
  await page.evaluate(HELPERS);
  await page.evaluate(() => { T.enter({ seed: 4242, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 9 }); });
  for (let i = 0; i < 3; i++) {
    const nb = await page.$('[data-a="v2Next"]');
    console.log('next button', !!nb);
    if (!nb) break;
    await nb.click();
    await page.waitForTimeout(2500);
    const st = await page.evaluate(() => {
      const m = document.querySelector('#modal');
      return {
        q: A.S.queue.slice(0, 3).map(x => x.type + ':' + (x.ev || x.title || '')),
        modal: m ? { cls: m.className, acts: [...m.querySelectorAll('[data-a]')].map(e => e.getAttribute('data-a') + '=' + (e.getAttribute('data-v') || '') + ' ' + e.innerText.replace(/\s+/g, ' ').slice(0, 50)), text: m.innerText.slice(0, 900) } : null,
        nextBtns: [...document.querySelectorAll('[data-a="v2Next"]')].length,
      };
    });
    console.log(JSON.stringify(st, null, 1));
    await shot(page, 'probe-' + i);
  }
  await browser.close();
})();
