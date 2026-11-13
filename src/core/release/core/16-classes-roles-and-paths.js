// The release's core, classes roles and paths: Training, classes, roles, the plan and the career paths.
// Readable source of vendor/ardan-b593143.html with the patch layer baked in (X1, docs/DECISIONS.md D-028). Edit it here.
// Defines: A.exercise, A.volunteer, A.classOf, A.CLASS_NAME, A.role, A.leaveRolesFor, A.roleCheck, A.onDay,
// A.roleBlock, GD.ACT_GATE, A.EV_RX, A.CX_RX, A.evAudience, A.evFit, GD.INTENSITY, GD.TRAIN_STATS, GD.AIMS, A.plan,
// A.trainTargets, A.setPlan, A.defaultPlan, A.planMonth, A.planDay, A.onMonth, A.defaultPlanIfAuto, A.findPatron,
// A.patronOf, A.flowEvent, A.planSession, GD.PATHS, A.CAREER_PATH.

A.exercise = function () {
  const pc = A.pc();
  if (!pc || !pc.mil || pc.mil.merc)
    return {
      ok: false,
      msg: "Only the realm's officers join the war games.",
    };
  if (pc.mil.rank < 4)
    return {
      ok: false,
      msg: "War games are for officers (Captain and up).",
    };
  if (A.S.yearActs.exercise)
    return {
      ok: false,
      msg: "One season of war games a year.",
    };
  A.S.yearActs.exercise = 1;
  const r = A.realm(pc.mil.realm),
    sk = (A.skill(pc, "tactics") + A.skill(pc, "command")) / 2,
    foe = 30 + A.ri(0, 45),
    roll = sk + A.ri(-25, 25),
    won = roll > foe,
    d = pc.mil.div ? A.divById(pc.mil.div) : null;
  if (d) {
    d.exp = Math.min(40, d.exp + 4);
    for (const k in d.eq) d.eq[k] = Math.round(d.eq[k] * 0.98);
  }
  if (r && r.forces) r.forces.xp = Math.min(200, r.forces.xp + 3);
  A.trainSkill(pc, "tactics", won ? 3 : 2);
  A.trainSkill(pc, "command", won ? 2.5 : 1.5);
  pc.mil.merit += won ? 10 + pc.mil.rank * 2 : 4;
  if (won) pc.mil.exercises = (pc.mil.exercises || 0) + 1;
  return {
    ok: true,
    msg: won
      ? `The war games go your way: your ${pc.mil.rank >= 6 ? "division" : "men"} outmaneuver the "enemy" (your tactics ${Math.round(roll)} vs ${foe}). The high command takes note.`
      : `The war games go badly: the umpires rule you "destroyed" (${Math.round(roll)} vs ${foe}). Still, you learn.`,
  };
};

A.volunteer = function () {
  const pc = A.pc(),
    m = pc && pc.mil;
  if (!m || !m.div)
    return {
      ok: false,
      msg: "You are not with a division.",
    };
  const d = A.divById(m.div);
  if (!d)
    return {
      ok: false,
      msg: "Your division is gone.",
    };
  const S = A.S,
    pid = d.atk != null ? d.atk : (S.fights || {})[d.loc] ? d.loc : null,
    F = pid != null ? (S.fights || {})[pid] : null;
  if (!F)
    return {
      ok: false,
      msg: "Your division is not in a battle.",
    };
  const tag = F.loc + ":" + F.start;
  if (m.volTag === tag)
    return {
      ok: false,
      msg: "You already stepped forward in this battle.",
    };
  m.volTag = tag;
  const sgt = m.rank >= 2,
    roll =
      A.rand() + A.skillEff(pc, GD.TROOP_SKILL[m.troop] || "spear") / 200 + (sgt ? A.skill(pc, "command") / 250 : 0);
  if (sgt) d.org = Math.min(A.divMaxOrg(d), d.org + A.divMaxOrg(d) * (roll > 0.6 ? 0.06 : 0.02));
  else d.org = Math.min(A.divMaxOrg(d), d.org + A.divMaxOrg(d) * (roll > 0.6 ? 0.03 : 0.01));
  const hurt = A.chance(sgt ? 0.15 : 0.25);
  if (hurt) {
    const k = A.ri(4, 18);
    pc.health = Math.max(1, pc.health - k);
  }
  const gain = Math.round((roll > 0.6 ? 10 : 4) * (1 + m.rank * 0.3));
  m.merit += gain;
  A.trainSkill(pc, sgt ? "command" : GD.TROOP_SKILL[m.troop] || "spear", roll > 0.6 ? 2 : 1);
  return {
    ok: true,
    msg: `${sgt ? (roll > 0.6 ? "You walk the line, bawling names, and the men steady around you." : "You shout yourself hoarse; a few men listen.") : roll > 0.6 ? "You push into the front rank and hold it when it matters." : "You step forward; the press of the line swallows you."} Merit +${gain}.${hurt ? " You take a cut you will feel tomorrow." : ""}`,
  };
};

A.classOf = function (pc) {
  if (!pc) return 0;
  if (pc.ruler) return 9;
  let c =
    {
      slave: 0,
      serf: 1,
      peasant: 2,
      artisan: 3,
      merchant: 3,
      gentry: 4,
      noble: 5,
      royal: 7,
    }[pc.status] || 2;
  if (
    (pc.noble && (c = Math.max(c, pc.noble.rung >= 6 ? 7 : pc.noble.rung >= 4 ? 6 : pc.noble.rung >= 2 ? 4 : 3)),
    pc.office && (c = Math.max(c, 6)),
    pc.mil && !pc.mil.merc && (c = Math.max(c, pc.mil.rank >= 7 ? 6 : pc.mil.rank >= 4 ? 4 : c)),
    pc.job)
  ) {
    const C = GD.CAREERS[pc.job.c];
    if (
      C &&
      pc.job.r >= C.ranks.length - 1 &&
      ["courtier", "scribe", "envoy", "steward", "lawyer", "clergy", "merchant"].includes(pc.job.c)
    )
      c = Math.max(c, 5);
  }
  if (pc.flags.unfree === "slave") c = 0;
  else {
    if (pc.flags.unfree === "serf") c = Math.min(c, 1);
  }
  return c;
};

