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
  const dumpTab = async (t, n) => {
    await page.evaluate((t) => { UI.tab = t; UI.render(); }, t);
    await page.waitForTimeout(300);
    const txt = await page.evaluate(() => { const m = document.querySelector('main'); return m ? m.innerText : 'NO MAIN'; });
    console.log('=====', t, '\n', txt.slice(0, n || 5000));
    const btns = await page.evaluate(() => [...document.querySelectorAll('main [data-a]')].map(b => (b.getAttribute('data-a')) + '|' + (b.getAttribute('data-v') || '') + '|' + (b.innerText||'').trim().replace(/\n/g,' / ').slice(0, 90)).filter(s => !/^(fold|tab|group|lookChips|save|menu)\|/.test(s)));
    console.log(btns.slice(0, 80).join('\n'));
  };
  await dumpTab('path', 6000);
  await dumpTab('people', 7000);
  await page.evaluate(() => { UI.tab = 'people'; UI.render(); });
  await page.screenshot({ path: 'L2probe-people-1366.png', fullPage: true });
  console.log('ERRS', errs);
  await b.close();
})();
