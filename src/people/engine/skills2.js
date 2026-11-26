// Skills rebuild (docs/design/skills-v2.md; the owner's answers of order 82, §15): ranked skills with levels. A skill is a
// card with a rank (D, C, B, A, S, SS, SSS, and X above them for the few legends (no gods as beings, order 83)), a level from 1 to 10, a rarity and a
// kind; a family's ladder of rungs stands where S1's one skill stood. This module is pure: no DOM, no A, no dice. It
// holds the bands (what a check reads at each rank and level, sitting exactly on S1's 35 values), the experience a
// level costs (S1's curve), the power budget and the effects' costs, the stacking caps, the needs of a route, and the
// checks for evolution, merging and advancing. The game's adapter (src/people/37-skills2) and the data validator
// (tools/lib/skills2-check.mjs) both read it.
//
// The data (data/skills/: vocab.json, families.json, ladders/*.json, recipes.json) is indexed once by index(D), which
// returns IX; every function that needs the data takes IX, so the validator can index a planted fault without touching
// the game's copy. setData(D) keeps one IX for the page.

// ---- 1. ranks, and S1's scale ----------------------------------------------------------------------------------------
export const RANKS = ['D', 'C', 'B', 'A', 'S', 'SS', 'SSS', 'X'];
export const HUMAN = ['D', 'C', 'B', 'A', 'S'];        // the ranks on the 0-100 scale a card's check reads
export const rankIx = r => RANKS.indexOf(r);
export const MAX_LV = 10;
// S1's 35 levels (src/people/engine/skills.js): seven words of five steps, Beginner I = 1 to Legend V = 100
const EDGE = [1, 15, 35, 55, 72, 88, 96, 101], STEPS = 5;
export const S1_MAX = 35;
export const S1_VALUES = [0];
for (let lv = 1; lv <= S1_MAX; lv++) { const w = Math.floor((lv - 1) / STEPS); S1_VALUES.push(EDGE[w] + ((lv - 1) % STEPS) * (EDGE[w + 1] - EDGE[w]) / STEPS); }
export function s1LevelOfValue(v) {
  if (!(v >= 1 - 1e-9)) return 0;
  let lo = 1, hi = S1_MAX;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (S1_VALUES[mid] <= v + 1e-9) lo = mid; else hi = mid - 1; }
  return lo;
}
// Where a rung stands on S1's scale (a real number, §3.1): D is S1's Beginner and Intermediate one for one; C, B and A
// are Advanced, Expert and Master with each S1 step become two levels (an odd level is the step, an even level half way
// to the next); S is Grandmaster and Legend one for one. SS and above are off the human scale: they read its top.
const BASE = { D: 0, C: 10, B: 15, A: 20, S: 25 };
export function s1Pos(rank, lv) {
  if (!(lv >= 1)) return 0;
  lv = Math.min(MAX_LV, lv);
  if (rank === 'D' || rank === 'S') return BASE[rank] + lv;
  if (BASE[rank] != null) return BASE[rank] + (lv + 1) / 2;
  return S1_MAX;
}
export function valueAt(pos) {
  if (!(pos >= 1)) return pos > 0 ? S1_VALUES[1] * pos : 0;
  if (pos >= S1_MAX) return S1_VALUES[S1_MAX];
  const i = Math.floor(pos), f = pos - i;
  return f < 1e-9 ? S1_VALUES[i] : S1_VALUES[i] + f * (S1_VALUES[i + 1] - S1_VALUES[i]);
}
// what a check reads for a rung (§3.1's table)
export const value = (rank, lv) => (lv >= 1 && rankIx(rank) >= 0 ? valueAt(s1Pos(rank, lv)) : 0);
export const BANDS = Object.fromEntries(RANKS.map(r => [r, Array.from({ length: MAX_LV }, (_, i) => value(r, i + 1))]));
// the rung an S1 level sits on (an old save, an NPC's number): the odd level of its step in C, B and A
export function rungOfS1(s1lv) {
  s1lv = Math.max(0, Math.min(S1_MAX, s1lv | 0));
  if (s1lv <= 0) return null;
  if (s1lv <= 10) return { rank: 'D', lv: s1lv };
  if (s1lv <= 25) { const rank = s1lv <= 15 ? 'C' : s1lv <= 20 ? 'B' : 'A'; return { rank, lv: 2 * (s1lv - BASE[rank]) - 1 }; }
  return { rank: 'S', lv: s1lv - 25 };
}
// the S1 level a rung stands in (the step under it)
export const s1OfRung = (rank, lv) => Math.min(S1_MAX, Math.floor(s1Pos(rank, lv) + 1e-9));
// every rung of the human ranks in order of what it reads, for the closed form
const LADDER = [];
for (const r of HUMAN) for (let lv = 1; lv <= MAX_LV; lv++) LADDER.push({ rank: r, lv, v: value(r, lv) });
// the highest rung whose read is at or under v (an NPC's number: older code may write any number)
export function rungOfValue(v) {
  if (!(v >= 1 - 1e-9)) return null;
  let lo = 0, hi = LADDER.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (LADDER[mid].v <= v + 1e-9) lo = mid; else hi = mid - 1; }
  return { rank: LADDER[lo].rank, lv: LADDER[lo].lv };
}
// a specialism's (a focus's) shift, in S1 steps, read on the scale (S1: two steps up inside it, one down in a sibling)
export const shifted = (rank, lv, steps) => valueAt(Math.max(1, Math.min(S1_MAX, s1Pos(rank, lv) + steps)));
// the rank after this one, and the one before
export const nextRank = r => RANKS[rankIx(r) + 1] || null;
export const prevRank = r => (rankIx(r) > 0 ? RANKS[rankIx(r) - 1] : null);

