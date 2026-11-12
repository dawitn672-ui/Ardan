const { open, enter, shot, SHOTS } = require('./lib.cjs');
(async () => {
  for (const [w, h] of [[1366, 768], [420, 900]]) {
    const { b, pg, errs } = await open(w, h);
    await enter(pg, { seed: 4242, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 26 });
    const r = await pg.evaluate(() => {
      UI.set.hints = false; UI.set.cutins = false;
      const pc = A.pc();
      const foe = Object.values(A.S.people).find(p => p.alive && p.id !== pc.id && p.sex === 'M' && A.age(p) > 25 && A.age(p) < 45 && p.race === 'orc') || Object.values(A.S.people).find(p => p.alive && p.id !== pc.id);
      let res = null; try { res = A.startDuel(pc, foe); } catch (e) { res = String(e).slice(0, 120); }
      UI.render();
      return { res: typeof res === 'object' ? Object.keys(res || {}) : res, q: A.S.queue.map(q => q.type), foe: foe && foe.given + ' ' + foe.race };
    });
    console.log(w, JSON.stringify(r));
    await pg.waitForTimeout(1200);
    await shot(pg, `duel-${w}`);
    // a few exchanges
    for (let i = 0; i < 3; i++) { const l = pg.locator('#modal button[data-a="duel"]').first(); if (!(await l.count())) break; await l.click().catch(() => {}); await pg.waitForTimeout(700); }
    await shot(pg, `duel-mid-${w}`);
    // death screen
    await pg.evaluate(() => {
      UI.ov = null; A.S.queue = [];
      const pc = A.pc();
      try { A.die ? A.die(pc, 'a fever') : (pc.alive = false); } catch (e) { pc.alive = false; }
      UI.render();
    });
    await pg.waitForTimeout(2500);
    await shot(pg, `death-${w}`);
    console.log(errs);
    await b.close();
  }
})();
