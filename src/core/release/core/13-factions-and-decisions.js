// The release's core, factions and decisions: Houses, factions, net worth, the decisions (A.DEC) and the progress year.
// Readable source of vendor/ardan-b593143.html with the patch layer baked in (X1, docs/DECISIONS.md D-027). Edit it here.
// Defines: A.polOnTransfer, A.pickCB, A.FACTIONS, A.houseStrength, A.realmHouses, A.factionsOf, A.factionPower,
// A.factionsYear, A.factionDemand, A.factionConcede, A.factionRevolt, A.canJoinFaction, A.joinFaction,
// A.leaveFaction, A.LEVY, A.setLaw, A.peaceTerms, A.peaceOdds, A.peaceOffer, A.aiOffers, A.aiDiploYear,
// A.queueAiOffer, A.CHOICE_FN (+), A.provsHeld, A.livingKids, A.grandkids, A.bestStyleRank, A.netWorth,
// A.realmsSeen, A.DEC, DEC, R, A.decisionsFor, A.decisionState, A.decide, A.bestSkillOf, A.markSeen, A.progYear,
// progYearNow; 22 decisions (DEC).

A.polOnTransfer = function (prov, from, to) {
  const rf = A.realm(from),
    rt = A.realm(to);
  if (rt) {
    A.polInit(rt);
    const claimed = rt.claims && rt.claims[prov.id],
      share = prov.pop / Math.max(1, rt.provPop || rt.pop || 1);
    rt.infamy = A.clamp(rt.infamy + (claimed ? 2 : 6 + Math.min(14, share * 60)), 0, 100);
    if (claimed) delete rt.claims[prov.id];
  }
  if (rf && rf.alive) {
    A.polInit(rf);
    rf.claims[prov.id] = A.S.year;
  }
  A.emit("provTransfer", prov, from, to);
};

A.pickCB = function (att, def) {
  if (A.claimsOn(att, def).length) return "reconquest";
  const a = A.realm(att),
    d = A.realm(def);
  return a &&
    d &&
    a.faith &&
    d.faith &&
    a.faith !== d.faith &&
    ["REL-01", "REL-02", "REL-07"].includes(a.faith) &&
    A.chance(0.3)
    ? "holy"
    : "conquest";
};

A.FACTIONS = {
  war: {
    name: "War Party",
    desc: "Wants a war: glory, land, plunder.",
    demand: "declare war",
  },
  peace: {
    name: "Peace Party",
    desc: "Wants the war ended, now.",
    demand: "make peace",
  },
  liberty: {
    name: "Liberty faction",
    desc: "Wants the crown's authority cut back.",
    demand: "lower crown authority",
  },
  claimant: {
    name: "Claimant's faction",
    desc: "Wants another on the throne.",
    demand: "abdicate for the claimant",
  },
  independence: {
    name: "Independence faction",
    desc: "Great lords who want to rule their own lands.",
    demand: "grant independence",
  },
};

A.houseStrength = function (h) {
  if (h.great === false) {
    const R3 = GD.NOBLE_RUNGS.find(x => x.code === h.rung);
    return R3 ? R3.levy * (h.kind === "gentry_mil" ? 2 : 1) + (h.military ? 200 : 0) : 30;
  }
  const lv = +h.levy || 0;
  if (lv) return lv;
  const R2 = GD.NOBLE_RUNGS.find(x => x.code === h.rung);
  return R2 ? R2.levy : 800;
};

A.realmHouses = rid =>
  Object.values(A.S.houses).filter(
    h =>
      h.realm === rid &&
      !h.extinct &&
      h.kind !== "royal" &&
      (h.great !== false || ["noble", "gentry_mil", "clan"].includes(h.kind)),
  );

A.factionsOf = rid => (A.S.factions || []).filter(f => f.realm === rid);

A.factionPower = function (f) {
  const r = A.realm(f.realm);
  if (!r) return 0;
  const all = A.realmHouses(f.realm).reduce((a, h) => a + A.houseStrength(h), 0) + (r.army * 0.25 + r.levy * 0.05);
  return (
    (f.members
      .map(id => A.S.houses[id])
      .filter(Boolean)
      .reduce((a, h) => a + A.houseStrength(h), 0) +
      (f.pc && A.pc() && A.pc().noble ? 200 : 0)) /
    Math.max(1, all)
  );
};

A.factionsYear = function (r) {
  const S = A.S;
  S.factions = S.factions || [];
  const pc = A.pc(),
    auth = (r.laws && r.laws.authority) != null ? r.laws.authority : 1,
    drift = A.AUTH[auth][2] / 4 + (r.laws && r.laws.levy != null ? A.LEVY[r.laws.levy][2] : 0),
    houses = A.realmHouses(r.id);
  for (const h of houses)
    h.op = A.clamp((h.op != null ? h.op : 50) + drift + A.ri(-2, 2) + (r.stability - 50) / 60, 0, 100);
  const atWar = A.atWar(r.id).length > 0,
    want = h => {
      const op = h.op != null ? h.op : 50,
        tr = (A.famData(h.id) || {}).traits || [];
      return atWar && r.exhaustion > 35 && op < 65
        ? "peace"
        : op < 22 && ["N01", "N02", "N03"].includes(h.rung) && h.great !== false
          ? "independence"
          : op < 35 && r.legit < 45
            ? "claimant"
            : op < 42 && auth >= 2
              ? "liberty"
              : !atWar &&
                  (h.military || tr.includes("ambitious") || tr.includes("wrathful") || tr.includes("brave")) &&
                  op > 30 &&
                  (A.AGGRO[r.id] || 1) >= 1 &&
                  A.chance(0.5)
                ? "war"
                : null;
    };
  for (const h of houses) {
    const cur = S.factions.find(f2 => f2.realm === r.id && f2.members.includes(h.id)),
      w = want(h);
    if (
      (cur && cur.kind !== w && A.chance(0.4) && (cur.members = cur.members.filter(x => x !== h.id)),
      !w || (cur && cur.kind === w) || (cur && cur.members.includes(h.id)) || !A.chance(0.35))
    )
      continue;
    let f = S.factions.find(x => x.realm === r.id && x.kind === w);
    if (!f) {
      f = {
        id: "F" + (S.nextFaction = (S.nextFaction || 0) + 1),
        realm: r.id,
        kind: w,
        members: [],
        leader: h.id,
        start: S.year,
        discontent: 0,
      };
      S.factions.push(f);
    }
    f.members.push(h.id);
  }
  for (const f of A.factionsOf(r.id).slice()) {
    if (
      ((f.members = f.members.filter(id => S.houses[id] && !S.houses[id].extinct)),
      (!f.members.length || (f.members.length < 2 && f.kind !== "independence" && S.year - f.start >= 3)) && !f.pc)
    ) {
      S.factions = S.factions.filter(x => x !== f);
      continue;
    }
    if ((f.members.includes(f.leader) || (f.leader = f.members[0]), f.kind === "peace" && !atWar)) {
      S.factions = S.factions.filter(x => x !== f);
      continue;
    }
    if (f.kind === "war" && atWar) {
      f.discontent = 0;
      continue;
    }
    f.power = A.factionPower(f);
    f.discontent = A.clamp((f.discontent || 0) + (f.power > 0.3 ? 12 : 4) - (r.stability > 70 ? 6 : 0), 0, 100);
    if (f.power >= 0.4 && f.discontent >= 60) A.factionDemand(r, f);
  }
};

A.factionDemand = function (r, f) {
  const S = A.S;
  f.discontent = 0;
  const F = A.FACTIONS[f.kind],
    lead = S.houses[f.leader],
    pc = A.pc();
  if (r.playerRun && pc && pc.ruler === r.id) {
    A.queue({
      type: "choice",
      title: `The ${F.name} makes demands`,
      text: `${lead ? lead.name : "The great lords"} and ${f.members.length - 1} other house${f.members.length === 2 ? "" : "s"} — about ${Math.round(f.power * 100)}% of the realm's swords — come to court with one demand: ${F.demand}. Refuse, and they may take up arms.`,
      options: [
        {
          t: `Give them what they want (${F.demand})`,
          fn: "facAccept",
          arg: f.id,
        },
        {
          t: "Buy them off with gold and titles",
          fn: "facBribe",
          arg: f.id,
        },
        {
          t: "Refuse",
          fn: "facRefuse",
          arg: f.id,
        },
      ],
    });
    return;
  }
  // [X1 baked patch diplomacy/20-ai-personality AIP-CLAIMANTS] Would-be rulers have tempers too: in AI-started
  // succession wars (a contested succession, a tottering crown) the claimant presses or kneels by his traits
  // (A.aiPressClaim); a refused faction rises or backs down by its leader's traits (A.aiRevolt), and the ruler
  // yields or refuses by pride and caution (A.aiFactionAnswer). Event-driven civil wars are untouched. A coalition
  // is led by its strongest hawk.
  if (A.aiFactionAnswer(r, f)) A.factionConcede(r, f);
  else {
    if (A.aiRevolt(r, f)) A.factionRevolt(r, f);
  }
};

A.factionConcede = function (r, f) {
  const S = A.S,
    F = A.FACTIONS[f.kind];
  // [X1 baked patch core/04-world-fixes WLD-FACTION-WAR-CHECKS] When a crown yielded to a war faction, it declared
  // war while skipping the checks every other declaration runs: truces, defensive treaties, being already hostile,
  // and the cap of 4 wars at once. Those checks now apply; with no lawful target, no war.
  if (f.kind === "war") {
    const tgts = A.neighbors(r.id)
      .map(A.realm)
      .filter(
        o =>
          o &&
          o.alive &&
          !o.isRebel &&
          !A.hasNap(r.id, o.id) &&
          !r.allies.includes(o.id) &&
          o.overlord !== r.id &&
          r.overlord !== o.id &&
          !(r.truce && r.truce[o.id] > S.year) &&
          !A.hasTr(r.id, o.id, "def") &&
          !A.hostile(r.id, o.id),
      );
    if (tgts.length && S.wars.filter(w => w.cb !== "throne").length < 4) {
      const t = tgts.sort((a, b) => A.relBetween(r.id, a.id) - A.relBetween(r.id, b.id))[0];
      A.startWar(r.id, t.id, null, A.pickCB(r.id, t.id));
    }
  }
  if (f.kind === "peace") {
    const w = A.atWar(r.id)[0];
    if (w) A.settleWar(w, "white");
  }
  if (
    (f.kind === "liberty" &&
      ((r.laws.authority = Math.max(0, (r.laws.authority || 1) - 1)), (r.stability = A.clamp(r.stability + 5, 0, 100))),
    f.kind === "claimant")
  ) {
    const lead = S.houses[f.leader],
      cl = lead ? A.houseHead(lead.id) : null;
    if (cl && cl.alive && !cl.ruler) {
      A.news(`Under the claimant faction's pressure, the ruler of ${r.short} steps down.`, "crown");
      const old = A.P(r.ruler);
      if (old) old.ruler = null;
      A.makeRuler(cl, r.id);
      r.legit = 40;
    }
  }
  if (f.kind === "independence") {
    A.factionRevolt(r, f, true);
    return;
  }
  for (const id of f.members) if (S.houses[id]) S.houses[id].op = A.clamp((S.houses[id].op || 40) + 20, 0, 100);
  A.news(`${r.short}: the crown yields to the ${F.name} (${F.demand}).`, "crown");
  S.factions = S.factions.filter(x => x !== f);
};

