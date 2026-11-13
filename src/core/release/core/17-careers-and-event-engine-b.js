// The release's core, careers and event engine (part 2 of 2): Careers, doors, the job board, A.defEvents, the condition helpers (A.C) and rolling events.
// Readable source of vendor/ardan-b593143.html with the patch layer baked in (X1, docs/DECISIONS.md D-027). Edit it here.
// Defines: A.diplOptions, A.diplDo, A.GATHER, A.gathById, A.gathName, A.gathGuests, A.callGathering,
// A.gathAttendees, A.gathRole, A.ROLE_NAME, A.gathAims, A.gathDay, A.holdGathering, A.gatherMonth, A.onDay,
// A.gathClose, A.EV, A.defEvents, A.C, A.rollEvents.

A.diplOptions = function (r, t) {
  A.dInit(r);
  A.dInit(t);
  const out = [],
    war = A.hostile(r.id, t.id),
    parts = A.interestParts(t.id, r.id),
    iv = parts.reduce((s, x) => s + x[1], 0),
    chan = A.councilSkill ? A.councilSkill(r, "chancellor") : 20,
    spy = A.councilSkill ? A.councilSkill(r, "spymaster") : 10,
    P = (base, extra) => A.clamp(base + iv / 100 + chan / 400 + (extra || 0), 0.02, 0.95),
    why = parts.concat([[`Your chancellor (${chan})`, Math.round(chan / 4)]]),
    add = (grp, k, name, chance, dis, desc, cost) =>
      out.push({
        grp,
        k,
        name,
        chance: chance == null ? null : Math.round(chance * 100),
        reasons: why,
        dis: dis || "",
        desc: desc || "",
        cost: cost || 0,
        cool: A.diplCool(k, t.id),
      }),
    kin = A.pc()
      ? A.pc()
          .children.map(A.P)
          .filter(c => c && c.alive && !c.spouse && A.isAdult(c))
      : [],
    ratio = A.realmPower(r) / Math.max(1, A.realmPower(t)),
    gc = 400 + Math.round(t.income * 0.002);
  if (
    (add(
      "Friendship",
      "gift",
      `Send an embassy with gifts (${A.fmt(gc)})`,
      null,
      r.treasury < gc ? "Not enough in the treasury" : "",
      "Opinion rises a little, for a few years.",
      gc,
    ),
    add(
      "Friendship",
      "summit",
      "Invite them to a summit",
      P(0.3),
      war ? "At war" : r.treasury < 1500 ? "A summit costs 1,500" : "",
      "A gathering at your capital. You can press for a treaty face to face.",
      1500,
    ),
    r.allies.includes(t.id)
      ? add("Treaties", "unally", "Break the alliance", null, "", "They will not forget it.")
      : add(
          "Treaties",
          "ally",
          "Propose an alliance",
          P(-0.15),
          war
            ? "At war"
            : t.allies.length >= 3
              ? "They have three allies already"
              : r.allies.length >= 4
                ? "You have four allies already"
                : iv < 0
                  ? "Their interest in you is too low"
                  : "",
          "Each joins the other's wars.",
        ),
    A.hasTr(r.id, t.id, "def")
      ? add("Treaties", "undef", "End the defensive pact", null, "", "")
      : add(
          "Treaties",
          "def",
          "Propose a defensive pact",
          P(0.05, A.threatsTo(t.id).some(x => A.threatsTo(r.id).includes(x)) ? 0.2 : 0),
          war ? "At war" : r.allies.includes(t.id) ? "Already allies" : "",
          "Each defends the other if attacked. No obligation in your own wars of conquest.",
        ),
    A.hasNap(r.id, t.id)
      ? add("Treaties", "nap", "Non-aggression pact", null, `Signed until ${r.pacts.nap[t.id]}`, "")
      : add(
          "Treaties",
          "nap",
          "Propose a non-aggression pact",
          P(0.35, ratio > 1.3 ? 0.1 : 0),
          war ? "At war" : "",
          "Ten years without war between you.",
        ),
    A.hasTrade(r.id, t.id)
      ? add("Treaties", "untrade", "End the trade pact", null, "", "")
      : add(
          "Treaties",
          "trade",
          "Propose a trade pact",
          P(0.3),
          war
            ? "At war"
            : A.hasTr(t.id, r.id, "emb")
              ? "They embargo you"
              : A.hasTr(r.id, t.id, "emb")
                ? "Lift your embargo first"
                : "",
          "+4% income for both.",
        ),
    A.hasTr(r.id, t.id, "access")
      ? add("Treaties", "unaccess", "Revoke military access", null, "", "")
      : add(
          "Treaties",
          "access",
          "Ask for military access",
          P(0.1, A.atWar(r.id).length ? 0 : -0.15),
          war ? "At war" : "",
          "Your armies may march through their land and draw supply there.",
        ),
    A.hasTr(r.id, t.id, "guar")
      ? add("Treaties", "unguar", "Withdraw your guarantee", null, "", "")
      : add(
          "Treaties",
          "guar",
          "Guarantee their independence",
          ratio > 1 ? P(0.6) : P(0.2),
          war ? "At war" : ratio < 0.8 ? "You are not strong enough to protect them" : "",
          "You promise to defend them. They will like you for it — and so will their friends.",
        ),
    A.hasTr(r.id, t.id, "sub"))
  )
    add("Treaties", "unsub", "Stop the subsidy", null, "", "");
  else {
    const amt = Math.round(Math.max(600, r.income * 0.03));
    add(
      "Treaties",
      "sub",
      `Pay them a subsidy (${A.fmt(amt)}/yr)`,
      null,
      war ? "At war" : r.treasury < amt ? "Not enough in the treasury" : "",
      "Gold every month for three years. Opinion rises steadily.",
      amt,
    );
  }
  if (A.dInit(r).marriages[t.id])
    add("Treaties", "marry", "Royal marriage", null, `Kin since ${r.marriages[t.id]}`, "");
  else
    add(
      "Treaties",
      "marry",
      "Propose a royal marriage",
      P(0.25, kin.length ? 0.1 : 0),
      kin.length ? (war ? "At war" : "") : "You need an unmarried adult child",
      "Your child weds into their royal house. The crowns become kin.",
    );
  if (A.hasTr(r.id, t.id, "emb")) add("Pressure", "unemb", "Lift the embargo", null, "", "");
  else
    add(
      "Pressure",
      "emb",
      "Embargo their trade",
      null,
      war ? "At war already" : "",
      "Costs them about 3% of their income and you about 1%. They will hate it.",
    );
  if (r.rivals.includes(t.id)) add("Pressure", "unrival", "End the rivalry", null, "", "Legitimacy −3.");
  else
    add(
      "Pressure",
      "rival",
      "Declare them your rival",
      null,
      r.rivals.filter(x => A.realm(x) && A.realm(x).alive).length >= 2
        ? "Two rivals at most"
        : ratio > 3 || ratio < 0.33
          ? "A rival must be a near equal"
          : "",
      "A public enmity: beating them in war brings great legitimacy. Their enemies become natural friends.",
    );
  add(
    "Pressure",
    "insult",
    "Insult their crown publicly",
    null,
    war ? "At war" : "",
    "Your warlike lords cheer (legitimacy +2). They may attack you — which would make you the defender.",
  );
  // [X1 baked patch diplomacy/20-ai-personality AIP-TRIBUTE] Tribute and greed: a tributary defies its overlord by
  // pride (A.aiDefy) and the overlord marches by wrath (A.aiPunish, rolled only when a war is possible); a greedy
  // victor makes the loser a tributary more often (A.aiExact); greedy rulers demand tribute of the player
  // (A.aiGreedW); the player's own tribute demand is weighed by the target ruler's pride and caution, and their
  // wrath decides whether a refusal means war.
  add(
    "Pressure",
    "vassalize",
    "Demand tribute",
    A.clamp(0.05 + (ratio - 2) / 4 + A.relBetween(t.id, r.id) / 300 + A.aiSubmitAdj(t.id), 0.02, 0.9),
    ratio < 2 ? "You must be twice as strong" : t.overlord ? "Already a tributary" : war ? "At war" : "",
    "8% of their income each year. Refusal may mean war.",
  );
  add(
    "War",
    "claim",
    "Plant forged charters (1,500)",
    A.clamp(0.25 + spy / 150, 0, 0.9),
    r.treasury < 1500 ? "Costs 1,500" : A.neighbors(r.id).includes(t.id) ? "" : "Not a neighbor",
    "A quick, risky claim on one border province.",
    1500,
  );
  const cb = A.cbOn(r.id, t.id);
  if (r.justify && r.justify.t === t.id)
    add(
      "War",
      "justify",
      `Justifying a war goal… ${Math.max(0, Math.ceil((r.justify.done - A.absDay()) / 30))} months left`,
      null,
      "In progress",
      "",
    );
  else
    add(
      "War",
      "justify",
      `Justify a war goal (${A.fmt(A.justifyCost(r.id))}, ~${Math.round(A.justifyDays(r.id) / 30)} months)`,
      null,
      cb
        ? `You already have a reason: ${A.CB[cb]}`
        : r.justify
          ? "Your clerks are busy with another"
          : war
            ? "At war"
            : "",
      "Your clerks build a case the world will accept. Less infamy and no unrest when you declare.",
      A.justifyCost(r.id),
    );
  add(
    "War",
    "war",
    war ? "At war" : "Declare war…",
    null,
    war ? "Already at war" : "",
    cb ? `Reason: ${A.CB[cb]}.` : "No accepted reason: heavy infamy, unrest, doubtful lords.",
  );
  return out;
};

