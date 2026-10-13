// Everything a change must pass, in one command (CI runs this):
//   1. build index.html from vendor/ + features/ and confirm the committed index.html is current
//   2. lint and play-test every feature's event packs
//   3. run every browser test
//   node tools/check.mjs [--skip-tests]
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = (args, opts = {}) => execFileSync(process.execPath, args, { cwd: root, stdio: 'inherit', ...opts });
const before = fs.existsSync(path.join(root, 'index.html')) ? fs.readFileSync(path.join(root, 'index.html')) : null;
run(['tools/build.mjs']);
const after = fs.readFileSync(path.join(root, 'index.html'));
if (before && !before.equals(after)) { console.error('index.html was out of date with features/: rebuilt it. Commit the new index.html.'); process.exitCode = 1; }
let lintFailed = 0;
for (const d of fs.readdirSync(path.join(root, 'features')).sort()) {
  const dir = path.join(root, 'features', d);
  if (!fs.statSync(dir).isDirectory() || !fs.readdirSync(dir).some(f => f.endsWith('.events.js'))) continue;
  try { execFileSync(process.execPath, ['tools/lint-events.mjs', `--feature=${d.replace(/^\d+-/, '')}`], { cwd: root, stdio: 'pipe' }); console.log(`lint ok   ${d}`); }
  catch (e) { lintFailed++; console.error(`lint FAIL ${d}\n${String(e.stdout || '').slice(0, 4000)}`); }
}
if (lintFailed) process.exitCode = 1;
if (!process.argv.includes('--skip-tests')) { try { run(['tests/run.mjs']); } catch { process.exitCode = 1; } }
