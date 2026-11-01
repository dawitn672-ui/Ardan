// 99992-v2-time: v2 step 3 (docs/v2/V2_SPEC.md complaints 1, 2, 7 and 8). One button moves time.
//
// Engine (deterministic, A.rand only):
// - The month's director (A.monthEvents) draws 0 to 3 scenes with season weights, scaled by the stage of life, from
//   the release's own roll (A.rollEventsN), and spreads them over the days of the month (A.schedule), so a Next month
//   meets them one at a time as the days pass. Scenes already due this month (a scheduled return, the year's events)
//   count toward the three.
// - A quiet month (no card of any kind reached the player since the last month's turn, and none waiting) writes one
//   line to the story at the turn: the line the player's toast shows. Kept in S.v2t = { turn, last, quiet }.
// - 81-pacing's quiet-season floor is off: it drew a scene after a quiet stretch, which is the filler v2 removes.
//
// Interface (pure: reads A.S, never A.rand):
// - The clock is the date, initiative and one big "Next month" (84-top-bar's month step, run in slices). Play, the
//   speeds, the release's Next, Quiet living, Week / Season / Until and the war room's own clock are gone.
// - On campaign (your own army on the march or at a siege while at war, or on the road) the clock offers "Next day"
//   and "Next week" instead, with the host's standing orders beside them. A battle stops the clock.
// - A quiet month ends with a 2-second toast of its line, never a card. 84's "This month" card is gone.
// - Five places at most: Life, You, Family, World, and War only while at war (complaint 2).
// - 96-moments' new-year cut-in is gone (a card for nothing); births, deaths, crowns and the rest stay.
(function () {
  if (typeof A === 'undefined') return;
  const V2T = A.V2T = A.V2T || {};
  const MS = () => A.MONTH_START;

  // ---- calendar -------------------------------------------------------------------------------------------------------
  // the month a day of the year falls in (0-11); warClock 365 (the year's last tick before the turn) is December
  V2T.monthOf = function (wc) { const ms = MS(); let m = 0; const d = Math.min(364, Math.max(0, wc | 0)); for (let i = 0; i < 12; i++) if (ms[i] <= d) m = i; return m; };
  // where Next month ends: the turn of the next calendar month (the tick that runs its hooks and draws its scenes).
  // From any day of a month, so a save made mid-week goes on to the start of the next month, never past it.
  V2T.nextTurn = function () {
    const S = A.S, wc = S.warClock || 0, m = V2T.monthOf(wc);
    return m < 11 ? S.year * 365 + MS()[m + 1] + 1 : (S.year + 1) * 365 + MS()[0] + 1;
  };
  V2T.SEASON = m => (m === 11 || m <= 1 ? 'winter' : m <= 4 ? 'spring' : m <= 7 ? 'summer' : 'autumn');
  V2T.MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // ---- the month's director ----------------------------------------------------------------------------------------
  // weights of 0, 1, 2 and 3 scenes in a month, by season: the roads shut in winter, the fairs and the musters of summer
  V2T.W = { winter: [62, 30, 7, 1], spring: [55, 32, 10, 3], summer: [50, 33, 13, 4], autumn: [55, 32, 10, 3] };
  // the stage of life scales how much of that falls to you (an infant's world is a cradle)
  V2T.STAGE = { infant: 0.15, child: 0.55, teen: 0.85, adult: 0.75, old: 0.7 };
  V2T.MAX = 3;
  V2T.st = function () {
    const S = A.S; if (!S) return null;
    if (!S.v2t || typeof S.v2t !== 'object') S.v2t = { turn: null, last: null, quiet: null };
    return S.v2t;
  };
  V2T.weights = function (pc, m) {
    const w = V2T.W[V2T.SEASON(m)], f = V2T.STAGE[A.stage ? A.stage(pc) : 'adult'] || 0.75;
    return [100 - f * (100 - w[0]), f * w[1], f * w[2], f * w[3]];
  };
  // scenes already due before the next turn (a scheduled return, the year's events spread over its months)
  V2T.dueThisMonth = function () {
    const S = A.S, end = V2T.nextTurn();
    let n = 0; for (const s of S.sched || []) if (s && s.at < end && s.item && s.item.type === 'event') n++;
    return n;
  };
  V2T.director = function (pc) {
    const S = A.S;
    if (!pc.alive || (pc.prison && A.chance(0.6))) return 0;
    if (A.age(pc) < 1) return 0;
    const m = V2T.monthOf(S.warClock || 0), wt = V2T.weights(pc, m);
    let n = A.wpick([0, 1, 2, 3], i => wt[i]) || 0;
    n = Math.min(n, Math.max(0, V2T.MAX - V2T.dueThisMonth()));
    if (!n) return 0;
    const before = S.queue.length;
    A.rollEventsN(pc, n);
    const fresh = S.queue.splice(before);
    // spread over the month: a day each, in order, so the cards come one at a time as the days pass
    const span = Math.max(2, V2T.nextTurn() - A.absDay() - 2);
    const days = fresh.map(() => A.ri(1, span)).sort((a, b) => a - b);
    fresh.forEach((q, i) => {
      if (q && q.type === 'event') { A.schedule(q, days[i]); delete q.lfFrom; } else S.queue.push(q);
    });
    return fresh.length;
  };
  // the line a quiet month leaves in the story (A.pick: the engine's own stream, so a replay writes the same words)
  V2T.QUIET = {
    infant: ['You sleep, eat and grow.', 'A month of milk and sleep.'],
    child: ['A month of chores and games.', 'Nothing much happens. You grow a little.', 'You run errands and get under feet. A quiet month.'],
    winter: ['Snow on the thatch, and little else. A quiet month.', 'A cold month. You keep near the fire.', 'The roads are shut, and nothing comes up them.'],
    spring: ['Mud, then green. A quiet month.', 'The ploughing month passes without news.', 'Rain and work. Nothing of note.'],
    summer: ['Long days, and nothing out of the common way.', 'Dust and work. The month goes by.', 'A hot, quiet month.'],
    autumn: ['The harvest month passes without a word worth telling.', 'Leaves down, stores up. A quiet month.', 'Short days and long evenings. Nothing of note.'],
  };
  V2T.quietLine = function (pc, m) {
    const st = A.stage ? A.stage(pc) : 'adult';
    const L = st === 'infant' ? V2T.QUIET.infant : st === 'child' ? V2T.QUIET.child : V2T.QUIET[V2T.SEASON(m)];
    return A.pick(L);
  };
  A.monthEvents = function (pc) {
    const S = A.S, st = V2T.st();
    if (!pc || !st) return;
    // the month that ends here was quiet if nothing reached you since the last turn and nothing is waiting now
    try {
      const waiting = S.queue.some(q => q && q.type !== 'warroom');
      if (pc.alive && st.turn != null && !(st.last > st.turn) && !waiting) {
        const prev = (V2T.monthOf(S.warClock || 0) + 11) % 12, t = V2T.quietLine(pc, prev);
        A.log(t, '');
        st.quiet = { d: A.absDay(), t };
      }
    } catch (e) { console.error('v2 quiet month', e); }
    st.turn = A.absDay();
    try { V2T.director(pc); } catch (e) { console.error('v2 director', e); }
  };
  if (A.PACE) A.PACE.FLOOR_OFF = true;
  // a card reached the player: the head of the queue, the first time it is ready (every card passes here)
  const head0 = A.headReady;
  A.headReady = function () {
    const h = head0.apply(this, arguments);
    try { if (h && !h.v2c && h.type !== 'warroom') { h.v2c = 1; const st = V2T.st(); if (st) st.last = A.absDay(); } } catch (e) {}
    return h;
  };
  // an old save has no S.v2t: it starts counting at its first turn
  const des = A.deserialize;
  if (typeof des === 'function') A.deserialize = function () { const r = des.apply(this, arguments); try { V2T.st(); } catch (e) {} return r; };

  // ---- faith only for the devout (complaint 7) ------------------------------------------------------------------------
  // born to the clergy, in holy orders, or a life that took it up (piety raised well above the common 30). The stats lane
  // owns piety itself; this decides only which aims may push faith.
  V2T.devout = function (p) {
    if (!p) return false;
    if (p.job && p.job.c === 'clergy') return true;
    for (const k of ['father', 'mother']) { const q = p[k] != null && A.P ? A.P(p[k]) : null; if (q && q.job && q.job.c === 'clergy') return true; }
    if (p.flags && (p.flags.v2_faith || p.flags.took_vows)) return true;
    return (p.piety || 0) >= 60;
  };
  try {
    const F = A.LF && A.LF.AMB && A.LF.AMB.faith;
    if (F && typeof F.fit === 'function') { const fit0 = F.fit; F.fit = function (p) { return V2T.devout(p) ? fit0.apply(this, arguments) : 0; }; }
  } catch (e) { console.error('v2 faith ambition', e); }

  // ---- campaign: the player's own road or host ----------------------------------------------------------------------
  V2T.ownDivs = function (pc) {
    const out = [];
    if (!pc || !A.divById) return out;
    if (pc.mil && pc.mil.div) { const d = A.divById(pc.mil.div); if (d) out.push(d); }
    for (const a of A.S.armies || []) if (a && (a.gen === pc.id || (pc.ruler && a.realm === pc.ruler))) for (const d of A.armyDivs(a)) if (!out.includes(d)) out.push(d);
    return out;
  };
  V2T.atWar = function (pc) {
    if (!pc || !A.S || !A.atWar) return false;
    const rid = pc.ruler || pc.realm;
    if (A.atWar(rid).length) return true;
    const ctr = (pc.mil && pc.mil.contract) || (pc.company && pc.company.contract);
    return !!(ctr && A.atWar(ctr).length);
  };
  V2T.campaign = function (pc) {
    pc = pc || (A.S && A.pc());
    if (!pc || !pc.alive) return null;
    try {
      const JR = A.JR;
      if (JR && JR.on && JR.on(pc) && !pc.journey.there) return { k: 'road', text: JR.statusLine ? JR.statusLine(pc) : 'On the road.' };
    } catch (e) {}
    if (!V2T.atWar(pc)) return null;
    let march = 0, siege = 0;
    for (const d of V2T.ownDivs(pc)) { if (d.sieging) siege++; else if ((d.path && d.path.length) || d.atk != null) march++; }
    if (siege) return { k: 'siege', text: siege > 1 ? `${siege} of your divisions sit before enemy walls.` : 'Your host sits before enemy walls.' };
    if (march) return { k: 'march', text: march > 1 ? `${march} of your divisions are on the march.` : 'Your host is on the march.' };
    return null;
  };

  // ---- the interface -------------------------------------------------------------------------------------------------
  if (typeof UI === 'undefined' || !UI.A) return;
  const ST = UI.stepper;
  const ui = V2T.ui = { on: false, kind: null, from: 0, stopAfter: false, toasts: [] };
  const esc = s => UI.esc(s);
  const icon = (k, c) => { try { return UI.icon(k, c || 's'); } catch (e) { return ''; } };

  // the steps: a month, or (on campaign) a day or a week
  if (UI.STEP_NAME) Object.assign(UI.STEP_NAME, { day: 'Next day', week: 'Next week', month: 'Next month' });
  UI.stepPlan = function () { return V2T.campaign() ? ['day', 'week'] : ['month', 'month']; };
  const target0 = UI.stepTarget;
  UI.stepTarget = function (kind) {
    if (kind === 'day') return A.absDay() + 1;
    if (kind === 'month') return V2T.nextTurn();
    return target0.apply(this, arguments);
  };
  // the toast, not a card, says what a quiet step brought
  UI.stepSumHtml = () => '';
  // a continuous clock no longer exists: nothing can start it (the war room's battles still stop a step through clkStop)
  UI.clkStart = function () { if (UI.clk) UI.clk.run = false; };
  UI.clkToggle = function () {};
  if (UI.clk) { UI.clk.quiet = false; UI.clk.run = false; }

  const busy = () => { const S = A.S, pc = A.pc && A.pc(); return !S || !pc || !pc.alive || !!S.queue.length; };
  const why = () => { const pc = A.pc(); return !pc || !pc.alive ? 'Your life is over.' : 'Something needs you first.'; };
  const start = kind => {
    if (busy()) { if (A.S && A.S.queue.length && A.headReady()) UI.refresh(); else UI.toast(why()); return; }
    if (ST && ST.run) return;
    const camp = V2T.campaign();
    if (kind === 'month' && camp) return UI.toast('You are on campaign: go a day or a week at a time.');
    if (kind !== 'month' && !camp) kind = 'month';
    Object.assign(ui, { on: true, kind, from: A.absDay(), stopAfter: false });
    UI.stepStart(kind);
  };
  V2T.next = () => start('month');
  for (const k of ['clkPlay', 'clkSpeed', 'clkSkip', 'clkQuiet', 'stepWeek', 'stepSeason', 'stepUntil', 'stepSpeed', 'phSpeed', 'wrRun', 'wrClkSpeed', 'wrStep']) delete UI.A[k];
  Object.assign(UI.A, {
    v2Next() { start('month'); },
    v2Day() { start('day'); },
    v2Week() { start('week'); },
    // What now's "live the next month" (97-life-fixes) names the month step
    stepMonth() { start('month'); },
  });
  Object.assign(UI.C, {
    v2Tac(el) {
      const k = el.dataset.k, v = el.value;
      if ((k !== 'atk' && k !== 'def') || !(v === 'auto' || (A.WTAC && A.WTAC[v]))) return;
      A.setTac(k, v);
      UI.toast(v === 'auto' ? 'Your commanders will choose.' : `Standing order: ${A.WTAC[v].n}.`);
      UI.clkPaint();
    },
  });
  // What now's step names the month, or the day on campaign
  const wn = A.whatNow;
  if (typeof wn === 'function') A.whatNow = function () {
    const L = wn.apply(this, arguments);
    try {
      if (Array.isArray(L)) for (const x of L) if (x && Array.isArray(x.act) && /^(step(Week|Month|Season|Until)|clkPlay|clkSkip)$/.test(x.act[0])) {
        const camp = V2T.campaign();
        x.t = camp ? 'Go on a day' : 'Live the next month';
        x.why = camp ? camp.text : 'Nothing presses. The month runs on and stops when something needs you.';
        x.act = [camp ? 'v2Day' : 'v2Next', ''];
      }
    } catch (e) { console.error('v2 what now', e); }
    return L;
  };

  // a battle (or a duel, or the old campaign map) stops the clock: the step ends when it is closed
  const STOPS = ['battle', 'duel', 'campaign', 'warroom'];
  const go0 = UI.stepGo;
  UI.stepGo = function () {
    if (ui.stopAfter && ST && ST.run) { ui.stopAfter = false; return UI.stepStop(); }
    return go0.apply(this, arguments);
  };
  // the end of a step: a quiet one says so in a toast of two seconds (never a card)
  V2T.quietToast = function (text) {
    const TS = UI.TOASTS, keep = TS ? TS.MS : 0;
    try { if (TS) TS.MS = 2000; UI.toast(text, 2000); } finally { if (TS) TS.MS = keep; }
    ui.toasts.push(text); if (ui.toasts.length > 20) ui.toasts.shift();
  };
  const ended = () => {
    if (!ui.on || !ST || ST.run) return;
    ui.on = false; ui.stopAfter = false;
    const pc = A.pc && A.pc(); if (!pc || !pc.alive) return;
    if (ST.hit || (A.S && A.S.queue.length)) return;
    const q = V2T.st() && V2T.st().quiet, now = A.absDay();
    let t;
    if (ui.kind === 'month') t = q && q.d > ui.from && q.d <= now ? q.t : 'The month passes.';
    else { const c = V2T.campaign(); t = `${ui.kind === 'day' ? 'A day' : 'A week'} passes.${c ? ' ' + c.text : ''}`; }
    V2T.quietToast(t);
  };
  const watch = name => {
    const f = UI[name];
    if (typeof f === 'function') UI[name] = function () {
      try {
        if (ui.on && ST && ST.run && ST.wait) { const h = A.S && A.S.queue[0]; if (h && STOPS.includes(h.type)) ui.stopAfter = true; }
      } catch (e) {}
      const r = f.apply(this, arguments);
      try { ended(); } catch (e) { console.error('v2 step end', e); }
      return r;
    };
  };
  watch('refresh'); watch('clkPaint');

  // ---- the clock: the date, initiative, and the one control that moves time --------------------------------------------
  V2T.controlsHtml = function () {
    const pc = A.pc && A.pc(); if (!pc) return '';
    const camp = V2T.campaign(pc), dis = busy() && !(ST && ST.wait), running = ST && ST.run;
    const span = Math.max(1, (ST ? ST.to - ST.from : 1)), frac = running ? Math.min(1, Math.max(0, (A.absDay() - ST.from) / span)) : 0;
    const prog = `<span class="clk-prog" aria-hidden="true"><i style="transform:scaleX(${frac.toFixed(3)})"></i></span>`;
    const btn = (act, kind, label, key, primary) => {
      const mine = running && ST.kind === kind;
      if (mine && ST.wait) return `<button class="v2-step${primary ? ' primary' : ''} run" data-a="stepGo" title="Go on when this is settled">${icon('play')}<span>Go on</span>${prog}</button>`;
      if (mine) return `<button class="v2-step${primary ? ' primary' : ''} run" data-a="stepStop" aria-label="Stop here">${icon('pause')}<span>${esc(kind === 'month' ? 'The month passes' : kind === 'week' ? 'A week passes' : 'A day passes')}</span>${prog}</button>`;
      return `<button class="v2-step${primary ? ' primary' : ''}" data-a="${act}"${dis ? ' aria-disabled="true"' : ''} aria-keyshortcuts="${key}" title="${esc(dis ? why() : label + ' (key ' + key + ')')}">${icon(kind === 'month' ? 'step-moon' : kind === 'week' ? 'calendar' : 'sun')}<span>${esc(label)}</span>${running ? prog : ''}</button>`;
    };
    if (!camp) return `<span class="v2-time" role="group" aria-label="Time">${btn('v2Next', 'month', 'Next month', 'N', true)}</span>`;
    let orders = '';
    if (camp.k !== 'road' && (pc.ruler || (pc.mil && pc.mil.rank >= 4)) && A.WTAC) {
      const T = pc.tac || { atk: 'auto', def: 'auto' };
      const sel = (side, label) => `<label class="v2-ord"><span>${label}</span><select data-c="v2Tac" data-k="${side}" aria-label="Standing order ${label.toLowerCase()}"><option value="auto"${T[side] === 'auto' ? ' selected' : ''}>Commanders choose</option>` +
        Object.keys(A.WTAC).filter(k => !A.WTAC[k].side || A.WTAC[k].side === side).map(k => `<option value="${esc(k)}"${T[side] === k ? ' selected' : ''}>${esc(A.WTAC[k].n)}</option>`).join('') + '</select></label>';
      orders = `<span class="v2-orders" role="group" aria-label="Standing orders">${sel('atk', 'Attacking')}${sel('def', 'Defending')}</span>`;
    }
    return `<span class="v2-time v2-camp" role="group" aria-label="Time on campaign">${btn('v2Day', 'day', 'Next day', 'D', false)}${btn('v2Week', 'week', 'Next week', 'W', true)}` +
      `<span class="v2-camp-note tiny">${esc(camp.text)}</span>${orders}</span>`;
  };
  UI.stepHtml = V2T.controlsHtml;
  // the date by month: time is lived a month at a time (on campaign, by the day)
  V2T.dateHtml = function () {
    const S = A.S, m = V2T.monthOf(S.warClock || 0);
    return V2T.campaign() ? A.dateStr() : `${V2T.MONTHS[m]} ${S.year}`;
  };
  const KEEP = ['clk-date', 'clk-ini', 'ph-stat', 'ph-dock', 'v2-time'];
  const clkHtml = UI.clkHtml;
  UI.clkHtml = function () {
    const h = clkHtml.apply(this, arguments);
    if (!A.S || !A.pc || !A.pc() || typeof document === 'undefined') return h;
    try {
      if (UI.clk) { UI.clk.quiet = false; UI.clk.run = false; }
      const t = document.createElement('template'); t.innerHTML = h;
      const clk = t.content.querySelector('#clk'); if (!clk) return h;
      let mine = clk.querySelector('.v2-time');
      if (!mine) { const b = document.createElement('template'); b.innerHTML = V2T.controlsHtml(); mine = b.content.firstElementChild; }
      const dock = clk.querySelector('.ph-dock');
      // only the date, initiative and the one control stay
      for (const box of [clk, dock]) {
        if (!box) continue;
        for (const n of [...box.childNodes]) {
          if (n.nodeType === 3) { if (!n.textContent.trim()) continue; n.remove(); continue; }
          if (n.nodeType !== 1) { n.remove(); continue; }
          if (!KEEP.some(c => n.classList.contains(c))) n.remove();
        }
      }
      const dt = clk.querySelector(':scope > .clk-date');
      if (mine) { if (dock) dock.appendChild(mine); else if (dt) dt.after(mine); else clk.appendChild(mine); }
      const d = clk.querySelector('.clk-date b'); if (d) d.textContent = V2T.dateHtml();
      clk.classList.add('v2-clk');
      clk.setAttribute('aria-label', 'Time');
      if (ST && ST.run) clk.setAttribute('aria-busy', ST.wait ? 'false' : 'true'); else clk.removeAttribute('aria-busy');
      return t.innerHTML;
    } catch (e) { console.error('v2 clock', e); return h; }
  };

  // ---- the war room: its Play, speeds and Week give way to the same steps --------------------------------------------
  const wrm = UI.warRoomModal;
  if (typeof wrm === 'function') UI.warRoomModal = function () {
    const h = wrm.apply(this, arguments);
    if (typeof document === 'undefined' || typeof h !== 'string') return h;
    try {
      const t = document.createElement('template'); t.innerHTML = h;
      const box = t.content.querySelector('.wr-time'); if (!box) return h;
      box.innerHTML = V2T.controlsHtml().replace(/<span class="v2-orders"[\s\S]*<\/span><\/span>$/, '</span>');
      return t.innerHTML;
    } catch (e) { console.error('v2 war room time', e); return h; }
  };

  // ---- keys: N or M is Next month; on campaign D a day and W a week. Space and 1 to 5 no longer run a clock. -----------
  if (typeof window !== 'undefined') window.addEventListener('keydown', e => {
    if (UI.screen !== 'game' || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = (e.key || '').toLowerCase();
    if (!['n', 'm', 'w', 'd', ' ', '1', '2', '3', '4', '5'].includes(k)) return;
    const tg = e.target, tag = tg && tg.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (tg && tg.isContentEditable)) return;
    const modal = !!UI.$('#modal'), room = UI.ov && UI.ov.type === 'warroom' && !(A.S && A.S.queue.length);
    if (modal && !room) return;                       // a card's own keys (1 to 4, Enter) stay its own
    if (k === ' ' && tag === 'BUTTON') return;        // Space presses a focused button, as it should
    e.preventDefault(); e.stopImmediatePropagation();
    if (e.repeat) return;
    const camp = V2T.campaign();
    if (k === 'n' || k === 'm') { if (ST && ST.run && !ST.wait) UI.stepStop(); else if (camp) start('week'); else start('month'); }
    else if (k === 'w' && camp) start('week');
    else if (k === 'd' && camp) start('day');
  }, true);

  // ---- five places at most (complaint 2) ------------------------------------------------------------------------------
  // Life (Now, Decisions; on a phone Story too), You (on a phone your profile; your path and holdings), Family (people
  // and the dynasty), World (the realm, the world, the Book, places, the codex), and War only while your realm is at
  // war. In peace your arms (the army's ladder, the war room) sit under You.
  const known = new Map();
  for (const g of UI.GROUPS || []) for (const [k, n] of g.subs || []) if (!known.has(k)) known.set(k, n);
  for (const g of Object.values(UI.PHONE_SUBS || {})) for (const [k, n] of g) if (!known.has(k)) known.set(k, n);
  V2T.PLACE = { life: 'life', goals: 'life', story: 'life', you: 'you', path: 'you', holdings: 'you', people: 'family', legacy: 'family', realm: 'world', book: 'world', world: 'world', atlas: 'world', codex: 'world', war: 'war' };
  const ORDER = ['life', 'story', 'goals', 'you', 'path', 'holdings', 'people', 'legacy', 'realm', 'world', 'book', 'atlas', 'codex', 'war'];
  const keys = [...new Set(ORDER.filter(k => known.has(k) || k === 'story' || k === 'you').concat([...known.keys()]))];
  const NAME = { life: 'Now', story: 'Story', goals: 'Decisions', you: 'You', people: 'People', legacy: 'Dynasty', war: 'War' };
  const nm = k => NAME[k] || known.get(k) || k;
  V2T.groups = function () {
    const pc = A.S && A.pc ? A.pc() : null, war = !!(pc && V2T.atWar(pc));
    const of = (place, phone) => keys.filter(k => (V2T.PLACE[k] || 'world') === place && (phone || (k !== 'story' && k !== 'you'))).map(k => [k, nm(k)]);
    const you = of('you', false), youP = of('you', true);
    if (!war) { you.push(['war', 'Arms']); youP.push(['war', 'Arms']); }
    const G = [
      { k: 'life', name: 'Life', icon: 'sun', subs: of('life', false) },
      { k: 'you', name: 'You', icon: 'mirror', subs: you },
      { k: 'family', name: 'Family', icon: 'people', subs: of('family', false) },
      { k: 'world', name: 'World', icon: 'crown', subs: of('world', false) },
    ];
    if (war) G.push({ k: 'war', name: 'War', icon: 'swords', subs: [['war', 'War']] });
    UI.GROUPS.length = 0; UI.GROUPS.push(...G);
    UI.PHONE_SUBS = { life: of('life', true), you: youP };
    return G;
  };
  V2T.groups();
  for (const name of ['render', 'refresh', 'refreshTab', 'setTab', 'renderTabBar', 'renderGroupBar']) {
    const f = UI[name];
    if (typeof f === 'function') UI[name] = function () { try { V2T.groups(); } catch (e) { console.error('v2 places', e); } return f.apply(this, arguments); };
  }
  // a tap on a group opens its first page if the last one seen there has moved away (War at peace goes under You)
  const grp = UI.A.group;
  if (typeof grp === 'function') UI.A.group = function (v) {
    try { V2T.groups(); const g = UI.GROUPS.find(x => x.k === v); if (g && UI.lastSub[v] && !UI.subsOf(g).some(s => s[0] === UI.lastSub[v])) delete UI.lastSub[v]; } catch (e) {}
    return grp.apply(this, arguments);
  };

  // ---- 96-moments: no cut-in for the new year (a card that says only the date) ---------------------------------------
  const MO = UI.MOMENTS;
  if (MO && typeof MO.found === 'function') { const found = MO.found; MO.found = function () { const r = found.apply(this, arguments); return Array.isArray(r) ? r.filter(x => x && x.k !== 'year') : r; }; }

  // ---- the look ------------------------------------------------------------------------------------------------------
  const css = [
    '[hidden]{display:none!important}',
    '#clk.v2-clk{align-items:center}',
    '#clk .v2-time{display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap}',
    '#clk .v2-step{position:relative;min-height:44px;padding:0 18px;font-weight:700;font-size:calc(15px * var(--tx,1));white-space:nowrap;display:inline-flex;align-items:center;gap:6px}',
    '#clk .v2-step.primary{min-width:150px;justify-content:center}',
    '#clk .v2-step[aria-disabled=true]{opacity:.55;cursor:not-allowed}',
    '#clk .v2-camp-note{color:var(--ink-2);max-width:260px;white-space:normal;line-height:1.25}',
    '#clk .v2-orders{display:inline-flex;gap:6px}',
    '#clk .v2-ord{display:inline-flex;flex-direction:column;font-size:11px;color:var(--ink-3)}',
    '#clk .v2-ord select{min-height:32px;max-width:150px}',
    // the phone: one big button under the thumb, above the tab bar
    '#game.phone #clk .ph-dock{display:flex;gap:8px;align-items:stretch}',
    '#game.phone #clk .ph-dock .v2-time{display:flex;flex:1 1 auto;gap:8px;flex-wrap:wrap}',
    '#game.phone #clk .ph-dock .v2-step{flex:1 1 0;min-height:56px;font-size:calc(17px * var(--tx,1));justify-content:center}',
    '#game.phone #clk .ph-dock .v2-camp-note{flex:1 1 100%;order:3;max-width:none;font-size:13px}',
    '#game.phone #clk .ph-dock .v2-orders{flex:1 1 100%;order:4}',
    '#game.phone #clk .ph-dock .v2-ord select{min-height:44px;max-width:none;width:100%}',
    '#game.phone #clk .ph-dock .v2-ord{flex:1 1 0}',
    '.warroom .wr-time .v2-time{display:inline-flex;gap:6px;align-items:center}.warroom .wr-time .v2-camp-note{font-size:12px;color:var(--ink-2)}',
  ].join('');
  const put = () => { if (typeof document === 'undefined' || document.getElementById('v2t-style')) return; const s = document.createElement('style'); s.id = 'v2t-style'; s.textContent = css; document.head.appendChild(s); };
  if (typeof document !== 'undefined') { if (document.head) put(); else document.addEventListener('DOMContentLoaded', put); }
})();
