// The release's core, prison travel school ai: Prison, exile, travel, schools, the AI people act by, and starting a duel.
// Readable source of vendor/ardan-b593143.html with the patch layer baked in (X1, docs/DECISIONS.md D-027). Edit it here.
// Defines: A.imprison, A.exile, A.prisonYear, A.travelOptions, A.travelTo, A.schoolOptions, A.schoolSkill,
// A.joinSchool, A.schoolYear, A.choiceChoose, A.simpleClose, A.gearAvailable, A.buyGear, A.sellGear, A.buyProperty,
// A.sellProperty, A.setLifestyle, A.quietYears, GD.CAREERS (+), GD.CAREER_OFFICE, A.jobRep, A.repWord, A.addRep,
// A.careerYear2, A.ownWord, A.oppPool, A.rollOffers, A.takeOffer, A.declineOffer, A.WORK, A.workActions, A.doWork,
// A.jobStartRank, A.ACTIONS, A.MATCH, A.BEASTS, A.GAME_BEASTS, A.fighterFrom, A.fighterBeast, A.CR, A.situEdges,
// A.aiAction, A.startDuel, startDuelNow.

A.imprison = function (pc, years, why) {
  if (pc && pc.ruler && pc.id === A.S.pc) {
    A.rulerScandal(pc, why);
    return;
  }
  pc.prison = {
    until: A.S.year + years,
    why,
    since: A.S.year,
  };
  if (pc.mil) {
    A.log("Your company strikes your name from the rolls.", "bad");
    pc.mil = null;
  }
  pc.happy = A.clamp(pc.happy - 20, 0, 100);
  A.log(`You are imprisoned for ${years} year${years > 1 ? "s" : ""} (${why}).`, "bad");
};

A.exile = function (pc) {
  const opts = A.S.prov.filter(p => p.owner !== pc.realm && (p.owner === "unclaimed" || A.realm(p.owner))),
    to = A.pick(opts.filter(p => p.adj.some(j => A.S.prov[j].owner === pc.realm)).concat(opts.slice(0, 5)));
  if (to) {
    pc.home = to.id;
    pc.realm = to.owner;
    A.log(`You are cast out. You end up in ${to.name}, ${A.realmName(to.owner)}.`, "bad");
  }
  if (pc.job && !["thief", "labor", "hunter"].includes(pc.job.c)) pc.job = null;
};

A.prisonYear = function (pc) {
  if (pc.prison) {
    if (A.S.year >= pc.prison.until) {
      A.log("Your sentence is served. The door opens; the light hurts.", "good");
      pc.prison = null;
      A.willGrow(pc, 2, "prison");
      return;
    }
    pc.health = A.clamp(pc.health - A.ri(3, 12), 0, 100);
    pc.happy = A.clamp(pc.happy - 6, 0, 100);
    A.willGrow(pc, 1, "prison");
    A.queue({
      type: "event",
      ev: A.pick(["prison_escape", "prison_fight", "prison_friend", "prison_guard"]),
    });
  }
};

A.travelOptions = function (pc) {
  const here = A.prov(pc.home),
    out = [];
  for (const p of A.S.prov) {
    if (p.id === pc.home) continue;
    const d = Math.hypot(p.x - here.x, p.y - here.y),
      cost = Math.round(2 + (d / 100) * (p.coast && here.coast ? 0.5 : 1));
    out.push({
      id: p.id,
      name: p.name,
      realm: p.owner,
      d: Math.round(d),
      cost,
    });
  }
  return out.sort((a, b) => a.d - b.d);
};

A.travelTo = function (pid) {
  const pc = A.pc();
  if (pc.flags.unfree)
    return {
      ok: false,
      msg: "You are not free to leave.",
    };
  const opt = A.travelOptions(pc).find(o => o.id === pid);
  if (!opt)
    return {
      ok: false,
      msg: "Unknown place.",
    };
  if (A.isAdult(pc) && pc.coin < opt.cost)
    return {
      ok: false,
      msg: `The journey costs about ${opt.cost} suns.`,
    };
  if (A.isAdult(pc)) pc.coin -= opt.cost;
  const from = pc.realm;
  pc.home = pid;
  pc.realm = A.prov(pid).owner;
  if (pc.realm !== from) {
    pc.flags.foreign = pc.realm;
    if (pc.job && !["merchant", "sailor", "minstrel", "hunter", "thief"].includes(pc.job.c)) {
      A.log("You leave your old work behind.");
      pc.job = null;
    }
    if (pc.mil && pc.mil.realm !== pc.realm && !pc.mil.merc) {
      pc.flags.deserter = true;
      A.log("Leaving the realm's army without leave makes you a deserter.", "bad");
      pc.mil = null;
    }
  }
  A.log(
    `You travel ${A.fmt(opt.d)} km to ${opt.name}, ${A.realmName(pc.realm)}.` +
      (pc.realm !== from ? " A new realm, new laws, a new tongue." : ""),
    "good",
  );
  // [X1 baked patch map/9990-journeys JR-ROAD-SCENE] Porting: when travel is a journey with stops, the single "45%
  // of long trips get a road scene" roll at the moment of moving is skipped for a move made at the end of a journey
  // (A.JR.arriving).
  if (opt.d > 300 && !(A.JR && A.JR.arriving) && A.chance(0.45))
    A.queue({
      type: "event",
      ev: A.pick(["road_bandits", "road_inn", "road_beast", "road_stranger", "road_storm"]),
    });
  const lang = GD.LANG[A.cultureFor(pc.race === "human" ? "human" : pc.race, pc.realm)];
  if (lang && !pc.langs.includes(lang)) A.log(`You do not speak ${lang}. Learning it would help.`, "warn");
  return {
    ok: true,
  };
};

A.schoolOptions = function (pc) {
  return LORE.schools.map((s, i) => {
    let req = 30,
      ok = true,
      why = "";
    // [X1 baked patch world/99999-v2-names NAMES-ORC-SCHOOL] A.schools tells the orc schools by their realm's name
    // (/Horde|Tusk/ on s.realmName). The lore now names the Tusk Clans the Ughrak Dominion, so the test takes the new
    // name too.
    const t = s.teaches.toLowerCase(),
      dwarf = /Irondeep|Stonehold|Emberdeep/.test(s.realmName),
      elfS = /Sylvaran|Eldergrove/.test(s.realmName),
      giantS = /Frostholm|Hrimfell/.test(s.realmName),
      orcS = /Horde|Tusk|Ughrak/.test(s.realmName);
    if (dwarf && pc.race !== "dwarf") {
      ok = false;
      why = "Dwarves never teach outsiders (Judgment of the First Hall, 904).";
    }
    if (giantS && pc.race !== "giant") {
      ok = false;
      why = "Only giants learn the giants' arts.";
    }
    if (elfS && !["elf", "halfelf"].includes(pc.race)) {
      req = 70;
      why = "The elves rarely teach the short-lived.";
    }
    if (/Quickened/.test(s.name) && !A.hasBlood(pc, "quickened")) {
      req = Math.max(req, 75);
      why = "The School of the Quickened tests the line's children first.";
    }
    if (orcS && !["orc", "halforc"].includes(pc.race)) {
      req = 55;
      why = "The orcs will laugh at you first.";
    }
    if (/Oil Yard/.test(s.name) && pc.cult !== "CUL-07") {
      ok = false;
      why = "Sabrans only.";
    }
    const fee = /Lance|Lion|Blade Hall/.test(s.name) ? 120 : 30,
      skill = A.schoolSkill(s);
    return {
      i,
      s,
      ok,
      req,
      why,
      fee,
      skill,
      here: s.realm === pc.realm,
    };
  });
};

A.schoolSkill = function (s) {
  const t = (s.teaches + " " + s.name).toLowerCase();
  return /lance/.test(t)
    ? "lance"
    : /longbow|war bow|archery|bow/.test(t) && !/crossbow/.test(t)
      ? "bow"
      : /crossbow|bolt/.test(t)
        ? "xbow"
        : /pike|spear/.test(t)
          ? "spear"
          : /axe|hammer|maul|war-pick/.test(t)
            ? "axe"
            : /shield/.test(t)
              ? "shield"
              : /sword|blade|buckler/.test(t)
                ? "sword"
                : /staff|throw|hold|wrestl/.test(t)
                  ? "unarmed"
                  : /scout|night|silent|track|running|ridge|climb|rope|roof/.test(t)
                    ? "stealth"
                    : /oar|sea|sail|deck|galley|diving|swim|raft/.test(t)
                      ? "sea"
                      : /drum|signal|cipher|watch/.test(t) || /mining|engine|siege|field works|sapper/.test(t)
                        ? "tactics"
                        : /camel|horse|riding|elephant/.test(t)
                          ? "riding"
                          : /ring hunt/.test(t)
                            ? "command"
                            : "sword";
};

