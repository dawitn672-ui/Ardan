// The release's core, bonds and favours: Relationship labels, bonds, favours owed, superiors and obligations.
// Readable source of vendor/ardan-b593143.html with the patch layer baked in (X1, docs/DECISIONS.md D-028). Edit it here.
// Defines: A.REL_LABEL (+), A.BOND, A.bondTier, A.favorsOf, A.owesTo, A.addFavor, A.addOwe, A.standing,
// A.letterPower, A.useLetter, A.giveLetter, A.FAVORS, A.favorOptions, A.callFavor, A.INTERACT.help,
// A.INTERACT.swear, A.INT_FN.help, A.INT_FN.swear, A.superior, A.superiorTitle, A.makeSuperior, A.needsNewSuperior,
// A.bossMod, A.BOSS_ACTS, A.bossAct, A.obligationsYear, A.CHOICE_FN (+).

Object.assign(A.REL_LABEL, {
  superior: "Superior",
  subordinate: "Subordinate",
  sworn: "Sworn sibling",
  ward: "Ward",
  patron: "Patron",
  protege: "Protégé",
});

A.BOND = [
  [-80, "Nemesis", "red"],
  [-50, "Hated", "red"],
  [-20, "Dislike", "red"],
  [20, "Neutral", ""],
  [50, "Friendly", "green"],
  [75, "Close", "green"],
  [101, "Devoted", "gold"],
];

A.bondTier = function (pc, p) {
  const r = pc.rel[p.id];
  if (!r)
    return {
      name: "Stranger",
      cls: "",
      lvl: 0,
    };
  if (r.sworn)
    return {
      name: "Sworn",
      cls: "gold",
      lvl: 5,
    };
  const op = r.op || 0;
  for (let i = 0; i < A.BOND.length; i++)
    if (op < A.BOND[i][0] || i === A.BOND.length - 1)
      return {
        name: A.BOND[i][1],
        cls: A.BOND[i][2],
        lvl: i - 3,
      };
  return {
    name: "Neutral",
    cls: "",
    lvl: 0,
  };
};

A.favorsOf = (pc, pid) => (pc.favors && pc.favors[pid]) || 0;

A.owesTo = (pc, pid) => (pc.owes && pc.owes[pid]) || 0;

A.addFavor = function (pc, pid, n) {
  pc.favors = pc.favors || {};
  pc.favors[pid] = A.clamp((pc.favors[pid] || 0) + n, 0, 3);
  if (!pc.favors[pid]) delete pc.favors[pid];
};

A.addOwe = function (pc, pid, n) {
  pc.owes = pc.owes || {};
  pc.owes[pid] = A.clamp((pc.owes[pid] || 0) + n, 0, 3);
  if (!pc.owes[pid]) delete pc.owes[pid];
};

A.standing = function (p) {
  if (!p) return 0;
  let s = p.fame * 0.6;
  if (p.ruler) s += 60;
  if (p.noble) s += p.noble.rung * 6;
  if (["royal", "noble"].includes(p.status)) s += 15;
  if (p.milRank != null) s += p.milRank * 5;
  if (p.mil) s += p.mil.rank * 5;
  if (p.job) s += p.job.r * 7;
  if (p.flags && p.flags.mentorOf) s += 15;
  return Math.round(A.clamp(s, 5, 100));
};

A.letterPower = function (pc, kind) {
  const ls = (pc.letters || []).filter(l => !l.kind || l.kind === kind || l.kind === "any");
  return ls.length ? Math.max(...ls.map(l => l.power)) : 0;
};

A.useLetter = function (pc, kind) {
  const ls = (pc.letters || []).filter(l => !l.kind || l.kind === kind || l.kind === "any");
  if (!ls.length) return 0;
  const best = ls.sort((a, b) => b.power - a.power)[0];
  pc.letters = pc.letters.filter(l => l !== best);
  A.log(`You present ${best.from}'s letter of recommendation.`, "good");
  return best.power;
};

A.giveLetter = function (pc, from, kind) {
  pc.letters = pc.letters || [];
  const power = Math.round(A.standing(from) * (0.5 + A.clamp(A.opinion(from, pc), 0, 100) / 200)),
    L = {
      from: A.fullName(from, false),
      pid: from.id,
      power: A.clamp(power, 5, 60),
      kind: kind || "any",
      y: A.S.year,
    };
  pc.letters.push(L);
  if (pc.letters.length > 4) pc.letters.shift();
  return L;
};

