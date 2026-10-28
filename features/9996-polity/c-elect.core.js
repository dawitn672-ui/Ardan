// The Polity, part three: elections with named votes (CK3's feudal elective and the HRE's prince-electors).
//
// Wherever r.gov is elective, council or theocracy, A.electRuler's pick is replaced by a vote (patch PO-ELECT is this
// wrap, no blob edit): named electors, at most four candidates, each elector voting for the candidate they score
// highest, a second round between the top two, a split when even that gives no majority. A tie goes to the elder
// candidate, so the count itself draws no dice. A council realm also elects on an eight-year term.
//
// State: r.pol.elect (the season: opened, electors, cands, gifts, slander, pcVote) and r.pol.vote (the last tally:
// y, rounds [{c: votes by elector}], winner, why). pc.pol.promises: [{to, rid, y, due, kept, broken}].
const POL = A.POL;
const clamp = POL.clamp, live = p => !!(p && p.alive);
POL.ELECT = { electors: 7, council: 9, cands: 4, term: 8, seasonAge: 65 };
POL.elective = r => !!r && ['elective', 'council', 'theocracy'].includes(r.gov);

// the electors of realm r: house heads (elective), the council and guildmasters (council), senior clergy (theocracy).
// make = true lets the count name a house's head where the house has none yet (only when the vote is held).
POL.electorsOf = function (r, make) {
  const out = [], seen = new Set(), add = p => { if (live(p) && !seen.has(p.id) && p.realm === r.id && !p.ruler && A.isAdult(p)) { seen.add(p.id); out.push(p); } };
  const N = r.gov === 'council' ? POL.ELECT.council : POL.ELECT.electors;
  if (r.gov === 'council') {
    for (const s in (r.council || {})) add(A.P(r.council[s]));
    for (const p of POL.holders(r, 'reeve')) add(p);
    for (const p of POL.holders(r, 'customs')) add(p);
  }
  if (r.gov === 'theocracy') {
    add(A.P((r.council || {}).chaplain));
    for (const p of POL.holders(r, 'mag')) if (POL.estateOf(p) === 'cler') add(p);
    for (const p of POL.peopleIx()[r.id] || []) if (POL.estateOf(p) === 'cler') add(p);
    for (let i = 0; make && out.length < N && i < N; i++) {
      const p = A.genNoble(r.id, 'gentry', null, A.ri(40, 65));
      p.job = { c: 'clergy', r: 4 }; p.flags.priest = A.S.year; p.literate = true; p.occ = `an elder of the faith in ${r.short}`;
      POL.stats.made++; POL.ixDirty(); add(p);
    }
  }
  const hs = A.realmHouses(r.id).slice().sort((a, b) => A.houseStrength(b) - A.houseStrength(a) || String(a.id).localeCompare(String(b.id)));
  for (const h of hs) { if (out.length >= N) break; const p = h.headPid && live(A.P(h.headPid)) ? A.P(h.headPid) : make ? A.houseHead(h.id) : null; add(p); }
  return out.slice(0, N);
};
// the candidates: everyone A.electable allows among the realm's great people, ranked by renown, and the player when
// eligible (at most four)
POL.candsOf = function (r, electors) {
  const pc = A.pc(), seen = new Set(), C = [];
  const add = p => { if (live(p) && !seen.has(p.id) && !p.ruler && p.realm === r.id && A.electable(p, r)) { seen.add(p.id); C.push(p); } };
  for (const p of electors || []) add(p);
  for (const s in (r.council || {})) add(A.P(r.council[s]));
  for (const h of A.realmHouses(r.id)) if (h.headPid) add(A.P(h.headPid));
  for (const p of POL.peopleIx()[r.id] || []) if ((p.fame || 0) >= 35 || (p.noble && p.noble.rung >= 4)) add(p);
  const old = A.P(r.ruler); if (r.gov === 'council' && live(old) && old.id !== A.S.pc) { seen.add(old.id); C.push(old); }
  C.sort((a, b) => (b.fame || 0) - (a.fame || 0) || a.born - b.born || String(a.id).localeCompare(String(b.id)));
  let out = C.filter(p => p.id !== A.S.pc).slice(0, POL.ELECT.cands);
  if (pc && pc.alive && seen.has(pc.id) && !(r.pol && r.pol.elect && r.pol.elect.out === pc.id)) out = out.slice(0, POL.ELECT.cands - 1).concat([pc]);
  if (r.gov === 'council' && live(old) && old.id !== A.S.pc && !out.includes(old)) out = out.slice(0, POL.ELECT.cands - 1).concat([old]);
  return out;
};
// a promise the player made to an elector, kept or broken
const promisesTo = (c, e, rid) => { const pc = A.pc(); if (!pc || c.id !== pc.id || !pc.pol) return []; return (pc.pol.promises || []).filter(x => x.to === e.id && (!rid || x.rid === rid)); };
// share a faction: both heads' houses in one faction of the realm
const sameFaction = (r, a, b) => { const ha = a.house, hb = b.house; if (!ha || !hb) return false; return A.factionsOf(r.id).some(f => f.members.includes(ha) && f.members.includes(hb)); };
const feud = (a, b) => { try { const L = A.BONDS && A.BONDS.ledger ? A.BONDS.ledger(a.house, b.house) : null; return L != null && Math.abs(L) >= 8; } catch (e) { return false; } };
// an elector's score for a candidate, with its parts; pure
POL.scoreParts = function (r, e, c) {
  const out = [], el = r.pol && r.pol.elect;
  if (e.id === c.id) { out.push(['Votes for themself', 60]); return out; }
  const op = Math.round(A.opinion(e, c)); if (op) out.push(['Opinion', op]);
  if (POL.estateOf(e) === POL.estateOf(c)) out.push(['Same estate', 15]);
  if (sameFaction(r, e, c)) out.push(['Same faction', 10]);
  const fm = Math.round((c.fame || 0) / 4); if (fm) out.push(['Renown', fm]);
  const pr = promisesTo(c, e, r.id).filter(x => !x.broken).length; if (pr) out.push([`${pr} promise${pr === 1 ? '' : 's'}`, 10 * pr]);
  const g = el && el.gifts && el.gifts[e.id] ? el.gifts[e.id] : 0; if (g) out.push(['Gifts', [0, 10, 15, 17][Math.min(3, g)]]);
  const broke = (r.pol && r.pol.broken && r.pol.broken[e.id] || []).includes(c.id); if (broke) out.push(['Broke a promise to them', -20]);
  const sl = el && el.slander && el.slander[e.id] && el.slander[e.id][c.id]; if (sl) out.push(['Slandered', -10]);
  if (feud(e, c)) out.push(['Their houses feud', -15]);
  if (r.gov === 'council' && c.id === r.ruler) out.push(['Holds the seat now', 8]);
  return out;
};
POL.score = (r, e, c) => POL.scoreParts(r, e, c).reduce((a, x) => a + x[1], 0);
const elder = (a, b) => (a.born - b.born) || String(a.id).localeCompare(String(b.id));
// one round: each elector's vote; pure
POL.round = function (r, E, C) {
  const v = {};
  const pc = A.pc(), el = r.pol && r.pol.elect;
  for (const e of E) {
    if (pc && e.id === pc.id && el && el.pcVote && C.some(c => c.id === el.pcVote)) { v[e.id] = el.pcVote; continue; }
    let best = null, bs = -1e9;
    for (const c of C) { const s = POL.score(r, e, c); if (s > bs || (s === bs && best && elder(c, best) < 0)) { bs = s; best = c; } }
    if (best) v[e.id] = best.id;
  }
  return v;
};
const countOf = (v, C) => C.map(c => [c, Object.values(v).filter(x => x === c.id).length]).sort((a, b) => b[1] - a[1] || elder(a[0], b[0]));
// the election: electors, candidates, rounds; returns {winner, rounds, ...} and records it
POL.election = function (r, why) {
  POL.init(r);
  const E = POL.electorsOf(r, true);
  const C = POL.candsOf(r, E);
  if (!E.length || !C.length) return null;
  const rounds = [];
  let v = POL.round(r, E, C), tally = countOf(v, C), win = null, split = false;
  rounds.push({ v });
  if (tally[0][1] * 2 > E.length) win = tally[0][0];
  else if (C.length > 1) {
    const two = [tally[0][0], tally[1][0]];
    v = POL.round(r, E, two); tally = countOf(v, two); rounds.push({ v });
    if (tally[0][1] * 2 > E.length) win = tally[0][0];
    else { split = true; win = tally[0][0]; }
  } else win = tally[0][0];
  const rec = { y: A.S.year, why: why || 'death', winner: win.id, cands: C.map(c => c.id), electors: E.map(e => e.id), rounds: rounds.map(x => x.v), split, loser: split ? tally[1][0].id : null };
  r.pol.vote = rec;
  r.pol.votes = ((r.pol.votes || []).concat([rec])).slice(-3);
  r.pol.elect = null;
  POL.stats.elections++; POL.stats.votes += E.length * rounds.length;
  if (split) {
    const lh = tally[1][0].house && A.S.houses[tally[1][0].house];
    if (lh && lh.realm === r.id) r.pol.split = { house: lh.id, y: A.S.year };
  }
  // the news names every vote
  const nm = id => { const p = A.P(id); return p ? A.fullName(p, false) : '?'; };
  const last = rounds[rounds.length - 1].v, n = Object.values(last).filter(x => x === win.id).length;
  const by = Object.keys(last).filter(e => last[e] === win.id).map(nm);
  A.news(`${r.short}: ${E.length} electors choose ${A.fullName(win, false)}, ${n} vote${n === 1 ? '' : 's'} to ${E.length - n}${rounds.length > 1 ? ' in a second round' : ''}${split ? ', and the losers do not accept it' : ''} (${by.slice(0, 4).join(', ')}${by.length > 4 ? ' and others' : ''}).`, 'crown');
  // promises the winner made fall due within two years
  const pc = A.pc();
  if (pc && win.id === pc.id && pc.pol) for (const x of pc.pol.promises || []) if (x.rid === r.id && !x.due) x.due = A.S.year + 2;
  if (pc && pc.pol) pc.pol.promises = (pc.pol.promises || []).filter(x => x.rid !== r.id || x.due);
  // the player's part in it, as a scene
  if (pc && pc.alive && (rec.cands.includes(pc.id) || rec.electors.includes(pc.id)) && A.EV.po_election_day) A.queue({ type: 'event', ev: 'po_election_day', ctx: { rid: r.id, pid: win.id === pc.id ? (rec.cands.find(c => c !== pc.id) || null) : win.id, won: win.id === pc.id ? 1 : 0, nV: n, nE: E.length, realmT: r.short } });
  return rec;
};
POL.voteLine = function (r, rec) {
  const nm = id => { const p = A.P(id); return p ? A.fullName(p, false) : '?'; };
  const v = rec.rounds[rec.rounds.length - 1];
  return Object.keys(v).map(e => `${nm(e)} for ${nm(v[e])}`);
};

