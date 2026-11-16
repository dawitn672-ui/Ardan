// Print the source of named functions from the built blobs, e.g.
//   node tools/show.mjs A.npcStyles UI.enterSave        (run `node tools/build.mjs --unpack` first)
//   node tools/show.mjs --dir=/tmp/me/blobs A.foo        read another unpack folder
//   node tools/show.mjs --where A.foo                    only say where the release source defines it (no build needed)
// Since X1 the release's own code is readable source in src/core/release/ (D-028): each name found there is printed
// with its file and line, which is where to change it.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let acorn; try { acorn = require('acorn'); } catch { acorn = require('/opt/node-tools/node_modules/acorn'); }
const walk = (n, f) => { if (!n || typeof n.type !== 'string') return; f(n); for (const k in n) { const v = n[k]; if (Array.isArray(v)) v.forEach(x => walk(x, f)); else if (v && typeof v.type === 'string') walk(v, f); } };
const want0 = process.argv.slice(2).filter(a => !a.startsWith('--'));
// where the release source defines each name: src/core/release/{core,content}/*.js, file and line
{
  const path = await import('node:path'), { fileURLToPath } = await import('node:url');
  const rel = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/core/release');
  for (const d of ['core', 'content']) {
    const dir = path.join(rel, d);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort()) {
      const lines = fs.readFileSync(path.join(dir, f), 'utf8').split('\n');
      lines.forEach((l, i) => { for (const n of want0) if (l.startsWith(n + ' = ') || l.startsWith(n + '=') || new RegExp(`^\\s*(const|let|var|function)\\s+${n.replace(/[.$]/g, '\\$&')}\\b`).test(l)) console.log(`${n}: src/core/release/${d}/${f}:${i + 1}`); });
    }
  }
  if (process.argv.includes('--where')) process.exit(0);
}
const blob = process.argv.includes('--content') ? 'ardan-content' : 'ardan-core';
const dirArg = process.argv.find(a => a.startsWith('--dir='));
const src = fs.readFileSync(`${dirArg ? dirArg.slice(6) : '.build'}/${blob}.js`, 'utf8');
const ast = acorn.parse(src, { ecmaVersion: 'latest' });
const want = new Set(process.argv.slice(2).filter(a => !a.startsWith('--')));
walk(ast, n => {
  if (n.type === 'AssignmentExpression' && n.left.type === 'MemberExpression' && !n.left.computed) {
    const name = src.slice(n.left.start, n.left.end);
    if (want.has(name)) console.log(`--- ${name} [${n.start}..${n.end}]\n${src.slice(n.start, n.end)}\n`);
  }
  if ((n.type === 'VariableDeclarator') && n.id.name && want.has(n.id.name)) console.log(`--- ${n.id.name}\n${src.slice(n.start, n.end)}\n`);
});
