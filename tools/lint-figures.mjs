// The figures registry's validator (order 96, D-193; src/world/9999977-figures). Reads data/figures/ against its
// vocab.json and the data every profile names: the bestiary (kinds, world counts, levels), data/classes.json (and the
// branches its generator makes), data/skills/ (ids, ranks, kinds, who may be born with a being's art), data/titles/
// (ids, beings, holders), data/legends.json and data/power.json's masters. Fails on:
//   - a category missing, two with one id or order, a kind or group vocab.json does not have, a file with no category
//   - the fixed counts: 33 ancient demons in the bestiary's four kinds at its world counts (20, 6, 3, 4), sworn to the
//     three Primordial Archdemons, each with a grudge in their disputes; the three ancient dragons, one of each kind; the
//     elder dragons at the bestiary's counts (nine)
//   - a fixed profile without a field of a full profile (id, name, kind, level, class, skills, arts, titles, items,
//     temper, traits, goals, grudges, home, fame, story, secret), or with one its data does not have: a level more than
//     levelSpread from its kind's or at a legend's (800); a class not null for a being or not in the tree; a library
//     skill not in data/skills, past level 10, or one its kind is not born with (the art's acquire: family and magic);
//     an own skill of a rank or kind data/skills/vocab.json does not name; an art readied it does not hold, or not an
//     active or a buff; a title not in data/titles/, not a monster's, or whose holders do not name it; a temper axis
//     past -1..1; a trait the game's people do not have; a goal of a kind A.WHY does not bend; a grudge at no one
//   - a link that drifts: the masters' overlay naming a master power.json lacks (or missing one), a class road that is
//     not a chain of the tree, arts that are not the master's own actives; a legend in no group or in two
//   - a word the naming pass retired (w1, w4), an S1 level word or a percentage in a figure's words; a story line over 60 words
//   node tools/lint-figures.mjs [--json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSkills2 } from './lib/skills2-check.mjs';
import { KINDS as WHY_KINDS, AXES } from '../src/people/engine/why.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const J = f => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
const bad = [], note = [];
const fail = (who, m) => bad.push(`${who}: ${m}`);
const words = s => String(s || '').trim().split(/\s+/).filter(Boolean).length;

const V = J('data/figures/vocab.json'), RAR = J('data/rarity.json');
const BD = J('data/bestiary.json'), SP = new Map(BD.species.map(s => [s.id, s]));
const LD = J('data/legends.json').legends, LEG = new Map(LD.map(l => [l.id, l]));
const MAS = new Map(J('data/power.json').masters.map(m => [m.id, m]));
const CAPS = J('data/power.json').capabilities.map(c => c.k);
const SK = loadSkills2(root), SKV = SK.vocab, SKBY = new Map(SK.skills.map(s => [s.id, s]));
const TFILES = fs.readdirSync(path.join(root, 'data/titles')).filter(f => f.endsWith('.json') && f !== 'vocab.json');
const TBY = new Map(); for (const f of TFILES) for (const t of J('data/titles/' + f).titles || []) TBY.set(t.id, t);
const REALMS = { has: id => /^POL-\d{2}[A-Z]?$/.test(String(id)) };   // the release's realm ids (LORE.realms)

// ---- the class tree: the hand-made classes and the branches its generator makes (as c-classes.core.js makes them)
const CD = J('data/classes.json'), CLS = new Map(CD.classes.map(c => [c.id, { id: c.id, step: c.step, from: c.from }]));
{
  const G = CD.generator, slug = s => String(s).toLowerCase().replace(/[^a-z]+/g, '-');
  for (const r of G.roads) {
    const step2 = [];
    for (const t of G.templates) {
      const id = `${t.key}-${slug(r.noun)}${r.fam === 'melee' ? '-m' : ''}`;
      if (t.step === 2) { CLS.set(id, { id, step: 2, from: [r.base] }); step2.push(id); if (t.master) CLS.set(id + '-master', { id: id + '-master', step: 3, from: [id] }); }
      else CLS.set(id, { id, step: 3, from: CD.classes.filter(c => c.step === 2 && (c.from || []).includes(r.base)).map(c => c.id).concat(step2) });
    }
  }
}
const roadOk = road => Array.isArray(road) && road.length >= 1 && road.every((id, i) => { const c = CLS.get(id); return c && c.step === i + 1 && (c.from || []).includes(i ? road[i - 1] : null); });

