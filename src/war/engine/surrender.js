// W1-5 "surrender or defeat" (docs/design/war.md §11.3, D-064 point 10, D-091): how a war ends, and only so.
//
//   will(f)            -> { fight: [reason], ask: [reason] }   the two pans of one side's decider, re-read each month
//   defeated(f)        -> null | { path, label }               a side that can no longer fight, or no longer exists
//   lean(f)            -> number                              ask pan less fight pan, before the temper (for "who asks first")
//   termCost(t, f)     -> number                              what one term costs the side that gives it (log-odds units)
//   pathOf(f, r)       -> 1..8                                the pathway an ending took, from the heaviest reason to yield
// The facts f are one side's war as its decider knows it (the game reads them: src/war/9999953-surrender/a-will.core.js):
//   { attacker, months, cb, heir, ratio, kept, lostShare, heldShare, capLost, capHeld, won, lost, lastWon, lastLost,
//     weary, broke, debt, stab, rising, fronts, faction, allies, foeBusy, age, ill, child, honour, terms, termsLabel,
//     temperW, temperLabel, blows: [[label, weight]], field, field0, realms, leaderGone, foe, cap, foeCap }
// Every field is optional (a missing one weighs nothing). A reason is { kind, weight, label, source, pub }, the shape
// A.WHY.decide reads (src/people/engine/why.js): its kind says which part of the temper bends it, its weight is in
// log-odds. No numbers reach a label: the player reads words (rule: no percentages).
// Pure: no globals, no Math.random, no Date.

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const r2 = x => Math.round(x * 100) / 100;
const ln = x => Math.log(Math.max(1e-6, x));
const n = x => (isFinite(x) ? +x : 0);

// the tunable weights (log-odds); the balance stage (D12b-7) may move them, each with a reason in docs/DECISIONS.md
export const T = {
  band: .4,          // the monthly question (fight on or ask): options this close go to the draw
  // to fight on
  cause: { throne: 1.2, liberty: 1.4, holy: 1.0, reconquest: .9, justified: .8, claim: .8, insult: .7, incident: .6, rivalry: .7,
    tribute: .6, conquest: .5, coalition: .6, independence: 1.2, peace: .4 },
  defend: 1.0,       // a defender's cause: his own land
  heirCut: .5,       // a war he did not begin weighs this share of the cause (pathway 6)
  pride: .9,         // he will not be the first to kneel
  hope: 1.1,         // x ln(ratio) when his host is the stronger
  ally: .25,         // each ally in the field (at most three)
  foeBusy: .4,       // the enemy at war elsewhere
  win: 3,            // x the share of their people he holds
  capHeld: 1,
  wonEach: .35, wonMax: 1.05,
  honour: .5,        // an honourable man will not make peace behind his allies' backs
  young: 1.2, youngMonths: 6,   // a war barely begun: his lords' men are still answering the summons
  // to ask
  broken: 2.2,         // x the share of his host lost
  weaker: .9,       // x ln(1 / ratio) when theirs is the stronger
  lostEach: .3, lostMax: 1.2,
  weary: 1.2,        // x weariness / 100
  wearyHigh: .8,     // and this much more for each 30 past 70
  broke: .6, debt: .4,
  years: .3, yearsMax: 1.5,   // each year of war past the first
  land: 4,           // x the share of his people under enemy soldiers
  capLost: 1.5,
  stab: 25,          // (40 - stability) / this, when the realm is shaking
  rising: .8, front: .5, faction: 2,
  old: 25,           // (age - 60) / this, the age told as a man's years (the game scales an elf's or a dwarf's)
  ill: .5, child: .8,
  failed: .3, failedMax: 1.2,   // an attacker with nothing won, each year past the first
  // defeat
  noHost: .1,        // a host this share of what it was is no host
  broke2: .06,       // every host broken: under this share
  strongholds: .5,   // ... and this share of his people under enemy soldiers
};

const reason = (kind, weight, label, source, pub) => ({ kind, weight: r2(weight), label, source: source || null, pub: pub ? 1 : 0 });
const plural = (k, one, many) => (k === 1 ? one : many);
const COUNT = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const say = k => (k >= 0 && k < COUNT.length ? COUNT[k] : 'many');

export const CAUSE_WORD = { throne: 'the crown he claims', liberty: 'the freedom of his lands', holy: 'a holy war', reconquest: 'land his realm lost',
  justified: 'a claim his heralds made good', claim: 'a claim of his blood', insult: 'an insult to avenge', incident: 'a wrong at the border',
  rivalry: 'an old rivalry', tribute: 'tribute refused him', conquest: 'land to take', coalition: 'a league against a conqueror',
  independence: 'the freedom of his lands', peace: 'a war his lords wanted' };

