// A mid-game and a late game for each path (Road to Ten, Replay 4: "give each main path (soldier, merchant, priest,
// scholar, criminal, noble, ruler) its own mid-game and late game, not a stats dashboard").
//
// In the release, a career is a ladder of ranks and a pool of events; once you are established, more of the same.
// Now each path has two undertakings that run over years:
//   the work of your middle years (three stages): a command of your own; a trading house's branch abroad; a parish and
//   a heresy; a great book; the big job; an estate improved; a monument to your reign; for common folk, a holding;
//   the legacy of your last years (two stages): a protégé and a last campaign; handing on the house; a shrine; a
//   school; going straight; settling the inheritance; whether to abdicate; the village elder.
// The plan names seven paths. Common folk (farmers, herders, miners, hunters, minstrels) are an eighth: two of the six
// starts are peasant and serf, and without it a forty-year peasant life had no arc at all.
// Each stage is a scene whose choices carry into the next (fx.arc: 'next' with a mark, or 'end'). The Life tab shows the
// work of your life so far.
//
// Engine side: the month hook starts and paces the arcs; the effects move them. Rendering only reads.
(function () {
  const AR = A.ARCS = {
    // path: [mid-game arc, late-game arc]
    PATHS: {
      soldier: { name: 'the soldier', mid: 'command', late: 'oldsoldier' },
      merchant: { name: 'the trader', mid: 'house', late: 'heirhouse' },
      priest: { name: 'the priest', mid: 'parish', late: 'shrine' },
      scholar: { name: 'the scholar', mid: 'book', late: 'school' },
      criminal: { name: 'the outlaw', mid: 'job', late: 'straight' },
      noble: { name: 'the lord', mid: 'estate', late: 'heirs' },
      ruler: { name: 'the ruler', mid: 'monument', late: 'crown' },
      common: { name: 'common folk', mid: 'holding', late: 'elder' },   // farm, herd, mine, hire out, or the open road
    },
    // stages: event ids in order; title for the card
    ARC: {
      command: { title: 'A command of your own', stages: ['la_command_1', 'la_command_2', 'la_command_3'] },
      oldsoldier: { title: 'The old campaigner', stages: ['la_oldsoldier_1', 'la_oldsoldier_2'] },
      house: { title: 'A house abroad', stages: ['la_house_1', 'la_house_2', 'la_house_3'] },
      heirhouse: { title: 'Handing on the house', stages: ['la_heirhouse_1', 'la_heirhouse_2'] },
      parish: { title: 'The parish and the heresy', stages: ['la_parish_1', 'la_parish_2', 'la_parish_3'] },
      shrine: { title: 'A shrine', stages: ['la_shrine_1', 'la_shrine_2'] },
      book: { title: 'The great work', stages: ['la_book_1', 'la_book_2', 'la_book_3'] },
      school: { title: 'A school', stages: ['la_school_1', 'la_school_2'] },
      job: { title: 'The big job', stages: ['la_job_1', 'la_job_2', 'la_job_3'] },
      straight: { title: 'Going straight', stages: ['la_straight_1', 'la_straight_2'] },
      estate: { title: 'The estate', stages: ['la_estate_1', 'la_estate_2', 'la_estate_3'] },
      heirs: { title: 'The inheritance', stages: ['la_heirs_1', 'la_heirs_2'] },
      monument: { title: 'A monument', stages: ['la_monument_1', 'la_monument_2', 'la_monument_3'] },
      crown: { title: 'The crown, at the end', stages: ['la_crown_1', 'la_crown_2'] },
      holding: { title: 'A holding of your own', stages: ['la_holding_1', 'la_holding_2', 'la_holding_3'] },
      elder: { title: 'The village elder', stages: ['la_elder_1', 'la_elder_2'] },
    },
    MID_AGE: 28, LATE_AGE: 55,   // a middle-years arc starts from this age, a late one from this
    GAP: [1, 3],                 // years between stages
    MAX_MID: 2,                  // middle-years undertakings in one life
  };
  AR.LATE = new Set(Object.values(AR.PATHS).map(p => p.late));
  const PATH_OF_JOB = { army: 'soldier', company: 'soldier', guild: 'merchant', sea: 'merchant', church: 'priest',
    learning: 'scholar', court: 'scholar', under: 'criminal' };
  // which path a life is on now
  AR.path = function (pc) {
    if (!pc || !pc.alive) return null;
    if (pc.ruler) return 'ruler';
    if (pc.mil && !pc.mil.merc) return 'soldier';
    if (pc.noble || ['noble', 'gentry', 'royal'].includes(pc.status)) return 'noble';
    if (pc.job && pc.job.c) { const p = A.pathOfCareer ? A.pathOfCareer(pc.job.c) : null; if (PATH_OF_JOB[p]) return PATH_OF_JOB[p]; }
    if (pc.status === 'merchant') return 'merchant';
    return pc.flags && pc.flags.unfree ? null : 'common';   // a serf's ground is the lord's; freedom comes first
  };
  // established enough for a middle-years undertaking
  AR.established = function (pc, path) {
    if (path === 'ruler' || path === 'noble' || path === 'common') return true;
    if (path === 'soldier') return !!pc.mil && (pc.mil.rank || 0) >= 2;
    return !!pc.job && (pc.job.r || 0) >= 1 || path === 'merchant' && pc.coin >= 300;
  };
  // a queued event is shown whatever its cond says, so the arc asks the scene's cond itself: a soldier's next stage
  // does not come once the soldier has left the army
  AR.fits = function (pc, ev) {
    const e = A.EV[ev];
    try { return !!e && (!e.cond || !!e.cond(pc, A.C)); } catch (err) { return false; }
  };
  AR.state = pc => (pc && pc.arcs && typeof pc.arcs === 'object' ? pc.arcs : {});
  AR.marks = (pc, k) => (AR.state(pc)[k] || {}).m || [];

  // the month: start an arc when its time comes, and bring on its next stage when it is due
  AR.month = function (pc) {
    if (!pc || !pc.alive || pc.prison || !A.isAdult(pc)) return;
    const S = A.S, age = A.age(pc), st = pc.arcs = AR.state(pc);
    if (S.queue.some(q => q && q.ctx && q.ctx.arc)) return;
    // a stage that was queued but never shown (its setup dropped it) means the work was given up; without this the arc
    // would wait for it for ever
    for (const k of Object.keys(st)) {
      const a = st[k];
      if (!a.done && a.next == null && a.q != null && A.absDay() - a.q > 60) { a.done = S.year; a.gave = 1; }
    }
    // a stage that is due
    for (const k of Object.keys(st)) {
      const a = st[k];
      if (a.done || a.next == null || S.year < a.next) continue;
      const ev = AR.ARC[k] && AR.ARC[k].stages[a.stage];
      if (!ev) { a.done = S.year; continue; }
      if (!AR.fits(pc, ev)) { a.done = S.year; a.gave = 1; continue; }
      A.queue({ type: 'event', ev, forced: true, ctx: { arc: k } });
      a.next = null; a.q = A.absDay();
      return;
    }
    // a story arc (Road to Ten, Events 3): one at a time, alongside the work of your life
    if (AR.storyMonth(pc, st, age)) return;
    // a new one: the middle years first, the last years later. One undertaking at a time, at most two in the middle
    // years (a life that changes trade may start over once), and one legacy
    const path = AR.path(pc); if (!path) return;
    const P = AR.PATHS[path], keys = Object.keys(st).filter(k => !(AR.ARC[k] && AR.ARC[k].story));
    if (keys.some(k => !st[k].done)) return;
    const lates = keys.filter(k => AR.LATE.has(k)).length, mids = keys.length - lates;
    for (const [k, from] of [[P.late, AR.LATE_AGE], [P.mid, AR.MID_AGE]]) {
      if (st[k] || age < from || (k === P.mid && !AR.established(pc, path))) continue;
      if (k === P.late ? lates >= 1 : mids >= AR.MAX_MID) continue;
      if (k === P.mid && age >= AR.LATE_AGE + 10) continue;   // too late for the middle years' work
      if (!AR.fits(pc, AR.ARC[k].stages[0])) continue;
      if (!A.chance(1 / 24)) return;                           // about two years after it becomes possible
      st[k] = { stage: 0, y: S.year, m: [], path, q: A.absDay() };
      A.queue({ type: 'event', ev: AR.ARC[k].stages[0], forced: true, ctx: { arc: k } });
      return;
    }
  };
  A.onMonth.push(pc => AR.month(pc));

  // ---- story arcs (Road to Ten, Events 3 and 4): "60 long arcs of 3 to 8 stages over 2 to 20 years: a blood feud, a
  // secret child, a rival's rise, a famous sword's history, a plague year, an apprentice who passes you", each ending
  // with "a lasting change: a title, a bond, a wound, a law, or a province on the map".
  // A feature registers one with A.ARCS.story(key, def):
  //   title          shown on the Life tab card
  //   stages         event ids in order, 3 to 8 (each trigger: true, every choice carrying fx.arc like the life arcs)
  //   start(pc)      whether the arc can begin in this life now (read only; C helpers welcome)
  //   w              weight against the other arcs that can begin (default 1)
  //   gap            [min, max] years between stages (default [1, 3]); stages may span 2 to 20 years
  //   lasting        what its ending leaves: 'title' 'bond' 'wound' 'law' 'province' 'trait' 'wealth' 'home' or 'name'
  // One story arc runs at a time. When none is running, a new one begins with a chance of 1 in STORY_EVERY a month
  // (about every four years of a life without one), chosen by weight from those whose start(pc) holds and that this
  // life has not had.
  AR.STORY_EVERY = 48;
  AR.LASTING = ['title', 'bond', 'wound', 'law', 'province', 'trait', 'wealth', 'home', 'name'];
  AR.story = function (k, def) {
    AR.ARC[k] = Object.assign({ story: true, w: 1 }, def);
    return AR.ARC[k];
  };
  AR.stories = () => Object.keys(AR.ARC).filter(k => AR.ARC[k].story);
  AR.storyMonth = function (pc, st, age) {
    const ks = AR.stories(); if (!ks.length) return false;
    if (ks.some(k => st[k] && !st[k].done)) return false;   // one running: its stages come through the due loop above
    if (!A.chance(1 / AR.STORY_EVERY)) return false;
    const can = ks.filter(k => { const D = AR.ARC[k]; if (st[k]) return false; try { return !D.start || !!D.start(pc, A.C); } catch (e) { return false; } })
      .filter(k => AR.fits(pc, AR.ARC[k].stages[0]));
    if (!can.length) return false;
    const k = A.wpick(can, x => AR.ARC[x].w || 1);
    st[k] = { stage: 0, y: A.S.year, m: [], story: 1, q: A.absDay() };
    A.queue({ type: 'event', ev: AR.ARC[k].stages[0], forced: true, ctx: { arc: k } });
    return true;
  };
  // for tests: play an arc through with the given choice index at each stage (or a function (stage, view) => index),
  // forcing its start and each stage due; returns what each stage showed and the arc's state at the end
  AR.playThrough = function (pc, k, pick) {
    const D = AR.ARC[k], st = pc.arcs = AR.state(pc), seen = [];
    st[k] = { stage: 0, y: A.S.year, m: [], story: D.story ? 1 : undefined };
    for (let i = 0; i < D.stages.length + 1 && !st[k].done; i++) {
      const ev = D.stages[st[k].stage]; if (!ev) break;
      const q = { type: 'event', ev, forced: true, ctx: { arc: k } };
      A.S.queue = [q];
      const v = A.eventView(q);
      if (v.skip) { seen.push({ ev, skip: true }); break; }
      const want = typeof pick === 'function' ? pick(st[k].stage, v) : (pick || 0);
      const vi = Math.max(0, v.choices.findIndex(c => c.i === want));
      A.eventChoose(vi); const res = q.result && q.result.text; A.eventClose();
      seen.push({ ev, title: v.title, text: v.text, choices: v.choices.map(c => c.t), result: res });
      if (!st[k].done && st[k].next != null) A.S.year = Math.max(A.S.year, st[k].next);
    }
    return { seen, state: st[k] };
  };

  // fx.arc: 'next' moves to the next stage in one to three years; 'end' closes it; { next|end, mark } leaves a mark
  // that later stages read (C.flag works too: each mark is also a flag)
  (A.FX_EXTRA = A.FX_EXTRA || []).push('arc');
  const apply = A.applyFx;
  A.applyFx = function (pc, fx, ctx) {
    const r = apply.apply(this, arguments);
    try {
      const v = fx && typeof fx === 'object' ? fx.arc : null;
      if (v && pc && pc.id === A.S.pc && ctx && ctx.arc) {
        const a = AR.state(pc)[ctx.arc]; if (!a) return r;
        const go = typeof v === 'string' ? v : v.go || 'next', mark = typeof v === 'object' ? v.mark : null;
        if (mark) { a.m = (a.m || []).concat([mark]); pc.flags['la_' + mark] = A.S.year; }
        a.stage++; a.q = null;
        const gap = AR.ARC[ctx.arc].gap || AR.GAP;
        if (go === 'end' || a.stage >= AR.ARC[ctx.arc].stages.length) a.done = A.S.year;
        else a.next = A.S.year + A.ri(gap[0], gap[1]);
      }
    } catch (e) { console.error('arcs fx', e); }
    return r;
  };
  A.C.arcMark = (p, m) => !!(p && p.flags && p.flags['la_' + m]);

  // the Life tab: the work of your life (pure)
  AR.lines = function (pc) {
    const out = [];
    for (const [k, a] of Object.entries(AR.state(pc))) {
      const A2 = AR.ARC[k]; if (!A2) continue;
      const n = A2.stages.length, done = Math.min(a.stage, n);
      out.push({ k, text: `${A2.title}: ${a.done ? (a.gave ? 'given up' : done >= n ? 'done' : 'finished early') : `${done} of ${n}`}${a.done ? ` (${a.done})` : ''}`, done: !!a.done });
    }
    return out;
  };
  const life = UI.TAB && UI.TAB.life;
  if (typeof life === 'function') UI.TAB.life = function (pc) {
    const h = life.apply(this, arguments);
    try {
      const L = pc && pc.alive ? AR.lines(pc) : [];
      if (!L.length) return h;
      const card = `<div class="card small arcs" aria-label="The work of your life"><b>The work of your life</b>${L.map(l => `<div class="tiny ${l.done ? 'muted' : ''}">${UI.esc(l.text)}</div>`).join('')}</div>`;
      const at = h.indexOf('<div class="row small muted" style="margin:6px 0 4px">');
      return at > 0 ? h.slice(0, at) + card + h.slice(at) : h + card;
    } catch (e) { return h; }
  };
})();
