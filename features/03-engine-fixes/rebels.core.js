// A revolt that wins makes a realm, not a rebel forever (world review cycle 2, B2).
//
// The release marks a revolt's new realm isRebel (A.factionRevolt) and clears it only by folding the realm back into
// its parent. When the liberty war ends any other way (the rebels win, or a white peace), the realm lives on as a
// rebel: about fifty places skip `o.isRebel` (diplomacy, alliances, politics, the AI's war checks), so it is a
// frozen, friendless shell. One soak's Hall of Valdhall kept the same income for 80 years and fell to legitimacy 0.
// Now: when a war ends, every rebel realm that took part and still stands, and is at war with no one, becomes a realm
// of its own (isRebel cleared, isNew set). It keeps the truce the war's end gave it with its parent, its legitimacy
// starts at a founder's 45 if it was below, and its stability at 40. A rebel realm in an old
// save, at war with no one, is cleared the same way at the next month.
// Engine only; no dice. State: r.foundedFrom (the parent's id) and r.founded (the year), both optional.
(function () {
  const EF = A.EF = A.EF || {};
  EF.FOUNDED_LEGIT = 45;
  EF.stats = { founded: 0 };
  EF.found = function (r) {
    if (!r || !r.alive || !r.isRebel) return false;
    if (A.atWar && A.atWar(r.id).length) return false;
    r.isRebel = false; r.isNew = true;
    r.foundedFrom = r.parent || null; r.founded = A.S.year;
    if ((r.legit || 0) < EF.FOUNDED_LEGIT) r.legit = EF.FOUNDED_LEGIT;
    r.stability = Math.max(r.stability || 0, 40);
    // its taxes follow its land from here, through the release's yearly pass (A.updateRealmPops)
    if (r.baseIncome == null && r.income) r.baseIncome = r.income;
    if (A.polInit && !r.pol) { try { A.polInit(r); } catch (e) { /* the polity sets itself up next year */ } }
    // its council of named people (56-realm-inside), as any crown's
    if (A.RI && typeof A.RI.fillCouncil === 'function') { try { A.RI.fillCouncil(r); } catch (e) { /* filled at its first session */ } }
    EF.stats.founded++;
    const P = r.foundedFrom && A.realm(r.foundedFrom);
    A.news(`${r.name} stands on its own${P ? `, free of ${A.realmShort(P.id)}` : ''}. The world's courts begin to treat with it.`, 'crown');
    return true;
  };
  if (typeof A.on === 'function') A.on('warEnd', (w, res, text, live) => {
    try {
      if (!w || !live) return;
      for (const id of [...(w.att || []), ...(w.def || [])]) { const r = A.realm(id); if (r && r.isRebel) EF.found(r); }
    } catch (e) { console.error('rebels founded', e); }
  });
  // a rebel realm at war with no one (an old save, or a war that ended through a road that does not emit warEnd)
  A.onMonth.push(() => {
    try {
      const S = A.S; if (!S || !S.realms) return;
      for (const id in S.realms) { const r = S.realms[id]; if (r.alive && r.isRebel && !(A.atWar(r.id).length)) EF.found(r); }
    } catch (e) { console.error('rebels founded', e); }
  });
})();
