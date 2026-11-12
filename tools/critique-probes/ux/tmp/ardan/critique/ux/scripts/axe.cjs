// axe-core (WCAG 2.2 AA) on key screens: node axe.cjs <w> <h>
const { chromium, open, shot, HELPERS } = require('./lib.cjs');
const fs = require('fs');
const AXE = fs.readFileSync('/home/user/Ardan/node_modules/axe-core/axe.min.js', 'utf8');
const [W, H] = [+process.argv[2], +process.argv[3]];
(async () => {
  const browser = await chromium.launch();
  const { ctx, page } = await open(browser, W, H);
  await page.evaluate(HELPERS);
  await page.evaluate(AXE);
  const run = async (label) => {
    const r = await page.evaluate(async () => {
      const res = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] }, resultTypes: ['violations'] });
      return res.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, ex: v.nodes.slice(0, 3).map(n => (n.target || []).join(' ').slice(0, 80) + ' :: ' + (n.failureSummary || '').replace(/\s+/g, ' ').slice(0, 160)) }));
    });
    console.log('##', label, r.length ? '' : 'clean');
    for (const v of r) console.log('  ', v.id, v.impact, v.n, '\n     ', v.ex.join('\n      '));
  };
  await page.evaluate(() => { T.enter({ seed: 5151, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 22 }); T.play(2); UI.screen = 'game'; UI.ov = null; UI.tab = 'life'; UI.render(); });
  await page.waitForTimeout(500);
  for (const t of ['life', 'goals', 'path', 'holdings', 'people', 'realm', 'world', 'atlas', 'codex']) {
    await page.evaluate(t => { UI.tab = t; UI.render(); }, t);
    await page.waitForTimeout(300);
    await run('tab ' + t);
  }
  await page.evaluate(() => { const pc = A.pc(); UI.A.ov('person:' + (pc.father || Object.keys(pc.rel)[0])); });
  await page.waitForTimeout(400); await run('person overlay');
  await page.evaluate(() => { UI.ov = null; UI.render(); UI.A.ov('tree'); });
  await page.waitForTimeout(400); await run('tree overlay');
  await page.evaluate(() => { UI.ov = null; UI.render(); UI.A.menu(); });
  await page.waitForTimeout(600); await run('menu');
  await page.evaluate(() => { UI.ov = null; UI.render(); });
  // an event card
  const got = await page.evaluate(() => { for (let i = 0; i < 40; i++) { A.advance(15); const h = A.headReady(); if (h && h.type === 'event') { UI.render(); return true; } if (h) A.skipPrompt(); } return false; });
  await page.waitForTimeout(600);
  if (got) await run('event card');
  console.log('errors', page.errs);
  await browser.close();
})();
