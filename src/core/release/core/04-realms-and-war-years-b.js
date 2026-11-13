// The release's core, realms and war years (part 2 of 2): Provinces changing hands, realms falling, the war year, losses and fronts; talking to people (A.interact).
// Readable source of vendor/ardan-b593143.html with the patch layer baked in (X1, docs/DECISIONS.md D-027). Edit it here.
// Defines: A.inheritFrom, A.rungIndex, A.nobleTitle, A.moneyYear, A.careerYear, A.milestones, A.queue, A.willGrow,
// A.breakthrough, A.mortalCheck, A.pcDeath, A.score, A.assetValue, A.checkAch, A.canAct, A.spend, A.DIM,
// A.doActivity, A.weaponSkillOf, A.ACT, A.makeAcquaintance, A.makeLoveInterest, A.INTERACT, A.interactOptions,
// A.interact, interactNow.

A.inheritFrom = function (pc, dead) {
  if (!A.isAdult(pc)) return;
  const sibs = A.relsOf(pc, ["sibling"]).filter(x => x.p.alive).length,
    share = A.S.family ? Math.round(A.S.family.wealth / (sibs + 1)) : 0;
  // [X1 baked patch family/99994-v2-family V2F-INHERITFROM] A.inheritFrom moved a dead parent's rung and house
  // headship to the player when the player was the eldest son. Titles now move only in A.V2F.inherit, at the death
  // itself, by the house law; the coin share stays here.
  if (
    (share > 0 &&
      !pc.flags.bastard &&
      ((pc.coin += share),
      (A.S.family.wealth -= share),
      A.log(`You inherit ${A.coin(share)} from ${dead.given}.`, "good")),
    !A.V2F && dead.noble && dead.noble.rung >= 2 && !pc.flags.bastard)
  ) {
    const kids = A.lawSort(
      {
        law: "male",
      },
      dead.children.map(A.P).filter(k => k && k.alive && !k.flags.bastard),
    );
    if (kids[0] && kids[0].id === pc.id && (!pc.noble || pc.noble.rung < dead.noble.rung)) {
      pc.noble = Object.assign({}, dead.noble);
      A.log(`You inherit your parent's rung: you are now ${A.nobleTitle(pc)}.`, "big");
    }
  }
  // [X1 baked patch family/99994-v2-family V2F-INHERITFROM] A.inheritFrom moved a dead parent's rung and house
  // headship to the player when the player was the eldest son. Titles now move only in A.V2F.inherit, at the death
  // itself, by the house law; the coin share stays here.
  if (
    !A.V2F &&
    dead.house &&
    A.S.houses[dead.house] &&
    A.S.houses[dead.house].headPid === dead.id &&
    pc.house === dead.house &&
    !pc.flags.bastard
  ) {
    const kids = A.lawSort(
      {
        law: "male",
      },
      dead.children.map(A.P).filter(k => k && k.alive && !k.flags.bastard),
    );
    if (kids[0] && kids[0].id === pc.id) {
      A.S.houses[dead.house].headPid = pc.id;
      const h = A.S.houses[dead.house];
      A.log(`You are now head of ${h.name}.`, "big");
      if (h.rung && h.rung[0] === "N" && (!pc.noble || pc.noble.rung < A.rungIndex(h.rung))) {
        pc.noble = {
          rung: A.rungIndex(h.rung),
          realm: h.realm,
          holding: pc.home,
        };
        A.log(`With it comes the rung of ${A.nobleTitle(pc)}.`, "big");
      }
    }
  }
};

A.rungIndex = code => {
  const i = GD.NOBLE_RUNGS.findIndex(r => r.code === code);
  return i < 0 ? 2 : i;
};

A.nobleTitle = function (p) {
  if (!p.noble) return "";
  const r = GD.NOBLE_RUNGS[p.noble.rung];
  return r
    ? (p.sex === "F" ? r.f : r.title) +
        (p.noble.rung >= 4 && p.noble.holding != null ? " of " + A.provName(p.noble.holding) : "")
    : "";
};

