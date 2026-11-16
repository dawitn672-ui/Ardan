const { open, enter, shot } = require('./lib.cjs');
(async () => {
  const { b, pg, errs } = await open(1366, 768);
  await enter(pg, { seed: 4242, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 });
  const info = await pg.evaluate(() => {
    const P = Object.values(A.S.people);
    const alive = P.filter(p => p.alive);
    const cnt = (f) => { const o = {}; for (const p of alive) { const k = f(p); o[k] = (o[k] || 0) + 1; } return o; };
    const pc = A.pc();
    return {
      n: P.length, alive: alive.length,
      race: cnt(p => p.race), status: cnt(p => p.status), sex: cnt(p => p.sex),
      cult: cnt(p => p.cult),
      ageB: cnt(p => { const a = A.age(p); return a < 2 ? '0-1' : a < 13 ? '2-12' : a < 18 ? '13-17' : a < 40 ? '18-39' : a < 60 ? '40-59' : '60+'; }),
      hstyle: cnt(p => p.app && p.app.hstyle), beard: cnt(p => p.app && p.app.beard), skin: cnt(p => p.app && p.app.skin), hair: cnt(p => p.app && p.app.hair),
      eye: cnt(p => p.app && p.app.eye),
      pcKeys: Object.keys(pc), pcApp: pc.app, pcGear: pc.gear, pcWounds: pc.wounds, pcJob: pc.job,
      realms: Object.values(A.S.realms).map(r => [r.id, r.name, r.color, r.cult || r.culture, r.alive !== false]).slice(0, 40),
      cultures: GD.CULTURES ? Object.keys(GD.CULTURES).length : (A.S.cultures ? Object.keys(A.S.cultures).length : null),
      jobs: cnt(p => p.job && (p.job.c + ':' + p.job.k)),
      mil: cnt(p => p.mil ? (p.mil.troop + ':' + p.mil.rank) : 'none'),
      woundsAny: alive.filter(p => p.wounds && p.wounds.length).length,
      woundKinds: (() => { const o = {}; for (const p of alive) for (const w of (p.wounds || [])) o[w.k] = (o[w.k] || 0) + 1; return o; })(),
      quirks: (() => { const o = {}; for (const p of alive) for (const w of (p.quirks || [])) o[w] = (o[w] || 0) + 1; return o; })(),
    };
  });
  console.log(JSON.stringify(info, null, 0));
  console.log('errs', errs);
  await b.close();
})();
