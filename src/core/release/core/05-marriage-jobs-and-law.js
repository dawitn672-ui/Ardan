// The release's core, marriage jobs and law: Charm, marriage, jobs, the law and punishment.
// Readable source of vendor/ardan-b593143.html with the patch layer baked in (X1, docs/DECISIONS.md D-027). Edit it here.
// Defines: A.charm, A.INT_FN, A.weddingRite, A.marry, A.jobOptions, A.applyJob, A.quitJob, A.workHard, A.crime,
// A.LAW, A.lawOf, A.rulerScandal, A.punish, punishNow.

A.charm = pc =>
  A.stat(pc, "int") * 0.3 +
  pc.looks * 0.35 +
  A.skill(pc, "diplomacy") * 0.4 +
  (A.has(pc, "gregarious") ? 8 : 0) -
  (A.has(pc, "shy") ? 6 : 0) -
  (A.has(pc, "stutter") ? 5 : 0);

A.INT_FN = {
  time(pc, t, r) {
    const d = A.ri(3, 9);
    A.addOp(pc, t, d);
    pc.happy = A.clamp(pc.happy + 2, 0, 100);
    return {
      msg: `You spend the day with ${t.given}. ${A.pick(["You walk the river path.", "You share a jug and old stories.", "You mend nets together and talk of nothing.", "You watch the sun go down over the fields.", "You go to the market and laugh at the jugglers."])}`,
    };
  },
  talk(pc, t, r) {
    const d = A.ri(1, 7);
    A.addOp(pc, t, d);
    let extra = "";
    if (t.wants && A.chance(0.6))
      extra = ` ${A.cap(A.he(t))} confides what ${A.he(t)} wants most: ${t.wants.charAt(0).toLowerCase() + t.wants.slice(1)}`;
    else {
      if (t.manner && A.chance(0.5)) extra = ` ${t.manner}`;
      else
        extra =
          " " +
          A.pick([
            `${A.cap(A.he(t))} talks about ${A.pick(["the price of bread", "the war", "a strange dream", "the old days", "the gods", "the harvest", "a feud with a neighbor", "what the priests get wrong"])}.`,
            `You learn ${A.he(t)} is afraid of ${A.pick(["deep water", "growing old", "the dark", "being forgotten", "fire", "the next winter"])}.`,
          ]);
    }
    return {
      msg: `A long talk with ${t.given}.${extra}`,
    };
  },
  compliment(pc, t, r) {
    const ok = A.chance(0.7);
    A.addOp(pc, t, ok ? A.ri(2, 6) : -2);
    return {
      msg: ok ? `${t.given} smiles at the compliment.` : `${t.given} looks at you like you want something.`,
    };
  },
  gift(pc, t, r, amt) {
    const n = Number(amt),
      v = Math.max(1, Math.round(Number.isFinite(n) && n > 0 ? n : Math.min(pc.coin, Math.max(2, pc.coin * 0.05))));
    return pc.coin < v
      ? {
          ok: false,
          msg: "You cannot afford it.",
        }
      : ((pc.coin -= v),
        A.addOp(pc, t, Math.min(25, 3 + Math.round(Math.log2(1 + v) * 3))),
        (t.coin = (t.coin || 0) + v),
        {
          msg: `You give ${t.given} a gift worth ${A.coin(v)}.`,
        });
  },
  askmoney(pc, t, r) {
    const fam = ["mother", "father", "grandparent"].includes(r.type),
      pool = fam && A.S.family ? A.S.family.wealth : t.coin || 10,
      chance = 0.25 + r.op / 200 + (fam ? 0.15 : 0);
    if (A.chance(chance) && pool > 1) {
      const v = Math.max(1, Math.round(pool * A.rf(0.02, 0.08)));
      if (fam && A.S.family) A.S.family.wealth -= v;
      else t.coin = Math.max(0, (t.coin || 0) - v);
      pc.coin += v;
      A.addOp(pc, t, -2);
      return {
        msg: `${t.given} gives you ${A.coin(v)}.`,
        cls: "good",
      };
    }
    A.addOp(pc, t, -5);
    return {
      msg: `${t.given} refuses. "Money doesn't grow in the furrows."`,
    };
  },
  advice(pc, t, r) {
    const tips = [
        ["int", "Think before you speak; then speak less."],
        ["wil", "The gods give strength to those who stand back up."],
        ["ins", "Watch the shoulders, not the blade."],
        ["sta", "Pace yourself. The race is long."],
      ],
      [s, tip] = A.pick(tips);
    if ((A.train(pc, s, 0.6), A.addOp(pc, t, 2), t.castId && LORE.cast[t.castId])) {
      const c = LORE.cast[t.castId];
      return {
        msg: `${t.given} says: "${tip}" (${c.manner ? c.manner : ""})`,
      };
    }
    return {
      msg: `${t.given}'s advice: "${tip}"`,
    };
  },
  train(pc, t, r) {
    const k = A.weaponSkillOf(pc),
      better = (t.skills[k] || 0) > (pc.skills[k] || 0);
    A.trainSkill(pc, k, better ? 5 : 3);
    A.train(pc, "sta", 0.5);
    A.addOp(pc, t, 3);
    return {
      msg: `You train ${GD.SKILLS[k].toLowerCase()} with ${t.given}.${better ? " You learn a few tricks." : ""}`,
    };
  },
  spar(pc, t, r) {
    A.startDuel(pc, t, {
      kind: "spar",
      place: "the yard",
      lethal: false,
    });
    return {
      msg: `You spar with ${t.given}.`,
    };
  },
  insult(pc, t, r) {
    A.addOp(pc, t, -A.ri(10, 22));
    if (A.chance(0.25 + (A.has(t, "wrathful") ? 0.3 : 0)) && A.isAdult(t) && A.isAdult(pc))
      A.queue({
        type: "event",
        ev: "insult_fight",
        ctx: {
          pid: t.id,
        },
      });
    if (r.op < -40 && r.type === "acquaint") r.type = "rival";
    return {
      msg: `You insult ${t.given}. ${A.pick(["Their face goes white.", "People laugh. Not with them.", `"You'll regret that."`, "They spit at your feet."])}`,
    };
  },
  argue(pc, t, r) {
    A.addOp(pc, t, -A.ri(6, 16));
    pc.happy = A.clamp(pc.happy - 2, 0, 100);
    if (r.op < -40 && !["mother", "father", "sibling", "child", "spouse"].includes(r.type)) r.type = "rival";
    return {
      msg: `You argue with ${t.given} about ${A.pick(["money", "the past", "honor", "religion", "the war", "nothing at all, really", "family"])}.`,
    };
  },
  flirt(pc, t, r) {
    const ok = A.chance(A.clamp(0.25 + A.charm(pc) / 200 + r.op / 300 - (t.spouse ? 0.25 : 0), 0.05, 0.9));
    A.addOp(pc, t, ok ? A.ri(3, 9) : -A.ri(2, 8));
    return ok && r.op > 45 && !["spouse", "lover", "betrothed"].includes(r.type) && A.chance(0.4)
      ? ((r.type = "lover"),
        t.rel[pc.id] && (t.rel[pc.id].type = "lover"),
        {
          msg: `${t.given} flirts back... and then some. You are lovers now.`,
          cls: "good",
        })
      : {
          msg: ok ? `${t.given} blushes and laughs.` : `${t.given} rolls ${A.his(t)} eyes.`,
        };
  },
  date(pc, t, r) {
    const ok = A.chance(A.clamp(0.3 + A.charm(pc) / 180 + r.op / 200, 0.05, 0.92));
    A.addOp(pc, t, ok ? A.ri(6, 14) : -A.ri(4, 10));
    return ok && r.op > 30
      ? ((r.type = "lover"),
        t.rel[pc.id] && (t.rel[pc.id].type = "lover"),
        (pc.happy = A.clamp(pc.happy + 8, 0, 100)),
        {
          msg: `You court ${t.given}: ${A.pick(["a walk by the river", "a dance at the fair", "a gift of ribbons", "a poem, badly recited", "a ride in the hills"])}. ${A.cap(A.he(t))} says yes. You are lovers.`,
          cls: "good",
        })
      : {
          msg: ok ? `It goes well with ${t.given}. Not there yet.` : `${t.given} is not interested.`,
        };
  },
  propose(pc, t, r) {
    if (pc.spouse && A.P(pc.spouse) && A.P(pc.spouse).alive)
      return {
        ok: false,
        msg: "You are already married.",
      };
    if (t.spouse && A.P(t.spouse) && A.P(t.spouse).alive)
      return {
        ok: false,
        msg: `${t.given} is married.`,
      };
    const statusGap =
      (GD.STATUS[pc.status] ? GD.STATUS[pc.status].rank : 2) - (GD.STATUS[t.status] ? GD.STATUS[t.status].rank : 2);
    return A.chance(A.clamp(0.25 + r.op / 120 + statusGap * 0.05, 0.05, 0.95))
      ? (A.marry(pc, t),
        {
          msg: `${t.given} says yes! You are married ${A.weddingRite(pc)}.`,
          cls: "big",
        })
      : (A.addOp(pc, t, -10),
        (pc.happy = A.clamp(pc.happy - 10, 0, 100)),
        {
          msg: `${t.given} says no. It stings.`,
          cls: "bad",
        });
  },
  child(pc, t) {
    pc.flags.tryChild = A.S.year;
    delete pc.flags.noChildren;
    return {
      msg: `You and ${t.given} hope for a child this year.`,
    };
  },
  nochild(pc, t) {
    pc.flags.noChildren = true;
    return {
      msg: `You and ${t.given} agree: no more children for now. (Herbs, care and luck.)`,
    };
  },
  breakup(pc, t, r) {
    r.type = "ex";
    if (t.rel[pc.id]) t.rel[pc.id].type = "ex";
    A.addOp(pc, t, -25);
    return {
      msg: `You end it with ${t.given}.`,
    };
  },
  divorce(pc, t, r) {
    return !(!["REL-01", "REL-02"].includes(pc.faith) || pc.ruler) && A.chance(0.7)
      ? ((pc.piety -= 10),
        {
          msg: "The Temple will not dissolve the marriage. (Your faith forbids it.)",
          cls: "bad",
        })
      : ((pc.spouse = null),
        (t.spouse = null),
        (r.type = "ex"),
        t.rel[pc.id] && (t.rel[pc.id].type = "ex"),
        A.addOp(pc, t, -40),
        pc.exSpouses.push(t.id),
        (pc.honor = A.clamp(pc.honor - 5, 0, 100)),
        {
          msg: `You set ${t.given} aside. The marriage is over.`,
          cls: "bad",
        });
  },
  duel(pc, t) {
    A.startDuel(pc, t, {
      kind: "duel",
      place: "a field at dawn",
      lethal: true,
      toYield: true,
    });
    return {
      msg: `You challenge ${t.given}.`,
    };
  },
  murder(pc, t, r) {
    const skill = A.skill(pc, "intrigue") + A.skill(pc, "stealth") + A.stat(pc, "int") / 2,
      guard = t.ruler ? 180 : t.status === "royal" ? 120 : t.status === "noble" ? 80 : 30,
      ok = A.chance(A.clamp(0.25 + (skill - guard) / 200, 0.03, 0.85));
    if (((pc.honor = A.clamp(pc.honor - 20, 0, 100)), ok)) {
      A.kill(
        t,
        A.pick(["a knife in the dark", "poison in the wine", "a fall from a high window", 'an "accident" on the ice']),
      );
      pc.kills++;
      if (t.ruler || (A.realm(t.realm) && A.realm(t.realm).ruler === t.id)) A.ach("king_slayer");
      const caught = A.chance(0.25 - skill / 800 + (t.ruler ? 0.25 : 0));
      if (caught) {
        A.log("But someone saw.", "bad");
        A.punish(pc, "murder");
      }
      return {
        msg: `${t.given} is dead. Nobody can prove a thing${caught ? "... or so you hoped" : ""}.`,
        cls: "bad",
      };
    }
    A.addOp(pc, t, -60);
    r.type = "enemy";
    if (A.chance(0.5)) {
      A.log(`${t.given} survives your attempt — and knows it was you.`, "bad");
      A.punish(pc, "attempted murder");
    }
    return {
      msg: `Your attempt on ${t.given}'s life fails.`,
      cls: "bad",
    };
  },
  recruit(pc, t, r) {
    return pc.company
      ? A.chance(0.2 + r.op / 150 + pc.fame / 300)
        ? ((pc.company.officers = pc.company.officers || []),
          pc.company.officers.push(t.id),
          (r.type = "comrade"),
          (pc.company.men += A.ri(5, 30)),
          {
            msg: `${t.given} joins your company and brings friends.`,
            cls: "good",
          })
        : {
            msg: `${t.given} has no wish to follow your banner.`,
          }
      : {
          ok: false,
          msg: "You have no company.",
        };
  },
  apologize(pc, t, r) {
    const ok = A.chance(0.5 + (A.has(t, "kind") ? 0.2 : 0));
    A.addOp(pc, t, ok ? A.ri(8, 20) : 2);
    return {
      msg: ok ? `${t.given} accepts your apology.` : `${t.given} hears you out, cold-faced.`,
    };
  },
  name_child(pc, t, r, name) {
    return name
      ? ((t.given = String(name).slice(0, 24)),
        {
          msg: `Your child is named ${t.given}.`,
        })
      : {
          ok: false,
          msg: "No name given.",
        };
  },
};