A.diplDo = function (k, tid) {
  const pc = A.pc(),
    r = A.dInit(A.myRealm()),
    t = A.dInit(A.realm(tid));
  if (!r || !t || !t.alive)
    return {
      ok: false,
      msg: "Not possible.",
    };
  const o = A.diplOptions(r, t).find(x => x.k === k);
  if (!o)
    return {
      ok: false,
      msg: "Not possible.",
    };
  if (o.dis && k !== "war")
    return {
      ok: false,
      msg: o.dis,
    };
  if (o.cool && !["war", "unally", "undef", "untrade", "unaccess", "unguar", "unsub", "unemb", "unrival"].includes(k))
    return {
      ok: false,
      msg: `They gave their answer recently. Try again in ${Math.ceil(o.cool / 30)} month${o.cool > 30 ? "s" : ""}.`,
    };
  A.S.dcool = A.S.dcool || {};
  A.S.dcool[k + tid] = A.absDay();
  const yes = o.chance != null ? A.chance(o.chance / 100) : true,
    S = A.S,
    no = (d, txt) => (
      A.remember(t.id, r.id, "snub", d || -3),
      A.log(txt || `${t.name} declines.`, "bad"),
      {
        ok: false,
        msg: "They decline.",
      }
    );
  switch (k) {
    case "gift": {
      r.treasury -= o.cost;
      const d = A.ri(8, 16) + Math.round(A.councilSkill(r, "chancellor") / 10);
      A.remember(t.id, r.id, "gift", d);
      A.log(`Your embassy carries gifts to ${t.name}. Their opinion of you rises (+${d}).`);
      return {
        ok: true,
        msg: `Opinion +${d}`,
      };
    }
    case "summit":
      return yes
        ? ((r.treasury -= 1500),
          A.callGathering(r.id, "summit", pc.id, t.id, {
            aim: "ally",
            playerHost: true,
          }))
        : no(-2, `${t.name} sends regrets: no summit this year.`);
    case "ally":
      return yes
        ? (A.sign("ally", r.id, t.id),
          A.remember(t.id, r.id, "summit", 6),
          {
            ok: true,
            msg: "Alliance sworn!",
          })
        : no(-4, `${t.name} declines your alliance.`);
    case "unally":
      A.cancelTr("ally", r.id, t.id);
      A.remember(t.id, r.id, "snub", -18);
      A.log(`You end the alliance with ${t.name}.`, "warn");
      return {
        ok: true,
        msg: "Alliance ended.",
      };
    case "def":
      return yes
        ? (A.sign("def", r.id, t.id),
          {
            ok: true,
            msg: "Defensive pact signed.",
          })
        : no(-3);
    case "undef":
      A.cancelTr("def", r.id, t.id);
      A.remember(t.id, r.id, "snub", -10);
      return {
        ok: true,
        msg: "Pact ended.",
      };
    case "nap":
      return yes
        ? (A.sign("nap", r.id, t.id),
          {
            ok: true,
            msg: "Pact signed.",
          })
        : no(-2);
    case "trade":
      return yes
        ? (A.sign("trade", r.id, t.id),
          {
            ok: true,
            msg: "Trade pact signed.",
          })
        : no(-2);
    case "untrade":
      A.cancelTr("trade", r.id, t.id);
      A.remember(t.id, r.id, "trade_war", -6);
      return {
        ok: true,
        msg: "Trade pact ended.",
      };
    case "access":
      return yes
        ? (A.sign("access", r.id, t.id),
          {
            ok: true,
            msg: "Military access granted.",
          })
        : no(-2);
    case "unaccess":
      A.cancelTr("access", r.id, t.id);
      return {
        ok: true,
        msg: "Access revoked.",
      };
    case "guar":
      if (!yes) return no(-2, `${t.name} says it needs no protector.`);
      A.sign("guar", r.id, t.id);
      for (const id in S.realms)
        if (S.realms[id].alive && S.realms[id].allies.includes(t.id)) A.remember(id, r.id, "guarantee", 5);
      return {
        ok: true,
        msg: "Guarantee given.",
      };
    case "unguar":
      A.cancelTr("guar", r.id, t.id);
      A.remember(t.id, r.id, "abandoned", -12);
      return {
        ok: true,
        msg: "Guarantee withdrawn.",
      };
    case "sub":
      A.sign("sub", r.id, t.id, {
        amt: o.cost,
        years: 3,
      });
      return {
        ok: true,
        msg: "Subsidy granted.",
      };
    case "unsub":
      A.cancelTr("sub", r.id, t.id);
      A.remember(t.id, r.id, "snub", -6);
      return {
        ok: true,
        msg: "Subsidy stopped.",
      };
    case "emb":
      A.sign("emb", r.id, t.id);
      A.log(`You close your markets to ${t.name}.`, "warn");
      return {
        ok: true,
        msg: "Embargo declared.",
      };
    case "unemb":
      A.cancelTr("emb", r.id, t.id);
      A.remember(t.id, r.id, "gift", 4);
      return {
        ok: true,
        msg: "Embargo lifted.",
      };
    case "rival":
      A.sign("rival", r.id, t.id);
      r.legit = Math.min(100, r.legit + 2);
      return {
        ok: true,
        msg: `${t.short} is your rival.`,
      };
    case "unrival":
      A.cancelTr("rival", r.id, t.id);
      r.legit = Math.max(0, r.legit - 3);
      A.remember(t.id, r.id, "peace", 8);
      return {
        ok: true,
        msg: "Rivalry ended.",
      };
    case "insult":
      A.remember(t.id, r.id, "insult", -20);
      A.grantCB(t.id, r.id, "insult");
      r.legit = Math.min(100, r.legit + 2);
      A.log(
        `Your herald reads out a list of ${t.short}'s crimes and cowardice before their envoy. Your war party roars.`,
        "warn",
      );
      A.news(`${r.short} publicly insults ${t.short}.`, "crown");
      return {
        ok: true,
        msg: "They will not forget that.",
      };
    case "marry": {
      const kin = pc.children.map(A.P).filter(c => c && c.alive && !c.spouse && A.isAdult(c));
      if (!kin.length)
        return {
          ok: false,
        };
      if (!yes) return no(-5, `${t.name} declines the match.`);
      const k0 = kin[0],
        sp = A.genNoble(t.id, "royal", t.house, A.age(k0) + A.ri(-4, 4), k0.sex === "M" ? "F" : "M");
      A.marry(k0, sp);
      A.sign("marriage", r.id, t.id, {
        silent: true,
      });
      A.log(
        `${k0.given} is betrothed to ${A.fullName(sp)} of ${t.short}. The wedding will be held at ${r.capital}.`,
        "good",
      );
      A.callGathering(r.id, "wedding", pc.id, t.id, {
        couple: [k0.id, sp.id],
      });
      return {
        ok: true,
        msg: "A royal match!",
      };
    }
    case "vassalize":
      // [X1 baked patch diplomacy/20-ai-personality AIP-TRIBUTE] Tribute and greed: a tributary defies its overlord by
      // pride (A.aiDefy) and the overlord marches by wrath (A.aiPunish, rolled only when a war is possible); a greedy
      // victor makes the loser a tributary more often (A.aiExact); greedy rulers demand tribute of the player
      // (A.aiGreedW); the player's own tribute demand is weighed by the target ruler's pride and caution, and their
      // wrath decides whether a refusal means war.
      return yes
        ? (A.sign("trib", t.id, r.id),
          {
            ok: true,
            msg: "They bend the knee.",
          })
        : (A.remember(t.id, r.id, "insult", -20),
          A.log(`${t.name} refuses your demand.`, "bad"),
          A.chance(A.clamp(0.25 * A.aiSpite(t.id), 0.05, 0.7)) &&
            A.declareWar(t.id, r.id, {
              cb: "insult",
            }),
          {
            ok: false,
            msg: "Refused.",
          });
    case "claim": {
      if (((r.treasury -= o.cost), yes)) {
        const p = A.pick(S.prov.filter(x => x.owner === t.id && x.adj.some(j => S.prov[j].owner === r.id)));
        if (p) {
          r.claims[p.id] = S.year;
          A.log(`Your forgers deliver: ${r.short} now claims ${p.name}.`, "good");
          return {
            ok: true,
            msg: `Claim on ${p.name}`,
          };
        }
      }
      if (A.chance(0.3)) {
        A.remember(t.id, r.id, "spies", -20);
        A.log(`${t.name} catches your forgers.`, "bad");
      }
      return {
        ok: false,
        msg: "The forgery fails.",
      };
    }
    case "justify":
      return A.justifyStart(r.id, t.id);
    case "war": {
      const res = A.declareWar(r.id, t.id);
      if (res.ok)
        A.log(
          `You declare war on ${t.name}${res.w.cbReal && res.w.cbReal !== "none" ? ": " + A.CB[res.w.cbReal] : " — without a reason the world accepts"}.`,
          "war",
        );
      return res;
    }
  }
  return {
    ok: false,
  };
};

