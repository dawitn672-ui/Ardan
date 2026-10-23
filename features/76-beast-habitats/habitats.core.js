// Beasts live where their lore says they live.
//
// The release's A.beastsNear(pc) matches a beast to a province by terrain word alone (forest, hills, steppe...), so the
// Tiger of Ranpur (lore: "The Monsoon Coast and Worldspine foothills") is near 204 of the 306 provinces, Aldmark included.
// This wraps it: the release's terrain match still applies, and the beast must also suit the province's biome and, where
// its lore names a place, be in that place. Nothing here draws a random number or touches A.S.
//
// The table below is the data. Each entry:
//   biomes  the province biomes it can live in (P.biome), from the lore habitat and category. Always required.
//   realms  realms (as the map draws them, LORE.map.provinces[i].realm) that ARE the region its lore names.
//   wilds   named provinces (usually unclaimed wilds such as the Deep Green) its lore names.
//   edge    also the provinces next to a listed wild, when their biome is in `biomes` (the forest edge, the fells around it).
//   terrIn  narrows the release's terrain words for this beast (the Great Ash Dragon keeps to country drawn as mountains).
//   extra   named provinces where it lives although the release's terrain word for the beast does not match there. Used
//           only where its lore homeland has no province the release's terrain allows, so it would otherwise be nowhere.
// When an entry has realms, wilds or extra, the beast must be in one of them; with none, any province of its biomes will do.
// A beast added later to A.BEASTS without an entry keeps the release's rule.
const BH = A.BH = A.BH || {};

const SUNLANDS = ['POL-02', 'POL-03', 'POL-04', 'POL-15', 'POL-16', 'POL-31']; // CUL-01 Solenfolk: "The Sunlands, Lucerna, the Neck"
const NORTHFOLK = ['POL-01', 'POL-05', 'POL-08', 'POL-13', 'POL-14'];            // CUL-02 Northfolk, who tell of the Evenwood Wolf
const WORLDSPINE = ['POL-27', 'POL-28', 'POL-29'];                            // Skyhold, Stonehold, Emberdeep (RACE-DWF: "Stonehold and Emberdeep (Worldspine)")

