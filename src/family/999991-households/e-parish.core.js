// C6 households, part 5: a parish of named commoners, held as seeds until met (docs/design/households.md, D-057;
// CRITIQUE F5, F6, P9).
//
// On day 0 four in five named people were noble or royal, and a commoner's "make a friend" minted a stranger at every
// click. Now each province is a parish: a priest, a reeve, a miller, a smith, an alewife, a midwife, a shepherd, a dozen
// neighbours and some of their children. A seed is a few numbers (role, sex, the year of birth) derived from the world's
// seed and the province: nothing is stored until one is met. A.PARISH.meet makes the full person on a stream of its own
// (the same person in every replay, whatever happened before) and keeps the id in A.S.parish.met. A commoner's
// acquaintance at home (A.makeAcquaintance: a friend, a playmate, a neighbour) is met from the parish first.
(function () {
  const F = A.V2F; if (!F || !F.rng || !F.sandbox) return;
  const PA = A.PARISH = A.PARISH || {};
  PA.EPOCH = 1105;   // the year every world begins (A.newState); seeds' ages count from it
  PA.COMMON = ['slave', 'serf', 'peasant', 'artisan', 'merchant'];
  PA.ROLES = [
    { k: 'priest', sex: 'M', age: [34, 66], status: 'artisan', occ: 'the parish priest' },
    { k: 'reeve', sex: 'M', age: [32, 60], status: 'peasant', occ: 'the reeve' },
    { k: 'miller', sex: 'M', age: [28, 62], status: 'artisan', occ: 'the miller' },
    { k: 'smith', sex: 'M', age: [24, 56], status: 'artisan', occ: 'the smith' },
    { k: 'alewife', sex: 'F', age: [24, 58], status: 'peasant', occ: 'the alewife' },
    { k: 'midwife', sex: 'F', age: [38, 66], status: 'peasant', occ: 'the midwife' },
    { k: 'shepherd', sex: null, age: [14, 50], status: 'peasant', occ: 'a shepherd' },
  ];
  PA.NEIGHBOURS = 12;
  PA.CHILDREN = 12;
  // the seeds of a province: pure, from the world's seed and the province's id
  PA.seeds = function (prov) {
    const r = F.rng('parish|' + prov), out = [];
    let i = 0;
    for (const R of PA.ROLES) out.push({ i: i++, k: R.k, sex: R.sex || (r.chance(0.5) ? 'M' : 'F'), born: PA.EPOCH - r.int(R.age[0], R.age[1]), status: R.status, occ: R.occ });
    for (let n = 0; n < PA.NEIGHBOURS; n++) out.push({ i: i++, k: 'neighbour', sex: r.chance(0.5) ? 'M' : 'F', born: PA.EPOCH - r.int(17, 64), status: r.chance(0.8) ? 'peasant' : 'artisan', occ: 'a neighbour' });
    // children of the parish, one born every other year around the world's first year, so a child of the parish has playmates
    for (let n = 0; n < PA.CHILDREN; n++) out.push({ i: i++, k: 'child', sex: r.chance(0.5) ? 'M' : 'F', born: PA.EPOCH - 12 + 2 * n + r.int(-1, 1), status: 'peasant', occ: '' });
    return out;
  };
  PA.state = function () {
    const S = A.S;
    if (!S.parish || typeof S.parish !== 'object') S.parish = {};
    if (!S.parish.met || typeof S.parish.met !== 'object') S.parish.met = {};
    return S.parish;
  };
  PA.key = (prov, i) => prov + ':' + i;
  PA.metId = (prov, i) => PA.state().met[PA.key(prov, i)] || null;
  // the seeds of a parish not met yet, alive by their age (a seed past seventy-five has died off the page)
  PA.unmet = function (prov) {
    const y = A.S.year, met = PA.state().met;
    return PA.seeds(prov).filter(s => !met[PA.key(prov, s.i)] && s.born <= y && y - s.born < 76);
  };
  // the person of a seed, made now (deterministic: the same seed gives the same person), recorded as met
  PA.make = function (prov, s, like) {
    const k = PA.key(prov, s.i);
    if (PA.state().met[k]) return A.P(PA.state().met[k]);
    const pr = A.S.prov && A.S.prov[prov];
    const realm = (pr && pr.owner) || (like && like.realm) || 'POL-01';
    const race = (like && like.race) || 'human', faith = (like && like.faith) || A.faithFor(race, realm);
    const q = F.sandbox('parish|' + k, () => {
      // C7 (D-058): a town's people are its realm's, and in a port, a market town or a border province some come from a
      // trade partner or the neighbour across the border (A.NAMES.originOf); they were all made like the player before
      const og = A.NAMES && A.NAMES.ok() ? A.NAMES.originOf(race, prov) : null;
      const cult = og ? og.cult : (like && like.cult) || A.cultureFor(race, realm), nrealm = og && og.realm ? og.realm : realm;
      const RR = GD.RACES[race] || GD.RACES.human, born = PA.EPOCH - Math.round((PA.EPOCH - s.born) * RR.adult / 16);
      const p = A.newPerson({ given: A.givenName(cult, s.sex, { realm: nrealm }), sex: s.sex, race, realm, cult, faith, born, status: s.status, home: prov });
      if (og && !og.home) p.org = og.realm;
      const fn = A.familyName({ cult, realm: nrealm, status: s.status, home: prov, sex: s.sex });
      if (fn) { p.sur = fn.sur; p.surMode = fn.mode; }
      p.occ = s.occ || (A.isAdult(p) ? A.occPick(s.status, p.sex) : 'a child of ' + A.provName(prov));
      p.flags.parish = prov;
      return p;
    });
    PA.state().met[k] = q.id;
    return q;
  };
  // meet one of the parish (by seed index): linked with the reason "parish" unless a scene is being played
  PA.meet = function (pc, prov, i, type, op) {
    const s = PA.seeds(prov).find(x => x.i === i); if (!s || !pc) return null;
    const q = PA.make(prov, s, pc);
    if (!pc.rel[q.id]) A.MEET.as((A.MEET && A.MEET.ev) || 'parish', () => A.link(pc, q, type || 'acquaint', op == null ? 10 : op, type || 'acquaint'));
    return q;
  };
  // A.makeAcquaintance (the release) asks here first: a commoner at home meets the parish, a child its children
  PA.acquaint = function (pc, kind, child) {
    if (!pc || !PA.COMMON.includes(pc.status) || pc.home == null) return null;
    const y = A.S.year, age = y - pc.born, RR = GD.RACES[pc.race] || GD.RACES.human;
    const myAdj = age * 16 / RR.adult;   // seeds count human years; the pc's race ages by its own clock
    const cand = PA.unmet(pc.home).filter(s => {
      const a = y - s.born;
      if (child) return Math.abs(a - myAdj) <= 2;
      return a >= 14 && Math.abs(a - Math.max(16, myAdj)) <= (kind === 'friend' || kind === 'bestfriend' || kind === 'lover' ? 8 : 16);
    });
    if (!cand.length) return null;
    return PA.make(pc.home, A.pick(cand), pc);
  };
})();
