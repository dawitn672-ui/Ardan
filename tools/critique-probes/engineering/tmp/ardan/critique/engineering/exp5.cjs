// Does the journal replay a session played through the real UI (Next month button, cards through the modal)?
// Page 1: new life, N real Next months; dump journal + fingerprint. Page 2: A.replay(journal); compare.
const fs = require('fs');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const OUT = '/tmp/ardan/critique/engineering/out';
const N = +(process.argv[2] || 8);
const REAL = n => new Promise(resolve => {
  let left = n, cards = 0;
  const one = () => {
    if (left-- <= 0) return resolve({ cards });
    UI.tab = 'life'; UI.ov = null;
    try { UI.A.v2Next(); } catch (e) {}
    const tick = () => {
      const pc = A.pc(); if (!pc || !pc.alive) return resolve({ cards, dead: true });
      if (A.S.queue.length && document.querySelector('#modal')) {
        const h = A.S.queue[0];
        try { if (h.type === 'event') { if (!h.result) { const v = A.eventView(h); UI.A.evChoose(String(Math.max(0, (v.choices || []).findIndex(c => !c.disabled && !c.locked)))); } else UI.A.evClose(); cards++; } else { A.skipPrompt(); UI.refresh(); } }
        catch (e) { try { A.eventAuto(); UI.refresh(); } catch (e2) { A.skipPrompt(); } }
        return setTimeout(tick, 0);
      }
      if (A.S.queue.length) { if (A.headReady()) UI.refresh(); if (A.S.queue.length && !document.querySelector('#modal')) { let h, k = 0; while ((h = A.headReady()) && k++ < 50) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); } } return setTimeout(tick, 0); }
      if (UI.stepper && UI.stepper.run) return setTimeout(tick, 5);
      setTimeout(one, 0);
    };
    setTimeout(tick, 0);
  };
  one();
});
(async () => {
  const browser = await chromium.launch();
  const boot = async () => { const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } }); const page = await ctx.newPage(); await page.goto('file:///tmp/ardan/snap/index.html'); await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 300000 }); return page; };
  const p1 = await boot();
  await p1.evaluate(() => { A.newGame({ seed: 42, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 16 }); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render(); });
  const r1 = await p1.evaluate(`(${REAL.toString()})(${N})`);
  const d = await p1.evaluate(() => ({ fp: A.fingerprint(), J: JSON.stringify(A.J), year: A.S.year, day: A.absDay(), n: A.J.e.length }));
  console.log('played', JSON.stringify(r1), 'journal', d.n, 'day', d.day);
  const p2 = await boot();
  const r2 = await p2.evaluate(j => { const res = A.replay(JSON.parse(j)); return { ok: res.ok, at: res.at, k: res.k, why: res.why, steps: res.steps, errors: (res.errors || []).slice(0, 3), fp: A.fingerprint(), day: A.absDay() }; }, d.J);
  const out = { N, played: r1, want: d.fp, got: r2.fp, same: d.fp === r2.fp, replay: r2, dayWant: d.day };
  if (!r2.ok) { const J = JSON.parse(d.J); out.around = J.e.slice(Math.max(0, r2.at - 4), r2.at + 2).map(e => [e[0], JSON.stringify(e[1]).slice(0, 60), e[3]]); }
  console.log(JSON.stringify(out, null, 1));
  fs.writeFileSync(`${OUT}/exp5.json`, JSON.stringify(out, null, 1));
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
