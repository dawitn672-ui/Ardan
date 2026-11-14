// The naming pass (work item X6, owner order 20): renames folders and files to clear names and rewrites every
// reference to them, driven by one table, tools/rename-map.json (old path -> new path).
//
//   node tools/rename-pass.mjs            do every rename not yet done, rewrite references, write docs/NAMES.md
//   node tools/rename-pass.mjs --dry      say what would change, change nothing
//
// Safe to run again, on a tree where some or all renames are done (for example after merging a branch that still
// used old names): a rename already done is skipped, and the reference rewrite only touches text that still holds an
// old name. Every move is a `git mv`, so history follows the file.
//
// What it rewrites, in every tracked text file except the "frozen" ones (records of the past such as docs/HISTORY.md,
// archive/, generated reports, and index.html, which the build writes):
//   - a feature folder's name (59-tooltips -> 59-descriptions) wherever it stands as a whole word;
//   - a feature's short name (tooltips -> descriptions) where tools take it: --only=, --without=, --features=,
//     --feature=, and featurePath('..') / findFeature('..') / isWip('..');
//   - a renamed file's name: everywhere when no other tracked file has that name, else only as <folder>/<name> and
//     inside its own folder (its URL-encoded spelling too, for Markdown links with spaces);
//   - the "literal" rows: exact strings in one named file.
// The "keep" rows are text the game shows that happens to name a feature folder: it stays word for word, so the
// pass changes no behaviour (the built blobs differ from before only in comments and path names).
// It refuses to run when a rename would change the build order: feature folders must sort in the same order, and
// within a feature the *.core.js and *.events.js files must sort in the same order (tools/build.mjs applies them so).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry');
const MAP = JSON.parse(fs.readFileSync(path.join(root, 'tools/rename-map.json'), 'utf8'));
const git = (...a) => execFileSync('git', a, { cwd: root, encoding: 'utf8' });
const abs = p => path.join(root, p);
const exists = p => fs.existsSync(abs(p));
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const W = 'A-Za-z0-9_';
const featRe = /^src\/[a-z]+\/\d+-[^/]+$/;

const feats = MAP.renames.filter(r => r.kind === 'feature');
for (const r of feats) {
  if (!featRe.test(r.from) || !featRe.test(r.to)) throw new Error(`not a feature folder: ${r.from} -> ${r.to}`);
  const pre = s => path.basename(s).match(/^\d+-/)[0];
  if (pre(r.from) !== pre(r.to) || path.dirname(r.from) !== path.dirname(r.to)) throw new Error(`a feature keeps its prefix and system: ${r.from} -> ${r.to}`);
}
// a path as it stands once the feature folders above it are renamed
const underRenamed = p => { for (const r of feats) if (p.startsWith(r.from + '/')) return r.to + p.slice(r.from.length); return p; };

// ---- 1. the build order must not change ----
const sortStr = a => [...a].sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
{
  const toDir = new Map(feats.flatMap(r => [[path.basename(r.from), path.basename(r.to)], [path.basename(r.to), path.basename(r.to)]]));
  const dirs = fs.readdirSync(abs('src')).flatMap(s => fs.statSync(abs('src/' + s)).isDirectory() ? fs.readdirSync(abs('src/' + s)).filter(d => /^\d+-/.test(d)) : []);
  const now = sortStr(dirs), after = now.map(d => toDir.get(d) || d);
  if (!same(after, sortStr(after))) throw new Error('the feature renames would change the build order');
  const files = MAP.renames.filter(r => r.kind === 'feature-file');
  for (const dir of new Set(files.map(r => path.dirname(r.to)))) {
    const map = new Map(files.filter(r => path.dirname(r.to) === dir).flatMap(r => [[path.basename(r.from), path.basename(r.to)], [path.basename(r.to), path.basename(r.to)]]));
    const cur = [...new Set([...(exists(dir) ? fs.readdirSync(abs(dir)) : []), ...[...feats.filter(r => r.to === dir)].flatMap(r => exists(r.from) ? fs.readdirSync(abs(r.from)) : [])])];
    for (const ext of ['.core.js', '.events.js']) {
      const before = sortStr(cur.filter(f => f.endsWith(ext))), mapped = before.map(f => map.get(f) || f);
      if (mapped.some(f => !f.endsWith(ext))) throw new Error(`${dir}: a rename changes a file's kind`);
      if (!same(mapped, sortStr(mapped))) throw new Error(`${dir}: the renames would change the order of its ${ext} files`);
    }
  }
}

