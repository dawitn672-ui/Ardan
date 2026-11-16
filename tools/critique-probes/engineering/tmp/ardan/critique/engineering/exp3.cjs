// Is part of the slowdown the session, not the save? Play 50 years in one page, measure a Life refresh; reload the
// same state into the same page (A.deserialize resets engine caches); then reload the page itself and load it again.
const fs = require('fs');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const OUT = '/tmp/ardan/critique/engineering/out';
const YEARS = +(process.argv[2] || 50);
(async () => {
  const browser = await chromium.launch({ args: ['--enable-precise-memory-info', '--js-flags=--expose-gc'] });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable', { timeDomain: 'threadTicks' });
  const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  const boot = async () => { await page.goto('file:///tmp/ardan/snap/index.html'); await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 300000 }); };
  const measure = async (label) => {
    await page.evaluate(() => { UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render(); void document.body.offsetHeight; if (window.gc) gc(); });
    const a = await metrics();
    await page.evaluate(() => { for (let i = 0; i < 8; i++) { UI.refresh(); void document.body.offsetHeight; } });
    const b = await metrics();
    const extra = await page.evaluate(() => ({ heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null, doc: document.getElementsByTagName('*').length, styles: document.querySelectorAll('style').length, styleBytes: [...document.querySelectorAll('style')].reduce((x, s) => x + s.textContent.length, 0), year: A.S.year }));
    const r = { label, cpuPerRefresh: Math.round((b.ThreadTime - a.ThreadTime) * 1000 / 8), layouts: +((b.LayoutCount - a.LayoutCount) / 8).toFixed(1), layoutMs: Math.round((b.LayoutDuration - a.LayoutDuration) * 1000 / 8), styleMs: Math.round((b.RecalcStyleDuration - a.RecalcStyleDuration) * 1000 / 8), blinkNodes: b.Nodes, ...extra };
    console.log(JSON.stringify(r)); return r;
  };
  await boot();
  const res = [];
  await page.evaluate(() => { A.newGame({ seed: 42, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 16 }); UI.screen = 'game'; UI.tab = 'life'; UI.render(); });
  res.push(await measure('fresh page, year 0'));
  for (let y = 0; y < YEARS; y += 10) {
    await page.evaluate(n => {
      const end = A.S.year + n;
      for (let g = 0; g < 20000 && A.S.year < end; g++) {
        const r = A.advance(400); let h, k = 0;
        while ((h = A.headReady()) && k++ < 500) { if (h.type === 'event') { A.eventView(h); A.eventAuto(); } else A.skipPrompt(); }
        // the player looks at the page now and then, as a player would
        if (g % 25 === 0) { UI.tab = 'life'; UI.ov = null; UI.refresh(); }
        if (r.why === 'dead' || !A.pc() || !A.pc().alive) {
          const pc = A.pc(), P = id => A.S.people[id];
          const k2 = (pc.children || []).map(P).filter(p => p && p.alive).sort((a, b) => A.age(b) - A.age(a))[0] || Object.values(A.S.people).find(p => p.alive && p.realm === pc.realm && A.age(p) >= 16 && A.age(p) <= 30);
          if (k2) A.continueAs(k2.id); else return;
        }
      }
    }, 10);
    console.log('year', await page.evaluate(() => A.S.year));
  }
  res.push(await measure(`long-lived page, year ${YEARS}`));
  const text = await page.evaluate(() => A.serialize());
  await page.evaluate(t => { A.deserialize(JSON.parse(t)); }, text);
  res.push(await measure('same page, state re-loaded (engine caches reset)'));
  await boot();
  await page.evaluate(t => { A.deserialize(JSON.parse(t)); }, text);
  res.push(await measure('page reloaded, same state loaded'));
  fs.writeFileSync(`${OUT}/exp3.json`, JSON.stringify(res, null, 1));
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
