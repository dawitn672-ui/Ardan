// W1-6 part f: the crown's council, a ruler made to yield, and the realm's month (D-102).
//
//   A.PEACE.counselQ(r, t, pc, kind, ch)  a councillor's counsel of war, an alliance or a pact (the release's
//                                         A.councilPropose): the ruler weighs it with his own reasons (kind 'counsel'),
//                                         as W1-5 made counsel of peace. The release's roll on ch is gone.
//   A.PEACE.allyQ(t, r)                   the other crown answers the alliance the council proposed (kind 'ally'),
//                                         no longer A.chance(0.5).
//   made to yield (war.md §11.3, point 6) three reasons in a ruler's pan to ask for terms (W1-5's A.WAR.askHooks):
//                                         his lords refuse further service (W1-3's muster: those who took their men
//                                         home or refused, by their swords); his council votes for peace where the law
//                                         gives it the vote (a council realm: each councillor's own weighing of the
//                                         war, a majority); a coup that took the crown to end the war (part d).
//   the month                             each realm's business falls in its own month (fixed by its id, no dice): its
//                                         feuds and border, a coup's question; plots move monthly.
(function () {
  const PE = A.PEACE, W = () => A.WHY;
  if (!PE) return;
  const { clamp, live, short } = PE;
  const r2 = x => Math.round(x * 100) / 100;
  const rs = (kind, weight, label, source, pub) => ({ kind, weight: r2(weight), label, source, pub: pub ? 1 : 0 });
  W().T.kindCap = Object.assign({ counsel: 20, ally: 10, vote: 10 }, W().T.kindCap || {});

  // ---------------------------------------------------------------- the council's counsel
  PE.counselQ = function (r, t, pc, kind, ch) {
    const ru = r.ruler != null ? A.P(r.ruler) : null, ratio = A.realmPower(r) / Math.max(1, A.realmPower(t)), rel = A.relBetween(r.id, t.id);
    const counsel = rs('loyalty', r2(.6 + 2.5 * ((ch || .2) - .2)), `The counsel of ${A.fullName(pc, false)}`, { t: 'counsel', id: pc.id }, 1);
    const act = [counsel], no = [];
    if (kind === 'war') {
      const cb = A.cbOn ? A.cbOn(r.id, t.id) : null, P = A.cbPreview ? A.cbPreview(r.id, t.id) : null;
      const reasons = P && A.WHY.warReasons ? A.WHY.warReasons(r, t, P, rel, cb) : null;
      if (!reasons) return W().decide(ru || r.id, 'counsel', [{ id: 'decline', reasons: [rs('debt', 3, `An old debt to ${short(t.id)}`, { t: 'debt', at: t.id }, 1)] }, { id: 'act', reasons: act }], { r: r.id, at: t.id });
      act.push(...reasons);
      no.push(...A.WHY.peaceReasons(r));
      if (A.atWar(r.id).length) no.push(rs('reckoning', 1.5, 'A war already on his hands', { t: 'war' }, 1));
      if ((r.allies || []).includes(t.id)) no.push(rs('duty', 3, `${short(t.id)} is his ally`, { t: 'ally', at: t.id }, 1));
    } else if (kind === 'ally') {
      act.push(rs('kin', rel / 40, rel >= 0 ? `Friendship with ${short(t.id)}` : `Bad blood with ${short(t.id)}`, { t: 'opinion', at: t.id, r: rel }, 1));
      no.push(rs('reckoning', .6 + ((r.allies || []).length >= 3 ? 1.5 : 0), (r.allies || []).length >= 3 ? 'Allies enough already' : 'An alliance binds him to other crowns\' wars', { t: 'allies', r: (r.allies || []).length }, 0));
    } else if (kind === 'nap') {
      act.push(rs('reckoning', ratio < 1 ? .6 : .2, ratio < 1 ? `${short(t.id)} is the stronger: a pact is a wall` : 'A quiet border', { t: 'ratio', r: r2(ratio) }, 0));
      no.push(rs('ambition', .4, 'His hands tied for ten years', { t: 'tied' }, 0));
    }
    return W().decide(ru || r.id, 'counsel', [
      { id: 'act', at: t.id, feeds: kind === 'war' ? A.WHY.WAR_FEEDS : [], reasons: act },
      { id: 'decline', at: t.id, feeds: ['fear'], reasons: no.length ? no : [rs('reckoning', .5, 'He sees no need', { t: 'need' }, 0)] },
    ], { band: 1, r: r.id, at: t.id });
  };
  // the other crown's answer to an alliance
  PE.allyQ = function (t, r) {
    const rel = A.relBetween(t.id, r.id), ratio = A.realmPower(r) / Math.max(1, A.realmPower(t));
    const common = A.neighbors(t.id).filter(x => A.neighbors(r.id).includes(x) && A.relBetween(t.id, x) < -30 && A.relBetween(r.id, x) < -30);
    return W().decide(t.id, 'ally', [
      { id: 'sign', at: r.id, reasons: [
        rs('kin', (rel - 20) / 25, `Friendship with ${short(r.id)}`, { t: 'opinion', at: r.id, r: rel }, 1),
        rs('reckoning', .5 * (Math.min(2, ratio) - .8), `The strength of ${short(r.id)}`, { t: 'ratio', r: r2(ratio) }, 0),
        common.length ? rs('grudge', .8, `A common enemy: ${short(common[0])}`, { t: 'enemy', at: common[0] }, 1) : null,
      ].filter(Boolean) },
      { id: 'wait', at: r.id, reasons: [rs('reckoning', .3 + ((t.allies || []).length >= 3 ? 1.5 : 0), 'An alliance binds him to other crowns\' wars', { t: 'allies', r: (t.allies || []).length }, 0)] },
    ], { band: 1, r: t.id, at: r.id });
  };

  // ---------------------------------------------------------------- made to yield
  // his lords refuse further service: those of his muster who took their men home or refused, by their swords
  PE.serviceAsk = function (w, s) {
    const rid = A.WAR.lead(w, s), CM = A.CMD;
    if (!CM || !CM.musterOf) return [];
    const m = CM.musterOf(w.id, rid);
    if (!m || !Array.isArray(m.e) || !m.e.length) return [];
    let all = 0, gone = 0, n = 0;
    for (const e of m.e) { const h = A.S.houses[e.h], s0 = CM.full(h) || 1; all += s0; if (e.gone || e.a === 'refuse') { gone += s0; n++; } }
    if (!n || !all) return [];
    const share = gone / all;
    return share >= .15 ? [rs('reckoning', 2.5 * share, `${n} of his great lord${n === 1 ? '' : 's'} refuse${n === 1 ? 's' : ''} further service`, { t: 'service', r: r2(share) }, 1)] : [];
  };
  // the council votes, where the law gives it the vote: each councillor weighs the war as the ruler's pans read, by his
  // own temper; a majority for asking binds the crown
  PE.voteAsk = function (w, s, f) {
    const rid = A.WAR.lead(w, s), r = A.realm(rid);
    if (!r || r.gov !== 'council' || !f || !A.WHY.E || !A.WAR.E) return [];
    const P = A.WAR.E.will(f), foe = A.WAR.lead(w, s === 'att' ? 'def' : 'att');
    let yes = 0, n = 0;
    for (const k of Object.keys(r.council || {})) {
      const c = A.P(r.council[k]);
      if (!live(c) || c.id === r.ruler) continue;
      n++;
      const o = A.WHY.E.odds(W().mind(c), [{ id: 'fight', at: foe, reasons: P.fight }, { id: 'ask', at: foe, reasons: P.ask }], { year: A.S.year });
      if (o && o.ask > .5) yes++;
    }
    if (n < 3 || yes * 2 <= n) return [];
    return [rs('duty', 3, `The council votes for peace, ${yes} of ${n}`, { t: 'vote', r: yes, id: rid }, 1)];
  };
  if (A.WAR) {
    A.WAR.askHooks = A.WAR.askHooks || [];
    A.WAR.askHooks.push((w, s, f) => PE.serviceAsk(w, s), (w, s, f) => PE.voteAsk(w, s, f), (w, s) => (PE.coupAsk ? PE.coupAsk(w, s) : []));
  }

  // ---------------------------------------------------------------- the realm's month
  PE.monthOf = rid => PE.hash('peace:' + rid) % 12;
  PE.month = function () {
    const S = A.S;
    if (!S || !S.realms) return;
    for (const P of PE.plots().slice()) PE.plotMonth(P);
    const mo = Math.floor((A.today ? A.today() : 0) / 30.42) % 12;
    for (const id of Object.keys(S.realms)) {
      if (PE.monthOf(id) !== mo) continue;
      const r = S.realms[id];
      if (!r || !r.alive || r.isRebel) continue;
      if (r.peaceY === S.year) continue;
      r.peaceY = S.year;
      for (const F of PE.feuds().filter(x => x.r === id && !x.end)) F.k === 'border' ? PE.borderTurn(F) : PE.feudTurn(F);
      PE.feudYear(r);
      PE.borderYear(r);
      PE.coupYear(r);
    }
  };
  A.onMonth.push(function () { try { PE.month(); } catch (e) { console.error('[peace] month', e); } });

  // ---------------------------------------------------------------- the coherency check (war.md §16, W1-6's "done when")
  // every upheaval recorded (a league raised, a petition, an answer, a rising, a coup, a quarrel) has two reasons or more
  // with a source behind it
  const UPHEAVAL = { faction: 1, petition: 1, facanswer: 1, facrise: 1, claim: 1, rise: 1, commons: 1, coup: 1, night: 1, feud: 1, judge: 1, peace: 1, raid: 1, border: 1, quarrel: 1, side: 1, approach: 1, watch: 1, arrest: 1, field: 1 };
  PE.unreasoned = () => PE.log().filter(e => UPHEAVAL[e.k] && !(e.n >= 2)).map(e => `${e.y} ${e.r}: ${e.k} ${e.chose || ''} with ${e.n || 0} reasons`);
  if (A.COHERENCY && A.COHERENCY.add) A.COHERENCY.add('an unreasoned upheaval', () => PE.unreasoned(), { owner: 'src/nobility/9999954-realm-peace' });
})();
