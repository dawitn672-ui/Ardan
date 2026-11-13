// The release's core, armies divisions and council (part 1 of 2): Demobilising, divisions, the army day, the order of battle, the council and the noble's year.
// Readable source of vendor/ardan-b593143.html with the patch layer baked in (X1, docs/DECISIONS.md D-027). Edit it here.
// Defines: A.wsDemobilize, A.wsDisband, A.pcDivAttach, A.wsAttachPC, A.wsDay, A.wsRunDays, A.wsSeparate,
// A.frontProvs, A.wsFrontProvs, A.provDefPow, A.armyEnemy, A.armyThink, A.wsOrderDiv, A.divSpeed, A.divMove,
// A.occupy, A.wsWinter, A.WTAC, A.WTAC_KEYS, A.sideMake, A.sideRecon, A.pcTacFor, A.tacDay, A.TAC_NOTE, A.fightDay,
// A.divRetreat, A.fightEnd, A.wsPCBattle, A.wsQueuePCBattles, A.wsPCFightStart, A.CHOICE_FN, A.CHOICE_FN (+),
// A.wsNudge, A.BATTLE_END, A.BATTLE_END.wsPart, A.wsSupplyDay, A.wsSupplyDayRun, A.wsSiegeDay, A.wsScore,
// A.wsTreatyProvinces, A.wsCanCommand, A.wsCanDiv, A.wsCommandable, A.wsSetOrder, A.wsDivOrder, A.wsDivRaid,
// A.wsDivHold, A.wsDivRejoin, A.wsSetStance, A.wsPlayerOrder, A.wsSplit, A.wsMerge, A.wsTransferDiv, A.wsTroopsFor,
// A.wsRecruit, A.wsOfferPeace, A.wrOpen, A.wrClose, A.wrAuto, A.wsLeadBattle, and 23 more.

A.wsDemobilize = function (a) {
  for (const d of A.armyDivs(a)) {
    d.army = null;
    d.path = [];
    d.prog = 0;
    d.atk = null;
    d.manual = false;
    d.sieging = false;
    d.plan = 0;
    const P = A.S.prov[d.loc];
    if (!P || P.owner !== d.r) {
      const sp = A.garrisonSpots(A.realm(d.r));
      if (sp.length) d.loc = sp[0];
    }
  }
  A.locDirty();
  A.S.armies = A.S.armies.filter(x => x !== a);
  const pc = A.pc();
  if (pc && pc.mil && pc.mil.army === a.id) pc.mil.army = null;
};

A.wsDisband = A.wsDemobilize;

A.pcDivAttach = function (pc) {
  if (!pc || !pc.alive || !pc.mil || pc.mil.merc) return;
  const r = A.realm(pc.mil.realm);
  if (!r || !r.alive) return;
  A.F(r);
  const divs = r.forces.divs;
  if (!divs.length) {
    pc.mil.div = null;
    return;
  }
  let d = pc.mil.div ? divs.find(x => x.id === pc.mil.div) : null;
  if (!d) {
    const cat = A.catOf(pc.mil.troop),
      fits = divs.filter(x => {
        const t = A.tplOf(x);
        return t && t.bns.includes(pc.mil.troop);
      }),
      fits2 = fits.length ? fits : divs.filter(x => A.divS(x).main === cat),
      pool = fits2.length ? fits2 : divs,
      home = A.prov(pc.home);
    d = pool.slice().sort((x, y) => (home ? A.wsDist(x.loc, home.id) - A.wsDist(y.loc, home.id) : 0))[0];
    pc.mil.div = d.id;
  }
  for (const x of divs) if (x.cmd === pc.id && x !== d) x.cmd = null;
  if (pc.mil.rank === 6) d.cmd = pc.id;
  else {
    if (d.cmd === pc.id) d.cmd = null;
  }
};

A.wsAttachPC = function () {
  const pc = A.pc();
  if (!pc || !pc.alive || !pc.mil || pc.mil.merc) return;
  A.pcDivAttach(pc);
  const rid = pc.mil.realm,
    mine = A.armiesOf(rid),
    d = pc.mil.div ? A.divById(pc.mil.div) : null;
  if (!mine.length) {
    pc.mil.army = null;
    return;
  }
  if (pc.mil.rank >= 7) {
    let a = mine.find(x => x.gen === pc.id);
    if (
      (a ||
        ((a =
          mine.find(x => !x.gen || !A.P(x.gen) || !A.P(x.gen).alive) ||
          mine.slice().sort((x, y) => y.divs.length - x.divs.length)[Math.min(mine.length - 1, 1)] ||
          mine[0]),
        (a.gen = pc.id),
        A.log(
          `You are given command of the ${a.name}: ${a.divs.length} divisions, ${A.fmt(A.armyMen(a))} men.`,
          "war",
        )),
      (pc.mil.army = a.id),
      pc.mil.rank >= 8)
    ) {
      let k = 0;
      for (const b of mine)
        if (b !== a) {
          if (b.sub === pc.id) k++;
          else {
            if (k < 2 && !b.sub) {
              b.sub = pc.id;
              k++;
            }
          }
        }
    }
    if (d && !a.divs.includes(d.id)) {
      const o = d.army ? A.army(d.army) : null;
      if (o) o.divs = o.divs.filter(x => x !== d.id);
      d.army = a.id;
      a.divs.push(d.id);
    }
  } else {
    pc.mil.army = d && d.army ? d.army : mine[0].id;
    for (const a of mine) if (a.gen === pc.id) a.gen = A.wsGeneralFor(rid);
  }
  if (pc.mil.rank < 8) for (const a of mine) if (a.sub === pc.id) a.sub = null;
};

A.on("warEnd", () => {
  for (const a of (A.S.armies || []).slice()) if (!A.atWar(a.realm).length) A.wsDemobilize(a);
  for (const k in A.S.fights || {}) {
    const F = A.S.fights[k];
    if (!A.hostile(F.a, F.b)) delete A.S.fights[k];
  }
  for (const d of A.allDivs()) if (d.atk != null && !A.atWar(d.r).length) d.atk = null;
});

A.wsDay = function () {
  const S = A.S;
  S.armies = S.armies || [];
  S.fights = S.fights || {};
  S.warClock = (S.warClock || 0) + 1;
  for (const w of S.wars)
    if (!w.raised) {
      w.raised = true;
      A.wsRaise(w);
    } else if (S.warClock % 7 === 1)
      for (const rid of w.att.concat(w.def))
        if (!A.armiesOf(rid).length || A.divsOf(rid).some(d => !d.army)) A.wsMobilize(rid);
  for (const a of S.armies.slice()) {
    const r = A.realm(a.realm);
    if (!r || !r.alive || !A.atWar(a.realm).length) {
      A.wsDemobilize(a);
      continue;
    }
    if (((a.divs = a.divs.filter(id => A.divById(id))), !a.divs.length)) {
      A.wsDemobilize(a);
      continue;
    }
    if (
      (a.gen && (!A.P(a.gen) || !A.P(a.gen).alive) && (a.gen = a.gen === S.pc ? null : A.wsGeneralFor(a.realm)), !a.gen)
    ) {
      const pc = A.pc();
      if (!(pc && pc.mil && pc.mil.army === a.id && pc.mil.rank >= 7)) a.gen = A.wsGeneralFor(a.realm);
    }
  }
  const divs = A.allDivs().filter(d => d.army);
  for (const d of divs) if (d.men < 1) A.divRemove(d);
  A._think = {
    front: new Map(),
    dp: new Map(),
  };
  try {
    // [X1 baked patch war/38-orders GO-ARMY-TEMPO] Every AI army thought once in three ticks of the war clock. The
    // four dials above barely moved a war: over 96 wars a temper, bold and cautious armies made the same number of
    // assaults (331 and 353), because a division is rarely rested, next to the enemy and near the odds bar at once.
    // Now the general sets the tempo too (A.GENERALS.every): a bold one thinks every second tick and catches his men
    // the moment they are ready, a cautious one every fourth.
    S.armies.forEach((a, i) => {
      if ((S.warClock + i) % (A.GENERALS ? A.GENERALS.every(a) : 3) === 0) A.armyThink(a);
    });
  } finally {
    A._think = null;
  }
  const live = A.allDivs().filter(d => d.army);
  for (const d of live) A.divMove(d);
  A.wsSeparate(live);
  const battleAt = new Set();
  for (const d of live) if (d.atk != null) battleAt.add(d.atk);
  for (const k in S.fights) battleAt.add(+k);
  for (const pid of battleAt) A.fightDay(pid);
  if ((A.wsSupplyDay(live), A.wsSiegeDay(live), S.warClock % 7 === 0))
    for (const d of live)
      if (d.atk == null && !S.fights[d.loc] && (d.sr == null || d.sr >= 0.3) && A.friendly(A.ctrl(S.prov[d.loc]), d.r))
        A.divReinforce(d, A.realm(d.r), 0.14);
  if (S.warClock % 30 === 0)
    for (const id in S.realms) {
      const r = S.realms[id];
      if (r.alive && A.atWar(id).length) {
        A.F(r);
        A.indMonth(r);
      }
    }
  for (const a of S.armies) A.armySync(a);
  for (const id in S.realms) {
    const r = S.realms[id];
    if (r.alive && r.forces && A.atWar(id).length) A.forcesSync(r);
  }
  if (S.warClock % 7 === 0)
    for (const w of S.wars.slice()) {
      A.wsScore(w);
      if (S.wars.includes(w) && S.warClock % 28 === 0) A.checkPeace(w);
    }
};

A.wsRunDays = function (n) {
  for (let i = 0; i < n; i++) {
    if (!A.S.wars.length && !(A.S.armies || []).length) {
      A.S.warClock = (A.S.warClock || 0) + (n - i);
      break;
    }
    A.wsDay();
  }
};

A.wsSeparate = function (live) {
  const by = {};
  for (const d of live) (by[d.loc] = by[d.loc] || []).push(d);
  for (const loc in by) {
    const L = by[loc];
    if (L.length < 2) continue;
    const first = L.slice().sort((x, y) => (x.arr || 0) - (y.arr || 0))[0];
    for (const d of L)
      if (A.hostile(d.r, first.r)) {
        const back = d.from != null && d.from !== d.loc ? d.from : null;
        if (back != null) {
          d.loc = back;
          d.atk = +loc;
          d.path = [+loc];
          d.prog = 0;
          A.locDirty();
        }
      }
  }
};

A.frontProvs = function (rid, enemy) {
  const S = A.S,
    out = [],
    R2 = A.relMemo(rid),
    E = enemy ? A.relMemo(enemy) : null;
  for (const p of S.prov)
    if (
      R2.fr(A.ctrl(p)) &&
      p.adj.some(j => {
        const c = A.ctrl(S.prov[j]);
        return enemy ? c === enemy || (R2.ho(c) && E.fr(c)) : R2.ho(c);
      })
    )
      out.push(p.id);
  return out;
};

A.wsFrontProvs = (rid, enemies) => A.frontProvs(rid, enemies && enemies[0]);

A.provDefPow = function (pid, rid) {
  let t = 0;
  for (const d of A.divsAt(pid))
    if (A.hostile(rid, d.r)) t += A.divPower(d) * (0.3 + (0.7 * d.org) / Math.max(1, A.divMaxOrg(d)));
  return t;
};

A.armyEnemy = function (a) {
  const en = A.enemiesOf(a.realm);
  if (!en.length) return null;
  if (a.order.enemy && en.includes(a.order.enemy)) return a.order.enemy;
  let best = null,
    bd = 1 / 0;
  for (const e of en) {
    const r = A.realm(e);
    if (!(!r || !r.alive))
      for (const p of A.S.prov) {
        if (A.ctrl(p) !== e) continue;
        const d = A.wsDist(a.loc, p.id);
        if (d < bd) {
          bd = d;
          best = e;
        }
      }
  }
  return best || en[0];
};

