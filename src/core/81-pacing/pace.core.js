// Pacing: no season passes without something to decide, and winter gives you days of your own.
//
// 1. The quiet-season floor (A.monthEvents). The release's director rolls one fixed chance a month by stage of life
//    (5% infant, 17% child, 28% teen, 32% adult, 26% old) and nothing raises it after a quiet stretch. In bot lives a
//    child waits a median 120 days between prompts and one gap in ten runs past 414 days; an infant's p90 is 608 days.
//    Adults are mostly fine (median gap 31 days, p90 about 100), but one gap in ten still runs past three months.
//    The floor counts whole months since the last prompt (anything the game puts in front of you). Once a stage's
//    limit is reached and the month's own roll brought nothing, it draws one event from the same pool, by the same
//    weights and cooldowns (A.rollEventsN), leaving out any scene that can hurt or kill. Nothing new is written for it:
//    it only spreads what the game already has.
//    Not in prison (a cell is meant to be slow) and not before the first birthday, as the release.
// 2. Winter's free days (A.initiativeMul, a hook the release reads but never set). Initiative refills at your free
//    days a year spread evenly over the days (freeTime / 365 a day, 7 a year for an adult), so an engaged player spends
//    a point as soon as it comes and then waits. In the dark months (the war engine's own winter: December to February,
//    A.wsWinter's days) the fields sleep and the roads close, and free days come twice as fast. Not in prison.
const PACE = A.PACE = A.PACE || {};
PACE.OFF = false;            // tests switch the whole feature off and on
PACE.FLOOR_OFF = false;      // ...or one part
PACE.WINTER_OFF = false;
// whole months without a prompt before the floor draws one, by stage of life (A.stage)
PACE.CAP = { infant: 5, child: 3, teen: 4, adult: 4, old: 4 };
PACE.WINTER_MUL = 2;
const DAY = () => A.absDay();
const isPC = p => !!(p && A.S && p.id === A.S.pc);

// the pacing record lives in the save: { last: absolute day of the last prompt, floor: draws so far }
PACE.st = function () { const S = A.S; if (!S.pace || typeof S.pace !== 'object') S.pace = {}; return S.pace; };

