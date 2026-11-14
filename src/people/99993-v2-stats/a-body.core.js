// v2 stats, part 1: the body. Every person has v2 genes and a v2 body (src/people/engine/body.js, races.js) in real units.
//
// The adapter (docs/v2/LANES.md, the owner's "Stats" decision): the old 0-100 stats stay for the 5,487 events and the
// systems that read them, but for the player they are DERIVED from the body, by percentile, once a month:
//
//   st[s] = pot[s] x 0.78 x grow(age) x T[s]
//     pot[s]   the old genetic potential; the v2 gene is sqrt(pot / race mean), so a person keeps their place in their race
//     grow     v2's physical maturity curve (races.js), ^0.75, held at 1 from the peak on (the old ageFactor does the fading)
//     T[s]     conditioning: cond^0.4 for the body (v2 cond runs 1 .. ~3.8 for lift), a training factor for the mind
//
// Anything that writes p.st (training, fx { str: 1 }, the old breakthroughs) is read back next month as a change of
// conditioning, never above the v2 ceiling (only v2 breakthroughs raise that). The old yearly growth of a child is off for
// a person with a body: the v2 curve grows them. NPCs get the same body lazily, as a pure view computed from their old
// stats (no state, no draws), so thousands of people cost nothing to save. Genes the old game never had (height curve,
// toughness, judgment, presence, cunning, ceilings, talents) come from v2's makeGenes with a generator seeded from the
// game's seed and the person's id: no A.rand draw, so the world's dice don't move.
const V2 = A.V2, B = V2.body, RC = V2.races, RNG = V2.rng;
const VS = A.V2S = A.V2S || {};
VS.VERSION = 1;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const r4 = x => Math.round(x * 1e4) / 1e4;

// ---- races: the game's races onto v2 bodies -------------------------------------------------------------------------
// v2 has human, orc, dwarf, elf, giant, halfOrc. The game also has half-elves (and features may add more): those are made
// here, a half-elf as the geometric mean of a human and an elf, anything unknown as a human. Each game race gets its own
// v2 entry 'ardan_<race>' that keeps v2's body plan but takes the game's growing years (ageScale = grown / 20) and heights.
VS.BASE = { human: 'human', elf: 'elf', dwarf: 'dwarf', orc: 'orc', giant: 'giant', halforc: 'halfOrc', halfelf: ['human', 'elf'] };
const blend = (a, b) => {
  const g = (x, y) => typeof x === 'number' ? Math.sqrt(x * y) : x;
  const o = JSON.parse(JSON.stringify(a));
  for (const k of ['base', 'sexFactor', 'limit', 'mental']) for (const j in o[k]) o[k][j] = g(a[k][j], b[k][j]);
  o.bmi = (a.bmi + b.bmi) / 2; return o;
};
VS.raceKey = function (race) {
  const key = 'ardan_' + race;
  if (RC.RACES[key]) return key;
  const R = GD.RACES[race] || GD.RACES.human, base = VS.BASE[race];
  let src = Array.isArray(base) ? blend(RC.RACES[base[0]], RC.RACES[base[1]]) : JSON.parse(JSON.stringify(RC.RACES[base] || RC.RACES.human));
  const h = R.height || [160, 172], sd = R.hsd || 6;
  src.name = R.name || src.name;
  src.ageScale = Math.max(0.5, (R.grown || 20) / 20);
  src.adultAge = R.grown || 20;
  src.height = { male: [h[1], sd], female: [h[0], sd] };
  RC.RACES[key] = src;
  return key;
};
for (const r in GD.RACES) VS.raceKey(r);