// ---- 2. experience: S1's curve on the scale ------------------------------------------------------------------------
// ten experience is a month of plain drill alone; a level costs 120 x (e^(v'/21.6) - e^(v/21.6)) (growth.js CURVE)
export const XP_UNIT = 10, CURVE_A = 1.8, CURVE_S = 21.6, XP_K = XP_UNIT * CURVE_S / CURVE_A;
const span = (a, b) => Math.max(1, Math.round(XP_K * (Math.exp(b / CURVE_S) - Math.exp(a / CURVE_S))));
// the experience from (rank, lv) to the next level; at Lv 10, to the next rank's Lv 1 (the bar fills and stops there
// until the evolution's conditions hold, §3.2). Above S each rank's levels cost twice the rank below's (§15.1).
export function cost(rank, lv) {
  const ri = rankIx(rank); if (ri < 0) return Infinity;
  if (!(lv >= 1)) return rank === 'D' ? span(0, value('D', 1)) : Infinity;
  if (lv > MAX_LV) return Infinity;
  if (ri >= rankIx('S')) {
    const L = Math.min(lv, MAX_LV - 1), base = span(value('S', L), value('S', L + 1));
    if (rank === 'S' && lv === MAX_LV) return RANKS.length > ri + 1 ? base * 2 : Infinity;
    return base * Math.pow(2, ri - rankIx('S'));
  }
  const to = lv < MAX_LV ? value(rank, lv + 1) : value(nextRank(rank), 1);
  return span(value(rank, lv), to);
}
// experience from nothing to (rank, lv) along a family's ladder
export function totalTo(rank, lv) {
  let t = cost('D', 0);
  for (const r of RANKS) {
    for (let l = 1; l <= MAX_LV; l++) { if (r === rank && l === lv) return t; t += cost(r, l); }
    if (r === rank) return t;
  }
  return t;
}
// talent (S1's letters, per family) sets the reach: past it, experience is quartered (§3.1)
export const REACH = { F: ['D', 10], E: ['C', 1], D: ['B', 1], C: ['A', 1], B: ['A', 5], A: ['S', 1], S: ['S', 6], SSS: null };
export function pastReach(talent, rank, lv) {
  const r = REACH[talent] === undefined ? REACH.C : REACH[talent];
  if (!r) return false;
  return rankIx(rank) > rankIx(r[0]) || (rank === r[0] && lv >= r[1]);
}
// an S1 entry (level and experience on its bar) as a rung (§7; D-174): the rung of the S1 step at its odd level, so
// what a check reads is exactly S1's on the day of the step; in C, B and A, experience past the odd level's bar is kept
// as `held` (stored experience: it lands as the even level when the rungs hold the level, step 5). Nothing is lost.
export function fromS1(s1lv, xp) {
  const r = rungOfS1(s1lv); if (!r) return null;
  xp = Math.max(0, +xp || 0); if (!isFinite(xp)) xp = 0;
  const c = cost(r.rank, r.lv), keep = Math.floor(Math.min(xp, Math.max(0, c - 0.01)) * 100) / 100;
  const out = { rank: r.rank, lv: r.lv, xp: keep };
  const held = Math.round((xp - keep) * 100) / 100;
  if (held > 0) out.held = held;
  return out;
}
// The switch (step 5, D-179): an S1 entry as the rung that holds its level, the even level counted. In C, B and A an S1
// step is two levels; experience past the odd level's bar is the even level (fromS1 keeps it as `held`, for the shadow
// and the save step, so nothing moved on the day of the step). D and S are one for one.
export function landed(s1lv, xp) {
  const r = fromS1(s1lv, xp); if (!r) return null;
  if (r.held > 0 && (r.rank === 'C' || r.rank === 'B' || r.rank === 'A') && r.lv % 2 === 1) {
    const c = cost(r.rank, r.lv + 1);
    return { rank: r.rank, lv: r.lv + 1, xp: Math.floor(Math.min(r.held, Math.max(0, c - 0.01)) * 100) / 100 };
  }
  return { rank: r.rank, lv: r.lv, xp: r.xp };
}
// how a level is printed (§6.1: levels only, never a word): "C · Lv 3"; nothing held is "untried"
export const label = (rank, lv) => (rank && lv >= 1 ? `${rank} · Lv ${lv}` : 'untried');
// an S1 entry's level, printed as its rung
export const s1Label = (s1lv, xp) => { const r = landed(s1lv, xp || 0); return r ? label(r.rank, r.lv) : 'untried'; };
// the rung at which S1's gate w opens (1: D Lv 6, 2: rank C, 3: rank B, 4: rank A, 5: rank S, 6: S Lv 6), printed
export function gateLabel(w) {
  const r = rungOfS1(w * STEPS + 1); if (!r) return 'the first level';
  return r.lv === 1 ? `rank ${r.rank}` : label(r.rank, r.lv);
}