// ---- the categories
const files = fs.readdirSync(path.join(root, 'data/figures')).filter(f => f.endsWith('.json') && f !== 'vocab.json').sort();
const WANT = ['rulers', 'great-houses', 'generals', 'order-masters', 'race-masters', 'legends', 'ancient-dragons', 'elder-dragons', 'ancient-demons'];
const CAT = new Map(), orders = new Map();
for (const f of files) {
  const d = J('data/figures/' + f), c = d.category;
  if (!c || !c.id) { fail(f, 'no category'); continue; }
  if (CAT.has(c.id)) fail(f, `a second category ${c.id}`);
  if (!V.kinds.includes(c.kind)) fail(c.id, `kind ${c.kind}`);
  if (!V.groups.some(g => g.id === c.group)) fail(c.id, `group ${c.group}`);
  if (!c.name || !c.note) fail(c.id, 'a name and a note');
  const ok = orders.get(c.group + ':' + c.order); if (ok) fail(c.id, `order ${c.order} shared with ${ok}`); orders.set(c.group + ':' + c.order, c.id);
  if (c.kind === 'generated' && !(d.rule && ['realms', 'houses', 'hosts', 'orders'].includes(d.rule.from))) fail(c.id, 'a generated category names its rule');
  if (c.kind === 'generated' && !(d.rule && ['all', 'realm'].includes(d.rule.known))) fail(c.id, 'a generated category says who knows its figures (all or realm)');
  CAT.set(c.id, d);
}
for (const id of WANT) if (!CAT.has(id)) fail('registry', `no category ${id}`);

// ---- every fixed figure, and the ids the registry holds
const ids = new Map();
const own = (id, where) => { if (ids.has(id)) fail(where, `id ${id} also in ${ids.get(id)}`); else ids.set(id, where); if (SP.has(id) || LEG.has(id) || MAS.has(id)) fail(where, `id ${id} is a bestiary kind, a legend or a master`); };
const FIX = [];
for (const [cid, d] of CAT) if (d.category.kind === 'fixed') for (const f of d.figures || []) { own(f.id, cid); FIX.push([cid, f]); }
const isFig = id => ids.has(id) || MAS.has(id);
const TEXT_BAD = [/\bmarshal/i, /\blev(y|ies)\b/i, /\d\s?%/, /\b(Beginner|Intermediate|Advanced|Expert|Master|Grandmaster|Legend) (I|II|III|IV|V)\b/];
const textOk = (who, s) => { for (const rx of TEXT_BAD) if (rx.test(s)) fail(who, `retired or forbidden words: ${String(s).slice(0, 60)}`); };
const atOk = (g, who) => {
  if (!V.grudgeAt.includes(g.kind)) return fail(who, `grudge kind ${g.kind}`);
  const ok = g.kind === 'figure' ? isFig(g.at) : g.kind === 'legend' ? LEG.has(g.at) : g.kind === 'realm' ? REALMS.has(g.at) : g.kind === 'kind' ? /^[a-z]+$/.test(g.at) : g.kind === 'race' ? ['human', 'elf', 'dwarf', 'orc', 'giant', 'halfelf', 'halforc'].includes(g.at) : !!g.at;
  if (!ok) fail(who, `a grudge at ${g.at} (${g.kind}), who is not one`);
  if (!(g.w > 0 && g.w <= 3) || !g.why) fail(who, `a grudge needs a weight (0-3] and a why`);
};
const goalOk = (g, who) => { if (!V.goalKinds.includes(g.kind) || !WHY_KINDS[g.kind]) fail(who, `goal kind ${g.kind}: not one A.WHY bends`); if (!(g.w > 0 && g.w <= 3) || !g.why) fail(who, 'a goal needs a weight (0-3] and a why'); };
const temperOk = (t, who) => { if (!t || typeof t !== 'object') return fail(who, 'no temper'); for (const a of AXES) if (!(typeof t[a] === 'number' && t[a] >= -1 && t[a] <= 1)) fail(who, `temper ${a} must be in -1..1`); for (const a of Object.keys(t)) if (!AXES.includes(a)) fail(who, `temper axis ${a}`); };
const traitsOk = (t, who) => { if (!Array.isArray(t) || t.length < 2 || t.length > 4) fail(who, 'two to four traits'); for (const x of t || []) if (!V.traits.includes(x)) fail(who, `trait ${x} is not a trait the game's people have`); };
const storyOk = (lines, who, what) => { if (!Array.isArray(lines) || !lines.length) return fail(who, `${what}: at least one line`); for (const l of lines) { if (words(l) > 60) fail(who, `${what}: a line of ${words(l)} words (at most 60)`); textOk(who, l); } };

