// World assembly: one continent, realms, noble pyramid, houses, a real extended family for the player,
// elite orders and living diplomacy.
import { makeRng } from './rng.js';
import { generateContinent } from './map/continent.js';
import { makeRealms, buildHierarchy, RANK_TITLE } from './nobility.js';
import { makeNamer } from './names.js';
import { People } from './kin.js';
import { makeGenes, newBody } from './body.js';
import { makeHouseLaw } from './succession.js';
import { makeDiplomacy, setFactor, houseBond } from './diplomacy.js';
import { makeOrders } from './orders.js';

export function createWorld({ seed = 'ardan', year = 1105, mapSize = [640, 440], realmCount = 8 } = {}) {
  const rng = makeRng(seed);
  const map = generateContinent({ seed, width: mapSize[0], height: mapSize[1] });
  const { realms, realmOf } = makeRealms(map, rng.fork('realms'), realmCount);
  const world = { seed, year, month: 1, map, realms, realmOf, people: new People(), houses: new Map(), nextId: 1, rng, houseBonds: new Map() };
  for (const r of realms) { r.hierarchy = buildHierarchy(r, map, seed); }
  world.orders = makeOrders(realms, seed);
  world.diplomacy = makeDiplomacy(realms, rng.fork('dip'));
  // seed some history between realms so the first months are not blank
  for (let i = 0; i < realms.length; i++) for (let j = i + 1; j < realms.length; j++) {
    if (rng.chance(0.15)) setFactor(world.diplomacy, i, j, `grudge-old-${i}-${j}`, -rng.int(10, 30), { decay: 0.1, year: year - rng.int(5, 40), text: 'an old war still remembered' });
    if (rng.chance(0.12)) setFactor(world.diplomacy, i, j, `marriage-old-${i}-${j}`, rng.int(8, 18), { decay: 0.03, year: year - rng.int(2, 20), text: 'a royal marriage a generation ago' });
    if (rng.chance(0.1)) setFactor(world.diplomacy, i, j, 'trade', rng.int(5, 12), { text: 'rich trade along the coast road' });
  }
  return world;
}

export function newPerson(world, { sex, race = 'human', culture = 'aldic', birthYear, house = null, father = null, mother = null, name = null }) {
  const rng = world.rng, namer = makeNamer(rng);
  const p = { id: world.nextId++, sex, race, culture, birthYear, house, name: name ?? namer.given(culture, sex), titles: [], deeds: [], traits: [],
    genes: makeGenes(rng, race, sex, father && mother ? [father, mother] : null), body: newBody(), memories: [] };
  world.people.add(p);
  if (father || mother) world.people.link(p, father, mother);
  return p;
}

const OFFICES = ['General of the Western March', 'Castellan of the river fort', 'Steward of the realm', 'Bishop of the cathedral city', 'Master of the merchant guild', 'Captain of the city watch', 'Royal huntsman', 'Admiral of the coast fleet'];