// ---- 3. the data, indexed -------------------------------------------------------------------------------------------
// D = { vocab, families: { families: [...] } | [...], skills: [...], recipes: [...] }
export function index(D) {
  const V = D.vocab, fams = Array.isArray(D.families) ? D.families : (D.families && D.families.families) || [];
  const IX = { V, D, fams, skills: D.skills || [], recipes: D.recipes || [], BY: {}, FAM: {}, LEG: {}, RUNG: {}, RECIPE: {}, groups: new Set(V.groups || []), checkTags: new Set(V.checkTags || []) };
  for (const f of fams) { IX.FAM[f.id] = f; for (const k of f.legacy || []) IX.LEG[k] = f.id; }
  for (const s of IX.skills) {
    if (!IX.BY[s.id]) IX.BY[s.id] = s;
    if (s.family && HUMAN.includes(s.rank)) { const L = IX.RUNG[s.family] = IX.RUNG[s.family] || {}; if (!L[s.rank]) L[s.rank] = s.id; }
  }
  for (const r of IX.recipes) IX.RECIPE[r.id] = r;
  IX.weapons = new Set(fams.filter(f => f.group === 'arms' || f.id === 'unarmed').flatMap(f => [f.id, ...(f.legacy || [])]));
  return IX;
}
export let IX = null;
export function setData(D) { IX = index(D); return IX; }
// the family a key reads (a family id, or one of the ten legacy keys: 'xbow' -> 'bow')
export const famOf = (ix, k) => (ix.FAM[k] ? k : ix.LEG[k] || null);
// a family's rung of a rank (the ladder): its id
export const rungOf = (ix, fam, rank) => (ix.RUNG[fam] && ix.RUNG[fam][rank]) || null;

// ---- 4. the power budget and the effects' costs (§2.4, §15.1) -------------------------------------------------------
export function budget(ix, skill, at) {
  const per = ix.V.perLevel[skill.rank] || 0, bonus = (ix.V.rarityBonus || {})[skill.rarity] || 0;
  return per * at * (1 + bonus);
}
const tagKind = (ix, tag) => (ix.FAM[tag] ? 'family' : ix.groups.has(tag) ? 'group' : 'narrow');
export function effectCost(ix, e) {
  if (!e || typeof e !== 'object') return 0;
  const C = ix.V.costs, a = Math.abs(+e.v || 0);
  switch (e.type) {
    case 'stat': return C.stat * a;
    case 'edge': { const k = tagKind(ix, e.tag); return (k === 'family' ? C.edgeFamily : k === 'group' ? C.edgeGroup : C.edgeNarrow) * a; }
    case 'fight': return (e.tag === 'all' ? C.fightAll : C.fightOne) * a;
    case 'blunder': case 'surge': return C.blunderSurge * a;
    case 'aura': return (C.aura[e.scale] || 0) * a;
    case 'resist': return ((C.resistHardOf || []).includes(e.of) ? C.resistHard : C.resist) * a;
    case 'social': return C.socialPer5 * a / 5;
    case 'economy': return C.economyPer5 * a / 5;
    case 'growth': return C.growthPer10 * a / 10;
    case 'unlock': return (C.unlockBigKinds || []).includes(String(e.what || '').split(':')[0]) ? C.unlockBig : C.unlockSmall;
    case 'perk': return e.legacy ? C.perkLegacy : C.perk * (a || 1);
    case 'trigger': return effectCost(ix, e.do) * ((ix.V.rareTriggers || []).includes(e.on) ? C.triggerRare : C.trigger);
    case 'active': return effectCost(ix, e.do) * (ix.V.limits[e.limit] != null ? ix.V.limits[e.limit] : 1);
    default: return 0;
  }
}
// an effect's slot: a later band's effect of the same slot replaces it (§2.2)
export function effectKey(e) {
  if (e.type === 'perk') return 'perk|' + (e.legacy || e.key + ':' + e.name);
  const t = e.tag != null ? e.tag : e.of != null ? e.of : e.stat != null ? e.stat : e.group != null ? e.group : e.on != null ? e.on : e.name != null ? e.name : e.what;
  return e.type + '|' + t + (e.part ? '|' + e.part : '');
}
// the effects a skill gives at a level: every band at or under it, later bands replacing earlier ones slot by slot
export function effectsAt(skill, lv) {
  const held = new Map();
  for (const b of (skill.levels || []).slice().sort((x, y) => x.at - y.at)) {
    if (b.at > lv) break;
    for (const e of b.effects || []) held.set(effectKey(e), e);
  }
  return [...held.values()];
}
export const spendAt = (ix, skill, lv) => effectsAt(skill, lv).reduce((t, e) => t + effectCost(ix, e), 0);
// every band over its budget (a flaw: under what it owes at its first band)
export function budgetFaults(ix, skill) {
  const out = [];
  for (const b of skill.levels || []) {
    const sp = spendAt(ix, skill, b.at), bud = budget(ix, skill, b.at);
    if (skill.kind === 'flaw') { if (b.at === (skill.levels[0] || {}).at && sp + 1e-9 < budget(ix, skill, 1)) out.push({ at: b.at, spend: sp, budget: budget(ix, skill, 1), flaw: true }); }
    else if (sp > bud + 1e-9) out.push({ at: b.at, spend: sp, budget: bud });
  }
  return out;
}

