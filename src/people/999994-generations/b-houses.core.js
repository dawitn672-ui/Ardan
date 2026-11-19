// The houses go on (D-108). With the unknown now dying (a-deaths), a house whose members never marry and never bear a
// child dies out in a lifetime: the release married and brought children only to the player's own family (A.familyYear),
// so of 983 people at the start ten were married, and by year 100 a fifth of the great houses had no one left. The
// families of the world now do what the player's does, each New Year after the deaths:
//
//   marriage  a house marries its line on: an unmarried grown son of a house who is the eldest living son of his father
//             (the heir of his line; a man with no father on record counts as one) seeks a wife in a year at WED
//             odds, a younger son at WED x YOUNGER (the church, the army and the road took most younger sons). He takes a
//             woman free to marry of his realm, estate (within one step) and people, of an age with him, not of his blood
//             within three steps (the family tree), or, when the realm has none, a wife from outside it (as A.familyYear
//             marries the player's children). A daughter marries when a son of another line takes her: so a world of
//             houses keeps about one married couple to a line, and does not swell;
//   children  a married couple who can have children (A.fertilePair) has one at odds that fall with the children it
//             already has living: a house wants an heir and a spare (WANT), and the release's fertility of their people
//             (A.pairFert). The child is born of A.birth (its house, name, blood and the mother's risk are the release's).
//
// The player's own family keeps the release's rules (A.familyYear: the player, his spouse, his parents, his children and
// theirs). Each draw comes from a stream seeded by the year and the person, and each marriage or birth runs in a sandbox
// (A.V2F.sandbox): the game's stream does not move. HOUSES.OFF stops it.
(function () {
  const F = A.V2F; if (!F || !F.rng || !F.sandbox) return;
  const H = A.HOUSES_GO_ON = A.HOUSES_GO_ON || {};
  H.WED = 0.2;                                  // a year's odds that the heir of a line takes a wife
  H.YOUNGER = 0.05;                             // a younger son's share of those odds
  H.WANT = [0.26, 0.20, 0.09, 0.03, 0.01];      // a year's odds of a child, by the couple's children living (4 and more: the last)
  H.KIN = 3;                                    // no marriage within this many steps of blood
  H.stats = { wed: 0, outsiders: 0, births: 0, years: 0 };
  const MAXF = { human: 44, orc: 34, halforc: 40, elf: 320, dwarf: 130, giant: 70, halfelf: 120 };
  const TIER = { royal: 3, noble: 3, gentry: 2, merchant: 1, artisan: 1, peasant: 0, serf: 0, slave: -1 };
  const GREAT = new Set(['royal', 'noble', 'gentry']);
  const byId = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

  // the player's family, whose marriages and children are A.familyYear's
  H.pcFamily = function () {
    const pc = A.pc(), out = new Set(); if (!pc) return out;
    out.add(pc.id); if (pc.spouse) out.add(pc.spouse);
    for (const id of pc.parents || []) if (id) out.add(id);
    for (const id of pc.children || []) { out.add(id); const c = A.P(id); if (c && c.spouse) out.add(c.spouse); }
    return out;
  };
  const married = p => { const s = p.spouse && A.P(p.spouse); return !!(s && s.alive && s.spouse === p.id); };
  const ofAge = p => { const R = GD.RACES[p.race] || GD.RACES.human, a = A.age(p); return a >= R.adult + 2 && a <= (MAXF[p.race] || 44) - 4; };
  H.free = (p, fam) => !!(p && p.alive && !p.npcTemp && !fam.has(p.id) && !married(p) && !p.prison && !(p.flags && (p.flags.priest || p.flags.vow))
    && (p.house || GREAT.has(p.status)) && ofAge(p));
  // the eldest living son of his father (his line's heir), by the father's id each son keeps (the father's record may be
  // gone from A.S.people); a man with no father on record is the first of his line
  H.heirs = function () {
    const first = new Map();
    for (const p of Object.values(A.S.people)) {
      if (!p.alive || p.sex !== 'M') continue;
      const f = (p.parents || [])[0]; if (!f) continue;
      const q = first.get(f); if (!q || p.born < q.born || (p.born === q.born && p.id < q.id)) first.set(f, p);
    }
    return p => { const f = (p.parents || [])[0]; return !f || first.get(f) === p; };
  };
  const blood = (a, b) => { if (!F.kinOf) return false; try { const k = F.kinOf(a, b); return !!(k && k.line !== 'affinal' && k.degree <= H.KIN); } catch (e) { return true; } };
  const match = (a, b) => a.sex !== b.sex && a.realm === b.realm && Math.abs((TIER[a.status] || 0) - (TIER[b.status] || 0)) <= 1
    && Math.abs(A.age(a) - A.age(b)) <= 10 && (A.fertilePair ? A.fertilePair(a.sex === 'M' ? a : b, a.sex === 'F' ? a : b) : a.race === b.race);

  H.wed = function (a, b) {
    a.spouse = b.id; b.spouse = a.id;
    A.link(a, b, 'spouse', 40, 'spouse');
  };
  // someone from outside the realm's free people, made as A.familyYear makes a spouse for the player's child
  H.outsider = function (c) {
    const sx = c.sex === 'M' ? 'F' : 'M', R = GD.RACES[c.race] || GD.RACES.human;
    const s2 = A.newPerson({ given: A.givenName(c.cult, sx, { realm: c.realm }), sex: sx, race: c.race, realm: c.realm, cult: c.cult, faith: c.faith,
      born: Math.min(A.S.year - R.adult - 1, c.born + A.ri(-4, 4)), status: c.status, home: c.home });
    const fn = A.familyName({ cult: s2.cult, realm: s2.realm, status: s2.status, home: s2.home, sex: sx });
    s2.sur = fn.sur; s2.surMode = fn.mode;
    return s2;
  };

  H.year = function () {
    const S = A.S; if (H.OFF || !S || !S.people) return null;
    H.stats.years++;
    const fam = H.pcFamily(), out = { wed: 0, births: 0 };
    // marriages: the free, by id; a partner from the free of the realm, else an outsider
    const free = Object.values(S.people).filter(p => H.free(p, fam)).sort(byId), taken = new Set(), heir = H.heirs();
    for (const p of free) {
      if (p.sex !== 'M' || !p.house || taken.has(p.id) || married(p)) continue;
      const r = F.rng(`wed|${S.year}|${p.id}`);
      if (!(r.next() < H.WED * (heir(p) ? 1 : H.YOUNGER))) continue;
      const cands = free.filter(q => q.id !== p.id && !taken.has(q.id) && !married(q) && match(p, q));
      let q = null;
      while (cands.length && !q) { const i = Math.floor(r.next() * cands.length), c = cands.splice(i, 1)[0]; if (!blood(p, c)) q = c; }
      F.sandbox(`wed|${S.year}|${p.id}`, () => {
        if (!q) { q = H.outsider(p); H.stats.outsiders++; }
        H.wed(p, q);
      });
      taken.add(p.id); taken.add(q.id); out.wed++; H.stats.wed++;
    }
    // children: each married couple of the world (the player's family apart), by the wife's id
    const wives = Object.values(S.people).filter(p => p.alive && p.sex === 'F' && !p.npcTemp && !fam.has(p.id) && married(p)).sort(byId);
    for (const w of wives) {
      const h = A.P(w.spouse); if (!h || fam.has(h.id) || !A.fertilePair(h, w)) continue;
      if (A.PREG && A.PREG.of && A.PREG.of(w)) continue;
      const kids = (w.children || []).map(A.P).filter(c => c && c.alive && (h.children || []).includes(c.id)).length;
      const q = H.WANT[Math.min(kids, H.WANT.length - 1)] * (A.pairFert ? A.pairFert(h, w) : 1);
      if (!(F.rng(`child|${S.year}|${w.id}`).next() < q)) continue;
      F.sandbox(`child|${S.year}|${w.id}`, () => A.birth(w, h, false, true));
      out.births++; H.stats.births++;
    }
    return out;
  };
  (A.onYear = A.onYear || []).push(function () { try { H.year(); } catch (e) { console.error('houses go on', e); } });
})();
