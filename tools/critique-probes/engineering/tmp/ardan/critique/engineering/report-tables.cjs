// Compact tables for the report
const fs = require('fs');
const OUT = '/tmp/ardan/critique/engineering/out';
const med = a => { const b = a.filter(x => x != null).slice().sort((x, y) => x - y); return b.length ? (b.length % 2 ? b[(b.length - 1) / 2] : (b[b.length / 2 - 1] + b[b.length / 2]) / 2) : null; };
const f0 = x => x == null ? '–' : Math.round(x).toLocaleString('en-US');
for (const scen of ['noble', 'soldier']) {
  const f = `${OUT}/${scen}.json`; if (!fs.existsSync(f)) continue;
  const r = JSON.parse(fs.readFileSync(f, 'utf8'));
  console.log(`\n**${scen}**${scen === 'soldier' ? ' (peasant, enlisted at 16)' : ' (noble, 16)'}\n`);
  console.log('| Year | Engine month (med / max) | Real Next month (med of 3) | Life refresh | Life draw | People tab | World tab | A.S MB | Save gz KB / CPU | People alive / dead | Log lines | Heap MB | DOM nodes (doc / Blink) |');
  console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const c of r.checkpoints) {
    const s = c.state;
    console.log(`| +${c.off} | ${f0(c.monthCpuMed)} / ${f0(c.monthCpuMax)} | ${f0(med(c.real.map(x => x.cpu)))} | ${f0(c.render._refreshLife.cpu)} | ${f0(c.render.life.cpu)} | ${f0(c.render.people.cpu)} | ${f0(c.render.world.cpu)} | ${(s.total / 1e6).toFixed(2)} | ${f0(c.save.bytes / 1024)} / ${f0(c.save.cpu)} | ${f0(s.alive)} / ${f0(s.dead)} | ${f0(s.logLines)} | ${f0(c.heap.used / 1e6)} | ${f0(c.dom.nodes)} / ${f0(c.metrics.Nodes)} |`);
  }
  const a = r.checkpoints[0], z = r.checkpoints[r.checkpoints.length - 1];
  const keys = Object.keys(z.state.keys).sort((x, y) => z.state.keys[y] - z.state.keys[x]).slice(0, 14);
  console.log(`\nA.S sub-keys KB +0 -> +${z.off}: ` + keys.map(k => `${k} ${f0((a.state.keys[k] || 0) / 1024)}→${f0(z.state.keys[k] / 1024)}`).join(', '));
  console.log(`PC record: ${f0(a.state.pc.size / 1024)}→${f0(z.state.pc.size / 1024)} KB; flags.ev ${a.state.pc.flagsEv}→${z.state.pc.flagsEv}; journal entries ${a.pack.journalEntries}→${z.pack.journalEntries}; rel records all people ${a.state.rel.total}→${z.state.rel.total}`);
  console.log('calib CPU (machine noise):', r.checkpoints.map(c => f0((c.calib.cpu + c.calib2.cpu) / 2)).join(', '));
  console.log('notes:', r.checkpoints.flatMap(c => c.notes || []).join(' | ') || 'none');
  console.log('errors:', r.errors.length);
  console.log('real months detail last 3 checkpoints:', r.checkpoints.slice(-3).map(c => c.real.map(x => `${f0(x.cpu)}ms/${x.cards}c/${x.refreshes}r`).join(' ')).join(' || '));
  console.log('engine month CPU all:', r.checkpoints.map(c => c.months.map(m => Math.round(m.cpu)).join(',')).join(' | '));
}
