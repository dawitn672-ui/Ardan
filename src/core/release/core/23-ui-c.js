// The release's core, ui (part 3 of 6): UI: the interface.
// Readable source of vendor/ardan-b593143.html with the patch layer baked in (X1, docs/DECISIONS.md D-028). Edit it here.
// Defines: UI.realmTabBasic, UI.courtTab, UI.mapMode, UI.mapFocus, UI.mapLegend, UI.worldTabPolitics, UI.A (+), UI.C
// (+), UI.unitSym, UI.symLegend, UI.oobOpen, UI.oobRow, UI.oobTree, UI.oobBreadcrumb, UI.ovModalOob, MAP.front,
// UI.wrClampView, UI.canvasCounter, UI.specCard, UI.peacePicks, UI.peacePanel, UI.ovModalV4, UI.TAB.realm, UI.bview,
// UI.bviewDefault, UI.battleModal, UI.drawBattle, UI.gm, UI.greatMapModal, UI.provPanel, UI.gmSide, UI.gmFit,
// UI.gmDraw, UI.gmAttach, UI.afterModalBattle, UI.peaceRedraw, UI.recapCard, UI.wr, UI.WR_SIDE_COL, UI.wrMyR,
// UI.wrSideOf, UI.wrIcon, UI.wrPct, UI.kfmt, UI.wrTabs, UI.wrHint, UI.wrValidateSel, UI.wrSide, UI.wrHelpPanel,
// UI.wrRoleCard, UI.wrCommandBasic, UI.wrArmyRow, UI.wrFightRow, A.fightState, UI.wrBarsBasic, UI.wrDivStatus,
// UI.wrStatGrid, UI.wrDivPanelBasic, UI.wrIntel, UI.wrDivButtons, and 3 more.

UI.realmTabBasic = function (pc) {
  const r = A.myRealm();
  if (!r) return UI.courtTab(pc);
  A.realmEnsure(r);
  const b = r.lastBudget || {
      inc: r.income,
      upkeep: Math.round(r.army * 3.2 + r.levy * 0.05),
      interest: Math.round(r.debt * 0.09),
      court: 0,
      bld: 0,
    },
    sub = UI.realmView || "state";
  let h = `<div class="row"><h3 style="margin:0">${UI.esc(r.name)}</h3><span class="right"></span>${[
    ["state", "State"],
    ["dipl", "Diplomacy"],
    ["court", "Court & factions"],
    ["build", "Build"],
  ]
    .map(
      ([k, n]) => `<button class="small ${sub === k ? "primary" : ""}" data-a="realmView" data-v="${k}">${n}</button>`,
    )
    .join("")}</div>`;
  const co = A.S.coalitions && A.S.coalitions[r.id];
  if (
    (co &&
      (h += `<div class="card warnbox small">⚠ <b>A coalition is forming against you:</b> ${co.map(A.realmShort).join(", ")}. Keep infamy below 60 or they will march together.</div>`),
    r.overlord &&
      (h += `<div class="card warnbox small">You pay tribute to <b>${UI.esc(A.realmName(r.overlord))}</b>: 8% of your income each year (last: ${A.fmt(r.tributePaid || 0)}).</div>`),
    sub === "state")
  ) {
    if (
      ((h += `<div class="kv small" style="margin-top:6px"><div>Treasury</div><div><b>${A.fmt(r.treasury)}</b> suns${r.debt ? ` · <span class="bad">debt ${A.fmt(r.debt)}</span>` : ""}</div><div>Last year</div><div>income ${A.fmt(b.inc)} · army ${A.fmt(b.upkeep)} · interest ${A.fmt(b.interest)} · court ${A.fmt(b.court)}</div><div>People</div><div>${A.fmt(r.pop)} in ${r.provCount} provinces</div><div>Army</div><div>${A.fmt(r.army)} standing · ${A.fmt(r.levy)} levy · quality ${Math.round(r.armyQ * 100)}%</div><div>Heir</div><div>${r.heir && A.P(r.heir) ? UI.esc(A.fullName(A.P(r.heir))) + " (" + A.age(A.P(r.heir)) + ")" : r.gov === "hereditary" ? '<span class="bad">none</span>' : "chosen by election"}</div><div>Tributaries</div><div>${
        A.tributariesOf(r.id)
          .map(t => UI.esc(t.short))
          .join(", ") || "none"
      }</div></div>`),
      (h +=
        UI.barRow("Stability", r.stability, 100) +
        UI.barRow("Legitimacy", r.legit, 100) +
        UI.barRow("War weariness", r.exhaustion, 100, "hpbar") +
        UI.barRow("Infamy", r.infamy || 0, 100, (r.infamy || 0) >= 40 ? "hpbar" : "", 40)),
      (h +=
        '<div class="tiny muted">Infamy rises when you take land without a claim. At 40 neighbors start a coalition; above 60 it may march.</div>'),
      (h += `<div class="group-h">Laws</div><div class="small"><b>Crown authority</b> <span class="muted">— income ×, lords' yearly mood</span><div class="row">${A.AUTH.map(([n, inc, op], i) => `<button class="small ${r.laws.authority === i ? "primary" : ""}" data-a="setLaw" data-v="authority|${i}" title="Income ×${inc}; vassal mood ${op >= 0 ? "+" : ""}${op}/yr">${n}</button>`).join("")}</div><div class="tiny muted">Higher: more income, angrier lords and a Liberty faction. Raising needs stability 40 and legitimacy 50. One step a year.</div></div>`),
      (h += `<div class="small" style="margin-top:6px"><b>Levies</b><div class="row">${A.LEVY.map(([n, mul, op, d], i) => `<button class="small ${r.laws.levy === i ? "primary" : ""}" data-a="setLaw" data-v="levy|${i}" title="${UI.esc(d)}">${n}</button>`).join("")}</div></div>`),
      (h += `<div class="row small" style="margin-top:6px">Taxes: ${Object.entries(A.TAX)
        .map(
          ([k, v]) =>
            `<button class="small ${(r.laws.tax || 1) == k ? "primary" : ""}" data-a="rAct" data-v="tax|${k}">${v[0]}</button>`,
        )
        .join("")}</div>`),
      (h += UI.forcesSummary ? UI.forcesSummary(r) : ""),
      (h += `<div class="row" style="margin-top:6px"><button class="small" data-a="rAct" data-v="drill">Drill the host</button><button class="small" data-a="rAct" data-v="feast">Hold a great feast</button><button class="small" data-a="rAct" data-v="bank">Borrow from the banks</button><button class="small" data-a="rAct" data-v="repay" ${r.debt ? "" : "disabled"}>Repay debt</button></div>`),
      r.gov === "hereditary")
    ) {
      h += `<div class="row small" style="margin-top:6px">Succession: ${[
        ["male", "Sons first"],
        ["equal", "Eldest child"],
        ["female", "Daughters first"],
      ]
        .map(
          ([k, n]) =>
            `<button class="small ${r.law === k ? "primary" : ""}" data-a="rAct" data-v="law|${k}">${n}</button>`,
        )
        .join("")}</div>`;
      const kids = pc.children.map(A.P).filter(k => k && k.alive && !k.flags.bastard);
      if (kids.length)
        h += `<div class="row small" style="margin-top:6px">Name heir: ${kids.map(k => `<button class="small ${r.heir === k.id ? "primary" : ""}" data-a="rAct" data-v="heir|${k.id}">${UI.esc(k.given)} (${A.age(k)})</button>`).join("")}</div>`;
    }
    h +=
      '<div class="row" style="margin-top:12px"><button class="danger small" data-a="rAct" data-v="abdicate">Abdicate</button></div>';
  } else if (sub === "dipl") {
    const others = Object.values(A.S.realms).filter(o => o.alive && o.id !== r.id),
      nbs = A.neighbors(r.id);
    others.sort(
      (a, b2) =>
        nbs.includes(b2.id) - nbs.includes(a.id) ||
        r.allies.includes(b2.id) - r.allies.includes(a.id) ||
        A.relBetween(r.id, b2.id) - A.relBetween(r.id, a.id),
    );
    // [X1 baked patch diplomacy/99996-v2-diplomacy V2DIP-NO-PCT] The Realm > Diplomacy header showed trade income as
    // "+N% income". The owner asked for no percentages: say whether trade adds income, in words.
    h += `<div class="row small muted" style="margin:6px 0">Allies ${r.allies.length}/3 suggested · Pacts ${Object.keys(r.pacts.nap).length} · Trade ${Object.keys(r.pacts.trade).length}${A.tradeMul(r) > 1.005 ? " (adds to your income)" : ""} · Chancellor ${A.councilSkill(r, "chancellor")} · Spymaster ${A.councilSkill(r, "spymaster")}</div>`;
    const sel = UI.diplSel && A.realm(UI.diplSel) && A.realm(UI.diplSel).alive ? A.realm(UI.diplSel) : null;
    h += '<div class="dipl-grid"><div class="dipl-list">';
    for (const o of others) {
      const rel = A.relBetween(r.id, o.id);
      h += `<div class="ditem click ${sel && sel.id === o.id ? "sel" : ""}" data-a="diplSel" data-v="${o.id}"><span class="swatch" style="background:${o.color}"></span><div class="grow"><div class="nm">${UI.esc(o.short)}${nbs.includes(o.id) ? ' <span class="tag">border</span>' : ""}</div><div class="ds">${UI.relStatus(r, o)}</div></div><div class="relv ${rel >= 30 ? "good" : rel <= -30 ? "bad" : ""}">${rel > 0 ? "+" : ""}${rel}</div></div>`;
    }
    h += `</div><div>${sel ? UI.diplCard(r, sel) : '<p class="small muted">Pick a realm to see what you can do: alliances, pacts, trade, marriages, tribute, claims — each with the odds that they say yes and why.</p>'}</div></div>`;
  } else if (sub === "court") {
    const fs = A.factionsOf(r.id);
    h += '<div class="group-h">Factions</div>';
    if (!fs.length) h += '<p class="small muted">No faction stirs against the crown. Enjoy it.</p>';
    for (const f of fs) h += UI.factionCard(f, pc, false);
    h += '<div class="group-h">Council</div>';
    const cands = A.councilCandidates(r);
    for (const seat in A.COUNCIL) {
      const S = A.COUNCIL[seat],
        holder = A.P(r.council[seat]);
      h += `<div class="card small"><b>${S.name}</b> <span class="muted">${S.desc}</span><div class="row">${holder ? `${UI.esc(A.fullName(holder))} — ${UI.esc(GD.SKILLS[S.skill])} ${A.skill(holder, S.skill)}` : '<span class="bad">Empty seat</span>'}<span class="right"></span><select data-c="rAppoint" data-k="${seat}" aria-label="Appoint to ${UI.esc(S.name)}"><option value="">Appoint…</option>${cands.map(p => `<option value="${p.id}">${UI.esc(A.fullName(p))} (${A.skill(p, S.skill)})</option>`).join("")}</select></div></div>`;
    }
    const vs = A.realmHouses(r.id);
    if (vs.length) {
      h += `<div class="group-h">Houses sworn to you (${vs.length})</div><table class="t"><tr><th>House</th><th>Seat</th><th>Faction</th><th>Loyalty</th></tr>`;
      for (const v of vs.sort((a, b2) => (a.op || 50) - (b2.op || 50))) {
        const f = fs.find(x => x.members.includes(v.id));
        h += `<tr class="click" data-a="ov" data-v="house:${v.id}"><td>${PORTRAIT.coat(v, 16)} ${UI.esc(v.name)}</td><td>${UI.esc(v.seat || "")}</td><td class="small">${f ? UI.esc(A.FACTIONS[f.kind].name) : ""}</td><td style="width:110px">${UI.bar(v.op || 50, 100, (v.op || 50) < 30 ? "hpbar" : "")}</td></tr>`;
      }
      h += "</table>";
    }
  } else
    h += `<div class="group-h">Build</div><div class="row small"><select data-c="bProv" aria-label="Province to build in">${A.realmProvs(
      r.id,
    )
      .map(
        p =>
          `<option value="${p.id}" ${UI.bProv == p.id ? "selected" : ""}>${UI.esc(p.name)} (dev ${p.dev}, walls ${p.fort})</option>`,
      )
      .join("")}</select></div><div class="gridcards" style="margin-top:6px">${Object.entries(A.BUILDINGS)
      .map(
        ([k, B]) =>
          `<div class="card small"><b>${B.name}</b><div class="muted">${UI.esc(B.desc)}</div><button class="small" data-a="rBuild" data-v="${k}">Build (~${A.fmt(B.cost)})</button></div>`,
      )
      .join("")}</div>`;
  return h;
};

UI.courtTab = function (pc) {
  let h = UI.courtTabBasic(pc);
  const rid = pc.noble ? pc.noble.realm : pc.realm,
    fs = A.factionsOf(rid),
    r = A.realm(rid);
  let s = `<div class="group-h">Factions of ${UI.esc(r ? r.short : "the realm")}</div>`;
  if (!fs.length) s += '<p class="small muted">No faction moves against the crown right now.</p>';
  for (const f of fs) s += UI.factionCard(f, pc, true);
  s +=
    '<p class="tiny muted">Joining a faction angers the crown, but a faction that wins rewards its members — and a faction that loses is hunted.</p>';
  const i = h.indexOf('<div class="group-h">The ladder');
  return i >= 0 ? h.slice(0, i) + s + h.slice(i) : h + s;
};

UI.mapMode = UI.mapMode || "political";

UI.mapFocus = () => {
  const pc = A.pc();
  return pc ? pc.ruler || pc.realm : null;
};