A.GATHER = {
  summit: {
    name: "Summit",
    lead: [30, 70],
    desc: "Crowns meet to talk treaties face to face.",
  },
  wedding: {
    name: "Royal wedding",
    lead: [40, 90],
    desc: "Two royal houses joined; half the courts of Ardan come to watch.",
  },
  coronation: {
    name: "Coronation",
    lead: [35, 80],
    desc: "A new crown is set on a new head, and the neighbors take its measure.",
  },
  congress: {
    name: "Peace congress",
    lead: [20, 45],
    desc: "After a great war, every crown that fought meets to settle what comes next.",
  },
  tournament: {
    name: "Great tournament",
    lead: [45, 100],
    desc: "Knights from many realms ride for glory, gold and the eyes of the great.",
  },
  council: {
    name: "Council of crowns",
    lead: [25, 60],
    desc: "Crowns afraid of a conqueror meet to bind themselves together.",
  },
};

A.gathById = id => (A.S.gath || []).find(g => g.id === id) || null;

A.gathName = function (g) {
  const h = A.realm(g.host),
    place = g.place || (h ? h.capital : "the capital");
  return (
    {
      summit: `the Summit of ${place}`,
      wedding: `the royal wedding at ${place}`,
      coronation: `the coronation at ${place}`,
      congress: `the Congress of ${place}`,
      tournament: `the Great Tournament of ${place}`,
      council: `the Council of ${place}`,
    }[g.kind] || `the gathering at ${place}`
  );
};

