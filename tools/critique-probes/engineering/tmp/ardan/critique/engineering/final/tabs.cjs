// Deciding critic: what each place costs to draw, new game vs year 50 (fresh pages, hints off, CPU per draw; quiet box)
const fs = require('fs');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch();
  const out = {};
  for (const [tag, W, state] of [['y0-1366', 1366, null], ['y50-1366', 1366, '/tmp/ardan/critique/engineering/out/noble-y50-state.json'], ['y60p-1366', 1366, '/tmp/ardan/critique/engineering/final/out/peasant-y60-state.json'], ['y50-420', 420, '/tmp/ardan/critique/engineering/out/noble-y50-state.json']]) {
    const phone = W < 500;
    const ctx = await browser.newContext({ viewport: { width: W, height: phone ? 860 : 900 }, deviceScaleFactor: 1, hasTouch: phone, isMobile: phone });
    const page = await ctx.newPage(); page.setDefaultTimeout(3600000);
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Performance.enable', { timeDomain: 'threadTicks' });
    const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
    const t0 = Date.now();
    await page.goto('file:///tmp/ardan/snap/index.html');
    await page.waitForFunction(() => window.ARDAN_READY === true, null, { timeout: 3600000 }); const tTitle = Date.now() - t0;
    await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 3600000 }); const tReady = Date.now() - t0;
    const mb = await metrics();
    const m0 = await metrics(); const w0 = Date.now();
    if (state) { const s = fs.readFileSync(state, 'utf8'); await page.evaluate(s => { UI.set.hints = false; A.deserialize(JSON.parse(s)); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render(); }, s); }
    else await page.evaluate(() => { UI.set.hints = false; A.newGame({ seed: 42, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 16 }); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render(); });
    const m1 = await metrics(); const enterWall = Date.now() - w0;
    const tabs = await page.evaluate(() => UI.GROUPS.flatMap(g => g.subs.map(s => s[0])));
    const r = { bootWallTitle: tTitle, bootWallReady: tReady, bootCpu: Math.round(mb.ThreadTime * 1000), enterCpu: Math.round((m1.ThreadTime - m0.ThreadTime) * 1000), enterWall, tabs: {} };
    for (const t of tabs) {
      await page.evaluate(t => { UI.ov = null; UI.tab = t; UI.render(); }, t); await page.evaluate(() => new Promise(r => setTimeout(r, 150)));
      const a = await metrics();
      const info = await page.evaluate(async t => { let w = 0; for (let i = 0; i < 3; i++) { const t0 = performance.now(); UI.ov = null; UI.tab = t; UI.render(); void document.body.offsetHeight; w += performance.now() - t0; await new Promise(r => setTimeout(r, 120)); } const tb = document.getElementById('tabbody'); return { wall: Math.round(w / 3), html: tb ? Math.round(tb.innerHTML.length / 1024) : 0, nodes: tb ? tb.getElementsByTagName('*').length : 0, svg: tb ? tb.querySelectorAll('svg').length : 0, doc: document.getElementsByTagName('*').length }; }, t);
      const b = await metrics();
      r.tabs[t] = Object.assign({ cpu: Math.round((b.ThreadTime - a.ThreadTime) * 1000 / 3), style: Math.round((b.RecalcStyleDuration - a.RecalcStyleDuration) * 1000 / 3), layout: Math.round((b.LayoutDuration - a.LayoutDuration) * 1000 / 3) }, info);
    }
    out[tag] = r;
    console.log(tag, JSON.stringify({ bootWallTitle: r.bootWallTitle, bootWallReady: r.bootWallReady, bootCpu: r.bootCpu, enterCpu: r.enterCpu, enterWall: r.enterWall }));
    console.log('  ' + Object.entries(r.tabs).map(([k, v]) => `${k} ${v.cpu}ms (sync ${v.wall}, ${v.html}KB, ${v.nodes} nodes, ${v.svg} svg)`).join(' | '));
    await ctx.close();
  }
  fs.writeFileSync('/tmp/ardan/critique/engineering/final/out/tabs.json', JSON.stringify(out, null, 1));
  await browser.close();
})().catch(e => { console.error('FATAL', e.stack || e); process.exit(1); });
