const { open, enter, shot, SHOTS } = require('./lib.cjs');
const { SHEET_INIT } = require('./sheetlib.cjs');
(async () => {
  const { b, pg, errs } = await open(1500, 1000);
  await pg.evaluate(SHEET_INIT);
  await enter(pg, { seed: 4242, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 });
  // 24 random alive adults/teens from the world, seeded pick by index stride
  const n = await pg.evaluate(() => {
    const P = Object.values(A.S.people).filter(p => p.alive && A.age(p) >= 14).sort((a, b) => a.id < b.id ? -1 : 1);
    let h = 12345; const pick = [];
    const used = new Set();
    while (pick.length < 24) { h = (h * 1103515245 + 12345) & 0x7fffffff; const i = h % P.length; if (!used.has(i)) { used.add(i); pick.push(P[i]); } }
    window.PICK = pick;
    return SH.render(pick.map(p => ({ p, label: SH.lab(p, `${p.app.hstyle}/${p.app.beard}/${p.app.build}`) })), 88, 8, { bust: true }, 'dark', '24 random people of one world (seed 4242), 88 px bust, as PORTRAIT.svg draws them');
  });
  let el = await pg.$('#sheet'); await el.screenshot({ path: SHOTS + 'pt-random24-88.png' });
  await pg.evaluate(() => SH.render(PICK.map(p => ({ p, label: (p.given||'') })), 32, 12, { bust: true }, 'dark', 'the same 24 at 32 px'));
  el = await pg.$('#sheet'); await el.screenshot({ path: SHOTS + 'pt-random24-32.png' });
  await pg.evaluate(() => SH.render(PICK.slice(0, 12).map(p => ({ p, label: SH.lab(p) })), 200, 6, {}, 'dark', 'full figures (200 px), first 12'));
  el = await pg.$('#sheet'); await el.screenshot({ path: SHOTS + 'pt-random12-full.png' });
  // silhouettes
  await pg.addStyleTag({ content: '#sheet svg *{fill:#000!important;stroke:#000!important} #sheet svg rect:first-of-type{fill:#fff!important}' });
  await pg.evaluate(() => SH.render(PICK.map(p => ({ p, label: (p.given||'') })), 48, 12, { bust: true }, 'light', 'silhouettes, 48 px'));
  el = await pg.$('#sheet'); await el.screenshot({ path: SHOTS + 'pt-random24-sil.png' });
  console.log('errs', errs, await pg.evaluate(() => UI.ANIME.errors));
  await b.close();
})();