// ---- 5. the stacking caps (§2.4, rising by rank: §15.1) --------------------------------------------------------------
// sources sorted largest first, weighed 1, 1/2, 1/4, 1/8 (the rest nothing); at most the cap; maluses count in full,
// down to minus the cap
export function stack(values, cap, weights) {
  const w = weights || [1, 0.5, 0.25, 0.125];
  const pos = values.filter(v => v > 0).sort((a, b) => b - a), neg = values.filter(v => v < 0);
  let t = 0; pos.forEach((v, i) => { t += v * (w[i] || 0); });
  t = Math.min(cap, t);
  const n = neg.reduce((s, v) => s + v, 0);
  return Math.max(-cap, t + n);
}
// the cap of a kind of bonus for the highest rank among its sources
// The design's caps for the human ranks (§2.4), a ceiling the data cannot lift (step 6, D-180): vocab.json may tune a
// cap lower, never higher. Above S the caps are the data's, rising by rank (§15.1).
export const CAP_HUMAN = { edge: 12, fightShare: 0.15, aura: 3, blunderSurge: 2, resist: 3, growth: 50, stat: 10 };
export function capOf(ix, what, topRank) {
  const C = (ix.V.caps || {})[what], hard = HUMAN.includes(topRank) || rankIx(topRank) < 0 ? CAP_HUMAN[what] : undefined;
  const v = !C ? Infinity : C[topRank] != null ? C[topRank] : C.S != null ? C.S : Infinity;
  return hard != null ? Math.min(v, hard) : v;
}
export const topRank = ranks => ranks.reduce((t, r) => (rankIx(r) > rankIx(t) ? r : t), 'D');

// ---- 6. needs: what a route, a gate or a recipe asks, against the facts of a life (§2.5) ------------------------------
// facts: { stat: {str}, family: {sword: read}, skills: {id: {lv}}, age, race, culture, faith, house, teacher (bool or
// fn(need)), months, place, items: [], deeds: [{ kind, rank? }], flags: [] | {}, office, titles: [], devotion: {faith},
// traits: [], talent: {fam: letter}, concepts: [] (fam:id), fame, moment }. Returns what is missing ([] when met).
const TAL = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SSS'];
const has = (x, k) => (Array.isArray(x) ? x.includes(k) : x instanceof Set ? x.has(k) : !!(x && x[k] != null && x[k] !== false));
const oneOf = (want, got) => (Array.isArray(want) ? want.includes(got) : want === got);
export function deedCount(facts, kind, rank) {
  let n = 0;
  for (const d of facts.deeds || []) if (d && d.kind === kind && (!rank || rankIx(d.rank) >= rankIx(rank))) n += d.n || 1;
  return n;
}
export function missing(needs, facts) {
  const out = []; if (!needs) return out;
  facts = facts || {};
  for (const k in needs) {
    const n = needs[k];
    switch (k) {
      case 'stat': for (const s in n) if (!((facts.stat || {})[s] >= n[s])) out.push('stat:' + s); break;
      case 'family': for (const f in n) if (!((facts.family || {})[f] >= n[f])) out.push('family:' + f); break;
      case 'skill': for (const id in n) { const h = (facts.skills || {})[id], w = n[id] || {}; if (!h || (w.lv && !(h.lv >= w.lv))) out.push('skill:' + id); } break;
      case 'age': if (!(facts.age >= n[0] && facts.age <= n[1])) out.push('age'); break;
      case 'race': case 'culture': case 'faith': case 'house': case 'office': case 'place': if (!oneOf(n, facts[k])) out.push(k); break;
      case 'teacher': if (!(typeof facts.teacher === 'function' ? facts.teacher(n) : facts.teacher)) out.push('teacher'); break;
      case 'months': if (!(facts.months >= n)) out.push('months'); break;
      case 'item': if (!has(facts.items, n)) out.push('item'); break;
      case 'deed': if (deedCount(facts, n.kind, n.rank) < (n.n || 1)) out.push('deed:' + n.kind); break;
      case 'flag': if (!has(facts.flags, n)) out.push('flag:' + n); break;
      case 'title': if (!has(facts.titles, n)) out.push('title'); break;
      case 'devotion': if (!((facts.devotion || {})[n.faith] >= n.min)) out.push('devotion'); break;
      case 'trait': if (![].concat(n).every(t => has(facts.traits, t))) out.push('trait'); break;
      case 'talent': for (const f in n) if (TAL.indexOf((facts.talent || {})[f] || 'C') < TAL.indexOf(n[f])) out.push('talent:' + f); break;
      case 'concept': for (const c of n) if (!has(facts.concepts, c)) out.push('concept:' + c); break;
      case 'fame': if (!(facts.fame >= n)) out.push('fame'); break;
      case 'moment': if (!oneOf(n, facts.moment)) out.push('moment'); break;
      case 'not': if (!missing(n, facts).length) out.push('not'); break;
      default: out.push('unknown:' + k);
    }
  }
  return out;
}

