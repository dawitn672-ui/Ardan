const { open, enter, shot } = require('./lib.cjs');
(async () => {
  const { b, pg, errs } = await open(1366, 768);
  await enter(pg, { seed: 4242, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 });
  const info = await pg.evaluate(() => {
    const o = {};
    o.GDkeys = Object.keys(GD);
    const c = GD.CULTS || GD.CULTURES || GD.CULT || (A.S && A.S.cults);
    o.cultSample = c ? JSON.stringify(Object.entries(c).slice(0, 3)).slice(0, 1500) : null;
    o.races = Object.keys(GD.RACES);
    o.skin = GD.SKIN; o.hair = GD.HAIR; o.eye = GD.EYE || GD.EYES;
    o.statuses = GD.STATUS ? Object.keys(GD.STATUS) : null;
    return o;
  });
  console.log(JSON.stringify(info, null, 0).slice(0, 6000));
  await b.close();
})();
