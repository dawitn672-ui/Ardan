// Realms and the noble pyramid. Realistic shape with hard caps:
//   king > dukes (0-3, never more than 3) > marquises (2-4 per duke, never more than 6; they hold the borders)
//   > counts (one per county/province, 2-4 under each marquis or duke, some held by the crown)
//   > viscounts (2-3 per count) > barons (2-4 per viscount) > lords (3-6 per baron; a knight with a village).
// Only the upper tiers are materialised as full houses; the lower tiers are counted and created on demand
// from a deterministic seed, so a large empire has hundreds of nobles without a heavy save.
import { makeRng } from '../../core/engine/rng.js';
import { makeNamer } from '../../world/engine/names.js';

export const RANKS = ['king', 'duke', 'marquis', 'count', 'viscount', 'baron', 'lord'];
export const RANK_TITLE = { king: ['King', 'Queen'], duke: ['Duke', 'Duchess'], marquis: ['Marquis', 'Marquise'], count: ['Count', 'Countess'], viscount: ['Viscount', 'Viscountess'], baron: ['Baron', 'Baroness'], lord: ['Lord', 'Lady'] };
export const CAPS = { duke: 3, marquis: 6 };

// Group provinces into realms by growing from spread-out capitals across province adjacency.
export function makeRealms(map, rng, count = 8, cultures = ['aldic', 'solenne', 'aldic', 'khuul', 'solenne', 'aldic', 'orcish', 'aldic']) {
  const provs = map.provinces.list;
  const caps = [];
  const sorted = rng.shuffle(provs.filter((p) => p.cells > 40));
  for (const p of sorted) { if (caps.length >= count) break; if (caps.every((c) => Math.hypot(c.x - p.x, c.y - p.y) > map.W / (count ** 0.5) * 0.5)) caps.push(p); }
  const realmOf = new Int16Array(provs.length).fill(-1);
  const strength = caps.map(() => rng.float(0.5, 1.6)); // some realms grow far larger than others
  const queues = caps.map((c, i) => { realmOf[c.id] = i; return [c.id]; });
  const credit = caps.map(() => 0);
  let active = true;
  while (active) {
    active = false;
    for (let i = 0; i < caps.length; i++) {
      credit[i] += strength[i];
      while (credit[i] >= 1 && queues[i].length) {
        credit[i] -= 1;
        // expand from a random frontier province of this realm
        const qi = Math.floor(rng.next() * queues[i].length), pid = queues[i][qi];
        const free = provs[pid].neighbors.filter((nb) => realmOf[nb] < 0);
        if (!free.length) { queues[i].splice(qi, 1); credit[i] += 1; continue; }
        const nb = free[Math.floor(rng.next() * free.length)];
        realmOf[nb] = i; queues[i].push(nb);
      }
      if (queues[i].length) active = true;
    }
  }
  // any province never reached (separate island etc.) joins its nearest realm capital
  provs.forEach((p) => { if (realmOf[p.id] < 0) { let best = 0, bd = Infinity; caps.forEach((c, i) => { const d = Math.hypot(c.x - p.x, c.y - p.y); if (d < bd) { bd = d; best = i; } }); realmOf[p.id] = best; } });
  const namer = makeNamer(rng);
  const realms = caps.map((c, i) => ({ id: i, capital: c.id, culture: cultures[i % cultures.length], provinces: [], name: '' }));
  provs.forEach((p) => { if (realmOf[p.id] >= 0) realms[realmOf[p.id]].provinces.push(p.id); });
  for (const r of realms) {
    r.name = (r.provinces.length > 34 ? 'Empire of ' : r.provinces.length > 9 ? 'Kingdom of ' : 'Principality of ') + namer.place(r.culture);
    r.border = r.provinces.filter((pid) => provs[pid].neighbors.some((nb) => realmOf[nb] !== r.id));
    r.coastal = r.provinces.length;
  }
  return { realms, realmOf };
}

export function dukesFor(nProv) { return nProv >= 24 ? 3 : nProv >= 14 ? 2 : nProv >= 7 ? 1 : 0; }