A.factionRevolt = function (r, f, peaceful) {
  const S = A.S,
    F = A.FACTIONS[f.kind],
    lead = S.houses[f.leader],
    head = lead ? A.houseHead(lead.id) : null;
  if (!head) {
    S.factions = S.factions.filter(x => x !== f);
    return;
  }
  if (f.kind === "claimant") {
    A.successionWar(r, head);
    S.factions = S.factions.filter(x => x !== f);
    return;
  }
  const seats = new Set(
      f.members
        .map(id => S.houses[id])
        .filter(Boolean)
        .map(h => h.seat),
    ),
    provs = A.realmProvs(r.id).filter(p => seats.has(p.name) && p.id !== r.capitalProv);
  // [X1 baked patch core/04-world-fixes WLD-STABILITY-FLOOR] Five places lowered realm stability with no floor
  // (capital lost -15, a coup -15, bankruptcy -4, empty treasury -6, a raging faction -10), so readers inside the
  // year (prices, industry, factions) could see negative stability.
  if (!provs.length) {
    r.stability = Math.max(0, r.stability - 10);
    A.news(`${r.short}: the ${F.name} rages but has no castles to hold. The crown shrugs.`, "crown");
    S.factions = S.factions.filter(x => x !== f);
    return;
  }
  const nr = A.createRealm({
    name: lead.name.replace(/^the /i, "").replace(/^House /, "") + " League",
    short: lead.name.replace(/^House /, "").replace(/^the /i, ""),
    title: "Lord",
    race: r.race,
    cult: r.cult,
    faith: r.faith,
    color: A.pick(A.COLORS_EXTRA),
    army: Math.round(f.members.reduce((a, id) => a + A.houseStrength(S.houses[id] || {}), 0) * 0.6 + 500),
    levy: Math.round(r.levy * 0.1),
    armyQ: r.armyQ,
    income: Math.round((r.income * provs.length) / Math.max(1, A.realmProvs(r.id).length)),
    stability: 50,
    legit: 30,
    treasury: 2e3,
    comp: r.comp,
  });
  nr.isRebel = !peaceful;
  nr.parent = r.id;
  nr.ruler = head.id;
  nr.house = lead.id;
  // [X1 baked patch core/09-engine-at-scale SCALE-LAND-WRITES] A.realmProvs and A.neighbors scanned every province
  // on every call (A.politicsYear asks them for every pair of realms, so a year cost realms² × provinces).
  // 09-engine-at-scale answers them from an index of provinces by owner, which must be dropped the moment a province
  // changes hands. These are all the places that write a province's owner directly: transferProv, the claimant
  // settlements in settleWar, a claimant taking land in a succession war, a player founding a realm, a faction
  // breaking away, and Tessaria's split at the start. Each now bumps the land version.
  for (const p of provs) {
    p.owner = nr.id;
    if (A.scaleLand) A.scaleLand();
  }
  nr.capitalProv = provs[0].id;
  nr.capital = provs[0].name;
  A.makeRuler(head, nr.id, true);
  A.polInit(nr);
  A.updateRealmPops();
  if (peaceful) {
    A.news(`${r.name} grants independence: ${nr.name} is born from its lands.`, "crown");
    nr.isNew = true;
  } else {
    A.startWar(nr.id, r.id, `The ${F.name}'s Revolt in ${r.short.replace(/^the /i, "")}`, "liberty", {
      noAllies: true,
    });
    A.news(`${A.fullName(head, false)} raises the banners of the ${F.name}. ${r.short} is at war with itself!`, "war");
  }
  S.factions = S.factions.filter(x => x !== f);
};

Object.assign(A.CHOICE_FN || (A.CHOICE_FN = {}), {
  callJoin(o) {
    const w = A.S.wars.find(x => x.id === o.w);
    if (!w) {
      A.log("The war is already over.");
      return;
    }
    if (!w.att.includes(o.r) && !w.def.includes(o.r)) w[o.side].push(o.r);
    const r = A.realm(o.r);
    if (r) r.legit = Math.min(100, r.legit + 3);
    A.log(`You honor your oath. ${A.realmShort(o.r)} marches in ${w.name}.`, "war");
    A.news(`${A.realmName(o.r)} honors its alliance and joins ${w.name}.`, "war");
  },
  callRefuse(o) {
    A.unally(o.r, o.ally);
    A.addRel(o.r, o.ally, -30);
    const r = A.realm(o.r);
    if (r) {
      r.legit = Math.max(0, r.legit - 8);
      for (const x of Object.values(A.S.realms))
        if (x.alive && x.id !== r.id && x.allies.length) A.addRel(x.id, r.id, -4);
    }
    A.log(
      `You refuse the call. The alliance with ${A.realmShort(o.ally)} is broken, and every court calls you faithless.`,
      "bad",
    );
  },
  facAccept(fid) {
    const f = (A.S.factions || []).find(x => x.id === fid),
      r = f && A.realm(f.realm);
    if (f && r) A.factionConcede(r, f);
  },
  facBribe(fid) {
    const f = (A.S.factions || []).find(x => x.id === fid),
      r = f && A.realm(f.realm);
    if (!f || !r) return;
    const c = Math.round(r.income * 0.12 + 2e3);
    if (r.treasury >= c) {
      r.treasury -= c;
      for (const id of f.members)
        if (A.S.houses[id]) A.S.houses[id].op = A.clamp((A.S.houses[id].op || 40) + 15, 0, 100);
      f.discontent = 0;
      A.log(
        `You spend ${A.fmt(c)} on gifts, offices and a feast. The ${A.FACTIONS[f.kind].name} goes quiet — for now.`,
        "warn",
      );
    } else {
      A.log("You cannot afford their price. They take your silence as a refusal.", "bad");
      A.factionRevolt(r, f);
    }
  },
  facRefuse(fid) {
    const f = (A.S.factions || []).find(x => x.id === fid),
      r = f && A.realm(f.realm);
    if (!(!f || !r))
      if (A.chance(0.35 - f.power / 3)) {
        A.log(`You refuse. The ${A.FACTIONS[f.kind].name} blusters, counts its swords, and backs down.`, "good");
        r.legit = Math.min(100, r.legit + 5);
        f.discontent = 0;
        for (const id of f.members) if (A.S.houses[id]) A.S.houses[id].op = Math.max(0, (A.S.houses[id].op || 40) - 10);
      } else A.factionRevolt(r, f);
  },
});

A.canJoinFaction = function (pc, f) {
  return !pc || pc.ruler || f.realm !== pc.realm
    ? [false, "Not your realm."]
    : !pc.house && !(pc.noble && pc.noble.rung >= 2) && !(pc.job && pc.job.c === "courtier" && pc.job.r >= 2)
      ? [false, "Only lords, knights and courtiers have a voice in factions."]
      : pc.faction === f.id
        ? [false, "Already a member."]
        : [true, ""];
};

A.joinFaction = function (fid) {
  const pc = A.pc(),
    f = (A.S.factions || []).find(x => x.id === fid);
  if (!f)
    return {
      ok: false,
      msg: "Gone.",
    };
  const [ok, why] = A.canJoinFaction(pc, f);
  if (!ok)
    return {
      ok: false,
      msg: why,
    };
  pc.faction = f.id;
  f.pc = true;
  if (pc.house && A.S.houses[pc.house] && !f.members.includes(pc.house) && (A.famHead, true)) f.members.push(pc.house);
  f.discontent = Math.min(100, (f.discontent || 0) + 8);
  const r = A.realm(pc.realm),
    ru = r && A.P(r.ruler);
  if (ru) A.addOp(ru, pc, -10);
  A.log(`You join the ${A.FACTIONS[f.kind].name}. The crown will remember.`, "warn");
  return {
    ok: true,
    msg: "You are in.",
  };
};

A.leaveFaction = function () {
  const pc = A.pc(),
    f = (A.S.factions || []).find(x => x.id === pc.faction);
  if (f) {
    f.pc = false;
    if (pc.house && !A.S.houses[pc.house].great) f.members = f.members.filter(x => x !== pc.house);
  }
  pc.faction = null;
  return {
    ok: true,
    msg: "You leave the faction.",
  };
};

A.LEVY = [
  ["Light levies", 0.75, 1, "Fewer men called up. The lords like you for it."],
  ["Customary levies", 1, 0, "What the old charters allow."],
  ["Heavy levies", 1.3, -2, "Every hall sends more spears. The lords grumble every year."],
];

A.setLaw = function (k, v) {
  const r = A.myRealm();
  if (!r)
    return {
      ok: false,
    };
  if ((A.polInit(r), (v = +v), A.S.yearActs["law_" + k]))
    return {
      ok: false,
      msg: "One change to that law a year.",
    };
  if (k === "authority") {
    const cur = r.laws.authority;
    if (v === cur || v < 0 || v > 3)
      return {
        ok: false,
      };
    if (Math.abs(v - cur) > 1)
      return {
        ok: false,
        msg: "One step at a time.",
      };
    if (v > cur) {
      if (r.stability < 40)
        return {
          ok: false,
          msg: "The realm is too unstable (need stability 40).",
        };
      if (r.legit < 50)
        return {
          ok: false,
          msg: "Your claim is too weak (need legitimacy 50).",
        };
      r.legit -= 10;
      for (const h of A.realmHouses(r.id)) h.op = A.clamp((h.op != null ? h.op : 50) - 15, 0, 100);
      A.log(`You raise crown authority to ${A.AUTH[v][0]}. The great lords bow, and remember.`, "warn");
    } else {
      for (const h of A.realmHouses(r.id)) h.op = A.clamp((h.op != null ? h.op : 50) + 10, 0, 100);
      r.legit -= 3;
      A.log(`You lower crown authority to ${A.AUTH[v][0]}. The lords toast your wisdom.`, "good");
    }
    r.laws.authority = v;
    A.S.yearActs["law_" + k] = 1;
    A.updateRealmPops();
    return {
      ok: true,
    };
  }
  if (k === "levy") {
    const cur = r.laws.levy;
    return v === cur || v < 0 || v > 2
      ? {
          ok: false,
        }
      : ((r.levy = Math.round((r.levy * A.LEVY[v][1]) / A.LEVY[cur][1])),
        (r.laws.levy = v),
        (A.S.yearActs["law_" + k] = 1),
        A.log(`New levy law: ${A.LEVY[v][0]}. The muster rolls now count ${A.fmt(r.levy)}.`),
        {
          ok: true,
        });
  }
  return {
    ok: false,
  };
};