// ---- 7. evolution, merging, advancing (§3.3, §3.4; §15.2: an evolved skill stays beside its evolution, a merge absorbs
// its parts) -------------------------------------------------------------------------------------------------------------
// held: { id, lv } of a skill the person holds; facts as above (facts.skills lists everything he holds)
export function evolveRoutes(ix, from) {
  const s = ix.BY[from]; if (!s) return [];
  const out = [];
  for (const t of s.evolvesTo || []) {
    const to = ix.BY[t.id]; if (!to) continue;
    for (const r of to.acquire || []) if (r.via === 'evolve' && r.from === from) out.push({ to: t.id, route: r });
  }
  return out;
}
export function canEvolve(ix, held, facts) {
  const s = ix.BY[held && held.id]; if (!s) return [];
  return evolveRoutes(ix, held.id).map(({ to, route }) => {
    const miss = [];
    if (!(held.lv >= MAX_LV)) miss.push('level');
    if ((facts.skills || {})[to]) miss.push('held');
    miss.push(...missing(route.needs, facts));
    return { to, ok: !miss.length, missing: miss };
  });
}
// the table after an evolution: the old skill stays where it was, the new one is added at Lv 1 (§15.2)
export function evolve(table, from, to, at) {
  if (!table[from] || table[to]) return table;
  table[to] = { lv: 1, xp: 0, via: 'evolve', from };
  if (at != null) table[to].y = at;
  return table;
}
export function canMerge(ix, recipe, facts) {
  const miss = [], held = facts.skills || {};
  if (!recipe || !ix.BY[recipe.result]) return { ok: false, missing: ['recipe'] };
  for (const p of recipe.parts || []) { const h = held[p.id]; if (!h || !(h.lv >= (p.lv || 1))) miss.push('part:' + p.id); }
  if (held[recipe.result]) miss.push('held');
  if (recipe.kind === 'known' && facts.knows && !facts.knows(recipe.id)) miss.push('known');
  if (recipe.kind === 'age' && facts.census && facts.census(recipe.result) > 0) miss.push('census');
  if (recipe.kind === 'found' && recipe.moment && facts.moment !== recipe.moment) miss.push('moment');
  miss.push(...missing(recipe.needs, facts));
  return { ok: !miss.length, missing: miss };
}
// the table after a merge: the parts are absorbed into the result, which starts at Lv 1 but never reads below the best
// part's read (floor: the adapter keeps the higher until the result's own level passes it, §3.4)
export function merge(ix, table, recipe, at) {
  let floor = 0;
  for (const p of recipe.parts) { const h = table[p.id], s = ix.BY[p.id]; if (h && s) floor = Math.max(floor, value(s.rank, h.lv)); delete table[p.id]; }
  table[recipe.result] = { lv: 1, xp: 0, via: 'merge', floor };
  if (at != null) table[recipe.result].y = at;
  return table;
}
// advancing (awakening): a skill at Lv 5 or more jumps to the next rank's Lv 1 at a named moment, once a life (§3.4)
export const ADVANCE_FROM = 5, ADVANCES_A_LIFE = 1;
export function canAdvance(ix, held, facts) {
  const miss = [], s = ix.BY[held && held.id];
  if (!s) return { ok: false, missing: ['skill'] };
  const to = (s.evolvesTo || []).map(t => ix.BY[t.id]).find(t => t && rankIx(t.rank) === rankIx(s.rank) + 1);
  if (!to) miss.push('no-next');
  if (!(held.lv >= ADVANCE_FROM)) miss.push('level');
  if ((facts.advances || 0) >= ADVANCES_A_LIFE) miss.push('once');
  if (!(ix.V.moments || []).includes(facts.moment)) miss.push('moment');
  if (to && (facts.skills || {})[to.id]) miss.push('held');
  return { ok: !miss.length, missing: miss, to: to ? to.id : null };
}