// ---- 2. the moves ----
const done = { moved: {}, already: 0, missing: [] };
function move(from, to) {
  if (DRY) { console.log(`git mv "${from}" "${to}"`); return; }
  fs.mkdirSync(path.dirname(abs(to)), { recursive: true });
  git('mv', from, to);
}
for (const r of [...feats, ...MAP.renames.filter(r => r.kind !== 'feature')]) {
  const from = [r.from, underRenamed(r.from)].find(exists);
  if (!from) { if (exists(r.to)) done.already++; else done.missing.push(r.from); continue; }
  if (!exists(r.to)) { move(from, r.to); done.moved[r.kind] = (done.moved[r.kind] || 0) + 1; continue; }
  // both stand: a branch merged after the pass added files under the old folder; move them in one by one
  if (!fs.statSync(abs(from)).isDirectory()) throw new Error(`both ${from} and ${r.to} exist`);
  for (const f of fs.readdirSync(abs(from))) {
    if (exists(`${r.to}/${f}`)) throw new Error(`both ${from}/${f} and ${r.to}/${f} exist`);
    move(`${from}/${f}`, `${r.to}/${f}`);
  }
  if (!DRY) fs.rmSync(abs(from), { recursive: true, force: true });
  done.moved[r.kind + ' (merged in)'] = (done.moved[r.kind + ' (merged in)'] || 0) + 1;
}

// ---- 3. the reference rewrite ----
const frozen = p => MAP.frozen.some(f => (f.endsWith('/') ? p.startsWith(f) : p === f));
const BINARY = /\.(png|jpe?g|gif|webp|ico|woff2?|ttf|otf|zst|gz|zip|mp3|ogg|wav|pdf)$/i;
const tracked = git('ls-files', '-z').split('\0').filter(Boolean);
const baseCount = new Map();
for (const p of tracked) baseCount.set(path.basename(p), (baseCount.get(path.basename(p)) || 0) + 1);

