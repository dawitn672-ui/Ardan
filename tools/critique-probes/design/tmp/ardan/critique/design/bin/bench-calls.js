const D = require('./drive.js');
(async () => {
  const { b, page } = await D.open(1366);
  for (const f of ['new', '/tmp/ardan/critique/design/bench-L1-1120.json']) {
    if (f === 'new') await page.evaluate(() => { A.newGame({ seed: 4242, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 }); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render(); });
    else await D.load(page, f);
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      window.__c = { render: 0, refresh: 0, renderMs: 0, refreshMs: 0, clk: 0, clkMs: 0 };
      for (const k of ['render', 'refresh', 'clkPaint']) {
        const f0 = UI[k]; const key = k === 'clkPaint' ? 'clk' : k;
        UI[k] = function () { const t0 = performance.now(); try { return f0.apply(this, arguments); } finally { window.__c[key]++; window.__c[key + 'Ms'] += performance.now() - t0; } };
      }
    });
    const rows = [];
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => { for (const k in window.__c) window.__c[k] = 0; });
      const r = await D.month(page, () => 0, () => {}, {});
      const c = await page.evaluate(() => Object.fromEntries(Object.entries(window.__c).map(([k, v]) => [k, Math.round(v)])));
      rows.push({ ms: r.ms, cards: r.cards, ...c });
    }
    console.log(f.split('/').pop(), JSON.stringify(rows));
  }
  await b.close();
})();
