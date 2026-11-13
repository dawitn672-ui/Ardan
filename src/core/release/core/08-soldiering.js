// The release's core, soldiering: The squad, comrades, resigning, deserting, the soldier's year.
// Readable source of vendor/ardan-b593143.html with the patch layer baked in (X1, docs/DECISIONS.md D-028). Edit it here.
// Defines: A.makeSquad, A.squad, A.comradeDies, A.resign, A.desert, A.milYear, milYearNow.

A.makeSquad = function (pc) {
  const m = pc.mil,
    realm = m.realm || pc.realm,
    n = 9 - m.squad.filter(id => A.P(id) && A.P(id).alive).length;
  for (let i = 0; i < n; i++) {
    const r = A.realm(realm);
    let race = r ? r.race : "human";
    if (m.merc || A.chance(0.12)) race = A.pick(["human", "human", "halforc", "orc", "dwarf", "halfelf"]);
    if (race === "giant") race = "human";
    const cult = A.cultureFor(race, realm),
      sex = A.chance(0.9) ? "M" : "F",
      R2 = GD.RACES[race],
      taken = new Set(
        [pc.given].concat(
          m.squad
            .map(A.P)
            .filter(x => x && x.alive)
            .map(x => x.given),
        ),
      );
    let given = A.givenName(cult, sex);
    for (let t = 0; t < 12 && taken.has(given); t++) given = A.givenName(cult, sex);
    const c = A.newPerson({
        given,
        sex,
        race,
        realm,
        cult,
        faith: A.faithFor(race, realm),
        born: A.S.year - (R2.adult + A.ri(1, 14)),
        status: A.pick(["peasant", "peasant", "artisan", "serf"]),
        home: A.pick(
          A.S.prov
            .filter(p => p.owner === realm)
            .map(p => p.id)
            .concat([pc.home]),
        ),
      }),
      fn = A.familyName({
        cult,
        realm,
        status: c.status,
        home: c.home,
        sex,
      });
    c.sur = fn.sur;
    c.surMode = fn.mode;
    c.occ = "soldier";
    c.skills.spear = A.ri(10, 45);
    c.skills.sword = A.ri(5, 40);
    c.skills.shield = A.ri(10, 45);
    c.skills.bow = A.ri(0, 40);
    c.gear = {
      weapon: A.pick(["spear", "axe", "sword", "mace"]),
      armor: A.pick(["padded", "padded", "leather", "mail"]),
      shield: "shield",
      helm: "helm",
      ranged: null,
      mount: null,
    };
    c.quirk = A.pick([
      "sings at night",
      "cannot swim",
      "writes letters home he cannot send",
      "gambles every penny",
      "prays before every fight",
      "tells the same joke every march",
      "carries his mother's ring",
      "is afraid of horses",
      "has a sweetheart in " + A.provName(c.home),
      "never stops eating",
      "can track a hare over stone",
      "snores like a bear",
    ]);
    m.squad.push(c.id);
  }
  m.squad = m.squad.filter(id => A.P(id) && A.P(id).alive);
};

A.squad = pc => (pc.mil ? pc.mil.squad.map(A.P).filter(p => p && p.alive) : []);

A.comradeDies = function (pc, c, how) {
  if (!c || !c.alive) return;
  A.kill(c, how || "war");
  const r = pc.rel[c.id],
    bond = r ? r.op : 10,
    line =
      `${c.given} ${c.sur && c.sur.startsWith("of") ? c.sur : ""} dies: ${how}. ${A.cap(A.he(c))} was ${A.age(c)}${c.quirk ? " and " + c.quirk : ""}.`.replace(
        /\s+/g,
        " ",
      );
  A.log(line, "death");
  pc.happy = A.clamp(pc.happy - (3 + bond / 8), 0, 100);
  A.willGrow(pc, 0.4 + bond / 80, "comrade");
  if (pc.mil) pc.mil.squad = pc.mil.squad.filter(id => id !== c.id);
  return line;
};

A.resign = function () {
  const pc = A.pc();
  return pc.mil
    ? !pc.mil.merc && A.atWar(pc.mil.realm).length && pc.mil.rank < 6
      ? {
          ok: false,
          msg: 'In wartime, leaving is desertion. (Use "Desert" if you mean it.)',
        }
      : (A.log(`You leave ${pc.mil.unit} after ${pc.mil.years} years as ${A.milTitle(pc)}.`),
        (pc.mil.retired = true),
        (pc.veteran = {
          rank: pc.mil.rank,
          years: pc.mil.years,
          battles: pc.mil.battles,
        }),
        (pc.mil = null),
        {
          ok: true,
        })
    : {
        ok: false,
      };
};