A.moneyYear = function (pc) {
  const S = A.S;
  if (!A.isAdult(pc) && !pc.job) {
    if (S.family) S.family.wealth = Math.max(0, Math.round(S.family.wealth * 1.02 + A.ri(-5, 10)));
    return;
  }
  let inc = 0,
    out = 0;
  const notes = [];
  for (const a of pc.assets) {
    const P = GD.PROPERTY[a.k];
    if (P) {
      // [X1 baked patch nobility/56-court-and-treasury RI-MONEY-BOOK] A.moneyYear summed holdings income, stipends,
      // upkeep, the cost of living and children into two numbers and showed none of them. It now reports its parts
      // (A.riAssetLine, A.riMoneyParts) so the Holdings tab can show the year's money line by line, next to the new
      // costs (horse, retainers, taxes, ransoms, rebuilding).
      if (P.income) {
        const v = Math.round(P.income * A.rf(0.6, 1.3));
        inc += v;
        if (A.riAssetLine) A.riAssetLine(v, 0);
      }
      out += P.upkeep || 0;
      if (A.riAssetLine) A.riAssetLine(0, P.upkeep || 0);
    }
  }
  const R2 = GD.RACES[pc.race];
  if (pc.status === "royal" && !pc.ruler) {
    const rr = A.realm(pc.realm);
    if (rr && rr.house && pc.house === rr.house && rr.treasury > 0) {
      const st = Math.round(Math.min(2500, rr.income * 0.002 + 400));
      inc += st;
      rr.treasury -= st;
    }
  } else if (
    pc.status === "noble" &&
    pc.house &&
    !pc.flags.bastard &&
    (!A.house(pc.house) || A.house(pc.house).great !== false)
  )
    inc += 250;
  else if (pc.house && !pc.flags.bastard && A.isAdult(pc)) {
    const h = A.house(pc.house);
    if (h && h.great === false && !h.extinct) {
      let al = Math.round(
        [0, 10, 30, 80, 180, 400][h.wealth || 1] *
          ({
            noble: 2.2,
            gentry: 1.2,
            merchant: 1.5,
            artisan: 0.6,
            peasant: 0.3,
          }[pc.status] || 1),
      );
      if (h.military && pc.mil && !pc.mil.merc) al = Math.round(al * 1.6 + 60);
      if (pc.flags.disowned) al = 0;
      if (al > 0) {
        inc += al;
        pc.flags.famAllow = al;
      }
      if (h.military && pc.mil && pc.mil.realm === h.realm && A.chance(0.3)) A.fame(pc, 1);
    }
  }
  const ls = A.LIFESTYLE[pc.lifestyle || A.lifestyleDefault(pc)];
  let cost = ls.cost * (pc.prison ? 0.1 : 1);
  const fam = A.S.family,
    parentAlive = pc.parents.some(x => A.P(x) && A.P(x).alive);
  if (fam && parentAlive && !pc.spouse && A.age(pc) < R2.adult + Math.round(R2.adult * 0.5) && !pc.flags.unfree) {
    const share = Math.min(cost * 0.75, Math.max(0, fam.wealth * 0.08));
    fam.wealth = Math.max(0, fam.wealth - share);
    cost -= share;
  }
  if (pc.flags.unfree) cost = 0;
  if (pc.mil && !pc.flags.unfree) cost *= 0.5;
  out += cost;
  const kids = pc.children.map(A.P).filter(k => k && k.alive && !A.isAdult(k)).length;
  // [X1 baked patch nobility/56-court-and-treasury RI-MONEY-BOOK] A.moneyYear summed holdings income, stipends,
  // upkeep, the cost of living and children into two numbers and showed none of them. It now reports its parts
  // (A.riAssetLine, A.riMoneyParts) so the Holdings tab can show the year's money line by line, next to the new
  // costs (horse, retainers, taxes, ransoms, rebuilding).
  if (
    ((out += kids * ls.cost * 0.15),
    A.riMoneyParts && A.riMoneyParts(pc, inc, out, cost, kids * ls.cost * 0.15),
    (pc.coin += inc - out),
    pc.coin < 0)
  ) {
    pc.debt = (pc.debt || 0) + Math.round(-pc.coin);
    pc.coin = 0;
    if (pc.debt > 50) {
      A.log(`You are in debt: ${A.coin(pc.debt)} owed to moneylenders.`, "warn");
      pc.happy = A.clamp(pc.happy - 5, 0, 100);
    }
    if (pc.lifestyle && pc.lifestyle !== "poor" && pc.debt > ls.cost * 2) {
      pc.lifestyle =
        pc.lifestyle === "lavish"
          ? "rich"
          : pc.lifestyle === "rich"
            ? "comfortable"
            : pc.lifestyle === "comfortable"
              ? "modest"
              : "poor";
      A.log("You are forced to live more cheaply.", "warn");
    }
  } else if (pc.debt) {
    const pay = Math.min(pc.debt, pc.coin * 0.5);
    pc.debt = Math.round((pc.debt - pay) * 1.12);
    pc.coin -= pay;
    if (pc.debt < 1) pc.debt = 0;
  }
  if (pc.debt > 2e3 && A.chance(0.25) && !pc.prison) {
    A.log("Your creditors take you to court.", "bad");
    A.punish(pc, "debt");
  }
};

A.careerYear = function (pc) {
  const age = A.age(pc),
    st = A.stage(pc);
  if ((st === "child" || st === "teen") && !pc.job) {
    const rich =
      ["merchant", "gentry", "noble", "royal"].includes(pc.status) || pc.race === "elf" || pc.race === "dwarf";
    if (age >= 6 && (rich || pc.flags.school) && !pc.literate && A.chance(rich ? 0.5 : 0.3)) {
      pc.literate = true;
      A.log("You have learned to read and write. Most people on Ardan never will.", "good");
      pc.skills.learning = Math.max(pc.skills.learning || 0, 8);
    }
    if (rich && age >= 6) {
      A.trainSkill(pc, "learning", 3);
      A.train(pc, "int", 1.5);
    }
    if (["noble", "royal", "gentry"].includes(pc.status) && age >= 7) {
      A.trainSkill(pc, "riding", 3);
      A.trainSkill(pc, "sword", 2.5);
      A.trainSkill(pc, "diplomacy", 1.5);
    }
    if (pc.status === "peasant" || pc.status === "serf" || pc.status === "slave") {
      A.trainSkill(pc, "husbandry", 3);
      A.train(pc, "sta", 0.8);
      A.train(pc, "str", 0.6);
    }
    if (pc.race === "elf" && age >= 10) {
      A.trainSkill(pc, "bow", 1.5);
      A.trainSkill(pc, "survival", 1);
    }
    if (pc.race === "dwarf" && age >= 8) A.trainSkill(pc, "craft", 1.8);
    if ((pc.race === "orc" || pc.cult === "CUL-03") && age >= 5) {
      A.trainSkill(pc, "riding", 4);
      A.trainSkill(pc, "bow", 2);
    }
    if (pc.realm === "POL-05" && age >= 7 && pc.sex === "M") A.trainSkill(pc, "bow", 3);
  }
  if (!pc.job) return;
  const C = GD.CAREERS[pc.job.c];
  if (!C) {
    pc.job = null;
    return;
  }
  const j = pc.job;
  j.y++;
  const statV = C.stat ? A.stat(pc, C.stat) : 40,
    skillV = C.skill ? A.skill(pc, C.skill) : 30,
    target =
      25 +
      statV * 0.35 +
      skillV * 0.45 +
      (pc.happy - 50) * 0.2 +
      (pc.flags.workHard === A.S.year ? 15 : 0) -
      (pc.prison ? 50 : 0);
  j.perf = A.clamp(Math.round(j.perf + (target - j.perf) * 0.35 + A.ri(-8, 8)), 0, 100);
  if (C.skill) A.trainSkill(pc, C.skill, 3.5);
  if (C.stat) A.train(pc, C.stat, 0.8);
  const rank = C.ranks[j.r];
  let pay =
    rank[2] *
      (0.7 + j.perf / 160) *
      (1 + (C.skill ? A.perkOf(pc, C.skill, "income") : 0)) *
      (0.85 + (j.rep != null ? j.rep : 30) / 250) *
      (j.own ? 0.35 : 1) *
      (A.specPay ? A.specPay(pc) : 1) +
    (j.office ? 300 : 0);
  if (pc.flags.unfree) pay *= 0.05;
  if (pc.prison) pay = 0;
  if (C.cat === "sea" && C.coast && A.prov(pc.home) && !A.prov(pc.home).coast) pay *= 0.5;
  pc.coin += Math.round(pay);
  j.lastPay = Math.round(pay);
  if (j.perf < 10 && A.chance(0.3) && !pc.flags.unfree && !j.own) {
    A.log(`You are let go from your place as ${rank[0]}.`, "bad");
    pc.job = null;
    pc.happy = A.clamp(pc.happy - 10, 0, 100);
  }
  if (pc.job && A.careerYear2) A.careerYear2(pc);
};

