// The monthly turn. One button: "Next month". Everything that happened that month comes back as a queue
// of cards shown one at a time. A busy month (a birth, a death, a hunt, news from court) brings many cards;
// a quiet month may bring one. At war, the month opens into days and weeks you step through yourself.
import { makeRng } from './rng.js';
import { createWorld, createPlayerFamily } from './world.js';
import { stats, fightingWorth, practise, train, detrain, PHYS } from './body.js';
import { notableKin, relationLabel } from './kin.js';
import { lineOfSuccession, myPlace } from './succession.js';
import { monthTick, newsFor, statusOf } from './diplomacy.js';
import { EVENTS, eligible, cardFor, resolveChoice } from './events.js';
import { renown, renownWords, recordDeed, promotionCheck } from './renown.js';
import { makeUnit, makeArmy, campaignStep, battlePhase, afterAction, CHOICES, TERRAIN } from './war.js';
const TERRAIN_AT = (k) => TERRAIN[k]?.at ?? 'in battle';
import { breakthrough } from './body.js';

export const PLANS = {
  child: { play: 'Run wild outdoors', chores: 'Help around the house', lessons: 'Sit for lessons' },
  adult: { arms: 'Train at arms', study: 'Study', work: 'Work your trade', court: 'Attend court and make friends', rest: 'Rest and recover' },
};

function makeBonds() {
  const m = new Map(); const k = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  return { get: (a, b) => m.get(k(a, b)), set: (a, b, v) => m.set(k(a, b), v), all: () => m };
}

export function createGame({ seed = 'ardan', realmId = null, estate = 'noble', sex = null, mapSize } = {}) {
  const world = createWorld({ seed, mapSize });
  const rng = makeRng(seed + ':game');
  const rid = realmId ?? rng.int(0, world.realms.length - 1);
  const fam = createPlayerFamily(world, { realmId: rid, estate, sex });
  const g = { world, rng, me: fam.me, family: fam, plan: 'play', bonds: makeBonds(), flags: {}, campaign: null, chronicle: [], monthsPlayed: 0 };
  refreshAges(g);
  for (const p of world.people.all()) if (p.deathYear != null && p.titles.length) inherit(g, p);
  tagHeirs(g);
  g.chronicle.push({ year: world.year, month: 1, text: `${fam.me.name} of House ${fam.houseName} is born in ${world.realms[rid].name}.` });
  return g;
}

function refreshAges(g) { for (const p of g.world.people.all()) p.age = g.world.year - p.birthYear + (g.world.month - 1) / 12; }

// Mark heirs of titled relatives so the family view can say "your cousin, heir to the County of X".
function tagHeirs(g) {
  for (const p of g.world.people.all()) p.heirTo = null;
  for (const p of g.world.people.all()) {
    if (!p.titles.length || p.deathYear != null || !p.house) continue;
    const h = g.world.houses.get(p.house); if (!h) continue;
    const line = lineOfSuccession(g.world.people, p, h.law, g.world.year, 1).line;
    if (line[0] && !line[0].person.titles.length) line[0].person.heirTo = p.titles[0].split(' — ')[1] ?? p.titles[0];
  }
}

function ctxFor(g) {
  const me = g.me, P = g.world.people;
  const kin = notableKin(P, me, { year: g.world.year, bonds: g.bonds });
  return { world: g.world, me, rng: g.rng, age: Math.floor(me.age), father: P.get(me.fatherId), mother: P.get(me.motherId), bonds: g.bonds, flags: g.flags, tmp: {},
    cousins: kin.filter((k) => /cousin/.test(k.relation) && k.alive), pick: (a) => a[Math.floor(g.rng.next() * a.length)] };
}

