const D = require('./bin/drive.js');
(async () => {
  const { b, page, errs } = await D.open(1366);
  const r = await page.evaluate(() => {
    A.newGame({ seed: 77, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 }); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render();
    const log = [];
    let out = null;
    for (let i = 0; i < 12; i++) {
      const rr = A.advance(30);
      log.push([A.dateStr(), JSON.stringify(rr).slice(0, 100), A.S.queue.length, A.S.queue.map(q => q.type + ':' + (q.ev || '')).join(',').slice(0, 200)]);
      let h, g = 0;
      while ((h = A.headReady()) && g++ < 50) {
        if (h.type === 'event') { const v = A.eventView(h); if (!out) out = { type: typeof v, keys: v && typeof v === 'object' ? Object.keys(v) : null, s: JSON.stringify(v).slice(0, 1500) }; A.eventAuto(); }
        else A.skipPrompt();
      }
    }
    return { out, log };
  });
  console.log(JSON.stringify(r, null, 1));
  await b.close();
})();
