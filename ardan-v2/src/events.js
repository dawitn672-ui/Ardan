// Event pool (demo-sized). Rules every event follows:
//  - text <= 80 words, choices <= 12 words; everything you need is ON the card (no click-for-description)
//  - no forced storylines: events offer, never railroad; religion appears only for the devout or clergy-born
//  - choices that test you use the odds engine and show odds in words, never percentages
//  - many events remember earlier choices (memories) so your past comes back
import { stats, fightingWorth, practise, train, breakthrough } from './body.js';
import { attempt, oddsWords } from './odds.js';
import { recordDeed } from './renown.js';
import { trial } from './orders.js';

const hasMem = (me, key) => me.memories.some((m) => m.key === key);
const remember = (ctx, key, text) => { ctx.me.memories.push({ key, text, year: ctx.world.year, month: ctx.world.month }); };
const they = (p) => (p.sex === 'female' ? 'she' : 'he');

export const EVENTS = [
  { id: 'first-steps', stage: [1, 2], once: true, weight: 5,
    text: (c) => `${c.me.name} takes ${c.me.sex === 'female' ? 'her' : 'his'} first wobbling steps across the ${c.me.estate === 'commoner' ? 'cottage' : 'hall'} floor. ${c.mother?.name ?? 'Your mother'} laughs; ${c.father?.name ?? 'your father'} pretends not to watch.`,
    choices: [{ label: 'Totter toward your father', fx: (c) => { remember(c, 'toward-father', 'Toddled first to your father'); return 'You fall into his arms. He will remember it.'; } },
      { label: 'Totter toward your mother', fx: (c) => { remember(c, 'toward-mother', 'Toddled first to your mother'); return 'She sweeps you up, laughing.'; } }] },
  { id: 'climb-tree', stage: [5, 11], weight: 3,
    text: (c) => `The old oak behind the ${c.me.estate === 'commoner' ? 'church' : 'stables'}. Older children dare you to reach the high fork.`,
    choices: [
      { label: 'Climb to the fork', check: (c) => ({ capability: stats(c.me).lift / 30 + stats(c.me).sprint / 3, difficulty: 3.2 }),
        fx: (c, r) => { train(c.me, 'lift', 0.4); if (r.success) remember(c, 'oak', 'Reached the high fork of the oak'); else if (r.tier === 'disaster') c.me.body.wounds.push({ kind: 'arm', year: c.world.year, healed: false }); return r.success ? 'You sit in the fork, the whole estate below you.' : r.tier === 'disaster' ? 'A branch snaps. Your arm is broken.' : 'You slip halfway and slide down, scraped and laughed at.'; } },
      { label: 'Refuse. Oaks are for squirrels', fx: () => 'They call you a coward for a week, then forget.' }] },
  { id: 'lessons', stage: [6, 14], weight: 3,
    text: (c) => `A travelling tutor offers letters and numbers for a season, if the family pays.`,
    choices: [{ label: 'Beg to learn', fx: (c) => { practise(c.me, 'letters', 120); return 'By spring you can read a charter, slowly.'; } },
      { label: 'Spend the season outdoors', fx: (c) => { train(c.me, 'march', 0.6); train(c.me, 'sprint', 0.5); return 'You know every path in three valleys.'; } }] },
  { id: 'cousin-visit', stage: [6, 16], weight: 2.5, need: (c) => c.cousins.length > 0,
    text: (c) => { const k = c.pick(c.cousins); c.tmp.k = k; return `Your ${k.relation}, ${k.person.name}${k.why.length ? ', ' + k.why.join(', ') : ''}, comes to stay for the summer.`; },
    choices: [{ label: 'Make a friend of them', fx: (c) => { c.bonds.set(c.me.id, c.tmp.k.person.id, { kind: 'friend', since: c.world.year }); remember(c, 'cousin-friend-' + c.tmp.k.person.id, `Befriended ${c.tmp.k.person.name}`); return c.me.sex === 'female' && c.tmp.k.person.sex === 'female' ? 'By autumn you swear to be sisters forever.' : c.me.sex === 'male' && c.tmp.k.person.sex === 'male' ? 'By autumn you swear to be sworn-brothers forever.' : 'By autumn you are inseparable.'; } },
      { label: 'Outdo them at everything', check: (c) => ({ capability: fightingWorth(c.me).worth, difficulty: 0.25 }), fx: (c, r) => { if (!r.success) { c.bonds.set(c.me.id, c.tmp.k.person.id, { kind: 'rival', since: c.world.year }); return `They beat you at wrestling, running and riddles. You will not forget it.`; } return 'You win most contests. They go home sulking.'; } }] },
  { id: 'arms-master', stage: [10, 17], weight: 2.5,
    text: (c) => c.me.estate === 'commoner' ? `Old Tam, who marched in two wars, offers to teach you the spear behind the mill at dawn.` : `The household's master-at-arms, a scarred veteran, offers to drill you at dawn.`,
    choices: [{ label: 'Train hard every dawn', fx: (c) => { practise(c.me, 'sword', 260); train(c.me, 'lift', 1); train(c.me, 'toughness', 0.8); remember(c, 'drilled', 'Drilled at dawn by the master-at-arms'); return 'Your hands blister, then harden.'; } },
      { label: 'Train when it suits you', fx: (c) => { practise(c.me, 'sword', 80); return 'You learn the guards, if not the habit.'; } }] },
  { id: 'brawl', stage: [14, 40], weight: 2,
    text: (c) => `A drunk ${c.pick(['carter', 'mercenary', 'miller\'s son'])} in the tavern shoves you and calls you a soft-handed fool.`,
    choices: [
      { label: 'Knock him down', check: (c) => ({ capability: fightingWorth(c.me, 'sword', 'none').worth, difficulty: 0.75 }),
        fx: (c, r) => { if (r.success) recordDeed(c.me, { weight: r.deedWeight * 0.3, witnesses: 'comrades', year: c.world.year, month: c.world.month, text: 'flattening a tavern bully', field: 'arms' }); return r.success ? (r.surged ? 'Something rises in you. He goes down and stays down.' : 'One blow. The tavern cheers.') : r.blundered ? 'You swing wide, slip on spilled ale and wake on the floor.' : 'He is stronger than he looked. You leave with a split lip.'; } },
      { label: 'Laugh it off and buy him a drink', check: (c) => ({ capability: stats(c.me).presence, difficulty: 95 }), fx: (c, r) => r.success ? 'He decides he likes you.' : 'He throws the drink in your face.' }] },
  { id: 'faith-call', stage: [12, 60], weight: 1, need: (c) => c.me.devout || c.me.clergyBorn,
    text: (c) => `The abbess asks whether you will serve at the vigil of the saints.`,
    choices: [{ label: 'Serve the vigil', fx: (c) => { c.me.faith = (c.me.faith ?? 0) + 5; practise(c.me, 'theology', 40); return 'Candlelight, hymns, and an aching back.'; } },
      { label: 'Decline politely', fx: () => 'She nods. There will be other vigils.' }] },
  { id: 'seek-faith', stage: [12, 70], weight: 0.4, need: (c) => !c.me.devout,
    text: (c) => `A wandering preacher speaks in the market square. Some listen closely; most walk on.`,
    choices: [{ label: 'Listen, and take the faith to heart', fx: (c) => { c.me.devout = true; c.me.faith = 5; return 'Faith is now part of your life. You chose it.'; } },
      { label: 'Walk on', fx: () => 'Your business is with this world.' }] },
  { id: 'betrothal', stage: [15, 24], weight: 1.5, once: true, need: (c) => c.me.estate !== 'commoner' && !c.me.spouseIds.length,
    text: (c) => `${c.father?.name ?? 'Your father'} has an offer: a match with a ${c.pick(['count\'s', 'marquis\'s', 'wealthy knight\'s'])} ${c.me.sex === 'male' ? 'daughter' : 'son'}. It would bind the two houses.`,
    choices: [{ label: 'Accept the match', fx: (c) => { remember(c, 'betrothed', 'Accepted an arranged match'); c.flags.betrothed = true; return 'The houses exchange gifts. The wedding is set for next year.'; } },
      { label: 'Refuse. You will choose your own', check: (c) => ({ capability: stats(c.me).presence + stats(c.me).will * 0.3, difficulty: 135 }), fx: (c, r) => r.success ? 'Your father rages, then relents.' : (remember(c, 'defied-father', 'Defied your father over a match'), 'Your father does not speak to you for a season.') }] },
  { id: 'father-remembers', stage: [8, 30], weight: 2, once: true, need: (c) => hasMem(c.me, 'toward-father') && c.father && c.father.deathYear == null,
    text: (c) => `${c.father.name} is in a rare soft mood. "You came to me first, you know. Before you could even talk."`,
    choices: [{ label: 'Ask about his own father', fx: (c) => { practise(c.me, 'letters', 10); return 'He talks until the fire burns down.'; } }, { label: 'Smile and say nothing', fx: () => 'He ruffles your hair, embarrassed.' }] },
  { id: 'hunt-boar', stage: [15, 50], weight: 2,
    text: (c) => c.me.estate === 'commoner' ? `A great boar is tearing up the village fields. The men gather spears.` : `A great boar has gored two dogs on the estate. The hunt gathers.`,
    choices: [
      { label: 'Face it with a boar-spear', check: (c) => ({ capability: fightingWorth(c.me, 'spear', 'levy').worth, difficulty: 2.4 }),
        fx: (c, r) => { practise(c.me, 'spear', 20); if (r.success) recordDeed(c.me, { weight: r.deedWeight, witnesses: 'company', year: c.world.year, month: c.world.month, text: 'killing the great boar', field: 'arms' }); if (r.breakthrough) breakthrough(c.me, 'toughness', r.breakthrough, 'the boar hunt'); if (!r.success && r.tier !== 'narrow failure') c.me.body.wounds.push({ kind: 'leg', year: c.world.year }); return r.success ? (r.breakthrough ? 'It should have killed you. You held the spear anyway, and something in you changed.' : 'The spear takes it through the chest.') : 'It knocks you flat and tusks your thigh before the dogs drive it off.'; } },
      { label: 'Ride with the beaters', fx: (c) => { practise(c.me, 'riding', 15); return 'Others take the glory. You keep your skin.'; } }] },
  { id: 'apprentice', stage: [12, 18], weight: 1.5, once: true, need: (c) => c.me.estate === 'commoner',
    text: (c) => `A smith in town will take an apprentice, seven years for food and a cot.`,
    choices: [{ label: 'Take the apprenticeship', fx: (c) => { c.me.occupation = 'apprentice smith'; practise(c.me, 'smithing', 200); return 'The forge becomes your world.'; } }, { label: 'Stay on the land', fx: () => 'The fields need hands.' }] },
  { id: 'fever', stage: [1, 70], weight: 1.2,
    text: (c) => `A fever runs through the ${c.me.estate === 'commoner' ? 'village' : 'household'}. You wake burning.`,
    choices: [{ label: 'Fight it off', check: (c) => ({ capability: stats(c.me).toughness, difficulty: 0.8, stakes: 0.9 }), fx: (c, r) => r.success ? (r.surged ? 'You should have died. You did not.' : 'Three bad days, then you mend.') : (c.me.traits.push('weakened'), 'It leaves you thin and weak for months.') }] },
  { id: 'harvest', stage: [8, 70], weight: 1.5, need: (c) => c.world.month >= 8 && c.world.month <= 9,
    text: (c) => `Harvest. ${c.me.estate === 'commoner' ? 'Every hand is in the fields, yours too.' : 'The reeve reports the yield and asks for hands to bring it in before rain.'}`,
    choices: [{ label: 'Work the fields beside them', fx: (c) => { train(c.me, 'lift', 0.8); train(c.me, 'march', 0.6); return 'Your back aches; the barns are full.'; } }, { label: 'Leave it to others', fx: () => 'The harvest comes in without you.' }] },
  { id: 'festival', stage: [5, 70], weight: 1.2, need: (c) => c.world.month === 6 || c.world.month === 12,
    text: (c) => `${c.world.month === 6 ? 'Midsummer' : 'Midwinter'} festival. Fires, music, a wrestling ring and too much ale.`,
    choices: [{ label: 'Enter the wrestling ring', check: (c) => ({ capability: fightingWorth(c.me, 'sword', 'none').worth, difficulty: 0.9 }), fx: (c, r) => { if (r.success) recordDeed(c.me, { weight: r.deedWeight * 0.2, witnesses: 'company', year: c.world.year, month: c.world.month, text: 'winning the festival ring', field: 'arms' }); return r.success ? 'You throw three challengers. The crowd chants your name.' : 'A miller\'s son flattens you in the first bout.'; } },
      { label: 'Dance until dawn', check: (c) => ({ capability: stats(c.me).presence, difficulty: 100 }), fx: (c, r) => r.success ? 'You catch someone\'s eye.' : 'You tread on every foot in the circle.' }] },
  { id: 'order-trial', stage: [16, 35], weight: 1, once: true, need: (c) => (c.me.deeds?.length ?? 0) >= 2,
    text: (c) => `Word of your deeds has reached the ${c.world.orders[0].name}. A grey-cloaked rider offers you their trials: the march, the weapon, the oath night. Most who try fail.`,
    choices: [{ label: 'Take the trials', fx: (c) => { const s = stats(c.me); const r = trial(c.rng, attempt, { capability: { march: s.march, worth: fightingWorth(c.me, 'sword', 'mail').worth, will: s.will }, judgment: s.judgment, will: s.will }, c.world.orders[0]); const failed = r.results.find((x) => !x.success); if (r.passed) { c.me.order = c.world.orders[0].id; c.me.career = { name: 'the order', ladder: c.world.orders[0].ranks }; c.me.rankIndex = 0; } return r.passed ? `You pass all three. You are an Aspirant of the ${c.world.orders[0].name}.` : `You fail ${failed.label}. The rider leaves without a word.`; } },
      { label: 'Decline. Not yet', fx: () => 'The rider nods. The offer may not come again.' }] },
  { id: 'muster', stage: [16, 45], weight: 0, // fired by the calendar when your realm goes to war
    text: (c) => `Riders bring the summons: ${c.world.realms[c.me.realm].name} is at war with ${c.tmp.enemy}. Every sworn man is to muster within the month.`,
    choices: [{ label: 'Answer the muster', fx: (c) => { c.flags.joinWar = true; return 'You march within the week.'; } },
      { label: 'Pay a substitute to go', check: (c) => ({ capability: c.me.wealth ?? 5, difficulty: 8 }), fx: (c, r) => r.success ? 'Coin changes hands. Someone else marches.' : (c.flags.joinWar = true, 'You cannot raise the coin. You march.') }] },
];