A.gathGuests = function (host, kind, guest, opts) {
  const S = A.S,
    h = A.realm(host);
  if (!h) return [];
  const live = Object.values(S.realms).filter(r => r.alive && !r.isRebel && r.id !== host && !A.hostile(host, r.id));
  let L = [];
  if (kind === "congress" && opts && opts.parts)
    L = opts.parts.filter(x => x !== host && A.realm(x) && A.realm(x).alive);
  else if (kind === "council" && opts && opts.members) L = opts.members.filter(x => x !== host);
  else {
    const nb = new Set(A.neighbors(host)),
      scored = live.map(r => [
        r.id,
        (nb.has(r.id) ? 30 : 0) +
          (h.allies.includes(r.id) ? 40 : 0) +
          A.relBetween(host, r.id) * 0.5 +
          (r.id === guest ? 999 : 0) +
          A.rf(0, 15),
      ]);
    scored.sort((a, b) => b[1] - a[1]);
    const n =
      {
        summit: 3,
        wedding: 4,
        coronation: 5,
        tournament: 5,
      }[kind] || 3;
    L = scored
      .filter(x => x[1] > (kind === "tournament" ? -30 : -5))
      .slice(0, n)
      .map(x => x[0]);
  }
  if (guest && !L.includes(guest) && guest !== host) L.unshift(guest);
  return [...new Set(L)];
};

A.callGathering = function (host, kind, organizerPid, guest, opts) {
  opts = opts || {};
  const S = A.S;
  S.gath = S.gath || [];
  const h = A.realm(host),
    K = A.GATHER[kind];
  if (!h || !h.alive || !K)
    return {
      ok: false,
      msg: "Not possible.",
    };
  if (S.gath.some(g2 => !g2.done && g2.host === host && g2.kind === kind))
    return {
      ok: false,
      msg: "One is already planned there.",
    };
  if (S.gath.filter(g2 => !g2.done).length >= 6 && !opts.playerHost)
    return {
      ok: false,
      msg: "Too many gatherings already.",
    };
  const g = {
    id: "G" + (S.nextG = (S.nextG || 0) + 1),
    kind,
    host,
    guests: A.gathGuests(host, kind, guest, opts),
    at: A.absDay() + A.ri(K.lead[0], K.lead[1]),
    place: h.capital,
    aim: opts.aim || null,
    target: guest || null,
    war: opts.war
      ? {
          name: opts.war.name,
          att: opts.war.att.slice(),
          def: opts.war.def.slice(),
          res: opts.war.result,
        }
      : null,
    couple: opts.couple || null,
    org: organizerPid || null,
    done: false,
    pc: null,
    members: opts.members || null,
    foe: opts.foe || null,
  };
  if (!g.guests.length && kind !== "tournament")
    return {
      ok: false,
      msg: "Nobody would come.",
    };
  S.gath.push(g);
  if (S.gath.length > 30) S.gath = S.gath.filter(x => !x.done || A.absDay() - x.at < 400).slice(-30);
  if (["wedding", "coronation", "congress", "council"].includes(kind) || A.chance(0.5))
    A.news(
      `${h.name} announces ${A.gathName(g)} for ${A.dateStr(g.at % 365, Math.floor(g.at / 365), true)}. ${g.guests.length ? `Expected: ${g.guests.slice(0, 5).map(A.realmShort).join(", ")}.` : ""}`,
      "crown",
    );
  // [X1 baked patch events/97-first-life-fixes LF-GATH-ROLE] Every gathering the realm attended invited the player,
  // so a courtier's or a chancellor's life showed the same invitation, opening and closing scenes up to 30 times. A
  // guest is now asked to the same kind of gathering at most every 6 years (a knight's tourney every 5) and to any
  // at most every 3; a visiting ruler or envoy goes to optional gatherings abroad at most every 4 years, an envoy to
  // war councils and congresses every 3 (A.lfGathRole). Hosts, a ruler at congresses and war councils, and family
  // weddings always ask.
  const pc = A.pc(),
    role = pc && pc.alive ? (A.lfGathRole ? A.lfGathRole(pc, g) : A.gathRole(pc, g)) : null;
  if (role) {
    g.pc = {
      role,
      accepted: ["guard", "servant"].includes(role) || (role === "ruler" && host === pc.ruler),
      aim: null,
      inf: 0,
      sc: 0,
      seen: [],
    };
    A.queue({
      type: "event",
      ev: "ga_invite",
      forced: true,
      ctx: {
        gid: g.id,
        rid: host,
      },
    });
  }
  return {
    ok: true,
    msg: `${A.cap(A.gathName(g))} is set for ${A.dateStr(g.at % 365, Math.floor(g.at / 365))}.`,
    g,
  };
};

