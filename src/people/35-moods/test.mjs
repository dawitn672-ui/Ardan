// Needs and moods: needs run down, living meets them, a low need sets a mood with its cause, moods start scenes and
// move happiness, and the Life tab shows it all without changing anything.
export default {
  async moodsRunDownAndAreMet(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 351, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'F', startAge: 25 });
      const pc = A.pc(), M = A.MOODS;
      // a friendless artisan on a brutal training plan: rest and company settle low
      pc.needs = { rest: 80, company: 80, purpose: 80, comfort: 60 };
      for (const id of Object.keys(pc.rel)) pc.rel[id].op = 0;
      if (A.plan) { const P = A.plan(pc); P.intensity = 'brutal'; }
      for (let i = 0; i < 6; i++) A.onMonth.forEach(f => { try { f(pc); } catch (e) {} });
      const after6 = Object.assign({}, pc.needs);
      A.S.time = 20;
      const c0 = pc.needs.company; A.doActivity('tavern'); const c1 = pc.needs.company;
      const r0 = pc.needs.rest; A.doActivity('rest'); const r1 = pc.needs.rest;
      A.applyFx(pc, { need: { purpose: 15 } }, {}); const p1 = pc.needs.purpose;
      return { after6, tavern: c1 - c0, rest: r1 - r0, fxPurpose: p1 - after6.purpose };
    });
    const ok = r.after6.company < 60 && r.after6.rest < 50 && r.tavern > 10 && r.rest > 10 && r.fxPurpose >= 14;
    return { ok, detail: `after six months, friendless and on a brutal plan, ${JSON.stringify(Object.fromEntries(Object.entries(r.after6).map(([k, v]) => [k, Math.round(v)])))}; a tavern +${Math.round(r.tavern)} company, a rest +${Math.round(r.rest)} rest, fx.need +${Math.round(r.fxPurpose)} purpose` };
  },

  async moodsSetAndStartScenes(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 352, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'M', startAge: 25 });
      const pc = A.pc();
      pc.needs = { rest: 70, company: 12, purpose: 70, comfort: 70 };
      const m = A.MOODS.mood(pc);
      A.onMonth.forEach(f => { try { f(pc); } catch (e) {} });
      const logged = JSON.stringify(A.S.log.slice(-2)).includes('Lonely:');
      const lonely = Object.values(A.EV).filter(e => /^md_lonely/.test(e.id) && e.cond(pc, A.C)).map(e => e.id);
      const weary = Object.values(A.EV).filter(e => /^md_weary/.test(e.id) && e.cond(pc, A.C)).length;
      // play one: it meets the need
      A.S.queue = [{ type: 'event', ev: 'md_lonely_neighbour', ctx: {} }];
      const c0 = pc.needs.company; A.eventView(A.S.queue[0]); A.eventChoose(0); A.eventClose();
      return { mood: m && m.name, why: m && m.why, logged, lonely, weary, met: pc.needs.company - c0 };
    });
    return { ok: r.mood === 'Lonely' && r.logged && r.lonely.length >= 2 && r.weary === 0 && r.met >= 25,
      detail: `${r.mood}: ${r.why}; logged ${r.logged}; lonely scenes eligible ${r.lonely.join(', ')}; weary ones ${r.weary}; the neighbour's supper +${Math.round(r.met)} company` };
  },

  async moodsMoveHappiness(pg) {
    const r = await pg.evaluate(() => {
      const year = needs => {
        A.newGame({ seed: 353, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'F', startAge: 30 });
        const pc = A.pc(); pc.happy = 50;
        for (let i = 0; i < 12; i++) { pc.needs = Object.assign({}, needs); A.onMonth.forEach(f => { try { f(pc); } catch (e) {} }); }
        return Math.round(pc.happy);
      };
      return { neglected: year({ rest: 15, company: 15, purpose: 15, comfort: 15 }), tended: year({ rest: 90, company: 90, purpose: 90, comfort: 90 }) };
    });
    return { ok: r.tended - r.neglected >= 15, detail: `happiness after a year: neglected ${r.neglected}, well tended ${r.tended}` };
  },

  async moodsCard(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 354, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'M', startAge: 25 });
      const pc = A.pc(); pc.needs = { rest: 20, company: 70, purpose: 70, comfort: 70 };
      const rng0 = JSON.stringify(A.S.rng), h0 = T.hash(A.S);
      UI.tab = 'life'; UI.render(); const txt = document.getElementById('app').textContent;
      return { shown: txt.includes('How you are') && txt.includes('Weary') && txt.includes('Company'), pure: JSON.stringify(A.S.rng) === rng0 && T.hash(A.S) === h0 };
    });
    return { ok: r.shown && r.pure, detail: `card shown ${r.shown}; render pure ${r.pure}` };
  },

  async moodsInLives(pg) {
    // across real lives, moods come and go rather than sticking
    const r = await pg.evaluate(() => {
      const seen = {}; let months = 0, inMood = 0;
      for (const seed of [355, 356]) {
        A.newGame({ seed, race: 'human', realm: 'POL-01', status: ['peasant', 'artisan'][seed % 2], sex: 'M', startAge: 18 });
        A.onMonth.push(pc => { months++; const m = A.MOODS.mood(pc); if (m) { seen[m.name] = (seen[m.name] || 0) + 1; if (m.k !== 'content') inMood++; } });
        T.play(10);
        A.onMonth.pop();
      }
      return { seen, share: Math.round(100 * inMood / Math.max(1, months)) };
    });
    const kinds = Object.keys(r.seen).length;
    // moods are a signal, not weather: they should come and go, most months none
    return { ok: kinds >= 1 && r.share >= 3 && r.share <= 60, detail: `moods seen in 20 years of two lives: ${JSON.stringify(r.seen)}; in a low mood ${r.share}% of months` };
  },
};
