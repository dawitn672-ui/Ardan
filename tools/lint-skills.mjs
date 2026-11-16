// S1b (docs/design/skills.md §12.6): the skills lint. tools/check.mjs runs it.
//   node tools/lint-skills.mjs            check
//   node tools/lint-skills.mjs --write    lower the baselines in tests/skills-baseline.json to today's counts
// - No "proficien" in code a player can read (string literals, templates, data-note, data files) under src/ and data/:
//   comments are allowed, and archive/ and docs/ are not read.
// - The retired readers are gone: GD.profTier, GD.PROF_TIERS, GD.aptName, VS.hoursOf in a view, C.prof( and C.apt(.
// - Older code that writes p.skills[k] (outside src/people/36-skills), reads p.apt, or calls A.trainSkill (outside the
//   shim) is counted against tests/skills-baseline.json: the counts may only fall (the shim and the month's sweep make
//   such code safe meanwhile; D-074).
// - data/skills.json: unique ids; nine concepts a skill in the 1-1-2-2-2-1 shape; every kin, legacy and shared key
//   resolves; every concept has a description and a "never grasped" line of at most 14 words; every skill has a reader
//   (a card's check, a post, a plan or a hook names it).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = path.join(root, 'tests/skills-baseline.json');
const errors = [], notes = [];

const walk = (dir, out = []) => { for (const f of fs.readdirSync(dir)) { const p = path.join(dir, f); const st = fs.statSync(p); if (st.isDirectory()) { if (!/node_modules|^\./.test(f)) walk(p, out); } else out.push(p); } return out; };
const srcFiles = walk(path.join(root, 'src')).filter(f => /\.(js|mjs)$/.test(f) && !/99990-v2-engine/.test(f));
const codeFiles = srcFiles.filter(f => !/test\.mjs$/.test(f));
// the text without its comments, line by line (a line that is all comment, and a trailing " // ..." after code). A
// comment inside a template's CSS (/* ... */) is kept: it is a string.
function uncomment(text) {
  return text.split('\n').map(l => (/^\s*(\/\/|\*\s|\*$)/.test(l) ? '' : l.replace(/\s\/\/\s.*$/, ''))).join('\n');
}
const rel = f => path.relative(root, f);
const count = (re, files, skip) => { let n = 0; const where = {}; for (const f of files) { if (skip && skip.test(rel(f))) continue; const t = uncomment(fs.readFileSync(f, 'utf8')); const m = t.match(re); if (m) { n += m.length; where[rel(f)] = m.length; } } return { n, where }; };

// 1. the word
for (const f of codeFiles) {
  const t = uncomment(fs.readFileSync(f, 'utf8'));
  // CSS in a template is a string: its comments are read too (they are not shown, but a CSS comment is still a string)
  const lines = t.split('\n');
  lines.forEach((l, i) => { if (/proficien/i.test(l)) errors.push(`${rel(f)}:${i + 1}: "proficien" in code a player can read`); });
}
for (const f of walk(path.join(root, 'data')).filter(f => f.endsWith('.json'))) if (/proficien/i.test(fs.readFileSync(f, 'utf8'))) errors.push(`${rel(f)}: "proficien" in data`);

