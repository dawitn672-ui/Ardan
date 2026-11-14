const { chromium, open, shot, HELPERS } = require('./lib.cjs');
(async () => {
  const browser = await chromium.launch();
  const { ctx, page } = await open(browser, 420, 900);
  await page.evaluate(HELPERS);
  await page.evaluate(() => { T.enter({ seed: 4242, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 9 }); });
  await page.click('[data-a="menu"]');
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    const el = [...document.querySelectorAll('#modal *')].filter(e => /^Text size/.test(e.textContent.trim()) && e.textContent.length < 120).pop();
    let p = el; while (p && p !== document.body) { const cs = getComputedStyle(p); if (/(auto|scroll)/.test(cs.overflowY) && p.scrollHeight > p.clientHeight) break; p = p.parentElement; }
    if (p && el) { p.scrollTop = el.getBoundingClientRect().top - p.getBoundingClientRect().top + p.scrollTop - 300; }
    return { found: !!el, scroller: p && (p.id || p.className) , sh: p && p.scrollHeight, ch: p && p.clientHeight };
  });
  console.log(JSON.stringify(r));
  await page.waitForTimeout(300);
  await shot(page, 'menu-textsize2');
  await browser.close();
})();
