const { chromium, open, shot } = require('./lib.cjs');
(async () => {
  const browser = await chromium.launch();
  for (const [w, h] of [[420, 900], [1366, 768]]) {
    const { ctx, page } = await open(browser, w, h);
    await page.click('text=Begin a new life');
    await page.waitForTimeout(400);
    await page.click('text=Be born');
    await page.waitForTimeout(1500);
    let m = await shot(page, '04-first', { full: true });
    console.log(JSON.stringify(m));
    const st = await page.evaluate(() => ({ screen: UI.screen, tab: UI.tab, ov: UI.ov && (UI.ov.type || UI.ov), groups: UI.GROUPS.map(g => g.id + ':' + g.subs.map(s => s[0]).join(',')), text: document.body.innerText.slice(0, 3500), pc: (() => { const p = A.pc(); return p && { name: p.name, age: A.age ? A.age(p) : null, status: p.status, job: p.job && p.job.k }; })() }));
    console.log(JSON.stringify(st, null, 1));
    console.log('errors', page.errs);
    await ctx.close();
  }
  await browser.close();
})();
