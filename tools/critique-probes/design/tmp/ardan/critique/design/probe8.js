const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto('file:///tmp/ardan/snap/index.html');
  await page.waitForTimeout(1500);
  await page.evaluate(() => { A.newGame({ seed: 4242, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 16 }); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render(); });
  await page.waitForTimeout(500);
  const dump = async (label) => {
    const t = await page.evaluate(() => document.querySelector('#main, main, .main, #app') ? (document.querySelector('#main, main, .main, #app').innerText) : document.body.innerText);
    console.log('=====', label, '\n', t.slice(0, 5000));
    const btns = await page.evaluate(() => [...document.querySelectorAll('[data-a]')].map(b => (b.getAttribute('data-a')) + '|' + (b.getAttribute('data-v') || '') + '|' + (b.innerText||'').trim().replace(/\n/g,' / ').slice(0, 90)).filter(s => !/^(fold|tab|group|lookChips|save|menu)\|/.test(s)));
    console.log(btns.join('\n'));
  };
  await dump('NOW');
  await page.click('[data-a="tab"][data-v="goals"]'); await page.waitForTimeout(400);
  await dump('DECISIONS');
  await page.screenshot({ path: 'probe-decisions.png', fullPage: true });
  console.log('ERRS', errs);
  await b.close();
})();