A.peaceTerms = function (w, rid) {
  const S = A.S,
    side = A.warSide(w, rid);
  if (!side) return null;
  const my = side === "att" ? w.att : w.def,
    them = side === "att" ? w.def : w.att,
    eid = side === "att" ? w.leadD : w.leadA,
    e = A.realm(eid),
    r = A.realm(rid);
  if (!e || !r) return null;
  const sc = side === "att" ? w.score : -w.score,
    ePop = S.prov.filter(p => them.includes(p.owner)).reduce((a, p) => a + p.pop, 0) || 1,
    myPop = S.prov.filter(p => my.includes(p.owner)).reduce((a, p) => a + p.pop, 0) || 1,
    out = [];
  for (const p of S.prov)
    if (them.includes(p.owner) && my.includes(p.occ)) {
      const cap = A.realm(p.owner) && A.realm(p.owner).capitalProv === p.id;
      out.push({
        k: "take:" + p.id,
        grp: "Land you hold",
        name: `Take ${p.name}`,
        sub: `${A.realmShort(p.owner)} · ${A.fmt(p.pop)} people${cap ? " · their capital" : ""}${r.claims && r.claims[p.id] ? " · your claim" : ""}`,
        cost: Math.round(6 + (70 * p.pop) / ePop + (cap ? 15 : 0) - (r.claims && r.claims[p.id] ? 4 : 0)),
      });
    }
  const g1 = Math.round(Math.max(800, (e.treasury > 0 ? e.treasury * 0.25 : 0) + e.income * 0.1));
  out.push({
    k: "gold",
    grp: "Gold and honor",
    name: `Reparations: ${A.fmt(g1)} suns`,
    sub: "Paid from their treasury.",
    cost: 14,
    gold: g1,
  });
  out.push({
    k: "gold2",
    grp: "Gold and honor",
    name: `Crushing reparations: ${A.fmt(g1 * 2.5)} suns`,
    sub: "They will borrow to pay it, and hate you for years.",
    cost: 30,
    gold: Math.round(g1 * 2.5),
  });
  if (!e.overlord && r.overlord !== e.id)
    out.push({
      k: "trib",
      grp: "Gold and honor",
      name: "They become your tributary",
      sub: "8% of their income every year until they break free.",
      cost: 42,
    });
  if (e.allies.filter(x => A.realm(x) && A.realm(x).alive && x !== rid).length)
    out.push({
      k: "unally",
      grp: "Gold and honor",
      name: "They renounce their alliances",
      sub: e.allies
        .filter(x => A.realm(x))
        .map(A.realmShort)
        .join(", "),
      cost: 16,
    });
  out.push({
    k: "humble",
    grp: "Gold and honor",
    name: "A public submission",
    sub: "Their ruler kneels to yours. Legitimacy +8 for you, −8 for them.",
    cost: 10,
  });
  for (const p of S.prov)
    if (my.includes(p.owner) && them.includes(p.occ))
      out.push({
        k: "cede:" + p.id,
        grp: "What you give",
        name: `Cede ${p.name}`,
        sub: `They hold it already · ${A.fmt(p.pop)} people`,
        cost: -Math.round(6 + (70 * p.pop) / myPop),
      });
  const pay = Math.round(Math.max(600, r.income * 0.12));
  out.push({
    k: "pay",
    grp: "What you give",
    name: `Pay them ${A.fmt(pay)} suns`,
    sub: "Silver to end it.",
    cost: -14,
    gold: pay,
  });
  // [X1 baked patch diplomacy/20-ai-personality AIP-PEACE] A.checkPeace: the loser gives in sooner if cautious,
  // later if proud or wrathful (A.aiYield); white peace comes sooner between calm, kind, cautious rulers
  // (A.aiWhite). A.peaceTerms adds the enemy ruler's temper to their willingness. Every settlement is logged.
  const will =
    sc * 1.3 +
    18 +
    (e.exhaustion || 0) * 0.35 -
    (r.exhaustion || 0) * 0.15 +
    (A.atWar(eid).length > 1 ? 10 : 0) +
    A.aiPeaceWill(eid);
  return {
    w,
    side,
    my,
    them,
    eid,
    e,
    r,
    sc,
    terms: out,
    will,
  };
};

// [X1 baked patch core/04-world-fixes WLD-REPARATIONS-EXCLUSIVE] "Reparations" and "Crushing reparations" could
// both be ticked and were both paid: 3.5x gold for cost 44 beat the crushing option alone (2.5x for 30). They are
// now one choice: the engine keeps only the crushing one if both arrive, and ticking one unticks the other.
A.peaceOdds = function (T, picks) {
  if (picks.includes("gold2")) picks = picks.filter(k => k !== "gold");
  const cost = T.terms.filter(t => picks.includes(t.k)).reduce((a, t) => a + t.cost, 0),
    p = cost <= 0 ? 0.9 + Math.min(0.08, -cost / 200) : A.clamp(0.55 + (T.will - cost) / 45, 0.02, 0.95);
  return {
    cost,
    p: Math.round(p * 100),
  };
};

A.peaceOffer = function (wid, picks) {
  const pc = A.pc(),
    rid = pc && pc.ruler,
    w = A.S.wars.find(x => x.id === wid);
  if (!w || !rid)
    return {
      ok: false,
      msg: "There is no such war.",
    };
  if (!(w.leadA === rid || w.leadD === rid))
    return {
      ok: false,
      msg: "Only the leader of your side can make peace.",
    };
  const T = A.peaceTerms(w, rid);
  if (A.S.yearActs["peace_" + wid] >= 2)
    return {
      ok: false,
      msg: "They have heard two offers this year. They will not hear a third.",
    };
  A.S.yearActs["peace_" + wid] = (A.S.yearActs["peace_" + wid] || 0) + 1;
  // [X1 baked patch core/04-world-fixes WLD-REPARATIONS-EXCLUSIVE] "Reparations" and "Crushing reparations" could
  // both be ticked and were both paid: 3.5x gold for cost 44 beat the crushing option alone (2.5x for 30). They are
  // now one choice: the engine keeps only the crushing one if both arrive, and ticking one unticks the other.
  if (picks.includes("gold2")) picks = picks.filter(k => k !== "gold");
  const { cost, p } = A.peaceOdds(T, picks);
  if (!A.chance(p / 100)) {
    A.addRel(rid, T.eid, -4);
    return {
      ok: false,
      msg: `${A.realmShort(T.eid)} refuses your terms (${p}% chance). The war goes on.`,
    };
  }
  const r = T.r,
    e = T.e,
    got = [];
  for (const t of T.terms.filter(x => picks.includes(x.k)))
    if (t.k.startsWith("take:")) {
      const pr = A.prov(+t.k.slice(5));
      if (pr && T.them.includes(pr.owner)) {
        A.transferProv(pr, rid, true);
        got.push(pr.name);
      }
    } else if (t.k.startsWith("cede:")) {
      const pr = A.prov(+t.k.slice(5));
      if (pr && pr.owner === rid) {
        A.transferProv(pr, pr.occ && T.them.includes(pr.occ) ? pr.occ : T.eid, true);
        got.push("ceded " + pr.name);
      }
    } else if (t.k === "gold" || t.k === "gold2") {
      e.treasury -= t.gold;
      r.treasury += t.gold;
      if (e.treasury < 0) {
        e.debt += -e.treasury;
        e.treasury = 0;
      }
      got.push(A.fmt(t.gold) + " suns");
    } else if (t.k === "pay") {
      r.treasury -= t.gold;
      e.treasury += t.gold;
      got.push("paid " + A.fmt(t.gold));
    } else if (t.k === "trib") {
      e.overlord = rid;
      A.unally(rid, e.id);
      got.push("tribute");
    } else if (t.k === "unally") {
      for (const x of e.allies.slice()) if (x !== rid) A.unally(e.id, x);
      got.push("their alliances broken");
    } else if (t.k === "humble") {
      r.legit = Math.min(100, r.legit + 8);
      e.legit = Math.max(0, e.legit - 8);
      got.push("submission");
    }
  const res = cost > 0 ? T.side : cost < 0 ? (T.side === "att" ? "def" : "att") : "white";
  A.endWar(w, res, `${w.name} ends at the table: ${got.length ? got.join(", ") : "nothing changes hands"}.`);
  A.updateRealmPops();
  if (cost > 30) A.addRel(rid, T.eid, -25);
  return {
    ok: true,
    msg: `Peace! ${got.join(", ") || "White peace."}`,
  };
};

A.aiOffers = function (pc) {
  const r = A.realm(pc.ruler);
  if (!r || !r.alive) return [];
  A.polInit(r);
  const S = A.S,
    pr = A.realmPower(r),
    nbs = A.neighbors(r.id),
    out = [],
    kids = pc.children.map(A.P).filter(k => k && k.alive && !k.spouse && A.isAdult(k));
  for (const o of Object.values(S.realms)) {
    if (!o.alive || o.isRebel || o.id === r.id || o.playerRun) continue;
    A.polInit(o);
    const rel = A.relBetween(r.id, o.id),
      po = A.realmPower(o);
    if (A.hostile(r.id, o.id)) continue;
    const foes = Object.values(S.realms).filter(
      x =>
        x.alive && x.id !== r.id && x.id !== o.id && A.relBetween(r.id, x.id) < -30 && A.relBetween(o.id, x.id) < -30,
    );
    if (
      ((rel >= 35 || (rel >= 10 && foes.length)) &&
        !r.allies.includes(o.id) &&
        r.allies.length < 4 &&
        o.allies.length < 3 &&
        out.push({
          w: 3,
          kind: "ally",
          rid: o.id,
          foe: foes.length ? foes[0].id : null,
        }),
      nbs.includes(o.id) &&
        rel > -40 &&
        rel < 40 &&
        !A.hasNap(r.id, o.id) &&
        !r.allies.includes(o.id) &&
        out.push({
          w: po < pr ? 2 : 1,
          kind: "nap",
          rid: o.id,
        }),
      rel >= 20 && foes.length && !A.atWar(o.id).length && !A.atWar(r.id).length)
    ) {
      const f = foes.find(x => A.neighbors(r.id).includes(x.id) || A.neighbors(o.id).includes(x.id));
      if (f)
        out.push({
          w: 1.2,
          kind: "jointwar",
          rid: o.id,
          foe: f.id,
        });
    }
    const cl = A.claimsOn(o.id, r.id);
    // [X1 baked patch diplomacy/20-ai-personality AIP-TRIBUTE] Tribute and greed: a tributary defies its overlord by
    // pride (A.aiDefy) and the overlord marches by wrath (A.aiPunish, rolled only when a war is possible); a greedy
    // victor makes the loser a tributary more often (A.aiExact); greedy rulers demand tribute of the player
    // (A.aiGreedW); the player's own tribute demand is weighed by the target ruler's pride and caution, and their
    // wrath decides whether a refusal means war.
    if (
      (cl.length &&
        rel < 30 &&
        po > pr * 0.8 &&
        out.push({
          w: 1.5,
          kind: "claimdemand",
          rid: o.id,
          prov: cl[0].id,
        }),
      rel > 15 &&
        !A.hasTrade(r.id, o.id) &&
        out.push({
          w: 2,
          kind: "trade",
          rid: o.id,
        }),
      kids.length &&
        rel > 0 &&
        A.P(o.ruler) &&
        !(r.marriages && r.marriages[o.id]) &&
        out.push({
          w: 1.4,
          kind: "marry",
          rid: o.id,
          pid: kids[0].id,
        }),
      nbs.includes(o.id) &&
        po > pr * 2.4 &&
        rel < 10 &&
        A.aiGreedW(o.id) >= 1 &&
        !r.overlord &&
        !o.overlord &&
        out.push({
          w: 1.6,
          kind: "tribute",
          rid: o.id,
        }),
      A.atWar(o.id).length &&
        rel >= 35 &&
        !r.allies.includes(o.id) &&
        out.push({
          w: 1,
          kind: "aid",
          rid: o.id,
        }),
      nbs.includes(o.id) && rel > 0 && o.treasury > 15e3)
    ) {
      const bp = A.realmProvs(r.id)
        .filter(p => p.id !== r.capitalProv && p.adj.some(j => A.S.prov[j].owner === o.id))
        .sort((a, b) => a.pop - b.pop)[0];
      if (bp && A.realmProvs(r.id).length > 3)
        out.push({
          w: 0.6,
          kind: "buy",
          rid: o.id,
          prov: bp.id,
        });
    }
  }
  for (const t of Object.values(S.realms))
    if (
      !(
        !t.alive ||
        t.id === r.id ||
        (t.infamy || 0) < 40 ||
        r.allies.includes(t.id) ||
        A.relBetween(r.id, t.id) < -60
      ) &&
      (A.neighbors(t.id).includes(r.id) || A.neighbors(r.id).some(n => A.neighbors(t.id).includes(n)))
    ) {
      const inv = Object.values(S.realms).find(
        x => x.alive && x.id !== r.id && x.id !== t.id && !x.playerRun && A.relBetween(x.id, t.id) < 0,
      );
      if (inv)
        out.push({
          w: 2,
          kind: "coalition",
          rid: inv.id,
          foe: t.id,
        });
    }
  for (const w of A.atWar(r.id)) {
    if (w.leadA !== r.id && w.leadD !== r.id) continue;
    const side = A.warSide(w, r.id),
      sc = side === "att" ? w.score : -w.score,
      eid = side === "att" ? w.leadD : w.leadA,
      e = A.realm(eid);
    if (!(!e || e.playerRun)) {
      if (sc >= 30 || (e.exhaustion > 60 && sc >= 10))
        out.push({
          w: 4,
          kind: "sue",
          rid: eid,
          war: w.id,
        });
      else {
        if (sc <= -35)
          out.push({
            w: 4,
            kind: "demand",
            rid: eid,
            war: w.id,
          });
        else {
          if ((e.exhaustion > 55 && r.exhaustion > 40) || S.year - w.start >= 4)
            out.push({
              w: 2,
              kind: "whitepeace",
              rid: eid,
              war: w.id,
            });
        }
      }
    }
  }
  return out;
};

