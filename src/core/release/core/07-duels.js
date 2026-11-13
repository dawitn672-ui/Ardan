// The release's core, duels: Duels: reads, hits, the end of a fight; enlisting.
// Readable source of vendor/ardan-b593143.html with the patch layer baked in (X1, docs/DECISIONS.md D-028). Edit it here.
// Defines: A.weighText, A.makeRead, A.duelAct, A.applyHit, A.duelCheckEnd, A.duelFinish, A.duelConsequences,
// A.duelClose, A.duelAuto, A.DUEL_END, A.makeOpponent, A.makeFoe, A.gcPeople, A.startTournament, A.tourneyRound,
// A.DUEL_END.tourney, A.beastsNear, A.startHunt, GD.TECH_FX, GD.TECH_FX_DESC, GD.STYLE_RANKS, GD.STYLE_XP,
// GD.STYLE_PROF, A.style, A.allStyles, A.stylesOfRealm, A.householdStyle, A.styleRankName, A.techsOf,
// A.techWeaponOk, A.styleFighter, A.techById, A.npcStyles, A.aiTech, A.techUse, A.techEdge, A.techStatusLine,
// A.techHitMod, A.techAfter, A.techTick, A.techSteal, A.styleXp, A.styleRankUp, A.learnStyle, A.styleYear,
// A.styleDuelXp, A.canFoundStyle, A.foundStyle, A.inheritFoundedStyle, GD.ACADEMY_TYPES, A.academiesOf,
// A.schoolList, A.joinSchool2, A.schoolYear2, A.DIPLOMA_TEXT, A.registerManeuvers, A.knowsManeuver, A.COMPANY_NAMES,
// A.UNIT_NAMES, A.milTitle, and 4 more.

A.weighText = function (D) {
  const g = D.gap,
    who = D.b.beast ? "the beast" : D.b.short;
  return g > 25
    ? `Your gut goes cold. ${A.cap(who)} is far beyond you. Only willpower and luck will carry you.`
    : g > 10
      ? `${A.cap(who)} is stronger than you. Watch, learn, adapt — or die.`
      : g > 3
        ? `${A.cap(who)} has the edge, but not by much.`
        : g > -3
          ? "An even match. The first exchange is a coin."
          : g > -12
            ? `You have the edge over ${who}.`
            : `${A.cap(who)} is outmatched, and you both know it.`;
};

A.makeRead = function (D) {
  const acc = A.clamp(
      0.3 +
        (D.a.read || 0) +
        (D.a.ins - D.b.ins) / 90 +
        (D.a.chain && D.b.chain && D.a.chain === D.b.chain ? 0.25 : 0) +
        D.a.adapt / 60,
      0.1,
      0.92,
    ),
    truth = D.revealNext ? true : A.chance(acc);
  D.revealNext = false;
  const shown = truth ? D.intent : A.pick(["strike", "feint", "guard", "press", "grapple"].filter(x => x !== D.intent)),
    phr = {
      strike: [
        "weight shifts to the front foot — a straight attack is coming",
        "eyes fix on your guard — the cut is coming",
      ],
      feint: ["a little too much shoulder in it — a trick?", "the blade dances — a feint is likely"],
      guard: ["settles back and waits for you", "the shield comes up and stays up"],
      press: ["breath held, muscles bunching — about to rush you", "a snarl — an all-out attack is coming"],
      grapple: ["edging inside your reach", "free hand open — wants to grab you"],
    },
    tHint = truth && D.intentTech && D.intentTech.t ? ` — something practised: ${D.intentTech.t.name}?` : "";
  return {
    act: shown,
    text: A.pick(phr[shown]) + tHint,
    conf: truth && tHint ? Math.max(Math.round(acc * 100), 60) : Math.round(acc * 100),
  };
};

A.duelAct = function (act) {
  const q = A.S.queue[0];
  if (!q || q.type !== "duel") return null;
  const D = q.d;
  if (D.over) return D;
  const a = D.a,
    b = D.b;
  let tech = null;
  if (typeof act == "string" && act.startsWith("t:")) {
    const t0 = A.techById ? (a.techs || []).find(x => x.id === act.slice(2)) : null;
    if (!t0 || t0.uses <= 0) return D;
    const tt = A.techById(t0.sid, t0.id);
    if ((tt && tt.fx && tt.fx.ranged && D.round >= 2) || ((tech = A.techUse(a, t0.id)), !tech)) return D;
    act = tech.base;
  }
  if ((D.round++, act === "yield")) {
    A.duelFinish(D, a.isPC ? "yield" : "win", `You lower your ${a.weapon.toLowerCase()} and ask for quarter.`);
    return D;
  }
  if (act === "flee") {
    const ch = A.clamp(
      0.4 + (a.flee || 0) + (a.spd - b.spd) / 80 - (D.b.beast && b.spd > a.spd ? 0.15 : 0) - a.fat / 300,
      0.08,
      0.92,
    );
    return A.chance(ch)
      ? (A.duelFinish(D, "fled", "You break away and run. Nobody follows far enough."), D)
      : (D.log.push("You turn to run — and pay for it."),
        A.applyHit(D, b, a, 2, "strike"),
        A.duelCheckEnd(D) ||
          ((D.intent = A.aiAction(b, a, D)),
          (D.intentTech = A.aiTech ? A.aiTech(b, D.intent, D) : null),
          (D.readHint = A.makeRead(D))),
        D);
  }
  const bAct = D.intent;
  let bTech = null;
  // [X1 baked patch core/03-engine-fixes ENG-DUEL-TECH] NPC techniques: aiTech picked a technique that did not match
  // the announced action 25% of the time; such a technique can never be used, yet duelAct spent its use before
  // noticing, after the read hint had already named it to the player. Now the NPC only plans techniques that fit its
  // action, and a use is spent only when the technique is actually used.
  if (
    (D.intentTech &&
      D.intentTech.x &&
      D.intentTech.x.uses > 0 &&
      D.intentTech.t &&
      D.intentTech.t.base === bAct &&
      ((bTech = A.techUse(b, D.intentTech.x.id)),
      bTech &&
        ((D.bUsed = D.bUsed || []),
        D.bUsed.push({
          sid: D.intentTech.x.sid,
          tid: bTech.id,
        }))),
    a.seizure &&
      (D.light === "night" || D.light === "torch") &&
      A.chance(a.seizure) &&
      (D.log.push("The torchlight flickers... the world jerks and goes white. A fit takes you!"),
      A.applyHit(D, b, a, 4, "press"),
      A.duelCheckEnd(D)))
  )
    return D;
  for (const f of [a, b])
    if (f.furyBlood && !f.furyUsed && (f.hp < f.maxHp * 0.8 || D.round === 1)) {
      f.fury = 3;
      f.furyUsed = true;
      D.log.push(
        `${f.isPC ? "The blood fury" : "Blood fury"} takes ${f.isPC ? "you" : f.short}: no fear, only speed and weight.`,
      );
    }
  const crA = A.CR(a, D),
    crB = A.CR(b, D),
    sitA = A.situEdges(a, b, D, act),
    sitB = A.situEdges(b, a, D, bAct),
    sA = sitA.reduce((x, e) => x + e[0], 0),
    sB = sitB.reduce((x, e) => x + e[0], 0);
  let edge = A.clamp((crA - crB) / 7, -6, 6) + (A.MATCH[act][bAct] || 0) + A.clamp(sA - sB, -3, 3);
  if (A.techEdge) edge += A.techEdge(D, a, b, tech, act, bAct) - A.techEdge(D, b, a, bTech, bAct, act);
  if (act === "press" && bAct === "guard") edge += A.clamp((a.str - b.str) / 25, -2, 2);
  if (bAct === "press" && act === "guard") edge -= A.clamp((b.str - a.str) / 25, -2, 2);
  const rA = A.ri(1, 6) + A.ri(1, 6),
    rB = A.ri(1, 6) + A.ri(1, 6),
    margin = rA + edge - rB,
    costMul = f => (1.25 - f.sta / 160) * (f.burst && D.round > 3 ? 1.5 : 1) * (1 + f.armorW * 0.12);
  a.fat = A.clamp(a.fat + A.ACTIONS[act].cost * costMul(a) + (tech && tech.cost ? tech.cost * 0.6 : 0) - 4, 0, 100);
  b.fat = A.clamp(
    b.fat +
      (A.ACTIONS[bAct] ? A.ACTIONS[bAct].cost : 8) * costMul(b) +
      (bTech && bTech.cost ? bTech.cost * 0.6 : 0) -
      4,
    0,
    100,
  );
  a.tmod = A.techHitMod ? A.techHitMod(a, tech) : null;
  b.tmod = A.techHitMod ? A.techHitMod(b, bTech) : null;
  if (a.fury > 0) a.fury--;
  if (b.fury > 0) b.fury--;
  const passive = ["guard", "feint"],
    nm = {
      strike: "strike",
      feint: "feint",
      guard: "guard",
      press: "rush",
      grapple: "close in",
    };
  // [X1 baked patch people/48-event-fight-rules FL-DUEL-VERBS] The duel log put the foe's move in the third person
  // by adding an s to your verb: "Kettil rushs", "Kettil close ins" (playtest 2, old 17). In the source: give the
  // round line its own third-person verbs (strikes, feints, guards, rushes, closes in).
  let line = `Round ${D.round}: you ${nm[act]}; ${(b.beast, b.short)} ${
    b.beast
      ? {
          strike: b.verb,
          press: "charges",
          grapple: "lunges to grab",
          guard: "circles warily",
          feint: "feints",
        }[bAct]
      : {
          strike: "strikes",
          feint: "feints",
          guard: "guards",
          press: "rushes",
          grapple: "closes in",
        }[bAct] || nm[bAct] + "s"
  }.`;
  const sitTxt = sitA
    .filter(e => e[0] > 0)
    .map(e => e[1])
    .concat(sitB.filter(e => e[0] < 0).map(e => e[1]));
  if (
    (sitTxt.length && D.round <= 2 && (line += ` (Edges: ${sitTxt.slice(0, 2).join(", ")})`),
    margin > 0
      ? passive.includes(act) && passive.includes(bAct) && act === bAct
        ? ((line += " Neither commits. You circle, breathing."),
          (a.fat = Math.max(0, a.fat - 6)),
          (b.fat = Math.max(0, b.fat - 6)),
          D.log.push(line))
        : (D.log.push(line), A.applyHit(D, a, b, margin, act), a.won++, b.lost++)
      : margin < 0
        ? passive.includes(act) && passive.includes(bAct) && act === bAct
          ? ((line += " Neither commits."), D.log.push(line))
          : (D.log.push(line), A.applyHit(D, b, a, -margin, bAct), b.won++, a.lost++)
        : (D.log.push(line + " Steel rings on steel; both of you are touched."),
          (passive.includes(act) && passive.includes(bAct)) ||
            (A.applyHit(D, a, b, 0.6, act), A.applyHit(D, b, a, 0.6, bAct))),
    tech && A.techAfter(D, a, b, tech, margin > 0, margin),
    bTech && A.techAfter(D, b, a, bTech, margin < 0, -margin),
    (a.tmod = null),
    (b.tmod = null),
    A.techTick && (A.techTick(D, a), A.techTick(D, b)),
    D.nonlethalEnd && !D.over)
  ) {
    const r = D.nonlethalEnd;
    D.nonlethalEnd = null;
    A.duelFinish(
      D,
      r,
      r === "win"
        ? `${b.short} is down, disarmed and held. It is over, and nobody had to die.`
        : `You are thrown, pinned and disarmed. ${b.short} lets you up.`,
    );
    return D;
  }
  for (const [f, o] of [
    [a, b],
    [b, a],
  ]) {
    const gap = A.CR(o, D) - A.CR(f, D);
    if (gap > 2) {
      const lostNow = f.lost > 0 && D.hist.length >= 0,
        add = (((f.wil / 100) * Math.min(gap, 40)) / 9) * (lostNow ? 1.3 : 0.8),
        before = f.adapt;
      f.adapt = Math.min(f.adapt + add, gap * 0.95 + 2);
      if (f.isPC && f.adapt - before > 1.2 && D.round % 2 === 0)
        D.log.push(
          A.pick([
            "You start to see the rhythm of it.",
            "Your body is learning faster than your mind.",
            "Something in you refuses to break. You adapt.",
            "Each blow you take teaches you the next one.",
          ]),
        );
    }
  }
  D.hist.push([act, bAct]);
  return A.duelCheckEnd(D)
    ? D
    : D.kind === "spar" && (a.lost >= 3 || b.lost >= 3)
      ? (A.duelFinish(
          D,
          a.lost >= 3 ? "lose" : "win",
          a.lost >= 3 ? "You are touched three times. The bout is lost." : "Three touches. The bout is yours.",
        ),
        D)
      : D.kind === "tourney" && (a.lost >= 2 || b.lost >= 2)
        ? (A.duelFinish(
            D,
            a.lost >= 2 ? "lose" : "win",
            a.lost >= 2
              ? "The marshals call it: the bout goes against you."
              : "The marshals raise their staves for you!",
          ),
          D)
        : D.toYield &&
            !b.beast &&
            b.hp < b.maxHp * 0.3 &&
            A.chance(0.45 + (b.traits.includes("craven") ? 0.3 : 0) - (b.traits.includes("proud") ? 0.25 : 0))
          ? (A.duelFinish(D, "win", `${b.short} throws down ${b.weapon.toLowerCase()} and yields.`), D)
          : b.beast && b.hp < b.maxHp * 0.2 && A.chance(0.3)
            ? (A.duelFinish(D, "beastfled", `${A.cap(b.short)} breaks off and flees, bleeding.`), D)
            : D.round >= 18
              ? (A.duelFinish(D, "draw", "Both of you are spent. The fight ends with nobody standing over anybody."), D)
              : ((D.intent = A.aiAction(b, a, D)),
                (D.intentTech = A.aiTech ? A.aiTech(b, D.intent, D) : null),
                (D.readHint = A.makeRead(D)),
                D);
};

