// 97-life-fixes, part 2: hints follow the life, not the calendar.
//
// The release switched every hint off ten game years after 1105 (UI.hintsOn: A.S.year < 1105 + UI.HINT_YEARS). A life
// begun at birth comes of age in 1121, so the two adult hints ("You have initiative to spend", "Hover or tap your
// fighting worth") could never show, nor any hint for a tab first opened after the age of ten. Each hint already shows
// once per browser (UI.set.hintsSeen) and only when its own condition holds (its `when`). So:
// - UI.hintsOn no longer reads the year: hints are on unless the player turned them off (Menu, the setting).
// - A hint shows at its first encounter: the first time its tab is open and its condition holds, at whatever age.
//   The adult ones come on coming of age; a tab's hint comes the first time the tab is opened.
// - The one hint tied to a date ("The game saves itself every year", from 1107) is tied to the life instead: two
//   years after it began (A.S.lf.start, set at the start of a game; a save without it falls back to the old date).
(function () {
  const LF = A.LF = A.LF || {};
  UI.hintsOn = () => UI.set.hints !== false && !!A.S;
  const newGame = A.newGame;
  A.newGame = function () {
    const r = newGame.apply(this, arguments);
    try { const S = A.S; if (!S.lf || typeof S.lf !== 'object') S.lf = {}; S.lf.start = S.year; } catch (e) { console.error('hints start', e); }
    return r;
  };
  LF.lifeYears = () => { const S = A.S; return S && S.lf && typeof S.lf.start === 'number' ? S.year - S.lf.start : S ? S.year - 1105 : 0; };
  for (const H of UI.HINTS || []) if (H.id === 'save') H.when = () => LF.lifeYears() >= 2;
})();