A.aiDiploYear = function () {
  const pc = A.pc();
  if (!pc || !pc.alive || !pc.ruler) return;
  const r = A.realm(pc.ruler);
  if (!r || !r.playerRun) return;
  r.offerSeen = r.offerSeen || {};
  const pool = A.aiOffers(pc).filter(
    o =>
      ["sue", "demand", "whitepeace"].includes(o.kind) ||
      !(r.offerSeen[o.kind + o.rid] && A.S.year - r.offerSeen[o.kind + o.rid] < 5),
  );
  if (!pool.length) return;
  let n = A.chance(0.7) ? 1 : 0;
  if (A.chance(0.3)) n++;
  if (pool.some(x => ["sue", "demand"].includes(x.kind))) n = Math.max(n, 1);
  const used = new Set();
  for (let i = 0; i < n; i++) {
    const o = A.wpick(
      pool.filter(x => !used.has(x.rid)),
      x => x.w,
    );
    if (!o) break;
    used.add(o.rid);
    r.offerSeen[o.kind + o.rid] = A.S.year;
    A.queueAiOffer(pc, r, o);
  }
};

A.queueAiOffer = function (pc, r, o) {
  const t = A.realm(o.rid);
  if (!t) return;
  const ru = A.P(t.ruler),
    who = ru ? A.rulerStyle(ru, t) : `The ruler of ${t.short}`;
  if (o.kind === "defpact" || o.kind === "access") {
    const Q2 = (title, text, yes, no) =>
      A.queue({
        type: "choice",
        title,
        text: `${text} (Opinion ${A.relBetween(r.id, t.id)}.)`,
        options: [
          {
            t: yes,
            fn: "aiYes",
            arg: o,
          },
          {
            t: no,
            fn: "aiNo",
            arg: o,
          },
        ],
      });
    return o.kind === "defpact"
      ? Q2(
          `${t.short} proposes a defensive pact`,
          `${who} fears ${o.foe ? A.realmShort(o.foe) : "the same enemies you do"}. A defensive pact: if either is attacked, the other marches. No obligation in wars you start.`,
          "Sign the pact",
          "Decline",
        )
      : Q2(
          `${t.short} asks for military access`,
          `${who} is at war and asks that its armies may cross your land. Your neighbors at war with them will not like it.`,
          "Grant access",
          "Refuse",
        );
  }
  const rel = A.relBetween(r.id, t.id),
    Q = (title, text, yes, no, extra) =>
      A.queue({
        type: "choice",
        title,
        text: `${text} (Relations ${rel > 0 ? "+" : ""}${rel}.)`,
        options: [
          {
            t: yes,
            fn: "aiYes",
            arg: o,
          },
        ]
          .concat(extra || [])
          .concat([
            {
              t: no,
              fn: "aiNo",
              arg: o,
            },
          ]),
      });
  switch (o.kind) {
    case "ally":
      Q(
        `An offer of alliance from ${t.short}`,
        `${who} proposes an alliance: each to come to the other's aid when attacked.${o.foe ? ` "We share an enemy in ${A.realmShort(o.foe)}," the envoy says.` : ""} ${t.name} has ${t.allies.length} other all${t.allies.length === 1 ? "y" : "ies"} and an army of ${A.fmt(t.army)}.`,
        "Swear the alliance",
        "Decline politely",
      );
      break;
    case "jointwar": {
      const f = A.realm(o.foe);
      if (!f) return;
      Q(
        `${t.short} proposes a war`,
        `${who} proposes that you strike ${f.name} together, this spring. ${t.short} will march with you; the spoils will be shared. ${f.name} has an army of ${A.fmt(f.army)}.`,
        `War on ${f.short}, side by side`,
        "Not this year",
      );
      break;
    }
    case "claimdemand": {
      const p = A.prov(o.prov);
      if (!p) return;
      Q(
        `${t.short} demands ${p.name}`,
        `${who} says ${p.name} was stolen from ${t.short} and must be returned. Their heralds have the old charters. Refuse, and they may take it back by the sword.`,
        `Return ${p.name}`,
        "Refuse",
      );
      break;
    }
    case "coalition": {
      const f = A.realm(o.foe);
      if (!f) return;
      Q(
        `A league against ${f.short}`,
        `${who} writes: ${f.name} has swallowed too much land (infamy ${Math.round(f.infamy)}). The neighbors are forming a league. If ${f.short} attacks one, all will march. Will ${r.short} join?`,
        "Join the league",
        "Stay out of it",
      );
      break;
    }
    case "nap":
      Q(
        `${t.short} proposes a pact`,
        `Envoys from ${t.name} come with a ten-year pact of non-aggression. They fear you; this way they can stop fearing you.`,
        "Sign the pact (no war for ten years)",
        "Refuse — keep your hands free",
      );
      break;
    case "trade":
      Q(
        `${t.short} offers a trade pact`,
        `${t.name}'s merchants want your markets and offer theirs. A trade pact adds about 4% to both crowns' income.`,
        "Open the markets",
        "Protect your own merchants",
      );
      break;
    case "marry": {
      const k = A.P(o.pid);
      if (!k) return;
      Q(
        `A match from ${t.short}`,
        `${who} proposes a royal marriage: your ${k.sex === "F" ? "daughter" : "son"} ${k.given} to a prince${k.sex === "F" ? "" : "ss"} of ${t.name}. The two crowns would be kin.`,
        `Accept the match for ${k.given}`,
        "Decline",
      );
      break;
    }
    case "tribute":
      Q(
        `${t.short} demands tribute`,
        `${who} sends a mailed knight with a message: ${r.name} will pay tribute — 8% of its income each year — or ${t.name} will come and take it. They are ${(A.realmPower(t) / Math.max(1, A.realmPower(r))).toFixed(1)}× as strong as you.`,
        "Bend the knee and pay",
        "Refuse (they may declare war)",
      );
      break;
    case "aid": {
      const g = Math.round(Math.max(800, r.income * 0.05));
      o.gold = g;
      Q(
        `${t.short} asks for help`,
        `${t.name} is at war and asks, as a friend, for ${A.fmt(g)} suns for its armies.`,
        `Send ${A.fmt(g)} suns`,
        "Send regrets",
      );
      break;
    }
    case "buy": {
      const p = A.prov(o.prov);
      if (!p) return;
      o.price = Math.round(p.pop * 0.12 + 4e3);
      Q(
        `${t.short} offers to buy ${p.name}`,
        `${who} offers ${A.fmt(o.price)} suns for ${p.name} (${A.fmt(p.pop)} people), on your shared border. Silver now, or land forever.`,
        `Sell ${p.name} for ${A.fmt(o.price)}`,
        "This land is not for sale",
      );
      break;
    }
    case "sue": {
      const w = A.S.wars.find(x => x.id === o.war);
      if (!w) return;
      const side = A.warSide(w, r.id),
        provs = A.wsTreatyProvinces(w, side);
      o.provs = provs.map(p => p.id);
      Q(
        `${t.short} sues for peace`,
        `${w.name} is going your way. ${who} offers peace: ${provs.length ? "you keep " + provs.map(p => p.name).join(", ") : "reparations of " + A.fmt(Math.round(t.income * 0.15)) + " suns"}.`,
        "Accept their surrender",
        "Fight on for more",
      );
      break;
    }
    case "demand": {
      const w = A.S.wars.find(x => x.id === o.war);
      if (!w) return;
      const side = A.warSide(w, r.id) === "att" ? "def" : "att",
        provs = A.wsTreatyProvinces(w, side);
      o.provs = provs.map(p => p.id);
      Q(
        `${t.short} demands your surrender`,
        `${w.name} is going badly. ${who} offers to stop — if you ${provs.length ? "give up " + provs.map(p => p.name).join(", ") : "pay " + A.fmt(Math.round(r.income * 0.2)) + " suns"}.`,
        "Accept their terms",
        "Never — fight on",
      );
      break;
    }
    case "whitepeace": {
      const w = A.S.wars.find(x => x.id === o.war);
      if (!w) return;
      Q(
        `${t.short} offers a white peace`,
        `Both realms are bleeding for ${w.name}. ${who} offers to end it where it stands: no land, no gold.`,
        "Accept the white peace",
        "Refuse",
      );
      break;
    }
  }
};

