// Merge the runner's --times-out files into tests/test-times.json (T1, D-063).
//   node tools/test-times.mjs a.json b.json ...      a name seen before is averaged 1:1 with the old value
// The long workflow runs this over every shard's file and uploads the result: commit it to keep the shard plan honest.
// Afterwards `node tests/run.mjs --check-tiers` says which test has crossed the threshold and must join tests/long-tests.json.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dest = path.join(root, process.env.TIMES_FILE || 'tests/test-times.json');
const times = fs.existsSync(dest) ? JSON.parse(fs.readFileSync(dest, 'utf8')) : {};
for (const f of process.argv.slice(2)) {
  for (const [n, s] of Object.entries(JSON.parse(fs.readFileSync(f, 'utf8')))) times[n] = times[n] == null ? s : Math.round((times[n] + s) / 2);
}
const sorted = Object.fromEntries(Object.entries(times).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)));
fs.writeFileSync(dest, JSON.stringify(sorted, null, 1) + '\n');
console.log(`${Object.keys(sorted).length} test times written to ${path.relative(root, dest)}`);