// ---- the mapping ----------------------------------------------------------------------------------------------------
// which v2 attribute each old stat is read from
VS.ATTR = { str: 'lift', spd: 'sprint', ins: 'reaction', sta: 'march', int: 'wits', wil: 'will' };
VS.PHYS = ['str', 'spd', 'ins', 'sta'];
VS.MIND = ['int', 'wil'];
VS.K_COND = 0.4;      // st ~ cond^0.4: v2's whole range of training (x3.8 lift) is x1.7 on the old scale
// how far each body attribute moves for a given place among one's own race and age (v2: strength varies more than
// speed: body.js SPREAD). Grown men in a fresh world run p10..p90 = 0.64..1.56 of typical on the old scale (seed 32), so
// lift and march follow it one for one: lift p10..p90 = 83..203 kg, march 18..44 km. (Playtest 2: K = 2 for lift and
// 1.5 for march made p90 a 315 kg lifter and a 55 km marcher, and the player's 1.5 of typical a 250 kg one.)
VS.KAPPA = { lift: 1, sprint: 0.7, march: 1, reaction: 0.9, toughness: 1.5 };
VS.raceMean = (p, s) => 42 + ((GD.RACES[p.race] || GD.RACES.human).mods[s] || 0);
VS.sex = p => (p.sex === 'F' ? 'female' : 'male');
VS.humanAge = (p, age) => age / RC.RACES[VS.raceKey(p.race)].ageScale;
// growth on the old scale: v2's physical maturity, ^0.75 (matches the old curve within a few points), 1 from the peak
VS.grow = function (p, age) {
  const k = VS.raceKey(p.race), ha = VS.humanAge(p, age);
  return ha >= 25 ? 1 : Math.pow(RC.physicalMaturity(k, age), 0.75);
};
// the old engine's own untrained curve (A.yearGrowth's target), used only to read an old save's child fairly
VS.oldCurve = function (p, age) {
  const R = GD.RACES[p.race] || GD.RACES.human, m = clamp(age / R.grown, 0, 1);
  return age <= R.grown ? 0.08 + 0.62 * Math.pow(m, 1.1) : 0.78;
};
VS.potOf = (p, s) => Math.max(5, (p.pot && p.pot[s]) || VS.raceMean(p, s));

// seeded genes (v2 makeGenes), the same every time for this world and person
VS.seedOf = p => RNG.hashStr(String(A.S && A.S.seed != null ? A.S.seed : 'ardan') + '|v2body|' + p.id);
VS.baseGenes = function (p) {
  const g = B.makeGenes(RNG.makeRng(VS.seedOf(p)), VS.raceKey(p.race), VS.sex(p));
  if (p.app && +p.app.height > 0) {
    const R = RC.RACES[VS.raceKey(p.race)], [m, sd] = R.height[VS.sex(p)];
    g.adultHeight = +p.app.height; g.heightZ = (g.adultHeight - m) / sd;
  }
  return g;
};
// v2 genes that follow the old potential (so inheritance, blood, quirks and old breakthroughs carry over)
VS.fillGenes = function (p, g) {
  for (const s of VS.PHYS) g[VS.ATTR[s]] = clamp(Math.sqrt(VS.potOf(p, s) / VS.raceMean(p, s)), 0.6, 1.6);
  g.toughness = clamp((g.toughness + Math.sqrt(VS.potOf(p, 'sta') / VS.raceMean(p, 'sta'))) / 2, 0.6, 1.6);
  const R = RC.RACES[VS.raceKey(p.race)], iq = s => R.mental[VS.ATTR[s]] + (VS.potOf(p, s) - VS.raceMean(p, s)) * 15 / 11;
  g.wits = iq('int'); g.will = iq('wil');
  g.learning = (g.learning + g.wits) / 2;
  g.judgment = (g.judgment + R.mental.judgment + (VS.potOf(p, 'int') + VS.potOf(p, 'ins') - VS.raceMean(p, 'int') - VS.raceMean(p, 'ins')) * 7.5 / 11) / 2;
  g.cunning = (g.cunning + R.mental.cunning + (VS.potOf(p, 'ins') - VS.raceMean(p, 'ins')) * 15 / 11) / 2;
  g.presence = (g.presence + R.mental.presence + ((p.looks != null ? p.looks : 50) - 50)) / 2;
  return g;
};
// training factor T[s] as the old stats read now: st / (pot x 0.78 x grow); for a child against the old curve, never < 1
VS.readT = function (p, s, st, age) {
  const kid = age <= ((GD.RACES[p.race] || GD.RACES.human).grown);
  const want = VS.potOf(p, s) * (kid ? VS.oldCurve(p, age) : 0.78 * VS.grow(p, age));
  const t = st / Math.max(0.01, want);
  return kid ? Math.max(1, t) : clamp(t, 0.5, 3);
};
const condOf = t => Math.pow(t, 1 / VS.K_COND);
const tOf = c => Math.pow(c, VS.K_COND);

