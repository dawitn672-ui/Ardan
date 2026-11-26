// S1b stage 4: growth moves with the life (docs/design/skills.md §2.5, §3.4-§3.6). The month's context for the
// engine: a rival, a new place, a quiet season, rest and the other needs, overtraining, a mending wound, a near death,
// pride and memory; specialisms; the card keys (proof, grasp, talent, specialism) and the condition helpers (C.lvl,
// C.talent, C.ready, C.stuck); breakthroughs and words from Expert up go into the year's digest.
(function () {
  const SK = A.SK; if (!SK || !SK.DATA) return;

  // ---- the person ------------------------------------------------------------------------------------------------------
  // pride (a proud or arrogant temper, until a public defeat humbles it) hears a teacher less and learns little from failure
  SK.proudOf = p => !!(p && p.traits && (p.traits.includes('proud') || p.traits.includes('arrogant')) && !(p.flags && p.flags.sk_humbled));
  // a good memory keeps a skill longer unused (up to half again)
  SK.memoryOf = p => Math.min(1.5, Math.max(1, 1 + ((A.stat ? A.stat(p, 'int') : 50) - 50) / 100));

  // ---- the month's life ----------------------------------------------------------------------------------------------
  // a rival: someone in your rel as a rival, alive, met in the last three years, who holds the skill you are working
  SK.rivalOf = function (pc, k) {
    if (!pc.rel) return null;
    let best = null;
    for (const id in pc.rel) {
      const r = pc.rel[id]; if (!r || !(r.type === 'rival' || r.rival)) continue;
      const p = A.P(id); if (!p || !p.alive) continue;
      if (r.seen != null && A.S.year - r.seen > 3) continue;
      const lv = SK.lvOf(p, k); if (lv > 0 && (!best || lv > best.lv)) best = { skill: SK.canon(k)[0], lv, p };
    }
    return best;
  };
  // a new place: a new home, realm, school or post this year makes the skills you work at fresh for a year
  SK.placeKey = pc => [pc.home, pc.realm, pc.school ? pc.school.name : '', pc.job ? pc.job.c : '', pc.mil ? pc.mil.realm : ''].join('|');
  SK.lifeCtx = function (pc, ctx, acts) {
    const P = A.plan ? A.plan(pc) : {};
    // the rival in the skill most worked this month
    const main = acts.length ? acts.slice().sort((a, b) => b.eu - a.eu)[0].skill : P.train && SK.canon(P.train)[0];
    if (main) { const r = SK.rivalOf(pc, main); if (r) { ctx.rival = { skill: r.skill, lv: r.lv }; ctx.rivalWho = r.p; } }
    // a new place: the first season is a breakthrough's moment
    const key = SK.placeKey(pc);
    if (pc.skp != null && pc.skp !== key) {
      const fresh = [...new Set(acts.map(a => a.skill))];
      ctx.fresh = fresh;
      for (const a of acts) if (!a.trigger && (a.q === 'drill' || a.q === 'practice' || a.q === 'work')) { a.trigger = 'newland'; a.why = a.why + ', in a new place'; break; }
    }
    pc.skp = key;
    // hours shared between three or more studies: the card that asks you to narrow them
    if (new Set(acts.filter(a => a.q === 'practice' || a.q === 'drill').map(a => a.skill)).size >= 3) pc.flags.sk_scattered = A.S.year;
    // thinking it over (Work at a skill): this month counts as a quiet season
    if (pc.flags.sk_think >= A.S.year * 12 + Math.floor(Math.min(364, A.S.warClock || 0) / 30.42) - 1) ctx.quiet = true;
    // a quiet season: a light plan or rest, at peace
    if ((P.intensity === 'rest' || P.intensity === 'light') && !(A.S.wars || []).some(w => w && (w.a === pc.realm || w.b === pc.realm))) ctx.quiet = true;
    // overtrained: a brutal plan on short rest
    if (P.intensity === 'brutal' && pc.needs && pc.needs.rest < 30) ctx.overtrained = true;
    // a mending wound on a part the skill uses; a near death is a moment
    if (A.BM && A.BM.partPen) for (const a of acts) if (A.BM.partPen(pc, a.skill) < 0) { a.mul = (a.mul == null ? 1 : a.mul) * 0.3; a.mulTag = a.mulTag || 'a mending wound'; }
    if (pc.health != null && pc.health < 15 && (pc.flags.sk_neardeath || 0) < A.S.year) {
      pc.flags.sk_neardeath = A.S.year;
      for (const a of acts) if (!a.trigger) { a.trigger = 'neardeath'; break; }
    }
    // condition: hurt and spirits, as the standard has them (weariness is the engine's)
    let cond = 1;
    const hp = pc.health / Math.max(1, A.maxHealth ? A.maxHealth(pc) : 100);
    if (hp < 0.6) cond *= 0.6 + hp * 0.6;
    if (pc.happy < 30) cond *= 0.88; else if (pc.happy > 75) cond *= 1.06;
    if (cond !== 1) ctx.cond = Math.max(0.6, Math.min(1.06, cond));
  };
  const monthCtx = SK.monthCtx;
  SK.monthCtx = function (pc, acts) {
    const ctx = monthCtx(pc);
    try { SK.lifeCtx(pc, ctx, acts || []); } catch (e) { console.error('skills: life', e); }
    return ctx;
  };

  // ---- a proof, a grasp, a talent, a specialism: the card keys -------------------------------------------------------
  (A.FX_EXTRA = A.FX_EXTRA || []).push('proof', 'grasp', 'talent', 'specialism');
  SK.proof = function (pc, k, why) {
    const c = SK.canon(k)[0]; if (!c || !pc.sk) return false;
    SK.ensure(pc);
    const s = pc.sk[c]; if (!s) return false;
    // a deed fit for the next word: a succeeded stretch at its level (it proves you once you stand at the edge)
    A.gainXp(pc, c, 1.5, { q: 'stretch', d: Math.min(SK.MAX_LV, s.lv + 1), why: why || 'a deed', trigger: 'feat' });
    return true;
  };
  // a breakthrough's moment named by a card: the engine's chance unless the card says sure
  SK.graspMoment = function (pc, k, why, sure) {
    const c = SK.canon(k)[0]; if (!c) return;
    A.gainXp(pc, c, 0.2, { q: 'practice', why: why || 'a moment', trigger: sure ? 'sure' : 'feat' });
  };
  SK.chooseSpec = function (pc, k, id) {
    const c = SK.canon(k)[0], s = pc.sk && pc.sk[c]; if (!s || !SK.SPEC[c] || !SK.SPEC[c][id]) return false;
    if (s.sp.includes(id)) return false;
    const room = SK.wordOf(s.lv) >= 4 ? 2 : SK.wordOf(s.lv) >= 2 ? 1 : 0;
    if (s.sp.length >= room) s.sp.shift();
    s.sp.push(id);
    SK.record(pc, c, 'specialism', `${SK.name(c)}: ${SK.specName(c, id)}, your specialism`);
    return true;
  };
  A.addStage('A.applyFx', 'skills', ap => function (pc, fx, ctx) {
    const r = ap.apply(this, arguments);
    try {
      if (fx && typeof fx === 'object' && pc && pc.sk) {
        const why = (SK.cur && SK.cur.why) || SK.whyNow().why;
        if (fx.proof) SK.proof(pc, fx.proof === 'ctx' ? ctx && ctx.sk : fx.proof, why);
        if (fx.grasp) { const g = typeof fx.grasp === 'object' ? fx.grasp : { k: fx.grasp }; SK.graspMoment(pc, g.k === 'ctx' ? ctx && ctx.sk : g.k, why, !!g.sure); }
        if (fx.talent) for (const k in fx.talent) SK.raiseTalent(pc, k === 'ctx' ? ctx && ctx.sk : k, fx.talent[k]);
        const cv = v => (typeof v === 'string' && v.startsWith('ctx.') ? ctx && ctx[v.slice(4)] : v === 'ctx' ? ctx && ctx.spid : v);
        if (fx.specialism) for (const k in fx.specialism) SK.chooseSpec(pc, k === 'ctx' ? ctx && ctx.sk : k, cv(fx.specialism[k]));
      }
    } catch (e) { console.error('skills fx', e); }
    return r;
  });

  // ---- the condition helpers ------------------------------------------------------------------------------------------
  if (A.C) Object.assign(A.C, {
    // a skill at least at a value (a number, as a check reads it; S1's word form is gone with the words, D-NEW-1)
    // k 'any': the best skill the person holds
    lvl: (p, k, min) => (k === 'any' ? SK.bestValue(p) : A.skill(p, k)) >= (min == null ? 40 : +min),
    // a talent at least this letter (B: gifted, by default)
    talent: (p, k, letter) => SK.TALENT_ORDER.indexOf(SK.talentOf(p, k)) >= SK.TALENT_ORDER.indexOf(letter || 'B'),
    // at the edge of a rank (or a gate), its concepts grasped, wanting a deed
    ready: (p, k) => (k ? SK.edgeState(p, k) === 'ready' : !!SK.edgeSkill(p, 'ready')),
    // at the edge of a rank (or a gate), behind a concept
    stuck: (p, k) => (k ? SK.edgeState(p, k) === 'stuck' : !!SK.edgeSkill(p, 'stuck')),
  });
  SK.bestValue = function (p) { let v = 0; if (p && p.skills) for (const k in p.skills) if (SK.BY[k] && p.skills[k] > v) v = p.skills[k]; return v; };
  SK.edgeState = function (p, k) {
    const c = SK.canon(k)[0], s = p && p.sk && p.sk[c]; if (!s || !s.lv) return null;
    if (SK.stepOf(s.lv) !== SK.STEPS || s.lv >= SK.MAX_LV || s.xp < SK.E().cost(s.lv) - 1e-6) return null;
    const open = SK.E().openConcepts(SK.view(p), c);
    if (open.length) return 'stuck';
    return SK.wordOf(s.lv) + 1 >= SK.E().PROOF_FROM && !s.proved ? 'ready' : null;
  };
  // the first skill a person is stuck or ready in (for the moment cards' setup)
  SK.edgeSkill = function (p, state) {
    if (!p || !p.sk) return null;
    let best = null;
    for (const k in p.sk) if (SK.edgeState(p, k) === state && (!best || p.sk[k].lv > p.sk[best].lv)) best = k;
    return best;
  };

  // ---- notable: a breakthrough and a new rank from B up go into the year's digest ------------------------------------
  SK.notable = function (pc, r) {
    if (A.V2Y && typeof A.V2Y.met === 'function') { try { A.V2Y.met(r.text.replace(/^./, c => c.toUpperCase())); } catch (e) {} }
  };
  // a public defeat humbles the proud (a lost fight of the player's, recorded by the engine as a defeat moment)
  SK.humble = pc => { if (SK.proudOf(pc)) { pc.flags.sk_humbled = A.S.year; SK.record(pc, '', 'humbled', 'A public defeat: you can be taught now'); } };
})();
