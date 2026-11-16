// G0: read today.json (measure.mjs) and print how linear growth is today (docs/design/growth-standard.md, part 1).
//
//   node docs/design/growth/analyze.mjs [docs/design/growth/today.json] [--md]
//
// For each life's main skills (the three highest at the end): the level by age; how straight the climb is (R² of a
// straight line through the years from 5 points to 90% of the best); the mean gain a year by the word it started in;
// years without gain while still climbing; the spread of yearly gains (coefficient of variation); and the drip: gains a
// year and the median size of one. For the body: each stat's age at its best and its yearly change by decade.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const file = process.argv.slice(2).find(a => !a.startsWith('--')) || path.join(here, 'today.json');
const D = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { lives: {} };
const BANDS = [[0, 15, 'Beginner'], [15, 35, 'Intermediate'], [35, 55, 'Advanced'], [55, 72, 'Expert'], [72, 101, 'Master+']];
const r1 = x => x == null || !isFinite(x) ? '-' : (Math.round(x * 10) / 10).toFixed(1);
const r2 = x => x == null || !isFinite(x) ? '-' : (Math.round(x * 100) / 100).toFixed(2);
const median = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

export function skillStats(S, k) {
  const v = S.map(s => s.sk[k] || 0), best = Math.max(...v);
  const i0 = v.findIndex(x => x >= 5), i1 = v.findIndex(x => x >= 0.9 * best);
  const out = { k, best, end: v[v.length - 1] };
  if (i0 < 0 || i1 <= i0 + 2) return out;
  // straightness of the climb
  const xs = S.slice(i0, i1 + 1).map(s => s.age), ys = v.slice(i0, i1 + 1), n = xs.length;
  const mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n;
  let sxy = 0, sxx = 0, syy = 0; for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2; }
  out.r2 = syy ? sxy * sxy / (sxx * syy) : 1; out.slope = sxy / sxx; out.from = xs[0]; out.to = xs[n - 1];
  // yearly gains while climbing
  const g = []; for (let i = i0 + 1; i <= i1; i++) g.push(v[i] - v[i - 1]);
  const mg = g.reduce((a, b) => a + b, 0) / g.length, sd = Math.sqrt(g.reduce((a, b) => a + (b - mg) ** 2, 0) / g.length);
  out.cv = mg > 0 ? sd / mg : null;
  out.flat = g.filter(x => x < 0.5).length; out.years = g.length;
  let run = 0; out.longestFlat = 0; for (const x of g) { run = x < 0.5 ? run + 1 : 0; out.longestFlat = Math.max(out.longestFlat, run); }
  // by the word the year began in
  out.band = BANDS.map(([lo, hi]) => { const a = []; for (let i = 1; i < v.length; i++) if (v[i - 1] >= lo && v[i - 1] < hi && i <= i1) a.push(v[i] - v[i - 1]); return a.length ? a.reduce((x, y) => x + y, 0) / a.length : null; });
  // the drip: gains a year and the size of one
  const cnt = [], size = [];
  for (const s of S) if (s.gains && s.gains[k]) { cnt.push(s.gains[k][0]); size.push(s.gains[k][1] / s.gains[k][0]); }
  out.gainsPerYear = median(cnt); out.meanGain = median(size);
  // largest single year
  out.maxYear = Math.max(...g);
  return out;
}
export function bodyStats(S) {
  const out = {};
  for (const s of ['str', 'spd', 'sta', 'ins', 'int', 'wil']) {
    const v = S.map(x => [x.age, x.eff[s]]); let pk = v[0];
    for (const q of v) if (q[1] > pk[1]) pk = q;
    const at = a => (v.find(q => q[0] >= a) || [])[1];
    const per = (a, b) => at(a) != null && at(b) != null && pk[1] ? (at(b) - at(a)) / pk[1] / (b - a) * 100 : null;
    out[s] = { peakAge: pk[0], peak: pk[1], d30_40: per(30, 40), d45_55: per(45, 55), d55_65: per(55, 65), d65_75: per(65, 75) };
  }
  return out;
}

// across every life: the three highest skills of each life that climbed for at least five years
export function summary(D) {
  const all = [];
  for (const [name, L] of Object.entries(D.lives)) {
    const S = L.samples, last = S[S.length - 1];
    for (const [k] of Object.entries(last.sk).sort((a, b) => b[1] - a[1]).slice(0, 3)) { const st = skillStats(S, k); if (st.r2 != null && st.years >= 5) all.push(Object.assign({ life: name }, st)); }
  }
  const band = BANDS.map((b, i) => { const v = all.map(s => s.band[i]).filter(x => x != null); return [b[2], v.length ? v.reduce((a, c) => a + c, 0) / v.length : null, v.length]; });
  const drip = all.filter(s => s.gainsPerYear >= 50);
  return { n: all.length, lives: Object.keys(D.lives).length, r2: median(all.map(s => s.r2)), r2s: all.map(s => +s.r2.toFixed(2)).sort((a, b) => a - b),
    band, flat: all.reduce((a, s) => a + s.flat, 0), years: all.reduce((a, s) => a + s.years, 0),
    drip: drip.length, dripPerYear: median(drip.map(s => s.gainsPerYear)), dripSize: median(drip.map(s => s.meanGain)), max: all.map(s => [s.life, s.k, Math.round(s.best)]) };
}

