// C9 "Bodies that make sense" (owner order 34, D-039 item 12, D-040), part 1: a skill's baseline.
//
// The owner: "Who exactly becomes a master of swordsmanship without training their body or skilled at trade and diplomacy
// with abysmal wits?" and then: "Masters don't have bodies and brains to match their mastery but if they don't it'll hold
// them back from becoming masters ... once you get past a certain baseline it's cleanly up to you to decide what physical
// attributes and skills are most important for your playstyle." Measured at the start of eight worlds: of 685 people in
// their prime with a skill at 70 or more, 40% had a governing stat below the middle of their people and 15% one far below
// it (a royal commander at 83 with Intelligence 27 and Willpower 26; an elf general with Intelligence 7).
//
// The rule. Each skill has two governing stats (GD.SKILL_STAT). Each word of a skill from Journeyman up asks a modest
// baseline of them, as a share r of an untrained grown person of one's own people (r = 1 is the middle; the people's
// 10th centile is about 0.65, the 30th 0.88, the 50th 1.0, the 70th 1.2):
//
//   word       Journeyman 30  Adept 45  Expert 60  Master 75  Grandmaster 88  Legend 100
//   first stat 0.65           0.78      0.88       1.00       1.08            1.15
//   second     0.9 of that
//
// So a Master needs a body or mind about average for the skill's two stats, never a top one; past the baseline nothing
// is asked, and any build is a fair one: the stats beyond it add only through what reads them (a fight's worth, a check).
//
// - **Held back (A.skillCap, read by the release's A.skill):** a skill past the word its stats carry works at the top of
//   the word they do carry ("for show"): a sword Master with a feeble arm fights as an Expert, or less. Age, wounds and
//   weariness count (A.stat), so an old master fades as his body does. Below Journeyman nothing is asked.
// - **It stalls (A.trainSkill):** practice and use do not raise a skill past the word its stats carry. Training a skill
//   trains its first stat a little and its second less (the player only; A.train keeps its own limit, the potential).
// - **The world's people clear it (A.statFloor, read by the release's A.stat):** an NPC's governing stats are held at
//   least at the baseline of the word each skill is at, so no master swordsman has a child's body; a child's floor
//   grows with the child, so a child still cannot carry a master's skill. A life of work adds its own: an NPC soldier's
//   drill 1.10 of the middle for Strength and Stamina, a labourer's field or mine 1.05. The player is never lifted: the
//   player's stats are what the player made them.
//
// Pure and deterministic: everything reads the person (skills, stats, status, age, race) and draws nothing, so old saves
// read it with no new state.
(function () {
  const BD = (A.BODIES = A.BODIES || {});
  BD.BASE = [[30, 0.65], [45, 0.78], [60, 0.88], [75, 1.0], [88, 1.08], [100, 1.15]];
  BD.SECOND = 0.9;
  BD.FREE_BELOW = 30;
  // the baseline the first stat needs to hold a skill at v (0 below Journeyman)
  BD.baseline = function (v) {
    let need = 0;
    for (const [t, r] of BD.BASE) if (v >= t) need = r;
    return need;
  };
  // the highest skill a stat ratio carries: just under the first word whose baseline it misses (Infinity: no limit)
  BD.carries = function (r) {
    for (const [t, need] of BD.BASE) if (r < need - 1e-9) return t - 0.01;
    return Infinity;
  };
  // stat -> [[skill, first?]]
  BD.STAT_SKILLS = {};
  for (const s of GD.STATS) BD.STAT_SKILLS[s] = [];
  for (const k in GD.SKILL_STAT) {
    const [a, b] = GD.SKILL_STAT[k];
    if (BD.STAT_SKILLS[a]) BD.STAT_SKILLS[a].push([k, true]);
    if (b && b !== a && BD.STAT_SKILLS[b]) BD.STAT_SKILLS[b].push([k, false]);
  }
  BD.LABOUR = new Set(['peasant', 'serf', 'slave']);
  BD.raceMean = (p, s) => 42 + (((GD.RACES[p.race] || GD.RACES.human).mods || {})[s] || 0);
  BD.typ = (p, s) => BD.raceMean(p, s) * 0.78;
  BD.isPC = p => !!(p && A.S && p.id === A.S.pc);
  // a body's growth at this age, as a share of the grown body (the v2 curve the player's body grows by)
  BD.grow = function (p, age) {
    const R = GD.RACES[p.race] || GD.RACES.human;
    if (age >= (R.grown || 20)) return 1;
    if (A.V2S && A.V2S.grow) return A.V2S.grow(p, age);
    const m = Math.max(0, Math.min(1, age / (R.grown || 20)));
    return (0.08 + 0.62 * Math.pow(m, 1.1)) / 0.7;
  };

  // ---- the world's people clear their skills' baselines ---------------------------------------------------------------
  BD.floorRatio = function (p, s) {
    const sk = p.skills, L = BD.STAT_SKILLS[s];
    let best = 0;
    if (sk && L) for (let i = 0; i < L.length; i++) {
      const v = sk[L[i][0]];
      if (!(v >= BD.FREE_BELOW)) continue;
      const f = BD.baseline(v) * (L[i][1] ? 1 : BD.SECOND);
      if (f > best) best = f;
    }
    if (s === 'str' || s === 'sta') {
      if (p.mil && best < 1.1) best = 1.1;
      else if (BD.LABOUR.has(p.status) && best < 1.05 && A.age(p) >= ((GD.RACES[p.race] || GD.RACES.human).adult || 16)) best = 1.05;
    }
    return best;
  };
  A.statFloor = function (p, s) {
    if (!p || !p.st || !A.S || BD.isPC(p)) return 0;
    const f = BD.floorRatio(p, s);
    return f ? BD.typ(p, s) * BD.grow(p, A.age(p)) * f : 0;
  };

  // ---- held back: a skill works at the word its stats carry -----------------------------------------------------------
  BD.carry = function (p, k) {
    const ss = GD.SKILL_STAT[k];
    if (!ss || !p || !p.st) return Infinity;
    const r1 = A.stat(p, ss[0]) / BD.typ(p, ss[0]);
    const r2 = ss[1] && ss[1] !== ss[0] ? A.stat(p, ss[1]) / BD.typ(p, ss[1]) / BD.SECOND : Infinity;
    return BD.carries(Math.min(r1, r2));
  };
  A.skillCap = function (p, k) { return BD.carry(p, k); };

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
})();
