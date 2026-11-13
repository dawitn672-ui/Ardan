// The release's core, ui (part 4 of 6): UI: the interface.
// Readable source of vendor/ardan-b593143.html with the patch layer baked in (X1, docs/DECISIONS.md D-028). Edit it here.
// Defines: UI.wrFightPanelBasic, UI.wrProvPanel, A.wrAdvice, UI.wrForces, UI.wrDivStatusText, UI.wrTemplates,
// UI.wrBnChip, UI.wrTplSummary, UI.wrTplEditor, UI.wrIndustry, UI.wrManpower, UI.wrWars, UI.wrView, UI.wrClamp,
// UI.wrZoom, UI.wrFitCanvas, UI.wrOverlay, UI.wrArrow, UI.drawWarBasic, UI.wrProvAt, UI.wrHitAt, UI.wrTip,
// UI.wrAttach, UI.wrMapOrder, UI.wrRefreshBasic, UI.wrTick, UI.wrRedrawSide, UI.A (+), UI.C (+), UI.forcesSummary,
// UI.promoBoardHtml, UI.clk, UI.CLK_SPEEDS, UI.clkStart, UI.clkStop, UI.clkToggle, UI.quietable, UI.quietSettle,
// UI.clkTick, UI.clkLight, UI.clkPaint, UI.clkHtml, UI.renderTop, UI.renderLogWrap, UI.clkResume, UI.RESUME_AFTER,
// UI.clockKeys, UI.confirm, UI.ovModal, UI.warDeclModal, UI.warRoomOpen, UI.warRoomModal, UI.afterModal,
// UI.wrRefresh, UI.wrStop.

UI.wrFightPanelBasic = function (pid, R2) {
  const F = (A.S.fights || {})[pid];
  if (!F) return "";
  const P = A.S.prov[pid],
    st = A.fightState(F),
    myR = UI.wrMyR(),
    side = (list, isAtt) =>
      list
        .map(d => {
          const r = A.realm(d.r),
            s = A.divS(d);
          return `<div class="wr-drow click" data-a="wrSelDiv" data-v="${d.id}">${UI.unitSym(s.main === "missile" ? "missile" : s.main, 1, r ? MAP.realmColor(r) : "#999", 20)}<div class="grow"><div class="tiny">${UI.esc(d.name)}${isAtt ? ` <span class="muted">from ${UI.esc(A.provName(d.loc))}</span>` : ""}</div>${UI.wrBars(d)}</div></div>`;
        })
        .join(""),
    m = F.mods || {},
    mods = [];
  if (m.terr && m.terr < 1) mods.push(["Terrain: " + P.terr, `attacker ×${m.terr}`]);
  if (m.fort) mods.push([`Walls (level ${m.fort})`, `attacker −${m.fort * 8}%, defender +${m.fort * 6}%`]);
  if (m.winter && m.winter < 1) mods.push(["Winter", "attacker −15%"]);
  if (F.dirs > 1) mods.push([`Attacked from ${F.dirs} sides`, `+${35 * Math.min(2, F.dirs - 1)} width`]);
  const dig = st.def.length ? st.def.reduce((x, d) => x + (d.dig || 0), 0) / st.def.length : 0;
  if (dig >= 1) mods.push(["Defenders dug in", `+${Math.round(dig * 2.5)}% defense`]);
  const plan = st.att.length ? st.att.reduce((x, d) => x + (d.plan || 0), 0) / st.att.length : 0;
  if (plan > 0.02) mods.push(["Attackers' planning", `+${UI.wrPct(plan)} attack`]);
  const mySide = A.friendly(F.a, myR) ? "a" : A.friendly(F.b, myR) ? "b" : null,
    good = mySide === "a" ? st.share : mySide === "b" ? 1 - st.share : st.share;
  let h = `<div class="card wr-fightp"><div class="row">${UI.wrIcon("swords")}<b>Battle of ${UI.esc(P.name)}</b><span class="right tiny muted">day ${F.days}</span></div>
    <div class="wr-tug big"><i style="width:${Math.round(good * 100)}%"></i></div><div class="tiny muted">${mySide ? (good > 0.58 ? "Your side is winning." : good < 0.42 ? "Your side is losing." : "In the balance.") : "Organization left: attackers vs defenders."}</div>
    <div class="wr-vs"><div><div class="tag">Attackers · ${UI.esc(A.realmShort(F.a))}</div><div class="tiny">${A.fmt(st.menA)} men · ${F.atkA || 0} attacks/day · ${F.usedA || 0}/${F.width || 0} width</div>${side(st.att, true)}</div>
    <div><div class="tag">Defenders · ${UI.esc(A.realmShort(F.b))}</div><div class="tiny">${A.fmt(st.menD)} men · ${F.atkD || 0} attacks/day · ${F.usedD || 0}/${F.width || 0} width</div>${side(st.def, false)}</div></div>
    ${mods.length ? `<div class="group-h">Modifiers</div><div class="kv tiny">${mods.map(([a, b]) => `<div>${UI.esc(a)}</div><div>${UI.esc(b)}</div>`).join("")}</div>` : ""}
    <div class="tiny muted">Losses so far: attackers ${A.fmt(F.deadA)}, defenders ${A.fmt(F.deadD)}.</div>`;
  if (
    st.att.concat(st.def).some(d => R2.divs.has(d.id)) &&
    R2.key !== "soldier" &&
    R2.key !== "officer" &&
    R2.key !== "none"
  )
    h += `<button class="primary" style="width:100%;margin-top:6px" data-a="wrLead" data-v="F${pid}">${UI.wrIcon("swords")}Lead this battle in person</button>`;
  return h + "</div>";
};

UI.wrProvPanel = function (pid, R2) {
  const P = A.S.prov[pid];
  if (!P) return "";
  const myR = UI.wrMyR(),
    r = A.realm(P.owner),
    sup = A.supplyMap(myR)[pid],
    ds = A.divsAt(pid);
  let h = `<div class="card"><div class="row">${UI.wrIcon("map-pin")}<b>${UI.esc(P.name)}</b><span class="right tiny muted">${UI.esc(r ? r.short : "Unclaimed")}${P.occ ? ` · held by ${UI.esc(A.realmShort(P.occ))}` : ""}</span></div>
    <div class="kv tiny"><div>Ground</div><div>${UI.esc(A.cap(P.terr))} · width ${A.WIDTH[P.terr] || 60} · attacker ×${A.ATK_TERR[P.terr] || 1}</div><div>Walls</div><div>${P.fort || 0}${P.sgBy ? ` · besieged by ${UI.esc(A.realmShort(P.sgBy))} (${Math.round(P.sgd || 0)}/${Math.round(P.sgNeed || 0)} days)` : ""}</div><div>Supply (for you)</div><div>${sup.toFixed(1)} — feeds about ${Math.max(0, Math.floor(sup / 0.65))} divisions${P.depot ? " · depot" : ""}${P.road ? " · road" : ""}</div><div>Industry</div><div>${P.civ || 0} workshops · ${P.mil || 0} forges · ${A.provUsed(P)}/${A.provSlots(P)} slots</div><div>People</div><div>${A.fmt(P.pop)}</div></div>`;
  if (ds.length)
    h += `<div class="group-h">Divisions here</div>${ds
      .map(d => {
        const rr = A.realm(d.r),
          s = A.divS(d),
          intel = !A.hostile(myR, d.r) || UI.wrIntel(d);
        return `<div class="wr-drow click" data-a="wrSelDiv" data-v="${d.id}">${UI.unitSym(s.main === "missile" ? "missile" : s.main, 1, rr ? MAP.realmColor(rr) : "#999", 20)}<div class="grow"><div class="tiny">${UI.esc(d.name)}</div>${intel ? UI.wrBars(d) : '<div class="tiny muted">strength unknown</div>'}</div></div>`;
      })
      .join("")}`;
  return h + "</div>";
};

A.wrAdvice = function (pc, R2) {
  const out = [],
    myR = UI.wrMyR(pc),
    r = A.realm(myR);
  if (!r) return out;
  const war = A.atWar(myR).length > 0,
    arms = A.armiesOf(myR).filter(a => R2.armies.has(a.id));
  for (const a of arms) {
    const ds = A.armyDivs(a);
    if (a.order.k === "free" && war)
      out.push({
        ic: "flag",
        t: `<b>${UI.esc(a.name)}</b> has no orders and fights on the general's judgment. Give it a front or a battle plan.`,
        a: "wrSelArmy",
        v: a.id,
        b: "Orders",
      });
    const hungry = ds.filter(d => d.sr != null && d.sr < 0.6);
    if (hungry.length >= 2)
      out.push({
        lv: "bad",
        ic: "truck",
        t: `${hungry.length} divisions of the ${UI.esc(a.name)} are starving (supply under 60%). Spread them out, pull back toward a depot, or build one.`,
      });
    const broken = ds.filter(d => d.org < A.divMaxOrg(d) * 0.3 && d.atk == null);
    if (broken.length >= 3)
      out.push({
        lv: "warn",
        ic: "shield",
        t: `${broken.length} divisions of the ${UI.esc(a.name)} are badly disorganized. Let them rest before the next attack.`,
      });
  }
  if (R2.key === "commander" && pc.mil.div) {
    const d = A.divById(pc.mil.div);
    if (d && !d.manual && war)
      out.push({
        ic: "route",
        t: "Your division follows the army's plan. Select it and click the map to take it where you think best.",
        a: "wrSelDiv",
        v: d.id,
        b: "Select",
      });
  }
  if (R2.production && r.ind) {
    const need = A.eqNeed(r),
      short = GD.EQ_KEYS.filter(k => (need.short[k] || 0) > (r.ind.stock[k] || 0) + 50).sort(
        (x, y) => (need.short[y] - r.ind.stock[y]) * GD.EQ[y].cost - (need.short[x] - r.ind.stock[x]) * GD.EQ[x].cost,
      );
    if (short.length)
      out.push({
        lv: "warn",
        ic: "package",
        t: `The host is short of <b>${GD.EQ[short[0]].name.toLowerCase()}</b> (${A.fmt(Math.round(need.short[short[0]] - r.ind.stock[short[0]]))} missing)${r.forces.auto ? "" : ". Put more forges on that line"}.`,
        a: "wrTab",
        v: "ind",
        b: "Industry",
      });
    const busy = r.ind.lines.filter(L => L.eq !== "trade").reduce((x, L) => x + L.n, 0);
    if (war && busy < r.ind.mil * 0.5 && !r.forces.auto)
      out.push({
        ic: "factory",
        t: `Only ${busy} of ${r.ind.mil} forges make war gear; the rest sell abroad. In war you may want them on the lines.`,
        a: "wrTab",
        v: "ind",
        b: "Industry",
      });
    if (!r.ind.cq.length && r.ind.civ > 2)
      out.push({
        ic: "hammer",
        t: "Your workshops have nothing to build. Queue a forge, a workshop, walls or a depot.",
        a: "wrTab",
        v: "ind",
        b: "Build",
      });
    if (war && r.ind.law !== "war" && r.ind.law !== "total")
      out.push({
        ic: "factory",
        t: `Your economy is still on <b>${GD.ECON[r.ind.law].name.toLowerCase()}</b>. A war economy makes more gear but costs stability.`,
        a: "wrTab",
        v: "ind",
        b: "Laws",
      });
  }
  if (
    (R2.recruit &&
      (r.levy < (r.levyCap || r.levy) * 0.15
        ? out.push({
            lv: "warn",
            ic: "users",
            t: `Manpower is running dry (${A.fmt(r.levy)} left). Heavier levies would raise more men, at a cost.`,
            a: "wrTab",
            v: "mp",
            b: "Manpower",
          })
        : war &&
          !r.forces.queue.length &&
          r.levy > 2e4 &&
          out.push({
            ic: "users",
            t: `${A.fmt(r.levy)} men could be called up. Train new divisions in the Manpower tab.`,
            a: "wrTab",
            v: "mp",
            b: "Train",
          })),
    R2.templates &&
      r.forces.xp >= 25 &&
      out.push({
        ic: "pencil",
        t: `You have ${Math.floor(r.forces.xp)} army experience to spend on better division templates.`,
        a: "wrTab",
        v: "tpl",
        b: "Templates",
      }),
    pc.mil && !pc.ruler)
  ) {
    const b = A.promoBoard(pc);
    if (b) {
      const miss = b.filter(x => !x.ok);
      if (miss.length)
        out.push({
          ic: "star",
          t: `For ${GD.MIL[pc.mil.rank + 1].title}: ${miss.map(x => `${x.label.toLowerCase()} ${x.have}${x.need !== "" ? "/" + x.need : ""}`).join(", ")}.`,
        });
    }
  }
  return out.slice(0, 5);
};

UI.wrForces = function () {
  const pc = A.pc(),
    R2 = A.cmdRole(pc),
    myR = UI.wrMyR(pc),
    r = A.realm(myR);
  if (!r) return '<p class="small muted">No realm.</p>';
  A.F(r);
  const all = r.forces.divs,
    men = all.reduce((x, d) => x + d.men, 0),
    full = all.reduce((x, d) => x + A.divS(d).men, 0);
  let h = `<div class="card small"><div class="row"><b>The host of ${UI.esc(r.short)}</b><span class="right muted">${all.length} divisions</span></div>${UI.barRow("Men", men, Math.max(1, full), "", null, `${UI.kfmt(men)}/${UI.kfmt(full)}`)}<div class="tiny muted">Manpower pool ${A.fmt(r.levy)} · ${r.forces.queue.length} in training · army experience ${Math.floor(r.forces.xp)}</div></div>`;
  const row = d => {
      const rr = A.realm(d.r),
        s = A.divS(d),
        sel = UI.wr.sel && UI.wr.sel.k === "divs" && UI.wr.sel.ids.includes(d.id),
        mine = R2.divs.has(d.id);
      return `<div class="wr-drow click ${sel ? "sel" : ""} ${mine ? "mine" : ""}" data-a="wrSelDiv" data-v="${d.id}">${UI.unitSym(s.main === "missile" ? "missile" : s.main, 1, rr ? MAP.realmColor(rr) : "#999", 22)}<div class="grow"><div class="small">${UI.esc(d.name)}${pc.mil && pc.mil.div === d.id ? ' <span class="chip gold">you</span>' : ""}</div>${UI.wrBars(d)}<div class="tiny muted">${UI.wrDivStatusText(d)}</div></div></div>`;
    },
    armies = A.armiesOf(myR);
  for (const a of armies) {
    h += `<div class="group-h row"><span class="click u" data-a="wrSelArmy" data-v="${a.id}">${UI.esc(a.name)}</span><span class="right tiny muted">${a.divs.length} div</span></div>`;
    h += A.armyDivs(a).map(row).join("");
  }
  const res = all.filter(d => !d.army || !A.army(d.army));
  if (res.length)
    h += `<div class="group-h">${armies.length ? "Not yet with an army" : "Standing divisions"}</div>${res.map(row).join("")}`;
  if (r.forces.queue.length)
    h += `<div class="group-h">In training</div>${r.forces.queue
      .map(q => {
        const t = r.forces.tpl[q.tpl];
        return `<div class="small">${UI.wrIcon("tent")} ${UI.esc(t ? t.name : "?")} — ${A.fmt(q.men)} men ${UI.bar(q.days - q.left, q.days)} <span class="tiny muted">${Math.ceil(Math.max(0, q.left) / 30)} mo</span></div>`;
      })
      .join("")}`;
  return h;
};

