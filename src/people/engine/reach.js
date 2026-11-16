// R2 "every relationship needs a base" (owner order 55, rule 19, D-065, D-080): will the higher one let the lower near?
//
// Pure: the game's wiring (src/people/9999960-reach, A.REACH) reads the world into a plain case, and this module turns
// the case into the two options of an A.WHY decision ("let him near" against "keep him at a distance") with reasons,
// then judges them with why.js. No globals, no Math.random, no Date.
//
//   options(c)            -> [{ id: 'yes', reasons }, { id: 'no', reasons }]
//   judge(mind, c, opts)  -> { state, yes, top, nay, score } without a draw:
//        state 'equal'  near-equals (a gap of one step or none): what already works for them is kept, no decision;
//              'kin'    kin is a base of its own;
//              'open'   he will (the reasons settle it; no dice);
//              'try'    it could go either way: an attempt, decided by a seeded draw among the reasons (A.WHY);
//              'closed' he will not (no draw could choose it): the action is not offered, and the note says why.
//
// The case c:
//   act    'know' | 'befriend' | 'audience' | 'favour' | 'court' | 'wed' | 'patron' (how far he would go: ACTS)
//   gap    the higher one's standing less the lower one's, in steps of estate and rank (A.classOf's scale: a serf 1,
//          a peasant 2, a craftsman 3, a knight 4, a lord 5, a great lord 6 to 7, a crowned head 9)
//   kin    true when the two are kin
//   lowWord, highWord  "peasant", "king": the words of the two stations, for the reason he gives
//   born   'low' when he rose from below (his origin is two or more steps beneath his rank), 'gold' when born high
//   origWord  his own birth station ("a smith's son"), for 'low'
//   traits his traits (proud, humble, kind, cruel, curious, gregarious, shy, greedy)
//   op     his opinion of the lower one
//   yes    [{ kind, weight, label, source, pub }]: everything in favour the wiring found (the scales: knighthood,
//          honour, renown, mastery, wealth, a deed seen; connections: an introduction, a shared lord, a guild; need:
//          sword, skill, silence, coin, vote, what he knows; circumstance: service, a shared battle, cell, school,
//          company, a life saved)
//   no     [reason]: anything else against
import { odds as whyOdds } from './why.js';

// how far each act goes: the weight of the gap per step beyond the first (log-odds), and the words of it
export const ACTS = {
  know: { k: .9, will: 'know you', wont: 'know you' },
  befriend: { k: 1, will: 'make a friend of you', wont: 'make a friend of you' },
  audience: { k: .8, will: 'hear you now', wont: 'hear you' },
  favour: { k: 1, will: 'hear what you ask', wont: 'grant what you ask' },
  court: { k: 1.15, will: 'let you court {him}', wont: 'let you court {him}' },
  wed: { k: 1.4, will: 'hear your suit', wont: 'hear your suit' },
  patron: { k: .85, will: 'take you up', wont: 'take you up' },
};
export const T = {
  step: .7,      // log-odds per step of standing beyond the first, before the act and his pride
  near: 1,       // a gap of this or less is near-equals: no decision (what works for them is kept)
  band: 1.5,     // options within this of the best go to the draw (why.js's default)
  gold: .4,      // born to gold: against
  cruel: .4,     // a cruel man likes to refuse
  shy: .3,       // a shy man keeps to himself
  risen: 1.3,    // risen from below himself, and you are where he was: for
  kind: .6, humble: .6, gregarious: .5, curious: .5,
  opPer: 25, opMax: 3,   // his opinion of you: op / 25, at most 3, for (or against when below zero)
};

const n = x => (isFinite(x) ? +x : 0);
const R = (kind, weight, label, source, pub) => ({ kind, weight, label, source: source || null, pub: pub ? 1 : 0 });
// his words for a woman: the wiring passes c.she
const her = s => String(s).replace(/\bhimself\b/g, 'herself').replace(/\bhe\b/g, 'she').replace(/\bHe\b/g, 'She').replace(/\bhis\b/g, 'her').replace(/\bhim\b/g, 'her');

