const { chromium, open, shot, HELPERS } = require('./lib.cjs');
(async () => {
  const browser = await chromium.launch();
  const { ctx, page } = await open(browser, 1366, 768);
  await page.evaluate(HELPERS);
  const out = await page.evaluate(() => {
    T.enter({ seed: 4242, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 9 });
    const res = { groups: UI.GROUPS.map(g => ({ k: g.k || g.id || g.n, label: g.label || g.n || g.name, subs: g.subs.map(s => s.slice(0, 2)) })) };
    res.tabs = {};
    for (const t of T.tabs()) {
      UI.tab = t; UI.render();
      const els = [...document.querySelectorAll('#tabbody [data-a], .tabs [data-a], [data-a="wview"], [data-a="codex"], [data-a="realmView"]')];
      const acts = {};
      for (const e of els) { const a = e.getAttribute('data-a'); (acts[a] = acts[a] || []).push((e.getAttribute('data-v') || '') + '=' + e.innerText.replace(/\s+/g, ' ').trim().slice(0, 30)); }
      for (const a in acts) acts[a] = acts[a].slice(0, 25);
      res.tabs[t] = acts;
    }
    UI.tab = 'life'; UI.render();
    res.uiA = Object.keys(UI.A).length;
    res.keysUI = Object.keys(UI).filter(k => /View$|view$|Tab$|tab$/.test(k)).slice(0, 80);
    return res;
  });
  console.log(JSON.stringify(out, null, 1).slice(0, 15000));
  console.log('errors', page.errs);
  await browser.close();
})();