A.applyHit = function (D, att, def, margin, act) {
  const big = margin >= 5 || (att.crit && A.chance(att.crit));
  let dmg =
    att.wdmg *
    2 *
    (0.55 + att.str / 110) *
    (1 + Math.min(margin, 8) * 0.12) *
    (act === "press" ? 1.25 : act === "feint" ? 0.85 : act === "grapple" ? 0.7 : 1);
  if (att.fury > 0) dmg *= 1.3;
  const tm = att.tmod || {
    dmg: 1,
    pierce: 0,
    noShield: false,
  };
  dmg *= tm.dmg;
  let prot =
    def.prot * (1 - Math.min(9, att.pierce + tm.pierce) / 10) +
    (def.shield && act !== "feint" && act !== "grapple" && !tm.noShield ? def.shield * 0.6 : 0);
  if (
    (act === "grapple" && ((prot *= 0.4), (dmg *= att.grapMul || 1)),
    (dmg = Math.max(2, dmg - prot * 1.6)),
    def.hide && (dmg *= 1 - def.hide),
    def.woundRes && att.wkind !== "dagger" && (dmg *= 1 - def.woundRes * 0.4),
    def.fragile && ["mace", "club", "hammer", "beast", "fists", "staff"].includes(att.wkind) && (dmg *= def.fragile),
    big && (dmg *= 1.5),
    (dmg = Math.round(dmg * A.rf(0.85, 1.15))),
    (def.hp -= dmg),
    att.dual && act !== "grapple" && A.chance(Math.min(0.6, att.dual / 160)))
  ) {
    const od = Math.max(1, Math.round(att.offdmg * 1.6 * (0.5 + att.str / 140) - def.prot * 0.8));
    def.hp -= od;
    D.log.push(
      `${att.isPC ? "Your" : att.short + "'s"} off-hand ${att.offName ? att.offName.replace(/ \(off-hand\)/, "").toLowerCase() : "blade"} bites too — ${od} more.`,
    );
  }
  const who = def.isPC ? "You take" : `${def.beast ? A.cap(def.short) : def.short} takes`,
    how = att.beast
      ? `${att.short} ${att.verb} you`
      : act === "grapple"
        ? "a brutal throw and a blow on the ground"
        : act === "press"
          ? "a crushing blow"
          : act === "feint"
            ? "a cut past the drawn guard"
            : big
              ? "a terrible blow"
              : "a hit";
  if (
    (D.log.push(
      `${who} ${att.beast && def.isPC ? "" : how + " — "}${att.beast && def.isPC ? A.cap(how) + " — " : ""}${dmg} damage.${big ? " Blood on the ground." : ""}`,
    ),
    def.isPC && D.lethal && (big || def.hp < def.maxHp * 0.25) && A.chance(big ? 0.35 : 0.15))
  ) {
    const pool = att.beast
      ? ["bite", "scar_chest", "scar_arm", "limp", "lost_eye"]
      : [
          "scar_face",
          "scar_arm",
          "scar_chest",
          "lost_fingers",
          "broken_ribs",
          "deep_cut",
          "concussion",
          "ear",
          "broken_nose",
          "lost_eye",
          "limp",
        ];
    D.pendingWounds = D.pendingWounds || [];
    const w = A.pick(pool);
    if (!D.pendingWounds.includes(w)) D.pendingWounds.push(w);
  }
};

A.duelCheckEnd = function (D) {
  const a = D.a,
    b = D.b;
  // [X1 baked patch core/03-engine-fixes ENG-DUEL-DOUBLE-KO] When both fighters dropped to 0 HP in the same exchange
  // the player always won, because the foe was checked first. Now the one further below zero (as a share of max HP)
  // loses; an exact tie is a coin flip.
  return a.hp <= 0 &&
    D.lethal &&
    D.kind !== "spar" &&
    D.kind !== "tourney" &&
    !a.refused &&
    A.chance(a.wil / 230 + (a.painless ? 0.15 : 0))
    ? ((a.refused = true),
      (a.hp = Math.round(a.maxHp * 0.12)),
      (a.adapt += 4),
      D.log.push("Your knees buckle — and you refuse to fall. Not here. Not like this."),
      false)
    : b.hp <= 0 && (a.hp > 0 || b.hp / b.maxHp < a.hp / a.maxHp || (b.hp / b.maxHp === a.hp / a.maxHp && A.chance(0.5)))
      ? (A.duelFinish(
          D,
          "win",
          D.lethal && D.kind !== "spar" && D.kind !== "tourney"
            ? b.beast
              ? `${A.cap(b.short)} crashes down and does not rise.`
              : `${b.short} falls and does not get up.`
            : `${b.short} goes down. It is over.`,
        ),
        true)
      : a.hp <= 0
        ? (A.duelFinish(
            D,
            "lose",
            D.lethal && D.kind !== "spar" && D.kind !== "tourney"
              ? "The world tilts. You are down, and the light is going."
              : "You hit the ground. It is over.",
          ),
          true)
        : false;
};

A.duelFinish = function (D, result, text) {
  D.over = true;
  D.result = result;
  D.log.push(text);
  D.summary = A.duelConsequences(D);
};

