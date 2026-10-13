// Print the minified source of named functions from the built blobs, e.g.
//   node tools/show.mjs A.npcStyles UI.enterSave        (run `node tools/build.mjs --unpack` first)
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let acorn; try { acorn = require('acorn'); } catch { acorn = require('/opt/node-tools/node_modules/acorn'); }
const walk = (n, f) => { if (!n || typeof n.type !== 'string') return; f(n); for (const k in n) { const v = n[k]; if (Array.isArray(v)) v.forEach(x => walk(x, f)); else if (v && typeof v.type === 'string') walk(v, f); } };
const blob = process.argv.includes('--content') ? 'ardan-content' : 'ardan-core';
const src = fs.readFileSync(`.build/${blob}.js`, 'utf8');
const ast = acorn.parse(src, { ecmaVersion: 'latest' });
const want = new Set(process.argv.slice(2).filter(a => !a.startsWith('--')));
walk(ast, n => {
  if (n.type === 'AssignmentExpression' && n.left.type === 'MemberExpression' && !n.left.computed) {
    const name = src.slice(n.left.start, n.left.end);
    if (want.has(name)) console.log(`--- ${name} [${n.start}..${n.end}]\n${src.slice(n.start, n.end)}\n`);
  }
  if ((n.type === 'VariableDeclarator') && n.id.name && want.has(n.id.name)) console.log(`--- ${n.id.name}\n${src.slice(n.start, n.end)}\n`);
});