// a fresh body for p, read from their old stats (an old save, an heir, or the view of an NPC)
VS.readBody = function (p) {
  const age = A.age(p), g = VS.fillGenes(p, VS.baseGenes(p)), body = B.newBody(), mt = {};
  for (const s of VS.PHYS) body.cond[VS.ATTR[s]] = condOf(VS.readT(p, s, (p.st && p.st[s]) || 0, age));
  body.cond.toughness = Math.sqrt(body.cond.march);
  for (const s of VS.MIND) mt[s] = VS.readT(p, s, (p.st && p.st[s]) || 0, age);
  // an old body trained past v2's natural ceiling keeps what it has: the ceiling is raised to fit
  const v = { race: VS.raceKey(p.race), sex: VS.sex(p), age, genes: g, body };
  for (const a of B.PHYS) { const cap = B.ceiling(v, a); if (body.cond[a] > cap) body.ceilBoost[a] = body.cond[a] / cap; }
  return { g, body, mt };
};

// ---- the player's stored body ---------------------------------------------------------------------------------------
VS.isPC = p => !!(p && A.S && p.id === A.S.pc);
// p.v2 = { v, mig, g (genes the old game never had), c (cond), cb (ceilBoost), bt (breakthroughs), mt, last (st at sync) }
VS.migrate = function (p) {
  const { g, body, mt } = VS.readBody(p);
  const keep = {};
  for (const k in g) if (k !== 'aptitude' && typeof g[k] === 'number') keep[k] = r4(g[k]);
  keep.aptitude = {}; for (const k in g.aptitude) keep.aptitude[k] = r4(g.aptitude[k]);
  const c = {}, cb = {};
  for (const a of B.PHYS) { c[a] = r4(body.cond[a]); cb[a] = r4(body.ceilBoost[a]); }
  p.v2 = { v: VS.VERSION, mig: A.S.year, g: keep, c, cb, bt: [], mt: { int: r4(mt.int), wil: r4(mt.wil) }, last: {} };
  for (const s of GD.STATS) p.v2.last[s] = p.st[s];
  return p.v2;
};
// the old base stat derived from the body (before the old ageFactor, traits and wounds)
VS.derive = function (p, s, age) {
  const V = p.v2, T = VS.PHYS.includes(s) ? tOf(V.c[VS.ATTR[s]]) : V.mt[s];
  // never past the old engine's own cap (A.train and fx stop at 1.02 x potential): v2 breakthroughs raise the potential
  return Math.min(VS.potOf(p, s) * 1.02, VS.potOf(p, s) * 0.78 * VS.grow(p, age) * T);
};
// once a month for the player: read what the old code did to p.st into the body, then write p.st from the body
VS.sync = function (p) {
  if (!p || !p.alive || !p.st || !p.pot) return;
  const V = p.v2 && p.v2.v === VS.VERSION ? p.v2 : VS.migrate(p), age = A.age(p);
  const v = VS.vperson(p, age);
  for (const s of GD.STATS) {
    const was = V.last[s], now = p.st[s];
    if (was == null || Math.abs(now - was) < 1e-9) continue;
    // a change made by the old code: the stat it wants, as conditioning (or the mind's training)
    // A change is kept as the same change to the grown body: training factor T moves by delta / (pot x 0.78), not by
    // delta / (pot x 0.78 x grow). Read against the child's own small base, a +1 at five was +24% conditioning that
    // grew with the child into +10 at twenty (playtest 2: an untrained 17-year-old copyist lifting 250 kg, and
    // v2sDerive's lift falling from 18 to 25 because the stat had hit the old cap of 1.02 x potential by 18).
    // The training factor is held under that cap, so growing up still shows.
    const g = VS.grow(p, age), adult = VS.potOf(p, s) * 0.78;
    const want = Math.max(0, VS.derive(p, s, age) / Math.max(0.01, g) + (now - was));
    const base = adult, capT = 1.02 / 0.78;
    if (VS.PHYS.includes(s)) {
      const a = VS.ATTR[s], cap = B.ceiling(v, a);
      V.c[a] = r4(clamp(condOf(Math.min(capT, want / Math.max(0.01, base))), 0.5, cap));
      if (a === 'march') V.c.toughness = r4(clamp(Math.sqrt(V.c.march), 0.5, B.ceiling(v, 'toughness')));
    } else V.mt[s] = r4(clamp(want / Math.max(0.01, base), 0.5, capT));
  }
  for (const s of GD.STATS) { p.st[s] = Math.round(VS.derive(p, s, age) * 100) / 100; V.last[s] = p.st[s]; }
};
// the v2 person object the body functions take; for the player its body objects ARE p.v2's (so v2 breakthroughs stick)
VS.vperson = function (p, age = A.age(p)) {
  let g, body, mt;
  if (p.v2 && p.v2.v === VS.VERSION) {
    g = VS.fillGenes(p, Object.assign({}, p.v2.g, { aptitude: p.v2.g.aptitude || {} }));
    body = { cond: p.v2.c, ceilBoost: p.v2.cb, breakthroughs: p.v2.bt, skills: {}, wounds: [], knowledge: 0 };
    mt = p.v2.mt;
  } else ({ g, body, mt } = VS.readBody(p));
  return { id: p.id, race: VS.raceKey(p.race), sex: VS.sex(p), age, genes: g, body, mt, mentalXp: {} };
};

