// Deciding critic: a life played through the real interface (clicks on Next month, on choices, on Close), then its
// journal replayed in a fresh page: same fingerprint?   node uireplay.cjs <presses> <width>
const fs = require('fs');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const pressSrc = fs.readFileSync(__dirname + '/press.cjs', 'utf8');
const INSTALL = eval('(' + pressSrc.slice(pressSrc.indexOf('const INSTALL = ') + 16, pressSrc.indexOf('\n(async () => {')).replace(/;\s*$/, '') + ')');
const N = +(process.argv[2] || 36), W = +(process.argv[3] || 1366);
(async () => {
  const browser = await chromium.launch();
  const mk = async () => { const ctx = await browser.newContext({ viewport: { width: W, height: 900 }, deviceScaleFactor: 1 }); const page = await ctx.newPage(); page.setDefaultTimeout(3600000); await page.goto('file:///tmp/ardan/snap/index.html'); await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 3600000 }); return page; };
  const p1 = await mk();
  await p1.evaluate(o => { A.newGame(o); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render(); }, { seed: 4242, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 16 });
  await p1.evaluate(INSTALL, false);
  let cards = 0, tabs = 0;
  for (let i = 0; i < N; i++) {
    const r = await p1.evaluate(() => __P.press()); cards += r.cards; if (r.why !== 'ok') { console.log('stopped', r.why); break; }
    // a player looks around between months: every tab, a person's sheet
    if (i % 4 === 0) { await p1.evaluate(() => { for (const t of UI.GROUPS.flatMap(g => g.subs.map(s => s[0]))) { UI.tab = t; UI.render(); } const p = Object.values(A.S.people).find(p => p.alive && p.id !== A.S.pc); try { UI.A.ov && UI.A.ov(p.id); } catch (e) {} UI.ov = null; UI.tab = 'life'; UI.render(); }); tabs++; }
  }
  const d = await p1.evaluate(() => ({ j: JSON.stringify(A.J), fp: A.fingerprint(), n: A.J.e.length, year: A.S.year, day: A.absDay(), kinds: A.J.e.reduce((o, x) => { o[x[0]] = (o[x[0]] || 0) + 1; return o; }, {}) }));
  const p2 = await mk();
  const r = await p2.evaluate(j => { const res = A.replay(JSON.parse(j)); return { ok: res.ok, at: res.at, k: res.k, why: res.why, steps: res.steps, fp: A.fingerprint(), day: A.absDay() }; }, d.j);
  console.log(JSON.stringify({ presses: N, cards, lookedAround: tabs, journalEntries: d.n, journalKB: Math.round(d.j.length / 1024), kinds: d.kinds, year: d.year, want: d.fp, got: r.fp, same: d.fp === r.fp, replay: r }));
  await browser.close();
})().catch(e => { console.error('FATAL', e.stack || e); process.exit(1); });
