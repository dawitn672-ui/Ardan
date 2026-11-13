// The release's core, missions and line battles: Missions and their stages, line battles.
// Readable source of vendor/ardan-b593143.html with the patch layer baked in (X1, docs/DECISIONS.md D-027). Edit it here.
// Defines: A.MISSION_TYPES, A.TERR_TXT, A.newMission, A.missionMates, A.STAGES, A.milOrder, A.missionView,
// A.statOrSkill, A.checkStatVal, A.missionOdds, A.missionChoose, A.startDuelFront, A.DUEL_END.mission,
// A.stageOutcome, missionStageOutcome, A.missionFinish, missionFinishNow, A.missionClose, A.missionAuto,
// A.CHOICE_FN, A.newLineBattle, A.STAGES (+), A.lineBattleResult, battleStageOutcome, battleFinish.

A.MISSION_TYPES = {
  patrol: {
    name: "Patrol",
    stages: ["approach", "contact", "aftermath"],
  },
  scout: {
    name: "Scouting",
    stages: ["sneak", "observe", "escape"],
  },
  ambush: {
    name: "Ambush",
    stages: ["setup", "spring", "aftermath"],
  },
  raid: {
    name: "Supply raid",
    stages: ["approach", "strike", "escape"],
  },
  escort: {
    name: "Escort",
    stages: ["road", "attacked", "aftermath"],
  },
  hold: {
    name: "Hold the crossing",
    stages: ["prepare", "wave", "crisis"],
  },
  siege: {
    name: "Assault on the walls",
    stages: ["walls", "breach", "aftermath"],
  },
  nightraid: {
    name: "Night raid",
    stages: ["sneak", "strike", "escape"],
  },
  bandits: {
    name: "Bandit hunt",
    stages: ["track", "contact", "aftermath"],
  },
  rescue: {
    name: "Rescue",
    stages: ["sneak", "free", "escape"],
  },
};

A.TERR_TXT = {
  forest: ["beech woods heavy with rain", "dark pines where sound dies", "an oak forest with thick undergrowth"],
  hills: ["rolling hills of gorse and stone walls", "sheep hills cut by gullies", "terraced slopes of olive and vine"],
  mountains: ["a narrow pass between scree slopes", "a goat path above a gorge", "high meadows under snow peaks"],
  plains: ["open fields of stubble", "flat farmland broken by hedges", "a river plain of willows and ditches"],
  steppe: ["grass taller than a man on foot", "endless steppe under a huge sky", "dry grassland cut by gullies"],
  desert: ["rock desert and wind-carved stone", "dunes and a dry wadi", "salt pans shimmering in the heat"],
  marsh: ["reed-beds and black water", "a fen of tussocks and mist", "flooded meadows and willow islands"],
  tundra: ["bare frozen ground", "snowfields and frozen bogs", "birch scrub and ice"],
};

A.newMission = function (pc, enemy, war) {
  const m = pc.mil,
    rank = m ? m.rank : pc.company ? 4 : 0,
    realm = m ? (m.merc ? m.contract || pc.realm : m.realm) : pc.realm,
    prov = A.prov(pc.home);
  let types = war
    ? ["patrol", "scout", "ambush", "raid", "escort", "hold", "siege", "nightraid", "rescue"]
    : ["patrol", "bandits", "escort", "bandits"];
  if (rank >= 4 && war) types = ["ambush", "raid", "hold", "siege", "nightraid"];
  const type = A.pick(types);
  let place = prov;
  if (enemy) {
    const ep = A.S.prov.filter(p => (p.occ || p.owner) === enemy),
      front = ep.filter(p => p.adj.some(j => (A.S.prov[j].occ || A.S.prov[j].owner) === realm));
    place = A.pick(front.length ? front : ep.length ? ep : [prov]);
  }
  // [X1 baked patch events/994-careers CAR-MISSION-SIZE] A mission's size was the men the player's rank leads,
  // whatever the mission: a General's bandit hunt fought 12,800 and logged "Enemy dead: 5,141. Your losses: 0". A
  // bandit hunt is now 20 to 300 men and a mission away from any war at most 400 (A.missionSize); a mission in a war
  // keeps the rank's numbers.
  const size = A.missionSize ? A.missionSize(type, rank, war) : rank <= 0 ? 10 : GD.MIL[Math.min(rank, 9)].leads,
    foeRealm = enemy || "unclaimed",
    fr = A.realm(foeRealm),
    foeTroops = (fr && fr.comp && GD.DOCTRINE[foeRealm]) || GD.DOCTRINE.unclaimed,
    foeTroop = A.pick(foeTroops.filter(Boolean));
  return {
    id: "M" + A.ri(1e3, 99999),
    type,
    title: A.MISSION_TYPES[type].name + (place ? " near " + place.name : ""),
    realm,
    enemy: foeRealm,
    enemyName: enemy ? A.realmShort(enemy) : A.pick(["bandits", "outlaws", "raiders", "deserters"]),
    foeTroop,
    terr: place ? place.terr : "plains",
    place: place ? place.name : "the border",
    stage: 0,
    stages: A.MISSION_TYPES[type].stages.slice(),
    size,
    rank,
    war: war ? war.id : null,
    log: [],
    merit: 0,
    kills: 0,
    losses: 0,
    pcWound: 0,
    over: false,
    success: 0,
    tier: A.clamp(1 + Math.floor(rank / 2) + (war ? 1 : 0), 1, 5),
    cur: null,
  };
};

A.missionMates = function (pc, n) {
  return A.shuffle(A.squad(pc)).slice(0, n);
};

