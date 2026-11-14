// The release's core, realms and war years (part 1 of 2): Provinces changing hands, realms falling, the war year, losses and fronts; talking to people (A.interact).
// Readable source of vendor/ardan-b593143.html with the patch layer baked in (X1, docs/DECISIONS.md D-028). Edit it here.
// Defines: endWarNow, A.transferProv, A.realmGone, A.realmFalls, A.warYear, A.applyLosses, A.warFront, A.checkPeace,
// A.settleWar, A.rulerDies, A.pickHeirFrom, A.findClaimant, A.successionWar, A.electRuler, A.electable, A.houseHead,
// A.kill, A.rollBranches, A.branchYear, A.worldYear, A.diplomacyYear, A.deathChance, A.ageNpc, A.FAM_STATUS_KINDS,
// A.FAM_KIND_NAME, A.initFamilies, A.famData, A.houseTemplate, A.packState, A.unpackState, A.famRaceOk,
// A.familiesFor, A.famMembers, A.famParent, A.familyFameStart, A.famMilBonus, A.raceAllowed, A.statusAllowed,
// A.housesFor, A.houseBloodline, A.parentRaces, A.OCC, A.occPick, A.parentAgeRange, A.newGame, A.bastardName,
// A.prepareStart, A.birthStory, A.heirsOf, A.continueAs, A.stage, A.isAdult, A.freeTime, A.lifestyleDefault,
// A.LIFESTYLE, A.ageUp, A.naturalCause, A.bodyYear, A.bloodYear, A.familyYear, and 4 more.

const endWarNow = function (w, result, text) {
  const S = A.S;
  S.wars = S.wars.filter(x => x !== w);
  for (const p of S.prov)
    if (p.occ && (w.att.includes(p.occ) || w.def.includes(p.occ))) {
      if (A.S.wars.some(x => x.att.includes(p.occ) || x.def.includes(p.occ))) {
        if ((w.att.includes(p.occ) && w.def.includes(p.owner)) || (w.def.includes(p.occ) && w.att.includes(p.owner)))
          p.occ = null;
      } else p.occ = null;
    }
  for (const a of w.att)
    for (const d of w.def) {
      const ra = A.realm(a),
        rd = A.realm(d);
      if (ra) ra.truce[d] = S.year + 10;
      if (rd) rd.truce[a] = S.year + 10;
    }
  for (const r of w.att.concat(w.def)) {
    const rr = A.realm(r);
    if (rr) rr.exhaustion = Math.max(0, rr.exhaustion - 25);
  }
  A.news(text || w.name + " ends.", "peace");
  w.result = result;
  w.end = S.year;
  S.history.push({
    y: S.year,
    t: w.name + " (" + w.start + "–" + S.year + "): " + (text || result),
  });
  const pc = A.pc();
  if (pc && (w.att.includes(pc.realm) || w.def.includes(pc.realm))) {
    A.log(text || w.name + " is over.", "peace");
    const side = A.warSide(w, pc.realm);
    if (
      pc.mil &&
      ((side === "att" && result === "att") || (side === "def" && result === "def")) &&
      pc.mil.rank >= 6 &&
      pc.mil.warsCommanded &&
      pc.mil.warsCommanded[w.id]
    )
      A.ach("conqueror");
    if (pc.ruler && ((side === "att" && result === "att") || (side === "def" && result === "def"))) A.ach("conqueror");
  }
};

A.transferProv = function (prov, to, silent) {
  const from = prov.owner;
  if (A.polOnTransfer && from !== to) A.polOnTransfer(prov, from, to);
  // [X1 baked patch core/09-engine-at-scale SCALE-LAND-WRITES] A.realmProvs and A.neighbors scanned every province
  // on every call (A.politicsYear asks them for every pair of realms, so a year cost realms² × provinces).
  // 09-engine-at-scale answers them from an index of provinces by owner, which must be dropped the moment a province
  // changes hands. These are all the places that write a province's owner directly: transferProv, the claimant
  // settlements in settleWar, a claimant taking land in a succession war, a player founding a realm, a faction
  // breaking away, and Tessaria's split at the start. Each now bumps the land version.
  prov.owner = to;
  if (A.scaleLand) A.scaleLand();
  prov.occ = null;
  prov.siege = 0;
  prov.unrest = Math.min(100, prov.unrest + 25);
  const pc = A.pc();
  if (!silent) A.news(prov.name + " passes from " + A.realmShort(from) + " to " + A.realmShort(to) + ".", "map");
  if (pc && pc.home === prov.id && pc.realm === from && !pc.ruler)
    A.log("Your home, " + prov.name + ", now belongs to " + A.realmName(to) + ".", "war");
  const r = A.realm(from);
  if (r && r.capitalProv === prov.id) {
    const rest = A.realmProvs(from);
    if (rest.length) {
      r.capitalProv = rest.sort((a, b) => b.pop - a.pop)[0].id;
      // [X1 baked patch core/04-world-fixes WLD-STABILITY-FLOOR] Five places lowered realm stability with no floor
      // (capital lost -15, a coup -15, bankruptcy -4, empty treasury -6, a raging faction -10), so readers inside the
      // year (prices, industry, factions) could see negative stability.
      r.capital = A.prov(r.capitalProv).name;
      r.stability = Math.max(0, r.stability - 15);
    }
  }
  A.updateRealmPops();
};

A.realmGone = function (r) {
  r.alive = false;
  for (const id in A.S.realms) {
    const o = A.S.realms[id];
    if (o.allies) o.allies = o.allies.filter(x => x !== r.id);
    if (o.overlord === r.id) o.overlord = null;
  }
};

A.realmFalls = function (r, conqueror) {
  if (!r.alive) return;
  A.realmGone(r);
  A.news(r.name + " is no more" + (conqueror ? ", swallowed by " + A.realmName(conqueror) : "") + ".", "war");
  A.S.history.push({
    y: A.S.year,
    t: r.name + " falls.",
  });
  for (const w of A.S.wars.slice())
    if (w.att.includes(r.id) || w.def.includes(r.id)) {
      w.att = w.att.filter(x => x !== r.id);
      w.def = w.def.filter(x => x !== r.id);
      if (!w.att.length || !w.def.length)
        A.endWar(w, w.att.length ? "att" : "def", w.name + " ends with the fall of " + r.short + ".");
    }
  const ru = A.P(r.ruler);
  if (ru) ru.ruler = null;
};

A.warYear = function (w) {
  const S = A.S;
  if (w.manual === S.year) return;
  const sideP = side =>
    side
      .map(A.realm)
      .filter(r => r && r.alive)
      .reduce((a, r) => a + A.realmPower(r) * (r.id === (side === w.att ? w.leadA : w.leadD) ? 1 : 0.5), 0);
  let pa = sideP(w.att),
    pd = sideP(w.def);
  if (pa <= 0 || pd <= 0) {
    A.endWar(w, pa > 0 ? "att" : "def", w.name + " ends: one side has nothing left to fight with.");
    return;
  }
  if (w.cb === "throne") {
    const cr = A.realm(w.leadD);
    pa *= A.clamp(1.1 + (55 - (cr ? cr.legit : 55)) / 120 + (50 - (cr ? cr.stability : 50)) / 200, 0.8, 1.5);
  } else pd *= 1.12;
  const n = A.ri(1, 3);
  for (let i = 0; i < n; i++) {
    const front = A.warFront(w);
    if (!front) break;
    const { from, to, attSide } = front,
      P = to,
      terrMul =
        {
          mountains: 1.4,
          hills: 1.15,
          forest: 1.1,
          marsh: 1.15,
          desert: 1.05,
        }[P.terr] || 1,
      fortMul = 1 + P.fort * 0.15,
      aPow = (attSide === "att" ? pa : pd) * A.rf(0.6, 1.4),
      dPow = (attSide === "att" ? pd : pa) * A.rf(0.6, 1.4) * terrMul * fortMul,
      win = aPow > dPow,
      aR = attSide === "att" ? w.att : w.def,
      dR = attSide === "att" ? w.def : w.att,
      big = Math.round((Math.min(aPow, dPow) / 8) * A.rf(0.5, 1.5)),
      lossW = Math.round(big * A.rf(0.05, 0.12)),
      lossL = Math.round(big * A.rf(0.18, 0.38));
    A.applyLosses(win ? aR : dR, lossW);
    A.applyLosses(win ? dR : aR, lossL);
    const bname = "Battle of " + P.name;
    w.battles.push({
      y: S.year,
      name: bname,
      win: win ? attSide : attSide === "att" ? "def" : "att",
      lossW,
      lossL,
    });
    const swing = A.ri(6, 13) * (win ? 1 : -1) * (attSide === "att" ? 1 : -1);
    w.score = A.clamp(w.score + swing, -100, 100);
    if (win) {
      if (
        P.owner !== "unclaimed" &&
        !(P.fort >= 2 && A.chance(0.4)) &&
        (P.id !== (A.realm(P.owner) || {}).capitalProv || A.chance(0.5))
      )
        P.occ = attSide === "att" ? w.leadA : w.leadD;
      A.news(
        `${bname}: ${A.realmShort(attSide === "att" ? w.leadA : w.leadD)} beat ${A.realmShort(attSide === "att" ? w.leadD : w.leadA)} and occupy ${P.name}. (${A.fmt(lossW + lossL)} dead)`,
        "battle",
      );
    } else
      A.news(
        `${bname}: ${A.realmShort(attSide === "att" ? w.leadD : w.leadA)} throw back ${A.realmShort(attSide === "att" ? w.leadA : w.leadD)}. (${A.fmt(lossW + lossL)} dead)`,
        "battle",
      );
  }
  for (const r of w.att.concat(w.def).map(A.realm))
    if (r) {
      r.exhaustion = A.clamp(r.exhaustion + A.ri(6, 14), 0, 100);
      r.treasury -= Math.round(r.army * 4 + r.levy * 0.5);
    }
  A.checkPeace(w);
};

A.applyLosses = function (rids, n) {
  const rs = rids.map(A.realm).filter(r => r && r.alive);
  if (!rs.length) return;
  const tot = rs.reduce((a, r) => a + r.army + 1, 0);
  for (const r of rs) {
    const share = Math.round((n * (r.army + 1)) / tot);
    r.army = Math.max(Math.round(r.army * 0.25), r.army - share);
    r.levy = Math.max(0, r.levy - Math.round(share * 0.3));
  }
};

A.warFront = function (w) {
  const attSide = A.chance(0.5 + w.score / 300) ? "att" : "def",
    mine = attSide === "att" ? w.att : w.def,
    theirs = attSide === "att" ? w.def : w.att,
    cands = [];
  for (const p of A.S.prov) {
    const ctrl = p.occ || p.owner;
    if (theirs.includes(ctrl))
      for (const j of p.adj.concat(p.sea || [])) {
        const q = A.S.prov[j],
          qc = q.occ || q.owner;
        if (mine.includes(qc)) {
          cands.push({
            from: q,
            to: p,
            attSide,
          });
          break;
        }
      }
  }
  if (!cands.length) {
    const any = A.S.prov.filter(p => theirs.includes(p.occ || p.owner));
    return any.length
      ? {
          from: null,
          to: A.pick(any),
          attSide,
        }
      : null;
  }
  return A.pick(cands);
};

A.checkPeace = function (w) {
  const S = A.S,
    la = A.realm(w.leadA),
    ld = A.realm(w.leadD);
  if (!la || !ld || !la.alive || !ld.alive) {
    A.endWar(w, la && la.alive ? "att" : "def");
    return;
  }
  const years = S.year - Math.max(w.start, 1105),
    capOcc = (r, by) => r.capitalProv != null && A.prov(r.capitalProv) && by.includes(A.prov(r.capitalProv).occ);
  let res = null;
  // [X1 baked patch diplomacy/20-ai-personality AIP-PEACE] A.checkPeace: the loser gives in sooner if cautious,
  // later if proud or wrathful (A.aiYield); white peace comes sooner between calm, kind, cautious rulers
  // (A.aiWhite). A.peaceTerms adds the enemy ruler's temper to their willingness. Every settlement is logged.
  if (
    w.score >= 80 ||
    (capOcc(ld, w.att) && w.score > 40 && A.chance(0.3 * A.aiYield(w.leadD))) ||
    (ld.exhaustion > 85 && w.score > 20 && A.chance(0.2 * A.aiYield(w.leadD)))
  )
    res = "att";
  else {
    // [X1 baked patch diplomacy/20-ai-personality AIP-PEACE] A.checkPeace: the loser gives in sooner if cautious,
    // later if proud or wrathful (A.aiYield); white peace comes sooner between calm, kind, cautious rulers
    // (A.aiWhite). A.peaceTerms adds the enemy ruler's temper to their willingness. Every settlement is logged.
    if (
      w.score <= -80 ||
      (capOcc(la, w.def) && w.score < -40 && A.chance(0.3 * A.aiYield(w.leadA))) ||
      (la.exhaustion > 85 && w.score < -20 && A.chance(0.2 * A.aiYield(w.leadA)))
    )
      res = "def";
    else {
      // [X1 baked patch diplomacy/20-ai-personality AIP-PEACE] A.checkPeace: the loser gives in sooner if cautious,
      // later if proud or wrathful (A.aiYield); white peace comes sooner between calm, kind, cautious rulers
      // (A.aiWhite). A.peaceTerms adds the enemy ruler's temper to their willingness. Every settlement is logged.
      if (
        (years >= 4 && A.chance(0.03 * A.aiWhite(w))) ||
        (years >= 2 && Math.abs(w.score) < 15 && A.chance(0.02 * A.aiWhite(w))) ||
        (la.exhaustion > 75 && ld.exhaustion > 75 && A.chance(0.15 * A.aiWhite(w)))
      )
        res = "white";
    }
  }
  // [X1 baked patch diplomacy/20-ai-personality AIP-PEACE] A.checkPeace: the loser gives in sooner if cautious,
  // later if proud or wrathful (A.aiYield); white peace comes sooner between calm, kind, cautious rulers
  // (A.aiWhite). A.peaceTerms adds the enemy ruler's temper to their willingness. Every settlement is logged.
  if (res) {
    if (!w.manualPeace) {
      A.aiNotePeace(w, res);
      A.settleWar(w, res);
    }
  }
};

