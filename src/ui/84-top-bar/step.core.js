// The step rhythm (docs/design/pacing.md): a life lived a week or a month at a time. "Next week" and "Next month" are
// the clock's main controls. A step plays the whole world, one A.dayTick() at a time as the clock does, in slices of
// about 20 ms with the page drawn between them, so a Great Continent month (half a second of work, a second at the
// year turn) never freezes the page. The step waits at each event that falls inside it and goes on when the event is
// closed; between steps the world is still and the player acts. Play and its speeds stay as the secondary control,
// and "until something happens" (the release's Next, one long call) runs in slices too.
//
// Nothing in the world can tell: the same days run in the same order with the same commands (and the journal records
// the same day ticks) as one long A.advance. Drawing between slices is pure. Bots, tests and benches call A.advance and
// A.dayTick as before; the step belongs to the interface alone.
(function () {
  if (typeof UI === 'undefined' || !UI.A) return;
  // UI.stepper, not UI.step: the release keeps the creation screen's page number in UI.step
  const ST = UI.stepper = { run: false, wait: false, kind: null, from: 0, to: 0, note: '', timer: null, hit: false, empty: 0, snap: null, sum: null };
  UI.STEP_SLICE = 20;   // ms of work between two draws
  UI.CLK_BUDGET = 35;   // ms of days per tick of the running clock (TOP-CLOCK-BUDGET), so input and paint keep up
  const now = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());
  const NAME = { week: 'Next week', month: 'Next month', season: 'Next season', until: 'Until something happens' };
  UI.STEP_NAME = NAME;

  // ---- which two steps the clock offers (cycle 1, first-hour I1 and design #9). A newborn waited up to sixteen empty
  // Months for a first event: under five (82-early-years' "early years") the main step is a season, three months, with
  // a month beside it; and a child whose last two steps passed with nothing to answer is offered "Until something
  // happens" as the main step. A step is only a span of days: the same days run in the same order, so the world is the
  // one a Month at a time would reach (tbStepSameWorld, eySeasonSameWorld).
  UI.STEP_EARLY = 5;
  UI.stepPlan = function () {
    const pc = A.S && A.pc ? A.pc() : null;
    if (!pc || !pc.alive) return ['week', 'month'];
    const age = A.age(pc), small = age < UI.STEP_EARLY, child = !(A.isAdult ? A.isAdult(pc) : age >= 16);
    const base = small ? ['month', 'season'] : ['week', 'month'];
    return child && ST.empty >= 2 ? [base[1], 'until'] : base;
  };

  // where a step ends, as an absolute day (A.absDay): seven days on; or the turn of the next month, the day whose tick
  // runs the month's hooks and draws its events (the tick that makes the war clock a month's first day + 1)
  UI.stepTarget = function (kind) {
    const S = A.S, c = S.warClock || 0;
    if (kind === 'week') return A.absDay() + 7;
    if (kind === 'until') return A.absDay() + 400;
    // the turn of the next month at least a week away, so a life's first step (on 1 January, a day before the first
    // month's turn) is a month, not a day
    const turns = A.MONTH_START.map(ms => S.year * 365 + ms + 1).concat(A.MONTH_START.map(ms => (S.year + 1) * 365 + ms + 1));
    const here = A.absDay(), ok = turns.filter(t => t - S.year * 365 > c && t - here >= 7);
    // a season: the third turn of a month from here, so it ends where three Month steps would
    if (kind === 'season') return ok[2] || (S.year + 2) * 365 + A.MONTH_START[2] + 1;
    return ok[0] || (S.year + 2) * 365 + A.MONTH_START[0] + 1;
  };
  const busy = () => { const S = A.S, pc = A.pc(); return !S || !pc || !pc.alive || !!S.queue.length; };

  const schedule = () => { if (!ST.timer) ST.timer = setTimeout(slice, 0); };
  const clear = () => { if (ST.timer) { clearTimeout(ST.timer); ST.timer = null; } };
  const end = (refresh) => { if (ST.run) summarise(); ST.run = false; ST.wait = false; ST.note = ''; clear(); if (refresh) UI.refresh(); else UI.clkPaint(); };
  const waitEvent = () => { ST.wait = true; ST.hit = true; ST.note = 'event'; clear(); UI.refresh(); };

  // ---- what a step brought (cycle 1, first-hour I2): a week rarely holds an event, so a step ends with a short note of
  // what passed in it: the story's new lines, coin, health and initiative. It is read from the state at the start and
  // the end of the step and kept on UI.stepper, never in the world, so the world and its random stream are untouched.
  const logLines = () => { const L = A.S && A.S.log; if (!Array.isArray(L)) return []; const out = []; for (const e of L) if (e && Array.isArray(e.lines)) for (const l of e.lines) out.push(l); return out; };
  const snapshot = () => {
    const pc = A.pc(); if (!pc) return null;
    return { day: A.absDay(), coin: +pc.coin || 0, debt: +pc.debt || 0, health: +pc.health || 0, time: +(A.S.time || 0), lines: logLines().length, pc: pc.id };
  };
  function summarise() {
    try {
      const a = ST.snap, pc = A.pc(); ST.snap = null;
      if (!a || !pc || a.pc !== pc.id || A.absDay() <= a.day) return;
      const lines = logLines().slice(a.lines).filter(l => Array.isArray(l) && l[1] !== 'lore').map(l => String(l[0] || '').replace(/<[^>]*>/g, '').trim()).filter(Boolean);
      ST.sum = { kind: ST.kind, from: a.day, to: A.absDay(), coin: Math.round((+pc.coin || 0) - a.coin), debt: Math.round((+pc.debt || 0) - a.debt),
        health: Math.round((+pc.health || 0) - a.health), time: Math.round(((+(A.S.time || 0)) - a.time) * 10) / 10, lines: lines.slice(-3), n: lines.length, alive: !!pc.alive };
    } catch (e) { console.error('step summary', e); }
  }
  UI.stepSumHtml = function () {
    const m = ST.sum, pc = A.pc && A.pc();
    if (!m || !pc || ST.run || !pc.alive) return '';
    const word = { week: 'This week', month: 'This month', season: 'This season', until: 'Since you last stopped' }[m.kind] || 'This step';
    const sign = (v, u) => `${v > 0 ? '+' : v < 0 ? '−' : '±'}${Math.abs(v)}${u}`;
    const bits = [];
    if (m.coin || m.debt) bits.push(`coin ${sign(m.coin, m.coin === 1 || m.coin === -1 ? ' sun' : ' suns')}${m.debt ? `, debt ${sign(m.debt, '')}` : ''}`);
    else bits.push('coin unchanged');
    bits.push(m.health ? `health ${sign(m.health, '')}` : 'health unchanged');
    if (m.time) bits.push(`initiative ${sign(m.time, '⧗')}`);
    const days = m.to - m.from, news = m.lines.length ? m.lines.map(t => `<li>${UI.esc(t.length > 160 ? t.slice(0, 157) + '…' : t)}</li>`).join('') : '';
    return `<div class="card step-sum" role="status" aria-label="${UI.esc(word)}"><div class="row"><b class="step-sum-h">${UI.esc(word)}</b><span class="tiny muted">${days} day${days === 1 ? '' : 's'} · ${UI.esc(bits.join(' · '))}</span><span class="grow"></span>` +
      `<button class="small ghost" data-a="stepSumX" aria-label="Dismiss this note">${UI.icon ? UI.icon('x', 's') : '×'}</button></div>` +
      (news ? `<ul class="step-sum-news small">${news}</ul>${m.n > m.lines.length ? `<div class="tiny muted">and ${m.n - m.lines.length} more line${m.n - m.lines.length === 1 ? '' : 's'} in your story</div>` : ''}` : '<div class="small muted">Nothing new in your story: the days went by as days do.</div>') + '</div>';
  };
  const renderTab = UI.renderTab;
  if (typeof renderTab === 'function') UI.renderTab = function () {
    const h = renderTab.apply(this, arguments);
    try { return UI.tab === 'life' ? UI.stepSumHtml() + h : h; } catch (e) { return h; }
  };

  UI.stepStart = function (kind) {
    const pc = A.pc();
    if (!A.S || !pc || !pc.alive || UI.screen !== 'game') return;
    if (A.S.queue.length) { if (A.headReady()) { UI.refresh(); return; } }
    if (ST.run) end(false);
    if (UI.clk.run) { UI.clk.wasRun = false; stopClock(); }
    Object.assign(ST, { run: true, wait: false, kind, from: A.absDay(), to: UI.stepTarget(kind), note: '', hit: false, long: false, snap: snapshot(), sum: null });
    UI.clkPaint();
    schedule();
  };
  UI.stepStop = function () { if (ST.run) end(true); };
  UI.stepGo = function () {
    if (!ST.run) return;
    if (busy()) { if (A.S && A.S.queue.length && A.headReady()) UI.refresh(); return; }
    // "until something happens" has found its something: it ends once that is settled
    if (ST.kind === 'until' && ST.hit) { ST.empty = 0; return end(true); }
    ST.wait = false; ST.note = ''; UI.clkPaint(); schedule();
  };

  function slice() {
    ST.timer = null;
    if (!ST.run || ST.wait) return;
    const S = A.S, pc = A.pc();
    if (UI.screen !== 'game' || !S || !pc) return end(false);
    if (!pc.alive) return end(true);
    if (UI.quietSettle()) { UI.clk.dirty = true; ST.hit = true; }
    if (A.headReady()) return waitEvent();
    const t0 = now();
    for (let n = 0; ST.run; n++) {
      if (A.absDay() >= ST.to) { ST.empty = ST.kind === 'until' || ST.hit || A.S.queue.length ? 0 : ST.empty + 1; return end(true); }
      // the turn of the year and of each month are the long days (a second and a quarter of one on the Great
      // Continent): say so, and draw it, before running one, so the page never stops without a word
      const wc = S.warClock || 0, turn = wc >= 365 ? 'year' : A.MONTH_START.includes(wc) ? 'month' : '';
      if (turn && ST.note !== turn) { ST.note = turn; UI.clkPaint(); return void (ST.timer = setTimeout(slice, 16)); }
      if (n && now() - t0 > UI.STEP_SLICE) break;
      const r = A.dayTick();
      if (turn) ST.note = '';
      if (r === 'year') { if (UI.set && UI.set.autosave) UI.save(!0); if (ST.kind === 'until' && !ST.long) { ST.empty = 0; return end(true); } }
      if (r === 'dead' || !A.pc() || !A.pc().alive) return end(true);
      if (A.S.queue.length && (UI.quietSettle(), A.headReady())) return waitEvent();
      if (r === 'queue') break;
    }
    UI.clkLight();
    schedule();
  }

  // the clock and the step never run together: Play stops a step, a step stops the clock; anything that stops the
  // clock (a confirm box, a battle) stops a running step too, but not one waiting at its event
  const clkStop = UI.clkStop, stopClock = () => clkStop.apply(UI, []);
  UI.clkStop = function () { if (ST.run && !ST.wait) end(false); return clkStop.apply(this, arguments); };
  const clkStart = UI.clkStart;
  UI.clkStart = function () { if (ST.run) end(false); return clkStart.apply(this, arguments); };
  // closing an event (UI.RESUME_AFTER) carries a waiting step on to its end
  const clkResume = UI.clkResume;
  UI.clkResume = function () {
    if (ST.run && ST.wait) { if (!busy()) UI.stepGo(); return; }
    return clkResume.apply(this, arguments);
  };

  // a control that cannot act now stays focusable and says why (brief 5.1: aria-disabled, the reason in its tooltip);
  // pressed anyway, it says it again
  const whyNot = () => { const pc = A.pc(); return !pc || !pc.alive ? 'Your life is over.' : 'Something needs you first: settle it, and the step goes on.'; };
  const playAct = UI.A.clkPlay;
  Object.assign(UI.A, {
    stepWeek() { if (busy()) return UI.toast(whyNot()); UI.stepStart('week'); },
    stepMonth() { if (busy()) return UI.toast(whyNot()); UI.stepStart('month'); },
    stepSeason() { if (busy()) return UI.toast(whyNot()); UI.stepStart('season'); },
    // the step a quiet childhood is offered runs on through the turn of the year (the old Next stopped there), up to 400 days
    stepUntil() { if (busy()) return UI.toast(whyNot()); UI.stepStart('until'); ST.long = true; },
    stepSumX() { ST.sum = null; UI.refreshTab ? UI.refreshTab() : UI.refresh(); },
    stepStop() { UI.stepStop(); },
    stepGo() { if (busy()) return UI.toast('The step goes on when this is settled.'); UI.stepGo(); },
    stepSpeed() { UI.clk.speed = (UI.clk.speed || 1) % 5 + 1; UI.clkPaint(); },
    // Play waits while a step runs (Stop it, or let it end); Space still stops the step and plays on
    clkPlay() { if (ST.run && !ST.wait) return UI.toast(`${NOTE()}: stop the step first, or let it end.`); return playAct.apply(this, arguments); },
    // the release's Next ran up to a year in one call (several seconds on the Great Continent): now a step to the year
    // turn or 400 days, whichever comes first, in slices
    clkSkip() { const pc = A.pc(); if (!pc || !pc.alive || A.S.queue.length) return; UI.stepStart('until'); },
  });
  // a new life and a loaded save end any step under way (its days belong to the world that was)
  const halt = () => { if (ST.run) { ST.run = false; ST.wait = false; ST.note = ''; clear(); } ST.empty = 0; ST.sum = null; ST.snap = null; };
  UI.stepHalt = halt;
  for (const k of ['newGame', 'deserialize']) {
    const f = A[k];
    if (typeof f === 'function') A[k] = function () { halt(); return f.apply(this, arguments); };
  }

  // ---- the controls
  // the month's own mark: a full moon (the week keeps the calendar; "run until something needs you" keeps skip-forward)
  const MOON = '<circle cx="12" cy="12" r="7.5" fill="currentColor" stroke="none"></circle><path d="M9 9.5a3.5 3.5 0 0 1 3-1.6" stroke-opacity=".5"></path>';
  const NOTE = () => !ST.run ? '' : ST.wait ? 'An event' : ST.note === 'year' ? 'The year turns' : ST.note === 'month' ? 'The month turns' :
    ST.kind === 'week' ? 'A week passes' : ST.kind === 'month' ? 'A month passes' : ST.kind === 'season' ? 'A season passes' : 'Time passes';
  UI.stepHtml = function () {
    if (UI.ICONS && !UI.ICONS['step-moon']) UI.ICONS['step-moon'] = MOON;
    const dis = busy() && !ST.wait, why = whyNot();
    const span = Math.max(1, ST.to - ST.from), frac = ST.run ? Math.min(1, Math.max(0, (A.absDay() - ST.from) / span)) : 0, pct = Math.round(frac * 100);
    const prog = `<span class="clk-prog" aria-hidden="true"><i style="transform:scaleX(${frac.toFixed(3)})"></i></span>`, note = NOTE();
    const one = (kind, icon, label, key, primary) => {
      const mine = ST.run && ST.kind === kind, pr = primary ? ' primary' : '';
      if (mine && ST.wait) {
        const b = busy();
        return `<button class="small clk-go run${pr}" data-a="stepGo"${b ? ' aria-disabled="true"' : ''} title="${UI.esc(b ? 'The step goes on when this is settled' : `Go on to the end of the ${kind}`)}">${UI.icon('play', 's')}<span>Go on</span>${prog}</button>`;
      }
      if (mine) return `<button class="small clk-stop run${pr}" data-a="stepStop" title="Stop here (${UI.esc(label)}: ${pct}% gone)" aria-label="Stop. ${UI.esc(note)}, ${pct}% gone">${UI.icon('pause', 's')}<span class="clk-stoplbl">Stop</span><span class="clk-runlbl">${UI.esc(note)}</span>${prog}</button>`;
      const span = { week: 'seven days from now', month: 'the turn of the month', season: 'the turn of the third month from now', until: 'the next thing that needs you, or the new year' }[kind];
      const tip = dis ? why : `${label}: the world plays on to ${span}, its events come up as they fall, then the time is yours (key ${key})`;
      const act = { week: 'stepWeek', month: 'stepMonth', season: 'stepSeason', until: 'stepUntil' }[kind];
      const words = kind === 'until' ? '<span class="clk-unit">until something happens</span>' : `<span class="clk-nx">Next </span><span class="clk-unit">${kind}</span>`;
      return `<button class="small${pr}" data-a="${act}"${dis ? ' aria-disabled="true"' : ''} title="${UI.esc(tip)}" aria-keyshortcuts="${key}">${UI.icon(icon, 's')}<span>${words}</span><kbd class="clk-kbd" aria-hidden="true">${key}</kbd></button>`;
    };
    const ICON = { week: 'calendar', month: 'step-moon', season: 'sprout', until: 'skip-forward' }, plan = UI.stepPlan();
    return `<span class="clk-step" role="group" aria-label="Step">${one(plan[0], ICON[plan[0]], NAME[plan[0]], 'W', false)}${one(plan[1], ICON[plan[1]], NAME[plan[1]], 'M', true)}</span>` +
      `<span class="clk-note tiny muted" role="status" aria-live="polite">${UI.esc(note)}</span>`;
  };
  const clkHtml = UI.clkHtml;
  UI.clkHtml = function () {
    const h = clkHtml.apply(this, arguments);
    if (!A.S || !A.pc() || typeof document === 'undefined') return h;
    try {
      const t = document.createElement('template'); t.innerHTML = h;
      const clk = t.content.querySelector('#clk'); if (!clk) return h;
      const box = document.createElement('template'); box.innerHTML = UI.stepHtml();
      const play = clk.querySelector('[data-a=clkPlay]'), skip = clk.querySelector('[data-a=clkSkip]');
      // Play is the second way to let time run now: one primary control a view (the step)
      if (play) {
        play.classList.remove('primary');
        if (ST.run && !ST.wait) { play.removeAttribute('disabled'); play.setAttribute('aria-disabled', 'true'); play.title = `${NOTE()}: stop the step first, or let it end`; }
      }
      if (skip) {
        // the old Next, a run until something needs you: an icon beside the speeds, named for screen readers
        const mine = ST.run && ST.kind === 'until';
        skip.setAttribute('aria-label', mine ? 'Stop the run' : 'Run until something needs you');
        skip.title = mine ? 'Stop the run here' : 'Run until something needs you (or to the new year)';
        if (mine) { skip.dataset.a = 'stepStop'; skip.removeAttribute('disabled'); skip.classList.add('on'); }
        const sp = skip.querySelector('span'); if (sp) sp.className = 'bt';
      }
      // at laptop widths the clock gives room to the place and the purse: Play and Quiet as icons, and the five speeds
      // as one button that steps through them (CSS shows one or the other)
      const quiet = clk.querySelector('[data-a=clkQuiet]'), seg = clk.querySelector('.clk-spd');
      if (quiet && !quiet.getAttribute('aria-label')) quiet.setAttribute('aria-label', 'Quiet living');
      for (const b of [play, quiet]) { const sp = b && b.querySelector('span'); if (sp) sp.classList.add('clk-lbl'); }
      if (seg) {
        const sp = UI.clk.speed || 1, b = document.createElement('button');
        b.className = 'small clk-spd1'; b.dataset.a = 'stepSpeed';
        b.setAttribute('aria-label', `Speed ${sp} of 5`); b.title = `Speed ${sp}: about ${UI.CLK_SPEEDS ? UI.CLK_SPEEDS[sp] : sp} days a second. Click for ${sp < 5 ? 'faster' : 'speed 1'} (keys 1 to 5)`;
        b.innerHTML = `<span aria-hidden="true">×</span><b>${UI.esc(sp)}</b>`;
        seg.after(b);
      }
      const dock = clk.querySelector('.ph-dock');
      const at = dock || clk, before = dock ? dock.firstChild : (play ? play.closest('#clk > *') : null);
      for (const n of [...box.content.childNodes]) at.insertBefore(n, before);
      if (ST.run) clk.setAttribute('aria-busy', ST.wait ? 'false' : 'true');
      return t.innerHTML;
    } catch (e) { console.error('step controls', e); return h; }
  };

  // ---- the full map's zoom: "−" and "fit" say so when the whole map is already in view (a pure read of the view)
  const gmDraw = UI.gmDraw;
  if (typeof gmDraw === 'function') UI.gmDraw = function () {
    const r = gmDraw.apply(this, arguments);
    try {
      const v = UI.gm && UI.gm.view, f = v && UI.gmFit ? UI.gmFit() : null, whole = !v || !f || v.w >= f.w * 0.995;
      for (const b of document.querySelectorAll('.mapzoom [data-a=gmZoom]')) {
        const k = b.dataset.v; if (k !== 'fit' && k !== '0.66') continue;
        if (whole) { b.setAttribute('aria-disabled', 'true'); b.title = 'The whole map is in view'; } else { b.removeAttribute('aria-disabled'); b.title = k === 'fit' ? 'Show the whole map' : 'Zoom out'; }
      }
    } catch (e) {}
    return r;
  };
  const gmZoom = UI.A.gmZoom;
  if (typeof gmZoom === 'function') UI.A.gmZoom = function (v) {
    if (v === 'fit' || v === '0.66') { const w = UI.gm && UI.gm.view, f = w && UI.gmFit ? UI.gmFit() : null; if (!w || (f && w.w >= f.w * 0.995)) return UI.toast('The whole map is already in view.'); }
    return gmZoom.apply(this, arguments);
  };

  // ---- keys: W a week, M a month, or the two steps the clock offers (Space and 1 to 5 stay the clock's)
  if (typeof document !== 'undefined') document.addEventListener('keydown', e => {
    if (UI.screen !== 'game' || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    const k = (e.key || '').toLowerCase(); if (k !== 'w' && k !== 'm') return;
    const tg = e.target && e.target.tagName;
    if (tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT' || (e.target && e.target.isContentEditable)) return;
    if (UI.$('#modal') && !(UI.ov && UI.ov.type === 'warroom' && !A.S.queue.length)) return;
    e.preventDefault();
    // W is the shorter of the two steps on offer, M the main one (a week and a month for most of a life)
    const kind = UI.stepPlan()[k === 'w' ? 0 : 1];
    if (ST.run && !ST.wait && ST.kind === kind) UI.stepStop(); else if (kind === 'until') UI.A.stepUntil(); else UI.stepStart(kind);
  });

  // ---- the look (tokens of docs/design/brief.md)
  const css = [
    '#clk .clk-step{display:inline-flex;gap:var(--sp-1,4px);align-items:center}',
    '#clk .clk-step button{position:relative;white-space:nowrap}',
    '#clk .clk-step button.run:not(.primary){border-color:var(--accent);color:var(--accent)}',
    '#clk [aria-disabled=true]{color:var(--ink-3);border-color:var(--line);background:var(--raised);box-shadow:none;cursor:not-allowed}',
    '#clk .clk-prog{position:absolute;left:4px;right:4px;bottom:2px;height:3px;border-radius:2px;background:var(--sunken,rgba(0,0,0,.25));overflow:hidden;pointer-events:none}',
    '#clk .clk-prog i{display:block;width:100%;height:100%;background:var(--accent);transform-origin:left center;transition:transform 200ms linear}',
    '#clk .clk-step .primary .clk-prog i{background:var(--on-accent,#1a1206)}',
    // the button that carries the step on breathes while the step waits at its event (brief 6: opacity only)
    '#clk .clk-go::after{content:"";position:absolute;inset:-2px;border-radius:inherit;pointer-events:none;box-shadow:var(--glow-accent,0 0 0 1px rgba(240,192,98,.55),0 0 18px rgba(240,192,98,.28));opacity:0;animation:stepBreathe 2s ease-in-out infinite}',
    '#clk .clk-go[aria-disabled=true]::after{animation:none;opacity:0}',
    '@keyframes stepBreathe{0%,100%{opacity:.15}50%{opacity:1}}',
    '@media (prefers-reduced-motion:reduce){#clk .clk-go::after{animation:none;opacity:.8}#clk .clk-prog i{transition:none}}',
    ':root[data-motion=reduced] #clk .clk-go::after,:root[data-motion=off] #clk .clk-go::after{animation:none;opacity:.8}',
    '#clk .clk-kbd{display:inline-block;margin-left:6px;padding:0 4px;min-width:16px;line-height:16px;font:600 var(--t-cap,11px)/16px inherit;text-align:center;color:var(--ink-2);background:var(--sunken);border:1px solid var(--line-strong);border-radius:3px}',
    '#clk .primary .clk-kbd{color:var(--on-accent,#1a1206);background:transparent;border-color:currentColor}',
    '@media (pointer:coarse){#clk .clk-kbd{display:none}}',
    '#clk .clk-runlbl{display:none}',
    '#clk .clk-note{min-width:0;white-space:nowrap}',
    '#clk .clk-note:empty{display:none}',
    '#clk [data-a=clkSkip] .bt{display:none}',
    '#clk .clk-spd1{display:none;min-width:36px}',
    // wide screens: the speeds as the brief's segmented control (5.2)
    '@media (min-width:1440px){#topbar #clk .clk-spd{display:inline-flex;align-items:stretch;height:32px;padding:0;gap:0;background:var(--sunken);border:1px solid var(--line-strong);border-radius:var(--r-s,6px);overflow:hidden}' +
      '#topbar #clk .clk-spd button{min-width:44px !important;height:30px !important;min-height:30px !important;margin:0;border:0 !important;border-radius:0 !important;background:transparent;color:var(--ink-2);box-shadow:none}' +
      '#topbar #clk .clk-spd button.on{background:var(--raised) !important;color:var(--accent) !important;box-shadow:inset 0 -2px 0 var(--accent) !important}}',
    // laptop widths: "Week" and "Month" without icons or keys, the running step's button saying what passes, Play, Quiet
    // and Next as 32 px icon buttons, the five speeds as one button that steps through them, so the place and the purse
    // keep their room
    '@media (min-width:761px) and (max-width:1439px){#clk .clk-spd{display:none}#clk .clk-spd1{display:inline-flex}#clk .clk-lbl{display:none}#clk .clk-step .ic{display:none}' +
      '#topbar #clk .clk-play,#topbar #clk [data-a=clkQuiet],#topbar #clk [data-a=clkSkip],#topbar #clk [data-a=stepStop].on{width:32px;min-width:32px;height:32px;min-height:32px;padding:0;display:inline-flex;align-items:center;justify-content:center;flex:0 0 32px}}',
    '@media (max-width:1439px){#clk .clk-nx,#clk .clk-kbd,#clk .clk-stoplbl{display:none}#clk .clk-runlbl{display:inline}#clk .clk-unit{text-transform:capitalize}#clk .clk-note{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}}',
    '#game.phone #clk .clk-step button{min-height:44px;padding:0 8px}',
    // a phone's dock: the two steps lead it, big; Play, the speed, Next and Quiet are icons, none under 44 px
    // (71-phone shows every label in its dock and puts Play first)
    '#game.phone #clk .ph-dock>.clk-step{order:0 !important;flex:6 1 0;display:flex;gap:4px;min-width:0}',
    '#game.phone #clk .ph-dock>.clk-step>button{flex:1 1 0;min-width:64px;min-height:46px;font-weight:700}',
    '#game.phone #clk .ph-dock>.clk-play{flex:1 1 0 !important}',
    '#game.phone #clk .ph-dock button span.clk-nx,#game.phone #clk .ph-dock button span.clk-lbl,#game.phone #clk .ph-dock button span.clk-runlbl,#game.phone #clk .ph-dock [data-a=clkSkip] span,#game.phone #clk .ph-dock [data-a=clkQuiet] span{display:none !important}',
    '#game.phone #clk .ph-dock button span.clk-stoplbl{display:inline !important}',
    '#game.phone #clk .ph-dock .clk-step .ic{display:none}',
    '#game.phone #clk .ph-dock>button{min-width:44px}',
    '#game.phone #clk .clk-step button span:not(.clk-prog){font-size:var(--t-small,12px)}',
    // the note of what a step brought, at the top of Now
    '.step-sum{margin:0 0 var(--s-2,8px);padding:8px 10px}.step-sum .row{gap:8px;align-items:baseline;flex-wrap:wrap}.step-sum-h{font-family:var(--f-name,inherit)}' +
      '.step-sum-news{margin:4px 0 0;padding-left:18px;color:var(--ink-2)}.step-sum-news li{margin:2px 0}.step-sum button{min-width:32px}',
    '#game.phone .step-sum .tiny,#game.phone .step-sum .small{font-size:var(--t-body,14px)}#game.phone .step-sum button{min-width:44px;min-height:44px}',
  ].join('');
  const put = () => { if (typeof document === 'undefined' || document.getElementById('step-style')) return; const s = document.createElement('style'); s.id = 'step-style'; s.textContent = css; document.head.appendChild(s); };
  if (typeof document !== 'undefined') { if (document.head) put(); else document.addEventListener('DOMContentLoaded', put); }
})();

// cycle 2 (visual I11): at laptop widths Play, the run and Quiet are icons; until the player has used one of them, each
// carries its word under the icon (brief §7.4: an icon is labelled the first time it appears). The first press of any
// of them puts the words away (UI.set.tbKnown, saved with the settings; never in the save).
(function () {
  if (typeof document === 'undefined') return;
  const mark = () => { try { document.documentElement.toggleAttribute('data-tb-learn', !UI.set.tbKnown); } catch (e) {} };
  const css = '@media (min-width:761px) and (max-width:1439px){' +
    ':root[data-tb-learn] #topbar #clk .clk-play,:root[data-tb-learn] #topbar #clk [data-a=clkQuiet],:root[data-tb-learn] #topbar #clk [data-a=clkSkip]{width:auto;min-width:40px;flex:0 0 auto;flex-direction:column;gap:0;padding:2px 6px;height:40px;min-height:40px}' +
    ':root[data-tb-learn] #topbar #clk .clk-play .clk-lbl,:root[data-tb-learn] #topbar #clk [data-a=clkQuiet] .clk-lbl,:root[data-tb-learn] #topbar #clk [data-a=clkSkip] .bt{display:block!important;font-size:calc(12px * var(--tx,1));line-height:1;font-weight:600;letter-spacing:.02em}}';
  const put = () => { if (document.getElementById('tb-learn-style')) return; const s = document.createElement('style'); s.id = 'tb-learn-style'; s.textContent = css; document.head.appendChild(s); mark(); };
  if (document.head) put(); else document.addEventListener('DOMContentLoaded', put);
  document.addEventListener('click', e => {
    const b = e.target && e.target.closest && e.target.closest('#clk [data-a=clkPlay], #clk [data-a=clkQuiet], #clk [data-a=clkSkip]');
    if (b && !UI.set.tbKnown) { UI.set.tbKnown = true; try { UI.saveSettings(); } catch (x) {} mark(); }
  }, true);
  const apply = UI.applySettings;
  if (typeof apply === 'function') UI.applySettings = function () { const r = apply.apply(this, arguments); mark(); return r; };
})();
