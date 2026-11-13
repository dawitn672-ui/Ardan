// The release's core, companies and war staff (part 2 of 2): Free companies, seizing land, battle ends, armies and the war staff's raising and mobilising.
// Readable source of vendor/ardan-b593143.html with the patch layer baked in (X1, docs/DECISIONS.md D-028). Edit it here.
// Defines: A.emergencyLevy, A.disbandDiv, A.TPL_XP, A.tplEdit, A.provLocalSupply, A.supplyNeighbours, A.supplyBase,
// A.sameArr, A.supScratch, A.supplyMap, A.supplyRoute, A.supplyInfo, A.divSupUse, A.forcesYear, A.forcesAI,
// A.cmdRole, A.lineSet, A.fxAct, A.setStance, A.WS, A.armyDivs, A.armyMen, A.armiesOf, A.army, A.armiesAt, A.divsAt,
// A.hostile, A.friendly, A.relAll, A.relSig, A.relMemo, A.wsDist, A.wsPath, A.adjacent, A.ARMY_NAMES, A.wsNewArmy,
// A.wsGeneralFor, A.armySync, A.wsRaise, A.wsMobilize, wsMobilizeNow.

A.emergencyLevy = function (r) {
  const F = r.forces,
    L0 = LORE.realms[r.id],
    base = ((L0 ? L0.army : r.army0 || r.army || 2e3) * (r.provPop || 1)) / (r.basePop || 1);
  if (r.army >= base * 0.35 || r.levy < 1500) return;
  let t = Object.values(F.tpl).find(x => x.kind === "garrison");
  if (!t) {
    const lv = A.wsTroopsFor(r.id).includes("LV") ? "LV" : "SP";
    t = A.tplAdd(r, {
      name: "Levy Host",
      bns: Array(6).fill(lv),
      sup: [],
      kind: "garrison",
      share: 0.01,
    });
  }
  const s = A.tplS(r.id, t.id),
    ps = A.realmProvs(r.id).filter(p => !p.occ),
    loc = r.capitalProv != null && !A.S.prov[r.capitalProv].occ ? r.capitalProv : (ps[0] || {}).id;
  if (loc == null) return;
  const n = Math.min(3, Math.floor(r.levy / s.men));
  for (let i = 0; i < n; i++) {
    const d = A.newDiv(r, t.id, loc, {
      str: 1,
      exp: 4,
      eqf: 0,
      org: 0.7,
    });
    r.levy -= d.men;
    for (const k in s.eq) {
      const take = Math.min(s.eq[k], Math.floor(r.ind.stock[k] || 0));
      d.eq[k] = take;
      r.ind.stock[k] -= take;
    }
    // [X1 baked patch events/994-careers CAR-LEVY-LOG] Calling out a realm's levies logged one line per division ("the
    // 92nd ... gathers", "the 93rd ... gathers"), a dozen in one autumn. It now logs one line per realm a month, with
    // the count (A.levyLog).
    const pc = A.pc();
    if (pc && (pc.realm === r.id || pc.ruler === r.id)) {
      if (A.levyLog) A.levyLog(r, d, loc);
      else A.log(`${r.short} calls out the levies: the ${d.name} gathers at ${A.provName(loc)}.`, "war");
    }
  }
  if (n) A.news(`${r.short} calls out its levies.`, "war");
  A.forcesSync(r);
};

A.disbandDiv = function (d) {
  if (d && d.elite) {
    const r0 = A.realm(d.r),
      alt = r0 && r0.forces ? r0.forces.divs.filter(x => !x.elite && x !== d).sort((a, b) => a.men - b.men)[0] : null;
    return alt ? A.disbandDiv(alt) : null;
  }
  const r = A.realm(d.r);
  if (r) {
    r.levy += Math.round(d.men * 0.8);
    A.divRemove(d);
    A.forcesSync(r);
  }
};

A.TPL_XP = 10;

A.tplEdit = function (r, tid, bns, sup, name) {
  const F = r.forces,
    t = F.tpl[tid];
  if (
    ((bns = (bns || []).filter(c => GD.BN[c]).slice(0, GD.TPL_MAX_BN)),
    (sup = [...new Set((sup || []).filter(s => GD.SUP[s]))].slice(0, GD.TPL_MAX_SUP)),
    !bns.length)
  )
    return {
      ok: false,
      msg: "A division needs at least one battalion.",
    };
  const ok = A.wsTroopsFor(r.id),
    bad = bns.find(c => !ok.includes(c));
  if (bad)
    return {
      ok: false,
      msg: `${r.short} cannot raise ${GD.TROOPS[bad].name}.`,
    };
  const changes = t
      ? Math.abs(bns.length - t.bns.length) +
        bns.filter((c, i) => t.bns[i] !== c).length +
        sup.filter(s => !t.sup.includes(s)).length +
        t.sup.filter(s => !sup.includes(s)).length
      : 4,
    cost = Math.max(t ? 2 : 10, Math.round(changes * 2.5));
  if (F.xp < cost)
    return {
      ok: false,
      msg: `Needs ${cost} army experience; the realm has ${Math.floor(F.xp)}. Battles and drills earn more.`,
    };
  if (((F.xp -= cost), !t)) {
    const n = A.tplAdd(r, {
      name: name || "New Division",
      bns,
      sup,
    });
    n.kind = A.tplKindOf(A.tplStats(n, r.id));
    return {
      ok: true,
      msg: `Template "${n.name}" created (−${cost} experience).`,
      id: n.id,
    };
  }
  t.bns = bns;
  t.sup = sup;
  if (name) t.name = name;
  t.v = (t.v || 1) + 1;
  t.kind = A.tplKindOf(A.tplStats(t, r.id));
  return {
    ok: true,
    msg: `"${t.name}" redesigned (−${cost} experience). Its divisions refit as men and kit arrive.`,
  };
};