// ---------- the month ----------
export function nextMonth(g) {
  if (g.campaign) return { cards: [{ kind: 'notice', text: 'You are on campaign. Step through the days.' }] };
  const W = g.world, cards = [];
  W.month++; if (W.month > 12) { W.month = 1; W.year++; }
  g.monthsPlayed++;
  refreshAges(g);
  const me = g.me;
  // 1) your days: growth from what you actually did
  applyPlan(g);
  // 2) the family lives: births, deaths, marriages, inheritance
  cards.push(...familyMonth(g));
  // 3) the world turns; you hear only what reaches you
  const evs = monthTick(W.diplomacy, W, g.rng, W.year, W.month);
  for (const e of evs) {
    const n = newsFor(e, me.realm, g.rng);
    if (n.heard && me.age >= 6) cards.push({ kind: 'news', text: n.text, certain: n.certain });
    if (e.kind === 'war' && (e.a === me.realm || e.b === me.realm) && me.age >= 16 && me.deathYear == null) {
      const enemy = W.realms[e.a === me.realm ? e.b : e.a].name;
      const ev = EVENTS.find((x) => x.id === 'muster'); const ctx = ctxFor(g); ctx.tmp.enemy = enemy;
      cards.push({ kind: 'event', ...cardFor(ctx, ev), _ev: ev, _ctx: ctx, enemyId: e.a === me.realm ? e.b : e.a });
    }
  }
  for (const r of W.realms) {
    if (r.id === me.realm) continue;
    const rel = W.diplomacy.get(me.realm, r.id);
    if (rel.pact === 'war' && me.age >= 16 && !g.flags[`served-${r.id}-${rel.pactSince}`] && g.rng.chance(0.25) && !cards.some((c) => c.enemyId != null)) {
      g.flags[`served-${r.id}-${rel.pactSince}`] = true;
      const ev = EVENTS.find((x) => x.id === 'muster'); const ctx = ctxFor(g); ctx.tmp.enemy = r.name;
      cards.push({ kind: 'event', ...cardFor(ctx, ev), _ev: ev, _ctx: ctx, enemyId: r.id });
    }
  }
  // 4) life events: usually 0-2, more when your life is eventful
  const ctx = ctxFor(g);
  const pool = EVENTS.filter((e) => eligible(ctx, e));
  const season = [0.7, 0.8, 1, 1.1, 1.2, 1.3, 1.2, 1.4, 1.3, 1, 0.8, 0.7][W.month - 1]; // summers and harvests are busy
  const roll = g.rng.next() / season;
  const n = !pool.length ? 0 : roll < 0.12 ? 3 : roll < 0.32 ? 2 : roll < 0.62 ? 1 : 0;
  const used = new Set();
  for (let i = 0; i < n; i++) {
    const ev = g.rng.weighted(pool.filter((e) => !used.has(e.id)), (e) => e.weight); if (!ev) break;
    used.add(ev.id); const c2 = ctxFor(g);
    cards.push({ kind: 'event', ...cardFor(c2, ev), _ev: ev, _ctx: c2 });
  }
  // 5) promotions (non-linear), birthdays
  if (me.career) {
    const pr = promotionCheck(g.rng, me, { year: W.year, month: W.month, ladder: me.career.ladder, vacancy: g.rng.float(0.05, 0.6) });
    if (pr) cards.push({ kind: 'life', text: `You are raised from ${pr.from} to ${pr.to}${pr.jump > 1 ? ', skipping a rank' : ''}, ${pr.why}.` });
  }
  if (W.month === ((me.birthMonth ?? 1)) && Math.floor(me.age) > 0) cards.push({ kind: 'life', text: birthdayLine(g) });
  const quiet = cards.length ? null : quietLine(g);
  return { cards, quiet };
}

export function choose(g, card, i) {
  const out = resolveChoice(card._ctx, card._ev, i);
  if (g.flags.joinWar) { g.flags.joinWar = false; g.campaign = startCampaign(g, card.enemyId); out.text += ' (The campaign begins: step day by day or week by week.)'; }
  g.chronicle.push({ year: g.world.year, month: g.world.month, text: out.text });
  return out;
}

