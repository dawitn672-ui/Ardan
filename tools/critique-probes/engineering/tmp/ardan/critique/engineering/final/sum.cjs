// summarise a press session: node sum.cjs out/press-<tag>.json ...
const fs = require('fs');
const med = a => { const b = a.slice().sort((x, y) => x - y); return b.length ? b[b.length >> 1] : null; };
const mean = a => a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : null;
for (const f of process.argv.slice(2)) {
  const d = JSON.parse(fs.readFileSync(f, 'utf8'));
  const ok = d.presses.filter(p => p.kind === 'v2Next' && p.days >= 25 && p.why === 'ok');
  const grp = { all: ok, quiet: ok.filter(p => !p.cards && !p.prompts), cards1: ok.filter(p => p.cards === 1), cards2plus: ok.filter(p => p.cards >= 2) };
  console.log(`== ${d.tag} W ${d.W} start ${JSON.stringify(d.st)} presses ${d.presses.length} (months ${ok.length}), errors ${d.errs.length}`);
  for (const [k, L] of Object.entries(grp)) {
    if (!L.length) continue;
    const f2 = key => `${med(L.map(p => p[key]))}/${mean(L.map(p => p[key]))}`;
    console.log(`  ${k.padEnd(10)} n ${String(L.length).padStart(2)} | cpu med/mean ${f2('cpuSettled')} | script ${f2('script')} | style ${f2('styleMs')} | layout ${f2('layoutMs')} | recalcs ${f2('recalcs')} | layouts ${f2('layouts')} | refresh ${mean(L.map(p => (p.c.refresh || 0) * 10)) / 10} refreshTab ${mean(L.map(p => (p.c.refreshTab || 0) * 10)) / 10} modal ${mean(L.map(p => (p.c.renderModal || 0) * 10)) / 10} clkPaint ${mean(L.map(p => (p.c.clkPaint || 0) * 10)) / 10} | cards ${(L.reduce((a, p) => a + p.cards, 0) / L.length).toFixed(2)}`);
  }
  const tot = k => ok.reduce((a, p) => a + p[k], 0);
  console.log(`  share of CPU: style ${(100 * tot('styleMs') / tot('cpuSettled')).toFixed(0)}%, script ${(100 * tot('script') / tot('cpuSettled')).toFixed(0)}%, layout ${(100 * tot('layoutMs') / tot('cpuSettled')).toFixed(0)}%; ms per style recalc ${(tot('styleMs') / tot('recalcs')).toFixed(1)}; max press ${Math.max(...ok.map(p => p.cpuSettled))}; nodes first/last ${d.presses[0].nodes}/${d.presses[d.presses.length - 1].nodes}; heap first/last ${d.presses[0].heapMB}/${d.presses[d.presses.length - 1].heapMB}; doc first/last ${d.presses[0].doc}/${d.presses[d.presses.length - 1].doc}`);
  // linear model: cpu ~ a + b*cards
  const n = ok.length, sx = ok.reduce((a, p) => a + p.cards, 0), sy = tot('cpuSettled'), sxx = ok.reduce((a, p) => a + p.cards * p.cards, 0), sxy = ok.reduce((a, p) => a + p.cards * p.cpuSettled, 0);
  const b = (n * sxy - sx * sy) / Math.max(1e-9, n * sxx - sx * sx), a = (sy - b * sx) / n;
  console.log(`  fit: cpu = ${Math.round(a)} ms + ${Math.round(b)} ms per card`);
}
