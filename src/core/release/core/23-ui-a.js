// The release's core, ui (part 1 of 6): UI: the interface.
// Readable source of vendor/ardan-b593143.html with the patch layer baked in (X1, docs/DECISIONS.md D-028). Edit it here.
// Defines: UI, UI.SET_KEY, UI.esc, UI.$, UI.store, UI.toast, UI.bar, UI.barRow, UI.portrait, UI.titleLineBasic,
// UI.loadSettings, UI.applySettings, UI.saveSettings, UI.saving, UI.savePending, UI.save, SAVES.clean,
// UI.enterSaveSafe, UI.enterSave, UI.loadGame, UI.continueGame, UI.download, UI.exportSave, UI.importSave,
// UI.render, UI.afterRender, UI.onMapReady, UI.refresh, UI.refreshTab, UI.renderTitle, UI.crDefaults,
// UI.ensureWorld, UI.crCult, UI.crFix, UI.crPreviewPerson, UI.renderCreate, UI.crSummary, UI.crMul, UI.opt,
// UI.crStepBirth, UI.crStepBody, UI.crStepGifts, UI.crStepBegin, UI.crRandomize, UI.startLife, UI.renderGame,
// UI.renderProfile, UI.GROUPS, UI.PHONE_SUBS, UI.TAB_ALIAS, UI.isPhone, UI.subsOf, UI.groupOf, UI.lastSub,
// UI.subName, UI.tabBadge, UI.setTab, UI.renderGroupBar, UI.renderSubBar, UI.renderTabBar, and 25 more.

const UI = {
  screen: "title",
  tab: "life",
  step: 0,
  ov: null,
  cr: null,
  set: {
    odds: true,
    theme: "dark",
    autosave: true,
  },
  worldView: "map",
  codex: "faiths",
  peopleFilter: "all",
  logAll: false,
};

UI.SET_KEY = "ardan.settings.v1";

