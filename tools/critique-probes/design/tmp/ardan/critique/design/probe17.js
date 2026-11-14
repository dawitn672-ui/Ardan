const { chromium } = require('/opt/node-tools/node_modules/playwright');
const D = require('./bin/drive.js');
(async () => {
  const { b, page, errs } = await D.open(1366);
  await page.evaluate(() => { A.newGame({ seed: 4242, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 16 }); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render(); });
  await page.waitForTimeout(400);
  await page.click('[data-a="act"][data-v="enlist"]');
  await page.waitForTimeout(500);
  const md = await D.readModal(page);
  console.log(JSON.stringify(md, null, 1).slice(0, 4000));
  const t = await page.evaluate(() => { const t = document.getElementById('toast'); return t ? t.innerText : ''; });
  console.log('toast', t);
  console.log(JSON.stringify(await page.evaluate(() => { const pc = A.pc(); return { mil: pc.mil, job: pc.job, occ: pc.occ }; }), null, 1).slice(0, 2000));
  await page.screenshot({ path: 'probe-enlist.png' });
  console.log(errs);
  await b.close();
})();