A.weddingRite = function (pc) {
  return (
    {
      "REL-01": "at dawn before a Temple dawnkeeper",
      "REL-02": "by the Dawn rite",
      "REL-03": "on the iron ring before a hall-priest",
      "REL-04": "beneath your birth trees",
      "REL-05": "with your names poured together in metal",
      "REL-07": "before the Well-Keeper",
      "REL-09": "as the Rememberers sing both lines",
      "REL-11": "at the clan fire",
      "REL-12": "at the Thing, before the Mothers",
      "REL-08": "by the river at the flood",
    }[pc.faith] || "before witnesses and gods"
  );
};

A.marry = function (pc, t) {
  pc.spouse = t.id;
  t.spouse = pc.id;
  pc.rel[t.id] = Object.assign(pc.rel[t.id] || {}, {
    type: "spouse",
    since: A.S.year,
  });
  pc.rel[t.id].op = Math.max(pc.rel[t.id].op || 0, 40);
  t.rel[pc.id] = Object.assign(t.rel[pc.id] || {}, {
    type: "spouse",
    op: 50,
    since: A.S.year,
  });
  pc.happy = A.clamp(pc.happy + 15, 0, 100);
  A.ach("married");
  const rk = GD.STATUS[t.status] ? GD.STATUS[t.status].rank : 2,
    dowry = Math.round([0, 2, 10, 30, 200, 300, 1500, 8e3][rk] * A.rf(0.5, 1.5));
  if (dowry > 0) {
    pc.coin += dowry;
    A.log(`The marriage brings ${A.coin(dowry)} in dowry and gifts.`, "good");
  }
  const n = GD.NAMING[t.cult];
  if (
    t.sex === "F" &&
    n &&
    ["CUL-02", "CUL-11", "CUL-13"].includes(t.cult) &&
    pc.sex === "M" &&
    pc.sur &&
    ["house", "trade", "clan"].includes(pc.surMode)
  ) {
    t.sur = pc.sur;
    t.surMode = pc.surMode;
  }
};

