// The release's core, engine base: A: the random numbers, the state, people, realms and the small helpers everything uses; starting and ending wars.
// Readable source of vendor/ardan-b593143.html with the patch layer baked in (X1, docs/DECISIONS.md D-028). Edit it here.
// Defines: A, A.VERSION, A.rngState, A.rand, A.seed, A.ri, A.rf, A.chance, A.pick, A.gauss, A.wpick, A.shuffle,
// A.clamp, A.round, A.fmt, A.coin, A.cap, A.ordinal, A.uid, A.HOOKS, A.on, A.emit, A.filter, A.S, A.newState,
// A.serialize, A.deserialize, A.P, A.pc, A.age, A.realm, A.realmName, A.realmShort, A.culture, A.faith, A.house,
// A.FAM_KIND, A.family, A.famKindOf, A.prov, A.provName, A.raceName, A.givenName, A.cultHouse, A.epithetFor,
// A.familyName, A.houseSurname, A.fullName, A.shortName, A.newPerson, A.randomTraits, A.randomQuirks,
// A.genAppearance, A.bloodInherit, A.applyBloodPot, A.hasBlood, A.bloodDef, A.bloodName, A.maturity, A.growTo, and
// 68 more.

const A = {};

A.VERSION = 7;

A.rngState = 1;