for (const [cid, f] of FIX) {
  const who = `${cid}/${f.id}`;
  for (const k of ['id', 'name', 'kind', 'level', 'skills', 'arts', 'titles', 'items', 'temper', 'traits', 'goals', 'grudges', 'home', 'fame', 'story', 'secret']) if (f[k] == null) fail(who, `no ${k}`);
  if (!('class' in f)) fail(who, 'no class (null for a being of no road)');
  const s = SP.get(f.kind);
  if (!s) { fail(who, `kind ${f.kind} is not in the bestiary`); continue; }
  if (!(Math.abs(f.level - s.level) <= V.levelSpread)) fail(who, `level ${f.level} more than ${V.levelSpread} from its kind's ${s.level}`);
  let lv = f.level; for (const t of f.titles || []) lv += ((TBY.get(t) || {}).buffs || {}).level || 0;
  if (!(lv < 800)) fail(who, `level ${lv} with its titles: only the legends stand at 800 and above`);
  if (f.class !== null && !CLS.has(f.class)) fail(who, `class ${f.class} not in data/classes.json`);
  if (f.class !== null && ['dragons', 'demons'].includes(s.fam)) fail(who, 'a dragon or a demon holds no class of arms');
  // skills: the library's (an id), and its own (a name, a rank, a kind)
  const held = new Map();
  if (!Array.isArray(f.skills) || f.skills.length < 2) fail(who, 'at least two skills');
  for (const k of f.skills || []) {
    if (!(Number.isInteger(k.lvl) && k.lvl >= 1 && k.lvl <= SKV.maxLevel)) fail(who, `skill ${k.id || k.n}: level ${k.lvl} past 1-${SKV.maxLevel}`);
    if (typeof k.fight !== 'boolean') fail(who, `skill ${k.id || k.n}: fight is true or false`);
    if (k.id) {
      const L = SKBY.get(k.id);
      if (!L) { fail(who, `skill ${k.id} is not in data/skills`); continue; }
      held.set(k.id, L.kind);
      const born = (L.acquire || []).some(a => a.via === 'birth' && a.needs && a.needs.being && (a.needs.being.fam || []).includes(s.fam) && (s.prof.magic || 0) >= (a.needs.being.magic || 0));
      if (!born) fail(who, `skill ${k.id}: a ${s.fam} of magic ${s.prof.magic} is not born with it`);
    } else {
      if (!k.n || !k.does) fail(who, 'an own skill needs a name and what it does');
      if (!SKV.ranks.includes(k.rank)) fail(who, `skill ${k.n}: rank ${k.rank}`);
      if (!SKV.kinds.includes(k.kind)) fail(who, `skill ${k.n}: kind ${k.kind}`);
      held.set(k.n, k.kind); textOk(who, k.does);
    }
  }
  for (const a of f.arts || []) { const kd = held.get(a); if (!kd) fail(who, `art ${a} readied but not held`); else if (!['active', 'buff'].includes(kd)) fail(who, `art ${a} is a ${kd}: only actives and buffs are readied`); }
  for (const t of f.titles || []) {
    const T = TBY.get(t);
    if (!T) { fail(who, `title ${t} not in data/titles/`); continue; }
    if (!(T.beings || []).includes('monster')) fail(who, `title ${t} is not a monster's`);
    if (!(T.holders || []).includes(f.id)) fail(who, `title ${t}: its holders do not name ${f.id}`);
  }
  if (!Array.isArray(f.items) || !f.items.length) fail(who, 'at least one item');
  for (const i of f.items || []) { if (!i.n || !i.kind || !i.does) fail(who, 'an item needs a name, a kind and what it does'); if (!RAR.ladder.includes(i.rarity)) fail(who, `item rarity ${i.rarity}: not a word of the one ladder (data/rarity.json)`); if (i.make != null && !RAR.makes.includes(i.make)) fail(who, `item make ${i.make}`); if ('quality' in i) fail(who, 'an item says rarity and make, not quality (D-200)'); for (const k of Object.keys(i.gives || {})) if (k !== 'power' && !CAPS.includes(k)) fail(who, `item gives ${k}`); textOk(who, i.does); }
  temperOk(f.temper, who); traitsOk(f.traits, who);
  if (!(f.goals || []).length) fail(who, 'at least one goal'); for (const g of f.goals || []) { goalOk(g, who); textOk(who, g.why); }
  if (!(f.grudges || []).length) fail(who, 'at least one grudge'); for (const g of f.grudges || []) { atOk(g, who); textOk(who, g.why); }
  if (!f.home || !f.home.name || !f.home.domain || typeof f.home.known !== 'boolean') fail(who, 'a home: a name, a domain, and whether it is known');
  if (!(f.fame in V.fame)) fail(who, `fame ${f.fame}`);
  storyOk(f.story, who, 'story'); storyOk(f.secret && f.secret.story, who, 'secret');
  textOk(who, f.name + ' ' + (f.style || ''));
}
// titles naming a fixed figure as holder: the figure names it back
for (const T of TBY.values()) for (const h of T.holders || []) if (ids.has(h)) { const f = FIX.find(x => x[1].id === h)[1]; if (!(f.titles || []).includes(T.id)) fail(`title ${T.id}`, `names ${h} as holder, whose sheet does not name it`); }