A.milestones = function (pc) {
  const age = A.age(pc),
    R2 = GD.RACES[pc.race];
  if (age === R2.adult) {
    if (
      (A.log(`You come of age: ${age}, an adult by the law of your people.`, "big"),
      pc.lifestyle || (pc.lifestyle = A.lifestyleDefault(pc)),
      A.S.family && !pc.flags.bastard && pc.status !== "slave" && pc.status !== "serf")
    ) {
      const gift = Math.round(Math.min(A.S.family.wealth * 0.15, GD.STATUS[pc.status].wealth * 0.4));
      if (gift > 0) {
        pc.coin += gift;
        A.S.family.wealth -= gift;
        A.log(`Your family gives you ${A.coin(gift)} to start your life.`, "good");
      }
    }
    if (pc.status === "slave") pc.flags.unfree = "slave";
    if (pc.status === "serf") pc.flags.unfree = "serf";
    if (pc.gear.weapon === "fists") pc.gear.weapon = pc.race === "giant" ? "maul" : "dagger";
    if (A.chance(0.1)) A.ach("survivor");
    if ((pc.race === "human" || pc.race === "halforc") && !A.S.ach.survivor) A.ach("survivor");
  }
  if (pc.surMode === "deed" && age >= R2.adult && !pc.epithet && !pc.flags.deedAsked) {
    pc.flags.deedAsked = true;
    A.queue({
      type: "event",
      ev: "deed_name",
    });
  }
  if (pc.race === "dwarf" && age === 30)
    A.log(
      "At thirty your full name is carved in stone at the name-carving. You are a dwarf of the hold now in every way.",
      "big",
    );
  if (age === 100) A.ach("centurion");
  if (age === 400) A.ach("ancient");
};

A.queue = function (item) {
  A.S.queue.push(item);
};

A.willGrow = function (p, amt, why) {
  const before = p.st.wil,
    room = Math.max(0.2, (p.pot.wil + 20 - p.st.wil) / 60);
  p.st.wil = Math.min(p.pot.wil + 25, p.st.wil + amt * room * (1 + A.stat(p, "wil") / 200));
  if (p.st.wil > p.pot.wil) p.pot.wil = Math.round(Math.min(160, p.st.wil + 1));
  return p.st.wil - before;
};

A.breakthrough = function (p, gap, ctx) {
  const mult = (0.6 + A.stat(p, "wil") / 70) * Math.min(3, gap / 10),
    gains = {};
  for (const s of ["str", "spd", "ins", "sta"]) {
    const g = A.rf(0.6, 1.4) * mult * 2.2;
    p.pot[s] = Math.round(Math.min(200, p.pot[s] + g * 0.7));
    p.st[s] = Math.min(p.pot[s] * 1.02, p.st[s] + g);
    gains[s] = A.round(g, 1);
  }
  const wg = A.willGrow(p, 2 + mult * 1.5, "breakthrough");
  gains.wil = A.round(wg, 1);
  A.ach("breakthrough");
  return gains;
};

A.mortalCheck = function (pc, cause, pen) {
  // [X1 baked patch core/03-engine-fixes ENG-DEATH-CAUSE] A death right after a hurt was put down to a natural
  // cause. mortalCheck calls a death from health long gone "natural" when the last hurt is over 40 days old, but the
  // day of the last hurt is stamped only by the daily tick (onDay). A duel, a beast, a battle or an event that drops
  // health to 0 calls mortalCheck at once, before that tick, so it read the stamp of some older hurt: gored by the
  // Hell Boar at 16, the obituary said "marsh fever" (every one of 7 such deaths logged in 12 Varenna bot lives).
  // The tick now also notes the health it saw: a named hurt that took health from above 0 since then is today's. An
  // event's health loss with no cause of its own keeps the old name, so for it the release's rule stands, unless the
  // name itself is new since the tick (a beast fought the same day).
  if (
    (pc &&
      pc.alive &&
      pc.health <= 0 &&
      cause &&
      cause === pc.lastHurt &&
      !(pc._hTick > 0 && (!pc._lhAnon || pc._lh !== pc.lastHurt)) &&
      A.absDay &&
      A.absDay() - (pc._lhDay || 0) > 40 &&
      (cause = A.naturalCause(pc)),
    pc && pc.alive && pc.health <= 0 && /stocks|flog|pillory|branded|fine|shame/i.test(cause || ""))
  ) {
    pc.health = 3;
    return false;
  }
  if (!pc.alive) return true;
  if (pc.health > 0) return false;
  const diff = A.S.settings.diff;
  let surv =
    0.3 +
    A.stat(pc, "wil") / 220 +
    A.stat(pc, "sta") / 400 +
    ({
      story: 0.45,
      hard: 0,
      realism: -0.08,
    }[diff] || 0) -
    (pen || 0);
  if ((A.hasBlood(pc, "laughing") && (surv += 0.08), A.chance(A.clamp(surv, 0.05, 0.95)))) {
    if (
      ((pc.health = A.ri(4, 12)),
      A.log(
        `You should have died of ${cause}. You did not. For days you hang between the worlds, and something in you refuses to let go.`,
        "big",
      ),
      A.willGrow(pc, 3, "neardeath"),
      A.chance(0.5))
    ) {
      const w = A.addWound(pc, A.pick(["scar_chest", "limp", "lungs", "back", "concussion"]));
      if (w) A.log(`It leaves its mark: ${w}.`, "bad");
    }
    return false;
  }
  A.pcDeath(cause);
  return true;
};

