// The release's core, companies and war staff (part 1 of 2): Free companies, seizing land, battle ends, armies and the war staff's raising and mobilising.
// Readable source of vendor/ardan-b593143.html with the patch layer baked in (X1, docs/DECISIONS.md D-027). Edit it here.
// Defines: A.foundCompany, A.companyYear, A.recruitCompany, A.seizeLand, A.BATTLE_END, A.BATTLE_END.seize,
// A.foundRealm, A.plotThrone, A.compShares, A.buildUnits, A.newBattle, A.newBattleForPC, A.tacticsFor, A.aiDeploy,
// A.tacFitsUnit, A.sideStrength, A.battleSetTactic, A.battleCommitReserve, A.battleStep, A.avgMorale, A.aiPulse,
// A.tfx, A.cmdMul, A.missileExchange, A.wingClash, A.flankAttack, A.moraleCheck, A.battlePersonalCombat,
// A.DUEL_END.battleChamp, A.battleFinish, A.battleAuto, A.battleClose, A.ctrl, A.startCampaign, A.campArmy,
// A.frontProv, A.campaign, A.campMoves, A.campOrder, A.campEndTurn, A.pathTo, A.campAutoBattle,
// A.BATTLE_END.campBattle, A.campFinish, A.campClose, A.campAuto, GD.EQ, GD.EQ_KEYS, GD.BN, GD.SUP, GD.XPLV,
// GD.RDOC, A.rdoc, A.xpLevel, GD.TPL_MAX_BN, GD.TPL_MAX_SUP, GD.ECON, GD.BUILD, A.WIDTH, A.ATK_TERR, and 47 more.

A.foundCompany = function (pc) {
  {
    const why = A.roleBlock(pc, "company");
    if (why)
      return {
        ok: false,
        msg: why,
      };
  }
  const cost = 300;
  if (pc.coin < cost)
    return {
      ok: false,
      msg: `Banners, arms and a month's pay for fifty men: about ${cost} suns.`,
    };
  if (pc.fame < 15 && !(pc.mil && pc.mil.rank >= 3) && !pc.veteran)
    return {
      ok: false,
      msg: "Nobody will follow an unknown. (Fame 15+ or a veteran's record.)",
    };
  pc.coin -= cost;
  const nm =
    "the " +
    A.pick(["Free", "Grey", "Red", "Black", "Iron", "Silver", "Wild", "Last", "Broken", "Golden"]) +
    " " +
    A.pick(["Company", "Lances", "Spears", "Banner", "Hand", "Swords", "Wolves", "Crows", "Shields"]);
  if (pc.mil) {
    A.log(`You leave ${pc.mil.unit}.`);
    pc.mil = null;
  }
  pc.company = {
    name: nm,
    men: 50 + Math.round(pc.fame),
    quality: 0.8 + A.skill(pc, "command") / 250,
    chest: 0,
    contract: null,
    officers: [],
    founded: A.S.year,
    battles: 0,
  };
  A.log(`You raise your own banner: ${nm}, ${pc.company.men} hired swords who answer to you.`, "big");
  return {
    ok: true,
  };
};

A.companyYear = function (pc) {
  const c = pc.company;
  if (!c) return;
  const payroll = Math.round(c.men * 25 * 0.6),
    atwar = Object.values(A.S.realms).filter(x => x.alive && A.atWar(x.id).length && x.treasury > 0);
  if (
    ((!c.contract || !A.realm(c.contract) || !A.atWar(c.contract).length) &&
      (c.contract = atwar.length ? A.pick(atwar).id : null),
    c.contract)
  ) {
    const pay = Math.round(c.men * 25 * 12 * 0.12 * (0.8 + pc.fame / 100));
    c.chest += pay;
    A.log(`${c.name} serves ${A.realmName(c.contract)} on contract: ${A.coin(pay)} this year.`);
    const w = A.atWar(c.contract)[0];
    if (w) {
      const en = A.pick(A.warSide(w, c.contract) === "att" ? w.def : w.att);
      A.queue({
        type: "battle",
        b: A.newBattleForPC(pc, w.id, en, true),
      });
    }
  } else {
    A.log(`${c.name} has no contract. The men eat into your chest.`, "warn");
    if (A.chance(0.5))
      A.queue({
        type: "mission",
        m: Object.assign(A.newMission(pc, null, null), {
          size: c.men,
          rank: 4,
        }),
      });
  }
  if (((c.chest -= payroll), c.chest < 0)) {
    if (((pc.coin += c.chest), (c.chest = 0), pc.coin < 0)) {
      const desert = Math.round(c.men * 0.25);
      c.men -= desert;
      pc.coin = 0;
      A.log(`Unpaid, ${desert} men desert.`, "bad");
    }
  } else {
    const take = Math.round(c.chest * 0.3);
    pc.coin += take;
    c.chest -= take;
  }
  if (((c.men = Math.round(c.men * (1 + (pc.fame - 20) / 600) + (c.chest > 500 ? A.ri(5, 25) : 0))), c.men < 15)) {
    A.log(`${c.name} melts away.`, "bad");
    pc.company = null;
    return;
  }
  A.trainSkill(pc, "command", 3);
  A.trainSkill(pc, "tactics", 2);
};

A.recruitCompany = function (n) {
  const pc = A.pc();
  if (!pc.company)
    return {
      ok: false,
    };
  const cost = n * 6;
  return pc.coin < cost
    ? {
        ok: false,
        msg: `Hiring ${n} men costs ${cost} suns up front.`,
      }
    : ((pc.coin -= cost),
      (pc.company.men += n),
      A.log(`You hire ${n} more men into ${pc.company.name}.`),
      {
        ok: true,
      });
};

A.seizeLand = function (pc) {
  const c = pc.company;
  if (!c)
    return {
      ok: false,
      msg: "You need a company.",
    };
  if (c.men < 250)
    return {
      ok: false,
      msg: "You need at least 250 men to hold land.",
    };
  const here = A.prov(pc.home),
    opts = A.S.prov
      .filter(p => p.owner === "unclaimed")
      .sort((a, b) => Math.hypot(a.x - here.x, a.y - here.y) - Math.hypot(b.x - here.x, b.y - here.y));
  if (!opts.length)
    return {
      ok: false,
      msg: "There is no unclaimed land left in Ardan.",
    };
  const target = opts[0],
    locals = Math.max(150, Math.round(target.pop * 0.004));
  A.queue({
    type: "battle",
    b: A.newBattle({
      title: `The taking of ${target.name}`,
      terr: target.terr,
      sideA: {
        realm: pc.realm,
        name: c.name,
        men: c.men,
        q: c.quality,
        comp: "merc",
        commander: pc.id,
      },
      sideB: {
        realm: "unclaimed",
        name: `the free folk of ${target.name}`,
        men: locals,
        q: 0.7,
        comp: "unclaimed",
      },
      onEnd: {
        fn: "seize",
        arg: target.id,
      },
      pcSide: "A",
    }),
  });
  return {
    ok: true,
    msg: `You march on ${target.name}. Its people will not give it up for nothing.`,
  };
};

A.BATTLE_END = A.BATTLE_END || {};

A.BATTLE_END.seize = function (B, pid) {
  const pc = A.pc(),
    target = A.prov(pid);
  if (B.winner !== "A") {
    A.log(`You fail to take ${target.name}.`, "bad");
    if (pc.company) pc.company.men = Math.round(pc.company.men * 0.6);
    return;
  }
  A.foundRealm(pc, [target.id], pc.company ? pc.company.men : 300);
};

A.foundRealm = function (pc, provIds, men) {
  const p0 = A.prov(provIds[0]),
    big = men >= 1500;
  let houseName =
    pc.surMode === "house" && pc.house
      ? A.house(pc.house).name
      : "House " +
        (pc.sur && !/^(of |son of|daughter of)/.test(pc.sur) && pc.sur
          ? pc.sur
          : pc.epithet
            ? pc.epithet.replace(/^the /, "")
            : p0.name);
  const hid = "FAM-P" + A.ri(100, 999);
  A.S.houses[hid] = {
    id: hid,
    name: houseName,
    realm: null,
    kind: "royal",
    seat: p0.name,
    rung: "S02",
    title: big ? "King" : "Lord",
    notes: `Founded by ${A.fullName(pc)} in ${A.S.year} AR.`,
    headPid: pc.id,
    op: 80,
    founded: A.S.year,
  };
  const r = A.createRealm({
    name: (big ? "Kingdom of " : "Lordship of ") + p0.name,
    short: p0.name,
    title: big ? "King" : "Lord",
    race: pc.race,
    cult: pc.cult,
    faith: pc.faith,
    army: Math.round(men * 0.8),
    levy: Math.round(p0.pop * 0.01),
    armyQ: pc.company ? pc.company.quality : 0.85,
    income: Math.round(p0.pop * 0.12 + 500),
    stability: 45,
    legit: 25,
    treasury: pc.company ? pc.company.chest : 200,
    house: hid,
    comp: null,
    capital: p0.name,
    capitalProv: p0.id,
  });
  // [X1 baked patch core/09-engine-at-scale SCALE-HOUSE-WRITES] A.realmHouses filtered every house in the world on
  // every call. 09-engine-at-scale answers it from an index of houses by realm, dropped when a house is created
  // during play: the player's own house (founding a realm, or rising into the gentry). Nothing in the release
  // changes a house's realm, kind or extinction during play (70-fresh-realms-and-tensions does, inside A.initWorld);
  // test.mjs (scaleSites) checks the creation sites, and each month 09-engine-at-scale compares the index with the
  // houses.
  A.S.houses[hid].realm = r.id;
  if (A.scaleHouse) A.scaleHouse();
  // [X1 baked patch core/09-engine-at-scale SCALE-LAND-WRITES] A.realmProvs and A.neighbors scanned every province
  // on every call (A.politicsYear asks them for every pair of realms, so a year cost realms² × provinces).
  // 09-engine-at-scale answers them from an index of provinces by owner, which must be dropped the moment a province
  // changes hands. These are all the places that write a province's owner directly: transferProv, the claimant
  // settlements in settleWar, a claimant taking land in a succession war, a player founding a realm, a faction
  // breaking away, and Tessaria's split at the start. Each now bumps the land version.
  for (const id of provIds) {
    A.prov(id).owner = r.id;
    if (A.scaleLand) A.scaleLand();
  }
  A.updateRealmPops();
  pc.house = hid;
  pc.sur = houseName.replace(/^House /, "");
  pc.surMode = "house";
  pc.status = "royal";
  A.makeRuler(pc, r.id);
  pc.home = p0.id;
  pc.realm = r.id;
  r.playerRun = true;
  pc.company = null;
  if (pc.mil) pc.mil = null;
  A.fame(pc, 20);
  A.ach("founder");
  A.ach("ruler");
  A.log(
    `You plant your banner in ${p0.name} and name yourself ${r.title} of a new realm: ${r.name}. You found ${houseName}.`,
    "big",
  );
  A.news(`${A.fullName(pc)} carves a new realm out of the free lands: ${r.name}.`, "crown");
  pc.deeds.push({
    y: A.S.year,
    t: `Founded ${r.name}`,
  });
  return r;
};

A.plotThrone = function (pc) {
  const r = A.realm(pc.realm);
  if (!r || !r.alive)
    return {
      ok: false,
      msg: "There is no throne here.",
    };
  const ru = A.P(r.ruler),
    power =
      (pc.noble ? pc.noble.rung * 8 : 0) +
      (pc.mil ? pc.mil.rank * 7 : 0) +
      (pc.house === r.house ? 25 : 0) +
      A.skill(pc, "intrigue") * 0.5 +
      pc.fame * 0.4 +
      (pc.company ? pc.company.men / 100 : 0);
  if (power < 45)
    return {
      ok: false,
      msg: "You have no party at court and no swords. Nobody joins a plot that cannot win. (Need rank, title, blood, swords or fame.)",
    };
  const odds = A.clamp((power - 30) / 100 + (100 - r.legit) / 300 + (100 - r.stability) / 400, 0.05, 0.75);
  A.queue({
    type: "event",
    ev: "plot_throne",
    ctx: {
      odds: Math.round(odds * 100),
      rid: r.id,
    },
  });
  return {
    ok: true,
    msg: `You begin to sound out lords who hate ${ru ? A.rulerStyle(ru, r) : "the crown"}.`,
  };
};

A.BATTLE_END = A.BATTLE_END || {};

A.compShares = function (realm, kind) {
  if (kind === "merc")
    return [
      ["SP", 0.35],
      ["XB", 0.25],
      ["HI", 0.15],
      ["LC", 0.15],
      ["MC", 0.1],
    ];
  if (kind === "unclaimed" || realm === "unclaimed")
    return [
      ["LV", 0.55],
      ["SP", 0.2],
      ["AR", 0.15],
      ["LC", 0.1],
    ];
  const r = A.realm(realm),
    d = GD.DOCTRINE[realm] || GD.DOCTRINE[r && r.parent] || GD.DOCTRINE.rebel,
    c = r && r.comp ? r.comp : r && r.parent && A.realm(r.parent) ? A.realm(r.parent).comp : null;
  if (!c)
    return [
      [d[4] || "SP", 0.45],
      [d[5] || "AR", 0.25],
      [d[3] || "HI", 0.1],
      [d[1] || "LC", 0.1],
      [d[0] || "MC", 0.1],
    ].filter(x => x[0]);
  const cats = [c.heavyHorse, c.lightHorse, c.elephants, c.heavyFoot, c.spear, c.missile, c.other],
    tot = cats.reduce((a, b) => a + b, 0) || 1,
    out = [];
  cats.forEach((v, i) => {
    if (v > 0 && d[i]) out.push([d[i], v / tot]);
  });
  return out.length ? out : [["SP", 1]];
};

