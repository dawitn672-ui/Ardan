// Skills rebuild (docs/design/skills-v2.md; the owner's answers of order 82, §15): ranked skills with levels. A skill is a
// card with a rank (D, C, B, A, S, SS, SSS, and G above them for gods and the like), a level from 1 to 10, a rarity and a
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
export const RANKS = ['D', 'C', 'B', 'A', 'S', 'SS', 'SSS', 'G'];
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
// an S1 entry (level and experience on its bar) as a rung (§7; D-NEW-1): the rung of the S1 step at its odd level, so
// what a check reads is exactly S1's on the day of the step; in C, B and A, experience past the odd level's bar is kept
// as `held` (stored experience: it lands as the even level when the rungs hold the level, step 5). Nothing is lost.
export function fromS1(s1lv, xp) {
  const r = rungOfS1(s1lv); if (!r) return null;
  xp = Math.max(0, +xp || 0);
  const c = cost(r.rank, r.lv), keep = Math.min(xp, Math.max(0, c - 1e-6));
  const out = { rank: r.rank, lv: r.lv, xp: Math.round(keep * 100) / 100 };
  const held = Math.round((xp - keep) * 100) / 100;
  if (held > 0) out.held = held;
  return out;
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
export function capOf(ix, what, topRank) {
  const C = ix.V.caps[what]; if (!C) return Infinity;
  return C[topRank] != null ? C[topRank] : C.S;
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
