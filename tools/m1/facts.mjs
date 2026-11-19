// M1 (D-142): the one continent's facts the creation screen shows before any world is built, from the built world itself:
// each province's terrain word, and the new name of an oasis the land left off dry ground. Run it after the map's seed
// or version changes (the test m1OneContinent fails until it is run).
//   node tools/m1/facts.mjs <built.html> [--out=data/map/one-continent.json]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright'); }
const args = process.argv.slice(2), opt = (k, d) => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const html = args.find(a => !a.startsWith('--'));
if (!html) { console.error('usage: node tools/m1/facts.mjs <built.html> [--out=data/map/one-continent.json]'); process.exit(1); }
const OUT = path.resolve(opt('out', 'data/map/one-continent.json'));
const b = await pw.chromium.launch();
const pg = await b.newPage();
await pg.goto(pathToFileURL(path.resolve(html)).href);
await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 180000 });
const d = await pg.evaluate(() => {
  const VM = A.V2MAP, w = VM.build(VM.ONE, VM.release()), names = {};
  for (const q of w.prov) if (q.retype) names[q.id] = q.retype.name;
  return { about: 'M1 (D-142): the one continent\'s terrain word per province id, and oases renamed by the land; written by tools/m1/facts.mjs', seed: VM.ONE, v: VM.VERSION, terr: w.prov.map(q => q.terr), names };
});
await b.close();
fs.mkdirSync(path.dirname(OUT), { recursive: true });
// one province a line, so a change reads in a diff
const body = JSON.stringify(d, null, 1).replace(/\[\n\s+"/, '["').replace(/",\n\s+"/g, '", "').replace(/"\n\s+\]/, '"]');
fs.writeFileSync(OUT, body + '\n');
console.log(`${path.relative(process.cwd(), OUT)}: ${d.seed} v${d.v}, ${d.terr.length} provinces, ${Object.keys(d.names).length} renamed`);
