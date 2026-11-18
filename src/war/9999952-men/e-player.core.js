// W1-4: what the player meets of the three kinds of men (docs/design/war.md §10; D-090). By his place:
//   a commoner of fighting age whose parish a call reaches has his hearth's lot drawn (mn_lot): go, buy a substitute,
//     hide, or take to the roads, each with its consequences. Unmarried men first, then married men without children;
//     never a hearth's only man except at the last call; priests, a lord's officers, millers and smiths are spared.
//     He may also volunteer as before (the army path): that is the roll and the regiments.
//   a ruler proclaims a call himself (mn_proclaim: no call or a call the need allows, with what each costs) and decides
//     at the term's end (mn_release: home, home with a bounty, or held past the term).
//   a soldier sees his company's ledger in words on the War tab (UI.menCard): what holds it, what pulls at it, and any
//     mutiny brewing with its grievance and its voice; and his realm's open call. No numbers, notes open on a tap.
(function () {
  const M = A.MEN, CA = A.CALLS, L = A.LEDGER;
  if (!M || !CA) return;
  const esc = s => (UI.esc ? UI.esc(s) : String(s));
  const short = id => (A.realm(id) ? A.realmShort(id) : String(id || ''));
  const live = p => !!(p && p.alive);
  (A.FX_EXTRA = A.FX_EXTRA || []).push('mnLot', 'mnCall', 'mnRelease');

  // ---------------------------------------------------------------- the lot
  const SPARED = /priest|monk|nun|cleric|miller|smith|steward|reeve|bailiff|clerk/i;
  CA.lotOdds = function (pc, call) {
    if (!pc || !pc.alive || pc.sex !== 'M' || pc.ruler || pc.mil || pc.noble || pc.status === 'noble' || pc.status === 'royal') return 0;
    const age = A.age(pc);
    if (age < 16 || age > 45) return 0;
    if (!call.provs.some(p => p[0] === pc.home)) return 0;
    const job = pc.job && GD.CAREERS && GD.CAREERS[pc.job.c] ? GD.CAREERS[pc.job.c].ranks[pc.job.r][0] : '';
    if (SPARED.test(job) || SPARED.test(pc.occ || '')) return 0;
    const D = CA.DEG[call.deg - 1], married = pc.spouse != null && A.P(pc.spouse) && A.P(pc.spouse).alive;
    const kids = (pc.children || []).some(id => { const k = A.P(id); return k && k.alive && A.age(k) < 16; });
    // the hearth's only man goes only at the last call
    if (married && kids && call.deg < 3) return 0;
    return Math.min(1, (1 / D.of) * (married ? 1 : 1.6) * (call.half ? .5 : 1));
  };
  CA.lotFor = function (call) {
    const pc = A.pc && A.pc();
    if (!pc || pc.realm !== call.r) return;
    const p = CA.lotOdds(pc, call);
    if (!p) return;
    // the lot itself, drawn at the church door: chance, for a reason (the call); lint-reasons: ok (a lottery by law, not a decision)
    if (!(A.rand() < p)) return;
    const D = CA.DEG[call.deg - 1];
    const cost = 30 + 25 * call.deg;
    A.queue({ type: 'event', ev: 'mn_lot', ctx: { cid: call.id, callT: D.word, hearthT: D.hearth, termT: D.term, needT: call.need.l, subN: cost, subT: A.coin ? A.coin(cost) : cost + ' suns' } });
  };
  A.on && A.on('callProclaimed', function (call) { try { CA.lotFor(call); } catch (e) { console.error('[men] lot', e); } });

  // the soldier's place in a call: into the conscript foot of his own lord's contingent (or the crown's)
  CA.pcGo = function (pc, call) {
    if (!pc.mil && A.enlist) { const r = A.enlist(pc, false); if (r && r.ok === false) return r.msg || null; }
    if (!pc.mil) return null;
    pc.mil.call = call.id;
    const ds = CA.divs(call);
    if (ds.length) { pc.mil.div = ds[0].id; if (A.pcDivAttach) try { A.pcDivAttach(pc); } catch (e) {} }
    return null;
  };
  // once the call's men are formed, the player stands in its conscript foot
  const form0 = CA.form;
  CA.form = function (call) {
    const n = form0.apply(this, arguments);
    try {
      const pc = A.pc && A.pc(), ds = n ? CA.divs(call) : [];
      if (pc && pc.mil && pc.mil.call === call.id && ds.length && !ds.some(d => d.id === pc.mil.div)) pc.mil.div = ds[0].id;
    } catch (e) { console.error('[men] form', e); }
    return n;
  };
  // the call ends: a conscript goes home (unless he chose to stay on as a soldier of the roll)
  A.on && A.on('callEnded', function (call) {
    try {
      const pc = A.pc && A.pc();
      if (!pc || !pc.mil || pc.mil.call !== call.id) return;
      delete pc.mil.call;
      A.log(`The call of ${call.y} is over. You may go home, or stay on the roll and keep your spear.`, 'war');
      pc.mil.conscriptDone = A.S.year;
    } catch (e) { console.error('[men] end', e); }
  });

  // ---------------------------------------------------------------- the ruler's cards
  CA.askProclaim = function (r, need) {
    const allowed = CA.DEG.filter(D => D.d <= need.deg && D.d > CA.open(r.id).reduce((a, c) => Math.max(a, c.deg), 0));
    if (!allowed.length) return;
    if ((A.S.queue || []).some(q => q && q.ev === 'mn_proclaim')) return;
    const law = CA.lawDeg(r), M3 = d => `${CA.DEG[d - 1].hearth}, ${CA.DEG[d - 1].term}`;
    const opts = CA.options(r, need) || [], none = opts.find(o => o.id === 'none');
    A.queue({ type: 'event', ev: 'mn_proclaim', ctx: {
      rid: r.id, needT: need.label, needK: need.t, needB: need.by || '', needA: need.at != null ? need.at : '', deg: need.deg,
      c1T: M3(1), c2T: M3(2), c3T: M3(3), lawT: CA.DEG[law - 1].word,
      againstT: none ? none.reasons.slice(0, 2).map(x => x.label.toLowerCase()).join('; ') || 'the fields' : 'the fields',
    } });
  };
  CA.askRelease = function (call, needNow) {
    if ((A.S.queue || []).some(q => q && q.ev === 'mn_release')) return 'asked';
    const r = A.realm(call.r), out = CA.out(call);
    A.queue({ type: 'event', ev: 'mn_release', ctx: { cid: call.id, yT: String(call.y), menT: A.fmt(out), bountyN: out, bountyT: A.coin ? A.coin(out) : out + ' suns',
      whyT: !needNow ? 'The need they were called for is past.' : call.until != null && A.absDay() >= call.until ? 'Their term is up: they were promised home.' : 'The war goes on.' } });
    return 'asked';
  };
  const needOf = ctx => ({ t: ctx.needK, deg: ctx.deg, label: ctx.needT, by: ctx.needB || null, at: ctx.needA === '' ? null : ctx.needA, w: 1, pub: 1, will: ctx.needK === 'will' ? 1 : 0 });
  // the player's choice is his own decision: written into the record as his, with the reasons the council laid before him
  const pcRecord = (r, kind, chose, reasons) => {
    const rec = { y: A.S.year, d: A.today ? A.today() : 0, who: A.S.pc, k: kind, at: null, r: r.id, chose, s: 0, why: reasons.slice(0, 3).map(x => [x.label, x.weight, x.kind, null, x.pub]), not: [], rej: [], drawn: 0, form: 0 };
    if (!Array.isArray(A.S.why)) A.S.why = [];
    A.S.why.unshift(rec);
    if (A.WHY && A.S.why.length > A.WHY.T.logCap) A.S.why.length = A.WHY.T.logCap;
    return rec;
  };
  A.addStage('A.applyFx', 'men', baseFx => function (pc, fx, ctx) {
    const out = baseFx.apply(this, arguments);
    try {
      if (!fx || typeof fx !== 'object' || !pc || pc.id !== A.S.pc || !ctx) return out;
      const say = s => { if (Array.isArray(out) && s) out.push(s); };
      if (fx.mnLot) {
        const call = CA.byId(ctx.cid);
        if (fx.mnLot === 'go' && call && !call.end) { const m = CA.pcGo(pc, call); if (m) say(m); }
        if (fx.mnLot === 'flee') { pc.flags.deserter = A.S.year; pc.flags.mn_fled = A.S.year; }
        if (fx.mnLot === 'sub') { pc.coin = Math.max(0, (pc.coin || 0) - (ctx.subN || 0)); if (call) call.subs = (call.subs || 0) + 1; }
      }
      if (fx.mnCall != null) {
        const r = A.realm(ctx.rid);
        if (r && r.alive !== false) {
          const need = needOf(ctx), opts = CA.options(r, need) || [], o = opts.find(x => x.id === (fx.mnCall ? 'c' + fx.mnCall : 'none'));
          const rec = pcRecord(r, 'conscript', fx.mnCall ? 'c' + fx.mnCall : 'none', o ? o.reasons : []);
          if (fx.mnCall) { const call = CA.proclaim(r, fx.mnCall, need, rec, { pc: 1 }); if (call) say(`${CA.DEG[call.deg - 1].word[0].toUpperCase() + CA.DEG[call.deg - 1].word.slice(1)} goes out: about ${A.fmt(call.men)} men by lot.`); }
        }
      }
      if (fx.mnRelease) {
        const call = CA.byId(ctx.cid), r = call && A.realm(call.r);
        if (call && r && !call.end) {
          if (fx.mnRelease === 'hold') { if (!call.held && call.until != null && A.absDay() >= call.until) call.held = A.S.year; call.asked = A.absDay(); CA.tell(call, 'hold'); }
          else {
            if (fx.mnRelease === 'bounty') { r.treasury = (r.treasury || 0) - (ctx.bountyN || 0); }
            CA.release(call, fx.mnRelease);
          }
        }
      }
    } catch (e) { console.error('[men] fx', e); }
    return out;
  });

  // ---------------------------------------------------------------- events gated by a call
  // the release's scenes of a man taken for service fire only while a call is out in the player's realm (a need named);
  // the old heavy-law card is retired in favour of mn_lot (its text spoke of a law that took one man in five by itself).
  // Gated the way 58-event-cut retires an event: marked `trigger` (never rolled, only queued) while it may not fire, so
  // its cond, text and setup stay exactly as written (the classifiers and 67-choice-memories read them as text).
  CA.GATED = ['lf_lover_to_war', 'wr_hf_lot', 'ss_rp_muster'];
  CA.RETIRED = ['pl_heavy_call'];
  CA.base = {};
  CA.gate = function () {
    const EV = A.EV || {}, pc = A.pc && A.pc(), open = !!(pc && A.S && CA.open(pc.realm).length);
    for (const id of CA.GATED.concat(CA.RETIRED)) {
      const e = EV[id];
      if (!e) continue;
      if (!(id in CA.base)) CA.base[id] = !!e.trigger;
      // an event 58-event-cut also lists (wr_hf_lot) keeps the cut's own mark: retired unless the classic pool is chosen
      const EC = A.EC, cut = EC && EC.R && id in EC.R ? (EC.classic() ? !!EC.base[id] : true) : null;
      e.trigger = (cut != null ? cut : CA.base[id]) || CA.RETIRED.includes(id) || !open;
    }
  };
  const gate = () => { try { CA.gate(); } catch (e) { console.error('[men] gate', e); } };
  A.on && A.on('worldInit', gate);
  A.on && A.on('callProclaimed', gate);
  A.on && A.on('callEnded', gate);
  A.onMonth.push(gate);
  // (and on load: b-men.core.js's load pass calls A.CALLS.gate)

  // ---------------------------------------------------------------- the War tab: the call and the company's ledger
  UI.menCard = function (pc) {
    if (!pc || !pc.alive) return '';
    const rid = pc.ruler || (pc.mil && !pc.mil.merc ? pc.mil.realm : null);
    if (!rid) return '';
    let h = '';
    const calls = CA.open(rid);
    for (const c of calls.slice(0, 2)) {
      const D = CA.DEG[c.deg - 1];
      const note = `${c.need.l}. ${D.hearth} sends a man, by lot, for ${D.term}.${c.law ? '' : ' Beyond the conscription law.'}${c.held ? ' Held past their term.' : ''}`;
      h += `<div class="row small"><span class="chip">${esc(D.word)}</span> <span class="grow">${esc(c.stage === 'drill' ? 'Conscripts drilling at the musters' : 'Conscripts in the field')}</span><button class="small mn-why" data-note="${esc(note)}">why</button></div>`;
    }
    const d = pc.mil && pc.mil.div ? A.divById(pc.mil.div) : null;
    if (d && L && (d.army || pc.mil.call)) {
      const w = L.words(d);
      if (w) {
        h += `<p class="small"><b>${esc(w.lean)}</b>${w.mut ? ' ' + esc(w.mut) : ''}</p>`;
        if (w.holds.length) h += `<div class="tiny"><span class="muted">What holds them:</span> ${esc(w.holds.join('; '))}</div>`;
        if (w.pulls.length) h += `<div class="tiny"><span class="muted">What pulls at them:</span> ${esc(w.pulls.join('; '))}</div>`;
      }
    }
    if (!h) return '';
    return `<div class="card mn-card"><div class="row">${UI.icon ? UI.icon('users', 's') : ''}<span class="tag">The men</span></div>${h}</div>`;
  };
  // tap targets: the "why" note is a real button, at least 44 points
  {
    try {
      const st = document.createElement('style');
      st.textContent = '.mn-card .mn-why{min-height:44px;min-width:44px;padding:0 10px}.mn-card .row{align-items:center;gap:6px;flex-wrap:wrap}';
      document.head.appendChild(st);
    } catch (e) {}
  }
})();
