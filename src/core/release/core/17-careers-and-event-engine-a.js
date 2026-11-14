// The release's core, careers and event engine (part 1 of 2): Careers, doors, the job board, A.defEvents, the condition helpers (A.C) and rolling events.
// Readable source of vendor/ardan-b593143.html with the patch layer baked in (X1, docs/DECISIONS.md D-028). Edit it here.
// Defines: A.pathOfCareer, GD.CAREER_SEAT, GD.DOORS, A.JOB_MERIT, A.jobBoard, A.jobRankUp, A.pathMonth, A.onMonth,
// A.dutyEvent, A.doorsFor, A.takeDoor, A.SEAT_LINK, A.seatEligible, A.seatOffers, A.CHOICE_FN, A.CHOICE_FN (+),
// A.councilMonth, A.COUNCIL_ACTS, A.councilAct, A.councilPropose, A.DMEM, A.dInit, A.dAll, A.remember, A.memSum,
// A.relBetween, A.opinionParts, A.realmStanding, A.memYear, A.TREATY, A.hasTr, A.sign, A.cancelTr, A.treatiesOf,
// A.CB (+), A.cbOn, A.grantCB, A.warPreview, A.declareWar, A.callExtra, A.CHOICE_FN.dBreakWord, A.threatsTo,
// A.interest, A.dLive, A.diploAI, A.overext, A.justifyDays, A.justifyCost, A.justifyStart, A.justifyMonth,
// A.aiWarCheck, A.INCIDENTS, A.incidentMonth, A.incidentRole, A.diploMonth, A.interestParts, A.diplCool.

A.pathOfCareer = c => A.CAREER_PATH[c] || "common";

GD.CAREER_SEAT = {
  scribe: "chancellor",
  envoy: "chancellor",
  lawyer: "chancellor",
  courtier: "chancellor",
  steward: "treasurer",
  merchant: "treasurer",
  spy: "spymaster",
  clergy: "chaplain",
};

GD.DOORS = [
  {
    from: "servant",
    minR: 2,
    to: "courtier",
    startR: 0,
    t: "From the steward's room to the hall: the household knows you.",
  },
  {
    from: "servant",
    minR: 1,
    to: "steward",
    startR: 0,
    t: "You know every barn and ledger of the house.",
    lit: true,
  },
  {
    from: "farm",
    minR: 2,
    to: "steward",
    startR: 0,
    t: "A literate freeholder can keep a lord's books.",
    lit: true,
  },
  {
    from: "scribe",
    minR: 2,
    to: "lawyer",
    startR: 1,
    t: "Clerks of the rolls make pleaders.",
  },
  {
    from: "scribe",
    minR: 2,
    to: "envoy",
    startR: 0,
    t: "The chancery needs heralds who can read their own letters.",
  },
  {
    from: "scribe",
    minR: 3,
    to: "steward",
    startR: 1,
    t: "A reeve who keeps good books becomes a steward.",
  },
  {
    from: "scribe",
    minR: 4,
    to: "courtier",
    startR: 2,
    t: "A master of an office has the ear of the court.",
  },
  {
    from: "lawyer",
    minR: 3,
    to: "courtier",
    startR: 2,
    t: "Advocates are welcome at court.",
  },
  {
    from: "envoy",
    minR: 2,
    to: "courtier",
    startR: 2,
    t: "An envoy back from abroad is worth listening to.",
  },
  {
    from: "steward",
    minR: 2,
    to: "courtier",
    startR: 2,
    t: "Seneschals sit near the high table.",
  },
  {
    from: "clergy",
    minR: 1,
    to: "scribe",
    startR: 2,
    t: "The faith teaches letters; the chancery hires its keepers.",
  },
  {
    from: "clergy",
    minR: 2,
    to: "teacher",
    startR: 2,
    t: "Priors teach.",
  },
  {
    from: "clergy",
    minR: 2,
    to: "healer",
    startR: 1,
    t: "The infirmary keeper knows herbs and the dying.",
  },
  {
    from: "merchant",
    minR: 2,
    to: "steward",
    startR: 2,
    t: "A merchant who can count can run a lord's estates.",
  },
  {
    from: "merchant",
    minR: 3,
    to: "envoy",
    startR: 1,
    t: "Trade missions become embassies.",
  },
  {
    from: "thief",
    minR: 2,
    to: "spy",
    startR: 1,
    t: "The quiet trade recruits from the loud one.",
  },
  {
    from: "bounty",
    minR: 2,
    to: "spy",
    startR: 1,
    t: "Hunters of men know where men hide.",
  },
  {
    from: "sailor",
    minR: 3,
    to: "pirate",
    startR: 2,
    t: "A mate who knows the shipping lanes is worth a share.",
  },
  {
    from: "pirate",
    minR: 3,
    to: "sailor",
    startR: 3,
    t: "A pardon, and a captain's berth for an old raider.",
  },
  {
    from: "hunter",
    minR: 2,
    to: "explorer",
    startR: 1,
    t: "Rangers become pathfinders.",
  },
  {
    from: "knight",
    minR: 2,
    to: "courtier",
    startR: 2,
    t: "Champions are feted at court.",
  },
  {
    from: "minstrel",
    minR: 2,
    to: "courtier",
    startR: 1,
    t: "Court poets hear what lords say in their cups.",
  },
  {
    from: "healer",
    minR: 2,
    to: "courtier",
    startR: 1,
    t: "A physician who saved a lord has a place at his table.",
  },
  {
    from: "mil",
    minR: 4,
    to: "courtier",
    startR: 2,
    t: "Officers of the host are welcome at court.",
  },
  {
    from: "mil",
    minR: 2,
    to: "bounty",
    startR: 1,
    t: "Old sergeants make good thief-takers.",
  },
  {
    from: "mil",
    minR: 3,
    to: "engineer",
    startR: 1,
    t: "You have dug enough siege lines to know the trade.",
  },
];

A.JOB_MERIT = r => Math.round(30 * r * (1 + 0.55 * r));

A.jobBoard = function (pc) {
  const j = pc.job;
  if (!j) return null;
  const C = GD.CAREERS[j.c],
    nr = j.r + 1,
    next = C.ranks[nr];
  if (!next) return null;
  const out = [],
    merit = Math.floor(j.merit || 0),
    mNeed = A.JOB_MERIT(nr);
  if (
    (out.push({
      k: "merit",
      label: "Merit in your post",
      have: merit,
      need: mNeed,
      ok: merit >= mNeed,
    }),
    C.skill)
  ) {
    const need = Math.min(85, 12 + nr * 14);
    out.push({
      k: "skill",
      label: GD.SKILLS[C.skill],
      have: A.skill(pc, C.skill),
      need,
      ok: A.skill(pc, C.skill) >= need,
    });
  }
  if (C.skill2 && nr >= 3) {
    const need = Math.min(70, nr * 12);
    out.push({
      k: "skill2",
      label: GD.SKILLS[C.skill2],
      have: A.skill(pc, C.skill2),
      need,
      ok: A.skill(pc, C.skill2) >= need,
    });
  }
  const rep = Math.round(A.jobRep(pc)),
    rNeed = Math.min(80, 20 + nr * 11);
  out.push({
    k: "rep",
    label: "Reputation",
    have: rep,
    need: rNeed,
    ok: rep >= rNeed,
  });
  const months = Math.floor((A.absDay() - (j.since != null ? j.since : A.absDay() - 9999)) / 30),
    mon = Math.max(3, Math.round((next[1] - C.ranks[j.r][1]) * 3.5));
  out.push({
    k: "time",
    label: "Months in your current post",
    have: months,
    need: mon,
    ok: months >= mon,
  });
  if (C.literate || (nr >= 3 && ["court", "church", "learning", "guild"].includes(A.pathOfCareer(j.c))))
    out.push({
      k: "lit",
      label: "Can read and write",
      have: pc.literate ? "yes" : "no",
      need: "yes",
      ok: !!pc.literate,
    });
  if (pc.flags.unfree && nr >= 1)
    out.push({
      k: "free",
      label: "Free to rise",
      have: "no",
      need: "yes",
      ok: false,
    });
  const top = nr === C.ranks.length - 1;
  if (top && ["court", "church", "learning"].includes(A.pathOfCareer(j.c))) {
    const cls = A.classOf(pc);
    out.push({
      k: "cls",
      label: "Standing (gentle birth, a title or great renown)",
      have: A.CLASS_NAME[cls],
      need: "gentle",
      ok: cls >= 4 || pc.fame >= 55,
      soft: false,
    });
  }
  if (top || nr >= 3)
    out.push({
      k: "open",
      label: "A post falls vacant",
      have: "",
      need: "",
      ok: true,
      soft: true,
      chance: true,
    });
  const pat = A.patronOf ? A.patronOf(pc) : null;
  out.push({
    k: "patron",
    label: "A patron speaks for you",
    have: pat ? pat.given : "no",
    need: "",
    ok: !!pat,
    soft: true,
  });
  return out;
};

A.jobRankUp = function (pc, how) {
  const j = pc.job,
    C = GD.CAREERS[j.c],
    next = C.ranks[j.r + 1];
  if (!next) return false;
  if (C.guild && j.r === 1) {
    if (pc.coin < 30) {
      if (A.chance(0.4))
        A.log("You could make your masterpiece, but the guild fee and feast cost 30 suns you do not have.", "warn");
      return false;
    }
    pc.coin -= 30;
  }
  if (
    (j.r++,
    (j.since = A.absDay()),
    (j.y = next[1]),
    A.log(`${how || "Promoted"}: you are now ${next[0]}.`, "big"),
    (pc.happy = A.clamp(pc.happy + 8, 0, 100)),
    A.fame(pc, j.r >= 3 ? 3 : 1),
    C.guild && j.r === 3 && A.ach("master_craft"),
    j.c === "merchant" && j.r === 4 && A.ach("banker"),
    j.c === "clergy" && j.r === 4 && A.ach("patriarch"),
    j.c === "pirate" && j.r === 4 && A.ach("pirate_king"),
    A.makeSuperior && j.r < C.ranks.length - 1 && !j.own)
  )
    try {
      A.makeSuperior(pc);
    } catch {}
  return true;
};

A.pathMonth = function (pc) {
  if (!pc.alive || pc.prison) return;
  const j = pc.job;
  if (j) {
    const C = GD.CAREERS[j.c];
    if (!C) {
      pc.job = null;
      return;
    }
    if (j.since == null) j.since = A.absDay() - Math.round((j.y || 0) * 365 * 0.5);
    if (j.merit == null) j.merit = A.JOB_MERIT(j.r) + (j.y || 0) * 6;
    const statV = C.stat ? A.stat(pc, C.stat) : 40,
      skillV = C.skill ? A.skill(pc, C.skill) : 30,
      P = A.plan ? A.plan(pc) : {},
      effort = P.aim === "advance" ? 10 : P.intensity === "brutal" ? -8 : P.intensity === "hard" ? -3 : 0,
      target = 25 + statV * 0.35 + skillV * 0.45 + (pc.happy - 50) * 0.2 + effort;
    j.perf = A.clamp(j.perf + (target - j.perf) * 0.06 + A.rf(-2.5, 2.5), 0, 100);
    j.merit =
      (j.merit || 0) +
      Math.max(0, (j.perf - 25) / 75) *
        (1.3 + j.r * 0.3) *
        (P.aim === "advance" ? 1.5 : 1) *
        (A.patronOf && A.patronOf(pc) ? 1.15 : 1);
    if (C.skill) A.trainSkill(pc, C.skill, 0.3);
    const repT =
      12 +
      j.perf * 0.3 +
      skillV * 0.2 +
      Math.min(30, pc.fame * 0.25) +
      A.classOf(pc) * 1.5 +
      (P.aim === "advance" ? 6 : 0) +
      (A.patronOf && A.patronOf(pc) ? 5 : 0);
    j.rep = A.clamp(A.jobRep(pc) + (repT - A.jobRep(pc)) * 0.035, 0, 100);
    const board = A.jobBoard(pc);
    if (board && !board.filter(b => !b.soft && !b.ok).length) {
      let ch = 0.18 + (j.perf - 60) / 300 + (A.patronOf && A.patronOf(pc) ? 0.12 : 0) + (A.bossMod ? A.bossMod(pc) : 0);
      if (board.some(b => b.chance)) ch *= 0.6;
      // [X1 baked patch people/99999-v2-renown RN-JOB] A post's promotion waited for the merit counter (30r(1+0.55r),
      // filled month by month by performance), then came at about 18% a month: linear. V2 rolls promotionCheck() each
      // month on the deeds and months of good service of that career's field, scaled by the old chance's factors
      // (performance, patron, the superior). In the source: roll the v2 hazard where pathMonth rolls the post's chance.
      // The merit row becomes a soft deed row in A.jobBoard (b-promo.core.js).
      if (A.RN && A.RN.on ? A.RN.jobRoll(pc, ch, board) : A.chance(A.clamp(ch, 0.03, 0.6))) A.jobRankUp(pc);
    }
    if (j.perf < 15 && A.chance(0.12) && !pc.flags.unfree && !j.own) {
      A.log(`You are let go from your place as ${C.ranks[j.r][0]}. Your work has been poor for too long.`, "bad");
      pc.job = null;
      pc.happy = A.clamp(pc.happy - 10, 0, 100);
      return;
    }
    if (A.chance(0.2)) A.dutyEvent(pc);
  }
  if (
    (pc.office ? A.councilMonth(pc) : !pc.ruler && A.isAdult(pc) && A.seatOffers(pc),
    pc.mil && A.monthOf(A.today()).m % 3 === 0 && A.promoCheck)
  ) {
    A._promoBoard = true;
    try {
      A.promoCheck(pc);
    } finally {
      A._promoBoard = false;
    }
  }
};

