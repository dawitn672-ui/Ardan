// C8a: a throwaway simulation of the planned gene rules (not the game's code): how different are 20 strangers, how close are kin.
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rng = mulberry(20261112);
const gauss = () => { let u = 0, v = 0; while (!u) u = rng(); v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const NS = 17, NP = 12;                  // single genes (36 levels), paired genes (6 levels)
const GROUPS = { skull: [0, 1, 2, 3, 4, 5], eyes: [6, 7, 8, 9], brows: [10], nose: [11, 12, 13, 14], mouth: [15, 16] };
const q36 = v => Math.round((clamp(v, -1, 1) + 1) / 2 * 35), d36 = n => n / 35 * 2 - 1;
const q6 = v => Math.round((clamp(v, -1, 1) + 1) / 2 * 5), d6 = n => n / 5 * 2 - 1;
function founder(SD, nSig) {
  const g = []; for (let i = 0; i < NS; i++) g.push(gauss() * SD);
  // the caricature rule: 2 to 4 signature genes pushed out to 0.7..1
  const k = nSig == null ? 2 + Math.floor(rng() * 3) : nSig, idx = [...Array(NS).keys()].sort(() => rng() - .5).slice(0, k);
  for (const i of idx) g[i] = (rng() < .5 ? -1 : 1) * (0.7 + rng() * 0.3);
  const p = []; for (let i = 0; i < NP; i++) p.push(gauss() * 0.5);
  return { s: g.map(v => d36(q36(v))), p: p.map(v => d6(q6(v))) };
}
function child(f, m, NOISE = 0.12, REG = 0.1) {
  const s = new Array(NS);
  for (const idx of Object.values(GROUPS)) {
    const r = rng(), w = r < .4 ? .8 : r < .8 ? .2 : .5;        // father's, mother's, or a blend
    for (const i of idx) s[i] = (w * f.s[i] + (1 - w) * m.s[i]) * (1 - REG) + gauss() * NOISE;
  }
  const p = f.p.map((v, i) => (rng() < .5 ? v : m.p[i]) + gauss() * 0.15);
  return { s: s.map(v => d36(q36(v))), p: p.map(v => d6(q6(v))) };
}
const dist = (a, b) => { let d = 0; for (let i = 0; i < NS; i++) d += Math.abs(a.s[i] - b.s[i]); return d / NS; };
const clear = (a, b, T = 0.5) => { let n = 0; for (let i = 0; i < NS; i++) if (Math.abs(a.s[i] - b.s[i]) >= T) n++; return n; };
const med = a => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const pct = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length * p)]; };
for (const [SD, nSig, label] of [[0.3, 0, 'normal sd .30, no signatures'], [0.42, 0, 'normal sd .42, no signatures'], [0.38, null, 'normal sd .38 + 2-4 signatures (the plan)']]) {
  const worst = [], worstD = []; let confus = 0; const SHEETS = 4000;
  for (let t = 0; t < SHEETS; t++) {
    const P = []; for (let i = 0; i < 20; i++) P.push(founder(SD, nSig));
    let mn = 99, md = 9;
    for (let i = 0; i < 20; i++) for (let j = i + 1; j < 20; j++) { mn = Math.min(mn, clear(P[i], P[j])); md = Math.min(md, dist(P[i], P[j])); }
    worst.push(mn); worstD.push(md); if (mn < 3) confus++;
  }
  console.log(label, '| closest pair on a sheet of 20: clearly different genes median', med(worst), 'p5', pct(worst, .05), '| mean gene gap of the closest pair median', med(worstD).toFixed(2), '| sheets with a pair under 3 clear genes', (confus / SHEETS * 100).toFixed(1) + '%');
}
// kin against strangers
const SD = 0.38; const pc = [], sib = [], cous = [], str = [], gp = [];
for (let t = 0; t < 6000; t++) {
  const f = founder(SD), m = founder(SD), c1 = child(f, m), c2 = child(f, m), x = founder(SD), y = founder(SD);
  const sp1 = founder(SD), g1 = child(c1, sp1);   // grandchild of f
  const sp2 = founder(SD), g2 = child(c2, sp2);   // cousin of g1
  pc.push(dist(f, c1)); sib.push(dist(c1, c2)); str.push(dist(x, y)); gp.push(dist(f, g1)); cous.push(dist(g1, g2));
}
const auc = (kin, st) => { let w = 0, n = 0; for (let i = 0; i < 3000; i++) { const a = kin[i], b = st[(i * 7 + 13) % st.length]; w += a < b ? 1 : a === b ? .5 : 0; n++; } return (w / n).toFixed(2); };
console.log('median gene distance: parent-child', med(pc).toFixed(3), 'siblings', med(sib).toFixed(3), 'grandparent', med(gp).toFixed(3), 'cousins', med(cous).toFixed(3), 'strangers', med(str).toFixed(3));
console.log('ratio to strangers: parent-child', (med(pc) / med(str)).toFixed(2), 'siblings', (med(sib) / med(str)).toFixed(2), 'grandparent', (med(gp) / med(str)).toFixed(2), 'cousins', (med(cous) / med(str)).toFixed(2));
console.log('chance a kin pair is closer than a stranger pair: parent-child', auc(pc, str), 'siblings', auc(sib, str), 'grandparent', auc(gp, str), 'cousins', auc(cous, str));
// "takes after": how often does a child read as father's/mother's in at least one group
let named = 0; for (let t = 0; t < 4000; t++) { const f = founder(SD), m = founder(SD), c = child(f, m); let hit = 0; for (const idx of Object.values(GROUPS)) { let df = 0, dm = 0; for (const i of idx) { df += Math.abs(c.s[i] - f.s[i]); dm += Math.abs(c.s[i] - m.s[i]); } df /= idx.length; dm /= idx.length; if (Math.min(df, dm) < 0.15 && Math.abs(df - dm) > 0.25) hit++; } if (hit) named++; }
console.log('children with at least one feature that is plainly one parent\'s:', (named / 40).toFixed(0) + '%');
