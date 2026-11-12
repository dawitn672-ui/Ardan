// Beasts live where the world bible says they live.
//
// The release's A.beastsNear(pc) matches a beast to a province by terrain word alone (forest, hills, steppe...), so the
// Tiger of Ranpur (lore: "The Monsoon Coast and Worldspine foothills") is near 244 of the 306 provinces, Aldmark included.
// This wraps it. A beast is near only where the home province's canon region is in that beast's canon range. Inside its
// range the release's terrain word still narrows it, except in a region of its range where no province carries a terrain
// the release allows for it (the Monuti valley is drawn as desert, Frostholm as forest): there the whole region counts,
// because the canon range is the source of truth and the terrain words are the release's guess.
// A beast or a province with no canon match keeps the release's rule. Nothing here draws a random number or touches A.S.
//
// Two tables, baked from the world bible (canon/, read-only, not in the repo), matched by name:
//   RANGE   from canon/mythos/bestiary.csv (columns name, range_regions): each game beast's canon range, as written.
//   REGION  from canon/map/gazetteer_major.csv (columns name, region): each game province's canon region, by name.
// One qualifier in the ranges is narrowed by hand (NARROW below); the others are whole regions.
const BH = A.BH = A.BH || {};

// canon/mythos/bestiary.csv, range_regions, for the 25 beasts in A.BEASTS (all 25 match by name and id).
BH.RANGE = {
  "Great Ash Dragon": { range: "E-10, E-11, E-12, southern E-02", regions: ["E-10", "E-11", "E-12", "E-02"] },
  "Sunwall Wyvern": { range: "S-01, S-04 (north edge)", regions: ["S-01", "S-04"] },
  "Amber Wyrm": { range: "E-14, E-15, E-16", regions: ["E-14", "E-15", "E-16"] },
  "Snow Drake": { range: "W-08, the Crown Range", regions: ["W-08"] },
  "The Grey Stag": { range: "W-01", regions: ["W-01"] },
  "Aurochs": { range: "W-01, W-02", regions: ["W-01", "W-02"] },
  "The Evenwood Wolf": { range: "W-01, W-14", regions: ["W-01", "W-14"] },
  "Hell Boar": { range: "W-10, W-06", regions: ["W-10", "W-06"] },
  "Cave Bear": { range: "W-15, W-14", regions: ["W-15", "W-14"] },
  "White Wyrm": { range: "E-11, E-12, W-15", regions: ["E-11", "E-12", "W-15"] },
  "Snow Ape": { range: "E-12, E-10", regions: ["E-12", "E-10"] },
  "The Thunder Mammoth": { range: "W-19", regions: ["W-19"] },
  "Woolly Rhino": { range: "E-08, E-07", regions: ["E-08", "E-07"] },
  "Cave Hyena": { range: "W-16, W-17", regions: ["W-16", "W-17"] },
  "Basilisk": { range: "S-04, S-01, S-03", regions: ["S-04", "S-01", "S-03"] },
  "Sand Dragon": { range: "S-04, S-05", regions: ["S-04", "S-05"] },
  "Great Crocodile": { range: "S-06", regions: ["S-06"] },
  "River Horse": { range: "S-06, S-07, S-09", regions: ["S-06", "S-07", "S-09"] },
  "Green Anaconda": { range: "S-12, S-11", regions: ["S-12", "S-11"] },
  "Tiger of Ranpur": { range: "E-13, E-12", regions: ["E-13", "E-12"] },
  "World Python": { range: "S-12, E-14, E-13", regions: ["S-12", "E-14", "E-13"] },
  "The Roc": { range: "E-16", regions: ["E-16"] },
  "Forest Men": { range: "S-12", regions: ["S-12"] },
  "Hael Hounds": { range: "W-05", regions: ["W-05"] },
  "Old Man of the Trees": { range: "S-12", regions: ["S-12"] },
};