A.onMonth = A.onMonth || [];

A.onMonth.push(pc => A.pathMonth(pc));

A.dutyEvent = function (pc) {
  const j = pc.job;
  if (!j) return false;
  const path = A.pathOfCareer(j.c),
    pool = [];
  for (const id in A.EV) {
    const e2 = A.EV[id];
    if (
      !e2.duty ||
      !(e2.duty.includes(j.c) || e2.duty.includes(path)) ||
      (e2.minR != null && j.r < e2.minR) ||
      (e2.maxR != null && j.r > e2.maxR) ||
      (e2.once && pc.flags.ev && pc.flags.ev[id])
    )
      continue;
    const S = A.S;
    if (!(S.evRecent && S.evRecent[id] && S.year - S.evRecent[id] < (e2.cool || 3))) {
      try {
        if (e2.cond && !e2.cond(pc, A.C)) continue;
      } catch {
        continue;
      }
      pool.push(e2);
    }
  }
  // [X1 baked patch events/25-variety-guard VAR-POOL-RECENCY] A.dutyEvent and A.flowEvent pick from small per-job
  // and per-path pools with 3- and 4-year cooldowns, so the same duty came back every 3 years. Both now weigh each
  // candidate by A.evRecency: a quarter if seen in the last 10 years, times the shape guard. The pools are kept;
  // only the preference changes.
  const e = A.wpick(pool, x => (x.w || 1) * (A.evRecency ? A.evRecency(x, pc) : 1));
  return e
    ? ((A.S.evRecent = A.S.evRecent || {}),
      (A.S.evRecent[e.id] = A.S.year),
      A.queue({
        type: "event",
        ev: e.id,
        forced: true,
      }),
      true)
    : false;
};

A.doorsFor = function (pc) {
  const out = [];
  if (!A.isAdult(pc) && A.age(pc) < (13 * GD.RACES[pc.race].adult) / 16) return out;
  const cur = pc.job ? pc.job.c : null;
  for (const D of GD.DOORS)
    if (
      !(
        !(D.from === "mil"
          ? (pc.mil && !pc.mil.merc && pc.mil.rank >= D.minR) || (pc.veteran && pc.veteran.rank >= D.minR)
          : cur === D.from && pc.job.r >= D.minR) || cur === D.to
      )
    )
      out.push({
        to: D.to,
        startR: D.startR,
        why: D.t,
        lit: D.lit,
        door: true,
      });
  return out;
};

A.takeDoor = function (to) {
  const pc = A.pc(),
    d = A.doorsFor(pc).find(x => x.to === to);
  if (!d)
    return {
      ok: false,
      msg: "That door is not open to you.",
    };
  const why = A.roleBlock(pc, "job");
  if (why)
    return {
      ok: false,
      msg: why,
    };
  if (d.lit && !pc.literate)
    return {
      ok: false,
      msg: "You would need to read and write.",
    };
  if (A.S.yearActs["door_" + to])
    return {
      ok: false,
      msg: "They already gave you their answer this year.",
    };
  A.S.yearActs["door_" + to] = 1;
  const C = GD.CAREERS[to],
    ch = 0.55 + (C.skill ? A.skill(pc, C.skill) / 200 : 0) + pc.fame / 300 + (A.patronOf(pc) ? 0.15 : 0);
  if (!A.chance(A.clamp(ch, 0.1, 0.95))) {
    A.log(`You try for a place as ${C.ranks[d.startR][0].toLowerCase()}, but another gets it.`, "bad");
    return {
      ok: false,
      msg: "Another gets the place.",
    };
  }
  if (pc.mil && !pc.mil.merc) A.leaveRolesFor(pc, "job");
  const old = pc.job ? GD.CAREERS[pc.job.c].ranks[pc.job.r][0] : null;
  if (
    ((pc.job = {
      c: to,
      r: d.startR,
      y: C.ranks[d.startR][1],
      perf: 55,
      rep: 25 + d.startR * 10 + Math.round(pc.fame / 5),
      merit: A.JOB_MERIT(d.startR),
      since: A.absDay(),
    }),
    to === "clergy" && (pc.flags.priest = true),
    to === "spy" && (pc.flags.spyInvite = A.S.year),
    A.log(
      `${old ? `You leave your place as ${old.toLowerCase()} and` : "You"} become ${C.ranks[d.startR][0]}. ${d.why}`,
      "big",
    ),
    A.makeSuperior)
  )
    try {
      A.makeSuperior(pc);
    } catch {}
  return {
    ok: true,
    msg: `You are now ${C.ranks[d.startR][0]}.`,
  };
};

A.SEAT_LINK = {
  chancellor: ["scribe", "envoy", "lawyer", "courtier"],
  treasurer: ["steward", "merchant"],
  spymaster: ["spy"],
  chaplain: ["clergy"],
  marshal: [],
};

A.seatEligible = function (pc, seat) {
  const S = A.COUNCIL[seat];
  if (
    !S ||
    pc.ruler ||
    pc.flags.unfree ||
    !A.isAdult(pc) ||
    A.age(pc) < (24 * GD.RACES[pc.race].adult) / 16 ||
    pc.fame < 20
  )
    return false;
  const sk = A.skill(pc, S.skill);
  if (seat === "marshal") return !!(pc.mil && !pc.mil.merc && pc.mil.rank >= 8 && sk >= 55);
  const j = pc.job,
    C = j ? GD.CAREERS[j.c] : null;
  return (
    (j && A.SEAT_LINK[seat].includes(j.c) && j.r >= C.ranks.length - 2 && sk >= 40) || (A.classOf(pc) >= 6 && sk >= 55)
  );
};

A.seatOffers = function (pc) {
  const r = A.realm(pc.realm);
  if (!r || !r.alive) return;
  const ru = A.P(r.ruler);
  if (!(!ru || !ru.alive || ru.id === pc.id) && !A.chance(0.88) && !(A.opinion(ru, pc) < -10)) {
    r.council = r.council || {};
    for (const seat of A.shuffle(Object.keys(A.COUNCIL))) {
      if (!A.seatEligible(pc, seat)) continue;
      // [A2 posts] the registry's rules: no Marshal in peace (D-017), no seat the player may not hold
      if (A.POSTS && A.POSTS.can(A.POSTS.seatKey(r.id, seat), pc.id, { by: "offer" })) continue;
      const cur = A.P(r.council[seat]);
      if (!cur || !cur.alive || A.skill(cur, A.COUNCIL[seat].skill) + 8 < A.skill(pc, A.COUNCIL[seat].skill)) {
        A.queue({
          type: "choice",
          title: `The ${A.COUNCIL[seat].name}'s seat`,
          text: `A royal messenger finds you. ${A.rulerStyle ? A.rulerStyle(ru, r) : "The ruler"} wants you on the council as ${A.COUNCIL[seat].name}: ${A.COUNCIL[seat].desc.toLowerCase()} ${cur && cur.alive ? `${A.fullName(cur, false)} will be dismissed to make room — and will not thank you.` : "The seat stands empty."} A councillor speaks for the realm. ${pc.job || pc.mil ? "You would give up your present post." : ""}`,
          options: [
            {
              t: `Accept the seat of ${A.COUNCIL[seat].name}`,
              fn: "takeSeat",
              arg: seat,
            },
            {
              t: "Decline with thanks",
              fn: "noop",
            },
          ],
        });
        return;
      }
    }
  }
};

A.CHOICE_FN = A.CHOICE_FN || {};

Object.assign(A.CHOICE_FN, {
  takeSeat(seat) {
    const pc = A.pc(),
      r = A.realm(pc.realm);
    if (!r) return;
    const cur = A.P(r.council && r.council[seat]);
    // [A2 posts] the seat is taken through the registry: the seat he held before is given up (two seats at once was
    // possible), the man dismissed is moved with a grudge; the Marshal keeps his commission and takes the main army
    if (A.POSTS) {
      const no = A.POSTS.can(A.POSTS.seatKey(r.id, seat), pc.id, { by: "offer" });
      if (no) {
        A.log(`The seat of ${A.COUNCIL[seat].name} is no longer yours to take: ${no}.`, "warn");
        return;
      }
    }
    A.leaveRolesFor(pc, seat === "marshal" ? "army-marshal" : "council");
    r.council = r.council || {};
    if (A.POSTS) A.POSTS.appoint(A.POSTS.seatKey(r.id, seat), pc.id, { why: "offer", by: r.ruler, force: true });
    else r.council[seat] = pc.id;
    pc.office = seat;
    pc.officeSince = A.S.year;
    if (seat === "marshal" && A.wsAttachPC) A.wsAttachPC();
    if (cur && cur.alive && cur.id !== pc.id) {
      if (pc.rel[cur.id]) A.addOp(pc, cur, -30);
      else A.link(pc, cur, "rival", -30, "rival");
    }
    const ru = A.P(r.ruler);
    if (ru) {
      if (pc.rel[ru.id]) A.addOp(pc, ru, 10);
      else A.link(pc, ru, "lord", 30, "councillor");
    }
    A.fame(pc, 6);
    pc.deeds.push({
      y: A.S.year,
      t: A.COUNCIL[seat].name + " of " + r.short,
    });
    A.log(`You take your seat on the council of ${r.name} as ${A.COUNCIL[seat].name}.`, "big");
  },
  noop() {},
});

A.councilMonth = function (pc) {
  const r = A.realm(pc.realm);
  if (!r || !r.alive || !r.council || r.council[pc.office] !== pc.id) {
    if (pc.office) {
      A.log("You no longer sit on the council.", "warn");
      pc.office = null;
    }
    return;
  }
  if (
    ((pc.coin += Math.round(60 + r.income / 4e3)), A.trainSkill(pc, A.COUNCIL[pc.office].skill, 0.35), A.chance(0.24))
  ) {
    // [X1 baked patch events/97-first-life-fixes LF-POOL-PICK] A.councilMonth and A.drillMonth pick a councillor's or
    // a drilling soldier's business from a pool with only a 2- or 3-year cooldown, so the same war vote and the same
    // slow recruit came back every few years. Both now pick by the life memory (A.lfPoolPick: twice a life, 12 years
    // apart); when the pool is all held back the slot goes to a fresh scene.
    const pool = Object.values(A.EV).filter(
        e2 =>
          e2.council &&
          (e2.council.includes(pc.office) || e2.council.includes("any")) &&
          (!e2.cond ||
            (() => {
              try {
                return e2.cond(pc, A.C);
              } catch {
                return false;
              }
            })()) &&
          !(A.S.evRecent && A.S.evRecent[e2.id] && A.S.year - A.S.evRecent[e2.id] < (e2.cool || 3)),
      ),
      e = A.lfPoolPick ? A.lfPoolPick(pool, pc) : A.wpick(pool, x => x.w || 1);
    if (e) {
      A.S.evRecent = A.S.evRecent || {};
      A.S.evRecent[e.id] = A.S.year;
      A.queue({
        type: "event",
        ev: e.id,
        forced: true,
      });
    }
  }
  const ru = A.P(r.ruler);
  if (ru && A.opinion(ru, pc) < -40 && A.chance(0.15)) {
    A.log(`${A.rulerStyle ? A.rulerStyle(ru, r) : "The ruler"} dismisses you from the council.`, "bad");
    // [A2 posts] dismissed through the registry
    if (A.POSTS) A.POSTS.vacate(A.POSTS.seatKey(r.id, pc.office), "dismissed");
    else delete r.council[pc.office];
    pc.office = null;
    A.fame(pc, -3);
  }
};

