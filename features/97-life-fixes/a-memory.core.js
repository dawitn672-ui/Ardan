// 97-life-fixes, part 1: a life remembers every scene it has shown, and the side doors respect it.
//
// The variety guard (25) keeps the roll from showing an event again within 10 years. But 37.5% of the scenes a life
// shows were already seen in that life (52% after 35), and almost all of them came through doors the roll does not
// guard: job duties (A.dutyEvent, a pool of 1 to 6 per career with a 3-year cooldown), path flows (A.flowEvent, 2 per
// plan: the study plan showed "An old scholar" 6 to 11 times a life), NPC moves (21-npc-initiative and the kinds 55 and
// 64 register with it, 2 years per kind), a superior's scenes (A.obligationsYear, 4 scenes picked blind), gatherings,
// and the activities that queue one fixed scene (going courting, going to a festival).
//
// What changes (engine side only, all draws from A.rand):
// - Memory. pc.evN counts how often each event was shown to this person (written when the player chooses). A save
//   without it counts each event in pc.flags.ev once.
// - One weight for every chooser. A.evVariety (25) already multiplies the weight of every rolled event, every pool
//   event (through A.evRecency) and every NPC move (through 25's wrapper of A.NPCI.choose). It is wrapped once more
//   with LF.weight, which reads the life's memory and a policy by kind of scene (LF.POLICY):
//     roll    anything the roll can pick: a seen event weighs 0.1 per showing, so the pool's fresh writing comes first
//     duty    seen at most twice a life, the second time 12 years or more after the first
//     flow    the same, 10 years
//     npc     the n-th time a kind of NPC move reaches you needs 5 x n years since the last; at most 4 times a life
//     boss    a superior's scene: twice a life, 10 years apart
//     story   a scene that tells one fixed story (LF.STORY, or `lfOnce: true`): once a life
// - Refill. When one of those doors is held back, the slot is not left empty: LF.refill draws one scene the life has
//   never seen from the monthly roll (A.rollEventsN), leaving out scenes that can hurt (81-pacing's PACE.hurtful), at
//   most once a month. An NPC move held back spends its budget point on the refill, so the pace of the year holds.
// - Families. An activity that always queues the same scene (A.queue of festival_day, meet_love) gets the least-seen
//   scene of its family (LF.FAMILY, written in scenes.events.js), so the third festival is not the first one again.
// - Gatherings. A guest's invitation (a role the realm does not need: noble, knight, guard, servant) to the same kind
//   of gathering comes at most every 6 years (a knight's tourney every 3), and to any gathering at most every 2 (patch
//   LF-GATH-ROLE). Rulers, envoys and family weddings are always asked: they decide for the realm, or it is theirs.
// - Measured. LF.share(pc) is the share of the scenes shown in this life that had been shown before (bench name:
//   seenThisLifePct). LF.OFF switches all of it off for A/B tests.
(function () {
  const LF = A.LF = A.LF || {};
  LF.OFF = false;

  // ---- memory -------------------------------------------------------------------------------------------------
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  LF.mem = pc => (isObj(pc.evN) ? pc.evN : (pc.evN = {}));
  // how often this person has been shown the event (a save from before this feature: once if it is in flags.ev)
  LF.n = function (pc, id) {
    if (!pc || !id) return 0;
    const m = isObj(pc.evN) ? pc.evN : null, n = m && typeof m[id] === 'number' ? m[id] : 0;
    const seen = pc.flags && isObj(pc.flags.ev) && pc.flags.ev[id] != null;
    return Math.max(n, seen ? 1 : 0);
  };
  LF.last = (pc, id) => (pc && pc.flags && isObj(pc.flags.ev) && typeof pc.flags.ev[id] === 'number' ? pc.flags.ev[id] : null);
  // the share of scenes this life has shown that were repeats: sum of (n - 1) over sum of n
  LF.share = function (pc) {
    const m = pc && isObj(pc.evN) ? pc.evN : {};
    let shown = 0, rep = 0;
    for (const k in m) { const n = +m[k] || 0; shown += n; rep += Math.max(0, n - 1); }
    return { shown, repeats: rep, pct: shown ? Math.round(1000 * rep / shown) / 10 : 0 };
  };
  // the life's record: refills and families (A.S.lf, created on first use)
  LF.st = function () {
    const S = A.S;
    if (!isObj(S.lf)) S.lf = {};
    const s = S.lf;
    if (!isObj(s.by)) s.by = {};
    if (typeof s.n !== 'number') s.n = 0;
    return s;
  };

  // a scene is counted when the player answers it (eventAuto and the quiet settle go through eventChoose too)
  const choose0 = A.eventChoose;
  A.eventChoose = function () {
    const q = A.S && A.S.queue && A.S.queue[0], pc = A.pc(), fresh = !!(q && q.type === 'event' && !q.result);
    const r = choose0.apply(this, arguments);
    try {
      if (fresh && q.result && pc && q.ev) { const m = LF.mem(pc); m[q.ev] = (m[q.ev] || 0) + 1; }
    } catch (e) { console.error('life memory', e); }
    return r;
  };

  // ---- policy -------------------------------------------------------------------------------------------------
  // Scenes that tell one fixed story: one person, one place, one case. The first two are the research's examples;
  // the rest were read from the duty and flow pools (docs/research/player-complaints.md, section 2).
  LF.STORY = new Set([
    'fl_st_master', 'du_ch_confession',
    'du_ct_forged_charter', 'du_ct_tax_roll', 'du_ct_dispatch', 'du_ct_embezzler', 'du_ct_traitor', 'du_ct_double_agent',
    'du_ct_cipher', 'du_ct_magistrate_bribe', 'du_ct_widow_case', 'du_ct_crooked_bailiff', 'du_ch_relic', 'du_ch_election',
    'du_gd_masterpiece', 'du_gd_bridge', 'du_ln_lord_wound', 'du_ln_student', 'du_sea_cargo', 'du_gl_maneater', 'du_un_score',
    'du_un_watch', 'du_cm_priest_letters', 'du_cm_clerk_wanted', 'du_cm_servant_eye',
    'fl_fa_vision', 'fl_fa_calling', 'fl_rn_fire', 'fl_sc_plot', 'fl_fr_escape', 'fl_gv_governor', 'fl_wp_veteran',
    'fl_adv_volunteer', 'fl_adv_court', 'fl_adv_church', 'fl_adv_guild', 'fl_adv_common', 'fl_adv_under',
  ]);
  LF.BOSS = new Set(['bd_boss_test', 'bd_boss_favor', 'bd_boss_blame', 'bd_boss_rival']);
  LF.POLICY = {
    roll: { decay: 0.1 },
    duty: { cap: 2, gap: 12, decay: 0.2 },
    flow: { cap: 2, gap: 10, decay: 0.2 },
    npc: { cap: 4, gap: 5, grow: true, decay: 0.35 },
    boss: { cap: 2, gap: 10, decay: 0.25 },
    story: { cap: 1 },
  };
  LF.cls = function (e) {
    if (!e || !e.id) return null;
    if (e.lfOnce || LF.STORY.has(e.id)) return 'story';
    if (e.duty) return 'duty';
    if (e.flow) return 'flow';
    if (LF.BOSS.has(e.id)) return 'boss';
    if (e.npc && e.trigger) return 'npc';
    if (!e.trigger) return 'roll';
    return null;
  };
  LF.blocked = 0;     // how many choices the policy has held back (read by the doors to know when to refill)
  LF.freshOnly = false;
  const hurtful = e => (A.PACE && typeof A.PACE.hurtful === 'function' ? A.PACE.hurtful(e) : false);
  LF.weight = function (e, pc) {
    if (LF.OFF || !e) return 1;
    pc = pc || A.pc();
    if (!pc) return 1;
    const n = LF.n(pc, e.id);
    if (LF.freshOnly) { if (n || hurtful(e)) { LF.blocked++; return 0; } return 1; }
    if (!n) return 1;
    const P = LF.POLICY[LF.cls(e)];
    if (!P) return 1;
    if (P.cap != null && n >= P.cap) { LF.blocked++; return 0; }
    const last = LF.last(pc, e.id);
    if (P.gap && last != null && A.S.year - last < P.gap * (P.grow ? n : 1)) { LF.blocked++; return 0; }
    return P.decay != null ? Math.pow(P.decay, n) : 1;
  };
  // the one hook: every roll, every pool (A.evRecency calls it) and every NPC move (25's wrapper calls it)
  const variety0 = A.evVariety;
  A.evVariety = function (e, pc) {
    const v = typeof variety0 === 'function' ? variety0.apply(this, arguments) : 1;
    return v ? v * LF.weight(e, pc) : 0;
  };
  // a list of event ids, picked by the same weights (the superior's scenes, patch LF-BOSS-PICK); null if all are held
  A.lfPick = function (ids, pc) {
    const es = (ids || []).map(id => A.EV[id]).filter(Boolean);
    if (LF.OFF) return es.length ? A.pick(es).id : null;
    const b0 = LF.blocked, e = A.wpick(es, x => LF.weight(x, pc));
    if (!e && LF.blocked > b0) LF.refill(pc, 'boss');
    return e ? e.id : null;
  };

  // ---- refill ---------------------------------------------------------------------------------------------------
  LF.REFILL_TRIES = 3;
  LF.refill = function (pc, why) {
    const S = A.S;
    if (LF.OFF || LF.REFILL_OFF || !pc || !pc.alive || pc.id !== S.pc || pc.prison || !A.rollEventsN) return false;
    const st = LF.st(), month = Math.floor(A.absDay() / 30);
    if (st.rm === month) return false;
    for (let t = 0; t < LF.REFILL_TRIES; t++) {
      const m = S.queue.length;
      LF.freshOnly = true;
      try { A.rollEventsN(pc, 1); } finally { LF.freshOnly = false; }
      if (S.queue.length <= m) continue;
      const q = S.queue[S.queue.length - 1];
      let skip = false;
      try {
        if (q.type === 'event') { const seen = S.evShown && S.evShown[q.ev]; skip = (seen != null && A.absDay() - seen < 240) || !!A.eventView(q).skip; }
      } catch (e) { skip = true; }
      if (!skip) { st.rm = month; st.n++; st.by[why] = (st.by[why] || 0) + 1; return true; }
      S.queue.splice(S.queue.indexOf(q), 1);
    }
    return false;
  };

  // ---- the doors ------------------------------------------------------------------------------------------------
  // a job duty or a plan's breakthrough the policy held back gives its slot to a fresh scene
  for (const name of ['dutyEvent', 'flowEvent']) {
    const f = A[name];
    if (typeof f !== 'function') continue;
    A[name] = function (pc) {
      const b0 = LF.blocked, r = f.apply(this, arguments);
      try { if (!r && LF.blocked > b0) LF.refill(pc, name === 'dutyEvent' ? 'duty' : 'flow'); } catch (e) { console.error('life refill', e); }
      return r;
    };
  }
  // an NPC move held back: its budget point goes to a fresh scene instead
  const NI = A.NPCI;
  if (NI && typeof NI.choose === 'function') {
    const choose = NI.choose;
    NI.choose = function (list) {
      const b0 = LF.blocked, x = choose.apply(this, arguments);
      try {
        if (!x && list && list.length && LF.blocked > b0) {
          const pc = A.pc(), st = pc && pc.npci;
          if (LF.refill(pc, 'npc') && st && typeof st.b === 'number' && st.b >= 1) st.b -= 1;
        }
      } catch (e) { console.error('life refill npc', e); }
      return x;
    };
  }

  // ---- families of scenes for activities that always queue the same one ---------------------------------------
  LF.FAMILY = LF.FAMILY || {};   // base id -> [variant ids], filled by scenes.events.js
  LF.variant = function (pc, base) {
    const fam = [base].concat(LF.FAMILY[base] || []).filter(id => A.EV[id]);
    let best = base, bn = Infinity;
    for (const id of fam) {
      const e = A.EV[id];
      let ok = true;
      if (id !== base && e.cond) { try { ok = !!e.cond(pc, A.C); } catch (err) { ok = false; } }
      if (!ok) continue;
      const n = LF.n(pc, id);
      if (n < bn) { best = id; bn = n; }
    }
    return best;
  };
  const queue0 = A.queue;
  A.queue = function (item) {
    try {
      if (!LF.OFF && item && item.type === 'event' && LF.FAMILY[item.ev] && !(item.ctx && item.ctx.lfFixed)) {
        const pc = A.pc();
        if (pc) { const v = LF.variant(pc, item.ev); if (v !== item.ev) { const st = LF.st(); st.by.family = (st.by.family || 0) + 1; item.ev = v; } }
      }
    } catch (e) { console.error('life family', e); }
    return queue0.apply(this, arguments);
  };

  // ---- gatherings: a guest is not asked to every feast (patch LF-GATH-ROLE) ------------------------------------
  // and a gathering's own scenes prefer the ones this life has not seen (patch LF-GATH-SCENES); never 0, so a
  // gathering always has its scenes
  A.lfSceneW = e => (LF.OFF || !e ? 1 : Math.pow(0.2, LF.n(A.pc(), e.id)));
  LF.GATH_KIND_GAP = 6; LF.GATH_ANY_GAP = 2; LF.GATH_KNIGHT_GAP = 3;
  LF.GUEST_ROLES = ['noble', 'knight', 'guard', 'servant'];
  A.lfGathRole = function (pc, g) {
    const role = A.gathRole(pc, g);
    if (LF.OFF || !role || !g || !LF.GUEST_ROLES.includes(role)) return role;
    // a wedding in the family is never skipped
    const kin = [pc.id, pc.spouse].concat(pc.children || [], pc.parents || []);
    if (Array.isArray(g.couple) && g.couple.some(id => kin.includes(id))) return role;
    const st = LF.st(), y = A.S.year;
    if (!isObj(st.ga)) st.ga = {};
    if (st.gaAny != null && y - st.gaAny < LF.GATH_ANY_GAP) return null;
    // a knight's trade is the lists: tourneys every 3 years, not 6
    const gap = role === 'knight' && g.kind === 'tournament' ? LF.GATH_KNIGHT_GAP : LF.GATH_KIND_GAP;
    if (st.ga[g.kind] != null && y - st.ga[g.kind] < gap) return null;
    st.ga[g.kind] = y; st.gaAny = y;
    return role;
  };
})();
