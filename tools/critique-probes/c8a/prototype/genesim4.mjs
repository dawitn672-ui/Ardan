// C8a (realistic revision): the gene rules re-run on the 27 face features of the new layout (32, 16 or 8 steps each).
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rng = mulberry(20261112);
const gauss = () => { let u = 0, v = 0; while (!u) u = rng(); v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const LV = [32, 32, 16, 32, 8, 32, 8, 16, /* eyes */ 16, 16, 16, 16, 8, /* brows */ 16, 8, 8, /* nose */ 32, 32, 16, 16, 8, /* mouth */ 16, 16, 8, 8, /* ears */ 8, 8];
const NS = LV.length;
const GROUPS = { skull: [0, 1, 2, 3, 4, 5, 6, 7], eyes: [8, 9, 10, 11, 12], brows: [13, 14, 15], nose: [16, 17, 18, 19, 20], mouth: [21, 22, 23, 24], ears: [25, 26] };
const q = (v, i) => { const n = LV[i] - 1; return Math.round((clamp(v, -1, 1) + 1) / 2 * n) / n * 2 - 1; };
function founder(SD, lo, hi) {
  const g = []; for (let i = 0; i < NS; i++) g.push(gauss() * SD);
  const k = lo + Math.floor(rng() * (hi - lo + 1)), idx = [...Array(NS).keys()].sort(() => rng() - .5).slice(0, k);
  for (const i of idx) g[i] = (rng() < .5 ? -1 : 1) * (0.7 + rng() * 0.3);
  return g.map(q);
}
function child(f, m, NOISE = 0.12, REG = 0.1) {
  const s = new Array(NS);
  for (const idx of Object.values(GROUPS)) { const r = rng(), w = r < .4 ? .8 : r < .8 ? .2 : .5; for (const i of idx) s[i] = (w * f[i] + (1 - w) * m[i]) * (1 - REG) + gauss() * NOISE; }
  return s.map(q);
}
const dist = (a, b) => { let d = 0; for (let i = 0; i < NS; i++) d += Math.abs(a[i] - b[i]); return d / NS; };
const clear = (a, b, T = 0.5) => { let n = 0; for (let i = 0; i < NS; i++) if (Math.abs(a[i] - b[i]) >= T) n++; return n; };
const med = a => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const pct = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length * p)]; };
for (const [SD, lo, hi, label] of [[0.40, 0, 0, 'bell only, spread .40'], [0.40, 3, 5, 'spread .40 + 3 to 5 signatures'], [0.40, 4, 6, 'spread .40 + 4 to 6 signatures'], [0.36, 4, 6, 'spread .36 + 4 to 6 signatures']]) {
  const worst = []; let c3 = 0, c4 = 0, ext = 0, tot = 0; const SHEETS = 3000;
  for (let t = 0; t < SHEETS; t++) { const P = []; for (let i = 0; i < 20; i++) P.push(founder(SD, lo, hi)); for (const p of P) for (const v of p) { tot++; if (Math.abs(v) > 0.8) ext++; }
    let mn = 99; for (let i = 0; i < 20; i++) for (let j = i + 1; j < 20; j++) mn = Math.min(mn, clear(P[i], P[j])); worst.push(mn); if (mn < 3) c3++; if (mn < 4) c4++; }
  console.log(label, '| closest pair of 20: clear genes median', med(worst), 'p5', pct(worst, .05), '| sheets with a pair under 3:', (c3 / SHEETS * 100).toFixed(1) + '%', 'under 4:', (c4 / SHEETS * 100).toFixed(1) + '%', '| genes at an extreme:', (ext / tot * 100).toFixed(0) + '%');
}
for (const [SD, lo, hi] of [[0.40, 3, 5], [0.40, 4, 6]]) {
  const pc = [], sib = [], cous = [], str = [], gp = [];
  for (let t = 0; t < 6000; t++) { const f = founder(SD, lo, hi), m = founder(SD, lo, hi), c1 = child(f, m), c2 = child(f, m), x = founder(SD, lo, hi), y = founder(SD, lo, hi), g1 = child(c1, founder(SD, lo, hi)), g2 = child(c2, founder(SD, lo, hi)); pc.push(dist(f, c1)); sib.push(dist(c1, c2)); str.push(dist(x, y)); gp.push(dist(f, g1)); cous.push(dist(g1, g2)); }
  const auc = (kin, st) => { let w = 0, n = 0; for (let i = 0; i < 3000; i++) { const a = kin[i], b = st[(i * 7 + 13) % st.length]; w += a < b ? 1 : a === b ? .5 : 0; n++; } return (w / n).toFixed(2); };
  console.log(`signatures ${lo}-${hi}: ratio to strangers: parent-child`, (med(pc) / med(str)).toFixed(2), 'siblings', (med(sib) / med(str)).toFixed(2), 'grandparent', (med(gp) / med(str)).toFixed(2), 'cousins', (med(cous) / med(str)).toFixed(2), '| kin pair closer than strangers: parent-child', auc(pc, str), 'siblings', auc(sib, str), 'grandparent', auc(gp, str), 'cousins', auc(cous, str));
  let named = 0; for (let t = 0; t < 4000; t++) { const f = founder(SD, lo, hi), m = founder(SD, lo, hi), c = child(f, m); let hit = 0; for (const idx of Object.values(GROUPS)) { let df = 0, dm = 0; for (const i of idx) { df += Math.abs(c[i] - f[i]); dm += Math.abs(c[i] - m[i]); } df /= idx.length; dm /= idx.length; if (Math.min(df, dm) < 0.2 && Math.abs(df - dm) > 0.25) hit++; } if (hit) named++; }
  console.log('   children with a feature that is plainly one parent\'s:', (named / 40).toFixed(0) + '%');
}