A.COUNCIL_ACTS = {
  chancellor: [
    {
      k: "mission",
      name: "Lead an embassy",
      cost: 2,
      desc: "Ride to a neighbor court. Relations improve; you may bring back a pact.",
      fn: (pc, r) => {
        const o = A.pick(
          A.neighbors(r.id)
            .map(A.realm)
            .filter(x => x && x.alive && !A.hostile(r.id, x.id)),
        );
        if (!o)
          return {
            ok: false,
            msg: "No court to visit.",
          };
        const ok = A.chance(0.35 + A.skill(pc, "diplomacy") / 150);
        A.addRel(r.id, o.id, ok ? A.ri(10, 18) : A.ri(2, 6));
        A.trainSkill(pc, "diplomacy", 2.5);
        return ok && A.chance(0.4) && r.pacts && !A.hasNap(r.id, o.id)
          ? ((r.pacts.nap[o.id] = A.S.year + 10),
            (o.pacts.nap[r.id] = A.S.year + 10),
            {
              ok: true,
              msg: `Your embassy to ${o.name} goes well: relations warm, and a ten-year non-aggression pact is signed.`,
            })
          : {
              ok: true,
              msg: `Your embassy to ${o.name} ${ok ? "goes well; relations warm" : "is received coolly; little comes of it"}.`,
            };
      },
    },
    {
      k: "summit",
      name: "Propose a summit",
      cost: 3,
      desc: "Invite friendly courts to a great gathering in your capital.",
      fn: (pc, r) =>
        A.callGathering
          ? A.callGathering(r.id, "summit", pc.id)
          : {
              ok: false,
              msg: "Not now.",
            },
    },
  ],
  treasurer: [
    {
      k: "audit",
      name: "Audit the accounts",
      cost: 2,
      desc: "Find the money that went missing. The treasury fills; some lords hate you.",
      fn: (pc, r) => {
        const g = Math.round(r.income * (0.02 + A.skill(pc, "stewardship") / 2500));
        if (((r.treasury += g), A.trainSkill(pc, "stewardship", 2.5), A.chance(0.4)))
          for (const h of A.realmHouses(r.id).slice(0, 3)) h.op = A.clamp((h.op != null ? h.op : 50) - 5, 0, 100);
        return {
          ok: true,
          msg: `Your audit recovers ${A.fmt(g)} suns for the crown.`,
        };
      },
    },
    {
      k: "loan",
      name: "Negotiate with the bankers",
      cost: 2,
      desc: "Better terms on the realm's debts.",
      fn: (pc, r) => {
        if (!r.debt)
          return {
            ok: false,
            msg: "The realm owes nothing.",
          };
        const cut = Math.round(r.debt * (0.05 + A.skill(pc, "trade") / 1e3));
        r.debt -= cut;
        A.trainSkill(pc, "trade", 2);
        return {
          ok: true,
          msg: `The bankers knock ${A.fmt(cut)} off the realm's debts.`,
        };
      },
    },
  ],
  spymaster: [
    {
      k: "agents",
      name: "Plant agents abroad",
      cost: 2,
      desc: "Secrets of a rival court: a claim, a weakness, a lever.",
      fn: (pc, r) => {
        const o = A.pick(A.neighbors(r.id).map(A.realm).filter(Boolean));
        if (!o)
          return {
            ok: false,
          };
        const ok = A.chance(0.3 + A.skill(pc, "intrigue") / 140);
        if ((A.trainSkill(pc, "intrigue", 2.5), ok)) {
          const p = A.pick(A.S.prov.filter(x => x.owner === o.id && x.adj.some(j => A.S.prov[j].owner === r.id)));
          if (p && r.claims) {
            r.claims[p.id] = A.S.year;
            return {
              ok: true,
              msg: `Your agents in ${o.name} find old charters: ${r.short} now claims ${p.name}.`,
            };
          }
        }
        return !ok && A.chance(0.35)
          ? (A.addRel(r.id, o.id, -15),
            {
              ok: true,
              msg: `An agent is caught in ${o.name}. Relations sour.`,
            })
          : {
              ok: true,
              msg: "Your agents report little of use.",
            };
      },
    },
    {
      k: "plots",
      name: "Root out plots",
      cost: 2,
      desc: "Find the whisperers before they act. Stability; factions weaken.",
      fn: (pc, r) => {
        r.stability = Math.min(100, r.stability + 3);
        for (const f of (A.S.factions || []).filter(x => x.realm === r.id))
          f.discontent = Math.max(0, (f.discontent || 0) - 15);
        A.trainSkill(pc, "intrigue", 2);
        return {
          ok: true,
          msg: "Your informers name names. The realm breathes easier.",
        };
      },
    },
  ],
  chaplain: [
    {
      k: "preach",
      name: "Preach unity",
      cost: 2,
      desc: "From every pulpit: obey the crown, love your neighbor. Stability.",
      fn: (pc, r) => (
        (r.stability = Math.min(100, r.stability + 2 + Math.round(A.skill(pc, "faith") / 30))),
        (pc.piety = Math.min(100, pc.piety + 3)),
        {
          ok: true,
          msg: "The temples speak with one voice for the crown.",
        }
      ),
    },
  ],
  marshal: [
    {
      k: "drill",
      name: "Drill the host",
      cost: 2,
      desc: "Field exercises for the standing divisions.",
      fn: (pc, r) => {
        if (r.forces) {
          for (const d of r.forces.divs) if (d.exp < 30) d.exp = Math.min(30, d.exp + 4);
          r.forces.xp = Math.min(200, r.forces.xp + 4);
        }
        A.trainSkill(pc, "command", 2);
        return {
          ok: true,
          msg: "The host drills under your eye.",
        };
      },
    },
  ],
};

A.councilAct = function (k) {
  const pc = A.pc(),
    r = A.realm(pc.realm);
  if (!pc.office || !r)
    return {
      ok: false,
      msg: "You hold no seat.",
    };
  const act = (A.COUNCIL_ACTS[pc.office] || []).find(x => x.k === k);
  if (!act)
    return {
      ok: false,
    };
  if (A.S.time < act.cost)
    return {
      ok: false,
      msg: "Not enough initiative.",
    };
  if (((A.S.dcool = A.S.dcool || {}), A.S.dcool["cn_" + k] != null && A.absDay() - A.S.dcool["cn_" + k] < 120))
    return {
      ok: false,
      msg: "Too soon to try that again.",
    };
  const res = act.fn(pc, r) || {};
  if (!(res.ok === false)) {
    A.S.time -= act.cost;
    A.S.dcool["cn_" + k] = A.absDay();
    if (res.msg) A.log(res.msg, "good");
  }
  return res;
};

A.councilPropose = function (kind, tid) {
  const pc = A.pc(),
    r = A.realm(pc.realm),
    t = A.realm(tid);
  if (!pc.office || !r || !t || !t.alive)
    return {
      ok: false,
      msg: "Not possible.",
    };
  if (A.S.time < 2)
    return {
      ok: false,
      msg: "Not enough initiative (2).",
    };
  const key = "prop_" + kind + tid;
  if (A.S.yearActs[key])
    return {
      ok: false,
      msg: "The council has heard that this year.",
    };
  A.S.yearActs[key] = 1;
  A.S.time -= 2;
  const ru = A.P(r.ruler),
    op = ru ? A.opinion(ru, pc) : 0,
    sk = A.skill(pc, A.COUNCIL[pc.office].skill),
    ratio = A.realmPower(r) / Math.max(1, A.realmPower(t));
  let ch = 0.2 + op / 200 + sk / 250;
  if (
    (kind === "war" &&
      (ch +=
        (ratio - 1) * 0.25 +
        (A.claimsOn(r.id, t.id).length ? 0.2 : 0) -
        (A.atWar(r.id).length ? 0.4 : 0) -
        (r.allies.includes(t.id) ? 1 : 0) +
        (A.relBetween(r.id, t.id) < -30 ? 0.15 : 0)),
    kind === "peace")
  ) {
    if (
      !A.S.wars.find(
        x => (x.att.includes(r.id) && x.def.includes(t.id)) || (x.def.includes(r.id) && x.att.includes(t.id)),
      )
    )
      return {
        ok: false,
        msg: "There is no war with them.",
      };
    ch += r.exhaustion / 120;
  }
  if (kind === "ally") ch += A.relBetween(r.id, t.id) / 150 - (r.allies.length >= 3 ? 0.3 : 0);
  if (kind === "nap") ch += 0.15;
  const yes = A.chance(A.clamp(ch, 0.03, 0.9));
  if ((ru && A.addOp(ru, pc, yes ? 2 : -2), !yes)) {
    A.log("The council hears you out. The crown decides against it.", "warn");
    return {
      ok: true,
      msg: "The crown decides against it.",
    };
  }
  if (kind === "war") {
    const w = A.declareWar(r.id, t.id).w;
    A.log(w ? `On your counsel, ${r.short} declares war on ${t.name}.` : "War could not be declared.", "war");
  }
  if (kind === "peace") {
    const w = A.S.wars.find(
      x => (x.att.includes(r.id) && x.def.includes(t.id)) || (x.def.includes(r.id) && x.att.includes(t.id)),
    );
    if (w) {
      const side = A.warSide(w, r.id),
        my = side === "att" ? w.score : -w.score;
      A.settleWar(w, my >= 25 ? side : my <= -40 ? (side === "att" ? "def" : "att") : "white");
      A.log("On your counsel the crown makes peace.", "peace");
    }
  }
  if (kind === "ally") {
    if (A.relBetween(r.id, t.id) > 20 && A.chance(0.5)) {
      A.ally(r.id, t.id);
      A.log(`On your counsel, ${r.short} and ${t.name} swear an alliance.`, "good");
    } else {
      A.addRel(r.id, t.id, 5);
      A.log(`${t.name} is not ready for an alliance, but the overture warms relations.`);
    }
  }
  if (kind === "nap") {
    r.pacts.nap[t.id] = A.S.year + 10;
    t.pacts.nap[r.id] = A.S.year + 10;
    A.log(`On your counsel, a ten-year pact of non-aggression with ${t.name}.`, "good");
  }
  A.fame(pc, 1);
  return {
    ok: true,
    msg: "The crown agrees.",
  };
};

A.DMEM = {
  gift: ["Gifts and embassies", 4],
  insult: ["An insult to our crown", 6],
  betrayal: ["Betrayed us", 25],
  broke_pact: ["Broke a sworn pact", 14],
  comrades: ["Fought beside us", 12],
  enemy_war: ["Fought against us", 10],
  took_land: ["Took our land", 30],
  wedding: ["A royal wedding", 15],
  abandoned: ["Abandoned us in war", 15],
  saved: ["Came to our aid", 15],
  incident: ["A border incident", 5],
  spies: ["Caught spying on us", 6],
  summit: ["Friendship at a gathering", 6],
  subsidy: ["Pays us a subsidy", 3],
  embargo: ["Embargoes our trade", 4],
  guarantee: ["Guarantees our freedom", 5],
  rival: ["Declared rivals", 25],
  coronation: ["Honored our coronation", 5],
  aid: ["Helped us in need", 8],
  snub: ["Snubbed us", 4],
  peace: ["An honest peace", 6],
  justify: ["Forging claims on us", 6],
  marriage_refused: ["Refused a match", 5],
  trade_war: ["Trade war", 5],
  hostage: ["Holds our hostage", 8],
  rescue: ["Rescued our people", 8],
};

A.dInit = function (r) {
  if (!r) return r;
  if (A.polInit) A.polInit(r);
  r.mem = r.mem || {};
  r.tr = r.tr || {
    def: {},
    access: {},
    guar: {},
    sub: {},
    emb: {},
  };
  for (const k of ["def", "access", "guar", "sub", "emb"]) r.tr[k] = r.tr[k] || {};
  r.cbs = r.cbs || {};
  r.rivals = r.rivals || [];
  return r;
};

A.dAll = function () {
  for (const id in A.S.realms) A.dInit(A.S.realms[id]);
};

A.remember = function (a, b, k, v, mutual) {
  const ra = A.realm(a);
  if (!ra || !A.realm(b) || a === b) return;
  A.dInit(ra);
  const L = (ra.mem[b] = ra.mem[b] || []),
    m = L.find(x => x.k === k),
    cap = Math.max(Math.abs(v) * 2.2, 30);
  if (m) {
    m.v = A.clamp(m.v + v, -cap, cap);
    m.y = A.S.year;
  } else
    L.push({
      k,
      v,
      y: A.S.year,
    });
  if (mutual) A.remember(b, a, k, v, false);
};

A.memSum = function (a, b) {
  const r = A.realm(a);
  if (!r || !r.mem || !r.mem[b]) return 0;
  let s = 0;
  for (const m of r.mem[b]) s += m.v;
  return s;
};

A.relBetween = function (a, b) {
  const r = A.realm(a),
    v = r && r.rel[b] != null ? r.rel[b] : 0,
    m = A.memSum(a, b);
  return m ? A.clamp(Math.round(v + m), -100, 100) : v;
};

A.opinionParts = function (a, b) {
  const ra = A.dInit(A.realm(a)),
    rb = A.dInit(A.realm(b));
  if (!ra || !rb) return [];
  const out = [],
    base = ra.rel[b] || 0;
  out.push(["History and old grudges", Math.round(base)]);
  for (const m of ra.mem[b] || [])
    out.push([(A.DMEM[m.k] || [m.k])[0] + (A.S.year - m.y > 0 ? ` (${A.S.year - m.y}y ago)` : ""), Math.round(m.v)]);
  return out;
};

A.realmStanding = function (a, b) {
  const ra = A.realm(a),
    rb = A.realm(b),
    out = [];
  if (!ra || !rb) return out;
  if (ra.faith && rb.faith) out.push(ra.faith === rb.faith ? ["Same faith", 6] : ["Different faith", -4]);
  if (ra.race && rb.race && ra.race !== rb.race) out.push(["Another people", -3]);
  if (A.neighbors(a).includes(b)) out.push(["Shared border", -3]);
  if (ra.allies.includes(b)) out.push(["Allies", 8]);
  if (A.hasTrade(a, b)) out.push(["Trade partners", 4]);
  if (ra.marriages && ra.marriages[b]) out.push(["Royal kin", 8]);
  if (ra.rivals.includes(b)) out.push(["Rivals", -15]);
  const common = ra.rivals.filter(x => rb.rivals.includes(x));
  if (common.length) out.push([`Common rival: ${A.realmShort(common[0])}`, 10]);
  if (A.claimsOn(a, b).length) out.push(["They hold our land", -8]);
  if ((rb.infamy || 0) > 25) out.push([`Their infamy (${Math.round(rb.infamy)})`, -Math.round(rb.infamy / 6)]);
  if (A.realmPower(rb) / Math.max(1, A.realmPower(ra)) > 2.2 && A.neighbors(a).includes(b))
    out.push(["They are dangerously strong", -6]);
  return out;
};

A.memYear = function () {
  for (const id in A.S.realms) {
    const r = A.S.realms[id];
    if (r.mem)
      for (const o in r.mem) {
        const L = r.mem[o];
        for (const m of L) {
          const half = (A.DMEM[m.k] || ["", 6])[1];
          m.v *= Math.pow(0.5, 1 / half);
        }
        r.mem[o] = L.filter(m => Math.abs(m.v) >= 1);
        if (!r.mem[o].length || !A.realm(o) || !A.realm(o).alive) delete r.mem[o];
      }
  }
};