A.armyThink = function (a) {
  const S = A.S;
  a.lastThink = S.warClock;
  const ds = A.armyDivs(a).filter(d => !d.manual && !(d.train > 30));
  if (!ds.length) return;
  const k = a.order.k;
  if (k === "hold") {
    for (const d of ds) if (d.atk == null) d.path = [];
    return;
  }
  const enemy = A.armyEnemy(a);
  if (!enemy) return;
  a.target = enemy;
  const R2 = A.relMemo(a.realm),
    E = A.relMemo(enemy),
    T = A._think,
    dpC = {},
    defPow = j => {
      let v = dpC[j];
      if (v === void 0) {
        const k2 = j + "|" + a.realm;
        v = T ? T.dp.get(k2) : void 0;
        if (v === void 0) {
          v = A.provDefPow(j, a.realm);
          if (T) T.dp.set(k2, v);
        }
        dpC[j] = v;
      }
      return v;
    };
  let F;
  {
    const fk = a.realm + ">" + enemy,
      c = T && T.front.get(fk);
    if (c) F = c.slice();
    else {
      F = A.frontProvs(a.realm, enemy);
      if (T) T.front.set(fk, F.slice());
    }
  }
  const ownF = F.filter(f => A.ctrl(S.prov[f]) === a.realm || S.prov[f].owner === a.realm);
  if ((ownF.length && (F = ownF), !F.length)) {
    let tgt = a.order.obj != null && R2.ho(A.ctrl(S.prov[a.order.obj])) ? a.order.obj : null;
    if (tgt == null) {
      let bd = 1 / 0;
      for (const p of S.prov) {
        const c = A.ctrl(p);
        if (!(c === enemy || (R2.ho(c) && E.fr(c)))) continue;
        const d = A.wsDist(a.loc, p.id);
        if (d < bd) {
          bd = d;
          tgt = p.id;
        }
      }
    }
    if (tgt != null)
      for (const d of ds)
        if (d.atk == null && (!d.path.length || d.path[d.path.length - 1] !== tgt)) A.wsOrderDiv(d, tgt);
    return;
  }
  const w = {};
  let wsum = 0;
  const r = A.realm(a.realm);
  for (const f of F) {
    const P = S.prov[f];
    let threat = 0;
    for (const j of P.adj) if (R2.ho(A.ctrl(S.prov[j]))) threat += defPow(j);
    const v =
      1 +
      threat / 400 +
      (r && r.capitalProv === f ? 2 : 0) +
      Math.log10(P.pop + 10) / 6 +
      (a.order.obj != null ? Math.max(0, 2 - A.wsDist(f, a.order.obj) / 900) : 0);
    w[f] = v;
    wsum += v;
  }
  const others = A.armiesOf(a.realm).filter(b => b !== a && b.order.k !== "hold");
  let myF = F;
  if (others.length) {
    myF = F.filter(f => others.every(b => A.wsDist(f, a.loc) <= A.wsDist(f, b.loc) * 1.25));
    if (!myF.length)
      myF = F.slice()
        .sort((x, y) => A.wsDist(x, a.loc) - A.wsDist(y, a.loc))
        .slice(0, Math.max(1, Math.ceil(F.length / (others.length + 1))));
  }
  const want = {};
  let wsum2 = 0;
  for (const f of myF) wsum2 += w[f];
  for (const f of myF) want[f] = Math.max(0, (ds.length * w[f]) / wsum2);
  const have = {};
  for (const f of myF) have[f] = 0;
  const free = [];
  for (const d of ds) {
    if (d.atk != null) continue;
    const here = S.prov[d.loc];
    if (!d.path.length && R2.ho(A.ctrl(here)) && !A.divsAt(d.loc).some(x => A.hostile(d.r, x.r))) {
      d.post = d.loc;
      continue;
    }
    if (d.post != null && have[d.post] != null) have[d.post]++;
    else free.push(d);
  }
  for (let guard = 0; guard < ds.length; guard++) {
    let over = null,
      under = null;
    for (const f of myF) {
      if (have[f] > Math.ceil(want[f]) + 1 && (over == null || have[f] - want[f] > have[over] - want[over])) over = f;
      if (have[f] < Math.floor(want[f]) && (under == null || want[f] - have[f] > want[under] - have[under])) under = f;
    }
    if (over == null || under == null) break;
    const mv = ds
      .filter(d => d.post === over && d.atk == null)
      .sort((x, y) => A.wsDist(x.loc, under) - A.wsDist(y.loc, under))[0];
    if (!mv) break;
    mv.post = under;
    have[over]--;
    have[under]++;
  }
  for (const d of free) {
    let best = null,
      bv = -1 / 0;
    for (const f of myF) {
      const v = (want[f] - have[f]) * 3 - A.wsDist(d.loc, f) / 700;
      if (v > bv) {
        bv = v;
        best = f;
      }
    }
    if (best == null) best = myF[0];
    have[best]++;
    d.post = best;
  }
  for (const d of ds)
    if (!(d.atk != null || d.post == null || d.post === d.loc || (R2.ho(A.ctrl(S.prov[d.loc])) && d.post === d.loc))) {
      if (!d.path.length || d.path[d.path.length - 1] !== d.post) {
        if (!A.wsOrderDiv(d, d.post)) d.post = null;
      }
    }
  const ours = ds.reduce((x, d) => x + A.divPower(d), 0);
  let theirs = 0;
  const seen = new Set();
  for (const f of myF)
    for (const j of S.prov[f].adj)
      if (!seen.has(j)) {
        seen.add(j);
        theirs += defPow(j);
      }
  // [X1 baked patch war/38-orders GO-ARMY-DECIDE] The dials above are bars, and a bar only delays an attack.
  // Measured in the full world (36 wars a temper), a cautious army passed 21% fewer chances to attack than a steady
  // one would have at the same moment, in every build with or without the richer, drilled hosts of
  // 56-court-and-treasury and 60-unit-drill, and still made as many assaults: the division held back went in a few
  // days later. The share sent at once never bound (an army rarely has more targets than a third of its divisions),
  // so the cunning pull, which only orders the targets, did nothing either. The temper now makes four decisions
  // (A.GENERALS.opens, held, commit and fortNeed): whether to take the offensive at all (a cautious general
  // outnumbered on his front only frees his own land, as an army ordered to hold the front does); which divisions
  // may attack at all (a cautious one keeps a third in reserve, fixed by their ids); how many go in at one province
  // (the release: 4; a bold one sends 6); and whether to storm a defended fort (a cunning one wants half again the
  // odds for each step of walls). A steady general decides as the release does.
  const ratio = ours / Math.max(1, theirs),
    offensive = k === "attack" || (k === "free" && A.GENERALS.opens(a, ratio));
  // [X1 baked patch war/38-orders GO-ARMY-TEMPER] Every AI army thought alike: the odds an attack had to reach, the
  // odds at which it took the offensive, and the third of its divisions it sent at once, and the rest and planning a
  // division needed before it attacked, were fixed. They now come from the general's temper (A.GENERALS.need, spear,
  // prep and weak): a bold general attacks at worse odds, sooner, with half his divisions, a cautious one wants
  // better odds and rested men and sends fewer, a cunning one is drawn to undefended provinces and kept off forts.
  // [X1 baked patch war/38-orders GO-ARMY-DECIDE] The dials above are bars, and a bar only delays an attack.
  // Measured in the full world (36 wars a temper), a cautious army passed 21% fewer chances to attack than a steady
  // one would have at the same moment, in every build with or without the richer, drilled hosts of
  // 56-court-and-treasury and 60-unit-drill, and still made as many assaults: the division held back went in a few
  // days later. The share sent at once never bound (an army rarely has more targets than a third of its divisions),
  // so the cunning pull, which only orders the targets, did nothing either. The temper now makes four decisions
  // (A.GENERALS.opens, held, commit and fortNeed): whether to take the offensive at all (a cautious general
  // outnumbered on his front only frees his own land, as an army ordered to hold the front does); which divisions
  // may attack at all (a cautious one keeps a third in reserve, fixed by their ids); how many go in at one province
  // (the release: 4; a bold one sends 6); and whether to storm a defended fort (a cunning one wants half again the
  // odds for each step of walls). A steady general decides as the release does.
  if (
    ((a.stance = k === "attack" || (k === "free" && ratio > 1.15 * A.GENERALS.need(a)) ? "attack" : "defend"),
    (a.ratio = ratio),
    (k === "front" || k === "free") && !offensive)
  ) {
    for (const f of myF)
      for (const j of S.prov[f].adj) {
        const P = S.prov[j];
        if (R2.fr(P.owner) && R2.ho(A.ctrl(P)) && defPow(j) < 1) {
          const d = ds.find(x => x.loc === f && x.atk == null && !x.path.length);
          if (d) A.wsOrderDiv(d, j);
        }
      }
    return;
  }
  if (!offensive) return;
  // [X1 baked patch war/38-orders GO-ARMY-TEMPER] Every AI army thought alike: the odds an attack had to reach, the
  // odds at which it took the offensive, and the third of its divisions it sent at once, and the rest and planning a
  // division needed before it attacked, were fixed. They now come from the general's temper (A.GENERALS.need, spear,
  // prep and weak): a bold general attacks at worse odds, sooner, with half his divisions, a cautious one wants
  // better odds and rested men and sends fewer, a cunning one is drawn to undefended provinces and kept off forts.
  // [X1 baked patch war/38-orders GO-ARMY-DECIDE] The dials above are bars, and a bar only delays an attack.
  // Measured in the full world (36 wars a temper), a cautious army passed 21% fewer chances to attack than a steady
  // one would have at the same moment, in every build with or without the richer, drilled hosts of
  // 56-court-and-treasury and 60-unit-drill, and still made as many assaults: the division held back went in a few
  // days later. The share sent at once never bound (an army rarely has more targets than a third of its divisions),
  // so the cunning pull, which only orders the targets, did nothing either. The temper now makes four decisions
  // (A.GENERALS.opens, held, commit and fortNeed): whether to take the offensive at all (a cautious general
  // outnumbered on his front only frees his own land, as an army ordered to hold the front does); which divisions
  // may attack at all (a cautious one keeps a third in reserve, fixed by their ids); how many go in at one province
  // (the release: 4; a bold one sends 6); and whether to storm a defended fort (a cunning one wants half again the
  // odds for each step of walls). A steady general decides as the release does.
  const prep = A.GENERALS.prep(a),
    ready = d =>
      d.atk == null && !d.path.length && d.org >= A.divMaxOrg(d) * Math.min(0.95, 0.7 * prep) && !A.GENERALS.held(a, d),
    quiet = S.warClock - (a.lastFight != null ? a.lastFight : a.born === S.year ? 0 : -60),
    need =
      ((k === "attack" ? 1.05 : ratio > 1.15 ? 1.25 : 1.6) - Math.min(0.45, Math.max(0, quiet - 30) / 200)) *
      A.GENERALS.need(a),
    cands = [];
  for (const j of seen) {
    const P = S.prov[j],
      c = A.ctrl(P);
    if (!R2.ho(c)) continue;
    // [X1 baked patch war/38-orders GO-ARMY-TEMPER] Every AI army thought alike: the odds an attack had to reach, the
    // odds at which it took the offensive, and the third of its divisions it sent at once, and the rest and planning a
    // division needed before it attacked, were fixed. They now come from the general's temper (A.GENERALS.need, spear,
    // prep and weak): a bold general attacks at worse odds, sooner, with half his divisions, a cautious one wants
    // better odds and rested men and sends fewer, a cunning one is drawn to undefended provinces and kept off forts.
    // [X1 baked patch war/38-orders GO-ARMY-MOVES] With the bars and decisions above, a bold army made about as many
    // assaults as a steady one (a bold army already sends every division it has free) and a cunning one only left
    // defended forts alone. What sets them apart now is where they go (A.GENERALS.pull, and A.GENERALS.moves after the
    // think, orders.core.js): a bold general is drawn to the enemy's main host rather than to empty walls, and a
    // cunning one to the weakest division, to men already fighting elsewhere and to depots. And a bold general's
    // divisions break later in a fight: at 2% of their order instead of 4% (A.GENERALS.stand), so they hold on at
    // worse odds and lose more men. A cunning general's divisions march round walled or held provinces of the enemy
    // (A.GENERALS.road, in A.wsOrderDiv), and one that finds the enemy across its road on the march goes round instead
    // of attacking (A.GENERALS.sidestep, in A.divMove). Measured over 96 wars, a steady army lost 2.9 million of its
    // 4.3 million attacking dead in 1,547 short fights at places with no walls of theirs, and won 17% of them: mostly
    // divisions walking into an enemy host on the way to their posts, not assaults the general chose. A steady army's
    // pull is 0, its stand 1, its road the release's and it never sidesteps, which is the release.
    const def = defPow(j),
      er = A.realm(P.owner),
      lib = R2.fr(P.owner) ? 35 : 0,
      objV = a.order.obj != null ? Math.max(0, 40 - A.wsDist(j, a.order.obj) / 40) : 0,
      atk = ds.filter(d => ready(d) && A.adjacent(d.loc, j) && (def < 1 || (d.plan || 0) >= 0.09 * prep)),
      odds =
        atk.reduce((x, d) => x + A.divPower(d) * (1 + d.plan), 0) /
        Math.max(1, (def * (1 + (P.fort || 0) * 0.08)) / (A.ATK_TERR[P.terr] || 1)),
      v =
        Math.log10(P.pop + 10) * 6 +
        (er && er.capitalProv === j ? 30 : 0) +
        lib +
        objV +
        (def < 1 ? 25 * A.GENERALS.weak(a) : 0) +
        Math.min(30, (odds - 1) * 20) -
        (P.fort || 0) * 3 * A.GENERALS.weak(a) +
        A.GENERALS.pull(a, j, def);
    // [X1 baked patch war/38-orders GO-ARMY-DECIDE] The dials above are bars, and a bar only delays an attack.
    // Measured in the full world (36 wars a temper), a cautious army passed 21% fewer chances to attack than a steady
    // one would have at the same moment, in every build with or without the richer, drilled hosts of
    // 56-court-and-treasury and 60-unit-drill, and still made as many assaults: the division held back went in a few
    // days later. The share sent at once never bound (an army rarely has more targets than a third of its divisions),
    // so the cunning pull, which only orders the targets, did nothing either. The temper now makes four decisions
    // (A.GENERALS.opens, held, commit and fortNeed): whether to take the offensive at all (a cautious general
    // outnumbered on his front only frees his own land, as an army ordered to hold the front does); which divisions
    // may attack at all (a cautious one keeps a third in reserve, fixed by their ids); how many go in at one province
    // (the release: 4; a bold one sends 6); and whether to storm a defended fort (a cunning one wants half again the
    // odds for each step of walls). A steady general decides as the release does.
    if (atk.length && (def < 1 || odds > need * A.GENERALS.fortNeed(a, P)))
      cands.push({
        j,
        v,
        atk,
      });
  }
  cands.sort((x, y) => y.v - x.v);
  // [X1 baked patch war/38-orders GO-ARMY-TEMPER] Every AI army thought alike: the odds an attack had to reach, the
  // odds at which it took the offensive, and the third of its divisions it sent at once, and the rest and planning a
  // division needed before it attacked, were fixed. They now come from the general's temper (A.GENERALS.need, spear,
  // prep and weak): a bold general attacks at worse odds, sooner, with half his divisions, a cautious one wants
  // better odds and rested men and sends fewer, a cunning one is drawn to undefended provinces and kept off forts.
  const spear = Math.max(1, Math.round(ds.length * A.GENERALS.spear(a))),
    used = new Set();
  let n = 0;
  for (const c of cands) {
    if (n >= spear) break;
    const pw = new Map();
    for (const d of c.atk) pw.set(d, A.divPower(d));
    // [X1 baked patch war/38-orders GO-ARMY-DECIDE] The dials above are bars, and a bar only delays an attack.
    // Measured in the full world (36 wars a temper), a cautious army passed 21% fewer chances to attack than a steady
    // one would have at the same moment, in every build with or without the richer, drilled hosts of
    // 56-court-and-treasury and 60-unit-drill, and still made as many assaults: the division held back went in a few
    // days later. The share sent at once never bound (an army rarely has more targets than a third of its divisions),
    // so the cunning pull, which only orders the targets, did nothing either. The temper now makes four decisions
    // (A.GENERALS.opens, held, commit and fortNeed): whether to take the offensive at all (a cautious general
    // outnumbered on his front only frees his own land, as an army ordered to hold the front does); which divisions
    // may attack at all (a cautious one keeps a third in reserve, fixed by their ids); how many go in at one province
    // (the release: 4; a bold one sends 6); and whether to storm a defended fort (a cunning one wants half again the
    // odds for each step of walls). A steady general decides as the release does.
    const pick = c.atk
      .filter(d => !used.has(d.id))
      .sort((x, y) => pw.get(y) - pw.get(x))
      .slice(0, defPow(c.j) < 1 ? 1 : A.GENERALS.commit(a));
    if (!pick.length) continue;
    const keep = pick.filter(
      d =>
        ds.filter(x => x.loc === d.loc && !used.has(x.id) && x.atk == null).length > 1 ||
        defPow(c.j) < 1 ||
        !S.prov[d.loc].adj.some(q => q !== c.j && defPow(q) > 0),
    );
    for (const d of keep) {
      used.add(d.id);
      d.path = [c.j];
      d.prog = 0;
    }
    if (keep.length) n++;
  }
};