Object.assign(A.CHOICE_FN, {
  aiYes(o) {
    const pc = A.pc(),
      r = A.realm(pc && pc.ruler),
      t = A.realm(o.rid);
    if (!(!r || !t || !t.alive)) {
      if (o.kind === "defpact") {
        A.sign("def", r.id, t.id);
        return;
      }
      if (o.kind === "access") {
        A.sign("access", r.id, t.id);
        for (const w of A.atWar(t.id))
          for (const f of A.warSide(w, t.id) === "att" ? w.def : w.att) A.remember(f, r.id, "snub", -8);
        return;
      }
      switch ((A.polInit(r), A.polInit(t), o.kind)) {
        case "ally":
          A.ally(r.id, t.id);
          A.addRel(r.id, t.id, 10);
          A.log(`You swear an alliance with ${t.name}.`, "good");
          A.news(`${r.name} and ${t.name} swear an alliance.`, "crown");
          break;
        case "nap":
          r.pacts.nap[t.id] = A.S.year + 10;
          t.pacts.nap[r.id] = A.S.year + 10;
          A.addRel(r.id, t.id, 5);
          A.log(`A ten-year pact of non-aggression with ${t.name}.`, "good");
          break;
        case "trade":
          r.pacts.trade[t.id] = A.S.year + 15;
          t.pacts.trade[r.id] = A.S.year + 15;
          A.updateRealmPops();
          A.log(`Your markets open to ${t.name}'s.`, "good");
          break;
        case "marry": {
          const k = A.P(o.pid);
          if (!k || k.spouse) return;
          const sp = A.genNoble(t.id, "royal", t.house, A.age(k) + A.ri(-3, 3), k.sex === "M" ? "F" : "M");
          A.marry(k, sp);
          r.marriages[t.id] = A.S.year;
          t.marriages[r.id] = A.S.year;
          A.addRel(r.id, t.id, 25);
          A.log(`${k.given} marries ${A.fullName(sp)} of ${t.short}.`, "good");
          A.news(`A royal marriage binds ${r.short} and ${t.short}.`, "crown");
          break;
        }
        case "tribute":
          r.overlord = t.id;
          A.unally(r.id, t.id);
          r.legit = Math.max(0, r.legit - 6);
          A.log(`You agree to pay tribute to ${t.name}. Your lords look at their boots.`, "bad");
          A.news(`${r.name} becomes a tributary of ${t.name}.`, "crown");
          break;
        case "aid":
          r.treasury -= o.gold || 800;
          t.treasury += o.gold || 800;
          A.addRel(r.id, t.id, 15);
          A.log(`You send silver to ${t.name}. They will remember.`, "good");
          break;
        case "buy": {
          const p = A.prov(o.prov);
          if (p && p.owner === r.id) {
            A.transferProv(p, t.id, false);
            r.treasury += o.price;
            r.stability = Math.max(0, r.stability - 4);
            A.addRel(r.id, t.id, 15);
            A.log(`You sell ${p.name} to ${t.name} for ${A.fmt(o.price)}.`, "warn");
          }
          break;
        }
        case "sue": {
          const w = A.S.wars.find(x => x.id === o.war);
          if (!w) return;
          const side = A.warSide(w, r.id),
            provs = (o.provs || []).map(A.prov).filter(p => p && w[side === "att" ? "def" : "att"].includes(p.owner));
          for (const p of provs) A.transferProv(p, r.id, true);
          if (!provs.length) {
            const g = Math.round(t.income * 0.15);
            t.treasury -= g;
            r.treasury += g;
          }
          A.endWar(
            w,
            side,
            `${w.name} ends: ${t.short} sues for peace${provs.length ? " and gives up " + provs.map(p => p.name).join(", ") : " and pays"}.`,
          );
          A.updateRealmPops();
          break;
        }
        case "demand": {
          const w = A.S.wars.find(x => x.id === o.war);
          if (!w) return;
          const side = A.warSide(w, r.id) === "att" ? "def" : "att",
            provs = (o.provs || []).map(A.prov).filter(p => p && p.owner === r.id);
          for (const p of provs) A.transferProv(p, t.id, true);
          if (!provs.length) {
            const g = Math.round(r.income * 0.2);
            r.treasury -= g;
            t.treasury += g;
          }
          r.legit = Math.max(0, r.legit - 5);
          A.endWar(w, side, `${w.name} ends: ${r.short} accepts ${t.short}'s terms.`);
          A.updateRealmPops();
          break;
        }
        case "whitepeace": {
          const w = A.S.wars.find(x => x.id === o.war);
          if (w) A.settleWar(w, "white");
          break;
        }
        case "jointwar": {
          const f = A.realm(o.foe);
          if (!f || !f.alive) return;
          const w = A.startWar(r.id, f.id, null, A.pickCB(r.id, f.id), {
            noAllies: true,
          });
          if (w) {
            if (!w.att.includes(t.id) && !A.atWar(t.id).length) w.att.push(t.id);
            A.addRel(r.id, t.id, 12);
            r.infamy = Math.min(100, (r.infamy || 0) + 3);
            A.log(`You and ${t.short} march on ${f.name} together.`, "war");
          }
          break;
        }
        case "claimdemand": {
          const p = A.prov(o.prov);
          if (p && p.owner === r.id) {
            A.transferProv(p, t.id, false);
            delete t.claims[p.id];
            r.legit = Math.max(0, r.legit - 4);
            A.addRel(r.id, t.id, 20);
            A.log(`You return ${p.name} to ${t.name}. Peace has a price.`, "warn");
          }
          break;
        }
        case "coalition": {
          const f = A.realm(o.foe);
          if (!f) return;
          A.addRel(r.id, f.id, -25);
          A.addRel(r.id, t.id, 12);
          for (const x of Object.values(A.S.realms))
            if (x.alive && x.id !== f.id && A.relBetween(x.id, f.id) < 0 && x.id !== r.id) A.addRel(r.id, x.id, 4);
          A.log(`${r.short} joins the league against ${f.name}.`, "warn");
          break;
        }
      }
    }
  },
  aiNo(o) {
    const pc = A.pc(),
      r = A.realm(pc && pc.ruler),
      t = A.realm(o.rid);
    if (!r || !t) return;
    const d =
      {
        ally: -6,
        nap: -4,
        trade: -3,
        marry: -6,
        tribute: -20,
        aid: -10,
        buy: -3,
        sue: -2,
        demand: 0,
        whitepeace: -2,
        jointwar: -5,
        claimdemand: -15,
        coalition: -4,
      }[o.kind] || -3;
    if ((A.addRel(r.id, t.id, d), o.kind === "claimdemand" && A.chance(0.45) && !A.hostile(t.id, r.id))) {
      A.startWar(t.id, r.id, null, "reconquest");
      A.log(`${t.name} comes to take back what it claims!`, "war");
      return;
    }
    if (o.kind === "tribute") {
      if (A.chance(0.55) && !A.hostile(t.id, r.id)) {
        A.startWar(t.id, r.id, null, "tribute");
        A.log(`${t.name} answers your refusal with war!`, "war");
      } else {
        r.legit = Math.min(100, r.legit + 4);
        A.log(`You refuse ${t.name}'s demand. They bluster — and do nothing. Your lords cheer.`, "good");
      }
    } else {
      if (o.kind === "demand") A.log("You refuse. The war goes on.", "warn");
      else A.log(`You decline ${t.name}'s offer.`);
    }
  },
});

A.provsHeld = pc => (pc.ruler ? A.realmProvs(pc.ruler).length : 0);

A.livingKids = pc => pc.children.map(A.P).filter(k => k && k.alive);

A.grandkids = pc => {
  let n = 0;
  for (const k of pc.children.map(A.P)) if (k) n += k.children.filter(g => A.P(g) && A.P(g).alive).length;
  return n;
};

A.bestStyleRank = pc => (pc.styles ? Math.max(0, ...Object.values(pc.styles).map(s => s.rank || 0)) : 0);

A.netWorth = pc => pc.coin + A.assetValue(pc);

A.realmsSeen = pc => (pc.seen || []).length;

A.DEC = {};

const DEC = (k, o) => {
    A.DEC[k] = Object.assign(
      {
        k,
      },
      o,
    );
  },
  R = (label, ok) => [label, !!ok];

DEC("found_house", {
  cat: "Family",
  name: "Found a house of your own",
  desc: "Register arms with the heralds and found a family house. Your children will be born into it.",
  show: pc => A.isAdult(pc) && (!pc.house || pc.flags.bastard) && !pc.ruler,
  reqs: pc => [
    R("Free", !pc.flags.unfree),
    R("Renown 25", pc.fame >= 25),
    R("1,500 suns for the heralds, a hall and a feast", pc.coin >= 1500),
  ],
  run(pc, arg) {
    pc.coin -= 1500;
    const sur =
        String(arg || "")
          .trim()
          .slice(0, 24) ||
        (pc.sur && !/^(of |son of|daughter of)/.test(pc.sur)
          ? pc.sur
          : pc.epithet
            ? pc.epithet.replace(/^the /i, "")
            : pc.given),
      hid = "FAM-H" + (A.S.nextHouse = (A.S.nextHouse || 100) + 1),
      charges = [
        "lion",
        "wolf",
        "bear",
        "boar",
        "stag",
        "eagle",
        "raven",
        "hawk",
        "horse",
        "bull",
        "tower",
        "sword",
        "axe",
        "hammer",
        "star",
        "sun",
        "moon",
        "tree",
        "rose",
        "ship",
        "anchor",
        "flame",
        "key",
        "wheel",
      ],
      kind =
        pc.status === "merchant" || (pc.job && ["merchant", "brewer"].includes(pc.job.c))
          ? "merchant"
          : pc.mil
            ? "gentry_mil"
            : pc.status === "artisan" || pc.job
              ? "guild"
              : "gentry";
    // [X1 baked patch core/09-engine-at-scale SCALE-HOUSE-WRITES] A.realmHouses filtered every house in the world on
    // every call. 09-engine-at-scale answers it from an index of houses by realm, dropped when a house is created
    // during play: the player's own house (founding a realm, or rising into the gentry). Nothing in the release
    // changes a house's realm, kind or extinction during play (70-fresh-realms-and-tensions does, inside A.initWorld);
    // test.mjs (scaleSites) checks the creation sites, and each month 09-engine-at-scale compares the index with the
    // houses.
    A.S.houses[hid] = {
      id: hid,
      name: "House " + sur,
      sur,
      realm: pc.realm,
      kind,
      fkind: kind,
      status: pc.status,
      great: false,
      title: "",
      rank: A.FAM_KIND_NAME[kind] || "House",
      seat: A.provName(pc.home),
      op: 60,
      extinct: false,
      fame: Math.round(pc.fame / 2),
      colors: [
        A.pick(["#7a1f1f", "#1f3d7a", "#245c2a", "#262626", "#5a2a6e", "#7a5a1f"]),
        A.pick(["#ece6d6", "#d4a63a", "#c0c0c0"]),
      ],
      charge: A.pick(charges),
      words: pc.flags.houseWords || "We Made Ourselves",
      notes: `Founded by ${A.fullName(pc)} in ${A.S.year} AR.`,
      headPid: pc.id,
      founded: A.S.year,
      members: [pc.id],
    };
    if (A.scaleHouse) A.scaleHouse();
    pc.house = hid;
    pc.sur = sur;
    pc.surMode = "house";
    delete pc.flags.bastard;
    for (const k of A.livingKids(pc)) {
      k.house = hid;
      k.sur = sur;
      k.surMode = "house";
    }
    A.fame(pc, 5);
    pc.deeds.push({
      y: A.S.year,
      t: `Founded House ${sur}`,
    });
    if (A.S.dynasty) A.S.dynasty.name = "House " + sur;
    return `You found House ${sur}. The heralds paint your arms; your children carry the name.`;
  },
});

