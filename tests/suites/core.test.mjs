// Whole-game tests that belong to no single feature.
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
    await pg.waitForTimeout(500);
    const seen = [];
    const tabs = await pg.$$eval('#tabs [data-a="tab"], #tabs [role="tab"]', els => els.map(e => e.getAttribute('data-v')).filter(Boolean));
    for (const t of [...new Set(tabs)]) {
      await pg.click(`#tabs [data-v="${t}"]`).catch(() => {});
      await pg.waitForTimeout(150);
      const subs = await pg.$$eval('#tabs [data-a="tab"]', els => els.map(e => e.getAttribute('data-v')));
      for (const s of subs) { await pg.click(`#tabs [data-a="tab"][data-v="${s}"]`).catch(() => {}); await pg.waitForTimeout(120); seen.push(s); }
    }
    const person = await pg.$('[data-a="ov"]');
    if (person) { await person.click().catch(() => {}); await pg.waitForTimeout(200); await pg.keyboard.press('Escape'); }
    await pg.click('button:has-text("Play")');
    await pg.waitForTimeout(3000);
    await pg.click('button:has-text("Pause")').catch(() => pg.click('button:has-text("Play")').catch(() => {}));
    await pg.click('button:has-text("Menu")');
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
};
