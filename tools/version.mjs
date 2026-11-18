// Ardan's versions: every foundational or significant change is a version, a row in docs/VERSIONS.md naming its
// commit (and, where it can be pushed, a git tag of the same name). Any version can be played as it was: a version's
// commit up to X5 carries its own built index.html; from X5 (D-109) the built file is not committed, and `get` rebuilds
// it from that commit's own source (the build is deterministic: CI builds twice and compares), checking it against the
// build hash `new` wrote into the row. docs/VERSIONS.md is the record: the session's git proxy refuses tag pushes, so
// tags may exist only locally.
//
//   node tools/version.mjs list                      every version, newest last
//   node tools/version.mjs get v1.5.0 [--out=f.html] write that version's playable game (default versions/ardan-v1.5.0.html)
//   node tools/version.mjs new v2.0.0-beta.1 "Title" tag HEAD (annotated, clean tree only), build it and add its row (with
//                                                    the build's sha256) to docs/VERSIONS.md
//
// Rules (CLAUDE.md, "Versions"): a version is a commit whose CI is green, or the end of a step the owner asked for.
// Major = a new design the owner set (v1: the shipped release and its rounds; v2: the owner's v2 spec). Minor = a
// round, cycle or step that adds or replaces a system. Patch = fixes only. Pre-release (-alpha.N, -beta.N) while a
// major is being built. Push tags with: git push origin --tags
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
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
  .map(m => { const b = /· build `sha256:([0-9a-f]{64})`$/.exec(m[4].trim()); return { ver: m[1], date: m[2].trim(), sha: m[3], title: m[4].trim().replace(/ · build `sha256:[0-9a-f]{64}`$/, ''), build: b ? b[1] : null }; });
const sha256 = buf => crypto.createHash('sha256').update(buf).digest('hex');
const hasFile = (sha, f) => { try { execFileSync('git', ['cat-file', '-e', `${sha}:${f}`], { cwd: root, stdio: 'ignore' }); return true; } catch { return false; } };
// a commit's own source, unpacked with git archive into a scratch folder, built there by its own tools/build.mjs
function rebuild(sha) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ardan-version-'));
  try {
    const tar = execFileSync('git', ['archive', '--format=tar', sha], { cwd: root, maxBuffer: 1 << 30 });
    execFileSync('tar', ['-x', '-C', dir], { input: tar, maxBuffer: 1 << 30 });
    const out = path.join(dir, 'built.html');
    execFileSync(process.execPath, ['tools/build.mjs', `--out=${out}`], { cwd: dir, stdio: ['ignore', 'ignore', 'inherit'] });
    return fs.readFileSync(out);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
const commitOf = v => { const r = rows().find(x => x.ver === v); if (r) return r.sha; try { return git('rev-parse', '--short', `${v}^{commit}`); } catch { return null; } };

if (cmd === 'list') {
  for (const r of rows()) console.log(`${r.ver.padEnd(18)} ${r.date} ${r.sha}  ${r.title}${r.build ? '  (build ' + r.build.slice(0, 12) + ')' : ''}`);
} else if (cmd === 'get') {
  if (!ver) throw new Error('usage: node tools/version.mjs get <version> [--out=file.html]');
  const sha = commitOf(ver); if (!sha) throw new Error(`no version ${ver} in docs/VERSIONS.md`);
  // the game at that version: its committed index.html (up to X5); before the build existed, the release file as uploaded
  let html = null, how = 'committed';
  for (const f of ['index.html', 'vendor/ardan-b593143.html', 'ardan (1).html']) {
    try { html = execFileSync('git', ['show', `${sha}:${f}`], { cwd: root, maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] }); break; } catch {}
  }
  // from X5 (D-109) on, no built file is committed: build that commit's own source in a scratch folder
  if (!html || !hasFile(sha, 'index.html')) {
    if (hasFile(sha, 'tools/build.mjs')) { html = rebuild(sha); how = 'rebuilt'; }
  }
  if (!html) throw new Error(`no playable game in ${ver}`);
  const want = (rows().find(r => r.ver === ver) || {}).build;
  if (want && sha256(html) !== want) throw new Error(`${ver}: the rebuilt game's sha256 ${sha256(html)} is not the one recorded (${want})`);
  const out = path.resolve(root, opt('out') || `versions/ardan-${ver}.html`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  console.log(`${ver} -> ${path.relative(root, out)} (${Math.round(html.length / 1024)} KB, ${how}${want ? ', build hash checked' : ''})`);
} else if (cmd === 'new') {
  const title = rest.join(' ').trim();
  if (!VER_RX.test(ver || '') || !title) throw new Error('usage: node tools/version.mjs new vX.Y.Z[-alpha.N] "Title"');
  if (git('status', '--porcelain', '--untracked-files=no')) throw new Error('commit first: a version is a clean commit');
  if (commitOf(ver)) throw new Error(`${ver} already exists`);
  const sha = git('rev-parse', '--short', 'HEAD'), date = git('log', '-1', '--format=%ad', '--date=short');
  // the built game's hash, from the commit's own source, so `get` can check a rebuild (X5, D-109)
  const build = sha256(rebuild(sha));
  execFileSync('git', ['tag', '-a', ver, '-m', title], { cwd: root });
  const doc = path.join(root, 'docs/VERSIONS.md');
  const row = `| ${ver} | ${date} | \`${sha}\` | ${title} · build \`sha256:${build}\` |\n`;
  const text = fs.readFileSync(doc, 'utf8');
  fs.writeFileSync(doc, text.replace(/(<!-- versions:end -->)/, row + '$1'));
  console.log(`${ver} at ${sha}: its row is in docs/VERSIONS.md (commit and push it); a local tag too (git push origin ${ver} where tags may be pushed)`);
} else {
  console.log('usage: node tools/version.mjs list | get <version> [--out=f.html] | new <version> "Title"');
}
