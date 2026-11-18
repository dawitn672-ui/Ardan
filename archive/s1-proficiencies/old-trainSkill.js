// Retired by S1b (D-072): the release's A.trainSkill, from src/core/release/core/03-engine-base.js (last built at b882573).
A.trainSkill = function (p, k, amt) {
  if (!GD.SKILLS[k]) return 0;
  if (p && A.S && p.id === A.S.pc) amt *= A._growMul;
  const cur = p.skills[k] || 0,
    int = A.stat(p, "int"),
    apt = (p.apt && p.apt[k]) || 1,
    learn = 1 + A.perkSum(p, "learn"),
    cap = apt < 0.6 ? 60 : apt < 0.8 ? 80 : 100,
    g =
      amt *
      apt *
      learn *
      (A.specMul ? A.specMul(p, k) : 1) *
      (0.6 + int / 120) *
      Math.max(apt >= 1.4 ? 0.1 : 0.05, Math.pow(Math.max(0, 1 - cur / (cap + 10)), 1.5)),
    before = cur;
  if (((p.skills[k] = A.clamp(cur + g, 0, cap)), p.id === (A.S && A.S.pc) && GD.PERKS[k]))
    for (const [lv, name, desc] of GD.PERKS[k])
      if (before < lv && p.skills[k] >= lv) A.log(`${GD.SKILLS[k]}: you unlock "${name}" — ${desc}.`, "big");
  if (g > 0 && A.S) {
    p.used = p.used || {};
    p.used[k] = A.S.year;
  }
  return g;
};

