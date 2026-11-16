// What "Next year" would cost: (a) through today's stepper (84's 'until' step: slices, the page drawn between them, a wait at
// each card, cards answered at once by the bot), (b) the engine alone (A.advance to the year's end, no drawing).
const { chromium, open, HELPERS, cpuClock } = require('./lib.cjs');
(async () => {
  const browser = await chromium.launch();
  const { ctx, page } = await open(browser, 1366, 768, {});
  const clk = await cpuClock(page);
  await page.evaluate(HELPERS);
  await page.evaluate(() => { T.enter({ seed: 5151, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 22 }); });
  const stepperYear = async label => {
    await page.evaluate(() => { T.drain(); UI.ov = null; UI.refresh(); });
    await page.waitForFunction(() => !UI.stepper.run, null, { timeout: 60000 }).catch(() => {});
    const y0 = await page.evaluate(() => A.S.year);
    const c0 = await clk.get(); const t0 = Date.now(); let cards = 0, restarts = 0;
    await page.evaluate(() => UI.stepStart('until'));
    for (let g = 0; g < 4000; g++) {
      const s = await page.evaluate(() => { const S = UI.stepper; if (S.run && S.wait) { const h = A.headReady(); if (h) { if (h.type === 'event') { A.eventView(h); A.eventAuto(); } else A.skipPrompt(); UI.ov = null; UI.refresh(); return 'card'; } UI.stepGo(); return 'go'; } return S.run ? 'run' : 'done:' + A.S.year; });
      if (s === 'card') cards++;
      if (s.startsWith('done')) { if (+s.split(':')[1] > y0) break; restarts++; await page.evaluate(() => { T.drain(); UI.ov = null; UI.refresh(); UI.stepStart('until'); }); }
      await page.waitForTimeout(15);
    }
    const c1 = await clk.get();
    console.log(label, 'stepper year: wall', Date.now() - t0, 'ms, cpu', Math.round((c1.TaskDuration - c0.TaskDuration) * 1000), 'ms, cards', cards, 'layouts', c1.LayoutCount - c0.LayoutCount, 'restarts', restarts, 'now', await page.evaluate(() => A.S.year + ' day ' + (A.S.warClock || 0)));
  };
  const engineYear = async label => {
    await page.evaluate(() => { T.drain(); UI.ov = null; UI.refresh(); });
    const c0 = await clk.get(); const t0 = Date.now();
    const r = await page.evaluate(() => { const y = A.S.year; let cards = 0, g = 0; while (A.S.year === y && g++ < 400) { A.advance(31); let h, k = 0; while ((h = A.headReady()) && k++ < 100) { cards++; if (h.type === 'event') { A.eventView(h); A.eventAuto(); } else A.skipPrompt(); } } UI.ov = null; UI.refresh(); return cards; });
    const c1 = await clk.get();
    console.log(label, 'engine year + one redraw: wall', Date.now() - t0, 'ms, cpu', Math.round((c1.TaskDuration - c0.TaskDuration) * 1000), 'ms, cards', r);
  };
  await stepperYear('year 0');
  await engineYear('year 1');
  await page.evaluate(() => { T.play(23); T.show('life'); });
  await page.evaluate(() => { const c = document.querySelector('#mo-cut'); if (c) c.remove(); });
  await stepperYear('year 25');
  await engineYear('year 26');
  await browser.close();
})();
