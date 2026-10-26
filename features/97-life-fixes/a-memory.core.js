// 97-life-fixes, part 1: a life remembers every scene it has shown, and the side doors respect it.
//
// The variety guard (25) keeps the roll from showing an event again within 10 years. But 37.5% of the scenes a life
// shows were already seen in that life (52% after 35), and almost all of them came through doors the roll does not
// guard: job duties (A.dutyEvent, a pool of 1 to 6 per career with a 3-year cooldown), plan breakthroughs
// (A.flowEvent, 2 for the study plan: "An old scholar" 6 to 11 times a life), council and drill business (A.councilMonth,
// A.drillMonth, pools picked blind), NPC moves (21-npc-initiative and the kinds 55 and 64 register with it, 2 years per
// kind), a superior's scenes (A.obligationsYear), a ruler's year (A.rulerYear, one of twelve picked blind), gatherings,
// and the activities that queue one fixed scene (going courting, a festival, the tavern).
//
// What changes (engine side only, all draws from A.rand):
// - Memory. pc.evN counts how often each event was shown to this person (written when the player answers it). A save
//   without it counts each event in pc.flags.ev once.
// - One weight for every chooser. A.evVariety (25) already multiplies the weight of every rolled event, every pool
//   event (through A.evRecency) and every NPC move (through 25's wrapper of A.NPCI.choose). It is wrapped once more
//   with LF.weight, which reads the life's memory and a policy by kind of scene (LF.POLICY):
//     roll    anything the roll can pick: a seen event weighs 0.1 per showing, so the pool's fresh writing comes first
//     duty    job duties, council and drill business: twice a life, 12 years apart (patch LF-POOL-PICK for the last two)
//     flow    a plan's breakthrough: twice a life, 10 years apart
//     npc     a kind of NPC move: twice a life, 10 years apart
//     boss    a superior's scene: twice a life, 10 years apart (patch LF-BOSS-PICK)
//     side    any other scene the world queues (a ruler's year, patch LF-RULER-PICK): three times, 5 x n years apart
//     story   a scene that tells one fixed story (LF.STORY, or `lfOnce: true`): once a life
// - The head of the queue. An NPC move or a scene of a ruler's ordinary year that the policy holds back is dropped when
//   it reaches the head of the queue, as the release already drops one seen in the last 240 days (A.headReady), and its
//   slot refilled. Never a choice's consequence, a scheduled return, a scene the player asked for, part of a gathering,
//   or one its author forced. A gathering's frame with one way on (a guest's opening, the last night) that the life has
//   been through before passes without stopping the clock, its result in the story log.
// - Refill. A held-back door does not leave the slot empty: LF.refill draws one scene this life has never seen from the
//   monthly roll (A.rollEventsN), leaving out scenes that can hurt (81-pacing's PACE.hurtful), at most once a month. An
//   NPC move held back spends its budget point on the refill, so the pace of the year holds.
// - Families. An activity that always queues the same scene gets the least-seen scene of its family (LF.FAMILY: the
//   festival and courting have three new ones each in scenes.events.js, the tavern's six share one family). Once
//   every scene of a family has been seen, the family shows at most once a year (LF.FAMILY_GAP); the activity still
//   does its work (the person met is met, the evening is spent) with a line in the story log instead.
// - Gatherings (patch LF-GATH-ROLE). A guest (noble, knight, guard, servant) is asked to the same kind of gathering at
//   most every 6 years (a knight's tourney every 5), and to any at most every 3. A visiting ruler or envoy goes to
//   weddings, coronations, tourneys and summits abroad at most every 4 years, the same kind every 6; an envoy sits at a
//   peace congress or a war council at most every 3. Hosts, a ruler at congresses and war councils, and family
//   weddings always ask. A gathering's own scenes prefer the unseen (patch LF-GATH-SCENES).
// - Measured. LF.share(pc) is the share of the scenes shown in this life that had been shown before (bench name:
//   seenThisLifePct); LF.caseShare(pc) counts a scene with a different person as a new case. LF.OFF switches all of it
//   off for A/B tests.
(function () {
  const LF = A.LF = A.LF || {};
  LF.OFF = false;
  // The life memory is the variety guard's whole-life layer: it is on while the guard is (25's A/B test switches the
  // guard off by setting A.evVariety to null, and then the memory is off too), and LF.OFF switches it off on its own.
  LF.memOn = () => !LF.OFF && typeof A.evVariety === 'function';

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
  // what makes a scene a new case: another person in it, another gathering, custom, record, illness or incident
  LF.caseOf = q => { const c = q && q.ctx; if (!c) return ''; const k = c.pid || c.gid || c.cid || c.ill || c.kind || ''; return k ? ':' + String(k).slice(0, 40) : ''; };
  // the same share, where a scene about another person or thing is a new case: pc.evC holds "id:case" keys
  LF.caseShare = function (pc) {
    const m = pc && isObj(pc.evC) ? pc.evC : {};
    let shown = 0, rep = 0;
    for (const k in m) { const n = +m[k] || 0; shown += n; rep += Math.max(0, n - 1); }
    return { shown, repeats: rep, pct: shown ? Math.round(1000 * rep / shown) / 10 : 0 };
  };
  // the life's record: refills, families and gatherings (A.S.lf, created on first use)
  LF.st = function () {
    const S = A.S;
    if (!isObj(S.lf)) S.lf = {};
    const s = S.lf;
    if (!isObj(s.by)) s.by = {};
    if (typeof s.n !== 'number') s.n = 0;
    return s;
  };
  const tally = k => { const st = LF.st(); st.by[k] = (st.by[k] || 0) + 1; };

  // Where a queued scene came from. A scene queued while a choice is being answered or closed is its consequence; one
  // queued by an action the player took (A.doActivity, A.decide, A.interact) was asked for; a scheduled one is a return
  // the story promised. None of those is ever held back at the head of the queue. The mark is a field of the queue item
  // (saved with it); an item from a save before this feature has none, and is treated as the world's.
  LF.origin = null;
  const during = (name, mark) => {
    const f = A[name];
    if (typeof f !== 'function') return;
    A[name] = function () {
      const S = A.S, before = S && S.queue ? new Set(S.queue) : null, was = LF.origin;
      LF.origin = mark;
      try { return f.apply(this, arguments); }
      finally {
        LF.origin = was;
        try { if (before) for (const q of S.queue) if (q && !before.has(q) && q.type === 'event' && !q.lfFrom) q.lfFrom = mark; } catch (e) {}
      }
    };
  };
  for (const n of ['eventChoose', 'eventClose']) during(n, 'chain');
  for (const n of ['doActivity', 'decide', 'interact', 'getToKnow']) during(n, 'ask');
  // which activity is being done (for the quiet line when its scene is one the life has just had)
  const act0 = A.doActivity;
  if (typeof act0 === 'function') A.doActivity = function (key) { const was = LF.askKey; LF.askKey = key; try { return act0.apply(this, arguments); } finally { LF.askKey = was; } };
  const schedule = A.schedule;
  A.schedule = function (item) { try { if (item && item.type === 'event' && !item.lfFrom) item.lfFrom = 'sched'; } catch (e) {} return schedule.apply(this, arguments); };

  // a scene is counted when the player answers it (eventAuto and the quiet settle go through eventChoose too)
  const choose0 = A.eventChoose;
  A.eventChoose = function () {
    const q = A.S && A.S.queue && A.S.queue[0], pc = A.pc(), fresh = !!(q && q.type === 'event' && !q.result);
    const r = choose0.apply(this, arguments);
    try {
      if (fresh && q.result && pc && q.ev && !LF.quiet) {
        const m = LF.mem(pc); m[q.ev] = (m[q.ev] || 0) + 1;
        const c = isObj(pc.evC) ? pc.evC : (pc.evC = {}), key = q.ev + LF.caseOf(q);
        c[key] = (c[key] || 0) + 1;
      }
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
    npc: { cap: 2, gap: 10, decay: 0.3, fam: true },   // counted over the kind's tellings (npc-variants.events.js)
    boss: { cap: 2, gap: 10, decay: 0.25 },
    side: { cap: 3, gap: 5, grow: true, decay: 0.25 },
    story: { cap: 1 },
  };
  LF.cls = function (e) {
    if (!e || !e.id) return null;
    if (e.lfOnce || LF.STORY.has(e.id)) return 'story';
    if (e.duty || e.council || e.drill) return 'duty';
    if (e.flow) return 'flow';
    if (LF.BOSS.has(e.id)) return 'boss';
    if (e.npc && e.trigger) return 'npc';
    if (!e.trigger) return 'roll';
    return 'side';
  };
  LF.blocked = 0;     // how many choices the policy has held back (read by the doors to know when to refill)
  LF.freshOnly = false;
  const hurtful = e => (A.PACE && typeof A.PACE.hurtful === 'function' ? A.PACE.hurtful(e) : false);
  // how often a scene or any other telling of it (its family) has been shown, and when last
  LF.members = id => { const b = LF.familyOf ? LF.familyOf(id) : null; return b ? [b].concat(LF.FAMILY[b] || []) : [id]; };
  LF.nFam = (pc, id) => LF.members(id).reduce((a, x) => a + LF.n(pc, x), 0);
  LF.lastFam = (pc, id) => { let y = null; for (const x of LF.members(id)) { const l = LF.last(pc, x); if (l != null && (y == null || l > y)) y = l; } return y; };
  // is this event held back for this person now? (cap or gap; no decay)
  LF.held = function (e, pc) {
    if (!LF.memOn() || !e || !pc) return false;
    const P = LF.POLICY[LF.cls(e)];
    if (!P) return false;
    const n = P.fam ? LF.nFam(pc, e.id) : LF.n(pc, e.id);
    if (!n) return false;
    if (P.cap != null && n >= P.cap) return true;
    const last = P.fam ? LF.lastFam(pc, e.id) : LF.last(pc, e.id);
    return !!(P.gap && last != null && A.S.year - last < P.gap * (P.grow ? n : 1));
  };
  LF.weight = function (e, pc) {
    if (!LF.memOn() || !e) return 1;
    pc = pc || A.pc();
    if (!pc) return 1;
    const n = LF.n(pc, e.id);
    if (LF.freshOnly) { if (n || hurtful(e)) { LF.blocked++; return 0; } return 1; }
    const P = LF.POLICY[LF.cls(e)], nf = P && P.fam ? LF.nFam(pc, e.id) : n;
    if (!nf) return 1;
    if (LF.held(e, pc)) { LF.blocked++; return 0; }
    return P && P.decay != null ? Math.pow(P.decay, nf) : 1;
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
    if (!LF.memOn()) return es.length ? A.pick(es).id : null;
    const b0 = LF.blocked, e = A.wpick(es, x => LF.weight(x, pc));
    if (!e && LF.blocked > b0) LF.refill(pc, 'boss');
    return e ? e.id : null;
  };
  // a pool of council or drill business (patch LF-POOL-PICK): the same, with the pool's own weights
  A.lfPoolPick = function (pool, pc) {
    if (!LF.memOn()) return A.wpick(pool, x => x.w || 1);
    const b0 = LF.blocked, e = A.wpick(pool, x => (x.w || 1) * LF.weight(x, pc));
    if (!e && LF.blocked > b0) LF.refill(pc, 'pool');
    return e;
  };
  // a ruler's year (patch LF-RULER-PICK): one of a list; when all are held back, the first, which the head drops
  A.lfPickIds = function (ids) {
    const pc = A.pc(), es = (ids || []).map(id => A.EV[id]).filter(Boolean);
    if (!LF.memOn() || !pc || !es.length) return A.pick(ids);
    const e = A.wpick(es, x => LF.weight(x, pc));
    return e ? e.id : ids[0];
  };

  // ---- refill ---------------------------------------------------------------------------------------------------
  LF.REFILL_TRIES = 3;
  LF.refill = function (pc, why) {
    const S = A.S;
    if (!LF.memOn() || LF.REFILL_OFF || !pc || !pc.alive || pc.id !== S.pc || pc.prison || !A.rollEventsN) return false;
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
      if (!skip) { q.lfFrom = 'refill'; st.rm = month; st.n++; st.by[why] = (st.by[why] || 0) + 1; return true; }
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
  // the head of the queue: a scene the world queued and the policy holds back is dropped, as the release drops one
  // seen in the last 240 days, and its slot refilled
  // Only scenes whose dropping changes nothing but the scene: NPC moves (21 already drops one seen in 240 days, and its
  // budget is spent either way) and the twelve scenes of a ruler's ordinary year. A revolt, a summons, a scheme that
  // lands are consequences, and always show.
  LF.SCREEN = new Set(['ruler_petition', 'ruler_embassy', 'ruler_famine', 'ruler_plot', 'ruler_feast', 'ruler_heresy', 'ruler_bandits',
    'ruler_bank', 'ruler_marriage_offer', 'ruler_border', 'ruler_plague', 'ruler_champion']);
  LF.droppable = q => !!(q && q.type === 'event' && !q.result && !q.view && !q.seen && !q.forced && !q.lfFrom && !(q.ctx && (q.ctx.gid || q.ctx.lfFixed)) &&
    ((q.ctx && q.ctx.npcMove) || LF.SCREEN.has(q.ev)));
  // A gathering's frame (its opening, its last night, a guard's or a servant's summons) that offers one way on and that
  // this life has already been through is passed through without stopping the clock: the choice it would have shown
  // is taken, and its result goes to the story log, as the release's quiet settle does for small scenes.
  LF.frame = q => !!(q && q.type === 'event' && !q.result && q.ctx && q.ctx.gid && /^ga_/.test(q.ev || ''));
  LF.quiet = false;
  LF.screen = function () {
    const S = A.S, pc = S && A.pc();
    if (!LF.memOn() || !pc || !pc.alive) return 0;
    let n = 0;
    for (let g = 0; g < 12 && S.queue.length; g++) {
      const q = S.queue[0];
      if (LF.frame(q) && LF.n(pc, q.ev) >= 1) {
        const v = A.eventView(q);
        if (v && !v.skip && v.choices.filter(c => c.i >= 0).length === 1) {
          LF.quiet = true;
          try { A.eventChoose(v.choices.findIndex(c => c.i >= 0)); A.eventClose(); } finally { LF.quiet = false; }
          n++; tally('frame');
          continue;
        }
        break;
      }
      if (!LF.droppable(q)) break;
      const e = A.EV[q.ev];
      if (!e || !e.trigger || !LF.held(e, pc)) break;
      S.queue.shift(); n++; tally('head');
      LF.refill(pc, 'head');
    }
    return n;
  };
  const head0 = A.headReady;
  A.headReady = function () {
    try { LF.screen(); } catch (e) { console.error('life head', e); }
    return head0.apply(this, arguments);
  };

  // ---- families of scenes for activities that always queue the same one ---------------------------------------
  LF.FAMILY = LF.FAMILY || {};   // base id -> [variant ids], filled by scenes.events.js
  LF.FAMILY.tavern_brawl = LF.FAMILY.tavern_brawl || ['tavern_stranger', 'tavern_song', 'tavern_dice', 'tavern_rumor', 'tavern_recruit'];
  LF.FAMILY.explore_ruin = LF.FAMILY.explore_ruin || ['explore_cave', 'explore_road', 'explore_lair', 'explore_battlefield'];
  LF.FAMILY.child_fight = LF.FAMILY.child_fight || ['child_dare', 'child_lost'];
  // years between scenes once a family is used up, times how often each has been seen
  LF.FAMILY_GAP = { meet_love: 2, festival_day: 2, tavern_brawl: 2, explore_ruin: 2, child_fight: 1 };
  // Any other scene an action of the player's queues (a pilgrimage's road, a game of dice): once it has been seen, it
  // comes again only after ASK_GAP x n years; in between, the action does its work without the scene. Scenes about a
  // person (getting to know someone), a beast or a gathering are new cases each time and always come.
  LF.ASK_GAP = 3;
  LF.ASK_LINE = { pilgrimage: 'The road is long and the shrine is as you remember it.', gamble: 'The dice go round. Nobody accuses anybody of anything tonight.',
    explore: 'You walk the country for days and find nothing you have not seen before.', tavern: 'A quiet evening at the tavern: the same faces, the same songs.',
    festival: 'You spend the feast day in the square with everyone else, and come home tired and pleased.' };
  LF.askLine = () => LF.ASK_LINE[LF.askKey] || 'Nothing out of the ordinary comes of it this time.';
  // the base of the family an id belongs to
  LF.familyOf = function (id) {
    if (LF.FAMILY[id]) return id;
    for (const b in LF.FAMILY) if (LF.FAMILY[b].includes(id)) return b;
    return null;
  };
  LF.variant = function (pc, base) {
    const fam = [base].concat(LF.FAMILY[base] || []).filter(id => A.EV[id]);
    let best = null, bn = Infinity;
    for (const id of fam) {
      const e = A.EV[id];
      let ok = true;
      if (id !== base && e.cond) { try { ok = !!e.cond(pc, A.C); } catch (err) { ok = false; } }
      if (!ok) continue;
      const n = LF.n(pc, id);
      if (n < bn) { best = id; bn = n; }
    }
    return { id: best || base, n: bn, last: Math.max(-1e9, ...fam.map(id => LF.last(pc, id) || -1e9)) };
  };
  // what an activity does when its family has nothing new this year: the work, without the scene
  LF.QUIET = {
    meet_love: (pc, item) => {
      const t = item.ctx && A.P(item.ctx.pid);
      if (t && t.alive && !pc.rel[t.id] && A.link) A.link(pc, t, 'acquaint', 8, 'acquaint');
      A.log(t ? `You meet ${A.fullName(t)}. You talk a little; nothing comes of it yet.` : 'Nobody new catches your eye this season.', '');
    },
    festival_day: () => A.log('You spend the feast day in the square with everyone else, and come home tired and pleased.', ''),
    tavern_brawl: () => A.log('A quiet evening at the tavern: the same faces, the same songs.', ''),
    explore_ruin: () => A.log('You walk the country for days and find nothing you have not seen before.', ''),
    child_fight: () => A.log('You play until you are called in, and nothing much happens. It is a good day.', ''),
  };
  // A forced scene the world queues that has a quiet way of its own: when the policy holds it back, the quiet way is
  // taken instead (64-npc-beliefs' "Not as you heard it" fixes the record with a line in the log when it does not queue
  // the scene, so it does exactly that).
  LF.QUIET_FORCED = {
    nb_record_wrong: (pc, item) => { const NB = A.NPCB, c = NB && NB.claim && item.ctx && NB.claim(item.ctx.cid); if (c && NB.worldFix) NB.worldFix(pc, c, true); },
  };
  const queue0 = A.queue;
  A.queue = function (item) {
    try {
      if (LF.memOn() && item && item.type === 'event' && LF.QUIET_FORCED[item.ev] && !LF.origin) {
        const pc = A.pc(), e = A.EV[item.ev];
        if (pc && e && LF.held(e, pc)) { tally('quiet'); LF.QUIET_FORCED[item.ev](pc, item); return; }
      }
      if (LF.memOn() && item && item.type === 'event' && !(item.ctx && item.ctx.lfFixed)) {
        const base = LF.familyOf(item.ev), pc = base && A.pc();
        if (pc) {
          const v = LF.variant(pc, base), gap = LF.FAMILY_GAP[base];
          if (v.n >= 1 && gap && A.S.year - v.last < gap * v.n) {
            tally('quiet');
            if (LF.QUIET[base]) LF.QUIET[base](pc, item);
            return;
          }
          if (v.id !== item.ev) { tally('family'); item.ev = v.id; }
        } else if (LF.origin === 'ask' && !(item.ctx && (item.ctx.pid || item.ctx.gid || item.ctx.beast))) {
          const p = A.pc(), e = A.EV[item.ev];
          if (p && e && e.trigger) {
            const n = LF.nFam(p, item.ev), last = LF.lastFam(p, item.ev);
            if (n >= 1 && last != null && A.S.year - last < LF.ASK_GAP * n) { tally('quiet'); A.log(LF.askLine(), ''); return; }
          }
        }
      }
    } catch (e) { console.error('life family', e); }
    return queue0.apply(this, arguments);
  };

  // ---- gatherings: a guest is not asked to every feast (patch LF-GATH-ROLE) ------------------------------------
  // and a gathering's own scenes prefer the ones this life has not seen (patch LF-GATH-SCENES); never 0, so a
  // gathering always has its scenes
  A.lfSceneW = e => (!LF.memOn() || !e ? 1 : Math.pow(0.2, LF.n(A.pc(), e.id)));
  LF.GATH_KIND_GAP = 6; LF.GATH_ANY_GAP = 3; LF.GATH_KNIGHT_GAP = 5; LF.GATH_CROWN_GAP = 4; LF.GATH_WAR_GAP = 3;
  LF.GUEST_ROLES = ['noble', 'knight', 'guard', 'servant'];
  LF.CROWN_OPTIONAL = ['wedding', 'coronation', 'tournament', 'summit'];   // abroad, for a ruler or an envoy
  A.lfGathRole = function (pc, g) {
    const role = A.gathRole(pc, g);
    if (!LF.memOn() || !role || !g) return role;
    // a wedding in the family is never skipped
    const kin = [pc.id, pc.spouse].concat(pc.children || [], pc.parents || []);
    if (Array.isArray(g.couple) && g.couple.some(id => kin.includes(id))) return role;
    const st = LF.st(), y = A.S.year;
    if (!isObj(st.ga)) st.ga = {};
    const crown = role === 'ruler' || role === 'envoy';
    if (crown) {
      // a ruler always sits at a peace congress or a war council; an envoy (a chancellor sent by the crown) at most
      // one every 3 years, the crown sends someone else to the rest
      if (!LF.CROWN_OPTIONAL.includes(g.kind)) {
        if (role === 'ruler') return role;
        if (st.gaWar != null && y - st.gaWar < LF.GATH_WAR_GAP) return null;
        st.gaWar = y;
        return role;
      }
      // the host always; the rest abroad at most every 4 years, a kind every 6
      if (g.host === pc.ruler || g.host === pc.realm) return role;
      const k = 'c:' + g.kind;
      if (st.gaCrown != null && y - st.gaCrown < LF.GATH_CROWN_GAP) return null;
      if (st.ga[k] != null && y - st.ga[k] < LF.GATH_KIND_GAP) return null;
      st.ga[k] = y; st.gaCrown = y;
      return role;
    }
    if (!LF.GUEST_ROLES.includes(role)) return role;
    if (st.gaAny != null && y - st.gaAny < LF.GATH_ANY_GAP) return null;
    // a knight's trade is the lists: tourneys every 5 years, not 6
    const gap = role === 'knight' && g.kind === 'tournament' ? LF.GATH_KNIGHT_GAP : LF.GATH_KIND_GAP;
    if (st.ga[g.kind] != null && y - st.ga[g.kind] < gap) return null;
    st.ga[g.kind] = y; st.gaAny = y;
    return role;
  };
})();
