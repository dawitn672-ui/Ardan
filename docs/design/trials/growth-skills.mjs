// A throwaway count and timing behind docs/design/growth.md (work item G): how many skills do the rules give, what
// does the index cost to build, what does an NPC's skill view cost, and how big is a player's skill record in a save?
// It is not game code and nothing builds from it; the real tables will be data/growth/*.json and the engine
// src/people/engine/skills.js. It reads the repo's own lists (the release's game data and lore) and, for lists that
// E1 and E2 have only designed, the counts those designs give.
//
//   node docs/design/trials/growth-skills.mjs          (from the repo root; no browser, no dependencies)
//
// Result, 2026-11-13 (this container, node 22, five runs): 1,553 skills exist today under other names (28 root
// skills, 10 folded proficiencies, 114 perks, 117 specialisms and the like, 1,284 style techniques); 24 rules over the
// world's own lists give 784 more; 541 template rows and 1,721 signature skills are to be written; 4,599 in all
// (1,698 passive, 2,901 active). The index builds in 3 to 6 ms; an NPC's view of 27 skills costs about 10 microseconds,
// nothing stored and no dice; a player holding 180 skills adds about 4.6 KB to a save (1.6 KB gzipped); the keepers of
// 600 styles 11.7 KB (3.0 KB gzipped).
import fs from 'node:fs';
import vm from 'node:vm';
import zlib from 'node:zlib';

const core = 'src/core/release/core/';
const LORE = JSON.parse(fs.readFileSync(core + '00-lore.json', 'utf8'));
const STYLES = Object.values(JSON.parse(fs.readFileSync('src/core/release/lore/04-styles.json', 'utf8')));
let s15 = fs.readFileSync(core + '15-specialisms-and-promotion.js', 'utf8');
s15 = s15.slice(0, s15.indexOf('A.specOf = '));
const ctx = vm.createContext({ console, LORE, A: {}, window: {}, UI: {} });
vm.runInContext(['02-game-data-a.js', '02-game-data-b.js'].map(f => fs.readFileSync(core + f, 'utf8')).join('\n') + '\n' + s15 + ';globalThis.GD = GD;', ctx);
const GD = ctx.GD;
const n = o => (Array.isArray(o) ? o.length : Object.keys(o || {}).length);

// ---- 1. what exists today, to be re-housed as skills ---------------------------------------------------------------
// the player's sheet folds ten proficiencies into six families (49-body-mind BM.MERGE, 69-every-number-counts LN.MERGE)
const FOLDED = ['dagger', 'dualwield', 'xbow', 'throwing', 'lance', 'mounted', 'siegecraft', 'logistics', 'deception', 'axe'];
const roots = GD.SKILL_LIST.filter(k => !FOLDED.includes(k));
const perks = Object.values(GD.PERKS).reduce((a, L) => a + L.length, 0);
const specs = Object.values(GD.SPECS).reduce((a, L) => a + L.length, 0) + GD.MASTERY.length + n(GD.ARMS) + n(GD.DOCTRINES);
const techs = STYLES.reduce((a, s) => a + s.techniques.length, 0);
const exists = { 'root skills (today\'s proficiencies, as the player sees them)': roots.length, 'folded proficiencies, back as branches': FOLDED.length,
  'perks, as knacks': perks, 'specialisms, masteries, arms, doctrines': specs, 'style techniques, as arts': techs };

