const { open, enter, shot, SHOTS } = require('./lib.cjs');
(async () => {
  for (const [w, h] of [[1366, 768], [420, 900]]) {
    const { b, pg, errs } = await open(w, h);
    await enter(pg, { seed: 7311, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22 });
    const r = await pg.evaluate(() => {
      UI.set.hints = false;
      const pc = A.pc(); const me = pc.realm; const en = A.neighbors(me)[0];
      let e1 = null; try { e1 = A.enlist(pc); } catch (e) { e1 = String(e).slice(0, 100); }
      A.startWar(me, en, null, 'conquest');
      const types = {};
      let found = null;
      const d0 = A.absDay();
      for (let g = 0; g < 400 && !found; g++) {
        A.advance(3);
        let hh, k = 0;
        while ((hh = A.headReady()) && k++ < 50) {
          types[hh.type] = (types[hh.type] || 0) + 1;
          if (hh.type === 'v2battle' || hh.type === 'battle' || hh.type === 'warroom') { found = hh.type; break; }
          if (hh.type === 'choice' && (hh.options || []).some(o => o && (o.fn === 'wsLine' || o.fn === 'wsPart' || o.fn === 'wsLead'))) { found = 'choice:' + JSON.stringify(hh.options.map(o => [o.fn, o.t || o.label])).slice(0, 300); break; }
          if (hh.type === 'event') A.eventAuto(); else A.skipPrompt();
        }
        if (!A.pc().alive) break;
      }
      return { e1, found, types, days: A.absDay() - d0, mil: pc.mil, alive: A.pc().alive };
    });
    console.log(w, JSON.stringify(r));
    await pg.evaluate(() => { UI.screen = 'game'; UI.render(); });
    await pg.waitForTimeout(1200);
    await shot(pg, `battle-card-${w}`);
    for (let i = 0; i < 6; i++) {
      const info = await pg.evaluate(() => [...document.querySelectorAll('[data-a]')].filter(e => /v2w|choose|ev|q/i.test(e.getAttribute('data-a'))).slice(0, 8).map(e => e.getAttribute('data-a') + ':' + (e.getAttribute('data-v') || '') + ':' + e.textContent.trim().slice(0, 40)));
      console.log('phase', i, JSON.stringify(info));
      let btn = await pg.locator('[data-a^="v2w"]').first();
      if (!(await btn.count())) btn = await pg.locator('.choices button').first();
      if (!(await btn.count())) break;
      await btn.click({ timeout: 3000 }).catch(() => {});
      await pg.waitForTimeout(900);
      await shot(pg, `battle-phase${i + 1}-${w}`);
    }
    console.log('errs', errs);
    await b.close();
  }
})();
