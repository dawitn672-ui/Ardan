const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto('file:///tmp/ardan/snap/index.html');
  await page.waitForTimeout(1500);
  await page.evaluate(() => { A.newGame({ seed: 777, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 6 }); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render(); });
  await page.waitForTimeout(500);
  let shown = 0;
  for (let i = 0; i < 30 && shown < 3; i++) {
    await page.click('[data-a="v2Next"]');
    await page.waitForTimeout(400);
    for (let k = 0; k < 40; k++) {
      const st = await page.evaluate(() => ({ run: UI.stepper && UI.stepper.run, wait: UI.stepper && UI.stepper.wait, modal: !!document.querySelector('#modal'), q: A.S.queue.length, date: A.dateStr() }));
      if (st.modal) {
        shown++;
        const html = await page.evaluate(() => document.querySelector('#modal').outerHTML);
        console.log('---- MODAL', i, st.date, '\n', html.slice(0, 6000));
        const btns = await page.evaluate(() => [...document.querySelectorAll('#modal [data-a]')].map(b => (b.getAttribute('data-a')) + '|' + (b.getAttribute('data-v') || '') + '|' + (b.innerText||'').trim().replace(/\n/g,' / ').slice(0, 100)));
        console.log(btns.join('\n'));
        await page.screenshot({ path: 'probe-card-' + shown + '.png' });
        break;
      }
      if (!st.run) break;
      await page.waitForTimeout(150);
    }
    if (shown) break;
  }
  console.log('ERRS', errs);
  await b.close();
})();
