// Peoples and polities of the far lands (layers three and four of docs/research/world-foundations.md). When the lore
// (canon/lore/far-lands.json) is present its realms, cultures and faiths are used; otherwise placeholders are made
// here, one set per Far Land, sized by rule S1 (about one sovereign for 300,000-400,000 km2 of farmed or grazed
// land, far fewer in taiga, tundra and true desert), and each realm's land is grown from its capital over the
// province graph until it holds its share, stopping at mountains, deserts and the sea (natural barriers).
import { rng, Heap, clamp } from './lib.mjs';
import { namer } from './names.mjs';
import { readLore } from './lore.mjs';
import { nameProvinces } from './places.mjs';

// ---- what each land's polities are like: [type, title, gov, law, weight]; how many; how much of the land is held
export const POLITY = {
  T: { n: 8, held: 0.55, kinds: [['principality', 'Prince', 'hereditary', 'male', 3], ['tribal confederation', 'Elder', 'elective', 'equal', 2], ['fur league', 'Warden', 'council', 'male', 1]] },
  N: { n: 3, held: 0.45, kinds: [['sea-hunter clans', 'Speaker', 'elective', 'equal', 1]] },
  F: { n: 11, held: 0.9, kinds: [['khaganate', 'Khagan', 'elective', 'male', 2], ['nomad confederation', 'Khan', 'elective', 'male', 4], ['horse clans', 'Chief', 'elective', 'equal', 2]] },
  B: { n: 9, held: 0.65, kinds: [['city-state', 'Prince', 'council', 'male', 3], ['oasis kingdom', 'King', 'hereditary', 'male', 2], ['caravan league', 'First Factor', 'council', 'male', 1]] },
  H: { n: 8, held: 0.7, kinds: [['temple state', 'Abbot', 'theocracy', 'male', 2], ['clan lordship', 'Lord', 'hereditary', 'equal', 3], ['mountain confederation', 'First Speaker', 'elective', 'equal', 1]] },
  R: { n: 20, held: 0.96, kinds: [['empire', 'Emperor', 'hereditary', 'male', 1], ['kingdom', 'King', 'hereditary', 'male', 4], ['principality', 'Prince', 'hereditary', 'male', 3], ['river league', 'Grand Magistrate', 'council', 'male', 1]] },
  M: { n: 22, held: 0.92, kinds: [['mandala kingdom', 'Raja', 'hereditary', 'male', 4], ['temple state', 'High Priest', 'theocracy', 'male', 1], ['hill chiefdom', 'Chief', 'elective', 'equal', 2], ['sultanate', 'Sultan', 'hereditary', 'male', 1]] },
  A: { n: 14, held: 0.8, kinds: [['thalassocracy', 'Sea-King', 'hereditary', 'male', 1], ['port city', 'Harbour-Lord', 'council', 'male', 3], ['island kingdom', 'King', 'hereditary', 'equal', 3]] },
  I: { n: 4, held: 0.97, kinds: [['island realm', 'Sovereign', 'hereditary', 'male', 2], ['household lordship', 'Lord', 'hereditary', 'male', 2]] },
  D: { n: 16, held: 0.78, kinds: [['kingdom', 'King', 'hereditary', 'equal', 4], ['cattle kingdom', 'King', 'hereditary', 'male', 2], ['city league', 'Speaker', 'council', 'equal', 1], ['chiefdom', 'Chief', 'elective', 'equal', 2]] },
};
const NAME_OF = {
  principality: n => [`Principality of ${n}`, n], 'tribal confederation': n => [`the ${n} Tribes`, n], 'fur league': n => [`the Fur League of ${n}`, n],
  'sea-hunter clans': n => [`the ${n} Clans`, n], khaganate: n => [`the ${n} Khaganate`, n], 'nomad confederation': n => [`the ${n} Horde`, n],
  'horse clans': n => [`the ${n} Clans`, n], 'city-state': n => [`City of ${n}`, n], 'oasis kingdom': n => [`Kingdom of ${n}`, n],
  'caravan league': n => [`the ${n} League`, n], 'temple state': n => [`the Temple of ${n}`, n], 'clan lordship': n => [`Lordship of ${n}`, n],
  'mountain confederation': n => [`the ${n} Valleys`, n], empire: n => [`Empire of ${n}`, n], kingdom: n => [`Kingdom of ${n}`, n],
  'river league': n => [`the ${n} League`, n], 'mandala kingdom': n => [`Kingdom of ${n}`, n], 'hill chiefdom': n => [`the ${n} Hills`, n],
  sultanate: n => [`Sultanate of ${n}`, n], thalassocracy: n => [`the Sea Realm of ${n}`, n], 'port city': n => [`Port of ${n}`, n],
  'island kingdom': n => [`Kingdom of ${n}`, n], 'island realm': n => [`the Realm of ${n}`, n], 'household lordship': n => [`House ${n}`, n],
  'cattle kingdom': n => [`Kingdom of ${n}`, n], 'city league': n => [`the ${n} League`, n], chiefdom: n => [`the ${n} Chiefdom`, n],
  'orc clans': n => [`the ${n} Clans`, n], 'dwarven hold': n => [`the Hold of ${n}`, n], 'giant territory': n => [`the Halls of ${n}`, n],
};
// placeholder cultures: two to a land (by west and east), with the lore's style of English names
export const CULTURES = {
  T: [['Pinefolk', 'Fur-trappers, salt-boilers and iron-burners of the Black Pines.'], ['River-Ice people', 'Fishers and sledge-drivers of the great north-flowing rivers.']],
  N: [['Rime-hunters', 'Sea hunters of the cold coast, in skin boats.'], ['Rime-hunters', 'Sea hunters of the cold coast, in skin boats.']],
  F: [['Long Grass clans', 'Herders of the long steppe, counted by tens and hundreds.'], ['Eastern Riders', 'The horse peoples of the steppe\'s far end, under the Windy Plateau.']],
  B: [['Oasis-folk', 'Townsmen of the oasis chains, brokers of the caravan road.'], ['Salt Road people', 'Caravan factors and well-keepers of the eastern basins.']],
  H: [['Roof-dwellers', 'Herders and monks of the high steppes.'], ['Valley clans', 'Clansmen of the deep valleys under the Great Wall.']],
  R: [['Yellow River people', 'Farmers of the loess and the yellow plain.'], ['Green Basin people', 'Rice growers of the southern basin and its lakes.']],
  M: [['Lowland folk', 'Rice and cotton growers of the great river plain.'], ['Hill-and-delta folk', 'The peoples of the southern peninsulas and their deltas.']],
  A: [['Islanders', 'Sailors and spice traders of the Thousand Isles.'], ['Reef folk', 'Sea peoples of the eastern isles.']],
  I: [['Sunrise folk', 'The households of the eastern isles.'], ['Sunrise folk', 'The households of the eastern isles.']],
  D: [['Highveld folk', 'Cattle peoples of the southern highlands.'], ['Forest-river folk', 'Farmers and traders of the great southern forest.']],
};
const NAMING = {
  T: { common: 'place', noble: 'house', note: 'A given name and the home village; princes a house name.' },
  N: { common: 'single', noble: 'clan', note: 'One name; a clan name for the families who lead the hunt.' },
  F: { common: 'clan', noble: 'clan', note: 'A given name and the clan; the khagan\'s line keeps its own.' },
  B: { common: 'patron', noble: 'house', note: 'Commoners add the father\'s name; the oasis lords a house name.' },
  H: { common: 'single', noble: 'house', note: 'A single name given at a monastery; the clan lords add their house.' },
  R: { common: 'house', noble: 'house', note: 'The family name comes first in the old style, written here after.' },
  M: { common: 'house', noble: 'house', note: 'A given name and a family name, often a caste of work.' },
  A: { common: 'place', noble: 'house', note: 'A given name and the island of birth; sea lords a house name.' },
  I: { common: 'house', noble: 'house', note: 'A household name first, a given name after.' },
  D: { common: 'patron', noble: 'clan', note: 'A given name and the father\'s; the cattle lords a clan name.' },
};
const EPI = {
  T: ['the Trapper', 'Ironhand', 'the Quiet', 'Saltbeard', 'the Elk', 'Longwinter', 'the Smith', 'Frostbitten', 'the Pathfinder', 'the Patient', 'Bearskin', 'the Lame', 'Tarhand', 'the Ferryman', 'the Grey'],
  N: ['the Harpooner', 'Seal-Eater', 'the Far-Seeing', 'Icewalker', 'the Lucky', 'Two-Boats', 'the Old', 'the Singer', 'Whalebone', 'the Steady', 'Long-Oar', 'the Silent', 'the Wanderer', 'Fog-Born', 'the Bold'],
  F: ['the Archer', 'Ninehorse', 'the Swift', 'the Horse-Born', 'Grey Mare', 'the Wolf', 'Felt-Coat', 'the Generous', 'the Unbowed', 'the Lame', 'Blackbow', 'the Counter', 'Long-Ride', 'the Stern', 'the Young'],
  B: ['the Broker', 'Goldpurse', 'the Well-Keeper', 'the Learned', 'Silkhand', 'the Pious', 'the Measurer', 'Camelback', 'the Fair', 'the Lame', 'Saltfinger', 'the Reckoner', 'the Old', 'the Copyist', 'the Bold'],
  H: ['the Monk', 'Yak-Herd', 'the Pilgrim', 'Snowborn', 'the Hermit', 'Cliffwalker', 'the Patient', 'the Teacher', 'Thin-Air', 'the Wise', 'Prayer-Wheel', 'the Silent', 'Butter-Lamp', 'the Lame', 'the Stern'],
  R: ['the Scholar', 'the Magistrate', 'Inkbrush', 'the Upright', 'the Diligent', 'Silkweaver', 'the Examined', 'the Filial', 'the Calm', 'the Lame', 'Jade-Hand', 'the Exiled', 'the Bold', 'the Old', 'the Frugal'],
  M: ['the Elephant-Rider', 'the Devout', 'Lotus-Eyed', 'the Generous', 'the Just', 'Pepper-Merchant', 'the Learned', 'the Lame', 'the Bold', 'Rain-Bringer', 'the Fair', 'the Victorious', 'the Poet', 'the Old', 'the Stern'],
  A: ['the Navigator', 'Spice-Hand', 'the Pearl-Diver', 'Long-Keel', 'the Lucky', 'the Fair', 'Storm-Rider', 'the Rich', 'the Lame', 'the Bold', 'Reefborn', 'the Old', 'the Wise', 'Two-Isles', 'the Quiet'],
  I: ['the Swordsman', 'the Loyal', 'the Calligrapher', 'the Stern', 'Pine-Shadow', 'the Archer', 'the Quiet', 'the Lame', 'the Faithful', 'the Bold', 'the Old', 'the Wise', 'Cherry-Bough', 'the Grave', 'the Young'],
  D: ['the Herdsman', 'Lion-Killer', 'the Rainmaker', 'Goldhand', 'the Generous', 'the Drummer', 'the Wise', 'Long-Spear', 'the Lame', 'the Bold', 'Ivory-Arm', 'the Old', 'the Just', 'the Hunter', 'the Patient'],
};
// placeholder faiths: one or two to a land
export const FAITHS = {
  T: [['the Old Pines', 'folk', 'Spirits of tree, river and bear; the dead walk into the forest.']],
  N: [['the Sea Mother', 'folk', 'The sea gives the hunt and takes the drowned; every kill is thanked.']],
  F: [['the Eternal Sky', 'organized', 'One sky over all grass; the khagan rules by its favour, which can be lost.']],
  B: [['the Well of Light', 'organized', 'A faith of merchants: light given freely, kept in wells and lamps along the road.'], ['the Eternal Sky', null, null]],
  H: [['the Silent Peak', 'organized', 'Monks who teach that the self is a cloud on the mountain; the abbots keep the old dwarf memory.']],
  R: [['the Heavenly Order', 'organized', 'Heaven, earth and the ancestors in balance; the emperor keeps the rites or loses the mandate.'], ['the Way of Rivers', 'organized', 'A teaching of yielding water, carried by wandering masters.']],
  M: [['the Thousand Shrines', 'organized', 'Many gods, one order of the world; temples own the rice land.'], ['the Silent Peak', null, null]],
  A: [['the Tide Ancestors', 'folk', 'The first sailors became the stars; every island keeps its founder\'s boat.'], ['the Thousand Shrines', null, null]],
  I: [['the Kami of the Isles', 'folk', 'Spirits in every stream and rock, and the sovereign descended from the sun.']],
  D: [['the Rain Kings', 'folk', 'The king brings the rain; a king who fails the rain may be put away.'], ['the Ancestor Drum', 'folk', 'The ancestors speak through the drum and the diviner.']],
};
const ECON = {
  T: { ex: 'furs;timber and tar;amber;salt fish;iron', im: 'grain;cloth;wine' }, N: { ex: 'whale oil;walrus ivory;furs', im: 'iron;grain;cloth' },
  F: { ex: 'horses;felt;hides;wool', im: 'grain;iron;silk;tea' }, B: { ex: 'jade;cotton;dried fruit;glass', im: 'grain;horses;silk' },
  H: { ex: 'wool;salt;gold;medicinal herbs', im: 'grain;tea;iron' }, R: { ex: 'silk;porcelain;tea;lacquer;paper', im: 'horses;silver;jade' },
  M: { ex: 'rice;cotton;pepper;dyes;gems', im: 'horses;silver;copper' }, A: { ex: 'spices;camphor;pearls;sandalwood', im: 'rice;cloth;iron' },
  I: { ex: 'swords;lacquer;sulphur;timber', im: 'silk;copper coin;books' }, D: { ex: 'gold;ivory;cattle;copper', im: 'cloth;beads;salt' },
};
const COMP = {   // army make-up by military culture (section 5.4): [heavyHorse, lightHorse, elephants, heavyFoot, spear, missile, other]
  T: [0.02, 0.05, 0, 0.1, 0.4, 0.3, 0.13], N: [0, 0, 0, 0.05, 0.45, 0.4, 0.1], F: [0.15, 0.7, 0, 0.03, 0.05, 0.05, 0.02],
  B: [0.12, 0.25, 0, 0.15, 0.25, 0.18, 0.05], H: [0.05, 0.2, 0, 0.1, 0.35, 0.25, 0.05], R: [0.05, 0.08, 0, 0.17, 0.35, 0.3, 0.05],
  M: [0.06, 0.06, 0.04, 0.12, 0.35, 0.3, 0.07], A: [0, 0, 0, 0.12, 0.38, 0.35, 0.15], I: [0.12, 0.05, 0, 0.3, 0.2, 0.3, 0.03],
  D: [0, 0.02, 0, 0.08, 0.6, 0.25, 0.05],
};
const PASTEL = ['#d9b48f', '#b5c99a', '#c9a0a0', '#a0b8c9', '#d4c08a', '#b9a8d6', '#9fc5a8', '#e0a98c', '#a7b6dc', '#cfc48e', '#d6a6c0', '#9ec7c2',
  '#c7b199', '#a9c48d', '#d9a3a3', '#94b3c9', '#dcc39a', '#b4a0c8', '#a6c9a0', '#e3b28a', '#9fa9d8', '#c9cf8f', '#d1a0b7', '#8fbfb4', '#c4a77f', '#b0bfa2'];

