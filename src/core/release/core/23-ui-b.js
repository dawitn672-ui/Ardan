// The release's core, ui (part 2 of 6): UI: the interface.
// Readable source of vendor/ardan-b593143.html with the patch layer baked in (X1, docs/DECISIONS.md D-027). Edit it here.
// Defines: UI.tipsInit, UI.TIPS.worth, UI.TIPS.worthBody, UI.TIPS.worthSkill, UI.TIPS.worthGear, UI.TIPS.stat,
// UI.HINTS, UI.hintUsed, UI.HINT_YEARS, UI.hintsOn, UI.hintSeen, UI.hintMark, UI.hintFor, UI.hintBox, UI.A (+),
// UI.hintNote, UI.TASKS, UI.pt, UI.ptAnswered, UI.ptStart, UI.ptSnap, UI.ptPaint, UI.ptFinish, UI.ptTick, UI.ICONS,
// UI.icon, UI.profBlock, UI.topProfs, UI.famCard, UI.famDetail, UI.crFamilyField, UI.SYS_OV, UI.renderModal,
// UI.modalA11y, UI.modalClosed, UI.trapFocus, UI.afterModalBasic, UI.queueModal, UI.eventModal, UI.duelModalBasic,
// UI.missionModal, UI.battleModalBasic, UI.campModal, UI.drawCamp, UI.travelModal, UI.deathModal, UI.namingModal,
// UI.ovModalBasic, UI.profileModal, UI.treeModal, UI.C (+), UI.techChip, UI.styleCard, UI.schoolModal,
// UI.duelTechBar, UI.mini, UI.check, UI.bondChip, UI.peopleBonds, UI.relGroups.court, and 4 more.

UI.tipsInit = function () {
  const later = () => {
    clearTimeout(UI.tipState.hideT);
    UI.tipState.hideT = setTimeout(() => {
      if (
        ![...document.querySelectorAll(":hover")].some(
          x => x.id === "tip1" || x.id === "tip2" || (x.dataset && x.dataset.tip),
        )
      )
        UI.tipHide(1);
    }, 220);
  };
  document.addEventListener("mouseover", e => {
    const a = e.target.closest && e.target.closest("[data-tip]");
    if (a) {
      const l = UI.tipLevel(a);
      if (l) {
        clearTimeout(UI.tipState.hideT);
        if (UI.tipState.open[l - 1] !== a) UI.tipShow(a, l);
      }
      return;
    }
    if (e.target.closest && e.target.closest(".tip-pop")) {
      clearTimeout(UI.tipState.hideT);
      return;
    }
    if (UI.tipState.open[0]) later();
  });
  document.addEventListener("click", e => {
    const a = e.target.closest && e.target.closest("[data-tip]");
    if (a && !a.closest("[data-a]")) {
      const l = UI.tipLevel(a);
      if (l) {
        if (UI.tipState.open[l - 1] === a && e.detail) UI.tipHide(l);
        else UI.tipShow(a, l);
      }
      return;
    }
    if (!(e.target.closest && e.target.closest(".tip-pop"))) UI.tipHide(1);
  });
  document.addEventListener(
    "keydown",
    e => {
      if (e.key === "Escape" && UI.tipState.open[0]) {
        const a2 = UI.tipState.open[1] || UI.tipState.open[0];
        UI.tipHide(UI.tipState.open[1] ? 2 : 1);
        if (a2) a2.focus();
        e.stopPropagation();
        return;
      }
      const a = e.target.dataset && e.target.dataset.tip ? e.target : null;
      if (a && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        const l = UI.tipLevel(a);
        if (l)
          if (UI.tipState.open[l - 1] === a) UI.tipHide(l);
          else {
            UI.tipShow(a, l);
            const first = UI.tipEl(l).querySelector("[data-tip]");
            if (first) first.focus();
          }
      }
    },
    true,
  );
  document.addEventListener("focusin", e => {
    if (!(e.target.closest && (e.target.closest(".tip-pop") || e.target.closest("[data-tip]")))) UI.tipHide(1);
  });
};

UI.TIPS.worth = function (pid) {
  const p = A.P(pid),
    W = A.worthParts && A.worthParts(p);
  if (!W) return "";
  const t = A.tierOf(W.total),
    row = (k, n, v, d) =>
      `<div class="tip-row">${UI.tip(k, pid, n)}<b>${v >= 0 ? "+" : ""}${v}</b></div><div class="tip-d">${d}</div>`;
  return `<div class="tip-h">Fighting worth <b>${W.total}</b> · ${UI.esc(t.n)}</div>
    ${row("worthBody", "Body", W.body, "Strength, speed, instincts, stamina and will, untrained and bare-handed.")}
    ${row("worthSkill", "Skill", W.skill, `What training adds: ${UI.esc(GD.SKILLS[W.skillK] || W.skillK)}${W.style ? " and " + UI.esc(W.style) : ""}.`)}
    ${row("worthGear", "Gear", W.gear, W.gearItems.length ? W.gearItems.map(x => UI.esc(x[1])).join(", ") : "Nothing: fists and clothes.")}
    <div class="tip-f">${UI.esc(t.d)}</div>`;
};

UI.TIPS.worthBody = function (pid) {
  const p = A.P(pid),
    W = A.worthParts(p),
    names = {
      str: "Strength",
      spd: "Speed",
      ins: "Combat instincts",
      sta: "Stamina",
      wil: "Willpower",
      int: "Intelligence",
    };
  return `<div class="tip-h">Body <b>${W.body}</b></div>${W.stats
    .filter(([k]) => k !== "int")
    .map(([k, v]) => `<div class="tip-row"><span>${names[k] || k}</span><b>${v}</b></div>`)
    .join("")}
    <div class="tip-f">Stamina also sets how long you can keep fighting a crowd: about ${A.crowdN(A.bodyCap(p))} regulars' worth before your wind goes.</div>`;
};

UI.TIPS.worthSkill = function (pid) {
  const p = A.P(pid),
    W = A.worthParts(p);
  return `<div class="tip-h">Skill <b>+${W.skill}</b></div><div class="tip-row"><span>${UI.esc(GD.SKILLS[W.skillK] || W.skillK)}</span><b>${A.skill(p, W.skillK)}</b></div><div class="tip-row"><span>Melee</span><b>${A.skill(p, "melee")}</b></div>${p.gear && p.gear.shield ? `<div class="tip-row"><span>Shield</span><b>${A.skill(p, "shield")}</b></div>` : ""}${W.style ? `<div class="tip-row"><span>${UI.esc(W.style)}</span><b>rank ${W.styleRank}</b></div>` : ""}<div class="tip-f">The weapon in your hand decides which skill counts.</div>`;
};

UI.TIPS.worthGear = function (pid) {
  const p = A.P(pid),
    W = A.worthParts(p);
  return `<div class="tip-h">Gear <b>+${W.gear}</b></div>${W.gearItems.length ? W.gearItems.map(([sl, n]) => `<div class="tip-row"><span>${UI.esc(A.cap(sl))}</span><b>${UI.esc(n)}</b></div>`).join("") : '<div class="tip-d">Nothing yet. The armorer in Holdings sells weapons and armor.</div>'}<div class="tip-f">Better quality adds more; heavy armor tires a weak body.</div>`;
};

UI.TIPS.stat = function (k) {
  const pc = A.pc(),
    D = {
      str: ["Strength", "Hits harder, carries armor. Grows with hard labor and the yard."],
      spd: ["Speed", "Strikes first, dodges. Grows with running and drills."],
      ins: ["Combat instincts", "Reads a fight. Grows with real fights and sparring."],
      sta: ["Stamina", "How long you last, and how many you can face at once. Grows with running and hard work."],
      int: ["Intelligence", "Learning, plans, trade. Grows with study."],
      wil: ["Willpower", "Keeps you standing. Grows through hardship and vigils."],
    }[k];
  return !D || !pc
    ? ""
    : `<div class="tip-h">${D[0]} <b>${Math.round(A.stat(pc, k))}</b> <span class="muted">of ${Math.round(pc.pot[k])} potential</span></div><div class="tip-d">${D[1]}</div><div class="tip-f">The tick on the bar is your potential: training past it is slow.</div>`;
};

// [X1 baked patch ui/59-descriptions TT-WORDS-NO-HOVER] UI: three lines of the release tell the player to hover
// (the map caption, the "Underlined words" hint, the help page). Nothing opens on hover any more, so they say
// press.
UI.HINTS = [
  {
    id: "whatnow",
    where: "life",
    text: "Not sure what to do? <b>What now</b> lists the three things most worth doing. One click does each.",
    done: () => UI.hintUsed.wn,
  },
  {
    id: "plan",
    where: "life",
    when: pc => A.age(pc) >= 4,
    text: "Your <b>plan</b> decides what your free hours build. Pick a training focus below: it grows a little every day.",
    done: pc => !!(A.plan(pc) || {}).train,
  },
  {
    id: "clock",
    where: "life",
    text: "Time is paused. Press <b>Play</b> at the top (or Space) and the days run until something needs you. <b>Next</b> jumps ahead.",
    done: () => UI.hintUsed.clock,
  },
  {
    id: "initiative",
    where: "life",
    when: pc => A.isAdult(pc) && A.S.time >= 1,
    text: "You have <b>initiative ⧗</b> to spend. It builds up over time; each action below costs some. Try one.",
    done: () => UI.hintUsed.act,
  },
  {
    id: "tips",
    where: "life",
    when: pc => A.isAdult(pc),
    text: "Underlined words explain themselves. Tap or click your <b>fighting worth</b> on the left (on a phone: Life → You) to see where it comes from.",
    done: () => UI.hintUsed.tip,
  },
  {
    id: "event",
    where: "event",
    text: "Each choice shows your <b>odds</b>. Your stats and skills set them. Number keys 1–6 choose too.",
  },
  {
    id: "people",
    where: "people",
    text: "Bonds matter: friends help, rivals plot. Open anyone to see them and do something together.",
    done: () => UI.hintUsed.person,
  },
  {
    id: "path",
    where: "path",
    text: "Every career is a ladder. The <b>doors</b> show where you can go from here, and what each one needs.",
  },
  {
    id: "war",
    where: "war",
    text: "Your realm's wars are here. The <b>War Room</b> shows the front, the armies and your orders.",
  },
  {
    id: "holdings",
    where: "holdings",
    text: "Coin buys gear, land and goods. Better gear adds to your fighting worth.",
  },
  {
    id: "chronicle",
    where: "legacy",
    text: "When you die you go on as your heir, with what they truly inherit. Raise children, or your story ends with you.",
  },
  {
    id: "save",
    where: "life",
    when: () => A.S.year >= 1107,
    text: "The game saves itself every year. <b>Menu → Export</b> keeps a copy as a file. <b>Menu → Report a problem</b> if something breaks.",
  },
];

UI.hintUsed = {};

UI.HINT_YEARS = 10;

UI.hintsOn = () => UI.set.hints !== false && A.S && A.S.year < 1105 + UI.HINT_YEARS;

UI.hintSeen = id => !!(UI.set.hintsSeen && UI.set.hintsSeen[id]);

UI.hintMark = function (id) {
  UI.set.hintsSeen = UI.set.hintsSeen || {};
  if (!UI.set.hintsSeen[id]) {
    UI.set.hintsSeen[id] = 1;
    UI.saveSettings();
  }
};

UI.hintFor = function (where, pc) {
  if (!UI.hintsOn() || !pc || !pc.alive) return null;
  for (const H of UI.HINTS)
    if (!(H.where !== where || UI.hintSeen(H.id))) {
      if (H.done && H.done(pc)) {
        UI.hintMark(H.id);
        continue;
      }
      if (!(H.when && !H.when(pc))) return H;
    }
  return null;
};

UI.hintBox = function (where, pc, float) {
  const H = UI.hintFor(where, pc);
  return H
    ? `<div class="hint${float ? " hint-float" : ""}" role="note" aria-label="Hint"><span class="hint-ic" aria-hidden="true">${UI.icon("sparkles", "s")}</span><span class="hint-t">${H.text}</span><button class="small ghost" data-a="hintDone" data-v="${H.id}">${H.done ? "Skip" : "Got it"}</button></div>`
    : "";
};

Object.assign(UI.A, {
  hintDone(v) {
    UI.hintMark(v);
    UI.refresh();
  },
  hintsToggle() {
    UI.set.hints = UI.set.hints === false;
    UI.saveSettings();
    UI.renderModal();
    UI.refreshTab();
  },
});

UI.hintNote = function (action) {
  if (action === "wn") UI.hintUsed.wn = 1;
  if (/^clk(Play|Skip|Toggle)$|^age$/.test(action)) UI.hintUsed.clock = 1;
  if (action === "act" || action === "planSession") UI.hintUsed.act = 1;
  if (action === "ov") UI.hintUsed.person = 1;
};