A.buildUnits = function (side, men, realm, kind, q) {
  const shares = A.compShares(realm, kind),
    units = [];
  let id = 0;
  for (const [code, sh] of shares) {
    let n = Math.round(men * sh);
    if (
      (code === "EL" && (n = Math.max(0, Math.round(n / 15))),
      code === "GI" && (n = Math.max(1, Math.round(n / 60))),
      n <= 0)
    )
      continue;
    const T = GD.TROOPS[code];
    units.push({
      id: side + id++,
      code,
      name: T.name,
      men: n,
      men0: n,
      q: q * A.rf(0.9, 1.1),
      morale: T.morale + 30,
      fat: 0,
      wing: "C",
      tac: "hold",
      status: "ok",
      once: {},
      killed: 0,
    });
  }
  const cav = units.filter(u => GD.TROOPS[u.code].mount && !GD.TROOPS[u.code].beast);
  if (
    (cav.forEach((u, i) => {
      u.wing = i % 2 === 0 ? "L" : "R";
    }),
    cav.length === 1)
  ) {
    const u = cav[0],
      half = Math.round(u.men / 2);
    if (half > 0) {
      const u2 = Object.assign({}, u, {
        id: u.id + "b",
        men: half,
        men0: half,
        once: {},
      });
      u.men -= half;
      u.men0 = u.men;
      u2.wing = "R";
      u.wing = "L";
      units.push(u2);
    }
  }
  const foot = units.filter(u => !GD.TROOPS[u.code].mount);
  if (!cav.length && foot.length) {
    const big = foot.sort((a, b) => b.men - a.men)[0],
      third = Math.round(big.men / 3);
    if (third > 0)
      for (const w of ["L", "R"]) {
        const u2 = Object.assign({}, big, {
          id: big.id + w,
          men: third,
          men0: third,
          wing: w,
          once: {},
        });
        units.push(u2);
        big.men -= third;
        big.men0 = big.men;
      }
  }
  const res = units
    .filter(u => !GD.TROOPS[u.code].mount && u.wing === "C")
    .sort((a, b) => GD.TROOPS[b.code].melee - GD.TROOPS[a.code].melee)[0];
  if (res && res.men > 40) {
    const n = Math.round(res.men * 0.3),
      u2 = Object.assign({}, res, {
        id: res.id + "r",
        men: n,
        men0: n,
        wing: "X",
        once: {},
      });
    res.men -= n;
    res.men0 = res.men;
    units.push(u2);
  }
  return units.filter(u => u.men > 0);
};

A.newBattle = function (o) {
  A.registerManeuvers();
  const B = {
    id: "B" + A.ri(1e3, 99999),
    title: o.title || "Battle",
    terr: o.terr || "plains",
    weather: o.weather || A.pick(["clear", "clear", "overcast", "rain", "wind", "fog"]),
    light: "day",
    phase: "deploy",
    pulse: 0,
    maxPulses: 7,
    log: [],
    winner: null,
    onEnd: o.onEnd || null,
    war: o.war || null,
    pcSide: o.pcSide || "A",
    pcLead: false,
    deployDone: false,
    flank: {
      A: null,
      B: null,
    },
    sides: {},
  };
  for (const k of ["A", "B"]) {
    const s = k === "A" ? o.sideA : o.sideB,
      cmd = s.commander ? A.P(s.commander) : null;
    B.sides[k] = {
      realm: s.realm,
      name: s.name || A.realmShort(s.realm),
      men0: s.men,
      units: A.buildUnits(k, s.men, s.realm, s.comp, s.q || 0.9),
      commander: s.commander || null,
      cmdSkill: cmd ? (A.skill(cmd, "command") + A.skill(cmd, "tactics")) / 2 : s.cmdSkill || A.ri(25, 65),
      color: A.realm(s.realm) ? A.realm(s.realm).color : "#999",
      rallied: 0,
      exhausted: 0,
    };
  }
  B.log.push(
    `${B.title}. ${A.cap(B.terr)}, ${B.weather}. ${A.fmt(B.sides.A.men0)} ${B.sides.A.name} against ${A.fmt(B.sides.B.men0)} ${B.sides.B.name}.`,
  );
  A.aiDeploy(B, "B");
  return B;
};

A.newBattleForPC = function (pc, warId, enemy, company) {
  const w = A.S.wars.find(x => x.id === warId);
  let mine, theirs, myRealm;
  if (company && pc.company) {
    mine = pc.company.men + A.ri(500, 3e3);
    myRealm = pc.company.contract || pc.realm;
  } else if (pc.ruler) {
    const r = A.realm(pc.ruler);
    mine = Math.round(Math.min(r.army * 0.45 + r.levy * 0.1, 6e4));
    myRealm = pc.ruler;
  } else {
    const lead = GD.MIL[Math.min(pc.mil.rank, 9)].leads;
    mine = Math.round(lead * A.rf(1, pc.mil.rank >= 6 ? 1.2 : 1.6));
    myRealm = pc.mil.merc ? pc.mil.contract || pc.realm : pc.mil.realm;
  }
  const er = A.realm(enemy);
  theirs = Math.round(mine * A.rf(0.65, 1.45));
  if (er && theirs > er.army + er.levy * 0.3) theirs = Math.max(200, Math.round(er.army + er.levy * 0.3));
  mine = Math.max(150, mine);
  theirs = Math.max(120, theirs);
  const place =
      (A._battlePlace != null && A.S.prov[A._battlePlace]) ||
      A.S.prov.find(
        p => (p.occ || p.owner) === enemy && p.adj.some(j => (A.S.prov[j].occ || A.S.prov[j].owner) === myRealm),
      ) ||
      A.pick(A.S.prov.filter(p => p.owner === enemy).concat([A.prov(pc.home)])),
    rr = A.realm(myRealm);
  return A.newBattle({
    title: "Battle of " + place.name,
    terr: place.terr,
    war: warId,
    sideA: {
      realm: myRealm,
      name: company && pc.company ? pc.company.name + " and allies" : A.realmShort(myRealm),
      men: mine,
      q: rr ? rr.armyQ : 0.9,
      comp: company ? "merc" : null,
      commander: pc.id,
    },
    sideB: {
      realm: enemy,
      name: A.realmShort(enemy),
      men: theirs,
      q: er ? er.armyQ : 0.9,
    },
  });
};

A.tacticsFor = function (B, side, wing) {
  A.registerManeuvers();
  const units = B.sides[side].units.filter(u => u.wing === wing && u.status !== "gone"),
    codes = new Set(units.map(u => u.code)),
    realm = B.sides[side].realm,
    out = [];
  for (const k in GD.BATTLE_TACTICS) {
    const T = GD.BATTLE_TACTICS[k];
    if (
      !(T.deploy && B.phase !== "deploy") &&
      !(T.realms && !T.realms.includes(realm) && !(A.realm(realm) && T.realms.includes(A.realm(realm).parent)))
    ) {
      if (T.style) {
        const cmdP = B.sides[side].commander ? A.P(B.sides[side].commander) : null;
        if (!A.knowsManeuver || !A.knowsManeuver(cmdP, T.style)) continue;
      }
      if (
        !(
          (T.needs && !T.needs.split("|").includes(B.terr)) ||
          (T.troops !== "*" && !T.troops.some(c => codes.has(c))) ||
          (T.once && units.some(u => u.once[k]))
        )
      )
        out.push(k);
    }
  }
  return out;
};

A.aiDeploy = function (B, side) {
  const s = B.sides[side],
    other = B.sides[side === "A" ? "B" : "A"],
    stronger = A.sideStrength(s) > A.sideStrength(other) * 1.1;
  for (const wing of ["L", "C", "R"]) {
    const opts = A.tacticsFor(B, side, wing),
      pick =
        (stronger
          ? [
              "lance",
              "fury",
              "laughing",
              "bullhorns",
              "relay",
              "elephants",
              "noon",
              "camels",
              "flank",
              "advance",
              "xbvolley",
              "longbow",
              "horsearch",
              "massvolley",
            ]
          : [
              "stakes",
              "ditch",
              "pikehedge",
              "hilltop",
              "shieldwall",
              "wagonfort",
              "spearwall",
              "xbvolley",
              "longbow",
              "massvolley",
              "horsearch",
              "feigned",
              "hold",
            ]
        ).find(p => opts.includes(p) && A.chance(0.75)) || A.pick(opts.length ? opts : ["hold"]);
    for (const u of s.units)
      if (u.wing === wing)
        u.tac = A.tacFitsUnit(pick, u) ? pick : A.tacFitsUnit("advance", u) && stronger ? "advance" : "hold";
  }
};

A.tacFitsUnit = (k, u) => {
  A.registerManeuvers();
  const T = GD.BATTLE_TACTICS[k];
  return T && (T.troops === "*" || T.troops.includes(u.code));
};

A.sideStrength = s =>
  s.units
    .filter(u => u.status !== "gone" && u.status !== "rout")
    .reduce((a, u) => {
      const T = GD.TROOPS[u.code];
      return a + u.men * (T.melee + T.def * 0.5 + T.missile * 0.7 + T.charge * 0.3) * u.q;
    }, 0);

A.battleSetTactic = function (wing, tac) {
  const q = A.S.queue[0];
  if (!q || q.type !== "battle") return;
  const B = q.b,
    side = B.pcSide;
  if (A.tacticsFor(B, side, wing).includes(tac))
    for (const u of B.sides[side].units)
      if (u.wing === wing && u.status !== "gone")
        u.tac = A.tacFitsUnit(tac, u) ? tac : A.tacFitsUnit("hold", u) ? "hold" : u.tac;
};

A.battleCommitReserve = function (wing) {
  const q = A.S.queue[0];
  if (!q || q.type !== "battle") return;
  const B = q.b,
    res = B.sides[B.pcSide].units.filter(u => u.wing === "X" && u.status !== "gone");
  if (res.length) {
    for (const u of res) {
      u.wing = wing;
      u.tac = "advance";
    }
    B.log.push(
      `You send the reserve to the ${
        {
          L: "left",
          C: "center",
          R: "right",
        }[wing]
      }.`,
    );
  }
};

A.battleStep = function () {
  const q = A.S.queue[0];
  if (!q || q.type !== "battle") return null;
  const B = q.b;
  if (B.phase === "end") return B;
  if (B.phase === "deploy") {
    B.phase = "press";
    B.log.push(A.pick(["Horns. Drums. The lines move.", "The banners go forward.", "The waiting is over."]));
  }
  B.pulse++;
  const sA = B.sides.A,
    sB = B.sides.B,
    aiSide = B.pcSide === "A" ? "B" : "A";
  if (B.pulse > 1) A.aiPulse(B, aiSide);
  A.missileExchange(B, "A", "B");
  A.missileExchange(B, "B", "A");
  const pairs = [
    ["L", "R"],
    ["C", "C"],
    ["R", "L"],
  ];
  for (const [wa, wb] of pairs) A.wingClash(B, wa, wb);
  for (const k of ["A", "B"]) if (B.flank[k]) A.flankAttack(B, k);
  for (const k of ["A", "B"]) A.moraleCheck(B, k);
  if (B.pcLead && A.chance(0.32) && !B.pcFought) {
    B.pcFought = true;
    A.battlePersonalCombat(B);
  }
  for (const k of ["A", "B"])
    for (const u of B.sides[k].units)
      if (u.status === "ok" || u.status === "shaken") {
        const T = GD.TROOPS[u.code];
        u.fat = A.clamp(u.fat + (T.relay ? 6 : 11) - (u.tac === "hold" ? 5 : 0), 0, 100);
      }
  const live = k =>
      B.sides[k].units.filter(u => u.status === "ok" || u.status === "shaken").reduce((a, u) => a + u.men, 0),
    la = live("A"),
    lb = live("B");
  if (la < sA.men0 * 0.22 || lb < sB.men0 * 0.22 || B.pulse >= B.maxPulses) {
    let win = null;
    if (la < sA.men0 * 0.22 && lb >= sB.men0 * 0.22) win = "B";
    else if (lb < sB.men0 * 0.22 && la >= sA.men0 * 0.22) win = "A";
    else {
      const ma = A.avgMorale(B, "A") * la,
        mb = A.avgMorale(B, "B") * lb;
      win = ma > mb * 1.15 ? "A" : mb > ma * 1.15 ? "B" : "draw";
    }
    A.battleFinish(B, win);
  }
  return B;
};

A.avgMorale = (B, k) => {
  const us = B.sides[k].units.filter(u => u.status === "ok" || u.status === "shaken"),
    m = us.reduce((a, u) => a + u.men, 0);
  return m ? us.reduce((a, u) => a + u.morale * u.men, 0) / m : 0;
};

A.aiPulse = function (B, side) {
  const s = B.sides[side],
    other = B.sides[side === "A" ? "B" : "A"];
  for (const wing of ["L", "C", "R"]) {
    const us = s.units.filter(u => u.wing === wing && (u.status === "ok" || u.status === "shaken"));
    if (!us.length) continue;
    const avgM = us.reduce((a, u) => a + u.morale, 0) / us.length,
      opts = A.tacticsFor(B, side, wing);
    let pick = null;
    if (
      (avgM < 30 && opts.includes("rally") && A.chance(0.6)
        ? (pick = "rally")
        : avgM < 20 && opts.includes("withdraw") && A.chance(0.3)
          ? (pick = "withdraw")
          : B.pulse >= 2 && us.some(u => GD.TROOPS[u.code].mount) && opts.includes("flank") && A.chance(0.4)
            ? (pick = "flank")
            : B.pulse >= 3 &&
              opts.includes("advance") &&
              A.sideStrength(s) > A.sideStrength(other) &&
              A.chance(0.5) &&
              (pick = "advance"),
      pick)
    )
      for (const u of us) if (A.tacFitsUnit(pick, u)) u.tac = pick;
  }
  const res = s.units.filter(u => u.wing === "X" && u.status === "ok");
  if (res.length && B.pulse >= 2) {
    const weak = ["L", "C", "R"]
      .map(w => [
        w,
        s.units
          .filter(u => u.wing === w && u.status !== "gone" && u.status !== "rout")
          .reduce((a, u) => a + u.men * u.morale, 0),
      ])
      .sort((a, b) => a[1] - b[1])[0];
    if (weak && A.chance(0.45)) {
      for (const u of res) {
        u.wing = weak[0];
        u.tac = "advance";
      }
      B.log.push(
        `${s.name} throw their reserve into the ${
          {
            L: "left",
            C: "center",
            R: "right",
          }[weak[0]]
        }.`,
      );
    }
  }
};

A.tfx = (u, key, def = 1) => {
  if (!A.maneuversIn && u.tac && u.tac.startsWith("mv_")) A.registerManeuvers();
  const T = GD.BATTLE_TACTICS[u.tac];
  return T && T.fx && T.fx[key] != null ? T.fx[key] : def;
};

A.cmdMul = s => 0.85 + s.cmdSkill / 330;