A.STAGES = {
  approach(m, pc, c) {
    const tt = A.pick(A.TERR_TXT[m.terr] || A.TERR_TXT.plains);
    return {
      text: `${A.milOrder(m, pc)} The ground is ${tt}. Somewhere ahead: ${m.enemyName}.`,
      choices: [
        {
          t: "Go in quietly, using every bit of cover",
          check: ["stealth", "ins"],
          diff: 45,
          tag: "stealth",
        },
        {
          t: "March straight in, shields up and ready",
          check: ["command", "str"],
          diff: 50,
          tag: "bold",
        },
        {
          t: `Send ${c[0] ? c[0].given : "a scout"} ahead to look`,
          check: ["tactics", "int"],
          diff: 40,
          tag: "scout",
          mate: 0,
        },
        {
          t: "Wait for dusk and move in the half-light",
          check: ["wil", "ins"],
          diff: 48,
          tag: "patient",
        },
      ],
    };
  },
  sneak(m, pc, c) {
    return {
      text: `${A.milOrder(m, pc)} It must be done unseen. ${A.cap(A.pick(A.TERR_TXT[m.terr] || A.TERR_TXT.plains))} — and sentries of ${m.enemyName}.`,
      choices: [
        {
          t: "Crawl past the sentries on your belly",
          check: ["stealth", "spd"],
          diff: 50,
          tag: "stealth",
        },
        {
          t: "Silence a sentry with your own hands",
          check: ["unarmed", "str"],
          diff: 52,
          tag: "kill",
          duel: 0.4,
        },
        {
          t: `Trust ${c[0] ? c[0].given : "the guide"}, who claims to know a goat path`,
          check: ["survival", "int"],
          diff: 42,
          tag: "mate",
          mate: 0,
        },
        {
          t: "Make a noise elsewhere to draw them off",
          check: ["tactics", "int"],
          diff: 47,
          tag: "trick",
        },
      ],
    };
  },
  setup(m, pc) {
    return {
      text: `${A.milOrder(m, pc)} You have a few hours to choose your ground before ${m.enemyName} come down the road.`,
      choices: [
        {
          t: "High ground, rocks and scrub for cover",
          check: ["tactics", "ins"],
          diff: 44,
          tag: "ground",
        },
        {
          t: "Fell trees across the road to stop them",
          check: ["tactics", "str"],
          diff: 46,
          tag: "block",
        },
        {
          t: "Split your men to hit both ends of the column",
          check: ["command", "int"],
          diff: 55,
          tag: "pincer",
        },
        {
          t: "Keep it simple: one line, one volley, one charge",
          check: ["command", "wil"],
          diff: 42,
          tag: "simple",
        },
      ],
    };
  },
  contact(m, pc, c) {
    const foe = GD.TROOPS[m.foeTroop] ? GD.TROOPS[m.foeTroop].name.toLowerCase() : "soldiers";
    return {
      text: `Contact! ${A.cap(foe)} of ${m.enemyName} — ${m.rank <= 1 ? "a dozen of them" : "more than you hoped"}. Shouts, a horn, the first arrows whip past.`,
      choices: [
        {
          t: "Charge them before they can form up",
          check: ["str", "command"],
          diff: 50,
          tag: "charge",
          duel: 0.45,
        },
        {
          t: "Form a shield wall and let them break on it",
          check: ["shield", "wil"],
          diff: 46,
          tag: "wall",
        },
        {
          t: "Fall back to better ground, step by step",
          check: ["tactics", "sta"],
          diff: 47,
          tag: "fallback",
        },
        {
          t: "Go for their leader yourself",
          check: ["ins", "spd"],
          diff: 55,
          tag: "leader",
          duel: 0.9,
        },
      ],
    };
  },
  observe(m, pc, c) {
    return {
      text: "You are close enough to count their fires. What matters most?",
      choices: [
        {
          t: "Count their numbers and horses exactly",
          check: ["int", "ins"],
          diff: 48,
          tag: "count",
        },
        {
          t: "Find their supply wagons",
          check: ["stealth", "int"],
          diff: 50,
          tag: "supply",
        },
        {
          t: "Get close enough to hear the officers talk",
          check: ["stealth", "wil"],
          diff: 58,
          tag: "listen",
          langCheck: true,
        },
        {
          t: "Take a prisoner back for questioning",
          check: ["str", "unarmed"],
          diff: 56,
          tag: "prisoner",
          duel: 0.5,
        },
      ],
    };
  },
  escape(m, pc, c) {
    return {
      text: "A shout behind you. Dogs. Torches. They know you are here. Get out!",
      choices: [
        {
          t: "Run for it, all at once",
          check: ["spd", "sta"],
          diff: 48,
          tag: "run",
        },
        {
          t: "Scatter and meet at the old ford",
          check: ["survival", "int"],
          diff: 46,
          tag: "scatter",
        },
        {
          t: `Hold the path with ${c[0] ? c[0].given : "one man"} so the rest get away`,
          check: ["wil", "shield"],
          diff: 54,
          tag: "rearguard",
          mate: 0,
          duel: 0.5,
        },
        {
          t: "Hide and wait for them to pass",
          check: ["stealth", "wil"],
          diff: 50,
          tag: "hide",
        },
      ],
    };
  },
  spring(m, pc) {
    return {
      text: `They come — ${m.enemyName}, strung out along the road, careless. Your men look at you. Now?`,
      choices: [
        {
          t: "Now! Loose everything, then charge",
          check: ["command", "ins"],
          diff: 45,
          tag: "now",
        },
        {
          t: "Wait until their whole column is in the trap",
          check: ["wil", "tactics"],
          diff: 52,
          tag: "wait",
        },
        {
          t: "Hit only their baggage and vanish",
          check: ["tactics", "spd"],
          diff: 44,
          tag: "baggage",
        },
      ],
    };
  },
  strike(m, pc, c) {
    return {
      text: "You are in among them. Tents, wagons, horses, half-dressed men grabbing for spears.",
      choices: [
        {
          t: "Fire the wagons and the fodder",
          check: ["spd", "stealth"],
          diff: 45,
          tag: "fire",
        },
        {
          t: "Cut the horse lines and stampede them",
          check: ["riding", "spd"],
          diff: 48,
          tag: "horses",
        },
        {
          t: "Kill as many as you can before they wake",
          check: ["str", "ins"],
          diff: 50,
          tag: "slaughter",
          duel: 0.5,
        },
        {
          t: "Seize their pay chest",
          check: ["str", "int"],
          diff: 55,
          tag: "loot",
        },
      ],
    };
  },
  road(m, pc) {
    return {
      text: `${A.milOrder(m, pc)} Carts, a few frightened travelers, a long road through ${A.pick(A.TERR_TXT[m.terr] || A.TERR_TXT.plains)}.`,
      choices: [
        {
          t: "Send riders ahead and to the flanks",
          check: ["tactics", "riding"],
          diff: 44,
          tag: "screen",
        },
        {
          t: "Keep everyone close and push hard",
          check: ["command", "sta"],
          diff: 44,
          tag: "push",
        },
        {
          t: "Take the long safe road instead",
          check: ["survival", "wil"],
          diff: 40,
          tag: "safe",
        },
      ],
    };
  },
  attacked(m, pc, c) {
    return {
      text: `Arrows from the trees! A cart horse screams and goes down. ${m.enemyName} pour out of cover.`,
      choices: [
        {
          t: "Circle the carts and fight from behind them",
          check: ["command", "shield"],
          diff: 46,
          tag: "carts",
        },
        {
          t: "Counter-charge into the trees",
          check: ["str", "wil"],
          diff: 52,
          tag: "counter",
          duel: 0.6,
        },
        {
          t: "Get the travelers away, abandon the cargo",
          check: ["tactics", "int"],
          diff: 42,
          tag: "save",
        },
      ],
    };
  },
  prepare(m, pc) {
    return {
      text: `${A.milOrder(m, pc)} Hold this crossing until relieved. ${m.enemyName} will come by noon tomorrow.`,
      choices: [
        {
          t: "Dig a ditch and plant stakes all night",
          check: ["sta", "tactics"],
          diff: 44,
          tag: "stakes",
        },
        {
          t: "Wreck the bridge timbers so they must wade",
          check: ["str", "int"],
          diff: 46,
          tag: "wreck",
        },
        {
          t: "Rest the men; fresh legs win fights",
          check: ["wil", "command"],
          diff: 44,
          tag: "rest",
        },
      ],
    };
  },
  wave(m, pc, c) {
    return {
      text: `They come across in a solid mass, shields locked, war cries in ${m.enemyName === "bandits" ? "every tongue" : "their own tongue"}.`,
      choices: [
        {
          t: "Hold! Hold the line!",
          check: ["wil", "shield"],
          diff: 52,
          tag: "hold",
        },
        {
          t: "Loose arrows and stones while they wade",
          check: ["bow", "command"],
          diff: 47,
          tag: "missile",
        },
        {
          t: "Charge them in the water where they stumble",
          check: ["str", "spd"],
          diff: 54,
          tag: "charge",
          duel: 0.5,
        },
      ],
    };
  },
  crisis(m, pc, c) {
    const v = c[0];
    return {
      text: `The line bends. ${v ? v.given + " is down, crying out, an enemy standing over " + A.him(v) + "." : "A gap opens on the left."} Men are looking back over their shoulders.`,
      choices: [
        {
          t: v ? `Fight your way to ${v.given}` : "Plug the gap yourself",
          check: ["str", "wil"],
          diff: 55,
          tag: "save",
          mate: 0,
          duel: 0.7,
        },
        {
          t: "Rally the men with a shout and your banner",
          check: ["command", "wil"],
          diff: 52,
          tag: "rally",
        },
        {
          t: "Order a fighting retreat — the crossing is lost",
          check: ["tactics", "int"],
          diff: 45,
          tag: "retreat",
        },
      ],
    };
  },
  walls(m, pc) {
    return {
      text: `${A.milOrder(m, pc)} The walls of ${m.place} stand before you. Ladders are handed out.`,
      choices: [
        {
          t: "Up the ladders with the first wave",
          check: ["str", "wil"],
          diff: 56,
          tag: "ladder",
          duel: 0.6,
        },
        {
          t: "Cover the climbers with crossbows",
          check: ["xbow", "ins"],
          diff: 46,
          tag: "cover",
        },
        {
          t: "Find a weaker stretch of wall",
          check: ["ins", "tactics"],
          diff: 50,
          tag: "weak",
        },
      ],
    };
  },
  breach(m, pc, c) {
    return {
      text: "On the wall-walk: boiling water, stones, a spearman in your face.",
      choices: [
        {
          t: "Cut your way along the wall to the gate",
          check: ["str", "ins"],
          diff: 55,
          tag: "gate",
          duel: 0.7,
        },
        {
          t: "Hold the ladder-head so more can climb",
          check: ["shield", "wil"],
          diff: 50,
          tag: "hold",
        },
        {
          t: "Take the tower stair",
          check: ["spd", "ins"],
          diff: 54,
          tag: "tower",
        },
      ],
    };
  },
  track(m, pc) {
    return {
      text: `${A.milOrder(m, pc)} Burned farms and a trail of stolen cattle lead into ${A.pick(A.TERR_TXT[m.terr] || A.TERR_TXT.plains)}.`,
      choices: [
        {
          t: "Follow the trail fast",
          check: ["survival", "sta"],
          diff: 44,
          tag: "fast",
        },
        {
          t: "Ask the villagers where they hide",
          check: ["diplomacy", "int"],
          diff: 42,
          tag: "ask",
        },
        {
          t: "Set a trap with a fat cattle drive as bait",
          check: ["tactics", "int"],
          diff: 50,
          tag: "bait",
        },
      ],
    };
  },
  free(m, pc, c) {
    return {
      text: "The prisoners are in a barn with two guards at the door and more asleep inside.",
      choices: [
        {
          t: "Kill the guards quietly",
          check: ["stealth", "str"],
          diff: 52,
          tag: "quiet",
          duel: 0.5,
        },
        {
          t: "Set a fire as a distraction",
          check: ["int", "spd"],
          diff: 48,
          tag: "fire",
        },
        {
          t: "Bribe a guard with your own coin",
          check: ["diplomacy", "int"],
          diff: 45,
          tag: "bribe",
          cost: 20,
        },
      ],
    };
  },
  aftermath(m, pc, c) {
    return {
      text: `It is over. Smoke, the moaning wounded, ${m.kills > 0 ? "enemy dead in the grass, " : ""}and choices about what comes next.`,
      choices: [
        {
          t: "Spare the prisoners and send them home",
          check: ["wil", "diplomacy"],
          diff: 30,
          tag: "mercy",
        },
        {
          t: "Loot the dead — the men have earned it",
          check: ["int", "str"],
          diff: 30,
          tag: "loot",
        },
        {
          t: "Tend the wounded before anything else",
          check: ["medicine", "int"],
          diff: 35,
          tag: "tend",
        },
        {
          t: "Report honestly, even what went wrong",
          check: ["wil", "learning"],
          diff: 30,
          tag: "honest",
        },
      ],
    };
  },
};

