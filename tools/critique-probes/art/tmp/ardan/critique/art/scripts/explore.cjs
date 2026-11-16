const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 });
  const errs = []; pg.on('pageerror', e => errs.push(String(e).slice(0, 300)));
  const t0 = Date.now();
  await pg.goto('file:///tmp/ardan/snap/index.html');
  await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 180000 }).catch(e => console.log('no ARDAN_CONTENT_READY', e.message));
  console.log('load ms', Date.now() - t0);
  const info = await pg.evaluate(() => {
    const o = {};
    o.version = window.ARDAN_VERSION || (window.A && A.VERSION);
    o.Akeys = Object.keys(A).length;
    o.portrait = typeof PORTRAIT !== 'undefined' ? Object.keys(PORTRAIT) : null;
    o.portrait2 = typeof PORTRAIT2 !== 'undefined' ? Object.keys(PORTRAIT2) : null;
    o.anime = UI.ANIME ? Object.keys(UI.ANIME) : null;
    o.map = typeof MAP !== 'undefined' ? Object.keys(MAP).slice(0, 80) : null;
    o.V2 = window.V2 ? Object.keys(window.V2).slice(0, 80) : null;
    o.set = UI.set;
    o.screen = UI.screen;
    return o;
  });
  console.log(JSON.stringify(info, null, 1));
  console.log('errs', errs);
  await b.close();
})();