A.pcDeath = function (cause) {
  const S = A.S,
    pc = A.pc();
  if (pc) {
    if (pc.alive) A.kill(pc, cause);
    pc.alive = false;
    pc.cause = cause;
    pc.died = S.year;
    A.log(`You die, aged ${A.age(pc)}, of ${cause}.`, "death");
    S.queue = S.queue.filter(q => q.type === "death");
    if (!S.queue.length)
      S.queue.push({
        type: "death",
      });
    S.deadList.push({
      name: A.fullName(pc),
      born: pc.born,
      died: S.year,
      cause,
      score: A.score(pc),
    });
    if (S.startStatus && ["serf", "slave", "peasant"].includes(S.startStatus) && pc.ruler) A.ach("peasant_king");
  }
};

A.score = function (pc) {
  let s = 0;
  s += pc.fame * 10;
  s += Math.min(3e3, Math.log10(1 + pc.coin + A.assetValue(pc)) * 300);
  if (pc.mil) s += pc.mil.rank * 120 + (pc.mil.battles || 0) * 25 + (pc.kills || 0) * 4;
  if (pc.noble) s += pc.noble.rung * 150;
  if (pc.ruler || pc.wasRuler) s += 2500;
  if (pc.job) s += pc.job.r * 120;
  s += pc.children.filter(c => A.P(c) && A.P(c).alive).length * 60;
  s += Object.keys(A.S.ach).length * 80;
  s += Math.min(A.age(pc), 120) * 5;
  s += pc.deeds.length * 30;
  return Math.round(s * (A.S.scoreMul || 1));
};

A.assetValue = p =>
  p.assets.reduce((a, x) => a + (GD.PROPERTY[x.k] ? GD.PROPERTY[x.k].price : 0), 0) +
  Object.values(p.gear).reduce((a, g) => a + (g && GD.GEAR[g] ? GD.GEAR[g].price : 0), 0);

A.checkAch = function (pc) {
  if (pc.coin >= 1e4) A.ach("rich");
  if (pc.fame >= 90) A.ach("legend");
  if (pc.langs.length >= 4) A.ach("polyglot");
  if (pc.children.filter(c => A.P(c) && A.P(c).alive).length >= 6) A.ach("big_family");
  if (pc.noble && pc.noble.rung >= 4) A.ach("lord");
  if (pc.noble && pc.noble.rung >= 2) A.ach("knighted");
  if (pc.kills >= 100) A.ach("hundred_kills");
  if (pc.epithet) A.ach("epithet");
};

A.canAct = function (key) {
  const pc = A.pc(),
    D = GD.ACTIVITIES[key];
  if (!D || !pc || !pc.alive) return [false, "Not possible"];
  const age = A.age(pc),
    R2 = GD.RACES[pc.race],
    scale = R2.adult / 16;
  if (age < D.minAge * scale) return [false, "Too young"];
  if (D.maxAge && age > D.maxAge * scale) return [false, "Too old"];
  if (A.S.time < D.cost) return [false, "Not enough initiative (⧗) yet"];
  if (pc.prison && !["meditate", "pray", "study", "rest", "lift", "run"].includes(key))
    return [false, "You are in prison"];
  const used = A.S.yearActs[key] || 0;
  if (["enlist", "merc", "buy_freedom", "found_company", "seize_land", "plot_throne"].includes(key) && used)
    return [false, "Already tried this year"];
  if (
    ["pilgrimage", "tournament", "beast_hunt", "school", "travel", "trade_venture", "crime_smuggle"].includes(key) &&
    used >= 1
  )
    return [false, "Once a year"];
  if (used >= 3) return [false, "Enough of that this year"];
  if (key === "enlist" && (pc.mil || pc.flags.unfree === "slave"))
    return [false, pc.mil ? "Already serving" : "Slaves cannot enlist"];
  if (key === "merc" && pc.mil) return [false, "Already serving"];
  if (key === "buy_freedom" && !pc.flags.unfree) return [false, "You are free"];
  if (key === "flee_bond" && !pc.flags.unfree) return [false, "You are free"];
  if (key === "found_company" && (pc.company || age < R2.adult))
    return [false, pc.company ? "You already lead a company" : "Too young"];
  if (key === "seize_land" && !pc.company) return [false, "You need a company of your own"];
  if (key === "plot_throne" && pc.ruler) return [false, "You already rule"];
  if (
    ["crime_pick", "crime_burgle", "crime_rob", "crime_smuggle", "gamble", "trade_venture", "moneylend"].includes(
      key,
    ) &&
    pc.ruler
  )
    return [false, "Beneath a ruler"];
  if (key === "pilgrimage" && pc.flags.unfree) return [false, "Your master forbids it"];
  if (key === "travel" && pc.flags.unfree) return [false, "You are not free to leave"];
  const G = GD.ACT_GATE && GD.ACT_GATE[key];
  if (G) {
    const cls = A.classOf(pc),
      rk = A.role(pc).k;
    if (G.max != null && cls > G.max) return [false, G.why || "Beneath your station"];
    if (G.min != null && cls < G.min) return [false, G.why || "Above your station"];
    if (G.not && (G.not.includes(rk) || (rk !== "ruler" && G.not.includes("lord") && pc.noble && pc.noble.rung >= 4)))
      return [false, G.why || "Not in your position"];
  }
  return [true, ""];
};

A.spend = function (key) {
  const D = GD.ACTIVITIES[key];
  A.S.time -= D.cost;
  A.S.yearActs[key] = (A.S.yearActs[key] || 0) + 1;
};

A.DIM = key => [1, 0.7, 0.45, 0.3][A.S.yearActs[key] || 0] || 0.25;

A.doActivity = function (key, arg) {
  const pc = A.pc(),
    [ok, why] = A.canAct(key);
  if (!ok)
    return {
      ok: false,
      msg: why,
    };
  const dim = A.DIM(key),
    fn = A.ACT[key];
  if (!fn)
    return {
      ok: false,
      msg: "Not implemented",
    };
  const res = A.SESSION_ACTS && A.SESSION_ACTS[key] ? A.trainingSession(pc, key, arg, dim, fn) : fn(pc, arg, dim);
  return res && res.ok === false
    ? res
    : (A.spend(key),
      res && res.msg && A.log(res.msg, res.cls || ""),
      res || {
        ok: true,
      });
};

A.weaponSkillOf = function (p) {
  const g = GD.GEAR[p.gear.weapon];
  return (g && GD.WEAPON_SKILL[g.kind]) || "unarmed";
};