A.missileExchange = function (B, a, b) {
  const sa = B.sides[a],
    sb = B.sides[b];
  let pow = 0;
  for (const u of sa.units) {
    if ((u.status !== "ok" && u.status !== "shaken") || u.wing === "X") continue;
    const T = GD.TROOPS[u.code];
    if (!T.missile) continue;
    let p = u.men * T.missile * u.q * A.tfx(u, "missile") * (u.status === "shaken" ? 0.6 : 1);
    if (B.weather === "rain" && (u.code === "XB" || u.code === "LB" || u.code === "AR")) p *= 0.6;
    if (B.weather === "fog") p *= 0.5;
    if (B.weather === "wind") p *= 0.8;
    if (u.code === "XB" || u.tac === "xbvolley") p *= A.tfx(u, "pierce");
    pow += p;
  }
  if (pow <= 0) return;
  pow *= A.cmdMul(sa);
  const targets = sb.units.filter(u => u.men > 0 && (u.status === "ok" || u.status === "shaken") && u.wing !== "X"),
    tot = targets.reduce((x, u) => x + u.men, 0);
  if (!tot) return;
  let killedTot = 0;
  for (const u of targets) {
    const T = GD.TROOPS[u.code],
      share = u.men / tot;
    let dmg = (pow * share * 0.0045) / (1 + T.def * 0.12 * A.tfx(u, "missileDef") * A.tfx(u, "def"));
    dmg *= A.tfx(u, "evade");
    const scr = sb.units.some(x => x.tac === "skirmish" && x.status === "ok") ? 0.75 : 1;
    dmg *= scr;
    if (T.beast) dmg *= 0.25;
    const k = Math.min(u.men, Math.round(dmg * A.rf(0.7, 1.3)));
    u.men -= k;
    u.killed += k;
    killedTot += k;
    u.morale -= (k / Math.max(1, u.men0)) * 70 + (T.panic ? 4 : 0);
  }
  if (killedTot > 0 && B.pulse <= 2)
    B.log.push(
      `${sa.name}'s ${A.pick(["arrows", "bolts", "volleys", "missiles"])} drop ${A.fmt(killedTot)} of ${sb.name}.`,
    );
};

A.wingClash = function (B, wa, wb) {
  const ua = B.sides.A.units.filter(u => u.wing === wa && u.men > 0 && (u.status === "ok" || u.status === "shaken")),
    ub = B.sides.B.units.filter(u => u.wing === wb && u.men > 0 && (u.status === "ok" || u.status === "shaken"));
  if (!ua.length || !ub.length) {
    if (ua.length && !ub.length && !B.flank.A && ua.some(u => GD.TROOPS[u.code].mount || u.tac === "flank")) {
      B.flank.A = wa;
      B.log.push(
        `${B.sides.A.name}'s ${
          {
            L: "left",
            R: "right",
            C: "center",
          }[wa]
        } has nothing in front of it — it wheels onto the enemy's flank!`,
      );
    }
    if (ub.length && !ua.length && !B.flank.B && ub.some(u => GD.TROOPS[u.code].mount || u.tac === "flank")) {
      B.flank.B = wb;
      B.log.push(
        `${B.sides.B.name}'s ${
          {
            L: "left",
            R: "right",
            C: "center",
          }[wb]
        } has broken through — it turns on your flank!`,
      );
    }
    return;
  }
  const holdA = ua.every(u => A.tfx(u, "noAdvance", false)),
    holdB = ub.every(u => A.tfx(u, "noAdvance", false));
  if (holdA && holdB && B.pulse < 4) {
    if (B.pulse === 2 && wa === "C")
      B.log.push("Both centers stand fast. Neither line will be the first to cross the ground between.");
    return;
  }
  for (const [mine, theirs, side] of [
    [ua, ub, "A"],
    [ub, ua, "B"],
  ]) {
    const f = mine.find(u => u.tac === "feigned" && !u.once.feigned);
    if (f) {
      f.once.feigned = true;
      const disc = B.sides[side === "A" ? "B" : "A"].cmdSkill;
      if (A.chance(0.7 - disc / 250)) {
        for (const t of theirs) {
          t.morale -= 18;
          const k = Math.round(t.men * A.rf(0.08, 0.16));
          t.men -= k;
          t.killed += k;
        }
        B.log.push(
          `A feigned retreat! ${B.sides[side].name}'s riders flee, the enemy breaks ranks to chase — and they turn on them.`,
        );
      } else B.log.push(`${B.sides[side].name} try a feigned retreat, but the enemy holds its ranks.`);
    }
  }
  const power = (us, them, side) => {
      const s = B.sides[side];
      let p = 0;
      const themAntiCav =
          them.reduce(
            (a, u) => a + u.men * GD.TROOPS[u.code].antiCav * A.tfx(u, "antiCav") * (u.status === "shaken" ? 0.6 : 1),
            0,
          ) /
          Math.max(
            1,
            them.reduce((a, u) => a + u.men, 0),
          ),
        cavStop = Math.min(...them.map(u => A.tfx(u, "cavStop")), 1),
        themMorale = them.reduce((a, u) => a + u.morale, 0) / them.length;
      for (const u of us) {
        const T = GD.TROOPS[u.code];
        let v = u.men * T.melee * u.q * A.tfx(u, "att") * (1 - u.fat / 250) * (u.status === "shaken" ? 0.65 : 1);
        if (T.charge > 1 && (B.pulse <= 2 || A.tfx(u, "charge", 0) > 0) && !A.tfx(u, "noAdvance", false)) {
          let ch = u.men * T.charge * u.q * A.tfx(u, "charge");
          if (u.tac === "lance" && themMorale < 50) ch *= A.tfx(u, "wavering");
          if (T.mount) {
            ch *= cavStop;
            ch /= 1 + themAntiCav * 0.35;
          }
          if (T.relay) ch *= B.pulse <= 4 ? 1.1 : 0.5;
          v += ch;
        }
        if (
          u.tac === "fury" ||
          u.tac === "laughing" ||
          u.tac === "noon" ||
          u.tac === "elephants" ||
          u.tac === "camels" ||
          u.tac === "drums"
        )
          u.once[u.tac] = true;
        p += v;
      }
      return p * A.cmdMul(s) * (side === B.pcSide && B.pcLead ? 1.08 : 1) * A.rf(0.8, 1.2);
    },
    defMul = them => {
      const m = them.reduce((a, u) => a + u.men, 0);
      return m <= 0
        ? 1
        : Math.max(1, them.reduce((a, u) => a + u.men * (1 + GD.TROOPS[u.code].def * 0.1 * A.tfx(u, "def")), 0) / m);
    };
  let pa = power(ua, ub, "A"),
    pb = power(ub, ua, "B");
  const terrHorse =
      {
        forest: 0.55,
        marsh: 0.5,
        mountains: 0.5,
        hills: 0.85,
      }[B.terr] || 1,
    horseShare = us =>
      us.reduce((a, u) => a + (GD.TROOPS[u.code].mount ? u.men : 0), 0) /
      Math.max(
        1,
        us.reduce((a, u) => a + u.men, 0),
      );
  pa *= 1 - horseShare(ua) * (1 - terrHorse);
  pb *= 1 - horseShare(ub) * (1 - terrHorse);
  for (const [us, them] of [
    [ua, ub],
    [ub, ua],
  ]) {
    const fear = us.reduce((a, u) => a + (A.tfx(u, "fear", 0) + (GD.TROOPS[u.code].horseFear ? 8 : 0)), 0);
    if (fear) for (const t of them) if (GD.TROOPS[t.code].mount || fear > 15) t.morale -= fear * 0.4;
  }
  const casB = (pa * 0.0042) / defMul(ub),
    casA = (pb * 0.0042) / defMul(ua),
    dist = (us, cas) => {
      const tot = us.reduce((a, u) => a + u.men, 0) || 1;
      let kt = 0;
      for (const u of us) {
        const T = GD.TROOPS[u.code];
        let k = Math.round(cas * (u.men / tot) * A.rf(0.75, 1.25) * (T.beast ? 0.15 : 1));
        k = Math.min(u.men, k);
        u.men -= k;
        u.killed += k;
        kt += k;
        if (!A.tfx(u, "moraleImmune", false)) u.morale -= (k / Math.max(1, u.men0)) * 95;
        if (T.panic && A.chance(0.25)) u.morale -= 25;
      }
      return kt;
    },
    ka = dist(ua, casA),
    kb = dist(ub, casB),
    wingWord = {
      L: "left",
      C: "center",
      R: "right",
    };
  if (kb > ka * 1.4) {
    for (const u of ua) u.morale += 3;
    if (A.chance(0.5))
      B.log.push(
        `On the ${wingWord[wa]}, ${B.sides.A.name} drive into ${B.sides.B.name}: ${A.fmt(kb)} fall to ${A.fmt(ka)}.`,
      );
  } else if (ka > kb * 1.4) {
    for (const u of ub) u.morale += 3;
    if (A.chance(0.5))
      B.log.push(
        `On the ${wingWord[wa]}, ${B.sides.B.name} push ${B.sides.A.name} back: ${A.fmt(ka)} fall to ${A.fmt(kb)}.`,
      );
  } else if (A.chance(0.25)) B.log.push(`The ${wingWord[wa]} grinds: shove, stab, part, shove again.`);
  for (const u of ua.concat(ub)) {
    if (u.tac === "rally") {
      u.morale += GD.BATTLE_TACTICS.rally.fx.rally * (0.6 + B.sides[u.id[0]].cmdSkill / 150);
      u.status = u.morale > 30 ? "ok" : u.status;
    }
    if (u.tac === "withdraw") {
      u.morale += 5;
      u.withdrawing = true;
    }
  }
};

A.flankAttack = function (B, k) {
  const o = k === "A" ? "B" : "A",
    center = B.sides[o].units.filter(u => u.wing === "C" && u.men > 0 && (u.status === "ok" || u.status === "shaken")),
    flankers = B.sides[k].units.filter(
      u => u.wing === B.flank[k] && u.men > 0 && (u.status === "ok" || u.status === "shaken"),
    );
  if (!center.length || !flankers.length) return;
  const p =
      flankers.reduce((a, u) => a + u.men * (GD.TROOPS[u.code].melee + GD.TROOPS[u.code].charge * 0.5) * u.q, 0) *
      0.005,
    tot = Math.max(
      1,
      center.reduce((a, u) => a + u.men, 0),
    );
  for (const u of center) {
    const kk = Math.min(
      u.men,
      Math.round(((p * u.men) / tot) * A.tfx(u, "flank", 1) * (GD.TROOPS[u.code].flankWeak || 1)),
    );
    u.men -= kk;
    u.killed += kk;
    u.morale -= 14 + (kk / Math.max(1, u.men0)) * 80;
  }
  B.log.push(`${B.sides[k].name} hit ${B.sides[o].name}'s center in the flank!`);
};

A.moraleCheck = function (B, k) {
  const s = B.sides[k],
    pursuit = B.sides[k === "A" ? "B" : "A"].units
      .filter(u => u.status === "ok" && (GD.TROOPS[u.code].pursuit || GD.TROOPS[u.code].mount))
      .reduce((a, u) => a + u.men * (GD.TROOPS[u.code].pursuit || 1) * A.tfx(u, "pursuit"), 0);
  let routedNow = [];
  for (const u of s.units)
    if (u.status !== "gone") {
      if (u.men <= Math.max(2, u.men0 * 0.05)) {
        u.status = "gone";
        continue;
      }
      if (u.status === "rout") {
        const k2 = Math.min(u.men, Math.round(pursuit * 0.012 * A.rf(0.5, 1.5) + u.men * 0.05));
        u.men -= k2;
        u.killed += k2;
        if (u.men <= u.men0 * 0.08) u.status = "gone";
        continue;
      }
      u.morale = A.clamp(u.morale, -20, 110);
      if (u.morale < 15 || (u.withdrawing && u.morale < 30)) {
        u.status = u.withdrawing ? "gone" : "rout";
        if (u.withdrawing) B.log.push(`${s.name}'s ${u.name.toLowerCase()} withdraw from the field in order.`);
        else routedNow.push(u);
      } else {
        if (u.morale < 32) u.status = "shaken";
        else u.status = "ok";
      }
    }
  if (routedNow.length) {
    B.log.push(`${s.name}'s ${routedNow.map(u => u.name.toLowerCase()).join(" and ")} break and run!`);
    for (const u of s.units)
      if (u.status === "ok" || u.status === "shaken") {
        if (routedNow.some(r => r.wing === u.wing)) u.morale -= 10;
        else u.morale -= 4;
      }
  }
};

A.battlePersonalCombat = function (B) {
  const pc = A.pc(),
    enemy = B.sides[B.pcSide === "A" ? "B" : "A"],
    foe = A.makeFoe({
      realm: enemy.realm,
      troop: (
        A.pick(enemy.units) || {
          code: "SP",
        }
      ).code,
      tier: 4,
      title: "a champion of " + enemy.name,
    });
  B.log.push(`In the press, ${foe.given}, a champion of ${enemy.name}, sees your banner and comes for you!`);
  A.startDuelFront(pc, foe, {
    kind: "war",
    place: B.title,
    lethal: true,
    toYield: true,
    title: `${B.title} — champion`,
    onEnd: {
      fn: "battleChamp",
      arg: B.id,
    },
  });
};

A.DUEL_END.battleChamp = function (D, bid) {
  const q = A.S.queue[0];
  if (!q || q.type !== "battle" || q.b.id !== bid) return;
  const B = q.b,
    mine = B.sides[B.pcSide].units;
  if (D.result === "win") {
    for (const u of mine) u.morale += 12;
    B.log.push("You cut down their champion. A roar goes up from your lines!");
    A.fame(A.pc(), 3);
  } else if (D.result === "lose" || D.result === "yield") {
    for (const u of mine) u.morale -= 12;
    B.log.push("Your men see you fall back bloodied. A groan runs down the line.");
  }
};

A.battleFinish = function (B, win) {
  if (B.phase === "end") return;
  if (((B.phase = "end"), (B.winner = win), win === "A" || win === "B")) {
    const lose = win === "A" ? "B" : "A",
      pur = B.sides[win].units
        .filter(u => u.status === "ok" && GD.TROOPS[u.code].mount)
        .reduce((a, u) => a + u.men * (GD.TROOPS[u.code].pursuit || 1) * A.tfx(u, "pursuit"), 0);
    for (const u of B.sides[lose].units) {
      if (u.status === "gone") continue;
      const k = Math.min(u.men, Math.round(u.men * A.rf(0.08, 0.2) + pur * 0.02));
      u.men -= k;
      u.killed += k;
    }
  }
  const dead = k => B.sides[k].units.reduce((a, u) => a + u.killed, 0);
  B.dead = {
    A: dead("A"),
    B: dead("B"),
  };
  const name = s => B.sides[s].name;
  B.log.push(
    win === "draw"
      ? `Night falls on a drawn field. ${A.fmt(B.dead.A)} dead for ${name("A")}, ${A.fmt(B.dead.B)} for ${name("B")}.`
      : `${name(win)} hold the field. ${name(win === "A" ? "B" : "A")} are beaten. Dead: ${A.fmt(B.dead.A)} of ${name("A")}, ${A.fmt(B.dead.B)} of ${name("B")}.`,
  );
};

A.battleAuto = function (B) {
  if (B.phase === "deploy") A.aiDeploy(B, B.pcSide);
  let g = 0;
  const q = A.S.queue[0];
  for (; B.phase !== "end" && g++ < 20; ) {
    if (A.S.queue[0] !== q) {
      const d = A.S.queue[0];
      if (d && d.type === "duel") {
        A.duelAuto(d.d);
        A.duelClose();
        continue;
      }
    }
    A.aiPulse(B, B.pcSide);
    A.battleStep();
  }
  return B;
};

