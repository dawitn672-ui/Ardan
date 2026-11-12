// Cuts MakeHuman's CC0 base mesh (hm08) and shape targets down to what Ardan's painter needs, and writes them as one
// plain ES module, src/people/engine/basemesh.data.js (characters.md §2, the fallback "a sculpted CC0 base").
//
// Source and licence: the MakeHuman project's base mesh and targets, "explicitly released as CC0 in september 2020"
// (the header of every file in github.com/makehumancommunity/makehuman, makehuman/data). The age and sex targets
// (macrodetails) are empty in that repository and are taken from the same assets as carried by
// github.com/makehumancommunity/mpfb2 (src/mpfb/data/targets, gzipped). MakeHuman's code (AGPL) and MPFB's code (GPL) are
// not used: only the mesh and the target numbers.
//
//   node docs/design/demo/mh-prep.mjs <cache-dir>     downloads what is missing into <cache-dir>, writes the module
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const cache = process.argv[2] || '/tmp/ardan-mh';
fs.mkdirSync(cache, { recursive: true });
const MH = 'https://raw.githubusercontent.com/makehumancommunity/makehuman/master/makehuman/data/';
const MP = 'https://raw.githubusercontent.com/makehumancommunity/mpfb2/master/src/mpfb/data/targets/';

async function get(p, gz) {
  const f = path.join(cache, p.replace(/\//g, '__'));
  if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8');
  let txt = null;
  if (!gz) { const r = await fetch(MH + p); if (r.ok) txt = await r.text(); }
  const hasData = t => t && t.split('\n').some(l => l && !l.startsWith('#'));
  if (!hasData(txt) && p.startsWith('targets/')) { const r = await fetch(MP + p.slice(8) + '.gz'); if (r.ok) txt = zlib.gunzipSync(Buffer.from(await r.arrayBuffer())).toString(); }
  if (!hasData(txt)) return null;
  fs.writeFileSync(f, txt); return txt;
}

// ---------- the mesh: the body's skin and the two eyeballs
const obj = (await get('3dobjs/base.obj')).split('\n');
const V = [], faces = { body: [], 'helper-l-eye': [], 'helper-r-eye': [] }; let grp = '';
for (const l of obj) {
  if (l.startsWith('v ')) V.push(l.split(/\s+/).slice(1, 4).map(Number));
  else if (l.startsWith('g ')) grp = l.slice(2).trim();
  else if (l.startsWith('f ') && faces[grp]) { const ids = l.trim().split(/\s+/).slice(1).map(s => parseInt(s, 10) - 1); if (ids.length === 3) ids.push(ids[2]); faces[grp].push(ids); }
}
const used = new Map(), order = [];
for (const k of Object.keys(faces)) for (const f of faces[k]) for (const i of f) if (!used.has(i)) { used.set(i, order.length); order.push(i); }
const nv = order.length;
const pos = new Int16Array(nv * 3);
order.forEach((oi, ni) => { for (let c = 0; c < 3; c++) pos[ni * 3 + c] = Math.round(V[oi][c] * 2000); });   // 0.05 mm steps
const F = [], ranges = {};
for (const k of Object.keys(faces)) { ranges[k] = [F.length / 4, 0]; for (const f of faces[k]) F.push(...f.map(i => used.get(i))); ranges[k][1] = F.length / 4; }
const quads = Uint16Array.from(F);

// ---------- the targets
const T = [];
for (const s of ['male', 'female']) for (const a of ['baby', 'child', 'young', 'old']) T.push(['macrodetails/caucasian-' + s + '-' + a, 'age/' + s + '-' + a, 2]);
for (const s of ['male', 'female']) for (const [mu, we, nm] of [['minmuscle', 'averageweight', 'lean'], ['maxmuscle', 'averageweight', 'muscle'], ['averagemuscle', 'minweight', 'thin'], ['averagemuscle', 'maxweight', 'heavy']]) T.push([`macrodetails/universal-${s}-young-${mu}-${we}`, 'build/' + s + '-' + nm, 2]);
const pairs = {
  head: ['head-scale-vert-decr', 'head-scale-vert-incr', 'head-square', 'head-triangular', 'head-oval', 'head-age-decr', 'head-age-incr', 'head-fat-decr', 'head-fat-incr', 'head-scale-horiz-decr', 'head-scale-horiz-incr', 'head-round'],
  chin: ['chin-bones-decr', 'chin-bones-incr', 'chin-height-decr', 'chin-height-incr', 'chin-prominent-decr', 'chin-prominent-incr', 'chin-width-decr', 'chin-width-incr', 'chin-prognathism-decr', 'chin-prognathism-incr', 'chin-cleft-incr'],
  cheek: ['cheek-bones-decr', 'cheek-bones-incr', 'cheek-volume-decr', 'cheek-volume-incr', 'cheek-inner-decr', 'cheek-inner-incr'],
  forehead: ['forehead-scale-vert-decr', 'forehead-scale-vert-incr', 'forehead-trans-backward', 'forehead-trans-forward', 'forehead-nubian-decr', 'forehead-nubian-incr', 'forehead-temple-decr', 'forehead-temple-incr'],
  eyebrows: ['eyebrows-trans-backward', 'eyebrows-trans-forward', 'eyebrows-angle-down', 'eyebrows-angle-up', 'eyebrows-trans-down', 'eyebrows-trans-up'],
  eyes: ['eye-scale-decr', 'eye-scale-incr', 'eye-trans-in', 'eye-trans-out', 'eye-height3-decr', 'eye-height3-incr', 'eye-corner1-down', 'eye-corner1-up', 'eye-corner2-down', 'eye-corner2-up', 'eye-eyefold-down', 'eye-eyefold-up', 'eye-push1-in', 'eye-push1-out', 'eye-push2-in', 'eye-push2-out', 'eye-bag-decr', 'eye-bag-incr', 'eye-height1-decr', 'eye-height1-incr', 'eye-height2-decr', 'eye-height2-incr', 'eye-trans-down', 'eye-trans-up', 'eye-epicanthus-in', 'eye-epicanthus-out'],
  nose: ['nose-scale-vert-decr', 'nose-scale-vert-incr', 'nose-hump-decr', 'nose-hump-incr', 'nose-greek-decr', 'nose-greek-incr', 'nose-point-up', 'nose-point-down', 'nose-scale-horiz-decr', 'nose-scale-horiz-incr', 'nose-nostrils-width-decr', 'nose-nostrils-width-incr', 'nose-point-width-decr', 'nose-point-width-incr', 'nose-trans-forward', 'nose-trans-backward', 'nose-volume-decr', 'nose-volume-incr', 'nose-scale-depth-decr', 'nose-scale-depth-incr', 'nose-curve-convex', 'nose-curve-concave', 'nose-base-up', 'nose-base-down', 'nose-flaring-decr', 'nose-flaring-incr', 'nose-trans-in', 'nose-trans-out'],
  mouth: ['mouth-scale-horiz-decr', 'mouth-scale-horiz-incr', 'mouth-upperlip-volume-decr', 'mouth-upperlip-volume-incr', 'mouth-lowerlip-volume-decr', 'mouth-lowerlip-volume-incr', 'mouth-trans-up', 'mouth-trans-down', 'mouth-trans-forward', 'mouth-trans-backward', 'mouth-angles-up', 'mouth-angles-down', 'mouth-laugh-lines-in', 'mouth-laugh-lines-out', 'mouth-cupidsbow-decr', 'mouth-cupidsbow-incr', 'mouth-upperlip-height-decr', 'mouth-upperlip-height-incr', 'mouth-lowerlip-height-decr', 'mouth-lowerlip-height-incr', 'mouth-philtrum-volume-decr', 'mouth-philtrum-volume-incr'],
  ears: ['ear-scale-decr', 'ear-scale-incr', 'ear-rot-backward', 'ear-rot-forward', 'ear-wing-decr', 'ear-wing-incr', 'ear-lobe-decr', 'ear-lobe-incr', 'ear-shape-pointed', 'ear-flap-decr', 'ear-flap-incr', 'ear-scale-vert-decr', 'ear-scale-vert-incr'],
  neck: ['neck-scale-horiz-decr', 'neck-scale-horiz-incr', 'neck-scale-depth-decr', 'neck-scale-depth-incr', 'neck-double-decr', 'neck-double-incr'],
};
const sided = new Set(['cheek', 'eyes', 'ears']);
for (const [dir, names] of Object.entries(pairs)) for (const n of names) T.push([dir + '/' + n, dir + '/' + n, 1, sided.has(dir)]);

function parse(txt) { const m = new Map(); for (const l of txt.split('\n')) { if (!l || l[0] === '#') continue; const p = l.trim().split(/\s+/); const i = +p[0]; if (!used.has(i)) continue; m.set(used.get(i), [+p[1], +p[2], +p[3]]); } return m; }
const out = {};
let bytes = 0;
for (const [src, name, prec, both] of T) {
  let m;
  if (both) {
    const [d, n] = [src.split('/')[0], src.split('/')[1]];
    const a = await get('targets/' + d + '/l-' + n + '.target'), b = await get('targets/' + d + '/r-' + n + '.target');
    if (!a || !b) { console.warn('missing', src); continue; }
    m = parse(a); for (const [i, v] of parse(b)) { const o = m.get(i); m.set(i, o ? [o[0] + v[0], o[1] + v[1], o[2] + v[2]] : v); }
  } else { const t = await get('targets/' + src + '.target', src.startsWith('macro')); if (!t) { console.warn('missing', src); continue; } m = parse(t); }
  const idx = [...m.keys()].sort((a, b) => a - b).filter(i => { const v = m.get(i); return Math.abs(v[0]) + Math.abs(v[1]) + Math.abs(v[2]) > 2e-4; });
  let mx = 0; for (const i of idx) for (const c of m.get(i)) mx = Math.max(mx, Math.abs(c));
  const lim = prec === 2 ? 32767 : 127, s = mx / lim || 1;
  const D = prec === 2 ? new Int16Array(idx.length * 3) : new Int8Array(idx.length * 3);
  idx.forEach((i, k) => { const v = m.get(i); for (let c = 0; c < 3; c++) D[k * 3 + c] = Math.round(v[c] / s); });
  // indices as varint deltas
  const vb = []; let prev = -1;
  for (const i of idx) { let d = i - prev - 1; prev = i; do { let b = d & 127; d >>>= 7; if (d) b |= 128; vb.push(b); } while (d); }
  const iB = Buffer.from(Uint8Array.from(vb)).toString('base64'), dB = Buffer.from(D.buffer).toString('base64');
  bytes += iB.length + dB.length;
  out[name] = { n: idx.length, s: +(s * 100).toPrecision(6), p: prec, i: iB, d: dB };   // s: mm per unit
}
const js = `// GENERATED by docs/design/demo/mh-prep.mjs from MakeHuman's CC0 base mesh (hm08) and targets: do not edit.
// CC0: "This asset was explicitly released as CC0 in september 2020" (MakeHuman project; github.com/makehumancommunity).
// Units: positions in 0.05 mm steps (x to the person's left, y up, z forward; MakeHuman's own frame, in mm after scaling);
// targets: n vertices, s mm per step, p bytes per value (1 or 2), i varint index deltas, d values; all base64.
export const MESH = ${JSON.stringify({ nv, nq: quads.length / 4, ranges, pos: Buffer.from(pos.buffer).toString('base64'), quads: Buffer.from(quads.buffer).toString('base64') })};
export const TARGETS = ${JSON.stringify(out)};
`;
fs.writeFileSync(path.join(root, 'src/people/engine/basemesh.data.js'), js);
console.log('vertices', nv, 'quads', quads.length / 4, 'targets', Object.keys(out).length, 'module KB', (js.length / 1024).toFixed(0), 'target KB', (bytes / 1024).toFixed(0));