A.jobOptions = function (pc) {
  const age = A.age(pc),
    sc = GD.RACES[pc.race].adult / 16,
    out = [];
  for (const k in GD.CAREERS) {
    const C = GD.CAREERS[k];
    if (
      C.mil ||
      age < C.minAge * sc ||
      (C.realms && !C.realms.includes(pc.realm)) ||
      (C.minStatus && (GD.STATUS[pc.status] ? GD.STATUS[pc.status].rank : 0) < C.minStatus && !pc.noble) ||
      (C.coast && A.prov(pc.home) && !A.prov(pc.home).coast) ||
      (k === "miner" && pc.race === "elf")
    )
      continue;
    let chance = 0.55;
    if (
      (C.literate && !pc.literate && (chance = 0.05),
      C.stat && (chance += (A.stat(pc, C.stat) - 40) / 150),
      C.skill && (chance += A.skill(pc, C.skill) / 200),
      k === "courtier" && ["noble", "royal"].includes(pc.status) && (chance = 0.95),
      k === "clergy" && pc.piety > 50 && (chance += 0.2),
      pc.flags.unfree && !["farm", "herd", "labor", "servant", "miner", "fish"].includes(k) && (chance = 0),
      pc.flags.outlaw && !["thief", "pirate", "hunter", "labor"].includes(k) && (chance *= 0.2),
      chance > 0.04 && (chance += A.letterPower ? A.letterPower(pc, "job") / 120 : 0),
      C.secret && !pc.flags.spyInvite && !(pc.job && pc.job.c === "spy"))
    )
      continue;
    const r0 = A.jobStartRank ? A.jobStartRank(pc, k) : 0;
    out.push({
      k,
      name: C.name,
      title: C.ranks[r0][0],
      pay: C.ranks[r0][2],
      chance: A.clamp(chance, 0, 0.97),
      desc: C.desc,
    });
  }
  return out;
};