A.duelConsequences = function (D) {
  const pc = A.pc(),
    a = D.a,
    b = D.b,
    out = [],
    foe = b.pid ? A.P(b.pid) : null,
    gap = D.gap,
    lostFrac = 1 - Math.max(0, a.hp) / a.maxHp,
    hpLoss = Math.round(lostFrac * (D.kind === "spar" || D.kind === "tourney" ? 18 : 45));
  if (
    ((pc.health = A.clamp(pc.health - hpLoss, 3, 100)),
    (pc.lastHurt = b.beast ? "the " + b.short.replace(/^the /i, "") : "wounds from a fight with " + b.short),
    D.pendingWounds)
  )
    for (const w of D.pendingWounds) {
      const n = A.addWound(pc, w);
      if (n) out.push(`Lasting wound: ${n}.`);
    }
  const sk = a.skillK !== "beast" ? a.skillK : "survival";
  A.trainSkill(pc, sk, D.kind === "spar" ? 3 : 5);
  A.trainSkill(pc, "melee", D.kind === "spar" ? 1.5 : 2.5);
  if (a.dual) A.trainSkill(pc, "dualwield", 3);
  if (a.shield && pc.gear.shield && !GD.GEAR[pc.gear.shield].offhand) A.trainSkill(pc, "shield", 1.5);
  if (a.rangedSkill && D.kind !== "spar") A.trainSkill(pc, a.rKind, 1.5);
  if (a.mounted) {
    A.trainSkill(pc, "mounted", 2.5);
    A.trainSkill(pc, "riding", 1);
  }
  A.train(pc, "ins", D.kind === "spar" ? 0.5 : 1);
  A.train(pc, "sta", 0.4);
  const won = D.result === "win" || D.result === "beastfled";
  if (A.techSteal && !b.beast) for (const l of A.techSteal(D, pc)) out.push(l);
  if (
    (A.styleDuelXp && A.styleDuelXp(pc, D),
    won && D.kind !== "spar" && (pc.flags.duelWins = (pc.flags.duelWins || 0) + 1),
    won)
  ) {
    if (gap > 8) {
      const gains = A.breakthrough(pc, gap, D);
      out.push(
        `BREAKTHROUGH. You beat a foe who should have beaten you. Your body and will change: ${Object.entries(gains)
          .map(([k, v]) => GD.STAT_SHORT[k] + " +" + v)
          .join(", ")}.`,
      );
      A.ach("giant_killer");
      A.fame(pc, Math.min(15, Math.round(gap / 3)));
    }
    if (
      (D.kind !== "spar" && A.fame(pc, (D.kind === "tourney" ? 1 : 1.5) + (b.fame ? Math.round(b.fame / 6) : 0)),
      D.result === "win" &&
        D.lethal &&
        b.hp <= 0 &&
        D.kind !== "spar" &&
        D.kind !== "tourney" &&
        (pc.kills++,
        A.ach("first_blood"),
        foe &&
          (A.kill(foe, b.beast ? "a beast" : "a fight with " + A.fullName(pc, false)),
          foe.ruler && A.ach("king_slayer"),
          out.push(`${b.name} is dead.`)),
        b.beast))
    ) {
      A.ach("beast");
      if (b.beast === "CRE-01" || b.beast === "CRE-02") {
        A.ach("dragon");
        if (!pc.epithet) {
          pc.epithet = "Dragonslayer";
          out.push("They will call you Dragonslayer.");
        }
      }
      pc.deeds.push({
        y: A.S.year,
        t: `Killed ${b.name}`,
      });
      const val = Math.round((b.fame || 5) * A.rf(4, 10));
      pc.coin += val;
      out.push(`Hide, horn and trophies fetch ${A.coin(val)}.`);
    }
    if (D.reward) pc.coin += D.reward;
    if (foe && pc.rel[foe.id]) A.addOp(pc, foe, D.kind === "spar" ? 2 : -20);
  } else if (D.result === "lose") {
    if (
      (A.willGrow(pc, D.kind === "spar" ? 0.8 : 2.2, "defeat"),
      gap > 5 && out.push("Defeat by a stronger foe burns into you. Your will hardens."),
      D.lethal && D.kind !== "spar" && D.kind !== "tourney")
    ) {
      const mercy = !b.beast && (D.toYield || A.chance(0.3)) && !(foe && A.has(foe, "cruel") && A.chance(0.6)),
        diff = A.S.settings.diff,
        deathP =
          (b.beast ? 0.4 : 0.5) *
          ({
            story: 0.35,
            hard: 1,
            realism: 1.2,
          }[diff] || 1);
      if (mercy) {
        out.push(`${b.short} lets you live.`);
        pc.honor = A.clamp(pc.honor - 5, 0, 100);
        pc.health = Math.max(5, pc.health);
      } else if (A.chance(deathP)) {
        out.push(b.beast ? "The beast does not stop." : "There is no mercy in it.");
        D.killedPC = true;
      } else if (
        (out.push(
          b.beast
            ? "You drag yourself into a gully and it loses interest. You live, torn and bleeding."
            : "You are left for dead. Somehow, you crawl away.",
        ),
        (pc.health = Math.max(4, pc.health - 10)),
        A.chance(0.5))
      ) {
        const w = A.addWound(pc, b.beast ? "bite" : A.pick(["scar_chest", "limp", "scar_face"]));
        if (w) out.push(`Lasting wound: ${w}.`);
      }
    }
    if (D.kind !== "spar") A.fame(pc, -1);
  } else if (D.result === "yield") {
    pc.honor = A.clamp(pc.honor - 8, 0, 100);
    A.fame(pc, -2);
    if (b.beast) {
      out.push("Beasts do not take surrenders.");
      D.killedPC = A.chance(0.35);
      if (!D.killedPC) {
        out.push("It mauls you and leaves you for dead.");
        pc.health = Math.max(4, pc.health - 15);
      }
    } else {
      if (foe && A.has(foe, "cruel") && D.lethal && A.chance(0.4)) {
        out.push(`${b.short} laughs and strikes anyway.`);
        D.killedPC = true;
      } else out.push("You live, with less honor than you came with.");
    }
    A.willGrow(pc, 1, "yield");
  } else {
    if (D.result === "fled") {
      pc.honor = A.clamp(pc.honor - 4, 0, 100);
      A.willGrow(pc, 0.6, "flight");
    }
  }
  if (D.killedPC) pc.health = 0;
  else {
    if (pc.health <= 0) pc.health = 3;
  }
  {
    const pc2 = A.pc(),
      war = D.onEnd && ["mission", "battle"].includes(D.onEnd.fn);
    if (D.killedPC && !D.b.beast && !war && D.kind !== "execution") {
      const foe2 = D.b.pid ? A.P(D.b.pid) : null,
        cruel = foe2 && A.has(foe2, "cruel"),
        spare = D.result === "yield" ? (cruel ? 0.7 : 1) : cruel ? 0.25 : 0.55;
      if (A.chance(spare)) {
        D.killedPC = false;
        pc2.health = Math.max(4, Math.min(pc2.health, 12));
        out.push(
          D.result === "yield"
            ? `${D.b.short} stands over you a long moment, then spits and walks away.`
            : "Someone shouts. People come running. The blow that would have finished you never falls.",
        );
      }
    }
    if (
      (D.killedPC &&
        D.b.beast &&
        A.beastTier(D.b.beast) === "animal" &&
        A.chance(0.55) &&
        ((D.killedPC = false),
        (pc2.health = Math.max(5, Math.min(pc2.health, 14))),
        out.push(
          "It drags you down — and then, for no reason you will ever know, it lets go and slips away into the brush.",
        )),
      D.party && D.result === "win")
    ) {
      const lost = A.chance(D.tier === "great" ? 0.35 : 0.15) ? A.ri(1, 2) : 0;
      out.push(
        lost
          ? `It cost ${lost === 1 ? "one of the hunters" : "two of the hunters"} their life. The rest carry the trophy home.`
          : "Nobody died. That is the mark of a good hunt.",
      );
    }
  }
  return out;
};

A.duelClose = function () {
  const q = A.S.queue[0];
  if (!q || q.type !== "duel") return;
  const D = q.d;
  A.S.queue.shift();
  const pc = A.pc();
  for (const l of D.summary || []) A.log(l, /BREAKTHROUGH/.test(l) ? "big" : "");
  const resWord = {
    win: "You win",
    lose: "You lose",
    yield: "You yield",
    fled: "You flee",
    draw: "A draw",
    beastfled: "The beast flees",
  }[D.result];
  A.log(
    `${D.title || "Fight"} with ${D.b.name}: ${resWord}.`,
    D.result === "win" || D.result === "beastfled" ? "good" : D.result === "draw" ? "" : "bad",
  );
  if (
    !(
      D.killedPC &&
      A.mortalCheck(pc, D.b.beast ? `the ${D.b.name.replace(/^The /, "")}` : `a fight with ${D.b.name}`, 0.15)
    ) &&
    D.onEnd &&
    A.DUEL_END[D.onEnd.fn]
  )
    A.DUEL_END[D.onEnd.fn](D, D.onEnd.arg);
};

A.duelAuto = function (D) {
  let guard = 0;
  for (; !D.over && guard++ < 30; ) {
    let act = A.aiAction(D.a, D.b, D);
    if (D.readHint && D.readHint.conf > 55) {
      const counter = Object.keys(A.MATCH).sort((x, y) => A.MATCH[y][D.readHint.act] - A.MATCH[x][D.readHint.act])[0];
      if (A.chance(0.6)) act = counter;
    }
    if (
      (D.a.hp < D.a.maxHp * 0.2 && D.lethal && D.kind !== "spar" && !D.b.beast && A.chance(0.3) && (act = "yield"),
      act !== "yield" && A.aiTech)
    ) {
      const o = A.aiTech(D.a, act, D);
      if (o && o.t.base === act) act = "t:" + o.x.id;
    }
    A.duelAct(act);
  }
  return D;
};

A.DUEL_END = {};

A.makeOpponent = function (pc, kind, tier) {
  const myCR = A.CR(A.fighterFrom(pc), {
      round: 2,
    }),
    cand = A.relsOf(pc, ["rival", "enemy"])
      .map(x => x.p)
      .filter(p2 => p2.alive && A.isAdult(p2));
  if (kind === "duel" && cand.length && A.chance(0.6)) return A.pick(cand);
  const race = A.chance(0.8)
      ? A.realm(pc.realm)
        ? A.realm(pc.realm).race
        : "human"
      : A.pick(["human", "orc", "halforc", "dwarf", "elf"]),
    cult = A.cultureFor(race, pc.realm),
    sex = A.chance(0.85) ? "M" : "F",
    R2 = GD.RACES[race],
    age = R2.adult + A.ri(2, Math.round((R2.primeEnd - R2.adult) * 0.8)),
    bonus =
      kind === "spar"
        ? A.ri(-12, 10)
        : kind === "traveler"
          ? A.ri(-15, 5)
          : kind === "champion"
            ? A.ri(10, 25)
            : tier
              ? (tier - 2) * 9
              : A.ri(-8, 14),
    p = A.newPerson({
      given: A.givenName(cult, sex),
      sex,
      race,
      realm: pc.realm,
      cult,
      faith: A.faithFor(race, pc.realm),
      born: A.S.year - age,
      status: A.pick(["peasant", "artisan", "gentry"]),
      home: pc.home,
      potBonus: bonus,
    }),
    fn = A.familyName({
      cult,
      realm: pc.realm,
      status: p.status,
      home: pc.home,
      sex,
    });
  p.sur = fn.sur;
  p.surMode = fn.mode;
  const lvl = A.clamp(myCR + bonus * 1.2, 10, 120);
  for (const k of ["sword", "spear", "axe", "shield", "unarmed"])
    p.skills[k] = A.clamp(Math.round(lvl * A.rf(0.6, 1.1) - 10), 0, 95);
  p.gear = {
    weapon: A.pick(["sword", "spear", "axe", "mace", "dagger", "club"]),
    armor: A.pick(["none", "padded", "padded", "leather", "mail"]),
    shield: A.chance(0.5) ? "shield" : null,
    helm: A.chance(0.4) ? "helm" : null,
    mount: null,
    ranged: null,
  };
  if (race === "giant") p.gear.weapon = "maul";
  if (kind === "champion") {
    p.gear.weapon = A.pick(["goodsword", "sword", "axe"]);
    p.gear.armor = "mail";
    p.gear.helm = "helm";
    p.fame = A.ri(30, 60);
  }
  p.occ = kind === "spar" ? "a sparring partner" : kind === "traveler" ? "a traveler" : "a fighter";
  p.npcTemp = true;
  return p;
};