A.joinSchool = function (i) {
  const pc = A.pc(),
    o = A.schoolOptions(pc).find(x => x.i === i);
  if (!o)
    return {
      ok: false,
      msg: "No such school.",
    };
  if (!o.ok)
    return {
      ok: false,
      msg: o.why,
    };
  if (!o.here)
    return {
      ok: false,
      msg: `You must live in ${o.s.realmName} to study at ${o.s.name}. Travel there first.`,
    };
  if (pc.coin < o.fee && A.isAdult(pc))
    return {
      ok: false,
      msg: `The fee is ${o.fee} suns.`,
    };
  if (
    A.stat(pc, "ins") * 0.4 +
      A.stat(pc, "wil") * 0.3 +
      A.stat(pc, "spd") * 0.2 +
      A.stat(pc, "str") * 0.2 +
      A.skill(pc, o.skill) * 0.5 +
      pc.fame * 0.2 <
      o.req &&
    !A.chance(0.15)
  ) {
    A.log(`${o.s.master} watches you for a quarter hour and sends you away. "Not yet."`, "bad");
    A.willGrow(pc, 0.8, "rejection");
    return {
      ok: false,
      msg: "Rejected.",
    };
  }
  if (A.isAdult(pc)) pc.coin -= o.fee;
  pc.school = {
    i,
    years: 0,
    skill: o.skill,
    name: o.s.name,
    master: o.s.master,
    masterId: o.s.masterId,
  };
  const m = o.s.masterId ? A.personFromCast(o.s.masterId) : null;
  if (m) {
    A.link(pc, m, "mentor", 20, "student");
    pc.school.mpid = m.id;
  }
  A.log(`${o.s.master} takes you into ${o.s.name}. "${o.s.teaches}." You are part of a chain now.`, "big");
  return {
    ok: true,
  };
};

A.schoolYear = function (pc) {
  if (!pc.school) return;
  const sc = pc.school;
  sc.years++;
  A.trainSkill(pc, sc.skill, 9);
  A.train(pc, "ins", 1.4);
  A.train(pc, "spd", 0.8);
  A.train(pc, "str", 0.6);
  A.willGrow(pc, 0.6, "discipline");
  if (sc.skill === "stealth" || sc.skill === "sea") A.train(pc, "sta", 1);
  if (sc.years === 3) {
    pc.flags.chain = sc.name;
    A.log(
      `Three years at ${sc.name}: you fight like its masters now. Those who know the chain will see it in your first move.`,
      "good",
    );
  }
  const m = A.P(sc.mpid);
  if (sc.years >= 12 && A.skill(pc, sc.skill) >= 85 && ((m && !m.alive && A.chance(0.5)) || A.chance(0.025))) {
    A.log(
      `${m && !m.alive ? sc.master + " is dead. " : sc.master + " steps down. "}The students look to you. You are master of ${sc.name}.`,
      "big",
    );
    A.fame(pc, 12);
    pc.flags.schoolMaster = sc.name;
    A.ach("school_master");
    if (!pc.epithet) pc.epithet = "the Master";
  }
  if (A.chance(0.2))
    A.queue({
      type: "event",
      ev: "school_trial",
    });
};

if (typeof module < "u") module.exports = A;

A.choiceChoose = function (i) {
  const q = A.S.queue[0];
  if (!q || q.type !== "choice") return;
  A.S.queue.shift();
  const o = q.options[i];
  if (o && A.CHOICE_FN[o.fn]) A.CHOICE_FN[o.fn](o.arg);
};

A.simpleClose = function () {
  const q = A.S.queue[0];
  if (q && ["school", "travel", "msg"].includes(q.type)) A.S.queue.shift();
};

A.gearAvailable = function (pc, k) {
  const g = GD.GEAR[k];
  // [X1 baked patch core/01-replay ENG-GEAR-ROLL] A.gearAvailable rolled A.ri(0,1)<2, which is always true, so
  // drawing the Holdings tab burned random numbers for nothing.
  return g
    ? g.rare === "dwarf" &&
      pc.race !== "dwarf" &&
      !A.S.prov.some(p => p.id === pc.home && ["POL-10", "POL-28", "POL-29"].includes(p.owner)) &&
      !pc.flags.dwarfFriend &&
      !["POL-10", "POL-28", "POL-29", "POL-16", "POL-31"].includes(pc.realm)
      ? [false, "Dwarven work is rarely sold outside the holds and Ostra"]
      : g.rare === "POL-30" && !["POL-30", "POL-21", "POL-32", "POL-16"].includes(pc.realm)
        ? [false, "Chanari steel is sold in Ranpur and the great ports"]
        : g.rare === "POL-05" && pc.realm !== "POL-05" && pc.realm !== "POL-07"
          ? [false, "Yew war bows are made in Ashmere"]
          : g.rare === "elf" && pc.race !== "elf" && pc.race !== "halfelf"
            ? [false, "The elves never sell their work to outsiders"]
            : g.rare === "orc" && !["orc", "halforc"].includes(pc.race) && !["POL-11", "POL-34"].includes(pc.realm)
              ? [false, "Only sold in the orc lands"]
              : g.slot === "armor" &&
                  k === "plate" &&
                  !["noble", "royal", "gentry"].includes(pc.status) &&
                  pc.coin < 4e3
                ? [false, "Armorers make plate to order, for lords"]
                : g.giant && pc.race !== "giant"
                  ? [false, "Made for giants"]
                  : pc.race === "giant" && g.slot === "mount"
                    ? [false, "No horse can carry a giant"]
                    : k === "camel" && !["POL-17", "POL-19", "POL-24", "POL-18", "POL-12"].includes(pc.realm)
                      ? [false, "Camels are sold in the desert lands"]
                      : [true, ""]
    : [false, "Unknown"];
};

A.buyGear = function (k) {
  const pc = A.pc(),
    g = GD.GEAR[k],
    [ok, why] = A.gearAvailable(pc, k);
  if (!ok)
    return {
      ok: false,
      msg: why,
    };
  const price = Math.round(
    g.price * (A.realm(pc.realm) && A.atWar(pc.realm).length && (g.slot === "mount" || g.slot === "armor") ? 1.4 : 1),
  );
  if (pc.coin < price)
    return {
      ok: false,
      msg: `You need ${A.coin(price)}.`,
    };
  pc.coin -= price;
  const old = pc.gear[g.slot];
  if (old && old !== "fists" && old !== "none" && GD.GEAR[old]) {
    const back = Math.round(GD.GEAR[old].price * 0.35);
    pc.coin += back;
  }
  pc.gear[g.slot] = k;
  if (g.twoHand) pc.gear.shield;
  A.log(`You buy ${g.name.toLowerCase()} for ${A.coin(price)}.`);
  return {
    ok: true,
    msg: `Bought: ${g.name}`,
  };
};

A.sellGear = function (slot) {
  const pc = A.pc(),
    k = pc.gear[slot];
  if (!k || k === "fists" || k === "none")
    return {
      ok: false,
    };
  const v = Math.round((GD.GEAR[k] ? GD.GEAR[k].price : 0) * 0.4);
  pc.coin += v;
  pc.gear[slot] = slot === "weapon" ? "fists" : slot === "armor" ? "none" : null;
  A.log(`You sell your ${GD.GEAR[k].name.toLowerCase()} for ${A.coin(v)}.`);
  return {
    ok: true,
  };
};

A.buyProperty = function (k) {
  const pc = A.pc(),
    P = GD.PROPERTY[k];
  return P
    ? pc.flags.unfree
      ? {
          ok: false,
          msg: "The unfree cannot own property.",
        }
      : A.isAdult(pc)
        ? (P.ship || k === "fishboat" || k === "barge") &&
          !(A.prov(pc.home) && (A.prov(pc.home).coast || k === "barge"))
          ? {
              ok: false,
              msg: "You need to live by the water.",
            }
          : pc.coin < P.price
            ? {
                ok: false,
                msg: `You need ${A.coin(P.price)}.`,
              }
            : ((pc.coin -= P.price),
              pc.assets.push({
                k,
                name: P.name,
                y: A.S.year,
                where: A.provName(pc.home),
              }),
              A.log(`You buy a ${P.name.toLowerCase()} in ${A.provName(pc.home)} for ${A.coin(P.price)}.`, "good"),
              {
                ok: true,
              })
        : {
            ok: false,
            msg: "Too young to own property.",
          }
    : {
        ok: false,
      };
};

