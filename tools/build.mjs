// Build index.html from the vendored release plus the patch list.
//   node tools/build.mjs            build index.html
//   node tools/build.mjs --unpack   also write the patched blobs to .build/ for reading
// Each patch must match exactly as many times as it says (default 1), so a patch that
// no longer fits the code fails loudly instead of silently doing nothing.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { unpack, repack, BLOBS } from './pack.mjs';
import PATCHES from './patches.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'vendor/ardan-b593143.html');
const OUT = path.join(root, 'index.html');

const count = (s, f) => { let n = 0, i = -1; while ((i = s.indexOf(f, i + 1)) >= 0) n++; return n; };

let html = fs.readFileSync(SRC, 'utf8');
const parts = unpack(html);
const ids = new Set();
for (const p of PATCHES) {
  if (ids.has(p.id)) throw new Error('duplicate patch id ' + p.id);
  ids.add(p.id);
  for (const [find, replace, want = 1] of p.edits) {
    const target = p.blob === 'html' ? html : parts[p.blob];
    if (target == null) throw new Error(`${p.id}: unknown blob ${p.blob}`);
    const n = count(target, find);
    if (n !== want) throw new Error(`${p.id}: expected ${want} match(es), found ${n}:\n  ${find.slice(0, 160)}`);
    const next = target.split(find).join(replace);
    if (p.blob === 'html') html = next; else parts[p.blob] = next;
  }
}
html = repack(html, parts);

// stamp the build so problem reports say which patches they ran with
const tag = crypto.createHash('sha256').update(PATCHES.map(p => p.id).join(',')).digest('hex').slice(0, 7);
html = html.replace(/window\.ARDAN_BUILD = '([^'@+]+)[^']*'/, (_, b) => `window.ARDAN_BUILD = '${b}+p${PATCHES.length}.${tag}'`);

// the inline scripts are allowed by hash in the Content-Security-Policy
const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map(m => `'sha256-${crypto.createHash('sha256').update(m[1], 'utf8').digest('base64')}'`);
html = html.replace('__SCRIPT_HASHES__', hashes.join(' '));

fs.writeFileSync(OUT, html);
console.log(`index.html: ${PATCHES.length} patches, ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB (source ${(fs.statSync(SRC).size / 1024).toFixed(0)} KB)`);

if (process.argv.includes('--unpack')) {
  const dir = path.join(root, '.build');
  fs.mkdirSync(dir, { recursive: true });
  for (const id of BLOBS) fs.writeFileSync(path.join(dir, id + '.js'), parts[id]);
  console.log('wrote .build/' + BLOBS.join('.js, ') + '.js');
}
