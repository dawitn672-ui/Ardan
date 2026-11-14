const { open, enter, shot, SHOTS } = require('./lib.cjs');
(async () => {
  for (const [w, h] of [[1366, 768], [420, 900]]) {
    const { b, pg, errs } = await open(w, h);
    await enter(pg, { seed: 7311, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 30 });
    const r = await pg.evaluate(() => {
      UI.set.hints = false;
      A.V2MAP && A.V2MAP.SAT && (A.V2MAP.SAT.budgetMs = 1e9);
      const pc = A.pc(); const me = pc.realm; const en = A.neighbors(me)[0];
      let e1 = null; try { e1 = A.enlist(pc); } catch (e) { e1 = String(e).slice(0, 100); }
      pc.mil.rank = 8;
      A.startWar(me, en, null, 'conquest');
      const types = {};
      let found = null;
      for (let g = 0; g < 300 && !found; g++) {
        A.advance(3);
        let hh, k = 0;
        while ((hh = A.headReady()) && k++ < 50) {
          types[hh.type] = (types[hh.type] || 0) + 1;
          if (hh.type === 'v2battle' || hh.type === 'battle' || hh.type === 'warroom' || hh.type === 'tactical') { found = hh.type; break; }
          if (hh.type === 'choice' && (hh.options || []).some(o => o && /^ws/.test(o.fn || ''))) { found = 'choice:' + JSON.stringify(hh.options.map(o => [o.fn, o.t || o.label])).slice(0, 300); break; }
          if (hh.type === 'event') A.eventAuto(); else A.skipPrompt();
        }
        if (!A.pc().alive) break;
      }
      return { e1, found, types, rank: pc.mil.rank, alive: A.pc().alive };
    });
    console.log(w, JSON.stringify(r));
    await pg.evaluate(() => { UI.screen = 'game'; UI.render(); });
    await pg.waitForTimeout(1000);
    await shot(pg, `cmd-card-${w}`);
    // take the command option
    const opt = await pg.locator('.choices button').first();
    if (await opt.count()) { await opt.click({ timeout: 3000 }).catch(() => {}); await pg.waitForTimeout(2500); await shot(pg, `cmd-battle-${w}`); }
    const info = await pg.evaluate(() => ({ ov: UI.ov && UI.ov.type, head: A.S.queue[0] && A.S.queue[0].type, btns: [...document.querySelectorAll('[data-a]')].slice(0, 30).map(e => e.getAttribute('data-a') + ':' + e.textContent.trim().slice(0, 30)) }));
    console.log(w, JSON.stringify(info).slice(0, 1500));
    await pg.waitForTimeout(2500);
    await shot(pg, `cmd-battle2-${w}`);
    // war room
    await pg.evaluate(() => { try { UI.ov = null; UI.warRoomOpen && UI.warRoomOpen(); UI.render(); } catch (e) { console.error(e); } });
    await pg.waitForTimeout(2000);
    await shot(pg, `warroom-${w}`);
    console.log('errs', errs);
    await b.close();
  }
})();