// ---- the counts
const count = (cid, f) => (CAT.get(cid) ? (CAT.get(cid).figures || []).filter(f).length : 0);
const dem = CAT.get('ancient-demons'), anc = CAT.get('ancient-dragons'), eld = CAT.get('elder-dragons');
if (dem) {
  const list = dem.figures || [];
  if (list.length !== 33) fail('ancient-demons', `${list.length} profiles, not 33`);
  for (const s of BD.species.filter(x => x.tier === 'ancient demon')) { const n = list.filter(f => f.kind === s.id).length; if (n !== s.world) fail('ancient-demons', `${n} of ${s.id}, the bestiary counts ${s.world}`); }
  const AR = ['ghazrul', 'morvane', 'vethrael'];
  for (const f of list) if (!AR.includes(f.liege)) fail(`ancient-demons/${f.id}`, `liege ${f.liege}: one of the three Primordial Archdemons`);
  for (const a of AR) {
    const mine = list.filter(f => f.liege === a);
    if (mine.length < 8) fail('ancient-demons', `${a} has ${mine.length} sworn demons (at least 8)`);
    const rivals = new Set(AR.filter(x => x !== a).concat(list.filter(f => f.liege !== a).map(f => f.id)));
    if (!mine.some(f => (f.grudges || []).some(g => rivals.has(g.at)))) fail('ancient-demons', `no demon of ${a} holds a grudge in the Archdemons' disputes`);
  }
}
if (anc) {
  const want = BD.species.filter(x => x.tier === 'ancient dragon').map(s => s.id).sort(), got = (anc.figures || []).map(f => f.kind).sort();
  if (want.join() !== got.join() || got.length !== 3) fail('ancient-dragons', `kinds ${got.join(', ')}; the bestiary's three are ${want.join(', ')}`);
  for (const f of anc.figures || []) if (f.liege !== 'sarnavoth') fail(`ancient-dragons/${f.id}`, 'serves the King of Dragons');
}
if (eld) {
  for (const s of BD.species.filter(x => x.tier === 'elder dragon')) { const n = (eld.figures || []).filter(f => f.kind === s.id).length; if (n !== s.world) fail('elder-dragons', `${n} of ${s.id}, the bestiary counts ${s.world}`); }
  if ((eld.figures || []).some(f => SP.get(f.kind) && SP.get(f.kind).tier !== 'elder dragon')) fail('elder-dragons', 'a profile of a kind that is not an elder dragon');
}