// ---- 7b. in play: an edge of a family's ladder, a merge's entry and its levels, the chances (steps 7 and 8; D-182) ------
// A family's ladder runs on S1's table (36-skills) under the rungs (D-179): S1's band edges w = 1 .. 6 are where the
// rungs' conditions stand. w 2 to 5 open a rank: the evolution from the rung below, gated by the target's `evolve` route
// (§3.2). w 1 and 6 are the gates inside D and S at Lv 6 (the rung's own `gates`).
export const EDGE_RANK = { 2: 'C', 3: 'B', 4: 'A', 5: 'S' };
export const EDGE_GATE = { 1: ['D', 6], 6: ['S', 6] };
export function edgeNeeds(ix, fam, w) {
  const rank = EDGE_RANK[w];
  if (rank) {
    const to = rungOf(ix, fam, rank), from = rungOf(ix, fam, prevRank(rank)); if (!to || !from) return null;
    const r = evolveRoutes(ix, from).find(x => x.to === to);
    return r ? { kind: 'evolve', from, to, rank, needs: r.route.needs || {} } : null;
  }
  const g = EDGE_GATE[w]; if (!g) return null;
  const id = rungOf(ix, fam, g[0]), s = id && ix.BY[id]; if (!s) return null;
  const gate = (s.gates || []).find(x => x.at === g[1]);
  return { kind: 'gate', from: id, to: id, rank: g[0], at: g[1], needs: (gate && gate.needs) || {} };
}
// the verdict at an edge for these facts: the route's needs, what is missing, and a rung absorbed by a merge (facts.sealed,
// a list of rung ids) never evolves (§15.8: past Lv 10 a skill evolves or merges, not both)
export function edgeVerdict(ix, fam, w, facts) {
  const e = edgeNeeds(ix, fam, w); if (!e) return null;
  const miss = missing(e.needs, facts || {});
  if (e.kind === 'evolve' && facts && Array.isArray(facts.sealed) && facts.sealed.includes(e.from)) miss.push('absorbed');
  return Object.assign(e, { ok: !miss.length, missing: miss });
}
// the chances (§3.4), each read from a hash of its own key: no draw from any stream
export const ADVANCE_CHANCE = 0.01;      // an advance: 1 in 100 a named moment
export const FOUND_CHANCE = 1 / 200;     // a found merge: 1 in 200 a named moment, at most once a life
export function hashKey(str) { let h = 1779033703 ^ str.length; for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); } h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return (h ^ (h >>> 16)) >>> 0; }
export const unitOf = str => (hashKey(String(str)) + 0.5) / 4294967296;
// a merge's new entry: Lv 1, its parts named, the best part's read kept as a floor (§3.4), the parts' families listed
export function mergeEntry(ix, recipe, held, at) {
  let floor = 0; const fams = new Set();
  for (const p of recipe.parts || []) {
    const s = ix.BY[p.id], h = held && held[p.id];
    if (s && h) floor = Math.max(floor, value(s.rank, h.lv));
    for (const f of (s && s.reads) || []) fams.add(f);
  }
  const res = ix.BY[recipe.result];
  for (const f of (res && res.reads) || []) fams.add(f);
  const e = { lv: 1, xp: 0, via: 'merge', rc: recipe.id, of: (recipe.parts || []).map(p => p.id), fams: [...fams].sort(), floor: Math.round(floor * 100) / 100 };
  if (at != null) e.y = at;
  return e;
}
// what a held (merged or named) skill reads for its families: its own level's read, never below its floor
export const entryRead = (ix, id, e) => { const s = ix.BY[id]; return s && e && e.lv >= 1 ? Math.max(value(s.rank, Math.min(MAX_LV, e.lv)), e.floor || 0) : 0; };
// experience into a held skill's own bar: levels by its rank's costs; at Lv 10 the bar fills and stops (§15.8: no Lv 11)
export function addXp(rank, e, x) {
  let n = 0;
  e.xp = (e.xp || 0) + Math.max(0, +x || 0);
  while (e.lv < MAX_LV) { const c = cost(rank, e.lv); if (!(e.xp >= c)) break; e.xp -= c; e.lv++; n++; }
  if (e.lv >= MAX_LV) e.xp = Math.min(e.xp, cost(rank, MAX_LV));
  e.xp = Math.round(e.xp * 100) / 100;
  return n;
}
// the recipes open to these facts (canMerge), in the data's order
export const openRecipes = (ix, facts) => ix.recipes.filter(r => canMerge(ix, r, facts).ok);
// what a recipe must be (§3.4, §15.8): two or more parts, each a different skill reading different families, each asked
// at Lv 10 (only a level-10 skill merges), the result reading every family its parts read, never a family's ladder rung;
// a found recipe's moment one the vocabulary names; once an age only for a result counted once an age
export function recipeFaults(ix, r) {
  const out = [], res = ix.BY[r && r.result];
  if (!r || !Array.isArray(r.parts)) return ['no parts'];
  const ids = r.parts.map(p => p && p.id), fams = new Map();
  if (new Set(ids).size !== ids.length) out.push('a part twice');
  for (const p of r.parts) {
    const s = ix.BY[p && p.id]; if (!s) continue;
    if (p.lv !== MAX_LV) out.push(`part ${p.id} at Lv ${p.lv}: only a level-${MAX_LV} skill merges`);
    for (const f of s.reads || []) { if (fams.has(f)) out.push(`parts ${fams.get(f)} and ${p.id} both read ${f}: one ladder, not two skills`); fams.set(f, p.id); }
  }
  if (res) {
    for (const f of fams.keys()) if (!(res.reads || []).includes(f)) out.push(`result ${res.id} does not read ${f}`);
    if (res.family && HUMAN.includes(res.rank) && rungOf(ix, res.family, res.rank) === res.id) out.push(`result ${res.id} is a ladder's rung`);
    if (!(res.acquire || []).some(a => a.via === 'merge' && a.recipe === r.id)) out.push(`result ${res.id} has no merge route naming ${r.id}`);
    if (r.kind === 'age' && res.census !== 'age') out.push(`once an age, but ${res.id} is not counted once an age`);
  }
  if (r.kind === 'found' && r.moment != null && !(ix.V.moments || []).includes(r.moment)) out.push(`moment ${r.moment}`);
  return out;
}