export function options(c) {
  const act = ACTS[c.act] || ACTS.know, tr = c.traits || [], has = t => tr.includes(t);
  const yes = [], no = [];
  const gap = Math.max(0, n(c.gap) - T.near);
  if (gap > 0) no.push(R('station', act.k * T.step * gap, `a ${c.lowWord || 'commoner'} is far beneath a ${c.highWord || 'lord'}`, { t: 'gap', g: n(c.gap) }, 1));
  if (c.born === 'gold') no.push(R('station', T.gold, 'born to gold, he has never had to look down', { t: 'born' }, 1));
  if (c.born === 'low') yes.push(R('sympathy', T.risen, `he was born ${c.origWord || 'low'} himself`, { t: 'born' }, 1));
  if (has('cruel')) no.push(R('station', T.cruel, 'he likes to see a man refused', { t: 'trait', k: 'cruel' }));
  if (has('shy')) no.push(R('temper', T.shy, 'he keeps to himself', { t: 'trait', k: 'shy' }));
  if (has('kind')) yes.push(R('sympathy', T.kind, 'he is a kindly man', { t: 'trait', k: 'kind' }, 1));
  if (has('humble')) yes.push(R('sympathy', T.humble, 'he holds himself no higher than he must', { t: 'trait', k: 'humble' }, 1));
  if (has('gregarious')) yes.push(R('temper', T.gregarious, 'he likes company', { t: 'trait', k: 'gregarious' }));
  if (has('curious')) yes.push(R('want', T.curious, 'he is curious about you', { t: 'trait', k: 'curious' }));
  const op = n(c.op);
  if (op > 5) yes.push(R('loyalty', Math.min(T.opMax, op / T.opPer), 'he already thinks well of you', { t: 'op', v: op }));
  else if (op < -5) no.push(R('grudge', Math.min(T.opMax, -op / T.opPer), 'he thinks ill of you', { t: 'op', v: op }));
  for (const r of c.yes || []) if (r && isFinite(r.weight) && r.weight) yes.push(R(r.kind || 'merit', r.weight, r.label, r.source, r.pub));
  for (const r of c.no || []) if (r && isFinite(r.weight) && r.weight) no.push(R(r.kind || 'station', r.weight, r.label, r.source, r.pub));
  if (c.she) for (const r of yes.concat(no)) r.label = her(r.label);
  return [{ id: 'yes', reasons: yes }, { id: 'no', reasons: no.length ? no : [R('temper', 0, 'he has no reason to', null)] }];
}

// the state of a case without a draw (pure: the person view, the list of actions, an NPC's bonds)
export function judge(mind, c, opts = {}) {
  if (c && c.kin) return { state: 'kin', yes: 1 };
  if (!c || n(c.gap) <= T.near) return { state: 'equal', yes: 1 };
  const ops = options(c), band = opts.band != null ? opts.band : T.band;
  const o = whyOdds(mind, ops, { band, at: opts.at });
  const inY = o.inBand.includes('yes'), inN = o.inBand.includes('no');
  const state = inY && !inN ? 'open' : inY ? 'try' : 'closed';
  const top = (id, sign) => {
    const rs = ops.find(x => x.id === id).reasons.filter(r => r.weight * sign > 0).sort((a, b) => b.weight - a.weight);
    return rs.length ? rs[0].label : null;
  };
  return { state, yes: o.yes, top: top('yes', 1), nay: top('no', 1), options: ops };
}

// the words a lower man hears, from a record (or a judged state): "Lord Aymer will hear you now: a knight of your name is
// worth an hour." / "The king will not know you: a peasant is far beneath a king."
export function say(name, act, ok, label, him = 'him') {
  const A_ = ACTS[act] || ACTS.know;
  const verb = (ok ? A_.will : A_.wont).replace('{him}', him);
  return `${name} will ${ok ? '' : 'not '}${verb}${label ? ': ' + label : ''}.`;
}