// ---- 2. the generation rules: one skill per real thing of the world, per operation ---------------------------------
// E2's forms (docs/design/trials/item-kinds.mjs): 72 weapons (56 for the hand, 16 bows, crossbows and thrown), 15 body
// armours, 15 helms, 8 shields. E1's goods: 40 (DECISIONS D-032). Lists the game has now are counted from its data.
const E2 = { melee: 56, ranged: 16, body: 15, helm: 15, shield: 8 }, GOODS = 40, REALMS = n(GD.DOCTRINE) - 2 + 1; // 34 + Tessaria
const tacticNames = new Set([...Object.values(GD.BATTLE_TACTICS).map(t => t.name.toLowerCase()), ...Object.values(LORE.tactics).map(t => t.name.toLowerCase())]);
const RULES = [
  // id, subjects, operations, kind, routes
  ['wield', E2.melee, ['handle'], 'passive', ['soldier', 'knight', 'outlaw']],
  ['shoot', E2.ranged, ['handle'], 'passive', ['archer', 'hunter']],
  ['wear', 5 + E2.shield, ['carry'], 'passive', ['soldier', 'knight']],                 // 5 classes of armour, 8 shields
  ['mount', 8, ['ride', 'break'], 'passive', ['knight', 'herder']],
  ['make', E2.melee + E2.ranged + E2.body + E2.helm + E2.shield, ['pattern'], 'active', ['crafts']],
  ['good', GOODS, ['judge'], 'passive', ['merchant', 'crafts']],
  ['market', REALMS, ['know'], 'passive', ['merchant', 'courtier']],
  ['road', 9 + 6, ['know'], 'passive', ['merchant', 'sailor', 'outlaw']],               // 9 weather lands, 6 waters
  ['tongue', n(GD.LANG_LIST) + 6, ['speak'], 'passive', ['merchant', 'courtier', 'scholar', 'spy']],
  ['beast', n(LORE.creatures), ['know'], 'passive', ['hunter', 'herder']],
  ['crop', 12, ['raise'], 'passive', ['farmer']],
  ['stock', 10, ['keep', 'breed', 'doctor'], 'passive', ['herder', 'farmer']],
  ['ill', n(GD.DISEASES) + 5, ['treat'], 'active', ['physician']],                      // 7 now, and the kinds E1's plague adds
  ['tactic', tacticNames.size, ['order'], 'active', ['commander']],
  ['drill', 8, ['teach'], 'active', ['soldier', 'commander']],
  ['ground', 8, ['read'], 'passive', ['commander', 'hunter', 'spy', 'outlaw']],
  ['arm', 15, ['lead'], 'passive', ['commander']],                                      // D11's branches
  ['ship', 6, ['hand', 'pilot'], 'passive', ['sailor']],
  ['song', n(LORE.songs) + 8, ['perform'], 'active', ['minstrel']],
  ['rite', n(LORE.faiths), ['naming', 'wedding', 'burial', 'feast'], 'active', ['priest']],
  ['law', 6 + 6, ['know'], 'passive', ['ruler', 'scholar', 'courtier']],                // 6 bodies of law, 6 court customs
  ['staff-post', 17, ['serve'], 'passive', ['commander']],
  ['court-office', 12, ['serve'], 'passive', ['courtier', 'ruler']],
  ['house-post', 8, ['serve'], 'passive', ['crafts', 'courtier']],
];
// ---- 3. templates: a fixed shape, a short row written by hand ---------------------------------------------------------
const TEMPLATES = [
  ['craft operations (28 trades, about 7 each)', 196, 'passive', ['crafts']],
  ['herbs, surgery, wounds by part, nursing', 45, 'active', ['physician']],
  ['locks, pockets, disguises, forgeries, poisons, ciphers', 40, 'active', ['thief', 'spy']],
  ['court forms and dances', 20, 'passive', ['courtier']],
  ['speeches', 24, 'active', ['courtier', 'ruler', 'priest', 'commander', 'merchant', 'minstrel']],
  ['siege works', 10, 'active', ['commander']],
  ['estate works', 16, 'active', ['ruler']],
  ['acts of rule', 12, 'active', ['ruler']],
  ['subjects of study', 16, 'passive', ['scholar']],
  ['sea work', 16, 'passive', ['sailor']],
  ['woodcraft', 12, 'passive', ['hunter', 'outlaw']],
  ['feats of the body', 14, 'passive', ['soldier', 'knight', 'archer', 'hunter', 'sailor']],
  ['household service', 10, 'passive', ['courtier']],
  ['teaching and leading', 8, 'active', ['commander', 'scholar', 'priest']],
  ['games of chance', 6, 'active', ['thief', 'outlaw']],
  ['field and yard work', 20, 'passive', ['farmer', 'herder']],
  ['camp and march', 12, 'passive', ['soldier']],
  ['instruments and the stage', 12, 'active', ['minstrel']],
  ['pastoral works', 10, 'active', ['priest']],
  ['instruments of trade', 14, 'passive', ['merchant']],
  ['the archer\'s craft', 8, 'passive', ['archer']],
  ['the road trade', 10, 'active', ['outlaw']],
  ['tourney and chivalry', 10, 'active', ['knight']],
];
// ---- 4. signature skills: each written whole -----------------------------------------------------------------------------
const NEW_STYLE_ARTS = 8 * 8 + 40 * 5 + 20 * 4 + 40 * 4 + 15 * 8 + 35 * 3;   // orders, houses, companies, folk, drill books, realm accents
const SIGNATURE = [
  ['ways (a root at Master evolves down one of three)', roots.length * 3, 'passive'], ['higher forms of narrow skills', 120, 'passive'], ['merges', 150, 'passive'],
  ['marks of a life (growth and stat passives, each with a cost)', 200, 'passive'], ['born of a people', 28, 'passive'],
  ['family and masters\' secrets', 100, 'passive'], ['common arts of each weapon family', 100, 'active'], ['arts of single weapon forms', 110, 'active'],
  ['arts of the new styles (8 orders, 40 houses, 20 companies, 40 folk, 15 drill books, 35 realm accents)', NEW_STYLE_ARTS, 'active'],
  ['signature arts of legendary pieces', 100, 'active'],
];