A.provLocalSupply = function (P) {
  return 0.3 + Math.min(2.5, P.pop / 12e4) + (P.dev || 0) * 0.12 + (P.road ? 0.5 : 0);
};

A.supplyNeighbours = function () {
  const S = A.S;
  if (A._nbs && A._nbs.prov === S.prov) return A._nbs;
  const w = [],
    s = [];
  for (const P of S.prov) {
    const nb = P.adj.concat(P.sea || []);
    w.push(Int32Array.from(nb));
    s.push(Float64Array.from(nb.map(x => ((P.sea || []).includes(x) && !P.adj.includes(x) ? 0.85 : 1))));
  }
  A._nbs = {
    prov: S.prov,
    w,
    s,
  };
  return A._nbs;
};

A.supplyBase = function () {
  const S = A.S,
    N = S.prov.length,
    b = new Float64Array(N),
    road = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const P = S.prov[i];
    b[i] = A.provLocalSupply(P) * (A.wsWinter(P) ? 0.6 : 1) * (P.terr === "desert" ? 0.7 : 1);
    road[i] = P.road ? 1 : 0;
  }
  return {
    b,
    road,
  };
};

A.sameArr = (x, y) => {
  if (x.length !== y.length) return false;
  for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return false;
  return true;
};

A.supScratch = {
  n: 0,
};

A.supplyMap = function (rid) {
  const S = A.S;
  if (S._sup) delete S._sup;
  A._sup = A._sup || {};
  const key = (S.warClock || 0) + "|" + S.year + "|" + S.prov.length + "|" + (S.seed || 0),
    c = A._sup[rid];
  if (c && c.key === key) return c.v;
  const N = S.prov.length,
    X = A.supScratch;
  if (X.n !== N) {
    X.n = N;
    X.fr = new Uint8Array(N);
    X.zoc = new Uint8Array(N);
    X.raid = new Uint8Array(N);
    X.flow = new Float32Array(N);
    X.hk = new Float64Array(256);
    X.hv = new Int32Array(256);
  }
  const fr = X.fr,
    zoc = X.zoc,
    raid = X.raid;
  zoc.fill(0);
  raid.fill(0);
  const me = A.realm(rid),
    acc = id => !!(me && me.tr && me.tr.access && me.tr.access[id] > S.year),
    R2 = A.relMemo(rid),
    code = new Map(),
    codeOf = o => {
      let c2 = code.get(o);
      if (c2 === void 0) {
        c2 = R2.fr(o) ? 1 : R2.ho(o) ? 2 : acc(o) ? 3 : 0;
        code.set(o, c2);
      }
      return c2;
    };
  // [X1 baked patch core/09-engine-at-scale SCALE-SUPPLY-CTRL] A.supplyMap worked out who controls each province
  // (A.ctrl, then a Map lookup) for every province of the map, once for every realm at war, every day. Inside
  // A.wsSupplyDay nothing changes hands, so 09-engine-at-scale works out the controllers once per day and gives each
  // realm its codes per controller (A.scaleFr), the same codes in the same places. Outside that batch, or with
  // A.SCALE_OFF, the original loop runs.
  if (!(A.scaleFr && A.scaleFr(fr, N, codeOf, rid))) for (let i = 0; i < N; i++) fr[i] = codeOf(A.ctrl(S.prov[i]));
  const fights = S.fights || {};
  for (const d of A._relAll ? A._supDivs || (A._supDivs = A.allDivs().filter(x => x.army)) : A.allDivs()) {
    if (!d.army || (codeOf(d.r) !== 2 && !R2.ho(d.r))) continue;
    const P = S.prov[d.loc];
    if (P) {
      zoc[d.loc] = 2;
      for (const j of P.adj) if (zoc[j] < 1) zoc[j] = 1;
      if (d.raid || (codeOf(A.ctrl(P)) === 1 && !fights[d.loc] && A.divS(d).main === "horse")) {
        raid[d.loc] = 1;
        for (const j of P.adj) raid[j] = 1;
      }
    }
  }
  const hubs = [];
  for (const id in S.realms) {
    const r = S.realms[id];
    if (!(!r.alive || r.capitalProv == null) && (id === rid || R2.fr(id))) {
      const P = S.prov[r.capitalProv];
      if (P && fr[P.id] === 1) hubs.push([P.id, id === rid ? 6 : 3.5]);
    }
  }
  for (const P of A._relAll ? A._supDepots || (A._supDepots = S.prov.filter(q => q.depot)) : S.prov)
    if (P.depot && fr[P.id] === 1 && (P.owner === rid || R2.fr(P.owner))) hubs.push([P.id, 3.5]);
  const B = A._relAll ? A._supBase || (A._supBase = A.supplyBase()) : A.supplyBase();
  let hubKey = "";
  for (const h of hubs) hubKey += h[0] + ":" + h[1] + ",";
  const prev = (A._supIn || {})[rid];
  if (
    prev &&
    prev.prov === S.prov &&
    prev.hubKey === hubKey &&
    A.sameArr(prev.fr, fr) &&
    A.sameArr(prev.zoc, zoc) &&
    A.sameArr(prev.raid, raid) &&
    A.sameArr(prev.road, B.road) &&
    A.sameArr(prev.base, B.b)
  ) {
    A._sup[rid] = Object.assign({}, prev.out, {
      key,
    });
    return prev.out.v;
  }
  const flow = X.flow;
  flow.fill(0);
  const v = new Float32Array(N),
    par = new Int32Array(N).fill(-1),
    hub = new Int32Array(N).fill(-1);
  let hk = X.hk,
    hv = X.hv,
    hn = 0,
    popF = 0;
  const swap = (x, y) => {
      const tk = hk[x];
      hk[x] = hk[y];
      hk[y] = tk;
      const tv = hv[x];
      hv[x] = hv[y];
      hv[y] = tv;
    },
    push = (f, u) => {
      if (hn === hk.length) {
        const k2 = new Float64Array(hn * 2);
        k2.set(hk);
        hk = X.hk = k2;
        const v2 = new Int32Array(hn * 2);
        v2.set(hv);
        hv = X.hv = v2;
      }
      let i = hn++;
      for (hk[i] = f, hv[i] = u; i > 0; ) {
        const q = (i - 1) >> 1;
        if (hk[q] >= hk[i]) break;
        swap(q, i);
        i = q;
      }
    },
    pop = () => {
      const top = hv[0];
      if (((popF = hk[0]), hn--, hn > 0)) {
        hk[0] = hk[hn];
        hv[0] = hv[hn];
        let i = 0;
        for (;;) {
          const l = 2 * i + 1,
            r = l + 1;
          let m = i;
          if ((l < hn && hk[l] > hk[m] && (m = l), r < hn && hk[r] > hk[m] && (m = r), m === i)) break;
          swap(m, i);
          i = m;
        }
      }
      return top;
    },
    NB = A.supplyNeighbours();
  for (const [h, pw] of hubs)
    if (pw > flow[h]) {
      flow[h] = pw;
      hub[h] = h;
      par[h] = -1;
      push(pw, h);
    }
  for (; hn; ) {
    const u = pop(),
      f = popF;
    if (f < flow[u] - 1e-6 || f < 0.05 || (fr[u] !== 1 && fr[u] !== 3)) continue;
    const P = S.prov[u],
      nw = NB.w[u],
      ns = NB.s[u];
    for (let k = 0; k < nw.length; k++) {
      const w = nw[k],
        Q = S.prov[w];
      let g = f * (P.road && Q.road ? 0.86 : 0.78) * ns[k];
      if (zoc[w] === 2) g *= 0.35;
      else {
        if (zoc[w] === 1) g *= 0.6;
      }
      if (raid[w]) g *= 0.55;
      if (fr[w] === 0) g *= 0.4;
      if (g > flow[w] + 1e-6) {
        flow[w] = g;
        par[w] = u;
        hub[w] = hub[u];
        push(g, w);
      }
    }
  }
  const base = B.b;
  for (let i = 0; i < N; i++) {
    const loc = base[i] * (raid[i] ? 0.6 : 1);
    v[i] =
      fr[i] === 1 || fr[i] === 3 ? loc + flow[i] : fr[i] === 2 ? loc * 0.4 + flow[i] * 0.5 : loc * 0.6 + flow[i] * 0.4;
  }
  const keep = {
    fr: fr.slice(),
    zoc: zoc.slice(),
    raid: raid.slice(),
  };
  A._sup[rid] = {
    key,
    v,
    par,
    hub,
    zoc: keep.zoc,
    raid: keep.raid,
  };
  (A._supIn = A._supIn || {})[rid] = {
    prov: S.prov,
    hubKey,
    fr: keep.fr,
    zoc: keep.zoc,
    raid: keep.raid,
    road: B.road,
    base: B.b,
    out: A._sup[rid],
  };
  return v;
};