A.CLASS_NAME = ["unfree", "bound", "common", "townsfolk", "gentle", "noble", "great", "great", "royal", "sovereign"];

A.role = function (pc) {
  if (!pc)
    return {
      k: "none",
      name: "",
    };
  if (!pc.alive)
    return {
      k: "dead",
      name: "Dead",
    };
  if (pc.prison)
    return {
      k: "prison",
      name: "Prisoner",
    };
  if (!A.isAdult(pc))
    return {
      k: A.stage(pc) === "teen" ? "youth" : "child",
      name: A.stage(pc) === "teen" ? "Youth" : "Child",
    };
  if (pc.ruler)
    return {
      k: "ruler",
      name: (A.realm(pc.ruler) && A.realm(pc.ruler).title) || "Ruler",
      path: "crown",
    };
  if (pc.company)
    return {
      k: "company",
      name: "Captain of " + pc.company.name,
      path: "company",
    };
  if (pc.mil && pc.mil.merc)
    return {
      k: "company",
      name: "Sellsword of " + (pc.mil.company || "a company"),
      path: "company",
    };
  if (pc.mil)
    return {
      k: "army",
      name: GD.MIL[pc.mil.rank].title,
      path: "army",
    };
  if (pc.office)
    return {
      k: "council",
      name: (A.COUNCIL[pc.office] || {}).name || "Councillor",
      path: "court",
    };
  if (pc.job) {
    const P = A.pathOfCareer ? A.pathOfCareer(pc.job.c) : "common";
    return {
      k: P,
      name: GD.CAREERS[pc.job.c].ranks[pc.job.r][0],
      path: P,
    };
  }
  return pc.flags.unfree
    ? {
        k: "unfree",
        name: pc.flags.unfree === "slave" ? "Slave" : "Serf",
      }
    : pc.noble && pc.noble.rung >= 2
      ? {
          k: "lord",
          name: A.nobleTitle ? A.nobleTitle(pc) : "Lord",
          path: "lands",
        }
      : {
          k: "idle",
          name: "Without a post",
        };
};

A.leaveRolesFor = function (pc, newRole, quiet) {
  const say = (t, c) => {
    if (!quiet && pc.id === A.S.pc) A.log(t, c || "warn");
  };
  if (newRole !== "army" && pc.mil && !pc.mil.merc) {
    const t = GD.MIL[pc.mil.rank].title;
    if (
      ((pc.veteran = {
        rank: pc.mil.rank,
        years: pc.mil.years,
        battles: pc.mil.battles,
      }),
      pc.mil.div)
    ) {
      const d = A.divById && A.divById(pc.mil.div);
      if (d && d.cmd === pc.id) d.cmd = null;
    }
    for (const a of A.S.armies || []) {
      if (a.gen === pc.id && newRole !== "ruler") a.gen = null;
      if (a.sub === pc.id) a.sub = null;
    }
    pc.mil = null;
    say(
      newRole === "ruler"
        ? `You lay down your commission as ${t}. As sovereign you command every army of the realm.`
        : `You resign your commission as ${t}.`,
    );
  }
  if (
    (newRole !== "company" && pc.mil && pc.mil.merc && ((pc.mil = null), say("You leave the free company.")),
    newRole !== "company" && pc.company && newRole === "ruler")
  ) {
    const r = A.realm(pc.ruler);
    if (r) r.army += pc.company.men || 0;
    say(`Your company, ${pc.company.name}, becomes the royal guard.`, "good");
    pc.company = null;
  }
  if (pc.job && newRole !== "job") {
    const C = GD.CAREERS[pc.job.c];
    say(`You put aside your work as ${C.ranks[pc.job.r][0].toLowerCase()}.`);
    pc.job = null;
  }
  if (pc.office && newRole !== "council" && newRole !== "army-marshal") {
    const r = A.realm(pc.realm);
    if (r && r.council && r.council[pc.office] === pc.id) delete r.council[pc.office];
    if (newRole !== "ruler") say(`You give up your seat as ${(A.COUNCIL[pc.office] || {}).name || "councillor"}.`);
    pc.office = null;
  }
  if (
    newRole === "ruler" &&
    (pc.school &&
      (say(`You leave ${pc.school.name}: kings are taught by no master but the crown.`), (pc.school = null)),
    pc.faction && A.leaveFaction)
  )
    try {
      A.leaveFaction();
    } catch {
      pc.faction = null;
    }
};

A.roleCheck = function (pc) {
  if (!(!pc || !pc.alive)) {
    if (pc.ruler) {
      if (pc.mil || pc.job || pc.office || (pc.company && pc.company.men)) A.leaveRolesFor(pc, "ruler");
      return;
    }
    if (
      (pc.mil && !pc.mil.merc && pc.job && (pc.job = null),
      pc.mil && pc.company && (pc.mil = null),
      pc.mil && !pc.mil.merc && pc.office && pc.office !== "marshal")
    ) {
      const seat = (A.COUNCIL[pc.office] || {}).name || "councillor";
      A.log(`Your seat as ${seat} leaves no time for the army. You resign your commission.`, "warn");
      A.leaveRolesFor(pc, "council");
    }
  }
};

A.onDay = A.onDay || [];

A.onDay.push(pc => A.roleCheck(pc));