DEC("legitimize", {
  cat: "Family",
  name: "Legitimize a bastard child",
  desc: "Petition the crown and the faith to make a natural child your lawful heir.",
  show: pc => pc.children.some(c => A.P(c) && A.P(c).alive && A.P(c).flags.bastard),
  reqs: pc => [
    R("A ruler, or a lord (Baron+)", pc.ruler || (pc.noble && pc.noble.rung >= 4)),
    R("400 suns in fees and gifts", pc.coin >= 400),
  ],
  run(pc) {
    const k = pc.children.map(A.P).find(c => c && c.alive && c.flags.bastard);
    if (
      ((pc.coin -= 400),
      delete k.flags.bastard,
      (k.house = pc.house),
      pc.sur && ((k.sur = pc.sur), (k.surMode = pc.surMode)),
      A.addOp(k, pc, 40),
      (pc.piety = Math.max(0, pc.piety - 3)),
      pc.ruler)
    ) {
      A.pickHeir(A.myRealm());
      const r = A.myRealm();
      if (r) r.legit = Math.max(0, r.legit - 4);
    }
    return `${k.given} is lawfully yours now, name and all. Some whisper; ${k.given} does not care.`;
  },
});

DEC("adopt", {
  cat: "Family",
  name: "Take in a ward",
  desc: "Adopt an orphan of your town and raise them as your own.",
  show: pc => A.isAdult(pc) && A.age(pc) < GD.RACES[pc.race].old,
  reqs: pc => [
    R("A home of your own or a spouse", pc.spouse || pc.assets.length),
    R("100 suns", pc.coin >= 100),
    R("Not done in the last 5 years", !pc.flags.adopted || A.S.year - pc.flags.adopted >= 5),
  ],
  run(pc) {
    pc.coin -= 100;
    pc.flags.adopted = A.S.year;
    const k = A.makeAcquaintance(pc, "child", true),
      age = A.ri(2, Math.max(3, Math.round(GD.RACES[k.race].adult * 0.6)));
    k.born = A.S.year - age;
    k.parents = [pc.id];
    pc.children.push(k.id);
    k.flags.ward = true;
    k.house = pc.house;
    if (pc.sur) {
      k.sur = pc.sur;
      k.surMode = pc.surMode;
    }
    k.occ = "your ward";
    A.link(pc, k, "child", 45, pc.sex === "M" ? "father" : "mother");
    pc.happy = Math.min(100, pc.happy + 6);
    return `You take in ${k.given}, ${age}, who had no one. ${A.cap(A.he(k))} hides food under the bed for a month. Then stops.`;
  },
});

DEC("match_child", {
  cat: "Family",
  name: "Arrange a match for a child",
  desc: "Marry an unmarried grown child into a great house of the realm. Binds that house to yours.",
  show: pc => ["noble", "royal", "gentry"].includes(pc.status) || !!pc.noble || !!pc.ruler,
  reqs: pc => [
    R(
      "An unmarried adult child",
      A.livingKids(pc).some(k => !k.spouse && A.isAdult(k)),
    ),
    R("A dowry of 300 suns", pc.coin >= 300),
  ],
  run(pc) {
    const k = A.livingKids(pc).find(c => !c.spouse && A.isAdult(c)),
      hs = Object.values(A.S.houses).filter(
        h2 =>
          h2.realm === pc.realm &&
          !h2.extinct &&
          h2.id !== pc.house &&
          (h2.great !== false || ["noble", "gentry_mil", "gentry", "merchant"].includes(h2.kind)),
      ),
      h = hs.length ? A.pick(hs) : null;
    pc.coin -= 300;
    const sp = A.genNoble(
      pc.realm,
      h && h.great !== false ? "noble" : "gentry",
      h ? h.id : null,
      A.age(k) + A.ri(-4, 4),
      k.sex === "M" ? "F" : "M",
    );
    if ((A.marry(k, sp), h)) {
      h.op = A.clamp((h.op || 50) + 15, 0, 100);
      const hd = A.houseHead(h.id);
      if (hd) {
        if (pc.rel[hd.id]) A.addOp(pc, hd, 15);
        else A.link(pc, hd, "inlaw", 35, "inlaw");
      }
    }
    A.addOp(k, pc, A.chance(0.6) ? 10 : -15);
    return `${k.given} marries ${A.fullName(sp)}${h ? " of " + h.name : ""}. ${h ? h.name + " counts your house as kin now." : ""}`;
  },
});

DEC("seat", {
  cat: "Holdings",
  name: "Build a family seat",
  desc: "A manor house with a hall, a chapel and a wall: a home for generations.",
  show: pc => A.isAdult(pc) && !pc.assets.some(a => a.k === "manor" || a.k === "castle"),
  reqs: pc => [R("Free", !pc.flags.unfree), R("3,500 suns", pc.coin >= 3500)],
  run(pc) {
    pc.coin -= 3500;
    pc.assets.push({
      k: "manor",
      name: GD.PROPERTY.manor.name,
      where: A.provName(pc.home),
      y: A.S.year,
    });
    A.fame(pc, 4);
    pc.happy = Math.min(100, pc.happy + 8);
    return `Stone by stone, a hall rises at ${A.provName(pc.home)}. Your hall.`;
  },
});

DEC("commission", {
  cat: "Holdings",
  name: "Commission a great work",
  desc: "A chapel, a bridge, a tower or a statue that carries your name for centuries.",
  show: pc => A.isAdult(pc),
  reqs: pc => [
    R("2,500 suns", pc.coin >= 2500),
    R("Once every 10 years", !pc.flags.commission || A.S.year - pc.flags.commission >= 10),
  ],
  run(pc) {
    pc.coin -= 2500;
    pc.flags.commission = A.S.year;
    const w = A.pick([
      ["chapel", "a chapel of white stone"],
      ["bridge", "a stone bridge over the river"],
      ["tower", "a bell-tower"],
      ["statue", "a bronze statue in the market"],
      ["well", "a great public well and fountain"],
    ]);
    pc.works = pc.works || [];
    pc.works.push({
      y: A.S.year,
      t: `${w[1]} at ${A.provName(pc.home)}`,
    });
    if (w[0] === "chapel") {
      pc.flags.chapel = A.S.year;
      pc.piety = Math.min(100, pc.piety + 8);
    }
    A.fame(pc, 6);
    pc.deeds.push({
      y: A.S.year,
      t: `Built ${w[1]} at ${A.provName(pc.home)}`,
    });
    return `Masons and carvers work for two summers. ${A.cap(w[1])} stands at ${A.provName(pc.home)} with your name cut in the stone.`;
  },
});

DEC("pilgrimage", {
  cat: "Faith",
  name: "Go on pilgrimage",
  desc: "Walk to the holy places of your faith. Hard roads, holy ground, a changed heart.",
  show: pc => A.age(pc) >= 14 && !pc.flags.unfree && !pc.prison,
  reqs: pc => [
    R("2 initiative", A.S.time >= 2),
    R("60 suns for the road", pc.coin >= 60),
    R("Once every 8 years", !pc.flags.pilgrim || A.S.year - pc.flags.pilgrim >= 8),
  ],
  run(pc) {
    A.S.time -= 2;
    pc.coin -= 60;
    pc.flags.pilgrim = A.S.year;
    pc.piety = Math.min(100, pc.piety + A.ri(10, 18));
    A.willGrow(pc, 1.5, "pilgrim");
    A.trainSkill(pc, "faith", 4);
    A.trainSkill(pc, "survival", 2);
    const far =
      A.pick(Object.keys(A.S.realms).filter(k => A.S.realms[k].alive && A.S.realms[k].faith === pc.faith)) || pc.realm;
    A.markSeen(pc, far);
    let extra = "";
    if (A.chance(0.2)) {
      pc.health = Math.max(5, pc.health - A.ri(10, 25));
      pc.lastHurt = "the pilgrim road";
      extra = " The road nearly kills you: fever, bandits, bad water.";
    } else {
      if (A.chance(0.2))
        A.queue({
          type: "event",
          ev: A.pick(["road_pilgrim", "insult_fight", "hunt_beast"].filter(e => A.EV[e])),
        });
    }
    return `You walk to the holy places of ${A.faith(pc.faith) ? A.faith(pc.faith).name : "your faith"}${far !== pc.realm ? " as far as " + A.realmShort(far) : ""}. You come home thinner, quieter, surer.${extra}`;
  },
});

DEC("treatise", {
  cat: "Learning",
  name: "Write a treatise",
  desc: "Put what you know into a book: war, law, medicine, the sword, the stars.",
  show: pc => A.isAdult(pc) && pc.literate,
  reqs: pc => {
    const best = A.bestSkillOf(pc);
    return [
      R(`A proficiency at 50 (best: ${GD.SKILLS[best.k]} ${best.v})`, best.v >= 50),
      R("2 initiative", A.S.time >= 2),
      R("Once every 6 years", !pc.flags.author || A.S.year - pc.flags.author >= 6),
    ];
  },
  run(pc) {
    A.S.time -= 2;
    pc.flags.author = A.S.year;
    const best = A.bestSkillOf(pc),
      title = A.pick([
        `On ${GD.SKILLS[best.k]}`,
        `The Book of ${GD.SKILLS[best.k]}`,
        `A Treatise upon ${GD.SKILLS[best.k]}`,
        `${GD.SKILLS[best.k]}: What I Have Learned`,
      ]);
    pc.works = pc.works || [];
    pc.works.push({
      y: A.S.year,
      t: `"${title}"`,
    });
    A.trainSkill(pc, best.k, 3);
    A.trainSkill(pc, "learning", 4);
    const good = A.chance(A.clamp((best.v + A.stat(pc, "int")) / 160, 0.2, 0.9));
    A.fame(pc, good ? 7 : 2);
    pc.deeds.push({
      y: A.S.year,
      t: `Wrote "${title}"`,
    });
    return good
      ? `"${title}" is copied in three academies within a year. Masters argue about chapter four.`
      : `"${title}" is finished. A few copies sell. One reader writes to say it changed his life.`;
  },
});

