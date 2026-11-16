// G0: draw docs/design/growth/curves.svg, the proposed curves against today's (docs/design/growth-standard.md).
//
//   node docs/design/growth/chart.mjs [--today=docs/design/growth/today.json] [--out=docs/design/growth/curves.svg]
//
// Four panels. Colour carries one thing across the whole figure: orange is the game today, blue is the standard.
// Today's measured lives come from today.json (measure.mjs); today's formulas and the standard's come from model.mjs;
// the standard's lives from lives.mjs. Palette: the dataviz reference slots 1 and 2, validated light and dark.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as M from './model.mjs';
import { run } from './lives.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const opt = (k, d) => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const TODAY = opt('today', path.join(here, 'today.json')), OUT = opt('out', path.join(here, 'curves.svg'));
const today = fs.existsSync(TODAY) ? JSON.parse(fs.readFileSync(TODAY, 'utf8')) : { lives: {} };

const W = 1100, H = 800, PW = 400, PH = 250;
const PANELS = [[70, 110], [600, 110], [70, 480], [600, 480]];
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
let svg = [];
const line = (pts, cls, dash) => `<polyline class="${cls}" fill="none" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''} points="${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}"/>`;

function panel(i, title, sub, xr, yr, xlab, ylab, xt, yt, series) {
  const [ox, oy] = PANELS[i];
  const X = x => ox + (x - xr[0]) / (xr[1] - xr[0]) * PW, Y = y => oy + PH - (y - yr[0]) / (yr[1] - yr[0]) * PH;
  svg.push(`<text class="t1" x="${ox}" y="${oy - 34}">${esc(title)}</text><text class="t3" x="${ox}" y="${oy - 16}">${esc(sub)}</text>`);
  for (const v of yt) svg.push(`<line class="grid" x1="${ox}" x2="${ox + PW}" y1="${Y(v[0])}" y2="${Y(v[0])}"/><text class="t3" text-anchor="end" x="${ox - 6}" y="${Y(v[0]) + 4}">${esc(v[1])}</text>`);
  for (const v of xt) svg.push(`<text class="t3" text-anchor="middle" x="${X(v)}" y="${oy + PH + 18}">${v}</text>`);
  svg.push(`<line class="axis" x1="${ox}" x2="${ox + PW}" y1="${oy + PH}" y2="${oy + PH}"/>`);
  svg.push(`<text class="t3" text-anchor="middle" x="${ox + PW / 2}" y="${oy + PH + 36}">${esc(xlab)}</text>`);
  svg.push(`<text class="t3" transform="translate(${ox - 44},${oy + PH / 2}) rotate(-90)" text-anchor="middle">${esc(ylab)}</text>`);
  for (const s of series) {
    const pts = s.pts.filter(([x, y]) => x >= xr[0] && x <= xr[1] && y != null).map(([x, y]) => [X(x), Y(Math.max(yr[0], Math.min(yr[1], y)))]);
    if (pts.length < 2) continue;
    svg.push(`<g><title>${esc(s.label)}</title>${line(pts, s.cls, s.dash)}</g>`);
    if (s.label) {
      // at the line's end, or beside the point nearest s.lx (where the end is crowded)
      const at = s.lx != null ? pts.reduce((a, q) => Math.abs(q[0] - X(s.lx)) < Math.abs(a[0] - X(s.lx)) ? q : a, pts[0]) : pts[pts.length - 1];
      svg.push(`<text class="t2" x="${at[0] + 5}" y="${at[1] + (s.dy || 0) + 4}">${esc(s.label)}</text>`);
    }
  }
}