UI.wrDivStatusText = function (d) {
  const S = A.S;
  return d.train > 30
    ? `training, ${Math.ceil(d.train / 30)} months`
    : d.atk != null
      ? `attacking ${A.provName(d.atk)}`
      : (S.fights || {})[d.loc]
        ? `defending ${A.provName(d.loc)}`
        : d.sieging
          ? `besieging ${A.provName(d.loc)}`
          : d.path && d.path.length
            ? `${A.provName(d.loc)} → ${A.provName(d.path[d.path.length - 1])}`
            : `${A.provName(d.loc)}${d.dig >= 1 ? ", dug in" : ""}${d.sr != null && d.sr < 0.7 ? ", hungry" : ""}`;
};

UI.wrTemplates = function () {
  const pc = A.pc(),
    R2 = A.cmdRole(pc),
    r = A.realm(UI.wrMyR(pc));
  if (!r) return "";
  A.F(r);
  const E = UI.wr.tplEdit;
  if (E) return UI.wrTplEditor(r, E, R2);
  let h = `<div class="card small"><div class="row"><b>Division templates</b><span class="right chip gold" title="Earned in battle and drills; spent on new designs">${UI.wrIcon("star")} ${Math.floor(r.forces.xp)} army experience</span></div><div class="tiny muted">A template is the recipe for a division. Battalions fill combat width and bring the punch; support companies are free of width. Redesigning costs army experience; divisions refit to the new design as men and kit arrive.</div>${R2.templates ? `<button class="small primary" style="margin-top:6px" data-a="wrTplNew">${UI.wrIcon("plus")}New template</button>` : '<div class="tiny warn-t">You can study the templates; only the Marshal or the ruler changes them.</div>'}</div>`;
  h += `<div class="group-h">Army doctrine <span class="tiny muted">— the realm's way of war</span></div><div class="wr-laws">${Object.entries(
    GD.RDOC,
  )
    .map(
      ([k, Dc]) =>
        `<button class="small ${r.forces.doc === k ? "on" : ""}" data-a="wrDoc" data-v="${k}" ${R2.templates && r.forces.doc !== k ? "" : "disabled"} aria-pressed="${r.forces.doc === k}"><b>${UI.esc(Dc.name)}</b><small>${UI.esc(Dc.desc)}${r.forces.doc === k ? " · adopted" : ` · ${Dc.cost} exp`}</small></button>`,
    )
    .join("")}</div><div class="group-h">Templates</div>`;
  for (const t of Object.values(r.forces.tpl)) {
    const s = A.tplS(r.id, t.id),
      n = r.forces.divs.filter(d => d.tpl === t.id).length;
    h += `<div class="card wr-tpl"><div class="row">${UI.unitSym(s.main === "missile" ? "missile" : s.main, 1, MAP.realmColor(r), 26)}<b class="grow">${UI.esc(t.name)}</b><span class="tiny muted">${n} division${n === 1 ? "" : "s"}</span></div>
      <div class="wr-slots">${t.bns.map(b => UI.wrBnChip(b)).join("")}${t.sup.map(sp => `<span class="wr-chip sup" title="${UI.esc(GD.SUP[sp].desc)}">${UI.esc(GD.SUP[sp].name)}</span>`).join("")}</div>
      ${UI.wrTplSummary(s)}
      <div class="row wrap">${R2.templates ? `<button class="small" data-a="wrTplEdit" data-v="${t.id}">${UI.wrIcon("pencil")}Edit</button>` : ""}${R2.recruit ? `<button class="small" data-a="wrTrain" data-v="${t.id}">${UI.wrIcon("users")}Train one</button>` : ""}${R2.templates && !n ? `<button class="small ghost" data-a="wrTplDel" data-v="${t.id}">${UI.wrIcon("trash")}Retire</button>` : ""}</div></div>`;
  }
  return h;
};

UI.wrBnChip = function (b, act, idx) {
  const B = GD.BN[b],
    T = GD.TROOPS[b],
    tip = `${T ? T.name : b}: ${B.role} Soft ${B.soft}, hard ${B.hard}, def ${B.def}, brk ${B.brk}, org ${B.org}, hp ${B.hp}, width ${B.w}, ${B.men} men.`;
  return `<span class="wr-chip ${B.cat}" title="${UI.esc(tip)}"${act ? ` data-a="${act}" data-v="${idx ?? b}" role="button" tabindex="0"` : ""}>${UI.esc(T ? T.name : b)}${act === "wrTplRm" ? " ×" : ""}</span>`;
};

UI.wrTplSummary = function (s, base) {
  const f = (k, v, dp = 0, rev) => {
      const b = base ? base[k] : null,
        dv = b == null ? 0 : v - b,
        cls = !b || Math.abs(dv) < 0.05 ? "" : dv > 0 != !!rev ? "good" : "bad";
      return `<div title="${k}"><span>${
        {
          soft: "Soft atk",
          hard: "Hard atk",
          def: "Defense",
          brk: "Breakthr.",
          org: "Org",
          hp: "HP",
          w: "Width",
          sup: "Supply",
          spd: "Speed",
          men: "Men",
          cost: "Gear cost",
          arm: "Armor",
          prc: "Piercing",
        }[k]
      }</span><b class="${cls}">${v.toFixed(dp)}${b != null && Math.abs(dv) >= 0.05 ? ` <small>(${dv > 0 ? "+" : ""}${dv.toFixed(dp)})</small>` : ""}</b></div>`;
    },
    fits = Math.floor(70 / Math.max(1, s.w));
  return `<div class="wr-stats">${f("soft", s.soft)}${f("hard", s.hard, 1)}${f("def", s.def)}${f("brk", s.brk)}${f("org", s.org)}${f("hp", s.hp)}${f("w", s.w, 0, true)}${f("sup", s.sup, 2, true)}${f("spd", s.spd * 22, 0)}${f("men", s.men, 0, true)}${f("arm", s.arm, 1)}${f("prc", s.prc, 1)}</div><div class="tiny muted">Equipment: ${Object.entries(
    s.eq,
  )
    .map(([k, v]) => `${v} ${GD.EQ[k].short.toLowerCase()}`)
    .join(
      ", ",
    )}. ${fits} fit a plains front (width 70), ${Math.floor(50 / Math.max(1, s.w))} a forest, ${Math.floor(35 / Math.max(1, s.w))} a mountain pass.</div>`;
};

UI.wrTplEditor = function (r, E, R2) {
  const base = E.tid ? A.tplS(r.id, E.tid) : null,
    s = A.tplStats(
      {
        bns: E.bns,
        sup: E.sup,
      },
      r.id,
    ),
    old = E.tid ? r.forces.tpl[E.tid] : null,
    changes = old
      ? Math.abs(E.bns.length - old.bns.length) +
        E.bns.filter((c, i) => old.bns[i] !== c).length +
        E.sup.filter(x => !old.sup.includes(x)).length +
        old.sup.filter(x => !E.sup.includes(x)).length
      : 4,
    cost = Math.max(old ? 2 : 10, Math.round(changes * 2.5)),
    troops = A.wsTroopsFor(r.id).filter(c => GD.BN[c]);
  return `<div class="card wr-tpled"><div class="row"><b>${old ? "Redesign" : "New template"}</b><span class="right chip gold">${UI.wrIcon("star")} costs ${cost} of ${Math.floor(r.forces.xp)}</span></div>
    <label class="small">Name <input type="text" maxlength="28" value="${UI.esc(E.name || "")}" data-c="wrTplName" aria-label="Template name"></label>
    <div class="group-h">Battalions ${E.bns.length}/${GD.TPL_MAX_BN} <span class="tiny muted">— click one to remove it</span></div>
    <div class="wr-slots big">${E.bns.map((b, i) => UI.wrBnChip(b, "wrTplRm", i)).join("")}${Array(
      Math.max(0, GD.TPL_MAX_BN - E.bns.length),
    )
      .fill('<span class="wr-chip empty">+</span>')
      .join("")}</div>
    <div class="group-h">Add a battalion <span class="tiny muted">(what ${UI.esc(r.short)} can raise)</span></div>
    <div class="wr-slots">${troops.map(c => `<button class="small wr-add ${GD.BN[c].cat}" data-a="wrTplAdd" data-v="${c}" ${E.bns.length >= GD.TPL_MAX_BN ? "disabled" : ""} title="${UI.esc(GD.BN[c].role)}">${UI.wrIcon("plus")}${UI.esc(GD.TROOPS[c].name)}</button>`).join("")}</div>
    <div class="group-h">Support companies ${E.sup.length}/${GD.TPL_MAX_SUP}</div>
    <div class="wr-sup">${Object.entries(GD.SUP)
      .map(
        ([k, U]) =>
          `<button class="small ${E.sup.includes(k) ? "on" : ""}" data-a="wrTplSup" data-v="${k}" aria-pressed="${E.sup.includes(k)}" title="${UI.esc(U.desc)}"><b>${UI.esc(U.name)}</b><small>${UI.esc(U.desc)}</small></button>`,
      )
      .join("")}</div>
    <div class="group-h">Result ${base ? '<span class="tiny muted">(change from the current design)</span>' : ""}</div>${UI.wrTplSummary(s, base)}
    <div class="row" style="margin-top:8px"><button class="primary" data-a="wrTplSave" ${!E.bns.length || r.forces.xp < cost ? "disabled" : ""}>${UI.wrIcon("check")}Save design</button><button data-a="wrTplCancel">Cancel</button></div>
    ${r.forces.xp < cost ? '<div class="tiny bad">Not enough army experience. Battles, sieges, war games and time earn more.</div>' : ""}</div>`;
};

UI.wrIndustry = function () {
  const pc = A.pc(),
    R2 = A.cmdRole(pc),
    r = A.realm(UI.wrMyR(pc));
  if (!r) return "";
  A.F(r);
  A.indCount(r);
  const I = r.ind,
    law = GD.ECON[I.law] || GD.ECON.partial,
    can = R2.production,
    free = Math.floor(I.civ * (1 - law.cg)),
    need = A.eqNeed(r);
  let h = `<div class="card small"><div class="row"><b>Industry of ${UI.esc(r.short)}</b>${can ? `<label class="right tiny"><input type="checkbox" data-c="wrAuto" ${r.forces.auto ? "checked" : ""}> Quartermasters manage it</label>` : ""}</div>
    <div class="wr-kpis"><div>${UI.wrIcon("hammer")}<b>${I.civ}</b><span>workshops</span><small>${free} free to build · ${I.civ - free} make goods for the people</small></div><div>${UI.wrIcon("factory")}<b>${I.mil}</b><span>forges</span><small>${I.lines.filter(L => L.eq !== "trade").reduce((x, L) => x + L.n, 0)} on war gear · ${
      (
        I.lines.find(L => L.eq === "trade") || {
          n: 0,
        }
      ).n
    } selling abroad</small></div><div>${UI.wrIcon("coins")}<b>${A.fmt(I.lastSold || 0)}</b><span>arms sold last year</span><small>ore ${I.ore} · ${A.oreMul(r) < 1 ? `<span class="bad">short: −${Math.round((1 - A.oreMul(r)) * 100)}% on metal lines</span>` : "enough"}</small></div></div>
    ${can ? "" : '<div class="tiny warn-t">Only the ruler runs the forges. You can see the books.</div>'}</div>`;
  h += `<div class="group-h">Economy law</div><div class="wr-laws">${Object.entries(GD.ECON)
    .map(
      ([k, L]) =>
        `<button class="small ${I.law === k ? "on" : ""}" data-a="wrLaw" data-v="${k}" ${can ? "" : "disabled"} aria-pressed="${I.law === k}"><b>${UI.esc(L.name)}</b><small>Goods ${Math.round(L.cg * 100)}% of workshops · forges ×${L.out} · stability ${L.stab >= 0 ? "+" : ""}${L.stab}/yr${L.war ? " · wartime" : ""}</small></button>`,
    )
    .join("")}</div>`;
  h +=
    '<div class="group-h">Production lines</div><div class="wr-tablewrap"><table class="t small wr-lines"><thead><tr><th>Equipment</th><th>Forges</th><th>Efficiency</th><th>/month</th><th>Stock</th><th>Needed</th></tr></thead><tbody>';
  for (const k of GD.EQ_KEYS.concat(["trade"])) {
    const L = I.lines.find(x => x.eq === k) || {
      n: 0,
      eff: 0,
    };
    if (k === "trade") {
      h += `<tr><td>${UI.wrIcon("coins")} Sell arms abroad</td><td>${can ? '<button class="small ghost" data-a="wrLine" data-v="trade|-1" aria-label="fewer">−</button>' : ""}<b>${L.n}</b>${can ? '<button class="small ghost" data-a="wrLine" data-v="trade|1" aria-label="more">+</button>' : ""}</td><td>${UI.bar(L.eff * 100, 100)}</td><td>${A.fmt(Math.round(L.n * 30 * L.eff * 14))} suns</td><td></td><td></td></tr>`;
      continue;
    }
    const E = GD.EQ[k],
      per = Math.round(A.lineRate(r, L) * 30),
      tgt = Math.round(A.eqTarget(r, k, need)),
      st = Math.round(I.stock[k] || 0),
      sh = need.short[k] || 0;
    if (!L.n && !sh && !need.full[k] && !st) continue;
    const status = st >= sh ? (st >= tgt ? "good" : "") : "bad",
      needTxt =
        sh > st
          ? `<span class="bad-t">${A.fmt(Math.round(sh - st))} short</span>`
          : sh > 0
            ? `<span class="tiny muted">refitting ${A.fmt(Math.round(sh))}</span>`
            : `<span class="tiny muted">reserve ${A.fmt(tgt)}</span>`;
    h += `<tr><td title="${UI.esc(E.desc)}">${UI.esc(E.name)}</td><td>${can ? `<button class="small ghost" data-a="wrLine" data-v="${k}|-1" aria-label="fewer forges">−</button>` : ""}<b>${L.n}</b>${can ? `<button class="small ghost" data-a="wrLine" data-v="${k}|1" aria-label="more forges">+</button>` : ""}</td><td>${L.n ? UI.bar(L.eff * 100, 100) : '<span class="tiny muted">—</span>'}</td><td>${per ? "+" + A.fmt(per) : "—"}</td><td class="${status}-t">${A.fmt(st)}</td><td>${needTxt}</td></tr>`;
  }
  if (
    ((h +=
      '</tbody></table></div><div class="tiny muted">Efficiency climbs the longer a line runs; moving forges to a new line starts them over at 15%. "Needed" is what your divisions lack right now (red) or the reserve the quartermasters aim for.</div>'),
    (h += `<div class="group-h">Construction <span class="tiny muted">— ${free} workshops free, at most 15 per project</span></div>`),
    (h += I.cq.length
      ? I.cq
          .map(
            (q, i) =>
              `<div class="wr-build"><span class="grow small">${UI.esc(GD.BUILD[q.k].name)} · ${UI.esc(A.provName(q.prov))}</span>${UI.bar(q.prog, q.cost)}<span class="tiny muted">${q.civ ? `~${Math.ceil(Math.max(0, q.cost - q.prog) / Math.max(1, q.civ * 30 * (0.6 + (0.4 * r.stability) / 100)))} mo` : "waiting"}</span>${can ? `<button class="small ghost" data-a="wrUnbuild" data-v="${i}" aria-label="Cancel">${UI.wrIcon("x")}</button>` : ""}</div>`,
          )
          .join("")
      : '<div class="tiny muted">Nothing queued.</div>'),
    can)
  ) {
    const ps = A.realmProvs(r.id)
        .filter(p => !p.occ)
        .sort((a, b) => b.pop - a.pop),
      sel = UI.wr.buildProv != null && ps.some(p => p.id === UI.wr.buildProv) ? UI.wr.buildProv : (ps[0] || {}).id;
    UI.wr.buildProv = sel;
    if (A.S.prov[sel])
      h += `<div class="card small wr-buildnew"><div class="row">Build in <select data-c="wrBuildProv" aria-label="Province">${ps.map(p => `<option value="${p.id}" ${p.id === sel ? "selected" : ""}>${UI.esc(p.name)} (${A.provUsed(p)}/${A.provSlots(p)} slots${p.fort ? ", walls " + p.fort : ""})</option>`).join("")}</select></div><div class="row wrap">${Object.entries(
        GD.BUILD,
      )
        .map(
          ([k, B]) =>
            `<button class="small" data-a="wrBuild" data-v="${k}" title="${UI.esc(B.desc)}">${UI.wrIcon(
              {
                forge: "factory",
                workshop: "hammer",
                walls: "castle",
                depot: "package",
                road: "route",
              }[k],
            )}${UI.esc(B.name)}</button>`,
        )
        .join("")}</div></div>`;
  }
  return h;
};