BH.TABLE = {
  'CRE-01': { name: 'Great Ash Dragon', biomes: ['Alpine highland'], terrIn: ['mountains'],
    why: '"High mountains with updrafts and hot springs": any alpine highland drawn as mountains (as the game\'s own sky-king scene asks), not the alpine hills.' },
  'CRE-03': { name: 'Sunwall Wyvern', biomes: ['Steppe', 'Desert'], realms: ['POL-17', 'POL-19', 'POL-24'],
    why: '"Cliffs and gorges of the Sunwall": the desert-edge hills of Qadir, the Sand Clans and Sabra (the realms the game\'s own wyvern-egg scene uses), not their savanna south.' },
  'CRE-05': { name: 'Amber Wyrm', biomes: ['Tropical rainforest'], realms: ['POL-32'], wilds: ['The Isle of Pearls'],
    why: '"Rainforest and scrub of the Amber Isles and the Isle of Pearls" (the Isle is hills, which the release\'s forest/marsh terrain never matches).' },
  'CRE-06': { name: 'Snow Drake', biomes: ['Alpine highland'], extra: ['Highcastle'],
    why: '"High valleys of the Crown Range", above Highcastle, where the Stonefoot kin guard about 15 (SEC lore). No Highland League province is drawn as mountains, so Highcastle is named.' },
  'CRE-19': { name: 'The Grey Stag', biomes: ['Temperate forest'], realms: ['POL-06'],
    why: '"Deep old-growth of the Evenwood"; "hunted out of every human land". Sylvaran only.' },
  'CRE-20': { name: 'Aurochs', biomes: ['Temperate forest'], realms: ['POL-06', 'POL-07'],
    why: '"The Evenwood and the Elder Coast"; "alive (in elven lands)". Sylvaran and Eldergrove.' },
  'CRE-21': { name: 'The Evenwood Wolf', biomes: ['Temperate forest', 'Taiga', 'Tundra'], realms: ['POL-06'].concat(NORTHFOLK), wilds: ['The Pinewild'], edge: true,
    why: '"The Evenwood, the Pinewild"; "Northfolk tales of wolves the size of ponies". Sylvaran, the Pinewild and its edge, and the Northfolk realms\' forest and fell.' },
  'CRE-23': { name: 'Hell Boar', biomes: ['Temperate forest', 'Dry woodland'], realms: SUNLANDS,
    why: '"Broadleaf forest and scrub of the Sunlands\' hills"; Morhaven farmers name it. The Solen realms.' },
  'CRE-25': { name: 'Cave Bear', biomes: ['Taiga', 'Alpine highland', 'Temperate forest'], realms: ['POL-10'],
    why: '"Caves and forests of the Iron Mountains"; "believed extinct everywhere except by the dwarves". Irondeep.' },
  'CRE-26': { name: 'White Wyrm', biomes: ['Alpine highland', 'Glacier', 'Temperate forest', 'Taiga'], realms: WORLDSPINE.concat(['POL-10']), wilds: ['The High Wastes', 'The Stairwood'],
    why: '"Flooded caves under the Worldspine and Iron Mountains": the dwarf holds and the Worldspine\'s high wilds.' },
  'CRE-31': { name: 'Snow Ape', biomes: ['Alpine highland', 'Temperate forest'], realms: ['POL-27', 'POL-29'], wilds: ['The High Wastes', 'The Stairwood'],
    why: '"Forests and snowfields of the eastern Worldspine": Skyhold, Emberdeep and the high wilds between them (Stonehold holds the western passes).' },
  'CRE-33': { name: 'The Thunder Mammoth', biomes: ['Tundra', 'Temperate forest'], realms: ['POL-09'], wilds: ['The Trolness Fells'], extra: ['Skarfell', 'Helstad', 'The Mammoth Downs'],
    why: '"Frostholm"; "kept in loose herds by the giants". Frostholm\'s halls and the Mammoth Downs are drawn as forest, so they are named; the Trolness Fells are its tundra.' },
  'CRE-34': { name: 'Woolly Rhino', biomes: ['Steppe'], realms: ['POL-34'],
    why: '"The Eastern Steppe\'s northern edge"; the Tusk Clans know it lives. The Tusk Clans\' open steppe.' },
  'CRE-35': { name: 'Cave Hyena', biomes: ['Steppe', 'Dry woodland'], realms: ['POL-11', 'POL-12'],
    why: '"The Grass Sea and the Salt Steppe": the Horde of Gorath and the Nine Winds.' },
  'CRE-38': { name: 'Basilisk', biomes: ['Desert', 'Salt flat'], realms: ['POL-19', 'POL-17'],
    why: '"Rocky desert and scrub of the Red Waste and the Qadiri Coast": the Sand Clans and Qadir.' },
  'CRE-43': { name: 'Sand Dragon', biomes: ['Desert', 'Salt flat'], realms: ['POL-19'], wilds: ['The Burning Waste'],
    why: '"The Red Waste\'s rocky margins and the Burning Waste".' },
  'CRE-44': { name: 'Great Crocodile', biomes: ['Desert', 'Salt flat', 'Savanna', 'Marsh'], realms: ['POL-18'], extra: ['Tamar', 'Talim'],
    why: '"The Monuti delta, Lake Nubako and the Long Rift": Tamar. The map draws the valley as desert, so the river towns Tamar and Talim are named.' },
  'CRE-45': { name: 'River Horse', biomes: ['Desert', 'Savanna', 'Marsh', 'Tropical rainforest', 'Temperate forest'], realms: ['POL-18', 'POL-20', 'POL-22'], extra: ['Tamar', 'Talim'],
    why: '"The Monuti, the Long Rift lakes, the Golden Plains rivers": Tamar, Zanara and Abara (the Monuti\'s headwaters); Tamar and Talim named as for the crocodile.' },
  'CRE-47': { name: 'Green Anaconda', biomes: ['Tropical rainforest', 'Marsh'], realms: ['POL-21'], wilds: ['The Deep Green'], edge: true,
    why: '"Swamps of the Deep Green and the Spice Coast".' },
  'CRE-49': { name: 'Tiger of Ranpur', biomes: ['Savanna', 'Dry woodland', 'Temperate forest', 'Temperate rainforest', 'Tropical rainforest'], realms: ['POL-30'],
    wilds: ['Garbek Gate', 'The Amber Wilds', 'The Little Amber Wilds'],
    why: '"The Monsoon Coast and Worldspine foothills": Ranpur, and the foothill country between it and the range (Stonehold\'s Garbek Gate, the Amber Wilds).' },
  'CRE-51': { name: 'World Python', biomes: ['Tropical rainforest'], realms: ['POL-32', 'POL-30'], wilds: ['The Deep Green'], edge: true,
    why: '"The Deep Green, the Amber Isles, the Monsoon Coast" (Ranpur has no province drawn as forest, so in practice the first two).' },
  'CRE-53': { name: 'The Roc', biomes: ['Tropical rainforest'], wilds: ['The Isle of Pearls'],
    why: '"The interior of the Isle of Pearls". Nowhere else.' },
  'CRE-55': { name: 'Forest Men', biomes: ['Tropical rainforest'], wilds: ['The Deep Green'], edge: true,
    why: '"The Deep Green", and the rainforest at its edge where the Keshi meet them.' },
  'CRE-56': { name: 'Hael Hounds', biomes: ['Temperate forest', 'Alpine highland'], wilds: ['The Ashlands'], edge: true,
    why: '"The Ashlands", and the hills next to them where the packs hunt (they killed the Varennan surveyors in 1099).' },
  'CRE-24': { name: 'Old Man of the Trees', biomes: ['Tropical rainforest'], wilds: ['The Deep Green'], edge: true,
    why: '"Rainforest of the Deep Green", and its edge.' },
};

