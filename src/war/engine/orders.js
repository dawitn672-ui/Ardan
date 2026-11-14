// Elite orders: few, small, and terrifying. Each member is worth tens of ordinary soldiers.
// The world holds a handful (default 5). Each keeps 150-350 sworn members and fields the strength
// of an army ten to thirty times its size. Joining means surviving trials that most fail.
import { makeRng } from '../../core/engine/rng.js';

export const ORDER_TEMPLATES = [
  { name: 'The Ashen Vigil', creed: 'Hold the line where kingdoms end.', style: 'heavy foot', weapon: 'polearm', recruits: 'any', trialSkill: 'polearm' },
  { name: 'Riders of the Pale Lance', creed: 'Strike once, strike first.', style: 'shock cavalry', weapon: 'spear', recruits: 'noble', trialSkill: 'riding' },
  { name: 'The Quiet Knives', creed: 'Be the war no one sees.', style: 'infiltrators', weapon: 'sword', recruits: 'any', trialSkill: 'stealth' },
  { name: 'Order of the Iron Psalm', creed: 'Faith is a blade.', style: 'warrior-monks', weapon: 'sword', recruits: 'clergy', trialSkill: 'theology' },
  { name: 'The Long Watch of Tusk', creed: 'The steppe remembers.', style: 'horse archers', weapon: 'bow', recruits: 'orc', trialSkill: 'bow' },
];

export function makeOrders(realms, seed, count = 5) {
  const rng = makeRng(`${seed}:orders`);
  return rng.shuffle(ORDER_TEMPLATES).slice(0, count).map((t, i) => {
    const members = rng.int(150, 350);
    const avgWorth = rng.float(14, 26); // in levies; see body.fightingWorth calibration
    return { id: i, ...t, members, avgWorth, patron: rng.pick(realms).id, renown: rng.int(60, 200),
      strengthInLevies: Math.round(members * avgWorth), terror: 0.25 + rng.next() * 0.2, // morale shock dealt to foes
      ranks: ['Aspirant', 'Sworn Brother', 'Blade', 'Captain of the Order', 'Marshal of the Order', 'Grand Master'] };
  });
}

// Trials: three hard attempts; most applicants fail one. Uses the odds engine.
export function trial(rng, attemptFn, applicant, order) {
  const steps = [
    { label: 'the endurance march', cap: applicant.capability.march, diff: 55 },
    { label: `the ${order.weapon} trial`, cap: applicant.capability.worth, diff: 9 },
    { label: 'the oath night', cap: applicant.capability.will, diff: 115 },
  ];
  const results = steps.map((s) => ({ ...attemptFn(rng, { capability: s.cap, difficulty: s.diff, judgment: applicant.judgment, will: applicant.will, stakes: 0.9 }), label: s.label }));
  return { passed: results.every((r) => r.success), results };
}
