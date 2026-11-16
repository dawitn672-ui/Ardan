// Retired with the ambitions (P3, order 54, D-062): these tests lived in src/events/97-first-life-fixes/test.mjs.
// They need the page helpers of that file's DRIVE (none) and window.T, as any feature test does.
export default {
  // 3. Ambitions: chosen at coming of age, kept where C.ambition reads it, shown with a next step; the five orphaned
  //    scenes can fire again
  async lfAmbition(pg) {
    const r = await pg.evaluate(() => {
      if (!A.LF || !A.LF.AMB) return { err: 'no ambitions in this build' };
      const out = {};
      A.newGame({ seed: 9731, race: 'human', realm: 'POL-05', status: 'serf', sex: 'M', startAge: 16 });
      A.S.queue = [];
      A.LF.ambMonth(A.pc());
      const q = A.S.queue.find(x => x.ev === 'lfx_amb_young');
      out.asked = !!q;
      if (q) {
        A.S.queue = [q];
        const v = A.headReady() && A.eventView(q);
        out.offers = v ? v.choices.map(c => c.t) : [];
        const i = v ? v.choices.findIndex(c => /freedom/i.test(c.t)) : -1;
        if (i >= 0) { A.eventChoose(i); A.eventClose(); }
      }
      const pc = A.pc();
      out.amb = pc.amb && pc.amb.k;
      out.cAmbition = A.C.ambition(pc, 'freedom');
      out.card = UI.lfAmbCard(pc);
      // the five scenes the release could never show: each one's condition, for a life it was written for
      const conds = {};
      pc.coin = 70;
      for (const id of ['pa_freedom_buy', 'pa_freedom_kind_master']) conds[id] = !!(A.EV[id] && A.EV[id].cond(pc, A.C));
      // a ruler: the reign's question offers expand, a golden age, a web of alliances
      A.newGame({ seed: 9732, race: 'human', realm: 'POL-02', status: 'royal', sex: 'F', startAge: 30 });
      const k = A.pc(), r0 = Object.values(A.S.realms).find(x => x.alive && A.P(x.ruler) && A.P(x.ruler).alive && x.id === k.realm) || Object.values(A.S.realms).find(x => x.alive);
      k.ruler = r0.id; A.S.queue = [];
      A.LF.ambMonth(k);
      const q2 = A.S.queue.find(x => /^lfx_amb_/.test(x.ev));
      out.reign = q2 ? (q2.ctx || {}).when : null;
      for (const key of ['expand', 'golden', 'web']) {
        A.LF.setAmb(k, key);
        const id = { expand: 'pa_expand_petition', golden: 'pa_golden_harvest', web: 'pa_web_marriage' }[key];
        let c = false; try { c = !!A.EV[id].cond(k, A.C); } catch (e) { c = 'error ' + e.message; }
        conds[id] = c;
      }
      out.conds = conds;
      out.retired = ['pa_freedom_buy', 'pa_freedom_kind_master', 'pa_expand_petition', 'pa_golden_harvest', 'pa_web_marriage'].filter(id => A.EV_RETIRED && A.EV_RETIRED.has && A.EV_RETIRED.has(id));
      return out;
    });
    if (r.err) return { ok: false, detail: r.err };
    const fires = Object.values(r.conds).filter(x => x === true).length;
    const ok = r.asked && r.amb === 'freedom' && r.cAmbition && /Next:/.test(r.card) && r.reign === 'reign' && fires >= 4 && r.conds.pa_freedom_buy === true && !r.retired.length;
    return { ok, detail: `asked at 16: ${r.asked} (${(r.offers || []).join(' / ')}); chose ${r.amb}; C.ambition ${r.cAmbition}; card has a next step: ${/Next:/.test(r.card)}; a new ruler is asked: ${r.reign}; scenes that can fire now: ${JSON.stringify(r.conds)}; retired: ${r.retired.join(',') || 'none'}` };
  },

  // cycle 1 (lives I1, I5): a met ambition was never followed by another, and What now never pointed at the
  // Decisions tab, the orders or a scheme
  async lfAfterTheTop(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 9772, race: 'human', realm: 'POL-01', status: 'merchant', sex: 'M', startAge: 30 });
      const pc = A.pc();
      pc.amb = { k: 'wealth', y: A.S.year - 6, done: A.S.year - 2 };
      pc.flags.lfx_amb_y = A.S.year - 6; pc.flags.lfx_amb_m = A.S.year - 1;
      pc.coin = 300000; pc.fame = 45;
      A.LF.ambMonth(pc);
      const q = A.S.queue.find(x => x.ev === 'lfx_amb_top');
      let offers = [];
      if (q) { A.S.queue.splice(A.S.queue.indexOf(q), 1); A.S.queue.unshift(q); const v = A.eventView(q); offers = q.ctx.amb || []; A.eventChoose(0); A.eventClose(); }
      const took = pc.amb ? pc.amb.k : null;
      const s0 = JSON.stringify(A.S), g0 = JSON.stringify(A.rngState);
      const wn = A.whatNow(pc).map(x => x.t);
      const pure = JSON.stringify(A.S) === s0 && JSON.stringify(A.rngState) === g0;
      // a great work priced to the fortune
      const patron = A.LF.workCost(pc, 'patron'), seat = A.LF.workCost(pc, 'seat'), coin0 = pc.coin;
      const res = A.decide('lfx_patron');
      return { asked: !!q, offers, took, wn, pure, patron, seat, spent: coin0 - pc.coin, ok: res && res.ok !== false, sched: (A.S.sched || A.S.schedule || []).length };
    });
    const late = ['lord', 'legend', 'work', 'house', 'court', 'throne', 'renown', 'teacher'];
    const ok = r.asked && r.offers.length > 0 && late.includes(r.offers[0]) && !!r.took && r.wn.some(t => /afford|house|order|within reach/i.test(t)) && r.pure && r.patron === 24000 && r.seat === 80000 && r.spent === r.patron;
    return { ok, detail: `a met ambition two years on: asked again ${r.asked} (${r.offers.join(', ')}; took ${r.took}); What now: ${r.wn.join(' | ')} (pure ${r.pure}); patronage priced ${r.patron} for a fortune of 300,000, a seat ${r.seat}; spent ${r.spent}` };
  },

  // cycle 2 (lives F2, design D4): What now never named an office, a venture, a journey or the arms designer, and a
  // crown deep in debt was told "Look for love"
  async lfWhatNowSystems(pg) {
    const r = await pg.evaluate(() => {
      const out = {};
      const pure = f => { const h = JSON.stringify(A.S), g = JSON.stringify(A.rngState); const v = f(); return [v, JSON.stringify(A.S) === h && JSON.stringify(A.rngState) === g]; };
      A.newGame({ seed: 3004, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 30 });
      let pc = A.pc(); pc.skills.diplomacy = 60; pc.skills.stewardship = 60;
      [out.noble, out.pureNoble] = pure(() => A.LF.whatMore(pc).map(x => x.t));
      A.newGame({ seed: 3001, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      pc = A.pc(); out.peasant = A.LF.whatMore(pc).map(x => x.t);
      A.newGame({ seed: 3002, race: 'human', realm: 'POL-01', status: 'royal', sex: 'M', startAge: 26 });
      pc = A.pc(); A.makeRuler(pc, pc.realm, true); const R = A.realm(pc.ruler); R.debt = Math.round(R.income * 0.6);
      [out.ruler, out.pureRuler] = pure(() => A.whatNow(pc).map(x => x.t));
      return out;
    });
    const ok = r.noble.some(t => /^Seek the office/.test(t)) && r.peasant.includes('Make your mark') && /^The crown owes/.test(r.ruler[0] || '') &&
      !r.ruler.includes('Look for love') && r.pureNoble && r.pureRuler;
    return { ok, detail: `a noble of 30: ${r.noble.join(' | ')}; a peasant of 20: ${r.peasant.join(' | ')}; a crown in debt: ${r.ruler.join(' | ')}; drawing pure ${r.pureNoble && r.pureRuler}` };
  },
};