A.applyJob = function (k) {
  const pc = A.pc();
  {
    const why = A.roleBlock(pc, "job");
    if (why)
      return {
        ok: false,
        msg: why,
      };
  }
  const opt = A.jobOptions(pc).find(o => o.k === k);
  if (!opt)
    return {
      ok: false,
      msg: "Not open to you.",
    };
  if (pc.job && pc.job.c === k)
    return {
      ok: false,
      msg: "You already do this.",
    };
  if (A.S.yearActs["apply_" + k])
    return {
      ok: false,
      msg: "They already gave you their answer this year.",
    };
  if (
    ((A.S.yearActs["apply_" + k] = 1),
    A.letterPower && A.letterPower(pc, "job") && opt.chance < 0.97 && A.useLetter(pc, "job"),
    A.chance(opt.chance))
  ) {
    const r0 = A.jobStartRank ? A.jobStartRank(pc, k) : 0;
    pc.job = {
      c: k,
      r: r0,
      y: GD.CAREERS[k].ranks[r0][1],
      perf: 50,
      rep: 20 + (pc.house ? 6 : 0) + r0 * 10 + Math.round(pc.fame / 5),
    };
    if (r0)
      A.log(
        `Your ${pc.flags.dip_letters || pc.flags.dip_medicine || pc.flags.dip_trade || pc.flags.dip_crafts || pc.flags.dip_faith || pc.flags.dip_sea || pc.flags.dip_arts || pc.flags.dip_war ? "diploma" : "family name"} counts: you start as ${GD.CAREERS[k].ranks[r0][0]}.`,
        "good",
      );
    if (k === "clergy") pc.flags.priest = true;
    A.log(`You take up a new life: ${opt.title}.`, "good");
    return {
      ok: true,
      msg: `You are now ${opt.title}.`,
    };
  }
  A.log(`You seek work as ${opt.title}, but they turn you away.`, "bad");
  return {
    ok: false,
    msg: "They turn you away.",
  };
};