A.sellProperty = function (i) {
  const pc = A.pc(),
    a = pc.assets[i];
  if (!a)
    return {
      ok: false,
    };
  const P = GD.PROPERTY[a.k],
    v = Math.round((P ? P.price : 0) * A.rf(0.6, 0.95));
  pc.coin += v;
  pc.assets.splice(i, 1);
  A.log(`You sell your ${a.name.toLowerCase()} for ${A.coin(v)}.`);
  return {
    ok: true,
  };
};

A.setLifestyle = function (k) {
  const pc = A.pc();
  if (A.LIFESTYLE[k])
    return pc.flags.unfree && k !== "poor"
      ? {
          ok: false,
          msg: "Your master decides how you live.",
        }
      : ((pc.lifestyle = k),
        {
          ok: true,
        });
};

A.quietYears = function (n) {
  let done = 0;
  for (let i = 0; i < n; i++) {
    const pc = A.pc();
    if (!pc || !pc.alive || A.S.queue.length) break;
    A.ageUp();
    done++;
    let guard = 0;
    for (; A.S.queue.length && guard++ < 20; ) {
      const q = A.S.queue[0];
      if (q.type !== "event") return done;
      const v = A.eventView(q);
      let best = 0,
        bestScore = -1;
      v.choices.forEach((c, j) => {
        const sc = c.odds == null ? 80 : c.odds;
        if (sc > bestScore) {
          bestScore = sc;
          best = j;
        }
      });
      A.eventChoose(best);
      A.eventClose();
    }
    if (A.pc().health < 40 || (A.S.pendingName && A.S.pendingName.length)) break;
  }
  return done;
};

Object.assign(GD.CAREERS, {
  lawyer: {
    name: "Law & the courts",
    cat: "office",
    skill: "learning",
    skill2: "persuasion",
    stat: "int",
    ranks: [
      ["Court clerk", 0, 70],
      ["Pleader", 3, 220],
      ["Advocate", 7, 700],
      ["Magistrate", 12, 1600],
      ["High Justice", 20, 5e3],
    ],
    minAge: 15,
    literate: true,
    desc: "Deeds, debts, blood-price and inheritance. Every quarrel needs a voice.",
  },
  spy: {
    name: "The quiet trade",
    cat: "court",
    skill: "intrigue",
    skill2: "deception",
    stat: "ins",
    ranks: [
      ["Informer", 0, 60],
      ["Agent", 3, 250],
      ["Handler", 7, 800],
      ["Master of a web", 12, 2400],
    ],
    minAge: 15,
    secret: true,
    desc: "Listen, report, never be seen. The realm pays for what it should not know.",
  },
  bounty: {
    name: "Bounty hunting",
    cat: "land",
    skill: "tracking",
    skill2: "intimidation",
    stat: "ins",
    ranks: [
      ["Catchpole", 0, 90],
      ["Bounty hunter", 3, 260],
      ["Thief-taker", 7, 600],
      ["Hunter of men", 12, 1500],
    ],
    minAge: 16,
    desc: "Outlaws have prices on their heads. Someone has to collect.",
  },
  knight: {
    name: "Knight-errant",
    cat: "war",
    skill: "lance",
    skill2: "riding",
    stat: "str",
    ranks: [
      ["Hedge knight", 0, 80],
      ["Tourney rider", 2, 300],
      ["Champion", 6, 900],
      ["Paragon of the lists", 12, 3e3],
    ],
    minAge: 16,
    minStatus: 5,
    desc: "Ride the tourney circuit, sell your lance, chase glory and a patron.",
  },
  explorer: {
    name: "Exploration & maps",
    cat: "land",
    skill: "tracking",
    skill2: "survival",
    stat: "sta",
    ranks: [
      ["Guide", 0, 70],
      ["Pathfinder", 3, 200],
      ["Cartographer", 7, 500],
      ["Royal explorer", 13, 1400],
    ],
    minAge: 15,
    desc: "The unclaimed lands, the old roads, the edges of the map.",
  },
  artist: {
    name: "Painting & sculpture",
    cat: "craft",
    skill: "craft",
    skill2: "persuasion",
    stat: "int",
    ranks: [
      ["Apprentice painter", 0, 10],
      ["Painter", 4, 160],
      ["Master painter", 9, 600],
      ["Court artist", 15, 2e3],
    ],
    minAge: 12,
    guild: true,
    desc: "Icons, portraits, frescoes, tombs. The great pay to be remembered.",
  },
  cook: {
    name: "Kitchens",
    cat: "town",
    skill: "craft",
    skill2: "trade",
    stat: "sta",
    ranks: [
      ["Kitchen boy", 0, 20],
      ["Cook", 3, 120],
      ["Master cook", 7, 400],
      ["Royal cook", 13, 1200],
    ],
    minAge: 10,
    desc: "Every feast is a battle, and the lord's stomach is the general.",
  },
  teacher: {
    name: "Teaching",
    cat: "office",
    skill: "learning",
    skill2: "persuasion",
    stat: "int",
    ranks: [
      ["Tutor", 0, 60],
      ["Schoolmaster", 4, 180],
      ["Lecturer", 9, 500],
      ["Master of the College", 16, 1500],
    ],
    minAge: 16,
    literate: true,
    desc: "Letters, numbers, history. Shape the children of the rich.",
  },
  horsemaster: {
    name: "Horses",
    cat: "land",
    skill: "riding",
    skill2: "husbandry",
    stat: "ins",
    ranks: [
      ["Groom", 0, 30],
      ["Horse-breaker", 3, 140],
      ["Horse-master", 8, 450],
      ["Master of the royal stud", 14, 1500],
    ],
    minAge: 11,
    desc: "Break colts, train destriers, keep the realm's cavalry mounted.",
  },
  envoy: {
    name: "Diplomacy",
    cat: "court",
    skill: "diplomacy",
    skill2: "etiquette",
    stat: "int",
    ranks: [
      ["Herald", 0, 90],
      ["Envoy", 4, 400],
      ["Ambassador", 9, 1400],
      ["Chancellor's hand", 15, 4e3],
    ],
    minAge: 16,
    literate: true,
    minStatus: 4,
    desc: "Carry the realm's words across borders. Some envoys come home.",
  },
  engineer: {
    name: "Engines & works",
    cat: "craft",
    skill: "siegecraft",
    skill2: "craft",
    stat: "int",
    ranks: [
      ["Sapper's mate", 0, 60],
      ["Engineer", 4, 300],
      ["Master engineer", 9, 900],
      ["Master of the realm's engines", 15, 2500],
    ],
    minAge: 14,
    desc: "Bridges, mills, walls — and the trebuchets that break them.",
  },
  pitfighter: {
    name: "The fighting pits",
    cat: "town",
    skill: "unarmed",
    skill2: "melee",
    stat: "str",
    ranks: [
      ["Pit dog", 0, 40],
      ["Pit fighter", 2, 160],
      ["Crowd favourite", 5, 500],
      ["Champion of the pits", 9, 1500],
    ],
    minAge: 15,
    desc: "Fists, blades and wagers in a ring of shouting men. Fame comes fast and leaves faster.",
  },
  steward: {
    name: "Stewardship",
    cat: "office",
    skill: "stewardship",
    skill2: "logistics",
    stat: "int",
    ranks: [
      ["Bailiff", 0, 80],
      ["Steward", 4, 300],
      ["Seneschal", 9, 1100],
      ["Lord Treasurer's man", 15, 3500],
    ],
    minAge: 15,
    literate: true,
    desc: "Run a lord's lands, barns and books. Lords come and go; stewards stay.",
  },
});

GD.CAREER_OFFICE = {
  smith: "Master of the Smiths' Guild",
  mason: "Master of Works",
  weaver: "Master of the Weavers' Guild",
  bowyer: "Master of the Bowyers' Guild",
  carpenter: "Master of the Yard",
  brewer: "Warden of the Brewers",
  merchant: "Prior of the Merchants' Hall",
  scribe: "Great Officer of the Seal",
  healer: "Royal Physician",
  clergy: "Patriarch",
  lawyer: "High Justice",
  artist: "Court artist",
  teacher: "Master of the College",
  engineer: "Master of the realm's engines",
  envoy: "Chancellor's hand",
  steward: "Lord Treasurer's man",
};

A.jobRep = pc => (pc.job ? (pc.job.rep != null ? pc.job.rep : (pc.job.rep = 20 + (pc.house ? 6 : 0))) : 0);

A.repWord = v =>
  v >= 85
    ? "Legendary"
    : v >= 70
      ? "Renowned"
      : v >= 55
        ? "Respected"
        : v >= 40
          ? "Known"
          : v >= 25
            ? "Unremarkable"
            : "Doubted";

A.addRep = function (pc, n) {
  if (pc.job) pc.job.rep = A.clamp(A.jobRep(pc) + n, 0, 100);
};