A.TREATY = {
  ally: {
    name: "Alliance",
    desc: "Each comes to the other's aid in any war.",
  },
  def: {
    name: "Defensive pact",
    desc: "Each defends the other if attacked — but owes nothing in a war of conquest.",
  },
  guar: {
    name: "Guarantee",
    desc: "A strong crown promises to defend a weaker one's independence.",
  },
  access: {
    name: "Military access",
    desc: "Armies may march through and draw supply.",
  },
  nap: {
    name: "Non-aggression pact",
    desc: "Ten years without war. Breaking it shames you everywhere.",
  },
  trade: {
    name: "Trade pact",
    desc: "Open markets: about 4% more income for both.",
  },
  sub: {
    name: "Subsidy",
    desc: "Gold paid each month to a friend at war or in need.",
  },
  emb: {
    name: "Embargo",
    desc: "Closed markets against a rival: costs them income, and costs you some too.",
  },
  marriage: {
    name: "Royal marriage",
    desc: "The crowns become kin. Opinion rises for a generation.",
  },
  trib: {
    name: "Tribute",
    desc: "The weaker pays the stronger 8% of its income each year.",
  },
  rival: {
    name: "Rivalry",
    desc: "A declared enemy. Beating them brings glory; their friends become yours to court.",
  },
};

A.hasTr = function (a, b, k) {
  const r = A.realm(a);
  if (!r) return false;
  if (k === "ally") return r.allies.includes(b);
  if (k === "nap") return A.hasNap(a, b);
  if (k === "trade") return A.hasTrade(a, b);
  if (k === "marriage") return !!(r.marriages && r.marriages[b]);
  if (k === "trib") return r.overlord === b;
  if (k === "rival") return (r.rivals || []).includes(b);
  A.dInit(r);
  const v = r.tr[k] && r.tr[k][b];
  return v ? (typeof v == "object" ? v.until : v) > A.S.year : false;
};

A.sign = function (k, a, b, opts) {
  opts = opts || {};
  const ra = A.dInit(A.realm(a)),
    rb = A.dInit(A.realm(b));
  if (!ra || !rb || a === b) return false;
  const Y = A.S.year;
  // [X1 baked patch core/09-engine-at-scale SCALE-EMBARGO-ADD] Embargoes are counted from a list of the realms that
  // have ever laid one (09-engine-at-scale), so the list must grow the moment a realm lays its first. A.sign is the
  // only place that writes an embargo; lifting one only deletes, which cannot make the list too short.
  switch (k) {
    case "ally":
      A.ally(a, b);
      break;
    case "nap":
      ra.pacts.nap[b] = Y + 10;
      rb.pacts.nap[a] = Y + 10;
      break;
    case "trade":
      ra.pacts.trade[b] = Y + 15;
      rb.pacts.trade[a] = Y + 15;
      delete ra.tr.emb[b];
      delete rb.tr.emb[a];
      A.updateRealmPops();
      break;
    case "def":
      ra.tr.def[b] = Y + (opts.years || 12);
      rb.tr.def[a] = ra.tr.def[b];
      break;
    case "access":
      ra.tr.access[b] = Y + (opts.years || 6);
      rb.tr.access[a] = ra.tr.access[b];
      break;
    case "guar":
      ra.tr.guar[b] = Y + (opts.years || 15);
      A.remember(b, a, "guarantee", 12);
      break;
    case "sub":
      ra.tr.sub[b] = {
        until: Y + (opts.years || 3),
        amt: opts.amt || Math.round(Math.max(600, ra.income * 0.03)),
      };
      A.remember(b, a, "subsidy", 10);
      break;
    case "emb":
      ra.tr.emb[b] = Y + (opts.years || 5);
      if (A.scaleEmbAdd) A.scaleEmbAdd(ra);
      delete ra.pacts.trade[b];
      delete rb.pacts.trade[a];
      A.remember(b, a, "embargo", -15);
      A.updateRealmPops();
      break;
    case "marriage":
      ra.marriages[b] = Y;
      rb.marriages[a] = Y;
      A.remember(a, b, "wedding", 18, true);
      break;
    case "rival":
      if (!ra.rivals.includes(b)) ra.rivals.push(b);
      if (!rb.rivals.includes(a)) rb.rivals.push(a);
      A.remember(a, b, "rival", -15, true);
      break;
    case "trib":
      ra.overlord = b;
      A.unally(a, b);
      A.remember(a, b, "tribute", -12);
      break;
    default:
      return false;
  }
  if (!opts.silent) {
    const where = opts.at ? ` at ${opts.at}` : "",
      txt = {
        ally: `${ra.short} and ${rb.short} swear an alliance${where}.`,
        nap: `${ra.short} and ${rb.short} sign a ten-year pact of non-aggression${where}.`,
        trade: `${ra.short} and ${rb.short} open their markets to each other${where}.`,
        def: `${ra.short} and ${rb.short} sign a defensive pact${where}.`,
        access: `${ra.short} and ${rb.short} grant each other military access${where}.`,
        guar: `${ra.short} guarantees the independence of ${rb.short}${where}.`,
        sub: `${ra.short} begins paying a subsidy to ${rb.short}${where}.`,
        emb: `${ra.short} closes its markets to ${rb.short}: an embargo.`,
        marriage: `A royal marriage binds ${ra.short} and ${rb.short}${where}.`,
        rival: `${ra.short} and ${rb.short} declare each other rivals.`,
        trib: `${ra.name} becomes a tributary of ${rb.name}${where}.`,
      }[k];
    if (txt) A.news(txt, k === "emb" || k === "rival" ? "war" : "crown");
    const pc = A.pc();
    if (pc && (pc.realm === a || pc.realm === b) && txt && A.classOf(pc) >= 5)
      A.log(txt, k === "emb" || k === "rival" ? "warn" : "good");
  }
  return true;
};

A.cancelTr = function (k, a, b, silent) {
  const ra = A.dInit(A.realm(a)),
    rb = A.dInit(A.realm(b));
  if (!(!ra || !rb)) {
    switch (k) {
      case "ally":
        A.unally(a, b);
        break;
      case "nap":
        delete ra.pacts.nap[b];
        delete rb.pacts.nap[a];
        break;
      case "trade":
        delete ra.pacts.trade[b];
        delete rb.pacts.trade[a];
        A.updateRealmPops();
        break;
      case "def":
      case "access":
        delete ra.tr[k][b];
        delete rb.tr[k][a];
        break;
      case "guar":
      case "sub":
      case "emb":
        delete ra.tr[k][b];
        if (k === "emb") A.updateRealmPops();
        break;
      case "rival":
        ra.rivals = ra.rivals.filter(x => x !== b);
        rb.rivals = rb.rivals.filter(x => x !== a);
        break;
    }
    if (!silent)
      A.news(
        {
          ally: `The alliance between ${ra.short} and ${rb.short} is dissolved.`,
          def: `${ra.short} lets its defensive pact with ${rb.short} lapse.`,
          guar: `${ra.short} withdraws its guarantee of ${rb.short}.`,
          sub: `${ra.short} stops paying ${rb.short}'s subsidy.`,
          emb: `${ra.short} lifts its embargo on ${rb.short}.`,
          access: `${ra.short} and ${rb.short} close their borders to each other's armies.`,
          trade: `${ra.short} and ${rb.short} end their trade pact.`,
          nap: `${ra.short} renounces its pact with ${rb.short}.`,
          rival: `${ra.short} and ${rb.short} bury their rivalry.`,
        }[k] || "",
        "crown",
      );
  }
};

A.treatiesOf = function (a, b) {
  return Object.keys(A.TREATY).filter(
    k => A.hasTr(a, b, k) || (["guar", "sub", "emb"].includes(k) && A.hasTr(b, a, k)),
  );
};

Object.assign(A.CB, {
  incident: "Avenge a border incident",
  justified: "Pressed claim",
  rivalry: "Settle a rivalry",
  betrayal: "Treachery",
  none: "War without a reason",
});

A.cbOn = function (a, b) {
  const ra = A.dInit(A.realm(a)),
    rb = A.realm(b);
  if (!ra || !rb) return null;
  if (A.claimsOn(a, b).length) return "reconquest";
  const c = ra.cbs[b];
  return c && A.S.year - c.y <= 5
    ? c.k
    : ra.rivals.includes(b)
      ? "rivalry"
      : ra.faith && rb.faith && ra.faith !== rb.faith && ["REL-01", "REL-02", "REL-07", "REL-17"].includes(ra.faith)
        ? "holy"
        : null;
};

A.grantCB = function (a, b, k) {
  const r = A.dInit(A.realm(a));
  if (r)
    r.cbs[b] = {
      k: k || "incident",
      y: A.S.year,
    };
};

A.warPreview = function (a, b) {
  const ra = A.dInit(A.realm(a)),
    rb = A.dInit(A.realm(b));
  if (!ra || !rb) return null;
  const S = A.S,
    notes = [],
    cb = A.cbOn(a, b) || "none";
  let inf =
      {
        reconquest: 2,
        incident: 3,
        insult: 3,
        justified: 3,
        rivalry: 3,
        holy: 4,
        tribute: 2,
        none: 9,
      }[cb] || 6,
    stab = cb === "none" ? -6 : 0,
    legit = cb === "none" ? -4 : 0;
  if (cb === "holy") stab += 2;
  const betray = ra.allies.includes(b) || A.hasTr(a, b, "def");
  if (betray) {
    stab -= 8;
    legit -= 8;
    inf += 8;
    notes.push(["Betrays a sworn ally: every court will call you faithless", "bad"]);
  }
  if (ra.truce[b] && ra.truce[b] > S.year) {
    stab -= 10;
    legit -= 10;
    notes.push([`Breaks the truce (until ${ra.truce[b]})`, "bad"]);
  }
  if (A.hasNap(a, b)) {
    stab -= 6;
    notes.push(["Breaks a non-aggression pact: all realms think less of you", "bad"]);
  }
  if (A.hasTr(b, a, "guar")) notes.push(["You guarantee them yourself!", "bad"]);
  if (cb === "none") notes.push(["No reason the world accepts: infamy, unrest, a doubtful realm", "bad"]);
  else notes.push([`Reason: ${A.CB[cb]}`, "good"]);
  const def = [],
    att = [];
  for (const id in S.realms) {
    const o = S.realms[id];
    if (!o.alive || id === a || id === b || o.isRebel) continue;
    A.dInit(o);
    let p = 0,
      why = "";
    if (o.allies.includes(b)) {
      // [X1 baked patch diplomacy/20-ai-personality AIP-CALL-TO-ARMS] callToArmsNow and A.warPreview: honorable rulers
      // answer calls to arms more often, craven ones less (A.aiCallAdj); warlike allies join offensive wars more often;
      // each answer is logged with reasons.
      p = A.clamp(
        0.45 +
          A.relBetween(id, b) / 200 -
          (A.atWar(id).length ? 0.3 : 0) -
          (A.relBetween(id, a) > 40 ? 0.25 : 0) +
          A.aiCallAdj(id),
        0.05,
        0.95,
      );
      why = "ally";
    }
    if (A.hasTr(id, b, "def")) {
      p = Math.max(p, 0.85);
      why = "defensive pact";
    }
    if (A.hasTr(id, b, "guar")) {
      p = Math.max(p, 0.75);
      why = "guarantee";
    }
    if (rb.overlord === id) {
      p = Math.max(p, 0.95);
      why = "overlord";
    }
    if (o.overlord === b) {
      p = Math.max(p, 0.9);
      why = "tributary";
    }
    const co = (S.coalitions || {})[a];
    if (
      (co && co.includes(id) && co.includes(b) && ((p = Math.max(p, 0.75)), (why = "coalition")),
      p > 0 &&
        def.push({
          id,
          p: Math.round(p * 100),
          why,
        }),
      o.allies.includes(a) && !o.allies.includes(b))
    ) {
      // [X1 baked patch diplomacy/20-ai-personality AIP-CALL-TO-ARMS] callToArmsNow and A.warPreview: honorable rulers
      // answer calls to arms more often, craven ones less (A.aiCallAdj); warlike allies join offensive wars more often;
      // each answer is logged with reasons.
      const q = A.relBetween(id, a) > 50 && A.relBetween(id, b) < 0 ? Math.round(100 * A.aiJoinP(id)) : 10;
      att.push({
        id,
        p: q,
        why: "ally",
      });
    }
    if (o.overlord === a)
      att.push({
        id,
        p: 70,
        why: "tributary",
      });
  }
  def.sort((x, y) => y.p - x.p);
  att.sort((x, y) => y.p - x.p);
  const powA = A.realmPower(ra) + att.reduce((s, x) => s + (A.realmPower(A.realm(x.id)) * x.p) / 100, 0),
    powD = A.realmPower(rb) + def.reduce((s, x) => s + (A.realmPower(A.realm(x.id)) * x.p) / 100, 0);
  return {
    cb,
    inf,
    stab,
    legit,
    betray,
    notes,
    def,
    att,
    powA,
    powD,
    ratio: powA / Math.max(1, powD),
  };
};

A.declareWar = function (a, b, opts) {
  opts = opts || {};
  const ra = A.dInit(A.realm(a)),
    rb = A.dInit(A.realm(b)),
    S = A.S;
  if (!ra || !rb || !rb.alive || a === b)
    return {
      ok: false,
      msg: "Not possible.",
    };
  if (A.hostile(a, b))
    return {
      ok: false,
      msg: "You are already at war with them.",
    };
  const P = A.warPreview(a, b),
    cb = opts.cb || P.cb;
  if (P.betray) {
    A.cancelTr("ally", a, b, true);
    A.cancelTr("def", a, b, true);
    A.remember(b, a, "betrayal", -45);
    for (const id in S.realms) if (id !== a && id !== b && S.realms[id].alive) A.remember(id, a, "betrayal", -12);
    A.news(`Treachery! ${ra.name} turns on its own ally ${rb.name}.`, "war");
  }
  if ((ra.truce[b] && ra.truce[b] > S.year && delete ra.truce[b], A.hasNap(a, b))) {
    A.cancelTr("nap", a, b, true);
    for (const id in S.realms) if (id !== a && S.realms[id].alive) A.remember(id, a, "broke_pact", id === b ? -25 : -8);
  }
  ra.stability = A.clamp(ra.stability + P.stab, 0, 100);
  ra.legit = A.clamp(ra.legit + P.legit, 0, 100);
  ra.infamy = A.clamp((ra.infamy || 0) + P.inf, 0, 100);
  if (ra.cbs[b]) delete ra.cbs[b];
  const w = A.startWar(a, b, opts.name || null, cb === "none" ? "conquest" : cb, opts.war || {});
  return w
    ? ((w.cbReal = cb),
      {
        ok: true,
        msg: `War! ${w.name}.`,
        w,
      })
    : {
        ok: false,
        msg: "War could not be declared.",
      };
};

