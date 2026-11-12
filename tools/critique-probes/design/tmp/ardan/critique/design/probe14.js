const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
  await page.goto('file:///tmp/ardan/snap/index.html');
  await page.waitForTimeout(1500);
  const out = [];
  for (const status of ['serf', 'peasant', 'artisan', 'merchant', 'gentry', 'noble', 'royal']) for (const startAge of [0, 16]) for (const seed of [11, 12, 13]) {
    const r = await page.evaluate(([status, startAge, seed]) => {
      A.newGame({ seed, race: 'human', realm: 'POL-01', status, sex: 'M', startAge });
      const pc = A.pc(); const types = {};
      for (const [id, r] of Object.entries(pc.rel || {})) { const p = A.P(id); const k = r.type + (p && !p.alive ? '(dead)' : ''); types[k] = (types[k] || 0) + 1; }
      const n = Object.keys(pc.rel || {}).length;
      // who is shown on the People tab
      UI.screen = 'game'; UI.tab = 'people'; UI.ov = null; UI.render();
      const fam = (document.querySelector('main').innerText.match(/FAMILY \((\d+)\)/) || [])[1];
      const sections = [...document.querySelectorAll('main h2, main h3, main .tag, main summary')].map(e => e.innerText.trim()).filter(Boolean).slice(0, 20);
      return { status, startAge, seed, n, fam, types, sections: (document.querySelector('main').innerText.match(/^[A-Z][A-Z ’'&]+(\(\d+\))?$/gm) || []).slice(0, 15) };
    }, [status, startAge, seed]);
    out.push(r);
    console.log(JSON.stringify(r));
  }
  require('fs').writeFileSync('rel-at-start.json', JSON.stringify(out, null, 1));
  await b.close();
})();