DEC("found_academy", {
  cat: "Learning",
  name: "Found an academy",
  desc: "Endow a college in your home town. It teaches long after you, and your heirs study free.",
  show: pc => A.isAdult(pc) && pc.literate && !pc.flags.foundedAcademy,
  reqs: pc => [
    R(
      "Learning 55, or a diploma",
      A.skill(pc, "learning") >= 55 || Object.keys(pc.flags).some(k => k.startsWith("dip_")),
    ),
    R("8,000 suns", pc.coin >= 8e3),
  ],
  run(pc, arg) {
    pc.coin -= 8e3;
    pc.flags.foundedAcademy = A.S.year;
    const type = GD.ACADEMY_TYPES[arg]
      ? arg
      : pc.mil
        ? "war"
        : pc.job && pc.job.c === "healer"
          ? "medicine"
          : pc.job && pc.job.c === "clergy"
            ? "faith"
            : pc.job && ["merchant", "banker"].includes(pc.job.c)
              ? "trade"
              : "letters";
    A.S.academies = A.S.academies || [];
    const name = `The ${pc.sur || pc.given} ${GD.ACADEMY_TYPES[type].name.replace(/^(The |An |A )/i, "")}`;
    A.S.academies.push({
      id: "ACF-" + A.S.academies.length + "-" + pc.id,
      type,
      realm: pc.realm,
      name,
      seat: A.provName(pc.home),
      note: `Founded by ${A.fullName(pc)} in ${A.S.year}.`,
      founder: pc.id,
      house: pc.house || null,
    });
    A.fame(pc, 8);
    pc.deeds.push({
      y: A.S.year,
      t: `Founded ${name}`,
    });
    return `${name} opens its doors at ${A.provName(pc.home)}. The first students sleep on straw.`;
  },
});

DEC("found_school", {
  cat: "Arms",
  name: "Open a school of your style",
  desc: "Teach your own fighting style in your own yard. It becomes a school of the realm that anyone may join.",
  show: pc => !!pc.flags.foundedStyle && !pc.flags.foundedSchool,
  reqs: pc => {
    const st = A.style(pc.flags.foundedStyle) || Object.values(A.S.styles || {}).find(s => s.founder === pc.id),
      rk = st && pc.styles && pc.styles[st.id] ? pc.styles[st.id].rank : 0;
    return [R("Rank 4 in your own style", rk >= 4), R("2,000 suns for a yard and a hall", pc.coin >= 2e3)];
  },
  run(pc) {
    const st = A.style(pc.flags.foundedStyle) || Object.values(A.S.styles || {}).find(s => s.founder === pc.id);
    return st
      ? ((pc.coin -= 2e3),
        (pc.flags.foundedSchool = A.S.year),
        (st.kind = "chain"),
        (st.house = null),
        (st.school = {
          name: `The ${st.name.replace(/^The /, "")} Yard`,
          seat: A.provName(pc.home),
          fee: 40,
          entry: "any",
          master: A.fullName(pc),
        }),
        A.fame(pc, 6),
        `You hang a sword over a gate at ${A.provName(pc.home)}. ${st.school.name} takes its first twelve students.`)
      : null;
  },
});

DEC("tourney", {
  cat: "Arms",
  name: "Host a great tourney",
  desc: "Lists, banners, a melee and a feast. Lords come; so do their swords and their gossip.",
  show: pc => !!pc.ruler || (!!pc.noble && pc.noble.rung >= 4),
  reqs: pc => [
    R(
      pc.ruler ? "2,500 from the treasury" : "900 suns",
      pc.ruler ? (A.myRealm() || {}).treasury >= 2500 : pc.coin >= 900,
    ),
    R("Once every 4 years", !pc.flags.hostTourney || A.S.year - pc.flags.hostTourney >= 4),
    R("Not at war", !A.atWar(pc.ruler || pc.realm).length),
  ],
  run(pc) {
    if (pc.ruler) A.myRealm().treasury -= 2500;
    else pc.coin -= 900;
    pc.flags.hostTourney = A.S.year;
    A.fame(pc, 5);
    for (const h of Object.values(A.S.houses))
      if (h.realm === (pc.ruler || pc.realm) && !h.extinct) h.op = A.clamp((h.op || 50) + A.ri(3, 9), 0, 100);
    if (pc.ruler) {
      const r = A.myRealm();
      r.stability = Math.min(100, r.stability + 4);
    }
    if (A.isAdult(pc) && A.age(pc) < GD.RACES[pc.race].old)
      A.queue({
        type: "event",
        ev: "pr_tourney_joust",
      });
    return "The lists are raised. Banners from half the realm snap in the wind.";
  },
});

DEC("order", {
  cat: "Arms",
  name: "Found a knightly order",
  desc: "Sworn knights under your rule and your banner: better soldiers, a loyal core.",
  show: pc => !!pc.ruler || (!!pc.noble && pc.noble.rung >= 6),
  reqs: pc => [
    R("Renown 40", pc.fame >= 40),
    R(
      pc.ruler ? "6,000 from the treasury" : "4,000 suns",
      pc.ruler ? (A.myRealm() || {}).treasury >= 6e3 : pc.coin >= 4e3,
    ),
    R("Once per life", !pc.flags.order),
  ],
  run(pc) {
    if (pc.ruler) A.myRealm().treasury -= 6e3;
    else pc.coin -= 4e3;
    const nm = `The Order of the ${A.pick(["Iron", "Silver", "White", "Red", "Black", "Golden"])} ${A.pick(["Rose", "Stag", "Spear", "Tower", "Star", "Hand", "Oak", "Lantern"])}`;
    pc.flags.order = nm;
    const r = A.realm(pc.ruler || pc.realm);
    if (r) {
      r.armyQ = Math.min(2, r.armyQ + 0.05);
      r.army += 200;
    }
    A.fame(pc, 8);
    pc.deeds.push({
      y: A.S.year,
      t: `Founded ${nm}`,
    });
    return `${nm} swears its first fifty knights before your altar. (+army quality)`;
  },
});

DEC("emigrate", {
  cat: "Life",
  name: "Move to another realm",
  desc: "Pack everything and start again under another crown. You lose your post but keep your coin.",
  show: pc => A.isAdult(pc) && !pc.ruler,
  reqs: pc => [
    R("Free", !pc.flags.unfree && !pc.prison),
    R("50 suns for the journey", pc.coin >= 50),
    R("Not serving in an army", !pc.mil || pc.mil.merc),
  ],
  pick: pc =>
    Object.values(A.S.realms)
      .filter(r => r.alive && r.id !== pc.realm && !r.isRebel && A.raceAllowed(pc.race, r.id) && r.capitalProv != null)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(r => [r.id, r.name]),
  run(pc, rid) {
    const r = A.realm(rid);
    if (!r || !r.alive) return null;
    pc.coin -= 50;
    const ps = A.realmProvs(rid).filter(p2 => p2.town > 2e3),
      p = ps.length ? A.pick(ps) : A.prov(r.capitalProv);
    if (pc.job) {
      A.log(`You leave your post as ${GD.CAREERS[pc.job.c].ranks[pc.job.r][0]}.`);
      pc.job = null;
    }
    if (pc.school) pc.school = null;
    const from = pc.realm;
    pc.realm = rid;
    pc.home = p.id;
    A.markSeen(pc, rid);
    pc.flags.emigrated = A.S.year;
    pc.flags.homeland = pc.flags.homeland || from;
    if (pc.noble && pc.noble.realm !== rid) pc.noble = null;
    if (pc.office) pc.office = null;
    const sp = A.P(pc.spouse);
    if (sp && sp.alive) {
      sp.realm = rid;
      sp.home = p.id;
    }
    for (const k of A.livingKids(pc))
      if (!A.isAdult(k)) {
        k.realm = rid;
        k.home = p.id;
      }
    pc.happy = Math.max(0, pc.happy - 5);
    return `You sell what will not travel and take the road to ${p.name}, in ${r.name}. New faces, new laws, a new start.`;
  },
});

DEC("mentor", {
  cat: "Life",
  name: "Seek a master to teach you",
  desc: "Find a true master of your best craft and pay for their time. A mentor trains you every year.",
  show: pc => A.age(pc) >= 12 && !A.relsOf(pc, ["mentor"]).some(x => x.p.alive),
  reqs: pc => [
    R("120 suns a year up front", pc.coin >= 120 || (!A.isAdult(pc) && A.S.family && A.S.family.wealth >= 120)),
    R("1 initiative", A.S.time >= 1),
  ],
  pick: pc => Object.entries(GD.SKILLS).map(([k, n]) => [k, `${n} (${A.skill(pc, k)})`]),
  run(pc, sk) {
    if (!GD.SKILLS[sk]) sk = A.bestSkillOf(pc).k;
    if (pc.coin >= 120) pc.coin -= 120;
    else A.S.family.wealth -= 120;
    A.S.time -= 1;
    const m = A.makeAcquaintance(pc, "mentor");
    m.born = Math.min(m.born, A.S.year - Math.round(GD.RACES[m.race].adult * 2.4));
    m.skills[sk] = A.ri(70, 92);
    m.occ = `a master of ${GD.SKILLS[sk].toLowerCase()}`;
    m.flags.mentorOf = sk;
    A.link(pc, m, "mentor", 35, "student");
    pc.flags.mentorSkill = sk;
    return `${A.fullName(m)}, ${m.occ}, agrees to teach you. "You pay. You listen. You do not argue." Every year with ${A.him(m)} counts double.`;
  },
});

DEC("memoirs", {
  cat: "Life",
  name: "Write your memoirs",
  desc: "Old enough to look back. Tell your story your way.",
  show: pc => A.stage(pc) === "old" && pc.literate && !pc.flags.memoirs,
  reqs: pc => [R("Renown 30", pc.fame >= 30), R("1 initiative", A.S.time >= 1)],
  run(pc) {
    A.S.time -= 1;
    pc.flags.memoirs = A.S.year;
    pc.works = pc.works || [];
    pc.works.push({
      y: A.S.year,
      t: `the memoirs of ${A.fullName(pc)}`,
    });
    A.fame(pc, 4);
    pc.happy = Math.min(100, pc.happy + 6);
    return "You write it all down: the good, the bad, the parts you would change.";
  },
});

DEC("pass_torch", {
  cat: "Life",
  name: "Pass the torch to your heir",
  desc: "Step back and let your eldest take over. You keep living, but the story follows them now.",
  show: pc => A.livingKids(pc).some(k => A.isAdult(k)) && A.age(pc) >= GD.RACES[pc.race].adult * 2.6,
  reqs: pc => [
    R(
      "An adult child to take over",
      A.livingKids(pc).some(k => A.isAdult(k)),
    ),
  ],
  pick: pc =>
    A.livingKids(pc)
      .filter(k => A.isAdult(k))
      .map(k => [k.id, `${A.fullName(k)} (${A.age(k)})`]),
  run(pc, pid) {
    const h = A.P(pid) && A.livingKids(pc).includes(A.P(pid)) ? A.P(pid) : A.livingKids(pc).find(k => A.isAdult(k));
    if (!h) return null;
    if (pc.ruler) {
      const r = A.myRealm();
      A.makeRuler(h, r.id);
      r.playerRun = true;
      pc.ruler = null;
    }
    if (pc.house && A.S.houses[pc.house] && A.S.houses[pc.house].headPid === pc.id) A.S.houses[pc.house].headPid = h.id;
    const gift = Math.round(pc.coin * 0.7);
    pc.coin -= gift;
    h.coin += gift;
    pc.flags.retired = A.S.year;
    A.continueAs(h.id);
    return "continued";
  },
});

