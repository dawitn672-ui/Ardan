const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
  await page.goto('file:///tmp/ardan/snap/index.html');
  await page.waitForTimeout(2000);
  const r = await page.evaluate(() => ({
    A: Object.keys(A).filter(k => /serial|save|load|export|import/i.test(k)),
    SAVES: typeof SAVES !== 'undefined' ? Object.keys(SAVES) : null,
    UIA: Object.keys(UI.A).length, UIAk: Object.keys(UI.A).filter(k => /save|load|export|import|join|enlist|job|apply|career|marry|court|army/i.test(k)),
  }));
  console.log(JSON.stringify(r, null, 1));
  await b.close();
})();
