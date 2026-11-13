// Build the game from the release's own source (src/core/release/, see its README.md) plus every feature in
// src/<system>/NN-name/ (tools/lib/features.mjs). vendor/ardan-b593143.html is the untouched original that source was
// made from (X1, docs/DECISIONS.md D-027); the build no longer reads it.
//
//   node tools/build.mjs                         all features -> index.html
//   node tools/build.mjs --out=/tmp/x.html       write somewhere else (parallel work must use this)
//   node tools/build.mjs --only=early-years      every feature of the default build plus the named ones (a work-in-progress
//                                                one is built only when named). Before X1 this built the fix layer alone
//                                                plus the named features; since the 203 patches are baked into the release
//                                                source, the release calls into many features' code, so a build without
//                                                them does not run (D-027).
//   node tools/build.mjs --without=chronicle     everything except the named features (the release source may call
//                                                their code: check the page boots, D-027)
//   node tools/build.mjs --unpack                also write the built blobs to .build/ for reading
//   node tools/build.mjs --unpack=/tmp/me/blobs  ...or to a private folder (parallel work must use this)
//   node tools/build.mjs --include-wip           also build folders marked work-in-progress
//   node tools/build.mjs --release=/tmp/me/rel   build from another copy of the release source (default src/core/release)
// A folder holding a file named .wip is work in progress: left out of the default build (and of tests/check)
// until the marker is removed, but built whenever --only names it.
//
// A feature is a folder src/<system>/NN-name/ that may hold:
//   patches.mjs   export default [{ id, blob, why, edits: [[find, replace, count = 1], ...] }]
//                 exact edits on the built text; blob is 'ardan-core' | 'ardan-content' | 'ardan-lore' | 'html'.
//                 Since X1 the default build has none: change src/core/release/ itself. Kept for a feature in flight.
//   *.core.js     readable code appended to the core blob (runs after the engine and UI are defined, before UI.init)
//   *.events.js   readable event packs appended to the content blob (each must call A.defEvents([...]))
//   test.mjs      browser tests, see tests/run.mjs
//   README.md     what it does, which aspect it serves, how it is measured
// data/**/*.json   content kept as data: each file is put on the page as A.DATA[<path without .json>] before any
//                 feature code runs (data/cultures/names.json -> A.DATA['cultures/names'])
// Features apply in folder-name order across all systems. A patch must match exactly as many times as it says, so a patch that no
// longer fits fails the build instead of silently doing nothing.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { repack, BLOBS } from './blob-pack.mjs';
import { allFeatures, findFeature, isWip as isWipFeature } from './lib/features.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const RELEASE = path.resolve(root, arg('release') || 'src/core/release');
const OUT = path.resolve(root, arg('out') || 'index.html');
const SEP = '\u0001ARDAN-PACK\u0001';

export const featureName = dir => dir.replace(/^\d+-/, '');
export const isWip = d => isWipFeature(d);
export function listFeatures({ only, without, includeWip } = {}) {
  const dirs = allFeatures().map(f => f.dir);
  return dirs.filter(d => {
    const n = featureName(d), fix = /^0\d-/.test(d);
    if (without && without.includes(n)) return false;
    if (only) return fix || only.includes(n) || !isWip(d);
    return includeWip || !isWip(d);
  });
}
// content kept as data (data/**/*.json), in path order, as one statement that runs before the first feature's code
function dataBlock() {
  const base = path.join(root, 'data'), out = [];
  const walk = d => { for (const f of fs.readdirSync(d).sort()) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (f.endsWith('.json')) out.push(p); } };
  if (fs.existsSync(base)) walk(base);
  if (!out.length) return '';
  const body = out.map(p => `${JSON.stringify(path.relative(base, p).replace(/\\/g, '/').replace(/\.json$/, ''))}: ${JSON.stringify(JSON.parse(fs.readFileSync(p, 'utf8')))}`).join(',\n');
  return `\n;(function(){ // data/**/*.json\nA.DATA = Object.assign(A.DATA || {}, {\n${body}\n});\n})();\n`;
}