function applyPlan(g) {
  const me = g.me, a = me.age;
  // wounds heal with time; hands and knees may never fully mend
  me.body.wounds = me.body.wounds.filter((w) => !(g.rng.chance(['hand', 'knee'].includes(w.kind) ? 0.02 : 0.12)));
  if (a < 2) return; // infants just grow (growth comes from the body model)
  const plan = g.plan;
  const childPlay = () => { train(me, 'sprint', 0.5); train(me, 'march', 0.4); train(me, 'lift', 0.25); };
  if (a < 14) {
    if (plan === 'lessons') { practise(me, 'letters', 25); childPlay(); } else if (plan === 'chores') { train(me, 'lift', 0.6); train(me, 'march', 0.4); practise(me, 'craft', 15); } else { childPlay(); childPlay(); }
    return;
  }
  const trained = new Set();
  if (plan === 'arms') { practise(me, 'sword', 45); practise(me, 'spear', 15); for (const k of ['lift', 'toughness', 'march']) { train(me, k, 0.9); trained.add(k); } train(me, 'reaction', 0.5); trained.add('reaction'); }
  if (plan === 'study') { practise(me, 'letters', 50); practise(me, 'law', 20); me.mentalXp ??= {}; me.mentalXp.learning = (me.mentalXp.learning ?? 0) + 0.15; }
  if (plan === 'work') { practise(me, me.estate === 'commoner' ? 'smithing' : 'trade', 50); train(me, 'lift', 0.4); trained.add('lift'); me.wealth = (me.wealth ?? 0) + 1; }
  if (plan === 'court') { practise(me, 'persuasion', 30); practise(me, 'intrigue', 10); }
  if (plan === 'rest') { me.fatigue = 0; for (const w of me.body.wounds) w.healed = true; me.body.wounds = me.body.wounds.filter((w) => g.rng.chance(0.6)); }
  for (const k of PHYS) if (!trained.has(k)) detrain(me, k);
}

// births, deaths, marriages and inheritance among the people you know
function familyMonth(g) {
  const W = g.world, P = W.people, me = g.me, rng = g.rng, cards = [];
  const known = new Set(notableKin(P, me, { year: W.year, maxDegree: 4 }).map((k) => k.person.id));
  for (const p of P.all()) {
    if (p.deathYear != null || p.id === me.id) continue;
    const a = p.age;
    // medieval mortality: high in infancy, low in youth, rising after 40 (Gompertz-like)
    const q = a < 1 ? 0.012 : a < 5 ? 0.004 : a < 15 ? 0.0008 : a < 40 ? 0.0012 : 0.0012 * Math.exp((a - 40) * 0.085);
    if (rng.chance(q)) {
      p.deathYear = W.year;
      if (known.has(p.id)) {
        const rel = relationLabel(P, me, p).text;
        cards.push({ kind: 'life', text: `Your ${rel}, ${p.name}, has died${a > 60 ? ' in old age' : a < 5 ? ' of a fever' : ''}.` });
        if (p.titles.length) cards.push(...inherit(g, p));
      }
      continue;
    }
    // births to married women 18-42 whose husband lives
    if (p.sex === 'female' && a >= 18 && a <= 42 && p.spouseIds.length) {
      const h = P.get(p.spouseIds[0]);
      if (h && h.deathYear == null && rng.chance(0.014)) {
        const child = { id: W.nextId++, sex: rng.chance(0.5) ? 'male' : 'female', race: p.race, culture: p.culture, birthYear: W.year, house: h.house, titles: [], deeds: [], traits: [], memories: [], age: 0 };
        import_child(g, child, h, p);
        if (h.id === P.get(me.fatherId)?.id || known.has(p.id)) {
          const rel = relationLabel(P, me, child).text;
          cards.push({ kind: 'life', text: `A ${child.sex === 'male' ? 'boy' : 'girl'}, ${child.name}, is born: your ${rel}.` });
        }
      }
    }
  }
  if (g.flags.betrothed && !me.spouseIds.length) {
    g.flags.betrothedAt ??= W.year * 12 + W.month;
    if (W.year * 12 + W.month - g.flags.betrothedAt >= 12) {
      const sp = { id: W.nextId++, sex: me.sex === 'male' ? 'female' : 'male', race: me.race, culture: me.culture, birthYear: W.year - Math.floor(me.age) + rng.int(-3, 2), house: makeNamer(rng).house(me.culture), titles: [], deeds: [], traits: [], memories: [] };
      sp.name = makeNamer(rng).given(sp.culture, sp.sex); sp.genes = makeGenes(rng, sp.race, sp.sex); sp.body = newBody(); P.add(sp); P.marry(me, sp, W.year);
      g.flags.betrothed = false;
      cards.push({ kind: 'life', text: `You marry ${sp.name} of House ${sp.house}, as your families agreed. The feast lasts three days.` });
    }
  }
  if (W.month === 1) tagHeirs(g);
  return cards;
}
import { makeGenes, newBody } from './body.js';
import { makeNamer } from './names.js';
function import_child(g, child, father, mother) {
  child.name = makeNamer(g.rng).given(child.culture, child.sex);
  child.genes = makeGenes(g.rng, child.race, child.sex, [father, mother]); child.body = newBody();
  g.world.people.add(child); g.world.people.link(child, father, mother);
}