// canon/map/gazetteer_major.csv, region of each of the 306 game provinces (all 306 match by name; their place_id is
// the province's pid too). W- Westland, E- Eastland, S- Southland, X- the small unclaimed wilds.
BH.REGION = {
  'E-01': ["Tessar", "Calossa", "Feleria"],
  'E-02': ["The Free Marches"],
  'E-03': ["Velgrad", "Mirgrad", "Sevina", "Velany", "Belovo", "Vyova", "Kamogda Kremlin", "Belina", "Droin", "Lubyn Kremlin", "Velin", "Belansk", "Dobina", "Yarec"],
  'E-04': ["Drevna", "Belek", "Dobin", "Kraina", "Zorek", "Brodava", "Polgrad", "Ugava Fort", "Tversk Fort", "Darsky", "Dobnik Fort", "Lubevo Kremlin", "Radov"],
  'E-05': ["The Frostfells"],
  'E-06': ["Jotunhall", "Valdhall", "Valdgard", "Torholm"],
  'E-07': ["The Whale Woods"],
  'E-08': ["Grakmar", "Drukgar Stockade", "Oggoth Oasis", "Tukgar Stockade", "Vashuk Oasis", "Roktuk Oasis"],
  'E-09': ["Skyhold", "Quietwatch Monastery", "Starspire", "Moonstair", "Drumhaven Monastery", "Bellcrest", "Eaglespire", "Stonespire Monastery"],
  'E-10': ["The High Wastes"],
  'E-11': ["Stonehold", "Morhall", "Barmark Gate", "Mormund", "Garbek Gate", "Dramhall"],
  'E-12': ["Emberdeep", "Maghelm", "Gorhall"],
  'E-13': ["Ranpur", "Chanari", "Tiravi", "Madora", "Ekapur"],
  'E-14': ["Amberport", "Ruhu", "Paamu"],
  'E-15': ["The Amber Wilds"],
  'E-16': ["The Isle of Pearls"],
  'S-01': ["Miruma", "Ashah", "Faluz Tower", "Fort Tabir", "Fasun", "Nahin", "Hazifa", "Qarifa"],
  'S-02': ["The Bone Coast"],
  'S-03': ["Sabra", "Sarabad", "Sabira", "Zahas", "Daham Tower", "Nahur", "Basir", "Zariya"],
  'S-04': ["Zarak", "Marir", "Zabesh Oasis", "Janiya", "Zahira", "Nahib Oasis", "Badayn Oasis", "Halai Oasis", "Mirah", "Najuma Oasis", "Tamuma Oasis", "Qaruma Oasis", "Kafam Caravanserai", "Januma Caravanserai", "Dahur Oasis", "Bahib Oasis", "Zaruz Oasis", "Talabad Oasis", "Qasan", "Marabad Oasis", "Yasib Oasis", "Jalar Oasis"],
  'S-05': ["The Burning Waste"],
  'S-06': ["Tamar", "Rashira", "Talim", "Akayn", "Khaiyah", "Fort Halifa"],
  'S-07': ["Zanara", "Atani", "Jiamo", "Jitamo", "Datula Walls", "Osezi", "Bayalo", "Asilo Oasis", "Kabale", "Seduna Walls", "Omamba", "Owana", "Tefude", "Fort Zuafa", "Jiwamo", "Tandi", "Fort Nisi", "Wahabo", "Anumba", "Tetamba", "Samandi", "Juwalo"],
  'S-08': ["The Western Veld"],
  'S-09': ["Abara", "Jimba", "Fort Makale", "Okilo", "Koyako", "Balona", "Yandi", "Kasani", "Nusalo", "Tezenga", "Londi Walls", "Kokuka Walls", "Selomba", "Wamazi"],
  'S-10': ["The Thornveld"],
  'S-11': ["Kesh", "Kioya", "Monuro", "Zetu", "Fort Zubanga"],
  'S-12': ["The Deep Green"],
  'S-13': ["Blackreef", "Ratrock"],
  'W-01': ["Evenglade", "Fenali", "Falessa", "Loriel", "Eridor", "Vaelion", "Fenarin", "Calandor", "Lirith", "Aravel", "Thalandor", "Lirthil", "Aressa", "Silande", "Aerion", "Rinthil", "Rineron", "Syleron", "Mirlas", "Elwen", "Eriavel", "Erilas"],
  'W-02': ["Silverbough", "Ithira", "Mirandor", "Falavel", "Fenandor", "Aerdor", "Nimion"],
  'W-03': ["Ashmere", "Chasethwaite Tower", "Stagley", "Ashwell Tower", "Brightkeep", "Alderwick", "Heroncliff", "Sun Temple of Aldminster", "Saltmoor"],
  'W-04': ["The Western Highlands"],
  'W-05': ["The Ashlands"],
  'W-06': ["Varenna", "Ardata", "Camia", "Vitina", "Castella", "Torossa", "Norona", "Casteria", "Calena", "Pertello", "Tibata", "Tarona", "Aurora", "Ambalia", "Taria", "Valia", "Lunium", "Tarium", "Rocca Pavice", "Vitia", "Venina"],
  'W-07': ["Solenne", "Lorina", "Mireria", "Brunentia", "Venella"],
  'W-08': ["Highcastle", "Bearfold", "Whitfield", "Highwold"],
  'W-09': ["Ostra", "Fort Barica", "Miressa", "Novice"],
  'W-10': ["Morhaven", "Lucina", "Castel Ascino"],
  'W-11': ["Lavium"],
  'W-12': ["Kingsmere", "Carrness", "Eagleburg", "Frosthollow Castle", "Brookcliff", "Easterham", "Copperham", "Larkton Tower", "Copperton Tower", "Thornstone", "Yewmarch", "Silverhollow", "Foxhurst", "Crossmarch", "Northmoor", "Amberwick", "Galemere Tower", "Goldburg", "Briarbrook", "Hazelhollow"],
  'W-13': ["Saltbridge", "Coldhaven", "Flintwall Tower"],
  'W-14': ["The Pinewild"],
  'W-15': ["Irondeep"],
  'W-16': ["Urgol", "Nagdur Stockade", "Ughdur Ring", "Grakzag Oasis", "Skartar Caravanserai", "Rushzag Oasis", "Rushoth Caravanserai", "Gorur Caravanserai", "Vrakhul Oasis", "Kagdush Oasis", "Yagrak Caravanserai"],
  'W-17': ["Kharsa", "Kultau", "Bekar", "Ozlun", "Otbash Yam", "Sartobe Yam", "Agbay Yam", "Altsa Yam"],
  'W-18': ["Greyhaven", "Wrendale", "Highwell", "Hawkcester", "Deepwatch Castle", "Wrenreach", "Briarhollow", "Silverdale"],
  'W-19': ["Skarfell", "Helstad"],
  'X-01': ["The Little Amber Wilds"],
  'X-02': ["The Bleakfold"],
  'X-03': ["The Tverko Woods"],
  'X-04': ["The Trolness Fells"],
  'X-05': ["The Mammoth Downs"],
  'X-06': ["The Dobava Wilds"],
  'X-07': ["The Stairwood"],
  'X-08': ["The Mirun Pines"],
  'X-09': ["The Samuma Uplands"],
  'X-10': ["The Lunora Woods"],
  'X-11': ["The Firststone Hills"],
};

