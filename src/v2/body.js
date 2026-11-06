// The body and mind of a person, in real units that grow from infancy and fade with age.
// Replaces "22 strength out of 100" with: "Lifts 180 kg — about a big hog. Stronger than most soldiers."
import { RACES, heightFraction, physicalMaturity, reactionAgeFactor, mentalMaturity, judgmentAgeBonus } from './races.js';
import { clamp } from './rng.js';

export const PHYS = ['lift', 'sprint', 'march', 'reaction', 'toughness'];
export const MENTAL = ['wits', 'learning', 'judgment', 'will', 'presence', 'cunning'];

// How far ordinary training can take a body (multiplier on the untrained adult value).
// Past this point only breakthroughs (beating the odds under real stakes) raise the ceiling.
export const NATURAL_MAX = { lift: 3.8, sprint: 1.45, march: 2.2, reaction: 1.4, toughness: 2.5 };

export const SKILL_TIERS = [
  [0, 'Untrained'], [30, 'Novice'], [200, 'Apprentice'], [800, 'Journeyman'], [2500, 'Adept'],
  [6000, 'Expert'], [12000, 'Master'], [25000, 'Grandmaster'], [50000, 'Legend'],
];
const SKILL_MULT = [1, 1.15, 1.35, 1.6, 1.95, 2.4, 3.0, 3.8, 4.8];

export const GEAR = {
  none: { name: 'bare hands', mult: 1.0 }, levy: { name: 'spear and padded coat', mult: 1.25 },
  mail: { name: 'mail, sword and shield', mult: 1.6 }, plate: { name: 'plate harness and longsword', mult: 2.0 },
  order: { name: 'order-forged panoply', mult: 2.2 }, club: { name: 'tree-trunk club', mult: 1.2 },
  giantArms: { name: 'giant-forged maul and hide', mult: 1.5 },
};

// ---------- creation & inheritance ----------
export function makeGenes(rng, race, sex, parents = null) {
  const R = RACES[race];
  const g = {};
  const inherit = (key, sd) => {
    if (parents && parents[0] && parents[1]) {
      const mid = (parents[0].genes[key] + parents[1].genes[key]) / 2;
      return mid * 0.6 + 1 * 0.4 + rng.normal(0, sd * 0.75); // regression to the mean
    }
    return 1 + rng.normal(0, sd);
  };
  for (const k of PHYS) g[k] = clamp(inherit(k, 0.12), 0.6, 1.6);
  for (const k of PHYS) g[k + 'Ceil'] = clamp(inherit(k + 'Ceil', 0.1), 0.7, 1.5); // how far training can take you
  const [hm, hs] = R.height[sex];
  if (parents && parents[0] && parents[1]) {
    const pz = parents.map((p) => (p.genes.heightZ ?? 0));
    g.heightZ = (pz[0] + pz[1]) / 2 * 0.65 + rng.normal(0, 0.75);
  } else g.heightZ = rng.normal(0, 1);
  g.adultHeight = hm + g.heightZ * hs;
  g.build = clamp(1 + rng.normal(0, 0.08), 0.8, 1.3);
  for (const k of MENTAL) {
    const base = R.mental[k];
    if (parents && parents[0] && parents[1]) g[k] = (parents[0].genes[k] + parents[1].genes[k]) / 2 * 0.5 + base * 0.5 + rng.normal(0, 11);
    else g[k] = base + rng.normal(0, 15);
  }
  g.aptitude = {}; // talent per skill family, 0.5..2 (multiplies practice)
  for (const fam of ['blade', 'spear', 'bow', 'horse', 'command', 'letters', 'trade', 'craft', 'faith', 'healing', 'stealth', 'speech']) {
    g.aptitude[fam] = clamp(Math.exp(rng.normal(0, 0.3)), 0.5, 2);
  }
  return g;
}