A.battleClose = function () {
  const q = A.S.queue[0];
  if (!q || q.type !== "battle") return;
  const B = q.b;
  if (B.phase !== "end") A.battleAuto(B);
  A.S.queue.shift();
  const pc = A.pc(),
    mine = B.pcSide,
    theirs = mine === "A" ? "B" : "A",
    won = B.winner === mine,
    lost = B.winner === theirs,
    w = A.S.wars.find(x => x.id === B.war),
    myR = B.sides[mine].realm,
    enR = B.sides[theirs].realm,
    fromCamp = B.onEnd && ["campBattle", "wsBattle", "wsPart"].includes(B.onEnd.fn);
  if (
    (A.realm(myR) && !fromCamp && A.applyLosses([myR], B.dead[mine]),
    A.realm(enR) && !fromCamp && A.applyLosses([enR], B.dead[theirs]),
    w)
  ) {
    const side = A.warSide(w, myR) || "att",
      scale = A.clamp((B.sides.A.men0 + B.sides.B.men0) / 8e3, 0.3, 3),
      d = (won ? 1 : lost ? -1 : 0) * A.ri(6, 14) * scale;
    if (
      (fromCamp ||
        ((w.bscore = A.clamp((w.bscore || 0) + (side === "att" ? d : -d) * 0.6, -45, 45)),
        (w.score = A.clamp(w.score + (side === "att" ? d : -d), -100, 100))),
      w.battles.push({
        y: A.S.year,
        name: B.title,
        win: won ? side : lost ? (side === "att" ? "def" : "att") : "draw",
        lossW: B.dead[won ? mine : theirs],
        lossL: B.dead[won ? theirs : mine],
      }),
      won)
    ) {
      const p = A.S.prov.find(x => x.name === B.title.replace(/^Battle of /, ""));
      if (p && (w.att.includes(p.owner) || w.def.includes(p.owner)) && p.owner !== myR && !w[side].includes(p.owner))
        p.occ = myR;
    }
    if (pc.mil) pc.mil.warsCommanded[w.id] = true;
  }
  A.news(
    `${B.title}: ${B.winner === "draw" ? "a bloody draw" : B.sides[B.winner].name + " win"}. (${A.fmt(B.dead.A + B.dead.B)} dead)`,
    "battle",
  );
  if (pc.mil) {
    pc.mil.battles++;
    pc.mil.merit += won ? 25 + pc.mil.rank * 5 : lost ? 5 : 12;
    if (pc.mil.battles >= 10) A.ach("ten_battles");
  }
  if (pc.company) {
    pc.company.battles++;
    pc.company.men = Math.max(
      10,
      pc.company.men - Math.round((B.dead[mine] * pc.company.men) / Math.max(1, B.sides[mine].men0)),
    );
  }
  A.fame(pc, won ? 3 + Math.round(Math.log10(1 + B.sides.A.men0 + B.sides.B.men0)) : lost ? -1 : 1);
  A.trainSkill(pc, "tactics", 4);
  A.trainSkill(pc, "command", 4);
  A.willGrow(pc, won ? 0.8 : 1.6, "command");
  const sq = A.squad(pc);
  if (
    (sq.length &&
      A.chance(lost ? 0.6 : 0.3) &&
      A.comradeDies(
        pc,
        A.pick(sq),
        A.pick([
          "killed holding the line",
          "cut down carrying your orders",
          "shot leading a charge",
          "trampled when the horse went down",
        ]),
      ),
    B.pcLead && A.chance(lost ? 0.3 : 0.12))
  ) {
    const n = A.ri(8, 30);
    pc.health = A.clamp(pc.health - n, 0, 100);
    pc.lastHurt = "wounds taken leading from the front";
    A.log("You took wounds fighting in the front rank.", "bad");
  }
  A.log(
    `${B.title}: ${won ? "VICTORY" : lost ? "DEFEAT" : "A DRAW"}. You commanded ${A.fmt(B.sides[mine].men0)}. Dead: ${A.fmt(B.dead[mine])} of yours, ${A.fmt(B.dead[theirs])} of theirs.`,
    won ? "good" : lost ? "bad" : "",
  );
  if (won && B.sides[theirs].men0 > 5e3)
    pc.deeds.push({
      y: A.S.year,
      t: `Won the ${B.title} against ${A.fmt(B.sides[theirs].men0)}`,
    });
  if (won && !pc.epithet && B.sides[theirs].men0 > 2 * B.sides[mine].men0 && A.chance(0.5)) {
    pc.epithet = A.pick(["the Victorious", "the Hammer", "Shieldbreaker", "the Unbroken", "of the Long Day"]);
    A.log(`After the battle the men give you a name: ${pc.epithet}.`, "big");
  }
  if (B.onEnd && A.BATTLE_END[B.onEnd.fn]) A.BATTLE_END[B.onEnd.fn](B, B.onEnd.arg);
  if (pc.health <= 0) A.mortalCheck(pc, pc.lastHurt || "wounds taken in battle");
  if (pc.alive && pc.mil) A.promoCheck(pc);
};

A.ctrl = p => p.occ || p.owner;

A.startCampaign = function (warId) {
  const S = A.S,
    pc = A.pc(),
    w = S.wars.find(x => x.id === warId);
  if (!w) return;
  const myRealm = pc.ruler || (pc.mil && (pc.mil.merc ? pc.mil.contract : pc.mil.realm)) || pc.realm,
    side = A.warSide(w, myRealm) || "att",
    C = {
      id: "C" + A.ri(1e3, 9999),
      war: w.id,
      side,
      realm: myRealm,
      month: 3,
      armies: [],
      log: [],
      over: false,
      sel: null,
      nextId: 1,
      captured: [],
      battlesWon: 0,
      battlesLost: 0,
    };
  w.manual = S.year;
  const mySide = side === "att" ? w.att : w.def,
    theirSide = side === "att" ? w.def : w.att,
    r = A.realm(myRealm);
  let myMen;
  if (pc.ruler) myMen = Math.round(Math.min(r.army * 0.7 + r.levy * 0.2, 9e4));
  else myMen = Math.round(Math.min(GD.MIL[pc.mil.rank].leads * A.rf(0.6, 0.9), r ? r.army * 0.6 + r.levy * 0.1 : 2e4));
  myMen = Math.max(1500, myMen);
  const startProv = A.frontProv(mySide, theirSide) || A.prov(r && r.capitalProv != null ? r.capitalProv : pc.home);
  C.armies.push(A.campArmy(C, myRealm, side, myMen, r ? r.armyQ : 0.9, startProv.id, true, pc.id));
  for (const rid of w.att.concat(w.def)) {
    const rr = A.realm(rid);
    if (!rr || !rr.alive) continue;
    const s = w.att.includes(rid) ? "att" : "def";
    let men = Math.round(rr.army * 0.6 + rr.levy * 0.15);
    if (rid === myRealm) men = Math.max(0, men - myMen);
    if (!(rid === (s === "att" ? w.leadA : w.leadD))) men = Math.round(men * 0.4);
    const n = men > 3e4 ? 2 : men > 2e3 ? 1 : 0;
    for (let i = 0; i < n; i++) {
      const p = A.frontProv(s === "att" ? w.att : w.def, s === "att" ? w.def : w.att, rid) || A.pick(A.realmProvs(rid));
      if (p) C.armies.push(A.campArmy(C, rid, s, Math.round(men / n), rr.armyQ, p.id, false));
    }
  }
  C.log.push(
    `March, ${S.year}. The campaign season opens. You command ${A.fmt(myMen)} men of ${A.realmShort(myRealm)} at ${startProv.name}.`,
  );
  C.sel = C.armies[0].id;
  A.queue({
    type: "campaign",
    c: C,
  });
  return C;
};

A.campArmy = function (C, realm, side, men, q, prov, player, general) {
  const r = A.realm(realm);
  return {
    id: "a" + C.nextId++,
    realm,
    side,
    men: Math.max(100, Math.round(men)),
    men0: Math.max(100, Math.round(men)),
    q: q || 0.9,
    prov,
    player: !!player,
    general: general || null,
    name: player ? "Your army" : `${r ? r.short : realm} host`,
    moved: false,
    siegeOn: null,
    morale: 80,
  };
};

A.frontProv = function (mine, theirs, prefer) {
  const cands = [];
  for (const p of A.S.prov)
    if (mine.includes(A.ctrl(p))) {
      if (!(prefer && A.ctrl(p) !== prefer)) {
        if (p.adj.concat(p.sea || []).some(j => theirs.includes(A.ctrl(A.S.prov[j])))) cands.push(p);
      }
    }
  return cands.length ? A.pick(cands) : null;
};

A.campaign = () => {
  const q = A.S.queue[0];
  return q && q.type === "campaign" ? q.c : null;
};

A.campMoves = function (C, a) {
  const p = A.prov(a.prov),
    month = C.month,
    seaOk = month >= 4 && month <= 9,
    out = p.adj.map(j => ({
      id: j,
      sea: false,
    }));
  if (seaOk && p.coast)
    for (const q of A.S.prov)
      if (q.coast && q.id !== p.id && !p.adj.includes(q.id) && Math.hypot(q.x - p.x, q.y - p.y) < 650)
        out.push({
          id: q.id,
          sea: true,
        });
  return out;
};

A.campOrder = function (armyId, target) {
  const C = A.campaign();
  if (!C) return;
  const a = C.armies.find(x => x.id === armyId);
  if (!a || !a.player || a.moved) return;
  if (target === "siege") {
    a.order = {
      type: "siege",
    };
    a.moved = true;
    return;
  }
  if (target === "rest") {
    a.order = {
      type: "rest",
    };
    a.moved = true;
    return;
  }
  const ok = A.campMoves(C, a).find(m => m.id === target);
  if (ok) {
    a.order = {
      type: "move",
      to: target,
      sea: ok.sea,
    };
    a.moved = true;
  }
};

A.campEndTurn = function () {
  const C = A.campaign();
  if (!C || C.over) return;
  const w = A.S.wars.find(x => x.id === C.war);
  if (!w) {
    C.over = true;
    C.log.push("The war is over.");
    return;
  }
  const enemySide = s => (s === "att" ? "def" : "att"),
    sideRealms = s => (s === "att" ? w.att : w.def);
  for (const a of C.armies) {
    if (a.player && a.order) continue;
    if (a.player) {
      a.order = {
        type: "rest",
      };
      continue;
    }
    const p = A.prov(a.prov),
      foes = C.armies.filter(b => b.side !== a.side && b.men > 0),
      adjFoe = foes.find(b => p.adj.includes(b.prov) && b.men < a.men * 1.3);
    if (adjFoe && A.chance(0.6)) {
      a.order = {
        type: "move",
        to: adjFoe.prov,
      };
      continue;
    }
    if (sideRealms(enemySide(a.side)).includes(A.ctrl(p)) && !foes.some(b => b.prov === p.id)) {
      a.order = {
        type: "siege",
      };
      continue;
    }
    const path = A.pathTo(a.prov, q => sideRealms(enemySide(a.side)).includes(A.ctrl(q)));
    if (path && path.length > 1)
      a.order = {
        type: "move",
        to: path[1],
      };
    else
      a.order = {
        type: "rest",
      };
    if (foes.some(b => b.men > a.men * 1.8 && A.prov(b.prov).adj.includes(a.prov)) && A.chance(0.5))
      a.order = {
        type: "rest",
      };
  }
  for (const a of C.armies)
    if (a.order && a.order.type === "move") {
      const to = A.prov(a.order.to);
      a.prov = a.order.to;
      if (a.player) C.log.push(`Your army marches to ${to.name}${a.order.sea ? " by sea" : ""}.`);
      a.siegeOn = null;
    }
  const pending = [];
  for (const p of new Set(C.armies.map(a => a.prov))) {
    const here = C.armies.filter(a => a.prov === p && a.men > 0);
    if (new Set(here.map(a => a.side)).size < 2) continue;
    const att = here.filter(a => a.side === "att"),
      def = here.filter(a => a.side === "def"),
      playerIn = here.find(a => a.player);
    if (playerIn)
      pending.push({
        p,
        att,
        def,
        player: playerIn,
      });
    else A.campAutoBattle(C, p, att, def);
  }
  for (const a of C.armies) {
    if (!a.order || a.order.type !== "siege" || a.men <= 0) continue;
    const p = A.prov(a.prov);
    if (
      sideRealms(enemySide(a.side)).includes(A.ctrl(p)) &&
      !C.armies.some(b => b.prov === p.id && b.side !== a.side && b.men > 0) &&
      ((p.siege = (p.siege || 0) + A.clamp((a.men / (1500 + p.fort * 4e3 + p.pop / 60)) * 22 * a.q, 4, 70)),
      a.player && C.log.push(`Siege of ${p.name}: ${Math.min(100, Math.round(p.siege))}%.`),
      p.siege >= 100)
    ) {
      p.siege = 0;
      const lead = a.side === "att" ? w.leadA : w.leadD;
      p.occ = sideRealms(a.side).includes(p.owner) ? null : a.realm || lead;
      const r = A.realm(p.owner),
        capBonus = r && r.capitalProv === p.id ? 25 : 8;
      w.score = A.clamp(w.score + (a.side === "att" ? capBonus : -capBonus), -100, 100);
      C.log.push(`${p.name} falls to ${a.player ? "you" : A.realmShort(a.realm)}!`);
      if (a.player) {
        C.captured.push(p.name);
        A.fame(A.pc(), 2);
      }
      A.news(`${p.name} falls to ${A.realmShort(a.realm)}.`, "war");
    }
  }
  for (const a of C.armies) {
    const p = A.prov(a.prov),
      friendly = sideRealms(a.side).includes(A.ctrl(p));
    let rate = friendly ? 0.006 : 0.018;
    rate +=
      {
        desert: 0.03,
        tundra: 0.025,
        mountains: 0.02,
        marsh: 0.02,
      }[p.terr] || 0;
    if (C.month >= 10) rate += 0.01;
    if (a.order && a.order.type === "rest" && friendly) rate = 0;
    const lost = Math.round(a.men * rate);
    a.men -= lost;
    if (a.player && lost > 50) C.log.push(`Sickness, desertion and hunger cost you ${A.fmt(lost)} men.`);
    a.moved = false;
    a.order = null;
  }
  C.armies = C.armies.filter(a => a.men > 50 || a.player);
  for (const b of pending.reverse()) {
    const pl = b.player,
      foes = pl.side === "att" ? b.def : b.att,
      friends = (pl.side === "att" ? b.att : b.def).filter(x => !x.player),
      foeMen = foes.reduce((x, y) => x + y.men, 0),
      myMen = pl.men + friends.reduce((x, y) => x + y.men, 0),
      P = A.prov(b.p),
      er = foes[0] ? A.realm(foes[0].realm) : null,
      B = A.newBattle({
        title: "Battle of " + P.name,
        terr: P.terr,
        war: C.war,
        sideA: {
          realm: pl.realm,
          name: A.realmShort(pl.realm),
          men: myMen,
          q: pl.q,
          commander: A.S.pc,
        },
        sideB: {
          realm: foes[0].realm,
          name: er ? er.short : "the enemy",
          men: foeMen,
          q: foes[0].q,
        },
        onEnd: {
          fn: "campBattle",
          arg: {
            cid: C.id,
            prov: b.p,
          },
        },
      });
    A.S.queue.unshift({
      type: "battle",
      b: B,
    });
  }
  C.month++;
  const mname = GD.MONTHS[Math.min(11, C.month - 1)];
  if (C.month > 10) A.campFinish(C);
  else C.log.push(`— ${mname} —`);
};

