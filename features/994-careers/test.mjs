// Tests for features/994-careers. Each reproduces a cycle 1 finding (docs/reviews/cycle-1/lives.md) and shows it gone.
export default {
  // B1: a claimant crushed in the war for the throne kept his commission and served on, and held "Usurper" for trying
  async carCoupCrushed(pg) {
    const r = await pg.evaluate(() => {
      if (!A.CAR) return { err: 'A.CAR is missing' };
      A.newGame({ seed: 9941, lands: 'great', race: 'human', realm: 'POL-01', status: 'peasant', startAge: 30, sex: 'M' });
      const pc = A.pc(); A.enlist(pc, false); pc.mil.rank = 7; pc.fame = 60;
      const rl = A.realm(pc.realm);
      A.successionWar(rl, pc);
      const w = A.S.wars.find(x => x.claimant === pc.id);
      A.S.ach.usurper = undefined; delete A.S.ach.usurper;
      A.endWar(w, 'def', `${w.name} ends: the crown of ${A.realmShort(w.leadD)} crushes the claimant.`);
      const out = { mil: pc.mil, traitor: pc.flags.cr_traitor != null, queued: A.S.queue.some(q => q.ev === 'cr_coup_fate'), ach: !!A.S.ach.usurper };
      // the scene: three ways, two of them checks, the third the end
      const q = A.S.queue.find(q => q.ev === 'cr_coup_fate'); A.S.queue.splice(A.S.queue.indexOf(q), 1); A.S.queue.unshift(q);
      const v = A.eventView(q); out.choices = v.choices.length; out.checks = v.choices.filter(c => c.odds != null).length;
      // and the coup's half-success no longer awards the achievement before the war is won
      out.plot = !/successionWar\(r,p\),A\.ach\("usurper"\)/.test(String(A.EV.plot_throne.choices[0].fx));
      // a bargain ("the claimant kneels") comes with terms
      A.newGame({ seed: 9942, lands: 'great', race: 'human', realm: 'POL-01', status: 'peasant', startAge: 30, sex: 'M' });
      const p2 = A.pc(); A.enlist(p2, false); A.successionWar(A.realm(p2.realm), p2);
      const w2 = A.S.wars.find(x => x.claimant === p2.id);
      A.endWar(w2, 'white', `${w2.name} ends in a bargain: the claimant kneels, keeps their head, and the rebel lands return.`);
      out.terms = A.S.queue.some(q => q.ev === 'cr_coup_pardon');
      return out;
    });
    if (r.err) return { ok: false, detail: r.err };
    const ok = r.mil === null && r.traitor && r.queued && !r.ach && r.choices === 3 && r.checks === 2 && r.plot && r.terms;
    return { ok, detail: `crushed: commission ${r.mil === null ? 'gone' : 'kept'}, fate scene ${r.queued} (${r.choices} ways, ${r.checks} checks), "Usurper" ${r.ach ? 'awarded' : 'not awarded'}; plot_throne awards it only on the throne: ${r.plot}; a bargain brings terms: ${r.terms}` };
  },
  // B1: "taken by men of Merrick's cause" when Merrick was the player
  async carNotTakenByOwnCause(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 9943, lands: 'great', race: 'human', realm: 'POL-01', status: 'peasant', startAge: 30, sex: 'M' });
      const pc = A.pc(); A.enlist(pc, false); pc.mil.rank = 6;
      A.successionWar(A.realm(pc.realm), pc);
      const w = A.S.wars.find(x => x.claimant === pc.id), mine = w.leadA;
      let taken = 0;
      for (let i = 0; i < 200; i++) { pc.flags.ri_taken = null; A.S.queue = A.S.queue.filter(q => q.ev !== 'ri_taken'); if (A.RI.maybeTaken(pc, mine, 'command')) taken++; }
      let other = 0;
      for (let i = 0; i < 200; i++) { pc.flags.ri_taken = null; A.S.queue = A.S.queue.filter(q => q.ev !== 'ri_taken'); if (A.RI.maybeTaken(pc, w.leadD, 'command')) other++; }
      return { taken, other };
    });
    return { ok: r.taken === 0 && r.other > 0, detail: `200 lost battles against the player's own faction: taken ${r.taken} times; against the crown: ${r.other}` };
  },
  // I1: careers top out; a commoner of renown is knighted, the order then admits him, a fief follows, a General can be Marshal
  async carRaised(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 9944, lands: 'great', race: 'human', realm: 'POL-01', status: 'peasant', startAge: 40, sex: 'M' });
      const pc = A.pc(); A.enlist(pc, false); pc.mil.rank = 5; pc.fame = 40;
      const out = { birthBefore: A.orderReqs(pc, 'iron_wolf').find(x => /birth/i.test(x.label)).ok, knightable: A.CAR.knightable(pc) };
      for (let i = 0; i < 40 && !A.S.queue.some(q => q.ev === 'cr_knighted'); i++) { pc.car = {}; A.CAR.month(pc); }
      const q = A.S.queue.find(q => q.ev === 'cr_knighted');
      out.asked = !!q;
      if (q) { A.S.queue.splice(A.S.queue.indexOf(q), 1); A.S.queue.unshift(q); A.eventView(q); A.eventChoose(0); A.eventClose(); }
      out.rung = pc.noble ? pc.noble.rung : -1;
      out.birthAfter = A.orderReqs(pc, 'iron_wolf').find(x => /birth/i.test(x.label)).ok;
      // a fief, later
      pc.fame = 60; pc.mil.rank = 6; pc.flags.cr_knighted = A.S.year - 5; pc.born = A.S.year - 38;
      out.fiefable = A.CAR.fiefable(pc);
      // the council: rank 8 was needed for Marshal; a General of renown now qualifies
      pc.mil.rank = 7; pc.skills.command = 60; pc.fame = 50;
      out.marshal = A.seatEligible(pc, 'marshal');
      out.top = A.CAR.atTop(pc);
      out.generalMerit = GD.MIL[7].merit;
      return out;
    });
    const ok = !r.birthBefore && r.knightable && r.asked && r.rung === 2 && r.birthAfter && r.fiefable && r.marshal && r.top === 'command' && r.generalMerit === 2000;
    return { ok, detail: `a peasant captain of renown 40: knightable ${r.knightable}, asked ${r.asked}, rung ${r.rung}; the Iron Wolf's birth line ${r.birthBefore} -> ${r.birthAfter}; a fief ${r.fiefable}; Marshal for a General ${r.marshal}; above the top: ${r.top}; General's merit bar ${r.generalMerit} (1,000 before)` };
  },
  // B7: "Bandit hunt: Enemy dead 5,141. Your losses 0" for a General
  async carMissionSize(pg) {
    const r = await pg.evaluate(() => ({ bandits: A.missionSize('bandits', 7, null), banditsLow: A.missionSize('bandits', 0, null), patrolPeace: A.missionSize('patrol', 7, null), patrolWar: A.missionSize('patrol', 7, { id: 'w' }) }));
    return { ok: r.bandits <= 300 && r.banditsLow >= 10 && r.patrolPeace <= 400 && r.patrolWar === 12800, detail: `a General's bandit hunt ${r.bandits} men (12,800 before), a soldier's ${r.banditsLow}; a patrol in peace ${r.patrolPeace}, in war ${r.patrolWar}` };
  },
  // I5: a life reached Knife fighting 100 and stayed at renown 24; the PC was never a Legend
  async carLegend(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 9945, lands: 'great', race: 'human', realm: 'POL-01', status: 'peasant', startAge: 30, sex: 'M' });
      const pc = A.pc(), f0 = pc.fame || 0;
      for (const k of ['str', 'spd', 'sta', 'ins', 'wil']) { pc.st[k] = 140; if (pc.pot) pc.pot[k] = 160; }
      for (const k of ['sword', 'melee', 'shield', 'dagger', 'athletics']) pc.skills[k] = 100;
      pc.gear.weapon = 'longsword';
      const w = A.fightWorth(pc);
      pc.car = {}; A.CAR.month(pc);
      return { w, named: pc.flags.cr_legend != null, q: A.S.queue.some(q => q.ev === 'cr_legend'), fame: (pc.fame || 0) - f0 };
    });
    return { ok: r.w >= 118 && r.named && r.q && r.fame >= 15, detail: `worth ${r.w}: named a Legend ${r.named}, the challengers' scene ${r.q}, renown +${r.fame}` };
  },
};