A.callExtra = function (w) {
  const S = A.S,
    att = w.leadA,
    def = w.leadD,
    ra = A.realm(att);
  if (ra && (ra.infamy || 0) >= 50)
    for (const m of (S.coalitions || {})[att] || []) {
      const o = A.realm(m);
      // [X1 baked patch core/09-engine-at-scale WORLD-REACH] Neighbours (land or sea lane) could declare war, a
      // coalition took in the neighbours of neighbours, and an ally or tributary (or a partner in a defensive pact, a
      // guarantee or a league) answered a call to arms from anywhere. On the Great Continent that made coalitions of 25
      // realms from six lands and allies marching 3,000 km to a war with no front. A.outOfReach (false on the Known
      // World) keeps all three to realms whose land comes within 1,500 km of the other side.
      if (
        o &&
        o.alive &&
        !o.playerRun &&
        !w.att.includes(m) &&
        !w.def.includes(m) &&
        !A.atWar(m).length &&
        !(A.outOfReach && A.outOfReach(m, att)) &&
        A.chance(0.4)
      ) {
        w.def.push(m);
        A.news(`${o.name} joins the war against ${ra.short}, as the league agreed.`, "war");
      }
    }
  // [X1 baked patch core/09-engine-at-scale WORLD-REACH] Neighbours (land or sea lane) could declare war, a
  // coalition took in the neighbours of neighbours, and an ally or tributary (or a partner in a defensive pact, a
  // guarantee or a league) answered a call to arms from anywhere. On the Great Continent that made coalitions of 25
  // realms from six lands and allies marching 3,000 km to a war with no front. A.outOfReach (false on the Known
  // World) keeps all three to realms whose land comes within 1,500 km of the other side.
  const join = (side, rid, why) => {
    const r = A.realm(rid);
    if (
      !(
        !r ||
        !r.alive ||
        (A.outOfReach && A.outOfReach(rid, side === "att" ? def : att)) ||
        w.att.includes(rid) ||
        w.def.includes(rid) ||
        r.playerRun ||
        (side === "att" ? w.def : w.att).some(x => A.friendly(x, rid) && A.atWar(rid).length)
      )
    ) {
      w[side].push(rid);
      A.remember(side === "def" ? def : att, rid, "saved", 14);
      A.news(`${r.name} ${why}.`, "war");
    }
  };
  for (const id in S.realms) {
    const o = S.realms[id];
    if (!(!o.alive || id === att || id === def)) {
      A.dInit(o);
      if (A.hasTr(id, def, "def") && !A.hasTr(id, att, "def") && A.chance(0.85 - (A.atWar(id).length ? 0.3 : 0)))
        join("def", id, `honors its defensive pact with ${A.realmShort(def)}`);
      else {
        if (A.hasTr(id, def, "guar") && A.chance(0.7 - (A.atWar(id).length ? 0.3 : 0) + A.relBetween(id, def) / 300))
          join("def", id, `keeps its guarantee and marches to defend ${A.realmShort(def)}`);
        else {
          if (A.hasTr(id, def, "guar") || A.hasTr(id, def, "def")) {
            A.remember(def, id, "abandoned", -25);
            if (A.hasTr(id, def, "def")) A.cancelTr("def", id, def, true);
            else A.cancelTr("guar", id, def, true);
            A.news(`${o.name} fails to answer ${A.realmShort(def)}'s call.`, "crown");
          }
        }
      }
    }
  }
  const pc = A.pc(),
    pr = pc && pc.ruler && A.realm(pc.ruler);
  if (
    pr &&
    pr.id !== att &&
    pr.id !== def &&
    !w.att.includes(pr.id) &&
    !w.def.includes(pr.id) &&
    (A.hasTr(pr.id, def, "def") || A.hasTr(pr.id, def, "guar"))
  )
    A.queue({
      type: "choice",
      title: "Your word is called",
      text: `${A.realmName(att)} has attacked ${A.realmName(def)}. You are bound to defend them by ${A.hasTr(pr.id, def, "def") ? "a defensive pact" : "your guarantee"}. Their envoy waits in your hall.`,
      options: [
        {
          t: `Keep your word: war with ${A.realmShort(att)}`,
          fn: "callJoin",
          arg: {
            w: w.id,
            side: "def",
            r: pr.id,
          },
        },
        {
          t: "Break it (they will remember; so will everyone)",
          fn: "dBreakWord",
          arg: {
            def,
            r: pr.id,
          },
        },
      ],
    });
};

A.on("callToArms", (w, opts) => {
  if (!(opts && opts.noAllies)) A.callExtra(w);
});

A.CHOICE_FN = A.CHOICE_FN || {};

A.CHOICE_FN.dBreakWord = function (arg) {
  A.remember(arg.def, arg.r, "abandoned", -30);
  A.cancelTr("def", arg.r, arg.def, true);
  A.cancelTr("guar", arg.r, arg.def, true);
  for (const id in A.S.realms) if (id !== arg.r && A.S.realms[id].alive) A.remember(id, arg.r, "broke_pact", -5);
  const r = A.realm(arg.r);
  if (r) r.legit = Math.max(0, r.legit - 6);
  A.log("You stay out of it. The word goes round the courts that your promises are paper.", "bad");
};

A.on("warStart", (w, opts) => {
  if (opts && opts.silent) return;
  const att = w.leadA,
    def = w.leadD;
  A.remember(def, att, "enemy_war", -20);
  const ra = A.realm(att);
  if (ra && ra.rivals && ra.rivals.includes(def)) w.rivalry = true;
});

A.on("warEnd", (w, result, text, live) => {
  if (!live) return;
  for (const s of ["att", "def"]) {
    const L = w[s];
    for (const x of L) for (const y of L) if (x !== y) A.remember(x, y, "comrades", 6);
  }
  if (result === "white") A.remember(w.leadA, w.leadD, "peace", 6, true);
  const win = result === "att" ? w.leadA : result === "def" ? w.leadD : null,
    lose = result === "att" ? w.leadD : result === "def" ? w.leadA : null,
    rw = win && A.realm(win);
  if (rw && rw.rivals && rw.rivals.includes(lose)) {
    rw.legit = Math.min(100, rw.legit + 10);
    rw.stability = Math.min(100, rw.stability + 4);
    A.news(`${rw.name} humbles its rival ${A.realmShort(lose)}.`, "crown");
  }
  if (w.att.length + w.def.length >= 3 && A.callGathering)
    A.callGathering(A.realm(win || w.leadD) ? win || w.leadD : w.leadA, "congress", null, null, {
      war: w,
      parts: w.att.concat(w.def),
    });
});

A.on("provTransfer", (prov, from, to) => {
  if (from && to && from !== to && A.realm(from) && A.realm(to)) A.remember(from, to, "took_land", -10);
});

A.threatsTo = function (rid) {
  const S = A.S,
    key = A.absDay ? A.absDay() : S.year;
  if (
    ((!A._thr || A._thr.key !== key) &&
      (A._thr = {
        key,
        m: {},
      }),
    A._thr.m[rid])
  )
    return A._thr.m[rid];
  const r = A.realm(rid);
  if (!r) return [];
  const near = new Set(A.neighbors(rid));
  for (const n of [...near]) for (const m of A.neighbors(n)) near.add(m);
  near.delete(rid);
  const pr = A.realmPower(r),
    out = [];
  for (const id of near) {
    const o = A.realm(id);
    if (!o || !o.alive || o.isRebel) continue;
    if (A.hostile(rid, id)) {
      out.push(id);
      continue;
    }
    // [X1 baked patch diplomacy/20-ai-personality AIP-INTEREST] A.interest and A.interestParts (the "what they want
    // from you" list and every offer's odds) add the ruler's character from A.aiInterestParts, and judge "too hungry"
    // by the ruler persona instead of A.AGGRO; A.threatsTo does the same, and cautious rulers see threats sooner.
    const ratio = A.realmPower(o) / Math.max(1, pr),
      hostileMind =
        A.relBetween(rid, id) < -10 || A.aiWarW(id) > 1.1 || (o.infamy || 0) > 25 || (o.rivals || []).includes(rid);
    // [X1 baked patch diplomacy/20-ai-personality AIP-INTEREST] A.interest and A.interestParts (the "what they want
    // from you" list and every offer's odds) add the ruler's character from A.aiInterestParts, and judge "too hungry"
    // by the ruler persona instead of A.AGGRO; A.threatsTo does the same, and cautious rulers see threats sooner.
    if (ratio > A.aiFearAt(rid) && hostileMind && !r.allies.includes(id) && r.overlord !== id) out.push(id);
  }
  A._thr.m[rid] = out;
  return out;
};

A.interest = function (a, b) {
  const ra = A.dInit(A.realm(a)),
    rb = A.dInit(A.realm(b));
  if (!ra || !rb) return -100;
  let v = A.relBetween(a, b) * 0.6;
  const ta = A.threatsTo(a),
    tb = A.threatsTo(b);
  if (ta.includes(b)) v -= 40;
  if (ta.some(x => x !== b && (tb.includes(x) || A.relBetween(b, x) < -30))) v += 25;
  if (ra.rivals.some(x => rb.rivals.includes(x))) v += 15;
  if (ra.rivals.includes(b)) v -= 40;
  if (ra.marriages && ra.marriages[b]) v += 10;
  if (ra.faith && ra.faith === rb.faith) v += 6;
  if (A.hasTrade(a, b)) v += 5;
  if (A.atWar(b).some(w => (A.warSide(w, b) === "att" ? w.def : w.att).some(f => ra.allies.includes(f) || f === a)))
    v -= 25;
  const ratio = A.realmPower(rb) / Math.max(1, A.realmPower(ra));
  v += A.clamp((ratio - 0.4) * 10, -6, 12);
  // [X1 baked patch diplomacy/20-ai-personality AIP-INTEREST] A.interest and A.interestParts (the "what they want
  // from you" list and every offer's odds) add the ruler's character from A.aiInterestParts, and judge "too hungry"
  // by the ruler persona instead of A.AGGRO; A.threatsTo does the same, and cautious rulers see threats sooner.
  if (A.neighbors(a).includes(b) && ratio > 2.5 && A.aiWarW(b) > 1.1) v -= 15;
  return v + A.aiInterestSum(a, b);
};

A.dLive = () => Object.values(A.S.realms).filter(r => r.alive && !r.isRebel);