// ---- 1. the floor ---------------------------------------------------------------------------------------------------
// A prompt is anything queued for the player (the clock stops for each), except the war-room hint, which never shows.
// Items queued during the year turn are not counted there: A.yearTurn re-schedules them across the year, and they are
// counted when they come. A queue wrapper further in (58-event-cut) may drop an item, so only a real push counts.
const queue0 = A.queue;
A.queue = function (item) {
  const S = A.S, n = S && S.queue ? S.queue.length : 0;
  const r = queue0.apply(this, arguments);
  try { if (!PACE.OFF && S && S.queue && S.queue.length > n && item && item.type !== 'warroom' && !A._yearTurn) PACE.st().last = DAY(); } catch (e) { console.error('pacing queue', e); }
  return r;
};
// ---- 1b. the ceiling of the first adult year ------------------------------------------------------------------------
// The floor in reverse. A life that comes of age (or starts grown) met every adult door at once: 23 scenes in a noble's
// first year at 17, the recruiter, the draft, three taverns and a hunt (cycle 1, lives I9). In the first 365 days of
// adulthood the world's own scenes stop at PACE.FIRST_CAP; NPC moves stop at PACE.FIRST_NPC. Never a scene the player
// asked for, a choice's consequence, a forced or scheduled one, the start's own scenes or an ambition's.
PACE.FIRST_CAP = 8; PACE.FIRST_NPC = 4;
PACE.FIRST_KEEP = /^(fp_|lfx_amb_|ga_|cr_)/;
PACE.firstYear = function (pc) {
  if (!pc || !A.isAdult(pc)) return null;
  const P = PACE.st();
  if (!P.fy || typeof P.fy !== 'object' || P.fy.pid !== pc.id) P.fy = { pid: pc.id, d0: DAY(), n: 0, npc: 0 };
  return DAY() - P.fy.d0 < 365 ? P.fy : null;
};
PACE.firstDrop = function (item) {
  if (PACE.OFF || !item || item.type !== 'event' || item.forced || item.lfFrom || A._yearTurn) return false;
  const LF = A.LF; if (LF && LF.origin) return false;
  if (PACE.FIRST_KEEP.test(item.ev || '') || (item.ctx && item.ctx.gid)) return false;
  const pc = A.pc(); if (!isPC(pc)) return false;
  const fy = PACE.firstYear(pc); if (!fy) return false;
  const npc = !!(item.ctx && item.ctx.npcMove) || !!(A.EV[item.ev] && A.EV[item.ev].npc);
  if (npc ? fy.npc >= PACE.FIRST_NPC || fy.n >= PACE.FIRST_CAP : fy.n >= PACE.FIRST_CAP) { fy.cut = (fy.cut || 0) + 1; return true; }
  fy.n++; if (npc) fy.npc++;
  return false;
};
const queue1 = A.queue;
A.queue = function (item) {
  try { if (PACE.firstDrop(item)) return; } catch (e) { console.error('pacing first year', e); }
  return queue1.apply(this, arguments);
};
// ...and what A.yearTurn spreads over the coming year is not a prompt today (what it keeps in the queue, is)
const year0 = A.yearTurn;
A.yearTurn = function () {
  const P = A.S ? PACE.st() : null, was = P ? P.last : null;
  const r = year0.apply(this, arguments);
  try { if (P && !A.S.queue.length) { if (was == null) delete P.last; else P.last = was; } } catch (e) { console.error('pacing year', e); }
  return r;
};
// whole months since the last prompt (null on a save from before this feature: counting starts now)
PACE.quiet = function () { const P = PACE.st(); return P.last == null ? null : Math.floor((DAY() - P.last) / 30); };
PACE.capFor = function (pc) { return PACE.CAP[A.stage(pc)] || 4; };
// One event from the pool that will really show. A draw can come back empty (58-event-cut turns a retired event's draw
// into nothing), and a drawn event can drop itself when it is looked at (a token it cannot fill, a setup that says
// skip; or shown under 240 days ago, the release's guard in A.headReady). So it tries up to four times. Looking at it
// here (A.eventView, which runs its setup and keeps the view) happens in the engine at the month's turn, so a replay
// does the same. Returns true if a prompt was queued.
// The floor draws only scenes that cannot hurt or kill you. The release's own monthly roll still brings the fevers,
// the falls and the fights at its own rate: the floor is there to fill a quiet season with a decision, and doubling a
// child's scenes must not double a child's ways to die (the first try, which drew from the whole pool, did: in 12 bot
// lives to 40, five died against three without it, two of them at 16 and 18). An event is hurtful if any of its choices or its setup can take health,
// wound, kill, start a fight or a beast hunt, or name a cause of death (read from the source, once per event).
PACE.HURT_RX = /["']?\b(?:die|wound|duel|beast|cause)["']?\s*:|["']?health["']?\s*:\s*-|\.health\s*-=|\.health\s*=(?!=)|pcDeath|mortalCheck|bmFallIll|addWound|groupFight/;
PACE._hurt = {};
PACE.hurtful = function (e) {
  if (!e || !e.id) return true;
  if (PACE._hurt[e.id] != null) return PACE._hurt[e.id];
  const src = v => (typeof v === 'function' ? v.toString() : v && typeof v === 'object' ? JSON.stringify(v, (k, x) => (typeof x === 'function' ? x.toString() : x)) : '');
  let s = src(e.setup);
  for (const c of e.choices || []) s += ' ' + src(c.fx) + ' ' + src(c.win) + ' ' + src(c.lose) + ' ' + (c.group ? 'groupFight' : '') + ' ' + (c.check && c.check.fight ? 'groupFight' : '') + ' ' + (typeof c.r === 'function' ? c.r.toString() : '');
  return (PACE._hurt[e.id] = PACE.HURT_RX.test(s));
};
const fit0 = A.evFit;
A.evFit = function (e) {
  if (PACE.drawing && PACE.hurtful(e)) return 0;
  return typeof fit0 === 'function' ? fit0.apply(this, arguments) : 1;
};
PACE.TRIES = 4;
PACE.draw = function (pc) {
  const S = A.S, P = PACE.st(), was = P.last;
  for (let t = 0; t < PACE.TRIES; t++) {
    const m = S.queue.length;
    PACE.drawing = true;
    try { A.rollEventsN(pc, 1); } finally { PACE.drawing = false; }
    if (S.queue.length <= m) continue;
    const q = S.queue[S.queue.length - 1];
    let skip = false;
    try {
      if (q.type === 'event') {
        const seen = S.evShown && S.evShown[q.ev];
        skip = (seen != null && A.absDay() - seen < 240) || !!A.eventView(q).skip;
      }
    } catch (e) { skip = true; }
    if (!skip) { P.floor = (P.floor || 0) + 1; return true; }
    S.queue.splice(S.queue.indexOf(q), 1);
  }
  if (was == null) delete P.last; else P.last = was;   // nothing came: the quiet goes on
  return false;
};
const month0 = A.monthEvents;
A.monthEvents = function (pc) {
  const S = A.S, n = S.queue.length;
  const r = month0.apply(this, arguments);
  try {
    if (PACE.OFF || PACE.FLOOR_OFF || !isPC(pc) || !pc.alive || pc.prison || A.age(pc) < 1) return r;
    if (S.queue.length > n) return r;                  // the month's own roll brought something
    const P = PACE.st();
    if (P.last == null) { P.last = DAY(); return r; }
    if (PACE.quiet() >= PACE.capFor(pc)) PACE.draw(pc);
  } catch (e) { console.error('pacing floor', e); }
  return r;
};

// ---- 2. winter ------------------------------------------------------------------------------------------------------
PACE.winter = function () { const d = (A.S.warClock || 0) % 365; return d < 60 || d > 320; };
PACE.winterMul = function (pc) {
  if (PACE.OFF || PACE.WINTER_OFF || !pc || pc.prison || !PACE.winter()) return 1;
  return PACE.WINTER_MUL;
};
const mul0 = A.initiativeMul;
A.initiativeMul = function (pc) { return (typeof mul0 === 'function' ? mul0.apply(this, arguments) : 1) * PACE.winterMul(pc); };

// The initiative popover (59-tooltips) shows a bare "Rate ×" row when the rate is not 1: say why. Pure.
if (UI.TIPS && typeof UI.TIPS.initiative === 'function') {
  const tip0 = UI.TIPS.initiative;
  UI.TIPS.initiative = function () {
    const h = tip0.apply(this, arguments);
    try {
      const p = A.pc();
      if (!p || PACE.winterMul(p) === 1 || typeof h !== 'string') return h;
      return h.replace(/Rate ×/, UI.esc('Winter: the fields sleep, free days come twice as fast. Rate ×'));
    } catch (e) { return h; }
  };
}
