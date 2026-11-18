// W1-5 "surrender or defeat" (war.md §11.3, §12.2; D-095): the player's part, only when he rules a side's leading realm.
//
//   The peace table (the release's A.peaceTerms, A.peaceOffer and UI.peacePanel read these): the terms he may ask or give
//   are real things (land his soldiers hold, land theirs hold, coin, tribute, a submission, alliances renounced); how the
//   other crown leans is told in words and a tipped scale, from the reasons it would weigh (A.WHY's odds, no draw); his
//   envoys ride, and the answer comes when they reach the other court.
//     A.WAR.table(w, rid)            { w, side, eid, e, r, terms: [{ k, grp, name, sub, heavy }], foe: words, ask }
//     A.WAR.tableLean(w, rid, picks) { words, line, tilt, why: [label] }   how they would answer, without a die
//     A.WAR.send(wid, picks)         the envoys ride: { ok, msg }
//   The cards: envoys of an AI crown asking him for terms (he names his cause's terms, everything he holds, or sends them
//   away), a counter-offer, terms offered him by the stronger, a beaten foe's peace to dictate. Each is a choice card
//   (notable: it stops the step). A card dismissed unanswered is answered as a ruler who ignores envoys answers: they go
//   home with nothing (a beaten foe's peace is his cause's).
(function () {
  const WAR = A.WAR, W = A.WHY;
  if (!WAR || !WAR.facts) return;
  const E = WAR.E, other = WAR.other, cap = WAR.cap;
  const short = id => (A.realm(id) ? A.realmShort(id) : String(id || 'the enemy'));
  const day = () => (A.absDay ? A.absDay() : A.S.year * 365);
  const ODDS = (A.V2 && A.V2.odds && A.V2.odds.ODDS_WORDS) || [[.8, 'likely'], [-.8, 'in the balance'], [-99, 'unlikely']];

  // ---------------------------------------------------------------- the peace table
  const g1 = L => Math.round(Math.max(500, (L.income || 0) * .2));
  const weight = c => (c >= 1.5 ? 'a heavy demand' : c >= .6 ? 'a hard demand' : c > .05 ? 'a light demand' : c < -.6 ? 'a large gift' : c < -.05 ? 'a gift' : 'costs them little');
  WAR.table = function (w, rid) {
    const S = A.S, side = A.warSide(w, rid);
    if (!side) return null;
    const my = WAR.realmsOf(w, side), them = WAR.realmsOf(w, other(side)), eid = WAR.lead(w, other(side)), e = A.realm(eid), r = A.realm(rid);
    if (!e || !r) return null;
    const ePop = S.prov.filter(p => them.includes(p.owner)).reduce((a, p) => a + p.pop, 0) || 1,
      myPop = S.prov.filter(p => my.includes(p.owner)).reduce((a, p) => a + p.pop, 0) || 1, out = [];
    const add = (k, grp, name, sub, term) => out.push({ k, grp, name, sub, term, heavy: weight((term.give ? -1 : 1) * E.termCost(term)) });
    for (const p of S.prov)
      if (them.includes(p.owner) && my.includes(p.occ)) {
        const capital = A.realm(p.owner) && A.realm(p.owner).capitalProv === p.id;
        add('take:' + p.id, 'Land you hold', `Take ${p.name}`, `${A.realmShort(p.owner)} · ${A.fmt(p.pop)} people${capital ? ' · their capital' : ''}${r.claims && r.claims[p.id] ? ' · your claim' : ''}`,
          { k: 'land', provs: [p.id], share: p.pop / ePop, capital, to: rid, fromSide: other(side), label: p.name });
      }
    const g = g1(e);
    add('gold', 'Gold and honour', `Reparations: ${A.fmt(g)} suns`, 'Paid from their treasury.', { k: 'coin', amt: g, years: g / Math.max(1, e.income || 1), from: eid, to: rid, label: `reparations: ${A.fmt(g)} suns` });
    add('gold2', 'Gold and honour', `Crushing reparations: ${A.fmt(g * 2.5)} suns`, 'They will borrow to pay it, and hate you for years.', { k: 'coin', amt: Math.round(g * 2.5), years: g * 2.5 / Math.max(1, e.income || 1), from: eid, to: rid, label: `crushing reparations: ${A.fmt(g * 2.5)} suns` });
    if (!e.overlord && r.overlord !== e.id && !e.isRebel) add('trib', 'Gold and honour', 'They become your tributary', 'A share of their income every year until they break free.', { k: 'trib', label: `${short(eid)} a tributary of ${short(rid)}` });
    if ((e.allies || []).filter(x => A.realm(x) && A.realm(x).alive && x !== rid).length)
      add('unally', 'Gold and honour', 'They renounce their alliances', e.allies.filter(x => A.realm(x)).map(A.realmShort).join(', '), { k: 'unally', label: `${short(eid)} renounces its alliances` });
    add('humble', 'Gold and honour', 'A public submission', 'Their ruler kneels to yours, before both courts.', { k: 'humble', label: `a public submission: the ruler of ${short(eid)} kneels` });
    for (const p of S.prov)
      if (my.includes(p.owner) && them.includes(p.occ))
        add('cede:' + p.id, 'What you give', `Cede ${p.name}`, `They hold it already · ${A.fmt(p.pop)} people`, { k: 'land', give: 1, provs: [p.id], share: p.pop / myPop, to: eid, fromSide: side, label: p.name });
    const pay = Math.round(Math.max(600, (r.income || 0) * .12));
    add('pay', 'What you give', `Pay them ${A.fmt(pay)} suns`, 'Silver to end it.', { k: 'coin', give: 1, amt: pay, years: pay / Math.max(1, r.income || 1), from: rid, to: eid, label: `${A.fmt(pay)} suns paid by ${short(rid)}` });
    const fw = e.exhaustion || 0;
    return { w, side, my, them, eid, e, r, terms: out, foe: fw > 60 ? 'worn out by the war' : fw > 30 ? 'tiring of the war' : 'still fresh', ask: w.ask && w.ask.k === 'player' ? w.ask : null };
  };
  // the picks as terms: what they give, what you give, and the balance (in their eyes: > 0, they give more)
  const pickTerms = (T, picks) => {
    if (picks.includes('gold2')) picks = picks.filter(k => k !== 'gold');
    const chosen = T.terms.filter(t => picks.includes(t.k)).map(t => t.term);
    const theirs = chosen.filter(t => !t.give), mine = chosen.filter(t => t.give);
    return { chosen, theirs, mine, net: E.termsCost(theirs) - E.termsCost(mine) };
  };
  // the other crown's question, as it would weigh it: take these terms, or fight on
  const offerOptions = (w, fs, pt) => {
    const f = WAR.facts(w, fs, { noTerms: true, dry: true }), foe = WAR.lead(w, other(fs));
    f.terms = Math.max(0, pt.net);
    f.termsLabel = WAR.termsWords(pt.theirs, true);
    const P = E.will(f), acc = P.ask.slice();
    if (pt.net < 0) acc.push({ kind: 'want', weight: Math.round((-pt.net + .3) * 100) / 100, label: `What ${short(foe)} offers: ${WAR.termsWords(pt.mine, true)}`, source: { t: 'offer' }, pub: 1 });
    return [{ id: 'accept', at: foe, feeds: ['fear'], reasons: acc }, { id: 'refuse', at: foe, feeds: ['pride', 'anger', 'shame', 'zeal', 'grief'], reasons: P.fight }];
  };
  WAR.tableLean = function (w, rid, picks) {
    const T = WAR.table(w, rid);
    if (!T) return null;
    const pt = pickTerms(T, picks || []), opts = offerOptions(w, other(T.side), pt);
    const x = W.E.odds(W.mind(T.eid), opts, { year: A.S.year, band: WAR.T.ansBand, at: rid });
    const p = Math.min(.995, Math.max(.005, x ? x.accept : .5)), edge = Math.log(p / (1 - p));
    let words = 'in the balance', line = '';
    for (const [t, wd, ln] of ODDS) if (edge >= t) { words = wd; line = ln || ''; break; }
    const sc = W.E.weigh(W.mind(T.eid), edge >= 0 ? opts[0] : opts[1], { year: A.S.year, at: rid });
    const why = sc.reasons.filter(r => r.w > 0 && (r.pub || W.knows(T.eid))).sort((a, b) => b.w - a.w).slice(0, 3).map(r => r.label);
    return { words, line, tilt: Math.max(-1, Math.min(1, edge / 4)), why, net: pt.net };
  };
  WAR.send = function (wid, picks) {
    const pc = A.pc(), rid = pc && pc.ruler, w = A.S.wars.find(x => x.id === wid);
    if (!w || !rid) return { ok: false, msg: 'There is no such war.' };
    if (!(w.leadA === rid || w.leadD === rid)) return { ok: false, msg: 'Only the leader of your side can make peace.' };
    if (w.ask) return { ok: false, msg: w.ask.k === 'player' ? 'Your envoys are already on the road.' : 'Envoys are already on the road between the courts.' };
    const acts = A.S.yearActs = A.S.yearActs || {};
    if (acts['peace_' + wid] >= 2) return { ok: false, msg: 'They have heard two embassies this year. They will not hear a third.' };
    acts['peace_' + wid] = (acts['peace_' + wid] || 0) + 1;
    const T = WAR.table(w, rid), pt = pickTerms(T, picks || []), days = WAR.ride(rid, T.eid);
    w.ask = { k: 'player', s: T.side, d0: day(), due: day() + days, leg: 1, picks: (picks || []).slice(0, 24), path: 7 };
    A.log(`Your envoys ride for ${A.realmName(T.eid)} with your terms: ${pt.chosen.length ? WAR.termsWords(pt.chosen) : 'peace, with nothing changing hands'}.`, 'peace');
    return { ok: true, msg: `Your envoys ride for ${short(T.eid)}. The road takes about ${days} day${days === 1 ? '' : 's'}.` };
  };
  // the player's envoys reach the other court: it weighs the terms, and the answer is sent back
  WAR.playerArrive = function (w) {
    const a = w.ask, ps = a.s, fs = other(ps), pc = A.pc();
    if (!pc || !pc.alive || WAR.playerSide(w) !== ps) { w.ask = null; return; }
    const T = WAR.table(w, pc.ruler), pt = pickTerms(T, a.picks || []);
    const rec = W.decide(T.eid, 'terms', offerOptions(w, fs, pt), { band: WAR.T.ansBand, r: T.eid, at: pc.ruler });
    const why = rec ? W.tell(rec, !W.knows(T.eid)) : '';
    if (!rec || rec.chose !== 'accept') {
      w.ask = null; w.quiet = day() + 30; WAR.stats.refused++;
      A.addRel(pc.ruler, T.eid, -4);
      A.log(`Your envoys come back from ${A.realmName(T.eid)}: they refuse your terms. The war goes on.${why ? ' ' + why : ''}`, 'war');
      return;
    }
    const by = pt.net > 0 ? fs : ps, give = t => (t.give ? ps : fs);
    const terms = pt.chosen.map(t => Object.assign({}, t, { fromSide: t.fromSide || give(t) }));
    terms.push({ k: 'peace', label: 'ten years of sworn peace' });
    A.log(`Your envoys come back from ${A.realmName(T.eid)} with the treaty sealed.${why ? ' ' + why : ''}`, 'peace');
    if (pt.net > 1.2) A.addRel(pc.ruler, T.eid, -25);
    WAR.settle(w, { kind: 'surrender', by, asked: a.d0, path: 7, white: !pt.chosen.length, terms, why: rec.why.slice(0, 3), told: W.tell(rec, true), rec });
  };

  // ---------------------------------------------------------------- the cards
  const ask = (w, title, text, options) => {
    const a = w.ask;
    a.pleg = a.leg; a.leg = 'player'; a.card = `${w.id}:${day()}:${a.kind}`; a.due = null;
    A.queue({ type: 'choice', title, text, warCard: a.card, options: options.map(([t, act]) => ({ t, fn: 'warCard', arg: { w: w.id, n: a.card, a: act } })) });
  };
  WAR.card = function (w, kind) {
    const a = w.ask, ps = WAR.playerSide(w), fs = other(ps), foe = WAR.lead(w, fs), F = A.realm(foe), ru = F && F.ruler != null ? A.P(F.ruler) : null;
    const who = ru ? A.rulerStyle(ru, F) : `the crown of ${short(foe)}`;
    a.kind = kind;
    if (kind === 'asked') {
      const casus = WAR.terms(w, ps, 'casus'), all = WAR.terms(w, ps, 'all'), same = WAR.termsWords(casus) === WAR.termsWords(all);
      const opts = [[`Grant the terms of your cause: ${WAR.termsWords(casus, true)}`, 'casus']];
      if (!same) opts.push([`Ask for all you hold: ${WAR.termsWords(all, true)}`, 'all']);
      opts.push(['Send them away: the war goes on', 'refuse']);
      ask(w, `${cap(short(foe))} asks for terms`, `Envoys of ${who} come under a white branch to ask for terms in ${w.name}.${a.told ? ' ' + a.told : ''} They wait on your answer.`, opts);
    } else if (kind === 'counter') {
      ask(w, `${cap(short(foe))} will not give everything`, `The envoys of ${who} come back. They will not yield all you asked, but they will yield your cause: ${WAR.termsWords(a.terms)}.`,
        [['Take the terms of your cause', 'take'], ['Refuse: the war goes on', 'refuse']]);
    } else if (kind === 'offered') {
      ask(w, `${cap(short(foe))} offers terms`, `Envoys of ${who} bring terms to end ${w.name}: ${WAR.termsWords(a.terms)}.${a.told ? ' ' + a.told : ''}`,
        [['Accept the terms', 'accept'], ['Refuse: the war goes on', 'refuse']]);
    } else if (kind === 'terms') {
      ask(w, `${cap(short(foe))} names the terms`, `Your envoys come back from ${short(foe)}. The terms: ${WAR.termsWords(a.terms)}.`,
        [['Accept the terms', 'accept'], ['Refuse: the war goes on', 'refuse']]);
    } else if (kind === 'defeated') {
      const opts = [[`Dictate the terms of your cause: ${WAR.termsWords(WAR.terms(w, ps, 'casus'), true)}`, 'casus'], [`Take all you hold: ${WAR.termsWords(WAR.terms(w, ps, 'all'), true)}`, 'all']];
      const fl = WAR.facts(w, fs, { noTerms: true, dry: true });
      if ((fl.lostShare || 0) >= WAR.T.annexShare && F && !F.isRebel) opts.push([`Make ${short(foe)} your own`, 'annex']);
      ask(w, `${cap(short(foe))} can fight no more`, `${cap(short(foe))} is beaten: ${a.label}. Its lords wait to hear what you will take.`, opts);
    }
  };
  // the card was dismissed without an answer, or the player no longer decides for his side
  WAR.playerWait = function (w) {
    const a = w.ask;
    if (!a) return;
    const ps = WAR.playerSide(w), mine = a.kind === 'asked' || a.kind === 'counter' || a.kind === 'defeated' ? other(a.s) : a.s;
    if (ps !== mine) { a.leg = a.pleg; a.due = day(); return; }   // his heir or his council answers as the AI would
    if (A.S.queue.some(q => q && q.warCard === a.card)) return;
    WAR.cardDo(w, a.kind === 'defeated' ? 'casus' : 'refuse');
  };
  WAR.cardDo = function (w, act) {
    const a = w.ask;
    if (!a || !WAR.live(w)) return;
    const s = a.s, vs = other(s), ride = () => day() + WAR.ride(WAR.lead(w, s), WAR.lead(w, vs));
    a.leg = a.pleg;
    if (a.kind === 'asked') {
      if (act === 'refuse') { WAR.refused(w, s, null, 'you sent the envoys away'); return; }
      a.want = act; a.terms = WAR.terms(w, vs, act); a.leg = 2; a.due = ride();
      A.log(`Your terms ride back with the envoys of ${short(WAR.lead(w, s))}: ${WAR.termsWords(a.terms)}.`, 'peace');
      return;
    }
    if (a.kind === 'counter') {
      if (act === 'take') { WAR.settle(w, { kind: 'surrender', by: s, asked: a.d0, path: a.path, terms: a.terms, why: a.why, told: a.told }); return; }
      WAR.refused(w, s, null, 'you would have all of it'); return;
    }
    if (a.kind === 'offered' || a.kind === 'terms') {
      if (act === 'accept') { WAR.settle(w, { kind: 'surrender', by: s, asked: a.d0, path: a.k === 'offer' ? 7 : a.path, terms: a.terms, why: [['The crown accepted the terms', 1, 'duty', null, 1]], told: '' }); return; }
      if (a.k === 'offer') w.offerD = day() + WAR.T.offerDays;
      WAR.refused(w, s, null, 'you refused the terms'); return;
    }
    if (a.kind === 'defeated') {
      WAR.settle(w, { kind: 'defeat', by: s, asked: a.d0, path: act === 'annex' ? 8 : a.path, terms: WAR.terms(w, vs, act), why: [[cap(a.label || 'it can fight no more'), 2, 'fact', null, 1]], told: '', defeat: a.label });
    }
  };
  A.CHOICE_FN = A.CHOICE_FN || {};
  Object.assign(A.CHOICE_FN, {
    warCard(arg) {
      try {
        const w = arg && A.S.wars.find(x => x.id === arg.w);
        if (!w || !w.ask || w.ask.card !== arg.n) return;
        WAR.cardDo(w, arg.a);
      } catch (e) { console.error('[surrender] card', e); }
    },
  });
})();
