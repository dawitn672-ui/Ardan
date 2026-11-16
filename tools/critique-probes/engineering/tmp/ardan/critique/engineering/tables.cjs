// Tables for the report from out/<scenario>.json
const fs = require('fs');
const OUT = '/tmp/ardan/critique/engineering/out';
const med = a => { const b = a.filter(x => x != null).slice().sort((x, y) => x - y); return b.length ? (b.length % 2 ? b[(b.length - 1) / 2] : (b[b.length / 2 - 1] + b[b.length / 2]) / 2) : null; };
const f0 = x => x == null ? '–' : Math.round(x).toLocaleString('en-US');
const mb = x => (x / 1e6).toFixed(2);
const kb = x => Math.round(x / 1024).toLocaleString('en-US');
for (const scen of process.argv.slice(2).length ? process.argv.slice(2) : ['noble', 'soldier']) {
  const f = `${OUT}/${scen}.json`; if (!fs.existsSync(f)) continue;
  const r = JSON.parse(fs.readFileSync(f, 'utf8'));
  console.log(`\n### ${scen} (seed ${r.start.seed}, ${r.start.status}, start age ${r.start.startAge}) — ${r.checkpoints.length} checkpoints, page/console errors: ${r.errors.length}`);
  console.log('\n| Year (+n) | Engine month, CPU ms (median of 12 / max) | Real Next month, CPU ms (median of 3; cards) | Life render CPU ms | People tab | World tab | Realm tab | UI.refresh (Life) | Calib CPU ms |');
  console.log('|---|---|---|---|---|---|---|---|---|');
  for (const c of r.checkpoints) {
    const real = c.real || [];
    console.log(`| ${c.year} (+${c.off}) | ${f0(c.monthCpuMed)} / ${f0(c.monthCpuMax)} | ${f0(med(real.map(x => x.cpu)))} (${real.map(x => x.cards).join('/')}) | ${f0(c.render.life.cpu)} | ${f0(c.render.people.cpu)} | ${f0(c.render.world.cpu)} | ${f0(c.render.realm.cpu)} | ${f0(c.render._refreshLife.cpu)} | ${f0((c.calib.cpu + c.calib2.cpu) / 2)} |`);
  }
  console.log('\n| Year | A.S JSON MB | packed MB | save gz KB | save CPU ms | serialize ms | people (alive/dead) | rel records (all / PC) | log lines | evShown | journal entries | heap MB (after GC) | DOM nodes doc / Blink | listeners |');
  console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const c of r.checkpoints) {
    const s = c.state;
    console.log(`| ${c.year} | ${mb(s.total)} | ${mb(c.pack.packedLen)} | ${kb(c.save.bytes)} | ${f0(c.save.cpu)} | ${f0(c.pack.serMs)} | ${f0(s.people)} (${f0(s.alive)}/${f0(s.dead)}) | ${f0(s.rel.total)} / ${f0(s.rel.pc)} | ${f0(s.logLines)} | ${f0(s.evShown)} | ${f0(c.pack.journalEntries)} | ${f0(c.heap && c.heap.used / 1e6)} | ${f0(c.dom.nodes)} / ${f0(c.metrics.Nodes)} | ${f0(c.metrics.JSEventListeners)} |`);
  }
  // biggest keys at the last checkpoint, with their growth from the first
  const a = r.checkpoints[0], z = r.checkpoints[r.checkpoints.length - 1];
  const keys = Object.keys(z.state.keys).sort((x, y) => z.state.keys[y] - z.state.keys[x]).slice(0, 22);
  console.log(`\nA.S sub-keys (KB of JSON), first vs last checkpoint (${a.year} -> ${z.year}):`);
  console.log(keys.map(k => `${k} ${kb(a.state.keys[k] || 0)}->${kb(z.state.keys[k])}`).join('; '));
  console.log('array/obj lengths last:', JSON.stringify(Object.fromEntries(Object.entries(z.state.lens).filter(([k, v]) => v > 20).sort((x, y) => y[1] - x[1]).slice(0, 25))));
  console.log('person fields (KB) first:', a.state.personFields.slice(0, 14).map(([k, v]) => `${k} ${kb(v)}`).join(', '));
  console.log('person fields (KB) last :', z.state.personFields.slice(0, 14).map(([k, v]) => `${k} ${kb(v)}`).join(', '));
  console.log('avg person bytes alive/dead first', a.state.aliveAvg, a.state.deadAvg, 'last', z.state.aliveAvg, z.state.deadAvg);
  console.log('PC first', JSON.stringify(a.state.pc), '\nPC last', JSON.stringify(z.state.pc));
  // caches that grew
  const grow = Object.keys(z.caches).map(k => [k, a.caches[k] || 0, z.caches[k]]).filter(([k, x, y]) => y > 50 && y > x * 1.5).sort((p, q) => (q[2] - q[1]) - (p[2] - p[1])).slice(0, 25);
  console.log('engine/UI tables that grew:', grow.map(([k, x, y]) => `${k} ${x}->${y}`).join(', '));
  // render tabs at first and last
  console.log('render CPU per tab first:', Object.entries(a.render).map(([k, v]) => `${k} ${f0(v.cpu)}${v.nodes ? ' (' + v.nodes + ' nodes, ' + kb(v.html || 0) + ' KB html)' : ''}`).join(', '));
  console.log('render CPU per tab last :', Object.entries(z.render).map(([k, v]) => `${k} ${f0(v.cpu)}${v.nodes ? ' (' + v.nodes + ' nodes, ' + kb(v.html || 0) + ' KB html)' : ''}`).join(', '));
  console.log('real months last:', JSON.stringify(z.real.map(x => ({ cpu: Math.round(x.cpu), ms: Math.round(x.ms), cards: x.cards, refreshes: x.refreshes, renderMs: Math.round(x.renderMs) }))));
  console.log('save last:', JSON.stringify(z.save), 'pack last:', JSON.stringify(z.pack));
  console.log('notes:', r.checkpoints.flatMap(c => c.notes || []).join(' | '));
  // years played between checkpoints: CPU per game year (T.play loop)
  console.log('T.play CPU per 5-year block (ms per game year):', r.years.map(y => `${y.to}:${f0(y.cpu / Math.max(1, (y.per || []).length || 5))}`).join(', '));
  for (const tag of Object.keys(r.profiles)) {
    const p = r.profiles[tag];
    console.log(`\nprofile ${tag}: total ${p.totalMs} ms over ${p.months ? p.months.raw.length : '?'} months (wall adv sum ${p.months ? Math.round(p.months.advSum) : '?'} ms)`);
    console.log(' self:', p.self.slice(0, 16).map(x => `${x.fn} [${x.at.split(':')[0]}] ${x.pct}%`).join('; '));
    console.log(' incl:', p.incl.slice(7, 36).map(x => `${x.fn} [${x.at.split(':')[0]}] ${x.pct}%`).join('; '));
  }
  if (r.errors.length) { const g = {}; for (const e of r.errors) { const k = e.replace(/\d+/g, '#').slice(0, 160); g[k] = (g[k] || 0) + 1; } console.log('errors:', JSON.stringify(Object.entries(g).sort((x, y) => y[1] - x[1]).slice(0, 12))); }
}
