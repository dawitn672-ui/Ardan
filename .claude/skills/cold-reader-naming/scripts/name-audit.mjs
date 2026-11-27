#!/usr/bin/env node
// The cold-reader naming audit (order 97, order 100 wave 5). Read-only: it changes nothing.
//
//   node tools/build.mjs --out=/tmp/ardan/<me>/x.html --unpack=/tmp/ardan/<me>/blobs
//   node .claude/skills/cold-reader-naming/scripts/name-audit.mjs --blobs=/tmp/ardan/<me>/blobs [--near] [--borrowed]
//        [--top=60] [--json=/tmp/ardan/<me>/names.json] [--word=wyrm,thane]
//
// 1. Buzzwords: every string and template literal of the built page's three blobs (what a player can read, plus some
//    ids and keys) is searched for the fantasy buzzwords and archaisms below, whole words, any case. Prints each word's
//    count, the plain word to use, and two examples. The counts are the bar wave 5 drives down; record them before and
//    after a pass. Words that are also ordinary English (march, fell, elder, shade) are marked "noisy": read the examples.
// 2. Compound epithets: X-born, X-sworn, X-kin, X-bane, X-slayer, X-walker, X-caller, X-breaker, X-weaver, X-singer.
// 3. --near: proper nouns of the lore and data (realms, capitals, houses, cultures, legends, demons, dragons, lore
//    figures) that differ by one letter or share their first four letters with a name of another kind.
// 4. --borrowed: names in data/names.json taken from other works or real places (Tolkien, Warcraft, D&D, real cities).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const has = k => process.argv.includes(`--${k}`);
const require = createRequire(import.meta.url);
const acorn = require(process.env.ACORN_PATH || '/opt/node-tools/node_modules/acorn');

// word -> [plain word to use, noisy?]. Edit this list as the pass learns; keep references/ardan-offenders.md level with it.
const BUZZ = {
  wyrm: ['dragon (a serpent: "great serpent")'], wyrms: ['dragons'], wyrmling: ['young dragon'], wyrmlings: ['young dragons'],
  drake: ['dragon / young dragon'], drakes: ['dragons'], drakeling: ['young dragon'], dragonet: ['young dragon'],
  wyvern: ['lesser dragon (or gloss: "wyvern, a two-legged dragon")'], wyverns: ['lesser dragons'],
  thane: ['baron / lord'], thanes: ['barons / lords'], jarl: ['earl'], jarls: ['earls'], hird: ["household guard / the earl's guard"],
  reeve: ['headman / steward / overseer'], reeves: ['headmen / stewards'], castellan: ['castle keeper / keeper of {castle}'],
  liege: ['lord ("your lord")'], seneschal: ['steward'], hetman: ['chief / captain'], boyar: ['lord'],
  lawspeaker: ['chief judge / speaker of the law'], skald: ['poet / court poet'],
  khan: ['king (order 99) / chief'], khans: ['kings / chiefs'], khatun: ['queen'], khanate: ['kingdom (order 99)'],
  sultan: ['king (order 99)'], sultans: ['kings'], sultanate: ['kingdom (order 99)'], emir: ['prince / lord'], emirs: ['princes / lords'],
  emirate: ['principality (order 99)'], vizier: ['chief minister'], nome: ['district / province'], nomes: ['districts'],
  yam: ['post station / way-station'], caravanserai: ['caravan inn'], kremlin: ['fortress / citadel'], veld: ['grassland'],
  fey: ['fairy / hill folk'], faerie: ['fairy'], eldritch: ['strange / unearthly'], arcane: ['magic / hidden'],
  barrow: ['burial mound / grave mound'], barrows: ['burial mounds'], wight: ['walking dead'], revenant: ['risen dead'],
  wraith: ['ghost'], wraiths: ['ghosts'], lich: ['undead sorcerer'], ettin: ['two-headed giant'], ettins: ['two-headed giants'],
  archdemon: ['demon lord ("one of the three First Demons" for a Primordial)'], archdemons: ['demon lords'],
  primordial: ['first / oldest (gloss it: "the Primordials, the three first demons")'], fiend: ['demon / lesser demon'],
  fiends: ['demons'], imp: ['small demon'], imps: ['small demons'], brimstone: ['sulphur / hellfire'],
  marquis: ['(a noble rank; for a demon say "demon lord")', 1],
  march: ['border country / borderland (for a region)', 1], marches: ['borderlands (for a region)', 1],
  fell: ['hill / moor (for land)', 1], fen: ['marsh'], vale: ['valley'], holt: ['wood'], mere: ['lake', 1], tor: ['hill / crag'],
  dale: ['valley'], weald: ['forest'], warden: ['keeper / guard / captain (say of what)', 1], wardens: ['keepers / guards', 1],
  shade: ['ghost (for the undead)', 1], shades: ['ghosts', 1], rune: ['(fine for magic; gloss what it does)', 1],
  kinsman: ['cousin / relative / man of his family'], kinsmen: ['relatives'], blooded: ['(say what: "has killed a man")'],
  bane: ['killer'], ere: ['before'], nay: ['no'], aye: ['yes'], yon: ['that / over there'], thy: ['your'], thee: ['you'],
  thou: ['you'], whilst: ['while'], unto: ['to'], anon: ['soon'], mayhap: ['perhaps'], betwixt: ['between'],
};
const SUFFIX = ['born', 'sworn', 'kin', 'bane', 'slayer', 'walker', 'caller', 'breaker', 'weaver', 'singer', 'fang', 'hide', 'mane'];
// Names lifted from other works or real places: a cold reader who knows them is thrown out of the world.
const BORROWED = ('Durin Thrain Thror Thorin Oakenshield Khazad Dain Nain Fundin Balin Dwalin Bombur Gloin Oin Anduin Celeborn ' +
  'Elrohir Elrond Galadriel Thranduil Arwen Legolas Gimli Rohan Gondor Mordor Moria Erebor Isildur Elendil Gruumsh Ironforge ' +
  'Blackrock Hammerfell Stormbringer Elric Drizzt Samarkand Tashkent Almaty Basra Madurai Karakorum Bukhar Otrar Thanjavur ' +
  'Halab Attila Jotunheim Utgard Asgard Valhalla Midgard Camelot Avalon').split(' ');

