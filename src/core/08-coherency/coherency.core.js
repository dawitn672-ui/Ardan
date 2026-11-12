// 08-coherency: the game's coherency checks (round 2, Foundations item 3).
// One registry of read-only checks for contradictions: two holders of one post, a dead person holding a post, labels
// that disagree, impossible states, links between systems that point nowhere. Features add their own checks with
//   A.COHERENCY.add('name', () => [ 'problem text', ... ], { owner: 'src/<system>/NN-name' })
// and anyone can run them all with A.COHERENCY.run() -> [{ check, owner, problems: [...] }] (only failing checks).
// tools/coherency.mjs runs them over many seeds and years after every update; tests/suites/coherency.test.mjs runs a
// quick round in CI. A check must never change A.S or draw from the random stream (the test checks both).
const CO = A.COHERENCY = A.COHERENCY || { checks: [] };
CO.add = function (name, fn, o) { CO.checks = CO.checks.filter(c => c.name !== name); CO.checks.push({ name, fn, owner: (o && o.owner) || '' }); };
CO.run = function (only) {
  const out = [];
  if (!A.S || !A.S.people) return out;
  for (const c of CO.checks) {
    if (only && !only.includes(c.name)) continue;
    let problems;
    try { problems = c.fn() || []; } catch (e) { problems = ['the check itself threw: ' + String(e && e.message || e).slice(0, 160)]; }
    if (problems.length) out.push({ check: c.name, owner: c.owner, n: problems.length, problems: problems.slice(0, 12) });
  }
  return out;
};
const live = p => !!(p && p.alive);
const who = id => { const p = A.P && A.P(id); return p ? `${A.fullName ? A.fullName(p, false) : id} (${id}${p.alive ? '' : ', dead'})` : `${id} (missing)`; };
const realms = () => Object.values(A.S.realms || {}).filter(r => r && r.alive !== false);
const ME = 'src/core/08-coherency';

// ---- the checks every build has ---------------------------------------------------------------------------------------
// v2's own invariants: one continent, one holder per title, the player's body within its ceilings, the stores present
CO.add('v2 invariants', () => (A.V2SAVE && A.V2SAVE.check ? A.V2SAVE.check() : []), { owner: 'src/core/99998-v2-saves' });

// every realm alive has a living ruler who knows he rules it, and nobody else thinks he rules it
CO.add('one ruler per realm', () => {
  const bad = [], claim = {};
  for (const p of Object.values(A.S.people)) if (live(p) && p.ruler) (claim[p.ruler] = claim[p.ruler] || []).push(p.id);
  for (const r of realms()) {
    const p = A.P(r.ruler);
    if (!live(p)) bad.push(`${r.short || r.id}: its ruler ${who(r.ruler)} is not alive`);
    const c = claim[r.id] || [];
    if (c.length > 1) bad.push(`${r.short || r.id}: ${c.length} living people hold its crown: ${c.map(who).join(', ')}`);
    else if (c.length === 1 && c[0] !== r.ruler) bad.push(`${r.short || r.id}: ${who(c[0])} holds its crown but the realm names ${who(r.ruler)}`);
  }
  return bad;
}, { owner: ME });

// council seats: each held by a living person or empty, and nobody sits in two seats or two councils
CO.add('one holder per council seat', () => {
  const bad = [], seats = {};
  for (const r of realms()) for (const k in (r.council || {})) {
    const id = r.council[k]; if (!id) continue;
    if (!live(A.P(id))) bad.push(`${r.short || r.id} ${k}: held by ${who(id)}`);
    (seats[id] = seats[id] || []).push(`${r.short || r.id} ${k}`);
  }
  for (const id in seats) if (seats[id].length > 1) bad.push(`${who(id)} holds ${seats[id].length} council seats: ${seats[id].join(', ')}`);
  return bad;
}, { owner: ME });

