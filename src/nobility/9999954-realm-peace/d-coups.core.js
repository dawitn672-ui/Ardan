// W1-6 part d: coups (docs/design/war.md §13.5; D-100). The release had none but event scenes. A coup happens at the
// centre, in a night, without armies, and needs three things, each with a name:
//   an opening   the king losing a war, ill, a child or very old; the realm shaking; a war lost lately. With none, no
//                one in the realm so much as thinks of it (no decision is asked: nothing happens without reason).
//   access       only those who can reach the king's person: his heir, his spouse, his grown brothers and sisters, his
//                councillors, the senior General. Never the player (his own plots are his to make).
//   a motive     ambition; a grievance (his house's loyalty, his own opinion of the king); a better claim by blood; fear
//                (his house in a league against the crown); saving the realm from a king who is losing his war.
// It runs in stages, each a decision through A.WHY:
//   1 the plot      one with access weighs plotting against waiting (kind 'coup'); the first who chooses it leads.
//   2 approaches    the others with access are approached one at a time: join, refuse, or tell the king (kind
//                   'approach'). One who tells ends it. A player with access is approached on a card (pe_coup).
//   3 the watch     the spymaster, if not in it, acts on what he hears or lets it pass (kind 'watch'): his skill, the
//                   plot's size (loose talk), his loyalty.
//   4 the night     a month after: settled by who holds what (the host at the capital, the king's guard, the gates and
//                   the watch, the treasury, the seals, the heir, the king's person), counted, without dice: success, a
//                   contested crown (a war of succession with the plotter as claimant), or failure.
//   5 after         success: the plotter is crowned and the old ruler dies in the night (a ruling player is deposed,
//                   not killed: the Polity's po_deposed scene follows); the lords' loyalty follows their stance toward
//                   a usurper; a coup made to end a losing war asks for terms (W1-5's A.WAR, a reason in his pan).
//                   Found or failed: the king judges the plotters (kind 'plotjudge': the block, or mercy).
// State: A.S.plots (at most 6 live plots, each about 120 bytes), r.coupPeace (the year a coup took the crown to end a war).
(function () {
  const PE = A.PEACE, W = () => A.WHY;
  if (!PE) return;
  const { clamp, live, short } = PE;
  const r2 = x => Math.round(x * 100) / 100;
  const rs = (kind, weight, label, source, pub) => ({ kind, weight: r2(weight), label, source, pub: pub ? 1 : 0 });
  Object.assign(PE.T, { coupBand: 1, plotCap: 6, nightDays: 30 });
  W().T.kindCap = Object.assign({ coup: 20, approach: 20, watch: 10, plotjudge: 10 }, W().T.kindCap || {});
  const heOf = p => (p && p.sex === 'F' ? 'she' : 'he');
  const kingOf = (r, p) => (p && p.sex === 'F' ? 'queen' : 'king');

  // ---------------------------------------------------------------- the opening
  PE.openings = function (r) {
    const out = [], ru = r && r.ruler != null ? A.P(r.ruler) : null;
    if (!r || !live(ru)) return out;
    const R = GD.RACES ? GD.RACES[ru.race] : null, K = kingOf(r, ru);
    if (A.WAR && A.WAR.standing) for (const w of A.atWar(r.id)) if ((w.leadA === r.id || w.leadD === r.id) && A.WAR.standing(w, r.id) === 'losing') { out.push({ k: 'war', label: `The ${K} is losing his war with ${short(w.leadA === r.id ? w.leadD : w.leadA)}`, at: w.id }); break; }
    if ((ru.health != null ? ru.health : 100) < 35) out.push({ k: 'ill', label: `The ${K} lies ill` });
    if (R && A.age(ru) < R.adult) out.push({ k: 'child', label: `A child on the throne` });
    if (R && A.age(ru) >= R.old * 1.15) out.push({ k: 'old', label: `The ${K} is very old` });
    if ((r.stability != null ? r.stability : 50) < 30) out.push({ k: 'shaking', label: 'The realm is shaking' });
    const lost = ((r.pol && r.pol.lost) || []).filter(y => A.S.year - y < 2).length;
    if (lost) out.push({ k: 'lost', label: 'A war lost, a host gone' });
    return out;
  };

  // ---------------------------------------------------------------- access: who can reach the king's person
  PE.access = function (r) {
    const out = [], ru = r.ruler != null ? A.P(r.ruler) : null, seen = new Set();
    if (!live(ru)) return out;
    const add = (p, role) => { if (!live(p) || p.id === ru.id || p.id === A.S.pc || seen.has(p.id) || p.ruler || !A.isAdult(p)) return; seen.add(p.id); out.push({ p, role }); };
    add(r.heir != null ? A.P(r.heir) : null, 'heir');
    add(ru.spouse ? A.P(ru.spouse) : null, 'spouse');
    for (const x of A.relsOf(ru, ['sibling'])) add(x.p, 'sibling');
    for (const k of Object.keys(r.council || {})) add(A.P(r.council[k]), k === 'general' ? 'general' : k);
    return out;
  };
  // the player's own access (he is approached, never decided for)
  PE.pcAccess = function (r) {
    const pc = A.pc && A.pc(), ru = r && r.ruler != null ? A.P(r.ruler) : null;
    if (!pc || !pc.alive || !live(ru) || pc.ruler || pc.realm !== r.id || !A.isAdult(pc)) return null;
    if (r.heir === pc.id) return 'heir';
    if (ru.spouse === pc.id) return 'spouse';
    if (ru.rel && ru.rel[pc.id] && ru.rel[pc.id].type === 'sibling') return 'sibling';
    for (const k of Object.keys(r.council || {})) if (r.council[k] === pc.id) return k === 'general' ? 'general' : k;
    return null;
  };
  const ROLE = { heir: 'the heir', spouse: 'the consort', sibling: 'the king\'s own blood', general: 'the senior General', chancellor: 'the Chancellor', treasurer: 'the Treasurer', spymaster: 'the Spymaster', chaplain: 'the Chaplain' };
  PE.ROLE = ROLE;

  // ---------------------------------------------------------------- 1. the plot
  const houseOp = p => { const h = p && p.house ? A.S.houses[p.house] : null; return h ? (h.op != null ? h.op : 50) : 50; };
  PE.motives = function (r, c, opens) {
    const p = c.p, ru = A.P(r.ruler), T = W().temper(p), op = A.opinion(p, ru), hop = houseOp(p), out = [];
    if ((T.ambition || 0) >= .3) out.push(rs('ambition', 2 * (T.ambition - .2), c.role === 'heir' ? 'He would not wait for the crown' : 'The crown within his reach', { t: 'ambition', id: p.id }, 0));
    if (op < -15) out.push(rs('grudge', -op / 30, `His hatred of the ${kingOf(r, ru)}`, { t: 'opinion', id: p.id, r: Math.round(op) }, 0));
    if (hop < 35 && p.house && A.S.houses[p.house] && A.S.houses[p.house].kind !== 'royal') out.push(rs('grudge', (35 - hop) / 12, 'His house\'s grievance with the crown', { t: 'house', id: p.house, r: Math.round(hop) }, 0));
    if (c.role === 'heir' || c.role === 'sibling') out.push(rs('claim', .5, 'His own blood is royal', { t: 'blood', id: p.id }, 1));
    const f = p.house && A.S.houses[p.house] ? PE.factionOf(A.S.houses[p.house]) : null;
    if (f && f.kind !== 'war' && f.kind !== 'peace') out.push(rs('fear', 1, `His house is in the ${(A.FACTIONS[f.kind] || {}).name || 'league'}: strike before he is struck`, { t: 'faction', id: f.id }, 0));
    const war = opens.find(o => o.k === 'war');
    if (war && (c.role === 'general' || c.role === 'chancellor' || c.role === 'heir')) out.push(rs('duty', .9, 'To save the realm from a ruler losing his war', { t: 'war', id: war.at }, 1));
    return out;
  };
  PE.plotOptions = function (r, c, opens) {
    const p = c.p, ru = A.P(r.ruler), mot = PE.motives(r, c, opens);
    const open = opens.map(o => rs('reckoning', .5, o.label, { t: 'opening', id: o.k }, 1));
    const kin = c.role === 'heir' || c.role === 'sibling' || c.role === 'spouse';
    return [
      { id: 'plot', at: ru.id, feeds: ['anger', 'pride', 'grudge', 'greed'], reasons: mot.concat(open) },
      { id: 'wait', at: ru.id, feeds: ['fear', 'love'], reasons: [
        rs('loyalty', 2.8, `His oath to the ${kingOf(r, ru)}`, { t: 'oath', id: p.id }, 1),
        rs('fear', 1.6, 'The block waits for a failed plot', { t: 'risk' }, 0),
        kin ? rs('kin', 1, `The ${kingOf(r, ru)} is his blood`, { t: 'kin', id: ru.id }, 1) : null,
      ].filter(Boolean) },
    ];
  };
  const plots = () => { const S = A.S; if (!Array.isArray(S.plots)) S.plots = []; return S.plots; };
  PE.plots = () => (A.S && Array.isArray(A.S.plots) ? A.S.plots : []);
  PE.inPlot = h => !!(h && PE.plots().some(x => x.m.some(id => { const p = A.P(id); return p && p.house === h.id; })));
  // the realm's yearly question (from its month): only with an opening, and only those with access with a motive
  PE.coupYear = function (r) {
    if (!r || !r.alive || r.isRebel || r.ruler == null || PE.plots().some(x => x.r === r.id)) return null;
    const opens = PE.openings(r);
    if (!opens.length) return null;
    for (const c of PE.access(r)) {
      if (!PE.motives(r, c, opens).length) continue;
      const rec = W().decide(c.p, 'coup', PE.plotOptions(r, c, opens), { band: PE.T.coupBand, r: r.id, at: r.ruler, logIf: x => x.chose === 'plot' });
      if (!rec || rec.chose !== 'plot') continue;
      if (plots().length >= PE.T.plotCap) return null;
      const P = { id: 'K' + (A.S.nextPlot = (A.S.nextPlot || 0) + 1), r: r.id, by: c.p.id, role: c.role, k: r.ruler, m: [c.p.id], ask: PE.access(r).filter(x => x.p.id !== c.p.id).map(x => x.p.id).slice(0, 6), d: A.absDay(), war: opens.some(o => o.k === 'war') ? 1 : 0 };
      plots().push(P);
      PE.note(r, { k: 'coup', chose: 'plot', p: c.p.id, role: c.role, open: opens.map(o => o.k).join(',') }, rec);
      // the player with access is approached too
      const pr = PE.pcAccess(r);
      if (pr && !P.ask.includes(A.S.pc)) P.ask.push(A.S.pc);
      return P;
    }
    return null;
  };

  // ---------------------------------------------------------------- 2. the approaches
  PE.approachOptions = function (r, P, q, role) {
    const ru = A.P(r.ruler), lead = A.P(P.by), opens = PE.openings(r), mot = PE.motives(r, { p: q, role }, opens);
    const T = W().temper(q), op = A.opinion(q, ru), hop = houseOp(q);
    const tie = lead && q.house && lead.house && q.house === lead.house;
    return [
      { id: 'join', at: ru.id, feeds: ['anger', 'grudge', 'greed'], reasons: mot.concat(opens.map(o => rs('reckoning', .5, o.label, { t: 'opening', id: o.k }, 1)), tie ? [rs('kin', .8, `${A.fullName(lead, false)} is of his house`, { t: 'kin', id: lead.id }, 1)] : []) },
      { id: 'refuse', at: ru.id, feeds: ['fear'], reasons: [rs('fear', 1.4, 'He wants no part of it', { t: 'risk' }, 0)] },
      { id: 'tell', at: lead ? lead.id : null, feeds: ['love'], reasons: [
        rs('loyalty', .4 + (op + (hop - 50)) / 40 + .6 * (T.honor || 0), op >= 0 ? `His loyalty to the ${kingOf(r, ru)}` : `His oath, if not his love`, { t: 'loyalty', id: q.id, r: Math.round(op) }, 1),
        rs('want', .3, 'A reward for the loyal', { t: 'reward' }, 0),
      ] },
    ];
  };
  // the plot's month: approach the next man; the watch; the night when it is due
  PE.plotMonth = function (P) {
    const S = A.S, r = A.realm(P.r), lead = A.P(P.by);
    const end = () => { S.plots = plots().filter(x => x !== P); };
    if (!r || !r.alive || r.ruler !== P.k || !live(lead) || !live(A.P(P.k))) return end();
    if (P.wait) return;   // the player's answer is awaited (pe_coup)
    // approach the next man, one at a time
    while (P.ask.length) {
      const id = P.ask.shift(), q = A.P(id);
      if (!live(q) || P.m.includes(id)) continue;
      const role = PE.access(r).concat(PE.pcAccess(r) ? [{ p: A.pc(), role: PE.pcAccess(r) }] : []).find(x => x.p.id === id);
      if (!role) continue;
      if (id === S.pc) { P.wait = 1; A.queue({ type: 'event', ev: 'pe_coup', ctx: { pid: lead.id, kid: P.k, pk: P.id, roleT: ROLE[P.role] || 'one of the court', openT: (PE.openings(r)[0] || {}).label || 'The times are bad', npcMove: true } }); return; }
      const rec = W().decide(q, 'approach', PE.approachOptions(r, P, q, role.role), { band: 1, r: r.id, at: P.k, logIf: x => x.chose !== 'refuse' });
      if (!rec) continue;
      if (rec.chose === 'join') P.m.push(id);
      if (rec.chose === 'tell') { PE.note(r, { k: 'approach', chose: 'tell', p: id, plot: P.id }, rec); return PE.found(P, `${A.fullName(q, false)} tells the ${kingOf(r, A.P(P.k))}`); }
      break;   // one approach a month
    }
    // the watch: the spymaster, if he is not in it
    const spyId = r.council && r.council.spymaster, spy = spyId ? A.P(spyId) : null;
    if (live(spy) && !P.m.includes(spy.id) && spy.id !== S.pc && !P.watched) {
      P.watched = 1;
      const sk = A.skill ? A.skill(spy, A.COUNCIL.spymaster.skill) : 30;
      const rec = W().decide(spy, 'watch', [
        { id: 'expose', at: P.by, reasons: [rs('merit', (sk - 40) / 15, sk >= 50 ? 'He hears everything at court' : 'He hears little', { t: 'skill', id: spy.id, r: Math.round(sk) }, 0), rs('reckoning', .5 * (P.m.length - 1), `${P.m.length} men in a secret: loose talk`, { t: 'size', r: P.m.length }, 0), rs('loyalty', .4, 'His duty to the crown', { t: 'duty' }, 1)] },
        { id: 'miss', at: P.by, reasons: [rs('reckoning', 1.4, 'Rumours of plots at every court', { t: 'rumour' }, 0)] },
      ], { band: 1, r: r.id, at: P.k, logIf: x => x.chose === 'expose' });
      if (rec && rec.chose === 'expose') { PE.note(r, { k: 'watch', chose: 'expose', p: spy.id, plot: P.id }, rec); return PE.found(P, `The spymaster ${A.fullName(spy, false)} uncovers it`); }
    }
    if (A.absDay() - P.d >= PE.T.nightDays) PE.night(P);
  };
  // the player's answer to the approach (pe_coup's effect)
  PE.pcAnswer = function (pid, ans) {
    const P = PE.plots().find(x => x.id === pid);
    if (!P) return;
    P.wait = 0;
    const r = A.realm(P.r), pc = A.pc();
    if (ans === 'join') { P.m.push(pc.id); return; }
    if (ans === 'tell') { PE.note(r, { k: 'approach', chose: 'tell', p: pc.id, plot: P.id, n: 2, why: 'Told by the player' }); PE.found(P, 'You tell the crown'); }
  };

  // ---------------------------------------------------------------- 4. the night: who holds what
  const HOLDS = { general: ['the host at the capital', 3], spymaster: ['the gates and the watch', 1], treasurer: ['the treasury', 1], chancellor: ['the seals', 1], chaplain: ['the faith\'s word', 1], heir: ['the heir', 2], spouse: ['the king\'s person', 2], sibling: ['the royal blood', 1] };
  PE.holds = function (r, P) {
    const roleOf = id => { const x = PE.access(r).find(c => c.p.id === id); if (x) return x.role; return id === A.S.pc ? PE.pcAccess(r) : null; };
    let plot = 0, loyal = 2;   // the king's own guard stands with him unless the General holds the capital for the plot
    const held = [];
    for (const id of P.m) { const role = roleOf(id), h = HOLDS[role]; if (h) { plot += h[1]; held.push(h[0]); } }
    if (P.m.some(id => roleOf(id) === 'general')) { loyal = 0; held.push('the king\'s guard'); plot += 1; }
    for (const c of PE.access(r)) if (!P.m.includes(c.p.id) && HOLDS[c.role]) loyal += HOLDS[c.role][1];
    return { plot, loyal, held };
  };
  PE.night = function (P) {
    const S = A.S, r = A.realm(P.r), ru = A.P(P.k), lead = A.P(P.by);
    S.plots = plots().filter(x => x !== P);
    if (!r || !live(ru) || !live(lead)) return;
    const H = PE.holds(r, P), why = `They held ${H.held.join(', ') || 'nothing'}.`;
    const K = kingOf(r, ru);
    if (H.plot > H.loyal + 1) {
      // success: the plotter crowned, the old ruler dead in the night (a ruling player deposed)
      PE.note(r, { k: 'night', chose: 'crowned', p: lead.id, n: 2, why, plot: P.id });
      const wasPc = ru.id === S.pc;
      if (wasPc) { ru.ruler = null; A.log(`In the night ${A.fullName(lead, false)} and ${P.m.length - 1} others seize your palace. You are no longer ruler of ${r.short}. ${why}`, 'bad'); }
      else A.kill(ru, 'killed in the night of a coup', true);
      r.ruler = null;
      A.makeRuler(lead, r.id);
      r.legit = Math.min(r.legit || 0, 30);
      if (r.pol) { r.pol.came = 'claimant'; r.pol.cameSet = S.year; }
      r.stability = Math.max(0, (r.stability || 0) - 10);
      for (const h of A.realmHouses(r.id)) {
        const st = PE.stance(h), mine = P.m.some(id => { const p = A.P(id); return p && p.house === h.id; });
        h.op = clamp((h.op || 50) + (mine ? 10 : st.k === 'loyal' ? -12 : st.k === 'content' ? -6 : st.k === 'plotting' ? 6 : 0), 0, 100);
      }
      if (P.war) r.coupPeace = S.year;
      PE.tell(r, `A coup in ${short(r.id)}: ${A.fullName(lead, false)} takes the crown in a night${wasPc ? '' : ', and the old ' + K + ' is dead'}.`, 'world', why);
      return 'crowned';
    }
    if (H.plot >= H.loyal - 1) {
      // contested: the loyal rally to the crown; a war for the throne with the plotter as claimant
      PE.note(r, { k: 'night', chose: 'contested', p: lead.id, n: 2, why, plot: P.id });
      PE.tell(r, `A coup in ${short(r.id)} half succeeds: ${A.fullName(lead, false)} holds part of the capital and claims the crown.`, 'world', why);
      if (A.successionWar && !lead.ruler) A.successionWar(r, lead);
      return 'contested';
    }
    PE.note(r, { k: 'night', chose: 'failed', p: lead.id, n: 2, why, plot: P.id });
    return PE.judge(r, P, `The plotters move in the night and fail. ${why}`);
  };

  // ---------------------------------------------------------------- found or failed: the king's judgment
  PE.found = function (P, how) {
    const S = A.S, r = A.realm(P.r);
    S.plots = plots().filter(x => x !== P);
    if (!r) return null;
    PE.tell(r, `A plot against the crown of ${short(r.id)} is uncovered: ${how}.`, 'realm');
    return PE.judge(r, P, how);
  };
  PE.judge = function (r, P, how) {
    const ru = A.P(r.ruler), S = A.S;
    if (!live(ru)) return null;
    for (const id of P.m) {
      const q = A.P(id);
      if (!live(q)) continue;
      if (q.id === S.pc) { if (ru.rel && ru.rel[q.id]) A.addOp(ru, q, -60); A.log(`You are named among the plotters. The ${kingOf(r, ru)} will not forget it.`, 'bad'); continue; }
      if (ru.id === S.pc) { A.log(`${A.fullName(q, false)} is taken for plotting against you. ${how}.`, 'bad'); q.flags = q.flags || {}; q.flags.traitor = S.year; continue; }
      const kin = ru.rel && ru.rel[q.id] && ['sibling', 'child', 'spouse', 'parent'].includes(ru.rel[q.id].type);
      const rec = W().decide(ru, 'plotjudge', [
        { id: 'block', at: q.id, feeds: ['anger', 'fear', 'pride'], reasons: [rs('duty', 1.5, 'The law of treason', { t: 'law' }, 1), rs('fear', .8, 'A plotter left alive plots again', { t: 'risk' }, 0)] },
        { id: 'mercy', at: q.id, feeds: ['love'], reasons: [kin ? rs('kin', 1.6, `${A.fullName(q, false)} is his own blood`, { t: 'kin', id: q.id }, 1) : rs('kin', .2, 'Mercy becomes a crown', { t: 'mercy' }, 1), rs('reckoning', q.house && A.S.houses[q.house] ? A.houseStrength(A.S.houses[q.house]) / Math.max(1, r.army || 1) : 0, 'His house\'s swords', { t: 'house', id: q.house || null }, 0)] },
      ], { band: 1, r: r.id, at: q.id });
      if (!rec) continue;
      W().feel(ru, 'fear', { t: 'plot', y: S.year, at: q.id, label: `the plot of ${A.fullName(q, false)}`, pub: 1 }, .6);
      const h = q.house && A.S.houses[q.house];
      if (h) h.op = clamp((h.op || 50) - 20, 0, 100);
      if (rec.chose === 'block') { A.kill(q, 'executed for treason'); PE.tell(r, `${A.fullName(q, false)} is put to death for treason in ${short(r.id)}.`, 'realm', A.WHY.tell(rec, true)); }
      else PE.tell(r, `The ${kingOf(r, ru)} of ${short(r.id)} spares ${A.fullName(q, false)}, a plotter.`, 'court', A.WHY.tell(rec, true));
    }
    return 'failed';
  };

  // a crown taken to end a losing war asks for terms (W1-5): a reason in the new ruler's pan to ask (A.WAR.askHooks)
  PE.coupAsk = function (w, s) {
    const rid = A.WAR.lead(w, s), r = A.realm(rid);
    if (!r || !r.coupPeace || A.S.year - r.coupPeace > 2) return [];
    return [rs('duty', 2.2, 'He took the crown to end this war', { t: 'coup', y: r.coupPeace }, 1)];
  };
})();