A.roleBlock = function (pc, want) {
  return pc.ruler
    ? {
        army: "You are the sovereign: every army is already yours.",
        company: "A crowned head does not sell its sword.",
        job: "A ruler has no time for a trade.",
        council: "The council serves you; you do not sit on it.",
        crime: "Beneath a crown.",
      }[want] || ""
    : want === "job" && pc.mil && !pc.mil.merc
      ? "You are under arms. Resign your commission first (the War or Arms page)."
      : want === "job" && pc.company
        ? "You lead a free company."
        : want === "army" && pc.office && pc.office !== "marshal"
          ? "You sit on the council. Give up the seat first."
          : want === "army" && pc.company
            ? "You already lead your own company."
            : want === "company" && pc.mil && !pc.mil.merc
              ? "Desert the realm's army? Resign your commission first."
              : "";
};

GD.ACT_GATE = {
  lift: {
    max: 4,
    why: "Hauling stones is for laborers. Train with the masters of arms instead.",
  },
  chores: {
    max: 4,
    why: "Others do the chores in your household.",
  },
  play: {},
  tavern: {
    max: 5,
    not: ["ruler", "council"],
    why: "Not with a crown on your head. Hold a feast instead.",
  },
  gamble: {
    not: ["ruler"],
    why: "The crown does not throw dice in the yard.",
  },
  make_friend: {
    not: ["ruler"],
    why: "Kings have courtiers, not friends. Cultivate your court instead.",
  },
  crime_pick: {
    max: 3,
    not: ["ruler", "council", "army", "lord"],
    why: "Beneath your station — and your neck.",
  },
  crime_burgle: {
    max: 3,
    not: ["ruler", "council", "army", "lord"],
    why: "Beneath your station — and your neck.",
  },
  crime_rob: {
    max: 4,
    not: ["ruler", "council", "lord"],
    why: "Beneath your station.",
  },
  crime_smuggle: {
    max: 5,
    not: ["ruler", "council"],
    why: "Beneath your station.",
  },
  trade_venture: {
    not: ["ruler"],
    why: "The treasury, not your purse, trades for the realm.",
  },
  moneylend: {
    not: ["ruler"],
    why: "The crown borrows; it does not lend at interest.",
  },
  school: {
    not: ["ruler", "council"],
    why: "You command masters; you do not enroll with them.",
  },
  travel: {
    not: ["ruler", "army"],
    why: "Your duties keep you where you are.",
  },
  explore: {
    not: ["ruler", "council"],
    why: "The realm cannot spare you for months in the wilds.",
  },
  duel: {
    not: ["ruler"],
    why: "A sovereign does not duel. Name a champion.",
  },
  enlist: {
    not: ["ruler", "council", "company"],
    min: 0,
    why: "Not in your position.",
  },
  merc: {
    not: ["ruler", "council", "army"],
    why: "Not in your position.",
  },
  found_company: {
    not: ["ruler", "council", "army"],
    why: "Not in your position.",
  },
  seize_land: {
    not: ["ruler"],
    why: "You already rule.",
  },
  plot_throne: {
    not: ["ruler"],
    why: "You already rule.",
  },
  court_love: {},
};

