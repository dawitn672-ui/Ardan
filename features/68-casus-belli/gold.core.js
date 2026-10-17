// Hoarding 0 (Road to Ten, Diplomacy 5: "The world audit's hoarding flag must read 0"). 56-realm-inside spends AI
// gold on a ladder every year and turns a windfall (a treasury over four years of income) into a great work within
// the month (RI.windfalls). Its audit still read 2 flags in 33,225 realm-years; this feature's bench, with the feature
// off, read 1 in 10 worlds x 100 years. Traced month by month (seed 99, Sylvaran, 1202-1203): the treasury had not
// grown, the income had shrunk under it. A peace took one of its 15 provinces at the turn of the year, A.updateRealmPops
// recomputed its income from 897,581 to 379,924, and the same 2.85 million read as 7.5 years until the next month's
// windfall check made it a great work (3.0 years). So 56's own windfall rule also runs the moment incomes are
// recomputed, and once more after the whole year's accounts (after every other feature's yearly code). Nothing is
// drawn; it is off with A.CASUS.ON.
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
