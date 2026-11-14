const { open, enter, shot, SHOTS } = require('./lib.cjs');
(async () => {
  const { b, pg, errs } = await open(1366, 768);
  await enter(pg, { seed: 4242, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 });
  await pg.evaluate(() => { UI.set.hints = false; UI.set.atlasFog = false; A.V2MAP && A.V2MAP.SAT && (A.V2MAP.SAT.budgetMs = 1e9); UI.A.ov('bigmap'); });
  await pg.waitForTimeout(1200);
  for (const mode of ['Terrain', 'Diplomacy', 'Faiths']) {
    const l = pg.locator(`.mbox button:has-text("${mode}"), button:has-text("${mode}")`).first();
    if (await l.count()) { await l.click().catch(() => {}); await pg.waitForTimeout(1200); await shot(pg, `map-mode-${mode.toLowerCase()}-1366`); }
  }
  // back to realms, click on a province near home to see details
  const r = pg.locator('button:has-text("Realms")').first(); if (await r.count()) await r.click().catch(() => {});
  await pg.waitForTimeout(800);
  const box = await pg.locator('#gmap').boundingBox();
  if (box) { await pg.mouse.click(box.x + box.width * 0.45, box.y + box.height * 0.3); await pg.waitForTimeout(1000); await shot(pg, 'map-province-click-1366'); }
  // count rivers/roads in data
  const info = await pg.evaluate(() => {
    const o = {};
    o.v2keys = A.V2MAP ? Object.keys(A.V2MAP) : null;
    o.roads = !!(A.S.roads || (A.V2MAP && A.V2MAP.roads));
    o.provKeys = Object.keys(A.S.prov[0] || {});
    const terr = {}; for (const p of A.S.prov) terr[p.terr] = (terr[p.terr] || 0) + 1; o.terr = terr;
    const biome = {}; for (const p of A.S.prov) biome[p.biome] = (biome[p.biome] || 0) + 1; o.biome = biome;
    // provinces named oasis / caravanserai / waste and their terrain
    o.oddNames = A.S.prov.filter(p => /Oasis|Caravanserai|Waste|Dunes|Sands/i.test(p.name)).map(p => p.name + ':' + p.terr + '/' + p.biome).slice(0, 30);
    return o;
  });
  console.log(JSON.stringify(info, null, 0).slice(0, 4000));
  await b.close();
})();
