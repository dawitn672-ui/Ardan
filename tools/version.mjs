// Ardan's versions: every foundational or significant change is a version, a row in docs/VERSIONS.md naming its
// commit (and, where it can be pushed, a git tag of the same name). Any version can be played as it was: a version's
// commit up to X5 carries its own built index.html; from X5 (D-109) the built file is not committed, and `get` rebuilds
// it from that commit's own source (the build is deterministic: CI builds twice and compares), checking it against the
// build hash `new` wrote into the row. docs/VERSIONS.md is the record: the session's git proxy refuses tag pushes, so
// tags may exist only locally.
//
//   node tools/version.mjs list                      every version, newest last
//   node tools/version.mjs get v1.5.0 [--out=f.html] write that version's playable game (default versions/ardan-v1.5.0.html)
//   node tools/version.mjs new v2.1.0-alpha.14 "Title" [--at=<sha>] [--ci=<check run>,<long run>] [--only-before=<sha>] [--sample=<recipe>]
//                                                    cut a version (D-134, order 65): the commit CI tested green on both
//                                                    tiers (--at, default HEAD; a dirty tree is refused only for HEAD).
//                                                    Tags it, writes its row (with the build's sha256), moves the
//                                                    CHANGELOG's Unreleased bullets under its heading (with --only-before,
//                                                    only the bullets whose lines came with commits in that sha's
//                                                    history), saves a sample game (tests/saves/<v>-<recipe>.ardan, a recipe
//                                                    of tools/version-samples.json played to a moment that shows the
//                                                    version's change, D-141) with its line in tests/saves/README.md, and
//                                                    prints the release-branch push. Without --ci it warns that
//                                                    a version needs check.yml and long.yml green on the commit.
//   node tools/version.mjs make-save <version> [--sample=<recipe>]   a version's sample save, from its own game
//   node tools/version.mjs check                     every row's commit exists; from v2.1.0-alpha.10 on, release/<v> points
//                                                    at exactly the row's commit (read with git ls-remote; skipped offline);
//                                                    from v2.1.0-alpha.1 on, a CHANGELOG heading, a sample save and its line in
//                                                    tests/saves/README.md for each.
//                                                    tools/check.mjs runs it. Exit 1 on a disagreement.
//
// Rules (CLAUDE.md, "Versions", "How a version is cut"): a version is the commit CI tested green on both tiers.
// Major = a new design the owner set (v1: the shipped release and its rounds; v2: the owner's v2 spec). Minor = a
// round, cycle or step that adds or replaces a system. Patch = fixes only. Pre-release (-alpha.N, -beta.N) while a
// major is being built.
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// every look-up is quiet: git's own "fatal: ..." for a tag that does not exist yet is an answer, not an error
const git = (...a) => execFileSync('git', a, { cwd: root, encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
const gitOk = (...a) => { try { return git(...a); } catch { return null; } };
const [cmd, ver, ...rest] = process.argv.slice(2);
const opt = k => (process.argv.find(a => a.startsWith(`--${k}=`)) || '').split('=').slice(1).join('=');
const positional = rest.filter(a => !a.startsWith('--'));
const VER_RX = /^v\d+\.\d+\.\d+(-(alpha|beta|rc)\.\d+)?$/;

// the record: | version | date | `commit` | what changed [· build `sha256:...`] |
const DOC = path.join(root, 'docs/VERSIONS.md'), LOG = path.join(root, 'CHANGELOG.md'), SAVES = path.join(root, 'tests/saves');
const rows = () => fs.readFileSync(DOC, 'utf8').split('\n').map(l => l.match(/^\| (v[^ |]+) \| ([^|]+) \| `([0-9a-f]{7,40})` \| (.*) \|$/)).filter(Boolean)
  .map(m => { const b = /· build `sha256:([0-9a-f]{64})`$/.exec(m[4].trim()); return { ver: m[1], date: m[2].trim(), sha: m[3], title: m[4].trim().replace(/ · build `sha256:[0-9a-f]{64}`$/, ''), build: b ? b[1] : null }; });
const sha256 = buf => crypto.createHash('sha256').update(buf).digest('hex');
const hasFile = (sha, f) => { try { execFileSync('git', ['cat-file', '-e', `${sha}:${f}`], { cwd: root, stdio: 'ignore' }); return true; } catch { return false; } };
const commitOf = v => { const r = rows().find(x => x.ver === v); if (r) return r.sha; return gitOk('rev-parse', '--short', `${v}^{commit}`); };
// v1.2.3-alpha.4 order: the release after its pre-releases
const parse = v => { const m = /^v(\d+)\.(\d+)\.(\d+)(?:-(alpha|beta|rc)\.(\d+))?$/.exec(v) || []; return [+m[1], +m[2], +m[3], m[4] ? ['alpha', 'beta', 'rc'].indexOf(m[4]) : 9, +(m[5] || 0)]; };
const cmpVer = (a, b) => { const x = parse(a), y = parse(b); for (let i = 0; i < 5; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; };

// a commit's own source, unpacked with git archive into a scratch folder, built there by its own tools/build.mjs
function rebuild(sha) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ardan-version-'));
  try {
    const tar = execFileSync('git', ['archive', '--format=tar', sha], { cwd: root, maxBuffer: 1 << 30, stdio: ['ignore', 'pipe', 'ignore'] });
    execFileSync('tar', ['-x', '-C', dir], { input: tar, maxBuffer: 1 << 30 });
    const out = path.join(dir, 'built.html');
    execFileSync(process.execPath, ['tools/build.mjs', `--out=${out}`], { cwd: dir, stdio: ['ignore', 'ignore', 'inherit'] });
    return fs.readFileSync(out);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
// the game at a commit: its committed index.html (up to X5), else built from its source; before the build existed, the
// release file as uploaded
function gameAt(sha) {
  if (hasFile(sha, 'index.html')) return { html: execFileSync('git', ['show', `${sha}:index.html`], { cwd: root, maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] }), how: 'committed' };
  if (hasFile(sha, 'tools/build.mjs')) return { html: rebuild(sha), how: 'rebuilt' };
  for (const f of ['vendor/ardan-b593143.html', 'ardan (1).html']) if (hasFile(sha, f)) return { html: execFileSync('git', ['show', `${sha}:${f}`], { cwd: root, maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] }), how: 'the release as uploaded' };
  return null;
}
// a sample save of a version (D-134, D-141): its game, played by tools/make-save.mjs to the moment of a recipe of
// tools/version-samples.json that shows what the version changed; saved as tests/saves/<v>-<recipe>.ardan, its recipe
// written into the file's versions and its line into tests/saves/README.md
const SAMPLES = path.join(root, 'tools/version-samples.json'), README = path.join(SAVES, 'README.md');
const samples = () => JSON.parse(fs.readFileSync(SAMPLES, 'utf8'));
function makeSave(v, sha, recipe) {
  const S = samples(); recipe = recipe || S.versions[v] || 'noble-life';
  const R = S.recipes[recipe]; if (!R) throw new Error(`no recipe "${recipe}" in tools/version-samples.json (${Object.keys(S.recipes).join(', ')})`);
  const g = gameAt(sha); if (!g) throw new Error(`no playable game at ${sha}`);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ardan-save-'));
  try {
    const html = path.join(dir, 'game.html'); fs.writeFileSync(html, g.html);
    const name = `${v}-${recipe}.ardan`, out = path.join('tests/saves', name);
    execFileSync(process.execPath, ['tools/make-save.mjs', html, `--out=${out}`, `--recipe=${recipe}`], { cwd: root, stdio: ['ignore', 'inherit', 'inherit'] });
    S.versions[v] = recipe; fs.writeFileSync(SAMPLES, JSON.stringify(S, null, 2) + '\n');
    // its line in tests/saves/README.md: the table ends at the marker
    const line = `| \`${name}\` | ${v} | ${R.shows} | ${R.see} |`;
    let t = fs.readFileSync(README, 'utf8').split('\n').filter(l => !l.startsWith(`| \`${name}\``)).join('\n');
    t = t.replace(/(<!-- saves:end -->)/, line + '\n$1');
    fs.writeFileSync(README, t);
    return out;
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
// the time now in New York, as the CHANGELOG's headings write it: 2026-11-18 15:25 ET
const etNow = () => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(new Date()).map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute} ET`;
};
// move the Unreleased bullets under the version's heading; with onlyBefore, a bullet whose first line came with a commit
// outside that sha's history stays under Unreleased (git blame on CHANGELOG.md)
function moveChangelog(v, title, onlyBefore) {
  const text = fs.readFileSync(LOG, 'utf8'), L = text.split('\n');
  const u = L.findIndex(l => /^## Unreleased\s*$/.test(l)); if (u < 0) return { moved: 0, kept: 0 };
  let end = L.findIndex((l, i) => i > u && /^## /.test(l)); if (end < 0) end = L.length;
  const body = L.slice(u + 1, end), bullets = [];
  for (let i = 0; i < body.length; i++) {
    if (/^- /.test(body[i])) bullets.push({ at: u + 1 + i, lines: [body[i]] });
    else if (bullets.length && body[i].trim() && /^\s/.test(body[i])) bullets[bullets.length - 1].lines.push(body[i]);
  }
  let blame = null;
  if (onlyBefore) {
    blame = {};
    const out = gitOk('blame', '--line-porcelain', '--', 'CHANGELOG.md') || '';
    let n = 0, c = null;
    for (const l of out.split('\n')) { const m = /^([0-9a-f]{40}) \d+ (\d+)/.exec(l); if (m) { c = m[1]; n = +m[2]; blame[n] = c; } }
  }
  const inHistory = c => c && (/^0+$/.test(c) ? false : gitOk('merge-base', '--is-ancestor', c, onlyBefore) !== null);
  const moved = [], kept = [];
  for (const b of bullets) (!blame || inHistory(blame[b.at + 1]) ? moved : kept).push(b);
  if (!moved.length) return { moved: 0, kept: kept.length };
  const block = l => l.flatMap(b => b.lines);
  const head = `## ${v} (${etNow()}) · ${title}`;
  const out = L.slice(0, u + 1).concat([''], kept.length ? block(kept).concat(['']) : [], [head, ''], block(moved), [''], L.slice(end).filter((l, i) => i > 0 || l.trim()));
  fs.writeFileSync(LOG, out.join('\n').replace(/\n{3,}/g, '\n\n'));
  return { moved: moved.length, kept: kept.length };
}

if (cmd === 'list') {
  for (const r of rows()) console.log(`${r.ver.padEnd(18)} ${r.date} ${r.sha}  ${r.title}${r.build ? '  (build ' + r.build.slice(0, 12) + ')' : ''}`);
} else if (cmd === 'get') {
  if (!ver) throw new Error('usage: node tools/version.mjs get <version> [--out=file.html]');
  const sha = commitOf(ver); if (!sha) throw new Error(`no version ${ver} in docs/VERSIONS.md`);
  const g = gameAt(sha); if (!g) throw new Error(`no playable game in ${ver}`);
  const want = (rows().find(r => r.ver === ver) || {}).build;
  if (want && sha256(g.html) !== want) throw new Error(`${ver}: the rebuilt game's sha256 ${sha256(g.html)} is not the one recorded (${want})`);
  const out = path.resolve(root, opt('out') || `versions/ardan-${ver}.html`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, g.html);
  console.log(`${ver} -> ${path.relative(root, out)} (${Math.round(g.html.length / 1024)} KB, ${g.how}${want ? ', build hash checked' : ''})`);
} else if (cmd === 'make-save') {
  const sha = ver && commitOf(ver); if (!sha) throw new Error('usage: node tools/version.mjs make-save <version in docs/VERSIONS.md> [--sample=<recipe>]');
  console.log(`${ver}: ${makeSave(ver, sha, opt('sample') || null)} from ${sha}`);
} else if (cmd === 'new') {
  const title = positional.join(' ').trim();
  if (!VER_RX.test(ver || '') || !title) throw new Error('usage: node tools/version.mjs new vX.Y.Z[-alpha.N] "Title" [--at=<sha>] [--ci=<check run>,<long run>] [--only-before=<sha>]');
  const at = opt('at') || 'HEAD';
  if (at === 'HEAD' && git('status', '--porcelain', '--untracked-files=no')) throw new Error('commit first: a version cut at HEAD is a clean commit (or name the tested one with --at=<sha>)');
  if (commitOf(ver)) throw new Error(`${ver} already exists`);
  const sha = gitOk('rev-parse', '--short', `${at}^{commit}`); if (!sha) throw new Error(`no commit ${at}`);
  const date = git('log', '-1', '--format=%ad', '--date=short', sha);
  const ci = opt('ci');
  if (!/^\d+,\d+$/.test(ci)) console.warn(`warning: a version is the commit CI tested green on both tiers (check.yml and long.yml, D-134); name the runs with --ci=<check run id>,<long run id>`);
  // the built game's hash, from the commit's own source, so `get` can check a rebuild (X5, D-109)
  const build = sha256(rebuild(sha));
  execFileSync('git', ['tag', '-a', ver, '-m', title, sha], { cwd: root, stdio: ['ignore', 'ignore', 'inherit'] });
  const row = `| ${ver} | ${date} | \`${sha}\` | ${title} · build \`sha256:${build}\` |\n`;
  fs.writeFileSync(DOC, fs.readFileSync(DOC, 'utf8').replace(/(<!-- versions:end -->)/, row + '$1'));
  const ch = moveChangelog(ver, title, opt('only-before') || null);
  const save = makeSave(ver, sha, opt('sample') || null);
  console.log(`${ver} at ${sha}${/^\d+,\d+$/.test(ci) ? ` (check run ${ci.split(',')[0]}, long run ${ci.split(',')[1]})` : ''}: its row is in docs/VERSIONS.md; ` +
    `CHANGELOG: ${ch.moved} bullets under its heading${ch.kept ? `, ${ch.kept} kept under Unreleased` : ''}; sample save ${save}; a local tag.`);
  console.log(`Push its release branch at exactly that commit, then commit the records on v2-integration:\n  git push origin ${git('rev-parse', `${sha}^{commit}`)}:refs/heads/release/${ver}`);
} else if (cmd === 'check') {
  const bad = [], notes = [], R = rows(), log = fs.readFileSync(LOG, 'utf8'), saves = fs.existsSync(SAVES) ? fs.readdirSync(SAVES) : [];
  const readme = fs.existsSync(README) ? fs.readFileSync(README, 'utf8') : '';
  // a shallow clone (CI's checkout) does not hold old commits: their existence is checked where the history is whole
  const shallow = gitOk('rev-parse', '--is-shallow-repository') === 'true';
  if (shallow) notes.push('shallow clone: the rows\' commits not looked up');
  // release branches, read once; offline or without a remote, skipped
  let remote = null;
  try { remote = new Map(execFileSync('git', ['ls-remote', 'origin', 'refs/heads/release/*'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 20000 }).trim().split('\n').filter(Boolean).map(l => { const [s, r] = l.split(/\s+/); return [r.replace('refs/heads/release/', ''), s]; })); }
  catch { notes.push('origin not reachable: release branches not read'); }
  for (const r of R) {
    if (!shallow && gitOk('cat-file', '-e', `${r.sha}^{commit}`) === null) bad.push(`${r.ver}: commit ${r.sha} does not exist`);
    if (cmpVer(r.ver, 'v2.1.0-alpha.1') < 0) continue;
    // D-134: from alpha.10, release/<v> is exactly the row's commit; alpha.1 to alpha.9 keep the old way (docs/VERSIONS.md)
    if (remote && cmpVer(r.ver, 'v2.1.0-alpha.10') >= 0) {
      const s = remote.get(r.ver);
      if (!s) bad.push(`${r.ver}: no release/${r.ver} on origin`);
      else if (!s.startsWith(r.sha)) bad.push(`${r.ver}: release/${r.ver} is ${s.slice(0, 7)}, the row says ${r.sha}`);
    }
    if (!log.includes(`\n## ${r.ver} (`)) bad.push(`${r.ver}: no "## ${r.ver} (" heading in CHANGELOG.md`);
    const mine = saves.filter(f => f.startsWith(r.ver + '-') && f.endsWith('.ardan'));
    if (!mine.length) bad.push(`${r.ver}: no sample save tests/saves/${r.ver}-*.ardan`);
    for (const f of mine) if (!readme.includes(`| \`${f}\` | ${r.ver} |`)) bad.push(`${r.ver}: ${f} has no line in tests/saves/README.md`);
  }
  for (const n of notes) console.log('note: ' + n);
  for (const b of bad) console.error('version check: ' + b);
  console.log(bad.length ? `versions: ${bad.length} disagreements over ${R.length} rows` : `versions ok: ${R.length} rows${remote ? ', release branches as recorded' : ''}`);
  process.exitCode = bad.length ? 1 : 0;
} else {
  console.log('usage: node tools/version.mjs list | get <version> [--out=f.html] | new <version> "Title" [--at=<sha>] [--ci=a,b] [--only-before=<sha>] [--sample=<recipe>] | make-save <version> [--sample=<recipe>] | check');
}
