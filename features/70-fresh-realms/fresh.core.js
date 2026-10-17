// Fresh realms and starting tensions (Road to Ten, Replayability 3: "vary the world each run: different starting
// tensions, history branching differently, and smaller realms generated fresh").
//
// The map's provinces are fixed shapes (A.initWorld builds them from LORE.map), but a realm is a set of provinces with
// a ruler, a house, laws, a culture and a faith. So a game started from the menu (o.world 'varied', the guard
// 43-varied-worlds uses) now also:
//   fresh realms   splits 1 to 3 of the larger realms (8 provinces or more, at peace): 2 to 4 contiguous provinces away
//                  from the capital break away as a smaller realm of one of four kinds,
//                    a duchy that broke free, a march on the border, a league of free towns, a rebel prince's holding,
//                  6 to 40 years ago (2 to 12 for a prince). It gets a name in its people's style (their naming rule,
//                  GD.NAMING, and their own word for a council from 54-voices), a ruling house from the nobles seated
//                  in its provinces (or a new one, or for a prince his own royal house), its parent's laws, faith and
//                  culture, a realm bible (want, fear, place; customs inherited from the parent's bible, 47), a share
//                  of the parent's army, levy, ships, treasury and income in proportion to the people it took, and a
//                  quarrel: the parent claims its provinces, keeps a line in its feud ledger (55-bonds), remembers the
//                  land taken, and is either under a truce that runs out in 1 to 4 years or still at war;
//   tensions       seeds 1 to 3 of five situations, each a state the engine runs:
//                    succession  a claimant faction already formed against a ruler of weak legitimacy;
//                    famine      the last harvest failed in one realm: its granary is at a fifth of normal;
//                    holywar     a zealous realm has a holy cause against a neighbour of another faith;
//                    regency     a ruler died last winter and a child rules under a regent until of age;
//                    debt        one realm owes another a sum it pays by the year, or the creditor gains a cause.
// What was made goes into the world's history and is told at birth. Games started by code (tests, the bot league)
// keep the world as written, so the measurements stay comparable; o.fresh === false keeps a varied world unsplit.
//
// Engine side: wrappers of A.newGame, A.initWorld and A.migrate; a month hook; the realm's tables (GD.REALM_CULTURE,
// GD.REALM_FAITH, A.AGGRO) are registered from the saved state on every new game and load. Rendering only reads.
(function () {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const FR = A.FRESH = {
    pending: false,
    COUNT: [1, 3],          // realms split
    MIN_PROVS: 8,           // a realm must hold this many provinces to lose some
    SIZE: [2, 4],           // provinces in a breakaway
    SHARE_MAX: 0.3,         // and never more than this share of the parent's provinces
    POP_MAX: 0.35,          // or of its people (the Sand Clans' oases hold four fifths of theirs)
    AGO: [6, 40],           // years since it broke away
    WAR_P: 0.25,            // the war of independence never ended
    TENSIONS: [1, 3],
    KINDS: ['succession', 'famine', 'holywar', 'regency', 'debt'],
    ZEALOUS: ['REL-01', 'REL-02', 'REL-07', 'REL-17'],
    _reg: [],
  };
  const name = id => (A.realmShort ? A.realmShort(id) : id);
  const cap1 = s => (s ? s[0].toUpperCase() + s.slice(1) : s);
  const noThe = s => String(s || '').replace(/^the /i, '');
  const clean = s => String(s == null ? '' : s).replace(/[<>"]/g, '');
  const live = () => Object.values(A.S.realms).filter(r => r && r.alive && !r.isRebel && r.capitalProv != null);
  const atWarWith = (a, b) => (A.S.wars || []).some(w => (w.att.includes(a) && w.def.includes(b)) || (w.att.includes(b) && w.def.includes(a)));

  // ---------------------------------------------------------------- the guard: a menu game asks for a varied world
  const ng = A.newGame;
  A.newGame = function (o) {
    FR.unregister();
    FR.pending = !!(o && o.world === 'varied' && o.fresh !== false);
    try { return ng.apply(this, arguments); } finally { FR.pending = false; }
  };
  const init = A.initWorld;
  A.initWorld = function () {
    const r = init.apply(this, arguments);
    if (FR.pending) { try { FR.make(); } catch (e) { console.error('fresh realms', e); } }
    return r;
  };
  // a loaded game registers its fresh realms in the realm tables (they are data, not state)
  const mig = A.migrate;
  if (typeof mig === 'function') A.migrate = function (S) {
    const r = mig.apply(this, arguments);
    try { FR.unregister(); FR.register(r || S); } catch (e) { console.error('fresh realms load', e); }
    return r;
  };

  // a noble or royal life starting in the parent is not given a house that went with the breakaway
  for (const k of ['housesFor', 'familiesFor']) {
    const f = A[k];
    if (typeof f === 'function') A[k] = function (realm) {
      const out = f.apply(this, arguments);
      if (!FR.pending || !A.S || !A.S.houses || !Array.isArray(out)) return out;
      return out.filter(h => { const s = h && A.S.houses[h.id]; return !(s && s.fr && s.realm !== realm); });
    };
  }

  // ---------------------------------------------------------------- the realm tables
  // GD.REALM_CULTURE and friends are keyed by realm id and read by A.cultureFor, A.faithFor, 54-voices, 47's bible and
  // the AI's temper (A.AGGRO). A fresh realm takes its parent's entries; they are dropped again on the next new game.
  FR.register = function (S) {
    if (!S || !S.realms) return;
    for (const r of Object.values(S.realms)) {
      if (!r || !r.fresh || !r.fresh.from) continue;
      const from = r.fresh.from;
      const set = (obj, v) => { if (obj && v != null && obj[r.id] == null) { obj[r.id] = v; FR._reg.push([obj, r.id]); } };
      set(GD.REALM_CULTURE, r.fresh.cult || GD.REALM_CULTURE[from]);
      set(GD.REALM_FAITH, GD.REALM_FAITH[from] || r.faith);
      if (GD.REALM_HUMAN_CULTURE) set(GD.REALM_HUMAN_CULTURE, GD.REALM_HUMAN_CULTURE[from]);
      if (A.AGGRO) set(A.AGGRO, A.AGGRO[from]);
      if (GD.DOCTRINE) set(GD.DOCTRINE, GD.DOCTRINE[from]);
    }
  };
  FR.unregister = function () {
    for (const [obj, k] of FR._reg) delete obj[k];
    FR._reg = [];
  };

  // ---------------------------------------------------------------- geometry
  const P_ = id => A.S.prov[id];
  const dist = (a, b) => Math.hypot((a.x || 0) - (b.x || 0), (a.y || 0) - (b.y || 0));
  // the number of connected pieces of a realm's land, leaving out some provinces
  FR.pieces = function (rid, without) {
    const out = without || new Set(), mine = A.S.prov.filter(P => P.owner === rid && !out.has(P.id));
    const seen = new Set(); let n = 0;
    for (const P of mine) {
      if (seen.has(P.id)) continue;
      n++; const st = [P.id]; seen.add(P.id);
      while (st.length) { const q = P_(st.pop()); for (const j of q.adj) { const Q = P_(j); if (Q && Q.owner === rid && !out.has(j) && !seen.has(j)) { seen.add(j); st.push(j); } } }
    }
    return n;
  };
  FR.contiguous = ids => { const set = new Set(ids); if (!set.size) return false; const seen = new Set([ids[0]]), st = [ids[0]]; while (st.length) for (const j of P_(st.pop()).adj) if (set.has(j) && !seen.has(j)) { seen.add(j); st.push(j); } return seen.size === set.size; };
  // a block of provinces on the far side of the realm from its capital, that leaves the rest of the realm whole
  FR.block = function (r) {
    const S = A.S, provs = A.realmProvs(r.id), capP = P_(r.capitalProv);
    if (!capP) return null;
    const ok = P => P.owner === r.id && P.id !== r.capitalProv && P.type !== 'capital city' && !P.occ && !P.siege;
    const pool = provs.filter(ok);
    const want = A.ri(FR.SIZE[0], Math.max(FR.SIZE[0], Math.min(FR.SIZE[1], Math.floor(provs.length * FR.SHARE_MAX))));
    const pop = provs.reduce((a, P) => a + (P.pop || 0), 0), before = FR.pieces(r.id), far = Math.max(1, ...pool.map(P => dist(P, capP)));
    for (let tries = 0; tries < 14; tries++) {
      const seed = A.wpick(pool, P => Math.pow(dist(P, capP) / far, 2) + 0.02);
      if (!seed) return null;
      const set = [seed.id], has = new Set(set);
      while (set.length < want) {
        const nb = [...new Set(set.flatMap(id => P_(id).adj))].map(P_).filter(Q => Q && ok(Q) && !has.has(Q.id));
        if (!nb.length) break;
        const Q = A.wpick(nb, X => 0.3 + dist(X, capP) / far);
        set.push(Q.id); has.add(Q.id);
      }
      if (set.length < FR.SIZE[0]) continue;
      if (FR.pieces(r.id, has) > before) continue;   // the rest of the realm must stay in one piece
      if (set.reduce((a, id) => a + (P_(id).pop || 0), 0) > FR.POP_MAX * pop) continue;   // a smaller realm, not the heart of the old one
      return set;
    }
    return null;
  };

  // ---------------------------------------------------------------- names, in the people's own style
  const voiceWord = (cult, k) => { try { return A.VOICE && A.VOICE.word ? A.VOICE.word(cult, k) : null; } catch (e) { return null; } };
  FR.kindsFor = function (r, ids) {
    const towns = ids.filter(id => (P_(id).town || 0) >= 4000).length;
    const border = ids.some(id => P_(id).adj.some(j => { const o = P_(j) && P_(j).owner; return o && o !== r.id; }));
    const roy = r.house && A.P(r.ruler) && /hereditary/.test(r.gov || '') && ['human', 'elf'].includes(r.race);
    const k = [['duchy', 3]];
    if (border && r.race === 'human') k.push(['march', 2]);
    if (towns >= 2 && r.race === 'human' && !/theocracy/.test(r.gov || '')) k.push(['league', 2]);
    if (roy) k.push(['prince', 1.5]);
    return k;
  };
  // what a breakaway of this kind is called among these people
  FR.style = function (kind, r, cult, capName, sur, ru) {
    const given = ru ? ru.given : '';
    const mode = (GD.NAMING[cult] || {}).noble || 'house', T = String(r.title || '');
    const sh = noThe(r.short);
    if (kind === 'prince') return { name: `${ru && ru.sex === 'F' ? 'Princess' : 'Prince'} ${given}'s ${sh}`, short: given, title: 'Prince', type: 'principality' };
    if (kind === 'league') {
      const w = voiceWord(cult, 'council');
      return w ? { name: `The ${cap1(w)} of ${capName}`, short: `the ${capName} ${cap1(w)}`, title: 'Speaker', type: 'city league', gov: 'council' }
        : { name: `League of ${capName}`, short: `the ${capName} League`, title: 'Speaker', type: 'city league', gov: 'council' };
    }
    if (r.race === 'elf') return { name: `Princedom of ${capName}`, short: capName, title: 'Prince', type: 'elven realm' };
    if (r.race === 'dwarf') return { name: `Hold of ${capName}`, short: capName, title: 'Thane', type: 'dwarven hold' };
    if (r.race === 'orc') return { name: `the ${capName} Clans`, short: `the ${capName} Clans`, title: 'War-Chief', type: 'orc clans', gov: 'elective' };
    if (/theocracy/.test(r.gov || '') || /Abbot|Luminary/.test(T)) return { name: `Priory of ${capName}`, short: capName, title: 'Abbot', type: 'theocracy', gov: 'theocracy' };
    if (mode === 'clan' && sur) return { name: `Clan ${sur} of ${capName}`, short: `Clan ${sur}`, title: 'Chieftain', type: 'clan holding' };
    if (mode === 'tribe') return { name: `Khanate of ${capName}`, short: capName, title: 'Khan', type: 'nomad confederation' };
    if (/Sultan|Emir/.test(T)) return { name: `Emirate of ${capName}`, short: capName, title: 'Emir', type: 'emirate' };
    if (kind === 'march') return { name: `March of ${capName}`, short: `the ${capName} March`, title: 'Margrave', type: 'march' };
    return { name: `Duchy of ${capName}`, short: capName, title: 'Duke', type: 'duchy' };
  };
  // a realm bible for it: what it wants and fears, and the place that matters; customs are its parent's (47)
  FR.BIBLE = {
    duchy: {
      want: ['To have its freedom from {parent} written down and sealed by a crown that is not {parent}\'s.', 'To hold {capital} for its own lords, and to owe {parent} nothing but a border.'],
      fear: ['That {parent} comes back for {capital}, as its heralds still swear it will.', 'That its lords, who rose together, fall out over who sits highest.'],
      place: ['The hall at {capital}|Where the lords of {short} swore in {year} to hold their land for themselves, and the oath is cut over the door.'],
    },
    march: {
      want: ['To hold the border for itself, and be paid for it by no one.', 'To be the gate {parent} must knock at, and to set the toll.'],
      fear: ['That {parent} and its neighbour make peace across its back and share it out.', 'That a hard winter on the border empties the forts before {parent} comes.'],
      place: ['The gate-tower at {capital}|Where the {title} keeps the keys of the border forts on one ring, and counts them every night.'],
    },
    league: {
      want: ['To keep the roads, the tolls and the courts in the towns\' own hands.', 'To buy its peace with {parent} and never pay twice.'],
      fear: ['That a crown buys one town and the league comes apart in a season.', 'That {parent} closes the road and lets the markets starve.'],
      place: ['The toll-house at {capital}|Where the towns\' seals are kept in one chest with a lock for every town, and opened only all together.'],
    },
    prince: {
      want: ['To sit on the throne of {parent}, not beside it.', 'To be named heir of {parent} by the lords before {rival} dies.'],
      fear: ['That {rival} outlives the claim, and the lords forget there was one.', 'That {parent}\'s lords make their peace, and the prince is left with a castle and a grievance.'],
      place: ['The keep at {capital}|Where {prince} keeps court with the old king\'s sword on the wall, and a chair at the high table is left empty.'],
    },
  };
  const fillT = (s, m) => String(s).replace(/\{(\w+)\}/g, (x, k) => (m[k] != null ? String(m[k]) : x));

  // the ruling house: the strongest great house seated in its provinces, or a new one of its people's naming
  FR.house = function (r, nid, ids, kind) {
    const S = A.S, seats = new Set(ids.map(id => P_(id).name));
    const moved = Object.values(S.houses).filter(h => h && h.realm === r.id && !h.extinct && h.kind !== 'royal' && h.great !== false && seats.has(h.seat));
    for (const h of moved) { h.realm = nid; h.fr = r.id; }
    if (kind === 'prince') return { hid: r.house, moved };
    const strong = moved.slice().sort((a, b) => A.houseStrength(b) - A.houseStrength(a) || (a.id < b.id ? -1 : 1))[0];
    if (strong) return { hid: strong.id, moved, old: true };
    const cult = A.cultureFor(r.race === 'human' ? 'human' : r.race, r.id);
    const fn = A.familyName({ cult, realm: r.id, status: 'noble', sex: 'M' }) || {};
    const sur = clean(fn.sur || P_(ids[0]).name);
    const hid = 'FAM-R' + (S.nextFreshHouse = (S.nextFreshHouse || 0) + 1);
    S.houses[hid] = { id: hid, name: /^(of |son of|daughter of)/.test(sur) ? `the House ${sur}` : `House ${sur}`, realm: nid, kind: 'noble', seat: P_(ids[0]).name, rung: 'S02', title: 'Lord',
      notes: `Raised from the lords of ${P_(ids[0]).name}.`, op: 70, founded: S.year, fr: r.id };
    return { hid, moved, sur };
  };

  // ---------------------------------------------------------------- the split
  FR.split = function (r) {
    const S = A.S, ids = FR.block(r);
    if (!ids) return null;
    const kinds = FR.kindsFor(r, ids), kind = A.wpick(kinds, k => k[1])[0];
    const capP = ids.map(P_).slice().sort((a, b) => (b.town || 0) - (a.town || 0) || b.pop - a.pop)[0];
    const ago = kind === 'prince' ? A.ri(2, 12) : A.ri(FR.AGO[0], FR.AGO[1]);
    const parentPop = Math.max(1, A.realmProvs(r.id).reduce((a, P) => a + (P.pop || 0), 0));
    const share = clamp(ids.reduce((a, id) => a + (P_(id).pop || 0), 0) / parentPop, 0.03, 0.45);
    const cult = A.cultureFor(r.race === 'human' ? 'human' : r.race, r.id);
    const nid = 'NEW-' + ((S.nextRealm || 0) + 1);
    const H = FR.house(r, nid, ids, kind);
    // the ruler: a prince of the blood, or the head of the house
    let ru = null;
    if (kind === 'prince') {
      const old = A.P(r.ruler);
      const sib = old ? A.relsOf(old, ['sibling']).map(x => x.p).filter(p => p && p.alive && A.isAdult(p) && !p.ruler && p.id !== r.heir && p.race === old.race) : [];
      ru = sib.length ? A.pick(sib) : null;
      if (!ru) {
        ru = A.genNoble(r.id, 'royal', r.house, A.ri(24, 44), A.chance(0.7) ? 'M' : 'F');
        if (old) { if (old.sur) { ru.sur = old.sur; ru.surMode = 'house'; } A.link(old, ru, 'sibling', A.ri(-40, -10), 'sibling'); }
      }
      if (old && old.rel && old.rel[ru.id]) old.rel[ru.id].op = Math.min(old.rel[ru.id].op || 0, -30);
    } else {
      const h = S.houses[H.hid];
      ru = H.old ? A.houseHead(H.hid) : null;
      if (!ru || !ru.alive || ru.ruler) { ru = A.genNoble(r.id, 'noble', H.hid, A.ri(28, 56)); if (h) { ru.sur = A.houseSurname ? A.houseSurname(h) : ru.sur; ru.surMode = 'house'; } }
      if (h) { h.headPid = ru.id; h.kind = 'royal'; }
    }
    const st = FR.style(kind, r, cult, capP.name, H.sur || (S.houses[H.hid] && String(S.houses[H.hid].name).replace(/^(the )?House /, '')), ru);
    // a name already in use gets its kind's longer form
    const taken = new Set(Object.values(S.realms).flatMap(x => [x.short, x.name].map(s => noThe(s).toLowerCase())));
    if (taken.has(noThe(st.short).toLowerCase())) st.short = st.name;
    if (taken.has(noThe(st.name).toLowerCase())) { st.name = `${st.name} (${noThe(r.short)})`; st.short = st.name; }
    const used = new Set(live().map(x => x.color)), cols = (A.COLORS_EXTRA || []).filter(c => !used.has(c));
    const nr = A.createRealm({ id: nid, name: st.name, short: st.short, title: st.title, type: st.type, gov: st.gov || (/hereditary/.test(r.gov || '') ? 'hereditary' : r.gov === 'elective' ? 'elective' : 'hereditary'),
      law: r.law, race: r.race, cult: r.cult, faith: r.faith, color: cols.length ? A.pick(cols) : undefined,
      army: Math.max(300, Math.round((r.army || 0) * share * 0.9)), levy: Math.max(800, Math.round((r.levy || 0) * share)), armyQ: r.armyQ,
      income: Math.max(1000, Math.round((r.baseIncome || r.income || 0) * share)), stability: clamp(Math.round((r.stability || 50) + A.ri(-10, 10)), 25, 80),
      legit: kind === 'prince' ? A.ri(35, 55) : A.ri(40, 65), treasury: Math.round((r.treasury || 0) * share), comp: r.comp, house: H.hid,
      capital: capP.name, capitalProv: capP.id });
    if (S.nextRealm == null || S.nextRealm < +nid.slice(4)) S.nextRealm = +nid.slice(4);
    nr.fresh = { kind, from: r.id, ago, y0: S.year, cult, provs: ids.slice(), war: false };
    FR.register({ realms: { [nid]: nr } });   // its culture and faith count from here on (its royal family is born next)
    r.army = Math.max(500, Math.round((r.army || 0) - nr.army)); r.levy = Math.max(1000, Math.round((r.levy || 0) - nr.levy));
    r.treasury = Math.round((r.treasury || 0) - nr.treasury);
    nr.ships = Math.round((r.ships || 0) * share * (ids.some(id => P_(id).coast) ? 1 : 0)); r.ships = Math.max(0, (r.ships || 0) - nr.ships);
    nr.army0 = nr.army; nr.levy0 = Math.max(nr.levy, nr.army * 3);
    nr.created = S.year - ago; nr.isNew = false; nr.parent = r.id; nr.coin = Object.assign({}, r.coin || { coin: 'sun', worth: 1 });
    nr.laws = Object.assign({}, r.laws || { tax: 1 }); if (st.gov && st.gov !== r.gov) delete nr.laws.authority;   // polInit sets it from the new government
    // the land, the people of it and their lords
    for (const id of ids) { const P = P_(id); P.owner = nid; P.occ = null; P.siege = 0; if (P.orig == null) P.orig = r.id; }
    const seats = new Set(ids);
    for (const p of Object.values(S.people)) if (p && p.alive && p.realm === r.id && seats.has(p.home) && !p.ruler && p.house !== r.house) p.realm = nid;
    for (const h of H.moved) { const hd = h.headPid && A.P(h.headPid); if (hd && hd.alive && hd.realm === r.id && !hd.ruler) hd.realm = nid; }
    A.makeRuler(ru, nid, true);
    if (kind !== 'prince') ru.house = H.hid;
    if (A.buildRoyalFamily) A.buildRoyalFamily(nr);
    // the bible
    const B = FR.BIBLE[kind] || FR.BIBLE.duchy, rival = A.P(r.ruler);
    const m = { parent: noThe(r.short), capital: capP.name, short: noThe(nr.short), title: nr.title, year: S.year - ago, given: ru.given, prince: A.rulerStyle(ru, nr), rival: rival ? A.rulerStyle(rival, r) : 'the crown' };
    const pl = A.pick(B.place).split('|');
    Object.assign(nr.fresh, { want: clean(fillT(A.pick(B.want), m)), fear: clean(fillT(A.pick(B.fear), m)), place: { name: clean(fillT(pl[0], m)), text: clean(fillT(pl[1], m)) } });
    const how = { duchy: `broke from ${r.short} in ${S.year - ago}`, march: `a march of ${r.short} that would not be held, free since ${S.year - ago}`,
      league: `towns of ${r.short} that bought and fought their freedom in ${S.year - ago}`, prince: `held since ${S.year - ago} by ${A.rulerStyle(ru, nr)}, who says the crown of ${r.short} is ${A.his ? A.his(ru) : 'his'} by right` }[kind];
    nr.primer = { intro: clean(`${nr.name}: ${ids.map(id => P_(id).name).join(', ')}, ${how}. Its ${nr.title === 'Speaker' ? 'towns' : 'lords'} keep ${r.short}'s laws and faith, and ${r.short} still claims the land.`) };
    // the quarrel: claims, the feud ledger, memory, standing
    A.polInit(r); A.polInit(nr); if (A.dInit) { A.dInit(r); A.dInit(nr); }
    for (const id of ids) r.claims[id] = S.year;
    // others see it much as they see its parent, but the parent's friends are cool to it and its foes warm
    for (const k in S.realms) if (k !== nid && k !== r.id) { const v = r.rel[k] || 0, w = r.allies.includes(k) ? Math.min(-5, -Math.round(v * 0.2)) : v < 0 ? Math.round(-v * 0.3) : Math.round(v * 0.5); nr.rel[k] = w; S.realms[k].rel[nid] = w; }
    A.setRelPair(r.id, nid, -A.ri(40, 70));
    if (!r.rivals.includes(nid)) r.rivals.push(nid);
    if (!nr.rivals.includes(r.id)) nr.rivals.push(r.id);
    if (A.remember) A.remember(r.id, nid, 'took_land', -A.ri(15, 25));
    const FE = A.BONDS && A.BONDS.FEUD;
    if (FE && FE.add) { const e = FE.add(r.id, nid, 'heart', { place: capP.name }); if (e) { e.y = S.year - ago; e.by = ''; } }
    // the enemy of its enemy: a rival of the parent that borders it may be its friend
    const nbs = A.neighbors(nid), friend = (r.rivals || []).filter(x => x !== nid && nbs.includes(x) && A.realm(x) && A.realm(x).alive && !A.realm(x).isRebel);
    if (friend.length) { const f = A.pick(friend); A.setRelPair(nid, f, A.ri(25, 55)); if (A.chance(0.4)) { A.ally(nid, f); nr.fresh.ally = f; } }
    // the army: the parent's divisions in the lost provinces fall back, the parent sheds the men, the new realm musters
    if (r.forces && A.forcesReconcile) {
      const spots = A.garrisonSpots(r);
      r.forces.divs.forEach((d, i) => { if (seats.has(d.loc)) { d.loc = spots.length ? spots[i % spots.length] : r.capitalProv; d.path = []; d.prog = 0; d.atk = null; } });
      A.forcesReconcile(r);
    }
    if (A.F) A.F(nr);
    // its market: what its land makes, and what its parent is known for
    if (A.mktInit && r.mkt) {
      const mk = A.mktInit(nr);
      for (const k of r.mkt.ex || []) if (!mk.ex.includes(k) && mk.t[k] != null) { mk.ex.push(k); mk.t[k] *= 0.7; mk.p[k] *= 0.7; }
      for (const k of r.mkt.im || []) if (!mk.im.includes(k) && mk.t[k] != null) { mk.im.push(k); mk.t[k] *= 1.35; mk.p[k] *= 1.35; }
    }
    if (A.updateRealmPops) A.updateRealmPops();
    if (A.locDirty) A.locDirty();
    // still at war, or a truce that runs out soon
    if (A.chance(FR.WAR_P) && A.startWar && !atWarWith(r.id, nid)) {
      const w = A.startWar(r.id, nid, `The War for ${capP.name}`, 'reconquest', { silent: true, noAllies: true, start: S.year - Math.min(ago, A.ri(1, 4)) });
      nr.fresh.war = !!w;
    } else { const t = S.year + A.ri(1, 4); r.truce[nid] = t; nr.truce[r.id] = t; nr.fresh.truce = t; }
    // history and the world record
    S.history.push({ y: S.year - ago, t: clean(`${nr.name} broke away from ${r.short}.`) });
    const WC = A.WC;
    if (WC && WC.put) try {
      const R = WC.rec(); if (R && R.nw) R.nw = R.nw.filter(x => x[0] !== nid);
      WC.put('founded', { y: S.year - ago, d: 0, p: capP.id, a: nid, b: r.id, w: [ru.id], x: 'won' });
      if (R && R.ru) R.ru[nid] = ru.id;
    } catch (e) { console.error('fresh record', e); }
    return nr;
  };

  // ---------------------------------------------------------------- starting tensions: each a state the engine runs
  FR.T = {};
  const neighboursOf = rid => (A.neighbors(rid) || []).map(A.realm).filter(o => o && o.alive && !o.isRebel);
  // a claimant faction already formed: the release's factions take it from here (demand, concession or revolt)
  FR.T.succession = function () {
    const S = A.S;
    const cands = live().filter(r => r.ruler && A.realmHouses(r.id).length >= 3 && !(S.factions || []).some(f => f.realm === r.id && f.kind === 'claimant'));
    const r = A.pick(cands); if (!r) return null;
    const hs = A.realmHouses(r.id).slice().sort((a, b) => A.houseStrength(b) - A.houseStrength(a) || (a.id < b.id ? -1 : 1));
    const n = Math.min(hs.length, A.ri(2, 3)), mem = hs.slice(0, n);
    S.factions = S.factions || [];
    for (const f of S.factions.filter(f => f.realm === r.id)) f.members = f.members.filter(id => !mem.some(h => h.id === id));
    const lead = mem[0];
    const f = { id: 'F' + (S.nextFaction = (S.nextFaction || 0) + 1), realm: r.id, kind: 'claimant', members: mem.map(h => h.id), leader: lead.id, start: S.year - A.ri(0, 2), discontent: A.ri(35, 55) };
    S.factions.push(f);
    for (const h of mem) h.op = Math.min(h.op != null ? h.op : 50, A.ri(18, 32));
    r.legit = Math.min(r.legit, A.ri(30, 42));
    const head = A.houseHead(lead.id);
    return { k: 'succession', a: r.id, h: lead.id, note: `in ${r.short}, ${String(lead.name).replace(/^The /, 'the ')} and ${n - 1} other house${n === 2 ? '' : 's'} say ${head ? A.fullName(head, false) : 'their own head'} should rule in place of ${A.fullName(A.P(r.ruler), false)}` };
  };
  // the last harvest failed: the granary is at a fifth of normal (45-economy), or bread is dear (the release's market)
  FR.T.famine = function () {
    const r = A.pick(live().filter(x => A.realmProvs(x.id).length >= 3 && x.race !== 'giant'));
    if (!r) return null;
    r.stability = clamp((r.stability || 50) - A.ri(5, 10), 5, 95);
    for (const P of A.realmProvs(r.id)) P.unrest = Math.min(100, (P.unrest || 0) + A.ri(5, 15));
    return { k: 'famine', a: r.id, y: A.S.year, done: 0, note: `the harvest failed in ${r.short} last year, and the granaries are near empty` };
  };
  // a zealous realm has a holy cause against a neighbour of another faith (the AI reads it in its war choices)
  FR.T.holywar = function () {
    const pairs = [];
    for (const r of live()) if (FR.ZEALOUS.includes(r.faith)) for (const o of neighboursOf(r.id)) if (o.faith && o.faith !== r.faith && !r.allies.includes(o.id) && !atWarWith(r.id, o.id)) pairs.push([r, o]);
    const pr = A.pick(pairs); if (!pr) return null;
    const [r, o] = pr;
    A.grantCB(r.id, o.id, 'holy');
    if (A.remember) A.remember(r.id, o.id, 'incident', -A.ri(6, 12));
    A.setRelPair(r.id, o.id, Math.min(A.relBetween ? A.relBetween(r.id, o.id) : 0, -A.ri(20, 40)));
    r.stability = clamp((r.stability || 50) + 3, 0, 100);
    const F = A.faith ? A.faith(r.faith) : null;
    return { k: 'holywar', a: r.id, b: o.id, note: `the preachers of ${r.short} call for a holy war on ${o.short}${F && F.name ? ` in the name of ${/^the /i.test(F.name) ? F.name : 'the ' + F.name}` : ''}` };
  };
  // the ruler died last winter; a child rules under a regent until of age
  FR.T.regency = function () {
    const ok = r => {
      const ru = A.P(r.ruler); if (!ru || !ru.alive || r.gov !== 'hereditary' || r.id === 'POL-31') return false;
      const kids = (ru.children || []).map(A.P).filter(k => k && k.alive && !k.flags.bastard);
      return !kids.some(k => A.isAdult(k));
    };
    const r = A.pick(live().filter(ok)); if (!r) return null;
    const ru = A.P(r.ruler), R2 = GD.RACES[ru.race] || { adult: 16 };
    let child = (ru.children || []).map(A.P).filter(k => k && k.alive && !k.flags.bastard && !A.isAdult(k)).sort((a, b) => a.born - b.born)[0];
    if (!child) {
      child = A.genNoble(r.id, 'royal', r.house, A.ri(4, Math.max(5, R2.adult - 3)));
      if (ru.sur) { child.sur = ru.sur; child.surMode = 'house'; }
      child.parents = [ru.id]; ru.children.push(child.id);
      A.link(ru, child, 'child', 50, ru.sex === 'M' ? 'father' : 'mother');
    }
    r.heir = child.id; r.heirLocked = child.id;
    const sp = A.P(ru.spouse);
    const regent = sp && sp.alive && A.isAdult(sp) ? sp : (A.relsOf(ru, ['sibling']).map(x => x.p).find(p => p && p.alive && A.isAdult(p)) ||
      (() => { const h = A.realmHouses(r.id).slice().sort((a, b) => A.houseStrength(b) - A.houseStrength(a))[0]; return h ? A.houseHead(h.id) : null; })());
    const oldName = A.rulerStyle(ru, r);
    A.rulerDies(r, 'a winter fever');
    r.heirLocked = null;
    const now = A.P(r.ruler);
    if (!now || !regent || A.isAdult(now)) return { k: 'regency', a: r.id, note: `${oldName} of ${r.short} died last winter` };
    r.regency = { pid: regent.id, kid: now.id, y: A.S.year };
    r.legit = clamp((r.legit || 60) - A.ri(15, 25), 15, 90);
    r.stability = clamp((r.stability || 50) - A.ri(4, 10), 5, 95);
    return { k: 'regency', a: r.id, p: regent.id, note: `${oldName} of ${r.short} died last winter; ${A.rulerStyle(now, r)}, aged ${A.age(now)}, rules under the regency of ${A.fullName(regent, false)}` };
  };
  // one realm owes another; it pays a fifth each New Year, or the creditor gains a cause for war
  FR.T.debt = function () {
    const pairs = [];
    for (const r of live()) for (const o of neighboursOf(r.id)) if (o.id > r.id && !atWarWith(r.id, o.id)) pairs.push([r, o]);
    const pr = A.pick(pairs); if (!pr) return null;
    const [a, b] = A.chance(0.5) ? pr : [pr[1], pr[0]];   // a owes b
    const amt = Math.round(Math.max(2000, (a.income || 10000) * A.rf(0.3, 0.6)) / 100) * 100, ly = A.S.year - A.ri(2, 8);
    a.debt = (a.debt || 0) + amt;
    return { k: 'debt', a: a.id, b: b.id, amt, left: amt, y: ly, missed: 0, note: `${a.short} owes ${b.short} ${A.fmt ? A.fmt(amt) : amt} suns from a loan of ${ly}, and has paid none of it back` };
  };

  FR.make = function () {
    const S = A.S, notes = [], made = [];
    const pool = live().filter(r => A.realmProvs(r.id).length >= FR.MIN_PROVS && r.id !== 'unclaimed' && !(A.atWar(r.id) || []).length);
    for (let k = A.ri(FR.COUNT[0], FR.COUNT[1]); k > 0 && pool.length; k--) {
      const r = A.wpick(pool, x => A.realmProvs(x.id).length);
      pool.splice(pool.indexOf(r), 1);
      const nr = FR.split(r);
      if (!nr) continue;
      made.push(nr.id);
      notes.push(`${nr.name} ${nr.fresh.kind === 'prince' ? `has been held by ${A.rulerStyle(A.P(nr.ruler), nr)} since ${S.year - nr.fresh.ago}` : `broke away from ${r.short} ${nr.fresh.ago} years ago`}, and ${r.short} ${nr.fresh.war ? 'is at war to take it back' : 'still claims it'}`);
    }
    FR.register(S);
    const T = [];
    const kinds = FR.KINDS.slice();
    for (let k = A.ri(FR.TENSIONS[0], FR.TENSIONS[1]); k > 0 && kinds.length; k--) {
      const kind = kinds.splice(A.ri(0, kinds.length - 1), 1)[0];
      let t = null;
      try { t = FR.T[kind](); } catch (e) { console.error('fresh tension', kind, e); }
      if (!t) continue;
      t.note = clean(t.note);
      T.push(t); notes.push(t.note);
      S.history.push({ y: S.year - (kind === 'debt' ? 3 : 1), t: cap1(t.note) + '.' });
    }
    S.freshTensions = T;
    S.freshNotes = notes;
    if (A.updateRealmPops) A.updateRealmPops();
    if (A.locDirty) A.locDirty();
    return { made, tensions: T.map(t => t.k) };
  };

  // ---------------------------------------------------------------- the month: tensions that run on
  FR.month = function (pc) {
    const S = A.S;
    for (const t of S.freshTensions || []) {
      if (!t || t.done) continue;
      const a = A.realm(t.a), b = t.b ? A.realm(t.b) : null;
      if (!a || !a.alive) { t.done = S.year; continue; }
      const mo = A.monthOf(A.today()).m;
      if (t.k === 'famine') {
        // the granary is at a fifth of normal when the life begins; the year's own harvest is no better than poor
        const E = A.ECON;
        if (E && A.mkt) {
          const m = A.mkt(a.id);
          if (!t.set && m && m.s && E.normal) { m.s.grain = Math.min(m.s.grain || 0, E.normal(m, 'grain') * 0.2); t.set = 1; }
          if (m && S.year === t.y && mo >= 5 && m.hv && m.hv.y === S.year && m.hv.f > 0.7) m.hv = { f: 0.7, y: S.year, t: 'a poor harvest' };
          if (m && !m.hv) m.hv = { f: 0.4, y: S.year, t: 'the harvest failed' };
        } else if (!t.set && a.mkt && a.mkt.p && a.mkt.p.grain != null) { a.mkt.p.grain *= 2.5; t.set = 1; }
        if (S.year > t.y) t.done = S.year;
      } else if (t.k === 'debt' && mo === 0 && t.paidY !== S.year) {
        t.paidY = S.year;
        if (!b || !b.alive) { t.done = S.year; continue; }
        const due = Math.min(t.left, Math.round(t.amt / 5));
        if ((a.treasury || 0) >= due * 2) {
          a.treasury -= due; b.treasury = (b.treasury || 0) + due; t.left -= due; a.debt = Math.max(0, (a.debt || 0) - due);
          if (A.remember) A.remember(b.id, a.id, 'aid', 2);
          if (t.left <= 0) { t.done = S.year; A.news(`${a.short} pays the last of its debt to ${b.short}.`, 'realm'); }
        } else {
          t.missed++;
          if (A.remember) A.remember(b.id, a.id, 'snub', -4);
          if (t.missed >= 2 && A.grantCB) { A.grantCB(b.id, a.id, 'tribute'); if (t.missed === 2) A.news(`${b.short} has waited two years for ${a.short} to pay what it owes. Its lords talk of taking it in kind.`, 'realm'); }
        }
      } else if (t.k === 'regency') {
        const R = a.regency;
        if (!R) { t.done = S.year; continue; }
        const kid = A.P(R.kid), rg = A.P(R.pid);
        if (!kid || !kid.alive || a.ruler !== kid.id) { delete a.regency; t.done = S.year; continue; }
        if (A.isAdult(kid)) {
          delete a.regency; t.done = S.year; a.legit = clamp((a.legit || 50) + 10, 0, 100);
          A.news(`${A.rulerStyle(kid, a)} comes of age in ${a.short}, and ${rg ? A.fullName(rg, false) : 'the regent'} gives up the regency.`, 'crown');
          if (pc && pc.realm === a.id) A.log(`${A.rulerStyle(kid, a)} comes of age. The regency is over.`, 'crown');
        } else if (!rg || !rg.alive) {
          const h = A.realmHouses(a.id).slice().sort((x, y) => A.houseStrength(y) - A.houseStrength(x))[0], nx = h ? A.houseHead(h.id) : null;
          if (nx && nx.alive) { R.pid = nx.id; A.news(`The regent of ${a.short} is dead; ${A.fullName(nx, false)} takes the regency for ${A.rulerStyle(kid, a)}.`, 'crown'); } else { delete a.regency; t.done = S.year; }
        }
      } else if (t.k === 'holywar' || t.k === 'succession') {
        if (S.year - (t.y0 || (t.y0 = S.year)) > 6) t.done = S.year;
      }
    }
  };
  A.onMonth.push(pc => { try { if (A.S && A.S.freshTensions) FR.month(pc); } catch (e) { console.error('fresh month', e); } });
  // told at birth, after the life begins
  A.onMonth.push(pc => {
    const S = A.S;
    if (!pc || !Array.isArray(S.freshNotes) || S.freshTold) return;
    S.freshTold = 1;
    const N = S.freshNotes.slice(0, 5);
    if (N.length) A.log(`Older quarrels shape the year you come into. ${N.map(s => cap1(s)).join('. ')}.`, 'muted');
  });

  // ---------------------------------------------------------------- the regent decides how the realm makes war
  // (20-ai-personality reads a realm's temper from its ruler's traits; under a regency the regent's traits count)
  const persona = A.rulerPersona;
  if (typeof persona === 'function') A.rulerPersona = function (rid) {
    const r = A.realm(rid), R = r && r.regency, rg = R && A.P(R.pid);
    if (!rg || !rg.alive || r.ruler !== R.kid) return persona.apply(this, arguments);
    const keep = r.ruler;
    r.ruler = rg.id;
    try { return persona.apply(this, arguments); } finally { r.ruler = keep; }
  };

  // ---------------------------------------------------------------- the bible of a fresh realm (47-realm-bible)
  if (A.BIBLE && typeof A.BIBLE.of === 'function') {
    const of = A.BIBLE.of, cache = new Map();
    A.BIBLE.of = function (rid) {
      const r = A.S && A.S.realms && A.S.realms[rid];
      if (!r || !r.fresh || !r.fresh.from) return of.apply(this, arguments);
      const P = of.call(this, r.fresh.from) || {}, key = `${A.S.seed}|${rid}|${r.fresh.from}|${r.fresh.y0}`;
      const hit = cache.get(rid);
      if (hit && hit.key === key) return hit.D;
      const D = { want: r.fresh.want, fear: r.fresh.fear, place: r.fresh.place, customs: P.customs || [], fresh: true };
      cache.set(rid, { key, D });
      return D;
    };
  }

  // ---------------------------------------------------------------- the Realm tab: old quarrels near you (pure)
  FR.near = function (pc) {
    const S = A.S; if (!pc || !S) return [];
    const mine = pc.realm, nb = new Set(A.neighbors ? A.neighbors(mine) : []);
    const out = [];
    for (const r of Object.values(S.realms)) if (r && r.alive && r.fresh && (r.id === mine || r.fresh.from === mine || nb.has(r.id)))
      out.push(`${r.name} (${r.fresh.kind === 'prince' ? 'a rebel prince\'s holding' : r.fresh.kind === 'league' ? 'a league of free towns' : r.fresh.kind === 'march' ? 'a march' : 'a breakaway duchy'}) holds ${r.fresh.provs.map(id => (S.prov[id] || {}).name).filter(Boolean).join(', ')}, taken from ${A.realmShort(r.fresh.from)} in ${r.fresh.y0 - r.fresh.ago}.`);
    for (const t of S.freshTensions || []) if (t && !t.done && (t.a === mine || t.b === mine || nb.has(t.a))) {
      if (t.k === 'debt') out.push(`${A.realmShort(t.a)} owes ${A.realmShort(t.b)} ${A.fmt ? A.fmt(t.left) : t.left} suns${t.missed ? `, and has missed ${t.missed} payment${t.missed > 1 ? 's' : ''}` : ''}.`);
      else if (t.k === 'regency') { const r = A.realm(t.a), R = r && r.regency, rg = R && A.P(R.pid), kid = R && A.P(R.kid); if (rg && kid) out.push(`${A.realmShort(t.a)} is ruled by ${A.fullName(rg, false)} for ${A.rulerStyle(kid, r)}, aged ${A.age(kid)}.`); }
      else out.push(cap1(t.note) + '.');
    }
    return out;
  };
  FR.card = function (pc) {
    const L = FR.near(pc);
    if (!L.length) return '';
    return `<div class="card small fr" aria-label="Old quarrels"><b>Old quarrels</b>${L.slice(0, 6).map(l => `<div class="tiny">${UI.esc(l)}</div>`).join('')}</div>`;
  };
  const realmTab = UI.TAB && UI.TAB.realm;
  if (typeof realmTab === 'function') UI.TAB.realm = function (pc) {
    const h = realmTab.apply(this, arguments);
    try { const c = pc && pc.alive ? FR.card(pc) : ''; return c ? h + c : h; } catch (e) { return h; }
  };
})();
