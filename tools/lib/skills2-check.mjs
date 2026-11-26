// Skills rebuild (docs/design/skills-v2.md §2.7): the validator of data/skills/. tools/lint-skills.mjs runs it;
// tests/v2/skills2-data.test.js plants a fault for each check and sees it caught. The engine's own arithmetic (the
// budget, the costs, the graph) is src/people/engine/skills2.js, read here, so the data and the game agree.
//   loadSkills2(root)  -> D = { vocab, families, skills, recipes, files }
//   validate(D, { s1 }) -> [{ check: 1..10, msg }]
import fs from 'node:fs';
import path from 'node:path';
import * as E from '../../src/people/engine/skills2.js';

export function loadSkills2(root) {
  const base = path.join(root, 'data/skills');
  const read = f => JSON.parse(fs.readFileSync(path.join(base, f), 'utf8'));
  const D = { vocab: read('vocab.json'), families: read('families.json'), skills: [], recipes: (read('recipes.json').recipes || []), files: {} };
  const walk = d => { for (const f of fs.readdirSync(d).sort()) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (f.endsWith('.json')) { const rel = path.relative(base, p); if (['vocab.json', 'families.json', 'recipes.json'].includes(rel)) continue; const j = JSON.parse(fs.readFileSync(p, 'utf8')); for (const s of j.skills || []) { D.skills.push(s); D.files[s.id] = rel; } } } };
  walk(base);
  return D;
}

const words = s => String(s || '').trim().split(/\s+/).filter(Boolean).length;
const isObj = x => x && typeof x === 'object' && !Array.isArray(x);
const SPEC_FIELDS = ['cooldown', 'cost', 'effect', 'duration', 'conditions'];   // no range (the owner, 2026-11-25)