// 2. retired readers
for (const [re, what] of [[/\bGD\.profTier\b/g, 'GD.profTier'], [/\bGD\.PROF_TIERS\b/g, 'GD.PROF_TIERS'], [/\bGD\.aptName\b/g, 'GD.aptName'], [/\bC\.prof\(/g, 'C.prof('], [/\bC\.apt\(/g, 'C.apt(']]) {
  const c = count(re, codeFiles, /^src\/core\/release\/core\/02-game-data-a\.js$/);
  if (c.n) errors.push(`${what}: ${c.n} uses (${Object.keys(c.where).slice(0, 4).join(', ')})`);
}

// 3. older code, counted against the baseline
const OWN = /^(src\/people\/36-skills\/|src\/core\/release\/core\/03-engine-base\.js$)/;
const measured = {
  skillsWrites: count(/\.skills(\[[^\]]+\]|\.[a-z]+)\s*(=(?!=)|\+=|-=)/g, codeFiles, /^src\/people\/36-skills\//),
  aptReads: count(/\.apt\b/g, codeFiles, /^src\/people\/36-skills\//),
  trainSkillCalls: count(/\bA\.trainSkill\(/g, codeFiles, OWN),
};
const base = fs.existsSync(BASE) ? JSON.parse(fs.readFileSync(BASE, 'utf8')) : {};
if (process.argv.includes('--write')) {
  const out = { about: 'Counts tools/lint-skills.mjs holds older code to (S1b, D-074): writes into p.skills outside src/people/36-skills, reads of p.apt, and calls of the A.trainSkill shim. They may only fall; lower them with node tools/lint-skills.mjs --write.' };
  for (const k in measured) out[k] = measured[k].n;
  fs.writeFileSync(BASE, JSON.stringify(out, null, 2) + '\n');
  console.log('skills baseline written', JSON.stringify(Object.fromEntries(Object.entries(measured).map(([k, v]) => [k, v.n]))));
}
for (const k in measured) {
  const b = base[k];
  if (b == null) { if (!process.argv.includes('--write')) errors.push(`${k}: no baseline (node tools/lint-skills.mjs --write)`); continue; }
  if (measured[k].n > b) errors.push(`${k}: ${measured[k].n}, more than the baseline ${b} (${Object.entries(measured[k].where).sort((a, c) => c[1] - a[1]).slice(0, 4).map(([f, n]) => f + ' ' + n).join(', ')})`);
  else if (measured[k].n < b) notes.push(`${k}: ${measured[k].n}, under the baseline ${b}: lower it with --write`);
}

// 4. the data
const D = JSON.parse(fs.readFileSync(path.join(root, 'data/skills.json'), 'utf8'));
const ids = new Set(), legacy = new Set(), conceptIds = {};
const SHAPE = ['intermediate', 'advanced', 'expert', 'expert', 'master', 'master', 'grandmaster', 'grandmaster', 'legend'];
for (const s of D.skills) {
  if (ids.has(s.id)) errors.push(`data: skill ${s.id} twice`); ids.add(s.id);
  if (!D.groups.includes(s.group)) errors.push(`data: ${s.id} group ${s.group}`);
  if (!s.desc) errors.push(`data: ${s.id} has no description`);
  const shape = s.concepts.map(c => c.word);
  if (JSON.stringify(shape) !== JSON.stringify(SHAPE)) errors.push(`data: ${s.id} concepts are not 1-1-2-2-2-1 (${shape.join(',')})`);
  const seen = new Set();
  for (const c of s.concepts) {
    if (seen.has(c.id)) errors.push(`data: ${s.id} concept ${c.id} twice`); seen.add(c.id);
    (conceptIds[c.id] = conceptIds[c.id] || []).push(s.id);
    if (!c.desc) errors.push(`data: ${s.id}/${c.id} has no description`);
    if (!c.never) errors.push(`data: ${s.id}/${c.id} has no "never grasped" line`);
    else if (c.never.split(/\s+/).length > 14) errors.push(`data: ${s.id}/${c.id} "never grasped" is over 14 words`);
  }
  for (const sp of s.specialisms) if (sp.legacy) { if (legacy.has(sp.legacy)) errors.push(`data: legacy ${sp.legacy} twice`); legacy.add(sp.legacy); }
}
for (const s of D.skills) {
  for (const k in s.kin || {}) if (!ids.has(k)) errors.push(`data: ${s.id} kin ${k} is no skill`);
  for (const l of s.legacy || []) if (!legacy.has(l)) errors.push(`data: ${s.id} legacy ${l} has no specialism`);
}
for (const c in D.sharedConcepts || {}) for (const k of D.sharedConcepts[c]) if (!(conceptIds[c] || []).includes(k)) errors.push(`data: shared concept ${c} is not in ${k}`);
for (const j in D.jobSpec || {}) { const [k, sp] = D.jobSpec[j]; const s = D.skills.find(x => x.id === k); if (!s || !s.specialisms.some(x => x.id === sp)) errors.push(`data: jobSpec ${j} -> ${k}/${sp} does not resolve`); }
// every skill has a reader: a check, a post, a plan or a hook names it (the dead-numbers rule)
const allText = srcFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');
for (const s of D.skills) {
  const keys = [s.id, ...(s.legacy || [])];
  if (!keys.some(k => new RegExp(`(s2?:\\s*["']${k}["']|skill:\\s*["']${k}["']|["']${k}["']\\s*[,)\\]])`).test(allText))) errors.push(`data: ${s.id} has no reader`);
}

if (notes.length) console.log(notes.join('\n'));
if (errors.length) { console.error(`skills lint FAILED (${errors.length}):\n  ` + errors.slice(0, 40).join('\n  ')); process.exit(1); }
console.log(`skills ok: ${D.skills.length} skills, ${Object.keys(conceptIds).length} concepts; older code: ${Object.entries(measured).map(([k, v]) => `${k} ${v.n}`).join(', ')}`);
