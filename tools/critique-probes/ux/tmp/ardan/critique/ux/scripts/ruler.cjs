// The ruler's realm sub-views (politics, state, diplomacy, court, build): node ruler.cjs <w> <h>
const { chromium, open, shot, HELPERS } = require('./lib.cjs');
const [W, H] = [+process.argv[2], +process.argv[3]];
(async () => {
  const browser = await chromium.launch();
  const { ctx, page } = await open(browser, W, H);
  await page.evaluate(HELPERS);
  await page.evaluate(() => { T.enter({ seed: 6161, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 30 }); T.play(1); const pc = A.pc(); A.makeRuler(pc, pc.realm, true); UI.screen = 'game'; UI.ov = null; UI.tab = 'realm'; UI.render(); });
  await page.waitForTimeout(500);
  const views = await page.evaluate(() => [...document.querySelectorAll('#tabbody [data-a]')].filter(e => /realmView|rView|courtTab|poTab|rTab/.test(e.getAttribute('data-a'))).map(e => e.getAttribute('data-a') + '=' + (e.getAttribute('data-v') || '') + '=' + e.innerText.trim().slice(0, 30)));
  console.log('views', views);
  for (const v of views) {
    const [a, val] = v.split('=');
    await page.evaluate(([a, val]) => { const e = [...document.querySelectorAll(`#tabbody [data-a="${a}"]`)].find(x => (x.getAttribute('data-v') || '') === val); e && e.click(); }, [a, val]);
    await page.waitForTimeout(500);
    await page.evaluate(() => { const t = document.querySelector('#tabbody'); if (t) t.scrollTop = 0; window.scrollTo(0, 0); });
    const m = await shot(page, `ruler-realm-${a}-${val || 'x'}`, { full: true });
    console.log(m.name, 'words', m.wordsView, '/', m.wordsPage, 'inter', m.interactiveInView, '/', m.interactive, 'title', m.titleAttrs, 'tt', m.ttTriggers);
  }
  console.log('errors', page.errs);
  await browser.close();
})();
