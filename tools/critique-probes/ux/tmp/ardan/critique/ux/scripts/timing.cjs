// How long one press of Next month takes, early in a life and 25 years in: node timing.cjs <w> <h>
const { chromium, open, shot, HELPERS } = require('./lib.cjs');
const [W, H] = [+process.argv[2], +process.argv[3]];
async function months(page, n, label) {
  const out = [];
  for (let i = 0; i < n; i++) {
    // answer anything waiting, by the bot
    await page.evaluate(() => { let h, g = 0; while ((h = A.headReady()) && g++ < 50) { if (h.type === 'event') { A.eventView(h); A.eventAuto(); A.eventClose && A.eventClose(); } else A.skipPrompt(); } UI.ov = null; UI.render(); });
    await page.waitForTimeout(200);
    for (let k = 0; k < 5; k++) {
      const m = await page.evaluate(() => { const m = document.querySelector('#modal'); if (!m || !m.innerText.trim()) return null; const b = m.querySelector('[data-a]:not([data-a="report"]):not([data-a="hintDone"])'); const t = m.innerText.replace(/\n+/g, ' / ').slice(0, 200); if (b) b.click(); return t + ' -> ' + (b ? b.getAttribute('data-a') : 'none'); });
      if (!m) break; console.log('  modal:', m); await page.waitForTimeout(400);
    }
    const nb = await page.$('[data-a="v2Next"]');
    if (!nb) { out.push('nobtn'); continue; }
    const t0 = Date.now();
    await nb.click({ timeout: 5000 }).catch(e => console.log('click blocked'));
    await page.waitForFunction(() => document.querySelector('[data-a="v2Next"]') || document.querySelector('#modal [data-a="evChoose"]') || document.querySelector('#modal [data-a="qChoice"]'), null, { timeout: 60000 }).catch(() => {});
    const card = await page.evaluate(() => !!document.querySelector('#modal [data-a]'));
    out.push((Date.now() - t0) + (card ? 'c' : ''));
  }
  console.log(label, out.join(' '));
}
(async () => {
  const browser = await chromium.launch();
  const { ctx, page } = await open(browser, W, H);
  await page.evaluate(HELPERS);
  await page.evaluate(() => { T.enter({ seed: 5151, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 22 }); });
  await months(page, 8, 'year 0:');
  const t0 = Date.now();
  const st = await page.evaluate(() => { const r = T.play(25); UI.screen = 'game'; UI.ov = null; UI.tab = 'life'; UI.render(); return { r, year: A.S.year, people: Object.keys(A.S.people).length, news: (A.S.news || []).length, bytes: JSON.stringify(A.S).length }; });
  console.log('played 25 years in', Date.now() - t0, 'ms', JSON.stringify(st));
  await months(page, 8, 'year 25:');
  const dom = await page.evaluate(() => ({ nodes: document.getElementsByTagName('*').length, story: (document.querySelector('#logwrap') || document.body).innerText.length }));
  console.log('dom', JSON.stringify(dom));
  console.log('errors', page.errs);
  await browser.close();
})();