UI.esc = s =>
  String(s ?? "").replace(
    /[&<>"']/g,
    c =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );

UI.$ = s => document.querySelector(s);

UI.store = {
  get(k) {
    try {
      return window.localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k, v) {
    try {
      window.localStorage.setItem(k, v);
      return true;
    } catch {
      return false;
    }
  },
  del(k) {
    try {
      window.localStorage.removeItem(k);
    } catch {}
  },
};

UI.toast = function (msg, ms = 2600) {
  if (!msg) return;
  let t = UI.$("#toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.setAttribute("role", "status");
    t.setAttribute("aria-live", "polite");
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = 1;
  clearTimeout(UI.toastT);
  UI.toastT = setTimeout(() => {
    t.style.opacity = 0;
  }, ms);
};

UI.bar = (v, max = 100, cls = "", pot) =>
  `<div class="bar ${cls}"><i style="width:${Math.max(0, Math.min(100, (v / max) * 100))}%"></i>${pot != null ? `<s style="left:${Math.max(0, Math.min(99, (pot / max) * 100))}%"></s>` : ""}</div>`;

UI.barRow = (label, v, max, cls, pot, valTxt) =>
  `<div class="barrow"><span class="lbl">${label}</span>${UI.bar(v, max, cls, pot)}<span class="val">${valTxt ?? Math.round(v)}</span></div>`;

UI.portrait = (p, size) => (p ? PORTRAIT.svg(p, size) : "");

UI.titleLineBasic = function (p) {
  if (!p) return "";
  const age = A.age(p),
    parts = [];
  if (p.ruler) {
    const r = A.realm(p.ruler);
    parts.push(A.rulerStyle(p, r).replace(" " + A.fullName(p, false), "") + " of " + (r ? r.short : ""));
  } else if (A.S && A.S.realms) {
    for (const id in A.S.realms)
      if (A.S.realms[id].heir === p.id && A.S.realms[id].alive) {
        parts.push("Heir of " + A.S.realms[id].short);
        break;
      }
  }
  if (p.noble && p.noble.rung >= 2 && !p.ruler) parts.push(A.nobleTitle(p));
  if (p.office && !p.ruler) parts.push(A.COUNCIL[p.office] ? A.COUNCIL[p.office].name : "");
  if (p.mil) parts.push(GD.MIL[p.mil.rank].title + (p.mil.merc ? ", " + p.mil.company : ""));
  if (p.company) parts.push("Captain of " + p.company.name);
  if (p.job && GD.CAREERS[p.job.c]) parts.push(GD.CAREERS[p.job.c].ranks[p.job.r][0]);
  if (p.prison) parts.push("Prisoner");
  if (p.flags && p.flags.outlaw) parts.push("Outlaw");
  if (!parts.length)
    parts.push(
      age < GD.RACES[p.race].adult
        ? A.stage(p) === "infant"
          ? "Infant"
          : "Child"
        : GD.STATUS[p.status]
          ? GD.STATUS[p.status].name
          : "",
    );
  return parts.filter(Boolean).join(" · ");
};

UI.loadSettings = function () {
  try {
    const s = JSON.parse(UI.store.get(UI.SET_KEY) || "{}");
    Object.assign(UI.set, s);
  } catch {}
  UI.applySettings();
};

UI.applySettings = function () {
  const d = document.documentElement;
  d.dataset.theme = UI.set.theme;
  d.style.setProperty("--tx", String(UI.set.tx || 1));
  d.dataset.text = String(Math.round((UI.set.tx || 1) * 100));
};

UI.saveSettings = function () {
  UI.store.set(UI.SET_KEY, JSON.stringify(UI.set));
  UI.applySettings();
};

UI.saving = null;

UI.savePending = null;

UI.save = function (silent) {
  if (!A.S) return Promise.resolve(false);
  if (UI.savePending) return UI.savePending;
  const run = async () => {
      let r = {
        ok: false,
      };
      try {
        if (A.J && A.J.e.length > 3e5) A.journalResume(null);
        r = await SAVES.save(A.S, A.J);
      } catch (e) {
        console.error(e);
        r = {
          ok: false,
        };
      }
      if (r.ok && UI.ptTick) UI.ptTick("saved", true);
      if (!silent && typeof navigator < "u" && navigator.storage && navigator.storage.persist)
        navigator.storage.persist().catch(() => {});
      if (!silent || (!r.ok && Date.now() - (UI._saveWarn || 0) > 12e4 && (UI._saveWarn = Date.now())))
        UI.toast(
          r.ok
            ? `Saved (${r.kb} KB).`
            : r.blocked
              ? "Ardan is open in another tab, so this tab is not saving. Close the other tab to save here."
              : "This browser would not keep the save — use Menu → Export to keep it as a file.",
          r.ok ? void 0 : 7e3,
        );
      // [X1 baked patch core/05-saves-and-keyboard SAVE-WARN] Every autosave was silent, including failures (quota,
      // aborted transaction), so a player could lose years without a word. A failed autosave now warns (at most once
      // every 2 minutes). A manual save also asks the browser to keep the site's storage (Safari otherwise clears it
      // after 7 days away).
      return r.ok;
    },
    start = () => {
      UI.savePending = null;
      const pr = run();
      UI.saving = pr;
      pr.then(() => {
        if (UI.saving === pr) UI.saving = null;
      });
      return pr;
    };
  return UI.saving ? ((UI.savePending = UI.saving.then(start, start)), UI.savePending) : start();
};

// [X1 baked patch core/00-security SEC-SAVE-CLEAN] A loaded save is untrusted (players swap files; the checksum
// anyone can recompute). Before a save is entered, strip < and > from every string and key (no game text uses
// them), strip " from everything except prose fields, and force log line classes, years and ages into safe shapes.
// Closes the script injection through the story log, realm colours, ids in data-v attributes and portrait colours.
SAVES.clean = function (d) {
  const PROSE = /^(lines|primer|t|text|desc|manner|wants|fears|looks|famNote|occ|famRole|title|history)$/,
    fix = (s, prose) => ((s = s.replace(/[<>]/g, "")), prose ? s : s.replace(/"/g, "")),
    walk = (v, prose, depth) => {
      if (typeof v == "string") return fix(v, prose);
      if (!v || typeof v != "object" || depth > 80) return v;
      if (Array.isArray(v)) {
        for (let i = 0; i < v.length; i++) v[i] = walk(v[i], prose, depth + 1);
        return v;
      }
      for (const k of Object.keys(v)) {
        const val = walk(v[k], prose || PROSE.test(k), depth + 1),
          ck = fix(k, false);
        if (ck !== k) {
          delete v[k];
          if (ck) v[ck] = val;
        } else v[k] = val;
      }
      return v;
    };
  if (d && d.S) {
    walk(d.S, false, 0);
    for (const e of Array.isArray(d.S.log) ? d.S.log : [])
      if (e && typeof e == "object") {
        e.year = +e.year || 0;
        e.age = +e.age || 0;
        for (const l of Array.isArray(e.lines) ? e.lines : [])
          if (Array.isArray(l) && typeof l[1] == "string" && !/^[\w -]*$/.test(l[1])) l[1] = "";
      }
  }
  if (d && d.meta) walk(d.meta, false, 0);
  return d;
};

UI.enterSaveSafe = function (d) {
  try {
    return UI.enterSave(d);
  } catch (e) {
    console.error(e);
    if (UI.noteError) UI.noteError(e, "load");
    if (UI.clkStop) UI.clkStop();
    UI.screen = "title";
    UI.ov = null;
    UI.render();
    UI.toast("That save could not be opened: " + ((e && e.message) || e) + ".");
    return false;
  }
};

UI.enterSave = function (d) {
  SAVES.clean(d);
  if (UI.clkStop) UI.clkStop();
  A.deserialize(d.S);
  A.journalResume(d.J);
  UI.lastLoad = {
    slot: d.slot || "file",
    fmt: d.fmt,
    damaged: (d.damaged || []).length,
    fp: A.fingerprint(A.jBase),
    entries: A.J.e.length,
  };
  UI.screen = "game";
  UI.ov = null;
  UI.tab = "life";
  UI.logAll = false;
  if (UI.wr) {
    UI.wr.sel = null;
    UI.wr.view = null;
    UI.wr.tplEdit = null;
    UI.wr.help = false;
    UI.wr.msg = "";
  }
  MAP.overlayCache = null;
  MAP.frontCache = null;
  MAP.frontKey = null;
  UI.mapSel = null;
  UI.mapHl = null;
  UI.diplSel = null;
  UI.render();
  if (A.takeWarRoomRequest() && !A.S.queue.length && UI.warRoomOpen) UI.warRoomOpen();
  // [X1 baked patch core/05-saves-and-keyboard SAVE-BACKUP-MESSAGE] Loading an older backup on purpose from the Menu
  // said "The newest save was damaged".
  UI.toast(
    d.slot && d.slot !== "cur" && !d.chosen
      ? "The newest save was damaged — loaded the one before it."
      : "Welcome back to Ardan.",
  );
  return true;
};

UI.loadGame = async function (data) {
  let d;
  try {
    d = await SAVES.decode(data);
  } catch (e) {
    // [X1 baked patch core/00-security SEC-SAVE-CLEAN] A loaded save is untrusted (players swap files; the checksum
    // anyone can recompute). Before a save is entered, strip < and > from every string and key (no game text uses
    // them), strip " from everything except prose fields, and force log line classes, years and ages into safe shapes.
    // Closes the script injection through the story log, realm colours, ids in data-v attributes and portrait colours.
    UI.toast("That save could not be read: " + e.message + ".");
    return false;
  }
  return UI.enterSaveSafe(d);
};

UI.continueGame = async function (slot) {
  let d = null;
  try {
    d = slot ? await SAVES.load(slot) : await SAVES.loadBest();
  } catch (e) {
    // [X1 baked patch core/05-saves-and-keyboard SAVE-BACKUP-MESSAGE] Loading an older backup on purpose from the Menu
    // said "The newest save was damaged".
    d = {
      S: null,
      damaged: [
        {
          why: e.message,
        },
      ],
    };
  }
  // [X1 baked patch core/00-security SEC-SAVE-CLEAN] A loaded save is untrusted (players swap files; the checksum
  // anyone can recompute). Before a save is entered, strip < and > from every string and key (no game text uses
  // them), strip " from everything except prose fields, and force log line classes, years and ages into safe shapes.
  // Closes the script injection through the story log, realm colours, ids in data-v attributes and portrait colours.
  if (slot && d) d.chosen = true;
  return d
    ? d.S
      ? UI.enterSaveSafe(d)
      : (UI.toast("Every save in this browser is damaged. Load a save file instead."), false)
    : (UI.toast("There is no save in this browser."), false);
};

UI.download = function (bytes, name, type) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([bytes], {
      type: type || "application/octet-stream",
    }),
  );
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 500);
};

UI.exportSave = async function () {
  if (!A.S) return;
  const { bytes } = await SAVES.encode(A.S, A.J),
    pc = A.pc();
  UI.download(bytes, `ardan_${(pc ? pc.given : "save").replace(/\W+/g, "_")}_${A.S.year}.ardan`);
  UI.toast(`Save file written (${Math.round(bytes.length / 1024)} KB).`);
};

UI.importSave = function () {
  const inp = document.createElement("input");
  inp.type = "file";
  inp.accept = ".ardan,.json,application/json,application/octet-stream";
  inp.onchange = () => {
    const f = inp.files[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => UI.loadGame(new Uint8Array(rd.result));
    rd.readAsArrayBuffer(f);
  };
  inp.click();
};

UI.render = function () {
  if (UI.screen !== "game" && UI.clkStop) UI.clkStop();
  const root = UI.$("#app");
  if (UI.screen === "title") root.innerHTML = UI.renderTitle();
  else {
    if (UI.screen === "create") root.innerHTML = UI.renderCreate();
    else root.innerHTML = UI.renderGame();
  }
  UI.afterRender();
  UI.renderModal();
};

UI.afterRender = function () {
  if (UI.screen === "game") {
    const lg = UI.$("#log");
    if (lg) lg.scrollTop = lg.scrollHeight;
    const mc = UI.$("#worldmap");
    if (mc) {
      MAP.draw(mc, {
        hl: UI.mapHl,
        mode: UI.mapMode || "political",
        focus: UI.mapFocus ? UI.mapFocus() : null,
      });
      MAP.attach(mc, {
        click: p => {
          UI.mapHl = p.owner;
          UI.mapSel = p.id;
          UI.refreshTab();
        },
      });
    }
  }
  if (UI.screen === "title") {
    const t = UI.$("#titlemap");
    if (t) {
      MAP.init();
      const draw = () => {
        if (A.S && A.S.prov && A.S.prov.length)
          MAP.draw(t, {
            labels: true,
            home: false,
          });
        else {
          const c = t.getContext("2d");
          if (MAP.img.complete) c.drawImage(MAP.img, 0, 0, t.width, t.height);
        }
      };
      if (MAP.img.complete) draw();
      else
        MAP.img.addEventListener("load", draw, {
          once: true,
        });
    }
  }
};

UI.onMapReady = function () {
  if (UI.$("#worldmap") || UI.$("#campmap")) UI.refreshTab();
  if (UI.$("#titlemap")) UI.afterRender();
};

UI.refresh = function () {
  if (UI.screen === "game") {
    if (!UI.$("#game") || UI.$("#game").classList.contains("phone") !== UI.isPhone()) {
      // [X1 baked patch core/05-saves-and-keyboard UI-KEYBOARD] Keyboard play. (1) The 1.5 s clock redraw and every
      // action rebuilt the tab with innerHTML, dropping focus to <body>; focus now returns to the same control, or to
      // the tab panel if that control is gone. (2) Enter then skipped time from <body>; it now skips time only when
      // nothing at all is focused. (3) 49 of 50 clickable cards and rows (people, realms, war-room rows, every
      // character-creation option) could not be reached by keyboard; every clickable element now gets tabindex and
      // role=button and answers Enter and Space. (4) The game saves when the tab is hidden or closed, so closing it no
      // longer loses up to a year.
      UI.render();
      return;
    }
    const _f = UI.focusKey(),
      pf = UI.$("#profile");
    if (pf) pf.innerHTML = UI.renderProfile();
    UI.$("#topbar").innerHTML = UI.renderTop();
    const lw = UI.$("#logwrap");
    // [X1 baked patch ui/999999-one-redraw RD-LOG-REFRESH] UI.refresh rebuilt the whole story log (innerHTML) on every
    // call and then forced a layout to scroll it. UI.paintLog keeps the log's nodes, appends new lines, and scrolls in
    // the next frame only when something was added.
    if (lw) UI.paintLog(lw);
    UI.refreshTab();
    // [X1 baked patch core/05-saves-and-keyboard UI-KEYBOARD] Keyboard play. (1) The 1.5 s clock redraw and every
    // action rebuilt the tab with innerHTML, dropping focus to <body>; focus now returns to the same control, or to
    // the tab panel if that control is gone. (2) Enter then skipped time from <body>; it now skips time only when
    // nothing at all is focused. (3) 49 of 50 clickable cards and rows (people, realms, war-room rows, every
    // character-creation option) could not be reached by keyboard; every clickable element now gets tabindex and
    // role=button and answers Enter and Space. (4) The game saves when the tab is hidden or closed, so closing it no
    // longer loses up to a year.
    UI.focusRestore(_f);
  }
  UI.renderModal();
};

// [X1 baked patch core/05-saves-and-keyboard UI-KEYBOARD] Keyboard play. (1) The 1.5 s clock redraw and every
// action rebuilt the tab with innerHTML, dropping focus to <body>; focus now returns to the same control, or to
// the tab panel if that control is gone. (2) Enter then skipped time from <body>; it now skips time only when
// nothing at all is focused. (3) 49 of 50 clickable cards and rows (people, realms, war-room rows, every
// character-creation option) could not be reached by keyboard; every clickable element now gets tabindex and
// role=button and answers Enter and Space. (4) The game saves when the tab is hidden or closed, so closing it no
// longer loses up to a year.
UI.refreshTab = function () {
  const tb = UI.$("#tabbody");
  if (!tb) return;
  const st = tb.scrollTop,
    _f = UI.focusKey();
  UI.setTab(UI.tab);
  UI.$("#tabs").innerHTML = UI.renderTabBar();
  const bn = UI.$("#bnav");
  if (bn) bn.innerHTML = UI.renderGroupBar(true);
  const g = UI.groupOf(UI.tab);
  tb.setAttribute("aria-labelledby", UI.subsOf(g).length > 1 ? "sub-" + UI.tab : "tab-" + g.k);
  // [X1 baked patch core/05-saves-and-keyboard UI-KEYBOARD] Keyboard play. (1) The 1.5 s clock redraw and every
  // action rebuilt the tab with innerHTML, dropping focus to <body>; focus now returns to the same control, or to
  // the tab panel if that control is gone. (2) Enter then skipped time from <body>; it now skips time only when
  // nothing at all is focused. (3) 49 of 50 clickable cards and rows (people, realms, war-room rows, every
  // character-creation option) could not be reached by keyboard; every clickable element now gets tabindex and
  // role=button and answers Enter and Space. (4) The game saves when the tab is hidden or closed, so closing it no
  // longer loses up to a year.
  tb.innerHTML = UI.renderTab();
  tb.scrollTop = st;
  UI.focusRestore(_f);
  const mc = UI.$("#worldmap");
  if (mc) {
    MAP.draw(mc, {
      hl: UI.mapHl,
      mode: UI.mapMode || "political",
      focus: UI.mapFocus ? UI.mapFocus() : null,
    });
    MAP.attach(mc, {
      click: p => {
        UI.mapHl = p.owner;
        UI.mapSel = p.id;
        UI.refreshTab();
      },
    });
  }
};

UI.renderTitle = function () {
  if (!A.S || !A.S.prov || !A.S.prov.length) {
    const make = () => {
      if (!(A.S && A.S.prov && A.S.prov.length)) {
        A.newState(7);
        A.initWorld();
        A.seed((Date.now() ^ (Math.random() * 1e9)) >>> 0);
      }
    };
    if (typeof window < "u" && window.ARDAN_CONTENT_READY === false) {
      if (!UI.titleWorldWait) {
        UI.titleWorldWait = true;
        window.addEventListener(
          "ardan-content",
          () =>
            setTimeout(() => {
              make();
              if (UI.screen === "title") UI.afterRender();
            }, 0),
          {
            once: true,
          },
        );
      }
    } else make();
  }
  // [X1 baked patch core/65-mods MODS-TITLE] Replayability 6: players load their own mods before they start a life,
  // so the title screen gets a "Mods" button next to "Load save file". It opens the Mods panel (UI.A.mods).
  return `<div id="title">
    <div class="logo">ARDAN</div>
    <div class="sub">BLOODLINES · BANNERS · A LIFE IN 1105</div>
    <canvas id="titlemap" class="mapstrip" width="1050" height="675"></canvas>
    <p class="blurb">Dawn of Saturday, 1 January 1105 AR. Thirty-four realms, a hundred million souls, no magic — only blood, steel, coin and will. Be born a slave in a Sabran pearl-boat or a prince of the Iron Crown. Live every year. Love, scheme, fight, command, rule — and die. Then go on as your child.</p>
    <div class="btns">
      <button class="primary" data-a="newLife">Begin a new life</button>
      <button data-a="randomLife">Random life</button>
      ${SAVES.has ? '<button data-a="continue">Continue</button>' : ""}
      <button data-a="import">Load save file</button>
      <button data-a="mods">Mods</button>
      <button data-a="help">How to play</button>
    </div>
    <p class="small" style="margin-top:10px"><button class="small ghost" data-a="playtest">Playtest mode (for usability tests)</button></p>
    <p class="muted small" style="margin-top:22px">Built on the World Bible of Ardan · Saves are kept in this browser (or export them to a file).</p>
  </div>`;
};

UI.crDefaults = function () {
  // [X1 baked patch map/43-varied-worlds WORLD-DEFAULT] A game started from the menu now asks for a varied world by
  // default (A.WORLDS); the creation state carries the choice.
  return {
    race: "human",
    realm: "POL-01",
    home: null,
    status: "peasant",
    house: null,
    order: "younger",
    bloodFate: "blood",
    sex: "M",
    given: "",
    app: {},
    potMode: "fate",
    pot: {
      str: 45,
      spd: 45,
      ins: 45,
      sta: 45,
      int: 45,
      wil: 45,
    },
    traits: [],
    quirks: [],
    startAge: 0,
    diff: "hard",
    seed: "",
    world: "varied",
  };
};

UI.ensureWorld = function () {
  if (!A.S || !A.S.prov || !A.S.prov.length || (UI.screen === "create" && !UI.worldReady)) {
    A.newState(7);
    A.initWorld();
    UI.worldReady = true;
    A.seed((Date.now() ^ (Math.random() * 1e9)) >>> 0);
  }
};

UI.crCult = function () {
  const c = UI.cr;
  let cult = A.cultureFor(c.race, c.realm);
  if (c.race === "halfelf" && (c.realm === "POL-06" || c.realm === "POL-07"))
    cult = c.realm === "POL-07" ? "CUL-20" : "CUL-19";
  if (c.race === "halforc" && (c.realm === "POL-11" || c.realm === "POL-34"))
    cult = c.realm === "POL-34" ? "CUL-23" : "CUL-22";
  return cult;
};

UI.crFix = function () {
  const c = UI.cr;
  if (!A.raceAllowed(c.race, c.realm)) {
    const ok = Object.keys(LORE.realms).filter(r => A.raceAllowed(c.race, r));
    c.realm = ok[0];
  }
  if (!A.statusAllowed(c.status, c.race, c.realm)) c.status = "peasant";
  const hs = c.status === "royal" ? A.housesFor(c.realm, c.status, c.race) : A.familiesFor(c.realm, c.status, c.race),
    needHouse = c.status === "noble" || c.status === "royal";
  if (c.house && !hs.some(h => h.id === c.house)) c.house = null;
  if (needHouse && !c.house && hs.length) c.house = hs[0].id;
  if (!hs.length) c.house = null;
  if ((c.race === "halfelf" || c.race === "halforc") && (c.status === "noble" || c.status === "royal"))
    c.order = "bastard";
  const R2 = GD.RACES[c.race],
    skins = GD.SKIN[c.race];
  if (!c.app.skin || !skins.includes(c.app.skin))
    c.app.skin =
      skins[
        Math.min(
          skins.length - 1,
          c.race === "human"
            ? {
                "CUL-01": 2,
                "CUL-02": 0,
                "CUL-03": 2,
                "CUL-11": 1,
              }[UI.crCult()] != null
              ? {
                  "CUL-01": 2,
                  "CUL-02": 0,
                  "CUL-03": 2,
                  "CUL-11": 1,
                }[UI.crCult()]
              : 4
            : 0,
        )
      ];
  if (c.app.hair == null) c.app.hair = 2;
  if (c.app.eye == null) c.app.eye = 0;
  if (!c.app.hstyle) c.app.hstyle = c.sex === "F" ? "long" : "short";
  if (!c.app.beard) c.app.beard = c.race === "dwarf" ? "full" : "none";
  if (!c.app.build) c.app.build = "average";
  const base = c.sex === "F" ? R2.height[0] : R2.height[1];
  if (!c.app.height || Math.abs(c.app.height - base) > R2.hsd * 4 + 60) c.app.height = base;
  if (c.sex === "F") c.app.beard = "none";
  if (c.race === "elf") c.app.beard = "none";
  c.startAge = A.clamp(c.startAge, 0, R2.adult + 10);
};

UI.crPreviewPerson = function () {
  const c = UI.cr,
    R2 = GD.RACES[c.race],
    age = c.startAge > 0 ? c.startAge : R2.adult + 3,
    F = c.house ? A.famData(c.house) : null,
    gear = {
      weapon: "fists",
      helm: null,
      armor: "none",
      shield: null,
      cloak: null,
      ranged: null,
    };
  if (age >= R2.adult) {
    if (c.status === "royal" || c.status === "noble")
      Object.assign(gear, {
        weapon: "goodsword",
        armor: "mail",
        shield: "heater",
        cloak: "finecloak",
      });
    else {
      if (F && F.military)
        Object.assign(gear, {
          weapon: A.pick ? ["sword", "spear", "falchion"][c.house.charCodeAt(c.house.length - 1) % 3] : "sword",
          armor: "brigandine",
          helm: "kettle",
          shield: "kite",
          cloak: "tabard",
        });
      else {
        if (c.status === "gentry")
          Object.assign(gear, {
            weapon: "sword",
            armor: "padded",
            shield: "shield",
          });
        else {
          if (c.status === "merchant")
            Object.assign(gear, {
              weapon: "dagger",
              armor: "robes",
              cloak: "cloak",
            });
          else {
            if (c.race === "elf")
              Object.assign(gear, {
                weapon: "dagger",
                ranged: "elfbow",
                armor: "leather",
              });
            else {
              if (c.race === "dwarf")
                Object.assign(gear, {
                  weapon: "axe",
                  armor: "padded",
                  shield: "shield",
                });
              else {
                if (c.race === "orc")
                  Object.assign(gear, {
                    weapon: "spear",
                    armor: "orcmail",
                    ranged: "compbow",
                  });
                else {
                  if (c.race === "giant")
                    Object.assign(gear, {
                      weapon: "maul",
                      armor: "hide",
                    });
                  else {
                    if (F && F.kind === "hunt")
                      Object.assign(gear, {
                        weapon: "dagger",
                        ranged: "selfbow",
                        armor: "leather",
                      });
                    else {
                      if (F && F.kind === "outlaw")
                        Object.assign(gear, {
                          weapon: "dagger",
                          armor: "leather",
                          cloak: "cloak",
                        });
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return {
    id: "preview",
    house: c.house || null,
    quirks: c.quirks || [],
    race: c.race,
    sex: c.sex,
    born: (A.S ? A.S.year : 1105) - age,
    app: Object.assign(
      {
        face: 1,
        brow: 1,
        mouth: 1,
      },
      c.app,
    ),
    status: c.status,
    flags: {},
    wounds: [],
    gear,
    happy: 62,
    realm: c.realm,
    alive: true,
    traits: [],
    children: [],
    parents: [],
    noble: null,
    job: null,
    mil: null,
    ruler: null,
  };
};

UI.renderCreate = function () {
  UI.crFix();
  const c = UI.cr,
    steps = ["Blood & birth", "Body & face", "Gifts & nature", "Begin"];
  let main = "";
  if (UI.step === 0) main = UI.crStepBirth();
  if (UI.step === 1) main = UI.crStepBody();
  if (UI.step === 2) main = UI.crStepGifts();
  if (UI.step === 3) main = UI.crStepBegin();
  return `<div id="create">
    <div class="row"><h1 style="margin:0">A new life</h1><span class="right"></span><button data-a="toTitle">Back</button><button data-a="randomizeCr">Randomize all</button></div>
    <div class="steps">${steps.map((s, i) => `<button class="${UI.step === i ? "on" : ""}" data-a="crStep" data-v="${i}">${i + 1}. ${s}</button>`).join("")}</div>
    <div class="create-grid">
      <div class="panel create-main">${main}
        <div class="row" style="margin-top:14px">${UI.step > 0 ? '<button data-a="crStep" data-v="' + (UI.step - 1) + '">◂ Back</button>' : ""}<span class="right"></span>${UI.step < 3 ? '<button class="primary" data-a="crStep" data-v="' + (UI.step + 1) + '">Next ▸</button>' : '<button class="primary" data-a="startLife">Be born ▸</button>'}</div>
      </div>
      <div class="panel create-side">${UI.crSummary()}</div>
    </div></div>`;
};

UI.crSummary = function () {
  const c = UI.cr,
    p = UI.crPreviewPerson(),
    realm = LORE.realms[c.realm],
    cult = LORE.cultures[UI.crCult()],
    N = GD.NAMING[UI.crCult()] || {};
  let sur = "";
  if (c.house && c.order !== "bastard") sur = A.houseSurname(A.house(c.house) || LORE.houses[c.house]);
  const bl = c.house ? A.houseBloodline(c.house) : null;
  // [X1 baked patch events/97-first-life-fixes LF-CR-RULER] The creation summary printed "Realm: <name> (<title>
  // <cast ruler>)" from LORE.cast, which holds the Known World's rulers only: a far realm read "(King )", and the
  // title ignored the ruler's sex. It now asks UI.crRulerNote (h-words.core.js), which takes the far lands' lore
  // ruler too, sexes the title and prints nothing without a name.
  return `<div class="center">${PORTRAIT.svg(p, 210)}</div>
    <div class="pname center" style="font-family:var(--fh);color:var(--gold2);font-size:calc(20px * var(--tx, 1));margin-top:6px">${UI.esc(c.given || "(a name from your people)")} ${UI.esc(sur)}</div>
    <div class="center small muted">${UI.esc(GD.RACES[c.race].name)} · ${UI.esc(cult ? cult.name : "")} · ${UI.esc(GD.STATUS[c.status].name)}</div>
    <div class="sep"></div>
    <div class="small"><b>Family name:</b> ${sur ? UI.esc(sur) + " — the name of your house." : "given by your family, not by you."} <span class="muted">${UI.esc(N.note || "")}</span></div>
    <div class="small" style="margin-top:6px"><b>Realm:</b> ${UI.esc(realm.name)} ${UI.crRulerNote ? UI.crRulerNote(realm) : `<span class="muted">(${UI.esc(realm.title)} ${UI.esc(LORE.cast[realm.ruler] ? LORE.cast[realm.ruler].name : "")})</span>`}</div>
    ${bl ? `<div class="small" style="margin-top:6px"><span class="chip blood">${UI.esc(GD.BLOOD[bl.id] ? GD.BLOOD[bl.id].short : bl.name)}</span> ${UI.esc(bl.trait)} <span class="muted">Price: ${UI.esc(bl.cost)}</span></div>` : ""}
    <div class="small muted" style="margin-top:8px">Score multiplier: ×${UI.crMul().toFixed(2)}</div>`;
};

UI.crMul = function () {
  const c = UI.cr;
  let m =
    {
      fate: 1,
      humble: 1.25,
      gifted: 0.85,
      prodigy: 0.7,
      custom: 0.8,
    }[c.potMode] || 1;
  m *= Math.pow(0.93, (c.aptPick || []).filter(Boolean).length);
  if (c.bloodFate === "carrier") m *= 0.85;
  m *=
    {
      story: 0.6,
      hard: 1,
      realism: 1.35,
    }[c.diff] || 1;
  return m;
};

UI.opt = (sel, act, val, title, desc, dis) =>
  `<div class="card opt click ${sel ? "sel" : ""} ${dis ? "dis" : ""}" data-a="${act}" data-v="${UI.esc(val)}"><div class="t">${title}</div>${desc ? `<div class="d">${desc}</div>` : ""}</div>`;

UI.crStepBirth = function () {
  const c = UI.cr,
    R2 = GD.RACES,
    raceDesc = {
      human: "Most of Ardan. Short lives, many children, endless ambition.",
      elf: "Live 400 years. Quick and deadly with a bow; very few children.",
      dwarf: "Live 200 years. Stone-strong, closed halls, the finest steel.",
      orc: "Live 50 years. Huge strength in short bursts; the steppe clans.",
      giant: "Live 110 years. Three to four meters tall. The last halls of the north.",
      halfelf: "Of two peoples and neither. Live 175 years.",
      halforc: "Strong, mistrusted, often mercenaries.",
    };
  let h = `<div class="field"><label>People</label><div class="opt-grid">${GD.RACE_LIST.map(r => UI.opt(c.race === r, "crSet", "race:" + r, R2[r].name, raceDesc[r] + ` <span class="muted">(adult at ${R2[r].adult}, lives ~${R2[r].life})</span>`)).join("")}</div></div>`;
  const realms = Object.keys(LORE.realms).filter(r => A.raceAllowed(c.race, r));
  h += `<div class="field"><label>Realm of birth</label><select data-c="crRealm" style="width:100%" aria-label="Realm of birth">${realms
    .map(r => {
      const L2 = LORE.realms[r],
        n = L2.pops[GD.RACE_POPKEY[c.race]] || 0;
      return `<option value="${r}" ${r === c.realm ? "selected" : ""}>${UI.esc(L2.name)} — ${A.fmt(n)} ${UI.esc(GD.RACES[c.race].name.toLowerCase())}s</option>`;
    })
    .join("")}</select>`;
  const L = LORE.realms[c.realm];
  h += `<div class="card" style="margin-top:6px"><div class="lore-text">${UI.esc((L.primer && L.primer.intro) || "")}</div><div class="small" style="margin-top:4px"><b>Ruler:</b> ${UI.esc((L.primer && L.primer.ruler) || "")}</div><div class="small muted" style="margin-top:2px">${UI.esc(L.gov)} · ${A.fmt(L.pop)} people · army ${A.fmt(L.army)} · stability: ${UI.esc(L.stability)}</div></div></div>`;
  const provs = LORE.map.provinces.filter(p => p.realm === c.realm);
  // [X1 baked patch family/99994-v2-family V2F-PICKER-COMMON] UI.crStepBirth offered "Place in the family" (heir,
  // younger child, cousin's branch) for a commoner family. The owner removed the choice (complaint 14): the field is
  // no longer drawn, and a short note says the family decides.
  // [X1 baked patch family/99994-v2-family V2F-PICKER-NOBLE] UI.crStepBirth offered heir, younger child, cadet
  // branch or bastard for a noble or royal birth. The field is no longer drawn (complaint 14); the same note takes
  // its place.
  if (
    ((h += `<div class="field"><label>Home town</label><select data-c="crHome" aria-label="Home town"><option value="">Wherever fate puts you</option>${provs.map(p => `<option value="${p.id}" ${String(c.home) === String(p.id) ? "selected" : ""}>${UI.esc(p.name)} (${UI.esc(p.terr)}, ${A.fmt(p.pop)} people)</option>`).join("")}</select></div>`),
    (h += `<div class="field"><label>Born as</label><div class="opt-grid">${GD.STATUS_LIST.map(s => {
      const ok = A.statusAllowed(s, c.race, c.realm);
      return UI.opt(
        c.status === s,
        "crSet",
        "status:" + s,
        GD.STATUS[s].name,
        GD.STATUS[s].desc + (ok ? "" : " <i>(not in this realm)</i>"),
        !ok,
      );
    }).join("")}</div></div>`),
    (h += UI.crFamilyField(c)),
    c.house && c.status !== "noble" && c.status !== "royal" && (h += UI.crPlaceNote ? UI.crPlaceNote(c) : ""),
    false &&
      (h += `<div class="field"><label>Place in the family</label><div class="opt-grid">${[
        ["heir", "The heir", "You will head the family one day."],
        ["younger", "A younger child", "Older siblings get the first share."],
        ["cadet", "A cousin's branch", "Same name, less money, more freedom."],
      ]
        .map(o => UI.opt(c.order === o[0], "crSet", "order:" + o[0], o[1], o[2]))
        .join("")}</div></div>`),
    c.status === "noble" || c.status === "royal")
  ) {
    h += UI.crPlaceNote ? UI.crPlaceNote(c) : "";
    // [X1 baked patch family/99994-v2-family V2F-PICKER-NOBLE] UI.crStepBirth offered heir, younger child, cadet
    // branch or bastard for a noble or royal birth. The field is no longer drawn (complaint 14); the same note takes
    // its place.
    if (false)
      h += `<div class="field"><label>Place in the family</label><div class="opt-grid">${[
        ["heir", "The heir", "First in line (in your branch). All eyes on you."],
        ["younger", "A younger child", "Older siblings stand between you and everything."],
        ["cadet", "A cadet branch", "Cousins of the main line. Freer, poorer."],
        ["bastard", "A bastard", "The blood without the name. Raised by your mother's people."],
      ]
        .map(o =>
          UI.opt(
            c.order === o[0],
            "crSet",
            "order:" + o[0],
            o[1],
            o[2],
            (c.race === "halfelf" || c.race === "halforc") && o[0] !== "bastard",
          ),
        )
        .join("")}</div></div>`;
    const bl = c.house ? A.houseBloodline(c.house) : null;
    if (bl) {
      const B = GD.BLOOD[bl.id];
      h += `<div class="field"><label>The blood of ${UI.esc(bl.name)}</label><div class="card"><div><span class="chip blood">${UI.esc(B ? B.short : "")}</span> <b>${UI.esc(bl.trait)}</b></div><div class="small" style="margin:4px 0">${UI.esc(bl.inherit)}</div><div class="small bad">Price: ${UI.esc(bl.cost)}</div></div>
      <div class="opt-grid" style="margin-top:6px">${[
        ["blood", "Let the blood decide", "Real inheritance odds. You may or may not carry it."],
        ["carrier", "Born with the blood", "The trait shows in you, with its gift and its price. (score ×0.85)"],
        ["none", "Spared the blood", "You do not carry it."],
      ]
        .map(o => UI.opt(c.bloodFate === o[0], "crSet", "bloodFate:" + o[0], o[1], o[2]))
        .join("")}</div></div>`;
    }
  }
  return h;
};

UI.crStepBody = function () {
  const c = UI.cr,
    cult = LORE.cultures[UI.crCult()],
    names = c.sex === "F" ? cult.f : cult.m,
    R2 = GD.RACES[c.race];
  let h = `<div class="field"><label>Sex</label><div class="row"><button class="${c.sex === "M" ? "primary" : ""}" data-a="crSet" data-v="sex:M">Male</button><button class="${c.sex === "F" ? "primary" : ""}" data-a="crSet" data-v="sex:F">Female</button></div></div>`;
  h += `<div class="field"><label>Given name</label><div class="row"><input data-c="crName" value="${UI.esc(c.given)}" placeholder="Type a name, or pick one" maxlength="24" style="flex:1" aria-label="Given name"><select data-c="crNamePick" aria-label="Pick a name"><option value="">Names of the ${UI.esc(cult.name)}…</option>${names.map(n => `<option>${UI.esc(n)}</option>`).join("")}</select><button data-a="crRandName">Random</button></div><div class="small muted" style="margin-top:4px">Your family name is not yours to choose. ${UI.esc((GD.NAMING[UI.crCult()] || {}).note || "")}</div></div>`;
  // [X1 baked patch ui/93-anime-portraits AP-SKINS] Character creation offers only the skin tones the chosen people
  // are drawn in (cycle 1 visual B4). A far people's portraits press the stored tone into their land's range, so a
  // pale swatch picked for a lake-folk woman was drawn dark in the game while the preview showed her pale.
  // UI.crSkinSet (anime.core.js) returns that range, or the race's whole row for the Known World.
  h += `<div class="field"><label>Skin</label><div class="swatches">${(UI.crSkinSet ? UI.crSkinSet(c) : GD.SKIN[c.race]).map(s => `<div class="sw ${c.app.skin === s ? "sel" : ""}" style="background:${s}" data-a="crApp" data-v="skin:${s}"></div>`).join("")}</div></div>`;
  h += `<div class="field"><label>Hair</label><div class="swatches">${GD.HAIR.map((s, i) => `<div class="sw ${c.app.hair === i ? "sel" : ""}" title="${GD.HAIR_NAMES[i]}" style="background:${s}" data-a="crApp" data-v="hair:${i}"></div>`).join("")}</div>
    <div class="row" style="margin-top:6px">${GD.HAIRSTYLES.map(s => `<button class="small ${c.app.hstyle === s ? "primary" : ""}" data-a="crApp" data-v="hstyle:${s}">${s}</button>`).join("")}</div></div>`;
  h += `<div class="field"><label>Eyes</label><div class="swatches">${GD.EYES.map((s, i) => `<div class="sw ${c.app.eye === i ? "sel" : ""}" title="${GD.EYE_NAMES[i]}" style="background:${s}" data-a="crApp" data-v="eye:${i}"></div>`).join("")}</div></div>`;
  if (c.sex === "M" && c.race !== "elf")
    h += `<div class="field"><label>Beard</label><div class="row">${GD.BEARDS.map(s => `<button class="small ${c.app.beard === s ? "primary" : ""}" data-a="crApp" data-v="beard:${s}">${s}</button>`).join("")}</div></div>`;
  h += `<div class="field"><label>Build</label><div class="row">${GD.BUILDS.map(s => {
    const fx = GD.BUILD_FX[s] || {},
      t = Object.entries(fx)
        .map(([k, v]) => (v > 0 ? "+" : "") + v + " " + GD.STAT_SHORT[k])
        .join(", ");
    return `<button class="small ${c.app.build === s ? "primary" : ""}" title="${t || "no change"}" data-a="crApp" data-v="build:${s}">${s}${t ? ' <span class="tiny muted">' + t + "</span>" : ""}</button>`;
  }).join("")}</div></div>`;
  const base = c.sex === "F" ? R2.height[0] : R2.height[1];
  h += `<div class="field"><label>Height (grown): <span id="hval">${c.app.height} cm</span></label><input type="range" min="${Math.round(base - R2.hsd * 3)}" max="${Math.round(base + R2.hsd * 3)}" value="${c.app.height}" data-c="crHeight" style="width:100%" aria-label="Height in centimetres"></div>`;
  h += `<div class="field"><label>Face</label><div class="row">${[0, 1, 2, 3].map(i => `<button class="small ${c.app.face === i ? "primary" : ""}" data-a="crApp" data-v="face:${i}">Shape ${i + 1}</button>`).join("")} ${[0, 1, 2].map(i => `<button class="small ${c.app.brow === i ? "primary" : ""}" data-a="crApp" data-v="brow:${i}">Brow ${i + 1}</button>`).join("")} ${[0, 1, 2].map(i => `<button class="small ${c.app.mouth === i ? "primary" : ""}" data-a="crApp" data-v="mouth:${i}">Mouth ${i + 1}</button>`).join("")}</div></div>`;
  h += `<div class="field"><label>Eyes & nose</label><div class="row">${GD.EYE_SHAPES.map((n, i) => `<button class="small ${(c.app.eyeShape || 0) === i ? "primary" : ""}" data-a="crApp" data-v="eyeShape:${i}">${n} eyes</button>`).join("")} ${GD.NOSES.map((n, i) => `<button class="small ${(c.app.nose || 0) === i ? "primary" : ""}" data-a="crApp" data-v="nose:${i}">${n} nose</button>`).join("")} <button class="small ${c.app.freckles ? "primary" : ""}" data-a="crApp" data-v="freckles:${c.app.freckles ? 0 : 1}">Freckles</button></div></div>`;
  h += `<div class="field"><label>Marks & paint</label><div class="row">${GD.PAINTS.map(p => `<button class="small ${(c.app.paint || "none") === p ? "primary" : ""}" data-a="crApp" data-v="paint:${p}">${GD.PAINT_NAMES[p]}</button>`).join("")}</div></div>`;
  h += `<div class="field"><label>Jewelry</label><div class="row">${GD.JEWELS.map(p => `<button class="small ${(c.app.jewel || "none") === p ? "primary" : ""}" data-a="crApp" data-v="jewel:${p}">${p === "none" ? "None" : p === "nosering" ? "Nose ring" : A.cap(p)}</button>`).join("")}</div></div>`;
  return h;
};

UI.crStepGifts = function () {
  const c = UI.cr;
  let h = `<div class="field"><label>Potential</label><p class="small muted" style="margin:0 0 6px">Potential is the ceiling your stats can grow toward with training, age and adversity. Willpower can break past it.</p><div class="opt-grid">${[
    ["fate", "Let fate decide", "Your parents' blood and luck. (×1.0)"],
    ["humble", "Humble gifts", "Below average potential. A harder life. (×1.25)"],
    ["gifted", "Gifted", "Above average potential. (×0.85)"],
    ["prodigy", "Prodigy", "Rare talent across the board. (×0.7)"],
    ["custom", "Shape your potential", "Spend points across the six stats. (×0.8)"],
  ]
    .map(m => UI.opt(c.potMode === m[0], "crSet", "potMode:" + m[0], m[1], m[2]))
    .join("")}</div></div>`;
  if (c.potMode === "custom") {
    const used = GD.STATS.reduce((a, s) => a + c.pot[s], 0),
      budget = 290;
    h += `<div class="field"><label>Points: ${used} / ${budget}</label>${GD.STATS.map(s => `<div class="statslider"><span>${GD.STAT_NAMES[s]}</span><input type="range" min="15" max="90" value="${c.pot[s]}" data-c="crPot" data-k="${s}" aria-label="${GD.STAT_NAMES[s]} potential"><b>${c.pot[s]}</b></div>`).join("")}<div class="small muted">${used > budget ? '<span class="bad">Over budget — lower something.</span>' : "Racial bonuses are added on top."}</div></div>`;
  }
  h += `<div class="field"><label>How you grew up (build)</label><div class="opt-grid">${Object.entries(GD.ARCHETYPES)
    .map(([k, a]) => {
      const st = Object.entries(a.st)
          .map(([x, v]) => (v > 0 ? "+" : "") + v + " " + GD.STAT_SHORT[x])
          .join(", "),
        sk = Object.keys(a.sk)
          .map(x => GD.SKILLS[x])
          .join(", ");
      return UI.opt(
        (c.arch || "balanced") === k,
        "crSet",
        "arch:" + k,
        a.name,
        `${UI.esc(a.desc)}${st ? '<br><span class="muted">' + st + "</span>" : ""}${sk ? '<br><span class="apt">★ ' + UI.esc(sk) + "</span>" : ""}`,
      );
    })
    .join("")}</div></div>`;
  const aptSel = i => {
    const cur = (c.aptPick || [])[i] || "";
    return `<select data-c="crApt" data-k="${i}" aria-label="${i === 0 ? "First talent" : "Second talent"}"><option value="">${i === 0 ? "First talent…" : "Second talent…"}</option>${Object.entries(
      GD.SKILL_CATS,
    )
      .map(
        ([cat, ks]) =>
          `<optgroup label="${cat}">${ks.map(k => `<option value="${k}" ${cur === k ? "selected" : ""}>${GD.SKILLS[k]}</option>`).join("")}</optgroup>`,
      )
      .join("")}</select>`;
  };
  h += `<div class="field"><label>Natural talents (up to 2 — you learn these 1.5× faster; others are rolled by your blood and family)</label><div class="row">${aptSel(0)} ${aptSel(1)}</div><div class="tiny muted">Each chosen talent lowers the score multiplier a little (×0.93).</div></div>`;
  h += `<div class="field"><label>Nature (up to 3 traits — leave empty for a random nature)</label><div class="row">${Object.keys(
    GD.TRAITS,
  )
    .map(t => {
      const T = GD.TRAITS[t],
        on = c.traits.includes(t),
        blocked = !on && (c.traits.length >= 3 || (T.opp && c.traits.includes(T.opp)));
      return `<button class="small ${on ? "primary" : ""}" ${blocked ? "disabled" : ""} title="${UI.esc(T.desc)}" data-a="crTrait" data-v="${t}">${T.name}</button>`;
    })
    .join("")}</div></div>`;
  h += `<div class="field"><label>Quirks of body (up to 2 — or leave to chance)</label><div class="row">${Object.keys(
    GD.QUIRKS,
  )
    .map(q => {
      const Q = GD.QUIRKS[q],
        on = c.quirks.includes(q);
      return `<button class="small ${on ? "primary" : ""}" ${!on && c.quirks.length >= 2 ? "disabled" : ""} title="${UI.esc(Q.desc)}" data-a="crQuirk" data-v="${q}">${Q.name}</button>`;
    })
    .join("")}</div></div>`;
  return h;
};

UI.crStepBegin = function () {
  const c = UI.cr,
    R2 = GD.RACES[c.race];
  let h = `<div class="field"><label>Where your story starts</label><div class="opt-grid">${[
    [0, "Newborn", "Live it all, from the first winter."],
    [Math.round(R2.adult * 0.55), "A child", `Start at ${Math.round(R2.adult * 0.55)}.`],
    [R2.adult, "Coming of age", `Start at ${R2.adult}, grown by your people's law.`],
    [
      R2.adult + Math.round(R2.adult * 0.4),
      "Grown",
      `Start at ${R2.adult + Math.round(R2.adult * 0.4)}, with some skills.`,
    ],
  ]
    .map(a => UI.opt(c.startAge === a[0], "crSet", "startAge:" + a[0], a[1], a[2]))
    .join("")}</div></div>`;
  // [X1 baked patch core/42-difficulty DIFF-SAYS] The creation screen described each setting by its deaths alone. It
  // now says what it does to the odds you see and to recovery.
  // [X1 baked patch events/97-first-life-fixes LF-FIRST-LIFE-SAYS] The creation screen says, under the difficulty,
  // that a first life is spared the deaths of early childhood on Story and Hard.
  h += `<div class="field"><label>Difficulty</label><div class="opt-grid">${[
    [
      "story",
      "Story",
      "Childhood is safe; fewer deaths in fights. Every choice shows its odds; wounds, illness and prison pass quickly. (×0.6)",
    ],
    [
      "hard",
      "Hard",
      "The world is dangerous, but not cruel to children. Odds as you set them; ordinary recovery. (×1.0)",
    ],
    [
      "realism",
      "Realism",
      "Historical mortality. Two in five children die. Odds only in words; wounds linger and sentences run long. (×1.35)",
    ],
  ]
    .map(d => UI.opt(c.diff === d[0], "crSet", "diff:" + d[0], d[1], d[2]))
    .join("")}</div>${UI.lfFirstLine ? UI.lfFirstLine(c) : ""}</div>`;
  h += `<div class="field"><label>World</label><div class="opt-grid">${[
    ["varied", "Varied", "Fortunes, borders, feuds and alliances differ each run."],
    ["canon", "As written", "The world as the old maps show it."],
  ]
    .map(d => UI.opt((c.world || "varied") === d[0], "crSet", "world:" + d[0], d[1], d[2]))
    .join("")}</div></div>`;
  h += `<div class="field"><label>World seed (optional)</label><input data-c="crSeed" aria-label="World seed" value="${UI.esc(c.seed)}" placeholder="random" style="width:200px"> <span class="small muted">The same seed and choices give the same world.</span></div>`;
  h +=
    '<div class="card lore-text" style="margin-top:10px">Every run differs: the wars of 1105 may or may not break out, kings live or die, provinces change hands, and your own blood, nature and luck are rolled fresh.</div>';
  // [X1 baked patch map/43-varied-worlds WORLD-CHOICE] The creation screen offers the choice next to the world seed:
  // a varied world, or the world as written.
  return h;
};

UI.crRandomize = function () {
  A.seed(Date.now() % 1e9);
  const c = UI.crDefaults();
  c.race = A.wpick(
    GD.RACE_LIST,
    r =>
      ({
        human: 10,
        elf: 1.5,
        dwarf: 1.5,
        orc: 1.5,
        giant: 0.5,
        halfelf: 1,
        halforc: 1,
      })[r],
  );
  const realms = Object.keys(LORE.realms).filter(r => A.raceAllowed(c.race, r));
  c.realm = A.pick(realms);
  c.status = A.wpick(
    GD.STATUS_LIST.filter(s => A.statusAllowed(s, c.race, c.realm)),
    s =>
      ({
        slave: 1,
        serf: 2,
        peasant: 6,
        artisan: 3,
        merchant: 1.5,
        gentry: 1,
        noble: 1,
        royal: 0.4,
      })[s],
  );
  c.sex = A.chance(0.5) ? "M" : "F";
  // [X1 baked patch family/99994-v2-family V2F-RANDOMIZE] UI.crRandomize drew a birth position with the rest of a
  // random character. There is none to draw now.
  c.order = null;
  UI.cr = c;
  UI.crFix();
  const cult = LORE.cultures[UI.crCult()];
  c.given = A.pick(c.sex === "F" ? cult.f : cult.m);
  c.app.hair = A.ri(0, 8);
  c.app.eye = A.ri(0, 7);
  c.app.hstyle = A.pick(GD.HAIRSTYLES);
  c.app.build = A.pick(GD.BUILDS);
  c.app.skin = A.pick(GD.SKIN[c.race]);
  if (c.sex === "M" && c.race !== "elf") c.app.beard = A.pick(GD.BEARDS);
  UI.crFix();
};

// [X1 baked patch core/05-saves-and-keyboard SAVE-NEW-LIFE-CONFIRM] Starting a new life (Begin or Random) gave no
// warning, and three yearly autosaves later the previous life had rotated out of all backups. If the saved life is
// still going, the game now asks first and says how to keep it.
UI.startLife = function () {
  if (!UI._newLifeOk) {
    const cur = (SAVES.listCache || []).find(x => x && x.slot === "cur"),
      m = cur && cur.meta;
    if (m && m.alive) {
      UI.confirm({
        title: "Start a new life?",
        text: `Your saved life (${m.name || "unnamed"}, age ${m.age}, ${m.year} AR) is still going. This browser keeps one life: after a few years of the new one, autosaves will push the old one out. To keep it, go back, continue it, and use Menu → Export first.`,
        yes: "Start the new life",
        danger: true,
        run: () => {
          UI._newLifeOk = true;
          try {
            UI.startLife();
          } finally {
            UI._newLifeOk = false;
          }
        },
      });
      return;
    }
  }
  const c = UI.cr;
  if (c.potMode === "custom" && GD.STATS.reduce((a, s) => a + c.pot[s], 0) > 290) {
    UI.toast("Your potential is over budget.");
    return;
  }
  const seed = c.seed
      ? Array.from(String(c.seed)).reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7)
      : Date.now() % 2147483647,
    apt = {};
  for (const k of (c.aptPick || []).filter(Boolean)) apt[k] = 1.5;
  // [X1 baked patch events/29-starting-stories START-OPTION] UI.startLife builds the options for A.newGame from the
  // creation screen. It now adds story: A.storyFor(c), the chosen starting story if the birth still matches it;
  // starts.core.js applies it after the world is made.
  // [X1 baked patch map/43-varied-worlds WORLD-DEFAULT] A game started from the menu now asks for a varied world by
  // default (A.WORLDS); the creation state carries the choice.
  // [X1 baked patch events/97-first-life-fixes LF-FIRST-LIFE] On Hard, the default, one newborn in twenty died
  // before five, before the player had made a choice. The creation screen now tells the engine whether this is the
  // first life begun in this browser (o.firstLife, so a replay of the journal does the same), and the engine spares
  // a first life the deaths of early childhood unless Realism was chosen.
  const o = {
    arch: c.arch || "balanced",
    apt,
    seed,
    race: c.race,
    realm: c.realm,
    home: c.home === "" || c.home == null ? null : +c.home,
    status: c.status,
    house: c.house,
    order: c.order,
    bloodFate: c.bloodFate,
    sex: c.sex,
    given: (c.given || "").trim() || null,
    potMode: c.potMode,
    pot: c.pot,
    traits: c.traits,
    quirks: c.quirks,
    startAge: c.startAge,
    diff: c.diff,
    world: c.world || "varied",
    app: Object.assign({}, c.app),
    story: A.storyFor ? A.storyFor(c) : null,
  };
  if (UI.lfStartOpts) UI.lfStartOpts(o, c);
  A.newGame(o);
  UI.screen = "game";
  UI.tab = "life";
  UI.ov = null;
  MAP.overlayCache = null;
  if (UI.set.autosave) UI.save(true);
  UI.render();
};

UI.renderGame = function () {
  const phone = UI.isPhone();
  UI.setTab(UI.tab);
  const g = UI.groupOf(UI.tab),
    lab = UI.subsOf(g).length > 1 ? "sub-" + UI.tab : "tab-" + g.k;
  return `<div id="game" class="${phone ? "phone" : ""}">
    <header id="topbar" class="panel">${UI.renderTop()}</header>
    ${
      phone
        ? ""
        : `<aside id="profile" class="panel" aria-label="You">${UI.renderProfile()}</aside>
    <section id="logwrap" class="panel" aria-label="Your story">${UI.renderLogWrap()}</section>`
    }
    <main id="side" class="panel"><nav id="tabs" aria-label="${phone ? "Pages" : "Sections"}">${UI.renderTabBar()}</nav><div id="tabbody" role="tabpanel" tabindex="-1" aria-labelledby="${lab}">${UI.renderTab()}</div></main>
    ${phone ? `<nav id="bnav" aria-label="Sections">${UI.renderGroupBar(true)}</nav>` : ""}
  </div>`;
};

UI.renderProfile = function () {
  const pc = A.pc();
  if (!pc) return "";
  const st = A.stats(pc),
    R2 = GD.RACES[pc.race],
    cult = A.culture(pc.cult),
    fa = A.faith(pc.faith),
    h = pc.house ? A.house(pc.house) : null,
    bdef = A.bloodDef(pc);
  let chips = `<span class="chip">${UI.esc(R2.name)}</span><span class="chip">${UI.esc(cult ? cult.name : "")}</span><span class="chip" title="${UI.esc(fa ? fa.belief : "")}">${UI.esc(fa ? fa.name : "No faith")}</span>`;
  if (
    (h &&
      (chips += `<span class="chip gold click" data-a="ov" data-v="house:${h.id}" title="${UI.esc(h.notes || "")}">${PORTRAIT.coat(h, 14)} ${UI.esc(h.name)}</span>`),
    pc.flags.bastard &&
      (chips += `<span class="chip">Bastard of ${UI.esc((A.house(pc.flags.bloodOf) || {}).name || "a great house")}</span>`),
    pc.blood)
  ) {
    const L = LORE.blood && null,
      BL = LORE.bloodlines[pc.blood.id];
    chips += `<span class="chip blood" title="${UI.esc(BL ? BL.trait + " — Price: " + BL.cost : "")}">${UI.esc(bdef ? bdef.short : "")}${pc.blood.show || (bdef && bdef.mode === "x") ? "" : " (carrier)"}</span>`;
  }
  for (const t of pc.traits)
    if (GD.TRAITS[t]) chips += `<span class="chip" title="${UI.esc(GD.TRAITS[t].desc)}">${GD.TRAITS[t].name}</span>`;
  for (const q of pc.quirks)
    if (GD.QUIRKS[q]) chips += `<span class="chip" title="${UI.esc(GD.QUIRKS[q].desc)}">${GD.QUIRKS[q].name}</span>`;
  if (pc.flags.chain)
    chips += `<span class="chip gold" title="Trained in a named chain of masters">${UI.esc(pc.flags.chain)}</span>`;
  if (A.isAdult(pc) && UI.tierChip) chips += UI.tierChip(pc);
  const mh = A.maxHealth(pc);
  let s = `<div class="portrait-wrap">${UI.portrait(pc, 176)}</div>
    <div class="pname">${UI.esc(A.fullName(pc))}</div>
    <div class="ptitle">${UI.esc(UI.titleLine(pc))}</div>
    <div class="center" style="margin-bottom:6px">${chips}</div>`;
  s += UI.barRow("Health", pc.health, 100, "hpbar", mh, Math.round(pc.health));
  s += UI.barRow("Happiness", pc.happy, 100);
  s += UI.barRow("Looks", pc.looks, 100);
  s += UI.barRow("Renown", pc.fame, 100);
  s += UI.barRow("Honor", pc.honor, 100);
  s += UI.barRow("Piety", pc.piety, 100);
  s += '<div class="sep"></div>';
  for (const k of GD.STATS) {
    const max = Math.max(100, pc.pot[k] + 5);
    s += UI.barRow(UI.tip("stat", k, GD.STAT_NAMES[k]), st[k], max, "statbar", pc.pot[k], st[k]);
  }
  s +=
    '<div class="tiny muted" style="margin:2px 0 6px">Tick = potential. Willpower rises through adversity and lets you adapt mid-fight to stronger foes.</div>';
  s += `<div class="group-h">Best proficiencies</div>${UI.topProfs(pc, 5)}`;
  s += `<div class="row"><button class="small grow" data-a="ov" data-v="profile">Full profile</button><button class="small grow" data-a="ov" data-v="tree">Family</button></div><div class="row" style="margin-top:4px"><button class="small grow" data-a="ov" data-v="profs">Proficiencies</button>${h ? `<button class="small grow" data-a="ov" data-v="house:${h.id}">${UI.esc(h.name.length > 18 ? "Your house" : h.name)}</button>` : ""}</div>`;
  return s;
};

UI.GROUPS = [
  {
    k: "life",
    name: "Life",
    icon: "sun",
    subs: [
      ["life", "Now"],
      ["goals", "Decisions"],
    ],
  },
  {
    k: "people",
    name: "People",
    icon: "users",
    subs: [["people", "People"]],
  },
  {
    k: "pathwar",
    name: "Path & War",
    short: "Path",
    icon: "swords",
    subs: [
      ["path", "Path"],
      ["war", "War"],
    ],
  },
  {
    k: "holdings",
    name: "Holdings",
    icon: "coins",
    subs: [["holdings", "Holdings"]],
  },
  {
    k: "realm",
    name: "Realm",
    icon: "crown",
    subs: [["realm", "Realm"]],
  },
  {
    k: "chronicle",
    name: "Chronicle",
    icon: "scroll",
    subs: [
      ["legacy", "Dynasty"],
      ["world", "World"],
      ["codex", "Codex"],
    ],
  },
];

UI.PHONE_SUBS = {
  life: [
    ["life", "Now"],
    ["story", "Story"],
    ["you", "You"],
    ["goals", "Decisions"],
  ],
};

UI.TAB_ALIAS = {
  work: "path",
};

UI.isPhone = () => typeof window < "u" && !!window.matchMedia && window.matchMedia("(max-width: 760px)").matches;

UI.subsOf = g => (UI.isPhone() && UI.PHONE_SUBS[g.k]) || g.subs;

UI.groupOf = tab => UI.GROUPS.find(g => UI.subsOf(g).some(s => s[0] === tab)) || UI.GROUPS[0];

UI.lastSub = {};

UI.subName = (k, n) => (k === "realm" ? (A.pc() && A.pc().ruler ? "Your realm" : "Court") : n);

UI.tabBadge = function (k, pc) {
  return pc && k === "war" && A.atWar(pc.realm).length ? "at war" : "";
};

UI.setTab = function (v) {
  v = UI.TAB_ALIAS[v] || v;
  if (!UI.isPhone() && (v === "story" || v === "you")) v = "life";
  const g = UI.groupOf(v);
  if (!UI.subsOf(g).some(s => s[0] === v)) v = UI.subsOf(g)[0][0];
  UI.tab = v;
  UI.lastSub[g.k] = v;
};

UI.renderGroupBar = function (bottom) {
  const pc = A.pc(),
    cur = UI.groupOf(UI.tab).k;
  return `<div class="tabbar${bottom ? " bottom" : ""}" role="tablist" aria-label="Sections">${UI.GROUPS.map(g => {
    const on = g.k === cur,
      badge = UI.subsOf(g)
        .map(s => UI.tabBadge(s[0], pc))
        .filter(Boolean)[0];
    return `<button role="tab" id="tab-${g.k}" class="${on ? "on" : ""}" data-a="group" data-v="${g.k}" aria-selected="${on}" aria-controls="tabbody" tabindex="${on ? 0 : -1}"${badge ? ` aria-description="${badge}"` : ""}>${UI.icon(g.icon, "s")}<span class="tl">${bottom && g.short ? g.short : g.name}</span>${badge ? '<span class="badge" aria-hidden="true">!</span>' : ""}</button>`;
  }).join("")}</div>`;
};

UI.renderSubBar = function () {
  const g = UI.groupOf(UI.tab),
    subs = UI.subsOf(g),
    pc = A.pc();
  return subs.length < 2
    ? ""
    : `<div class="subbar seg" role="tablist" aria-label="${UI.esc(g.name)} pages">${subs
        .map(([k, n]) => {
          const on = k === UI.tab,
            badge = UI.tabBadge(k, pc);
          return `<button role="tab" id="sub-${k}" class="${on ? "on" : ""}" data-a="tab" data-v="${k}" aria-selected="${on}" aria-controls="tabbody" tabindex="${on ? 0 : -1}">${UI.esc(UI.subName(k, n))}${badge ? '<span class="badge" aria-hidden="true">!</span>' : ""}</button>`;
        })
        .join("")}</div>`;
};

UI.renderTabBar = function () {
  return (UI.isPhone() ? "" : UI.renderGroupBar(false)) + UI.renderSubBar();
};

UI.focusTabPanel = function (fid) {
  const tb = UI.$("#tabbody");
  if ((tb && (tb.scrollTop = 0), UI.isPhone() && typeof window < "u" && window.scrollTo(0, 0), fid)) {
    const el = document.getElementById(fid);
    if (el) el.focus();
  }
};

UI.isControl = el =>
  !!(
    el &&
    el.closest &&
    el.closest(
      'button, a[href], summary, select, input, textarea, [role="tab"], [role="button"], [tabindex]:not([tabindex="-1"])',
    )
  );

UI.tabKeys = function (e) {
  const bar = e.target.closest && e.target.closest('[role="tablist"]');
  if (!bar) return false;
  const tabs = [...bar.querySelectorAll('[role="tab"]')],
    i = tabs.indexOf(e.target);
  if (i < 0) return false;
  const k = {
    ArrowRight: 1,
    ArrowDown: 1,
    ArrowLeft: -1,
    ArrowUp: -1,
    Home: "first",
    End: "last",
  }[e.key];
  if (k == null) return false;
  e.preventDefault();
  const j = k === "first" ? 0 : k === "last" ? tabs.length - 1 : (i + k + tabs.length) % tabs.length;
  tabs[j].click();
  return true;
};

UI.renderTab = function () {
  const pc = A.pc();
  if (!pc) return "";
  if (UI.tab === "story") return `<div class="phone-log">${UI.renderLogWrap()}</div>`;
  if (UI.tab === "you") return `<div class="phone-profile">${UI.renderProfile()}</div>`;
  const f = UI.TAB[UI.tab] || UI.TAB.life;
  try {
    return (UI.hintBox ? UI.hintBox(UI.tab, pc) : "") + f(pc);
  } catch (e) {
    console.error(e);
    return '<p class="bad">Something went wrong drawing this tab.</p>';
  }
};

UI.TAB = {};

UI.relGroups = {
  family: [
    "mother",
    "father",
    "sibling",
    "child",
    "spouse",
    "grandparent",
    "grandchild",
    "cousin",
    "uncle",
    "nephew",
    "inlaw",
    "ex",
  ],
  love: ["lover", "betrothed"],
  friends: ["friend", "bestfriend", "mentor", "student"],
  foes: ["rival", "enemy"],
  comrades: ["comrade"],
  others: ["acquaint"],
};

UI.peopleList = function (pc) {
  const rels = A.relsOf(pc).filter(
      x => x.p.alive || ["mother", "father", "spouse", "child", "sibling"].includes(x.r.type),
    ),
    names = {
      family: "Family",
      love: "Love",
      friends: "Friends & mentors",
      foes: "Rivals & enemies",
      comrades: "Comrades",
      court: "Lords & court",
      others: "Acquaintances",
    };
  let h = "";
  for (const g in UI.relGroups) {
    // [X1 baked patch family/99994-v2-family V2F-PEOPLE-GROUP] UI.peopleList grouped people by rel.type, so a wife
    // whose bond had turned to "rival" was listed under Rivals. Kin and spouses now group under Family by the family
    // graph (A.V2F.groupType), whatever the bond.
    let list = rels.filter(x =>
      UI.relGroups[g].includes(A.V2F && A.V2F.groupType ? A.V2F.groupType(pc, x.p, x.r) : x.r.type),
    );
    if (list.length) {
      list = list.sort((a, b) => b.p.alive - a.p.alive || b.r.op - a.r.op);
      h += `<div class="group-h">${names[g]} (${list.length})</div>`;
      for (const { p, r } of list.slice(0, g === "others" ? 30 : 60)) {
        const op = r.op || 0;
        h += `<div class="card person click" data-a="ov" data-v="person:${p.id}"><div class="pp">${PORTRAIT.svg(p, 46)}</div><div><div class="nm">${UI.esc(A.fullName(p))}${p.alive ? "" : ' <span class="muted">†' + p.died + "</span>"}</div><div class="sub">${UI.esc(A.relLabel(p, r))} · ${A.age(p)} · ${UI.esc(p.alive ? UI.titleLine(p) || p.occ || "" : "died of " + (p.cause || "?"))}</div></div><div class="opbar" title="Opinion ${Math.round(op)}">${UI.bar((op + 100) / 2, 100, op < 0 ? "hpbar" : "")}</div></div>`;
      }
    }
  }
  if (!h) h = '<p class="muted">You know no one yet. Go and make friends.</p>';
  return h;
};

UI.courtTabBasic = function (pc) {
  const r = A.realm(pc.noble ? pc.noble.realm : pc.realm),
    ru = r ? A.P(r.ruler) : null;
  let h = `<h3>The court of ${UI.esc(r ? r.name : "")}</h3>`;
  if (ru)
    h += `<div class="card person click" data-a="ov" data-v="person:${ru.id}"><div class="pp">${PORTRAIT.svg(ru, 46)}</div><div><div class="nm">${UI.esc(A.rulerStyle(ru, r))}</div><div class="sub">${A.age(ru)} · their opinion of you: ${Math.round(A.opinion(ru, pc))}</div></div></div>`;
  h += `<div class="kv small" style="margin-top:8px"><div>Your rung</div><div>${pc.noble ? UI.esc(A.nobleTitle(pc)) : "none (yet)"}</div>${pc.office ? `<div>Office</div><div>${UI.esc(A.COUNCIL[pc.office].name)}</div>` : ""}</div>`;
  h += `<div class="acts" style="margin-top:8px">
    <button class="act" data-a="nAct" data-v="court"><span class="cost">1⧗</span><div class="an">Attend court</div><div class="ad">Be seen. Make friends and enemies.</div></button>
    <button class="act" data-a="nAct" data-v="petition"><span class="cost">1⧗</span><div class="an">Petition for advancement</div><div class="ad">Ask the crown to raise your rung.</div></button>
    <button class="act" data-a="nAct" data-v="office"><span class="cost">1⧗</span><div class="an">Seek a council seat</div><div class="ad">Chancellor, Marshal, Treasurer, Spymaster or Chaplain.</div></button>
    <button class="act" data-a="nAct" data-v="estate"><span class="cost">1⧗</span><div class="an">Manage your estate</div><div class="ad">Reeves, mills and rents.</div></button>
    <button class="act" data-a="act" data-v="plot_throne" ${A.canAct("plot_throne")[0] ? "" : "disabled"}><span class="cost">3⧗</span><div class="an">Plot for the throne</div><div class="ad">Treason, if it fails.</div></button></div>`;
  h += `<div class="group-h">The ladder (Part 12)</div><table class="t small"><tr><th>Rung</th><th>Holds</th></tr>${GD.NOBLE_RUNGS.slice()
    .reverse()
    .map(x => `<tr><td>${x.title}</td><td>${A.fmt(x.income)} suns/yr, levy ${A.fmt(x.levy)}</td></tr>`)
    .join("")}</table>`;
  return h;
};

UI.worldTabBasic = function (pc) {
  const v = UI.worldView;
  let h = `<div class="row" style="margin-bottom:8px">${[
    ["map", "Map"],
    ["realms", "Realms"],
    ["wars", "Wars"],
    ["news", "News"],
    ["history", "History"],
  ]
    .map(([k, n]) => `<button class="small ${v === k ? "primary" : ""}" data-a="wview" data-v="${k}">${n}</button>`)
    .join("")}</div>`;
  // [X1 baked patch world/26-belief-versus-truth BT-NEWS-NOTE] Far news is now set down as it was first told
  // (inflated counts) and corrected months later (belief.core.js). The world news list and the war room dispatches
  // add A.BT.newsNote(n) after each line: "(hearsay)" or "(the count ran high...)".
  if (v === "map") {
    // [X1 baked patch ui/59-descriptions TT-WORDS-NO-HOVER] UI: three lines of the release tell the player to hover
    // (the map caption, the "Underlined words" hint, the help page). Nothing opens on hover any more, so they say
    // press.
    h +=
      '<div class="mapwrap"><canvas id="worldmap" width="1050" height="675"></canvas></div><div class="row small muted" style="margin-top:4px">Tap or click a province for details and to select its realm. Hatched lands are occupied. Your home is ringed.<span class="right"></span><button class="small" data-a="ov" data-v="bigmap">Full map</button></div>';
    if (UI.mapHl) h += UI.realmCard(UI.mapHl);
  } else if (v === "realms") {
    const rs = Object.values(A.S.realms)
      .filter(r => r.alive)
      .sort((a, b) => b.pop - a.pop);
    h += '<table class="t"><tr><th>Realm</th><th>Ruler</th><th>People</th><th>Army</th><th>Stab.</th></tr>';
    for (const r of rs) {
      const ru = A.P(r.ruler);
      // [X1 baked patch diplomacy/99996-v2-diplomacy V2DIP-SEEN-REALMS] Playtest 1 #22: a peasant saw every realm's
      // people, army and stability as exact figures. What you know depends on who you are (A.V2DIP.seen,
      // knowledge.core.js): the World > Realms table, the realm card and the diplomacy card say it as an estimate or as
      // hearsay unless you rule that realm.
      h += `<tr class="click" data-a="realmSel" data-v="${r.id}"><td><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${r.color}"></span> ${UI.esc(r.name)}${A.atWar(r.id).length ? ' <span class="chip red">war</span>' : ""}</td><td class="small">${ru ? UI.esc(A.fullName(ru, false)) + " (" + A.age(ru) + ")" : "—"}</td><td>${UI.esc(A.V2DIP ? A.V2DIP.popText(r) : A.fmt(r.pop))}</td><td>${UI.esc(A.V2DIP ? A.V2DIP.armyText(r) : A.fmt(r.army))}</td><td>${UI.esc(A.V2DIP ? A.V2DIP.stabText(r) : Math.round(r.stability))}</td></tr>`;
    }
    h += "</table>";
    if (UI.mapHl) h += UI.realmCard(UI.mapHl);
  } else if (v === "wars") {
    if (!A.S.wars.length) h += '<p class="muted">Ardan is, for once, at peace.</p>';
    // [X1 baked patch war/23-after-action AAR-WAR-VIEWS] The two war views listed recent battles by name and year
    // only. Each now adds what decided it (A.aarWhy), as plain escaped text.
    for (const w of A.S.wars)
      h += `<div class="card"><b>${UI.esc(w.name)}</b> <span class="small muted">since ${w.start}</span><div class="small">${w.att.map(x => UI.esc(A.realmShort(x))).join(", ")} <i>against</i> ${w.def.map(x => UI.esc(A.realmShort(x))).join(", ")}</div>${UI.barRow("Attacker's score", (w.score + 100) / 2, 100, "", 50, Math.round(w.score))}<div class="tiny muted">${w.battles
        .slice(-4)
        .map(b => UI.esc(b.name + " " + b.y + (A.aarWhy ? A.aarWhy(b) : "")))
        .join(" · ")}</div></div>`;
  } else if (v === "news")
    h +=
      A.S.news
        .slice(0, 120)
        .map(
          n =>
            `<div class="small" style="margin:3px 0"><span class="muted">${n.y}</span> ${UI.esc(n.t)}<span class="tiny muted">${UI.esc(A.BT ? A.BT.newsNote(n) : "")}</span></div>`,
        )
        .join("") || '<p class="muted">No news yet.</p>';
  else {
    h +=
      '<div class="group-h">Since 1105</div>' +
      (A.S.history
        .slice()
        .reverse()
        .map(x => `<div class="small" style="margin:3px 0"><span class="muted">${x.y}</span> ${UI.esc(x.t)}</div>`)
        .join("") || '<p class="small muted">History is still being written.</p>');
    h +=
      '<div class="group-h">The wars of Ardan before 1105</div>' +
      LORE.wars
        .slice()
        .reverse()
        .map(
          w =>
            `<div class="small" style="margin:3px 0"><b>${UI.esc(w[1])}</b> <span class="muted">(${w[2]}–${UI.esc(w[3])})</span> ${UI.esc(w[4])}</div>`,
        )
        .join("");
  }
  return h;
};

UI.realmCard = function (rid) {
  const r = A.realm(rid);
  if (!r)
    return '<div class="card" style="margin-top:8px"><b>Unclaimed land</b><div class="small muted">Free Marches, steppe edges and wild coasts that no crown holds. A man with a company could make himself a lord here.</div></div>';
  const ru = A.P(r.ruler),
    pr = r.primer || {};
  // [X1 baked patch diplomacy/99996-v2-diplomacy V2DIP-SEEN-REALMS] Playtest 1 #22: a peasant saw every realm's
  // people, army and stability as exact figures. What you know depends on who you are (A.V2DIP.seen,
  // knowledge.core.js): the World > Realms table, the realm card and the diplomacy card say it as an estimate or as
  // hearsay unless you rule that realm.
  return `<div class="card" style="margin-top:8px"><h3 style="margin:0">${UI.esc(r.name)}</h3><div class="small muted">${UI.esc(r.gov || r.type || "")} · capital ${UI.esc(r.capital)} · ${UI.esc(A.V2DIP ? A.V2DIP.popText(r) : A.fmt(r.pop) + " people")} · army ${UI.esc(A.V2DIP ? A.V2DIP.armyText(r) : A.fmt(r.army))} · ${UI.esc(A.V2DIP ? A.V2DIP.stabText(r) : "stability " + Math.round(r.stability))}</div>
    ${ru ? `<div class="small" style="margin-top:4px"><b>${UI.esc(A.rulerStyle(ru, r))}</b>, ${A.age(ru)}${r.heir && A.P(r.heir) ? ` · heir: ${UI.esc(A.fullName(A.P(r.heir), false))}` : ""}</div>` : ""}
    <div class="lore-text" style="margin-top:4px">${UI.esc(pr.intro || "")}</div>${pr["people and land"] ? `<div class="small" style="margin-top:4px">${UI.esc(pr["people and land"])}</div>` : ""}${pr.strength ? `<div class="small">${UI.esc(pr.strength)}</div>` : ""}${pr.ties ? `<div class="small muted">${UI.esc(pr.ties)}</div>` : ""}
    <div class="small" style="margin-top:4px">Allies: ${
      r.allies
        .filter(x => A.realm(x))
        .map(x => UI.esc(A.realmShort(x)))
        .join(", ") || "—"
    } · Faith: ${UI.esc((A.faith(r.faith) || {}).name || "")}</div></div>`;
};

UI.codexBasic = function (pc) {
  const v = UI.codex;
  let h = `<div class="row" style="margin-bottom:8px">${[
    ["faiths", "Faiths"],
    ["bloodlines", "Bloodlines"],
    ["peoples", "Peoples"],
    ["beasts", "Bestiary"],
    ["schools", "Schools"],
    ["songs", "Songs & sayings"],
    ["families", "Houses & families"],
    ["secrets", "Secrets you know"],
  ]
    .map(([k, n]) => `<button class="small ${v === k ? "primary" : ""}" data-a="codex" data-v="${k}">${n}</button>`)
    .join("")}</div>`;
  if (v === "families") {
    const rid = UI.codexRealm || pc.realm;
    h += `<div class="row"><select data-c="codexRealm" aria-label="Realm">${Object.keys(LORE.realms)
      .map(id => `<option value="${id}" ${id === rid ? "selected" : ""}>${UI.esc(LORE.realms[id].name)}</option>`)
      .join("")}</select></div>`;
    const list = Object.values(A.S.houses).filter(
        x => x.realm === rid || (LORE.houses[x.id] && LORE.houses[x.id].realm === rid),
      ),
      groups = {};
    for (const x of list) {
      const k =
        x.great === false ? A.FAM_KIND_NAME[x.kind] || x.kind : x.kind === "royal" ? "Royal house" : "Great houses";
      (groups[k] = groups[k] || []).push(x);
    }
    for (const k of Object.keys(groups).sort(
      (a, b) =>
        (a === "Royal house" ? -2 : a === "Great houses" ? -1 : 0) -
        (b === "Royal house" ? -2 : b === "Great houses" ? -1 : 0),
    ))
      h += `<div class="group-h">${UI.esc(k)} (${groups[k].length})</div><div class="famlist" style="max-height:none">${groups[k].map(x => `<div class="card click small" data-a="ov" data-v="house:${x.id}"><div class="famcard">${PORTRAIT.coat(x, 30)}<div><b>${UI.esc(x.name)}</b><div class="tiny muted">${UI.esc(x.rank || (x.title && x.title !== "none" ? x.title : "") || "")}${x.seat ? " · " + UI.esc(x.seat) : ""}</div></div></div></div>`).join("")}</div>`;
  }
  if (
    (v === "faiths" &&
      (h += Object.values(LORE.faiths)
        .map(
          f =>
            `<div class="card"><b>${UI.esc(f.name)}</b> <span class="tag">${UI.esc(f.kind)}</span><div class="small muted">${UI.esc(f.followers)}</div><div class="lore-text">${UI.esc(f.belief)}</div><div class="small"><b>Afterlife:</b> ${UI.esc(f.afterlife)}</div><div class="small"><b>Rites:</b> ${UI.esc(f.rituals)}</div><div class="small"><b>Taboos:</b> ${UI.esc(f.taboos)}</div></div>`,
        )
        .join("")),
    v === "bloodlines" &&
      (h += Object.values(LORE.bloodlines)
        .map(
          b =>
            `<div class="card"><b>${UI.esc(b.name)}</b> <span class="chip blood">${UI.esc(GD.BLOOD[b.id] ? GD.BLOOD[b.id].short : "")}</span><div class="small">${UI.esc(b.trait)}</div><div class="small muted">${UI.esc(b.inherit)}</div><div class="small bad">Price: ${UI.esc(b.cost)}</div><div class="lore-text tiny">${UI.esc(b.story)}</div></div>`,
        )
        .join("")),
    v === "peoples" &&
      (h +=
        Object.entries(LORE.racesLore)
          .map(
            ([k, r]) =>
              `<div class="card"><b>${UI.esc(r.name)}</b><div class="small">${UI.esc(r.homelands)}</div><div class="small muted">Height ${UI.esc(r.height)} cm · adult ${UI.esc(r.adult)} · life ${UI.esc(r.life)} · ${UI.esc(r.fert)}</div></div>`,
          )
          .join("") +
        Object.values(LORE.cultures)
          .map(c => `<div class="card small"><b>${UI.esc(c.name)}</b> — ${UI.esc(c.home)}. ${UI.esc(c.note)}</div>`)
          .join("")),
    v === "beasts" &&
      (h += LORE.creatures
        .map(
          c =>
            `<div class="card"><b>${UI.esc(c.name)}</b> <span class="tag">${UI.esc(c.cat)}</span><div class="small muted">${UI.esc(c.habitat)} · ${UI.esc(c.size)}</div><div class="small"><b>Believed:</b> ${UI.esc(c.belief)}</div><div class="small"><b>True:</b> ${UI.esc(c.truth)}</div>${c.weak ? `<div class="small"><b>Weak points:</b> ${UI.esc(c.weak)}</div>` : ""}</div>`,
        )
        .join("")),
    v === "schools" &&
      (h += `<table class="t small"><tr><th>School</th><th>Where</th><th>Teaches</th><th>Master</th></tr>${LORE.schools.map(s => `<tr><td>${UI.esc(s.name)}</td><td>${UI.esc(s.place)}, ${UI.esc(s.realmName)}</td><td>${UI.esc(s.teaches)}</td><td>${UI.esc(s.master)}</td></tr>`).join("")}</table>`),
    v === "songs" &&
      (h +=
        LORE.songs
          .map(
            s =>
              `<div class="card"><b>${UI.esc(s[0])}</b> <span class="small muted">${UI.esc(s[1])}</span><div class="lore-text" style="white-space:pre-line;font-style:italic">${UI.esc(s[2])}</div></div>`,
          )
          .join("") +
        '<div class="group-h">Sayings</div>' +
        LORE.sayings
          .map(
            s =>
              `<div class="small" style="margin:4px 0"><b>${UI.esc(s[0])}</b> <span class="muted">— ${UI.esc(s[1])}.</span> ${UI.esc(s[2])}</div>`,
          )
          .join("")),
    v === "secrets")
  ) {
    const known = Object.keys(pc.flags).filter(k => /^rl_sec|^knows/.test(k));
    h += `<p class="small muted">Secrets surface through events, rumors and intrigue. The bible holds ${LORE.secrets.length}; you have touched ${known.length}.</p>`;
  }
  return h;
};

UI.A = {
  newLife() {
    UI.ensureWorld();
    UI.cr = UI.crDefaults();
    UI.step = 0;
    UI.screen = "create";
    UI.render();
  },
  randomLife() {
    UI.ensureWorld();
    UI.crRandomize();
    UI.startLife();
  },
  continue() {
    UI.continueGame();
  },
  loadSlot(v) {
    UI.continueGame(v);
  },
  import() {
    UI.importSave();
  },
  help() {
    UI.ov = {
      type: "help",
    };
    UI.renderModal();
  },
  toTitle() {
    UI.screen = "title";
    UI.render();
  },
  randomizeCr() {
    UI.crRandomize();
    UI.render();
  },
  crStep(v) {
    UI.step = +v;
    UI.render();
    window.scrollTo(0, 0);
  },
  crSet(v) {
    const i = v.indexOf(":"),
      k = v.slice(0, i);
    let val = v.slice(i + 1);
    if (k === "startAge") val = +val;
    if (k === "house" && !val) val = null;
    UI.cr[k] = val;
    if (k === "race" || k === "realm" || k === "status") {
      UI.cr.home = null;
      if (k !== "race") UI.cr.house = null;
    }
    if (k === "house" && val && UI.cr.order === "bastard" && UI.cr.status !== "noble" && UI.cr.status !== "royal")
      UI.cr.order = "younger";
    if (k === "sex") {
      UI.cr.given = "";
      UI.cr.app.hstyle = null;
      UI.cr.app.beard = null;
    }
    if (k === "race") {
      UI.cr.app.skin = null;
      UI.cr.app.height = null;
      UI.cr.app.beard = null;
      UI.cr.given = "";
    }
    UI.render();
  },
  crFamFilter(v) {
    UI.crFamFilter = v;
    UI.render();
  },
  crApp(v) {
    const [k, val] = v.split(":");
    UI.cr.app[k] = ["hair", "eye", "face", "brow", "mouth", "nose", "eyeShape"].includes(k)
      ? +val
      : k === "freckles"
        ? val === "1"
        : val;
    UI.render();
  },
  crTrait(v) {
    const t = UI.cr.traits,
      i = t.indexOf(v);
    if (i >= 0) t.splice(i, 1);
    else {
      if (t.length < 3) t.push(v);
    }
    UI.render();
  },
  crQuirk(v) {
    const t = UI.cr.quirks,
      i = t.indexOf(v);
    if (i >= 0) t.splice(i, 1);
    else {
      if (t.length < 2) t.push(v);
    }
    UI.render();
  },
  crRandName() {
    const cult = LORE.cultures[UI.crCult()];
    UI.cr.given = A.pick(UI.cr.sex === "F" ? cult.f : cult.m);
    UI.render();
  },
  startLife() {
    UI.startLife();
  },
  save() {
    UI.save();
  },
  menu() {
    UI.ov = {
      type: "menu",
    };
    UI.renderModal();
  },
  tab(v, el) {
    UI.setTab(v);
    UI.refreshTab();
    UI.focusTabPanel(el && el.closest('[role="tablist"]') ? "sub-" + UI.tab : null);
  },
  group(v, el) {
    const g = UI.GROUPS.find(x => x.k === v) || UI.GROUPS[0];
    UI.setTab(UI.lastSub[g.k] || UI.subsOf(g)[0][0]);
    UI.refreshTab();
    UI.focusTabPanel(el ? "tab-" + g.k : null);
  },
  logAll() {
    UI.logAll = true;
    const lw = UI.$("#logwrap");
    if (lw) lw.innerHTML = UI.renderLogWrap();
    else UI.refreshTab();
  },
  showDeath() {
    if (!A.S.queue.length)
      A.S.queue.push({
        type: "death",
      });
    UI.renderModal();
  },
  practice() {
    const el = UI.$("#practiceSel"),
      k = el ? el.value : null;
    UI.practiceK = k;
    // [X1 baked patch ui/59-descriptions TT-ACT-RESULT-WHOLE] UI: UI.A.act and UI.A.practice cut the answer of an
    // activity at 140 and 160 characters ("…") and showed it as a toast. The answer is now whole: 99998-click-open
    // puts it on the activity sheet; this keeps the release's own functions from cutting it when something calls them.
    const r = A.doActivity("practice", k);
    if (r && r.msg) UI.toast(r.msg);
    UI.refresh();
  },
  act(v) {
    const r = A.doActivity(v);
    // [X1 baked patch ui/59-descriptions TT-ACT-RESULT-WHOLE] UI: UI.A.act and UI.A.practice cut the answer of an
    // activity at 140 and 160 characters ("…") and showed it as a toast. The answer is now whole: 99998-click-open
    // puts it on the activity sheet; this keeps the release's own functions from cutting it when something calls them.
    if (r && r.msg) UI.toast(r.msg);
    UI.refresh();
  },
  ov(v) {
    const [t, id] = v.split(":");
    UI.ov = {
      type: t,
      id,
    };
    UI.renderModal();
  },
  closeOv() {
    UI.ov = null;
    UI.renderModal();
    UI.refresh();
  },
  int(v) {
    const [id, key] = v.split("|");
    let arg;
    if (key === "gift") {
      const el = UI.$("#giftAmt");
      arg = el ? +el.value : void 0;
    }
    if (key === "name_child") {
      const el = UI.$("#childName");
      arg = el ? el.value : "";
    }
    const r = A.interact(id, key, arg);
    if (r && r.msg) UI.toast(r.msg);
    if (A.S.queue.length) UI.ov = null;
    UI.refresh();
  },
  applyJob(v) {
    const r = A.applyJob(v);
    UI.toast(r.msg || (r.ok ? "Hired." : "Refused."));
    UI.refresh();
  },
  quitJob() {
    const r = A.quitJob();
    if (r.msg) UI.toast(r.msg);
    UI.refresh();
  },
  workHard() {
    const r = A.workHard();
    if (r.msg) UI.toast(r.msg);
    UI.refresh();
  },
  leaveSchool() {
    A.leaveSchool();
    UI.refresh();
  },
  lifestyle(v) {
    const r = A.setLifestyle(v);
    if (r && r.msg) UI.toast(r.msg);
    UI.refreshTab();
  },
  resign() {
    const r = A.resign();
    if (r.msg) UI.toast(r.msg);
    UI.refresh();
  },
  recruit(v) {
    const r = A.recruitCompany(+v);
    if (r.msg) UI.toast(r.msg);
    UI.refresh();
  },
  buyGear(v) {
    const r = A.buyGear(v);
    UI.toast(r.msg);
    UI.refresh();
  },
  sellGear(v) {
    A.sellGear(v);
    UI.refresh();
  },
  buyProp(v) {
    const r = A.buyProperty(v);
    if (r.msg) UI.toast(r.msg);
    UI.refresh();
  },
  sellProp(v) {
    A.sellProperty(+v);
    UI.refresh();
  },
  rBuild(v) {
    const sel = UI.$('[data-c="bProv"]'),
      prov = sel ? +sel.value : null,
      r = A.rulerAction("build", {
        prov,
        b: v,
      });
    if (r && r.msg) UI.toast(r.msg);
    UI.refresh();
  },
  nAct(v) {
    const r = A.nobleAction(v);
    if (r && r.msg) UI.toast(r.msg);
    UI.refresh();
  },
  wview(v) {
    UI.worldView = v;
    UI.refreshTab();
  },
  realmSel(v) {
    UI.mapHl = v;
    UI.refreshTab();
  },
  codex(v) {
    UI.codex = v;
    UI.refreshTab();
  },
};

UI.C = {
  codexRealm(el) {
    UI.codexRealm = el.value;
    if (UI.refreshTab) UI.refreshTab();
    else UI.refresh();
  },
  crApt(el) {
    UI.cr.aptPick = UI.cr.aptPick || [];
    UI.cr.aptPick[+el.dataset.k] = el.value;
    UI.render();
  },
  practiceSel(el) {
    UI.practiceK = el.value;
  },
  crRealm(el) {
    UI.cr.realm = el.value;
    UI.cr.home = null;
    UI.cr.house = null;
    UI.render();
  },
  crHome(el) {
    UI.cr.home = el.value;
    UI.render();
  },
  crName(el) {
    UI.cr.given = el.value.replace(/[<>]/g, "").slice(0, 24);
    UI.$(".create-side").innerHTML = UI.crSummary();
  },
  crNamePick(el) {
    if (el.value) {
      UI.cr.given = el.value;
      UI.render();
    }
  },
  crHeight(el) {
    UI.cr.app.height = +el.value;
    const hv = UI.$("#hval");
    if (hv) hv.textContent = el.value + " cm";
  },
  crPot(el) {
    UI.cr.pot[el.dataset.k] = +el.value;
    UI.render();
  },
  crSeed(el) {
    UI.cr.seed = el.value.slice(0, 30);
  },
  rArmy(el) {
    if (!A.myRealm()) return;
    A.rulerAction("army", +el.value);
    const t = UI.$("#armyT");
    if (t) t.textContent = A.fmt(+el.value);
  },
  rAppoint(el) {
    if (el.value) {
      A.rulerAction("appoint", {
        seat: el.dataset.k,
        pid: el.value,
      });
      UI.refresh();
    }
  },
  bProv(el) {
    UI.bProv = +el.value;
  },
  setOdds(el) {
    UI.set.odds = el.checked;
    UI.saveSettings();
    UI.renderModal();
  },
  setTheme(el) {
    UI.set.theme = el.value;
    UI.saveSettings();
  },
  setAuto(el) {
    UI.set.autosave = el.checked;
    UI.saveSettings();
  },
  setTx(el) {
    UI.set.tx = +el.value || 1;
    UI.saveSettings();
    UI.render();
  },
  setMapCb(el) {
    UI.set.mapCb = el.checked;
    UI.saveSettings();
    if (MAP.overlayCache !== void 0) MAP.overlayCache = null;
    UI.render();
  },
  setHints(el) {
    UI.set.hints = el.checked;
    if (el.checked) UI.set.hintsSeen = {};
    UI.saveSettings();
    UI.refreshTab();
  },
};

UI.NEEDS_CONTENT = ["randomLife", "startLife", "continue", "import", "contAs", "loadSlot"];

UI.init = function () {
  if (
    (UI.loadSettings(),
    A.journalStart(),
    UI.tipsInit && UI.tipsInit(),
    SAVES.init().then(
      has => {
        if (has && UI.screen === "title") UI.render();
      },
      e => console.error(e),
    ),
    MAP.init(),
    document.addEventListener("click", e => {
      const el = e.target.closest("[data-a]");
      if (!el || el.disabled) return;
      const f = UI.A[el.dataset.a];
      if (!f) return;
      e.preventDefault();
      const go = () => {
        if (UI.hintNote) UI.hintNote(el.dataset.a);
        try {
          f(el.dataset.v, el, e);
        } catch (err) {
          console.error(err);
          if (UI.noteError) UI.noteError(err, "click " + el.dataset.a);
          UI.toast("Something went wrong: " + err.message + " — Menu → Report a problem saves the details.", 5e3);
        }
      };
      if (window.ARDAN_CONTENT_READY === false && UI.NEEDS_CONTENT.includes(el.dataset.a)) {
        if (!UI.waitingContent) {
          UI.waitingContent = true;
          UI.toast("Still unpacking the archives… one moment.");
          window.addEventListener(
            "ardan-content",
            () => {
              UI.waitingContent = false;
              go();
            },
            {
              once: true,
            },
          );
        }
        return;
      }
      go();
      if (el.dataset.a === "evChoose" || el.dataset.a === "qChoice") UI.ptAnswered++;
      if (UI.ptTick) UI.ptTick(el.dataset.a);
      if (UI.RESUME_AFTER && UI.RESUME_AFTER.includes(el.dataset.a) && UI.clkResume) UI.clkResume();
    }),
    document.addEventListener("change", e => {
      const el = e.target.closest("[data-c]");
      if (el && UI.C[el.dataset.c]) {
        try {
          UI.C[el.dataset.c](el, e);
        } catch (err) {
          console.error(err);
        }
        if (UI.ptTick) UI.ptTick("change");
      }
    }),
    document.addEventListener("input", e => {
      const el = e.target.closest("[data-c]");
      if (el && ["crName", "crHeight"].includes(el.dataset.c)) UI.C[el.dataset.c](el, e);
    }),
    window.matchMedia)
  ) {
    const mq = window.matchMedia("(max-width: 760px)"),
      re = () => {
        if (UI.screen === "game") UI.render();
      };
    if (mq.addEventListener) mq.addEventListener("change", re);
    else {
      if (mq.addListener) mq.addListener(re);
    }
  }
  document.addEventListener("keydown", e => {
    if (
      !UI.tabKeys(e) &&
      (UI.trapFocus(e),
      !(e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") &&
        UI.screen === "game")
    ) {
      // [X1 baked patch core/05-saves-and-keyboard UI-KEYBOARD] Keyboard play. (1) The 1.5 s clock redraw and every
      // action rebuilt the tab with innerHTML, dropping focus to <body>; focus now returns to the same control, or to
      // the tab panel if that control is gone. (2) Enter then skipped time from <body>; it now skips time only when
      // nothing at all is focused. (3) 49 of 50 clickable cards and rows (people, realms, war-room rows, every
      // character-creation option) could not be reached by keyboard; every clickable element now gets tabindex and
      // role=button and answers Enter and Space. (4) The game saves when the tab is hidden or closed, so closing it no
      // longer loses up to a year.
      if (
        ((e.key === " " || e.key === "Enter") &&
          !UI.$("#modal") &&
          !UI.isControl(e.target) &&
          e.target === document.body &&
          (e.preventDefault(), UI.A.age()),
        /^[1-6]$/.test(e.key) && UI.$("#modal"))
      ) {
        const b = UI.$("#modal").querySelectorAll(".choices button:not(:disabled), .actbtns button:not(:disabled)")[
          +e.key - 1
        ];
        if (b) b.click();
      }
      if (e.key === "Escape" && UI.ov) UI.A.closeOv();
    }
  });
  // [X1 baked patch core/05-saves-and-keyboard UI-KEYBOARD] Keyboard play. (1) The 1.5 s clock redraw and every
  // action rebuilt the tab with innerHTML, dropping focus to <body>; focus now returns to the same control, or to
  // the tab panel if that control is gone. (2) Enter then skipped time from <body>; it now skips time only when
  // nothing at all is focused. (3) 49 of 50 clickable cards and rows (people, realms, war-room rows, every
  // character-creation option) could not be reached by keyboard; every clickable element now gets tabindex and
  // role=button and answers Enter and Space. (4) The game saves when the tab is hidden or closed, so closing it no
  // longer loses up to a year.
  if (UI.clockKeys) UI.clockKeys();
  UI.extras();
  UI.render();
};

UI.focusKey = () => {
  const el = document.activeElement;
  return !el || el === document.body || !el.closest || !el.closest("#app")
    ? null
    : {
        id: el.id || null,
        a: el.getAttribute("data-a"),
        v: el.getAttribute("data-v"),
        c: el.getAttribute("data-c"),
        k: el.getAttribute("data-k"),
        tip: el.getAttribute("data-tip"),
        inTab: !!el.closest("#tabbody"),
      };
};

UI.focusRestore = f => {
  if (!f) return;
  const ae = document.activeElement;
  if (ae && ae !== document.body && document.contains(ae)) return;
  const q = x => CSS.escape(x);
  const sel = f.id
    ? "#" + q(f.id)
    : f.a
      ? `[data-a="${q(f.a)}"]` + (f.v != null ? `[data-v="${q(f.v)}"]` : "")
      : f.c
        ? `[data-c="${q(f.c)}"]` + (f.k != null ? `[data-k="${q(f.k)}"]` : "")
        : f.tip
          ? `[data-tip="${q(f.tip)}"]`
          : null;
  let el = null;
  try {
    el = sel && document.querySelector(sel);
  } catch {}
  if (
    (!el &&
      f.inTab &&
      ((el = document.getElementById("tabbody")),
      el && !el.hasAttribute("tabindex") && el.setAttribute("tabindex", "-1")),
    el)
  )
    try {
      el.focus({
        preventScroll: true,
      });
    } catch {}
};

UI.extras = function () {
  if (UI._extras) return;
  UI._extras = true;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && UI.screen === "game" && A.S && UI.set.autosave) UI.save(true);
  });
  const up = () => {
    for (const el of document.querySelectorAll(
      "#app [data-a]:not(button):not(a):not(input):not(select):not(textarea):not(option):not([tabindex])",
    )) {
      el.setAttribute("tabindex", "0");
      if (!el.hasAttribute("role")) el.setAttribute("role", "button");
    }
  };
  new MutationObserver(up).observe(document.body, {
    childList: true,
    subtree: true,
  });
  up();
  document.addEventListener(
    "keydown",
    e => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const t = e.target;
      if (t && t.matches && t.matches("[data-a][role=button]:not(button)")) {
        e.preventDefault();
        e.stopImmediatePropagation();
        t.click();
      }
    },
    true,
  );
};

UI.TIPS = {};

UI.tip = (key, arg, label, cls) =>
  `<span class="tipt ${cls || ""}" data-tip="${key}:${UI.esc(String(arg))}" tabindex="0" role="button" aria-expanded="false" aria-haspopup="true">${label}</span>`;

UI.tipState = {
  open: [null, null],
  hideT: 0,
};

UI.tipEl = function (lvl) {
  let el = document.getElementById("tip" + lvl);
  if (!el) {
    el = document.createElement("div");
    el.id = "tip" + lvl;
    el.className = "tip-pop";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    el.hidden = true;
    document.body.appendChild(el);
  }
  return el;
};

UI.tipShow = function (anchor, lvl) {
  const spec = anchor.dataset.tip,
    i = spec.indexOf(":"),
    f = UI.TIPS[spec.slice(0, i)];
  if (!f) return;
  let html = "";
  try {
    html = f(spec.slice(i + 1));
  } catch (e) {
    console.error(e);
    return;
  }
  if (!html) return;
  if (lvl === 1) UI.tipHide(2);
  const prev = UI.tipState.open[lvl - 1];
  if (prev && prev !== anchor) prev.setAttribute("aria-expanded", "false");
  const el = UI.tipEl(lvl);
  el.innerHTML = html;
  el.hidden = false;
  el.classList.toggle("lvl2", lvl === 2);
  anchor.setAttribute("aria-expanded", "true");
  if (UI.hintUsed) UI.hintUsed.tip = 1;
  UI.tipState.open[lvl - 1] = anchor;
  const r = anchor.getBoundingClientRect(),
    W = window.innerWidth,
    H = window.innerHeight,
    w = Math.min(320, W - 16);
  el.style.width = w + "px";
  const h = el.offsetHeight,
    p1 = lvl === 2 ? UI.tipEl(1).getBoundingClientRect() : null;
  let x = lvl === 2 ? p1.right + 6 : r.left;
  if (x + w > W - 8) x = lvl === 2 && p1.left - w - 6 >= 8 ? p1.left - w - 6 : W - 8 - w;
  x = Math.max(8, x);
  let y = lvl === 2 ? r.top - 8 : r.bottom + 6;
  if (y + h > H - 8) y = Math.max(8, lvl === 2 ? H - 8 - h : r.top - 6 - h);
  el.style.left = x + "px";
  el.style.top = y + "px";
};

UI.tipHide = function (lvl) {
  for (const l of lvl === 1 ? [2, 1] : [lvl]) {
    const el = document.getElementById("tip" + l);
    if (el) el.hidden = true;
    const a = UI.tipState.open[l - 1];
    if (a) a.setAttribute("aria-expanded", "false");
    UI.tipState.open[l - 1] = null;
  }
};

UI.tipLevel = el => (el.closest("#tip1") ? 2 : el.closest("#tip2") ? 0 : 1);
