// M1 lore pass (D-155): applies tools/m1/lore-edits.mjs to the lore and writes docs/design/m1/lore-changes.md, the owner's
// list of every change (the old words, the new words, by file, and why). An edit already applied is skipped, so the tool
// can run again; one whose old words cannot be found (and are not already replaced) stops it. A JSON file must still read.
//   node tools/m1/lore-apply.mjs [--check]     (--check: change nothing, say what would change)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { EDITS } from './lore-edits.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CHECK = process.argv.includes('--check');
// the lore before the pass (the commit before it), on which every edit is replayed to count its places for the owner's list
const BASE = (process.argv.find(a => a.startsWith('--base=')) || '--base=012bdea7').slice(7);
const count = (s, sub) => { let n = 0, i = 0; while ((i = s.indexOf(sub, i)) >= 0) { n++; i += sub.length; } return n; };
// one pass of the edits over the texts read by `read`: an edit is applied when its new words stand and its old words are
// gone or inside them (an insertion keeps its anchor), so the tool can run again
function pass(read) {
  const files = new Map(), done = [], bad = [];
  for (const e of EDITS) {
    const p = path.join(root, e.file);
    if (!files.has(p)) files.set(p, read(e.file));
    let s = files.get(p);
    const n = count(s, e.old), m = count(s, e.new);
    if (m > 0 && (n === 0 || e.new.includes(e.old))) { done.push(Object.assign({ n: 0, state: 'applied' }, e)); continue; }
    if (n === 0) {
      if (e.optional) { done.push(Object.assign({ n: 0, state: 'absent' }, e)); continue; }
      bad.push(`${e.file}: not found: ${e.old.slice(0, 120)}`); continue;
    }
    if (!e.all && n !== 1) { bad.push(`${e.file}: ${n} places, one wanted: ${e.old.slice(0, 120)}`); continue; }
    s = s.split(e.old).join(e.new);
    files.set(p, s);
    done.push(Object.assign({ n, state: 'now' }, e));
  }
  return { files, done, bad };
}
const { files, done, bad } = pass(f => fs.readFileSync(path.join(root, f), 'utf8'));
let base = null;
try { base = pass(f => execFileSync('git', ['show', `${BASE}:${f}`], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 })); } catch (e) { console.error(`lore-apply: cannot read the lore at ${BASE} (${e.message.split('\n')[0]}); places are counted as they stand now`); }
// each edit as the replay on the lore before the pass found it: its places, and whether it changed anything there
if (base) done.forEach((e, i) => { const b = base.done[i]; if (b && b.state === 'now') { e.n = b.n; e.made = true; } });
if (bad.length) { console.error('lore-apply: ' + bad.join('\n  ')); process.exit(1); }
for (const [p, s] of files) if (/\.json$/.test(p)) JSON.parse(s);
if (!CHECK) for (const [p, s] of files) fs.writeFileSync(p, s);

// the owner's list: every edit that has taken effect, by file
const byFile = new Map();
for (const e of done) { if (e.state === 'absent' || (base && !e.made && e.state !== 'now')) continue; if (!byFile.has(e.file)) byFile.set(e.file, []); byFile.get(e.file).push(e); }
const esc = t => String(t).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const L = ['# M1: what the lore says now (order 71; D-151, D-153, D-155)', '',
  'Every change made to the world\'s words to bring them into line with the one map, map version 4 (`docs/design/m1/map-design.md`, section 7).',
  'Each row gives the old words, the new words and why. "Places" counts how many times the old words stood in that file. Written by',
  '`node tools/m1/lore-apply.mjs` from `tools/m1/lore-edits.mjs`. `tools/lint-lore-map.mjs` holds the words to the map from now on.',
  '', `**${[...byFile.values()].reduce((a, l) => a + l.length, 0)} changes in ${byFile.size} files.**`, ''];
for (const [f, list] of [...byFile].sort()) {
  L.push(`## \`${f}\``, '', '| Old words | New words | Places | Why |', '| --- | --- | ---: | --- |');
  for (const e of list) L.push(`| ${esc(e.old)} | ${esc(e.new)} | ${e.n || 1} | ${esc(e.why)} |`);
  L.push('');
}
// the names the map itself gives in play: no lore text changes, the game shows the place by its new name (D-061's oasis
// rule on map version 4; a house's seat is found by either name and shown by the new, A.provOfSeat and A.seatName)
{
  const facts = JSON.parse(fs.readFileSync(path.join(root, 'data/map/one-continent.json'), 'utf8'));
  const lore = JSON.parse(fs.readFileSync(path.join(root, 'src/core/release/core/00-lore.json'), 'utf8'));
  const fams = JSON.parse(fs.readFileSync(path.join(root, 'src/core/release/lore/02-families.json'), 'utf8'));
  const prov = new Map((lore.map && lore.map.provinces || []).map(p => [String(p.id), p]));
  const rows = Object.entries(facts.names || {}).map(([id, now]) => {
    const p = prov.get(id) || {}, was = p.name || '?', realm = (lore.realms[p.realm] || {}).name || p.realm || '';
    const seats = Object.entries(fams).filter(([, f]) => f && f.seat === was).map(([fid, f]) => `${f.name} (${fid})`);
    return `| ${esc(was)} | ${esc(now)} | ${esc(realm)} | ${seats.length ? esc(seats.join('; ')) : 'none'} |`;
  });
  if (rows.length) L.push('## Names the map gives in play (no text changed)', '',
    'An oasis the design set off dry ground is a town named for its water (D-061\'s rule, D-154). The lore keeps the release\'s name as the',
    'place\'s identity: a house seated there finds its seat by either name and is shown by the new one (`A.provOfSeat`, `A.seatName`).',
    'Read from `data/map/one-continent.json`.', '', '| The release\'s name | On the map | Realm | Houses seated there |', '| --- | --- | --- | --- |', ...rows, '');
}
if (!CHECK) fs.writeFileSync(path.join(root, 'docs/design/m1/lore-changes.md'), L.join('\n'));
console.log(`lore-apply: ${done.filter(e => e.state === 'now').length} edits applied now, ${done.filter(e => e.state === 'applied').length} already, ${done.filter(e => e.state === 'absent').length} optional absent; ${byFile.size} files${CHECK ? ' (check only)' : ''}`);