// ---- 8. the graph of evolution and merging (§2.7 checks 7, 8) ------------------------------------------------------------
export function graph(ix) {
  const G = new Map(), add = (a, b) => { if (!G.has(a)) G.set(a, new Set()); G.get(a).add(b); };
  for (const s of ix.skills) {
    for (const t of s.evolvesTo || []) add(s.id, t.id);
    for (const r of s.acquire || []) if (r.via === 'evolve' && r.from) add(r.from, s.id);
  }
  for (const r of ix.recipes) for (const p of r.parts || []) add(p.id, r.result);
  return G;
}
// a cycle as a list of ids, or null
export function findCycle(G) {
  const state = new Map(), stack = [];
  const visit = n => {
    state.set(n, 1); stack.push(n);
    for (const m of G.get(n) || []) {
      if (state.get(m) === 1) return stack.slice(stack.indexOf(m)).concat(m);
      if (!state.get(m)) { const c = visit(m); if (c) return c; }
    }
    state.set(n, 2); stack.pop(); return null;
  };
  for (const n of [...G.keys()].sort()) if (!state.get(n)) { const c = visit(n); if (c) return c; }
  return null;
}
export function descendants(G, id) {
  const out = new Set(), q = [id];
  while (q.length) for (const m of G.get(q.pop()) || []) if (!out.has(m)) { out.add(m); q.push(m); }
  return out;
}

// ---- 9. what a family reads from what a person holds (§5.1) -------------------------------------------------------------
// entries: [{ id, lv, rust?, floor? }] the person holds; the read of fam is the best of the skills that read it, less
// rust (never below 0); a merge's floor keeps it from falling under its parts' read
export function familyRead(ix, entries, fam) {
  let best = 0;
  for (const e of entries) {
    const s = ix.BY[e.id]; if (!s || !(s.reads || []).includes(fam)) continue;
    let v = Math.max(value(s.rank, e.lv), e.floor || 0);
    if (e.rust > 0) v = Math.max(0, v - e.rust);
    if (v > best) best = v;
  }
  return best;
}

