// Skills rebuild, step 4 (docs/design/skills-v2.md §7, §10): the save step 'skills2' (A.V2SAVE.upgrade, after 'skills';
// save version 16). An old save's player gets his rungs from his S1 table (pc.ks, pc.kc) and the state is marked
// (S.sk2v); everyone else's rung is a function of his number, so nothing is written for them. It draws no dice and is
// the same on every load; on a state already marked it does nothing. A new life gets its rungs at its first month
// (a-adapter's sync), so A.newGame needs no new stage.
(function () {
  const SK2 = A.SK2; if (!SK2 || !SK2.build) return;
  SK2.migrate = function (S) {
    S = S || A.S; if (!S || !S.people) return 0;
    if (S.sk2v) return 0;
    const pc = S.people[S.pc];
    let n = 0;
    // S1's step runs first ('skills'): a save older than S1 has its table by now
    if (pc && pc.sk && typeof pc.sk === 'object') n = SK2.build(pc);
    S.sk2v = 1;
    return n;
  };
})();