function inherit(g, dead) {
  const W = g.world, h = W.houses.get(dead.house); if (!h) return [];
  const r = lineOfSuccession(W.people, dead, h.law, W.year, 3);
  const heir = r.line[0]?.person; if (!heir) return [{ kind: 'life', text: `${dead.name} leaves no heir the law will accept. The title falls vacant.` }];
  heir.titles.push(...dead.titles); dead.titles = [];
  const rel = heir.id === g.me.id ? 'you' : `your ${relationLabel(W.people, g.me, heir).text}, ${heir.name},`;
  const skipped = r.skipped.length ? ` (${r.skipped.map((s) => `${s.person.name} passed over: ${s.why}`).join('; ')})` : '';
  tagHeirs(g);
  return [{ kind: 'life', text: `By ${r.law.name.toLowerCase()}, ${rel} inherit${heir.id === g.me.id ? '' : 's'} ${heir.titles[0]}${skipped}.` }];
}

function birthdayLine(g) {
  const me = g.me, s = stats(me), a = Math.floor(me.age);
  if (a <= 3) return `${me.name} turns ${a}. ${s.height} cm tall now, and into everything.`;
  if (a < 14) return `${me.name} turns ${a}: ${s.height} cm, ${s.weight} kg, and ${s.sprint > 5.5 ? 'faster than most children' : 'growing like a weed'}.`;
  return `You turn ${a}. ${s.height} cm, ${s.weight} kg.`;
}
function quietLine(g) {
  const a = g.me.age;
  return a < 3 ? 'A quiet month. You sleep, eat and grow.' : a < 14 ? g.rng.pick(['A quiet month of chores and games.', 'Rain most of the month. You learn every corner of the house.', 'Nothing much happens. You grow a little.']) : g.rng.pick(['A quiet month.', 'The days pass in work and weather.', 'Nothing of note. You keep to your routine.']);
}

// ---------- war ----------
export function beginCampaign(g, enemyId) { g.campaign = startCampaign(g, enemyId); return g.campaign; }
function startCampaign(g, enemyId) {
  const me = g.me, rng = g.rng, W = g.world;
  const fw = fightingWorth(me, 'sword', me.estate === 'noble' ? 'plate' : me.estate === 'gentry' ? 'mail' : 'levy');
  const rank = me.titles.length && renown(me, W.year) > 40 ? 'commander' : me.estate === 'noble' ? 'captain' : me.estate === 'gentry' ? 'sergeant' : 'soldier';
  me.gear = me.estate === 'noble' ? 'plate' : me.estate === 'gentry' ? 'mail' : 'levy';
  me.career ??= { name: 'soldiering', ladder: ['Levy', 'Veteran', 'Sergeant', 'Captain', 'Knight-captain', 'Marshal'] };
  if (me.rankIndex == null) me.rankIndex = { soldier: 0, sergeant: 2, captain: 3, commander: 4 }[rank];
  const order = W.orders.find((o) => o.patron === me.realm) ?? null, foeOrder = W.orders.find((o) => o.patron === enemyId) ?? null;
  const mk = (side, name, withOrder) => makeArmy(name, side, [
    makeUnit(side * 10 + 1, 'Levy spearmen', 'levy', rng.int(2200, 3600), 1.0, { drill: { hold: 0.1 } }),
    makeUnit(side * 10 + 2, 'Men-at-arms', 'maa', rng.int(500, 900), 2.5, { drill: { advance: 0.1 } }),
    makeUnit(side * 10 + 3, 'Archers', 'arch', rng.int(300, 700), 1.4, { ranged: true }),
    makeUnit(side * 10 + 4, 'Knights', 'kn', rng.int(80, 160), 6, { cavalry: true, drill: { charge: 0.15 } }),
    ...(withOrder ? [makeUnit(side * 10 + 5, withOrder.name, 'order', Math.round(withOrder.members * 0.4), withOrder.avgWorth, { terror: withOrder.terror, morale: 0.95 })] : []),
  ], { judgment: 100 + rng.normal(0, 12), will: 100, style: rng.pick(['cautious', 'bold', 'cunning']) });
  const A = mk(0, `${W.realms[me.realm].name.replace(/^.* of /, '')} host`, order), B = mk(1, `${W.realms[enemyId].name.replace(/^.* of /, '')} host`, foeOrder);
  return { armies: [A, B], playerSide: 0, day: 0, distance: rng.int(40, 120), battle: null, rank, person: { worth: fw.worth, command: 1 + (me.body.skills.tactics ?? 0) / 800 + stats(me).judgment / 100, judgment: stats(me).judgment, will: stats(me).will }, enemyId, log: [] };
}

