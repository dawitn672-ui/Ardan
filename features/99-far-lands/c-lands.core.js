// The Great Continent (stage 2 of docs/plan/world-expansion-architecture.md): the Known World as the western end of
// a continent two and a half times its width, from the far-lands data (b-data.core.js, made by gen/gen.mjs). A game
// started from the menu (New life, Random life, Randomize) is on the Great Continent unless the creation screen's
// "Lands" choice says "The Known World only". A.newGame() called by code with no `lands` keeps the world as written,
// so tests, bots and benches do not move; A.newGame({ lands: 'great' }) asks for the continent.
//
// How it is added: the far lands are data the release already knows how to read, so they are put where it reads
// them, for as long as a game of the Great Continent is open, and taken out again for any other game:
//   LORE.map           the map as written plus the far provinces (ids from 306), each province of the Known World on
//                      the seam given its new neighbours; MAP.want() names the far grid, a-frame.core.js builds it
//   LORE.realms, LORE.houses, LORE.relations, LORE.cultures, LORE.faiths, LORE.titlesByRealm
//   GD.REALM_CULTURE, GD.REALM_FAITH, GD.REALM_HUMAN_CULTURE, GD.NAMING, GD.LANG, GD.DOCTRINE, GD.GIANT_HALLS,
//   A.GOV, A.AGGRO     every far realm's entry, the way 70-fresh-realms' FR.register adds its realms
// A.initWorld then builds the far realms as it builds the others (treasury, army, relations, a ruler from the
// realm's culture, a royal family), and 43 and 70 vary and split them like the rest.
//
// State: a game of the Great Continent carries S.world = { v: 1, parts: ['ardan', 'far@2'] } and each far province a
// `region` (an F-xx style code of the ten Far Lands). A save without S.world is the world as written. A save of far@1
// (the first data, Oct 26) opens on its own provinces, which the save holds whole: its grid is rebuilt from them
// (FL.legacyPart), so its state is untouched. A save that names lands this build does not have is refused with a
// plain message, never drawn on the wrong grid. Every save records its world in its header (meta.world).
(function () {
  const D = A.FL_DATA;
  if (!D) return;
  const FL = A.FAR = { D, KEY: D.key, LEGACY: ['far@1'], MENU_LANDS: 'great', active: false, OFF: false, part: null };
  FL.LANDS = D.lands;
  const BASE_MAP = LORE.map;
  const nb = D.base;
  if (BASE_MAP.provinces.length !== nb) { console.error('far lands: the map as written has', BASE_MAP.provinces.length, 'provinces, the data was made for', nb); return; }
  // 76-beast-habitats reads the map as written once; let it do so now, before any far province is in LORE.map
  try { if (A.BH && A.BH.resolve) A.BH.resolve(); } catch (e) { console.error(e); }

  // ---- the far provinces, from columns, and the great map
  let farProvs = null, greatMap = null, landPos = null, roadSet = null;
  // the far provinces of the open part: far@2's from the data, or a legacy part's from its save
  FL.provinces = function () {
    if (FL.part && FL.part.provs) return FL.part.provs;
    if (farProvs) return farProvs;
    const C = D.provinces, n = C.id.length, out = [];
    for (let k = 0; k < n; k++) out.push({ id: C.id[k], pid: C.pid[k], name: C.name[k], type: C.type[k], realm: C.realm[k], x: C.x[k], y: C.y[k], sx: C.sx[k], sy: C.sy[k],
      pop: C.pop[k], town: C.town[k], biome: C.biome[k], terr: C.terr[k], elev: C.elev[k], fort: C.fort[k], coast: !!C.coast[k], cells: C.cells[k], adj: C.adj[k], sea: C.sea[k], region: C.region[k] });
    return (farProvs = out);
  };
  FL.map = function () {
    if (greatMap) return greatMap;
    // the Known World's provinces on the seam: their new neighbours, and the land they run on into past the old edge
    const seam = D.seam, seaB = D.seaBase, ext = D.baseExt || {};
    const base = BASE_MAP.provinces.map(p => (seam[p.id] || seaB[p.id] || ext[p.id]) ? Object.assign({}, p, {
      adj: p.adj.concat(seam[p.id] || []), sea: (p.sea || []).concat(seaB[p.id] || []),
      cells: p.cells + (ext[p.id] ? ext[p.id][0] : 0), coast: p.coast || !!(ext[p.id] && ext[p.id][1]),
    }) : p);
    greatMap = Object.assign({}, BASE_MAP, { provinces: base.concat(FL.provinces()), parts: ['ardan', D.key] });
    return greatMap;
  };
  MAP.want = () => FL.active ? FL.part : null;

  // ---- a save of an earlier part (far@1): its provinces are in the save, whole (A.initWorld copies every field of
  // LORE.map's provinces into S.prov), so the part is rebuilt from them: the map as written plus those provinces, and
  // a grid in which each far province holds the land round its site, grown over the land of either part. Its state
  // is not touched; the picture is the old one's, near enough (its coasts are this part's where both have land).
  const legacy = {};
  FL.legacyPart = function (S, key) {
    if (legacy[key]) return legacy[key];
    const Q = S.prov.slice(nb).map(p => ({ id: p.id, pid: p.pid, name: p.name, type: p.type, realm: p.orig || p.owner, x: p.x, y: p.y, sx: p.sx, sy: p.sy, pop: p.pop, town: p.town,
      biome: p.biome, terr: p.terr, elev: p.elev, fort: p.fort, coast: !!p.coast, cells: p.cells, adj: p.adj.slice(), sea: (p.sea || []).slice(), region: p.region }));
    const base = S.prov.slice(0, nb).map((p, i) => Object.assign({}, BASE_MAP.provinces[i], { adj: p.adj.slice(), sea: (p.sea || []).slice(), cells: p.cells, coast: !!p.coast }));
    const gw = D.gw, gh = D.gh, cell = D.cell, ox = D.ox || 0, oy = D.oy || 0, bw = BASE_MAP.gw, bh = BASE_MAP.gh;
    const now = new Int16Array(gw * gh).fill(-1); MAP.decodeRle(D.rle, now);
    const inBase = i => { const x = i % gw - ox, y = (i / gw | 0) - oy; return x >= 0 && y >= 0 && x < bw && y < bh; };
    // land: this part's far land, and a disc of each old province's size round its site
    const land = new Uint8Array(gw * gh);
    for (let i = 0; i < now.length; i++) if (now[i] >= nb && !inBase(i)) land[i] = 1;
    const at = (kx, ky) => { const x = Math.floor((kx - D.x0) / cell), y = Math.floor((ky - D.y0) / cell); return x >= 0 && y >= 0 && x < gw && y < gh ? y * gw + x : -1; };
    for (const q of Q) {
      const r = Math.sqrt(q.cells / Math.PI) * 0.95, cx = (q.sx - D.x0) / cell, cy = (q.sy - D.y0) / cell;
      for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        if (x < 0 || y < 0 || x >= gw || y >= gh || (x - cx) ** 2 + (y - cy) ** 2 > r * r) continue;
        const i = y * gw + x; if (!inBase(i)) land[i] = 1;
      }
    }
    // each old province grows from its site over that land, all at once
    const g = new Int16Array(gw * gh).fill(-1), qu = new Int32Array(gw * gh); let h = 0, t = 0;
    for (const q of Q) { const i = at(q.sx, q.sy); if (i >= 0 && !inBase(i) && g[i] < 0) { g[i] = q.id; land[i] = 1; qu[t++] = i; } }
    while (h < t) {
      const i = qu[h++], x = i % gw, v = g[i];
      for (const j of [x > 0 ? i - 1 : -1, x < gw - 1 ? i + 1 : -1, i - gw, i + gw]) if (j >= 0 && j < g.length && land[j] && g[j] < 0) { g[j] = v; qu[t++] = j; }
    }
    // the Known World's cells come from the map as written (MAP.init copies them in)
    const part = { key, gw, gh, cell, x0: D.x0, y0: D.y0, ox, oy, grid: g, provs: Q, legacy: true };
    part.map = Object.assign({}, BASE_MAP, { provinces: base.concat(Q), parts: ['ardan', key] });
    return (legacy[key] = part);
  };

  // ---- the far realms' entries in the tables keyed by realm, culture and faith
  const AGGRO = { khaganate: 1.4, 'nomad confederation': 1.3, 'horse clans': 1.2, 'orc clans': 1.5, empire: 1.15, 'temple state': 0.4, 'city-state': 0.6, 'port city': 0.6, 'caravan league': 0.5, 'river league': 0.6, 'dwarven hold': 0.5, 'giant territory': 0.4, 'sea-hunter clans': 0.5, thalassocracy: 1.1 };
  // each land's armies are drilled like a realm of the Known World that fights on the same ground (layer 5.4)
  const DOCTRINE_LIKE = { T: 'POL-26', N: 'POL-23', F: 'POL-12', B: 'POL-17', H: 'POL-27', R: 'POL-01', M: 'POL-30', A: 'POL-32', I: 'POL-14', D: 'POL-22' };
  const RACE_LIKE = { orc: 'POL-34', dwarf: 'POL-28', giant: 'POL-23' };
  const reg = [], unfreeAdded = [];
  // who is unfree in the far lands, from the lore (far-lands.json and the compendium): slaves where they are taken,
  // sold or bought (Silo's raids, the Tide Families' and the Strait's trade, Lamhou and the South Chain that buy them,
  // Rakhol's and Kethra's slavers, Lingkaro up the rivers, the boys bought for Navesht's horse and sold at Marast, the
  // Deep Southland's captives at Mosandi and the Coral Coast, Pravith's temple slaves); serfs where debt bondage holds
  // the farmers south of the Cloudwall (the Gulf Plain's ranked houses, the Delta, the peninsula's rice kingdoms)
  // a far realm's law family, from its people and its land: the orc clans keep the clan-mothers' law and the dwarves
  // the Law-Carvers'; Silo the crews' vote; where the lore has debt bondage (south of the Cloudwall, the Thousand Isles)
  // and in the Birch March and the Black Pines' principalities (bound to the creditor's land, as in Drevna and
  // Velgrad), the east's; the rest keep the release's own "other"
  FL.lawOf = function (id, r) {
    if (!r) return null;
    if (r.race === 'orc') return 'orc';
    if (r.race === 'dwarf') return 'deep';
    if (id === 'POL-118') return 'pirate';
    if (r.land === 'M' || r.land === 'A' || id === 'POL-63' || (r.land === 'T' && /principality|kingdom|fur/i.test(r.type || ''))) return 'east';
    return null;
  };
  FL.UNFREE = {
    slave: ['POL-118', 'POL-43', 'POL-42', 'POL-139', 'POL-110', 'POL-114', 'POL-97', 'POL-92', 'POL-78', 'POL-77', 'POL-151', 'POL-147', 'POL-98'],
    serf: ['POL-91', 'POL-93', 'POL-99', 'POL-100', 'POL-101', 'POL-102', 'POL-96'],
  };
  const put = (obj, k, v) => { if (!obj || v == null || Object.prototype.hasOwnProperty.call(obj, k)) return; obj[k] = v; reg.push([obj, k]); };
  FL.install = function (part) {
    part = part || D;
    if (FL.active && FL.part === part) return;
    if (FL.active) FL.uninstall();
    FL.part = part; landPos = null; roadSet = null;
    LORE.map = part === D ? FL.map() : part.map;
    const R = D.realms;
    for (const id in D.cultures) { put(LORE.cultures, id, D.cultures[id]); put(GD.NAMING, id, D.naming[id]); put(GD.LANG, id, D.lang[id]); }
    for (const f of D.faiths) put(LORE.faiths, f.id, f);
    for (const id in R) {
      const r = R[id], like = RACE_LIKE[r.race] || DOCTRINE_LIKE[r.land];
      // the colour a far realm is shown in everywhere (91-look's UI.realmHex: an accent apart from its neighbours, read
      // from this data alone) is its colour in the state too, so the map, banners, chips and portrait grounds agree
      let hex = null; try { hex = UI.realmHex ? UI.realmHex(id) : null; } catch (e) { hex = null; }
      put(LORE.realms, id, hex && /^#[0-9a-f]{6}$/i.test(hex) && hex !== r.color ? Object.assign({}, r, { color: hex }) : r);
      if (r.race === 'human') put(GD.REALM_CULTURE, id, r.cult);
      else {
        put(GD.REALM_CULTURE, id, r.cult);
        const human = Object.values(D.cultures).find(c => c.race === 'human' && c.land === r.land);
        put(GD.REALM_HUMAN_CULTURE, id, human ? human.id : 'CUL-02');
      }
      put(GD.REALM_FAITH, id, r.faith);
      put(A.GOV, id, r.govLaw);
      put(A.AGGRO, id, AGGRO[r.type] || 1);
      if (GD.DOCTRINE && GD.DOCTRINE[like]) put(GD.DOCTRINE, id, GD.DOCTRINE[like].slice());
      if (LORE.titlesByRealm) put(LORE.titlesByRealm, id, { style: `${r.title} of ${r.short}`, forms: 'Lord, Knight', command: `the ${r.title}'s host` });
      if (r.race === 'giant' && GD.GIANT_HALLS) put(GD.GIANT_HALLS, id, [r.capital].concat(Object.values(D.houses).filter(h => h.realm === id).map(h => h.seat)));
    }
    for (const id in D.houses) put(LORE.houses, id, D.houses[id]);
    // the far realms' law families (A.LAW, read by A.lawOf: how a court punishes theft, debt and blood). Without one a
    // realm falls to the release's "other", the harshest for prison (debt and murder are the cells), which sent far
    // lives to prison three times as often as the Known World's
    if (A.LAW) for (const id in R) {
      const k = FL.lawOf(id, R[id]), L = k && A.LAW[k];
      if (Array.isArray(L) && !L.includes(id)) { L.push(id); unfreeAdded.push([L, id]); }
    }
    // the far realms whose lore has unfree people (GD.UNFREE: where a life can be born a slave or a serf)
    if (GD.UNFREE) for (const kind of ['slave', 'serf']) {
      const L = GD.UNFREE[kind]; if (!Array.isArray(L)) continue;
      for (const id of FL.UNFREE[kind]) if (D.realms[id] && !L.includes(id)) { L.push(id); unfreeAdded.push([L, id]); }
    }
    FL.rels = D.relations.slice();
    for (const x of FL.rels) LORE.relations.push(x);
    FL.active = true;
    MAP.init();
  };
  FL.uninstall = function () {
    if (!FL.active) return;
    for (let i = reg.length - 1; i >= 0; i--) delete reg[i][0][reg[i][1]];
    for (const [L, id] of unfreeAdded) { const k = L.indexOf(id); if (k >= 0) L.splice(k, 1); }
    unfreeAdded.length = 0;
    reg.length = 0;
    const drop = new Set(FL.rels || []);
    for (let i = LORE.relations.length - 1; i >= 0; i--) if (drop.has(LORE.relations[i])) LORE.relations.splice(i, 1);
    LORE.map = BASE_MAP;
    FL.active = false; FL.part = null; landPos = null; roadSet = null;
    MAP.init();
  };
  FL.set = (on, part) => { if (FL.OFF) on = false; if (on) FL.install(part); else FL.uninstall(); };
  FL.isGreat = S => !!(S && S.world && Array.isArray(S.world.parts) && S.world.parts.length > 1);

  // non-human far realms have peoples of their own (the release gives every orc the Horde's culture otherwise)
  for (const race of ['orc', 'dwarf', 'giant', 'elf']) {
    const f = GD.RACE_CULTURE && GD.RACE_CULTURE[race];
    if (typeof f !== 'function') continue;
    GD.RACE_CULTURE[race] = function (realm) {
      if (FL.active && D.realms[realm] && D.realms[realm].race === race && D.realms[realm].cult) return D.realms[realm].cult;
      return f.apply(this, arguments);
    };
  }

  // ---- the game: a new game asks for its lands; the world records them; a save brings its own back
  const ng = A.newGame;
  A.newGame = function (o) {
    FL.set(!!(o && o.lands === 'great'), D);
    return ng.apply(this, arguments);
  };
  const init = A.initWorld;
  A.initWorld = function () {
    const r = init.apply(this, arguments);
    const S = A.S;
    if (FL.active && S && FL.part === D) {
      S.world = { v: 1, parts: ['ardan', D.key] };
      const Q = FL.provinces();
      for (const q of Q) { const p = S.prov[q.id]; if (p) p.region = q.region; }
      for (const id in D.realms) {
        const L = D.realms[id], rr = S.realms[id]; if (!rr) continue;
        if (L.race === 'dwarf') rr.armyQ = 1.4; else if (L.race === 'giant') rr.armyQ = 3;
        rr.land = L.land;
        // a ruler the lore names keeps the generated life, under the lore's name
        const ru = L.rulerName && A.parseCastName ? A.P(rr.ruler) : null;
        if (ru) { const n = A.parseCastName(L.rulerName); ru.given = n.given; if (n.sur) { ru.sur = n.sur; ru.surMode = n.mode; } ru.epithet = n.epithet || ru.epithet; }
      }
    }
    return r;
  };
  const mig = A.migrate;
  A.migrate = function (S) {
    let part = D;
    if (S && S.world && Array.isArray(S.world.parts)) {
      const missing = S.world.parts.filter(k => k !== 'ardan' && k !== D.key && !FL.LEGACY.includes(k));
      if (missing.length) throw new Error(`it was made with lands this version of the game does not have (${missing.join(', ')})`);
      const old = S.world.parts.find(k => FL.LEGACY.includes(k));
      if (old) {
        if (!Array.isArray(S.prov) || S.prov.length <= nb) throw new Error(`its lands (${old}) are missing from it`);
        part = FL.legacyPart(S, old);
      }
    }
    FL.set(FL.isGreat(S), part);
    return mig.apply(this, arguments);
  };
  // every save says which world it holds, in its header (the state itself carries S.world only on the far lands)
  const meta = SAVES.meta;
  SAVES.meta = function (S) {
    const m = meta.apply(this, arguments);
    try { m.world = S && S.world && S.world.parts ? S.world.parts.join('+') : 'ardan'; } catch (e) {}
    return m;
  };
  // the parts of an old house record are diffed against LORE when saved; a far house is kept whole, so a save of the
  // Great Continent unpacks the same whichever lands are in LORE at the time
  const tpl = A.houseTemplate;
  A.houseTemplate = function (id) { return D.houses[id] ? null : tpl.apply(this, arguments); };

  // ---- the creation screen: the Great Continent (the default for a game from the menu), or the Known World only
  const fmtN = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  FL.creationField = c => {
    const nFar = Object.keys(D.realms).length, nKnown = Object.keys(LORE.realms).filter(id => !D.realms[id]).length, nProv = nb + D.provinces.id.length;
    const facts = t => `<div class="fl-facts small muted">${t}</div>`;
    const opts = [
      ['great', 'The Great Continent', 'The Known World is the western end of a continent two and a half times as wide, from the taiga to the equator, as far as the Sunrise Isles.' +
        facts(`${nKnown + nFar} realms · ${fmtN(nProv)} provinces · ${fmtN(D.gw * D.cell)} km east to west`)],
      ['known', 'The Known World only', 'The smaller classic map: the Westland, the Southland and the Eastland, and nothing past the steppe at Kraoth.' +
        facts(`${nKnown} realms · ${fmtN(nb)} provinces · ${fmtN(BASE_MAP.gw * (BASE_MAP.cell || 10))} km east to west`)],
    ];
    return `<div class="field fl-lands"><label>Lands</label><div class="opt-grid">${opts.map(d => UI.opt((c.lands || FL.MENU_LANDS) === d[0], 'crSet', 'lands:' + d[0], d[1], d[2])).join('')}</div></div>`;
  };
  const crSet = UI.A.crSet;
  UI.A.crSet = function (v) {
    if (typeof v === 'string' && v.startsWith('lands:')) {
      const great = v === 'lands:great';
      UI.cr.lands = great ? 'great' : 'known';
      FL.set(great, D); UI.worldReady = false; UI.ensureWorld(); UI.crFix(); UI.render();
      return;
    }
    return crSet.apply(this, arguments);
  };
  // a game from the menu starts on the lands its creation screen asks for: the Great Continent unless the player
  // chose the Known World only. The world under the creation screen is built on those lands.
  const menuLands = () => (UI.cr && UI.cr.lands) || FL.MENU_LANDS;
  const ready = great => {
    if (FL.active !== great || (FL.active && FL.part !== D)) { FL.set(great, D); UI.worldReady = false; }
    // a world of other lands (or of a legacy part) would sit under the creation screen on the wrong grid: it goes
    if (A.S && (FL.isGreat(A.S) !== great || ((A.S.world && A.S.world.parts) || []).some(k => FL.LEGACY.includes(k)))) A.S = null;
  };
  for (const k of ['newLife', 'randomLife']) {
    const f = UI.A[k];
    if (typeof f === 'function') UI.A[k] = function () { UI.cr = null; ready(FL.MENU_LANDS === 'great'); return f.apply(this, arguments); };
  }
  // Randomize keeps the lands the screen shows
  const rnd = UI.crRandomize;
  if (typeof rnd === 'function') UI.crRandomize = function () {
    const keep = menuLands(), r = rnd.apply(this, arguments);
    if (UI.cr) UI.cr.lands = keep;
    return r;
  };
  if (typeof UI.crDefaults === 'function') {
    const cd = UI.crDefaults;
    UI.crDefaults = function () { const c = cd.apply(this, arguments); if (c && typeof c === 'object') c.lands = FL.MENU_LANDS; return c; };
  }
  // the birthplace list: with the far lands open, realms are grouped by land (the select's own type-ahead finds one)
  FL.realmOptions = function (ids, c) {
    if (!FL.active) return null;
    const groups = new Map(), KNOWN = 'The Known World';
    for (const id of ids) {
      const L = LORE.realms[id], land = D.realms[id] ? ((D.lands[D.realms[id].land] || {}).name || 'The Far Lands') : KNOWN;
      if (!groups.has(land)) groups.set(land, []);
      groups.get(land).push(id);
    }
    const order = [KNOWN].concat(['F', 'B', 'H', 'M', 'R', 'T', 'N', 'I', 'A', 'D'].concat(Object.keys(D.lands).sort()).filter(k => D.lands[k]).map(k => D.lands[k].name)).filter((n, i, a) => groups.has(n) && a.indexOf(n) === i);
    for (const n of groups.keys()) if (!order.includes(n)) order.push(n);
    const pk = GD.RACE_POPKEY[c.race], rn = UI.esc(GD.RACES[c.race].name.toLowerCase());
    return order.map(n => `<optgroup label="${UI.esc(n)}">${groups.get(n).slice().sort((a, b) => String(LORE.realms[a].name).localeCompare(String(LORE.realms[b].name))).map(r => {
      const L2 = LORE.realms[r], m = (L2.pops && L2.pops[pk]) || 0;
      return `<option value="${UI.esc(r)}" ${r === c.realm ? 'selected' : ''}>${UI.esc(L2.name)} — ${A.fmt(m)} ${rn}s</option>`;
    }).join('')}</optgroup>`).join('');
  };
  if (typeof document !== 'undefined') {
    const st = document.createElement('style'); st.id = 'fl-style';
    st.textContent = '.fl-lands .fl-facts{margin-top:6px;font-size:12px;color:var(--ink-3,#9a9cb8)}.fl-lands .opt .d{line-height:1.4}';
    (document.head || document.documentElement).appendChild(st);
  }

  // ---- the great routes (far@2's D.routes: the lore's roads, river roads and sea roads, and canon TR-09 west of
  // Kraoth), as the economy reads a road. 66-markets' carters find their way over the province graph, and a step
  // along a route costs FL.ROAD_F of an ordinary one (MT.roadF, read by its graph); 45-economy's caravans price the
  // road between two capitals by distance, and two realms on the same route pay the route's rate for it. The sea
  // lanes a sea road needs are in the data. A legacy part and the Known World alone have no routes (factor 1).
  FL.ROAD_F = 0.55;
  FL.roads = function () {
    if (roadSet) return roadSet;
    const set = new Set();
    if (FL.active && FL.part === D) for (const r of D.routes || []) for (let i = 1; i < r.p.length; i++) { const a = r.p[i - 1], b = r.p[i]; set.add(a * 65536 + b); set.add(b * 65536 + a); }
    return (roadSet = set);
  };
  FL.roadF = (a, b) => FL.active && FL.part === D && FL.roads().has(a * 65536 + b) ? FL.ROAD_F : 1;
  if (A.MT) A.MT.roadF = FL.roadF;
  // the realms each route runs through now (who holds its provinces)
  FL.routeRealms = function () {
    const S = A.S, out = []; if (!S || !S.prov || !FL.active || FL.part !== D) return out;
    for (const r of D.routes || []) { const set = new Set(); for (const id of r.p) { const P = S.prov[id]; if (P && P.owner) set.add(P.owner); } out.push({ id: r.id, n: r.n, realms: set }); }
    return out;
  };
  const E = A.ECON;
  if (E && typeof E.roads === 'function') {
    const roads = E.roads;
    E.roads = function () {
      const T = roads.apply(this, arguments);
      if (!T || T._fl || !FL.active || FL.part !== D) return T;
      T._fl = 1;
      const shared = new Set();
      for (const r of FL.routeRealms()) { const ids = [...r.realms].filter(id => T.idx[id] != null); for (const a of ids) for (const b of ids) if (a !== b) shared.add(T.idx[a] * T.n + T.idx[b]); }
      for (const x of shared) T.f[x] = Math.min(T.f[x], E.ROAD + E.HOP * T.dist[x] / 250 * FL.ROAD_F);
      T.routed = shared.size;
      return T;
    };
  }

  // ---- beasts: no beast of the Known World's bestiary is near a far province unless its canon range runs on into
  // that land (76-beast-habitats keeps the Known World's own ranges). The far lands' own beasts are stage 3.
  FL.BEAST_LANDS = {
    'Woolly Rhino': ['F'], 'Cave Hyena': ['F', 'B'], 'Tiger of Ranpur': ['M'], 'World Python': ['M', 'A'], 'Snow Ape': ['H'],
    'Great Crocodile': ['M', 'A', 'D'], 'River Horse': ['D'], 'Green Anaconda': ['D'], 'Forest Men': ['D'], 'Old Man of the Trees': ['D'],
  };
  const landOf = P => { const r = P && P.region; return typeof r === 'string' ? r[0] : null; };
  const near = A.beastsNear;
  A.beastsNear = function (pc) {
    const out = near.apply(this, arguments);
    const P = pc && pc.home != null ? A.prov(pc.home) : null;
    if (!P || P.id < nb) return out;
    const L = landOf(P), name = id => { const c = (LORE.creatures || []).find(x => x.id === id); return c ? c.name : ''; };
    return out.filter(id => (FL.BEAST_LANDS[name(id)] || []).includes(L));
  };

  // ---- the ten Far Lands named on the map when it is seen from far off, in the hand of an old map's regions (drawn
  // under the realms' names, with the borders and towns). Rendering only.
  FL.landNames = function () {
    if (landPos) return landPos;
    const acc = {}, Q = FL.provinces();
    for (const q of Q) { const L = q.region && q.region[0]; if (!L) continue; const a = acc[L] || (acc[L] = { x: 0, y: 0, w: 0 }); a.x += q.x * q.cells; a.y += q.y * q.cells; a.w += q.cells; }
    landPos = Object.keys(acc).sort().map(L => ({ L, name: (D.lands[L] && D.lands[L].name || L).toUpperCase(), x: acc[L].x / acc[L].w, y: acc[L].y / acc[L].w }));
    return landPos;
  };
  // (the names are written by d-atlas.core.js, with the rest of the atlas)

  // ---- the far lands' relief, for the map with the inked style off (the release's picture covers the Known World).
  // The release's picture is a shaded relief; the far lands get one too: a height field from the provinces' heights,
  // softened across their bounds and roughened by a seeded noise (more in hills and mountains), lit from the upper
  // left (brief: light comes from the upper left, everywhere) over each ground's colour. Rendering only: the noise is a
  // hash of the cell, so the same map gives the same picture, and nothing draws a random number.
  const TERR_RGB = { hills: [150, 136, 98], mountains: [134, 118, 102], forest: [78, 108, 66], steppe: [178, 162, 106], plains: [136, 152, 86], desert: [200, 180, 130], tundra: [178, 182, 172], marsh: [94, 118, 98] };
  const ROUGH = { mountains: 1, hills: 0.55, tundra: 0.25, forest: 0.2, desert: 0.18, steppe: 0.12, plains: 0.1, marsh: 0.05 };
  const hash2 = (x, y) => { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const vnoise = (x, y, s) => { const fx = x / s, fy = y / s, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy, u = tx * tx * (3 - 2 * tx), v = ty * ty * (3 - 2 * ty);
    const a = hash2(ix, iy), b = hash2(ix + 1, iy), c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
  const boxBlur = (src, gw, gh, r) => {
    const tmp = new Float32Array(src.length), out = new Float32Array(src.length);
    for (let y = 0; y < gh; y++) { let acc = 0; const o = y * gw; for (let x = -r; x < gw; x++) { if (x + r < gw) acc += src[o + x + r]; if (x - r - 1 >= 0) acc -= src[o + x - r - 1]; if (x >= 0) tmp[o + x] = acc / (2 * r + 1); } }
    for (let x = 0; x < gw; x++) { let acc = 0; for (let y = -r; y < gh; y++) { if (y + r < gh) acc += tmp[(y + r) * gw + x]; if (y - r - 1 >= 0) acc -= tmp[(y - r - 1) * gw + x]; if (y >= 0) out[y * gw + x] = acc / (2 * r + 1); } }
    return out;
  };
  MAP.farRelief = function () {
    if (!FL.active || !MAP.grid || !FL.part || MAP.gridKey !== FL.part.key || typeof document === 'undefined') return null;
    if (MAP.farReliefCv) return MAP.farReliefCv;
    const { gw, gh, grid } = MAP, cv = document.createElement('canvas'); cv.width = gw; cv.height = gh;
    const ctx = cv.getContext('2d'), im = ctx.createImageData(gw, gh), d = im.data, Q = FL.provinces(), bw = BASE_MAP.gw, bh = BASE_MAP.gh, ox = FL.part.ox || 0, oy = FL.part.oy || 0;
    const provOf = v => v < nb ? BASE_MAP.provinces[v] : Q[v - nb];
    const N = gw * gh, e = new Float32Array(N), rough = new Float32Array(N), land = new Uint8Array(N);
    for (let i = 0; i < N; i++) { const v = grid[i]; if (v < 0) continue; const p = provOf(v); if (!p) continue; land[i] = 1; e[i] = Math.max(0, p.elev || 0); rough[i] = ROUGH[p.terr] || 0.15; }
    const eS = boxBlur(boxBlur(e, gw, gh, 4), gw, gh, 3), rS = boxBlur(rough, gw, gh, 3);
    const h = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      if (!land[i]) continue;
      const x = i % gw, y = (i / gw) | 0, n = vnoise(x, y, 24) * 0.55 + vnoise(x + 91, y + 37, 9) * 0.3 + vnoise(x + 13, y + 71, 3.5) * 0.15;
      h[i] = eS[i] * (0.75 + 0.5 * n) + rS[i] * 2400 * (n - 0.45);
    }
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
      const i = y * gw + x, o = i * 4, v = grid[i];
      if ((x >= ox && y >= oy && x < ox + bw && y < oy + bh) || v < 0 || !land[i]) { d[o + 3] = 0; continue; }          // the Known World's picture, and the sea
      const p = provOf(v), c = TERR_RGB[p && p.terr] || [140, 140, 120];
      const hx = (x > 0 && land[i - 1] ? h[i - 1] : h[i]) - (x < gw - 1 && land[i + 1] ? h[i + 1] : h[i]), hy = (y > 0 && land[i - gw] ? h[i - gw] : h[i]) - (y < gh - 1 && land[i + gw] ? h[i + gw] : h[i]);
      // lit from the upper left: a slope facing it is lighter, one facing away darker
      let sh = 1 - (hx + hy) / 900; sh = sh < 0.62 ? 0.62 : sh > 1.32 ? 1.32 : sh;
      const coast = (x > 0 && grid[i - 1] < 0) || (x < gw - 1 && grid[i + 1] < 0) || (y > 0 && grid[i - gw] < 0) || (y < gh - 1 && grid[i + gw] < 0);
      const k = sh * (coast ? 0.82 : 1) * (0.97 + 0.06 * (h[i] > 2600 ? 1 : h[i] / 2600));
      const snow = h[i] > 4300 ? Math.min(0.7, (h[i] - 4300) / 2500) : 0;
      for (let q = 0; q < 3; q++) { const val = c[q] * k; d[o + q] = val + (238 - val) * snow; }
      d[o + 3] = 255;
    }
    ctx.putImageData(im, 0, 0);
    return (MAP.farReliefCv = cv);
  };
})();
