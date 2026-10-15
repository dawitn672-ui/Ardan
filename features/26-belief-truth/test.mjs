// Belief versus truth: what you know depends on how you came by it, and far news can be wrong until corrected.
export default {
  async btBestiary(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 41, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 20 });
      const pc = A.pc(); UI.tab = 'codex'; UI.codex = 'beasts';
      const lv = LORE.creatures.map(c => A.BT.level(pc, c.id));
      const rng0 = JSON.stringify(A.S.rng), h0 = T.hash(A.S);
      UI.render(); const html = document.getElementById('app').textContent;
      const pure = JSON.stringify(A.S.rng) === rng0 && T.hash(A.S) === h0;
      const heard = lv.filter(l => l === 1).length, none = lv.filter(l => l === 0).length;
      // a creature you have only heard of shows its belief and not its truth
      const c = LORE.creatures.find(x => A.BT.level(pc, x.id) === 1 && x.truth && x.truth.length > 20);
      const showsBelief = c ? html.includes(c.belief) : false, hidesTruth = c ? !html.includes(c.truth) : false;
      const unheard = LORE.creatures.find(x => A.BT.level(pc, x.id) === 0);
      return { heard, none, pure, showsBelief, hidesTruth, hidesUnheard: unheard ? !html.includes(unheard.belief) : true, counts: /You have heard tell of \d+ of the 64/.test(html) };
    });
    return { ok: r.pure && r.heard >= 5 && r.none >= 10 && r.showsBelief && r.hidesTruth && r.hidesUnheard && r.counts,
      detail: `heard of ${r.heard}, never heard of ${r.none}; belief shown ${r.showsBelief}, truth hidden ${r.hidesTruth}, unknown hidden ${r.hidesUnheard}; render pure ${r.pure}` };
  },

  async btLearnByFight(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 42, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 30 });
      const pc = A.pc(), cid = Object.keys(A.BEASTS).find(id => A.beastTier(id) === 'animal') || Object.keys(A.BEASTS)[0];
      const before = A.BT.level(pc, cid);
      // a fight: we do not care who wins, only that you live to know more
      pc.health = A.maxHealth(pc);
      A.S.queue = []; A.startDuel(pc, { beastId: cid, mod: 0.3 }, { title: 'A test hunt', forceSolo: true });
      const q = A.S.queue.find(x => x.type === 'duel'); A.S.queue = [q]; A.duelAuto(q.d); const res = q.d.result; A.duelClose();
      const after = A.BT.level(pc, cid);
      UI.screen = 'game'; UI.tab = 'codex'; UI.codex = 'beasts'; UI.render();
      const c = LORE.creatures.find(x => x.id === cid), html = document.getElementById('app').textContent;
      const logged = JSON.stringify(A.S.log.slice(-2)).includes('Codex: Bestiary');
      return { before, after, res, alive: pc.alive, shows: after >= 3 ? html.includes(c.truth) : html.includes('What you saw'), logged };
    });
    return { ok: !r.alive || (r.after >= 2 && r.after > r.before - 0 && r.shows && r.logged && (r.res !== 'win' || r.after === 3)),
      detail: `level ${r.before} -> ${r.after} after a fight (${r.res}); page shows it ${r.shows}; logged ${r.logged}` };
  },

  async btStudyAndTales(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 43, race: 'human', realm: 'POL-03', status: 'artisan', sex: 'F', startAge: 20 });
      const pc = A.pc(); pc.literate = true;
      const k0 = LORE.creatures.filter(c => A.BT.level(pc, c.id) === 3).length;
      for (let i = 0; i < 40; i++) A.ACT.study(pc, null, 1);
      const k1 = LORE.creatures.filter(c => A.BT.level(pc, c.id) === 3).length;
      const h0 = LORE.creatures.filter(c => A.BT.level(pc, c.id) >= 1).length;
      T.play(12);
      const h1 = LORE.creatures.filter(c => A.BT.level(pc, c.id) >= 1).length;
      return { k0, k1, h0, h1 };
    });
    return { ok: r.k1 >= r.k0 + 5 && r.h1 > r.h0, detail: `known by study ${r.k0} -> ${r.k1} in 40 sessions; heard of ${r.h0} -> ${r.h1} over 12 years of tales` };
  },

  async btSecrets(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 44, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 30 });
      const pc = A.pc(), s1 = LORE.secrets[0], s2 = LORE.secrets[1];
      const learned = A.BT.learnSecret(pc, 1), again = A.BT.learnSecret(pc, 1);
      UI.tab = 'codex'; UI.codex = 'secrets'; UI.render();
      const html = document.getElementById('app').textContent;
      return { learned, again, flag: pc.flags['rl_k_' + s2.id] != null, rl: pc.flags.rl_secret, truthShown: html.includes(s2.truth), otherHidden: !html.includes(s1.truth), pubShown: html.includes(s1.pub), count: html.includes('truth behind 1 of the') };
    });
    return { ok: r.learned && !r.again && r.flag && r.rl === 2 && r.truthShown && r.otherHidden && r.pubShown && r.count, detail: JSON.stringify(r) };
  },

  async btRumors(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 45, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      const far = Object.values(A.S.realms).filter(x => x.alive && x.id !== 'POL-01' && !A.neighbors('POL-01').includes(x.id));
      const nearR = A.realm(A.neighbors('POL-01')[0]);
      let distorted = 0, n = 0, nearBad = 0;
      for (let i = 0; i < 40; i++) {
        const R = far[i % far.length], t = `Battle of Testmere ${i}: ${R.short} hold after 2 days. ${A.fmt(1000 + i * 731)} fall.`;
        A.news(t, 'battle'); const e = A.S.news[0]; n++;
        if (e.truth === t && e.t !== t) distorted++;
        const t2 = `Battle of Nearby ${i}: ${nearR.short} hold after 2 days. ${A.fmt(1200 + i * 97)} fall.`;
        A.news(t2, 'battle'); if (A.S.news[0].t !== t2) nearBad++;
      }
      // a rumor's counts run high, never low
      const high = A.S.news.filter(e => e.truth).every(e => { const a = +(e.t.match(/some ([\d,]+)/) || [0, '0'])[1].replace(/,/g, ''), b = +(e.truth.match(/([\d,]+) fall/) || [0, '0'])[1].replace(/,/g, ''); return a > b; });
      T.play(1);
      const fixed = A.S.news.filter(e => e.truth && e.fixed).length + (A.S.rumors || []).length * 0, corrections = A.S.news.filter(e => /^A truer account reaches you/.test(e.t) && /Testmere/.test(e.t)).length, pending = (A.S.rumors || []).filter(x => /Testmere/.test(x.truth)).length;
      const note = A.BT.newsNote(A.S.news.find(e => e.truth && e.fixed) || {});
      return { n, distorted, nearBad, high, fixed, corrections, note, pending };
    });
    return { ok: r.distorted >= 8 && r.distorted <= 30 && r.nearBad === 0 && r.high && r.corrections === r.distorted && r.pending === 0 && /ran high/.test(r.note),
      detail: `${r.distorted} of ${r.n} far reports inflated, ${r.nearBad} near ones; all ran high ${r.high}; every one corrected within a year (${r.corrections} correction notes, ${r.pending} pending, ${r.fixed} original lines still listed and marked)` };
  },

  async btTaleAsTold(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 46, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 30 });
      const pc = A.pc(); pc.fame = 60; pc.deeds.push({ y: A.S.year, t: 'Won the Battle of Ashford against 4,000' });
      A.log('You ride to war.', 'war');
      const life = A.chronicleBook().find(l => l.who === pc.id);
      UI.tab = 'book'; UI.render(); const html = document.getElementById('app').textContent;
      const tale = life && life.tales && life.tales[0];
      return { tale, shown: !!tale && html.includes('As the tale is told') && html.includes(tale), text: A.chronicleText().includes('AS THE TALE IS TOLD'), grew: !!tale && !tale.includes('4,000') };
    });
    return { ok: r.shown && r.text && r.grew, detail: `"${r.tale}"; on the page ${r.shown}; in the export ${r.text}` };
  },

  async btHeirInherits(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 47, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 40 });
      const pc = A.pc(), cid = LORE.creatures[10].id;
      A.BT.learn(pc, cid, 3); A.BT.learnSecret(pc, 3);
      T.play(1);   // the month hook notes who the player is
      // a child takes over
      const heir = Object.values(A.S.people).find(p => p.alive && p.id !== pc.id && p.realm === pc.realm && A.age(p) >= 16);
      A.S.pc = heir.id; T.play(1);
      return { known: A.BT.level(heir, cid), secret: A.BT.secretKnown(heir, LORE.secrets[3].id) };
    });
    return { ok: r.known === 3 && r.secret, detail: `heir knows the beast at level ${r.known}, the secret ${r.secret}` };
  },

  async btRegistered(pg) {
    const r = await pg.evaluate(() => !!(A.SIGNATURE && A.SIGNATURE.beliefTruth));
    return { ok: r, detail: `A.SIGNATURE.beliefTruth ${r}` };
  },
};
