// Debts across generations (Road to Ten, Diplomacy 6). 55-bonds' feud ledger already writes one kind of debt,
// "Stood by us against ..." (+16, half-life 50 years), and it already lowers the odds of war on the realm owed. Here
// the AI honours its debts, and two more kinds are written:
//   - "Saved our capital, X, from Y" (+22, half-life 60): a war in which an enemy held our capital ends without our
//     defeat; every realm that fought on our side is owed it;
//   - "Sent grain ships in our famine" (+12, half-life 40): the release's famine-aid incident.
// A crown honours what it owes (CS.owes: the ledger holds a debt of 12 or more, less for an honourable ruler, more for
// one who breaks faith; a ruler who breaks faith outright honours nothing):
//   - it will not attack its benefactor (A.cbWarMul is 0) nor march with an ally against it (A.aiJoinAttack);
//   - when its benefactor is attacked, it joins the defence, even with no treaty, if it is a neighbour of either side,
//     at peace and fit to fight; the debt is then half repaid ("honoured in 1121"), and the benefactor owes it in turn;
//   - when its benefactor is at war and short of gold, it sends up to a quarter of a year's income (booked as gold for
//     allies at war in 56-realm-inside's ledger), once every three years.
// The ledger belongs to the realm, so a debt outlives the ruler who incurred it, and the next ruler honours it by his
// own temper. Nothing here draws from the random stream.
(function () {
  const CS = A.CASUS, BD = A.BONDS, FE = BD && BD.FEUD;
  if (!CS || !FE) return;
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const r2 = x => Math.round(x * 100) / 100;
  const cap = s => { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); };
  const short = id => (A.realm(id) ? A.realmShort(id) : String(id || ''));
  const persona = rid => (A.rulerPersona ? A.rulerPersona(rid) : { honor: 0, parts: {} });
  const on = () => CS.ON && FE.ON !== false;
  const honorWhy = (rid, k, tail) => ((persona(rid).parts || {}).honor || []).map(([t, w]) => [`${cap(t)} ruler${tail ? ': ' + tail : ''}`, r2(w * k), 1]);

  FE.K.relief = { l: 'Saved our capital, {place}, from {foe}', v: 22, h: 60 };
  FE.K.grain = { l: 'Sent grain ships in our famine', v: 12, h: 40 };
  // a line honoured shows it: "Stood by us against Varenna, in 1104 (...), honoured in 1121"
  const origin = FE.origin;
  FE.origin = e => origin(e) + (e && e.paid ? `, honoured in ${e.paid}` : '');

  // what a owes b, if its ruler will honour it (0 otherwise)
  CS.need = rid => clamp(12 - 8 * (persona(rid).honor || 0), 6, 20);
  CS.owes = function (a, b) {
    if (!on()) return 0;
    const v = FE.sum(a, b);
    if (v <= 0 || (persona(a).honor || 0) <= -.3) return 0;
    return v >= CS.need(a) ? v : 0;
  };
  CS.debtLine = (a, b) => FE.top(a, b, 1);
  const repay = (a, b, how) => { for (const e of FE.list(a, b)) if (e.w > 0) { e.w = Math.round(e.w * .5 * 10) / 10; e.paid = A.S.year; e.how = how; } };

  // ---------------------------------------------------------------- writing debts
  const remember = A.remember;
  A.remember = function (a, b, k, v) {
    const res = remember.apply(this, arguments);
    try { if (on() && k === 'aid' && v >= 10 && !A.hostile(a, b)) { if (FE.add(a, b, 'grain')) CS.stats.grain++; } } catch (e) { console.error('casus grain', e); }
    return res;
  };
  // a capital held by the enemy, and a war that ends without our defeat: our comrades saved it
  A.on('warEnd', (w, result) => {
    try {
      if (!w || !on()) return;
      for (const side of ['att', 'def']) {
        const lost = (side === 'att' && result === 'def') || (side === 'def' && result === 'att');
        if (lost) continue;
        const mine = w[side] || [], theirs = w[side === 'att' ? 'def' : 'att'] || [];
        for (const id of mine) {
          const r = A.realm(id);
          if (!r || !r.alive || r.isRebel) continue;
          const held = theirs.map(o => FE.list(id, o).find(e => e.k === 'sack' && e.y >= (w.start || 0))).find(Boolean);
          if (!held) continue;
          const foe = theirs.find(o => FE.list(id, o).some(e => e === held));
          for (const al of mine) if (al !== id && A.realm(al) && A.realm(al).alive) { if (FE.add(id, al, 'relief', { place: held.place, foe: short(foe) })) CS.stats.relief++; }
        }
      }
    } catch (e) { console.error('casus relief', e); }
  });

  // ---------------------------------------------------------------- honouring them
  // the benefactor is attacked: the debtor marches (the release's callToArms event, after allies have answered)
  A.on('callToArms', (w, opts) => {
    try {
      if (!on() || !w || (opts && opts.silent)) return;
      const D = w.leadD, X = w.leadA, rD = A.realm(D);
      if (!rD || !rD.alive || w.cb === 'throne' || w.cb === 'liberty') return;
      const near = new Set([...A.neighbors(D), ...A.neighbors(X)]);
      const cands = [];
      for (const id of Object.keys(A.S.realms)) {
        const y = A.S.realms[id];
        if (!y.alive || y.isRebel || y.playerRun || w.att.includes(id) || w.def.includes(id) || !near.has(id)) continue;
        const pc = A.pc(); if (pc && pc.ruler === id) continue;
        const v = CS.owes(id, D);
        if (!v) continue;
        if (A.atWar(id).length || (y.exhaustion || 0) >= 50 || (y.stability || 50) < 25) continue;
        if ((y.allies || []).includes(X) || A.hasTr(id, X, 'def') || y.overlord === X || A.realm(X).overlord === id || CS.owes(id, X)) continue;
        cands.push([id, v]);
      }
      cands.sort((p, q) => q[1] - p[1]);
      for (const [id, v] of cands.slice(0, 2)) {
        const e = CS.debtLine(id, D), y = A.realm(id);
        w.def.push(id);
        A.remember(D, id, 'saved', 14);
        repay(id, D, 'war');
        CS.stats.debtJoin++;
        A.news(`${y.name} has not forgotten: ${e ? FE.label(e).replace(/^./, c => c.toLowerCase()) : 'an old debt'}${e ? `, in ${e.y}` : ''}. It marches to the aid of ${short(D)} against ${short(X)}.`, 'war');
        A.aiLogAdd && A.aiLogAdd('debt', id, D, `honours an old debt to ${short(D)}: marches against ${short(X)}.`,
          [[e ? `An old debt: ${FE.origin(e)}` : 'An old debt', r2(.6 + v / 30)]].concat(honorWhy(id, 1.2, 'keeps faith'), [[`At peace, and ${short(D)} is attacked`, .3]]));
      }
    } catch (e) { console.error('casus debt war', e); }
  });
  // nor march with an ally against the realm it owes
  if (typeof A.aiJoinAttack === 'function') {
    const ja = A.aiJoinAttack;
    A.aiJoinAttack = function (al, att, def) {
      try { if (CS.owes(al, def)) { CS.stats.debtStay++; return false; } } catch (e) {}
      return ja.apply(this, arguments);
    };
  }
  // gold for the benefactor at war, once every three years
  CS.debtGold = function () {
    if (!on()) return;
    const pc = A.pc();
    for (const id of Object.keys(A.S.realms)) {
      const y = A.S.realms[id];
      if (!y.alive || y.isRebel || y.playerRun || !y.feud || (pc && pc.ruler === id)) continue;
      for (const D of Object.keys(y.feud)) {
        const rD = A.realm(D);
        if (!rD || !rD.alive || !A.atWar(D).length || A.hostile(id, D) || !CS.owes(id, D)) continue;
        if ((rD.treasury || 0) > (rD.income || 1) * .5 || (y.treasury || 0) < (y.income || 1) * 1.3) continue;
        const e = CS.debtLine(id, D);
        if (!e || (e.gold && A.S.year - e.gold < 3)) continue;
        const g = Math.round(Math.min(y.treasury - y.income, y.income * .25));
        if (!(g > 0)) continue;
        y.treasury -= g; rD.treasury += g; e.gold = A.S.year;
        if (A.RI && A.RI.book) A.RI.book(y, 'subsidy', g);
        CS.stats.debtGold++;
        A.news(`${y.short} sends ${A.fmt(g)} suns to ${short(D)} for its war: ${FE.label(e).replace(/^./, c => c.toLowerCase())}, in ${e.y}.`, 'crown');
        A.aiLogAdd && A.aiLogAdd('debtgold', id, D, `sends ${A.fmt(g)} in gold to ${short(D)} for its war, for an old debt.`,
          [[`An old debt: ${FE.origin(e)}`, .8]].concat(honorWhy(id, .8, 'keeps faith'), [[`${short(D)} is at war, its treasury nearly empty`, .4]]));
      }
    }
  };
  A.on('worldYear', () => { try { CS.debtGold(); } catch (e) { console.error('casus debt gold', e); } });
})();
