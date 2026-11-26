// The titles' validator (docs/design/skills-v2.md §11.2-§11.5, §11.9; D-183). Reads data/titles/ against its vocab.json and
// data/skills/vocab.json's prices, and the source for what no screen may read. Fails on:
//   - a title without an id, a name, a known rarity, weight, kind or being, or two titles with one id
//   - a predicate or a deed kind not declared in vocab.json; a skill family or rank that does not exist; a watched kind
//     that is not a deed or 'month'; a person's title that watches nothing, or whose ledger conditions nothing wakes
//   - person effects over the weight's budget (perLevel x 5, x1.25 unique, x1.5 legendary), a stat over +3 a title, an
//     effect type, tag, group or slot the vocabularies do not have
//   - a title that cannot be met by any start (a predicate walk: an all() asking a count both above and below one number)
//   - a legend's or a master's sheet naming a title not in data/titles/, or a title whose holders disagree with the sheets
//   - a card choice table naming a deed kind not declared
//   - any file under src/ui/ or any *view*.core.js reading .requires or .watch (the conditions are never shown)
// Prints the deed kinds no source records yet (deferred), which is not a failure.
//   node tools/lint-titles.mjs [--json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const J = f => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
const V = J('data/titles/vocab.json'), SV = J('data/skills/vocab.json'), FAMS = (x => (Array.isArray(x) ? x : x.families))(J('data/skills/families.json'));
const files = fs.readdirSync(path.join(root, 'data/titles')).filter(f => f.endsWith('.json') && f !== 'vocab.json').sort();
const LIST = files.flatMap(f => J('data/titles/' + f).titles.map(t => Object.assign({ _file: f }, t)));
const bad = [], note = [];
const fail = (t, m) => bad.push(`${t && t.id ? t.id : '?'} (${t && t._file}): ${m}`);

const FAM = new Map(FAMS.map(f => [f.id, f]));
const LEGACY = new Map(); for (const f of FAMS) for (const k of f.legacy || []) LEGACY.set(k, f.id);
const RANKS = SV.ranks, DEEDS = V.deeds || {};
const PRED = new Set(V.predicates);

// ---- prices (data/skills/vocab.json), as the skills engine prices them
const C = SV.costs, groups = new Set(SV.groups || []);
const tagKind = tag => (FAM.has(tag) ? 'family' : groups.has(tag) ? 'group' : 'narrow');
function cost(e) {
  const a = Math.abs(+e.v || 0);
  switch (e.type) {
    case 'stat': return C.stat * a;
    case 'edge': { const k = tagKind(e.tag); return (k === 'family' ? C.edgeFamily : k === 'group' ? C.edgeGroup : C.edgeNarrow) * a; }
    case 'fight': return (e.tag === 'all' ? C.fightAll : C.fightOne) * a;
    case 'blunder': case 'surge': return C.blunderSurge * a;
    case 'aura': return (C.aura[e.scale] || 0) * a;
    case 'resist': return ((C.resistHardOf || []).includes(e.of) ? C.resistHard : C.resist) * a;
    case 'social': return C.socialPer5 * a / 5;
    case 'growth': return C.growthPer10 * a / 10;
    default: return Infinity;
  }
}
const budget = t => {
  const B = V.budget, per = B.per[t.weight];
  if (per == null) return 0;
  const m = Math.max(1, t.unique ? B.unique : 1, t.rarity === 'legendary' ? B.legendary : 1);
  return per * B.levels * m;
};
// a tag an edge or a fight may carry: a family, a legacy key, a group, a check tag, a family's focus, or all
const okTag = tag => tag === 'all' || FAM.has(tag) || LEGACY.has(tag) || groups.has(tag) || (SV.checkTags || []).includes(tag) ||
  (/^[a-z]+:[a-z0-9-]+$/.test(tag) && FAM.has(tag.split(':')[0]) && (FAM.get(tag.split(':')[0]).focuses || []).some(f => f.id === tag.split(':')[1]));

