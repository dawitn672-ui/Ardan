// M1 lore pass (D-155): applies tools/m1/lore-edits.mjs to the lore and writes docs/design/m1/lore-changes.md, the owner's
// list of every change (the old words, the new words, by file, and why). An edit already applied is skipped, so the tool
// can run again; one whose old words cannot be found (and are not already replaced) stops it. A JSON file must still read.
//   node tools/m1/lore-apply.mjs [--check]     (--check: change nothing, say what would change)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EDITS } from './lore-edits.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CHECK = process.argv.includes('--check');
const files = new Map(), done = [], bad = [];
const count = (s, sub) => { let n = 0, i = 0; while ((i = s.indexOf(sub, i)) >= 0) { n++; i += sub.length; } return n; };
for (const e of EDITS) {
  const p = path.join(root, e.file);
  if (!files.has(p)) files.set(p, fs.readFileSync(p, 'utf8'));
  let s = files.get(p);
  const n = count(s, e.old);
  if (n === 0) {
    if (e.optional || count(s, e.new) > 0) { done.push(Object.assign({ n: 0, state: count(s, e.new) ? 'applied' : 'absent' }, e)); continue; }
    bad.push(`${e.file}: not found: ${e.old.slice(0, 120)}`); continue;
  }
  if (!e.all && n !== 1) { bad.push(`${e.file}: ${n} places, one wanted: ${e.old.slice(0, 120)}`); continue; }
  s = s.split(e.old).join(e.new);
  files.set(p, s);
  done.push(Object.assign({ n, state: 'now' }, e));
}
if (bad.length) { console.error('lore-apply: ' + bad.join('\n  ')); process.exit(1); }
for (const [p, s] of files) if (/\.json$/.test(p)) JSON.parse(s);
if (!CHECK) for (const [p, s] of files) fs.writeFileSync(p, s);

// the owner's list: every edit that has taken effect, by file
const byFile = new Map();
for (const e of done) { if (e.state === 'absent') continue; if (!byFile.has(e.file)) byFile.set(e.file, []); byFile.get(e.file).push(e); }
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
if (!CHECK) fs.writeFileSync(path.join(root, 'docs/design/m1/lore-changes.md'), L.join('\n'));
console.log(`lore-apply: ${done.filter(e => e.state === 'now').length} edits applied now, ${done.filter(e => e.state === 'applied').length} already, ${done.filter(e => e.state === 'absent').length} optional absent; ${byFile.size} files${CHECK ? ' (check only)' : ''}`);