A.diploAI = function (n) {
  const S = A.S,
    live = A.dLive(),
    pc = A.pc(),
    pr = pc && pc.ruler ? A.realm(pc.ruler) : null,
    ask = (r, kind, extra) => {
      if (!pr || !pr.playerRun || !A.queueAiOffer) return;
      pr.offerSeen = pr.offerSeen || {};
      const k = kind + r.id;
      if (!(pr.offerSeen[k] && S.year - pr.offerSeen[k] < 4)) {
        pr.offerSeen[k] = S.year;
        A.queueAiOffer(
          pc,
          pr,
          Object.assign(
            {
              kind,
              rid: r.id,
            },
            extra || {},
          ),
        );
      }
    };
  for (const r of A.shuffle(live.filter(x => !x.playerRun)).slice(0, n || 3)) {
    A.dInit(r);
    const nbs = A.neighbors(r.id),
      myPow = A.realmPower(r);
    for (const al of r.allies.slice()) {
      const o = A.realm(al);
      if (!o || !o.alive) {
        A.unally(r.id, al);
        continue;
      }
      // [X1 baked patch diplomacy/20-ai-personality AIP-DIPLO-AI] A.diploAI: keeping or breaking alliances (honor),
      // betraying an ally (war and honor), seeking alliances (sociability), defensive pacts (caution), guarantees
      // (honor, kindness), subsidies (greed), embargoes and rivalries (spite), trade and non-aggression pacts, burying
      // rivalries (peaceable rulers), submitting as a tributary (pride and caution) and forging claims (war and
      // patience) use the ruler persona; each act is logged with reasons.
      if (A.aiBreakAlly(r.id, al)) {
        A.cancelTr("ally", r.id, al);
        A.remember(al, r.id, "snub", -12);
        if (pr && pr.id === al)
          A.log(`${r.name} breaks off its alliance with you. Their envoy says only that "times have changed".`, "bad");
      }
    }
    // [X1 baked patch diplomacy/20-ai-personality AIP-DIPLO-AI] A.diploAI: keeping or breaking alliances (honor),
    // betraying an ally (war and honor), seeking alliances (sociability), defensive pacts (caution), guarantees
    // (honor, kindness), subsidies (greed), embargoes and rivalries (spite), trade and non-aggression pacts, burying
    // rivalries (peaceable rulers), submitting as a tributary (pride and caution) and forging claims (war and
    // patience) use the ruler persona; each act is logged with reasons.
    if (A.aiWarW(r.id) >= 1.15 && !A.atWar(r.id).length && r.stability > 35) {
      const t = r.allies
        .map(A.realm)
        .find(o => o && o.alive && nbs.includes(o.id) && A.realmPower(o) * 1.8 < myPow && A.interest(r.id, o.id) < 25);
      // [X1 baked patch diplomacy/20-ai-personality AIP-DIPLO-AI] A.diploAI: keeping or breaking alliances (honor),
      // betraying an ally (war and honor), seeking alliances (sociability), defensive pacts (caution), guarantees
      // (honor, kindness), subsidies (greed), embargoes and rivalries (spite), trade and non-aggression pacts, burying
      // rivalries (peaceable rulers), submitting as a tributary (pride and caution) and forging claims (war and
      // patience) use the ruler persona; each act is logged with reasons.
      if (t && A.chance(A.aiBetrayP(r.id))) {
        A.aiNoteBetray(
          r.id,
          t.id,
          A.declareWar(r.id, t.id, {
            cb: A.cbOn(r.id, t.id) || "betrayal",
          }),
        );
        continue;
      }
    }
    if (r.allies.length < 3) {
      let best = null,
        bv = 0;
      for (const t of live) {
        if (
          t.id === r.id ||
          r.allies.includes(t.id) ||
          t.allies.length >= 3 ||
          A.hostile(r.id, t.id) ||
          r.overlord === t.id ||
          t.overlord === r.id
        )
          continue;
        const v = Math.min(A.interest(r.id, t.id), A.interest(t.id, r.id) + 10);
        if (v > bv) {
          bv = v;
          best = t;
        }
      }
      // [X1 baked patch diplomacy/20-ai-personality AIP-DIPLO-AI] A.diploAI: keeping or breaking alliances (honor),
      // betraying an ally (war and honor), seeking alliances (sociability), defensive pacts (caution), guarantees
      // (honor, kindness), subsidies (greed), embargoes and rivalries (spite), trade and non-aggression pacts, burying
      // rivalries (peaceable rulers), submitting as a tributary (pride and caution) and forging claims (war and
      // patience) use the ruler persona; each act is logged with reasons.
      if (best && bv >= A.aiAllyBar(r.id) && A.chance(0.35)) {
        if (best.playerRun) ask(r, "ally");
        else {
          // [X1 baked patch diplomacy/20-ai-personality AIP-DIPLO-AI] A.diploAI: keeping or breaking alliances (honor),
          // betraying an ally (war and honor), seeking alliances (sociability), defensive pacts (caution), guarantees
          // (honor, kindness), subsidies (greed), embargoes and rivalries (spite), trade and non-aggression pacts, burying
          // rivalries (peaceable rulers), submitting as a tributary (pride and caution) and forging claims (war and
          // patience) use the ruler persona; each act is logged with reasons.
          if (A.callGathering && A.chance(0.35))
            A.callGathering(r.id, "summit", null, best.id, {
              aim: "ally",
            });
          else A.aiSign("ally", r.id, best.id);
        }
      }
    }
    const thr = A.threatsTo(r.id),
      nDef = Object.keys(r.tr.def).filter(k => r.tr.def[k] > S.year).length;
    // [X1 baked patch diplomacy/20-ai-personality AIP-DIPLO-AI] A.diploAI: keeping or breaking alliances (honor),
    // betraying an ally (war and honor), seeking alliances (sociability), defensive pacts (caution), guarantees
    // (honor, kindness), subsidies (greed), embargoes and rivalries (spite), trade and non-aggression pacts, burying
    // rivalries (peaceable rulers), submitting as a tributary (pride and caution) and forging claims (war and
    // patience) use the ruler persona; each act is logged with reasons.
    if (thr.length && nDef < 2 && A.chance(0.12 * A.aiDefW(r.id))) {
      const t = live
        .filter(
          o =>
            o.id !== r.id &&
            !r.allies.includes(o.id) &&
            !A.hasTr(r.id, o.id, "def") &&
            Object.keys(o.tr.def).filter(k => o.tr.def[k] > S.year).length < 2 &&
            !A.hostile(r.id, o.id) &&
            !thr.includes(o.id) &&
            A.threatsTo(o.id).some(x => thr.includes(x)) &&
            A.interest(r.id, o.id) > 22 &&
            A.interest(o.id, r.id) > 18,
        )
        .sort((x, y) => A.realmPower(y) - A.realmPower(x))[0];
      // [X1 baked patch diplomacy/20-ai-personality AIP-DIPLO-AI] A.diploAI: keeping or breaking alliances (honor),
      // betraying an ally (war and honor), seeking alliances (sociability), defensive pacts (caution), guarantees
      // (honor, kindness), subsidies (greed), embargoes and rivalries (spite), trade and non-aggression pacts, burying
      // rivalries (peaceable rulers), submitting as a tributary (pride and caution) and forging claims (war and
      // patience) use the ruler persona; each act is logged with reasons.
      if (t) {
        if (t.playerRun)
          ask(r, "defpact", {
            foe: thr[0],
          });
        else A.aiSign("def", r.id, t.id);
      }
    }
    // [X1 baked patch diplomacy/20-ai-personality AIP-DIPLO-AI] A.diploAI: keeping or breaking alliances (honor),
    // betraying an ally (war and honor), seeking alliances (sociability), defensive pacts (caution), guarantees
    // (honor, kindness), subsidies (greed), embargoes and rivalries (spite), trade and non-aggression pacts, burying
    // rivalries (peaceable rulers), submitting as a tributary (pride and caution) and forging claims (war and
    // patience) use the ruler persona; each act is logged with reasons.
    if (myPow > 0 && A.chance(0.15 * A.aiGuarW(r.id))) {
      const t = nbs
        .map(A.realm)
        .find(
          o =>
            o &&
            o.alive &&
            !o.isRebel &&
            A.realmPower(o) < myPow * 0.45 &&
            !A.hasTr(r.id, o.id, "guar") &&
            !A.hostile(r.id, o.id) &&
            A.threatsTo(o.id).some(x => r.rivals.includes(x) || A.threatsTo(r.id).includes(x)) &&
            A.interest(r.id, o.id) > 0,
        );
      // [X1 baked patch diplomacy/20-ai-personality AIP-DIPLO-AI] A.diploAI: keeping or breaking alliances (honor),
      // betraying an ally (war and honor), seeking alliances (sociability), defensive pacts (caution), guarantees
      // (honor, kindness), subsidies (greed), embargoes and rivalries (spite), trade and non-aggression pacts, burying
      // rivalries (peaceable rulers), submitting as a tributary (pride and caution) and forging claims (war and
      // patience) use the ruler persona; each act is logged with reasons.
      if (t) A.aiSign("guar", r.id, t.id);
    }
    // [X1 baked patch diplomacy/20-ai-personality AIP-DIPLO-AI] A.diploAI: keeping or breaking alliances (honor),
    // betraying an ally (war and honor), seeking alliances (sociability), defensive pacts (caution), guarantees
    // (honor, kindness), subsidies (greed), embargoes and rivalries (spite), trade and non-aggression pacts, burying
    // rivalries (peaceable rulers), submitting as a tributary (pride and caution) and forging claims (war and
    // patience) use the ruler persona; each act is logged with reasons.
    if (r.treasury > r.income * 0.4 && A.chance(A.aiGiveP(r.id))) {
      const t = live.find(
        o =>
          o.id !== r.id &&
          !A.hasTr(r.id, o.id, "sub") &&
          A.atWar(o.id).some(w =>
            (A.warSide(w, o.id) === "att" ? w.def : w.att).some(
              f => r.rivals.includes(f) || A.threatsTo(r.id).includes(f),
            ),
          ) &&
          A.interest(r.id, o.id) > 15 &&
          !A.atWar(r.id).length,
      );
      // [X1 baked patch diplomacy/20-ai-personality AIP-DIPLO-AI] A.diploAI: keeping or breaking alliances (honor),
      // betraying an ally (war and honor), seeking alliances (sociability), defensive pacts (caution), guarantees
      // (honor, kindness), subsidies (greed), embargoes and rivalries (spite), trade and non-aggression pacts, burying
      // rivalries (peaceable rulers), submitting as a tributary (pride and caution) and forging claims (war and
      // patience) use the ruler persona; each act is logged with reasons.
      if (t)
        A.aiSign("sub", r.id, t.id, {
          amt: Math.round(Math.max(600, r.income * 0.04)),
          years: 2,
        });
    }
    // [X1 baked patch diplomacy/20-ai-personality AIP-DIPLO-AI] A.diploAI: keeping or breaking alliances (honor),
    // betraying an ally (war and honor), seeking alliances (sociability), defensive pacts (caution), guarantees
    // (honor, kindness), subsidies (greed), embargoes and rivalries (spite), trade and non-aggression pacts, burying
    // rivalries (peaceable rulers), submitting as a tributary (pride and caution) and forging claims (war and
    // patience) use the ruler persona; each act is logged with reasons.
    for (const rv of r.rivals)
      if (
        A.realm(rv) &&
        A.realm(rv).alive &&
        !A.hasTr(r.id, rv, "emb") &&
        A.relBetween(r.id, rv) < -35 &&
        (A.hasTrade(r.id, rv) || A.neighbors(r.id).includes(rv)) &&
        A.chance(0.035 * A.aiSpite(r.id))
      ) {
        A.aiSign("emb", r.id, rv);
        if (pr && pr.id === rv) A.log(`${r.name} closes its markets to your merchants. Your income suffers.`, "bad");
        break;
      }
    for (const oid of nbs) {
      const o = A.realm(oid);
      if (!o || !o.alive || o.isRebel || A.hostile(r.id, oid)) continue;
      const iv = A.interest(r.id, oid);
      // [X1 baked patch diplomacy/20-ai-personality AIP-DIPLO-AI] A.diploAI: keeping or breaking alliances (honor),
      // betraying an ally (war and honor), seeking alliances (sociability), defensive pacts (caution), guarantees
      // (honor, kindness), subsidies (greed), embargoes and rivalries (spite), trade and non-aggression pacts, burying
      // rivalries (peaceable rulers), submitting as a tributary (pride and caution) and forging claims (war and
      // patience) use the ruler persona; each act is logged with reasons.
      if (
        iv > 18 &&
        !A.hasTrade(r.id, oid) &&
        !A.hasTr(r.id, oid, "emb") &&
        !A.hasTr(oid, r.id, "emb") &&
        A.chance(0.06 * A.aiTradeW(r.id))
      ) {
        if (o.playerRun) ask(r, "trade");
        else A.aiSign("trade", r.id, oid);
      }
      const ratio = A.realmPower(o) / Math.max(1, myPow);
      // [X1 baked patch diplomacy/20-ai-personality AIP-DIPLO-AI] A.diploAI: keeping or breaking alliances (honor),
      // betraying an ally (war and honor), seeking alliances (sociability), defensive pacts (caution), guarantees
      // (honor, kindness), subsidies (greed), embargoes and rivalries (spite), trade and non-aggression pacts, burying
      // rivalries (peaceable rulers), submitting as a tributary (pride and caution) and forging claims (war and
      // patience) use the ruler persona; each act is logged with reasons.
      if (!A.hasNap(r.id, oid) && ratio > 1.4 && iv > -20 && iv < 40 && A.chance(0.05 * A.aiNapW(r.id))) {
        if (o.playerRun) ask(r, "nap");
        else A.aiSign("nap", r.id, oid);
      }
    }
    // [X1 baked patch diplomacy/20-ai-personality AIP-DIPLO-AI] A.diploAI: keeping or breaking alliances (honor),
    // betraying an ally (war and honor), seeking alliances (sociability), defensive pacts (caution), guarantees
    // (honor, kindness), subsidies (greed), embargoes and rivalries (spite), trade and non-aggression pacts, burying
    // rivalries (peaceable rulers), submitting as a tributary (pride and caution) and forging claims (war and
    // patience) use the ruler persona; each act is logged with reasons.
    if (
      (A.aiMendRival(r.id),
      r.rivals.filter(x => A.realm(x) && A.realm(x).alive).length < 2 && A.chance(0.08 * A.aiRivalW(r.id)))
    ) {
      const t = nbs
        .map(A.realm)
        .find(
          o =>
            o &&
            o.alive &&
            !o.isRebel &&
            !r.rivals.includes(o.id) &&
            A.relBetween(r.id, o.id) < -40 &&
            A.realmPower(o) / Math.max(1, myPow) > 0.5 &&
            A.realmPower(o) / Math.max(1, myPow) < 2,
        );
      // [X1 baked patch diplomacy/20-ai-personality AIP-DIPLO-AI] A.diploAI: keeping or breaking alliances (honor),
      // betraying an ally (war and honor), seeking alliances (sociability), defensive pacts (caution), guarantees
      // (honor, kindness), subsidies (greed), embargoes and rivalries (spite), trade and non-aggression pacts, burying
      // rivalries (peaceable rulers), submitting as a tributary (pride and caution) and forging claims (war and
      // patience) use the ruler persona; each act is logged with reasons.
      if (t) {
        A.aiSign("rival", r.id, t.id);
        if (pr && pr.id === t.id) A.log(`${r.name} names you its rival before all the courts of Ardan.`, "warn");
      }
    }
    // [X1 baked patch diplomacy/20-ai-personality AIP-DIPLO-AI] A.diploAI: keeping or breaking alliances (honor),
    // betraying an ally (war and honor), seeking alliances (sociability), defensive pacts (caution), guarantees
    // (honor, kindness), subsidies (greed), embargoes and rivalries (spite), trade and non-aggression pacts, burying
    // rivalries (peaceable rulers), submitting as a tributary (pride and caution) and forging claims (war and
    // patience) use the ruler persona; each act is logged with reasons.
    if (!r.overlord && !A.atWar(r.id).length && A.chance(0.04 * A.aiYield(r.id))) {
      // [X1 baked patch diplomacy/20-ai-personality AIP-DIPLO-AI] A.diploAI: keeping or breaking alliances (honor),
      // betraying an ally (war and honor), seeking alliances (sociability), defensive pacts (caution), guarantees
      // (honor, kindness), subsidies (greed), embargoes and rivalries (spite), trade and non-aggression pacts, burying
      // rivalries (peaceable rulers), submitting as a tributary (pride and caution) and forging claims (war and
      // patience) use the ruler persona; each act is logged with reasons.
      const strong = nbs
        .map(A.realm)
        .filter(
          o =>
            o &&
            o.alive &&
            !o.isRebel &&
            !o.overlord &&
            !o.playerRun &&
            A.realmPower(o) > myPow * 3 &&
            (A.aiWarW(o.id) > 1.1 || o.infamy > 20) &&
            A.relBetween(r.id, o.id) > -50,
        );
      // [X1 baked patch diplomacy/20-ai-personality AIP-DIPLO-AI] A.diploAI: keeping or breaking alliances (honor),
      // betraying an ally (war and honor), seeking alliances (sociability), defensive pacts (caution), guarantees
      // (honor, kindness), subsidies (greed), embargoes and rivalries (spite), trade and non-aggression pacts, burying
      // rivalries (peaceable rulers), submitting as a tributary (pride and caution) and forging claims (war and
      // patience) use the ruler persona; each act is logged with reasons.
      if (strong.length) A.aiSign("trib", r.id, A.pick(strong).id);
    }
    if (A.chance(0.03)) {
      const t = live.find(
        o =>
          o.id !== r.id &&
          !o.playerRun &&
          !(r.marriages && r.marriages[o.id]) &&
          A.interest(r.id, o.id) > 35 &&
          A.interest(o.id, r.id) > 30,
      );
      if (t && A.callGathering) A.callGathering(t.id, "wedding", null, r.id);
    }
    // [X1 baked patch diplomacy/20-ai-personality AIP-DIPLO-AI] A.diploAI: keeping or breaking alliances (honor),
    // betraying an ally (war and honor), seeking alliances (sociability), defensive pacts (caution), guarantees
    // (honor, kindness), subsidies (greed), embargoes and rivalries (spite), trade and non-aggression pacts, burying
    // rivalries (peaceable rulers), submitting as a tributary (pride and caution) and forging claims (war and
    // patience) use the ruler persona; each act is logged with reasons.
    if (
      A.aiWarW(r.id) >= 0.9 &&
      !r.justify &&
      !A.atWar(r.id).length &&
      A.chance(0.3 * A.aiWarW(r.id) * A.aiPlan(r.id))
    ) {
      const t = nbs
        .map(A.realm)
        .filter(
          o =>
            o &&
            o.alive &&
            !o.isRebel &&
            !A.cbOn(r.id, o.id) &&
            !r.allies.includes(o.id) &&
            A.relBetween(r.id, o.id) < -15 &&
            A.realmPower(o) < myPow * 1.2,
        )
        .sort((x, y) => A.relBetween(r.id, x.id) - A.relBetween(r.id, y.id))[0];
      // [X1 baked patch diplomacy/20-ai-personality AIP-DIPLO-AI] A.diploAI: keeping or breaking alliances (honor),
      // betraying an ally (war and honor), seeking alliances (sociability), defensive pacts (caution), guarantees
      // (honor, kindness), subsidies (greed), embargoes and rivalries (spite), trade and non-aggression pacts, burying
      // rivalries (peaceable rulers), submitting as a tributary (pride and caution) and forging claims (war and
      // patience) use the ruler persona; each act is logged with reasons.
      if (t) A.aiJustify(r.id, t.id);
    }
    if (A.atWar(r.id).length && A.chance(0.15)) {
      const foes = new Set();
      for (const w of A.atWar(r.id)) for (const f of A.warSide(w, r.id) === "att" ? w.def : w.att) foes.add(f);
      const t = nbs
        .map(A.realm)
        .find(
          o =>
            o &&
            o.alive &&
            !A.hostile(r.id, o.id) &&
            !A.friendly(r.id, o.id) &&
            !A.hasTr(r.id, o.id, "access") &&
            A.neighbors(o.id).some(x => foes.has(x)) &&
            A.interest(o.id, r.id) > 25 &&
            ![...foes].some(f => A.realm(o.id).allies.includes(f)),
        );
      if (t && !t.playerRun) A.sign("access", r.id, t.id);
      else {
        if (t && t.playerRun) ask(r, "access");
      }
    }
  }
};

