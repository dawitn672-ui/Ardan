// What hides in title= (hover-only on desktop, invisible on touch) on a few screens
const { chromium, open, shot, HELPERS } = require('./lib.cjs');
(async () => {
  const browser = await chromium.launch();
  const { ctx, page } = await open(browser, 1366, 768);
  await page.evaluate(HELPERS);
  const grab = () => page.evaluate(() => { const seen = new Map(); for (const e of document.querySelectorAll('[title]')) { if (!e.getBoundingClientRect().width) continue; const t = e.getAttribute('title'); if (!t || seen.has(t)) continue; seen.set(t, (e.getAttribute('data-tt') ? 'TT ' : '') + e.tagName + ' "' + e.innerText.replace(/\s+/g, ' ').slice(0, 30) + '"'); } return [...seen].map(([t, w]) => w + ' => ' + t.slice(0, 110)); });
  // creation step 3
  await page.click('text=Begin a new life'); await page.waitForTimeout(300);
  await page.click('text=Customise everything'); await page.waitForTimeout(300);
  await page.evaluate(() => { const e = [...document.querySelectorAll('[data-a="crStep"]')].find(e => e.innerText.trim().startsWith('3.')); e && e.click(); });
  await page.waitForTimeout(400);
  const c3 = await grab();
  console.log('CREATION STEP 3', c3.length, '\n ' + c3.slice(0, 14).join('\n '));
  await page.evaluate(() => { const e = [...document.querySelectorAll('[data-a="crStep"]')].find(e => e.innerText.trim().startsWith('2.')); e && e.click(); });
  await page.waitForTimeout(400);
  const c2 = await grab();
  console.log('CREATION STEP 2', c2.length, '\n ' + c2.slice(0, 10).join('\n '));
  await page.evaluate(() => { T.enter({ seed: 7301, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22 }); const pc = A.pc(); A.enlist(pc); A.startWar(pc.realm, A.neighbors(pc.realm)[0], null, 'conquest'); UI.tab = 'path'; UI.render(); });
  await page.waitForTimeout(400);
  const pth = await grab();
  console.log('PATH (soldier)', pth.length, '\n ' + pth.slice(0, 30).join('\n '));
  await page.evaluate(() => { UI.tab = 'people'; UI.render(); });
  await page.waitForTimeout(300);
  const ppl = await grab();
  console.log('PEOPLE', ppl.length, '\n ' + ppl.slice(0, 20).join('\n '));
  await browser.close();
})();
