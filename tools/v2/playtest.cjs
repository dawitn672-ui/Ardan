const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 420, height: 860 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await p.goto('file://' + process.cwd() + '/docs/v2/demo.html');
  await p.selectOption('#estate', process.argv[2] || 'noble');
  const t0 = Date.now(); await p.click('#begin'); await p.waitForSelector('#app:not([hidden])', { timeout: 30000 });
  console.log('world ready ms', Date.now() - t0);
  let cards = 0, months = 0;
  const target = +(process.argv[3] || 200);
  for (let m = 0; m < target; m++) {
    if (await p.isVisible('#tab-war')) break;
    await p.click('#next'); months++;
    for (let k = 0; k < 12; k++) {
      if (!(await p.isVisible('#card'))) break;
      const btns = await p.$$('#card button'); cards++;
      await btns[Math.floor(Math.random() * btns.length)].click();
      if (await p.isVisible('#card')) { const c = await p.$('#card button.primary'); if (c) await c.click(); }
    }
  }
  console.log('months', months, 'cards', cards);
  await p.screenshot({ path: '/tmp/ardan-v2-shot-life.png' });
  for (const t of ['you', 'family', 'world']) { await p.click(`.tabs button[data-tab=${t}]`); await p.waitForTimeout(t === 'world' ? 2500 : 200); await p.screenshot({ path: `out/shot-${t}.png`, fullPage: true }); }
  await p.click('.tabs button[data-tab=life]'); await p.click('#next'); await p.waitForTimeout(300); await p.screenshot({ path: '/tmp/ardan-v2-shot-card.png' });
  console.log('errors', errs.slice(0, 5));
  await b.close();
})();
