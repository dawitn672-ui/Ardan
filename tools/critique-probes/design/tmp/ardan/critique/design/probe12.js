const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
  await page.goto('file:///tmp/ardan/snap/index.html');
  await page.waitForTimeout(1500);
  await page.evaluate(() => { A.newGame({ seed: 4243, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 }); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render(); });
  await page.waitForTimeout(500);
  const html = await page.evaluate(() => { const m = document.querySelector('main'); const sec = [...m.querySelectorAll('section, .card')].find(s => /YOUR DAYS/i.test(s.innerText)); return sec ? sec.outerHTML.replace(/<svg[\s\S]*?<\/svg>/g,'').slice(0, 5000) : 'none'; });
  console.log(html);
  const acts = await page.evaluate(() => [...document.querySelectorAll('main [data-a="act"]')].map(b => b.getAttribute('data-v') + '|' + b.innerText.replace(/\n/g,' / ').slice(0,80)));
  console.log(acts.join('\n'));
  const txt = await page.evaluate(() => document.querySelector('main').innerText);
  console.log(txt.slice(txt.indexOf('WHAT NOW'), txt.indexOf('WHAT NOW') + 800));
  await b.close();
})();