A.pathTo = function (from, goal) {
  const prev = {
      [from]: -1,
    },
    q = [from];
  for (; q.length; ) {
    const u = q.shift();
    if (u !== from && goal(A.prov(u))) {
      const path = [u];
      let x = u;
      for (; prev[x] !== -1; ) {
        x = prev[x];
        path.unshift(x);
      }
      return path;
    }
    for (const v of A.prov(u).adj)
      if (prev[v] === void 0) {
        prev[v] = u;
        q.push(v);
      }
    if (Object.keys(prev).length > 400) break;
  }
  return null;
};

A.campAutoBattle = function (C, p, att, def) {
  const pa = att.reduce((x, a) => x + a.men * a.q, 0) * A.rf(0.7, 1.3),
    pd = def.reduce((x, a) => x + a.men * a.q, 0) * A.rf(0.7, 1.3) * 1.1,
    winSide = pa > pd ? "att" : "def",
    winners = winSide === "att" ? att : def,
    losers = winSide === "att" ? def : att;
  for (const a of winners) a.men = Math.round(a.men * A.rf(0.88, 0.95));
  for (const a of losers) {
    a.men = Math.round(a.men * A.rf(0.6, 0.8));
    const back = A.prov(a.prov).adj.find(j => true);
    if (back != null) a.prov = back;
  }
  const w = A.S.wars.find(x => x.id === C.war);
  if (w) w.score = A.clamp(w.score + (winSide === "att" ? 8 : -8), -100, 100);
  C.log.push(`Battle at ${A.prov(p).name}: ${A.realmShort(winners[0].realm)} beat ${A.realmShort(losers[0].realm)}.`);
};

A.BATTLE_END.campBattle = function (B, arg) {
  const C = A.S.queue.map(q => q.c).find(c => c && c.id === arg.cid);
  if (!C) return;
  const pl = C.armies.find(a => a.player),
    mine = B.pcSide,
    theirs = mine === "A" ? "B" : "A",
    myLossFrac = B.dead[mine] / Math.max(1, B.sides[mine].men0),
    thLossFrac = B.dead[theirs] / Math.max(1, B.sides[theirs].men0);
  for (const a of C.armies.filter(x => x.prov === arg.prov))
    if (a.side === pl.side) a.men = Math.round(a.men * (1 - myLossFrac));
    else a.men = Math.round(a.men * (1 - thLossFrac));
  const won = B.winner === mine,
    losers = C.armies.filter(
      a => a.prov === arg.prov && a.side !== (won ? pl.side : pl.side === "att" ? "def" : "att"),
    );
  for (const a of losers) {
    const P = A.prov(a.prov),
      w = A.S.wars.find(x => x.id === C.war),
      friendly = j => (a.side === "att" ? w.att : w.def).includes(A.ctrl(A.prov(j))),
      back = P.adj.find(friendly) != null ? P.adj.find(friendly) : P.adj[0];
    if (back != null) a.prov = back;
  }
  if (won) C.battlesWon++;
  else {
    if (B.winner !== "draw") C.battlesLost++;
  }
  C.log.push(`${B.title}: ${won ? "you win" : B.winner === "draw" ? "a draw" : "you are beaten"}.`);
  C.armies = C.armies.filter(a => a.men > 50 || a.player);
  if (pl.men < 200) {
    C.log.push("Your army is shattered. The campaign is over for you.");
    A.campFinish(C);
  }
};

A.campFinish = function (C) {
  if (C.over) return;
  C.over = true;
  const w = A.S.wars.find(x => x.id === C.war);
  if (
    (C.log.push(
      `The campaign season closes. You took ${C.captured.length ? C.captured.join(", ") : "nothing"}; battles won ${C.battlesWon}, lost ${C.battlesLost}.`,
    ),
    w)
  )
    for (const rid of w.att.concat(w.def)) {
      const r = A.realm(rid);
      if (!r) continue;
      const left = C.armies.filter(a => a.realm === rid).reduce((x, a) => x + a.men, 0),
        start = C.armies.filter(a => a.realm === rid).reduce((x, a) => x + a.men0, 0);
      if (start > 0) {
        const lost = start - left;
        r.army = Math.max(Math.round(r.army * 0.3), r.army - Math.round(lost * 0.8));
      }
      r.exhaustion = A.clamp(r.exhaustion + 10, 0, 100);
    }
};

A.campClose = function () {
  const q = A.S.queue[0];
  if (!q || q.type !== "campaign") return;
  const C = q.c;
  if (!C.over) A.campFinish(C);
  A.S.queue.shift();
  const pc = A.pc(),
    w = A.S.wars.find(x => x.id === C.war);
  A.log(C.log[C.log.length - 1], C.battlesWon > C.battlesLost ? "good" : C.battlesLost > C.battlesWon ? "bad" : "");
  A.trainSkill(pc, "command", 5);
  A.trainSkill(pc, "tactics", 5);
  if (pc.mil) {
    pc.mil.merit += 20 + C.captured.length * 10 + C.battlesWon * 15;
    pc.mil.warsCommanded[C.war] = true;
    A.promoCheck(pc);
  }
  if (w) {
    w.manualPeace = false;
    A.checkPeace(w);
  }
};

A.campAuto = function () {
  const C = A.campaign();
  if (!C) return;
  let g = 0;
  for (; !C.over && g++ < 12; ) {
    const pl = C.armies.find(a => a.player);
    if (pl) {
      const w = A.S.wars.find(x => x.id === C.war),
        enemyR = w ? (C.side === "att" ? w.def : w.att) : [];
      if (enemyR.includes(A.ctrl(A.prov(pl.prov)))) A.campOrder(pl.id, "siege");
      else {
        const path = A.pathTo(pl.prov, q => enemyR.includes(A.ctrl(q)));
        if (path && path.length > 1) A.campOrder(pl.id, path[1]);
        else A.campOrder(pl.id, "rest");
      }
    }
    for (A.campEndTurn(); A.S.queue[0] && A.S.queue[0].type === "battle"; ) A.battleClose();
    for (; A.S.queue[0] && A.S.queue[0].type === "duel"; ) {
      A.duelAuto(A.S.queue[0].d);
      A.duelClose();
    }
  }
};

GD.EQ = {
  arms: {
    name: "Arms & shields",
    short: "Arms",
    cost: 0.5,
    ore: true,
    desc: "Spears, swords, axes, shields and helmets.",
  },
  bows: {
    name: "Bows & bolts",
    short: "Bows",
    cost: 0.6,
    desc: "Bows, crossbows, slings and the arrows to feed them.",
  },
  horses: {
    name: "Warhorses",
    short: "Horses",
    cost: 1.6,
    desc: "Trained mounts, tack and remounts. Camels count here too.",
  },
  harness: {
    name: "Mail & plate",
    short: "Harness",
    cost: 1.2,
    ore: true,
    desc: "Heavy armor for knights and the heavy foot.",
  },
  engines: {
    name: "Siege engines",
    short: "Engines",
    cost: 5,
    ore: true,
    desc: "Trebuchets, mangonels, rams and the wrights who build them.",
  },
  kit: {
    name: "Carts, tents & tools",
    short: "Kit",
    cost: 0.7,
    desc: "Wagons, picks, tents, kettles: what an army lives on.",
  },
  beasts: {
    name: "War beasts",
    short: "Beasts",
    cost: 14,
    desc: "Elephants, their towers and mahouts.",
  },
};

GD.EQ_KEYS = Object.keys(GD.EQ);

GD.BN = {
  SP: {
    men: 800,
    w: 2,
    soft: 5,
    hard: 1.5,
    def: 22,
    brk: 3,
    org: 60,
    hp: 25,
    sup: 0.07,
    spd: 1,
    hd: 0,
    arm: 0,
    prc: 2,
    ac: 4,
    eq: {
      arms: 100,
    },
    cat: "foot",
    role: "Line spears: cheap, steady, hard to shift.",
  },
  PK: {
    men: 800,
    w: 2,
    soft: 4.5,
    hard: 3,
    def: 26,
    brk: 2.5,
    org: 62,
    hp: 25,
    sup: 0.07,
    spd: 0.85,
    hd: 0,
    arm: 1,
    prc: 3,
    ac: 9,
    eq: {
      arms: 110,
    },
    cat: "foot",
    role: "Pike blocks: the best wall against horse, slow to move.",
  },
  HI: {
    men: 800,
    w: 2,
    soft: 8,
    hard: 2.5,
    def: 26,
    brk: 6,
    org: 65,
    hp: 30,
    sup: 0.09,
    spd: 0.85,
    hd: 0.25,
    arm: 6,
    prc: 4,
    ac: 4,
    eq: {
      arms: 100,
      harness: 60,
    },
    cat: "foot",
    role: "Heavy infantry in mail: the hammer of the line.",
  },
  AX: {
    men: 800,
    w: 2,
    soft: 10,
    hard: 2.5,
    def: 14,
    brk: 7,
    org: 56,
    hp: 25,
    sup: 0.08,
    spd: 1,
    hd: 0.05,
    arm: 2,
    prc: 4,
    ac: 2,
    eq: {
      arms: 100,
      harness: 20,
    },
    cat: "foot",
    role: "Axemen: brutal attack, thin defense.",
  },
  LI: {
    men: 800,
    w: 2,
    soft: 5,
    hard: 0.5,
    def: 16,
    brk: 4,
    org: 55,
    hp: 20,
    sup: 0.06,
    spd: 1.35,
    hd: 0,
    arm: 0,
    prc: 1,
    ac: 1,
    eq: {
      arms: 80,
      bows: 20,
    },
    cat: "foot",
    role: "Light infantry: quick, cheap, good in woods.",
  },
  XB: {
    men: 800,
    w: 2,
    soft: 12,
    hard: 3,
    def: 10,
    brk: 2,
    org: 40,
    hp: 15,
    sup: 0.07,
    spd: 1,
    hd: 0,
    arm: 0,
    prc: 8,
    ac: 1,
    eq: {
      bows: 100,
      arms: 30,
    },
    cat: "missile",
    role: "Crossbows: punch through armor.",
  },
  LB: {
    men: 600,
    w: 2,
    soft: 15,
    hard: 2,
    def: 10,
    brk: 2.5,
    org: 45,
    hp: 15,
    sup: 0.07,
    spd: 1,
    hd: 0,
    arm: 0,
    prc: 6,
    ac: 1,
    eq: {
      bows: 100,
      arms: 30,
    },
    cat: "missile",
    role: "Longbows: the deadliest volleys in Ardan.",
  },
  AR: {
    men: 800,
    w: 2,
    soft: 10,
    hard: 1,
    def: 9,
    brk: 2,
    org: 40,
    hp: 15,
    sup: 0.06,
    spd: 1,
    hd: 0,
    arm: 0,
    prc: 3,
    ac: 1,
    eq: {
      bows: 100,
      arms: 20,
    },
    cat: "missile",
    role: "Archers: steady soft attack behind the spears.",
  },
  EA: {
    men: 500,
    w: 2,
    soft: 18,
    hard: 3,
    def: 14,
    brk: 4,
    org: 70,
    hp: 18,
    sup: 0.06,
    spd: 1.3,
    hd: 0,
    arm: 1,
    prc: 7,
    ac: 1,
    eq: {
      bows: 80,
      arms: 40,
    },
    cat: "missile",
    role: "Elven archers: few, deadly, never panic.",
  },
  SL: {
    men: 800,
    w: 2,
    soft: 8,
    hard: 1,
    def: 8,
    brk: 2,
    org: 35,
    hp: 14,
    sup: 0.05,
    spd: 1.2,
    hd: 0,
    arm: 0,
    prc: 2,
    ac: 1,
    eq: {
      arms: 40,
      bows: 40,
    },
    cat: "missile",
    role: "Slingers: cheap missiles from the hills.",
  },
  HC: {
    men: 500,
    w: 2,
    soft: 14,
    hard: 4,
    def: 12,
    brk: 22,
    org: 65,
    hp: 20,
    sup: 0.14,
    spd: 2,
    hd: 0.5,
    arm: 8,
    prc: 6,
    ac: 0,
    eq: {
      horses: 60,
      harness: 60,
      arms: 60,
    },
    cat: "horse",
    role: "Knights: the breakthrough. Ruinous to lose.",
  },
  MC: {
    men: 600,
    w: 2,
    soft: 10,
    hard: 2,
    def: 12,
    brk: 14,
    org: 60,
    hp: 20,
    sup: 0.12,
    spd: 2.3,
    hd: 0.3,
    arm: 4,
    prc: 4,
    ac: 0,
    eq: {
      horses: 60,
      harness: 30,
      arms: 60,
    },
    cat: "horse",
    role: "Medium horse: charge and pursue.",
  },
  LC: {
    men: 600,
    w: 2,
    soft: 7,
    hard: 1,
    def: 10,
    brk: 9,
    org: 55,
    hp: 18,
    sup: 0.1,
    spd: 2.8,
    hd: 0.2,
    arm: 1,
    prc: 2,
    ac: 0,
    eq: {
      horses: 60,
      arms: 60,
    },
    cat: "horse",
    role: "Light horse: fast, scouts, hunts the broken.",
  },
  HA: {
    men: 600,
    w: 2,
    soft: 12,
    hard: 1.5,
    def: 9,
    brk: 8,
    org: 60,
    hp: 16,
    sup: 0.1,
    spd: 3,
    hd: 0.15,
    arm: 1,
    prc: 4,
    ac: 0,
    eq: {
      horses: 60,
      bows: 60,
    },
    cat: "horse",
    role: "Horse archers: shoot, wheel, shoot again.",
  },
  CM: {
    men: 600,
    w: 2,
    soft: 9,
    hard: 2,
    def: 12,
    brk: 12,
    org: 58,
    hp: 20,
    sup: 0.09,
    spd: 2,
    hd: 0.25,
    arm: 2,
    prc: 3,
    ac: 0,
    eq: {
      horses: 60,
      arms: 60,
    },
    cat: "horse",
    role: "Camel riders: horses shy from them; desert-hardy.",
  },
  OR: {
    men: 600,
    w: 2,
    soft: 11,
    hard: 2,
    def: 12,
    brk: 14,
    org: 62,
    hp: 22,
    sup: 0.11,
    spd: 2.6,
    hd: 0.25,
    arm: 2,
    prc: 4,
    ac: 0,
    eq: {
      horses: 60,
      arms: 60,
      bows: 20,
    },
    cat: "horse",
    role: "Orc relay bands: never stop moving.",
  },
  EL: {
    men: 120,
    w: 3,
    soft: 30,
    hard: 8,
    def: 18,
    brk: 40,
    org: 50,
    hp: 30,
    sup: 0.3,
    spd: 0.9,
    hd: 0.8,
    arm: 20,
    prc: 10,
    ac: 6,
    eq: {
      beasts: 40,
      arms: 20,
    },
    cat: "beast",
    role: "War elephants: walls that walk. Panic is their weakness.",
  },
  GI: {
    men: 30,
    w: 2,
    soft: 32,
    hard: 12,
    def: 24,
    brk: 34,
    org: 80,
    hp: 34,
    sup: 0.25,
    spd: 0.85,
    hd: 0.7,
    arm: 18,
    prc: 14,
    ac: 6,
    eq: {
      arms: 10,
      harness: 10,
    },
    cat: "beast",
    role: "Giants. Thirty of them is a battle.",
  },
  MR: {
    men: 800,
    w: 2,
    soft: 7,
    hard: 1.5,
    def: 18,
    brk: 4,
    org: 55,
    hp: 22,
    sup: 0.07,
    spd: 1,
    hd: 0,
    arm: 1,
    prc: 3,
    ac: 2,
    eq: {
      arms: 80,
      bows: 30,
    },
    cat: "foot",
    role: "Marines: fight from ships and beaches.",
  },
  GA: {
    men: 800,
    w: 2,
    soft: 4,
    hard: 1,
    def: 24,
    brk: 1.5,
    org: 50,
    hp: 25,
    sup: 0.06,
    spd: 0.8,
    hd: 0,
    arm: 1,
    prc: 2,
    ac: 4,
    eq: {
      arms: 80,
    },
    cat: "foot",
    role: "Garrison troops: hold walls, not fields.",
  },
  LV: {
    men: 800,
    w: 2,
    soft: 3,
    hard: 0.5,
    def: 14,
    brk: 1.5,
    org: 35,
    hp: 22,
    sup: 0.05,
    spd: 1,
    hd: 0,
    arm: 0,
    prc: 1,
    ac: 2,
    eq: {
      arms: 60,
    },
    cat: "foot",
    role: "Levy: farmers with spears. Numbers, not quality.",
  },
};

