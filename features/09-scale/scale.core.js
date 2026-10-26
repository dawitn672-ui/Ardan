// 09-scale: the engine at scale (stage 0 of docs/plan/world-expansion-architecture.md).
//
// Exact rewrites, indexes and memos for the questions the engine asks most often, so that a world ten times larger
// (3,060 provinces, 341 realms) plays a month and a year turn in reasonable time. Nothing here may change a result:
// at any size, the same seed reaches the same state and the same random stream, bit for bit.
//
//   A.SCALE_OFF = true     every rewritten function runs the release's original code (the reference path)
//   A.SCALE_CHECK = true   every memoised or rewritten answer is also worked out the original way and compared; a
//                          difference is recorded in A.SCALE.bad, logged, and thrown
//
// How the memos stay right:
//   - The province-by-owner index is keyed by the state object, the province array, its length and a land version.
//     Every write of a province's owner during play bumps the land version (patches.mjs; test.mjs scaleSites checks
//     the built game has no other write site). The only unpatched writers, 43's W.vary and 70's FR.make, run inside
//     A.initWorld, and the indexes are not used at all between A.newState / A.deserialize and the first day of play.
//   - The house-by-realm index likewise, with a house version bumped where play creates a house.
//   - As a net under both, the first thing each day does is compare the indexes with the world. A difference means a
//     write site was missed: it is counted in A.SCALE.stats.missed (and recorded as bad in check mode) and the index
//     is rebuilt, so a missed site can never leak past the day it happened.
const SC = A.SCALE = A.SCALE || {};
SC.ep = { land: 0, house: 0, realm: 0 };
SC.live = false;
SC.bad = [];
SC.stats = { land: 0, house: 0, missed: 0, checks: 0, by: {} };
if (A.SCALE_OFF == null) A.SCALE_OFF = false;
if (A.SCALE_CHECK == null) A.SCALE_CHECK = false;
A.scaleLand = () => { SC.ep.land++; };
A.scaleHouse = () => { SC.ep.house++; };
const on = () => SC.live && !A.SCALE_OFF;

// ---------------------------------------------------------------- check mode
const sameList = (a, b) => {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
};
const ids = v => Array.isArray(v) ? '[' + v.map(x => x && typeof x === 'object' ? x.id : String(x)).join(',') + ']' : String(v);
SC.fail = function (what, detail) {
  const msg = `[scale] ${what}: ${detail}`;
  if (SC.bad.length < 50) SC.bad.push(msg);
  console.error(msg);
  if (A.SCALE_CHECK) throw new Error(msg);
};
const check = (what, args, fast, slow, same = sameList) => {
  SC.stats.checks++;
  SC.stats.by[what] = (SC.stats.by[what] || 0) + 1;
  if (!same(fast, slow)) SC.fail(what, `(${args}) gave ${ids(fast)}, the original gives ${ids(slow)}`);
};

// ---------------------------------------------------------------- when the indexes may be used
// not between the start of a new world or a load and its first day: 43 and 70 move land inside A.initWorld without
// telling anyone, and nothing in that window needs to be fast
const newState = A.newState;
A.newState = function () { SC.live = false; return newState.apply(this, arguments); };
const deserialize = A.deserialize;
A.deserialize = function () { SC.live = false; return deserialize.apply(this, arguments); };
const dayTick = A.dayTick;
A.dayTick = function () {
  if (A.S && A.S.prov) { SC.live = true; if (!A.SCALE_OFF) verifyLand(); }
  return dayTick.apply(this, arguments);
};
// the houses, the realm list and the embargo list are checked against the world once a month (a full pass over the
// houses costs a millisecond at 10x, too much for every day)
const monthTick = A.monthTick;
A.monthTick = function () {
  if (A.S && A.S.prov && SC.live && !A.SCALE_OFF) { verifyHouses(); verifyRealms(); verifyEmb(); }
  return monthTick.apply(this, arguments);
};