A.supplyRoute = function (rid, pid) {
  A.supplyMap(rid);
  const c = A._sup[rid];
  if (!c || !c.par) return [];
  const out = [];
  let u = pid,
    g = 0;
  for (; u >= 0 && g++ < 60; ) {
    out.unshift(u);
    u = c.par[u];
  }
  return out;
};

A.supplyInfo = function (rid, pid) {
  A.supplyMap(rid);
  const c = A._sup[rid];
  return c
    ? {
        v: c.v[pid],
        zoc: c.zoc[pid],
        raid: c.raid[pid],
        hub: c.hub[pid],
      }
    : null;
};

A.divSupUse = d => A.divS(d).sup * (0.4 + 0.6 * Math.min(1, A.divStr(d)));

A.forcesYear = function (r) {
  if (!r.alive) return;
  A.F(r);
  A.forcesReconcile(r);
  const I = r.ind;
  for (; (I.mDone || 0) < 12; ) A.indMonth(r);
  I.mDone = 0;
  I.hist = (I.hist || [])
    .concat([
      {
        y: A.S.year,
        out: I.out,
        army: r.army,
        levy: r.levy,
        divs: r.forces.divs.length,
      },
    ])
    .slice(-12);
  I.lastOut = I.out;
  I.out = {};
  I.lastSold = I.sold || 0;
  I.sold = 0;
  {
    const need = A.eqNeed(r);
    for (const k of GD.EQ_KEYS) {
      const cap2 = (need.full[k] || 0) * 1.2 + 200;
      if (I.stock[k] > cap2) I.stock[k] = Math.round(cap2 + (I.stock[k] - cap2) * 0.6);
    }
  }
  if (!A.atWar(r.id).length)
    for (const d of r.forces.divs) {
      for (const k in d.eq) d.eq[k] = Math.round(d.eq[k] * 0.985);
      if (d.exp > 30) d.exp -= (d.exp - 30) * 0.12;
    }
  const law = GD.ECON[I.law] || GD.ECON.partial;
  r.stability = A.clamp(r.stability + law.stab, 0, 100);
  if (law.needExh && !A.atWar(r.id).length) I.law = "war";
  if (law.war && !A.atWar(r.id).length && A.chance(0.5) && !(A.myRealm && A.myRealm() === r)) I.law = "partial";
  const L0 = LORE.realms[r.id],
    lawMul = A.LEVY && r.laws && r.laws.levy != null ? A.LEVY[r.laws.levy][1] : 1,
    cap =
      (((L0 ? L0.levy : r.levy0 || (r.levy0 = Math.max(r.levy, r.army * 3))) * (r.provPop || 1)) / (r.basePop || 1)) *
      lawMul;
  r.levyCap = Math.round(cap * (1 + (A.rdoc(r).mp || 0)));
  r.levy = Math.round(r.levy + (r.levyCap - r.levy) * (r.levy < r.levyCap ? 0.2 : 0.1));
  r.forces.xp = Math.min(200, r.forces.xp + 2 + r.forces.divs.length * 0.15);
  const pc = A.pc();
  if (((pc && pc.ruler === r.id && !r.forces.auto) || A.forcesAI(r), !A.atWar(r.id).length)) {
    const sp = A.garrisonSpots(r);
    r.forces.divs.forEach((d, i) => {
      const P = A.S.prov[d.loc];
      if (!P || P.owner !== r.id || A.chance(0.15)) d.loc = sp.length ? sp[i % sp.length] : d.loc;
      d.path = [];
      d.prog = 0;
      d.atk = null;
      d.army = null;
      d.org = A.divMaxOrg(d);
      d.dig = 0;
    });
    A.locDirty();
  }
  A.forcesSync(r);
};

