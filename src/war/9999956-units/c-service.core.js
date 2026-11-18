// D11-2: service: duties in peace, transfers, and what a role changes on campaign (docs/design/war.md §14.1; D-119 to
// D-121).
//
// A unit always has something to do (order 54: "it took a year and months to be given my first mission"). In peace the
// player's company has a duty for its captain's reasons (data/military/duties.json; A.WHY kind 'duty'): the castle
// watch, a patrol against brigands, the tax escort, the road, the lord's errand, the drill camp, the stores, the
// harbour, the border, the butts. A duty runs three months and its card comes when it starts; a new soldier's company
// has one from his first month. At war the war gives the work (99972-unit-work's missions, the war map).
// Aptitude is noticed in service: once a year another branch's officer may ask for a soldier or sergeant whose skills fit
// that branch better than his own (the muster-master's reading, A.MUSTER.offers), through A.WHY (kind 'transfer').
// A role (D11-1) changes its company on campaign: the surgeon's mate keeps more of the wounded, the forager brings in
// more bread, the clerk and a man of the train stretch it, the provost's man and the clerk hold men who would slip
// away, the standard-bearer, signaller, cook and farrier keep spirits up, the pathfinder (and a scout) sees further, the
// carpenter (and an engineer) gets the division over a river at less cost. Each is read by the engine where its measure
// lives (9997-companies, 9999952-men's ledger, 99997-v2-war's sight, 999911-d9-ground's crossings).
(function () {
  const U = A.UNITS, MU = A.MUSTER;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const r2 = x => Math.round(x * 100) / 100;
  const day = () => (A.absDay ? A.absDay() : 0);
  const month = () => (A.today ? Math.floor(A.today() / 30.4) : 0);
  const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  U.T.dutyDays = 90; U.T.transferGap = 365;

  // ---------------------------------------------------------------- duties in peace
  const rs = (kind, weight, label, source) => ({ kind, weight: r2(weight), label, source: source || null, pub: 1 });
  U.dutyOptions = function (pc) {
    const M = U.mine(pc);
    const B = MU.branchOf(pc), m = pc.mil, d = M ? M.d : (m.div && A.divById ? A.divById(m.div) : null) || null, P = d ? A.S.prov[d.loc] : (A.prov && pc.home != null ? A.prov(pc.home) : null);
    const mo = month(), mk = M ? U.makeup(M.d, M.b) : null, BB = MU.B(B) || {};
    const out = [];
    for (const D of U.duties()) {
      if (!(D.branches || []).includes(B)) continue;
      const r = [rs('duty', .4, `it is work for ${BB.short || 'the company'}`, { t: 'branch', id: B })];
      if (D.id === 'watch') r.push(rs('duty', B === 'garrison' ? 1.2 : .5, D.why, { t: 'post' }));
      if (D.id === 'patrol' && P && (P.unrest || 0) >= 15) r.push(rs('want', clamp((P.unrest || 0) / 30, .3, 1.5), D.why, { t: 'unrest', r: Math.round(P.unrest || 0) }));
      if (D.id === 'escort' && mo >= 7 && mo <= 9) r.push(rs('duty', 1, D.why, { t: 'season', r: mo }));
      if (D.id === 'road' && mo >= 1 && mo <= 4) r.push(rs('want', .8, D.why, { t: 'season', r: mo }));
      if (D.id === 'errand' && m.cmd && /^house:/.test(m.cmd)) r.push(rs('loyalty', .7, D.why, { t: 'lord', id: m.cmd }));
      if (D.id === 'camp') { if (mk && mk.vet < .33) r.push(rs('want', 1, D.why, { t: 'men', r: mk.vet })); if (mo >= 2 && mo <= 4) r.push(rs('want', .4, 'spring is the season for it', { t: 'season', r: mo })); }
      if (D.id === 'stores' && mo >= 5 && mo <= 6) r.push(rs('duty', .8, D.why, { t: 'season', r: mo }));
      if (D.id === 'harbour' && P && P.coast) r.push(rs('duty', 1, D.why, { t: 'coast' }));
      if (D.id === 'border' && P && d && (P.adj || []).some(j => { const q = A.S.prov[j]; return q && q.owner && q.owner !== d.r && A.hostile && A.hostile(d.r, q.owner); })) r.push(rs('fear', 1, D.why, { t: 'border' }));
      if (D.id === 'butts') r.push(rs('duty', .3, D.why, { t: 'law' }));
      // the company did it last: a change is wanted
      if (m.duty && m.duty.k === D.id) r.push(rs('cost', -.8, 'the company has just come from it', { t: 'last', id: D.id }));
      out.push({ id: D.id, reasons: r });
    }
    return out;
  };
  U.dutyNow = function (pc) {
    const m = pc.mil, opts = U.dutyOptions(pc);
    if (!opts.length) return null;
    const C = MU.captainOf ? MU.captainOf(pc) : { who: 'cap', name: 'Your captain' };
    const rec = A.WHY.decide(C.who, 'duty', opts, { band: .6, at: pc.id, r: m.realm, rand: MU.rng('du:' + pc.id + ':' + day()) });
    if (!rec) return null;
    const D = U.duties().find(x => x.id === rec.chose);
    m.duty = { k: D.id, d0: day(), d1: day() + U.T.dutyDays, why: rec.why.slice(0, 2).map(x => x[0]) };
    A.queue({ type: 'event', ev: 'un_duty', forced: true, ctx: { dutyT: D.name, whyT: m.duty.why.join(', and ') || D.why, capT: C.name, dk: D.id } });
    return m.duty;
  };

  // ---------------------------------------------------------------- transfers
  U.transferAsk = function (pc) {
    const m = pc.mil;
    m.trAsk = day();
    const M = MU.offers(pc, { cmd: m.cmd, rid: m.realm, log: false });
    if (!M || !M.offers.length) return null;
    const own = m.branch, top = M.offers[0];
    if (top.b === own || top.b === 'conscripts') return null;
    const mine = M.offers.find(x => x.b === own);
    const gap = mine ? top.score - mine.score : 2;
    if (gap < 1) return null;
    const B = MU.B(top.b), who = 'tr:' + top.b + ':' + (m.cmd || m.realm);
    const opts = [
      { id: 'ask', reasons: top.why.map(l => rs('merit', .8, l, { t: 'reading', id: top.b })).concat(M.gaps[top.b] ? [rs('want', .8, `${B.short} are short of men`, { t: 'gap', id: top.b })] : []) },
      { id: 'none', reasons: [rs('cost', .7, 'his own captain will not want to lose him', { t: 'captain' })].concat((m.rank | 0) >= 1 ? [rs('cost', .3, 'he has a section to mind', { t: 'rank' })] : []) },
    ];
    const rec = A.WHY.decide(who, 'transfer', opts, { band: .4, at: pc.id, r: m.realm, rand: MU.rng('tr:' + pc.id + ':' + day()), logIf: x => x.chose === 'ask' });
    if (!rec || rec.chose !== 'ask') return rec;
    const officer = A.oobLeader ? A.oobLeader(m.realm || pc.realm, who, 3).name : 'an officer';
    A.queue({ type: 'event', ev: 'un_transfer', forced: true, ctx: { tb: top.b, branchT: MU.nameOf(B, m.cmd && A.CMD ? A.CMD.get(m.cmd) : null).replace(/^The /, 'the '), officerT: officer, whyT: top.why.join(', and ') } });
    return rec;
  };

  // ---------------------------------------------------------------- what a role changes on campaign (the engine reads these)
  // the player's role in a company (division id, battalion index), or his branch's work in his division
  const me = () => { const pc = A.pc && A.pc(); return pc && pc.alive && pc.mil && !pc.mil.merc ? pc : null; };
  U.roleAt = function (d, i) {
    const pc = me(), r = pc && pc.mil.role;
    if (!r || !d || !r.co) return null;
    const p = r.co.split(':');
    return p[0] === d.id && (i == null || +p[1] === i) ? r.k : null;
  };
  const inDiv = d => { const pc = me(); return !!(pc && d && pc.mil.div === d.id); };
  const branchIn = (d, b) => { const pc = me(); return !!(pc && d && pc.mil.div === d.id && MU.branchOf(pc) === b); };
  // morale at rest: the colours, the horn, the pot, the horse lines (9997's CO.restVal and CO.restOne)
  const MORALE = { bearer: 4, signaller: 3, cook: 2 };
  U.roleMorale = function (d, i) {
    const k = U.roleAt(d, i);
    if (!k) return 0;
    if (k === 'farrier') return GD.BN[d.bs[i].c] && GD.BN[d.bs[i].c].cat === 'horse' ? 3 : 0;
    return MORALE[k] || 0;
  };
  // of the dead in a fight, the share who are wounded and can come back (9997: a third; the surgeon's mate's battalion more)
  U.woundF = (d, i) => (U.roleAt(d, i) === 'surgeon' ? 1.6 : 1);
  // the bread a foraging party brings in, and the land's anger at it
  U.forageF = d => (inDiv(d) && U.roleAt(d) === 'forager' ? 1.7 : 1);
  U.forageUnrestF = d => (inDiv(d) && U.roleAt(d) === 'forager' ? .6 : 1);
  // a day's bread eaten: the train and a clerk who keeps the stores stretch it
  U.eatF = d => (inDiv(d) && (branchIn(d, 'train') || U.roleAt(d) === 'clerk') ? .85 : 1);
  // holds on the ledger (9999952-men): men who would slip away
  U.ledgerHolds = function (d) {
    const out = [];
    if (!inDiv(d)) return out;
    const k = U.roleAt(d);
    if (k === 'provost') out.push(['A provost\'s man who knows every face', .6, 'role']);
    if (k === 'clerk') out.push(['A clerk who keeps the pay roll true', .4, 'role']);
    if (k === 'bearer') out.push(['Their colours, carried well', .3, 'role']);
    return out;
  };
  // how far the player sees on campaign (99997-v2-war's sight): a pathfinder or a scout one march further
  U.sees = function (pc) {
    if (!pc || !pc.mil) return 0;
    return pc.mil.role && pc.mil.role.k === 'pathfinder' || MU.branchOf(pc) === 'scouts' ? 1 : 0;
  };
  // an attack over a river (999911-d9-ground): the carpenter's or an engineer's division comes over at less cost
  U.crossF = function (d, f) {
    if (!(f < 1) || !inDiv(d)) return f;
    const pc = me(), k = pc.mil.role && pc.mil.role.k;
    return k === 'carpenter' || MU.branchOf(pc) === 'engineers' ? 1 - (1 - f) * .6 : f;
  };

  // ---------------------------------------------------------------- the month
  U.month = function (pc) {
    const m = pc && pc.alive && pc.mil;
    if (!m || m.merc || pc.id !== A.S.pc) return;
    const war = A.atWar ? A.atWar(m.realm || pc.realm).length > 0 : false;
    // the company's drill
    try { U.drillMonth(pc); } catch (e) { console.error('[units] drill', e); }
    // a duty in peace: none, or the last one done
    // D11-3: a duty seen through is a deed of service the promotion board reads (A.LADDER.dutyDone, R12)
    if (m.duty && day() >= m.duty.d1 && !m.duty.done) { m.duty.done = 1; if (A.LADDER && A.LADDER.dutyDone) A.LADDER.dutyDone(pc, m.duty); }
    if (!war && !m.call && (!m.duty || day() >= m.duty.d1) && !(A.S.queue || []).some(q => q && q.ev === 'un_duty')) U.dutyNow(pc);
    else if (m.duty && day() < m.duty.d1) {
      const D = U.duties().find(x => x.id === m.duty.k);
      if (D && A.gainXp) A.gainXp(pc, D.skill, .25, { q: 'practice', why: D.name });
    }
    if (war && m.duty) delete m.duty;
    // a transfer, once a year, for a soldier or sergeant
    if ((m.rank | 0) <= 2 && m.branch !== 'conscripts' && !m.call) {
      if (m.trAsk == null) m.trAsk = day();
      else if (day() - m.trAsk >= U.T.transferGap) U.transferAsk(pc);
    }
  };
  A.onMonth.push(pc => { try { U.month(pc); } catch (e) { console.error('[units] month', e); } });

  // ---------------------------------------------------------------- the cards' answers
  (A.FX_EXTRA = A.FX_EXTRA || []).push('unDrill', 'unDuty', 'unTransfer');
  A.addStage('A.applyFx', 'units', baseFx => function (pc, fx, ctx) {
    const out = baseFx.apply(this, arguments);
    try {
      if (!fx || typeof fx !== 'object' || !pc || pc.id !== A.S.pc || !ctx || !pc.mil) return out;
      const m = pc.mil;
      if (fx.unDrill) {
        if (fx.unDrill === 'hard' && A.gainXp) { A.gainXp(pc, ctx.tk || 'command', 1.2, { q: 'stretch', why: `the company's drill: ${ctx.drillT}` }); m.merit = (m.merit || 0) + 1; }
        if (fx.unDrill === 'teach' && A.gainXp) { A.gainXp(pc, 'command', .8, { q: 'stretch', why: 'teaching the raw men' }); m.merit = (m.merit || 0) + 1.5; }
        if (fx.unDrill === 'easy' && A.gainXp) A.gainXp(pc, ctx.tk || 'command', .3, { q: 'practice', why: `the company's drill: ${ctx.drillT}` });
      }
      if (fx.unDuty) {
        const D = U.duties().find(x => x.id === ctx.dk);
        if (D && A.gainXp) A.gainXp(pc, D.skill, fx.unDuty === 'well' ? 1 : fx.unDuty === 'share' ? .5 : 0, { q: fx.unDuty === 'well' ? 'stretch' : 'practice', why: D.name });
        if (fx.unDuty === 'well') m.merit = (m.merit || 0) + 2;
        if (m.duty && m.duty.k === ctx.dk) m.duty.q = fx.unDuty;   // how it was done, for the board (D11-3)
        if (fx.unDuty === 'caught') m.merit = Math.max(0, (m.merit || 0) - 2);
      }
      if (fx.unTransfer === 'go' && ctx.tb && MU.assign) MU.assign(pc, ctx.tb);
    } catch (e) { console.error('[units] fx', e); }
    return out;
  });
})();