GD.SUP = {
  eng: {
    name: "Sappers",
    men: 150,
    eq: {
      kit: 30,
    },
    fx: {
      def: 6,
      siege: 0.25,
      dig: 3,
      fortPen: 0.3,
    },
    desc: "Dig in faster and deeper (+3 entrenchment), +6 defense, sieges 25% faster, walls hurt less.",
  },
  scouts: {
    name: "Outriders",
    men: 120,
    eq: {
      horses: 30,
    },
    fx: {
      atkMul: 0.06,
      spd: 0.05,
      intel: 1,
    },
    desc: "Reconnaissance: +6% attack, +5% speed, see enemy strength.",
  },
  hosp: {
    name: "Field hospital",
    men: 100,
    eq: {
      kit: 20,
    },
    fx: {
      cas: 0.3,
      keepExp: 0.5,
    },
    desc: "30% fewer dead; recruits keep more of the division's experience.",
  },
  quart: {
    name: "Quartermasters",
    men: 100,
    eq: {
      kit: 40,
    },
    fx: {
      supMul: -0.2,
      reinf: 0.3,
    },
    desc: "Supply use -20%, refits 30% faster.",
  },
  herald: {
    name: "Heralds & drums",
    men: 60,
    eq: {
      kit: 10,
      horses: 10,
    },
    fx: {
      org: 8,
      orgReg: 0.25,
    },
    desc: "+8 organization, rallies 25% faster.",
  },
  engines: {
    name: "Siege train",
    men: 200,
    eq: {
      engines: 12,
      kit: 10,
    },
    fx: {
      soft: 14,
      siege: 0.6,
      fortPen: 0.5,
      spd: -0.1,
    },
    desc: "+14 soft attack, sieges 60% faster, walls hurt half as much. Slows the march.",
  },
  guard: {
    name: "Banner guard",
    men: 150,
    eq: {
      arms: 20,
      harness: 15,
    },
    fx: {
      org: 6,
      def: 5,
      brk: 3,
    },
    desc: "Picked veterans around the colors: +6 org, +5 defense, +3 breakthrough.",
  },
};

GD.XPLV = [
  [0, "Green", 0.82],
  [10, "Trained", 0.94],
  [25, "Regular", 1],
  [45, "Seasoned", 1.08],
  [70, "Veteran", 1.16],
  [90, "Elite", 1.25],
];

GD.RDOC = {
  plan: {
    name: "Grand Battle Plan",
    cost: 40,
    desc: "Careful preparation: planning builds to +35% (not +25%), divisions dig in 2 levels deeper.",
    fx: {
      planMax: 0.1,
      dig: 2,
    },
  },
  shock: {
    name: "Shock and Charge",
    cost: 40,
    desc: "Knights and horse hit first and hardest: +15% breakthrough, +10% attack for horse divisions.",
    fx: {
      horseAtk: 0.1,
      brk: 0.15,
    },
  },
  volley: {
    name: "Massed Volleys",
    cost: 40,
    desc: "Archers and crossbows win battles: +12% soft attack for bow-heavy divisions, +6% for the rest.",
    fx: {
      bowSoft: 0.12,
      soft: 0.06,
    },
  },
  levy: {
    name: "Nation in Arms",
    cost: 40,
    desc: "Every hamlet sends men: manpower pool +20%, levy and garrison troops +15% organization.",
    fx: {
      mp: 0.2,
      levyOrg: 0.15,
    },
  },
  iron: {
    name: "Iron Discipline",
    cost: 40,
    desc: "Drill and order: +8% organization, rally 20% faster, +5% defense.",
    fx: {
      org: 0.08,
      orgReg: 0.2,
      def: 0.05,
    },
  },
};

A.rdoc = r => (r && r.forces && r.forces.doc && GD.RDOC[r.forces.doc] ? GD.RDOC[r.forces.doc].fx : {});

A.xpLevel = x => {
  let L = GD.XPLV[0];
  for (const l of GD.XPLV) if (x >= l[0]) L = l;
  return L;
};

GD.TPL_MAX_BN = 12;

GD.TPL_MAX_SUP = 5;

GD.ECON = {
  civilian: {
    name: "Civilian economy",
    cg: 0.35,
    out: 0.8,
    stab: 2,
    inc: 1,
    desc: "Markets first. Forges work slowly; the people are content.",
  },
  partial: {
    name: "Partial mobilization",
    cg: 0.25,
    out: 0.9,
    stab: 0,
    inc: 0.98,
    desc: "The usual balance between the plough and the forge.",
  },
  war: {
    name: "War economy",
    cg: 0.15,
    out: 1,
    stab: -3,
    inc: 0.93,
    desc: "Guilds work for the host. Prices rise; tempers fray.",
    war: true,
  },
  total: {
    name: "Total mobilization",
    cg: 0.06,
    out: 1.12,
    stab: -7,
    inc: 0.85,
    desc: "Every anvil rings for war. Only in a war for survival.",
    war: true,
    needExh: true,
  },
};

GD.BUILD = {
  forge: {
    name: "Forge (military)",
    cost: 300,
    slot: true,
    desc: "A new forge for the production lines.",
  },
  workshop: {
    name: "Workshop (civilian)",
    cost: 260,
    slot: true,
    desc: "More coin and faster building.",
  },
  walls: {
    name: "Walls (+1 fort)",
    cost: 220,
    desc: "Sieges take longer; attackers fight at a penalty.",
  },
  depot: {
    name: "Supply depot",
    cost: 180,
    desc: "A supply hub: feeds armies in this province and nearby.",
  },
  road: {
    name: "Military road",
    cost: 120,
    desc: "Marches 25% faster through here; more supply flows.",
  },
};

A.WIDTH = {
  plains: 70,
  steppe: 80,
  desert: 70,
  hills: 55,
  forest: 50,
  marsh: 40,
  mountains: 35,
  tundra: 60,
};

A.ATK_TERR = {
  plains: 1,
  steppe: 1,
  desert: 0.95,
  hills: 0.78,
  forest: 0.85,
  marsh: 0.65,
  mountains: 0.55,
  tundra: 0.9,
};

A.tplStats = function (tpl, rid) {
  const o = {
      soft: 0,
      hard: 0,
      def: 0,
      brk: 0,
      org: 0,
      hp: 0,
      w: 0,
      sup: 0,
      spd: 9,
      hd: 0,
      arm: 0,
      prc: 0,
      ac: 0,
      men: 0,
      eq: {},
      cats: {
        foot: 0,
        missile: 0,
        horse: 0,
        beast: 0,
      },
      fx: {},
    },
    bns = (tpl.bns || []).filter(c => GD.BN[c]);
  let maxArm = 0,
    maxPrc = 0,
    sumArm = 0,
    sumPrc = 0;
  for (const c of bns) {
    const B = GD.BN[c];
    o.soft += B.soft;
    o.hard += B.hard;
    o.def += B.def;
    o.brk += B.brk;
    o.org += B.org;
    o.hp += B.hp;
    o.w += B.w;
    o.sup += B.sup;
    o.hd += B.hd;
    o.ac += B.ac;
    o.spd = Math.min(o.spd, B.spd);
    o.men += B.men;
    o.cats[B.cat] += 1;
    maxArm = Math.max(maxArm, B.arm);
    maxPrc = Math.max(maxPrc, B.prc);
    sumArm += B.arm;
    sumPrc += B.prc;
    for (const k in B.eq) o.eq[k] = (o.eq[k] || 0) + B.eq[k];
  }
  const n = bns.length || 1;
  o.org /= n;
  o.hd /= n;
  o.ac /= n;
  o.arm = 0.3 * maxArm + (0.7 * sumArm) / n;
  o.prc = 0.3 * maxPrc + (0.7 * sumPrc) / n;
  for (const s of tpl.sup || []) {
    const U = GD.SUP[s];
    if (U) {
      o.men += U.men;
      for (const k in U.eq) o.eq[k] = (o.eq[k] || 0) + U.eq[k];
      for (const k in U.fx) o.fx[k] = (o.fx[k] || 0) + U.fx[k];
    }
  }
  o.soft += o.fx.soft || 0;
  o.def += o.fx.def || 0;
  o.brk += o.fx.brk || 0;
  o.org += o.fx.org || 0;
  o.sup *= 1 + (o.fx.supMul || 0);
  if (o.spd > 8) o.spd = 1;
  o.spd *= 1 + (o.fx.spd || 0);
  o.n = bns.length;
  o.main = Object.keys(o.cats).sort((a, b) => o.cats[b] - o.cats[a])[0] || "foot";
  if (o.main === "beast") o.main = "foot";
  o.cost = Object.entries(o.eq).reduce((a, [k, v]) => a + v * GD.EQ[k].cost, 0);
  return o;
};

A.tplOf = d => {
  const r = A.realm(d.r);
  return r && r.forces ? r.forces.tpl[d.tpl] : null;
};

A.tplS = function (rid, tid) {
  const r = A.realm(rid);
  if (!r || !r.forces) return null;
  const t = r.forces.tpl[tid];
  return t
    ? ((!t._s || t._v !== t.v) &&
        (Object.defineProperty(t, "_s", {
          value: A.tplStats(t, rid),
          writable: true,
          enumerable: false,
          configurable: true,
        }),
        Object.defineProperty(t, "_v", {
          value: t.v,
          writable: true,
          enumerable: false,
          configurable: true,
        })),
      t._s)
    : null;
};

A.TPL_KIND = {
  line: "Line",
  horse: "Horse",
  beast: "Beast",
  missile: "Bow",
  guard: "Guard",
  garrison: "Garrison",
  custom: "Field",
};

A.tplKindOf = function (s) {
  return s.cats.beast >= Math.max(2, s.n / 3)
    ? "beast"
    : s.cats.horse > s.n / 2
      ? "horse"
      : s.cats.missile > s.n / 2
        ? "missile"
        : "line";
};

A.tplDefaults = function (r) {
  const shares = A.compShares(r.id, (r.isRebel, null)),
    by = {
      foot: [],
      missile: [],
      horse: [],
      beast: [],
    };
  for (const [c, s] of shares) {
    const B = GD.BN[c];
    if (B && s > 0) by[B.cat].push([c, s]);
  }
  if (by.foot.some(x => !["GA", "LV"].includes(x[0]))) {
    let extra = 0;
    by.foot = by.foot.filter(x => (["GA", "LV"].includes(x[0]) ? ((extra += x[1]), false) : true));
    const sp = by.foot.find(x => x[0] === "SP" || x[0] === "PK") || by.foot[0];
    sp[1] += extra;
  }
  const tot = k => by[k].reduce((a, x) => a + x[1], 0),
    out = [],
    fill = (list, n) => {
      const sum = list.reduce((a, x) => a + x[1], 0) || 1,
        res = list.map(([c, s]) => [c, (n * s) / sum]).map(([c, v]) => [c, Math.floor(v), v - Math.floor(v)]);
      let left = n - res.reduce((a, x) => a + x[1], 0);
      res.sort((a, b) => b[2] - a[2]);
      for (let i = 0; left > 0 && res.length; i = (i + 1) % res.length, left--) res[i][1]++;
      const bns = [];
      for (const [c, k] of res) for (let i = 0; i < k; i++) bns.push(c);
      return bns;
    },
    footT = tot("foot"),
    misT = tot("missile"),
    horseT = tot("horse"),
    beastT = tot("beast"),
    all = footT + misT + horseT + beastT || 1;
  if (by.beast.some(x => x[0] === "GI")) {
    out.push({
      name: "Giant Host",
      bns: Array(8).fill("GI"),
      sup: [],
      kind: "beast",
      share: 1,
    });
    return out;
  }
  if (footT + misT > 0) {
    const nMis = misT > 0 ? A.clamp(Math.round((9 * misT) / (footT + misT)), 1, footT > 0 ? 4 : 9) : 0,
      bns = fill(by.foot.length ? by.foot : [["SP", 1]], 9 - nMis).concat(nMis ? fill(by.missile, nMis) : []),
      sup = ["eng"];
    if (horseT > 0) sup.push("scouts");
    if (r.race === "elf" || r.race === "dwarf") sup.push("herald");
    out.push({
      name: footT ? "Line Division" : "Bow Division",
      bns,
      sup,
      kind: footT ? "line" : "missile",
      share: (footT + misT) / all,
    });
  }
  if (horseT / all >= 0.08)
    out.push({
      name: "Horse Division",
      bns: fill(by.horse, 6),
      sup: ["scouts", "herald"],
      kind: "horse",
      share: horseT / all,
    });
  if (beastT / all >= 0.03)
    out.push({
      name: "Elephant Corps",
      bns: Array(3)
        .fill("EL")
        .concat(fill(by.foot.length ? by.foot : [["SP", 1]], 4)),
      sup: ["herald"],
      kind: "beast",
      share: (beastT / all) * 3,
    });
  if (!out.length)
    out.push({
      name: "Line Division",
      bns: Array(7).fill("SP").concat(["AR", "AR"]),
      sup: ["eng"],
      kind: "line",
      share: 1,
    });
  const s0 = A.tplStats(out[0], r.id);
  if (r.army < s0.men * 1.6)
    for (const t of out) {
      const n = A.clamp(
        Math.round((r.army * t.share) / (2 * (A.tplStats(t, r.id).men / Math.max(1, t.bns.length)))),
        2,
        t.bns.length,
      );
      if (n < t.bns.length) {
        const keep = [],
          step = t.bns.length / n;
        for (let i = 0; i < n; i++) keep.push(t.bns[Math.floor(i * step)]);
        t.bns = keep;
        t.name = t.name.replace("Division", "Brigade").replace("Corps", "Brigade");
        t.sup = t.sup.slice(0, 1);
      }
    }
  return out;
};

