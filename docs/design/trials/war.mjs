// A throwaway trial behind docs/design/war.md (D12a): what would the design's three engines cost, and how big is
// their state in a save? It is not game code and nothing builds from it. Its constants are guesses made to give the
// arithmetic the design's shape; the balance is D12b's work, held by tests there.
//
//   node docs/design/trials/war.mjs [runs=200] [--trace=ridge|knights|spears|bows]
//
// 1. The engagement: companies of about 200 men on a field of 50 m cells (height, a wood, a marsh, a stream), stepped
//    in beats. A beat: every company picks or keeps a target, moves over the ground, shoots, fights whoever its front
//    touches (only the files in contact fight, and a front is shared out among those who come at it), then tests its
//    nerve; the broken run, panic spreads, a side quits the field. Everything in a beat is worked out from where the
//    beat began and applied together, so neither side strikes first. Every multiplier is added to a ledger of named
//    causes as it is used: the after-action report is that ledger read back, never a guess made afterwards.
// 2. The burn: who holds each 10 km cell of a 700 x 450 map, as a byte of hold a cell, moved once a week by the
//    armies' reach and the ground's damp; only the cells along the fronts are visited.
// 3. The roads: a route graph of about 1,200 places, and an army's search for what it can reach in a march.
//
// The header of docs/design/war.md §5 quotes a run of this file. The figures move with the machine's load (it is a
// shared 4-core container): run it for today's.
import zlib from 'node:zlib';
import { performance } from 'node:perf_hooks';

const RUNS = +(process.argv.slice(2).find(a => /^\d+$/.test(a)) || 200);
// a seeded stream (the v2 engine's generator): the same seed is the same battle, on any machine
const mk = seed => { let s = seed >>> 0; const r = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; r.n = () => (r() + r() + r() + r() - 2) * 1.73; return r; };
const median = a => { const b = a.slice().sort((x, y) => x - y); return b[b.length >> 1]; };
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// ---------------------------------------------------------------------------------------------------------------
// 1. the engagement
// ---------------------------------------------------------------------------------------------------------------
// arms: worth in levies a man, armour 0..1, metres a beat, bow range in metres, mounted, ranks that reach the enemy,
// a file's width in metres, depth in ranks
const A_W = [1.0, 1.6, 2.6, 1.2, 1.3, 2.0, 6.0, 18], A_ARM = [0.2, 0.4, 0.7, 0.2, 0.4, 0.3, 0.9, 1.0];
const A_SPD = [70, 65, 60, 75, 65, 190, 150, 60], A_RNG = [0, 0, 0, 220, 180, 0, 0, 0], A_MT = [0, 0, 0, 0, 0, 1, 1, 0];
const A_RANKS = [3, 3, 2, 2, 2, 1.5, 1.5, 2], A_SPACE = [0.9, 0.8, 1.0, 1.2, 1.2, 1.6, 1.4, 1.0], A_DEPTH = [6, 6, 5, 4, 4, 3, 3, 4];
const LEVY = 0, SPEAR = 1, FOOT = 2, ARCHER = 3, XBOW = 4, LHORSE = 5, KNIGHT = 6, ORDER = 7;
// what beats what in the press: MATCH[mine][theirs]
const MATCH = [
  /* levy   */ [1, 0.9, 0.75, 1.1, 1.1, 0.8, 0.6, 0.6],
  /* spear  */ [1.1, 1, 0.8, 1.2, 1.2, 1.4, 1.5, 0.7],
  /* foot   */ [1.3, 1.25, 1, 1.3, 1.3, 1.0, 0.9, 0.8],
  /* archer */ [0.8, 0.7, 0.6, 1, 1, 0.6, 0.5, 0.5],
  /* xbow   */ [0.8, 0.7, 0.65, 1, 1, 0.6, 0.55, 0.5],
  /* lhorse */ [1.3, 0.6, 0.8, 1.5, 1.4, 1, 0.6, 0.6],
  /* knight */ [1.5, 0.55, 1.0, 1.6, 1.5, 1.3, 1, 0.8],
  /* order  */ [1.3, 1.2, 1.1, 1.3, 1.3, 1.1, 1.0, 1],
];
const CAUSES = ['the ground', 'arms against arms', 'art and drill', 'arrows', 'the charge', 'taken in flank', 'wind', 'order lost', 'nerve', 'fortune'];
const C_GROUND = 0, C_MATCH = 1, C_ART = 2, C_ARROWS = 3, C_SHOCK = 4, C_FLANK = 5, C_WIND = 6, C_ORDER = 7, C_NERVE = 8, C_LUCK = 9;
// the guesses: blows a beat; men an archer drops a beat at point-blank on bare men; what one grade of art is worth
// to a company's blows; how far the day's fortune swings a side
const BLOWS = 0.03, ARROWS = 0.15, ART = 0.04, TIDE = 0.1;