A.forcesAI = function (r) {
  const I = r.ind,
    F = r.forces,
    war = A.atWar(r.id).length > 0,
    isPlayer = A.myRealm && A.myRealm() === r;
  if (
    ((!isPlayer || F.auto) &&
      (I.law = war
        ? r.exhaustion > 55 && A.realmProvs(r.id).some(p => p.occ)
          ? "total"
          : "war"
        : r.stability < 35
          ? "civilian"
          : "partial"),
    A.indAutoLines(r),
    I.cq.length < 3)
  ) {
    const ps = A.realmProvs(r.id).filter(p => !p.occ),
      free = ps
        .filter(p => A.provUsed(p) + I.cq.filter(q => q.prov === p.id && GD.BUILD[q.k].slot).length < A.provSlots(p))
        .sort((a, b) => b.pop - a.pop),
      roll = A.rand();
    if (free.length && roll < (war ? 0.75 : 0.65))
      A.indQueue(r, war || I.mil < I.civ * 0.4 ? "forge" : roll < 0.45 ? "workshop" : "forge", free[0].id);
    else if (ps.length) {
      const border = ps.filter(p2 =>
          p2.adj.some(j => {
            const o = A.S.prov[j].owner;
            return o !== r.id && o !== "unclaimed" && (r.rivals || []).includes(o);
          }),
        ),
        p = A.pick(border.length ? border : ps);
      if (A.chance(0.5) && (p.fort || 0) < 4) A.indQueue(r, "walls", p.id);
      else {
        if (p.depot) {
          if (!p.road) A.indQueue(r, "road", p.id);
        } else A.indQueue(r, "depot", p.id);
      }
    }
  }
  const L = LORE.realms[r.id],
    base = (((L ? L.army : r.army0 || r.army) * (r.provPop || 1)) / (r.basePop || 1)) * (war ? 1.15 : 1),
    tids = Object.keys(F.tpl),
    inQ = F.queue.reduce((a, q) => a + q.men, 0);
  if (r.army + inQ < base * 0.92 && tids.length)
    for (let k = 0; k < 4 && r.army + F.queue.reduce((a, q) => a + q.men, 0) < base * 0.92; k++) {
      const tid = A.wpick(tids, t => F.tpl[t].share || 1),
        s = A.tplS(r.id, tid);
      if (!(s && r.levy > s.men * 2 && r.treasury > s.men * 6) || !A.trainDiv(r, tid).ok) break;
    }
  else if (r.army > base * 1.4 && F.divs.length > 1 && !war) {
    const d = F.divs.slice().sort((a, b) => a.men - b.men)[0];
    A.disbandDiv(d);
  }
  // [X1 baked patch core/04-world-fixes WLD-AI-DEBT] AI realm debt never went down: only interest (8%) was charged,
  // nothing repaid the principal, and surplus gold above 3x income was deleted for +1 stability instead. Realms now
  // repay principal from cash above half a year's income, and the surplus rule pays debt before it burns anything.
  if (!isPlayer && r.treasury > r.income * 3) {
    const _d = Math.min(r.debt || 0, r.treasury - r.income * 3);
    r.debt -= _d;
    r.treasury -= _d;
  }
  // [X1 baked patch nobility/56-court-and-treasury RI-SPEND-NOT-BURN] A.forcesAI deleted 85% of any AI treasury
  // above three years of income each year, for +1 stability and +1 legitimacy: about 65% of all AI income over 3
  // worlds x 30 years. The crown now spends it (A.RI.spend in treasury.core.js): sellswords at war, the upkeep of
  // its works and the pay of its council, then drill, walls, roads, granaries, temples, feasts for sullen lords and
  // gold for allies at war, in the order the ruler's temper and the court put them; full coffers lower the taxes.
  // Debt is still paid first (WLD-AI-DEBT).
  if (!isPlayer && A.RI && A.RI.spend) A.RI.spend(r);
  if (!F.doc && F.xp >= 60 && A.chance(0.3)) {
    const sh = A.compShares(r.id),
      horse = sh.filter(([c]) => GD.BN[c] && GD.BN[c].cat === "horse").reduce((a, x) => a + x[1], 0),
      bow = sh.filter(([c]) => GD.BN[c] && GD.BN[c].cat === "missile").reduce((a, x) => a + x[1], 0);
    F.doc = horse > 0.25 ? "shock" : bow > 0.3 ? "volley" : A.pick(["plan", "iron", "levy"]);
    F.xp -= GD.RDOC[F.doc].cost;
  }
  if (F.xp > 40 && A.chance(0.12) && tids.length) {
    const t = F.tpl[A.pick(tids)],
      want = ["eng", "scouts", "herald", "quart", "hosp", "engines"].filter(
        s =>
          !t.sup.includes(s) &&
          (s !== "engines" || r.income > 3e5) &&
          (s !== "scouts" || A.wsTroopsFor(r.id).some(c => GD.BN[c] && GD.BN[c].cat === "horse")),
      );
    if (want.length && t.sup.length < 4) A.tplEdit(r, t.id, t.bns, t.sup.concat([want[0]]));
  }
};