// PO-ELECT: elective succession reads the vote
const baseElect = A.electRuler;
A.electRuler = function (r) {
  try {
    if (POL.on && POL.elective(r) && r.alive && !r.isRebel) {
      const rec = POL.election(r, 'death');
      const w = rec && A.P(rec.winner);
      if (live(w) && !w.ruler) { if (w.id === A.S.pc) A.log(`The electors of ${r.short} gather... and the choice falls on you!`, 'crown'); return w; }
    }
  } catch (e) { console.error('[po] election', e); }
  return baseElect.apply(this, arguments);
};

// the season: opens when the ruler of an elective realm grows old or ill, or at a council realm's term; the player
// sees it on the strip and may campaign. A council realm votes at the end of its term (AI-ruled realms).
POL.seasonYear = function (r) {
  if (!POL.elective(r)) { r.pol.elect = null; return; }
  const ru = A.P(r.ruler); if (!ru) return;
  const pc = A.pc(), R = GD.RACES[ru.race] || GD.RACES.human, old = A.age(ru) >= Math.max(POL.ELECT.seasonAge * (R.old || 60) / 60, R.old || 60) || (ru.health != null && ru.health < 30);
  const term = r.gov === 'council' && A.S.year - (r.pol.since || A.S.year) >= POL.ELECT.term;
  const soon = r.gov === 'council' && A.S.year - (r.pol.since || A.S.year) >= POL.ELECT.term - 1;
  if (term && !(pc && pc.ruler === r.id)) {
    const rec = POL.election(r, 'term');
    const w = rec && A.P(rec.winner);
    if (live(w) && w.id !== r.ruler) {
      const was = A.P(r.ruler);
      if (was) was.ruler = null;
      A.makeRuler(w, r.id);
      r.pol.came = 'council'; r.pol.cameSet = A.S.year; r.pol.ru = r.ruler;
      if (was && was.alive) was.occ = `once first of ${r.short}`;
    }
    r.pol.since = A.S.year;
    return;
  }
  if ((old || soon) && !r.pol.elect) {
    const E = POL.electorsOf(r, false), C = POL.candsOf(r, E);
    r.pol.elect = { opened: A.S.year, due: soon ? (r.pol.since || A.S.year) + POL.ELECT.term : null, electors: E.map(p => p.id), cands: C.map(p => p.id), gifts: {}, slander: {}, pcVote: null };
    if (pc && pc.alive && pc.realm === r.id && (C.includes(pc) || E.includes(pc)) && A.EV.po_season_opens) A.queue({ type: 'event', ev: 'po_season_opens', ctx: { rid: r.id, realmT: r.short, cand: C.includes(pc) ? 1 : 0 } });
  } else if (r.pol.elect) {
    if (!old && !soon) { r.pol.elect = null; return; }
    const E = POL.electorsOf(r, false), C = POL.candsOf(r, E);
    r.pol.elect.electors = E.map(p => p.id); r.pol.elect.cands = C.map(p => p.id);
  }
};
// a split election: the strongest loser's house leads a claimant faction with +0.2 power for five years
const basePower = A.factionPower;
A.factionPower = function (f) {
  const v = basePower.apply(this, arguments);
  try { const r = f && A.realm(f.realm), s = r && r.pol && r.pol.split; if (s && f.kind === 'claimant' && f.leader === s.house && A.S.year - s.y < 5) return v + .2; } catch (e) {}
  return v;
};
// promises kept and broken: a winner who still owes a promised elector after two years has broken it
POL.promiseYear = function (pc) {
  if (!pc || !pc.pol) return;
  for (const x of pc.pol.promises || []) {
    if (!x.due || x.kept || x.broken) continue;
    const e = A.P(x.to);
    if (!live(e)) { x.kept = A.S.year; continue; }
    const owe = pc.owes && pc.owes[e.id] > 0;
    if (!owe) { x.kept = A.S.year; continue; }
    if (A.S.year === x.due - 1 && A.EV.po_promise_due && !A.S.queue.some(q => q.ev === 'po_promise_due')) A.queue({ type: 'event', ev: 'po_promise_due', ctx: { pid: e.id } });
    if (A.S.year >= x.due) {
      x.broken = A.S.year;
      const r = A.realm(x.rid);
      if (r && r.pol) { const B = r.pol.broken = r.pol.broken || {}; (B[e.id] = B[e.id] || []).includes(pc.id) || B[e.id].push(pc.id); }
      if (pc.rel[e.id]) A.addOp(pc, e, -30);
      if (!pc.epithet) pc.epithet = 'Oath-breaker';
      A.log(`You promised ${A.fullName(e, false)} and did not pay it. The word goes round: Oath-breaker.`, 'bad');
    }
  }
};

const baseAfter = POL.afterYear;
POL.afterYear = function (r) {
  if (baseAfter) baseAfter.apply(this, arguments);
  POL.seasonYear(r);
};