// a field: 48 x 32 cells of 50 m. 'open', or 'ridge' (side B stands on a ridge behind a stream with fords)
const FW = 48, FH = 32, CELL = 50;
function makeField(kind, seed) {
  const h = new Float32Array(FW * FH), cov = new Uint8Array(FW * FH);
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    const i = y * FW + x;
    h[i] = 6 * Math.sin(x * 0.21 + seed % 7) * Math.cos((y - 15.5) * 0.17) + (kind === 'ridge' ? 28 * Math.exp(-((y - 6) * (y - 6)) / 18) : 0);
    if (kind === 'ridge' && (y === 13 || y === 14) && x % 11 > 1) cov[i] = 3;             // a stream with fords
    const wx = x - 6, wy = y - 15.5; if (wx * wx + wy * wy < 20) cov[i] = 1;               // a wood on the west flank
    const mx = x - 40, my = y - 20; if (kind !== 'open' && mx * mx + my * my < 9) cov[i] = 2;   // a marsh on the east
  }
  return { h, cov };
}
const FOOT_MUL = [1, 0.6, 0.5, 0.6], HORSE_MUL = [1, 0.35, 0.3, 0.55];

// an army: [[arm, companies, men each, art grade, hold], ...] in two lines, bowmen in front, horse on the wings
function makeBattle(seed, armyA, armyB, fieldKind = 'open') {
  const n = armyA.reduce((s, g) => s + g[1], 0) + armyB.reduce((s, g) => s + g[1], 0), rnd = mk(seed);
  const B = {
    n, seed, rnd, field: makeField(fieldKind, seed), beat: 0, over: false, winner: -1,
    side: new Uint8Array(n), arm: new Uint8Array(n), men: new Float32Array(n), men0: new Float32Array(n),
    x: new Float32Array(n), y: new Float32Array(n), hx: new Float32Array(n), hy: new Float32Array(n),
    coh: new Float32Array(n).fill(1), nerve: new Float32Array(n), fat: new Float32Array(n), ammo: new Uint8Array(n),
    state: new Uint8Array(n), tgt: new Int16Array(n).fill(-1), first: new Uint8Array(n).fill(1), art: new Float32Array(n),
    hold: new Uint8Array(n), lost: new Float32Array(n), led: new Float64Array(CAUSES.length * 2), start: [0, 0], orders: [],
    nx: new Float32Array(n), ny: new Float32Array(n), dn: new Float32Array(n), dc: new Float32Array(n),
    day: new Float32Array(n), cnt: new Uint8Array(n), still: new Uint8Array(n), moved: new Uint8Array(n), press: new Uint8Array(n),
    ax: new Float32Array(n), ay: new Float32Array(n),
    tide: [Math.exp(TIDE * rnd.n()), Math.exp(TIDE * rnd.n())],           // the day's fortune, a side
  };
  let k = 0;
  for (const [s, army] of [[0, armyA], [1, armyB]]) {
    const foot = [], horse = [];
    for (const g of army) for (let c = 0; c < g[1]; c++) (A_MT[g[0]] ? horse : foot).push(g);
    const perLine = Math.max(1, Math.ceil(foot.length / 2)), W = FW * CELL, y0 = s === 0 ? FH * CELL - 250 : 250, dir = s === 0 ? -1 : 1;
    const gap = Math.min(170, (W - 500) / Math.max(1, perLine));
    const put = (g, px, py) => {
      B.side[k] = s; B.arm[k] = g[0]; B.men[k] = B.men0[k] = g[2]; B.x[k] = px; B.y[k] = py; B.hx[k] = 0; B.hy[k] = dir;
      B.nerve[k] = clamp(0.62 + 0.05 * Math.log2(A_W[g[0]]) + 0.04 * rnd.n(), 0.3, 1); B.ammo[k] = A_RNG[g[0]] ? 14 : 0;
      B.art[k] = g[3] || 0; B.hold[k] = g[4] ? 1 : 0; B.day[k] = Math.exp(0.15 * rnd.n()); B.start[s] += g[2]; k++;   // day: some companies fight above themselves
    };
    foot.sort((a, b) => (A_RNG[b[0]] ? 1 : 0) - (A_RNG[a[0]] ? 1 : 0));
    foot.forEach((g, i) => { const line = A_RNG[g[0]] ? 0 : 1 + ((i / perLine) | 0) % 2, col = i % perLine; put(g, W / 2 + (col - (perLine - 1) / 2) * gap, y0 + dir * (line === 0 ? 120 : -(line - 1) * 110)); });
    horse.forEach((g, i) => put(g, i % 2 ? W - 160 - 90 * (i >> 1) : 160 + 90 * (i >> 1), y0 + dir * 40));
  }
  return B;
}

