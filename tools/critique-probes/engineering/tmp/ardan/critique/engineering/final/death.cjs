// Deciding critic: does the bar a dead player gets (#agebar) switch the whole-document restyle on, as a hint does?
// Hints are off from the start. The player dies (engine's own kill), the death screen is drawn, play goes on as an heir.
const fs = require('fs');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const pressSrc = fs.readFileSync(__dirname + '/press.cjs', 'utf8');
const INSTALL = eval('(' + pressSrc.slice(pressSrc.indexOf('const INSTALL = ') + 16, pressSrc.indexOf('\n(async () => {')).replace(/;\s*$/, '') + ')');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(); page.setDefaultTimeout(3600000);
  const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable', { timeDomain: 'threadTicks' });
  const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  await page.goto('file:///tmp/ardan/snap/index.html');
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 3600000 });
  const s = fs.readFileSync('/tmp/ardan/critique/engineering/out/noble-y50-state.json', 'utf8');
  await page.evaluate(s => { UI.set.hints = false; A.deserialize(JSON.parse(s)); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render(); }, s);
  await page.evaluate(INSTALL, true);
  const probe = async label => {
    await page.evaluate(() => new Promise(r => setTimeout(r, 300)));
    const a = await metrics(); await page.evaluate(() => { const tb = document.getElementById('tabbody'); for (let i = 0; i < 12; i++) { const sp = document.createElement('span'); tb.appendChild(sp); void tb.offsetHeight; sp.remove(); void tb.offsetHeight; } }); const b = await metrics();
    const r = { label, insertMs: +(((b.RecalcStyleDuration - a.RecalcStyleDuration) * 1000) / Math.max(1, b.RecalcStyleCount - a.RecalcStyleCount)).toFixed(2), info: await page.evaluate(() => ({ hints: document.querySelectorAll('.hint').length, agebar: !!document.getElementById('agebar'), alive: !!(A.pc() && A.pc().alive), pc: A.pc() && A.pc().given, modal: !!document.getElementById('modal'), ov: UI.ov && UI.ov.type })) };
    console.log(JSON.stringify(r)); return r;
  };
  const presses = async (n, label) => { let cpu = 0, cards = 0, wall = 0; for (let i = 0; i < n; i++) { const a = await metrics(); const r = await page.evaluate(() => __P.press()); await page.evaluate(() => new Promise(r => setTimeout(r, 250))); const b = await metrics(); cpu += (b.ThreadTime - a.ThreadTime) * 1000; cards += r.cards; wall += r.wall; if (r.why !== 'ok') { console.log('press stopped', r.why); break; } } console.log(JSON.stringify({ label, presses: n, cards, cpuPerPress: Math.round(cpu / n), wallPerPress: Math.round(wall / n) })); };
  await probe('1. hints off, alive');
  await presses(6, '1. six presses, alive');
  // the player dies by the engine's own road; the page is drawn as the game draws it
  const d = await page.evaluate(() => { const pc = A.pc(); const kids = (pc.children || []).map(id => A.P(id)).filter(p => p && p.alive).sort((a, b) => A.age(b) - A.age(a)); let how = '?'; try { if (A.kill) { A.kill(pc, 'a fever'); how = 'A.kill'; } else if (A.die) { A.die(pc, 'a fever'); how = 'A.die'; } } catch (e) { how = 'threw ' + e; } UI.render(); return { how, alive: pc.alive, heir: kids[0] ? kids[0].id : null, queue: A.S.queue.map(q => q.type).slice(0, 5) }; });
  console.log('death', JSON.stringify(d));
  await probe('2. dead: the death screen');
  await page.evaluate(() => { UI.ov = null; A.S.queue.length = 0; UI.render(); });
  await probe('2b. dead: the game screen with its bar');
  const c = await page.evaluate(() => { const pc = A.pc(); const all = Object.values(A.S.people).filter(p => p.alive && p.id !== pc.id); const k = all.find(p => (pc.children || []).includes(p.id)) || all.find(p => p.house && p.house === pc.house && A.age(p) >= 14) || all.find(p => p.realm === pc.realm && A.age(p) >= 16 && A.age(p) <= 40) || all.find(p => A.age(p) >= 16); if (!k) return 'no heir among ' + all.length; try { A.continueAs(k.id); } catch (e) { return 'continueAs threw ' + e; } UI.ov = null; UI.screen = 'game'; UI.tab = 'life'; UI.render(); return k.given + ' ' + A.age(k) + ' alive ' + A.pc().alive; });
  console.log('continued as', c);
  await probe('3. alive again as the heir');
  await presses(6, '3. six presses as the heir');
  await probe('3b. after them');
  console.log('errors', errs.length, errs.slice(0, 2));
  await browser.close();
})().catch(e => { console.error('FATAL', e.stack || e); process.exit(1); });