UI.mapLegend = function () {
  const m = UI.mapMode;
  return m === "political" || m === "terrain"
    ? ""
    : `<div class="legend">${MAP.modeInfo(m, UI.mapFocus())
        .legend.slice(0, 24)
        .map(([c, n]) => `<span><i style="background:${c}"></i>${UI.esc(n)}</span>`)
        .join("")}</div>`;
};

UI.worldTabPolitics = function (pc) {
  const v = UI.worldView;
  if (v === "dipl") {
    let h2 = `<div class="row" style="margin-bottom:8px">${[
      ["map", "Map"],
      ["dipl", "Diplomacy"],
      ["realms", "Realms"],
      ["wars", "Wars"],
      ["news", "News"],
      ["history", "History"],
    ]
      .map(([k, n]) => `<button class="small ${v === k ? "primary" : ""}" data-a="wview" data-v="${k}">${n}</button>`)
      .join("")}</div>`;
    const live = Object.values(A.S.realms).filter(r => r.alive && !r.isRebel),
      seen = new Set(),
      blocs = [];
    for (const r of live) {
      if (seen.has(r.id) || !r.allies.length) continue;
      const q = [r.id],
        bl = [];
      for (seen.add(r.id); q.length; ) {
        const x = q.pop();
        bl.push(A.realm(x));
        // [X1 baked patch diplomacy/99996-v2-diplomacy V2DIP-BLOCS] Playtest 1 #22: World > Diplomacy chained alliances
        // into one "bloc" of all 33 realms (A allied to B, B to C...). A bloc is now realms each allied to every other
        // member, and its strength is said as you would know it.
        for (const a of A.realm(x).allies)
          if (
            !seen.has(a) &&
            A.realm(a) &&
            A.realm(a).alive &&
            bl.every(y => y.allies.includes(a)) &&
            q.every(z => A.realm(z).allies.includes(a))
          ) {
            seen.add(a);
            q.push(a);
          }
      }
      if (bl.length > 1) blocs.push(bl);
    }
    h2 += '<div class="group-h">Alliance blocs</div>';
    // [X1 baked patch diplomacy/99996-v2-diplomacy V2DIP-BLOCS] Playtest 1 #22: World > Diplomacy chained alliances
    // into one "bloc" of all 33 realms (A allied to B, B to C...). A bloc is now realms each allied to every other
    // member, and its strength is said as you would know it.
    h2 += blocs.length
      ? blocs
          .sort((a, b) => b.length - a.length)
          .map(
            bl =>
              `<div class="card small"><b>${bl.map(x => `<span class="swatch" style="background:${x.color}"></span>${UI.esc(x.short)}`).join(" · ")}</b><div class="tiny muted">Combined army ${UI.esc(A.V2DIP ? A.V2DIP.blocArmy(bl) : A.fmt(bl.reduce((a, x) => a + x.army, 0)))}</div></div>`,
          )
          .join("")
      : '<p class="small muted">No alliances stand in Ardan.</p>';
    const tribs = live.filter(r => r.overlord);
    h2 +=
      '<div class="group-h">Overlords and tributaries</div>' +
      (tribs.length
        ? tribs
            .map(
              t =>
                `<div class="small">${UI.esc(t.short)} pays tribute to <b>${UI.esc(A.realmShort(t.overlord))}</b></div>`,
            )
            .join("")
        : '<p class="small muted">No realm pays tribute.</p>');
    const co = A.S.coalitions || {};
    h2 +=
      '<div class="group-h">Coalitions</div>' +
      (Object.keys(co).length
        ? Object.entries(co)
            .map(
              ([t, ms]) =>
                `<div class="small"><b>Against ${UI.esc(A.realmShort(t))}</b> (infamy ${Math.round((A.realm(t) || {}).infamy || 0)}): ${ms.map(A.realmShort).join(", ")}</div>`,
            )
            .join("")
        : '<p class="small muted">No coalitions. Nobody is conquering fast enough to scare the rest.</p>');
    const inf = live
      .filter(r => (r.infamy || 0) >= 10)
      .sort((a, b) => b.infamy - a.infamy)
      .slice(0, 8);
    h2 +=
      '<div class="group-h">Most feared</div>' +
      (inf.length
        ? inf.map(r => UI.barRow(UI.esc(r.short), r.infamy, 100, r.infamy >= 40 ? "hpbar" : "", 40)).join("")
        : '<p class="small muted">Nobody, yet.</p>');
    const facs = (A.S.factions || [])
      .filter(f => (f.power || 0) >= 0.2)
      .sort((a, b) => (b.power || 0) - (a.power || 0))
      .slice(0, 8);
    h2 +=
      '<div class="group-h">Restless lords</div>' +
      (facs.length
        ? facs
            .map(
              f =>
                `<div class="small">${UI.esc(A.realmShort(f.realm))}: <b>${UI.esc(A.FACTIONS[f.kind].name)}</b> — ${Math.round((f.power || 0) * 100)}% of the swords, discontent ${Math.round(f.discontent || 0)}</div>`,
            )
            .join("")
        : '<p class="small muted">The great lords are quiet everywhere.</p>');
    return h2;
  }
  let h = UI.worldTabBasic(pc);
  if (
    ((h = h.replace(
      `<button class="small ${v === "realms" ? "primary" : ""}" data-a="wview" data-v="realms">Realms</button>`,
      `<button class="small" data-a="wview" data-v="dipl">Diplomacy</button><button class="small ${v === "realms" ? "primary" : ""}" data-a="wview" data-v="realms">Realms</button>`,
    )),
    v === "map")
  ) {
    const modes = `<div class="row maptools">${Object.entries(MAP.MODES)
      .map(
        ([k, n]) =>
          `<button class="small ${UI.mapMode === k ? "primary" : ""}" data-a="mapMode" data-v="${k}">${n}</button>`,
      )
      .join("")}</div>`;
    h = h.replace('<div class="mapwrap">', modes + '<div class="mapwrap">');
    h = h.replace(
      '<button class="small" data-a="ov" data-v="bigmap">Full map</button></div>',
      '<button class="small" data-a="ov" data-v="bigmap">Full map</button></div>' + UI.mapLegend(),
    );
  }
  return h;
};

Object.assign(UI.A, {
  ambPick() {
    UI.ambPick = !UI.ambPick;
    UI.refreshTab();
  },
  setAmb(v) {
    const r = A.setAmbition(v);
    if (r.msg) UI.toast(r.msg);
    UI.ambPick = false;
    UI.refresh();
  },
  bossAct(v) {
    const r = A.bossAct(v);
    if (r && r.msg) UI.toast(r.msg);
    UI.refresh();
  },
  favor(v) {
    const [id, k] = v.split("|"),
      r = A.callFavor(id, k);
    if (r && r.msg) UI.toast(r.msg.length > 150 ? r.msg.slice(0, 147) + "…" : r.msg);
    UI.refresh();
  },
  realmView(v) {
    UI.realmView = v;
    UI.refreshTab();
  },
  diplSel(v) {
    UI.diplSel = v || null;
    UI.refreshTab();
  },
  setLaw(v) {
    const [k, x] = v.split("|"),
      r = A.setLaw(k, +x);
    if (r && r.msg) UI.toast(r.msg);
    UI.refresh();
  },
  leaveFac() {
    const r = A.leaveFaction();
    if (r && r.msg) UI.toast(r.msg);
    UI.refresh();
  },
  mapMode(v) {
    UI.mapMode = v;
    UI.refreshTab();
  },
});

Object.assign(UI.C, {
  decArg(el) {
    UI.decArg = UI.decArg || {};
    UI.decArg[el.dataset.k] = el.value.replace(/[<>]/g, "");
  },
});

UI.unitSym = function (cat, ech, color, w = 30) {
  const h = Math.round(w * 0.66),
    top = 9,
    E = A.ECH[ech] || A.ECH[0];
  let inner = "";
  if (cat === "horse") inner = `<line x1="1" y1="${top + h - 1}" x2="${w - 1}" y2="${top + 1}"/>`;
  else {
    if (cat === "missile")
      inner = `<path d="M${w * 0.32} ${top + 3} Q${w * 0.62} ${top + h / 2} ${w * 0.32} ${top + h - 3}" fill="none"/><line x1="${w * 0.32}" y1="${top + 3}" x2="${w * 0.32}" y2="${top + h - 3}"/><line x1="${w * 0.22}" y1="${top + h / 2}" x2="${w * 0.78}" y2="${top + h / 2}"/>`;
    else
      inner = `<line x1="1" y1="${top + 1}" x2="${w - 1}" y2="${top + h - 1}"/><line x1="1" y1="${top + h - 1}" x2="${w - 1}" y2="${top + 1}"/>`;
  }
  return `<svg class="usym" viewBox="0 0 ${w} ${top + h + 1}" width="${w}" height="${top + h + 1}"><text x="${w / 2}" y="7.5" text-anchor="middle" font-size="7.5" font-family="system-ui,sans-serif" font-weight="700" fill="currentColor">${E.sym}</text><rect x="0.75" y="${top + 0.75}" width="${w - 1.5}" height="${h - 1.5}" rx="1.5" fill="${color}" stroke="#111" stroke-width="1.5"/><g stroke="#111" stroke-width="1.6">${inner}</g></svg>`;
};

UI.symLegend = () =>
  `<div class="legend oob-legend"><span>${UI.unitSym("foot", 1, "#8a8a80", 22)} Foot</span><span>${UI.unitSym("horse", 1, "#8a8a80", 22)} Horse</span><span>${UI.unitSym("missile", 1, "#8a8a80", 22)} Archers</span><span class="tiny muted">Size: XXXX army · XX division (~3,200) · II battalion (~800) · I company (~200) · ••• squad (~40)</span></div>`;

UI.oobOpen = UI.oobOpen || new Set();

UI.oobRow = function (n, depth) {
  const r = A.realm(n.realm),
    col = r ? r.color : "#999",
    open = UI.oobOpen.has(n.key) || (n.onPath && !UI.oobOpen.has("x" + n.key)),
    hasKids = n.ech < 4,
    L = n.leader || {},
    lead = L.pid
      ? `<span class="click u" data-a="ov" data-v="person:${L.pid}">${UI.esc(L.name)}</span>`
      : UI.esc(L.name || ""),
    you =
      n.you === "lead"
        ? '<span class="chip gold">you lead this</span>'
        : n.you === "second"
          ? '<span class="chip gold">you: second in command</span>'
          : n.you === "member"
            ? '<span class="chip gold">you serve here</span>'
            : "";
  let h = `<div class="oob-row ${n.onPath ? "path" : ""} ${n.you ? "you" : ""}" style="padding-left:${depth * 14 + 2}px">${hasKids ? `<button class="small ghost caret" data-a="oobT" data-v="${UI.esc(n.key)}|${open ? 1 : 0}|${n.onPath ? 1 : 0}">${open ? "▾" : "▸"}</button>` : '<span class="caret"></span>'}${UI.unitSym(n.cat, n.ech, col, 26)}<div class="grow"><div class="on">${UI.esc(n.name)} <span class="muted small">${A.fmt(n.men)}</span> ${you}</div><div class="tiny muted">${UI.esc(L.title || A.ECH[n.ech].name)} ${lead}${L.boss ? ' <span class="chip">your superior</span>' : ""}${
    n.ech === 0
      ? " · " +
        Object.entries(n.comp)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([c, v]) => `${GD.TROOPS[c] ? GD.TROOPS[c].name : c} ${A.fmt(v)}`)
          .join(", ")
      : ""
  }</div></div></div>`;
  if (open && hasKids) {
    const kids = A.oobKids(n),
      pathKid = kids.find(k => k.onPath),
      lim = 24;
    let shown = kids.slice(0, lim);
    if (pathKid && !shown.includes(pathKid)) shown = shown.slice(0, lim - 1).concat([pathKid]);
    for (const k of shown) h += UI.oobRow(k, depth + 1);
    if (kids.length > shown.length)
      h += `<div class="oob-row more" style="padding-left:${(depth + 1) * 14 + 30}px"><span class="tiny muted">…and ${kids.length - shown.length} more ${A.ECH[n.ech + 1].name.toLowerCase()}s (${A.fmt(kids.slice(lim).reduce((a, x) => a + x.men, 0))} men)</span></div>`;
    if (n.ech === 3) n.you;
  }
  if (n.ech === 4 && n.you && n.onPath) {
    const pc = A.pc(),
      sq = A.squad(pc).slice(0, 10);
    if (sq.length && open)
      h += `<div class="oob-row" style="padding-left:${(depth + 1) * 14 + 30}px"><span class="tiny">Your mates: ${sq.map(c => `<span class="click u" data-a="ov" data-v="person:${c.id}">${UI.esc(c.given)}</span>`).join(", ")}</span></div>`;
  }
  return h;
};

UI.oobTree = function (root, pc) {
  return root
    ? (pc && A.oobPath(pc, root), `<div class="oob">${UI.oobRow(root, 0)}</div>`)
    : '<p class="small muted">No army.</p>';
};

UI.oobBreadcrumb = function (pc) {
  const root = A.oobArmyOf(pc);
  if (!root) return "";
  const path = A.oobPath(pc, root),
    r = A.realm(root.realm),
    col = r ? r.color : "#999";
  return `<div class="card oob-crumb"><div class="row"><span class="tag">Your place in the army</span><span class="right"></span><button class="small" data-a="ov" data-v="oob:${UI.esc(root.armyId || "")}">Order of battle ›</button></div>${path.map((n, i) => `<div class="crumb" style="margin-left:${i * 12}px">${UI.unitSym(n.cat, n.ech, col, 22)}<div><b>${UI.esc(n.name)}</b> <span class="tiny muted">${A.fmt(n.men)} · ${UI.esc((n.leader || {}).title || "")} ${UI.esc((n.leader || {}).name || "")}</span>${n.you ? ' <span class="chip gold">you</span>' : ""}${(n.leader || {}).boss ? ' <span class="chip">your superior</span>' : ""}</div></div>`).join("")}</div>`;
};

