// The playtest session log. Playtest mode (the Menu's "Playtest mode") times ten tasks; that tells you whether a new
// player can find things, not what they did with the hour. While a playtest runs this keeps a short log in memory:
// every control the player used (the data-a action and the screen it was on), each event they answered with how long
// they read it, the tabs they opened, every pause of a minute or more, every error the page raised, and where they
// were when they stopped. "Download results" carries it in the file beside the task results.
//
// It is the UI's own record, kept on UI.ptLog, never in A.S: it draws no random numbers and changes no game state, so
// a life plays the same with it as without it. Wall-clock time is fine here (the playtest's task timer uses it too);
// the engine never sees it. Nothing leaves the machine unless the player downloads the file.
(function () {
  const L = UI.ptLog = { on: false, t0: 0, last: 0, acts: [], events: [], tabs: {}, stalls: [], errors: [], counts: {}, shown: null };
  const MAX = 4000, STALL = 60000;
  const now = () => Date.now();
  const sec = ms => Math.round(ms / 100) / 10;
  const where = () => {
    const pc = A.S && A.pc ? A.pc() : null;
    return { screen: UI.screen || '', tab: UI.tab || '', ov: UI.ov ? String(UI.ov.k || UI.ov.type || UI.ov).slice(0, 24) : '',
      year: A.S ? A.S.year : null, age: pc && A.age ? A.age(pc) : null, alive: pc ? !!pc.alive : null };
  };
  const push = (arr, x) => { if (arr.length < MAX) arr.push(x); };

  L.start = function () {
    Object.assign(L, { on: true, t0: now(), last: now(), acts: [], events: [], tabs: {}, stalls: [], errors: [], counts: {}, shown: null });
  };
  L.stop = function () { L.on = false; };
  // a pause of a minute or more between two things the player did, and where it happened
  const touch = () => {
    const t = now();
    if (L.last && t - L.last >= STALL) push(L.stalls, { at: sec(L.last - L.t0), secs: sec(t - L.last), ...where() });
    L.last = t;
  };

  // an event on screen: note when it first showed, so the answer can say how long it was read
  const watchEvent = () => {
    const q = A.S && A.S.queue && A.S.queue[0];
    const id = q && q.type === 'event' ? String(q.ev || '') : '';
    if (id && (!L.shown || L.shown.id !== id || L.shown.q !== q)) L.shown = { id, q, t: now() };
  };

  document.addEventListener('click', e => {
    if (!L.on) return;
    const el = e.target && e.target.closest ? e.target.closest('[data-a]') : null;
    touch();
    if (!el) return;
    const a = el.getAttribute('data-a'), v = (el.getAttribute('data-v') || '').slice(0, 40);
    L.counts[a] = (L.counts[a] || 0) + 1;
    push(L.acts, { at: sec(now() - L.t0), a, v, ...where() });
    if (a === 'tab') L.tabs[v] = (L.tabs[v] || 0) + 1;
    if (a === 'evChoose' && L.shown) {
      // the label as the player saw it on the button (odds and all), not from the engine's view of the event
      push(L.events, { at: sec(now() - L.t0), ev: L.shown.id, choice: +v, label: [...el.childNodes].map(n => n.textContent).join(' ').replace(/\s+/g, ' ').trim().slice(0, 100), read: sec(now() - L.shown.t), year: A.S ? A.S.year : null });
      L.shown = null;
    }
  }, true);
  document.addEventListener('keydown', () => { if (L.on) touch(); }, true);

  // errors the page raised during the session: uncaught ones, and the ones features catch and report with console.error
  const err = (kind, msg) => { if (L.on) push(L.errors, { at: sec(now() - L.t0), kind, msg: String(msg || '').slice(0, 300), ...where() }); };
  window.addEventListener('error', e => err('error', (e.error && e.error.stack) || e.message));
  window.addEventListener('unhandledrejection', e => err('rejection', e.reason && (e.reason.stack || e.reason)));
  const ce = console.error;
  console.error = function () { try { err('console', [...arguments].map(x => (x && x.stack) || String(x)).join(' ')); } catch (e) {} return ce.apply(this, arguments); };

  // what goes in the results file
  L.report = function () {
    watchEvent();
    const t = now();
    return { secs: sec(t - L.t0), actions: L.acts.length, counts: L.counts, tabs: L.tabs, events: L.events, stalls: L.stalls, errors: L.errors,
      lastActions: L.acts.slice(-30), stoppedAt: where(), truncated: L.acts.length >= MAX };
  };

  // the playtest's own start and stop
  const start = UI.ptStart;
  UI.ptStart = function () { const r = start.apply(this, arguments); L.start(); return r; };
  if (UI.A && UI.A.ptQuit) { const quit = UI.A.ptQuit; UI.A.ptQuit = function () { L.stop(); return quit.apply(this, arguments); }; }
  // an event that appears is noticed when the modal draws it
  const rm = UI.renderModal;
  if (typeof rm === 'function') UI.renderModal = function () { const r = rm.apply(this, arguments); if (L.on) watchEvent(); return r; };
})();
