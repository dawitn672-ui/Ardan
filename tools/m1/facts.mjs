// M1 (D-142, D-151): the one continent's facts, from the built world itself (A.V2MAP.factsOf, src/map/99991-v2-map/f-facts):
//   - per province, its terrain word and the new name of an oasis the land left off dry ground (what the creation screen
//     shows before any world is built, VM.oneFacts);
//   - per realm, its capital, compass place, coasts, seas, lakes, terrain mix, high ground, rivers, ranges, forests,
//     neighbours and towns; the waters, rivers, ranges, forests and passes with the realms they touch (what
//     tools/lint-lore-map.mjs holds the world's words to).
// Reads any map: by default the one continent (A.V2MAP.ONE at A.V2MAP.VERSION); --map=<map seed> --v=<version> another.
// Run it after the map's seed or version changes (the test m1OneContinent fails until it is run).
//   node tools/m1/facts.mjs <built.html> [--out=data/map/one-continent.json] [--map=ardan-v2-map:x] [--v=3]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright'); }
const args = process.argv.slice(2), opt = (k, d) => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const html = args.find(a => !a.startsWith('--'));
if (!html) { console.error('usage: node tools/m1/facts.mjs <built.html> [--out=data/map/one-continent.json] [--map=seed] [--v=n]'); process.exit(1); }
const OUT = path.resolve(opt('out', 'data/map/one-continent.json'));
const b = await pw.chromium.launch();
const pg = await b.newPage();
const errs = []; pg.on('pageerror', e => errs.push(String(e.message || e)));
await pg.goto(pathToFileURL(path.resolve(html)).href);
await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 180000 });
const d = await pg.evaluate(({ map, v }) => {
  const VM = A.V2MAP, one = VM.ONE, ver = VM.VERSION;
  if (map) VM.ONE = map;
  if (v) VM.VERSION = +v;
  try {
    // a life on that map, so the state's names (D9's rivers, ranges, forests, seas) are the map's own
    A.newGame({ seed: 1, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
    const w = VM.world(A.S.v2map.seed, A.S.v2map.v), names = {};
    for (const q of w.prov) if (q.retype) names[q.id] = q.retype.name;
    const F = VM.factsOf(w);
    return Object.assign({ about: 'M1 (D-142, D-151): the one continent\'s facts, read from the built map by tools/m1/facts.mjs (A.V2MAP.factsOf). terr and names: per province id (the creation screen); realms, waters, rivers, ranges, forests, passes: what the lore must agree with (tools/lint-lore-map.mjs)',
      seed: w.seed, v: w.v, terr: w.prov.map(q => q.terr), names }, { facts: F });
  } finally { VM.ONE = one; VM.VERSION = ver; }
}, { map: opt('map', null), v: opt('v', null) });
await b.close();
if (errs.length) { console.error('page errors: ' + errs.slice(0, 3).join(' | ')); process.exit(1); }
fs.mkdirSync(path.dirname(OUT), { recursive: true });
// one realm, water or feature a line, so a change reads in a diff
const F = d.facts; delete d.facts;
const line = x => JSON.stringify(x);
const out = ['{'];
for (const k of Object.keys(d)) out.push(` ${line(k)}: ${line(d[k])},`);
out.push(' "facts": {', `  "v": ${F.v}, "seed": ${line(F.seed)}, "map": ${F.map},`, '  "realms": {');
const ids = Object.keys(F.realms);
ids.forEach((id, i) => out.push(`   ${line(id)}: ${line(F.realms[id])}${i < ids.length - 1 ? ',' : ''}`));
out.push('  },');
for (const k of ['waters', 'rivers', 'ranges', 'forests', 'passes']) {
  out.push(`  ${line(k)}: [`);
  F[k].forEach((x, i) => out.push(`   ${line(x)}${i < F[k].length - 1 ? ',' : ''}`));
  out.push(k === 'passes' ? '  ]' : '  ],');
}
out.push(' }', '}');
const text = out.join('\n') + '\n';
JSON.parse(text);   // it must read back
fs.writeFileSync(OUT, text);
console.log(`${path.relative(process.cwd(), OUT)}: ${d.seed} v${d.v}, ${d.terr.length} provinces, ${ids.length} realms, ${F.waters.length} waters, ${F.rivers.length} rivers, ${F.ranges.length} ranges, ${F.forests.length} forests, ${Object.keys(d.names).length} renamed (${Math.round(text.length / 1024)} KB)`);
