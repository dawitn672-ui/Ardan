// Static census of the built core blob (AST): who defines and redefines the engine's and UI's functions.
// Counts three forms the first draft's census missed or merged:
//   X.name = function/arrow                  (direct)
//   X[k] = function inside for (const k of ['a','b',...])   (loop wrappers, keys resolved from the array literal)
//   Object.assign(X, { name() {...}, name: function... })    (bulk definitions)
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const acorn = require('/home/user/Ardan/node_modules/acorn');
const src = fs.readFileSync('/tmp/ardan/critique/engineering/blobs/ardan-core.js', 'utf8');
const markers = [{ off: 0, name: 'vendor' }];
for (const m of src.matchAll(/\/\/ features\/([^\n]+)/g)) markers.push({ off: m.index, name: m[1].trim().split('/')[0] });
const featAt = off => { let lo = 0, hi = markers.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (markers[mid].off <= off) lo = mid; else hi = mid - 1; } return markers[lo].name; };
const ast = acorn.parse(src, { ecmaVersion: 'latest' });
const ROOTS = new Set(['A', 'UI', 'MAP', 'SAVES', 'GD']);
const text = n => src.slice(n.start, n.end);
const isFn = n => n && /Function|Arrow/.test(n.type);
const def = {}; // name -> [{feat, form, wraps}]
const add = (name, off, form, wraps) => { (def[name] = def[name] || []).push({ feat: featAt(off), form, wraps }); };
// does the function body call something .apply(this, arguments) or call a saved original? (a wrapper, not a replacement)
const wrapsOrig = fn => /\.apply\(\s*this\s*,\s*arguments\s*\)|\.call\(\s*this\b/.test(text(fn));
function walk(n, f, parents) {
  if (!n || typeof n.type !== 'string') return;
  f(n, parents);
  parents.push(n);
  for (const k in n) { const v = n[k]; if (Array.isArray(v)) v.forEach(x => walk(x, f, parents)); else if (v && typeof v.type === 'string') walk(v, f, parents); }
  parents.pop();
}
let tryN = 0, emptyCatch = 0, catchConsole = 0, catchOther = 0, tryVendor = 0, tryFeat = 0, catchNoParam = 0;
const tryByFeat = {};
walk(ast, (n, parents) => {
  if (n.type === 'TryStatement') {
    tryN++; const f = featAt(n.start); tryByFeat[f] = (tryByFeat[f] || 0) + 1;
    if (f === 'vendor') tryVendor++; else tryFeat++;
    if (n.handler) {
      const body = n.handler.body.body;
      if (body.length === 0) { emptyCatch++; }
      else if (/console\.(error|warn)/.test(text(n.handler.body))) catchConsole++;
      else catchOther++;
    }
  }
  if (n.type === 'AssignmentExpression' && n.operator === '=' && n.left.type === 'MemberExpression') {
    const L = n.left;
    // direct: X.name = fn   and   X.sub.name = fn (UI.A.x, UI.C.x)
    if (!L.computed && isFn(n.right)) {
      const obj = text(L.object);
      if (ROOTS.has(obj) || /^(UI\.A|UI\.C|A\.[A-Z0-9_]+|UI\.[A-Z0-9_]+)$/.test(obj)) add(obj + '.' + L.property.name, n.start, 'direct', wrapsOrig(n.right));
    }
    // loop: X[k] = fn inside for (const k of [...literals])
    if (L.computed && L.property.type === 'Identifier' && isFn(n.right)) {
      const obj = text(L.object);
      if (ROOTS.has(obj) || obj === 'UI.A' || obj === 'UI.C') {
        for (let i = parents.length - 1; i >= 0; i--) {
          const p = parents[i];
          if (p.type === 'ForOfStatement' && p.left.type === 'VariableDeclaration' && p.left.declarations[0].id.name === L.property.name && p.right.type === 'ArrayExpression') {
            for (const el of p.right.elements) if (el && el.type === 'Literal' && typeof el.value === 'string') add(obj + '.' + el.value, n.start, 'loop', wrapsOrig(n.right));
            break;
          }
        }
      }
    }
  }
  if (n.type === 'CallExpression' && n.callee.type === 'MemberExpression' && text(n.callee) === 'Object.assign' && n.arguments[0]) {
    const obj = text(n.arguments[0]);
    if (ROOTS.has(obj) || obj === 'UI.A' || obj === 'UI.C') for (const a of n.arguments.slice(1)) if (a.type === 'ObjectExpression') for (const p of a.properties) {
      if (!p.key || !(isFn(p.value))) continue;
      add(obj + '.' + (p.key.name || p.key.value), n.start, 'assign', wrapsOrig(p.value));
    }
  }
}, []);
const rows = Object.entries(def).map(([k, v]) => ({ name: k, n: v.length, feats: [...new Set(v.map(x => x.feat))], wraps: v.filter(x => x.wraps).length, v })).sort((a, b) => b.n - a.n);
const total = rows.reduce((a, r) => a + r.n, 0), multi = rows.filter(r => r.n > 1);
const rootOf = n => n.split('.')[0];
console.log(JSON.stringify({ names: rows.length, definitions: total, definedMoreThanOnce: multi.length, extraDefinitions: total - rows.length,
  byRoot: Object.fromEntries(['A', 'UI', 'MAP', 'SAVES', 'GD'].map(r => [r, { names: rows.filter(x => rootOf(x.name) === r).length, multi: multi.filter(x => rootOf(x.name) === r).length }])),
  forms: ['direct', 'loop', 'assign'].map(f => [f, rows.reduce((a, r) => a + r.v.filter(x => x.form === f).length, 0)]),
  vendorDefinedThenRedefined: multi.filter(r => r.v[0].feat === 'vendor').length,
  try: { total: tryN, vendor: tryVendor, features: tryFeat, emptyCatch, catchConsole, catchOther } }));
for (const r of rows.slice(0, 40)) console.log(String(r.n).padStart(3), r.name.padEnd(26), 'wrappers', String(r.wraps).padStart(2), ' features', r.feats.length);
fs.writeFileSync('/tmp/ardan/critique/engineering/final/out/census2.json', JSON.stringify({ rows, tryByFeat }, null, 0));
const tb = Object.entries(tryByFeat).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => k + ' ' + v).join(', ');
console.log('try by feature:', tb);