A.milOrder = function (m, pc) {
  const who =
      m.rank <= 0
        ? "Your file-leader"
        : m.rank <= 2
          ? "Your captain"
          : m.rank <= 4
            ? "Orders from the commander"
            : "Orders from the marshal",
    unit = A.milUnitWord(m.rank),
    what = {
      patrol: "patrol the border villages",
      scout: "find the enemy and count them",
      ambush: "ambush an enemy column",
      raid: "burn the enemy's stores",
      escort: "escort a supply train",
      hold: "hold a ford against attack",
      siege: `take the walls of ${m.place}`,
      nightraid: "raid the enemy camp by night",
      bandits: "hunt the bandits who burn farms",
      rescue: "free captives held in an enemy camp",
    }[m.type];
  return `${who}: take your ${unit}${m.size > 10 ? " (" + A.fmt(m.size) + ")" : ""} and ${what}.`;
};

A.missionView = function (m) {
  const pc = A.pc(),
    st = m.stages[m.stage];
  if (m.over || typeof A.STAGES[st] != "function") {
    if (!m.over) A.missionFinish(m);
    m.cur = null;
    return null;
  }
  const mates = A.missionMates(pc, 3);
  m.mates = mates.map(x => x.id);
  const v = A.STAGES[st](m, pc, mates);
  m.cur = {
    text: v.text,
    choices: v.choices.map(ch => ({
      t: ch.t,
      check: ch.check,
      diff: ch.diff,
      tag: ch.tag,
      duel: ch.duel || 0,
      mate: ch.mate != null ? ch.mate : null,
      cost: ch.cost || 0,
      langCheck: !!ch.langCheck,
      odds: A.missionOdds(pc, m, ch),
    })),
  };
  return m.cur;
};

