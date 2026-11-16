// Fame and promotion are never linear. Renown is the weighted memory of deeds, where one deed that beat
// the odds in front of the right witnesses outweighs years of competent service. Promotion is a monthly
// hazard driven by vacancies, recent standout deeds and patrons, so it can come twice in a year or not for a decade.
import { clamp } from './rng.js';

const WITNESS = { alone: 0.3, comrades: 1, company: 1.6, army: 3, court: 4, realm: 6 };

export function recordDeed(person, { weight, witnesses = 'comrades', year, month, text, field = 'war' }) {
  person.deeds ??= [];
  const w = weight * (WITNESS[witnesses] ?? 1);
  person.deeds.push({ w, year, month, text, field });
  return w;
}

// Renown in a field: heavy weight on the best few deeds, gentle fading over years.
export function renown(person, year, field = null) {
  const ds = (person.deeds ?? []).filter((d) => !field || d.field === field);
  const faded = ds.map((d) => d.w * Math.pow(0.88, Math.max(0, year - d.year))).sort((a, b) => b - a);
  // best deed counts fully, the next ones less and less (a lifetime of small deeds saturates)
  let s = 0; faded.forEach((w, i) => { s += w / (1 + i * 0.6); });
  return s;
}

export const RENOWN_WORDS = [[0, 'unknown'], [3, 'known to your comrades'], [8, 'known in your company'], [18, 'talked about in camp'], [40, 'known across the province'], [90, 'a name in the realm'], [200, 'famous'], [500, 'a living legend']];
export function renownWords(v) { let w = RENOWN_WORDS[0][1]; for (const [t, x] of RENOWN_WORDS) if (v >= t) w = x; return w; }

// Monthly promotion check. ladder: array of rank names; vacancy: 0..1 how open the next post is.
export function promotionCheck(rng, person, { year, month, ladder, vacancy = 0.3, patron = 0 }) {
  const r = person.rankIndex ?? 0; if (r >= ladder.length - 1) return null;
  const recent = (person.deeds ?? []).filter((d) => (year - d.year) * 12 + (month - (d.month ?? 0)) <= 18);
  const standout = recent.reduce((m, d) => Math.max(m, d.w), 0);
  const steady = Math.min(1, recent.length / 6);
  const needed = 2.5 * Math.pow(2.1, r); // each rank asks for a much bigger standout deed
  const merit = standout / needed;
  const hazard = clamp(0.004 + vacancy * (0.02 * steady + 0.35 * merit * merit) + patron * 0.02, 0, 0.9);
  if (rng.chance(hazard)) {
    const jump = merit > 3 && rng.chance(0.3) ? 2 : 1; // an extraordinary deed can skip a rank
    person.rankIndex = Math.min(ladder.length - 1, r + jump);
    return { from: ladder[r], to: ladder[person.rankIndex], jump, why: merit > 1 ? `for ${recent.sort((a, b) => b.w - a.w)[0]?.text ?? 'your deeds'}` : patron > 0.5 ? 'through your patron' : 'a post fell open and you were next' };
  }
  return null;
}
