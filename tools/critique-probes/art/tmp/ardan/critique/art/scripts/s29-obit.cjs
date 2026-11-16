const { open, enter, shot, SHOTS } = require('./lib.cjs');
(async () => {
  const { b, pg, errs } = await open(1366, 768);
  await enter(pg, { seed: 4242, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 26 });
  await pg.evaluate(() => { UI.set.hints = false; const pc = A.pc(); try { A.die(pc, 'a fever'); } catch (e) { pc.alive = false; } UI.render(); });
  await pg.waitForTimeout(800);
  const l = pg.locator('text=Your life is over').first();
  if (await l.count()) { await l.click().catch(() => {}); await pg.waitForTimeout(2500); }
  await shot(pg, 'obituary-1366');
  console.log(errs);
  await b.close();
})();