A.makeFoe = function (spec) {
  const realm = spec.realm || "unclaimed",
    r = A.realm(realm),
    race = spec.race || (r ? r.race : "human"),
    cult = A.cultureFor(race, realm),
    sex = spec.sex || (A.chance(0.88) ? "M" : "F"),
    R2 = GD.RACES[race],
    age = R2.adult + A.ri(2, Math.round((R2.primeEnd - R2.adult) * 0.9)),
    tier = spec.tier || 2,
    p = A.newPerson({
      given: A.givenName(cult, sex),
      sex,
      race,
      realm,
      cult,
      faith: A.faithFor(race, realm),
      born: A.S.year - age,
      status: tier >= 4 ? "gentry" : "peasant",
      potBonus: (tier - 2) * 7,
    }),
    fn = A.familyName({
      cult,
      realm,
      status: p.status,
      sex,
    });
  p.sur = fn.sur;
  p.surMode = fn.mode;
  const base = 10 + tier * 13,
    troop = spec.troop || "SP",
    g = GD.TROOP_GEAR[troop] || GD.TROOP_GEAR.SP;
  p.gear = {
    weapon: g[0] === "lance" || (g[0] === "pike" && A.chance(0.5)) ? "sword" : g[0],
    armor: g[1],
    shield: g[2],
    helm: g[3],
    ranged: g[4] || null,
    mount: null,
  };
  if (race === "giant")
    p.gear = {
      weapon: "maul",
      armor: "hide",
      shield: null,
      helm: null,
      ranged: null,
      mount: null,
    };
  const sk = GD.WEAPON_SKILL[(GD.GEAR[p.gear.weapon] || GD.GEAR.fists).kind] || "sword";
  p.skills[sk] = A.clamp(base + A.ri(-8, 12), 0, 95);
  p.skills.shield = A.clamp(base + A.ri(-15, 5), 0, 90);
  if (tier >= 4) {
    p.st.sta = Math.max(p.st.sta, A.ri(tier >= 5 ? 58 : 46, tier >= 5 ? 72 : 60));
    p.st.str = Math.max(p.st.str, A.ri(tier >= 5 ? 50 : 42, tier >= 5 ? 66 : 56));
  }
  p.occ =
    spec.title ||
    (GD.TROOPS[troop] ? GD.TROOPS[troop].name.replace(/s$/, "") : "soldier") + " of " + (r ? r.short : "no realm");
  p.npcTemp = true;
  return p;
};

A.gcPeople = function () {
  const S = A.S,
    keep = new Set([S.pc]),
    pc = A.pc(),
    held = new Set();
  if (pc) {
    for (const k in pc.staff || {}) if (pc.staff[k] && pc.staff[k] !== "deleg") held.add(pc.staff[k]);
    for (const k in pc.staffD || {}) held.add(pc.staffD[k]);
    if (pc.job && pc.job.mates) for (const id of pc.job.mates) held.add(id);
    for (const k in pc.staffPool || {})
      if (pc.staffPool[k].y === S.year) for (const id of pc.staffPool[k].ids) held.add(id);
  }
  for (const id in S.realms) {
    const r = S.realms[id];
    if (r.orders) for (const k in r.orders) held.add(r.orders[k]);
  }
  if (pc) {
    for (const id of Object.keys(pc.rel)) keep.add(id);
    for (const id of pc.parents.concat(pc.children)) if (id) keep.add(id);
    if (pc.spouse) keep.add(pc.spouse);
  }
  for (const id in S.realms) {
    const r = S.realms[id];
    if (r.ruler) keep.add(r.ruler);
    if (r.heir) keep.add(r.heir);
  }
  for (const id in S.houses || {}) if (S.houses[id].headPid) keep.add(S.houses[id].headPid);
  if (S.castMap) for (const k in S.castMap) keep.add(S.castMap[k]);
  if (pc && pc.mil && pc.mil.squad) for (const id of pc.mil.squad) keep.add(id);
  if (pc && pc.company && pc.company.officers) for (const id of pc.company.officers) keep.add(id);
  if (S.dynasty) for (const id of S.dynasty.members) keep.add(id);
  for (const id of [...keep]) {
    const p = S.people[id];
    if (p && p.ruler) {
      for (const c of p.children) keep.add(c);
      if (p.spouse) keep.add(p.spouse);
    }
  }
  for (const q of S.queue) {
    if (q.ctx && q.ctx.pid) keep.add(q.ctx.pid);
    if (q.d && q.d.b && q.d.b.pid) keep.add(q.d.b.pid);
  }
  for (const id of [...keep]) {
    const p = S.people[id];
    if (p) for (const x of p.parents) if (x) keep.add(x);
  }
  let removed = 0;
  for (const id of Object.keys(S.people)) {
    if (keep.has(id)) continue;
    const p = S.people[id];
    if ((p.npcTemp && !held.has(id)) || !p.alive || A.S.year - (p.died || A.S.year) > 30) {
      delete S.people[id];
      removed++;
    }
  }
  for (const id in S.people) {
    const p = S.people[id];
    for (const rid of Object.keys(p.rel)) if (!S.people[rid]) delete p.rel[rid];
  }
  return removed;
};

A.startTournament = function (pc) {
  const lance = pc.gear.mount && A.skill(pc, "lance") >= 15 && A.skill(pc, "riding") >= 20,
    archery = pc.gear.ranged && A.skill(pc, "bow") + A.skill(pc, "xbow") > 30,
    kind = lance ? "lance" : archery && A.chance(0.4) ? "archery" : "sword";
  if (kind === "archery") {
    const score =
        A.skill(pc, "bow") * 0.6 +
        A.skill(pc, "xbow") * 0.4 +
        A.stat(pc, "ins") * 0.5 +
        (A.hasBlood(pc, "falcon") ? 15 : 0) +
        A.ri(0, 40),
      place = score > 95 ? 1 : score > 80 ? 2 : score > 65 ? 3 : 0;
    if ((A.trainSkill(pc, "bow", 3), place)) {
      const prize = [0, 60, 25, 10][place];
      pc.coin += prize;
      A.fame(pc, [0, 8, 4, 2][place]);
      A.log(`The archery at the tournament: you place ${A.ordinal(place)}! Prize: ${A.coin(prize)}.`, "good");
    } else A.log("The archery at the tournament: your arrows fly true enough, but not truer than the rest.");
    return;
  }
  pc.flags.tourney = {
    round: 1,
    kind,
    place: A.provName(pc.home),
  };
  A.tourneyRound(pc);
};

A.tourneyRound = function (pc) {
  const t = pc.flags.tourney;
  if (!t) return;
  const foe = A.makeOpponent(pc, t.round >= 3 ? "champion" : "spar");
  foe.skills.lance = A.ri(20, 60) + t.round * 6;
  foe.skills.riding = A.ri(25, 65);
  foe.gear.mount = t.kind === "lance" ? "destrier" : null;
  if (t.kind === "lance") foe.gear.weapon = "lance";
  const titles = ["First round", "Second round", "The semi-final", "The final"];
  A.startDuel(pc, foe, {
    kind: "tourney",
    place: `the lists at ${t.place}`,
    lethal: false,
    mounted: t.kind === "lance",
    title: `Tournament — ${titles[t.round - 1]} (${t.kind === "lance" ? "the joust" : "the sword bouts"})`,
    onEnd: {
      fn: "tourney",
    },
  });
};

A.DUEL_END.tourney = function (D) {
  const pc = A.pc(),
    t = pc.flags.tourney;
  if (t)
    if (D.result === "win") {
      if (t.round >= 4) {
        const prize = t.kind === "lance" ? 400 : 150;
        pc.coin += prize;
        A.fame(pc, 12);
        A.log(`You win the tournament at ${t.place}! ${A.coin(prize)} and a champion's wreath.`, "big");
        pc.deeds.push({
          y: A.S.year,
          t: `Won the tournament at ${t.place}`,
        });
        if (!pc.epithet && pc.fame > 40 && A.chance(0.4)) {
          pc.epithet = A.pick(["the Champion", "Lancebreaker", "the Unhorsed-No-More", "the Bold"]);
          A.log(`The crowd gives you a name: ${pc.epithet}.`, "big");
        }
        delete pc.flags.tourney;
        return;
      }
      t.round++;
      A.tourneyRound(pc);
    } else {
      A.log(`You are out of the tournament in the ${["first", "second", "semi-final", "final"][t.round - 1]} round.`);
      if (t.round >= 3) {
        pc.coin += 20;
        A.fame(pc, 3);
      }
      delete pc.flags.tourney;
    }
};

A.beastsNear = function (pc) {
  const here = A.prov(pc.home),
    terr = here ? here.terr : "plains",
    out = [];
  for (const id in A.BEASTS) {
    const B = A.BEASTS[id];
    if (
      LORE.creatures.find(c => c.id === id) &&
      (B.terr.includes(terr) ||
        (terr === "steppe" && B.terr.includes("plains")) ||
        (terr === "plains" && B.terr.includes("savanna")))
    )
      out.push(id);
  }
  return out;
};

A.startHunt = function (pc, famous) {
  const here = A.prov(pc.home),
    terr = here ? here.terr : "plains",
    near = A.beastsNear(pc);
  if ((A.trainSkill(pc, "survival", 3), !famous)) {
    const skill = A.skill(pc, "survival") + A.skill(pc, "bow") * 0.6 + A.stat(pc, "ins") * 0.3;
    if (near.length && A.chance(0.12)) {
      const id2 = A.pick(near);
      A.queue({
        type: "event",
        ev: "hunt_beast",
        ctx: {
          beast: id2,
        },
      });
      return;
    }
    if (A.chance(0.25 + skill / 150)) {
      const game = A.pick(A.GAME_BEASTS[terr] || A.GAME_BEASTS.plains),
        val = A.ri(1, 6) + Math.round(skill / 20);
      pc.coin += val;
      pc.happy = A.clamp(pc.happy + 3, 0, 100);
      A.log(`You bring down ${game}. Meat for the table and ${A.coin(val)} for the hide.`, "good");
      if (A.chance(0.15))
        A.queue({
          type: "event",
          ev: "poach_caught",
        });
    } else A.log("You come home with wet boots and nothing else.");
    return;
  }
  const hoaxes = LORE.creatures.filter(c => /hoax|misunderstanding/.test(c.cat));
  if (!near.length || A.chance(0.18)) {
    const h = A.pick(hoaxes);
    A.log(
      `You spend weeks hunting ${h.name}. ${h.truth ? "You learn the truth: " + h.truth : "You find nothing."}`,
      "lore",
    );
    A.willGrow(pc, 0.5, "patience");
    return;
  }
  const id = A.pick(near);
  A.queue({
    type: "event",
    ev: "hunt_beast",
    ctx: {
      beast: id,
      famous: 1,
    },
  });
};

GD.TECH_FX = [
  "edge",
  "dmg",
  "pierce",
  "counter",
  "stun",
  "bleed",
  "disarm",
  "hamstring",
  "tire",
  "steady",
  "read",
  "knockdown",
  "guardbreak",
  "reach",
  "mounted",
  "ranged",
  "fury",
  "nonlethal",
  "adapt",
  "heal",
];

