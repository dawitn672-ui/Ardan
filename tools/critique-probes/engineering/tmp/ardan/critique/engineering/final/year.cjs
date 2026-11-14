// Deciding critic: what a whole year of engine time costs (the owner's "Next year"), with no drawing: quiet box, wall and CPU.
const fs = require('fs');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch();
  for (const [tag, state] of [['new game', null], ['noble y50', '/tmp/ardan/critique/engineering/out/noble-y50-state.json'], ['peasant y50 (9 armies)', '/tmp/ardan/critique/engineering/final/out/peasant-y50-state.json'], ['peasant y60', '/tmp/ardan/critique/engineering/final/out/peasant-y60-state.json'], ['peasant child y0', '/tmp/ardan/critique/engineering/final/out/peasant-y0-state.json']]) {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    const page = await ctx.newPage(); page.setDefaultTimeout(3600000);
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Performance.enable', { timeDomain: 'threadTicks' });
    const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
    await page.goto('file:///tmp/ardan/snap/index.html');
    await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 3600000 });
    if (state) { const s = fs.readFileSync(state, 'utf8'); await page.evaluate(s => { A.deserialize(JSON.parse(s)); }, s); }
    else await page.evaluate(() => { A.newGame({ seed: 42, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 16 }); });
    const rows = [];
    for (let y = 0; y < 3; y++) {
      const a = await metrics();
      const r = await page.evaluate(() => { const t0 = performance.now(); const end = A.absDay() + 365; let cards = 0, stops = 0, maxDay = 0; for (let g = 0; g < 2000 && A.absDay() < end; g++) { const d0 = performance.now(); A.advance(end - A.absDay()); maxDay = Math.max(maxDay, performance.now() - d0); stops++; let h, k = 0; while ((h = A.headReady()) && k++ < 200) { if (h.type === 'event') { A.eventView(h); A.eventAuto(); cards++; } else A.skipPrompt(); } if (!A.pc() || !A.pc().alive) break; } return { wall: Math.round(performance.now() - t0), cards, stops, longestRun: Math.round(maxDay), wars: (A.S.wars || []).filter(w => !w.ended).length, armies: (A.S.armies || []).length, year: A.S.year }; });
      const b = await metrics();
      rows.push(Object.assign(r, { cpu: Math.round((b.ThreadTime - a.ThreadTime) * 1000) }));
    }
    console.log(tag, JSON.stringify(rows));
    await ctx.close();
  }
  await browser.close();
})().catch(e => { console.error('FATAL', e.stack || e); process.exit(1); });
