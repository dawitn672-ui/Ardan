// Which functions got slower: inclusive and self time per profiled month (or per call unit), profile A vs profile B.
//   node diffprof.cjs <json> <tagA> <tagB> [unitsA] [unitsB]
// json is out/<scen>.json (profiles.<tag>, with months) or out/renderprof.json (<tag> at top level)
const fs = require('fs');
const [file, ta, tb, ua, ub] = process.argv.slice(2);
const J = JSON.parse(fs.readFileSync(file, 'utf8'));
const get = t => (J.profiles ? J.profiles[t] : J[t]);
const A = get(ta), B = get(tb);
const nA = +ua || (A.months ? A.months.raw.length : 1), nB = +ub || (B.months ? B.months.raw.length : 1);
const key = x => `${x.fn} [${x.at.split(':')[0]}]`;
const mapOf = L => { const m = new Map(); for (const x of L) m.set(key(x), (m.get(key(x)) || 0) + x.ms); return m; };
for (const kind of ['incl', 'self']) {
  const a = mapOf(A[kind]), b = mapOf(B[kind]);
  const keys = new Set([...a.keys(), ...b.keys()]);
  const rows = [...keys].map(k => [k, (a.get(k) || 0) / nA, (b.get(k) || 0) / nB]).filter(r => !/^\(root\)|evaluate|^\(anon\) \[script|months|month \(\)|drawAll|refresh \[script|tick \[script/.test(r[0]));
  rows.sort((p, q) => (q[2] - q[1]) - (p[2] - p[1]));
  console.log(`\n${kind}: ms per unit, ${ta} (n=${nA}) -> ${tb} (n=${nB}); profile totals ${A.totalMs} -> ${B.totalMs} ms`);
  for (const r of rows.slice(0, 25)) console.log(`${r[1].toFixed(1).padStart(8)} -> ${r[2].toFixed(1).padStart(8)}  x${(r[2] / Math.max(0.1, r[1])).toFixed(1).padStart(5)}  ${r[0]}`);
}