A.settleWar = function (w, res) {
  const S = A.S;
  if (res === "white" && w.cb === "throne" && w.claimant) {
    const claimR = A.realm(w.leadA);
    if (claimR && claimR.isRebel && A.chance(0.65)) {
      // [X1 baked patch core/09-engine-at-scale SCALE-LAND-WRITES] A.realmProvs and A.neighbors scanned every province
      // on every call (A.politicsYear asks them for every pair of realms, so a year cost realms² × provinces).
      // 09-engine-at-scale answers them from an index of provinces by owner, which must be dropped the moment a province
      // changes hands. These are all the places that write a province's owner directly: transferProv, the claimant
      // settlements in settleWar, a claimant taking land in a succession war, a player founding a realm, a faction
      // breaking away, and Tessaria's split at the start. Each now bumps the land version.
      for (const p of A.realmProvs(claimR.id)) {
        p.owner = w.leadD;
        if (A.scaleLand) A.scaleLand();
      }
      A.realmGone(claimR);
      A.endWar(
        w,
        "white",
        `${w.name} ends in a bargain: the claimant kneels, keeps their head, and the rebel lands return to ${A.realmShort(w.leadD)}.`,
      );
      A.updateRealmPops();
      return;
    }
    if (claimR && claimR.isRebel) {
      claimR.isNew = true;
      A.endWar(w, "white", `${w.name} ends with the realm split in two. ${claimR.name} goes its own way.`);
      return;
    }
  }
  if (res === "white") {
    A.endWar(w, "white", w.name + " ends in a white peace; nothing changes hands but the graves.");
    return;
  }
  const winL = res === "att" ? w.leadA : w.leadD,
    loseL = res === "att" ? w.leadD : w.leadA,
    winners = res === "att" ? w.att : w.def,
    losers = res === "att" ? w.def : w.att;
  if (w.cb === "throne" && w.claimant) {
    const claimR = A.realm(w.leadA);
    if (res === "att") {
      let cl = A.P(w.claimant);
      if (((!cl || !cl.alive) && claimR && claimR.ruler && (cl = A.P(claimR.ruler)), cl && cl.alive)) {
        const target = A.realm(w.leadD);
        if (claimR && claimR.isRebel) {
          // [X1 baked patch core/09-engine-at-scale SCALE-LAND-WRITES] A.realmProvs and A.neighbors scanned every province
          // on every call (A.politicsYear asks them for every pair of realms, so a year cost realms² × provinces).
          // 09-engine-at-scale answers them from an index of provinces by owner, which must be dropped the moment a province
          // changes hands. These are all the places that write a province's owner directly: transferProv, the claimant
          // settlements in settleWar, a claimant taking land in a succession war, a player founding a realm, a faction
          // breaking away, and Tessaria's split at the start. Each now bumps the land version.
          for (const p of A.realmProvs(claimR.id)) {
            p.owner = target.id;
            if (A.scaleLand) A.scaleLand();
          }
          A.realmGone(claimR);
        }
        A.makeRuler(cl, target.id);
        target.legit = 45;
        target.stability = Math.max(25, target.stability - 10);
        A.endWar(w, "att", `${A.fullName(cl)} wins ${w.name} and takes the throne of ${target.name}.`);
        A.updateRealmPops();
        return;
      }
    } else {
      if (claimR && claimR.isRebel) {
        // [X1 baked patch core/09-engine-at-scale SCALE-LAND-WRITES] A.realmProvs and A.neighbors scanned every province
        // on every call (A.politicsYear asks them for every pair of realms, so a year cost realms² × provinces).
        // 09-engine-at-scale answers them from an index of provinces by owner, which must be dropped the moment a province
        // changes hands. These are all the places that write a province's owner directly: transferProv, the claimant
        // settlements in settleWar, a claimant taking land in a succession war, a player founding a realm, a faction
        // breaking away, and Tessaria's split at the start. Each now bumps the land version.
        for (const p of A.realmProvs(claimR.id)) {
          p.owner = w.leadD;
          if (A.scaleLand) A.scaleLand();
        }
        A.realmGone(claimR);
      }
      A.endWar(w, "def", `${w.name} ends: the crown of ${A.realmShort(w.leadD)} crushes the claimant.`);
      A.updateRealmPops();
      return;
    }
  }
  const crushing = Math.abs(w.score) >= 90;
  let taken = A.wsTreatyProvinces(w, res);
  taken = taken.filter(
    p =>
      A.realmProvs(p.owner).length - taken.filter(q => q.owner === p.owner).length >= 1 ||
      (crushing && (A.realm(p.owner) || {}).isRebel),
  );
  const lrr = A.realm(loseL);
  if (crushing && lrr && !lrr.isRebel && A.realmProvs(loseL).every(p => winners.includes(p.occ)) && A.chance(0.7))
    for (const p of A.realmProvs(loseL)) if (!taken.includes(p)) taken.push(p);
  for (const p of taken) A.transferProv(p, winners.includes(p.occ) ? p.occ : winL, true);
  const names = taken.map(p => p.name);
  A.endWar(
    w,
    res,
    `${w.name} ends: ${A.realmShort(winL)} wins` +
      (names.length
        ? ` and takes ${names.join(", ")} from ${A.realmShort(loseL)}.`
        : `; ${A.realmShort(loseL)} pays tribute.`),
  );
  const lr = A.realm(loseL);
  if (lr) {
    lr.stability = Math.max(5, lr.stability - 10);
    lr.treasury -= Math.round(lr.income * 0.2);
  }
  // [X1 baked patch diplomacy/20-ai-personality AIP-TRIBUTE] Tribute and greed: a tributary defies its overlord by
  // pride (A.aiDefy) and the overlord marches by wrath (A.aiPunish, rolled only when a war is possible); a greedy
  // victor makes the loser a tributary more often (A.aiExact); greedy rulers demand tribute of the player
  // (A.aiGreedW); the player's own tribute demand is weighed by the target ruler's pride and caution, and their
  // wrath decides whether a refusal means war.
  if (
    lr &&
    lr.alive &&
    !lr.isRebel &&
    !names.length &&
    A.polInit &&
    !lr.overlord &&
    w.cb !== "coalition" &&
    A.realm(winL) &&
    A.realm(winL).overlord !== loseL &&
    A.aiExact(winL, loseL)
  ) {
    lr.overlord = winL;
    A.unally(loseL, winL);
    A.news(`${lr.name} becomes a tributary of ${A.realmName(winL)}.`, "crown");
  }
  const wr = A.realm(winL);
  if (wr) {
    wr.stability = Math.min(100, wr.stability + 6);
    wr.treasury += Math.round((lr ? lr.income : 0) * 0.15);
  }
  A.updateRealmPops();
};

A.rulerDies = function (r, cause) {
  const S = A.S,
    ru = A.P(r.ruler);
  if (ru) {
    if (ru.alive) A.kill(ru, cause || "old age", true);
    ru.ruler = null;
  }
  r.ruler = null;
  const pc = A.pc();
  let next = null,
    contested = false,
    rival = null;
  if (r.gov === "hereditary") {
    if (((next = A.P(r.heir)), (!next || !next.alive) && (next = A.pickHeirFrom(r, ru)), next)) {
      const age = A.age(next),
        R2 = GD.RACES[next.race];
      if (age < R2.adult) contested = A.chance(0.12 + (100 - r.stability) / 500);
      else contested = A.chance((100 - r.legit) / 1300 + (100 - r.stability) / 1500);
      if (contested) {
        rival = A.findClaimant(r, next, ru);
        if (!rival) contested = false;
      }
    }
  } else next = A.electRuler(r);
  if (!next) next = A.genNoble(r.id, "royal", r.house, A.ri(25, 50));
  A.makeRuler(next, r.id);
  r.legit = r.gov === "hereditary" ? Math.min(100, r.legit + 5) : 60;
  A.news(
    `${ru ? A.fullName(ru, false) : "The ruler"} of ${r.short} is dead (${cause || "old age"}). ${A.rulerStyle(next, r)} succeeds.`,
    "crown",
  );
  if (pc && pc.realm === r.id && pc.id !== next.id)
    A.log(`${ru ? A.rulerStyle(ru, r) : "The ruler"} is dead. ${A.rulerStyle(next, r)} now rules ${r.short}.`, "crown");
  // [X1 baked patch diplomacy/20-ai-personality AIP-CLAIMANTS] Would-be rulers have tempers too: in AI-started
  // succession wars (a contested succession, a tottering crown) the claimant presses or kneels by his traits
  // (A.aiPressClaim); a refused faction rises or backs down by its leader's traits (A.aiRevolt), and the ruler
  // yields or refuses by pride and caution (A.aiFactionAnswer). Event-driven civil wars are untouched. A coalition
  // is led by its strongest hawk.
  if (contested && rival && A.aiPressClaim(r, rival)) A.successionWar(r, rival);
  A.emit("rulerDied", r, next);
  return next;
};

A.pickHeirFrom = function (r, ru) {
  if (!ru) return null;
  const save = r.ruler;
  r.ruler = ru.id;
  const h = A.pickHeir(r);
  r.ruler = save;
  return h;
};

A.findClaimant = function (r, heir, oldRuler) {
  const cand = [];
  if (oldRuler)
    for (const x of A.relsOf(oldRuler, ["sibling", "child"]))
      if (x.p.alive && x.p.id !== heir.id && A.age(x.p) >= GD.RACES[x.p.race].adult) cand.push(x.p);
  const pc = A.pc();
  if (
    (pc &&
      pc.alive &&
      pc.realm === r.id &&
      pc.id !== heir.id &&
      (pc.house === r.house || (pc.noble && pc.noble.rung >= 6)) &&
      A.age(pc) >= GD.RACES[pc.race].adult &&
      cand.push(pc),
    !cand.length)
  ) {
    const hs = Object.values(A.S.houses).filter(
      h => h.realm === r.id && h.kind !== "royal" && !h.extinct && ["N01", "N02", "N03"].includes(h.rung),
    );
    if (hs.length) {
      const h = A.pick(hs);
      return A.houseHead(h.id);
    }
    return null;
  }
  return A.pick(cand);
};

A.successionWar = function (r, claimant) {
  // [X1 baked patch nobility/56-court-and-treasury RI-CLAIM-ARMY] A claimant in a war of succession took a random
  // 30-60% of the realm's army, whoever backed them. The share now follows the houses that declare for them (their
  // own house, the claimant's faction, houses that hate the crown): 22% plus 90% of their share of the realm's
  // swords, between 25% and 65% (A.riClaimShare). The player keeps the old roll.
  const pc = A.pc(),
    isPC = pc && claimant.id === pc.id,
    nr = A.createRealm({
      name: (isPC ? "Your" : A.fullName(claimant, false) + "'s") + " faction",
      short: claimant.given + "'s cause",
      title: "Claimant",
      race: r.race,
      cult: r.cult,
      faith: r.faith,
      color: A.pick(A.COLORS_EXTRA),
      army: Math.round(r.army * (A.riClaimShare ? A.riClaimShare(r, claimant) : A.rf(0.3, 0.6))),
      levy: Math.round(r.levy * 0.4),
      armyQ: r.armyQ,
      income: Math.round(r.income * 0.3),
      stability: 40,
      legit: 30,
      treasury: Math.round(r.treasury * 0.2),
      comp: r.comp,
    });
  nr.isRebel = true;
  nr.parent = r.id;
  nr.ruler = claimant.id;
  nr.landless = false;
  if (isPC) nr.name = A.fullName(claimant, false) + "'s faction";
  r.army = Math.round(r.army * 0.65);
  r.levy = Math.round(r.levy * 0.65);
  const ps = A.realmProvs(r.id).filter(p => p.id !== r.capitalProv),
    take = A.shuffle(ps).slice(0, Math.max(1, Math.round(ps.length * A.rf(0.2, 0.4))));
  // [X1 baked patch core/09-engine-at-scale SCALE-LAND-WRITES] A.realmProvs and A.neighbors scanned every province
  // on every call (A.politicsYear asks them for every pair of realms, so a year cost realms² × provinces).
  // 09-engine-at-scale answers them from an index of provinces by owner, which must be dropped the moment a province
  // changes hands. These are all the places that write a province's owner directly: transferProv, the claimant
  // settlements in settleWar, a claimant taking land in a succession war, a player founding a realm, a faction
  // breaking away, and Tessaria's split at the start. Each now bumps the land version.
  for (const p of take) {
    p.owner = nr.id;
    if (A.scaleLand) A.scaleLand();
  }
  if (!take.length) nr.landless = true;
  nr.capitalProv = take.length ? take[0].id : null;
  A.updateRealmPops();
  const w = A.startWar(nr.id, r.id, "The War of the " + r.short.replace(/^the /i, "") + " Succession", "throne", {
      claimant: claimant.id,
      noAllies: true,
    }),
    nbs = A.neighbors(r.id)
      .map(A.realm)
      .filter(o => o && o.alive && !o.isRebel && !o.playerRun && !A.atWar(o.id).length),
    meddler = nbs.filter(o => A.relBetween(o.id, r.id) < -30)[0];
  if (meddler && A.chance(0.35)) {
    w.att.push(meddler.id);
    A.news(`${A.realmName(meddler.id)} backs ${claimant.given}'s claim with men and silver.`, "war");
  }
  const friend = nbs.filter(o => r.allies.includes(o.id) && A.relBetween(o.id, r.id) > 40)[0];
  if (friend && A.chance(0.4)) w.def.push(friend.id);
  A.news(`${A.fullName(claimant, false)} refuses to kneel. ${r.short} is torn by a war of succession!`, "war");
  if (pc && pc.realm === r.id)
    A.log(`${A.fullName(claimant, false)} claims the throne of ${r.short}. Civil war!`, "war");
  return w;
};

