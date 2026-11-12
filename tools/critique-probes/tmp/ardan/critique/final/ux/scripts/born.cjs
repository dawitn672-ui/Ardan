// "Be born" through the real UI; the first screen; first months by the real button. node born.cjs <w> <h> [touch]
const { chromium, open, shot, cpuClock } = require('./lib.cjs');
const [W, H, touch] = [+process.argv[2], +process.argv[3], process.argv[4] === 'touch'];
(async () => {
  const browser = await chromium.launch();
  const { ctx, page } = await open(browser, W, H, { touch, mobile: touch });
  const clk = await cpuClock(page);
  const tap = async sel => { const e = await page.$(sel); if (!e) return false; if (touch) await e.tap(); else await e.click(); return true; };
  await page.evaluate(() => { const b = [...document.querySelectorAll('[data-a="newLife"]')][0]; b && b.scrollIntoView(); });
  await tap('[data-a="newLife"]');
  await page.waitForTimeout(500);
  const sel = await page.evaluate(() => [...document.querySelectorAll('[data-a="crQuick"],[data-a="crStory"],[data-a="crSet"]')].filter(e => e.getBoundingClientRect().width).map(e => e.getAttribute('data-v') + ' cls=' + e.className + ' pressed=' + e.getAttribute('aria-pressed') + ' sel=' + e.getAttribute('aria-selected')).slice(0, 12));
  console.log('new-life option states:', sel);
  const t0 = Date.now(); const c0 = await clk.get();
  await tap('[data-a="crQuick"][data-v="born"]');
  await page.waitForFunction(() => UI.screen === 'game', null, { timeout: 120000 }).catch(() => console.log('never reached game'));
  const c1 = await clk.get();
  console.log('Be born -> game: wall', Date.now() - t0, 'ms; cpu task', Math.round((c1.TaskDuration - c0.TaskDuration) * 1000), 'ms');
  await page.waitForTimeout(1200);
  let m = await shot(page, 'b01-first', { full: true }); console.log(JSON.stringify(m));
  const st = await page.evaluate(() => ({ screen: UI.screen, tab: UI.tab, ov: UI.ov && (UI.ov.type || UI.ov), q: A.S.queue.slice(0, 3).map(x => x.type + ':' + (x.ev || x.title || '')), groups: UI.GROUPS.map(g => g.k + ':' + g.subs.map(s => s[0] + '=' + s[1]).join(',')), pc: (() => { const p = A.pc(); return { name: p.name, age: A.age(p), status: p.status, rel: Object.keys(p.rel || {}).length }; })(), modal: (document.querySelector('#modal') || {}).innerText }));
  console.log(JSON.stringify(st, null, 1).slice(0, 2500));
  console.log('TEXT:', (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, ' / ').slice(0, 3000));
  console.log('errors', page.errs);
  await browser.close();
})();
