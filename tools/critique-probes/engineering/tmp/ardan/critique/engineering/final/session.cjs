// Deciding critic: does the page itself degrade over a long session of real presses? One page, N presses; every 20:
// idle 3 s, force GC, read Blink's node count, listeners, heap. At press N-20 the state is dumped; the last 20 presses
// are then played again from that dump in a fresh page and compared press by press (same months, same cards).
//   node session.cjs --tag=x --w=1366 --state=file --n=120 [--hints=off]
const fs = require('fs');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const TAG = arg('tag', 'session'), W = +arg('w', 1366), N = +arg('n', 120), STATE = arg('state', '/tmp/ardan/critique/engineering/out/noble-y50-state.json'), HINTS = arg('hints', 'off'), TAIL = 20;
const OUT = '/tmp/ardan/critique/engineering/final/out';
const log = (...a) => { const s = `[${new Date().toISOString().slice(11, 19)}] ${TAG}: ` + a.join(' '); console.log(s); fs.appendFileSync(`${OUT}/session-${TAG}.log`, s + '\n'); };
const pressSrc = fs.readFileSync(__dirname + '/press.cjs', 'utf8');
const INSTALL = eval('(' + pressSrc.slice(pressSrc.indexOf('const INSTALL = ') + 16, pressSrc.indexOf('\n(async () => {')).replace(/;\s*$/, '') + ')');
(async () => {
  const browser = await chromium.launch({ args: ['--enable-precise-memory-info', '--js-flags=--expose-gc'] });
  const phone = W < 500;
  const open = async stateText => {
    const ctx = await browser.newContext({ viewport: { width: W, height: phone ? 860 : 900 }, deviceScaleFactor: 1, hasTouch: phone, isMobile: phone });
    const page = await ctx.newPage(); page.setDefaultTimeout(3600000);
    const errs = []; page.on('pageerror', e => errs.push('pageerror: ' + String(e).slice(0, 200))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Performance.enable', { timeDomain: 'threadTicks' });
    await cdp.send('HeapProfiler.enable');
    const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
    await page.goto('file:///tmp/ardan/snap/index.html');
    await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 3600000 });
    await page.evaluate(([s, hints]) => { if (hints === 'off') UI.set.hints = false; A.deserialize(JSON.parse(s)); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render(); }, [stateText, HINTS]);
    await page.evaluate(INSTALL, true);
    const press = async () => { const a = await metrics(); const r = await page.evaluate(() => __P.press()); await page.evaluate(() => new Promise(r => setTimeout(r, 250))); const b = await metrics(); return Object.assign(r, { cpu: Math.round((b.ThreadTime - a.ThreadTime) * 1000), style: Math.round((b.RecalcStyleDuration - a.RecalcStyleDuration) * 1000), script: Math.round((b.ScriptDuration - a.ScriptDuration) * 1000), nodesNow: b.Nodes }); };
    const census = async () => { await page.evaluate(() => new Promise(r => setTimeout(r, 3000))); await page.evaluate(() => { if (window.gc) { gc(); gc(); } }); await cdp.send('HeapProfiler.collectGarbage'); await page.evaluate(() => new Promise(r => setTimeout(r, 500))); await cdp.send('HeapProfiler.collectGarbage'); const m = await metrics(); const d = await page.evaluate(() => ({ doc: document.getElementsByTagName('*').length, anims: document.getAnimations().length, bodyKids: document.body.children.length, styles: document.querySelectorAll('style').length, year: A.S.year, log: A.S.log.reduce((a, e) => a + e.lines.length, 0), journal: A.J ? A.J.e.length : 0 })); return Object.assign({ nodes: m.Nodes, listeners: m.JSEventListeners, heapMB: +(m.JSHeapUsedSize / 1e6).toFixed(1), layoutObjects: m.LayoutObjects, documents: m.Documents, detachedScriptStates: m.DetachedScriptStates }, d); };
    return { ctx, page, press, census, errs };
  };
  const med = a => { const b = a.slice().sort((x, y) => x - y); return b.length ? b[b.length >> 1] : null; };
  const A1 = await open(fs.readFileSync(STATE, 'utf8'));
  const res = { tag: TAG, census: [], presses: [], tailA: [], tailB: [] };
  res.census.push(Object.assign({ at: 0 }, await A1.census())); log('census 0', JSON.stringify(res.census[0]));
  let dump = null;
  for (let i = 0; i < N; i++) {
    if (i === N - TAIL) dump = await A1.page.evaluate(() => A.serialize());
    const r = await A1.press(); res.presses.push({ i, cards: r.cards, days: r.days, kind: r.kind, why: r.why, cpu: r.cpu, style: r.style, script: r.script, year: r.year });
    if (i >= N - TAIL) res.tailA.push(res.presses[res.presses.length - 1]);
    if (r.why !== 'ok') { log('stopped', r.why, 'at', i); break; }
    if ((i + 1) % 20 === 0) { const c = Object.assign({ at: i + 1 }, await A1.census()); res.census.push(c); const blk = res.presses.slice(-20); log(`after ${i + 1}: ${JSON.stringify(c)} | block cpu median ${med(blk.map(p => p.cpu))}, quiet median ${med(blk.filter(p => !p.cards).map(p => p.cpu))}`); }
    fs.writeFileSync(`${OUT}/session-${TAG}.json`, JSON.stringify(res));
  }
  res.errsA = A1.errs.slice(0, 10);
  if (dump) {
    const B1 = await open(dump);
    for (let i = 0; i < TAIL; i++) { const r = await B1.press(); res.tailB.push({ i, cards: r.cards, days: r.days, kind: r.kind, why: r.why, cpu: r.cpu, style: r.style, script: r.script, year: r.year }); if (r.why !== 'ok') break; }
    let sa = 0, sb = 0, n = 0;
    for (let i = 0; i < Math.min(res.tailA.length, res.tailB.length); i++) { const x = res.tailA[i], y = res.tailB[i]; if (x.cards === y.cards && x.days === y.days) { sa += x.cpu; sb += y.cpu; n++; } }
    log(`last ${TAIL} presses: long-lived page ${sa} ms, fresh page with the same state ${sb} ms over ${n} matched presses (ratio ${(sa / Math.max(1, sb)).toFixed(2)})`);
    res.tail = { matched: n, longLived: sa, fresh: sb };
  }
  fs.writeFileSync(`${OUT}/session-${TAG}.json`, JSON.stringify(res));
  log('done; errors', A1.errs.length, A1.errs.slice(0, 3).join(' | '));
  await browser.close();
})().catch(e => { log('FATAL', e.stack || e); process.exit(1); });