A.careerYear2 = function (pc) {
  const j = pc.job;
  if (!j) return;
  const C = GD.CAREERS[j.c];
  if (
    (A.jobRep(pc),
    (j.rep = A.clamp(j.rep + (j.perf - 55) / 18 + (C.skill ? (A.skill(pc, C.skill) - 40) / 40 : 0), 0, 100)),
    C.skill2 && A.trainSkill(pc, C.skill2, 1.5),
    j.own)
  ) {
    const res =
      C.ranks[j.r][2] *
        (0.4 + j.rep / 70) *
        (0.6 + (j.staff || 0) * 0.25) *
        A.rf(0.5, 1.5) *
        (j.spec2 === "purse" ? 1.3 : 1) -
      (j.staff || 0) * 25 -
      20;
    pc.coin += Math.round(res);
    j.ownLast = Math.round(res);
    if (res < 0 && A.chance(0.25)) A.log(`A bad year for your ${A.ownWord(j.c)}: you lose ${A.coin(-res)}.`, "bad");
  }
  if (j.apprentices && j.apprentices.length)
    for (const id of j.apprentices.slice()) {
      const a = A.P(id);
      if (!a || !a.alive) {
        j.apprentices = j.apprentices.filter(x => x !== id);
        continue;
      }
      A.trainSkill(a, C.skill || "craft", 6);
      pc.coin += 6;
      if (A.chance(0.12))
        A.queue({
          type: "event",
          ev: A.EV.wk_apprentice_trouble ? "wk_apprentice_trouble" : "tavern_rumor",
        });
    }
  j.offers = A.rollOffers(pc);
  if (j.offers.length && A.chance(0.6))
    A.log(
      `Work: ${j.offers.length} offer${j.offers.length > 1 ? "s" : ""} came your way this year. (Work tab)`,
      "muted",
    );
};

A.ownWord = c =>
  ({
    merchant: "trading house",
    healer: "practice",
    lawyer: "chambers",
    smith: "forge",
    mason: "yard",
    weaver: "workshop",
    bowyer: "workshop",
    carpenter: "yard",
    brewer: "inn",
    artist: "studio",
    cook: "cookshop",
    teacher: "school",
    horsemaster: "stud",
    engineer: "works",
    minstrel: "troupe",
    hunter: "lodge",
    fish: "boats",
    sailor: "ship",
    thief: "gang",
    pirate: "crew",
    bounty: "company",
    knight: "household",
    explorer: "company",
  })[c] || "business";

A.oppPool = function (pc) {
  const j = pc.job;
  if (!j) return [];
  const out = [];
  for (const id in A.EV) {
    const e = A.EV[id];
    if (
      !(!e.opp || !e.opp.includes(j.c)) &&
      !((e.minRank || 0) > j.r || (e.maxRank != null && j.r > e.maxRank)) &&
      !(e.minRep && A.jobRep(pc) < e.minRep)
    ) {
      try {
        if (e.cond && !e.cond(pc, A.C)) continue;
      } catch {
        continue;
      }
      out.push(e);
    }
  }
  return out;
};

A.rollOffers = function (pc) {
  const pool = A.oppPool(pc),
    recent = pc.flags.oppSeen || {},
    n = A.clamp(1 + Math.floor(A.jobRep(pc) / 35) + (pc.job.own ? 1 : 0) + (pc.job.spec2 === "name" ? 1 : 0), 1, 5),
    out = [];
  for (let i = 0; i < n && pool.length; i++) {
    const e = A.wpick(
      pool.filter(x => !out.includes(x.id)),
      x =>
        (x.w || 1) *
        (A.specOfferWeight ? A.specOfferWeight(pc, x) : 1) *
        (recent[x.id] && A.S.year - recent[x.id] < (x.cool || 4) ? 0.05 : 1),
    );
    if (e) out.push(e.id);
  }
  return out;
};

A.takeOffer = function (id) {
  const pc = A.pc(),
    j = pc.job;
  if (!j || !j.offers || !j.offers.includes(id))
    return {
      ok: false,
      msg: "That offer is gone.",
    };
  const e = A.EV[id],
    cost = e.time != null ? e.time : 1;
  return A.S.time < cost
    ? {
        ok: false,
        msg: "Not enough initiative (⧗) yet.",
      }
    : ((A.S.time -= cost),
      (j.offers = j.offers.filter(x => x !== id)),
      (pc.flags.oppSeen = pc.flags.oppSeen || {}),
      (pc.flags.oppSeen[id] = A.S.year),
      A.queue({
        type: "event",
        ev: id,
      }),
      {
        ok: true,
      });
};

A.declineOffer = function (id) {
  const pc = A.pc();
  if (pc.job && pc.job.offers) pc.job.offers = pc.job.offers.filter(x => x !== id);
};

A.WORK = {
  hard: {
    name: "Work harder",
    cost: 1,
    desc: "More hours, better work, less joy.",
    ok: pc => pc.flags.workHard !== A.S.year,
    fn: pc => A.workHard(),
  },
  network: {
    name: "Work the hall",
    cost: 1,
    desc: "Drink with the right people. Reputation and contacts.",
    ok: pc => true,
    fn: pc => {
      const C = GD.CAREERS[pc.job.c],
        v =
          A.skillEff(pc, "persuasion") * 0.5 +
          A.skillEff(pc, "etiquette") * 0.3 +
          A.stat(pc, "int") * 0.3 +
          A.ri(-15, 25);
      if ((A.trainSkill(pc, "persuasion", 2), v > 35)) {
        A.addRep(pc, A.ri(3, 7));
        const m = A.makeAcquaintance(pc, "friend");
        if (m) m.occ = "someone useful in " + C.name.toLowerCase();
        return {
          msg: "You spend the year being seen. People in the trade know your name now.",
          cls: "good",
        };
      }
      A.addRep(pc, -1);
      pc.coin -= 5;
      return {
        msg: "You buy too many rounds and say the wrong thing to the wrong man.",
      };
    },
  },
  promote: {
    name: "Ask for advancement",
    cost: 1,
    desc: "Make your case to your master or your betters.",
    ok: pc => !!GD.CAREERS[pc.job.c].ranks[pc.job.r + 1] && !A.S.yearActs.askPromo,
    fn: pc => {
      A.S.yearActs.askPromo = 1;
      const j = pc.job,
        C = GD.CAREERS[j.c],
        next = C.ranks[j.r + 1],
        yearsOk = j.y >= Math.max(1, next[1] - C.ranks[j.r][1] - 2),
        v =
          A.skillEff(pc, "persuasion") * 0.4 +
          j.perf * 0.4 +
          A.jobRep(pc) * 0.4 +
          (C.skill ? A.skill(pc, C.skill) * 0.3 : 0) +
          A.ri(-15, 15);
      return C.literate && !pc.literate
        ? {
            msg: "They laugh: you cannot even read the rolls.",
            cls: "bad",
          }
        : yearsOk && v > 70
          ? (j.r++,
            (j.y = next[1]),
            A.log(`Promoted: you are now ${next[0]}.`, "good"),
            A.addRep(pc, 3),
            {
              msg: `They agree. You are now ${next[0]}.`,
              cls: "good",
            })
          : v < 35
            ? (A.addRep(pc, -3),
              (j.perf = Math.max(0, j.perf - 5)),
              {
                msg: "You ask, and they remember that you asked. Not kindly.",
                cls: "bad",
              })
            : {
                msg: yearsOk ? '"Next year, perhaps." Keep working.' : '"You are too green." You need more years.',
              };
    },
  },
  apprentice: {
    name: "Take an apprentice",
    cost: 1,
    desc: "Teach someone your trade. A little income, reputation, and a person bound to you.",
    ok: pc => pc.job.r >= 2 && (pc.job.apprentices || []).length < 3,
    fn: pc => {
      const a = A.makeAcquaintance(pc, "student");
      return a
        ? ((a.born = A.S.year - (A.ri(11, 15) * GD.RACES[a.race].adult) / 16),
          (a.occ = "your apprentice"),
          (pc.job.apprentices = (pc.job.apprentices || []).concat([a.id])),
          A.addRep(pc, 2),
          {
            msg: `${a.given} becomes your apprentice. ${A.cap(A.he(a))} sleeps in the loft and eats like a wolf.`,
            cls: "good",
          })
        : {
            msg: "Nobody suitable comes.",
          };
    },
  },
  invest: {
    name: "Invest in tools & stock",
    cost: 1,
    desc: "Spend coin now to work better for years.",
    ok: pc => pc.coin >= 40 && !pc.job.invested,
    fn: pc => {
      const c = Math.min(pc.coin, 40 + pc.job.r * 60);
      pc.coin -= c;
      pc.job.invested = A.S.year;
      pc.job.perf = A.clamp(pc.job.perf + 12, 0, 100);
      A.addRep(pc, 2);
      return {
        msg: `You spend ${A.coin(c)} on better tools and stock. The work shows it.`,
        cls: "good",
      };
    },
  },
  own: {
    name: "Open your own",
    cost: 2,
    desc: "Leave your master and open your own house of trade. Your income will rise and fall with your name.",
    ok: pc =>
      !pc.job.own &&
      pc.job.r >= 2 &&
      !["spy", "clergy", "courtier", "scribe", "envoy", "steward", "servant", "labor", "farm", "miner"].includes(
        pc.job.c,
      ),
    fn: pc => {
      const cost = 60 + pc.job.r * 120;
      return pc.coin < cost
        ? {
            ok: false,
            msg: `You need ${A.coin(cost)} to set up.`,
          }
        : ((pc.coin -= cost),
          (pc.job.own = A.S.year),
          (pc.job.staff = 0),
          A.log(`You open your own ${A.ownWord(pc.job.c)}. Your name over the door.`, "big"),
          {
            msg: `Your own ${A.ownWord(pc.job.c)}. Good years will be very good. Bad years are yours too.`,
            cls: "good",
          });
    },
  },
  hire: {
    name: "Hire hands",
    cost: 1,
    desc: "More hands, more work, more wages to pay.",
    ok: pc => !!pc.job.own && (pc.job.staff || 0) < 6,
    fn: pc => (
      (pc.job.staff = (pc.job.staff || 0) + 1),
      {
        msg: `You take on another pair of hands (${pc.job.staff} now).`,
      }
    ),
  },
  office: {
    name: "Stand for office",
    cost: 2,
    desc: "Seek the highest seat of your trade. Needs a great reputation.",
    ok: pc => !!GD.CAREER_OFFICE[pc.job.c] && !GD.CAREERS[pc.job.c].ranks[pc.job.r + 1] && !pc.job.office,
    fn: pc => {
      const rep = A.jobRep(pc);
      return rep < 65
        ? {
            ok: false,
            msg: `Nobody would vote for you yet. (Reputation ${Math.round(rep)}/65)`,
          }
        : rep * 0.5 +
              A.skillEff(pc, "persuasion") * 0.3 +
              A.skillEff(pc, "intrigue") * 0.15 +
              pc.fame * 0.3 +
              A.ri(-20, 20) >
            55
          ? ((pc.job.office = GD.CAREER_OFFICE[pc.job.c]),
            A.fame(pc, 6),
            pc.deeds.push({
              y: A.S.year,
              t: pc.job.office,
            }),
            A.log(`You are made ${pc.job.office}.`, "big"),
            (pc.coin += 200),
            {
              msg: `You are ${pc.job.office}.`,
              cls: "good",
            })
          : (A.addRep(pc, -4),
            {
              msg: "The vote goes against you. Your rival smiles across the hall.",
              cls: "bad",
            });
    },
  },
};