A.cmdRole = function (pc) {
  const out = {
    key: "none",
    title: "",
    divs: new Set(),
    armies: new Set(),
    templates: false,
    production: false,
    recruit: false,
    peace: false,
    desc: "",
    next: "",
  };
  if (!pc) return out;
  const rid = pc.ruler || (pc.mil && !pc.mil.merc ? pc.mil.realm : null);
  if (((out.realm = rid), pc.ruler)) {
    out.key = "ruler";
    out.title = "Ruler";
    for (const a of A.armiesOf(pc.ruler)) out.armies.add(a.id);
    for (const d of A.divsOf(pc.ruler)) out.divs.add(d.id);
    out.templates = out.production = out.recruit = out.peace = true;
    out.desc =
      "You command every army and division, design templates, run the forges and the builders, raise new divisions and make peace.";
    return out;
  }
  if (!pc.mil || pc.mil.merc) {
    out.desc = pc.mil
      ? "Mercenaries fight where they are paid; the realm's generals give the orders."
      : "You hold no command. You can watch the war.";
    return out;
  }
  const rank = pc.mil.rank,
    mine = A.armiesOf(rid);
  if (rank >= 9) {
    out.key = "marshal";
    out.title = "Marshal";
    for (const a of mine) out.armies.add(a.id);
    for (const d of A.divsOf(rid)) out.divs.add(d.id);
    out.templates = true;
    out.recruit = true;
    out.desc =
      "As Marshal you command every army, design division templates and ask the crown for new divisions. Only the ruler runs the forges and makes peace.";
    out.next = "Next: only a crown is higher.";
  } else if (rank >= 7) {
    out.key = rank >= 8 ? "highgeneral" : "general";
    out.title = GD.MIL[rank].title;
    for (const a of mine) if (a.gen === pc.id || (rank >= 8 && a.sub === pc.id)) out.armies.add(a.id);
    for (const a of mine) if (out.armies.has(a.id)) for (const id of a.divs) out.divs.add(id);
    out.desc =
      rank >= 8
        ? "As High General you lead an army group: your own army and up to two more. Give them fronts and battle plans, or move single divisions."
        : "As General you lead one army (up to 24 divisions). Give it a front and a battle plan, or move its divisions by hand.";
    out.next =
      rank >= 8
        ? "Next: Marshal — all armies, and the templates."
        : "Next: High General — an army group of three armies.";
  } else if (rank >= 6) {
    out.key = "commander";
    out.title = "Commander";
    if (pc.mil.div) out.divs.add(pc.mil.div);
    out.desc =
      "As Commander you lead one division. Move it, attack with it, dig it in. The army's plan still pulls on you; break from it and you answer for the result.";
    out.next = "Next: General — a whole army with its own front.";
  } else {
    if (rank >= 4) {
      out.key = "officer";
      out.title = GD.MIL[rank].title;
      out.desc = `As ${GD.MIL[rank].title} you lead a ${rank >= 5 ? "battalion" : "company"} inside your division. In battle you choose how hard your men push: it changes the division's attack, your losses and your merit.`;
      out.next = "Next: Commander — your own division on the map.";
    } else {
      out.key = "soldier";
      out.title = GD.MIL[rank].title;
      out.desc =
        "You fight where your division goes. Watch its front, its battles, its supply. Survive, win merit, get noticed.";
      out.next = "Next ranks lead squads and companies; Captains choose how their men fight.";
    }
  }
  return out;
};

A.on("worldInit", () => {
  A.cacheReset();
  for (const id in A.S.realms) {
    const r = A.S.realms[id];
    if (r.alive) A.F(r);
  }
});

A.on("worldYear", () => {
  for (const id in A.S.realms) {
    const r = A.S.realms[id];
    if (r.alive && !r.forces && A.realmProvs(id).length) A.F(r);
  }
});

A.lineSet = function (r, eq, delta) {
  const I = r.ind;
  A.indCount(r);
  let L = I.lines.find(x => x.eq === eq);
  const used = I.lines.reduce((a, x) => a + x.n, 0);
  if (delta > 0) {
    if (used >= I.mil) {
      const from =
        I.lines.find(x => x.eq === "trade" && x.n > 0) || I.lines.filter(x => x.eq !== eq).sort((a, b) => b.n - a.n)[0];
      if (!from || from.n <= 0)
        return {
          ok: false,
          msg: "Every forge is busy. Build more forges.",
        };
      from.n--;
      if (from.n <= 0) I.lines = I.lines.filter(x => x !== from);
    }
    if (!L) {
      L = {
        eq,
        n: 0,
        eff: 0.15,
      };
      I.lines.push(L);
    }
    L.eff = (L.eff * L.n + 0.15) / (L.n + 1);
    L.n++;
    return {
      ok: true,
    };
  }
  return !L || L.n <= 0
    ? {
        ok: false,
      }
    : (L.n--,
      L.n <= 0 && (I.lines = I.lines.filter(x => x !== L)),
      {
        ok: true,
      });
};