A.wsOrderDiv = function (d, dest) {
  if (dest == null) return false;
  if (dest === d.loc) {
    d.path = [];
    d.atk = null;
    return true;
  }
  if (A.adjacent(d.loc, dest)) {
    d.path = [dest];
    d.prog = d.path[0] === dest ? d.prog : 0;
    return true;
  }
  // [X1 baked patch war/38-orders GO-ARMY-MOVES] With the bars and decisions above, a bold army made about as many
  // assaults as a steady one (a bold army already sends every division it has free) and a cunning one only left
  // defended forts alone. What sets them apart now is where they go (A.GENERALS.pull, and A.GENERALS.moves after the
  // think, orders.core.js): a bold general is drawn to the enemy's main host rather than to empty walls, and a
  // cunning one to the weakest division, to men already fighting elsewhere and to depots. And a bold general's
  // divisions break later in a fight: at 2% of their order instead of 4% (A.GENERALS.stand), so they hold on at
  // worse odds and lose more men. A cunning general's divisions march round walled or held provinces of the enemy
  // (A.GENERALS.road, in A.wsOrderDiv), and one that finds the enemy across its road on the march goes round instead
  // of attacking (A.GENERALS.sidestep, in A.divMove). Measured over 96 wars, a steady army lost 2.9 million of its
  // 4.3 million attacking dead in 1,547 short fights at places with no walls of theirs, and won 17% of them: mostly
  // divisions walking into an enemy host on the way to their posts, not assaults the general chose. A steady army's
  // pull is 0, its stand 1, its road the release's and it never sidesteps, which is the release.
  const path = A.GENERALS ? A.GENERALS.road(d, dest) : A.wsPath(d.loc, dest, d.r);
  return path
    ? ((d.path.length && path.length && d.path[0] === path[0]) || (d.prog = 0), (d.path = path), (d.atk = null), true)
    : false;
};

A.divSpeed = function (d) {
  const s = A.divS(d),
    g = A.divGen(d),
    v =
      22 *
      s.spd *
      (1 + (g ? A.perkOf(g, "logistics", "supply") * 0.3 + A.skill(g, "logistics") / 600 : 0)) *
      (1 + ((d.dr || {}).march || 0) * 0.16),
    o = d.elite && GD.ORDERS[d.elite];
  return o && o.fx && o.fx.spd ? v * (1 + o.fx.spd) : v;
};

A.divMove = function (d) {
  const S = A.S;
  if (!d.path.length) return;
  const next = d.path[0],
    P = S.prov[next];
  if (!P) {
    d.path = [];
    return;
  }
  // [X1 baked patch war/38-orders GO-ARMY-MOVES] With the bars and decisions above, a bold army made about as many
  // assaults as a steady one (a bold army already sends every division it has free) and a cunning one only left
  // defended forts alone. What sets them apart now is where they go (A.GENERALS.pull, and A.GENERALS.moves after the
  // think, orders.core.js): a bold general is drawn to the enemy's main host rather than to empty walls, and a
  // cunning one to the weakest division, to men already fighting elsewhere and to depots. And a bold general's
  // divisions break later in a fight: at 2% of their order instead of 4% (A.GENERALS.stand), so they hold on at
  // worse odds and lose more men. A cunning general's divisions march round walled or held provinces of the enemy
  // (A.GENERALS.road, in A.wsOrderDiv), and one that finds the enemy across its road on the march goes round instead
  // of attacking (A.GENERALS.sidestep, in A.divMove). Measured over 96 wars, a steady army lost 2.9 million of its
  // 4.3 million attacking dead in 1,547 short fights at places with no walls of theirs, and won 17% of them: mostly
  // divisions walking into an enemy host on the way to their posts, not assaults the general chose. A steady army's
  // pull is 0, its stand 1, its road the release's and it never sidesteps, which is the release.
  if (A.divsAt(next).some(x => A.hostile(d.r, x.r))) {
    if (A.GENERALS && A.GENERALS.sidestep(d, next)) return;
    d.atk = next;
    return;
  }
  if (d.atk === next) d.atk = null;
  d.sieging = false;
  const winter = A.wsWinter(P),
    km =
      A.divSpeed(d) *
      (A.WS.moveTerr[P.terr] || 1) *
      (winter ? 0.6 : 1) *
      (d.org < A.divMaxOrg(d) * 0.3 ? 0.7 : 1) *
      (P.road ? 1.25 : 1) *
      (d.sr != null && d.sr < 0.5 ? 0.8 : 1);
  if (((d.prog += km / A.wsDist(d.loc, next)), d.prog < 1)) return;
  d.from = d.loc;
  d.loc = next;
  d.path.shift();
  d.prog = 0;
  d.dig = 0;
  d.arr = S.warClock;
  A.locDirty();
  const c = A.ctrl(P);
  if (A.hostile(d.r, c)) {
    const er = A.realm(P.owner);
    if ((P.fort || 0) === 0 && !(er && er.capitalProv === P.id)) A.occupy(P, d.r);
    else {
      if (!d.manual) d.path = [];
    }
  } else if (A.friendly(P.owner, d.r) && P.occ && A.hostile(d.r, P.occ)) {
    if ((P.fort || 0) === 0) A.occupy(P, d.r);
    else {
      if (!d.manual) d.path = [];
    }
  }
};

A.occupy = function (P, rid) {
  const S = A.S;
  if (A.friendly(P.owner, rid)) {
    if (P.occ) {
      P.occ = null;
      A.news(`${A.realmShort(rid)} retake ${P.name}.`, "map");
    }
  } else {
    P.occ = rid;
    if ((P.fort || 0) > 0 || P.pop > 12e4) A.news(`${P.name} falls to ${A.realmShort(rid)}.`, "map");
  }
  P.sgd = 0;
  P.sgBy = null;
  const pc = A.pc();
  if (pc && pc.mil && pc.mil.realm === rid) {
    const mine = A.divsAt(P.id).filter(d => d.r === rid);
    if (mine.some(d => d.id === pc.mil.div)) {
      pc.mil.merit += 6 + Math.round((P.fort || 0) * 3);
      pc.mil.taken = (pc.mil.taken || 0) + 1;
      A.log(`Your division takes ${P.name}.`, "good");
    }
    if (pc.mil.army && mine.some(d => d.army === pc.mil.army) && pc.mil.rank >= 7) {
      pc.mil.taken = (pc.mil.taken || 0) + 1;
      pc.mil.merit += 4;
    }
  }
  if (pc && pc.ruler && pc.ruler === rid && (P.fort || 0) > 0) A.log(`Your host takes ${P.name}.`, "good");
  if (pc && pc.home === P.id && pc.realm === P.owner && A.hostile(pc.realm, rid))
    A.log(`The enemy takes your home, ${P.name}.`, "bad");
};

A.wsWinter = function (P) {
  const d = A.S.warClock % 365;
  return (P.terr === "tundra" || P.terr === "mountains" || P.y < 1300) && (d < 60 || d > 320);
};

A.WTAC = {
  assault: {
    s: "a",
    n: "Frontal assault",
    d: "Straight at them. Simple, honest, bloody.",
    w: 3,
    ok: () => true,
    fx: {},
    agg: 1,
  },
  shock: {
    s: "a",
    n: "Shock charge",
    d: "Horse and heavy foot hit at one point. Deadly — unless they meet a wall of spears.",
    w: 2,
    ok: c => c.horse >= 0.2 || c.heavy >= 0.3,
    fx: {
      aDmg: 1.3,
      aOrg: 1.25,
    },
    agg: 1.3,
  },
  flank: {
    s: "a",
    n: "Flanking march",
    d: "Part of the force swings wide and comes in from the side. Useless against a held reserve.",
    w: 2,
    ok: (c, P) => c.spd >= 0.9 && !["mountains", "marsh"].includes(P.terr),
    fx: {
      aDmg: 1.15,
      wA: 0.3,
    },
    agg: 1.1,
  },
  feint: {
    s: "a",
    n: "Feigned retreat",
    d: 'Horsemen turn and "flee" to lure the enemy out of line. If they counterattack, they are cut to pieces.',
    w: 1.2,
    ok: (c, P) => c.horse >= 0.3 && ["plains", "steppe", "desert", "tundra"].includes(P.terr),
    fx: {
      aDmg: 0.9,
    },
    agg: 1,
  },
  night: {
    s: "a",
    n: "Night attack",
    d: "Veterans go in under the dark. Terrible if the enemy sleeps; a shambles if they keep watch.",
    w: 1,
    ok: c => c.exp >= 35,
    fx: {
      aDmg: 1.3,
      dDmg: 0.8,
    },
    agg: 1.2,
  },
  infil: {
    s: "a",
    n: "Infiltration",
    d: "Light troops slip through broken ground and around walls and trenches.",
    w: 1.2,
    ok: (c, P) => ["forest", "hills", "marsh", "mountains"].includes(P.terr) && (c.light >= 0.25 || c.exp >= 50),
    fx: {
      fortIgnore: 0.7,
      aDmg: 1.05,
    },
    agg: 1,
  },
  barrage: {
    s: "a",
    n: "Arrow storm",
    d: "Volley after volley before the foot go in. Breaks spirit more than bodies — unless shields are locked.",
    w: 1.5,
    ok: c => c.missile >= 0.25,
    fx: {
      aDmg: 1.1,
      aOrg: 1.35,
      casA: 0.9,
    },
    agg: 0.9,
  },
  probe: {
    s: "a",
    n: "Probing attack",
    d: "Feel for weakness, spare your men. Slow, cheap, safe.",
    w: 1,
    ok: () => true,
    fx: {
      aDmg: 0.7,
      dDmg: 0.55,
      casA: 0.75,
    },
    agg: 0.7,
  },
  hold: {
    s: "d",
    n: "Hold the line",
    d: "Stand and take it.",
    w: 3,
    ok: () => true,
    fx: {},
    agg: 1,
  },
  spearwall: {
    s: "d",
    n: "Spear wall",
    d: "A hedge of points. A charge that hits it dies on it.",
    w: 1.5,
    ok: c => c.foot >= 0.4,
    fx: {
      aDmg: 0.95,
    },
    ctr: ["shock"],
    agg: 0.9,
  },
  counter: {
    s: "d",
    n: "Counterattack",
    d: "Hit them back while they are tired. Deadly against an assault — a trap against a feint.",
    w: 1.5,
    ok: c => c.org >= 0.5,
    fx: {
      dDmg: 1.3,
      casD: 1.1,
    },
    ctr: ["assault", "probe"],
    agg: 1.3,
  },
  ambush: {
    s: "d",
    n: "Ambush",
    d: "They walk into a killing ground you chose. Needs broken ground, local scouts, and the first days of the fight.",
    w: 2.5,
    ok: (c, P, F, own, rd) =>
      F.days <= 2 && own && rd > 5 && ["forest", "hills", "marsh", "mountains"].includes(P.terr) && !F.ambushed,
    fx: {
      dDmg: 1.6,
      dOrg: 1.4,
    },
    agg: 1.2,
  },
  elastic: {
    s: "d",
    n: "Elastic defense",
    d: "Give ground, bend, never break. Wastes the enemy's flanking march.",
    w: 1.2,
    ok: c => c.spd >= 0.85,
    fx: {
      aDmg: 0.75,
      dDmg: 0.85,
    },
    ctr: ["flank"],
    agg: 0.8,
  },
  shieldwall: {
    s: "d",
    n: "Shield wall",
    d: "Locked shields. Arrows rattle off.",
    w: 1.2,
    ok: c => c.foot >= 0.4,
    fx: {
      aOrg: 0.85,
    },
    ctr: ["barrage"],
    agg: 0.9,
  },
  vigil: {
    s: "d",
    n: "Watchfires and pickets",
    d: "Nobody sleeps, nothing creeps. Ruins night attacks and infiltration.",
    w: 0.6,
    ok: () => true,
    fx: {},
    ctr: ["night", "infil"],
    agg: 0.9,
  },
  dig: {
    s: "d",
    n: "Dig in",
    d: "Trenches, stakes, walls. Every attack costs them more.",
    w: 1.5,
    ok: (c, P, F, own, rd, dig) => dig >= 2 || (own && P.fort > 0),
    fx: {
      aDmg: 0.85,
    },
    agg: 0.8,
  },
  reserve: {
    s: "d",
    n: "Hold a reserve",
    d: "Fresh men kept back to plug any gap — or to meet a flank.",
    w: 1,
    ok: () => true,
    fx: {
      dDmg: 1.05,
    },
    ctr: ["flank", "infil"],
    agg: 0.9,
  },
};