UI.TASKS = [
  {
    k: "start",
    t: "Start a new life of your own choosing",
    need: "title",
    done: () => UI.screen === "game" && A.pc() && A.pc().alive,
  },
  {
    k: "health",
    t: "Find out how healthy you are",
    manual: true,
  },
  {
    k: "train",
    t: "Choose something to train",
    done: () => {
      const pc = A.pc();
      return !!(pc && A.plan(pc).train);
    },
  },
  {
    k: "event",
    t: "Let time run until something happens, and answer it",
    done: S0 => A.S && !A.S.queue.length && S0.answered < UI.ptAnswered,
  },
  {
    k: "person",
    t: "Open the profile of someone in your family",
    done: () => UI.ov && UI.ov.type === "person",
  },
  {
    k: "work",
    t: "Find out what work you could do",
    done: () => UI.tab === "path",
  },
  {
    k: "war",
    t: "Find out whether your realm is at war",
    done: () => UI.tab === "war" || (UI.tab === "world" && UI.mapMode === "wars"),
  },
  {
    k: "map",
    t: "Look at the map of the world",
    done: () => UI.tab === "world",
  },
  {
    k: "save",
    t: "Save the game",
    done: S0 => (SAVES.lastSaveAt || 0) > S0.at,
  },
  {
    k: "text",
    t: "Make the text bigger",
    done: S0 => (UI.set.tx || 1) > S0.tx,
  },
];

UI.pt = null;

UI.ptAnswered = 0;

UI.ptStart = function () {
  UI.pt = {
    on: true,
    i: UI.screen === "title" ? 0 : 1,
    running: false,
    results: [],
    who: "",
  };
  UI.ptPaint();
};

UI.ptSnap = () => ({
  at: Date.now(),
  tx: UI.set.tx || 1,
  log: A.S ? A.S.log.length : 0,
  answered: UI.ptAnswered,
});

UI.ptPaint = function () {
  let bar = document.getElementById("ptbar");
  const P = UI.pt;
  if (!P || !P.on) {
    if (bar) bar.remove();
    return;
  }
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "ptbar";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Playtest");
    document.body.appendChild(bar);
  }
  const T = UI.TASKS[P.i];
  if (!T) {
    const ok = P.results.filter(r => r.ok).length;
    bar.innerHTML = `<b>Playtest finished</b> · ${ok}/${P.results.length} tasks done · <button class="small primary" data-a="ptSave">Download results</button> <button class="small" data-a="ptQuit">Close</button>`;
    return;
  }
  const s = P.running ? Math.round((Date.now() - P.t0) / 1e3) : 0;
  bar.innerHTML = `<span class="pt-n">Task ${P.i + 1} of ${UI.TASKS.length}</span> <b class="pt-t">${UI.esc(T.t)}</b> ${P.running ? `<span class="pt-time" aria-live="off">${s}s</span> <button class="small" data-a="ptDone">${T.manual ? "I found it" : "Done"}</button> <button class="small ghost" data-a="ptGiveUp">Give up</button>` : '<button class="small primary" data-a="ptGo">Start</button> <button class="small ghost" data-a="ptSkip">Skip</button>'} <button class="small ghost" data-a="ptQuit" aria-label="Stop the playtest">×</button>`;
};

UI.ptFinish = function (ok, how) {
  const P = UI.pt,
    T = UI.TASKS[P.i];
  P.results.push({
    task: T.k,
    text: T.t,
    ok,
    how,
    seconds: +((Date.now() - P.t0) / 1e3).toFixed(1),
    clicks: P.clicks,
    tab: UI.tab,
    screen: UI.screen,
    phone: UI.isPhone(),
  });
  P.running = false;
  P.i++;
  UI.ptPaint();
};

UI.ptTick = function (action, notClick) {
  const P = UI.pt;
  if (!P || !P.on || !P.running) return;
  if (!notClick && !/^pt/.test(action)) P.clicks++;
  const T = UI.TASKS[P.i];
  if (!T || T.manual) return;
  let done = false;
  try {
    done = !!T.done(P.snap);
  } catch {
    done = false;
  }
  if (done) UI.ptFinish(true, "auto");
};

// [X1 baked patch ui/84-top-bar TOP-PLAYTEST-GUARD] UI: the playtest bar's Start and Skip (ptGo, ptSkip) threw
// "Cannot read properties of null" when pressed with no playtest under way (its markup can outlive UI.pt, as in
// the War Room). With nothing to start or skip they now do nothing.
Object.assign(UI.A, {
  playtest() {
    UI.ov = null;
    UI.renderModal();
    UI.ptStart();
  },
  ptGo() {
    const P = UI.pt;
    if (!P || !UI.TASKS[P.i]) return;
    const T = UI.TASKS[P.i];
    if (T.need === "title" && UI.screen !== "title") {
      P.results.push({
        task: T.k,
        text: T.t,
        ok: null,
        how: "not at the title screen",
      });
      P.i++;
      UI.ptPaint();
      return;
    }
    P.running = true;
    P.t0 = Date.now();
    P.clicks = 0;
    P.snap = UI.ptSnap();
    UI.ptPaint();
    clearInterval(UI.ptTimer);
    UI.ptTimer = setInterval(() => {
      if (UI.pt && UI.pt.running) {
        const el = document.querySelector("#ptbar .pt-time");
        if (el) el.textContent = Math.round((Date.now() - UI.pt.t0) / 1e3) + "s";
        UI.ptTick("timer", true);
      }
    }, 1e3);
  },
  ptDone() {
    UI.ptFinish(true, "player");
  },
  ptGiveUp() {
    UI.ptFinish(false, "gave up");
  },
  ptSkip() {
    const P = UI.pt;
    if (!P || !UI.TASKS[P.i]) return;
    P.results.push({
      task: UI.TASKS[P.i].k,
      text: UI.TASKS[P.i].t,
      ok: null,
      how: "skipped",
    });
    P.i++;
    UI.ptPaint();
  },
  ptQuit() {
    clearInterval(UI.ptTimer);
    UI.pt = null;
    UI.ptPaint();
  },
  ptSave() {
    // [X1 baked patch core/78-playtest-log PTLOG-SAVE] Playtest readiness: the results file held only the ten timed
    // tasks. It now also holds what the player did in the session (controls used, events answered and how long each
    // was read, tabs, pauses, errors, where they stopped).
    const P = UI.pt,
      d = new Date(),
      out = {
        kind: "ardan-playtest",
        v: 1,
        at: d.toISOString(),
        build: (typeof window < "u" && window.ARDAN_BUILD) || "dev",
        screen: {
          w: window.innerWidth,
          h: window.innerHeight,
          phone: UI.isPhone(),
        },
        ua: navigator.userAgent,
        results: P.results,
        session: UI.ptLog && UI.ptLog.report ? UI.ptLog.report() : null,
      };
    UI.download(
      new TextEncoder().encode(JSON.stringify(out, null, 1)),
      `ardan_playtest_${d.toISOString().slice(0, 16).replace(/[:T]/g, "")}.json`,
      "application/json",
    );
  },
});

UI.ICONS = {
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />',
  sun: '<circle cx="12" cy="12" r="4" /> <path d="M12 2v2" /> <path d="M12 20v2" /> <path d="m4.93 4.93 1.41 1.41" /> <path d="m17.66 17.66 1.41 1.41" /> <path d="M2 12h2" /> <path d="M20 12h2" /> <path d="m6.34 17.66-1.41 1.41" /> <path d="m19.07 4.93-1.41 1.41" />',
  target: '<circle cx="12" cy="12" r="10" /> <circle cx="12" cy="12" r="6" /> <circle cx="12" cy="12" r="2" />',
  users:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /> <path d="M16 3.128a4 4 0 0 1 0 7.744" /> <path d="M22 21v-2a4 4 0 0 0-3-3.87" /> <circle cx="9" cy="7" r="4" />',
  hammer:
    '<path d="m15 12-9.373 9.373a1 1 0 0 1-3.001-3L12 9" /> <path d="m18 15 4-4" /> <path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172v-.344a2 2 0 0 0-.586-1.414l-1.657-1.657A6 6 0 0 0 12.516 3H9l1.243 1.243A6 6 0 0 1 12 8.485V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5" />',
  swords:
    '<polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" /> <line x1="13" x2="19" y1="19" y2="13" /> <line x1="16" x2="20" y1="16" y2="20" /> <line x1="19" x2="21" y1="21" y2="19" /> <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" /> <line x1="5" x2="9" y1="14" y2="18" /> <line x1="7" x2="4" y1="17" y2="20" /> <line x1="3" x2="5" y1="19" y2="21" />',
  coins:
    '<circle cx="8" cy="8" r="6" /> <path d="M18.09 10.37A6 6 0 1 1 10.34 18" /> <path d="M7 6h1v4" /> <path d="m16.71 13.88.7.71-2.82 2.82" />',
  crown:
    '<path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" /> <path d="M5 21h14" />',
  globe:
    '<circle cx="12" cy="12" r="10" /> <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /> <path d="M2 12h20" />',
  scroll:
    '<path d="M19 17V5a2 2 0 0 0-2-2H4" /> <path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3" />',
  "book-open":
    '<path d="M12 7v14" /> <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />',
  calendar:
    '<path d="M8 2v4" /> <path d="M16 2v4" /> <rect width="18" height="18" x="3" y="4" rx="2" /> <path d="M3 10h18" />',
  "map-pin":
    '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /> <circle cx="12" cy="10" r="3" />',
  hourglass:
    '<path d="M5 22h14" /> <path d="M5 2h14" /> <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" /> <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />',
  save: '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" /> <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" /> <path d="M7 3v4a1 1 0 0 0 1 1h7" />',
  menu: '<path d="M4 5h16" /> <path d="M4 12h16" /> <path d="M4 19h16" />',
  "chevron-right": '<path d="m9 18 6-6-6-6" />',
  x: '<path d="M18 6 6 18" /> <path d="m6 6 12 12" />',
  check: '<path d="M20 6 9 17l-5-5" />',
  "triangle-alert":
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /> <path d="M12 9v4" /> <path d="M12 17h.01" />',
  info: '<circle cx="12" cy="12" r="10" /> <path d="M12 16v-4" /> <path d="M12 8h.01" />',
  "zoom-in":
    '<circle cx="11" cy="11" r="8" /> <line x1="21" x2="16.65" y1="21" y2="16.65" /> <line x1="11" x2="11" y1="8" y2="14" /> <line x1="8" x2="14" y1="11" y2="11" />',
  "zoom-out":
    '<circle cx="11" cy="11" r="8" /> <line x1="21" x2="16.65" y1="21" y2="16.65" /> <line x1="8" x2="14" y1="11" y2="11" />',
  maximize:
    '<path d="M8 3H5a2 2 0 0 0-2 2v3" /> <path d="M21 8V5a2 2 0 0 0-2-2h-3" /> <path d="M3 16v3a2 2 0 0 0 2 2h3" /> <path d="M16 21h3a2 2 0 0 0 2-2v-3" />',
  house:
    '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /> <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />',
  flag: '<path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528" />',
  shield:
    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /> <circle cx="12" cy="7" r="4" />',
  star: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2" /> <path d="M7 11V7a5 5 0 0 1 10 0v4" />',
  landmark:
    '<path d="M10 18v-7" /> <path d="M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z" /> <path d="M14 18v-7" /> <path d="M18 18v-7" /> <path d="M3 22h18" /> <path d="M6 18v-7" />',
  heart:
    '<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />',
  sparkles:
    '<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" /> <path d="M20 2v4" /> <path d="M22 4h-4" /> <circle cx="4" cy="20" r="2" />',
  "arrow-right": '<path d="M5 12h14" /> <path d="m12 5 7 7-7 7" />',
  flame:
    '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />',
  handshake:
    '<path d="m11 17 2 2a1 1 0 1 0 3-3" /> <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" /> <path d="m21 3 1 11h-2" /> <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" /> <path d="M3 4h8" />',
  play: '<polygon points="6 3 20 12 6 21 6 3" />',
  pause: '<rect x="14" y="4" width="4" height="16" rx="1" /> <rect x="6" y="4" width="4" height="16" rx="1" />',
  "skip-forward": '<polygon points="5 4 15 12 5 20 5 4" /> <line x1="19" x2="19" y1="5" y2="19" />',
  "fast-forward": '<polygon points="13 19 22 12 13 5 13 19" /> <polygon points="2 19 11 12 2 5 2 19" />',
  "circle-help":
    '<circle cx="12" cy="12" r="10" /> <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /> <path d="M12 17h.01" />',
  eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /> <circle cx="12" cy="12" r="3" />',
  plus: '<path d="M5 12h14" /> <path d="M12 5v14" />',
  minus: '<path d="M5 12h14" />',
  factory:
    '<path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /> <path d="M17 18h1" /> <path d="M12 18h1" /> <path d="M7 18h1" />',
  package:
    '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" /> <path d="M12 22V12" /> <path d="m3.3 7 8.7 5 8.7-5" />',
  truck:
    '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /> <path d="M15 18H9" /> <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" /> <circle cx="17" cy="18" r="2" /> <circle cx="7" cy="18" r="2" />',
  layers:
    '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" /> <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" /> <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />',
  route:
    '<circle cx="6" cy="19" r="3" /> <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" /> <circle cx="18" cy="5" r="3" />',
  castle:
    '<path d="M22 20v-9H2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2Z" /> <path d="M18 11V4H6v7" /> <path d="M15 22v-4a3 3 0 0 0-3-3a3 3 0 0 0-3 3v4" /> <path d="M22 11V9" /> <path d="M2 11V9" /> <path d="M6 4V2" /> <path d="M18 4V2" /> <path d="M10 4V2" /> <path d="M14 4V2" />',
  pencil:
    '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /> <path d="m15 5 4 4" />',
  trash:
    '<path d="M3 6h18" /> <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /> <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />',
  tent: '<path d="M3.5 21 14 3" /> <path d="M20.5 21 10 3" /> <path d="M15.5 21 12 15l-3.5 6" /> <path d="M2 21h20" />',
  "rotate-ccw": '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /> <path d="M3 3v5h5" />',
  crosshair:
    '<circle cx="12" cy="12" r="10" /> <line x1="22" x2="18" y1="12" y2="12" /> <line x1="6" x2="2" y1="12" y2="12" /> <line x1="12" x2="12" y1="6" y2="2" /> <line x1="12" x2="12" y1="22" y2="18" />',
};

