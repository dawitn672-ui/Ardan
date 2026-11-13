// The release's core, armies divisions and council (part 2 of 2): Demobilising, divisions, the army day, the order of battle, the council and the noble's year.
// Readable source of vendor/ardan-b593143.html with the patch layer baked in (X1, docs/DECISIONS.md D-028). Edit it here.
// Defines: A.rulerAction, A.councilSkill, A.councilCandidates, A.nobleYear, nobleYearNow.

A.rulerAction = function (key, arg) {
  const pc = A.pc(),
    r = A.myRealm();
  if (!r)
    return {
      ok: false,
      msg: "You do not rule.",
    };
  if (
    A.S.yearActs["r_" + key + (arg && typeof arg != "object" ? "_" + arg : "")] &&
    ["feast", "drill", "bank", "marry", "build", "grant", "peace", "repay"].includes(key)
  )
    return {
      ok: false,
      msg: "Once a year.",
    };
  const mark = () => {
    A.S.yearActs["r_" + key + (arg && typeof arg != "object" ? "_" + arg : "")] = 1;
  };
  switch (key) {
    case "tax":
      r.laws.tax = +arg;
      r.income = Math.round(r.baseIncome * ((r.provPop || 1) / (r.basePop || 1)) * r.laws.tax);
      A.log(`You set the taxes of ${r.short}: ${A.TAX[arg][0]}.`);
      return {
        ok: true,
      };
    case "army":
      r.armyTarget = Math.max(0, Math.round(+arg));
      A.log(`You order the standing army ${r.armyTarget > r.army ? "raised" : "cut"} toward ${A.fmt(r.armyTarget)}.`);
      return {
        ok: true,
      };
    case "drill": {
      const c = Math.round(r.army * 0.8 + 500);
      if (r.treasury < c)
        return {
          ok: false,
          msg: `Drilling the host costs ${A.fmt(c)}.`,
        };
      r.treasury -= c;
      r.drill = A.S.year;
      mark();
      let n = 0;
      if (r.forces)
        for (const d of r.forces.divs) {
          if (d.exp < 30) {
            d.exp = Math.min(30, d.exp + 6 * (1 - d.exp / 40));
            n++;
          }
          for (const k in d.eq) d.eq[k] = Math.round(d.eq[k] * 0.98);
        }
      if (r.forces) r.forces.xp = Math.min(200, r.forces.xp + 4);
      A.log(
        `The host drills all summer: marching, wheeling, holding.${n ? ` ${n} divisions grow steadier (drill takes green troops up to Regular; only war makes veterans).` : ""}`,
      );
      return {
        ok: true,
      };
    }
    case "feast": {
      const c = Math.round(r.income * 0.03 + 300);
      if (r.treasury < c)
        return {
          ok: false,
          msg: `A great feast costs ${A.fmt(c)}.`,
        };
      r.treasury -= c;
      for (const h of Object.values(A.S.houses))
        if (h.realm === r.id) h.op = A.clamp((h.op || 50) + A.ri(5, 12), 0, 100);
      r.stability += 3;
      A.fame(pc, 1);
      mark();
      A.log("You hold a great feast. The lords drink your wine and swear their love. For now.", "good");
      return {
        ok: true,
      };
    }
    case "build": {
      const { prov, b } = arg,
        P = A.prov(prov),
        Bd = A.BUILDINGS[b];
      if (!P || P.owner !== r.id || !Bd)
        return {
          ok: false,
          msg: "Not possible.",
        };
      if (P.bld[b] >= 2)
        return {
          ok: false,
          msg: "Already built there.",
        };
      if (Bd.coastOnly && !P.coast)
        return {
          ok: false,
          msg: "Needs a coast.",
        };
      const cost = Math.round(Bd.cost * (1 + (P.bld[b] || 0)) * (P.pop > 3e5 ? 2 : 1));
      return r.treasury < cost
        ? {
            ok: false,
            msg: `That costs ${A.fmt(cost)}.`,
          }
        : ((r.treasury -= cost),
          (P.bld[b] = (P.bld[b] || 0) + 1),
          mark(),
          Bd.dev && (P.dev = Math.min(10, P.dev + Bd.dev)),
          Bd.income &&
            (r.baseIncome = Math.round(r.baseIncome * (1 + Bd.income * (P.pop / Math.max(1, r.provPop)) * 3))),
          Bd.fort && (P.fort = Math.min(5, P.fort + 1)),
          Bd.stab && (r.stability = Math.min(100, r.stability + Bd.stab)),
          Bd.armyQ && (r.armyQ += Bd.armyQ),
          Bd.income && (P.pop = Math.round(P.pop * 1.03)),
          (r.bldUpkeep = r.bldUpkeep || {}),
          (r.bldUpkeep[prov + b] = Math.round(cost * 0.02)),
          A.updateRealmPops(),
          A.log(`You build ${Bd.name.toLowerCase()} in ${P.name}.`, "good"),
          {
            ok: true,
          });
    }
    case "appoint": {
      const { seat, pid } = arg,
        p = A.P(pid);
      return !p || !p.alive || !A.COUNCIL[seat]
        ? {
            ok: false,
          }
        : ((r.council = r.council || {}),
          (r.council[seat] = pid),
          pc.rel[pid] ? A.addOp(pc, p, 10) : A.link(pc, p, "councillor", 30, "lord"),
          A.log(`You name ${A.fullName(p)} your ${A.COUNCIL[seat].name}.`),
          {
            ok: true,
          });
    }
    case "envoy":
      return A.diplDo("gift", arg);
    case "alliance":
      return A.diplDo("ally", arg);
    case "war":
      return A.diplDo("war", arg);
    case "peace": {
      const w = A.S.wars.find(x => x.id === arg);
      if (!w)
        return {
          ok: false,
        };
      const side = A.warSide(w, r.id),
        myScore = side === "att" ? w.score : -w.score;
      if ((side === "att" ? w.leadA : w.leadD) !== r.id)
        return {
          ok: false,
          msg: "Only the war leader can make peace.",
        };
      const er = A.realm(side === "att" ? w.leadD : w.leadA);
      mark();
      return myScore > 20 || (er && er.exhaustion > 50) || A.chance(0.25 + myScore / 150)
        ? (myScore >= 25
            ? A.settleWar(w, side)
            : myScore <= -40
              ? A.settleWar(w, side === "att" ? "def" : "att")
              : A.settleWar(w, "white"),
          {
            ok: true,
          })
        : (A.log(`${er ? er.short : "The enemy"} refuse your terms.`, "bad"),
          {
            ok: true,
          });
    }
    case "bank": {
      const amt = Math.round(r.income * 0.5 + 5e3);
      mark();
      r.treasury += amt;
      r.debt += Math.round(amt * 1.1);
      A.log(
        `The bankers of ${A.pick(["Ostra (House Lunetti)", "Lucerna", "the Hold Bank of Stonehold"])} lend you ${A.fmt(amt)}. They will want it back with interest.`,
        "warn",
      );
      return {
        ok: true,
      };
    }
    case "repay": {
      const amt = Math.min(r.debt, r.treasury);
      return amt <= 0
        ? {
            ok: false,
            msg: "Nothing to repay with.",
          }
        : ((r.debt -= amt),
          (r.treasury -= amt),
          mark(),
          A.log(`You repay ${A.fmt(amt)} of the realm's debts.`, "good"),
          {
            ok: true,
          });
    }
    case "tribute":
      return A.diplDo("vassalize", arg);
    case "grant": {
      const p = A.P(arg);
      if (!p || !p.alive)
        return {
          ok: false,
        };
      const cost = 2e3;
      // [X1 baked patch family/99994-v2-family V2F-GRANT] A ruler's "grant" (A.rulerAction) gave every grantee the
      // realm's first province, so two lords could hold one land (and the crown's own capital). It now takes a province
      // no one else holds (A.V2F.freeHolding).
      return r.treasury < cost
        ? {
            ok: false,
            msg: "A grant of land and income costs about 2,000.",
          }
        : ((r.treasury -= cost),
          mark(),
          (p.noble = {
            rung: Math.min(8, Math.max(4, p.noble ? p.noble.rung + 1 : 4)),
            realm: r.id,
            holding:
              A.V2F && A.V2F.freeHolding
                ? A.V2F.freeHolding(r.id, p.home, p)
                : (A.realmProvs(r.id)[0] || A.prov(p.home)).id,
          }),
          A.addOp(pc, p, 30),
          pc.rel[p.id] || A.link(pc, p, "friend", 40, "lord"),
          A.log(`You raise ${A.fullName(p)} to ${A.nobleTitle(p)}.`, "good"),
          {
            ok: true,
          });
    }
    case "heir": {
      const p = A.P(arg);
      if (!p || !p.alive || !pc.children.includes(p.id))
        return {
          ok: false,
        };
      const eldest = A.pickHeir(r);
      r.heirLocked = p.id;
      r.heir = p.id;
      if (eldest && eldest.id !== p.id) {
        r.legit -= 10;
        A.addOp(pc, eldest, -40);
        A.log(`You set aside ${eldest.given} and name ${p.given} your heir. Tongues wag.`, "warn");
      } else A.log(`You name ${p.given} your heir.`);
      return {
        ok: true,
      };
    }
    case "law":
      r.law = arg;
      A.log(
        `You change the law of succession: ${
          {
            male: "sons before daughters",
            equal: "the eldest child",
            female: "daughters before sons",
          }[arg]
        }.`,
      );
      r.legit -= 5;
      delete r.heirLocked;
      A.pickHeir(r);
      return {
        ok: true,
      };
    case "marry": {
      const { child, realm } = arg,
        c = A.P(child),
        t = A.realm(realm);
      if (!c || !t)
        return {
          ok: false,
        };
      const tr = A.P(t.ruler),
        cand = tr ? tr.children.map(A.P).filter(k => k && k.alive && !k.spouse && k.sex !== c.sex && A.isAdult(k)) : [];
      if ((mark(), !cand.length || A.relBetween(r.id, t.id) < 0 || !A.chance(0.4 + A.relBetween(r.id, t.id) / 150))) {
        A.log(`${t.name} declines the match.`, "bad");
        return {
          ok: true,
        };
      }
      const sp = cand[0];
      c.spouse = sp.id;
      sp.spouse = c.id;
      A.link(c, sp, "spouse", 30, "spouse");
      A.addRel(r.id, t.id, 25);
      if (!r.allies.includes(t.id) && A.chance(0.5)) {
        r.allies.push(t.id);
        t.allies.push(r.id);
      }
      A.log(`${c.given} marries ${A.fullName(sp)} of ${t.short}. Two houses joined.`, "good");
      A.news(`A royal wedding binds ${r.short} and ${t.short}.`, "crown");
      return {
        ok: true,
      };
    }
    case "abdicate": {
      const h = A.P(r.heir) || A.pickHeir(r);
      return h
        ? (A.makeRuler(h, r.id),
          (r.playerRun = false),
          (pc.ruler = null),
          A.log(`You lay down the crown. ${A.fullName(h)} rules now.`, "big"),
          {
            ok: true,
          })
        : {
            ok: false,
            msg: "You have no heir to pass the crown to.",
          };
    }
  }
  return {
    ok: false,
  };
};

