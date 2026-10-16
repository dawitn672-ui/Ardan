// Fewer, deeper events (Road to Ten, Events 1) and a core that is not diluted (Uniqueness 5).
//
// Events 1: about a third of the release's events are one-off scenes whose choices only nudge numbers and lead nowhere.
// list.core.js names them (ids, each with a reason code), chosen by bench/event-audit.mjs and listed for review in
// RETIRED.md. A retired event stays in A.EV, marked trigger (the mark the release's rolls, A.rollEvents and
// A.rollEventsN, already skip), and a roll that would have drawn it draws nothing instead (see below). Anything that
// queues it by id (a chain, A.schedule, an old save) still works. No event a feature wrote, no event in a special pool (job offers, duties, path flows, council,
// drill), no chain step, no memory event and no event whose flag is read anywhere is on the list.
// The menu setting "Classic event pool (keep every event)" restores them. It is stored with the game
// (A.S.settings.classicEvents), set through a journaled command, so replays see it; the menu remembers it for new lives.
//
// Uniqueness 5: the War Room's Templates, Industry and Manpower tabs are shown only to the ranks that can use them
// (the release showed everyone the tabs, greyed out). See wrTabs below.
const EC = A.EC = A.EC || {};
EC.R = EC.R || {};                         // id -> reason code (filled by list.core.js)
EC.REASONS = {
  N: 'nudge: its choices only move stats or skills by 1 or 2, happiness or health by a few points, or coin; nothing reads it; it leads nowhere',
  B: 'numbers: its choices only move numbers (more than a nudge), with nothing lasting; nothing reads it; it leads nowhere',
  O: 'opinion: an opinion change with someone plus numbers; no new bond, no memory, no follow-up',
  T: 'thin mark: one lasting mark (fame of 3 or more, or a wound) and nothing else; only with select.mjs --with-thin',
};
EC.retire = function (codes) { for (const id in codes) EC.R[id] = codes[id]; };
EC.base = {};                               // the trigger value each listed event had before the cut
EC.applied = null;
EC.classic = () => !!(A.S && A.S.settings && A.S.settings.classicEvents);
// mark or unmark the listed events. Cheap when nothing changed; events registered later (content loads after the
// engine) are picked up because the count of registered events is part of the check.
EC.sync = function (classic) {
  if (classic == null) classic = EC.classic();
  const n = Object.keys(A.EV).length, want = classic ? 'classic' : 'cut';
  if (EC.applied === want && EC.n === n) return;
  for (const id in EC.R) {
    const e = A.EV[id];
    if (!e) continue;
    if (!(id in EC.base)) EC.base[id] = !!e.trigger;
    e.trigger = classic ? EC.base[id] : true;
  }
  EC.applied = want; EC.n = n;
};
// the ids retired right now (empty with the classic pool): for benches and tests
EC.ids = () => (EC.classic() ? [] : Object.keys(EC.R).filter(id => A.EV[id]));
Object.defineProperty(A, 'EV_RETIRED', { get: () => new Set(EC.ids()), configurable: true });