UI.icon = function (name, cls) {
  const d = UI.ICONS[name];
  return d ? `<svg class="ic ${cls || ""}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${d}</svg>` : "";
};

UI.profBlock = function (p, opts = {}) {
  let h = '<div class="profs">';
  for (const [cat, ks] of Object.entries(GD.SKILL_CATS)) {
    const rows = ks
      .map(k => [k, A.skill(p, k)])
      .filter(([k, v]) => opts.all || v >= 1 || (p.apt && p.apt[k] && p.apt[k] !== 1));
    if (rows.length) {
      h += `<div class="pcat group-h">${cat}</div>`;
      for (const [k, v] of rows.sort((a, b) => b[1] - a[1])) {
        const apt = p.apt && p.apt[k],
          an = apt ? GD.aptName(apt) : "",
          perks = A.perksOf(p, k);
        h += `<div class="prow" title="${UI.esc(GD.SKILL_DESC[k] || "")}"><span>${UI.esc(GD.SKILLS[k])} ${an ? `<span class="apt ${apt < 1 ? "bad" : ""}">${apt >= 1 ? "★" : "▽"} ${an}</span>` : ""}</span><b>${v}</b><span class="tier">${GD.profTier(v)}</span><div class="bar"><i style="width:${v}%"></i></div></div>`;
        if (perks.length && !opts.compact)
          h += `<div>${perks.map(x => `<span class="perk" title="${UI.esc(x[2])}">${UI.esc(x[1])}</span>`).join("")}</div>`;
      }
    }
  }
  return h + "</div>";
};

UI.topProfs = function (p, n = 5) {
  const rows = Object.keys(p.skills || {})
    .map(k => [k, A.skill(p, k)])
    .filter(x => x[1] >= 1 && GD.SKILLS[x[0]])
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
  return rows.length
    ? '<div class="profs">' +
        rows
          .map(([k, v]) => {
            const apt = p.apt && p.apt[k];
            return `<div class="prow" title="${UI.esc(GD.SKILL_DESC[k] || "")}"><span>${UI.esc(GD.SKILLS[k])}${apt >= 1.2 ? ' <span class="apt">★</span>' : ""}</span><b>${v}</b><span class="tier">${GD.profTier(v)}</span><div class="bar"><i style="width:${v}%"></i></div></div>`;
          })
          .join("") +
        "</div>"
    : '<div class="tiny muted">No proficiencies yet. Practice something.</div>';
};

UI.famCard = function (h, sel, act) {
  const F = A.famData(h.id),
    D = LORE.houseDeep && LORE.houseDeep[h.id],
    hh = A.house(h.id) || h,
    kind = F ? F.kind : A.FAM_KIND[h.kind] || h.kind,
    bl = A.houseBloodline(h.id),
    desc = F ? F.reputation : (D && D.y1105) || h.notes || "";
  return `<div class="card opt click ${sel ? "sel" : ""}" data-a="${act || "crSet"}" data-v="house:${h.id}"><div class="famcard">${PORTRAIT.coat(hh, 40)}<div><div class="t">${UI.esc(h.name)}</div><div class="tiny muted">${UI.esc(F ? F.rank : A.FAM_KIND_NAME[kind] || "")} · ${UI.esc(F ? F.title : h.title || "")}${(F ? F.seat : h.seat) ? " · " + UI.esc(F ? F.seat : h.seat) : ""}</div>${F && F.military ? `<div class="tiny" style="color:#d8b25e">⚔ ${UI.esc(F.military.office)}</div>` : ""}${bl ? `<span class="chip blood">${UI.esc(GD.BLOOD[bl.id] ? GD.BLOOD[bl.id].short : bl.name)}</span>` : ""}<div class="d">${UI.esc(String(desc).slice(0, 130))}</div></div></div></div>`;
};

UI.famDetail = function (hid, close) {
  const h = A.house(hid) || LORE.houses[hid];
  if (!h) return `<div class="panel mbox">${close || ""}<p>Unknown family.</p></div>`;
  const F = A.famData(hid),
    D = LORE.houseDeep && LORE.houseDeep[hid];
  let s = `<div class="panel mbox wide">${close || ""}<div class="row" style="gap:12px;align-items:flex-start">${PORTRAIT.coat(h, 70)}<div class="grow"><h2 style="margin:0">${UI.esc(h.name)}</h2><div class="ink2">${UI.esc(F ? F.rank + " · " + F.title : h.title || "")}${(F ? F.seat : h.seat) ? " · seat: " + UI.esc(F ? F.seat : h.seat) : ""} · ${UI.esc(A.realmName(h.realm))}</div>`;
  const words = F ? F.words : D && D.words;
  if (words) s += `<div class="lore-text">"${UI.esc(words)}"</div>`;
  const arms = F ? F.arms : D && D.arms;
  if ((arms && (s += `<div class="tiny muted">Arms: ${UI.esc(arms)}</div>`), (s += "</div></div>"), F)) {
    s += `<div class="kv small" style="margin-top:6px"><div>Since</div><div>${F.since} AR</div><div>Wealth</div><div>${"◆".repeat(F.wealth)}${"◇".repeat(5 - F.wealth)}</div><div>Renown</div><div>${F.fame}</div><div>Power</div><div>${UI.esc(F.power)}</div>${F.liege ? `<div>Liege</div><div>${UI.esc((A.house(F.liege) || {}).name || "")}</div>` : ""}<div>Reputation</div><div>${UI.esc(F.reputation)}</div><div>Talents</div><div>${F.apt.map(k => UI.esc(GD.SKILLS[k])).join(", ")}</div></div>`;
    if (F.military)
      s += `<div class="card" style="margin-top:6px"><b>⚔ ${UI.esc(F.military.office)}</b><div class="small">${UI.esc(F.military.unit)}. ${UI.esc(F.military.ties)}</div><div class="tiny muted">Sons and daughters usually reach ${UI.esc(GD.MIL[F.military.rank].title)}. Born into this family you start higher in the realm's army, promote faster, and draw a family allowance while you serve.</div></div>`;
    s += `<div class="group-h">History</div><div class="lore-text">${UI.esc(F.history)}</div>`;
    s += `<div class="group-h">The family in ${A.S ? A.S.year : 1105}</div>`;
    const ms =
      A.S && A.S.houses[hid] && A.S.houses[hid].members ? A.S.houses[hid].members.map(A.P).filter(Boolean) : null;
    if (ms)
      s += ms
        .map(
          p =>
            `<div class="card click small" data-a="ov" data-v="person:${p.id}"><b>${UI.esc(A.fullName(p))}</b> ${p.alive ? "(" + A.age(p) + ")" : "†" + p.died} — ${UI.esc(p.famRole || p.occ || "")}<div class="tiny muted">${UI.esc(p.famNote || "")}</div></div>`,
        )
        .join("");
    else
      s += F.members
        .map(
          m =>
            `<div class="card small"><b>${UI.esc(m.given)} ${UI.esc(F.sur)}</b> (${(A.S ? A.S.year : 1105) - m.born}) — ${UI.esc(m.role)}<div class="tiny muted">${UI.esc(m.note)}</div></div>`,
        )
        .join("");
    if (F.famousDead && F.famousDead.length)
      s += `<div class="group-h">Famous dead</div>${F.famousDead.map(d => `<div class="small"><b>${UI.esc(d[0])}</b> (${UI.esc(d[1])}): ${UI.esc(d[2])}</div>`).join("")}`;
    const nm = ids =>
      (ids || [])
        .map(x => (A.house(x) || LORE.houses[x] || {}).name)
        .filter(Boolean)
        .join(", ");
    if ((F.allies || []).length || (F.rivals || []).length)
      s += `<div class="small" style="margin-top:6px">${F.allies && F.allies.length ? "<b>Allies:</b> " + UI.esc(nm(F.allies)) + ". " : ""}${F.rivals && F.rivals.length ? "<b>Rivals:</b> " + UI.esc(nm(F.rivals)) + "." : ""}</div>`;
    if (A.pc() && A.pc().house === hid && F.secret)
      s += `<div class="card" style="margin-top:6px"><b>What the family does not say aloud</b><div class="small">${UI.esc(F.secret)}</div></div>`;
  } else if (D) {
    if (D.y1105) s += `<div class="lore-text" style="margin-top:6px">${UI.esc(D.y1105)}</div>`;
    s += `<div class="kv small" style="margin-top:6px">${D.founded ? `<div>Founded</div><div>${UI.esc(D.founded)}${D.founder ? " by " + UI.esc(D.founder) : ""}</div>` : ""}${D.power ? `<div>Power</div><div>${UI.esc(D.power)}</div>` : ""}${D.bloodline ? `<div>Bloodline</div><div>${UI.esc(D.bloodline)}</div>` : ""}${D.allies ? `<div>Allies</div><div>${UI.esc(D.allies)}</div>` : ""}${D.rivals ? `<div>Rivals</div><div>${UI.esc(D.rivals)}</div>` : ""}</div>`;
    if (D.history) s += `<div class="group-h">History</div><div class="lore-text small">${UI.esc(D.history)}</div>`;
    if (D.dead)
      s += `<div class="group-h">Famous dead</div>${D.dead.map(d => `<div class="small">${UI.esc(d)}</div>`).join("")}`;
    if (D.marriages)
      s += `<div class="group-h">Marriages</div>${D.marriages.map(d => `<div class="small">${UI.esc(d)}</div>`).join("")}`;
    if (A.pc() && A.pc().house === hid && D.secrets)
      s += `<div class="card" style="margin-top:6px"><b>Secrets of the house</b><div class="small">${UI.esc(D.secrets)}</div></div>`;
  } else s += `<p class="small">${UI.esc(h.notes || "")}</p>`;
  const vs = A.S ? Object.values(A.S.houses).filter(x => x.liege === hid) : [];
  if (vs.length)
    s += `<div class="group-h">Sworn to this house (${vs.length})</div><div class="famlist" tabindex="0" role="group" aria-label="Families">${vs.map(x => `<div class="card click small" data-a="ov" data-v="house:${x.id}"><div class="famcard">${PORTRAIT.coat(x, 30)}<div><b>${UI.esc(x.name)}</b><div class="tiny muted">${UI.esc(x.rank || x.title || "")}</div></div></div></div>`).join("")}</div>`;
  return s + "</div>";
};

UI.crFamilyField = function (c) {
  const list = c.status === "royal" ? A.housesFor(c.realm, "royal", c.race) : A.familiesFor(c.realm, c.status, c.race);
  if (!list.length)
    return c.status === "noble" || c.status === "royal"
      ? ""
      : `<div class="field"><label>Family</label><div class="small muted">No notable ${UI.esc(GD.STATUS[c.status].name.toLowerCase())} families here — you will be born into an ordinary one.</div></div>`;
  const kinds = [...new Set(list.map(f => (A.famData(f.id) || {}).kind || "great"))],
    filt = UI.crFamFilter && kinds.includes(UI.crFamFilter) ? UI.crFamFilter : "all",
    shown = list.filter(f => filt === "all" || ((A.famData(f.id) || {}).kind || "great") === filt);
  let h = `<div class="field"><label>Family <span class="muted small">(${list.length} to choose from — your surname comes from them)</span></label>`;
  // [X1 baked patch ui/84-top-bar TOP-FAMFILTER-PRESSED] UI: the creation screen's family filter showed the current
  // choice only by colour. Each button now carries aria-pressed, so "All" reads as chosen when it is to a screen
  // reader. (A class "on" as well made 71-phone's stylesheet restyle it on the desktop: phoneDesktopSame.)
  if (kinds.length > 1)
    h += `<div class="famfilter"><button class="small ${filt === "all" ? "primary" : ""}" data-a="crFamFilter" data-v="all" aria-pressed="${filt === "all"}">All</button>${kinds.map(k => `<button class="small ${filt === k ? "primary" : ""}" data-a="crFamFilter" data-v="${k}" aria-pressed="${filt === k}">${UI.esc(k === "great" ? "Great houses" : A.FAM_KIND_NAME[k] || k)}</button>`).join("")}</div>`;
  h += '<div class="famlist" tabindex="0" role="group" aria-label="Families">';
  if (c.status !== "noble" && c.status !== "royal")
    h += `<div class="card opt click ${c.house ? "" : "sel"}" data-a="crSet" data-v="house:"><div class="t">An ordinary family</div><div class="d">Nobody has heard of you. No help, no expectations. Everything you get, you earn.</div></div>`;
  h += shown.map(f => UI.famCard(f, c.house === f.id)).join("");
  h += "</div>";
  if (c.house)
    h += `<div class="row" style="margin-top:4px"><button class="small" data-a="ov" data-v="house:${c.house}">Read about this family ▸</button></div>`;
  return h + "</div>";
};

