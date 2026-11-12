const D = require('./bin/drive.js');
(async () => {
  const { b, page, errs } = await D.open(1366);
  await D.load(page, '/tmp/ardan/critique/design/L3/state.json');
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => ({ screen: UI.screen, ov: UI.ov && UI.ov.type, acts: [...document.querySelectorAll('[data-a]')].map(b => b.getAttribute('data-a') + ':' + (b.getAttribute('data-v') || '') + ':' + (b.innerText || '').trim().slice(0, 60)).filter(s => !/^(fold|tab|group|tt)/.test(s)).slice(0, 40), text: document.body.innerText.slice(0, 2500) }));
  console.log(JSON.stringify(r, null, 1));
  await page.screenshot({ path: 'shots/L3-death-reload.png' });
  await b.close();
})();