function beat(B) {
  const { n, side, arm, men, x, y, hx, hy, coh, nerve, fat, ammo, state, tgt, first, art, hold, lost, led, rnd, nx, ny, dn, dc, day, cnt, still, moved, press, tide, ax, ay } = B;
  const { h, cov } = B.field, W = FW * CELL, H = FH * CELL;
  const cellOf = (px, py) => clamp((py / CELL) | 0, 0, FH - 1) * FW + clamp((px / CELL) | 0, 0, FW - 1);
  lost.fill(0); dn.fill(0); dc.fill(0); cnt.fill(0); still.fill(1); moved.fill(0); nx.set(x); ny.set(y);
  // orders that arrive this beat (a courier's ride is the delay): [beat, company, kind]
  for (const o of B.orders) if (o[0] === B.beat) { if (o[2] === 'advance') hold[o[1]] = 0; else if (o[2] === 'hold') hold[o[1]] = 1; }
  // 1. targets: the nearest enemy, weighted by what this arm beats. A company told to hold is let go once a friend
  //    within 250 m of it was in the press last beat (a line fights as a line)
  for (let i = 0; i < n; i++) {
    if (state[i] >= 3) continue;
    let best = -1, bs = 0, help = 0;
    for (let j = 0; j < n; j++) {
      const dx = x[j] - x[i], dy = y[j] - y[i], d2 = dx * dx + dy * dy;
      if (side[j] === side[i]) { if (press[j] && d2 < 62500) help = 1; continue; }
      if (state[j] >= 4) continue;
      const sc = (state[j] === 3 ? 0.4 : 1) * MATCH[arm[i]][arm[j]] / (d2 + 400);
      if (sc > bs) { bs = sc; best = j; }
    }
    tgt[i] = best; if (help) hold[i] = 0;
  }
  // 2. move over the ground. First those who give ground: the broken, and bowmen with the enemy close...
  for (let i = 0; i < n; i++) {
    if (state[i] >= 4) continue;
    const a = arm[i], c = cov[cellOf(x[i], y[i])], sp = A_SPD[a] * (A_MT[a] ? HORSE_MUL[c] : FOOT_MUL[c]) * (1 - 0.4 * fat[i]);
    if (state[i] === 3) {                                  // broken: run for the baseline, and off the field
      ny[i] = y[i] + (side[i] === 0 ? 1 : -1) * sp * 1.2; fat[i] = Math.min(1, fat[i] + 0.02); moved[i] = 1; still[i] = 0;
      if (ny[i] < 0 || ny[i] > H) state[i] = 4;
      continue;
    }
    const j = tgt[i]; if (j < 0 || !A_RNG[a]) continue;
    let dx = x[j] - x[i], dy = y[j] - y[i]; const d = Math.hypot(dx, dy) || 1;
    if (d <= 90) { dx /= d; dy /= d; nx[i] = clamp(x[i] - dx * sp, 20, W - 20); ny[i] = clamp(y[i] - dy * sp, 20, H - 20); moved[i] = 1; still[i] = 0; }
  }
  //    ...then the rest, toward where a target that gives ground will be (so a faster body catches a slower one);
  //    a target that is itself coming on is aimed at where the beat began, so neither side moves first
  ax.set(nx); ay.set(ny);
  for (let i = 0; i < n; i++) {
    if (state[i] >= 3 || moved[i]) continue;
    const j = tgt[i]; if (j < 0) continue;
    const a = arm[i], c = cov[cellOf(x[i], y[i])], sp = A_SPD[a] * (A_MT[a] ? HORSE_MUL[c] : FOOT_MUL[c]) * (1 - 0.4 * fat[i]);
    let dx = ax[j] - x[i], dy = ay[j] - y[i]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    hx[i] += (dx - hx[i]) * 0.5; hy[i] += (dy - hy[i]) * 0.5;       // a formed body turns slowly
    const reach = 35, rng = A_RNG[a];
    if (hold[i] && d > 160) { fat[i] = Math.max(0, fat[i] - 0.01); continue; }
    if (rng && ammo[i] && d < rng) continue;                 // in range: stand and shoot
    if (d > reach) {
      // two bodies closing on each other each cover part of the gap
      const closing = !moved[j] && state[j] < 3 && !hold[j] && !(A_RNG[arm[j]] && ammo[j]);
      const step = Math.min(sp, (d - reach) * (closing ? 0.55 : 1) + 1);
      nx[i] = clamp(x[i] + dx * step, 20, W - 20); ny[i] = clamp(y[i] + dy * step, 20, H - 20); still[i] = 0;
      fat[i] = Math.min(1, fat[i] + (A_MT[a] ? 0.012 : 0.008) * (1 + A_ARM[a]));
      if ((c === 1 || c === 3) && !rng) dc[i] -= c === 3 ? 0.09 : 0.03;      // a formed body loses its order in a wood, and more in a stream
    }
  }
  x.set(nx); y.set(ny);
  // 3. who is in the press this beat (fronts within 60 m), and how many come at each front
  const flankOf = (i, j) => { const dx = x[j] - x[i], dy = y[j] - y[i], d = Math.hypot(dx, dy) || 1; return (hx[j] * -dx + hy[j] * -dy) / d; };
  press.fill(0);
  for (let i = 0; i < n; i++) {
    if (state[i] >= 3) continue;
    const j = tgt[i]; if (j < 0 || state[j] >= 4) continue;
    if (Math.hypot(x[j] - x[i], y[j] - y[i]) <= 60) { press[i] = press[j] = 1; if (flankOf(i, j) >= 0.25) cnt[j]++; }
  }
  // 4. arrows and bolts (never into the press, where friends stand)
  for (let i = 0; i < n; i++) {
    const a = arm[i], rng = A_RNG[a]; if (!rng || !ammo[i] || state[i] >= 3 || press[i]) continue;
    const j = tgt[i]; if (j < 0 || press[j]) continue;
    const d = Math.hypot(x[j] - x[i], y[j] - y[i]); if (d > rng) continue;
    const up = h[cellOf(x[i], y[i])] - h[cellOf(x[j], y[j])], gm = up > 6 ? 1.15 : 1, cm = cov[cellOf(x[j], y[j])] === 1 ? 0.5 : 1;
    const pierce = a === XBOW ? 0.35 : 0.75, k = men[i] * ARROWS * (1 - 0.5 * d / rng) * (1 - pierce * A_ARM[arm[j]]) * gm * cm * (0.85 + 0.3 * rnd());
    lost[j] += k; ammo[i]--; led[C_ARROWS * 2 + side[i]] += k; if (gm > 1) led[C_GROUND * 2 + side[i]] += k * (1 - 1 / gm);
  }
  // 5. the press: only the files in contact fight, and a company's front is shared out among those who come at it
  //    from the front (so numbers tell by lasting longer, or by reaching a flank)
  for (let i = 0; i < n; i++) {
    if (state[i] >= 3) continue;
    const j = tgt[i]; if (j < 0 || state[j] >= 4) continue;
    const dx = x[j] - x[i], dy = y[j] - y[i], d = Math.hypot(dx, dy); if (d > 60) continue;
    const a = arm[i], b = arm[j];
    const fd = flankOf(i, j), flankM = state[j] === 3 ? 1 : fd < -0.4 ? 1.9 : fd < 0.25 ? 1.4 : 1;      // is j taken in flank or rear?
    const fi = men[i] / A_DEPTH[a] * A_SPACE[a], fj = men[j] / A_DEPTH[b] * A_SPACE[b];
    const L = flankM > 1 ? Math.min(fi, fj * 0.4) : Math.min(fi, fj / Math.max(1, cnt[j]));
    const engaged = Math.min(men[i], L / A_SPACE[a] * A_RANKS[a]);
    const hi = h[cellOf(x[i], y[i])], hj = h[cellOf(x[j], y[j])];
    const ground = hi < hj - 3 ? 0.8 : hi > hj + 3 ? 1.1 : 1;
    let match = MATCH[a][b];
    const ci = cov[cellOf(x[i], y[i])]; if (A_MT[a] && ci) match *= 0.6;          // horse in a wood or a marsh
    // points grounded and the men standing in their order: no horse rides into it twice
    const setJ = (b === SPEAR || b === ORDER) && still[j] && coh[j] > 0.6 && fd >= 0.25, setI = (a === SPEAR || a === ORDER) && still[i] && coh[i] > 0.6;
    if (A_MT[a] && setJ) match *= 0.6;
    if (A_MT[b] && setI) match *= 1.3;
    const artM = Math.exp(ART * (art[i] - art[j]));
    const windM = 1 - 0.5 * fat[i], cohM = 0.5 + 0.5 * coh[i], nerveM = 0.6 + 0.5 * nerve[i];
    const luck = day[i] * tide[side[i]] * Math.exp(0.1 * rnd.n());
    let k = engaged * A_W[a] * BLOWS * ground * match * artM * windM * cohM * nerveM * flankM * luck / Math.pow(A_W[b], 0.75);
    // the charge: horse arriving on open ground, once
    if (A_MT[a] && first[i] && !ci) {
      first[i] = 0;
      if (setJ) { dc[i] -= 0.3; lost[i] += engaged * 0.05; led[C_SHOCK * 2 + side[j]] += engaged * 0.05; }
      else { const sh = engaged * A_W[a] * 0.04 / Math.pow(A_W[b], 0.75); k += sh; dn[j] -= 0.1; dc[j] -= 0.15; led[C_SHOCK * 2 + side[i]] += sh; }
    }
    lost[j] += k; fat[i] = Math.min(1, fat[i] + 0.012 * (1 + A_ARM[a]));
    // the ledger: what each named cause added to this company's blows, or took from them
    const s2 = side[i], add = (c, m) => { if (m > 1) led[c * 2 + s2] += k * (1 - 1 / m); else if (m < 1) led[c * 2 + 1 - s2] += k * (1 / m - 1); };
    add(C_GROUND, ground); add(C_MATCH, match); add(C_ART, artM); add(C_WIND, windM); add(C_ORDER, cohM); add(C_NERVE, nerveM); add(C_FLANK, flankM); add(C_LUCK, luck);
    const weight = Math.min(1, Math.sqrt(A_W[a] / A_W[b]));                        // a mob behind an order knight frightens him less
    if (flankM > 1) { dn[j] -= 0.04 * weight; dc[j] -= 0.05 * weight; }
    if (A_W[a] >= 12) dn[j] -= 0.03;                                               // the terror of an order
  }
  // 6. losses, nerve, panic: everything this beat did is applied together
  let brokeNow = 0; const gone = [0, 0];
  for (let i = 0; i < n; i++) { if (state[i] >= 3) gone[side[i]] += B.men0[i]; }
  for (let i = 0; i < n; i++) {
    if (state[i] >= 4) continue;
    nerve[i] += dn[i] - (gone[side[i]] > 0.3 * B.start[side[i]] ? 0.012 : 0);       // the day is going badly
    coh[i] = Math.max(0.2, coh[i] + dc[i]);
    const l = Math.min(men[i], lost[i]);
    if (l > 0) { const share = l / Math.max(1, men[i]); men[i] -= l; nerve[i] -= share * 2.0 / (0.8 + 0.25 * Math.log2(1 + A_W[arm[i]])); coh[i] = Math.max(0.2, coh[i] - share * 0.6); }
    else if (state[i] < 3) { nerve[i] = Math.min(1, nerve[i] + 0.006); coh[i] = Math.min(1, coh[i] + 0.01); fat[i] = Math.max(0, fat[i] - 0.004); }
    if (state[i] < 3) {
      const was = state[i];
      state[i] = nerve[i] < 0.16 || men[i] < 0.3 * B.men0[i] ? 3 : nerve[i] < 0.3 ? 2 : nerve[i] < 0.5 ? 1 : 0;
      if (state[i] === 3 && was < 3) brokeNow++;
    }
  }
  if (brokeNow) for (let i = 0; i < n; i++) {               // panic: a company breaking shakes those within 200 m of it
    if (state[i] !== 3) continue;
    for (let j = 0; j < n; j++) if (side[j] === side[i] && state[j] < 3) { const dx = x[j] - x[i], dy = y[j] - y[i]; if (dx * dx + dy * dy < 40000) nerve[j] -= 0.025; }
  }
  // 7. does a side quit the field?
  B.beat++;
  const live = [0, 0];
  for (let i = 0; i < n; i++) if (state[i] < 3) live[side[i]] += men[i];
  const q0 = live[0] < 0.5 * B.start[0], q1 = live[1] < 0.5 * B.start[1];
  if (q0 || q1 || B.beat >= 90) {
    B.over = true; B.winner = q0 && !q1 ? 1 : q1 && !q0 ? 0 : live[0] / B.start[0] >= live[1] / B.start[1] ? 0 : 1;
    if (q0 !== q1) for (let i = 0; i < n; i++) if (side[i] !== B.winner && state[i] < 4) { men[i] *= 0.85; state[i] = 3; }   // the pursuit
  }
}
const fight = B => { while (!B.over) beat(B); return B; };
const hashOf = B => { let hh = 2166136261; const f = v => { hh ^= Math.round(v * 16); hh = Math.imul(hh, 16777619); }; for (let i = 0; i < B.n; i++) { f(B.men[i]); f(B.x[i]); f(B.y[i]); f(B.state[i]); } return (hh >>> 0).toString(16); };
const causesOf = B => CAUSES.map((c, i) => [c, B.led[i * 2] - B.led[i * 2 + 1]]).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 3).map(([c, v]) => `${c} ${v > 0 ? 'for A' : 'for B'} (${Math.round(Math.abs(v))})`);