// Build the title pyramid of one realm. opts.marchAt / opts.dukeAt: counties (in order of preference) where a march or a
// duchy should start, such as the seats of a host game's great houses; a preferred start that is taken (or, for a march,
// not on the border) is skipped. The generator draws the same numbers either way.
export function buildHierarchy(realm, map, seed, opts = {}) {
  const rng = makeRng(`${seed}:titles:${realm.id}`);
  const namer = makeNamer(rng);
  const provs = map.provinces.list;
  const counties = realm.provinces.slice();
  const nDukes = Math.min(CAPS.duke, dukesFor(counties.length));
  const border = new Set(realm.border);
  // marquisates take border counties in pairs/triples; capped at 6 and 2-4 per duke (or 1-2 for a duke-less realm)
  const nMarq = Math.min(CAPS.marquis, nDukes ? nDukes * rng.int(2, 3) : Math.min(2, Math.floor(border.size / 3)), Math.floor(border.size / 2));
  const titles = [];
  const add = (rank, name, parent, provinces = [], extra = {}) => { const t = { id: titles.length, rank, name, parent, provinces, holder: null, ...extra }; titles.push(t); return t; };
  const king = add('king', realm.name, null, counties.slice());
  // assign counties: crown demesne keeps the capital and 1-3 neighbours
  const taken = new Set();
  const demesne = [realm.capital, ...provs[realm.capital].neighbors.filter((n) => counties.includes(n)).slice(0, rng.int(1, 3))];
  demesne.forEach((c) => taken.add(c));
  // dukes: grow clusters of interior counties
  const grow = (start, size) => {
    const out = [start]; taken.add(start);
    for (let i = 0; i < out.length && out.length < size; i++) for (const nb of provs[out[i]].neighbors) if (counties.includes(nb) && !taken.has(nb) && out.length < size) { out.push(nb); taken.add(nb); }
    return out;
  };
  const dukes = [];
  const marqs = [];
  for (let m = 0; m < nMarq; m++) {
    const pick = rng.shuffle([...border].filter((c) => !taken.has(c)))[0];
    const start = (opts.marchAt || []).find((c) => border.has(c) && !taken.has(c)) ?? pick;
    if (start == null) break;
    const parent = null; // set after duchies exist
    // leave room for the duchies (four counties each), so the marches never eat the realm before a duke is made
    const room = Math.floor((counties.length - taken.size - nDukes * 4) / (nMarq - m));
    const size = Math.min(rng.int(2, 4), room);
    if (size < 1) break;
    marqs.push(add('marquis', `March of ${namer.place(realm.culture)}`, parent, grow(start, size)));
  }
  for (let d = 0; d < nDukes; d++) {
    const pick = rng.shuffle(counties.filter((c) => !taken.has(c) && !border.has(c)))[0] ?? counties.find((c) => !taken.has(c));
    const start = (opts.dukeAt || []).find((c) => counties.includes(c) && !taken.has(c)) ?? pick;
    if (start == null) break;
    const cl = grow(start, Math.max(3, Math.round(counties.length / (nDukes + 1.5))));
    dukes.push(add('duke', `Duchy of ${namer.place(realm.culture)}`, king.id, cl));
  }
  for (const m of marqs) { const near = dukes.find((d) => d.provinces.some((p) => m.provinces.some((q) => provs[q].neighbors.includes(p)))); m.parent = near && rng.chance(0.7) ? near.id : king.id; }
  // remaining counties: attach to the nearest duchy/march cluster or to the crown
  for (const c of counties) if (!taken.has(c)) {
    const holderTitle = [...dukes, ...marqs].find((t) => t.provinces.some((p) => provs[p].neighbors.includes(c)));
    if (holderTitle && holderTitle.provinces.length < 6) holderTitle.provinces.push(c); else demesne.push(c);
    taken.add(c);
  }
  // counts: one per county
  for (const t of [king, ...dukes, ...marqs]) {
    const own = t.rank === 'king' ? demesne : t.provinces;
    for (const c of own) add('count', `County of ${namer.place(realm.culture)}`, t.id, [c], { province: c });
  }
  // lower tiers are counted, not materialised
  const counts = titles.filter((t) => t.rank === 'count');
  let viscounts = 0, barons = 0, lords = 0;
  for (const ct of counts) {
    ct.viscounts = rng.int(2, 3); ct.barons = 0; ct.lords = 0;
    for (let v = 0; v < ct.viscounts; v++) { const b = rng.int(2, 4); ct.barons += b; for (let i = 0; i < b; i++) ct.lords += rng.int(3, 6); }
    viscounts += ct.viscounts; barons += ct.barons; lords += ct.lords;
  }
  return { titles, summary: { king: 1, dukes: dukes.length, marquises: marqs.length, counts: counts.length, viscounts, barons, lords } };
}

// Create a lower noble on demand, deterministic from (realm, county, rank, index).
export function lowerNoble(seed, realm, county, rank, index) {
  const rng = makeRng(`${seed}:${realm.id}:${county}:${rank}:${index}`);
  const namer = makeNamer(rng);
  const sex = rng.chance(0.88) ? 'male' : 'female';
  return { rank, title: `${RANK_TITLE[rank][sex === 'female' ? 1 : 0]} of ${namer.place(realm.culture)}`, given: namer.given(realm.culture, sex), house: namer.house(realm.culture), sex };
}