UI.SYS_OV = ["menu", "report", "help"];

UI.renderModal = function () {
  let m = UI.$("#modal");
  const S = A.S;
  let html = "",
    prompt = false;
  // [X1 baked patch core/88-skip-dropped-events QHEAD-MODAL] UI: renderModal drew S.queue[0] as it stood, so an
  // event whose view the engine had marked to skip (setup gave up, or a token stayed unfilled) showed with raw
  // {tokens} until the next tick removed it.
  if (UI.screen === "game" && S) {
    const q = UI.queueHead ? UI.queueHead() : S.queue[0];
    if (UI.ov && UI.SYS_OV.includes(UI.ov.type)) html = UI.ovModal(UI.ov);
    else {
      if (q) {
        html = UI.queueModal(q);
        prompt = !!html;
      } else {
        if (S.pendingName && S.pendingName.length) html = UI.namingModal();
        else {
          if (UI.ov) html = UI.ovModal(UI.ov);
        }
      }
    }
  } else if (UI.ov) html = UI.ovModal(UI.ov);
  if (!html) {
    if (m) {
      m.remove();
      UI.modalClosed();
    }
    return;
  }
  const opening = !m;
  if ((m || ((m = document.createElement("div")), (m.id = "modal"), document.body.appendChild(m)), opening)) {
    const a = document.activeElement;
    UI.modalReturn =
      a && a !== document.body
        ? {
            el: a,
            sel: a.id
              ? "#" + a.id
              : a.dataset && a.dataset.a
                ? `[data-a="${a.dataset.a}"]${a.dataset.v != null ? `[data-v="${a.dataset.v}"]` : ""}`
                : null,
          }
        : null;
  }
  const q0 = prompt && A.S.queue[0];
  m.innerHTML =
    html +
    (q0 && q0.type === "event" && UI.hintBox ? UI.hintBox("event", A.pc(), true) : "") +
    (prompt
      ? '<button class="mreport" data-a="report" title="Report a problem with this" aria-label="Report a problem">⚑</button>'
      : "");
  UI.modalA11y(m);
  UI.afterModal();
};

UI.modalA11y = function (m) {
  m.setAttribute("role", "dialog");
  m.setAttribute("aria-modal", "true");
  const app = UI.$("#app");
  if (app) app.inert = true;
  const h = m.querySelector("h2, h3");
  if (
    (h
      ? (h.id || (h.id = "modal-title"), m.setAttribute("aria-labelledby", h.id), m.removeAttribute("aria-label"))
      : (m.removeAttribute("aria-labelledby"), m.setAttribute("aria-label", "Dialog")),
    !m.contains(document.activeElement))
  ) {
    const f = m.querySelector(
      '.choices button:not(:disabled), .actbtns button:not(:disabled), button.primary:not(:disabled), button:not(:disabled):not(.mreport), [tabindex="0"]',
    );
    if (f)
      f.focus({
        preventScroll: true,
      });
  }
};

UI.modalClosed = function () {
  const app = UI.$("#app");
  if (app) app.inert = false;
  const r = UI.modalReturn;
  UI.modalReturn = null;
  setTimeout(() => {
    if (UI.$("#modal")) return;
    let el = r && r.el && document.contains(r.el) ? r.el : null;
    if (!el && r && r.sel)
      try {
        el = document.querySelector(r.sel);
      } catch {
        el = null;
      }
    if (el && el.focus)
      el.focus({
        preventScroll: true,
      });
    else {
      const tb = UI.$("#tabbody");
      if (tb)
        tb.focus({
          preventScroll: true,
        });
    }
  }, 0);
};

UI.trapFocus = function (e) {
  if (e.key !== "Tab") return;
  const m = UI.$("#modal");
  if (!m) return;
  const f = [
    ...m.querySelectorAll(
      'button:not(:disabled), select:not(:disabled), input:not(:disabled), textarea, a[href], summary, [tabindex="0"]',
    ),
  ].filter(x => x.offsetParent !== null || x === document.activeElement);
  if (!f.length) return;
  const i = f.indexOf(document.activeElement);
  if (e.shiftKey && i <= 0) {
    e.preventDefault();
    f[f.length - 1].focus();
  } else {
    if (!e.shiftKey && (i === f.length - 1 || i < 0)) {
      e.preventDefault();
      f[0].focus();
    }
  }
};

UI.afterModalBasic = function () {
  const q = A.S && A.S.queue[0],
    dl = UI.$(".duellog");
  if (dl) dl.scrollTop = dl.scrollHeight;
  const ml = UI.$(".mlog");
  if (ml) ml.scrollTop = ml.scrollHeight;
  const bl = UI.$(".blog");
  if ((bl && (bl.scrollTop = bl.scrollHeight), q && q.type === "battle")) {
    const c = UI.$("#battlecv");
    if (c) UI.drawBattle(c, q.b);
  }
  if (q && q.type === "campaign") {
    const c = UI.$("#campmap");
    if (c) UI.drawCamp(c, q.c);
  }
  if (
    (q && q.type === "warroom" && UI.wrAttach(),
    (!q || q.type !== "warroom") && UI.wrStop && UI.wrStop(),
    UI.ov && UI.ov.type === "bigmap")
  ) {
    const c = UI.$("#bigmap");
    if (c) {
      MAP.draw(c, {
        allLabels: true,
        mode: UI.mapMode || "political",
        focus: UI.mapFocus ? UI.mapFocus() : null,
      });
      MAP.attach(c, {});
    }
  }
};

UI.queueModal = function (q) {
  switch (q.type) {
    case "event":
      return UI.eventModal(q);
    case "duel":
      return UI.duelModal(q.d);
    case "mission":
      return UI.missionModal(q.m);
    case "battle":
      return UI.battleModal(q.b);
    case "campaign":
      return UI.campModal(q.c);
    case "warroom":
      return UI.warRoomModal(q);
    case "choice":
      return `<div class="panel mbox"><h2>${UI.esc(q.title)}</h2><div class="mtext">${UI.esc(q.text)}</div><div class="choices">${q.options.map((o, i) => `<button data-a="qChoice" data-v="${i}">${UI.esc(o.t)}</button>`).join("")}</div></div>`;
    case "school":
      return UI.schoolModal();
    case "travel":
      return UI.travelModal();
    case "death":
      return UI.deathModal();
    case "msg":
      return `<div class="panel mbox"><h2>${UI.esc(q.title || "")}</h2><div class="mtext">${UI.esc(q.text || "")}</div><button class="primary" data-a="qClose">Continue</button></div>`;
    default:
      return '<div class="panel mbox"><p>Unknown prompt.</p><button data-a="qSkip">Continue</button></div>';
  }
};

UI.eventModal = function (q) {
  const v = A.eventView(q),
    pc = A.pc();
  let h = '<div class="panel mbox">';
  const who = q.ctx && q.ctx.pid ? A.P(q.ctx.pid) : null;
  // [X1 baked patch core/42-difficulty DIFF-ODDS] A choice showed its odds as a number only if the player turned
  // that on. Story now always shows the number, Realism only the words ("risky", "likely"), and Hard keeps the
  // player's setting (A.DIFF.showOdds).
  // [X1 baked patch people/89-fight-odds FO-BADGE] The event modal drew a badge only for a choice with odds (a check
  // or a group fight). A choice whose effect is a beast fight (fx.beast, or a function effect calling
  // A.startDuel/startDuelFront) had none, so the deadliest answer in the scene looked like the one without risk. It
  // now shows the fight's chance (UI.fightBadge, from c.fight set in A.eventView); a check whose outcome is a fight
  // shows both, the check's odds and then the fight's.
  if (
    ((h += '<div class="row" style="align-items:flex-start;gap:14px">'),
    who
      ? (h += `<div>${PORTRAIT.svg(who, 92)}</div>`)
      : q.ctx && q.ctx.beast && A.BEASTS[q.ctx.beast] && (h += `<div>${PORTRAIT.beast(q.ctx.beast, 92)}</div>`),
    (h += `<div class="grow"><h2>${UI.esc(v.title || A.cap(A.stage(pc) === "child" ? "Childhood" : "The year " + A.S.year))}</h2><div class="mtext">${UI.esc(v.text)}</div>${v.more ? `<details class="more"><summary>Read more</summary><div class="mtext">${UI.esc(v.more)}</div></details>` : ""}</div></div>`),
    q.result)
  ) {
    const cls = q.result.success === false ? "bad" : q.result.success ? "good" : "";
    h += `${q.result.text ? `<div class="result ${cls}">${UI.esc(q.result.text)}</div>` : ""}<button class="primary" data-a="evClose">Continue</button>`;
  } else
    h += `<div class="choices">${v.choices.map((c, i) => `<button data-a="evChoose" data-v="${i}"><span class="grow">${UI.esc(c.t)}</span>${c.odds != null && (A.DIFF ? A.DIFF.showOdds() : UI.set.odds) ? `<span class="risk ${c.risk === "long odds" ? "long" : c.risk === "risky" ? "risky" : c.risk === "likely" ? "likely" : ""}">${c.odds}% · ${c.risk}</span>${c.fight && UI.fightBadge ? UI.fightBadge(c) : ""}` : c.odds != null ? `<span class="risk">${c.risk}</span>${c.fight && UI.fightBadge ? UI.fightBadge(c) : ""}` : c.fight && UI.fightBadge ? UI.fightBadge(c) : ""}</button>`).join("")}</div>`;
  return h + "</div>";
};

UI.duelModalBasic = function (D) {
  const pc = A.pc(),
    foe = D.b.pid ? A.P(D.b.pid) : null,
    left = `<div class="fighter">${PORTRAIT.svg(pc, 150)}<div class="fname">${UI.esc(A.fullName(pc, false))}</div><div class="tiny muted">${UI.esc(D.a.weapon)}${D.a.prot ? " · armor " + D.a.prot : ""}</div>
    ${UI.barRow("Blood", Math.max(0, D.a.hp), D.a.maxHp, "hpbar", null, Math.max(0, Math.round(D.a.hp)))}${UI.barRow("Wind", 100 - D.a.fat, 100, "fatbar", null, Math.round(100 - D.a.fat))}${D.a.adapt > 0.5 ? UI.barRow("Adapting", Math.min(D.a.adapt, 30), 30, "adbar", null, "+" + Math.round(D.a.adapt)) : ""}</div>`,
    right = `<div class="fighter">${D.b.beast ? PORTRAIT.beast(D.b.beast, 150) : PORTRAIT.svg(foe, 150)}<div class="fname">${UI.esc(D.b.name)}</div><div class="tiny muted">${UI.esc(D.b.beast ? (LORE.creatures.find(c => c.id === D.b.beast) || {}).size || "" : D.b.weapon)}</div>
    ${UI.barRow("Blood", Math.max(0, D.b.hp), D.b.maxHp, "hpbar", null, Math.max(0, Math.round(D.b.hp)))}${UI.barRow("Wind", 100 - D.b.fat, 100, "fatbar", null, Math.round(100 - D.b.fat))}${D.b.adapt > 0.5 ? UI.barRow("Adapting", Math.min(D.b.adapt, 30), 30, "adbar", null, "+" + Math.round(D.b.adapt)) : ""}</div>`;
  let mid = `<div class="mid"><h2 style="text-align:center">${UI.esc(D.title || (D.kind === "spar" ? "A bout" : D.kind === "beast" ? "The hunt" : "Steel"))}</h2>
    <div class="center small muted">${UI.esc(D.place)} · ${UI.esc(D.light)}${D.ground !== "open" ? " · " + UI.esc(D.ground) : ""}${D.lethal && D.kind !== "spar" && D.kind !== "tourney" ? ' · <span class="bad">to the death</span>' : ' · <span class="good">not to the death</span>'}</div>
    <div class="duellog">${D.log.map(l => `<p>${UI.esc(l)}</p>`).join("")}</div>`;
  if (D.over)
    mid += `<div class="result ${D.result === "win" || D.result === "beastfled" ? "good" : D.result === "lose" ? "bad" : ""}">${UI.esc((D.summary || []).join(" ") || "It is over.")}</div><button class="primary" data-a="duelClose">Continue</button>`;
  else {
    if (D.readHint)
      mid += `<div class="read">Your instincts (${D.readHint.conf}% sure): ${UI.esc(D.b.beast ? "it" : D.b.short)} — ${UI.esc(D.readHint.text)}.</div>`;
    mid += `<div class="actbtns">${["strike", "feint", "guard", "press", "grapple"].map((k, i) => `<button data-a="duel" data-v="${k}" title="${UI.esc(A.ACTIONS[k].desc)}"><span class="key">${i + 1}</span>${A.ACTIONS[k].name}<small>${UI.esc(A.ACTIONS[k].desc.split(".")[0])}</small></button>`).join("")}</div>
      <div class="row" style="margin-top:6px">${D.b.beast ? "" : '<button class="small" data-a="duel" data-v="yield">Yield</button>'}<button class="small" data-a="duel" data-v="flee">Flee</button><span class="right"></span><button class="small" data-a="duelAuto">Fight on instinct (auto)</button></div>`;
  }
  mid += "</div>";
  return `<div class="panel mbox wide"><div class="duel">${left}${mid}${right}</div></div>`;
};

