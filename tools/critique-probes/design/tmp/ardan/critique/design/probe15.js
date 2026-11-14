const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
  await page.goto('file:///tmp/ardan/snap/index.html');
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => {
    A.newGame({ seed: 4243, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 });
    UI.screen = 'game'; UI.tab = 'life'; UI.render();
    const pc = A.pc();
    const ini = Object.keys(pc).filter(k => /ini|ap|act/i.test(k));
    const clk = document.querySelector('.clk-ini') && document.querySelector('.clk-ini').outerHTML.slice(0, 500);
    const AK = Object.keys(A).filter(k => /^ini|initiative|apMax|actCost/i.test(k));
    return { ini, vals: ini.map(k => [k, JSON.stringify(pc[k]).slice(0, 100)]), clk, AK };
  });
  console.log(JSON.stringify(r, null, 1));
  await b.close();
})();