export function newBody() {
  // conditioning per physical attribute (1 = untrained), ceilings, breakthroughs, skills (practice hours)
  return { cond: { lift: 1, sprint: 1, march: 1, reaction: 1, toughness: 1 }, ceilBoost: { lift: 1, sprint: 1, march: 1, reaction: 1, toughness: 1 },
    breakthroughs: [], skills: {}, wounds: [], knowledge: 0 };
}

// ---------- current values ----------
export function ceiling(person, attr) {
  return NATURAL_MAX[attr] * person.genes[attr + 'Ceil'] * person.body.ceilBoost[attr];
}

export function stats(person, age = person.age) {
  const R = RACES[person.race], g = person.genes, b = person.body, sex = person.sex;
  const mat = physicalMaturity(person.race, age);
  const sf = sex === 'female' ? R.sexFactor : { lift: 1, sprint: 1, march: 1, toughness: 1 };
  const woundMult = woundFactor(b.wounds);
  const height = g.adultHeight * heightFraction(person.race, sex, age);
  const bmiAge = age < R.adultAge ? R.bmi * (0.72 + 0.28 * Math.min(1, age / R.adultAge)) : R.bmi;
  const weight = bmiAge * g.build * (height / 100) ** 2 * (1 + (b.cond.lift - 1) * 0.08);
  const c = b.cond;
  const s = {
    height: Math.round(height), weight: Math.round(weight),
    lift: R.base.lift * sf.lift * g.lift * mat * c.lift * woundMult.lift,
    sprint: R.base.sprint * sf.sprint * g.sprint * Math.sqrt(mat) * (1 + (c.sprint - 1)) * woundMult.speed,
    march: R.base.march * sf.march * g.march * mat * c.march * woundMult.speed,
    reaction: R.base.reaction / (g.reaction * c.reaction) * reactionAgeFactor(person.race, age),
    toughness: R.base.toughness * sf.toughness * g.toughness * (0.3 + 0.7 * mat) * c.toughness,
  };
  s.lift = Math.min(s.lift, R.limit.lift); s.sprint = Math.min(s.sprint, R.limit.sprint);
  s.march = Math.min(s.march, R.limit.march); s.reaction = Math.max(s.reaction, R.limit.reaction);
  s.toughness = Math.min(s.toughness, R.limit.toughness);
  const mm = mentalMaturity(person.race, age);
  for (const k of MENTAL) s[k] = g[k] * (k === 'judgment' ? 1 : mm) + (k === 'judgment' ? judgmentAgeBonus(person.race, age) : 0) + (person.mentalXp?.[k] ?? 0);
  return s;
}

function woundFactor(wounds = []) {
  let lift = 1, speed = 1;
  for (const w of wounds) { if (w.kind === 'arm') lift *= 0.7; if (w.kind === 'hand') lift *= 0.55; if (w.kind === 'leg') speed *= 0.7; if (w.kind === 'knee') speed *= 0.82; }
  return { lift, speed };
}

// ---------- skills ----------
export function skillTier(person, skill) {
  const hrs = person.body.skills[skill] ?? 0;
  let t = 0; for (let i = 0; i < SKILL_TIERS.length; i++) if (hrs >= SKILL_TIERS[i][0]) t = i;
  return t;
}
export function skillInfo(person, skill) {
  const hrs = person.body.skills[skill] ?? 0, t = skillTier(person, skill);
  const next = SKILL_TIERS[t + 1];
  return { tier: t, name: SKILL_TIERS[t][1], hours: Math.round(hrs), nextName: next?.[1] ?? null, toNext: next ? Math.max(0, Math.round(next[0] - hrs)) : 0 };
}
export const SKILL_FAMILY = { sword: 'blade', axe: 'blade', spear: 'spear', polearm: 'spear', bow: 'bow', riding: 'horse', tactics: 'command', leadership: 'command',
  letters: 'letters', law: 'letters', trade: 'trade', smithing: 'craft', theology: 'faith', medicine: 'healing', stealth: 'stealth', persuasion: 'speech', intrigue: 'speech' };

