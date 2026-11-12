const { open, enter, shot, SHOTS } = require('./lib.cjs');
(async () => {
  const W = +(process.argv[2] || 1366), H = W < 600 ? 900 : 768;
  const { b, pg, errs } = await open(W, H);
  await enter(pg, { seed: +(process.argv[3] || 5150), race: process.argv[4] || 'human', realm: process.argv[5] || 'POL-01', status: process.argv[6] || 'peasant', sex: 'F', startAge: 16 });
  await pg.evaluate(() => { UI.set.hints = false; UI.render(); });
  let cards = 0; const seen = [];
  for (let m = 0; m < 60 && cards < (+process.argv[7] || 10); m++) {
    // press the real Next month button
    const nm = pg.locator('button:has-text("Next month"), button:has-text("Go on"), [data-a="nextMonth"], [data-a="v2Month"], [data-a="v2Next"]').first();
    if (!(await nm.count())) { console.log('no next month button'); break; }
    await nm.click({ timeout: 4000 }).catch(e => console.log('click fail', e.message.slice(0, 80)));
    await pg.waitForTimeout(700);
    for (let k = 0; k < 4; k++) {
      const ev = await pg.evaluate(() => { const q = A.S.queue[0]; return q && q.type === 'event' ? (q.ev || q.id || (q.e && q.e.id) || 'event') : (q ? q.type : null); });
      if (!ev) break;
      const vis = await pg.evaluate(() => !!document.querySelector('.scene, .evcard, .event, .mbox, [class*="scene"]'));
      if (ev && vis) {
        cards++;
        const name = `ev-${W}-${String(cards).padStart(2, '0')}`;
        await pg.waitForTimeout(600);
        await shot(pg, name);
        seen.push([name, ev]);
        // answer: click first choice
        const c = pg.locator('.choices button, [data-a="evChoose"], [data-a="choose"]').first();
        if (await c.count()) { await c.click({ timeout: 3000 }).catch(() => {}); await pg.waitForTimeout(700); await shot(pg, name + '-result'); }
        const cont = pg.locator('button:has-text("Continue"), [data-a="evClose"], [data-a="eventClose"]').first();
        if (await cont.count()) { await cont.click({ timeout: 3000 }).catch(() => {}); await pg.waitForTimeout(500); }
      } else {
        await pg.evaluate(() => { const h = A.headReady(); if (h && h.type === 'event') A.eventAuto(); else if (h) A.skipPrompt(); UI.render(); });
      }
    }
  }
  console.log(JSON.stringify(seen), errs);
  await b.close();
})();
