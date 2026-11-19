// The docs index is whole and true: docs/README.md lists every doc under docs/ and links nothing that is gone.
//
//   node tools/lint-docs-index.mjs [--verbose]
//
// A doc is a tracked .md, .html, .sh or .txt file under docs/, except the working files inside the subfolders of
// docs/design/ (demo sheets, generators' notes, the map's prompts, trials: assets of a design, which its page names).
// A doc is covered when docs/README.md links the file itself, or links a folder (a link ending in "/") that holds it.
// Fails (exit 1) when
//   1. a doc is not covered, or
//   2. a link in docs/README.md points at a file or folder that does not exist (a "#fragment" is ignored; http(s) and
//      mailto links are not followed).
// Untracked files are not read: a file is a doc once it is committed.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const verbose = process.argv.includes('--verbose');
const DOC_EXT = /\.(md|html|sh|txt)$/;
const INDEX = 'docs/README.md';

function trackedDocs() {
  let files;
  try { files = execFileSync('git', ['ls-files', '-z', 'docs'], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26 }).split('\0').filter(Boolean); }
  catch { files = null; }
  if (!files) { // no git (an unpacked source tree): walk
    files = [];
    const walk = d => { for (const e of fs.readdirSync(path.join(root, d), { withFileTypes: true })) { const p = d + '/' + e.name; e.isDirectory() ? walk(p) : files.push(p); } };
    walk('docs');
  }
  return files.filter(f => DOC_EXT.test(f) && !/^docs\/design\/[^/]+\//.test(f) && fs.existsSync(path.join(root, f)));
}

const text = fs.readFileSync(path.join(root, INDEX), 'utf8');
const links = [...text.matchAll(/\]\(([^)\s]+)\)/g)].map(m => m[1]).filter(l => !/^(https?:|mailto:|#)/.test(l));
const targets = links.map(l => ({ link: l, rel: path.posix.normalize('docs/' + decodeURI(l.split('#')[0])) }));

const problems = [];
const filesLinked = new Set(), dirsLinked = [];
for (const { link, rel } of targets) {
  if (!fs.existsSync(path.join(root, rel))) { problems.push(`${INDEX} links a missing file: ${link}`); continue; }
  if (link.split('#')[0].endsWith('/')) dirsLinked.push(rel.replace(/\/?$/, '/')); else filesLinked.add(rel);
}
const docs = trackedDocs();
for (const f of docs) {
  if (f === INDEX) continue;
  if (filesLinked.has(f) || dirsLinked.some(d => f.startsWith(d))) continue;
  problems.push(`${INDEX} does not list ${f}`);
}
if (verbose) console.log(`${docs.length} docs, ${targets.length} links in ${INDEX}`);
if (problems.length) {
  console.error(problems.join('\n') + `\n\nlint-docs-index: ${problems.length} problem(s). Add one line per doc to ${INDEX}, or drop the dead link.`);
  process.exit(1);
}
console.log(`docs index ok: ${docs.length} docs listed, ${targets.length} links all exist`);