A.electRuler = function (r) {
  const pool = [];
  for (const h of Object.values(A.S.houses)) if (h.realm === r.id && !h.extinct) pool.push(h);
  const pc = A.pc();
  if (
    pc &&
    pc.alive &&
    pc.realm === r.id &&
    !pc.ruler &&
    A.electable(pc, r) &&
    A.chance(A.clamp(pc.fame / 160 + (pc.noble ? pc.noble.rung * 0.03 : 0), 0, 0.7))
  ) {
    A.log(`The electors of ${r.short} gather... and the choice falls on you!`, "crown");
    return pc;
  }
  if (pool.length) {
    const h = A.wpick(
      pool,
      x => (x.kind === "royal" ? 4 : 1) * (["N01", "N02", "N03", "S01", "S02", "S03", "S04"].includes(x.rung) ? 2 : 1),
    );
    return A.houseHead(h.id, true);
  }
  return A.genNoble(r.id, "noble", null, A.ri(35, 60));
};

A.electable = function (p, r) {
  const age = A.age(p),
    R2 = GD.RACES[p.race];
  return age < R2.adult + 5 ||
    (r.race !== p.race && !(r.race === "human" && (p.race === "halfelf" || p.race === "halforc")))
    ? false
    : r.gov === "theocracy"
      ? p.job && p.job.c === "clergy" && p.job.r >= 3
      : r.gov === "council"
        ? (p.job && p.job.c === "merchant" && p.job.r >= 3) || (p.noble && p.noble.rung >= 4)
        : r.id === "POL-33"
          ? p.job && p.job.c === "pirate" && p.job.r >= 3
          : p.fame >= 35 || (p.noble && p.noble.rung >= 4) || (p.mil && p.mil.rank >= 6);
};

A.houseHead = function (hid, fresh) {
  const S = A.S,
    h = S.houses[hid];
  if (!h) return null;
  if (!fresh && h.headPid && A.P(h.headPid) && A.P(h.headPid).alive) return A.P(h.headPid);
  if (h.great === false) {
    const ms = A.famMembers(hid).filter(x => x.alive);
    if (ms.length && !fresh) {
      h.headPid = ms[0].id;
      return ms[0];
    }
  }
  let p = null;
  if (
    (!fresh &&
      h.head &&
      LORE.cast[h.head] &&
      !(S.castMap && S.castMap[h.head] && !A.P(S.castMap[h.head]).alive) &&
      (p = A.personFromCast(h.head)),
    !p || !p.alive)
  ) {
    const status = h.kind === "royal" ? "royal" : "noble";
    p = A.genNoble(h.realm || "unclaimed", status, hid, A.ri(28, 60));
  }
  p.house = hid;
  h.headPid = p.id;
  return p;
};

A.kill = function (p, cause, silent) {
  if (!p || !p.alive) return;
  p.alive = false;
  p.died = A.S.year;
  p.cause = cause;
  // [A2 posts] death vacates every post at once (before, dead councillors sat until the yearly sweep)
  if (A.POSTS) A.POSTS.leaveAll(p.id, "died");
  const sp = A.P(p.spouse);
  if (
    (sp &&
      sp.spouse === p.id &&
      ((sp.spouse = null), (sp.widowed = A.S.year), sp.rel[p.id] && (sp.rel[p.id].type = "spouse")),
    p.ruler && !silent)
  ) {
    const r = A.realm(p.ruler);
    if (r && r.ruler === p.id) A.rulerDies(r, cause);
  }
  if (p.house && A.S.houses[p.house] && A.S.houses[p.house].headPid === p.id) {
    const h = A.S.houses[p.house],
      kids = A.lawSort(
        {
          law: "male",
        },
        p.children.map(A.P).filter(k => k && k.alive && !k.flags.bastard),
      );
    h.headPid = kids.length ? kids[0].id : null;
  }
};

A.rollBranches = function () {
  return {
    gordush: A.chance(0.67),
    harrowCross: A.chance(0.6),
    wedding: A.chance(0.78),
    stagley: A.chance(0.6),
    roderic: A.chance(0.33),
    channel: A.chance(0.55),
    qadirSabra: A.chance(0.25),
    abara: A.chance(0.2),
    abbot: A.chance(0.65),
    giants: A.chance(0.3),
    tessFall: A.chance(0.15),
    vragHeart: A.chance(0.2),
    ithrien: A.chance(0.08),
  };
};

A.branchYear = function () {
  const S = A.S,
    B = S.branches;
  if (!B || S.year !== 1105) return;
  const W = (a, b, n) =>
    A.realm(a) && A.realm(b) && A.realm(a).alive && A.realm(b).alive ? A.startWar(a, b, n) : null;
  if (B.gordush) {
    const w = W("POL-01", "POL-11", "The Second Gordush War");
    if (w) {
      w.score = B.harrowCross ? -10 : 5;
      A.news("May: Lord Garrick Harrow crosses the Gordush with 4,000 lances. War with the Horde of Gorath.", "war");
    }
  } else A.news("The Gordush line stays quiet: Vrag sends Tarn Halfblood east and Aldmark takes the offer.", "");
  if (
    (B.stagley &&
      W("POL-03", "POL-05", "The Stagley Stroke") &&
      A.news("Mid-May: Varenna's War Party strikes up the Palella. Crowbrook falls; Stagley holds.", "war"),
    B.wedding)
  ) {
    A.news(
      "21 June: Prince Harald Ironside weds Princess Rowena Ashford at Kingsmere, on the iron ring. Aldmark and Ashmere are bound.",
      "crown",
    );
    A.setRelPair("POL-01", "POL-05", 85);
    const a = A.realm("POL-01"),
      b = A.realm("POL-05");
    if (a && !a.allies.includes("POL-05")) a.allies.push("POL-05");
    if (b && !b.allies.includes("POL-01")) b.allies.push("POL-01");
  } else A.news("The wedding of 21 June is put off. Ashmere's lords grumble about a hidden clause.", "crown");
  if (B.roderic) {
    const r = A.realm("POL-03");
    if (r && r.ruler) {
      A.rulerDies(r, "his heart, at last");
      A.news("Varenna: Queen Bianca and General Montaro fight over the regency.", "crown");
    }
  }
  if (B.channel) {
    const w = W("POL-25", "POL-14", "The Channel War");
    if (w) {
      w.score = -25;
      A.news(`A July dusk: Velgrad's fire-rafts — the "Black Dragon" — burn short of Greyhaven's chain.`, "war");
    }
  }
  if (
    (B.qadirSabra && W("POL-17", "POL-24", "The Gulf War"),
    B.abara &&
      A.news("Abara: the Green Guard and the Blue Guard clash in the palace. The twin crowns totter.", "crown"),
    B.abara)
  ) {
    const r = A.realm("POL-22");
    // [X1 baked patch core/04-world-fixes WLD-STABILITY-FLOOR] Five places lowered realm stability with no floor
    // (capital lost -15, a coup -15, bankruptcy -4, empty treasury -6, a raging faction -10), so readers inside the
    // year (prices, industry, factions) could see negative stability.
    if (r) r.stability = Math.max(0, r.stability - 15);
  }
  if (B.abbot) {
    const r = A.realm("POL-27");
    if (r && r.ruler) A.rulerDies(r, "a long illness");
  }
  if (B.giants) {
    const r = A.realm("POL-23");
    if (r && r.ruler) A.rulerDies(r, "failing knees and a failing heart");
  }
  if (B.vragHeart) {
    const r = A.realm("POL-11");
    if (r && r.ruler) A.rulerDies(r, "his heart, at the Great Ride");
  }
  if (B.ithrien) {
    const r = A.realm("POL-06");
    if (r && r.ruler) A.rulerDies(r, "the slow fade of five centuries");
  }
  if (B.tessFall) {
    const w = S.wars.find(x => x.name === "The Tessarian Civil War");
    if (w) {
      w.score = 80;
      A.news("Tessar falls by treachery! Queen Livia flees by sea.", "war");
    }
  }
};

A.worldYear = function () {
  const S = A.S;
  A.branchYear();
  const pc = A.pc();
  for (const id in S.realms) {
    const r = S.realms[id];
    if (!r.alive) continue;
    const ru = A.P(r.ruler);
    if (!ru || !ru.alive) {
      A.rulerDies(r, "unknown causes");
      continue;
    }
    if (ru.id !== S.pc) {
      const dp = A.deathChance(ru) * (r.atWarNow ? 1.3 : 1);
      if (A.chance(dp)) {
        A.rulerDies(
          r,
          A.pick([
            "a fever",
            "old age",
            "a fall from a horse",
            "his heart",
            "a winter cough",
            "a wound gone bad",
            "poison, some whisper",
          ]),
        );
        continue;
      }
      A.ageNpc(ru);
    }
    if (!r.playerRun) {
      const upkeep = r.army * 3.2 + r.levy * 0.05;
      // [X1 baked patch core/04-world-fixes WLD-AI-DEBT] AI realm debt never went down: only interest (8%) was charged,
      // nothing repaid the principal, and surplus gold above 3x income was deleted for +1 stability instead. Realms now
      // repay principal from cash above half a year's income, and the surplus rule pays debt before it burns anything.
      r.treasury += Math.round(r.income * 0.92 - upkeep - r.debt * 0.08);
      if (r.debt > 0 && r.treasury > r.income * 0.5)
        (() => {
          const _p = Math.min(r.debt, Math.round((r.treasury - r.income * 0.5) * 0.5));
          r.debt -= _p;
          r.treasury -= _p;
        })();
      if (r.treasury < -r.income) {
        r.debt += Math.round(-r.treasury * 0.5);
        // [X1 baked patch core/04-world-fixes WLD-STABILITY-FLOOR] Five places lowered realm stability with no floor
        // (capital lost -15, a coup -15, bankruptcy -4, empty treasury -6, a raging faction -10), so readers inside the
        // year (prices, industry, factions) could see negative stability.
        r.treasury = Math.round(r.treasury * 0.5);
        r.stability = Math.max(0, r.stability - 4);
      }
      const L = LORE.realms[id];
      if (!r.army0) r.army0 = L ? L.army : r.army;
      const target = (A.STAB[L ? L.stability : "steady"] || 55) - r.exhaustion * 0.25 - (r.debt > r.income ? 8 : 0);
      r.stability = A.clamp(r.stability + (target - r.stability) * 0.15 + A.ri(-3, 3), 3, 100);
      r.exhaustion = Math.max(0, r.exhaustion - (A.atWar(id).length ? 0 : 10));
    }
    if (
      r.stability < 18 &&
      !r.isRebel &&
      A.chance(0.05) &&
      !S.wars.some(w => w.cb === "throne" && (w.def.includes(id) || w.att.includes(id)))
    ) {
      const cl = A.findClaimant(r, A.P(r.heir) || ru, ru);
      // [X1 baked patch diplomacy/20-ai-personality AIP-CLAIMANTS] Would-be rulers have tempers too: in AI-started
      // succession wars (a contested succession, a tottering crown) the claimant presses or kneels by his traits
      // (A.aiPressClaim); a refused faction rises or backs down by its leader's traits (A.aiRevolt), and the ruler
      // yields or refuses by pride and caution (A.aiFactionAnswer). Event-driven civil wars are untouched. A coalition
      // is led by its strongest hawk.
      if (cl && cl.id !== ru.id && cl.id !== S.pc && A.aiPressClaim(r, cl)) A.successionWar(r, cl);
    }
  }
  A.wsRunDays(365 - (S.warClock || 0));
  S.warClock = 0;
  for (const id in S.realms) if (S.realms[id].alive) A.forcesYear(S.realms[id]);
  if (
    (A.wsQueuePCBattles && A.wsQueuePCBattles(), A.diplomacyYear(), A.politicsYear && A.politicsYear(), A.chance(0.12))
  ) {
    const un = S.prov.filter(p2 => p2.owner === "unclaimed"),
      p = un.length ? A.pick(un) : null;
    if (p) {
      const nb = p.adj
        .map(j => S.prov[j].owner)
        .filter(o => o !== "unclaimed" && A.realm(o) && A.realm(o).alive && !A.realm(o).isRebel);
      if (nb.length) {
        const o = A.pick(nb);
        A.transferProv(p, o, true);
        A.news(`${A.realmShort(o)} plants settlers and a fort in ${p.name}, once a free land.`, "map");
      }
    }
  }
  A.updateRealmPops();
  for (const id in S.realms) S.realms[id].atWarNow = A.atWar(id).length > 0;
  A.emit("worldYear");
  if (A.realmRanges) A.realmRanges();
};

A.diplomacyYear = function () {
  const S = A.S,
    live = Object.values(S.realms).filter(r => r.alive && !r.isRebel);
  for (const r of live)
    for (const o of live) {
      if (o.id === r.id) continue;
      let v = r.rel[o.id] || 0;
      if (r.allies.includes(o.id)) v += 1;
      else v += (0 - v) * 0.03;
      // [X1 baked patch diplomacy/99996-v2-diplomacy V2DIP-NO-DRIFT] A.diplomacyYear: every realm's opinion of every
      // other moved by a random -2..+2 each year, a reason nobody could name. With v2 diplomacy on, opinion moves only
      // for named reasons (the slow fade toward 0 stays).
      v += A.V2DIP && A.V2DIP.ON ? 0 : A.ri(-2, 2);
      r.rel[o.id] = A.clamp(Math.round(v), -100, 100);
    }
  if (!S.clockMode && A.aiWarCheck) for (let i = 0; i < 12; i++) A.aiWarCheck();
};