// Resolved once from the map as written (LORE.map), never from the live state, so conquest and the varied worlds of 43 and 70
// do not move a beast's country. Module data, not game state.
let R = null;
BH.resolve = function () {
  if (R) return R;
  const map = (LORE.map && LORE.map.provinces) || [];
  const byName = {}, realmOf = {};
  for (const p of map) { byName[p.name] = p; realmOf[p.id] = p.realm; }
  const missing = [], E = {};
  for (const id in BH.TABLE) {
    const t = BH.TABLE[id], home = new Set(), extra = new Set();
    for (const p of map) if ((t.realms || []).includes(p.realm)) home.add(p.id);
    for (const n of t.wilds || []) {
      const w = byName[n]; if (!w) { missing.push(id + ': ' + n); continue; }
      home.add(w.id);
      if (t.edge) for (const j of w.adj || []) { const q = map.find(x => x.id === j); if (q && t.biomes.includes(q.biome)) home.add(q.id); }
    }
    for (const n of t.extra || []) { const w = byName[n]; if (!w) missing.push(id + ': ' + n); else { extra.add(w.id); home.add(w.id); } }
    E[id] = { biomes: new Set(t.biomes), terrIn: t.terrIn ? new Set(t.terrIn) : null, placed: !!((t.realms && t.realms.length) || (t.wilds && t.wilds.length) || (t.extra && t.extra.length)), home, extra };
  }
  R = { E, realmOf, missing };
  return R;
};

// Does the beast suit this province? (Biome and place only; the terrain word is the release's test.)
BH.suits = function (id, P) {
  const e = BH.resolve().E[id];
  if (!e) return true;
  if (!P) return true;
  if (!e.biomes.has(P.biome)) return false;
  if (e.terrIn && !e.terrIn.has(P.terr)) return false;
  return !e.placed || e.home.has(P.id);
};
// Named provinces where it lives despite the release's terrain word.
BH.extraAt = function (id, P) { const e = BH.resolve().E[id]; return !!(e && P && e.extra.has(P.id) && e.biomes.has(P.biome)); };

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
    if (out.includes(id)) { if (BH.suits(id, P)) res.push(id); }
    else if (BH.extraAt(id, P) && LORE.creatures.find(c => c.id === id)) res.push(id);
  }
  return res;
};
