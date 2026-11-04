// Needs and moods (Road to Ten, Character 3). The release had one feeling, `happy`. Now a person has four needs, each
// settling month by month toward where their life puts it and pushed up by living: rest (low under a hard training
// plan or in war; met by rest, festivals, prayer), company (follows friends, a loving spouse, children; met by a
// tavern, a friend, a supper), purpose (follows work, rank and office; met by study, practice, a venture) and comfort
// (follows coin, health and freedom). The lowest need, once it is low, sets a mood with its
// cause, "Lonely: it has been months since you spent an evening with anyone", and moods start their own scenes.
// Moods nudge happiness each month, so a life you neglect slowly sours.
//
// Engine side: the month hook and wrapped actions change pc.needs; rendering only reads them.
(function () {
  const M = A.MOODS = {
    NEEDS: ['rest', 'company', 'purpose', 'comfort'],
    LOW: 30,       // a need below this sets a mood
    // which activities meet which needs, and by how much
    ACT: {
      rest: { rest: 30 }, heal: { rest: 20, comfort: 5 }, festival: { rest: 15, company: 20 }, pray: { rest: 8, purpose: 6 }, meditate: { rest: 12 },
      pilgrimage: { purpose: 20, rest: -10 }, tavern: { company: 22, rest: 5 }, make_friend: { company: 25 }, court_love: { company: 20 },
      play: { rest: 10, company: 12 }, gamble: { company: 10 }, study: { purpose: 12 }, practice: { purpose: 10, rest: -4 }, train_yard: { purpose: 8, rest: -5 },
      run: { rest: -4, purpose: 5 }, lift: { rest: -4, purpose: 5 }, school: { purpose: 15, company: 5 }, chores: { purpose: 6, rest: -3 },
      trade_venture: { purpose: 12 }, moneylend: { purpose: 6 }, explore: { purpose: 12, rest: -6 }, travel: { purpose: 8, rest: -6 },
      hunt: { purpose: 8, rest: -4 }, beast_hunt: { purpose: 12, rest: -8 }, tournament: { purpose: 12, company: 8, rest: -8 }, duel: { purpose: 8, rest: -6 },
    },
    MOOD: {
      rest: { name: 'Weary', why: 'you have worked and trained without a day to yourself' },
      company: { name: 'Lonely', why: 'it has been months since you spent an evening with anyone' },
      purpose: { name: 'Adrift', why: 'nothing you do feels like it leads anywhere' },
      comfort: { name: 'In want', why: 'there is too little coin and too little warmth' },
    },
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // a person's needs; missing (an old save, or a person not yet lived as) means all met
  M.needs = p => {
    const n = p && p.needs && typeof p.needs === 'object' ? p.needs : null;
    const o = {}; for (const k of M.NEEDS) o[k] = n && typeof n[k] === 'number' ? n[k] : 70;
    return o;
  };
  const touch = (p, d) => {
    if (!p || p.id !== A.S.pc) return;
    const n = p.needs = M.needs(p);
    for (const k in d) if (k in n) n[k] = clamp(n[k] + d[k], 0, 100);
  };
  M.touch = touch;
  // the mood: the lowest need, if it is low; content if every need is well met
  M.mood = p => {
    const n = M.needs(p), low = M.NEEDS.slice().sort((a, b) => n[a] - n[b])[0];
    if (n[low] < M.LOW) return { k: low, name: M.MOOD[low].name, why: M.MOOD[low].why };
    if (M.NEEDS.every(k => n[k] >= 65)) return { k: 'content', name: 'Content', why: 'your days are full and your nights are quiet' };
    return null;
  };
  // comfort's target from coin, class, health and freedom
  M.comfortTarget = p => {
    const cls = A.classOf ? A.classOf(p) : 3, coin = Math.max(0, p.coin || 0);
    const need = 20 * Math.pow(2.2, cls);   // what feels like enough grows with rank
    let t = 50 + 25 * Math.log10((coin + 1) / need);
    t += ((p.health || 0) - 70) / 3;
    if (p.flags && p.flags.unfree) t -= 15;
    if (p.prison) t -= 30;
    return clamp(t, 0, 100);
  };

  // where each need settles when nothing is done about it: rest with how hard you drive yourself, company with the
  // people in your life, purpose with what you are for, comfort with coin and health
  M.targets = p => {
    const P = A.plan ? A.plan(p) : null, I = (P && P.intensity) || 'steady';
    const atWar = p.mil && A.atWar && A.atWar(p.mil.realm).length;
    const rest = 70 + ({ rest: 15, light: 8, steady: 0, hard: -25, brutal: -45 }[I] || 0) - (atWar ? 20 : 0) - (p.health < 40 ? 15 : 0);
    const rels = A.relsOf ? A.relsOf(p, null).filter(x => x.p.alive && (x.r.op || 0) >= 30).length : 0;
    const sp = p.spouse && A.P(p.spouse), love = sp && sp.alive && ((sp.rel || {})[p.id] || {}).op >= 30;
    const kids = (p.children || []).filter(c => A.P(c) && A.P(c).alive).length;
    const company = 25 + Math.min(4, rels) * 9 + (love ? 15 : 0) + Math.min(2, kids) * 4 + (A.age(p) < 16 ? 25 : 0);
    const purpose = 35 + (p.job ? 10 + 3 * (p.job.r || 0) : 0) + (p.mil ? 10 + 2 * p.mil.rank : 0) + (p.ruler ? 25 : 0) + (p.office ? 15 : 0) + (A.age(p) < 16 ? 30 : 0);
    return { rest: clamp(rest, 0, 100), company: clamp(company, 0, 95), purpose: clamp(purpose, 0, 95), comfort: M.comfortTarget(p) };
  };
  // the month: each need moves a quarter of the way toward where it settles, and moods move happiness
  A.onMonth.push(pc => {
    if (!pc || !pc.alive || A.age(pc) < 6) return;
    const n = pc.needs = M.needs(pc), T = M.targets(pc);
    for (const k of M.NEEDS) n[k] = clamp(n[k] + (T[k] - n[k]) * 0.25, 0, 100);
    const avg = M.NEEDS.reduce((a, k) => a + n[k], 0) / 4;
    pc.happy = clamp((pc.happy || 50) + (avg - 50) / 25, 0, 100);
    const m = M.mood(pc);
    if (m && m.k !== 'content' && pc.moodK !== m.k) A.log(`${m.name}: ${m.why}.`, 'muted');
    pc.moodK = m ? m.k : null;
  });

  // living meets needs
  const act = A.doActivity;
  A.doActivity = function (key) {
    const r = act.apply(this, arguments);
    try { if (r && r.ok !== false && M.ACT[key]) touch(A.pc(), M.ACT[key]); } catch (e) { console.error('moods', e); }
    return r;
  };
  if (typeof A.interact === 'function') { const f = A.interact; A.interact = function () { const r = f.apply(this, arguments); try { if (r && r.ok !== false) touch(A.pc(), { company: 12 }); } catch (e) {} return r; }; }
  if (typeof A.doWork === 'function') { const f = A.doWork; A.doWork = function () { const r = f.apply(this, arguments); try { if (r && r.ok !== false) touch(A.pc(), { purpose: 14, rest: -4 }); } catch (e) {} return r; }; }
  // an event choice that makes you happier, or brings you in company, meets a little of the matching need
  const choose = A.eventChoose;
  A.eventChoose = function () {
    const q = A.S.queue[0], pc = A.pc(), h0 = pc && pc.happy;
    const r = choose.apply(this, arguments);
    try { if (pc && q && q.type === 'event' && q.ctx && q.ctx.pid) touch(pc, { company: 6 }); if (pc && pc.happy > h0) touch(pc, { comfort: 2 }); } catch (e) {}
    return r;
  };
  for (const k of ['variety']) if (choose[k]) A.eventChoose[k] = choose[k];

  // fx.need: { rest, company, purpose, comfort } in any event's effects (declared for tools/lint-events.mjs)
  (A.FX_EXTRA = A.FX_EXTRA || []).push('need');
  const apply = A.applyFx;
  A.applyFx = function (pc, fx) {
    const r = apply.apply(this, arguments);
    try { if (fx && typeof fx === 'object' && fx.need && typeof fx.need === 'object') touch(pc, fx.need); } catch (e) { console.error('moods fx', e); }
    return r;
  };

  // the Life tab: how you are
  const life = UI.TAB.life;
  UI.TAB.life = function (pc) {
    const h = life.apply(this, arguments);
    if (!pc || !pc.alive || A.age(pc) < 6) return h;
    const n = M.needs(pc), m = M.mood(pc), NAME = { rest: 'Rest', company: 'Company', purpose: 'Purpose', comfort: 'Comfort' };
    const bar = k => `<div class="row tiny" style="gap:6px;align-items:center"><span style="min-width:64px">${NAME[k]}</span><span class="hpbar" style="flex:1;height:6px;background:var(--line,#8884);border-radius:3px;overflow:hidden"><span style="display:block;height:100%;width:${Math.round(n[k])}%;background:${n[k] < M.LOW ? 'var(--bad,#c55)' : 'var(--gold,#c9a54a)'}"></span></span><span class="muted" style="min-width:24px;text-align:right">${Math.round(n[k])}</span></div>`;
    const card = `<div class="card small moods" aria-label="How you are"><div class="row"><b>How you are</b><span class="right ${m && m.k !== 'content' ? 'bad' : 'good'}">${m ? UI.esc(m.name) : 'Well enough'}</span></div>` +
      (m ? `<div class="tiny muted">${UI.esc(m.name)}: ${UI.esc(m.why)}.</div>` : '') + M.NEEDS.map(bar).join('') + '</div>';
    const at = h.indexOf('<div class="row small muted" style="margin:6px 0 4px">');
    return at > 0 ? h.slice(0, at) + card + h.slice(at) : h + card;
  };
  // a helper for events
  A.C.mood = (p, k) => { const m = M.mood(p); return !!m && (k ? m.k === k : m.k !== 'content'); };
})();
