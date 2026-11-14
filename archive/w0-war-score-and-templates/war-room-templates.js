// The War Room's Templates tab and every player-facing template control, retired by W0 (D-052; owner order 34:
// "remove war score and army templates; I no longer am a fan of the HOI4 war system"). Cut verbatim from
// src/core/release/core/ (last commit with them: 39ee589). Templates stay inside the engine: every realm's divisions
// are still built from the default templates A.tplDefaults makes, and the yearly host review (56-court-and-treasury
// RI.fitHost) and A.wrAuto still recut them; only the player's designing, reorganising and doctrine choice are gone.

// ---- src/core/release/core/23-ui-c.js — UI.wrTabs: the Templates tab
    {
      k: "tpl",
      n: "Templates",
      ic: "pencil",
      lock: lockT && !(pc.mil && pc.mil.rank >= 6) ? lockT : null,
    },


// ---- src/core/release/core/23-ui-c.js — UI.wrDivButtons: "Reorganize as…" (a division moved to another template)
,
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

// ---- src/core/release/core/23-ui-d.js — UI.wrTemplates, UI.wrBnChip, UI.wrTplSummary, UI.wrTplEditor
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



// ---- src/core/release/core/23-ui-d.js — A.wrAdvice: the templates hint
,
    R2.templates &&
      r.forces.xp >= 25 &&
      out.push({
        ic: "pencil",
        t: `You have ${Math.floor(r.forces.xp)} army experience to spend on better division templates.`,
        a: "wrTab",
        v: "tpl",
        b: "Templates",
      }),

// ---- src/core/release/core/23-ui-d.js — UI.A: the template editor's actions
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


// ---- src/core/release/core/23-ui-d.js — UI.A.wrDoc: adopting an army doctrine (it sat in the Templates tab)
  wrDoc(v) {
    const r = A.fxAct("doc", v);
    UI.wr.msg = r.msg || "";
    UI.wrRedrawSide();
  },


// ---- src/core/release/core/23-ui-d.js — UI.C.wrDivTpl
  wrDivTpl(el) {
    if (!el.value) return;
    const r = A.fxAct("divTpl", {
      div: el.dataset.v,
      tpl: el.value,
    });
    UI.wr.msg = r.msg || "";
    UI.wrRefresh();
  },


// ---- src/core/release/core/23-ui-d.js — UI.C.wrTplName
  wrTplName(el) {
    if (UI.wr.tplEdit) UI.wr.tplEdit.name = el.value.slice(0, 28);
  },


// ---- src/core/release/core/10-companies-and-war-staff-b.js — A.fxAct: tplEdit, tplNew, tplDel, divTpl
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


// ---- src/core/release/core/10-companies-and-war-staff-b.js — A.fxAct: doc (adopting an army doctrine)
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

