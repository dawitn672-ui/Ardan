// W1-4 "conscripts, not a yearly tax of men" (docs/design/war.md §10.1, §10.3, §10.5; D-064 point 7; D-086): three kinds of men.
//
//   sworn men      knights, men-at-arms, a lord's retinue: about 1 in 400 of the people, always under arms, part of the
//                  standing men. They hold by an oath and do not desert (they can be forsworn).
//   enlisted men   the regiments a treasury pays for (the war map's divisions, trained and refitted from the roll) and the
//                  roll itself: about 1 in 100 of the people, volunteers who keep their arms, drill some days a year and
//                  march when mustered (r.roll, the old pool's field).
//   conscripts     nothing in peace. Taken by lot, by proclamation, for a named need (c-calls.core.js); conscript foot
//                  in their lord's contingent while the call lasts (d.call), then home.
// r.army stays the war map's count of men under arms (A.forcesSync): standing men plus any conscripts of an open call.
// A.MEN reads the three kinds; nothing here draws a die.
(function () {
  const M = A.MEN = A.MEN || {};
  M.T = Object.assign({
    SWORN: 1 / 400,     // sworn men a head of the people
    ROLL: 1 / 100,      // the roll a head of the people
    HEARTH: 5.5,        // people to a hearth
    WORK: 0.3,          // working men a head of the people (men of fighting age)
  }, M.T || {});
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  // the people of a realm (the provinces' count, as the war map keeps it)
  M.pop = function (r) {
    r = typeof r === 'string' ? A.realm(r) : r;
    if (!r) return 0;
    if (r.provPop > 0) return r.provPop;
    let n = 0;
    for (const P of A.realmProvs(r.id)) n += P.pop || 0;
    return n;
  };
  M.hearths = r => Math.round(M.pop(r) / M.T.HEARTH);
  M.working = r => Math.round(M.pop(r) * M.T.WORK);
  M.isConscript = d => !!(d && d.call);
  // a division's kind of men, read from what it is: an order or a guard, or mostly knights and men-at-arms, are sworn;
  // conscript foot of an open call are conscripts; the rest are enlisted regiments
  const SWORN_BN = { HC: 1, EA: 1 };
  M.kindOf = function (d) {
    if (!d) return 'enlisted';
    if (d.call) return 'conscript';
    if (d.elite) return 'sworn';
    const t = A.tplOf ? A.tplOf(d) : null;
    if (t && t.kind === 'guard') return 'sworn';
    const bns = (t && t.bns) || [];
    if (bns.length && bns.filter(c => SWORN_BN[c]).length * 2 > bns.length) return 'sworn';
    return 'enlisted';
  };
  // the three kinds in a realm: { sworn, enlisted, roll, conscripts, standing, waiting }
  M.of = function (r) {
    r = typeof r === 'string' ? A.realm(r) : r;
    if (!r) return null;
    let cons = 0;
    for (const d of (r.forces && r.forces.divs) || []) if (d && d.call) cons += d.men || 0;
    const standing = Math.max(0, (r.army || 0) - cons);
    const sworn = Math.min(standing, Math.round(M.pop(r) * M.T.SWORN));
    const waiting = A.CALLS && A.CALLS.waiting ? A.CALLS.waiting(r.id) : 0;
    return { sworn, enlisted: standing - sworn, roll: Math.round(r.roll || 0), conscripts: cons + waiting, standing, waiting };
  };
  // what the roll can be: one man in a hundred, more under the doctrine of a nation in arms (the old pool's +20%)
  M.rollCap = function (r) {
    const D = A.rdoc ? A.rdoc(r) : {};
    return Math.round(M.pop(r) * M.T.ROLL * (1 + (D.mp || 0)));
  };
  // what a realm could put in the field if it had to: its roll, and the conscripts its own law lets the crown call on
  // its word (the first call under the estates' leave, the second by custom, the last by the crown's right). Read where
  // the release reckoned "army + a share of the pool" as a realm's weight (its strength, a faction's share of the swords,
  // a campaign's numbers), so a realm weighs about what it did when its pool was the old, fuller one (about one in twenty).
  M.reserve = function (r) {
    r = typeof r === 'string' ? A.realm(r) : r;
    if (!r) return 0;
    const law = r.laws && r.laws.conscript != null ? r.laws.conscript : 1;
    const CALLS = A.CALLS && A.CALLS.DEG;
    const share = CALLS ? CALLS[clamp(law, 0, 2)].share : [0.03, 0.06, 0.12][clamp(law, 0, 2)];
    return Math.round((r.roll || 0) + M.working(r) * share);
  };

  // a new world: the lore's pools were the old pool (about one in twenty); the roll is one in a hundred
  M.fitRoll = function (r) {
    if (!r || r.alive === false) return;
    const cap = M.rollCap(r);
    if (!(r.roll >= 0)) r.roll = cap;
    if (r.roll > cap) r.roll = cap;
    r.rollCap = cap;
    r.roll0 = cap;
  };
  A.on && A.on('worldInit', function () {
    try { for (const id of Object.keys(A.S.realms || {})) M.fitRoll(A.S.realms[id]); } catch (e) { console.error('[men] roll', e); }
  });

  // an old save (a-convert.core.js marks it S.menOld): the pool becomes the roll (no more than one in a hundred), and a
  // host of conscript foot in the field becomes conscript foot of a call for its war's need, or goes home at peace (D-086)
  M.convert = function () {
    const S = A.S;
    if (!S || !S.menOld) return;
    delete S.menOld;
    let home = 0, kept = 0;
    for (const id of Object.keys(S.realms || {})) {
      const r = S.realms[id];
      if (!r || r.alive === false) continue;
      if (r.laws && r.laws.conscript == null) r.laws.conscript = 1;
      M.fitRoll(r);
      if (!r.forces || !Array.isArray(r.forces.divs)) continue;
      const old = r.forces.divs.filter(d => d && !d.call && !d.elite && A.tplOf && A.tplOf(d) && (A.tplOf(d).bns || []).length && A.tplOf(d).bns.every(c => c === 'LV'));
      if (!old.length) continue;
      const war = A.atWar(id)[0];
      const call = war && A.CALLS ? A.CALLS.adopt(r, war, old) : null;
      if (call) { kept += old.length; continue; }
      for (const d of old) { home += d.men || 0; if (A.CMD && A.CMD.withdraw) A.CMD.withdraw(d); A.divRemove(d); }
      A.forcesSync(r);
    }
    M.lastConvert = { home, kept };
    // the posts registry was built from the hosts as they were; read it again so that a second load finds it settled
    if ((home || kept) && A.POSTS && A.POSTS.sync) { try { A.POSTS.sync('load'); } catch (e) { console.error('[men] posts', e); } }
  };
  const des = A.deserialize;
  if (des) A.deserialize = function () {
    const out = des.apply(this, arguments);
    try { M.convert(); } catch (e) { console.error('[men] convert', e); }
    try { if (A.CALLS && A.CALLS.gate) A.CALLS.gate(); } catch (e) { console.error('[men] gate', e); }
    return out;
  };
})();
