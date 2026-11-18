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