A.fxAct = function (key, arg) {
  const pc = A.pc(),
    R2 = A.cmdRole(pc),
    r = A.realm(R2.realm);
  if (!r || !r.alive)
    return {
      ok: false,
      msg: "No realm.",
    };
  A.F(r);
  const need = {
    train: "recruit",
    disband: "production",
    tplEdit: "templates",
    tplNew: "templates",
    tplDel: "templates",
    divTpl: "templates",
    line: "production",
    build: "production",
    unbuild: "production",
    law: "production",
    auto: "production",
    cancelTrain: "recruit",
    doc: "templates",
  }[key];
  if (need && !R2[need])
    return {
      ok: false,
      msg:
        need === "templates"
          ? "Only the Marshal or the ruler designs divisions."
          : need === "recruit"
            ? "Only the Marshal or the ruler raises divisions."
            : "Only the ruler runs the forges and the treasury.",
    };
  switch (key) {
    case "train":
      return A.trainDiv(r, arg);
    case "cancelTrain": {
      const q = r.forces.queue[arg];
      return q
        ? ((r.levy += q.men),
          r.forces.queue.splice(arg, 1),
          {
            ok: true,
            msg: "Training cancelled; the men go home.",
          })
        : {
            ok: false,
          };
    }
    case "disband": {
      const d = A.divById(arg);
      return !d || d.r !== r.id
        ? {
            ok: false,
          }
        : d.atk != null || (A.S.fights || {})[d.loc]
          ? {
              ok: false,
              msg: "Not in the middle of a battle.",
            }
          : (A.disbandDiv(d),
            {
              ok: true,
              msg: `${d.name} is disbanded. Its men return to the manpower pool.`,
            });
    }
    case "tplEdit":
      return A.tplEdit(r, arg.tid, arg.bns, arg.sup, arg.name);
    case "tplNew":
      return A.tplEdit(r, null, arg.bns, arg.sup, arg.name);
    case "tplDel": {
      const t = r.forces.tpl[arg];
      return t
        ? r.forces.divs.some(d => d.tpl === arg) || r.forces.queue.some(q => q.tpl === arg)
          ? {
              ok: false,
              msg: "Divisions still use this template.",
            }
          : Object.keys(r.forces.tpl).length <= 1
            ? {
                ok: false,
                msg: "Keep at least one template.",
              }
            : (delete r.forces.tpl[arg],
              {
                ok: true,
                msg: `Template "${t.name}" retired.`,
              })
        : {
            ok: false,
          };
    }
    case "divTpl": {
      const d = A.divById(arg.div);
      return !d || d.r !== r.id || !r.forces.tpl[arg.tpl]
        ? {
            ok: false,
          }
        : ((d.tpl = arg.tpl),
          (d.org = Math.min(d.org, A.divMaxOrg(d))),
          {
            ok: true,
            msg: `${d.name} reorganizes as a ${r.forces.tpl[arg.tpl].name}. It refits from the depots.`,
          });
    }
    case "line": {
      const res = A.lineSet(r, arg.eq, arg.d);
      r.forces.auto = false;
      return res;
    }
    case "build":
      return A.indQueue(r, arg.k, arg.prov);
    case "unbuild":
      return r.ind.cq[arg]
        ? (r.ind.cq.splice(arg, 1),
          {
            ok: true,
            msg: "Project cancelled.",
          })
        : {
            ok: false,
          };
    case "law": {
      const L = GD.ECON[arg];
      return L
        ? L.war && !A.atWar(r.id).length
          ? {
              ok: false,
              msg: "Only in wartime.",
            }
          : L.needExh && !A.realmProvs(r.id).some(p => p.occ) && r.exhaustion < 40
            ? {
                ok: false,
                msg: "Total mobilization needs the realm in danger (land occupied or war-weary).",
              }
            : ((r.ind.law = arg),
              {
                ok: true,
                msg: `${L.name}.`,
              })
        : {
            ok: false,
          };
    }
    case "doc": {
      const Dc = GD.RDOC[arg];
      return Dc
        ? r.forces.doc === arg
          ? {
              ok: false,
              msg: "Already your doctrine.",
            }
          : r.forces.xp < Dc.cost
            ? {
                ok: false,
                msg: `Needs ${Dc.cost} army experience.`,
              }
            : ((r.forces.xp -= Dc.cost),
              (r.forces.doc = arg),
              {
                ok: true,
                msg: `${r.short} adopts ${Dc.name}.`,
              })
        : {
            ok: false,
          };
    }
    case "auto":
      r.forces.auto = !!arg;
      if (arg) A.indAutoLines(r);
      return {
        ok: true,
        msg: arg
          ? "The quartermasters manage the forges and the drill yards."
          : "You manage the forges and the drill yards yourself.",
      };
  }
  return {
    ok: false,
  };
};

A.setStance = function (st) {
  const pc = A.pc();
  if (!(!pc || !pc.mil || !["press", "steady", "spare"].includes(st))) pc.mil.stance = st;
};

A.WS = {
  orgK: 1.8,
  hpK: 1.35,
  moveTerr: {
    plains: 1,
    steppe: 1.1,
    desert: 0.75,
    hills: 0.8,
    forest: 0.75,
    marsh: 0.6,
    mountains: 0.5,
    tundra: 0.7,
  },
};

A.armyDivs = a => (a && a.divs ? a.divs.map(A.divById).filter(Boolean) : []);

A.armyMen = a => A.armyDivs(a).reduce((x, d) => x + d.men, 0);

A.armiesOf = rid => (A.S.armies || []).filter(a => a.realm === rid);

A.army = id => {
  const L = A.S.armies || [];
  let X = A._armyIdx;
  if (!X || X.list !== L || X.len !== L.length) {
    X = A._armyIdx = {
      list: L,
      len: L.length,
      at: new Map(),
    };
    L.forEach((a, i2) => {
      if (!X.at.has(a.id)) X.at.set(a.id, i2);
    });
  }
  const i = X.at.get(id);
  return i !== void 0 && L[i] && L[i].id === id ? L[i] : L.find(a => a.id === id) || null;
};

A.armiesAt = loc => (A.S.armies || []).filter(a => A.armyDivs(a).some(d => d.loc === loc));

A.divsAt = loc => A.divsAtIdx(+loc);

A.hostile = function (r1, r2) {
  if (!r1 || !r2 || r1 === r2) return false;
  for (const w of A.S.wars)
    if ((w.att.includes(r1) && w.def.includes(r2)) || (w.def.includes(r1) && w.att.includes(r2))) return true;
  return false;
};

A.friendly = function (r1, r2) {
  if (r1 === r2) return true;
  for (const w of A.S.wars)
    if ((w.att.includes(r1) && w.att.includes(r2)) || (w.def.includes(r1) && w.def.includes(r2))) return true;
  return false;
};

A.relAll = function () {
  const fr = {},
    ho = {},
    add = (T, a, b) => {
      (T[a] = T[a] || new Set()).add(b);
    };
  for (const w of A.S.wars) {
    for (const a of w.att) {
      for (const b of w.att) add(fr, a, b);
      for (const b of w.def) {
        add(ho, a, b);
        add(ho, b, a);
      }
    }
    for (const a of w.def) for (const b of w.def) add(fr, a, b);
  }
  return {
    fr,
    ho,
  };
};

