const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); p.setDefaultTimeout(3600000);
  await p.goto('file:///tmp/ardan/snap/index.html'); await p.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 3600000 });
  const r = await p.evaluate(() => {
    const out = [];
    for (const [seed, status, age] of [[7101, 'noble', 16], [7100, 'peasant', 0]]) {
      A.newGame({ seed, race: 'human', realm: 'POL-01', status, sex: 'M', startAge: age });
      const snap = l => out.push({ seed, at: l, day: A.absDay() - A.S.year * 365, check: A.V2SAVE.check(), has: ['court', 'v2dip', 'v2w', 'v2t', 'v2map'].filter(k => !!A.S[k]) });
      snap('new game');
      const play = d => { const end = A.absDay() + d; for (let g = 0; g < 500 && A.absDay() < end; g++) { A.advance(end - A.absDay()); let h, k = 0; while ((h = A.headReady()) && k++ < 100) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); } } };
      play(1); snap('after 1 day'); play(31); snap('after a month'); play(365); snap('after a year');
    }
    return out;
  });
  for (const x of r) console.log(JSON.stringify(x));
  await b.close();
})();
