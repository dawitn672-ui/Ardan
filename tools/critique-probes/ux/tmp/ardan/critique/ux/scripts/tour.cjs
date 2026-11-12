// Tour every place for one persona at one width: node tour.cjs <persona> <w> <h>
const { chromium, open, shot, HELPERS } = require('./lib.cjs');
const fs = require('fs');
const [persona, W, H] = [process.argv[2], +process.argv[3], +process.argv[4]];
const SETUP = {
  child: () => { T.enter({ seed: 4242, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 9 }); },
  noble: () => { T.enter({ seed: 5151, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 22 }); T.play(4); UI.screen = 'game'; UI.ov = null; UI.tab = 'life'; UI.render(); },
  ruler: () => { T.enter({ seed: 6161, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 30 }); T.play(1); const pc = A.pc(); A.makeRuler(pc, pc.realm, true); UI.screen = 'game'; UI.ov = null; UI.tab = 'life'; UI.render(); },
  soldier: () => {
    T.enter({ seed: 7301, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22 });
    T.play(1);
    const pc = A.pc(); if (!pc.mil) A.enlist(pc);
    if (!A.atWar(pc.realm).length) A.startWar(pc.realm, A.neighbors(pc.realm)[0], null, 'conquest');
    // let the war run a few weeks, auto-answering
    for (let i = 0; i < 6; i++) { A.advance(5); let h, g = 0; while ((h = A.headReady()) && g++ < 50) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); } }
    UI.screen = 'game'; UI.ov = null; UI.tab = 'life'; UI.render();
  },
};
(async () => {
  const browser = await chromium.launch();
  const { ctx, page } = await open(browser, W, H);
  await page.evaluate(HELPERS);
  await page.evaluate(`(${SETUP[persona].toString()})()`);
  await page.waitForTimeout(600);
  const P = persona;
  const log = [];
  const rec = async (name, full = true) => { const m = await shot(page, `${P}-${name}`, { full }); log.push(m); console.log(m.name, 'words', m.wordsView, '/', m.wordsPage, 'inter', m.interactiveInView, '/', m.interactive, 'small44', m.smallTargets44, 'title', m.titleAttrs, 'tt', m.ttTriggers, 'screens', m.screens); };
  const info = await page.evaluate(() => { const p = A.pc(); return { name: p.name, age: A.age(p), status: p.status, mil: p.mil && p.mil.rank, atWar: A.atWar(p.realm).length, groups: UI.GROUPS.map(g => g.k + ':' + g.subs.map(s => s[0] + '=' + s[1]).join(',')) }; });
  console.log(JSON.stringify(info));
  const groups = await page.evaluate(() => UI.GROUPS.map(g => ({ k: g.k, subs: g.subs.map(s => s[0]) })));
  for (const g of groups) {
    const gb = await page.$(`[data-a="group"][data-v="${g.k}"]`);
    if (gb) { await gb.click(); await page.waitForTimeout(300); }
    else await page.evaluate(k => { UI.tab = UI.GROUPS.find(x => x.k === k).subs[0][0]; UI.render(); }, g.k);
    // phone: the You group may first show the profile page
    const curTab = await page.evaluate(() => UI.tab);
    let subs = g.subs.slice();
    if (!subs.includes(curTab)) subs.unshift(curTab);
    for (const s of subs) {
      const tb = await page.$(`[data-a="tab"][data-v="${s}"]`);
      if (tb && await tb.isVisible()) { await tb.click(); await page.waitForTimeout(300); }
      else await page.evaluate(t => { UI.tab = t; UI.render(); }, s);
      await page.evaluate(() => window.scrollTo(0, 0));
      await rec(`${g.k}-${s}`);
      if (s === 'world') {
        const views = await page.evaluate(() => [...document.querySelectorAll('[data-a="wview"]')].map(e => e.getAttribute('data-v')));
        for (const v of views) {
          await page.click(`[data-a="wview"][data-v="${v}"]`).catch(async () => { await page.evaluate(v => { UI.worldView = v; UI.render(); }, v); });
          await page.waitForTimeout(400);
          await rec(`world-view-${v}`);
        }
      }
      if (s === 'codex') {
        const secs = await page.evaluate(() => [...document.querySelectorAll('[data-a="codex"]')].map(e => e.getAttribute('data-v')));
        for (const v of secs) {
          await page.click(`[data-a="codex"][data-v="${v}"]`).catch(() => {});
          await page.waitForTimeout(300);
          await rec(`codex-${v}`);
        }
      }
    }
  }
  fs.writeFileSync(`/tmp/ardan/critique/ux/tour-${P}-${W}.json`, JSON.stringify(log, null, 1));
  console.log('errors', page.errs);
  await browser.close();
})();