if (import.meta.url === `file://${process.argv[1]}` && process.argv.includes('--summary')) { console.log(JSON.stringify(summary(D), null, 1)); process.exit(0); }

// --md: the compact tables of growth-standard.md §1.2
if (import.meta.url === `file://${process.argv[1]}` && process.argv.includes('--md')) {
  const AG = [10, 14, 18, 22, 26, 30, 40, 50, 60, 70];
  const rows = [`| Life | Skill | ${AG.join(' | ')} | R² | a year at Int. | at Exp. | flat years | gains a year |`, `|${'---|'.repeat(AG.length + 7)}`];
  const body = ['| Life | Strength: best at | a year, 45-55 | a year, the last decade measured | Speed: best at | a year, 45-55 | the last decade | Wits: best at | Will: best at |', '|---|---|---|---|---|---|---|---|---|'];
  const pc = x => x == null ? '-' : (x > 0 ? '+' : '') + r1(x);
  for (const [name, L] of Object.entries(D.lives)) {
    const S = L.samples, last = S[S.length - 1];
    const top = Object.entries(last.sk).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0]);
    const tag = `${name} (${L.died != null ? 'd. ' + L.died : 'alive at ' + last.age})`;
    for (const k of top) {
      const st = skillStats(S, k); if (st.r2 == null || st.years < 5) continue;
      const lv = AG.map(a => { const s = S.find(x => x.age === a); return s ? Math.round(s.sk[k] || 0) : ''; });
      rows.push(`| ${tag} | ${k} | ${lv.join(' | ')} | ${r2(st.r2)} | ${r1(st.band[1])} | ${r1(st.band[3])} | ${st.flat}/${st.years} | ${st.gainsPerYear ?? '-'} |`);
    }
    if (last.age >= 60) { const B = bodyStats(S); body.push(`| ${tag} | ${B.str.peakAge} | ${pc(B.str.d45_55)} | ${pc(B.str.d65_75 ?? B.str.d55_65)} | ${B.spd.peakAge} | ${pc(B.spd.d45_55)} | ${pc(B.spd.d65_75 ?? B.spd.d55_65)} | ${B.int.peakAge} | ${B.wil.peakAge} |`); }
  }
  console.log(rows.join('\n') + '\n\n' + body.join('\n'));
  process.exit(0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const AGES = [6, 10, 14, 18, 22, 26, 30, 40, 50, 60, 70];
  for (const [name, L] of Object.entries(D.lives)) {
    const S = L.samples, last = S[S.length - 1];
    const top = Object.entries(last.sk).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0]);
    console.log(`\n## ${name} (${L.o.status} ${L.o.sex}, ${L.engaged ? 'engaged' : 'passive'} ${L.pers}): ${S.length} years, ${L.died != null ? 'died at ' + L.died + ' (' + L.cause + ')' : 'alive at the end'}`);
    console.log(`| skill | ${AGES.join(' | ')} | R² | per yr | CV | flat yrs | longest flat | gains/yr | one gain | best yr |`);
    for (const k of top) {
      const st = skillStats(S, k), lv = AGES.map(a => { const s = S.find(x => x.age === a); return s ? Math.round(s.sk[k] || 0) : ''; });
      console.log(`| ${k} | ${lv.join(' | ')} | ${r2(st.r2)} | ${r1(st.slope)} | ${r2(st.cv)} | ${st.flat ?? '-'}/${st.years ?? '-'} | ${st.longestFlat ?? '-'} | ${st.gainsPerYear ?? '-'} | ${r2(st.meanGain)} | ${r1(st.maxYear)} |`);
      if (st.band) console.log(`|   by word | ${BANDS.map((b, i) => b[2] + ' ' + r1(st.band[i])).join(', ')} |`);
    }
    const B = bodyStats(S);
    console.log('| stat | peak age | %/yr 30-40 | 45-55 | 55-65 | 65-75 |');
    for (const s in B) console.log(`| ${s} | ${B[s].peakAge} | ${r2(B[s].d30_40)} | ${r2(B[s].d45_55)} | ${r2(B[s].d55_65)} | ${r2(B[s].d65_75)} |`);
  }
}