// Cycle 1 (first-hour B1, B4, I5): the hints teach the Week and Month steps, sit beside what they explain and never
// over it, and go once their control has been used; How to play opens on the first hour; a first life sees six
// activities, not thirty-one, and an activity answers where it was pressed.
//
// What the review saw: the hint "What now lists the three things..." was drawn over the What now list (91-look floats
// it at the top of the Life tab), hid its first two items, and stayed eleven months because only Skip dismissed it.
// The next one taught "Press Play (or Space)... Next jumps ahead", the clock the step rhythm demoted, and it caught
// the clicks meant for the activity under it. How to play ran to 998 words and never named Week or Month.
//
// None of it touches the world: hints, How to play and the activity note are drawn from the state and kept in UI and
// the browser's settings (UI.set), never in A.S.
(function () {
  if (typeof UI === 'undefined' || !UI.HINTS) return;
  const coarse = () => { try { return !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches); } catch (e) { return false; } };
  const key = k => coarse() ? '' : ` (${k})`;
  const H = id => UI.HINTS.find(h => h.id === id);
  // the two steps the clock offers now (84-top-bar's UI.stepPlan: a season under five, "until something happens" after
  // two empty steps in a childhood), so the hint names the buttons the player sees
  const stepWords = () => {
    const plan = UI.stepPlan ? UI.stepPlan() : ['week', 'month'];
    const W = { week: 'Week', month: 'Month', season: 'Season', until: 'Until something happens' };
    const span = { week: 'a shorter step', month: 'a month', season: 'a season, three months', until: 'until something needs you' };
    return `Press <b>${W[plan[1]]}</b>${key('M')} to live ${plan[1] === 'month' ? 'the next month' : span[plan[1]]}, or <b>${W[plan[0]]}</b>${key('W')} for ${plan[0] === 'week' ? 'a shorter step' : span[plan[0]]}. A step stops whenever something needs you.`;
  };
  // the texts, for the steps (none names Play, Space or Next)
  const TEXT = {
    clock: stepWords,
    whatnow: () => '<b>What now</b>, just above, lists the three things most worth doing. One click does each.',
    plan: () => 'Your <b>plan</b>, just above, decides what your free hours build. Pick a training focus: it grows a little every day.',
    initiative: () => 'Each activity below costs <b>initiative ⧗</b>, which builds up week by week. Try one.',
    tips: () => `Underlined words explain themselves. ${coarse() ? 'Tap' : 'Hover over'} your <b>fighting worth</b> (on a phone: Life → You) to see where it comes from.`,
    event: () => `Each choice shows your <b>odds</b>, set by your stats and skills.${coarse() ? '' : ' Keys 1 to 6 choose too.'}`,
    save: () => 'The game saves itself every year. <b>Menu → Export</b> keeps a copy as a file; <b>Menu → Report a problem</b> if something breaks.',
  };
  for (const [id, f] of Object.entries(TEXT)) { const h = H(id); if (h) h.textFn = f; }
  // the clock's hint is the clock's own: it sits under the step buttons, not in the tab, and comes first; the tab's
  // hints wait until a step has been taken or the hint put away
  const clk = H('clock');
  if (clk) { clk.where = 'clock'; const i = UI.HINTS.indexOf(clk); UI.HINTS.splice(i, 1); UI.HINTS.unshift(clk); }
  const clockDue = () => !!clk && UI.hintsOn() && !UI.hintSeen('clock') && !UI.hintUsed.clock;
  const hintFor = UI.hintFor;
  UI.hintFor = function (where, pc) { if (where !== 'clock' && where !== 'event' && clockDue()) return null; return hintFor.apply(this, arguments); };

  // a control used retires its hint at once: a step taken (button or key) retires the clock's
  const note = UI.hintNote;
  UI.hintNote = function (a) {
    if (/^step(Week|Month|Season|Until|Go)$/.test(a || '')) UI.hintUsed.clock = 1;
    if (a === 'wn') UI.hintUsed.wn = 1;
    return note ? note.apply(this, arguments) : undefined;
  };
  // and a hint that has stood through three steps unanswered goes too: it has been read, or it is not wanted
  UI.HINT_STEPS = 3;
  const shown = new Set();
  const stepStart = UI.stepStart;
  if (typeof stepStart === 'function') UI.stepStart = function () {
    try {
      UI.hintUsed.clock = 1; if (!UI.hintSeen('clock')) UI.hintMark('clock');
      const n = UI.set.hintSteps = UI.set.hintSteps || {};
      for (const id of shown) { n[id] = (n[id] || 0) + 1; if (n[id] >= UI.HINT_STEPS) UI.hintMark(id); }
    } catch (e) { console.error('hint steps', e); }
    return stepStart.apply(this, arguments);
  };

  // where each hint of the Life tab goes: just after the thing it explains (or before it, for the activities), in the
  // flow of the page, so it pushes the page down instead of lying over it
  const ANCHOR = { whatnow: ['.whatnow', 'after'], plan: ['.plan-card', 'after'], initiative: ['.fold-acts, .group-h, .acts', 'before'], tips: ['.lk-ini, .moods', 'after'] };
  const box = (Hh, cls) => {
    const t = Hh.textFn ? Hh.textFn() : Hh.text;
    return `<div class="hint hint-at${cls ? ' ' + cls : ''}" role="note" aria-label="Hint" data-hint="${UI.esc(Hh.id)}"><span class="hint-ic" aria-hidden="true">${UI.icon('sparkles', 's')}</span>` +
      `<span class="hint-t">${t}</span><button class="small ghost" data-a="hintDone" data-v="${UI.esc(Hh.id)}" aria-label="Got it: put this hint away">Got it</button></div>`;
  };
  UI.hintBox = function (where, pc, float) {
    const Hh = UI.hintFor(where, pc);
    if (!Hh) return '';
    shown.add(Hh.id);
    return box(Hh, float ? 'hint-ev' : '');
  };
  // the tab: the hint the release put at its head moves beside its anchor
  const renderTab = UI.renderTab;
  UI.renderTab = function () {
    for (const id of [...shown]) if (id !== 'clock') shown.delete(id);
    const h = renderTab.apply(this, arguments);
    if (typeof document === 'undefined' || h.indexOf('data-hint="') < 0) return h;
    try {
      const t = document.createElement('template'); t.innerHTML = h;
      const hint = [...t.content.children].find(e => e.classList.contains('hint-at')); if (!hint) return h;
      const a = ANCHOR[hint.dataset.hint], at = a && t.content.querySelector(a[0]);
      if (!at) return h;
      if (a[1] === 'after') at.after(hint); else at.before(hint);
      return t.innerHTML;
    } catch (e) { return h; }
  };
  // the clock's hint: under the step buttons (above them in a phone's dock), pointing at them
  const clkHtml = UI.clkHtml;
  UI.clkHtml = function () {
    const h = clkHtml.apply(this, arguments);
    try {
      const pc = A.S && A.pc(); if (!pc || !pc.alive || UI.screen !== 'game' || A.S.queue.length || (UI.stepper && UI.stepper.run)) return h;
      const Hh = UI.hintFor('clock', pc); if (!Hh || h.indexOf('class="clk-step"') < 0) return h;
      shown.add('clock');
      const t = document.createElement('template'); t.innerHTML = h;
      const g = t.content.querySelector('.clk-step'); if (!g) return h;
      g.insertAdjacentHTML('beforeend', box(Hh, 'hint-pop'));
      return t.innerHTML;
    } catch (e) { return h; }
  };
  // an event's hint: under the choices, inside the card, never over the picture or the top bar
  const renderModal = UI.renderModal;
  UI.renderModal = function () {
    const r = renderModal.apply(this, arguments);
    try {
      const m = document.getElementById('modal'), hint = m && m.querySelector(':scope > .hint-ev'), ch = m && m.querySelector('.mbox .choices');
      if (hint && ch) ch.after(hint);
    } catch (e) {}
    return r;
  };
  // the look: in the flow, quiet, and only its own button takes the pointer
  const css = [
    '#game #tabbody .hint.hint-at,#modal .hint.hint-ev{position:static !important;transform:none !important;inset:auto !important;width:auto !important;z-index:auto !important;margin:6px 0 10px !important;box-shadow:none !important;order:0 !important}',
    '#game #tabbody .hint.hint-at::before,#modal .hint.hint-ev::before{display:none !important}',
    '.hint.hint-at,.hint.hint-ev,.hint.hint-pop{pointer-events:none}.hint.hint-at button,.hint.hint-ev button,.hint.hint-pop button,.hint .hint-t [data-tt]{pointer-events:auto}',
    '#clk .clk-step{position:relative}',
    '#clk .clk-step > .hint-pop{position:absolute;top:calc(100% + 10px);left:0;width:min(340px,calc(100vw - 24px));z-index:60;margin:0;white-space:normal;text-align:left;background:var(--overlay,var(--surface-2));border:1px solid var(--accent,#e8b04a);box-shadow:var(--e-2,0 4px 14px rgba(0,0,0,.35))}',
    '#clk .clk-step > .hint-pop::before{content:"";position:absolute;left:var(--hint-x,96px);top:-6px;width:10px;height:10px;background:inherit;border-left:1px solid var(--accent,#e8b04a);border-top:1px solid var(--accent,#e8b04a);transform:rotate(45deg)}',
    '#clk .clk-step > .hint-pop button{position:static;min-height:32px}',
    '#game.phone #clk .clk-step{position:static}#game.phone #clk .clk-step > .hint-pop{top:auto;bottom:calc(100% + 10px);left:0;right:0;width:auto;font-size:var(--t-body,14px)}',
    '#game.phone #clk .clk-step > .hint-pop::before{top:auto;bottom:-6px;left:var(--hint-x,30%);transform:rotate(225deg)}',
    '#game.phone #clk .clk-step > .hint-pop button{min-height:44px;min-width:56px;flex:0 0 auto}',
    '#game.phone #tabbody .hint.hint-at,#game.phone #modal .hint.hint-ev{font-size:var(--t-body,14px)}',
  ].join('');
  const put = () => { if (typeof document === 'undefined' || document.getElementById('lf-hint-style')) return; const s = document.createElement('style'); s.id = 'lf-hint-style'; s.textContent = css; document.head.appendChild(s); };
  if (typeof document !== 'undefined') { if (document.head) put(); else document.addEventListener('DOMContentLoaded', put); }

  // ---- What now's "Let time run" was "Play, and stop when something needs you", pointing at Play: it is the step now
  const wn = A.whatNow;
  if (typeof wn === 'function') A.whatNow = function (pc) {
    const L = wn.apply(this, arguments);
    try {
      if (!Array.isArray(L)) return L;
      for (const x of L) if (x && x.act && x.act[0] === 'clkPlay') {
        const plan = UI.stepPlan ? UI.stepPlan() : ['week', 'month'], k = plan[1];
        x.t = { month: 'Live the next month', season: 'Live the next season', until: 'Live until something happens', week: 'Live the next week' }[k] || 'Live the next month';
        x.why = 'Nothing presses. The days run on and stop when something needs you.';
        x.act = [{ month: 'stepMonth', season: 'stepSeason', until: 'stepUntil', week: 'stepWeek' }[k] || 'stepMonth', ''];
      }
    } catch (e) { console.error('what now step', e); }
    return L;
  };

  // ---- How to play: the first hour, step by step, then the rest folded by subject
  const help = UI.helpModal;
  if (typeof help === 'function') UI.helpModal = function () {
    const h = help.apply(this, arguments);
    try {
      const t = document.createElement('template'); t.innerHTML = h;
      const body = t.content.querySelector('.lore-text'); if (!body) return h;
      const ps = [...body.querySelectorAll(':scope > p')];
      const fold = ps.map(p => {
        const b = p.querySelector('b'), head = b ? b.textContent.replace(/[.:]\s*$/, '') : 'More';
        if (/^Time runs/i.test(head)) {
          return `<details class="help-more"><summary>Time</summary><p><b>A week or a month at a time.</b> <i>Month</i>${key('M')} lives the next month and <i>Week</i>${key('W')} the next seven days. ` +
            'While you are small the main step is a <i>season</i>, and a quiet childhood offers <i>Until something happens</i>. A step stops at anything that needs you: an event, a battle, a letter. ' +
            'Close it and the step goes on. Between steps the world is still and the time is yours. For a continuous clock there is <i>Play</i>, with five speeds, and <i>Quiet</i> settles ordinary events with the safest choice.</p></details>';
        }
        return `<details class="help-more"><summary>${UI.esc(head)}</summary>${p.outerHTML}</details>`;
      }).join('');
      const first = '<section class="help-first" aria-labelledby="help-first-h"><h3 id="help-first-h">Your first hour</h3><ol>' +
        `<li>Press <b>Month</b>${key('M')} to live the next month, or <b>Week</b>${key('W')} for seven days.</li>` +
        '<li>When something happens, read it and pick a choice. Each one shows its odds.</li>' +
        '<li>Press <b>Continue</b>, then step on.</li>' +
        '<li>Spend your <b>initiative ⧗</b> on an activity on the Life tab: make a friend, train, look for love.</li>' +
        '<li>Not sure? <b>What now</b>, at the top of Life, lists the three things most worth doing.</li>' +
        '<li>When you die, you go on as your heir.</li></ol></section>';
      body.innerHTML = first + '<h3 class="help-more-h">More, by subject</h3>' + fold;
      return t.innerHTML;
    } catch (e) { console.error('help', e); return h; }
  };
  const hcss = '.help-first{margin:0 0 14px;padding:10px 14px;border:1px solid var(--accent-rule,var(--line));border-radius:var(--r-m,8px);background:var(--accent-tint,transparent)}' +
    '.help-first h3,.help-more-h{margin:0 0 6px;font-family:var(--f-name,inherit)}.help-first ol{margin:0;padding-left:22px}.help-first li{margin:4px 0}' +
    '.help-more{border-top:1px solid var(--line);padding:6px 0}.help-more summary{cursor:pointer;font-weight:700;min-height:32px;display:flex;align-items:center}.help-more p{margin:6px 0}' +
    '#modal .help-more summary{min-height:44px}';
  if (typeof document !== 'undefined') { const s = document.createElement('style'); s.id = 'lf-help-style'; s.textContent = hcss; (document.head || document.documentElement).appendChild(s); }

  // ---- a first life sees six activities, not thirty-one (first-hour I5, design #16). The six: what What now points
  // at, then what only this age of life can do, then the plainest ways to meet people and grow; "More activities"
  // shows the rest, and the choice is kept for the life. A later life sees them all, as before.
  UI.ACT_FIRST = ['make_friend', 'court_love', 'train_yard', 'practice', 'play', 'chores', 'tavern', 'festival', 'study', 'hunt', 'explore', 'pray', 'spar', 'rest'];
  UI.ACT_SHOW = 6;
  const pickSix = (pc, tiles) => {
    const have = new Map(tiles.map(b => [b.dataset.v, b])), out = [];
    const take = k => { const b = have.get(k); if (b && !out.includes(b) && !b.disabled && b.getAttribute('aria-disabled') !== 'true') out.push(b); };
    try { for (const x of A.whatNow(pc) || []) if (x.act && x.act[0] === 'act') take(x.act[1]); } catch (e) {}
    for (const b of tiles) if (/^bm_/.test(b.dataset.v) && out.filter(x => /^bm_/.test(x.dataset.v)).length < 2) take(b.dataset.v);
    for (const k of UI.ACT_FIRST) if (out.length < UI.ACT_SHOW) take(k);
    for (const b of tiles) if (out.length < UI.ACT_SHOW) take(b.dataset.v);
    return out.slice(0, UI.ACT_SHOW);
  };
  // an activity answers where it was pressed: the line it wrote (or its message) in a note above the tiles
  UI.actLast = null;
  UI.actNoteHtml = function () {
    const x = UI.actLast; if (!x || !A.S || x.day !== A.absDay()) return '';
    return `<div class="act-res card small" role="status"><b>${UI.esc(x.name)}</b>${x.ok === false ? ' <span class="bad">not now</span>' : ''}<span class="act-res-t">${UI.esc(x.text)}</span>` +
      `<button class="small ghost" data-a="actResX" aria-label="Dismiss">${UI.icon('x', 's')}</button></div>`;
  };
  const renderTab2 = UI.renderTab;
  UI.renderTab = function () {
    const h = renderTab2.apply(this, arguments);
    if (UI.tab !== 'life' || typeof document === 'undefined' || h.indexOf('data-a="act"') < 0) return h;
    try {
      const pc = A.pc(); if (!pc) return h;
      const t = document.createElement('template'); t.innerHTML = h;
      const grids = [...t.content.querySelectorAll('.acts')]; if (!grids.length) return h;
      const note = UI.actNoteHtml(); if (note) grids[0].insertAdjacentHTML('beforebegin', note);
      // a first life: the creation screen counts lives begun in this browser (UI.set.lfLives, 97's f-shield)
      const firstLife = UI.set && +UI.set.lfLives <= 1;
      const tiles = grids.flatMap(g => [...g.querySelectorAll(':scope > [data-a="act"]')]);
      if (!firstLife || UI.actsAll || tiles.length <= UI.ACT_SHOW + 2) return t.innerHTML;
      const six = new Set(pickSix(pc, tiles));
      for (const b of tiles) if (!six.has(b)) { b.hidden = true; b.classList.add('act-more'); }
      // a group with nothing left to show loses its heading too (91-look gathers the groups into one grid)
      for (const g of grids) if (![...g.children].some(b => !b.hidden)) { g.hidden = true; const hd = g.previousElementSibling; if (hd && hd.classList.contains('group-h')) hd.hidden = true; }
      const last = grids[grids.length - 1];
      last.insertAdjacentHTML('afterend', `<div class="row act-more-row"><button class="small" data-a="actsMore" aria-expanded="false">More activities (${tiles.length - six.size})</button><span class="tiny muted">Six to start with. The rest are here when you want them.</span></div>`);
      return t.innerHTML;
    } catch (e) { console.error('acts six', e); return h; }
  };
  const logCount = () => { let n = 0; for (const e of (A.S && A.S.log) || []) if (e && e.lines) n += e.lines.length; return n; };
  const newLines = n0 => { const out = []; let n = 0; for (const e of (A.S && A.S.log) || []) for (const l of (e && e.lines) || []) { if (n++ >= n0 && Array.isArray(l) && l[1] !== 'lore') out.push(String(l[0] || '').replace(/<[^>]*>/g, '')); } return out; };
  const act = UI.A.act;
  Object.assign(UI.A, {
    act(v) {
      const n0 = logCount(), t0 = UI.toast, said = [];
      UI.toast = function (m) { said.push(m); return t0.apply(this, arguments); };
      let r;
      try { r = act.apply(this, arguments); } finally { UI.toast = t0; }
      try {
        const D = GD.ACTIVITIES[v], lines = newLines(n0), opened = !!(A.S.queue.length || UI.ov);
        if (D && !opened) {
          const text = (lines[lines.length - 1] || said[said.length - 1] || 'Done.').trim();
          UI.actLast = { k: v, name: D.name, text: text.length > 220 ? text.slice(0, 217) + '…' : text, ok: lines.length ? true : (A.canAct && !A.canAct(v)[0] && !lines.length && said.length ? false : true), day: A.absDay() };
          UI.refreshTab ? UI.refreshTab() : UI.refresh();
        }
      } catch (e) { console.error('act note', e); }
      return r;
    },
    actResX() { UI.actLast = null; UI.refreshTab ? UI.refreshTab() : UI.refresh(); },
    actsMore() { UI.actsAll = true; UI.refreshTab ? UI.refreshTab() : UI.refresh(); },
  });
  const ng = A.newGame;
  A.newGame = function () { UI.actsAll = false; UI.actLast = null; return ng.apply(this, arguments); };
  const acss = '.act.act-more[hidden],.acts[hidden],.group-h[hidden]{display:none !important}.act-res{display:flex;gap:8px;align-items:baseline;flex-wrap:wrap;margin:0 0 8px;padding:8px 10px;border-left:3px solid var(--accent,#e8b04a)}.act-res .act-res-t{flex:1 1 220px;color:var(--ink-2)}' +
    '.act-more-row{margin-top:6px;gap:8px;align-items:center;flex-wrap:wrap}#game.phone .act-res,#game.phone .act-more-row .tiny{font-size:var(--t-body,14px)}#game.phone .act-res button{min-width:44px;min-height:44px}';
  if (typeof document !== 'undefined') { const s = document.createElement('style'); s.id = 'lf-acts-style'; s.textContent = acss; (document.head || document.documentElement).appendChild(s); }
})();
