// C6 (D-057, CRITIQUE F3): no event names kin who are not in the tree.
//
//   node tools/lint-kin.mjs [--verbose]
//
// Reads the event sources (the release's packs in src/core/release/content/, every feature's *.events.js and the core
// code of the event features) and fails on:
//   1. a kin helper that mints: a person made by a maker (mk, mkKin, make, H.mk, AK.mk, A.newPerson, A.makeAcquaintance,
//      mkOther) and linked to the player under a blood word (sibling, uncle, cousin, grandparent, grandchild, nephew,
//      father, mother) in the same scene, or given that word by a choice ({them:{type:"cousin"}}), unless the scene writes
//      them into the tree by name (A.KIN.reveal, A.KIN.recognize, A.KIN.spouseKin) or asks the tree (A.KIN.take);
//      `linkNew(p, mk(...), "<blood word>")` always;
//   2. a scene whose words name a relative of the player ("your sister {them}", "Your {cz}") with no kin source in its
//      scene (a helper that reads the tree or the relationships: known, kinPid, relP, A.KIN, kidsOf, spouseOf, ...).
// The run check is the test c6NoKinMinted (12 worlds x 30 years). Exit 1 on any finding.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { allFeatures } from './lib/features.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const verbose = process.argv.includes('--verbose');
const BLOOD = 'sibling|uncle|cousin|grandparent|grandchild|nephew|father|mother';
const MAKER = String.raw`(?:mk|mkKin|mkOther|make|H\.mk|AK\.mk|A\.newPerson|A\.makeAcquaintance)\(`;
const TREE = /A\.KIN\.(?:reveal|recognize|spouseKin|take|cousinLike)|A\.KIN\?/;
const KIN_SOURCE = /\bkinNm\(|\bkept\(|\bknown\(|\bsibOf\(|kinPid\(|headPid\(|relP\(|\blive\(p,|A\.KIN|H\.KIN|AK\.KIN|\bkin\(p|\bsibs\(|\.parents\b|\.children\b|kidsOf|kidOf|\bkid\(p|spouseOf|relsOf\(|C\.hasRel|C\.parentsAlive|C\.hasKids|H\.get\(|H\.parent\(|H\.father|H\.mother|H\.spouse|AK\.get\(|F\.parentOf|\bdeadOf\(|\bfam\(|\bcuz\b|\bsibling\(|\bfeud\(|\binherit\(|\bblood\(|\bmatch\(|\bsecret\(|\bwho\(p|C\.flag\(p,\s*["']ch_|parentOf/;
const KIN_WORDS = /\byour (?:elder |younger |little |big |old |young |late )?(?:brother|sister|uncle|aunt|cousin|grandfather|grandmother|grandson|granddaughter|nephew|niece|twin|half-brother|half-sister)\s+\{|\{cz\} \{them\}|Your \{cz\}|your \{(?:bs|ua|ln|cz)\}/i;

const files = [];
for (const f of fs.readdirSync(path.join(root, 'src/core/release/content')).filter(f => f.endsWith('.js'))) files.push(path.join(root, 'src/core/release/content', f));
for (const F of allFeatures()) {
  if (fs.existsSync(path.join(F.path, '.wip'))) continue;
  for (const f of fs.readdirSync(F.path)) {
    if (f.endsWith('.events.js') || (F.system === 'events' && f.endsWith('.core.js'))) files.push(path.join(F.path, f));
  }
}

// a scene: the text from one `id:` to the next (the release's packs and the features' lists alike)
function scenes(src) {
  const out = [], rx = /\bid:\s*["'`]([a-z0-9_]+)["'`]/g;
  let m, last = null;
  while ((m = rx.exec(src))) { if (last) out.push({ id: last.id, body: src.slice(last.at, m.index) }); last = { id: m[1], at: m.index }; }
  if (last) out.push({ id: last.id, body: src.slice(last.at) });
  return out;
}
// helper definitions a scene calls by name (const sibOf = ...), with their bodies, so a scene's kin source can be its helper's
function helpers(src) {
  const map = new Map();
  for (const m of src.matchAll(/(?:const |,\s*|^\s*)([A-Za-z_$][\w$]*)\s*=\s*(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>([^\n]*)/gm)) map.set(m[1], m[2]);
  for (const m of src.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{([^\n]*)/g)) map.set(m[1], m[2]);
  return map;
}

const findings = [];
let scenesRead = 0, kinScenes = 0;
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8'), rel = path.relative(root, file);
  const lines = src.split('\n');
  // rule 1a: linkNew(p, mk(...), "<blood>")
  lines.forEach((ln, i) => {
    for (const m of ln.matchAll(new RegExp(String.raw`linkNew\(\s*pc?\s*,\s*${MAKER}[^;]*?["'](${BLOOD})["']`, 'g')))
      if (!TREE.test(ln)) findings.push(`${rel}:${i + 1}: linkNew mints a ${m[1]}`);
  });
  // rule 1b: X = maker(...) ... A.link(p|pc, X, "<blood>") in a window of the same line or the 12 before it
  lines.forEach((ln, i) => {
    for (const m of ln.matchAll(new RegExp(String.raw`A\.link\(\s*(pc?)\s*,\s*([A-Za-z_$][\w$]*)\s*,\s*["'](${BLOOD})["']`, 'g'))) {
      const x = m[2], win = lines.slice(Math.max(0, i - 12), i + 1).join('\n');
      const made = new RegExp(String.raw`\b${x.replace('$', '\\$')}\s*=\s*${MAKER}`).test(win);
      if (made && !TREE.test(win)) findings.push(`${rel}:${i + 1}: A.link mints a ${m[3]} (${x} is made in the scene)`);
    }
  });
  const H = helpers(src);
  // rule 1d: a helper that makes a person and links them under the word it is given (known(p, types, "sibling")), called
  // with a blood word, and with no way to the tree
  for (const [name, body] of H) {
    if (!new RegExp(String.raw`linkNew\(\s*p\s*,\s*${MAKER}`).test(body) || TREE.test(body)) continue;
    lines.forEach((ln, i) => {
      for (const m of ln.matchAll(new RegExp(String.raw`\b${name.replace('$', '\\$')}\([^()]{0,80}?["'](${BLOOD})["']`, 'g')))
        findings.push(`${rel}:${i + 1}: ${name}() mints a ${m[1]}`);
    });
  }
  for (const s of scenes(src)) {
    scenesRead++;
    const b = s.body;
    // rule 1c: a choice gives a blood word to someone the scene made
    const madeThem = new RegExp(String.raw`setPid\(\s*p\s*,\s*ctx\s*,\s*${MAKER}|const\s+\w+\s*=\s*${MAKER}[^;]*;[^\n]*setPid\(|strangerPid\(|const q=A\.makeAcquaintance`).test(b);
    const word = new RegExp(String.raw`them:\s*\{[^}]*type:\s*["'](${BLOOD})["']`).exec(b);
    if (madeThem && word && !TREE.test(b)) findings.push(`${rel}: ${s.id}: a choice calls a stranger the scene made "${word[1]}"`);
    // rule 2: words that name a relative need a kin source in the scene (or in a helper it calls)
    if (!KIN_WORDS.test(b)) continue;
    kinScenes++;
    let ok = KIN_SOURCE.test(b);
    if (!ok) for (const [name, body] of H) if (new RegExp(String.raw`\b${name.replace("$", "\\$")}\b`).test(b) && KIN_SOURCE.test(body)) { ok = true; break; }
    if (!ok) findings.push(`${rel}: ${s.id}: names a relative ("${(b.match(KIN_WORDS) || [''])[0]}") with no kin source`);
  }
}
const out = { files: files.length, scenes: scenesRead, kinScenes, findings: findings.length };
console.log(JSON.stringify(out));
if (findings.length) { for (const f of findings.slice(0, verbose ? 999 : 60)) console.log('  ' + f); process.exit(1); }
console.log('kin ok: no scene mints a relative or names one it did not take from the tree');
