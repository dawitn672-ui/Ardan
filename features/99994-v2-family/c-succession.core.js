// v2 family, part 3: succession by house law, one holder per title (docs/v2/V2_SPEC.md complaint 14;
// src/v2/succession.js).
//
// The release had no house law. A house's headship went to the dead head's eldest living son (A.kill), a daughter only
// when there was no son, and nobody at all when there were no children, whatever the house; a crown followed the
// realm's male/equal/female sort over the ruler's children, then grandchildren only if no child lived, then siblings.
// Now every house has a law (A.V2.succession: male-preference, absolute, agnatic, seniority or elective, and for some
// houses "pass over the unfit"), derived from the game's seed and the house's id (no draw from the game's stream, no
// stored field: the same house always has the same law). A royal house's law is its realm's (male -> male-preference,
// equal -> absolute; v2 has no female-preference, so female -> absolute). The line is A.V2.succession's: depth first
// through the holder's children, then the siblings' lines, then the cousins'.
//
// Titles in this game: a crown (r.ruler), a house's headship (h.headPid, with h.seat) and a lordship of a province
// (p.noble with rung >= 4 and a holding). They move only in F.inherit():
//   - at a death (A.kill is wrapped): every headship the dead held passes down the house's line; a lordship the dead
//     held passes with the headship, or to the first of the line;
//   - when a life goes on as an heir (A.continueAs, patch V2F-CONTINUE): the lordship passes by the law, to the heir
//     you continue as only if the law names them;
//   - A.inheritFrom no longer moves anything (patch V2F-INHERITFROM): the death has already moved it.
// A grant of a lordship (a ruler's grant, a petition, a patent, 994's enfeoffment, 9996's forfeit lands) is a new title
// and takes a province no one else holds (F.freeHolding): never a realm's capital, never the seat of a great house with
// a living head, never another lord's holding. F.audit() lists every title with two holders; test.mjs runs it.
(function () {
  const V = A.V2, F = A.V2F; if (!V || !F || !V.succession) return;
  const SU = V.succession;
  F.LAWS = SU.LAWS;
  F.LAWMAP = { male: 'male-preference', equal: 'absolute', female: 'absolute' };

  const live = p => !!(p && p.alive);
  F.royalRealmOf = function (hid) {
    for (const id in A.S.realms) { const r = A.S.realms[id]; if (r && r.alive !== false && r.house === hid && r.gov === 'hereditary') return r; }
    return null;
  };
  // the house's law: { law, fitness } (pure: derived, never stored)
  F.houseLaw = function (hid) {
    const h = A.S.houses && A.S.houses[hid];
    const base = SU.makeHouseLaw(F.rng('law|' + hid));
    if (!h) return base;
    const r = F.royalRealmOf(hid);
    if (r) return { law: F.LAWMAP[r.law] || 'male-preference', fitness: base.fitness };
    return base;
  };
  F.lawText = function (L) {
    const l = SU.LAWS[L.law];
    return l ? `${l.name}: ${l.text}${L.fitness === 'unfit-passed-over' ? ' The house council may pass over an heir it judges unfit.' : ''}` : '';
  };
  // judged simple by the house council (succession.js unfitReason): slow wits and poor judgment both
  F.simple = p => !!(p && p.pot && (p.pot.int || 0) < 24 && (p.pot.wil || 0) < 26 && A.age(p) >= 14);
  // the house elders' measure of a candidate (succession.js elective)
  F.ability = p => (p.pot ? (p.pot.int || 0) + (p.pot.wil || 0) + (p.pot.ins || 0) : 120) + (p.fame || 0) * 0.5;
  // what someone holds, in words (for the family view and the v2 records)
  F.titlesOf = function (p) {
    const out = [];
    if (!p) return out;
    if (p.ruler && A.realm(p.ruler) && A.realm(p.ruler).ruler === p.id) out.push(`${(A.realm(p.ruler).title || 'Ruler').split(' / ')[0]} of ${A.realm(p.ruler).short || A.realm(p.ruler).name}`);
    const h = p.house && A.S.houses[p.house];
    if (h && h.headPid === p.id) out.push(`Head of ${h.name}`);
    if (p.noble && A.nobleTitle) { const t = A.nobleTitle(p); if (t) out.push(t); }
    return out;
  };

  // the line for a holder under a law; entries are game people
  F.line = function (holder, law, limit) {
    if (!holder) return { line: [], skipped: [], law: null };
    const P = F.people(), h = P.of(holder);
    if (!h) return { line: [], skipped: [], law: null };
    // elective: v2 ranks by ability (succession.js reads p.ability when it is given)
    if (law && law.law === 'elective') for (const x of P.all()) if (x.house === h.house) x.ability = F.ability(x.game);
    const L = SU.lineOfSuccession(P, h, law, A.S.year, limit || 6);
    return { law: L.law, fitness: L.fitness, line: L.line.map(e => ({ p: e.person.game, why: e.why })), skipped: L.skipped.map(e => ({ p: e.person.game, why: e.why })) };
  };
  // the head of a house: its living head, or for a royal house its realm's ruler
  F.headOf = function (hid) {
    const h = A.S.houses[hid]; if (!h) return null;
    const hd = h.headPid && A.P(h.headPid);
    if (live(hd)) return hd;
    const r = F.royalRealmOf(hid), ru = r && A.P(r.ruler);
    return live(ru) ? ru : null;
  };
  F.houseLine = function (hid, limit) {
    const h = A.S.houses[hid], head = h && F.headOf(hid);
    if (!head) return { line: [], skipped: [], law: null, head: null };
    return Object.assign(F.line(head, F.houseLaw(hid), limit), { head });
  };
  // where p stands in a house's line, in one sentence (succession.js myPlace)
  F.placeIn = function (p, hid) {
    const h = A.S.houses[hid], head = h && F.headOf(hid);
    if (!h || !head) return null;
    if (head.id === p.id) return { place: 0, text: `You are head of ${h.name}.` };
    const P = F.people(), law = F.houseLaw(hid);
    if (law.law === 'elective') for (const x of P.all()) if (x.house === hid) x.ability = F.ability(x.game);
    const hh = P.of(head); hh.titles = [h.name];
    const r = SU.myPlace(P, P.of(p), hh, law, A.S.year);
    return { place: r.place, text: r.text, line: r.line.map(e => e.person.game) };
  };

  // ---- the one mover -----------------------------------------------------------------------------------------------
  const seatProv = h => {
    if (h.seatId) { const q = A.S.prov.find(x => x.pid === h.seatId); if (q) return q.id; }
    if (h.seat) { const q = A.S.prov.find(x => x.name === h.seat && (!h.realm || x.owner === h.realm)); if (q) return q.id; }
    return null;
  };
  F.seatProv = seatProv;
  // with a court (99995-v2-nobility) only a house of title rank (duke, marquis, count) holds its seat's county: a lesser
  // house seated there holds a viscounty, barony or manor under that county's count
  const greatLanded = h => h && h.great !== false && h.rung && (A.S && A.S.court ? /^N0[123]$/ : /^N/).test(h.rung) && seatProv(h) != null;

  function giveHeadship(h, to, from) {
    h.headPid = to ? to.id : null;
    const pc = A.pc();
    if (to && pc && to.id === pc.id && pc.alive) {
      A.log(`You are now head of ${h.name}${from ? `, after ${from.given}` : ''}, by ${(SU.LAWS[F.houseLaw(h.id).law] || {}).name || 'the law of the house'}.`, 'big');
      if (h.rung && h.rung[0] === 'N' && A.rungIndex && (!pc.noble || pc.noble.rung < A.rungIndex(h.rung))) {
        // with a court (99995-v2-nobility) a lesser house's seat lies inside a count's county: its head holds a viscounty,
        // barony or manor there (A.V2N.grantFief), not the county
        const sp = A.S.court && !/^N0[123]$/.test(h.rung) ? null : seatProv(h);
        pc.noble = { rung: A.rungIndex(h.rung), realm: h.realm || pc.realm, holding: sp != null ? sp : A.S.court ? null : pc.home };
        if (sp == null && A.V2N && A.V2N.grantFief) A.V2N.grantFief(pc);
        A.log(`With it comes the rung of ${A.nobleTitle(pc)}.`, 'big');
      }
    }
  }
  function giveLordship(dead, to) {
    if (!dead.noble || dead.noble.rung < 2 || !to) return;
    if (to.noble && to.noble.rung >= dead.noble.rung) { dead.noble.passed = to.id; return; }
    to.noble = Object.assign({}, dead.noble); delete to.noble.passed;
    dead.noble.passed = to.id;
    const pc = A.pc();
    if (pc && to.id === pc.id && pc.alive) A.log(`You inherit ${dead.given}'s rung: you are now ${A.nobleTitle(pc)}.`, 'big');
  }
  // F.inherit(dead): at a death, every title moves down its line. F.inherit(old, heir): a life goes on as `heir`.
  F.inherit = function (from, heir) {
    const moved = [];
    if (!from) return moved;
    const S = A.S, h = from.house && S.houses[from.house];
    const lawOf = () => (h ? F.houseLaw(h.id) : { law: 'male-preference', fitness: 'none' });
    const first = (L, but) => (L.line.find(e => live(e.p) && (!but || e.p.id !== but.id)) || {}).p || null;
    if (heir === undefined) {
      if (h && (h.headPid === from.id || h._v2head === from.id)) {
        delete h._v2head;
        const L = F.line(from, lawOf(), 3), next = first(L);
        giveHeadship(h, next, from);
        moved.push({ k: 'house', id: h.id, to: next ? next.id : null });
        if (next) giveLordship(from, next);
      } else if (from.noble && from.noble.rung >= 2 && !from.noble.passed) {
        const L = F.line(from, lawOf(), 3), next = first(L);
        if (next) { giveLordship(from, next); moved.push({ k: 'lordship', to: next.id }); }
      }
      return moved;
    }
    // a life goes on as `heir`: the lordship goes where the law sends it
    if (from.noble && from.noble.rung >= 2 && !from.noble.passed) {
      const L = F.line(from, lawOf(), 4), next = first(L) || heir;
      giveLordship(from, next);
      if (next.id !== heir.id) A.log(`By ${(SU.LAWS[lawOf().law] || {}).name || 'the law'}, ${A.fullName(next)} inherits ${from.given}'s rung, not you.`, 'muted');
      moved.push({ k: 'lordship', to: next.id });
    }
    return moved;
  };

  const kill = A.kill;
  A.kill = function (p) {
    const was = !!(p && p.alive), h = was && p.house && A.S.houses[p.house];
    if (h && h.headPid === p.id) h._v2head = p.id;
    const r = kill.apply(this, arguments);
    try { if (was && !p.alive) F.inherit(p); else if (h) delete h._v2head; } catch (e) { console.error('v2-family inherit', e); }
    return r;
  };

  // a crown follows the royal house's line under the realm's law (the release's pickHeir when the line is empty)
  const pickHeir = A.pickHeir;
  A.pickHeir = function (r) {
    try {
      const ru = r && A.P(r.ruler);
      if (ru && r.gov === 'hereditary' && !(r.heirLocked && live(A.P(r.heirLocked)))) {
        const law = { law: F.LAWMAP[r.law] || 'male-preference', fitness: r.house ? F.houseLaw(r.house).fitness : 'none' };
        const L = F.line(ru, law, 3), next = (L.line.find(e => live(e.p)) || {}).p;
        if (next) { r.heir = next.id; return next; }
      }
    } catch (e) { console.error('v2-family heir', e); }
    return pickHeir.apply(this, arguments);
  };

  // ---- grants: a province no one else holds ---------------------------------------------------------------------------
  F.freeHolding = function (rid, prefer, who) {
    const S = A.S, taken = new Set();
    for (const id in S.people) { const p = S.people[id]; if (p.alive && p !== who && p.noble && p.noble.rung >= 4 && p.noble.holding != null) taken.add(String(p.noble.holding)); }
    for (const id in S.houses) {
      const h = S.houses[id]; if (!greatLanded(h) || (who && h.headPid === who.id)) continue;
      if (live(A.P(h.headPid))) taken.add(String(seatProv(h)));
    }
    for (const id in S.realms) { const r = S.realms[id]; if (r && r.alive !== false && r.capitalProv != null && !(who && r.ruler === who.id)) taken.add(String(r.capitalProv)); }
    const provs = (A.realmProvs(rid) || []).map(q => q.id).sort((a, b) => a - b);
    if (prefer != null && !taken.has(String(prefer)) && (!provs.length || provs.includes(prefer))) return prefer;
    const free = provs.find(id => !taken.has(String(id)));
    return free != null ? free : null;
  };
  // every title with more than one living holder (empty when the rule holds)
  F.audit = function () {
    const S = A.S, bad = [];
    for (const id in S.realms) {
      const r = S.realms[id]; if (!r || r.alive === false) continue;
      const hs = Object.values(S.people).filter(p => p.alive && p.ruler === r.id);
      if (hs.length > 1 || (hs.length === 1 && r.ruler !== hs[0].id)) bad.push({ k: 'crown', id: r.id, holders: hs.map(p => p.id), ruler: r.ruler });
    }
    const hold = {};
    for (const id in S.people) { const p = S.people[id]; if (p.alive && p.noble && p.noble.rung >= 4 && p.noble.holding != null) (hold[p.noble.holding] = hold[p.noble.holding] || []).push(p.id); }
    const seats = {};
    for (const id in S.houses) { const h = S.houses[id]; if (greatLanded(h) && live(A.P(h.headPid))) seats[seatProv(h)] = h.headPid; }
    const caps = {};
    for (const id in S.realms) { const r = S.realms[id]; if (r && r.alive !== false && r.capitalProv != null) caps[r.capitalProv] = r.ruler; }
    for (const k in hold) {
      const ids = hold[k];
      if (ids.length > 1) bad.push({ k: 'lordship', id: k, holders: ids });
      else if (seats[k] && seats[k] !== ids[0]) bad.push({ k: 'lordship-seat', id: k, holders: [ids[0], seats[k]] });
      // a count of the court (99995-v2-nobility) keeps his county when a crown moves its seat into it: the crown sits in
      // his castle, it does not take his title
      else if (caps[k] && caps[k] !== ids[0] && !(A.P(ids[0]).noble.court)) bad.push({ k: 'lordship-crown', id: k, holders: [ids[0], caps[k]] });
    }
    return bad;
  };
})();
