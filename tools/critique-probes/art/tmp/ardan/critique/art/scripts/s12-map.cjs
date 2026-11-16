const { open, enter, shot, SHOTS } = require('./lib.cjs');
(async () => {
  for (const [w, h] of [[1366, 768], [420, 900]]) {
    const { b, pg, errs } = await open(w, h);
    await enter(pg, { seed: 4242, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 });
    await pg.evaluate(() => { UI.set.hints = false; A.V2MAP && A.V2MAP.SAT && (A.V2MAP.SAT.budgetMs = 1e9); });
    // story column map toggle (desktop) 
    if (w > 800) {
      const btn = await pg.$('text=Map');
      if (btn) { await btn.click(); await pg.waitForTimeout(1200); await shot(pg, `map-storycol-${w}`); }
    }
    // world tab map
    await pg.evaluate(() => { UI.tab = 'world'; UI.worldView = 'map'; UI.set.atlasFog = false; UI.render(); });
    await pg.waitForTimeout(1500);
    await shot(pg, `map-worldtab-${w}`, { fullPage: false });
    // full map at zooms
    await pg.evaluate(() => { UI.A.ov('bigmap'); });
    await pg.waitForTimeout(1500);
    await shot(pg, `map-full-open-${w}`);
    for (const z of [1, 2, 3, 6, 12]) {
      await pg.evaluate((z) => {
        const P = A.S.prov[A.realm('POL-01').capitalProv];
        const ww = 7000 / z; UI.gm.view = UI.wrClampView({ x0: P.sx - ww / 2, y0: P.sy - ww / 3.06, w: ww, h: 0 }); UI.gmDraw();
      }, z);
      await pg.waitForTimeout(900);
      await pg.evaluate(() => UI.gmDraw());
      await pg.waitForTimeout(300);
      await shot(pg, `map-full-z${z}-${w}`);
    }
    // the whole continent view
    await pg.evaluate(() => { UI.gm.view = UI.wrClampView({ x0: 0, y0: 0, w: 7000, h: 0 }); UI.gmDraw(); });
    await pg.waitForTimeout(900); await pg.evaluate(() => UI.gmDraw());
    await shot(pg, `map-full-whole-${w}`);
    const info = await pg.evaluate(() => ({ modes: MAP.MODES, gm: UI.gm && UI.gm.view, canvas: (() => { const c = document.querySelector('#gmap'); return c && [c.width, c.height, c.getBoundingClientRect().width, c.getBoundingClientRect().height]; })() }));
    console.log(w, JSON.stringify(info).slice(0, 800), errs);
    await b.close();
  }
})();
