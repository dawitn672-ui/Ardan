// M1 (order 71, D-151): the world's words held to the one map. Every text that says a realm is on the coast, on a named sea
// or river, high, open grass, dry, wooded, lake country, north, south, east or west, or beside a named neighbour is read
// against the map's facts (data/map/one-continent.json, written by tools/m1/facts.mjs from the built map). The rules are in
// tools/lib/lore-map.mjs.
// Sources: the release's lore (src/core/release/core/00-lore.json, src/core/release/lore/*.json), data/**/*.json, and the
// string literals of every built source file (src/**/*.js: event packs, the release's content, customs, scenes).
// A text keyed by a realm (its Codex entry, its titles, a house of it, an object keyed 'POL-xx' in code) is that realm's own.
// The count of claims the map denies may only fall: tests/lore-map-baseline.json (M1 ends at 0).
//   node tools/lint-lore-map.mjs [--list] [--json=out.json] [--inventory=out.md] [--write-baseline] [--facts=path]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { realmMatcher, check } from './lib/lore-map.mjs';
import { featureDirs, featurePath } from './lib/features.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), opt = k => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };
const FACTS = path.resolve(root, opt('facts') || 'data/map/one-continent.json');
const BASE = path.join(root, 'tests/lore-map-baseline.json');
const D = JSON.parse(fs.readFileSync(FACTS, 'utf8')), F = D.facts;
if (!F || !F.realms) { console.error(`lint-lore-map: ${path.relative(root, FACTS)} has no realm facts; run node tools/m1/facts.mjs <built.html>`); process.exit(1); }
const LORE = JSON.parse(fs.readFileSync(path.join(root, 'src/core/release/core/00-lore.json'), 'utf8'));
const M = realmMatcher(LORE);
const REALM = /^POL-\d\d[A-Z]?$/;

const found = [];   // every claim: { file, where, realm, kind, word, why, sentence }
// the Codex's own words of a realm (its entry, its titles, its people's and race's homelands) are held strictly: compass
// place, and its own ground; elsewhere a land word may name the land beside it (tools/lib/lore-map.mjs)
const CODEX = /^(realms|titlesByRealm|cultures|racesLore)\b/;
const add = (file, where, text, owner) => {
  if (typeof text !== 'string' || text.length < 12 || !/\s/.test(text)) return;
  for (const c of check(text, owner && F.realms[owner] ? owner : null, M, F, { codex: /00-lore\.json$/.test(file) && CODEX.test(where) })) found.push({ file, where, realm: c.realm, kind: c.kind, word: c.word, why: c.why, sentence: c.sentence });
};
// walk a JSON value: strings with their path; an object with a realm field (or keyed by a realm) owns its strings
const walk = (file, v, where, owner) => {
  if (typeof v === 'string') return add(file, where, v, owner);
  if (Array.isArray(v)) return v.forEach((x, i) => walk(file, x, where + '[' + i + ']', owner));
  if (v && typeof v === 'object') {
    const own = typeof v.realm === 'string' && REALM.test(v.realm) ? v.realm : owner;
    for (const k of Object.keys(v)) { if (/^(color|id|capId|seatId|rle|terrainJpg|m|f)$/.test(k)) continue; walk(file, v[k], where + '.' + k, REALM.test(k) ? k : own); }
  }
};