A.statOrSkill = (p, k) => (GD.STATS.includes(k) ? A.stat(p, k) : A.skill(p, k));

A.checkStatVal = function (p, k) {
  if (GD.STATS.includes(k)) return A.stat(p, k);
  const st = A.stats(p),
    avg = (st.str + st.spd + st.ins + st.sta + st.int + st.wil) / 6;
  return Math.max(A.skillEff(p, k), 8 + avg * 0.35);
};

A.missionOdds = function (pc, m, ch) {
  const [k1, k2] = ch.check;
  let v = A.checkStatVal(pc, k1) * 0.5 + A.checkStatVal(pc, k2) * 0.5;
  if (((v += Math.min(10, A.squad(pc).length) * 0.9 + Math.min(m.rank, 9) * 1.5), ch.mate != null)) {
    const mt = A.P((m.mates || [])[ch.mate]);
    if (mt) v += (A.checkStatVal(mt, k1) - 25) * 0.3;
  }
  if (m.rank >= 3) v += A.skill(pc, "command") * 0.12;
  if (A.armBonus) v += A.armBonus(pc, m.isBattle ? "battle" : "mission");
  const diff = 32 + (ch.diff - 45) * 0.8 + (m.tier - 2) * 6;
  return A.clamp(Math.round(50 + (v - diff) * 1.3), 5, 95);
};

A.missionChoose = function (i) {
  const q = A.S.queue[0];
  if (!q || q.type !== "mission") return null;
  const m = q.m,
    pc = A.pc();
  if ((m.cur || A.missionView(m), m.over || !m.cur)) return m;
  const ch = m.cur.choices[i];
  if (!ch) return m;
  if (ch.cost && pc.coin < ch.cost) {
    m.log.push("You do not have the coin.");
    return m;
  }
  if (ch.cost) pc.coin -= ch.cost;
  let odds = ch.odds;
  if (ch.langCheck && !pc.langs.some(l => l === GD.LANG[A.cultureFor("human", m.enemy)])) odds -= 15;
  const roll = A.ri(1, 100),
    tier = roll <= odds - 30 ? 3 : roll <= odds ? 2 : roll <= odds + 20 ? 1 : 0,
    [k1, k2] = ch.check;
  if (GD.STATS.includes(k1)) A.train(pc, k1, 0.5);
  else A.trainSkill(pc, k1, 2.5);
  if (GD.STATS.includes(k2)) A.train(pc, k2, 0.4);
  else A.trainSkill(pc, k2, 2);
  const mates = (m.mates || []).map(A.P).filter(p => p && p.alive),
    txt = A.stageOutcome(m, pc, ch, tier, mates);
  if (
    (m.log.push(`» ${ch.t}`),
    m.log.push(txt),
    (m.success += tier),
    ch.duel && A.chance(ch.duel) && tier <= 2 && !m.duelDone)
  ) {
    m.duelDone = true;
    const foe = A.makeFoe({
      realm: m.enemy,
      troop: m.foeTroop,
      tier: m.tier + (ch.tag === "leader" ? 1 : 0),
      title: ch.tag === "leader" ? "their leader" : null,
    });
    m.stage++;
    m.cur = null;
    A.S.queue.splice(1, 0, q);
    A.S.queue.shift();
    A.startDuelFront(pc, foe, {
      kind: "war",
      place: m.place,
      lethal: true,
      toYield: true,
      ground: ch.tag === "gate" || ch.tag === "tower" || ch.tag === "hold" ? "passage" : "open",
      light: m.type === "nightraid" || m.type === "sneak" ? "night" : "day",
      title: `${m.title} — single combat`,
      onEnd: {
        fn: "mission",
        arg: m.id,
      },
    });
    m.log.push(`${foe.given} of ${m.enemyName} comes at you with ${(GD.GEAR[foe.gear.weapon] || {}).name || "steel"}.`);
    return m;
  }
  m.stage++;
  m.cur = null;
  if (m.stage >= m.stages.length || pc.health <= 0) A.missionFinish(m);
  return m;
};