// ---------------------------------------------------------------- provinces by owner
// by: owner -> its provinces in S.prov order; nb: owner -> the owners next to it (raw: before the alive filter)
let LI = null;
const land = SC.land = function () {
  const S = A.S, P = S.prov;
  if (LI && LI.S === S && LI.prov === P && LI.n === P.length && LI.ep === SC.ep.land) return LI;
  const by = new Map(), own = new Array(P.length);
  let idOk = true;
  for (let i = 0; i < P.length; i++) {
    const p = P[i], o = p.owner;
    own[i] = o;
    if (p.id !== i) idOk = false;
    let L = by.get(o); if (!L) by.set(o, L = []); L.push(p);
  }
  SC.stats.land++;
  return (LI = { S, prov: P, n: P.length, ep: SC.ep.land, by, own, nb: new Map(), idOk });
};
function verifyLand() {
  const S = A.S;
  if (!LI || LI.S !== S || LI.prov !== S.prov || LI.n !== S.prov.length || LI.ep !== SC.ep.land) return;
  const P = S.prov, own = LI.own;
  for (let i = 0; i < P.length; i++) if (P[i].owner !== own[i]) {
    SC.stats.missed++;
    SC.ep.land++;
    SC.fail('land index', `province ${i} changed hands (${own[i]} -> ${P[i].owner}) without A.scaleLand()`);
    return;
  }
}

const realmProvs = A.realmProvs;
A.realmProvs = function (rid) {
  if (!on()) return realmProvs.apply(this, arguments);
  const L = land().by.get(rid), v = L ? L.slice() : [];
  if (A.SCALE_CHECK) check('A.realmProvs', rid, v, realmProvs.apply(this, arguments));
  return v;
};

const neighbors = A.neighbors;
A.neighbors = function (rid) {
  if (!on()) return neighbors.apply(this, arguments);
  const I = land();
  let raw = I.nb.get(rid);
  if (!raw) {
    // the release's scan, over this realm's provinces only (the same provinces in the same order)
    const set = new Set(), P = I.prov;
    for (const p of I.by.get(rid) || []) for (const j of p.adj.concat(p.sea || [])) { const o = P[j].owner; o !== rid && o !== 'unclaimed' && set.add(o); }
    I.nb.set(rid, raw = [...set]);
  }
  const v = [];
  for (const o of raw) { const r = A.realm(o); r && r.alive && v.push(o); }
  if (A.SCALE_CHECK) check('A.neighbors', rid, v, neighbors.apply(this, arguments));
  return v;
};

// claims are a handful of keys; the release filtered every province. Integer keys iterate in ascending order and a
// province's id is its index, so the provinces come out in the same order.
const claimsOn = A.claimsOn;
A.claimsOn = function (a, b) {
  if (!on() || !land().idOk) return claimsOn.apply(this, arguments);
  const r = A.realm(a);
  let v;
  if (!r || !r.claims) v = [];
  else {
    const S = A.S, P = S.prov, cl = r.claims;
    v = [];
    for (const k in cl) { const y = cl[k], p = P[k]; if (p && y && p.owner === b && S.year - y < 60) v.push(p); }
  }
  if (A.SCALE_CHECK) check('A.claimsOn', a + ',' + b, v, claimsOn.apply(this, arguments));
  return v;
};

// ---------------------------------------------------------------- houses by realm
const BIG = ['noble', 'gentry_mil', 'clan'];
const counts = h => !h.extinct && h.kind !== 'royal' && (h.great !== false || BIG.includes(h.kind));
let HI = null;
const houses = SC.houses = function () {
  const S = A.S, H = S.houses;
  if (HI && HI.S === S && HI.H === H && HI.ep === SC.ep.house) return HI;
  const by = new Map(), all = [], key = [];
  for (const id in H) {
    const h = H[id], k = counts(h) ? h.realm : NONE;
    all.push(h); key.push(k);
    if (k !== NONE) { let L = by.get(k); if (!L) by.set(k, L = []); L.push(h); }
  }
  SC.stats.house++;
  return (HI = { S, H, ep: SC.ep.house, by, all, key });
};
const NONE = {};
function verifyHouses() {
  const S = A.S, H = S && S.houses;
  if (!HI || HI.S !== S || HI.H !== H || HI.ep !== SC.ep.house) return;
  let i = 0;
  const { all, key } = HI;
  for (const id in H) {
    const h = H[id];
    if (i >= all.length || h !== all[i] || (counts(h) ? h.realm : NONE) !== key[i]) { i = -1; break; }
    i++;
  }
  if (i === all.length) return;
  SC.stats.missed++;
  SC.ep.house++;
  SC.fail('house index', 'a house was created, or changed realm, kind or standing, without A.scaleHouse()');
}