// Build the player's family three generations deep with real uncles, aunts and cousins.
// Estate: 'noble' | 'gentry' | 'commoner'. The player's place among siblings is NOT chosen.
export function createPlayerFamily(world, { realmId = 0, estate = 'noble', sex = null } = {}) {
  const rng = world.rng.fork('family'), realm = world.realms[realmId], y = world.year, P = world.people;
  const namer = makeNamer(rng);
  const culture = realm.culture;
  const titles = realm.hierarchy.titles;
  const usedTitles = new Set();
  const pickTitle = (rank) => { const t = rng.pick(titles.filter((x) => x.rank === rank && x.holder == null && !usedTitles.has(x.id))) ?? null; if (t) usedTitles.add(t.id); return t; };
  const houseName = namer.house(culture), motherHouse = namer.house(culture);
  const law = makeHouseLaw(rng);
  const lawM = makeHouseLaw(rng);
  world.houses.set(houseName, { name: houseName, law, realm: realmId, estate });
  world.houses.set(motherHouse, { name: motherHouse, law: lawM, realm: realmId, estate });
  const race = culture === 'orcish' ? 'orc' : culture === 'khuul' ? 'human' : 'human';
  const usedNames = new Set();
  const uniq = (p) => { let tries = 0; while (usedNames.has(p.name) && tries++ < 20) p.name = namer.given(culture, p.sex); usedNames.add(p.name); return p; };
  const gp = (house, s, by) => uniq( newPerson(world, { sex: s, culture, race, birthYear: by, house }));
  // paternal and maternal grandparents
  const pgf = gp(houseName, 'male', y - rng.int(58, 70)), pgm = gp(null, 'female', pgf.birthYear + rng.int(2, 8));
  const mgf = gp(motherHouse, 'male', y - rng.int(55, 68)), mgm = gp(null, 'female', mgf.birthYear + rng.int(2, 8));
  P.marry(pgf, pgm, pgf.birthYear + 22); P.marry(mgf, mgm, mgf.birthYear + 22);
  if (rng.chance(0.4)) pgf.deathYear = y - rng.int(1, 8);
  if (rng.chance(0.3)) mgm.deathYear = y - rng.int(1, 10);
  if (estate === 'noble') {
    const pt = pickTitle(rng.chance(0.25) ? 'marquis' : 'count'), mt = pickTitle(rng.chance(0.3) ? 'count' : 'marquis');
    if (pt) { pt.holder = pgf.id; pgf.titles.push(`${RANK_TITLE[pt.rank][0]} — ${pt.name}`); world.houses.get(houseName).seat = pt.name; }
    if (mt) { mt.holder = mgf.id; mgf.titles.push(`${RANK_TITLE[mt.rank][0]} — ${mt.name}`); world.houses.get(motherHouse).seat = mt.name; }
  } else if (estate === 'gentry') { pgf.titles.push('Lord of a village (knight)'); }
  const kids = (f, m, house, n, around) => {
    const out = []; let by = around;
    for (let i = 0; i < n; i++) { const c = uniq(newPerson(world, { sex: rng.chance(0.5) ? 'male' : 'female', culture, race, birthYear: by, house, father: f, mother: m })); out.push(c); by += rng.int(1, 4); }
    return out;
  };
  const pSibs = kids(pgf, pgm, houseName, rng.int(3, 5), pgf.birthYear + rng.int(22, 26));
  const mSibs = kids(mgf, mgm, motherHouse, rng.int(2, 5), mgf.birthYear + rng.int(22, 26));
  // father is one of the sons (not necessarily the eldest), mother one of the daughters
  let father = rng.pick(pSibs.filter((p) => p.sex === 'male')) ?? pSibs[0]; father.sex = 'male';
  let mother = rng.pick(mSibs.filter((p) => p.sex === 'female')) ?? mSibs[0]; mother.sex = 'female';
  P.marry(father, mother, Math.max(father.birthYear, mother.birthYear) + 21);
  // uncles/aunts marry and have children (your cousins); some hold offices
  for (const s of [...pSibs, ...mSibs]) {
    if (s === father || s === mother) continue;
    if (rng.chance(0.18)) { s.deathYear = y - rng.int(1, 15); continue; }
    if (s.sex === 'male' && rng.chance(0.45)) s.office = rng.pick(OFFICES);
    if (rng.chance(0.15)) { s.vows = true; s.office = s.office ?? 'Sworn to the Church'; continue; }
    const sp = newPerson(world, { sex: s.sex === 'male' ? 'female' : 'male', culture, race, birthYear: s.birthYear + rng.int(-3, 3), house: s.sex === 'male' ? null : namer.house(culture) });
    P.marry(s, sp, s.birthYear + 22);
    const [f, m] = s.sex === 'male' ? [s, sp] : [sp, s];
    kids(f, m, f.house, rng.int(1, 4), Math.max(f.birthYear, m.birthYear) + rng.int(21, 27));
  }
  // you and your siblings: a random number of elder siblings, you, then the future
  const elder = rng.weighted([0, 1, 2, 3], (k) => [3, 3, 2, 1][k]);
  const startBy = Math.max(father.birthYear, mother.birthYear) + rng.int(20, 24);
  const sibs = kids(father, mother, houseName, elder, startBy);
  const me = uniq(newPerson(world, { sex: sex ?? (rng.chance(0.5) ? 'male' : 'female'), culture, race, birthYear: y, house: houseName, father, mother }));
  me.age = 0; me.isPlayer = true; me.realm = realmId; me.estate = estate;
  // keep birth years sane
  for (const s of sibs) if (s.birthYear >= y) s.birthYear = y - 1;
  // mark heirs of titled kin so the player sees "cousin, heir to a county"
  return { me, father, mother, houseName, motherHouse };
}

// ages of everyone (call monthly)
export function ageOf(p, world) { return world.year - p.birthYear + (world.month - 1) / 12; }