const host = (cos, art = 0) => [[SPEAR, Math.round(cos * 0.3), 200, art], [LEVY, Math.round(cos * 0.25), 220, art - 1], [FOOT, Math.round(cos * 0.12), 180, art], [ARCHER, Math.round(cos * 0.18), 190, art], [KNIGHT, Math.max(1, Math.round(cos * 0.08)), 110, art + 1], [LHORSE, Math.max(1, Math.round(cos * 0.07)), 140, art]];
const held = army => army.map(g => [g[0], g[1], g[2], g[3] || 0, 1]);
const menOf = army => army.reduce((s, g) => s + g[1] * g[2], 0);
const SKIRMISH = [[[SPEAR, 2, 180], [LHORSE, 1, 90]], [[LEVY, 2, 200], [ARCHER, 1, 120]], 'open'];

for (let s = 1; s <= 80; s++) { fight(makeBattle(s, host(24), held(host(24)), 'ridge')); fight(makeBattle(s, ...SKIRMISH)); fight(makeBattle(s, host(60), host(60), 'open')); }   // warm the engine up
console.log(`\nThe engagement (${RUNS} seeds each; medians)`);
console.log('scenario                               companies   men      beats   ms a battle   ms a beat');
for (const [name, a, b, f] of [
  ['a skirmish', ...SKIRMISH],
  ['a battle (one side on a ridge)', host(24), held(host(24)), 'ridge'],
  ['a great battle', host(60), host(60), 'open'],
]) {
  const ms = [], beats = [];
  for (let s = 1; s <= RUNS; s++) { const B = makeBattle(s * 7919, a, b, f); const t = performance.now(); fight(B); ms.push(performance.now() - t); beats.push(B.beat); }
  const B0 = makeBattle(1, a, b, f);
  console.log(`${name.padEnd(38)} ${String(B0.n).padStart(6)}   ${String(menOf(a) + menOf(b)).padStart(6)}   ${String(median(beats)).padStart(5)}   ${median(ms).toFixed(3).padStart(9)}     ${(median(ms) / median(beats)).toFixed(4)}`);
}
// the same seed and the same orders are the same battle; one order changed is another battle
{
  const a = host(24), b = held(host(24));
  const h1 = hashOf(fight(makeBattle(4242, a, b, 'ridge'))), h2 = hashOf(fight(makeBattle(4242, a, b, 'ridge')));
  // watched: the beats run one at a time, with a copy of the positions taken for the picture between them
  const Bw = makeBattle(4242, a, b, 'ridge'); let frames = 0; while (!Bw.over) { beat(Bw); Float32Array.from(Bw.x); Float32Array.from(Bw.y); frames++; }
  // the same battle, but A's line is told to stand until an order reaches it at beat 10
  const Bo = makeBattle(4242, a, b, 'ridge'); for (let i = 0; i < Bo.n; i++) if (Bo.side[i] === 0) { Bo.hold[i] = 1; Bo.orders.push([10, i, 'advance']); }
  const h3 = hashOf(fight(Bo));
  console.log(`\nsame seed twice: ${h1} ${h2} ${h1 === h2 ? '(the same battle)' : '(DIFFERENT: a fault)'} · watched beat by beat, ${frames} frames: ${hashOf(Bw)} ${hashOf(Bw) === h1 ? '(the same)' : '(DIFFERENT: a fault)'} · told to stand until beat 10: ${h3} ${h3 !== h1 ? '(another battle)' : '(the same?)'}`);
  const B = fight(makeBattle(4242, a, b, 'ridge'));
  console.log(`its ledger, top three: ${causesOf(B).join('; ')}; winner ${'AB'[B.winner]} after ${B.beat} beats`);
}
// the shape of the rules (not a balance): who wins
console.log('\nThe shape of the rules: wins of ' + RUNS + ' for side A (the constants are guesses; D12b tunes and tests them)');
const tally = (name, a, b, f = 'open') => { let w = 0, bt = 0; for (let s = 1; s <= RUNS; s++) { const B = fight(makeBattle(s * 104729, a, b, f)); if (B.winner === 0) w++; bt += B.beat; } console.log(`  ${name.padEnd(76)} ${String(w).padStart(4)}   (${Math.round(bt / RUNS)} beats)`); };
tally('6 companies of knights charge 8 of archers in the open', [[KNIGHT, 6, 110]], [[ARCHER, 8, 190]]);
tally('the same knights charge 8 companies of spears that stand', [[KNIGHT, 6, 110]], [[SPEAR, 8, 200, 0, 1]]);
tally('8 companies of archers against 8 of spears who must come on', [[ARCHER, 8, 190]], [[SPEAR, 8, 200]]);
tally('8 companies of men-at-arms on foot against 8 of spears', [[FOOT, 8, 180]], [[SPEAR, 8, 200]]);
tally('equal hosts of 24 on open ground (the coin)', host(24), host(24));
tally('equal hosts of 24; A must cross a stream and climb to B, who stands on a ridge', host(24), held(host(24)), 'ridge');
tally('equal hosts of 24 in the open; A one grade of art better', host(24, 1), host(24, 0));
tally('250 order knights against 3,000 levies in the open', [[ORDER, 2, 125]], [[LEVY, 14, 215]]);

