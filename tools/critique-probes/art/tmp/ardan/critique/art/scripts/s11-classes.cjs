const { open, enter, shot, SHOTS } = require('./lib.cjs');
const { SHEET_INIT } = require('./sheetlib.cjs');
(async () => {
  const { b, pg, errs } = await open(1500, 1000);
  await pg.evaluate(SHEET_INIT);
  // build SVGs inside each world, collect strings
  const items = [];
  const statuses = ['slave', 'serf', 'peasant', 'artisan', 'merchant', 'gentry', 'noble', 'royal'];
  let seed = 700;
  for (const st of statuses) {
    for (const sex of ['M', 'F']) {
      seed++;
      const r = await pg.evaluate(({ st, sex, seed }) => {
        A.newGame({ seed, race: 'human', realm: 'POL-01', status: st, sex, startAge: 24 });
        const p = A.pc(); const out = [];
        UI.ANIME.clearCache();
        out.push({ svg: PORTRAIT.svg(p, 120, { bust: true }), full: PORTRAIT.svg(p, 150, {}), label: `<b>${st.toUpperCase()}</b> ${p.sex} ${A.age(p)}<br>${p.given} · ${(p.job && p.job.c) || '-'}<br>${p.app.hstyle}/${p.app.beard}/${p.app.build}<br>gear: ${p.gear.armor}/${p.gear.weapon}/${p.gear.cloak || '-'}` });
        const fa = A.S.people[(p.parents || [])[0]]; const mo = A.S.people[(p.parents || [])[1]];
        for (const q of [fa, mo]) if (q) out.push({ svg: PORTRAIT.svg(q, 120, { bust: true }), full: PORTRAIT.svg(q, 150, {}), label: `${st} ${q === fa ? 'father' : 'mother'} ${A.age(q)}<br>${q.given} · ${q.status} · ${(q.job && q.job.c) || '-'}` });
        return out;
      }, { st, sex, seed });
      items.push(...r);
    }
  }
  // soldier: enlist a peasant
  const sold = await pg.evaluate(() => {
    const out = [];
    for (const [seed, sex, race] of [[811, 'M', 'human'], [812, 'F', 'human'], [813, 'M', 'orc'], [814, 'M', 'dwarf']]) {
      A.newGame({ seed, race, realm: race === 'orc' ? 'POL-11' : race === 'dwarf' ? 'POL-10' : 'POL-01', status: 'peasant', sex, startAge: 19 });
      let ok = false; try { const r = A.enlist(A.pc()); ok = r; } catch (e) { ok = String(e).slice(0, 60); }
      const p = A.pc(); UI.ANIME.clearCache();
      out.push({ svg: PORTRAIT.svg(p, 120, { bust: true }), full: PORTRAIT.svg(p, 150, {}), label: `<b>SOLDIER</b> (A.enlist) ${race} ${sex}<br>${p.given} mil:${p.mil ? p.mil.troop + ' r' + p.mil.rank : 'none'}<br>gear: ${p.gear.armor}/${p.gear.weapon}/${p.gear.helm || '-'}/${p.gear.shield || '-'}` });
    }
    // priest: clergy job
    A.newGame({ seed: 820, race: 'human', realm: 'POL-02', status: 'peasant', sex: 'M', startAge: 30 });
    const p = A.pc(); p.job = { c: 'clergy', k: 'priest', r: 2, y: 5, perf: 60 }; UI.ANIME.clearCache();
    out.push({ svg: PORTRAIT.svg(p, 120, { bust: true }), full: PORTRAIT.svg(p, 150, {}), label: `<b>PRIEST</b> (job clergy r2) M<br>${p.given}` });
    const q = A.pc(); q.sex = 'F'; q.id = q.id + 'f'; q.job = { c: 'clergy', k: 'priest', r: 4, y: 5, perf: 60 }; UI.ANIME.clearCache();
    out.push({ svg: PORTRAIT.svg(q, 120, { bust: true }), full: PORTRAIT.svg(q, 150, {}), label: `<b>PRIESTESS</b> (clergy r4) F` });
    // knight
    A.newGame({ seed: 830, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 30 });
    const k = A.pc(); k.job = { c: 'knight', r: 3, y: 5, perf: 60 }; k.gear = Object.assign({}, k.gear, { armor: 'plate', weapon: 'longsword', shield: 'heater', helm: 'greathelm', cloak: 'tabard', mount: 'destrier' }); UI.ANIME.clearCache();
    out.push({ svg: PORTRAIT.svg(k, 120, { bust: true }), full: PORTRAIT.svg(k, 150, {}), label: `<b>KNIGHT</b> plate/tabard/greathelm` });
    return out;
  });
  items.push(...sold);
  await pg.evaluate((items) => SH.render(items.map(x => ({ svg: x.svg, label: x.label })), 120, 9, {}, 'dark', 'Class sheet: each start status (player + father + mother), soldiers via A.enlist, priest, knight - 120 px bust'), items);
  let el = await pg.$('#sheet'); await el.screenshot({ path: SHOTS + 'pt-classes-bust.png' });
  await pg.evaluate((items) => SH.render(items.map(x => ({ svg: x.full, label: x.label })), 150, 9, {}, 'dark', 'Class sheet, full figures 150 px'), items);
  el = await pg.$('#sheet'); await el.screenshot({ path: SHOTS + 'pt-classes-full.png' });
  console.log(items.length, errs);
  await b.close();
})();