export function validate(D, opt = {}) {
  const out = [], err = (check, msg) => out.push({ check, msg });
  const V = D.vocab, IX = E.index(D), fams = IX.fams;
  const R = new Set(V.ranks), RAR = new Set(V.rarities), KIND = new Set(V.kinds), TEACH = new Set(V.teach), CENSUS = new Set(V.census), VIA = new Set(V.vias), NEED = new Set(V.needKeys);
  const deeds = new Set(V.deeds), places = new Set(V.places), flags = new Set(V.flags), offices = new Set(V.offices), items = new Set(V.items), groupsSoc = new Set(V.socialGroups), trig = new Set(V.triggers), limits = new Set(Object.keys(V.limits));
  const cultureRx = new RegExp(V.culturePattern), faithRx = new RegExp(V.faithPattern), houseRx = new RegExp(V.housePattern);
  const famConcept = new Set(), famFocus = new Set();
  for (const f of fams) { for (const c of f.concepts || []) famConcept.add(f.id + ':' + c.id); for (const x of f.focuses || []) famFocus.add(f.id + ':' + x.id); }

  // ---- 1. schema ----------------------------------------------------------------------------------------------------
  const ids = new Set(), names = new Set();
  for (const s of D.skills) {
    const at = `skill ${s && s.id}`;
    if (!isObj(s)) { err(1, 'a skill is not an object'); continue; }
    if (typeof s.id !== 'string' || !/^[a-z][a-z0-9_]*(:\{house\})?$/.test(s.id)) err(1, `${at}: id must be lowercase letters, digits and _`);
    if (ids.has(s.id)) err(1, `${at}: id twice`); ids.add(s.id);
    if (typeof s.name !== 'string' || !s.name.trim()) err(1, `${at}: no name`);
    else { if (names.has(s.name)) err(1, `${at}: name "${s.name}" twice`); names.add(s.name); }
    if (!R.has(s.rank)) err(1, `${at}: rank ${s.rank}`);
    if (!RAR.has(s.rarity)) err(1, `${at}: rarity ${s.rarity}`);
    if (!KIND.has(s.kind)) err(1, `${at}: kind ${s.kind}`);
    if (typeof s.category !== 'string' || !/^[a-z]+\.[a-z0-9_]+$/.test(s.category) || !IX.groups.has(s.category.split('.')[0])) err(1, `${at}: category ${s.category} (group.sub, group in vocab.groups)`);
    if (!(s.family === null || s.family === undefined || typeof s.family === 'string')) err(1, `${at}: family`);
    if (s.reads !== undefined && !Array.isArray(s.reads)) err(1, `${at}: reads is not a list`);
    if (!Array.isArray(s.levels) || !s.levels.length) err(1, `${at}: no levels`);
    else {
      let last = 0;
      for (const b of s.levels) {
        if (!(Number.isInteger(b.at) && b.at >= 1 && b.at <= E.MAX_LV)) err(1, `${at}: band at ${b.at}`);
        if (b.at <= last) err(1, `${at}: bands out of order at ${b.at}`); last = b.at;
        if (!Array.isArray(b.effects)) err(1, `${at}: band ${b.at} has no effects list`);
        else for (const e of b.effects) effectSchema(e, `${at} Lv ${b.at}`, 0);
      }
      if (s.levels[0] && s.levels[0].at !== 1) err(1, `${at}: the first band is not at Lv 1`);
    }
    for (const g of s.gates || []) if (!(Number.isInteger(g.at) && g.at >= 2 && g.at <= E.MAX_LV) || !isObj(g.needs)) err(1, `${at}: gate ${JSON.stringify(g)}`);
    if (!Array.isArray(s.acquire) || !s.acquire.length) err(1, `${at}: no route to acquire it`);
    for (const r of s.acquire || []) routeSchema(r, at);
    for (const r of s.lose || []) routeSchema(r, at + ' lose');
    if (s.evolvesTo !== undefined && !Array.isArray(s.evolvesTo)) err(1, `${at}: evolvesTo is not a list`);
    if (!isObj(s.transfer) || !TEACH.has(s.transfer.teach)) err(1, `${at}: transfer.teach`);
    if (s.slot !== undefined && typeof s.slot !== 'boolean') err(1, `${at}: slot`);
    if (s.census !== undefined && !CENSUS.has(s.census)) err(1, `${at}: census ${s.census}`);
    specSchema(s.spec, at, true);
    if (typeof s.text !== 'string' || !s.text.trim()) err(1, `${at}: no text`);
    else if (words(s.text) > V.words.text) err(1, `${at}: text of ${words(s.text)} words (at most ${V.words.text})`);
    if (s.never != null && words(s.never) > V.words.never) err(1, `${at}: "never" of ${words(s.never)} words (at most ${V.words.never})`);
  }
  for (const r of D.recipes) {
    if (!isObj(r) || typeof r.id !== 'string' || !['known', 'found', 'age'].includes(r.kind) || !Array.isArray(r.parts) || r.parts.length < 2 || typeof r.result !== 'string') err(1, `recipe ${r && r.id}: needs id, kind (known, found, age), two parts or more, a result`);
    if (r && r.needs) needsSchema(r.needs, `recipe ${r.id}`);
  }
  function effectSchema(e, at, depth) {
    const T = V.effects[e && e.type];
    if (!T) { err(1, `${at}: effect type ${e && e.type}`); return; }
    for (const f of T.fields) if (e[f] === undefined) err(1, `${at}: ${e.type} without ${f}`);
    if (e.v !== undefined && typeof e.v !== 'number') err(1, `${at}: ${e.type} v is not a number`);
    if (T.parts && e.part && !T.parts.includes(e.part)) err(1, `${at}: fight part ${e.part}`);
    if (T.of && e.of && !T.of.includes(e.of)) err(2, `${at}: ${e.type} of ${e.of}`);
    if (T.scales && !T.scales.includes(e.scale)) err(2, `${at}: aura scale ${e.scale}`);
    if (e.limit !== undefined && !limits.has(e.limit)) err(2, `${at}: limit ${e.limit}`);
    if (e.spec !== undefined) specSchema(e.spec, at, false);
    if (e.type === 'trigger' || e.type === 'active') { if (depth > 1) err(1, `${at}: effects nested too deep`); if (isObj(e.do)) effectSchema(e.do, at, depth + 1); }
    if (e.type === 'trigger' && !trig.has(e.on)) err(2, `${at}: trigger on ${e.on}`);
    if (e.type === 'active' && e.cost !== undefined && !V.spec.resources.includes(e.cost)) err(2, `${at}: active cost ${e.cost}`);
    if (e.type === 'stat' && !V.stats.includes(e.stat)) err(2, `${at}: stat ${e.stat}`);
    if (e.type === 'perk' && e.legacy !== undefined && !/^perk:[a-z]+:\d+$/.test(e.legacy)) err(1, `${at}: perk legacy ${e.legacy}`);
    if (e.legacy !== undefined && typeof e.legacy !== 'string') err(1, `${at}: legacy`);
  }
  function specSchema(sp, at, required) {
    if (sp === undefined) { if (required) err(1, `${at}: no spec (cooldown, cost, effect, duration, conditions; §15.6)`); return; }
    if (!isObj(sp)) { err(1, `${at}: spec is not an object`); return; }
    const S = V.spec;
    for (const f of SPEC_FIELDS) if (required && !(f in sp)) err(1, `${at}: spec without ${f}`);
    for (const f in sp) if (!SPEC_FIELDS.includes(f) && !(S.optional || []).includes(f)) err(1, `${at}: spec field ${f}${f === 'range' ? ' (skills have no range; a rare one may carry a reach note)' : ''}`);
    if (sp.reach != null && (typeof sp.reach !== 'string' || words(sp.reach) > 15)) err(1, `${at}: spec.reach is a short note`);
    const time = (x, k) => { if (x == null) return; if (!isObj(x) || typeof x.v !== 'number' || !S.timeUnits.includes(x.per || x.unit)) err(1, `${at}: spec.${k} ${JSON.stringify(x)}`); };
    time(sp.cooldown, 'cooldown'); time(sp.duration, 'duration');
    if (sp.cost != null && (!Array.isArray(sp.cost) || sp.cost.some(c => !isObj(c) || !S.resources.includes(c.res) || typeof c.v !== 'number'))) err(1, `${at}: spec.cost ${JSON.stringify(sp.cost)}`);
    if (sp.effect != null && (!isObj(sp.effect) || !(typeof sp.effect.amount === 'number' || typeof sp.effect.share === 'number') || (sp.effect.unit && !S.effectUnits.includes(sp.effect.unit)))) err(1, `${at}: spec.effect ${JSON.stringify(sp.effect)}`);
    if (sp.conditions != null) { if (!Array.isArray(sp.conditions)) err(1, `${at}: spec.conditions is not a list`); else sp.conditions.forEach(c => needsSchema(c, at + ' spec')); }
  }
  function routeSchema(r, at) {
    if (!isObj(r) || !VIA.has(r.via)) { err(1, `${at}: route via ${r && r.via}`); return; }
    if (r.needs !== undefined) needsSchema(r.needs, at);
    if (r.hidden !== undefined && typeof r.hidden !== 'boolean') err(1, `${at}: hidden`);
  }
  function needsSchema(n, at) {
    if (!isObj(n)) { err(1, `${at}: needs is not an object`); return; }
    for (const k in n) if (!NEED.has(k)) err(1, `${at}: need ${k}`);
  }

  // ---- 2. every reference exists --------------------------------------------------------------------------------------
  const skillIds = new Set(D.skills.map(s => s.id));
  const sk = id => skillIds.has(id) || /\{house\}/.test(id);
  const list = x => (Array.isArray(x) ? x : x == null ? [] : [x]);
  const edgeTag = t => IX.FAM[t] || IX.LEG[t] || IX.groups.has(t) || IX.checkTags.has(t) || famFocus.has(t) || famConcept.has(t);
  function needsRefs(n, at) {
    if (!isObj(n)) return;
    for (const s in n.stat || {}) if (!V.stats.includes(s)) err(2, `${at}: stat ${s}`);
    for (const f in n.family || {}) if (!E.famOf(IX, f)) err(2, `${at}: family ${f}`);
    for (const id in n.skill || {}) if (!sk(id)) err(2, `${at}: skill ${id}`);
    for (const x of list(n.race)) if (!V.races.includes(x)) err(2, `${at}: race ${x}`);
    for (const x of list(n.culture)) if (!cultureRx.test(x)) err(2, `${at}: culture ${x}`);
    for (const x of list(n.faith)) if (!faithRx.test(x)) err(2, `${at}: faith ${x}`);
    for (const x of list(n.house)) if (!houseRx.test(x)) err(2, `${at}: house ${x}`);
    for (const x of list(n.place)) if (!places.has(x)) err(2, `${at}: place ${x}`);
    for (const x of list(n.item)) if (!items.has(x)) err(2, `${at}: item ${x}`);
    for (const x of list(n.flag)) if (!flags.has(x)) err(2, `${at}: flag ${x}`);
    for (const x of list(n.office)) if (!offices.has(x)) err(2, `${at}: office ${x}`);
    if (n.deed && !deeds.has(n.deed.kind)) err(2, `${at}: deed ${n.deed.kind}`);
    if (n.deed && n.deed.rank && !R.has(n.deed.rank)) err(2, `${at}: deed rank ${n.deed.rank}`);
    for (const c of n.concept || []) if (!famConcept.has(c)) err(2, `${at}: concept ${c}`);
    for (const f in n.talent || {}) if (!E.famOf(IX, f) || !V.talents.includes(n.talent[f])) err(2, `${at}: talent ${f}`);
    if (n.teacher) { if (n.teacher.reads && !E.famOf(IX, n.teacher.reads)) err(2, `${at}: teacher reads ${n.teacher.reads}`); if (n.teacher.rank && !R.has(n.teacher.rank)) err(2, `${at}: teacher rank`); if (n.teacher.has && !sk(n.teacher.has)) err(2, `${at}: teacher has ${n.teacher.has}`); }
    if (n.devotion && !faithRx.test(n.devotion.faith)) err(2, `${at}: devotion faith ${n.devotion.faith}`);
    if (n.moment && !list(n.moment).every(m => (V.moments || []).includes(m))) err(2, `${at}: moment ${n.moment}`);
    if (n.not) needsRefs(n.not, at + ' not');
  }
  function effectRefs(e, at) {
    if (!isObj(e)) return;
    if ((e.type === 'edge' || e.type === 'blunder' || e.type === 'surge' || e.type === 'growth') && e.tag !== 'all' && !edgeTag(e.tag)) err(2, `${at}: ${e.type} tag ${e.tag}`);
    if (e.type === 'fight' && e.tag !== 'all' && !IX.weapons.has(e.tag)) err(2, `${at}: fight tag ${e.tag} is no weapon family`);
    if (e.type === 'social' && !groupsSoc.has(e.group) && !/^(faith:|culture:)/.test(e.group || '')) err(2, `${at}: social group ${e.group}`);
    if (e.type === 'social' && /^faith:/.test(e.group) && !faithRx.test(e.group.slice(6))) err(2, `${at}: social faith ${e.group}`);
    if (e.type === 'unlock') { const [k, x] = String(e.what).split(':'); if (!V.effects.unlock.kinds.includes(k) || !x) err(2, `${at}: unlock ${e.what}`); if (k === 'teach' && !E.famOf(IX, x)) err(2, `${at}: unlock teach ${x}`); }
    if (e.type === 'perk' && !E.famOf(IX, e.key)) err(2, `${at}: perk key ${e.key}`);
    if (e.spec && Array.isArray(e.spec.conditions)) e.spec.conditions.forEach(c => needsRefs(c, at));
    if (e.do) effectRefs(e.do, at);
  }
  for (const s of D.skills) {
    const at = `skill ${s.id}`;
    if (s.family != null && !IX.FAM[s.family]) err(2, `${at}: family ${s.family}`);
    for (const f of s.reads || []) if (!IX.FAM[f]) err(2, `${at}: reads ${f}`);
    for (const b of s.levels || []) for (const e of b.effects || []) effectRefs(e, `${at} Lv ${b.at}`);
    for (const g of s.gates || []) needsRefs(g.needs, at + ' gate');
    for (const r of [...(s.acquire || []), ...(s.lose || [])]) {
      needsRefs(r.needs, at);
      if (r.via === 'evolve' && !sk(r.from)) err(2, `${at}: evolves from ${r.from}, no such skill`);
      if (r.via === 'merge' && (!r.recipe || !IX.RECIPE[r.recipe])) err(2, `${at}: merge recipe ${r.recipe}`);
    }
    for (const t of s.evolvesTo || []) if (!sk(t.id)) err(2, `${at}: evolves to ${t.id}, no such skill`);
    if (s.spec && Array.isArray(s.spec.conditions)) s.spec.conditions.forEach(c => needsRefs(c, at + ' spec'));
  }
  for (const r of D.recipes) {
    for (const p of r.parts || []) if (!sk(p.id)) err(2, `recipe ${r.id}: part ${p.id}`);
    if (!sk(r.result)) err(2, `recipe ${r.id}: result ${r.result}`);
    needsRefs(r.needs, `recipe ${r.id}`);
  }
  for (const f of fams) {
    for (const k in f.kin || {}) if (!IX.FAM[k]) err(2, `family ${f.id}: kin ${k}`);
    for (const x of f.focuses || []) if (x.legacy && !(f.legacy || []).includes(x.legacy)) err(2, `family ${f.id}: focus ${x.id} names legacy ${x.legacy}, not the family's`);
    if (!IX.groups.has(f.group)) err(2, `family ${f.id}: group ${f.group}`);
  }

  // ---- 3. the budget ----------------------------------------------------------------------------------------------------
  for (const s of D.skills) if (R.has(s.rank) && Array.isArray(s.levels)) for (const f of E.budgetFaults(IX, s)) {
    err(3, f.flaw ? `skill ${s.id}: a flaw that owes ${f.budget} spends only ${f.spend}` : `skill ${s.id}: Lv ${f.at} spends ${f.spend} of a budget of ${f.budget}`);
  }

  // ---- 4. stats apart -------------------------------------------------------------------------------------------------
  const statIn = e => isObj(e) && (e.type === 'stat' || statIn(e.do));
  for (const s of D.skills) {
    const may = s.kind === 'blessing' || s.kind === 'flaw' || String(s.category).split('.')[0] === 'racial';
    if (!may && (s.levels || []).some(b => (b.effects || []).some(statIn))) err(4, `skill ${s.id}: a stat effect on a ${s.kind} skill (only blessings, flaws and racial skills touch stats)`);
  }

  // ---- 5. ladders whole -----------------------------------------------------------------------------------------------
  const LAD = ['D', 'C', 'B', 'A'];
  for (const f of fams) {
    for (let i = 0; i < LAD.length; i++) {
      const id = E.rungOf(IX, f.id, LAD[i]), s = id && IX.BY[id];
      if (!s) { err(5, `family ${f.id}: no ${LAD[i]} rung`); continue; }
      if (!(s.reads || []).includes(f.id)) err(5, `rung ${id}: does not read ${f.id}`);
      const next = E.rungOf(IX, f.id, LAD[i + 1] || 'S');
      if (next && !(s.evolvesTo || []).some(t => t.id === next)) err(5, `rung ${id}: does not evolve to ${next}`);
    }
  }
  for (const s of D.skills) if (s.family && !(s.reads || []).includes(s.family)) err(5, `rung ${s.id}: does not read its family ${s.family}`);
  // the 38 keys a check or a grant may name: S1's 28 skills and its 10 legacy keys, each resolving to a family
  if (opt.s1) {
    const want = new Set(), have = new Set([...fams.map(f => f.id), ...Object.keys(IX.LEG)]);
    for (const s of opt.s1.skills) { want.add(s.id); for (const l of s.legacy || []) want.add(l); }
    for (const k of want) if (!have.has(k)) err(5, `key ${k} (S1) resolves to no family`);
    for (const k of have) if (!want.has(k)) err(5, `key ${k} is no S1 key`);
    if (want.size !== have.size) err(5, `${have.size} keys, S1 has ${want.size}`);
    // the gates of a ladder are S1's (step 7, D-182): S1's table under the rungs grasps S1's concepts, so each edge of a
    // family's ladder asks exactly S1's concepts of that word, and from rank B a deed (S1's proof)
    for (const s of opt.s1.skills) {
      if (!IX.FAM[s.id]) continue;
      for (let w = 1; w <= 6; w++) {
        const e = E.edgeNeeds(IX, s.id, w);
        if (!e) { err(5, `family ${s.id}: no rung's condition at S1's edge ${w}`); continue; }
        const want2 = s.concepts.filter(c => opt.s1.words.indexOf(c.word) === w).map(c => s.id + ':' + c.id).sort().join(), got = (e.needs.concept || []).slice().sort().join();
        if (want2 !== got) err(5, `${e.to} at S1's edge ${w}: concepts ${got || 'none'}, S1 asks ${want2 || 'none'}`);
        if (e.kind === 'evolve' && w >= 3 && !e.needs.deed) err(5, `${e.to}: no deed (S1 asks a proof from rank B)`);
      }
    }
  }

  // ---- 6. reachable -----------------------------------------------------------------------------------------------------
  // A route's leaf is open to a start when its via is (vocab.starts); evolve, merge and awaken open once their sources
  // are reached. Every skill must be reachable by some newborn; every ladder rung D to A by a newborn of every start,
  // whatever his culture (a route asking a culture, race, faith or house is closed to "every"). Unique and legendary
  // skills may need a route no start has (an event's, a god's), so they are checked only for having a route at all.
  const starts = Object.keys(V.starts).filter(k => k !== 'note');
  const RESTRICT = ['culture', 'race', 'faith', 'house'];
  function reach(vias, strict) {
    const got = new Set();
    let changed = true;
    while (changed) {
      changed = false;
      for (const s of D.skills) {
        if (got.has(s.id)) continue;
        const ok = (s.acquire || []).some(r => {
          const n = r.needs || {};
          if (strict && RESTRICT.some(k => n[k] != null)) return false;
          if (strict && (r.via === 'culture' || r.via === 'bloodline')) return false;
          if (Object.keys(n.skill || {}).some(id => !got.has(id))) return false;
          if (r.via === 'evolve') return got.has(r.from);
          if (r.via === 'merge') { const rc = IX.RECIPE[r.recipe]; return !!rc && rc.parts.every(p => got.has(p.id)); }
          if (r.via === 'awaken') return D.skills.some(x => got.has(x.id) && (x.evolvesTo || []).some(t => t.id === s.id));
          return vias.has(r.via);
        });
        if (ok) { got.add(s.id); changed = true; }
      }
    }
    return got;
  }
  const any = reach(new Set(V.vias.filter(v => !['evolve', 'merge', 'awaken'].includes(v))), false);
  for (const s of D.skills) if (!any.has(s.id) && !/\{house\}/.test(s.id)) err(6, `skill ${s.id}: no newborn can reach it`);
  for (const st of starts) {
    const got = reach(new Set(V.starts[st]), true);
    for (const s of D.skills) if (s.family && LAD.includes(s.rank) && !got.has(s.id)) err(6, `rung ${s.id}: a ${st}'s newborn cannot reach it`);
  }

  // ---- 7. no loops --------------------------------------------------------------------------------------------------------
  const G = E.graph(IX), cyc = E.findCycle(G);
  if (cyc) err(7, `a loop of evolution or merging: ${cyc.join(' -> ')}`);
  for (const s of D.skills) {
    const after = E.descendants(G, s.id);
    for (const r of s.acquire || []) {
      for (const id of Object.keys((r.needs || {}).skill || {})) if (id === s.id || after.has(id)) err(7, `skill ${s.id}: a route needs ${id}, which is it or comes after it`);
      if (r.via === 'evolve' && r.from === s.id) err(7, `skill ${s.id}: evolves from itself`);
    }
    if (s.transfer && s.transfer.teachGrants) err(7, `skill ${s.id}: teaching never grants the teacher experience in the skill taught`);
  }
  for (const r of D.recipes) if ((r.parts || []).some(p => p.id === r.result || E.descendants(G, r.result).has(p.id))) err(7, `recipe ${r.id}: its result feeds back into its parts`);

  // ---- 8. up, never down ----------------------------------------------------------------------------------------------------
  for (const s of D.skills) {
    for (const t of s.evolvesTo || []) { const x = IX.BY[t.id]; if (x && E.rankIx(x.rank) !== E.rankIx(s.rank) + 1) err(8, `skill ${s.id} (${s.rank}) evolves to ${t.id} (${x.rank}): not one rank higher`); }
    for (const r of s.acquire || []) if (r.via === 'evolve') { const x = IX.BY[r.from]; if (x && E.rankIx(x.rank) !== E.rankIx(s.rank) - 1) err(8, `skill ${s.id} (${s.rank}) evolves from ${r.from} (${x.rank}): not one rank lower`); }
  }
  for (const r of D.recipes) {
    const res = IX.BY[r.result], parts = (r.parts || []).map(p => IX.BY[p.id]).filter(Boolean);
    if (!res || !parts.length) continue;
    const top = Math.max(...parts.map(p => E.rankIx(p.rank))), ri = E.rankIx(res.rank);
    if (ri < top || ri > top + 1) err(8, `recipe ${r.id}: result ${res.rank} against parts up to ${E.RANKS[top]} (at least the highest, at most one above)`);
  }
  // a merge joins level-10 skills of different families into one that reads them all (§3.4, §15.8; step 8, D-182)
  for (const r of D.recipes) for (const f of E.recipeFaults(IX, r)) err(8, `recipe ${r && r.id}: ${f}`);
  const results = new Map();
  for (const r of D.recipes) { if (results.has(r.result)) err(8, `recipes ${results.get(r.result)} and ${r.id} make the same ${r.result}`); results.set(r.result, r.id); }

  // ---- 9. rank and rarity shares -------------------------------------------------------------------------------------------
  const n = D.skills.length;
  if (n >= V.shares.from) {
    for (const r of V.ranks) {
      const k = D.skills.filter(s => s.rank === r).length, pct = 100 * k / n, [lo, hi] = V.shares[r];
      if (pct < lo - 1e-9 || pct > hi + 1e-9) err(9, `rank ${r}: ${pct.toFixed(1)} in 100 (${lo} to ${hi})`);
    }
  }
  for (const s of D.skills) if ((s.rarity === 'unique' || s.rarity === 'legendary') && s.census !== 'one' && s.census !== 'age') err(9, `skill ${s.id}: ${s.rarity} without census one or age`);

  // ---- 10. names ---------------------------------------------------------------------------------------------------------------
  const LW = V.levelWords.join('|'), ROM = '(I|II|III|IV|V|VI|VII|VIII|IX|X)';
  const asLevel = new RegExp(`(\\b(${LW})\\s+${ROM}\\b|\\S\\s+(${LW})(\\s+${ROM})?\\s*$)`);
  for (const s of D.skills) {
    if (typeof s.name !== 'string') continue;
    for (const d of V.denyNames) if (s.name.toLowerCase().includes(d.toLowerCase())) err(10, `skill ${s.id}: "${s.name}" holds the denied name "${d}"`);
    if (asLevel.test(s.name)) err(10, `skill ${s.id}: "${s.name}" uses a level word as a level`);
  }
  return out;
}