function strings(dir) {
  const out = [];
  const tok = s => {
    try {
      for (const t of acorn.tokenizer(s, { ecmaVersion: 'latest', allowReturnOutsideFunction: true, allowHashBang: true })) {
        const ty = t.type.label;
        if (ty === 'string' || ty === 'template') out.push(String(t.value));
      }
    } catch (e) { /* a chunk that is not JavaScript: skipped */ }
  };
  const f = n => path.join(dir, n);
  if (!fs.existsSync(f('ardan-core.js'))) throw new Error(`no ardan-core.js in ${dir}: build with --unpack=${dir}`);
  tok(fs.readFileSync(f('ardan-core.js'), 'utf8'));
  // the content blob is the event packs joined by a control-character marker; the lore blob is JSON pieces
  for (const ch of fs.readFileSync(f('ardan-content.js'), 'utf8').split(/[\x00-\x08]ARDAN-PACK[\x00-\x08]/)) tok(ch);
  for (const m of fs.readFileSync(f('ardan-lore.js'), 'utf8').matchAll(/"((?:[^"\\]|\\.)*)"/g)) if (m[1].length < 4000) out.push(m[1]);
  return out.filter(x => /\s/.test(x) || /^[A-Z]/.test(x)).join('\n');
}

const report = {};
const blobs = arg('blobs');
if (blobs) {
  const T = strings(blobs);
  const only = arg('word') ? arg('word').split(',') : Object.keys(BUZZ);
  const rows = [];
  for (const w of only) {
    const re = new RegExp(`\\b${w}\\b`, 'gi');
    const ms = [...T.matchAll(re)];
    if (!ms.length) continue;
    const ex = [ms[0], ms[Math.floor(ms.length / 2)]].map(m => T.slice(Math.max(0, m.index - 40), m.index + w.length + 30).replace(/\s+/g, ' '));
    rows.push({ word: w, n: ms.length, plain: (BUZZ[w] || ['?'])[0], noisy: !!(BUZZ[w] || [])[1], ex });
  }
  rows.sort((a, b) => b.n - a.n);
  const top = +(arg('top') || 60);
  console.log(`# Buzzwords and archaisms in ${(T.length / 1e6).toFixed(1)} MB of the page's strings (${rows.reduce((s, r) => s + r.n, 0)} uses)\n`);
  for (const r of rows.slice(0, top)) console.log(`${String(r.n).padStart(5)}  ${r.word.padEnd(13)} -> ${r.plain}${r.noisy ? '   [noisy: also plain English]' : ''}\n         e.g. ...${r.ex[0]}...`);
  console.log('\n# Compound epithets (X-born, X-sworn, ...)\n');
  const comp = {};
  for (const s of SUFFIX) {
    const c = {};
    for (const m of T.matchAll(new RegExp(`\\b[A-Z][a-z]+-?${s}\\b`, 'g'))) c[m[0]] = (c[m[0]] || 0) + 1;
    for (const k of ['Stubborn', 'Household', 'Rowing', 'Knowing']) delete c[k];
    const e = Object.entries(c).sort((a, b) => b[1] - a[1]);
    comp[s] = e;
    if (e.length) console.log(`  -${s.padEnd(8)} ${String(e.reduce((a, x) => a + x[1], 0)).padStart(4)} uses, ${String(e.length).padStart(3)} words: ${e.slice(0, 8).map(x => x.join(':')).join(' ')}`);
  }
  report.buzz = rows; report.compounds = comp;
}