// ---- the view: what the body is now, in real units -----------------------------------------------------------------
// The old multipliers (age fading, wounds, traits, weariness) are in A.stat and nowhere else, so the view reads them from
// there: m = A.stat / base stat, shown as conditioning x m^1.33. So the sheet, a fight and an event check agree.
VS.HOURS = [[0, 0], [5, 30], [15, 200], [30, 800], [45, 2500], [60, 6000], [75, 12000], [88, 25000], [100, 50000]];
VS.hoursOf = function (v) {
  v = clamp(+v || 0, 0, 110);
  const H = VS.HOURS;
  if (v >= 100) return 50000 * Math.pow(2, (v - 100) / 12);
  for (let i = 1; i < H.length; i++) if (v <= H[i][0]) {
    const [x0, y0] = H[i - 1], [x1, y1] = H[i], f = (v - x0) / (x1 - x0);
    return y0 === 0 ? y1 * f * f : Math.exp(Math.log(y0) + (Math.log(y1) - Math.log(y0)) * f);
  }
  return 50000;
};
VS.cache = new WeakMap();
VS.view = function (p) {
  if (!p || !p.st) return null;
  const age = A.age(p);
  // the key is everything the view reads (A.stat carries wounds, traits, blood, weariness and fading), so a cached view is
  // never stale and the engine reads the same numbers whether or not anything was drawn in between
  const key = [A.S.seed, age, p.race, p.sex, GD.STATS.map(s => A.stat(p, s) + ':' + (p.pot ? p.pot[s] : '')).join(','), p.looks,
    p.app ? p.app.height : '', p.v2 ? JSON.stringify(p.v2) : ''].join('|');
  const hit = VS.cache.get(p);
  if (hit && hit.key === key) return hit.v;
  const v = VS.vperson(p, age), R = RC.RACES[v.race];
  // The body as it is, by percentile: each attribute is the race's typical body at this age (v2's base x maturity),
  // times (the effective old stat / a typical person's of this race and age)^K. A.stat holds what the old code does
  // with age, wounds, traits and weariness, so the sheet, a fight and an event check read the same person; and a person
  // keeps their place: twice the typical strength is (2^2) four times the typical lift.
  v.ratio = {};
  for (const s of GD.STATS) {
    const typ = VS.raceMean(p, s) * 0.78 * VS.grow(p, age);
    v.ratio[s] = clamp(A.stat(p, s) / Math.max(0.5, typ), 0.05, 12);
  }
  const genes = Object.assign({}, v.genes, { lift: 1, sprint: 1, march: 1, reaction: 1, toughness: 1 });
  const cond = {};
  for (const s of VS.PHYS) cond[VS.ATTR[s]] = Math.pow(v.ratio[s], VS.KAPPA[VS.ATTR[s]]);
  cond.toughness = Math.pow(v.ratio.sta, VS.KAPPA.toughness) * Math.pow(v.genes.toughness, 0.5);
  v.genes = genes;
  v.body = Object.assign({}, v.body, { cond, skills: {} });
  // fading belongs to the old code (in A.stat), so the v2 curves are read at no later than the peak
  const peak = 28 * R.ageScale;
  v.age = Math.min(age, peak);
  v.realAge = age;
  // minds: the race's mind plus 15 points a standard deviation of the old stat (log scale, sd 0.26 as the potentials),
  // grown by v2's mental maturity at the real age; judgment, memory, presence and cunning from the genes
  const mm = RC.mentalMaturity(v.race, age), mmPeak = RC.mentalMaturity(v.race, v.age);
  v.mentalXp = {};
  for (const s of VS.MIND) {
    const k = VS.ATTR[s], want = (R.mental[k] + 15 * clamp(Math.log(v.ratio[s]) / 0.26, -4, 4)) * mm;
    v.mentalXp[k] = want - v.genes[k] * mmPeak;
  }
  v.mentalXp.judgment = RC.judgmentAgeBonus(v.race, age) - RC.judgmentAgeBonus(v.race, v.age);
  for (const k of ['learning', 'presence', 'cunning']) v.mentalXp[k] = v.genes[k] * (mm - mmPeak);
  v.gear = 'none';
  VS.cache.set(p, { key, v });
  return v;
};
VS.hoursMap = function (p) {
  const out = {};
  for (const k in (p.skills || {})) out[k] = VS.hoursOf(A.skill ? A.skill(p, k) : p.skills[k]);
  return out;
};
VS.stats = p => { const v = VS.view(p); return v ? B.stats(v, v.age) : null; };
VS.height = function (p) {
  const v = VS.view(p); if (!v) return 0;
  return Math.round(v.genes.adultHeight * RC.heightFraction(v.race, v.sex, v.realAge));
};
VS.describe = function (p) {
  const v = VS.view(p); if (!v) return null;
  const d = B.describe(v);
  d.height = VS.height(p) + ' cm';
  if (v.realAge < 6) for (const k of B.MENTAL) d[k] = { words: 'too young to tell', rarity: '', score: 0 };
  return d;
};
VS.skillInfo = function (p, k) {
  const v = VS.view(p); if (!v) return null;
  return B.skillInfo(Object.assign({}, v, { body: Object.assign({}, v.body, { skills: VS.hoursMap(p) }) }), k);
};