// the two pans (war.md §11.3's table), from one side's facts
export function will(f) {
  f = f || {};
  const fight = [], ask = [];
  const add = (pan, kind, w, label, src, pub) => { if (isFinite(w) && Math.abs(w) >= .02) pan.push(reason(kind, w, label, src, pub)); };
  const foe = f.foe || 'the enemy', yrs = n(f.months) / 12;
  // ---- to fight on
  // the cause: what he went to war for (feelings at the foe are added by A.WHY.decide from the options' feeds)
  if (f.attacker) {
    const base = T.cause[f.cb] != null ? T.cause[f.cb] : .6, w = f.heir ? base * T.heirCut : base;
    add(fight, f.cb === 'throne' || f.cb === 'liberty' || f.cb === 'justified' || f.cb === 'claim' || f.cb === 'reconquest' ? 'claim' : f.cb === 'holy' ? 'faith' : f.cb === 'insult' ? 'insult' : 'want',
      w, f.heir ? `${cap(CAUSE_WORD[f.cb] || 'the cause')}: a war he did not begin` : `The cause: ${CAUSE_WORD[f.cb] || 'what he went to war for'}`, { t: 'cause', id: f.cb || null }, 1);
  } else add(fight, 'duty', f.heir ? T.defend * .8 : T.defend, f.cb === 'throne' || f.cb === 'liberty' ? 'The crown is his, and his to keep' : 'Defending his own land', { t: 'cause', id: 'defend' }, 1);
  add(fight, 'insult', T.pride, 'He will not be the first to kneel', { t: 'pride' }, 0);
  if (n(f.ratio) > 1) add(fight, 'reckoning', T.hope * ln(Math.min(4, f.ratio)), `His host is stronger than that of ${foe}`, { t: 'count', r: r2(f.ratio) }, 0);
  if (n(f.allies) > 0) add(fight, 'loyalty', T.ally * Math.min(3, f.allies), `${cap(say(Math.min(3, f.allies)))} ${plural(Math.min(3, f.allies), 'ally', 'allies')} in the field beside him`, { t: 'allies' }, 1);
  if (n(f.foeBusy) > 0) add(fight, 'reckoning', T.foeBusy, `${cap(foe)} is at war elsewhere too`, { t: 'busy' }, 1);
  if (n(f.heldShare) > 0) add(fight, 'want', T.win * f.heldShare, `His soldiers hold land of ${foe}`, { t: 'held', r: r2(f.heldShare) }, 1);
  if (f.capHeld) add(fight, 'want', T.capHeld, `He holds ${f.foeCap || 'their capital'}`, { t: 'capital' }, 1);
  if (n(f.won) > 0) add(fight, 'want', Math.min(T.wonMax, T.wonEach * f.won), f.lastWon ? `Battles won: ${f.lastWon}${f.won > 1 ? ' and others' : ''}` : 'Battles won', { t: 'battles', r: f.won }, 1);
  if (n(f.months) < T.youngMonths && !f.capLost) add(fight, 'reckoning', T.young * (1 - n(f.months) / T.youngMonths), 'The war is young: his lords\' men are still answering the summons', { t: 'young' }, 0);
  if (f.honour && n(f.allies) > 0) add(fight, 'duty', T.honour, 'He will not make peace behind his allies\' backs', { t: 'allies' }, 0);
  if (n(f.terms) > 0) add(fight, 'claim', f.terms, `What yielding would cost: ${f.termsLabel || 'the terms they would ask'}`, { t: 'terms' }, 0);
  // ---- to ask for terms
  if (n(f.kept) < 1 && f.kept != null) add(ask, 'reckoning', T.broken * (1 - clamp(f.kept, 0, 1)), f.kept < .5 ? 'His hosts broken and scattered' : 'His hosts thinned by the fighting', { t: 'losses', r: r2(f.kept) }, 0);
  if (f.ratio != null && f.ratio < 1) add(ask, 'reckoning', T.weaker * ln(1 / Math.max(.15, f.ratio)), `The host of ${foe} is stronger than his`, { t: 'count', r: r2(f.ratio) }, 0);
  if (n(f.lost) > 0) add(ask, 'reckoning', Math.min(T.lostMax, T.lostEach * f.lost), f.lastLost ? `Battles lost: ${f.lastLost}${f.lost > 1 ? ' and others' : ''}` : 'Battles lost', { t: 'battles', r: -f.lost }, 1);
  if (n(f.weary) > 0) add(ask, 'cost', T.weary * f.weary / 100 + T.wearyHigh * Math.max(0, f.weary - 70) / 30, f.weary >= 70 ? 'The realm is worn out by the war' : f.weary >= 35 ? 'The realm is tiring of the war' : 'The war\'s cost in men and harvests', { t: 'weary', r: Math.round(f.weary) }, 0);
  if (f.broke) add(ask, 'coin', T.broke, 'The chest is empty and the soldiers\' pay is late', { t: 'treasury' }, 0);
  if (f.debt) add(ask, 'coin', T.debt, 'The crown is deep in debt', { t: 'debt' }, 0);
  if (yrs > 1) add(ask, 'cost', Math.min(T.yearsMax, T.years * (yrs - 1)), `${cap(say(Math.floor(yrs)))} years of war`, { t: 'years', r: Math.floor(yrs) }, 1);
  if (n(f.lostShare) > 0) add(ask, 'fear', T.land * f.lostShare, `Soldiers of ${foe} hold his land`, { t: 'land', r: r2(f.lostShare) }, 1);
  if (f.capLost) add(ask, 'fear', T.capLost, `${cap(f.cap || 'his capital')} is in enemy hands`, { t: 'capital' }, 1);
  if (f.stab != null && f.stab < 40) add(ask, 'fear', (40 - f.stab) / T.stab, 'The realm is shaking under him', { t: 'stability', r: Math.round(f.stab) }, 1);
  if (f.rising) add(ask, 'fear', T.rising, 'A rising at home', { t: 'rising' }, 1);
  if (n(f.fronts) > 1) add(ask, 'fear', T.front * (f.fronts - 1), f.fronts > 2 ? 'Enemies on every side' : 'A second enemy', { t: 'fronts', r: f.fronts }, 1);
  if (n(f.faction) > 0) add(ask, 'fear', T.faction * f.faction, 'A peace faction strong at court', { t: 'faction', r: r2(f.faction) }, 1);
  if (n(f.age) > 60) add(ask, 'fear', (f.age - 60) / T.old, 'He is old and tired of war', { t: 'age' }, 1);
  if (f.ill) add(ask, 'fear', T.ill, 'He is ill', { t: 'ill' }, 0);
  if (f.child) add(ask, 'fear', T.child, 'A regent rules for a child', { t: 'regent' }, 1);
  if (f.attacker && n(f.heldShare) < .05 && !f.capHeld && yrs > 1) add(ask, 'cost', Math.min(T.failedMax, T.failed * (yrs - 1)), 'Nothing won in years of trying', { t: 'failed' }, 1);
  for (const b of f.blows || []) if (b && isFinite(b[1])) add(ask, 'reckoning', b[1], String(b[0] || 'A blow'), { t: 'blow' }, 1);
  if (isFinite(f.temperW) && Math.abs(f.temperW) >= .02) add(ask, 'temper', f.temperW, f.temperLabel || 'His temper', { t: 'temper' }, 0);
  return { fight, ask };
}

