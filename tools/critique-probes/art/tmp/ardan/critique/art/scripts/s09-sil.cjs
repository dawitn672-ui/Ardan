const { open, enter, shot, SHOTS } = require('./lib.cjs');
const { SHEET_INIT } = require('./sheetlib.cjs');
(async () => {
  const { b, pg, errs } = await open(1500, 1000);
  await pg.evaluate(SHEET_INIT);
  await enter(pg, { seed: 4242, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 });
  await pg.evaluate(() => {
    const P = Object.values(A.S.people).filter(p => p.alive && A.age(p) >= 14).sort((a, b) => a.id < b.id ? -1 : 1);
    let h = 12345; const pick = []; const used = new Set();
    while (pick.length < 24) { h = (h * 1103515245 + 12345) & 0x7fffffff; const i = h % P.length; if (!used.has(i)) { used.add(i); pick.push(P[i]); } }
    window.PICK = pick;
  });
  await pg.addStyleTag({ content: '#sheet svg .ap-fig{filter:brightness(0)!important} #sheet svg{background:#fff}' });
  const strip = () => pg.evaluate(() => { for (const svg of document.querySelectorAll('#sheet svg')) { const fig = svg.querySelector('.ap-fig'); if (!fig) continue; let n = fig; while (n.parentNode && n.parentNode !== svg) { for (const sib of [...n.parentNode.childNodes]) if (sib !== n && sib.nodeName !== 'defs') sib.remove(); n = n.parentNode; } for (const sib of [...svg.childNodes]) if (sib !== n && sib.nodeName !== 'defs') sib.remove(); } });
  await pg.evaluate(() => SH.render(PICK.map(p => ({ p, label: (p.given||'') + ' ' + p.race.slice(0,3) })), 48, 12, { bust: true }, 'light', 'silhouettes of the same 24, 48 px bust'));
  await strip();
  let el = await pg.$('#sheet'); await el.screenshot({ path: SHOTS + 'pt-random24-sil.png' });
  await pg.evaluate(() => SH.render(PICK.slice(0,12).map(p => ({ p, label: (p.given||'') + ' ' + p.race.slice(0,3) })), 120, 12, {}, 'light', 'full-figure silhouettes, 120 px'));
  await strip();
  el = await pg.$('#sheet'); await el.screenshot({ path: SHOTS + 'pt-random12-full-sil.png' });
  await b.close();
})();