const realmHouses = A.realmHouses;
A.realmHouses = function (rid) {
  if (!on() || !A.S.houses) return realmHouses.apply(this, arguments);
  const L = houses().by.get(rid), v = L ? L.slice() : [];
  if (A.SCALE_CHECK) check('A.realmHouses', rid, v, realmHouses.apply(this, arguments));
  return v;
};

// ---------------------------------------------------------------- realms as a list
// S.realms in for-in order. Realms are added only by A.createRealm (and A.initWorld, which makes a new S.realms);
// none is ever deleted.
let RL = null;
const realmList = SC.realmList = function () {
  const R = A.S.realms;
  if (RL && RL.R === R && RL.ep === SC.ep.realm) return RL.list;
  const list = [];
  for (const id in R) list.push(R[id]);
  RL = { R, ep: SC.ep.realm, list };
  return list;
};
function verifyRealms() {
  const R = A.S.realms;
  if (!RL || RL.R !== R || RL.ep !== SC.ep.realm) return;
  let i = 0;
  for (const id in R) { if (R[id] !== RL.list[i]) { i = -1; break; } i++; }
  if (i === RL.list.length) return;
  SC.stats.missed++;
  SC.ep.realm++;
  SC.fail('realm list', 'a realm was added to S.realms without A.createRealm');
}
const createRealm = A.createRealm;
A.createRealm = function () { try { return createRealm.apply(this, arguments); } finally { SC.ep.realm++; } };

// how many live realms embargo r, and how many it holds trade pacts with: what A.priceTarget and A.tradeMul counted by
// walking every realm (and calling A.hasTrade for each). Null means "count it the original way".
// The embargoes are counted over the realms that have any embargo on their books (EL), in realm order. EL may hold
// realms whose embargoes have all lapsed or been lifted (each is checked in full), but must hold every realm with one:
// A.sign, the only place an embargo is written, adds the realm (A.scaleEmbAdd).
const hasTrade = A.hasTrade, own = Object.prototype.hasOwnProperty;
let EL = null;
const anyKey = o => { for (const k in o) return true; return false; };
const embList = function () {
  const R = A.S.realms;
  if (EL && EL.R === R && EL.ep === SC.ep.realm) return EL.list;
  EL = { R, ep: SC.ep.realm, list: realmList().filter(o => o.tr && o.tr.emb && anyKey(o.tr.emb)) };
  return EL.list;
};
A.scaleEmbAdd = function (r) {
  if (!EL || EL.R !== A.S.realms || EL.ep !== SC.ep.realm || EL.list.includes(r)) return;
  // keep realm order: the counts do not depend on it, but a rebuild gives the same list
  EL = null;
};
function verifyEmb() {
  if (!EL || EL.R !== A.S.realms || EL.ep !== SC.ep.realm) return;
  for (const o of realmList()) if (o.tr && o.tr.emb && anyKey(o.tr.emb) && !EL.list.includes(o)) {
    SC.stats.missed++;
    EL = null;
    SC.fail('embargo list', `${o.id} has an embargo that A.sign did not report`);
    return;
  }
}
const embOf = r => {
  const Y = A.S.year, rid = r.id;
  let n = 0;
  for (const o of embList()) if (o.alive && o.tr && o.tr.emb && o.tr.emb[rid] > Y) n++;
  return n;
};
const slowEmbPact = r => {
  let emb = 0, pact = 0;
  for (const id in A.S.realms) { const o = A.S.realms[id]; o.alive && (o.tr && o.tr.emb && o.tr.emb[r.id] > A.S.year && emb++, A.hasTrade(r.id, id) && pact++); }
  return [emb, pact];
};
A.scaleEmbPact = function (r) {
  if (!on() || A.hasTrade !== hasTrade) return null;
  const S = A.S, R = S.realms, Y = S.year, ra = A.realm(r.id), tr = ra && ra.pacts && ra.pacts.trade;
  let pact = 0;
  if (tr) for (const k in tr) if (own.call(R, k) && R[k].alive && tr[k] && tr[k] > Y) pact++;
  const v = [embOf(r), pact];
  if (A.SCALE_CHECK) check('embargoes and pacts', r.id, v, slowEmbPact(r), (a, b) => a[0] === b[0] && a[1] === b[1]);
  return v;
};
A.scaleEmb = function (r) {
  if (!on()) return null;
  const v = embOf(r);
  if (A.SCALE_CHECK) check('embargoes', r.id, v, slowEmbPact(r)[0], (a, b) => a === b);
  return v;
};

