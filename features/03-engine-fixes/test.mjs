// Browser tests for engine fixes. Each test gets (page, pageErrors, {browser, file}).
export default {
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