A.workActions = function (pc) {
  return pc.job
    ? Object.entries(A.WORK)
        .filter(([k, W]) => {
          try {
            return W.ok(pc);
          } catch {
            return false;
          }
        })
        .map(([k, W]) => ({
          k,
          W,
        }))
    : [];
};

A.doWork = function (k) {
  const pc = A.pc(),
    W = A.WORK[k];
  if (!W || !pc.job)
    return {
      ok: false,
      msg: "Not possible.",
    };
  if (A.S.time < W.cost)
    return {
      ok: false,
      msg: "Not enough initiative (⧗) yet.",
    };
  if (A.S.yearActs["work_" + k] && k !== "hard")
    return {
      ok: false,
      msg: "Once a year.",
    };
  if (!W.ok(pc))
    return {
      ok: false,
      msg: "Not now.",
    };
  const r = W.fn(pc) || {};
  if (!(r.ok === false)) {
    if (k !== "hard") {
      A.S.time -= W.cost;
      A.S.yearActs["work_" + k] = 1;
    }
    if (r.msg) A.log(r.msg, r.cls || "");
  }
  return r;
};

A.jobStartRank = function (pc, k) {
  let r = 0;
  const dip = {
    scribe: "letters",
    lawyer: "letters",
    envoy: "letters",
    teacher: "letters",
    healer: "medicine",
    clergy: "faith",
    merchant: "trade",
    sailor: "sea",
    smith: "crafts",
    mason: "crafts",
    weaver: "crafts",
    carpenter: "crafts",
    bowyer: "crafts",
    engineer: "war",
    minstrel: "arts",
  }[k];
  if (dip && pc.flags["dip_" + dip]) r = 1;
  const F = pc.house ? A.famData(pc.house) : null;
  if (
    F &&
    {
      merchant: ["merchant"],
      sea: ["sailor", "fish"],
      guild: ["smith", "mason", "weaver", "bowyer", "carpenter", "brewer", "artist"],
      clergy: ["clergy"],
      scholar: ["scribe", "healer", "lawyer", "teacher"],
      hunt: ["hunter", "bounty", "explorer"],
      horse: ["horsemaster", "herd"],
      outlaw: ["thief", "pirate"],
    }[F.kind] &&
    {
      merchant: ["merchant"],
      sea: ["sailor", "fish"],
      guild: ["smith", "mason", "weaver", "bowyer", "carpenter", "brewer", "artist"],
      clergy: ["clergy"],
      scholar: ["scribe", "healer", "lawyer", "teacher"],
      hunt: ["hunter", "bounty", "explorer"],
      horse: ["horsemaster", "herd"],
      outlaw: ["thief", "pirate"],
    }[F.kind].includes(k)
  )
    r = Math.max(r, 1);
  const C = GD.CAREERS[k];
  return Math.min(r, C.ranks.length - 2);
};

A.ACTIONS = {
  strike: {
    name: "Strike",
    cost: 8,
    desc: "A clean attack. Beats a feint; a good guard turns it.",
  },
  feint: {
    name: "Feint",
    cost: 6,
    desc: "Draw the guard, then cut. Beats a guard; loses to a straight strike.",
  },
  guard: {
    name: "Guard & riposte",
    cost: 3,
    desc: "Wait, turn the blow, answer it. Beats a strike; a feint opens it.",
  },
  press: {
    name: "All-out press",
    cost: 16,
    desc: "Overwhelm with weight and fury. Breaks a weak guard; a feint makes a fool of it. Costs wind.",
  },
  grapple: {
    name: "Close & grapple",
    cost: 12,
    desc: "Get inside the reach and wrestle. Beats a guard and a press if you are strong; a strike catches you coming in.",
  },
  yield: {
    name: "Yield",
    cost: 0,
    desc: "Lower your weapon and ask for quarter.",
  },
  flee: {
    name: "Flee",
    cost: 0,
    desc: "Run. Speed decides.",
  },
};

A.MATCH = {
  strike: {
    strike: 0,
    feint: 3,
    guard: -3,
    press: -1,
    grapple: 2,
  },
  feint: {
    strike: -3,
    feint: 0,
    guard: 3,
    press: -2,
    grapple: -1,
  },
  guard: {
    strike: 3,
    feint: -3,
    guard: 0,
    press: 0,
    grapple: -2,
  },
  press: {
    strike: 1,
    feint: 2,
    guard: 0,
    press: 0,
    grapple: 1,
  },
  grapple: {
    strike: -2,
    feint: 1,
    guard: 2,
    press: -1,
    grapple: 0,
  },
};

