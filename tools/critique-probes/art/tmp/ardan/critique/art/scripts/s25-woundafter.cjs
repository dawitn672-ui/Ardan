const { open, enter, shot, SHOTS } = require('./lib.cjs');
(async () => {
  const { b, pg, errs } = await open(1366, 768);
  await enter(pg, { seed: 7311, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22 });
  await pg.evaluate(() => {
    UI.set.hints = false;
    const pc = A.pc(); const me = pc.realm; const en = A.neighbors(me)[0];
    A.enlist(pc); A.startWar(me, en, null, 'conquest');
    let found = null;
    for (let g = 0; g < 400 && !found; g++) {
      A.advance(3);
      let hh, k = 0;
      while ((hh = A.headReady()) && k++ < 50) {
        if (hh.type === 'choice' && (hh.options || []).some(o => o && /^ws/.test(o.fn || ''))) { found = 1; break; }
        if (hh.type === 'event') A.eventAuto(); else A.skipPrompt();
      }
    }
    UI.screen = 'game'; UI.render();
  });
  const before = await pg.evaluate(() => JSON.stringify(A.pc().wounds));
  const port = pg.locator('#profile svg.portrait, .rail svg.portrait, svg.portrait').first();
  await port.screenshot({ path: SHOTS + 'wound-before.png' }).catch(() => {});
  await pg.locator('.choices button').first().click().catch(() => {});
  await pg.waitForTimeout(600);
  for (let i = 0; i < 6; i++) { const l = pg.locator('[data-a^="v2w"]').first(); if (!(await l.count())) break; await l.click().catch(() => {}); await pg.waitForTimeout(500); }
  await pg.waitForTimeout(800);
  const after = await pg.evaluate(() => ({ w: A.pc().wounds, log: (A.S.log || []).slice(-6).map(x => x.t || x).join(' | ').slice(0, 600), health: A.pc().health }));
  await pg.evaluate(() => { UI.render(); });
  await pg.waitForTimeout(500);
  await pg.locator('svg.portrait').first().screenshot({ path: SHOTS + 'wound-after.png' }).catch(() => {});
  await shot(pg, 'wound-after-screen');
  console.log('before', before); console.log('after', JSON.stringify(after));
  await b.close();
})();