A.gathAttendees = g => [g.host].concat(g.guests).filter(id => A.realm(id) && A.realm(id).alive);

A.gathRole = function (pc, g) {
  if (!pc || !pc.alive || pc.prison || !A.isAdult(pc)) return null;
  const att = A.gathAttendees(g),
    mine = pc.ruler || pc.realm;
  if (pc.ruler && att.includes(pc.ruler)) return "ruler";
  if (!att.includes(mine) && !(g.kind === "tournament" && A.neighbors(g.host).includes(mine))) return null;
  if (
    (pc.office === "chancellor" && ["summit", "congress", "council", "coronation", "wedding"].includes(g.kind)) ||
    (pc.job &&
      ((pc.job.c === "envoy" && pc.job.r >= 2) || (pc.job.c === "courtier" && pc.job.r >= 3)) &&
      ["summit", "congress", "council", "coronation"].includes(g.kind))
  )
    return "envoy";
  if (
    g.kind === "tournament" &&
    ((pc.job && pc.job.c === "knight") ||
      (pc.mil && pc.mil.rank >= 2 && !pc.mil.merc) ||
      (A.skill(pc, "lance") >= 30 && A.skill(pc, "riding") >= 30) ||
      (pc.noble && pc.noble.rung >= 2 && A.skill(pc, "melee") >= 30))
  )
    return "knight";
  const cl = A.classOf(pc);
  return (cl >= 5 && ["wedding", "coronation", "tournament"].includes(g.kind) && (mine === g.host || A.chance(0.6))) ||
    (cl >= 6 && g.kind === "summit" && mine === g.host)
    ? "noble"
    : pc.mil && !pc.mil.merc && pc.mil.rank <= 4 && pc.mil.realm === g.host && !A.atWar(g.host).length
      ? "guard"
      : pc.job && ["servant", "cook", "minstrel"].includes(pc.job.c) && pc.realm === g.host && cl <= 4
        ? "servant"
        : null;
};

A.ROLE_NAME = {
  ruler: "a crowned head",
  envoy: "your realm's envoy",
  noble: "a guest of rank",
  knight: "a knight in the lists",
  guard: "one of the guard",
  servant: "a servant of the household",
};

A.gathAims = function (pc, g) {
  const me = pc.ruler || pc.realm,
    r = A.realm(me);
  if (!r) return [];
  const out = [],
    others = A.gathAttendees(g).filter(x => x !== me);
  for (const o of others) {
    const t = A.realm(o);
    if (!(!t || A.hostile(me, o))) {
      if (!r.allies.includes(o) && r.allies.length < 4 && t.allies.length < 3)
        out.push({
          k: "ally",
          t: o,
          n: `An alliance with ${t.short}`,
        });
      else {
        if (!A.hasTr(me, o, "def") && !r.allies.includes(o))
          out.push({
            k: "def",
            t: o,
            n: `A defensive pact with ${t.short}`,
          });
      }
      if (!A.hasTrade(me, o))
        out.push({
          k: "trade",
          t: o,
          n: `A trade pact with ${t.short}`,
        });
      if (!A.hasNap(me, o) && A.neighbors(me).includes(o))
        out.push({
          k: "nap",
          t: o,
          n: `Ten years of peace with ${t.short}`,
        });
    }
  }
  const rv = (r.rivals || []).find(x => others.some(o => A.relBetween(o, x) > -20));
  if (rv)
    out.push({
      k: "isolate",
      t: rv,
      n: `Turn the room against ${A.realmShort(rv)}`,
    });
  if (g.kind === "congress" && g.war)
    out.push({
      k: "guarantees",
      t: null,
      n: "Guarantees that the peace will hold",
    });
  out.push({
    k: "prestige",
    t: null,
    n: "Be seen: prestige for your crown",
  });
  out.sort(
    (a, b) =>
      (b.t === g.target || b.t === g.host) - (a.t === g.target || a.t === g.host) ||
      A.interest(b.t || me, me) - A.interest(a.t || me, me),
  );
  return out.slice(0, 4);
};

A.gathDay = function () {
  const S = A.S;
  if (!S.gath || !S.gath.length) return;
  const now = A.absDay();
  for (const g of S.gath) if (!g.done && g.at <= now) A.holdGathering(g);
};