if (has('near')) {
  const L = JSON.parse(fs.readFileSync(path.join(root, 'src/core/release/core/00-lore.json'), 'utf8'));
  const J = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
  const items = [];
  const STRIP = /^(The |the |House |Clan |Kingdom of |Empire of |Sultanate of |Emirate of |Khanate of |Horde of |League of |Halls of |Republic of |Holy See of |Abbey of |Free City of |Free Port of |Principality of |Hall of )/;
  const add = (name, kind) => { if (!name) return; const core = String(name).replace(STRIP, '').replace(STRIP, '').split(/[ ,]/)[0]; if (core.length >= 4) items.push({ name, kind, core: core.toLowerCase() }); };
  for (const r of Object.values(L.realms)) { add(r.short, 'realm'); add(r.capital, 'capital'); }
  for (const h of Object.values(L.houses)) add(h.name, 'house');
  for (const c of Object.values(L.cultures)) add(c.name, 'culture');
  for (const x of J('data/legends.json').legends) add(x.n, 'legend');
  for (const f of ['ancient-demons', 'ancient-dragons', 'elder-dragons']) for (const x of J(`data/figures/${f}.json`).figures) add(x.name, f);
  for (const x of L.figures) add(Array.isArray(x) ? x[1] : x.name, 'lore figure');
  const lev = (a, b) => { const d = [...Array(b.length + 1).keys()]; for (let i = 1; i <= a.length; i++) { let p = d[0]; d[0] = i; for (let j = 1; j <= b.length; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, p + (a[i - 1] === b[j - 1] ? 0 : 1)); p = t; } } return d[b.length]; };
  const out = [], seen = new Set();
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i], b = items[j];
    if (a.kind === b.kind && a.core === b.core) continue;
    if (a.core === b.core && /realm|capital/.test(a.kind) && /realm|capital/.test(b.kind)) continue; // a realm named for its capital
    const demonym = (x, y) => /realm|capital/.test(x.kind) && y.kind === 'culture' && y.core.startsWith(x.core.slice(0, -1));
    if (demonym(a, b) || demonym(b, a)) continue; // Tamar -> Tamari is a people's name made from its realm's: by design
    const d = lev(a.core, b.core);
    const close = (d <= 1) || (a.core.slice(0, 4) === b.core.slice(0, 4) && Math.abs(a.core.length - b.core.length) <= 2 && d <= 3);
    if (!close || a.kind === b.kind && d > 1) continue;
    const key = [a.name, b.name].sort().join('|');
    if (!seen.has(key)) { seen.add(key); out.push(`${a.name} (${a.kind})  ~  ${b.name} (${b.kind})`); }
  }
  console.log(`\n# Near-duplicate proper nouns across kinds (${out.length})\n`);
  console.log(out.map(s => '  ' + s).join('\n'));
  report.near = out;
}

if (has('borrowed')) {
  const N = JSON.parse(fs.readFileSync(path.join(root, 'data/names.json'), 'utf8'));
  const where = new Map();
  const put = (w, arr) => { for (const n of arr || []) if (!where.has(n)) where.set(n, w); };
  for (const k in N.common) put(`common.${k}`, N.common[k]);
  for (const p in N.pools) for (const k in N.pools[p]) put(`${p}.${k}`, N.pools[p][k]);
  const hits = BORROWED.filter(n => where.has(n)).map(n => `${n} (${where.get(n)})`);
  console.log(`\n# Borrowed names in data/names.json (${hits.length}): edit docs/research/c7-name-data.json, then node tools/c7/build-names-data.mjs\n`);
  console.log('  ' + hits.join(', '));
  report.borrowed = hits;
}

if (!blobs && !has('near') && !has('borrowed')) { console.error('usage: --blobs=<dir from build --unpack> [--near] [--borrowed] [--top=N] [--word=a,b] [--json=path]'); process.exit(2); }
if (arg('json')) fs.writeFileSync(arg('json'), JSON.stringify(report, null, 1));
