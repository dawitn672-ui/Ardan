const { open, enter, shot } = require('./lib.cjs');
(async () => {
  const { b, pg, errs } = await open(1366, 768);
  await enter(pg, { seed: 4242, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 });
  const info = await pg.evaluate(() => {
    const o = {};
    o.WOUNDS = Object.keys(GD.WOUNDS); o.BUILDS = GD.BUILDS; o.HAIRSTYLES = GD.HAIRSTYLES; o.BEARDS = GD.BEARDS; o.EYE_SHAPES = GD.EYE_SHAPES; o.NOSES = GD.NOSES; o.PAINTS = GD.PAINTS; o.JEWELS = GD.JEWELS;
    o.genApp = A.genAppearance ? A.genAppearance.toString().slice(0, 1500) : null;
    o.GEARarmor = GD.GEAR ? Object.keys(GD.GEAR).slice(0, 80) : null;
    o.TROOPS = GD.TROOPS ? Object.keys(GD.TROOPS) : null;
    o.CAREERS = GD.CAREERS ? Object.keys(GD.CAREERS) : null;
    return o;
  });
  console.log(JSON.stringify(info, null, 0).slice(0, 9000));
  await b.close();
})();
