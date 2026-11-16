const { open, enter, shot, SHOTS } = require('./lib.cjs');
const { SHEET_INIT } = require('./sheetlib.cjs');
(async () => {
  const { b, pg, errs } = await open(1500, 1000);
  await pg.evaluate(SHEET_INIT);
  await enter(pg, { seed: 4242, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 });
  await pg.evaluate(() => {
    const P = Object.values(A.S.people).filter(p => p.alive && A.age(p) >= 14).sort((a, b) => a.id < b.id ? -1 : 1);
    let h = 12345; const pick = []; const used = new Set();
    while (pick.length < 24) { h = (h * 1103515245 + 12345) & 0x7fffffff; const i = h % P.length; if (!used.has(i)) { used.add(i); pick.push(P[i]); } }
    window.PICK = pick;
  });
  for (const [i0, i1, nm] of [[0, 8, 'a'], [8, 16, 'b'], [16, 24, 'c']]) {
    await pg.evaluate(([i0, i1]) => SH.render(PICK.slice(i0, i1).map(p => ({ p, label: SH.lab(p, `${p.app.hstyle}/${p.app.beard}/${p.app.build}`) })), 170, 4, { bust: true }, 'dark', ''), [i0, i1]);
    const el = await pg.$('#sheet'); await el.screenshot({ path: SHOTS + `pt-random24-zoom-${nm}.png` });
  }
  await b.close();
})();