UI.wrManpower = function () {
  const pc = A.pc(),
    R2 = A.cmdRole(pc),
    r = A.realm(UI.wrMyR(pc));
  if (!r) return "";
  A.F(r);
  const cap = r.levyCap || Math.max(r.levy, 1);
  let h = `<div class="card small"><div class="row"><b>Manpower</b><span class="right muted">${UI.esc(r.short)}</span></div>${UI.barRow("Pool", r.levy, Math.max(cap, r.levy), r.levy < cap * 0.2 ? "hpbar" : "", null, `${UI.kfmt(r.levy)}/${UI.kfmt(cap)}`)}<div class="tiny muted">The pool refills each year toward what your land and levy law can give (${r.levy >= cap * 0.98 ? "it is full now" : `about +${A.fmt(Math.max(0, Math.round((cap - r.levy) * 0.2)))} next year`}). Training a division takes its men at once; refits draw on the pool all the time.</div></div>`;
  if (A.LEVY)
    h += `<div class="group-h">Levy law</div><div class="wr-laws">${A.LEVY.map(([n, mul, op, d], i) => `<button class="small ${r.laws.levy === i ? "on" : ""}" data-a="setLaw" data-v="levy|${i}" ${pc.ruler ? "" : "disabled"}><b>${UI.esc(n)}</b><small>${UI.esc(d)} Pool ×${mul}.</small></button>`).join("")}</div>`;
  h += '<div class="group-h">Train a division</div>';
  for (const t of Object.values(r.forces.tpl)) {
    const s = A.tplS(r.id, t.id),
      cost = Math.round(s.men * 4 + s.cost * 6),
      days = Math.round(90 + s.n * 6 + (s.cats.horse + s.cats.beast) * 12),
      eqOk = Object.entries(s.eq).every(([k, v]) => (r.ind.stock[k] || 0) >= v * 0.5);
    h += `<div class="wr-trainrow"><div class="grow"><b class="small">${UI.esc(t.name)}</b><div class="tiny muted">${A.fmt(s.men)} men · ${A.coin(cost)} · ${Math.round(days / 30)} months · ${eqOk ? "kit in the depots" : '<span class="warn-t">kit short: it will start under-equipped</span>'}</div></div><button class="small ${R2.recruit ? "primary" : ""}" data-a="wrTrain" data-v="${t.id}" ${R2.recruit ? "" : "disabled"}>${UI.wrIcon("plus")}Train</button></div>`;
  }
  if (
    (r.forces.queue.length &&
      (h += `<div class="group-h">In the drill yards</div>${r.forces.queue
        .map((q, i) => {
          const t = r.forces.tpl[q.tpl];
          return `<div class="wr-build"><span class="grow small">${UI.esc(t ? t.name : "?")} · ${A.fmt(q.men)} men</span>${UI.bar(q.days - q.left, q.days)}<span class="tiny muted">${Math.ceil(Math.max(0, q.left) / 30)} mo</span>${R2.recruit ? `<button class="small ghost" data-a="wrCancelTrain" data-v="${i}" aria-label="Cancel">${UI.wrIcon("x")}</button>` : ""}</div>`;
        })
        .join("")}`),
    pc.ruler)
  ) {
    const weak = r.forces.divs
      .filter(d => !d.army || !A.atWar(r.id).length)
      .sort((a, b) => a.men - b.men)
      .slice(0, 6);
    if (weak.length)
      h += `<div class="group-h">Disband <span class="tiny muted">— men go back to the pool, kit to the depots</span></div>${weak.map(d => `<div class="wr-build"><span class="grow small">${UI.esc(d.name)} · ${A.fmt(d.men)} men</span><button class="small ghost" data-a="wrDisband" data-v="${d.id}">${UI.wrIcon("trash")}Disband</button></div>`).join("")}`;
  }
  return h;
};

UI.wrWars = function () {
  const pc = A.pc(),
    myR = UI.wrMyR(pc),
    S = A.S;
  if (UI.wr.peace && UI.peacePanel)
    return `<div class="row"><button class="small" data-a="wrPeaceT" data-v="">${UI.wrIcon("arrow-right")} Back</button></div>${UI.peacePanel(UI.wr.peace)}`;
  const ws = A.atWar(myR);
  if (!ws.length)
    return `<div class="card small">${UI.wrIcon("handshake")} ${UI.esc(A.realmShort(myR))} is at peace.${
      S.wars.length
        ? ` Elsewhere: ${S.wars
            .slice(0, 4)
            .map(w => UI.esc(w.name))
            .join(", ")}.`
        : ""
    }</div>`;
  let h = "";
  for (const w of ws) {
    const side = A.warSide(w, myR),
      sc = side === "att" ? w.score : -w.score,
      mine = side === "att" ? w.att : w.def,
      theirs = side === "att" ? w.def : w.att,
      held = S.prov.filter(p => theirs.includes(p.owner) && mine.includes(p.occ)).length,
      lost = S.prov.filter(p => mine.includes(p.owner) && theirs.includes(p.occ)).length;
    // [X1 baked patch diplomacy/68-reasons-for-war CB-WAR-ROOM] UI.wrWars: each war in the war room shows why it
    // began, the casus belli recorded when it was declared (UI.csWarLine, w.casus). In the source: one line under the
    // sides of each war.
    h += `<div class="card"><div class="row"><b>${UI.esc(w.name)}</b><span class="right tiny muted">since ${w.start}</span></div><div class="tiny muted">${mine.map(A.realmShort).join(", ")} <b>vs</b> ${theirs.map(A.realmShort).join(", ")}</div>${UI.csWarLine ? UI.csWarLine(w) : ""}
      <div class="wrscore"><i style="left:${50 + sc / 2}%"></i></div><div class="small">War score <b class="${sc > 0 ? "good" : sc < 0 ? "bad" : ""}-t">${sc > 0 ? "+" : ""}${sc}</b> · you hold ${held} of their provinces, they hold ${lost} of yours · ${w.nb || w.battles.length} battles</div>
      <div class="tiny muted">The score comes from enemy land you occupy (capitals count double) and battles won. At +25 you can demand what you hold.</div>
      ${
        w.battles.length
          ? `<div class="group-h">Great battles</div>${w.battles
              .slice(-6)
              .reverse()
              .map(
                b =>
                  `<div class="tiny">${b.win === side ? '<span class="good-t">Won</span>' : '<span class="bad-t">Lost</span>'} · ${UI.esc(b.name)} (${b.y}) · ${A.fmt((b.lossW || 0) + (b.lossL || 0))} dead${b.days ? ` · ${b.days} days` : ""}</div>`,
              )
              .join("")}`
          : ""
      }
      ${pc.ruler && (w.leadA === pc.ruler || w.leadD === pc.ruler) ? `<div class="row wrap" style="margin-top:6px">${UI.peacePanel ? `<button class="small primary" data-a="wrPeaceT" data-v="${w.id}">${UI.wrIcon("handshake")}Peace table</button>` : ""}<button class="small" data-a="wrPeace" data-v="${w.id}|white">White peace</button>${sc >= 25 ? `<button class="small" data-a="wrPeace" data-v="${w.id}|demand">Demand what you hold</button>` : ""}<button class="small danger" data-a="wrPeace" data-v="${w.id}|concede">Concede</button></div>` : pc.ruler ? '<div class="tiny muted">Only the war leader makes peace.</div>' : ""}</div>`;
  }
  const news = S.news.filter(n => ["battle", "map", "war", "peace"].includes(n.c)).slice(0, 8);
  // [X1 baked patch world/26-belief-versus-truth BT-NEWS-NOTE] Far news is now set down as it was first told
  // (inflated counts) and corrected months later (belief.core.js). The world news list and the war room dispatches
  // add A.BT.newsNote(n) after each line: "(hearsay)" or "(the count ran high...)".
  if (news.length)
    h += `<div class="group-h">Dispatches</div>${news.map(n => `<div class="tiny">${UI.esc(n.t)}<span class="muted">${UI.esc(A.BT ? A.BT.newsNote(n) : "")}</span></div>`).join("")}`;
  return h;
};

UI.wrView = function () {
  const pc = A.pc(),
    S = A.S,
    myR = UI.wrMyR(pc),
    realms = new Set([myR]);
  for (const w2 of S.wars) if (A.warSide(w2, myR)) for (const r of w2.att.concat(w2.def)) realms.add(r);
  let x0 = 1e9,
    y0 = 1e9,
    x1 = -1e9,
    y1 = -1e9;
  const add = p => {
    x0 = Math.min(x0, p.sx);
    y0 = Math.min(y0, p.sy);
    x1 = Math.max(x1, p.sx);
    y1 = Math.max(y1, p.sy);
  };
  if (A.atWar(myR).length)
    for (const p of S.prov)
      if (A.frontProvs && realms.has(A.ctrl(p)) && p.adj.some(j => A.hostile(A.ctrl(p), A.ctrl(S.prov[j])))) add(p);
  if (x0 > x1) for (const p of S.prov) if (realms.has(p.owner) || realms.has(p.occ)) add(p);
  if (x0 > x1) {
    x0 = 0;
    y0 = 0;
    x1 = 7e3;
    y1 = 4500;
  }
  const pad = 520;
  x0 -= pad;
  y0 -= pad;
  x1 += pad;
  y1 += pad;
  const asp = UI.wr.asp || 1100 / 720;
  let w = Math.max(x1 - x0, 2600),
    h = y1 - y0;
  if (((x0 = (x0 + x1) / 2 - w / 2), w / h > asp)) {
    const nh = w / asp;
    y0 -= (nh - h) / 2;
    h = nh;
  } else {
    const nw = h * asp;
    x0 -= (nw - w) / 2;
    w = nw;
  }
  return {
    x0,
    y0,
    w,
    h,
  };
};

UI.wrClamp = function (v) {
  const asp = UI.wr.asp || 1.5277777777777777;
  v.w = A.clamp(v.w, 500, 7e3);
  v.h = v.w / asp;
  if (v.h > 4500) {
    v.h = 4500;
    v.w = v.h * asp;
  }
  v.x0 = A.clamp(v.x0, 0, Math.max(0, 7e3 - v.w));
  v.y0 = A.clamp(v.y0, 0, Math.max(0, 4500 - v.h));
  return v;
};

UI.wrZoom = function (f, cx, cy) {
  const v = UI.wr.view || (UI.wr.view = UI.wrClamp(UI.wrView())),
    px = cx ?? 0.5,
    py = cy ?? 0.5,
    kx = v.x0 + v.w * px,
    ky = v.y0 + v.h * py;
  v.w = v.w / f;
  v.h = v.h / f;
  v.x0 = kx - v.w * px;
  v.y0 = ky - v.h * py;
  UI.wrClamp(v);
};

UI.wrFitCanvas = function (cv) {
  const w = cv.clientWidth || 1100;
  if (w < 50) return;
  const top = cv.getBoundingClientRect().top,
    mobile = window.innerWidth <= 900,
    want = mobile ? Math.min(window.innerHeight * 0.62, w * 1.15) : Math.min(window.innerHeight - top - 135, w * 0.95),
    h = Math.max(mobile ? 300 : 380, want),
    H = Math.round((1100 * h) / w);
  if (Math.abs(cv.height - H) > 4) {
    cv.width = 1100;
    cv.height = H;
  }
  const asp = cv.width / cv.height;
  if (Math.abs((UI.wr.asp || 0) - asp) > 0.001) {
    UI.wr.asp = asp;
    if (UI.wr.view) UI.wrClamp(UI.wr.view);
  }
};