A.startDuelFront = function (pc, foe, opts) {
  const n0 = A.S.queue.length,
    r = A.startDuel(pc, foe, opts);
  if (A.S.queue.length > n0) {
    const d = A.S.queue.pop();
    if (d.conv && A.S.queue[0] && A.S.queue[0].type === "event" && !A.S.queue[0].result) A.S.queue.splice(1, 0, d);
    else A.S.queue.unshift(d);
    return d;
  }
  return r;
};

A.DUEL_END.mission = function (D, mid) {
  const q = A.S.queue[0];
  if (!q || q.type !== "mission" || q.m.id !== mid) return;
  const m = q.m;
  if (D.result === "win") {
    m.kills++;
    m.success += 2;
    m.log.push(`You won your fight. ${D.b.short} lies still.`);
    A.pc().kills = A.pc().kills;
  } else {
    if (D.result === "lose") {
      m.success -= 1;
      m.log.push("You lost your fight, and live — barely.");
    } else m.log.push("The fight broke apart in the chaos.");
  }
  if (m.stage >= m.stages.length) A.missionFinish(m);
};

A.stageOutcome = function (m, pc, ch, tier, mates) {
  return m.isBattle ? battleStageOutcome(m, pc, ch, tier, mates) : missionStageOutcome(m, pc, ch, tier, mates);
};

const missionStageOutcome = function (m, pc, ch, tier, mates) {
  const mate = ch.mate != null ? mates[ch.mate] : null,
    e = m.enemyName;
  let out = "";
  const scale = m.size,
    killEnemy = n => {
      m.kills += n;
    },
    loseMen = sev => {
      const lines = [];
      if (scale <= 40) {
        const n = sev >= 2 ? A.ri(1, 2) : A.chance(0.5) ? 1 : 0;
        for (let i = 0; i < n; i++) {
          const vict = i === 0 && mate && A.chance(0.6) ? mate : A.pick(A.squad(pc));
          if (vict) {
            const how = A.pick([
              "a bolt through the throat",
              "a spear under the arm",
              "an axe to the head",
              "an arrow in the eye",
              "trampled in the press",
              "bled out from a thigh wound before anyone could stop it",
              "dragged off a ladder by a hook",
              "a sword thrust through the mail",
            ]);
            lines.push(A.comradeDies(pc, vict, how));
            m.losses++;
          }
        }
      } else {
        const n = Math.round(scale * A.rf(0.02, 0.06) * sev);
        if (((m.losses += n), lines.push(`${A.fmt(n)} of your ${A.milUnitWord(m.rank)} fall.`), A.chance(0.4))) {
          const vict = A.pick(A.squad(pc));
          if (vict)
            lines.push(
              A.comradeDies(
                pc,
                vict,
                A.pick([
                  "killed leading the left file",
                  "shot down carrying your orders",
                  "cut down holding the banner",
                ]),
              ),
            );
        }
      }
      return lines.join(" ");
    },
    hurtPC = (n, why) => {
      if (
        ((n = Math.round(n * 0.65)),
        (pc.health = A.clamp(pc.health - n, 0, 100)),
        (m.pcWound += n),
        (pc.lastHurt = why || "wounds taken " + m.title.toLowerCase()),
        n > 18 && A.chance(0.3))
      ) {
        const w = A.addWound(pc, A.pick(["scar_arm", "arrow_wound", "deep_cut", "scar_face", "broken_ribs", "limp"]));
        if (w) return ` (${w})`;
      }
      return "";
    },
    T = ch.tag;
  if (tier >= 2) {
    const great = tier === 3,
      kills = Math.max(1, Math.round((scale <= 10 ? A.ri(1, 4) : scale * A.rf(0.05, 0.15)) * (great ? 1.6 : 1)));
    if (
      (killEnemy(kills),
      (m.merit += great ? 12 : 7),
      (out =
        {
          stealth: `Not a twig snaps. You are on top of ${e} before they know it.`,
          bold: "They see you coming, and they flinch first.",
          scout: `${mate ? mate.given : "Your scout"} comes back grinning: you know exactly where they are.`,
          patient: "The dusk hides you perfectly.",
          kill: "A hand over the mouth, a knife, a body lowered gently to the ground.",
          mate: `${mate ? mate.given : "Your guide"}'s goat path is real. You are through.`,
          trick: "They run toward the noise like fools.",
          ground: "Your ground is perfect: they will be shooting uphill.",
          block: "The trees come down across the road with a crash that will trap them.",
          pincer: "Both halves of your force are in place, unseen.",
          simple: "Everyone knows what to do. That is half of war.",
          charge: `You crash into ${e} before their shields are up. ${kills} go down.`,
          wall: `They break on your shields like surf. ${kills} fall in front of you.`,
          fallback: "You give ground in perfect order and they follow into a worse place.",
          leader: "You go straight for their leader through the press.",
          count: "You come away with numbers the generals will pay for.",
          supply: "You find the wagons: flour, bolts, fodder. Gold to a raider.",
          listen: "You hear their plans from their own officers' lips.",
          prisoner: "You drag back a gagged prisoner who will talk.",
          run: "You run like hares and every one of you makes it.",
          scatter: "Everyone reaches the ford by dawn.",
          rearguard: `You and ${mate ? mate.given : "one brave man"} hold the path long enough. Then you run too.`,
          hide: "Boots pass a yard from your face. They never look down.",
          now: `Arrows, then steel. ${kills} of them fall in the first minute.`,
          wait: "You wait until the whole column is in the trap. Then you shut it.",
          baggage: "Their baggage burns and you are gone before they turn.",
          fire: "Fire runs through their stores. That army will be hungry this winter.",
          horses: "Their horses scatter into the night. Cavalry without horses is just men.",
          slaughter: `${kills} die before the camp wakes.`,
          loot: "You come away with a heavy chest.",
          screen: "Your riders spot the ambush before it springs.",
          push: "You push hard and make the town by nightfall.",
          safe: "The long road is boring and safe. Good.",
          carts: "Behind the carts you shoot them down as they come.",
          counter: "You go into the trees after them, and they did not expect that.",
          save: "Every traveler gets away.",
          stakes: "By dawn the bank bristles with stakes.",
          wreck: "The bridge timbers go into the river.",
          rest: "Your men wake fresh and ready.",
          hold: `The line holds. It holds! ${kills} of them die on your shields.`,
          missile: `They wade into a storm of arrows. ${kills} fall in the water.`,
          save2: "",
          rally: "Your voice carries over the din. The men turn back and the line closes.",
          retreat: "You pull out in good order, carrying your wounded.",
          ladder: "You are up and over before the defenders can push the ladder off.",
          cover: "Your bolts sweep the battlements clear.",
          weak: "You find a crumbling stretch where the wall is half the height.",
          gate: "You cut your way to the gate and lift the bar. The army pours in.",
          tower: "You take the tower stair and its archers.",
          fast: "You catch them before they reach the hills.",
          ask: "An old woman tells you everything.",
          bait: "They take the bait, as bandits always do.",
          quiet: "The guards die without a sound.",
          bribe: "The guard pockets your silver and looks the other way.",
          mercy: "You let the prisoners go. Some of them will remember.",
          tend: "Thanks to you, men who should have died will live.",
          honest: "You report it all, good and bad. Your captain notices honesty.",
        }[T] || "It goes well."),
      T === "save" &&
        mate &&
        ((out = `You hack your way to ${mate.given} and drag ${A.him(mate)} back behind the shields. ${A.cap(A.he(mate))} will never forget it.`),
        A.addOp(pc, mate, 30),
        (m.merit += 5),
        A.fame(pc, 2)),
      T === "mercy" && (pc.honor = A.clamp(pc.honor + 6, 0, 100)),
      T === "loot" && (m.stages[m.stage] === "aftermath" || m.stages[m.stage] === "strike"))
    ) {
      const g = Math.round(A.ri(5, 25) * (1 + m.rank));
      pc.coin += g;
      out += ` Your share: ${A.coin(g)}.`;
      pc.honor = A.clamp(pc.honor - 2, 0, 100);
    }
    if (T === "tend") {
      pc.honor = A.clamp(pc.honor + 3, 0, 100);
      A.trainSkill(pc, "medicine", 4);
    }
    if (T === "honest") {
      pc.honor = A.clamp(pc.honor + 4, 0, 100);
      m.merit += 4;
    }
    if (mate) A.addOp(pc, mate, 6);
    if (great && A.chance(0.3)) out += " The men talk about it for weeks.";
  } else if (tier === 1) {
    m.merit += 3;
    killEnemy(scale <= 10 ? A.ri(0, 2) : Math.round(scale * 0.04));
    out = A.pick([
      `It half works. ${e} are hurt, but so are you.`,
      "Not clean, not pretty, but done.",
      "Something goes wrong at the worst moment, but you scramble through.",
      "You get what you came for, at a price.",
    ]);
    if (A.chance(0.5)) out += " " + loseMen(1);
    if (A.chance(0.4)) out += hurtPC(A.ri(5, 15));
  } else {
    m.merit += 1;
    out = A.pick([
      `It goes badly wrong. ${e} were ready.`,
      "Shouts, chaos, blood. Your plan dies in the first minute.",
      "Everything that could go wrong does.",
      `You walk straight into ${e}.`,
    ]);
    out += " " + loseMen(2);
    out += hurtPC(A.ri(8, 28));
    if (T === "mercy") out = "The prisoners you freed are back in the line a week later. Some of your men mutter.";
    if (T === "honest") {
      out = "Your honest report makes your captain look bad. He will remember that.";
      m.merit -= 2;
    }
    if (T === "bribe") out = "The guard takes your coin — and shouts for his friends.";
  }
  pc.willAdapt = pc.willAdapt || 0;
  return out;
};