// ---- the predicates: declared, well formed; the kinds they read; satisfiable
function walk(t, q, kinds, where) {
  if (!q || typeof q !== 'object') return fail(t, `${where}: a predicate must be an object`);
  const keys = Object.keys(q).filter(k => !['min', 'max', 'distinct'].includes(k));
  if (keys.length !== 1) return fail(t, `${where}: one predicate a node (${Object.keys(q).join(', ')})`);
  const k = keys[0];
  if (!PRED.has(k)) return fail(t, `${where}: predicate ${k} is not declared in vocab.json`);
  if (k === 'all' || k === 'any') { if (!Array.isArray(q[k]) || !q[k].length) return fail(t, `${where}: ${k} needs a list`); q[k].forEach((r, i) => walk(t, r, kinds, `${where}.${k}[${i}]`)); return; }
  if (k === 'not') return walk(t, q.not, kinds, where + '.not');
  if (k === 'count' || k === 'streak' || k === 'best') { if (!DEEDS[q[k]]) fail(t, `${where}: deed ${q[k]} is not declared`); kinds.add(q[k]); if (q.min != null && q.max != null && q.min > q.max) fail(t, `${where}: min above max`); return; }
  if (k === 'skill') { const s = q.skill; if (!(s.fam === 'any' || FAM.has(s.fam))) fail(t, `${where}: no family ${s.fam}`); if (!RANKS.includes(s.rank)) fail(t, `${where}: no rank ${s.rank}`); if (s.lv != null && !(s.lv >= 1 && s.lv <= SV.maxLevel)) fail(t, `${where}: level ${s.lv} past 1-${SV.maxLevel}`); return; }
  if (k === 'age') { if (!Array.isArray(q.age) || q.age.length !== 2 || q.age[0] > q.age[1]) fail(t, `${where}: age is [min, max]`); return; }
  if (k === 'has') { if (!LIST.some(x => x.id === q.has)) fail(t, `${where}: no title ${q.has}`); return; }
  if (k === 'stat') { for (const s of Object.keys(q.stat)) if (!SV.stats.includes(s)) fail(t, `${where}: no stat ${s}`); return; }
  if (k === 'only') { if (!(FAM.has(q.only.measure) || LEGACY.has(q.only.measure)) || q.only.scope !== 'realm') fail(t, `${where}: only { measure: a skill, scope: 'realm' }`); return; }
  if (k === 'ruling') { if (!DEEDS[q.ruling.kind]) fail(t, `${where}: deed ${q.ruling.kind} is not declared`); kinds.add(q.ruling.kind); return; }
}
// an all() that asks a kind's count both at least a and at most b < a can never be met
function contradiction(q) {
  if (!q || !q.all) return null;
  const lo = {}, hi = {};
  for (const r of q.all) if (r.count) { if (r.min != null) lo[r.count] = Math.max(lo[r.count] || 0, r.min); if (r.max != null) hi[r.count] = Math.min(hi[r.count] ?? Infinity, r.max); }
  for (const k in lo) if (hi[k] != null && lo[k] > hi[k]) return k;
  const ages = q.all.filter(r => r.age).map(r => r.age);
  if (ages.length && Math.max(...ages.map(a => a[0])) > Math.min(...ages.map(a => a[1]))) return 'age';
  return null;
}

const ids = new Set();
for (const t of LIST) {
  if (!t.id || !/^[a-z0-9-]+$/.test(t.id)) fail(t, 'an id of lowercase words and hyphens');
  if (ids.has(t.id)) fail(t, 'two titles with one id'); ids.add(t.id);
  if (!t.name) fail(t, 'no name');
  if (!V.rarities.includes(t.rarity)) fail(t, `rarity ${t.rarity} is not one of ${V.rarities.join(', ')} (unique is a flag, not a rarity)`);
  if (!V.weights.includes(t.weight)) fail(t, `weight ${t.weight}`);
  if (!V.kinds.includes(t.kind)) fail(t, `kind ${t.kind}`);
  if (!Array.isArray(t.beings) || !t.beings.length || t.beings.some(b => !V.beings.includes(b))) fail(t, `beings ${t.beings}`);
  if (t.unique !== true && t.unique !== false) fail(t, 'unique must say true or false');
  if (t.per && t.per !== 'realm') fail(t, `per ${t.per}: only 'realm'`);
  if (t.per && !t.unique) fail(t, 'a title per realm is unique in its realm');
  const person = (t.beings || []).includes('person');
  if (person) {
    if (!t.requires) fail(t, 'a person may earn it, so it needs requires');
    if (!Array.isArray(t.watch) || !t.watch.length) fail(t, 'a person may earn it, so it watches a deed kind or month');
    for (const k of t.watch || []) if (k !== 'month' && !DEEDS[k]) fail(t, `watches ${k}, not a declared deed`);
    const kinds = new Set(); walk(t, t.requires, kinds, 'requires');
    const c = contradiction(t.requires); if (c) fail(t, `requires can never be met (${c})`);
    // what the ledger conditions read must wake the check: a watched kind of theirs, or month
    if (!(t.watch || []).includes('month') && ![...kinds].some(k => (t.watch || []).includes(k))) fail(t, `no watched kind wakes its conditions (${[...kinds].join(', ')})`);
    for (const l of t.lose || []) if (!l.deed || !DEEDS[l.deed]) fail(t, `lose: deed ${l && l.deed} is not declared`);
    if (t.weight === 'X') fail(t, 'weight X has no person budget');
    let spend = 0;
    const stat = {};
    for (const e of t.effects || []) {
      if (!V.effectTypes.includes(e.type)) { fail(t, `effect type ${e.type}`); continue; }
      const c2 = cost(e); if (!Number.isFinite(c2)) fail(t, `effect ${JSON.stringify(e)} has no price`); spend += c2;
      if (e.type === 'stat') { if (!SV.stats.includes(e.stat)) fail(t, `stat ${e.stat}`); stat[e.stat] = (stat[e.stat] || 0) + (+e.v || 0); }
      if ((e.type === 'edge' || e.type === 'fight' || e.type === 'growth' || e.type === 'blunder' || e.type === 'surge') && !okTag(e.tag)) fail(t, `tag ${e.tag}`);
      if (e.type === 'fight' && !(SV.effects.fight.parts || []).includes(e.part)) fail(t, `fight part ${e.part}`);
      if (e.type === 'resist' && !SV.effects.resist.of.includes(e.of)) fail(t, `resist ${e.of}`);
      if (e.type === 'aura' && !(SV.effects.aura.of.includes(e.of) && SV.effects.aura.scales.includes(e.scale))) fail(t, `aura ${e.of} ${e.scale}`);
      if (e.type === 'social' && !V.social.includes(e.group)) fail(t, `social group ${e.group}`);
    }
    for (const s in stat) if (stat[s] > V.statMax) fail(t, `+${stat[s]} ${s}: at most +${V.statMax} a stat a title`);
    if (spend > budget(t) + 1e-9) fail(t, `spends ${spend}, over its budget of ${budget(t)} (${t.weight}${t.unique ? ', unique' : ''}${t.rarity === 'legendary' ? ', legendary' : ''})`);
    if (t.hint && /\d/.test(t.hint)) fail(t, 'a hint names nothing exact: no numbers');
  } else if (t.effects && t.effects.length) fail(t, 'person effects on a title no person may hold');
  if (t.buffs && typeof t.buffs !== 'object') fail(t, 'buffs is an object');
}