A.deathChance = function (p) {
  const R2 = GD.RACES[p.race],
    age = A.age(p),
    bdef = A.bloodDef(p);
  let life = R2.life,
    old = R2.old;
  if (bdef && bdef.lifeMul && (p.blood.show || bdef.mode === "mother")) {
    life *= bdef.lifeMul[p.sex] || 1;
    old *= bdef.lifeMul[p.sex] || 1;
  }
  let q;
  if (age < 1) q = 0.12;
  else {
    if (age < 5) q = 0.03;
    else {
      if (age < R2.adult) q = 0.008;
      else q = 0.004 + 0.0025 * Math.exp((age - old) / Math.max(4, (life - old) / 2.3));
    }
  }
  if (p.health < 40) q += (40 - p.health) / 550;
  if (age > R2.maxLife) q = 0.6;
  q = A.clamp(q, 0, 0.95);
  if (age >= R2.adult && age < R2.old && p.health >= 60) q *= 0.75;
  // C9 (D-040, owner order 34 "longer lives"): a grown life not yet old dies of nothing much more rarely (0.004 a year
  // was one in nine dead of "natural causes" between 16 and 50), and the estate counts: the well fed live longer than
  // the field and the mine (bread, roof, rest). Children's odds and old age's curve are the release's.
  if (age >= R2.adult) {
    if (age < old) q *= 0.6;
    q *= { serf: 1.2, slave: 1.35, peasant: 1.1, noble: 0.9, royal: 0.9, gentry: 0.9, merchant: 0.9 }[p.status] || 1;
  }
  return q;
};

A.ageNpc = function (p) {
  A.yearGrowth(p);
  const mh = A.maxHealth(p);
  p.health = A.clamp(p.health + A.ri(-6, 8), 5, mh);
};

A.FAM_STATUS_KINDS = {
  noble: ["noble", "clan"],
  gentry: ["gentry_mil", "gentry", "clergy", "scholar", "horse", "clan"],
  merchant: ["merchant", "sea"],
  artisan: ["guild", "scholar", "clergy", "sea"],
  peasant: ["hunt", "horse", "outlaw", "clan", "sea"],
};

A.FAM_KIND_NAME = {
  royal: "Royal house",
  noble: "Noble house",
  gentry_mil: "Soldier dynasty",
  gentry: "Gentry",
  merchant: "Merchant house",
  guild: "Guild family",
  clergy: "Priestly line",
  scholar: "Learned family",
  sea: "Sea family",
  horse: "Herd lords",
  hunt: "Huntsmen",
  outlaw: "Outlaw clan",
  clan: "Clan",
};

A.initFamilies = function () {
  const S = A.S;
  for (const id in S.houses) {
    S.houses[id].great = true;
    const d = LORE.houseDeep && LORE.houseDeep[id];
    if (d) {
      const h = S.houses[id];
      h.colors = d.colors;
      h.charge = d.charge;
      h.words = d.words;
      h.arms = d.arms;
      h.great = true;
    }
  }
  if (LORE.families)
    for (const id in LORE.families) {
      const F = LORE.families[id];
      S.houses[id] = {
        id,
        name: F.name,
        sur: F.sur,
        realm: F.realm,
        kind: F.kind,
        fkind: F.kind,
        status: F.status,
        rung: F.rung || "",
        title: F.title,
        rank: F.rank,
        seat: F.seat,
        liege: F.liege || null,
        great: false,
        op: A.ri(35, 75),
        extinct: false,
        wealth: F.wealth,
        fame: F.fame,
        colors: F.colors,
        charge: F.charge,
        words: F.words,
        arms: F.arms,
        military: F.military || null,
        notes: F.reputation,
        members: null,
      };
    }
};

A.famData = id => (LORE.families && LORE.families[id]) || null;

A.houseTemplate = function (id) {
  if (LORE.families && LORE.families[id]) {
    const F = LORE.families[id];
    return {
      id,
      name: F.name,
      sur: F.sur,
      realm: F.realm,
      kind: F.kind,
      fkind: F.kind,
      status: F.status,
      rung: F.rung || "",
      title: F.title,
      rank: F.rank,
      seat: F.seat,
      liege: F.liege || null,
      great: false,
      extinct: false,
      wealth: F.wealth,
      fame: F.fame,
      colors: F.colors,
      charge: F.charge,
      words: F.words,
      arms: F.arms,
      military: F.military || null,
      notes: F.reputation,
      members: null,
    };
  }
  if (LORE.houses && LORE.houses[id]) {
    const t = JSON.parse(JSON.stringify(LORE.houses[id]));
    t.great = true;
    const d = LORE.houseDeep && LORE.houseDeep[id];
    if (d) {
      t.colors = d.colors;
      t.charge = d.charge;
      t.words = d.words;
      t.arms = d.arms;
    }
    return t;
  }
  return null;
};

A.packState = function (S) {
  const out = Object.assign({}, S),
    hs = {};
  for (const id in S.houses) {
    const h = S.houses[id],
      t = A.houseTemplate(id);
    if (!t) {
      hs[id] = h;
      continue;
    }
    const d = {
        _p: 1,
      },
      hk = Object.keys(h);
    for (const k of hk) if (!(k in t) || JSON.stringify(h[k]) !== JSON.stringify(t[k])) d[k] = h[k];
    const gone = Object.keys(t).filter(k => !(k in h));
    if (gone.length) d._x = gone;
    if (
      Object.keys(t)
        .filter(k => k in h)
        .concat(hk.filter(k => !(k in t)))
        .join("") !== hk.join("")
    )
      d._k = hk;
    hs[id] = d;
  }
  out.houses = hs;
  out.packed = 1;
  return out;
};

A.unpackState = function (S) {
  if (!S || !S.packed) return S;
  for (const id in S.houses) {
    const d = S.houses[id];
    if (!d || !d._p) continue;
    const gone = d._x || [],
      order = d._k;
    delete d._p;
    delete d._x;
    delete d._k;
    const o = Object.assign(A.houseTemplate(id) || {}, d);
    for (const k of gone) delete o[k];
    if (order) {
      const r = {};
      for (const k of order) r[k] = o[k];
      S.houses[id] = r;
    } else S.houses[id] = o;
  }
  delete S.packed;
  return S;
};

A.famRaceOk = function (h, race) {
  const R2 = LORE.realms[h.realm],
    hr =
      (R2 &&
        {
          human: "human",
          elf: "elf",
          dwarf: "dwarf",
          orc: "orc",
          giant: "giant",
        }[R2.race]) ||
      "human";
  return (
    race === hr ||
    (race === "halfelf" && hr === "elf") ||
    (race === "halforc" && hr === "orc") ||
    ((race === "halfelf" || race === "halforc") && hr === "human")
  );
};

A.familiesFor = function (realm, status, race) {
  if (status === "royal" || status === "noble") {
    const great = A.housesFor(realm, status, race);
    if (status === "royal") return great;
    const fx = Object.values(LORE.families || {}).filter(
      f => f.realm === realm && f.status === "noble" && A.famRaceOk(f, race),
    );
    return great.concat(fx);
  }
  return Object.values(LORE.families || {}).filter(
    f => f.realm === realm && f.status === status && A.famRaceOk(f, race),
  );
};

A.famMembers = function (hid) {
  const S = A.S,
    h = S.houses[hid],
    F = A.famData(hid);
  if (!h || !F) return [];
  if (h.members) return h.members.map(A.P).filter(Boolean);
  h.members = [];
  const R2 = LORE.realms[F.realm],
    race =
      (R2 &&
        {
          human: "human",
          elf: "elf",
          dwarf: "dwarf",
          orc: "orc",
          giant: "giant",
        }[R2.race]) ||
      "human",
    cult = A.cultureFor(race, F.realm),
    home = (A.S.prov.find(p => p.name === F.seat) || {}).id;
  F.members.forEach((m, i) => {
    const p = A.newPerson({
      given: m.given,
      sex: m.sex,
      race,
      realm: F.realm,
      cult,
      faith: A.faithFor(race, F.realm),
      born: Math.min(m.born, A.S.year - 1),
      status: F.status,
      house: hid,
      home: home ?? void 0,
      potBonus: F.kind === "noble" ? 3 : 1,
    });
    p.sur = F.sur;
    p.surMode = "house";
    p.occ = m.role;
    p.famNote = m.note;
    p.famRole = m.role;
    for (const t of m.traits || []) if (GD.TRAITS[t] && !p.traits.includes(t)) p.traits.push(t);
    for (const k in m.skills || {}) if (GD.SKILLS[k]) p.skills[k] = m.skills[k];
    if (
      F.military &&
      /captain|commander|sergeant|marshal|general|castellan|warden|colonel|officer|standard|bearer|guard|keeper/i.test(
        m.role,
      )
    )
      p.milRank = Math.max(0, Math.min(9, F.military.rank + (i === 0 ? 0 : -A.ri(0, 3))));
    if (F.rung && i === 0 && F.kind === "noble") p.title = F.title;
    h.members.push(p.id);
  });
  const ms = h.members.map(A.P);
  for (let i = 1; i < ms.length; i++) A.link(ms[0], ms[i], "cousin", A.ri(20, 70), "cousin");
  h.headPid = h.members[0];
  return ms;
};

A.famParent = function (hid, born, sex, race) {
  const ms = A.famMembers(hid),
    R2 = GD.RACES[race],
    can = q =>
      q &&
      q.alive &&
      q.sex === sex &&
      q.race === race &&
      born - q.born >= R2.adult &&
      born - q.born <= (sex === "F" ? 42 : 60) * (R2.life / 62),
    cand = ms.filter(can);
  return cand.length ? A.pick(cand) : null;
};

A.familyFameStart = function (pc) {
  const h = A.family(pc);
  if (!h) return;
  const fame = h.great === false ? h.fame || 0 : 30;
  pc.fame = Math.max(pc.fame, Math.round(fame * 0.25));
};

A.famMilBonus = function (pc) {
  const h = A.family(pc);
  return !h || !h.military || pc.flags.bastard ? 0 : h.military.rank || 0;
};

A.raceAllowed = function (race, realm) {
  const L = LORE.realms[realm];
  if (!L) {
    if (realm === "unclaimed") return race !== "giant";
    const r = A.S && A.S.realms[realm];
    return r && r.parent
      ? A.raceAllowed(race, r.parent)
      : !!r && (r.race === race || (r.race === "human" && ["halfelf", "halforc"].includes(race)));
  }
  return (L.pops[GD.RACE_POPKEY[race]] || 0) > 0;
};

A.statusAllowed = function (status, race, realm) {
  return status === "slave"
    ? GD.UNFREE.slave.includes(realm)
    : status === "serf"
      ? GD.UNFREE.serf.includes(realm) && race !== "elf" && race !== "dwarf"
      : status === "noble" || status === "royal"
        ? A.housesFor(realm, status, race).length > 0
        : !(status === "merchant" && realm === "POL-06");
};

A.housesFor = function (realm, status, race) {
  const R2 = LORE.realms[realm];
  if (!R2) return [];
  const want = status === "royal" ? ["royal"] : ["noble", "military", "banking", "merchant", "clan", "priestly"];
  return Object.values(LORE.houses)
    .filter(h => h.realm === realm && want.includes(h.kind) && !/extinct/.test(h.title))
    .filter(h => {
      const hr =
        {
          human: "human",
          elf: "elf",
          dwarf: "dwarf",
          orc: "orc",
          giant: "giant",
        }[R2.race] || "human";
      return (
        race === hr ||
        (race === "halfelf" && hr === "elf") ||
        (race === "halforc" && hr === "orc") ||
        ((race === "halfelf" || race === "halforc") && hr === "human")
      );
    });
};

A.houseBloodline = hid => Object.values(LORE.bloodlines).find(b => b.fam === hid) || null;

A.parentRaces = function (race) {
  return race === "halfelf"
    ? A.chance(0.5)
      ? ["human", "elf"]
      : ["elf", "human"]
    : race === "halforc"
      ? A.chance(0.5)
        ? ["human", "orc"]
        : ["orc", "human"]
      : [race, race];
};

// [X1 baked patch core/03-engine-fixes ENG-OCC-SEX] Occupations were picked without regard to sex, so a noble
// father could be "a lady of the house" and a mother "a lord" (seen in the birth line of a noble life). A.occPick
// filters the gendered titles by sex; it still draws exactly one random number.
A.OCC = {
  slave: ["a field slave", "a house slave", "a mine slave", "a pearl diver", "a galley slave"],
  serf: ["a serf of the manor", "a ploughman bound to the land", "a cowherd on the lord's land"],
  peasant: ["a free farmer", "a herder", "a fisher", "a charcoal-burner", "a woodcutter", "a shepherd"],
  artisan: [
    "a smith",
    "a weaver",
    "a cooper",
    "a baker",
    "a mason",
    "a dyer",
    "a tanner",
    "a potter",
    "a brewer",
    "a carpenter",
  ],
  merchant: [
    "a wine merchant",
    "a cloth trader",
    "a spice trader",
    "a salt merchant",
    "a ship-owner",
    "a moneychanger",
  ],
  gentry: ["a knight", "a franklin", "a castellan", "a knight of the household", "a reeve of the crown"],
  noble: ["a lord", "a lady of the house"],
  royal: ["of the blood royal"],
};

A.occPick = function (st, sex) {
  const L = A.OCC[st] || A.OCC.peasant,
    l = L.filter(o => (sex === "F" ? o !== "a lord" : o !== "a lady of the house"));
  return A.pick(l.length ? l : L);
};

A.parentAgeRange = function (race, sex) {
  const R2 = GD.RACES[race],
    span = {
      human: [18, 38],
      elf: [70, 260],
      dwarf: [40, 110],
      orc: [14, 28],
      giant: [30, 60],
      halfelf: [22, 90],
      halforc: [16, 34],
    }[race] || [18, 38];
  if (sex === "F")
    span[1] = Math.min(
      span[1],
      {
        human: 42,
        orc: 32,
        halforc: 38,
      }[race] || span[1],
    );
  return span.map(x => Math.max(R2.adult, x));
};