A.F = function (r) {
  return r ? (r.forces || A.forcesInit(r), r.ind || A.indInit(r), r.forces) : null;
};

A.forcesInit = function (r) {
  const F = (r.forces = {
    tpl: {},
    divs: [],
    next: 1,
    tnext: 1,
    xp: 20,
    cnt: {},
    queue: [],
    auto: true,
  });
  for (const t of A.tplDefaults(r)) A.tplAdd(r, t);
  const tids = Object.keys(F.tpl),
    shares = tids.map(id => F.tpl[id].share || 1),
    ssum = shares.reduce((a, b) => a + b, 0) || 1,
    provs = A.realmProvs(r.id),
    spots = A.garrisonSpots(r);
  let made = 0;
  tids.forEach((tid, i) => {
    const s = A.tplS(r.id, tid),
      men = (r.army * shares[i]) / ssum;
    let n = Math.floor(men / s.men + 0.35);
    if (i === 0 && n === 0 && !made) n = 1;
    for (let k = 0; k < n; k++)
      if (
        A.newDiv(
          r,
          tid,
          spots.length ? spots[made % spots.length] : r.capitalProv != null ? r.capitalProv : (provs[0] || {}).id,
          {
            str: A.clamp(men / Math.max(1, n * s.men), 0.35, 1),
            exp: A.ri(18, 40),
          },
        )
      )
        made++;
  });
  F.cnt = F.cnt || {};
  A.forcesSync(r);
};

A.garrisonSpots = function (r) {
  const ps = A.realmProvs(r.id);
  if (!ps.length) return [];
  const cap = r.capitalProv != null ? r.capitalProv : ps[0].id,
    border = ps
      .filter(p =>
        p.adj.some(j => {
          const o = A.S.prov[j].owner;
          return o !== r.id && o !== "unclaimed";
        }),
      )
      .sort((a, b) => b.pop - a.pop)
      .map(p => p.id),
    out = [cap].concat(border.filter(x => x !== cap));
  for (const p of ps.slice().sort((a, b) => b.pop - a.pop)) if (!out.includes(p.id)) out.push(p.id);
  return out;
};

A.tplAdd = function (r, t) {
  const F = r.forces,
    id = "T" + F.tnext++;
  F.tpl[id] = {
    id,
    name: t.name,
    bns: t.bns.slice(),
    sup: (t.sup || []).slice(),
    kind: t.kind || "line",
    share: t.share || 1,
    v: 1,
  };
  return F.tpl[id];
};

A.divName = function (r, tpl) {
  const F = r.forces,
    kind = A.TPL_KIND[tpl.kind] || "Field";
  F.cnt[kind] = (F.cnt[kind] || 0) + 1;
  const nm = r.short.replace(/^the /i, "");
  return `${A.ordinal(F.cnt[kind])} ${nm} ${kind}`;
};

A.newDiv = function (r, tid, loc, o = {}) {
  const F = r.forces,
    tpl = F.tpl[tid];
  if (!tpl) return null;
  const s = A.tplS(r.id, tid),
    str = o.str != null ? o.str : 1,
    d = {
      id: "D" + r.id.replace(/[^0-9A-Z]/g, "") + "-" + F.next++,
      r: r.id,
      tpl: tid,
      name: o.name || A.divName(r, tpl),
      men: Math.round(s.men * str),
      eq: {},
      org: s.org * (o.org != null ? o.org : 1),
      exp: o.exp != null ? o.exp : 0,
      loc,
      path: [],
      prog: 0,
      from: loc,
      army: null,
      atk: null,
      dig: 0,
      plan: 0,
      train: o.train || 0,
      born: A.S.year,
      wins: 0,
      losses: 0,
      kills: 0,
      cmd: null,
    };
  for (const k in s.eq) d.eq[k] = Math.round(s.eq[k] * (o.eqf != null ? o.eqf : str));
  F.divs.push(d);
  A.locDirty();
  return d;
};

A._idIdx = null;

A.divById = function (id) {
  if (!id) return null;
  if (!A._idIdx) {
    const m = new Map();
    for (const k in A.S.realms) {
      const r = A.S.realms[k];
      if (r.forces) for (const d of r.forces.divs) m.set(d.id, d);
    }
    A._idIdx = m;
  }
  return A._idIdx.get(id) || null;
};

A._locIdx = null;

A.locDirty = () => {
  A._locIdx = null;
  A._idIdx = null;
};

A.cacheReset = () => {
  A.locDirty();
  A._sup = {};
  A._supIn = {};
};

A.divsAtIdx = function (loc) {
  if (!A._locIdx) {
    const m = new Map();
    for (const id in A.S.realms) {
      const r = A.S.realms[id];
      if (!(!r.alive || !r.forces))
        for (const d of r.forces.divs) {
          let L = m.get(d.loc);
          if (!L) m.set(d.loc, (L = []));
          L.push(d);
        }
    }
    A._locIdx = m;
  }
  return A._locIdx.get(loc) || [];
};

A.divsOf = rid => {
  const r = A.realm(rid);
  return r && r.alive && r.forces ? r.forces.divs : [];
};

A.allDivs = function () {
  const out = [];
  for (const id in A.S.realms) {
    const r = A.S.realms[id];
    if (r.alive && r.forces) for (const d of r.forces.divs) out.push(d);
  }
  return out;
};

A.divS = d =>
  A.tplS(d.r, d.tpl) ||
  A.tplStats(
    {
      bns: ["SP"],
    },
    d.r,
  );

A.divStr = d => A.clamp(d.men / Math.max(1, A.divS(d).men), 0, 1.2);

A.divEqf = function (d) {
  const s = A.divS(d);
  let need = 0,
    have = 0;
  for (const k in s.eq) {
    const c = GD.EQ[k].cost;
    need += s.eq[k] * c;
    have += Math.min(s.eq[k], d.eq[k] || 0) * c;
  }
  return need ? have / need : 1;
};

A.divMaxOrg = function (d) {
  const s = A.divS(d),
    g = A.divGen(d),
    D = A.rdoc(A.realm(d.r)),
    lv = D.levyOrg && A.tplOf(d) && A.tplOf(d).bns.every(c => c === "LV" || c === "GA") ? D.levyOrg : 0,
    v =
      s.org * (0.75 + 0.25 * A.xpLevel(d.exp)[2] * 1.2) * (1 + (D.org || 0) + lv) +
      (g ? A.skill(g, "command") / 12 : 0),
    o = d.elite && GD.ORDERS[d.elite];
  return o ? v * (1.15 + (o.org || 0) + ((o.fx || {}).org || 0)) : v;
};

A.divGen = function (d) {
  const a = d.army ? A.army(d.army) : null,
    id = d.cmd || (a && a.gen);
  return id ? A.P(id) : null;
};

A.divCombat = function (d) {
  const s = A.divS(d),
    r = A.realm(d.r) || {},
    eqf = A.divEqf(d),
    xm = A.xpLevel(d.exp)[2],
    q = A.clamp(0.75 + 0.25 * (r.armyQ || 1), 0.85, 1.15),
    g = A.divGen(d),
    dc = g && A.doctrineOf ? A.doctrineOf(g) : null,
    eqm = 0.3 + 0.7 * Math.min(1, eqf),
    atkG = g ? 1 + A.skill(g, "tactics") / 400 + (A.perkOf ? A.perkOf(g, "tactics", "battle") : 0) : 1,
    defG = g ? 1 + A.skill(g, "command") / 450 : 1,
    D = A.rdoc(r),
    horse = s.main === "horse",
    bows = s.cats.missile >= s.n / 3,
    am =
      eqm * xm * q * atkG * (dc && dc.pow ? dc.pow : 1) * (1 + (s.fx.atkMul || 0)) * (1 + ((horse && D.horseAtk) || 0)),
    dm = eqm * xm * q * defG * (dc && dc.defPow ? dc.defPow : 1) * (1 + (D.def || 0)),
    softM = 1 + (D.soft || 0) + ((bows && D.bowSoft) || 0),
    c = {
      soft: s.soft * am * softM,
      hard: s.hard * am,
      def: s.def * dm,
      brk: s.brk * dm * (dc && dc.pow ? dc.pow : 1) * (1 + (D.brk || 0)),
      hp: s.hp * A.divStr(d),
      w: s.w,
      hd: s.hd,
      arm: s.arm,
      prc: s.prc,
      ac: s.ac,
      eqf,
      str: A.divStr(d),
      s,
    };
  if (d.dr) {
    const dr = d.dr;
    c.soft *= 1 + (dr.weapons || 0) * 0.14;
    c.hard *= 1 + (dr.weapons || 0) * 0.14;
    c.def *= 1 + (dr.formation || 0) * 0.12 + (dr.shields || 0) * 0.08;
  }
  const o = d.elite && GD.ORDERS[d.elite];
  if ((d.elite && ((c.soft *= 1.15), (c.hard *= 1.15), (c.def *= 1.15), (c.brk *= 1.15)), o)) {
    const fx = o.fx || {},
      P = A.S.prov[d.atk != null ? d.atk : d.loc],
      home = !!P && ((o.terr || []).includes(P.terr) || ((o.terr || []).includes("coast") && P.coast)),
      a = home ? 1.35 : 1;
    c.soft *= (1 + (fx.soft || 0)) * a;
    c.hard *= (1 + (fx.hard || 0)) * a;
    c.brk *= (1 + (fx.brk || 0)) * a;
    c.def *= (1 + (fx.def || 0)) * (home ? 1.25 : 1);
    c.home = home;
  }
  return c;
};

A.divPower = function (d) {
  const c = A.divCombat(d);
  return (c.soft + c.hard * 0.5) * 2 + c.def * 0.5 + c.brk * 0.5 + c.hp * 0.6 + d.org * 0.3;
};

A.divLose = function (d, k) {
  if (((k = Math.min(d.men, Math.max(0, Math.round(k)))), k <= 0)) return 0;
  const f = k / Math.max(1, d.men);
  d.men -= k;
  for (const e in d.eq) d.eq[e] = Math.max(0, Math.round(d.eq[e] * (1 - f * 0.85)));
  return k;
};

A.divReinforce = function (d, r, frac) {
  if (!d || !d.elite) return A.divRefill(d, r, frac);
  const e0 = d.exp,
    got = A.divRefill(d, r, frac * 0.08);
  d.exp = Math.max(d.exp, e0);
  return got;
};

A.divRefill = function (d, r, frac) {
  const s = A.divS(d),
    F = r.forces;
  let got = 0;
  const gap = Math.max(0, s.men - d.men);
  if (gap > 0 && r.levy > 0) {
    const add = Math.min(gap, Math.ceil(gap * frac * (1 + (s.fx.reinf || 0))), Math.floor(r.levy));
    if (add > 0) {
      const keep = 0.15 + (s.fx.keepExp || 0) * 0.5;
      d.exp = (d.exp * d.men + Math.min(d.exp, 10 + keep * d.exp) * add) / (d.men + add);
      d.men += add;
      r.levy -= add;
      got += add;
    }
  }
  const stock = r.ind ? r.ind.stock : null;
  if (stock)
    for (const k in s.eq) {
      const need = s.eq[k] - (d.eq[k] || 0);
      if (need <= 0) continue;
      const take = Math.min(need, Math.ceil(need * frac * (1 + (s.fx.reinf || 0))), Math.floor(stock[k] || 0));
      if (take > 0) {
        d.eq[k] = (d.eq[k] || 0) + take;
        stock[k] -= take;
      }
    }
  return got;
};

A.divRemove = function (d) {
  if (d && d.elite && !d._swap) {
    const r0 = A.realm(d.r);
    if (r0) {
      r0.orderGone = r0.orderGone || {};
      r0.orderGone[d.elite] = A.S.year;
      A.news(`${d.name} are destroyed. ${r0.short} mourns its finest.`, "battle");
    }
    const pc0 = A.pc();
    if (pc0 && pc0.order && pc0.order.id === d.elite)
      A.log("Your order is broken in the field. Few of your brothers walk away.", "bad");
  }
  const r = A.realm(d.r);
  if (!r || !r.forces) return;
  if (((r.forces.divs = r.forces.divs.filter(x => x !== d)), A.locDirty(), d.army)) {
    const a = A.army(d.army);
    if (a) a.divs = a.divs.filter(x => x !== d.id);
  }
  if (r.ind) for (const k in d.eq) r.ind.stock[k] = (r.ind.stock[k] || 0) + Math.round(d.eq[k] * 0.7);
  const pc = A.pc();
  if (pc && pc.mil && pc.mil.div === d.id) pc.mil.div = null;
};

A.forcesSync = function (r) {
  if (!r.forces) return;
  let t = 0;
  for (const d of r.forces.divs) t += d.men;
  r.army = Math.round(t);
  r._as = r.army;
};

