// Succession is decided by the house's own law and the family as it actually is.
// Nobody "chooses to be the heir": your place comes from your elder siblings, their sex,
// whether the house will pass over someone it judges unfit, and how the line runs.
import { stats } from './body.js';

export const LAWS = {
  'male-preference': { name: 'Male-preference primogeniture', text: 'The eldest son inherits; daughters only if there are no sons.' },
  'absolute': { name: 'Absolute primogeniture', text: 'The eldest child inherits, son or daughter.' },
  'agnatic': { name: 'Agnatic primogeniture', text: 'Only men, and only through men, may inherit.' },
  'seniority': { name: 'Seniority', text: 'The eldest living member of the house inherits.' },
  'elective': { name: 'House election', text: 'The house elders choose the ablest of the eligible kin.' },
};
// fitness: 'none' = the law is the law. 'unfit-passed-over' = the house council may pass over an heir judged unfit.
export function makeHouseLaw(rng, culture = {}) {
  const law = culture.law ?? rng.weighted(Object.keys(LAWS), (k) => ({ 'male-preference': 6, absolute: 1.5, agnatic: 2, seniority: 1, elective: 1 })[k]);
  const fitness = culture.fitness ?? (rng.chance(0.4) ? 'unfit-passed-over' : 'none');
  return { law, fitness };
}

export function unfitReason(people, p, year) {
  if (p.deathYear != null) return 'dead';
  if (p.vows) return 'took holy vows';
  if (p.disinherited) return 'disinherited';
  const age = year - p.birthYear;
  if (p.traits?.includes('craven')) return 'branded craven';
  if (p.traits?.includes('sickly') && age > 16) return 'too sickly to rule';
  // a host game may judge wits itself (a person without v2 genes)
  if (p.judgedSimple) return 'judged simple by the house council';
  if (!p.genes || age < 14) return null; // too young to judge
  const s = stats({ ...p, age });
  if (s.wits < 72 && s.judgment < 75) return 'judged simple by the house council';
  return null;
}

// Line of succession for `holder` under `houseLaw`. Returns ordered entries with reasons and skipped people.
export function lineOfSuccession(people, holder, houseLaw, year, limit = 10) {
  const { law, fitness } = houseLaw;
  const alive = (p) => p.deathYear == null;
  const eligibleSex = (p, viaMale) => law === 'agnatic' ? p.sex === 'male' && viaMale : true;
  const sortKids = (kids) => {
    const byAge = kids.slice().sort((a, b) => a.birthYear - b.birthYear || a.id - b.id);
    if (law === 'male-preference') return [...byAge.filter((k) => k.sex === 'male'), ...byAge.filter((k) => k.sex !== 'male')];
    if (law === 'agnatic') return byAge.filter((k) => k.sex === 'male');
    return byAge;
  };
  const legit = (k) => !k.bastard || k.legitimized;
  const out = [], skipped = [];
  const consider = (p, why) => {
    if (out.length >= limit || out.some((o) => o.person.id === p.id) || p.id === holder.id) return;
    const bad = unfitReason(people, p, year);
    if (bad === 'dead') return;
    if (bad && (bad !== 'judged simple by the house council' && bad !== 'branded craven' && bad !== 'too sickly to rule' || fitness === 'unfit-passed-over')) { skipped.push({ person: p, why: bad }); return; }
    out.push({ person: p, why });
  };

  if (law === 'seniority' || law === 'elective') {
    // all living adult members of the house (by blood), eldest first; election re-ranks by ability
    const members = people.all().filter((p) => p.house === holder.house && alive(p) && p.id !== holder.id && legit(p) && year - p.birthYear >= 16);
    let ranked = members.sort((a, b) => a.birthYear - b.birthYear);
    if (law === 'elective') {
      const ability = (p) => { if (p.ability != null) return p.ability; const s = stats({ ...p, age: year - p.birthYear }); return s.wits + s.judgment + s.presence + (p.renown ?? 0) * 0.5; };
      ranked = members.slice().sort((a, b) => ability(b) - ability(a));
      ranked.forEach((p, i) => consider(p, i === 0 ? 'favoured by the house elders' : 'candidate before the elders'));
    } else ranked.forEach((p) => consider(p, 'eldest living member of the house'));
    return { law: LAWS[law], fitness, line: out, skipped };
  }

  // primogeniture family: depth-first through the holder's descendants, then up to siblings' lines, etc.
  const visit = (p, viaMale, rel) => {
    for (const k of sortKids(people.children(p).filter(legit))) {
      const km = viaMale && (k.sex === 'male');
      if (eligibleSex(k, viaMale)) consider(k, `${rel(k)}`);
      visit(k, law === 'agnatic' ? km : true, (x) => `${x.sex === 'male' ? 'son' : 'daughter'} of ${k.name}`);
      if (out.length >= limit) return;
    }
  };
  const birthOrder = (k) => {
    const sibs = sortKids(people.children(holder).filter(legit));
    const i = sibs.findIndex((s) => s.id === k.id);
    const word = ['eldest', 'second', 'third', 'fourth', 'fifth', 'sixth'][i] ?? `${i + 1}th`;
    return `${word} ${law === 'male-preference' && k.sex !== 'male' ? 'daughter (sons come first)' : k.sex === 'male' ? 'son' : 'daughter'}`;
  };
  visit(holder, true, birthOrder);
  // then the holder's father's other descendants (siblings and their lines), then grandfather's
  let anc = people.get(holder.fatherId) ?? people.get(holder.motherId), hops = 0;
  while (anc && out.length < limit && hops < 3) {
    for (const sib of sortKids(people.children(anc).filter(legit))) {
      if (sib.id === holder.id) continue;
      if (eligibleSex(sib, true)) consider(sib, hops === 0 ? `${holder.name}'s ${sib.sex === 'male' ? 'brother' : 'sister'}` : `cousin line of ${anc.name}`);
      visit(sib, law === 'agnatic' ? sib.sex === 'male' : true, (x) => `${x.sex === 'male' ? 'son' : 'daughter'} of ${sib.name}`);
    }
    anc = people.get(anc.fatherId) ?? people.get(anc.motherId); hops++;
  }
  return { law: LAWS[law], fitness, line: out, skipped };
}

// One sentence for the player: where do I stand?
export function myPlace(people, me, holder, houseLaw, year) {
  const r = lineOfSuccession(people, holder, houseLaw, year, 25);
  const i = r.line.findIndex((e) => e.person.id === me.id);
  const sk = r.skipped.find((e) => e.person.id === me.id);
  if (sk) return { place: null, text: `You are passed over: ${sk.why}.`, ...r };
  if (i < 0) return { place: null, text: `Under ${r.law.name.toLowerCase()} you are not in line for ${holder.titles?.[0] ?? 'the title'}.`, ...r };
  if (i === 0) return { place: 1, text: `You are heir to ${holder.titles?.[0] ?? 'the house'} (${r.line[0].why}).`, ...r };
  const ahead = r.line.slice(0, i).map((e) => e.person.name).join(', ');
  return { place: i + 1, text: `You are ${ordinal(i + 1)} in line. Ahead of you: ${ahead}.`, ...r };
}
const ordinal = (n) => n + (['th', 'st', 'nd', 'rd'][(n % 100 - 20) % 10] || ['th', 'st', 'nd', 'rd'][n % 100] || 'th');
