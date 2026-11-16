const { open, enter, shot, SHOTS } = require('./lib.cjs');
(async () => {
  for (const [w, h] of [[1366, 768], [420, 900]]) {
    const { b, pg, errs } = await open(w, h);
    await enter(pg, { seed: 7311, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 30 });
    await pg.evaluate(() => {
      UI.set.hints = false;
      const pc = A.pc(); const me = pc.realm; const en = A.neighbors(me)[0];
      A.enlist(pc); pc.mil.rank = 8;
      A.startWar(me, en, null, 'conquest');
      let found = null;
      for (let g = 0; g < 300 && !found; g++) {
        A.advance(3);
        let hh, k = 0;
        while ((hh = A.headReady()) && k++ < 50) {
          if (hh.type === 'choice' && (hh.options || []).some(o => o && /^ws/.test(o.fn || ''))) { found = 1; break; }
          if (hh.type === 'event') A.eventAuto(); else A.skipPrompt();
        }
      }
    });
    await pg.evaluate(() => { UI.screen = 'game'; UI.render(); });
    await pg.waitForTimeout(800);
    await pg.locator('.choices button').first().click({ timeout: 3000 }).catch(() => {});
    await pg.waitForTimeout(1500);
    // captain view
    const cap = pg.locator('text=Captain — companies').first();
    if (await cap.count()) { await cap.click().catch(() => {}); await pg.waitForTimeout(800); await shot(pg, `cmd-companies-${w}`); }
    const gen = pg.locator('text=General — units').first();
    if (await gen.count()) { await gen.click().catch(() => {}); await pg.waitForTimeout(500); }
    const adv = pg.locator('text=Sound the advance').first();
    if (await adv.count()) {
      await adv.click().catch(() => {});
      for (let i = 0; i < 8; i++) { await pg.waitForTimeout(i < 4 ? 250 : 1200); await shot(pg, `cmd-advance-f${i}-${w}`); }
    }
    const fight = pg.locator('text=Fight it out').first();
    if (await fight.count()) { await fight.click().catch(() => {}); for (let i = 0; i < 4; i++) { await pg.waitForTimeout(700); await shot(pg, `cmd-fightout-f${i}-${w}`); } }
    await pg.waitForTimeout(3000);
    await shot(pg, `cmd-end-${w}`);
    console.log(w, 'errs', errs);
    await b.close();
  }
})();