const rules = []; // { re, to, only?: folder whose files alone get this rule }
const shortName = d => path.basename(d).replace(/^\d+-/, '');
const nameMap = new Map(feats.map(r => [shortName(r.from), shortName(r.to)]));
for (const r of feats) rules.push({ re: new RegExp(`(?<![${W}-])${esc(path.basename(r.from))}(?![${W}-])`, 'g'), to: path.basename(r.to) });
for (const r of MAP.renames.filter(r => r.kind !== 'feature')) {
  const ob = path.basename(r.from), nb = path.basename(r.to);
  const variants = [...new Set([[ob, nb], [encodeURI(ob), encodeURI(nb)], [encodeURIComponent(ob), encodeURIComponent(nb)]].map(JSON.stringify))].map(JSON.parse);
  const others = (baseCount.get(ob) || 0) - (tracked.includes(r.from) ? 1 : 0);
  for (const [o, n] of variants) {
    const re = s => new RegExp(`(?<![${W}.-])${esc(s)}(?![${W}-])`, 'g');
    if (others <= 0) rules.push({ re: re(o), to: n });
    else {
      // another file shares the name: only <folder>/<name>, and the bare name inside its own folder
      rules.push({ re: new RegExp(`${esc(path.basename(path.dirname(r.to)))}/${esc(o)}(?![${W}-])`, 'g'), to: `${path.basename(path.dirname(r.to))}/${n}` });
      rules.push({ re: re(o), to: n, only: path.dirname(r.to) });
    }
  }
}
for (const rl of rules) { rl.re.lastIndex = 0; if (rl.re.test(rl.to)) throw new Error(`rule ${rl.re} would match its own result ${rl.to}: not re-runnable`); rl.re.lastIndex = 0; }
const FLAG = /(--(?:only|without|features|feature)=)([A-Za-z0-9_.,-]+)/g;
const CALL = /((?:featurePath|findFeature|isWip)\(\s*)(['"])([A-Za-z0-9_-]+)\2/g;

const applyRules = (t, p) => {
  for (const rl of rules) if (!rl.only || path.dirname(p) === rl.only) t = t.replace(rl.re, rl.to);
  t = t.replace(FLAG, (m, k, list) => k + list.split(',').map(n => nameMap.get(n) || n).join(','));
  return t.replace(CALL, (m, k, q, n) => k + q + (nameMap.get(n) || n) + q);
};
const KEEP = (MAP.keep || []).map(o => [o, applyRules(o, '')]);
const changed = [];
const files = git('ls-files', '-z').split('\0').filter(Boolean);
for (const p of files) {
  if (frozen(p) || BINARY.test(p) || !exists(p) || fs.statSync(abs(p)).size > 8e6) continue;
  const text = fs.readFileSync(abs(p), 'utf8');
  if (text.includes('\0')) continue;
  let t = text;
  // "keep" text stays word for word: hidden behind a marker while the rules run (its renamed spelling, if an
  // earlier run wrote one, is put back too)
  KEEP.forEach(([o, n], i) => { t = t.split(o).join(`\0K${i}\0`); if (n !== o) t = t.split(n).join(`\0K${i}\0`); });
  t = applyRules(t, p);
  KEEP.forEach(([o], i) => { t = t.split(`\0K${i}\0`).join(o); });
  for (const l of MAP.literal || []) if (l.file === p) t = t.split(l.from).join(l.to);
  if (t !== text) { changed.push(p); if (!DRY) fs.writeFileSync(abs(p), t); }
}

// ---- 4. docs/NAMES.md, the redirect table ----
const kinds = { feature: 'Feature folders', 'feature-file': 'Files inside features', doc: 'Docs', tool: 'Tools' };
let md = `# Old names and new names\n\n*Stamped ${MAP.stamp} · the naming pass (work item X6, owner order 20) · written by \`tools/rename-pass.mjs\` from \`tools/rename-map.json\`; do not edit by hand*\n\n` +
  'Old notes (docs/HISTORY.md, CHANGELOG.md, docs/VERSIONS.md, archive/, reports and branches made before the pass) keep the names they were written with. ' +
  'Look an old name up here to find the file today. A feature\'s short name (the words after its number) changed with its folder, so ' +
  '`--only=`, `--without=`, `--features=` and `--feature=` take the new short name.\n\n' +
  'The renames kept the build exactly as it was: feature folders keep their numbers and sort in the same order, and the files inside a feature sort in the same order. ' +
  'Test names, `A.*` and `UI.*` names, event ids, `vendor/`, `archive/` and git branches were not renamed.\n';
for (const [k, title] of Object.entries(kinds)) {
  const rows = MAP.renames.filter(r => r.kind === k);
  if (!rows.length) continue;
  md += `\n## ${title} (${rows.length})\n\n| Old | New | Renamed |\n| --- | --- | --- |\n` + rows.map(r => `| \`${r.from}\` | \`${r.to}\` | ${r.stamp || MAP.stamp} |`).join('\n') + '\n';
}
if (!DRY) fs.writeFileSync(abs('docs/NAMES.md'), md);

console.log(`renames: ${Object.entries(done.moved).map(([k, n]) => `${n} ${k}`).join(', ') || 'none to do'}; ${done.already} already done` +
  (done.missing.length ? `; missing (neither old nor new path exists): ${done.missing.join(', ')}` : ''));
console.log(`references rewritten in ${changed.length} file(s)${DRY ? ' (dry run)' : ''}`);
if (process.argv.includes('--verbose')) for (const p of changed) console.log('  ' + p);
