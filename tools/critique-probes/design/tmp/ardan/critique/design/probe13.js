const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
  await page.goto('file:///tmp/ardan/snap/index.html');
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => {
    A.newGame({ seed: 4243, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 0 });
    const pc = A.pc();
    const keys = Object.keys(pc);
    const sample = {};
    for (const k of keys) { const v = pc[k]; sample[k] = typeof v === 'object' && v ? (Array.isArray(v) ? 'arr' + v.length + ':' + JSON.stringify(v).slice(0, 150) : 'obj:' + JSON.stringify(v).slice(0, 200)) : v; }
    return sample;
  });
  console.log(JSON.stringify(r, null, 1));
  await b.close();
})();
