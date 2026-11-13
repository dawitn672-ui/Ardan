// The release's core, saves: SAVES: saving and loading.
// Readable source of vendor/ardan-b593143.html with the patch layer baked in (X1, docs/DECISIONS.md D-028). Edit it here.
// Defines: SAVES, SAVES.gzip, SAVES.gunzip, SAVES.b64, SAVES.meta, SAVES.encode, SAVES.decode, SAVES.open,
// SAVES.lsGet, SAVES.lsSet, SAVES.get, SAVES.put, SAVES.clear, SAVES.save, SAVES.loadBest, SAVES.load, SAVES.list,
// SAVES.lock, SAVES.init.

const SAVES = {
  FMT: 2,
  DB: "ardan",
  STORE: "slots",
  SLOTS: ["cur", "bak1", "bak2", "bak3"],
  LS: "ardan.slot.",
  OLD: "ardan.save.v8",
  db: null,
  where: null,
  has: false,
};

SAVES.gzip = async function (text) {
  return new Uint8Array(
    await new Response(new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer(),
  );
};

SAVES.gunzip = async function (bytes) {
  return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"))).text();
};

SAVES.b64 = {
  enc(u) {
    let s = "";
    for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768));
    return btoa(s);
  },
  dec(str) {
    const s = atob(str),
      u = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
    return u;
  },
};

SAVES.meta = function (S) {
  const pc = S.people && S.people[S.pc];
  return {
    name: pc ? `${pc.given}${pc.sur ? " " + pc.sur : ""}` : "",
    age: pc ? S.year - pc.born : 0,
    alive: !!(pc && pc.alive),
    year: S.year,
    gen: S.gen || 1,
    at: Date.now(),
    ver: A.SAVE_VER,
  };
};

SAVES.encode = async function (S, J) {
  S = S || A.S;
  if (S === A.S) S.rng = A.rngState;
  const state = JSON.stringify(A.packState ? A.packState(S) : S),
    journal = JSON.stringify(J || null),
    meta = SAVES.meta(S),
    head = JSON.stringify({
      fmt: SAVES.FMT,
      ver: A.SAVE_VER,
      meta,
      n: state.length,
      sum: A.fingerprint(state),
      jsum: A.fingerprint(journal),
    });
  return {
    bytes: await SAVES.gzip(
      head +
        `
` +
        state +
        `
` +
        journal,
    ),
    meta,
  };
};

SAVES.decode = async function (data) {
  if (data == null) throw new Error("there is no save");
  let text;
  if (
    (typeof ArrayBuffer < "u" && data instanceof ArrayBuffer && (data = new Uint8Array(data)),
    data instanceof Uint8Array
      ? (text = data[0] === 31 && data[1] === 139 ? await SAVES.gunzip(data) : new TextDecoder().decode(data))
      : (text = String(data)),
    text.startsWith("GZ1:") && (text = await SAVES.gunzip(SAVES.b64.dec(text.slice(4)))),
    text.startsWith('{"fmt":'))
  ) {
    const a = text.indexOf(`
`),
      b = text.indexOf(
        `
`,
        a + 1,
      );
    if (a < 0 || b < 0) throw new Error("the save is cut short");
    const head = JSON.parse(text.slice(0, a));
    if (head.fmt > SAVES.FMT) throw new Error("the save was made by a newer version of the game");
    const state = text.slice(a + 1, b),
      journal = text.slice(b + 1);
    if (state.length !== head.n || A.fingerprint(state) !== head.sum) throw new Error("the save is damaged");
    let J = null;
    try {
      if (A.fingerprint(journal) === head.jsum) J = JSON.parse(journal);
    } catch {
      J = null;
    }
    let S2 = JSON.parse(state);
    if (S2 && S2.packed && A.unpackState) S2 = A.unpackState(S2);
    return {
      S: S2,
      J,
      meta: head.meta,
      fmt: head.fmt,
    };
  }
  let S = JSON.parse(text);
  if ((S && S.packed && A.unpackState && (S = A.unpackState(S)), !S || !S.people || !S.pc))
    throw new Error("this is not an Ardan save");
  return {
    S,
    J: null,
    meta: SAVES.meta(S),
    fmt: 1,
  };
};