UI.missionModal = function (m) {
  const pc = A.pc();
  let h = `<div class="panel mbox wide"><h2>${UI.esc(m.title)}</h2>`;
  h += `<div class="stages">${m.stages.map((s, i) => `<i class="${i < m.stage ? "done" : i === m.stage && !m.over ? "now" : ""}"></i>`).join("")}</div>`;
  const sq = A.squad(pc);
  if (sq.length)
    h += `<div class="squad">${sq.map(c => `<span class="m" title="${UI.esc(c.quirk || "")}">${PORTRAIT.svg(c, 22)}${UI.esc(c.given)}</span>`).join("")}</div>`;
  if (m.log.length)
    h += `<div class="mlog">${m.log.map(l => `<p class="${l.startsWith("»") ? "ch" : ""}">${UI.esc(l)}</p>`).join("")}</div>`;
  const cur = m.over ? null : m.cur || A.missionView(m);
  if (m.over || !cur) h += '<button class="primary" data-a="mClose">Continue</button>';
  else
    h += `<div class="mtext">${UI.esc(cur.text)}</div><div class="choices">${cur.choices.map((c, i) => `<button data-a="mChoose" data-v="${i}"><span class="grow">${UI.esc(c.t)}</span><span class="risk ${c.odds >= 70 ? "likely" : c.odds < 35 ? "long" : c.odds < 50 ? "risky" : ""}">${UI.set.odds ? c.odds + "% · " : ""}${UI.esc(c.check.map(k => GD.STAT_SHORT[k] || GD.SKILLS[k]).join(" + "))}</span></button>`).join("")}</div>
      <div class="row" style="margin-top:8px"><span class="right"></span><button class="small" data-a="mAuto">Let your sergeant decide (auto)</button></div>`;
  return h + "</div>";
};

UI.battleModalBasic = function (B) {
  const side = B.pcSide,
    me = B.sides[side],
    en = B.sides[side === "A" ? "B" : "A"],
    live = s => s.units.filter(u => u.status === "ok" || u.status === "shaken").reduce((a, u) => a + u.men, 0);
  let h = `<div class="panel mbox full"><div class="row"><h2 style="margin:0">${UI.esc(B.title)}</h2><span class="small muted">${UI.esc(A.cap(B.terr))} · ${UI.esc(B.weather)} · ${B.phase === "deploy" ? "deployment" : B.phase === "end" ? "over" : "pulse " + B.pulse + " of " + B.maxPulses}</span></div>`;
  if (
    ((h += `<div class="battle"><div class="col" style="min-height:0"><canvas id="battlecv" width="900" height="460"></canvas>
    <div class="row small"><span style="color:${me.color}">■</span> <b>${UI.esc(me.name)}</b> ${A.fmt(live(me))} / ${A.fmt(me.men0)} <span class="muted">(morale ${Math.round(A.avgMorale(B, side))})</span><span class="right"></span><span style="color:${en.color}">■</span> <b>${UI.esc(en.name)}</b> ${A.fmt(live(en))} / ${A.fmt(en.men0)} <span class="muted">(morale ${Math.round(A.avgMorale(B, side === "A" ? "B" : "A"))})</span></div>
    <div class="blog">${B.log.map(l => `<p>${UI.esc(l)}</p>`).join("")}</div></div><div class="col side" style="overflow:auto">`),
    B.phase !== "end")
  ) {
    for (const [w, n] of [
      ["L", "Left wing"],
      ["C", "Center"],
      ["R", "Right wing"],
    ]) {
      const us = me.units.filter(u => u.wing === w && u.status !== "gone");
      if (!us.length) {
        h += `<div class="wingctl card small"><b>${n}</b> <span class="muted">— empty</span></div>`;
        continue;
      }
      const opts = A.tacticsFor(B, side, w),
        cur = us[0].tac,
        T = GD.BATTLE_TACTICS[cur] || {},
        L = T.tac ? LORE.tactics.find(t => t.id === T.tac) : null;
      // [X1 baked patch war/60-unit-drill DRILL-BATTLE-WING] The wing tactic menu in UI.battleModalBasic names each
      // tactic only. Each option now says how well the men have drilled it (A.drillTag, plain text, escaped here), and
      // under the menu A.drillWingNote (escaped HTML) lists the formations this wing never drilled and so cannot use.
      h += `<div class="wingctl card small"><b>${n}</b> <span class="muted">${us.map(u => `${UI.esc(u.name)} ${A.fmt(u.men)}${u.status === "rout" ? " (routing)" : u.status === "shaken" ? " (shaken)" : ""}`).join(", ")}</span>
        <select data-c="bTac" data-k="${w}" aria-label="Tactic for ${n}">${opts.map(k => `<option value="${k}" ${k === cur ? "selected" : ""}>${UI.esc(GD.BATTLE_TACTICS[k].name + (A.drillTag ? A.drillTag(B, side, w, k) : ""))}</option>`).join("")}</select><div class="tacdesc">${UI.esc(L ? L.desc : T.desc || "")}</div>${A.drillWingNote ? A.drillWingNote(B, side, w) : ""}</div>`;
    }
    const res = me.units.filter(u => u.wing === "X" && u.status !== "gone");
    if (res.length)
      h += `<div class="card small"><b>Reserve</b> <span class="muted">${res.map(u => UI.esc(u.name) + " " + A.fmt(u.men)).join(", ")}</span><div class="row" style="margin-top:4px">${
        B.phase === "deploy"
          ? '<span class="muted">Commit it once the lines meet.</span>'
          : ["L", "C", "R"]
              .map(
                w =>
                  `<button class="small" data-a="bRes" data-v="${w}">Send ${
                    {
                      L: "left",
                      C: "center",
                      R: "right",
                    }[w]
                  }</button>`,
              )
              .join("")
      }</div></div>`;
    h += `<label class="card small row"><input type="checkbox" data-c="bLead" ${B.pcLead ? "checked" : ""}> Lead from the front <span class="muted">(+morale, your blade in the press, real risk)</span></label>`;
    h += `<div class="row" style="margin-top:6px"><button class="primary grow" data-a="bStep">${B.phase === "deploy" ? "Sound the advance ▸" : "Next pulse ▸"}</button><button data-a="bAuto">Fight it out</button></div>`;
    h += `<p class="tiny muted">A battle comes in pulses: missiles, then the clash on each wing. Morale breaks armies, and most men die in the rout. Cavalry that breaks a wing can turn on the enemy's flank.</p>`;
  } else {
    const won = B.winner === side;
    h += `<div class="result ${won ? "good" : B.winner === "draw" ? "" : "bad"}"><b>${won ? "Victory." : B.winner === "draw" ? "A drawn field." : "Defeat."}</b> Dead: ${A.fmt(B.dead[side])} of yours, ${A.fmt(B.dead[side === "A" ? "B" : "A"])} of theirs.</div><button class="primary" data-a="bClose">Continue</button>`;
  }
  return h + "</div></div></div>";
};

UI.campModal = function (C) {
  const w = A.S.wars.find(x => x.id === C.war),
    pl = C.armies.find(a => a.player);
  let h = `<div class="panel mbox full"><div class="row"><h2 style="margin:0">${UI.esc(w ? w.name : "Campaign")}</h2><span class="small muted">${GD.MONTHS[Math.min(11, C.month - 1)]} ${A.S.year} · war score ${w ? Math.round(C.side === "att" ? w.score : -w.score) : 0} in your favor</span></div>`;
  if (
    ((h +=
      '<div class="camp"><div class="mapwrap"><canvas id="campmap" width="1050" height="675"></canvas></div><div class="side">'),
    !C.over && pl)
  ) {
    const p = A.prov(pl.prov);
    h += `<div class="card"><b>Your army</b> — ${A.fmt(pl.men)} men at <b>${UI.esc(p.name)}</b> (${UI.esc(p.terr)}${p.fort ? ", walls " + p.fort : ""})<div class="small muted">${pl.moved ? "Orders given: " + (pl.order.type === "move" ? "march to " + UI.esc(A.provName(pl.order.to)) : pl.order.type) : "Awaiting orders. Click a highlighted province on the map, or:"}</div>
      <div class="row" style="margin-top:6px"><button class="small" data-a="cOrder" data-v="siege" ${pl.moved ? "disabled" : ""}>Besiege / hold here</button><button class="small" data-a="cOrder" data-v="rest" ${pl.moved ? "disabled" : ""}>Rest and resupply</button></div></div>`;
    h += '<div class="group-h">March to</div>';
    for (const mv of A.campMoves(C, pl)) {
      const q = A.prov(mv.id),
        foes = C.armies.filter(a => a.prov === mv.id && a.side !== pl.side);
      h += `<button class="small" style="margin:2px" data-a="cOrder" data-v="${mv.id}" ${pl.moved ? "disabled" : ""}>${UI.esc(q.name)}${mv.sea ? " (sea)" : ""} <span class="muted">${UI.esc(A.realmShort(A.ctrl(q)))}${foes.length ? " · ⚔ " + A.fmt(foes.reduce((x, a) => x + a.men, 0)) : ""}</span></button>`;
    }
    h +=
      '<div class="row" style="margin-top:8px"><button class="primary grow" data-a="cEnd">End month ▸</button><button data-a="cAuto">Campaign on instinct</button></div>';
  } else
    h += `<div class="result">${UI.esc(C.log[C.log.length - 1] || "")}</div><button class="primary" data-a="cClose">Close the campaign</button>`;
  h += `<div class="group-h">Armies in the field</div>${C.armies.map(a => `<div class="small"><span style="color:${A.realm(a.realm) ? A.realm(a.realm).color : "#999"}">■</span> ${UI.esc(a.player ? "Your army" : a.name)} — ${A.fmt(a.men)} at ${UI.esc(A.provName(a.prov))} <span class="muted">${a.side === C.side ? "ally" : "enemy"}</span></div>`).join("")}`;
  h += `<div class="group-h">Dispatches</div><div class="blog">${C.log
    .slice(-30)
    .map(l => `<p>${UI.esc(l)}</p>`)
    .join("")}</div>`;
  return h + "</div></div></div>";
};