A.BEASTS = {
  "CRE-01": {
    str: 95,
    spd: 70,
    ins: 62,
    sta: 55,
    hp: 210,
    dmg: 26,
    pierce: 4,
    prot: 5,
    fame: 30,
    terr: ["mountains", "hills"],
    verb: "rakes",
    where: "the high crags",
  },
  "CRE-03": {
    str: 55,
    spd: 75,
    ins: 55,
    sta: 45,
    hp: 110,
    dmg: 16,
    pierce: 3,
    prot: 3,
    fame: 12,
    terr: ["mountains", "hills"],
    verb: "slashes",
    where: "a Sunwall gorge",
  },
  "CRE-05": {
    str: 140,
    spd: 35,
    ins: 45,
    sta: 60,
    hp: 420,
    dmg: 34,
    pierce: 5,
    prot: 7,
    fame: 28,
    terr: ["forest", "marsh"],
    verb: "bites",
    where: "the rainforest scrub",
  },
  "CRE-06": {
    str: 40,
    spd: 72,
    ins: 55,
    sta: 40,
    hp: 70,
    dmg: 12,
    pierce: 2,
    prot: 2,
    fame: 8,
    terr: ["mountains"],
    verb: "claws",
    where: "a high valley of the Crown Range",
  },
  "CRE-19": {
    str: 90,
    spd: 60,
    ins: 60,
    sta: 70,
    hp: 230,
    dmg: 24,
    pierce: 3,
    prot: 3,
    fame: 18,
    terr: ["forest"],
    verb: "gores",
    where: "the deep Evenwood",
  },
  "CRE-20": {
    str: 110,
    spd: 48,
    ins: 40,
    sta: 70,
    hp: 300,
    dmg: 25,
    pierce: 3,
    prot: 4,
    fame: 10,
    terr: ["forest", "plains"],
    verb: "gores",
    where: "an oak glade",
  },
  "CRE-21": {
    str: 45,
    spd: 70,
    ins: 60,
    sta: 70,
    hp: 70,
    dmg: 13,
    pierce: 2,
    prot: 1,
    fame: 4,
    terr: ["forest", "tundra", "hills"],
    verb: "bites",
    where: "the pines",
    pack: 4,
  },
  "CRE-23": {
    str: 85,
    spd: 58,
    ins: 42,
    sta: 60,
    hp: 190,
    dmg: 22,
    pierce: 3,
    prot: 4,
    fame: 9,
    terr: ["forest", "hills"],
    verb: "tusks",
    where: "a holm-oak thicket",
  },
  "CRE-25": {
    str: 105,
    spd: 45,
    ins: 50,
    sta: 65,
    hp: 260,
    dmg: 27,
    pierce: 3,
    prot: 4,
    fame: 14,
    terr: ["mountains", "hills", "forest"],
    verb: "mauls",
    where: "a cave mouth",
  },
  "CRE-26": {
    str: 40,
    spd: 55,
    ins: 50,
    sta: 40,
    hp: 80,
    dmg: 14,
    pierce: 2,
    prot: 2,
    fame: 7,
    terr: ["mountains"],
    verb: "strikes",
    where: "a flooded cave",
  },
  "CRE-31": {
    str: 90,
    spd: 55,
    ins: 55,
    sta: 60,
    hp: 210,
    dmg: 22,
    pierce: 2,
    prot: 2,
    fame: 12,
    terr: ["mountains"],
    verb: "pounds",
    where: "the snowfields",
  },
  "CRE-33": {
    str: 150,
    spd: 40,
    ins: 35,
    sta: 70,
    hp: 450,
    dmg: 32,
    pierce: 4,
    prot: 6,
    fame: 18,
    terr: ["tundra"],
    verb: "tramples",
    where: "the frozen plain",
  },
  "CRE-34": {
    str: 140,
    spd: 45,
    ins: 30,
    sta: 65,
    hp: 420,
    dmg: 32,
    pierce: 5,
    prot: 7,
    fame: 16,
    terr: ["steppe", "tundra"],
    verb: "gores",
    where: "the steppe edge",
  },
  "CRE-35": {
    str: 55,
    spd: 62,
    ins: 50,
    sta: 70,
    hp: 95,
    dmg: 15,
    pierce: 2,
    prot: 1,
    fame: 5,
    terr: ["steppe", "plains"],
    verb: "bites",
    where: "the long grass",
    pack: 3,
  },
  "CRE-38": {
    str: 50,
    spd: 40,
    ins: 45,
    sta: 50,
    hp: 90,
    dmg: 14,
    pierce: 2,
    prot: 3,
    fame: 6,
    terr: ["desert"],
    verb: "bites",
    where: "the rocky scrub",
  },
  "CRE-43": {
    str: 25,
    spd: 65,
    ins: 45,
    sta: 40,
    hp: 40,
    dmg: 9,
    pierce: 1,
    prot: 2,
    fame: 3,
    terr: ["desert"],
    verb: "snaps",
    where: "the dunes' edge",
  },
  "CRE-44": {
    str: 120,
    spd: 45,
    ins: 50,
    sta: 60,
    hp: 360,
    dmg: 32,
    pierce: 4,
    prot: 7,
    fame: 15,
    terr: ["marsh", "plains", "savanna"],
    verb: "drags",
    where: "the reed-bank",
  },
  "CRE-45": {
    str: 130,
    spd: 40,
    ins: 35,
    sta: 60,
    hp: 380,
    dmg: 28,
    pierce: 3,
    prot: 5,
    fame: 10,
    terr: ["marsh", "plains"],
    verb: "crushes",
    where: "the river shallows",
  },
  "CRE-47": {
    str: 70,
    spd: 35,
    ins: 45,
    sta: 60,
    hp: 150,
    dmg: 12,
    pierce: 1,
    prot: 2,
    fame: 9,
    terr: ["marsh", "forest"],
    verb: "coils",
    where: "the swamp",
  },
  "CRE-49": {
    str: 85,
    spd: 72,
    ins: 70,
    sta: 55,
    hp: 180,
    dmg: 25,
    pierce: 3,
    prot: 2,
    fame: 16,
    terr: ["forest", "plains", "hills"],
    verb: "leaps on",
    where: "the monsoon forest",
  },
  "CRE-51": {
    str: 75,
    spd: 35,
    ins: 45,
    sta: 60,
    hp: 150,
    dmg: 12,
    pierce: 1,
    prot: 2,
    fame: 9,
    terr: ["forest"],
    verb: "coils",
    where: "the deep green",
  },
  "CRE-53": {
    str: 80,
    spd: 55,
    ins: 50,
    sta: 60,
    hp: 200,
    dmg: 20,
    pierce: 3,
    prot: 3,
    fame: 17,
    terr: ["forest", "hills"],
    verb: "kicks",
    where: "the Isle of Pearls",
  },
  "CRE-55": {
    str: 80,
    spd: 50,
    ins: 55,
    sta: 60,
    hp: 170,
    dmg: 18,
    pierce: 1,
    prot: 1,
    fame: 10,
    terr: ["forest"],
    verb: "batters",
    where: "the Deep Green",
  },
  "CRE-56": {
    str: 35,
    spd: 70,
    ins: 55,
    sta: 60,
    hp: 55,
    dmg: 11,
    pierce: 2,
    prot: 1,
    fame: 5,
    terr: ["mountains", "hills"],
    verb: "bites",
    where: "the Ashlands",
    pack: 3,
  },
  "CRE-24": {
    str: 120,
    spd: 40,
    ins: 45,
    sta: 60,
    hp: 320,
    dmg: 26,
    pierce: 2,
    prot: 3,
    fame: 14,
    terr: ["forest"],
    verb: "batters",
    where: "the Deep Green",
  },
};

A.GAME_BEASTS = {
  plains: ["a red deer", "a brace of hares", "a wild boar", "partridges", "a roebuck"],
  forest: ["a red deer", "a wild boar", "a roebuck", "a fat badger", "wood pigeons"],
  steppe: ["a saiga antelope", "wild asses", "marmots", "a bustard"],
  desert: ["a gazelle", "sand grouse", "a white oryx"],
  hills: ["an ibex", "a red deer", "a wild goat"],
  mountains: ["an ibex", "a chamois", "marmots"],
  tundra: ["a reindeer", "ptarmigan", "an arctic hare"],
  marsh: ["ducks", "a heron", "eels", "a wild boar"],
};

