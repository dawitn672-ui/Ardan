// X1 (D-027): bake the patch layer into the release. One-time conversion, kept so it can be re-run and audited.
//
//   node tools/release/bake.mjs --patches=archive/x1-patch-layer --out=/tmp/ardan/x1/baked
//
// It replays exactly what tools/build.mjs did before X1, for the default build: unpack vendor/ardan-b593143.html, then
// for every feature in build order apply its patches.mjs edits and append its *.core.js / *.events.js. Each blob is
// kept as a list of segments (the release's own text, the data block, each appended feature file and the wrappers
// around it), so every edit lands in exactly one segment and is recorded as a site there. A match that crosses two
// segments, or that lands in a wrapper, stops the bake. The output:
//   <out>/core.js, content.js, lore.txt, page.html   the patched release (still minified), and the page with its html
//                                                     patches applied and its three payloads emptied
//   <out>/features/<rel path>                        feature files that a later feature's patch edited (baked there)
//   <out>/sites.json                                 every edit: patch id, feature, why, blob, segment and offsets
// The bake is proved by tools/release/verify.mjs (byte-identical blobs to the pre-X1 build).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { unpack, BLOBS } from '../blob-pack.mjs';
import { allFeatures, isWip } from '../lib/features.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SEP = '\u0001ARDAN-PACK\u0001';
const countAll = (s, f) => { let n = 0, i = -1; while ((i = s.indexOf(f, i + 1)) >= 0) n++; return n; };

// the data block exactly as tools/build.mjs wrote it before X1
function dataBlock() {
  const base = path.join(root, 'data'), out = [];
  const walk = d => { for (const f of fs.readdirSync(d).sort()) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (f.endsWith('.json')) out.push(p); } };
  if (fs.existsSync(base)) walk(base);
  if (!out.length) return '';
  const body = out.map(p => `${JSON.stringify(path.relative(base, p).replace(/\\/g, '/').replace(/\.json$/, ''))}: ${JSON.stringify(JSON.parse(fs.readFileSync(p, 'utf8')))}`).join(',\n');
  return `\n;(function(){ // data/**/*.json\nA.DATA = Object.assign(A.DATA || {}, {\n${body}\n});\n})();\n`;
}

