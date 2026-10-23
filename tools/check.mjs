// Everything a change must pass, in one command (CI runs this):
//   1. build index.html from vendor/ + features/ and confirm the committed index.html is current
//   2. lint and play-test every feature's event packs
//   3. check that no feature event has an obviously best choice (tools/lint-choices.mjs)
//   4. run every browser test
//   5. play the balance league and hold each path's numbers to their bands (bench/balance.mjs, bench/targets.mjs)
//   node tools/check.mjs [--skip-tests] [--skip-balance] [--shard=k/n]
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
  if (!fs.statSync(dir).isDirectory() || fs.existsSync(path.join(dir, '.wip')) || !fs.readdirSync(dir).some(f => f.endsWith('.events.js'))) continue;
  try { execFileSync(process.execPath, ['tools/lint-events.mjs', `--feature=${d.replace(/^\d+-/, '')}`], { cwd: root, stdio: 'pipe' }); console.log(`lint ok   ${d}`); }
  catch (e) { lintFailed++; console.error(`lint FAIL ${d}\n${String(e.stdout || '').slice(0, 4000)}`); }
}
// the checklist every new event must pass: no choice that is obviously best (tools/lint-choices.mjs)
try { execFileSync(process.execPath, ['tools/lint-choices.mjs', '--all-features'], { cwd: root, stdio: 'pipe' }); console.log('choices ok (no obviously best choice in any feature event)'); }
catch (e) { lintFailed++; console.error(`choices FAIL\n${String(e.stdout || '').slice(0, 4000)}`); }
if (lintFailed) process.exitCode = 1;
if (!process.argv.includes('--skip-tests')) { try { run(['tests/run.mjs', `--workers=${process.env.CI ? 4 : 1}`].concat(process.argv.filter(a => a.startsWith('--shard=')))); } catch { process.exitCode = 1; } }
// balance: target numbers per path, held by a fixed-seed league (bench/targets.mjs)
if (!process.argv.includes('--skip-balance')) { try { run(['bench/balance.mjs', 'index.html']); } catch { process.exitCode = 1; } }