export function eligible(ctx, ev) {
  const a = ctx.age;
  if (ev.weight <= 0) return false;
  if (a < ev.stage[0] || a > ev.stage[1]) return false;
  if (ev.once && ctx.me.seenEvents?.includes(ev.id)) return false;
  if (ev.need && !ev.need(ctx)) return false;
  if ((ctx.me.lastSeen?.[ev.id] ?? -99) > ctx.world.year - 3) return false; // no repeats within 3 years
  return true;
}

// Present an event as a card with odds in words on each testing choice.
export function cardFor(ctx, ev) {
  const text = ev.text(ctx);
  return { id: ev.id, text, choices: ev.choices.map((ch, i) => {
    let odds = null;
    if (ch.check) { const k = ch.check(ctx); odds = oddsWords(k.capability, k.difficulty); }
    return { i, label: ch.label, odds: odds ? odds.words : null, oddsLine: odds?.line ?? null, tilt: odds?.tilt ?? null };
  }) };
}

export function resolveChoice(ctx, ev, i) {
  const ch = ev.choices[i];
  let r = null;
  if (ch.check) {
    const k = ch.check(ctx), s = stats(ctx.me);
    r = attempt(ctx.rng, { capability: k.capability, difficulty: k.difficulty, judgment: s.judgment, will: s.will, fatigue: ctx.me.fatigue ?? 0, stakes: k.stakes ?? 0.5 });
  }
  const out = ch.fx(ctx, r) ?? '';
  ctx.me.seenEvents ??= []; ctx.me.seenEvents.push(ev.id);
  ctx.me.lastSeen ??= {}; ctx.me.lastSeen[ev.id] = ctx.world.year;
  return { text: out, result: r };
}
