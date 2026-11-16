function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rng = mulberry(77);
const gauss = () => { let u = 0, v = 0; while (!u) u = rng(); v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const NS = 17;
const q = v => Math.round((clamp(v, -1, 1) + 1) / 2 * 35) / 35 * 2 - 1;
function founder(SD, lo, hi, mag) {
  const g = []; for (let i = 0; i < NS; i++) g.push(gauss() * SD);
  const k = lo + Math.floor(rng() * (hi - lo + 1)), idx = [...Array(NS).keys()].sort(() => rng() - .5).slice(0, k);
  for (const i of idx) g[i] = (rng() < .5 ? -1 : 1) * (mag + rng() * (1 - mag));
  return g.map(q);
}
const clear = (a, b, T) => { let n = 0; for (let i = 0; i < NS; i++) if (Math.abs(a[i] - b[i]) >= T) n++; return n; };
const med = a => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const pct = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length * p)]; };
for (const [SD, lo, hi, mag] of [[0.38, 2, 4, 0.7], [0.40, 3, 5, 0.7], [0.42, 3, 5, 0.65], [0.45, 3, 5, 0.7], [0.45, 2, 4, 0.7], [0.5, 0, 0, 1]]) {
  const worst = [], near = []; let c3 = 0, c2 = 0; const SHEETS = 3000; let ext = 0, tot = 0;
  for (let t = 0; t < SHEETS; t++) {
    const P = []; for (let i = 0; i < 20; i++) P.push(founder(SD, lo, hi, mag));
    for (const p of P) for (const v of p) { tot++; if (Math.abs(v) > 0.8) ext++; }
    let mn = 99; for (let i = 0; i < 20; i++) for (let j = i + 1; j < 20; j++) mn = Math.min(mn, clear(P[i], P[j], 0.5));
    worst.push(mn); if (mn < 3) c3++; if (mn < 2) c2++;
  }
  console.log(`sd ${SD} sig ${lo}-${hi} mag ${mag}: closest pair clear genes median ${med(worst)} p5 ${pct(worst, .05)}; sheets with a pair <3: ${(c3 / SHEETS * 100).toFixed(0)}%, <2: ${(c2 / SHEETS * 100).toFixed(0)}%; share of genes at an extreme (>0.8): ${(ext / tot * 100).toFixed(0)}%`);
}
