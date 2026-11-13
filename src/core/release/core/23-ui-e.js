// The release's core, ui (part 5 of 6): UI: the interface.
// Readable source of vendor/ardan-b593143.html with the patch layer baked in (X1, docs/DECISIONS.md D-027). Edit it here.
// Defines: UI.A (+), UI.tacName, UI.wrTacOrders, UI.C (+), UI.wrFightPanel, UI.wrCommand, UI.drawWar, UI.planCard,
// UI.wnItems, UI.whatNowCard, UI.TAB.life, UI.ladderHtml, UI.boardHtml, UI.TAB.path, UI.pathBlurb, UI.jobPathCard,
// UI.armyPathCard, UI.councilCard, UI.pathsList, UI.TAB.work, UI.diplCard, UI.relStatus, UI.gathList, UI.TAB.world,
// UI.helpModalBasic, UI.warTabClock, UI.ICONS (+), UI.tierIdx, UI.tierChip, UI.vsYou, UI.takeLine, UI.cmdWord,
// UI.qualChip, UI.gearLine, UI.titleLine, UI.TAB.goals, UI.TAB.legacy, UI.rosterCard, UI.TAB.people, UI.personModal,
// UI.staffSel, UI.staffCard, UI.drillCard, UI.ordersCard, UI.orderLore, UI.TAB.war, UI.shopSlot, UI.shopQ, UI.run.

Object.assign(UI.A, {
  warRoomView() {
    UI.warRoomOpen();
  },
  wrLeave() {
    UI.ov = null;
    UI.wr.view = null;
    UI.wr.tplEdit = null;
    UI.wr.help = false;
    UI.refresh();
  },
  wrRun() {
    UI.clkToggle();
    UI.wrRefresh();
  },
  wrClkSpeed(v) {
    UI.clk.speed = +v;
    document
      .querySelectorAll(".warroom .wr-time .seg button")
      .forEach(b => b.classList.toggle("on", +b.dataset.v === UI.clk.speed));
    UI.clkPaint();
  },
  wrStep() {
    UI.clkStop();
    A.advance(7);
    UI.quietSettle();
    if (A.S.queue.length) UI.refresh();
    else UI.wrRefresh();
  },
  wrEnd() {
    UI.A.wrLeave();
  },
  wrLead(v) {
    UI.clkStop();
    if (A.wsLeadBattle(v)) UI.refresh();
    else {
      UI.wr.msg = "You cannot reach that battle.";
      UI.wrRefresh();
    }
  },
  wrTac(v) {
    const [side, k] = v.split("|");
    A.setTac(side, k);
    UI.wrRefresh();
  },
  wrRaid(v) {
    for (const id of v.split(",")) A.wsDivRaid(id);
    UI.wr.msg = "Raiders cut roads and burn depots around them; enemy supply through there drops.";
    UI.wrRefresh();
  },
});

UI.tacName = k => (A.WTAC[k] ? A.WTAC[k].n : k);

UI.wrTacOrders = function (pc) {
  if (!pc.ruler && (!pc.mil || pc.mil.rank < 4)) return "";
  const T = pc.tac || {
      atk: "auto",
      def: "auto",
    },
    opt = (side, keys) =>
      `<select data-c="wrTacSel" data-k="${side}" aria-label="${side === "atk" ? "When attacking" : "When defending"}"><option value="auto" ${T[side] === "auto" ? "selected" : ""}>Commander's judgment</option>${keys.map(k => `<option value="${k}" ${T[side] === k ? "selected" : ""}>${UI.esc(A.WTAC[k].n)}</option>`).join("")}</select>`;
  return `<div class="card small wr-tacs"><div class="row">${UI.wrIcon("swords")}<b>Your battle orders</b></div><div class="kv tiny"><div>When attacking</div><div>${opt("atk", A.WTAC_KEYS.a)}</div><div>When defending</div><div>${opt("def", A.WTAC_KEYS.d)}</div></div><div class="tiny muted">Every day of a battle each commander picks a tactic. Some beat others: a spear wall wrecks a charge, a held reserve wastes a flanking march, a counterattack walks into a feigned retreat. Better scouts (horsemen, a sharp general, home ground) read the enemy's plan. Your order is followed when the troops and ground allow it.</div></div>`;
};

Object.assign(UI.C, {
  wrTacSel(el) {
    A.setTac(el.dataset.k, el.value);
    UI.wr.msg = el.value === "auto" ? "Your commanders will choose." : `Standing order: ${A.WTAC[el.value].n}.`;
    UI.wrRefresh();
  },
});

UI.wrFightPanel = function (pid, R2) {
  let h = UI.wrFightPanelBasic(pid, R2);
  const F = (A.S.fights || {})[pid];
  if (!F || !F.log || !F.log.length) return h;
  const extra = `<div class="group-h">Tactics, day by day</div>${F.log
      .slice(-6)
      .reverse()
      .map(
        ([d, ta, td, note]) =>
          `<div class="tiny row"><span class="muted" style="min-width:42px">day ${d}</span><span class="grow"><b>${UI.esc(UI.tacName(ta))}</b> vs <b>${UI.esc(UI.tacName(td))}</b>${note ? ` — <span class="${note === "countered" || note === "trap" ? "warn-t" : "muted"}">${UI.esc(A.TAC_NOTE[note] || note)}</span>` : ""}</span></div>`,
      )
      .join(
        "",
      )}<div class="tiny muted">Scouting: attackers ${F.recA || 0}, defenders ${F.recD || 0}${F.rout ? ` · <b class="bad-t">${F.rout === "def" ? "the defenders are breaking" : "the attackers are breaking"}</b>` : ""}</div>`,
    i = h.lastIndexOf('<div class="tiny muted">Losses so far');
  return i >= 0 ? h.slice(0, i) + extra + h.slice(i) : h + extra;
};

UI.wrCommand = function () {
  const pc = A.pc();
  return UI.wrTacOrders(pc) + UI.wrCommandBasic();
};