A.WTAC_KEYS = {
  a: Object.keys(A.WTAC).filter(k => A.WTAC[k].s === "a"),
  d: Object.keys(A.WTAC).filter(k => A.WTAC[k].s === "d"),
};

A.sideMake = function (list) {
  let n = 0,
    horse = 0,
    missile = 0,
    foot = 0,
    heavy = 0,
    light = 0,
    exp = 0,
    org = 0,
    spd = 9;
  for (const d of list) {
    const s = A.divS(d),
      k = Math.max(1, d.men);
    n += k;
    horse += (k * s.cats.horse) / Math.max(1, s.n);
    missile += (k * s.cats.missile) / Math.max(1, s.n);
    foot += (k * s.cats.foot) / Math.max(1, s.n);
    heavy += k * (s.arm >= 4 ? 1 : 0);
    light += k * (s.spd >= 1.1 || s.cats.missile > s.n / 3 ? 1 : 0);
    exp += k * d.exp;
    org += (k * d.org) / Math.max(1, A.divMaxOrg(d));
    spd = Math.min(spd, s.spd);
  }
  n = Math.max(1, n);
  const c = {
    horse: horse / n,
    missile: missile / n,
    foot: foot / n,
    heavy: heavy / n,
    light: light / n,
    exp: exp / n,
    org: org / n,
    spd: spd > 8 ? 1 : spd,
  };
  let rec = 0,
    nd = 0;
  for (const d of list) {
    nd++;
    rec += ((d.dr || {}).skirmish || 0) * 24;
  }
  c.drillRec = nd ? rec / nd : 0;
  let orec = 0;
  for (const d of list || []) {
    const o = d && d.elite && GD.ORDERS[d.elite];
    if (o && o.fx && o.fx.recon) orec = Math.max(orec, o.fx.recon);
  }
  c.drillRec = (c.drillRec || 0) + orec;
  return c;
};

A.sideRecon = function (c, g, home) {
  let v =
    10 +
    c.horse * 40 +
    c.light * 10 +
    c.exp / 5 +
    (g ? A.skill(g, "tactics") / 3 + A.skill(g, "tracking") / 6 : 0) +
    (home ? 10 : 0);
  if (g && g.id === A.S.pc) v += A.staffBonus(g, "recon");
  return v + (c.drillRec || 0);
};

A.pcTacFor = function (list) {
  const pc = A.pc();
  if (!pc || !pc.tac) return null;
  for (const d of list) {
    if (pc.ruler && d.r === pc.ruler) return pc.tac;
    if (!pc.mil) continue;
    const a = A.army(d.army);
    if ((a && a.gen === pc.id && pc.mil.rank >= 7) || (d.id === pc.mil.div && pc.mil.rank >= 4) || d.cmd === pc.id)
      return pc.tac;
  }
  return null;
};

A.tacDay = function (F, att, def, P) {
  const S = A.S,
    cA = A.sideMake(att),
    cD = A.sideMake(def),
    gA = A.divGen(att[0]),
    gD = A.divGen(def[0]),
    own = A.friendly(A.ctrl(P), def[0].r),
    rA = A.sideRecon(cA, gA, false),
    rD = A.sideRecon(cD, gD, own),
    digD = def.reduce((x, d) => x + (d.dig || 0), 0) / Math.max(1, def.length),
    avail = side => A.WTAC_KEYS[side].filter(k => A.WTAC[k].ok(side === "a" ? cA : cD, P, F, own, rD - rA, digD)),
    skA = gA ? A.skill(gA, "tactics") : 10,
    skD = gD ? A.skill(gD, "tactics") : 10,
    pickW = (keys, sk) => A.wpick(keys, k => A.WTAC[k].w * (["assault", "hold"].includes(k) ? 1 : 0.6 + sk / 50)),
    avA = avail("a"),
    avD = avail("d"),
    prefA = A.pcTacFor(att),
    prefD = A.pcTacFor(def);
  let tA = prefA && prefA.atk && avA.includes(prefA.atk) && A.chance(0.85) ? prefA.atk : pickW(avA, skA),
    tD,
    read = false;
  const pRead = A.clamp(0.2 + (rD - rA) / 80 + skD / 400, 0.05, 0.8),
    ctrs = avD.filter(k => (A.WTAC[k].ctr || []).includes(tA) || (tA === "feint" && false));
  if (prefD && prefD.def && avD.includes(prefD.def) && A.chance(0.85)) tD = prefD.def;
  else {
    if (ctrs.length && A.chance(pRead)) {
      tD = A.pick(ctrs);
      read = true;
    } else
      tD = pickW(
        avD.filter(k => !(tA === "feint" && k === "counter" && A.chance(pRead))),
        skD,
      );
  }
  let switched = false;
  if ((A.WTAC[tD].ctr || []).includes(tA) && A.chance(A.clamp((rA - rD) / 60 + skA / 500, 0, 0.6))) {
    const alt = avA.filter(k => !(A.WTAC[tD].ctr || []).includes(k));
    if (alt.length) {
      tA = pickW(alt, skA);
      switched = true;
    }
  }
  if (tD === "ambush") F.ambushed = true;
  const m = {
      aDmg: 1,
      dDmg: 1,
      aOrg: 1,
      dOrg: 1,
      fortIgnore: 0,
      casA: 1,
      casD: 1,
      wA: 0,
    },
    apply = fx => {
      for (const k in fx)
        if (k === "wA" || k === "fortIgnore") m[k] = Math.max(m[k], fx[k]);
        else m[k] *= fx[k];
    };
  let note = "";
  const countered = (A.WTAC[tD].ctr || []).includes(tA);
  if (tA === "feint" && tD === "counter") {
    apply({
      aDmg: 1.6,
      dDmg: 0.6,
      aOrg: 1.4,
    });
    note = "trap";
  } else {
    if (countered) {
      apply(A.WTAC[tD].fx);
      apply({
        aDmg: 0.7,
        dDmg: 1.2,
        casA: 1.15,
      });
      note = "countered";
    } else {
      apply(A.WTAC[tA].fx);
      apply(A.WTAC[tD].fx);
      if (tA === "night" && !read) note = "surprise";
    }
  }
  F.tacA = tA;
  F.tacD = tD;
  F.recA = Math.round(rA);
  F.recD = Math.round(rD);
  F.log = F.log || [];
  F.log.push([F.days, tA, tD, note || (switched ? "switched" : read ? "read" : "")]);
  if (F.log.length > 14) F.log.shift();
  F.horseA = cA.horse;
  F.horseD = cD.horse;
  return m;
};

A.TAC_NOTE = {
  trap: "The feigned flight works — the defenders chase out of line and are cut down.",
  countered: "The defenders saw it coming.",
  surprise: "Surprise in the dark.",
  switched: "The attackers spot the trap and change plan.",
  read: "The defenders read the attack.",
};

