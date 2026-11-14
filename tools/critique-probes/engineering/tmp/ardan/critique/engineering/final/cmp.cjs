// compare two press sessions press by press (same state, same answers): node cmp.cjs a.json b.json
const fs = require('fs');
const [a, b] = process.argv.slice(2).map(f => JSON.parse(fs.readFileSync(f, 'utf8')));
const n = Math.min(a.presses.length, b.presses.length);
let sa = 0, sb = 0, ssa = 0, ssb = 0, same = 0, la = 0, lb = 0, ra = 0, rb = 0, sca = 0, scb = 0;
for (let i = 0; i < n; i++) {
  const x = a.presses[i], y = b.presses[i];
  const match = x.cards === y.cards && x.days === y.days && x.year === y.year;
  if (match) { same++; sa += x.cpuSettled; sb += y.cpuSettled; ssa += x.styleMs; ssb += y.styleMs; la += x.layoutMs; lb += y.layoutMs; ra += x.recalcs; rb += y.recalcs; sca += x.script; scb += y.script; }
  console.log(`#${i} cards ${x.cards}/${y.cards} days ${x.days}/${y.days} ${match ? '' : 'DIFF'} | cpu ${x.cpuSettled} -> ${y.cpuSettled} | style ${x.styleMs} -> ${y.styleMs} | layout ${x.layoutMs} -> ${y.layoutMs} | script ${x.script} -> ${y.script} | recalcs ${x.recalcs} -> ${y.recalcs}`);
}
console.log(`matched presses ${same}/${n}: cpu ${sa} -> ${sb} (${(100 * sb / sa).toFixed(0)}%), style ${ssa} -> ${ssb} (${(100 * ssb / ssa).toFixed(0)}%), layout ${la} -> ${lb}, script ${sca} -> ${scb}, recalcs ${ra} -> ${rb}; per press cpu ${Math.round(sa / same)} -> ${Math.round(sb / same)}`);
