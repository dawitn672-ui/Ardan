const fs = require('fs');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const S = fs.readFileSync('/tmp/ardan/critique/engineering/out/noble-y50-state.json', 'utf8');
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage();
  await page.goto('file:///tmp/ardan/snap/index.html');
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 300000 });
  const r = await page.evaluate(s => { A.deserialize(JSON.parse(s)); UI.screen = 'game'; UI.tab = 'people'; UI.ov = null; UI.render();
    const tb = document.getElementById('tabbody');
    const svgs = [...tb.querySelectorAll('svg')]; const svgBytes = svgs.reduce((a, s) => a + s.outerHTML.length, 0);
    return { html: tb.innerHTML.length, nodes: tb.getElementsByTagName('*').length, svg: svgs.length, svgBytes, svgNodes: svgs.reduce((a, s) => a + s.getElementsByTagName('*').length, 0), imgs: tb.querySelectorAll('img').length, rows: tb.querySelectorAll('[data-a="ov"]').length };
  }, S);
  console.log(JSON.stringify(r));
  await browser.close();
})();
