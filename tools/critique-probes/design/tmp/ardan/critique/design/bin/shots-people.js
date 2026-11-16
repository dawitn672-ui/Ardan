const D = require('./drive.js');
(async () => {
  const { b, page, errs } = await D.open(1366);
  for (const [status, age, seed] of [['peasant', 0, 11], ['noble', 0, 11]]) {
    await page.evaluate(([status, age, seed]) => { A.newGame({ seed, race: 'human', realm: 'POL-01', status, sex: 'M', startAge: age }); UI.screen = 'game'; UI.tab = 'people'; UI.ov = null; UI.render(); }, [status, age, seed]);
    await page.waitForTimeout(600);
    await page.screenshot({ path: `shots/people-${status}-born-1366.png` });
    await page.setViewportSize({ width: 420, height: 900 }); await page.waitForTimeout(500);
    await page.evaluate(() => { UI.tab = 'people'; UI.render(); }); await page.waitForTimeout(400);
    await page.screenshot({ path: `shots/people-${status}-born-420.png`, fullPage: true });
    await page.setViewportSize({ width: 1366, height: 900 }); await page.waitForTimeout(300);
    const t = await page.evaluate(() => document.querySelector('main').innerText);
    console.log('=====', status, '\n', t.slice(0, 1800));
  }
  await b.close();
})();
