// A broke crown cannot raise armies without limit (world review cycle 2, B1).
//
// The release's A.indMonth calls A.emergencyLevy (at war, up to three new divisions a month while the host is under
// 35% of its normal size) and refills every division at peace (A.divReinforce), and its industry lines charge
// `work x 9` suns a month to the treasury, whatever the treasury holds. None of it asks whether the crown can pay. The
// League of the Nine Wells (one oasis, an income of 26,690) so reached 1.47 million men and 33.6 million of debt in one
// soak. Now, for a crown not run by the player:
//   1. broke means the treasury is below zero and the debt is above a year's income (WF.broke);
//   2. a broke crown calls out no levies, finishes no new divisions and does not refill its old ones;
//   3. its workshops are paid only from a treasury above zero: below it, the month's work is not done (no cost, no
//      output);
//   4. once a year, a crown whose debt is above two years' income disbands its newest divisions until the host's
//      upkeep (3.2 suns a man, the release's rate) fits in its income; the men go home to the levy.
// Engine only; no dice. State: none new (it reads treasury, debt, income and the divisions).
(function () {
  const WF = A.WF = A.WF || {};
  WF.BROKE_DEBT = 1;      // debt above this many years of income, with the treasury below zero: broke
  WF.DISBAND_DEBT = 2;    // debt above this many years of income: the host is cut to what the income keeps
  WF.UPKEEP = 3.2;        // suns a man a year (the release's)
  WF.stats = { levyHeld: 0, queueHeld: 0, refillHeld: 0, workHeld: 0, disbanded: 0, men: 0 };
  const ai = r => !!(r && r.alive && !r.playerRun && !(A.pc() && A.pc().ruler === r.id));
  WF.broke = r => !!(r && (r.treasury || 0) < 0 && (r.debt || 0) > Math.max(1, r.income || 0) * WF.BROKE_DEBT);

  const levy = A.emergencyLevy;
  if (typeof levy === 'function') A.emergencyLevy = function (r) {
    if (ai(r) && WF.broke(r)) { WF.stats.levyHeld++; return; }
    return levy.apply(this, arguments);
  };
  const qs = A.queueStep;
  if (typeof qs === 'function') A.queueStep = function (r, days) {
    // a broke crown's recruits wait in the depot: their time does not run, and nothing joins the host
    if (ai(r) && WF.broke(r) && r.forces && r.forces.queue && r.forces.queue.length) { WF.stats.queueHeld++; return; }
    return qs.apply(this, arguments);
  };
  const ref = A.divReinforce;
  if (typeof ref === 'function') A.divReinforce = function (d, r) {
    if (ai(r) && WF.broke(r)) { WF.stats.refillHeld++; return; }
    return ref.apply(this, arguments);
  };
  // the workshops: below zero, the month's work is not paid, so it is not done (what the lines would have made is
  // taken back off the stock, and their wage cost given back)
  const ind = A.indMonth;
  if (typeof ind === 'function') A.indMonth = function (r) {
    const I = r && r.ind;
    if (!ai(r) || !I || !((r.treasury || 0) < 0)) return ind.apply(this, arguments);
    const stock = Object.assign({}, I.stock || {}), out = Object.assign({}, I.out || {});
    let work = 0;
    for (const L of I.lines || []) if (L.eq !== 'trade') work += L.n * L.eff * 30;
    const res = ind.apply(this, arguments);
    if (work > 0) {
      r.treasury += Math.round(work * 9);
      // the release's line output is added to I.stock and I.out; put both back as they were, less what the month's
      // levies and divisions drew from the stock (never more than there was)
      for (const k in I.stock) { const made = (I.out[k] || 0) - (out[k] || 0); if (made > 0) { I.stock[k] = Math.max(0, I.stock[k] - made); I.out[k] = out[k] || 0; } }
      for (const k in stock) if (I.stock[k] == null) I.stock[k] = 0;
      WF.stats.workHeld++;
    }
    return res;
  };
  // once a year: a crown deep in debt sends home the newest divisions it cannot keep
  WF.disband = function (r) {
    const F = r && r.forces; if (!ai(r) || !F || !Array.isArray(F.divs) || !F.divs.length) return 0;
    const inc = Math.max(1, r.income || 0);
    if (!((r.debt || 0) > inc * WF.DISBAND_DEBT)) return 0;
    const keep = inc * 0.9 / WF.UPKEEP;
    let men = F.divs.reduce((a, d) => a + (d.men || 0), 0), n = 0, gone = 0;
    // newest first (the release pushes new divisions at the end); a realm keeps at least one
    for (let i = F.divs.length - 1; i >= 1 && men > keep; i--) {
      const d = F.divs[i];
      if (A.pc() && A.pc().mil && A.pc().mil.div === d.id) continue;   // never the player's own division
      if (d.elite) continue;   // the guard is the last to go
      men -= d.men || 0; gone += d.men || 0;
      if (A.divRemove) { r.levy = (r.levy || 0) + Math.round((d.men || 0) * 0.5); A.divRemove(d); } else F.divs.splice(i, 1);
      n++;
    }
    if (n) {
      if (A.forcesSync) A.forcesSync(r);
      WF.stats.disbanded += n; WF.stats.men += gone;
      A.news(`${A.realmRef ? A.realmRef(r.id) : r.short} cannot pay its soldiers: ${n} division${n > 1 ? 's go' : ' goes'} home unpaid (${A.fmt(gone)} men).`, 'war');
    }
    return n;
  };
  A.onMonth.push(() => {
    try {
      const S = A.S; if (!S || !S.realms || A.monthOf(A.today()).m !== 0) return;
      for (const id in S.realms) { const r = S.realms[id]; if (r.alive) WF.disband(r); }
    } catch (e) { console.error('broke crowns', e); }
  });
})();
// "The Chain Keepers", not "The The Chain Keepers" (patch WLD-DIV-ARTICLE)
A.divThe = n => { n = String(n || ''); return /^the /i.test(n) ? n.charAt(0).toUpperCase() + n.slice(1) : 'The ' + n; };