// marked as soon as each event pack registers (content loads after the engine), and checked again at every roll
const defEvents = A.defEvents;
A.defEvents = function () { const r = defEvents.apply(this, arguments); try { EC.sync(); } catch (err) { console.error('event-cut', err); } return r; };
// The roll is where the cut applies. Fewer events, not the same number from a smaller pool: the roll draws as the
// classic pool would, and a draw that lands on a retired event is let fall (nothing is queued, its cooldown is not
// stamped). Every surviving event keeps the odds it had, so a life meets fewer events, the share that remember
// rises, and the rate of risky scenes (wounds, duels, beasts) per year stays where it was. Simply marking the retired
// events and letting the roll fill its slots from the rest was measured first: it kept 57 events a decade, gave the
// freed slots to the broad events (memory share flat at 9.2%, repeats up) and raised the risky scenes from 6.7 to
// 9.8 a decade, which shortened bot lives. One guard keeps the pace steady: if a fallen draw would leave the year
// with no event at all so far, the roll draws once more from the cut pool.
EC.seenThisYear = function (pc) {
  const y = A.S.year, ev = pc.flags && pc.flags.ev;
  if ((A.S.queue || []).some(q => q && q.type === 'event')) return true;
  if (ev) for (const id in ev) if (ev[id] === y) return true;
  return false;
};
EC.rollAsClassic = function (base, self, args, pc, refill) {
  const S = A.S, R = EC.R, prev = {};
  S.evRecent = S.evRecent || {};
  for (const id in R) prev[id] = S.evRecent[id];
  EC.sync(true);
  const queue = A.queue;
  let fell = 0, k;
  A.queue = function (item) {
    if (item && item.type === 'event' && !item.forced && R[item.ev]) {
      fell++;
      if (prev[item.ev] === undefined) delete S.evRecent[item.ev]; else S.evRecent[item.ev] = prev[item.ev];
      return;
    }
    return queue.apply(this, arguments);
  };
  try { k = base.apply(self, args); } finally { A.queue = queue; EC.sync(false); }
  if (typeof k === 'number') k -= fell;
  if (fell && refill && pc && !EC.seenThisYear(pc)) { const k2 = base.call(self, pc, 1); if (typeof k === 'number' && typeof k2 === 'number') k += k2; }
  return k;
};
for (const k of ['rollEvents', 'rollEventsN']) {
  const base = A[k];
  if (typeof base !== 'function') continue;
  A[k] = function (pc) {
    EC.sync();
    if (EC.classic() || !A.S || !pc) return base.apply(this, arguments);
    return EC.rollAsClassic(base, this, arguments, pc, k === 'rollEventsN');
  };
}
// a new game takes the setting from its options (absent: the cut pool); an old save without it loads with the cut pool
const newGame = A.newGame;
A.newGame = function (o) {
  const r = newGame.apply(this, arguments);
  if (A.S) { A.S.settings = A.S.settings || {}; A.S.settings.classicEvents = !!(o && o.classicEvents); EC.sync(); }
  return r;
};
// the setting, as an engine command so the journal records it and a replay makes the same rolls
A.setClassicEvents = function (on) {
  if (!A.S) return { ok: false };
  A.S.settings = A.S.settings || {};
  A.S.settings.classicEvents = !!on;
  EC.sync();
  return { ok: true };
};
if (Array.isArray(A.COMMANDS) && !A.COMMANDS.includes('setClassicEvents')) A.COMMANDS.push('setClassicEvents');

// ---- the menu
UI.EVCUT = {
  on: () => (A.S ? EC.classic() : !!(UI.set && UI.set.classicEvents)),
  menu: () => `<label class="row"><input type="checkbox" data-c="setClassicEvents" ${UI.EVCUT.on() ? 'checked' : ''}> Classic event pool (keep every event)</label>` +
    `<div class="tiny muted" style="margin:-4px 0 4px 26px">Off: ${UI.esc(String(Object.keys(EC.R).length))} small one-off events are retired, so the ones that remember you come up more.</div>`,
};
Object.assign(UI.C, {
  setClassicEvents(el) {
    UI.set.classicEvents = !!el.checked;
    UI.saveSettings && UI.saveSettings();
    if (A.S) A.setClassicEvents(!!el.checked);
    UI.renderModal && UI.renderModal();
  },
});
// a life started from the creation screen takes the remembered setting (a separate journaled command after newGame)
if (typeof UI.startLife === 'function') {
  const startLife = UI.startLife;
  UI.startLife = function () {
    const before = A.S;
    const r = startLife.apply(this, arguments);
    if (A.S && A.S !== before && UI.set && UI.set.classicEvents && !EC.classic()) A.setClassicEvents(true);
    return r;
  };
}

// ---- Uniqueness 5: the War Room shows the design and production desks only to the ranks that run them.
// The release listed Templates (division design), Industry (forges, production lines, economy law) and Manpower
// (training new divisions) for everyone, greyed out with "Marshal or ruler" / "Ruler only". A farmhand, a squire or a
// sergeant now sees Command, Forces and Wars: the fronts and the host, which are the living history around them.
// The release's own unlock rules stand: Templates for the ruler, the Marshal and commanders of rank 6 and up (who
// read their divisions' designs), Industry and Manpower for the ruler, the Marshal (Manpower) and Generals (rank 7) and up.
if (typeof UI.wrTabs === 'function') {
  const wrTabs = UI.wrTabs;
  UI.wrTabs = function () { return wrTabs.apply(this, arguments).filter(t => !t.lock); };
}
if (UI.A && typeof UI.A.wrTab === 'function') {
  const wrTab = UI.A.wrTab;
  UI.A.wrTab = function (v) {
    const pc = A.pc(), tabs = pc && A.cmdRole ? UI.wrTabs(A.cmdRole(pc)) : null;
    return wrTab.call(this, tabs && !tabs.some(t => t.k === v) ? 'cmd' : v);
  };
}