A.fightDay = function (pid) {
  const S = A.S,
    P = S.prov[pid],
    F0 = S.fights[pid],
    defAll = A.divsAt(pid);
  let att = A.allDivs().filter(d => d.atk === pid && d.army && d.org > 0.5 && A.adjacent(d.loc, pid));
  for (const d of A.allDivs()) if (d.atk === pid && !att.includes(d)) d.atk = null;
  if (!att.length) {
    if (F0) A.fightEnd(pid, "def");
    return;
  }
  const aR = att[0].r,
    def = defAll.filter(d => A.hostile(aR, d.r));
  if (((att = att.filter(d => !def.length || A.hostile(d.r, def[0].r))), !def.length)) {
    for (const d of att) {
      d.atk = null;
      if (!d.path.length || d.path[0] !== pid) d.path = [pid];
    }
    if (F0) A.fightEnd(pid, "att");
    return;
  }
  const dR = def[0].r;
  let F = F0;
  if (!F) {
    const war = S.wars.find(
      w => (w.att.includes(aR) && w.def.includes(dR)) || (w.def.includes(aR) && w.att.includes(dR)),
    );
    F = S.fights[pid] = {
      loc: pid,
      war: war ? war.id : null,
      start: S.warClock,
      a: aR,
      b: dR,
      menA: 0,
      menD: 0,
      deadA: 0,
      deadD: 0,
      days: 0,
      aIds: [],
      dIds: [],
      key: "F" + pid,
      log: [],
    };
    for (const d of def) {
      d.caught = d.path.length > 0 || S.warClock - (d.arr || -9) <= 1;
      d.path = [];
    }
  }
  F.days++;
  for (const d of att.concat(def)) {
    const ar = A.army(d.army);
    if (ar) ar.lastFight = S.warClock;
  }
  for (const d of att)
    if (!F.aIds.includes(d.id)) {
      F.aIds.push(d.id);
      F.menA += d.men;
    }
  for (const d of def)
    if (!F.dIds.includes(d.id)) {
      F.dIds.push(d.id);
      F.menD += d.men;
    }
  // [X1 baked patch war/99997-v2-war V2W-HOLD-FIRST-DAY] A.fightDay asks the player to take part (A.wsPCFightStart)
  // on a fight's first day and then fights that day at once, so most small fights were over before the answer: "Take
  // your place in the line" went straight to "After X" with nothing to play (playtest 2, new 6; 13 of 24 asks in a
  // probe). When the ask was made, the fight now skips its first day's fighting (F.v2hold, set by b-battle.core.js
  // after the ask): the player's scene is the first day, and the map fights it from the next tick, which counts as
  // its first day again (F.days back to 0; F.v2asked keeps the ask from being made twice). In the source: return
  // after the ask when the player was asked, and fight from the next tick.
  if (F.days === 1 && !F.v2asked && A.wsPCFightStart) A.wsPCFightStart(F, att, def);
  if (F.v2hold) {
    delete F.v2hold;
    F.days = 0;
    F.v2asked = 1;
    return;
  }
  const T = A.tacDay(F, att, def, P),
    dirs = new Set(att.map(d => d.loc)).size,
    W = (A.WIDTH[P.terr] || 60) + 35 * Math.min(2, dirs - 1);
  F.width = W;
  F.dirs = dirs;
  const front = (list, w) => {
      const s = list.slice().sort((x, y) => y.org / Math.max(1, A.divMaxOrg(y)) - x.org / Math.max(1, A.divMaxOrg(x))),
        out = [];
      let used = 0;
      for (const d of s) {
        const dw = A.divS(d).w;
        if (!(out.length && used + dw > w)) {
          out.push(d);
          used += dw;
        }
      }
      return {
        out,
        used,
      };
    },
    fa = front(att, W * (1 + T.wA)),
    fd = front(def, W);
  F.usedA = fa.used;
  F.usedD = fd.used;
  const C = new Map();
  for (const d of fa.out.concat(fd.out)) C.set(d, A.divCombat(d));
  const avg = (list, k) => {
      let t = 0,
        w = 0;
      for (const d of list) {
        const c = C.get(d);
        t += c[k] * c.w;
        w += c.w;
      }
      return w ? t / w : 0;
    },
    hdA = avg(fa.out, "hd"),
    hdD = avg(fd.out, "hd"),
    armA = avg(fa.out, "arm"),
    armD = avg(fd.out, "arm"),
    prcA = avg(fa.out, "prc"),
    prcD = avg(fd.out, "prc"),
    acD = avg(fd.out, "ac"),
    fort = (A.friendly(A.ctrl(P), dR) && P.fort) || 0,
    winter = A.wsWinter(P),
    mods = (F.mods = {
      terr: A.ATK_TERR[P.terr] || 1,
      fort,
      winter: winter ? 0.85 : 1,
    }),
    shoot = (list, isAtt, enemyHd, enemyArm) => {
      let tot = 0;
      for (const d of list) {
        const c = C.get(d),
          s = c.s;
        let x = c.soft * (1 - enemyHd) + c.hard * enemyHd;
        if (c.prc < enemyArm) x *= 0.5;
        x *= 0.5 + 0.5 * (d.sr != null ? d.sr : 1);
        if (isAtt) {
          x *= mods.terr * mods.winter * (1 + (d.plan || 0)) * T.aDmg;
          if (fort) x *= 1 - 0.08 * fort * (1 - Math.min(0.7, s.fx.fortPen || 0)) * (1 - T.fortIgnore);
          if (s.main === "horse") x *= 1 - Math.min(0.3, acD / 30);
          if (!S.prov[d.loc].adj.includes(pid)) x *= 0.65;
        } else x *= T.dDmg;
        tot += x;
      }
      return tot;
    },
    atkA = shoot(fa.out, true, hdD, armD),
    atkD = shoot(fd.out, false, hdA, armA);
  F.atkA = Math.round(atkA);
  F.atkD = Math.round(atkD);
  const hit = (targets, incoming, isDef, enemyPrc, enemyList) => {
    const wsum = targets.reduce((x, d) => x + C.get(d).w, 0) || 1;
    let dead = 0;
    for (const t of targets) {
      const c = C.get(t),
        s = c.s,
        I = ((incoming * c.w) / wsum) * A.rf(0.85, 1.15);
      let D = isDef
        ? c.def * (1 + 0.025 * (t.dig || 0) * (1 - T.fortIgnore)) * (1 + 0.06 * fort * (1 - T.fortIgnore))
        : c.brk;
      if (isDef && t.caught && F.days <= 2) D *= 0.75;
      D *= 0.5 + 0.5 * (t.sr != null ? t.sr : 1);
      const eff = 0.1 * Math.min(I, D) + 0.4 * Math.max(0, I - D),
        prot = c.arm > enemyPrc ? 0.6 : 1;
      t.org = Math.max(0, t.org - eff * A.WS.orgK * prot * (isDef ? T.aOrg : T.dOrg));
      const hpD = eff * A.WS.hpK * prot,
        men = Math.round((hpD / Math.max(1, s.hp)) * s.men * 0.6 * (1 - (s.fx.cas || 0)) * (isDef ? T.casD : T.casA));
      dead += A.divLose(t, men);
    }
    const ksum = enemyList.reduce((x, d) => x + C.get(d).w, 0) || 1;
    for (const d of enemyList) d.kills = (d.kills || 0) + Math.round((dead * C.get(d).w) / ksum);
    return dead;
  };
  let deadD = hit(fd.out, atkA, true, prcA, fa.out),
    deadA = hit(fa.out, atkD, false, prcD, fd.out);
  const orgR = list => {
      let o = 0,
        m = 0;
      for (const d of list) {
        o += d.org;
        m += A.divMaxOrg(d);
      }
      return m ? o / m : 0;
    },
    oA = orgR(att),
    oD = orgR(def);
  if (oD < 0.22 && oA > 0.4) {
    for (const d of def) deadD += A.divLose(d, d.men * 0.012 * (1 + 2.5 * (F.horseA || 0)));
    F.rout = "def";
  } else if (oA < 0.22 && oD > 0.4 && ["counter", "ambush"].includes(F.tacD)) {
    for (const d of att) deadA += A.divLose(d, d.men * 0.01 * (1 + 2.5 * (F.horseD || 0)));
    F.rout = "att";
  }
  F.deadA += deadA;
  F.deadD += deadD;
  F.dayA = deadA;
  F.dayD = deadD;
  for (const d of fa.out.concat(fd.out)) d.exp = Math.min(100, d.exp + 0.55 * (1 - d.exp / 105));
  for (const d of att.concat(def)) if (!C.has(d)) d.exp = Math.min(100, d.exp + 0.12);
  for (const d of fa.out) d.plan = Math.max(0, (d.plan || 0) - 0.03);
  for (const rid of new Set(att.concat(def).map(d => d.r))) {
    const r = A.realm(rid);
    if (r && r.forces) r.forces.xp = Math.min(200, r.forces.xp + 0.02 * (fa.out.length + fd.out.length));
  }
  F.pursuit = F.horseA || 0;
  // [X1 baked patch war/38-orders GO-ARMY-MOVES] With the bars and decisions above, a bold army made about as many
  // assaults as a steady one (a bold army already sends every division it has free) and a cunning one only left
  // defended forts alone. What sets them apart now is where they go (A.GENERALS.pull, and A.GENERALS.moves after the
  // think, orders.core.js): a bold general is drawn to the enemy's main host rather than to empty walls, and a
  // cunning one to the weakest division, to men already fighting elsewhere and to depots. And a bold general's
  // divisions break later in a fight: at 2% of their order instead of 4% (A.GENERALS.stand), so they hold on at
  // worse odds and lose more men. A cunning general's divisions march round walled or held provinces of the enemy
  // (A.GENERALS.road, in A.wsOrderDiv), and one that finds the enemy across its road on the march goes round instead
  // of attacking (A.GENERALS.sidestep, in A.divMove). Measured over 96 wars, a steady army lost 2.9 million of its
  // 4.3 million attacking dead in 1,547 short fights at places with no walls of theirs, and won 17% of them: mostly
  // divisions walking into an enemy host on the way to their posts, not assaults the general chose. A steady army's
  // pull is 0, its stand 1, its road the release's and it never sidesteps, which is the release.
  for (const d of att)
    if (d.org < Math.max(1, A.divMaxOrg(d) * 0.04 * (A.GENERALS ? A.GENERALS.stand(d) : 1))) {
      d.atk = null;
      d.path = [];
      d.manual = false;
    }
  // [X1 baked patch war/38-orders GO-ARMY-MOVES] With the bars and decisions above, a bold army made about as many
  // assaults as a steady one (a bold army already sends every division it has free) and a cunning one only left
  // defended forts alone. What sets them apart now is where they go (A.GENERALS.pull, and A.GENERALS.moves after the
  // think, orders.core.js): a bold general is drawn to the enemy's main host rather than to empty walls, and a
  // cunning one to the weakest division, to men already fighting elsewhere and to depots. And a bold general's
  // divisions break later in a fight: at 2% of their order instead of 4% (A.GENERALS.stand), so they hold on at
  // worse odds and lose more men. A cunning general's divisions march round walled or held provinces of the enemy
  // (A.GENERALS.road, in A.wsOrderDiv), and one that finds the enemy across its road on the march goes round instead
  // of attacking (A.GENERALS.sidestep, in A.divMove). Measured over 96 wars, a steady army lost 2.9 million of its
  // 4.3 million attacking dead in 1,547 short fights at places with no walls of theirs, and won 17% of them: mostly
  // divisions walking into an enemy host on the way to their posts, not assaults the general chose. A steady army's
  // pull is 0, its stand 1, its road the release's and it never sidesteps, which is the release.
  for (const d of def)
    if (d.org < Math.max(1, A.divMaxOrg(d) * 0.04 * (A.GENERALS ? A.GENERALS.stand(d) : 1))) A.divRetreat(d, pid, F);
  const left = A.divsAt(pid).filter(d => A.hostile(aR, d.r)),
    menL = left.reduce((x, d) => x + d.men, 0),
    menAt = att.filter(d => d.atk === pid).reduce((x, d) => x + d.men, 0);
  if (left.length && menL < menAt * 0.06) for (const d of left) A.divRetreat(d, pid, F, true);
  if (A.divsAt(pid).some(d => A.hostile(aR, d.r))) {
    if (!A.allDivs().some(d => d.atk === pid)) A.fightEnd(pid, "def");
  } else A.fightEnd(pid, "att");
};

A.divRetreat = function (d, pid, F, overrun) {
  const S = A.S,
    P = S.prov[pid];
  if (d && d.elite) {
    const atk0 = new Set(
      A.allDivs()
        .filter(x => x.atk === pid)
        .map(x => x.loc),
    );
    if (
      !(
        P
          ? P.adj.concat(P.sea || []).filter(j => {
              const Q = S.prov[j];
              return A.friendly(A.ctrl(Q), d.r) && !atk0.has(j) && !A.divsAt(j).some(x => A.hostile(d.r, x.r));
            })
          : []
      ).length &&
      A.chance(0.5)
    ) {
      const r = A.realm(d.r),
        home = r && r.capitalProv != null && A.friendly(A.ctrl(S.prov[r.capitalProv]), d.r) ? r.capitalProv : null;
      if (home != null && home !== pid) {
        A.divLose(d, d.men * A.rf(0.3, 0.5));
        d.loc = home;
        d.from = home;
        d.path = [];
        d.prog = 0;
        d.atk = null;
        d.org = Math.max(1, d.org);
        A.locDirty();
        A.news(
          `${d.name} cut their way out of the ring at ${P ? P.name : "the front"}, leaving a trail of their own dead.`,
          "battle",
        );
        return;
      }
    }
    overrun = false;
  }
  const atkLocs = new Set(
      A.allDivs()
        .filter(x => x.atk === pid)
        .map(x => x.loc),
    ),
    opts = P.adj.concat(P.sea || []).filter(j => {
      const Q = S.prov[j];
      return (
        A.friendly(A.ctrl(Q), d.r) &&
        !atkLocs.has(j) &&
        !A.divsAt(j).some(x => A.hostile(d.r, x.r)) &&
        !A.allDivs().some(x => x.atk === j && A.hostile(d.r, x.r))
      );
    });
  if (!opts.length || (overrun && A.chance(0.5))) {
    const lost = d.men;
    if (F) F.deadD += Math.round(lost * 0.6);
    // [X1 baked patch core/04-world-fixes WLD-DIV-ARTICLE] A division line wrote "The ${d.name}", and a far order is
    // often named "The ..." already: "The The Chain Keepers is cut off and destroyed at Shulai" (world review cycle 2,
    // B5). A.divThe(name) puts "The" before a name only when it has none.
    A.news(
      `${A.divThe ? A.divThe(d.name) : "The " + d.name} is ${opts.length ? "overrun" : "cut off and destroyed"} at ${P.name}.`,
      "battle",
    );
    const pc = A.pc();
    if (pc && pc.mil && pc.mil.div === d.id) {
      A.log(
        `Your division is ${opts.length ? "overrun" : "surrounded and destroyed"} at ${P.name}. You get out with a handful of men.`,
        "bad",
      );
      pc.health = Math.max(5, pc.health - A.ri(5, 25));
    }
    const r = A.realm(d.r);
    if (r) r.exhaustion = A.clamp(r.exhaustion + 2, 0, 100);
    A.divRemove(d);
    return;
  }
  if (F && F.pursuit) A.divLose(d, d.men * (0.02 + 0.1 * F.pursuit));
  const to = opts.sort(
    (x, y) => A.divsAt(y).filter(z => z.r === d.r).length - A.divsAt(x).filter(z => z.r === d.r).length,
  )[0];
  d.from = pid;
  d.loc = to;
  d.path = [];
  d.prog = 0;
  d.dig = 0;
  d.atk = null;
  d.arr = S.warClock;
  d.retreated = S.warClock;
  A.locDirty();
  d.org = Math.max(d.org, 1);
};