A.desert = function () {
  const pc = A.pc();
  return pc.mil
    ? (A.log(`You slip away from ${pc.mil.unit} in the night. You are a deserter now.`, "bad"),
      (pc.mil = null),
      (pc.flags.deserter = true),
      (pc.honor = A.clamp(pc.honor - 20, 0, 100)),
      A.chance(0.3) && (A.log("A patrol catches you on the road.", "bad"), A.punish(pc, "desertion")),
      {
        ok: true,
      })
    : {
        ok: false,
      };
};

A.milYear = function (pc) {
  let f = 1;
  if (pc.mil) {
    const b = pc.mil.battles - (pc.mil.lastB != null ? pc.mil.lastB : pc.mil.battles);
    pc.mil.lastB = pc.mil.battles;
    const d = pc.mil.div ? A.divById(pc.mil.div) : null;
    f = A.clamp(0.55 + b * 0.22 + (d ? A.xpLevel(d.exp)[2] - 1 : 0), 0.45, 1.7) * A.rf(0.8, 1.2);
  }
  A._growMul = f;
  try {
    milYearNow(pc);
  } finally {
    A._growMul = 1;
  }
  if (pc.mil && !pc.mil.merc && pc.alive) {
    A.pcDivAttach(pc);
    pc.mil.stance = pc.mil.stance || "steady";
  }
};

const milYearNow = function (pc) {
  if (A.styleYear) A.styleYear(pc);
  if (pc.school) {
    if (!(A.schoolYear2 && A.schoolYear2(pc))) A.schoolYear(pc);
  }
  const m = pc.mil;
  if (!m) {
    if (pc.company) A.companyYear(pc);
    return;
  }
  m.years++;
  const realm = m.merc ? m.contract || null : m.realm,
    r = A.realm(realm);
  if (m.merc && (!m.contract || !A.realm(m.contract) || !A.atWar(m.contract).length)) {
    const atwar = Object.values(A.S.realms).filter(x => x.alive && A.atWar(x.id).length && x.treasury > 0);
    m.contract = atwar.length ? A.pick(atwar).id : null;
    if (m.contract) A.log(`${m.company} takes a contract with ${A.realmName(m.contract)}.`);
  }
  if (!m.merc && (!r || !r.alive)) {
    A.log("The realm you served is gone. Your company melts away.", "warn");
    pc.mil = null;
    return;
  }
  // [X1 baked patch core/04-world-fixes WLD-MERC-NO-CONTRACT] A mercenary with no contract was still paid 1.3x rank
  // pay every year by nobody (a rank-6 merc earned 9,100 idle). No contract, no pay.
  let pay = m.merc && !r ? 0 : GD.MIL[m.rank].pay * (m.merc ? 1.3 : 1);
  if (m.merc && !r)
    A.log(`No one is hiring sellswords this year. ${m.company || "The company"} lives on its savings.`, "warn");
  if (r && r.treasury < 0 && A.chance(0.5)) {
    pay *= 0.4;
    A.log("Pay is months late. The men grumble.", "warn");
  }
  pc.coin += Math.round(pay);
  const sk = GD.TROOP_SKILL[m.troop] || "spear";
  if (
    (A.trainSkill(pc, sk, 5),
    A.trainSkill(pc, "shield", 2),
    A.train(pc, "sta", 1),
    A.train(pc, "str", 0.6),
    m.rank >= 1 && A.trainSkill(pc, "command", 2 + m.rank * 0.6),
    m.rank >= 3 && A.trainSkill(pc, "tactics", 2 + m.rank * 0.5),
    pc.prison)
  )
    return;
  A.makeSquad(pc);
  const war = realm ? A.atWar(realm) : [];
  if (war.length) {
    const w = A.pick(war);
    m.curWar = w.id;
    const enemy = A.pick(A.warSide(w, realm) === "att" ? w.def : w.att);
    A.wsAttachPC();
    if (m.rank >= 7 && !m.merc) A.log(`${w.name} goes on. Your armies wait for your orders in the War Room.`, "war");
    else
      A.queue({
        type: "mission",
        m: A.newMission(pc, enemy, w),
      });
  } else {
    m.curWar = null;
    if (A.chance(0.55))
      A.queue({
        type: "mission",
        m: A.newMission(pc, null, null),
      });
    if (A.chance(0.35))
      A.queue({
        type: "event",
        ev: A.pick(["camp_brawl", "camp_drill", "camp_dice", "camp_letter", "camp_officer", "camp_fever"]),
      });
  }
  A.promoCheck(pc);
};