A.FAVORS = {
  loan: {
    name: "Ask for a loan",
    desc: "They lend you money, no questions.",
  },
  letter: {
    name: "Ask for a letter of recommendation",
    desc: "A letter that helps you get a post, a school place or a promotion.",
  },
  introduce: {
    name: "Ask for an introduction",
    desc: "They introduce you to someone powerful they know.",
  },
  vouch: {
    name: "Ask them to speak for you",
    desc: "They put in a good word with your lord, your master or the crown.",
  },
  stand: {
    name: "Ask them to stand with you",
    desc: "They take your side in a quarrel: your worst enemy thinks twice.",
  },
};

A.favorOptions = function (pc, t) {
  const out = [];
  if (!t || !t.alive || !A.favorsOf(pc, t.id)) return out;
  const wealthy = ["merchant", "gentry", "noble", "royal"].includes(t.status) || (t.coin || 0) > 300;
  out.push("loan");
  if (A.standing(t) >= 20) out.push("letter");
  if (A.standing(t) >= 25) out.push("introduce");
  out.push("vouch");
  if (A.relsOf(pc, ["enemy", "rival"]).some(x => x.p.alive)) out.push("stand");
  return out.filter(k => k !== "loan" || wealthy || A.standing(t) >= 15);
};

A.callFavor = function (tid, k) {
  const pc = A.pc(),
    t = A.P(tid);
  if (!pc || !t || !t.alive || !A.favorsOf(pc, tid))
    return {
      ok: false,
      msg: "They owe you nothing.",
    };
  if (!A.favorOptions(pc, t).includes(k))
    return {
      ok: false,
      msg: "Not something they can do.",
    };
  A.addFavor(pc, tid, -1);
  let msg = "";
  switch (k) {
    case "loan": {
      const amt = Math.round(A.clamp(A.standing(t) * 12 + (["noble", "royal"].includes(t.status) ? 400 : 0), 30, 2500));
      pc.coin += amt;
      A.addOwe(pc, tid, 1);
      msg = `${t.given} lends you ${A.coin(amt)}. "Pay it back when you can." Now you owe ${A.him(t)} one.`;
      break;
    }
    case "letter": {
      const L = A.giveLetter(pc, t, "any");
      msg = `${t.given} writes you a letter of recommendation under ${A.his(t)} seal (weight ${L.power}). Use it when you apply for a post, a school or a promotion.`;
      break;
    }
    case "introduce": {
      const st = A.standing(t),
        who = st >= 50 ? A.genNoble(pc.realm, "noble", null, A.ri(35, 60)) : A.makeAcquaintance(pc, "acquaint");
      if (st < 50) {
        who.status = A.pick(["merchant", "gentry"]);
        who.fame = A.ri(20, 50);
        who.occ = A.pick([
          "a guild master",
          "a wealthy merchant",
          "a captain of the guard",
          "a magistrate",
          "a master of the academy",
        ]);
      } else who.occ = "a lord of the realm";
      who.fame = Math.max(who.fame || 0, 30);
      A.link(pc, who, st >= 50 ? "patron" : "acquaint", 30, st >= 50 ? "protege" : "acquaint");
      msg = `${t.given} brings you to dinner with ${A.fullName(who)}, ${who.occ}. By the cheese you are on first names.`;
      break;
    }
    case "vouch": {
      const r = A.realm(pc.realm),
        ru = r ? A.P(r.ruler) : null,
        boss = A.superior(pc),
        w = Math.round(A.standing(t) / 6) + 3;
      if (boss && boss.id !== t.id) {
        if (!pc.rel[boss.id]) A.link(pc, boss, "superior", 0, "subordinate");
        A.addOp(boss, pc, w);
        msg = `${t.given} speaks to ${A.fullName(boss, false)} on your behalf. Your superior looks at you differently (+${w}).`;
      } else {
        if (ru && ru.id !== pc.id && A.standing(t) >= 40) {
          if (!pc.rel[ru.id]) A.link(pc, ru, "lord", 0, "acquaint");
          A.addOp(ru, pc, w);
          msg = `${t.given} mentions your name at court. The crown remembers it (+${w}).`;
        } else {
          A.fame(pc, 2);
          if (pc.job) pc.job.rep = Math.min(100, (pc.job.rep || 0) + 4);
          msg = `${t.given} tells everyone who will listen that you are worth knowing.`;
        }
      }
      break;
    }
    case "stand": {
      const e = A.relsOf(pc, ["enemy", "rival"])
        .filter(x => x.p.alive)
        .sort((a, b) => a.r.op - b.r.op)[0];
      if (e) {
        A.addOp(e.p, pc, 20);
        msg = `${t.given} lets ${e.p.given} know that a quarrel with you is a quarrel with ${A.him(t)}. ${e.p.given} backs off.`;
      }
      break;
    }
  }
  A.addOp(t, pc, -3);
  A.log(msg, "good");
  return {
    ok: true,
    msg,
  };
};

