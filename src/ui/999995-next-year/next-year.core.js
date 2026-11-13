// 999995-next-year: round 2 B6, "Next month or Next year" (docs/CRITIQUE.md §2 item 4; T1, T2, T5, U18; D-008, D-019).
//
// The two buttons themselves are 99992-v2-time's; the stepper is 84-top-bar's (A1's one-redraw policy, 999999, is on top
// of both). This file decides what a long step does:
//
//  - NOTABLE or ROUTINE. Every card is one or the other (A.V2Y.classify, from the event's definition, never from state):
//    notable = it needs a real answer (a forced card, a consequence of your own choice, a duty, a council, a gathering,
//    a letter of state; a choice that can wound, kill, jail, start a duel, take or give a post, a lover, a claim, a pact,
//    a war, a holding, real money; a matter of marriage, birth, death, sickness, war, the law, an exam or a summons; a
//    ruler's business; a deadline), or it is a battle, a duel or a call to arms. Routine = talk, errands, play and the
//    small happenings of the day. A routine card never stops a month or a year: it is set aside while the step runs
//    and comes, one at a time, when the step ends (a year keeps at most A.V2Y.KEEP of them; the rest pass, and the
//    digest says so).
//  - A YEAR ENDS EARLY, saying why in one line, for a notable card, a battle or a call to war, an illness or a wound, a
//    death or a birth in the household (parents, brothers and sisters, spouse, children), coming of age, or Esc (at the
//    month's end). A MONTH only waits at a notable card and goes on, as before.
//  - ONE DIGEST at the end of a year (UI.stepSumHtml on Life): the year's quiet months counted, what the story gained,
//    what changed, what waits. One redraw, A1's.
//  - NO INITIATIVE POOL (D-019). The pool of free days is gone: nothing is ever "not enough initiative". What was
//    spent is counted as load; a body driven past what it can recover (A.V2Y.CAP, A.V2Y.RECOVER a month) grows weary
//    (35-moods' rest need), then loses health, then may pull something (a "strain" wound that mends in a year).
//
// Pure where it draws (the digest, the ⧗ strip read the state and the page only); the world is touched only by the
// monthly load (A.rand through A.chance, as every consequence is), so the same seed and choices give the same world.
(function () {
  if (typeof A === 'undefined') return;
  const V2T = A.V2T = A.V2T || {};
  const Y = A.V2Y = A.V2Y || {};
  const MS = () => A.MONTH_START;

  // ---- notable or routine ---------------------------------------------------------------------------------------------
  // what a choice may do that is never small; a child's world holds only the first kind (a post, a debt or a holding is
  // not a child's choice to carry: "Scaring crows" is a chore, not a turning point)
  Y.CORE_FX = ['die', 'wound', 'prison', 'punish', 'free', 'duel', 'beast', 'lover', 'warOn', 'claim', 'pact', 'ally', 'mission', 'family'];
  Y.GROWN_FX = ['promote', 'job', 'sworn', 'realmRel', 'stability', 'treasury', 'legit', 'secret', 'houseOp', 'factionDisc', 'asset',
    'owed', 'oweThem', 'letter', 'authority', 'infamy'];
  Y.NOTABLE_FX = Y.CORE_FX.concat(Y.GROWN_FX);
  const RX_CORE = new RegExp('\\b(?:' + Y.CORE_FX.join('|') + ')\\b'), RX_ALL = new RegExp('\\b(?:' + Y.NOTABLE_FX.join('|') + ')\\b');
  // the money that is a real answer: a purse, not a coin
  Y.COIN = 120;
  // topics in an event's id (split at _ and digits): a marriage, a birth, a death, sickness, war, the law, an exam
  Y.STEMS = ['marri', 'wed', 'betroth', 'birth', 'baby', 'born', 'death', 'dying', 'dies', 'funeral', 'inherit', 'heir', 'crown', 'exam', 'trial',
    'oath', 'summon', 'plague', 'fever', 'illness', 'sick', 'war', 'battle', 'siege', 'muster', 'levy', 'ransom', 'treaty', 'deadline', 'debt',
    'tax', 'repay', 'murder', 'poison', 'famine', 'raid', 'bandit', 'arrest', 'prison', 'wound', 'injur', 'kidnap', 'exile', 'coup', 'rebel', 'revolt',
    'succession', 'vassal', 'ordain', 'vow', 'accus', 'sentence', 'verdict'];
  const memo = Object.create(null);
  const fxOf = c => [c.fx, c.win && c.win.fx, c.lose && c.lose.fx].filter(Boolean);
  // the verdict on an event's definition: { notable, why } (why: a word for the reason; '' for routine). Pure, cached by id
  // and by whether the player is grown (a child's list of weighty things is shorter).
  Y.def = function (id, grown) {
    const key = id + (grown ? '+' : '');
    if (key in memo) return memo[key];
    const e = A.EV && A.EV[id]; let why = '';
    if (!e) return (memo[key] = { notable: true, why: 'unknown' });          // what we cannot read is not made small
    if (e.duty || e.council || e.flow || /^g[as]_|^di_/.test(id)) why = 'duty';
    if (!why) {
      const toks = String(id).toLowerCase().split(/[_\d]+/);
      if (toks.some(t => Y.STEMS.some(s => t.startsWith(s)))) why = 'topic';
    }
    if (!why) {
      try { const c = e.cond && e.cond.toString(); if (c && /C\.(ruler|office)\(/.test(c)) why = 'ruler'; } catch (x) {}
    }
    if (!why) {
      const rx = grown ? RX_ALL : RX_CORE, keys = grown ? Y.NOTABLE_FX : Y.CORE_FX;
      outer: for (const c of e.choices || []) for (const f of fxOf(c)) {
        if (typeof f === 'function') { let src = ''; try { src = f.toString(); } catch (x) {} if (rx.test(src)) { why = 'weight'; break outer; } continue; }
        for (const k of Object.keys(f)) {
          if (keys.includes(k)) { why = 'weight'; break outer; }
          if (grown && k === 'coin' && Math.abs(+f.coin || 0) >= Y.COIN) { why = 'money'; break outer; }
          if (grown && k === 'coinPct' && Math.abs(+f.coinPct || 0) >= 20) { why = 'money'; break outer; }
        }
      }
    }
    return (memo[key] = { notable: !!why, why });
  };
  // a queue item: notable (stops a year) or routine (waits for the step's end). A card the player asked for, a
  // consequence of a choice, a forced card, a gathering, a scheduled promise and every non-event (a battle, a duel, a
  // campaign, the war room) is notable.
  Y.classify = function (q) {
    if (!q) return { notable: false, why: '' };
    if (q.type !== 'event') return { notable: true, why: q.type || 'prompt' };
    if (q.forced || q.now) return { notable: true, why: 'forced' };
    if (q.lfFrom === 'chain' || q.lfFrom === 'ask') return { notable: true, why: q.lfFrom };
    if (q.ctx && (q.ctx.gid || q.ctx.lfFixed)) return { notable: true, why: 'gathering' };
    if (typeof q.label === 'string' || (q.ctx && typeof q.ctx.label === 'string')) return { notable: true, why: 'deadline' };
    try { const CU = typeof UI !== 'undefined' && UI.COMING; if (CU && CU.LABELS && CU.LABELS[q.ev]) return { notable: true, why: 'deadline' }; } catch (x) {}
    const pc = A.pc && A.pc();
    return Y.def(q.ev, !!(pc && A.isAdult && A.isAdult(pc)));
  };
  Y.notable = q => Y.classify(q).notable;

  // ---- what a long step meets -----------------------------------------------------------------------------------------
  Y.KEEP = 6;                           // small cards a year hands back at its end; more pass (and are counted)
  const st = () => (V2T.st ? V2T.st() : null);
  const monthName = () => (V2T.MONTHS || [])[V2T.monthOf ? V2T.monthOf(A.S.warClock || 0) : 0] || '';
  const REASON = {
    battle: 'A battle.', duel: 'A duel.', campaign: 'A call to arms.', warroom: 'The war calls you.',
    forced: 'Something that cannot wait', duty: 'A matter of your office', once: 'A turning point', topic: 'A matter that weighs',
    ruler: 'A matter of rule', weight: 'A choice with real weight', money: 'A great sum rides on it', deadline: 'A deadline', gathering: 'A gathering',
    chain: 'What your choice set going', ask: 'What you asked for', unknown: 'A matter that needs you',
  };
  Y.reasonOf = function (q) {
    const c = Y.classify(q), base = REASON[c.why] || 'A matter that needs you';
    if (q.type !== 'event') return base;
    const t = q.view && q.view.title ? String(q.view.title) : (A.EV && A.EV[q.ev] && typeof A.EV[q.ev].title === 'string' ? A.EV[q.ev].title : '');
    return t ? `${base}: ${t}.` : `${base}.`;
  };

  // the people of the household: parents, their children (your brothers and sisters), your spouse and your children, each
  // as 1 (alive) or 0
  Y.household = function (pc) {
    const out = {};
    const add = id => { if (id == null || id === pc.id || id in out) return; const p = A.P ? A.P(id) : null; if (p) out[id] = p.alive ? 1 : 0; };
    for (const id of pc.parents || []) { add(id); const par = A.P ? A.P(id) : null; if (par) for (const c of par.children || []) add(c); }
    if (pc.spouse != null) add(pc.spouse);
    for (const c of pc.children || []) add(c);
    return out;
  };
  const snapOf = pc => ({ wounds: (pc.wounds || []).length, ill: !!pc.ill, adult: !!(A.isAdult && A.isAdult(pc)), war: !!(V2T.atWar && V2T.atWar(pc)), kin: Y.household(pc), pc: pc.id });
  // what changed since the snapshot, worth ending a year for: a one-line reason, or ''
  Y.changed = function (pc, a) {
    if (!pc || !a || a.pc !== pc.id) return '';
    if ((pc.wounds || []).length > a.wounds) return 'A wound.';
    if (pc.ill && !a.ill) return 'An illness.';
    if (V2T.atWar && V2T.atWar(pc) && !a.war) return 'A call to war.';
    const now = Y.household(pc);
    for (const id in a.kin) if (a.kin[id] === 1 && now[id] === 0) return 'A death in the household.';
    for (const id in now) if (!(id in a.kin)) { const p = A.P(id); return p && A.age(p) < 1 ? 'A birth in the household.' : 'A new face in the household.'; }
    if (!a.adult && A.isAdult && A.isAdult(pc)) return 'You come of age.';
    return '';
  };

  // ---- the step's hooks (84-top-bar/step.core.js) ----------------------------------------------------------------------
  const ST = typeof UI !== 'undefined' ? UI.stepper : null;
  if (ST && UI.stepHead) {
    // the long steps (a month, a year) set routine cards aside; a day or a week on campaign meets everything
    // (A.V2Y.PARK = false puts that off: a step then meets every card as it falls, as the release's did)
    Y.PARK = true;
    const parks = () => Y.PARK && ST.run && (ST.kind === 'month' || ST.kind === 'year');
    UI.stepHead = function () {
      UI.quietSettle();
      for (let g = 0; g < 80; g++) {
        const h = A.headReady();
        if (!h) return null;
        if (!parks() || Y.notable(h)) {
          if (ST.kind === 'year' && !ST.why) ST.why = `${monthName()}: ${Y.reasonOf(h)}`;
          return h;
        }
        // a routine card: set aside until the step ends (kept in the state, so a save made meanwhile keeps it)
        const s = st(); A.S.queue.shift(); s.parked = s.parked || []; s.parked.push(h);
      }
      return A.headReady();
    };
    UI.stepBegin = function (kind) {
      const pc = A.pc();   // (nothing is written to the world here: the step is a span of days, and only that)
      ST.yr = { kind, snap: pc ? snapOf(pc) : null, quiet: 0, lastQ: A.absDay(), passed: 0, held: 0, y0: A.S.year, age0: pc ? A.age(pc) : 0, coin0: pc ? +pc.coin || 0 : 0, health0: pc ? +pc.health || 0 : 0, lines0: logLen() };
    };
    UI.stepTick = function () {
      const yr = ST.yr; if (ST.kind !== 'year' || !yr) return '';
      const s = st(), q = s && s.quiet;
      if (q && q.d > yr.lastQ) { yr.lastQ = q.d; yr.quiet++; }
      const pc = A.pc(), wc = A.S.warClock || 0;
      const why = pc && pc.alive ? Y.changed(pc, yr.snap) : '';
      if (why) return `${monthName()}: ${why}`;
      if (ST.esc && MS().includes(wc - 1)) return `${monthName()}: you ended the year here.`;
      return '';
    };
    // as a step ends (before its one redraw): the small cards come back, one at a time, and a year writes its digest
    UI.stepEnding = function () {
      const s = st(), pc = A.pc(), yr = ST.yr; ST.yr = null;
      let kept = 0, passed = 0;
      if (s && s.parked && s.parked.length) {
        const P = s.parked; s.parked = [];
        if (pc && pc.alive) {
          kept = Math.min(P.length, ST.kind === 'year' ? Y.KEEP : 3);
          for (const q of P.slice(0, kept)) A.S.queue.push(q);
          passed = P.length - kept;
          if (passed) A.log(`${passed} small matter${passed === 1 ? '' : 's'} passed without you.`, 'muted');
        }
      }
      if (ST.kind === 'year' && yr && pc && pc.alive) ST.sum = digest(yr, pc, kept, passed);
    };
  }
  // a save made while a step held cards: they come back with the load
  const des = A.deserialize;
  if (typeof des === 'function') A.deserialize = function () {
    const r = des.apply(this, arguments);
    try { const s = st(); if (s && s.parked && s.parked.length) { for (const q of s.parked) A.S.queue.push(q); s.parked = []; } } catch (e) { console.error('next year: parked cards', e); }
    return r;
  };

  // ---- the digest ---------------------------------------------------------------------------------------------------------
  const logLines = () => { const L = A.S && A.S.log; const out = []; if (Array.isArray(L)) for (const e of L) if (e && Array.isArray(e.lines)) for (const l of e.lines) out.push(l); return out; };
  const logLen = () => logLines().length;
  // a quiet month's filler line (99992-v2-time's) is counted, not listed
  const filler = () => { const f = new Set(); for (const k in (V2T.QUIET || {})) for (const t of V2T.QUIET[k]) f.add(t); return f; };
  function digest(yr, pc, kept, passed) {
    const F = filler();
    const all = logLines().slice(yr.lines0).filter(l => Array.isArray(l) && l[1] !== 'lore').map(l => String(l[0] || '').replace(/<[^>]*>/g, '').trim()).filter(t => t && !F.has(t));
    return { kind: 'year', year: yr.y0, age: A.age(pc), from: yr.y0, quiet: yr.quiet, why: ST.why || '', early: !!ST.why, kept, passed, lines: all.slice(-4), n: all.length,
      coin: Math.round((+pc.coin || 0) - yr.coin0), health: Math.round((+pc.health || 0) - yr.health0), months: monthsRun(yr) };
  }
  const monthsRun = yr => Math.max(1, Math.round((A.absDay() - (ST.from || A.absDay())) / 30.4));
  // the toast of a year that met nothing at all
  V2T.yearLine = function () {
    const m = ST.sum, n = m && m.kind === 'year' ? m.quiet : 0;
    return n ? `The year goes by: ${n} quiet month${n === 1 ? '' : 's'}.` : 'The year passes.';
  };
  if (typeof UI !== 'undefined') {
    const esc = s => UI.esc(s);
    UI.stepSumHtml = function () {
      const m = ST && ST.sum, pc = A.pc && A.pc();
      if (!m || m.kind !== 'year' || !pc || ST.run || !pc.alive) return '';
      const sign = (v, u) => `${v > 0 ? '+' : v < 0 ? '−' : '±'}${Math.abs(v)}${u}`;
      const bits = [];
      bits.push(m.coin ? `coin ${sign(m.coin, Math.abs(m.coin) === 1 ? ' sun' : ' suns')}` : 'coin unchanged');
      bits.push(m.health ? `health ${m.health > 0 ? 'better' : 'worse'}` : 'health unchanged');
      if (m.quiet) bits.push(`${m.quiet} quiet month${m.quiet === 1 ? '' : 's'}`);
      const head = m.early ? 'Your year, cut short' : `Your year, ${m.year}`;
      const news = m.lines.length ? `<ul class="step-sum-news small">${m.lines.map(t => `<li>${esc(t.length > 160 ? t.slice(0, 157) + '…' : t)}</li>`).join('')}</ul>${m.n > m.lines.length ? `<div class="tiny muted">and ${m.n - m.lines.length} more line${m.n - m.lines.length === 1 ? '' : 's'} in your story</div>` : ''}` : '';
      const waits = m.kept ? `<div class="small">${m.kept} small matter${m.kept === 1 ? ' waits' : 's wait'} for you, one at a time.</div>` : '';
      const pass = m.passed ? `<div class="tiny muted">${m.passed} more passed without you.</div>` : '';
      return `<div class="card step-sum year-sum" role="status" aria-label="${esc(head)}"><div class="row"><b class="step-sum-h">${esc(head)}</b><span class="tiny muted">age ${m.age} · ${esc(bits.join(' · '))}</span><span class="grow"></span>` +
        `<button class="small ghost" data-a="stepSumX" aria-label="Dismiss this note">${UI.icon ? UI.icon('x', 's') : '×'}</button></div>` +
        `<div class="small year-why">${esc(m.why || 'A year, and nothing in it that needed you.')}</div>${waits}${news}${pass}</div>`;
    };
  }

  // ---- no pool of initiative (D-019); overtraining has its own consequences -----------------------------------------------
  // The release spent "initiative" (⧗) on every activity and let it refill at about seven days a year. The pool is lifted
  // so far that nothing is ever refused (A.initiativeCap), and every day what was spent since the last day is moved from
  // the pool into LOAD. Load drains A.V2Y.RECOVER a month; above A.V2Y.CAP a body is driven too hard.
  Y.BIG = 60; Y.CAP = 6; Y.RECOVER = 4;
  A.initiativeCap = function () { return Y.BIG; };
  Y.state = function () {
    const S = A.S; if (!S) return null;
    if (!S.v2y || typeof S.v2y !== 'object') S.v2y = { load: 0, reset: true };
    return S.v2y;
  };
  A.onDay.push(function () {
    const S = A.S, y = Y.state(); if (!y) return;
    if (y.reset) { y.reset = false; S.time = Y.BIG; return; }          // a new life, a new year: the pool was written by the engine
    if (typeof S.time === 'number' && S.time < Y.BIG) y.load = Math.round((y.load + (Y.BIG - S.time)) * 100) / 100;
    S.time = Y.BIG;
  });
  A.onYear.push(function () { const y = Y.state(); if (y) y.reset = true; });
  const GDW = typeof GD !== 'undefined' ? GD.WOUNDS : null;
  if (GDW && !GDW.strain) GDW.strain = { name: 'A strained back', fx: { str: -2, sta: -2 }, years: 1 };
  Y.weigh = function (pc) {
    const y = Y.state(); if (!y || !pc || !pc.alive) return;
    const over = y.load - Y.CAP;
    if (over > 0) {
      const M = A.MOODS, rest = Math.min(40, Math.round(4 * over));
      if (M && M.touch) M.touch(pc, { rest: -rest });
      const hurt = Math.min(5, Math.ceil(over / 2));
      if (over >= 2) pc.health = Math.max(1, (+pc.health || 0) - hurt);
      if (!y.warned) { y.warned = 1; A.log('You have driven yourself too hard. Your body wants its rest.', 'warn'); }
      if (over >= 4 && A.addWound && A.chance(Math.min(0.6, 0.1 * (over - 3)))) {
        const w = A.addWound(pc, 'strain');
        if (w) { A.log(`You pull something, pushing on past your strength: ${w.toLowerCase()}.`, 'bad'); pc.lastHurt = 'overwork'; }
      }
    } else if (y.warned && y.load < Y.CAP / 2) y.warned = 0;
    y.load = Math.max(0, Math.round((y.load - Y.RECOVER) * 100) / 100);
  };
  A.onMonth.push(pc => { try { Y.weigh(pc); } catch (e) { console.error('overtraining', e); } });

  // ---- the page: the ⧗ cost marks go (a pure pass over the page after it is drawn) ------------------------------------------
  if (typeof document !== 'undefined' && typeof UI !== 'undefined') {
    const RX = /\s*\(\d+(?:\.\d+)?\s*⧗\)/g;
    Y.strip = function (root) {
      root = root || document.body; if (!root || !root.textContent || root.textContent.indexOf('⧗') < 0) return 0;
      let n = 0;
      for (const el of [...root.querySelectorAll('.cost, .tag')]) if (/^\s*\d+(?:\.\d+)?\s*⧗\s*$/.test(el.textContent)) { el.remove(); n++; }
      const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), hits = [];
      for (let t = tw.nextNode(); t; t = tw.nextNode()) if (t.nodeValue.indexOf('⧗') >= 0) hits.push(t);
      for (const t of hits) { const v = t.nodeValue.replace(RX, ''); if (v !== t.nodeValue) { t.nodeValue = v; n++; } }
      for (const el of root.querySelectorAll('[title*="⧗"], [aria-description*="⧗"], [aria-label*="⧗"]')) {
        for (const a of ['title', 'aria-description', 'aria-label']) { const v = el.getAttribute(a); if (v && v.indexOf('⧗') >= 0) el.setAttribute(a, v.replace(RX, '')); }
      }
      return n;
    };
    for (const k of ['refresh', 'render', 'refreshTab', 'renderModal']) {
      const f = UI[k];
      if (typeof f !== 'function') continue;
      UI[k] = function () {
        const r = f.apply(this, arguments);
        try { if (UI.screen === 'game') Y.strip(k === 'renderModal' ? document.getElementById('modal') || undefined : undefined); } catch (e) { console.error('cost marks', e); }
        return r;
      };
    }
  }
})();
