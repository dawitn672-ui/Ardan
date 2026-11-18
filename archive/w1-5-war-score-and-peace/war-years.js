// Retired by W1-5 (D-091), as they stood at 84b7f92: A.warYear and A.warFront (the release's yearly war, called by
// nothing since the war map), A.checkPeace (an end by the score, a timer or a white peace nobody asked for) and the
// old A.settleWar (terms sized by the score, a crushing peace at 90, a coin flip between a claimant kneeling and a split).

// ---- src/core/release/core/04-realms-and-war-years-a.js lines 117-193
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
      r.treasury -= Math.round(r.army * 4 + r.roll * 0.5);
    }
  A.checkPeace(w);
};

// ---- src/core/release/core/04-realms-and-war-years-a.js lines 206-428
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