// Qualifiers in the canon ranges. "S-04 (north edge)" for the Sunwall Wyvern: the Red Waste's desert band under the
// Sunwall's southern face, north of where it turns to savanna (gazetteer y_km under 3,700; part11b names the wyvern in
// the Sunwall's southern-face zones and not in the savanna). "southern E-02" (Great Ash Dragon) is the one province of
// the Free Marches, so it stays whole. "the Crown Range" beside W-08 (Snow Drake) describes W-08, the Crown Highlands.
BH.NARROW = {
  'Sunwall Wyvern': { 'S-04': ['Janiya', 'Kafam Caravanserai', 'Dahur Oasis', 'Zabesh Oasis', 'Zarak', 'Marabad Oasis', 'Yasib Oasis', 'Talabad Oasis'] },
};

// The release's terrain test, as A.beastsNear writes it, for one province's terrain word.
BH.terrOk = (B, terr) => B.terr.includes(terr) || (terr === 'steppe' && B.terr.includes('plains')) || (terr === 'plains' && B.terr.includes('savanna'));

// Resolved once, from LORE and the map as written (LORE.map.provinces), never from the live state, so conquest and the
// varied worlds of 43 and 70 do not move a beast's country. Module data, not game state.
let R = null;
BH.resolve = function () {
  if (R) return R;
  const map = (LORE.map && LORE.map.provinces) || [];
  const regionOf = {}, byRegion = {};
  for (const code in BH.REGION) for (const n of BH.REGION[code]) regionOf[n] = code;
  for (const p of map) if (regionOf[p.name]) (byRegion[regionOf[p.name]] = byRegion[regionOf[p.name]] || []).push(p);
  const nameOf = id => { const c = LORE.creatures.find(x => x.id === id); return c ? c.name : null; };
  const E = {}, unmatchedBeasts = [], unmatchedPlaces = map.filter(p => !regionOf[p.name]).map(p => p.name);
  for (const id in A.BEASTS) {
    const nm = nameOf(id), r = nm && BH.RANGE[nm];
    if (!r) { unmatchedBeasts.push(id + (nm ? ' ' + nm : '')); continue; }
    const B = A.BEASTS[id], narrow = BH.NARROW[nm] || {}, inRange = new Set(), loose = new Set();
    for (const code of r.regions) {
      const ps = (byRegion[code] || []).filter(p => !narrow[code] || narrow[code].includes(p.name));
      for (const p of ps) inRange.add(p.id);
      if (!ps.some(p => BH.terrOk(B, p.terr))) for (const p of ps) loose.add(p.id); // no province here fits its terrain words
    }
    E[id] = { name: nm, inRange, loose };
  }
  R = { E, regionOf, unmatchedBeasts, unmatchedPlaces };
  return R;
};

// Is beast `id` near province P? null when canon has nothing to say (no match), and the release's rule stands.
BH.canonSays = function (id, P) {
  const r = BH.resolve(), e = r.E[id];
  if (!e || !P || !r.regionOf[P.name]) return null;
  return e.inRange.has(P.id) && (e.loose.has(P.id) || BH.terrOk(A.BEASTS[id], P.terr));
};
BH.suits = (id, P) => { const c = BH.canonSays(id, P); return c == null ? true : c; };

const releaseNear = A.beastsNear;
BH.releaseNear = releaseNear;
BH.OFF = false;
A.beastsNear = function (pc) {
  const out = releaseNear.apply(this, arguments);
  if (BH.OFF) return out;
  const P = pc && pc.home != null ? A.prov(pc.home) : null;
  if (!P) return out;               // no province: the release's own default stands
  const res = [];
  for (const id in A.BEASTS) {      // the release's order, so a pick from the list is as stable as before
    const c = BH.canonSays(id, P);
    if (c == null ? out.includes(id) : (c && LORE.creatures.find(x => x.id === id))) res.push(id);
  }
  return res;
};
