const { open, enter, shot } = require('./lib.cjs');
(async () => {
  for (const [w, h] of [[1366, 768], [420, 900]]) {
    const { b, pg, errs } = await open(w, h);
    await pg.waitForTimeout(1500);
    await shot(pg, `title-${w}`);
    await enter(pg, { seed: 4242, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 });
    await pg.waitForTimeout(800);
    await shot(pg, `life-peasant16-${w}`);
    const info = await pg.evaluate(() => ({ tabs: UI.GROUPS ? UI.GROUPS.map(g => [g.k || g.id || g.name, g.subs && g.subs.map(s => s[0])]) : null, tab: UI.tab, ver: document.title }));
    console.log(w, JSON.stringify(info));
    console.log('errs', errs);
    await b.close();
  }
})();