A.fightEnd = function (pid, winner) {
  const S = A.S,
    F = S.fights[pid];
  if (!F) return;
  delete S.fights[pid];
  const P = S.prov[pid],
    atkW = winner === "att",
    W = atkW ? F.a : F.b,
    L = atkW ? F.b : F.a,
    big = F.menA + F.menD,
    w = S.wars.find(x => x.id === F.war),
    dead = F.deadA + F.deadD;
  for (const id of F.aIds.concat(F.dIds)) {
    const d = A.divById(id);
    if (!d) continue;
    if ((F.aIds.includes(id) && atkW) || (F.dIds.includes(id) && !atkW)) {
      d.wins = (d.wins || 0) + 1;
      d.org = Math.min(A.divMaxOrg(d), d.org + 4);
    } else d.losses = (d.losses || 0) + 1;
  }
  if ((w && (w.nb = (w.nb || 0) + 1), w && big >= 3e3 && F.days >= 1)) {
    const side = A.warSide(w, W),
      d = A.clamp(Math.round(2 + big / 9e3 + dead / 3e3), 2, 14);
    w.bscore = A.clamp((w.bscore || 0) + (side === "att" ? d : -d), -45, 45);
    if (big >= 9e3 || F.days >= 3) {
      w.battles.push({
        y: S.year,
        name: "Battle of " + P.name,
        win: side,
        lossW: atkW ? F.deadA : F.deadD,
        lossL: atkW ? F.deadD : F.deadA,
        days: F.days,
        men: big,
      });
      if (w.battles.length > 80)
        w.battles = w.battles
          .slice()
          .sort((x, y) => (y.men || 0) - (x.men || 0))
          .slice(0, 60)
          .sort((x, y) => x.y - y.y);
    }
    w.kills = w.kills || {
      att: 0,
      def: 0,
    };
    if (big > 12e3)
      A.news(
        `Battle of ${P.name}: ${A.realmShort(W)} ${atkW ? "break through" : "hold"} after ${F.days} day${F.days > 1 ? "s" : ""}. ${A.fmt(dead)} fall.`,
        "battle",
      );
  }
  for (const rid of new Set([F.a, F.b])) {
    const r = A.realm(rid);
    if (!r) continue;
    const lost = rid === F.a ? F.deadA : F.deadD;
    r.exhaustion = A.clamp(
      r.exhaustion + (lost / Math.max(2e3, r.army + r.levy * 0.2)) * (rid === L ? 55 : 35),
      0,
      100,
    );
  }
  const pc = A.pc();
  if (!pc || !pc.mil) return;
  const myD = pc.mil.div && (F.aIds.includes(pc.mil.div) || F.dIds.includes(pc.mil.div)),
    myA =
      pc.mil.army &&
      F.aIds.concat(F.dIds).some(id => {
        const d = A.divById(id);
        return d && d.army === pc.mil.army;
      });
  if ((!myD && !(myA && pc.mil.rank >= 7)) || big < 2500) return;
  if (pc.mil.byYear !== S.year) {
    pc.mil.byYear = S.year;
    pc.mil.bThisYear = 0;
  }
  const fresh = 1 / (1 + pc.mil.bThisYear++ * 0.35),
    won =
      (F.aIds.includes(pc.mil.div) && atkW) ||
      (F.dIds.includes(pc.mil.div) && !atkW) ||
      (!myD && A.friendly(W, pc.mil.realm)),
    role = pc.mil.rank >= 7 ? "army" : pc.mil.rank === 6 ? "div" : "line",
    size = Math.log10(1 + big),
    myTac = F.aIds.includes(pc.mil.div) ? F.tacA : F.tacD,
    sm = pc.mil.rank >= 4 && myTac && A.WTAC[myTac] ? A.WTAC[myTac].agg : 1,
    gain = Math.max(
      1,
      Math.round((won ? 6 + size * 4 : 2 + size) * (1 + pc.mil.rank * 0.25) * sm * (atkW && won ? 1.15 : 1) * fresh),
    );
  pc.mil.merit += gain;
  pc.mil.battles++;
  if (won && role === "div") pc.mil.divWins = (pc.mil.divWins || 0) + 1;
  if (won && role === "army") pc.mil.armyWins = (pc.mil.armyWins || 0) + 1;
  if (role !== "line") {
    A.trainSkill(pc, "tactics", (0.8 + F.days * 0.35) * fresh);
    A.trainSkill(pc, "command", (0.6 + F.days * 0.25) * fresh);
    if (won) A.fame(pc, Math.max(1, Math.round(size - 2)));
    if (w) pc.mil.warsCommanded[w.id] = true;
  } else A.trainSkill(pc, GD.TROOP_SKILL[pc.mil.troop] || "spear", (0.6 + F.days * 0.4) * fresh);
  if (won && big > 4e4 && role !== "line")
    pc.deeds.push({
      y: S.year,
      t: `Won the Battle of ${P.name}`,
    });
  if (pc.mil.bThisYear <= 6 || big > 2e4)
    A.log(
      `Battle of ${P.name} (${F.days} day${F.days > 1 ? "s" : ""}): ${won ? "your side wins" : "your side is beaten"}. ${A.fmt(dead)} fall. Merit +${gain}.`,
      won ? "good" : "bad",
    );
};

A.wsPCBattle = function () {};

A.wsQueuePCBattles = function () {};

A.wsPCFightStart = function (F, att, def) {
  const pc = A.pc(),
    S = A.S;
  if (!pc || !pc.alive || !pc.mil || pc.prison) return;
  const all = att.concat(def),
    mine = all.find(d => d.id === pc.mil.div),
    myArmy =
      pc.mil.rank >= 7 &&
      all.some(d => {
        const a = A.army(d.army);
        return a && a.gen === pc.id;
      });
  if ((!mine && !myArmy) || F.menA + F.menD < (myArmy && !mine ? 12e3 : 2500)) return;
  const gap = (myArmy && !mine) || pc.mil.rank >= 4 ? 30 : 45;
  if (S.pcFightAsk && A.absDay() - S.pcFightAsk < gap) return;
  S.pcFightAsk = A.absDay();
  const myR = mine ? mine.r : pc.mil.realm,
    weAtt = att.some(d => d.r === myR),
    foe = weAtt ? F.b : F.a,
    P = S.prov[F.loc],
    ours = (weAtt ? att : def).reduce((x, d) => x + d.men, 0),
    theirs = (weAtt ? def : att).reduce((x, d) => x + d.men, 0),
    opts = [];
  if (pc.mil.rank >= 7)
    opts.push({
      t: "Take personal command of the battle",
      fn: "wsLead",
      arg: F.key,
    });
  else {
    if (pc.mil.rank >= 4)
      opts.push({
        t: `Lead your ${GD.MIL[pc.mil.rank].title.toLowerCase().includes("colonel") ? "regiment" : "men"} in the fight`,
        fn: "wsPart",
        arg: {
          key: F.key,
          war: F.war,
          enemy: foe,
          pid: F.loc,
        },
      });
    else
      opts.push({
        t: pc.mil.rank >= 2 ? "Rally your section in the line" : "Take your place in the line",
        fn: "wsLine",
        arg: {
          key: F.key,
          war: F.war,
          enemy: foe,
          pid: F.loc,
        },
      });
  }
  opts.push({
    t: pc.mil.rank >= 4 ? "Set your tactics and let it run" : "Do your duty and keep your head down",
    fn: "noop",
  });
  A.queue({
    type: "choice",
    now: true,
    title: `${weAtt ? "Attack" : "Under attack"} at ${P.name}`,
    text: `${weAtt ? `Your side goes in against ${A.realmShort(foe)} at ${P.name}` : `${A.realmShort(foe)} attack ${P.name}, where your ${myArmy ? "army" : "division"} stands`} — ${A.fmt(ours)} of yours against ${A.fmt(theirs)} of theirs, on ${P.terr}${P.fort && !weAtt ? " behind walls" : ""}. ${pc.mil.rank >= 4 ? "The first orders of the day are yours to give." : "The drums are already beating."}`,
    options: opts,
  });
};

A.CHOICE_FN = A.CHOICE_FN || {};

Object.assign(A.CHOICE_FN, {
  wsLead(key) {
    if (!A.wsLeadBattle(key)) A.log("The fighting is over before you reach it.");
  },
  wsPart(arg) {
    const pc = A.pc();
    if (!(A.S.fights || {})[+String(arg.key).replace(/^F/, "")]) {
      A.log("The fighting is over before you reach it.");
      return;
    }
    A._battlePlace = arg.pid;
    try {
      const B = A.newBattleForPC(pc, arg.war, arg.enemy);
      B.onEnd = {
        fn: "wsPart",
        arg: arg.key,
      };
      A.queue({
        type: "battle",
        b: B,
      });
    } finally {
      A._battlePlace = null;
    }
  },
  wsLine(arg) {
    const pc = A.pc();
    A._battlePlace = arg.pid;
    try {
      const m = A.newLineBattle(pc, arg.war, arg.enemy);
      m.wsKey = arg.key;
      A.queue({
        type: "mission",
        m,
      });
    } finally {
      A._battlePlace = null;
    }
  },
});

A.wsNudge = function (key, good, weight) {
  const S = A.S,
    pid = +String(key).replace(/^F/, ""),
    F = (S.fights || {})[pid],
    pc = A.pc();
  if (!F || !pc || !pc.mil) return;
  const ids = F.aIds.concat(F.dIds).map(A.divById).filter(Boolean),
    myR = pc.mil.realm;
  for (const d of ids) {
    const ours = !A.hostile(d.r, myR);
    if (good && !ours) d.org = Math.max(0, d.org - A.divMaxOrg(d) * 0.12 * weight);
    if (good && ours) d.org = Math.min(A.divMaxOrg(d), d.org + A.divMaxOrg(d) * 0.08 * weight);
    if (!good && ours && d.id === pc.mil.div) d.org = Math.max(0, d.org - A.divMaxOrg(d) * 0.15 * weight);
  }
};

A.BATTLE_END = A.BATTLE_END || {};

A.BATTLE_END.wsPart = function (B, key) {
  A.wsNudge(key, B.winner === B.pcSide, 1);
};

A.wsSupplyDay = function (live) {
  A._relAll = A.relAll();
  A._supBase = null;
  A._supDivs = null;
  A._supDepots = null;
  try {
    A.wsSupplyDayRun(live);
  } finally {
    A._relAll = null;
    A._supBase = null;
    A._supDivs = null;
    A._supDepots = null;
  }
};

A.wsSupplyDayRun = function (live) {
  const S = A.S,
    by = {};
  for (const d of live) {
    const k = d.loc + "|" + d.r;
    (by[k] = by[k] || []).push(d);
  }
  for (const k in by) {
    const L = by[k],
      d0 = L[0],
      P = S.prov[d0.loc],
      map = A.supplyMap(d0.r),
      demand = L.reduce((x, d) => x + A.divSupUse(d), 0),
      g = A.divGen(d0),
      gm =
        1 +
        (g
          ? A.skill(g, "logistics") / 300 +
            A.perkOf(g, "logistics", "supply") +
            (((A.doctrineOf && A.doctrineOf(g)) || {}).supply || 1) -
            1
          : 0),
      sr = A.clamp((map[d0.loc] * gm) / Math.max(0.01, demand), 0, 1);
    for (const d of L) {
      d.sr = sr;
      const mo = A.divMaxOrg(d),
        s = A.divS(d);
      if (
        (d.atk != null ||
          S.fights[d.loc] ||
          (d.org = Math.min(
            mo,
            d.org +
              mo *
                (d.path.length ? 0.015 : 0.05) *
                (0.3 + 0.7 * sr) *
                (1 + (s.fx.orgReg || 0) + (A.rdoc(A.realm(d.r)).orgReg || 0)),
          )),
        sr < 1)
      ) {
        A.divLose(d, d.men * 0.0016 * (1 - sr));
        for (const e in d.eq) d.eq[e] = Math.max(0, d.eq[e] - d.eq[e] * 0.001 * (1 - sr));
      }
      if ((A.wsWinter(P) && A.divLose(d, d.men * 5e-4), !d.path.length && d.atk == null)) {
        const D = A.rdoc(A.realm(d.r));
        d.dig = Math.min(
          5 + (s.fx.dig || 0) + (D.dig || 0) + (g ? Math.floor(A.skill(g, "command") / 40) : 0),
          (d.dig || 0) + 0.5,
        );
        const a = A.army(d.army);
        if (a && a.order.k !== "hold")
          d.plan = Math.min(0.25 + (D.planMax || 0) + (g ? A.skill(g, "command") / 400 : 0), (d.plan || 0) + 0.03);
      }
    }
  }
};

A.wsSiegeDay = function (live) {
  const S = A.S,
    by = {};
  for (const d of live) if (!d.path.length && d.atk == null) (by[d.loc] = by[d.loc] || []).push(d);
  // [X1 baked patch core/04-world-fixes WLD-SIEGE-OWNER] A siege belonged to whichever division was first in the
  // list, so when an allied division ended up first the progress reset to 0 (and the decay check used the same
  // test). The siege now stays with the realm already running it while it still has troops there, otherwise it goes
  // to the realm with the most men.
  for (const loc in by) {
    const P = S.prov[loc],
      L = by[loc],
      rid =
        P.sgBy && L.some(d => d.r === P.sgBy)
          ? P.sgBy
          : (() => {
              const m = {};
              for (const d of L) m[d.r] = (m[d.r] || 0) + d.men;
              return Object.keys(m).sort((a, b) => m[b] - m[a])[0];
            })(),
      heldByEnemy = A.hostile(rid, A.ctrl(P)),
      ourOcc = A.friendly(P.owner, rid) && P.occ && A.hostile(rid, P.occ);
    if (!(heldByEnemy || ourOcc) || (P.owner === "unclaimed" && !P.occ)) {
      for (const d of L) d.sieging = false;
      continue;
    }
    if (A.divsAt(+loc).some(x => A.hostile(rid, x.r))) continue;
    const er = A.realm(P.owner),
      men = L.reduce((x, d) => x + d.men, 0),
      g = A.divGen(L[0]),
      sf = Math.max(...L.map(d => A.divS(d).fx.siege || 0)),
      need =
        (4 + (P.fort || 0) * 11 + (er && er.capitalProv === P.id ? 16 : 0) + Math.min(18, P.pop / 25e3)) /
        (1 +
          sf +
          (g
            ? A.perkOf(g, "siegecraft", "siege") +
              A.skill(g, "siegecraft") / 200 +
              (((A.doctrineOf && A.doctrineOf(g)) || {}).siege || 0) +
              (g.mil && g.mil.arm === "engineers" ? 0.35 : 0)
            : 0)) /
        A.clamp(men / 9e3, 0.4, 2.5);
    if (P.sgBy !== rid) {
      P.sgBy = rid;
      P.sgd = 0;
    }
    P.sgd = (P.sgd || 0) + 1;
    P.sgNeed = need;
    for (const d of L) d.sieging = true;
    if (P.sgd >= need) {
      for (const d of L) d.sieging = false;
      A.occupy(P, rid);
      const pc = A.pc();
      if (
        pc &&
        pc.mil &&
        L.some(d => d.army === pc.mil.army) &&
        pc.mil.rank >= 7 &&
        L.some(d => {
          const a = A.army(d.army);
          return a && a.gen === pc.id;
        })
      ) {
        A.fame(pc, 2);
        A.trainSkill(pc, "siegecraft", 3);
      }
    }
  }
  // [X1 baked patch core/04-world-fixes WLD-SIEGE-OWNER] A siege belonged to whichever division was first in the
  // list, so when an allied division ended up first the progress reset to 0 (and the decay check used the same
  // test). The siege now stays with the realm already running it while it still has troops there, otherwise it goes
  // to the realm with the most men.
  for (const P of S.prov)
    if (P.sgBy && !(by[P.id] && by[P.id].some(d => d.r === P.sgBy))) {
      P.sgd = Math.max(0, (P.sgd || 0) - 2);
      if (!P.sgd) P.sgBy = null;
    }
};

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

