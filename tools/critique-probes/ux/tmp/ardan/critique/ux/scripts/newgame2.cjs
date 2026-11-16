const { chromium, open, shot } = require('./lib.cjs');
(async () => {
  const browser = await chromium.launch();
  for (const [w, h] of [[420, 900], [1366, 768]]) {
    const { ctx, page } = await open(browser, w, h);
    await page.click('text=Begin a new life');
    await page.waitForTimeout(500);
    await page.click('text=Customise everything');
    await page.waitForTimeout(500);
    for (let s = 1; s <= 4; s++) {
      const m = await shot(page, `03-create-step${s}`, { full: true });
      console.log('step', s, JSON.stringify(m));
      const txt = await page.evaluate(() => document.body.innerText.replace(/\n+/g, ' / ').slice(0, 2500));
      console.log(txt.slice(0, 2500));
      // next step
      const next = await page.$('[data-a="crStep"][data-v="' + (s + 1) + '"], [data-a="crStep"][data-v="' + s + '"]');
      const btns = await page.evaluate(() => [...document.querySelectorAll('[data-a="crStep"],[data-a="crNext"],[data-a="crBegin"],[data-a="begin"],button')].filter(e => e.offsetParent).map(e => (e.getAttribute('data-a') || '') + ':' + (e.getAttribute('data-v') || '') + ' | ' + e.innerText.replace(/\s+/g, ' ').slice(0, 40)));
      if (s === 1) console.log(btns.join('\n'));
      const target = btns.find(b => /crStep:/.test(b) && b.includes(`${s + 1}.`));
      if (s < 4) {
        const ok = await page.evaluate((s) => { const e = [...document.querySelectorAll('[data-a="crStep"]')].find(e => e.innerText.trim().startsWith((s + 1) + '.')); if (e) { e.click(); return true; } return false; }, s);
        if (!ok) console.log('no step', s + 1);
        await page.waitForTimeout(500);
      }
    }
    console.log('errors', page.errs);
    await ctx.close();
  }
  await browser.close();
})();