A.missionFinish = function (m) {
  return m.isBattle ? battleFinish(m) : missionFinishNow(m);
};

const missionFinishNow = function (m) {
  if (m.over) return;
  m.over = true;
  const pc = A.pc(),
    avg = m.success / Math.max(1, m.stages.length);
  m.result = avg >= 2.2 ? "triumph" : avg >= 1.4 ? "success" : avg >= 0.8 ? "mixed" : "failure";
  const bonus = {
    triumph: 15,
    success: 8,
    mixed: 2,
    failure: -3,
  }[m.result];
  m.merit += bonus;
  if (pc.mil) {
    pc.mil.merit += Math.max(0, m.merit);
    pc.mil.missions++;
    pc.mil.kills += m.kills;
  }
  pc.kills += m.kills > 0 && m.size <= 20 ? Math.min(m.kills, 3) : m.kills > 0 ? A.ri(0, 2) : 0;
  A.fame(pc, m.result === "triumph" ? 3 : m.result === "success" ? 1 : 0);
  A.trainSkill(pc, "tactics", 2);
  A.trainSkill(pc, "command", m.rank >= 1 ? 2 : 0.5);
  if (m.losses > 0) A.willGrow(pc, 0.3 + m.losses * 0.2, "losses");
  const w = A.S.wars.find(x => x.id === m.war);
  if (w && pc.mil) {
    const side = A.warSide(w, m.realm),
      d =
        {
          triumph: 3,
          success: 1.5,
          mixed: 0,
          failure: -1.5,
        }[m.result] *
        (1 + m.rank * 0.5);
    w.score = A.clamp(w.score + (side === "att" ? d : -d), -100, 100);
  }
  m.log.push(
    `— ${m.title}: ${A.cap(m.result)}. Enemy dead: ${A.fmt(m.kills)}. Your losses: ${A.fmt(m.losses)}. Merit +${Math.max(0, m.merit)}.`,
  );
  if (pc.health <= 0) m.log.push("You do not walk away from this one.");
};

