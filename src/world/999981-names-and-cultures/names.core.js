// 999981-names-and-cultures (C7, D-058): one common English language, many cultures. Names for the people the game
// makes now come from data/names.json (the common pool, the far and non-human peoples' own pools, a lean per realm),
// through the v2 engine's namer (src/world/engine/names.js). The release's A.givenName, A.cultHouse and A.familyName
// ask here first (src/core/release/core/03-engine-base.js), then fall back to the old culture lists of LORE.
//
//   A.NAMES.given(cult, sex, { realm, parents, avoid })   a given name; `parents` (persons or ids) adds the names of the
//                                                         child's kin to `avoid`: no sibling or first cousin shares one
//   A.NAMES.house(cult, { realm })                        a family name
//   A.NAMES.originOf(race, prov)                          where a person made for a province comes from: the province's
//                                                         realm, or (in a border province, a port or a market town) a
//                                                         neighbour or a trade partner: { realm, cult, home }
//   A.NAMES.settle()                                      the new people of the month: no full name twice in a town, no
//                                                         given name twice among siblings and first cousins
//   A.NAMES.fiefPlace(rid, ...)                           see a-court (nobility): fief names come from the realm's own pool
// Everything draws through A.rand (A.pick), never Math.random, and writes nothing while a page is drawn.
(function () {
  const N = A.NAMES = A.NAMES || {};
  const V = A.V2 && A.V2.names, DATA = A.DATA && A.DATA.names;
  if (V && DATA) V.setNameData(DATA);
  N.ok = () => !!(V && DATA);
  N.rng = { next: () => A.rand(), pick: arr => A.pick(arr) };
  const P = id => (typeof id === 'string' ? A.P(id) : id);

  // ---- the names ---------------------------------------------------------------------------------------------------
  // given names of the people a child must not share one with: its parents, its brothers and sisters, its grandparents,
  // aunts and uncles, and first cousins (all of them, living or dead: the tree holds them)
  N.kinNames = function (parents) {
    const out = new Set(), add = p => { if (p && p.given) out.add(p.given); };
    for (const q0 of parents || []) {
      const q = P(q0); if (!q) continue;
      add(q);
      for (const c of q.children || []) add(A.P(c));
      for (const g0 of q.parents || []) {
        const g = A.P(g0); add(g);
        for (const u0 of (g && g.children) || []) { const u = A.P(u0); add(u); for (const c of (u && u.children) || []) add(A.P(c)); }
      }
    }
    return out;
  };
  N.given = function (cult, sex, o) {
    if (!N.ok()) return null;
    o = o || {};
    const avoid = o.avoid || (o.parents ? N.kinNames(o.parents) : null);
    return V.givenName(N.rng, cult, sex, { realm: o.realm, avoid });
  };
  N.house = function (cult, o) {
    if (!N.ok()) return null;
    return V.familyName(N.rng, cult, { realm: o && o.realm });
  };
  // the lists a culture (and a realm of it) draws from, for a pure pick by hash
  N.sees = (cult, realm) => V.sees(cult, realm);
  // names to offer (the character screen, naming a child): the realm's lean and its people's accent, then names spread evenly
  // across the rest of its view, all in alphabetical order; pure
  N.suggest = function (cult, sex, realm, n) {
    const v = V.sees(cult, realm), L = sex === 'F' ? v.female : v.male, k = sex === 'F' ? 'female' : 'male';
    const lean = (DATA.lean && DATA.lean[realm] && DATA.lean[realm][k]) || [], acc = ((DATA.cultures[v.id] || {}).accent || {})[k] || [];
    const out = [...new Set([...lean, ...acc])].filter(x => x), step = Math.max(1, Math.floor(L.length / Math.max(1, n - out.length)));
    for (let i = 0; i < L.length && out.length < n; i += step) if (!out.includes(L[i])) out.push(L[i]);
    return out.slice(0, Math.max(n, lean.length + acc.length)).sort();
  };
  N.place = function (cult, o) {
    if (!N.ok()) return null;
    return V.placeName(N.rng, cult, { realm: o && o.realm });
  };

  // ---- where people come from (CRITIQUE N1) --------------------------------------------------------------------------
  // A port or a market town draws 17 to 33 in a hundred of its newcomers from the realm's trade partners; a province on
  // a border 22 to 38 in a hundred from the neighbour across it; both at once, 22 to 33 from either. Each province has
  // its own share (a hash of its id), so two ports differ. The person keeps `org`, the realm of their origin, which
  // names them (the realm's lean) and gives them their people's customs.
  const cache = { S: null, m: {} };
  const memo = (k, f) => { if (cache.S !== A.S) { cache.S = A.S; cache.m = {}; } return k in cache.m ? cache.m[k] : (cache.m[k] = f()); };
  const alive = rid => { const r = A.S && A.S.realms && A.S.realms[rid]; return r && r.alive !== false ? r : null; };
  N.isTrade = q => !!q && (q.type === 'market town' || (!!q.coast && ['capital city', 'city', 'town'].includes(q.type)));
  // realms across the border of a realm: { rid: provinces touching }
  N.neighbours = function (q) {
    const out = {}, S = A.S;
    for (const n of q.adj || []) {
      const o = S.prov[n] && S.prov[n].owner;
      if (o && o !== q.owner && alive(o)) out[o] = (out[o] || 0) + 1;
    }
    return out;
  };
  // a realm's trade partners: the realms its own lore names among its imports and exports, its allies, and its neighbours
  N.partners = function (rid) {
    return memo('p|' + rid, () => {
      const S = A.S, r = alive(rid), set = new Set();
      if (!r) return [];
      const text = ((r.imports || '') + ';' + (r.exports || '')).toLowerCase();
      for (const id of Object.keys(S.realms)) {
        const o = alive(id);
        if (!o || id === rid) continue;
        if (o.short && o.short.length > 3 && text.includes(o.short.toLowerCase())) set.add(id);
      }
      for (const a of r.allies || []) if (alive(a) && a !== rid) set.add(a);
      for (const q of S.prov) if (q.owner === rid) for (const o of Object.keys(N.neighbours(q))) set.add(o);
      return [...set].sort();
    });
  };
  N.share = function (q) {
    const u = V.hash32(`${q.id}|origin`) / 4294967296, border = Object.keys(N.neighbours(q)).length > 0, trade = N.isTrade(q);
    return border && trade ? 0.22 + 0.11 * u : border ? 0.22 + 0.16 * u : trade ? 0.17 + 0.16 * u : 0;
  };
  // { realm, cult, home }: one draw tells native from foreign (always drawn, so a province with no share costs the same)
  N.originOf = function (race, provId) {
    const S = A.S, q = S.prov && S.prov[provId], rid = q && q.owner;
    const home = rid && alive(rid) ? rid : null;
    const roll = A.rand();
    if (!q || !home) return { realm: home, cult: A.cultureFor(race, home || 'unclaimed'), home: true };
    const f = N.share(q);
    if (roll >= f) return { realm: home, cult: A.cultureFor(race, home), home: true };
    // across a border they come from the neighbours (each by the provinces it touches with); in a port or a market town inland
    // they come from the realm's trade partners (a neighbour is a partner, so a port on a border still counts both ways)
    const nb = N.neighbours(q), pool = [];
    for (const o of Object.keys(nb)) for (let i = 0; i < nb[o]; i++) pool.push(o);
    if (!pool.length) for (const o of N.partners(home)) if (alive(o)) pool.push(o);
    if (!pool.length) return { realm: home, cult: A.cultureFor(race, home), home: true };
    const r2 = A.pick(pool);
    return { realm: r2, cult: A.cultureFor(race, r2), home: false };
  };

  // ---- no twins (CRITIQUE N4) -----------------------------------------------------------------------------------------
  // New people are named a moment before their surname is known, and from many places, so the check is made once a month
  // for the people made since the last: no full name twice among the living of a town (a province), no given name twice
  // among brothers, sisters and first cousins (the dead of the tree count). The later one is renamed, unless they are the
  // player, a figure of the lore, or a ruler or heir (whose names the realm's history already holds).
  const plain = p => A.fullName(p, false);
  const plausibleHome = p => { const q = A.S.prov && A.S.prov[p.home]; return !!q && (p.home !== 0 || q.owner === p.realm || q.orig === p.realm); };
  N.townKey = p => (p && p.alive && p.home != null && plausibleHome(p) ? p.home : null);
  const fixed = (p, S) => p.castId || p.famRole || p.id === S.pc || Object.values(S.realms).some(r => r.ruler === p.id || r.heir === p.id);
  // the people whose given name x must not share: brothers and sisters, first cousins (not x itself)
  N.closeKin = function (x) {
    const out = new Set(), add = id => { if (id && id !== x.id) out.add(id); };
    for (const q0 of x.parents || []) {
      const q = A.P(q0); if (!q) continue;
      for (const c of q.children || []) add(c);
      for (const g0 of q.parents || []) { const g = A.P(g0); if (!g) continue; for (const u of g.children || []) { const uu = A.P(u); if (uu) for (const c of uu.children || []) add(c); } }
    }
    return out;
  };
  N.rename = function (p, avoid) {
    const old = p.given;
    let n = old;
    for (let t = 0; t < 12; t++) { n = N.given(p.cult, p.sex, { realm: p.org || p.realm, avoid }) || old; if (!avoid.has(n)) break; }
    if (n === old) return false;
    p.given = n;
    // a child's patronymic ("son of Alan") follows its father's name
    for (const c0 of p.children || []) { const c = A.P(c0); if (c && c.surMode === 'patron' && c.sur && c.sur.endsWith(' ' + old)) c.sur = c.sur.slice(0, -old.length) + n; }
    return true;
  };
  N.settle = function (all) {
    const S = A.S; if (!S || !S.people || !N.ok()) return 0;
    if (!S.nmv) {
      S.nmv = 1;
      // a game from before C7 keeps every name it has: only the people made from now on are held to the rules
      if (!all) { for (const p of Object.values(S.people)) p.nmOk = 1; return 0; }
    }
    const people = Object.values(S.people), fresh = people.filter(p => !p.nmOk);
    if (!fresh.length) return 0;
    const town = {};
    for (const p of people) { const k = N.townKey(p); if (k != null) (town[k] = town[k] || new Map()).set(p.id, plain(p)); }
    let n = 0;
    for (const x of fresh) {
      x.nmOk = 1;
      if (fixed(x, S)) continue;
      const kin = N.closeKin(x), kinNames = new Set([...kin].map(id => (A.P(id) || {}).given).filter(Boolean));
      const key = N.townKey(x), others = key != null ? [...town[key]].filter(([id]) => id !== x.id).map(([, s]) => s) : [];
      const twin = () => others.includes(plain(x)), clash = () => kinNames.has(x.given);
      if (!clash() && !twin()) continue;
      // the name being replaced is avoided too: for a twin in a town (not a kin clash) it was not in kinNames, so a draw
      // that gave the same name back ended the renaming at once and left the twin (CI 140, nmTwins: "Sofia of Camia
      // twice in Camia", a world the R2 and D9 merge had shifted)
      const avoid = new Set(kinNames).add(x.given);
      for (let t = 0; t < 8 && (clash() || twin()); t++) {
        if (!N.rename(x, avoid)) break;
        avoid.add(x.given);
      }
      if (key != null) town[key].set(x.id, plain(x));
      n++;
    }
    return n;
  };

  // ---- saves from before C7 (D-058) -----------------------------------------------------------------------------------
  // The eight realms the page used to rename as it drew (the Nov 5 names, then the hack's) are renamed by id when a save
  // that holds an older name is loaded: the realm's own name and short name only. The prose a life has kept (its log, its
  // news) keeps the words it was written in, and so do the people (their names stay as they are). The old names are
  // written in two pieces so that nothing in the page spells them out (tests/v2: the built page holds none).
  const J = (...p) => p.join('');
  N.OLD = {
    'POL-32': { name: [J('Sultanate of the ', 'Amber', ' Isles')], short: [J('Amber', ' Isles')] },
    'POL-21': { name: [J('League of the ', 'Spice', ' Coast')], short: [] },
    'POL-33': { name: [J('Brotherhood of ', 'Black', 'reef'), 'Principality of Corvasse'], short: [J('Black', 'reef')] },
    'POL-19': { name: [J('Confederacy of the ', 'Sand', ' Clans')], short: [J('Sand', ' Clans')] },
    'POL-12': { name: [J('Khanate of the ', 'Nine', ' Winds'), 'Kingdom of Ulun'], short: [J('Nine', ' Winds')] },
    'POL-34': { name: [J('League of the ', 'Tusk', ' Clans'), 'Ughrak Dominion', J('Ughrak', ' Clans')], short: [J('Tusk', ' Clans')] },
    'POL-13': { name: [J('High', 'land League'), 'Kingdom of Brannoch'], short: [J('High', 'land')] },
    'POL-11': { name: [J('Horde', ' of Gorath')], short: [J('the ', 'Horde')] },
  };
  N.renameState = function (S) {
    let n = 0;
    if (!S || !S.realms || typeof S.realms !== 'object' || typeof LORE === 'undefined' || !LORE.realms) return n;
    for (const id of Object.keys(N.OLD)) {
      const r = S.realms[id], L = LORE.realms[id];
      if (!r || typeof r !== 'object' || !L) continue;
      if (N.OLD[id].name.includes(r.name)) { r.name = L.name; n++; }
      if (N.OLD[id].short.includes(r.short)) { r.short = L.short; n++; }
    }
    return n;
  };
  const SV = A.V2SAVE;
  if (SV && Array.isArray(SV.STEPS)) SV.STEPS.push(['names', S => { N.renameState(S); }]);
  const des = A.deserialize;
  if (typeof des === 'function') A.deserialize = function () {
    const r = des.apply(this, arguments);
    try { if (A.S) N.renameState(A.S); } catch (e) { console.error('names renameState', e); }
    return r;
  };

  // new games: the people of the first day are checked once the whole tree is made; every month after, the new ones
  A.addStage('A.newGame', 'names-and-cultures', next => function () {
    const r = next.apply(this, arguments);
    try { if (A.S) N.settle(true); } catch (e) { console.error('names settle', e); }
    return r;
  });
  A.onMonth.push(() => { try { N.settle(); } catch (e) { console.error('names settle', e); } });
})();