// ---------------------------------------------------------------- divisions
// the release gathered every realm's divisions (and built its by-place and by-id indexes) with for-in over S.realms;
// the realm list gives the same realms in the same order
const allDivs = A.allDivs;
A.allDivs = function () {
  if (!on()) return allDivs.apply(this, arguments);
  const out = [];
  for (const r of realmList()) if (r.alive && r.forces) for (const d of r.forces.divs) out.push(d);
  if (A.SCALE_CHECK) check('A.allDivs', '', out, allDivs.apply(this, arguments));
  return out;
};
const divById = A.divById;
A.divById = function (id) {
  if (!on()) return divById.apply(this, arguments);
  if (!id) return null;
  if (!A._idIdx) {
    const m = new Map;
    for (const r of realmList()) if (r.forces) for (const d of r.forces.divs) m.set(d.id, d);
    A._idIdx = m;
  }
  const v = A._idIdx.get(id) || null;
  if (A.SCALE_CHECK) { const keep = A._idIdx; A._idIdx = null; const w = divById.call(this, id); A._idIdx = keep; check('A.divById', id, v, w, (a, b) => a === b); }
  return v;
};
const divsAtIdx = A.divsAtIdx;
A.divsAtIdx = function (loc) {
  if (!on()) return divsAtIdx.apply(this, arguments);
  if (!A._locIdx) {
    const m = new Map;
    for (const r of realmList()) if (r.alive && r.forces) for (const d of r.forces.divs) { let L = m.get(d.loc); L || m.set(d.loc, L = []); L.push(d); }
    A._locIdx = m;
  }
  const v = A._locIdx.get(loc) || [];
  if (A.SCALE_CHECK) { const keep = A._locIdx; A._locIdx = null; const w = divsAtIdx.call(this, loc); A._locIdx = keep; check('A.divsAtIdx', loc, v, w); }
  return v;
};