A.newGame = function (o) {
  o = Object.assign(
    {
      seed: Date.now() % 2147483647 || 7,
      race: "human",
      realm: "POL-01",
      status: "peasant",
      sex: "M",
      potMode: "fate",
      bloodFate: "blood",
      startAge: 0,
      diff: "hard",
      order: "younger",
    },
    o || {},
  );
  A.newState(o.seed);
  const S = A.S;
  if (((S.settings.diff = o.diff), A.initWorld(), !A.raceAllowed(o.race, o.realm))) {
    const ok = Object.keys(LORE.realms).filter(r => A.raceAllowed(o.race, r));
    o.realm = ok.length ? A.pick(ok) : "POL-01";
  }
  if (!A.statusAllowed(o.status, o.race, o.realm)) o.status = "peasant";
  if ((o.race === "halfelf" || o.race === "halforc") && (o.status === "noble" || o.status === "royal"))
    o.order = "bastard";
  const realm = A.realm(o.realm) || A.realm("POL-01"),
    R2 = GD.RACES[o.race],
    startAge = A.clamp(Math.round(o.startAge || 0), 0, R2.adult + 10),
    born = S.year - startAge;
  let cult = A.cultureFor(o.race, o.realm);
  if (o.race === "halfelf" && (o.realm === "POL-06" || o.realm === "POL-07"))
    cult = o.realm === "POL-07" ? "CUL-20" : "CUL-19";
  if (o.race === "halforc" && (o.realm === "POL-11" || o.realm === "POL-34"))
    cult = o.realm === "POL-34" ? "CUL-23" : "CUL-22";
  const faith =
      o.faith ||
      A.faithFor(o.race === "halforc" && (o.realm === "POL-11" || o.realm === "POL-34") ? "orc" : o.race, o.realm),
    provs = A.realmProvs(realm.id);
  let home = o.home != null && A.prov(o.home) && A.prov(o.home).owner === realm.id ? o.home : null;
  if (home == null) {
    if (o.status === "royal" && realm.capitalProv != null) home = realm.capitalProv;
    else home = (A.wpick(provs, p => Math.sqrt(p.pop + 1e3)) || provs[0] || A.S.prov[0]).id;
  }
  let house = null;
  if (o.status === "noble" || o.status === "royal") {
    const hs =
      o.status === "royal" ? A.housesFor(realm.id, o.status, o.race) : A.familiesFor(realm.id, o.status, o.race);
    house = o.house && hs.some(h => h.id === o.house) ? o.house : hs.length ? A.pick(hs).id : null;
    if (!house) o.status = "gentry";
  } else if (o.house && A.familiesFor(realm.id, o.status, o.race).some(h => h.id === o.house)) house = o.house;
  if (house) {
    const h = A.house(house);
    if (h.seatId) {
      const sp = S.prov.find(p => p.pid === h.seatId);
      if (sp && sp.owner === realm.id) home = sp.id;
    } else if (h.seat && o.home == null) {
      const sp = S.prov.find(p => p.name === h.seat && p.owner === realm.id);
      if (sp) home = sp.id;
    }
  }
  const famRec = house ? A.house(house) : null,
    isFx = famRec && famRec.great === false,
    [fr, mr] = A.parentRaces(o.race);
  let father = null,
    mother = null;
  const mkParent = (race, sex2, status, hs) => {
      const [a0, a1] = A.parentAgeRange(race, sex2),
        pageAtBirth = A.ri(a0, a1),
        pcult =
          race === o.race || (race === "human" && (o.race === "halfelf" || o.race === "halforc"))
            ? race === "human"
              ? A.cultureFor("human", realm.id)
              : cult
            : A.cultureFor(race, realm.id),
        p = A.newPerson({
          given: A.givenName(pcult, sex2),
          sex: sex2,
          race,
          realm: realm.id,
          cult: pcult,
          faith: A.faithFor(race, realm.id),
          born: born - pageAtBirth,
          status,
          house: hs || null,
          home,
          potBonus: status === "royal" || status === "noble" ? 3 : 0,
        });
      // [X1 baked patch core/03-engine-fixes ENG-OCC-SEX] Occupations were picked without regard to sex, so a noble
      // father could be "a lady of the house" and a mother "a lord" (seen in the birth line of a noble life). A.occPick
      // filters the gendered titles by sex; it still draws exactly one random number.
      p.occ = A.occPick(status, p.sex);
      return p;
    },
    royalRuler = A.P(realm.ruler);
  if (o.status === "royal" && house === realm.house && royalRuler) {
    let par = royalRuler;
    const heir = A.P(realm.heir),
      can = q =>
        q &&
        q.alive &&
        born - q.born >= GD.RACES[q.race].adult &&
        born - q.born <= (q.sex === "F" ? 44 : 65) * (GD.RACES[q.race].life / 62);
    if (o.order === "heir" && startAge < R2.adult && can(heir) && heir.race === o.race) par = heir;
    else {
      if (o.order === "cadet") par = null;
    }
    if (par && (!can(par) || (par.race !== (par.sex === "M" ? fr : mr) && par.race !== o.race))) par = null;
    if (par) {
      if (par.sex === "M") father = par;
      else mother = par;
    }
  } else if (isFx && o.order !== "cadet") {
    const pa =
      A.famParent(house, born, A.chance(0.7) ? "M" : "F", A.chance(0.5) ? fr : mr) ||
      A.famParent(house, born, "M", fr) ||
      A.famParent(house, born, "F", mr);
    if (pa) {
      if (pa.sex === "M") father = pa;
      else mother = pa;
    }
  } else if (o.status === "noble" && house) {
    const head = A.houseHead(house),
      can = q =>
        q &&
        born - q.born >= GD.RACES[q.race].adult &&
        born - q.born <= (q.sex === "F" ? 44 : 65) * (GD.RACES[q.race].life / 62);
    if (o.order !== "cadet" && head && can(head) && (head.race === fr || head.race === mr || head.race === o.race)) {
      if (head.sex === "M") father = head;
      else mother = head;
    }
  }
  const pstatus = o.status,
    hsName = house;
  if (!father) {
    const bastardOfFather = o.order === "bastard" && mother == null;
    if (
      ((father = mkParent(
        fr,
        "M",
        pstatus,
        hsName && !(o.order === "bastard" && mother) && !(isFx && mother && mother.house === house) ? hsName : null,
      )),
      house && father.house === house)
    ) {
      const h = A.house(house);
      father.sur = A.houseSurname(h);
      father.surMode = "house";
    } else {
      const fnm = A.familyName({
        cult: father.cult,
        realm: realm.id,
        status: pstatus === "royal" || pstatus === "noble" ? "noble" : pstatus,
        home,
        sex: "M",
      });
      father.sur = fnm.sur;
      father.surMode = fnm.mode;
    }
  }
  if (!mother) {
    const momStatus = o.order === "bastard" ? A.pick(["peasant", "artisan", "servant"]) : pstatus;
    mother = mkParent(mr, "F", momStatus === "servant" ? "artisan" : momStatus, null);
    if (o.order === "bastard")
      mother.occ = A.pick([
        "a serving woman",
        "a miller's daughter",
        "a laundress",
        "a minstrel",
        "an innkeeper's widow",
      ]);
    const mf = A.familyName({
      cult: mother.cult,
      realm: realm.id,
      status: momStatus === "servant" ? "artisan" : pstatus === "royal" ? "noble" : momStatus,
      home,
      sex: "F",
    });
    if (((mother.sur = mf.sur), (mother.surMode = mf.mode), isFx && father.house === house && A.chance(0.6))) {
      const peers = A.familiesFor(realm.id, pstatus, mr).filter(f => f.id !== house);
      if (peers.length) {
        const oh = A.house(A.pick(peers).id);
        if (oh) {
          mother.sur = A.houseSurname(oh);
          mother.surMode = "house";
          mother.house = oh.id;
        }
      }
    } else if (pstatus === "noble" || pstatus === "royal") {
      const other = Object.values(LORE.houses).filter(
        h => h.realm === realm.id && h.id !== house && h.kind !== "royal" && !/extinct/.test(h.title),
      );
      if (other.length && o.order !== "bastard") {
        const oh = A.pick(other);
        mother.sur = A.houseSurname(oh);
        mother.surMode = "house";
        mother.house = oh.id;
      }
    }
  }
  if ((o.order === "bastard" && father.house && mother.house, o.order !== "bastard")) {
    if (!father.spouse || !A.P(father.spouse) || !A.P(father.spouse).alive) {
      father.spouse = mother.id;
      mother.spouse = father.id;
      A.link(father, mother, "spouse", 40, "spouse");
    } else if (father.spouse !== mother.id) {
      const sp = A.P(father.spouse);
      if (sp && sp.sex === "F" && sp.race === mr) {
        delete S.people[mother.id];
        mother = sp;
      }
    }
  } else A.link(father, mother, "lover", 10, "lover");
  if (mother.spouse && mother.spouse !== father.id && o.order !== "bastard") {
    const sp = A.P(mother.spouse);
    if (sp && sp.sex === "M" && sp.race === fr) {
      if (!father.castId) delete S.people[father.id];
      father = sp;
    }
  }
  const bl = house ? A.houseBloodline(house) : null;
  if (bl && GD.BLOOD[bl.id]) {
    const B = GD.BLOOD[bl.id],
      housePar = father.house === house ? father : mother.house === house ? mother : (o.order === "bastard", father),
      other = housePar === father ? mother : father;
    if (!housePar.blood)
      housePar.blood = {
        id: bl.id,
        copies: (B.mode === "rec" || B.mode === "het") && A.chance(0.5) ? 2 : 1,
        show: true,
      };
    if (B.mode === "x" && housePar.sex === "M" && A.chance(0.6))
      mother.blood = {
        id: bl.id,
        copies: 1,
        show: true,
      };
    if ((B.mode === "rec" || B.mode === "het") && A.chance(0.6) && !other.blood)
      other.blood = {
        id: bl.id,
        copies: 1,
        show: B.mode === "het",
      };
    if (B.mode === "mother" && housePar.sex === "M" && !mother.blood && A.chance(0.7))
      mother.blood = {
        id: bl.id,
        copies: 1,
        show: true,
      };
    if (B.mode === "female" && !mother.blood && A.chance(0.6))
      mother.blood = {
        id: bl.id,
        copies: 1,
        show: true,
      };
  }
  const sex = o.sex === "F" ? "F" : "M";
  let blood = null;
  if (bl && GD.BLOOD[bl.id]) {
    if (((blood = A.bloodInherit(bl.id, father, mother, sex)), o.bloodFate === "carrier")) {
      const B = GD.BLOOD[bl.id];
      blood = {
        id: bl.id,
        copies: B.mode === "rec" ? 2 : 1,
        show: !(B.mode === "female" && sex === "M"),
      };
    }
    if (o.bloodFate === "none") blood = null;
  }
  const potBonus =
      {
        fate: 0,
        humble: -8,
        gifted: 8,
        prodigy: 16,
        custom: 0,
      }[o.potMode] || 0,
    pc = A.newPerson({
      given: o.given || A.givenName(cult, sex),
      sex,
      race: o.race,
      realm: realm.id,
      cult,
      faith,
      born,
      status: o.status,
      house: o.order === "bastard" ? null : house,
      home,
      parents: [father.id, mother.id],
      blood,
      potBonus,
      traits: o.traits && o.traits.length ? o.traits.slice(0, 3) : null,
      quirks: o.quirks && o.quirks.length ? o.quirks.slice(0, 3) : null,
      npc: false,
    });
  if (
    ((!o.traits || !o.traits.length) && (pc.traits = A.randomTraits([father, mother])),
    (!o.quirks || !o.quirks.length) && (pc.quirks = A.randomQuirks([father, mother])),
    o.potMode === "custom" && o.pot)
  ) {
    for (const s of GD.STATS)
      if (o.pot[s] != null) pc.pot[s] = A.clamp(Math.round(o.pot[s] + (GD.RACES[o.race].mods[s] || 0)), 5, 200);
    if (pc.blood) A.applyBloodPot(pc);
  }
  pc.npc = false;
  if (o.order === "bastard") {
    pc.flags.bastard = true;
    pc.flags.bloodOf = house;
  }
  const F = house ? A.famData(house) : null;
  if ((A.rollApt(pc, [o.race, o.status, famRec ? A.famKindOf(famRec) : null].filter(Boolean)), F))
    for (const k of F.apt || []) if (A.chance(0.45)) pc.apt[k] = Math.max(pc.apt[k] || 1, A.chance(0.25) ? 1.5 : 1.25);
  if (F && (!o.traits || !o.traits.length) && F.traits && F.traits.length && A.chance(0.5)) {
    const t = A.pick(F.traits),
      T = GD.TRAITS[t];
    if (T && !pc.traits.includes(t) && !(T.opp && pc.traits.includes(T.opp))) {
      if (pc.traits.length >= 3) pc.traits.pop();
      pc.traits.push(t);
    }
  }
  for (const q of pc.quirks) {
    const Q = GD.QUIRKS[q];
    if (Q && Q.apt) for (const k in Q.apt) pc.apt[k] = Math.max(pc.apt[k] || 1, Q.apt[k]);
  }
  if (o.apt) for (const k in o.apt) if (GD.SKILLS[k]) pc.apt[k] = o.apt[k];
  const AR = o.arch && GD.ARCHETYPES[o.arch];
  if (AR) {
    pc.flags.arch = o.arch;
    for (const k in AR.st) pc.pot[k] = A.clamp(pc.pot[k] + AR.st[k], 5, 220);
    for (const k in AR.sk) pc.apt[k] = Math.max(pc.apt[k] || 1, 1.35);
  }
  const fam = A.familyName({
    cult,
    realm: realm.id,
    status: o.status,
    house: o.order === "bastard" ? null : house,
    father: o.order === "bastard" ? mother : father,
    mother,
    home,
    sex,
  });
  if (
    ((pc.sur = fam.sur),
    (pc.surMode = fam.mode),
    fam.clan && (pc.flags.clan = fam.clan),
    o.order === "bastard" && house && ((pc.sur = A.bastardName(cult, realm.id, mother, home)), (pc.surMode = "place")),
    o.app)
  )
    for (const k in o.app) if (o.app[k] != null && o.app[k] !== "") pc.app[k] = o.app[k];
  if (o.app && o.app.height) pc.app.height = A.clamp(+o.app.height, 60, 520);
  A.link(pc, father, "father", A.ri(25, 70), "child");
  A.link(pc, mother, "mother", A.ri(30, 80), "child");
  if (o.order === "bastard") pc.rel[father.id].op = A.ri(-10, 40);
  father.children.push(pc.id);
  mother.children.push(pc.id);
  S.pc = pc.id;
  // [X1 baked patch family/99994-v2-family V2F-ELDER] A.newGame set the number of elder siblings from the chosen
  // birth position (none for the heir, 1-3 for a younger child). It now comes from the family's own seed
  // (b-family.core.js F.elderCount: v2 createPlayerFamily's weights).
  const olderN =
      A.V2F && A.V2F.elderCount
        ? A.V2F.elderCount(o)
        : o.order === "heir" || (o.status === "royal" && startAge >= R2.adult && o.order === "heir")
          ? 0
          : o.order === "younger"
            ? A.ri(1, 3)
            : A.ri(0, 2),
    dead = [];
  for (let i = 0; i < olderN; i++) {
    const sage = startAge + A.ri(1, 3) * (i + 1) * (R2.grown / 20);
    if (
      S.year - sage <
      Math.max(father.born, mother.born) + Math.min(GD.RACES[father.race].adult, GD.RACES[mother.race].adult)
    )
      continue;
    const sx = A.chance(0.5) ? "M" : "F",
      sib = A.newPerson({
        given: A.givenName(cult, sx),
        sex: sx,
        race: o.race,
        realm: realm.id,
        cult,
        faith,
        born: Math.round(S.year - sage),
        status: o.status,
        house: pc.house,
        home,
        parents: [father.id, mother.id],
      });
    if (bl && pc.house) sib.blood = A.bloodInherit(bl.id, father, mother, sx);
    sib.sur = pc.sur;
    sib.surMode = pc.surMode;
    if (pc.surMode === "patron") sib.sur = (sx === "F" ? "daughter of " : "son of ") + father.given;
    father.children.push(sib.id);
    mother.children.push(sib.id);
    const childMort =
      (GD.STATUS[o.status].childMort || 1) *
      (o.race === "human" || o.race === "halforc" || o.race === "orc" ? 0.3 : 0.06);
    if (A.chance(childMort)) {
      sib.alive = false;
      sib.died = sib.born + A.ri(0, 4);
      sib.cause = A.pick(["the summer flux", "a winter cough", "a fever", "the spotted fever"]);
      dead.push(sib);
    } else {
      A.link(pc, sib, "sibling", A.ri(0, 60), "sibling");
      for (const other of A.relsOf(pc, ["sibling"]))
        if (other.p.id !== sib.id) A.link(sib, other.p, "sibling", A.ri(0, 50), "sibling");
    }
  }
  for (const par of [father, mother])
    for (const cid of par.children) {
      const c = A.P(cid);
      if (c && c.id !== pc.id && c.alive && !pc.rel[c.id]) A.link(pc, c, "sibling", A.ri(0, 50), "sibling");
    }
  for (const par of [father, mother])
    if (A.chance(0.45)) {
      const [a0] = A.parentAgeRange(par.race, "M"),
        gb = par.born - A.ri(a0, a0 + 15);
      if (S.year - gb < GD.RACES[par.race].life + 8) {
        const sx = A.chance(0.5) ? "M" : "F",
          g = A.newPerson({
            given: A.givenName(par.cult, sx),
            sex: sx,
            race: par.race,
            realm: realm.id,
            cult: par.cult,
            faith: par.faith,
            born: gb,
            status: par.status,
            home,
          });
        g.sur = par.sur;
        g.surMode = par.surMode;
        if (par.surMode === "patron") g.sur = (sx === "F" ? "daughter of " : "son of ") + A.givenName(par.cult, "M");
        g.children.push(par.id);
        par.parents = par.parents && par.parents.length ? par.parents : [g.id];
        A.link(pc, g, "grandparent", A.ri(20, 80), "grandchild");
        g.occ = "retired";
      }
    }
  if (
    (o.status === "royal" &&
      house === realm.house &&
      o.order === "heir" &&
      startAge >= R2.adult &&
      (father.id === realm.ruler || mother.id === realm.ruler) &&
      ((realm.heirLocked = pc.id), (realm.heir = pc.id)),
    (S.family = {
      wealth: Math.round(GD.STATUS[o.status].wealth * A.rf(0.6, 1.5) * (F ? 0.5 + F.wealth * 0.35 : 1)),
      status: o.status,
    }),
    pc.house && !pc.flags.bastard && A.familyFameStart(pc),
    isFx && !pc.flags.bastard)
  )
    for (const m of A.famMembers(house))
      if (m.id !== pc.id && !pc.rel[m.id] && m.id !== father.id && m.id !== mother.id)
        A.link(
          pc,
          m,
          A.age(m) > A.age(pc) + 18 ? "uncle" : "cousin",
          A.ri(15, 60),
          A.age(m) > A.age(pc) + 18 ? "nephew" : "cousin",
        );
  if (pc.flags.bastard) S.family.wealth = Math.round(S.family.wealth * 0.1);
  if (startAge > 0) A.prepareStart(pc, o);
  S.time = A.freeTime(pc);
  S.dynasty = {
    name: pc.sur || pc.given,
    house: pc.house,
    founder: pc.id,
    gens: 1,
    members: [pc.id],
    score: 0,
  };
  S.scoreMul =
    ({
      fate: 1,
      humble: 1.25,
      gifted: 0.85,
      prodigy: 0.7,
      custom: 0.8,
    }[o.potMode] || 1) * Math.pow(0.93, Object.keys(o.apt || {}).length);
  if (o.bloodFate === "carrier") S.scoreMul *= 0.85;
  S.scoreMul *=
    {
      story: 0.6,
      hard: 1,
      realism: 1.35,
    }[o.diff] || 1;
  S.startStatus = o.status;
  A.birthStory(pc, father, mother, dead, o);
  if (A.afterCreate) A.afterCreate(pc);
  return pc;
};

