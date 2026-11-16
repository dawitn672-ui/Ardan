// What a second press does while the month runs: keyboard N twice (desktop), and a second tap on the big button (phone).
const { chromium, open, shot, HELPERS } = require('./lib.cjs');
(async () => {
  const browser = await chromium.launch();
  for (const [W, H, touch] of [[1366, 768, false], [420, 900, true]]) {
    const { ctx, page } = await open(browser, W, H, { touch, mobile: touch });
    await page.evaluate(HELPERS);
    await page.evaluate(() => { T.enter({ seed: 5151, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 22 }); });
    await page.waitForTimeout(600);
    let done = 0;
    for (let trial = 0; trial < 12 && done < 4; trial++) {
      for (let k = 0; k < 40; k++) { const st = await page.evaluate(() => { T.drain(); UI.ov = null; UI.refresh(); return UI.stepper.run || A.S.queue.length > 0; }); if (!st) break; await page.waitForTimeout(250); }
      const d0 = await page.evaluate(() => ({ d: A.absDay(), date: document.querySelector('[data-tt="date"]').innerText.replace(/\s+/g, ' ') }));
      let how;
      if (!touch) {
        await page.keyboard.press('n'); await page.waitForTimeout(200);
        const mid = await page.evaluate(() => document.querySelector('.v2-step.primary').innerText.trim() + '/' + document.querySelector('.v2-step.primary').getAttribute('data-a'));
        if (!/stepStop/.test(mid)) { await page.waitForFunction(() => !UI.stepper.run || UI.stepper.wait, null, { timeout: 60000 }).catch(() => {}); continue; }
        await page.keyboard.press('n'); how = 'key N, then N again after 200 ms (button read "' + mid + '")';
      } else {
        await page.tap('[data-a="v2Next"]:not([aria-disabled="true"])', { timeout: 4000 }).catch(() => {});
        await page.waitForTimeout(250);
        // a second tap at the same spot of the screen, as an impatient thumb would give it
        const mid = await page.evaluate(() => document.querySelector('.v2-step.primary').innerText.trim() + '/' + document.querySelector('.v2-step.primary').getAttribute('data-a'));
        if (!/stepStop/.test(mid)) { await page.waitForFunction(() => !UI.stepper.run || UI.stepper.wait, null, { timeout: 60000 }).catch(() => {}); continue; }
        if (done === 0) await shot(page, 'v-month-running', { nomeasure: true, wait: 0 });
        await page.touchscreen.tap(210, 806); how = 'tap, then a second tap at the same place after 250 ms (button read "' + mid + '")';
      }
      await page.waitForTimeout(1500);
      const aft = await page.evaluate(d0 => ({ days: A.absDay() - d0.d, date: document.querySelector('[data-tt="date"]').innerText.replace(/\s+/g, ' '), btn: document.querySelector('.v2-step.primary').innerText.trim(), run: UI.stepper.run, wait: UI.stepper.wait, q: A.S.queue.length, toast: ((document.querySelector('#toast-stack') || {}).innerText || '').replace(/\n/g, ' | ').slice(0, 80) }), d0);
      done++;
      console.log(W, how, '| from', d0.date, '| after 1.5 s:', JSON.stringify(aft));
      if (done === 1) await shot(page, 'v-month-stopped', { nomeasure: true, wait: 0 });
    }
    await ctx.close();
  }
  await browser.close();
})();
