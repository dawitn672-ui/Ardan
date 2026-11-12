const { open, enter, shot, SHOTS } = require('./lib.cjs');
const { SHEET_INIT } = require('./sheetlib.cjs');
(async () => {
  const { b, pg, errs } = await open(1700, 1000);
  await pg.evaluate(SHEET_INIT);
  await enter(pg, { seed: 4242, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 30 });
  await pg.evaluate(() => {
    const base = SH.clone(A.pc()); base.wounds = []; base.quirks = []; base.app.beard = 'short'; base.app.hstyle = 'short';
    const rows = [];
    const mk = (tag, f) => { const p = SH.clone(base); p.id = base.id; f(p); rows.push({ p, label: tag }); };
    mk('none', p => {});
    for (const w of Object.keys(GD.WOUNDS)) mk('wound ' + w, p => { p.wounds = [{ k: w, y: A.S.year - 2 }]; });
    for (const q of ['scarred', 'freckled', 'birthmark', 'fierceface', 'beautiful', 'plain', 'sickly', 'tall', 'short', 'bigframe']) mk('quirk ' + q, p => { p.quirks = [q]; });
    for (const pt of GD.PAINTS) mk('paint ' + pt, p => { p.app.paint = pt; });
    for (const j of GD.JEWELS) mk('jewel ' + j, p => { p.app.jewel = j; });
    mk('health 10', p => { p.health = 10; });
    mk('happy 0', p => { p.happy = 0; });
    mk('happy 100', p => { p.happy = 100; });
    mk('dead', p => { p.alive = false; });
    window.WR = rows;
    const B = [];
    for (const bd of GD.BUILDS) { const p = SH.clone(base); p.app.build = bd; B.push({ p, label: 'build ' + bd }); }
    for (const h of [150, 165, 180, 195]) { const p = SH.clone(base); p.app.height = h; B.push({ p, label: 'height ' + h }); }
    for (const f of [0, 1, 2, 3]) { const p = SH.clone(base); p.app.face = f; B.push({ p, label: 'face ' + f, bust: true }); }
    for (const f of [0, 1, 2]) { const p = SH.clone(base); p.app.eyeShape = f; B.push({ p, label: 'eyeShape ' + f, bust: true }); }
    for (const f of [0, 1, 2]) { const p = SH.clone(base); p.app.nose = f; B.push({ p, label: 'nose ' + f, bust: true }); }
    for (const f of [0, 1, 2]) { const p = SH.clone(base); p.app.brow = f; B.push({ p, label: 'brow ' + f, bust: true }); }
    for (const f of [0, 1, 2]) { const p = SH.clone(base); p.app.mouth = f; B.push({ p, label: 'mouth ' + f, bust: true }); }
    window.BR = B;
  });
  await pg.evaluate(() => SH.render(WR, 96, 14, { bust: true }, 'dark', 'One man, 30: each wound (2 years old), quirk, paint, jewel and state, 96 px bust'));
  let el = await pg.$('#sheet'); await el.screenshot({ path: SHOTS + 'pt-wounds-bust.png' });
  await pg.evaluate(() => SH.render(WR.slice(0, 26), 150, 13, {}, 'dark', 'Wounds, full figure 150 px'));
  el = await pg.$('#sheet'); await el.screenshot({ path: SHOTS + 'pt-wounds-full.png' });
  await pg.evaluate(() => SH.render(BR.filter(x => !x.bust), 150, 12, {}, 'dark', 'Build and height, full figure 150 px'));
  el = await pg.$('#sheet'); await el.screenshot({ path: SHOTS + 'pt-builds-full.png' });
  await pg.evaluate(() => SH.render(BR.filter(x => x.bust), 120, 16, { bust: true }, 'dark', 'Face, eye shape, nose, brow and mouth parameters, 120 px bust'));
  el = await pg.$('#sheet'); await el.screenshot({ path: SHOTS + 'pt-faceparams.png' });
  console.log(errs);
  await b.close();
})();