DEC("progress", {
  cat: "Rule",
  name: "Royal progress through the realm",
  desc: "Ride from hall to hall for a summer. Hear petitions, sleep under every great lord's roof.",
  show: pc => !!pc.ruler,
  reqs: pc => {
    const r = A.myRealm();
    return [
      R("2 initiative", A.S.time >= 2),
      R("1,500 from the treasury", r && r.treasury >= 1500),
      R("Once every 3 years", !pc.flags.progress || A.S.year - pc.flags.progress >= 3),
    ];
  },
  run(pc) {
    const r = A.myRealm();
    A.S.time -= 2;
    r.treasury -= 1500;
    pc.flags.progress = A.S.year;
    r.stability = Math.min(100, r.stability + 6);
    r.legit = Math.min(100, r.legit + 4);
    for (const h of A.realmHouses(r.id)) h.op = A.clamp((h.op || 50) + A.ri(5, 12), 0, 100);
    for (const f of A.factionsOf(r.id)) f.discontent = Math.max(0, (f.discontent || 0) - 25);
    A.trainSkill(pc, "diplomacy", 3);
    A.trainSkill(pc, "riding", 2);
    return "You ride the realm end to end. Lords who plotted over the winter now pour your wine and swear you are their dearest friend.";
  },
});

DEC("purge", {
  cat: "Rule",
  name: "Arrest a faction's leader",
  desc: "Strike first. Seize the head of the most dangerous faction before it strikes you.",
  show: pc => !!pc.ruler && A.factionsOf(pc.ruler).length > 0,
  reqs: pc => {
    const r = A.myRealm();
    return [
      R("Crown authority High or Absolute", r && r.laws && r.laws.authority >= 2),
      R("Spymaster with Intrigue 30+", r && A.councilSkill(r, "spymaster") >= 30),
    ];
  },
  run(pc) {
    const r = A.myRealm(),
      f = A.factionsOf(r.id).sort((a, b) => (b.power || 0) - (a.power || 0))[0],
      lead = A.S.houses[f.leader];
    if (A.chance(A.clamp(0.35 + A.councilSkill(r, "spymaster") / 200 - (f.power || 0) / 2, 0.1, 0.85))) {
      A.S.factions = A.S.factions.filter(x => x !== f);
      if (lead) lead.op = 5;
      for (const h of A.realmHouses(r.id)) h.op = A.clamp((h.op || 50) - 4, 0, 100);
      r.legit = Math.max(0, r.legit - 3);
      return `Your guards take the head of ${lead ? lead.name : "the faction"} at dawn. The ${A.FACTIONS[f.kind].name} breaks apart. The other lords watch very quietly.`;
    }
    A.factionRevolt(r, f);
    return `The arrest is botched. ${lead ? lead.name : "The faction"} escapes to raise the banners. Civil war.`;
  },
});

DEC("kingdom", {
  cat: "Rule",
  name: "Proclaim yourself King",
  desc: "Your lordship has grown into a kingdom in all but name. Take the name.",
  show: pc =>
    !!pc.ruler && !/king|queen|emperor|empress|sultan|khan|prince|tsar/i.test((A.myRealm() || {}).title || "King"),
  reqs: pc => {
    const r = A.myRealm();
    return [
      R("Hold 6 provinces", A.provsHeld(pc) >= 6),
      R("Legitimacy 50", r && r.legit >= 50),
      R("5,000 for the coronation", r && r.treasury >= 5e3),
    ];
  },
  run(pc) {
    const r = A.myRealm();
    r.treasury -= 5e3;
    r.title = "King";
    r.name = r.name.replace(/^(Lordship|County|Duchy|Principality) of /, "Kingdom of ");
    r.legit = Math.min(100, r.legit + 15);
    A.fame(pc, 10);
    A.news(`${A.fullName(pc)} is crowned ${pc.sex === "F" ? "Queen" : "King"} of ${r.short}.`, "crown");
    return `The crown is heavier than it looks. ${r.name}.`;
  },
});

DEC("empire", {
  cat: "Rule",
  name: "Proclaim an empire",
  desc: "Kings bow to you. Make it law.",
  show: pc => !!pc.ruler && !/emperor|empress/i.test((A.myRealm() || {}).title || ""),
  reqs: pc => {
    const r = A.myRealm();
    return [
      R("Hold 25 provinces", A.provsHeld(pc) >= 25),
      R("A tributary realm", r && A.tributariesOf(r.id).length > 0),
      R("Legitimacy 70", r && r.legit >= 70),
      R("20,000 for the coronation", r && r.treasury >= 2e4),
    ];
  },
  run(pc) {
    const r = A.myRealm();
    r.treasury -= 2e4;
    r.title = "Emperor";
    r.name = r.name.replace(/^(Kingdom|Lordship|Realm|Sultanate) of /, "Empire of ");
    if (!/^Empire/.test(r.name)) r.name = "Empire of " + r.short.replace(/^the /i, "");
    r.legit = Math.min(100, r.legit + 20);
    r.laws.authority = Math.max(r.laws.authority || 1, 2);
    A.fame(pc, 15);
    A.news(`${A.fullName(pc)} proclaims the ${r.name}.`, "crown");
    for (const o of Object.values(A.S.realms))
      if (o.alive && o.id !== r.id && A.neighbors(r.id).includes(o.id)) A.addRel(o.id, r.id, -10);
    return "An emperor. The neighbors are not pleased.";
  },
});

DEC("holy_war", {
  cat: "Rule",
  name: "Call a holy war",
  desc: "Name a neighbor of another faith an enemy of the gods. The faithful march; no one calls it greed.",
  show: pc => !!pc.ruler,
  reqs: pc => {
    const r = A.myRealm(),
      t =
        r &&
        A.neighbors(r.id)
          .map(A.realm)
          .filter(o => o && o.alive && o.faith !== r.faith && !A.hostile(r.id, o.id));
    return [
      R("Piety 50", pc.piety >= 50),
      R("A neighbor of another faith, not already at war with you", t && t.length),
      R("Not already at war", !A.atWar(pc.ruler).length),
    ];
  },
  pick: pc => {
    const r = A.myRealm();
    return A.neighbors(r.id)
      .map(A.realm)
      .filter(o => o && o.alive && o.faith !== r.faith && !A.hostile(r.id, o.id))
      .map(o => [o.id, `${o.name} (${(A.faith(o.faith) || {}).name || "other faith"})`]);
  },
  run(pc, tid) {
    const r = A.myRealm(),
      t = A.realm(tid);
    return !t || !A.startWar(r.id, t.id, `The Holy War against ${t.short.replace(/^the /i, "")}`, "holy")
      ? null
      : ((r.stability = Math.min(100, r.stability + 5)),
        (pc.piety = Math.min(100, pc.piety + 5)),
        (r.army += Math.round(r.levy * 0.1)),
        "The priests preach it from every pulpit. Volunteers crowd your muster fields.");
  },
});

DEC("restore", {
  cat: "Rule",
  name: "Restore a fallen realm",
  desc: "You hold the old capital of a realm that fell. Take up its name and its crown.",
  show: pc =>
    !!pc.ruler &&
    Object.values(A.S.realms).some(
      r =>
        !r.alive &&
        !r.isRebel &&
        LORE.realms[r.id] &&
        r.capitalProv != null &&
        A.prov(r.capitalProv) &&
        A.prov(r.capitalProv).owner === pc.ruler,
    ),
  reqs: pc => {
    const r = A.myRealm();
    return [R("Legitimacy 40", r && r.legit >= 40), R("3,000 from the treasury", r && r.treasury >= 3e3)];
  },
  run(pc) {
    const r = A.myRealm(),
      f = Object.values(A.S.realms).find(
        x =>
          !x.alive &&
          !x.isRebel &&
          LORE.realms[x.id] &&
          x.capitalProv != null &&
          A.prov(x.capitalProv) &&
          A.prov(x.capitalProv).owner === pc.ruler,
      );
    r.treasury -= 3e3;
    for (const p of A.S.prov) if (p.orig === f.id && p.owner !== r.id && !A.realm(p.owner)) r.claims[p.id] = A.S.year;
    for (const p of A.S.prov) if (p.orig === f.id && p.owner !== r.id) r.claims[p.id] = A.S.year;
    r.legit = Math.min(100, r.legit + 10);
    A.fame(pc, 10);
    A.news(`${A.fullName(pc)} restores the crown of ${f.name}.`, "crown");
    return `You take up the old crown of ${f.name}. Every province it ever held is yours by right now (claims).`;
  },
});

A.decisionsFor = pc =>
  Object.values(A.DEC).filter(d => {
    try {
      return d.show(pc);
    } catch {
      return false;
    }
  });

A.decisionState = function (pc, d) {
  let rs = [];
  try {
    rs = d.reqs(pc);
  } catch {
    rs = [["?", false]];
  }
  return {
    rs,
    ok: rs.every(x => x[1]),
  };
};

A.decide = function (k, arg) {
  const pc = A.pc(),
    d = A.DEC[k];
  if (!pc || !d || !pc.alive)
    return {
      ok: false,
    };
  let show = false;
  try {
    show = d.show(pc);
  } catch {
    show = false;
  }
  if (!show)
    return {
      ok: false,
      msg: "Not open to you.",
    };
  const st = A.decisionState(pc, d);
  if (!st.ok)
    return {
      ok: false,
      msg:
        "Requirements: " +
        st.rs
          .filter(x => !x[1])
          .map(x => x[0])
          .join("; "),
    };
  if (d.pick && arg == null)
    return {
      ok: false,
      msg: "Choose first.",
    };
  const msg = d.run(pc, arg);
  return msg == null
    ? {
        ok: false,
        msg: "It could not be done.",
      }
    : msg === "continued"
      ? {
          ok: true,
          continued: true,
        }
      : (A.log(msg, "big"),
        {
          ok: true,
          msg,
        });
};

A.bestSkillOf = function (pc) {
  let k = "melee",
    v = -1;
  for (const s in GD.SKILLS) {
    const x = A.skill(pc, s);
    if (x > v) {
      v = x;
      k = s;
    }
  }
  return {
    k,
    v,
  };
};

A.markSeen = function (pc, rid) {
  if (!(!rid || !A.realm(rid))) {
    pc.seen = pc.seen || [];
    if (!pc.seen.includes(rid)) pc.seen.push(rid);
  }
};

A.progYear = function (pc) {
  progYearNow(pc);
  try {
    A.growthYear(pc);
  } catch {}
};

const progYearNow = function (pc) {
  if (!pc || !pc.alive) return;
  const hp = A.prov(pc.home);
  if (hp) A.markSeen(pc, hp.owner);
  A.markSeen(pc, pc.realm);
  const ms = A.relsOf(pc, ["mentor"]).filter(x => x.p.alive && x.p.flags.mentorOf);
  for (const m of ms.slice(0, 1)) {
    const sk = m.p.flags.mentorOf;
    if (A.skill(pc, sk) < A.skill(m.p, sk)) A.trainSkill(pc, sk, 3 + Math.max(0, m.r.op) / 25);
    if (A.isAdult(pc)) {
      if (pc.coin >= 60) pc.coin -= 60;
      else {
        if (A.chance(0.5)) {
          A.link(pc, m.p, "acquaint", m.r.op - 20, "acquaint");
          A.log(`${m.p.given} stops teaching you: "Masters eat too."`, "warn");
        }
      }
    }
  }
  if (A.specYear) A.specYear(pc);
  if (A.bondsYear) A.bondsYear(pc);
};
