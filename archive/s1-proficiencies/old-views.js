// Retired by S1b (D-072): the proficiency lists from src/core/release/core/23-ui-b.js (last built at the commit before S1b stage 5).
UI.profBlock = function (p, opts = {}) {
  let h = '<div class="profs">';
  for (const [cat, ks] of Object.entries(GD.SKILL_CATS)) {
    const rows = ks
      .map(k => [k, A.skill(p, k)])
      .filter(([k, v]) => opts.all || v >= 1 || (p.apt && p.apt[k] && p.apt[k] !== 1));
    if (rows.length) {
      h += `<div class="pcat group-h">${cat}</div>`;
      for (const [k, v] of rows.sort((a, b) => b[1] - a[1])) {
        const apt = p.apt && p.apt[k],
          an = apt ? GD.aptName(apt) : "",
          perks = A.perksOf(p, k);
        h += `<div class="prow" title="${UI.esc(GD.SKILL_DESC[k] || "")}"><span>${UI.esc(GD.SKILLS[k])} ${an ? `<span class="apt ${apt < 1 ? "bad" : ""}">${apt >= 1 ? "★" : "▽"} ${an}</span>` : ""}</span><b>${v}</b><span class="tier">${GD.profTier(v)}</span><div class="bar"><i style="width:${v}%"></i></div></div>`;
        if (perks.length && !opts.compact)
          h += `<div>${perks.map(x => `<span class="perk" title="${UI.esc(x[2])}">${UI.esc(x[1])}</span>`).join("")}</div>`;
      }
    }
  }
  return h + "</div>";
};

UI.topProfs = function (p, n = 5) {
  const rows = Object.keys(p.skills || {})
    .map(k => [k, A.skill(p, k)])
    .filter(x => x[1] >= 1 && GD.SKILLS[x[0]])
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
  return rows.length
    ? '<div class="profs">' +
        rows
          .map(([k, v]) => {
            const apt = p.apt && p.apt[k];
            return `<div class="prow" title="${UI.esc(GD.SKILL_DESC[k] || "")}"><span>${UI.esc(GD.SKILLS[k])}${apt >= 1.2 ? ' <span class="apt">★</span>' : ""}</span><b>${v}</b><span class="tier">${GD.profTier(v)}</span><div class="bar"><i style="width:${v}%"></i></div></div>`;
          })
          .join("") +
        "</div>"
    : '<div class="tiny muted">No proficiencies yet. Practice something.</div>';
};


// and A.ACT.practice from src/core/release/core/04-realms-and-war-years-b.js
  practice(pc, arg, d) {
    const k = arg && GD.SKILLS[arg] ? arg : A.weaponSkillOf(pc),
      trait = pc.traits.reduce((m, t) => m * ((GD.TRAITS[t] && GD.TRAITS[t].train) || 1), 1),
      before = A.skill(pc, k),
      g = A.trainSkill(pc, k, 5.5 * d * trait),
      [s1, s2] = GD.SKILL_STAT[k] || ["int", "wil"];
    A.train(pc, s1, 0.6 * d);
    A.train(pc, s2, 0.4 * d);
    const how = A.pick(GD.SKILL_PRACTICE[k] || ["long hours of practice"]),
      tier = GD.profTier(A.skill(pc, k)),
      apt = pc.apt && pc.apt[k] ? GD.aptName(pc.apt[k]) : "";
    return GD.SKILL_CAT_OF[k] === "Martial" && A.chance(0.05)
      ? ((pc.health -= 6),
        {
          msg: `${A.cap(how)}. You pull something in your shoulder. (+${A.round(g, 1)} ${GD.SKILLS[k]}, now ${tier})`,
        })
      : {
          msg: `${A.cap(how)}.${apt === "Prodigy" || apt === "Gifted" ? " It comes to you easily." : apt === "Hopeless" || apt === "Clumsy" ? " It does not come easily." : ""} (+${A.round(g, 1)} ${GD.SKILLS[k]}: ${before} → ${A.skill(pc, k)}, ${tier})`,
        };
  },

// and the ladders of words from src/core/release/core/02-game-data-a.js
GD.PROF_TIERS = [
  [0, "Untrained"],
  [15, "Novice"],
  [35, "Trained"],
  [55, "Skilled"],
  [70, "Expert"],
  [85, "Master"],
  [96, "Legendary"],
];

GD.profTier = v => {
  let t = GD.PROF_TIERS[0][1];
  for (const [m, n] of GD.PROF_TIERS) if (v >= m) t = n;
  return t;
};

GD.APT_LEVELS = [
  [1.8, "Prodigy"],
  [1.45, "Gifted"],
  [1.2, "Apt"],
  [1, ""],
  [0.7, "Clumsy"],
  [0.5, "Hopeless"],
];

GD.aptName = v => {
  if (!v || v === 1) return "";
  for (const [m, n] of GD.APT_LEVELS) if (v >= m) return n;
  return "Hopeless";
};