// ---- the great beings' sheets name their titles by id; holders agree
const legends = J('data/legends.json').legends, masters = J('data/power.json').masters;
const named = new Map();
for (const L of legends.concat(masters)) for (const id of L.titles || []) {
  if (typeof id !== 'string') { bad.push(`${L.id}: titles are ids into data/titles/ (found ${JSON.stringify(id).slice(0, 40)})`); continue; }
  if (!ids.has(id)) bad.push(`${L.id}: no title ${id} in data/titles/`);
  if (!named.has(id)) named.set(id, []); named.get(id).push(L.id);
}
for (const t of LIST) if (t.holders) {
  const want = (named.get(t.id) || []).slice().sort().join(','), got = t.holders.slice().sort().join(',');
  if (want !== got) fail(t, `holders ${got} but the sheets name ${want || 'no one'}`);
  if (t.unique && t.holders.length > 1) fail(t, 'unique, yet more than one holder');
}

// ---- the card choices
for (const c of (V.choices && V.choices.list) || []) for (const k of Object.values(c.on || {})) if (!DEEDS[k]) bad.push(`choices ${c.ev}: deed ${k} is not declared`);
for (const d of V.deedLines || []) if (!DEEDS[d.kind]) bad.push(`deedLines ${d.rx}: deed ${d.kind} is not declared`);

// ---- no screen reads a title's conditions
const RX = /\.(requires|watch)\b/;
const walkDir = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walkDir(path.join(d, e.name)) : [path.join(d, e.name)]));
for (const f of walkDir(path.join(root, 'src')).filter(f => f.endsWith('.js'))) {
  const rel = path.relative(root, f);
  if (!(rel.startsWith('src/ui/') || /view[^/]*\.core\.js$/.test(rel))) continue;
  fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => { if (RX.test(line) && /\b(t|title|T|def|x)\.(requires|watch)\b/.test(line)) bad.push(`${rel}:${i + 1}: a screen reads a title's conditions`); });
}

const deferred = Object.keys(DEEDS).filter(k => DEEDS[k].deferred);
const waiting = LIST.filter(t => t.requires && JSON.stringify(t.requires).match(new RegExp(`"(${deferred.join('|') || '-'})"`))).map(t => t.id);
note.push(`${LIST.length} titles (${LIST.filter(t => (t.beings || []).includes('person')).length} a person may earn), ${Object.keys(DEEDS).length} deed kinds; no source yet: ${deferred.join(', ') || 'none'}${waiting.length ? ` (so ${waiting.join(', ')} cannot be earned in play yet)` : ''}`);
if (process.argv.includes('--json')) console.log(JSON.stringify({ bad, note }, null, 1));
else { for (const n of note) console.log(n); for (const b of bad) console.error('  ' + b); }
if (bad.length) { console.error(`titles: ${bad.length} fault(s)`); process.exitCode = 1; }
else console.log('titles ok');
