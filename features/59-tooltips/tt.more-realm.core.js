// Nested tooltips: the Realm tab for one who does not rule it, and the Chronicle and the Codex. The ruler's opinion
// of you; each faction's power (its houses' swords against the realm's) and discontent; the great lords' loyalty;
// 56-realm-inside's court (the odds of what is before it, reason by reason) and the crown's purse; the ladder of
// rungs; 47-realm-bible's customs as you have met them; 55-bonds' long memories between realms. The Codex's ladder
// of fighters, one against many, 32-ladder's census of Legends and Masters; the Dynasty page.
(function () {
  const G = UI.TIPS = UI.TIPS || {}, TT = UI.TT, K = TT.K;
  const { esc, r0, r1, r2, sg, pct, H, R, D, F, L, coin } = K;
  const pc = () => A.pc();
  const fmt = v => esc(A.fmt(Math.round(v)));
  const myRealm = () => { const p = pc(); return p ? A.realm(p.noble ? p.noble.realm : p.realm) : null; };
  const fac = id => (A.S.factions || []).find(f => f.id === id) || null;

  // ---- factions ----------------------------------------------------------------------------------------------------
  TT.facParts = function (f) {
    const r = A.realm(f.realm), all = A.realmHouses(f.realm).reduce((a, h) => a + A.houseStrength(h), 0) + (r.army * 0.25 + r.levy * 0.05);
    const mem = f.members.map(id => A.S.houses[id]).filter(Boolean).map(h => [L('house', h.id, esc(h.name)), A.houseStrength(h)]);
    if (f.pc && pc() && pc().noble) mem.push(['You', 200]);
    // 56-realm-inside: the council voices that lean its way (4% each), and a leader who truly wants it (5%), at most 15%
    let back = 0, nb = 0, lead = 0;
    const RI = A.RI, lh = A.S.houses[f.leader], head = lh && lh.headPid ? A.P(lh.headPid) : null;
    if (RI && RI.backers) { nb = RI.backers(f).length; back = 0.04 * nb; if (head && head.alive && RI.facFor && RI.facFor(r, { p: head, h: lh }) === f.kind) { lead = 0.05; back += 0.05; } back = Math.min(0.15, back); }
    return { mem, all, back, nb, lead, now: mem.reduce((a, x) => a + x[1], 0) / Math.max(1, all) + back, total: (f.power != null ? f.power : A.factionPower(f)) };
  };
  G.facPower = function (id) {
    const f = fac(id); if (!f) return '';
    const S = TT.facParts(f), F0 = A.FACTIONS[f.kind] || {}, sw = S.mem.reduce((a, x) => a + x[1], 0);
    const stale = f.power != null && Math.round(f.power * 100) !== Math.round(S.now * 100);
    const pts = [[`Its swords: ${fmt(sw)} of the realm's ${fmt(S.all)}`, sw / Math.max(1, S.all) * 100]];
    if (S.back) pts.push([`On the council, ${S.nb} lean${S.nb === 1 ? 's' : ''} its way${S.lead ? ', and its leader wants what it wants' : ''} (56-realm-inside, at most 15%)`, S.back * 100]);
    return H('Power', pct(S.total), esc(F0.name || '')) + D('Its houses\' swords, against all the realm\'s: every house, a quarter of the army and a twentieth of the levy.') +
      `<div class="tip-row tt-sum"><span>Its swords</span><b></b></div>` + TT.sumRows(S.mem, sw, 'Swords', v => esc(A.fmt(v))) +
      `<div class="tip-row tt-sum"><span>${stale ? 'Today' : 'Its power'}</span><b></b></div>` + K.pts(pts, Math.round(S.now * 100), 'Power') +
      (stale ? D(`The card shows ${pct(f.power)}, reckoned at the new year; the realm's swords have moved since.`) : '') +
      F('At 40% and 60 discontent it makes its demand.');
  };
  G.facDisc = function (id) {
    const f = fac(id), r = f && A.realm(f.realm); if (!f) return '';
    const p = f.power != null ? f.power : A.factionPower(f), war = f.kind === 'war' && A.atWar(r.id).length;
    return H('Discontent', r0(f.discontent || 0), 'of 100') +
      (war ? D('A war party has its war: discontent stays at 0.') : `<div class="tip-row tt-sum"><span>Next new year</span><b>${sg((p > 0.3 ? 12 : 4) - (r.stability > 70 ? 6 : 0))}</b></div>` +
        R(p > 0.3 ? 'Power over 30%' : 'Power under 30%', p > 0.3 ? '+12' : '+4', 'tt-sub') + (r.stability > 70 ? R(L('realmStab', r.id, 'Stability') + ' over 70', '−6', 'tt-sub') : '')) +
      F('At 60, with 40% of the power, it makes its demand; a bribe or a concession sets it back to 0.');
  };
  G.loyalty = function (hid) {
    const h = A.S.houses && A.S.houses[hid], r = myRealm(); if (!h) return '';
    const auth = r && r.laws && r.laws.authority != null ? r.laws.authority : 1, drift = r ? A.AUTH[auth][2] / 4 + (r.laws && r.laws.levy != null && A.LEVY[r.laws.levy] ? A.LEVY[r.laws.levy][2] : 0) : 0;
    const parts = [['The crown\'s authority and levy law', drift]]; if (r) parts.push([L('realmStab', r.id, 'Stability') + ` ${r0(r.stability)} against 50, ÷ 60`, (r.stability - 50) / 60]);
    return H('Loyalty', r0(h.op != null ? h.op : 50), esc(h.name)) + D('What the house thinks of the crown. Under 42 it may join a faction; under 22 a great house may seek to leave the realm.') +
      `<div class="tip-row tt-sum"><span>Next new year, before luck (±2)</span><b>${sg(r1(parts.reduce((a, x) => a + x[1], 0)))}</b></div>` + parts.map(x => R(x[0], sg(r1(x[1])), 'tt-sub')).join('');
  };

  G.loyaltyAll = function (rid) {
    const r = A.realm(rid); if (!r) return '';
    const hs = A.realmHouses(r.id), m = hs.length ? hs.reduce((a, h) => a + (h.op != null ? h.op : 50), 0) / hs.length : 50;
    return H('The lords\' loyalty', r0(m), esc(r.short)) + R('Houses', hs.length) + hs.slice().sort((a, b) => (a.op != null ? a.op : 50) - (b.op != null ? b.op : 50)).slice(0, 5).map(h => R(L('loyalty', h.id, esc(h.name)), r0(h.op != null ? h.op : 50), 'tt-sub')).join('') +
      D('The mean of every great house\'s loyalty to the crown. Sullen lords make the court spend on feasts and pensions.');
  };

  // ---- the court (56-realm-inside) -----------------------------------------------------------------------------------------
  TT.courtParts = function (r) {
    const RI = A.RI, ag = r && r.riAgenda; if (!RI || !ag || !RI.PUSH[ag.k]) return null;
    const T = RI.tally(r, ag.pc ? { k: ag.k, side: ag.pc.side, w: ag.pc.w } : null)[ag.k], o = RI.odds(r, T);
    const bal = 0.55 * (T.sup - T.opp) / (T.sup + T.opp + 0.5);
    const parts = [['Any push', 20], [`The voices: ${r1(T.sup)} for, ${r1(T.opp)} against`, bal * 100]];
    for (const x of o.why.slice((T.pro[0] ? 1 : 0) + (T.con[0] ? 1 : 0))) parts.push([esc(x[0]), x[1] * 100]);
    const raw = parts.reduce((a, x) => a + x[1], 0), cl = A.clamp(raw / 100, 0.03, 0.9) * 100;
    if (Math.abs(cl - raw) > 0.01) parts.push(['Never under 3% or over 90%', cl - raw]);
    return { parts, total: Math.round(o.p * 100), T, o, ag };
  };
  G.courtOdds = function () {
    const r = myRealm(), S = r && TT.courtParts(r); if (!S) return '';
    const RI = A.RI;
    return H('If it came to the crown today', S.total + '%', esc(RI.PUSH[S.ag.k].t)) + K.pts(S.parts, S.total, 'It passes') +
      (S.T.pro.length ? R('Loudest for', esc(A.fullName(S.T.pro[0][0].p, false)), 'tt-sub') : '') + (S.T.con.length ? R('Loudest against', esc(A.fullName(S.T.con[0][0].p, false)), 'tt-sub') : '') +
      F('Each voice weighs by its seat or its house; speaking for or against it adds yours.');
  };
  // the crown's purse: last year's lines and what they come to
  TT.crownParts = function (r) {
    const B = r && r.riBook; if (!B || B.pr) return null;
    const rows = [['Taxes and dues collected', B.inc], ["The host's upkeep", -B.up]];
    if (B.int) rows.push(['Interest to the banks', -B.int]);
    if (B.d0 > B.d1) rows.push(['Debts repaid', -(B.d0 - B.d1)]);
    for (const k of A.RI.CATS) if (B.cats[k]) rows.push([esc(A.RI.CAT_T[k]), -B.cats[k]]);
    if (B.other) rows.push(['Tribute, war and the forges', B.other]);
    return { rows, total: rows.reduce((a, x) => a + Math.round(x[1]), 0), B };
  };
  G.crownBook = function (rid) {
    const r = A.realm(rid) || myRealm(), S = r && TT.crownParts(r); if (!S) return '';
    const yrs = Math.round(10 * (S.B.t1 || 0) / Math.max(1, r.income)) / 10;
    return H('The crown\'s purse', esc(S.B.y), esc(r.short)) + TT.sumRows(S.rows, S.total, 'The year, all told', v => esc(A.fmt(v))) +
      R(L('realmGold', r.id, 'In the treasury'), fmt(S.B.t1 || 0), 'tt-sub') + R('Years of income in hand', `${yrs} (${fmt(S.B.t1 || 0)} ÷ ${fmt(r.income)})`, 'tt-sub') +
      F(`A crown of this temper keeps about ${esc(A.RI.reserveYears ? A.RI.reserveYears(r) : 1.5)} years in hand and spends the rest.`);
  };
  G.rung = function (i) {
    const x = GD.NOBLE_RUNGS[+i], p = pc(); if (!x) return '';
    const mine = p && p.noble && p.noble.rung === +i;
    return H(esc(x.title), null, mine ? 'your rung' : 'a rung') + R('Rents a year', fmt(x.income) + ' suns') + R('Levy owed the crown', fmt(x.levy) + ' men') +
      D('What a holder of this rung draws from their lands, and the men they bring when the crown calls.') + F('A petition at court, a war or a marriage can raise you.');
  };
  G.rungs = function () {
    const p = pc(), NR = GD.NOBLE_RUNGS || [];
    return H('The ladder of rungs', null, 'the world\'s Part 12') + NR.slice().reverse().map((x, i) => R(p && p.noble && p.noble.rung === NR.length - 1 - i ? `<span class="tt-on-row">${esc(x.title)}</span>` : esc(x.title), `${fmt(x.income)} · levy ${fmt(x.levy)}`, 'tt-sub')).join('') +
      F('Each rung\'s rents a year and the men it owes the crown. Part 12 of the world\'s lore sets the ladder.');
  };
  G.custom = function (id) {
    const p = pc(), h = p && p.rb && p.rb[id];
    return H('A custom', null, h ? 'met' : 'not met yet') + (h ? R('Times you met it', h.n) + R('First in', h.first + ' AR') : D('It has not touched your life yet.')) +
      D('Customs are the realm\'s own law of daily life (47-realm-bible). Each counts when it touches you: a tax, a rite, a rule at a death.');
  };
  G.feud = function (arg) {
    const [a, b, i] = String(arg).split('|'), r = A.realm(a), e = r && r.feud && Array.isArray(r.feud[b]) ? r.feud[b][+i] : null; if (!e) return '';
    const yrs = A.S.year - e.y, half = e.h || 50;
    return H('A long memory', sg(r0(e.w)), `${esc(A.realmShort(a))} of ${esc(A.realmShort(b))}`) +
      R('At first', sg(e.v)) + R(`Halves every ${half} years: ${yrs} years on`, `×${r2(Math.pow(0.5, yrs / half))}`, 'tt-sub') + R('Weighs now', sg(r0(e.w)), 'tt-sum') +
      D('It is part of how one realm regards the other: alliances, offers, a call to arms, the odds of war. The ledger belongs to the realm, so it outlives the ruler who suffered it.');
  };
  G.rulerOp = function (pid) {
    const ru = A.P(pid), p = pc(); if (!ru || !p) return '';
    const op = Math.round(A.opinion(ru, p));
    return H('Their opinion of you', sg(op), esc(A.fullName(ru, false))) + D('From −100 to 100. Service, gifts and renown raise it; scandal and a faction against the crown lower it.') +
      R(L('age', ru.id, 'Their age'), A.age(ru), 'tt-sub') + F(`Above 50 the crown may invite you to its orders; above 30 your council word counts for more.`);
  };

  // ---- the Codex: the ladder of fighters, one against many, the census (32-ladder) ----------------------------------------
  G.crowd = function (n) {
    const band = { Trained: [50, 60], Veteran: [63, 74], Elite: [77, 88], Master: [91, 115], Legend: [118, 140] }[n]; if (!band) return '';
    const a = A.strengthOf(band[0]), b = A.strengthOf(band[1]), v = A.vetS(), staFor = R2 => Math.max(0, Math.round(Math.log(R2 / 0.672) / 0.054 / 5) * 5);
    return H(esc(n), null, `worth ${band[0]}–${band[1]}`) + R('Strength at the low end', r2(a)) + R('At the high end', r2(b)) + R('A veteran\'s', r2(v), 'tt-sub') +
      R('Regulars at once', `${r1(a)}–${r1(b)}`, 'tt-sum') + (b / v >= 1 ? R('Veterans at once', `${r1(a / v)}–${r1(b / v)}`, 'tt-sub') : '') + (b > 3 ? R(`${L('stat', 'sta', 'Stamina')} to keep it up`, staFor(b) + '+', 'tt-sub') : '') +
      D('Strength rises steeply with worth: a fighter can face about as many regulars as their strength, if their wind holds.') + (pc() ? F(`See ${L('takeLine', '', 'yours')}.`) : '');
  };
  G.takeLine = function () {
    const p = pc(); if (!p) return '';
    const c = A.canTake(p);
    return H('One against many', A.crowdN(c.reg), 'regulars at once') + R(L('worth', p.id, 'Fighting worth'), c.w) + R('Strength from it', r2(c.S)) + R(`What your ${L('stat', 'sta', 'wind')} holds up`, r2(c.C)) +
      R('Regulars at once', r1(c.reg), 'tt-sum') + (c.vet >= 1.5 ? R('Veterans', r1(c.vet), 'tt-sub') : '') + (c.limited ? D(`Your skill is worth ${esc(A.crowdN(c.skillReg))}, but your wind gives out first.`) : '') +
      F('Melee, in the open, no arrows. "Can take 8" means 8 at once is a coin toss.');
  };
  G.census = function (k) {
    const p = pc(), C = A.ladderCensus ? A.ladderCensus() : null; if (!C) return '';
    if (k === 'legends') return H('Legends alive', `${C.legends.length} of ${GD.LEGEND_CAP || 5}`) + D('No more than this live at once in all of Ardan; a new one rises only when one falls. Worth 118 and up.') +
      R(L('tier', 'legend', 'The tier'), '118+', 'tt-sub');
    const mine = (C.masters[p.realm] || []);
    return H('Masters in ' + esc(A.realmShort(p.realm)), `${mine.length} of ${GD.MASTER_CAP}`) + D('No realm raises more than this: a master needs a master to teach.') +
      Object.entries(C.masters).sort((a, b) => b[1].length - a[1].length).slice(0, 6).map(([rid, l]) => R(esc(A.realmShort(rid)), l.length, rid === p.realm ? 'tt-on-row' : 'tt-sub')).join('');
  };

  // ---- the Dynasty page ---------------------------------------------------------------------------------------------------
  G.dynasty = function () {
    const S = A.S, p = pc(); if (!p) return '';
    return H(esc(S.dynasty ? S.dynasty.name : p.sur || p.given), null, 'house and blood') + R('Generation', S.gen || 1) + R('Lives in the chronicle', (S.dyn || []).length + 1) +
      R(L('score', '', 'Score of this life'), fmt(A.score(p))) + ((S.dyn || []).length ? R('Lives before', (S.dyn || []).map(x => esc(x.name || x.title)).slice(-3).join(', '), 'tt-sub') : '');
  };
  G.endings = function () {
    const S = A.S, got = S.endings || {}, gotM = S.manners || {}; if (!A.ENDINGS) return '';
    return H('Endings', `${A.ENDINGS.filter(e => got[e.id] != null).length} of ${A.ENDINGS.length}`) + R('Ways to go found', `${Object.keys(gotM).length} of ${(A.MANNERS || []).length}`) +
      D('Each ending is a way a life can close: found once, it stays found for every life after.');
  };
  G.achs = function () {
    const S = A.S, n = Object.keys(S.ach || {}).length, all = Object.keys(GD.ACH).length;
    return H('Achievements', `${n} of ${all}`) + Object.entries(S.ach || {}).slice(-6).map(([k, y]) => R(esc((GD.ACH[k] || [k])[0]), y + ' AR', 'tt-sub')).join('') + D('Kept across lives.');
  };
  G.ach = function (k) {
    const A0 = GD.ACH[k], p = pc(); if (!A0) return '';
    const y = (A.S.ach || {})[k];
    return H(esc(A0[0]), null, y ? 'won in ' + y + ' AR' : 'not yet') + D(esc(A0[1])) +
      (!y && /suns/.test(A0[1]) ? R(L('coin', '', 'Coin now'), esc(A.coin(p.coin))) : !y && /renown/.test(A0[1]) ? R(L('fame', '', 'Renown now'), r0(p.fame)) : !y && /years/.test(A0[1]) ? R(L('age', p.id, 'Your age'), A.age(p)) : '');
  };
})();
