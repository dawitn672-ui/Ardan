// Complaint 1: does a month take longer the longer you play? One page, saves of different ages, interleaved.
// For each save: 6 presses of Next month through the button (cards answered with their first choice), wall time each;
// plus the engine alone (A.advance over 30 days, 6 times) and the state's size.
const D = require('./drive.js');
const fs = require('fs');
const saves = process.argv.slice(2);
(async () => {
  const { b, page, errs } = await D.open(1366);
  const res = [];
  const pick0 = () => 0;
  for (let round = 0; round < 2; round++) {
    for (const f of (round ? saves.slice().reverse() : saves)) {
      if (f === 'new') await page.evaluate(() => { A.newGame({ seed: 4242, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 16 }); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render(); });
      else await D.load(page, f);
      await page.waitForTimeout(800);
      const info = await page.evaluate(() => {
        const S = A.S, t0 = performance.now(); const s = A.serialize(); const ser = performance.now() - t0;
        const cnt = o => o ? (Array.isArray(o) ? o.length : Object.keys(o).length) : 0;
        return { year: S.year, bytes: s.length, serMs: Math.round(ser), people: cnt(S.people), alive: Object.values(S.people).filter(p => p.alive).length, log: cnt(S.log), news: cnt(S.news), wars: cnt(S.wars), fights: cnt(S.fights), sched: cnt(S.sched), chron: cnt(S.chron || S.chronicle || (S.wc && S.wc.ev)) };
      });
      const ui = [];
      for (let i = 0; i < 3; i++) {
        const r = await D.month(page, pick0, () => {}, {});
        ui.push(r.ms);
      }
      // the engine alone, no drawing
      const eng = await page.evaluate(() => {
        const out = [];
        for (let i = 0; i < 6; i++) {
          const t0 = performance.now(); let g = 0;
          A.advance(30);
          while (A.S.queue.length && g++ < 40) { const h = A.headReady(); if (!h) break; if (h.type === 'event') { A.eventAuto(); } else A.skipPrompt(); }
          out.push(Math.round(performance.now() - t0));
        }
        return out;
      });
      const row = { save: f.split('/').slice(-2).join('/'), round, ...info, uiMs: ui, uiMedian: ui.slice().sort((a, b) => a - b)[1], engMs: eng, engMedian: eng.slice().sort((a, b) => a - b)[3] };
      res.push(row);
      console.log(JSON.stringify(row));
    }
  }
  fs.writeFileSync('/tmp/ardan/critique/design/bench-slow.json', JSON.stringify(res, null, 1));
  console.log('errs', errs.length);
  await b.close();
})();