A.ACT = {
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
  train_yard(pc, arg, d) {
    const k = arg && GD.SKILLS[arg] ? arg : A.weaponSkillOf(pc),
      g = A.trainSkill(pc, k, 5 * d);
    A.train(pc, "str", 0.7 * d);
    A.train(pc, "ins", 0.9 * d);
    A.train(pc, "spd", 0.4 * d);
    return A.chance(0.06)
      ? ((pc.health -= 8),
        {
          msg: `You drill ${GD.SKILLS[k].toLowerCase()} until your hands bleed, and twist an ankle. (+${A.round(g, 1)} ${GD.SKILLS[k]})`,
        })
      : {
          msg: `You drill with the ${GD.SKILLS[k].toLowerCase()} from dawn bell to dusk bell. (+${A.round(g, 1)} ${GD.SKILLS[k]})`,
        };
  },
  run(pc, a, d) {
    const g1 = A.train(pc, "sta", 1.6 * d),
      g2 = A.train(pc, "spd", 1.1 * d);
    pc.health = Math.min(A.maxHealth(pc), pc.health + 2);
    return {
      msg: `You run the hills until your lungs burn. (Stamina +${A.round(g1, 1)}, Speed +${A.round(g2, 1)})`,
    };
  },
  lift(pc, a, d) {
    const g = A.train(pc, "str", 1.7 * d);
    A.train(pc, "sta", 0.5 * d);
    return {
      msg: `Stones, logs, sacks of grain. Your back complains; your arms grow. (Strength +${A.round(g, 1)})`,
    };
  },
  study(pc, a, d) {
    if (!pc.literate && A.age(pc) >= 6)
      return A.chance(0.35 + A.stat(pc, "int") / 200)
        ? ((pc.literate = true),
          {
            msg: "You badger a priest into teaching you letters. At last the marks on the page are words.",
            cls: "good",
          })
        : (A.train(pc, "int", 0.6 * d),
          {
            msg: "You struggle with letters scratched in the dirt. Slowly, slowly.",
          });
    const g = A.train(pc, "int", 1.5 * d);
    A.trainSkill(pc, "learning", 4 * d);
    return {
      msg: `You read by candle-light: chronicles, law, the old songs. (Intelligence +${A.round(g, 1)})`,
    };
  },
  meditate(pc, a, d) {
    const g = A.willGrow(pc, 1.4 * d, "vigil");
    pc.happy = A.clamp(pc.happy + 3, 0, 100);
    A.train(pc, "ins", 0.3 * d);
    return {
      msg: `You keep a long vigil in the cold, alone with your thoughts. (Willpower +${A.round(g, 1)})`,
    };
  },
  spar(pc, arg) {
    const foe = (arg ? A.P(arg) : null) || A.makeOpponent(pc, "spar");
    A.startDuel(pc, foe, {
      kind: "spar",
      place: "the practice yard",
      lethal: false,
    });
    return {
      msg: `You step into the yard with ${A.fullName(foe, false)}.`,
    };
  },
  pray(pc, a, d) {
    pc.piety = A.clamp(pc.piety + 5 * d, 0, 100);
    pc.happy = A.clamp(pc.happy + 2, 0, 100);
    A.trainSkill(pc, "faith", 2 * d);
    return A.chance(0.04)
      ? (A.willGrow(pc, 2, "faith"),
        {
          msg: `You pray to ${A.godWord(pc)}, and for one moment you are sure something listens.`,
          cls: "good",
        })
      : {
          msg: `You keep the rites of ${A.faith(pc.faith) ? A.faith(pc.faith).name : "your fathers"}.`,
        };
  },
  pilgrimage(pc) {
    const F = A.faith(pc.faith),
      cost = 20 + A.ri(0, 40);
    return pc.coin < cost && A.isAdult(pc)
      ? {
          ok: false,
          msg: `You need about ${cost} suns for the road.`,
        }
      : (A.isAdult(pc) && (pc.coin -= cost),
        (pc.piety = A.clamp(pc.piety + 15, 0, 100)),
        A.willGrow(pc, 2, "pilgrimage"),
        A.fame(pc, 1),
        A.queue({
          type: "event",
          ev: "road_pilgrim",
        }),
        {
          msg: `You set out on pilgrimage to the holy places of ${F ? F.name : "your faith"}${F && F.rituals ? " — " + F.rituals.split(";")[0].trim().toLowerCase() : ""}.`,
        });
  },
  tavern(pc) {
    if (A.isAdult(pc)) pc.coin = Math.max(0, pc.coin - 1);
    pc.happy = A.clamp(pc.happy + 4, 0, 100);
    A.queue({
      type: "event",
      ev: A.pick(["tavern_brawl", "tavern_stranger", "tavern_song", "tavern_dice", "tavern_rumor", "tavern_recruit"]),
    });
    return {
      msg: "You spend the evening at the tavern.",
    };
  },
  festival(pc) {
    pc.happy = A.clamp(pc.happy + 6, 0, 100);
    A.queue({
      type: "event",
      ev: "festival_day",
    });
    return {
      msg: `You go to ${A.pick(GD.FESTIVALS)[0]}.`,
    };
  },
  court_love(pc) {
    if (pc.spouse && A.P(pc.spouse) && A.P(pc.spouse).alive && A.has(pc, "honest")) A.chance(0.5);
    const cand = A.makeLoveInterest(pc);
    return cand
      ? (A.queue({
          type: "event",
          ev: "meet_love",
          ctx: {
            pid: cand.id,
          },
        }),
        {
          msg: "You go looking for love.",
        })
      : {
          ok: false,
          msg: "Nobody here catches your eye.",
        };
  },
  make_friend(pc) {
    const f = A.makeAcquaintance(pc, "friend");
    return A.chance(0.45 + pc.looks / 400 + (A.has(pc, "gregarious") ? 0.2 : 0) - (A.has(pc, "shy") ? 0.15 : 0))
      ? (A.link(pc, f, "friend", A.ri(30, 55), "friend"),
        {
          msg: `You make a friend: ${A.fullName(f)}, ${A.age(f)}, ${f.occ || "a neighbor"}.`,
          cls: "good",
        })
      : (A.link(pc, f, "acquaint", A.ri(0, 20), "acquaint"),
        {
          msg: `You try to befriend ${f.given}, but it doesn't quite take. Still, you know each other now.`,
        });
  },
  gamble(pc) {
    const stake = Math.max(1, Math.round(Math.min(pc.coin * 0.2, 50)));
    if (pc.coin < 1)
      return {
        ok: false,
        msg: "You have nothing to bet.",
      };
    const luck = A.rand() + A.stat(pc, "int") / 400 + A.skill(pc, "gambling") / 350 + A.perkOf(pc, "gambling", "odds");
    A.trainSkill(pc, "gambling", 2);
    return luck > 0.58
      ? ((pc.coin += stake),
        (pc.happy = A.clamp(pc.happy + 4, 0, 100)),
        {
          msg: `The bones fall your way. You win ${A.coin(stake)}.`,
          cls: "good",
        })
      : ((pc.coin -= stake),
        (pc.happy = A.clamp(pc.happy - 3, 0, 100)),
        A.chance(0.08) &&
          A.queue({
            type: "event",
            ev: "dice_cheat",
          }),
        {
          msg: `You lose ${A.coin(stake)} at knucklebones.`,
          cls: "bad",
        });
  },
  hunt(pc) {
    A.startHunt(pc, false);
    return {
      msg: "You go out to hunt.",
    };
  },
  explore(pc) {
    A.queue({
      type: "event",
      ev: A.pick(["explore_ruin", "explore_cave", "explore_road", "explore_lair", "explore_battlefield"]),
    });
    return {
      msg: "You leave the roads behind.",
    };
  },
  beast_hunt(pc) {
    A.startHunt(pc, true);
    return {
      msg: "You set out to hunt a beast the songs talk about.",
    };
  },
  crime_pick(pc) {
    return A.crime(pc, "pick");
  },
  crime_burgle(pc) {
    return A.crime(pc, "burgle");
  },
  crime_rob(pc) {
    return A.crime(pc, "rob");
  },
  crime_smuggle(pc) {
    return A.crime(pc, "smuggle");
  },
  trade_venture(pc) {
    return {
      ok: true,
      msg: "Your market and the trade roads are on the Holdings tab.",
    };
  },
  moneylend(pc) {
    const stake = Math.round(Math.min(pc.coin * 0.4, 2e3));
    if (stake < 20)
      return {
        ok: false,
        msg: "You need coin to lend coin.",
      };
    if (((pc.coin -= stake), A.chance(0.18 - A.skill(pc, "trade") / 800)))
      return {
        msg: `Your debtor skips town. ${A.coin(stake)} gone.`,
        cls: "bad",
      };
    const back = Math.round(stake * A.rf(1.08, 1.25));
    pc.coin += back;
    A.trainSkill(pc, "trade", 2);
    return pc.faith === "REL-07" && A.chance(0.3)
      ? ((pc.piety -= 5),
        {
          msg: `You lend at a "fee" — the Book forbids interest. ${A.coin(back)} comes back.`,
        })
      : {
          msg: `You lend ${A.coin(stake)} at interest and collect ${A.coin(back)}.`,
        };
  },
  tournament(pc) {
    return pc.coin < 5
      ? {
          ok: false,
          msg: "The entry fee is 5 suns.",
        }
      : ((pc.coin -= 5),
        A.startTournament(pc),
        {
          msg: "You pay the herald and enter the lists.",
        });
  },
  duel(pc, arg) {
    const foe = (arg ? A.P(arg) : null) || A.makeOpponent(pc, "duel");
    A.startDuel(pc, foe, {
      kind: "duel",
      place: A.pick(["a meadow outside town", "the castle yard", "a riverbank at dawn", "a crossroads"]),
      lethal: true,
      toYield: true,
    });
    return {
      msg: `You challenge ${A.fullName(foe, false)} to a duel.`,
    };
  },
  school(pc) {
    A.queue({
      type: "school",
    });
    return {
      msg: "You look for a fighting school that will take you.",
    };
  },
  travel(pc) {
    A.queue({
      type: "travel",
    });
    return {
      msg: "You think about the road.",
    };
  },
  learn_lang(pc, arg) {
    const lang =
      arg && GD.LANG_LIST.includes(arg) && !pc.langs.includes(arg)
        ? arg
        : A.pick(GD.LANG_LIST.filter(l => !pc.langs.includes(l)));
    return lang
      ? ((pc.langProg = pc.langProg || {}),
        (pc.langProg[lang] = (pc.langProg[lang] || 0) + 25 + A.stat(pc, "int") / 3),
        A.train(pc, "int", 0.5),
        pc.langProg[lang] >= 100
          ? (pc.langs.push(lang),
            delete pc.langProg[lang],
            {
              msg: `You can speak ${lang} now.`,
              cls: "good",
            })
          : {
              msg: `You work at ${lang}. (${Math.round(pc.langProg[lang])}% of the way)`,
            })
      : {
          ok: false,
          msg: "You know every tongue worth knowing.",
        };
  },
  heal(pc) {
    if (A.isAdult(pc) && pc.coin < 2)
      return {
        ok: false,
        msg: "A physician costs 2 suns.",
      };
    if (A.isAdult(pc)) pc.coin -= 2;
    const g = A.ri(5, 20) + (A.chance(0.15) ? -10 : 0);
    pc.health = A.clamp(pc.health + g, 0, A.maxHealth(pc));
    const w = pc.wounds.find(x => x.until);
    if (w && A.chance(0.4)) w.until = Math.max(A.S.year, w.until - 1);
    return {
      msg:
        g >= 0
          ? `The physician bleeds you, prescribes honey and vinegar, and takes two suns. You feel ${g > 12 ? "much " : ""}better.`
          : "The physician's cure makes you sicker. Perhaps bleeding was not the answer.",
      cls: g >= 0 ? "good" : "bad",
    };
  },
  rest(pc) {
    pc.health = A.clamp(pc.health + 12, 0, A.maxHealth(pc));
    pc.happy = A.clamp(pc.happy + 3, 0, 100);
    return {
      msg: "You rest. Sleep, broth, quiet.",
    };
  },
  play(pc) {
    if (
      (A.train(pc, "spd", 0.6), A.train(pc, "sta", 0.4), (pc.happy = A.clamp(pc.happy + 6, 0, 100)), A.chance(0.35))
    ) {
      const f = A.makeAcquaintance(pc, "friend", true);
      A.link(pc, f, "friend", A.ri(25, 50), "friend");
      return {
        msg: `You play war in the mud with the other children. ${f.given} becomes your friend.`,
        cls: "good",
      };
    }
    if (A.chance(0.15))
      A.queue({
        type: "event",
        ev: A.pick(["child_fight", "child_dare", "child_lost"]),
      });
    return {
      msg: "You play tag, knucklebones and war in the mud until dark.",
    };
  },
  chores(pc) {
    A.train(pc, "str", 0.6);
    A.train(pc, "sta", 0.6);
    A.trainSkill(pc, "husbandry", 3);
    for (const x of A.relsOf(pc, ["mother", "father"])) A.addOp(pc, x.p, 3);
    return {
      msg: A.pick([
        "You herd the geese and carry water. Your mother notices.",
        "You gather firewood until your arms ache.",
        "You help with the harvest, gleaning behind the reapers.",
        "You muck out the byre. Glamorous, it is not.",
      ]),
    };
  },
  enlist(pc) {
    return A.enlist(pc, false);
  },
  merc(pc) {
    return A.enlist(pc, true);
  },
  found_company(pc) {
    return A.foundCompany(pc);
  },
  seize_land(pc) {
    return A.seizeLand(pc);
  },
  plot_throne(pc) {
    return A.plotThrone(pc);
  },
  buy_freedom(pc) {
    const price = pc.flags.unfree === "slave" ? 120 : 60;
    return pc.coin < price
      ? {
          ok: false,
          msg: `Your freedom costs ${price} suns.`,
        }
      : ((pc.coin -= price),
        delete pc.flags.unfree,
        (pc.status = pc.status === "slave" || pc.status === "serf" ? "peasant" : pc.status),
        A.ach("freed"),
        (pc.happy = A.clamp(pc.happy + 25, 0, 100)),
        A.willGrow(pc, 3, "freedom"),
        {
          msg: `You count ${price} suns into your master's hand. You are free.`,
          cls: "big",
        });
  },
  flee_bond(pc) {
    if (
      A.chance(0.35 + A.skill(pc, "stealth") / 200 + A.stat(pc, "spd") / 300 + (A.hasBlood(pc, "boneless") ? 0.2 : 0))
    ) {
      delete pc.flags.unfree;
      pc.status = "peasant";
      pc.flags.runaway = true;
      const to = A.pick(
        A.S.prov
          .filter(p => p.owner === "unclaimed" || (p.owner !== pc.realm && p.adj.includes(pc.home)))
          .concat([A.prov(pc.home)]),
      );
      pc.home = to.id;
      pc.realm = to.owner;
      A.ach("freed");
      A.willGrow(pc, 3, "escape");
      return {
        msg: `You slip away by night and walk until your feet bleed. You reach ${to.name}, where nobody asks. You are free.`,
        cls: "big",
      };
    }
    pc.health -= 15;
    pc.happy = A.clamp(pc.happy - 15, 0, 100);
    A.willGrow(pc, 1.5, "lash");
    return {
      msg: "They catch you at the ford with the dogs. The lash, and a heavier chain.",
      cls: "bad",
    };
  },
};

