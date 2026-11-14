import fs from 'node:fs';
const files = process.argv.slice(2);
const lives = [];
for (const f of files) { if (!fs.existsSync(f)) continue; const j = JSON.parse(fs.readFileSync(f, 'utf8')); for (const L of j.res || []) lives.push(L); if (j.errs && j.errs.length) console.log('ERRS', f, j.errs.slice(0, 3)); }
console.log('lives', lives.length);
const cats = {};
for (const L of lives) {
  if (L.error) { console.log('ERROR', JSON.stringify(L.cfg), L.error.slice(0, 300)); continue; }
  console.log(`- ${L.who}: ${L.endYear - (L.cfg.startAge ? 1105 : 1105)}y to ${L.endYear}, cards ${L.cards}, secs ${L.secs}, end ${JSON.stringify(L.end)}, death ${JSON.stringify(L.deaths)}, relAtStart ${L.relAtStart}, relCount ${JSON.stringify(L.relCount)}, ms/5y ${JSON.stringify(L.ms)}, living ${L.nLiving}`);
  if (L.captSnap && L.captSnap.length) console.log('   capt', JSON.stringify(L.captSnap));
  for (const [k, v] of Object.entries(L.V)) { const c = cats[k] = cats[k] || { n: 0, lives: 0, ex: [] }; c.n += v.n; c.lives++; for (const e of v.ex) if (c.ex.length < 12) c.ex.push(`{${L.cfg.seed}} ${e}`); }
}
console.log('\n=== categories (n distinct, lives affected) ===');
for (const [k, c] of Object.entries(cats).sort((a, b) => b[1].lives - a[1].lives || b[1].n - a[1].n)) { console.log(`\n## ${k}: ${c.n} in ${c.lives} lives`); for (const e of c.ex.slice(0, 7)) console.log('   ', e.slice(0, 330)); }
console.log('\n=== realm culture mix (first life) ===');
const L0 = lives.find(l => l.mix);
if (L0) for (const [rid, m] of Object.entries(L0.mix)) console.log(rid, JSON.stringify(m));
console.log('\n=== full-name duplicates among the living ===');
for (const L of lives) if (L.fullDup) console.log(L.cfg.seed, JSON.stringify(L.fullDup.slice(0, 8)));
