// Deciding critic: which :has() rule makes a small insertion restyle the whole document? After one real press (the
// slow state), every :has() rule is deleted (fast), then each is put back alone, the page redrawn, and the probe run.
const fs = require('fs');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const pressSrc = fs.readFileSync(__dirname + '/press.cjs', 'utf8');
const INSTALL = eval('(' + pressSrc.slice(pressSrc.indexOf('const INSTALL = ') + 16, pressSrc.indexOf('\n(async () => {')).replace(/;\s*$/, '') + ')');
const STATE = process.argv[2] || '/tmp/ardan/critique/engineering/out/noble-y50-state.json';
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(); page.setDefaultTimeout(3600000);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable', { timeDomain: 'threadTicks' });
  const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  await page.goto('file:///tmp/ardan/snap/index.html');
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 3600000 });
  const s = fs.readFileSync(STATE, 'utf8');
  await page.evaluate(s => { A.deserialize(JSON.parse(s)); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render(); }, s);
  await page.evaluate(INSTALL, true);
  const probe = async () => {
    const a = await metrics();
    await page.evaluate(() => { const tb = document.getElementById('tabbody'); for (let i = 0; i < 12; i++) { const sp = document.createElement('span'); tb.appendChild(sp); void tb.offsetHeight; sp.remove(); void tb.offsetHeight; } });
    const b = await metrics();
    return +(((b.RecalcStyleDuration - a.RecalcStyleDuration) * 1000) / Math.max(1, b.RecalcStyleCount - a.RecalcStyleCount)).toFixed(2);
  };
  console.log('A (loaded):', await probe());
  await page.evaluate(() => __P.press());
  await page.evaluate(() => new Promise(r => setTimeout(r, 500)));
  console.log('B (after a press):', await probe(), 'hints', await page.evaluate(() => document.querySelectorAll('.hint').length));
  // take every :has() rule out, remembering where each was
  const n = await page.evaluate(() => {
    const L = window.__HAS = [];
    const walk = (owner, path) => { const R = owner.cssRules; for (let i = R.length - 1; i >= 0; i--) { const r = R[i]; if (r.type === 1) { if ((r.selectorText || '').includes(':has(')) { L.push({ owner, i, css: r.cssText, sel: r.selectorText }); owner.deleteRule(i); } } else if (r.cssRules) walk(r); } };
    for (const sh of document.styleSheets) { try { walk(sh); } catch (e) {} }
    UI.refresh(); return L.length;
  });
  console.log('all', n, 'rules out:', await probe());
  const out = [];
  for (let k = 0; k < n; k++) {
    const sel = await page.evaluate(k => { const h = window.__HAS[k]; const at = Math.min(h.i, h.owner.cssRules.length); h.at = h.owner.insertRule(h.css, at); UI.refresh(); void document.body.offsetHeight; return h.sel; }, k);
    await page.evaluate(() => new Promise(r => setTimeout(r, 60)));
    const ms = await probe();
    await page.evaluate(k => { const h = window.__HAS[k]; h.owner.deleteRule(h.at); }, k);
    out.push({ sel, ms });
    console.log(ms >= 1 ? 'SLOW' : 'ok  ', String(ms).padStart(6), sel.slice(0, 200));
  }
  fs.writeFileSync('/tmp/ardan/critique/engineering/final/out/hasbisect.json', JSON.stringify(out, null, 1));
  await browser.close();
})().catch(e => { console.error('FATAL', e.stack || e); process.exit(1); });