A.makeAcquaintance = function (pc, kind, child) {
  const age = A.age(pc),
    R2 = GD.RACES[pc.race],
    raceOpts = GD.RACE_LIST.filter(r => A.raceAllowed(r, pc.realm)),
    race = A.chance(0.85) || !raceOpts.length ? pc.race : A.pick(raceOpts),
    R22 = GD.RACES[race],
    tAge = child
      ? Math.round((age / R2.adult) * R22.adult) + A.ri(-1, 1)
      : Math.max(R22.adult - 2, Math.round((age / R2.adult) * R22.adult) + A.ri(-5, 8)),
    sex = A.chance(0.5) ? "M" : "F",
    cult = race === pc.race ? pc.cult : A.cultureFor(race, pc.realm),
    status = A.pick([pc.status, pc.status, "peasant", "artisan", "merchant"]),
    p = A.newPerson({
      given: A.givenName(cult, sex),
      sex,
      race,
      realm: pc.realm,
      cult,
      faith: A.faithFor(race, pc.realm),
      born: A.S.year - Math.max(1, tAge),
      status,
      home: pc.home,
    }),
    fn = A.familyName({
      cult,
      realm: pc.realm,
      status,
      home: pc.home,
      sex,
    });
  p.sur = fn.sur;
  p.surMode = fn.mode;
  // [X1 baked patch core/03-engine-fixes ENG-OCC-SEX] Occupations were picked without regard to sex, so a noble
  // father could be "a lady of the house" and a mother "a lord" (seen in the birth line of a noble life). A.occPick
  // filters the gendered titles by sex; it still draws exactly one random number.
  p.occ = A.isAdult(p) ? A.occPick(status, p.sex) : "a child of " + A.provName(pc.home);
  return p;
};