// --trace=ridge|knights|spears|bows: one battle told every few beats (for reading the rules, not for the tables)
const tr = (process.argv.find(a => a.startsWith('--trace')) || '').split('=')[1] || (process.argv.includes('--trace') ? 'ridge' : '');
if (tr) {
  const S = {
    ridge: [host(24), held(host(24)), 'ridge'],
    knights: [[[KNIGHT, 6, 110]], [[ARCHER, 8, 190]], 'open'],
    spears: [[[KNIGHT, 6, 110]], [[SPEAR, 8, 200, 0, 1]], 'open'],
    bows: [[[ARCHER, 8, 190]], [[SPEAR, 8, 200]], 'open'],
  }[tr];
  const B = makeBattle(4242, S[0], S[1], S[2]);
  const line = () => [0, 1].map(s => { let m = 0, nv = 0, co = 0, k = 0, st = [0, 0, 0, 0, 0], ym = 0; for (let i = 0; i < B.n; i++) if (B.side[i] === s) { st[B.state[i]]++; if (B.state[i] < 3) { m += B.men[i]; nv += B.nerve[i]; co += B.coh[i]; ym += B.y[i]; k++; } } return `${'AB'[s]} men ${Math.round(m)} nerve ${(nv / (k || 1)).toFixed(2)} order ${(co / (k || 1)).toFixed(2)} y ${Math.round(ym / (k || 1))} states ${st.join('/')}`; }).join('  |  ');
  console.log(`\nA battle (${tr}), beat by beat (states: steady/shaken/wavering/broken/gone)`);
  while (!B.over) { if (B.beat % 4 === 0) console.log(String(B.beat).padStart(3), line()); beat(B); }
  console.log(String(B.beat).padStart(3), line(), ' winner', 'AB'[B.winner], '·', causesOf(B).join('; '));
}

