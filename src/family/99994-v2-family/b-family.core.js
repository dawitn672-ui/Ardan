// v2 family, part 2: the player's family, three generations deep (docs/V2_SPEC.md complaint 14; src/world/engine/world.js
// createPlayerFamily), and no birth-position picker.
//
// The release made a father, a mother, 0-3 elder siblings (as many as the "Place in the family" choice allowed) and, for
// each parent, a 45% chance of one grandparent with no spouse. Nobody had an uncle, an aunt or a cousin. Now, after the
// release has made the parents (house heads, royal parents and great-house members stay its own), the family is filled
// in on createPlayerFamily's model:
//   - both pairs of grandparents, married, the old ones often dead;
//   - each parent's brothers and sisters (2-4 on the father's side, 1-4 on the mother's), some dead young, some sworn to
//     the temple, some holding an office; the rest married, with 1-4 children each (your cousins);
//   - the number of elder siblings comes from the family's own seed (none 3 in 9, one 3 in 9, two 2 in 9, three 1 in 9),
//     never from a choice.
// Heir claims are read from the house law (c-succession.core.js), so the family view can say "heir to House X".
//
// Determinism: the shape of the family is drawn from v2's makeRng, seeded from the game's seed. The people themselves
// are made by the game's A.newPerson (its stats, looks and names), with the game's random stream set aside while they
// are made (F.sandbox): the stream continues afterwards exactly where the release left it. What moves: A.S.nextId (each
// later person's id is about 25 higher) and the yearly draws for the extra kin the player now knows.
(function () {
  const V = A.V2, F = A.V2F; if (!V || !F) return;
  const R = V.rng;
  F.seedFor = salt => ((((A.S && A.S.seed) || 0) >>> 0) ^ R.hashStr(String(salt))) >>> 0;
  F.rng = salt => R.makeRng(F.seedFor(salt));
  // run f with the game's random stream set aside; draws inside come from a stream of their own, seeded from the seed
  F.sandbox = function (salt, f) {
    const keep = A.rngState;
    A.rngState = F.seedFor('stream|' + salt) | 0;
    try { return f(); } finally { A.rngState = keep; }
  };

  // ---- no picker: the birth position comes from the family -----------------------------------------------------
  // A hand-made story (29-starting-stories) whose premise is a birth (a younger son, a bastard) keeps it: the story is chosen as a
  // whole, its scenes read it, and the creation screen no longer offers the choice on its own.
  F.storyOrder = function (o) {
    const s = o && o.story && A.STARTS && A.STARTS.find(x => x.id === o.story);
    return s && s.cr && s.cr.order ? s.cr.order : null;
  };
  F.elderCount = function (o) {
    const w = o && o.order === 'younger' ? [0, 3, 2, 1] : [3, 3, 2, 1];
    return F.rng('elder').weighted([0, 1, 2, 3], k => w[k]);
  };

  // offices an uncle or aunt may hold, by the family's estate
  F.OFFICES = {
    royal: ['Captain of the royal host', 'Steward of the royal demesne', 'Castellan of the river fort', 'Master of the horse', 'Admiral of the coast fleet', 'Envoy to the courts abroad'],
    noble: ['Castellan of the river fort', 'Captain of the city watch', 'Captain of the levies', 'Royal huntsman', 'Steward of the demesne', 'Warden of the north road'],
    gentry: ['Captain of the town watch', 'Alderman of the town', 'Collector of the bridge toll', 'Keeper of the castle stores'],
    merchant: ['Master of the merchant guild', 'Alderman of the town', 'Collector of the harbour dues', 'Warden of the market'],
    artisan: ['Master of the guild', 'Warden of the market', 'Keeper of the town gate'],
    peasant: ['Reeve of the village', 'Village headman', 'Hayward of the commons'],
    serf: ['Reeve of the manor', 'Hayward of the commons'],
    slave: [],
  };
  const CAUSES = ['old age', 'a winter fever', 'the flux', 'a fall from a horse', 'a wasting sickness', 'childbed fever'];
  const YOUNG = ['the summer flux', 'a winter cough', 'a fever', 'the spotted fever'];

  // a death in the past, without A.kill (no succession, no hooks: these people died before the story begins)
  function pastDeath(p, year, cause) {
    p.alive = false; p.died = year; p.cause = cause;
    const sp = p.spouse && A.P(p.spouse);
    if (sp && sp.spouse === p.id) { sp.spouse = null; sp.widowed = year; }
  }
  function marry(a, b) {
    a.spouse = b.id; b.spouse = a.id;
    A.link(a, b, 'spouse', 40, 'spouse');
  }
  const famName = (p, sex) => A.familyName({ cult: p.cult, realm: p.realm, status: p.status, home: p.home, sex });

  // ---- a child's clan comes from its parents, by the law (playtest 2, new #9) -------------------------------------
  // The release names an orc commoner "of Clan X" ("deed" mode) and drew X afresh for every birth, parents or not: it
  // passed a parent's name on only for the house, clan, trade ... modes, never for "deed". So full brothers and sisters
  // were "Tarn of Clan Gholruk", "Ozrak of Clan Hrogul", "Brak of Clan Mukhoth", and none of them their father's. Now a
  // child whose parents have a clan takes one of theirs by the law: the house's law (F.houseLaw) for a child of a house,
  // else the realm's custom; a realm whose crown goes to daughters (law "female": the Tusk Clans' War-Mother) reckons
  // the clan through the mother, every other law through the father. The release's draw is still made (the stream does
  // not move); only the name changes.
  F.clanOfName = p => {
    if (!p) return null;
    if (p.flags && p.flags.clan) return p.flags.clan;
    const m = /^of Clan (.+)$/.exec(p.sur || '');
    return p.surMode === 'deed' && m ? m[1] : null;
  };
  F.clanThroughMother = function (o) {
    const hid = o.house || (o.father && o.father.house) || (o.mother && o.mother.house);
    if (hid && A.S.houses && A.S.houses[hid] && F.houseLaw) {
      const r = F.royalRealmOf && F.royalRealmOf(hid);
      if (r) return r.law === 'female';
    }
    const r = A.S.realms && A.S.realms[o.realm];
    return !!(r && r.law === 'female');
  };
  const familyName = A.familyName;
  A.familyName = function (o) {
    const out = familyName.apply(this, arguments);
    if (!out || out.mode !== 'deed' || !o) return out;
    const fa = F.clanOfName(o.father), mo = F.clanOfName(o.mother);
    const clan = F.clanThroughMother(o) ? (mo || fa) : (fa || mo);
    return clan ? Object.assign({}, out, { sur: 'of Clan ' + clan, clan }) : out;
  };

  function sideOf(pc, par, paternal, r, out) {
    const S = A.S, race = par.race, R2 = GD.RACES[race] || GD.RACES.human;
    const [m0, m1] = A.parentAgeRange(race, 'M'), [f0, f1] = A.parentAgeRange(race, 'F');
    const base = { race, realm: par.realm, cult: par.cult, faith: par.faith, status: par.status, home: par.home };
    const mk = (sex, born, extra) => { const p = A.newPerson(Object.assign({ given: A.givenName(par.cult, sex), sex, born: Math.min(born, S.year - 1) }, base, extra || {})); out.push(p); return p; };
    const surOf = (sex, father) => (par.surMode === 'patron' ? (sex === 'F' ? 'daughter of ' : 'son of ') + (father ? father.given : A.givenName(par.cult, 'M')) : par.sur);
    const oldDeath = (p, after) => {
      const age = S.year - p.born, span = Math.max(8, R2.life - R2.old + 2 * (R2.lifeSd || 10));
      const pDead = Math.max(0.04, Math.min(0.97, (age - R2.old) / span));
      if (p.alive && r.chance(pDead)) pastDeath(p, Math.max(after + 1, Math.min(S.year - 1, S.year - r.int(1, 14))), r.pick(CAUSES));
    };

    // grandparents (one may exist already: the release's lone grandparent, or a house's own elders)
    const gps = (par.parents || []).map(A.P).filter(Boolean);
    let gf = gps.find(q => q.sex !== 'F'), gm = gps.find(q => q.sex === 'F');
    const newGf = !gf, newGm = !gm;
    if (!gf) { gf = mk('M', par.born - r.int(m0, Math.min(m1, m0 + 14)), { house: par.house || null }); gf.sur = surOf('M', null); gf.surMode = par.surMode; gf.occ = gf.occ || (par.sex === 'F' ? '' : par.occ) || ''; }
    if (!gm) { gm = mk('F', Math.max(gf.born - 6, par.born - r.int(f0, Math.min(f1, f0 + 10)))); const fn = famName(gm, 'F'); gm.sur = fn.sur; gm.surMode = fn.mode; }
    // a clan reckoned through the mother (playtest 2, new #9): the parent's clan is the grandmother's, and the
    // grandfather is of the clan she married into (the same names, swapped: no draw is added)
    if (newGf && newGm && par.surMode === 'deed' && gm.surMode === 'deed' && F.clanThroughMother({ realm: par.realm, house: par.house })) {
      const other = gm.sur; gm.sur = par.sur; gf.sur = other;
    }
    if (!gf.spouse && !gm.spouse) marry(gf, gm);
    par.parents = [gf.id, gm.id];
    for (const g of [gf, gm]) { if (!g.children.includes(par.id)) g.children.push(par.id); }
    for (const g of [gf, gm]) A.link(pc, g, 'grandparent', r.int(20, 75), 'grandchild');
    if (newGf) oldDeath(gf, par.born);
    if (newGm) oldDeath(gm, par.born);
    // a parent who already holds the house or the crown came to it by the law: the old holder (their father) is dead,
    // and no brother or sister who would come first under that law is alive (the line has to read true)
    const ph = par.house && S.houses[par.house];
    const holds = !!((par.ruler && A.realm(par.ruler) && A.realm(par.ruler).ruler === par.id) || (ph && ph.headPid === par.id));
    const law = holds ? (par.ruler && A.realm(par.ruler) ? { law: F.LAWMAP[A.realm(par.ruler).law] || 'male-preference' } : F.houseLaw(par.house)) : null;
    if (holds && newGf && gf.alive) pastDeath(gf, Math.max(par.born + R2.adult, S.year - r.int(1, 12)), r.pick(CAUSES));
    // who may be born before the holder, and of which sex the holder's siblings may be
    const elderOk = sex => !holds || law.law === 'elective' || ((law.law === 'male-preference' || law.law === 'agnatic') && sex === 'F' && par.sex === 'M');
    const sexOk = sex => !(holds && par.sex === 'F' && (law.law === 'male-preference' || law.law === 'agnatic') && sex === 'M');

    // the parent's brothers and sisters
    const have = gf.children.filter(id => id !== par.id && A.P(id)).length;
    const want = Math.max(0, (paternal ? r.int(2, 4) : r.int(1, 4)) - have);
    const lo = gm.born + R2.adult, hi = Math.min(S.year - 1, gm.born + f1 + 4);
    const offices = (F.OFFICES[par.status] || []).filter(x => !out.offices.has(x));
    for (let i = 0; i < want; i++) {
      let sex = r.chance(0.5) ? 'M' : 'F';
      if (!sexOk(sex)) sex = 'F';
      let born = par.born + (r.chance(0.5) && elderOk(sex) ? -1 : 1) * r.int(1, 4 + 3 * i);
      born = Math.max(lo, Math.min(hi, born));
      if (born <= par.born && !elderOk(sex)) born = par.born + 1;
      if (born === par.born) born += 1;
      if (born > S.year - 1) break;
      const s = mk(sex, born, { house: par.house || null, parents: [gf.id, gm.id] });
      s.sur = surOf(sex, gf); s.surMode = par.surMode;
      gf.children.push(s.id); gm.children.push(s.id);
      A.link(pc, s, 'uncle', r.int(10, 65), 'nephew');
      A.link(par, s, 'sibling', r.int(10, 70), 'sibling');
      const age = S.year - s.born;
      if (r.chance(0.12)) { pastDeath(s, Math.min(S.year - 1, s.born + r.int(0, Math.max(0, Math.min(age - 1, 30)))), r.pick(age > 12 ? CAUSES : YOUNG)); continue; }
      oldDeath(s, s.born);
      if (!s.alive) continue;
      if (age >= R2.adult + 2 && r.chance(0.1)) { s.vows = true; s.occ = sex === 'F' ? 'sworn to the temple, a sister of the faith' : 'sworn to the temple, a brother of the faith'; continue; }
      if (age >= R2.adult + 4 && offices.length && r.chance(sex === 'M' ? 0.45 : 0.25)) {
        const o = offices.splice(r.int(0, offices.length - 1), 1)[0];
        out.offices.add(o); s.famOffice = o; s.occ = o;
      }
      if (age < R2.adult + 2 || !r.chance(0.8)) continue;
      // a spouse, and your cousins
      const sp = mk(sex === 'M' ? 'F' : 'M', s.born + r.int(-3, 3));
      const fn = famName(sp, sp.sex); sp.sur = fn.sur; sp.surMode = fn.mode;
      marry(s, sp);
      A.link(pc, sp, 'inlaw', r.int(5, 50), 'inlaw');
      const [fa, mo] = sex === 'M' ? [s, sp] : [sp, s];
      let by = Math.max(fa.born, mo.born) + R2.adult + r.int(2, 8);
      const last = Math.min(S.year - 1, mo.born + f1 + 2);
      for (let k = 0, n = r.int(1, 4); k < n && by <= last; k++) {
        const cs = r.chance(0.5) ? 'M' : 'F';
        const c = mk(cs, by, { house: fa.house || null, parents: [fa.id, mo.id] });
        const csur = fa === s ? surOf(cs, s) : (sp.surMode === 'patron' ? (cs === 'F' ? 'daughter of ' : 'son of ') + sp.given : sp.sur);
        c.sur = csur; c.surMode = fa === s ? par.surMode : sp.surMode;
        // a clan goes to the child by the law (playtest 2, new #9): through the mother where the crown goes to daughters
        if (fa.surMode === 'deed' && mo.surMode === 'deed' && F.clanThroughMother({ realm: par.realm, house: fa.house })) { c.sur = mo.sur; c.surMode = 'deed'; }
        fa.children.push(c.id); mo.children.push(c.id);
        A.link(pc, c, 'cousin', r.int(10, 70), 'cousin');
        if (r.chance(0.07)) pastDeath(c, Math.min(S.year - 1, c.born + r.int(0, 4)), r.pick(YOUNG));
        by += r.int(1, 4);
      }
    }
  }

  F.extendFamily = function (pc) {
    const fa = F.parentOf(pc, 'M'), mo = F.parentOf(pc, 'F');
    if (!pc || !fa || !mo) return [];
    const out = []; out.offices = new Set();
    F.sandbox('family', () => {
      const r = F.rng('family|' + pc.id);
      sideOf(pc, fa, true, r, out);
      sideOf(pc, mo, false, r, out);
    });
    for (const id of Object.keys(pc.rel || {})) F.fixOcc(A.P(id));
    pc.flags.v2_family = A.S.year;
    return out;
  };

  const ng = A.newGame;
  A.newGame = function (o) {
    o = Object.assign({}, o || {});
    // the release's "Place in the family" is gone: only a story's premise survives (and the release's own rule that a
    // half-elf or half-orc of a noble house is born on the wrong side of the blanket)
    o.order = F.storyOrder(o) || 'born';
    const pc = ng.call(this, o);
    try { const p = A.pc(); if (p && p.alive) F.extendFamily(p); } catch (e) { console.error('v2-family: family', e); }
    return pc;
  };
})();