UI.drawCamp = function (cv, C) {
  const pl = C.armies.find(a => a.player),
    moves = pl && !pl.moved && !C.over ? A.campMoves(C, pl).map(m => m.id) : [];
  MAP.draw(cv, {
    hl: null,
    home: false,
    extra: (ctx, W, H) => {
      for (const id of moves) {
        const p = A.prov(id),
          [x, y] = MAP.toCanvas(cv, p.sx, p.sy);
        ctx.strokeStyle = "#f1d58e";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.arc(x, y, 13, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      const byProv = {};
      for (const a of C.armies) (byProv[a.prov] = byProv[a.prov] || []).push(a);
      for (const pid in byProv) {
        const p = A.prov(+pid),
          [x0, y0] = MAP.toCanvas(cv, p.sx, p.sy);
        byProv[pid].forEach((a, i) => {
          const x = x0 + i * 16 - (byProv[pid].length - 1) * 8,
            y = y0,
            r = Math.max(7, Math.min(16, Math.sqrt(a.men) / 12));
          ctx.fillStyle = A.realm(a.realm) ? A.realm(a.realm).color : "#999";
          ctx.strokeStyle = a.player ? "#fff" : a.side === C.side ? "#222" : "#a00";
          ctx.lineWidth = a.player ? 3 : 2;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#fff";
          ctx.font = "bold 10px sans-serif";
          ctx.textAlign = "center";
          ctx.strokeStyle = "#000";
          ctx.lineWidth = 3;
          const t = a.men >= 1e3 ? Math.round(a.men / 1e3) + "k" : String(a.men);
          ctx.strokeText(t, x, y + 3);
          ctx.fillText(t, x, y + 3);
        });
      }
    },
  });
  MAP.attach(cv, {
    tip: p => {
      const here = C.armies.filter(a => a.prov === p.id);
      return here.length
        ? "<br>" + here.map(a => UI.esc((a.player ? "Your army" : a.name) + " " + A.fmt(a.men))).join("<br>")
        : "";
    },
    click: p => {
      if (pl && moves.includes(p.id)) {
        A.campOrder(pl.id, p.id);
        UI.renderModal();
      } else {
        if (pl && p.id === pl.prov && !pl.moved) {
          A.campOrder(pl.id, "siege");
          UI.renderModal();
        }
      }
    },
  });
};

UI.travelModal = function () {
  const pc = A.pc(),
    opts = A.travelOptions(pc),
    near = opts.slice(0, 18),
    realms = {};
  for (const o of opts) if (!realms[o.realm]) realms[o.realm] = o;
  let h = `<div class="panel mbox wide"><h2>The road</h2><p class="small muted">From ${UI.esc(A.provName(pc.home))}. Armies march 15–25 km a day; a ship by the season. Moving realms means new laws, a new tongue and starting over.</p>`;
  h += `<div class="group-h">Nearby</div><div class="gridauto">${near.map(o => `<button class="small" data-a="travel" data-v="${o.id}">${UI.esc(o.name)} <span class="muted">${UI.esc(A.realmShort(o.realm))} · ${A.fmt(o.d)} km · ${o.cost} suns</span></button>`).join("")}</div>`;
  h += `<div class="group-h">Capitals and far realms</div><div class="gridauto">${Object.values(A.S.realms)
    .filter(r => r.alive && r.capitalProv != null)
    .map(r => {
      const o = opts.find(x => x.id === r.capitalProv);
      return o
        ? `<button class="small" data-a="travel" data-v="${o.id}">${UI.esc(o.name)} <span class="muted">${UI.esc(r.short)} · ${A.fmt(o.d)} km · ${o.cost} suns</span></button>`
        : "";
    })
    .join("")}</div>`;
  return h + '<button style="margin-top:10px" data-a="qClose">Stay where you are</button></div>';
};

UI.deathModal = function () {
  const pc = A.pc(),
    heirs = A.heirsOf(pc),
    score = A.score(pc);
  let h = `<div class="panel mbox obit"><div>${PORTRAIT.svg(pc, 150)}</div><h2>${UI.esc(A.fullName(pc))}</h2><div class="years">${pc.born} – ${pc.died || A.S.year} AR</div><p class="mtext">${UI.esc(UI.titleLine(pc))}. Died aged ${A.age(pc)}, of ${UI.esc(pc.cause || "unknown causes")}.</p>`;
  const bits = [];
  if (pc.mil || pc.veteran) bits.push(`${(pc.mil || pc.veteran).battles || 0} battles`);
  if (pc.kills) bits.push(`${pc.kills} foes slain`);
  const kids = pc.children.map(A.P).filter(Boolean);
  if (kids.length) bits.push(`${kids.length} children`);
  if (pc.spouse || pc.exSpouses.length) bits.push("married");
  bits.push(`${A.coin(pc.coin)} left behind`);
  h += `<p class="small muted">${UI.esc(bits.join(" · "))}</p>`;
  if (pc.deeds.length)
    h += `<p class="small">${pc.deeds
      .slice(-5)
      .map(d => UI.esc(d.t))
      .join(" · ")}</p>`;
  h += `<div class="score">${A.fmt(score)}</div><div class="small muted">life score</div><div class="sep"></div>`;
  if (heirs.length)
    h += `<h3>Go on as your child</h3><div class="row" style="justify-content:center">${heirs
      .slice(0, 8)
      .map(
        k =>
          `<button data-a="contAs" data-v="${k.id}">${UI.esc(k.given)} (${A.age(k)}, ${k.sex === "F" ? "daughter" : "son"})</button>`,
      )
      .join("")}</div>`;
  h +=
    '<div class="row" style="justify-content:center;margin-top:12px"><button class="primary" data-a="newLife">A new life</button><button data-a="toTitleEnd">Title screen</button></div>';
  return h + "</div>";
};

UI.namingModal = function () {
  const id = A.S.pendingName[0],
    c = A.P(id);
  if (!c) {
    A.nameChild("");
    return "";
  }
  const cult = A.culture(c.cult),
    list = (c.sex === "F" ? cult.f : cult.m).slice(0, 30);
  return `<div class="panel mbox"><div class="row" style="gap:14px">${PORTRAIT.svg(c, 90)}<div class="grow"><h2>A ${c.sex === "F" ? "daughter" : "son"} is born</h2><div class="small muted">${UI.esc(GD.RACES[c.race].adj)} · family name: ${UI.esc(c.sur || "(none)")}${c.blood && c.blood.show ? ' · <span style="color:var(--blood)">the blood shows</span>' : ""}</div></div></div>
    <div class="field"><label>Name the child</label><div class="row"><input id="childName" aria-label="Name the child" value="${UI.esc(c.given)}" maxlength="24" style="flex:1"><button class="primary" data-a="nameChild">Name</button></div><div class="row" style="margin-top:6px">${list.map(n => `<button class="small" data-a="pickChildName" data-v="${UI.esc(n)}">${UI.esc(n)}</button>`).join("")}</div></div></div>`;
};

UI.ovModalBasic = function (ov) {
  const pc = A.S ? A.pc() : null,
    close = `<button class="ghost closex" data-a="closeOv" aria-label="Close">${UI.icon("x", "m")}</button>`;
  // [X1 baked patch events/58-event-cut EC-MENU] The menu gains "Classic event pool (keep every event)", off by
  // default: on, the yearly roll draws from every event again, including the small one-off events Events 1 retired.
  // It sits with the game settings, after the hints toggle.
  // [X1 baked patch ui/61-illuminated-chronicle IL-MENU] The menu gains three settings for the illuminated look:
  // woodcuts on events, the Chronicle set on vellum, and sound (off by default). They sit with the other display
  // settings, above the odds toggle.
  // [X1 baked patch map/62-inked-map IM-MENU] The menu gains two map settings, "Inked map" and "Banners for armies",
  // next to the colour-blind map setting.
  // [X1 baked patch ui/63-miniature-portraits MN-MENU] The menu gains the setting "Painted miniatures (portraits)",
  // on by default; off brings back the release's flat-colour portraits. It sits with the display settings, just
  // above the theme.
  // [X1 baked patch core/65-mods MODS-MENU] Replayability 6: the in-game Menu gets a "Mods" button beside "Playtest
  // mode", to see which mods this life began with and to load or tick mods for the next one.
  // [X1 baked patch ui/73-music-score SCORE-MENU] Visual art 7: the menu gains "Music (a quiet score for each
  // land)", off by default, and a music volume slider. They sit with the sound and display settings, just above the
  // autosave toggle.
  // [X1 baked patch ui/93-anime-portraits AP-MENU] The menu gains the setting "Anime portraits", on by default; off
  // brings back the woodcut miniatures of 63-miniature-portraits (or the release's portraits when those are off
  // too). It sits with the display settings, just above the theme.
  // [X1 baked patch ui/96-big-moments MO-MENU] The menu gains the Motion setting (Follow system, Full, Reduced, Off:
  // brief §6) and the "Moment cut-ins" switch (brief §5.10), just after the theme. UI.MOMENTS.menu draws both; their
  // change handlers are UI.C.setMotion and UI.C.setCutins, saved with the other settings.
  return ov.type === "report"
    ? UI.reportModal(close)
    : ov.type === "menu"
      ? `<div class="panel mbox">${close}<h2>Menu</h2><div class="col">
    <button data-a="save">Save now</button><button data-a="exportSave">Export save file</button><button data-a="import">Load save file</button><button data-a="help">How to play</button><button data-a="report">Report a problem</button><button data-a="mods">Mods</button><button data-a="playtest">Playtest mode</button>
    ${(SAVES.listCache || []).length ? `<div class="group-h">Saves in this browser</div>${SAVES.listCache.map(s => `<div class="row small"><span class="grow">${s.slot === "cur" ? "Newest" : "Backup " + s.slot.slice(3)}: ${UI.esc(s.meta.name || "?")}, ${s.meta.alive ? "age " + s.meta.age : "dead"} · ${s.meta.year} AR <span class="muted">(${s.kb} KB)</span></span><button class="small" data-a="loadSlot" data-v="${s.slot}">Load</button></div>`).join("")}` : ""}
    ${UI.ILLUM ? UI.ILLUM.menu() : ""}<label class="row"><input type="checkbox" data-c="setOdds" ${UI.set.odds ? "checked" : ""}> Show exact odds on choices</label>
    ${UI.SCORE ? UI.SCORE.menu() : ""}<label class="row"><input type="checkbox" data-c="setAuto" ${UI.set.autosave ? "checked" : ""}> Autosave every year</label>
    <label class="row"><input type="checkbox" data-c="setHints" ${UI.set.hints !== false ? "checked" : ""}> Hints for new players (the first ten years)</label>
    ${UI.EVCUT ? UI.EVCUT.menu() : ""}<label class="row">Text size <select data-c="setTx" aria-label="Text size">${[1, 1.25, 1.5, 2].map(v => `<option value="${v}" ${(UI.set.tx || 1) === v ? "selected" : ""}>${v * 100}%</option>`).join("")}</select></label>
    ${UI.INKMAP ? UI.INKMAP.menu() : ""}<label class="row"><input type="checkbox" data-c="setMapCb" ${UI.set.mapCb ? "checked" : ""}> Map colors for color-blind players</label>
    ${UI.MINI ? UI.MINI.menu() : ""}${UI.ANIME ? UI.ANIME.menu() : ""}<label class="row">Theme <select data-c="setTheme" aria-label="Theme"><option value="dark" ${UI.set.theme === "dark" ? "selected" : ""}>Dark</option><option value="light" ${UI.set.theme === "light" ? "selected" : ""}>Parchment</option></select></label>${UI.MOMENTS ? UI.MOMENTS.menu() : ""}
    <div class="sep"></div><button data-a="newLife">Start a new life</button><button data-a="toTitleEnd">Title screen</button></div></div>`
      : ov.type === "house"
        ? UI.famDetail(ov.id, close)
        : pc
          ? ov.type === "person"
            ? UI.personModal(A.P(ov.id), close)
            : ov.type === "profs"
              ? `<div class="panel mbox wide">${close}<h2>Proficiencies</h2><p class="small muted">★ natural talent (learns faster) · ▽ blind spot (learns slower, lower ceiling). Perks unlock at 40, 65 and 85. Practice any proficiency from the Life tab.</p>${UI.profBlock(
                  pc,
                  {
                    all: true,
                  },
                )}</div>`
              : ov.type === "bigmap"
                ? `<div class="panel mbox full">${close}<h2>Ardan in ${A.S.year} AR</h2><div class="mapwrap" style="flex:1;min-height:0"><canvas id="bigmap" width="1400" height="900" style="max-height:calc(100vh - 140px);object-fit:contain"></canvas></div>${
                    UI.mapMode && UI.mapMode !== "political" && UI.mapMode !== "terrain" && UI.mapLegend
                      ? UI.mapLegend()
                      : `<div class="legend">${Object.values(A.S.realms)
                          .filter(r => r.alive)
                          .sort((a, b) => b.pop - a.pop)
                          .map(r => `<span><i style="background:${r.color}"></i>${UI.esc(r.short)}</span>`)
                          .join("")}</div>`
                  }</div>`
                : ov.type === "profile"
                  ? UI.profileModal(pc, close)
                  : ov.type === "tree"
                    ? UI.treeModal(pc, close)
                    : ""
          : "";
};

UI.profileModal = function (pc, close) {
  const st = A.stats(pc),
    BL = pc.blood ? LORE.bloodlines[pc.blood.id] : null;
  let h = `<div class="panel mbox wide">${close}<div class="row" style="align-items:flex-start;gap:16px"><div>${PORTRAIT.svg(pc, 210)}</div><div class="grow"><h2>${UI.esc(A.fullName(pc))}</h2><div class="ink2">${UI.esc(UI.titleLine(pc))}</div>
    <div class="kv small" style="margin-top:6px"><div>Born</div><div>${pc.born} AR in ${UI.esc(A.provName(pc.home))}</div><div>People</div><div>${UI.esc(GD.RACES[pc.race].name)}, ${UI.esc((A.culture(pc.cult) || {}).name || "")}</div><div>Faith</div><div>${UI.esc((A.faith(pc.faith) || {}).name || "")}</div><div>Realm</div><div>${UI.esc(A.realmName(pc.realm))}</div><div>Height</div><div>${pc.app.height} cm, ${UI.esc(pc.app.build)}</div><div>Hair & eyes</div><div>${UI.esc(GD.HAIR_NAMES[pc.app.hair] || "")}, ${UI.esc(GD.EYE_NAMES[pc.app.eye] || "")}</div><div>Languages</div><div>${UI.esc(pc.langs.join(", "))}${pc.literate ? " · reads and writes" : " · cannot read"}</div><div>Renown</div><div>${Math.round(pc.fame)} · honor ${Math.round(pc.honor)} · piety ${Math.round(pc.piety)}</div><div>Kills</div><div>${pc.kills}${pc.mil ? " · battles " + pc.mil.battles : ""}</div></div></div></div>`;
  if (BL)
    h += `<div class="card" style="margin-top:8px"><b>${UI.esc(BL.name)}</b> <span class="chip blood">${UI.esc(GD.BLOOD[BL.id].short)}${pc.blood.show ? "" : " — carried, not shown"}${pc.blood.copies === 2 ? " — two copies" : ""}</span><div class="small">${UI.esc(BL.trait)}</div><div class="small bad">Price: ${UI.esc(BL.cost)}</div><div class="lore-text tiny">${UI.esc(BL.story)}</div></div>`;
  h += `<div class="grid2" style="margin-top:8px"><div><div class="group-h">Stats (current / potential)</div>${GD.STATS.map(k => UI.barRow(GD.STAT_NAMES[k], st[k], Math.max(100, pc.pot[k] + 5), "statbar", pc.pot[k], st[k] + "/" + Math.round(pc.pot[k]))).join("")}</div>
    <div><div class="group-h">Proficiencies</div>${UI.profBlock(pc)}</div></div>`;
  h += `<div class="group-h">Wounds & scars</div>${pc.wounds.length ? pc.wounds.map(w => `<span class="chip red">${UI.esc((GD.WOUNDS[w.k] || {}).name || w.k)}${w.until ? " (heals ~" + w.until + ")" : ""}</span>`).join("") : '<span class="small muted">None. Yet.</span>'}`;
  if (pc.deeds.length)
    h += `<div class="group-h">Deeds</div>${pc.deeds.map(d => `<div class="small">${d.y}: ${UI.esc(d.t)}</div>`).join("")}`;
  return h + "</div>";
};

UI.treeModal = function (pc, close) {
  const box = p =>
      p
        ? `<div class="card click small" style="text-align:center;width:120px" data-a="ov" data-v="person:${p.id}">${PORTRAIT.svg(p, 64)}<div><b>${UI.esc(p.given)}</b></div><div class="tiny muted">${p.alive ? A.age(p) : "†" + p.died}</div></div>`
        : "",
    par = pc.parents.map(A.P).filter(Boolean),
    gpar = [];
  for (const p of par) for (const g of (p.parents || []).map(A.P).filter(Boolean)) gpar.push(g);
  for (const x of A.relsOf(pc, ["grandparent"])) if (!gpar.includes(x.p)) gpar.push(x.p);
  const sibs = A.relsOf(pc, ["sibling"]).map(x => x.p),
    sp = A.P(pc.spouse),
    kids = pc.children.map(A.P).filter(Boolean),
    gk = A.relsOf(pc, ["grandchild"]).map(x => x.p),
    row = (lbl, list) =>
      list.length
        ? `<div class="group-h">${lbl}</div><div class="row" style="justify-content:center">${list.map(box).join("")}</div>`
        : "";
  return `<div class="panel mbox wide">${close}<h2>The family of ${UI.esc(A.fullName(pc))}</h2>${row("Grandparents", gpar)}${row("Parents", par)}${row("You and your siblings", [pc].concat(sibs))}${sp ? row("Spouse", [sp]) : ""}${row("Children", kids)}${row("Grandchildren", gk)}</div>`;
};

Object.assign(UI.A, {
  qChoice(v) {
    A.choiceChoose(+v);
    UI.refresh();
  },
  qClose() {
    A.simpleClose();
    const q = A.S.queue[0];
    if (q) ["msg", "school", "travel"].includes(q.type);
    UI.refresh();
  },
  qSkip() {
    A.skipPrompt();
    UI.refresh();
  },
  evChoose(v) {
    A.eventChoose(+v);
    UI.renderModal();
  },
  evClose() {
    A.eventClose();
    UI.refresh();
  },
  duel(v) {
    A.duelAct(v);
    UI.renderModal();
  },
  duelAuto() {
    const q = A.S.queue[0];
    if (q && q.type === "duel") A.duelAuto(q.d);
    UI.renderModal();
  },
  duelClose() {
    A.duelClose();
    UI.refresh();
  },
  mChoose(v) {
    A.missionChoose(+v);
    UI.refresh();
  },
  mAuto() {
    const q = A.S.queue[0];
    if (q && q.type === "mission") {
      const m = q.m;
      if ((m.cur || A.missionView(m), m.over || !m.cur)) {
        UI.refresh();
        return;
      }
      const best = m.cur.choices.reduce((bi, c, i, arr) => (c.odds > arr[bi].odds ? i : bi), 0);
      A.missionChoose(best);
    }
    UI.refresh();
  },
  mClose() {
    A.missionClose();
    UI.refresh();
  },
  bStep() {
    A.battleStep();
    UI.renderModal();
  },
  bAuto() {
    const q = A.S.queue[0];
    if (q && q.type === "battle") {
      let g = 0;
      for (; q.b.phase !== "end" && g++ < 20 && A.S.queue[0] === q; ) A.battleStep();
    }
    UI.renderModal();
  },
  bRes(v) {
    A.battleCommitReserve(v);
    UI.renderModal();
  },
  bClose() {
    A.battleClose();
    UI.refresh();
  },
  cOrder(v) {
    const C = A.campaign();
    if (!C) return;
    const pl = C.armies.find(a => a.player);
    if (pl) {
      A.campOrder(pl.id, v === "siege" || v === "rest" ? v : +v);
      UI.renderModal();
    }
  },
  cEnd() {
    A.campEndTurn();
    UI.refresh();
  },
  cAuto() {
    A.campAuto();
    UI.refresh();
  },
  cClose() {
    A.campClose();
    UI.refresh();
  },
  joinSchool(v) {
    const r = A.joinSchool(+v);
    UI.toast(r.ok ? "Accepted!" : r.msg || "Refused.");
    if (r.ok) A.simpleClose();
    UI.refresh();
  },
  travel(v) {
    const r = A.travelTo(+v);
    if (r.msg) UI.toast(r.msg);
    if (r.ok) {
      A.simpleClose();
      MAP.overlayCache = null;
    }
    UI.refresh();
  },
  contAs(v) {
    A.continueAs(v);
    UI.ov = null;
    if (UI.set.autosave) UI.save(true);
    UI.refresh();
  },
  toTitleEnd() {
    UI.ov = null;
    UI.screen = "title";
    const m = UI.$("#modal");
    if (m) {
      m.remove();
      UI.modalClosed();
    }
    UI.render();
  },
  exportSave() {
    UI.exportSave();
  },
  nameChild() {
    const el = UI.$("#childName");
    A.nameChild(el ? el.value : "");
    UI.refresh();
  },
  pickChildName(v) {
    const el = UI.$("#childName");
    if (el) el.value = v;
  },
});

Object.assign(UI.C, {
  bTac(el) {
    A.battleSetTactic(el.dataset.k, el.value);
    UI.renderModal();
  },
  bLead(el) {
    const q = A.S.queue[0];
    if (q && q.type === "battle") q.b.pcLead = el.checked;
  },
});

UI.techChip = function (t, extra) {
  const fx = Object.entries(t.fx || {})
    .map(([k, v]) => (GD.TECH_FX_DESC[k] ? GD.TECH_FX_DESC[k](v) : k))
    .join(", ");
  return `<span class="tech" title="${UI.esc(t.desc + " — " + fx + " · " + A.ACTIONS[t.base].name + " · " + t.uses + "/fight")}"><b>${UI.esc(t.name)}</b> <i>${UI.esc(A.ACTIONS[t.base].name.split(" ")[0])}</i>${extra || ""}</span>`;
};

UI.styleCard = function (st, opts = {}) {
  const pc = A.pc(),
    mine = pc && pc.styles && pc.styles[st.id],
    r = mine ? mine.rank : 0;
  let h = `<div class="card stylecard ${opts.sel ? "sel" : ""}"><div class="row"><b class="sname">${UI.esc(st.name)}</b><span class="tag">${st.kind === "household" ? "household" : st.kind === "chain" ? "great chain" : "imperial"}</span><span class="right tiny muted">${UI.esc(GD.SKILLS[st.prof] || st.prof)}${
    (st.weapons || []).filter(w => w !== st.prof).length
      ? " · " +
        st.weapons
          .filter(w => w !== st.prof)
          .map(w => GD.SKILLS[w] || w)
          .join(", ")
      : ""
  }</span></div>`;
  if (st.school && !opts.noSchool)
    h += `<div class="tiny">${UI.esc(st.school.name)} · ${UI.esc(st.school.seat)}, ${UI.esc(A.realmShort(st.realm))} · master ${UI.esc(st.school.master)}</div>`;
  h += `<div class="small lore-text">${UI.esc(st.philosophy)}</div><div class="tiny"><span class="good">✓ ${UI.esc(st.strengths)}</span> · <span class="bad">✗ ${UI.esc(st.weakness)}</span></div>`;
  if (mine)
    h += `<div class="tiny" style="margin-top:3px">Your rank: <b>${UI.esc(A.styleRankName(st, r))}</b> (${r}/5)${r < 5 ? ` · next at ${GD.STYLE_XP[r]} xp and ${GD.SKILLS[st.prof]} ${GD.STYLE_PROF[r]} (now ${Math.round(mine.xp || 0)} xp, ${A.skill(pc, st.prof)})` : ""}</div>`;
  h += `<div class="techs">${(st.techniques || []).map(t => UI.techChip(t, ` <span class="tiny ${r >= t.rank ? "good" : "muted"}">${r >= t.rank ? "✓" : "R" + t.rank}</span>`)).join("")}</div>`;
  if (st.maneuver)
    h += `<div class="tiny muted">Battle: <b>${UI.esc(st.maneuver.name)}</b> — ${UI.esc(st.maneuver.desc)} (officers of rank 3+)</div>`;
  if (opts.origin) h += `<div class="tiny muted" style="margin-top:3px">${UI.esc(st.origin)}</div>`;
  return h + (opts.footer || "") + "</div>";
};

UI.schoolModal = function () {
  const pc = A.pc(),
    list = A.schoolList(pc),
    tab = UI.schoolTab || "home",
    tabs = [
      ["home", "In your realm"],
      ["abroad", "Abroad"],
      ["styles", "Your styles"],
    ];
  let h = `<div class="panel mbox wide"><h2>Schools & academies</h2><p class="small muted">Every realm teaches its own ways of fighting at imperial schools in its own cities, and keeps academies for officers, lawyers, physicians, priests and merchants. Schooling speeds your training and teaches techniques; it never makes the self-taught weaker.${pc.school ? ` You are at <b>${UI.esc(pc.school.name)}</b>.` : ""}</p>
    <div class="row" style="margin-bottom:6px">${tabs.map(([k, n]) => `<button class="small ${tab === k ? "primary" : ""}" data-a="schoolTab" data-v="${k}">${n}</button>`).join("")}</div>`;
  const join = o =>
    o.ok
      ? pc.school
        ? '<span class="tiny muted">Leave your current school first</span>'
        : `<button class="small primary" data-a="joinSchool2" data-v="${o.id}">${o.here ? "Apply" : "Travel & apply"} · ${A.coin(o.fee)}/yr</button>`
      : `<span class="tiny bad">${UI.esc(o.why)}</span>`;
  if (tab === "home" || tab === "abroad") {
    const here = tab === "home",
      styles = list.filter(o => o.kind === "style" && o.here === here),
      acad = list.filter(o => o.kind === "academy" && here),
      chains = list.filter(o => o.kind === "chain" && o.here === here);
    if (
      (here &&
        acad.length &&
        (h += `<div class="group-h">Academies of ${UI.esc(A.realmShort(pc.realm))}</div><div class="gridcards">${acad.map(o => `<div class="card"><div class="row"><b>${UI.esc(o.name)}</b><span class="right tag">${UI.esc(o.ac.type)}</span></div><div class="tiny muted">${UI.esc(o.seat)} · teaches ${o.ac.T.profs.map(k => GD.SKILLS[k]).join(", ")}</div><div class="small">${UI.esc(o.desc)}</div><div class="tiny">${UI.esc(A.DIPLOMA_TEXT[o.ac.type] || "")}</div><div class="row" style="margin-top:4px">${pc.flags["dip_" + o.ac.type] ? '<span class="good tiny">✓ Graduated</span>' : join(o)}</div></div>`).join("")}</div>`),
      here)
    ) {
      if (styles.length)
        h += `<div class="group-h">Fighting schools of ${UI.esc(A.realmName(pc.realm))}</div><div class="gridcards">${styles
          .map(o =>
            UI.styleCard(o.st, {
              footer: `<div class="row" style="margin-top:4px"><span class="tiny muted">${UI.esc(o.name)}, ${UI.esc(o.seat)} · entry: ${UI.esc(o.st.school.entry)}</span><span class="right"></span>${join(o)}</div>`,
              noSchool: true,
            }),
          )
          .join("")}</div>`;
      else h += '<p class="small muted">Your realm keeps no fighting schools of its own. Look abroad.</p>';
    } else {
      const realms = [...new Set(styles.map(o => o.realm))],
        sel = UI.schoolRealm && realms.includes(UI.schoolRealm) ? UI.schoolRealm : realms[0];
      h += `<div class="row"><select data-c="schoolRealm" aria-label="Realm">${realms.map(r => `<option value="${r}" ${r === sel ? "selected" : ""}>${UI.esc(A.realmName(r))}</option>`).join("")}</select><span class="tiny muted">Studying abroad means moving there.</span></div>`;
      h += `<div class="gridcards">${styles
        .filter(o => o.realm === sel)
        .map(o =>
          UI.styleCard(o.st, {
            footer: `<div class="row" style="margin-top:4px"><span class="tiny muted">${UI.esc(o.name)}, ${UI.esc(o.seat)} · entry: ${UI.esc(o.st.school.entry)}</span><span class="right"></span>${join(o)}</div>`,
            noSchool: true,
          }),
        )
        .join("")}</div>`;
    }
    if (chains.length)
      h += `<div class="group-h">Other old masters</div>${chains.map(o => `<div class="card small"><b>${UI.esc(o.name)}</b> · ${UI.esc(o.seat)} · ${UI.esc(o.master)}<div class="tiny muted">${UI.esc(o.desc)}</div>${o.ok && o.here && !pc.school ? `<button class="small" data-a="joinSchool" data-v="${o.i}">Ask to join</button>` : `<span class="tiny muted">${UI.esc(o.ok ? (o.here ? "" : "abroad") : o.why)}</span>`}</div>`).join("")}`;
  } else {
    const known = Object.keys(pc.styles || {})
      .map(A.style)
      .filter(Boolean);
    if (!known.length)
      h +=
        '<p class="small muted">You know no formal style. You fight on instinct and what life taught you — which is no shame. Join a school, learn from a mentor, or steal a technique from someone who beats you.</p>';
    h += known
      .map(st =>
        UI.styleCard(st, {
          origin: true,
          footer: `<div class="row" style="margin-top:4px">${pc.styleMain === st.id ? '<span class="tag">main style</span>' : `<button class="small" data-a="mainStyle" data-v="${st.id}">Make main style</button>`}</div>`,
        }),
      )
      .join("");
    const stolen = (pc.techs || [])
      .map(x => ({
        t: A.techById(x.sid, x.tid),
        st: A.style(x.sid),
      }))
      .filter(x => x.t);
    if (stolen.length)
      h += `<div class="group-h">Techniques you took from others</div><div class="techs">${stolen.map(x => UI.techChip(x.t, ` <span class="tiny muted">${UI.esc(x.st.name)}</span>`)).join("")}</div>`;
    const [ok, why] = A.canFoundStyle(pc);
    h += `<div class="card"><b>Found your own style</b><div class="small">The greatest fighters put what they learned into words and teach it to their blood. Your style would pass to your children and theirs.</div>${ok ? `<div class="row" style="margin-top:4px"><input id="styleName" aria-label="Name of your style" placeholder="Name your style" maxlength="40" value="The ${UI.esc(pc.sur || pc.given)} Way"><button class="primary small" data-a="foundStyle">Found it</button></div>` : `<div class="tiny muted">${UI.esc(why)}</div>`}</div>`;
  }
  return h + '<button style="margin-top:10px" data-a="qClose">Close</button></div>';
};

UI.duelTechBar = function (D) {
  if (!D.a.techs || !D.a.techs.length || D.over) return "";
  const btns = D.a.techs
    .map(x => {
      const t = A.techById(x.sid, x.id);
      if (!t) return "";
      const dis = x.uses <= 0 || (t.fx && t.fx.ranged && D.round >= 1),
        fx = Object.entries(t.fx || {})
          .map(([k, v]) => (GD.TECH_FX_DESC[k] ? GD.TECH_FX_DESC[k](v) : k))
          .join(", ");
      return `<button class="techbtn" data-a="duel" data-v="t:${x.id}" ${dis ? "disabled" : ""} title="${UI.esc(t.desc + " — " + fx)}">✦ ${UI.esc(t.name)}<small>${UI.esc(A.ACTIONS[t.base].name.split(" ")[0])} · ${UI.esc(fx)}${t.cost ? " · wind " + t.cost : ""} · ${x.uses} left</small></button>`;
    })
    .join("");
  return `<div class="techbar"><div class="tiny muted">Techniques — ${UI.esc(A.style(D.a.styleId) ? A.style(D.a.styleId).name : "what you have learned")}</div>${btns}</div>`;
};

(function () {
  UI.duelModalTech = function (D) {
    let h = UI.duelModalBasic(D);
    const st = (f, who) => {
        const l = A.techStatusLine ? A.techStatusLine(f) : "";
        return l ? `<div class="tiny bad center">${who}: ${UI.esc(l)}</div>` : "";
      },
      extra = UI.duelTechBar(D) + st(D.a, "You") + st(D.b, D.b.short);
    if (
      (!D.over &&
        extra &&
        (h = h.replace('<div class="row" style="margin-top:6px">', extra + '<div class="row" style="margin-top:6px">')),
      D.b.styleId &&
        A.style(D.b.styleId) &&
        (h = h.replace(
          `<div class="fname">${UI.esc(D.b.name)}</div>`,
          `<div class="fname">${UI.esc(D.b.name)}</div><div class="tiny" style="color:#d8b25e">${UI.esc(A.style(D.b.styleId).name)}</div>`,
        )),
      D.a.styleId && A.style(D.a.styleId))
    ) {
      const pc = A.pc();
      h = h.replace(
        `<div class="fname">${UI.esc(A.fullName(pc, false))}</div>`,
        `<div class="fname">${UI.esc(A.fullName(pc, false))}</div><div class="tiny" style="color:#d8b25e">${UI.esc(A.style(D.a.styleId).name)}</div>`,
      );
    }
    return h;
  };
})();

Object.assign(UI.A, {
  schoolTab(v) {
    UI.schoolTab = v;
    UI.renderModal();
  },
  joinSchool2(v) {
    const r = A.joinSchool2(v);
    UI.toast(r.msg || (r.ok ? "Admitted." : "Refused."));
    if (r.ok) A.simpleClose();
    UI.refresh();
  },
  mainStyle(v) {
    A.setMainStyle(v);
    UI.renderModal();
  },
  foundStyle() {
    const el = UI.$("#styleName"),
      r = A.foundStyle(A.pc(), el ? el.value.replace(/[<>]/g, "").trim() : "");
    UI.toast(r.msg);
    UI.renderModal();
    UI.refresh();
  },
  openSchools() {
    A.openSchools();
    UI.refresh();
  },
  studyHard() {
    A.studyHard();
    UI.refresh();
  },
  takeOffer(v) {
    const r = A.takeOffer(v);
    if (!r.ok) UI.toast(r.msg);
    UI.refresh();
  },
  declineOffer(v) {
    A.declineOffer(v);
    UI.refreshTab();
  },
  doWork(v) {
    const r = A.doWork(v);
    if (r && r.msg) UI.toast(r.msg.length > 160 ? r.msg.slice(0, 157) + "…" : r.msg);
    UI.refresh();
  },
});

Object.assign(UI.C, {
  schoolRealm(el) {
    UI.schoolRealm = el.value;
    UI.renderModal();
  },
});

UI.mini = (p, n = 34) => `<span class="mini">${PORTRAIT.svg(p, n)}</span>`;

UI.check = ok => `<b class="${ok ? "good" : "bad"}">${ok ? "✓" : "✗"}</b>`;

UI.bondChip = function (pc, p) {
  const b = A.bondTier(pc, p);
  return `<span class="chip ${b.cls}">${b.name}</span>`;
};

UI.peopleBonds = function (pc) {
  let h = UI.peopleList(pc);
  h = h.replace(/data-v="person:([^"]+)"><div class="pp">([\s\S]*?)<\/div><div><div class="nm">/g, (m, id, pp) => {
    const p = A.P(id);
    if (!p) return m;
    const r = pc.rel[id] || {},
      marks = `${r.sworn ? '<span class="chip gold" title="Sworn sibling">⚔ sworn</span>' : ""}${A.favorsOf(pc, id) ? `<span class="chip green" title="Favors they owe you">owes ${A.favorsOf(pc, id)}</span>` : ""}${A.owesTo(pc, id) ? `<span class="chip red" title="Favors you owe them">you owe ${A.owesTo(pc, id)}</span>` : ""}${r.type === "superior" ? '<span class="chip gold">your superior</span>' : ""}`;
    return `data-v="person:${id}"><div class="pp">${pp}</div><div><div class="bondline">${p.alive ? UI.bondChip(pc, p) : ""}${marks}</div><div class="nm">`;
  });
  if (A.superior(pc)) h = UI.superiorCard(pc) + h;
  return h;
};

