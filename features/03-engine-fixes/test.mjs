// Browser tests for engine fixes. Each test gets (page, pageErrors, {browser, file}).
export default {
  async revoltFounds(pg) {
    // world review cycle 2, B2: a rebel realm whose war is over becomes a realm of its own
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 4402, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      A.S.queue.length = 0;
      const par = A.realm('POL-05'), p = A.realmProvs('POL-05').find(x => x.id !== par.capitalProv);
      const nr = A.createRealm({ name: 'Test League', short: 'Testers', title: 'Lord', race: 'human', cult: par.cult, faith: par.faith, color: '#888888', army: 2000, levy: 500, armyQ: 1, income: 5000, stability: 50, legit: 30, treasury: 2000, comp: par.comp });
      nr.isRebel = true; nr.parent = par.id; p.owner = nr.id; nr.capitalProv = p.id; nr.capital = p.name; A.updateRealmPops();
      A.startWar(nr.id, par.id, 'The Test Revolt', 'liberty', { noAllies: true });
      const w = A.S.wars.find(x => x.leadA === nr.id), mid = nr.isRebel;
      A.endWar(w, 'white', 'The Test Revolt ends.');
      return { mid, after: nr.isRebel, isNew: !!nr.isNew, legit: nr.legit, from: nr.foundedFrom, truce: (nr.truce || {})[par.id] > A.S.year, stats: A.EF.stats };
    });
    const ok = r.mid === true && r.after === false && r.isNew && r.legit >= 45 && r.from === 'POL-05' && r.truce;
    return { ok, detail: JSON.stringify(r) };
  },

  async engineRules(pg) {
    // small rule checks for fixed engine bugs
    const r = await pg.evaluate(() => {
      const out = {};
      A.newGame({ seed: 8, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M' });
      // opposite traits never inherited together
      let both = 0;
      const pa = { traits: ['brave', 'cruel', 'honest'] }, pb = { traits: ['craven', 'kind', 'deceitful'] };
      for (let i = 0; i < 4000; i++) { const t = A.randomTraits([pa, pb]); if (t.some(x => GD.TRAITS[x] && t.includes(GD.TRAITS[x].opp))) both++; }
      out.oppositeTraits = both;
      // the automatic training plan follows the life; a player's choice sticks
      const pc = A.pc(), P = A.plan(pc);
      pc.born = A.S.year - 8; P.train = null; P.trainAuto = undefined; A.defaultPlanIfAuto(pc); const kid = P.train;
      pc.born = A.S.year - 20; pc.mil = { troop: Object.keys(GD.TROOP_SKILL)[0], rank: 0, squad: [] }; A.defaultPlanIfAuto(pc); const soldier = P.train;
      A.setPlan('train', 'learning'); A.defaultPlanIfAuto(pc); const chosen = P.train;
      pc.mil = null;
      out.plan = [kid, soldier, chosen];
      // a newborn noble cannot work the court
      A.newGame({ seed: 12, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 0 });
      A.S.time = 10; const t0 = A.S.time; const res = A.nobleAction('court');
      out.babyCourt = !!(res && res.ok) || A.S.time !== t0;
      return out;
    });
    const planOk = r.plan[0] === 'athletics' && r.plan[1] !== 'athletics' && r.plan[2] === 'learning';
    return { ok: r.oppositeTraits === 0 && planOk && !r.babyCourt, detail: `children with opposite traits: ${r.oppositeTraits}/4000; plan kid→soldier→player pick: ${r.plan.join(' → ')}; newborn can attend court: ${r.babyCourt}` };
  },
  async eventTextGuard(pg) {
    // an event whose text throws is dropped, not a frozen screen
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 14, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 25 });
      const pc = A.pc(), keep = pc.realm;
      pc.realm = 'POL-NONE';   // a realm that is not there
      let threw = null, skip = null;
      try { skip = A.eventView({ type: 'event', ev: 'pl_royal_wedding_guest' }).skip; } catch (e) { threw = String(e); }
      pc.realm = keep;
      return { threw, skip };
    });
    return { ok: !r.threw && r.skip === true, detail: r.threw ? `eventView threw: ${r.threw}` : `a text that throws drops the event (skip ${r.skip})` };
  },
  async deathNamesTheHurt(pg) {
    // a death right after a named hurt is put down to that hurt, not to a natural cause (ENG-DEATH-CAUSE)
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 21, race: 'human', realm: 'POL-03', status: 'peasant', sex: 'M', startAge: 17 });
      const pc = A.pc(), today = A.absDay();
      A.advance(3); while (A.headReady()) A.skipPrompt();
      const ticked = pc._hTick === pc.health;
      // the cause mortalCheck settles on, from its death or from its near-death line
      const causeOf = set => {
        Object.assign(pc, { alive: true, health: 0, _lhAnon: 0 }, set);
        let got = null; const pd = A.pcDeath, lg = A.log;
        A.pcDeath = c => { got = c; return true; };
        A.log = (t, ...a) => { const m = /should have died of (.*?)\. You did not/.exec(t); if (m) got = m[1]; return lg.call(A, t, ...a); };
        try { A.mortalCheck(pc, pc.lastHurt); } finally { A.pcDeath = pd; A.log = lg; }
        pc.alive = true; pc.health = 60;
        return got;
      };
      const old = today - 200;
      return {
        ticked,
        fresh: causeOf({ lastHurt: 'the Hell Boar', _lh: 'lung fever', _lhDay: old, _hTick: 80 }),
        again: causeOf({ lastHurt: 'the Hell Boar', _lh: 'the Hell Boar', _lhDay: old, _hTick: 80 }),
        stale: causeOf({ lastHurt: 'a wound gone bad', _lh: 'a wound gone bad', _lhDay: old, _hTick: 0 }),
        // the nameless case is settled by A.naturalCause, a draw that can itself land on "lung fever" (1 in 5 for a
        // teen, 1 in 8 for an adult): one draw tipped over when 9996-polity shifted the dice (seed 21: "lung fever").
        // So it is drawn 40 times: the old fever must not be the cause every time, and the first draw is shown.
        nameless: (() => { const out = []; for (let i = 0; i < 40; i++) { Object.assign(pc, { lastHurt: 'lung fever', _lh: 'lung fever', _lhDay: old, _hTick: 80, _lhAnon: 0, health: 60 });
          A.applyFx(pc, { health: -200 }, {}); out.push(causeOf({ _lhAnon: pc._lhAnon })); } return out; })(),
      };
    });
    const same = r.nameless.filter(c => c === 'lung fever').length;
    r.nameless = `${r.nameless.find(c => c !== 'lung fever') || r.nameless[0]} (the old fever ${same} of 40 draws, as a natural cause can draw it)`;
    const ok = r.ticked && r.fresh === 'the Hell Boar' && r.again === 'the Hell Boar' && r.stale && r.stale !== 'a wound gone bad' &&
      same < 20;
    return { ok, detail: `the daily tick notes health: ${r.ticked}; gored today after an old fever: "${r.fresh}"; gored again by the same beast: "${r.again}"; ` +
      `health long gone from an old wound: "${r.stale}"; an event's nameless wound after an old fever: "${r.nameless}"` };
  },
  async coinStaysANumber(pg) {
    // an effect that computes NaN does not take the purse with it
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 15, race: 'human', realm: 'POL-01', status: 'merchant', sex: 'M', startAge: 30 });
      const pc = A.pc(), c0 = pc.coin;
      A.applyFx(pc, { coin: Math.round(undefined * 0.9) }, {});
      A.applyFx(pc, { coin: 5 }, {});
      return { c0, c1: pc.coin };
    });
    return { ok: Number.isFinite(r.c1) && r.c1 === r.c0 + 5, detail: `purse ${r.c0} → ${r.c1} after a NaN effect and a 5-sun one` };
  },
  async parentTitles(pg) {
    // a father is never "a lady of the house", a mother never "a lord"
    const r = await pg.evaluate(() => {
      let bad = 0, n = 0;
      for (let s = 1; s <= 60; s++) {
        A.newGame({ seed: 300 + s, race: 'human', realm: 'POL-01', status: 'noble', sex: s % 2 ? 'M' : 'F' });
        for (const id of A.pc().parents) { const q = A.P(id); if (!q) continue; n++; if ((q.sex === 'M' && q.occ === 'a lady of the house') || (q.sex === 'F' && q.occ === 'a lord')) bad++; }
      }
      return { bad, n };
    });
    return { ok: r.bad === 0 && r.n > 0, detail: `${r.bad} of ${r.n} noble parents with a title of the wrong sex` };
  },
};
