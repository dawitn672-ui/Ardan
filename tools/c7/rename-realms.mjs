// C7 (D-058): the one-time rewrite that gave the source the final realm names, so the page no longer rewrites them as
// it draws (CRITIQUE P6: the renaming hack, archive/c7-realm-renaming-hack/). Kept as the record of how the names were
// carried through; running it again on the renamed source changes nothing.
//
//   node tools/c7/rename-realms.mjs [--dry] [--rules=path/to/names.core.js]
//
// Of the eight realms the hack renamed (Nov 5), four now read like their governments (CRITIQUE N5):
//   POL-32 Sultanate of the Amber Isles -> Sultanate of Ambrel         POL-21 League of the Spice Coast -> Kesh
//   POL-33 Brotherhood of Blackreef     -> Free Port of Corvasse       POL-19 Confederacy of the Sand Clans -> Sahrim Confederacy
//   POL-12 Khanate of the Nine Winds    -> Khanate of Ulun             POL-34 League of the Tusk Clans -> Ughrak Clans
//   POL-13 Highland League              -> League of Brannoch          POL-11 Horde of Gorath (the Horde) -> Gorath
// The rules are the hack's own (they carry the verb agreement, the articles and the words that stay); this script runs them
// over every string of the lore (JSON) and every string and template of the JavaScript source, then turns the hack's
// "Kingdom of Ulun", "Principality of Corvasse", "Kingdom of Brannoch" and "Ughrak Dominion" into the final names, and
// leaves "the Khanate" alone (Ulun is a khanate again).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);
const acorn = require(process.env.ACORN_PATH || '/opt/node-tools/node_modules/acorn');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const DRY = process.argv.includes('--dry');
const rulesFile = arg('rules') || path.join(root, 'archive/c7-realm-renaming-hack/names.core.js');

// the hack's rules, run in a sandbox with just enough page for its constructor
const sb = { A: {}, LORE: { realms: {}, map: { provinces: [] } }, UI: {}, console };
vm.runInNewContext(fs.readFileSync(rulesFile, 'utf8'), sb);
const NM = sb.A.V2NAMES;
NM.RULES.splice(0, NM.RULES.length, ...NM.RULES.filter(r => !(r[0] instanceof RegExp && /Khanate|khanate/.test(r[0].source))));
const VERB = { is: 'are', was: 'were', has: 'have', had: 'had' };
const finals = s => s
  .replace(/\bKingdom of Ulun\b/g, 'Khanate of Ulun')
  .replace(/\bPrincipality of Corvasse\b/g, 'Free Port of Corvasse')
  .replace(/\bKingdom of Brannoch\b/g, 'League of Brannoch')
  .replace(/\b(the |The )?Ughrak Dominion (is|was|has|had)\b/g, (m, a, v) => `${a || ''}Ughrak Clans ${VERB[v]}`)
  .replace(/\bUghrak Dominion\b/g, 'Ughrak Clans');
const fix = s => finals(NM.fix(s));

const stats = { files: 0, strings: 0 };
// ---- JSON: the string values, in the file's own text (its formatting stays) ---------------------------------------------
function jsonFile(file) {
  const s = fs.readFileSync(file, 'utf8');
  let n = 0;
  const out = s.replace(/"(?:[^"\\]|\\.)*"(\s*:)?/g, (m, key) => {
    if (key) return m;
    if (m.length > 4000 && !/\s/.test(m.slice(0, 400))) return m; // the map's picture
    const v = JSON.parse(m), w = fix(v);
    if (w === v) return m;
    n++;
    return JSON.stringify(w);
  });
  if (n && !DRY) fs.writeFileSync(file, out);
  return n;
}
// ---- JavaScript: strings and the text of templates (not code, not regexes, not comments) ----------------------------
const regexHits = [];
function jsFile(file) {
  const src = fs.readFileSync(file, 'utf8');
  if (!NM.PRE.test(src) && !/Khanate|Brotherhood|Dominion/.test(src)) return 0;
  const edits = [];
  const sourceType = /\.mjs$/.test(file) ? 'module' : 'script';
  let toks;
  try { toks = [...acorn.tokenizer(src, { ecmaVersion: 'latest', sourceType, allowHashBang: true, allowReturnOutsideFunction: true })]; }
  catch (e) { console.log('SKIP (parse)', path.relative(root, file), e.message); return 0; }
  for (const t of toks) {
    const ty = t.type.label;
    if (ty === 'string') {
      const raw = src.slice(t.start + 1, t.end - 1), w = fix(raw);
      if (w !== raw) edits.push([t.start + 1, t.end - 1, w]);
    } else if (ty === 'template') {
      const raw = src.slice(t.start, t.end), w = fix(raw);
      if (w !== raw) edits.push([t.start, t.end, w]);
    } else if (ty === 'regexp') {
      const raw = src.slice(t.start, t.end);
      if (NM.PRE.test(raw) || /Khanate|Brotherhood|Dominion/.test(raw)) regexHits.push(`${path.relative(root, file)}:${src.slice(0, t.start).split('\n').length}: ${raw.slice(0, 100)}`);
    }
  }
  if (!edits.length) return 0;
  let out = src;
  for (const [a, b, w] of edits.sort((x, y) => y[0] - x[0])) out = out.slice(0, a) + w + out.slice(b);
  // a string must still parse
  try { acorn.parse(out, { ecmaVersion: 'latest', sourceType, allowHashBang: true, allowReturnOutsideFunction: true }); } catch (e) { console.log('BROKEN', path.relative(root, file), e.message); return 0; }
  if (!DRY) fs.writeFileSync(file, out);
  return edits.length;
}
const SKIP_DIR = new Set(['node_modules', '.git', 'archive']);
function walk(dir, f) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIR.has(e.name)) walk(p, f); } else f(p);
  }
}
const log = [];
walk(path.join(root, 'src'), p => {
  const rel = path.relative(root, p);
  if (/^src\/world\/99999-v2-names\//.test(rel) || /99990-v2-engine/.test(rel)) return;
  let n = 0;
  if (/\.json$/.test(p)) n = jsonFile(p);
  else if (/\.(js|mjs)$/.test(p)) n = jsFile(p);
  if (n) { stats.files++; stats.strings += n; log.push(`${String(n).padStart(4)}  ${rel}`); }
});
console.log(log.join('\n'));
console.log(`${DRY ? 'would change' : 'changed'} ${stats.strings} strings in ${stats.files} files`);
if (regexHits.length) console.log('\nregular expressions that name a realm (read these by hand):\n' + regexHits.join('\n'));
