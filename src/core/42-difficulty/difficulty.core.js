// Difficulty that changes information and recovery (Road to Ten, Balance 4). The release's three settings (Story, Hard,
// Realism) change only how often people die: children, mothers, the wounded at 0 health, the losers of duels. Now they
// also change what you are told and how fast you come back:
//   information: Story always shows each choice's odds as a number; Realism never does, only the words ("risky");
//                Hard keeps the player's own setting (UI.set.odds), as in the release;
//   recovery:    the year's healing, how long a wound lasts and how long a prison term runs scale with the setting.
// Engine side: A.healMul and the wrappers of A.addWound and A.imprison. Rendering reads A.DIFF.showOdds.
(function () {
  const D = A.DIFF = {
    // heal: the year's healing; wound: how long a wound lasts; prison: the length of a sentence
    RECOVER: { story: { heal: 1.5, wound: 0.5, prison: 0.5 }, hard: { heal: 1, wound: 1, prison: 1 }, realism: { heal: 0.7, wound: 1.5, prison: 1.25 } },
    of: () => (A.S && A.S.settings && D.RECOVER[A.S.settings.diff] ? A.S.settings.diff : 'hard'),
  };
  D.mul = k => D.RECOVER[D.of()][k];
  // the year's healing (called from the yearly patch)
  A.healMul = () => D.mul('heal');
  // whether a choice shows its odds as a number (pure)
  D.showOdds = () => { const d = D.of(); return d === 'story' ? true : d === 'realism' ? false : !!(UI.set && UI.set.odds); };

  // a wound lasts longer or shorter
  const wound = A.addWound;
  if (typeof wound === 'function') A.addWound = function (p) {
    const n0 = p && Array.isArray(p.wounds) ? p.wounds.length : 0;
    const r = wound.apply(this, arguments);
    try {
      const m = D.mul('wound');
      if (m !== 1 && p && p.id === A.S.pc && Array.isArray(p.wounds) && p.wounds.length > n0) {
        const w = p.wounds[p.wounds.length - 1];
        if (w && w.until) w.until = A.S.year + Math.max(1, Math.round((w.until - A.S.year) * m));
      }
    } catch (e) { console.error('difficulty', e); }
    return r;
  };
  // a sentence runs longer or shorter
  const prison = A.imprison;
  A.imprison = function (pc, years, why) {
    let y = years;
    try { if (pc && pc.id === A.S.pc && typeof years === 'number') y = Math.max(1, Math.round(years * D.mul('prison'))); } catch (e) {}
    return prison.call(this, pc, y, why);
  };
})();