A.relSig = function () {
  let s = "";
  for (const w of A.S.wars) s += w.att.join(",") + "/" + w.def.join(",") + ";";
  return s;
};

A.relMemo = function (rid) {
  let M = A._relAll;
  if (!M) {
    const sig = A.relSig();
    if (!A._relC || A._relC.sig !== sig || A._relC.wars !== A.S.wars)
      A._relC = Object.assign(A.relAll(), {
        sig,
        wars: A.S.wars,
      });
    M = A._relC;
  }
  if (M)
    return {
      fr: o => o === rid || !!(M.fr[rid] && M.fr[rid].has(o)),
      ho: o => !!(o && o !== rid && M.ho[rid] && M.ho[rid].has(o)),
    };
  const f = {},
    h = {};
  return {
    fr: o => {
      let v = f[o];
      if (v === void 0) v = f[o] = A.friendly(o, rid);
      return v;
    },
    ho: o => {
      let v = h[o];
      if (v === void 0) v = h[o] = A.hostile(rid, o);
      return v;
    },
  };
};

A.wsDist = (a, b) => {
  const p = A.S.prov[a],
    q = A.S.prov[b];
  return Math.max(60, Math.hypot(p.x - q.x, p.y - q.y));
};

A.wsPath = function (from, to, rid) {
  if (from === to) return [];
  const S = A.S,
    N = S.prov.length;
  if (from == null || to == null || !S.prov[from] || !S.prov[to]) return null;
  // [X1 baked patch core/09-engine-at-scale SCALE-PATH-RELATIONS] A.wsPath (an army's road) asked A.friendly and
  // A.hostile, each a walk over every war, for every road it weighed: thousands of times per path on a large map.
  // The answers depend only on who holds the next province, and nothing changes while a path is found, so
  // 09-engine-at-scale remembers them per holder for the length of one search (A.scaleRel). With A.SCALE_OFF both
  // are asked every time, as before.
  const _rm = new Map(),
    dist = new Float64Array(N).fill(1 / 0),
    prev = new Int32Array(N).fill(-1),
    done = new Uint8Array(N),
    heap = [[0, from]];
  dist[from] = 0;
  const push = (d, v) => {
      heap.push([d, v]);
      let i = heap.length - 1;
      for (; i > 0; ) {
        const p = (i - 1) >> 1;
        if (heap[p][0] <= heap[i][0]) break;
        [heap[p], heap[i]] = [heap[i], heap[p]];
        i = p;
      }
    },
    pop = () => {
      const top = heap[0],
        last = heap.pop();
      if (heap.length) {
        heap[0] = last;
        let i = 0;
        for (;;) {
          const l = 2 * i + 1,
            r = l + 1;
          let m = i;
          if (
            (l < heap.length && heap[l][0] < heap[m][0] && (m = l),
            r < heap.length && heap[r][0] < heap[m][0] && (m = r),
            m === i)
          )
            break;
          [heap[m], heap[i]] = [heap[i], heap[m]];
          i = m;
        }
      }
      return top;
    };
  for (; heap.length; ) {
    const [du, u] = pop();
    if (done[u]) continue;
    if (((done[u] = 1), u === to)) break;
    // [X1 baked patch core/09-engine-at-scale SCALE-PATH-RELATIONS] A.wsPath (an army's road) asked A.friendly and
    // A.hostile, each a walk over every war, for every road it weighed: thousands of times per path on a large map.
    // The answers depend only on who holds the next province, and nothing changes while a path is found, so
    // 09-engine-at-scale remembers them per holder for the length of one search (A.scaleRel). With A.SCALE_OFF both
    // are asked every time, as before.
    const P = S.prov[u],
      step = (v, sea) => {
        const Q = S.prov[v],
          c = A.ctrl(Q),
          _r = A.scaleRel ? A.scaleRel(_rm, c, rid) : [rid && A.friendly(c, rid), rid && A.hostile(rid, c)],
          own = _r[0],
          foe = _r[1],
          d =
            (A.wsDist(u, v) / (A.WS.moveTerr[Q.terr] || 1)) *
            (sea ? 2.5 : 1) *
            (own ? (Q.road ? 0.8 : 1) : foe ? 1.2 : v === to ? 1.5 : 3.5);
        if (du + d < dist[v]) {
          dist[v] = du + d;
          prev[v] = u;
          push(dist[v], v);
        }
      };
    for (const v of P.adj) step(v, false);
    for (const v of P.sea || []) step(v, true);
  }
  if (prev[to] < 0) return null;
  const path = [];
  for (let v = to; v !== from; v = prev[v]) path.unshift(v);
  return path;
};

A.adjacent = (a, b) => {
  const P = A.S.prov[a];
  return !!P && (P.adj.includes(b) || (P.sea || []).includes(b));
};

A.ARMY_NAMES = [
  "First",
  "Second",
  "Third",
  "Fourth",
  "Fifth",
  "Sixth",
  "Seventh",
  "Eighth",
  "Royal",
  "Northern",
  "Southern",
  "Eastern",
  "Western",
  "Border",
  "Old",
  "Iron",
];

A.wsNewArmy = function (rid, divIds, gen, name) {
  const S = A.S;
  S.nextArmy = (S.nextArmy || 0) + 1;
  const r = A.realm(rid),
    short = r ? r.short.replace(/^the /i, "") : rid,
    used = new Set(A.armiesOf(rid).map(a2 => a2.name)),
    nm = name || (A.ARMY_NAMES.find(n => !used.has(`${n} Army of ${short}`)) || "Last") + " Army of " + short,
    a = {
      id: "R" + S.nextArmy,
      realm: rid,
      name: nm,
      divs: [],
      gen: gen || null,
      sub: null,
      order: {
        k: "free",
        enemy: null,
        obj: null,
      },
      born: S.year,
      lastThink: -99,
      mode: "ai",
    };
  S.armies.push(a);
  for (const id of divIds || []) {
    const d = A.divById(id);
    if (d) {
      if (d.army && d.army !== a.id) {
        const o = A.army(d.army);
        if (o) o.divs = o.divs.filter(x => x !== id);
      }
      d.army = a.id;
      a.divs.push(id);
    }
  }
  A.armySync(a);
  return a;
};