A.EV_RX = {
  tavern:
    /\b(tavern|alehouse|ale-house|taproom|tap-room|the inn\b|an inn\b|wine-?shop|drinking[- ]house|beer[- ]hall|dicing den)/i,
  street: /\b(in the street|street corner|the market square|at the fair\b|in the gutter|back alley|alley\b)/i,
  subordinate:
    /\b(your (master|mistress|overseer|foreman|employer|bailiff|reeve)\b|the reeve\b|the overseer\b|the foreman\b|your turn on the watch|your shift\b|day'?s wage|wages\b|hires? you\b|hire your|pay you (a|two|three|ten)\b|the lord'?s men\b|rents are reckoned|your lord'?s steward)/i,
  errand:
    /\b(asks you to carry|carry (a|his|her|the) (sealed )?(letter|message|parcel)|run an errand|wants a (runner|porter)|for a few coins)/i,
  favor:
    /\b(lord|lady|baron|baroness|count|countess|duke|duchess|prince|princess|knight|nobleman|noblewoman|marquis)\b[^.!?]{0,70}\b(asks you|begs you|needs your|seeks your|wants you to|asks a favou?r|for a favou?r|requests your)/i,
  menace:
    /\b(threatens? you|a knife (at|to) your|footpad|cutpurse|robs? you|mugg|shakes you down|a thug|bully|corner(s|ed) you)/i,
};

A.CX_RX = {
  ruler:
    /C\.ruler\(|\bp\.ruler\b|ruler\(p|isRuler|myRealm\(|realmFaction|C\.authority|C\.infamy|C\.coalition|C\.tributary|C\.overlord|C\.allies\(/,
  high: /C\.noble\(|C\.rich\(|C\.office\(|NB\(|['"]noble['"]|['"]royal['"]|['"]gentry['"]|\.noble\b|famHead|rung|C\.famKind\(p, ?'(noble|royal|great)/,
  low: /C\.poor\(|C\.unfree\(|['"]serf['"]|['"]slave['"]|['"]peasant['"]|['"]artisan['"]|\bserf\(|\bfree\(p\)|\bpoor\(/,
  job: /C\.job\(|C\.jobRank\(|C\.ownShop\(|C\.rep\(|\.job\b/,
  mil: /C\.soldier\(|\.mil\b|milRank|C\.atWar\(/,
  child: /C\.child\(|C\.young\(|C\.teen\(|KID\(|TEEN\(|kid\(|ageAdj\(p\) *< *1[0-6]/,
};

A.evAudience = function (e) {
  if (e._aud) return e._aud;
  let txt = "";
  try {
    txt =
      (typeof e.text == "function" ? e.text.toString() : String(e.text || "")) +
      " " +
      (typeof e.title == "function" ? "" : e.title || "");
  } catch {
    txt = "";
  }
  const cs = e.cond ? e.cond.toString() : "",
    a = {
      cond: {},
      txt: {},
    };
  for (const k in A.EV_RX) a.txt[k] = A.EV_RX[k].test(txt);
  for (const k in A.CX_RX) a.cond[k] = A.CX_RX[k].test(cs);
  a.classed = a.cond.ruler || a.cond.high || a.cond.low || a.cond.job || a.cond.mil;
  Object.defineProperty(e, "_aud", {
    value: a,
    enumerable: false,
    configurable: true,
    writable: true,
  });
  return a;
};

A.evFit = function (e, pc) {
  const a = A.evAudience(e),
    cls = A.classOf(pc),
    rk = A.role(pc).k,
    T = a.txt,
    C = a.cond;
  let w = 1;
  if (rk === "child" && (T.tavern || T.favor || (T.subordinate && !C.child))) return 0;
  if (cls >= 9) {
    if ((!C.ruler && (T.tavern || T.street || T.subordinate || T.errand || T.menace)) || C.low || (C.job && !C.ruler))
      return 0;
    w *= C.ruler ? 3 : C.high ? 1.6 : a.classed ? 1 : 0.3;
  } else if (cls >= 6) {
    if (
      (!C.high && !C.ruler && (T.subordinate || T.errand)) ||
      (!C.high && (T.tavern || T.street || T.menace) && (w *= 0.15), C.low)
    )
      return 0;
    w *= C.high ? 2 : a.classed ? 1 : 0.55;
  } else if (cls >= 4) {
    if (T.subordinate && !C.job && !C.low) w *= 0.3;
    w *= C.high ? 1.4 : 1;
  } else {
    if (
      T.favor &&
      !C.high &&
      !C.job &&
      !C.mil &&
      !(
        pc.fame >= 35 ||
        pc.office ||
        (pc.job &&
          ["courtier", "servant", "envoy", "spy", "steward", "scribe", "lawyer", "healer", "knight"].includes(
            pc.job.c,
          )) ||
        A.relsOf(pc, ["lord", "councillor", "master", "mentor"]).some(x => x.p.alive && A.classOf(x.p) >= 5)
      )
    )
      return 0;
    w *= C.low ? 1.5 : 1;
  }
  if (rk === "army" && C.mil) w *= 2;
  if (rk === "company" && C.mil) w *= 1.6;
  if (pc.job && C.job) w *= 1.8;
  if (rk === "ruler" && C.ruler) w *= 1.5;
  return w;
};

GD.INTENSITY = {
  rest: {
    name: "Rest",
    mul: 0.15,
    happy: 0.04,
    health: 0.12,
    inj: 0,
    aim: 1.25,
    desc: "Sleep, eat, heal. Almost no training; your pursuit gets your full days.",
  },
  light: {
    name: "Light",
    mul: 0.6,
    happy: 0.01,
    health: 0.03,
    inj: 0,
    aim: 1.1,
    desc: "An hour a day. Slow gains, a fresh mind.",
  },
  steady: {
    name: "Steady",
    mul: 1,
    happy: 0,
    health: 0,
    inj: 2e-4,
    aim: 1,
    desc: "The honest middle. Real gains, little risk.",
  },
  hard: {
    name: "Hard",
    mul: 1.4,
    happy: -0.02,
    health: -0.01,
    inj: 8e-4,
    aim: 0.75,
    desc: "Before dawn and after dark. Faster gains; tired, grumpy, and sometimes hurt.",
  },
  brutal: {
    name: "Brutal",
    mul: 1.8,
    happy: -0.05,
    health: -0.04,
    inj: 0.0025,
    aim: 0.45,
    desc: "Everything for the training. Great gains — if your body holds.",
  },
};

GD.TRAIN_STATS = {
  str: "Strength",
  spd: "Speed",
  sta: "Stamina",
  ins: "Combat instincts",
  int: "Intelligence",
  wil: "Willpower",
};

GD.AIMS = {
  advance: {
    name: "Push for advancement",
    ic: "star",
    desc: "Volunteer, stay late, be seen doing it. Merit in your post rises faster; your superiors notice.",
    avail: pc =>
      (pc.job || pc.mil || pc.office || pc.company) && !pc.ruler
        ? ""
        : pc.ruler
          ? "You are at the top."
          : "You hold no post.",
    rate: pc => 1 + (A.skill(pc, "persuasion") + A.skill(pc, "etiquette")) / 300,
    need: 140,
    day: pc => {
      if (pc.job) pc.job.merit = (pc.job.merit || 0) + 0.04;
      if (pc.mil) pc.mil.merit += 0.05;
    },
    brk: pc => A.flowEvent(pc, "advance"),
  },
  patron: {
    name: "Win a patron",
    ic: "handshake",
    desc: "Cultivate someone above you. A patron speaks for you when posts open and shields you when you stumble.",
    avail: pc => (A.isAdult(pc) && !pc.ruler ? "" : "Rulers are patrons; they do not need one."),
    rate: pc =>
      0.8 +
      (A.skill(pc, "persuasion") + A.skill(pc, "etiquette") + A.skill(pc, "intrigue") * 0.5) / 250 +
      pc.looks / 400,
    need: 160,
    brk: pc => A.findPatron(pc),
  },
  wealth: {
    name: "Turn a coin",
    ic: "coins",
    desc: "Side deals, a stake in a cargo, lending to neighbors. Coin trickles in; now and then a real chance comes.",
    avail: pc => (A.isAdult(pc) && !pc.flags.unfree ? "" : "You own nothing of your own."),
    rate: pc => 0.8 + A.skill(pc, "trade") / 120,
    need: 150,
    day: pc => {
      pc.coin += Math.max(0, (A.skill(pc, "trade") / 60 + A.classOf(pc) * 0.15) * A.rf(0.2, 1.4));
    },
    brk: pc => A.flowEvent(pc, "wealth"),
  },
  renown: {
    name: "Seek renown",
    ic: "flag",
    desc: "Tourneys, wagers, deeds done in public. Your name travels — and invitations follow it.",
    avail: pc => (A.isAdult(pc) && !pc.flags.unfree ? "" : "The unfree are not allowed renown."),
    rate: pc => 0.8 + pc.fame / 120 + A.skill(pc, "music") / 300,
    need: 170,
    day: pc => {
      if (A.chance(0.02)) A.fame(pc, 0.3);
    },
    brk: pc => A.flowEvent(pc, "renown"),
  },
  faith: {
    name: "Devotion",
    ic: "sun",
    desc: "Prayer, vigils, alms. Piety grows; the faith may call you.",
    avail: pc => (A.age(pc) >= 8 ? "" : "Too young."),
    rate: pc => 1 + A.skill(pc, "faith") / 150,
    need: 150,
    day: pc => {
      pc.piety = Math.min(100, pc.piety + 0.03);
      if (A.chance(0.01)) A.trainSkill(pc, "faith", 0.5);
    },
    brk: pc => A.flowEvent(pc, "faith"),
  },
  love: {
    name: "Look for love",
    ic: "heart",
    desc: "Dances, glances, a walk after the service. Someone may look back.",
    avail: pc => (A.isAdult(pc) ? "" : "Too young."),
    rate: pc => 0.8 + pc.looks / 150 + A.skill(pc, "persuasion") / 300,
    need: 120,
    brk: pc => {
      const cand = A.makeLoveInterest(pc);
      if (cand)
        A.queue({
          type: "event",
          ev: "meet_love",
          forced: true,
          ctx: {
            pid: cand.id,
          },
        });
    },
  },
  study: {
    name: "Study",
    ic: "book-open",
    desc: "Letters, law, history, numbers. Literacy first — then the doors only readers can open.",
    avail: pc => (A.age(pc) >= 6 ? "" : "Too young."),
    rate: pc => 0.8 + A.stat(pc, "int") / 80,
    need: 140,
    day: pc => {
      if (pc.literate && A.chance(0.3)) A.trainSkill(pc, "learning", 0.15);
    },
    brk: pc => {
      if (!pc.literate) {
        pc.literate = true;
        A.log(
          "You can read now — slowly, lips moving, but the marks on the page are words. Doors open for people who can read.",
          "big",
        );
        return;
      }
      A.flowEvent(pc, "study");
    },
  },
  family: {
    name: "Tend your family",
    ic: "house",
    desc: "Time at home. Spouse and children grow closer; the house is happier.",
    avail: pc => (pc.spouse || pc.children.length || pc.parents.length ? "" : "No family near you."),
    rate: pc => 1,
    need: 150,
    day: pc => {
      if (((pc.happy = Math.min(100, pc.happy + 0.02)), A.chance(0.02)))
        for (const { p } of A.relsOf(pc, ["spouse", "child", "mother", "father"]).slice(0, 4))
          if (p.alive) A.addOp(pc, p, 1);
    },
    brk: pc => A.flowEvent(pc, "family"),
  },
  scheme: {
    name: "Scheme",
    ic: "eye",
    desc: "Gather secrets, find the weak, plant the seed. Intrigue grows; plots ripen.",
    avail: pc => (A.isAdult(pc) ? "" : "Too young."),
    rate: pc => 0.7 + (A.skill(pc, "intrigue") + A.skill(pc, "deception")) / 200,
    need: 180,
    day: pc => {
      if (A.chance(0.05)) A.trainSkill(pc, "intrigue", 0.6);
    },
    brk: pc => A.flowEvent(pc, "scheme"),
  },
  freedom: {
    name: "Plan your freedom",
    ic: "route",
    desc: "Save every coin, learn the roads, find a friend outside. One day the chance will come.",
    avail: pc => (pc.flags.unfree ? "" : "You are free."),
    rate: pc => 0.8 + (A.skill(pc, "stealth") + A.skill(pc, "survival")) / 200 + A.stat(pc, "wil") / 200,
    need: 200,
    day: pc => {
      if (A.chance(0.03)) pc.coin += 1;
    },
    brk: pc => A.flowEvent(pc, "freedom"),
  },
  govern: {
    name: "Govern the realm",
    ic: "crown",
    desc: "Hear petitions, audit the books, ride the provinces. Stability, income and the lords' goodwill.",
    avail: pc => (pc.ruler ? "" : "Only a ruler governs."),
    rate: pc => 1 + A.skill(pc, "stewardship") / 150,
    need: 120,
    day: pc => {
      const r = A.realm(pc.ruler);
      if (r && A.chance(0.03)) r.stability = Math.min(100, r.stability + 0.4);
      if (A.chance(0.03)) A.trainSkill(pc, "stewardship", 0.4);
    },
    brk: pc => A.flowEvent(pc, "govern"),
  },
  statecraft: {
    name: "Statecraft",
    ic: "globe",
    desc: "Letters to foreign courts, envoys, gifts. Relations warm; summits and treaties follow.",
    avail: pc =>
      pc.ruler || pc.office === "chancellor" ? "" : "Only a ruler or the chancellor speaks for the realm abroad.",
    rate: pc => 1 + A.skill(pc, "diplomacy") / 120,
    need: 130,
    day: pc => {
      if (A.chance(0.03)) A.trainSkill(pc, "diplomacy", 0.4);
    },
    brk: pc => A.flowEvent(pc, "statecraft"),
  },
  warplan: {
    name: "Prepare for war",
    ic: "swords",
    desc: "Maps, musters, spies on the border. The host grows sharper; a war aim appears.",
    avail: pc =>
      pc.ruler || (pc.mil && pc.mil.rank >= 7) || pc.office === "marshal" ? "" : "Only the war council plans wars.",
    rate: pc => 1 + (A.skill(pc, "tactics") + A.skill(pc, "command")) / 250,
    need: 140,
    day: pc => {
      const r = A.realm(pc.ruler || (pc.mil && pc.mil.realm));
      if (r && r.forces && A.chance(0.05)) r.forces.xp = Math.min(200, r.forces.xp + 0.5);
      if (A.chance(0.03)) A.trainSkill(pc, A.pick(["tactics", "command", "logistics"]), 0.4);
    },
    brk: pc => A.flowEvent(pc, "warplan"),
  },
};

A.plan = function (pc) {
  if (!pc.plan)
    pc.plan = {
      train: null,
      intensity: "steady",
      aim: null,
      prog: {},
      need: {},
      q: 1,
      lastQ: "",
    };
  return pc.plan;
};

A.trainTargets = function (pc) {
  const out = [];
  for (const s in GD.TRAIN_STATS)
    out.push({
      k: s,
      kind: "stat",
      name: GD.TRAIN_STATS[s],
    });
  for (const cat in GD.SKILL_CATS)
    for (const k of GD.SKILL_CATS[cat])
      out.push({
        k,
        kind: "skill",
        name: GD.SKILLS[k],
        cat,
      });
  return out;
};

A.setPlan = function (part, v) {
  const pc = A.pc(),
    P = A.plan(pc);
  // [X1 baked patch core/03-engine-fixes ENG-PLAN-FOLLOWS-LIFE] The automatic training plan was filled once and
  // never revisited, so the "athletics" a child gets at 6 stayed for life (every bot life maxed athletics and
  // learning by 30). The plan now remembers what it chose automatically and moves on (to the troop weapon, the trade
  // skill, or melee) until the player picks something; a player choice is never overridden. Old saves: only a stale
  // childhood "athletics" is treated as automatic.
  if (part === "train")
    return v && !GD.SKILLS[v] && !GD.TRAIN_STATS[v]
      ? {
          ok: false,
        }
      : ((P.train = v || null),
        (P.trainAuto = null),
        {
          ok: true,
        });
  if (part === "intensity")
    return GD.INTENSITY[v]
      ? !A.isAdult(pc) && v === "brutal"
        ? {
            ok: false,
            msg: "Too young for that.",
          }
        : ((P.intensity = v),
          {
            ok: true,
          })
      : {
          ok: false,
        };
  if (part === "aim") {
    if (v && !GD.AIMS[v])
      return {
        ok: false,
      };
    if (v) {
      const why = GD.AIMS[v].avail(pc);
      if (why)
        return {
          ok: false,
          msg: why,
        };
    }
    P.aim = v || null;
    return {
      ok: true,
    };
  }
  return {
    ok: false,
  };
};

// [X1 baked patch core/03-engine-fixes ENG-PLAN-FOLLOWS-LIFE] The automatic training plan was filled once and
// never revisited, so the "athletics" a child gets at 6 stayed for life (every bot life maxed athletics and
// learning by 30). The plan now remembers what it chose automatically and moves on (to the troop weapon, the trade
// skill, or melee) until the player picks something; a player choice is never overridden. Old saves: only a stale
// childhood "athletics" is treated as automatic.
A.defaultPlan = function (pc) {
  const P = A.plan(pc);
  if (
    ((!P.train || P.train === P.trainAuto || (P.trainAuto === void 0 && P.train === "athletics" && A.age(pc) >= 12)) &&
      A.age(pc) >= 6 &&
      (P.train = P.trainAuto =
        pc.mil
          ? GD.TROOP_SKILL[pc.mil.troop] || "spear"
          : pc.job && GD.CAREERS[pc.job.c] && GD.CAREERS[pc.job.c].skill
            ? GD.CAREERS[pc.job.c].skill
            : A.age(pc) < 12
              ? "athletics"
              : "melee"),
    !P.aim)
  ) {
    for (const k of pc.ruler
      ? ["govern"]
      : pc.flags.unfree
        ? ["freedom"]
        : pc.job || pc.mil || pc.office
          ? ["advance"]
          : A.isAdult(pc)
            ? ["patron", "wealth"]
            : ["study"])
      if (!GD.AIMS[k].avail(pc)) {
        P.aim = k;
        break;
      }
  }
};

A.planMonth = function (pc) {
  const P = A.plan(pc);
  if (!P.train) return;
  const isSkill = !!GD.SKILLS[P.train],
    S = A.sessionQ
      ? A.sessionQ(pc, isSkill ? "practice" : "run", isSkill ? P.train : null)
      : {
          q: 1,
          parts: [],
          tag: "",
        };
  P.q = S.q;
  P.qParts = S.parts;
  P.qTag = S.tag;
  if (S.tag === "breakthrough" && A.chance(0.5))
    A.log(
      `${GD.MONTHS[A.monthOf(A.today()).m]}: a breakthrough in your ${isSkill ? GD.SKILLS[P.train].toLowerCase() : GD.TRAIN_STATS[P.train].toLowerCase()} training. Something you could not do last month, you do without thinking.`,
      "good",
    );
  if (isSkill) {
    pc.habitY = pc.habitY || {};
    pc.habitY[P.train] = A.S.year;
  }
};

A.planDay = function (pc) {
  if (!pc.alive || A.age(pc) < 4) return;
  const P = A.plan(pc),
    I = GD.INTENSITY[P.intensity] || GD.INTENSITY.steady,
    young = A.age(pc) < GD.RACES[pc.race].adult;
  if (P.train && !pc.prison) {
    const mul = I.mul * (P.q || 1) * (young ? 0.75 : 1) * (pc.health < 30 ? 0.3 : 1);
    if (((A._growMul = 1), GD.SKILLS[P.train])) {
      A.trainSkill(pc, P.train, 0.105 * mul);
      const [s1, s2] = GD.SKILL_STAT[P.train] || ["int", "wil"];
      A.train(pc, s1, 0.006 * mul);
      A.train(pc, s2, 0.004 * mul);
    } else A.train(pc, P.train, 0.022 * mul);
  }
  if (
    ((pc.happy = A.clamp(pc.happy + I.happy, 0, 100)),
    (I.health > 0 || pc.health > 40) && (pc.health = A.clamp(pc.health + I.health, 0, A.maxHealth(pc))),
    I.inj && A.chance(I.inj * (pc.health < 50 ? 2 : 1)))
  ) {
    const w = A.addWound && A.chance(0.2) ? A.addWound(pc, A.pick(["bad_knee", "back", "broken_ribs"])) : null,
      k = A.ri(4, 12);
    pc.health = Math.max(10, pc.health - k);
    A.log(`You push too hard in training and hurt yourself${w ? ": " + w : ""}.`, "bad");
  }
  if (P.aim) {
    const D = GD.AIMS[P.aim];
    if (!D || D.avail(pc)) {
      P.aim = null;
      return;
    }
    const need = P.need[P.aim] || D.need;
    if (
      ((P.prog[P.aim] = (P.prog[P.aim] || 0) + D.rate(pc) * I.aim * (pc.prison ? 0.2 : 1)),
      D.day && D.day(pc),
      P.prog[P.aim] >= need)
    ) {
      P.prog[P.aim] = 0;
      P.need[P.aim] = Math.round(need * 1.15);
      try {
        D.brk(pc);
      } catch (e) {
        console.error("aim", P.aim, e);
      }
    }
  }
};

A.onDay = A.onDay || [];

A.onMonth = A.onMonth || [];

A.onDay.push(pc => A.planDay(pc));

A.onMonth.push(pc => {
  A.defaultPlanIfAuto(pc);
  A.planMonth(pc);
});

// [X1 baked patch core/03-engine-fixes ENG-PLAN-FOLLOWS-LIFE] The automatic training plan was filled once and
// never revisited, so the "athletics" a child gets at 6 stayed for life (every bot life maxed athletics and
// learning by 30). The plan now remembers what it chose automatically and moves on (to the troop weapon, the trade
// skill, or melee) until the player picks something; a player choice is never overridden. Old saves: only a stale
// childhood "athletics" is treated as automatic.
A.defaultPlanIfAuto = function (pc) {
  const P = A.plan(pc);
  if (P.auto !== false && (!P.train || P.train === P.trainAuto || P.trainAuto === void 0 || !P.aim)) A.defaultPlan(pc);
};

A.findPatron = function (pc) {
  const cur = A.patronOf(pc);
  if (cur) {
    if (pc.rel[cur.id]) A.addOp(pc, cur, 15);
    A.log(`${A.fullName(cur, false)}, your patron, speaks your name in the right room again.`, "good");
    if (pc.job) pc.job.merit = (pc.job.merit || 0) + 20;
    if (pc.mil) pc.mil.merit += 20;
    return;
  }
  const cls = A.classOf(pc),
    r = A.realm(pc.realm);
  let cands = [];
  const sup = A.superior ? A.superior(pc) : null;
  if ((sup && cands.push(sup), r && r.council))
    for (const k in r.council) {
      const p2 = A.P(r.council[k]);
      if (p2 && p2.alive && p2.id !== pc.id) cands.push(p2);
    }
  if (cls >= 4)
    for (const h of Object.values(A.S.houses)
      .filter(h2 => h2.realm === pc.realm && !h2.extinct)
      .slice(0, 30)) {
      const p2 = A.houseHead(h.id);
      if (p2 && p2.alive && p2.id !== pc.id) cands.push(p2);
    }
  cands = [...new Set(cands)].filter(
    p2 => A.classOf(p2) >= Math.min(9, cls + 1) && !(pc.rel[p2.id] && pc.rel[p2.id].patron),
  );
  let p = cands.length ? A.pick(cands) : null;
  if (!p) {
    p = A.makeAcquaintance ? A.makeAcquaintance(pc, "mentor") : null;
    if (p)
      p.occ =
        cls <= 2
          ? A.pick(["the knight of the manor", "the parish priest", "the miller, who lends money", "the reeve"])
          : cls <= 3
            ? A.pick(["a master of the guild", "an alderman", "a rich merchant"])
            : A.pick(["a baron of the realm", "a judge of the crown", "a bishop"]);
  }
  if (p) {
    if (pc.rel[p.id]) A.addOp(pc, p, 25);
    else A.link(pc, p, "mentor", 40, "student");
    pc.rel[p.id].patron = true;
    pc.flags.patron = p.id;
    A.log(
      `${A.fullName(p)}${p.occ ? ", " + p.occ + "," : ""} takes an interest in you. You have a patron now: someone who will say your name in rooms you cannot enter.`,
      "big",
    );
  }
};

A.patronOf = function (pc) {
  const id = pc.flags.patron,
    p = id ? A.P(id) : null;
  return p && p.alive ? p : null;
};

A.flowEvent = function (pc, kind) {
  const pool = [];
  for (const id in A.EV) {
    const e2 = A.EV[id];
    if (!e2.flow || !e2.flow.includes(kind) || (e2.once && pc.flags.ev && pc.flags.ev[id])) continue;
    const S = A.S;
    if (!(S.evRecent && S.evRecent[id] && S.year - S.evRecent[id] < (e2.cool || 4))) {
      try {
        if (e2.cond && !e2.cond(pc, A.C)) continue;
      } catch {
        continue;
      }
      if (!(A.evFit && A.evFit(e2, pc) <= 0)) pool.push(e2);
    }
  }
  // [X1 baked patch events/25-variety-guard VAR-POOL-RECENCY] A.dutyEvent and A.flowEvent pick from small per-job
  // and per-path pools with 3- and 4-year cooldowns, so the same duty came back every 3 years. Both now weigh each
  // candidate by A.evRecency: a quarter if seen in the last 10 years, times the shape guard. The pools are kept;
  // only the preference changes.
  const e = A.wpick(pool, x => (x.w || 1) * (A.evRecency ? A.evRecency(x, pc) : 1));
  if (e) {
    A.S.evRecent = A.S.evRecent || {};
    A.S.evRecent[e.id] = A.S.year;
    A.queue({
      type: "event",
      ev: e.id,
      forced: true,
    });
    return true;
  }
  if (kind === "wealth") {
    const g = Math.round(20 + A.skill(pc, "trade") * 3 * A.rf(0.5, 1.5));
    pc.coin += g;
    A.log(`A deal comes good: +${A.coin(g)}.`, "good");
  } else if (kind === "renown") {
    A.fame(pc, 3);
    A.log("People in the market know your name now.", "good");
  } else if (kind === "faith") {
    pc.piety = Math.min(100, pc.piety + 5);
    if (A.willGrow) A.willGrow(pc, 1, "faith");
  } else if (kind === "advance") {
    if (pc.job) pc.job.merit = (pc.job.merit || 0) + 15;
    if (pc.mil) pc.mil.merit += 15;
    A.log("Your superiors notice the extra hours. (Merit +15)", "good");
  } else if (kind === "family") {
    pc.happy = Math.min(100, pc.happy + 8);
    A.log("A good season at home.", "good");
  } else if (kind === "scheme") {
    A.trainSkill(pc, "intrigue", 3);
    A.log("You learn a secret worth keeping.", "good");
    pc.flags.secrets = (pc.flags.secrets || 0) + 1;
  } else if (kind === "study") A.trainSkill(pc, "learning", 3);
  else if (kind === "govern") {
    const r = A.realm(pc.ruler);
    if (r) {
      r.stability = Math.min(100, r.stability + 4);
      r.treasury += Math.round(r.income * 0.02);
    }
    A.log("A good season of government: petitions heard, accounts balanced.", "good");
  } else if (kind === "statecraft") {
    const r = A.realm(pc.ruler || pc.realm);
    if (r) {
      const o = A.pick(A.neighbors(r.id).map(A.realm).filter(Boolean));
      if (o) {
        A.addRel(r.id, o.id, 8);
        A.log(`Your letters warm the court of ${o.name}. (Relations +8)`, "good");
      }
    }
  } else if (kind === "warplan") {
    const r = A.realm(pc.ruler || (pc.mil && pc.mil.realm));
    if (r && r.forces) {
      r.forces.xp = Math.min(200, r.forces.xp + 10);
      A.log("Your war plans are drawn and redrawn. (Army experience +10)", "good");
    }
  } else if (kind === "freedom") {
    pc.flags.escapeReady = A.S.year;
    A.log(
      "You have a route out, a friend at the river and a little coin sewn into your hem. When you run, you will not run blind.",
      "good",
    );
  }
  return false;
};

A.planSession = function () {
  const pc = A.pc(),
    P = A.plan(pc);
  if (!P.train)
    return {
      ok: false,
      msg: "Choose what you train first.",
    };
  const map = {
    str: "lift",
    spd: "run",
    sta: "run",
    wil: "meditate",
    int: "study",
    ins: "train_yard",
  };
  return GD.SKILLS[P.train] ? A.doActivity("practice", P.train) : A.doActivity(map[P.train] || "train_yard");
};

GD.PATHS = {
  army: {
    name: "The Army",
    ic: "shield",
    desc: "From spear-carrier to Marshal. War makes careers and ends them.",
    careers: [],
  },
  court: {
    name: "Court & Government",
    ic: "landmark",
    desc: "The pen and the ear of the crown. Clerks become chancellors, and chancellors steer realms.",
    careers: ["scribe", "courtier", "envoy", "steward", "lawyer", "spy"],
  },
  church: {
    name: "The Faith",
    ic: "sun",
    desc: "Novice to patriarch. The faith has its own lands, courts and wars.",
    careers: ["clergy"],
  },
  guild: {
    name: "Guild & Trade",
    ic: "coins",
    desc: "Apprentice, journeyman, master, guildmaster, banker. Coin opens doors birth does not.",
    careers: ["merchant", "smith", "mason", "carpenter", "weaver", "bowyer", "brewer", "artist", "engineer"],
  },
  learning: {
    name: "Learning & Healing",
    ic: "book-open",
    desc: "Physicians, tutors and masters of colleges: quiet power at every court.",
    careers: ["healer", "teacher"],
  },
  sea: {
    name: "The Sea",
    ic: "route",
    desc: "Ship's boy to captain. The sea pays well and drowns the careless.",
    careers: ["sailor"],
  },
  glory: {
    name: "Arms & Glory",
    ic: "flag",
    desc: "Tourneys, pits, hunts and far roads: a name won with your own hands.",
    careers: ["knight", "pitfighter", "hunter", "explorer", "minstrel"],
  },
  under: {
    name: "The Underworld",
    ic: "eye",
    desc: "Cutpurse to king of the gutter. Fast money, short lives.",
    careers: ["thief", "pirate", "bounty"],
  },
  company: {
    name: "Free Companies",
    ic: "swords",
    desc: "Swords for hire. A company of your own can carve out a realm.",
    careers: ["mercenary"],
  },
  common: {
    name: "Common Work",
    ic: "hammer",
    desc: "Field, herd, net, kitchen and mine. Honest, slow — and a place to start from.",
    careers: ["farm", "herd", "fish", "labor", "servant", "miner", "cook", "horsemaster"],
  },
};

A.CAREER_PATH = {};

for (const p in GD.PATHS) for (const c of GD.PATHS[p].careers) A.CAREER_PATH[c] = p;
