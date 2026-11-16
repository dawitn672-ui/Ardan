// Desktop column widths and the share of the screen each takes; vertical space before the first actionable thing on phone
const { chromium, open, shot, HELPERS } = require('./lib.cjs');
(async () => {
  const browser = await chromium.launch();
  for (const [W, H] of [[1366, 768], [1920, 1080], [420, 900]]) {
    const { ctx, page } = await open(browser, W, H);
    await page.evaluate(HELPERS);
    await page.evaluate(() => { T.enter({ seed: 5151, race: 'human', realm: 'POL-01', status: 'merchant', sex: 'M', startAge: 25 }); UI.tab = 'holdings'; UI.render(); });
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => {
      const box = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; };
      const panels = [...document.querySelectorAll('#game > *, .cols > *, main > *')].filter(e => e.getBoundingClientRect().width > 150).slice(0, 8).map(e => (e.id || e.className.toString().slice(0, 30)) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
      const tb = box('#tabbody');
      const mkt = document.querySelector('[data-a="mktBuy"]');
      const tbl = mkt && mkt.closest('table');
      return { tabbody: tb, panels, table: tbl ? [Math.round(tbl.getBoundingClientRect().width), tbl.scrollWidth] : null, headerH: box('header') || box('#top'), bodyFont: getComputedStyle(document.body).fontSize };
    });
    console.log(W, JSON.stringify(r));
    await ctx.close();
  }
  await browser.close();
})();