// the release's source tree -> the page and its three blobs, exactly as the page runs them:
//   core/*.js in name order, one script (core/00-lore.json is the LORE table, written as the JSON.parse it always was);
//   content/*.js in name order, one event pack each, joined by the pack separator the bootloader splits on;
//   lore/NN-key.json in name order, the lazy lore tables as key\u0002json joined by \u0001 (A's LORE reads them so);
//   page.html, the page with its three payload slots empty.
export function readRelease(dir = RELEASE) {
  const ls = d => fs.readdirSync(path.join(dir, d)).filter(f => !f.startsWith('.')).sort();
  const read = (...p) => fs.readFileSync(path.join(dir, ...p), 'utf8');
  const core = ls('core').map(f => f.endsWith('.json')
    ? `const ${f.replace(/^\d+-|\.json$/g, '').toUpperCase()}=JSON.parse(${JSON.stringify(JSON.stringify(JSON.parse(read('core', f))))});`
    : read('core', f)).join('\n');
  const content = ls('content').map(f => read('content', f)).join(SEP);
  const lore = ls('lore').map(f => f.replace(/^\d+-|\.json$/g, '') + '\u0002' + JSON.stringify(JSON.parse(read('lore', f)))).join('\u0001');
  return { html: read('page.html'), parts: { 'ardan-core': core, 'ardan-content': content, 'ardan-lore': lore } };
}

const count = (s, f) => { let n = 0, i = -1; while ((i = s.indexOf(f, i + 1)) >= 0) n++; return n; };

async function build() {
  const only = arg('only') ? arg('only').split(',') : null, without = arg('without') ? arg('without').split(',') : null;
  const feats = listFeatures({ only, without, includeWip: process.argv.includes('--include-wip') });
  const skipped = allFeatures().map(f => f.dir).filter(d => !feats.includes(d) && isWip(d));
  if (skipped.length && !only) console.log(`left out (work in progress): ${skipped.join(', ')}`);
  let { html, parts } = readRelease();
  const ids = new Set(), stats = [];
  parts['ardan-core'] += dataBlock();
  for (const dir of feats) {
    const feat = findFeature(dir), fdir = feat.path, files = fs.readdirSync(fdir).sort();
    let patches = [], nCore = 0, nPacks = 0;
    if (files.includes('patches.mjs')) patches = (await import(pathToFileURL(path.join(fdir, 'patches.mjs')).href + `?t=${Date.now()}`)).default;
    for (const p of patches) {
      if (ids.has(p.id)) throw new Error(`${dir}: duplicate patch id ${p.id}`);
      ids.add(p.id);
      for (const [find, replace, want = 1] of p.edits) {
        const target = p.blob === 'html' ? html : parts[p.blob];
        if (target == null) throw new Error(`${dir}/${p.id}: unknown blob ${p.blob}`);
        const n = count(target, find);
        if (n !== want) throw new Error(`${dir}/${p.id}: expected ${want} match(es), found ${n}:\n  ${find.slice(0, 200)}`);
        const next = target.split(find).join(replace);
        if (p.blob === 'html') html = next; else parts[p.blob] = next;
      }
    }
    for (const f of files.filter(f => f.endsWith('.core.js'))) {
      parts['ardan-core'] += `\n;(function(){ // ${feat.rel}/${f}\n${fs.readFileSync(path.join(fdir, f), 'utf8')}\n})();\n`;
      nCore++;
    }
    for (const f of files.filter(f => f.endsWith('.events.js'))) {
      parts['ardan-content'] += SEP + `// ${feat.rel}/${f}\n` + fs.readFileSync(path.join(fdir, f), 'utf8') + '\n';
      nPacks++;
    }
    stats.push({ feature: dir, patches: patches.length, core: nCore, packs: nPacks });
  }
  html = repack(html, parts);
  const tag = crypto.createHash('sha256').update(feats.join(',') + '|' + [...ids].join(',')).digest('hex').slice(0, 7);
  html = html.replace(/window\.ARDAN_BUILD = '([^'@+]+)[^']*'/, (_, b) => `window.ARDAN_BUILD = '${b}+f${feats.length}.${tag}'`);
  // the page's own inline scripts are allowed by hash in the Content-Security-Policy
  const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => `'sha256-${crypto.createHash('sha256').update(m[1], 'utf8').digest('base64')}'`);
  html = html.replace('__SCRIPT_HASHES__', hashes.join(' '));
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, html);
  console.log(`${path.relative(root, OUT) || OUT}: ${feats.length} features, ${ids.size} patches, ${stats.reduce((a, s) => a + s.core, 0)} code files, ` +
    `${stats.reduce((a, s) => a + s.packs, 0)} event packs, ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB`);
  if (process.argv.some(a => a === '--unpack' || a.startsWith('--unpack='))) {
    const dir = path.resolve(root, arg('unpack') || '.build');
    fs.mkdirSync(dir, { recursive: true });
    for (const id of BLOBS) fs.writeFileSync(path.join(dir, id + '.js'), parts[id]);
    console.log(`wrote ${path.relative(root, dir) || dir}/` + BLOBS.join('.js, ') + '.js');
  }
}
if (import.meta.url === pathToFileURL(process.argv[1]).href) build().catch(e => { console.error(e.message); process.exit(1); });