UI.relGroups.court = ["lord", "councillor", "servant", "master", "superior", "subordinate", "patron", "protege"];

UI.bossButtons = function () {
  return `<span class="row" style="gap:4px;display:inline-flex">${Object.entries(A.BOSS_ACTS)
    .map(
      ([k, B]) =>
        `<button class="small" data-a="bossAct" data-v="${k}" title="${UI.esc(B.desc)}" ${A.S.yearActs["boss_" + k] || (B.cost && A.S.time < B.cost) ? "disabled" : ""}>${UI.esc(B.name)}${B.cost ? " (" + B.cost + "⧗)" : ""}</button>`,
    )
    .join("")}</span>`;
};

UI.superiorCard = function (pc) {
  const b = A.superior(pc);
  if (!b) return "";
  const op = Math.round(A.opinion(b, pc)),
    eff =
      op >= 50
        ? "speaks for you: +merit / +performance every year"
        : op <= -25
          ? "is against you: −merit / −performance every year"
          : "is watching you";
  return `<div class="card boss"><div class="row" style="align-items:flex-start"><div class="click" data-a="ov" data-v="person:${b.id}">${PORTRAIT.svg(b, 52)}</div><div class="grow"><span class="tag">You answer to</span><div><b>${UI.esc(A.fullName(b))}</b> <span class="small muted">${UI.esc(A.superiorTitle(pc))}</span></div>${UI.barRow("Their opinion", (op + 100) / 2, 100, op < 0 ? "hpbar" : "", 50, op)}<div class="tiny muted">${UI.esc(A.cap(A.he(b)))} ${eff}. Their word moves your promotions.</div></div></div><div style="margin-top:6px">${UI.bossButtons()}</div></div>`;
};

