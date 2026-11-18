// Retired by W1-5 (D-091), as they stood at 84b7f92: the war map's weekly score (A.wsScore: land held, the capital
// twice, plus the battle score w.bscore), the treaty's land sized by the score (A.wsTreatyProvinces' budget) and the
// War Room's peace buttons that rolled against the score (A.wsOfferPeace).

// ---- src/core/release/core/11-armies-divisions-and-council-a.js lines 1903-1953
A.wsScore = function (w) {
  const S = A.S;
  let attVal = 0,
    defVal = 0,
    attTot = 1,
    defTot = 1;
  for (const p of S.prov) {
    if (w.def.includes(p.owner)) {
      defTot += p.pop;
      if (p.occ && w.att.includes(p.occ))
        attVal += p.pop * (A.realm(p.owner) && A.realm(p.owner).capitalProv === p.id ? 2 : 1);
    }
    if (w.att.includes(p.owner)) {
      attTot += p.pop;
      if (p.occ && w.def.includes(p.occ))
        defVal += p.pop * (A.realm(p.owner) && A.realm(p.owner).capitalProv === p.id ? 2 : 1);
    }
  }
  w.score = A.clamp(Math.round((attVal / defTot) * 110 - (defVal / attTot) * 110 + (w.bscore || 0)), -100, 100);
  for (const rid of w.att.concat(w.def)) {
    const r = A.realm(rid);
    if (r) r.exhaustion = A.clamp(r.exhaustion + 0.12, 0, 100);
  }
};

A.wsTreatyProvinces = function (w, res) {
  const S = A.S,
    winners = res === "att" ? w.att : w.def,
    losers = res === "att" ? w.def : w.att;
  let budget = Math.abs(w.score) * 1.3 + 20;
  const loserPop = S.prov.filter(p => losers.includes(p.owner)).reduce((a, p) => a + p.pop, 0) || 1,
    held = S.prov.filter(p => losers.includes(p.owner) && winners.includes(p.occ)),
    winLand = new Set(S.prov.filter(p => winners.includes(p.owner)).map(p => p.id)),
    taken = [];
  let changed = true;
  for (; changed; ) {
    changed = false;
    const cand = held.filter(p => !taken.includes(p) && p.adj.concat(p.sea || []).some(j => winLand.has(j)));
    cand.sort((a, b) => b.pop - a.pop);
    for (const p of cand) {
      const cost = 6 + (70 * p.pop) / loserPop;
      if (!(cost > budget)) {
        budget -= cost;
        taken.push(p);
        winLand.add(p.id);
        changed = true;
      }
    }
  }
  return taken;
};

// ---- src/core/release/core/11-armies-divisions-and-council-a.js lines 2140-2171
A.wsOfferPeace = function (wid, kind) {
  const S = A.S,
    pc = A.pc(),
    w = S.wars.find(x => x.id === wid);
  if (!w || !pc || !pc.ruler)
    return {
      ok: false,
      msg: "Only a ruler can make peace.",
    };
  const side = A.warSide(w, pc.ruler),
    my = side === "att" ? w.score : -w.score,
    enemyLead = A.realm(side === "att" ? w.leadD : w.leadA),
    ex = enemyLead ? enemyLead.exhaustion : 50;
  let accept;
  if (kind === "white") accept = A.chance(A.clamp(0.25 + my / 100 + ex / 200, 0.05, 0.95));
  else {
    if (kind === "demand") accept = my >= 25 && A.chance(A.clamp((my - 20) / 60 + ex / 250, 0.05, 0.95));
    else accept = A.chance(A.clamp(0.6 - my / 100, 0.1, 0.98));
  }
  return accept
    ? ((w.manualPeace = false),
      A.settleWar(w, kind === "white" ? "white" : kind === "demand" ? side : side === "att" ? "def" : "att"),
      {
        ok: true,
        msg: "Peace is signed.",
      })
    : (A.log(`${enemyLead ? enemyLead.name : "The enemy"} rejects your offer.`, "war"),
      {
        ok: false,
        msg: "They refuse.",
      });
};