UI.wrOverlay = function (mode, myR) {
  MAP.init();
  const S = A.S,
    sup = mode === "supply" ? A.supplyMap(myR) : null,
    key =
      mode +
      "|" +
      myR +
      "|" +
      S.prov.map(p => p.occ || p.owner).join(",") +
      "|" +
      S.wars.map(w => w.id + w.att.length + w.def.length).join(",") +
      (sup ? "|" + Math.floor((S.warClock || 0) / 7) : "");
  if (((UI.wrOvCache = UI.wrOvCache || {}), UI.wrOvCache.key === key)) return UI.wrOvCache.cv;
  const { gw, gh, grid } = MAP,
    cv = UI.wrOvCache.cv && UI.wrOvCache.cv.width === gw ? UI.wrOvCache.cv : document.createElement("canvas");
  cv.width = gw;
  cv.height = gh;
  const ctx = cv.getContext("2d"),
    im = ctx.createImageData(gw, gh),
    d = im.data,
    sideCol = {
      me: [232, 195, 90],
      ally: [121, 180, 230],
      foe: [224, 100, 79],
      neutral: [128, 124, 114],
    },
    ctrl = S.prov.map(p => A.ctrl(p)),
    base = S.prov.map(p => {
      if (mode === "supply") {
        const v = A.clamp(sup[p.id] / 3, 0, 1);
        return MAP.cb()
          ? [Math.round(70 + 170 * v), Math.round(40 + 180 * v), Math.round(120 - 60 * v)]
          : [Math.round(220 - 150 * v), Math.round(70 + 140 * v), 70];
      }
      return sideCol[UI.wrSideOf(p.owner, myR)] || sideCol.neutral;
    }),
    occ = S.prov.map(p => (p.occ ? sideCol[UI.wrSideOf(p.occ, myR)] : null)),
    alpha = S.prov.map(p =>
      mode === "terrain" ? 0 : mode === "supply" ? 150 : UI.wrSideOf(p.owner, myR) === "neutral" && !p.occ ? 70 : 140,
    );
  for (let y = 0; y < gh; y++)
    for (let x = 0; x < gw; x++) {
      const i = y * gw + x,
        pv = grid[i],
        o = i * 4;
      if (pv < 0) {
        d[o + 3] = 0;
        continue;
      }
      const r = x + 1 < gw ? grid[i + 1] : -1,
        dn = y + 1 < gh ? grid[i + gw] : -1;
      if ((r >= 0 && ctrl[r] !== ctrl[pv]) || (dn >= 0 && ctrl[dn] !== ctrl[pv])) {
        d[o] = 18;
        d[o + 1] = 14;
        d[o + 2] = 10;
        d[o + 3] = 210;
        continue;
      }
      if ((r >= 0 && r !== pv) || (dn >= 0 && dn !== pv)) {
        d[o] = 18;
        d[o + 1] = 14;
        d[o + 2] = 10;
        d[o + 3] = 70;
        continue;
      }
      let c = base[pv];
      if (occ[pv] && mode !== "supply" && (x + y) % 8 < 4) c = occ[pv];
      d[o] = c[0];
      d[o + 1] = c[1];
      d[o + 2] = c[2];
      d[o + 3] = alpha[pv];
    }
  ctx.putImageData(im, 0, 0);
  UI.wrOvCache = {
    key,
    cv,
  };
  return cv;
};

