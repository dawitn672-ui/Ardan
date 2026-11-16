// S1a: draws lives.svg from lives.json (written by lives.mjs): nine small panels, one a life, level against age,
// and under them the spread run (years to Master for 400 people of ordinary talent given the same training).
//   node docs/design/skills/lives.mjs > /dev/null && node docs/design/skills/chart.mjs
// One series a panel, so no colour carries identity; the breakthrough marker is a second hue and a second shape.
// Light and dark values are both chosen (validated with the dataviz palette script); the file follows the reader's theme.
import fs from 'node:fs';
const { lives, spread } = JSON.parse(fs.readFileSync(new URL('./lives.json', import.meta.url), 'utf8'));
const WORDS = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master', 'Grandmaster', 'Legend'];
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const W = 1180, COLS = 3, PW = 372, PH = 232, GX = 22, GY = 26, LEFT = 20, TOP = 96;
const plot = { l: 84, r: 10, t: 44, b: 26 };
const X0 = 10, X1 = 75, YMAX = 35;
const rows = Math.ceil(lives.length / COLS), histTop = TOP + rows * (PH + GY) + 26, H = histTop + 300;
let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Nine sample lives under the skill model, and the spread of years to Master across four hundred people given the same training">
<style>
  :root { --surface: #fcfcfb; --ink: #0b0b0b; --ink2: #52514e; --grid: #e4e3df; --band: #f3f2ee; --line: #2a78d6; --mark: #eb6834; }
  @media (prefers-color-scheme: dark) { :root { --surface: #1a1a19; --ink: #f0efec; --ink2: #c3c2b7; --grid: #34342f; --band: #222220; --line: #3987e5; --mark: #d95926; } }
  text { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; fill: var(--ink2); font-size: 11px; }
  .h { fill: var(--ink); font-size: 20px; font-weight: 600; } .t { fill: var(--ink); font-size: 13.5px; font-weight: 600; } .sub { font-size: 11px; }
  .lv { fill: none; stroke: var(--line); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
  .held { fill: none; stroke: var(--line); stroke-width: 2; stroke-dasharray: 2 5; stroke-linecap: round; }
  .grid { stroke: var(--grid); stroke-width: 1; } .band { fill: var(--band); }
  .bt { fill: var(--mark); stroke: var(--surface); stroke-width: 2; } .wd { fill: var(--surface); stroke: var(--line); stroke-width: 2; }
  .bar { fill: var(--line); } .never { fill: var(--mark); } .note { fill: var(--ink); font-size: 11.5px; }
</style>
<rect width="${W}" height="${H}" fill="var(--surface)"/>
<text class="h" x="${LEFT}" y="34">Nine lives under the skill model</text>
<text x="${LEFT}" y="56" style="font-size:12.5px">Level against age. Each word has five steps. A dotted stretch is a level held at the edge of a word: a concept not yet grasped, or a proof not yet given.</text>`;
// legend
{
  let x = LEFT; const y = 78;
  s += `<path class="lv" d="M${x} ${y}h26"/><text x="${x + 32}" y="${y + 4}">level</text>`; x += 80;
  s += `<path class="held" d="M${x} ${y}h26"/><text x="${x + 32}" y="${y + 4}">held at an edge</text>`; x += 136;
  s += `<circle class="wd" cx="${x + 6}" cy="${y}" r="4.5"/><text x="${x + 18}" y="${y + 4}">a new word reached</text>`; x += 142;
  s += `<path class="bt" d="M${x + 7} ${y - 7}l7 7l-7 7l-7 -7z"/><text x="${x + 20}" y="${y + 4}">a breakthrough</text>`;
}
lives.forEach((l, i) => {
  const ox = LEFT + (i % COLS) * (PW + GX), oy = TOP + Math.floor(i / COLS) * (PH + GY);
  const pw = PW - plot.l - plot.r, ph = PH - plot.t - plot.b;
  const x = a => ox + plot.l + (a - X0) / (X1 - X0) * pw, y = lv => oy + plot.t + ph - lv / YMAX * ph;
  s += `<g><text class="t" x="${ox}" y="${oy + 14}">${esc(l.name)}</text><text class="sub" x="${ox}" y="${oy + 30}">${esc(l.blurb)}</text>`;
  for (let w = 0; w < 7; w++) {
    if (w % 2 === 0) s += `<rect class="band" x="${x(X0)}" y="${y((w + 1) * 5)}" width="${pw}" height="${ph / 7}"/>`;
    s += `<text x="${ox + plot.l - 8}" y="${y(w * 5 + 2.5) + 4}" text-anchor="end">${WORDS[w]}</text>`;
  }
  s += `<path class="grid" d="M${x(X0)} ${y(0)}H${x(X1)}"/>`;
  for (let a = 20; a <= 70; a += 10) s += `<path class="grid" d="M${x(a)} ${y(0)}v4"/><text x="${x(a)}" y="${y(0) + 17}" text-anchor="middle">${a}</text>`;
  // the level as a stepped line from the first try; held years dotted
  const pts = [{ age: l.from, lv: 0, st: 0 }, ...l.pts];
  let solid = '', held = '';
  for (let j = 1; j < pts.length; j++) {
    const a = pts[j - 1], b = pts[j], seg = `M${x(a.age).toFixed(1)} ${y(a.lv).toFixed(1)}L${x(b.age).toFixed(1)} ${y(b.lv).toFixed(1)}`;
    if (b.st && a.st && a.lv === b.lv) held += seg; else solid += seg;
  }
  s += `<path class="lv" d="${solid}"/><path class="held" d="${held}"/>`;
  const lvAt = age => { let v = 0; for (const p of pts) if (p.age <= age + 1) v = p.lv; return v; };
  for (const m of l.marks.filter(m => m.kind === 'word' && /reaches (Expert|Master|Grandmaster|Legend)/.test(m.text))) {
    const w = WORDS.findIndex(n => m.text.includes('reaches ' + n + ':'));
    s += `<circle class="wd" cx="${x(m.age + 0.5).toFixed(1)}" cy="${y(w * 5 + 1).toFixed(1)}" r="4.5"><title>${esc(m.age + ': ' + m.text)}</title></circle>`;
  }
  for (const m of l.marks.filter(m => m.kind === 'breakthrough')) {
    const cx = x(m.age + 0.5), cy = y(lvAt(m.age)) - 13;
    s += `<path class="bt" d="M${cx.toFixed(1)} ${(cy - 6).toFixed(1)}l6 6l-6 6l-6 -6z"><title>${esc(m.age + ': ' + m.text)}</title></path>`;
  }
  // one direct label: where the life ends
  const last = pts[pts.length - 1];
  s += `<text class="note" x="${Math.min(x(last.age), ox + PW - plot.r)}" y="${y(last.lv) - 8}" text-anchor="end">${esc(l.now.level)}</text></g>`;
});
// ---- the spread ------------------------------------------------------------------------------------------------------
{
  const data = spread.sameC, sm = spread.sumC, BIN = 2, lo = 6, hi = 50, n = (hi - lo) / BIN;
  const bins = Array.from({ length: n }, () => 0); let never = 0;
  for (const v of data) { if (v == null) never++; else bins[Math.min(n - 1, Math.max(0, Math.floor((v - lo) / BIN)))]++; }
  const ox = LEFT, pl = 46, pw = W - LEFT * 2 - pl - 120, ph = 170, oy = histTop + 62, max = Math.max(...bins, never);
  const bw = pw / n, yy = c => oy + ph - c / max * ph;
  s += `<text class="h" x="${ox}" y="${histTop + 8}">The same training, four hundred people</text>`;
  s += `<text x="${ox}" y="${histTop + 30}" style="font-size:12.5px">All of ordinary talent (C), a master's drill and two bouts a year from fourteen. Years until Swordsmanship reaches Master: ${sm.master} do, between ${sm.fastest.toFixed(0)} and ${sm.slowest.toFixed(0)} years; ${sm.never} never do.</text>`;
  for (const g of [0, 0.5, 1]) { const c = Math.round(max * g / 10) * 10; s += `<path class="grid" d="M${ox + pl} ${yy(c)}H${ox + pl + pw + 110}"/><text x="${ox + pl - 8}" y="${yy(c) + 4}" text-anchor="end">${c}</text>`; }
  bins.forEach((c, i) => {
    if (!c) return; const bx = ox + pl + i * bw + 1, by = yy(c), h = oy + ph - by, r = Math.min(4, h);
    s += `<path class="bar" d="M${bx} ${oy + ph}V${by + r}q0 ${-r} ${r} ${-r}H${bx + bw - 2 - r}q${r} 0 ${r} ${r}V${oy + ph}z"><title>${lo + i * BIN} to ${lo + (i + 1) * BIN} years: ${c} people</title></path>`;
  });
  for (let v = lo; v <= hi; v += 4) s += `<text x="${ox + pl + (v - lo) / BIN * bw}" y="${oy + ph + 17}" text-anchor="middle">${v}</text>`;
  s += `<text x="${ox + pl + pw / 2}" y="${oy + ph + 36}" text-anchor="middle">years of training to reach Master</text><text x="${ox}" y="${oy - 18}">people</text>`;
  const nx = ox + pl + pw + 50, ny = yy(never), nh = oy + ph - ny;
  s += `<path class="never" d="M${nx} ${oy + ph}V${ny + 4}q0 -4 4 -4H${nx + 30}q4 0 4 4V${oy + ph}z"><title>never: ${never} people</title></path><text class="note" x="${nx + 19}" y="${ny - 6}" text-anchor="middle">${never}</text><text x="${nx + 19}" y="${oy + ph + 17}" text-anchor="middle">never</text>`;
  const pk = bins.indexOf(Math.max(...bins));
  s += `<text class="note" x="${ox + pl + (pk + 0.5) * bw}" y="${yy(bins[pk]) - 6}" text-anchor="middle">${bins[pk]}</text>`;
}
s += '</svg>\n';
fs.writeFileSync(new URL('./lives.svg', import.meta.url), s);
console.log('lives.svg', s.length, 'bytes');