// ---- a v2 breakthrough (attempt() won by a surge of will against long odds) ----------------------------------------
VS.STAT_OF_SKILL = { sword: 'str', axe: 'str', melee: 'str', unarmed: 'str', spear: 'str', shield: 'sta', athletics: 'sta', survival: 'sta',
  bow: 'ins', xbow: 'ins', throwing: 'ins', dagger: 'spd', stealth: 'spd', riding: 'spd', tracking: 'ins' };
VS.breakthrough = function (p, s, mag, note) {
  if (!VS.isPC(p) || !GD.STATS.includes(s)) return false;
  VS.sync(p);
  const v = VS.vperson(p), a = VS.ATTR[s];
  if (VS.PHYS.includes(s)) B.breakthrough(v, a, mag, note || '');
  else { p.v2.mt[s] = r4(p.v2.mt[s] * (1 + 0.05 * mag)); p.v2.bt.push({ attr: a, magnitude: mag, age: A.age(p), note: note || '' }); }
  for (const k in p.v2.c) p.v2.c[k] = r4(p.v2.c[k]);
  for (const k in p.v2.cb) p.v2.cb[k] = r4(p.v2.cb[k]);
  // the old scale sees it as potential, as the release's own breakthroughs do
  p.pot[s] = Math.min(220, Math.round(p.pot[s] + 3 * mag));
  if (p.v2.bt.length > 24) p.v2.bt.splice(0, p.v2.bt.length - 24);
  VS.sync(p);
  return true;
};

// ---- hooks ------------------------------------------------------------------------------------------------------
// the player's body is read and written once a month, before the month's other work reads the stats
A.onMonth.unshift(pc => { try { VS.sync(pc); } catch (e) { console.error('v2 body', e); } });
// a child with a body grows by the v2 curve, not by the old yearly step
const yearGrowth = A.yearGrowth;
A.yearGrowth = function (p) {
  if (p && p.v2 && p.v2.v === VS.VERSION && VS.isPC(p)) { VS.sync(p); return; }
  return yearGrowth.apply(this, arguments);
};
// a new life starts with its body (and an old save's player gets one on its first month, VS.sync)
if (A.newGame) {
  const ng = A.newGame;
  A.newGame = function () {
    const r = ng.apply(this, arguments);
    try { const pc = A.pc(); if (pc) VS.sync(pc); } catch (e) { console.error('v2 body', e); }
    return r;
  };
}