A.INTERACT.help = {
  name: "Help with their troubles",
  cost: 1,
};

A.INTERACT.swear = {
  name: "Swear brotherhood",
  cost: 0,
};

A.INT_FN.help = function (pc, t, r) {
  const needs = [
      ["a debt collector at the door", "intimidation", "persuasion"],
      ["a sick child", "medicine", "learning"],
      ["a roof that fell in", "craft", "athletics"],
      ["a lawsuit over a field", "learning", "persuasion"],
      ["a bully in the market", "melee", "intimidation"],
      ["a letter that must be written just so", "learning", "etiquette"],
      ["a lost horse", "tracking", "riding"],
      ["a jealous guild", "trade", "intrigue"],
      ["a feud with a neighbor", "diplomacy", "persuasion"],
    ],
    [what, s1, s2] = A.pick(needs),
    v = A.skill(pc, s1) * 0.6 + A.skill(pc, s2) * 0.4 + A.stat(pc, "wil") * 0.15,
    ok = A.chance(A.clamp(0.35 + (v - 25) / 80, 0.15, 0.92));
  A.trainSkill(pc, s1, 2);
  return ok
    ? (A.addOp(pc, t, A.ri(6, 12)),
      A.addFavor(pc, t.id, 1),
      {
        msg: `You help ${t.given} with ${what}. It works. "I owe you," ${A.he(t)} says, and means it. (favor owed)`,
        cls: "good",
      })
    : (A.addOp(pc, t, 2),
      {
        msg: `You try to help ${t.given} with ${what}. It does not work, but ${A.he(t)} saw you try.`,
      });
};

A.INT_FN.swear = function (pc, t, r) {
  return (r.op || 0) < 75 || A.opinion(t, pc) < 70
    ? {
        ok: false,
        msg: `${t.given} is not that close to you yet.`,
      }
    : ((r.sworn = true),
      t.rel[pc.id] && (t.rel[pc.id].sworn = true),
      A.addOp(pc, t, 10),
      A.addFavor(pc, t.id, 1),
      pc.deeds.push({
        y: A.S.year,
        t: `Swore brotherhood with ${A.fullName(t)}`,
      }),
      {
        msg: `You cut your palms and clasp hands with ${t.given}. Sworn: ${A.his(t)} enemies are yours, yours are ${A.his(t)}.`,
        cls: "good",
      });
};

A.superior = function (pc) {
  if (!pc) return null;
  if (pc.mil && !pc.mil.merc && pc.mil.rank < 9) {
    const b = A.P(pc.mil.cmdr);
    return b && b.alive ? b : null;
  }
  if (pc.mil && pc.mil.merc && pc.mil.rank < 7) {
    const b = A.P(pc.mil.cmdr);
    return b && b.alive ? b : null;
  }
  if (pc.job && !pc.job.own) {
    const b = A.P(pc.job.boss);
    return b && b.alive ? b : null;
  }
  return null;
};

A.superiorTitle = function (pc) {
  const b = A.superior(pc);
  if (!b) return "";
  if (pc.mil) return GD.MIL[b.milRank] ? GD.MIL[b.milRank].title : "Commander";
  if (pc.job) {
    const C = GD.CAREERS[pc.job.c];
    return b.bossRank != null && C.ranks[b.bossRank] ? C.ranks[b.bossRank][0] : "Master";
  }
  return "";
};

