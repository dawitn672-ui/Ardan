// Lead critic's probe 2: terrain labels per seed, noble newborn relations, a year's Next-month presses for a newborn (cards vs empty).
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 200)); });
  await page.goto('file:///tmp/ardan/snap/index.html');
  await page.waitForTimeout(6000);
  const out = await page.evaluate(() => {
    const res = { terr: {}, biome: {}, rel: {} };
    const mk = (o) => { A.newGame(o); UI.screen = 'game'; UI.tab = 'life'; UI.render(); };
    for (const seed of [1, 42]) {
      mk({ seed, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 0 });
      const t = {}, b = {}; let coast = 0, towns = {};
      for (const p of Object.values(A.S.prov)) { t[p.terr] = (t[p.terr] || 0) + 1; b[p.biome] = (b[p.biome] || 0) + 1; if (p.coast) coast++; towns[p.type || p.town] = (towns[p.type || p.town] || 0) + 1; }
      res.terr[seed] = t; res.biome[seed] = b; res['coast' + seed] = coast; res['types' + seed] = towns;
      const pc = A.pc(); const kinds = {};
      for (const r of Object.values(pc.rel || {})) { const k = (r && (r.t || r.k || r.kind || r.type)) || '?'; kinds[k] = (kinds[k] || 0) + 1; }
      res.rel[seed] = kinds;
      res['wars' + seed] = (A.S.wars || []).length;
    }
    // a newborn peasant: 24 presses of the engine month with the bot, count cards per month
    mk({ seed: 5, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 0 });
    let months = 0, empty = 0, cards = 0;
    for (let i = 0; i < 48; i++) {
      const r = A.advance(30); months++;
      let h, n = 0, g = 0;
      while ((h = A.headReady()) && g++ < 50) { if (h.type === 'event') { n++; A.eventAuto(); } else A.skipPrompt(); }
      if (!n) empty++; cards += n;
    }
    res.newborn48 = { months, empty, cards };
    return res;
  });
  console.log(JSON.stringify(out));
  console.log('errors', errs.slice(0, 10));
  await browser.close();
})();