UI.wrArrow = function (ctx, x1, y1, x2, y2, col, lw, dash, K) {
  const dx = x2 - x1,
    dy = y2 - y1,
    L = Math.hypot(dx, dy);
  if (L < 4) return;
  const ux = dx / L,
    uy = dy / L,
    cut = Math.min(L * 0.3, 14 * K),
    ax = x1 + ux * cut,
    ay = y1 + uy * cut,
    bx = x2 - ux * cut,
    by = y2 - uy * cut;
  ctx.save();
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.stroke();
  ctx.setLineDash([]);
  const hs = Math.max(7, lw * 3);
  ctx.beginPath();
  ctx.moveTo(bx + ux * 2, by + uy * 2);
  ctx.lineTo(bx - ux * hs - uy * hs * 0.6, by - uy * hs + ux * hs * 0.6);
  ctx.lineTo(bx - ux * hs + uy * hs * 0.6, by - uy * hs - ux * hs * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

UI.drawWarBasic = function (cv) {
  MAP.init();
  const ctx = cv.getContext("2d"),
    W = cv.width,
    H = cv.height,
    v = UI.wr.view || (UI.wr.view = UI.wrClamp(UI.wrView())),
    S = A.S,
    pc = A.pc(),
    R2 = A.cmdRole(pc),
    myR = UI.wrMyR(pc);
  // [X1 baked patch map/62-inked-map IM-GROUND-VIEW] The zoomable maps (the full map UI.gmDraw and the war room
  // UI.drawWarBasic) ask MAP.ground for the inked ground of their view rectangle v before falling back to the relief
  // picture.
  if (
    !(MAP.ground && MAP.ground(ctx, W, H, v)) &&
    ((ctx.fillStyle = "#1d3b57"), ctx.fillRect(0, 0, W, H), MAP.img && MAP.img.complete && MAP.img.naturalWidth)
  ) {
    const iw = MAP.img.naturalWidth,
      ih = MAP.img.naturalHeight;
    ctx.drawImage(MAP.img, (v.x0 / 7e3) * iw, (v.y0 / 4500) * ih, (v.w / 7e3) * iw, (v.h / 4500) * ih, 0, 0, W, H);
  }
  const sx = (v.x0 / 7e3) * MAP.gw,
    sy = (v.y0 / 4500) * MAP.gh,
    sw = (v.w / 7e3) * MAP.gw,
    sh = (v.h / 4500) * MAP.gh,
    zoom = 7e3 / v.w;
  ctx.imageSmoothingEnabled = zoom > 1.4;
  ctx.drawImage(UI.wrOverlay(UI.wr.mode || "sides", myR), sx, sy, sw, sh, 0, 0, W, H);
  if (A.atWar(myR).length) ctx.drawImage(MAP.front(myR), sx, sy, sw, sh, 0, 0, W, H);
  // [X1 baked patch map/62-inked-map IM-LINES] Right after each map lays its realm colours (MAP.draw, the full map,
  // the war room), MAP.inkLines inks the borders, towns and keeps over them, so the wash never greys the line work.
  ctx.imageSmoothingEnabled = true;
  if (MAP.inkLines) MAP.inkLines(ctx, W, H, v);
  const disp = (cv.getBoundingClientRect && cv.getBoundingClientRect().width) || W,
    K = A.clamp((W / Math.max(1, disp)) * 0.95, 0.9, 2.4) * A.clamp(0.75 + zoom * 0.08, 0.8, 1.15),
    P = (kx, ky) => [((kx - v.x0) / v.w) * W, ((ky - v.y0) / v.h) * H],
    vis = (x, y, m = 60) => x > -m && y > -m && x < W + m && y < H + m;
  if (zoom >= 1.7) {
    ctx.font = `${Math.round(10.5 * K)}px Georgia, serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    for (const p of S.prov) {
      const [x, y] = P(p.sx, p.sy);
      if (vis(x, y)) {
        // [X1 baked patch map/62-inked-map IM-WAR-NAMES] In the war room, province names are written in ink on a paper
        // halo while the inked map is on; the release's cream-on-shadow names are kept for the relief map.
        if (MAP.inkOn && MAP.inkOn()) MAP.inkLabel(ctx, p.name, x, y + 24 * K, p.occ);
        else {
          ctx.fillStyle = "rgba(15,12,9,.85)";
          ctx.fillText(p.name, x + 0.8, y + 24 * K + 0.8);
          ctx.fillStyle = p.occ ? "#ffcf9a" : "#f1e6c8";
          ctx.fillText(p.name, x, y + 24 * K);
        }
      }
    }
  }
  for (const p of S.prov) {
    const [x, y] = P(p.sx, p.sy);
    if (vis(x, y)) {
      if ((p.fort || 0) >= 1 && zoom >= 1.3) {
        ctx.fillStyle = "#d8b25e";
        ctx.strokeStyle = "#111";
        ctx.lineWidth = 1;
        const s = (3 + Math.min(4, p.fort)) * K * 0.7;
        ctx.fillRect(x - s / 2 - 22 * K, y - s / 2 + 14 * K, s, s);
        ctx.strokeRect(x - s / 2 - 22 * K, y - s / 2 + 14 * K, s, s);
      }
      if (p.depot && zoom >= 1.3) {
        ctx.fillStyle = "#9fd18a";
        ctx.beginPath();
        ctx.arc(x + 22 * K, y + 15 * K, 3.5 * K, 0, Math.PI * 2);
        ctx.fill();
      }
      if (p.sgBy && p.sgNeed) {
        ctx.strokeStyle = "#f2c84b";
        ctx.lineWidth = 3 * K;
        ctx.beginPath();
        ctx.arc(x, y, 26 * K, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * A.clamp(p.sgd / p.sgNeed, 0, 1));
        ctx.stroke();
      }
    }
  }
  for (const id in S.realms) {
    const r = S.realms[id];
    if (!r.alive || r.capitalProv == null) continue;
    const p = A.prov(r.capitalProv);
    if (!p) continue;
    const [x, y] = P(p.sx, p.sy);
    // [X1 baked patch map/62-inked-map IM-WAR-CAPITAL] In the war room the capital is drawn as a keep by the inked
    // ground, so the release's cream dot above it is skipped while the inked map is on.
    if (vis(x, y) && !(MAP.inkOn && MAP.inkOn())) {
      ctx.fillStyle = "#fff2b8";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(x, y - 18 * K, 3.5 * K, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
  const sel = UI.wr.sel;
  if (sel && sel.k === "army") {
    const a = A.army(sel.id);
    if (a) {
      for (const d of A.armyDivs(a))
        if (d.post != null) {
          const q = S.prov[d.post],
            [x, y] = P(q.sx, q.sy);
          ctx.strokeStyle = "rgba(242,200,75,.8)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, 30 * K, 0, Math.PI * 2);
          ctx.stroke();
        }
      if (a.order.obj != null) {
        const q = S.prov[a.order.obj],
          [x, y] = P(q.sx, q.sy);
        ctx.strokeStyle = "#ffeb9a";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 16 * K, 0, Math.PI * 2);
        ctx.moveTo(x - 24 * K, y);
        ctx.lineTo(x + 24 * K, y);
        ctx.moveTo(x, y - 24 * K);
        ctx.lineTo(x, y + 24 * K);
        ctx.stroke();
      }
    }
  }
  for (const a of A.armiesOf(myR)) {
    if (a.order.obj == null || a.order.k === "hold") continue;
    const ds = A.armyDivs(a);
    if (!ds.length) continue;
    let mx = 0,
      my = 0;
    for (const d of ds) {
      const q = S.prov[d.loc];
      mx += q.sx;
      my += q.sy;
    }
    mx /= ds.length;
    my /= ds.length;
    const o = S.prov[a.order.obj],
      [x1, y1] = P(mx, my),
      [x2, y2] = P(o.sx, o.sy),
      on = sel && sel.k === "army" && sel.id === a.id;
    UI.wrArrow(ctx, x1, y1, x2, y2, on ? "rgba(255,224,138,.75)" : "rgba(255,224,138,.35)", (on ? 9 : 6) * K, null, K);
  }
  const divs = A.allDivs(),
    selIds = new Set(sel && sel.k === "divs" ? sel.ids : []);
  for (const d of divs) {
    if (d.atk != null) {
      const a = S.prov[d.loc],
        b = S.prov[d.atk],
        [x1, y1] = P(a.sx, a.sy),
        [x2, y2] = P(b.sx, b.sy);
      if (vis(x1, y1, 200) || vis(x2, y2, 200))
        UI.wrArrow(
          ctx,
          x1,
          y1,
          x2,
          y2,
          UI.wrSideOf(d.r, myR) === "foe" ? "rgba(224,100,79,.95)" : "rgba(242,200,75,.95)",
          4 * K,
          null,
          K,
        );
      continue;
    }
    if (!d.path || !d.path.length) continue;
    const selA = sel && sel.k === "army" && d.army === sel.id;
    if (!selIds.has(d.id) && !selA && !(d.manual && R2.divs.has(d.id))) continue;
    const pts = [d.loc].concat(d.path).map(j => P(S.prov[j].sx, S.prov[j].sy));
    ctx.save();
    ctx.strokeStyle = selIds.has(d.id) ? "#ffe08a" : "rgba(255,224,138,.6)";
    ctx.lineWidth = selIds.has(d.id) ? 2.6 * K : 1.4 * K;
    ctx.setLineDash([6 * K, 5 * K]);
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (const [x, y] of pts.slice(1)) ctx.lineTo(x, y);
    if ((ctx.stroke(), ctx.restore(), selIds.has(d.id))) {
      const [x, y] = pts[pts.length - 1];
      ctx.fillStyle = "#ffe08a";
      ctx.beginPath();
      ctx.arc(x, y, 4 * K, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  UI.wr.hits = [];
  UI.wr.stackTop = {};
  const groups = new Map();
  for (const d of divs) {
    const k = d.loc + "|" + d.r;
    let g = groups.get(k);
    if (!g)
      groups.set(
        k,
        (g = {
          loc: d.loc,
          r: d.r,
          ds: [],
        }),
      );
    g.ds.push(d);
  }
  const perLoc = {};
  for (const g of groups.values()) (perLoc[g.loc] = perLoc[g.loc] || []).push(g);
  const youId = pc.mil && pc.mil.div,
    single = zoom >= 3.4;
  if (!single) {
    const spots = [];
    for (const loc in perLoc) {
      const p = S.prov[loc],
        [x, y] = P(p.sx, p.sy);
      if (vis(x, y, 80))
        perLoc[loc].forEach((g, gi) =>
          spots.push({
            g,
            x: x + (gi - (perLoc[loc].length - 1) / 2) * 60 * K,
            y,
            loc: +loc,
          }),
        );
    }
    const minD = 46 * K,
      merged = [];
    for (const sp of spots.sort((a, b) => b.g.ds.length - a.g.ds.length)) {
      const m = merged.find(o => o.g.r === sp.g.r && Math.abs(o.x - sp.x) < minD && Math.abs(o.y - sp.y) < minD * 0.8);
      if (m)
        m.g = {
          loc: m.g.loc,
          r: m.g.r,
          ds: m.g.ds.concat(sp.g.ds),
          locs: (m.g.locs || [m.g.loc]).concat([sp.g.loc]),
        };
      else
        merged.push({
          g: sp.g,
          x: sp.x,
          y: sp.y,
          loc: sp.loc,
        });
    }
    for (const o of merged) {
      const g = o.g,
        u = g.ds,
        rr = A.realm(g.r),
        side = UI.wrSideOf(g.r, myR),
        intel = side !== "foe" || u.some(d => UI.wrIntel(d)),
        men = u.reduce((s2, d) => s2 + d.men, 0),
        mo = u.reduce((s2, d) => s2 + A.divMaxOrg(d), 0),
        org = u.reduce((s2, d) => s2 + d.org, 0),
        full = u.reduce((s2, d) => s2 + A.divS(d).men, 0),
        cats = {};
      for (const d of u) {
        const c = A.divS(d).main;
        cats[c] = (cats[c] || 0) + 1;
      }
      const cat = Object.keys(cats).sort((a, b) => cats[b] - cats[a])[0],
        label =
          u.length === 1
            ? men >= 1e3
              ? (men / 1e3).toFixed(men >= 9950 ? 0 : 1) + "k"
              : String(men)
            : String(u.length),
        box = UI.wrCounter(ctx, o.x, o.y, K, {
          color: rr ? MAP.realmColor(rr) : "#999",
          cat: cat === "missile" ? "missile" : cat,
          label: intel ? label : "?",
          org: intel ? org / Math.max(1, mo) : 0,
          str: intel ? men / Math.max(1, full) : 0,
          sel: u.some(d => selIds.has(d.id)),
          mine: u.some(d => R2.divs.has(d.id)),
          side,
          atk: u.some(d => d.atk != null),
          hungry: u.some(d => d.sr != null && d.sr < 0.6),
          siege: u.some(d => d.sieging),
          you: u.some(d => d.id === youId),
          comp: UI.wrComp ? UI.wrComp(u) : null,
          elite: u.some(d => d.elite),
          code: UI.realmCode ? UI.realmCode(g.r) : "",
        });
      UI.wr.hits.push({
        t: "stack",
        loc: o.loc,
        r: g.r,
        ids: u.map(d => d.id),
        x: o.x,
        y: o.y + 3 * K,
        w: box.w + 8,
        h: box.h + 8,
      });
    }
  }
  for (const loc in single ? perLoc : {}) {
    const p = S.prov[loc],
      [cx, cy] = P(p.sx, p.sy);
    if (!vis(cx, cy, 80)) continue;
    const list = perLoc[loc].sort((a, b) => (a.r === myR ? -1 : 0) - (b.r === myR ? -1 : 0));
    list.forEach((g, gi) => {
      const rr = A.realm(g.r),
        col = rr ? MAP.realmColor(rr) : "#999",
        side = UI.wrSideOf(g.r, myR),
        intel = side !== "foe" || g.ds.some(d => UI.wrIntel(d)),
        units = single && g.ds.length <= 6 ? g.ds.map(d => [d]) : [g.ds],
        off = (gi - (list.length - 1) / 2) * (single && g.ds.length > 1 ? 180 : 60) * K;
      UI.wr.stackTop = UI.wr.stackTop || {};
      UI.wr.stackTop[loc] = Math.min(
        UI.wr.stackTop[loc] != null ? UI.wr.stackTop[loc] : 0,
        single && g.ds.length > 3 ? -19 * K : 0,
      );
      units.forEach((u, ui) => {
        const cols = Math.min(3, units.length),
          x = cx + off + (units.length > 1 ? ((ui % cols) - (cols - 1) / 2) * 58 * K : 0),
          y = cy + (units.length > 1 ? Math.floor(ui / cols) * 38 * K - (units.length > 3 ? 19 * K : 0) : 0),
          men = u.reduce((s2, d) => s2 + d.men, 0),
          mo = u.reduce((s2, d) => s2 + A.divMaxOrg(d), 0),
          org = u.reduce((s2, d) => s2 + d.org, 0),
          full = u.reduce((s2, d) => s2 + A.divS(d).men, 0),
          cats = {};
        for (const d of u) {
          const c = A.divS(d).main;
          cats[c] = (cats[c] || 0) + 1;
        }
        const cat = Object.keys(cats).sort((a, b) => cats[b] - cats[a])[0],
          mine = u.some(d => R2.divs.has(d.id)),
          isSel = u.some(d => selIds.has(d.id)),
          label =
            u.length === 1
              ? men >= 1e3
                ? (men / 1e3).toFixed(men >= 9950 ? 0 : 1) + "k"
                : String(men)
              : String(u.length),
          box = UI.wrCounter(ctx, x, y, K, {
            color: col,
            cat: cat === "missile" ? "missile" : cat,
            label: intel ? label : "?",
            org: intel ? org / Math.max(1, mo) : 0,
            str: intel ? men / Math.max(1, full) : 0,
            sel: isSel,
            mine,
            side,
            atk: u.some(d => d.atk != null),
            hungry: u.some(d => d.sr != null && d.sr < 0.6),
            siege: u.some(d => d.sieging),
            you: u.some(d => d.id === youId),
            comp: UI.wrComp ? UI.wrComp(u) : null,
            elite: u.some(d => d.elite),
            code: UI.realmCode ? UI.realmCode(g.r) : "",
          });
        UI.wr.hits.push({
          t: "stack",
          loc: +loc,
          r: g.r,
          ids: u.map(d => d.id),
          x,
          y: y + 3 * K,
          w: box.w + 8,
          h: box.h + 8,
        });
      });
    });
  }
  for (const k in S.fights || {}) {
    const F = S.fights[k],
      p = S.prov[F.loc],
      [x, y0] = P(p.sx, p.sy);
    if (!vis(x, y0)) continue;
    const y = y0 - 34 * K + (UI.wr.stackTop[F.loc] || 0),
      st = A.fightState(F),
      my = A.friendly(F.a, myR) ? st.share : A.friendly(F.b, myR) ? 1 - st.share : null;
    ctx.save();
    ctx.fillStyle = "rgba(20,16,12,.92)";
    ctx.strokeStyle = my == null ? "#ddd" : my > 0.55 ? "#6fcf6a" : my < 0.45 ? "#e0644f" : "#f2c84b";
    ctx.lineWidth = 2.4 * K;
    ctx.beginPath();
    ctx.arc(x, y, 12 * K, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#f4ead4";
    ctx.lineWidth = 2 * K;
    ctx.beginPath();
    ctx.moveTo(x - 6 * K, y - 6 * K);
    ctx.lineTo(x + 6 * K, y + 6 * K);
    ctx.moveTo(x + 6 * K, y - 6 * K);
    ctx.lineTo(x - 6 * K, y + 6 * K);
    ctx.stroke();
    ctx.fillStyle = "#111";
    ctx.fillRect(x - 14 * K, y + 14 * K, 28 * K, 4 * K);
    ctx.fillStyle = "#e0a640";
    ctx.fillRect(x - 14 * K, y + 14 * K, 28 * K * st.share, 4 * K);
    if (UI.wr.sel && UI.wr.sel.k === "fight" && UI.wr.sel.pid === F.loc) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 16 * K, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    UI.wr.hits.push({
      t: "fight",
      pid: F.loc,
      x,
      y,
      r: 15 * K,
    });
  }
  ctx.font = `${Math.round(11 * Math.min(K, 1.6))}px system-ui, sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillStyle = "rgba(255,255,255,.85)";
  ctx.strokeStyle = "rgba(0,0,0,.7)";
  ctx.lineWidth = 3;
  const note = single ? "One counter per division" : "Zoom in to split stacks";
  ctx.strokeText(note, W - 10, 10);
  ctx.fillText(note, W - 10, 10);
};

UI.wrProvAt = function (cv, ev) {
  const r = cv.getBoundingClientRect(),
    v = UI.wr.view,
    kx = v.x0 + ((ev.clientX - r.left) / r.width) * v.w,
    ky = v.y0 + ((ev.clientY - r.top) / r.height) * v.h,
    gx = Math.floor((kx / 7e3) * MAP.gw),
    gy = Math.floor((ky / 4500) * MAP.gh);
  return gx < 0 || gy < 0 || gx >= MAP.gw || gy >= MAP.gh ? -1 : MAP.grid[gy * MAP.gw + gx];
};

UI.wrHitAt = function (cv, ev) {
  const r = cv.getBoundingClientRect(),
    mx = ((ev.clientX - r.left) / r.width) * cv.width,
    my = ((ev.clientY - r.top) / r.height) * cv.height,
    hs = UI.wr.hits || [];
  let best = null,
    bd = 1 / 0;
  for (const h of hs) {
    if (
      !(h.t === "fight"
        ? Math.hypot(h.x - mx, h.y - my) <= h.r + 4
        : Math.abs(h.x - mx) <= h.w / 2 && Math.abs(h.y - my) <= h.h / 2)
    )
      continue;
    const dd = Math.hypot(h.x - mx, h.y - my) / (h.t === "fight" ? h.r : Math.min(h.w, h.h) / 2);
    if (dd < bd) {
      bd = dd;
      best = h;
    }
  }
  return best;
};

UI.wrTip = function (pid) {
  const S = A.S,
    p = A.prov(pid);
  if (!p) return "";
  const myR = UI.wrMyR(),
    r = A.realm(p.owner),
    ds = A.divsAt(pid),
    sup = A.supplyMap(myR)[pid],
    F = (S.fights || {})[pid],
    bySide = {};
  for (const d of ds) (bySide[d.r] = bySide[d.r] || []).push(d);
  return `<b>${UI.esc(p.name)}</b> — ${UI.esc(r ? r.short : "Unclaimed")}${p.occ ? ` <span style="color:#ffb27a">(held by ${UI.esc(A.realmShort(p.occ))})</span>` : ""}<br>${UI.esc(A.cap(p.terr))} · width ${A.WIDTH[p.terr] || 60} · attacker ×${A.ATK_TERR[p.terr] || 1}${p.fort ? ` · walls ${p.fort}` : ""}<br>Supply for you ${sup.toFixed(1)} (~${Math.max(0, Math.floor(sup / 0.65))} divisions)${F ? `<br><b style="color:#ffb27a">Battle, day ${F.days}</b>` : ""}${Object.entries(
    bySide,
  )
    .map(
      ([rid, L]) =>
        `<br>${UI.esc(A.realmShort(rid))}: ${L.length} div${L.length > 1 ? "s" : ""}${A.hostile(myR, rid) && !L.some(d => UI.wrIntel(d)) ? "" : `, ${A.fmt(L.reduce((x, d) => x + d.men, 0))} men`}`,
    )
    .join("")}`;
};

UI.wrAttach = function () {
  const cv = UI.$("#warmap");
  if (!cv) return;
  UI.wrFitCanvas(cv);
  UI.drawWar(cv);
  if (!UI.wrResize) {
    UI.wrResize = true;
    window.addEventListener("resize", () => {
      const c = UI.$("#warmap");
      if (c) {
        UI.wrFitCanvas(c);
        UI.drawWar(c);
      }
    });
  }
  const wrap = cv.parentElement,
    tip = wrap.querySelector(".maptip");
  let drag = null;
  cv.onpointerdown = ev => {
    if (ev.button !== 2)
      drag = {
        x: ev.clientX,
        y: ev.clientY,
        moved: false,
      };
  };
  cv.onpointerup = () => {
    if (drag && drag.moved) UI.wr.dragged = true;
    drag = null;
  };
  cv.onpointerleave = () => {
    drag = null;
    if (tip) tip.classList.add("hidden");
  };
  cv.onpointermove = ev => {
    if (drag) {
      const dx = ev.clientX - drag.x,
        dy = ev.clientY - drag.y;
      if (drag.moved || Math.hypot(dx, dy) > 5) {
        drag.moved = true;
        drag.x = ev.clientX;
        drag.y = ev.clientY;
        const r = cv.getBoundingClientRect(),
          v = UI.wr.view;
        v.x0 -= (dx / r.width) * v.w;
        v.y0 -= (dy / r.height) * v.h;
        UI.wrClamp(v);
        UI.drawWar(cv);
        // [X1 baked patch ui/59-descriptions TT-MAP-TIP-CLICK] UI: the world map (MAP.bind), the Atlas-less world view
        // (UI.gm) and the War Room showed a province card whenever the pointer moved over a province, which a phone never
        // does and which the owner's rule (descriptions open on click, never on hover) forbids. The card is now made by a
        // press on the province (the press still selects it as before); a second press on the same province, Esc, or a
        // press anywhere else closes it (UI.TT.hideMapTips). Drag is untouched.
        if (tip) tip.classList.add("hidden");
        return;
      }
    }
  };
  cv.__wrTip = ev => {
    if (!tip) return;
    const pid = UI.wrProvAt(cv, ev);
    if (pid < 0) {
      tip.classList.add("hidden");
      cv.__tipPid = -1;
      return;
    }
    if (pid === cv.__tipPid && !tip.classList.contains("hidden")) {
      tip.classList.add("hidden");
      cv.__tipPid = -1;
      return;
    }
    cv.__tipPid = pid;
    tip.innerHTML = UI.wrTip(pid);
    const wr = wrap.getBoundingClientRect();
    tip.style.left = Math.max(4, Math.min(wr.width - 280, ev.clientX - wr.left + 14)) + "px";
    tip.style.top = Math.min(wr.height - 120, ev.clientY - wr.top + 14) + "px";
    tip.classList.remove("hidden");
  };
  cv.onwheel = ev => {
    ev.preventDefault();
    const r = cv.getBoundingClientRect();
    UI.wrZoom(ev.deltaY < 0 ? 1.25 : 0.8, (ev.clientX - r.left) / r.width, (ev.clientY - r.top) / r.height);
    UI.drawWar(cv);
  };
  cv.oncontextmenu = ev => {
    ev.preventDefault();
    UI.wrMapOrder(cv, ev);
  };
  // [X1 baked patch ui/59-descriptions TT-MAP-TIP-CLICK] UI: the world map (MAP.bind), the Atlas-less world view
  // (UI.gm) and the War Room showed a province card whenever the pointer moved over a province, which a phone never
  // does and which the owner's rule (descriptions open on click, never on hover) forbids. The card is now made by a
  // press on the province (the press still selects it as before); a second press on the same province, Esc, or a
  // press anywhere else closes it (UI.TT.hideMapTips). Drag is untouched.
  cv.onclick = ev => {
    if (UI.wr.dragged) {
      UI.wr.dragged = false;
      return;
    }
    cv.__wrTip(ev);
    const pc = A.pc(),
      R2 = A.cmdRole(pc),
      hit = UI.wrHitAt(cv, ev),
      s = UI.wr.sel,
      ordering =
        s && ((s.k === "divs" && s.ids.some(id => R2.divs.has(id))) || (s.k === "army" && R2.armies.has(s.id)));
    if (hit && hit.t === "fight" && !ordering) {
      UI.wr.sel = {
        k: "fight",
        pid: hit.pid,
      };
      UI.wr.tab = "cmd";
      UI.wr.msg = "";
      UI.wrRefresh();
      return;
    }
    if (hit && hit.t === "stack") {
      const mine = hit.ids.filter(id => R2.divs.has(id));
      if (ordering && !mine.length && A.hostile(UI.wrMyR(pc), hit.r)) {
        UI.wrMapOrder(cv, ev, hit.loc);
        return;
      }
      if (mine.length) {
        if ((ev.shiftKey || ev.ctrlKey || ev.metaKey) && s && s.k === "divs") {
          const set = new Set(s.ids),
            allIn = mine.every(id => set.has(id));
          for (const id of mine)
            if (allIn) set.delete(id);
            else set.add(id);
          UI.wr.sel = set.size
            ? {
                k: "divs",
                ids: [...set],
              }
            : null;
        } else
          UI.wr.sel = {
            k: "divs",
            ids: mine,
          };
      } else
        UI.wr.sel =
          hit.ids.length === 1
            ? {
                k: "divs",
                ids: hit.ids,
              }
            : {
                k: "prov",
                pid: hit.loc,
              };
      UI.wr.tab = "cmd";
      UI.wr.msg = "";
      UI.wrRefresh();
      return;
    }
    if (ordering) {
      UI.wrMapOrder(cv, ev);
      return;
    }
    const pid = UI.wrProvAt(cv, ev);
    UI.wr.sel =
      pid >= 0
        ? {
            k: "prov",
            pid,
          }
        : null;
    UI.wr.tab = "cmd";
    UI.wr.msg = "";
    UI.wrRefresh();
  };
};

UI.wrMapOrder = function (cv, ev, forced) {
  const pc = A.pc(),
    R2 = A.cmdRole(pc),
    s = UI.wr.sel,
    pid = forced ?? UI.wrProvAt(cv, ev);
  if (pid == null || pid < 0 || !s) return;
  if (s.k === "army" && R2.armies.has(s.id)) {
    const res = A.wsSetOrder(s.id, "obj", pid);
    UI.wr.msg = res.msg;
    UI.wrRefresh();
    return;
  }
  if (s.k !== "divs") return;
  const ds = s.ids.filter(id => R2.divs.has(id));
  if (!ds.length) return;
  let ok = 0,
    last = "";
  for (const id of ds) {
    const r = A.wsDivOrder(id, pid);
    if (r.ok) ok++;
    last = r.msg;
  }
  UI.wr.msg = ds.length === 1 ? last : ok ? `${ok} division${ok > 1 ? "s" : ""} ordered to ${A.provName(pid)}.` : last;
  UI.wrRefresh();
};

UI.wrRefreshBasic = function () {
  UI.wrValidateSel();
  const cv = UI.$("#warmap");
  if (cv) UI.drawWar(cv);
  const sd = UI.$("#wrSide");
  if (sd) {
    const st = sd.scrollTop;
    sd.innerHTML = UI.wrSide();
    sd.scrollTop = st;
  }
  const dt = UI.$("#wrDate");
  if (dt && A.atWar(UI.wrMyR()).length) dt.textContent = A.wrDate();
  const hn = UI.$("#wrHint");
  if (hn) hn.innerHTML = UI.wrHint();
  document.querySelectorAll('.wr-tabs [data-a="wrTab"]').forEach(b => {
    const on = b.dataset.v === UI.wr.tab;
    b.classList.toggle("on", on);
    b.setAttribute("aria-selected", on);
  });
  const body = UI.$(".wr-body");
  if (body) body.classList.toggle("wide", ["tpl", "ind", "mp"].includes(UI.wr.tab));
};

UI.wrTick = function () {
  const q = A.S && A.S.queue[0];
  if (!q || q.type !== "warroom" || !UI.wr.run) {
    UI.wrStop();
    if (q && q.type !== "warroom") UI.refresh();
    return;
  }
  const pc = A.pc();
  for (let i = 0; i < UI.wr.speed; i++) {
    if ((A.S.warClock || 0) >= 365) {
      UI.wrStop();
      UI.wr.msg = "The campaign season is over. Close the War Room and live out the year.";
      UI.renderModal();
      return;
    }
    if ((A.wsDay(), A.S.queue[0] !== q || !A.pc().alive)) {
      UI.wrStop();
      UI.refresh();
      return;
    }
    const R2 = A.cmdRole(pc);
    for (const k in A.S.fights || {}) {
      const F = A.S.fights[k],
        tag = F.loc + ":" + F.start;
      if (UI.wr.seen[tag]) continue;
      if (
        F.aIds.concat(F.dIds).some(id => R2.divs.has(id) || (pc.mil && id === pc.mil.div)) &&
        ((UI.wr.seen[tag] = 1), F.menA + F.menD > 4e3)
      ) {
        UI.wrStop();
        UI.wr.sel = {
          k: "fight",
          pid: F.loc,
        };
        UI.wr.tab = "cmd";
        UI.wr.msg = `Battle at ${A.provName(F.loc)}! Your troops are engaged. Look it over, then press Run.`;
        UI.renderModal();
        return;
      }
    }
  }
  UI.wrRefresh();
};

UI.wrRedrawSide = function () {
  const sd = UI.$("#wrSide");
  if (sd) {
    const st = sd.scrollTop;
    sd.innerHTML = UI.wrSide();
    sd.scrollTop = st;
  } else UI.renderModal();
};

Object.assign(UI.A, {
  wrSpeed(v) {
    UI.wr.speed = +v;
    UI.renderModal();
  },
  wrHelp() {
    UI.wr.help = !UI.wr.help;
    UI.renderModal();
  },
  wrTab(v) {
    UI.wr.tab = v;
    UI.wr.help = false;
    UI.wr.msg = "";
    if (v !== "tpl") UI.wr.tplEdit = null;
    UI.wrRefresh();
    const sd = UI.$("#wrSide");
    if (sd) sd.scrollTop = 0;
  },
  wrZoom(v) {
    if (v === "fit") UI.wr.view = UI.wrClamp(UI.wrView());
    else UI.wrZoom(+v);
    const cv = UI.$("#warmap");
    if (cv) UI.drawWar(cv);
  },
  wrMode(v) {
    UI.wr.mode = v;
    UI.renderModal();
  },
  wrFind() {
    const pc = A.pc(),
      ar = pc.mil && pc.mil.rank >= 7 && A.army(pc.mil.army);
    if (ar) {
      A.armySync(ar);
      const p2 = A.S.prov[ar.loc],
        v2 = UI.wr.view || (UI.wr.view = UI.wrClamp(UI.wrView()));
      v2.w = Math.min(v2.w, 2600);
      v2.h = v2.w / (UI.wr.asp || 1100 / 720);
      v2.x0 = p2.sx - v2.w / 2;
      v2.y0 = p2.sy - v2.h / 2;
      UI.wrClamp(v2);
      UI.wr.sel = {
        k: "army",
        id: ar.id,
      };
      UI.wr.tab = "cmd";
      UI.wrRefresh();
      return;
    }
    const d = pc.mil && A.divById(pc.mil.div);
    if (!d) return;
    const p = A.S.prov[d.loc],
      v = UI.wr.view || (UI.wr.view = UI.wrClamp(UI.wrView()));
    v.w = Math.min(v.w, 1800);
    v.h = v.w / (UI.wr.asp || 1100 / 720);
    v.x0 = p.sx - v.w / 2;
    v.y0 = p.sy - v.h / 2;
    UI.wrClamp(v);
    UI.wr.sel = {
      k: "divs",
      ids: [d.id],
    };
    UI.wr.tab = "cmd";
    UI.wrRefresh();
  },
  wrSelArmy(v) {
    UI.wr.sel = {
      k: "army",
      id: v,
    };
    UI.wr.tab = "cmd";
    UI.wr.msg = "";
    UI.wrRefresh();
  },
  wrSelArmyDivs(v) {
    const a = A.army(v);
    if (a) {
      UI.wr.sel = {
        k: "divs",
        ids: a.divs.slice(),
      };
      UI.wr.msg = "";
      UI.wrRefresh();
    }
  },
  wrSelDiv(v) {
    UI.wr.sel = {
      k: "divs",
      ids: [v],
    };
    UI.wr.tab = "cmd";
    UI.wr.msg = "";
    UI.wrRefresh();
  },
  wrSelFight(v) {
    UI.wr.sel = {
      k: "fight",
      pid: +v,
    };
    UI.wr.tab = "cmd";
    UI.wrRefresh();
  },
  wrOrder(v) {
    const [aid, k] = v.split("|"),
      r = A.wsSetOrder(aid, k);
    UI.wr.msg = r.msg;
    UI.wrRefresh();
  },
  wrObjClear(v) {
    const a = A.army(v);
    if (a && A.wsCanCommand(A.pc(), a)) {
      a.order.obj = null;
      UI.wr.msg = "Objective cleared.";
    }
    UI.wrRefresh();
  },
  wrSplit(v) {
    const b = A.wsSplit(v);
    UI.wr.msg = b ? `The army splits: the ${b.name} forms under its own general.` : "Cannot split it.";
    UI.wrRefresh();
  },
  wrMerge(v) {
    const n = A.wsMerge(v);
    UI.wr.msg = n ? `${n} army merged in.` : "No other army of yours with room to merge (24 divisions at most).";
    UI.wrRefresh();
  },
  wrDivHold(v) {
    for (const id of v.split(",")) A.wsDivHold(id);
    UI.wr.msg = "They halt and dig in.";
    UI.wrRefresh();
  },
  wrDivRejoin(v) {
    for (const id of v.split(",")) A.wsDivRejoin(id);
    UI.wr.msg = "Back under the army's plan.";
    UI.wrRefresh();
  },
  wrStance(v) {
    A.setStance(v);
    UI.wrRefresh();
  },
  wrVolunteer() {
    const r = A.volunteer();
    UI.wr.msg = r.msg || "";
    if (r.ok) A.log(r.msg, "war");
    UI.wrRefresh();
  },
  wrPeace(v) {
    const [wid, kind] = v.split("|"),
      r = A.wsOfferPeace(wid, kind);
    UI.wr.msg = r.msg;
    UI.wr.view = null;
    if (r.ok && !A.atWar(UI.wrMyR()).length) UI.wrStop();
    UI.renderModal();
  },
  wrTplNew() {
    const r = A.realm(UI.wrMyR()),
      t = Object.values(r.forces.tpl)[0];
    UI.wr.tplEdit = {
      tid: null,
      bns: t ? t.bns.slice() : ["SP"],
      sup: t ? t.sup.slice() : [],
      name: "New Division",
    };
    UI.wrRedrawSide();
  },
  wrTplEdit(v) {
    const t = A.realm(UI.wrMyR()).forces.tpl[v];
    if (t)
      UI.wr.tplEdit = {
        tid: t.id,
        bns: t.bns.slice(),
        sup: t.sup.slice(),
        name: t.name,
      };
    UI.wrRedrawSide();
  },
  wrTplAdd(v) {
    const E = UI.wr.tplEdit;
    if (E && E.bns.length < GD.TPL_MAX_BN) {
      E.bns.push(v);
      E.bns.sort(
        (a, b) =>
          ["foot", "missile", "horse", "beast"].indexOf(GD.BN[a].cat) -
          ["foot", "missile", "horse", "beast"].indexOf(GD.BN[b].cat),
      );
    }
    UI.wrRedrawSide();
  },
  wrTplRm(v) {
    const E = UI.wr.tplEdit;
    if (E) E.bns.splice(+v, 1);
    UI.wrRedrawSide();
  },
  wrTplSup(v) {
    const E = UI.wr.tplEdit;
    if (E) {
      if (E.sup.includes(v)) E.sup = E.sup.filter(x => x !== v);
      else {
        if (E.sup.length < GD.TPL_MAX_SUP) E.sup.push(v);
      }
      UI.wrRedrawSide();
    }
  },
  wrTplSave() {
    const E = UI.wr.tplEdit;
    if (!E) return;
    const r = A.fxAct(E.tid ? "tplEdit" : "tplNew", {
      tid: E.tid,
      bns: E.bns,
      sup: E.sup,
      name: E.name,
    });
    UI.wr.msg = r.msg || "";
    if (r.ok) UI.wr.tplEdit = null;
    UI.wrRedrawSide();
  },
  wrTplCancel() {
    UI.wr.tplEdit = null;
    UI.wrRedrawSide();
  },
  wrTplDel(v) {
    const r = A.fxAct("tplDel", v);
    UI.wr.msg = r.msg || "";
    UI.wrRedrawSide();
  },
  wrTrain(v) {
    const r = A.fxAct("train", v);
    UI.wr.msg = r.msg || "";
    UI.wrRefresh();
  },
  wrCancelTrain(v) {
    const r = A.fxAct("cancelTrain", +v);
    UI.wr.msg = r.msg || "";
    UI.wrRefresh();
  },
  wrDisband(v) {
    const r = A.fxAct("disband", v);
    UI.wr.msg = r.msg || "";
    UI.wrRefresh();
  },
  wrLine(v) {
    const [eq, d] = v.split("|"),
      r = A.fxAct("line", {
        eq,
        d: +d,
      });
    if (r.msg) UI.wr.msg = r.msg;
    else UI.wr.msg = "";
    UI.wrRedrawSide();
  },
  wrDoc(v) {
    const r = A.fxAct("doc", v);
    UI.wr.msg = r.msg || "";
    UI.wrRedrawSide();
  },
  wrLaw(v) {
    const r = A.fxAct("law", v);
    UI.wr.msg = r.msg || "";
    UI.wrRedrawSide();
  },
  wrBuild(v) {
    const r = A.fxAct("build", {
      k: v,
      prov: UI.wr.buildProv,
    });
    UI.wr.msg = r.msg || "";
    UI.wrRedrawSide();
  },
  wrUnbuild(v) {
    const r = A.fxAct("unbuild", +v);
    UI.wr.msg = r.msg || "";
    UI.wrRedrawSide();
  },
});

Object.assign(UI.C, {
  wrDivArmy(el) {
    if (!el.value) return;
    let n = 0;
    for (const id of el.dataset.v.split(",")) if (A.wsTransferDiv(id, el.value)) n++;
    UI.wr.msg = n
      ? `${n} division${n > 1 ? "s" : ""} moved to the ${A.army(el.value).name}.`
      : "That army is full (24 divisions).";
    UI.wrRefresh();
  },
  wrDivTpl(el) {
    if (!el.value) return;
    const r = A.fxAct("divTpl", {
      div: el.dataset.v,
      tpl: el.value,
    });
    UI.wr.msg = r.msg || "";
    UI.wrRefresh();
  },
  wrEnemy(el) {
    const r = A.wsSetOrder(el.dataset.v, "enemy", el.value || null);
    UI.wr.msg = r.msg;
    UI.wrRefresh();
  },
  wrTplName(el) {
    if (UI.wr.tplEdit) UI.wr.tplEdit.name = el.value.slice(0, 28);
  },
  wrAuto(el) {
    const r = A.fxAct("auto", el.checked);
    UI.wr.msg = r.msg || "";
    UI.wrRedrawSide();
  },
  wrBuildProv(el) {
    UI.wr.buildProv = +el.value;
    UI.wrRedrawSide();
  },
});

Object.assign(UI.A, {
  wrPeaceT(v) {
    UI.wr.peace = v || null;
    UI.wr.tab = "wars";
    UI.wrRefresh();
  },
});

UI.forcesSummary = function (r) {
  A.F(r);
  A.indCount(r);
  const ds = r.forces.divs,
    men = ds.reduce((x, d) => x + d.men, 0);
  return `<div class="card small wr-sum" style="margin-top:6px"><div class="row">${UI.wrIcon("shield")}<b>The host</b><span class="right muted">${ds.length} divisions · ${A.fmt(men)} men</span></div><div class="tiny muted">Manpower ${A.fmt(r.levy)} · ${r.forces.queue.length} in training · ${r.ind.mil} forges · ${r.ind.civ} workshops · ${GD.ECON[r.ind.law].name}${r.forces.auto ? " · quartermasters in charge" : ""}</div><button class="small primary" style="margin-top:6px" data-a="warRoomView">${UI.wrIcon("target")}Open the War Room — forces, templates, industry</button></div>`;
};

UI.promoBoardHtml = function (pc) {
  const b = A.promoBoard(pc);
  if (!b) return '<div class="small">You stand at the top of the ladder.</div>';
  const N = GD.MIL[pc.mil.rank + 1];
  // [X1 baked patch people/99999-v2-renown RN-WORDS] Merit was shown as a counter ("Merit 112 / 30") in the year's
  // summary and explained as a bar to meet; it no longer decides promotion. In the source: say where you stand for
  // the next rank in words, and say how the board decides.
  return `<div class="wr-board"><div class="small"><b>Promotion board — ${UI.esc(N.title)}</b> <span class="tiny muted">(leads ${A.fmt(N.leads)})</span></div>${b.map(x => `<div class="tiny row">${x.ok ? `<span class="good-t">${UI.wrIcon("check")}</span>` : `<span class="${x.soft ? "warn-t" : "bad-t"}">${UI.wrIcon(x.soft ? "triangle-alert" : "x")}</span>`}<span class="grow">${UI.esc(x.label)}${x.soft ? ' <span class="muted">(helps)</span>' : ""}</span><b>${UI.esc(String(x.have))}${x.need !== "" ? " / " + UI.esc(String(x.need)) : ""}</b></div>`).join("")}<div class="tiny muted">The board sits every three months. A deed that beat the odds in front of the army counts most; steady service and a patron help; a post must fall open. It can come twice in a year, or not for years, and a great deed can carry you past a rank.</div></div>`;
};

Object.assign(UI.A, {
  wrExercise() {
    const r = A.exercise();
    if (r.msg) A.log(r.msg, r.ok ? "" : "warn");
    UI.refresh();
  },
});

UI.clk = {
  run: false,
  speed: 2,
  timer: null,
  acc: 0,
  wasRun: false,
  lastLog: 0,
  lastRefresh: 0,
  quiet: false,
};

UI.CLK_SPEEDS = [0, 1.5, 4, 10, 24, 60];

UI.clkStart = function () {
  const pc = A.pc();
  if (!(!pc || !pc.alive)) {
    UI.clk.run = true;
    UI.clk.acc = 0;
    if (!UI.clk.timer) UI.clk.timer = setInterval(UI.clkTick, 100);
    UI.clkPaint();
  }
};

UI.clkStop = function () {
  UI.clk.run = false;
  if (UI.clk.timer) {
    clearInterval(UI.clk.timer);
    UI.clk.timer = null;
  }
  UI.clkPaint();
};

UI.clkToggle = function () {
  if (UI.clk.run) {
    UI.clk.wasRun = false;
    UI.clkStop();
  } else UI.clkStart();
};

UI.quietable = function (q) {
  if (!UI.clk.quiet || !q || q.type !== "event" || q.forced) return false;
  const e = A.EV[q.ev];
  return !(!e || e.duty || e.council || e.flow || /^g[as]_|^di_/.test(q.ev));
};

UI.quietSettle = function () {
  let n = 0;
  for (; A.S.queue.length && n < 8; ) {
    const q = A.S.queue[0];
    if (!A.headReady() || !UI.quietable(A.S.queue[0])) break;
    const v = A.eventView(A.S.queue[0]);
    let best = 0,
      bs = -1;
    v.choices.forEach((c, j) => {
      const sc = c.odds == null ? 80 : c.odds;
      if (sc > bs) {
        bs = sc;
        best = j;
      }
    });
    A.eventChoose(best);
    A.eventClose();
    n++;
  }
  return n;
};

UI.clkTick = function () {
  const S = A.S,
    pc = A.pc();
  if (!UI.clk.run || UI.screen !== "game" || !S || !pc) {
    UI.clkStop();
    return;
  }
  if (!pc.alive) {
    UI.clkStop();
    UI.refresh();
    return;
  }
  if ((UI.quietSettle() && (UI.clk.dirty = true), A.headReady())) {
    UI.clk.wasRun = true;
    UI.clkStop();
    UI.refresh();
    return;
  }
  UI.clk.acc += UI.CLK_SPEEDS[UI.clk.speed] * 0.1;
  let steps = 0;
  const t0 = Date.now();
  // [X1 baked patch ui/84-top-bar TOP-CLOCK-BUDGET] UI: the running clock simulated days for up to 70 ms of every
  // 100 ms tick. On the Great Continent a slow laptop spent nearly all its time in those ticks, so a click on Menu
  // or Pause could wait seconds (CI run on b0654e3: 30 s). The budget is UI.CLK_BUDGET (35 ms): fewer days per tick,
  // the same days in the same order, so the world is unchanged.
  for (; UI.clk.acc >= 1 && steps < 60 && Date.now() - t0 < (UI.CLK_BUDGET || 70); ) {
    UI.clk.acc -= 1;
    steps++;
    const r = A.dayTick();
    if ((r === "year" && UI.set.autosave && UI.save(true), r === "dead")) {
      UI.clkStop();
      UI.refresh();
      return;
    }
    if (A.S.queue.length && (UI.quietSettle(), A.headReady())) {
      UI.clk.wasRun = true;
      UI.clkStop();
      UI.refresh();
      return;
    }
  }
  if (UI.clk.acc > 3) UI.clk.acc = 0;
  UI.clkLight();
};

UI.clkLight = function () {
  const S = A.S,
    now = Date.now();
  UI.clkPaint();
  const logN = S.log.reduce((a, e) => a + e.lines.length, 0) + S.log.length,
    changed = logN !== UI.clk.lastLog || UI.clk.dirty;
  if (UI.ov && UI.ov.type === "warroom") {
    if (now - UI.clk.lastRefresh > 240) {
      UI.clk.lastRefresh = now;
      UI.wrRefresh();
    }
    return;
  }
  if (changed || now - UI.clk.lastRefresh > 1500) {
    UI.clk.lastLog = logN;
    UI.clk.dirty = false;
    UI.clk.lastRefresh = now;
    const pf = UI.$("#profile");
    if (pf) pf.innerHTML = UI.renderProfile();
    const lw = UI.$("#logwrap");
    // [X1 baked patch ui/999999-one-redraw RD-LOG-CLOCK] UI.clkLight (the running clock) rebuilt the story log
    // whenever it grew: the same in-place paint as UI.refresh.
    if (lw && changed) UI.paintLog(lw);
    const ae = document.activeElement,
      busy = ae && ae.closest && ae.closest("#tabbody") && /SELECT|INPUT|TEXTAREA/.test(ae.tagName);
    if (!UI.clkNoTab && !busy) UI.refreshTab();
  }
};

UI.clkPaint = function () {
  const el = UI.$("#clk");
  if (el) el.outerHTML = UI.clkHtml();
};

UI.clkHtml = function () {
  const S = A.S,
    pc = A.pc();
  if (!S || !pc) return '<div id="clk"></div>';
  const cap = A.initiativeCap(pc),
    t = S.time || 0,
    rate = A.initiativeRate(pc),
    next = t >= cap ? "full" : rate > 0 ? `next in ${Math.ceil((Math.floor(t) + 1 - t) / rate)}d` : "",
    run = UI.clk.run,
    busy = !pc.alive || !!S.queue.length;
  return `<div id="clk" class="clk" role="group" aria-label="Time">
    <span class="clk-date" title="Today">${UI.icon("calendar", "s")}<b>${UI.esc(A.dateStr())}</b><span class="muted"> · age ${A.age(pc)}</span></span>
    <button class="clk-play ${run ? "" : "primary"}" data-a="clkPlay" ${busy ? "disabled" : ""} aria-label="${run ? "Pause" : "Play"}" title="${run ? "Pause (Space)" : "Play (Space)"}">${UI.icon(run ? "pause" : "play", "s")}<span>${run ? "Pause" : "Play"}</span></button>
    <span class="seg clk-spd" role="group" aria-label="Speed">${[1, 2, 3, 4, 5].map(s => `<button class="small ${UI.clk.speed === s ? "on" : ""}" data-a="clkSpeed" data-v="${s}" title="Speed ${s}: about ${UI.CLK_SPEEDS[s]} days a second (key ${s})" aria-pressed="${UI.clk.speed === s}" aria-label="Speed ${s}">${s}</button>`).join("")}</span>
    <button class="small" data-a="clkSkip" ${busy ? "disabled" : ""} title="Run until something needs you">${UI.icon("skip-forward", "s")}<span>Next</span></button>
    <button class="small ${UI.clk.quiet ? "on" : ""}" data-a="clkQuiet" aria-pressed="${UI.clk.quiet}" title="Quiet living: ordinary events are settled with the safest choice. Anything about your post, your realm, a gathering or danger still stops the clock.">${UI.icon("moon", "s")}<span>Quiet</span></button>
    <span class="clk-ini" title="Initiative: free days you can spend on actions. It refills as time passes (${(rate * 30).toFixed(1)} a month).">${UI.icon("hourglass", "s")}<b>${t.toFixed(1)}</b><span class="muted">/${cap}</span><span class="clk-bar"><i style="width:${Math.round(Math.min(1, t / cap) * 100)}%"></i></span><span class="tiny muted">${next}</span></span>
  </div>`;
};

UI.renderTop = function () {
  const pc = A.pc();
  // [X1 baked patch ui/84-top-bar TOP-GROUP] UI: with the place, purse, Save and Menu as separate items of a bar
  // that could not wrap, a narrow desktop crushed the place and purse to nothing; allowed to wrap, Menu dropped to a
  // line of its own. As one group they wrap together.
  // [X1 baked patch ui/84-top-bar TOP-DEBT] UI: "(debt 12,345 suns)" beside "1,234,567 suns" took more room than the
  // top bar has at laptop widths and was cut mid-word. It now reads "owes 12,345"; 59-descriptions' aria-label and
  // tooltip still give the debt in full.
  return pc
    ? `<span class="brand">ARDAN</span>${UI.clkHtml()}
    <div class="top-right"><div class="info top-info"><span class="top-home" title="Home">${UI.icon("map-pin", "s")}${UI.esc(A.provName(pc.home))}, <b>${UI.esc(A.realmShort(pc.realm))}</b></span><span title="Coin">${UI.icon("coins", "s")}<b>${A.coin(pc.coin)}</b>${pc.debt ? ` <span class="bad" title="Debt: ${A.coin(pc.debt)}">owes ${A.fmt(pc.debt)}</span>` : ""}</span></div>
    <button class="small" data-a="save" aria-label="Save">${UI.icon("save", "s")}<span class="bt">Save</span></button><button class="small" data-a="menu" aria-label="Menu">${UI.icon("menu", "s")}<span class="bt">Menu</span></button></div>`
    : "";
};

UI.renderLogWrap = function () {
  // [X1 baked patch ui/999999-one-redraw RD-LOG-WINDOW] The page held 40 years of story (1,600 nodes at year 50),
  // the whole effect of age on a desktop page. It holds UI.LOG_YEARS (2) now; "Show earlier years" (UI.logAll) still
  // shows everything.
  const pc = A.pc(),
    S = A.S,
    entries = UI.logAll ? S.log : S.log.slice(-(UI.LOG_YEARS || 40));
  // [X1 baked patch ui/27-accessibility A11Y-LOG-FOCUS] The story log is a scrolling column with no focusable
  // content once a life's story is longer than the screen, so a keyboard user could not scroll it (axe:
  // scrollable-region-focusable, found by 61-illuminated-chronicle's scan of the Chronicle and map tabs). It is now
  // a labelled region that takes focus.
  let h = '<div id="log" tabindex="0" role="region" aria-label="The story so far">';
  // [X1 baked patch ui/999999-one-redraw RD-LOG-WINDOW] The page held 40 years of story (1,600 nodes at year 50),
  // the whole effect of age on a desktop page. It holds UI.LOG_YEARS (2) now; "Show earlier years" (UI.logAll) still
  // shows everything.
  if (!UI.logAll && S.log.length > (UI.LOG_YEARS || 40))
    h += '<button class="small ghost" data-a="logAll">Show earlier years…</button>';
  let lastPc = null;
  for (const e of entries) {
    const lines = e.lines.filter(
      l => (Array.isArray(l) ? l[1] !== "yearstart" : true) && (Array.isArray(l) ? l[0] : l),
    );
    if (!lines.length) continue;
    const who = A.P(e.pc),
      name = who && e.pc !== lastPc && lastPc !== null ? ` — ${UI.esc(who.given)}` : "";
    lastPc = e.pc;
    h += `<div class="ly"><div class="yh">${e.year} AR<span>age ${e.age}${name}</span></div>`;
    let lastD = -1;
    for (const l of lines) {
      const [t, c, d] = Array.isArray(l) ? l : [l, "", null],
        ds = d != null && d !== lastD ? `<span class="ld">${UI.esc(A.dateStr(d, e.year, true))}</span>` : "";
      if (d != null) lastD = d;
      // [X1 baked patch core/00-security SEC-LOG-CLASS] Escape the story-log line class where it is written into markup
      // (second layer behind SEC-SAVE-CLEAN).
      h += `<div class="ll ${UI.esc(c)}">${ds}${UI.esc(t)}</div>`;
    }
    h += "</div>";
  }
  h += "</div>";
  if (pc && !pc.alive)
    h += '<div id="agebar"><button class="primary agebtn" data-a="showDeath">Your life is over…</button></div>';
  return h;
};

Object.assign(UI.A, {
  clkPlay() {
    UI.clkToggle();
  },
  clkSpeed(v) {
    UI.clk.speed = +v;
    UI.clkPaint();
  },
  clkSkip() {
    const pc = A.pc();
    if (!pc || !pc.alive || A.S.queue.length) return;
    UI.clkStop();
    const r = A.advance(400, "year");
    UI.quietSettle();
    if (r.why === "year" && UI.set.autosave) UI.save(true);
    UI.refresh();
  },
  clkQuiet() {
    UI.clk.quiet = !UI.clk.quiet;
    UI.clkPaint();
  },
  age() {
    UI.A.clkSkip();
  },
  quiet() {
    UI.clk.quiet = true;
    UI.clkStart();
  },
});

UI.clkResume = function () {
  if (UI.clk.wasRun && !A.S.queue.length && A.pc() && A.pc().alive && UI.set.resume !== false) {
    UI.clk.wasRun = false;
    UI.clkStart();
  }
};

UI.RESUME_AFTER = [
  "evClose",
  "qChoice",
  "qClose",
  "qSkip",
  "duelClose",
  "mClose",
  "missionClose",
  "bClose",
  "battleClose",
  "simpleClose",
];

UI.clockKeys = function () {
  document.addEventListener(
    "keydown",
    e => {
      if (UI.screen === "game") {
        if (
          !(
            e.target.tagName === "INPUT" ||
            e.target.tagName === "TEXTAREA" ||
            e.target.tagName === "SELECT" ||
            (UI.$("#modal") && !(UI.ov && UI.ov.type === "warroom" && !A.S.queue.length)) ||
            (e.key === " " && UI.isControl(e.target))
          )
        ) {
          if (e.key === " ") {
            e.preventDefault();
            e.stopImmediatePropagation();
            UI.clkToggle();
          } else {
            if (/^[1-5]$/.test(e.key)) {
              UI.clk.speed = +e.key;
              UI.clkPaint();
            }
          }
        }
      }
    },
    true,
  );
};

UI.confirm = function (o) {
  UI.clkStop();
  UI.ov = Object.assign(
    {
      type: "confirm",
    },
    o,
  );
  UI.renderModal();
};

UI.ovModal = function (ov) {
  return ov.type === "confirm"
    ? `<div class="panel mbox"><h2>${UI.esc(ov.title || "Are you sure?")}</h2><div class="mtext">${UI.esc(ov.text || "")}</div><div class="choices"><button class="${ov.danger ? "danger" : "primary"}" data-a="cfYes">${UI.esc(ov.yes || "Yes")}</button><button data-a="cfNo">${UI.esc(ov.no || "Cancel")}</button></div></div>`
    : ov.type === "warDecl"
      ? UI.warDeclModal(ov.id)
      : ov.type === "warroom"
        ? UI.warRoomModal(ov)
        : ov.type === "help"
          ? UI.helpModal()
          : UI.ovModalV4(ov);
};

Object.assign(UI.A, {
  cfYes() {
    const ov = UI.ov;
    UI.ov = ov && ov.back ? ov.back : null;
    let r = null;
    try {
      if (ov && ov.run) r = ov.run();
    } catch (e) {
      console.error(e);
    }
    if (r && r.msg) UI.toast(r.msg);
    UI.refresh();
  },
  cfNo() {
    const ov = UI.ov;
    UI.ov = ov && ov.back ? ov.back : null;
    UI.renderModal();
  },
  desert() {
    UI.confirm({
      title: "Desert?",
      text: "Deserters are hanged in many realms, and your name will be cursed in the ranks.",
      yes: "Desert",
      danger: true,
      run: () => {
        A.desert();
      },
    });
  },
  rAct(v) {
    const [k, arg] = v.split("|");
    if (k === "abdicate")
      UI.confirm({
        title: "Abdicate?",
        text: "You give up the crown. Your heir rules; you become the ruler's parent and a subject.",
        yes: "Abdicate",
        danger: true,
        run: () => A.rulerAction(k, arg),
      });
    else
      (() => {
        const r = A.rulerAction(k, arg);
        if (r && r.msg) UI.toast(r.msg);
        UI.refresh();
      })();
  },
  rWar(v) {
    UI.ov = {
      type: "warDecl",
      id: v,
    };
    UI.renderModal();
  },
  diplDo(v) {
    const [k, id] = v.split("|"),
      t = A.realm(id);
    if (k === "war") {
      UI.ov = {
        type: "warDecl",
        id,
      };
      UI.renderModal();
      return;
    }
    const run = () => {
      const r2 = A.diplDo(k, id);
      UI.mapVer = (UI.mapVer || 0) + 1;
      return r2;
    };
    if (["unally", "undef", "unguar"].includes(k)) {
      UI.confirm({
        title: "Break your word?",
        text: `${t ? t.name : "They"} will remember it for years, and so will their friends.`,
        yes: "Do it",
        danger: true,
        run,
      });
      return;
    }
    const r = run();
    if (r && r.msg) UI.toast(r.msg);
    UI.refresh();
  },
  joinFac(v) {
    UI.confirm({
      title: "Join this faction?",
      text: "The crown will think less of you. If the faction wins, you win with it; if it loses, you are hunted with it.",
      yes: "Join",
      run: () => A.joinFaction(v),
    });
  },
  decide(v) {
    const d = A.DEC && A.DEC[v],
      arg = (UI.decArg || {})[v];
    if (d && d.pick && (arg == null || arg === "")) {
      UI.toast("Choose first.");
      return;
    }
    const go = () => {
      const r = A.decide(v, arg);
      if (UI.decArg) delete UI.decArg[v];
      return r && r.continued ? ((UI.tab = "life"), (UI.ov = null), UI.render(), null) : r;
    };
    if (d && ["pass_torch", "emigrate", "holy_war", "purge"].includes(v))
      UI.confirm({
        title: `${d.name}?`,
        text: "This cannot be undone.",
        yes: d.name,
        danger: true,
        run: go,
      });
    else {
      const r = go();
      if (r && r.msg) UI.toast(r.msg.length > 150 ? r.msg.slice(0, 147) + "…" : r.msg);
      if (r) UI.refresh();
    }
  },
});

UI.warDeclModal = function (tid) {
  const r = A.myRealm(),
    t = A.realm(tid),
    close = `<button class="ghost closex" data-a="closeOv" aria-label="Close">${UI.icon("x", "m")}</button>`;
  if (!r || !t || !t.alive) return `<div class="panel mbox">${close}<p>Not possible.</p></div>`;
  if (A.hostile(r.id, t.id))
    return `<div class="panel mbox">${close}<h2>Already at war</h2><p>You are already at war with ${UI.esc(t.name)}.</p></div>`;
  const P = A.warPreview(r.id, t.id),
    row = (x, side) => {
      const o = A.realm(x.id);
      return `<div class="small row"><span class="swatch" style="background:${o ? o.color : "#888"}"></span><span class="grow">${UI.esc(o ? o.short : x.id)} <span class="muted">· ${UI.esc(x.why)}</span></span><b class="${side === "d" ? "bad-t" : "good-t"}">${x.p}%</b></div>`;
    },
    cost = [];
  if (P.inf) cost.push(`infamy +${P.inf}`);
  if (P.stab) cost.push(`stability ${P.stab}`);
  if (P.legit) cost.push(`legitimacy ${P.legit}`);
  const ratio = P.ratio;
  return `<div class="panel mbox wide">${close}<h2>War with ${UI.esc(t.name)}?</h2>
    <div class="kv small"><div>Reason</div><div><b>${UI.esc(A.CB[P.cb] || P.cb)}</b></div><div>Price</div><div>${UI.esc(cost.join(" · ") || "none")}</div><div>Strength</div><div>Your side ×${ratio.toFixed(2)} theirs, counting likely allies <span class="muted">(${ratio >= 1.3 ? "favorable" : ratio >= 0.85 ? "even" : "dangerous"})</span></div></div>
    ${P.notes
      .filter(([n]) => !/^Reason:/.test(n))
      .map(
        ([n, c]) =>
          `<div class="small ${c}-t">${c === "bad" ? UI.icon("triangle-alert", "s") : UI.icon("check", "s")} ${UI.esc(n)}</div>`,
      )
      .join("")}
    <div class="dipl-2col" style="margin-top:8px"><div><div class="group-h">Will likely fight beside you</div>${P.att.length ? P.att.map(x => row(x, "a")).join("") : '<p class="small muted">Nobody.</p>'}</div><div><div class="group-h">Will likely defend them</div>${P.def.length ? P.def.map(x => row(x, "d")).join("") : '<p class="small muted">Nobody.</p>'}</div></div>
    <div class="choices" style="margin-top:10px"><button class="danger" data-a="warGo" data-v="${t.id}">Declare war${P.cb === "none" ? " without a reason" : ""}</button>${P.cb === "none" && !r.justify ? `<button data-a="warJustify" data-v="${t.id}">Justify a war goal first (${A.fmt(A.justifyCost(r.id))}, ~${Math.round(A.justifyDays(r.id) / 30)} months)</button>` : ""}<button data-a="closeOv">Not now</button></div></div>`;
};

Object.assign(UI.A, {
  warGo(v) {
    const r = A.diplDo("war", v);
    UI.ov = null;
    if (r && r.msg) UI.toast(r.msg);
    UI.mapVer = (UI.mapVer || 0) + 1;
    UI.refresh();
  },
  warJustify(v) {
    const r = A.diplDo("justify", v);
    UI.ov = null;
    if (r && r.msg) UI.toast(r.msg);
    UI.refresh();
  },
});

UI.warRoomOpen = function () {
  if (A.pc()) {
    A.wrOpen({});
    UI.ov = {
      type: "warroom",
    };
    UI.wr.msg = "";
    UI.wr.sel = null;
    UI.wr.tplEdit = null;
    UI.wr.help = false;
    UI.wr.peace = null;
    UI.renderModal();
  }
};

UI.warRoomModal = function () {
  const pc = A.pc(),
    S = A.S,
    R2 = A.cmdRole(pc);
  UI.wrValidateSel();
  const myR = UI.wrMyR(pc),
    wars = A.atWar(myR),
    tabs = UI.wrTabs(R2);
  if (!tabs.some(t => t.k === UI.wr.tab && !t.lock)) UI.wr.tab = "cmd";
  const wide = ["tpl", "ind", "mp"].includes(UI.wr.tab),
    run = UI.clk.run,
    time = `<div class="wr-time" role="group" aria-label="Time"><button class="${run ? "" : "primary"} wr-play" data-a="clkPlay" aria-label="${run ? "Pause" : "Play"}">${UI.wrIcon(run ? "pause" : "play")}<span>${run ? "Pause" : "Play"}</span></button>
      <div class="seg">${[1, 2, 3, 4, 5].map(s => `<button class="small ${UI.clk.speed === s ? "on" : ""}" data-a="wrClkSpeed" data-v="${s}" title="Speed ${s}">${s}</button>`).join("")}</div>
      <button class="small" data-a="wrStep" title="Advance one week">${UI.wrIcon("skip-forward")}<span>Week</span></button></div>`;
  return `<div class="panel mbox full warroom">
    <div class="wr-top"><h2>War Room</h2><span class="chip gold" id="wrDate">${UI.esc(A.dateStr())}</span>${time}${wars.length ? "" : '<span class="chip">At peace — manage the host</span>'}<span class="right"></span>
      <button class="small ghost" data-a="wrHelp" aria-pressed="${UI.wr.help}" title="How war works">${UI.wrIcon("circle-help")}<span>Guide</span></button>
      <button class="small" data-a="wrLeave" title="Close the War Room. Time goes on.">${UI.wrIcon("x")}<span>Close</span></button></div>
    <div class="wr-body ${wide ? "wide" : ""}">
      <div class="mapwrap wr-map"><canvas id="warmap" width="1100" height="720" aria-label="War map"></canvas>
        <div class="mapzoom"><button class="small" data-a="wrZoom" data-v="1.4" aria-label="Zoom in">${UI.wrIcon("zoom-in")}</button><button class="small" data-a="wrZoom" data-v="0.7" aria-label="Zoom out">${UI.wrIcon("zoom-out")}</button><button class="small" data-a="wrZoom" data-v="fit" aria-label="Fit the theatre">${UI.wrIcon("maximize")}</button>${pc.mil && pc.mil.div ? `<button class="small" data-a="wrFind" aria-label="Find your division">${UI.wrIcon("crosshair")}</button>` : ""}
          <div class="seg">${[
            ["sides", "Sides"],
            ["supply", "Supply"],
            ["terrain", "Terrain"],
          ]
            .map(
              ([k, n]) =>
                `<button class="small ${UI.wr.mode === k ? "on" : ""}" data-a="wrMode" data-v="${k}">${n}</button>`,
            )
            .join("")}</div></div>
        <div class="maptip hidden"></div>
        <div class="wr-hint" id="wrHint">${UI.wrHint()}</div>
      </div>
      <div class="wr-side">
        <div class="wr-tabs" role="tablist">${tabs.map(t => `<button role="tab" class="small ${UI.wr.tab === t.k ? "on" : ""}" data-a="wrTab" data-v="${t.k}" ${t.lock ? `disabled title="${UI.esc(t.lock)}"` : ""} aria-selected="${UI.wr.tab === t.k}">${UI.wrIcon(t.lock ? "lock" : t.ic)}<span>${t.n}</span></button>`).join("")}</div>
        <div class="wr-panel" id="wrSide">${UI.wrSide()}</div>
      </div>
    </div>
    <div class="legend wr-legend">${UI.wrLegend()}</div>
  </div>`;
};

UI.afterModal = function () {
  UI.afterModalBattle();
  if (!(A.S && A.S.queue[0]) && UI.ov && UI.ov.type === "warroom") UI.wrAttach();
};

UI.wrRefresh = function () {
  if (!(UI.ov && UI.ov.type === "warroom") || (A.S && A.S.queue.length)) return;
  UI.wrRefreshBasic();
  const dt = UI.$("#wrDate");
  if (dt) dt.textContent = A.dateStr();
  const pb = UI.$(".warroom .wr-play");
  if (pb) {
    const run = UI.clk.run;
    pb.classList.toggle("primary", !run);
    pb.innerHTML = `${UI.wrIcon(run ? "pause" : "play")}<span>${run ? "Pause" : "Play"}</span>`;
  }
};

UI.wrStop = function () {};