A.makeSuperior = function (pc) {
  // [A2 posts] above a General stands a real person: the Marshal while the seat is held, else the crown. Before, a
  // "Marshal of <realm>" was made up for every High General, a second Marshal beside the seated one.
  if (A.POSTS && pc.mil && !pc.mil.merc && pc.mil.rank >= 7) {
    const r = A.realm(pc.mil.realm),
      m = r && A.P(A.POSTS.holder(A.POSTS.seatKey(r.id, "marshal"))),
      b = m && m.alive && m.id !== pc.id ? m : r && A.P(r.ruler);
    if (b && b.alive && b.id !== pc.id) {
      pc.mil.cmdr = b.id;
      if (!pc.rel[b.id]) A.link(pc, b, "superior", 10, "subordinate");
      return b;
    }
  }
  const was = A.superior(pc),
    old = A.P((pc.mil && pc.mil.cmdr) || (pc.job && pc.job.boss)),
    b = A.makeAcquaintance(pc, "acquaint"),
    R2 = GD.RACES[b.race];
  if (
    ((b.born = Math.min(b.born, A.S.year - Math.round(R2.adult * (1.6 + A.rand() * 0.8)))),
    (b.flags.superior = true),
    pc.mil)
  ) {
    const rk = Math.min(9, pc.mil.rank + (pc.mil.rank < 3 ? 1 : pc.mil.rank < 6 ? 2 : 1));
    b.milRank = rk;
    b.status = rk >= 6 ? A.pick(["gentry", "noble"]) : rk >= 4 ? A.pick(["gentry", "artisan", "peasant"]) : b.status;
    b.skills.command = A.ri(20 + rk * 6, 40 + rk * 7);
    b.skills.tactics = A.ri(15 + rk * 5, 35 + rk * 6);
    b.skills.melee = A.ri(30, 70);
    b.occ = `${GD.MIL[rk].title}${pc.mil.merc ? " of " + (pc.mil.company || "the company") : " of " + A.realmShort(pc.mil.realm)}`;
    pc.mil.cmdr = b.id;
  } else if (pc.job) {
    const C = GD.CAREERS[pc.job.c],
      rk = Math.min(C.ranks.length - 1, pc.job.r + 1 + (pc.job.r === 0 && C.ranks.length > 3 ? 1 : 0));
    b.bossRank = rk;
    b.occ = C.ranks[rk][0].replace(/^./, c => c.toLowerCase());
    if (C.skill) b.skills[C.skill] = A.ri(45, 80);
    b.job = {
      c: pc.job.c,
      r: rk,
      y: 10,
      perf: 60,
      rep: A.ri(40, 85),
    };
    pc.job.boss = b.id;
  }
  A.link(pc, b, "superior", A.ri(0, 20), "subordinate");
  if (old && old.alive && pc.rel[old.id] && pc.rel[old.id].type === "superior") {
    pc.rel[old.id].type = pc.rel[old.id].op >= 40 ? "friend" : "acquaint";
    if (old.rel[pc.id]) old.rel[pc.id].type = pc.rel[old.id].type;
  }
  if (was && was.id !== b.id && pc.rel[was.id] && Math.abs(pc.rel[was.id].op) < 30) {
    delete pc.rel[was.id];
    if (was.rel[pc.id]) delete was.rel[pc.id];
  }
  return b;
};

A.needsNewSuperior = function (pc) {
  if (pc.mil) {
    const b = A.P(pc.mil.cmdr);
    // [A2 posts] a General's superior is whoever holds the Marshal's seat now, else the crown
    if (A.POSTS && !pc.mil.merc && pc.mil.rank >= 7 && pc.mil.rank < 9) {
      const r = A.realm(pc.mil.realm),
        m = r && A.POSTS.holder(A.POSTS.seatKey(r.id, "marshal"));
      return !b || !b.alive || b.id !== (m && m !== pc.id ? m : r && r.ruler);
    }
    return pc.mil.rank >= 9 || (pc.mil.merc && pc.mil.rank >= 7)
      ? false
      : !b || !b.alive || (b.milRank != null && b.milRank <= pc.mil.rank);
  }
  if (pc.job && !pc.job.own) {
    const C = GD.CAREERS[pc.job.c];
    if (pc.job.r >= C.ranks.length - 1) return false;
    const b = A.P(pc.job.boss);
    return !b || !b.alive || (b.bossRank != null && b.bossRank <= pc.job.r) || (b.job && b.job.c !== pc.job.c);
  }
  return false;
};

A.bossMod = function (pc) {
  const b = A.superior(pc);
  return b ? A.clamp(A.opinion(b, pc), -60, 80) / 400 : 0;
};

