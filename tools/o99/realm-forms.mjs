// Order 99 (D-206): the one-time rewrite that gave today's realms the five forms the owner allows: kingdom, empire,
// principality, merchant republic, free city. No sultanate, emirate, khanate, confederacy, league, holy see, abbey, halls
// or free port is left as a realm's form. Kept as the record of how the words were carried through; running it again on
// the rewritten source changes nothing (every rule's old words are gone).
//
//   node tools/o99/realm-forms.mjs [--dry] [--list=path]   (--list writes every change, old and new, for review)
//
// What it does:
//   1. the realms' own fields in the lore (name, title, type, gov, form) and their rulers' styles (titlesByRealm), by hand
//      below (REALM);
//   2. the words, by the rules below, over every string of the lore (JSON, its formatting kept) and every string and
//      template of the JavaScript source (not code, not regular expressions, not comments). A rule may hold only where the
//      string speaks of one realm: in the lore that is the record's own realm (a house, a person, a style, a realm's entry)
//      or a name of the realm in the string; in the code, a name in the string or the realm-customs entry it sits in.
// The Horde of Gorath and the Ughrak Clans (POL-11, POL-34) are another builder's (orcs, order 98) and are left alone.
// The save migration that carries old games over uses the same rules: src/world/9999940-realm-forms/b-forms.core.js.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);
const acorn = require(process.env.ACORN_PATH || '/opt/node-tools/node_modules/acorn');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const DRY = process.argv.includes('--dry');
const LIST = arg('list');

// the rules are the feature's own, so the game and this tool cannot drift apart
const rulesFile = path.join(root, 'src/world/9999940-realm-forms/a-rules.core.js');
const vm = await import('node:vm');
const sb = { A: {} };
vm.runInNewContext(fs.readFileSync(rulesFile, 'utf8'), sb);
const RF = sb.A.REALM_FORMS;

// ---- 1. the realms' own fields ------------------------------------------------------------------------------------
const loreFile = path.join(root, 'src/core/release/core/00-lore.json');
const LORE = JSON.parse(fs.readFileSync(loreFile, 'utf8'));

// ---- 2. the words -----------------------------------------------------------------------------------------------------
const changes = [];
const stats = { files: 0, strings: 0 };
// the realm a lore record belongs to, from its path in the file
const houseRealm = id => (LORE.houses[id] || {}).realm || null;
function recordRealm(file, p) {
  const base = path.basename(file);
  if (base === '00-lore.json') {
    if ((p[0] === 'realms' || p[0] === 'titlesByRealm' || p[0] === 'rulerHistory') && /^POL-/.test(p[1])) return p[1];
    if (p[0] === 'houses' && p[1]) return houseRealm(p[1]);
    if ((p[0] === 'bloodlines' || p[0] === 'schools') && p[1] != null) { const o = LORE[p[0]][p[1]]; return o && o.realm || null; }
    return null;
  }
  if (base === '01-cast.json' && p[0]) return (CAST[p[0]] || {}).realm || null;
  if (base === '02-families.json' && p[0]) { const m = /^FX(\d\d)-/.exec(p[0]); return m ? 'POL-' + m[1] : null; }
  if (base === '03-houseDeep.json' && p[0]) return houseRealm(p[0]);
  if (base === '04-styles.json' && p[0]) { const m = /^ST(\d\d)-/.exec(p[0]); return m ? 'POL-' + m[1] : null; }
  if (base === '05-academies.json' && /^POL-/.test(p[0] || '')) return p[0];
  return null;
}
const CAST = JSON.parse(fs.readFileSync(path.join(root, 'src/core/release/lore/01-cast.json'), 'utf8'));

// a JSON file's strings with their paths, rewritten in the file's own text (its formatting stays)
function jsonFile(file) {
  const s = fs.readFileSync(file, 'utf8');
  const out = [];
  const stack = []; // { t: 'o'|'a', key, i, wantKey }
  let i = 0, last = 0, n = 0;
  const pathNow = () => stack.map(f => (f.t === 'o' ? f.key : f.i));
  while (i < s.length) {
    const c = s[i];
    if (c === '"') {
      let j = i + 1;
      while (s[j] !== '"') j += s[j] === '\\' ? 2 : 1;
      const raw = s.slice(i, j + 1), top = stack[stack.length - 1];
      if (top && top.t === 'o' && top.wantKey) { top.key = JSON.parse(raw); top.wantKey = false; }
      else if (!(raw.length > 4000 && !/\s/.test(raw.slice(0, 400)))) { // (not the map's picture)
        const v = JSON.parse(raw), p = pathNow();
        const w = RF.fix(v, recordRealm(file, p), { file: path.relative(root, file), path: p.join('.') });
        if (w !== v) { out.push(s.slice(last, i), JSON.stringify(w)); last = j + 1; n++; changes.push([path.relative(root, file) + ' ' + p.join('.'), v, w]); }
      }
      i = j + 1; continue;
    }
    if (c === '{') stack.push({ t: 'o', key: null, wantKey: true });
    else if (c === '[') stack.push({ t: 'a', i: 0 });
    else if (c === '}' || c === ']') stack.pop();
    else if (c === ',') { const top = stack[stack.length - 1]; if (top.t === 'a') top.i++; else top.wantKey = true; }
    i++;
  }
  out.push(s.slice(last));
  if (n && !DRY) fs.writeFileSync(file, out.join(''));
  return n;
}