A.missionClose = function () {
  const q = A.S.queue[0];
  if (!q || q.type !== "mission") return;
  const m = q.m;
  A.S.queue.shift();
  // [X1 baked patch war/44-rank-battles RB-LINE-RESULT] A soldier's line battle nudged its war-map fight by a fixed
  // amount, which never changed a result in 30 measured fights. Its grade (triumph, success, mixed, failure) now
  // becomes a performance that moves both sides' order (A.rankResult).
  if (m.wsKey) {
    if (A.rankResult) A.rankResult(m.wsKey, "line", m);
    else {
      if (A.wsNudge)
        A.wsNudge(m.wsKey, m.result === "triumph" || m.result === "success", m.result === "triumph" ? 0.6 : 0.35);
    }
  }
  const pc = A.pc();
  A.log(
    m.log[m.log.length - 1],
    m.result === "triumph" || m.result === "success" ? "good" : m.result === "failure" ? "bad" : "",
  );
  if (!(pc.health <= 0 && A.mortalCheck(pc, pc.lastHurt || "wounds taken in battle"))) A.promoCheck(pc);
};

A.missionAuto = function (m) {
  let g = 0;
  for (; !m.over && g++ < 10 && (m.cur || A.missionView(m), !(m.over || !m.cur)); ) {
    const best = m.cur.choices.reduce((bi, c, i, arr) => (c.odds > arr[bi].odds ? i : bi), 0);
    A.missionChoose(A.chance(0.7) ? best : A.ri(0, m.cur.choices.length - 1));
    if (A.S.queue[0] && A.S.queue[0].type === "duel") {
      A.duelAuto(A.S.queue[0].d);
      A.duelClose();
    }
  }
};

A.CHOICE_FN = {
  noop() {},
  battle(arg) {
    const pc = A.pc();
    A._battlePlace = arg.pid != null ? arg.pid : null;
    try {
      if (pc.mil && pc.mil.rank >= 4)
        A.queue({
          type: "battle",
          b: A.newBattleForPC(pc, arg.war, arg.enemy),
        });
      else
        A.queue({
          type: "mission",
          m: A.newLineBattle(pc, arg.war, arg.enemy),
        });
    } finally {
      A._battlePlace = null;
    }
  },
  campaign(arg) {
    A.queue({
      type: "warroom",
      war: arg,
    });
  },
  warroom(arg) {
    A.queue({
      type: "warroom",
      war: arg,
    });
  },
};

A.newLineBattle = function (pc, warId, enemy) {
  const m = A.newMission(
    pc,
    enemy,
    A.S.wars.find(w => w.id === warId),
  );
  m.type = "line";
  m.title = "Battle of " + m.place;
  m.stages = ["lineDeploy", "lineMissile", "lineClash", "lineBreak"];
  m.isBattle = true;
  const r = A.realm(m.realm),
    e = A.realm(enemy);
  m.armyA = Math.round(Math.min(r ? r.army * 0.3 : 5e3, 3e4) * A.rf(0.5, 1));
  m.armyB = Math.round(Math.min(e ? e.army * 0.3 : 5e3, 3e4) * A.rf(0.5, 1.1));
  m.armyA = Math.max(800, m.armyA);
  m.armyB = Math.max(800, m.armyB);
  return m;
};

Object.assign(A.STAGES, {
  lineDeploy(m, pc, c) {
    return {
      text: `Dawn. ${A.fmt(m.armyA)} of ${A.realmShort(m.realm)} form up against ${A.fmt(m.armyB)} of ${m.enemyName} across ${A.pick(A.TERR_TXT[m.terr] || A.TERR_TXT.plains)}. You stand in the ${A.pick(["third", "second", "front", "fourth"])} rank of ${pc.mil ? pc.mil.unit : "your company"}, ${c[0] ? c[0].given : "a stranger"} at your shoulder. Hours of waiting. Someone throws up.`,
      choices: [
        {
          t: "Say a prayer and check your straps",
          check: ["wil", "faith"],
          diff: 35,
          tag: "pray",
        },
        {
          t: "Crack a joke to steady the men",
          check: ["diplomacy", "wil"],
          diff: 40,
          tag: "joke",
        },
        {
          t: "Study the enemy line for weak spots",
          check: ["tactics", "ins"],
          diff: 45,
          tag: "study",
        },
      ],
    };
  },
  lineMissile(m, pc) {
    return {
      text: "The arrow storm. It sounds like tearing cloth, then like hail on a roof. Men drop around you.",
      choices: [
        {
          t: "Shield up, head down, endure it",
          check: ["shield", "wil"],
          diff: 44,
          tag: "endure",
        },
        {
          t: "Shoot back if you have a bow",
          check: ["bow", "ins"],
          diff: 46,
          tag: "shoot",
        },
        {
          t: "Drag a wounded man back through the ranks",
          check: ["str", "medicine"],
          diff: 45,
          tag: "drag",
        },
      ],
    };
  },
  lineClash(m, pc, c) {
    return {
      text: `The lines meet with a crash you feel in your teeth. Shoving, stabbing, screaming. A big ${m.enemyName === "bandits" ? "outlaw" : "soldier"} of ${m.enemyName} locks eyes with you.`,
      choices: [
        {
          t: "Fight him",
          check: ["ins", "str"],
          diff: 50,
          tag: "duelline",
          duel: 1,
        },
        {
          t: "Hold your place and keep the shield wall tight",
          check: ["shield", "sta"],
          diff: 46,
          tag: "tight",
        },
        {
          t: "Push forward into the gap",
          check: ["str", "wil"],
          diff: 54,
          tag: "push",
        },
      ],
    };
  },
  lineBreak(m, pc, c) {
    m.outcome = A.lineBattleResult(m, pc);
    const win = m.outcome === "win";
    return {
      text: win
        ? `A roar runs down the line: they are breaking! ${m.enemyName} turn and run, throwing away shields.`
        : "Your rear ranks start to edge back. Then the whole line goes. You are breaking!",
      choices: win
        ? [
            {
              t: "Chase them down — the rout is where the killing is",
              check: ["spd", "sta"],
              diff: 42,
              tag: "chase",
            },
            {
              t: "Stay with the wounded",
              check: ["medicine", "wil"],
              diff: 35,
              tag: "tend",
            },
            {
              t: "Strip the dead for loot",
              check: ["int", "str"],
              diff: 30,
              tag: "loot",
            },
          ]
        : [
            {
              t: "Run for the woods",
              check: ["spd", "sta"],
              diff: 48,
              tag: "run",
            },
            {
              t: "Stand with the rearguard and cover the retreat",
              check: ["wil", "shield"],
              diff: 56,
              tag: "rearguard",
              duel: 0.5,
            },
            {
              t: "Throw down your weapon and surrender",
              check: ["diplomacy", "wil"],
              diff: 40,
              tag: "surrender",
            },
          ],
    };
  },
});