A.quitJob = function () {
  const pc = A.pc();
  if (!pc.job)
    return {
      ok: false,
    };
  if (pc.flags.unfree)
    return {
      ok: false,
      msg: "You belong to your master. You cannot simply leave.",
    };
  const C = GD.CAREERS[pc.job.c];
  A.log(`You leave your place as ${C.ranks[pc.job.r][0]}.`);
  pc.job = null;
  return {
    ok: true,
  };
};

A.workHard = function () {
  const pc = A.pc();
  if (!pc.job || A.S.time < 1)
    return {
      ok: false,
      msg: "Not enough initiative (⧗) yet.",
    };
  if (pc.flags.workHard === A.S.year)
    return {
      ok: false,
      msg: "You already gave everything this year.",
    };
  pc.flags.workHard = A.S.year;
  A.S.time -= 1;
  pc.job.perf = A.clamp(pc.job.perf + 10, 0, 100);
  pc.happy = A.clamp(pc.happy - 3, 0, 100);
  const C = GD.CAREERS[pc.job.c];
  if (C.skill) A.trainSkill(pc, C.skill, 3);
  A.log("You work harder than anyone this year.");
  return {
    ok: true,
    msg: "Your master notices.",
  };
};

A.crime = function (pc, kind) {
  const D = {
      pick: [0.65, 3, "stealth", "spd"],
      burgle: [0.5, 25, "stealth", "int"],
      rob: [0.55, 15, "sword", "str"],
      smuggle: [0.6, 120, "trade", "int"],
    }[kind],
    [base, loot, sk, st] = D,
    p = A.clamp(
      base + A.skill(pc, sk) / 180 + (A.stat(pc, st) - 40) / 200 + A.perkSum(pc, "crime") - (pc.flags.wanted ? 0.1 : 0),
      0.08,
      0.95,
    );
  if (
    (A.trainSkill(pc, sk, 3),
    A.trainSkill(pc, "stealth", 2),
    (pc.honor = A.clamp(pc.honor - 2, 0, 100)),
    pc.job && pc.job.c === "thief" && (pc.job.perf = A.clamp(pc.job.perf + 4, 0, 100)),
    A.chance(p))
  ) {
    const g = Math.round(loot * A.rf(0.3, 2.2) * (kind === "smuggle" ? 1 + A.skill(pc, "trade") / 60 : 1));
    if (((pc.coin += g), kind === "rob" && A.chance(0.25))) {
      const victim = A.makeOpponent(pc, "traveler");
      A.startDuel(pc, victim, {
        kind: "brawl",
        place: "a lonely road",
        lethal: true,
        toYield: true,
        reward: g,
      });
      return {
        msg: "Your victim draws steel instead of a purse!",
      };
    }
    return {
      msg: {
        pick: `You lift a purse in the market crowd: ${A.coin(g)}.`,
        burgle: `In through the shutters, out with the silver: ${A.coin(g)}.`,
        rob: `"Your purse or your life." The traveler chooses life. ${A.coin(g)}.`,
        smuggle: `The goods slip past the toll-house. Your cut: ${A.coin(g)}.`,
      }[kind],
      cls: "good",
    };
  }
  return A.chance(0.55)
    ? (A.log(
        {
          pick: 'A hand closes on your wrist. "Thief!"',
          burgle: "A dog. A shout. Lantern-light. You are caught.",
          rob: `Your "traveler" is a reeve's man. You are caught.`,
          smuggle: "The toll-clerks were waiting for you.",
        }[kind],
        "bad",
      ),
      A.punish(pc, kind === "smuggle" ? "smuggling" : "theft"),
      {
        msg: "",
      })
    : {
        msg: "It goes wrong, but you get away empty-handed.",
        cls: "bad",
      };
};

