const { open, enter, shot, SHOTS } = require('./lib.cjs');
const { SHEET_INIT } = require('./sheetlib.cjs');
(async () => {
  const { b, pg, errs } = await open(1700, 1000);
  await pg.evaluate(SHEET_INIT);
  await enter(pg, { seed: 4242, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 });
  await pg.evaluate(() => {
    const P = Object.values(A.S.people).filter(p => p.alive && A.age(p) >= 18 && A.age(p) <= 50);
    const rows = [];
    const cults = Object.keys(LORE.cultures).filter(k => /^CUL-\d+$/.test(k));
    for (const c of cults) {
      for (const sex of ['M', 'F']) {
        let src = P.find(p => p.cult === c && p.sex === sex && !p.ruler);
        let synth = false;
        if (!src) { src = SH.clone(P.find(p => p.race === LORE.cultures[c].race && p.sex === sex) || P[0]); src.cult = c; src.id = src.id + '_' + c; synth = true; }
        const q = SH.clone(src); q.id = src.id + '_com'; q.status = 'peasant'; q.house = null; q.noble = null; q.ruler = null;
        rows.push({ p: src, label: `${SH.cultName(c)} ${sex}<br>${src.status}${synth ? ' (synth)' : ''}`, kind: 'noble' });
        rows.push({ p: q, label: `${SH.cultName(c)} ${sex}<br>as peasant`, kind: 'com' });
      }
    }
    window.CUL = rows;
  });
  await pg.evaluate(() => SH.render(CUL.filter(r => r.kind === 'noble'), 72, 16, { bust: true }, 'dark', 'One real person per culture and sex (mostly nobles), 72 px bust'));
  let el = await pg.$('#sheet'); await el.screenshot({ path: SHOTS + 'pt-cultures-noble.png' });
  await pg.evaluate(() => SH.render(CUL.filter(r => r.kind === 'com'), 72, 16, { bust: true }, 'dark', 'The same people re-statused as peasants (dress by culture for commoners), 72 px'));
  el = await pg.$('#sheet'); await el.screenshot({ path: SHOTS + 'pt-cultures-peasant.png' });
  await pg.evaluate(() => SH.render(CUL.filter(r => r.kind === 'com'), 110, 16, {}, 'dark', 'Peasants by culture, full figure 110 px'));
  el = await pg.$('#sheet'); await el.screenshot({ path: SHOTS + 'pt-cultures-peasant-full.png' });
  console.log(errs);
  await b.close();
})();
