#!/usr/bin/env node
// Resolve git conflict markers in Ardan's record files by keeping BOTH sides.
// docs/HISTORY.md and docs/DECISIONS.md: entries (### H-NNN / ### D-NNN headings) from both sides, deduplicated by
// heading, ordered by number. Anything else (CHANGELOG.md, docs/*.md): ours then theirs, identical lines once.
// Usage: node merge-records.mjs [file ...]   (default: every conflicted file git lists that matches *.md)
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const files = process.argv.slice(2).length ? process.argv.slice(2)
  : execSync('git diff --name-only --diff-filter=U', { encoding: 'utf8' }).split('\n').filter(f => f.endsWith('.md'));
const HUNK = /^<<<<<<< [^\n]*\n([\s\S]*?)^=======\n([\s\S]*?)^>>>>>>> [^\n]*\n/gm;

function entries(text) {
  // split at "### X-NNN" headings; a leading part without a heading is kept as is
  const parts = text.split(/(?=^### [HD]-\d+)/m);
  return parts.map(p => { const m = /^### ([HD])-(\d+)((?: [a-z]+)*)/.exec(p); return { key: m ? m[1] + m[2] + (m[3] || '') : null, n: m ? +m[2] : -1, text: p }; });
}
function mergeEntries(a, b) {
  const seen = new Map(), lead = [];
  for (const e of [...entries(a), ...entries(b)]) {
    if (e.key == null) { if (e.text.trim() && !lead.includes(e.text)) lead.push(e.text); continue; }
    const had = seen.get(e.key);
    if (!had) { seen.set(e.key, e); continue; }
    // the same entry edited on both sides: never drop either; leave a conflict on that entry for a person to resolve
    if (had.text.trim() !== e.text.trim() && !had.both) {
      const nl = t => t.endsWith('\n') ? t : t + '\n';
      seen.set(e.key, { ...had, both: true, text: `<<<<<<< ours (${e.key[0]}-${e.n})\n${nl(had.text)}=======\n${nl(e.text)}>>>>>>> theirs\n` });
    }
  }
  const body = [...seen.values()].sort((x, y) => x.n - y.n).map(e => e.text.endsWith('\n') ? e.text : e.text + '\n');
  return lead.join('') + body.join('');
}
function mergeLines(a, b) {
  const strip = t => t.replace(/\n$/, '');
  const out = strip(a).split('\n'); const have = new Set(out.filter(l => l.trim()));
  for (const l of strip(b).split('\n')) if (l.trim() && !have.has(l)) { out.push(l); have.add(l); }
  return out.join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
}
let total = 0;
for (const f of files) {
  const s = readFileSync(f, 'utf8'); let n = 0;
  const byEntry = /(^|\/)(HISTORY|DECISIONS)\.md$/.test(f);
  const r = s.replace(HUNK, (_, ours, theirs) => { n++; return byEntry ? mergeEntries(ours, theirs) : mergeLines(ours, theirs); });
  if (n) { writeFileSync(f, r); total += n; console.log(`${f}: ${n} hunk(s) kept both sides`); }
  if (/^(<<<<<<<|>>>>>>>) /m.test(r)) { console.error(`${f}: conflict markers left (an entry edited on both sides, or a hunk this script cannot read): resolve by hand`); process.exitCode = 1; }
}
if (!total) console.log('no record conflicts found');