A.overext = function (r) {
  if (!r) return 0;
  const ps = A.realmProvs(r.id);
  if (!ps.length) return 0;
  let n = 0,
    t = 0;
  for (const p of ps) {
    t += p.pop;
    if (p.orig && p.orig !== r.id) n += p.pop;
  }
  return t ? n / t : 0;
};

A.justifyDays = function (a) {
  const r = A.realm(a),
    ch = A.councilSkill ? A.councilSkill(r, "chancellor") : 20,
    sp = A.councilSkill ? A.councilSkill(r, "spymaster") : 10;
  return Math.round(A.clamp(150 - ch * 0.6 - sp * 0.4, 45, 150));
};

A.justifyCost = function (a) {
  const r = A.realm(a);
  return Math.round(500 + (r ? r.income * 0.01 : 0));
};

A.justifyStart = function (a, b, ai) {
  const r = A.dInit(A.realm(a)),
    t = A.realm(b);
  if (!r || !t || !t.alive)
    return {
      ok: false,
      msg: "Not possible.",
    };
  if (r.justify)
    return {
      ok: false,
      msg: `Your clerks are already busy with ${A.realmShort(r.justify.t)}.`,
    };
  if (A.cbOn(a, b))
    return {
      ok: false,
      msg: "You already have a reason for war with them.",
    };
  const c = A.justifyCost(a);
  if (r.treasury < c)
    return {
      ok: false,
      msg: `Forging a war goal costs ${A.fmt(c)}.`,
    };
  r.treasury -= c;
  const days = A.justifyDays(a);
  r.justify = {
    t: b,
    start: A.absDay(),
    done: A.absDay() + days,
  };
  if (!ai)
    A.log(
      `Your clerks begin digging up old charters and grievances against ${t.name}. It will take about ${Math.round(days / 30)} months.`,
    );
  return {
    ok: true,
    msg: `Justifying a war on ${t.short}: ~${Math.round(days / 30)} months.`,
  };
};

A.justifyMonth = function (r) {
  const j = r.justify;
  if (!j) return;
  const t = A.realm(j.t);
  if (!t || !t.alive || A.hostile(r.id, j.t)) {
    r.justify = null;
    return;
  }
  const sp = A.councilSkill ? A.councilSkill(t, "spymaster") : 10;
  if (!j.caught && A.chance(0.04 + sp / 1200)) {
    j.caught = true;
    A.remember(j.t, r.id, "justify", -12);
    A.news(`${t.short} accuses ${r.short} of forging claims against it.`, "crown");
    const pc = A.pc();
    if (pc && pc.realm === r.id && A.classOf(pc) >= 6)
      A.log(`${t.name} has found out what your clerks are doing. Relations sour.`, "warn");
  }
  if (A.absDay() >= j.done) {
    r.justify = null;
    A.grantCB(r.id, j.t, "justified");
    const pc = A.pc();
    if (pc && pc.ruler === r.id)
      A.log(
        `Your war goal against ${t.name} is ready. You may declare war with a reason the world accepts — for five years.`,
        "big",
      );
  }
};

A.aiWarCheck = function () {
  const S = A.S;
  // [X1 baked patch core/09-engine-at-scale WORLD-WAR-CAP] A.aiWarCheck stopped every realm from starting a war
  // while four wars were under way anywhere. Written for 35 realms; on the Great Continent the four were shared by
  // 153 realms and ten lands, and the cap was full on a fifth to a third of days. A.warCapFull gives each land its
  // share of the four (at least one), and is null on the Known World. A realm whose land is full makes no new war
  // (its neighbours are passed over; the shuffles draw as before).
  const capFull = A.warCapFull && A.warCapFull();
  if (!capFull && S.wars.filter(w => w.cb !== "throne").length >= 4) return;
  const live = A.dLive();
  // [X1 baked patch core/09-engine-at-scale WORLD-WAR-CAP] A.aiWarCheck stopped every realm from starting a war
  // while four wars were under way anywhere. Written for 35 realms; on the Great Continent the four were shared by
  // 153 realms and ten lands, and the cap was full on a fifth to a third of days. A.warCapFull gives each land its
  // share of the four (at least one), and is null on the Known World. A realm whose land is full makes no new war
  // (its neighbours are passed over; the shuffles draw as before).
  // [X1 baked patch diplomacy/20-ai-personality AIP-WAR-CHECK] A.aiWarCheck: the opinion bar (-25), the
  // war-weariness limit (30), the strength edge wanted (.7), the no-cause penalty (.6) and A.AGGRO now come from the
  // ruler persona; a declared war is logged with its top 3 reasons.
  for (const r of A.shuffle(live))
    if (
      !(
        r.playerRun ||
        A.atWar(r.id).length >= 1 ||
        r.exhaustion > A.aiWeary(r.id) ||
        r.stability < 30 ||
        A.aiResting(r)
      )
    )
      for (const oid of A.shuffle(A.neighbors(r.id))) {
        // [X1 baked patch core/09-engine-at-scale WORLD-REACH] Neighbours (land or sea lane) could declare war, a
        // coalition took in the neighbours of neighbours, and an ally or tributary (or a partner in a defensive pact, a
        // guarantee or a league) answered a call to arms from anywhere. On the Great Continent that made coalitions of 25
        // realms from six lands and allies marching 3,000 km to a war with no front. A.outOfReach (false on the Known
        // World) keeps all three to realms whose land comes within 1,500 km of the other side.
        const o = A.realm(oid);
        if (
          !o ||
          !o.alive ||
          o.isRebel ||
          (capFull && capFull(r)) ||
          (A.outOfReach && A.outOfReach(r.id, oid)) ||
          (r.truce[o.id] && r.truce[o.id] > S.year) ||
          r.allies.includes(o.id) ||
          A.hasTr(r.id, o.id, "def") ||
          (A.hasNap(r.id, o.id) && A.chance(0.9)) ||
          r.overlord === o.id ||
          o.overlord === r.id
        )
          continue;
        // [X1 baked patch diplomacy/68-reasons-for-war CB-WAR-ODDS] A.aiWarCheck: a crown that plans revenge for a line of
        // its feud ledger, or a war for its realm's want, waits for its moment and then strikes (casus.core.js). Three
        // hooks: the war preview of a planned target counts that target at 60% while its host is away at another war
        // (A.cbPreview, in place of A.warPreview); a want presses on the opinion bar the way a claim does (A.cbPress,
        // beside the claims term); and one more factor in the odds product (A.cbWarMul): up to x9 on the planned target
        // when the moment is good, x0.5 while it is not, x0.5 on any other neighbour while a plan stands, x1 to x4 (by
        // temper) on a neighbour remembered for an old wrong or wanted by a crown with no plan, and 0 on a realm the crown
        // owes an honoured debt. In the source: the same three terms in the war-chance calculation.
        const cb = A.cbOn(r.id, o.id),
          rel =
            A.relBetween(r.id, o.id) -
            A.claimsOn(r.id, o.id).length * 12 -
            (cb ? 10 : 0) -
            (A.cbPress ? A.cbPress(r.id, o.id) : 0);
        // [X1 baked patch diplomacy/20-ai-personality AIP-WAR-CHECK] A.aiWarCheck: the opinion bar (-25), the
        // war-weariness limit (30), the strength edge wanted (.7), the no-cause penalty (.6) and A.AGGRO now come from the
        // ruler persona; a declared war is logged with its top 3 reasons.
        // [X1 baked patch diplomacy/68-reasons-for-war CB-WAR-ODDS] A.aiWarCheck: a crown that plans revenge for a line of
        // its feud ledger, or a war for its realm's want, waits for its moment and then strikes (casus.core.js). Three
        // hooks: the war preview of a planned target counts that target at 60% while its host is away at another war
        // (A.cbPreview, in place of A.warPreview); a want presses on the opinion bar the way a claim does (A.cbPress,
        // beside the claims term); and one more factor in the odds product (A.cbWarMul): up to x9 on the planned target
        // when the moment is good, x0.5 while it is not, x0.5 on any other neighbour while a plan stands, x1 to x4 (by
        // temper) on a neighbour remembered for an old wrong or wanted by a crown with no plan, and 0 on a realm the crown
        // owes an honoured debt. In the source: the same three terms in the war-chance calculation.
        if (rel > A.aiWarBar(r.id) || A.hostile(r.id, o.id)) continue;
        const P = A.cbPreview ? A.cbPreview(r.id, o.id) : A.warPreview(r.id, o.id);
        let p = (0.11 / 12) * A.aiWarHaz(r.id) * A.clamp(P.ratio - A.aiNerve(r.id), 0, 2.5) * (1 + (-rel - 25) / 60);
        // [X1 baked patch diplomacy/20-ai-personality AIP-WAR-CHECK] A.aiWarCheck: the opinion bar (-25), the
        // war-weariness limit (30), the strength edge wanted (.7), the no-cause penalty (.6) and A.AGGRO now come from the
        // ruler persona; a declared war is logged with its top 3 reasons.
        // [X1 baked patch people/55-bonds BONDS-FEUD-WAR] A.aiWarCheck: after the rivalry factor, multiply the odds of
        // declaring war on a neighbour by A.feudWarMul(attacker, target): up to x1.6 (x2.1 for a wrathful ruler) against a
        // realm the attacker holds a generational grudge against (a capital taken, a heartland lost, a betrayal), down to
        // x0.4 toward one it owes a debt. In the source: one more factor in the war-chance product.
        // [X1 baked patch diplomacy/68-reasons-for-war CB-WAR-ODDS] A.aiWarCheck: a crown that plans revenge for a line of
        // its feud ledger, or a war for its realm's want, waits for its moment and then strikes (casus.core.js). Three
        // hooks: the war preview of a planned target counts that target at 60% while its host is away at another war
        // (A.cbPreview, in place of A.warPreview); a want presses on the opinion bar the way a claim does (A.cbPress,
        // beside the claims term); and one more factor in the odds product (A.cbWarMul): up to x9 on the planned target
        // when the moment is good, x0.5 while it is not, x0.5 on any other neighbour while a plan stands, x1 to x4 (by
        // temper) on a neighbour remembered for an old wrong or wanted by a crown with no plan, and 0 on a realm the crown
        // owes an honoured debt. In the source: the same three terms in the war-chance calculation.
        if (
          ((p *= cb ? (cb === "justified" || cb === "reconquest" ? 2.2 : 1.5) : A.aiNoCause(r.id)),
          r.rivals.includes(o.id) && (p *= 1.5),
          (p *= A.feudWarMul ? A.feudWarMul(r.id, o.id) : 1),
          (p *= A.cbWarMul ? A.cbWarMul(r.id, o.id, P) : 1),
          o.playerRun && (p *= 0.8),
          (p *= A.clamp(1 - (r.infamy || 0) / 90, 0.15, 1)),
          (p *= A.clamp(1.2 - A.overext(r) * 1.5, 0.3, 1.2)),
          A.chance(p))
        ) {
          A.aiNoteWar(r.id, o.id, P, rel, cb, A.declareWar(r.id, o.id));
          return;
        }
      }
};