A.lineBattleResult = function (m, pc) {
  const r = A.realm(m.realm),
    e = A.realm(m.enemy),
    qa = r ? r.armyQ : 1,
    qe = e ? e.armyQ : 0.9,
    pa =
      m.armyA *
      qa *
      A.rf(0.75, 1.25) *
      (1 + m.success * 0.03) *
      (1 + (A.armBonus ? A.armBonus(pc, "battle") : 0) / 100),
    pe = m.armyB * qe * A.rf(0.75, 1.25);
  return pa > pe ? "win" : "loss";
};

const battleStageOutcome = function (m, pc, ch, tier, mates) {
    const T = ch.tag,
      t = tier >= 2,
      mate = mates[0];
    let out = "";
    if (
      (T === "pray" && (out = t ? "A calm settles over you." : "Your hands still shake."),
      T === "joke" &&
        ((out = t ? "The men around you laugh. The fear loosens." : "Nobody laughs."),
        t && mate && A.addOp(pc, mate, 5)),
      T === "study" && (out = t ? "You spot it: their left is all green levies." : "You see nothing but spears."),
      T === "endure" &&
        (out = t
          ? "Arrows thud into your shield. None find you."
          : "An arrow punches through your shield and into your arm."),
      T === "shoot" &&
        (out = t ? "You loose shaft after shaft into their ranks." : "Your arrows vanish into the mass."),
      T === "drag" &&
        ((out = t
          ? "You drag a boy with an arrow in his thigh to the surgeons. He lives."
          : "The man dies in your arms before you reach the rear."),
        t && (pc.honor = A.clamp(pc.honor + 4, 0, 100))),
      T === "tight" && (out = t ? "The wall holds around you." : "The wall buckles; you are shoved and trampled."),
      T === "push" &&
        (out = t
          ? "You push into the gap and the men follow you. The enemy line bends."
          : "You push into the gap — alone."),
      T === "duelline" && (out = "You meet him."),
      T === "chase")
    ) {
      const k = A.ri(1, 5);
      m.kills += k;
      out = t ? `You run them down. ${k} men who will never go home.` : "You chase, but your legs are lead.";
    }
    if (
      (T === "tend" &&
        ((out = "You stay with the wounded through the night."), (pc.honor = A.clamp(pc.honor + 3, 0, 100))),
      T === "loot")
    ) {
      const g = A.ri(3, 40);
      pc.coin += g;
      out = `Rings, a purse, a good knife: ${A.coin(g)}.`;
    }
    if (
      (T === "run" &&
        (out = t
          ? "You make the trees with your lungs on fire. Alive."
          : "Horsemen ride down the men around you. You barely make it."),
      T === "rearguard" &&
        ((out = t ? "You hold with a handful of others. Hundreds escape because of you." : "The rearguard is overrun."),
        t && ((m.merit += 15), A.fame(pc, 4))),
      T === "surrender" &&
        (t
          ? (out = "They take you prisoner. You are exchanged after the campaign.")
          : ((out = "They are not taking prisoners today."), (pc.health -= 25))),
      tier >= 2 && ((m.merit += 5), (m.kills += T === "push" || T === "shoot" ? A.ri(1, 3) : 0)),
      tier === 0 && A.chance(0.6))
    ) {
      const hurt = A.ri(8, 25);
      if (
        ((pc.health = A.clamp(pc.health - hurt, 0, 100)),
        (pc.lastHurt = "wounds taken in the battle line"),
        A.chance(0.3))
      ) {
        const w = A.addWound(pc, A.pick(["arrow_wound", "scar_arm", "broken_ribs", "deep_cut", "concussion"]));
        if (w) out += ` (${w})`;
      }
    }
    if (tier <= 1 && mate && A.chance(0.35))
      out +=
        " " +
        A.comradeDies(
          pc,
          mate,
          A.pick([
            "a spear in the face",
            "an arrow through the neck",
            "crushed in the press",
            "a falchion across the throat",
          ]),
        );
    m.success += tier;
    return out;
  },
  battleFinish = function (m) {
    if (m.over) return;
    m.over = true;
    const pc = A.pc();
    if (!m.outcome) m.outcome = A.lineBattleResult(m, pc);
    const win = m.outcome === "win",
      lossA = Math.round(m.armyA * (win ? A.rf(0.05, 0.12) : A.rf(0.18, 0.38))),
      lossB = Math.round(m.armyB * (win ? A.rf(0.18, 0.38) : A.rf(0.05, 0.12))),
      w = A.S.wars.find(x => x.id === m.war);
    if (w) {
      const side = A.warSide(w, m.realm),
        d = win ? A.ri(10, 18) : -A.ri(10, 18);
      w.score = A.clamp(w.score + (side === "att" ? d : -d), -100, 100);
      w.battles.push({
        y: A.S.year,
        name: m.title,
        win: win ? side : side === "att" ? "def" : "att",
        lossW: win ? lossA : lossB,
        lossL: win ? lossB : lossA,
      });
      A.applyLosses([m.realm], lossA);
      A.applyLosses([m.enemy], lossB);
    }
    if (pc.mil) {
      pc.mil.battles++;
      pc.mil.merit += Math.max(0, m.merit) + (win ? 10 : 3);
      pc.mil.kills += m.kills;
    }
    pc.kills += Math.min(m.kills, 6);
    if (pc.mil && pc.mil.battles >= 10) A.ach("ten_battles");
    A.willGrow(pc, win ? 0.6 : 1.5, "battle");
    A.fame(pc, win ? 2 : 0);
    m.result = win ? "success" : "failure";
    const txt = `${m.title}: ${win ? "VICTORY" : "DEFEAT"} for ${A.realmShort(m.realm)}. ${A.fmt(lossA)} of yours dead, ${A.fmt(lossB)} of theirs.`;
    m.log.push("— " + txt);
    A.news(txt, "battle");
    if (pc.health <= 0) m.log.push("You do not walk away from this field.");
  };
