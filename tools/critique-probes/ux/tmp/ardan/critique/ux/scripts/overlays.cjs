// Overlays for one persona at one width: node overlays.cjs <persona> <w> <h>
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
    for (let i = 0; i < 6; i++) { A.advance(5); let h, g = 0; while ((h = A.headReady()) && g++ < 50) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); } }
    UI.screen = 'game'; UI.ov = null; UI.tab = 'life'; UI.render();
  },
};
(async () => {
  const browser = await chromium.launch();
  const { ctx, page } = await open(browser, W, H);
  await page.evaluate(HELPERS);
  await page.evaluate(`(${SETUP[persona].toString()})()`);
  await page.waitForTimeout(500);
  const P = persona;
  const rec = async (name, full = false) => { const m = await shot(page, `${P}-ov-${name}`, { full }); console.log(m.name, 'words', m.wordsView, '/', m.wordsPage, 'inter', m.interactiveInView, '/', m.interactive, 'small44', m.smallTargets44, 'title', m.titleAttrs, 'tt', m.ttTriggers, 'screens', m.screens); return m; };
  const closeOv = async () => { await page.evaluate(() => { UI.ov = null; if (A.S.queue.length && A.S.queue[0].type === 'death') {} UI.render(); }); await page.waitForTimeout(200); };
  const openOv = async (v, name) => {
    const ok = await page.evaluate(v => { try { UI.A.ov(v); return !!UI.ov; } catch (e) { return 'err ' + e; } }, v);
    await page.waitForTimeout(400);
    console.log('open', v, ok);
    await rec(name, true);
    // modal scroll height
    const mi = await page.evaluate(() => { const m = document.querySelector('.mbox, .modal, [role=dialog]'); if (!m) return null; return { sh: m.scrollHeight, ch: m.clientHeight, words: m.innerText.split(/\s+/).filter(Boolean).length, text: m.innerText.slice(0, 1500) }; });
    if (mi) console.log('  modal', JSON.stringify({ sh: mi.sh, ch: mi.ch, words: mi.words }), '\n  ', mi.text.replace(/\n+/g, ' / ').slice(0, 1200));
    await closeOv();
  };
  // a person: father/mother or superior
  const pid = await page.evaluate(() => { const pc = A.pc(); const ids = [pc.father, pc.mother].filter(Boolean); const k = Object.keys(pc.rel || {}); return ids.find(i => A.P(i) && A.P(i).alive) || k[0]; });
  await openOv('person:' + pid, 'person');
  await openOv('profile', 'profile');
  await openOv('tree', 'tree');
  await openOv('profs', 'profs');
  const fam = await page.evaluate(() => { const pc = A.pc(); return pc.fam || pc.house || (pc.family && pc.family.id) || null; });
  const houseV = await page.evaluate(() => { UI.tab = 'realm'; UI.render(); const e = document.querySelector('[data-a="ov"][data-v^="house:"]'); return e && e.getAttribute('data-v'); });
  if (houseV) await openOv(houseV, 'house');
  await openOv('bigmap', 'bigmap');
  // menu
  await page.evaluate(() => { UI.tab = 'life'; UI.render(); });
  const mb = await page.$('[data-a="menu"]');
  if (mb) { await mb.click(); await page.waitForTimeout(400); await rec('menu', true); const t = await page.evaluate(() => (document.querySelector('.mbox,[role=dialog]') || document.body).innerText.replace(/\n+/g, ' / ').slice(0, 1500)); console.log('  menu:', t); }
  // help from the menu
  const hb = await page.$('[data-a="help"]');
  if (hb) { await hb.click(); await page.waitForTimeout(400); await rec('help', true); const t = await page.evaluate(() => { const m = document.querySelector('.mbox,[role=dialog]'); return m ? { sh: m.scrollHeight, words: m.innerText.split(/\s+/).length, t: m.innerText.replace(/\n+/g, ' / ').slice(0, 800) } : null; }); console.log('  help:', JSON.stringify(t)); }
  await closeOv();
  // war room (soldier/ruler)
  const wr = await page.evaluate(() => { try { if (A.V2W && A.V2W.inWar && A.V2W.inWar(A.pc())) { UI.warRoomOpen(); return UI.ov && UI.ov.type; } } catch (e) { return 'err ' + e; } return null; });
  if (wr) {
    await page.waitForTimeout(800); await rec('warroom', true);
    const tabs = await page.evaluate(() => [...document.querySelectorAll('[data-a="wrTab"]')].map(e => e.getAttribute('data-v') + '=' + e.innerText.trim()));
    console.log('  war room tabs', tabs);
    for (const t of tabs) { const v = t.split('=')[0]; await page.click(`[data-a="wrTab"][data-v="${v}"]`).catch(() => {}); await page.waitForTimeout(500); await rec('warroom-' + v, true); }
    await closeOv();
  }
  fs.writeFileSync(`/tmp/ardan/critique/ux/ov-${P}-${W}.done`, 'ok');
  console.log('errors', page.errs);
  await browser.close();
})();
