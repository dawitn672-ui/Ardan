// The standing military of a realm (the owner's order 95, D-194; order 13's feudal armies; order 93's level anchors).
//
// "Knights are considered powerful and are much smaller units, top 50-3000 within a kingdom, whilst an elite is usually
// top ten in a kingdom. A regular soldier numbers in the 10s-100 thousands based on the kingdom."
//
// A.MIL reads a realm's might from its size, wealth and kind (data/military/standing.json). Counts only: no soldier, knight
// or champion is an object, and no person is made for the elite.
//   A.MIL.normal(r)      the regular soldiers a realm of its people, purse and kind keeps (pure): the host the release's
//                        recruiting fills (A.forcesAI, through A.MIL.want) and the court's sellswords measure against
//   A.MIL.seedArmy(L)    the same for a realm of the lore at the world's birth (its people, income and kind as written)
//   A.MIL.want(r)        the crown's yearly choice (A.WHY, kind 'standing'): raise toward the normal host, keep what it
//                        has, or cut regiments. Returns the host A.forcesAI recruits to
//   A.MIL.knights(r)     the realm's knights, 50 to 3,000 by its people and wealth (pure); A.MIL.knightsBy(r) dealt to the
//                        crown (its royal knights), the elite orders (their brethren) and the houses by rung (order 13)
//   A.MIL.levels(r)      the levels its soldiers, knights and elite stand at, inside order 93's bands by its quality
//   A.MIL.divFactor(d)   what a division's knights add to its blows and its stand: Lanchester's host rule (A.POWER's N^1.35)
//                        on the men counted at their worth, a knight at his band's worth against a soldier's
//   A.MIL.elite(r)       the realm's best: its own people who stand at the elite's level, filled to the realm's count
//                        (A.MIL.eliteCount: no set number, it emerges from how hard the level is to reach) by named champions
//                        kept as seeds (name and level from the realm and the seed; nothing stored)
//   A.MIL.year(r)        the year's reading kept on the realm (r.kn: the knights by command), at the year's turn, the
//                        world's birth and a save's load, so a battle reads it the same way whether a page is drawn or not
// State (optional; old saves load, the save step 'standing', version 23): r.kn = { y, t, o, c, h: { houseId: n } }.
// Nothing here draws a die but A.WHY.decide's own (only when the crown's options come close).
(function () {
  const D = A.DATA && A.DATA['military/standing'];
  if (!D) { console.error('[standing] data/military/standing.json is missing'); return; }
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const MIL = A.MIL = { D };
  const hash = s => { let h = 2166136261 >>> 0; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const RX = r => (typeof r === 'string' ? A.realm(r) : r);

  // ---------------------------------------------------------------- size, wealth, kind
  MIL.kindOf = type => (D.kinds[type] ? type : D.fallback);
  MIL.K = r => D.kinds[MIL.kindOf(r && r.type)];
  MIL.has = r => !!(r && r.alive !== false && !r.isRebel);
  MIL.pop = function (r) {
    r = RX(r); if (!r) return 0;
    if (A.MEN && A.MEN.pop) return A.MEN.pop(r);
    return r.provPop || r.pop || 0;
  };
  // the realm's purse: its income as the realm was made, followed with its people (a realm that lost half its land keeps
  // half its purse), so a year's tax law or a bad harvest does not swing its host
  MIL.income = function (r) {
    r = RX(r); if (!r) return 0;
    const base = r.baseIncome || r.income || 0;
    return r.basePop > 0 && r.provPop > 0 ? base * r.provPop / r.basePop : base;
  };
  MIL.wealth = (pop, income) => clamp((pop > 0 ? income / pop : 0) / D.wealthMid, D.wealthClamp[0], D.wealthClamp[1]);
  MIL.size = function (pop, income, type) {
    const K = D.kinds[MIL.kindOf(type)];
    let n = pop * K.rate;
    if (pop >= D.floorPop) n = Math.max(n, D.floor);
    n = Math.min(n, income * K.pay / D.upkeep, D.cap);
    return Math.max(0, Math.round(n / 10) * 10);
  };
  MIL.seedArmy = L => (L ? MIL.size(+L.pop || 0, +L.income || 0, L.type) : 0);
  MIL.normal = r => { r = RX(r); return r ? MIL.size(MIL.pop(r), MIL.income(r), r.type) : 0; };

  // ---------------------------------------------------------------- knights
  // the elite orders of a realm: their brethren in the field (the order's division), else the order's written size
  MIL.orderMen = function (r) {
    r = RX(r); if (!r) return 0;
    let n = 0, seen = new Set();
    for (const d of (r.forces && r.forces.divs) || []) if (d && d.elite) { n += d.men || 0; seen.add(d.elite); }
    if (!r.forces) for (const k of Object.keys(GD.ORDERS || {})) { const o = GD.ORDERS[k]; if (o && o.realm === r.id && !seen.has(k)) n += o.size || 0; }
    return Math.round(n);
  };
  MIL.knights = function (r) {
    r = RX(r); if (!r) return 0;
    const K = MIL.K(r), pop = MIL.pop(r);
    const n = Math.round(clamp(pop / K.perKnight * Math.sqrt(MIL.wealth(pop, MIL.income(r))), K.kMin, K.kMax));
    return Math.max(n, MIL.orderMen(r) + K.kMin);
  };
  const RUNGW = c => D.rungs[c] || 0;
  // largest remainder, the order fixed by the keys
  const deal = (n, parts) => {
    const tot = parts.reduce((a, x) => a + x[1], 0);
    if (!(tot > 0) || n <= 0) return parts.map(x => [x[0], 0]);
    const raw = parts.map(([k, w]) => { const v = n * w / tot; return [k, Math.floor(v), v - Math.floor(v)]; });
    let left = n - raw.reduce((a, x) => a + x[1], 0);
    const ord = raw.slice().sort((a, b) => b[2] - a[2] || (a[0] < b[0] ? -1 : 1));
    for (let i = 0; left > 0 && ord.length; i = (i + 1) % ord.length, left--) ord[i][1]++;
    return raw.map(x => [x[0], x[1]]);
  };
  // every holder of knights in the realm: the crown's royal knights, the orders, and each landed house by its rung
  MIL.knightsBy = function (r) {
    r = RX(r); if (!r) return { t: 0, o: 0, c: 0, houses: [] };
    const t = MIL.knights(r), o = Math.min(t, MIL.orderMen(r)), K = MIL.K(r);
    const hs = [];
    for (const id of Object.keys((A.S && A.S.houses) || {}).sort()) {
      const h = A.S.houses[id];
      if (!h || h.extinct || h.realm !== r.id || h.kind === 'royal' || id === r.house) continue;
      const w = RUNGW(h.rung); if (w > 0) hs.push([id, w]);
    }
    const rest = t - o, crown0 = hs.length ? Math.round(rest * K.crownShare) : rest;
    const houses = deal(rest - crown0, hs).filter(x => x[1] > 0);
    const given = houses.reduce((a, x) => a + x[1], 0);
    return { t, o, c: rest - given, houses };
  };
  // the command a house's knights ride with: its own when it holds of the crown, its liege's when he does, else the crown's
  const cmdOf = (hid, rid) => {
    const h = A.S.houses[hid]; if (!h) return null;
    if (A.CMD && A.CMD.isTic) {
      if (A.CMD.isTic(h, rid)) return hid;
      const lg = h.liege && A.S.houses[h.liege];
      if (lg && A.CMD.isTic(lg, rid)) return h.liege;
    }
    return null;
  };
  // the year's reading on the realm: knights by the command they ride with (the crown's c, a tenant-in-chief's h[id])
  MIL.reading = function (r) {
    const B = MIL.knightsBy(r), h = {};
    let c = B.c;
    for (const [hid, n] of B.houses) { const k = cmdOf(hid, r.id); if (k) h[k] = (h[k] || 0) + n; else c += n; }
    return { y: A.S ? A.S.year : 0, t: B.t, o: B.o, c, h };
  };
  MIL.year = function (r) {
    r = RX(r); if (!r || r.alive === false) return;
    r.kn = MIL.reading(r);
  };
  MIL.yearAll = function () {
    const S = A.S; if (!S || !S.realms) return;
    for (const id of Object.keys(S.realms).sort()) { const r = S.realms[id]; if (r && r.alive !== false) MIL.year(r); }
  };
  // the reading as kept, else as it would be now (an old save before its load step; pure)
  MIL.kn = r => (r && r.kn && r.kn.h ? r.kn : r ? MIL.reading(r) : null);

  // ---------------------------------------------------------------- levels (A.POWER's ladder, order 93's bands)
  const L0 = D.levels, Q = D.quality;
  const norm = (x, spec) => clamp(((+x || 0) - spec[0]) / (spec[1] - spec[0]), 0, 1) * spec[2];
  MIL.quality = function (r) {
    r = RX(r); if (!r) return 0.5;
    const pop = MIL.pop(r), inc = MIL.income(r);
    const q = (Q.base || 0) + norm(r.armyQ || 1, Q.armyQ) + norm(r.forces ? r.forces.xp : 20, Q.xp) + norm(pop > 0 ? inc / pop / D.wealthMid : 1, Q.wealth) + ((Q.race || {})[r.race] || 0);
    return clamp(q, 0, 1);
  };
  const lerp = (b, q) => Math.round(b[0] + (b[1] - b[0]) * q);
  MIL.bands = r => Object.assign({}, L0, (r && D.raceBands && D.raceBands[r.race]) || {});
  MIL.levels = function (r) {
    r = RX(r);
    const q = MIL.quality(r), B = MIL.bands(r);
    const soldier = lerp(B.soldier, q), knight = lerp(B.knight, q), top = lerp(B.elite, q);
    return { q: Math.round(q * 100) / 100, soldier, knight, knightPast: Math.max(knight + 1, B.knightPast || knight), pastShare: B.pastShare || 0, elite: [B.elite[0], Math.max(B.elite[0], top)] };
  };
  // a man's worth in conscripts at a level: the square root of the ladder's might (A.POWER: might is worth squared)
  MIL.worth = L => (A.POWER && A.POWER.mightOf ? Math.sqrt(A.POWER.mightOf(L)) : 1);
  // a host's might by the ladder's host rule: its men at their worth, counted as soldiers, to the power 1.35
  MIL.host = function (r, men, knights) {
    r = RX(r);
    const lv = MIL.levels(r), ws = MIL.worth(lv.soldier), wk = MIL.worth(lv.knight);
    men = men != null ? men : (r ? r.army || 0 : 0);
    knights = Math.min(men, knights != null ? knights : (r ? MIL.knights(r) : 0));
    const eff = Math.max(0, men - knights) + knights * wk / ws;
    return { men, knights, eff: Math.round(eff), might: (A.POWER ? A.POWER.mightOf(lv.soldier) : 1) * Math.pow(Math.max(1, eff), 1.35) };
  };

  // ---------------------------------------------------------------- knights in a division (counts, read in a fight)
  const tplKind = d => { const t = A.tplOf ? A.tplOf(d) : null; return t ? t.kind : null; };
  const wt = d => (d.men || 0) * (tplKind(d) === 'horse' || tplKind(d) === 'guard' ? D.horseShare : 1);
  // the knights riding in a division: its command's knights shared over the command's divisions by men, the lances and
  // the guard taking a larger share (an order's brethren and conscript foot are counted apart: they carry their own)
  MIL.divKnights = function (d) {
    if (!d || d.elite || d.call || !(d.men > 0)) return 0;
    const r = A.realm(d.r); if (!r || !r.forces) return 0;
    const kn = MIL.kn(r); if (!kn) return 0;
    const own = d.own || null, K = own ? (kn.h[own] || 0) : kn.c;
    if (!(K > 0)) return 0;
    let W = 0;
    for (const x of r.forces.divs) if (x && !x.elite && !x.call && (x.own || null) === own) W += wt(x);
    return W > 0 ? Math.min(d.men * 0.5, K * wt(d) / W) : 0;
  };
  MIL.divFactor = function (d) {
    const k = MIL.divKnights(d);
    if (!(k > 0)) return 1;
    const lv = MIL.levels(A.realm(d.r)), ratio = MIL.worth(lv.knight) / Math.max(1e-6, MIL.worth(lv.soldier));
    return clamp(Math.pow((d.men - k + k * ratio) / d.men, 1.35), 1, 1.6);
  };

  // the soldiers by kind (order 97: infantry, archers, cavalry; mages when there are any), from the war map's battalions
  MIL.split = function (r) {
    r = RX(r); const out = { infantry: 0, archers: 0, cavalry: 0 };
    for (const d of (r && r.forces && r.forces.divs) || []) {
      const s = A.divS ? A.divS(d) : null; if (!s || !s.n) { out.infantry += d.men || 0; continue; }
      const c = s.cats || {};
      out.cavalry += (d.men || 0) * (c.horse || 0) / s.n; out.archers += (d.men || 0) * (c.missile || 0) / s.n;
      out.infantry += (d.men || 0) * ((c.foot || 0) + (c.beast || 0)) / s.n;
    }
    for (const k in out) out[k] = Math.round(out[k]);
    return out;
  };

  // ---------------------------------------------------------------- the crown's choice: raise, keep or cut
  const T = D.decide;
  MIL.want = function (r) {
    r = RX(r); if (!r) return 0;
    const normal = MIL.normal(r), M = A.MEN && A.MEN.of ? A.MEN.of(r) : null, now = M ? M.standing : (r.army || 0);
    if (!A.WHY || !A.WHY.decide || !(normal > 0)) return normal;
    const war = A.atWar ? A.atWar(r.id).length > 0 : false, inc = Math.max(1, r.income || MIL.income(r) || 1);
    const short = now < normal * 0.92 ? 1 - now / normal : 0, over = now > normal * 1.3 ? now / normal - 1 : 0;
    // the spears across its borders: its rivals' and enemies' hosts against its own
    let foes = 0;
    const fx = new Set((r.rivals || []).concat(war ? [].concat(...A.atWar(r.id).map(w => (w.att.includes(r.id) ? w.def : w.att))) : []));
    for (const id of fx) { const o = A.realm(id); if (o && o.alive) foes = Math.max(foes, o.army || 0); }
    const threat = foes > now * 1.2 ? Math.min(1.5, Math.log(foes / Math.max(1, now))) : 0;
    const poor = r.treasury < inc * 0.3 || (r.debt || 0) > inc ? 1 : 0, rich = r.treasury > inc * 2 ? 1 : 0;
    const src = { t: 'standing', y: A.S.year, r: r.id };
    const why = (w, kind, label) => ({ kind, weight: w, source: src, label, pub: 0 });
    const raise = [], keep = [why(T.keep, 'cost', 'the regiments it has are paid for')], cut = [];
    if (short) raise.push(why(T.short * short * 2, 'want', `the realm keeps fewer spears than a realm of its size and purse should (${MIL.K(r).why})`));
    if (war) raise.push(why(T.war, 'reckoning', 'the realm is at war'));
    if (threat) raise.push(why(T.threat * threat, 'fear', 'a rival keeps a larger host across the border'));
    if (rich) raise.push(why(T.rich, 'coin', 'the treasury is full'));
    if (poor) { keep.push(why(T.poor * 0.5, 'cost', 'the treasury is thin')); cut.push(why(T.poor, 'coin', 'the treasury cannot pay the regiments')); }
    if (r.stability < 35) keep.push(why(T.unrest, 'reckoning', 'the realm is unquiet: no new taxes for new regiments'));
    if (over && !war) cut.push(why(T.over * Math.min(1, over), 'coin', 'the realm keeps more men than its size and purse can bear'));
    const opts = [{ id: 'raise', reasons: raise }, { id: 'keep', reasons: keep }];
    if (!war && (over || poor)) opts.push({ id: 'cut', reasons: cut });
    const rec = A.WHY.decide(r.id, 'standing', opts, { r: r.id, band: 0.5, logIf: x => x.chose !== 'keep' });
    const c = rec ? rec.chose : 'keep';
    return c === 'raise' ? normal : c === 'cut' ? Math.min(normal * (over ? 1 : T.cutTo), now / 1.5) : now;
  };

  // ---------------------------------------------------------------- the elite: the realm's few best
  const ELC = new Map();
  // The owner's correction to order 97: "there's no set number. It's just a certain level of understanding how hard it is
  // to reach that level. An empire can have 30. It can also have 2. Also 72, despite how incredibly unlikely it is." So no
  // range and no cap: the count EMERGES from how hard the elite's level is to reach in that realm. A.MIL.eliteMean(r) is
  // the expected number with its reasons (its people, its make, its great families, its wealth and schools, its orders,
  // its years of war); A.MIL.eliteCount(r) is a seeded draw around it with a heavy tail: a gamma-weighted Poisson (a
  // negative binomial), so two, thirty or seventy-two can each happen and each is as rare as it should be. Pure: its own
  // stream from the world's seed, the realm and the decade (a realm's count moves with its make, not each year's luck).
  const E0 = D.elite;
  MIL.eliteMean = function (r) {
    r = RX(r); if (!r) return { mean: 0, why: [] };
    const why = [], f = (x, label) => { if (Math.abs(x - 1) >= 0.05) why.push([label, Math.round(x * 100) / 100]); return x; };
    const pop = MIL.pop(r);
    let m = E0.perMillion * Math.pow(Math.max(0, pop) / 1e6, E0.popPow);
    const make = (E0.make || {})[MIL.kindOf(r.type)] || 1, race = (E0.race || {})[r.race] || 1;
    m *= f(make, make > 1 ? 'a martial make: ' + MIL.K(r).why : 'a make that breeds few fighters: ' + MIL.K(r).why);
    m *= f(race, race > 1 ? 'its people are long-lived or made strong' : 'its people');
    // great families and their blood: dukes, marquises and counts, each house a line that trains its sons from the cradle
    let great = 0;
    for (const id of Object.keys((A.S && A.S.houses) || {})) { const h = A.S.houses[id]; if (h && !h.extinct && h.realm === r.id && (E0.greatRungs || []).includes(h.rung)) great++; }
    m *= f(1 + E0.perGreatHouse * great, `${great} great house${great === 1 ? '' : 's'} with blood and arms-masters of their own`);
    // wealth and schooling: a head's wealth, and the schools of war it keeps
    m *= f(Math.pow(MIL.wealth(pop, MIL.income(r)), E0.wealthPow), 'its wealth a head');
    let war = 0;
    try { for (const a of (A.academiesOf ? A.academiesOf(r.id) : [])) if (a && (E0.schools || []).includes(a.type)) war++; } catch (e) { war = 0; }
    m *= f(1 + E0.perSchool * war, `${war} school${war === 1 ? '' : 's'} of war`);
    // the orders that pick the best of the realm and drill them past their bodies
    let orders = 0;
    for (const k of Object.keys(GD.ORDERS || {})) if (GD.ORDERS[k] && GD.ORDERS[k].realm === r.id) orders++;
    m *= f(1 + E0.perOrder * orders, `${orders} knightly order${orders === 1 ? '' : 's'}`);
    // events: years of war breed veterans (the forces' drill and battles, 0-200)
    const xp = (r.forces && r.forces.xp) || 20;
    m *= f(1 + E0.perXp * Math.max(0, xp - 20) / 100, 'its long wars have bred veterans');
    why.sort((a, b) => Math.abs(Math.log(b[1])) - Math.abs(Math.log(a[1])));
    return { mean: Math.max(0, m), why };
  };
  const rng = key => { let a = hash(key) || 1; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  // a gamma(k, 1/k) weight (mean 1) by Marsaglia and Tsang, then a Poisson count of its mean: nothing bounds it
  const gamma = (k, R) => {
    if (k < 1) return gamma(k + 1, R) * Math.pow(R() || 1e-12, 1 / k);
    const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d);
    for (let g = 0; g < 100; g++) {
      let x, v;
      do { const u1 = R() || 1e-12, u2 = R(); x = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); v = 1 + c * x; } while (v <= 0);
      v = v * v * v;
      const u = R() || 1e-12;
      if (Math.log(u) < 0.5 * x * x + d - d * v + d * Math.log(v)) return d * v / k;
    }
    return 1;
  };
  // the Poisson walk from zero (a mean past 700 would underflow e^-mean; such a world takes its mean, rounded)
  const poisson = (lam, R) => {
    if (!(lam > 0)) return 0;
    if (lam > 700) return Math.round(lam);
    const u = R();
    let k = 0, p = Math.exp(-lam), c = p;
    while (u > c && p > 0) { k++; p *= lam / k; c += p; }
    return k;
  };
  MIL.eliteDraw = function (r, mean) {
    r = RX(r); if (!r || !A.S) return 0;
    const R = rng(`${A.S.seed}|${r.id}|elite-count|${Math.floor((A.S.year || 0) / 10)}`);
    return poisson(mean * gamma(E0.spread, R), R);
  };
  MIL.eliteCount = function (r) {
    r = RX(r); if (!r) return 0;
    return MIL.eliteDraw(r, MIL.eliteMean(r).mean);
  };
  const seedName = (r, i) => {
    const N = A.NAMES, key = `${A.S.seed}|${r.id}|elite|${i}`, h = hash(key);
    const female = h % 7 === 0;
    let given = '', fam = '';
    try {
      if (N && N.ok && N.ok()) {
        const v = N.sees(r.cult, r.id), L = female ? v.female : v.male, F = v.family || [];
        given = L.length ? L[hash(key + 'g') % L.length] : '';
        fam = F.length ? F[hash(key + 'f') % F.length] : '';
      }
    } catch (e) { given = ''; }
    return { name: (given || 'a champion') + (fam ? ' ' + fam : ''), female };
  };
  MIL.elite = function (r) {
    r = RX(r); if (!r || !A.S) return [];
    const key = [A.S.seed, A.S.year, A.S.nextId, r.id, r.ruler].join('|'), hit = ELC.get(r.id);
    if (hit && hit.key === key && hit.S === A.S) return hit.v;
    const lv = MIL.levels(r), [lo, hi] = lv.elite, n = MIL.eliteCount(r), out = [];
    // his own people who stand among them (an order's master, a General, a champion of the realm, the player himself)
    if (A.LV && A.LV.level) for (const p of Object.values(A.S.people || {})) {
      if (!p || !p.alive || p.realm !== r.id || !p.st || A.age(p) < 16) continue;
      const L = A.LV.level(p);
      if (L >= lo) out.push({ pid: p.id, name: A.fullName ? A.fullName(p, false) : p.given, level: L });
    }
    out.sort((a, b) => b.level - a.level || (a.pid < b.pid ? -1 : 1));
    // the rest are champions the realm knows by name: their level spread down from the realm's best
    for (let i = 0; out.length < n; i++) {
      const s = seedName(r, i), j = hash(`${A.S.seed}|${r.id}|elv|${i}`) % 9;
      const L = clamp(Math.round(hi - (hi - lo) * (0.08 + 0.85 * (out.length) / Math.max(1, n - 1)) + j - 4), lo, hi);
      out.push({ seed: i, name: s.name, level: L, role: D.roles[i] || 'a knight of great name' });
    }
    out.sort((a, b) => b.level - a.level);
    if (ELC.size > 80) ELC.clear();
    ELC.set(r.id, { key, S: A.S, v: out });
    return out;
  };

  // ---------------------------------------------------------------- when the reading is kept
  // the world's birth (after the realms, their houses and orders), the save step for an older state
  A.on && A.on('worldInit', function () { try { MIL.yearAll(); } catch (e) { console.error('[standing] world', e); } });
  const SV = A.V2SAVE;
  if (SV && Array.isArray(SV.STEPS) && !SV.STEPS.some(x => x[0] === 'standing')) SV.STEPS.push(['standing', S => { if (S === A.S) MIL.yearAll(); }]);
})();
