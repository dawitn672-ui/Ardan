const { open, enter, shot, SHOTS } = require('./lib.cjs');
(async () => {
  for (const [w, h] of [[1366, 768], [420, 900]]) {
    const { b, pg, errs } = await open(w, h);
    await enter(pg, { seed: 4242, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 26 });
    await pg.evaluate(() => { UI.set.motion = 'full'; UI.set.cutins = true; });
    const moments = await pg.evaluate(() => {
      const pc = A.pc(); const P = Object.values(A.S.people).filter(p => p.alive && p.id !== pc.id);
      const foe = P.find(p => p.sex === 'M' && A.age(p) > 20 && A.age(p) < 40);
      const kid = P.find(p => A.age(p) < 3) || P[0];
      const mother = A.S.people[(pc.parents || [])[1]] || P[1];
      return [
        { k: 'victory', pri: 8, word: 'Victory', sub: 'Battle of Carrness', who: pc.id },
        { k: 'duel', pri: 8, word: 'VS', sub: 'two names', who: pc.id, vs: foe && foe.id },
        { k: 'death', pri: 7, word: 'Farewell', sub: 'Your mother, Svala · 1053–1106', who: mother && mother.id },
        { k: 'year', pri: 1, word: '1106', sub: 'The year 1106 · you are 27', who: pc.id },
        { k: 'birth', pri: 6, word: 'A daughter', sub: 'Edith is born', who: kid && kid.id },
      ];
    });
    for (const m of moments) {
      await pg.evaluate((m) => { UI.set.motion = 'full'; UI.MOMENTS.show(m); }, m);
      for (const t of [450]) { await pg.waitForTimeout(400); await shot(pg, `cutin-${m.k}-${t}-${w}`); }
      await pg.waitForTimeout(800);
    }
    console.log(w, errs);
    await b.close();
  }
})();
