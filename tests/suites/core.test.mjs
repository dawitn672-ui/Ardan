// Whole-game tests that belong to no single feature.
// the long lives: more than the runner's default limit when the machine is loaded
export const limits = { lives: 2400 };
export default {
  async boot(pg, errs) {
    const r = await pg.evaluate(() => ({ events: Object.keys(A.EV).length, build: window.ARDAN_BUILD }));
    return { ok: r.events >= 3199 && errs.length === 0, detail: `${r.events} events, build ${r.build}, ${errs.length} page errors` };
  },

  async lives(pg, errs, { lives: LIVES }) {
    const r = await pg.evaluate(async (N) => {
      const mixes = [['human', 'POL-01', 'peasant'], ['human', 'POL-01', 'noble'], ['elf', 'POL-03', 'peasant'], ['dwarf', 'POL-20', 'artisan'],
        ['orc', 'POL-11', 'peasant'], ['human', 'POL-05', 'merchant'], ['human', 'POL-07', 'serf'], ['human', 'POL-02', 'royal']];
      const out = { lives: [], rawViews: [], rawLog: [] };
      for (let i = 0; i < N; i++) {
        const [race, realm, status] = mixes[i % mixes.length];
        A.newGame({ seed: 1000 + i * 7919, race, realm, status, sex: i % 2 ? 'F' : 'M' });
        let err = null;
        try {
          T.play(110, { onEvent: v => { const s = [v.title, v.text, ...v.choices.map(c => c.t)].join(' | '); if (!v.skip && T.raw.test(s)) out.rawViews.push(s.slice(0, 160)); } });
        } catch (e) { err = String(e.stack || e).slice(0, 300); }
        for (const e of A.S.log) for (const l of e.lines) { const t = Array.isArray(l) ? l[0] : l; if (typeof t === 'string' && T.raw.test(t)) out.rawLog.push(t.slice(0, 160)); }
        const p = A.P(A.S.pc);
        out.lives.push({ race, status, age: A.S.year - p.born, alive: p.alive, err });
      }
      return out;
    }, LIVES);
    const bad = r.lives.filter(l => l.err);
    return {
      ok: !bad.length && !errs.length && !r.rawViews.length && !r.rawLog.length,
      detail: `${r.lives.length} lives, ${bad.length} crashed, ${r.rawViews.length} event views and ${r.rawLog.length} log lines with unfilled {tokens}` +
        (bad.length ? '\n    ' + bad[0].err : '') + (r.rawViews.length ? '\n    e.g. ' + r.rawViews[0] : '') + (r.rawLog.length ? '\n    e.g. ' + r.rawLog[0] : ''),
    };
  },

  async saveRoundTrip(pg) {
    const r = await pg.evaluate(async () => {
      T.enter({ seed: 5, race: 'dwarf', realm: 'POL-20', status: 'artisan', sex: 'M' });
      T.play(8);
      const enc = await SAVES.encode(A.S, A.J);
      const a = JSON.stringify(A.packState ? A.packState(A.S) : A.S);
      const d = await SAVES.decode(enc.bytes);
      const b = JSON.stringify(A.packState ? A.packState(d.S) : d.S);
      return { same: a === b, kb: Math.round(enc.bytes.length / 1024) };
    });
    return { ok: r.same, detail: `round trip ${r.same ? 'exact' : 'DIFFERS'}, ${r.kb} KB gzipped after 8 years` };
  },

  async uiSmoke(pg, errs) {
    // click through the real interface like a player: new life, every tab, a person, the menu, export, the clock
    await pg.evaluate(() => { UI.screen = 'title'; UI.render(); });
    await pg.click('text=Random life');
    // (H-082: the life is waited for, not a fixed 500 ms)
    await pg.waitForFunction(() => UI.screen === 'game' && A.S && A.pc() && document.querySelector('#tabbody'), null, { timeout: 30000 }).catch(() => {});
    const seen = [];
    const tabs = await pg.$$eval('#tabs [data-a="tab"], #tabs [role="tab"]', els => els.map(e => e.getAttribute('data-v')).filter(Boolean));
    for (const t of [...new Set(tabs)]) {
      await pg.click(`#tabs [data-v="${t}"]`).catch(() => {});
      await pg.waitForTimeout(150);
      const subs = await pg.$$eval('#tabs [data-a="tab"]', els => els.map(e => e.getAttribute('data-v')));
      for (const s of subs) { await pg.click(`#tabs [data-a="tab"][data-v="${s}"]`).catch(() => {}); await pg.waitForTimeout(120); seen.push(s); }
    }
    const person = await pg.$('[data-a="ov"]');
    // a tip that a press opened takes the first Escape, not the person view (WCAG 1.4.13); since round 2 B4 nothing
    // opens on hover, so the mouse only needs to be out of the way, and the test waits for any tip to be closed
    if (person) {
      await person.click().catch(() => {}); await pg.waitForTimeout(200); await pg.mouse.move(1, 1);
      await pg.waitForFunction(() => !(UI.TT && UI.TT.stack && UI.TT.stack.length), null, { timeout: 5000 }).catch(() => {});
      await pg.keyboard.press('Escape');
      await pg.waitForFunction(() => !UI.ov, null, { timeout: 5000 }).catch(() => {});
    }
    // v2 (99992-v2-time): Play and its speeds are gone; the one control that moves time is Next month or, for a child, Next year (when
    // 99992 is not in the build, the release's Play). Press it and wait for the month to end or stop at a card.
    // D-160: one button, Next year below 12 (a random life may start in the cradle) and Next month from 12
    const step = (await pg.$('[data-a="v2Next"]')) ? '[data-a="v2Next"]' : (await pg.$('[data-a="v2Year"]')) ? '[data-a="v2Year"]' : null;
    if (step) {
      await pg.click(step);
      await pg.waitForFunction(() => !(UI.stepper && UI.stepper.run) || UI.stepper.wait, null, { timeout: 60000 }).catch(() => {});
    } else {
      await pg.click('button:has-text("Play")');
      await pg.waitForTimeout(3000);
      // pause by the control itself (its label is an icon at laptop widths), then wait for the clock to stop: on the Great
      // Continent a month's turn is one long day, and a click sent mid-turn waits for it (seconds on a slow runner)
      await pg.click('[data-a="clkPlay"]').catch(() => {});
      await pg.waitForFunction(() => !UI.clk.run, null, { timeout: 60000 }).catch(() => {});
    }
    // a scene that came up while the clock ran is a modal over the top bar, as in play: answer it first (92 tests the card)
    await pg.evaluate(() => {
      for (let i = 0; i < 10; i++) {
        const q = A.S.queue[0];
        if (!q || q.type !== 'event') break;
        if (!q.result) UI.A.evChoose(0);
        if (A.S.queue[0] === q && q.result) A.eventClose();
      }
      UI.render();
    });
    await pg.click('button:has-text("Menu")', { timeout: 60000 });
    await pg.waitForTimeout(200);
    const exp = await pg.$('button:has-text("Export"), button:has-text("Save to file"), button:has-text("Download")');
    let download = false;
    if (exp) {
      const dl = pg.waitForEvent('download', { timeout: 8000 }).then(() => true).catch(() => false);
      await exp.click();
      download = await dl;
    }
    await pg.keyboard.press('Escape');
    const st = await pg.evaluate(() => ({ screen: UI.screen, year: A.S.year, fonts: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family).filter((v, i, a) => a.indexOf(v) === i) }));
    return { ok: st.screen === 'game' && (!exp || download), detail: `${new Set(seen).size} tabs visited, export ${exp ? (download ? 'downloaded' : 'FAILED') : 'button not found'}, fonts loaded: ${st.fonts.join(', ') || 'none (offline?)'}` };
  },

  // order 97 (D-195, H-162): a merchant's ledger is his deed. A Merchant at trade's edge with only the deed wanting, after
  // a year at the head of his trade with the next post's merit earned, is proved (A.careerYear); a poor year, too little
  // merit, or another trade at the same edge is not
  async merchantLedgerProof(pg) {
    const r = await pg.evaluate(() => {
      const SK = A.SK, Eng = SK.E();
      const run = (c, perf, merit) => {
        A.newGame({ seed: 16201, race: 'human', realm: 'POL-04', status: 'merchant', sex: 'M', startAge: 30 });
        const pc = A.pc(); A.S.queue = [];
        // trade at the top step of a word from which the next asks a deed (rank C's Lv 10 under rank B), its bar full and
        // the next word's concepts grasped: nothing but the deed wanting
        let lv = 1; while (lv < SK.MAX_LV && !(SK.stepOf(lv) === SK.STEPS && SK.wordOf(lv) + 1 >= Eng.PROOF_FROM)) lv++;
        SK.set(pc, 'trade', lv, 'test');
        const s = pc.sk.trade; s.xp = Eng.cost(s.lv); s.proved = false;
        for (const cn of Eng.conceptsOf('trade', SK.wordOf(lv) + 1)) s.got[cn.id] = 30;
        const before = SK.edgeState(pc, 'trade');
        pc.job = { c, r: 2, y: 8, perf, merit, rep: 70 }; pc.happy = 80;
        let n = 0; const pf = SK.proof; SK.proof = function (p, k, why) { if (why === 'a year at the head of your trade') n++; return pf.apply(this, arguments); };
        try { A.careerYear(pc); } finally { SK.proof = pf; }
        SK.month(pc);
        return { before, perf: pc.job.perf, proofs: n, after: SK.edgeState(pc, 'trade'), lv: pc.sk.trade.lv, from: lv };
      };
      return { good: run('merchant', 100, 2000), poor: run('merchant', 0, 2000), merit: run('merchant', 100, 10), smith: run('smith', 100, 2000) };
    });
    const g = r.good;
    const ok = g.before === 'ready' && g.perf >= 80 && g.proofs === 1 && g.after !== 'ready' && r.poor.perf < 80 && r.poor.proofs === 0 &&
      r.merit.proofs === 0 && r.smith.proofs === 0;
    return { ok, detail: `merchant at Lv ${g.from} (${g.before}), performance ${g.perf}: ${g.proofs} proof, then Lv ${g.lv} (${g.after || 'past the edge'}); ` +
      `a poor year (performance ${r.poor.perf}) ${r.poor.proofs}, too little merit ${r.merit.proofs}, a smith at the same edge ${r.smith.proofs}`, data: r };
  },
};