GD.TECH_FX_DESC = {
  edge: n => `+${n} edge`,
  dmg: n => `×${n} damage`,
  pierce: n => `+${n} armor-piercing`,
  counter: () => "counters the blow it turns",
  stun: n => `stuns (${n} round${n > 1 ? "s" : ""})`,
  bleed: n => `bleeds ${n}/round`,
  disarm: n => `weakens their grip (−${n} skill)`,
  hamstring: n => `slows them (−${n} speed)`,
  tire: n => `tires them (+${n} fatigue)`,
  steady: n => `catch your breath (−${n} fatigue)`,
  read: () => "reveals their next move",
  knockdown: () => "knocks them off balance",
  guardbreak: n => `breaks guards (+${n} vs a guard, ignores shields)`,
  reach: n => `+${n} with longer reach`,
  mounted: () => "only on horseback",
  ranged: n => `a shot before the clash (×${n})`,
  fury: () => "fury: hit harder, guard less",
  nonlethal: () => "ends it without killing",
  adapt: n => `+${n} adaptation`,
  heal: n => `recover ${n} blood`,
};

GD.STYLE_RANKS = ["Novice", "Student", "Adept", "Master", "Grandmaster"];

GD.STYLE_XP = [0, 40, 110, 230, 420];

GD.STYLE_PROF = [5, 20, 40, 62, 82];

A.style = id => (A.S && A.S.styles && A.S.styles[id]) || (LORE.styles && LORE.styles[id]) || null;

A.allStyles = () => Object.values(LORE.styles || {}).concat(Object.values((A.S && A.S.styles) || {}));

A.stylesOfRealm = rid => A.allStyles().filter(s => s.realm === rid && s.kind === "national");

A.householdStyle = hid => A.allStyles().find(s => s.kind === "household" && s.house === hid) || null;

A.styleRankName = (st, r) => (st && st.ranks && st.ranks[r - 1]) || GD.STYLE_RANKS[r - 1] || "";

A.techsOf = function (p) {
  const out = [];
  if (!p || !p.styles) return out;
  for (const sid in p.styles) {
    const st = A.style(sid);
    if (!st) continue;
    const r = p.styles[sid].rank || 0;
    for (const t of st.techniques || [])
      if (t.rank <= r)
        out.push({
          t,
          sid,
        });
  }
  for (const x of p.techs || []) {
    const st = A.style(x.sid),
      t = st && (st.techniques || []).find(y => y.id === x.tid);
    if (t && !out.some(o => o.t.id === t.id))
      out.push({
        t,
        sid: x.sid,
        stolen: true,
      });
  }
  return out;
};

A.techWeaponOk = function (t, f) {
  const w = t.weapon || ["any"];
  return w.includes("any")
    ? true
    : t.fx && t.fx.mounted && !f.mounted
      ? false
      : !!(
          w.includes(f.skillK) ||
          (w.includes("dualwield") && f.dual) ||
          (w.includes("shield") && f.shield > 0) ||
          (w.includes("mounted") && f.mounted) ||
          ((w.includes("bow") || w.includes("xbow") || w.includes("throwing")) &&
            f.rangedSkill &&
            w.includes(f.rKind)) ||
          (w.includes("melee") && f.skillK !== "beast")
        );
};

A.styleFighter = function (f, p) {
  if (p && p.npc !== false && p.id !== (A.S && A.S.pc)) A.npcStyles(p);
  f.techs = A.techsOf(p)
    .filter(x => A.techWeaponOk(x.t, f))
    .map(x => ({
      id: x.t.id,
      sid: x.sid,
      uses: x.t.uses || 1,
    }));
  f.st = {
    stun: 0,
    knock: 0,
    bleed: [],
    disarm: 0,
    hamstring: 0,
    fury: 0,
  };
  const main =
    p && p.styleMain && p.styles && p.styles[p.styleMain]
      ? p.styleMain
      : p && p.styles
        ? Object.keys(p.styles).sort((a, b) => p.styles[b].rank - p.styles[a].rank)[0]
        : null;
  f.chain = f.chain || (main && A.style(main) ? A.style(main).name : null);
  f.styleId = main || null;
};

A.techById = function (sid, tid) {
  const st = A.style(sid);
  return (st && (st.techniques || []).find(t => t.id === tid)) || null;
};

// [X1 baked patch core/01-replay ENG-STYLE-RNG] Looking at a fighter changed the world. A.fightWorth (a question)
// generated and saved NPC fighting styles with the main random stream, so rendering tier chips, odds or worth
// tooltips moved the dice and broke replays and problem reports. Now npcStyles rolls from a stream seeded by the
// world seed and the person, and fightWorth discards styles it only imagined; real styles are created by the duel
// code, at the same moment in every replay.
A.npcStyles = function (p) {
  if (!p || p.styles || ((p.styles = {}), !A.isAdult(p) || p.race === "beast")) return;
  const _rs = A.rngState;
  let _h = 2166136261;
  for (const ch of ((A.S && A.S.seed) || 0) + "|" + p.id + "|" + p.born)
    _h = Math.imul(_h ^ ch.charCodeAt(0), 16777619);
  A.rngState = _h >>> 0 || 1;
  try {
    const best = Math.max(
        A.skill(p, "sword"),
        A.skill(p, "spear"),
        A.skill(p, "axe"),
        A.skill(p, "unarmed"),
        A.skill(p, "bow"),
        A.skill(p, "lance"),
        A.skill(p, "dagger"),
      ),
      rankFor = () => A.clamp(Math.floor(best / 22) + (A.chance(0.3) ? 1 : 0), 1, 5),
      hs = p.house ? A.householdStyle(p.house) : null;
    if (hs && A.chance(0.85))
      p.styles[hs.id] = {
        rank: rankFor(),
        xp: 0,
      };
    const nat = A.stylesOfRealm(p.realm),
      ch =
        {
          royal: 0.8,
          noble: 0.7,
          gentry: 0.6,
        }[p.status] ||
        (p.mil ? 0.5 : p.occ && /soldier|guard|sergeant|captain|knight|general/.test(p.occ) ? 0.55 : 0.12);
    // [X1 baked patch core/01-replay ENG-STYLE-RNG] Looking at a fighter changed the world. A.fightWorth (a question)
    // generated and saved NPC fighting styles with the main random stream, so rendering tier chips, odds or worth
    // tooltips moved the dice and broke replays and problem reports. Now npcStyles rolls from a stream seeded by the
    // world seed and the person, and fightWorth discards styles it only imagined; real styles are created by the duel
    // code, at the same moment in every replay.
    if (nat.length && A.chance(ch)) {
      const s = A.pick(nat);
      p.styles[s.id] = {
        rank: rankFor(),
        xp: 0,
      };
    }
  } finally {
    A.rngState = _rs;
  }
};

A.aiTech = function (f, act, D) {
  if (!f.techs || !f.techs.length) return null;
  // [X1 baked patch core/03-engine-fixes ENG-DUEL-TECH] NPC techniques: aiTech picked a technique that did not match
  // the announced action 25% of the time; such a technique can never be used, yet duelAct spent its use before
  // noticing, after the read hint had already named it to the player. Now the NPC only plans techniques that fit its
  // action, and a use is spent only when the technique is actually used.
  const opts = f.techs
    .filter(x => x.uses > 0)
    .map(x => ({
      x,
      t: A.techById(x.sid, x.id),
    }))
    .filter(
      o => o.t && o.t.base === act && !(o.t.fx && o.t.fx.ranged && D.round > 1) && (!o.t.cost || f.fat + o.t.cost < 90),
    );
  return !opts.length || !A.chance(0.45) ? null : A.pick(opts);
};

A.techUse = function (f, tid) {
  const x = (f.techs || []).find(y => y.id === tid);
  return !x || x.uses <= 0 ? null : (x.uses--, A.techById(x.sid, x.id));
};

A.techEdge = function (D, f, o, t, act, oact) {
  let e = 0;
  if (t) {
    const fx = t.fx || {};
    e += fx.edge || 0;
    if (fx.guardbreak && oact === "guard") e += fx.guardbreak;
    if (fx.reach && f.reach - o.reach > 4) e += fx.reach;
    if (fx.mounted && f.mounted) e += 1;
    if (fx.ranged && D.round <= 2) e += 1;
    if (fx.fury) f.st.fury = 2;
  }
  if (f.st) {
    if (f.st.stun > 0) e -= 3;
    if (f.st.knock > 0) e -= 2;
    if (f.st.fury > 0) e += 1;
  }
  return e;
};

A.techStatusLine = function (f) {
  if (!f.st) return "";
  const s = [];
  if (f.st.stun > 0) s.push("stunned");
  if (f.st.knock > 0) s.push("off balance");
  if (f.st.bleed.length) s.push("bleeding");
  if (f.st.disarm > 0) s.push("weak grip");
  if (f.st.hamstring > 0) s.push("slowed");
  if (f.st.fury > 0) s.push("in a fury");
  return s.join(", ");
};

A.techHitMod = function (f, t) {
  const m = {
    dmg: 1,
    pierce: 0,
    noShield: false,
  };
  if (t && t.fx) {
    m.dmg *= t.fx.dmg || 1;
    m.pierce += t.fx.pierce || 0;
    if (t.fx.guardbreak) m.noShield = true;
    if (t.fx.ranged) m.dmg *= 1 + t.fx.ranged * 0.25;
  }
  if (f.st && f.st.fury > 0) m.dmg *= 1.3;
  return m;
};

A.techAfter = function (D, f, o, t, won, margin) {
  if (!t) return;
  const fx = t.fx || {},
    who = f.isPC ? "You" : f.short,
    whom = o.isPC ? "you" : (o.beast, o.short);
  D.log.push(`${f.isPC ? "✦ You use" : "✦ " + f.short + " uses"} ${t.name}${(A.style(t.sid || ""), "")}.`);
  if (fx.steady) f.fat = Math.max(0, f.fat - fx.steady);
  if (fx.heal) f.hp = Math.min(f.maxHp, f.hp + fx.heal);
  if (fx.adapt) f.adapt += fx.adapt;
  if (fx.read && f.isPC) D.revealNext = true;
  if (won) {
    if (fx.counter && (t.base === "guard" || t.base === "feint")) {
      A.applyHit(D, f, o, Math.max(2, margin + 1), "strike");
      D.log.push(`${who} turn${f.isPC ? "" : "s"} it straight into a counter.`);
    }
    if (fx.stun) {
      o.st.stun = Math.max(o.st.stun, fx.stun);
      D.log.push(`${A.cap(whom)} ${o.isPC ? "are" : "is"} stunned.`);
    }
    if (fx.knockdown) {
      o.st.knock = Math.max(o.st.knock, 1);
      D.log.push(`${A.cap(whom)} stagger${o.isPC ? "" : "s"}, off balance.`);
    }
    if (fx.bleed) o.st.bleed.push([fx.bleed, 3]);
    if (fx.disarm && !o.beast) {
      o.skill = Math.max(5, o.skill - fx.disarm);
      o.st.disarm = 1;
      D.log.push(`${A.cap(whom)} nearly lose${o.isPC ? "" : "s"} the weapon.`);
    }
    if (fx.hamstring) {
      o.spd = Math.max(5, o.spd - fx.hamstring);
      o.st.hamstring = 1;
    }
    if (fx.tire) o.fat = Math.min(100, o.fat + fx.tire);
    if (fx.nonlethal && !o.beast && o.hp < o.maxHp * 0.45 && !D.over) D.nonlethalEnd = f.isPC ? "win" : "lose";
  }
};