A.fighterFrom = function (p, opts = {}) {
  const st = A.stats(p),
    g = p.gear || {},
    W = GD.GEAR[opts.weapon || g.weapon] || GD.GEAR.fists,
    Ar = GD.GEAR[g.armor] || GD.GEAR.none,
    ShG = g.shield && !W.twoHand ? GD.GEAR[g.shield] : null,
    Off = ShG && ShG.offhand ? ShG : null,
    Sh = ShG && !ShG.offhand ? ShG : null,
    He = g.helm ? GD.GEAR[g.helm] : null,
    R2 = GD.RACES[p.race],
    B = A.bloodDef(p),
    bshow = p.blood && (p.blood.show || (B && B.mode === "x")),
    skillK = GD.WEAPON_SKILL[W.kind] || "unarmed",
    f = {
      pid: p.id,
      name: A.fullName(p, false),
      short: p.given,
      isPC: p.id === A.S.pc,
      beast: false,
      race: p.race,
      str: st.str,
      spd: st.spd,
      ins: st.ins,
      sta: st.sta,
      wil: st.wil,
      skill: Math.min(110, A.skill(p, skillK) + (skillK !== "beast" ? A.skill(p, "melee") * 0.3 : 0)),
      skillK,
      shieldSkill: A.skill(p, "shield"),
      weapon: W.name,
      wdmg: W.dmg,
      wspd: W.spd || 0,
      wreach: W.reach || 0,
      pierce: W.pierce || 0,
      wkind: W.kind,
      prot: (Ar.prot || 0) + (He ? He.prot : 0),
      armorW: Ar.weight || 0,
      shield: Sh ? Sh.def + A.skill(p, "shield") / 40 : Off ? Off.def : 0,
      mass: R2.mass,
      reach: R2.reach + (W.reach || 0) * 3,
      lefthand: A.has(p, "lefthand"),
      chain: p.flags.chain || null,
      tags: [],
      wil0: st.wil,
      traits: p.traits.slice(),
      mounted: false,
    };
  if (bshow && B) {
    f.tags.push(B.tag);
    if (B.reach) f.reach += B.reach;
    if (B.grip) f.skill += B.grip;
    if (B.woundRes) f.woundRes = B.woundRes;
    if (B.hide) f.hide = B.hide;
    if (B.fury) f.furyBlood = true;
    if (B.painless) f.painless = true;
    if (B.fragile) f.fragile = B.fragile;
    if (B.night) f.night = B.night;
    if (B.dayPen) f.dayPen = B.dayPen;
    if (B.nightPen) f.nightPen = B.nightPen;
    if (B.seizure) f.seizure = B.seizure;
    if (B.noBurst) f.noBurst = true;
    if (B.sunPain) f.sunPain = true;
    if (B.sea) f.sea = B.sea;
  }
  f.read = 0;
  f.crit = 0;
  f.flee = 0;
  f.grapMul = 1;
  f.intim = 0;
  const applyPerks = (k, any) => {
    for (const x of A.perksOf(p, k)) {
      const fx = x[3];
      if (!((any && !fx.any) || (fx.onlyFists && W.kind !== "fists"))) {
        f.skill += fx.skill || 0;
        f.wdmg += fx.wdmg || 0;
        f.pierce += fx.pierce || 0;
        f.prot += fx.prot || 0;
        f.read += fx.read || 0;
        f.crit += fx.crit || 0;
        f.flee += fx.flee || 0;
        if (fx.grapple) f.grapMul = Math.max(f.grapMul, fx.grapple);
        f.intim += fx.intim || 0;
        if (fx.shield && f.shield) f.shield += fx.shield;
      }
    }
  };
  if (
    (applyPerks(skillK, false),
    applyPerks("melee", true),
    applyPerks("unarmed", false),
    applyPerks("athletics", false),
    applyPerks("intimidation", false),
    Sh && applyPerks("shield", false),
    Off)
  ) {
    const dv = A.skill(p, "dualwield") + A.perkOf(p, "dualwield", "dual");
    f.dual = dv;
    f.offdmg = Off.odmg || 5;
    f.offName = Off.name;
    applyPerks("dualwield", false);
    if (dv < 20) f.skill -= 4;
  }
  const Rg = g.ranged ? GD.GEAR[g.ranged] : null;
  if (Rg) {
    const rk = GD.WEAPON_SKILL[Rg.kind] || "bow";
    f.rangedSkill = A.skill(p, rk) + A.perkOf(p, rk, "opener") * 10;
    f.rdmg = Rg.dmg;
    f.rpierce = Rg.pierce || 0;
    f.rName = Rg.name;
    f.rKind = rk;
  }
  f.burst = R2.burst && !f.noBurst ? R2.burst : 0;
  f.maxHp = Math.round(
    (60 + st.sta * 0.45) * (p.race === "giant" ? 3.2 : p.race === "orc" ? 1.12 : p.race === "dwarf" ? 1.1 : 1),
  );
  f.hp = Math.round(f.maxHp * A.clamp(p.health / 100, 0.3, 1));
  f.fat = 0;
  f.adapt = 0;
  f.won = 0;
  f.lost = 0;
  if (A.styleFighter) A.styleFighter(f, p);
  if (opts.mounted && g.mount && GD.GEAR[g.mount]) {
    f.mounted = true;
    f.ride =
      GD.GEAR[g.mount].ride + A.skill(p, "riding") / 25 + A.skill(p, "mounted") / 20 + A.perkOf(p, "mounted", "ride");
  }
  const qw = GD.QUAL[A.qualOf(p, opts.weapon ? "x" : "weapon")] || GD.QUAL.common,
    qa = GD.QUAL[A.qualOf(p, "armor")] || GD.QUAL.common;
  f.wdmg = (f.wdmg || 0) * qw.dmg;
  f.pierce = (f.pierce || 0) + (qw.pierce || 0);
  f.wspd = (f.wspd || 0) + (qw.spd || 0);
  f.prot = (f.prot || 0) * qa.prot;
  return f;
};

A.fighterBeast = function (cid, mod = 1) {
  const L = LORE.creatures.find(c => c.id === cid),
    B = A.BEASTS[cid],
    f = {
      pid: null,
      name: L ? L.name : "beast",
      short: L ? L.name.replace(/^The /, "the ") : "the beast",
      isPC: false,
      beast: cid,
      race: "beast",
      str: B.str * mod,
      spd: B.spd,
      ins: B.ins,
      sta: B.sta,
      wil: 60,
      skill: 45 + B.ins / 3,
      skillK: "beast",
      shieldSkill: 0,
      weapon: B.verb,
      wdmg: B.dmg * 0.6,
      wspd: 0,
      wreach: 0,
      pierce: B.pierce,
      wkind: "beast",
      prot: B.prot,
      armorW: 0,
      shield: 0,
      mass: B.str / 40,
      reach: B.str > 100 ? 40 : 5,
      lefthand: false,
      chain: null,
      tags: [],
      techs: [],
      st: {
        stun: 0,
        knock: 0,
        bleed: [],
        disarm: 0,
        hamstring: 0,
        fury: 0,
      },
      traits: ["brave"],
      maxHp: Math.round(B.hp * mod),
      hp: Math.round(B.hp * mod),
      fat: 0,
      adapt: 0,
      won: 0,
      lost: 0,
      burst: 0,
      fame: B.fame,
      verb: B.verb,
    };
  if (A.beastTier(cid) === "great") {
    const m = mod || 1;
    f.maxHp = f.hp = Math.round(A.clamp(f.maxHp / m, 235, 255) * m);
    f.prot = Math.max(f.prot, 4);
    f.str = A.clamp(f.str, 92 * m, 100 * m);
    f.wdmg = Math.max(f.wdmg, 15);
    f.reach = 14;
    f.mass = f.str / 40;
  }
  f.tier = A.beastTier(cid);
  return f;
};

A.CR = function (f, D) {
  let v = f.str * 0.2 + f.spd * 0.24 + f.ins * 0.26 + f.skill * 0.42 + f.wil * 0.08 + f.wspd * 1.6;
  if (f.str > 100) v += (f.str - 100) * 0.12;
  v -= f.armorW * 1.5 * (f.sta < 50 ? 1.4 : 1);
  if (f.mounted) v += f.ride * 4;
  if (f.fat > 70) v *= 0.82;
  if (f.fat > 90) v *= 0.75;
  if (f.burst && D.round <= 3) v += 7 * f.burst;
  else {
    if (f.burst && D.round > 4) v -= 4 * f.burst;
  }
  if (f.fury > 0) v += 14;
  if (f.hp < f.maxHp * 0.3 && !f.painless) v *= 0.85;
  v += f.adapt;
  return v;
};

A.situEdges = function (f, o, D, act) {
  const e = [];
  if (D.round === 1 && f.lefthand && !o.lefthand) e.push([1, "a left hand few have faced"]);
  if (f.chain && o.chain && f.chain === o.chain) e.push([0, "same school"]);
  else {
    if (f.chain && D.round <= 2) e.push([1, `the ${f.chain} way`]);
  }
  if (D.light === "night") {
    if (f.night) e.push([2, "eyes that see in the dark"]);
    if (f.nightPen) e.push([-2, "night-blind"]);
  }
  if (D.light === "noon" || D.light === "day") {
    if (f.dayPen) e.push([-1, "dazzled by daylight"]);
    if (f.sunPain && D.light === "noon") e.push([-1, "the noon glare"]);
  }
  if (D.ground === "passage") {
    if (f.shield) e.push([1, "a shield in a narrow place"]);
    if (f.reach - o.reach > 15) e.push([-1, "no room for reach"]);
  }
  if (D.ground === "deck" && f.sea) e.push([2, "sea-steady on a pitching deck"]);
  if (D.ground === "mud" && f.armorW >= 3) e.push([-1, "heavy mail in the mud"]);
  const rd = f.reach - o.reach;
  if (
    (Math.abs(rd) >= 6 &&
      act !== "grapple" &&
      D.ground !== "passage" &&
      e.push([rd > 0 ? 1 : -1, rd > 0 ? "longer reach" : "shorter reach"]),
    act === "grapple")
  ) {
    const md = f.str * f.mass - o.str * o.mass;
    if (Math.abs(md) > 25) e.push([md > 0 ? 2 : -2, md > 0 ? "more weight and strength" : "outweighed"]);
  }
  if (act === "guard" && f.shield) e.push([1, "a good shield"]);
  if (f.tags.includes("quickened")) e.push([1, "Quickened reactions"]);
  return e;
};

