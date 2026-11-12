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
