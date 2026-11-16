// First look through the real UI: title, new life, a few Next month presses, at 1366 and 420.
const fs = require('fs');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const W = +(process.argv[2] || 1366);
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: W, height: W < 500 ? 860 : 900 }, deviceScaleFactor: 1, hasTouch: W < 500, isMobile: W < 500 });
  const page = await ctx.newPage(); page.setDefaultTimeout(900000);
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + String(e.stack || e).slice(0, 300)));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text().slice(0, 300)); });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable', { timeDomain: 'threadTicks' });
  const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  const t0 = Date.now();
  await page.goto('file:///tmp/ardan/snap/index.html');
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 900000 });
  const mb = await metrics();
  console.log('boot wall ms', Date.now() - t0, 'CPU ms', Math.round(mb.ThreadTime * 1000), 'script', Math.round(mb.ScriptDuration * 1000), 'heapMB', Math.round(mb.JSHeapUsedSize / 1e6), JSON.stringify(await page.evaluate(() => window.ARDAN_BOOT)));
  await page.screenshot({ path: `shots/title-${W}.png` });
  const m0 = await metrics(); const w0 = Date.now();
  await page.click('[data-a="randomLife"]');
  await page.waitForFunction(() => UI.screen === 'game', null, { timeout: 900000 });
  await page.waitForTimeout(1500);
  const m1 = await metrics();
  console.log('Random life click -> game: wall ms', Date.now() - w0, 'CPU ms', Math.round((m1.ThreadTime - m0.ThreadTime) * 1000), 'script ms', Math.round((m1.ScriptDuration - m0.ScriptDuration) * 1000));
  await page.screenshot({ path: `shots/start-${W}.png` });
  const info = await page.evaluate(() => ({ screen: UI.screen, tab: UI.tab, ov: UI.ov && UI.ov.type, q: A.S.queue.length, pc: A.pc() && [A.pc().given, A.age(A.pc()), A.pc().status, A.pc().realm], seed: A.S.seed, year: A.S.year,
    next: [...document.querySelectorAll('[data-a="v2Next"]')].map(b => ({ t: b.textContent.trim(), vis: !!(b.offsetWidth || b.offsetHeight), dis: b.getAttribute('aria-disabled') })),
    modal: !!document.querySelector('#modal'), modalHtml: document.querySelector('#modal') ? document.querySelector('#modal').innerHTML.slice(0, 2500) : null,
    tabs: [...document.querySelectorAll('#tabs [data-a="tab"], #bnav [data-a]')].map(b => b.getAttribute('data-a') + ':' + b.getAttribute('data-v') + ':' + b.textContent.trim().slice(0, 16)) }));
  console.log(JSON.stringify(info, null, 1));
  console.log('errors', errs);
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