UI.ovModalOob = function (ov) {
  if (ov.type !== "oob") return UI.ovModalBasic(ov);
  const close = `<button class="ghost closex" data-a="closeOv" aria-label="Close">${UI.icon("x", "m")}</button>`,
    pc = A.pc(),
    a = ov.id && A.army ? A.army(ov.id) : null,
    root = a ? A.oobRoot(a) : A.oobArmyOf(pc),
    mine =
      pc && pc.mil && root && (root.armyId === pc.mil.army || (!pc.mil.army && root.armyId === "N" + pc.mil.realm));
  return `<div class="panel mbox wide">${close}<h2 style="margin-bottom:2px">Order of battle</h2><div class="small muted">${root ? UI.esc(root.name) + " · " + A.fmt(root.men) + " men" : ""}. Click ▸ to open a formation. Your own chain is opened and highlighted.</div>${UI.symLegend()}<div class="oob-scroll">${UI.oobTree(root, mine ? pc : null)}</div></div>`;
};

MAP.front = function (myR) {
  MAP.init();
  const S = A.S,
    key = myR + "|" + S.prov.map(p => p.occ || p.owner).join(",") + "|" + S.wars.map(w => w.id).join(",");
  if (MAP.frontCache && MAP.frontKey === key) return MAP.frontCache;
  const { gw, gh, grid } = MAP,
    cv = document.createElement("canvas");
  cv.width = gw;
  cv.height = gh;
  const ctx = cv.getContext("2d"),
    im = ctx.createImageData(gw, gh),
    d = im.data,
    ctrl = S.prov.map(p => p.occ || p.owner),
    mySide = new Set([myR]),
    foe = new Set();
  for (const w of S.wars) {
    const s = A.warSide(w, myR);
    if (s) {
      for (const x of s === "att" ? w.att : w.def) mySide.add(x);
      for (const x of s === "att" ? w.def : w.att) foe.add(x);
    }
  }
  const side = ctrl.map(c => (mySide.has(c) ? 1 : foe.has(c) ? 2 : 0));
  for (let y = 0; y < gh - 1; y++)
    for (let x = 0; x < gw - 1; x++) {
      const i = y * gw + x,
        a = grid[i];
      if (a < 0) continue;
      const r = grid[i + 1],
        dn = grid[i + gw],
        sa = side[a];
      if (!sa) continue;
      if ((r >= 0 && side[r] && side[r] !== sa) || (dn >= 0 && side[dn] && side[dn] !== sa)) {
        const o = i * 4;
        d[o] = 255;
        d[o + 1] = 70;
        d[o + 2] = 50;
        d[o + 3] = 255;
      }
    }
  ctx.putImageData(im, 0, 0);
  MAP.frontCache = cv;
  MAP.frontKey = key;
  return cv;
};

UI.wrClampView = function (v) {
  const asp = 1.5277777777777777;
  v.w = A.clamp(v.w, 500, 7e3);
  v.h = v.w / asp;
  if (v.h > 4500) {
    v.h = 4500;
    v.w = v.h * asp;
  }
  v.x0 = A.clamp(v.x0, 0, 7e3 - v.w);
  v.y0 = A.clamp(v.y0, 0, 4500 - v.h);
  return v;
};