// 1. the release's lore
const rel = p => path.relative(root, p);
const lorePath = path.join(root, 'src/core/release/core/00-lore.json');
for (const k of Object.keys(LORE)) { if (k === 'map' || k === 'terrainJpg') continue; walk(rel(lorePath), LORE[k], k, null); }
// the map as written: each province's words are the release's own, kept for old saves; not texts (left out)
const loreDir = path.join(root, 'src/core/release/lore');
for (const f of fs.readdirSync(loreDir).filter(f => f.endsWith('.json')).sort()) walk(rel(path.join(loreDir, f)), JSON.parse(fs.readFileSync(path.join(loreDir, f), 'utf8')), f.replace(/\.json$/, ''), null);
// 2. data
const dataFiles = []; (function rd(d) { for (const f of fs.readdirSync(d).sort()) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) rd(p); else if (f.endsWith('.json')) dataFiles.push(p); } })(path.join(root, 'data'));
for (const p of dataFiles) { if (/map[\\/]one-continent\.json$/.test(p)) continue; walk(rel(p), JSON.parse(fs.readFileSync(p, 'utf8')), path.basename(p, '.json'), null); }
// 3. code: the string literals of every built source file
const LIT = /"((?:[^"\\\n]|\\.){12,})"|'((?:[^'\\\n]|\\.){12,})'|`((?:[^`\\]|\\.){12,})`/g;
const KEY = /['"](POL-\d\d[A-Z]?)['"]\s*:|\[\s*['"](POL-\d\d[A-Z]?)['"]\s*\]\s*=(?!=)/g;   // 'POL-01': { ... } or D['POL-01'] = { ... }
const codeFiles = [];
const addDir = d => { if (!fs.existsSync(d)) return; for (const f of fs.readdirSync(d).sort()) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) { if (!/^(engine|node_modules)$/.test(f)) addDir(p); } else if (/\.js$/.test(f)) codeFiles.push(p); } };
addDir(path.join(root, 'src/core/release/core')); addDir(path.join(root, 'src/core/release/content'));
for (const d of featureDirs()) { const p = featurePath(d); if (fs.existsSync(path.join(p, '.wip'))) continue; for (const f of fs.readdirSync(p).sort()) if (/\.js$/.test(f)) codeFiles.push(path.join(p, f)); }
for (const p of codeFiles) {
  const src = fs.readFileSync(p, 'utf8'), keys = []; let k;
  KEY.lastIndex = 0; while ((k = KEY.exec(src))) keys.push([k.index, k[1] || k[2]]);
  const lineAt = i => src.slice(0, i).split('\n').length;
  // an event's span (from its id: to the next) and the one realm its condition asks for (C.realm(p, "POL-xx")): its words
  // of "your land" are that realm's
  const evAt = []; const ID = /\bid:\s*["'`]/g; let e;
  while ((e = ID.exec(src))) evAt.push(e.index);
  const evOwner = evAt.map((a, i) => { const span = src.slice(a, i + 1 < evAt.length ? evAt[i + 1] : src.length); const ids = new Set(); for (const c of span.matchAll(/C\.realm\(p,\s*([^)]*)\)/g)) for (const r of c[1].matchAll(/POL-\d\d[A-Z]?/g)) ids.add(r[0]); return ids.size === 1 ? [...ids][0] : null; });
  LIT.lastIndex = 0; let m;
  while ((m = LIT.exec(src))) {
    const t = (m[1] || m[2] || m[3] || '').replace(/\$\{[^}]*\}/g, '…').replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\\"/g, '"');
    if (!/[a-z] [a-z]/i.test(t)) continue;
    // a match that runs across code between two quotes (the release's content is one line a function) is not a text
    if (/=>|&&|\|\||\(p,\s*C\)|\b(cond|fx|setup|choices|text|title|id):|\bA\.\w+\(/.test(t)) continue;
    // a realm-keyed entry owns what follows it until another kind of key opens (an object of creatures or of wilds after a
    // table of realms is not the last realm's)
    let owner = null, at = -1; for (const [i, id] of keys) { if (i > m.index) break; if (m.index - i < 4000) { owner = id; at = i; } }
    if (owner) {
      const ls = src.lastIndexOf('\n', at) + 1, ind = (/^\s*/.exec(src.slice(ls, at)) || [''])[0].length;
      for (const line of src.slice(src.indexOf('\n', at) + 1, m.index).split('\n')) {
        const li = (/^\s*/.exec(line) || [''])[0].length;
        if (li <= ind && /^\s*(?:["']?[A-Za-z_][\w-]*["']?\s*:\s*[\[{"']|[A-Za-z_]\w*\s*=\s*|D\[)/.test(line) && !/^\s*["']?POL-\d\d/.test(line)) { owner = null; break; }
      }
    }
    if (!owner && evAt.length) { let j = -1; for (let q = 0; q < evAt.length && evAt[q] <= m.index; q++) j = q; if (j >= 0) owner = evOwner[j]; }
    add(rel(p), 'line ' + lineAt(m.index), t, owner);
  }
}

const bad = found.filter(x => x.why);
const byFile = {}; for (const x of found) { const b = byFile[x.file] = byFile[x.file] || { claims: 0, bad: 0, kinds: {} }; b.claims++; if (x.why) b.bad++; b.kinds[x.kind] = (b.kinds[x.kind] || 0) + 1; }
const base = fs.existsSync(BASE) ? JSON.parse(fs.readFileSync(BASE, 'utf8')) : { violations: 0 };
if (opt('json')) fs.writeFileSync(path.resolve(opt('json')), JSON.stringify({ facts: rel(FACTS), map: F.seed + ' v' + F.map, claims: found.length, violations: bad.length, byFile, bad }, null, 1) + '\n');
if (opt('inventory')) {
  const rows = Object.entries(byFile).sort((a, b) => b[1].claims - a[1].claims);
  const L = [`| File | Claims | Denied by the map | Kinds |`, `| --- | ---: | ---: | --- |`];
  for (const [f, b] of rows) L.push(`| \`${f}\` | ${b.claims} | ${b.bad} | ${Object.entries(b.kinds).sort((x, y) => y[1] - x[1]).map(([k, n]) => `${k} ${n}`).join(', ')} |`);
  fs.writeFileSync(path.resolve(opt('inventory')), L.join('\n') + '\n');
}
if (args.includes('--list')) for (const x of bad) console.log(`${x.file} ${x.where}: [${x.realm} ${x.kind} "${x.word}"] ${x.why}\n    ${x.sentence}`);
const kinds = {}; for (const x of bad) kinds[x.kind] = (kinds[x.kind] || 0) + 1;
console.log(`lint-lore-map: ${found.length} claims about the realms' ground in ${Object.keys(byFile).length} files; ${bad.length} the map denies (${Object.entries(kinds).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ') || 'none'}); baseline ${base.violations}, map ${F.seed} v${F.map}`);
if (args.includes('--write-baseline')) { fs.writeFileSync(BASE, JSON.stringify({ violations: bad.length, note: 'tools/lint-lore-map.mjs: the claims about a realm\'s ground, seas, rivers, compass place and neighbours that the one map denies. It may only fall; M1 (order 71, D-151) ends at 0.' }, null, 1) + '\n'); console.log('wrote the baseline: ' + bad.length); }
else if (bad.length > base.violations) { console.error(`lint-lore-map: ${bad.length} claims the map denies, more than the baseline's ${base.violations} (--list shows them)`); process.exit(1); }