export function stepCampaign(g, days, standing) {
  const c = g.campaign; if (!c || c.battle) return [];
  const before = c.day;
  const log = campaignStep(g.rng, c, days, standing);
  // the calendar keeps turning while you march (quietly — you are not at home to hear it)
  const crossed = Math.floor(c.day / 30) - Math.floor(before / 30);
  for (let i = 0; i < crossed; i++) { g.world.month++; if (g.world.month > 12) { g.world.month = 1; g.world.year++; } monthTick(g.world.diplomacy, g.world, g.rng, g.world.year, g.world.month); refreshAges(g); applyPlanArmy(g); }
  return log;
}
function applyPlanArmy(g) { practise(g.me, 'sword', 40); train(g.me, 'march', 1); train(g.me, 'toughness', 0.6); }

export function fightPhase(g, { armyTactic, unitTactic, choice }) {
  const c = g.campaign; const orders = { player: { rank: c.rank, choice, person: c.person } };
  if (c.rank === 'commander' && armyTactic) orders.armyTactic = [armyTactic, null];
  if ((c.rank === 'captain') && unitTactic) orders.unitTactics = { 2: unitTactic };
  const res = battlePhase(g.rng, c, orders);
  const me = g.me, W = g.world;
  if (res.player) {
    const p = res.player;
    if (p.deedWeight > 0) recordDeed(me, { weight: p.deedWeight, witnesses: p.witnesses, year: W.year, month: W.month, text: p.capturedBanner ? 'taking the enemy standard' : `fighting ${TERRAIN_AT(c.battle.terrain)}`, field: 'war' });
    if (p.wound) me.body.wounds.push({ kind: p.wound, year: W.year });
    if (p.res.breakthrough) breakthrough(me, 'lift', p.res.breakthrough, 'battle');
  }
  let report = null;
  if (c.battle.over) { report = afterAction(c); g.chronicle.push({ year: W.year, month: W.month, text: report.headline }); g.campaign = null; }
  return { res, report };
}
export { CHOICES };

// for UI: the character sheet & family, computed fresh
export function sheet(g) {
  const me = g.me, P = g.world.people, W = g.world;
  const house = W.houses.get(me.house);
  const holder = house?.seat ? P.all().find((p) => p.deathYear == null && p.titles.some((t) => t.endsWith(house.seat))) : null;
  return {
    kin: notableKin(P, me, { year: W.year, bonds: g.bonds }),
    holder, seat: house?.seat ?? null,
    place: holder ? (holder.id === me.id ? { text: `You hold ${house.seat}.`, law: null } : myPlace(P, me, holder, house.law, W.year)) : null,
    renown: renownWords(renown(me, W.year)),
    realmRelations: W.realms.filter((r) => r.id !== me.realm).map((r) => ({ name: r.name, status: statusOf(W.diplomacy, me.realm, r.id) })),
  };
}
