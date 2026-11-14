// v2 nobility, part 1: every realm's court, from A.V2.nobility.buildHierarchy (docs/V2_SPEC.md complaint 13,
// integration step 6).
//
// The release had a few dozen named great houses and no shape above or below them. Now each realm, at world start, is
// cut into counties (one per province it owns in A.S.prov: never the map's geometry, which the map lane is replacing)
// and v2 builds its pyramid: at most 3 dukes, at most 6 marquises on the borders (2-3 a duke), one count a county,
// then 2-3 viscounts a count, 2-4 barons a viscount and 3-6 lords a baron. A 30-county realm has about 1,000 nobles.
//
//   Named, stored people: the dukes, marquises and counts. The release's great houses of ducal, marcher or comital rank
//   (N01-N03) keep their seats and hold the title there (v2 starts a march or a duchy at their seat); every other title
//   gets a new house and a head (A.genNoble) with 0-3 children, so the line can pass. The crown holds its capital.
//   Holders carry p.noble = { rung, realm, holding: <their county>, court: <title key> } on GD.NOBLE_RUNGS
//   (Duke 8, Marquis 7, Count 6) and their house's rung follows the title.
//   Generated, not stored: viscounts, barons and lords (A.V2.nobility.lowerNoble, from the seed, the realm, the county,
//   the rank and the index), until someone meets one (N.meet) or is granted the slot (N.grantFief). The release's
//   lesser great houses (N04-N07) seated in a county take a slot under its count instead of the county itself.
//
// Titles move only through the family lane's A.V2F.inherit (the key rides on p.noble, which giveLordship copies); this
// file only keeps the key when an heir already had a rung of their own. A.S.court = { v, realms: { rid: { titles,
// summary } }, met: { slotKey: pid | 'h:'+hid } }.
//
// Determinism: the pyramid comes from v2's makeRng (seeded from the game's seed); the people are made by the game's own
// generators inside A.V2F.sandbox, so the game's stream is where the release left it. What moves: A.S.nextId and the
// yearly draws for the new people and houses (house opinion drift, ageing, deaths).
(function () {
  const V = A.V2, F = A.V2F; if (!V || !V.nobility || !F || !F.sandbox) return;
  const NB = V.nobility;
  const N = A.V2N = A.V2N || {};
  const RUNG = { duke: 8, marquis: 7, count: 6, viscount: 5, baron: 4, lord: 2 };
  const CODE = { duke: 'N01', marquis: 'N02', count: 'N03' };
  const RANK_OF_CODE = { N01: 'duke', N02: 'marquis', N03: 'count', N04: 'viscount', N05: 'baron', N06: 'lord', N07: 'lord' };
  const LOWER = ['viscount', 'baron', 'lord'];
  N.RUNG = RUNG; N.LOWER = LOWER;
  const live = p => !!(p && p.alive);
  const GREAT = h => h && !h.extinct && h.kind !== 'royal' && h.great !== false;

  // v2's namer has four cultures; the game's realms map onto them by race
  N.v2culture = r => ({ elf: 'solenne', dwarf: 'khuul', orc: 'orcish', halforc: 'orcish' })[(r && r.race) || 'human'] || 'aldic';
  N.title = (rank, sex) => {
    const g = GD.NOBLE_RUNGS[RUNG[rank]];
    if (rank === 'lord') return sex === 'F' ? 'Lady' : 'Lord';
    return g ? (sex === 'F' ? g.f : g.title) : rank;
  };
  N.rankName = (rank, n) => {
    const one = { duke: 'duke', marquis: 'marquis', count: 'count', viscount: 'viscount', baron: 'baron', lord: 'lord' }[rank] || rank;
    return n === 1 ? one : (one === 'marquis' ? 'marquises' : one + 's');
  };

  // ---- building -----------------------------------------------------------------------------------------------------
  const mapOf = () => ({ provinces: { list: A.S.prov.map(q => ({ id: q.id, neighbors: q.adj || [] })) } });
  const seatOf = h => (F.seatProv ? F.seatProv(h) : null);

  function newHouse(r, rid, rank, county, rng) {
    const S = A.S, q = S.prov[county];
    const cult = A.cultureFor ? A.cultureFor(r.race || 'human', rid) : null;
    const fn = A.familyName({ cult, realm: rid, status: 'noble', sex: 'M' });
    let sur = (fn && fn.sur) || q.name;
    let id = `FAM-C${rid.replace(/\W/g, '')}-${county}`;
    if (S.houses[id]) id += '-' + S.year; // a house raised again for a title its first house lost
    const palette = ['#2a4f8f', '#8f2a2a', '#2a6f3f', '#6f5a2a', '#4a2a6f', '#1f1f1f', '#cfd3d6', '#c9a227', '#7a1f3d', '#3d5a6f'];
    const charges = ['tower', 'boar', 'stag', 'wolf', 'lion', 'oak', 'key', 'bell', 'ship', 'star', 'wheat', 'bear', 'hawk', 'sword'];
    const c1 = rng.pick(palette);
    const lv = Math.round(Math.min(2500, Math.max(200, (q.pop || 20000) * 0.012)) * (rank === 'duke' ? 2.5 : rank === 'marquis' ? 1.6 : 1));
    S.houses[id] = {
      id, name: `House ${sur.replace(/^(of |the )/, '')}`, sur, realm: rid, kind: 'noble', status: 'noble', rung: CODE[rank],
      title: N.title(rank, 'M'), seat: q.name, seatId: q.pid, great: true, extinct: false, op: 50, levy: lv,
      people: Math.round((q.pop || 20000) * 0.25), since: String(S.year - rng.int(30, 260)),
      colors: [c1, rng.pick(palette.filter(x => x !== c1))], charge: rng.pick(charges), words: '', arms: '',
      notes: `Raised to hold ${q.name}.`, members: [], v2court: rid,
    };
    // 09-engine-at-scale keeps the houses of each realm in an index: a house raised in play (a regrant) must tell it, or
    // A.realmHouses misses the new house until the monthly check finds it (scaleSites reads this line as text)
    if (A.scaleHouse) A.scaleHouse();
    return S.houses[id];
  }
  function newHolder(r, rid, h, rank, rng) {
    const S = A.S, sex = rng.chance(rank === 'count' ? 0.84 : 0.9) ? 'M' : 'F';
    const age = rng.int(24, 62);
    const p = A.genNoble(rid, 'noble', h.id, age, sex);
    h.headPid = p.id; h.members = [p.id];
    const kids = rng.int(rank === 'count' ? 0 : 1, 3);
    for (let i = 0; i < kids; i++) {
      const born = p.born + rng.int(19, 30) + 3 * i;
      if (born > S.year - 1) break;
      const cs = rng.chance(0.5) ? 'M' : 'F';
      const c = A.newPerson({ given: A.givenName(p.cult, cs), sex: cs, race: p.race, realm: rid, cult: p.cult, faith: p.faith, born, status: 'noble', house: h.id, parents: [p.id], home: p.home });
      c.sur = p.sur; c.surMode = p.surMode;
      p.children.push(c.id); h.members.push(c.id);
    }
    return p;
  }
  function seatHolder(p, rid, rank, county, key) {
    p.noble = { rung: RUNG[rank], realm: rid, holding: county, court: key };
  }

  // the court of one realm (inside F.sandbox: the game's stream is set aside)
  N.buildRealm = function (rid) {
    const S = A.S, r = A.realm(rid);
    if (!r || r.alive === false) return null;
    const provs = S.prov.filter(q => q.owner === rid).map(q => q.id);
    if (!provs.length) return null;
    const inR = new Set(provs);
    const capital = inR.has(r.capitalProv) ? r.capitalProv : provs[0];
    const border = provs.filter(id => (S.prov[id].adj || []).some(nb => !inR.has(nb)));
    const rng = F.rng('court|' + rid);
    // the release's great houses of title rank, by their seat in this realm
    const cand = Object.values(S.houses).filter(h => GREAT(h) && /^N0[123]$/.test(h.rung || '')).map(h => ({ h, seat: seatOf(h) }))
      .filter(c => c.seat != null && inR.has(c.seat) && c.seat !== capital).sort((a, b) => a.h.rung.localeCompare(b.h.rung) || a.h.id.localeCompare(b.h.id));
    const bySeat = new Map(); for (const c of cand) if (!bySeat.has(c.seat)) bySeat.set(c.seat, c);
    const ranked = [...bySeat.values()];
    const dukeAt = ranked.map(c => c.seat), marchAt = ranked.filter(c => c.h.rung !== 'N01').map(c => c.seat);
    const realm = { id: rid, capital, provinces: provs, border, culture: N.v2culture(r), name: r.name };
    const H = NB.buildHierarchy(realm, mapOf(), F.seedFor('titles'), { dukeAt, marchAt });
    const used = new Set(), onBorder = id => (S.prov[id].adj || []).some(nb => !inR.has(nb));
    const titles = [], keyOf = t => `${rid}:${t.id}`;
    const take = (rank, t, provsOf) => {
      // a great house seated inside the title holds it; otherwise a new house is raised at its first free county
      // a march is seated on the border (v2 step 2's generated map has fewer border counties, and a march's first free
      // county was often inland): its border counties come first
      if (rank === 'marquis') provsOf = provsOf.filter(id => onBorder(id)).concat(provsOf.filter(id => !onBorder(id)));
      const c = ranked.find(x => !used.has(x.h.id) && provsOf.includes(x.seat) && (rank !== 'marquis' || onBorder(x.seat)));
      let h, seat, p;
      if (c) { h = c.h; seat = c.seat; used.add(h.id); p = A.houseHead(h.id); }
      else {
        seat = provsOf.find(id => id !== capital && !bySeat.has(id) && !titles.some(x => x.seat === id)) ?? provsOf.find(id => id !== capital && !titles.some(x => x.seat === id));
        if (seat == null) return null;
        h = newHouse(r, rid, rank, seat, rng); p = newHolder(r, rid, h, rank, rng);
      }
      if (!h.v2rung) h.v2rung = h.rung || '';
      h.rung = CODE[rank]; h.title = N.title(rank, p.sex);
      seatHolder(p, rid, rank, seat, keyOf(t));
      return { p, h, seat };
    };
    for (const t of H.titles) {
      const rec = { k: keyOf(t), rank: t.rank, parent: t.parent == null ? null : `${rid}:${t.parent}`, provinces: t.provinces.slice() };
      if (t.rank === 'king') { rec.name = r.name; rec.crown = true; titles.push(rec); continue; }
      if (t.rank === 'duke' || t.rank === 'marquis') {
        const got = take(t.rank, t, t.provinces);
        if (!got) continue;
        rec.seat = got.seat; rec.pid = got.p.id; rec.house = got.h.id;
        rec.name = `${t.rank === 'duke' ? 'Duchy' : 'March'} of ${A.provName(got.seat)}`;
        titles.push(rec); continue;
      }
      // a count
      const c = t.province; rec.seat = c; rec.name = `County of ${A.provName(c)}`;
      rec.viscounts = t.viscounts; rec.barons = t.barons; rec.lords = t.lords;
      const over = titles.find(x => (x.rank === 'duke' || x.rank === 'marquis') && x.seat === c);
      if (c === capital) rec.crown = true;
      else if (over) { rec.heldWith = over.k; rec.pid = over.pid; rec.house = over.house; }
      else { const got = take('count', t, [c]); if (got) { rec.pid = got.p.id; rec.house = got.h.id; } }
      titles.push(rec);
    }
    // the release's lesser great houses seated in a county take the first slots of their rank under its count
    const met = S.court.met;
    for (const h of Object.values(S.houses).filter(h => GREAT(h) && /^N0[4-7]$/.test(h.rung || '')).sort((a, b) => a.id.localeCompare(b.id))) {
      const sp = seatOf(h), ct = sp != null && inR.has(sp) && titles.find(x => x.rank === 'count' && x.seat === sp);
      if (!ct) continue;
      const rank = RANK_OF_CODE[h.rung], n = ct[rank === 'viscount' ? 'viscounts' : rank === 'baron' ? 'barons' : 'lords'];
      for (let i = 0; i < n; i++) { const k = N.slotKey(rid, sp, rank, i); if (!met[k]) { met[k] = 'h:' + h.id; break; } }
    }
    const s = H.summary;
    const summary = { dukes: titles.filter(x => x.rank === 'duke').length, marquises: titles.filter(x => x.rank === 'marquis').length, counts: titles.filter(x => x.rank === 'count').length, viscounts: s.viscounts, barons: s.barons, lords: s.lords };
    S.court.realms[rid] = { titles, summary, year: S.year };
    return S.court.realms[rid];
  };
  N.build = function () {
    const S = A.S;
    if (!S || !S.prov || !S.realms) return;
    S.court = S.court && S.court.realms ? S.court : { v: 1, realms: {}, met: {} };
    F.sandbox('court', () => {
      for (const rid of Object.keys(S.realms).sort()) if (!S.court.realms[rid]) { try { N.buildRealm(rid); } catch (e) { console.error('v2-nobility court', rid, e); } }
    });
  };

  // ---- reading ------------------------------------------------------------------------------------------------------
  N.court = rid => (A.S.court && A.S.court.realms && A.S.court.realms[rid]) || null;
  N.titleOf = k => { const rid = String(k).split(':')[0], c = N.court(rid); return c ? c.titles.find(t => t.k === k) || null : null; };
  const hasKey = (p, k) => !!(p && p.noble && (p.noble.court === k || (p.noble.more || []).includes(k)));
  // the living holder of a title: the crown's ruler, a duke for his seat county, or the line from the first holder
  N.holderOf = function (t) {
    if (!t) return null;
    if (t.crown) { const r = A.realm(t.k.split(':')[0]); const ru = r && A.P(r.ruler); return live(ru) ? ru : null; }
    if (t.heldWith) return N.holderOf(N.titleOf(t.heldWith));
    let p = A.P(t.pid);
    for (let g = 0; g < 40 && p && !p.alive && p.noble && p.noble.passed; g++) p = A.P(p.noble.passed);
    return live(p) && hasKey(p, t.k) ? p : null;
  };
  N.countyOf = function (rid, prov) { const c = N.court(rid); return c ? c.titles.find(t => t.rank === 'count' && t.seat === prov) || null : null; };
  N.total = c => c ? 1 + c.summary.dukes + c.summary.marquises + c.titles.filter(t => t.rank === 'count' && !t.crown && !t.heldWith).length + c.summary.viscounts + c.summary.barons + c.summary.lords : 0;

  // the game's name makers, read purely: the game's stream is set aside (F.sandbox) and so is 97-first-life-fixes' list of
  // names lately used (A.S.lfNames), so a slot's name never depends on who was named before it
  N.pureNames = function (salt, f) {
    const S = A.S, keep = S.lfNames;
    S.lfNames = { day: -1, names: [] };
    try { return F.sandbox(salt, f); } finally { if (keep === undefined) delete S.lfNames; else S.lfNames = keep; }
  };
  // a lower noble: the one who has the slot (met, granted, or a lesser great house), else generated from the seed.
  N.slotKey = (rid, county, rank, i) => `${rid}|${county}|${rank}|${i}`;
  N.lower = function (rid, county, rank, i) {
    const k = N.slotKey(rid, county, rank, i), m = A.S.court && A.S.court.met[k];
    const r = A.realm(rid) || {};
    const g = NB.lowerNoble(F.seedFor('low'), { id: rid, culture: N.v2culture(r) }, county, rank, i);
    const place = g.title.replace(/^\S+ of /, '');
    if (typeof m === 'string' && m.startsWith('h:')) {
      const h = A.S.houses[m.slice(2)], hd = h && h.headPid && A.P(h.headPid), sx = hd ? hd.sex : 'M';
      return { key: k, rank, title: `${N.title(rank, sx)} of ${place}`, place, given: hd ? hd.given : '', house: h ? A.houseSurname(h) : '', sex: sx, hid: h && h.id, pid: hd && hd.alive ? hd.id : null };
    }
    const p = m && A.P(m);
    if (p) return { key: k, rank, title: `${N.title(rank, p.sex)} of ${place}`, place, given: p.given, house: p.sur, sex: p.sex, pid: p.id, alive: p.alive };
    const sex = g.sex === 'female' ? 'F' : 'M';
    // the game's own names for the realm's culture, drawn from a stream seeded by the slot (the game's stream is untouched)
    const cult = A.cultureFor ? A.cultureFor(r.race || 'human', rid) : null;
    const nm = N.pureNames('low|' + k, () => ({ given: A.givenName(cult, sex), sur: A.familyName({ cult, realm: rid, status: 'noble', sex }).sur }));
    return { key: k, rank, title: `${N.title(rank, sex)} of ${place}`, place, given: nm.given || g.given, house: nm.sur || g.house, sex };
  };
  // meeting one: the slot becomes a stored person, the same every time
  N.meet = function (rid, county, rank, i) {
    const S = A.S, k = N.slotKey(rid, county, rank, i), m = S.court.met[k];
    if (m) { if (typeof m === 'string' && m.startsWith('h:')) { const hd = F.sandbox('meet|' + k, () => A.houseHead(m.slice(2))); return hd; } return A.P(m); }
    const g = N.lower(rid, county, rank, i);
    const p = F.sandbox('meet|' + k, () => {
      const age = F.rng('age|' + k).int(rank === 'lord' ? 19 : 24, 64);
      const q = A.genNoble(rid, 'noble', null, age, g.sex);
      q.given = g.given; q.sur = g.house; q.home = county;
      return q;
    });
    p.noble = { rung: RUNG[rank], realm: rid, holding: null, fief: { county, rank, i, name: g.place } };
    S.court.met[k] = p.id;
    return p;
  };
  // a grant of a viscounty or barony (994's enfeoffment, 97's patent, a ruler's grant) when every county has its count:
  // the first free slot of that rank in the grantee's county, else in another county of the realm
  N.grantFief = function (p) {
    if (!p || !p.noble || p.noble.fief || p.noble.holding != null) return null;
    const rank = p.noble.rung >= 5 ? 'viscount' : p.noble.rung >= 4 ? 'baron' : null, rid = p.noble.realm || p.realm, c = N.court(rid);
    if (!rank || !c) return null;
    const counts = c.titles.filter(t => t.rank === 'count');
    // the head of a lesser great house takes the slot its house was given under the count of its seat
    const met = A.S.court.met, mine = p.house && Object.keys(met).find(k => met[k] === 'h:' + p.house && k.startsWith(rid + '|'));
    if (mine) {
      const [, county, rk, i] = mine.split('|'), g = N.lower(rid, +county, rk, +i);
      p.noble.fief = { county: +county, rank: rk, i: +i, name: g.place };
      return p.noble.fief;
    }
    const home = counts.find(t => t.seat === p.home);
    for (const t of [home, ...counts].filter(Boolean)) {
      const n = t[rank === 'viscount' ? 'viscounts' : 'barons'];
      for (let i = 0; i < n; i++) {
        const k = N.slotKey(rid, t.seat, rank, i);
        if (A.S.court.met[k]) continue;
        const g = N.lower(rid, t.seat, rank, i);
        A.S.court.met[k] = p.id;
        p.noble.fief = { county: t.seat, rank, i, name: g.place };
        return p.noble.fief;
      }
    }
    return null;
  };

  // ---- the title on the rung ----------------------------------------------------------------------------------------
  const nobleTitle = A.nobleTitle;
  A.nobleTitle = function (p) {
    if (p && p.noble && p.noble.fief && p.noble.holding == null) {
      const g = GD.NOBLE_RUNGS[p.noble.rung];
      if (g) return `${p.noble.rung === 2 ? (p.sex === 'F' ? 'Lady' : 'Lord') : (p.sex === 'F' ? g.f : g.title)} of ${p.noble.fief.name}`;
    }
    return nobleTitle.apply(this, arguments);
  };

  // ---- titles move only in A.V2F.inherit: keep the key when the heir had a rung of their own ------------------------
  const inherit = F.inherit;
  F.inherit = function (from) {
    const moved = inherit.apply(this, arguments);
    try {
      const keys = from && from.noble ? [from.noble.court, ...(from.noble.more || [])].filter(Boolean) : [];
      const to = keys.length && from.noble.passed && A.P(from.noble.passed);
      for (const k of keys) {
        if (to && to.noble && !hasKey(to, k)) { if (!to.noble.court) to.noble.court = k; else (to.noble.more = to.noble.more || []).push(k); }
        // the title remembers its holder (the dead are pruned from A.S.people, so a chain through them would break)
        const t = N.titleOf(k); if (t && to && hasKey(to, k)) t.pid = to.id;
      }
    } catch (e) { console.error('v2-nobility inherit', e); }
    return moved;
  };

  // the release's A.houseHead(hid, true) (an elective realm choosing its ruler from a house) makes a new person head of
  // the house while the old head lives. A court lord stays head of his house, and so keeps his county's seat; the new
  // person is the house's candidate, not its head.
  // And a house whose head was cleared while he lives (56-court-and-treasury's failed-rebellion purge sets headPid = null
  // even when the beheading did not take) gets its court lord back as head, not a stranger.
  const houseHead = A.houseHead;
  A.houseHead = function (hid, fresh) {
    const h = A.S.houses[hid];
    if (h && !fresh && !live(h.headPid && A.P(h.headPid))) {
      const lord = Object.values(A.S.people).find(q => q.alive && q.house === hid && q.noble && q.noble.court);
      if (lord) { h.headPid = lord.id; return lord; }
    }
    const old = h && h.headPid && A.P(h.headPid);
    const p = houseHead.apply(this, arguments);
    if (fresh && h && live(old) && old !== p && old.noble && old.noble.court) h.headPid = old.id;
    return p;
  };

  // ---- world start and old saves -----------------------------------------------------------------------
  const ng = A.newGame;
  A.newGame = function () {
    const out = ng.apply(this, arguments);
    try { A.S.court = null; N.build(); } catch (e) { console.error('v2-nobility build', e); }
    return out;
  };
  A.onMonth.push(function () {
    const S = A.S; if (!S) return;
    // an old save has no court: it is built once, from the seed. A realm born later (a revolt, a split) keeps the
    // counts of the court its counties came from, so it is not built again.
    if (!S.court) N.build();
    // a fresh viscounty or barony with no county of its own takes a slot under a count
    for (const id in S.people) { const p = S.people[id]; if (p.alive && p.noble && p.noble.rung >= 4 && p.noble.rung <= 5 && p.noble.holding == null && !p.noble.fief) N.grantFief(p); }
    try { N.regrantMonth(); } catch (e) { console.error('v2-nobility regrant', e); }
  });

  // ---- a vacant title is the liege's to give (playtest 1 #25) --------------------------------------------------------
  // A title with no living holder (its line ran out) is marked vacant (t.vacant = the year). After 3 to 12 months
  // (seeded by the title and the year) the liege gives it: first to the dead holder's house (its living head, else its
  // eldest grown member), as the house law would; else to the realm's highest and most renowned lesser noble (a
  // viscount, baron or knight who holds no court title; he gives up his slot); else a new house is raised. The grant
  // sets p.noble with the title's key; nobody who already holds a court title is chosen, so one holder per title holds.
  const adultOf = p => p && p.alive && A.age(p) >= ((GD.RACES[p.race] || {}).adult || 16) + 2;
  N.candidateFor = function (t) {
    const S = A.S, rid = t.k.split(':')[0];
    const free = p => adultOf(p) && !(p.noble && p.noble.court) && p.id !== S.pc && !(p.ruler && A.realm(p.ruler) && A.realm(p.ruler).ruler === p.id);
    const h = t.house && S.houses[t.house];
    if (h && !h.extinct) {
      let hd = F.headOf ? F.headOf(h.id) : A.P(h.headPid);
      // a great house with no living head gets one as the release would (A.houseHead), off the game's stream
      if (!live(hd) && h.great !== false) hd = F.sandbox('head|' + h.id + '|' + S.year, () => A.houseHead(h.id));
      // the head takes it even as a child (a regency); only a head who rules, holds another court title or is you is passed by
      if (hd && hd.alive && !(hd.noble && hd.noble.court) && hd.id !== S.pc && !(hd.ruler && A.realm(hd.ruler) && A.realm(hd.ruler).ruler === hd.id)) return { p: hd, why: 'house' };
      const ms = Object.values(S.people).filter(q => q.house === h.id && free(q)).sort((a, b) => a.born - b.born || (a.id < b.id ? -1 : 1));
      if (ms[0]) return { p: ms[0], why: 'house' };
    }
    const vs = Object.values(S.people).filter(q => free(q) && q.noble && q.noble.rung >= 2 && q.noble.rung <= 5 && (q.noble.realm || q.realm) === rid)
      .sort((a, b) => b.noble.rung - a.noble.rung || (b.fame || 0) - (a.fame || 0) || (a.id < b.id ? -1 : 1));
    if (vs[0]) return { p: vs[0], why: 'vassal' };
    return null;
  };
  // Decide first, create last (round 2 A0, docs/CRITIQUE.md R5). The old code raised the new house and its people, then
  // read the old house's head, which a headless house does not have (ohd null): it threw with the new house made and
  // nobody seated, the month's pass stopped there, and from then on the new house and the old one both sat in the
  // county (seed 7, 1159-60: two lords of Rushzag Oasis for good). Now every read and check comes first, nothing is
  // made until they pass, and a failure while making the new holder takes back what it made.
  N.regrant = function (t) {
    const S = A.S, rid = t.k.split(':')[0], r = A.realm(rid);
    if (!r || r.alive === false || N.holderOf(t)) return null;
    if (!S.prov[t.seat]) return null;
    // the plan: who takes it, and where the old house's seat goes
    let c = N.candidateFor(t);
    // the old house (even headless now: the release may give it a head later) no longer sits in this county: its seat
    // follows its head's own holding, or it has none (one holder per county: F.audit counts a living head's seat as a
    // holding). A house with no head has no holding to follow.
    const oh = t.house && S.houses[t.house], ohd = oh && oh.headPid ? A.P(oh.headPid) : null;
    const ohSeat = !!(oh && F.seatProv && F.seatProv(oh) === t.seat);
    const ohTo = ohSeat && ohd && ohd.noble && ohd.noble.holding != null ? S.prov[ohd.noble.holding] || null : null;
    // only now is anything made: a new house and its head, when no one can take the title. If making them throws, the
    // people and the house made so far are taken back, and the title waits for next month.
    if (!c) {
      const keepPeople = new Set(Object.keys(S.people)), keepHouses = new Set(Object.keys(S.houses)), keepId = S.nextId;
      try {
        F.sandbox('regrant|' + t.k + '|' + S.year, () => {
          const rng = F.rng('regrant|' + t.k + '|' + S.year);
          const h = newHouse(r, rid, t.rank, t.seat, rng);
          c = { p: newHolder(r, rid, h, t.rank, rng), why: 'new' };
        });
        if (!c || !c.p) throw new Error('no holder made for ' + t.k);
      } catch (e) {
        for (const id of Object.keys(S.people)) if (!keepPeople.has(id)) delete S.people[id];
        for (const id of Object.keys(S.houses)) if (!keepHouses.has(id)) delete S.houses[id];
        if (keepId !== undefined) S.nextId = keepId;
        if (A.scaleHouse) try { A.scaleHouse(); } catch (e2) { /* the index is rebuilt by the monthly check */ }
        throw e;
      }
    }
    const p = c.p;
    // the commit: plain writes from here on
    if (oh && oh.id !== p.house && ohSeat) { oh.v2seatLost = oh.seat; oh.seat = ohTo ? ohTo.name : null; oh.seatId = ohTo ? ohTo.pid : null; }
    // a lesser noble gives up his slot under a count; the slot is generated again
    if (p.noble && p.noble.fief) { const f = p.noble.fief, k = N.slotKey(p.noble.realm || rid, f.county, f.rank, f.i); if (S.court.met[k] === p.id) delete S.court.met[k]; }
    seatHolder(p, rid, t.rank, t.seat, t.k);
    t.pid = p.id;
    const hh = p.house && S.houses[p.house];
    if (hh && hh.headPid === p.id) {
      if (!hh.v2rung) hh.v2rung = hh.rung || '';
      if (!/^N0[123]$/.test(hh.rung || '') || hh.rung > CODE[t.rank]) hh.rung = CODE[t.rank];
      hh.title = N.title(t.rank, p.sex);
      const q = S.prov[t.seat]; if (q) { hh.seat = q.name; hh.seatId = q.pid; }
    }
    t.house = p.house || t.house;
    const was = t.vacant; delete t.vacant; delete t.vacN;
    t.granted = S.year;
    const pc = A.pc(), ru = A.P(r.ruler);
    if (pc && pc.realm === rid && (t.rank !== 'count' || pc.home === t.seat) && A.news) A.news(`${ru ? A.fullName(ru, false) : 'The crown'} gives the ${t.name}, vacant since ${was}, to ${A.fullName(p, false)}.`, 'crown');
    return { t: t.k, to: p.id, why: c.why };
  };
  // one title's failure never stops the pass: each regrant is tried on its own (round 2 A0, R5: one throw used to skip
  // every title after it, 164 in seed 7's 1159), and the failure is logged
  N.regrantMonth = function () {
    const S = A.S; if (!S.court) return [];
    const out = [];
    for (const c of Object.values(S.court.realms)) for (const t of c.titles) {
      if (t.crown || t.heldWith || t.rank === 'king') continue;
      if (N.holderOf(t)) { if (t.vacant) { delete t.vacant; delete t.vacN; } continue; }
      if (!t.vacant) { t.vacant = S.year; t.vacN = 0; continue; }
      t.vacN = (t.vacN || 0) + 1;
      if (t.vacN >= F.rng('wait|' + t.k + '|' + t.vacant).int(3, 12)) {
        try { const g = N.regrant(t); if (g) out.push(g); } catch (e) { console.error('v2-nobility regrant', t.k, e); }
      }
    }
    return out;
  };
  // "the king's to give", in the realm's own word for its ruler
  N.givenBy = function (rid) {
    const r = A.realm(rid);
    return `the ${String((r && r.title) || 'crown').split(' / ')[0].split(' (')[0].toLowerCase()}'s to give`;
  };
  // the court's lords grow old and die. The release only ages and buries the people you know and the rulers, so a count
  // no one has met would hold his county for ever; each year every title holder you do not know (and who does not
  // rule) dies at the release's own rate (A.deathChance), drawn from a stream seeded by the year and the person, never
  // from the game's. The death goes through A.kill, so the title passes by the family lane's A.V2F.inherit.
  const CAUSES = ['old age', 'a winter fever', 'the flux', 'a fall from a horse', 'a wasting sickness', 'his heart', 'a wound gone bad'];
  N.yearOfDeaths = function () {
    const S = A.S, pc = A.pc(); if (!S.court) return [];
    const seen = new Set(), out = [];
    for (const c of Object.values(S.court.realms)) for (const t of c.titles) {
      if (t.crown || t.heldWith || t.rank === 'king') continue;
      const p = N.holderOf(t);
      if (!p || seen.has(p.id) || p.id === S.pc || (pc && pc.rel && pc.rel[p.id]) || (p.ruler && A.realm(p.ruler) && A.realm(p.ruler).ruler === p.id)) continue;
      seen.add(p.id);
      const rr = F.rng(`death|${S.year}|${p.id}`);
      if (rr.next() < A.deathChance(p)) {
        const cause = rr.pick(CAUSES).replace('his heart', p.sex === 'F' ? 'her heart' : 'his heart');
        A.kill(p, cause, true);
        const nx = N.holderOf(t);
        out.push({ t: t.k, dead: p.id, next: nx && nx.id });
        if (pc && (t.rank === 'duke' || t.rank === 'marquis') && t.k.startsWith((pc.realm || '') + ':') && A.news) A.news(`${A.fullName(p, false)}, ${N.title(t.rank, p.sex)} of ${A.provName(t.seat)}, is dead (${cause}).${nx ? ` ${A.fullName(nx, false)} holds the ${t.rank === 'duke' ? 'duchy' : 'march'} now.` : ' The title stands empty.'}`, 'crown');
      }
    }
    // A2 (R6): a title left with no heir by these deaths stands vacant from the death, not from the next month's pass
    if (out.length) for (const c of Object.values(S.court.realms)) for (const t of c.titles) {
      if (t.crown || t.heldWith || t.rank === 'king' || t.vacant) continue;
      if (!N.holderOf(t)) { t.vacant = S.year; t.vacN = 0; }
    }
    return out;
  };
  (A.onYear = A.onYear || []).push(function () { try { N.yearOfDeaths(); } catch (e) { console.error('v2-nobility deaths', e); } });

  // playtest 1 #14: 9996-polity's border office was "Warden of the March", which beside a court of dukes and marches
  // read as a rank ("Duke, Warden of the March of Kingsmere"). It is an office, so it is named as one.
  if (GD.POL_OFFICES && GD.POL_OFFICES.warden) GD.POL_OFFICES.warden.n = 'Border warden';

  A.SIGNATURE = Object.assign(A.SIGNATURE || {}, { nobility: true });
})();
