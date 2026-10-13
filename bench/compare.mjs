// Compare bench reports side by side and write reports/scorecard.md.
//   node bench/compare.mjs release fixes current
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RUBRIC } from './rubric.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const labels = process.argv.slice(2).length ? process.argv.slice(2) : ['release', 'current'];
const reps = labels.map(l => { const f = path.join(root, 'reports', `${l}.json`); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null; });
const get = (r, p) => p.split('.').reduce((o, k) => (o == null ? undefined : o[k]), r && r.modules);
const fmt = v => v == null ? '–' : typeof v === 'number' ? (Math.abs(v) >= 100 ? Math.round(v).toLocaleString('en') : String(Math.round(v * 10) / 10)) : String(v);

let md = `# Scorecard\n\nMeasured by \`bench/run.mjs\`, compared by \`bench/compare.mjs ${labels.join(' ')}\`. ` +
  `Each metric has a target taken from the benchmarks in \`docs/benchmarks/\`; ✅ meets it, ◐ is at least halfway, ✗ is short. ` +
  `"Measured" scores count only what a bot or test can see; feel, clarity and art need people, so no aspect can reach 10 on measurement alone.\n\n`;
md += `| Build | ${labels.map((l, i) => `${l}${reps[i] ? '' : ' (missing)'}`).join(' | ')} |\n| --- | ${labels.map(() => '---').join(' | ')} |\n`;
md += `| Build id | ${reps.map(r => r ? '`' + r.build + '`' : '–').join(' | ')} |\n\n`;

const totals = labels.map(() => ({ s: 0, n: 0 }));
for (const a of RUBRIC) {
  md += `## ${a.aspect}\n\n| Metric | Target | ${labels.join(' | ')} |\n| --- | --- | ${labels.map(() => '---').join(' | ')} |\n`;
  const aspectScores = labels.map(() => ({ s: 0, w: 0 }));
  for (const m of a.metrics) {
    const cells = reps.map((r, i) => {
      const v = get(r, m.path);
      if (v == null) return '–';
      const sc = m.score(v);                      // 0..1
      aspectScores[i].s += sc * m.weight; aspectScores[i].w += m.weight;
      return `${fmt(v)} ${sc >= 1 ? '✅' : sc >= .5 ? '◐' : '✗'}`;
    });
    md += `| ${m.name} | ${m.target} | ${cells.join(' | ')} |\n`;
  }
  const measured = aspectScores.map(x => x.w ? Math.round(100 * a.cap * x.s / x.w) / 10 : null);   // out of 10
  measured.forEach((v, i) => { if (v != null) { totals[i].s += v; totals[i].n++; } });
  md += `| **Measured score** (cap ${a.cap * 10} without people) | | ${measured.map(v => v == null ? '–' : `**${v}**`).join(' | ')} |\n\n`;
  if (a.note) md += `${a.note}\n\n`;
}
md += `## Total\n\n| | ${labels.join(' | ')} |\n| --- | ${labels.map(() => '---').join(' | ')} |\n| Mean measured score (out of 100) | ${totals.map(t => t.n ? (Math.round(100 * t.s / t.n) / 10) * 10 / 10 : '–').join(' | ')} |\n`;
fs.writeFileSync(path.join(root, 'reports', 'scorecard.md'), md);
console.log(md);
