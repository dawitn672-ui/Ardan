// 994-careers: what comes after the top of a career, and what a lost throne costs. See README.md.
//
// - A failed claim has teeth. When a war for the throne ends with the claimant crushed and the claimant is you, the
//   career the coup was made from is closed (the commission, the council seat, the titles) and a scene decides the
//   rest: the border, the crown's mercy or the last keep (cr_coup_fate). A claim settled by a bargain ("the claimant
//   kneels") comes with terms (cr_coup_pardon). "Usurper" is awarded when the throne is taken, not when it is tried.
// - A commoner of renown can be raised: knighted (cr_knighted), then given a fief (cr_fief).
// - The top of a ladder has something above it: an honour, a command or an office (cr_honour), and a General can
//   be named Marshal of the council, a merchant prince Treasurer.
// - Promotion above Senior Captain is slower (merit x1.5, General x2), so rank 7 is a life's work, not a young man's.
(function () {
  const CAR = A.CAR = A.CAR || {};
  CAR.OFF = false;
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  const born = p => ['noble', 'royal', 'gentry'].includes(p.status);
  const free = p => !(p.flags && p.flags.unfree);
  const ago = (p, f) => (p.flags && typeof p.flags[f] === 'number' ? A.S.year - p.flags[f] : 999);
  const queued = id => A.S.queue.some(q => q && q.ev === id);
  const ruOf = p => { const r = A.realm(p.realm), ru = r && A.P(r.ruler); return ru && ru.alive && ru.id !== p.id ? ru : null; };
  const deed = (p, t) => { (p.deeds = p.deeds || []).push({ y: A.S.year, t }); };

  // ---- promotion pace ------------------------------------------------------------------------------------------
  // The release's merit bar let a peasant enlisted at 18 lead 12,800 men at 29 and then hold the rank for 44 years.
  // Above Senior Captain the bar is half again as high, and General's twice as high.
  CAR.MERIT_X = { 5: 1.5, 6: 1.5, 7: 2, 8: 2, 9: 2 };
  if (Array.isArray(GD.MIL) && !GD.MIL.carScaled) {
    GD.MIL.forEach((m, r) => { if (CAR.MERIT_X[r] && m && typeof m.merit === 'number') m.merit = Math.round(m.merit * CAR.MERIT_X[r]); });
    Object.defineProperty(GD.MIL, 'carScaled', { value: true });
  }

  // ---- a failed claim ------------------------------------------------------------------------------------------
  // the war for the throne the player claimed has ended; fate: won, crushed, knelt (a bargain) or split (a realm apart)
  CAR.closeCareer = function (pc, why) {
    const lost = [];
    if (pc.mil && !pc.mil.merc) { lost.push(GD.MIL[pc.mil.rank] ? GD.MIL[pc.mil.rank].title.toLowerCase() + "'s commission" : 'commission'); A.leaveRolesFor ? A.leaveRolesFor(pc, 'claimant', true) : null; pc.mil = null; }
    if (pc.office) {
      for (const r of Object.values(A.S.realms || {})) if (r && r.council) for (const k in r.council) if (r.council[k] === pc.id) delete r.council[k];
      lost.push('seat on the council'); pc.office = null;
    }
    if (pc.noble) { lost.push('titles'); pc.noble = null; }
    if (pc.job && ['courtier', 'knight', 'envoy', 'steward', 'lawyer'].includes(pc.job.c)) { lost.push('post'); pc.job = null; }
    if (pc.order) { lost.push('place in the order'); pc.order = null; }
    pc.flags.cr_traitor = A.S.year;
    pc.honor = A.clamp((pc.honor || 0) - 15, 0, 100);
    if (lost.length) A.log(`For ${why}, you lose your ${lost.join(', ')}.`, 'bad');
    return lost;
  };
  CAR.coupEnd = function (pc, w, fate) {
    if (!pc || !pc.alive || pc.id !== A.S.pc) return;
    const crown = A.realmShort ? A.realmShort(w.leadD) : 'the crown';
    if (fate === 'won') { if (pc.ruler) A.ach('usurper'); return; }
    if (fate === 'split') return;
    pc.flags.cr_claim_lost = A.S.year;
    const ru = A.P((A.realm(w.leadD) || {}).ruler);
    if (ru && ru.alive && A.addOp) A.addOp(ru, pc, -60);
    if (fate === 'crushed') {
      CAR.closeCareer(pc, 'treason against ' + crown);
      A.queue({ type: 'event', ev: 'cr_coup_fate', forced: true, ctx: { crown, rid: w.leadD, war: w.name } });
    } else if (fate === 'knelt') {
      A.queue({ type: 'event', ev: 'cr_coup_pardon', forced: true, ctx: { crown, rid: w.leadD, war: w.name } });
    }
  };
  const endWar0 = A.endWar;
  A.endWar = function (w, result, text) {
    let fate = null, pc = null;
    try {
      pc = A.pc();
      if (!CAR.OFF && w && w.cb === 'throne' && pc && pc.alive && w.claimant === pc.id && A.S.wars.includes(w) && !w.end)
        fate = result === 'def' ? 'crushed' : result === 'att' ? 'won' : /kneels/.test(String(text || '')) ? 'knelt' : 'split';
    } catch (e) { fate = null; }
    const r = endWar0.apply(this, arguments);
    if (fate) { try { CAR.coupEnd(pc, w, fate); } catch (e) { console.error('careers coup', e); } }
    return r;
  };
  // the price on your head, a year or three into exile
  CAR.bountyLater = pc => { if (A.schedule && A.EV.cr_coup_bounty) A.schedule({ type: 'event', ev: 'cr_coup_bounty', forced: true, ctx: { crown: A.realmShort(pc.flags.cr_crown || pc.realm) } }, A.ri(300, 1000)); };

  // ---- raised for merit ----------------------------------------------------------------------------------------
  // a commoner of renown: a soldier who has led a few hundred men and made a name, or anyone famous enough
  CAR.knightable = function (p) {
    if (!p || !p.alive || p.ruler || born(p) || !free(p) || p.prison || (p.noble && p.noble.rung >= 2) || p.flags.cr_traitor) return false;
    // twice refused, the crown stops asking (cycle 2, lives F6: offered four times to a man who said no each time)
    if (p.car && (+p.car.knightNo || 0) >= 2) return false;
    if (!A.isAdult(p) || A.age(p) < 24) return false;
    if (!ruOf(p)) return false;
    const fame = p.fame || 0;
    return (p.mil && !p.mil.merc && p.mil.rank >= 5 && fame >= 30) || fame >= 55;
  };
  CAR.fiefable = function (p) {
    if (!p || !p.alive || p.ruler || !p.noble || p.noble.rung < 2 || p.noble.rung >= 4 || p.prison || p.flags.cr_traitor) return false;
    if (A.age(p) < 33 || !ruOf(p)) return false;
    const fame = p.fame || 0;
    return fame >= 55 && ((p.mil && !p.mil.merc && p.mil.rank >= 6) || fame >= 65 || (p.office && fame >= 50));
  };
  // at the top of a ladder: a General or better, the last rank of a trade, a lord with a seat
  CAR.atTop = function (p) {
    if (p.mil && !p.mil.merc && p.mil.rank >= 7) return 'command';
    const J = p.job && GD.CAREERS[p.job.c];
    if (J && p.job.r >= J.ranks.length - 1) return J.cat === 'faith' || p.job.c === 'clergy' ? 'faith' : J.cat === 'war' ? 'command' : 'guild';
    return null;
  };
  CAR.honourable = p => !!(p && p.alive && !p.ruler && !p.prison && A.isAdult(p) && !p.flags.cr_traitor && CAR.atTop(p) && ruOf(p) && (p.fame || 0) >= 25);
  CAR.LEGEND_W = 118;
  CAR.month = function (pc) {
    if (CAR.OFF || !pc || !pc.alive || pc.id !== A.S.pc) return;
    const st = isObj(pc.car) ? pc.car : (pc.car = {});
    if (st.y === A.S.year) return;
    st.y = A.S.year;
    if (CAR.knightable(pc) && ago(pc, 'cr_knight_ask') >= 6 && !queued('cr_knighted') && A.chance(0.35)) {
      pc.flags.cr_knight_ask = A.S.year; A.queue({ type: 'event', ev: 'cr_knighted', ctx: { pid: ruOf(pc).id } }); return;
    }
    if (CAR.fiefable(pc) && ago(pc, 'cr_fief_ask') >= 8 && ago(pc, 'cr_knighted') >= 3 && !queued('cr_fief') && A.chance(0.3)) {
      pc.flags.cr_fief_ask = A.S.year; A.queue({ type: 'event', ev: 'cr_fief', ctx: { pid: ruOf(pc).id } }); return;
    }
    // a fighter past the Legend line (worth 118, 48-fight-ladder's t6) is named one, while the world has room (GD.LEGEND_CAP)
    if (pc.flags.cr_legend == null && A.isAdult(pc) && !pc.prison && A.fightWorth && A.fightWorth(pc) >= CAR.LEGEND_W && !queued('cr_legend') &&
      (!A.ladderCensus || A.ladderCensus().legends.length < (GD.LEGEND_CAP || 5))) {
      pc.flags.cr_legend = A.S.year; A.fame(pc, 15); deed(pc, 'Named among the Legends of Ardan');
      A.log('In the yards and the taverns they have started to say your name with the old ones. You are a Legend now, and every young blade knows it.', 'big');
      A.queue({ type: 'event', ev: 'cr_legend', ctx: {} }); return;
    }
    if (CAR.honourable(pc) && ago(pc, 'cr_honour_ask') >= 7 && !queued('cr_honour') && A.chance(0.3)) {
      pc.flags.cr_honour_ask = A.S.year; A.queue({ type: 'event', ev: 'cr_honour', ctx: { pid: ruOf(pc).id, top: CAR.atTop(pc) } });
    }
  };
  A.onMonth.push(pc => { try { CAR.month(pc); } catch (e) { console.error('careers', e); } });
  // a knight by the crown's hand: the rung (Knight, 300 a year), gentry, and what the orders read as a knighthood
  CAR.knight = function (p) {
    const was = p.noble;
    p.noble = { rung: 2, realm: p.realm, holding: was && was.holding != null ? was.holding : p.home };
    if ((GD.STATUS[p.status] || {}).rank < 5) p.status = 'gentry';
    p.flags.cr_knighted = A.S.year;
    deed(p, 'Knighted for merit by the crown');
    return '';
  };
  CAR.enfeoff = function (p) {
    p.noble = { rung: 4, realm: p.realm, holding: p.home };
    p.flags.cr_fief = A.S.year;
    deed(p, `Given a fief at ${A.provName ? A.provName(p.home) : 'home'}`);
    return '';
  };

  // ---- the council takes a General, and a merchant prince -----------------------------------------------------
  // The release asked rank 8 (High General, one a realm) of a Marshal, so a General never sat on the council.
  const elig = A.seatEligible;
  if (typeof elig === 'function') A.seatEligible = function (pc, seat) {
    const ok = elig.apply(this, arguments);
    if (ok || CAR.OFF || !pc || pc.ruler || !free(pc) || !A.isAdult(pc) || pc.flags.cr_traitor) return ok;
    try {
      if (seat === 'marshal') return !!(pc.mil && !pc.mil.merc && pc.mil.rank >= 7 && (pc.fame || 0) >= 35 && A.skill(pc, 'command') >= 50);
      if (seat === 'treasurer') { const J = pc.job && GD.CAREERS[pc.job.c]; return !!(J && pc.job.c === 'merchant' && pc.job.r >= J.ranks.length - 1 && (pc.coin || 0) >= 50000 && (pc.fame || 0) >= 30); }
    } catch (e) {}
    return ok;
  };

  // ---- numbers that fit the mission, and a quieter log --------------------------------------------------------------
  // a mission's men: the rank's in a war; away from one, what the mission is (a bandit hunt 20 to 300)
  CAR.MISSION_CAP = { bandits: [20, 300] };
  A.missionSize = function (type, rank, war) {
    const base = rank <= 0 ? 10 : GD.MIL[Math.min(rank, 9)].leads;
    const cap = CAR.MISSION_CAP[type];
    if (cap) return Math.max(Math.min(base, cap[1]), Math.min(cap[0], base));
    return war ? base : Math.min(base, 400);
  };
  // one line a month per realm for its levies
  A.levyLog = function (r, d, loc) {
    const key = r.id + ':' + A.S.year + ':' + Math.floor(A.absDay() / 30), L = A.S.carLevy;
    if (L && L.k === key) { L.n++; return; }
    A.S.carLevy = { k: key, n: 1 };
    A.log(`${r.short} calls out its levies; the ${d.name} is the first to gather, at ${A.provName(loc)}.`, 'war');
  };
})();
