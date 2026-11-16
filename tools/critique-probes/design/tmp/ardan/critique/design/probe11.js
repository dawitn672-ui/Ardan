const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto('file:///tmp/ardan/snap/index.html');
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => {
    A.newGame({ seed: 4242, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 16 });
    const t0 = performance.now(); const s = A.serialize(); const t1 = performance.now();
    return { type: typeof s, len: s && s.length, ms: t1 - t0, head: typeof s === 'string' ? s.slice(0, 200) : Object.keys(s).slice(0, 20), ser: A.serialize.toString().slice(0, 600), des: A.deserialize.toString().slice(0, 600) };
  });
  console.log(JSON.stringify(r, null, 1));
  await b.close();
})();