// ---------------------------------------------------------------------------------------------------------------
// 2. the burn
// ---------------------------------------------------------------------------------------------------------------
{
  const GW = 700, GH = 450, N = GW * GH, r = mk(99);
  const land = new Uint8Array(N), own = new Uint8Array(N), ctl = new Uint8Array(N), holdv = new Uint8Array(N), damp = new Uint8Array(N), heat = new Float32Array(N * 2);
  // a stand-in continent: an ellipse of land cut into six pairs of realms at war, each pair split by a wavy border
  let landCells = 0;
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    const i = y * GW + x, ex = (x - 350) / 300, ey = (y - 225) / 190;
    if (ex * ex + ey * ey + 0.08 * Math.sin(x * 0.05) * Math.cos(y * 0.07) < 0.82) { land[i] = 1; landCells++; }
    const band = Math.min(5, (x / 117) | 0), mid = band * 117 + 58 + 14 * Math.sin(y * 0.06 + band);
    own[i] = ctl[i] = land[i] ? (x < mid ? band * 2 + 1 : band * 2 + 2) : 0; holdv[i] = 255;
    damp[i] = 1 + ((Math.sin(x * 0.11) * Math.cos(y * 0.13) + 1) * 1.4 | 0);     // 1 open .. 3 marsh or mountain
  }
  // hosts: three a side in each of six wars; they press forward in summer, fall back in winter, and drift
  const hosts = [];
  for (let w = 0; w < 6; w++) for (let s = 0; s < 2; s++) for (let k = 0; k < 3; k++) hosts.push({ w, s, x: w * 117 + 58 + (s ? 22 : -22), y: 120 + k * 100, str: 4 + 4 * r() });
  let front = new Int32Array(N), next = new Int32Array(N), nf = 0; const mark = new Uint8Array(N);
  const isFront = i => { const c = ctl[i]; if (!c) return false; const e = ((c - 1) ^ 1) + 1; return ctl[i - 1] === e || ctl[i + 1] === e || ctl[i - GW] === e || ctl[i + GW] === e || holdv[i] < 255; };
  for (let i = GW; i < N - GW; i++) if (land[i] && isFront(i)) front[nf++] = i;
  const touched = new Int32Array(N); let nt = 0, weekNo = 0;
  const week = () => {
    // each host's reach: heat falling off with distance and damp, out to 9 cells (a day's ride and a bit)
    for (let k = 0; k < nt; k++) { heat[touched[k] * 2] = 0; heat[touched[k] * 2 + 1] = 0; } nt = 0;
    for (const hst of hosts) {
      const R = 9, x0 = hst.x | 0, y0 = hst.y | 0;
      for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
        const d2 = dx * dx + dy * dy; if (d2 > R * R) continue; const xx = x0 + dx, yy = y0 + dy; if (xx < 1 || yy < 1 || xx >= GW - 1 || yy >= GH - 1) continue;
        const i = yy * GW + xx; if (!land[i]) continue;
        if (!heat[i * 2] && !heat[i * 2 + 1]) touched[nt++] = i;
        heat[i * 2 + hst.s] += hst.str * (1 - Math.sqrt(d2) / (R + 1)) / damp[i];
      }
    }
    // the front creeps: a cell under more enemy heat than its own loses hold; at nothing it changes hands.
    // Held land hardens again; land taken and left with no one to hold it goes back to its owner
    for (let k = 0; k < nf; k++) {
      const i = front[k], c = ctl[i], s = (c - 1) & 1, mine = heat[i * 2 + s], theirs = heat[i * 2 + 1 - s];
      const press = theirs - mine - 0.4 * damp[i];
      if (press > 0) { const hv = holdv[i] - press * 40; if (hv <= 0) { ctl[i] = ((c - 1) ^ 1) + 1; holdv[i] = 24; } else holdv[i] = hv; }
      else if (holdv[i] < 255) { const back = c === own[i] ? 30 : mine > 0.3 ? 12 : -18; const hv = holdv[i] + back; if (hv <= 0) { ctl[i] = own[i]; holdv[i] = 60; } else holdv[i] = Math.min(255, hv); }
    }
    // the next week's front: this week's cells and their neighbours, where they still qualify
    let n2 = 0;
    for (let k = 0; k < nf; k++) { const i = front[k]; for (let q = 0; q < 5; q++) { const j = q === 0 ? i : q === 1 ? i - 1 : q === 2 ? i + 1 : q === 3 ? i - GW : i + GW; if (land[j] && !mark[j] && isFront(j)) { mark[j] = 1; next[n2++] = j; } } }
    for (let k = 0; k < n2; k++) mark[next[k]] = 0;
    const t = front; front = next; next = t; nf = n2;
    const season = Math.sin(weekNo * 2 * Math.PI / 52);
    for (const hst of hosts) { hst.x += (hst.s ? -1 : 1) * (0.9 * season + 0.5 * (r() - 0.35)); hst.y += 1.5 * (r() - 0.5); }
    weekNo++;
  };
  for (let wk = 0; wk < 20; wk++) week();                    // warm up (and let the fronts form)
  const ms = []; let maxFront = 0;
  for (let wk = 0; wk < 156; wk++) { const t = performance.now(); week(); ms.push(performance.now() - t); if (nf > maxFront) maxFront = nf; }
  // the save: the cells whose holder is not their owner, or whose hold is not whole, as runs along rows
  let occ = 0; const runs = [];
  for (let i = 0; i < N;) {
    if (!(land[i] && (ctl[i] !== own[i] || holdv[i] < 255))) { i++; continue; }
    let j = i; const row = (i / GW) | 0, band = holdv[i] >> 5;
    while (j < N && ((j / GW) | 0) === row && land[j] && (ctl[j] !== own[j] || holdv[j] < 255) && ctl[j] === ctl[i] && (holdv[j] >> 5) === band) j++;
    runs.push(i % GW, row, j - i, ctl[i] * 8 + band); occ += j - i; i = j;
  }
  const raw = Buffer.from(new Uint16Array(runs).buffer), gz = zlib.gzipSync(raw).length;
  console.log(`\nThe burn (700 x 450 cells of 10 km, ${landCells} of land; six wars, 36 hosts; 156 weeks)`);
  console.log(`  a week: median ${median(ms).toFixed(3)} ms, 95th ${ms.slice().sort((a, b) => a - b)[Math.floor(ms.length * 0.95)].toFixed(3)} ms · front cells: ${nf} now, ${maxFront} at most · cells not their owner's, or not firmly held: ${occ}`);
  console.log(`  the save: ${runs.length / 4} runs (hold kept in eight steps), ${raw.length} bytes raw, ${gz} bytes gzipped for all six wars (${Math.round(gz / 6)} a war)`);
}