A.techTick = function (D, f) {
  if (!f.st) return;
  if (f.st.stun > 0) f.st.stun--;
  if (f.st.knock > 0) f.st.knock--;
  if (f.st.fury > 0) f.st.fury--;
  let bl = 0;
  f.st.bleed = f.st.bleed.filter(b => ((bl += b[0]), b[1]--, b[1] > 0));
  if (bl > 0) {
    f.hp -= bl;
    D.log.push(`${f.isPC ? "You bleed" : f.short + " bleeds"} (−${bl}).`);
  }
};

A.techSteal = function (D, pc) {
  const used = D.bUsed || [],
    out = [];
  for (const u of used) {
    if (A.techsOf(pc).some(x => x.t.id === u.tid)) continue;
    const ch = A.clamp(
      A.stat(pc, "ins") / 260 + A.stat(pc, "int") / 520 + (D.result === "win" ? 0.08 : 0.03),
      0.02,
      0.45,
    );
    if (A.chance(ch)) {
      pc.techs = pc.techs || [];
      pc.techs.push({
        sid: u.sid,
        tid: u.tid,
      });
      const t = A.techById(u.sid, u.tid);
      out.push(`You saw ${t.name} done to you, and you understand it now. It is yours.`);
    }
  }
  return out;
};

A.styleXp = function (p, sid, amt) {
  const st = A.style(sid);
  if (!st || !p.styles || !p.styles[sid]) return;
  const s = p.styles[sid],
    apt = p.apt && p.apt[st.prof] ? p.apt[st.prof] : 1;
  s.xp = (s.xp || 0) + amt * apt;
  const graded =
    p.id === A.S.pc && p.school && p.school.kind === "style" && p.school.style === sid && A.EV && A.EV.gr_grading;
  for (; s.rank < 5 && s.xp >= GD.STYLE_XP[s.rank] && A.skill(p, st.prof) >= GD.STYLE_PROF[s.rank]; ) {
    if (graded) {
      if (!s.gradingDue) {
        s.gradingDue = A.S.year;
        A.log(
          `${st.name}: the masters say you are ready to be graded for ${A.styleRankName(st, s.rank + 1)}. Your grading bout comes this year.`,
          "good",
        );
      }
      break;
    }
    A.styleRankUp(p, sid);
  }
};

A.styleRankUp = function (p, sid) {
  const st = A.style(sid),
    s = p.styles && p.styles[sid];
  if (!(!st || !s || s.rank >= 5) && (s.rank++, (s.gradingDue = null), p.id === A.S.pc)) {
    const nt = (st.techniques || []).filter(t => t.rank === s.rank);
    A.log(
      `${st.name}: you rise to ${A.styleRankName(st, s.rank)}.${nt.length ? " You learn " + nt.map(t => t.name).join(" and ") + "." : ""}`,
      "big",
    );
    if (s.rank >= 4) A.fame(p, 3);
    if (s.rank === 5) {
      A.fame(p, 8);
      p.deeds.push({
        y: A.S.year,
        t: `Grandmaster of ${st.name}`,
      });
      A.ach("school_master");
    }
  }
};

A.learnStyle = function (p, sid, rank) {
  const st = A.style(sid);
  return st
    ? ((p.styles = p.styles || {}),
      p.styles[sid]
        ? ((p.styles[sid].rank = Math.max(p.styles[sid].rank, rank || 1)), true)
        : ((p.styles[sid] = {
            rank: rank || 1,
            xp: GD.STYLE_XP[(rank || 1) - 1] || 0,
          }),
          p.styleMain || (p.styleMain = sid),
          p.id === (A.S && A.S.pc) &&
            A.log(
              `You begin to learn ${st.name}.${
                (st.techniques || []).filter(t => t.rank <= (rank || 1)).length
                  ? " First technique: " +
                    st.techniques
                      .filter(t => t.rank <= (rank || 1))
                      .map(t => t.name)
                      .join(", ") +
                    "."
                  : ""
              }`,
              "good",
            ),
          true))
    : false;
};

A.styleYear = function (pc) {
  const age = A.age(pc),
    R2 = GD.RACES[pc.race];
  let hs = pc.house && !pc.flags.bastard ? A.householdStyle(pc.house) : null;
  if (!hs)
    for (const pid of pc.parents || []) {
      const par = A.P(pid),
        fs2 = par && par.flags && par.flags.foundedStyle;
      if (fs2 && A.style(fs2)) {
        hs = A.style(fs2);
        break;
      }
    }
  if (
    (hs &&
      age >= R2.adult * 0.45 &&
      ((!pc.styles || !pc.styles[hs.id]) &&
        (A.learnStyle(pc, hs.id, 1),
        A.log(`Your family begins to teach you ${hs.name}, a way of fighting only your blood is taught.`, "lore")),
      A.styleXp(pc, hs.id, 6 + (pc.school ? 0 : 6)),
      A.trainSkill(pc, hs.prof, 2)),
    pc.school && pc.school.style)
  ) {
    const st = A.style(pc.school.style);
    if (st)
      A.styleXp(
        pc,
        st.id,
        22 +
          A.stat(pc, "ins") / 6 +
          A.skill(pc, st.prof) / 8 +
          (A.has(pc, "diligent") ? 8 : 0) -
          (A.has(pc, "lazy") ? 8 : 0),
      );
  }
  for (const sid in pc.styles || {})
    if (!(pc.school && pc.school.style === sid) && (!hs || hs.id !== sid)) A.styleXp(pc, sid, 3);
};

A.styleDuelXp = function (pc, D) {
  if (!pc.styles) return;
  const main = D.a.styleId;
  if (main && pc.styles[main]) A.styleXp(pc, main, D.kind === "spar" ? 4 : 8 + Math.max(0, D.gap));
};

A.canFoundStyle = function (pc) {
  const k = A.weaponSkillOf(pc),
    v = A.skill(pc, k),
    wins = pc.flags.duelWins || 0;
  return v < 75
    ? [false, `Your ${GD.SKILLS[k]} must reach 75 (now ${v}).`]
    : wins < 12
      ? [false, `Win more real fights first (${wins}/12).`]
      : A.stat(pc, "int") + A.stat(pc, "ins") < 90
        ? [false, "You need more insight to put it into words (Instincts + Intelligence 90)."]
        : pc.flags.foundedStyle
          ? [false, "You have already founded a style."]
          : [true, ""];
};

A.foundStyle = function (pc, name) {
  const [ok, why] = A.canFoundStyle(pc);
  if (!ok)
    return {
      ok: false,
      msg: why,
    };
  const S = A.S;
  S.styles = S.styles || {};
  const k = A.weaponSkillOf(pc),
    id = "STP-" + (Object.keys(S.styles).length + 1) + "-" + pc.id,
    known = A.techsOf(pc)
      .map(x => x.t)
      .filter(
        t =>
          (t.weapon || ["any"]).includes(k) || (t.weapon || []).includes("any") || (t.weapon || []).includes("melee"),
      ),
    base = known.slice(0, 2).map((t, i) =>
      Object.assign({}, t, {
        id: id + "-t" + i,
        rank: i + 1,
        name: t.name,
      }),
    ),
    own = [
      {
        id: id + "-a",
        name: "The " + (pc.epithet ? pc.epithet.replace(/^the /i, "") : pc.given) + " Cut",
        rank: 1,
        base: "strike",
        uses: 2,
        cost: 8,
        weapon: [k],
        fx: {
          edge: 1,
          dmg: 1.15,
        },
        desc: "Your own answer to the question every fighter asks.",
      },
      {
        id: id + "-b",
        name: "Lesson of the Scars",
        rank: 3,
        base: "guard",
        uses: 1,
        cost: 4,
        weapon: [k],
        fx: {
          counter: true,
          edge: 1,
          adapt: 2,
        },
        desc: "Every wound you took taught this.",
      },
      {
        id: id + "-c",
        name: "The Last Word",
        rank: 5,
        base: "press",
        uses: 1,
        cost: 18,
        weapon: [k],
        fx: {
          edge: 2,
          dmg: 1.35,
          knockdown: true,
        },
        desc: "What you do when it must end now.",
      },
    ],
    st = {
      id,
      realm: pc.realm,
      name: name || `The ${pc.sur || pc.given} Way`,
      kind: "household",
      house: pc.house || "PC-" + pc.id,
      prof: k,
      weapons: [k, "melee"],
      origin: `Founded by ${A.fullName(pc)} in ${S.year}.`,
      philosophy: "Learned in real fights, not in a yard.",
      strengths: "Its founder's instincts.",
      weakness: "Young and untested.",
      ranks: GD.STYLE_RANKS.slice(),
      techniques: own.concat(base.length ? [] : []),
      founder: pc.id,
    };
  if (known[0])
    st.techniques.push(
      Object.assign({}, known[0], {
        id: id + "-k1",
        rank: 2,
      }),
    );
  if (known[1])
    st.techniques.push(
      Object.assign({}, known[1], {
        id: id + "-k2",
        rank: 4,
      }),
    );
  st.techniques.sort((a, b) => a.rank - b.rank);
  S.styles[id] = st;
  pc.styles = pc.styles || {};
  pc.styles[id] = {
    rank: 5,
    xp: GD.STYLE_XP[4],
  };
  pc.styleMain = id;
  pc.flags.foundedStyle = id;
  if (!pc.house) pc.flags.styleHouse = id;
  A.fame(pc, 10);
  pc.deeds.push({
    y: S.year,
    t: `Founded ${st.name}`,
  });
  A.log(`You found ${st.name}. Your children and their children will be taught it.`, "big");
  return {
    ok: true,
    msg: `${st.name} is born.`,
  };
};

A.inheritFoundedStyle = function (child) {
  for (const pid of child.parents || []) {
    const par = A.P(pid);
    if (par && par.flags && par.flags.foundedStyle && A.style(par.flags.foundedStyle))
      child.flags.familyStyle = par.flags.foundedStyle;
  }
};