A.forcesReconcile = function (r) {
  if (!r.forces) {
    A.F(r);
    return;
  }
  if (r._as == null) {
    A.forcesSync(r);
    return;
  }
  const delta = Math.round(r.army - r._as);
  if (Math.abs(delta) < 5) {
    A.forcesSync(r);
    return;
  }
  if (delta < 0) {
    let left = -delta;
    const tot = r.forces.divs.reduce((a, d) => a + d.men, 0) || 1;
    for (const d of r.forces.divs) {
      const k = Math.round((-delta * d.men) / tot);
      left -= A.divLose(d, Math.min(k, left));
    }
  } else {
    r.levy += delta;
    for (const d of r.forces.divs) A.divReinforce(d, r, 0.5);
  }
  A.forcesSync(r);
};

A.provSlots = function (P) {
  const r = A.realm(P.owner);
  return (
    2 +
    Math.floor((P.dev || 0) / 2) +
    (P.pop > 15e4 ? 1 : 0) +
    (P.pop > 4e5 ? 1 : 0) +
    (r && r.capitalProv === P.id ? 2 : 0) +
    (r && r.race === "dwarf" ? 2 : 0)
  );
};

A.provUsed = P => (P.civ || 0) + (P.mil || 0);

A.indInit = function (r) {
  const ps = A.realmProvs(r.id),
    raceMul =
      {
        dwarf: 2.2,
        elf: 0.8,
        giant: 0.4,
        orc: 0.7,
      }[r.race] || 1,
    pop = r.provPop || ps.reduce((a, p) => a + p.pop, 0) || 1,
    F = Math.max(2, Math.round(Math.sqrt(pop / 1e3) * 0.42 * raceMul)),
    milShare = A.clamp(0.22 + (r.army / pop) * 12, 0.2, 0.6);
  let mil = Math.max(1, Math.round(F * milShare)),
    civ = Math.max(1, F - mil);
  if (r.income / pop > 0.8) {
    const m = Math.round(mil * 0.3);
    mil -= m;
    civ += m;
  }
  const wt = ps.map(p => Math.pow(p.pop, 0.7) * (1 + (p.dev || 0) / 5)),
    place = (n, key) => {
      for (let i = 0; i < n; i++) {
        let best = -1,
          bv = -1;
        if (
          (ps.forEach((p, j) => {
            if (A.provUsed(p) >= A.provSlots(p)) return;
            const v = wt[j] / (1 + A.provUsed(p));
            if (v > bv) {
              bv = v;
              best = j;
            }
          }),
          best < 0)
        )
          break;
        ps[best][key] = (ps[best][key] || 0) + 1;
      }
    };
  if (!ps.some(p => p.civ || p.mil)) {
    place(mil, "mil");
    place(civ, "civ");
  }
  r.ind = {
    lines: [],
    stock: {},
    cq: [],
    law: "partial",
    mDone: 0,
    out: {},
    hist: [],
    civ0: Math.max(1, civ),
  };
  for (const k of GD.EQ_KEYS) r.ind.stock[k] = 0;
  A.indCount(r);
  if (!r.forces) A.F(r);
  const need = A.eqNeed(r);
  for (const k of GD.EQ_KEYS) r.ind.stock[k] = Math.round((need.full[k] || 0) * 0.25);
  A.indAutoLines(r, true);
};

A.indCount = function (r) {
  let civ = 0,
    mil = 0,
    ore = 0;
  for (const p of A.S.prov)
    if (p.owner === r.id) {
      if (!(p.occ && A.hostile(r.id, p.occ))) {
        civ += p.civ || 0;
        mil += p.mil || 0;
        if (p.terr === "mountains" || p.terr === "hills") ore += p.terr === "mountains" ? 2 : 1;
      }
    }
  if (r.race === "dwarf") ore += 6;
  if (r.pacts && r.pacts.trade) ore += Object.keys(r.pacts.trade).length * 2;
  r.ind.civ = civ;
  r.ind.mil = mil;
  r.ind.ore = ore;
  return r.ind;
};

A.eqNeed = function (r) {
  const full = {},
    short = {};
  for (const d of r.forces ? r.forces.divs : []) {
    const s = A.divS(d);
    for (const k in s.eq) {
      full[k] = (full[k] || 0) + s.eq[k];
      short[k] = (short[k] || 0) + Math.max(0, s.eq[k] - (d.eq[k] || 0));
    }
  }
  for (const q of r.forces ? r.forces.queue : []) {
    const s = A.tplS(r.id, q.tpl);
    if (s)
      for (const k in s.eq) {
        full[k] = (full[k] || 0) + s.eq[k];
        short[k] = (short[k] || 0) + s.eq[k];
      }
  }
  return {
    full,
    short,
  };
};

A.lineRate = function (r, L) {
  const E = GD.EQ[L.eq];
  if (!E) return 0;
  const law = GD.ECON[r.ind.law] || GD.ECON.partial;
  return (L.n * 1 * L.eff * law.out * (E.ore ? A.oreMul(r) : 1)) / E.cost;
};

A.oreMul = function (r) {
  const I = r.ind,
    need = I.lines.filter(L => GD.EQ[L.eq] && GD.EQ[L.eq].ore).reduce((a, L) => a + L.n, 0) * 0.5;
  return need <= 0 ? 1 : A.clamp(0.6 + (0.4 * I.ore) / need, 0.6, 1);
};

A.eqTarget = function (r, k, need) {
  need = need || A.eqNeed(r);
  return (need.short[k] || 0) + (need.full[k] || 0) * (A.atWar(r.id).length ? 0.6 : 0.35);
};

A.indAutoLines = function (r, fresh) {
  const I = r.ind,
    need = A.eqNeed(r),
    want = {};
  for (const k of GD.EQ_KEYS)
    want[k] = Math.max(0, A.eqTarget(r, k, need) + (need.full[k] || 0) * 0.08 - (I.stock[k] || 0)) * GD.EQ[k].cost;
  const tot = Object.values(want).reduce((a, b) => a + b, 0),
    mil = I.mil,
    old = {};
  for (const L of I.lines) old[L.eq] = L;
  if (mil <= 0) {
    I.lines = [];
    return;
  }
  const yearOut = 365 * 0.7 * (GD.ECON[I.law] || GD.ECON.partial).out,
    needF = Math.min(mil, Math.ceil(tot / yearOut)),
    alloc = {};
  let left = needF;
  const keys = GD.EQ_KEYS.filter(k => want[k] > 0).sort((a, b) => want[b] - want[a]);
  for (const k of keys) {
    const n = Math.floor((needF * want[k]) / Math.max(1, tot));
    alloc[k] = n;
    left -= n;
  }
  for (let i = 0; left > 0 && keys.length; i = (i + 1) % keys.length) {
    alloc[keys[i]]++;
    left--;
  }
  const trade = mil - keys.reduce((a, k) => a + (alloc[k] || 0), 0);
  I.lines = keys
    .filter(k => alloc[k] > 0)
    .map(k => ({
      eq: k,
      n: alloc[k],
      eff: old[k] ? old[k].eff : fresh ? 0.5 : 0.15,
    }));
  if (trade > 0)
    I.lines.push({
      eq: "trade",
      n: trade,
      eff: old.trade ? old.trade.eff : 0.5,
    });
};

A.indMonth = function (r) {
  const I = r.ind;
  if (!I) return;
  A.indCount(r);
  const law = GD.ECON[I.law] || GD.ECON.partial;
  let used = I.lines.reduce((a, L) => a + L.n, 0);
  for (; used > I.mil && I.lines.length; ) {
    const L = I.lines.slice().sort((a, b) => b.n - a.n)[0];
    L.n--;
    used--;
    if (L.n <= 0) I.lines = I.lines.filter(x => x !== L);
  }
  let work = 0,
    sold = 0;
  for (const L of I.lines) {
    if (L.eq === "trade") {
      const c = L.n * 30 * L.eff * 14;
      sold += c;
      L.eff = Math.min(0.92, L.eff + (0.92 - L.eff) * 0.09);
      continue;
    }
    const u = A.lineRate(r, L) * 30;
    I.stock[L.eq] = (I.stock[L.eq] || 0) + u;
    I.out[L.eq] = (I.out[L.eq] || 0) + u;
    work += L.n * L.eff * 30;
    L.eff = Math.min(0.92, L.eff + (0.92 - L.eff) * 0.09);
  }
  r.treasury += Math.round(sold - work * 9);
  I.sold = (I.sold || 0) + Math.round(sold);
  let pool = Math.floor(I.civ * (1 - law.cg));
  const stabMul = 0.6 + (0.4 * (r.stability || 50)) / 100;
  for (const q of I.cq) {
    if (pool <= 0) break;
    const n = Math.min(15, pool);
    pool -= n;
    q.prog += n * 30 * stabMul;
    q.civ = n;
    if (q.prog >= q.cost) q.done = true;
  }
  for (const q of I.cq.filter(x => x.done)) A.indFinish(r, q);
  if (((I.cq = I.cq.filter(x => !x.done)), (I.freeCiv = pool), A.atWar(r.id).length && I.mDone % 3 === 2)) {
    const pc = A.pc();
    if (!(pc && pc.ruler === r.id && !r.forces.auto)) A.indAutoLines(r);
  }
  if (((I.mDone = (I.mDone || 0) + 1), !A.atWar(r.id).length))
    for (const d of r.forces.divs) A.divReinforce(d, r, 0.25);
  if (A.atWar(r.id).length && !(A.myRealm && A.myRealm() === r && !r.forces.auto)) A.emergencyLevy(r);
  for (const d of r.forces.divs)
    if (d.train > 0) {
      d.train = Math.max(0, d.train - 30);
      d.exp = Math.min(Math.max(d.exp, 10), d.exp + 2.5);
    }
  A.queueStep(r, 30);
};

A.indFinish = function (r, q) {
  const P = A.S.prov[q.prov];
  if (!P || P.owner !== r.id) return;
  const B = GD.BUILD[q.k];
  if (q.k === "forge") P.mil = (P.mil || 0) + 1;
  else {
    if (q.k === "workshop") P.civ = (P.civ || 0) + 1;
    else {
      if (q.k === "walls") P.fort = Math.min(6, (P.fort || 0) + 1);
      else {
        if (q.k === "depot") P.depot = 1;
        else {
          if (q.k === "road") P.road = 1;
        }
      }
    }
  }
  if (q.k === "workshop") r.baseIncome = Math.round(r.baseIncome * (1 + 0.35 / Math.max(4, r.ind.civ0 + 3)));
  const pc = A.pc();
  if (pc && pc.ruler === r.id) A.log(`Built: ${B.name} in ${P.name}.`, "good");
};

A.indQueue = function (r, k, prov) {
  const B = GD.BUILD[k],
    P = A.S.prov[prov];
  if (!B || !P || P.owner !== r.id)
    return {
      ok: false,
      msg: "Not your province.",
    };
  if (B.slot && A.provUsed(P) + r.ind.cq.filter(q => q.prov === prov && GD.BUILD[q.k].slot).length >= A.provSlots(P))
    return {
      ok: false,
      msg: `${P.name} has no free building slots (${A.provSlots(P)}).`,
    };
  if (k === "depot" && (P.depot || r.ind.cq.some(q => q.prov === prov && q.k === "depot")))
    return {
      ok: false,
      msg: "There is already a depot.",
    };
  if (k === "road" && (P.road || r.ind.cq.some(q => q.prov === prov && q.k === "road")))
    return {
      ok: false,
      msg: "The road is already there.",
    };
  if (k === "walls" && (P.fort || 0) + r.ind.cq.filter(q => q.prov === prov && q.k === "walls").length >= 6)
    return {
      ok: false,
      msg: "The walls cannot rise higher.",
    };
  if (r.ind.cq.length >= 12)
    return {
      ok: false,
      msg: "The builders already have twelve projects.",
    };
  const cost = Math.round(B.cost * (k === "walls" ? 1 + (P.fort || 0) * 0.35 : 1));
  r.ind.cq.push({
    k,
    prov,
    prog: 0,
    cost,
  });
  return {
    ok: true,
    msg: `${B.name} queued in ${P.name}.`,
  };
};

A.queueStep = function (r, days) {
  const F = r.forces;
  for (const q of F.queue) {
    if (((q.left -= days), q.left > 0)) continue;
    const s = A.tplS(r.id, q.tpl);
    if (!s) {
      q.dead = true;
      continue;
    }
    const loc = r.capitalProv != null ? r.capitalProv : (A.realmProvs(r.id)[0] || {}).id;
    if (loc == null) {
      q.dead = true;
      continue;
    }
    const d = A.newDiv(r, q.tpl, loc, {
      str: 0,
      exp: 8,
      org: 0.6,
    });
    d.men = q.men;
    for (const k in s.eq) {
      const t = Math.min(s.eq[k], Math.floor(r.ind.stock[k] || 0));
      d.eq[k] = t;
      r.ind.stock[k] -= t;
    }
    d.exp = 10;
    q.dead = true;
    const pc = A.pc();
    // [X1 baked patch core/04-world-fixes WLD-DIV-ARTICLE] A division line wrote "The ${d.name}", and a far order is
    // often named "The ..." already: "The The Chain Keepers is cut off and destroyed at Shulai" (world review cycle 2,
    // B5). A.divThe(name) puts "The" before a name only when it has none.
    if (pc && pc.ruler === r.id)
      A.log(
        `${A.divThe ? A.divThe(d.name) : "The " + d.name} finishes training and joins the host (${A.fmt(d.men)} men).`,
        "good",
      );
  }
  F.queue = F.queue.filter(q => !q.dead);
  A.forcesSync(r);
};

A.trainDiv = function (r, tid) {
  {
    const t = r && r.forces && r.forces.tpl[tid];
    if (t && t.order)
      return {
        ok: false,
        msg: `${t.name} cannot be raised from the levy: it chooses its own members.`,
      };
  }
  const s = A.tplS(r.id, tid);
  if (!s)
    return {
      ok: false,
      msg: "No such template.",
    };
  if (r.forces.queue.length >= 8)
    return {
      ok: false,
      msg: "The drill yards are full (8 divisions in training).",
    };
  if (r.levy < s.men)
    return {
      ok: false,
      msg: `Not enough manpower: need ${A.fmt(s.men)}, have ${A.fmt(r.levy)}.`,
    };
  const cost = Math.round(s.men * 4 + s.cost * 6);
  if (r.treasury < cost)
    return {
      ok: false,
      msg: `Raising it costs ${A.coin(cost)}.`,
    };
  r.levy -= s.men;
  r.treasury -= cost;
  const days = Math.round(90 + s.n * 6 + (s.cats.horse + s.cats.beast) * 12);
  r.forces.queue.push({
    tpl: tid,
    men: s.men,
    left: days,
    days,
  });
  return {
    ok: true,
    msg: `${A.fmt(s.men)} men called up. They will be ready in about ${Math.round(days / 30)} months.`,
  };
};