// ---------------------------------------------------------------------------------------------------------------
// 3. the roads
// ---------------------------------------------------------------------------------------------------------------
{
  const r = mk(7), NP = 1224, px = new Float32Array(NP), py = new Float32Array(NP);
  for (let i = 0; i < NP; i++) { px[i] = (i % 36) * 190 + 120 * r(); py[i] = ((i / 36) | 0) * 130 + 90 * r(); }
  const adj = Array.from({ length: NP }, () => []);
  const link = (a, b) => { if (a < 0 || b < 0 || a >= NP || b >= NP || a === b) return; const d = Math.hypot(px[a] - px[b], py[a] - py[b]) * (r() < 0.3 ? 0.7 : 1); adj[a].push([b, d]); adj[b].push([a, d]); };
  for (let i = 0; i < NP; i++) { if (i % 36 < 35 && r() < 0.8) link(i, i + 1); if (r() < 0.75) link(i, i + 36); if (r() < 0.2) link(i, i + 37); }
  const dist = new Float32Array(NP), heapI = new Int32Array(NP * 4), heapD = new Float32Array(NP * 4);
  const search = (from, limit) => {
    dist.fill(Infinity); dist[from] = 0; let hn = 0, seen = 0;
    const push = (i, d) => { let k = hn++; while (k > 0) { const p = (k - 1) >> 1; if (heapD[p] <= d) break; heapD[k] = heapD[p]; heapI[k] = heapI[p]; k = p; } heapD[k] = d; heapI[k] = i; };
    const pop = () => { const i = heapI[0], d = heapD[0]; const li = heapI[--hn], ld = heapD[hn]; let k = 0; for (;;) { let c = 2 * k + 1; if (c >= hn) break; if (c + 1 < hn && heapD[c + 1] < heapD[c]) c++; if (heapD[c] >= ld) break; heapD[k] = heapD[c]; heapI[k] = heapI[c]; k = c; } heapD[k] = ld; heapI[k] = li; return [i, d]; };
    push(from, 0);
    while (hn) { const [i, d] = pop(); if (d > dist[i]) continue; if (d > limit) break; seen++; for (const [j, w] of adj[i]) { const nd = d + w; if (nd < dist[j]) { dist[j] = nd; push(j, nd); } } }
    return seen;
  };
  const edges = adj.reduce((s, a) => s + a.length, 0) / 2, msA = [], msB = [], msC = []; let seenB = 0, seenC = 0;
  for (let k = 0; k < 400; k++) {
    const from = (r() * NP) | 0; let t = performance.now(); search(from, Infinity); msA.push(performance.now() - t);
    t = performance.now(); seenB += search(from, 15 * 25); msB.push(performance.now() - t);
    t = performance.now(); seenC += search(from, 30 * 25); msC.push(performance.now() - t);
  }
  console.log(`\nThe roads (${NP} places, ${edges} roads)`);
  console.log(`  every place from one: median ${median(msA).toFixed(3)} ms · the places within fifteen days' march (375 km; ${Math.round(seenB / 400)} of them): ${median(msB).toFixed(4)} ms · within thirty days' (${Math.round(seenC / 400)}): ${median(msC).toFixed(4)} ms`);
}
