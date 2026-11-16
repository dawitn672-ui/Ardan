// Retired by S1b (D-072): 999997-bodies' wrapper of A.trainSkill, from src/people/999997-bodies/a-floor.core.js.
// Its stall became A.SK.bodyStall and its stat training A.SK.trainStats (src/people/36-skills).
  // ---- it stalls; and training a skill trains its stats a little --------------------------------------------------------
  BD.TRAIN_STAT = [0.05, 0.03];
  if (A.trainSkill) {
    const trainSkill = A.trainSkill;
    A.trainSkill = function (p, k0) {
      const sk = p && p.skills;
      if (!sk || !GD.SKILLS[k0]) return trainSkill.apply(this, arguments);
      // 49-body-mind keeps a merged skill under its family's key for the player
      const k = BD.isPC(p) && A.BM && A.BM.canon ? A.BM.canon(k0) : k0;
      const before = sk[k] || 0, lim = BD.carry(p, k);
      // a skill already past what its stats carry (an old save, a wound, the years) neither rises nor is taken away
      if (before >= lim) {
        const g0 = trainSkill.apply(this, arguments);
        if ((sk[k] || 0) > before) sk[k] = before;
        return g0 > 0 ? 0 : g0;
      }
      const g = trainSkill.apply(this, arguments);
      if ((sk[k] || 0) > lim) sk[k] = lim;
      const got = (sk[k] || 0) - before;
      if (got > 0 && BD.isPC(p) && A.train) {
        const ss = GD.SKILL_STAT[k] || [];
        if (ss[0]) A.train(p, ss[0], got * BD.TRAIN_STAT[0]);
        if (ss[1] && ss[1] !== ss[0]) A.train(p, ss[1], got * BD.TRAIN_STAT[1]);
      }
      return g > got ? got : g;
    };
  }