A.makeLoveInterest = function (pc) {
  const R2 = GD.RACES[pc.race],
    sexWant = pc.flags.likes || (pc.sex === "M" ? "F" : "M"),
    compatible = {
      human: ["human", "halfelf", "halforc", "elf"],
      elf: ["elf", "halfelf", "human"],
      dwarf: ["dwarf"],
      orc: ["orc", "halforc", "human"],
      giant: ["giant"],
      halfelf: ["halfelf", "human", "elf"],
      halforc: ["halforc", "human", "orc"],
    }[pc.race],
    race = A.chance(0.8) ? pc.race : A.pick(compatible.filter(r => A.raceAllowed(r, pc.realm)).concat([pc.race])),
    R22 = GD.RACES[race],
    myAgeFrac = A.age(pc) / R2.adult,
    age = Math.max(R22.adult, Math.round(myAgeFrac * R22.adult + (A.ri(-4, 4) * R22.adult) / 16)),
    cult = race === pc.race ? pc.cult : A.cultureFor(race, pc.realm),
    st =
      pc.status === "royal" || pc.status === "noble"
        ? A.pick(["noble", "gentry", "merchant", "artisan"])
        : A.pick([pc.status, "peasant", "artisan", "merchant"]),
    p = A.newPerson({
      given: A.givenName(cult, sexWant),
      sex: sexWant,
      race,
      realm: pc.realm,
      cult,
      faith: A.faithFor(race, pc.realm),
      born: A.S.year - age,
      status: st === "noble" ? "gentry" : st,
      home: pc.home,
    }),
    fn = A.familyName({
      cult,
      realm: pc.realm,
      status: p.status,
      home: pc.home,
      sex: sexWant,
    });
  p.sur = fn.sur;
  p.surMode = fn.mode;
  // [X1 baked patch core/03-engine-fixes ENG-OCC-SEX] Occupations were picked without regard to sex, so a noble
  // father could be "a lady of the house" and a mother "a lord" (seen in the birth line of a noble life). A.occPick
  // filters the gendered titles by sex; it still draws exactly one random number.
  p.occ = A.occPick(p.status, p.sex);
  return p;
};