A.LAW = {
  north: ["POL-01", "POL-05", "POL-08", "POL-13", "POL-14"],
  sun: ["POL-02", "POL-03", "POL-04", "POL-15", "POL-16", "POL-31"],
  east: ["POL-25", "POL-26"],
  well: ["POL-17", "POL-19", "POL-24", "POL-32"],
  deep: ["POL-10", "POL-28", "POL-29"],
  orc: ["POL-11", "POL-34"],
  elf: ["POL-06", "POL-07"],
  pirate: ["POL-33"],
};

A.lawOf = rid => {
  for (const k in A.LAW) if (A.LAW[k].includes(rid)) return k;
  return "other";
};

A.rulerScandal = function (pc, why) {
  const r = A.realm(pc.ruler),
    d = A.ri(4, 9);
  if (r) {
    r.legit = Math.max(0, r.legit - d);
    r.stability = Math.max(0, r.stability - 2);
  }
  A.fame(pc, -1);
  A.log(
    `No court in the realm will try its own sovereign${why ? ` for ${why}` : ""} — but the whispers cost the crown (legitimacy −${d}).`,
    "bad",
  );
  return "scandal";
};

A.punish = function (pc, crime) {
  const r = pc && pc.ruler && pc.id === A.S.pc ? A.rulerScandal(pc, crime) : punishNow(pc, crime);
  if (pc.alive && pc.health < 3 && !/hang|behead|execut/i.test(String(r))) pc.health = 3;
  return r;
};

