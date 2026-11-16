const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--enable-precise-memory-info', '--js-flags=--expose-gc'] });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 300)));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)); });
  await page.goto('file:///tmp/ardan/snap/index.html');
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 180000 });
  const r = await page.evaluate(() => {
    A.newGame({ seed: 42, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 16 });
    UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render();
    const out = [];
    for (let y = 0; y < 3; y++) {
      const t0 = performance.now(); let ev = 0, adv = 0, evt = 0;
      const end = A.S.year + 1;
      for (let g = 0; g < 5000 && A.S.year < end; g++) {
        const a0 = performance.now(); const r = A.advance(400); adv += performance.now() - a0;
        let h, k = 0; const e0 = performance.now();
        while ((h = A.headReady()) && k++ < 500) { if (h.type === 'event') { A.eventView(h); A.eventAuto(); ev++; } else A.skipPrompt(); }
        evt += performance.now() - e0;
        if (r.why === 'dead' || !A.pc().alive) break;
      }
      out.push({ year: A.S.year, ms: Math.round(performance.now() - t0), adv: Math.round(adv), evt: Math.round(evt), ev, alive: A.pc().alive, J: A.J ? A.J.e.length : null });
    }
    return out;
  });
  console.log(JSON.stringify(r));
  console.log('errors', errs.slice(0, 10));
  await browser.close();
})();