// Learn by doing: hours practised, scaled by talent and by the learner's age (children learn fast, elders slow).
export function practise(person, skill, hours) {
  const fam = SKILL_FAMILY[skill] ?? 'craft';
  const apt = person.genes.aptitude[fam] ?? 1;
  const a = person.age;
  const ageF = a < 6 ? 0.4 : a < 25 ? 1.25 : a < 45 ? 1 : a < 65 ? 0.75 : 0.5;
  const witsF = 0.75 + (stats(person).wits - 70) / 120;
  person.body.skills[skill] = (person.body.skills[skill] ?? 0) + hours * apt * ageF * clamp(witsF, 0.5, 1.6);
}

// Conditioning: a month of physical work moves each attribute toward its ceiling, slower near the top.
export function train(person, attr, intensity /* 0..1 */) {
  const c = person.body.cond[attr], cap = ceiling(person, attr);
  const youth = physicalMaturity(person.race, person.age) < 0.5 ? 0.3 : 1; // children grow by doing, not by drilling
  const gain = 0.035 * intensity * youth * Math.max(0, (cap - c) / cap);
  person.body.cond[attr] = Math.min(cap, c + gain * c);
  return person.body.cond[attr] - c;
}
// Idle bodies lose conditioning slowly.
export function detrain(person, attr, months = 1) {
  const c = person.body.cond[attr];
  person.body.cond[attr] = Math.max(1, c - (c - 1) * 0.02 * months);
}

// A breakthrough: beating real odds under real stakes raises a ceiling for good.
export function breakthrough(person, attr, magnitude = 1, note = '') {
  const boost = 1 + 0.12 * magnitude;
  person.body.ceilBoost[attr] *= boost;
  person.body.cond[attr] *= 1 + 0.05 * magnitude; // the moment itself leaves you changed
  person.body.breakthroughs.push({ attr, magnitude, age: person.age, note });
}

// ---------- fighting worth (in "levies": one untrained spearman in a padded coat = 1) ----------
export function fightingWorth(person, weaponSkill = 'sword', gearKey = person.gear ?? 'none') {
  const s = stats(person);
  const might = s.lift / 130, speed = (s.sprint / 7.2) * (250 / s.reaction), tough = s.toughness;
  const tier = skillTier(person, weaponSkill);
  const gear = GEAR[gearKey]?.mult ?? 1;
  const parts = { body: Math.pow(might, 0.5) * Math.pow(speed, 0.5) * Math.pow(tough, 0.6), skill: SKILL_MULT[tier], gear };
  return { worth: 0.662 * parts.body * parts.skill * parts.gear, parts, tier };
}

// ---------- descriptions in words and real-world comparisons ----------
// Things of a known weight. None is a person: "lifts about a grown man" read as a comparison of strength and contradicted
// the rank beside it (playtest 2: "lifts 92 kg — about a grown man; below most grown men").
const LIFT_REF = [[0, 'a loaf of bread'], [2, 'a hen'], [5, 'a goose'], [10, 'a pail of water'], [20, 'a sack of flour'], [45, 'a sack of grain'],
  [80, 'a small cask of ale'], [140, 'a big hog'], [250, 'a blacksmith\'s anvil'],
  [400, 'a draught pony'], [650, 'a warhorse'], [1000, 'an ox'], [1800, 'a laden hay wagon'], [3000, 'a war galley\'s anchor'], [6000, 'a felled oak']];
const SPRINT_REF = [[2.5, 'a toddler'], [4.5, 'a child'], [6.5, 'most people'], [8.5, 'a trained runner'], [10.5, 'a hunting dog'], [13, 'a galloping horse'], [17, 'a stooping hawk\'s shadow'], [99, 'anything on legs']];
const MARCH_REF = [[0, 'only a short way'], [12, 'a short day\'s walk'], [22, 'as far as a pilgrim'], [30, 'as far as a levy'], [40, 'like a veteran on a forced march'], [55, 'like a ranger'], [80, 'like a relay of couriers, alone'], [999, 'beyond belief']];

