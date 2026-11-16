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
  const ids = await page.evaluate(() => [...document.querySelectorAll('body > *, #app > *, main, [id]')].slice(0,60).map(e => e.tagName + '#' + e.id + '.' + e.className));
  console.log(ids.join('\n'));
  const dumpTab = async (g, t) => {
    await page.evaluate(([g, t]) => { UI.tab = t; UI.render(); }, [g, t]);
    await page.waitForTimeout(300);
    const txt = await page.evaluate(() => { const m = document.querySelector('#tabc') || document.querySelector('#content') || document.querySelector('.tabbody') || document.querySelector('main'); return m ? m.innerText : 'NO MAIN'; });
    const i = txt.indexOf('Life: '); 
    console.log('=====', t, '\n', txt.slice(0, 4000));
  };
  console.log(await page.evaluate(() => JSON.stringify(UI.GROUPS.map(g => [g.k || g.id || g.n, g.subs.map(s => s[0])]))));
  await dumpTab('life', 'goals');
  console.log('ERRS', errs);
  await b.close();
})();