// a JavaScript file's strings and templates
const regexHits = [];
function jsFile(file) {
  const src = fs.readFileSync(file, 'utf8');
  if (!RF.ANY.test(src)) return 0;
  const edits = [];
  const sourceType = /\.mjs$/.test(file) ? 'module' : 'script';
  let toks;
  try { toks = [...acorn.tokenizer(src, { ecmaVersion: 'latest', sourceType, allowHashBang: true, allowReturnOutsideFunction: true })]; }
  catch (e) { console.log('SKIP (parse)', path.relative(root, file), e.message); return 0; }
  // the realm-customs entries (D['POL-17'] = {...}): the realm a string sits under
  const marks = [...src.matchAll(/D\[['"](POL-\d\d)['"]\]\s*=/g)].map(m => [m.index, m[1]]);
  const under = at => { let r = null; for (const [ix, id] of marks) if (ix < at) r = id; else break; return r; };
  for (const t of toks) {
    const ty = t.type.label;
    if (ty === 'string' || ty === 'template') {
      const a = ty === 'string' ? t.start + 1 : t.start, b = ty === 'string' ? t.end - 1 : t.end;
      const raw = src.slice(a, b), w = RF.fix(raw, under(t.start), { file: path.relative(root, file), at: src.slice(0, t.start).split('\n').length });
      if (w !== raw) { edits.push([a, b, w]); changes.push([`${path.relative(root, file)}:${src.slice(0, t.start).split('\n').length}`, raw, w]); }
    } else if (ty === 'regexp') {
      const raw = src.slice(t.start, t.end);
      if (RF.ANY.test(raw)) regexHits.push(`${path.relative(root, file)}:${src.slice(0, t.start).split('\n').length}: ${raw.slice(0, 100)}`);
    }
  }
  if (!edits.length) return 0;
  let out = src;
  for (const [a, b, w] of edits.sort((x, y) => y[0] - x[0])) out = out.slice(0, a) + w + out.slice(b);
  try { acorn.parse(out, { ecmaVersion: 'latest', sourceType, allowHashBang: true, allowReturnOutsideFunction: true }); } catch (e) { console.log('BROKEN', path.relative(root, file), e.message); return 0; }
  if (!DRY) fs.writeFileSync(file, out);
  return edits.length;
}

const SKIP_DIR = new Set(['node_modules', '.git', 'archive', 'figure']);
// the names feature's migration table and test, this feature (its rules and migration hold the old words on purpose), the
// v2 bundle (rebuilt from src/*/engine), and the orcs' own lands (another builder's)
const SKIP_FILE = /^src\/world\/(999981-names-and-cultures|9999940-realm-forms)\/|99990-v2-engine|\/test\.mjs$|bench\.mjs$|^src\/core\/release\/core\/03-engine-base\.js$|^src\/events\/(54-character-voices\/voices|97-first-life-fixes\/h-words)\.core\.js$|^src\/map\/70-fresh-realms-and-tensions\/fresh\.core\.js$/;
// (03-engine-base's rulerStyle, the voices' and h-words' word pairs and 70's breakaway styles were rewritten by hand)
function walk(dir, f) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIR.has(e.name)) walk(p, f); } else f(p);
  }
}
const log = [];
walk(path.join(root, 'src'), p => {
  const rel = path.relative(root, p);
  if (SKIP_FILE.test(rel)) return;
  let n = 0;
  if (/\.json$/.test(p)) n = jsonFile(p);
  else if (/\.(js|mjs)$/.test(p)) n = jsFile(p);
  if (n) { stats.files++; stats.strings += n; log.push(`${String(n).padStart(4)}  ${rel}`); }
});
console.log(log.join('\n'));
console.log(`${DRY ? 'would change' : 'changed'} ${stats.strings} strings in ${stats.files} files`);
if (regexHits.length) console.log('\nregular expressions that name a form (read these by hand):\n' + regexHits.join('\n'));
if (LIST) {
  // each change as the words around it, old and new
  const lines = [];
  for (const [where, a, b] of changes) {
    lines.push(`## ${where}`);
    // show only the changed stretch of a long string
    let s = 0; while (s < a.length && a[s] === b[s]) s++;
    let ea = a.length, eb = b.length; while (ea > s && eb > s && a[ea - 1] === b[eb - 1]) { ea--; eb--; }
    const lo = Math.max(0, s - 90);
    lines.push('- ' + a.slice(lo, Math.min(a.length, ea + 60)).replace(/\n/g, ' '));
    lines.push('+ ' + b.slice(lo, Math.min(b.length, eb + 60)).replace(/\n/g, ' '));
  }
  fs.writeFileSync(LIST, lines.join('\n') + '\n');
}