A.wsGeneralFor = function (rid) {
  const r = A.realm(rid),
    busy = new Set((A.S.armies || []).map(a => a.gen));
  if (
    r &&
    r.council &&
    r.council.marshal &&
    A.P(r.council.marshal) &&
    A.P(r.council.marshal).alive &&
    !busy.has(r.council.marshal) &&
    r.council.marshal !== A.S.pc
  )
    return r.council.marshal;
  const hs = Object.values(A.S.houses).filter(
    h => h.realm === rid && !h.extinct && (h.military || ["N01", "N02", "N03", "N04", "N05"].includes(h.rung)),
  );
  if (hs.length && A.chance(0.7)) {
    const h = A.pick(hs),
      p2 = A.houseHead(h.id);
    if (p2 && p2.alive && p2.id !== A.S.pc && !busy.has(p2.id)) {
      p2.skills.command = Math.max(p2.skills.command || 0, A.ri(25, 65));
      p2.skills.tactics = Math.max(p2.skills.tactics || 0, A.ri(20, 60));
      return p2.id;
    }
  }
  const p = A.genNoble(rid, "noble", null, A.ri(30, 55));
  p.skills.command = A.ri(25, 70);
  p.skills.tactics = A.ri(20, 65);
  p.skills.logistics = A.ri(10, 60);
  p.skills.siegecraft = A.ri(5, 50);
  p.occ = "a general";
  return p.id;
};

A.armySync = function (a) {
  const ds = A.armyDivs(a);
  a.divs = ds.map(d => d.id);
  const cnt = {};
  let men = 0,
    org = 0,
    om = 0,
    exp = 0,
    men0 = 0;
  const comp = {};
  for (const d of ds) {
    cnt[d.loc] = (cnt[d.loc] || 0) + 1;
    men += d.men;
    exp += d.exp * d.men;
    const mo = A.divMaxOrg(d);
    org += (d.org / Math.max(1, mo)) * d.men;
    om += d.men;
    const s = A.divS(d);
    men0 += s.men;
    const t = A.tplOf(d);
    if (t) {
      const f = d.men / Math.max(1, s.men);
      for (const c of t.bns) comp[c] = (comp[c] || 0) + Math.round(GD.BN[c].men * f);
    }
  }
  let loc = a.loc,
    best = -1;
  for (const k in cnt)
    if (cnt[k] > best) {
      best = cnt[k];
      loc = +k;
    }
  a.loc = loc;
  a.men = men;
  a.men0 = men0;
  a.org = om ? Math.round((org / om) * 100) : 0;
  a.exp = men ? Math.round(exp / men) : 0;
  a.comp = comp;
  const fs = A.S.fights || {},
    atkD = ds.find(d => d.atk != null),
    defD = ds.find(d => fs[d.loc]);
  a.combat = atkD ? "F" + atkD.atk : defD ? "F" + defD.loc : null;
  a.siege = ds.some(d => d.sieging) ? 1 : 0;
  a.hungry = ds.some(d => d.sr != null && d.sr < 0.7);
  a.path = [];
  return a;
};

A.wsRaise = function (w) {
  const S = A.S;
  S.armies = S.armies || [];
  for (const rid of w.att.concat(w.def)) A.wsMobilize(rid);
  A.wsAttachPC();
};

A.wsMobilize = function (rid) {
  const r = A.realm(rid);
  if (!r || !r.forces) return wsMobilizeNow(rid);
  const guards = r.forces.divs.filter(
    d => d.elite && GD.ORDERS[d.elite] && (GD.ORDERS[d.elite].kind === "guard" || d.rebuild) && !d.army,
  );
  if (!guards.length) return wsMobilizeNow(rid);
  r.forces.divs = r.forces.divs.filter(d => !guards.includes(d));
  A.locDirty();
  try {
    return wsMobilizeNow(rid);
  } finally {
    r.forces.divs.push(...guards);
    A.locDirty();
  }
};

const wsMobilizeNow = function (rid) {
  const r = A.realm(rid);
  if (!r || !r.alive) return;
  A.F(r);
  A.forcesReconcile(r);
  const free = r.forces.divs.filter(d => !d.army || !A.army(d.army));
  if (!free.length) return;
  for (const d of free)
    if (d.loc == null || !A.S.prov[d.loc]) {
      const ps = A.realmProvs(rid),
        en = A.enemiesOf(rid),
        any = ps[0] || A.S.prov.find(p => en.includes(p.owner));
      d.loc = any ? any.id : 0;
      d.from = d.loc;
      A.locDirty();
    }
  const existing = A.armiesOf(rid).filter(a => a.divs.length < 24);
  let pool = free.slice();
  for (const a of existing) {
    for (; pool.length && a.divs.length < 24; ) {
      const d = pool.shift();
      d.army = a.id;
      a.divs.push(d.id);
    }
    A.armySync(a);
  }
  if (!pool.length) return;
  const n = Math.ceil(pool.length / 24);
  pool.sort((x, y) => A.S.prov[x.loc].x + A.S.prov[x.loc].y * 0.3 - (A.S.prov[y.loc].x + A.S.prov[y.loc].y * 0.3));
  const per = Math.ceil(pool.length / n);
  for (let i = 0; i < n; i++) {
    const ids = pool.slice(i * per, (i + 1) * per).map(d => d.id);
    if (ids.length) A.wsNewArmy(rid, ids, A.wsGeneralFor(rid));
  }
};
