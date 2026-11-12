const { open, enter, shot, SHOTS } = require('./lib.cjs');
const { SHEET_INIT } = require('./sheetlib.cjs');
(async () => {
  const { b, pg, errs } = await open(1600, 1000);
  await pg.evaluate(SHEET_INIT);
  await enter(pg, { seed: 4242, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 });
  const ages = [0, 1, 3, 6, 9, 12, 14, 16, 18, 22, 30, 40, 50, 60, 70, 80];
  await pg.evaluate((ages) => {
    const base = A.pc();
    const P = Object.values(A.S.people).filter(p => p.alive);
    const findOne = (race, sex) => P.find(p => p.race === race && p.sex === sex && A.age(p) > 20) || base;
    const rows = [];
    for (const [race, sex, scale, extra] of [['human', 'M', 1, { beard: 'full', hstyle: 'short' }], ['human', 'F', 1, { hstyle: 'long' }], ['human', 'M', 1, { beard: 'none', hstyle: 'curly' }], ['elf', 'F', 5, {}], ['dwarf', 'M', 2.5, {}], ['orc', 'M', 0.8, {}]]) {
      const src = findOne(race, sex);
      for (const a of ages) {
        const p = SH.clone(src); p.id = src.id + '_age' + a; p.born = A.S.year - Math.round(a * scale); p.sex = sex; p.race = race; p.status = 'peasant'; p.house = null; p.ruler = null; p.noble = null; p.mil = null; p.job = null;
        p.app = Object.assign({}, src.app, extra);
        rows.push({ p, label: `${race} ${sex} ${Math.round(a * scale)}` });
      }
    }
    window.AGES = rows;
  }, ages);
  await pg.evaluate((n) => SH.render(AGES, 88, n, { bust: true }, 'dark', 'Ageing: the same person at ages (human M bearded, human F, human M clean-shaven, elf F x5, dwarf M x2.5, orc M x0.8), 88 px'), ages.length);
  let el = await pg.$('#sheet'); await el.screenshot({ path: SHOTS + 'pt-ages-88.png' });
  await pg.evaluate((n) => SH.render(AGES.slice(0, n * 2), 120, n, {}, 'dark', 'Ageing, full figure 120px (human M, human F)'), ages.length);
  el = await pg.$('#sheet'); await el.screenshot({ path: SHOTS + 'pt-ages-full.png' });
  console.log(errs);
  await b.close();
})();