// A. what one month of steady practice is worth at each level (relative to a beginner's month)
{
  const L = Array.from({ length: 97 }, (_, i) => i);
  panel(0, 'A. One month of practice, by level', 'Points gained, as a share of what a beginner gains', [0, 100], [0, 1], 'Skill level (Beginner 1, Advanced 35, Expert 55, Master 72, Grandmaster 88)', 'share',
    [0, 15, 35, 55, 72, 88, 100], [[0, '0'], [0.25, '¼'], [0.5, '½'], [0.75, '¾'], [1, 'all']],
    [{ pts: L.map(l => [l, M.todayR(l) / M.todayR(0)]), cls: 'today', label: 'today', dy: -8 },
     { pts: L.map(l => [l, M.R(l) / M.R(0)]), cls: 'std', label: 'standard', dy: 6 }]);
}
// B. a life's main skill by age: measured today, and the standard's worked lives
{
  const S = [];
  const mainOf = (life, keys) => {
    const last = life.samples[life.samples.length - 1] || { sk: {} };
    const k = keys.find(x => (last.sk[x] || 0) > 0) || Object.entries(last.sk).sort((a, b) => b[1] - a[1])[0]?.[0];
    return [k, life.samples.map(s => [s.age, s.sk[k] || 0])];
  };
  const pick = [['artisan-engaged', ['trade'], 'artisan, trade'], ['noble-engaged', ['sword', 'melee'], 'noble, sword'], ['gentry-engaged', ['learning'], 'gentry, letters']];
  for (const [name, keys, label] of pick) if (today.lives[name]) { const [, pts] = mainOf(today.lives[name], keys); S.push({ pts, cls: 'today', label, dash: '6 4' }); }
  const lives = ['smith', 'knight', 'scholar'].map(run);
  const key = { smith: 'craft', knight: 'sword', scholar: 'learning' }, nm = { smith: 'Wat, smithing', knight: 'Aymer, sword', scholar: 'Isolde, letters' };
  for (const r of lives) S.push({ pts: [[0, 0], ...r.rows.map(x => [x.age, x[key[r.key]]])], cls: 'std', label: nm[r.key] });
  // stagger the end labels so they do not collide
  const ends = S.map((s, i) => [i, s.pts[s.pts.length - 1][1]]).sort((a, b) => b[1] - a[1]);
  let prev = Infinity; for (const [i, v] of ends) { const yPix = v * PH / 100; const want = Math.min(prev - 13, yPix); S[i].dy = yPix - want; prev = want; }
  panel(1, 'B. A life\'s main skill, by age', 'Today (dashed): three bot lives from birth. Standard: the worked lives of §3.14', [0, 80], [0, 100], 'Age', 'skill level',
    [0, 10, 20, 30, 40, 50, 60, 70, 80], [[0, '0'], [15, 'Int.'], [35, 'Adv.'], [55, 'Exp.'], [72, 'Mas.'], [88, 'GM']], S);
}
// C. strength and speed of an untrained body, by age, as a share of its own peak
{
  const A = Array.from({ length: 91 }, (_, i) => i);
  panel(2, 'C. The body by age, untrained', 'Strength and speed as a share of one\'s own peak (human)', [0, 90], [0, 1.05], 'Age', 'share of peak',
    [0, 10, 20, 30, 40, 50, 60, 70, 80, 90], [[0, '0'], [0.25, '¼'], [0.5, '½'], [0.75, '¾'], [1, 'peak']],
    [{ pts: A.map(a => [a, M.todayAge('str', a)]), cls: 'today', label: 'strength, today', lx: 44, dy: -12 },
     { pts: A.map(a => [a, M.todayAge('spd', a)]), cls: 'today', dash: '6 4', label: 'speed, today (dashed)', lx: 80, dy: 22 },
     { pts: A.map(a => [a, M.ageCurve('str', a)]), cls: 'std', label: 'strength', lx: 60, dy: -10 },
     { pts: A.map(a => [a, M.ageCurve('spd', a)]), cls: 'std', dash: '6 4', label: 'speed (dashed)', lx: 9, dy: 12 }]);
}
// D. an Expert's skill (60) left unused from 35, then taken up again at 55
{
  const td = [], st = [];
  let v = 60; const used = 35;
  for (let a = 35; a <= 70; a++) {
    if (a < 55) { if (a - used >= 2) { const loss = (v - 30) * 0.03 * (a > 34 ? 1.4 : 1); if (loss >= 0.25) v -= loss; } }
    else v = Math.min(60, v + 2.2);   // today: regained at the ordinary pace (about the yard's yearly gain at this level)
    td.push([a, v]);
  }
  const p = M.person({ name: 'x' }); p.L.sword = 60; p.best.sword = 60; p.used.sword = 35;
  for (let a = 35; a <= 70; a++) {
    if (a < 55) M.year(p, a);
    else for (let m = 0; m < 12; m++) M.effort(p, { skill: 'sword', eu: 0.6, q: 'practice', why: 'taken up again' }, a + m / 12);
    st.push([a, p.L.sword]);
  }
  panel(3, 'D. An Expert skill left unused at 35, taken up at 55', 'Swordsmanship 60; practice resumes at 55', [35, 70], [30, 65], 'Age', 'skill level',
    [35, 40, 45, 50, 55, 60, 65, 70], [[35, 'Adv.'], [45, '45'], [55, 'Exp.'], [65, '65']],
    [{ pts: td, cls: 'today', label: 'today', dy: 8 }, { pts: st, cls: 'std', label: 'standard', dy: -6 }]);
}

const css = `
  .bg{fill:#fcfcfb} .t1{font:600 15px system-ui,sans-serif;fill:#0b0b0b} .t2{font:12px system-ui,sans-serif;fill:#0b0b0b}
  .t3{font:11px system-ui,sans-serif;fill:#52514e} .grid{stroke:#e6e5e0;stroke-width:1} .axis{stroke:#a3a29b;stroke-width:1}
  .today{stroke:#eb6834} .std{stroke:#2a78d6} .key{font:12px system-ui,sans-serif;fill:#0b0b0b}
  @media (prefers-color-scheme: dark){ .bg{fill:#1a1a19} .t1,.t2,.key{fill:#f0efec} .t3{fill:#c3c2b7} .grid{stroke:#33332f} .axis{stroke:#6b6a64}
    .today{stroke:#d95926} .std{stroke:#3987e5} }`;
const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="ttl">
<title id="ttl">Growth: the standard (blue) against the game today (orange)</title>
<style>${css}</style>
<rect class="bg" width="${W}" height="${H}"/>
<text class="t1" x="70" y="32">Growth: the standard against the game today</text>
<line class="today" stroke-width="2" x1="70" x2="100" y1="52" y2="52"/><text class="key" x="106" y="56">the game today (measured, or its formulas)</text>
<line class="std" stroke-width="2" x1="400" x2="430" y1="52" y2="52"/><text class="key" x="436" y="56">the standard (docs/design/growth/model.mjs)</text>
${svg.join('\n')}
</svg>
`;
fs.writeFileSync(OUT, out);
console.log(`wrote ${path.relative(process.cwd(), OUT)} (${out.length} bytes; today's lives: ${Object.keys(today.lives).join(', ') || 'none'})`);
