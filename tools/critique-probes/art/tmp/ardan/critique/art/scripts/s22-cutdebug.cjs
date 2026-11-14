const { open, enter, shot, SHOTS } = require('./lib.cjs');
(async () => {
  const { b, pg, errs } = await open(1366, 768);
  await enter(pg, { seed: 4242, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 26 });
  const r = await pg.evaluate(() => {
    UI.set.motion = 'full'; UI.set.cutins = true;
    const pc = A.pc();
    const m = { k: 'victory', pri: 8, word: 'Victory', sub: 'Battle of Carrness', who: pc.id };
    let err = null; try { UI.MOMENTS.show(m); } catch (e) { err = String(e); }
    const el = document.getElementById('mo-cut');
    return { err, el: !!el, html: el ? el.outerHTML.slice(0, 300) : null, mode: UI.MOMENTS.mode(), cut: UI.set.cutins, src: UI.MOMENTS.show.toString().slice(0, 300) };
  });
  console.log(JSON.stringify(r, null, 1));
  await pg.waitForTimeout(400);
  await shot(pg, 'cutin-debug');
  await b.close();
})();