// ---- build the index, as the engine would at first use -----------------------------------------------------------------
const t0 = process.hrtime.bigint();
const index = new Map();
const add = (id, kind, src, routes) => { if (index.has(id)) throw new Error('duplicate ' + id); index.set(id, { id, kind, src, routes, lv: 4, fx: null }); };
roots.forEach(k => add('root:' + k, 'passive', 'exists', []));
FOLDED.forEach(k => add('branch:' + k, 'passive', 'exists', []));
for (const k in GD.PERKS) GD.PERKS[k].forEach((p, i) => add(`knack:${k}:${i}`, 'passive', 'exists', []));
for (const c in GD.SPECS) GD.SPECS[c].forEach(s => add(`spec:${c}:${s.k}`, 'passive', 'exists', []));
GD.MASTERY.forEach(s => add('mastery:' + s.k, 'passive', 'exists', []));
for (const k in GD.ARMS) add('arm-of-service:' + k, 'passive', 'exists', []);
for (const k in GD.DOCTRINES) add('doctrine:' + k, 'passive', 'exists', []);
for (const s of STYLES) for (const t of s.techniques) add('art:' + t.id, 'active', 'exists', []);
for (const [id, subjects, ops, kind, routes] of RULES) for (let i = 0; i < subjects; i++) for (const op of ops) add(`${id}:${i}:${op}`, kind, 'rule', routes);
TEMPLATES.forEach(([name, count, kind, routes], t) => { for (let i = 0; i < count; i++) add(`tpl${t}:${i}`, kind, 'template', routes); });
SIGNATURE.forEach(([name, count, kind], t) => { for (let i = 0; i < count; i++) add(`sig${t}:${i}`, kind, 'signature', []); });
const buildMs = Number(process.hrtime.bigint() - t0) / 1e6;

const by = (f) => { const o = {}; for (const s of index.values()) { const k = f(s); o[k] = (o[k] || 0) + 1; } return o; };
console.log('EXISTS TODAY, re-housed');
for (const k in exists) console.log('  ' + String(exists[k]).padStart(5) + '  ' + k);
console.log('GENERATED BY RULE (one skill per real thing, per operation)');
for (const [id, subjects, ops] of RULES) console.log('  ' + String(subjects * ops.length).padStart(5) + '  ' + id + ' (' + subjects + ' x ' + ops.join(', ') + ')');
console.log('TEMPLATES (rows to write)');
for (const [name, count] of TEMPLATES) console.log('  ' + String(count).padStart(5) + '  ' + name);
console.log('SIGNATURE (written whole)');
for (const [name, count] of SIGNATURE) console.log('  ' + String(count).padStart(5) + '  ' + name);
console.log('TOTALS', JSON.stringify(by(s => s.src)), 'all', index.size, JSON.stringify(by(s => s.kind)));
const routes = {};
for (const s of index.values()) for (const r of s.routes) routes[r] = (routes[r] || 0) + 1;
console.log('BY ROUTE (rule and template skills only, before arts, ways, merges and marks; a skill may serve several routes)');
console.log('  ' + Object.entries(routes).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', '));
console.log('distinct tactic names (32 battle tactics + the lore\'s 137):', tacticNames.size);
console.log('index: built in', buildMs.toFixed(1), 'ms;', index.size, 'entries');

// ---- an NPC's skills: a pure view from the seed and the person, nothing stored -----------------------------------------
// A kit is the list of skills a life of that kind would hold (40 here); a hash of seed, person and skill decides which of
// the optional ones this person has and at what level. No dice from the world's stream.
const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
const ids = [...index.keys()];
const kits = Array.from({ length: 60 }, (_, k) => Array.from({ length: 40 }, (_, i) => ids[(hash('kit' + k) + i * 97) % ids.length]));
const view = (seed, p) => {
  const kit = kits[p.kit], out = [];
  for (let i = 0; i < kit.length; i++) {
    const h = hash(seed + '|' + p.id + '|' + kit[i]);
    if (i < 12 || h % 100 < 55) out.push([kit[i], Math.max(1, Math.min(p.rank, 1 + (h >>> 8) % 4))]);
  }
  return out;
};
const people = Array.from({ length: 1000 }, (_, i) => ({ id: 'p' + i, kit: i % 60, rank: 1 + (i % 4) }));
let held = 0;
const t1 = process.hrtime.bigint();
for (let rep = 0; rep < 20; rep++) for (const p of people) held += view(7, p).length;
const viewUs = Number(process.hrtime.bigint() - t1) / 1e3 / (20 * people.length);
const a = JSON.stringify(view(7, people[5])), b = JSON.stringify(view(7, people[5]));
console.log('npc view:', viewUs.toFixed(2), 'microseconds each;', Math.round(held / (20 * people.length)), 'skills held on average; the same twice:', a === b);

// ---- a player's record in a save: id, level, progress, the year last used ----------------------------------------------
const rec = {};
for (let i = 0; i < 180; i++) rec[ids[(i * 53) % ids.length]] = [1 + (i % 4), i % 32, 1100 + (i % 40)];
const raw = JSON.stringify(rec);
console.log('player record, 180 skills:', raw.length, 'bytes;', zlib.gzipSync(raw).length, 'gzipped (real ids are longer words: allow twice this)');
// the styles' keepers: one master, one heir and a state for each of 600 styles
const keep = JSON.stringify(Array.from({ length: 600 }, (_, i) => ['p' + (i * 7), 'p' + (i * 7 + 1), 0]));
console.log('keepers of 600 styles:', keep.length, 'bytes;', zlib.gzipSync(keep).length, 'gzipped');