A.holdGathering = function (g) {
  const S = A.S;
  g.done = true;
  const h = A.realm(g.host);
  if (!h || !h.alive) return;
  const att = A.gathAttendees(g).filter(x => x === g.host || !A.hostile(g.host, x)),
    name = A.gathName(g),
    pc = A.pc(),
    pcHere =
      g.pc && g.pc.accepted && pc && pc.alive && !pc.prison && A.isAdult(pc) && (g.pc.role !== "ruler" || pc.ruler)
        ? g.pc.role
        : null,
    pcRealm = pc ? pc.ruler || pc.realm : null;
  for (const a of att) for (const b of att) if (a < b && A.chance(0.7)) A.remember(a, b, "summit", A.ri(3, 7), true);
  const decides = x =>
      !(pcHere && ["ruler", "envoy"].includes(pcHere) && x === pcRealm) && !(A.realm(x) && A.realm(x).playerRun),
    deal = (a, b, at) => {
      if (!decides(a) || !decides(b) || A.hostile(a, b)) return false;
      const iv = Math.min(A.interest(a, b), A.interest(b, a)),
        ra = A.realm(a),
        rb = A.realm(b);
      return iv >= 40 && !ra.allies.includes(b) && ra.allies.length < 3 && rb.allies.length < 3 && A.chance(0.45)
        ? A.sign("ally", a, b, {
            at,
          })
        : iv >= 25 && !A.hasTr(a, b, "def") && !ra.allies.includes(b) && A.chance(0.35)
          ? A.sign("def", a, b, {
              at,
            })
          : iv >= 12 && !A.hasTrade(a, b) && !A.hasTr(a, b, "emb") && !A.hasTr(b, a, "emb") && A.chance(0.4)
            ? A.sign("trade", a, b, {
                at,
              })
            : iv >= -10 && !A.hasNap(a, b) && A.neighbors(a).includes(b) && A.chance(0.3)
              ? A.sign("nap", a, b, {
                  at,
                })
              : false;
    },
    place = h.capital;
  switch (g.kind) {
    case "summit": {
      if (g.target) deal(g.host, g.target, place);
      for (let i = 0; i < 2; i++) {
        const a = A.pick(att),
          b = A.pick(att);
        if (a !== b) deal(a, b, place);
      }
      break;
    }
    case "wedding": {
      const other = g.target || g.guests[0];
      if (other && !(h.marriages && h.marriages[other]))
        A.sign("marriage", g.host, other, {
          at: place,
        });
      if (other && decides(g.host) && decides(other)) deal(g.host, other, place);
      break;
    }
    case "coronation": {
      for (const x of g.guests) A.remember(g.host, x, "coronation", 6);
      if (!h.playerRun)
        for (const al of h.allies.slice())
          if (A.interest(g.host, al) < 15 && A.chance(0.4)) A.cancelTr("ally", g.host, al);
      for (let i = 0; i < 2; i++) {
        const b = A.pick(g.guests);
        if (b) deal(g.host, b, place);
      }
      break;
    }
    case "congress": {
      if (g.war) {
        for (const a of g.war.att)
          for (const b of g.war.def)
            if (
              decides(a) &&
              decides(b) &&
              A.realm(a) &&
              A.realm(b) &&
              A.realm(a).alive &&
              A.realm(b).alive &&
              A.neighbors(a).includes(b) &&
              A.chance(0.35)
            )
              A.sign("nap", a, b, {
                at: place,
              });
        for (const a of att)
          for (const b of att)
            if (
              a !== b &&
              decides(a) &&
              A.realmPower(A.realm(a)) > A.realmPower(A.realm(b)) * 2.2 &&
              A.chance(0.12) &&
              !A.hasTr(a, b, "guar")
            )
              A.sign("guar", a, b, {
                at: place,
              });
      }
      break;
    }
    case "tournament": {
      const champ = A.pick(att);
      if (pcHere !== "knight") {
        const cr = A.realm(champ);
        if (cr) {
          cr.legit = Math.min(100, cr.legit + 2);
          A.news(`A knight of ${cr.short} wins ${name}.`, "crown");
        }
      }
      break;
    }
    case "council": {
      const L = att.filter(x => x !== g.foe);
      for (const a of L)
        for (const b of L)
          if (
            a < b &&
            decides(a) &&
            decides(b) &&
            !A.hasTr(a, b, "def") &&
            !A.realm(a).allies.includes(b) &&
            A.chance(0.5)
          )
            A.sign("def", a, b, {
              at: place,
            });
      if (g.foe) for (const a of L) A.remember(a, g.foe, "insult", -6);
      break;
    }
  }
  if (att.length >= 3 && A.chance(0.35)) {
    let worst = null,
      wv = 999;
    for (const a of att)
      for (const b of att)
        if (a < b) {
          const v = A.relBetween(a, b);
          if (v < wv) {
            wv = v;
            worst = [a, b];
          }
        }
    if (worst && wv < 10) {
      A.remember(worst[0], worst[1], "insult", -8, true);
      A.news(
        `At ${name}, the envoys of ${A.realmShort(worst[0])} and ${A.realmShort(worst[1])} trade insults before the whole hall.`,
        "crown",
      );
    }
  }
  A.news(`${A.cap(name)} is held: ${att.map(A.realmShort).join(", ")}.`, "crown");
  if (pcHere) {
    g.pc.role = pcHere;
    A.queue({
      type: "event",
      ev: "ga_open",
      forced: true,
      ctx: {
        gid: g.id,
        rid: g.host,
      },
    });
  } else {
    // [X1 baked patch events/994-careers CAR-HELD-WITHOUT] Every gathering the realm attended logged "The Council of X
    // is held without you" for anyone of class 6 or more, 30 times in a general's last 300 log lines. It now says so
    // only for a gathering that had a place for the player (A.gathRole).
    if (pc && pc.alive && att.includes(pcRealm) && A.classOf(pc) >= 6 && A.gathRole(pc, g))
      A.log(`${A.cap(name)} is held without you.`, "");
  }
};

A.gatherMonth = function () {
  const S = A.S,
    live = A.dLive ? A.dLive() : Object.values(S.realms).filter(r => r.alive);
  if (A.chance(0.1)) {
    const h = A.pick(live.filter(r => !r.playerRun && !A.atWar(r.id).length && r.treasury > 3e3));
    if (h) A.callGathering(h.id, "tournament");
  }
  if (A.chance(0.08)) {
    const h = A.pick(live.filter(r => !r.playerRun && !A.atWar(r.id).length && r.allies.length));
    if (h) A.callGathering(h.id, "summit", null, A.pick(h.allies));
  }
  for (const t in S.coalitions || {}) {
    const mem = S.coalitions[t];
    if (mem.length < 2 || !A.chance(0.06)) continue;
    const host = mem
      .map(A.realm)
      .filter(Boolean)
      .sort((a, b) => A.realmPower(b) - A.realmPower(a))[0];
    if (host && !host.playerRun)
      A.callGathering(host.id, "council", null, null, {
        members: mem,
        foe: t,
      });
  }
};

A.onDay = A.onDay || [];

A.onDay.push(function () {
  A.gathDay();
});

