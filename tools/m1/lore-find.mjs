// M1 lore pass (D-155): every text of the lore that matches a pattern, with its file and place (a JSON path, or a line), so
// an edit can be written for it in tools/m1/lore-edits.mjs.
//   node tools/m1/lore-find.mjs "<regex>" [--flags=i] [--max=80]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { featureDirs, featurePath } from '../lib/features.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2), opt = (k, d) => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const RX = new RegExp(args.find(a => !a.startsWith('--')), opt('flags', ''));
const MAX = +opt('max', 80); let n = 0;
const say = (f, w, t) => { if (n++ < MAX) console.log(`${f} ${w}\n    ${t.length > 400 ? t.slice(0, 400) + '...' : t}`); };
const walk = (f, v, w) => { if (typeof v === 'string') { if (RX.test(v)) say(f, w, v); } else if (Array.isArray(v)) v.forEach((x, i) => walk(f, x, w + '[' + i + ']')); else if (v && typeof v === 'object') for (const k of Object.keys(v)) walk(f, v[k], w + '.' + k); };
const rel = p => path.relative(root, p);
const lore = path.join(root, 'src/core/release/core/00-lore.json'); const L = JSON.parse(fs.readFileSync(lore, 'utf8'));
for (const k of Object.keys(L)) if (k !== 'map' && k !== 'terrainJpg') walk(rel(lore), L[k], k);
const ld = path.join(root, 'src/core/release/lore');
for (const f of fs.readdirSync(ld).filter(f => f.endsWith('.json')).sort()) walk('src/core/release/lore/' + f, JSON.parse(fs.readFileSync(path.join(ld, f), 'utf8')), '');
const files = [];
const addDir = d => { for (const f of fs.readdirSync(d).sort()) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) { if (!/^(engine)$/.test(f)) addDir(p); } else if (/\.js$/.test(f)) files.push(p); } };
addDir(path.join(root, 'src/core/release/core')); addDir(path.join(root, 'src/core/release/content'));
for (const d of featureDirs()) { const p = featurePath(d); if (fs.existsSync(path.join(p, '.wip'))) continue; for (const f of fs.readdirSync(p).sort()) if (/\.js$/.test(f)) files.push(path.join(p, f)); }
for (const p of files) { const lines = fs.readFileSync(p, 'utf8').split('\n'); lines.forEach((l, i) => { if (RX.test(l)) { const m = l.match(new RegExp('.{0,140}' + RX.source + '.{0,140}', opt('flags', ''))); say(rel(p), 'line ' + (i + 1), (m ? m[0] : l).trim()); } }); }
console.log(`(${n} found)`);