SAVES.open = function () {
  return SAVES.db || SAVES.where === "local"
    ? Promise.resolve(SAVES.db)
    : new Promise(res => {
        let req;
        try {
          req = indexedDB.open(SAVES.DB, 1);
        } catch {
          SAVES.where = "local";
          res(null);
          return;
        }
        req.onupgradeneeded = () => {
          if (!req.result.objectStoreNames.contains(SAVES.STORE)) req.result.createObjectStore(SAVES.STORE);
        };
        req.onsuccess = () => {
          SAVES.db = req.result;
          SAVES.where = "idb";
          res(SAVES.db);
        };
        req.onerror = () => {
          SAVES.where = "local";
          res(null);
        };
        req.onblocked = () => {
          SAVES.where = "local";
          res(null);
        };
      });
};

SAVES.lsGet = function (slot) {
  try {
    const t = localStorage.getItem(SAVES.LS + slot);
    if (!t) return null;
    const r = JSON.parse(t);
    r.bytes = SAVES.b64.dec(r.bytes);
    return r;
  } catch {
    return null;
  }
};

SAVES.lsSet = function (slot, rec) {
  try {
    if (rec)
      localStorage.setItem(
        SAVES.LS + slot,
        JSON.stringify({
          meta: rec.meta,
          bytes: SAVES.b64.enc(rec.bytes),
        }),
      );
    else localStorage.removeItem(SAVES.LS + slot);
    return true;
  } catch {
    return false;
  }
};

SAVES.get = async function (slot) {
  const db = await SAVES.open();
  return db
    ? new Promise((res, rej) => {
        const r = db.transaction(SAVES.STORE, "readonly").objectStore(SAVES.STORE).get(slot);
        r.onsuccess = () => res(r.result || null);
        r.onerror = () => rej(r.error);
      })
    : SAVES.lsGet(slot);
};

SAVES.put = async function (rec) {
  const db = await SAVES.open();
  if (!db) {
    const old = SAVES.SLOTS.map(SAVES.lsGet);
    let ok = SAVES.lsSet("cur", rec);
    if ((ok || (SAVES.lsSet("bak3", null), SAVES.lsSet("bak2", null), (ok = SAVES.lsSet("cur", rec))), ok))
      for (let i = 1; i < SAVES.SLOTS.length; i++) if (old[i - 1]) SAVES.lsSet(SAVES.SLOTS[i], old[i - 1]);
    return ok;
  }
  return new Promise(res => {
    const tx = db.transaction(SAVES.STORE, "readwrite"),
      st = tx.objectStore(SAVES.STORE),
      got = {};
    let n = 0;
    for (const s of SAVES.SLOTS.slice(0, -1)) {
      const r = st.get(s);
      r.onsuccess = () => {
        if (((got[s] = r.result || null), !(++n < SAVES.SLOTS.length - 1)))
          try {
            for (let i = SAVES.SLOTS.length - 1; i > 0; i--)
              if (got[SAVES.SLOTS[i - 1]]) st.put(got[SAVES.SLOTS[i - 1]], SAVES.SLOTS[i]);
            st.put(rec, "cur");
          } catch {
            try {
              tx.abort();
            } catch {}
          }
      };
    }
    tx.oncomplete = () => res(true);
    tx.onerror = () => res(false);
    tx.onabort = () => res(false);
  });
};

SAVES.clear = async function () {
  const db = await SAVES.open();
  if (!db) {
    for (const s of SAVES.SLOTS) SAVES.lsSet(s, null);
    return true;
  }
  return new Promise(res => {
    const tx = db.transaction(SAVES.STORE, "readwrite");
    tx.objectStore(SAVES.STORE).clear();
    tx.oncomplete = () => res(true);
    tx.onerror = () => res(false);
  });
};