const sum = rs => rs.reduce((a, r) => a + r.weight, 0);
// the lean toward asking, before the temper bends it: who asks first when both sides weigh it
export function lean(f) { const P = will(f); return r2(sum(P.ask) - sum(P.fight)); }

// a side that can no longer fight, or no longer exists (war.md §11.3, "Defeat is a fact")
export function defeated(f) {
  if (!f) return null;
  if (f.realms === 0) return { path: 8, label: 'nothing is left of its side' };
  if (f.leaderGone) return { path: 3, label: 'its ruler is gone and no one takes up the war' };
  const field0 = Math.max(1, n(f.field0)), host = n(f.field) / field0;
  if (f.capLost && host < T.noHost) return { path: 3, label: `${f.cap || 'its capital'} has fallen and it has no host left in the field` };
  if (host < T.broke2 && n(f.lostShare) >= T.strongholds) return { path: 1, label: 'every host is broken and its strongholds have fallen' };
  if (f.rebelLeaderGone) return { path: 1, label: 'the leader of the rising is dead or taken, and the league falls apart' };
  return null;
}

// what a term costs the side that gives it, in log-odds (the victor's gain mirrors it)
export const COST = { land: 3, capital: 1, coin: .4, coinMax: 2, trib: 1.2, humble: .3, unally: .4, renounce: .3, crown: 3, free: 2, annex: 6, peace: 0, pay: -.4 };
export function termCost(t, f) {
  if (!t) return 0;
  switch (t.k) {
    case 'land': return COST.land * n(t.share) + (t.capital ? COST.capital : 0);
    case 'coin': return COST.coin * clamp(n(t.years), 0, COST.coinMax);
    case 'pay': return COST.pay * clamp(n(t.years), 0, COST.coinMax);
    default: return COST[t.k] != null ? COST[t.k] : 0;
  }
}
export const termsCost = (terms, f) => r2((terms || []).reduce((a, t) => a + termCost(t, f), 0));

// the pathway (war.md §11.3's eight) that an ending took, from the decider's heaviest reason to yield
export function pathOf(f, rec) {
  const top = rec && rec.why && rec.why[0];
  const src = top && top[3] && typeof top[3] === 'object' ? top[3].t : null;
  if (f && f.heir && f.attacker) return 6;
  switch (src) {
    case 'battles': case 'losses': return 1;
    case 'weary': case 'treasury': case 'debt': case 'years': case 'failed': return 2;
    case 'capital': return 3;
    case 'stability': case 'rising': case 'faction': case 'fronts': return 4;
    case 'count': return n(f && f.kept) < .7 ? 5 : 1;
    case 'age': case 'ill': case 'regent': return 6;
    case 'land': return f && f.capLost ? 3 : 1;
    default: return 7;
  }
}

export const PATHS = { 1: 'the lost battle', 2: 'exhaustion', 3: 'the king or the capital taken', 4: 'revolt at home', 5: 'the army gone home',
  6: 'the decider dead', 7: 'terms offered and taken', 8: 'conquest' };

const cap = s => { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); };