A.bastardName = function (cult, realm, mother, home) {
  const n = GD.NAMING[cult] || {};
  return cult === "CUL-02"
    ? A.pick(["Hollow", "Fields", "Waters", "Hill"]) + (A.chance(0.5) ? "" : "son")
    : cult === "CUL-01"
      ? "of " + A.provName(home)
      : mother && mother.sur
        ? mother.sur
        : "of " + A.provName(home);
};

A.prepareStart = function (pc, o) {
  const age = A.age(pc),
    R2 = GD.RACES[pc.race];
  A.growTo(pc, age);
  const st = o.status,
    ks =
      {
        slave: ["husbandry", "survival"],
        serf: ["husbandry", "survival"],
        peasant: ["husbandry", "survival", "spear"],
        artisan: ["craft", "trade"],
        merchant: ["trade", "learning", "diplomacy"],
        gentry: ["sword", "riding", "shield", "learning"],
        noble: ["sword", "riding", "diplomacy", "learning", "command"],
        royal: ["sword", "riding", "diplomacy", "learning", "command", "stewardship"],
      }[st] || [],
    yrs = Math.min(age, R2.adult + 10) / R2.adult;
  for (const k of ks) pc.skills[k] = A.clamp(Math.round(A.ri(8, 22) * yrs), 0, 60);
  for (const k of A.shuffle(GD.SKILL_LIST).slice(0, 2)) pc.skills[k] = (pc.skills[k] || 0) + A.ri(2, 10);
  if (
    (pc.race === "elf" &&
      ((pc.skills.bow = (pc.skills.bow || 0) + 25),
      (pc.skills.survival = (pc.skills.survival || 0) + 15),
      (pc.skills.music = (pc.skills.music || 0) + 10)),
    pc.race === "dwarf" &&
      ((pc.skills.craft = (pc.skills.craft || 0) + 25), (pc.skills.axe = (pc.skills.axe || 0) + 12)),
    (pc.race === "orc" || pc.race === "halforc") &&
      ((pc.skills.riding = (pc.skills.riding || 0) + 18), (pc.skills.spear = (pc.skills.spear || 0) + 12)),
    pc.race === "giant" &&
      ((pc.skills.unarmed = (pc.skills.unarmed || 0) + 15), (pc.skills.survival = (pc.skills.survival || 0) + 15)),
    pc.cult === "CUL-03" &&
      ((pc.skills.riding = (pc.skills.riding || 0) + 25), (pc.skills.bow = (pc.skills.bow || 0) + 18)),
    pc.realm === "POL-05" && pc.sex === "M" && (pc.skills.bow = (pc.skills.bow || 0) + 15),
    pc.flags.arch && GD.ARCHETYPES[pc.flags.arch])
  ) {
    const AR = GD.ARCHETYPES[pc.flags.arch];
    for (const k in AR.sk) pc.skills[k] = (pc.skills[k] || 0) + Math.round(AR.sk[k] * yrs * 1.5);
  }
  const FD = pc.house ? A.famData(pc.house) : null;
  if (FD) for (const k of FD.apt || []) pc.skills[k] = Math.max(pc.skills[k] || 0, Math.round(A.ri(10, 25) * yrs));
  for (const k in pc.apt || {})
    if (pc.apt[k] >= 1.2) pc.skills[k] = (pc.skills[k] || 0) + Math.round(A.ri(4, 12) * yrs * pc.apt[k]);
  pc.literate =
    ["merchant", "gentry", "noble", "royal"].includes(st) ||
    pc.race === "elf" ||
    pc.race === "dwarf" ||
    (st === "artisan" && A.chance(0.3));
  if (pc.literate) pc.skills.learning = Math.max(pc.skills.learning || 0, 10);
  const g = pc.gear;
  if (age >= R2.adult) {
    if (st === "gentry" || st === "noble" || st === "royal") {
      g.weapon = "sword";
      g.armor = st === "gentry" ? "padded" : "mail";
      g.shield = "kite";
      g.helm = "helm";
      g.mount = st === "gentry" ? "horse" : "palfrey";
    } else {
      if (pc.race === "giant") {
        g.weapon = "maul";
        g.armor = "hide";
      } else {
        if (pc.race === "dwarf") {
          g.weapon = "axe";
          g.armor = "padded";
          g.shield = "shield";
        } else {
          if (pc.race === "elf") {
            g.weapon = "dagger";
            g.ranged = "elfbow";
          } else {
            if (pc.race === "orc") {
              g.weapon = "spear";
              g.ranged = "compbow";
              g.mount = "horse";
            } else g.weapon = A.pick(["dagger", "club", "staff", "spear"]);
          }
        }
      }
    }
    pc.coin = Math.round(GD.STATUS[st].wealth * A.rf(0.1, 0.4));
    const job = {
      slave: "farm",
      serf: "farm",
      peasant: A.pick(["farm", "herd", "labor", "hunter"]),
      artisan: A.pick(["smith", "weaver", "carpenter", "mason", "brewer"]),
      merchant: "merchant",
    }[st];
    if (job && GD.CAREERS[job])
      pc.job = {
        c: job,
        r: GD.CAREERS[job].guild ? 1 : 0,
        y: 2,
        perf: 55,
      };
    if (st === "gentry") {
      pc.noble = {
        rung: 1,
        realm: pc.realm,
        holding: pc.home,
      };
      pc.title = "Squire";
    }
    if (st === "noble" || st === "royal")
      pc.job = {
        c: "courtier",
        r: 1,
        y: 2,
        perf: 55,
      };
    if (st === "slave") pc.flags.unfree = "slave";
    if (st === "serf") pc.flags.unfree = "serf";
  }
};

