// Phase 1 fixes from the owner's Emilio life (docs/design/emilio-1108-findings.md).
export default {
  // E1: whoever is cast out is out of the cells (the gallows' escapes exiled a prisoner but kept pc.prison)
  async pfExileFreesCell(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 6101, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 24 });
      const pc = A.pc();
      A.imprison(pc, 5, 'attempted murder');
      const before = !!pc.prison;
      A.exile(pc);
      return { before, after: pc.prison, realm: pc.realm };
    });
    return { ok: r.before && r.after == null, detail: `in prison before: ${r.before}; after exile: ${JSON.stringify(r.after)}; now in ${r.realm}` };
  },
  // E2: 4,000 days in a cell at brutal intensity with a training plan writes no training injury
  async pfNoTrainingHurtInCell(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 6102, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 24 });
      const pc = A.pc(), P = A.plan(pc);
      P.train = 'sword'; P.intensity = 'brutal';
      A.imprison(pc, 5, 'theft');
      const hurt = /push too hard in training/;
      const count = () => A.S.log.reduce((n, e) => n + e.lines.filter(l => hurt.test(l[0])).length, 0);
      const n0 = count();
      for (let d = 0; d < 4000; d++) { pc.prison = pc.prison || { until: A.S.year + 5, why: 'theft', since: A.S.year }; A.planDay(pc); }
      return { n: count() - n0, inj: (GD.INTENSITY.brutal || {}).inj };
    });
    return { ok: r.inj > 0 && r.n === 0, detail: `brutal intensity injury chance a day ${r.inj}; injuries logged in 4,000 days in a cell (about ten expected without the rule): ${r.n}` };
  },
  // E3: the result line of a choice comes before what its effects log
  async pfResultBeforeEffects(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 6103, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 30 });
      A.defEvents([{ id: 'pf_order_probe', title: 'Probe', text: 'A probe.', choices: [
        { t: 'Do it', r: 'PF RESULT LINE.', fx: () => { A.log('PF EFFECT LINE.'); } },
        { t: 'Do not', r: 'No.', fx: {} }] }]);
      A.S.queue.unshift({ type: 'event', ev: 'pf_order_probe', ctx: {} });
      A.eventChoose(0);
      const lines = A.S.log[A.S.log.length - 1].lines.map(l => l[0]);
      return { res: lines.indexOf('PF RESULT LINE.'), fx: lines.indexOf('PF EFFECT LINE.') };
    });
    return { ok: r.res >= 0 && r.fx > r.res, detail: `result line at ${r.res}, effect line at ${r.fx}` };
  },
  // E9: a former superior is not your master once you have no post (struck from the rolls, in a cell, cast out)
  async pfNoSuperiorWithoutPost(pg) {
    const r = await pg.evaluate(() => {
      if (!A.ADV || !A.ADV.candidates) return { skip: 'no advisors feature' };
      T.enter({ seed: 6104, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 24 });
      const pc = A.pc();
      const t = Object.values(A.S.people).find(p => p && p.alive && p.id !== pc.id && A.age(p) > 30 && !(pc.rel || {})[p.id] && p.home === pc.home && (!A.X3 || !A.X3.reaches || A.X3.reaches(pc, p)));
      if (!t) return { skip: 'no grown neighbour within reach in world 6104' };
      pc.rel[t.id] = { type: 'superior', op: 40, since: A.S.year, seen: A.S.year };
      (A.P(t.id).rel = A.P(t.id).rel || {})[pc.id] = { type: 'acquaint', op: 40 };
      pc.mil = null; pc.job = null;
      const c = A.ADV.candidates(pc).find(x => x.id === t.id);
      return { sup: A.superior(pc) ? A.superior(pc).id : null, as: c ? c.role : null };
    });
    if (r.skip) return { ok: true, skip: r.skip };
    return { ok: r.sup == null && r.as !== 'master', detail: `current superior: ${r.sup}; the old superior counsels as: ${r.as || 'nothing'}` };
  },
  // E5: one attempt on a life a year; none from a cell; a sovereign's life is treason; the survivor stays on guard
  async pfMurderHasCosts(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 6105, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 30 });
      const pc = A.pc(), ch = A.chance, puns = [], p0 = A.punish;
      const victim = Object.values(A.S.people).find(p => p && p.alive && p.id !== pc.id && A.age(p) > 20 && !p.ruler && p.status !== 'royal');
      const realm = A.realm(pc.realm), king = realm && A.P(realm.ruler);
      A.punish = (who, crime) => { puns.push(crime); };
      const out = {};
      try {
        A.chance = () => false;                                  // every attempt fails, nobody is caught...
        A.S.time = 30; out.first = A.interact(victim.id, 'murder').ok !== false;
        A.S.time = 30; out.second = A.interact(victim.id, 'murder').ok !== false;
        out.wary = !!(victim.wary && victim.wary[pc.id] != null);
        A.chance = p => p === 0.5;                               // ...then the attempt fails and the target knows (the even chance)
        if (king && king.id !== pc.id) { A.S.time = 30; out.kingRes = A.interact(king.id, 'murder').msg; }
        A.chance = () => false;
        A.imprison(pc, 3, 'theft');
        const free = Object.values(A.S.people).find(p => p && p.alive && p.id !== pc.id && p.id !== victim.id && !p.prison && A.age(p) > 20);
        A.S.time = 30; out.fromCell = A.interact(free.id, 'murder').ok !== false;
      } finally { A.chance = ch; A.punish = p0; }
      out.puns = puns; out.king = !!king;
      return out;
    });
    // an attempt on the crown is 999993-crown-crimes' (an inquest names you later); the release's own path calls it treason
    const ok = r.first && !r.second && r.wary && !r.fromCell;
    return { ok, detail: `first attempt ${r.first}, second the same year ${r.second}, target on guard ${r.wary}, from a cell ${r.fromCell}; punishments ${r.puns.join(', ') || 'none'} (a king to try: ${r.king}: ${r.kingRes || ''})` };
  },
  // E8: a treatise asks an Expert and a grown writer; a 23-year-old at Advanced cannot write one
  async pfTreatiseAsksMastery(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 6106, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 23 });
      const pc = A.pc(); pc.literate = true; pc.flags.author = null;
      const best = A.bestSkillOf(pc), lv = A.SK ? A.SK.lvOfValue(50) : 0;
      if (A.SK && A.SK.set) A.SK.set(pc, best.k || 'sword', lv, 'test'); else pc.skills[best.k || 'sword'] = 50;
      const young = A.DEC.treatise.reqs(pc);
      return { age: A.age(pc), v: A.bestSkillOf(pc).v, open: young.every(x => x[1]), why: young.filter(x => !x[1]).map(x => x[0]) };
    });
    return { ok: !r.open, detail: `age ${r.age}, best skill value ${r.v}: ${r.open ? 'may write a treatise' : 'may not: ' + r.why.join('; ')}` };
  },
  // E10: a theocracy's throne asks a churchman of years (36 for a human), not a young priest
  async pfSacredThroneAsksYears(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 6107, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 24 });
      const r = Object.values(A.S.realms).find(x => x && x.alive && x.gov === 'theocracy' && x.race === 'human');
      if (!r) return { skip: 'no human theocracy in world 6107' };
      const p = A.pc(); p.job = { c: 'clergy', r: 4, y: A.S.year, perf: 60 };
      const young = A.electable(p, r);
      p.born = A.S.year - 40;
      const old = A.electable(p, r);
      return { young, old, realm: r.short };
    });
    if (r.skip) return { ok: true, skip: r.skip };
    return { ok: !r.young && r.old, detail: `${r.realm}: a senior priest of 24 electable ${r.young}; of 40 ${r.old}` };
  },
  // E5b: an outlaw with an unpaid blood-price and a man who survived his knife is hunted within two years; a man with
  // nothing against him is not
  async pfOutlawHunted(pg) {
    const r = await pg.evaluate(() => {
      if (!A.PF || !A.PF.huntMonth) return { skip: 'no hunt' };
      T.enter({ seed: 6108, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 30 });
      const pc = A.pc();
      const t = Object.values(A.S.people).find(p => p && p.alive && p.id !== pc.id && p.realm === pc.realm && A.age(p) > 20);
      A.link(pc, t, 'enemy', -60, 'enemy'); (t.wary = t.wary || {})[pc.id] = A.S.year;
      const run = () => { let n = 0; for (let m = 0; m < 24; m++) { A.S.queue = []; const rec = A.PF.huntMonth(pc); if (A.S.queue.some(q => /bounty|hunted/.test(q.ev))) { n++; delete pc.flags.pf_hunted; } } return n; };
      const clean = run();
      pc.flags.outlaw = A.S.year; pc.flags.outlawDebt = 300;
      const hunted = run();
      const rec = A.WHY.decide(t.id, 'hunt', A.PF.huntOptions(pc, A.PF.hunter(pc)), { log: false });
      return { clean, hunted, why: A.WHY.tell ? A.WHY.tell(rec, true) : rec.chose };
    });
    if (r.skip) return { ok: true, skip: r.skip };
    return { ok: r.clean === 0 && r.hunted >= 1, detail: `not an outlaw: ${r.clean} hunts in 24 months; an outlaw with a price and a grudge: ${r.hunted}; ${r.why}` };
  },
  // A0.1 stopgap (D-163): three breakthroughs in a life, two years apart, the ceiling never past 100, and a spar is none
  async pfBreakthroughBudget(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 6109, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 20 });
      const pc = A.pc(), y0 = A.S.year, got = [];
      for (let i = 0; i < 12; i++) { A.S.year = y0 + i; got.push(!!A.breakthrough(pc, 30, {})); }
      A.S.year = y0;
      const maxPot = Math.max(...['str', 'spd', 'ins', 'sta'].map(s => pc.pot[s]));
      return { got: got.map(x => (x ? 1 : 0)).join(''), n: got.filter(Boolean).length, maxPot, btN: pc.btN };
    });
    return { ok: r.n === 3 && r.maxPot <= 100 && /^1010100+$/.test(r.got), detail: `twelve tries a year apart: ${r.got} (${r.n} breakthroughs); the highest ceiling after: ${r.maxPot}` };
  },
  // A0.2 stopgap (D-164): one plot in five years whatever its end, odds no better than 40 in 100, told in words
  async pfThronePlotOnce(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 6110, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 30 });
      const pc = A.pc(); pc.fame = 100; if (pc.noble) pc.noble.rung = 6; else pc.noble = { rung: 6, realm: pc.realm };
      A.S.queue = [];
      const a = A.plotThrone(pc), odds = (A.S.queue.find(q => q.ev === 'plot_throne') || { ctx: {} }).ctx.odds;
      A.S.queue = [];
      const b = A.plotThrone(pc);
      A.S.year += 5; const c = A.plotThrone(pc); A.S.year -= 5;
      const q = A.S.queue.find(x => x.ev === 'plot_throne'), v = q ? A.eventView(q) : null;
      const shown = v && UI.queueModal ? (VS => VS ? VS.deNum(String(v.text)) : String(v.text))(A.V2S) : '';
      return { a: a.ok, b: b.ok, c: c.ok, odds, digits: /\d+ in a hundred/.test(shown), shown: shown.slice(-90) };
    });
    return { ok: r.a && !r.b && r.c && r.odds <= 40 && !r.digits, detail: `first plot ${r.a}, again that year ${r.b}, five years on ${r.c}; odds ${r.odds} in 100 at most 40; shown: "${r.shown}"` };
  },
};