A.wsCanCommand = function (pc, a) {
  return !pc || !a ? false : A.cmdRole(pc).armies.has(a.id);
};

A.wsCanDiv = function (pc, d, role) {
  return !pc || !d ? false : ((role = role || A.cmdRole(pc)), role.divs.has(d.id));
};

A.wsCommandable = function (pc) {
  const R2 = A.cmdRole(pc);
  return (A.S.armies || []).filter(a => R2.armies.has(a.id));
};

A.wsSetOrder = function (aid, k, arg) {
  const pc = A.pc(),
    a = A.army(aid);
  if (!A.wsCanCommand(pc, a))
    return {
      ok: false,
      msg: "That army does not answer to you.",
    };
  if (k === "obj") {
    a.order.obj = arg;
    if (a.order.k === "hold" || a.order.k === "front") a.order.k = "attack";
    for (const d of A.armyDivs(a)) d.manual = false;
    a.lastThink = -99;
    A.armyThink(a);
    return {
      ok: true,
      msg: `${a.name}: battle plan toward ${A.provName(arg)}. Divisions build up planning while they wait on the front, then strike.`,
    };
  }
  if (k === "enemy") {
    a.order.enemy = arg || null;
    A.armyThink(a);
    return {
      ok: true,
      msg: arg ? `${a.name} turns to face ${A.realmShort(arg)}.` : `${a.name} faces whichever enemy is nearest.`,
    };
  }
  a.order.k = k;
  if (k !== "attack") a.order.obj = k === "free" ? a.order.obj : null;
  for (const d of A.armyDivs(a)) {
    d.manual = false;
    d.post = null;
    if (k === "hold" && d.atk != null) {
      d.atk = null;
      d.path = [];
    }
  }
  A.armyThink(a);
  const T = {
    free: "the general picks targets himself",
    front: "it spreads along the front and digs in; it strikes only to free its own land",
    attack: "it holds the front, builds a plan, then strikes where the odds are best",
    hold: "every division stays where it is and digs in",
  };
  return {
    ok: true,
    msg: `${a.name}: ${T[k]}.`,
  };
};

A.wsDivOrder = function (did, dest) {
  const pc = A.pc(),
    d = A.divById(did);
  return A.wsCanDiv(pc, d)
    ? d.train > 30
      ? {
          ok: false,
          msg: "Still in training.",
        }
      : ((d.manual = true),
        A.wsOrderDiv(d, dest)
          ? {
              ok: true,
              msg:
                A.divsAt(dest).some(x => A.hostile(d.r, x.r)) && A.adjacent(d.loc, dest)
                  ? `${d.name} attacks ${A.provName(dest)}.`
                  : `${d.name} marches for ${A.provName(dest)} (${d.path.length} province${d.path.length > 1 ? "s" : ""}).`,
            }
          : {
              ok: false,
              msg: "No road leads there.",
            })
    : {
        ok: false,
        msg: "That division does not answer to you.",
      };
};

A.wsDivRaid = function (did) {
  const pc = A.pc(),
    d = A.divById(did);
  if (A.wsCanDiv(pc, d)) d.raid = !d.raid;
};

A.wsDivHold = function (did) {
  const pc = A.pc(),
    d = A.divById(did);
  if (A.wsCanDiv(pc, d)) {
    d.manual = true;
    d.path = [];
    d.atk = null;
  }
};

A.wsDivRejoin = function (did) {
  const d = A.divById(did);
  if (d) {
    d.manual = false;
    const a = A.army(d.army);
    if (a) A.armyThink(a);
  }
};

A.wsSetStance = function (aid, st) {
  return A.wsSetOrder(aid, st === "auto" ? "free" : st === "hold" ? "hold" : "front");
};

A.wsPlayerOrder = function (aid, dest) {
  return A.wsSetOrder(aid, "obj", dest);
};

A.wsSplit = function (aid) {
  const pc = A.pc(),
    a = A.army(aid);
  if (!A.wsCanCommand(pc, a) || a.divs.length < 2) return null;
  const half = a.divs.slice(Math.ceil(a.divs.length / 2)),
    b = A.wsNewArmy(a.realm, half, A.wsGeneralFor(a.realm));
  b.order = {
    k: "front",
    enemy: a.order.enemy,
    obj: null,
  };
  if (pc.mil && pc.mil.rank >= 8) b.sub = pc.id;
  A.armySync(a);
  return b;
};

A.wsMerge = function (aid) {
  const pc = A.pc(),
    a = A.army(aid);
  if (!A.wsCanCommand(pc, a)) return 0;
  let n = 0;
  for (const b of A.armiesOf(a.realm).filter(x => x !== a && A.wsCanCommand(pc, x)))
    if (!(a.divs.length + b.divs.length > 24)) {
      for (const id of b.divs) {
        const d = A.divById(id);
        if (d) d.army = a.id;
        a.divs.push(id);
      }
      b.divs = [];
      A.S.armies = A.S.armies.filter(x => x !== b);
      n++;
    }
  A.armySync(a);
  return n;
};

A.wsTransferDiv = function (did, aid) {
  const pc = A.pc(),
    d = A.divById(did),
    a = A.army(aid);
  if (!d || !a || d.r !== a.realm || !A.wsCanCommand(pc, a) || !A.wsCanDiv(pc, d) || a.divs.length >= 24) return false;
  const o = A.army(d.army);
  if (o) o.divs = o.divs.filter(x => x !== d.id);
  d.army = a.id;
  a.divs.push(d.id);
  d.manual = false;
  return true;
};

A.wsTroopsFor = function (rid) {
  const d = GD.DOCTRINE[rid] || GD.DOCTRINE[(A.realm(rid) || {}).parent] || GD.DOCTRINE.rebel;
  return [...new Set(d.filter(Boolean).concat(["LV", "SP", "GA"]))];
};

A.wsRecruit = function () {
  return {
    ok: false,
    msg: "New divisions are raised in the Manpower panel.",
  };
};

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

A.wrOpen = function (q) {
  for (const w of A.S.wars)
    if (!w.raised) {
      w.raised = true;
      A.wsRaise(w);
    }
  const pc = A.pc();
  if (pc && pc.ruler) A.F(A.realm(pc.ruler));
  A.wsAttachPC();
  q.opened = true;
};

A.wrClose = function () {
  const q = A.S.queue[0];
  if (q && q.type === "warroom") A.S.queue.shift();
};

A.wrAuto = function () {
  const S = A.S;
  A.wsRunDays(Math.max(0, 300 - (S.warClock || 0)));
  A.wrClose();
};

A.wsLeadBattle = function (key) {
  const S = A.S,
    pc = A.pc(),
    pid = +String(key).replace(/^F/, ""),
    F = (S.fights || {})[pid];
  if (!F || !pc) return false;
  const role = A.cmdRole(pc),
    ids = F.aIds
      .concat(F.dIds)
      .map(A.divById)
      .filter(Boolean)
      .filter(d => d.atk === pid || d.loc === pid),
    mine = ids.filter(d => role.divs.has(d.id) || (pc.mil && d.id === pc.mil.div));
  if (!mine.length) return false;
  const myR = mine[0].r,
    friends = ids.filter(d => !A.hostile(d.r, myR)),
    foes = ids.filter(d => A.hostile(d.r, myR));
  if (!foes.length) return false;
  // [X1 baked patch war/60-unit-drill DRILL-LEAD-DIVS] A.wsLeadBattle builds a line battle from the divisions in a
  // war-map fight but passes only their men. It now also passes the divisions (sideA.divs, sideB.divs), so the
  // battle's units carry the drill those divisions have (A.DRILL.side). A.newBattle does not keep them.
  const menA = friends.reduce((x, d) => x + d.men, 0),
    menB = foes.reduce((x, d) => x + d.men, 0),
    P = S.prov[pid],
    B = A.newBattle({
      title: "Battle of " + P.name,
      terr: P.terr,
      war: F.war,
      onEnd: {
        fn: "wsBattle",
        arg: "F" + pid,
      },
      sideA: {
        realm: myR,
        name: A.realmShort(myR),
        men: menA,
        divs: friends,
        q: (A.realm(myR) || {}).armyQ || 0.9,
        commander: pc.id,
      },
      sideB: {
        realm: foes[0].r,
        name: A.realmShort(foes[0].r),
        men: menB,
        divs: foes,
        q: (A.realm(foes[0].r) || {}).armyQ || 0.9,
        commander: (A.divGen(foes[0]) || {}).id || null,
      },
    });
  S.queue.unshift({
    type: "battle",
    b: B,
  });
  return true;
};

A.BATTLE_END = A.BATTLE_END || {};

A.BATTLE_END.wsBattle = function (B, key) {
  const S = A.S,
    pid = +String(key).replace(/^F/, ""),
    F = (S.fights || {})[pid];
  if (!F) return;
  const ids = F.aIds
      .concat(F.dIds)
      .map(A.divById)
      .filter(Boolean)
      .filter(d => d.atk === pid || d.loc === pid),
    myR = B.sides[B.pcSide].realm,
    mine = ids.filter(d => !A.hostile(d.r, myR)),
    foes = ids.filter(d => A.hostile(d.r, myR)),
    share = (list, dead) => {
      const tot = list.reduce((x, d) => x + d.men, 0) || 1;
      for (const d of list) A.divLose(d, Math.round((dead * d.men) / tot));
    };
  share(mine, B.dead[B.pcSide]);
  share(foes, B.dead[B.pcSide === "A" ? "B" : "A"]);
  const lose = list => {
    for (const d of list) d.org = Math.min(d.org, 0.5);
  };
  if (B.winner === B.pcSide) lose(foes);
  else if (B.winner && B.winner !== "draw") lose(mine);
  else for (const d of ids) d.org = Math.max(1, d.org * 0.6);
  A.fightDay(pid);
};

A.TROOP_CAT = {
  SP: "foot",
  PK: "foot",
  HI: "foot",
  AX: "foot",
  LI: "foot",
  GA: "foot",
  LV: "foot",
  MR: "foot",
  OR: "foot",
  GI: "foot",
  XB: "missile",
  LB: "missile",
  AR: "missile",
  EA: "missile",
  SL: "missile",
  HC: "horse",
  MC: "horse",
  LC: "horse",
  HA: "horse",
  CM: "horse",
  EL: "horse",
};

A.CAT_NAME = {
  foot: "Foot",
  missile: "Archer",
  horse: "Horse",
};

A.ECH = [
  {
    k: "army",
    name: "Army",
    size: 12800,
    rank: 7,
    sym: "XXXX",
  },
  {
    k: "div",
    name: "Division",
    size: 3200,
    rank: 6,
    sym: "XX",
  },
  {
    k: "bat",
    name: "Battalion",
    size: 800,
    rank: 5,
    sym: "II",
  },
  {
    k: "coy",
    name: "Company",
    size: 200,
    rank: 4,
    sym: "I",
  },
  {
    k: "sqd",
    name: "Squad",
    size: 40,
    rank: 2,
    sym: "•••",
  },
];

