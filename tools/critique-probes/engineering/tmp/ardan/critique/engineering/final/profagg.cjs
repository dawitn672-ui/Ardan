// aggregate a .cpuprofile by function name: self and inclusive ms.  node profagg.cjs file [topN] [regexFilter]
const fs = require('fs');
const p = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')), N = +(process.argv[3] || 30), RX = process.argv[4] ? new RegExp(process.argv[4]) : null;
const byId = new Map(p.nodes.map(n => [n.id, n])), parent = new Map();
for (const n of p.nodes) for (const c of (n.children || [])) parent.set(c, n.id);
const self = new Map(); let total = 0;
for (let i = 0; i < p.samples.length; i++) { const d = p.timeDeltas[i] || 0; self.set(p.samples[i], (self.get(p.samples[i]) || 0) + d); total += d; }
const key = n => { const f = n.callFrame; return `${f.functionName || '(anon)'}:${f.lineNumber}:${f.columnNumber}`; };
const S = new Map(), I = new Map();
for (const [id, us] of self) {
  const k = key(byId.get(id)); S.set(k, (S.get(k) || 0) + us);
  const seen = new Set(); let cur = id;
  while (cur != null) { const kk = key(byId.get(cur)); if (!seen.has(kk)) { seen.add(kk); I.set(kk, (I.get(kk) || 0) + us); } cur = parent.get(cur); }
}
const top = (m) => [...m.entries()].filter(([k]) => !RX || RX.test(k)).sort((a, b) => b[1] - a[1]).slice(0, N).map(([k, us]) => `${(us / 1000).toFixed(0).padStart(6)} ms ${(100 * us / total).toFixed(1).padStart(5)}%  ${k}`);
console.log('total ms', Math.round(total / 1000));
console.log('SELF'); console.log(top(S).join('\n'));
console.log('INCLUSIVE'); console.log(top(I).join('\n'));