A.councilSkill = (r, seat) => {
  const p = r && r.council ? A.P(r.council[seat]) : null;
  return p && p.alive ? A.skill(p, A.COUNCIL[seat].skill) : 10;
};

A.councilCandidates = function (r) {
  const pc = A.pc(),
    out = [];
  for (const h of Object.values(A.S.houses))
    if (h.realm === r.id && !h.extinct && h.kind !== "royal") {
      const p = A.houseHead(h.id);
      if (p && p.alive && p.id !== pc.id) out.push(p);
    }
  for (const x of A.relsOf(pc, [
    "sibling",
    "child",
    "spouse",
    "friend",
    "bestfriend",
    "comrade",
    "mentor",
    "councillor",
  ]))
    if (x.p.alive && A.isAdult(x.p) && x.p.id !== pc.id && !out.includes(x.p)) out.push(x.p);
  return out.slice(0, 40);
};

A.nobleYear = function (pc) {
  const c0 = pc.coin,
    r = nobleYearNow(pc),
    gain = pc.coin - c0;
  if (gain > 0) pc.coin += Math.round(gain * A.staffBonus(pc, "estate"));
  return r;
};

const nobleYearNow = function (pc) {
  if (!pc.noble || pc.ruler) return;
  const n = pc.noble,
    R2 = GD.NOBLE_RUNGS[n.rung];
  if (!R2) return;
  if (n.holding != null && A.prov(n.holding) && A.prov(n.holding).owner !== n.realm && n.rung >= 4) {
    const newOwner = A.prov(n.holding).owner;
    A.queue({
      type: "choice",
      title: "Your lands are conquered",
      text: `${A.provName(n.holding)}, your seat, now belongs to ${A.realmName(newOwner)}. Its new master demands your oath.`,
      options: [
        {
          t: `Swear to ${A.realmShort(newOwner)} and keep your lands`,
          fn: "swearNew",
          arg: newOwner,
        },
        {
          t: `Stay loyal to ${A.realmShort(n.realm)} and lose the land`,
          fn: "loseLand",
        },
      ],
    });
  }
  const inc = Math.round(
    R2.income * A.rf(0.75, 1.2) * (A.realm(n.realm) ? 0.5 + A.realm(n.realm).stability / 200 : 0.6),
  );
  pc.coin += inc;
  if (n.rung >= 2) A.trainSkill(pc, "stewardship", 1.5);
  const r = A.realm(n.realm),
    ru = r ? A.P(r.ruler) : null;
  if (
    (ru && ru.id !== pc.id && !pc.rel[ru.id] && A.link(pc, ru, "lord", A.ri(10, 40), "acquaint"),
    r && A.atWar(r.id).length && n.rung >= 2 && !pc.mil && !pc.company && A.isAdult(pc))
  ) {
    const w = A.atWar(r.id)[0],
      en = A.pick(A.warSide(w, r.id) === "att" ? w.def : w.att);
    A.queue({
      type: "choice",
      title: "The summons",
      text: `${ru ? A.rulerStyle(ru, r) : "Your liege"} calls the levies for ${w.name}. As ${A.nobleTitle(pc)} you owe ${A.fmt(R2.levy)} ${R2.levy === 1 ? "man (yourself)" : "men"} and your own sword.`,
      options: [
        {
          t: "Answer the summons and lead your levy",
          fn: "levyBattle",
          arg: {
            war: w.id,
            enemy: en,
            men: Math.max(40, R2.levy),
          },
        },
        {
          t: "Pay scutage (shield-money) instead",
          fn: "scutage",
          arg: R2.levy,
        },
        {
          t: "Ignore the summons",
          fn: "ignoreSummons",
        },
      ],
    });
  }
};
