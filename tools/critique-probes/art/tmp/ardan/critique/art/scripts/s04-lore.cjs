const { open, enter, shot } = require('./lib.cjs');
(async () => {
  const { b, pg, errs } = await open(1366, 768);
  await enter(pg, { seed: 4242, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 });
  const info = await pg.evaluate(() => {
    const o = {};
    o.LORE = typeof LORE !== 'undefined' ? Object.keys(LORE) : null;
    const C = (typeof LORE !== 'undefined' && LORE.cultures) || null;
    o.cults = C ? Object.entries(C).filter(([k]) => /^CUL-\d+$/.test(k)).map(([k, v]) => [k, v.name, v.race || v.races, v.region || v.land]).slice(0, 40) : null;
    o.nFar = C ? Object.keys(C).length : null;
    o.realmCult = GD.REALM_CULTURE;
    o.cultTable63 = UI.MINI ? Object.keys(UI.MINI) : (typeof MINI !== 'undefined' ? Object.keys(MINI) : null);
    return o;
  });
  console.log(JSON.stringify(info, null, 0).slice(0, 8000));
  await b.close();
})();