// ---- the links
const rm = CAT.get('race-masters');
if (rm) {
  const got = (rm.figures || []).map(f => f.id).sort().join(), want = [...MAS.keys()].sort().join();
  if (got !== want) fail('race-masters', `overlays ${got}; power.json's masters are ${want}`);
  for (const f of rm.figures || []) {
    const who = `race-masters/${f.id}`, M = MAS.get(f.id); if (!M) continue;
    if (!roadOk(f.road)) fail(who, `class road ${(f.road || []).join(' > ')} is not a chain of data/classes.json from a first class`);
    const walls = Math.floor(M.level / 100); if ((f.road || []).length > walls) fail(who, `${f.road.length} classes but only ${walls} walls passed at level ${M.level}`);
    for (const a of f.arts || []) { const k = (M.skills || []).find(x => x.n === a); if (!k) fail(who, `art ${a} is not the master's skill`); else if (!['active', 'buff'].includes(k.kind)) fail(who, `art ${a} is a ${k.kind}`); }
    temperOk(f.temper, who); traitsOk(f.traits, who);
    for (const g of f.goals || []) goalOk(g, who); for (const g of f.grudges || []) atOk(g, who);
    if (!(f.goals || []).length || !(f.grudges || []).length) fail(who, 'a goal and a grudge');
    if (!f.home || !f.home.name || typeof f.home.known !== 'boolean') fail(who, 'a home');
    if (!(f.fame in V.fame)) fail(who, `fame ${f.fame}`);
    storyOk(f.story, who, 'story'); storyOk(f.secret && f.secret.story, who, 'secret');
  }
}
const lg = CAT.get('legends');
if (lg) {
  const seen = new Map();
  for (const g of lg.groups || []) for (const id of g.ids || []) { if (!LEG.has(id)) fail('legends', `${id} is not a legend`); if (seen.has(id)) fail('legends', `${id} in two groups`); seen.set(id, g.name); }
  for (const id of LEG.keys()) if (!seen.has(id)) fail('legends', `${id} is in no group`);
  for (const k of lg.secret || []) if (!LD.some(l => l[k] != null)) fail('legends', `secret field ${k} is on no sheet`);
}

note.push(`${CAT.size} categories; fixed: ${[...CAT].filter(([, d]) => d.category.kind === 'fixed').map(([id, d]) => `${id} ${(d.figures || []).length}`).join(', ')}; linked: ${LEG.size} legends, ${MAS.size} masters`);
if (process.argv.includes('--json')) console.log(JSON.stringify({ bad, note }, null, 1));
else { for (const n of note) console.log(n); for (const b of bad) console.error('  ' + b); }
if (bad.length) { console.error(`figures: ${bad.length} fault(s)`); process.exitCode = 1; }
else console.log('figures ok');