// ---------------------------------------------------------------- supply
// who controls each province, worked out once per A.wsSupplyDay (the batch the release marks with A._relAll) and
// shared by every realm's A.supplyMap that day
let CB = null;
const relMemo = A.relMemo;
A.scaleFr = function (fr, N, codeOf, rid) {
  if (!on() || !A._relAll) return false;
  const S = A.S, P = S.prov;
  if (!CB || CB.rel !== A._relAll || CB.prov !== P || CB.n !== N) {
    const keys = [], ix = new Int32Array(N), m = new Map();
    for (let i = 0; i < N; i++) {
      const c = A.ctrl(P[i]);
      let j = m.get(c);
      if (j === undefined) { j = keys.length; keys.push(c); m.set(c, j); }
      ix[i] = j;
    }
    CB = { rel: A._relAll, prov: P, n: N, keys, ix, m };
  }
  const K = CB.keys, codes = new Uint8Array(K.length), ix = CB.ix;
  if (A.relMemo === relMemo && rid != null) {
    // codeOf(o) is: friend 1, else foe 2, else military access 3, else 0 (A.relMemo over the day's A._relAll); most
    // controllers are none of these, so set the few that are
    const M = A._relAll, me = A.realm(rid), at = o => CB.m.get(o);
    let j = at(rid); if (j !== undefined) codes[j] = 1;
    if (M.fr[rid]) for (const o of M.fr[rid]) { j = at(o); if (j !== undefined) codes[j] = 1; }
    if (M.ho[rid]) for (const o of M.ho[rid]) { if (!o || o === rid) continue; j = at(o); if (j !== undefined && !codes[j]) codes[j] = 2; }
    const acc = me && me.tr && me.tr.access;
    if (acc) for (const o in acc) { if (!(acc[o] > S.year)) continue; j = at(o); if (j !== undefined && !codes[j]) codes[j] = 3; }
    // a controller that is not a string (none in the release) is asked directly
    for (let k = 0; k < K.length; k++) if (typeof K[k] !== 'string') codes[k] = codeOf(K[k]);
  } else for (let k = 0; k < K.length; k++) codes[k] = codeOf(K[k]);
  for (let i = 0; i < N; i++) fr[i] = codes[ix[i]];
  if (A.SCALE_CHECK) { SC.stats.checks++; SC.stats.by['supply control'] = (SC.stats.by['supply control'] || 0) + 1; for (let i = 0; i < N; i++) if (fr[i] !== codeOf(A.ctrl(P[i]))) { SC.fail('supply control', `province ${i}: code ${fr[i]}, the original gives ${codeOf(A.ctrl(P[i]))}`); break; } }
  return true;
};
// A.supplyMap compares five arrays of the map's size with yesterday's to see whether its flow can be reused; four of
// them are byte arrays, compared here four bytes at a time (the same answer)
const sameArr = A.sameArr;
A.sameArr = function (x, y) {
  if (A.SCALE_OFF || !(x instanceof Uint8Array) || !(y instanceof Uint8Array) || x.length !== y.length || x.byteOffset & 3 || y.byteOffset & 3) return sameArr.apply(this, arguments);
  const n = x.length, w = n >> 2, a = new Uint32Array(x.buffer, x.byteOffset, w), b = new Uint32Array(y.buffer, y.byteOffset, w);
  let v = true;
  for (let i = 0; i < w; i++) if (a[i] !== b[i]) { v = false; break; }
  if (v) for (let i = w << 2; i < n; i++) if (x[i] !== y[i]) { v = false; break; }
  if (A.SCALE_CHECK) check('A.sameArr', n, v, sameArr.apply(this, arguments), (p, q) => p === q);
  return v;
};

// ---------------------------------------------------------------- industry
// A.indCount summed a realm's industry over every province of the map (A.forcesYear runs it up to twelve times for
// every realm at the turn of the year); the realm's own provinces, in the same order, give the same sums
const indCount = A.indCount;
A.indCount = function (r) {
  if (!on()) return indCount.apply(this, arguments);
  let civ = 0, mil = 0, ore = 0;
  for (const p of land().by.get(r.id) || []) p.occ && A.hostile(r.id, p.occ) || (civ += p.civ || 0, mil += p.mil || 0, (p.terr === 'mountains' || p.terr === 'hills') && (ore += p.terr === 'mountains' ? 2 : 1));
  r.race === 'dwarf' && (ore += 6), r.pacts && r.pacts.trade && (ore += Object.keys(r.pacts.trade).length * 2);
  r.ind.civ = civ, r.ind.mil = mil, r.ind.ore = ore;
  if (A.SCALE_CHECK) { indCount.apply(this, arguments); check('A.indCount', r.id, [civ, mil, ore], [r.ind.civ, r.ind.mil, r.ind.ore]); }
  return r.ind;
};