GD.ACADEMY_TYPES = {
  war: {
    name: "War College",
    profs: ["command", "tactics", "logistics", "siegecraft"],
    fee: 60,
    minStatus: ["gentry", "noble", "royal"],
    orSoldier: 2,
    literate: true,
    desc: "Officers are made here: command, tactics, supply and sieges. Graduates enter the army as officers.",
  },
  letters: {
    name: "Royal College",
    profs: ["learning", "etiquette", "diplomacy", "persuasion"],
    fee: 50,
    literate: true,
    desc: "Law, letters, history and the forms of the court. Opens offices and embassies.",
  },
  medicine: {
    name: "College of Physicians",
    profs: ["medicine", "learning"],
    fee: 45,
    literate: true,
    desc: "Anatomy, herbs, bonesetting and fevers. Graduates practise as physicians.",
  },
  faith: {
    name: "Seminary",
    profs: ["faith", "learning", "persuasion"],
    fee: 10,
    desc: "Scripture, rite and preaching. Graduates are ordained.",
  },
  trade: {
    name: "Merchants' Hall",
    profs: ["trade", "stewardship", "persuasion", "logistics"],
    fee: 40,
    desc: "Accounts, prices, routes and contracts. Graduates are made traders of the hall.",
  },
  crafts: {
    name: "Guild School",
    profs: ["craft"],
    fee: 20,
    desc: "The guild trains its apprentices: smithing, masonry, joinery, weaving.",
  },
  sea: {
    name: "School of Navigation",
    profs: ["sea", "logistics", "athletics"],
    fee: 30,
    coast: true,
    desc: "Stars, charts, knots and command of a deck. Graduates sail as mates.",
  },
  arts: {
    name: "Conservatory",
    profs: ["music", "persuasion", "etiquette"],
    fee: 25,
    desc: "Song, verse and instruments for the halls of the great.",
  },
};

A.academiesOf = function (rid) {
  const custom = (LORE.academies || {})[rid],
    r = A.realm(rid) || LORE.realms[rid];
  if (!r) return [];
  const cap = r.capital || (LORE.realms[rid] || {}).capital || "the capital",
    coast = (A.S ? A.S.prov.filter(p => p.owner === rid) : []).some(p => p.coast),
    out = [];
  for (const k in GD.ACADEMY_TYPES) {
    const T = GD.ACADEMY_TYPES[k];
    if (T.coast && !coast) continue;
    const c = custom && custom.find(x => x.type === k);
    if (!(custom && custom.length && !c && k !== "crafts" && k !== "faith"))
      out.push({
        id: "AC-" + rid + "-" + k,
        type: k,
        realm: rid,
        name: c ? c.name : `${T.name} of ${cap}`,
        seat: c ? c.seat : cap,
        note: c ? c.note : T.desc,
        T,
      });
  }
  for (const f of (A.S && A.S.academies) || [])
    if (f.realm === rid && GD.ACADEMY_TYPES[f.type])
      out.push(
        Object.assign({}, f, {
          T: GD.ACADEMY_TYPES[f.type],
        }),
      );
  return out;
};

A.schoolList = function (pc) {
  const out = [],
    myR = pc.realm;
  for (const st of A.allStyles().filter(s => (s.kind === "national" || s.kind === "chain") && s.school)) {
    const here = st.realm === myR,
      sc = st.school;
    let ok = true,
      why = "";
    const racial = (LORE.realms[st.realm] || {}).race;
    if (["dwarf", "giant"].includes(racial) && pc.race !== racial) {
      ok = false;
      why =
        racial === "dwarf"
          ? "Dwarves never teach outsiders (Judgment of the First Hall, 904)."
          : "Only giants learn the giants' arts.";
    }
    if (sc.entry === "noble" && !["noble", "royal"].includes(pc.status) && !(pc.noble && pc.noble.rung >= 2)) {
      ok = false;
      why = "Takes only the sons and daughters of lords.";
    }
    if (sc.entry === "gentry" && !["gentry", "noble", "royal"].includes(pc.status) && !pc.mil) {
      ok = false;
      why = "Takes gentry and serving soldiers.";
    }
    if (sc.entry === "soldier" && !pc.mil) {
      ok = false;
      why = "Only for soldiers of the realm.";
    }
    if (/^race:/.test(sc.entry || "") && !sc.entry.slice(5).split("|").includes(pc.race)) {
      ok = false;
      why = "Not for your people.";
    }
    if (!here && pc.flags.unfree) {
      ok = false;
      why = "You are not free to travel.";
    }
    if (st.kind === "chain" && st.school.entry === "any" && !here && A.chance(0)) ok = false;
    out.push({
      kind: "style",
      chain: st.kind === "chain",
      id: st.id,
      st,
      name: sc.name,
      seat: sc.seat,
      realm: st.realm,
      here,
      ok,
      why,
      fee: sc.fee != null ? sc.fee : 40,
      prof: st.prof,
      master: sc.master || "",
      desc: st.philosophy,
    });
  }
  for (const rid of [myR])
    for (const ac of A.academiesOf(rid)) {
      let ok = true,
        why = "";
      const T = ac.T;
      if (T.literate && !pc.literate) {
        ok = false;
        why = "You must read and write.";
      }
      if (
        T.minStatus &&
        !T.minStatus.includes(pc.status) &&
        !(T.orSoldier != null && pc.mil && pc.mil.rank >= T.orSoldier)
      ) {
        ok = false;
        why = "Officers' sons and serving sergeants only.";
      }
      if (pc.flags.unfree) {
        ok = false;
        why = "Not while you are bound.";
      }
      out.push({
        kind: "academy",
        id: ac.id,
        ac,
        name: ac.name,
        seat: ac.seat,
        realm: rid,
        here: true,
        ok,
        why,
        fee: ac.house && ac.house === pc.house ? 0 : T.fee,
        prof: T.profs[0],
        desc: ac.note,
      });
    }
  const covered = new Set(
    A.allStyles()
      .filter(s => s.school)
      .map(s => s.school.name),
  );
  for (const o of A.schoolOptions(pc).filter(o2 => !covered.has(o2.s.name)))
    out.push({
      kind: "chain",
      id: "CH-" + o.i,
      i: o.i,
      name: o.s.name,
      seat: o.s.place,
      realm: o.s.realm,
      here: o.here,
      ok: o.ok,
      why: o.why,
      fee: o.fee,
      prof: o.skill,
      master: o.s.master,
      desc: o.s.teaches,
      req: o.req,
    });
  return out;
};

A.joinSchool2 = function (id) {
  const pc = A.pc(),
    o = A.schoolList(pc).find(x => x.id === id);
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
  if (pc.school)
    return {
      ok: false,
      msg: `You are already at ${pc.school.name}. Leave it first.`,
    };
  const age = A.age(pc),
    R2 = GD.RACES[pc.race];
  if (age < R2.adult * 0.5)
    return {
      ok: false,
      msg: "Too young.",
    };
  const fee = o.fee,
    payer = pc.coin >= fee ? "self" : A.S.family && A.S.family.wealth >= fee && age < R2.adult + 4 ? "family" : null;
  if (!payer)
    return {
      ok: false,
      msg: `The first year costs ${A.coin(fee)}.`,
    };
  if (o.kind === "chain") return A.joinSchool(o.i);
  const trialV =
      o.kind === "style"
        ? A.skill(pc, o.prof) * 0.6 + A.stat(pc, "ins") * 0.25 + A.stat(pc, "wil") * 0.25
        : A.skill(pc, o.prof) * 0.5 + A.stat(pc, "int") * 0.45 + A.skillEff(pc, "learning") * 0.1,
    need = (o.here ? 18 : 26) - (A.letterPower && A.letterPower(pc, "school") ? A.useLetter(pc, "school") / 4 : 0);
  if (trialV + A.ri(-8, 10) < need) {
    A.log(`You sit the entrance trial at ${o.name} and fail it. You may try again next year.`, "bad");
    return {
      ok: false,
      msg: "You failed the entrance trial.",
    };
  }
  if ((payer === "self" ? (pc.coin -= fee) : (A.S.family.wealth -= fee), !o.here)) {
    const sp = A.S.prov.find(p => p.name === o.seat && p.owner === o.realm) || A.realmProvs(o.realm)[0];
    if (sp) {
      pc.home = sp.id;
      A.log(`You travel to ${o.seat} to study.`);
    }
  }
  pc.school = {
    kind: o.kind,
    id: o.id,
    name: o.name,
    years: 0,
    skill: o.prof,
    style: o.kind === "style" ? o.id : null,
    academy: o.kind === "academy" ? o.ac.type : null,
    fee,
    realm: o.realm,
    rank: 1,
    master: o.master || "",
  };
  if (o.kind === "style")
    A.learnStyle(pc, o.id, Math.max(1, (pc.styles && pc.styles[o.id] && pc.styles[o.id].rank) || 1));
  const fams = Object.values(A.S.houses).filter(
    h =>
      h.realm === o.realm &&
      !h.extinct &&
      (h.great === false ? ["noble", "gentry_mil", "merchant", "scholar"].includes(h.kind) : true),
  );
  for (let i = 0; i < 2; i++) {
    const m = A.makeAcquaintance(pc, A.chance(0.55) ? "friend" : "rival");
    if (m && fams.length && A.chance(0.6)) {
      const h = A.pick(fams);
      m.house = h.id;
      m.sur = A.houseSurname(h);
      m.surMode = "house";
      m.status = h.status || (h.kind === "royal" ? "royal" : "noble");
    }
    if (m) {
      m.occ = "a student at " + o.name;
      m.flags.classmate = o.id;
    }
  }
  A.log(
    `You are admitted to ${o.name}${o.seat ? " at " + o.seat : ""}. ${o.kind === "style" ? "You will learn " + o.st.name + "." : "Study begins at the bell."}`,
    "good",
  );
  return {
    ok: true,
    msg: `Admitted to ${o.name}.`,
  };
};