// The yardstick a young body is held to: an ordinary, untrained body of the same race, sex and age.
export function typicalStats(person, age = person.age) {
  const genes = { ...person.genes, lift: 1, sprint: 1, march: 1, reaction: 1, toughness: 1, build: 1 };
  return stats({ ...person, genes, body: newBody(), mentalXp: {} }, age);
}
// A child is compared with others of its age and people, never with grown men (playtest 2: "lifts 8 kg ... far below a
// grown man" at 1, "runs as fast as a toddler" at 10). r = this body / a typical one of the same age (for reaction,
// the typical time / this time, so higher is better everywhere).
const PEER = {
  lift: ['much weaker than others your age', 'weaker than most your age', 'as strong as most your age', 'stronger than most your age', 'stronger than anyone your age for miles'],
  sprint: ['much slower than others your age', 'slower than most your age', 'as fast as most your age', 'faster than most your age', 'faster than anyone your age for miles'],
  march: ['tires long before others your age', 'tires sooner than most your age', 'walks as far as most your age', 'walks farther than most your age', 'outwalks anyone your age'],
  reaction: ['much slower to react than others your age', 'slower to react than most your age', 'reacts like most your age', 'quicker than most your age', 'quicker than anyone your age'],
  toughness: ['far frailer than others your age', 'frailer than most your age', 'as hardy as most your age', 'hardier than most your age', 'hardier than anyone your age'],
};
const PEER_TOUGH = ['frail', 'slight', 'ordinary', 'hardy', 'sturdy'];
const peerBand = r => (r < 0.7 ? 0 : r < 0.9 ? 1 : r < 1.12 ? 2 : r < 1.45 ? 3 : 4);
export function peerWords(attr, r) { return PEER[attr][peerBand(r)]; }

export function describe(person) {
  const s = stats(person), R = RACES[person.race];
  const age = person.realAge ?? person.age, minor = age < R.adultAge;
  const pick = (ref, v) => { let r = ref[0][1]; for (const [t, w] of ref) if (v >= t) r = w; return r; };
  const out = {
    height: `${s.height} cm`, weight: `${s.weight} kg`,
    lift: { value: `${Math.round(s.lift)} kg`, words: `can lift about ${pick(LIFT_REF, s.lift)}`, rank: rankAgainst(s.lift, 'lift', person) },
    sprint: { value: `${s.sprint.toFixed(1)} m/s`, words: `runs as fast as ${pick(SPRINT_REF, s.sprint)}` },
    march: { value: `${Math.round(s.march)} km a day`, words: `marches ${pick(MARCH_REF, s.march)}` },
    reaction: { value: `${Math.round(s.reaction)} ms`, words: s.reaction < 95 ? 'can pluck an arrow from the air' : s.reaction < 150 ? 'sees a blow before it is thrown' : s.reaction < 210 ? 'quick as a cat' : s.reaction < 300 ? 'ordinary reflexes' : 'slow to react' },
    toughness: { value: s.toughness < 0.7 ? 'fragile' : s.toughness < 1.4 ? 'ordinary' : s.toughness < 3 ? 'hardy' : s.toughness < 8 ? 'iron-hard' : 'like a giant', words: s.toughness < 0.7 ? 'a hard blow could kill you' : s.toughness < 1.4 ? 'falls to a blow that fells any man' : `takes ${Math.round(s.toughness)} blows that would fell an ordinary man` },
  };
  if (minor) {
    const t = typicalStats(person, person.age), r = (a) => (a === 'reaction' ? t.reaction / s.reaction : s[a] / Math.max(1e-6, t[a]));
    out.lift.rank = peerWords('lift', r('lift'));
    out.sprint.words = peerWords('sprint', r('sprint'));
    out.march.words = peerWords('march', r('march'));
    out.reaction.words = peerWords('reaction', r('reaction'));
    out.toughness = { value: PEER_TOUGH[peerBand(r('toughness'))], words: peerWords('toughness', r('toughness')) };
    out.peers = true;
  }
  const young = age < 6, mm = mentalMaturity(person.race, age);
  for (const k of MENTAL) {
    if (young) { out[k] = { words: 'too young to tell', rarity: '', score: 0 }; continue; }
    // a child's mind against children's: the growth of the mind (and judgment's years) taken out, so a bright child of
    // six is not "witless, worse than all but 1 in 400" for not yet thinking like a grown man
    const v = !minor ? s[k] : k === 'judgment' ? s[k] - judgmentAgeBonus(person.race, age) : s[k] / Math.max(0.05, mm);
    out[k] = mindWords(v, k, minor);
  }
  out.raceNote = R.name;
  return out;
}