UI.drawWar = function (cv) {
  UI.drawWarBasic(cv);
  const pc = A.pc(),
    S = A.S,
    myR = UI.wrMyR(pc),
    R2 = A.cmdRole(pc),
    sel = UI.wr.sel;
  if (!(UI.wr.mode === "supply" || (sel && sel.k === "divs"))) return;
  const ctx = cv.getContext("2d"),
    W = cv.width,
    H = cv.height,
    v = UI.wr.view;
  if (!v) return;
  const P = (kx, ky) => [((kx - v.x0) / v.w) * W, ((ky - v.y0) / v.h) * H];
  A.supplyMap(myR);
  const c = A._sup[myR];
  if (!c) return;
  const locs = new Set();
  if (sel && sel.k === "divs")
    for (const id of sel.ids) {
      const d = A.divById(id);
      if (d) locs.add(d.loc);
    }
  else
    for (const id of R2.divs) {
      const d = A.divById(id);
      if (d) locs.add(d.loc);
    }
  if (UI.wr.mode === "supply")
    for (let i = 0; i < S.prov.length; i++) {
      if (!c.zoc[i] && !c.raid[i]) continue;
      const p = S.prov[i],
        [x, y] = P(p.sx, p.sy);
      if (!(x < -40 || y < -40 || x > W + 40 || y > H + 40)) {
        ctx.strokeStyle = c.raid[i] ? "rgba(255,120,60,.85)" : "rgba(224,100,79,.55)";
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  ctx.save();
  ctx.lineCap = "round";
  for (const loc of [...locs].slice(0, 30)) {
    const route = A.supplyRoute(myR, loc);
    if (route.length < 2) continue;
    const pts = route.map(j => P(S.prov[j].sx, S.prov[j].sy)),
      ok = c.v[loc] >= 1.2;
    ctx.strokeStyle = ok ? "rgba(159,209,138,.75)" : "rgba(234,170,90,.8)";
    ctx.lineWidth = 2.4;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (const [x, y] of pts.slice(1)) ctx.lineTo(x, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#9fd18a";
    ctx.beginPath();
    ctx.arc(pts[0][0], pts[0][1], 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
};

UI.planCard = function (pc) {
  if (!pc.alive || A.age(pc) < 4) return "";
  const P = A.plan(pc),
    tt = A.trainTargets(pc),
    cur = P.train,
    val = k => (GD.TRAIN_STATS[k] ? Math.round(A.stat(pc, k)) : A.skill(pc, k)),
    grp = {};
  for (const x of tt) {
    const g = x.kind === "stat" ? "Body and mind" : x.cat;
    (grp[g] = grp[g] || []).push(x);
  }
  const sel = `<select data-c="planTrain" aria-label="Training focus"><option value="">Nothing in particular</option>${Object.entries(
      grp,
    )
      .map(
        ([g, L]) =>
          `<optgroup label="${UI.esc(g)}">${L.map(x => `<option value="${x.k}" ${cur === x.k ? "selected" : ""}>${UI.esc(x.name)} — ${val(x.k)}${pc.apt && pc.apt[x.k] >= 1.2 ? " ★" : ""}</option>`).join("")}</optgroup>`,
      )
      .join("")}</select>`,
    ints = Object.entries(GD.INTENSITY)
      .map(
        ([k, I]) =>
          `<button class="small ${P.intensity === k ? "on" : ""}" data-a="planInt" data-v="${k}" title="${UI.esc(I.desc)}" aria-pressed="${P.intensity === k}">${I.name}</button>`,
      )
      .join(""),
    aims = Object.entries(GD.AIMS)
      .map(([k, D2]) => {
        const why = D2.avail(pc);
        return `<option value="${k}" ${P.aim === k ? "selected" : ""} ${why && P.aim !== k ? "disabled" : ""}>${UI.esc(D2.name)}${why ? " — " + UI.esc(why) : ""}</option>`;
      })
      .join(""),
    D = P.aim ? GD.AIMS[P.aim] : null,
    prog = (D && P.prog[P.aim]) || 0,
    need = D ? P.need[P.aim] || D.need : 1,
    rate = D ? D.rate(pc) * (GD.INTENSITY[P.intensity] || GD.INTENSITY.steady).aim : 0,
    eta = D && rate > 0 ? Math.ceil((need - prog) / rate) : null,
    q = P.q != null ? P.q : 1,
    qWord = q >= 1.25 ? "excellent" : q >= 1.05 ? "good" : q >= 0.85 ? "fair" : q >= 0.6 ? "poor" : "wretched",
    parts = (P.qParts || [])
      .slice(0, 4)
      .map(([n, m]) => `${n} ×${(+m).toFixed(2)}`)
      .join(" · ");
  return `<div class="card plan-card"><div class="row"><span class="tag">Your days</span><b class="grow">${D ? UI.esc(D.name) : "Living as it comes"}</b><span class="tiny muted">training is ${qWord}</span></div>
    <div class="plan-grid">
      <label class="plan-l">Training</label><div>${sel}</div>
      <label class="plan-l">How hard</label><div class="seg wide">${ints}</div>
      <label class="plan-l">Free hours</label><div><select data-c="planAim" aria-label="Pursuit"><option value="">Nothing in particular</option>${aims}</select></div>
    </div>
    ${D ? `<div class="small ink2" style="margin-top:4px">${UI.esc(D.desc)}</div>${UI.barRow("Breakthrough", prog, need, "", null, `${Math.round(prog)}/${Math.round(need)}`)}${eta != null ? `<div class="tiny muted">About ${eta < 60 ? eta + " days" : Math.round(eta / 30) + " months"} at this pace.</div>` : ""}` : '<div class="tiny muted">Choose what your free hours go to. When enough has built up, something opens up — what depends on who you are.</div>'}
    <div class="row" style="margin-top:6px"><button class="small" data-a="planSession" ${P.train && A.S.time >= 1 ? "" : "disabled"} title="Spend initiative on an intense session of your training focus">${UI.icon("flame", "s") || ""}Extra session (1⧗)</button><span class="tiny muted grow">${UI.esc((GD.INTENSITY[P.intensity] || {}).desc || "")}${parts ? " Last month: " + UI.esc(parts) + "." : ""}</span></div></div>`;
};

Object.assign(UI.C, {
  planTrain(el) {
    A.setPlan("train", el.value || null);
    UI.refreshTab();
  },
  planAim(el) {
    const r = A.setPlan("aim", el.value || null);
    if (r && r.msg) UI.toast(r.msg);
    UI.refreshTab();
  },
});

Object.assign(UI.A, {
  planSession() {
    const r = A.planSession();
    if (r && r.msg) UI.toast(r.msg.length > 160 ? r.msg.slice(0, 157) + "…" : r.msg);
    UI.refresh();
  },
  planInt(v) {
    const r = A.setPlan("intensity", v);
    if (r && r.msg) UI.toast(r.msg);
    UI.refreshTab();
  },
});

UI.wnItems = [];

UI.whatNowCard = function (pc) {
  const L = (UI.wnItems = A.whatNow ? A.whatNow(pc) : []);
  return L.length
    ? `<section class="card whatnow" aria-labelledby="wn-h"><h3 id="wn-h" class="wn-h">${UI.icon("target", "s")} What now</h3><ol class="wn-list">${L.map((x, i) => `<li><button class="wn-item ${x.cls}" data-a="wn" data-v="${i}"><span class="wn-n" aria-hidden="true">${i + 1}</span><span class="wn-t"><b>${UI.esc(x.t)}</b><span class="wn-why">${UI.esc(x.why)}</span></span>${UI.icon("chevron-right", "s")}</button></li>`).join("")}</ol></section>`
    : "";
};

Object.assign(UI.A, {
  wn(v) {
    const x = UI.wnItems[+v];
    if (!x) return;
    const [a, val] = x.act || ["tab", x.go];
    if (a === "tab") {
      UI.A.tab(val);
      return;
    }
    if (UI.A[a]) UI.A[a](val);
  },
});

UI.TAB.life = function (pc) {
  if (!pc.alive) return '<p class="muted">Your story has ended.</p>';
  const cats = {};
  for (const k in GD.ACTIVITIES) {
    const D = GD.ACTIVITIES[k];
    (cats[D.cat] = cats[D.cat] || []).push(k);
  }
  const order = [
      "Body & mind",
      "Social",
      "Faith",
      "Health",
      "Wilds",
      "Glory",
      "Money",
      "World",
      "War",
      "Intrigue",
      "Crime",
    ],
    role = A.role(pc);
  let h = UI.whatNowCard(pc) + (UI.recapCard ? UI.recapCard(pc) : "") + UI.planCard(pc);
  h += `<div class="row small muted" style="margin:6px 0 4px">${UI.icon("hourglass", "s")} Initiative <b class="ink2">${(A.S.time || 0).toFixed(1)}</b> · ${UI.esc(role.name)}${pc.prison ? ' · <span class="bad">In prison until ' + pc.prison.until + "</span>" : ""}</div>`;
  const hidden =
    /Too young|Too old|You are free|Already serving|You already rule|You need a company|You already lead|station|Not in your position|Not with a crown|Kings have|The crown|You command masters|Your duties keep|cannot spare|A sovereign|Others do the chores|Hauling stones/;
  for (const cat of order) {
    if (!cats[cat]) continue;
    const items = cats[cat]
      .map(k => {
        const D = GD.ACTIVITIES[k],
          [ok, why] = A.canAct(k);
        return (!ok && hidden.test(why || "")) ||
          ["practice", "train_yard", "run", "lift", "meditate", "study"].includes(k)
          ? ""
          : `<button class="act" data-a="act" data-v="${k}" ${ok ? "" : "disabled"} title="${UI.esc(ok ? D.desc : why)}"><span class="cost">${D.cost ? D.cost + "⧗" : "free"}</span><div class="an">${D.name}</div><div class="ad">${UI.esc(ok ? D.desc : why)}</div></button>`;
      })
      .filter(Boolean);
    if (items.length) h += `<div class="group-h">${cat}</div><div class="acts">${items.join("")}</div>`;
  }
  return h;
};

UI.ladderHtml = function (ranks, cur) {
  return `<div class="ladder">${ranks.map((r, i) => `<span class="${i < cur ? "done" : i === cur ? "now" : ""}" title="${A.coin(r[2])}/yr">${UI.esc(r[0])}</span>`).join("<i>›</i>")}</div>`;
};

UI.boardHtml = function (b, title) {
  return b
    ? `<div class="wr-board"><div class="small"><b>${UI.esc(title)}</b></div>${b.map(x => `<div class="tiny row">${x.ok ? `<span class="good-t">${UI.icon("check", "s")}</span>` : `<span class="${x.soft ? "warn-t" : "bad-t"}">${UI.icon(x.soft ? "triangle-alert" : "x", "s")}</span>`}<span class="grow">${UI.esc(x.label)}${x.soft ? ' <span class="muted">(helps)</span>' : ""}</span><b>${UI.esc(String(x.have))}${x.need !== "" ? " / " + UI.esc(String(x.need)) : ""}</b></div>`).join("")}</div>`
    : "";
};

UI.TAB.path = function (pc) {
  if (!pc.alive) return '<p class="muted">Your story has ended.</p>';
  const role = A.role(pc),
    cls = A.classOf(pc);
  let h = `<div class="card path-role"><div class="row"><span class="tag">Where you stand</span><b class="grow">${UI.esc(role.name)}</b><span class="chip">${UI.esc(A.CLASS_NAME[cls] || "")}</span></div><div class="small ink2">${UI.esc(UI.pathBlurb(pc, role))}</div></div>`;
  if (
    (pc.ruler &&
      (h += `<div class="card small"><b>You rule ${UI.esc(A.realmName(pc.ruler))}.</b> The council, the treasury, the host and the chancery are in the <span class="click u" data-a="tab" data-v="realm">Realm</span> tab; the armies in the <span class="click u" data-a="warRoomView">War Room</span>.</div>`),
    pc.office && (h += UI.councilCard(pc)),
    pc.mil && !pc.mil.merc && (h += UI.armyPathCard(pc)),
    pc.job)
  ) {
    if (((h += UI.jobPathCard(pc)), UI.specCard)) {
      const sc = UI.specCard(pc);
      if (sc) h += sc;
    }
    if (A.superior(pc) && !pc.mil && UI.superiorCard) h += UI.superiorCard(pc);
  }
  if (pc.company)
    h += `<div class="card small"><b>${UI.esc(pc.company.name)}</b> — your free company of ${A.fmt(pc.company.men)}. Contracts, men and the war chest are in the <span class="click u" data-a="tab" data-v="war">War</span> tab.</div>`;
  const doors = A.doorsFor(pc);
  if (
    (doors.length &&
      (h += `<div class="group-h">Doors open to you</div>${doors
        .map(d => {
          const C = GD.CAREERS[d.to];
          return `<div class="card small door"><div class="row"><b class="grow">${UI.esc(C.ranks[d.startR][0])}</b><span class="tag">${UI.esc(GD.PATHS[A.pathOfCareer(d.to)].name)}</span></div><div class="tiny ink2">${UI.esc(d.why)}</div><button class="small primary" data-a="takeDoor" data-v="${d.to}" ${A.S.yearActs["door_" + d.to] ? "disabled" : ""}>Go through</button></div>`;
        })
        .join("")}`),
    !pc.ruler && (A.isAdult(pc) || A.age(pc) >= (12 * GD.RACES[pc.race].adult) / 16) && (h += UI.pathsList(pc)),
    (h += '<div class="group-h">Schools & academies</div>'),
    pc.school)
  ) {
    const st = pc.school.style ? A.style(pc.school.style) : null;
    h += `<div class="card small"><b>${UI.esc(pc.school.name)}</b>${pc.school.master ? " under " + UI.esc(pc.school.master) : ""} — year ${pc.school.years}${st && pc.styles && pc.styles[st.id] ? ` · ${UI.esc(st.name)}: ${UI.esc(A.styleRankName(st, pc.styles[st.id].rank))}` : ""}${pc.school.fee ? ` · ${A.coin(pc.school.fee)}/yr` : ""}<div class="row" style="margin-top:4px"><button class="small" data-a="studyHard" ${A.S.time >= 1 && pc.flags.studyHard !== A.S.year ? "" : "disabled"}>Study hard (1⧗)</button><button class="small" data-a="openSchools">Schools</button><button class="small danger" data-a="leaveSchool">Leave</button></div></div>`;
  } else
    h += `<div class="row"><button class="small" data-a="openSchools" ${A.canAct("school")[0] || !GD.ACT_GATE.school ? "" : "disabled"}>Browse schools & academies</button></div>`;
  if (A.isAdult(pc)) {
    const cur = pc.lifestyle || A.lifestyleDefault(pc);
    h += `<div class="group-h">How you live</div><div class="opt-grid">${Object.entries(A.LIFESTYLE)
      .map(([k, L]) =>
        UI.opt(cur === k, "lifestyle", k, L.name + ` <span class="muted small">${A.coin(L.cost)}/yr</span>`, L.desc),
      )
      .join("")}</div>`;
  }
  return h;
};

UI.pathBlurb = function (pc, role) {
  // [X1 baked patch people/99999-v2-renown RN-WORDS] Merit was shown as a counter ("Merit 112 / 30") in the year's
  // summary and explained as a bar to meet; it no longer decides promotion. In the source: say where you stand for
  // the next rank in words, and say how the board decides.
  return pc.ruler
    ? "The top of every ladder. Your work is the realm itself."
    : pc.office
      ? "You sit on the council: you act within your seat and advise the crown on war, peace and alliances."
      : pc.mil && !pc.mil.merc
        ? "You serve in the army. Deeds in battle and on missions, seen by the army, move you up the ladder; the board meets every three months, and a post must fall open."
        : pc.job
          ? "Your post is a ladder. Work that stands out, skill, reputation, a patron and a post falling open move you up; duties throw up problems and chances. Ladders connect — look for the doors."
          : pc.flags.unfree
            ? "You are not free. Some doors stay shut until you are; set your free hours to winning your freedom."
            : A.isAdult(pc)
              ? "You hold no post. Pick a path below — the army, the court, the faith, the guilds, the sea — and start climbing."
              : "You are young. Your plan and your schooling decide which doors will be open when you come of age.";
};

UI.jobPathCard = function (pc) {
  const j = pc.job,
    C = GD.CAREERS[j.c],
    rk = C.ranks[j.r],
    nx = C.ranks[j.r + 1],
    rep = A.jobRep(pc),
    sup = A.superior && A.superior(pc),
    pat = A.patronOf && A.patronOf(pc);
  let h = `<div class="card jobcard"><div class="row"><h3 style="margin:0">${UI.esc(rk[0])}</h3><span class="right tag">${UI.esc(GD.PATHS[A.pathOfCareer(j.c)].name)} · ${UI.esc(C.name)}</span></div>
    <div class="small muted">${A.coin(rk[2])}/yr${j.own ? ` · your own ${A.ownWord(j.c)}` : ""}${sup ? ` · answers to <span class="click u" data-a="ov" data-v="person:${sup.id}">${UI.esc(sup.given)}</span>` : ""}${pat ? ` · patron: <span class="click u" data-a="ov" data-v="person:${pat.id}">${UI.esc(pat.given)}</span>` : ""}</div>
    ${UI.barRow("Performance", j.perf, 100)}${UI.barRow("Reputation", rep, 100, "", null, Math.round(rep))}<div class="tiny muted" style="text-align:right;margin-top:-2px">${UI.esc(A.cap(A.repWord(rep)))}</div>
    ${UI.ladderHtml(C.ranks, j.r)}
    ${nx ? UI.boardHtml(A.jobBoard(pc), `To become ${nx[0]} (${A.coin(nx[2])}/yr)`) : `<div class="small">You are at the top of this ladder.${GD.CAREER_SEAT[j.c] ? ` The next step is a seat on the council: <b>${UI.esc(A.COUNCIL[GD.CAREER_SEAT[j.c]].name)}</b>.` : ""}</div>`}
    <div class="tiny muted">When the hard requirements are met, each month brings a chance of promotion — better with good work, a patron, and a post falling vacant. "Push for advancement" in your plan speeds merit.</div>`;
  const offers = (j.offers || []).map(id => A.EV[id]).filter(Boolean);
  if (offers.length)
    h += `<div class="group-h">Offers on the table</div><div class="offers">${offers
      .map(e => {
        const t = typeof e.title == "function" ? e.title(pc, {}) : e.title;
        return `<div class="card offer"><div class="row"><b>${UI.esc(A.T(t || "An offer", {}))}</b><span class="right tag">${e.time != null ? e.time : 1}⧗</span></div><div class="row" style="margin-top:4px"><button class="small primary" data-a="takeOffer" data-v="${e.id}" ${A.S.time >= (e.time != null ? e.time : 1) ? "" : "disabled"}>Look into it</button><button class="small ghost" data-a="declineOffer" data-v="${e.id}">Turn it down</button></div></div>`;
      })
      .join("")}</div>`;
  const acts = A.workActions(pc);
  if (acts.length)
    h += `<div class="group-h">At work</div><div class="acts">${acts.map(({ k, W }) => `<button class="act" data-a="doWork" data-v="${k}" ${A.S.time >= W.cost && !(A.S.yearActs["work_" + k] && k !== "hard") && !(k === "hard" && pc.flags.workHard === A.S.year) ? "" : "disabled"}><span class="cost">${W.cost}⧗</span><div class="an">${UI.esc(W.name)}</div><div class="ad">${UI.esc(W.desc)}</div></button>`).join("")}</div>`;
  h +=
    '<div class="row" style="margin-top:6px"><span class="right"></span><button class="small danger" data-a="quitJob">Leave this post</button></div></div>';
  return h;
};

UI.armyPathCard = function (pc) {
  const m = pc.mil,
    G = GD.MIL[m.rank];
  // [X1 baked patch people/99999-v2-renown RN-WORDS] Merit was shown as a counter ("Merit 112 / 30") in the year's
  // summary and explained as a bar to meet; it no longer decides promotion. In the source: say where you stand for
  // the next rank in words, and say how the board decides.
  return `<div class="card"><div class="row"><h3 style="margin:0">${UI.esc(G.title)}</h3><span class="right tag">The Army · ${UI.esc(A.realmShort(m.realm))}</span></div>
    <div class="small muted">${UI.esc(m.unit || "")} · leads ${A.fmt(G.leads)} · ${m.years} years · ${m.battles} battles · ${m.kills} enemy dead${A.RN && A.RN.on ? "" : ` · merit ${Math.round(m.merit)}`}</div>
    ${UI.ladderHtml(
      GD.MIL.map(x => [x.title, 0, 0]),
      m.rank,
    )}
    ${UI.promoBoardHtml ? UI.promoBoardHtml(pc) : ""}
    <div class="row" style="margin-top:6px"><button class="small" data-a="warRoomView">${UI.icon("target", "s")}War Room</button><span class="right"></span><button class="small" data-a="resign">Leave the army</button><button class="small danger" data-a="desert">Desert</button></div></div>`;
};

UI.councilCard = function (pc) {
  const r = A.realm(pc.realm),
    seat = A.COUNCIL[pc.office];
  if (!r || !seat) return "";
  const acts = A.COUNCIL_ACTS[pc.office] || [],
    others = Object.values(A.S.realms)
      .filter(o => o.alive && o.id !== r.id && !o.isRebel)
      .sort(
        (a, b) => A.neighbors(r.id).includes(b.id) - A.neighbors(r.id).includes(a.id) || a.short.localeCompare(b.short),
      ),
    ru = A.P(r.ruler);
  let h = `<div class="card council"><div class="row"><h3 style="margin:0">${UI.esc(seat.name)} of ${UI.esc(r.short)}</h3><span class="right tag">Council</span></div><div class="small muted">${UI.esc(seat.desc)} · ${UI.esc(GD.SKILLS[seat.skill])} ${A.skill(pc, seat.skill)}${ru ? ` · the crown thinks ${A.opinion(ru, pc) >= 30 ? "well" : A.opinion(ru, pc) >= 0 ? "fairly" : "poorly"} of you` : ""}</div>`;
  h += `<div class="acts">${acts
    .map(a => {
      const cd = A.S.dcool && A.S.dcool["cn_" + a.k] != null && A.absDay() - A.S.dcool["cn_" + a.k] < 120;
      return `<button class="act" data-a="cnAct" data-v="${a.k}" ${A.S.time >= a.cost && !cd ? "" : "disabled"}><span class="cost">${a.cost}⧗</span><div class="an">${UI.esc(a.name)}</div><div class="ad">${UI.esc(cd ? "Done recently." : a.desc)}</div></button>`;
    })
    .join("")}</div>`;
  h += `<div class="group-h">Advise the crown</div><div class="row wrap small"><select id="cnRealm" aria-label="Realm">${others.map(o => `<option value="${o.id}">${UI.esc(o.short)}${A.hostile(r.id, o.id) ? " (at war)" : r.allies.includes(o.id) ? " (ally)" : ""}</option>`).join("")}</select>${[
    ["war", "Urge war"],
    ["peace", "Urge peace"],
    ["ally", "Urge an alliance"],
    ["nap", "Urge a pact"],
  ]
    .map(
      ([k, n]) =>
        `<button class="small" data-a="cnProp" data-v="${k}" ${A.S.time >= 2 ? "" : "disabled"}>${n} (2⧗)</button>`,
    )
    .join(
      "",
    )}</div><div class="tiny muted">The crown decides, swayed by what it thinks of you, your skill, and the realm's interests.</div></div>`;
  return h;
};

UI.pathsList = function (pc) {
  const jo = A.jobOptions(pc),
    by = {};
  for (const o of jo) {
    const p = A.pathOfCareer(o.k);
    (by[p] = by[p] || []).push(o);
  }
  const order = ["army", "court", "church", "guild", "learning", "sea", "glory", "under", "company", "common"];
  let h = '<div class="group-h">Paths</div>';
  for (const k of order) {
    const P = GD.PATHS[k],
      L = by[k] || [];
    let body = "";
    if (k === "army") {
      const [ok, why] = A.canAct("enlist");
      body =
        pc.mil && !pc.mil.merc
          ? '<div class="tiny muted">You serve.</div>'
          : `<div class="row"><button class="small ${ok ? "primary" : ""}" data-a="act" data-v="enlist" ${ok ? "" : "disabled"} title="${UI.esc(why || "")}">Enlist in ${UI.esc(A.realmShort(pc.realm))}'s army</button><span class="tiny muted">${UI.esc(ok ? (pc.house && A.family(pc) && A.family(pc).kind === "gentry_mil" ? "Your family is a soldier dynasty: you start higher." : "Start in the ranks; officers come from merit, letters and blood.") : why || "")}</span></div>`;
    } else if (k === "company") {
      const [ok1, w1] = A.canAct("merc"),
        [ok2, w2] = A.canAct("found_company");
      body = `<div class="row wrap"><button class="small" data-a="act" data-v="merc" ${ok1 ? "" : "disabled"} title="${UI.esc(w1 || "")}">Join a free company</button><button class="small" data-a="act" data-v="found_company" ${ok2 ? "" : "disabled"} title="${UI.esc(w2 || "")}">Found your own (300)</button></div>`;
    } else {
      if (!L.length) continue;
      body = L.map(o => {
        const why =
          GD.CAREERS[o.k].literate && !pc.literate
            ? "needs letters — study first"
            : pc.flags.unfree && o.chance <= 0
              ? "not while you are unfree"
              : o.chance < 0.05
                ? "they would not take you yet"
                : "";
        return `<div class="path-job row"><span class="grow" title="${UI.esc(o.desc)}"><b>${UI.esc(o.name)}</b> <span class="tiny muted">start as ${UI.esc(o.title)} · ${A.coin(o.pay)}/yr${why ? ` · <span class="warn-t">${UI.esc(why)}</span>` : ""}</span></span><span class="tiny ${o.chance >= 0.6 ? "good-t" : o.chance <= 0.25 ? "bad-t" : "warn-t"}">${Math.round(o.chance * 100)}%</span><button class="small" data-a="applyJob" data-v="${o.k}" ${A.S.yearActs["apply_" + o.k] || (pc.job && pc.job.c === o.k) || o.chance < 0.02 ? "disabled" : ""}>Apply</button></div>`;
      }).join("");
    }
    const open = k !== "common" || !pc.job;
    h += `<details class="card path-card" ${open && (k === A.role(pc).path || k === "army" || k === "court") ? "open" : ""}><summary class="row">${UI.icon(P.ic, "s")}<b class="grow">${UI.esc(P.name)}</b><span class="tiny muted">${UI.esc(P.desc)}</span></summary>${body}</details>`;
  }
  return h;
};

Object.assign(UI.A, {
  takeDoor(v) {
    const r = A.takeDoor(v);
    if (r.msg) UI.toast(r.msg);
    UI.refresh();
  },
  cnAct(v) {
    const r = A.councilAct(v);
    if (r && r.msg) UI.toast(r.msg.length > 160 ? r.msg.slice(0, 157) + "…" : r.msg);
    UI.refresh();
  },
  cnProp(v) {
    const el = UI.$("#cnRealm");
    if (!el) return;
    const r = A.councilPropose(v, el.value);
    if (r && r.msg) UI.toast(r.msg);
    UI.refresh();
  },
});

UI.TAB.work = UI.TAB.path;

UI.diplCard = function (r, o) {
  // [X1 baked patch diplomacy/20-ai-personality AIP-DIPL-UI] UI.diplCard: the fictional "Slowly pulling them" list
  // (A.realmStanding fed nothing) now shows the real yearly pulls from A.aiPullParts; a temperament line names the
  // ruler's traits and what they do; every offer shows its top 3 reasons. The peace screen explains their
  // willingness.
  const rel = A.relBetween(r.id, o.id),
    pr = A.realmPower(r),
    po = A.realmPower(o),
    ru = A.P(o.ruler),
    tr = A.treatiesOf(r.id, o.id),
    trTxt = tr.map(k =>
      k === "guar"
        ? A.hasTr(r.id, o.id, "guar")
          ? "you guarantee them"
          : "they guarantee you"
        : k === "sub"
          ? A.hasTr(r.id, o.id, "sub")
            ? "you subsidize them"
            : "they subsidize you"
          : k === "emb"
            ? A.hasTr(r.id, o.id, "emb")
              ? "you embargo them"
              : "they embargo you"
            : A.TREATY[k].name.toLowerCase(),
    ),
    parts = A.opinionParts(o.id, r.id).filter(x => x[1]),
    stand = A.aiPullParts(o.id, r.id, true),
    iv = A.interestParts(o.id, r.id);
  // [X1 baked patch diplomacy/20-ai-personality AIP-DIPL-UI] UI.diplCard: the fictional "Slowly pulling them" list
  // (A.realmStanding fed nothing) now shows the real yearly pulls from A.aiPullParts; a temperament line names the
  // ruler's traits and what they do; every offer shows its top 3 reasons. The peace screen explains their
  // willingness.
  // [X1 baked patch diplomacy/99996-v2-diplomacy V2DIP-SEEN-REALMS] Playtest 1 #22: a peasant saw every realm's
  // people, army and stability as exact figures. What you know depends on who you are (A.V2DIP.seen,
  // knowledge.core.js): the World > Realms table, the realm card and the diplomacy card say it as an estimate or as
  // hearsay unless you rule that realm.
  let h = `<div class="card dipl-card"><div class="row"><span class="swatch" style="background:${o.color}"></span><h3 style="margin:0">${UI.esc(o.name)}</h3><span class="right"></span><button class="small ghost" data-a="diplSel" data-v="" aria-label="Close">${UI.icon("x", "s")}</button></div>
    <div class="small muted">${ru ? UI.esc(A.rulerStyle(ru, o)) + " · " : ""}${UI.esc(A.V2DIP ? A.V2DIP.popText(o) : A.fmt(o.pop) + " people")} · army ${UI.esc(A.V2DIP ? A.V2DIP.armyText(o) : A.fmt(o.army))} · ${UI.esc((A.faith(o.faith) || {}).name || "")} · infamy ${Math.round(o.infamy || 0)}</div>
    <div class="small" style="margin:4px 0">${tr.length ? "Bound by: <b>" + UI.esc(trTxt.join(", ")) + "</b>" : '<span class="muted">No treaties.</span>'}${
      o.allies.length
        ? ` · their allies: ${o.allies
            .filter(x => A.realm(x) && A.realm(x).alive)
            .map(A.realmShort)
            .join(", ")}`
        : ""
    }${
      (o.rivals || []).length
        ? ` · their rivals: ${o.rivals
            .filter(x => A.realm(x) && A.realm(x).alive)
            .map(A.realmShort)
            .join(", ")}`
        : ""
    }</div>
    ${UI.barRow("Their opinion of you", (rel + 100) / 2, 100, rel < 0 ? "hpbar" : "", 50, rel)}
    ${UI.barRow("Their power", Math.min(100, (po / Math.max(1, pr + po)) * 100), 100, "", 50, "×" + (po / Math.max(1, pr)).toFixed(1))}
    ${UI.aiTemper(o, r)}<details class="dipl-why"><summary class="small">Why they feel this way</summary><div class="kv tiny">${parts.map(([n, v]) => `<div>${UI.esc(n)}</div><div class="${v >= 0 ? "good-t" : "bad-t"}">${v > 0 ? "+" : ""}${v}</div>`).join("")}</div>${stand.length ? `<div class="tiny muted" style="margin-top:4px">Pulling them each year: ${stand.map(([n, v]) => `${UI.esc(n)} (${v > 0 ? "+" : ""}${v})`).join(", ")}</div>` : ""}<div class="tiny muted" style="margin-top:4px">What they want from you now: ${iv.map(([n, v]) => `${UI.esc(n)} (${v > 0 ? "+" : ""}${v})`).join(", ")}</div></details>`;
  const opts = A.diplOptions(r, o),
    groups = {};
  for (const x of opts) (groups[x.grp] = groups[x.grp] || []).push(x);
  for (const g in groups) {
    h += `<div class="group-h">${UI.esc(g)}</div><div class="dipl-opts">`;
    for (const x of groups[g]) {
      const war2 = x.k === "war",
        dis = x.dis || (x.cool && !/^un/.test(x.k) && !war2 ? `Answered recently — ${Math.ceil(x.cool / 30)} mo` : "");
      // [X1 baked patch diplomacy/20-ai-personality AIP-DIPL-UI] UI.diplCard: the fictional "Slowly pulling them" list
      // (A.realmStanding fed nothing) now shows the real yearly pulls from A.aiPullParts; a temperament line names the
      // ruler's traits and what they do; every offer shows its top 3 reasons. The peace screen explains their
      // willingness.
      h += `<div class="dopt ${dis ? "dis" : ""}"><button class="small ${war2 ? "danger" : /^un/.test(x.k) ? "ghost" : ""}" data-a="diplDo" data-v="${x.k}|${o.id}" ${dis && !(war2 && !x.dis) ? "disabled" : ""}>${UI.esc(x.name)}</button>${x.chance != null ? `<span class="pct ${x.chance >= 60 ? "good" : x.chance <= 25 ? "bad" : "warn"}">${x.chance}%</span>` : ""}<div class="tiny muted">${UI.esc(dis || x.desc)}</div>${x.chance != null && !dis ? UI.aiOfferWhy(x, r, o) : ""}</div>`;
    }
    h += "</div>";
  }
  const war = A.S.wars.find(
    w => (w.att.includes(r.id) && w.def.includes(o.id)) || (w.def.includes(r.id) && w.att.includes(o.id)),
  );
  if (war)
    h += `<div class="dopt"><button class="small" data-a="ov" data-v="peace:${war.id}">Negotiate peace…</button><div class="tiny muted">${UI.esc(war.name)} · war score ${Math.round(A.warSide(war, r.id) === "att" ? war.score : -war.score)}</div></div>`;
  return h + "</div>";
};

UI.relStatus = function (r, o) {
  const out = [],
    tr = A.treatiesOf(r.id, o.id);
  if (A.hostile(r.id, o.id)) out.push('<span class="tag bad-t">war</span>');
  for (const k of tr)
    out.push(
      `<span class="tag">${UI.esc(
        {
          ally: "ally",
          def: "pact",
          guar: "guarantee",
          access: "access",
          nap: "peace",
          trade: "trade",
          sub: "subsidy",
          emb: "embargo",
          marriage: "kin",
          trib: "tribute",
          rival: "rival",
        }[k] || k,
      )}</span>`,
    );
  if (o.overlord === r.id) out.push('<span class="tag">pays you</span>');
  return out.join(" ");
};

UI.gathList = function () {
  const L = (A.S.gath || []).filter(g => !g.done).sort((a, b) => a.at - b.at);
  return L.length
    ? L.slice(0, 8)
        .map(
          g =>
            `<div class="small row"><span class="grow"><b>${UI.esc(A.cap(A.gathName(g)))}</b> <span class="muted">· ${UI.esc(A.dateStr(g.at % 365, Math.floor(g.at / 365), true))} ${Math.floor(g.at / 365)} · ${A.gathAttendees(g).map(A.realmShort).join(", ")}</span></span>${g.pc && g.pc.accepted ? '<span class="chip gold">you attend</span>' : ""}</div>`,
        )
        .join("")
    : '<p class="small muted">No gatherings planned.</p>';
};

UI.TAB.world = function (pc) {
  let h = UI.worldTabPolitics(pc);
  if (UI.worldView === "dipl") h += `<div class="group-h">Gatherings</div>${UI.gathList()}`;
  return h;
};

UI.helpModalBasic = function () {
  const close = `<button class="ghost closex" data-a="closeOv" aria-label="Close">${UI.icon("x", "m")}</button>`,
    P = t => `<p>${t}</p>`;
  // [X1 baked patch ui/59-descriptions TT-WORDS-NO-HOVER] UI: three lines of the release tell the player to hover
  // (the map caption, the "Underlined words" hint, the help page). Nothing opens on hover any more, so they say
  // press.
  return `<div class="panel mbox wide">${close}<h2>How to play ARDAN</h2><div class="lore-text" style="font-size:calc(16px * var(--tx, 1))">
    ${P("<b>Six tabs.</b> <i>Life</i>: what to do now, your plan, what you can do, and your Decisions (on a phone, also your story and yourself). <i>People</i>. <i>Path &amp; War</i>: your career and your realm's wars. <i>Holdings</i>: coin, gear, land, markets. <i>Realm</i>: the court, or the realm you rule. <i>Chronicle</i>: your dynasty, the world map and the Codex. On a phone the six tabs sit at the bottom of the screen; with a keyboard, the arrow keys move along them.")}
    ${P("<b>What now.</b> The top of Life lists the three things most worth doing, one click each. <b>Underlined words</b> explain themselves: tap, click or press Enter on them (your fighting worth opens into body, skill and gear). The Menu has text size, map colors for color-blind players, hints for new players, Export, and Report a problem.")}
    ${P("<b>Time runs.</b> Press <i>Play</i> (or Space) and the days pass; speeds 1–5 (keys 1–5). Anything that needs you — an event, a battle, a letter, a gathering — stops the clock. <i>Next</i> runs until something needs you. <i>Quiet</i> settles ordinary events with the safest choice.")}
    ${P("<b>Your days.</b> On the Life tab, set a <i>training</i> focus, how <i>hard</i> you train, and what your <i>free hours</i> go to (advancement, a patron, coin, renown, faith, love, study, scheming, freedom…). Every day moves them. When a pursuit has built up, something opens — what depends on who you are. <i>Initiative</i> (⧗) refills over time and pays for actions.")}
    ${P("<b>Your path.</b> Every post is a ladder with plain requirements: merit earned month by month, skill, reputation, time — sometimes letters, birth or a patron. Duties throw up problems and chances. Ladders connect through <i>doors</i>: the clerk can become an envoy, the envoy a chancellor; a sergeant can become a thief-taker. The top of the government ladders is a seat on the council, and the council steers the realm.")}
    ${P("<b>Who you are decides what happens.</b> A king is not mugged in a tavern; a peasant is not asked favors by dukes until something puts them in a great one's sight. Your position also decides what you may do: a ruler does not enlist, a marshal does not dig ditches.")}
    ${P("<b>War.</b> Divisions march across the map day by day. Each day of a battle, each commander picks a tactic — charge, flank, feign a retreat, ambush, dig in, hold a reserve — and some beat others. Scouts, ground, walls, supply, experience and the general matter as much as numbers: a smaller army on good ground with the right tactic can break a bigger one. Supply flows along roads from your capital and depots; enemy armies choke it and raiders cut it. Open the War Room from the War tab.")}
    ${P("<b>Crowns remember.</b> Opinions between realms are built from memories — gifts, insults, broken pacts, shared battles, stolen land — and each crown weighs alliances by its interests. Treaties: alliance, defensive pact, guarantee, military access, non-aggression, trade, subsidy, embargo, royal marriage, tribute, rivalry. Incidents at the border give reasons for war; a war without a reason costs dearly. Crowns meet at summits, weddings, coronations, congresses and tournaments — and if you are there, you live it.")}
    ${P("<b>Rule.</b> Inherit a crown, marry into one, seize one, or found one. The Realm tab holds the state, the chancery, the court and building. When you die, go on as your heir — if they can hold the throne.")}
  </div></div>`;
};

UI.warTabClock = function (pc) {
  const S = A.S,
    myR = pc.ruler || (pc.mil && !pc.mil.merc ? pc.mil.realm : pc.mil && pc.mil.contract ? pc.mil.contract : pc.realm),
    wars = A.atWar(myR),
    R2 = A.cmdRole(pc),
    cmd = A.wsCommandable(pc).length;
  // [X1 baked patch core/02-content-fixes TXT-WAR-PLURALS] The war room counted "1 armies in the field · 1 battles
  // raging" (round 2 A0, docs/CRITIQUE.md E10). Both counts now go through A.plural (plural.core.js): "1 army in the
  // field · 2 battles raging". 59-descriptions reads the line by its words and accepts both forms.
  // [X1 baked patch events/58-event-cut EC-WARCARD] Uniqueness 5: the War tab told every farmhand that the War Room
  // "shows the host, its templates and forges". Templates and forges are now shown only to the ranks that run them,
  // so the line names them only for those ranks.
  let h = `<div class="card wr-warcard"><div class="row">${UI.icon(wars.length ? "swords" : "shield", "s")}<b class="grow">${wars.length ? UI.esc(wars.map(w => w.name).join(", ")) : `${UI.esc(A.realmShort(myR))} is at peace`}</b><button class="small ${wars.length || cmd ? "primary" : ""}" data-a="warRoomView">${UI.icon("target", "s")}War Room</button></div>
    <div class="small muted">${wars.length ? `${A.plural(A.armiesOf(myR).length, "army", "armies")} in the field · ${A.plural(Object.values(S.fights || {}).filter(F => A.friendly(F.a, myR) || A.friendly(F.b, myR)).length, "battle")} raging${cmd ? ` · <b>${cmd} under your command</b>` : ""}` : R2.templates || R2.production ? "The War Room shows the host, its templates and forges, even in peace." : "The War Room shows the fronts and the host, even in peace."}</div>`;
  if (pc.ruler) {
    const ws = wars.filter(w => w.leadA === pc.ruler || w.leadD === pc.ruler);
    if (ws.length)
      h += `<div class="row wrap" style="margin-top:6px">${ws.map(w => `<button class="small" data-a="ov" data-v="peace:${w.id}">Peace table: ${UI.esc(w.name)}</button>`).join("")}</div>`;
  }
  if (((h += "</div>"), (pc.mil && !pc.mil.merc) || pc.ruler)) {
    if (
      ((h += `<div class="card"><div class="row">${UI.icon(R2.key === "ruler" ? "crown" : "shield", "s")}<span class="tag">Your command</span><b class="grow">${UI.esc(R2.title || "")}</b></div><div class="small">${UI.esc(R2.desc || "")}</div>`),
      pc.mil && pc.mil.div)
    ) {
      const d = A.divById(pc.mil.div);
      if (d)
        h += `<div class="small" style="margin-top:6px">${pc.mil.rank === 6 ? "You command" : "You serve in"} the <b>${UI.esc(d.name)}</b> — ${UI.esc(UI.wrDivStatusText(d))}. ${A.xpLevel(d.exp)[1]}, ${UI.wrPct(Math.min(1, A.divStr(d)))} strength.</div>${UI.wrBars(d)}`;
    }
    // [X1 baked patch people/99999-v2-renown RN-WORDS] Merit was shown as a counter ("Merit 112 / 30") in the year's
    // summary and explained as a bar to meet; it no longer decides promotion. In the source: say where you stand for
    // the next rank in words, and say how the board decides.
    if (
      (pc.mil &&
        !pc.mil.merc &&
        (h += `<div class="tiny muted" style="margin-top:4px">${UI.esc(GD.MIL[pc.mil.rank].title)}${A.RN && A.RN.on ? "" : ` · merit ${Math.round(pc.mil.merit)}`} — your promotion board is in the <span class="click u" data-a="tab" data-v="path">Path</span> tab.</div>`),
      (h += "</div>"),
      (h += UI.wrTacOrders(pc)),
      pc.mil && !pc.mil.merc)
    ) {
      try {
        h += UI.oobBreadcrumb(pc) + UI.chainOfCommand(pc) + (A.superior(pc) ? UI.superiorCard(pc) : "");
      } catch {}
      const sp = UI.specCard
        ? UI.specCard(
            Object.assign({}, pc, {
              job: null,
            }),
          )
        : "";
      if (sp) h += sp;
    }
    if (pc.mil && pc.mil.rank >= 4)
      h += `<div class="row" style="margin-top:6px"><button class="small" data-a="wrExercise" ${A.S.yearActs.exercise ? "disabled" : ""}>${UI.icon("flag", "s")}Join this year's war games${A.S.yearActs.exercise ? " (done)" : ""}</button></div>`;
    const sq = A.squad(pc);
    if (sq.length) {
      h += `<div class="group-h">${pc.mil.rank >= 3 ? "Your officers and sergeants" : "Your mess"}</div>`;
      for (const c of sq) {
        const r = pc.rel[c.id] || {
          op: 0,
        };
        h += `<div class="card person click" data-a="ov" data-v="person:${c.id}"><div class="pp">${PORTRAIT.svg(c, 46)}</div><div><div class="nm">${UI.esc(A.fullName(c))}</div><div class="sub">${A.age(c)}, ${UI.esc(GD.RACES[c.race].adj)} · ${UI.esc(c.quirk || "")}</div></div><div class="opbar">${UI.bar((r.op + 100) / 2, 100)}</div></div>`;
      }
    }
  } else if (pc.company) {
    const c = pc.company;
    h += `<div class="card"><h3>${UI.esc(c.name)}</h3><div class="kv"><div>Men</div><div>${A.fmt(c.men)}</div><div>Quality</div><div>${Math.round(c.quality * 100)}%</div><div>War chest</div><div>${A.coin(c.chest)}</div><div>Contract</div><div>${c.contract ? UI.esc(A.realmName(c.contract)) : "none — the men eat your silver"}</div><div>Battles</div><div>${c.battles}</div></div>
      <div class="row wrap" style="margin-top:8px"><button data-a="recruit" data-v="20">Hire 20 (120)</button><button data-a="recruit" data-v="100">Hire 100 (600)</button><button data-a="act" data-v="seize_land" ${A.canAct("seize_land")[0] ? "" : "disabled"}>Carve out a realm (3⧗)</button></div><p class="small muted">With 250+ men you can take unclaimed land and found your own realm and house.</p></div>`;
  } else if (pc.mil && pc.mil.merc)
    h += `<div class="card small"><b>${UI.esc(GD.MIL[pc.mil.rank].title)}, ${UI.esc(pc.mil.company || "a free company")}</b> — ${pc.mil.contract ? "under contract to " + UI.esc(A.realmName(pc.mil.contract)) : "between contracts"}.</div>`;
  else {
    h +=
      '<p class="small muted">You serve no banner. The army, the free companies and every other ladder are in the <span class="click u" data-a="tab" data-v="path">Path</span> tab.</p>';
    if (pc.veteran)
      h += `<p class="small">Veteran: ${GD.MIL[pc.veteran.rank].title}, ${pc.veteran.years} years, ${pc.veteran.battles} battles.</p>`;
  }
  const mine = S.wars.filter(w => w.att.includes(myR) || w.def.includes(myR));
  h += '<div class="group-h">Wars of your realm</div>';
  if (!mine.length) h += '<p class="small muted">None. For now.</p>';
  for (const w of mine) {
    const sc = (A.warSide(w, myR) || "att") === "att" ? w.score : -w.score;
    // [X1 baked patch war/23-after-action AAR-WAR-VIEWS] The two war views listed recent battles by name and year
    // only. Each now adds what decided it (A.aarWhy), as plain escaped text.
    h += `<div class="card"><b>${UI.esc(w.name)}</b> <span class="small muted">since ${w.start} · ${UI.esc(A.CB[w.cbReal || w.cb] || "")}</span><div class="small">${w.att.map(A.realmShort).join(", ")} <i>against</i> ${w.def.map(A.realmShort).join(", ")}</div>${UI.barRow("War score", (sc + 100) / 2, 100, sc < 0 ? "hpbar" : "", 50, Math.round(sc))}<div class="tiny muted">${w.battles
      .slice(-3)
      .map(b => UI.esc(b.name + " (" + b.y + ")" + (A.aarWhy ? A.aarWhy(b) : "")))
      .join(" · ")}</div></div>`;
  }
  const others = S.wars.filter(w => !mine.includes(w));
  if (others.length)
    h += `<div class="group-h">Elsewhere</div>${others
      .slice(0, 6)
      .map(
        w =>
          `<div class="small">${UI.esc(w.name)} — ${w.att.map(A.realmShort).join(", ")} against ${w.def.map(A.realmShort).join(", ")}</div>`,
      )
      .join("")}`;
  return h;
};

Object.assign(UI.ICONS, {
  scale:
    '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
  ship: '<path d="M12 10.189V14"/><path d="M12 2v3"/><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-8.188-3.639a2 2 0 0 0-1.624 0L3 14a11.6 11.6 0 0 0 2.81 7.76"/><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1s1.2 1 2.5 1c2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
  gem: '<path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/>',
  paw: '<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>',
  award:
    '<path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/>',
});

UI.tierIdx = t => GD.TIERS.indexOf(t);

UI.tierChip = function (p, short) {
  const w = A.fightWorth(p),
    t = A.tierOf(w);
  return `<span class="chip tier ${t.k} tipt" data-tip="worth:${p.id}" tabindex="0" role="button" aria-expanded="false" aria-haspopup="true" aria-label="${UI.esc(t.n + ", fighting worth " + w + ". Show where it comes from")}">${UI.icon("swords", "s")}${UI.esc(t.n)}${short ? "" : " · " + w}</span>`;
};

UI.vsYou = function (p) {
  const pc = A.pc();
  if (!pc || !p || p.id === pc.id) return "";
  // [X1 baked patch people/24-honest-duel-odds ODDS-VSYOU] UI.vsYou showed 100/(1+e^(-d/12)) on the worth gap, which
  // understated real duel odds by up to 15 points (79% shown where duels went 88-93%). It now shows 100 -
  // A.shownDuelOdds(pc, p), fitted on 2,100 lethal duels (scale 6.1).
  const pct = Math.round(100 - A.shownDuelOdds(pc, p)),
    word =
      pct >= 85
        ? "would almost surely beat you"
        : pct >= 65
          ? "would usually beat you"
          : pct >= 40
            ? "is an even match for you"
            : pct >= 18
              ? "would usually lose to you"
              : "would almost surely lose to you";
  return `<span class="${pct >= 65 ? "bad" : pct <= 35 ? "good" : "muted"}">${UI.esc(A.cap(A.he(p)))} ${word} (${pct}% for ${A.him(p)}).</span>`;
};

UI.takeLine = function (p) {
  const c = A.canTake(p),
    you = p.id === A.S.pc,
    who = you ? "You" : A.cap(A.he(p)),
    his = you ? "your" : A.his(p);
  if (c.reg < 0.75)
    return `${who} would lose to a single regular soldier more often than not. <span class="tiny muted">(melee, no arrows)</span>`;
  let s = `${who} could take about <b>${A.crowdN(c.reg)}</b> regular soldier${c.reg >= 1.5 ? "s" : ""} at once${c.vet >= 1.5 ? `, or <b>${A.crowdN(c.vet)}</b> veterans` : ""}.`;
  if (c.limited)
    s += ` <span class="bad">${A.cap(his)} skill is worth ${A.crowdN(c.skillReg)}, but ${his} wind gives out first.</span>`;
  return s + ' <span class="tiny muted">(melee, no arrows)</span>';
};

UI.cmdWord = v =>
  v >= 70
    ? "a great commander"
    : v >= 55
      ? "a capable commander"
      : v >= 40
        ? "a steady officer"
        : v >= 25
          ? "a raw officer"
          : "no commander";

UI.qualChip = q =>
  q && q !== "common"
    ? `<span class="chip qual q-${q}" title="${UI.esc(GD.QUAL[q].d)}">${UI.esc(GD.QUAL[q].n)}</span>`
    : "";

UI.gearLine = function (p) {
  const g = p.gear || {},
    out = [];
  for (const s of ["weapon", "ranged", "shield", "armor", "helm", "mount"]) {
    const k = g[s];
    if (!k || ["fists", "none"].includes(k) || !GD.GEAR[k]) continue;
    const q = A.qualOf ? A.qualOf(p, s) : "common";
    out.push(`${q !== "common" ? GD.QUAL[q].n.toLowerCase() + " " : ""}${GD.GEAR[k].name.toLowerCase()}`);
  }
  return out.length ? out.join(", ") : "unarmed and unarmored";
};

UI.titleLine = function (p) {
  if (!p) return "";
  if (!A.styleParts || A.age(p) < GD.RACES[p.race].adult) return UI.titleLineBasic(p);
  const s = A.styleParts(p);
  return (
    [[s.nob && !s.main.startsWith(s.nob) ? s.nob : "", s.main].filter(Boolean).join(", ")]
      .concat(s.extra)
      .filter(Boolean)
      .join(" · ") || UI.titleLineBasic(p)
  );
};

UI.TAB.goals = function (pc) {
  let h =
    '<p class="small muted" style="margin-top:0">There are no quest lists in Ardan. What you aim for is set on the <span class="click u" data-a="tab" data-v="life">Life</span> tab (your days and free hours) and climbed on the <span class="click u" data-a="tab" data-v="path">Path</span> tab. These are the big moves you can make when the time is right.</p>';
  const ds = A.decisionsFor(pc);
  if (ds.length) {
    h += '<div class="group-h">Decisions</div><div class="gridcards">';
    for (const d of ds) {
      const st = A.decisionState(pc, d);
      let pick = "";
      if (d.k === "found_house")
        pick = `<input class="dec-in" data-c="decArg" data-k="${d.k}" placeholder="House name (default: ${UI.esc(pc.sur || pc.given)})" value="${UI.esc((UI.decArg || {})[d.k] || "")}" maxlength="24" aria-label="House name">`;
      else if (d.pick) {
        let opts = [];
        try {
          opts = d.pick(pc);
        } catch {
          opts = [];
        }
        const cur = (UI.decArg || {})[d.k];
        pick = `<select data-c="decArg" data-k="${d.k}" aria-label="Choose"><option value="">Choose…</option>${opts.map(([v, n]) => `<option value="${UI.esc(v)}" ${String(cur) === String(v) ? "selected" : ""}>${UI.esc(n)}</option>`).join("")}</select>`;
      }
      h += `<div class="card dec ${st.ok ? "ok" : ""}"><span class="tag">${UI.esc(d.cat)}</span><div><b>${UI.esc(d.name)}</b></div><div class="small ink2">${UI.esc(d.desc)}</div><div class="reqs">${st.rs.map(([l, ok]) => `<span class="req ${ok ? "ok" : "no"}">${ok ? "✓" : "✗"} ${UI.esc(l)}</span>`).join("")}</div>${pick}<button class="small ${st.ok ? "primary" : ""}" data-a="decide" data-v="${d.k}" ${st.ok ? "" : "disabled"}>Decide</button></div>`;
    }
    h += "</div>";
  } else
    h +=
      '<p class="small muted">No great decisions are open to you yet. They come with land, titles, wealth and renown.</p>';
  const letters = pc.letters || [],
    fav = Object.entries(pc.favors || {})
      .map(([id, n]) => [A.P(id), n])
      .filter(x => x[0] && x[0].alive),
    owe = Object.entries(pc.owes || {})
      .map(([id, n]) => [A.P(id), n])
      .filter(x => x[0] && x[0].alive);
  h += '<div class="group-h">Favors and letters</div>';
  if (!letters.length && !fav.length && !owe.length)
    h +=
      '<p class="small muted">Nobody owes you anything yet. Help people you know ("Help with their troubles" on their page) and they will owe you favors: loans, letters, introductions, a good word.</p>';
  if (letters.length)
    h += `<div class="small"><b>Letters of recommendation:</b> ${letters.map(l => `<span class="chip gold" title="Used on your next application, school trial or petition">${UI.esc(l.from)} · weight ${l.power}</span>`).join("")}</div>`;
  if (fav.length)
    h += `<div class="small" style="margin-top:4px"><b>They owe you:</b> ${fav.map(([p, n]) => `<span class="chip green click" data-a="ov" data-v="person:${p.id}">${UI.esc(A.fullName(p, false))} ×${n}</span>`).join("")}</div>`;
  if (owe.length)
    h += `<div class="small" style="margin-top:4px"><b>You owe:</b> ${owe.map(([p, n]) => `<span class="chip red click" data-a="ov" data-v="person:${p.id}">${UI.esc(A.fullName(p, false))} ×${n}</span>`).join("")} <span class="tiny muted">They will call it in. Refusing costs honor.</span></div>`;
  return h;
};

UI.TAB.legacy = function (pc) {
  const S = A.S,
    kids = (pc.children || []).map(A.P).filter(c => c && c.alive);
  let h = `<div class="card dyn-head"><div class="row"><div class="grow"><span class="tag">House and blood</span><h3 style="margin:0">${UI.esc(S.dynasty ? S.dynasty.name : pc.sur || pc.given)}</h3><div class="small muted">Generation ${S.gen || 1} · ${(S.dyn || []).length + 1} li${(S.dyn || []).length ? "ves" : "fe"} in the chronicle · score ${A.fmt(A.score(pc))}</div></div></div>
    <div class="small ink2" style="margin-top:6px">No points and no magic gifts pass between lives. An heir gets what a real heir gets: the purse and land split by custom, your arms and armor, your titles where the law allows, the name you made, the friends and enemies you leave, and what you took the time to teach them.</div></div>`;
  const lives = (S.dyn || []).slice();
  h += '<div class="group-h">The chronicle</div><div class="chron">';
  for (const L of lives)
    h += `<div class="chron-e"><div class="chron-y">${L.born}–${L.died}</div><div><b>${UI.esc(L.title || L.name)}</b><div class="tiny muted">died of ${UI.esc(L.cause || "unknown causes")}</div>${(L.deeds || []).length ? `<div class="tiny">${L.deeds.map(UI.esc).join(" · ")}</div>` : ""}</div></div>`;
  if (
    ((h += `<div class="chron-e now"><div class="chron-y">${pc.born}–</div><div><b>${UI.esc(A.fullStyle ? A.fullStyle(pc) : A.fullName(pc))}</b><div class="tiny muted">living, ${A.age(pc)}</div>${
      pc.deeds.length
        ? `<div class="tiny">${pc.deeds
            .slice(-4)
            .map(d => UI.esc(d.t))
            .join(" · ")}</div>`
        : ""
    }</div></div></div>`),
    (h += '<div class="group-h">Your children</div>'),
    !kids.length)
  )
    h += '<p class="small muted">No living children. Without an heir, the story ends with you.</p>';
  else {
    const cur =
      UI.dynHeir && kids.find(c => c.id === UI.dynHeir)
        ? UI.dynHeir
        : kids.slice().sort((a, b) => a.born - b.born)[0].id;
    for (const c of kids.sort((a, b) => a.born - b.born)) {
      const taught = (pc.flags.taught || {})[c.id] || 0;
      h += `<div class="card person ${c.id === cur ? "sel" : ""}"><div class="pp click" data-a="ov" data-v="person:${c.id}">${PORTRAIT.svg(c, 46)}</div><div><div class="nm">${UI.esc(A.fullName(c, false))}</div><div class="sub">${A.age(c)} · ${UI.esc(UI.titleLine(c) || "")}${taught ? ` · taught by you ${taught}×` : ""}</div></div><div class="row" style="gap:4px"><button class="small" data-a="teach" data-v="${c.id}" ${A.S.time >= 1 ? "" : "disabled"} title="Spend days teaching them your two best proficiencies. What you teach is what they inherit.">Teach (1⧗)</button><button class="small ${c.id === cur ? "on" : ""}" data-a="dynHeir" data-v="${c.id}" aria-pressed="${c.id === cur}">If heir…</button></div></div>`;
    }
    const heir = A.P(cur),
      inh = A.inheritance(pc, heir);
    h += `<div class="card inherit"><div class="tag">If ${UI.esc(heir.given)} carried on after you</div>${inh.length ? inh.map(x => `<div class="inh-row ${x.no ? "no" : ""}"><b>${UI.esc(x.name)}</b><span>${UI.esc(String(x.k === "coin" ? A.coin(x.v) : x.v))}</span><div class="tiny muted">${UI.esc(x.why)}</div></div>`).join("") : '<div class="small muted">Very little: you have not much to leave yet.</div>'}</div>`;
  }
  if (S.deadList.length)
    h +=
      '<div class="group-h">Lives lived</div>' +
      S.deadList
        .map(
          d =>
            `<div class="small">${UI.esc(d.name)} (${d.born}–${d.died}), ${UI.esc(d.cause)} — score ${A.fmt(d.score)}</div>`,
        )
        .join("");
  h += `<div class="group-h">Achievements (${Object.keys(S.ach).length}/${Object.keys(GD.ACH).length})</div><div class="achgrid">${Object.entries(
    GD.ACH,
  )
    .map(
      ([k, [n, d]]) =>
        `<div class="card ach ${S.ach[k] ? "" : "lock"}"><b>${UI.esc(n)}</b>${UI.esc(d)}${S.ach[k] ? `<div class="tiny muted">${S.ach[k]} AR</div>` : ""}</div>`,
    )
    .join("")}</div>`;
  return h;
};

Object.assign(UI.A, {
  teach(v) {
    const r = A.teachChild(v);
    UI.toast(r.msg || "");
    UI.refresh();
  },
  dynHeir(v) {
    UI.dynHeir = v;
    UI.refreshTab();
  },
});

UI.rosterCard = function (pc) {
  if (!A.roster || !A.isAdult(pc)) return "";
  const ro = A.roster(pc);
  if (!ro.length) return "";
  const groups = {};
  // [X1 baked patch family/99994-v2-family V2F-ROSTER-GROUP] A.roster put a plain soldier's messmates ("in your
  // mess") in the group "Under you", so the People tab's Around you card and the person view listed a private's
  // fellow privates as under him (playtest 2, old #15). The group shown is now A.V2F.rosterGroup(x): messmates stand
  // "Beside you" until you lead them (a sergeant's men stay "Under you"). Only the heading changes: the roster entry
  // keeps its group, which A.getToKnow and 30-get-to-know read for the bond.
  for (const x of ro) {
    const gk = A.V2F && A.V2F.rosterGroup ? A.V2F.rosterGroup(x) : x.grp;
    (groups[gk] = groups[gk] || []).push(x);
  }
  let h =
    '<div class="card roster"><div class="row"><span class="tag">Around you</span><span class="tiny muted grow">You know their names and posts — not them. Getting to know someone takes an evening (1⧗) and is your choice.</span></div>';
  for (const g of [
    "Above you",
    "Your staff",
    "Under you",
    "Beside you",
    "The council",
    "Your commanders",
    "Your house",
  ])
    if (groups[g]) {
      h += `<div class="ro-h">${UI.esc(g)}</div>`;
      for (const { p, role } of groups[g].slice(0, 12)) {
        const known = !!pc.rel[p.id];
        h += `<div class="ro-row"><span class="click" data-a="ov" data-v="person:${p.id}">${PORTRAIT.svg(p, 34)}</span><div class="grow"><div class="small"><b class="click" data-a="ov" data-v="person:${p.id}">${UI.esc(A.fullName(p, false))}</b> <span class="muted">— ${UI.esc(role)}</span></div><div class="tiny muted">${UI.esc(UI.titleLine(p) || p.occ || "")}</div></div>${UI.tierChip(p, true)}${known ? UI.bondChip(pc, p) : `<button class="small" data-a="know" data-v="${p.id}" ${A.S.time >= (A.knowCost || 1) ? "" : "disabled"}>Get to know</button>`}</div>`;
      }
    }
  return h + "</div>";
};

UI.TAB.people = function (pc) {
  return (
    UI.rosterCard(pc) +
    '<p class="small muted" style="margin-top:0">These are the people you have chosen to know. Bonds you never tend fade after a few years; the ones you care for last.</p>' +
    UI.peopleBonds(pc)
  );
};

Object.assign(UI.A, {
  know(v) {
    const r = A.getToKnow(v);
    UI.toast(r.msg || "");
    if (UI.ov && UI.ov.type === "person") UI.renderModal();
    UI.refresh();
  },
});

UI.personModal = function (t, close) {
  const pc = A.pc();
  if (!t) return `<div class="panel mbox">${close}<p>They are gone.</p></div>`;
  const known = !!pc.rel[t.id] || t.id === pc.id,
    r = pc.rel[t.id] || {
      type: "acquaint",
      op: 0,
    },
    st = A.stats(t),
    adult = A.age(t) >= GD.RACES[t.race].adult,
    sp = A.styleParts
      ? A.styleParts(t)
      : {
          main: t.occ || "",
          extra: [],
        },
    fa = A.faith(t.faith),
    cu = A.culture(t.cult),
    hs = t.house ? A.house(t.house) : null;
  let h = `<div class="panel mbox wide prof">${close}<div class="prof-head"><div class="prof-por">${PORTRAIT.svg(t, 150)}</div><div class="grow">
    <div class="tag">${UI.esc(known ? A.relLabel(t, r) : "Known by sight")}</div>
    <h2 style="margin:0 0 2px">${UI.esc((sp.nob ? sp.nob + " " : "") + A.fullName(t))}</h2>
    <div class="prof-role">${UI.esc(sp.main || (adult ? (GD.STATUS[t.status] || {}).name || "" : "A child"))}</div>
    ${sp.extra.length ? `<div class="small ink2">${sp.extra.map(UI.esc).join(" · ")}</div>` : ""}
    <div class="small muted">${A.age(t)} years · ${UI.esc(GD.RACES[t.race].name)} · ${UI.esc(cu ? cu.name : "")} · ${UI.esc(fa ? fa.name : "no faith")}${t.alive ? "" : ' · <span class="bad">died ' + t.died + " of " + UI.esc(t.cause || "?") + "</span>"}</div>
    <div style="margin-top:4px">${adult ? UI.tierChip(t) : ""}${hs ? `<span class="chip gold click" data-a="ov" data-v="house:${hs.id}">${PORTRAIT.coat(hs, 14)} ${UI.esc(hs.name)}</span>` : ""}${t.traits.map(x => (GD.TRAITS[x] ? `<span class="chip" title="${UI.esc(GD.TRAITS[x].desc)}">${GD.TRAITS[x].name}</span>` : "")).join("")}${t.blood && t.blood.show && GD.BLOOD[t.blood.id] ? `<span class="chip blood">${UI.esc(GD.BLOOD[t.blood.id].short)}</span>` : ""}</div>
  </div></div>`;
  const who = [];
  who.push(["Born", `${t.born} AR${t.home != null && A.prov(t.home) ? " in " + A.provName(t.home) : ""}`]);
  who.push(["Realm", A.realmName(t.realm) || "—"]);
  if (t.spouse && A.P(t.spouse)) who.push(["Married to", A.fullName(A.P(t.spouse), false)]);
  if (t.fame)
    who.push([
      "Renown",
      `${Math.round(t.fame)}${t.fame >= 60 ? " — known across Ardan" : t.fame >= 30 ? " — known in the realm" : t.fame >= 10 ? " — known locally" : ""}`,
    ]);
  const does = [];
  if (sp.main) does.push(A.cap(sp.main));
  const ro = A.roster ? A.roster(pc).find(x => x.p.id === t.id) : null;
  // [X1 baked patch family/99994-v2-family V2F-ROSTER-GROUP] A.roster put a plain soldier's messmates ("in your
  // mess") in the group "Under you", so the People tab's Around you card and the person view listed a private's
  // fellow privates as under him (playtest 2, old #15). The group shown is now A.V2F.rosterGroup(x): messmates stand
  // "Beside you" until you lead them (a sergeant's men stay "Under you"). Only the heading changes: the roster entry
  // keeps its group, which A.getToKnow and 30-get-to-know read for the bond.
  if (ro)
    does.push(
      A.cap(ro.role) +
        (ro.grp ? " (" + (A.V2F && A.V2F.rosterGroup ? A.V2F.rosterGroup(ro) : ro.grp).toLowerCase() + ")" : ""),
    );
  if (t.mil && t.mil.div && A.divById(t.mil.div)) does.push(`Serves in the ${A.divById(t.mil.div).name}`);
  const cmdDivs = A.allDivs ? A.allDivs().filter(d => d.cmd === t.id) : [];
  if (cmdDivs.length)
    does.push(
      `Commands ${cmdDivs.length === 1 ? "the " + cmdDivs[0].name.replace(/^the /i, "") : cmdDivs.length + " divisions"} (${A.fmt(cmdDivs.reduce((s, d) => s + d.men, 0))} men)`,
    );
  for (const id in A.S.realms) {
    const rr = A.S.realms[id];
    if (rr.alive) {
      for (const a of A.armiesOf ? A.armiesOf(id) : []) if (a.gen === t.id) does.push(`General of the ${a.name}`);
      if (rr.orders)
        for (const oid in rr.orders)
          if (rr.orders[oid] === t.id) does.push(`Leads ${GD.ORDERS[oid].name}: ${GD.ORDERS[oid].spec}`);
    }
  }
  if (t.job && GD.CAREERS[t.job.c])
    does.push(`${GD.CAREERS[t.job.c].name}${t.job.y ? ", " + t.job.y + " years in the trade" : ""}`);
  if (!does.length) does.push(t.occ || (adult ? "Keeps to their own business" : "Grows up"));
  const sk = A.specialties(t, 5),
    cw = A.cmdWorth(t);
  if (
    ((h += `<div class="prof-grid">
    <div><div class="group-h">Who ${A.he(t)} is</div><div class="kv small">${who.map(([k, v]) => `<div>${UI.esc(k)}</div><div>${UI.esc(v)}</div>`).join("")}</div>${t.desc ? `<div class="lore-text small" style="margin-top:6px">${UI.esc(t.desc)}</div>` : ""}${t.manner ? `<div class="small muted">${UI.esc(t.manner)}</div>` : ""}${t.quirk ? `<div class="small muted">${UI.esc(A.cap(A.he(t)))} ${UI.esc(t.quirk)}.</div>` : ""}</div>
    <div><div class="group-h">What ${A.he(t)} does</div>${does.map(x => `<div class="small prof-li">${UI.esc(x)}</div>`).join("")}${
      (t.deeds || []).length
        ? `<div class="tiny muted" style="margin-top:6px"><b>Deeds:</b> ${t.deeds
            .slice(-5)
            .map(d => UI.esc(d.y + ": " + d.t))
            .join(" · ")}</div>`
        : ""
    }</div>
    <div><div class="group-h">What ${A.he(t)} can do</div>
      ${adult ? `<div class="small">${UI.tierChip(t)} ${UI.vsYou(t)}</div><div class="small take" style="margin-top:4px"><b>One against many:</b> ${UI.takeLine(t)}</div><div class="small" style="margin-top:4px"><b>Command:</b> ${cw} — ${UI.esc(UI.cmdWord(cw))}</div>` : ""}
      <div class="spec-list">${sk.length ? sk.map(s => `<div class="skrow"><span>${UI.esc(s.name)}</span>${UI.bar(s.v, 100, "statbar")}<b>${s.v}</b><i>${UI.esc(s.word)}</i></div>`).join("") : '<div class="small muted">No real skills yet.</div>'}</div>
      <div class="tiny muted" style="margin-top:4px">Body: strength ${st.str} · speed ${st.spd} · instinct ${st.ins} · stamina ${st.sta} · wits ${st.int} · will ${st.wil}</div>
      ${adult ? `<div class="tiny" style="margin-top:4px"><b>Carries:</b> ${UI.esc(UI.gearLine(t))}</div>` : ""}
    </div></div>`),
    t.id !== pc.id)
  )
    if (((h += '<div class="sep"></div><div class="group-h">Between you</div>'), known)) {
      // [X1 baked patch people/21-npc-initiative NPCI-BOND-HIST] Show the shared bond history (pc.rel[id].hist, written
      // by NPC moves, get-to-know and interactions) in the person view under "Between you". In the source: call the
      // history renderer after the opinion/favour row in personModal.
      if (
        ((h += `${UI.barRow("Opinion of you", (r.op + 100) / 2, 100, r.op < 0 ? "hpbar" : "", 50, Math.round(r.op))}<div class="row small">${t.alive ? UI.bondChip(pc, t) : ""}${r.sworn ? '<span class="chip gold">Sworn sibling</span>' : ""}${r.why ? `<span class="muted">${UI.esc(r.why)}</span>` : ""}${A.favorsOf(pc, t.id) ? `<span class="chip green">owes you ${A.favorsOf(pc, t.id)}</span>` : ""}${A.owesTo(pc, t.id) ? `<span class="chip red">you owe ${A.owesTo(pc, t.id)}</span>` : ""}</div>${UI.bondHist ? UI.bondHist(pc, t, r) : ""}`),
        t.alive && pc.alive)
      ) {
        const opts = A.interactOptions(pc, t);
        h += `<div class="row" style="margin-top:6px">${opts.map(k => (k === "gift" ? `<span class="row" style="gap:3px"><input id="giftAmt" type="number" min="1" value="${Math.max(1, Math.round(Math.min(pc.coin, Math.max(2, pc.coin * 0.05))))}" style="width:80px" aria-label="Gift amount"><button class="small" data-a="int" data-v="${t.id}|gift">Give gift</button></span>` : k === "name_child" ? `<span class="row" style="gap:3px"><input id="childName" value="${UI.esc(t.given)}" style="width:120px" aria-label="Name"><button class="small" data-a="int" data-v="${t.id}|name_child">Rename</button></span>` : `<button class="small ${["murder", "duel", "insult", "divorce", "breakup"].includes(k) ? "danger" : ""}" data-a="int" data-v="${t.id}|${k}">${UI.esc(A.INTERACT[k].name)}${A.INTERACT[k].cost ? " (" + A.INTERACT[k].cost + "⧗)" : ""}</button>`)).join("")}</div>`;
        const fo = A.favorOptions(pc, t);
        if (A.favorsOf(pc, t.id) && fo.length)
          h += `<div class="small" style="margin-top:6px"><b>Call in a favor:</b></div><div class="row" style="margin-top:4px">${fo.map(k => `<button class="small" data-a="favor" data-v="${t.id}|${k}" title="${UI.esc(A.FAVORS[k].desc)}">${UI.esc(A.FAVORS[k].name)}</button>`).join("")}</div>`;
        if (A.superior(pc) && A.superior(pc).id === t.id)
          h += `<div class="small" style="margin-top:8px"><b>Your superior.</b> ${UI.bossButtons()}</div>`;
      }
    } else if (t.alive && pc.alive)
      h += `<div class="row"><span class="small ink2 grow">You know who ${A.he(t)} is, but you do not know ${A.him(t)}. Whether you ever will is up to you.</span><button class="primary small" data-a="know" data-v="${t.id}" ${A.S.time >= (A.knowCost || 1) ? "" : "disabled"}>Get to know ${UI.esc(A.him(t))} (1⧗)</button></div>`;
  return h + "</div>";
};

UI.staffSel = {};

UI.staffCard = function (pc, only) {
  if (!A.staffSlots) return "";
  let slots = A.staffSlots(pc);
  if ((only && (slots = slots.filter(s => only.includes(s.type))), !slots.length)) return "";
  const many = slots.length > 7 && !UI.staffAll,
    shown = many ? slots.slice(0, 7) : slots;
  let h = `<div class="card staff"><div class="row">${UI.icon("users", "s")}<span class="tag">Your staff</span><span class="tiny muted grow">Choose who stands directly under you — or delegate the choice to the officer above that post. Their skill is what the post does.</span></div>`;
  for (const s of shown) {
    const cur = A.staffHolder(pc, s.key),
      deleg = (pc.staff || {})[s.key] === "deleg",
      par = A.STAFF_PARENT[s.type] ? A.staffDelegateTo(pc, s) : null,
      canDeleg = !!A.STAFF_PARENT[s.type],
      cands = A.staffCands(pc, s),
      sel = UI.staffSel[s.key] || (cands[0] && cands[0].p.id) || "",
      scoreOf = p => Math.round(A.skill(p, s.skill) * 0.65 + A.skill(p, s.s2) * 0.35);
    h += `<div class="st-slot"><div class="st-head"><b>${UI.esc(s.label)}</b><span class="tiny muted">${UI.esc(s.eff)} <i>(${UI.esc(GD.SKILLS[s.skill] || s.skill)} and ${UI.esc(GD.SKILLS[s.s2] || s.s2)})</i></span></div>`;
    if (cur)
      h += `<div class="st-cur"><span class="click" data-a="ov" data-v="person:${cur.id}">${PORTRAIT.svg(cur, 30)}</span><div class="grow"><span class="small click" data-a="ov" data-v="person:${cur.id}"><b>${UI.esc(A.fullName(cur, false))}</b></span>${deleg ? ` <span class="chip">chosen by ${UI.esc(par ? par.given : "the service")}</span>` : ""}<div class="tiny muted">fit for the post: <b>${scoreOf(cur)}</b> · ${UI.esc(UI.cmdWord(A.cmdWorth(cur)))}</div></div>${UI.tierChip(cur, true)}</div>`;
    else
      h += `<div class="st-cur empty tiny muted">${deleg ? "Delegated — " + UI.esc(par ? par.given : "the service") + " will choose within the month." : "Vacant. " + (s.type === "div" ? "You lead it yourself until you appoint someone." : "The post does nothing until it is filled.")}</div>`;
    h += `<div class="st-ctl"><select data-c="staffSel" data-k="${s.key}" aria-label="Candidate for ${UI.esc(s.label)}">${cands.map(c => `<option value="${c.p.id}" ${c.p.id === sel ? "selected" : ""}>${UI.esc(A.fullName(c.p, false))} — fit ${c.score} · ${UI.esc(A.tierOf(A.fightWorth(c.p)).n)}${c.known ? " · known" : ""}</option>`).join("")}</select><button class="small primary" data-a="staffAppoint" data-v="${s.key}" ${cands.length ? "" : "disabled"}>Appoint</button>${canDeleg ? `<button class="small" data-a="staffDelegate" data-v="${s.key}" title="${par ? UI.esc(par.given) + " picks — by skill, but favoring friends" : "Let the service pick"}" ${deleg ? "disabled" : ""}>Delegate</button>` : ""}</div></div>`;
  }
  if (many) h += `<button class="small ghost" data-a="staffAll">Show all ${slots.length} posts</button>`;
  return h + "</div>";
};

Object.assign(UI.C, {
  staffSel(el) {
    UI.staffSel[el.dataset.k] = el.value;
  },
});

Object.assign(UI.A, {
  staffAppoint(v) {
    const pid = UI.staffSel[v] || (UI.$(`select[data-k="${v}"]`) || {}).value,
      r = A.staffAppoint(v, pid);
    UI.toast(r.msg || "");
    UI.refresh();
  },
  staffDelegate(v) {
    const r = A.staffDelegate(v);
    UI.toast(r.msg || "");
    UI.refresh();
  },
  staffAll() {
    UI.staffAll = true;
    UI.refreshTab();
  },
});

UI.drillCard = function (pc) {
  const d = A.myUnit && A.myUnit(pc);
  if (!d) return "";
  const D = pc.mil.drill || {
      focus: "formation",
      hard: 1,
    },
    cap = 0.5 + (0.6 + A.skill(pc, "command") / 160 + A.staffBonus(pc, "drill") + (pc.mil.rank >= 6 ? 0.2 : 0)) * 0.5,
    share = A.drillShare(pc),
    fight = d.atk != null || (A.S.fights || {})[d.loc] || (d.path && d.path.length),
    rv = A.S.dcool && A.S.dcool.review != null ? 90 - (A.absDay() - A.S.dcool.review) : 0;
  return `<div class="card drill"><div class="row">${UI.icon("flag", "s")}<span class="tag">The drill yard</span><b class="grow">${UI.esc(d.name)}</b><span class="tiny muted">you drill ${A.fmt(Math.min(d.men, GD.MIL[pc.mil.rank].leads))} of ${A.fmt(d.men)} men</span></div>
    <div class="dr-focus" role="group" aria-label="Drill focus">${Object.entries(GD.DRILLS)
      .map(
        ([k, X]) =>
          `<button class="small ${D.focus === k ? "on" : ""}" aria-pressed="${D.focus === k}" data-a="drillFocus" data-v="${k}" title="${UI.esc(X.d)}">${UI.icon(X.ic, "s")}${UI.esc(X.name.replace(/ drill$/, ""))}</button>`,
      )
      .join("")}</div>
    <div class="small ink2">${UI.esc(GD.DRILLS[D.focus].d)}</div>
    <div class="row" style="margin-top:6px"><span class="tiny muted">How hard</span><div class="seg">${["Easy", "Steady", "Brutal"].map((n, i) => `<button class="small ${D.hard === i ? "on" : ""}" aria-pressed="${D.hard === i}" data-a="drillHard" data-v="${i}" title="${["Half the gain. The men stay fresh and like you.", "The usual.", "Faster gains and merit for you — but organization suffers, men get hurt, and some desert."][i]}">${n}</button>`).join("")}</div></div>
    <div class="dr-bars">${Object.entries(GD.DRILLS)
      .map(([k, X]) => {
        const own = (D.own || {})[k] || 0,
          div = (d.dr || {})[k] || 0,
          v = share >= 0.99 ? div : own;
        return `<div class="dr-b ${k === D.focus ? "on" : ""}" title="${UI.esc(X.name)}: your men ${Math.round(own * 100)} · the whole ${UI.esc(d.name)} ${Math.round(div * 100)}"><span>${UI.esc(X.short || X.name)}</span>${UI.bar(v, 1, k === D.focus ? "statbar" : "", cap)}<b>${Math.round(v * 100)}</b></div>`;
      })
      .join("")}</div>
    <div class="dr-exp"><span>Unit experience</span>${UI.bar(d.exp, 100, "", 35)}<b>${UI.esc(A.xpLevel(d.exp)[1])}</b></div>
    ${share < 0.99 ? `<div class="tiny muted">Bars show your own men. Across the whole ${UI.esc(d.name)} your drill counts for ${Math.round(share * 100)}% — commanders above you drill the rest.</div>` : ""}
    <div class="tiny muted">The tick on each bar is as far as your officers can teach (${Math.round(cap * 100)}): better sergeants and a sergeant-major raise it. Drill only takes the men to <i>Trained</i>; only war makes veterans. Edges you stop drilling slowly fade.${fight ? ' <b class="warn">The unit is marching or fighting — no drill today.</b>' : ""}</div>
    <div class="row" style="margin-top:6px"><button class="small" data-a="drillReview" ${A.S.time >= 1 && rv <= 0 ? "" : "disabled"} title="Show the men off to your superior: merit if it goes well">${UI.icon("eye", "s")}Hold a review (1⧗)</button>${rv > 0 ? `<span class="tiny muted">next review in ${rv} days</span>` : ""}</div></div>`;
};

Object.assign(UI.A, {
  drillFocus(v) {
    A.setDrill(v, null);
    UI.refreshTab();
  },
  drillHard(v) {
    A.setDrill(null, +v);
    UI.refreshTab();
  },
  drillReview() {
    const r = A.drillReview();
    UI.toast(r.msg || "");
    UI.refresh();
  },
});

UI.ordersCard = function (pc, compact) {
  if (!GD.ORDERS) return "";
  const list = Object.keys(GD.ORDERS)
    .map(id => A.orderSummary(id))
    .filter(s => s.r && s.r.alive)
    .sort((a, b) => b.pow - a.pow);
  if (!list.length) return "";
  const maxP = Math.max(1, ...list.map(s => s.pow)),
    myR = pc.mil && !pc.mil.merc ? pc.mil.realm : pc.realm,
    shown = list.filter((s, i) => !compact || i < 4 || (pc.order && pc.order.id === s.id) || s.o.realm === myR);
  let h = `<div class="card orders"><div class="row">${UI.icon("award", "s")}<span class="tag">The elite of Ardan</span><span class="tiny muted grow">Eight in all of Ardan, strongest first. Each is 200 to 300 strong, because no kingdom has more people good enough. Most realms have none.</span></div>`;
  for (const s of shown) {
    const mine = pc.order && pc.order.id === s.id,
      reqs = s.o.realm === myR && !pc.order ? A.orderReqs(pc, s.id) : null,
      kind = {
        order: "Knightly order",
        guard: "Royal guard",
        corps: "Picked corps",
      }[s.o.kind],
      traits = A.orderTraits(s.id);
    h += `<div class="ord ${mine ? "mine" : ""}"><div class="ord-ban" style="--rc:${s.r.color}"></div><div class="grow">
      <div class="row" style="gap:6px"><b class="ord-name">${UI.esc(A.cap(s.o.name))}</b><span class="chip">${UI.esc(kind)}</span><span class="tiny muted">${UI.esc(s.r.short)}</span>${mine ? '<span class="chip gold">your order</span>' : ""}${s.d && s.d.rebuild ? '<span class="chip red">rebuilding after heavy losses</span>' : ""}</div>
      <div class="ord-pow">${UI.bar(s.pow, maxP, "statbar")}<span class="tiny">${s.d ? `<b>${A.fmt(s.men)}</b> of ${A.fmt(s.full)} members · ${UI.esc(s.exp)}${s.likeMen ? ` · fights like ~${A.fmt(s.likeMen)} line soldiers` : ""}` : '<span class="bad">destroyed — rising again from the survivors</span>'}</span></div>
      <div class="tiny ink2">${UI.esc(s.o.spec)}</div>
      <div class="ord-traits">${traits.map(t => `<span class="chip">${UI.esc(t)}</span>`).join("")}</div>
      ${s.o.lore ? UI.orderLore(s.o) : ""}
      ${s.L ? `<div class="tiny" style="margin-top:2px">Led by <span class="click u" data-a="ov" data-v="person:${s.L.id}">${UI.esc(A.fullName(s.L, false))}</span>, ${UI.esc(A.orderLeadTitle(s.o))} — ${UI.esc(A.tierOf(s.leaderWorth).n)} fighter (${s.leaderWorth}), ${UI.esc(UI.cmdWord(s.leaderCmd))}</div>` : ""}
      ${reqs ? `<div class="tiny muted" style="margin-top:4px">What it takes to be one of them:</div><div class="reqs">${reqs.map(x => `<span class="req ${x.ok ? "ok" : "no"}">${x.ok ? "✓" : "✗"} ${UI.esc(x.label)}${x.have !== "" && !x.ok ? " (" + UI.esc(String(x.have)) + ")" : ""}</span>`).join("")}</div><button class="small ${reqs.every(x => x.ok) ? "primary" : ""}" data-a="orderJoin" data-v="${s.id}" ${reqs.every(x => x.ok) ? "" : "disabled"}>Ask to join</button>` : ""}
      ${mine ? `<div class="tiny">You are ${UI.esc(A.orderRankName(pc))}. Merit in the order: ${Math.round(pc.order.merit)}.</div><button class="small danger" data-a="orderLeave">Give back your vows</button>` : ""}
    </div></div>`;
  }
  if (compact && shown.length < list.length)
    h += `<div class="tiny muted">…and ${list.length - shown.length} more in the Codex (Power &amp; scale).</div>`;
  return h + "</div>";
};

UI.orderLore = function (o) {
  const L = o.lore,
    row = (k, v) => `<div class="lore-row"><b>${UI.esc(k)}</b><span>${UI.esc(v)}</span></div>`;
  return `<details class="ord-lore"><summary>Their story: the name, the oath, the trial</summary><div class="lore-body">
    ${row("The name", L.name)}${row("Founded", L.founded)}${row("The oath", L.oath)}${row("How you know them", L.marks)}${row("How they fight", L.war)}
    <div class="lore-row"><b>Deeds</b><span>${L.deeds.map(d => `<span class="lore-deed">${UI.esc(d)}</span>`).join("")}</span></div>
    ${row("Who gets in", L.join)}<div class="lore-row rt"><b>What people say</b><span>${UI.esc(L.rumor)}</span></div><div class="lore-row rt"><b>The truth</b><span>${UI.esc(L.truth)}</span></div></div></details>`;
};

Object.assign(UI.A, {
  orderJoin(v) {
    const r = A.orderJoin(v);
    UI.toast(r.msg || "");
    UI.refresh();
  },
  orderLeave() {
    UI.confirm({
      title: "Give back your vows?",
      text: "You leave the order. Some of your brothers will never look at you the same way again.",
      yes: "Leave the order",
      danger: true,
      run: () => A.orderLeave(),
    });
  },
});

UI.TAB.war = function (pc) {
  let h = UI.warTabClock(pc),
    add = "";
  if ((pc.mil && !pc.mil.merc) || pc.ruler)
    add += UI.staffCard(pc, [
      "file",
      "sgt",
      "lt",
      "sgtmaj",
      "coy",
      "second",
      "qm",
      "bat",
      "cos",
      "qmg",
      "scouts",
      "div",
      "army",
      "guard",
    ]);
  if (pc.mil) add += UI.drillCard(pc);
  add += UI.ordersCard(pc, true);
  const i = h.indexOf('<div class="group-h">Wars of your realm</div>');
  return i >= 0 ? h.slice(0, i) + add + h.slice(i) : h + add;
};

UI.shopSlot = "weapon";

UI.shopQ = "common";

UI.run = {
  dest: null,
  guards: false,
  buyBack: "",
};