// patchesDir: where each feature's patches.mjs is found ('src' = in the feature folder, else <dir>/<rel>/patches.mjs)
export async function bake({ patchesDir = 'src' } = {}) {
  const html0 = fs.readFileSync(path.join(root, 'vendor/ardan-b593143.html'), 'utf8');
  const parts = unpack(html0);
  const seg = (kind, text, extra = {}) => ({ kind, text, sites: [], ...extra });
  const S = {
    'ardan-core': [seg('release', parts['ardan-core']), seg('data', dataBlock())],
    'ardan-content': [seg('release', parts['ardan-content'])],
    'ardan-lore': [seg('release', parts['ardan-lore'])],
    html: [seg('release', html0)],
  };
  const feats = allFeatures().filter(f => !isWip(f.dir));
  const log = [];
  for (const feat of feats) {
    const pfile = patchesDir === 'src' ? path.join(feat.path, 'patches.mjs') : path.join(root, patchesDir, feat.rel, 'patches.mjs');
    const patches = fs.existsSync(pfile) ? (await import(pathToFileURL(pfile).href)).default : [];
    for (const p of patches) {
      const segs = S[p.blob];
      p.edits.forEach(([find, replace, want = 1], ei) => {
        const whole = segs.map(s => s.text).join('');
        const n = countAll(whole, find);
        if (n !== want) throw new Error(`${feat.rel}/${p.id}: expected ${want}, found ${n}`);
        // the same matches split/join takes: left to right, never overlapping
        const at = []; for (let i = whole.indexOf(find); i >= 0; i = whole.indexOf(find, i + find.length)) at.push(i);
        let base = 0; const bounds = segs.map(s => { const b = [base, base + s.text.length]; base += s.text.length; return b; });
        // apply right to left inside each segment so earlier offsets stay valid
        for (const pos of at.reverse()) {
          const k = bounds.findIndex(([a, b]) => pos >= a && pos + find.length <= b);
          if (k < 0) throw new Error(`${feat.rel}/${p.id}: a match crosses two segments`);
          const s = segs[k];
          if (s.kind === 'wrap' || s.kind === 'data') throw new Error(`${feat.rel}/${p.id}: a match lands in ${s.kind}`);
          const i = pos - bounds[k][0], d = replace.length - find.length;
          s.text = s.text.slice(0, i) + replace + s.text.slice(i + find.length);
          for (const x of s.sites) { if (x.start >= i + find.length) { x.start += d; x.end += d; } else if (x.end > i) { x.end = Math.max(x.start, x.end + d); } }
          s.sites.push({ id: p.id, edit: ei, feature: feat.rel, blob: p.blob, why: p.why, start: i, end: i + replace.length });
          log.push({ id: p.id, edit: ei, feature: feat.rel, blob: p.blob, segment: s.kind === 'file' ? s.file : 'release' });
        }
      });
    }
    for (const f of fs.readdirSync(feat.path).sort()) {
      // a feature file that the bake itself edited is read as it was before X1 (its copy in the archive), so the bake
      // can be re-run after X1 wrote the edit into the file
      const rel = `${feat.rel}/${f}`, before = path.join(root, patchesDir, rel);
      const text = fs.readFileSync(patchesDir !== 'src' && fs.existsSync(before) ? before : path.join(feat.path, f), 'utf8');
      if (f.endsWith('.core.js')) S['ardan-core'].push(seg('wrap', `\n;(function(){ // ${rel}\n`), seg('file', text, { file: rel, orig: text }), seg('wrap', '\n})();\n'));
      if (f.endsWith('.events.js')) S['ardan-content'].push(seg('wrap', SEP + `// ${rel}\n`), seg('file', text, { file: rel, orig: text }), seg('wrap', '\n'));
    }
  }
  const release = k => S[k][0];
  const featureFiles = {};
  for (const k of Object.keys(S)) for (const s of S[k]) if (s.kind === 'file' && s.text !== s.orig) featureFiles[s.file] = s.text;
  const blobs = Object.fromEntries(BLOBS.map(k => [k, S[k].map(s => s.text).join('')]));
  return {
    core: release('ardan-core').text, content: release('ardan-content').text, lore: release('ardan-lore').text,
    html: release('html').text, featureFiles, blobs, log,
    sites: { core: release('ardan-core').sites, content: release('ardan-content').sites, lore: release('ardan-lore').sites, html: release('html').sites,
      files: Object.fromEntries(Object.values(S).flat().filter(s => s.kind === 'file' && s.sites.length).map(s => [s.file, s.sites])) },
  };
}

// the page with its three payloads emptied (the build fills them)
export const emptyPage = html => html.replace(/(<script type="text\/plain" id="(ardan-[a-z]+)" data-n=")\d+(">)[\s\S]*?(<\/script>)/g, '$10$3$4');

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
  const out = path.resolve(arg('out') || '/tmp/ardan/x1/baked');
  const r = await bake({ patchesDir: arg('patches') || 'src' });
  fs.mkdirSync(path.join(out, 'features'), { recursive: true });
  fs.writeFileSync(path.join(out, 'core.js'), r.core);
  fs.writeFileSync(path.join(out, 'content.js'), r.content);
  fs.writeFileSync(path.join(out, 'lore.txt'), r.lore);
  fs.writeFileSync(path.join(out, 'page.html'), emptyPage(r.html));
  for (const [k, v] of Object.entries(r.blobs)) fs.writeFileSync(path.join(out, k + '.full.js'), v);
  for (const [f, t] of Object.entries(r.featureFiles)) { fs.mkdirSync(path.dirname(path.join(out, 'features', f)), { recursive: true }); fs.writeFileSync(path.join(out, 'features', f), t); }
  fs.writeFileSync(path.join(out, 'sites.json'), JSON.stringify({ sites: r.sites, log: r.log }, null, 1));
  const segs = {}; for (const l of r.log) segs[l.segment] = (segs[l.segment] || 0) + 1;
  console.log(`baked ${new Set(r.log.map(l => l.id)).size} patches, ${r.log.length} replacements; by segment:`, segs);
}