// ---------------------------------------------------------------- armies
// who holds what, by holder (A.ctrl: the occupier, else the owner), in S.prov order. Built once per phase of the day in
// which nothing changes hands: the armies' thinking (the release marks it with A._think) or the supply pass (A._relAll)
let CI = null;
const ctrlIndex = function () {
  const key = A._think || A._relAll, S = A.S;
  if (!key) return null;
  if (CI && CI.key === key && CI.prov === S.prov && CI.n === S.prov.length) return CI.by;
  const by = new Map();
  for (const p of S.prov) { const c = A.ctrl(p); let L = by.get(c); if (!L) by.set(c, L = []); L.push(p); }
  CI = { key, prov: S.prov, n: S.prov.length, by };
  return by;
};
// the enemy whose nearest held province is nearest the army: the release walked the whole map once per enemy
const armyEnemy = A.armyEnemy;
A.armyEnemy = function (a) {
  const by = on() && ctrlIndex();
  if (!by) return armyEnemy.apply(this, arguments);
  const en = A.enemiesOf(a.realm);
  let v;
  if (!en.length) v = null;
  else if (a.order.enemy && en.includes(a.order.enemy)) v = a.order.enemy;
  else {
    let best = null, bd = 1 / 0;
    for (const e of en) {
      const r = A.realm(e);
      if (!r || !r.alive) continue;
      for (const p of by.get(e) || []) { const d = A.wsDist(a.loc, p.id); d < bd && (bd = d, best = e); }
    }
    v = best || en[0];
  }
  if (A.SCALE_CHECK) check('A.armyEnemy', a.id, v, armyEnemy.apply(this, arguments), (x, y) => x === y);
  return v;
};
// the provinces a realm holds (with its war friends) that touch the enemy: only provinces held by a friend can be on
// the list, so only those are looked at, in S.prov order
const frontProvs = A.frontProvs;
A.frontProvs = function (rid, enemy) {
  const by = on() && land().idOk && ctrlIndex();
  if (!by) return frontProvs.apply(this, arguments);
  const S = A.S, R2 = A.relMemo(rid), E = enemy ? A.relMemo(enemy) : null, cand = [];
  for (const [c, L] of by) if (R2.fr(c)) for (const p of L) cand.push(p.id);
  cand.sort((x, y) => x - y);
  const out = [];
  for (const i of cand) {
    const p = S.prov[i];
    p.adj.some(j => { const c = A.ctrl(S.prov[j]); return enemy ? c === enemy || R2.ho(c) && E.fr(c) : R2.ho(c); }) && out.push(p.id);
  }
  if (A.SCALE_CHECK) check('A.frontProvs', rid + '>' + enemy, out, frontProvs.apply(this, arguments));
  return out;
};
// friend and foe of the holder of each province, remembered for one A.wsPath search
A.scaleRel = function (memo, c, rid) {
  if (A.SCALE_OFF) return [rid && A.friendly(c, rid), rid && A.hostile(rid, c)];
  let r = memo.get(c);
  if (r === undefined) memo.set(c, r = [rid && A.friendly(c, rid), rid && A.hostile(rid, c)]);
  else if (A.SCALE_CHECK) check('A.wsPath relations', c + ',' + rid, r, [rid && A.friendly(c, rid), rid && A.hostile(rid, c)]);
  return r;
};

// ---------------------------------------------------------------- the year's pairs
// one realm's pass over every other realm in A.politicsYear: the rulers' personas, remembered for the pass (each is
// asked for once per pair). Only the pair weighing runs inside the pass, and it changes no ruler.
let PM = null;
A.scalePairs = function (open) {
  if (PM) { if (A.rulerPersona === PM.memo) A.rulerPersona = PM.fn; PM = null; }
  if (!open || !on() || typeof A.rulerPersona !== 'function') return;
  const fn = A.rulerPersona, m = new Map();
  const memo = function (rid) {
    if (arguments.length !== 1) return fn.apply(this, arguments);
    let v = m.get(rid);
    if (v === undefined) m.set(rid, v = fn.call(this, rid));
    else if (A.SCALE_CHECK) check('A.rulerPersona in the year\'s pairs', rid, v, fn.call(this, rid), (x, y) => x === y);
    return v;
  };
  PM = { fn, memo };
  A.rulerPersona = memo;
};
// whatever happens inside, the pass is closed when the year's politics end
const politicsYear = A.politicsYear;
A.politicsYear = function () { try { return politicsYear.apply(this, arguments); } finally { A.scalePairs(0); } };