A.INTERACT = {
  time: {
    name: "Spend time together",
    cost: 0,
  },
  talk: {
    name: "Have a long talk",
    cost: 0,
  },
  compliment: {
    name: "Compliment",
    cost: 0,
  },
  gift: {
    name: "Give a gift",
    cost: 0,
  },
  askmoney: {
    name: "Ask for money",
    cost: 0,
  },
  advice: {
    name: "Ask for advice",
    cost: 0,
  },
  train: {
    name: "Train together",
    cost: 1,
  },
  spar: {
    name: "Spar",
    cost: 1,
  },
  insult: {
    name: "Insult",
    cost: 0,
  },
  argue: {
    name: "Pick a fight",
    cost: 0,
  },
  flirt: {
    name: "Flirt",
    cost: 0,
  },
  date: {
    name: "Court",
    cost: 1,
  },
  propose: {
    name: "Propose marriage",
    cost: 0,
  },
  child: {
    name: "Try for a child",
    cost: 0,
  },
  nochild: {
    name: "Avoid having children",
    cost: 0,
  },
  breakup: {
    name: "Break it off",
    cost: 0,
  },
  divorce: {
    name: "Set aside (divorce)",
    cost: 0,
  },
  duel: {
    name: "Challenge to a duel",
    cost: 1,
  },
  murder: {
    name: "Murder",
    cost: 1,
  },
  recruit: {
    name: "Ask to join your company",
    cost: 0,
  },
  apologize: {
    name: "Apologize",
    cost: 0,
  },
  name_child: {
    name: "Rename",
    cost: 0,
  },
};

A.interactOptions = function (pc, t) {
  const r = pc.rel[t.id] || {
      type: "acquaint",
      op: 0,
    },
    opts = [];
  if (!t.alive) return opts;
  const myAge = A.age(pc),
    adult = A.isAdult(pc),
    tAdult = A.isAdult(t);
  if (myAge < (3 * GD.RACES[pc.race].adult) / 16) return ["time"];
  opts.push("time", "talk", "compliment");
  if (adult && pc.coin >= 1) opts.push("gift");
  if (["mother", "father", "grandparent", "spouse", "sibling", "friend", "bestfriend", "lover"].includes(r.type))
    opts.push("askmoney");
  if (["mother", "father", "grandparent", "mentor", "friend", "bestfriend"].includes(r.type) || t.fame > 40)
    opts.push("advice");
  if (adult && tAdult && myAge > 8) opts.push("train", "spar");
  opts.push("insult", "argue");
  const lovers = ["lover", "betrothed", "spouse"];
  if (
    adult &&
    tAdult &&
    !["mother", "father", "sibling", "child", "grandparent", "grandchild", "uncle", "nephew"].includes(r.type)
  ) {
    opts.push("flirt");
    if (!lovers.includes(r.type)) opts.push("date");
    if (r.type === "lover" || r.type === "betrothed") opts.push("propose");
    if (r.type === "lover") opts.push("breakup");
  }
  if (r.type === "spouse") opts.push("child", "nochild", "divorce");
  if (adult) opts.push("duel", "murder");
  if (pc.company && adult && tAdult) opts.push("recruit");
  if (r.op < 0) opts.push("apologize");
  if (r.type === "child" && A.age(t) <= 1) opts.push("name_child");
  const out = opts.filter(o => A.INTERACT[o]);
  if (adult) {
    if (tAdult && (r.op || 0) > -20) out.push("help");
    const rr = pc.rel[t.id] || {
      op: 0,
    };
    if (
      tAdult &&
      !rr.sworn &&
      (rr.op || 0) >= 75 &&
      ["friend", "bestfriend", "comrade", "sibling", "cousin"].includes(rr.type)
    )
      out.push("swear");
  }
  return out;
};

A.interact = function (tid, key, arg) {
  const pc = A.pc(),
    res = interactNow(tid, key, arg);
  if (pc.rel[tid]) pc.rel[tid].seen = A.S.year;
  return res;
};

const interactNow = function (tid, key, arg) {
  const pc = A.pc(),
    t = A.P(tid);
  if (!pc || !t || !t.alive || t.id === pc.id)
    return {
      ok: false,
      msg: "They are not here.",
    };
  pc.flags.ints = pc.flags.ints || {};
  const ik = A.S.year + ":" + tid + ":" + key,
    count = pc.flags.ints[ik] || 0;
  if (count >= 2 && !["name_child", "propose", "child", "nochild"].includes(key))
    return {
      ok: false,
      msg: "You have done that enough this year.",
    };
  const I = A.INTERACT[key];
  if (I.cost && A.S.time < I.cost)
    return {
      ok: false,
      msg: "Not enough initiative (⧗) yet.",
    };
  if (!pc.rel[tid]) A.link(pc, t, "acquaint", 0, "acquaint");
  const r = pc.rel[tid],
    res = A.INT_FN[key](pc, t, r, arg);
  if (
    (res.ok !== false &&
      ((pc.flags.ints[ik] = count + 1), I.cost && (A.S.time -= I.cost), res.msg && A.log(res.msg, res.cls || "")),
    Object.keys(pc.flags.ints).length > 400)
  )
    for (const k of Object.keys(pc.flags.ints)) if (!k.startsWith(A.S.year + ":")) delete pc.flags.ints[k];
  return res;
};
