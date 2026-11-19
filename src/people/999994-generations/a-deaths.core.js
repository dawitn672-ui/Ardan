// The unknown die (D-107; X5 found it, D-106). An NPC died of his years only if he ruled a realm (A.worldYear), the
// player knew him (A.familyYear) or he held a title (A.V2N.yearOfDeaths); every other person (officials, members of the
// great houses, kin the player never met, craftsmen of a town) aged for ever: 1,023 of 1,669 living people at year 100
// were past their people's greatest age, the oldest human 185. Owner's rule 1: nothing without reason; everyone ages and
// dies by his body and his circumstances.
//
// Each New Year, after the release's passes and the court's (A.onYear), every living NPC those passes do not cover
// meets the release's own odds for his body (A.deathChance: his age against his people's span, his health, a blood
// that shortens life), raised by the year just past where the game knows it: an epidemic in his home province (57's
// S.prov[].plague), a failed harvest in his realm (its market's harvest, as 57's record reads a famine), more for the poor in a famine. Anyone, covered
// or not (the player apart), who has passed his people's greatest age (GD.RACES[race].maxLife) dies of it: the body ends.
//
// The draw is from a stream seeded by the year and the person (A.V2F.rng, as V2N.yearOfDeaths), and the death runs in a
// sandbox (A.V2F.sandbox), so the game's own stream does not move and the order of the people does not matter. The death
// goes through A.kill, so posts are left (A.POSTS.leaveAll), a widow is a widow, a ruler's realm passes (A.rulerDies),
// titles and the house's headship pass by the house's law (A.V2F.inherit), and the family tree keeps the dead.
// A blood relative of the player within two steps whom he never met (a grandparent, an uncle, a nephew: the tree's
// kin, not his acquaintances) is told in the year's story as a line; one of the household is caught by 999995-next-year's
// digest as "A death in the household", which never stops a year (the time rule, D-062).
// MORT.OFF stops it (the tests compare).
(function () {
  const F = A.V2F; if (!F || !F.rng || !F.sandbox) return;
  const M = A.MORT = A.MORT || {};
  M.PLAGUE = 1.8;            // an epidemic in his home province in the year past
  M.FAMINE = { low: 1.4, mid: 1.2, high: 1.05 };   // a failed harvest in his realm, by estate
  M.KIN_TOLD = 2;            // blood kin within this many steps, unmet, are told
  M.stats = { died: 0, aged: 0, told: 0, years: 0 };
  const LOW = new Set(['serf', 'slave', 'peasant']), HIGH = new Set(['noble', 'royal', 'gentry']);
  const CAUSE_AGE = ['old age', 'old age, in sleep', 'a failing heart', 'the weight of years'];

  // a person's greatest age: his people's (GD.RACES[race].maxLife). The lore begins the world in 1105 with a few already past
  // it (Queen Ithrien of Sylvaran at 587, an elf's span being 520): they meet the release's own odds past the span (0.6 a
  // year, A.deathChance) and the body's end ELDER_GRACE years on, so the world opens as the lore wrote it
  M.YEAR0 = 1105; M.ELDER_GRACE = 10;
  M.maxLife = p => {
    const R = GD.RACES[p.race], span = R && R.maxLife ? R.maxLife : 100, at0 = M.YEAR0 - p.born;
    return at0 > span ? at0 + M.ELDER_GRACE : span;
  };
  M.pastSpan = p => !!(p && p.alive && A.age(p) > M.maxLife(p));

  // the lore's members of a house first met long after 1105 (A.famMembers) are as old as the lore's birth years make them:
  // one already past his span died before the story reached the house, of his years, at his people's usual span
  M.lateBorn = function (ids) {
    for (const id of ids || []) {
      const p = A.P(id); if (!M.pastSpan(p)) continue;
      const R = GD.RACES[p.race] || GD.RACES.human;
      p.alive = false; p.died = Math.min(A.S.year - 1, p.born + (R.life || 62)); p.cause = 'old age';
    }
  };
  // who the older passes already weigh: the rulers, the player's acquaintances, the court's title holders
  M.covered = function () {
    const S = A.S, pc = A.pc(), out = new Set();
    if (pc) { out.add(pc.id); for (const id in pc.rel || {}) out.add(id); }
    for (const id in S.realms) { const r = S.realms[id]; if (r && r.alive && r.ruler) out.add(r.ruler); }
    const N = A.V2N;
    if (S.court && N && N.holderOf) for (const c of Object.values(S.court.realms || {})) for (const t of c.titles || []) {
      if (t.crown || t.heldWith || t.rank === 'king') continue;
      const h = N.holderOf(t); if (h) out.add(h.id);
    }
    return out;
  };
  // the year just past, where the game knows it: provinces with an epidemic, realms with a failed harvest
  M.hardYear = function () {
    const S = A.S, y = S.year - 1, plague = new Set(), famine = new Set();
    for (const P of S.prov || []) if (P && P.plague === y) plague.add(P.id);
    // a failed harvest is read from the realm's own market (45-economy's June roll, r.mkt.hv), by the rule 57's record
    // writes a famine with (a yield of 0.4 or less), not from the record: the record observes and never acts
    // (wcObservesOnly). M1: on the one continent a famine at seed 9090 made the world with the record differ from the
    // world without it. The market is read, never made (A.mkt would make one).
    for (const id in S.realms || {}) {
      const r = S.realms[id], m = r && r.mkt;
      if (r && r.alive !== false && !r.isRebel && m && m.hv && m.hv.y === y && m.hv.f <= 0.4) famine.add(id);
    }
    return { plague, famine };
  };
  // the odds for one person this year, and what they come of
  M.odds = function (p, hard) {
    let q = A.deathChance(p), plague = false, famine = false;
    if (hard.plague.has(p.home)) { q *= M.PLAGUE; plague = true; }
    if (hard.famine.has(p.realm)) { q *= LOW.has(p.status) ? M.FAMINE.low : HIGH.has(p.status) ? M.FAMINE.high : M.FAMINE.mid; famine = true; }
    return { q: Math.min(0.95, q), plague, famine, base: A.deathChance(p) };
  };
  const causeOf = (p, o, r) => {
    if (o.plague && r.next() < 1 - o.base / Math.max(o.q, 1e-9)) return 'the sickness that came to ' + (A.provName ? A.provName(p.home) : 'his town');
    if (o.famine && r.next() < 0.5 * (1 - o.base / Math.max(o.q, 1e-9))) return 'the hunger of a failed harvest';
    return null;
  };

  // tell the player of a near blood relative he never met
  M.tell = function (p) {
    const pc = A.pc(); if (!pc || !pc.alive || !F.kinOf) return false;
    let k = null; try { k = F.kinOf(pc, p); } catch (e) { k = null; }
    if (!k || !k.term || !(k.degree <= M.KIN_TOLD) || k.line === 'affinal') return false;
    A.log(`Word comes that your ${k.term}, ${A.fullName(p, false)}, has died, aged ${A.age(p)}, of ${p.cause}.`, '');
    M.stats.told++;
    return true;
  };

  // agedOnly (each month): only the body's end, for anyone made during the year already past his span (a house's lore
  // members met late, a lore figure brought in): no one walks past it until the next New Year
  M.year = function (agedOnly) {
    const S = A.S; if (M.OFF || !S || !S.people) return [];
    const pc = A.pc(), covered = agedOnly ? null : M.covered(), hard = agedOnly ? null : M.hardYear(), out = [];
    const salt = agedOnly ? `mortm|${S.year}|${A.absDay ? A.absDay() : 0}` : `mort|${S.year}`;
    if (!agedOnly) M.stats.years++;
    for (const id of Object.keys(S.people)) {
      const p = S.people[id];
      if (!p || !p.alive || id === S.pc) continue;
      const aged = M.pastSpan(p);
      if (!aged && (agedOnly || p.npcTemp || covered.has(id))) continue;
      const r = F.rng(`${salt}|${id}`);
      let cause = null;
      if (aged) cause = CAUSE_AGE[Math.floor(r.next() * CAUSE_AGE.length)];
      else {
        const o = M.odds(p, hard);
        if (!(r.next() < o.q)) continue;
        cause = causeOf(p, o, r);
      }
      F.sandbox(`${salt}|${id}`, () => {
        A.kill(p, cause || (A.naturalCause ? A.naturalCause(p) : 'a fever'));
        if (!p.alive && pc && !(pc.rel && pc.rel[id])) M.tell(p);
      });
      if (!p.alive) { out.push(id); M.stats.died++; if (aged) M.stats.aged++; }
    }
    return out;
  };
  (A.onYear = A.onYear || []).push(function () { try { M.year(); } catch (e) { console.error('mortality', e); } });
  (A.onMonth = A.onMonth || []).push(function () { try { M.year(true); } catch (e) { console.error('mortality (month)', e); } });

  // the check: no one but the player outlives his people's greatest age (held at 0, tests/coherency-baseline.json)
  if (A.COHERENCY && A.COHERENCY.add) A.COHERENCY.add('alive past the greatest age', () => {
    const S = A.S, out = [];
    for (const id in S.people) { const p = S.people[id]; if (id !== S.pc && M.pastSpan(p) && out.length < 12) out.push(`${p.given} (${id}), ${p.race}, aged ${A.age(p)} (greatest age ${M.maxLife(p)})`); }
    return out;
  }, { owner: 'src/people/999994-generations' });
})();
