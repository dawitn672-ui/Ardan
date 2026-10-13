// Build the game from the vendored release plus every feature in features/.
//
//   node tools/build.mjs                         all features -> index.html
//   node tools/build.mjs --out=/tmp/x.html       write somewhere else (parallel work must use this)
//   node tools/build.mjs --only=ai-personality   the fix layer (00-09) plus the named features
//   node tools/build.mjs --without=chronicle     everything except the named features
//   node tools/build.mjs --unpack                also write the built blobs to .build/ for reading
//   node tools/build.mjs --unpack=/tmp/me/blobs  ...or to a private folder (parallel work must use this)
//   node tools/build.mjs --include-wip           also build folders marked work-in-progress
// A folder holding a file named .wip is work in progress: left out of the default build (and of tests/check)
// until the marker is removed, but built whenever --only names it.
//
// A feature is a folder features/NN-name/ that may hold:
//   patches.mjs   export default [{ id, blob, why, edits: [[find, replace, count = 1], ...] }]
//                 exact edits on the minified code; blob is 'ardan-core' | 'ardan-content' | 'ardan-lore' | 'html'
//   *.core.js     readable code appended to the core blob (runs after the engine and UI are defined, before UI.init)
//   *.events.js   readable event packs appended to the content blob (each must call A.defEvents([...]))
//   test.mjs      browser tests, see tests/run.mjs
//   README.md     what it does, which aspect it serves, how it is measured
// Features apply in folder order. A patch must match exactly as many times as it says, so a patch that no
// longer fits fails the build instead of silently doing nothing.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { unpack, repack, BLOBS } from './pack.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const SRC = path.join(root, 'vendor/ardan-b593143.html');
const OUT = path.resolve(root, arg('out') || 'index.html');
const SEP = '\u0001ARDAN-PACK\u0001';

export const featureName = dir => dir.replace(/^\d+-/, '');
export const isWip = d => fs.existsSync(path.join(root, 'features', d, '.wip'));
export function listFeatures({ only, without, includeWip } = {}) {
  const dirs = fs.readdirSync(path.join(root, 'features')).filter(d => /^\d+-/.test(d) && fs.statSync(path.join(root, 'features', d)).isDirectory()).sort();
  return dirs.filter(d => {
    const n = featureName(d), fix = /^0\d-/.test(d);
    if (without && without.includes(n)) return false;
    if (only) return fix || only.includes(n);
    return includeWip || !isWip(d);
  });
}

const count = (s, f) => { let n = 0, i = -1; while ((i = s.indexOf(f, i + 1)) >= 0) n++; return n; };

async function build() {
  const only = arg('only') ? arg('only').split(',') : null, without = arg('without') ? arg('without').split(',') : null;
  const feats = listFeatures({ only, without, includeWip: process.argv.includes('--include-wip') });
  const skipped = fs.readdirSync(path.join(root, 'features')).filter(d => /^\d+-/.test(d) && !feats.includes(d) && isWip(d));
  if (skipped.length && !only) console.log(`left out (work in progress): ${skipped.join(', ')}`);
  let html = fs.readFileSync(SRC, 'utf8');
  const parts = unpack(html);
  const ids = new Set(), stats = [];
  for (const dir of feats) {
    const fdir = path.join(root, 'features', dir), files = fs.readdirSync(fdir).sort();
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
      parts['ardan-core'] += `\n;(function(){ // features/${dir}/${f}\n${fs.readFileSync(path.join(fdir, f), 'utf8')}\n})();\n`;
      nCore++;
    }
    for (const f of files.filter(f => f.endsWith('.events.js'))) {
      parts['ardan-content'] += SEP + `// features/${dir}/${f}\n` + fs.readFileSync(path.join(fdir, f), 'utf8') + '\n';
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
