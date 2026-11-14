const { open, enter, shot, SHOTS } = require('./lib.cjs');
const { SHEET_INIT } = require('./sheetlib.cjs');
(async () => {
  const { b, pg, errs } = await open(1400, 900);
  await pg.evaluate(SHEET_INIT);
  await enter(pg, { seed: 5150, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 16 });
  const r = await pg.evaluate(() => {
    const P = Object.values(A.S.people).filter(p => /^(Cuthbert|Wendel|Garth|Corbin|Aldith)$/.test(p.given));
    window.CB = P.slice(0, 10);
    return P.map(p => [p.id, p.given, p.sex, A.age(p), p.app.hstyle, p.app.beard, p.status]);
  });
  console.log(JSON.stringify(r));
  await pg.evaluate(() => SH.render(CB.map(p => ({ p, label: SH.lab(p, p.app.hstyle + '/' + p.app.beard) })), 120, 8, { bust: true }, 'dark', 'Named NPCs from the cards (seed 5150), 120 px'));
  const el = await pg.$('#sheet'); await el.screenshot({ path: SHOTS + 'pt-cardnpcs.png' });
  await b.close();
})();
