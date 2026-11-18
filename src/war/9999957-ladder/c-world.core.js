// D11-3: the world is not built around the player (order 54; D-126, revisiting D-120). Every company of the world has its
// role-holders (9999955-muster's seed men, one in three companies for each role, the player in place of his own) and its
// own drill (9999956-units: a company's grade read from its division's drill with its own difference, or stored when
// the player drills in it). Both now work in every company, in aggregate:
//   - morale at rest: a company's standard-bearer, signaller, cook, a horse company's farrier (9997's CO.restVal);
//   - the wounded kept from a battle's dead: the share of a battalion's companies with a surgeon's mate;
//   - a foraging party's bread and the land's anger: the share of the division's companies with a forager;
//   - a day's bread: a division with Quartermasters, and its clerks;
//   - holds on the ledger: provost's men, clerks, standard-bearers (9999952-men);
//   - an attack over a river: a division with Sappers, and its carpenters (999911-d9-ground);
//   - a battalion's drill in its family (9997's CO.drills, read by morale and the line battle): its own, not only the
//     division's.
// No man is simulated: a battalion's roles are a bitmask a company, worked out once from the ids and kept beside the
// record (a WeakMap, never in the state). A.LADDER.T.npc turns the world's part off (the measurement in D-126).
(function () {
  const L = A.LADDER, U = A.UNITS, MU = A.MUSTER;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  L.T.npc = true;
  // the roles' bits, built once from the data (no allocation in the daily pass)
  let IDL = null, BITS = null;
  const IDS = () => IDL || (IDL = MU.roles().map(r => r.id));
  const bit = k => { if (!BITS) { BITS = {}; IDS().forEach((id, j) => { BITS[id] = 1 << j; }); } return BITS[k] || 0; };
  const tplHas = (d, s) => { const t = A.tplOf ? A.tplOf(d) : null; return !!(t && (t.sup || []).includes(s)); };
  // the player's role, where it is: { div, b, ci, k } or null (read each call: a lookup, no allocation when he has none)
  let PR = { r: null, co: '', k: '', v: null };
  const pcRole = () => {
    const pc = A.pc && A.pc(), r = pc && pc.alive && pc.mil && !pc.mil.merc ? pc.mil.role : null;
    if (!r || !r.co) return null;
    if (r === PR.r && r.co === PR.co && r.k === PR.k) return PR.v;
    const p = r.co.split(':');
    PR = { r, co: r.co, k: r.k, v: { div: p[0], b: +p[1], ci: +p[2], k: r.k } };
    return PR.v;
  };
  // ---------------------------------------------------------------- the roles of a battalion's companies
  const MASKS = new WeakMap();
  L.masks = function (d, i) {
    const b = d && d.bs && d.bs[i];
    if (!b || !Array.isArray(b.k)) return [];
    let c = MASKS.get(b);
    if (!c || c.id !== d.id || c.i !== i || c.n !== b.k.length) {
      const ids = IDS();
      c = { id: d.id, i, n: b.k.length, m: b.k.map((_, ci) => { let mk = 0; ids.forEach((k, j) => { if (A.hash('rl:' + d.id + ':' + i + ':' + ci + ':' + k) % 3 === 0) mk |= 1 << j; }); return mk; }) };
      MASKS.set(b, c);
    }
    const P = pcRole();
    if (!P || P.div !== d.id || P.b !== i) return c.m;
    const m = c.m.slice();
    if (m[P.ci] != null) m[P.ci] |= bit(P.k);   // he holds it: the seed man is in the ranks
    return m;
  };
  L.has = (d, i, ci, k) => !!(L.masks(d, i)[ci] & bit(k));
  L.share = (d, i, k) => { const m = L.masks(d, i); if (!m.length) return 0; const b = bit(k); let n = 0; for (const x of m) if (x & b) n++; return n / m.length; };
  // a division's share of companies holding a role: kept beside the division (its battalions' count and the player's
  // role key are the inputs), so the daily bread and the ledger read it without walking the companies
  const DIVS = new WeakMap();
  L.divShare = function (d, k) {
    if (!d || !Array.isArray(d.bs) || !d.bs.length) return 0;
    const P = pcRole(), pk = P && P.div === d.id ? P.b + ':' + P.ci + ':' + P.k : '', n = d.bs.length;
    let c = DIVS.get(d);
    if (!c || c.n !== n || c.pk !== pk || c.id !== d.id) { c = { n, pk, id: d.id, v: {} }; DIVS.set(d, c); }
    if (c.v[k] == null) {
      if (k[0] === '#') c.v[k] = tplHas(d, k.slice(1)) ? 1 : 0;   // a support company of the template
      else { let s = 0; for (let i = 0; i < n; i++) s += L.share(d, i, k); c.v[k] = s / n; }
    }
    return c.v[k];
  };
  // a key for 9997's resting-value cache: what of the player's role touches this battalion
  U.roleKey = function (d, i) { const P = pcRole(); return P && P.div === d.id && P.b === i ? P.ci + ':' + P.k : ''; };

  // ---------------------------------------------------------------- the world's versions of D11-2's player-only effects
  const MORALE = { bearer: 4, signaller: 3, cook: 2 };
  const own = {};
  for (const k of ['roleMorale', 'woundF', 'forageF', 'forageUnrestF', 'eatF', 'ledgerHolds', 'crossF']) own[k] = U[k];
  const morOf = (d, i, mk) => {
    if (!mk) return 0;
    let v = 0;
    if (mk & bit('bearer')) v += MORALE.bearer;
    if (mk & bit('signaller')) v += MORALE.signaller;
    if (mk & bit('cook')) v += MORALE.cook;
    if (mk & bit('farrier') && GD.BN[d.bs[i].c] && GD.BN[d.bs[i].c].cat === 'horse') v += 3;
    return v;
  };
  U.roleMorale = function (d, i, ci) {
    if (!L.T.npc) return own.roleMorale(d, i);
    if (ci == null) ci = 0;
    // the seed men's part, kept with the record's masks; the player's battalion worked out each time
    const P = pcRole();
    if (!P || P.div !== d.id || P.b !== i) {
      let c = MASKS.get(d.bs[i]);
      if (!c || c.id !== d.id || c.i !== i || c.n !== d.bs[i].k.length) { L.masks(d, i); c = MASKS.get(d.bs[i]); }
      if (c) { if (!c.mor) c.mor = c.m.map(mk => morOf(d, i, mk)); return c.mor[ci] || 0; }
    }
    const mk = L.masks(d, i)[ci] || 0;
    if (!mk) return 0;
    let v = 0;
    if (mk & bit('bearer')) v += MORALE.bearer;
    if (mk & bit('signaller')) v += MORALE.signaller;
    if (mk & bit('cook')) v += MORALE.cook;
    if (mk & bit('farrier') && GD.BN[d.bs[i].c] && GD.BN[d.bs[i].c].cat === 'horse') v += 3;
    return v;
  };
  U.woundF = (d, i) => (L.T.npc ? 1 + .6 * L.share(d, i, 'surgeon') : own.woundF(d, i));
  U.forageF = d => (L.T.npc ? 1 + .7 * L.divShare(d, 'forager') : own.forageF(d));
  U.forageUnrestF = d => (L.T.npc ? 1 - .4 * L.divShare(d, 'forager') : own.forageUnrestF(d));
  U.eatF = function (d) {
    if (!L.T.npc) return own.eatF(d);
    return (L.divShare(d, '#quart') ? .9 : 1) * (1 - .1 * L.divShare(d, 'clerk'));
  };
  U.ledgerHolds = function (d) {
    if (!L.T.npc) return own.ledgerHolds(d);
    const out = [], p = L.divShare(d, 'provost'), c = L.divShare(d, 'clerk'), b = L.divShare(d, 'bearer');
    if (p > 0) out.push(['Provost\'s men who know every face', Math.round(.9 * p * 100) / 100, 'role']);
    if (c > 0) out.push(['Clerks who keep the pay roll true', Math.round(.6 * c * 100) / 100, 'role']);
    if (b > 0) out.push(['Their colours, carried well', Math.round(.45 * b * 100) / 100, 'role']);
    return out;
  };
  U.crossF = function (d, f) {
    if (!L.T.npc) return own.crossF(d, f);
    if (!(f < 1) || !d) return f;
    const w = Math.max(tplHas(d, 'eng') ? .4 : 0, .4 * L.divShare(d, 'carpenter'), own.crossF(d, f) > f ? .4 : 0);
    return 1 - (1 - f) * (1 - clamp(w, 0, .4));
  };

  // ---------------------------------------------------------------- a battalion's own drill (9997's CO.drills)
  // its stored grades when the player drills in it (the mean of its drills of that family's feed), else the division's
  // with the battalion's own difference by its seed (±8 on 100)
  const FEED = { shields: 'shields', charge: 'charge', weapons: 'weapons', formation: 'formation' };
  U.bnDrill = function (d, i, fam, base) {
    if (!L.T.npc) return base;
    const b = d.bs[i];
    if (b && b.dg) {
      let s = 0, n = 0;
      for (const id in b.dg) { const X = U.D(id); if (X && X.feeds === FEED[fam]) { s += b.dg[id]; n++; } }
      if (n) return clamp(Math.max(base, s / n), 0, 100);
    }
    return clamp(base + (A.hash('dr:' + d.id + ':' + i) % 17) - 8, 0, 100);
  };
})();
