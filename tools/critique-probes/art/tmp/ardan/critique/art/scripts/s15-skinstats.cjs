const { open, enter, shot, SHOTS } = require('./lib.cjs');
(async () => {
  const { b, pg, errs } = await open(1366, 768);
  await enter(pg, { seed: 4242, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 });
  const r = await pg.evaluate(() => {
    const SK = GD.SKIN.human, EY = GD.EYES;
    const P = Object.values(A.S.people).filter(p => p.alive && p.race === 'human');
    const by = {};
    for (const p of P) {
      const c = (LORE.cultures[p.cult] || {}).name || p.cult;
      const o = by[c] = by[c] || { n: 0, skin: Array(8).fill(0), eye: Array(8).fill(0), hair: Array(11).fill(0) };
      o.n++; const i = SK.indexOf(p.app.skin); if (i >= 0) o.skin[i]++; o.eye[p.app.eye]++; o.hair[p.app.hair]++;
    }
    // overall: share of humans with skin index >=4 (darker half)
    const dark = P.filter(p => SK.indexOf(p.app.skin) >= 4).length;
    const greenEye = P.filter(p => p.app.eye === 2).length;
    return { by, n: P.length, darkShare: dark / P.length, greenEyeShare: greenEye / P.length, SK, EY };
  });
  console.log('humans', r.n, 'dark-half skin share', r.darkShare.toFixed(2), 'olive-eye share', r.greenEyeShare.toFixed(2));
  for (const [k, v] of Object.entries(r.by).sort((a, b) => b[1].n - a[1].n)) console.log(k.padEnd(14), String(v.n).padStart(4), 'skin', v.skin.join(' '), '| eye', v.eye.join(' '), '| hair', v.hair.join(' '));
  await b.close();
})();
