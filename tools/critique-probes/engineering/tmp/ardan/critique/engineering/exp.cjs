// Why a refresh costs more at year 50: layouts per refresh, their cost, and two ablations on the year-50 state
// (1) the story log cut to two years, (2) the post-render DOM passes (FOLD, LOOK, MOTION) stubbed out.
const fs = require('fs');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const OUT = '/tmp/ardan/critique/engineering/out';
(async () => {
  const S50 = fs.readFileSync(`${OUT}/noble-y50-state.json`, 'utf8');
  const browser = await chromium.launch({ args: ['--enable-precise-memory-info', '--js-flags=--expose-gc'] });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 300)));
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable', { timeDomain: 'threadTicks' });
  const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  await page.goto('file:///tmp/ardan/snap/index.html');
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 300000 });
  const measure = async (label, n = 8) => {
    await page.evaluate(() => { UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render(); void document.body.offsetHeight; });
    const a = await metrics();
    await page.evaluate(n => { for (let i = 0; i < n; i++) { UI.refresh(); void document.body.offsetHeight; } }, n);
    const b = await metrics();
    const d = k => (b[k] - a[k]);
    const dom = await page.evaluate(() => ({ doc: document.getElementsByTagName('*').length, log: (document.getElementById('logwrap') || { getElementsByTagName: () => [] }).getElementsByTagName('*').length, tab: (document.getElementById('tabbody') || { getElementsByTagName: () => [] }).getElementsByTagName('*').length, logLines: A.S.log.reduce((x, e) => x + e.lines.length, 0), logYears: A.S.log.length }));
    const r = { label, cpuPerRefresh: Math.round(d('ThreadTime') * 1000 / n), layoutsPerRefresh: +(d('LayoutCount') / n).toFixed(1), styleRecalcsPerRefresh: +(d('RecalcStyleCount') / n).toFixed(1), layoutMsPerRefresh: Math.round(d('LayoutDuration') * 1000 / n), styleMsPerRefresh: Math.round(d('RecalcStyleDuration') * 1000 / n), dom };
    console.log(JSON.stringify(r));
    return r;
  };
  const res = [];
  // year 0: a new noble life on the same seed
  await page.evaluate(() => { A.newGame({ seed: 42, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 16 }); });
  res.push(await measure('year 0 (new game)'));
  // year 50: the dumped state
  await page.evaluate(s => { A.deserialize(JSON.parse(s)); }, S50);
  res.push(await measure('year 50'));
  // ablation 1: the story log cut to its last two years (the page shows up to 40)
  await page.evaluate(() => { window.__log = A.S.log; A.S.log = A.S.log.slice(-2); });
  res.push(await measure('year 50, log cut to 2 years'));
  await page.evaluate(() => { A.S.log = window.__log; });
  // ablation 2: the post-render DOM passes stubbed
  await page.evaluate(() => {
    const F = UI.FOLD, L = UI.LOOK, M = UI.MOTION; window.__keep = { cards: F.cards, fit: L.fitLife, chip: L.chipFit, name: L.nameFit, play: M.play };
    F.cards = () => {}; L.fitLife = () => {}; L.chipFit = () => {}; L.nameFit = () => {}; M.play = () => {};
  });
  res.push(await measure('year 50, FOLD.cards / LOOK.fit / chipFit / nameFit / MOTION.play stubbed'));
  // both
  await page.evaluate(() => { A.S.log = A.S.log.slice(-2); });
  res.push(await measure('year 50, both'));
  await page.evaluate(() => { A.S.log = window.__log; const k = window.__keep, F = UI.FOLD, L = UI.LOOK, M = UI.MOTION; F.cards = k.cards; L.fitLife = k.fit; L.chipFit = k.chip; L.nameFit = k.name; M.play = k.play; });
  // the people tab and the world tab at year 50, layouts per draw
  for (const t of ['people', 'world', 'realm']) {
    const a = await metrics();
    await page.evaluate(t => { for (let i = 0; i < 3; i++) { UI.ov = null; UI.tab = t; UI.render(); void document.body.offsetHeight; } }, t);
    const b = await metrics();
    const r = { label: `year 50, ${t} tab draw`, cpu: Math.round((b.ThreadTime - a.ThreadTime) * 1000 / 3), layouts: +((b.LayoutCount - a.LayoutCount) / 3).toFixed(1), recalcs: +((b.RecalcStyleCount - a.RecalcStyleCount) / 3).toFixed(1), layoutMs: Math.round((b.LayoutDuration - a.LayoutDuration) * 1000 / 3) };
    console.log(JSON.stringify(r)); res.push(r);
  }
  // what the people tab lists at year 50
  const ppl = await page.evaluate(() => { UI.tab = 'people'; UI.render(); const tb = document.getElementById('tabbody'); return { rows: tb.querySelectorAll('[data-a="ov"]').length, html: tb.innerHTML.length, pcRel: Object.keys(A.pc().rel || {}).length, people: Object.keys(A.S.people).length }; });
  console.log('people tab', JSON.stringify(ppl)); res.push({ label: 'people tab contents', ...ppl });
  fs.writeFileSync(`${OUT}/exp.json`, JSON.stringify({ res, errs }, null, 1));
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