// [X1 baked patch core/05-saves-and-keyboard SAVE-ONE-TAB] Two tabs shared one save slot with no lock, so within
// about 3 autosaves one life overwrote the other. A Web Lock now lets one tab save at a time; a second tab says
// so, does not save, and takes over when the first one closes.
SAVES.save = async function (S, J) {
  if (SAVES.blocked)
    return {
      ok: false,
      blocked: true,
      kb: 0,
    };
  const { bytes, meta } = await SAVES.encode(S, J),
    ok = await SAVES.put({
      bytes,
      meta,
    });
  if (ok) {
    SAVES.has = true;
    SAVES.lastSaveAt = Date.now();
  }
  SAVES.listCache = await SAVES.list();
  return {
    ok,
    kb: Math.round(bytes.length / 1024),
    where: SAVES.where,
    meta,
  };
};

SAVES.loadBest = async function () {
  const damaged = [];
  for (const slot of SAVES.SLOTS) {
    const rec = await SAVES.get(slot);
    if (rec)
      try {
        const d = await SAVES.decode(rec.bytes);
        d.slot = slot;
        d.damaged = damaged;
        return d;
      } catch (e) {
        damaged.push({
          slot,
          why: e.message,
        });
      }
  }
  return damaged.length
    ? {
        S: null,
        damaged,
      }
    : null;
};

SAVES.load = async function (slot) {
  const rec = await SAVES.get(slot);
  if (!rec) return null;
  const d = await SAVES.decode(rec.bytes);
  d.slot = slot;
  return d;
};

SAVES.list = async function () {
  const out = [];
  for (const slot of SAVES.SLOTS) {
    const rec = await SAVES.get(slot);
    if (rec)
      out.push({
        slot,
        meta: rec.meta,
        kb: Math.round(rec.bytes.length / 1024),
      });
  }
  return out;
};

// [X1 baked patch core/05-saves-and-keyboard SAVE-ONE-TAB] Two tabs shared one save slot with no lock, so within
// about 3 autosaves one life overwrote the other. A Web Lock now lets one tab save at a time; a second tab says
// so, does not save, and takes over when the first one closes.
SAVES.lock = function () {
  const L = typeof navigator < "u" && navigator.locks;
  if (!L || SAVES.lockTried) return Promise.resolve();
  SAVES.lockTried = true;
  return new Promise(res => {
    L.request(
      "ardan-saves",
      {
        ifAvailable: true,
      },
      lk => {
        if (lk) {
          SAVES.blocked = false;
          res();
          return new Promise(() => {});
        }
        SAVES.blocked = true;
        res();
        setTimeout(
          () =>
            UI.toast &&
            UI.toast("Ardan is already open in another tab. This tab will not save, so that game stays safe.", 8e3),
          1500,
        );
        L.request(
          "ardan-saves",
          () => (
            (SAVES.blocked = false),
            UI.toast && UI.toast("The other Ardan tab closed. This tab saves again."),
            new Promise(() => {})
          ),
        ).catch(() => {});
        return null;
      },
    ).catch(() => {
      SAVES.blocked = false;
      res();
    });
  });
};

SAVES.init = async function () {
  await SAVES.lock();
  await SAVES.open();
  let cur = await SAVES.get("cur");
  if (!cur && typeof localStorage < "u") {
    let old = null,
      bak = null;
    try {
      old = localStorage.getItem(SAVES.OLD);
      bak = localStorage.getItem(SAVES.OLD + ".bak");
    } catch {}
    for (const t of [bak, old])
      if (t)
        try {
          const d = await SAVES.decode(t);
          if ((await SAVES.save(d.S, null)).ok) cur = true;
        } catch {}
    if (cur)
      try {
        localStorage.removeItem(SAVES.OLD);
        localStorage.removeItem(SAVES.OLD + ".bak");
      } catch {}
  }
  SAVES.has = !!cur;
  SAVES.listCache = await SAVES.list();
  return SAVES.has;
};
