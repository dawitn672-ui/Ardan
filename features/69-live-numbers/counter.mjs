// A copy of bench/dead-numbers.mjs's in-page counter (the bench is not a module that exports it), so the feature's
// tests count outcomes exactly as the bench does. Keep in step with the bench; nothing here changes how it counts.
export const COUNTER = () => {
  const DN = window.DN = { on: false, depth: 0, mute: 0, reads: null, perMonth: null, life: null };
  const pcOf = p => p && A.S && p.id === A.S.pc;
  const canon = k => (A.BM && A.BM.MERGE && A.BM.MERGE[k]) || k;   // a merged skill is its family's number
  const note = k => { if (DN.on && DN.depth > 0 && !DN.mute && DN.reads) DN.reads.add(canon(k)); };
  const skill = A.skill; A.skill = function (p, k) { if (pcOf(p)) note(k); return skill.apply(this, arguments); };
  const stat = A.stat; A.stat = function (p, s) { if (pcOf(p)) note(s); return stat.apply(this, arguments); };
  // a deciding function: reads inside it (and inside anything it calls) count once for this call
  const scope = (name, per) => {
    const f = A[name]; if (typeof f !== 'function') return;
    const w = function () {
      if (!DN.on || DN.depth > 0) { DN.depth += DN.depth > 0 ? 1 : 0; try { return f.apply(this, arguments); } finally { if (DN.depth > 0) DN.depth--; } }
      DN.depth = 1; DN.reads = new Set();
      try { return f.apply(this, arguments); }
      finally {
        DN.depth = 0;
        const m = A.S ? A.S.year * 12 + Math.floor(((A.S.warClock || 0) % 365) / 30.42) : 0;
        for (const k of DN.reads) {
          if (per === 'month') { const key = name + ':' + k; if (DN.perMonth[key] === m) continue; DN.perMonth[key] = m; }
          DN.life.engine[k] = (DN.life.engine[k] || 0) + 1;
          (DN.life.by[k] = DN.life.by[k] || {})[name] = (DN.life.by[k][name] || 0) + 1;
        }
        DN.reads = null;
      }
    };
    for (const p of Object.keys(f)) w[p] = f[p];
    A[name] = w;
  };
  // left out: scans over every skill, display helpers, learning speed
  const mute = name => { const f = A[name]; if (typeof f !== 'function') return; const w = function () { DN.mute++; try { return f.apply(this, arguments); } finally { DN.mute--; } }; for (const p of Object.keys(f)) w[p] = f[p]; A[name] = w; };
  for (const n of ['perkSum', 'perkOf', 'perksOf', 'whatNow', 'defaultPlan', 'defaultPlanIfAuto', 'trainTargets', 'recapSnap', 'recapMake', 'trainSkill', 'train', 'eventView', 'checkOdds', 'checkVal', 'classOf', 'role', 'tierOf', 'specOf', 'specMul', 'canAct']) mute(n);
  for (const n of ['duelAuto', 'duelAct', 'duelStart', 'battleAuto', 'battleAct', 'missionAuto', 'missionChoose', 'groupFightPC', 'careerYear', 'pathMonth', 'moneyYear', 'bodyYear',
    'mortalCheck', 'milYear', 'nobleYear', 'rulerYear', 'doActivity', 'prisonYear', 'familyYear', 'wsDay', 'promoCheck', 'interact', 'nobleAction',
    'applyJob', 'dutyEvent', 'flowEvent', 'planMonth', 'applyFx', 'choiceChoose', 'workHard', 'travelTo', 'councilMonth', 'yearGrowth', 'willGrow', 'naturalCause', 'deathChance']) scope(n, 'call');
  scope('planDay', 'month');
  // checks: the number a check names, and a skill whose synergy value beat it in A.skillEff
  const src = (pc, k) => {
    if (GD.STATS.includes(k)) return [k];
    if (!GD.SKILLS[k]) return [];
    k = canon(k);
    DN.mute++;
    try {
      let best = k, v = A.skill(pc, k);
      for (const [j, m] of GD.SKILL_SYN[k] || []) { const x = A.skill(pc, j) * m; if (x > v) { v = x; best = canon(j); } }
      return best === k ? [k] : [k, best];
    } finally { DN.mute--; }
  };
  const tally = (bag, pc, ch) => { const ks = new Set(); for (const k of [ch.check.s, ch.check.s2]) if (k) for (const s of src(pc, k)) ks.add(s); for (const s of ks) bag[s] = (bag[s] || 0) + 1; };
  const view = A.eventView;
  A.eventView = function (q) {
    const fresh = q && !q.view, v = view.apply(this, arguments);
    try {
      if (DN.on && fresh && v && !v.skip) {
        const e = A.EV[q.ev], pc = A.pc();
        for (const c of v.choices) { const ch = e && e.choices[c.i]; if (ch && ch.check) tally(DN.life.offered, pc, ch); }
        // what the event's condition read: the event came because of it
        if (e && e.cond) { const o = { d: DN.depth, r: DN.reads, m: DN.mute }; DN.depth = 1; DN.mute = 0; DN.reads = new Set();
          try { e.cond(pc, A.C); } catch (err) {} for (const k of DN.reads) DN.life.gated[k] = (DN.life.gated[k] || 0) + 1; DN.depth = o.d; DN.reads = o.r; DN.mute = o.m; }
      }
    } catch (err) {}
    return v;
  };
  const choose = A.eventChoose;
  A.eventChoose = function (idx) {
    try {
      const q = A.S.queue[0];
      if (DN.on && q && q.type === 'event' && !q.result) {
        const v = A.eventView(q), c = v.choices[idx], e = A.EV[q.ev], ch = c && e && e.choices[c.i];
        if (ch && ch.check) tally(DN.life.decided, A.pc(), ch);
      }
    } catch (err) {}
    return choose.apply(this, arguments);
  };
  for (const k of Object.keys(choose)) A.eventChoose[k] = choose[k];
  scope('eventChoose', 'call');   // an event's effects read what they read: a duel's fighters, a group fight
  DN.reset = () => { DN.life = { decided: {}, offered: {}, gated: {}, engine: {}, by: {} }; DN.perMonth = {}; DN.depth = 0; DN.mute = 0; };
  DN.reset();
};
