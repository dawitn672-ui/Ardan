// The naming guide's checks that a script can make (owner order 52, D-050; the guide is docs/design/growth.md §12).
//   node docs/design/legendaries/src/names.mjs
// 1. Every new name (the ten pieces, their arts and forms; the twenty example arts of growth.md §3.3 and their forms)
//    against the game's own: the lore's arts, forms and manoeuvres, and the houses' words. None may repeat one, none may
//    be "something Wind" (the Khanate's tribes), none may run past three words unless it is a saying, and no word may be
//    shared by two of the ten pieces and arts.
// 2. The lore's own art and form names counted against the three rules a script can check, for §12.7.
// It reads; it changes nothing. Exit code 1 if a new name clashes.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEGENDS } from './index.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const styles = Object.values(JSON.parse(fs.readFileSync(path.join(root, 'src/core/release/lore/04-styles.json'), 'utf8')));
const norm = s => s.toLowerCase().replace(/^the /, '').replace(/[^a-z ]/g, '').trim();
const count = s => s.replace(/[^A-Za-z' -]/g, '').split(/\s+/).filter(Boolean).length;
const lore = new Map();
for (const s of styles) {
  lore.set(norm(s.name), 'the art ' + s.name);
  for (const t of s.techniques || []) lore.set(norm(t.name || t), 'a form of ' + s.name);
  const m = s.maneuver && (typeof s.maneuver === 'string' ? s.maneuver : s.maneuver.name); if (m) lore.set(norm(m), 'the manoeuvre of ' + s.name);
}
const words = new Map(); for (const m of fs.readFileSync(path.join(root, 'src/core/release/lore/02-families.json'), 'utf8').matchAll(/"words":\s*"([^"]+)"/g)) words.set(norm(m[1]), m[1]);
// sayings and oaths of a people, which may run to four words (growth.md §12.1 rule 1)
const SAYINGS = new Set(['iron does not lie']);

const mine = [];
for (const d of LEGENDS) { mine.push(['piece', d.name]); mine.push(['art', d.art]); for (const f of d.forms) mine.push(['form of ' + d.art, f[0]]); }
// the twenty examples, read from growth.md §3.3's table: the art in bold, its forms in italics in the last cell. A row that
// says the art is in the lore today is that art under its old name, so its own forms are the lore's and are not clashes.
const g = fs.readFileSync(path.join(root, 'docs/design/growth.md'), 'utf8'), sec = g.slice(g.indexOf('### 3.3 '), g.indexOf('### 3.4 '));
let examples = 0;
for (const row of sec.split('\n')) {
  const m = /^\| \*\*([^*]+)\*\* \|(.*)\|\s*$/.exec(row); if (!m) continue; examples++;
  const cells = m[2].split('|'), inLore = /in the lore today/.test(cells[0]);
  mine.push([inLore ? 'example (in the lore under its old name)' : 'example', m[1], inLore]);
  for (const f of cells[cells.length - 1].matchAll(/\*([^*]+)\*/g)) mine.push(['form of ' + m[1], f[1].replace(/^the /, ''), inLore]);
}

let bad = 0; const seen = new Map();
for (const [kind, n, inLore] of mine) {
  const k = norm(n);
  if (lore.has(k) && !inLore) { console.log(`IN THE LORE   ${kind}: ${n} is ${lore.get(k)}`); bad++; }
  if (words.has(k)) console.log(`note          ${kind}: ${n} is also a house's words ("${words.get(k)}")`);
  if (/\bwinds?\b/i.test(n)) { console.log(`A WIND        ${kind}: ${n}`); bad++; }
  if (count(n) > 3 && !SAYINGS.has(k) && !inLore) { console.log(`TOO LONG      ${kind}: ${n}`); bad++; }
  if (seen.has(k) && seen.get(k) !== kind && !/^form of/.test(kind) === !/^form of/.test(seen.get(k))) console.log(`note          ${n} is used twice: ${seen.get(k)}; ${kind}`);
  seen.set(k, kind);
}
const heads = {}; for (const d of LEGENDS) for (const n of [d.name, d.art]) for (const w of n.toLowerCase().split(/[\s-]+/)) (heads[w] = heads[w] || []).push(n);
const shared = Object.entries(heads).filter(e => e[1].length > 1);
for (const [w, ns] of shared) { console.log(`SHARED WORD   "${w}": ${ns.join(', ')}`); bad++; }
console.log(`${mine.length} new names (${LEGENDS.length} pieces, ${LEGENDS.length} arts and their forms; ${examples} example arts and their forms) against ${lore.size} names in the lore and ${words.size} houses' words: ${bad} clashes`);

// ---- the lore against the guide
const WEAPON = /\b(swords?|blades?|lances?|spears?|bows?|axes?|hammers?|knife|knives|bills?|shields?|maces?|pikes?|bolts?|arrows?|daggers?|sab(?:re|er)s?|clubs?|staff|glaives?|halberds?|javelins?|slings?|crossbows?|longbows?)\b/i, POSS = /'s\b|s'\b/;
const tally = names => { const long = names.filter(n => count(n) > 3).length, weap = names.filter(n => WEAPON.test(n)).length, poss = names.filter(n => POSS.test(n)).length, any = names.filter(n => count(n) > 3 || WEAPON.test(n) || POSS.test(n)).length; return `${names.length} names · break at least one rule ${any} · longer than three words ${long} · a weapon word ${weap} · a possessive ${poss}`; };
const forms = []; for (const s of styles) for (const t of s.techniques || []) forms.push(t.name || t);
const dup = {}; for (const n of forms) dup[n] = (dup[n] || 0) + 1;
console.log('the lore\'s arts:  ' + tally(styles.map(s => s.name)));
console.log('the lore\'s forms: ' + tally(forms) + ` · used by more than one art ${Object.values(dup).filter(c => c > 1).length}`);
process.exitCode = bad ? 1 : 0;
