// Hoarding 0 (Road to Ten, Diplomacy 5: "The world audit's hoarding flag must read 0"). 56-realm-inside spends AI
// gold on a ladder every year and turns a windfall (a treasury over four years of income) into a great work within
// the month (RI.windfalls). Its own audit still read 2 flags in 33,225 realm-years, and this feature's bench read 1
// in 33,063 on the integrated build (seed 8080, 1185: Ashmere, 3 provinces, 3.4 million in the treasury against an
// income of 562,000, 6.05 years). The treasury had not grown: the income had shrunk under it. A.updateRealmPops
// recomputes a realm's income from its land and its tax law, and a crown that lightens its taxes or loses provinces can
// find the same coffers worth six years of the new income before the month's windfall check comes round.
// So the windfall check also runs the moment incomes are recomputed, and once more after the whole year's accounts
// (after every other feature's yearly code). It is 56's own rule, run at two more moments; nothing is drawn.
(function () {
  const CS = A.CASUS, RI = A.RI;
  if (!CS || !RI || typeof RI.windfalls !== 'function') return;
  const sweep = () => {
    if (!A.S || !A.S.realms || !CS.ON) return;
    let hot = false;
    for (const id in A.S.realms) { const r = A.S.realms[id]; if (r.alive && !r.playerRun && r.treasury > Math.max(1, r.income) * 4) { hot = true; break; } }
    if (!hot) return;
    const before = {};
    for (const id in A.S.realms) before[id] = A.S.realms[id].treasury;
    RI.windfalls();
    for (const id in A.S.realms) if (A.S.realms[id].treasury < before[id]) CS.stats.windfall++;
  };
  if (typeof A.updateRealmPops === 'function') {
    const up = A.updateRealmPops;
    A.updateRealmPops = function () {
      const res = up.apply(this, arguments);
      try { if (A.S && A.S.year) sweep(); } catch (e) { console.error('casus windfall', e); }
      return res;
    };
  }
  if (typeof A.worldYear === 'function') {
    const wy = A.worldYear;
    A.worldYear = function () {
      const res = wy.apply(this, arguments);
      try { sweep(); } catch (e) { console.error('casus windfall year', e); }
      return res;
    };
  }
})();