UI.canvasCounter = function (ctx, x, y, w, cat, ech, color, sel, mine, label) {
  const h = w * 0.66;
  ctx.fillStyle = color;
  ctx.strokeStyle = sel ? "#fff" : mine ? "#ffd24a" : "#111";
  ctx.lineWidth = sel ? 3 : mine ? 2.4 : 1.4;
  ctx.fillRect(x - w / 2, y - h / 2, w, h);
  ctx.strokeRect(x - w / 2, y - h / 2, w, h);
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  const L = x - w / 2,
    T = y - h / 2,
    R2 = x + w / 2,
    B = y + h / 2;
  if (cat === "horse") {
    ctx.moveTo(L + 1, B - 1);
    ctx.lineTo(R2 - 1, T + 1);
  } else {
    if (cat === "missile") {
      ctx.moveTo(L + w * 0.32, T + 2);
      ctx.quadraticCurveTo(L + w * 0.62, y, L + w * 0.32, B - 2);
      ctx.lineTo(L + w * 0.32, T + 2);
      ctx.moveTo(L + w * 0.22, y);
      ctx.lineTo(L + w * 0.78, y);
    } else {
      ctx.moveTo(L + 1, T + 1);
      ctx.lineTo(R2 - 1, B - 1);
      ctx.moveTo(L + 1, B - 1);
      ctx.lineTo(R2 - 1, T + 1);
    }
  }
  ctx.stroke();
  ctx.font = `bold ${Math.max(8, Math.round(w / 4))}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 3;
  const sym = (A.ECH[ech] || A.ECH[0]).sym;
  ctx.strokeText(sym, x, T - 3);
  ctx.fillText(sym, x, T - 3);
  if (label) {
    ctx.font = `bold ${Math.max(9, Math.round(w / 3.4))}px system-ui, sans-serif`;
    ctx.strokeText(label, x, B + Math.max(10, w / 3));
    ctx.fillText(label, x, B + Math.max(10, w / 3));
  }
};

Object.assign(UI.A, {
  oobT(v) {
    const [key, open, onPath] = v.split("|");
    if (
      (open === "1"
        ? (UI.oobOpen.delete(key), onPath === "1" && UI.oobOpen.add("x" + key))
        : (UI.oobOpen.add(key), UI.oobOpen.delete("x" + key)),
      UI.$("#wrSide"))
    ) {
      const sd = UI.$("#wrSide"),
        st = sd.scrollTop;
      sd.innerHTML = UI.wrSide();
      sd.scrollTop = st;
    } else {
      const m = UI.$("#modal .oob-scroll"),
        st = m ? m.scrollTop : 0;
      UI.renderModal();
      const m2 = UI.$("#modal .oob-scroll");
      if (m2) m2.scrollTop = st;
    }
  },
});

UI.specCard = function (pc) {
  const out = [];
  if (pc.job && GD.SPECS[pc.job.c]) {
    const s = A.specOf(pc),
      t = A.masteryOf(pc);
    if (s || t)
      out.push(
        `<div class="card spec"><span class="tag">Your path</span>${s ? `<div><b>${UI.esc(s.n)}</b> <span class="small muted">${UI.esc(s.d)}</span></div><div class="tiny muted">Trains ${s.sk.map(k => UI.esc(GD.SKILLS[k] || k)).join(" & ")} 35% faster · pay ×${s.pay.toFixed(2)}${s.tags ? " · work in your line finds you 3× as often" : ""}</div>` : ""}${t ? `<div style="margin-top:4px"><b>Mastery: ${UI.esc(t.n)}</b> <span class="small muted">${UI.esc(t.d)}</span></div>` : ""}</div>`,
      );
  }
  if (pc.mil) {
    const a = GD.ARMS[pc.mil.arm],
      d = GD.DOCTRINES[pc.mil.doctrine];
    if (a || d)
      out.push(
        `<div class="card spec"><span class="tag">Your service</span>${a ? `<div><b>${UI.esc(a.n)}</b> <span class="small muted">${UI.esc(a.d)}</span></div><div class="tiny muted">Trains ${a.sk.map(k => UI.esc(GD.SKILLS[k])).join(" & ")} faster${a.bonus.mission ? " · missions +" + a.bonus.mission : ""}${a.bonus.battle ? " · battle line +" + a.bonus.battle + "%" : ""}${a.bonus.siege ? " · sieges 35% faster" : ""}</div>` : ""}${d ? `<div style="margin-top:4px"><b>Doctrine: ${UI.esc(d.n)}</b> <span class="small muted">${UI.esc(d.d)}</span></div>` : ""}</div>`,
      );
  }
  const ch = A.specChoices(pc)[0];
  if (ch && A.isAdult(pc))
    out.push(
      `<div class="card spec pending"><b>${UI.esc(ch.title)}</b><div class="gridcards" style="margin-top:6px">${ch.opts.map(o => `<div class="card small"><b>${UI.esc(o.n)}</b><div class="muted">${UI.esc(o.d)}</div>${o.sk ? `<div class="tiny">Trains: ${o.sk.map(k => UI.esc(GD.SKILLS[k] || k)).join(", ")}</div>` : ""}<button class="small primary" data-a="pickSpec" data-v="${ch.tier}|${o.k}">Choose</button></div>`).join("")}</div></div>`,
    );
  return out.join("");
};

UI.peacePicks = UI.peacePicks || {};

UI.peacePanel = function (wid) {
  const pc = A.pc(),
    w = A.S.wars.find(x => x.id === wid);
  if (!w || !pc.ruler) return '<p class="muted">This war is over.</p>';
  const T = A.peaceTerms(w, pc.ruler);
  if (!T) return "";
  const picks = UI.peacePicks[wid] || (UI.peacePicks[wid] = []),
    odds = A.peaceOdds(T, picks),
    lead = w.leadA === pc.ruler || w.leadD === pc.ruler;
  let h = `<div class="peace"><div class="row"><b>Terms for ${UI.esc(w.name)}</b><span class="right"></span><span class="chip">war score ${T.sc > 0 ? "+" : ""}${T.sc}</span></div><div class="tiny muted">${UI.esc(A.realmName(T.eid))} is ${T.e.exhaustion > 60 ? "exhausted" : T.e.exhaustion > 30 ? "tiring" : "still fresh"} (war weariness ${Math.round(T.e.exhaustion)}). What they will accept depends on the war score, their weariness and what you ask.</div>`;
  const grps = {};
  for (const t of T.terms) (grps[t.grp] = grps[t.grp] || []).push(t);
  for (const g in grps) {
    h += `<div class="group-h">${UI.esc(g)}</div>`;
    for (const t of grps[g]) {
      const on = picks.includes(t.k);
      h += `<label class="term ${on ? "on" : ""}"><input type="checkbox" data-c="peaceT" data-k="${wid}" value="${UI.esc(t.k)}" ${on ? "checked" : ""}><div class="grow"><div>${UI.esc(t.name)}</div><div class="tiny muted">${UI.esc(t.sub || "")}</div></div><span class="cost ${t.cost < 0 ? "good" : ""}">${t.cost > 0 ? "−" + t.cost : "+" + -t.cost}</span></label>`;
    }
  }
  const tot = odds.cost;
  // [X1 baked patch diplomacy/20-ai-personality AIP-DIPL-UI] UI.diplCard: the fictional "Slowly pulling them" list
  // (A.realmStanding fed nothing) now shows the real yearly pulls from A.aiPullParts; a temperament line names the
  // ruler's traits and what they do; every offer shows its top 3 reasons. The peace screen explains their
  // willingness.
  h += `<div class="peace-sum"><div>Your demands: <b>${tot}</b> · Their willingness: <b>${Math.round(T.will)}</b>${UI.aiWillWhy(T)}</div>${UI.barRow("They accept", odds.p, 100, odds.p < 30 ? "hpbar" : "", null, odds.p + "%")}<div class="row"><button class="primary" data-a="peaceSend" data-v="${wid}" ${lead ? "" : "disabled"}>Send the envoy (${odds.p}%)</button><button class="small" data-a="peaceClear" data-v="${wid}">Clear</button></div>${lead ? "" : '<div class="tiny bad">Only the leader of your side can make peace.</div>'}<div class="tiny muted">Two offers a year. A refusal sours relations a little.</div></div></div>`;
  return h;
};

UI.ovModalV4 = function (ov) {
  return ov.type === "peace"
    ? `<div class="panel mbox wide"><button class="ghost closex" data-a="closeOv" aria-label="Close">${UI.icon("x", "m")}</button><h2>The peace table</h2>${UI.peacePanel(ov.id)}</div>`
    : ov.type === "bigmap"
      ? UI.greatMapModal()
      : UI.ovModalOob(ov);
};

UI.TAB.realm = function (pc) {
  return UI.realmTabBasic(pc).replace(
    /data-a="rAct" data-v="peace\|([^"]+)">Offer peace<\/button>/g,
    'data-a="ov" data-v="peace:$1">Negotiate peace…</button>',
  );
};

UI.bview = null;

UI.bviewDefault = function (B) {
  const pc = A.pc(),
    r = pc.ruler ? 9 : pc.mil ? pc.mil.rank : pc.company ? 6 : 4;
  return r >= 7 ? "units" : r >= 6 ? "bat" : "coy";
};

UI.battleModal = function (B) {
  let h = UI.battleModalBasic(B);
  const v = UI.bview || UI.bviewDefault(B),
    bar = `<div class="row bview"><span class="tiny muted">View:</span>${[
      ["units", "General — units"],
      ["bat", "Commander — battalions"],
      ["coy", "Captain — companies"],
    ]
      .map(([k, n]) => `<button class="small ${v === k ? "primary" : ""}" data-a="bView" data-v="${k}">${n}</button>`)
      .join(
        "",
      )}<span class="right tiny muted">▭ foot · ▲ horse · each block ≈ ${v === "coy" ? "200 men" : v === "bat" ? "800 men" : "one unit"}</span></div>`;
  return h.replace('<div class="battle">', bar + '<div class="battle">');
};

// [X1 baked patch war/85-battle-labels BF-LABEL-RESET] UI: start each frame of the battle field with no labels
// placed (the wing captions are drawn once a frame, before the units).
UI.drawBattle = function (cv, B) {
  const ctx = cv.getContext("2d"),
    W = cv.width,
    H = cv.height,
    view = UI.bview || UI.bviewDefault(B),
    terrCol = {
      plains: ["#5d6a3a", "#4f5c30"],
      forest: ["#3b5a32", "#2e4a28"],
      hills: ["#6a6a40", "#56583a"],
      mountains: ["#6a6460", "#555050"],
      steppe: ["#8a8650", "#77723f"],
      desert: ["#b09a62", "#9e8650"],
      marsh: ["#4a5e4e", "#3e5040"],
      tundra: ["#9aa2a0", "#868e8c"],
    }[B.terr] || ["#5d6a3a", "#4f5c30"],
    g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, terrCol[1]);
  g.addColorStop(0.5, terrCol[0]);
  // [X1 baked patch war/85-battle-labels BF-FIELD] UI (cycle 1 visual I3): the battle field is drawn as a woodblock
  // print when the colour prints are on: UI.bfGround (field.core.js) lays a sky band in the battle's hour and
  // weather, a far ridge in its terrain and the near ground over the release's olive fill, and the release's
  // speckles, ellipses, fog wash and rain lines are skipped (UI.bfGroundOn). Each unit block goes through
  // UI.bfBlock, a banner pole and a mass of pikes, horses or bows in the realm's colour instead of a box with a
  // cross; the wing captions move to the field's edge; and the end strip gives way to a small cartouche (the VICTORY
  // or DEFEAT cut-in of 96-big-moments carries the moment).
  g.addColorStop(1, terrCol[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  if (UI.bfGround) UI.bfGround(ctx, W, H, B);
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#000";
  for (let i = 0; i < (UI.bfGroundOn ? 0 : 160); i++) {
    const x = (i * 97) % W,
      y = (i * 53) % H;
    ctx.fillRect(x, y, 3, 2);
  }
  // [X1 baked patch war/85-battle-labels BF-FIELD] UI (cycle 1 visual I3): the battle field is drawn as a woodblock
  // print when the colour prints are on: UI.bfGround (field.core.js) lays a sky band in the battle's hour and
  // weather, a far ridge in its terrain and the near ground over the release's olive fill, and the release's
  // speckles, ellipses, fog wash and rain lines are skipped (UI.bfGroundOn). Each unit block goes through
  // UI.bfBlock, a banner pole and a mass of pikes, horses or bows in the realm's colour instead of a box with a
  // cross; the wing captions move to the field's edge; and the end strip gives way to a small cartouche (the VICTORY
  // or DEFEAT cut-in of 96-big-moments carries the moment).
  if (!UI.bfGroundOn && B.terr === "forest") {
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#1e3a1a";
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.arc((i * 131) % W, (i * 71) % H, 9, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // [X1 baked patch war/85-battle-labels BF-FIELD] UI (cycle 1 visual I3): the battle field is drawn as a woodblock
  // print when the colour prints are on: UI.bfGround (field.core.js) lays a sky band in the battle's hour and
  // weather, a far ridge in its terrain and the near ground over the release's olive fill, and the release's
  // speckles, ellipses, fog wash and rain lines are skipped (UI.bfGroundOn). Each unit block goes through
  // UI.bfBlock, a banner pole and a mass of pikes, horses or bows in the realm's colour instead of a box with a
  // cross; the wing captions move to the field's edge; and the end strip gives way to a small cartouche (the VICTORY
  // or DEFEAT cut-in of 96-big-moments carries the moment).
  if (!UI.bfGroundOn && (B.terr === "hills" || B.terr === "mountains")) {
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = "#2a2a1a";
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.ellipse((i * 211) % W, (i * 97) % H, 70, 22, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  // [X1 baked patch war/85-battle-labels BF-FIELD] UI (cycle 1 visual I3): the battle field is drawn as a woodblock
  // print when the colour prints are on: UI.bfGround (field.core.js) lays a sky band in the battle's hour and
  // weather, a far ridge in its terrain and the near ground over the release's olive fill, and the release's
  // speckles, ellipses, fog wash and rain lines are skipped (UI.bfGroundOn). Each unit block goes through
  // UI.bfBlock, a banner pole and a mass of pikes, horses or bows in the realm's colour instead of a box with a
  // cross; the wing captions move to the field's edge; and the end strip gives way to a small cartouche (the VICTORY
  // or DEFEAT cut-in of 96-big-moments carries the moment).
  if (
    ((ctx.globalAlpha = 1),
    !UI.bfGroundOn && B.weather === "fog" && ((ctx.fillStyle = "rgba(220,220,220,.18)"), ctx.fillRect(0, 0, W, H)),
    !UI.bfGroundOn && B.weather === "rain")
  ) {
    ctx.strokeStyle = "rgba(180,200,220,.25)";
    for (let i = 0; i < 120; i++) {
      const x = (i * 37) % W,
        y = (i * 91) % H;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 4, y + 12);
      ctx.stroke();
    }
  }
  const side = B.pcSide,
    mid = H / 2,
    prog = B.phase === "deploy" ? 0 : Math.min(1, B.pulse / 3),
    wingX = {
      L: W * 0.2,
      C: W * 0.5,
      R: W * 0.8,
    };
  ctx.setLineDash([4, 6]);
  ctx.strokeStyle = "rgba(255,255,255,.12)";
  ctx.lineWidth = 1;
  // [X1 baked patch war/85-battle-labels BF-FIELD] UI (cycle 1 visual I3): the battle field is drawn as a woodblock
  // print when the colour prints are on: UI.bfGround (field.core.js) lays a sky band in the battle's hour and
  // weather, a far ridge in its terrain and the near ground over the release's olive fill, and the release's
  // speckles, ellipses, fog wash and rain lines are skipped (UI.bfGroundOn). Each unit block goes through
  // UI.bfBlock, a banner pole and a mass of pikes, horses or bows in the realm's colour instead of a box with a
  // cross; the wing captions move to the field's edge; and the end strip gives way to a small cartouche (the VICTORY
  // or DEFEAT cut-in of 96-big-moments carries the moment).
  for (const x of UI.bfGroundOn ? [] : [W / 3, (W * 2) / 3]) {
    ctx.beginPath();
    ctx.moveTo(x, 22);
    ctx.lineTo(x, H - 22);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(255,255,255,.4)";
  ctx.font = "11px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.__lb = [];
  ctx.__lbText = [];
  ctx.__lbq = [];
  // [X1 baked patch war/85-battle-labels BF-FIELD] UI (cycle 1 visual I3): the battle field is drawn as a woodblock
  // print when the colour prints are on: UI.bfGround (field.core.js) lays a sky band in the battle's hour and
  // weather, a far ridge in its terrain and the near ground over the release's olive fill, and the release's
  // speckles, ellipses, fog wash and rain lines are skipped (UI.bfGroundOn). Each unit block goes through
  // UI.bfBlock, a banner pole and a mass of pikes, horses or bows in the realm's colour instead of a box with a
  // cross; the wing captions move to the field's edge; and the end strip gives way to a small cartouche (the VICTORY
  // or DEFEAT cut-in of 96-big-moments carries the moment).
  if (UI.bfGroundOn && UI.bfWings) UI.bfWings(ctx, W, H, wingX);
  else {
    ctx.fillText("LEFT WING", wingX.L, mid + 4);
    ctx.fillText("CENTER", wingX.C, mid + 4);
    ctx.fillText("RIGHT WING", wingX.R, mid + 4);
  }
  const per = view === "coy" ? 200 : view === "bat" ? 800 : 0,
    draw = (k, bottom) => {
      const s = B.sides[k],
        col = s.color || "#999";
      for (const w of ["L", "C", "R", "X"]) {
        const us = s.units.filter(u => u.wing === w && u.status !== "gone");
        if (!us.length) continue;
        const ww = bottom
            ? w
            : {
                L: "R",
                R: "L",
                C: "C",
                X: "X",
              }[w],
          x0 = ww === "X" ? W * 0.5 : wingX[ww],
          wingW = W / 3 - 24;
        let yoff = 0,
          cx = 0,
          rowH = 0;
        const lay = us.map(u => {
            const T = GD.TROOPS[u.code] || GD.TROOPS.SP;
            let n = 1,
              pp = per,
              cols = 1,
              bwid = Math.max(16, Math.min(170, Math.sqrt(u.men) * 2.1)),
              bh = T.mount ? 16 : 22;
            if (per) {
              for (n = Math.max(1, Math.ceil(u.men / per)); n > 32; ) {
                pp *= 2;
                n = Math.ceil(u.men / pp);
              }
              cols = Math.min(n, Math.max(2, Math.ceil(Math.sqrt(n * 3))));
              bwid = Math.min(12, Math.max(6, 110 / cols));
              bh = Math.max(5, Math.round(bwid * 0.72));
            }
            const rows = Math.ceil(n / cols);
            return {
              n,
              cols,
              bwid,
              bh,
              totW: per ? cols * (bwid + 2) : bwid,
              totH: per ? rows * (bh + 2) : bh,
            };
          }),
          lines = [];
        let line = [];
        lay.forEach((L, i) => {
          const wNeed = L.totW + 10;
          if (line.length && cx + wNeed > wingW) {
            lines.push(line);
            line = [];
            cx = 0;
          }
          line.push(i);
          cx += wNeed;
        });
        if (line.length) lines.push(line);
        const pos = [];
        lines.forEach(ln => {
          const lw = ln.reduce((a, i) => a + lay[i].totW + 10, -10);
          let xx = x0 - lw / 2;
          const lh = Math.max(...ln.map(i => lay[i].totH));
          for (const i of ln) {
            pos[i] = {
              x: xx,
              dy: yoff,
              lh,
            };
            xx += lay[i].totW + 10;
          }
          yoff += lh + (per ? 18 : 10);
        });
        us.forEach((u, i) => {
          const T = GD.TROOPS[u.code] || GD.TROOPS.SP,
            cat = A.catOf ? A.catOf(u.code) : T.mount ? "horse" : "foot",
            adv = (u.tac && !A.tfx(u, "noAdvance", false) ? 1 : 0.4) * prog,
            { n, cols, bwid, bh, totW, totH } = lay[i];
          let y;
          const ps = pos[i];
          if (w === "X") y = bottom ? H - 30 - totH - ps.dy : 24 + ps.dy;
          else y = bottom ? mid + 26 - adv * 24 + ps.dy : mid - 26 - totH + adv * 24 - ps.dy;
          let x = ps.x;
          if (u.status === "rout") y += bottom ? 40 : -40;
          ctx.globalAlpha = u.status === "rout" ? 0.35 : u.status === "shaken" ? 0.7 : 1;
          // [X1 baked patch war/85-battle-labels BF-FIELD] UI (cycle 1 visual I3): the battle field is drawn as a woodblock
          // print when the colour prints are on: UI.bfGround (field.core.js) lays a sky band in the battle's hour and
          // weather, a far ridge in its terrain and the near ground over the release's olive fill, and the release's
          // speckles, ellipses, fog wash and rain lines are skipped (UI.bfGroundOn). Each unit block goes through
          // UI.bfBlock, a banner pole and a mass of pikes, horses or bows in the realm's colour instead of a box with a
          // cross; the wing captions move to the field's edge; and the end strip gives way to a small cartouche (the VICTORY
          // or DEFEAT cut-in of 96-big-moments carries the moment).
          // [X1 baked patch war/85-battle-labels BF-SIDE-EDGE] UI (cycle 2 visual B5): one colour code for the two sides. A
          // unit's edge (its cap, and the flag edge of 85's banner masses) takes the side's colour from UI.bfSides (the
          // theme's --info for ours, --danger for theirs) instead of a fixed blue and red that the legend, the standards and
          // the intents did not share.
          const edge = UI.bfSides ? UI.bfSides()[bottom ? "us" : "them"] : bottom ? "#2a6ab0" : "#a02a2a",
            block = (bx, by, bw2, bh2) => {
              if (UI.bfGroundOn && UI.bfBlock && UI.bfBlock(ctx, bx, by, bw2, bh2, col, edge, cat, per, bottom)) return;
              if (
                ((ctx.fillStyle = col),
                (ctx.strokeStyle = edge),
                (ctx.lineWidth = per ? 1.2 : 2.5),
                cat === "horse" && !per)
              ) {
                ctx.beginPath();
                ctx.moveTo(bx, by + bh2);
                ctx.lineTo(bx + bw2 / 2, by);
                ctx.lineTo(bx + bw2, by + bh2);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                return;
              }
              ctx.fillRect(bx, by, bw2, bh2);
              ctx.strokeRect(bx, by, bw2, bh2);
              if (bw2 >= 7) {
                ctx.strokeStyle = "rgba(0,0,0,.55)";
                ctx.lineWidth = 1;
                ctx.beginPath();
                if (cat === "horse") {
                  ctx.moveTo(bx + 1, by + bh2 - 1);
                  ctx.lineTo(bx + bw2 - 1, by + 1);
                } else {
                  if (cat === "missile") ctx.arc(bx + bw2 / 2, by + bh2 / 2, Math.min(bw2, bh2) / 4, 0, Math.PI * 2);
                  else {
                    ctx.moveTo(bx + 1, by + 1);
                    ctx.lineTo(bx + bw2 - 1, by + bh2 - 1);
                    ctx.moveTo(bx + 1, by + bh2 - 1);
                    ctx.lineTo(bx + bw2 - 1, by + 1);
                  }
                }
                ctx.stroke();
              }
            };
          if (!per) block(x, y, bwid, bh);
          else
            for (let j = 0; j < n; j++)
              block(x + (j % cols) * (bwid + 2), y + Math.floor(j / cols) * (bh + 2), bwid, bh);
          // [X1 baked patch war/85-battle-labels BF-MINE] UI (cycle 2 visual B5): the player's own company is marked on the
          // field (UI.bfMine: an accent outline, a chevron and a YOU tag over the unit whose u.coMine is "me", from
          // 9997-companies), drawn before its morale bar.
          if (UI.bfMine) UI.bfMine(ctx, u, x, y, totW, totH, bottom, B);
          ctx.fillStyle = "#111";
          ctx.fillRect(x, bottom ? y + totH + 1 : y - 4, totW, 3);
          ctx.fillStyle = u.morale > 50 ? "#8fc27a" : u.morale > 30 ? "#e3b25a" : "#e07a63";
          ctx.fillRect(x, bottom ? y + totH + 1 : y - 4, totW * Math.max(0, Math.min(1, u.morale / 100)), 3);
          ctx.globalAlpha = 1;
          ctx.font = "bold 11px sans-serif";
          ctx.textAlign = "center";
          const lab =
              (per && GD.TROOPS[u.code] ? GD.TROOPS[u.code].name : u.code) +
              " " +
              (u.men >= 1e3 ? (u.men / 1e3).toFixed(1) + "k" : u.men),
            ly = per ? (bottom ? y + totH + 14 : y - 7) : y + bh / 2 + 4;
          ctx.strokeStyle = "rgba(255,248,230,.85)";
          ctx.lineWidth = 3;
          // [X1 baked patch war/85-battle-labels BF-LABEL] UI: unit labels were drawn centred on their blocks with no regard
          // for neighbours, and a crowded centre printed them over each other ("Heavy infSpeaCrossbowmen"). Each label now
          // moves away from the line, or shortens to its count, when it would overlap one already drawn.
          if (UI.bfLabel) UI.bfLabel(ctx, lab, x + totW / 2, ly, bottom);
          else {
            ctx.strokeText(lab, x + totW / 2, ly);
            ctx.fillStyle = "#1a140c";
            ctx.fillText(lab, x + totW / 2, ly);
          }
        });
      }
    };
  // [X1 baked patch war/85-battle-labels BF-LABEL-FLUSH] UI: draw the frame's unit labels after both sides' blocks,
  // so a later unit's blocks cannot cover an earlier unit's label.
  if (
    (draw(side === "A" ? "B" : "A", false),
    draw(side, true),
    UI.bfLabelFlush && UI.bfLabelFlush(ctx),
    B.phase !== "deploy" && B.pulse <= 2)
  ) {
    ctx.strokeStyle = "rgba(30,20,10,.5)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 40; i++) {
      const x = (i * 23) % W;
      ctx.beginPath();
      ctx.moveTo(x, mid + 50);
      ctx.quadraticCurveTo(x + 20, mid - 30, x + 30, mid - 60);
      ctx.stroke();
    }
  }
  // [X1 baked patch war/85-battle-labels BF-BANDS] UI (cycle 2 visual B6): the side bands (each side's name at the
  // field's top and bottom) are drawn by UI.bfBands, so the battle camera can paint them again, unzoomed, over its
  // 1.16x crop instead of cutting them to "ıdmark"; they also carry the side's colour key.
  if (UI.bfBands) UI.bfBands(ctx, W, H, B);
  else {
    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.fillRect(0, 0, W, 18);
    ctx.fillRect(0, H - 18, W, 18);
    ctx.fillStyle = "#f1d58e";
    ctx.font = "bold 12px Georgia";
    ctx.textAlign = "left";
    ctx.fillText(B.sides[side === "A" ? "B" : "A"].name, 8, 13);
    ctx.fillText(B.sides[side].name + " (you)", 8, H - 5);
  }
  // [X1 baked patch war/85-battle-labels BF-FIELD] UI (cycle 1 visual I3): the battle field is drawn as a woodblock
  // print when the colour prints are on: UI.bfGround (field.core.js) lays a sky band in the battle's hour and
  // weather, a far ridge in its terrain and the near ground over the release's olive fill, and the release's
  // speckles, ellipses, fog wash and rain lines are skipped (UI.bfGroundOn). Each unit block goes through
  // UI.bfBlock, a banner pole and a mass of pikes, horses or bows in the realm's colour instead of a box with a
  // cross; the wing captions move to the field's edge; and the end strip gives way to a small cartouche (the VICTORY
  // or DEFEAT cut-in of 96-big-moments carries the moment).
  if (B.phase === "end") {
    if (UI.bfGroundOn && UI.bfEnd) UI.bfEnd(ctx, W, H, B, side);
    else {
      ctx.fillStyle = "rgba(0,0,0,.45)";
      ctx.fillRect(0, mid - 26, W, 52);
      ctx.fillStyle = "#f1d58e";
      ctx.font = "bold 26px Georgia";
      ctx.textAlign = "center";
      // [X1 baked patch war/85-battle-labels BF-FIELD] UI (cycle 1 visual I3): the battle field is drawn as a woodblock
      // print when the colour prints are on: UI.bfGround (field.core.js) lays a sky band in the battle's hour and
      // weather, a far ridge in its terrain and the near ground over the release's olive fill, and the release's
      // speckles, ellipses, fog wash and rain lines are skipped (UI.bfGroundOn). Each unit block goes through
      // UI.bfBlock, a banner pole and a mass of pikes, horses or bows in the realm's colour instead of a box with a
      // cross; the wing captions move to the field's edge; and the end strip gives way to a small cartouche (the VICTORY
      // or DEFEAT cut-in of 96-big-moments carries the moment).
      ctx.fillText(B.winner === side ? "VICTORY" : B.winner === "draw" ? "DRAWN FIELD" : "DEFEAT", W / 2, mid + 9);
    }
  }
};

UI.gm = UI.gm || {
  view: null,
  sel: null,
};

UI.greatMapModal = function () {
  const modes = Object.entries(MAP.MODES)
    .map(
      ([k, n]) =>
        `<button class="small ${UI.mapMode === k ? "primary" : ""}" data-a="gmMode" data-v="${k}">${n}</button>`,
    )
    .join("");
  return `<div class="panel mbox full greatmap"><div class="row wr-top"><h2 style="margin:0">Ardan in ${A.S.year} AR</h2><span class="right"></span><button class="small" data-a="closeOv">Close</button></div>
    <div class="row maptools" style="margin:6px 0">${modes}</div>
    <div class="wr-body"><div class="mapwrap wr-map"><canvas id="gmap" width="1100" height="720"></canvas><div class="mapzoom"><button class="small" data-a="gmZoom" data-v="1.5">+</button><button class="small" data-a="gmZoom" data-v="0.66">−</button><button class="small" data-a="gmZoom" data-v="fit">⤢</button><button class="small" data-a="gmZoom" data-v="home">⌂ home</button></div></div><div class="wr-side" id="gmSide">${UI.gmSide()}</div></div>
    ${
      UI.mapMode && UI.mapMode !== "political" && UI.mapMode !== "terrain"
        ? UI.mapLegend()
        : `<div class="legend">${Object.values(A.S.realms)
            .filter(r => r.alive)
            .sort((a, b) => b.pop - a.pop)
            .slice(0, 40)
            .map(r => `<span><i style="background:${r.color}"></i>${UI.esc(r.short)}</span>`)
            .join("")}</div>`
    }
    <div class="tiny muted">Drag to pan, scroll or +/− to zoom. Zoom in to read province names. Click a province for its details.</div></div>`;
};

UI.provPanel = function (pid) {
  const p = A.prov(pid);
  if (!p) return "";
  const r = A.realm(p.owner),
    pc = A.pc(),
    occ = p.occ ? A.realm(p.occ) : null,
    arms = A.armiesAt ? A.armiesAt(p.id) : [],
    claims = Object.values(A.S.realms).filter(x => x.alive && x.claims && x.claims[p.id] && x.id !== p.owner),
    bld = Object.keys(p.bld || {})
      .filter(k => p.bld[k])
      .map(
        k =>
          (
            A.BUILDINGS[k] || {
              name: k,
            }
          ).name,
      ),
    isCap = r && r.capitalProv === p.id;
  let h = `<div class="card"><div class="row"><span class="swatch" style="background:${r ? r.color : "#888"}"></span><h3 style="margin:0">${UI.esc(p.name)}</h3>${isCap ? '<span class="chip gold">capital</span>' : ""}${pc && pc.home === p.id ? '<span class="chip gold">your home</span>' : ""}</div>
    <div class="small">${r ? `<span class="click u" data-a="gmRealm" data-v="${r.id}">${UI.esc(r.name)}</span>` : "Unclaimed land"}${occ ? ` · <span class="bad">held by ${UI.esc(occ.short)}</span>` : ""}</div>
    <div class="kv small" style="margin-top:6px"><div>Land</div><div>${UI.esc(A.cap(p.terr))}, ${UI.esc(p.biome || "")}${p.coast ? ", coast" : ""}</div><div>People</div><div>${A.fmt(p.pop)}${p.town ? " · town of " + A.fmt(p.town) : ""}</div><div>Development</div><div>${p.dev || 1} / 9</div><div>Walls</div><div>${p.fort ? "▮".repeat(p.fort) + " (" + p.fort + ")" : "none"}</div><div>Unrest</div><div>${Math.round(p.unrest || 0)}</div>${bld.length ? `<div>Built</div><div>${bld.map(UI.esc).join(", ")}</div>` : ""}${claims.length ? `<div>Claimed by</div><div class="warn">${claims.map(x => UI.esc(x.short)).join(", ")}</div>` : ""}</div>`;
  {
    const ds = A.divsAt ? A.divsAt(p.id) : [],
      by = {};
    for (const d of ds) (by[d.r] = by[d.r] || []).push(d);
    const ks = Object.keys(by);
    if (ks.length)
      h += `<div class="group-h">Divisions here</div>${ks
        .map(rid => {
          const rr = A.realm(rid),
            L = by[rid];
          return `<div class="small row"><span class="swatch" style="background:${rr ? rr.color : "#999"}"></span><b>${UI.esc(A.realmShort(rid))}</b><span class="muted">${L.length} division${L.length > 1 ? "s" : ""} · ${A.fmt(L.reduce((x, d) => x + d.men, 0))} men${L.some(d => d.sieging) ? " · besieging" : ""}${L.some(d => d.atk != null) || (A.S.fights || {})[p.id] ? " · in battle" : ""}</span></div>`;
        })
        .join("")}`;
  }
  const hs = Object.values(A.S.houses)
    .filter(x => x.seat === p.name && !x.extinct)
    .slice(0, 6);
  if (hs.length)
    h += `<div class="group-h">Houses seated here</div>${hs.map(x => `<div class="small click" data-a="ov" data-v="house:${x.id}">${PORTRAIT.coat(x, 14)} ${UI.esc(x.name)}</div>`).join("")}`;
  return h + "</div>";
};

UI.gmSide = function () {
  return UI.gm.sel != null && A.prov(UI.gm.sel)
    ? UI.provPanel(UI.gm.sel) +
        (A.prov(UI.gm.sel).owner && A.realm(A.prov(UI.gm.sel).owner) ? UI.realmCard(A.prov(UI.gm.sel).owner) : "")
    : '<p class="small muted">Click a province.</p>' + (UI.mapHl ? UI.realmCard(UI.mapHl) : "");
};

UI.gmFit = () =>
  UI.wrClampView({
    x0: 0,
    y0: 0,
    w: 7e3,
    h: 4500,
  });

UI.gmDraw = function () {
  const cv = UI.$("#gmap");
  if (!cv) return;
  MAP.init();
  const ctx = cv.getContext("2d"),
    W = cv.width,
    H = cv.height,
    v = UI.gm.view || (UI.gm.view = UI.gmFit()),
    S = A.S,
    pc = A.pc(),
    focus = UI.mapFocus ? UI.mapFocus() : null,
    zoom = 7e3 / v.w;
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
    sh = (v.h / 4500) * MAP.gh;
  ctx.imageSmoothingEnabled = zoom > 1.4;
  ctx.drawImage(MAP.overlay(UI.mapMode || "political", UI.mapHl || null, focus), sx, sy, sw, sh, 0, 0, W, H);
  if (S.wars.length && focus && A.atWar(focus).length) ctx.drawImage(MAP.front(focus), sx, sy, sw, sh, 0, 0, W, H);
  // [X1 baked patch map/62-inked-map IM-LINES] Right after each map lays its realm colours (MAP.draw, the full map,
  // the war room), MAP.inkLines inks the borders, towns and keeps over them, so the wash never greys the line work.
  ctx.imageSmoothingEnabled = true;
  if (MAP.inkLines) MAP.inkLines(ctx, W, H, v);
  const P = (kx, ky) => [((kx - v.x0) / v.w) * W, ((ky - v.y0) / v.h) * H];
  if (UI.gm.sel != null) {
    const p = A.prov(UI.gm.sel);
    if (p) {
      const [x, y] = P(p.sx, p.sy);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 12 + zoom, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  // [X1 baked patch map/62-inked-map IM-MARKS-GM] The full map (UI.gmDraw) lets MAP.marks write province and realm
  // names in ink; when it does, the release's light names, fort squares and capital dots are skipped.
  if (!(MAP.marks && MAP.marks(ctx, W, H, v, {})) && zoom >= 1.8) {
    ctx.font = `${Math.round(9 + Math.min(5, zoom))}px Georgia, serif`;
    ctx.textAlign = "center";
    for (const p of S.prov) {
      const [x, y] = P(p.sx, p.sy);
      if (!(x < -40 || y < -20 || x > W + 40 || y > H + 20)) {
        ctx.fillStyle = "rgba(20,16,12,.8)";
        ctx.fillText(p.name, x + 0.8, y + 13.8);
        ctx.fillStyle = p.occ ? "#ffcf9a" : "#f1e6c8";
        ctx.fillText(p.name, x, y + 13);
        if (p.fort >= 2) {
          ctx.fillStyle = "#d8b25e";
          ctx.fillRect(x - 3, y - 3, 6, 6);
        }
      }
    }
  }
  // [X1 baked patch map/62-inked-map IM-MARKS-GM] The full map (UI.gmDraw) lets MAP.marks write province and realm
  // names in ink; when it does, the release's light names, fort squares and capital dots are skipped.
  ctx.textAlign = "center";
  for (const id in MAP.inkOn && MAP.inkOn() ? {} : S.realms) {
    const r = S.realms[id];
    if (!r.alive || r.capitalProv == null) continue;
    const p = A.prov(r.capitalProv);
    if (!p) continue;
    const [x, y] = P(p.sx, p.sy);
    if (!(x < -60 || y < -30 || x > W + 60 || y > H + 30)) {
      ctx.fillStyle = "#fff2b8";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (r.provCount >= 2 || zoom >= 2) {
        ctx.font = `bold ${Math.round(Math.max(11, 15 - zoom))}px Georgia, serif`;
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = "rgba(20,14,8,.9)";
        ctx.strokeText(r.short, x, y - 8);
        ctx.fillStyle = "#f4e4b0";
        ctx.fillText(r.short, x, y - 8);
      }
    }
  }
  const groups = {};
  for (const a of S.armies || []) (groups[a.loc] = groups[a.loc] || []).push(a);
  for (const loc in groups) {
    const p = S.prov[loc];
    groups[loc].forEach((a, i) => {
      let [x, y] = P(p.sx, p.sy);
      x += (i - (groups[loc].length - 1) / 2) * 26;
      y -= 18;
      const r = A.realm(a.realm),
        men = A.armyMen(a);
      if (UI.canvasCounter)
        UI.canvasCounter(
          ctx,
          x,
          y,
          22 + Math.min(10, zoom * 2),
          A.mainCat(a.comp),
          0,
          r ? r.color : "#999",
          false,
          false,
          men >= 1e3 ? Math.round(men / 1e3) + "k" : String(men),
        );
    });
  }
  if (pc) {
    const hp = A.prov(pc.home);
    if (hp) {
      const [x, y] = P(hp.sx, hp.sy);
      ctx.strokeStyle = "#d8b25e";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
};

UI.gmAttach = function () {
  const cv = UI.$("#gmap");
  if (!cv) return;
  UI.gmDraw();
  const toProv = ev => {
      const r = cv.getBoundingClientRect(),
        v = UI.gm.view,
        kx = v.x0 + ((ev.clientX - r.left) / r.width) * v.w,
        ky = v.y0 + ((ev.clientY - r.top) / r.height) * v.h,
        gx = Math.floor((kx / 7e3) * MAP.gw),
        gy = Math.floor((ky / 4500) * MAP.gh);
      return gx < 0 || gy < 0 || gx >= MAP.gw || gy >= MAP.gh ? -1 : MAP.grid[gy * MAP.gw + gx];
    },
    wrap = cv.parentElement;
  let tip = wrap.querySelector(".maptip");
  if (!tip) {
    tip = document.createElement("div");
    tip.className = "maptip hidden";
    wrap.appendChild(tip);
  }
  let drag = null;
  cv.onpointerdown = ev => {
    drag = {
      x: ev.clientX,
      y: ev.clientY,
      moved: false,
    };
  };
  cv.onpointerup = () => {
    if (drag && drag.moved) UI.gm.dragged = true;
    drag = null;
  };
  cv.onpointermove = ev => {
    if (drag) {
      const dx = ev.clientX - drag.x,
        dy = ev.clientY - drag.y;
      if (drag.moved || Math.hypot(dx, dy) > 5) {
        drag.moved = true;
        drag.x = ev.clientX;
        drag.y = ev.clientY;
        const r2 = cv.getBoundingClientRect(),
          v = UI.gm.view;
        v.x0 -= (dx / r2.width) * v.w;
        v.y0 -= (dy / r2.height) * v.h;
        UI.wrClampView(v);
        // [X1 baked patch ui/59-descriptions TT-MAP-TIP-CLICK] UI: the world map (MAP.bind), the Atlas-less world view
        // (UI.gm) and the War Room showed a province card whenever the pointer moved over a province, which a phone never
        // does and which the owner's rule (descriptions open on click, never on hover) forbids. The card is now made by a
        // press on the province (the press still selects it as before); a second press on the same province, Esc, or a
        // press anywhere else closes it (UI.TT.hideMapTips). Drag is untouched.
        UI.gmDraw();
        tip.classList.add("hidden");
        return;
      }
    }
  };
  cv.__gmTip = ev => {
    const pid = toProv(ev);
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
    const p = A.prov(pid),
      r = A.realm(p.owner);
    tip.innerHTML = `<b>${UI.esc(p.name)}</b> — ${UI.esc(r ? r.short : "Unclaimed")}${p.occ ? ` <span style="color:#e8925a">(held by ${UI.esc(A.realmShort(p.occ))})</span>` : ""}<br>${UI.esc(A.cap(p.terr))} · ${A.fmt(p.pop)} people${p.fort ? " · walls " + p.fort : ""}`;
    const wr = wrap.getBoundingClientRect();
    tip.style.left = Math.min(wr.width - 270, ev.clientX - wr.left + 14) + "px";
    tip.style.top = ev.clientY - wr.top + 14 + "px";
    // [X1 baked patch ui/59-descriptions TT-MAP-TIP-CLICK] UI: the world map (MAP.bind), the Atlas-less world view
    // (UI.gm) and the War Room showed a province card whenever the pointer moved over a province, which a phone never
    // does and which the owner's rule (descriptions open on click, never on hover) forbids. The card is now made by a
    // press on the province (the press still selects it as before); a second press on the same province, Esc, or a
    // press anywhere else closes it (UI.TT.hideMapTips). Drag is untouched.
    tip.classList.remove("hidden");
  };
  cv.onclick = ev => {
    if (UI.gm.dragged) {
      UI.gm.dragged = false;
      return;
    }
    cv.__gmTip(ev);
    const pid = toProv(ev);
    if (pid < 0) return;
    UI.gm.sel = pid;
    UI.mapHl = A.prov(pid).owner;
    const sd = UI.$("#gmSide");
    if (sd) sd.innerHTML = UI.gmSide();
    UI.gmDraw();
  };
  cv.onwheel = ev => {
    ev.preventDefault();
    const r = cv.getBoundingClientRect(),
      v = UI.gm.view,
      px = (ev.clientX - r.left) / r.width,
      py = (ev.clientY - r.top) / r.height,
      kx = v.x0 + v.w * px,
      ky = v.y0 + v.h * py,
      f = ev.deltaY < 0 ? 1.25 : 0.8;
    v.w /= f;
    v.h /= f;
    v.x0 = kx - v.w * px;
    v.y0 = ky - v.h * py;
    UI.wrClampView(v);
    UI.gmDraw();
  };
};

UI.afterModalBattle = function () {
  UI.afterModalBasic();
  if (UI.ov && UI.ov.type === "bigmap" && !(A.S && A.S.queue[0])) UI.gmAttach();
};

Object.assign(UI.A, {
  pickSpec(v) {
    const [tier, k] = v.split("|");
    if (A.chooseSpec(tier, k).ok) UI.toast("Path chosen.");
    UI.refresh();
  },
  peaceClear(v) {
    UI.peacePicks[v] = [];
    UI.peaceRedraw();
  },
  peaceSend(v) {
    const r = A.peaceOffer(v, UI.peacePicks[v] || []);
    UI.toast(r.msg);
    if (r.ok) {
      UI.peacePicks[v] = [];
      UI.wr.peace = null;
      if (UI.ov && UI.ov.type === "peace") UI.ov = null;
    }
    UI.mapVer = (UI.mapVer || 0) + 1;
    if (A.S.queue[0] && A.S.queue[0].type === "warroom") UI.renderModal();
    else UI.refresh();
  },
  bView(v) {
    UI.bview = v;
    UI.renderModal();
  },
  gmMode(v) {
    UI.mapMode = v;
    UI.renderModal();
  },
  gmZoom(v) {
    const view = UI.gm.view || (UI.gm.view = UI.gmFit());
    if (v === "fit") UI.gm.view = UI.gmFit();
    else if (v === "home") {
      const pc = A.pc(),
        hp = pc && A.prov(pc.home);
      if (hp) {
        view.w = 2e3;
        view.h = 2e3 / (1100 / 720);
        view.x0 = hp.sx - view.w / 2;
        view.y0 = hp.sy - view.h / 2;
        UI.wrClampView(view);
        UI.gm.sel = hp.id;
        const sd = UI.$("#gmSide");
        if (sd) sd.innerHTML = UI.gmSide();
      }
    } else {
      const f = +v,
        cx = view.x0 + view.w / 2,
        cy = view.y0 + view.h / 2;
      view.w /= f;
      view.h /= f;
      view.x0 = cx - view.w / 2;
      view.y0 = cy - view.h / 2;
      UI.wrClampView(view);
    }
    UI.gmDraw();
  },
  gmRealm(v) {
    UI.mapHl = v;
    const sd = UI.$("#gmSide");
    if (sd) sd.innerHTML = UI.gmSide();
  },
});

UI.peaceRedraw = function () {
  if (UI.wr && UI.wr.peace && UI.$("#wrSide")) {
    const sd = UI.$("#wrSide"),
      st = sd.scrollTop;
    sd.innerHTML = UI.wrSide();
    sd.scrollTop = st;
  } else UI.renderModal();
};

Object.assign(UI.C, {
  peaceT(el) {
    const wid = el.dataset.k,
      p = UI.peacePicks[wid] || (UI.peacePicks[wid] = []),
      i = p.indexOf(el.value);
    // [X1 baked patch core/04-world-fixes WLD-REPARATIONS-EXCLUSIVE] "Reparations" and "Crushing reparations" could
    // both be ticked and were both paid: 3.5x gold for cost 44 beat the crushing option alone (2.5x for 30). They are
    // now one choice: the engine keeps only the crushing one if both arrive, and ticking one unticks the other.
    if (el.checked && i < 0) p.push(el.value);
    if (!el.checked && i >= 0) p.splice(i, 1);
    const other = {
      gold: "gold2",
      gold2: "gold",
    }[el.value];
    if (el.checked && other && p.includes(other)) p.splice(p.indexOf(other), 1);
    UI.peaceRedraw();
  },
});

UI.recapCard = function (pc) {
  const R2 = A.S.recap;
  let h = "";
  if (R2 && R2.lines.length && R2.year === A.S.year && !UI.recapHide)
    h += `<div class="card recap"><div class="row"><span class="tag">${R2.year} in review</span><span class="right"></span><button class="small ghost" data-a="recapHide">hide</button></div><div class="recap-l">${R2.lines.map(([t, c]) => `<span class="rl ${c}">${UI.esc(t)}</span>`).join("")}</div></div>`;
  return h;
};

Object.assign(UI.A, {
  recapHide() {
    UI.recapHide = true;
    UI.refreshTab();
  },
});

UI.wr = {
  run: false,
  speed: 1,
  sel: null,
  tab: "cmd",
  timer: null,
  view: null,
  msg: "",
  mode: "sides",
  tplEdit: null,
  seen: {},
  help: false,
};

UI.WR_SIDE_COL = {
  me: "#e8c35a",
  ally: "#79b4e6",
  foe: "#e0644f",
  neutral: "#8d887c",
};

UI.wrMyR = function (pc) {
  pc = pc || A.pc();
  return pc.ruler || (pc.mil && !pc.mil.merc ? pc.mil.realm : pc.realm);
};

UI.wrSideOf = function (rid, myR) {
  return rid === myR ? "me" : A.hostile(myR, rid) ? "foe" : A.friendly(myR, rid) ? "ally" : "neutral";
};

UI.wrIcon = (n, c) => (UI.icon ? UI.icon(n, c || "s") : "");

UI.wrPct = v => Math.round(v * 100) + "%";

UI.kfmt = n => {
  n = Math.round(n);
  const a = Math.abs(n);
  return a >= 1e5 ? Math.round(n / 1e3) + "k" : a >= 1e4 ? (n / 1e3).toFixed(1).replace(/\.0$/, "") + "k" : A.fmt(n);
};

UI.wrTabs = function (R2) {
  const pc = A.pc(),
    ruler = R2.key === "ruler",
    lockT = R2.templates ? null : "Marshal or ruler",
    lockP = ruler ? null : "Ruler only",
    lockM = R2.recruit ? null : "Marshal or ruler";
  return [
    {
      k: "cmd",
      n: "Command",
      ic: "target",
    },
    {
      k: "forces",
      n: "Forces",
      ic: "layers",
    },
    {
      k: "tpl",
      n: "Templates",
      ic: "pencil",
      lock: lockT && !(pc.mil && pc.mil.rank >= 6) ? lockT : null,
    },
    {
      k: "ind",
      n: "Industry",
      ic: "factory",
      lock: lockP && !(pc.mil && pc.mil.rank >= 7) ? lockP : null,
    },
    {
      k: "mp",
      n: "Manpower",
      ic: "users",
      lock: lockM && !(pc.mil && pc.mil.rank >= 7) ? lockM : null,
    },
    {
      k: "wars",
      n: "Wars",
      ic: "flag",
    },
  ];
};

UI.wrHint = function () {
  const pc = A.pc(),
    R2 = A.cmdRole(pc),
    s = UI.wr.sel;
  if (s && s.k === "divs") {
    const can = s.ids.map(A.divById).filter(d => d && R2.divs.has(d.id));
    if (can.length)
      return `${UI.wrIcon("route")} <b>${can.length} division${can.length > 1 ? "s" : ""} selected.</b> Click a province to march there — or onto enemy troops next to you to attack. Right-click works too.`;
  }
  return s && s.k === "army" && R2.armies.has(s.id)
    ? `${UI.wrIcon("flag")} <b>Army selected.</b> Click a province to set the battle-plan objective.`
    : R2.divs.size
      ? `${UI.wrIcon("info")} Click a gold-edged counter to select your divisions. Drag to pan, wheel or buttons to zoom.`
      : `${UI.wrIcon("info")} Drag to pan, wheel or buttons to zoom. Click a counter or a battle for details.`;
};

UI.wrValidateSel = function () {
  const s = UI.wr.sel;
  if (s) {
    if (s.k === "divs") {
      s.ids = s.ids.filter(id => A.divById(id));
      if (!s.ids.length) UI.wr.sel = null;
    }
    if (s.k === "army" && !A.army(s.id)) UI.wr.sel = null;
    if (s.k === "fight" && !(A.S.fights || {})[s.pid]) UI.wr.sel = null;
  }
};

UI.wrSide = function () {
  if (UI.wr.help) return UI.wrHelpPanel();
  const t = UI.wr.tab;
  let h = UI.wr.msg ? `<div class="card wr-msg small" role="status">${UI.esc(UI.wr.msg)}</div>` : "";
  if (t === "forces") h += UI.wrForces();
  else {
    if (t === "tpl") h += UI.wrTemplates();
    else {
      if (t === "ind") h += UI.wrIndustry();
      else {
        if (t === "mp") h += UI.wrManpower();
        else {
          if (t === "wars") h += UI.wrWars();
          else h += UI.wrCommand();
        }
      }
    }
  }
  return h;
};

UI.wrHelpPanel = function () {
  const sec = (t, b) => `<div class="card small"><h4>${t}</h4>${b}</div>`;
  return `<div class="row"><button class="small" data-a="wrHelp">${UI.wrIcon("arrow-right")} Back</button><b>How war works</b></div>
  ${sec("Divisions and counters", "<p>Every counter on the map is a stack of <b>divisions</b> in one province. The number is how many. The green bar is <b>organization</b> (how long they keep fighting); the amber bar is <b>strength</b> (men and kit).</p>")}
  ${sec("Attacking", "<p>March a division onto an enemy-held province with enemy troops in it and it <b>attacks from where it stands</b>. Each side puts divisions into the line up to the <b>combat width</b> of the terrain (plains 70, forest 50, mountains 35; +35 for each extra direction you attack from).</p><p>Every day both sides fire their <b>attacks</b> (soft attack against men, hard attack against armor and beasts). A defender blocks attacks with <b>defense</b>, an attacker with <b>breakthrough</b>. Attacks that get through cost organization and men. When organization runs out, attackers stop and defenders <b>retreat</b> — or, with nowhere to go, are <b>destroyed</b>.</p>")}
  ${sec("Ground, walls and digging in", "<p>Hills, forests, marsh and mountains cut the attacker's strength. <b>Walls</b> cut it further, and walled provinces must be <b>besieged</b>. Divisions that sit still <b>dig in</b> (+2.5% defense a day up to a cap) and build up <b>planning</b> (up to +25% attack for the first strike).</p>")}
  ${sec("Supply", "<p>Supply flows from your capital and <b>depots</b>, weakening with every province. Too many divisions in one place, enemy land, desert and winter mean <b>hunger</b>: slower recovery, weaker attacks and men lost every day. Switch the map to <b>Supply</b> to see it.</p>")}
  ${sec("Templates, equipment and men", "<p>A <b>template</b> is the recipe for a division: battalions (they fill combat width) and support companies (free). Divisions need <b>men</b> from the manpower pool and <b>equipment</b> from the forges. Short of either, they fight at reduced strength. New designs cost <b>army experience</b>, earned in battle and drills.</p>")}
  ${sec("Industry", "<p><b>Forges</b> make equipment on production lines that get more efficient the longer they run (switching a line resets it). Idle forges sell arms abroad for coin. <b>Workshops</b> earn coin and build new forges, workshops, walls, depots and roads. The <b>economy law</b> trades the people's contentment for output.</p>")}
  ${sec("Who commands what", "<p><b>Soldiers</b> follow their division. <b>Captains</b> choose how hard their men push. <b>Commanders</b> move a division. <b>Generals</b> run an army: give it a front, a battle plan, or move divisions by hand. <b>High Generals</b> run three armies. The <b>Marshal</b> runs all armies and designs templates. The <b>ruler</b> also runs industry, manpower and peace.</p>")}`;
};

UI.wrRoleCard = function (pc, R2) {
  const myR = UI.wrMyR(pc),
    nd = R2.divs.size,
    na = R2.armies.size,
    ctl =
      R2.key === "ruler" || R2.key === "marshal"
        ? `${na} arm${na === 1 ? "y" : "ies"} · ${nd} division${nd === 1 ? "" : "s"}`
        : na
          ? `${na} arm${na === 1 ? "y" : "ies"} · ${nd} division${nd === 1 ? "" : "s"}`
          : nd
            ? "1 division"
            : "no units";
  return `<div class="card wr-role"><div class="row"><span class="wr-rank">${UI.wrIcon(R2.key === "ruler" ? "crown" : R2.key === "none" ? "eye" : "shield")}</span><div class="grow"><div class="tag">Your command</div><b>${UI.esc(R2.title || "Onlooker")}</b> <span class="muted small">of ${UI.esc(A.realmShort(myR))} · ${ctl}</span></div></div><div class="small">${UI.esc(R2.desc)}</div>${R2.next ? `<div class="tiny muted">${UI.esc(R2.next)}</div>` : ""}</div>`;
};

UI.wrCommandBasic = function () {
  const pc = A.pc(),
    S = A.S,
    R2 = A.cmdRole(pc),
    myR = UI.wrMyR(pc);
  let h = UI.wrRoleCard(pc, R2);
  const s = UI.wr.sel;
  if (
    (s && s.k === "divs"
      ? (h += UI.wrDivPanel(s.ids, R2))
      : s && s.k === "army"
        ? (h += UI.wrArmyPanel(A.army(s.id), R2))
        : s && s.k === "fight"
          ? (h += UI.wrFightPanel(s.pid, R2))
          : s && s.k === "prov" && (h += UI.wrProvPanel(s.pid, R2)),
    pc.mil && pc.mil.div && pc.mil.rank <= 6)
  ) {
    const d = A.divById(pc.mil.div);
    if (d) h += UI.wrMyDivCard(pc, d);
  }
  const tips = A.wrAdvice(pc, R2);
  if (tips.length)
    h += `<div class="card wr-advice"><div class="tag">${UI.wrIcon("sparkles")} What to do next</div>${tips.map(t => `<div class="tip ${t.lv || ""}">${UI.wrIcon(t.ic || "chevron-right")}<span>${t.t}</span>${t.a ? `<button class="small" data-a="${t.a}" data-v="${UI.esc(t.v || "")}">${UI.esc(t.b)}</button>` : ""}</div>`).join("")}</div>`;
  const mine = A.armiesOf(myR);
  if (mine.length && !(s && s.k === "army"))
    h += `<div class="group-h">Armies of ${UI.esc(A.realmShort(myR))}</div>${mine.map(a => UI.wrArmyRow(a, R2)).join("")}`;
  const open = Object.values(S.fights || {}).filter(F => A.friendly(F.a, myR) || A.friendly(F.b, myR));
  if (open.length)
    h += `<div class="group-h">Battles raging</div>${open
      .slice(0, 8)
      .map(F => UI.wrFightRow(F, myR))
      .join("")}`;
  return h;
};

UI.wrArmyRow = function (a, R2) {
  const g = a.gen ? A.P(a.gen) : null,
    can = R2.armies.has(a.id),
    ON = {
      free: "General decides",
      front: "Holding the front",
      attack: "Battle plan",
      hold: "Holding position",
    };
  return `<div class="card click wr-army ${UI.wr.sel && UI.wr.sel.k === "army" && UI.wr.sel.id === a.id ? "sel" : ""} ${can ? "mine" : ""}" data-a="wrSelArmy" data-v="${a.id}"><div class="row"><b>${UI.esc(a.name)}</b><span class="right chip">${UI.esc(ON[a.order.k] || "")}</span></div><div class="tiny muted">${g ? UI.esc(A.fullName(g, false)) + (g.id === A.S.pc ? " (you)" : "") : "No general"} · ${a.divs.length} div · ${A.fmt(a.men || A.armyMen(a))} men · org ${a.org}%${a.hungry ? ' · <span class="bad">hungry</span>' : ""}${a.combat ? ' · <span class="war-t">fighting</span>' : ""}</div></div>`;
};

UI.wrFightRow = function (F, myR) {
  const mySide = A.friendly(F.a, myR) ? "a" : "b",
    st = A.fightState(F),
    good = mySide === "a" ? st.share : 1 - st.share;
  return `<div class="card click small wr-fight" data-a="wrSelFight" data-v="${F.loc}"><div class="row">${UI.wrIcon("swords")}<b>${UI.esc(A.provName(F.loc))}</b><span class="right tiny muted">day ${F.days}</span></div><div class="wr-tug"><i style="width:${Math.round(good * 100)}%"></i></div><div class="tiny muted">${mySide === "a" ? "You attack" : "You defend"} · ${UI.esc(A.realmShort(F.a))} ${A.fmt(st.menA)} vs ${UI.esc(A.realmShort(F.b))} ${A.fmt(st.menD)} · ${good > 0.58 ? '<span class="good">going well</span>' : good < 0.42 ? '<span class="bad">going badly</span>' : "in the balance"}</div></div>`;
};

A.fightState = function (F) {
  const att = A.allDivs().filter(d => d.atk === F.loc),
    def = A.divsAt(F.loc).filter(d => (att.length ? A.hostile(att[0].r, d.r) : d.r === F.b)),
    orgA = att.reduce((x, d) => x + d.org, 0),
    orgD = def.reduce((x, d) => x + d.org, 0);
  return {
    att,
    def,
    menA: att.reduce((x, d) => x + d.men, 0),
    menD: def.reduce((x, d) => x + d.men, 0),
    share: orgA + orgD > 0 ? orgA / (orgA + orgD) : 0.5,
  };
};

UI.wrBarsBasic = function (d) {
  const mo = A.divMaxOrg(d),
    st = Math.min(1, A.divStr(d));
  return `<div class="wr-bars" title="Organization ${Math.round(d.org)}/${Math.round(mo)} · Strength ${UI.wrPct(st)}"><i class="o" style="width:${Math.round((100 * d.org) / Math.max(1, mo))}%"></i><i class="s" style="width:${Math.round(100 * st)}%"></i></div>`;
};

UI.wrDivStatus = function (d) {
  const S = A.S,
    out = [];
  if (d.train > 30) out.push(`<span class="chip">${UI.wrIcon("tent")}training ${Math.ceil(d.train / 30)} mo</span>`);
  if (d.atk != null)
    out.push(`<span class="chip red">${UI.wrIcon("swords")}attacking ${UI.esc(A.provName(d.atk))}</span>`);
  if ((S.fights || {})[d.loc]) out.push(`<span class="chip red">${UI.wrIcon("shield")}defending</span>`);
  if (d.sieging) out.push(`<span class="chip gold">${UI.wrIcon("castle")}besieging</span>`);
  if (d.path && d.path.length && d.atk == null)
    out.push(`<span class="chip">${UI.wrIcon("route")}→ ${UI.esc(A.provName(d.path[d.path.length - 1]))}</span>`);
  if (d.sr != null && d.sr < 0.7)
    out.push(`<span class="chip red">${UI.wrIcon("truck")}supply ${UI.wrPct(d.sr)}</span>`);
  if (d.manual) out.push('<span class="chip">by hand</span>');
  if (!out.length)
    out.push(
      `<span class="chip">${UI.wrIcon("map-pin")}${UI.esc(A.provName(d.loc))}${d.dig >= 1 ? ` · dug in ${Math.floor(d.dig)}` : ""}</span>`,
    );
  return out.join("");
};

UI.wrStatGrid = function (d) {
  const c = A.divCombat(d),
    s = c.s,
    L = A.xpLevel(d.exp),
    cell = (k, v, tip) => `<div title="${UI.esc(tip)}"><span>${k}</span><b>${v}</b></div>`;
  return `<div class="wr-stats">${cell("Soft atk", c.soft.toFixed(0), "Attacks per day against men")}${cell("Hard atk", c.hard.toFixed(1), "Attacks per day against armor and beasts")}${cell("Defense", c.def.toFixed(0), "Attacks it can block when defending")}${cell("Breakthr.", c.brk.toFixed(0), "Attacks it can block when attacking")}${cell("Org", `${Math.round(d.org)}/${Math.round(A.divMaxOrg(d))}`, "Organization: how long it keeps fighting")}${cell("HP", c.hp.toFixed(0), "How much damage it can take")}${cell("Width", s.w, "Combat width used")}${cell("Supply", A.divSupUse(d).toFixed(2), "Supply used per day")}${cell("Speed", A.divSpeed(d).toFixed(0) + " km", "Kilometres a day on open ground")}${cell("Armor", s.arm.toFixed(1), "Enemies with less piercing do half their attacks")}${cell("Piercing", s.prc.toFixed(1), "Beat the enemy's armor or lose half your attacks")}${cell("Exp.", L[1], `Experience ${Math.round(d.exp)}: ×${L[2]} to attack and defense`)}</div>`;
};

UI.wrDivPanelBasic = function (ids, R2) {
  const ds = ids.map(A.divById).filter(Boolean);
  if (!ds.length) return "";
  const can = ds.filter(d => R2.divs.has(d.id)),
    pc = A.pc();
  if (ds.length === 1) {
    const d = ds[0],
      r = A.realm(d.r),
      t = A.tplOf(d),
      s = A.divS(d),
      a = d.army ? A.army(d.army) : null,
      g = A.divGen(d),
      intel = !A.hostile(UI.wrMyR(pc), d.r) || UI.wrIntel(d);
    let h2 = `<div class="card wr-div"><div class="row">${UI.unitSym(s.main === "missile" ? "missile" : s.main, 1, r ? MAP.realmColor(r) : "#999", 30)}<div class="grow"><b>${UI.esc(d.name)}</b><div class="tiny muted">${UI.esc(t ? t.name : "")}${a ? " · " + UI.esc(a.name) : ""}${g ? " · " + UI.esc(A.fullName(g, false)) : ""}</div></div>${d.id === (pc.mil && pc.mil.div) ? '<span class="chip gold">yours</span>' : ""}</div>
      <div class="row wrap">${UI.wrDivStatus(d)}</div>`;
    if (intel) {
      h2 +=
        UI.barRow(
          "Organization",
          d.org,
          A.divMaxOrg(d),
          d.org < A.divMaxOrg(d) * 0.35 ? "hpbar" : "",
          null,
          `${Math.round(d.org)}/${Math.round(A.divMaxOrg(d))}`,
        ) +
        UI.barRow("Men", d.men, s.men, "", null, `${UI.kfmt(d.men)}/${UI.kfmt(s.men)}`) +
        UI.barRow("Equipment", A.divEqf(d) * 100, 100, A.divEqf(d) < 0.7 ? "hpbar" : "", null, UI.wrPct(A.divEqf(d))) +
        UI.barRow("Experience", d.exp, 100, "", null, A.xpLevel(d.exp)[1]);
      if (d.plan > 0.01 || d.dig > 0.5)
        h2 += `<div class="tiny">${d.plan > 0.01 ? `Planning +${UI.wrPct(d.plan)} attack` : ""}${d.plan > 0.01 && d.dig > 0.5 ? " · " : ""}${d.dig > 0.5 ? `Dug in +${Math.round(d.dig * 2.5)}% defense` : ""}${d.sr != null ? ` · supply ${UI.wrPct(d.sr)}` : ""}</div>`;
      h2 += UI.wrStatGrid(d);
      if (t) h2 += `<div class="tiny muted wr-comp">${UI.wrTplLine(t)}</div>`;
      h2 += `<div class="tiny muted">Record: ${d.wins || 0} won · ${d.losses || 0} lost · ${A.fmt(d.kills || 0)} enemy dead</div>`;
    } else
      h2 += `<div class="small muted">${UI.wrIcon("eye")} No reports on this division. Outriders (scouts) in a division next to it would tell you its strength.</div><div class="tiny">${A.fmt(Math.round(d.men / 1e3) * 1e3 || d.men)}± men, by the campfires.</div>`;
    if (can.length) h2 += UI.wrDivButtons(can, R2);
    return h2 + "</div>";
  }
  let h = `<div class="card wr-div"><div class="row"><b>${ds.length} divisions</b><span class="right tiny muted">${A.fmt(ds.reduce((x, d) => x + d.men, 0))} men</span></div>`;
  h += ds
    .slice(0, 12)
    .map(d => {
      const r = A.realm(d.r),
        s = A.divS(d);
      return `<div class="wr-drow click" data-a="wrSelDiv" data-v="${d.id}">${UI.unitSym(s.main === "missile" ? "missile" : s.main, 1, r ? MAP.realmColor(r) : "#999", 22)}<div class="grow"><div class="small">${UI.esc(d.name)}</div>${UI.wrBars(d)}</div><span class="tiny muted">${UI.esc(A.provName(d.loc))}</span></div>`;
    })
    .join("");
  if (can.length) h += UI.wrDivButtons(can, R2);
  return h + "</div>";
};

UI.wrIntel = function (d) {
  const myR = UI.wrMyR(),
    P = A.S.prov[d.loc];
  return (
    A.allDivs().some(x => x.r === myR && (x.loc === d.loc || P.adj.includes(x.loc)) && (A.divS(x).fx.intel || 0) > 0) ||
    A.divsAt(d.loc).length === 0
  );
};

UI.wrDivButtons = function (can, R2) {
  const ids = can.map(d => d.id).join(","),
    anyManual = can.some(d => d.manual),
    pc = A.pc();
  let h = `<div class="wr-actions"><div class="tiny muted">Orders for ${can.length > 1 ? `these ${can.length}` : "this division"}: click the map to march or attack.</div><div class="row wrap">
    <button class="small" data-a="wrDivHold" data-v="${ids}" title="Stop and dig in where they stand">${UI.wrIcon("shield")}Hold here</button>
    ${anyManual ? `<button class="small" data-a="wrDivRejoin" data-v="${ids}" title="Hand them back to the army's plan">${UI.wrIcon("rotate-ccw")}Back to the plan</button>` : ""}
    ${can.length === 1 && can[0].atk != null ? `<button class="small" data-a="wrDivHold" data-v="${ids}">${UI.wrIcon("x")}Call off the attack</button>` : ""}`;
  const arms = A.armiesOf(can[0].r).filter(a => R2.armies.has(a.id));
  if (
    (arms.length > 1 &&
      (h += `<select data-c="wrDivArmy" data-v="${ids}" aria-label="Move to army"><option value="">Move to army…</option>${arms.map(a => `<option value="${a.id}">${UI.esc(a.name)} (${a.divs.length})</option>`).join("")}</select>`),
    R2.templates && can.length === 1)
  ) {
    const r = A.realm(can[0].r);
    h += `<select data-c="wrDivTpl" data-v="${can[0].id}" aria-label="Reorganize"><option value="">Reorganize as…</option>${Object.values(
      r.forces.tpl,
    )
      .filter(t => t.id !== can[0].tpl)
      .map(t => `<option value="${t.id}">${UI.esc(t.name)}</option>`)
      .join("")}</select>`;
  }
  const f = (A.S.fights || {})[can[0].loc] || (can[0].atk != null && (A.S.fights || {})[can[0].atk]);
  if (
    f &&
    (R2.key === "ruler" ||
      R2.key === "marshal" ||
      R2.key === "general" ||
      R2.key === "highgeneral" ||
      R2.key === "commander")
  )
    h += `<button class="small primary" data-a="wrLead" data-v="F${f.loc}">${UI.wrIcon("swords")}Lead this battle in person</button>`;
  return h + "</div></div>";
};

UI.wrTplLine = function (t) {
  const c = {};
  for (const b of t.bns) c[b] = (c[b] || 0) + 1;
  return (
    Object.entries(c)
      .map(([k, n]) => `${n}× ${GD.TROOPS[k] ? GD.TROOPS[k].name : k}`)
      .join(", ") + (t.sup.length ? " + " + t.sup.map(s => (GD.SUP[s] ? GD.SUP[s].name : s)).join(", ") : "")
  );
};

UI.wrMyDivCard = function (pc, d) {
  const s = A.divS(d),
    r = A.realm(d.r),
    m = pc.mil;
  let h = `<div class="card wr-mine"><div class="row">${UI.unitSym(s.main === "missile" ? "missile" : s.main, 1, r ? MAP.realmColor(r) : "#999", 26)}<div class="grow"><div class="tag">${m.rank === 6 ? "You command" : "You serve in"}</div><b class="click u" data-a="wrSelDiv" data-v="${d.id}">${UI.esc(d.name)}</b></div><button class="small" data-a="wrFind" aria-label="Show on map">${UI.wrIcon("crosshair")}</button></div><div class="row wrap">${UI.wrDivStatus(d)}</div>${UI.wrBars(d)}`;
  const inFight = d.atk != null || (A.S.fights || {})[d.loc];
  if (m.rank <= 3 && inFight) {
    const F = (A.S.fights || {})[d.atk != null ? d.atk : d.loc],
      done = F && m.volTag === F.loc + ":" + F.start;
    h += `<div class="small" style="margin-top:6px"><b>${m.rank >= 2 ? "Your men are in the fight" : "You are in the fight"}</b></div><button class="small ${done ? "" : "primary"}" data-a="wrVolunteer" ${done ? "disabled" : ""}>${UI.wrIcon("swords")}${m.rank >= 2 ? "Rally your section" : "Step into the front rank"}${done ? " (done)" : ""}</button><div class="tiny muted">Once per battle: steadies the division a little and earns merit — and you might get hurt.</div>`;
  }
  if (m.rank >= 4 && m.rank <= 5) {
    const st = m.stance || "steady",
      T = {
        press: ["Press hard", "+6% to your division's attacks, +15% losses in your battalion, +30% merit."],
        steady: ["Steady", "Do your duty. No more, no less."],
        spare: ["Spare the men", "−6% attacks, −15% losses, −20% merit. Your men will love you for it."],
      };
    h += `<div class="small" style="margin-top:6px"><b>Your ${m.rank >= 5 ? "battalion" : "company"} in battle</b></div><div class="seg wide">${Object.entries(
      T,
    )
      .map(
        ([k, [n, ds]]) =>
          `<button class="small ${st === k ? "on" : ""}" data-a="wrStance" data-v="${k}" title="${UI.esc(ds)}">${n}</button>`,
      )
      .join("")}</div><div class="tiny muted">${UI.esc(T[st][1])}</div>`;
  }
  return h + "</div>";
};

UI.wrArmyPanel = function (a, R2) {
  if (!a) return "";
  const can = R2.armies.has(a.id),
    g = a.gen ? A.P(a.gen) : null,
    ds = A.armyDivs(a),
    plan = ds.length ? ds.reduce((x, d) => x + (d.plan || 0), 0) / ds.length : 0,
    sr = ds.length ? ds.reduce((x, d) => x + (d.sr != null ? d.sr : 1), 0) / ds.length : 1,
    O = [
      ["free", "General decides", "The general picks fronts and attacks on his own judgment.", "sparkles"],
      ["front", "Hold the front", "Spread along the border and dig in. Strikes only to free your own land.", "shield"],
      [
        "attack",
        "Battle plan",
        "Hold the front, build up planning, then attack where the odds are best — toward the objective if you set one.",
        "swords",
      ],
      ["hold", "Hold position", "Every division stays where it is.", "lock"],
    ];
  let h = `<div class="card wr-armyp"><div class="row"><b>${UI.esc(a.name)}</b><span class="right tiny muted">${UI.esc(A.realmShort(a.realm))}</span></div>
    <div class="small">${g ? `${UI.esc(A.fullName(g))}${g.id === A.S.pc ? " (you)" : ""} · command ${A.skill(g, "command")} · tactics ${A.skill(g, "tactics")} · logistics ${A.skill(g, "logistics")}` : "No general"}</div>
    <div class="tiny muted">${ds.length}/24 divisions · ${A.fmt(A.armyMen(a))} men · experience ${a.exp}</div>
    ${UI.barRow("Organization", a.org, 100, a.org < 40 ? "hpbar" : "")}${UI.barRow("Planning", plan * 100, 30, "", null, "+" + UI.wrPct(plan))}${UI.barRow("Supply", sr * 100, 100, sr < 0.7 ? "hpbar" : "", null, UI.wrPct(sr))}`;
  if (can) {
    h += `<div class="group-h">Orders</div><div class="wr-orders">${O.map(([k, n, ds2, ic]) => `<button class="wr-order ${a.order.k === k ? "on" : ""}" data-a="wrOrder" data-v="${a.id}|${k}" aria-pressed="${a.order.k === k}">${UI.wrIcon(ic)}<span><b>${n}</b><small>${ds2}</small></span></button>`).join("")}</div>`;
    const en = A.enemiesOf(a.realm);
    if (en.length > 1)
      h += `<div class="row small" style="margin-top:6px">Face: <select data-c="wrEnemy" data-v="${a.id}" aria-label="Enemy to face"><option value="">Nearest enemy</option>${en.map(e => `<option value="${e}" ${a.order.enemy === e ? "selected" : ""}>${UI.esc(A.realmShort(e))}</option>`).join("")}</select></div>`;
    h += `<div class="small" style="margin-top:6px">${UI.wrIcon("target")} Objective: <b>${a.order.obj != null ? UI.esc(A.provName(a.order.obj)) : "none"}</b> ${a.order.obj != null ? `<button class="small ghost" data-a="wrObjClear" data-v="${a.id}">clear</button>` : '<span class="tiny muted">— click the map to set one</span>'}</div>`;
    h += `<div class="row wrap" style="margin-top:6px"><button class="small" data-a="wrSelArmyDivs" data-v="${a.id}">${UI.wrIcon("layers")}Select its divisions</button><button class="small" data-a="wrSplit" data-v="${a.id}" ${ds.length < 2 ? "disabled" : ""}>Split</button><button class="small" data-a="wrMerge" data-v="${a.id}">Merge others in</button></div>`;
    if (a.stance)
      h += `<div class="tiny muted" style="margin-top:4px">The general reads the front as ${a.stance === "attack" ? "favorable" : "risky"} (our strength ×${(a.ratio || 0).toFixed(2)} against what faces us).</div>`;
  } else h += '<div class="tiny muted">This army does not answer to you.</div>';
  return h + "</div>";
};
