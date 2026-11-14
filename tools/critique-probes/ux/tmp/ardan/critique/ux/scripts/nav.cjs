const { chromium, open, shot, HELPERS } = require('./lib.cjs');
(async () => {
  const browser = await chromium.launch();
  for (const [w, h] of [[420, 900], [1366, 768]]) {
    const { ctx, page } = await open(browser, w, h);
    await page.evaluate(HELPERS);
    await page.evaluate(() => T.enter({ seed: 4242, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 9 }));
    await page.waitForTimeout(500);
    const nav = await page.evaluate(() => [...document.querySelectorAll('[data-a="group"],[data-a="tab"],[data-a="menu"],[data-a="ov"]')].filter(e => e.getBoundingClientRect().width > 0).map(e => { const r = e.getBoundingClientRect(); return `${e.getAttribute('data-a')}:${e.getAttribute('data-v')} "${e.innerText.replace(/\s+/g, ' ').trim().slice(0, 30)}" ${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)} aria=${e.getAttribute('aria-label') || ''} title=${e.getAttribute('title') || ''}`; }));
    console.log(w, '\n' + nav.join('\n'));
    // top bar buttons
    const top = await page.evaluate(() => [...document.querySelectorAll('button')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.y < 60 || r.y > innerHeight - 140); }).map(e => { const r = e.getBoundingClientRect(); return `${e.getAttribute('data-a')}:${e.getAttribute('data-v')} "${e.innerText.replace(/\s+/g, ' ').trim().slice(0, 30)}" ${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)} aria=${e.getAttribute('aria-label') || ''} title=${e.getAttribute('title') || ''}`; }));
    console.log('top/bottom buttons\n' + top.join('\n'));
    await ctx.close();
  }
  await browser.close();
})();