A.birthStory = function (pc, father, mother, dead, o) {
  const r = A.realm(pc.realm),
    age = A.age(pc),
    home = A.provName(pc.home),
    R2 = GD.RACES[pc.race],
    pr = r.primer && r.primer.intro ? r.primer.intro : "";
  A.log(`The world of Ardan, ${A.S.year} AR. ${r.name}: ${pr}`, "lore");
  const fdesc = father
      ? `${A.fullName(father)}${father.title ? ", " + father.title : father.occ ? ", " + father.occ : ""}`
      : "a father you never knew",
    mdesc = mother ? `${A.fullName(mother)}${mother.occ ? ", " + mother.occ : ""}` : "a mother you never knew";
  if (
    (age === 0
      ? A.log(
          `You are born in ${home}, ${r.name}, in the winter of ${A.S.year}. ${A.cap(A.he(pc) === "she" ? "a girl" : "a boy")} of the ${A.culture(pc.cult).name}, ${GD.RACES[pc.race].adj}. Your father is ${fdesc}; your mother is ${mdesc}.`,
        )
      : A.log(
          `It is the dawn of ${A.S.year}. You are ${age}, ${GD.RACES[pc.race].adj}, of the ${A.culture(pc.cult).name}, living in ${home}, ${r.name}. Your father is ${fdesc}; your mother is ${mdesc}.`,
        ),
    pc.flags.bastard)
  ) {
    const h = A.house(pc.flags.bloodOf);
    A.log(
      `You are a bastard of ${h ? h.name : "a great house"}. The blood is in you; the name is not. Your mother's people raise you.`,
      "warn",
    );
  } else if (pc.house) {
    const h = A.house(pc.house),
      F = A.famData(pc.house),
      D = LORE.houseDeep && LORE.houseDeep[pc.house];
    if (F) {
      A.log(
        `You are born into ${F.name}: ${F.rank.toLowerCase()}, ${F.title}${F.seat ? ", of " + F.seat : ""}. "${F.words}"`,
        "lore",
      );
      A.log(F.history, "lore");
      if (F.military)
        A.log(`Your family's office: ${F.military.office} — ${F.military.unit}. ${F.military.ties}`, "lore");
    } else
      A.log(
        `${h.name}${h.seat ? ", seated at " + h.seat : ""}. ${D && D.y1105 ? D.y1105 : h.notes || ""}${D && D.words ? ' Words: "' + D.words + '".' : ""}`,
        "lore",
      );
  }
  const gifts = Object.entries(pc.apt || {})
    .filter(([k, v]) => v >= 1.2)
    .map(([k, v]) => `${GD.aptName(v).toLowerCase()} at ${GD.SKILLS[k].toLowerCase()}`);
  if (gifts.length) A.log(`As you grow, people will notice it: you are ${gifts.join(", ")}.`, "good");
  if (pc.surMode === "deed")
    A.log(`An orc has no family name. You are "of Clan ${pc.flags.clan}" until you earn a deed-name.`, "lore");
  const N = GD.NAMING[pc.cult];
  if (N && N.note)
    A.log(
      `Among the ${A.culture(pc.cult).name}, ${N.note.charAt(0).toLowerCase() + N.note.slice(1)} You are ${A.fullName(pc)}.`,
    );
  for (const d of dead)
    A.log(`An older ${d.sex === "F" ? "sister" : "brother"}, ${d.given}, died of ${d.cause} before you were born.`);
  if (pc.blood) {
    const L = LORE.bloodlines[pc.blood.id],
      B = GD.BLOOD[pc.blood.id];
    if (pc.blood.show || B.mode === "x")
      A.log(`The blood shows in you: ${B.short}. ${L.trait}. The price: ${L.cost}`, "blood");
    else A.log(`You carry the ${L.name} blood without showing it. Your children might.`, "blood");
  } else if (pc.house && A.houseBloodline(pc.house))
    A.log(
      `The ${A.houseBloodline(pc.house).name} blood did not pass to you. You are spared its gift and its price.`,
      "blood",
    );
  const sibs = A.relsOf(pc, ["sibling"]);
  if (sibs.length) A.log(`Siblings: ${sibs.map(s => s.p.given + " (" + A.age(s.p) + ")").join(", ")}.`);
  if (pc.status === "slave")
    A.log("You are born a slave. Every coin you will ever touch belongs to someone else.", "warn");
  if (pc.status === "serf") A.log("You are born a serf: bound to the land and the lord who owns it.", "warn");
  const ru = A.P(r.ruler);
  if (ru)
    A.log(
      `${A.rulerStyle(ru, r)} rules ${r.short}.` +
        (A.atWar(r.id).length
          ? ` The realm is at war: ${A.atWar(r.id)
              .map(w => w.name)
              .join(", ")}.`
          : ""),
    );
  if (age >= R2.adult) A.log("You are grown. What you do with your life is up to you.");
};

A.heirsOf = function (pc) {
  return pc.children
    .map(A.P)
    .filter(k => k && k.alive)
    .slice()
    .sort((a, b) => a.born - b.born);
};

A.continueAs = function (pid) {
  const S = A.S,
    old = A.pc(),
    p = A.P(pid);
  if (!p || !p.alive) return false;
  const coin0 = old ? old.coin : 0;
  S.pc = p.id;
  p.npc = false;
  S.gen++;
  if (S.dynasty) {
    S.dynasty.gens++;
    S.dynasty.members.push(p.id);
  }
  if (old) {
    p.assets = p.assets.concat(old.assets.filter(a => !a.ship || A.chance(0.8)));
    old.assets = [];
    old.coin = 0;
  }
  // [X1 baked patch family/99994-v2-family V2F-CONTINUE] A.continueAs copied the old life's rung to whichever child
  // the player went on as. The rung now passes by the house law (A.V2F.inherit(old, heir)): to that child only if
  // the law names them.
  if (old && old.noble && old.noble.rung >= 2) {
    if (A.V2F && A.V2F.inherit) A.V2F.inherit(old, p);
    else {
      if (!p.noble) p.noble = Object.assign({}, old.noble);
    }
  }
  if (!p.gear)
    p.gear = {
      weapon: "fists",
      ranged: null,
      armor: "none",
      shield: null,
      helm: null,
      mount: null,
    };
  if (S.gen >= 3) A.ach("dynasty3");
  if (p.flags && p.flags.retiredParentNote) delete p.flags.retiredParentNote;
  S.time = A.freeTime(p);
  S.yearActs = {};
  S.queue = [];
  A.log(`You are ${A.fullName(p)}, ${A.age(p)} years old, and the story of your house goes on.`, "big");
  if (old) {
    old.coin = coin0;
    A.inherit(old, p);
    old.coin = 0;
    S.dyn = S.dyn || [];
    S.dyn.push({
      pid: old.id,
      name: A.fullName(old),
      born: old.born,
      died: old.died || S.year,
      cause: old.cause || "",
      deeds: (old.deeds || []).slice(-4).map(d => d.t),
      title: A.fullStyle ? A.fullStyle(old) : "",
    });
  }
  return true;
};

A.stage = function (p) {
  const R2 = GD.RACES[p.race],
    a = A.age(p);
  return a < Math.max(1, R2.adult * 0.2)
    ? "infant"
    : a < R2.adult * 0.8
      ? "child"
      : a < R2.adult
        ? "teen"
        : a >= R2.old
          ? "old"
          : "adult";
};

A.isAdult = p => A.age(p) >= GD.RACES[p.race].adult;

A.freeTime = function (p) {
  if (!p) return 0;
  const st = A.stage(p);
  let t = {
    infant: 0,
    child: 4,
    teen: 6,
    adult: 7,
    old: 6,
  }[st];
  if (A.age(p) < 3) t = 0;
  const B = A.bloodDef(p);
  if (B && B.extraTime && p.blood.show) t += B.extraTime;
  if (p.prison) t = 2;
  if (p.mil && A.atWar(p.mil.realm).length) t -= 1;
  return Math.max(0, t);
};

A.lifestyleDefault = function (p) {
  return (
    {
      slave: "poor",
      serf: "poor",
      peasant: "poor",
      artisan: "modest",
      merchant: "comfortable",
      gentry: "comfortable",
      noble: "rich",
      royal: "lavish",
    }[p.status] || "modest"
  );
};

A.LIFESTYLE = {
  poor: {
    name: "Hard",
    cost: 40,
    happy: -4,
    health: -3,
    fame: 0,
    desc: "Black bread, a straw bed, one coat.",
  },
  modest: {
    name: "Modest",
    cost: 100,
    happy: 0,
    health: 0,
    fame: 0,
    desc: "Enough to eat, a dry roof, a feast day now and then.",
  },
  comfortable: {
    name: "Comfortable",
    cost: 320,
    happy: 4,
    health: 1,
    fame: 0,
    desc: "Meat on Sundays, wool and linen, a servant.",
  },
  rich: {
    name: "Rich",
    cost: 1300,
    happy: 7,
    health: 2,
    fame: 1,
    desc: "A household, horses, good wine and good doctors.",
  },
  lavish: {
    name: "Lavish",
    cost: 6e3,
    happy: 10,
    health: 2,
    fame: 3,
    desc: "Feasts, silks, musicians. People talk.",
  },
};

A.ageUp = function () {
  const S = A.S,
    pc = A.pc();
  if (!pc || !pc.alive || S.queue.length) return false;
  const snap = A.recapSnap ? A.recapSnap(pc) : null;
  if ((S.year++, (S.yearActs = {}), A.log("", "yearstart"), A.worldYear(), !pc.alive)) {
    A.pcDeath(pc.cause || "misfortune");
    return true;
  }
  if ((A.familyYear(pc), A.bodyYear(pc), !pc.alive)) return true;
  if (
    (A.moneyYear(pc),
    A.careerYear(pc),
    A.milYear && A.milYear(pc),
    A.S.year % 3 === 0 && A.gcPeople && A.gcPeople(),
    A.nobleYear && A.nobleYear(pc),
    A.rulerYear && A.rulerYear(pc),
    pc.prison && A.prisonYear(pc),
    A.rollEvents(pc),
    A.milestones(pc),
    A.progYear && A.progYear(pc),
    pc.alive)
  ) {
    const diff = S.settings.diff;
    let q = A.deathChance(pc);
    const R2 = GD.RACES[pc.race];
    if (A.age(pc) < R2.adult)
      q *= {
        story: 0,
        hard: 0.18,
        realism: 1,
      }[diff];
    else
      q *= {
        story: 0.4,
        hard: 0.9,
        realism: 1.15,
      }[diff];
    if (pc.health <= 0) A.mortalCheck(pc, pc.lastHurt || "wounds and sickness");
    else {
      if (A.chance(q)) A.pcDeath(A.naturalCause(pc));
    }
  }
  S.time = A.freeTime(pc);
  A.checkAch(pc);
  if (snap && A.recapMake) S.recap = A.recapMake(pc, snap);
  return true;
};

A.naturalCause = function (p) {
  const st = A.stage(p);
  return st === "old" && A.age(p) < GD.RACES[p.race].old + 10
    ? A.pick([
        "a failing heart",
        "a winter cough that would not leave",
        "a stroke",
        "a fever that settled in the chest",
        "a wasting sickness",
      ])
    : st === "infant"
      ? A.pick(["the summer flux", "a fever in the first winter", "the spotted fever"])
      : st === "child" || st === "teen"
        ? A.pick(["a fever", "the summer flux", "a fall from a barn roof", "drowning in the millpond", "lung fever"])
        : st === "old"
          ? A.pick([
              "old age, in your sleep",
              "a failing heart",
              "a winter cough that would not leave",
              "a stroke",
              "old age, surrounded by family",
            ])
          : A.pick([
              "marsh fever",
              "lung fever",
              "a sudden fever",
              "a kick from a horse",
              "a wound gone bad",
              "a fall on the ice",
              "camp fever",
              "a bad tooth that poisoned the blood",
            ]);
};

A.bodyYear = function (pc) {
  const age = A.age(pc),
    R2 = GD.RACES[pc.race];
  A.yearGrowth(pc);
  A.healWounds(pc);
  pc.flags.weary = false;
  const mh = A.maxHealth(pc);
  // [X1 baked patch core/42-difficulty DIFF-HEAL] The year's healing was the same on every setting. It now scales
  // with the setting (Story ×1.5, Realism ×0.7, A.healMul).
  pc.health = A.clamp(
    pc.health + (30 + A.stat(pc, "sta") / 5 + A.perkSum(pc, "heal")) * (A.healMul ? A.healMul() : 1),
    0,
    mh,
  );
  const ls = A.LIFESTYLE[pc.lifestyle || A.lifestyleDefault(pc)];
  if (A.isAdult(pc)) {
    pc.health = A.clamp(pc.health + ls.health, 0, mh);
    pc.happy = A.clamp(pc.happy + ls.happy * 0.5, 0, 100);
  }
  let dz =
    0.07 +
    (pc.status === "artisan" || pc.status === "slave" ? 0.04 : 0) +
    (pc.mil && A.atWar(pc.mil.realm).length ? 0.06 : 0);
  if (A.has(pc, "robust")) dz *= 0.6;
  if (A.has(pc, "sickly")) dz *= 1.7;
  const B = A.bloodDef(pc);
  if (
    (B && B.diseaseRes && pc.blood.show && (dz *= 1 - B.diseaseRes),
    pc.race === "elf" && (dz *= 0.25),
    pc.race === "dwarf" && (dz *= 0.6),
    A.chance(dz))
  ) {
    // [X1 baked patch people/49-body-mind BM-ILLNESS-MONTHS] A disease was one damage roll at the new year
    // (A.bodyYear) and gone. The roll still decides who falls ill, with what, and how hard (the same draws), but the
    // blow is handed to A.bmFallIll, which strikes a third of it now and spreads the rest over the illness's months,
    // where a treatment choice and the medicine skill shape it. In the real source: a sickness record on the person,
    // ticked monthly, instead of an immediate health loss.
    const k = A.pick(Object.keys(GD.DISEASES).filter(d => d !== "pox" || A.chance(0.2))),
      D = GD.DISEASES[k],
      dmg = A.ri(D.dmg[0], D.dmg[1]) * (1.2 - A.stat(pc, "sta") / 200);
    if (A.bmFallIll && A.bmFallIll(pc, k, D, dmg, mh));
    else if (
      ((pc.health = A.clamp(pc.health - dmg, 0, mh)),
      (pc.lastHurt = D.name),
      A.log(`You fall ill with ${D.name}.` + (pc.health < 30 ? " For a while the priests are sent for." : ""), "bad"),
      D.wound && A.chance(0.25))
    ) {
      const w = A.addWound(pc, D.wound);
      if (w) A.log(`It leaves its mark: ${w}.`, "bad");
    }
    pc.happy = A.clamp(pc.happy - 6, 0, 100);
  }
  if (pc.blood && B) A.bloodYear(pc, B);
  if (age === R2.old) A.log("Your joints ache in the mornings now. Old age has found you.", "warn");
  pc.happy = A.clamp(pc.happy + (55 - pc.happy) * 0.15 + A.ri(-4, 4), 0, 100);
  if (age > R2.primeEnd && A.chance(0.3)) pc.looks = Math.max(1, pc.looks - 1);
  if (A.stage(pc) === "teen" && A.chance(0.3)) pc.looks = A.clamp(pc.looks + A.ri(-3, 4), 1, 100);
};