const BASE_ADULT_MALE_HUMAN = { lift: 130, sprint: 7.2, march: 28, reaction: 1 / 250, toughness: 1 };
const SPREAD = { lift: 1, march: 1.3, sprint: 3, reaction: 2.2 }; // speed varies less between people than strength
export function rankAgainst(v, attr, person) {
  // compared with an ordinary grown man of the realm (humans are the yardstick the world uses)
  const r = Math.pow(v / BASE_ADULT_MALE_HUMAN[attr], SPREAD[attr] ?? 1);
  if (r < 0.35) return 'far below a grown man';
  if (r < 0.8) return 'below most grown men';
  if (r < 1.25) return 'like most grown men';
  if (r < 1.8) return 'better than most soldiers';
  if (r < 3) return 'among the best in a province';
  if (r < 5) return 'spoken of across the realm';
  if (r < 10) return 'beyond any ordinary human';
  return 'giant-class';
}

const MIND_WORDS = {
  wits: ['witless', 'dull', 'slow', 'ordinary', 'quick', 'sharp', 'brilliant', 'one of the great minds of the age'],
  learning: ['cannot hold a lesson', 'forgetful', 'unlettered memory', 'ordinary memory', 'retentive', 'deeply read', 'a living library', 'remembers everything'],
  judgment: ['reckless fool', 'rash', 'impulsive', 'ordinary sense', 'level-headed', 'shrewd', 'wise', 'sage'],
  will: ['broken reed', 'faint-hearted', 'wavering', 'steady enough', 'determined', 'iron-willed', 'unbreakable', 'will that bends the world'],
  presence: ['repellent', 'awkward', 'forgettable', 'pleasant', 'engaging', 'commanding', 'magnetic', 'men would die for a word'],
  cunning: ['guileless', 'naive', 'trusting', 'street-wise', 'wily', 'devious', 'serpentine', 'spider at the heart of every web'],
};
// The word and the rarity read the same band: "wavering" is never "like most people" (playtest 2). Within half a standard
// deviation is the ordinary word and "like most"; half to one is the next word and "better / worse than most"; past one,
// "1 in N". peers: the person is young and compared with others of their age.
export function mindWords(v, k, peers = false) {
  const z = (v - 100) / 15;
  const i = clamp(Math.floor(z + 3.5), 0, 7);
  const who = peers ? ' your age' : ' people', tail = peers ? ' your age' : '';
  const rarity = z >= 1 ? `better than all but 1 in ${oneIn(z)}${tail}` : z >= 0.5 ? `better than most${who}` : z >= -0.5 ? `like most${who}`
    : z > -1 ? `worse than most${who}` : `worse than all but 1 in ${oneIn(-z)}${tail}`;
  return { words: MIND_WORDS[k][i], rarity, score: Math.round(v) };
}
function oneIn(z) {
  // upper tail of a normal distribution -> "1 in N"
  const p = 0.5 * erfc(z / Math.SQRT2);
  const n = 1 / p;
  return n < 20 ? Math.round(n) : n < 1000 ? Math.round(n / 10) * 10 : n < 10000 ? Math.round(n / 100) * 100 : 'ten thousand';
}
function erfc(x) { const t = 1 / (1 + 0.5 * Math.abs(x)); const y = t * Math.exp(-x * x - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277))))))))); return x >= 0 ? y : 2 - y; }
