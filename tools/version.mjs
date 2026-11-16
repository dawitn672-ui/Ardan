// Ardan's versions: every foundational or significant change is a version, a row in docs/VERSIONS.md naming its
// commit (and, where it can be pushed, a git tag of the same name). Every version's commit carries its own built
// index.html, so any version can be played as it was. docs/VERSIONS.md is the record: the session's git proxy refuses
// tag pushes, so tags may exist only locally.
//
//   node tools/version.mjs list                      every version, newest last
//   node tools/version.mjs get v1.5.0 [--out=f.html] write that version's playable game (default versions/ardan-v1.5.0.html)
//   node tools/version.mjs new v2.0.0-beta.1 "Title" tag HEAD (annotated, clean tree only) and add its row to docs/VERSIONS.md
//
// Rules (CLAUDE.md, "Versions"): a version is a commit whose CI is green, or the end of a step the owner asked for.
// Major = a new design the owner set (v1: the shipped release and its rounds; v2: the owner's v2 spec). Minor = a
// round, cycle or step that adds or replaces a system. Patch = fixes only. Pre-release (-alpha.N, -beta.N) while a
// major is being built. Push tags with: git push origin --tags
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const git = (...a) => execFileSync('git', a, { cwd: root, encoding: 'utf8', maxBuffer: 64 << 20 }).trim();
const [cmd, ver, ...rest] = process.argv.slice(2);
const opt = k => (process.argv.find(a => a.startsWith(`--${k}=`)) || '').split('=').slice(1).join('=');
const VER_RX = /^v\d+\.\d+\.\d+(-(alpha|beta|rc)\.\d+)?$/;

// the record: | version | date | `commit` | what changed |
const DOC = path.join(root, 'docs/VERSIONS.md');
const rows = () => fs.readFileSync(DOC, 'utf8').split('\n').map(l => l.match(/^\| (v[^ |]+) \| ([^|]+) \| `([0-9a-f]{7,40})` \| (.*) \|$/)).filter(Boolean)
  .map(m => ({ ver: m[1], date: m[2].trim(), sha: m[3], title: m[4].trim() }));
const commitOf = v => { const r = rows().find(x => x.ver === v); if (r) return r.sha; try { return git('rev-parse', '--short', `${v}^{commit}`); } catch { return null; } };

if (cmd === 'list') {
  for (const r of rows()) console.log(`${r.ver.padEnd(18)} ${r.date} ${r.sha}  ${r.title}`);
} else if (cmd === 'get') {
  if (!ver) throw new Error('usage: node tools/version.mjs get <version> [--out=file.html]');
  // the game at that version: its built index.html; before the build existed, the release file as uploaded
  const sha = commitOf(ver); if (!sha) throw new Error(`no version ${ver} in docs/VERSIONS.md`);
  let html = null;
  for (const f of ['index.html', 'vendor/ardan-b593143.html', 'ardan (1).html']) {
    try { html = execFileSync('git', ['show', `${sha}:${f}`], { cwd: root, maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] }); break; } catch {}
  }
  if (!html) throw new Error(`no playable game in ${ver}`);
  const out = path.resolve(root, opt('out') || `versions/ardan-${ver}.html`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  console.log(`${ver} -> ${path.relative(root, out)} (${Math.round(html.length / 1024)} KB)`);
} else if (cmd === 'new') {
  const title = rest.join(' ').trim();
  if (!VER_RX.test(ver || '') || !title) throw new Error('usage: node tools/version.mjs new vX.Y.Z[-alpha.N] "Title"');
  if (git('status', '--porcelain', '--untracked-files=no')) throw new Error('commit first: a version is a clean commit');
  if (commitOf(ver)) throw new Error(`${ver} already exists`);
  const sha = git('rev-parse', '--short', 'HEAD'), date = git('log', '-1', '--format=%ad', '--date=short');
  execFileSync('git', ['tag', '-a', ver, '-m', title], { cwd: root });
  const doc = path.join(root, 'docs/VERSIONS.md');
  const row = `| ${ver} | ${date} | \`${sha}\` | ${title} |\n`;
  const text = fs.readFileSync(doc, 'utf8');
  fs.writeFileSync(doc, text.replace(/(<!-- versions:end -->)/, row + '$1'));
  console.log(`${ver} at ${sha}: its row is in docs/VERSIONS.md (commit and push it); a local tag too (git push origin ${ver} where tags may be pushed)`);
} else {
  console.log('usage: node tools/version.mjs list | get <version> [--out=f.html] | new <version> "Title"');
}