A.schoolYear2 = function (pc) {
  const sc = pc.school;
  if (!sc || sc.kind === "chain" || sc.kind === void 0) return false;
  sc.years++;
  const R2 = GD.RACES[pc.race];
  if (pc.coin >= sc.fee) pc.coin -= sc.fee;
  else if (A.S.family && A.S.family.wealth >= sc.fee && A.age(pc) < R2.adult + 6) A.S.family.wealth -= sc.fee;
  else {
    A.log(`You cannot pay the fees at ${sc.name}. You leave.`, "bad");
    pc.school = null;
    return true;
  }
  const study =
    1 +
    (A.has(pc, "diligent") ? 0.2 : 0) -
    (A.has(pc, "lazy") ? 0.25 : 0) +
    (pc.flags.studyHard === A.S.year ? 0.4 : 0);
  if (sc.kind === "style") {
    const st = A.style(sc.style);
    if (st) {
      A.trainSkill(pc, st.prof, 7 * study);
      for (const w of (st.weapons || []).slice(0, 2))
        if (w !== st.prof && GD.SKILLS[w]) A.trainSkill(pc, w, 2.5 * study);
      A.train(pc, "ins", 0.8);
      A.train(pc, (GD.SKILL_STAT[st.prof] || ["str"])[0], 0.7);
    }
    const s = pc.styles && pc.styles[sc.style];
    sc.rank = s ? s.rank : 1;
    if (s && s.rank >= 3 && !pc.flags["grad_" + sc.style]) {
      pc.flags["grad_" + sc.style] = A.S.year;
      A.log(`You are named ${A.styleRankName(st, s.rank)} of ${sc.name}. The school's mark is yours for life.`, "big");
      A.fame(pc, 2);
    }
  } else {
    const T = GD.ACADEMY_TYPES[sc.academy];
    if (T) for (const k of T.profs) A.trainSkill(pc, k, (k === T.profs[0] ? 7 : 3.5) * study);
    A.train(pc, "int", 0.6);
    if (!pc.literate && A.chance(0.5)) pc.literate = true;
    const need =
      {
        war: 3,
        letters: 4,
        medicine: 5,
        faith: 3,
        trade: 3,
        crafts: 3,
        sea: 3,
        arts: 3,
      }[sc.academy] || 3;
    if (sc.years >= need && !pc.flags["dip_" + sc.academy]) {
      const T2 = GD.ACADEMY_TYPES[sc.academy],
        k = T2 ? T2.profs[0] : "learning";
      if (A.skill(pc, k) >= 30 || A.chance(0.4)) {
        pc.flags["dip_" + sc.academy] = A.S.year;
        A.log(`You graduate from ${sc.name}. ${A.DIPLOMA_TEXT[sc.academy] || ""}`, "big");
        A.fame(pc, 2);
        pc.deeds.push({
          y: A.S.year,
          t: `Graduated from ${sc.name}`,
        });
        pc.school = null;
        return true;
      }
      if (sc.years > need + 2) {
        A.log(`You fail the final examinations at ${sc.name} again and leave without the seal.`, "bad");
        pc.school = null;
        return true;
      }
    }
  }
  if (sc.kind === "style") {
    const s = pc.styles && pc.styles[sc.style];
    if (s && s.gradingDue && A.EV.gr_grading && !A.S.queue.some(q => q.ev === "gr_grading")) {
      A.queue({
        type: "event",
        ev: "gr_grading",
        ctx: {
          sid: sc.style,
        },
      });
      return true;
    }
    if (s && s.rank >= 2 && A.EV.gr_challenge && A.chance(0.14)) {
      A.queue({
        type: "event",
        ev: "gr_challenge",
        ctx: {
          sid: sc.style,
        },
      });
      return true;
    }
  }
  const evs = ["school_trial", "school_rival", "school_master_eye", "school_choice"].filter(x => A.EV[x]);
  if (evs.length && A.chance(0.35))
    A.queue({
      type: "event",
      ev: A.pick(evs),
    });
  return true;
};

A.DIPLOMA_TEXT = {
  war: "A commission waits for you: enlist and you start as an officer.",
  letters: "Offices and embassies will open to a graduate of the College.",
  medicine: "You may practise as a physician.",
  faith: "You are ordained.",
  trade: "The Hall's seal opens counting houses to you.",
  crafts: "You are a journeyman of the guild.",
  sea: "Any ship will take you on as a mate.",
  arts: "The great halls will pay to hear you.",
};

A.registerManeuvers = function () {
  if (!A.maneuversIn) {
    A.maneuversIn = true;
    for (const st of Object.values(LORE.styles || {})) {
      if (!st.maneuver) continue;
      const k = "mv_" + st.id;
      if (!GD.BATTLE_TACTICS[k])
        GD.BATTLE_TACTICS[k] = {
          name: st.maneuver.name,
          tac: null,
          troops: st.maneuver.troops && st.maneuver.troops.length ? st.maneuver.troops : "*",
          fx: Object.assign({}, st.maneuver.fx),
          desc: st.maneuver.desc + ` (${st.name})`,
          style: st.id,
        };
    }
  }
};

A.knowsManeuver = function (p, sid) {
  return !!(p && p.styles && p.styles[sid] && p.styles[sid].rank >= 3);
};

A.COMPANY_NAMES = [
  "the Grey Hand",
  "the Reef Crossbows",
  "the Red Lanterns",
  "the Free Spears of Ostra",
  "the Black Mares",
  "the Saltwater Company",
  "the Iron Tithe",
  "the Lantern Swords",
  "the Company of the Broken Wheel",
  "the Ashen Banner",
  "the White Company of the Marches",
  "the Twelve Ravens",
  "the Copper Shields",
  "the Vintners' Blades",
  "the Last Ford Company",
];

A.UNIT_NAMES = ["Foot", "Spears", "Shields", "Bows", "Guard", "Watch", "Levy", "Wardens", "Company", "Lances"];

A.milTitle = p => (p.mil ? GD.MIL[p.mil.rank].title : "");

A.milUnitWord = rank =>
  rank <= 0
    ? "mess"
    : rank <= 1
      ? "file"
      : rank <= 2
        ? "section"
        : rank <= 3
          ? "hundred"
          : rank <= 4
            ? "company"
            : rank <= 5
              ? "wing"
              : rank <= 6
                ? "regiment"
                : rank <= 7
                  ? "battle"
                  : "army";

A.troopFor = function (pc, realm) {
  const d = GD.DOCTRINE[realm] || GD.DOCTRINE.unclaimed,
    R2 = pc.race;
  if (R2 === "giant") return "GI";
  if (R2 === "elf") return "EA";
  const opts = [],
    add = (code, w) => {
      if (code) opts.push([code, w]);
    };
  add(d[4], 3);
  add(d[5], 2 + A.skill(pc, "bow") / 20 + A.skill(pc, "xbow") / 20);
  add(d[3], (pc.gear.armor === "mail" ? 3 : 0.5) + A.stat(pc, "str") / 40);
  if (A.skill(pc, "riding") >= 20 && pc.gear.mount) {
    add(d[1], 2 + A.skill(pc, "riding") / 25);
    if (pc.gear.mount === "destrier" || ["noble", "royal", "gentry"].includes(pc.status)) add(d[0], 4);
  }
  add(d[6], 1);
  if (realm === "POL-05" && A.skill(pc, "bow") >= 20) opts.push(["LB", 6]);
  const pick = A.wpick(opts, o => o[1]);
  return pick ? pick[0] : "SP";
};

A.enlist = function (pc, merc) {
  const res = enlistNow(pc, merc);
  if (pc && pc.mil && pc.mil.rankSince == null) pc.mil.rankSince = A.absDay();
  return res;
};

const enlistNow = function (pc, merc) {
  const why = A.roleBlock(pc, merc ? "company" : "army");
  if (why)
    return {
      ok: false,
      msg: why,
    };
  const age = A.age(pc),
    R2 = GD.RACES[pc.race];
  if (age < R2.adult - 1)
    return {
      ok: false,
      msg: "Too young for the rolls.",
    };
  if (pc.flags.unfree === "slave")
    return {
      ok: false,
      msg: "Slaves do not carry spears for the realm.",
    };
  if (pc.flags.deserter && !merc && A.chance(0.6))
    return {
      ok: false,
      msg: "The recruiting sergeant knows your face. Deserters are hanged, not hired.",
    };
  const realm = merc ? null : pc.realm;
  if (!merc && (!A.realm(realm) || !A.realm(realm).alive))
    return {
      ok: false,
      msg: "There is no realm army here to join.",
    };
  const company = merc ? A.pick(A.COMPANY_NAMES) : null,
    troop = A.troopFor(pc, realm || "unclaimed");
  let rank = 0;
  if (!merc) {
    if (pc.status === "gentry" || (pc.noble && pc.noble.rung >= 2)) rank = 1;
    if (pc.status === "noble") rank = Math.max(rank, 3);
    if (pc.status === "royal") rank = Math.max(rank, 4);
    if (pc.noble && pc.noble.rung >= 4) rank = Math.max(rank, 4);
  }
  const famRank = merc ? 0 : A.famMilBonus(pc);
  if (famRank && A.house(pc.house) && A.house(pc.house).realm === realm) {
    const start = Math.min(4, Math.max(1, Math.floor(famRank / 2)));
    if (start > rank) {
      rank = start;
      A.log(
        `Your family's name opens the rolls: the ${A.house(pc.house).military.unit} takes you in as ${GD.MIL[rank].title}.`,
        "good",
      );
    }
    pc.flags.famUnit = A.house(pc.house).military.unit;
  }
  if (pc.flags.unfree === "serf") pc.flags.leviedSerf = true;
  const r = A.realm(realm);
  if (pc.job && !merc) {
    A.log(`You leave your work as ${GD.CAREERS[pc.job.c].ranks[pc.job.r][0].toLowerCase()} behind.`);
    pc.job = null;
  }
  const unit = merc
    ? company
    : `the ${A.pick(["First", "Second", "Third", "Fourth", "Seventh", "Ninth", "Old", "King's", "Queen's", "Border"])} ${A.provName(pc.home)} ${A.pick(A.UNIT_NAMES)}`;
  pc.mil = {
    realm: realm || pc.realm,
    merc: !!merc,
    company,
    troop,
    rank,
    merit: GD.MIL[rank].merit,
    years: 0,
    battles: 0,
    kills: 0,
    squad: [],
    unit,
    missions: 0,
    warsCommanded: {},
    joined: A.S.year,
  };
  if (merc) pc.mil.realm = null;
  const g = GD.TROOP_GEAR[troop] || GD.TROOP_GEAR.SP,
    issue = (slot, k) => {
      if (
        k &&
        (!pc.gear[slot] ||
          pc.gear[slot] === "fists" ||
          pc.gear[slot] === "none" ||
          (GD.GEAR[pc.gear[slot]] &&
            GD.GEAR[k] &&
            GD.GEAR[pc.gear[slot]].price < GD.GEAR[k].price &&
            slot !== "weapon"))
      )
        pc.gear[slot] = k;
    };
  issue("weapon", g[0] === "lance" && !pc.gear.mount ? "spear" : g[0]);
  issue("armor", g[1]);
  if (g[2]) issue("shield", g[2]);
  if (g[3]) issue("helm", g[3]);
  if (g[4]) issue("ranged", g[4]);
  if ((troop === "LC" || troop === "MC" || troop === "HA" || troop === "OR" || troop === "CM") && !pc.gear.mount)
    pc.gear.mount = troop === "CM" ? "camel" : "horse";
  A.makeSquad(pc);
  const tname = GD.TROOPS[troop] ? GD.TROOPS[troop].name : "soldiers";
  A.log(
    `You ${merc ? "sign the articles of " + company : "take the coin of " + r.name} and swear the oath. ${A.milTitle(pc)} among the ${tname.toLowerCase()} of ${unit}.`,
    "big",
  );
  const mates = pc.mil.squad.map(A.P).filter(Boolean);
  if (mates.length)
    A.log(
      `Your messmates: ${mates
        .slice(0, 4)
        .map(m => m.given)
        .join(
          ", ",
        )} and ${mates.length - 4 > 0 ? mates.length - 4 + " more" : "you"}. You eat, march and sleep together now.`,
    );
  return {
    ok: true,
  };
};
