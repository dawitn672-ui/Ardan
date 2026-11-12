// What a second press of the big button does while the month runs
const { chromium, open, shot, HELPERS } = require('./lib.cjs');
(async () => {
  const browser = await chromium.launch();
  const { ctx, page } = await open(browser, 420, 900, { touch: true });
  await page.evaluate(HELPERS);
  await page.evaluate(() => { T.enter({ seed: 5151, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 22 }); });
  await page.waitForTimeout(400);
  for (let trial = 0; trial < 4; trial++) {
    await page.evaluate(() => { let h, g = 0; while ((h = A.headReady()) && g++ < 50) { if (h.type === 'event') { A.eventView(h); A.eventAuto(); } else A.skipPrompt(); } UI.ov = null; UI.render(); });
    await page.waitForTimeout(300);
    const d0 = await page.evaluate(() => A.absDay());
    const b = await page.$('[data-a="v2Next"]');
    if (!b) { console.log('no button'); continue; }
    await b.tap();
    await page.waitForTimeout(350);
    const mid = await page.evaluate(() => { const e = document.querySelector('.v2-step.primary, [data-a="stepStop"]'); return e ? e.getAttribute('data-a') + ' "' + e.innerText.replace(/\s+/g, ' ').trim() + '" aria=' + e.getAttribute('aria-label') : 'none'; });
    await shot(page, 'doubletap-running-' + trial);
    const s = await page.$('[data-a="stepStop"]');
    if (s) await s.tap();
    await page.waitForTimeout(1500);
    const after = await page.evaluate((d0) => ({ days: A.absDay() - d0, date: (document.querySelector('[data-tt="date"]') || {}).innerText, btn: (document.querySelector('.v2-step.primary') || {}).innerText }), d0);
    console.log('trial', trial, 'while running:', mid, '| after 2nd tap:', JSON.stringify(after));
  }
  await browser.close();
})();