A.BOSS_ACTS = {
  report: {
    name: "Do your duty under their eye",
    cost: 1,
    desc: "Work where your superior can see it. Raises their opinion.",
  },
  letter: {
    name: "Ask for a recommendation",
    cost: 0,
    desc: "Opinion 50+: a letter from them, once every 3 years.",
  },
  promo: {
    name: "Ask for advancement",
    cost: 0,
    desc: "Ask them to push for your promotion. Needs their good opinion and your good record.",
  },
  gift: {
    name: "Bring a gift",
    cost: 0,
    desc: "Coin smooths many things (costs about a month of their pay).",
  },
};

A.bossAct = function (k) {
  const pc = A.pc(),
    b = A.superior(pc);
  if (!b)
    return {
      ok: false,
      msg: "You answer to no one.",
    };
  const A_ = A.BOSS_ACTS[k];
  if (!A_)
    return {
      ok: false,
    };
  if (A.S.yearActs["boss_" + k])
    return {
      ok: false,
      msg: "Once a year.",
    };
  if (A_.cost && A.S.time < A_.cost)
    return {
      ok: false,
      msg: "Not enough initiative (⧗) yet.",
    };
  if (!pc.rel[b.id]) A.link(pc, b, "superior", 0, "subordinate");
  const op = A.opinion(b, pc),
    nm = b.given;
  switch (k) {
    case "report": {
      A.S.yearActs["boss_" + k] = 1;
      A.S.time -= 1;
      const sk = pc.mil ? "command" : GD.CAREERS[pc.job.c].skill || "learning",
        ok = A.chance(A.clamp(0.4 + (A.skill(pc, sk) - 30) / 90 + (A.has(pc, "diligent") ? 0.15 : 0), 0.15, 0.9));
      A.trainSkill(pc, sk, 2);
      return ok
        ? (A.addOp(b, pc, A.ri(6, 12)),
          pc.mil ? (pc.mil.merit += 4) : (pc.job.perf = Math.min(100, pc.job.perf + 5)),
          {
            ok: true,
            msg: `${nm} sees you at your best. A nod. From ${A.him(b)}, that is a speech.`,
          })
        : (A.addOp(b, pc, -2),
          {
            ok: true,
            msg: `${nm} happens to see the one thing you got wrong all year.`,
          });
    }
    case "letter": {
      if (op < 50)
        return {
          ok: false,
          msg: `${nm} does not think well enough of you yet (opinion ${Math.round(op)}/50).`,
        };
      if (pc.flags.bossLetter && A.S.year - pc.flags.bossLetter < 3)
        return {
          ok: false,
          msg: "You asked recently.",
        };
      A.S.yearActs["boss_" + k] = 1;
      pc.flags.bossLetter = A.S.year;
      const L = A.giveLetter(pc, b, "any");
      A.log(`${nm} writes you a letter of recommendation (weight ${L.power}).`, "good");
      return {
        ok: true,
        msg: "A letter under seal.",
      };
    }
    case "promo": {
      if (((A.S.yearActs["boss_" + k] = 1), pc.mil)) {
        const next = GD.MIL[pc.mil.rank + 1];
        if (!next)
          return {
            ok: false,
            msg: "There is no higher rung.",
          };
        const ready = pc.mil.merit / next.merit,
          ch2 = A.clamp((op - 20) / 120 + (ready - 0.75) * 1.4, 0.02, 0.8);
        if (ready >= 0.75 && A.chance(ch2)) {
          const r0 = pc.mil.rank;
          pc.mil.merit = Math.max(pc.mil.merit, next.merit);
          pc.flags.bossPush = A.S.year;
          A.promoCheck(pc);
          return {
            ok: true,
            msg:
              pc.mil.rank > r0
                ? `${nm} puts your name forward — and it sticks.`
                : `${nm} puts your name forward. The high command wants more (check your Command skill).`,
          };
        }
        if (op < 30) A.addOp(b, pc, -4);
        // [X1 baked patch people/99999-v2-renown RN-WORDS] Merit was shown as a counter ("Merit 112 / 30") in the year's
        // summary and explained as a bar to meet; it no longer decides promotion. In the source: say where you stand for
        // the next rank in words, and say how the board decides.
        return {
          ok: true,
          msg:
            ready < 0.75
              ? `"Not yet. Earn it."${A.RN && A.RN.on ? "" : ` (merit ${Math.round(pc.mil.merit)}/${next.merit})`}`
              : `${nm} says ${A.he(b)} will think about it.`,
        };
      }
      const C = GD.CAREERS[pc.job.c];
      if (!C.ranks[pc.job.r + 1])
        return {
          ok: false,
          msg: "There is no higher rank.",
        };
      const ch = A.clamp((op - 20) / 140 + (pc.job.perf - 55) / 120 + ((pc.job.rep || 0) - 40) / 200, 0.02, 0.7);
      return A.chance(ch)
        ? (pc.job.r++,
          A.log(`${nm} speaks for you. You are made ${C.ranks[pc.job.r][0]}!`, "big"),
          {
            ok: true,
          })
        : (op < 30 && A.addOp(b, pc, -4),
          {
            ok: true,
            msg: `${nm}: "When you are ready, I will know it before you do."`,
          });
    }
    case "gift": {
      const c = Math.max(
        5,
        Math.round(
          pc.mil ? 5 + (b.milRank || 1) * 6 : (GD.CAREERS[pc.job.c].ranks[b.bossRank || 1] || [0, 0, 30])[2] / 12,
        ),
      );
      if (pc.coin < c)
        return {
          ok: false,
          msg: `A fitting gift costs ${A.coin(c)}.`,
        };
      A.S.yearActs["boss_" + k] = 1;
      pc.coin -= c;
      const greedy = A.has(b, "greedy"),
        d = A.has(b, "honest") || A.has(b, "just") ? -A.ri(2, 6) : A.ri(4, 9) + (greedy ? 6 : 0);
      A.addOp(b, pc, d);
      return {
        ok: true,
        msg:
          d > 0
            ? `${nm} takes the gift ${greedy ? "quickly" : "graciously"}.`
            : `${nm} hands it back. "I am not for sale." That cost you.`,
      };
    }
  }
  return {
    ok: false,
  };
};