A.bloodYear = function (pc, B) {
  const age = A.age(pc),
    show = pc.blood.show || B.mode === "x",
    hurt = (n, why) => {
      pc.health = A.clamp(pc.health - n, 0, 100);
      pc.lastHurt = why;
    };
  if (B.heart && show && age >= B.heart[0] && A.chance(B.heart[1] * (1 + (age - B.heart[0]) / 15))) {
    A.log("Your heart stutters and races. The blood's old price.", "blood");
    hurt(A.ri(20, 60), "the heart that runs in the blood");
  }
  if (B.stroke && show && age >= B.stroke[0] && A.chance(B.stroke[1])) {
    A.log("Your head pounds and your face burns red; the thick blood clots.", "blood");
    hurt(A.ri(25, 70), "a stroke from the thick blood");
  }
  if (B.stones && show && age >= B.stones[0] && A.chance(B.stones[1] * 4)) {
    A.log("Kidney stones. You walk bent double for a month.", "blood");
    hurt(A.ri(8, 25), "kidney failure");
  }
  if (
    B.sugar &&
    show &&
    age >= B.sugar[0] &&
    pc.lifestyle &&
    ["rich", "lavish"].includes(pc.lifestyle) &&
    A.chance(B.sugar[1] * 3)
  ) {
    A.log("Thirst, sores on your feet that do not heal: the sugar sickness of the lean blood.", "blood");
    hurt(A.ri(10, 30), "the sugar sickness");
  }
  if (B.doubleDeath && pc.blood.copies === 2 && age < B.doubleDeath && A.chance(0.12)) {
    A.log("The blood sickness of two copies: you are pale, short of breath, always tired.", "blood");
    hurt(A.ri(15, 40), "the blood sickness");
  }
  if (B.moods && show && A.chance(0.25)) {
    if (A.chance(0.5)) {
      pc.happy = A.clamp(pc.happy + 20, 0, 100);
      A.log("A wild bright mood takes you for weeks. You feel you could do anything.", "blood");
    } else {
      pc.happy = A.clamp(pc.happy - 22, 0, 100);
      A.log("A black mood comes down like winter. It lasts six weeks.", "blood");
    }
  }
  if (B.blackMoods && show && A.chance(0.3)) {
    pc.happy = A.clamp(pc.happy - 15, 0, 100);
    A.log("You cannot forget. Every old wrong stands in your head as fresh as the day it happened.", "blood");
  }
  if (B.deafAge && show && age === B.deafAge) {
    A.log("The ringing in your ears has become deafness in one ear.", "blood");
    A.addWound(pc, "ear");
  }
  if (B.kneesAge && show && age === B.kneesAge) {
    A.log("Your knees and hips begin to fail under your great weight.", "blood");
    A.addWound(pc, "bad_knee");
  }
  if (B.lowland && show && A.prov(pc.home) && A.prov(pc.home).elev < 1e3 && A.chance(0.4)) {
    A.log("The thick lowland air sickens you. Your deep-breath blood wants the heights.", "blood");
    hurt(A.ri(5, 15), "lowland sickness");
  }
  if (B.infantRisk && age === 1 && A.chance(B.infantRisk)) {
    A.log("A day without milk brings on fits. The milk watch saved you — barely.", "blood");
    hurt(30, "fits in infancy");
  }
  if (B.childRisk && age < 10 && show && A.chance(B.childRisk / 8)) {
    A.log("Your heart flutters like a bird. The six-fingered blood's price.", "blood");
    hurt(A.ri(10, 35), "a weak heart");
  }
  if (B.joints && show && age > 25 && A.chance(0.12)) {
    A.log("A joint slips out of place. You put it back yourself, gritting your teeth.", "blood");
    hurt(8, "a failing joint");
  }
};

A.familyYear = function (pc) {
  const S = A.S,
    seen = new Set();
  for (const id of Object.keys(pc.rel)) {
    const p = A.P(id);
    if (
      !p ||
      !p.alive ||
      seen.has(id) ||
      (seen.add(id), p.ruler && A.realm(p.ruler) && A.realm(p.ruler).ruler === p.id)
    )
      continue;
    A.ageNpc(p);
    const r = pc.rel[id];
    if (A.chance(A.deathChance(p) * (r.type === "comrade", 1))) {
      const cause = A.naturalCause(p);
      if (
        (A.kill(p, cause),
        ["mother", "father", "spouse", "child", "sibling", "bestfriend", "lover", "grandparent", "friend"].includes(
          r.type,
        ))
      ) {
        A.log(`Your ${A.relLabel(p, r).toLowerCase()} ${p.given} dies of ${cause}, aged ${A.age(p)}.`, "death");
        const grief =
          {
            mother: 25,
            father: 22,
            spouse: 30,
            child: 35,
            sibling: 15,
            bestfriend: 15,
            lover: 15,
            grandparent: 8,
            friend: 6,
          }[r.type] || 5;
        pc.happy = A.clamp(pc.happy - grief, 0, 100);
        if (grief >= 15) A.willGrow(pc, grief / 30, "grief");
        if (r.type === "father" || r.type === "mother") A.inheritFrom(pc, p);
      }
    }
    if (r.op > 0) r.op = A.clamp(r.op - A.ri(0, 2), -100, 100);
    else r.op = A.clamp(r.op + A.ri(0, 2), -100, 100);
  }
  const [f, m] = [A.P(pc.parents[0]), A.P(pc.parents[1])];
  if (f && m && f.alive && m.alive && m.spouse === f.id && A.age(pc) < 18) {
    const mage = A.age(m),
      R2 = GD.RACES[m.race];
    if (
      mage >= R2.adult &&
      mage < (m.race === "elf" ? 300 : m.race === "dwarf" ? 120 : R2.adult + 27) &&
      A.chance(0.22 * R2.fert)
    )
      A.birth(m, f, true);
  }
  const sp = A.P(pc.spouse);
  if (sp && sp.alive) {
    const woman = pc.sex === "F" ? pc : sp.sex === "F" ? sp : null,
      man = pc.sex === "M" ? pc : sp.sex === "M" ? sp : null;
    if (woman && man && A.fertilePair(man, woman)) {
      const want = pc.flags.tryChild === S.year ? 0.6 : pc.flags.noChildren ? 0.03 : 0.2;
      if (A.chance(want * A.pairFert(man, woman))) A.birth(woman, man, false);
    }
    if (pc.flags.tryChild === S.year) delete pc.flags.tryChild;
  }
  for (const cid of pc.children) {
    const c = A.P(cid);
    if (!c || !c.alive) continue;
    const ca = A.age(c),
      R2 = GD.RACES[c.race];
    if (!c.spouse && ca >= R2.adult + 3 && A.chance(0.15)) {
      const sx = c.sex === "M" ? "F" : "M",
        s2 = A.newPerson({
          given: A.givenName(c.cult, sx),
          sex: sx,
          race: c.race,
          realm: c.realm,
          cult: c.cult,
          faith: c.faith,
          born: c.born + A.ri(-4, 4),
          status: c.status,
          home: c.home,
        }),
        fn = A.familyName({
          cult: s2.cult,
          realm: s2.realm,
          status: s2.status,
          home: s2.home,
          sex: sx,
        });
      s2.sur = fn.sur;
      s2.surMode = fn.mode;
      c.spouse = s2.id;
      s2.spouse = c.id;
      A.link(c, s2, "spouse", 50, "spouse");
      A.link(pc, s2, "inlaw", 20, "inlaw");
      A.log(`Your ${c.sex === "M" ? "son" : "daughter"} ${c.given} marries ${A.fullName(s2)}.`, "good");
      pc.happy = A.clamp(pc.happy + 5, 0, 100);
    }
    const csp = A.P(c.spouse);
    if (csp && csp.alive) {
      const wo = c.sex === "F" ? c : csp,
        ma = c.sex === "M" ? c : csp;
      if (A.fertilePair(ma, wo) && A.chance(0.2 * A.pairFert(ma, wo))) {
        const g = A.birth(wo, ma, false, true);
        if (g) {
          A.link(pc, g, "grandchild", 40, "grandparent");
          A.log(`A grandchild is born: ${g.given}, to ${c.given}.`, "good");
          pc.happy = A.clamp(pc.happy + 6, 0, 100);
        }
      }
    }
  }
};

A.fertilePair = function (man, woman) {
  if (!man.alive || !woman.alive) return false;
  const races = [man.race, woman.race].sort().join("+");
  if (
    !(
      man.race === woman.race ||
      [
        "elf+human",
        "halfelf+human",
        "elf+halfelf",
        "human+orc",
        "halforc+human",
        "halforc+orc",
        "halfelf+halfelf",
        "halforc+halforc",
      ].includes(races)
    )
  )
    return false;
  const R2 = GD.RACES[woman.race],
    wa = A.age(woman),
    maxF =
      {
        human: 44,
        orc: 34,
        halforc: 40,
        elf: 320,
        dwarf: 130,
        giant: 70,
        halfelf: 120,
      }[woman.race] || 44;
  return wa >= R2.adult && wa <= maxF && A.age(man) >= GD.RACES[man.race].adult;
};

A.pairFert = function (man, woman) {
  let f = Math.min(GD.RACES[man.race].fert, GD.RACES[woman.race].fert);
  if (man.race !== woman.race) f *= 0.5;
  for (const p of [man, woman]) {
    const B = A.bloodDef(p);
    if (B && B.fertMul && (p.blood.show || B.mode === "mother")) f *= B.fertMul;
  }
  return f;
};

A.childRace = function (a, b) {
  const s = [a.race, b.race].sort().join("+");
  return a.race === b.race
    ? a.race
    : s === "elf+human" || s === "halfelf+human" || s === "elf+halfelf"
      ? "halfelf"
      : s === "human+orc" || s === "halforc+human" || s === "halforc+orc"
        ? "halforc"
        : a.race;
};

A.birth = function (mother, father, siblingOfPc, quiet) {
  const S = A.S,
    pc = A.pc(),
    race = A.childRace(mother, father),
    mB = A.bloodDef(mother);
  let twins = race === "orc" ? 0.33 : 0.015;
  if (mB && mB.twins && mother.blood && mother.blood.show) twins = mB.twins;
  const n = A.chance(twins) ? 2 : 1;
  let riskM =
    (race === "human" || race === "halforc" || race === "halfelf" ? 1 / 60 : 1 / 120) *
    n *
    (mB && mB.birthRisk && mother.blood && mother.blood.show ? mB.birthRisk : 1);
  if (pc && mother.id === pc.id)
    riskM *=
      ({
        story: 0.25,
        hard: 0.55,
        realism: 1,
      }[A.S.settings.diff] || 0.55) *
      (mother.coin > 200 || ["noble", "royal", "gentry"].includes(mother.status) ? 0.7 : 1);
  const fB = A.bloodDef(father),
    kids = [];
  for (let i = 0; i < n; i++) {
    const sex = A.chance(0.5) ? "M" : "F",
      famHouse = father.house && !father.flags.bastard ? father.house : mother.house || null;
    let blood = null;
    const bid = (father.blood && father.blood.id) || (mother.blood && mother.blood.id);
    if (
      (bid && (blood = A.bloodInherit(bid, father, mother, sex)),
      blood && GD.BLOOD[blood.id] && GD.BLOOD[blood.id].stillbirth && blood.copies === 2 && A.chance(0.6))
    ) {
      if (!quiet) A.log("A child is born still. The double blood's price.", "death");
      continue;
    }
    const cult = father.cult,
      status = father.status === "royal" || mother.status === "royal" ? "royal" : father.status,
      c = A.newPerson({
        given: A.givenName(cult, sex),
        sex,
        race,
        realm: father.realm,
        cult,
        faith: father.faith,
        born: S.year,
        status,
        house: famHouse,
        home: father.home,
        parents: [father.id, mother.id],
        blood,
      }),
      fn = A.familyName({
        cult,
        realm: father.realm,
        status,
        house: famHouse,
        father,
        mother,
        home: father.home,
        sex,
      });
    if (
      ((c.sur = fn.sur),
      (c.surMode = fn.mode),
      fn.clan && (c.flags.clan = fn.clan),
      father.children.push(c.id),
      mother.children.push(c.id),
      A.link(c, father, "father", 50, "child"),
      A.link(c, mother, "mother", 60, "child"),
      kids.push(c),
      pc && (father.id === pc.id || mother.id === pc.id))
    ) {
      A.link(pc, c, "child", 70, pc.sex === "M" ? "father" : "mother");
      c.rel[pc.id].type = pc.sex === "M" ? "father" : "mother";
      for (const sib of pc.children.map(A.P).filter(x => x && x.alive && x.id !== c.id))
        A.link(c, sib, "sibling", 40, "sibling");
      A.log(
        `${n === 2 && i === 1 ? "And a twin! " : ""}${pc.id === mother.id ? "You give birth to" : "Your wife gives birth to"} a ${sex === "M" ? "son" : "daughter"}: ${c.given}.` +
          (blood && blood.show ? ` The ${GD.BLOOD[blood.id].short} shows in the child.` : ""),
        "good",
      );
      pc.happy = A.clamp(pc.happy + 12, 0, 100);
      if (!S.pendingName) S.pendingName = [];
      S.pendingName.push(c.id);
    } else if (siblingOfPc && pc) {
      A.link(pc, c, "sibling", A.ri(20, 60), "sibling");
      A.log(`Your mother gives birth: a little ${sex === "M" ? "brother" : "sister"}, ${c.given}.`, "good");
    }
  }
  if (A.chance(riskM)) {
    A.kill(mother, "childbirth");
    if (pc && mother.id === pc.id) A.pcDeath("childbirth");
    else {
      if (pc && pc.rel[mother.id]) {
        A.log(`${mother.given} dies in childbirth.`, "death");
        pc.happy = A.clamp(pc.happy - 25, 0, 100);
      }
    }
  }
  return kids[0] || null;
};