A.INCIDENTS = [
  {
    k: "border",
    w: (a, b) => (A.neighbors(a).includes(b) ? 3 : 0),
    news: (a, b) =>
      `Soldiers of ${A.realmShort(a)} and ${A.realmShort(b)} clash at a border ford. Men die on both sides.`,
    fx: (a, b) => {
      A.remember(a, b, "incident", -10, true);
      A.grantCB(b, a, "incident");
    },
  },
  {
    k: "envoy",
    w: () => 2,
    news: (a, b) => `An envoy of ${A.realmShort(b)} is humiliated at the court of ${A.realmShort(a)}.`,
    fx: (a, b) => {
      A.remember(b, a, "insult", -12);
      A.grantCB(b, a, "insult");
    },
  },
  {
    k: "ships",
    w: (a, b) => (A.hasTrade(a, b) || A.neighbors(a).includes(b) ? 2 : 0.5),
    news: (a, b) => `${A.realmShort(a)} seizes merchant ships of ${A.realmShort(b)} in its harbors.`,
    fx: (a, b) => {
      A.remember(b, a, "trade_war", -10);
      const ra = A.realm(a),
        rb = A.realm(b);
      if (ra && rb) {
        const g = Math.round(rb.income * 0.01);
        rb.treasury -= g;
        ra.treasury += g;
      }
    },
  },
  {
    k: "spy",
    w: () => 2,
    news: (a, b) => `A spy of ${A.realmShort(a)} is caught in ${A.realmShort(b)} and hanged.`,
    fx: (a, b) => {
      A.remember(b, a, "spies", -12);
    },
  },
  {
    k: "raid",
    w: (a, b) => (A.neighbors(a).includes(b) && (A.AGGRO[a] || 1) > 1 ? 2.5 : 0),
    news: (a, b) => `Raiders out of ${A.realmShort(a)} burn villages across the border in ${A.realmShort(b)}.`,
    fx: (a, b) => {
      A.remember(b, a, "incident", -14);
      A.grantCB(b, a, "incident");
      const rb = A.realm(b);
      if (rb) rb.stability = Math.max(0, rb.stability - 2);
    },
  },
  {
    k: "heretic",
    w: (a, b) => {
      const ra = A.realm(a),
        rb = A.realm(b);
      return ra && rb && ra.faith !== rb.faith && A.neighbors(a).includes(b) ? 1.5 : 0;
    },
    news: (a, b) =>
      `Preachers of ${A.realmShort(a)} are stoned in ${A.realmShort(b)}. The temples of both cry blasphemy.`,
    fx: (a, b) => {
      A.remember(a, b, "insult", -8, true);
    },
  },
  {
    k: "refugees",
    w: (a, b) => (A.neighbors(a).includes(b) && A.atWar(a).length ? 3 : 0),
    news: (a, b) => `Refugees from the war in ${A.realmShort(a)} flood across the border into ${A.realmShort(b)}.`,
    fx: (a, b) => {
      const rb = A.realm(b);
      if (rb) rb.stability = Math.max(0, rb.stability - 1);
      A.remember(a, b, A.chance(0.5) ? "aid" : "snub", A.chance(0.5) ? 6 : -4);
    },
  },
  {
    k: "rescue",
    w: () => 1,
    news: (a, b) => `Sailors of ${A.realmShort(a)} pull the crew of a wrecked ${A.realmShort(b)} galley from the sea.`,
    fx: (a, b) => {
      A.remember(b, a, "rescue", 8);
    },
  },
  {
    k: "famine",
    w: (a, b) => {
      const rb = A.realm(b);
      return rb && rb.stability < 35 ? 2 : 0.3;
    },
    news: (a, b) => `${A.realmShort(a)} sends grain ships to hungry ${A.realmShort(b)}.`,
    fx: (a, b) => {
      A.remember(b, a, "aid", 12);
      const ra = A.realm(a);
      if (ra) ra.treasury -= Math.round(ra.income * 0.01);
    },
  },
  {
    k: "murder",
    w: (a, b) => (A.relBetween(a, b) < -40 ? 1 : 0),
    news: (a, b) =>
      `A lord of ${A.realmShort(b)} is murdered — and the knife, they say, was paid for in ${A.realmShort(a)}.`,
    fx: (a, b) => {
      A.remember(b, a, "insult", -20);
      A.grantCB(b, a, "insult");
    },
  },
  {
    k: "defector",
    w: (a, b) => (A.neighbors(a).includes(b) ? 1 : 0),
    news: (a, b) => `A captain of ${A.realmShort(a)} defects to ${A.realmShort(b)} with his company and his maps.`,
    fx: (a, b) => {
      A.remember(a, b, "insult", -8);
    },
  },
  {
    k: "elope",
    w: (a, b) => {
      const ra = A.realm(a);
      return ra && ra.marriages && ra.marriages[b] ? 0.3 : 0.6;
    },
    news: (a, b) =>
      `A princess of ${A.realmShort(a)} elopes with a knight of ${A.realmShort(b)}. Both courts are scandalized.`,
    fx: (a, b) => {
      A.remember(a, b, "insult", -6, true);
    },
  },
];

A.incidentMonth = function () {
  const live = A.dLive();
  if (live.length < 2) return;
  const n = (A.chance(0.42) ? 1 : 0) + (A.chance(0.12) ? 1 : 0);
  for (let i = 0; i < n; i++) {
    const pairs = [];
    for (const r of live)
      for (const oid of A.neighbors(r.id)) {
        const o = A.realm(oid);
        if (!o || !o.alive || o.isRebel || A.hostile(r.id, oid)) continue;
        const rel = A.relBetween(r.id, oid);
        pairs.push([r.id, oid, Math.max(0.2, 1 + -rel / 40 + ((r.rivals || []).includes(oid) ? 2 : 0))]);
      }
    if (!pairs.length) return;
    const pr = A.wpick(pairs, x => x[2]),
      [a, b] = A.chance(0.5) ? [pr[0], pr[1]] : [pr[1], pr[0]],
      I = A.wpick(A.INCIDENTS, x => x.w(a, b));
    if (!I || !I.w(a, b)) continue;
    I.fx(a, b);
    A.news(I.news(a, b), "crown");
    const pc = A.pc(),
      S2 = A.S;
    if (
      pc &&
      pc.alive &&
      (pc.realm === a || pc.realm === b) &&
      A.incidentRole(pc, I.k) &&
      !(S2.incAsk && A.absDay() - S2.incAsk < 120) &&
      (S2.incAsk = A.absDay())
    )
      A.queue({
        type: "event",
        ev: "di_incident",
        forced: true,
        ctx: {
          kind: I.k,
          rid: pc.realm === a ? b : a,
          mine: pc.realm === a,
          desc: I.news(a, b),
        },
      });
    else {
      if (pc && pc.alive && (pc.realm === a || pc.realm === b)) A.log(I.news(a, b), "warn");
    }
  }
};

A.incidentRole = function (pc, k) {
  return pc.ruler
    ? "ruler"
    : pc.office === "chancellor" &&
        ["envoy", "ships", "murder", "elope", "heretic", "refugees", "famine", "rescue"].includes(k)
      ? "chancellor"
      : pc.office === "spymaster" && ["spy", "murder", "defector"].includes(k)
        ? "spymaster"
        : (pc.office === "marshal" || (pc.mil && !pc.mil.merc && pc.mil.rank >= 5)) &&
            ["border", "raid", "defector"].includes(k)
          ? "commander"
          : pc.job && pc.job.c === "envoy" && pc.job.r >= 1 && ["envoy", "ships", "elope"].includes(k)
            ? "envoy"
            : null;
};

A.diploMonth = function () {
  const S = A.S;
  if (!(!S || !S.realms)) {
    A.dAll();
    for (const r of A.dLive()) {
      for (const t in r.tr.sub) {
        const s = r.tr.sub[t],
          o = A.realm(t);
        if (!o || !o.alive || s.until <= S.year || r.treasury < s.amt / 12) {
          delete r.tr.sub[t];
          continue;
        }
        const g = Math.round(s.amt / 12);
        r.treasury -= g;
        o.treasury += g;
      }
      if (r.justify) A.justifyMonth(r);
    }
    A.diploAI(5);
    A.incidentMonth();
    if (A.gatherMonth) A.gatherMonth();
    A.aiWarCheck();
  }
};

A.onMonth = A.onMonth || [];

A.onMonth.push(function () {
  A.S.clockMode = true;
  A.diploMonth();
});

A.on("politicsYearStart", () => A.dAll());

A.on("politicsYearEnd", () => {
  A.memYear();
  const S = A.S;
  for (const x of A.dLive()) {
    A.dInit(x);
    for (const k of ["def", "access", "guar", "emb"])
      for (const t in x.tr[k])
        if (x.tr[k][t] <= S.year || !A.realm(t) || !A.realm(t).alive) {
          if (k === "def" && A.realm(t) && A.realm(t).alive && A.interest(x.id, t) > 20 && A.interest(t, x.id) > 20) {
            x.tr.def[t] = S.year + 12;
            continue;
          }
          delete x.tr[k][t];
        }
    x.rivals = (x.rivals || []).filter(t => A.realm(t) && A.realm(t).alive);
    const oe = A.overext(x);
    if (oe > 0.15) {
      x.stability = Math.max(0, x.stability - oe * 8);
      for (const t of A.tributariesOf(x.id))
        if (A.chance(oe * 0.25)) {
          t.overlord = null;
          A.news(`${t.name} throws off the tribute it paid to ${x.short}.`, "crown");
        }
    }
    for (const t in x.cbs) if (S.year - x.cbs[t].y > 5) delete x.cbs[t];
  }
});

A.on("rulerDied", (r, next) => {
  if (r && r.alive && !r.isRebel && A.callGathering && A.S.year > 1105)
    A.callGathering(r.id, "coronation", next ? next.id : null);
});

A.interestParts = function (a, b) {
  const ra = A.dInit(A.realm(a)),
    rb = A.dInit(A.realm(b));
  if (!ra || !rb) return [];
  const out = [],
    rel = A.relBetween(a, b);
  out.push([`Opinion ${rel > 0 ? "+" : ""}${rel}`, Math.round(rel * 0.6)]);
  const ta = A.threatsTo(a),
    tb = A.threatsTo(b);
  if (ta.includes(b)) out.push(["They fear you", -40]);
  const cm = ta.find(x => x !== b && (tb.includes(x) || A.relBetween(b, x) < -30));
  if (cm) out.push([`Common threat: ${A.realmShort(cm)}`, 25]);
  const cr = ra.rivals.find(x => rb.rivals.includes(x));
  if (cr) out.push([`Common rival: ${A.realmShort(cr)}`, 15]);
  if (ra.rivals.includes(b)) out.push(["You are their rival", -40]);
  if (ra.marriages && ra.marriages[b]) out.push(["Royal kin", 10]);
  if (ra.faith && ra.faith === rb.faith) out.push(["Same faith", 6]);
  if (A.hasTrade(a, b)) out.push(["Trade partners", 5]);
  if (A.atWar(b).find(w => (A.warSide(w, b) === "att" ? w.def : w.att).some(f => ra.allies.includes(f) || f === a)))
    out.push(["You fight their friends", -25]);
  const ratio = A.realmPower(rb) / Math.max(1, A.realmPower(ra)),
    pw = Math.round(A.clamp((ratio - 0.4) * 10, -6, 12));
  if (pw) out.push([pw > 0 ? "You are worth having" : "You are too weak to matter", pw]);
  // [X1 baked patch diplomacy/20-ai-personality AIP-INTEREST] A.interest and A.interestParts (the "what they want
  // from you" list and every offer's odds) add the ruler's character from A.aiInterestParts, and judge "too hungry"
  // by the ruler persona instead of A.AGGRO; A.threatsTo does the same, and cautious rulers see threats sooner.
  if (A.neighbors(a).includes(b) && ratio > 2.5 && A.aiWarW(b) > 1.1)
    out.push(["You are too strong and too hungry", -15]);
  A.aiInterestParts(a, b, out);
  return out;
};

A.diplCool = function (k, tid) {
  const v = (A.S.dcool || {})[k + tid];
  return v == null ? 0 : Math.max(0, v + 90 - A.absDay());
};
