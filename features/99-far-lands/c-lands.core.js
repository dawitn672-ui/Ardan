// The Great Continent (stage 2 of docs/plan/world-expansion-architecture.md): the Known World as the western end of
// a continent three times its width, from the far-lands data (b-data.core.js, made by gen/gen.mjs). Opt-in per game:
// the creation screen's "Lands" choice, or A.newGame({ lands: 'great' }). Games started by code, and every game
// before this feature, keep the world as written.
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
// State: a game of the Great Continent carries S.world = { v: 1, parts: ['ardan', 'far@1'] } and each far province a
// `region` (an F-xx style code of the ten Far Lands). A save without S.world is the world as written. A save that
// names lands this build does not have is refused with a plain message, never drawn on the wrong grid. Every save
// records its world in its header (meta.world).
(function () {
  const D = A.FL_DATA;
  if (!D) return;
  const FL = A.FL = { D, KEY: D.key, active: false, OFF: false };
  FL.LANDS = D.lands;
  const BASE_MAP = LORE.map;
  const nb = D.base;
  if (BASE_MAP.provinces.length !== nb) { console.error('far lands: the map as written has', BASE_MAP.provinces.length, 'provinces, the data was made for', nb); return; }
  // 76-beast-habitats reads the map as written once; let it do so now, before any far province is in LORE.map
  try { if (A.BH && A.BH.resolve) A.BH.resolve(); } catch (e) { console.error(e); }

  // ---- the far provinces, from columns, and the great map
  let farProvs = null, greatMap = null;
  FL.provinces = function () {
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
  MAP.want = () => FL.active ? D : null;

  // ---- the far realms' entries in the tables keyed by realm, culture and faith
  const AGGRO = { khaganate: 1.4, 'nomad confederation': 1.3, 'horse clans': 1.2, 'orc clans': 1.5, empire: 1.15, 'temple state': 0.4, 'city-state': 0.6, 'port city': 0.6, 'caravan league': 0.5, 'river league': 0.6, 'dwarven hold': 0.5, 'giant territory': 0.4, 'sea-hunter clans': 0.5, thalassocracy: 1.1 };
  // each land's armies are drilled like a realm of the Known World that fights on the same ground (layer 5.4)
  const DOCTRINE_LIKE = { T: 'POL-26', N: 'POL-23', F: 'POL-12', B: 'POL-17', H: 'POL-27', R: 'POL-01', M: 'POL-30', A: 'POL-32', I: 'POL-14', D: 'POL-22' };
  const RACE_LIKE = { orc: 'POL-34', dwarf: 'POL-28', giant: 'POL-23' };
  const reg = [];
  const put = (obj, k, v) => { if (!obj || v == null || Object.prototype.hasOwnProperty.call(obj, k)) return; obj[k] = v; reg.push([obj, k]); };
  FL.install = function () {
    if (FL.active) return;
    LORE.map = FL.map();
    const R = D.realms;
    for (const id in D.cultures) { put(LORE.cultures, id, D.cultures[id]); put(GD.NAMING, id, D.naming[id]); put(GD.LANG, id, D.lang[id]); }
    for (const f of D.faiths) put(LORE.faiths, f.id, f);
    for (const id in R) {
      const r = R[id], like = RACE_LIKE[r.race] || DOCTRINE_LIKE[r.land];
      put(LORE.realms, id, r);
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
    FL.rels = D.relations.slice();
    for (const x of FL.rels) LORE.relations.push(x);
    FL.active = true;
    MAP.init();
  };
  FL.uninstall = function () {
    if (!FL.active) return;
    for (let i = reg.length - 1; i >= 0; i--) delete reg[i][0][reg[i][1]];
    reg.length = 0;
    const drop = new Set(FL.rels || []);
    for (let i = LORE.relations.length - 1; i >= 0; i--) if (drop.has(LORE.relations[i])) LORE.relations.splice(i, 1);
    LORE.map = BASE_MAP;
    FL.active = false;
    MAP.init();
  };
  FL.set = on => { if (FL.OFF) on = false; if (on) FL.install(); else FL.uninstall(); };
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
    FL.set(!!(o && o.lands === 'great'));
    return ng.apply(this, arguments);
  };
  const init = A.initWorld;
  A.initWorld = function () {
    const r = init.apply(this, arguments);
    const S = A.S;
    if (FL.active && S) {
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
    if (S && S.world && Array.isArray(S.world.parts)) {
      const missing = S.world.parts.filter(k => k !== 'ardan' && k !== D.key);
      if (missing.length) throw new Error(`it was made with lands this version of the game does not have (${missing.join(', ')})`);
    }
    FL.set(FL.isGreat(S));
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

  // ---- the creation screen: the Known World alone, or the Great Continent
  FL.creationField = c => `<div class="field"><label>Lands</label><div class="opt-grid">${[
    ['known', 'The Known World', 'The world as the old maps show it: the Westland, the Southland and the Eastland.'],
    ['great', 'The Great Continent', `The Known World is the western end of a continent three times as wide: ${Object.keys(D.realms).length} more realms, as far as the Sunrise Isles.`],
  ].map(d => UI.opt((c.lands || 'known') === d[0], 'crSet', 'lands:' + d[0], d[1], d[2])).join('')}</div></div>`;
  const crSet = UI.A.crSet;
  UI.A.crSet = function (v) {
    if (typeof v === 'string' && v.startsWith('lands:')) {
      const great = v === 'lands:great';
      UI.cr.lands = great ? 'great' : 'known';
      FL.set(great); UI.worldReady = false; UI.ensureWorld(); UI.crFix(); UI.render();
      return;
    }
    return crSet.apply(this, arguments);
  };
  for (const k of ['newLife', 'randomLife']) {
    const f = UI.A[k];
    // a new life starts from the Known World; a far world left open would sit under its creation screen, so it goes
    if (typeof f === 'function') UI.A[k] = function () { if (FL.active) { FL.set(false); UI.worldReady = false; } if (FL.isGreat(A.S)) A.S = null; return f.apply(this, arguments); };
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
  let landPos = null;
  FL.landNames = function () {
    if (landPos) return landPos;
    const acc = {}, Q = FL.provinces();
    for (const q of Q) { const L = q.region && q.region[0]; if (!L) continue; const a = acc[L] || (acc[L] = { x: 0, y: 0, w: 0 }); a.x += q.x * q.cells; a.y += q.y * q.cells; a.w += q.cells; }
    landPos = Object.keys(acc).sort().map(L => ({ L, name: (D.lands[L] && D.lands[L].name || L).toUpperCase(), x: acc[L].x / acc[L].w, y: acc[L].y / acc[L].w }));
    return landPos;
  };
  const inkLines = MAP.inkLines;
  if (typeof inkLines === 'function') MAP.inkLines = function (ctx, W, H, v) {
    const r = inkLines.apply(this, arguments);
    try {
      if (r && FL.active && MAP.big) {
        const V = v || MAP.whole(W, H), zoom = MAP.ZREF / V.w;
        if (zoom < 1.3) {
          const fs = Math.round(Math.max(11, Math.min(22, W / 62 * (0.6 + zoom * 0.5))));
          ctx.save(); ctx.font = `italic 600 ${fs}px Cinzel, Georgia, serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          if ('letterSpacing' in ctx) ctx.letterSpacing = Math.round(fs * 0.35) + 'px';
          ctx.fillStyle = 'rgba(70,46,24,.42)'; ctx.strokeStyle = 'rgba(236,224,196,.55)'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
          const boxes = [];
          for (const p of FL.landNames()) {
            const w = ctx.measureText(p.name).width, h = fs * 1.3;
            let x = (p.x - V.x0) / V.w * W, y = (p.y - V.y0) / V.h * H;
            if (x < -w || y < -40 || x > W + w || y > H + 40) continue;
            x = Math.max(w / 2 + 6, Math.min(W - w / 2 - 6, x));
            for (let k = 0; k < 6 && boxes.some(b => Math.abs(b[0] - x) < (b[2] + w) / 2 && Math.abs(b[1] - y) < h); k++) y += h;   // a name under its neighbour, not across it
            boxes.push([x, y, w]); ctx.strokeText(p.name, x, y); ctx.fillText(p.name, x, y);
          }
          ctx.restore();
        }
      }
    } catch (e) { console.error(e); }
    return r;
  };

  // ---- the far lands' relief, for the map with the inked style off (the release's picture covers the Known World)
  const TERR_RGB = { hills: [146, 132, 96], mountains: [128, 112, 98], forest: [74, 106, 64], steppe: [176, 160, 104], plains: [132, 150, 84], desert: [196, 176, 128], tundra: [176, 180, 170], marsh: [92, 116, 96] };
  MAP.farRelief = function () {
    if (!FL.active || !MAP.grid || MAP.gridKey !== D.key || typeof document === 'undefined') return null;
    if (MAP.farReliefCv) return MAP.farReliefCv;
    const { gw, gh, grid } = MAP, cv = document.createElement('canvas'); cv.width = gw; cv.height = gh;
    const ctx = cv.getContext('2d'), im = ctx.createImageData(gw, gh), d = im.data, Q = FL.provinces(), bw = BASE_MAP.gw, bh = BASE_MAP.gh, ox = D.ox || 0, oy = D.oy || 0;
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
      const i = y * gw + x, o = i * 4, v = grid[i];
      if ((x >= ox && y >= oy && x < ox + bw && y < oy + bh) || v < 0) { d[o + 3] = 0; continue; }          // the Known World's picture, and the sea
      const p = v < nb ? BASE_MAP.provinces[v] : Q[v - nb], c = TERR_RGB[p.terr] || [140, 140, 120], shade = 0.92 + 0.16 * (((x * 7 + y * 13) % 17) / 17);
      d[o] = c[0] * shade; d[o + 1] = c[1] * shade; d[o + 2] = c[2] * shade; d[o + 3] = 255;
    }
    ctx.putImageData(im, 0, 0);
    return (MAP.farReliefCv = cv);
  };
})();
