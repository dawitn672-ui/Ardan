const { open, enter, shot } = require('./lib.cjs');
(async () => {
  const { b, pg, errs } = await open(1366, 768);
  await enter(pg, { seed: 4242, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 18 });
  const info = await pg.evaluate(() => {
    const ks = Object.keys(A).filter(k => /enlist|levy|join|soldier|clergy|priest|ordain/i.test(k));
    const ui = Object.keys(UI.A).filter(k => /enlist|levy|join|soldier|clergy|priest|ordain|act|ov|person|show/i.test(k)).slice(0, 60);
    return { ks, ui };
  });
  console.log(JSON.stringify(info));
  await b.close();
})();
