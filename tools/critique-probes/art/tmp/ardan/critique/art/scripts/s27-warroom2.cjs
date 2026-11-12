const { open, enter, shot, SHOTS } = require('./lib.cjs');
(async () => {
  for (const [w, h] of [[1366, 768], [420, 900]]) {
    const { b, pg, errs } = await open(w, h);
    await enter(pg, { seed: 7311, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 30 });
    const r = await pg.evaluate(() => {
      UI.set.hints = false;
      A.V2MAP && A.V2MAP.SAT && (A.V2MAP.SAT.budgetMs = 1e9);
      const pc = A.pc(); const me = pc.realm; const en = A.neighbors(me)[0];
      A.enlist(pc); pc.mil.rank = 8;
      A.startWar(me, en, null, 'conquest');
      for (let g = 0; g < 10; g++) { A.advance(3); let hh, k = 0; while ((hh = A.headReady()) && k++ < 50) { if (hh.type === 'event') A.eventAuto(); else A.skipPrompt(); } }
      UI.screen = 'game'; UI.ov = null; UI.render();
      let ok = null; try { UI.warRoomOpen(); ok = UI.ov && UI.ov.type; } catch (e) { ok = String(e).slice(0, 100); }
      UI.render();
      return { ok, q: A.S.queue.map(q => q.type) };
    });
    console.log(w, JSON.stringify(r));
    await pg.waitForTimeout(2000);
    await shot(pg, `warroom-open-${w}`);
    // zoom in via wheel on the map canvas
    const cv = pg.locator('#warmap').first();
    if (await cv.count()) {
      const bb = await cv.boundingBox();
      for (const [z, n] of [[1, 3], [2, 6]]) {
        await pg.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
        for (let i = 0; i < n; i++) { await pg.mouse.wheel(0, -300); await pg.waitForTimeout(150); }
        await pg.waitForTimeout(1500);
        await shot(pg, `warroom-zoom${z}-${w}`);
      }
    }
    console.log(errs);
    await b.close();
  }
})();