A.obligationsYear = function (pc) {
  if (A.needsNewSuperior(pc)) {
    const had = !!A.P((pc.mil && pc.mil.cmdr) || (pc.job && pc.job.boss)),
      b2 = A.makeSuperior(pc);
    // [A2 posts] the superior may be the Marshal or the crown: name the post he holds
    if (had || A.isAdult(pc)) A.log(`You now answer to ${A.fullName(b2)}, ${(A.POSTS && A.POSTS.title(b2)) || A.mainRole(b2) || b2.occ}.`, "");
  }
  const b = A.superior(pc);
  if (b) {
    const op = A.opinion(b, pc);
    if (pc.mil) {
      if (op >= 50) pc.mil.merit += 3;
      else {
        if (op <= -25) pc.mil.merit = Math.max(0, pc.mil.merit - 4);
      }
    } else {
      if (pc.job) {
        if (op >= 50) {
          pc.job.perf = Math.min(100, pc.job.perf + 3);
          pc.job.rep = Math.min(100, (pc.job.rep || 0) + 1);
        } else {
          if (op <= -25) pc.job.perf = Math.max(0, pc.job.perf - 4);
        }
      }
    }
    const perf = pc.mil ? 55 + Math.min(30, (pc.mil.battles || 0) * 2) : pc.job.perf;
    if ((A.addOp(b, pc, (perf - 55) / 12 + A.ri(-2, 2)), A.chance(0.18))) {
      const evs = ["bd_boss_test", "bd_boss_favor", "bd_boss_blame", "bd_boss_rival"].filter(
        e => A.EV[e] && (!A.EV[e].cond || A.EV[e].cond(pc, A.C)),
      );
      // [X1 baked patch events/97-first-life-fixes LF-BOSS-PICK] A.obligationsYear picked one of four superior scenes
      // (bd_boss_test/favor/blame/rival) with A.pick, blind to what the life had seen, so "A rival for favor" came eight
      // times in a working life. It now picks by the life memory's weights (A.lfPick: twice a life, ten years apart);
      // when all four are held back the slot goes to a fresh scene.
      {
        // [X1 baked patch events/97-first-life-fixes LF-BOSS-PICK] A.obligationsYear picked one of four superior scenes
        // (bd_boss_test/favor/blame/rival) with A.pick, blind to what the life had seen, so "A rival for favor" came eight
        // times in a working life. It now picks by the life memory's weights (A.lfPick: twice a life, ten years apart);
        // when all four are held back the slot goes to a fresh scene.
        const ev0 = evs.length ? (A.lfPick ? A.lfPick(evs, pc) : A.pick(evs)) : null;
        if (ev0)
          A.queue({
            type: "event",
            ev: ev0,
            ctx: {
              pid: b.id,
            },
          });
      }
    }
    if (pc.mil && A.atWar(pc.mil.realm).length && A.chance(0.05)) {
      A.kill(b, "a battle wound");
      A.log(`${A.fullName(b, false)}, your commander, dies of a wound taken in the fighting.`, "warn");
    }
  }
  for (const x of A.relsOf(pc).filter(x2 => x2.r.sworn && x2.p.alive)) {
    if (x.r.op < 50) A.addOp(pc, x.p, 5);
    if (A.chance(0.12)) A.addFavor(pc, x.p.id, 1);
  }
  for (const pid in pc.owes || {}) {
    const t = A.P(pid);
    if (!t || !t.alive) {
      delete pc.owes[pid];
      continue;
    }
    if (A.chance(0.22)) {
      const asks = [
          ["lend", `${t.given} needs money: ${A.coin(Math.max(10, Math.round(Math.min(pc.coin * 0.15, 300))))}.`],
          ["side", `${t.given} is in a quarrel and wants you at ${A.his(t)} side in front of everyone.`],
          ["work", `${t.given} needs your hands for a season.`],
          ["hide", `${t.given} needs somewhere to hide a cousin for a month. Do not ask why.`],
        ],
        [kind, txt] = A.pick(asks);
      A.queue({
        type: "choice",
        title: "A favor called in",
        text: `You owe ${A.fullName(t)} a favor. ${txt}`,
        options: [
          {
            t: "Pay the debt",
            fn: "owePay",
            arg: {
              pid,
              kind,
            },
          },
          {
            t: "Refuse (they will not forget)",
            fn: "oweRefuse",
            arg: {
              pid,
            },
          },
        ],
      });
      break;
    }
  }
  const foes = A.relsOf(pc, ["enemy", "rival"]).filter(x => x.p.alive && x.r.op <= -55);
  if (foes.length && A.chance(0.1)) {
    const f = A.pick(foes),
      evs = ["bd_enemy_strikes", "bd_rival_scheme"].filter(e => A.EV[e]);
    if (evs.length)
      A.queue({
        type: "event",
        ev: A.pick(evs),
        ctx: {
          pid: f.p.id,
        },
      });
  }
};

