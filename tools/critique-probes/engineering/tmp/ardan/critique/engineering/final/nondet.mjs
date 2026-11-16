// Where wall-clock and unseeded randomness appear in the built core, by feature (AST: member calls only).
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const acorn = require('/home/user/Ardan/node_modules/acorn');
for (const blob of ['ardan-core', 'ardan-content']) {
  const src = fs.readFileSync(`/tmp/ardan/critique/engineering/blobs/${blob}.js`, 'utf8');
  const parts = blob === 'ardan-content' ? src.split('\u0001ARDAN-PACK\u0001') : [src];
  const tally = {};
  let base = 0;
  for (const part of parts) {
    const markers = [{ off: 0, name: 'vendor' }];
    for (const m of part.matchAll(/\/\/ features\/([^\n]+)/g)) markers.push({ off: m.index, name: m[1].trim() });
    const featAt = off => { let r = markers[0]; for (const m of markers) { if (m.off <= off) r = m; else break; } return r.name; };
    let ast; try { ast = acorn.parse(part, { ecmaVersion: 'latest' }); } catch (e) { console.log('parse fail', blob, e.message.slice(0, 80)); continue; }
    const walk = (n, f) => { if (!n || typeof n.type !== 'string') return; f(n); for (const k in n) { const v = n[k]; if (Array.isArray(v)) v.forEach(x => walk(x, f)); else if (v && typeof v.type === 'string') walk(v, f); } };
    walk(ast, n => {
      if (n.type !== 'MemberExpression' || n.computed) return;
      const t = part.slice(n.start, n.end);
      if (t === 'Math.random' || t === 'Date.now' || t === 'performance.now' || t === 'crypto.getRandomValues') {
        const f = featAt(n.start); (tally[t] = tally[t] || {})[f] = ((tally[t] || {})[f] || 0) + 1;
      }
    });
    walk(ast, n => { if (n.type === 'NewExpression' && n.callee.name === 'Date') { const f = featAt(n.start); (tally['new Date'] = tally['new Date'] || {})[f] = ((tally['new Date'] || {})[f] || 0) + 1; } });
  }
  console.log('==', blob);
  for (const [k, v] of Object.entries(tally)) console.log(k, Object.values(v).reduce((a, b) => a + b, 0), JSON.stringify(Object.entries(v).sort((a, b) => b[1] - a[1]).slice(0, 14)));
}