UI.chainOfCommand = function (pc) {
  const m = pc.mil;
  if (!m) return "";
  const r = A.realm(m.realm),
    rows = [];
  if (!m.merc && r) {
    const ru = A.P(r.ruler);
    if (ru) rows.push(["crown", ru, A.rulerStyle(ru, r), "Sovereign"]);
    const ma = r.council && A.P(r.council.marshal);
    if (ma && ma.alive && ma.id !== pc.id) rows.push(["", ma, A.fullName(ma), "Marshal of the realm"]);
  } else if (m.merc) rows.push(["", null, m.company || "The company", "Company captain-general"]);
  const b = A.superior(pc);
  if (b) rows.push(["", b, A.fullName(b), A.superiorTitle(pc)]);
  // [X1 baked patch war/99997-v2-war V2W-RANK-WORDS] Rank words that contradict (playtest 2, new 16). The chain of
  // command said "Commander · leads 3,200" (GD.MIL's number) under "2nd Aldmark Line 7,530 · Commander … you": the
  // release makes a Commander his division's commander (d.cmd), so he leads all of it; A.V2W.leads gives the
  // division's men then, else the rank's number. The arm-of-service card said "You are a sergeant now" to anyone who
  // reached rank 2 without an arm, a noble who enlisted as a Squad Captain included; it now names the rank he holds.
  // In the source: read the division's men for its commander, and the rank title in the card.
  rows.push([
    "you",
    pc,
    A.fullName(pc),
    GD.MIL[m.rank].title + " · leads " + A.fmt(A.V2W && A.V2W.leads ? A.V2W.leads(pc) : GD.MIL[m.rank].leads),
  ]);
  const sq = A.squad(pc).slice(0, 5);
  let h = '<div class="card chain"><div class="tag">Chain of command</div>';
  for (const [cls, p, n, t] of rows)
    h += `<div class="link ${cls}">${p ? `<span class="click" data-a="ov" data-v="person:${p.id}">${PORTRAIT.svg(p, 30)}</span>` : '<span class="mini blank"></span>'}<div><b>${UI.esc(n)}</b><div class="tiny muted">${UI.esc(t)}</div></div>${cls === "you" ? '<span class="chip gold right">you are here</span>' : ""}</div>`;
  if (sq.length)
    h += `<div class="link sub"><span class="mini blank"></span><div class="tiny muted">Under you: ${sq.map(c => `<span class="click" data-a="ov" data-v="person:${c.id}">${UI.esc(c.given)}</span>`).join(", ")}${A.squad(pc).length > 5 ? "…" : ""}</div></div>`;
  return h + "</div>";
};

UI.factionCard = function (f, pc, canJoin) {
  const F = A.FACTIONS[f.kind],
    lead = A.S.houses[f.leader],
    pw = Math.round((f.power != null ? f.power : A.factionPower(f)) * 100),
    mem = f.members.map(id => A.S.houses[id]).filter(Boolean);
  let h = `<div class="card fac fac-${f.kind}"><div class="row"><b>${UI.esc(F.name)}</b><span class="tag">${mem.length} house${mem.length === 1 ? "" : "s"}${f.pc ? " + you" : ""}</span><span class="right"></span>${pc.faction === f.id ? '<span class="chip gold">your faction</span>' : ""}</div><div class="small ink2">${UI.esc(F.desc)} Led by ${lead ? `<span class="click u" data-a="ov" data-v="house:${lead.id}">${UI.esc(lead.name)}</span>` : "nobody"}. Demand: <b>${UI.esc(F.demand)}</b>.</div>`;
  if (
    ((h +=
      UI.barRow("Power", pw, 100, pw >= 40 ? "hpbar" : "", 40, pw + "%") +
      UI.barRow("Discontent", f.discontent || 0, 100, (f.discontent || 0) >= 60 ? "hpbar" : "", 60)),
    (h += `<div class="tiny muted">${mem
      .slice(0, 8)
      .map(x => UI.esc(x.name))
      .join(", ")}${mem.length > 8 ? "…" : ""}. A faction with 40%+ power and 60+ discontent makes its demand.</div>`),
    canJoin)
  ) {
    const [ok, why] = A.canJoinFaction(pc, f);
    h +=
      pc.faction === f.id
        ? '<button class="small danger" data-a="leaveFac">Leave the faction</button>'
        : `<button class="small" data-a="joinFac" data-v="${f.id}" ${ok ? "" : "disabled"} title="${UI.esc(why)}">Join</button>`;
  }
  return h + "</div>";
};
