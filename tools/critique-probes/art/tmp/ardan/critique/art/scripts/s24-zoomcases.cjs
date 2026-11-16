const { open, enter, shot, SHOTS } = require('./lib.cjs');
const { SHEET_INIT } = require('./sheetlib.cjs');
(async () => {
  const { b, pg, errs } = await open(1700, 1000);
  await pg.evaluate(SHEET_INIT);
  const items = [];
  for (const [seed, st, sex, who] of [[701, 'slave', 'M', 'father'], [713, 'noble', 'M', 'father'], [702, 'slave', 'F', 'mother'], [711, 'gentry', 'M', 'father']]) {
    const r = await pg.evaluate(({ seed, st, sex, who }) => {
      A.newGame({ seed, race: 'human', realm: 'POL-01', status: st, sex, startAge: 24 });
      const p = A.pc(); const q = A.S.people[(p.parents || [])[who === 'father' ? 0 : 1]];
      UI.ANIME.clearCache();
      return { svg: PORTRAIT.svg(q, 240, { bust: true }), label: `${st} ${who} ${q.given} ${A.age(q)}<br>beard:${q.app.beard} hs:${q.app.hstyle} quirks:${(q.quirks || []).join(',')}<br>wounds:${(q.wounds || []).map(w => w.k).join(',')}` };
    }, { seed, st, sex, who });
    items.push(r);
  }
  // muttonchops / mustache / stubble / forked / long on one man
  const beards = await pg.evaluate(() => {
    A.newGame({ seed: 4242, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 35 });
    const base = SH.clone(A.pc()); base.wounds = []; base.quirks = []; base.app.hstyle = 'short'; base.app.skin = '#d9a77f';
    const out = [];
    for (const bd of GD.BEARDS) { const p = SH.clone(base); p.app.beard = bd; UI.ANIME.clearCache(); out.push({ svg: PORTRAIT.svg(p, 150, { bust: true }), label: 'beard ' + bd }); }
    for (const bd of ['none', 'stubble', 'full', 'mustache', 'muttonchops']) { const p = SH.clone(base); p.app.beard = bd; p.app.skin = '#3f2817'; p.id = p.id + 'd'; UI.ANIME.clearCache(); out.push({ svg: PORTRAIT.svg(p, 150, { bust: true }), label: 'dark skin, beard ' + bd }); }
    return out;
  });
  await pg.evaluate((items) => SH.render(items, 240, 4, {}, 'dark', 'Zoomed cases at 240 px'), items);
  let el = await pg.$('#sheet'); await el.screenshot({ path: SHOTS + 'pt-zoomcases.png' });
  await pg.evaluate((items) => SH.render(items, 150, 8, {}, 'dark', 'Beards on one man (150 px), and on the darkest skin'), beards);
  el = await pg.$('#sheet'); await el.screenshot({ path: SHOTS + 'pt-beards.png' });
  // gender read: 12 beardless adult men and 12 women, same culture, mixed
  await pg.evaluate(() => {
    const P = Object.values(A.S.people).filter(p => p.alive && p.race === 'human' && A.age(p) >= 18 && A.age(p) <= 45);
    const men = P.filter(p => p.sex === 'M' && (!p.app.beard || p.app.beard === 'none')).slice(0, 12);
    const women = P.filter(p => p.sex === 'F').slice(0, 12);
    const mixed = []; for (let i = 0; i < 12; i++) { if (men[i]) mixed.push(men[i]); if (women[i]) mixed.push(women[i]); }
    window.GX = mixed;
  });
  await pg.evaluate(() => SH.render(GX.map(p => ({ p, label: '?' })), 88, 12, { bust: true }, 'dark', 'Beardless men and women, 88 px (answer key below)'));
  el = await pg.$('#sheet'); await el.screenshot({ path: SHOTS + 'pt-genderquiz.png' });
  const key = await pg.evaluate(() => GX.map(p => p.sex + A.age(p) + ':' + p.app.hstyle).join(' '));
  console.log('key', key);
  console.log(errs);
  await b.close();
})();
