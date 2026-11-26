// Everything a change must pass, in one command (CI runs this):
//   1. build index.html from src/core/release/ (the release's own source, X1) + src/<system>/NN-name/ features (X5, D-109: it is not
//      committed; CI builds it once a run and shares it; a stale copy is simply rebuilt)
//   2. lint and play-test every feature's event packs
//   3. check that no feature event has an obviously best choice (tools/lint-choices.mjs), the named stages (tools/lint-stages.mjs),
//      the skills (tools/lint-skills.mjs), the titles (tools/lint-titles.mjs)
//      that no new decision in AI code is a bare roll of the dice (tools/lint-reasons.mjs)
//      and that no event names kin who are not in the tree (tools/lint-kin.mjs)
//      and that docs/README.md lists every doc and links no missing file (tools/lint-docs-index.mjs)
//   4. run every browser test
//   5. play the balance league and hold each path's numbers to their bands (tools/bench/balance.mjs, tools/bench/targets.mjs)
//   6. (retired in v2 step 2 with the Far Lands: the Great Continent league)
//   node tools/check.mjs [--skip-tests] [--skip-balance] [--skip-great] [--shard=k/n] [--tier=quick|long|all]
//   (T1, D-063: tests/long-tests.json lists the long tier; --tier=quick is the push check, long.yml runs the rest; this file also holds the list honest)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { featureDirs, featurePath } from './lib/features.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = (args, opts = {}) => execFileSync(process.execPath, args, { cwd: root, stdio: 'inherit', ...opts });
// Ardan v2's engine: its bundle must match src/*/engine/, and its own unit tests (tests/v2) must pass (a failure blocks a release)
try { run(['tools/build-v2.mjs', '--check']); } catch { process.exitCode = 1; }
try { execFileSync(process.execPath, ['--test', ...fs.readdirSync(path.join(root, 'tests/v2')).filter(f => f.endsWith('.test.js')).map(f => 'tests/v2/' + f)], { cwd: root, stdio: 'pipe' }); console.log('v2 tests ok (tests/v2)'); }
catch (e) { console.error('v2 tests FAILED (node --test tests/v2):\n' + String(e.stdout || '').split('\n').filter(l => /^not ok|# (pass|fail)/.test(l)).join('\n')); process.exitCode = 1; }
run(['tools/build.mjs']);
let lintFailed = 0;
for (const d of featureDirs().sort()) {
  const dir = featurePath(d);
  if (!fs.statSync(dir).isDirectory() || fs.existsSync(path.join(dir, '.wip')) || !fs.readdirSync(dir).some(f => f.endsWith('.events.js'))) continue;
  try { execFileSync(process.execPath, ['tools/lint-events.mjs', `--feature=${d.replace(/^\d+-/, '')}`], { cwd: root, stdio: 'pipe' }); console.log(`lint ok   ${d}`); }
  catch (e) { lintFailed++; console.error(`lint FAIL ${d}\n${String(e.stdout || '').slice(0, 4000)}`); }
}
// the checklist every new event must pass: no choice that is obviously best (tools/lint-choices.mjs)
try { execFileSync(process.execPath, ['tools/lint-choices.mjs', '--all-features'], { cwd: root, stdio: 'pipe' }); console.log('choices ok (no obviously best choice in any feature event)'); }
catch (e) { lintFailed++; console.error(`choices FAIL\n${String(e.stdout || '').slice(0, 4000)}`); }
// the named stages (X2, D-056): the hot functions are only added to by A.addStage, and fewer names are defined twice
try { execFileSync(process.execPath, ['tools/lint-stages.mjs'], { cwd: root, stdio: 'pipe' }); console.log('stages ok (tools/lint-stages.mjs)'); }
catch (e) { lintFailed++; console.error(`stages FAIL\n${String(e.stdout || '').slice(0, 2000)}${String(e.stderr || '').slice(0, 4000)}`); }
// no event names kin who are not in the tree (C6, D-057)
try { execFileSync(process.execPath, ['tools/lint-kin.mjs'], { cwd: root, stdio: 'pipe' }); console.log('kin ok (tools/lint-kin.mjs)'); }
catch (e) { lintFailed++; console.error(`kin FAIL\n${String(e.stdout || '').slice(0, 4000)}`); }
// skills (S1b, D-072): no proficiency a player can read, the data whole, older code's writes and calls only falling
try { execFileSync(process.execPath, ['tools/lint-skills.mjs'], { cwd: root, stdio: 'pipe' }); console.log('skills ok (tools/lint-skills.mjs)'); }
catch (e) { lintFailed++; console.error(`skills FAIL\n${String(e.stdout || '').slice(0, 2000)}${String(e.stderr || '').slice(0, 4000)}`); }
// titles (D-183): the data whole, within budget, every condition declared and satisfiable, no screen reading a condition
try { execFileSync(process.execPath, ['tools/lint-titles.mjs'], { cwd: root, stdio: 'pipe' }); console.log('titles ok (tools/lint-titles.mjs)'); }
catch (e) { lintFailed++; console.error(`titles FAIL\n${String(e.stdout || '').slice(0, 2000)}${String(e.stderr || '').slice(0, 4000)}`); }
// nothing without reason (R1, rule 18, D-069): no more bare-dice decisions in AI code than tests/reasons-baseline.json
try { execFileSync(process.execPath, ['tools/lint-reasons.mjs'], { cwd: root, stdio: 'pipe' }); console.log('reasons ok (tools/lint-reasons.mjs)'); }
catch (e) { lintFailed++; console.error(`reasons FAIL\n${String(e.stdout || '').slice(0, 2000)}${String(e.stderr || '').slice(0, 4000)}`); }
// the docs index is whole and true: every doc under docs/ is listed in docs/README.md, no link in it is dead
try { execFileSync(process.execPath, ['tools/lint-docs-index.mjs'], { cwd: root, stdio: 'pipe' }); console.log('docs index ok (tools/lint-docs-index.mjs)'); }
catch (e) { lintFailed++; console.error(`docs index FAIL\n${String(e.stderr || '').slice(0, 2000)}${String(e.stdout || '').slice(0, 2000)}`); }
// the long list is honest: a test over the threshold on CI is in tests/long-tests.json (T1, D-063)
// the versions agree (D-134, order 65): rows, release branches (read from origin when it answers), changelog headings,
// sample saves; offline and in a shallow clone the parts it cannot see are skipped
try { execFileSync(process.execPath, ['tools/version.mjs', 'check'], { cwd: root, stdio: 'pipe' }); console.log('versions ok (tools/version.mjs check)'); }
catch (e) { lintFailed++; console.error(`versions FAIL\n${String(e.stderr || '').slice(0, 2000)}${String(e.stdout || '').slice(0, 2000)}`); }
try { execFileSync(process.execPath, ['tests/run.mjs', '--check-tiers'], { cwd: root, stdio: 'pipe' }); console.log('tiers ok (tests/long-tests.json)'); }
catch (e) { lintFailed++; console.error(`tiers FAIL\n${String(e.stderr || '').slice(0, 4000)}`); }
if (lintFailed) process.exitCode = 1;
if (!process.argv.includes('--skip-tests')) { try { run(['tests/run.mjs', `--workers=${process.env.CI ? 4 : 1}`].concat(process.argv.filter(a => a.startsWith('--shard=') || a.startsWith('--tier=')))); } catch { process.exitCode = 1; } }
// balance: target numbers per path, held by a fixed-seed league (tools/bench/targets.mjs)
if (!process.argv.includes('--skip-balance')) { try { run(['tools/bench/balance.mjs', 'index.html']); } catch { process.exitCode = 1; } }
// the Great Continent league (tools/bench/targets.mjs GREAT): about four times the Known World's cost a life-year
// the Great Continent league (--lands=great) left with the Far Lands in v2 step 2
