import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const acorn = require('/home/user/Ardan/node_modules/acorn');
const src = fs.readFileSync('blobs/ardan-core.js', 'utf8');
const markers = [{ off: 0, name: 'vendor' }];
for (const m of src.matchAll(/\/\/ features\/([^\n]+)/g)) markers.push({ off: m.index, name: m[1].trim().split('/')[0] });
const featAt = off => { let lo = 0, hi = markers.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (markers[mid].off <= off) lo = mid; else hi = mid - 1; } return markers[lo].name; };
const ast = acorn.parse(src, { ecmaVersion: 'latest' });
const walk = (n, f) => { if (!n || typeof n.type !== 'string') return; f(n); for (const k in n) { const v = n[k]; if (Array.isArray(v)) v.forEach(x => walk(x, f)); else if (v && typeof v.type === 'string') walk(v, f); } };
const asg = {};
walk(ast, n => {
  if (n.type === 'AssignmentExpression' && n.operator === '=' && n.left.type === 'MemberExpression' && !n.left.computed && n.left.object.type === 'Identifier' && ['A', 'UI', 'MAP', 'SAVES'].includes(n.left.object.name)) {
    if (!/Function|Arrow/.test(n.right.type)) return;
    const name = n.left.object.name + '.' + n.left.property.name;
    (asg[name] = asg[name] || []).push(featAt(n.start));
  }
});
const rows = Object.entries(asg).map(([k, v]) => [k, v.length, [...new Set(v)].length, v]).sort((a, b) => b[1] - a[1]);
console.log('functions assigned more than once (wrapped/replaced):', rows.filter(r => r[1] > 1).length, 'of', rows.length);
console.log('assignments total', rows.reduce((a, r) => a + r[1], 0));
for (const r of rows.slice(0, 30)) console.log(String(r[1]).padStart(3), r[0].padEnd(28), r[3].slice(0, 12).join(', ') + (r[3].length > 12 ? ', ...' : ''));
// how many features touch each of the top functions
fs.writeFileSync('wrappers.json', JSON.stringify(rows, null, 1));
// UI.A action overrides: Object.assign(UI.A, {...}) keys defined more than once
const act = {};
walk(ast, n => {
  if (n.type === 'CallExpression' && n.callee.type === 'MemberExpression' && n.callee.object.name === 'Object' && n.callee.property.name === 'assign' && n.arguments[0] && n.arguments[0].type === 'MemberExpression' && src.slice(n.arguments[0].start, n.arguments[0].end) === 'UI.A') {
    for (const a of n.arguments.slice(1)) if (a.type === 'ObjectExpression') for (const p of a.properties) if (p.key) { const k = p.key.name || p.key.value; (act[k] = act[k] || []).push(featAt(n.start)); }
  }
});
const dup = Object.entries(act).filter(([k, v]) => v.length > 1);
console.log('UI.A actions defined in Object.assign more than once:', dup.length, dup.slice(0, 15).map(([k, v]) => k + '×' + v.length).join(' '));
// size per feature appended to core
const sizes = {}; for (let i = 0; i < markers.length; i++) { const end = i + 1 < markers.length ? markers[i + 1].off : src.length; sizes[markers[i].name] = (sizes[markers[i].name] || 0) + end - markers[i].off; }
const sz = Object.entries(sizes).sort((a, b) => b[1] - a[1]);
console.log('core size by feature (KB):', sz.slice(0, 20).map(([k, v]) => `${k} ${(v / 1024).toFixed(0)}`).join(', '));
console.log('vendor core KB', (sizes.vendor / 1024).toFixed(0), 'features core KB', ((src.length - sizes.vendor) / 1024).toFixed(0));