// ---- 10. effects in play: the capability profile and the caps (step 6, §2.3, §2.4, §3.6; D-180) ------------------------
// held: [{ id, lv }], every skill a person holds (a family's rungs below his top one at Lv 10, the top one at its level,
// §15.2). gather() lists every passive effect's sources by slot. Perks are not gathered: the adapter serves them from
// the read of their key, as the release did (perkRows). trigger and active effects are listed, not summed: they act in
// their moment (steps 7 and 11).
// One step of blunder or surge is half a deviation of judgment or will (7.5 points on attempt()'s scale of 100 and 15).
export const STEP_MIND = 7.5;
// one step of resisting: a tenth off a wound's damage (the fighter's woundRes), a fifth off a foe's stare (fear), a tenth
// off an illness's monthly toll; poison and mind wait for the systems that read them
export const RESIST_STEP = { wounds: 0.1, fear: 0.2, illness: 0.1, poison: 0.1, mind: 0.1 };
// the held list of a family's ladder at (rank, lv): every rung below at Lv 10, the top at its level
export function heldOfRung(ix, fam, rank, lv) {
  const out = [];
  if (!(lv >= 1) || rankIx(rank) < 0) return out;
  for (const r of RANKS) {
    const id = rungOf(ix, fam, r);
    if (rankIx(r) < rankIx(rank)) { if (id) out.push({ id, lv: MAX_LV }); continue; }
    if (r === rank && id) out.push({ id, lv: Math.min(MAX_LV, lv) });
    break;
  }
  return out;
}
// the slot an effect's sources stack in, under one cap
export function srcKey(e) {
  switch (e && e.type) {
    case 'edge': case 'blunder': case 'surge': case 'growth': return e.type + '|' + e.tag;
    case 'fight': return 'fight|' + e.tag + '|' + (e.part || 'atk');
    case 'resist': return 'resist|' + e.of;
    case 'aura': return 'aura|' + e.of + '|' + e.scale;
    case 'stat': return 'stat|' + e.stat;
    case 'social': return 'social|' + e.group;
    case 'economy': return 'economy|' + e.of + '|' + (e.tag || 'all');
    default: return null;
  }
}
export function gather(ix, held) {
  const src = {}, unlocks = [], actives = [], triggers = [];
  for (const h of held || []) {
    const s = ix.BY[h && h.id]; if (!s) continue;
    for (const e of effectsAt(s, h.lv)) {
      if (e.type === 'perk') continue;
      if (e.type === 'unlock') { if (!unlocks.includes(e.what)) unlocks.push(e.what); continue; }
      if (e.type === 'active') { actives.push({ id: s.id, name: e.name, limit: e.limit || null, do: e.do }); continue; }
      if (e.type === 'trigger') { triggers.push({ id: s.id, on: e.on, limit: e.limit || null, do: e.do }); continue; }
      const k = srcKey(e); if (!k) continue;
      (src[k] = src[k] || []).push([+e.v || 0, s.rank, s.id]);
    }
  }
  return { src, unlocks, actives, triggers };
}
// the diminishing weights of the sources, largest first (vocab.json's caps.weights; stack's own when missing)
const weightsOf = ix => (ix.V.caps && ix.V.caps.weights) || undefined;
// the capped total of a list of sources ([v, rank, id]) under the cap of kind `what` for the highest rank among them
export function capped(ix, what, list) {
  if (!list || !list.length) return 0;
  const cap = capOf(ix, what, topRank(list.map(x => x[1])));
  return stack(list.map(x => x[0]), cap, weightsOf(ix));
}
// the sources of several slots together (a check reads its key, its family, its focus, its group and 'all')
const srcOf = (G, type, tags, part) => { const out = []; for (const t of tags) { const l = G.src[type + '|' + t + (part ? '|' + part : '')]; if (l) out.push(...l); } return out; };
// what a check on these tags gets from edges: at most the cap (+12 up to S, rising above it)
export const edgeOn = (ix, G, tags) => capped(ix, 'edge', srcOf(G, 'edge', tags));
// steps of blunder (positive: fewer blunders) or surge on these tags: at most 2 either way (up to S)
export const stepsOn = (ix, G, what, tags) => capped(ix, 'blunderSurge', srcOf(G, what, tags));
// steps of resisting one thing: at most 3 (up to S)
export const resistOn = (ix, G, of) => capped(ix, 'resist', G.src['resist|' + of] || []);
// a fight's parts in fight-worth points for these weapon tags, each part's sources weighed 1, 1/2, 1/4, 1/8; then the
// whole at most the share of the fighter's own worth (+15% up to S), scaled down evenly when over (a malus likewise,
// down to minus it)
export const FIGHT_PARTS = ['atk', 'def', 'burst', 'adapt'];
export function fightOn(ix, G, tags, worth) {
  const out = { atk: 0, def: 0, burst: 0, adapt: 0, total: 0, cap: 0 };
  let all = [];
  for (const part of FIGHT_PARTS) {
    const l = srcOf(G, 'fight', tags, part); if (!l.length) continue;
    all = all.concat(l); out[part] = stack(l.map(x => x[0]), Infinity, weightsOf(ix));
  }
  if (!all.length) return out;
  const cap = Math.max(0, +worth || 0) * capOf(ix, 'fightShare', topRank(all.map(x => x[1])));
  const t = FIGHT_PARTS.reduce((s, p) => s + out[p], 0);
  const k = t > cap ? cap / t : t < -cap ? -cap / t : 1;
  if (k !== 1) for (const p of FIGHT_PARTS) out[p] *= k;
  out.total = FIGHT_PARTS.reduce((s, p) => s + out[p], 0); out.cap = cap;
  return out;
}
// auras: the best one of each `of` and scale counts; at most +3 steps of any `of` (up to S)
export function aurasOn(ix, G) {
  const by = {}, lists = {};
  for (const k of Object.keys(G.src).sort()) {
    if (!k.startsWith('aura|')) continue;
    const [, of, scale] = k.split('|'), l = G.src[k], best = l.reduce((b, x) => (x[0] > b[0] ? x : b), l[0]);
    (lists[of] = lists[of] || []).push(best); (by[of] = by[of] || {})[scale] = best[0];
  }
  for (const of in by) { const l = lists[of]; by[of].total = Math.min(capOf(ix, 'aura', topRank(l.map(x => x[1]))), l.reduce((s, x) => s + x[0], 0)); }
  return by;
}
// the capability profile (§3.6), every bonus capped; what A.CAPS(p) returns. fight holds each weapon tag's parts before
// the share of worth (that needs the fighter: fightOn); G keeps the sources, for a check's or a fight's own tags.
export function profile(ix, held) {
  const G = gather(ix, held);
  const P = { held: (held || []).map(h => ({ id: h.id, lv: h.lv })), edges: {}, fight: {}, blunder: {}, surge: {}, resist: {}, growth: {}, stat: {}, social: {}, economy: {}, auras: aurasOn(ix, G), unlocks: G.unlocks, actives: G.actives, triggers: G.triggers };
  const W = weightsOf(ix);
  for (const k of Object.keys(G.src).sort()) {
    const [type, a, b] = k.split('|'), l = G.src[k];
    if (type === 'edge') P.edges[a] = capped(ix, 'edge', l);
    else if (type === 'blunder' || type === 'surge') P[type][a] = capped(ix, 'blunderSurge', l);
    else if (type === 'resist') P.resist[a] = capped(ix, 'resist', l);
    else if (type === 'growth') P.growth[a] = capped(ix, 'growth', l);
    else if (type === 'stat') P.stat[a] = capped(ix, 'stat', l);
    else if (type === 'social') P.social[a] = stack(l.map(x => x[0]), Infinity, W);
    else if (type === 'economy') P.economy[a + (b && b !== 'all' ? ':' + b : '')] = stack(l.map(x => x[0]), Infinity, W);
    else if (type === 'fight') { const f = P.fight[a] = P.fight[a] || { atk: 0, def: 0, burst: 0, adapt: 0 }; f[b] = stack(l.map(x => x[0]), Infinity, W); }
  }
  P.G = G;
  return P;
}
// the release's knacks as the rungs carry them (§7): rows [threshold, name, text, fx] by key, the threshold the read of
// the rung's rank at the band's level (C Lv 1: 35, B Lv 1: 55, A Lv 1: 72, S1's crossings), in order of threshold
export function perkRows(ix) {
  const out = {};
  for (const s of ix.skills) {
    if (!s.family || !HUMAN.includes(s.rank)) continue;
    for (const b of s.levels || []) for (const e of b.effects || []) if (e.type === 'perk' && e.key) (out[e.key] = out[e.key] || []).push([value(s.rank, b.at), e.name || '', e.text || '', e.fx || {}]);
  }
  for (const k in out) out[k].sort((a, b) => a[0] - b[0]);
  return out;
}
