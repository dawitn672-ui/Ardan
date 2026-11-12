const { chromium, open, shot, HELPERS } = require('./lib.cjs');
(async () => {
  const browser = await chromium.launch();
  const { ctx, page } = await open(browser, 420, 900);
  await page.evaluate(HELPERS);
  for (const [label, o] of [['peasant newborn', { seed: 4343, status: 'peasant', sex: 'F', startAge: 0 }], ['noble newborn', { seed: 4444, status: 'noble', sex: 'M', startAge: 0 }]]) {
    const r = await page.evaluate((o) => { T.enter(Object.assign({ race: 'human', realm: 'POL-01' }, o)); UI.tab = 'people'; UI.render();
      const pc = A.pc();
      const labs = [...document.querySelectorAll('#tabbody [data-a="ov"][data-v^="person:"]')].map(e => e.innerText.replace(/\s+/g, ' ').trim().slice(0, 50));
      return { n: Object.keys(pc.rel || {}).length, rows: labs };
    }, o);
    console.log(label, r.n, '\n  ' + r.rows.join('\n  '));
    await shot(page, 'people-' + label.replace(' ', '-'), { full: true });
  }
  await browser.close();
})();