A.aiAction = function (f, o, D) {
  if (f.beast)
    return A.wpick(
      ["strike", "press", "grapple", "guard"],
      a =>
        ({
          strike: 4,
          press: f.hp > f.maxHp * 0.5 ? 3 : 1,
          grapple: f.str > 90 ? 3 : 1,
          guard: 1,
        })[a],
    );
  const w = {
    strike: 4,
    feint: 2.5,
    guard: 3,
    press: 1.5,
    grapple: 1,
  };
  if (f.traits.includes("wrathful") || f.traits.includes("impetuous")) {
    w.press += 2;
    w.strike += 1;
    w.guard -= 1;
  }
  if (f.traits.includes("calm") || f.traits.includes("patient")) {
    w.guard += 1.5;
    w.feint += 1;
    w.press -= 0.5;
  }
  if (f.traits.includes("craven")) w.guard += 2;
  if (f.fat > 65) {
    w.press = 0.2;
    w.grapple *= 0.4;
    w.guard += 3;
  }
  if (f.str * f.mass > o.str * o.mass + 25) w.grapple += 2.5;
  if (f.hp > o.hp * 1.6) w.press += 1.5;
  if (f.furyBlood && f.furyUsed !== true && f.hp < f.maxHp * 0.85) w.press += 3;
  const h = D.hist;
  if (h.length >= 2 && A.chance(f.ins / 160)) {
    const last = h[h.length - 1][f === D.a ? 1 : 0],
      prev = h[h.length - 2][f === D.a ? 1 : 0];
    if (last === prev) {
      const counter = Object.keys(A.MATCH).sort((x, y) => A.MATCH[y][last] - A.MATCH[x][last])[0];
      w[counter] += 6;
    }
  }
  for (const k in w) w[k] = Math.max(0.05, w[k]);
  return A.wpick(Object.keys(w), k => w[k]);
};

A.startDuel = function (pc, foe, opts) {
  if (((opts = opts || {}), foe && foe.beastId && pc && pc.id === A.S.pc && !opts.forceSolo)) {
    const id = foe.beastId,
      tier = A.beastTier(id),
      child = A.age(pc) < GD.RACES[pc.race].adult,
      ctx = {
        beast: id,
        mod: foe.mod || 1,
        place: opts.place || (A.BEASTS[id] || {}).where || "the wilds",
        title: opts.title || "The hunt",
      };
    if (child) {
      A.queue({
        type: "event",
        ev: "bx_child",
        ctx,
        forced: true,
        conv: true,
      });
      return {
        converted: "child",
      };
    }
    if (tier === "legend") {
      A.queue({
        type: "event",
        ev: "bx_legend",
        ctx,
        forced: true,
        conv: true,
      });
      return {
        converted: "legend",
      };
    }
    if (tier === "titan" && !opts.expedition) {
      A.queue({
        type: "event",
        ev: "bx_titan",
        ctx,
        forced: true,
        conv: true,
      });
      return {
        converted: "titan",
      };
    }
    if (GD.BEAST_FLYER[id] && !A.canReachFlyer(pc) && !opts.grounded) {
      A.queue({
        type: "event",
        ev: "bx_flyer",
        ctx,
        forced: true,
        conv: true,
      });
      return {
        converted: "flyer",
      };
    }
  }
  let restore = null;
  if (foe && !foe.beastId && foe.gear) {
    const kind = opts.kind || "duel";
    if (kind === "brawl") opts.lethal = false;
    const w = foe.gear.weapon;
    if ((!w || w === "fists" || !GD.GEAR[w]) && !["brawl", "spar", "tourney"].includes(kind)) {
      const arm = A.armFor(foe);
      restore = w;
      foe.gear.weapon = arm.weapon;
      if (foe.npcTemp) restore = null;
    }
  }
  const D = startDuelNow(pc, foe, opts);
  if ((restore !== null && foe && foe.gear && (foe.gear.weapon = restore), D && D.b && D.b.beast)) {
    const tier = A.beastTier(D.b.beast);
    D.tier = tier;
    if (opts.party) {
      D.party = opts.party;
      D.b.wdmg *= 0.5;
      D.a.wdmg *= 1.4;
      D.b.skill -= 10;
      D.b.hp = D.b.maxHp = Math.round(D.b.maxHp * 0.62);
      D.log.splice(
        1,
        0,
        `You are not alone: ${opts.party.n} hunters with you, spears out, dogs baying. They pin it; you go for the kill.`,
      );
    } else {
      if (tier === "great")
        D.log.splice(
          1,
          0,
          "This is a great beast — a hunting party's work. Alone, most people die here. You can still run.",
        );
    }
    if (GD.BEAST_FLYER[D.b.beast] && opts.grounded)
      D.log.splice(
        1,
        0,
        "It is on the ground now — a torn wing, or it came down to feed. This is the only time a blade can reach it.",
      );
    if (tier === "titan")
      D.log.splice(
        1,
        0,
        "You chose this. A titan, alone. Songs are written about people who do this — mostly sad ones.",
      );
  }
  return D;
};

const startDuelNow = function (pc, foe, opts) {
  const D = {
    id: "D" + A.ri(1e3, 99999),
    kind: opts.kind || "duel",
    place: opts.place || "the open",
    light: opts.light || A.pick(["day", "day", "day", "noon", "dusk"]),
    ground: opts.ground || "open",
    lethal: opts.lethal !== false,
    toYield: !!opts.toYield,
    round: 0,
    log: [],
    hist: [],
    over: false,
    result: null,
    reward: opts.reward || 0,
    onEnd: opts.onEnd || null,
    stakes: opts.stakes || "",
    title: opts.title || "",
  };
  if (
    ((D.a = A.fighterFrom(pc, {
      mounted: opts.mounted,
    })),
    foe && foe.beastId
      ? ((D.b = A.fighterBeast(foe.beastId, foe.mod || 1)), (D.kind = "beast"), (D.lethal = true), (D.toYield = false))
      : (D.b = A.fighterFrom(foe, {
          mounted: opts.mounted,
        })),
    opts.foeMods && Object.assign(D.b, opts.foeMods),
    !["spar", "tourney", "brawl"].includes(D.kind) && D.ground !== "passage" && D.ground !== "deck")
  )
    for (const [f, o] of [
      [D.a, D.b],
      [D.b, D.a],
    ]) {
      if (!f.rangedSkill || f.rangedSkill < 12) continue;
      const hit = A.chance(A.clamp(0.2 + f.rangedSkill / 160 - o.spd / 500, 0.08, 0.85)),
        verb = f.rKind === "throwing" ? "throw" : "shot";
      if (hit) {
        const dm = Math.max(2, Math.round(f.rdmg * (1.4 + f.rangedSkill / 60) - o.prot * (1 - f.rpierce / 10) * 1.2));
        o.hp -= dm;
        D.log.push(
          f.isPC
            ? `Before they close, your ${verb} with the ${f.rName.toLowerCase()} lands — ${dm} damage.`
            : `${f.short} opens with the ${f.rName.toLowerCase()}: a ${verb} that hits you for ${dm}.`,
        );
      } else D.log.push(f.isPC ? `Your opening ${verb} misses.` : `${f.short}'s opening ${verb} goes wide.`);
    }
  if (D.a.intim && !D.b.beast && D.kind !== "spar") {
    const cut = Math.round(D.a.intim * (D.b.traits.includes("brave") ? 0.4 : 1));
    D.b.wil = Math.max(5, D.b.wil - cut);
    if (cut >= 4) D.log.push(`${D.b.short} meets your eyes and looks away first.`);
  }
  D.cr0 = [A.CR(D.a, D), A.CR(D.b, D)];
  D.gap = D.cr0[1] - D.cr0[0];
  D.intent = A.aiAction(D.b, D.a, D);
  D.intentTech = A.aiTech ? A.aiTech(D.b, D.intent, D) : null;
  D.readHint = A.makeRead(D);
  const desc = D.b.beast
    ? `${A.cap(D.b.short)} — ${(LORE.creatures.find(c => c.id === D.b.beast) || {}).size || ""}`
    : `${D.b.name}${foe && foe.race !== "human" ? ", " + GD.RACES[foe.race].adj : ""}, armed with ${D.b.weapon.toLowerCase()}`;
  D.log.push(
    `${D.title || (D.kind === "spar" ? "Sparring" : D.kind === "beast" ? "The hunt" : "Steel out")}: ${desc}, at ${D.place}.`,
  );
  D.log.push(A.weighText(D));
  A.queue({
    type: "duel",
    d: D,
  });
  return D;
};