A.rand = function () {
  let t = (A.rngState = (A.rngState + 1831565813) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

A.seed = function (s) {
  A.rngState = s >>> 0 || 1;
};

A.ri = (a, b) => Math.floor(a + A.rand() * (b - a + 1));

A.rf = (a, b) => a + A.rand() * (b - a);

A.chance = p => A.rand() < p;

A.pick = arr => arr[Math.floor(A.rand() * arr.length)];

A.gauss = (m = 0, sd = 1) => {
  let u = 0,
    v = 0;
  for (; u === 0; ) u = A.rand();
  for (; v === 0; ) v = A.rand();
  return m + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

A.wpick = (items, wf) => {
  let tot = 0;
  const ws = items.map(i => {
    const w = Math.max(0, wf(i));
    tot += w;
    return w;
  });
  if (tot <= 0) return null;
  let r = A.rand() * tot;
  for (let i = 0; i < items.length; i++) if (((r -= ws[i]), r <= 0)) return items[i];
  return items[items.length - 1];
};

A.shuffle = arr => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(A.rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

A.clamp = (v, a, b) => Math.max(a, Math.min(b, v));

A.round = (v, d = 0) => {
  const m = Math.pow(10, d);
  return Math.round(v * m) / m;
};

A.fmt = n => ((n = Math.round(n)), n.toLocaleString("en-US"));

// [X1 baked patch events/97-first-life-fixes LF-ONE-SUN] A.coin wrote every amount from 1 to 99 as "N suns", so a
// cost chip read "Costs 1 suns" and a log "you pay 1 suns". Exactly one sun is now "1 sun"; every other amount is
// written as before.
A.coin = n =>
  n > 0
    ? n >= 100
      ? A.fmt(n) + " suns"
      : n >= 1
        ? Math.round(n * 10) / 10 + (Math.round(n * 10) === 10 ? " sun" : " suns")
        : Math.max(1, Math.round(n * 12)) + " pence"
    : "0 suns";

A.cap = s => s && s.charAt(0).toUpperCase() + s.slice(1);

A.ordinal = n => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th");

A.uid = () => "p" + (A.S.nextId++).toString(36);

A.HOOKS = {};

A.on = (name, fn) => {
  (A.HOOKS[name] = A.HOOKS[name] || []).push(fn);
};

A.emit = (name, ...args) => {
  const L = A.HOOKS[name];
  if (L) for (const f of L) f(...args);
};

A.filter = (name, v, ...args) => {
  const L = A.HOOKS[name];
  if (L)
    for (const f of L) {
      const r = f(v, ...args);
      if (r !== void 0) v = r;
    }
  return v;
};

A.S = null;

A.newState = function (seed) {
  A.seed(seed);
  A.S = {
    v: A.VERSION,
    seed,
    year: 1105,
    nextId: 1,
    people: {},
    pc: null,
    log: [],
    queue: [],
    flags: {},
    realms: {},
    prov: [],
    wars: [],
    news: [],
    ach: {},
    dynasty: null,
    settings: {
      diff: "hard",
    },
    yearActs: {},
    time: 0,
    gen: 1,
    history: [],
    tutorial: true,
    deadList: [],
    rng: A.rngState,
    ver: A.SAVE_VER || 0,
    sched: [],
    gath: [],
    dcool: {},
  };
  return A.S;
};

A.serialize = function (S) {
  S = S || A.S;
  if (S === A.S) S.rng = A.rngState;
  return JSON.stringify(S);
};

A.deserialize = function (text) {
  const S = typeof text == "string" ? JSON.parse(text) : text;
  A.S = A.migrate ? A.migrate(S) : S;
  if (A.S.rng != null) A.rngState = A.S.rng | 0;
  if (A.cacheResetAll) A.cacheResetAll();
  return A.S;
};

A.P = id => (id && A.S.people[id]) || null;

A.pc = () => A.S.people[A.S.pc];

A.age = p => A.S.year - p.born;

A.realm = id => A.S.realms[id] || null;

A.realmName = id => {
  const r = A.realm(id);
  return r ? r.name : id === "unclaimed" ? "the unclaimed lands" : "no realm";
};

A.realmShort = id => {
  const r = A.realm(id);
  return r ? r.short : id === "unclaimed" ? "the Free Lands" : "nowhere";
};

A.culture = id => LORE.cultures[id];

A.faith = id => LORE.faiths[id];

A.house = id => (A.S && A.S.houses && A.S.houses[id]) || LORE.houses[id] || null;

A.FAM_KIND = {
  royal: "royal",
  noble: "noble",
  military: "noble",
  banking: "merchant",
  merchant: "merchant",
  clan: "clan",
  priestly: "clergy",
  other: "gentry",
};

A.family = p => {
  if (!p || !p.house) return null;
  const h = A.house(p.house);
  return h ? (h.fkind || (h.fkind = h.great === false ? h.kind : A.FAM_KIND[h.kind] || h.kind), h) : null;
};

A.famKindOf = h => (h ? h.fkind || A.FAM_KIND[h.kind] || h.kind : null);

A.prov = i => A.S.prov[i];

A.provName = i => (A.S.prov[i] ? A.S.prov[i].name : "the road");

A.raceName = r => (GD.RACES[r] ? GD.RACES[r].name : r);

A.givenName = function (cult, sex) {
  const c = LORE.cultures[cult] || LORE.cultures["CUL-02"],
    list = sex === "F" ? c.f : c.m;
  return A.pick(list.length ? list : c.m);
};

A.cultHouse = cult => {
  const c = LORE.cultures[cult];
  return c && c.house.length ? A.pick(c.house) : "Marsh";
};

A.epithetFor = cult => {
  const c = LORE.cultures[cult];
  return c && c.epi.length ? A.pick(c.epi) : "the Bold";
};

A.familyName = function (opts) {
  const n = GD.NAMING[opts.cult] || {
      common: "place",
      noble: "house",
    },
    noble = opts.status === "noble" || opts.status === "royal";
  if (opts.house) {
    const h = A.house(opts.house);
    if (h)
      return {
        sur: A.houseSurname(h),
        mode: "house",
      };
  }
  let mode = noble || opts.status === "gentry" ? n.noble : n.common;
  if (n.alt && n.alt[opts.realm] && !noble) mode = n.alt[opts.realm];
  const par = opts.father || opts.mother;
  if (par && ["house", "clan", "trade", "crew", "band", "line", "hall", "tribe"].includes(par.surMode) && par.sur)
    return {
      sur: par.sur,
      mode: par.surMode,
    };
  const home = opts.home != null ? A.provName(opts.home) : "the road";
  switch (mode) {
    case "house":
    case "clan":
    case "crew":
    case "band":
    case "line":
      return {
        sur: A.cultHouse(opts.cult),
        mode,
      };
    case "trade": {
      const tl = GD.TRADE_NAMES[opts.cult] || GD.TRADE_NAMES["CUL-02"];
      return {
        sur: A.pick(tl),
        mode: "trade",
      };
    }
    case "tribe":
      return {
        sur: "of the " + A.pick(GD.WIND_TRIBES) + " Wind",
        mode: "tribe",
      };
    case "hall": {
      const halls = GD.GIANT_HALLS[opts.realm] || GD.GIANT_HALLS["POL-09"];
      return {
        sur: "of " + A.pick(halls),
        mode: "hall",
      };
    }
    case "patron": {
      const fn = opts.father ? opts.father.given : A.givenName(opts.cult, "M");
      return {
        sur: (opts.sex === "F" ? "daughter of " : "son of ") + fn,
        mode: "patron",
      };
    }
    case "deed": {
      const c = A.cultHouse(opts.cult);
      return {
        sur: "of Clan " + c,
        mode: "deed",
        clan: c,
      };
    }
    case "single":
      return {
        sur: "",
        mode: "single",
      };
    case "place":
    default:
      return {
        sur: "of " + home,
        mode: "place",
      };
  }
};

A.houseSurname = function (h) {
  if (h && h.sur) return h.sur;
  let n = ((h && h.name) || "").trim();
  return /^The Hall of /.test(n) || /^Hall of /.test(n)
    ? "of " + n.replace(/^(The )?Hall of /, "")
    : /^The (Skarfell|Jotunhall) line$/.test(n)
      ? "of " + n.replace(/^The /, "").replace(/ line$/, "")
      : /^The Line of /.test(n)
        ? "of the " + n.replace(/^The /, "")
        : /^The Grey Mothers$/.test(n)
          ? "of the Grey Mothers"
          : /Wind chiefs$/.test(n)
            ? "of the " + n.replace(/^The /, "").replace(/ chiefs$/, "")
            : ((n = n
                .replace(/^(House|Clan|The)\s+/, "")
                .replace(/ \(.*\)$/, "")
                .replace(/ (line|kin|family|chiefs|Reeves)$/, "")),
              (n = n.replace(/ of .*$/, "")),
              n.split(" ").length === 1 &&
                /[a-z]s$/.test(n) &&
                !/(ss|us|is)$/.test(n) &&
                h &&
                /^The /.test(h.name) &&
                (n = n.replace(/s$/, "")),
              n.trim() || "of the house");
};

A.fullName = function (p, withEpithet = true) {
  if (!p) return "someone";
  let n = p.given;
  if (p.sur) n += " " + p.sur;
  if (withEpithet && p.epithet) n += (p.sur && p.sur.startsWith("of") ? ", " : " ") + p.epithet;
  return n;
};

A.shortName = p => (p ? p.given : "someone");

A.newPerson = function (o) {
  const S = A.S,
    race = o.race || "human",
    R2 = GD.RACES[race],
    p = {
      id: o.id || A.uid(),
      given: o.given || "Nameless",
      sur: o.sur || "",
      surMode: o.surMode || "place",
      epithet: o.epithet || "",
      sex: o.sex || (A.chance(0.5) ? "M" : "F"),
      race,
      cult: o.cult || "CUL-02",
      realm: o.realm || "unclaimed",
      home: o.home != null ? o.home : 0,
      born: o.born != null ? o.born : S.year,
      alive: true,
      died: null,
      cause: null,
      faith: o.faith || "REL-18",
      status: o.status || "peasant",
      house: o.house || null,
      dyn: o.dyn || null,
      blood: o.blood || null,
      castId: o.castId || null,
      pot: {},
      st: {},
      health: 100,
      happy: 60,
      looks: 50,
      fame: 0,
      honor: 50,
      piety: 30,
      traits: o.traits || [],
      quirks: o.quirks || [],
      wounds: [],
      app: o.app || null,
      skills: {},
      langs: [],
      literate: false,
      job: null,
      mil: null,
      noble: null,
      ruler: null,
      coin: 0,
      assets: [],
      gear: {
        weapon: "fists",
        ranged: null,
        armor: "none",
        shield: null,
        helm: null,
        mount: null,
        cloak: null,
      },
      school: null,
      parents: o.parents || [],
      spouse: null,
      exSpouses: [],
      children: [],
      rel: {},
      deeds: [],
      kills: 0,
      flags: {},
      occ: o.occ || "",
      title: o.title || "",
      npc: o.npc !== false,
    },
    pa = o.parents ? o.parents.map(A.P).filter(Boolean) : [];
  for (const s of GD.STATS) {
    let base = 42 + (R2.mods[s] || 0);
    if (pa.length) {
      const pv = pa.reduce((a, q) => a + (q.pot[s] || base), 0) / pa.length;
      base = base * 0.45 + pv * 0.55;
    }
    let v = base + A.gauss(0, 11);
    if (o.potBonus) v += o.potBonus;
    p.pot[s] = A.clamp(Math.round(v), 8, 100 + Math.max(0, R2.mods[s] || 0) + 25);
  }
  if (o.pot) Object.assign(p.pot, o.pot);
  if (p.blood) A.applyBloodPot(p);
  if (!o.traits) p.traits = A.randomTraits(pa);
  if (!o.quirks) p.quirks = A.randomQuirks(pa);
  for (const q of p.quirks) {
    const Q = GD.QUIRKS[q];
    if (Q && Q.fx) for (const s in Q.fx) p.pot[s] = A.clamp(p.pot[s] + Q.fx[s] * 2, 5, 200);
  }
  let lk = pa.length ? (pa.reduce((a, q) => a + q.looks, 0) / pa.length) * 0.5 + 25 : 50;
  lk += A.gauss(0, 14);
  for (const q of p.quirks) if (GD.QUIRKS[q] && GD.QUIRKS[q].looks) lk += GD.QUIRKS[q].looks;
  p.looks = A.clamp(Math.round(lk), 3, 100);
  if (o.looks != null) p.looks = o.looks;
  if (!p.app) p.app = A.genAppearance(p, pa);
  const age = S.year - p.born;
  for (const s of GD.STATS) p.st[s] = p.pot[s] * 0.08;
  A.growTo(p, age);
  p.langs = [GD.LANG[p.cult] || "Solen"];
  S.people[p.id] = p;
  return p;
};

A.randomTraits = function (parents) {
  const keys = Object.keys(GD.TRAITS),
    out = [],
    n = A.ri(2, 3);
  // [X1 baked patch core/03-engine-fixes ENG-TRAIT-OPP] Children copied parent traits without checking opposites:
  // 12.4% of children of a brave and a craven parent were both.
  for (const par of parents)
    if (par.traits.length && A.chance(0.35)) {
      const t = A.pick(par.traits),
        T = GD.TRAITS[t];
      if (!(out.includes(t) || (T && T.opp && out.includes(T.opp)))) out.push(t);
    }
  let guard = 0;
  for (; out.length < n && guard++ < 40; ) {
    const t = A.pick(keys),
      T = GD.TRAITS[t];
    if (!(out.includes(t) || (T.opp && out.includes(T.opp)))) out.push(t);
  }
  return out.slice(0, 3);
};

A.randomQuirks = function (parents) {
  const keys = Object.keys(GD.QUIRKS),
    out = [];
  for (const par of parents) for (const q of par.quirks) if (A.chance(0.22) && !out.includes(q)) out.push(q);
  if (A.chance(0.55)) {
    const q = A.pick(keys);
    if (!out.includes(q)) out.push(q);
  }
  if (A.chance(0.12)) {
    const q = A.pick(keys);
    if (!out.includes(q)) out.push(q);
  }
  const bad = [
    ["tall", "short"],
    ["robust", "sickly"],
    ["beautiful", "plain"],
    ["keeneye", "nearsight"],
    ["quickmind", "slowwit"],
    ["bigframe", "lithe"],
  ];
  for (const [a, b] of bad) if (out.includes(a) && out.includes(b)) out.splice(out.indexOf(b), 1);
  return out.slice(0, 3);
};

A.genAppearance = function (p, parents) {
  const skins = GD.SKIN[p.race] || GD.SKIN.human;
  let skin, hair, eye;
  if (parents.length) {
    const par = A.pick(parents);
    skin = par.app && skins.includes(par.app.skin) && A.chance(0.7) ? par.app.skin : A.pick(skins);
    hair = A.chance(0.7) && parents[0].app ? A.pick(parents).app.hair : A.ri(0, 8);
    eye = A.chance(0.7) && parents[0].app ? A.pick(parents).app.eye : A.ri(0, GD.EYES.length - 1);
  } else {
    const darkCult = [
        "CUL-05",
        "CUL-06",
        "CUL-07",
        "CUL-08",
        "CUL-09",
        "CUL-10",
        "CUL-13",
        "CUL-14",
        "CUL-16",
        "CUL-17",
        "CUL-04",
      ],
      midCult = ["CUL-01", "CUL-03", "CUL-12", "CUL-15", "CUL-18"];
    if (p.race === "human" || p.race === "halfelf") {
      if (darkCult.includes(p.cult)) skin = skins[A.ri(3, 7)];
      else {
        if (midCult.includes(p.cult)) skin = skins[A.ri(1, 4)];
        else skin = skins[A.ri(0, 2)];
      }
    } else skin = A.pick(skins);
    const darkHair = darkCult.includes(p.cult) || midCult.includes(p.cult);
    hair = darkHair ? A.ri(0, 3) : A.ri(0, 8);
    eye = darkHair ? A.ri(0, 2) : A.ri(0, GD.EYES.length - 1);
  }
  const R2 = GD.RACES[p.race];
  let h = (p.sex === "F" ? R2.height[0] : R2.height[1]) + A.gauss(0, R2.hsd);
  for (const q of p.quirks) if (GD.QUIRKS[q] && GD.QUIRKS[q].h) h += GD.QUIRKS[q].h * (p.race === "giant" ? 3 : 1);
  if (p.blood && p.blood.show) {
    const B = GD.BLOOD[p.blood.id];
    if (B && B.h && (B.mode !== "dom" || !B.maleShow || p.sex === "M")) h += B.h;
    if (B && B.mh && p.sex === "M") h += B.mh;
  }
  const builds = GD.BUILDS;
  let build = 2;
  if (p.quirks.includes("bigframe")) build = 4;
  else {
    if (p.quirks.includes("lithe")) build = 1;
    else build = A.ri(0, 4);
  }
  const app = {
    skin,
    hair,
    eye,
    hstyle: A.pick(
      p.sex === "F"
        ? ["long", "braided", "tied", "short", "topknot", "curly", "ponytail", "locks"]
        : [
            "short",
            "cropped",
            "long",
            "braided",
            "shaved",
            "wild",
            "tied",
            "topknot",
            "curly",
            "locks",
            "bald",
            "mohawk",
          ],
    ),
    beard:
      p.sex === "M" && p.race !== "elf" ? A.pick(p.race === "dwarf" ? ["full", "long", "braided"] : GD.BEARDS) : "none",
    build: builds[A.chance(0.15) ? A.ri(5, 7) : build],
    height: Math.round(h),
    face: A.ri(0, 3),
    brow: A.ri(0, 2),
    mouth: A.ri(0, 2),
    nose: A.ri(0, 2),
    eyeShape: A.ri(0, 2),
    paint:
      (p.race === "orc" || p.race === "halforc") && A.chance(0.5)
        ? A.pick(["warpaint", "tribal", "stripes"])
        : ["CUL-03", "CUL-22", "CUL-23"].includes(p.cult) && A.chance(0.3)
          ? A.pick(["tribal", "dots"])
          : "none",
    jewel: A.chance(0.12) ? A.pick(["earring", "nosering", "torc"]) : "none",
  };
  // [C8b] Everyone is born with a face: the 23-character code of src/people/engine/face.js, taken after the parents'
  // codes or made round the people's mean, from a stream seeded by the person's id (never the world's dice, so the
  // random stream is the release's). src/ui/93-figures draws it; a build without that feature stores none.
  if (A.LOOKS && A.LOOKS.born) {
    const g = A.LOOKS.born(p, parents, app);
    if (g) app.g = g;
  }
  return app;
};


A.bloodInherit = function (bid, father, mother, sex) {
  const B = GD.BLOOD[bid];
  if (!B) return null;
  const fc = father && father.blood && father.blood.id === bid ? father.blood.copies || 1 : 0,
    mc = mother && mother.blood && mother.blood.id === bid ? mother.blood.copies || 1 : 0;
  let copies = 0;
  const pass = c => (c === 2 || (c === 1 && A.chance(0.5)) ? 1 : 0);
  switch (B.mode) {
    case "mother":
      copies = mc ? 1 : 0;
      break;
    case "father":
      copies = fc && A.chance(0.5) ? 1 : 0;
      break;
    case "x":
      if (sex === "M") copies = mc ? pass(mc) : 0;
      else copies = Math.min(2, (fc ? 1 : 0) + (mc ? pass(mc) : 0));
      break;
    case "third":
      copies = (fc || mc) && A.chance(fc && mc ? 0.55 : 0.33) ? 1 : 0;
      break;
    case "weak":
      copies = (fc || mc) && A.chance(0.4) ? 1 : 0;
      break;
    default:
      copies = Math.min(2, pass(fc) + pass(mc));
  }
  if (!copies) return null;
  let show = false;
  switch (B.mode) {
    case "rec":
      show = copies === 2;
      break;
    case "het":
      show = true;
      break;
    case "female":
      show = sex === "F";
      break;
    case "weak":
      show = A.chance(0.5);
      break;
    case "x":
      show = sex === "M" ? true : copies >= 1;
      break;
    default:
      show = true;
  }
  if (B.maleShow && sex === "M") show = A.chance(B.maleShow);
  else {
    if (B.maleShow) show = false;
  }
  return {
    id: bid,
    copies,
    show,
  };
};

A.applyBloodPot = function (p) {
  const B = GD.BLOOD[p.blood.id];
  if (!B) return;
  let fx = {};
  if (B.mode === "x") fx = p.sex === "M" ? B.m || {} : B.f || {};
  else {
    if (p.blood.show) fx = B.fx || {};
    else {
      if (B.carrierFx) fx = B.carrierFx;
    }
  }
  if (B.mode === "rec" && !p.blood.show && B.carrierFx) fx = B.carrierFx;
  for (const s in fx) p.pot[s] = A.clamp(p.pot[s] + fx[s], 5, 200);
  if (B.mode === "x" && p.sex === "M" && B.mFlag) p.flags[B.mFlag] = true;
};

A.hasBlood = (p, tag) =>
  !!(
    p &&
    p.blood &&
    GD.BLOOD[p.blood.id] &&
    GD.BLOOD[p.blood.id].tag === tag &&
    (p.blood.show || GD.BLOOD[p.blood.id].mode === "x")
  );

A.bloodDef = p => (p && p.blood ? GD.BLOOD[p.blood.id] : null);

A.bloodName = p => {
  if (!p || !p.blood) return "";
  const L = LORE.bloodlines[p.blood.id],
    B = GD.BLOOD[p.blood.id];
  return (B ? B.short : "") + (L ? " (" + L.name + ")" : "");
};

A.maturity = function (p, age) {
  const R2 = GD.RACES[p.race];
  return A.clamp(age / R2.grown, 0, 1);
};

A.growTo = function (p, age) {
  const R2 = GD.RACES[p.race],
    m = A.clamp(age / R2.grown, 0, 1);
  for (const s of GD.STATS) {
    const target = p.pot[s] * (0.08 + 0.62 * Math.pow(m, 1.1)),
      exp = age > R2.grown ? Math.min(0.15, ((age - R2.grown) / (R2.primeEnd - R2.grown + 1)) * 0.15) : 0;
    p.st[s] = Math.max(p.st[s], target + p.pot[s] * exp * (s === "int" || s === "ins" || s === "wil" ? 1 : 0.6));
  }
};

A.yearGrowth = function (p) {
  const R2 = GD.RACES[p.race],
    age = A.age(p);
  if (age <= R2.grown) {
    const m = A.clamp(age / R2.grown, 0, 1);
    for (const s of GD.STATS) {
      const target = p.pot[s] * (0.08 + 0.62 * Math.pow(m, 1.1));
      if (p.st[s] < target) p.st[s] = Math.min(target, p.st[s] + (target - p.st[s]) * 0.9 + 0.2);
    }
  }
};

A.ageFactor = function (p, s) {
  const R2 = GD.RACES[p.race],
    age = A.age(p),
    bdef = A.bloodDef(p);
  let old = R2.old;
  if ((bdef && bdef.lifeMul && p.blood.show && (old *= bdef.lifeMul[p.sex] || 1), s === "wil")) return 1;
  if (s === "int") return age > old * 1.15 ? Math.max(0.6, 1 - (age - old * 1.15) / (R2.maxLife * 0.6)) : 1;
  if (age < old * 0.85) return 1;
  const k =
    {
      str: 1,
      spd: 1.2,
      sta: 1,
      ins: 0.5,
    }[s] || 1;
  return Math.max(0.35, 1 - ((k * (age - old * 0.85)) / (R2.maxLife - old * 0.85)) * 0.8);
};

A.stat = function (p, s) {
  if (!p || !p.st) return 0;
  let v = (p.st[s] || 0) * A.ageFactor(p, s);
  for (const t of p.traits) {
    const T = GD.TRAITS[t];
    if (T && T.fx && T.fx[s]) v += T.fx[s];
  }
  for (const w of p.wounds) {
    const W = GD.WOUNDS[w.k];
    if (W && W.fx && W.fx[s]) v += W.fx[s];
  }
  const BF = p.app && GD.BUILD_FX && GD.BUILD_FX[p.app.build];
  if (BF && BF[s]) v += BF[s];
  if (p.flags.weary) v *= 0.92;
  return Math.max(0, Math.round(v));
};

A.stats = p => {
  const o = {};
  for (const s of GD.STATS) o[s] = A.stat(p, s);
  return o;
};

A.skill = function (p, k) {
  let v = p.skills[k] || 0;
  for (const w of p.wounds) {
    const W = GD.WOUNDS[w.k];
    if (W && W.skillPen && W.skillPen[k]) v += W.skillPen[k];
  }
  return A.clamp(Math.round(v), 0, 100);
};

A._growMul = 1;

A.train = function (p, s, amt) {
  if (p && A.S && p.id === A.S.pc) amt *= A._growMul;
  const R2 = GD.RACES[p.race],
    age = A.age(p);
  if (age < 4) return 0;
  let eff = 1;
  if (age < R2.grown * 0.5) eff = 0.5;
  else {
    if (age > R2.primeEnd) eff = 0.55;
  }
  if (age > R2.old) eff = 0.25;
  const room = Math.max(0, (p.pot[s] - p.st[s]) / Math.max(1, p.pot[s])),
    gain = amt * eff * (0.25 + room * 1.1);
  p.st[s] = Math.min(p.pot[s] * 1.02, p.st[s] + gain);
  return gain;
};

A.trainSkill = function (p, k, amt) {
  if (!GD.SKILLS[k]) return 0;
  if (p && A.S && p.id === A.S.pc) amt *= A._growMul;
  const cur = p.skills[k] || 0,
    int = A.stat(p, "int"),
    apt = (p.apt && p.apt[k]) || 1,
    learn = 1 + A.perkSum(p, "learn"),
    cap = apt < 0.6 ? 60 : apt < 0.8 ? 80 : 100,
    g =
      amt *
      apt *
      learn *
      (A.specMul ? A.specMul(p, k) : 1) *
      (0.6 + int / 120) *
      Math.max(apt >= 1.4 ? 0.1 : 0.05, Math.pow(Math.max(0, 1 - cur / (cap + 10)), 1.5)),
    before = cur;
  if (((p.skills[k] = A.clamp(cur + g, 0, cap)), p.id === (A.S && A.S.pc) && GD.PERKS[k]))
    for (const [lv, name, desc] of GD.PERKS[k])
      if (before < lv && p.skills[k] >= lv) A.log(`${GD.SKILLS[k]}: you unlock "${name}" — ${desc}.`, "big");
  if (g > 0 && A.S) {
    p.used = p.used || {};
    p.used[k] = A.S.year;
  }
  return g;
};

A.skillEff = function (p, k) {
  let v = A.skill(p, k);
  for (const [j, m] of GD.SKILL_SYN[k] || []) v = Math.max(v, A.skill(p, j) * m);
  return Math.round(v + A.perkOf(p, k, "check"));
};

A.perksOf = function (p, k) {
  const L = GD.PERKS[k];
  if (!L) return [];
  const v = A.skill(p, k);
  return L.filter(x => v >= x[0]);
};

A.perkOf = function (p, k, key) {
  let t = 0;
  for (const x of A.perksOf(p, k)) if (x[3][key]) t += x[3][key];
  return t;
};

A.perkSum = function (p, key) {
  let t = 0;
  if (!p || !p.skills) return 0;
  for (const k in p.skills) if (!(p.skills[k] < 40 || !GD.PERKS[k])) t += A.perkOf(p, k, key);
  return t;
};

A.perkNames = function (p) {
  const out = [];
  for (const k in p.skills) for (const x of A.perksOf(p, k)) out.push([k, x[1], x[2]]);
  return out;
};

A.rollApt = function (p, biasKeys) {
  const apt = {},
    bias = (biasKeys || []).flatMap(b => GD.APT_BIAS[b] || []),
    nGood = A.ri(2, 4),
    nBad = A.ri(1, 2);
  for (let i = 0; i < nGood; i++) {
    const k = bias.length && A.chance(0.55) ? A.pick(bias) : A.pick(GD.SKILL_LIST),
      r = A.rand();
    apt[k] = Math.max(apt[k] || 1, r < 0.08 ? 1.85 : r < 0.35 ? 1.5 : 1.25);
  }
  for (let i = 0; i < nBad; i++) {
    const k = A.pick(GD.SKILL_LIST);
    if (!apt[k]) apt[k] = A.chance(0.3) ? 0.5 : 0.72;
  }
  p.apt = apt;
  return apt;
};

A.addTrait = (p, t) => {
  const T = GD.TRAITS[t];
  return !T || p.traits.includes(t)
    ? false
    : (T.opp && p.traits.includes(T.opp) && p.traits.splice(p.traits.indexOf(T.opp), 1), p.traits.push(t), true);
};

A.removeTrait = (p, t) => {
  const i = p.traits.indexOf(t);
  if (i >= 0) p.traits.splice(i, 1);
};

A.has = (p, t) => p.traits.includes(t) || p.quirks.includes(t);

A.addWound = function (p, k) {
  const W = GD.WOUNDS[k];
  return !W ||
    (W.perm && p.wounds.some(w => w.k === k)) ||
    (k === "lost_eye" && p.wounds.filter(w => w.k === "lost_eye").length)
    ? null
    : (p.wounds.push({
        k,
        until: W.perm ? 0 : A.S.year + (W.years || 1),
      }),
      W.looks && (p.looks = A.clamp(p.looks + W.looks, 1, 100)),
      W.name);
};

A.healWounds = function (p) {
  p.wounds = p.wounds.filter(w => !w.until || w.until > A.S.year);
};

A.maxHealth = function (p) {
  const R2 = GD.RACES[p.race],
    age = A.age(p);
  let m = 100;
  if (age > R2.old) m -= ((age - R2.old) / (R2.maxLife - R2.old)) * 60;
  return Math.max(15, Math.round(m));
};

A.fame = function (p, d) {
  if (!(!p || !Number.isFinite(d))) {
    if (d > 0) p.fame = Math.min(100, p.fame + d * Math.max(0.08, 1 - p.fame / 105));
    else p.fame = Math.max(0, p.fame + d);
  }
};

A.he = p => (p && p.sex === "F" ? "she" : "he");

A.him = p => (p && p.sex === "F" ? "her" : "him");

A.his = p => (p && p.sex === "F" ? "her" : "his");

A.manWoman = p => {
  if (!p) return "person";
  const a = A.age(p),
    R2 = GD.RACES[p.race];
  return a < R2.adult ? (p.sex === "F" ? "girl" : "boy") : p.sex === "F" ? "woman" : "man";
};

A.REL_LABEL = {
  mother: "Mother",
  father: "Father",
  sibling: "Sibling",
  child: "Child",
  spouse: "Spouse",
  lover: "Lover",
  betrothed: "Betrothed",
  friend: "Friend",
  bestfriend: "Best friend",
  rival: "Rival",
  enemy: "Enemy",
  mentor: "Mentor",
  student: "Student",
  comrade: "Comrade",
  lord: "Liege",
  grandparent: "Grandparent",
  grandchild: "Grandchild",
  ex: "Former spouse",
  acquaint: "Acquaintance",
  master: "Master",
  servant: "Servant",
  councillor: "Councillor",
  cousin: "Cousin",
  uncle: "Uncle/Aunt",
  nephew: "Nephew/Niece",
  inlaw: "In-law",
};

A.relLabel = function (p, rel) {
  const t = rel.type;
  if (!p) return A.REL_LABEL[t] || t;
  const m = p.sex === "M";
  return (
    {
      sibling: m ? "Brother" : "Sister",
      child: m ? "Son" : "Daughter",
      spouse: m ? "Husband" : "Wife",
      grandparent: m ? "Grandfather" : "Grandmother",
      grandchild: m ? "Grandson" : "Granddaughter",
      uncle: m ? "Uncle" : "Aunt",
      nephew: m ? "Nephew" : "Niece",
      ex: m ? "Former husband" : "Former wife",
      betrothed: "Betrothed",
    }[t] ||
    A.REL_LABEL[t] ||
    t
  );
};

A.link = function (a, b, type, op = 30, backType = null) {
  if (!(!a || !b || a.id === b.id)) {
    a.rel[b.id] = Object.assign(a.rel[b.id] || {}, {
      type,
      op: A.clamp(op, -100, 100),
      since: A.S.year,
    });
    if (backType)
      b.rel[a.id] = Object.assign(b.rel[a.id] || {}, {
        type: backType,
        op: A.clamp(op + A.ri(-10, 10), -100, 100),
        since: A.S.year,
      });
    if (a.id === A.S.pc) a.rel[b.id].seen = A.S.year;
  }
};

A.opinion = (a, b) => (a && b && a.rel[b.id] ? a.rel[b.id].op : 0);

A.addOp = function (a, b, d) {
  if (!a || !b) return;
  if (a.rel[b.id]) {
    a.rel[b.id].op = A.clamp(a.rel[b.id].op + d, -100, 100);
    if (b.rel[a.id]) b.rel[a.id].op = A.clamp(b.rel[a.id].op + d * 0.8, -100, 100);
  }
  const S = A.S;
  if (S) {
    if (a.id === S.pc && a.rel[b.id]) a.rel[b.id].seen = S.year;
    if (b.id === S.pc && b.rel[a.id]) b.rel[a.id].seen = S.year;
  }
};

A.relsOf = (p, types) =>
  Object.entries(p.rel)
    .filter(([id, r]) => (!types || types.includes(r.type)) && A.P(id))
    .map(([id, r]) => ({
      p: A.P(id),
      r,
    }));

A.log = function (text, cls) {
  const S = A.S,
    pc = A.pc();
  let entry = S.log[S.log.length - 1];
  if (!entry || entry.year !== S.year || entry.pc !== S.pc) {
    entry = {
      year: S.year,
      age: pc ? A.age(pc) : 0,
      pc: S.pc,
      lines: [],
    };
    S.log.push(entry);
    if (S.log.length > 600) S.log.splice(0, S.log.length - 600);
  }
  entry.lines.push([text, cls || "", A.today()]);
};

A.news = function (text, cls) {
  A.S.news.unshift({
    y: A.S.year,
    d: A.today(),
    t: text,
    c: cls || "",
  });
  if (A.S.news.length > 220) A.S.news.length = 220;
};

A.ach = function (k) {
  if (!(!GD.ACH[k] || A.S.ach[k])) {
    A.S.ach[k] = A.S.year;
    A.log("Achievement: " + GD.ACH[k][0] + " — " + GD.ACH[k][1], "ach");
    if (typeof A.onAch == "function") A.onAch(k);
  }
};

A.T = function (str, ctx = {}) {
  if (!str) return "";
  const pc = A.pc(),
    sub = (m, key) => {
      if (ctx[key] != null) return ctx[key];
      const r = pc ? A.realm(pc.realm) : null;
      switch (key) {
        case "name":
          return pc ? pc.given : "you";
        case "full":
          return A.fullName(pc);
        case "sur":
          return pc ? pc.sur : "";
        case "home":
          return pc ? A.provName(pc.home) : "home";
        case "realm":
          return pc ? A.realmName(pc.realm) : "the realm";
        case "realmShort":
          return pc ? A.realmShort(pc.realm) : "the realm";
        case "capital":
          return r ? r.capital : "the capital";
        case "ruler": {
          const ru = r ? A.P(r.ruler) : null;
          return ru ? A.rulerStyle(ru, r) : "the ruler";
        }
        case "rulerTitle":
          return r ? r.title.split(" / ")[0] : "lord";
        case "faith":
          return pc ? (A.faith(pc.faith) || {}).name || "the old gods" : "the gods";
        case "father": {
          const f = pc && A.P(pc.parents[0]);
          return f ? f.given : "your father";
        }
        case "mother": {
          const mo = pc && A.P(pc.parents[1]);
          return mo ? mo.given : "your mother";
        }
        case "spouse": {
          const sp = pc && A.P(pc.spouse);
          return sp ? sp.given : "your spouse";
        }
        case "coinName":
          return r && r.coin ? r.coin.coin : "sun";
        case "people":
          return pc ? A.culture(pc.cult).name : "people";
        case "race":
          return pc ? GD.RACES[pc.race].adj : "human";
        case "he":
          return pc ? A.he(pc) : "they";
        case "his":
          return pc ? A.his(pc) : "their";
        case "year":
          return String(A.S.year);
        case "age":
          return pc ? String(A.age(pc)) : "";
        case "manwoman":
          return A.manWoman(pc);
        case "enemy": {
          const e = pc ? A.enemyRealmOf(pc.realm) : null;
          return e ? A.realmShort(e) : "the enemy";
        }
        case "rival": {
          const rv = pc ? A.relsOf(pc, ["rival", "enemy"])[0] : null;
          return rv ? rv.p.given : "your rival";
        }
        case "friend": {
          const fr = pc ? A.relsOf(pc, ["friend", "bestfriend"])[0] : null;
          return fr ? fr.p.given : "a friend";
        }
        case "npcM":
          return A.givenName(pc ? pc.cult : "CUL-02", "M");
        case "npcF":
          return A.givenName(pc ? pc.cult : "CUL-02", "F");
        case "town":
          return A.provName(
            A.pick(
              A.S.prov
                .filter(x => x.owner === (pc ? pc.realm : ""))
                .map(x => x.id)
                .concat([pc ? pc.home : 0]),
            ),
          );
        case "season":
          return A.pick(["spring", "summer", "autumn", "winter"]);
        case "festival":
          return A.pick(GD.FESTIVALS)[0];
        case "god":
          return A.godWord(pc);
        case "family": {
          const h = A.family(pc);
          return h ? h.name : "your family";
        }
        case "familySeat": {
          const h = A.family(pc);
          return h && h.seat ? h.seat : pc ? A.provName(pc.home) : "home";
        }
        case "familyHead": {
          const h = A.family(pc),
            hp = h && h.headPid ? A.P(h.headPid) : null;
          return hp ? A.fullName(hp) : "the head of your family";
        }
        case "liege": {
          const h = A.family(pc),
            l = h && h.liege ? A.house(h.liege) : null;
          return l ? l.name : "your liege";
        }
        case "weapon": {
          const g = pc && GD.GEAR[pc.gear.weapon];
          return g ? g.name.toLowerCase() : "your fists";
        }
        case "rank":
          return pc && pc.mil ? GD.MIL[pc.mil.rank].title : "civilian";
        default:
          return m;
      }
    };
  // [X1 baked patch core/02-content-fixes EVT-TOKEN-DIGITS] Tokens with digits ({mate2}, {h1}, {m2him}, {cap2},
  // {age2}, {n1}...) were neither filled nor caught, so 39 events showed raw braces ("You owe {mate2} {debt} suns").
  // The values were already in the context; allow digits in both patterns.
  return str.replace(/\{([a-zA-Z0-9_.]+)\}/g, (m, key, off, whole) => A.capAt(sub(m, key), whole, off));
};

A.capAt = (v, whole, off) =>
  typeof v == "string" &&
  /^[a-z]/.test(v) &&
  (off === 0 || /[.!?]["'\u2019\u201d)]?\s+$/.test(whole.slice(Math.max(0, off - 6), off)))
    ? v[0].toUpperCase() + v.slice(1)
    : v;

A.godWord = function (p) {
  const f = p ? p.faith : "";
  return (
    {
      "REL-01": "the Light",
      "REL-02": "the Dawn",
      "REL-03": "the Seven",
      "REL-04": "the Green",
      "REL-05": "the Ancestors of the Deep",
      "REL-06": "the Open Sky",
      "REL-07": "the Giver",
      "REL-08": "the Flood Mother",
      "REL-09": "the Ancestors",
      "REL-10": "the Thousand Names",
      "REL-11": "the Storm and the Mare",
      "REL-12": "the Mother Under the Ice",
      "REL-13": "the Drowned Queen",
      "REL-14": "the Eternal Blue",
      "REL-16": "the forest spirits",
      "REL-17": "the Saints",
      "REL-18": "the hearth gods",
      "REL-19": "Lady Luck",
    }[f] || "the gods"
  );
};

A.rulerStyle = function (ru, r) {
  if (!ru) return "nobody";
  let t = r ? r.title.split(" / ")[0] : "";
  if (ru.sex === "F")
    t =
      {
        King: "Queen",
        Emperor: "Empress",
        Sultan: "Sultana",
        Prince: "Princess",
        Raja: "Rani",
        Khan: "Khatun",
        Emir: "Emira",
        Abbot: "Abbess",
        "High Luminary": "High Luminary",
        Doge: "Dogaressa",
        Chieftain: "Chieftain",
      }[t] || t;
  else
    t =
      {
        Queen: "King",
        "Forge-Queen": "Forge-King",
        "War-Mother": "War-Father",
      }[t] || t;
  return (t ? t + " " : "") + A.fullName(ru, false);
};

A.STAB = {
  firm: 82,
  steady: 66,
  strained: 46,
  brittle: 30,
  broken: 15,
};

A.GOV = {
  "POL-02": {
    gov: "theocracy",
    law: "equal",
  },
  "POL-04": {
    gov: "council",
    law: "male",
  },
  "POL-06": {
    gov: "hereditary",
    law: "female",
  },
  "POL-07": {
    gov: "hereditary",
    law: "female",
  },
  "POL-08": {
    gov: "hereditary",
    law: "equal",
  },
  "POL-09": {
    gov: "elective",
    law: "equal",
  },
  "POL-10": {
    gov: "hereditary",
    law: "female",
  },
  "POL-11": {
    gov: "elective",
    law: "male",
  },
  "POL-13": {
    gov: "elective",
    law: "equal",
  },
  "POL-14": {
    gov: "hereditary",
    law: "equal",
  },
  "POL-16": {
    gov: "council",
    law: "male",
  },
  "POL-19": {
    gov: "elective",
    law: "male",
  },
  "POL-21": {
    gov: "council",
    law: "male",
  },
  "POL-23": {
    gov: "elective",
    law: "equal",
  },
  "POL-26": {
    gov: "hereditary",
    law: "female",
  },
  "POL-27": {
    gov: "theocracy",
    law: "male",
  },
  "POL-29": {
    gov: "hereditary",
    law: "female",
  },
  "POL-33": {
    gov: "elective",
    law: "equal",
  },
  "POL-34": {
    gov: "elective",
    law: "female",
  },
};

A.AGGRO = {
  "POL-11": 1.7,
  "POL-34": 1.4,
  "POL-33": 1.3,
  "POL-12": 1.2,
  "POL-03": 1.25,
  "POL-01": 1.15,
  "POL-20": 1.15,
  "POL-25": 1.15,
  "POL-06": 0.5,
  "POL-07": 0.5,
  "POL-27": 0.2,
  "POL-02": 0.6,
  "POL-04": 0.6,
  "POL-16": 0.6,
  "POL-09": 0.4,
  "POL-23": 0.5,
  "POL-10": 0.4,
  "POL-28": 0.5,
  "POL-29": 0.5,
};

A.parseCastName = function (name) {
  let given = name,
    sur = "",
    epithet = "",
    mode = "house",
    m;
  if ((m = name.match(/^(.+?) ((?:son|daughter) of .+)$/))) {
    given = m[1];
    sur = m[2];
    mode = "patron";
  } else if ((m = name.match(/^(.+?) (of (?:the )?.+)$/))) {
    given = m[1];
    sur = m[2];
    mode = /Wind$/.test(m[2]) ? "tribe" : "place";
  } else if ((m = name.match(/^(.+?) (the .+)$/))) {
    given = m[1];
    epithet = m[2];
    mode = "single";
  } else {
    const w = name.split(" ");
    if (w.length >= 2 && !/^[IVX]+$/.test(w[w.length - 1])) {
      sur = w.pop();
      given = w.join(" ");
    } else {
      given = name;
      mode = "single";
    }
  }
  return {
    given,
    sur,
    epithet,
    mode,
  };
};

A.CAST_RACE = {
  human: "human",
  elf: "elf",
  dwarf: "dwarf",
  orc: "orc",
  giant: "giant",
  "half-orc": "halforc",
  "half-elf": "halfelf",
};

A.cultureFor = function (race, realm) {
  if (GD.RACE_CULTURE[race]) return GD.RACE_CULTURE[race](realm);
  const def = GD.REALM_CULTURE[realm] || "CUL-02",
    cr = LORE.cultures[def] ? LORE.cultures[def].race : "human";
  return (race === "human" || race === "halfelf" || race === "halforc") && cr !== "human"
    ? GD.REALM_HUMAN_CULTURE[realm] || "CUL-02"
    : def;
};

A.faithFor = function (race, realm) {
  return GD.RACE_FAITH[race] && !(race === "orc" && realm === "POL-33")
    ? GD.RACE_FAITH[race]
    : GD.REALM_FAITH[realm] || "REL-18";
};

A.personFromCast = function (cid, extra = {}) {
  if (A.S.castMap && A.S.castMap[cid] && A.P(A.S.castMap[cid])) return A.P(A.S.castMap[cid]);
  const c = LORE.cast[cid];
  if (!c) return null;
  const nm = A.parseCastName(c.name),
    race = A.CAST_RACE[c.race] || "human",
    realm = c.realm && c.realm.startsWith("POL") ? c.realm : "unclaimed",
    p = A.newPerson(
      Object.assign(
        {
          given: nm.given,
          sur: nm.sur,
          epithet: nm.epithet,
          surMode: nm.mode,
          sex: c.sex === "F" ? "F" : "M",
          race,
          realm,
          cult: A.cultureFor(race, realm),
          faith: A.faithFor(race, realm),
          born: c.born || 1070,
          castId: cid,
          status: c.role === "royal" || c.role === "ruler" ? "royal" : c.role === "noble" ? "noble" : "artisan",
          title: c.title,
          occ: c.title,
          potBonus: c.role === "fighter" ? 18 : c.role === "general" ? 10 : 5,
        },
        extra,
      ),
    ),
    age = A.age(p);
  if (c.role === "fighter") {
    for (const k of ["sword", "spear", "axe", "shield", "riding"]) p.skills[k] = A.ri(35, 85);
    p.skills.bow = A.ri(10, 70);
  }
  if (c.role === "general" || c.role === "ruler" || c.role === "royal") {
    p.skills.command = A.ri(30, 85);
    p.skills.tactics = A.ri(25, 85);
    p.skills.diplomacy = A.ri(20, 80);
    p.skills.stewardship = A.ri(20, 80);
    p.skills.sword = A.ri(15, 70);
    p.skills.riding = A.ri(20, 70);
  }
  if (c.role === "scholar" || c.role === "priest") {
    p.skills.learning = A.ri(40, 90);
    p.skills.faith = A.ri(20, 90);
    p.literate = true;
  }
  if (c.role === "spy") {
    p.skills.intrigue = A.ri(40, 90);
    p.skills.stealth = A.ri(30, 80);
  }
  if (c.role === "merchant") {
    p.skills.trade = A.ri(40, 90);
    p.skills.stewardship = A.ri(20, 70);
    p.literate = true;
  }
  p.fame = A.clamp(30 + A.ri(0, 40), 0, 100);
  p.health = A.clamp(100 - Math.max(0, age - GD.RACES[race].old) * 2, 30, 100);
  p.desc = c.looks;
  p.manner = c.manner;
  p.wants = c.wants;
  A.S.castMap = A.S.castMap || {};
  A.S.castMap[cid] = p.id;
  return p;
};

A.realmProvs = rid => A.S.prov.filter(p => p.owner === rid);

A.neighbors = function (rid) {
  const set = new Set();
  for (const p of A.S.prov)
    if (p.owner === rid)
      for (const j of p.adj.concat(p.sea || [])) {
        const o = A.S.prov[j].owner;
        if (o !== rid && o !== "unclaimed" && A.realm(o) && A.realm(o).alive) set.add(o);
      }
  return [...set];
};

A.realmPower = function (r) {
  return !r || !r.alive
    ? 0
    : (r.army + r.levy * 0.3) * r.armyQ * (0.65 + r.stability / 250) * (r.treasury < 0 ? 0.8 : 1);
};

A.atWar = function (rid) {
  return A.S.wars.filter(w => w.att.includes(rid) || w.def.includes(rid));
};

A.warSide = (w, rid) => (w.att.includes(rid) ? "att" : w.def.includes(rid) ? "def" : null);

A.enemiesOf = function (rid) {
  const out = new Set();
  for (const w of A.atWar(rid)) {
    const side = A.warSide(w, rid);
    for (const e of side === "att" ? w.def : w.att) out.add(e);
  }
  return [...out];
};

A.enemyRealmOf = function (rid) {
  const e = A.enemiesOf(rid);
  if (e.length) return e[0];
  const r = A.realm(rid);
  return r && r.rivals.length ? r.rivals[0] : null;
};

A.addRel = function (a, b, d) {
  const ra = A.realm(a),
    rb = A.realm(b);
  if (ra) ra.rel[b] = A.clamp((ra.rel[b] || 0) + d, -100, 100);
  if (rb) rb.rel[a] = A.clamp((rb.rel[a] || 0) + d, -100, 100);
};

A.COLORS_EXTRA = [
  "#d98c8c",
  "#8cd9b3",
  "#b38cd9",
  "#d9c78c",
  "#8cb3d9",
  "#c9d98c",
  "#d98cc7",
  "#8cd9d9",
  "#e0a070",
  "#70a0e0",
];

A.createRealm = function (o) {
  const id = o.id || "NEW-" + (A.S.nextRealm = (A.S.nextRealm || 0) + 1),
    r = {
      id,
      name: o.name,
      short: o.short || o.name,
      title: o.title || "King",
      type: o.type || "kingdom",
      gov: o.gov || "hereditary",
      law: o.law || "male",
      race: o.race || "human",
      cult: o.cult || "CUL-18",
      faith: o.faith || "REL-17",
      color: o.color || A.pick(A.COLORS_EXTRA),
      ruler: o.ruler || null,
      heir: null,
      house: o.house || null,
      treasury: o.treasury || 500,
      baseIncome: o.income || 2e3,
      income: o.income || 2e3,
      debt: 0,
      stability: o.stability || 50,
      legit: o.legit || 40,
      army: o.army || 500,
      levy: o.levy || 1500,
      armyQ: o.armyQ || 0.8,
      comp: o.comp || null,
      exhaustion: 0,
      rel: {},
      allies: [],
      truce: {},
      rivals: [],
      alive: true,
      created: A.S.year,
      capital: o.capital || "",
      capitalProv: o.capitalProv != null ? o.capitalProv : null,
      pop: 0,
      isNew: true,
      laws: {
        tax: 1,
      },
      faithName: "",
      primer: o.primer || null,
      coin: {
        coin: "sun",
        worth: 1,
      },
      ships: 0,
      history: [],
    };
  A.S.realms[id] = r;
  for (const k in A.S.realms)
    if (k !== id) {
      r.rel[k] = 0;
      A.S.realms[k].rel[id] = 0;
    }
  return r;
};

A.initWorld = function () {
  if (A.cacheReset) A.cacheReset();
  const S = A.S;
  S.houses = {};
  for (const id in LORE.houses)
    S.houses[id] = Object.assign(
      {
        op: A.ri(30, 70),
        extinct: /extinct/.test(LORE.houses[id].title),
      },
      JSON.parse(JSON.stringify(LORE.houses[id])),
    );
  if (A.initFamilies) A.initFamilies();
  // [X1 baked patch map/99991-v2-map V2MAP-PROV] Porting: when the world is created, right after the provinces are
  // copied from the map as written, hand them to the map generator (A.V2MAP.onProv) so their positions, adjacency,
  // coast, terrain, biome, height and size come from the generated continent before the realms read them.
  S.prov = LORE.map.provinces.map(p => ({
    id: p.id,
    name: p.name,
    owner: p.realm,
    orig: p.realm,
    x: p.x,
    y: p.y,
    sx: p.sx,
    sy: p.sy,
    pop: p.pop,
    town: p.town,
    terr: p.terr,
    biome: p.biome,
    elev: p.elev,
    fort: p.fort,
    coast: p.coast,
    adj: p.adj,
    sea: p.sea,
    type: p.type,
    dev: A.clamp(Math.round(2 + Math.log10(Math.max(10, p.pop)) - 3 + (p.town > 2e4 ? 2 : 0)), 1, 9),
    occ: null,
    siege: 0,
    unrest: 0,
    bld: {},
    cells: p.cells,
    pid: p.pid,
  }));
  if (A.V2MAP && A.V2MAP.onProv) A.V2MAP.onProv(S);
  for (const id in LORE.realms) {
    const L = LORE.realms[id],
      g = A.GOV[id] || {
        gov: "hereditary",
        law: "male",
      },
      r = {
        id,
        name: L.name,
        short: L.short,
        title: L.title,
        type: L.type,
        gov: g.gov,
        law: g.law,
        race:
          L.race === "human"
            ? "human"
            : {
                elf: "elf",
                dwarf: "dwarf",
                orc: "orc",
                giant: "giant",
              }[L.race] || "human",
        cult: GD.REALM_CULTURE[id],
        faith: GD.REALM_FAITH[id],
        color: L.color,
        ruler: null,
        heir: null,
        house: null,
        treasury: Math.round(L.income * 0.35),
        baseIncome: L.income,
        income: L.income,
        debt: /none|^-|no debt/i.test(L.debts) ? 0 : Math.round(L.income * 0.4),
        stability: A.STAB[L.stability] || 50,
        legit: 70,
        army: L.army,
        levy: L.levy,
        armyQ:
          0.9 + (L.comp ? Math.min(0.25, ((L.comp.heavyHorse + L.comp.heavyFoot) / Math.max(1, L.army)) * 0.6) : 0),
        comp: L.comp,
        exhaustion: 0,
        rel: {},
        allies: L.allies.slice(),
        truce: {},
        rivals: L.rivals.slice(),
        alive: true,
        created: -1,
        capital: L.capital,
        capitalProv: null,
        pop: L.pop,
        laws: {
          tax: 1,
        },
        primer: L.primer,
        coin: L.coin,
        ships: L.ships,
        history: [],
      };
    if (id === "POL-06" || id === "POL-07") r.armyQ = 1.35;
    if (id === "POL-28" || id === "POL-29" || id === "POL-10") r.armyQ = 1.4;
    if (id === "POL-09" || id === "POL-23") r.armyQ = 3;
    S.realms[id] = r;
  }
  for (const p of S.prov)
    if (p.type === "capital city" && S.realms[p.owner] && S.realms[p.owner].capitalProv == null)
      S.realms[p.owner].capitalProv = p.id;
  for (const id in S.realms) {
    const r = S.realms[id];
    if (r.capitalProv == null) {
      const ps = A.realmProvs(id);
      if (ps.length) r.capitalProv = ps.sort((a, b) => b.pop - a.pop)[0].id;
    }
  }
  for (const a in S.realms) for (const b in S.realms) if (a !== b) S.realms[a].rel[b] = 0;
  for (const a in S.realms) {
    const r = S.realms[a];
    for (const b of r.allies) A.setRelPair(a, b, 60);
    for (const b of r.rivals) A.setRelPair(a, b, -45);
  }
  const RELV = {
    alliance: 70,
    friendship: 40,
    trade: 20,
    debt: 5,
    "secret deal": 25,
    "backs claimant": 30,
    rivalry: -45,
    hostile: -75,
  };
  for (const x of LORE.relations)
    if (S.realms[x.a] && S.realms[x.b]) A.setRelPair(x.a, x.b, RELV[x.rel] != null ? RELV[x.rel] : 0);
  for (const id in S.realms) {
    const r = S.realms[id],
      roy = Object.values(S.houses).find(h => h.realm === id && h.kind === "royal");
    r.house = roy ? roy.id : null;
    let rulerCid = LORE.realms[id].ruler;
    if (id === "POL-22") rulerCid = A.findCast("Yared Asfari") || rulerCid;
    if (id === "POL-31") rulerCid = "CHR-0226";
    const ru = rulerCid && LORE.cast[rulerCid] ? A.personFromCast(rulerCid) : null;
    if (ru) {
      A.makeRuler(ru, id, true);
      if (roy) ru.house = roy.id;
    } else A.makeRuler(A.genNoble(id, "royal", roy ? roy.id : null, A.ri(30, 60)), id, true);
    A.buildRoyalFamily(r);
  }
  const tess = S.realms["POL-31"];
  if (tess) {
    const andros = A.personFromCast("CHR-0225"),
      tp = A.realmProvs("POL-31");
    if (andros && tp.length >= 2) {
      const nr = A.createRealm({
        id: "POL-31A",
        name: "Prince Andros's Tessaria",
        short: "Andros",
        title: "Prince",
        race: "human",
        cult: "CUL-01",
        faith: "REL-02",
        color: "#c98a6a",
        army: 13e3,
        levy: 3e4,
        armyQ: 0.95,
        income: 9e4,
        stability: 40,
        legit: 45,
        treasury: 2e4,
        comp: tess.comp,
        house: tess.house,
      });
      nr.created = 1061;
      nr.isNew = false;
      nr.primer = {
        intro:
          "The northern half of the Kingdom of Tessaria, held from Coreria by Prince Andros Tessaran, backed by the Dawn Church and Velgrad's money.",
      };
      const north = tp.sort((a, b) => a.y - b.y).slice(0, Math.max(1, Math.round(tp.length * 0.4)));
      // [X1 baked patch core/09-engine-at-scale SCALE-LAND-WRITES] A.realmProvs and A.neighbors scanned every province
      // on every call (A.politicsYear asks them for every pair of realms, so a year cost realms² × provinces).
      // 09-engine-at-scale answers them from an index of provinces by owner, which must be dropped the moment a province
      // changes hands. These are all the places that write a province's owner directly: transferProv, the claimant
      // settlements in settleWar, a claimant taking land in a succession war, a player founding a realm, a faction
      // breaking away, and Tessaria's split at the start. Each now bumps the land version.
      for (const q of north) {
        q.owner = "POL-31A";
        if (A.scaleLand) A.scaleLand();
      }
      const far = north.slice().sort((a, b) => b.pop - a.pop)[0];
      nr.capitalProv = far.id;
      nr.capital = far.name;
      A.makeRuler(andros, "POL-31A", true);
      andros.house = tess.house;
      tess.army = 18e3;
      tess.levy = 4e4;
      for (const k in S.realms)
        if (k !== "POL-31A") {
          nr.rel[k] = S.realms[k].rel["POL-31"] || 0;
          S.realms[k].rel["POL-31A"] = nr.rel[k];
        }
      A.setRelPair("POL-31", "POL-31A", -90);
      A.setRelPair("POL-31A", "POL-25", 60);
      A.setRelPair("POL-31", "POL-02", 60);
      nr.isRebel = true;
      nr.parent = "POL-31";
      A.startWar("POL-31A", "POL-31", "The Tessarian Civil War", "throne", {
        silent: true,
        start: 1061,
        claimant: andros.id,
        noAllies: true,
      });
    }
  }
  if (A.polAll) {
    A.polAll();
    A.polSeed();
  }
  A.updateRealmPops();
  S.branches = A.rollBranches();
  A.emit("worldInit");
};

A.findCast = name => {
  for (const id in LORE.cast) if (LORE.cast[id].name === name) return id;
  return null;
};

A.setRelPair = function (a, b, v) {
  if (A.S.realms[a]) A.S.realms[a].rel[b] = v;
  if (A.S.realms[b]) A.S.realms[b].rel[a] = v;
};

A.makeRuler = function (p, rid, silent) {
  if (p && A.S && p.id === A.S.pc) {
    p.ruler = rid;
    A.leaveRolesFor(p, "ruler");
  }
  const r = A.realm(rid);
  if (!r || !p) return;
  const old = A.P(r.ruler);
  if (old && old.ruler === rid) old.ruler = null;
  // [A2 posts] a crowned head leaves his seats, offices and divisions (he may still lead an army in person)
  if (A.POSTS && A.S.posts) A.POSTS.leaveAll(p.id, "crowned", { keepArmy: true });
  r.ruler = p.id;
  p.ruler = rid;
  p.realm = rid;
  if (A.S.pc === p.id && p.job) {
    A.log("You put aside your old work: a ruler has no time for it.");
    p.job = null;
  }
  if (A.S.pc === p.id && p.mil && !p.mil.merc) p.mil.rank = Math.max(p.mil.rank, 9);
  if (p.status !== "royal" && r.gov === "hereditary") p.status = "royal";
  p.fame = Math.max(p.fame, 55);
  if (!silent) r.history.push([A.S.year, A.fullName(p)]);
  if (r.heir === p.id) r.heir = null;
  A.pickHeir(r);
};

A.genNoble = function (rid, status, house, age, sex) {
  const race =
      (
        A.realm(rid) || {
          race: "human",
        }
      ).race || "human",
    cult = A.cultureFor(race, rid);
  sex = sex || (A.chance(0.6) ? "M" : "F");
  const h = house ? A.house(house) : null,
    p = A.newPerson({
      given: A.givenName(cult, sex),
      sex,
      race,
      realm: rid,
      cult,
      faith: A.faithFor(race, rid),
      born: A.S.year - age,
      status,
      house,
      potBonus: 4,
    }),
    fn = h
      ? {
          sur: A.houseSurname(h),
          mode: "house",
        }
      : A.familyName({
          cult,
          realm: rid,
          status,
          sex,
        });
  if (
    ((p.sur = fn.sur),
    (p.surMode = fn.mode),
    (p.skills.command = A.ri(5, 60)),
    (p.skills.diplomacy = A.ri(5, 60)),
    (p.skills.stewardship = A.ri(5, 60)),
    (p.skills.intrigue = A.ri(0, 50)),
    (p.skills.sword = A.ri(5, 50)),
    (p.skills.riding = A.ri(10, 60)),
    (p.literate = A.chance(0.7)),
    h)
  ) {
    const bl = Object.values(LORE.bloodlines).find(b => b.fam === h.id);
    if (bl && A.chance(0.5)) {
      p.blood = {
        id: bl.id,
        copies: 1,
        show: GD.BLOOD[bl.id] && GD.BLOOD[bl.id].mode !== "rec",
      };
      A.applyBloodPot(p);
    }
  }
  return p;
};

A.buildRoyalFamily = function (r) {
  const ru = A.P(r.ruler);
  if (!ru) return;
  const sur = ru.sur,
    kin = Object.values(LORE.cast).filter(
      c => c.realm === r.id && c.id !== ru.castId && sur && c.name.endsWith(" " + sur) && c.born,
    ),
    R2 = GD.RACES[ru.race];
  for (const c of kin) {
    const k = A.personFromCast(c.id);
    if (k) {
      k.house = r.house;
      k.status = "royal";
      if (k.born >= ru.born + R2.adult) {
        k.parents = [ru.sex === "M" ? ru.id : null, ru.sex === "F" ? ru.id : null].filter(Boolean);
        ru.children.push(k.id);
        A.link(ru, k, "child", 50, ru.sex === "M" ? "father" : "mother");
      } else A.link(ru, k, "sibling", 30, "sibling");
    }
  }
  const age = A.age(ru);
  if (!ru.children.length && age > R2.adult + 6 && r.gov === "hereditary") {
    const n = A.chance(0.4) ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const cage = A.ri(Math.max(1, age - R2.adult - 25), age - R2.adult - 1);
      if (cage < 0) continue;
      const k = A.genNoble(r.id, "royal", r.house, cage);
      if (ru.sur) {
        k.sur = ru.sur;
        k.surMode = "house";
      }
      if (ru.blood && A.chance(0.5))
        k.blood = {
          id: ru.blood.id,
          copies: 1,
          show: ru.blood.show,
        };
      k.parents = [ru.id];
      ru.children.push(k.id);
      A.link(ru, k, "child", 50, ru.sex === "M" ? "father" : "mother");
    }
  }
  A.pickHeir(r);
};

A.lawSort = function (r, list) {
  const law = r.law || "male";
  return list
    .slice()
    .sort((a, b) =>
      law === "male" && a.sex !== b.sex
        ? a.sex === "M"
          ? -1
          : 1
        : law === "female" && a.sex !== b.sex
          ? a.sex === "F"
            ? -1
            : 1
          : a.born - b.born,
    );
};

A.pickHeir = function (r) {
  const ru = A.P(r.ruler);
  if (!ru || r.gov !== "hereditary") {
    r.heir = null;
    return null;
  }
  if (r.heirLocked && A.P(r.heirLocked) && A.P(r.heirLocked).alive) {
    r.heir = r.heirLocked;
    return A.P(r.heir);
  }
  const kids = ru.children
    .map(A.P)
    .filter(k => k && k.alive && !k.flags.bastard && !k.flags.disinherited && !k.flags.priest);
  let cand = A.lawSort(r, kids);
  if (!cand.length) {
    const gk = [];
    for (const cid of ru.children) {
      const c = A.P(cid);
      if (c)
        for (const g of c.children) {
          const gg = A.P(g);
          if (gg && gg.alive && !gg.flags.bastard) gk.push(gg);
        }
    }
    cand = A.lawSort(r, gk);
  }
  if (!cand.length) {
    const sib = A.relsOf(ru, ["sibling"])
      .map(x => x.p)
      .filter(x => x.alive && !x.flags.bastard);
    cand = A.lawSort(r, sib);
  }
  r.heir = cand.length ? cand[0].id : null;
  return cand[0] || null;
};

A.updateRealmPops = function () {
  for (const id in A.S.realms) {
    const r = A.S.realms[id];
    r.provCount = 0;
    r.provPop = 0;
  }
  for (const p of A.S.prov) {
    const r = A.S.realms[p.owner];
    if (r) {
      r.provCount++;
      r.provPop += p.pop;
    }
  }
  for (const id in A.S.realms) {
    const r = A.S.realms[id];
    if (!r.alive) continue;
    if (r.provCount === 0 && !r.landless) {
      A.realmFalls(r, null);
      continue;
    }
    if (r.basePop == null) r.basePop = r.provPop || 1;
    const ratio = (r.provPop || 1) / (r.basePop || 1);
    r.pop = Math.round((r.pop0 || (r.pop0 = r.pop || r.provPop)) * ratio);
    r.income = Math.round(
      r.baseIncome *
        ratio *
        (r.laws && r.laws.tax ? r.laws.tax : 1) *
        (A.tradeMul ? A.tradeMul(r) : 1) *
        (A.AUTH && r.laws && r.laws.authority != null ? A.AUTH[r.laws.authority][1] : 1),
    );
  }
};

A.startWar = function (att, def, name, cb, opts = {}) {
  const S = A.S;
  if (
    att === def ||
    !A.realm(att) ||
    !A.realm(def) ||
    S.wars.some(w2 => (w2.att.includes(att) && w2.def.includes(def)) || (w2.att.includes(def) && w2.def.includes(att)))
  )
    return null;
  const w = {
    id: "W" + (S.nextWar = (S.nextWar || 0) + 1),
    name: name || A.warName(att, def),
    att: [att],
    def: [def],
    leadA: att,
    leadD: def,
    start: opts.start || S.year,
    score: 0,
    cb: cb || "conquest",
    battles: [],
    claimant: opts.claimant || null,
    goal: opts.goal || null,
    kills: {
      att: 0,
      def: 0,
    },
  };
  if ((S.wars.push(w), !opts.noAllies && A.callToArms)) {
    if ((A.setRelPair(att, def, Math.min(A.relBetween(att, def), -70)), !opts.silent)) {
      A.news(
        A.realmName(att) +
          " declares war on " +
          A.realmName(def) +
          (A.CB && A.CB[w.cb] ? " — " + A.CB[w.cb].toLowerCase() : "") +
          ". (" +
          w.name +
          ")",
        "war",
      );
      const pc0 = A.pc();
      if (pc0 && (pc0.realm === att || pc0.realm === def))
        A.log("War! " + w.name + ": " + A.realmShort(att) + " against " + A.realmShort(def) + ".", "war");
    }
    A.callToArms(w, opts);
    A.emit("warStart", w, opts);
    return w;
  }
  if (!opts.noAllies) {
    for (const al of A.realm(def).allies)
      if (
        A.realm(al) &&
        A.realm(al).alive &&
        !w.att.includes(al) &&
        !w.def.includes(al) &&
        A.relBetween(al, def) > 35 &&
        A.chance(0.55)
      )
        w.def.push(al);
    for (const al of A.realm(att).allies)
      if (
        A.realm(al) &&
        A.realm(al).alive &&
        !w.att.includes(al) &&
        !w.def.includes(al) &&
        A.relBetween(al, att) > 50 &&
        A.chance(0.3)
      )
        w.att.push(al);
  }
  if ((A.setRelPair(att, def, Math.min(A.relBetween(att, def), -70)), !opts.silent)) {
    A.news(
      A.realmName(att) +
        " declares war on " +
        A.realmName(def) +
        (w.def.length > 1 ? ", and " + w.def.slice(1).map(A.realmShort).join(", ") + " join the defense" : "") +
        ". (" +
        w.name +
        ")",
      "war",
    );
    const pc = A.pc();
    if (pc && (w.att.includes(pc.realm) || w.def.includes(pc.realm)))
      A.log("War! " + w.name + ": " + A.realmShort(att) + " against " + A.realmShort(def) + ".", "war");
  }
  A.emit("warStart", w, opts);
  return w;
};

A.warName = function (a, b) {
  const ra = A.realm(a),
    rb = A.realm(b),
    sa = ra.short.replace(/^the /i, ""),
    sb = rb.short.replace(/^the /i, ""),
    pv = A.realmProvs(b).concat(A.realmProvs(a)),
    forms = [
      `The ${sa}–${sb} War`,
      `The War of ${pv.length ? A.pick(pv).name : sb}`,
      `The ${A.pick(["Border", "Crown", "Iron", "Salt", "Grey", "Red", "Long", "Bitter"])} War`,
    ];
  return A.pick(forms);
};

A.endWar = function (w, result, text) {
  const S = A.S,
    live = !!(w && S.wars.includes(w) && !w.end);
  if (live) endWarNow(w, result, text);
  A.emit("warEnd", w, result, text, live);
};