// every army in the field is led by a living general, and nobody leads two armies
CO.add('one general per army', () => {
  const bad = [], gens = {};
  for (const a of (A.S.armies || [])) {
    if (!a) continue;
    if (a.gen && !live(A.P(a.gen))) bad.push(`army ${a.id || a.name}: led by ${who(a.gen)}`);
    if (a.gen) (gens[a.gen] = gens[a.gen] || []).push(a.id || a.name);
  }
  for (const g in gens) if (gens[g].length > 1) bad.push(`${who(g)} leads ${gens[g].length} armies: ${gens[g].join(', ')}`);
  return bad;
}, { owner: ME });

// marriages go both ways; parents and children point at each other; links point at someone who exists
CO.add('family links agree', () => {
  const bad = [];
  for (const p of Object.values(A.S.people)) {
    if (!live(p)) continue;
    if (p.spouse) { const s = A.P(p.spouse); if (!s) bad.push(`${who(p.id)}: spouse ${p.spouse} does not exist`); else if (s.alive && s.spouse !== p.id) bad.push(`${who(p.id)} is married to ${who(s.id)}, who is married to ${s.spouse ? who(s.spouse) : 'nobody'}`); }
    for (const c of (p.children || [])) { const k = A.P(c); if (!k) bad.push(`${who(p.id)}: child ${c} does not exist`); else if (!(k.parents || []).includes(p.id)) bad.push(`${who(p.id)} lists ${who(c)} as a child, who does not list them as a parent`); }
    if (bad.length > 40) break;
  }
  return bad;
}, { owner: ME });

// the player: a child holds no adult post, a dead player holds nothing
CO.add('the player fits their age', () => {
  const pc = A.pc && A.pc(), bad = [];
  if (!pc) return bad;
  const age = A.age ? A.age(pc) : 99;
  if (age < 12 && pc.job && pc.job.c && !/^(none|child|apprentice|page|squire|novice|servant|shepherd|farmhand|student)$/.test(pc.job.c)) bad.push(`a ${age}-year-old works as ${pc.job.c}`);
  if (age < 14 && pc.mil && pc.mil.rank > 0) bad.push(`a ${age}-year-old holds military rank ${pc.mil.rank}`);
  return bad;
}, { owner: ME });

// ---- the world critic's checks (round 2 A3a; docs/reviews/round-2/draft-world.md rows 3, 5, 11, and the engineering
// critic's realms born without a council). Read only: no lazy repair (A.houseHead would make a head), no draws.
const adult = p => { const R = GD.RACES && GD.RACES[p.race]; return !R || !A.age || A.age(p) >= R.adult; };
const rn = r => r.short || r.name || r.id;
const N = () => A.V2N;

// a title of the court is held by a living person, or its line has passed to one (p.noble.passed), or it is marked vacant
CO.add('no dead holder: titles', () => {
  const bad = [], C = A.S.court;
  if (!C || !C.realms || !N() || !N().holderOf) return bad;
  for (const rid in C.realms) for (const t of (C.realms[rid].titles || [])) {
    if (!t || t.crown || t.heldWith || !t.pid || t.vacant) continue;
    if (!A.P(t.pid)) bad.push(`${t.name || t.k}: points at ${t.pid}, who no longer exists`);
    else if (!N().holderOf(t)) bad.push(`${t.name || t.k}: held by ${who(t.pid)}`);
  }
  return bad;
}, { owner: ME });

// the head of a house that has not died out is alive (A.houseHead mends this lazily when asked; nothing should need it)
CO.add('no dead holder: house heads', () => {
  const bad = [];
  for (const id in (A.S.houses || {})) {
    const h = A.S.houses[id]; if (!h || h.extinct || !h.headPid) continue;
    const p = A.P(h.headPid);
    if (!p) bad.push(`house ${h.name || id}: head ${h.headPid} no longer exists`);
    else if (!p.alive) bad.push(`house ${h.name || id}: headed by ${who(p.id)}`);
  }
  return bad;
}, { owner: ME });