A.gathClose = function (pc, g) {
  const me = pc.ruler || pc.realm,
    r = A.realm(me),
    out = [],
    aim = g.pc.aim,
    inf = g.pc.inf || 0,
    place = (A.realm(g.host) || {}).capital || "the capital";
  if (aim && ["ally", "def", "trade", "nap"].includes(aim.k) && aim.t && r && A.realm(aim.t) && !A.hostile(me, aim.t)) {
    const iv = A.interest(aim.t, me),
      base = {
        ally: 0.1,
        def: 0.25,
        trade: 0.4,
        nap: 0.45,
      }[aim.k],
      p = A.clamp(base + iv / 120 + inf / 60, 0.03, 0.95);
    if (A.chance(p)) {
      A.sign(aim.k, me, aim.t, {
        at: place,
        silent: true,
      });
      out.push(`${A.TREATY[aim.k].name} with ${A.realmShort(aim.t)} — signed at ${place}`);
      A.news(
        `At ${A.gathName(g)}, ${A.realmShort(me)} and ${A.realmShort(aim.t)} sign a ${A.TREATY[aim.k].name.toLowerCase()}.`,
        "crown",
      );
    } else {
      out.push(`${A.TREATY[aim.k].name} with ${A.realmShort(aim.t)} — not this time (${Math.round(p * 100)}% odds)`);
      A.remember(aim.t, me, "summit", 4);
    }
  } else if (aim && aim.k === "isolate" && aim.t) {
    const n = A.gathAttendees(g).filter(x => x !== me && x !== aim.t);
    let k = 0;
    for (const x of n)
      if (A.chance(A.clamp(0.25 + inf / 50, 0.05, 0.9))) {
        A.remember(x, aim.t, "insult", -10);
        k++;
      }
    out.push(
      k
        ? `${k} crown${k > 1 ? "s" : ""} leave thinking worse of ${A.realmShort(aim.t)}`
        : `Nobody takes your side against ${A.realmShort(aim.t)}`,
    );
    if (k && A.chance(0.5)) A.remember(aim.t, me, "insult", -10);
  } else if (aim && aim.k === "guarantees") {
    if (A.chance(A.clamp(0.3 + inf / 50, 0.05, 0.9))) {
      const n = A.gathAttendees(g).filter(x => x !== me && !A.hostile(x, me) && A.neighbors(me).includes(x));
      for (const x of n.slice(0, 2))
        A.sign("nap", me, x, {
          at: place,
          silent: true,
        });
      out.push(
        n.length ? `Ten-year pacts with ${n.slice(0, 2).map(A.realmShort).join(" and ")}` : "Fine words, no signatures",
      );
    } else out.push("Fine words, no signatures");
  } else if (aim && aim.k === "prestige" && r) {
    const d = Math.max(1, Math.round(2 + inf / 10));
    r.legit = Math.min(100, r.legit + d);
    out.push(`Your crown's legitimacy +${d}`);
  }
  const role = g.pc.role,
    fame = role === "ruler" ? 1 : role === "envoy" ? 3 : role === "knight" ? 0 : 2;
  if ((fame && A.fame(pc, fame), role === "envoy")) {
    A.trainSkill(pc, "diplomacy", 3);
    if (pc.job) pc.job.merit = (pc.job.merit || 0) + 10 + Math.max(0, inf);
    const ru = r && A.P(r.ruler);
    if (ru && pc.rel[ru.id]) A.addOp(ru, pc, Math.round(2 + inf / 8));
  }
  if (role === "noble" || role === "ruler") A.trainSkill(pc, "etiquette", 2);
  if (role === "guard" && pc.mil) pc.mil.merit += 4 + Math.max(0, inf);
  if (role === "servant" && pc.job) pc.job.merit = (pc.job.merit || 0) + 6 + Math.max(0, inf);
  return out;
};

A.EV = {};

A.defEvents = function (list) {
  for (const e of list) {
    if (A.EV[e.id]) console.warn("duplicate event", e.id);
    A.EV[e.id] = e;
  }
};