const punishNow = function (pc, crime) {
  const law = A.lawOf(pc.realm),
    repeat = pc.flags.convictions || 0;
  pc.flags.convictions = repeat + 1;
  A.fame(pc, 2);
  pc.honor = A.clamp(pc.honor - 10, 0, 100);
  const bribe = Math.round(
    {
      theft: 20,
      smuggling: 60,
      debt: 0,
      murder: 400,
      "attempted murder": 250,
      desertion: 100,
      treason: 3e3,
    }[crime] || 30,
  );
  if (bribe && pc.coin >= bribe * 1.5 && A.chance(0.4) && law !== "deep" && law !== "elf") {
    pc.coin -= bribe;
    A.log(`A judge's palm and ${A.coin(bribe)} make the case go away.`, "warn");
    return "bribed";
  }
  let out = "";
  if (crime === "theft" || crime === "smuggling") {
    if (law === "sun" || law === "north") {
      if (repeat >= 1 && A.chance(0.6)) {
        A.addWound(pc, "brand");
        out = "You are branded on the hand as a thief.";
      } else {
        const f = Math.min(pc.coin, 20 + A.ri(0, 30));
        pc.coin -= f;
        out = `You pay fourfold: ${A.coin(f)}.`;
      }
    } else if (law === "well" && repeat >= 2) {
      A.addWound(pc, "lost_hand");
      out = "The Book of Wells is plain: at the third offense, the hand. They take your right hand.";
      A.willGrow(pc, 3, "maimed");
    } else {
      if (law === "east") {
        A.addWound(pc, "brand");
        pc.health -= 10;
        out = "You are flogged and branded on the cheek.";
      } else {
        if (law === "orc") {
          out = "The clan-mothers make you pay twofold in horses and shame.";
          pc.coin = Math.max(0, pc.coin - 40);
        } else {
          if (law === "deep") {
            out = "The Law-Carvers fine you in metal and carve your name in the tally of shame.";
            pc.coin = Math.max(0, pc.coin - 50);
          } else {
            if (law === "pirate") {
              out = "The crew votes: you are marooned on a rock for a week. You live.";
              pc.health -= 15;
            } else {
              pc.health -= 12;
              out = "You are flogged in the market square.";
            }
          }
        }
      }
    }
    if (crime === "smuggling" && A.chance(0.35)) {
      A.imprison(pc, A.ri(1, 2), "smuggling");
      out += " And a spell in the cells.";
    }
  } else if (crime === "debt") {
    if (law === "east") {
      pc.flags.unfree = "debt";
      out = "You are bound to your creditor's land until the debt is paid.";
    } else {
      A.imprison(pc, A.ri(1, 3), "debt");
      out = "Debtors' prison.";
    }
    pc.debt = Math.round(pc.debt * 0.5);
  } else if (crime === "murder" || crime === "attempted murder") {
    if ((law === "north" && pc.realm === "POL-01") || law === "orc" || pc.realm === "POL-08") {
      const price = crime === "murder" ? 300 : 120;
      if (pc.coin >= price) {
        pc.coin -= price;
        out = `You pay the blood-price: ${A.coin(price)}.`;
      } else {
        pc.flags.outlaw = true;
        A.ach("outlaw");
        out = "You cannot pay the blood-price. You are declared outlaw: anyone may kill you.";
      }
    } else if (law === "elf") {
      pc.flags.outlaw = true;
      out = "The Moot exiles you from the forest for a hundred years.";
      A.exile(pc);
    } else {
      if (law === "deep") {
        out = "The Law-Carvers wall you out of the hold in winter.";
        A.exile(pc);
        pc.health -= 20;
      } else {
        if (crime === "murder" && A.chance(0.55)) {
          A.queue({
            type: "event",
            ev: "gallows",
          });
          out = "You are sentenced to hang.";
        } else {
          A.imprison(pc, A.ri(4, 12), crime);
          out = "You are thrown into the cells for years.";
        }
      }
    }
  } else if (crime === "desertion") {
    if (pc.realm === "POL-05") {
      A.addWound(pc, "lost_fingers");
      out = "The King's Bowmen cut off your two drawing fingers.";
    } else {
      if (A.chance(0.4)) {
        A.queue({
          type: "event",
          ev: "gallows",
        });
        out = "Deserters hang at the road stations.";
      } else {
        pc.health -= 25;
        out = "You are flogged half to death.";
      }
    }
  } else {
    if (crime === "treason") {
      if (A.chance(0.6)) {
        A.queue({
          type: "event",
          ev: "gallows",
        });
        out = "Treason. They build the scaffold for you.";
      } else {
        A.imprison(pc, A.ri(8, 20), "treason");
        out = "Treason, but you are worth more alive. A deep cell.";
      }
      if (pc.noble) {
        pc.noble = null;
        out += " Your titles are forfeit.";
      }
    }
  }
  if (out) A.log(out, "bad");
  return out;
};