export function makeRealms(P, adjOf, seaOf, seed, base, lore, provAtKm) {
  const R = rng(seed + 303), used = new Set(base.provinces.map(p => p.name.toLowerCase()));
  for (const id in base.LORE.realms) { used.add(base.LORE.realms[id].name.toLowerCase()); used.add(base.LORE.realms[id].short.toLowerCase()); }
  const byLand = {}; for (const p of P) (byLand[p.land] = byLand[p.land] || []).push(p);
  const nb = base.provinces.length, prov = id => P[id - nb];
  const lands = Object.keys(POLITY).filter(k => byLand[k]);
  // ---- cultures and faiths (placeholders, numbered after the lore's own when it has any)
  const LR = lore ? readLore(lore) : null, loreReport = { realms: 0, placed: 0, skipped: [] };
  const after = (xs, re, d) => Math.max(d, ...xs.map(x => +(re.exec(x.id) || [0, 0])[1] + 1));
  let cn = LR ? after(LR.cultures, /^CUL-(\d+)/, 25) : 25, fn = LR ? after(LR.faiths, /^REL-(\d+)/, 20) : 20, hn = 1, rn = LR ? after(LR.realms, /^POL-(\d+)/, 36) : 36;
  const cultures = {}, naming = {}, lang = {}, faiths = [], faithOf = {}, cultOf = {};
  const namers = {};
  const loreHas = LR && LR.cultures.length > 0;
  for (const L of lands) {
    cultOf[L] = [];
    if (loreHas) { namers[L] = [namer(R, L, 0, used), namer(R, L, 1, used)]; continue; }   // the lore's peoples stand instead
    CULTURES[L].forEach(([nm, note], v) => {
      if (v === 1 && CULTURES[L][1][0] === CULTURES[L][0][0]) { cultOf[L].push(cultOf[L][0]); return; }
      const id = `CUL-${String(cn++).padStart(2, '0')}`, nmr = namer(R, L, v, used);
      const list = (k, opts) => Array.from({ length: k }, () => nmr.word(opts));
      cultures[id] = { id, name: nm, race: 'human', home: base.LORE && '', pols: [], note, m: list(30, { min: 3, max: 8, end: false }), f: list(30, { min: 3, max: 8, end: true }), house: list(20, { min: 4, max: 9 }), epi: EPI[L].slice(), land: L };
      naming[id] = NAMING[L];
      lang[id] = nm.replace(/ (folk|people|clans|dwellers|hunters|Riders)$/i, '').replace(/s$/, '') + ' speech';
      cultOf[L].push(id);
    });
    namers[L] = [namer(R, L, 0, used), namer(R, L, 1, used)];
  }
  for (const L of lands) {
    faithOf[L] = [];
    if (LR && LR.faiths.length) continue;
    for (const [nm, kind, belief] of FAITHS[L]) {
      let f = faiths.find(x => x.name === nm);
      if (!f) { f = { id: `REL-${fn++}`, name: nm, kind: kind || 'organized', followers: '', realms: [], belief: belief || '', afterlife: '', clergy: '', rituals: '', festivals: '', taboos: '', politics: '', land: L }; faiths.push(f); }
      faithOf[L].push(f.id);
    }
  }
  // ---- the lore's own cultures and faiths, when it has them (name lists it lacks are made in its land's sounds)
  if (LR) {
    for (const c of LR.cultures) {
      const L = c.land && POLITY[c.land] ? c.land : 'R', nmr = namer(R, L, 0, used), fill = (a, k, o) => a.length >= 8 ? a : a.concat(Array.from({ length: k - a.length }, () => nmr.word(o)));
      cultures[c.id] = { id: c.id, name: c.name, race: c.race, home: '', pols: [], note: c.note, m: fill(c.m, 30, { min: 3, max: 8, end: false }), f: fill(c.f, 30, { min: 3, max: 8, end: true }), house: fill(c.house, 20, { min: 4, max: 9 }), epi: c.epi.length ? c.epi : EPI[L].slice(), land: L };
      const GT = lore.game_tables || {};
      naming[c.id] = (GT.NAMING && GT.NAMING[c.id]) || c.naming || NAMING[L]; lang[c.id] = (GT.LANG && GT.LANG[c.id]) || c.lang || c.name + ' speech';
      if (c.places.length) cultures[c.id].places = c.places;
    }
    for (const f of LR.faiths) if (!faiths.some(x => x.id === f.id)) faiths.push(Object.assign({ followers: '', realms: [], land: null }, f));
  }
  // ---- capitals: the most peopled province first, then the one that best balances people and distance from the rest
  const realms = [], owner = new Map();
  if (LR && LR.realms.length) {
    // the lore's realms, each from its capital's place in km, grown to the area the lore gives it
    const takenCap = new Set();
    for (const lr of LR.realms) {
      if (lr.x == null || lr.y == null) { loreReport.skipped.push(lr.id + ' (no position)'); continue; }
      if (lr.x >= 0 && lr.y >= 0 && lr.x < base.gw * 10 && lr.y < base.gh * 10) { loreReport.skipped.push(lr.id + ' (in the Known World)'); continue; }
      let cap = provAtKm(lr.x, lr.y);
      if (!cap || takenCap.has(cap.k)) { let bd = 400; cap = null; for (const p of P) { const d = Math.hypot(p.sx - lr.x, p.sy - lr.y); if (d < bd && !takenCap.has(p.k) && p.compCells >= 20) { bd = d; cap = p; } } }
      if (!cap) { loreReport.skipped.push(lr.id + ' (no land near its capital)'); continue; }
      takenCap.add(cap.k);
      const L = lr.land && POLITY[lr.land] ? lr.land : cap.land, K = POLITY[L];
      // how the lore's realm passes its crown, read from what it is
      const tf = (lr.type || '') + ' ' + (lr.typeFull || '');
      const gov = ['hereditary', 'elective', 'council', 'theocracy'].includes(lr.gov) ? lr.gov : /temple|abbot|theocra|monast|church|priest|college/i.test(tf) ? 'theocracy'
        : /league|republic|commune|council|city|merchant|broker|town/i.test(tf) ? 'council' : /clan|confedera|khagan|horde|elect|age-set|tribe|band/i.test(tf) ? 'elective' : 'hereditary';
      const law = ['male', 'female', 'equal'].includes(lr.law) ? lr.law : lr.rulerSex === 'F' ? 'equal' : K.kinds[0][3];
      const kind = [lr.type || K.kinds[0][0], lr.title || K.kinds[0][1], gov, law, 1];
      realms.push({ L, cap, target: lr.area || cap.cells * 100 * 6, kind, area: 0, provs: [], lore: lr, race: ['orc', 'dwarf', 'giant', 'elf'].includes(lr.race) ? lr.race : undefined });
      loreReport.placed++;
    }
    loreReport.realms = LR.realms.length;
  } else for (const L of lands) {
    const list = byLand[L].slice().sort((a, b) => a.id - b.id).filter(p => p.compCells >= 80 && p.cells >= 25), K = POLITY[L];
    if (!list.length) continue;
    const nR = Math.min(K.n, Math.max(1, Math.floor(list.length / 3)));
    const caps = [list.slice().sort((a, b) => b.pop - a.pop || a.id - b.id)[0]];
    while (caps.length < nR) {
      let best = null, bs = -1;
      for (const p of list) {
        if (caps.includes(p)) continue;
        const d = Math.min(...caps.map(c => Math.hypot(c.x - p.x, c.y - p.y)));
        const s = Math.pow(p.pop + 2000, 0.35) * d * (p.terr === 'mountains' || p.terr === 'tundra' ? 0.4 : 1);
        if (s > bs) { bs = s; best = p; }
      }
      caps.push(best);
    }
    const area = list.reduce((s, p) => s + p.cells * 100, 0) * K.held;
    // shares: a power law, the first (most peopled) realm the largest
    const w = caps.map((c, i) => Math.pow(i + 1, -0.8) * R.range(0.7, 1.3));
    const ws = w.reduce((a, b) => a + b, 0);
    caps.forEach((c, i) => {
      const kind = i === 0 && (L === 'R' || L === 'F') ? K.kinds[0] : R.wpick(K.kinds.slice(L === 'R' || L === 'F' ? 1 : 0), k => k[4]);
      realms.push({ L, cap: c, target: Math.max(area * w[i] / ws, c.cells * 100 * 2), kind, area: 0, provs: [] });
    });
  }
  // a few kin of the five peoples where canon points (section 3.3): an orc clan land that never went west, a lost
  // dwarf hold under the Roof, a giant hall in the far north
  const swap = (L, kind, race, near) => {
    const cand = realms.filter(r => r.L === L && r.kind[0] !== 'khaganate' && r.kind[0] !== 'empire').sort((a, b) => Math.hypot(a.cap.x - near[0], a.cap.y - near[1]) - Math.hypot(b.cap.x - near[0], b.cap.y - near[1]));
    if (cand[0]) { cand[0].kind = kind; cand[0].race = race; }
  };
  if (!(LR && LR.realms.length)) {
    swap('F', ['orc clans', 'War-Mother', 'elective', 'female', 1], 'orc', [7600, 1300]);
    swap('H', ['dwarven hold', 'Hold-King', 'hereditary', 'equal', 1], 'dwarf', [7600, 2700]);
    swap('T', ['giant territory', 'Chieftain', 'elective', 'equal', 1], 'giant', [9000, 400]);
  }

  // ---- land: every realm floods out from its capital, cheapest first, until it holds its share
  const cost = p => ({ mountains: 4, desert: 2.6, tundra: 2.6, marsh: 1.6, forest: 1.3, hills: 1.4, steppe: 0.8, plains: 1 })[p.terr] || 1.2;
  const hp = new Heap();
  // far@2: a lore realm holds in each region what the lore says it holds there (holds_km2), as a quota: it grows from
  // its capital and from the province of each other region it holds nearest the capital, and takes a province of a
  // region only while it holds less there than the lore's figure less half the province
  const quota = (r, p) => { const H = r.lore && r.lore.holds; if (!H || p === r.cap) return true; const h = H[p.region] || 0; return (r.got[p.region] || 0) + p.cells * 50 <= h; };
  realms.forEach((r, ri) => { r.got = {}; hp.push(0, ri * 100000 + r.cap.k); });
  realms.forEach((r, ri) => {
    const H = r.lore && r.lore.holds; if (!H) return;
    for (const g of Object.keys(H).sort()) {
      if (g === r.cap.region || !(H[g] > 0)) continue;
      // on the region's border with another region the realm holds, nearest the capital (so its pieces meet)
      let bk = null, bd = Infinity;
      const mineR = new Set(Object.keys(H).concat([r.cap.region]));
      const onEdge = p => [...adjOf(p)].some(j => j >= nb && prov(j) && prov(j).region !== g && mineR.has(prov(j).region));
      for (const edge of [true, false]) {
        for (const p of P) if (p.region === g && p.cells * 50 <= H[g] && (!edge || onEdge(p))) { const d = Math.hypot(p.sx - r.cap.sx, p.sy - r.cap.sy); if (d < bd) { bd = d; bk = p.k; } }
        if (bk != null) break;
      }
      if (bk != null) hp.push(1 + bd / 1000, ri * 100000 + bk);
    }
  });
  const best = new Map();
  while (hp.size) {
    const v = hp.pop(), d = hp.lastKey, ri = Math.floor(v / 100000), k = v % 100000, r = realms[ri], p = P[k];
    if (owner.has(k) || r.area >= r.target || !quota(r, p)) continue;
    owner.set(k, ri); r.area += p.cells * 100; r.provs.push(p); r.got[p.region] = (r.got[p.region] || 0) + p.cells * 100;
    const scale = Math.sqrt(r.target) / 300;
    const step = (j, extra) => {
      if (j < nb) return; const q = prov(j); if (!q || owner.has(q.k)) return;
      const c = d + (cost(q) + extra + (q.land !== r.L ? 6 : 0)) * Math.sqrt(q.cells) / scale;
      const key = ri * 100000 + q.k; if (best.has(key) && best.get(key) <= c) return; best.set(key, c);
      hp.push(c, key);
    };
    for (const j of adjOf(p)) step(j, 0);
    for (const j of seaOf(p)) step(j, 8);
  }
  // unheld land that is good land (farmed or grazed, rule S1) goes to the neighbour it shares most border with; what
  // stays unheld is hard country (mountains, desert, tundra, the thin taiga and the empty forests), the refuges of G5
  const fullyHeld = new Set((lore && lore.regions || []).filter(g => !(g.stateless || []).length && !(+g.open_km2 > 0)).map(g => g.id));
  const take = (p, ri) => { owner.set(p.k, ri); const r = realms[ri]; r.provs.push(p); r.area += p.cells * 100; r.got[p.region] = (r.got[p.region] || 0) + p.cells * 100; };
  // a realm in pieces keeps the piece that holds its capital; the rest is left to the neighbours below
  const onePiece = () => realms.forEach((r, ri) => {
    const mine = new Set(r.provs.map(p => p.k)), seen = new Set([r.cap.k]), q = [r.cap];
    for (let h = 0; h < q.length; h++) for (const j of [...adjOf(q[h]), ...seaOf(q[h])]) { if (j < nb) continue; const o = prov(j); if (o && mine.has(o.k) && !seen.has(o.k)) { seen.add(o.k); q.push(o); } }
    if (seen.size === mine.size) return;
    // first bridge the pieces over unheld land, a few provinces at most
    for (let tries = 0; tries < 8 && seen.size < mine.size; tries++) {
      const from = new Map(), bq = [...seen].map(k => P[k]); for (const p of bq) from.set(p.k, -1);
      let hit = null;
      for (let h = 0; h < bq.length && !hit; h++) {
        const u = bq[h], depth = (function d(k) { let n = 0; while (from.get(k) >= 0) { k = from.get(k); n++; } return n; })(u.k);
        if (depth >= 2) continue;
        for (const j of [...adjOf(u), ...seaOf(u)]) { if (j < nb) continue; const o = prov(j); if (!o || from.has(o.k)) continue;
          if (mine.has(o.k) && !seen.has(o.k)) { from.set(o.k, u.k); hit = o; break; }
          if (!owner.has(o.k)) { from.set(o.k, u.k); bq.push(o); } }
      }
      if (!hit) break;
      for (let k = from.get(hit.k); k >= 0 && !mine.has(k); k = from.get(k)) { const o = P[k]; owner.set(k, ri); r.provs.push(o); mine.add(k); r.area += o.cells * 100; r.got[o.region] = (r.got[o.region] || 0) + o.cells * 100; }
      seen.clear(); seen.add(r.cap.k); const q2 = [r.cap];
      for (let h = 0; h < q2.length; h++) for (const j of [...adjOf(q2[h]), ...seaOf(q2[h])]) { if (j < nb) continue; const o = prov(j); if (o && mine.has(o.k) && !seen.has(o.k)) { seen.add(o.k); q2.push(o); } }
    }
    // then join a coastal piece to the coast of the body by a sea lane (the lore's realms hold far shores: the Walrus
    // Strand's White Shore, a thalassocracy's isles), within 2,500 km
    for (let tries = 0; tries < 12 && seen.size < mine.size; tries++) {
      const body = [...seen].map(k => P[k]).filter(p => p.coast), rest = r.provs.filter(p => !seen.has(p.k) && p.coast);
      let best = null, bd = 2500;
      for (const a of rest) for (const b of body) { const d = Math.hypot(a.sx - b.sx, a.sy - b.sy); if (d < bd) { bd = d; best = [a, b]; } }
      if (!best) break;
      seaOf(best[0]).add(best[1].id); seaOf(best[1]).add(best[0].id);
      seen.clear(); seen.add(r.cap.k); const q3 = [r.cap];
      for (let h = 0; h < q3.length; h++) for (const j of [...adjOf(q3[h]), ...seaOf(q3[h])]) { if (j < nb) continue; const o = prov(j); if (o && mine.has(o.k) && !seen.has(o.k)) { seen.add(o.k); q3.push(o); } }
    }
    if (seen.size === mine.size) return;
    for (const p of r.provs) if (!seen.has(p.k)) { owner.delete(p.k); r.area -= p.cells * 100; r.got[p.region] -= p.cells * 100; }
    r.provs = r.provs.filter(p => seen.has(p.k));
  });
  onePiece();
  // a realm still short in a region takes the unheld provinces of that region on its border, best fit first
  for (let round = 0; round < 30; round++) {
    let moved = 0;
    realms.forEach((r, ri) => {
      const H = r.lore && r.lore.holds; if (!H) return;
      const cand = new Map();
      for (const p of r.provs) for (const j of [...adjOf(p), ...seaOf(p)]) { if (j < nb) continue; const q = prov(j); if (q && !owner.has(q.k) && (H[q.region] || 0) - (r.got[q.region] || 0) >= q.cells * 50) cand.set(q.k, q); }
      const list = [...cand.values()].sort((a, b) => a.k - b.k);
      for (const q of list) if (!owner.has(q.k) && (H[q.region] || 0) - (r.got[q.region] || 0) >= q.cells * 50) { owner.set(q.k, ri); r.provs.push(q); r.area += q.cells * 100; r.got[q.region] = (r.got[q.region] || 0) + q.cells * 100; moved++; }
    });
    if (!moved) break;
  }
  const good = p => p.pop / (p.cells * 100) >= 3.5 && p.terr !== 'mountains' && p.terr !== 'desert' && p.terr !== 'tundra';
  for (let round = 0; round < 40; round++) {
    let moved = 0;
    for (const p of P) {
      if (owner.has(p.k)) continue;
      const tally = new Map();
      for (const j of adjOf(p)) { if (j < nb) continue; const o = owner.get(prov(j).k); if (o != null) tally.set(o, (tally.get(o) || 0) + 1); }
      if (!tally.size) continue;
      const free = [...adjOf(p)].filter(j => j >= nb && !owner.has(prov(j).k)).length;
      // a hard province joins only as an enclave; with the lore, so does any province of a region the lore leaves partly
      // stateless or open (a region it says is all held is all held, whatever the realms' stated areas)
      const loreFree = LR && LR.realms.length && !fullyHeld.has(p.region);
      if ((loreFree || (!(LR && LR.realms.length) && !good(p))) && free > 0) continue;
      // a neighbour still short of what the lore says it holds in this region comes first
      const room = ri => { const H = realms[ri].lore && realms[ri].lore.holds; return H ? (H[p.region] || 0) - (realms[ri].got[p.region] || 0) : 0; };
      const [ri] = [...tally.entries()].sort((a, b) => (room(b[0]) > 0) - (room(a[0]) > 0) || (room(b[0]) > 0 && room(a[0]) > 0 ? room(b[0]) - room(a[0]) : 0) || b[1] - a[1] || a[0] - b[0])[0];
      take(p, ri); moved++;
    }
    if (!moved) break;
  }
  // far@2: the holdings traded toward the lore's figures. A province of a realm that holds more than the lore gives
  // it in that region passes to a neighbour that holds less there than the lore gives it (or, in a region the lore
  // leaves partly stateless, is let go), so long as the realm stays in one piece; then the short realms take the
  // unheld land on their borders again
  if (LR && LR.realms.length) {
    const holdsOf = ri => (realms[ri].lore && realms[ri].lore.holds) || null;
    const room = (ri, g) => { const H = holdsOf(ri); return H ? (H[g] || 0) - (realms[ri].got[g] || 0) : 0; };
    const whole = (ri, without) => {
      const r = realms[ri], seen = new Set([r.cap.k]), q = [r.cap];
      for (let h = 0; h < q.length; h++) for (const j of [...adjOf(q[h]), ...seaOf(q[h])]) { if (j < nb) continue; const o = prov(j); if (o && o.k !== without && owner.get(o.k) === ri && !seen.has(o.k)) { seen.add(o.k); q.push(o); } }
      return seen.size === r.provs.length - 1;
    };
    const give = (p, from, to) => {
      const a = realms[from]; a.provs = a.provs.filter(x => x !== p); a.area -= p.cells * 100; a.got[p.region] -= p.cells * 100;
      if (to == null) { owner.delete(p.k); return; }
      take(p, to);
    };
    // a move is made only when it brings the holdings nearer the lore's on the whole: the giver's miss and the
    // taker's together shrink (a realm with no figures in a region misses by all it holds there)
    const miss = (ri, g, d) => { const H = holdsOf(ri); const h = H ? (H[g] || 0) : 0, x = (realms[ri].got[g] || 0) + d; return Math.abs(x - h); };
    for (let pass = 0; pass < 4; pass++) {
    for (let round = 0; round < 24; round++) {
      let moved = 0;
      for (const p of P) {
        const ri = owner.get(p.k); if (ri == null || p === realms[ri].cap) continue;
        const s2 = p.cells * 100, g = p.region, loss = miss(ri, g, -s2) - miss(ri, g, 0);
        if (loss >= 0) continue;
        const nbrs = new Set(); for (const j of [...adjOf(p), ...seaOf(p)]) { if (j < nb) continue; const o = owner.get(prov(j).k); if (o != null && o !== ri) nbrs.add(o); }
        let to = null, best = fullyHeld.has(g) ? -1 : loss;   // let go only where the lore leaves the region partly unheld
        for (const o of [...nbrs].sort((a, b) => a - b)) { const gain = loss + miss(o, g, s2) - miss(o, g, 0); if (gain < best - 1) { best = gain; to = o; } }
        if (best >= 0 || (to == null && fullyHeld.has(g))) continue;
        if (!whole(ri, p.k)) continue;
        give(p, ri, to); moved++;
      }
      if (!moved) break;
    }
    for (let round = 0; round < 30; round++) {
      let moved = 0;
      realms.forEach((r, ri) => {
        const H = holdsOf(ri); if (!H) return;
        const cand = new Map();
        for (const p of r.provs) for (const j of [...adjOf(p), ...seaOf(p)]) { if (j < nb) continue; const q = prov(j); if (q && !owner.has(q.k) && room(ri, q.region) >= q.cells * 50) cand.set(q.k, q); }
        for (const q of [...cand.values()].sort((a, b) => a.k - b.k)) if (!owner.has(q.k) && room(ri, q.region) >= q.cells * 50) { take(q, ri); moved++; }
      });
      if (!moved) break;
    }
    }
  }
  // ---- what kind of polity each is follows its size in its land: the largest are kingdoms and empires, the smallest
  // city-states, ports, temples and chiefdoms (the lore's own, and the kin peoples', keep theirs)
  const SIZE = { empire: 3, khaganate: 3, kingdom: 2.5, 'mandala kingdom': 2.5, thalassocracy: 2.5, 'island realm': 2.5, 'island kingdom': 2, principality: 2, sultanate: 2,
    'oasis kingdom': 2, 'nomad confederation': 2, 'cattle kingdom': 2, 'clan lordship': 1.5, 'horse clans': 1.5, 'tribal confederation': 1.5, 'household lordship': 1.5,
    'mountain confederation': 1.5, 'temple state': 1.2, 'river league': 1.2, 'city-state': 1, 'port city': 1, 'caravan league': 1, 'city league': 1, chiefdom: 1, 'hill chiefdom': 1, 'fur league': 1, 'sea-hunter clans': 1 };
  for (const L of lands) {
    const K = POLITY[L], mine = realms.filter(r => r.L === L && !r.lore && !r.race && SIZE[r.kind[0]] !== 3).map(r => Object.assign(r, { popNow: r.provs.reduce((a, p) => a + p.pop, 0) })).sort((a, b) => b.popNow - a.popNow || a.cap.k - b.cap.k);
    mine.forEach((r, i) => {
      const q = mine.length > 1 ? i / (mine.length - 1) : 0, pool = K.kinds.filter(k => SIZE[k[0]] !== 3);
      const fit = pool.filter(k => q < 0.25 ? SIZE[k[0]] >= 2 : q > 0.6 ? SIZE[k[0]] <= 1.5 : true);
      r.kind = R.wpick(fit.length ? fit : pool, k => k[4]);
    });
  }
  // how near each lore realm's holdings come to the lore's holds_km2, region by region
  const quotaReport = () => {
    let want = 0, off = 0, n = 0, worst = [];
    for (const r of realms) {
      const H = r.lore && r.lore.holds; if (!H) continue;
      const got = {}; for (const p of r.provs) got[p.region] = (got[p.region] || 0) + p.cells * 100;
      for (const g of new Set(Object.keys(H).concat(Object.keys(got)))) { const h = H[g] || 0, x = got[g] || 0; want += h; off += Math.abs(x - h); n++; worst.push([Math.abs(x - h), r.lore.id, g, h, x]); }
    }
    worst.sort((a, b) => b[0] - a[0]);
    return { want, off, err: want ? off / want : 0, n, worst: worst.slice(0, 5) };
  };
  // ---- records
  const out = {}, houses = {}, relations = [], seat = {};
  realms.forEach((r, ri) => {
    const lr = r.lore, id = lr ? lr.id : `POL-${rn++}`; r.id = id;
    const cult = lr && lr.cult && cultures[lr.cult] ? lr.cult : r.race === 'orc' || r.race === 'dwarf' || r.race === 'giant' ? null : cultOf[r.L][r.cap.x > (byLand[r.L].reduce((s, p) => s + p.x, 0) / byLand[r.L].length) ? 1 : 0];
    r.cult = cult;
    const [type] = r.kind;
    if (lr) { r.name = lr.name; r.short = (lr.short || lr.name.replace(/^(the |Kingdom of |Empire of |Principality of |City of |Sultanate of )/i, '')).replace(/^the /, ''); if (lr.capital) r.capName = lr.capital; if (lr.place) r.cap.pid = lr.place; used.add(r.short.toLowerCase()); return; }
    const nmr = namers[r.L][r.cap.x % 2], word = nmr.word({ min: 4, max: 8 });
    const [name, short] = (NAME_OF[type] || (n => [`Kingdom of ${n}`, n]))(word);
    r.name = name; r.short = short;
  });
  // the kin peoples get cultures of their own
  for (const [race, nm, note, L] of [['orc', 'Old Grass orcs', 'Orc clans of the far steppe, who never rode west with the Horde.', 'F'], ['dwarf', 'Roofholders', 'The dwarves of a hold the western holds say was abandoned.', 'H'], ['giant', 'Pine-giants', 'The last hall of giants in the far north.', 'T']]) {
    const r = loreHas ? null : realms.find(x => x.race === race); if (!r) continue;
    const id = `CUL-${String(cn++).padStart(2, '0')}`, nmr = namer(R, L, 1, used), list = (k, o) => Array.from({ length: k }, () => nmr.word(o));
    cultures[id] = { id, name: nm, race, home: '', pols: [], note, m: list(30, { min: 3, max: 7, end: false }), f: list(30, { min: 3, max: 7, end: true }), house: list(20, { min: 4, max: 8 }), epi: EPI[L].slice(), land: L };
    naming[id] = race === 'giant' ? { common: 'single', noble: 'single', note: 'One name and the hall.' } : race === 'dwarf' ? { common: 'house', noble: 'house', note: 'A given name and a clan name.' } : { common: 'clan', noble: 'clan', note: 'A short given name and the clan.' };
    lang[id] = race === 'orc' ? 'Old Orcish' : race === 'dwarf' ? 'Roof Holdspeech' : 'Old Hall Tongue';
    r.cult = id;
  }
  // ---- far@2: every province named from its people's own place names (places.mjs); a capital keeps the lore's name
  let placeReport = null;
  if (loreHas) {
    const capOf = new Map(); for (const r of realms) if (r.capName) { capOf.set(r.cap.k, r.capName); used.add(r.capName.toLowerCase()); }
    for (const [k, nm] of capOf) { P[k].name = nm; P[k].base = nm; }
    const ownerOf = new Map(); for (const [k, ri] of owner) ownerOf.set(k, ri);
    // an unheld province is named by the people of the nearest held one
    const near = new Map(), q = [];
    for (const [k, ri] of ownerOf) { near.set(k, ri); q.push(P[k]); }
    for (let h = 0; h < q.length; h++) for (const j of adjOf(q[h])) { if (j < nb) continue; const o = prov(j); if (o && !near.has(o.k)) { near.set(o.k, near.get(q[h].k)); q.push(o); } }
    const withPlaces = id => id && cultures[id] && cultures[id].places && cultures[id].places.length;
    const landCults = {}; for (const id of Object.keys(cultures).sort()) { const c = cultures[id]; if (withPlaces(id)) (landCults[c.land] = landCults[c.land] || []).push(id); }
    const keysOfRealm = r => [r.cult, ...((r.lore && r.lore.cults) || [])].filter(withPlaces);
    placeReport = nameProvinces(P.filter(p => !capOf.has(p.k)), {
      list: id => cultures[id].places,
      // the realm's own peoples, then the other peoples of its land
      keys: p => { const ri = near.get(p.k), ks = ri != null ? keysOfRealm(realms[ri]) : []; return [...new Set(ks.concat(landCults[p.land] || []))]; },
      all: Object.keys(cultures).sort().filter(withPlaces),
    }, used);
  }
  const colorOf = {};
  const realmNbrs = ri => { const s = new Set(); for (const p of realms[ri].provs) for (const j of adjOf(p)) { if (j < nb) { const L = base.provinces[j]; if (L && L.realm && L.realm !== 'unclaimed') s.add('B:' + L.realm); continue; } const o = owner.get(prov(j).k); if (o != null && o !== ri) s.add(o); } return s; };
  realms.forEach((r, ri) => {
    const nbrs = realmNbrs(ri), taken = new Set();
    for (const o of nbrs) { if (typeof o === 'string') { const L = base.LORE.realms[o.slice(2)]; if (L) taken.add(L.color); } else if (colorOf[o]) taken.add(colorOf[o]); }
    const free = PASTEL.filter(c => !taken.has(c));
    colorOf[ri] = (free.length ? free : PASTEL)[(ri * 7) % (free.length || PASTEL.length)];
  });
  realms.forEach((r, ri) => {
    const pop = r.provs.reduce((s, p) => s + p.pop, 0), L = r.L, [type, title, gov, law] = r.kind;
    // herders are taxed as herders; a farming kingdom or a town of the Long Grass (the Birch March, the free towns) as
    // farmers and townsmen (far@2: far@1 taxed every realm of the Long Grass as nomads)
    const settled = /farm|town|city|republic|kingdom|league|march/i.test(((r.lore && r.lore.typeFull) || '') + ' ' + type) && !/khagan|horde|clan|confedera|nomad/i.test(type);
    const nomad = (L === 'F' && !settled) || type === 'sea-hunter clans' || type === 'chiefdom' || type === 'horse clans' || r.race === 'orc';
    const income = Math.round(pop * (nomad ? 0.06 : type === 'city-state' || type === 'port city' || type === 'caravan league' ? 0.32 : 0.17));
    const army = r.lore && r.lore.standing ? Math.round(r.lore.standing) : Math.max(300, Math.round(pop * (nomad ? 0.016 : r.race === 'giant' ? 0.002 : 0.011) / 100) * 100);
    const c = COMP[L], comp = { standing: army };
    ['heavyHorse', 'lightHorse', 'elephants', 'heavyFoot', 'spear', 'missile', 'other'].forEach((k, i) => { comp[k] = Math.round(army * c[i] / 100) * 100; });
    const coastal = r.provs.filter(p => p.coast).length;
    const raceKey = r.race || 'human', pops = { human: 0, elf: 0, dwarf: 0, orc: 0, giant: 0, 'half-elf': 0, 'half-orc': 0 };
    pops[raceKey] = Math.round(pop * 0.97); pops.human += pop - pops[raceKey];
    const lr = r.lore, capName = r.cap.name;
    const faith = lr && lr.faith && faiths.some(f => f.id === lr.faith) ? lr.faith : faithOf[L][r.cap.y % 3 === 0 && faithOf[L][1] ? 1 : 0];
    const stab = lr && ['firm', 'steady', 'strained', 'brittle', 'broken'].includes(lr.stability) ? lr.stability : R.wpick(['firm', 'steady', 'steady', 'strained', 'strained', 'brittle'], () => 1);
    const nbrs = [...realmNbrs(ri)].filter(o => typeof o === 'number');
    const shared = o => { let n = 0; for (const p of r.provs) for (const j of adjOf(p)) if (j >= nb && owner.get(prov(j).k) === o) n++; return n; };
    const rivals = nbrs.sort((a, b) => shared(b) - shared(a) || a - b).slice(0, R.int(1, 2));
    r.rivals = rivals; r.pop = pop;
    const hid = `FAM-F${String(hn++).padStart(3, '0')}`, cult = r.cult ? cultures[r.cult] : null;
    const loreHouse = lr && lr.house && !/^\(/.test(lr.house) ? lr.house.replace(/\s*\(.*\)\s*$/, '') : null;
    const sur = loreHouse ? loreHouse.replace(/^(House|Clan|The|the)\s+/, '').replace(/\s+(line|clan|chiefs|hearth)$/i, '').split(' ')[0] : cult ? R.pick(cult.house) : namers[L][0].word({ min: 4, max: 8 });
    houses[hid] = { id: hid, name: loreHouse ? (/^(House|Clan|The) /.test(loreHouse) ? loreHouse : `House ${loreHouse}`) : `House ${sur}`, realm: r.id, kind: 'royal', seat: capName, seatId: r.cap.pid, head: null, headName: '', rung: 'S01', title, local: `${title} of ${r.short}`, holding: `The crown of ${r.short} and the lands about ${capName}`, people: pop, levy: 0, since: String(R.int(700, 1080)), notes: '', sur };
    // one or two noble houses seated elsewhere in the realm, for the court and its quarrels
    const others = r.provs.filter(p => p !== r.cap).sort((a, b) => b.pop - a.pop).slice(0, r.provs.length > 6 ? 2 : r.provs.length > 2 ? 1 : 0);
    for (const p of others) {
      const nid = `FAM-F${String(hn++).padStart(3, '0')}`, s2 = cult ? R.pick(cult.house.filter(h => h !== sur)) : namers[L][1].word({ min: 4, max: 8 });
      houses[nid] = { id: nid, name: `House ${s2}`, realm: r.id, kind: 'noble', seat: p.name, seatId: p.pid, head: null, headName: '', rung: 'S03', title: 'Lord', local: `Lord of ${p.name}`, holding: `${p.name} and its villages`, people: p.pop, levy: Math.round(p.pop * 0.01), since: String(R.int(600, 1090)), notes: '', sur: s2 };
    }
    out[r.id] = {
      name: r.name, short: r.short, title, type, race: raceKey, cult: r.cult, capId: r.cap.pid, capital: capName, area: r.area, color: colorOf[ri], gov: type,
      ruler: null, pop, pops, urban: Math.round(clamp(r.provs.reduce((s, p) => s + p.town, 0) / Math.max(1, pop) * 100, 1, 30) * 10) / 10,
      army, levy: lr && lr.levyN ? Math.round(lr.levyN) : army * 4, field: Math.round(army * 0.4), ships: Math.min(60, coastal * 3), income, coinName: '', taxes: '', debts: 'none',
      exports: ECON[L].ex, imports: ECON[L].im, food: L === 'F' || L === 'N' || L === 'B' ? 'deficit' : 'surplus', faith, langs: r.cult ? lang[r.cult] : '',
      allies: [], rivals: [], atWar: [], stability: stab, comp, fleet: { ships: `${Math.min(60, coastal * 3)} ships`, field: '' }, coin: { coin: 'silver', worth: 1 },
      primer: null, land: L, region: r.cap.region, govLaw: { gov, law }, house: hid, provs: r.provs.map(p => p.id),
      holds: lr && lr.holds ? lr.holds : null,
      rulerName: lr && lr.ruler ? lr.ruler : null, rulerSex: lr ? lr.rulerSex || null : null, rulerBorn: lr ? lr.born || null : null, capName: r.capName || null, lore: !!lr,
      loreNote: lr ? { intro: lr.intro || '', want: lr.want || '', fear: lr.fear || '', ruler: lr.rulerNote || '' } : null,
    };
    if (lr && lr.color) out[r.id].color = lr.color;
    for (const p of r.provs) p.realm = r.id;
    if (r.cult) cultures[r.cult].pols.push(r.id);
    const f = faiths.find(x => x.id === faith); if (f) f.realms.push(r.id);
  });
  // rivals both ways; an ally two steps off (the enemy of my enemy), now and then
  realms.forEach(r => { out[r.id].rivals = [...new Set(r.rivals.map(o => realms[o].id))]; });
  for (const r of realms) for (const o of out[r.id].rivals) if (!out[o].rivals.includes(r.id)) out[o].rivals.push(r.id);
  realms.forEach((r, ri) => {
    if (R() > 0.55) return;
    const enemies = new Set(out[r.id].rivals), cand = [];
    for (const e of enemies) for (const ee of out[e].rivals) if (ee !== r.id && !enemies.has(ee) && !out[r.id].allies.includes(ee)) cand.push(ee);
    if (!cand.length) return;
    const a = cand.sort()[0];
    if (out[a].allies.length >= 2) return;
    out[r.id].allies.push(a); out[a].allies.push(r.id);
    relations.push({ a: r.id, b: a, rel: 'alliance', detail: 'alliance against a common enemy' });
  });
  if (lore && Array.isArray(lore.relations) && LR && LR.realms.length) {
    // the lore's own ties replace the made-up ones: tribute is a debt the payer owes; a tie to a realm of the Known World
    // stands as written (the game sets it when both realms exist)
    for (const r of realms) { out[r.id].rivals = []; out[r.id].allies = []; }
    relations.length = 0;
    const known = id => out[id] || base.LORE.realms[id];
    for (const x of lore.relations) {
      const a = String(x.a || ''), b = String(x.b || ''), kind = String(x.kind || x.rel || '');
      if (!known(a) || !known(b) || (!out[a] && !out[b])) continue;
      const rel = kind === 'tribute' ? 'debt' : ['alliance', 'friendship', 'trade', 'debt', 'secret deal', 'backs claimant', 'rivalry', 'hostile'].includes(kind) ? kind : null;
      if (!rel) continue;
      relations.push({ a, b, rel, detail: String((kind === 'tribute' ? 'tribute: ' : '') + (x.note || kind)).replace(/[<>"]/g, '').slice(0, 200) });
      const both = (k, v) => { if (out[a] && !out[a][k].includes(b)) out[a][k].push(b); if (out[b] && !out[b][k].includes(a)) out[b][k].push(a); };
      if (rel === 'alliance') both('allies'); else if (rel === 'rivalry' || rel === 'hostile') both('rivals');
    }
  } else for (const r of realms) for (const o of out[r.id].rivals) if (r.id < o) relations.push({ a: r.id, b: o, rel: 'rivalry', detail: 'border rivalry' });
  return { realms: out, houses, relations, cultures, naming, lang, faiths, owner: realms.map(r => r.id), loreReport, placeReport, quota: quotaReport() };
}
