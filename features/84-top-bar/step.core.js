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
  const ST = UI.step = { run: false, wait: false, kind: null, from: 0, to: 0, note: '', timer: null };
  UI.STEP_SLICE = 20;   // ms of work between two draws
  const now = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());
  const NAME = { week: 'Next week', month: 'Next month', until: 'Until something happens' };

  // where a step ends, as an absolute day (A.absDay): seven days on; or the turn of the next month, the day whose tick
  // runs the month's hooks and draws its events (the tick that makes the war clock a month's first day + 1)
  UI.stepTarget = function (kind) {
    const S = A.S, c = S.warClock || 0;
    if (kind === 'week') return A.absDay() + 7;
    if (kind === 'until') return A.absDay() + 400;
    for (const ms of A.MONTH_START) if (ms + 1 > c) return S.year * 365 + ms + 1;
    return (S.year + 1) * 365 + A.MONTH_START[0] + 1;
  };
  const busy = () => { const S = A.S, pc = A.pc(); return !S || !pc || !pc.alive || !!S.queue.length; };

  const schedule = () => { if (!ST.timer) ST.timer = setTimeout(slice, 0); };
  const clear = () => { if (ST.timer) { clearTimeout(ST.timer); ST.timer = null; } };
  const end = (refresh) => { ST.run = false; ST.wait = false; ST.note = ''; clear(); if (refresh) UI.refresh(); else UI.clkPaint(); };
  const waitEvent = () => { ST.wait = true; ST.note = 'event'; clear(); UI.refresh(); };

  UI.stepStart = function (kind) {
    const pc = A.pc();
    if (!A.S || !pc || !pc.alive || UI.screen !== 'game') return;
    if (A.S.queue.length) { if (A.headReady()) { UI.refresh(); return; } }
    if (ST.run) end(false);
    if (UI.clk.run) { UI.clk.wasRun = false; stopClock(); }
    Object.assign(ST, { run: true, wait: false, kind, from: A.absDay(), to: UI.stepTarget(kind), note: '' });
    UI.clkPaint();
    schedule();
  };
  UI.stepStop = function () { if (ST.run) end(true); };
  UI.stepGo = function () {
    if (!ST.run) return;
    if (busy()) { if (A.S && A.S.queue.length && A.headReady()) UI.refresh(); return; }
    ST.wait = false; ST.note = ''; UI.clkPaint(); schedule();
  };

  function slice() {
    ST.timer = null;
    if (!ST.run || ST.wait) return;
    const S = A.S, pc = A.pc();
    if (UI.screen !== 'game' || !S || !pc) return end(false);
    if (!pc.alive) return end(true);
    if (UI.quietSettle()) UI.clk.dirty = true;
    if (A.headReady()) return waitEvent();
    const t0 = now();
    for (let n = 0; ST.run; n++) {
      if (A.absDay() >= ST.to) return end(true);
      // the turn of the year and of each month are the long days (a second and a quarter of one on the Great
      // Continent): say so, and draw it, before running one, so the page never stops without a word
      const wc = S.warClock || 0, turn = wc >= 365 ? 'year' : A.MONTH_START.includes(wc) ? 'month' : '';
      if (turn && ST.note !== turn) { ST.note = turn; UI.clkPaint(); return void (ST.timer = setTimeout(slice, 16)); }
      if (n && now() - t0 > UI.STEP_SLICE) break;
      const r = A.dayTick();
      if (turn) ST.note = '';
      if (r === 'year') { if (UI.set && UI.set.autosave) UI.save(!0); if (ST.kind === 'until') return end(true); }
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

  Object.assign(UI.A, {
    stepWeek() { UI.stepStart('week'); },
    stepMonth() { UI.stepStart('month'); },
    stepStop() { UI.stepStop(); },
    stepGo() { UI.stepGo(); },
    stepSpeed() { UI.clk.speed = (UI.clk.speed || 1) % 5 + 1; UI.clkPaint(); },
    // the release's Next ran up to a year in one call (several seconds on the Great Continent): now a step to the year
    // turn or 400 days, whichever comes first, in slices
    clkSkip() { const pc = A.pc(); if (!pc || !pc.alive || A.S.queue.length) return; UI.stepStart('until'); },
  });

  // ---- the controls
  UI.stepHtml = function () {
    const S = A.S, dis = busy() && !ST.wait, why = !A.pc() || !A.pc().alive ? 'Your life is over' : 'Something needs you first';
    const span = Math.max(1, ST.to - ST.from), pct = ST.run ? Math.round(Math.min(1, Math.max(0, (A.absDay() - ST.from) / span)) * 100) : 0;
    const one = (kind, icon, label, key, primary) => {
      const mine = ST.run && ST.kind === kind;
      if (mine && ST.wait) return `<button class="small clk-go run${primary ? ' primary' : ''}" data-a="stepGo" ${busy() ? 'disabled' : ''} title="${UI.esc(busy() ? 'The step goes on when this is settled' : `Go on to the end of the ${kind === 'until' ? 'run' : kind}`)}">${UI.icon('play', 's')}<span>Go on</span><span class="clk-prog" aria-hidden="true"><i style="width:${pct}%"></i></span></button>`;
      if (mine) return `<button class="small clk-stop run" data-a="stepStop" title="Stop here (the ${UI.esc(kind)} is ${pct}% gone)" aria-label="Stop: ${UI.esc(label)} is ${pct}% gone">${UI.icon('pause', 's')}<span>Stop</span><span class="clk-prog" aria-hidden="true"><i style="width:${pct}%"></i></span></button>`;
      return `<button class="small${primary && !ST.run ? ' primary' : ''}" data-a="${kind === 'week' ? 'stepWeek' : 'stepMonth'}" ${dis ? `disabled title="${UI.esc(why)}"` : `title="${UI.esc(label)}: the world plays on to ${kind === 'week' ? 'seven days from now' : 'the turn of the month'}, its events come up as they fall, then the time is yours (key ${key})"`} aria-keyshortcuts="${key}">${UI.icon(icon, 's')}<span><span class="clk-nx">Next </span><span class="clk-unit">${kind === 'week' ? 'week' : 'month'}</span></span></button>`;
    };
    const note = !ST.run ? '' : ST.wait ? 'An event' : ST.note === 'year' ? 'The year turns' : ST.note === 'month' ? 'The month turns' : ST.kind === 'week' ? 'A week passes' : ST.kind === 'month' ? 'A month passes' : 'Time passes';
    return `<span class="seg clk-step" role="group" aria-label="Step">${one('week', 'calendar', 'Next week', 'W', false)}${one('month', 'skip-forward', 'Next month', 'M', true)}</span>` +
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
      if (play) play.classList.remove('primary');
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

  // ---- keys: W a week, M a month (Space and 1 to 5 stay the clock's)
  if (typeof document !== 'undefined') document.addEventListener('keydown', e => {
    if (UI.screen !== 'game' || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    const k = (e.key || '').toLowerCase(); if (k !== 'w' && k !== 'm') return;
    const tg = e.target && e.target.tagName;
    if (tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT' || (e.target && e.target.isContentEditable)) return;
    if (UI.$('#modal') && !(UI.ov && UI.ov.type === 'warroom' && !A.S.queue.length)) return;
    e.preventDefault();
    if (ST.run && !ST.wait && ST.kind === (k === 'w' ? 'week' : 'month')) UI.stepStop(); else UI.stepStart(k === 'w' ? 'week' : 'month');
  });

  // ---- the look (tokens of docs/design/brief.md)
  const css = [
    '#clk .clk-step{display:inline-flex;gap:var(--s-1,4px);align-items:center}',
    '#clk .clk-step button{position:relative;white-space:nowrap}',
    '#clk .clk-step button.run{border-color:var(--accent);color:var(--accent)}',
    '#clk .clk-prog{position:absolute;left:4px;right:4px;bottom:2px;height:3px;border-radius:2px;background:var(--sunken,rgba(0,0,0,.25));overflow:hidden;pointer-events:none}',
    '#clk .clk-prog i{display:block;height:100%;background:var(--accent)}',
    '#clk .clk-note{min-width:0;white-space:nowrap}',
    '#clk .clk-note:empty{display:none}',
    '#clk [data-a=clkSkip] .bt{display:none}',
    // laptop widths: "Week" and "Month", and the note only for screen readers, so the place and the purse keep their room
    '#clk .clk-spd1{display:none;min-width:36px}',
    '@media (min-width:761px) and (max-width:1439px){#clk .clk-spd{display:none}#clk .clk-spd1{display:inline-flex}#clk .clk-lbl{display:none}}',
    '@media (max-width:1439px){#clk .clk-nx{display:none}#clk .clk-unit{text-transform:capitalize}#clk .clk-note{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}}',
    '#game.phone #clk .clk-step button{min-height:44px;padding:0 8px}',
    // a phone's dock holds the two steps, Play, the speed, Next and Quiet: Play and Quiet as icons, none under 44 px
    '#game.phone #clk .clk-lbl{display:none}',
    '#game.phone #clk .ph-dock>button,#game.phone #clk .ph-dock .clk-step>button{min-width:44px;flex-shrink:0}',
    '#game.phone #clk .clk-step button span:not(.clk-prog){font-size:var(--t-small,12px)}',
  ].join('');
  const put = () => { if (typeof document === 'undefined' || document.getElementById('step-style')) return; const s = document.createElement('style'); s.id = 'step-style'; s.textContent = css; document.head.appendChild(s); };
  if (typeof document !== 'undefined') { if (document.head) put(); else document.addEventListener('DOMContentLoaded', put); }
})();