A.C = {
  age: p => A.age(p),
  adult: p => A.isAdult(p),
  child: p => A.stage(p) === "child",
  teen: p => A.stage(p) === "teen",
  young: p => ["child", "teen"].includes(A.stage(p)),
  old: p => A.stage(p) === "old",
  ageAdj: p => (A.age(p) * 16) / GD.RACES[p.race].adult,
  noble: p => ["noble", "royal"].includes(p.status) || (p.noble && p.noble.rung >= 4),
  rich: p => ["merchant", "gentry", "noble", "royal"].includes(p.status) || p.coin > 1e3,
  poor: p => ["slave", "serf", "peasant"].includes(p.status) && p.coin < 100,
  unfree: p => !!p.flags.unfree,
  soldier: p => !!p.mil,
  atWar: p => A.atWar(p.realm).length > 0,
  ruler: p => !!p.ruler,
  married: p => !!(p.spouse && A.P(p.spouse) && A.P(p.spouse).alive),
  hasKids: p => p.children.some(c => A.P(c) && A.P(c).alive),
  job: (p, k) => p.job && (k ? p.job.c === k : true),
  race: (p, ...r) => r.includes(p.race),
  realm: (p, ...r) => r.includes(p.realm),
  cult: (p, ...c) => c.includes(p.cult),
  faith: (p, ...f) => f.includes(p.faith),
  terr: (p, ...t) => {
    const pr = A.prov(p.home);
    return pr ? t.includes(pr.terr) : false;
  },
  coast: p => {
    const pr = A.prov(p.home);
    return pr ? pr.coast : false;
  },
  town: p => {
    const pr = A.prov(p.home);
    return pr ? pr.town >= 8e3 : false;
  },
  blood: (p, tag) => A.hasBlood(p, tag),
  carrier: p => !!p.blood,
  trait: (p, t) => A.has(p, t),
  flag: (p, f) => !!p.flags[f],
  prison: p => !!p.prison,
  male: p => p.sex === "M",
  female: p => p.sex === "F",
  stat: (p, s) => A.stat(p, s),
  skill: (p, k) => A.skill(p, k),
  hasRel: (p, ...t) => A.relsOf(p, t).some(x => x.p.alive),
  parentsAlive: p => p.parents.some(x => A.P(x) && A.P(x).alive),
  fame: p => p.fame,
  literate: p => p.literate,
  prof: (p, k, min) => A.skill(p, k) >= (min ?? 40),
  apt: (p, k) => !!(p.apt && p.apt[k] >= 1.2),
  gear: (p, slot, ...keys) => {
    const g = p.gear && p.gear[slot];
    return keys.length ? keys.includes(g) : !!g && g !== "fists" && g !== "none";
  },
  armored: p => {
    const g = GD.GEAR[p.gear && p.gear.armor];
    return !!g && g.prot >= 6;
  },
  mounted: p => !!(p.gear && p.gear.mount),
  dual: p => {
    const g = GD.GEAR[p.gear && p.gear.shield];
    return !!g && !!g.offhand;
  },
  family: p => !!A.family(p),
  famKind: (p, ...k) => {
    const f = A.family(p);
    return !!f && k.includes(A.famKindOf(f));
  },
  famMil: p => {
    const f = A.family(p);
    return !!f && !!f.military;
  },
  famHead: p => {
    const f = A.family(p);
    return !!f && f.headPid === p.id;
  },
  atSchool: (p, kind) =>
    !!p.school &&
    (!kind ||
      p.school.kind === kind ||
      (kind === "academy" && p.school.kind === "academy") ||
      p.school.academy === kind),
  styled: (p, minRank) => !!p.styles && Object.values(p.styles).some(s => s.rank >= (minRank || 1)),
  styleRank: p => (p.styles ? Math.max(0, ...Object.values(p.styles).map(s => s.rank || 0)) : 0),
  diploma: (p, kind) => (kind ? !!p.flags["dip_" + kind] : Object.keys(p.flags).some(k => k.startsWith("dip_"))),
  jobRank: (p, min) => !!p.job && p.job.r >= (min || 0),
  rep: p => (p.job && p.job.rep) || 0,
  ownShop: p => !!(p.job && p.job.own),
  myRealm: p => A.realm(p.ruler || p.realm),
  faction: (p, kind) =>
    !!p.faction && (!kind || ((A.S.factions || []).find(f => f.id === p.faction) || {}).kind === kind),
  realmFaction: (p, kind) =>
    (A.S.factions || []).some(f => f.realm === (p.ruler || p.realm) && (!kind || f.kind === kind)),
  allies: p => {
    const r = A.realm(p.ruler || p.realm);
    return r ? r.allies.filter(x => A.realm(x) && A.realm(x).alive).length : 0;
  },
  tributary: p => {
    const r = A.realm(p.ruler || p.realm);
    return !!(r && r.overlord);
  },
  overlord: p => {
    const r = A.realm(p.ruler || p.realm);
    return !!r && A.tributariesOf(r.id).length > 0;
  },
  infamy: p => {
    const r = A.realm(p.ruler || p.realm);
    return (r && r.infamy) || 0;
  },
  authority: p => {
    const r = A.realm(p.ruler || p.realm);
    return r && r.laws && r.laws.authority != null ? r.laws.authority : 1;
  },
  coalition: p => !!(A.S.coalitions && A.S.coalitions[p.ruler || p.realm]),
  pact: p => {
    const r = A.realm(p.ruler || p.realm);
    return !!(
      r &&
      r.pacts &&
      (Object.values(r.pacts.nap).some(y => y > A.S.year) || Object.values(r.pacts.trade).some(y => y > A.S.year))
    );
  },
  office: (p, seat) => !!p.office && (!seat || p.office === seat),
  superior: p => !!(A.superior && A.superior(p)),
  favors: p => Object.values(p.favors || {}).reduce((a, b) => a + b, 0),
  owes: p => Object.values(p.owes || {}).reduce((a, b) => a + b, 0) > 0,
  sworn: p => A.relsOf(p).some(x => x.r.sworn && x.p.alive),
  letter: p => (p.letters || []).length > 0,
  ambition: (p, k) => !!p.amb && (!k || p.amb.k === k),
};

A.rollEvents = function (pc) {
  if (A._yearTurn) return;
  const S = A.S;
  if (pc.prison) return;
  const st = A.stage(pc);
  let n = st === "infant" ? (A.chance(0.5) ? 1 : 0) : st === "child" ? A.ri(1, 2) : A.ri(1, 3);
  if (A.age(pc) === 0) n = 0;
  pc.flags.ev = pc.flags.ev || {};
  S.evRecent = S.evRecent || {};
  const elig = [];
  for (const id in A.EV) {
    const e = A.EV[id];
    // [X1 baked patch events/25-variety-guard VAR-COOLDOWN] Both event rolls (A.rollEvents, yearly, and A.rollEventsN,
    // monthly) let an event without its own cooldown come back after 6 years. The plan asks for no repeat within 10.
    // The default now reads A.EV_COOL (10); an author-set cool still wins.
    if (
      e.trigger ||
      (e.once && pc.flags.ev[id]) ||
      (S.evRecent[id] && S.year - S.evRecent[id] < (e.cool || A.EV_COOL || 6))
    )
      continue;
    let ok = false;
    try {
      ok = e.cond ? !!e.cond(pc, A.C) : true;
    } catch {
      ok = false;
    }
    if (ok) elig.push(e);
  }
  for (let i = 0; i < n && elig.length; i++) {
    // [X1 baked patch events/25-variety-guard VAR-SHAPE-WEIGHT] Nothing stopped two tavern scenes, or three letters,
    // from coming one after another. Both rolls now multiply each event's weight by A.evVariety (0.15 for the shape
    // just seen, 0 for a third in a row, 1 otherwise).
    const e = A.wpick(elig, x => (x.w || 1) * (A.evVariety ? A.evVariety(x, pc) : 1));
    if (!e) break;
    elig.splice(elig.indexOf(e), 1);
    S.evRecent[e.id] = S.year;
    A.queue({
      type: "event",
      ev: e.id,
    });
  }
};
