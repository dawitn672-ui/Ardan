// Odds without percentages, and outcomes that are not just dice.
// Three forces decide any attempt:
//   1. Capability vs difficulty (the honest odds, shown as words and a tipped scale).
//   2. Blunders: poor judgment, fatigue and OVERCONFIDENCE make people fail what they should win.
//   3. Surges: will, under real stakes, lets people do what they should not be able to. A surge that
//      wins against long odds can become a breakthrough that raises a limit for good.
import { clamp } from '../../core/engine/rng.js';

const K = 2.45; // one "tier" (x1.5 capability) ~ 73% before blunders/surges; two tiers ~ 88-92%

export function baseEdge(capability, difficulty) { return Math.log(Math.max(1e-6, capability) / Math.max(1e-6, difficulty)) * K; }
const logistic = (x) => 1 / (1 + Math.exp(-x));

export const ODDS_WORDS = [
  [3.2, 'a certainty', 'Nothing short of disaster stops you.'],
  [1.9, 'heavily in your favour', 'You should win this.'],
  [0.8, 'in your favour', 'The edge is yours.'],
  [-0.8, 'evenly matched', 'Either way it could fall.'],
  [-1.9, 'against you', 'You are the lesser here.'],
  [-3.2, 'long odds', 'Only something special will carry this.'],
  [-99, 'hopeless', 'By every measure, you lose.'],
];
export function oddsWords(capability, difficulty) {
  const e = baseEdge(capability, difficulty);
  for (const [t, w, line] of ODDS_WORDS) if (e >= t) return { words: w, line, edge: e, tilt: clamp(e / 4, -1, 1) };
}

// person-like input: { judgment, will, fatigue (0..1), stress (0..1), overconfident?: bool }
export function attempt(rng, { capability, difficulty, judgment = 100, will = 100, fatigue = 0, stakes = 0.5, mood = 0, label = '' }) {
  const edge = baseEdge(capability, difficulty);
  const reasons = [];
  // 1) natural performance: edge + day-to-day variation (logistic noise ~ matches the logistic odds curve)
  const u = rng.next();
  const noise = Math.log(u / (1 - u)); // standard logistic
  let perf = edge + noise;

  // 2) blunder: judgment low, tired, and above all cocky when the odds look good
  const jz = (judgment - 100) / 15;
  const overconf = edge > 1 ? Math.min(1.5, (edge - 1) * 0.5) : 0;
  const pBlunder = clamp(0.025 * Math.exp(-0.7 * jz) * (1 + 1.6 * fatigue) * (1 + overconf), 0.002, 0.35);
  let blundered = false;
  if (rng.chance(pBlunder)) {
    blundered = true; perf -= 2.5 + rng.next() * 2.5;
    reasons.push(overconf > 0.3 ? 'overconfidence' : fatigue > 0.5 ? 'exhaustion' : 'a lapse of judgment');
  }

  // 3) surge: only when it matters and when losing. Will and desperation fuel it. It costs.
  let surged = false, strain = 0;
  if (perf < 0 && stakes > 0.3) {
    const wz = (will - 100) / 15;
    const desperation = clamp(-edge / 3, 0, 1.5);
    const pSurge = clamp(0.022 * Math.exp(0.7 * wz) * (0.5 + stakes) * (0.6 + desperation) * (1 + mood * 0.3), 0, 0.6);
    if (rng.chance(pSurge)) {
      surged = true; const lift = 1.5 + rng.next() * 2.5 + Math.max(0, wz) * 0.5;
      perf += lift; strain = 0.3 + rng.next() * 0.5;
      reasons.push('a surge of will');
    }
  }

  const tier = perf >= 2.5 ? 'triumph' : perf >= 0.6 ? 'success' : perf >= 0 ? 'narrow success' : perf >= -0.6 ? 'narrow failure' : perf >= -2.5 ? 'failure' : 'disaster';
  const success = perf >= 0;
  if (!reasons.length) reasons.push(success ? (edge > 0 ? 'the better hand won' : 'luck and nerve') : (edge < 0 ? 'outmatched' : 'it simply went wrong'));
  // breakthrough: winning by a surge against real odds
  const breakthrough = success && surged && edge < -0.8 ? clamp((-edge) / 2, 0.5, 2) : 0;
  // weight of the deed (feeds renown): beating odds counts far more than winning expected fights
  const deedWeight = success ? Math.exp(Math.max(0, -edge) * 0.9) * (tier === 'triumph' ? 1.6 : 1) : 0;
  return { success, tier, perf, edge, blundered, surged, strain, breakthrough, deedWeight, reasons, label };
}

// Analytic success chance (for tests and AI only — never shown to the player)
export function expectedChance(rng, args, n = 4000) {
  let s = 0; for (let i = 0; i < n; i++) s += attempt(rng, args).success ? 1 : 0; return s / n;
}
export { logistic };
