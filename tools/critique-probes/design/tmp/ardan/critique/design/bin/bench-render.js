const D = require('./drive.js');
(async () => {
  const { b, page } = await D.open(1366);
  const out = [];
  for (const f of ['new', '/tmp/ardan/critique/design/e3-l2-state.json', '/tmp/ardan/critique/design/bench-L3.json', '/tmp/ardan/critique/design/bench-L1-1120.json', 'new', '/tmp/ardan/critique/design/bench-L1-1120.json']) {
    if (f === 'new') await page.evaluate(() => { A.newGame({ seed: 4242, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 16 }); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render(); });
    else await D.load(page, f);
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => {
      const t = [];
      for (let i = 0; i < 7; i++) { const t0 = performance.now(); UI.render(); t.push(performance.now() - t0); }
      t.sort((a, b) => a - b);
      const story = document.querySelector('.story, #story, [class*="story"]');
      return { year: A.S.year, renderMedianMs: Math.round(t[3]), nodes: document.getElementsByTagName('*').length, storyChars: (document.querySelector('main') ? document.body.innerText.length : 0), logYears: (A.S.log || []).length, logLines: (A.S.log || []).reduce((n, y) => n + ((y && y.lines) ? y.lines.length : 0), 0) };
    });
    out.push(Object.assign({ f: f.split('/').pop() }, r));
    console.log(JSON.stringify(out[out.length - 1]));
  }
  await b.close();
})();
