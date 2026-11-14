const { open, enter, shot } = require('./lib.cjs');
(async () => {
  for (const [w, h] of [[1366, 768], [420, 900]]) {
    const { b, pg, errs } = await open(w, h);
    await enter(pg, { seed: 4242, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 20 });
    await pg.evaluate(() => { UI.tab = 'people'; UI.render(); });
    await pg.waitForTimeout(500);
    await shot(pg, `people-noble20-${w}`);
    // open a person's page
    const pid = await pg.evaluate(() => { const p = A.pc(); const f = p.parents && p.parents[0]; return f; });
    await pg.evaluate((pid) => { UI.A.ov && UI.A.ov(pid); }, pid);
    await pg.waitForTimeout(500);
    await shot(pg, `person-father-${w}`);
    await pg.evaluate(() => { UI.ov = null; UI.tab = 'legacy'; UI.render(); });
    await pg.waitForTimeout(500);
    await shot(pg, `legacy-${w}`);
    const sizes = await pg.evaluate(() => [...document.querySelectorAll('svg.portrait, .portrait svg, svg.mini')].map(s => s.getBoundingClientRect().width|0).reduce((o,k)=>(o[k]=(o[k]||0)+1,o),{}));
    console.log(w, 'portrait sizes on legacy', JSON.stringify(sizes), errs);
    await b.close();
  }
})();
