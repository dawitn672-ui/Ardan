// D11-1 "the muster" (docs/design/war.md §14.1, §14.3, §16; D-012, D-064 point 16; D-110 to D-115): the branches and
// roles as data, and the words for a soldier's place.
//
// data/military/branches.json is on the page as A.DATA['military/branches'] and roles.json as A.DATA['military/roles']
// (tools/build.mjs). Here they are read: a branch by its id, the branch a war-map troop belongs to (an old save's soldier
// has a troop and no branch), the troop a branch fills in a realm, and the one glossary of rank and unit words (R14).
// Pure readings; nothing here draws or writes the state.
(function () {
  const MU = A.MUSTER = A.MUSTER || {};
  const DB = () => (A.DATA && A.DATA['military/branches']) || { branches: [], ranks: [], ways: {} };
  const DR = () => (A.DATA && A.DATA['military/roles']) || { roles: [] };
  let IX = null;
  const index = () => {
    const d = DB(), r = DR();
    if (IX && IX.d === d && IX.r === r) return IX;
    const b = new Map(), t = new Map(), ro = new Map();
    for (const x of d.branches || []) { b.set(x.id, x); for (const c of x.troops || []) if (!t.has(c)) t.set(c, x.id); }
    for (const x of r.roles || []) ro.set(x.id, x);
    IX = { d, r, b, t, ro };
    return IX;
  };
  MU.branches = () => DB().branches || [];
  MU.B = id => index().b.get(id) || null;
  MU.roles = () => DR().roles || [];
  MU.R = id => index().ro.get(id) || null;
  MU.ways = () => DB().ways || {};
  MU.ranks = () => DB().ranks || [];

  // ---------------------------------------------------------------- troops and branches
  // the branch a war-map troop belongs to; the few troops no branch lists (beasts) read as the nearest
  const EXTRA = { GI: 'foot_men_at_arms', EL: 'lances' };
  MU.branchOfTroop = c => index().t.get(c) || EXTRA[c] || 'spears';
  // the player's branch: his own (set at the muster), else read from what an old save left him
  MU.branchOf = function (pc) {
    const m = pc && pc.mil;
    if (!m) return null;
    if (m.branch && MU.B(m.branch)) return m.branch;
    if (m.call) return 'conscripts';
    return MU.branchOfTroop(m.troop);
  };
  // does a realm hold a coast (a Map by realm, rebuilt with the year)
  let CX = null;
  MU.coast = function (rid) {
    const S = A.S;
    if (!S || !rid) return false;
    if (!CX || CX.S !== S || CX.y !== S.year) CX = { S, y: S.year, m: new Map() };
    if (CX.m.has(rid)) return CX.m.get(rid);
    let c = false;
    for (const p of S.prov || []) if (p && p.owner === rid && p.coast) { c = true; break; }
    CX.m.set(rid, c);
    return c;
  };
  // the troop a branch fills in a realm: the first of its troops the realm raises, else its first (a ships' company
  // in a realm with a coast is marines even where the doctrine names none), else spears
  MU.troopIn = function (b, rid) {
    const B = typeof b === 'string' ? MU.B(b) : b;
    if (!B) return 'SP';
    const av = A.wsTroopsFor ? A.wsTroopsFor(rid || 'unclaimed') : Object.keys(GD.TROOPS || {});
    for (const c of B.troops || []) if (av.includes(c) && GD.TROOPS[c]) return c;
    if (B.id === 'ships' && GD.TROOPS.MR) return 'MR';
    for (const c of B.troops || []) if (GD.TROOPS[c]) return c;
    return 'SP';
  };
  // the arm of service (the release's GD.ARMS) a branch belongs to: fixed at the muster, so the old card that asked a
  // sergeant a year on "where he belongs" is not asked
  MU.armOf = b => { const B = MU.B(b); return B && GD.ARMS && GD.ARMS[B.arm] ? B.arm : 'line'; };

  // ---------------------------------------------------------------- the one glossary of rank and unit words (R14)
  // GD.MIL's eight grades read as five ranks (W1-1): 0 soldier; 1, 2 sergeant (a section); 3, 4 captain (a company);
  // 5 commander (a wing); 6 General (a host); 7 General (an army by the king's commission)
  MU.rankIdx = g => (g <= 0 ? 0 : g <= 2 ? 1 : g <= 4 ? 2 : g <= 5 ? 3 : 4);
  MU.unitOfGrade = g => (g >= 7 ? 'army' : (MU.ranks()[MU.rankIdx(g)] || {}).unit || 'section');
  const sumK = rec => (rec && Array.isArray(rec.k) ? rec.k.reduce((a, x) => a + (x || 0), 0) : 0);
  // what the player leads, read from the post he holds: the host he commands, the wing (a battalion's senior captain's
  // slot) or the company he captains; else his rank's unit at its usual size. Every panel that says "leads" reads this.
  MU.post = function (pc) {
    const m = pc && pc.mil;
    if (!m) return null;
    const g = Math.max(0, Math.min(7, m.rank | 0)), R = MU.ranks(), ri = MU.rankIdx(g);
    const d = m.div && A.divById ? A.divById(m.div) : null;
    const held = A.POSTS && A.POSTS.held ? A.POSTS.held(pc.id) : [];
    const mine = A.CO && A.CO.mine ? A.CO.mine(pc) : null;
    const unit = g === 0 ? '' : MU.unitOfGrade(g);
    let men = (R[ri] || {}).men || 1, by = 'rank';
    if (g >= 7) {
      const a = m.army && A.S.armies ? A.S.armies.find(x => x.id === m.army) : null;
      const n = a && A.armyMen ? A.armyMen(a) : 0;
      if (n > 0) { men = n; by = 'army'; } else if (d) { men = d.men || 0; by = 'host'; }
    } else if (g === 6) {
      if (d) { men = d.men || 0; by = d.cmd === pc.id ? 'host' : 'rank'; }
    } else if (g === 5) {
      if (mine && held.includes(`bn:${mine.d.id}:${mine.b}`)) { men = sumK(mine.rec); by = 'wing'; }
    } else if (g >= 3) {
      if (mine && held.includes(`coy:${mine.d.id}:${mine.b}:${mine.i}`)) { men = (mine.rec.k && mine.rec.k[mine.i]) || 0; by = 'company'; }
    } else if (g === 0) men = 1;
    const B = MU.B(MU.branchOf(pc));
    return { grade: g, rank: A.rankLabel ? A.rankLabel(g) : GD.MIL[g].title, word: (GD.MIL[g] || {}).title || 'Soldier', unit, men: Math.max(1, Math.round(men)), by, branch: B ? B.id : null, short: B ? B.short : '' };
  };
  MU.leads = pc => { const P = MU.post(pc); return P ? P.men : 0; };
  // "a company of 198 men of the bows": the post in one phrase
  MU.postWords = function (pc) {
    const P = MU.post(pc);
    if (!P) return '';
    if (!P.unit) return `${P.word} of ${P.short || 'the line'}`;
    const art = /^[aeiou]/.test(P.unit) ? 'an' : 'a';
    return `${P.word}: ${art} ${P.unit} of ${A.fmt ? A.fmt(P.men) : P.men}${P.short ? ', ' + P.short : ''}`;
  };
})();
