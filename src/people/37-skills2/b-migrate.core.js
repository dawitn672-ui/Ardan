// Skills rebuild, step 4 (docs/design/skills-v2.md §7, §10): the save step 'skills2' (A.V2SAVE.upgrade, after 'skills';
// save version 16). An old save's player gets his rungs from his S1 table (pc.ks, pc.kc) and the state is marked
// (S.sk2v); everyone else's rung is a function of his number, so nothing is written for them. It draws no dice and is
// the same on every load; on a state already marked it does nothing. A new life gets its rungs at its first month
// (a-adapter's sync), so A.newGame needs no new stage.
//
// Step 5, the switch (save version 17, S.sk2v 2): the same step brings a save of version 15 or 16 to the rungs that hold
// the level. In C, B and A the experience past an odd level's bar would be the even level at once; it is held back
// (SK2.holdBack, s.hold) so every check reads on load exactly what it read in the save's own version, and the first
// month's pass lands it (SK2.land).
(function () {
  const SK2 = A.SK2; if (!SK2 || !SK2.build) return;
  SK2.migrate = function (S) {
    S = S || A.S; if (!S || !S.people) return 0;
    if (S.sk2v >= (SK2.on ? 2 : 1)) return 0;
    // a state made at version 17 or later was born on the rungs (a new game never ran this step, so it has no mark):
    // it only needs the mark, never the hold-back, which would move a level it already holds (H-144)
    const made = A.V2SAVE && A.V2SAVE.from != null ? +A.V2SAVE.from : +S.ver;
    if (SK2.on && made >= 17) { S.sk2v = 2; return 0; }
    const pc = S.people[S.pc];
    let n = 0;
    // S1's step runs first ('skills'): a save older than S1 has its table by now
    if (pc && pc.sk && typeof pc.sk === 'object') {
      if (SK2.on) SK2.holdBack(pc);
      n = SK2.build(pc);
    }
    S.sk2v = SK2.on ? 2 : 1;
    return n;
  };
})();