A.hash = function (s) {
  let h = 2166136261;
  s = String(s);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

A.hpick = (arr, key) => (arr.length ? arr[A.hash(key) % arr.length] : null);

A.catOf = code => A.TROOP_CAT[code] || "foot";

A.mainCat = comp => {
  const t = {
    foot: 0,
    missile: 0,
    horse: 0,
  };
  for (const c in comp) t[A.catOf(c)] += comp[c];
  return Object.keys(t).sort((a, b) => t[b] - t[a])[0];
};

A.oobLeader = function (rid, key, rank) {
  const r = A.realm(rid) || {},
    cul = (LORE.cultures && LORE.cultures[r.cult]) ||
      (LORE.cultures && Object.values(LORE.cultures)[0]) || {
        m: ["Aren"],
        f: ["Ama"],
      },
    fem = A.hash(key + "sex") % 5 === 0,
    given = A.hpick(fem ? cul.f : cul.m, key) || "Aren",
    provs = A.S ? A.S.prov.filter(p => p.orig === rid) : [],
    from = provs.length ? A.hpick(provs, key + "p").name : r.capital || "the capital";
  return {
    name: `${given} of ${from}`,
    rank,
    title: GD.MIL[rank] ? GD.MIL[rank].title : "",
  };
};

const split = (n, k) => {
  const out = [];
  let left = n;
  for (let i = 0; i < k; i++) {
    const v = Math.round(left / (k - i));
    out.push(v);
    left -= v;
  }
  return out;
};

A.oobDivNode = function (d, key) {
  const s = A.divS(d),
    t = A.tplOf(d),
    comp = {},
    f = d.men / Math.max(1, s.men);
  if (t) for (const c of t.bns) comp[c] = (comp[c] || 0) + Math.round(GD.BN[c].men * f);
  const g = d.cmd ? A.P(d.cmd) : null;
  return {
    key,
    ech: 1,
    name: d.name,
    men: d.men,
    comp,
    cat: s.main === "missile" ? "missile" : s.main,
    realm: d.r,
    divId: d.id,
    tpl: d.tpl,
    leader: g
      ? {
          name: A.fullName(g, false),
          rank: 6,
          title: "Commander",
          pid: g.id,
        }
      : A.oobLeader(d.r, key, 6),
  };
};

A.oobRoot = function (a) {
  const ds = a.divList || A.armyDivs(a),
    comp = {};
  let men = 0;
  for (const d of ds) {
    men += d.men;
    const n = A.oobDivNode(d, "");
    for (const c in n.comp) comp[c] = (comp[c] || 0) + n.comp[c];
  }
  const g = a.gen ? A.P(a.gen) : null;
  return {
    key: "A:" + a.id,
    ech: 0,
    name: a.name,
    men,
    comp,
    cat: A.mainCat(comp),
    realm: a.realm,
    armyId: a.id,
    divList: ds,
    leader: g
      ? {
          name: A.fullName(g, false),
          rank: g.id === A.S.pc && g.mil ? g.mil.rank : 7,
          title: g.id === A.S.pc && g.mil ? GD.MIL[g.mil.rank].title : "General",
          pid: g.id,
        }
      : A.oobLeader(a.realm, "A:" + a.id, 7),
  };
};

A.oobNotional = function (rid) {
  const r = A.realm(rid);
  return r
    ? (A.F(r),
      A.oobRoot({
        id: "N" + rid,
        name: `The Standing Army of ${r.short.replace(/^the /i, "")}`,
        realm: rid,
        divList: r.forces.divs.slice(),
        gen: null,
      }))
    : null;
};

A.oobKids = function (n) {
  if (n.kids) return n.kids;
  const kids = [];
  if (n.ech === 0) for (const d of n.divList || []) kids.push(A.oobDivNode(d, n.key + "/" + d.id));
  else if (n.ech === 1) {
    const d = A.divById(n.divId),
      t = d ? A.tplOf(d) : null,
      f = d ? d.men / Math.max(1, A.divS(d).men) : 1,
      seen = {};
    if (
      ((t ? t.bns : Object.keys(n.comp)).forEach((c, i) => {
        seen[c] = (seen[c] || 0) + 1;
        const men = Math.round((GD.BN[c] ? GD.BN[c].men : 800) * f);
        if (men <= 0) return;
        const key = n.key + "/B" + (i + 1);
        kids.push({
          key,
          ech: 2,
          name: `${A.ordinal(seen[c])} ${GD.TROOPS[c] ? GD.TROOPS[c].name : c} Battalion`,
          men,
          comp: {
            [c]: men,
          },
          cat: A.catOf(c),
          troop: c,
          realm: n.realm,
          leader: A.oobLeader(n.realm, key, 5),
        });
      }),
      t)
    )
      for (const sk of t.sup) {
        const U = GD.SUP[sk];
        if (!U) continue;
        const key = n.key + "/S" + sk;
        kids.push({
          key,
          ech: 3,
          name: U.name,
          men: Math.round(U.men * f),
          comp: {},
          cat: "foot",
          troop: null,
          support: sk,
          realm: n.realm,
          leader: A.oobLeader(n.realm, key, 4),
        });
      }
  } else if (n.ech === 2) {
    const k = Math.max(1, Math.round(n.men / 210)),
      L = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    split(n.men, k).forEach((v, i) => {
      const key = n.key + "/C" + (i + 1);
      kids.push({
        key,
        ech: 3,
        name: `${i < 26 ? L[i] : L[Math.floor(i / 26) - 1] + L[i % 26]} Company`,
        men: v,
        comp: {
          [n.troop]: v,
        },
        cat: n.cat,
        troop: n.troop,
        realm: n.realm,
        leader: A.oobLeader(n.realm, key, 4),
      });
    });
  } else if (n.ech === 3 && !n.support) {
    const k = Math.max(1, Math.round(n.men / 40));
    split(n.men, k).forEach((v, i) => {
      const key = n.key + "/S" + (i + 1);
      kids.push({
        key,
        ech: 4,
        name: `${A.ordinal(i + 1)} Squad`,
        men: v,
        comp: {
          [n.troop]: v,
        },
        cat: n.cat,
        troop: n.troop,
        realm: n.realm,
        leader: A.oobLeader(n.realm, key, 2),
      });
    });
  }
  n.kids = kids;
  return kids;
};

A.oobEchFor = rank => (rank >= 7 ? 0 : rank === 6 ? 1 : rank === 5 ? 2 : rank >= 3 ? 3 : 4);

A.oobArmyOf = function (pc) {
  if (!pc || !pc.mil) return null;
  const a = pc.mil.army && A.army ? A.army(pc.mil.army) : null;
  return a ? A.oobRoot(a) : pc.mil.merc ? null : A.oobNotional(pc.mil.realm);
};

A.oobPath = function (pc, root) {
  if (!pc || !pc.mil || !root) return [];
  const rank = pc.mil.rank,
    myE = A.oobEchFor(rank),
    path = [root];
  let n = root;
  const prefer = pc.mil.troop;
  for (let e = 1; e <= myE; e++) {
    const kids = A.oobKids(n);
    if (!kids.length) break;
    let pool = kids;
    if (e === 1) {
      const own = kids.filter(k => k.divId && k.divId === pc.mil.div),
        c = A.catOf(prefer),
        p2 = kids.filter(k => k.cat === c);
      if (own.length) pool = own;
      else {
        if (p2.length) pool = p2;
      }
    }
    if (e === 3) {
      const p3 = kids.filter(k => !k.support);
      if (p3.length) pool = p3;
    }
    if (e === 2) {
      const p2 = kids.filter(k => k.troop === prefer);
      if (p2.length) pool = p2;
      else {
        const p4 = kids.filter(k => k.troop);
        if (p4.length) pool = p4;
      }
    }
    n = pool[A.hash(pc.id + root.key + e) % pool.length];
    path.push(n);
  }
  const sup = A.superior ? A.superior(pc) : null,
    me = path[path.length - 1],
    asLeader = rank >= 2 && rank !== 3;
  if (asLeader) {
    me.leader = {
      name: A.fullName(pc, false),
      rank,
      title: GD.MIL[rank].title,
      pid: pc.id,
      you: true,
    };
    me.you = "lead";
  } else me.you = rank === 3 ? "second" : "member";
  const supAt = asLeader ? path.length - 2 : path.length - 1;
  if (sup && supAt >= 0 && !(supAt === 0 && path[0].leader.pid))
    path[supAt].leader = {
      name: A.fullName(sup, false),
      rank: sup.milRank != null ? sup.milRank : A.ECH[supAt].rank,
      title: A.superiorTitle ? A.superiorTitle(pc) : "",
      pid: sup.id,
      boss: true,
    };
  for (const x of path) x.onPath = true;
  return path;
};

A.COUNCIL = {
  chancellor: {
    name: "Chancellor",
    skill: "diplomacy",
    desc: "Treaties, envoys, the realm's voice abroad.",
  },
  marshal: {
    name: "Marshal",
    skill: "command",
    desc: "The host: drill, levies, war plans.",
  },
  treasurer: {
    name: "Treasurer",
    skill: "stewardship",
    desc: "Taxes, tolls, mints and the banks.",
  },
  spymaster: {
    name: "Spymaster",
    skill: "intrigue",
    desc: "Whispers, ciphers, knives in the dark.",
  },
  chaplain: {
    name: "Chaplain",
    skill: "faith",
    desc: "The faith's goodwill, the people's hearts.",
  },
};

A.TAX = {
  0.6: ["Light", 3],
  0.85: ["Fair", 1],
  1: ["Customary", 0],
  1.2: ["Heavy", -4],
  1.5: ["Crushing", -9],
};

A.BUILDINGS = {
  farms: {
    name: "Drain fields & mills",
    cost: 3e3,
    dev: 1,
    income: 0.03,
    stab: 0,
    desc: "More grain, more people, more taxes.",
  },
  market: {
    name: "Market charter & road",
    cost: 4e3,
    dev: 1,
    income: 0.05,
    stab: 1,
    desc: "Trade, tolls and a fair every May.",
  },
  walls: {
    name: "Stone walls",
    cost: 8e3,
    fort: 1,
    desc: "A siege needs months, not weeks.",
  },
  temple: {
    name: "Temple & school",
    cost: 3500,
    dev: 0,
    income: 0,
    stab: 3,
    piety: 2,
    desc: "The faith looks kindly on you. Children learn letters.",
  },
  barracks: {
    name: "Barracks & drill yard",
    cost: 5e3,
    armyQ: 0.02,
    desc: "Better soldiers, steadier lines.",
  },
  port: {
    name: "Harbor & quays",
    cost: 6e3,
    income: 0.06,
    coastOnly: true,
    desc: "Ships, fish, customs.",
  },
};

A.myRealm = () => {
  const pc = A.pc();
  return pc && pc.ruler ? A.realm(pc.ruler) : null;
};

A.rulerYear = function (pc) {
  if (!pc.ruler) return;
  const r = A.realm(pc.ruler);
  if (!r || !r.alive || r.ruler !== pc.id) {
    pc.ruler = null;
    return;
  }
  r.playerRun = true;
  pc.wasRuler = true;
  A.ach("ruler");
  r.council = r.council || {};
  const cs = k => {
    const p = A.P(r.council[k]);
    return p && p.alive ? A.skill(p, A.COUNCIL[k].skill) : k === "marshal" ? A.skill(pc, "command") * 0.5 : 10;
  };
  for (const k in r.council) {
    const p = A.P(r.council[k]);
    if (!p || !p.alive) {
      delete r.council[k];
      A.log(`Your ${A.COUNCIL[k].name.toLowerCase()} is dead. The seat is empty.`, "warn");
    }
  }
  const tax = r.laws.tax || 1,
    stabMul = 0.6 + r.stability / 250,
    inc = Math.round(r.income * stabMul * (1 + cs("treasurer") / 400)),
    upkeep = Math.round(r.army * 3.2 + r.levy * 0.05),
    interest = Math.round(r.debt * 0.09),
    court = Math.round(A.LIFESTYLE[pc.lifestyle || "lavish"].cost * 2),
    bld = Object.values(r.bldUpkeep || {}).reduce((a, b) => a + b, 0);
  r.lastBudget = {
    inc,
    upkeep,
    interest,
    court,
    bld,
  };
  r.treasury += inc - upkeep - interest - court - bld;
  pc.coin += Math.round(inc * 0.02);
  // [X1 baked patch core/04-world-fixes WLD-STABILITY-FLOOR] Five places lowered realm stability with no floor
  // (capital lost -15, a coup -15, bankruptcy -4, empty treasury -6, a raging faction -10), so readers inside the
  // year (prices, industry, factions) could see negative stability.
  if (r.treasury < 0) {
    r.stability = Math.max(0, r.stability - 6);
    A.log(`The treasury of ${r.short} is empty. Soldiers and servants go unpaid.`, "bad");
    if (r.treasury < -inc) {
      r.debt += -r.treasury;
      r.treasury = 0;
      A.log("You are forced to borrow from the banks to cover the hole.", "bad");
    }
  }
  let ds =
    (A.TAX[tax] || ["", 0])[1] +
    (cs("chaplain") - 30) / 25 -
    r.exhaustion / 20 -
    (r.debt > r.income * 2 ? 4 : 0) +
    (r.legit - 50) / 25;
  if (A.atWar(r.id).length) ds -= 2;
  r.stability = A.clamp(r.stability + ds + A.ri(-3, 3), 0, 100);
  r.legit = A.clamp(r.legit + 2 + (pc.fame - 40) / 30, 0, 100);
  r.exhaustion = Math.max(0, r.exhaustion - (A.atWar(r.id).length ? 0 : 12));
  r.armyQ = A.clamp(r.armyQ + (cs("marshal") - 40) / 2e3 + (r.drill === A.S.year ? 0.04 : 0) - 0.005, 0.5, 1.6);
  A.vassalYear(pc, r);
  A.pickHeir(r);
  if (r.stability < 15 && A.chance(0.35))
    A.queue({
      type: "event",
      ev: "ruler_revolt",
    });
  // [X1 baked patch events/97-first-life-fixes LF-RULER-PICK] A.rulerYear picked one of twelve scenes of a ruler's
  // year (a petition, an embassy, a famine...) blind to what the reign had seen. It now picks by the life memory
  // (A.lfPickIds); a scene held back is dropped at the head of the queue and refilled.
  if (A.chance(0.7))
    A.queue({
      type: "event",
      ev: (A.lfPickIds || A.pick)([
        "ruler_petition",
        "ruler_embassy",
        "ruler_famine",
        "ruler_plot",
        "ruler_feast",
        "ruler_heresy",
        "ruler_bandits",
        "ruler_bank",
        "ruler_marriage_offer",
        "ruler_border",
        "ruler_plague",
        "ruler_champion",
      ]),
    });
};

A.vassalYear = function (pc, r) {
  const vs = Object.values(A.S.houses).filter(h => h.realm === r.id && h.kind !== "royal" && !h.extinct);
  for (const h of vs)
    if (
      ((h.op = A.clamp(
        (h.op != null ? h.op : 50) + A.ri(-4, 3) + (r.stability - 50) / 30 + ((r.laws.tax || 1) > 1 ? -2 : 1),
        0,
        100,
      )),
      h.op < 12 && r.stability < 45 && A.chance(0.15) && !A.S.wars.some(w => w.cb === "throne" && w.def.includes(r.id)))
    ) {
      const head = A.houseHead(h.id);
      if (head && head.alive) {
        A.log(`${h.name} rises against you! ${A.fullName(head)} claims your crown.`, "war");
        A.successionWar(r, head);
        break;
      }
    }
};