// the shire offices of a realm's polity (9996-polity: magistrates, reeves, sheriffs) are held by the living
CO.add('no dead holder: shire offices', () => {
  const bad = [];
  for (const r of realms()) for (const o of ((r.pol && r.pol.off) || [])) {
    if (!o || !o.pid) continue;
    if (!live(A.P(o.pid))) bad.push(`${rn(r)} ${o.id || o.k}: held by ${who(o.pid)}${o.since != null ? ' since ' + o.since : ''}`);
  }
  return bad;
}, { owner: ME });

// a living realm with land has a council with someone in it (realms born in play, by secession or a civil war won, got
// none: final-engineering.md row 4). A rebel faction still fighting for its claim (r.isRebel: the Tessarian pretender's
// Andros, from day 0) is a party to a war, not yet a realm with a court, so it is left out until it wins (r.isNew).
CO.add('every realm has a council', () => {
  const bad = [];
  for (const r of realms()) {
    if (r.landless || (r.isRebel && !r.isNew)) continue;
    if (!r.council || typeof r.council !== 'object' || !Object.values(r.council).some(Boolean)) bad.push(`${rn(r)} (${r.id}) has no council`);
  }
  return bad;
}, { owner: ME });

// nobody under their people's age of majority (GD.RACES[race].adult) sits in a council, holds a shire office or leads
// an army. Land titles are left out: they pass by blood, and a child may hold one as a ward, as a child may be king
// (elf lords made at human ages, draft-world.md row 11, are a fault of their making, for A2 and C6, not of this rule).
CO.add('no child in an adult office', () => {
  const bad = [];
  const look = (id, what) => { const p = A.P(id); if (live(p) && !adult(p)) bad.push(`${what}: held by ${who(id)}, aged ${A.age(p)}`); };
  for (const r of realms()) {
    for (const k in (r.council || {})) if (r.council[k]) look(r.council[k], `${rn(r)} ${k}`);
    for (const o of ((r.pol && r.pol.off) || [])) if (o && o.pid) look(o.pid, `${rn(r)} ${o.id || o.k}`);
  }
  for (const a of (A.S.armies || [])) if (a && a.gen) look(a.gen, `army ${a.name || a.id}`);
  return bad;
}, { owner: ME });

// one office, one name: two living people of a realm are not both styled with one of its council offices (p.occ, written
// by whoever appointed them and never cleared; p.title, frozen lore). "Marshal of the Crown knights", "of the host" or
// "of the Wolves" is another post (an order's, an army's), and "cousin of the Lord Marshal" names a kinsman, not a style.
const SEATW = { marshal: 'Marshal', chancellor: 'Chancellor', treasurer: 'Treasurer', spymaster: 'Spymaster', chaplain: 'Chaplain' };
const styledAs = (s, w) => String(s).split(/;\s*/).some(part => { const m = new RegExp(`(^|.*\\b(of the|to the)\\s+(?:\\w+\\s+)?)?\\b${w}\\b(\\s+of the\\b)?`).exec(part); return !!m && !m[2] && !m[3]; });
CO.add('one office, one styled holder', () => {
  const bad = [], by = {};
  for (const id in A.S.people) {
    const p = A.S.people[id]; if (!live(p) || p.realm == null) continue;
    for (const s of [p.occ, p.title]) {
      if (!s || typeof s !== 'string') continue;
      for (const k in SEATW) if (styledAs(s, SEATW[k])) { const key = p.realm + '|' + k; (by[key] = by[key] || new Set()).add(p.id); }
    }
  }
  for (const key in by) if (by[key].size > 1) {
    const [rid, k] = key.split('|'), r = A.S.realms[rid];
    if (!r || r.alive === false) continue;
    const ids = [...by[key]];
    bad.push(`${r ? rn(r) : rid}: ${ids.length} living people styled ${k}: ${ids.slice(0, 3).map(i => `${who(i)} "${A.P(i).occ || A.P(i).title}"`).join(', ')}`);
  }
  return bad;
}, { owner: ME });