Object.assign(A.CHOICE_FN, {
  owePay(o) {
    const pc = A.pc(),
      t = A.P(o.pid);
    if (t)
      if ((A.addOwe(pc, o.pid, -1), A.addOp(t, pc, 10), (pc.honor = Math.min(100, pc.honor + 2)), o.kind === "lend")) {
        const c = Math.max(10, Math.round(Math.min(pc.coin * 0.15, 300)));
        pc.coin = Math.max(0, pc.coin - c);
        A.log(`You pay what you owe ${t.given}: ${A.coin(c)}. Square.`);
      } else if (o.kind === "work") {
        A.S.time = Math.max(0, A.S.time - 1);
        A.log(`You give ${t.given} a season of work. Square.`);
      } else if (o.kind === "hide") {
        if (A.chance(0.15)) {
          A.log(`The cousin was wanted. The watch finds out you hid ${A.him(t)}.`, "bad");
          A.addOp(pc, t, 5);
          A.fame(pc, -2);
          pc.honor = Math.max(0, pc.honor - 4);
        } else A.log(`A quiet month with a stranger in the loft. Then gone. Square with ${t.given}.`);
      } else {
        const e = A.relsOf(t, ["enemy", "rival"])
          .map(x => x.p)
          .find(x => x.alive);
        A.log(
          `You stand with ${t.given} in front of everyone.${e ? " " + e.given + " will remember your face." : ""} Square.`,
        );
      }
  },
  oweRefuse(o) {
    const pc = A.pc(),
      t = A.P(o.pid);
    if (t) {
      A.addOwe(pc, o.pid, -1);
      A.addOp(t, pc, -30);
      pc.honor = Math.max(0, pc.honor - 5);
      if (pc.rel[o.pid] && pc.rel[o.pid].op < -20 && A.chance(0.4)) {
        pc.rel[o.pid].type = "enemy";
        if (t.rel[pc.id]) t.rel[pc.id].type = "enemy";
      }
      A.log(`You refuse ${t.given}. ${A.cap(A.he(t))} tells people what you are.`, "bad");
    }
  },
});
