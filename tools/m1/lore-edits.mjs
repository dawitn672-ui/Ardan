// M1 lore pass (order 71; D-151, D-153, D-155): every change of the world's words that brings them into line with the one
// map (map version 4, docs/design/m1/map-design.md section 7). Each edit is the old words, the new words, the file, and
// why. tools/m1/lore-apply.mjs applies them (each once; an edit already applied is skipped) and writes
// docs/design/m1/lore-changes.md from this list. `all: true` changes every place the old words stand in that file; without
// it they must stand exactly once.
const LORE = 'src/core/release/core/00-lore.json', CAST = 'src/core/release/lore/01-cast.json', FAM = 'src/core/release/lore/02-families.json',
  HD = 'src/core/release/lore/03-houseDeep.json', ST = 'src/core/release/lore/04-styles.json', AC = 'src/core/release/lore/05-academies.json';
const CM = 'src/core/release/content/18-cm.js', WW = 'src/core/release/content/12-ww.js', SS = 'src/core/release/content/13-ss.js', AV = 'src/core/release/content/16-av.js';
const REGB = 'src/events/40-memory-regional-b/regional-b.events.js';

export const EDITS = [
  // ---- A. Waters (section 7, A) ----------------------------------------------------------------------------------------
  { file: LORE, old: 'The Red Waste, the Burning Waste, the Gulf of Sands', new: 'The Red Waste and the Burning Waste; the shores of the Gulf of Sands',
    why: 'A7: Sahrim is not on the Gulf of Sands, Sabra is' },
  { file: LORE, old: 'Merchants of the Middle Sea believe a great fire-dragon guards the Corsair Isles', new: 'Merchants of the western coasts believe a great fire-dragon guards the Corsair Isles',
    why: 'A1, A2: the Middle Sea is inland; the Corsair Isles are on the Western Ocean, and Lucerna pays its fifth in bills' },
  { file: LORE, old: 'grain by sea;', new: 'grain up the Gullet;', why: 'A6: Tessaria reaches the Eastern Gulf by the Gullet, not by sea' },
  { file: LORE, old: 'tin from Frostholm by way of Northreach;ship oak from Greyhaven;', new: 'tin from Frostholm by way of Northreach;masts from Eldergrove;',
    why: 'Ties: no sea way joins Aldmark and Greyhaven; Aldmark\'s ship oak is its own (the Oak Line shires), its masts Eldergrove\'s' },
  { file: LORE, old: 'linen rags from Tamar;wheat from Tamar;ship timber from the Holy Coast;', new: 'linen rags from Tamar by the Well Road;wheat from Tamar by the Well Road;ship timber from the Crown Coast and Ashmere;',
    why: 'Ties: Qadir and Tamar are not neighbours and share no sea; Qadir\'s ship timber comes from the Crown Coast and Ashmere' },
  { file: LORE, old: 'A scarred Grey Leviathan bull rams and sinks the Lucernan cog Golden Gull, 180 tonnes, west of the Strait of Hael.', new: 'A scarred Grey Leviathan bull rams and sinks the Golden Gull west of the Strait of Hael: a cog out of Varenna, 180 tonnes, insured at Lucerna.',
    why: 'Ties: Lucerna\'s ships cannot reach the Strait of Hael; the cog is Varenna\'s, the policy Lucerna\'s' },
  { file: FAM, old: 'In May 1088 the leviathan Old Ironjaw sank the cog Golden Gull west of the Strait of Hael, and the Sicurani had written her.', new: 'In May 1088 the leviathan Old Ironjaw sank the Golden Gull, a cog out of Varenna that the Sicurani had written, west of the Strait of Hael.',
    why: 'Ties: as above' },
  { file: LORE, old: 'Admiral Castellan asks Lucerna for 20 galleys against Corvasse', new: 'Admiral Castellan asks Lucerna for the gold for 20 galleys against Corvasse', all: true,
    why: 'Ties: no sea joins Lucerna and Corvasse; Lucerna pays for galleys laid down at Varenna' },
  { file: FAM, old: 'Leandro wants a share in the 20 galleys Castellan asks of Lucerna.', new: 'Leandro wants a share in the 20 galleys Castellan asks Lucerna to pay for.', why: 'Ties: as above' },
  { file: FAM, old: 'He will sail with Castellan to Lucerna on 1 April to ask for 20 galleys.', new: 'He will ride with Castellan to Lucerna on 1 April to ask for the gold for 20 galleys.', why: 'Ties: as above; Varenna reaches Lucerna by the Coast Road' },
  { file: FAM, old: 'would carry the Varenna contingent across the Middle Sea.', new: 'would carry the contingents that come down the Coast Road across the Middle Sea.',
    why: 'B10: Varenna faces the Western Ocean; its men reach the Middle Sea by the Coast Road' },
  { file: FAM, old: 'Ulbike is offered a place on a Greyhaven ship bound for the Middle Sea.', new: 'Ulbike is offered a place on a Greyhaven barge bound down the Grey Channel.',
    why: 'A3, B15: Greyhaven\'s ships are the channel\'s; no water joins the channel and the Middle Sea' },
  { file: HD, old: '300,000 suns to Greyhaven for its galley fleet, and the shipowners of the Middle Sea.', new: '300,000 suns to Greyhaven for its channel galleys; and the shipowners of the Middle Sea.',
    why: 'A3: Greyhaven\'s galleys are river galleys; the Middle Sea\'s shipowners are Lucerna\'s neighbours, not Greyhaven\'s' },
  { file: FAM, old: 'Carried Prince Tancred\'s unsigned warning across the Grey Channel in November 1104.', new: 'Carried Prince Tancred\'s unsigned warning over the Horse Gate in November 1104.',
    why: 'A3: Morhaven is on the Middle Sea, not the Grey Channel; the Horse Gate is its way east' },
  { file: FAM, old: 'The family has captained the kings\' galleys since and fought the Tamari and Corvasse on the Middle Sea.', new: 'The family has captained the kings\' galleys since, on the Grey Water and down the Gullet.',
    why: 'B16, A1: Tessar stands on the Grey Water; its galleys have no way to the Middle Sea, and Corvasse\'s none to it' },
  { file: FAM, old: 'Tessar imports its bread by sea and the queen\'s galleys guard the cogs. Captain Lucan Salvane has run grain from Morhaven and Ostra all winter.',
    new: 'Tessar brings its bread up the Gullet and the queen\'s galleys guard the barges. Captain Lucan Salvane has run grain from Ranpur and Kesh all winter.',
    why: 'A6: Tessaria\'s grain comes up the Gullet from the Eastern Gulf; Morhaven and Ostra are on the inland Middle Sea' },
  { file: FAM, old: 'Tibata Strait', new: 'Tibata Bay', all: true, why: '5: the lore\'s Tibata Strait is the mouth of Tibata Bay, Varenna\'s harbour nearest the Strait of Hael' },
  { file: LORE, old: 'Tibata Strait Tower', new: 'Tibata Bay Tower', all: true, why: 'As above' },
  { file: ST, old: 'Mag Brine burned three Lucernan ships in the Strait and gave the Middle Sea its dragon', new: 'Mag Brine burned three Varennan ships in the Strait and gave the western sea its dragon',
    why: 'A1, A2: the Strait of Hael is on the ocean; Lucerna\'s ships cannot reach it' },
  { file: AC, old: 'the price of a prize in every coin of the Middle Sea.', new: 'the price of a prize in every coin of the western coasts.', why: 'A2: Corvasse is on the Western Ocean' },
  { file: CM, old: 'route = p=>{const r=ROUTE[p.realm]||["the Middle Sea lanes","wine, oil and cloth","Lucerna"]', new: 'route = p=>{const r=ROUTE[p.realm]||["the Coast Road","wine, oil and cloth","Lucerna"]',
    why: 'A1: a realm off the Middle Sea does not trade by its lanes; the default route is the Coast Road (18-cm\'s table)' },
  { file: LORE, old: 'nosebleeds in the highlands,', new: 'nosebleeds on high ground,', why: 'Zanara\'s blood: the strain is the body\'s, wherever the carrier stands; Zanara has little high ground' },
  { file: LORE, old: 'sick on the Lake Calia ferry', new: 'sick on the Skardush ferry', why: 'The map has no Lake Calia; the road down from Brannoch to the Sunland fairs crosses the Skardush' },
  { file: LORE, old: 'They cannot serve abroad by sea or cross lakes.', new: 'They cannot serve abroad by sea or cross open water.', why: 'A9: Brannoch\'s tarns are under the map\'s grain; the trait is the body\'s' },
  { file: ST, old: 'a Stonefoot cannot cross a lake or a swaying bridge', new: 'a Stonefoot cannot cross open water or a swaying bridge', why: 'As above' },
  { file: LORE, old: 'Nimrael was born about 200 BR at Mirlas, among the night fishers of Lake Silara.', new: 'Nimrael was born about 200 BR at Mirlas in the Evenwood, among the night fishers of Lake Silara.',
    why: 'Lake Silara is Sylvaran\'s (the Evenwood); the bloodline is Eldergrove\'s, its first bearer born across the border' },
  { file: CAST, old: 'and fir masts for the Cold Bay fleet without paying hard coin.', new: 'and fir masts for Aldmark\'s Cold Bay fleet without paying hard coin.', why: 'A5: Cold Bay and its fleet are Aldmark\'s, not Irondeep\'s' },
  { file: FAM, old: 'She wants the chain replaced with iron from Irondeep, and her father calls it the first step to a human harbor.', new: 'Her father calls it the first step to a human harbor; she wants the chain replaced with iron from Irondeep.',
    why: 'The harbour is Eldergrove\'s, the iron Irondeep\'s (inland)' },
  { file: CAST, old: 'Wants the Lake Council to release', new: 'Wants Drevna\'s Lake Council to release', why: 'B12: the Lake Council is Drevna\'s, on the Western Lakes; Ughrak has no lake' },

  // ---- B. Where realms lie (section 7, B) -------------------------------------------------------------------------------
  { file: LORE, old: 'The orc clans of the southern grass, held together by the Line of Gorath:', new: 'The orc clans of the Grass Sea, held together by the Line of Gorath:', why: 'B18: Gorath lies in the north-centre, south of Aldmark: no longer "southern"' },
  { file: LORE, old: 'The Grass Sea (Horde of Gorath) and the Eastern Steppe (Ughrak);', new: 'The Grass Sea (Horde of Gorath); Ughrak\'s eastern steppe;', why: 'B14: the orc homelands; the eastern steppe is Ughrak\'s, on the north-east coast' },
  { file: LORE, old: 'The giant kingdom of the frozen eastern coast:', new: 'The giant kingdom of the frozen north-east coast:', why: 'B13: Hrimfell is the north-eastern coast' },
  { file: LORE, old: 'The sultanate of passes and galleys on the desert coast:', new: 'The sultanate of passes and galleys on the dry coast under the Sunwall:', why: 'B19: Qadir\'s coast is dry; the desert proper is beyond the range' },

  // ---- Ambrel: the island's interior is hill forest, not highland (section 4.32: the Amber Wilds, "the island's hill interior")
  ...[LORE, CAST, FAM, HD, ST, WW, REGB].flatMap(file => [
    ['Highland March', 'Hill March'], ['Highland Spears', 'Hill Spears'], ['Highland Spear', 'Hill Spear'], ['Warden of the Highlands', 'Warden of the Hills'],
    ['Ruhu Highlands', 'Ruhu Hills'], ['highlands above Ruhu', 'hills above Ruhu'], ['highland forests', 'hill forests'], ['highland cow', 'hill cow'],
    ['highland hunters', 'hill hunters'], ['highland sergeants', 'hill sergeants'], ['Ambrel highlands', 'Ambrel hills'], ['highlands of Great Amber', 'hills of Great Amber'],
    ['Ambrel (highland march)', 'Ambrel (hill march)'],
  ].map(([o, n]) => ({ file, old: o, new: n, all: true, optional: true, why: '4.32: Great Amber\'s interior (the Amber Wilds) is hill forest; the map has no highlands there' }))),

  // ---- C. The release's tables of routes, ports and wilds (18-cm), read against the map --------------------------------
  { file: CM, old: '"POL-01": "Kingsmere",', new: '"POL-01": "Easterham",', why: 'Aldmark\'s port is on Cold Bay (Easterham), not Kingsmere, which stands inland' },
  { file: CM, old: 'FAR = ["Amberport","Kesh","Tamar","Wolfhaven","Qadira","Sabra","Lucerna","Ostra","Greyhaven","Felano"],\n      farPort = p=>A.pick(FAR.filter(x=>x!==port(p))),',
    new: 'FAR = ["Amberport","Kesh","Tamar","Wolfhaven","Qadira","Sabra","Lucerna","Ostra","Greyhaven","Felano"],\n      INLAND = ["Tamar","Lucerna","Ostra","Felano","Solenne"],\n      farPort = p=>{const h=port(p),m=INLAND.includes(h),l=FAR.filter(x=>x!==h&&INLAND.includes(x)===m);return A.pick(l.length?l:FAR.filter(x=>x!==h))},',
    why: 'A1: the Middle Sea\'s ports (Tamar, Lucerna, Ostra, Felano, Solenne) have no way to the ocean; a far port is one the ship can reach' },
  { file: CM, old: 'marches: ["the Free Marches","forest plateau in twenty-three pieces that nine realms claim and none hold"],',
    new: 'marches: ["the Free Marches","forested lowland between the Gullet, the Roof and the Ember Mountains that four realms deny to each other"],', why: '4.35: the Free Marches as designed' },
  { file: CM, old: '"good oak country that giants, orcs and Eastfolk all forbid each other to plough",', new: '"the forest cape east of Whale Sound, beyond the Truce of Dobin, where whalers and trappers come and nobody rules",',
    why: '4.35: the Whale Woods as designed' },
  { file: CM, old: '"cold high steppe and the Worldspine passes, where the air itself sickens lowlanders",', new: '"bare coast mountains north-east of the Roof, too poor to feed a garrison",', why: '4.35: the High Wastes as designed' },
  { file: CM, old: 'amber: ["the Amber Wilds","cloud forest held by the Cloudfolk against every sultan"],', new: 'amber: ["the Amber Wilds","the hill forest of Great Amber, where the sultan\'s writ stops at the gardens"],',
    why: '4.35: the Amber Wilds as designed' },
  { file: CM, old: 'bone: ["the Bone Coast","a fog-bound shore of wrecks and fishing camps with no water at all"],', new: 'bone: ["the Bone Coast","a desert headland west of the Gulf of Sands, with no water at all"],', why: '4.35: the Bone Coast as designed' },
  { file: CM, old: 'burning: ["the Burning Waste","salt pans, lava fields and wells that turn salty in a season"],', new: 'burning: ["the Burning Waste","bare ranges between the Long Rift and the Worldspine with no wells"],', why: '4.35: the Burning Waste as designed' },
  { file: CM, old: 'green: ["the Deep Green","rainforest that kills outsiders with fever"],', new: 'green: ["the Deep Green","the rainforest cape that kills outsiders with fever"],', why: '4.35: the Deep Green as designed' },
  { file: CM, old: 'western: ["the Western Highlands","wet fells under Mount Brand, where the clans pay tax to nobody"],', new: 'western: ["the Western Hills","the coast heights between the Elder Coast and Ashmere, where the clans pay tax to nobody"],',
    why: '4.35: the Western Highlands are coast heights (hills on the map)' },
  { file: CM, old: 'ash: ["the Ashlands","good ash soil that every faith in the west calls cursed"],', new: 'ash: ["the Ashlands","the peninsula under Mount Hael, good ash soil that every faith in the west calls cursed"],', why: '4.35: the Ashlands as designed' },
  { file: CM, old: 'pinewild: ["the Pinewild","endless taiga and bog where trappers winter and nobody rules"],', new: 'pinewild: ["the Pinewild","pine fells between Cold Bay and the Frostfells where trappers winter and nobody rules"],', why: '4.35: the Pinewild as designed' },
  { file: CM, old: 'thorn: ["the Thornveld","thorn scrub on the army road south of the Neck"],', new: 'thorn: ["the Thornveld","thorn scrub at the dry head of the south-east peninsula"],', why: '4.35: the Thornveld as designed' },
  { file: CM, old: 'thorn: ["the Thornveld","thorn scrub at the dry head of the south-east peninsula"],',
    new: 'thorn: ["the Thornveld","thorn scrub at the dry head of the south-east peninsula"],\n        mammoth: ["the Mammoth Downs","poor downs between Northreach, the Crossmarch and the Pinewild, too poor to tax and a road for iron smugglers"],\n        lunora: ["the Lunora Woods","wooded hills north of the Santora, raided through the Horse Gate too often to farm"],\n        firststone: ["the Firststone Hills","the ash plain at the west end of the Glenmere, where four realms keep each other off"],\n        bleakfold: ["the Bleakfold","bare heights behind the coast hills, where a watch tower would starve"],\n        mirun: ["the Mirun Pines","pine hills where three realms meet and none will let another fortify"],\n        dobava: ["the Dobava Wilds","bandit heights above the Neck road"],\n        stairwood: ["the Stairwood","a forest stair too steep to farm, left empty on purpose"],',
    why: '4.35: the wilds the realms touch on the map, which the table did not have' },
  // the wild each realm sees over its border: one it touches on the map (build.json's neighbours), else the nearest
  ...[['POL-14', 'marches', 'frostfells'], ['POL-28', 'wastes', 'burning'], ['POL-29', 'wastes', 'marches'], ['POL-30', 'wastes', 'marches'], ['POL-25', 'frostfells', 'stairwood'],
    ['POL-19', 'bone', 'burning'], ['POL-20', 'burning', 'mirun'], ['POL-21', 'green', 'thorn'], ['POL-05', 'western', 'ash'], ['POL-06', 'western', 'bleakfold'],
    ['POL-01', 'pinewild', 'mammoth'], ['POL-10', 'pinewild', 'mammoth'], ['POL-11', 'pinewild', 'mammoth'], ['POL-12', 'pinewild', 'lunora'], ['POL-15', 'marches', 'lunora'],
    ['POL-16', 'burning', 'lunora'], ['POL-24', 'bone', 'mirun']]
    .map(([r, o, n]) => ({ file: CM, old: `"${r}": "${o}",`, new: `"${r}": "${n}",`, why: `4.35: ${r}'s wild on the map` })),
  { file: CM, old: '"POL-13": "pinewild",\n      },\n      wild = p=>', new: '"POL-13": "firststone",\n        "POL-02": "firststone",\n        "POL-04": "lunora",\n        "POL-33": "ash",\n      },\n      wild = p=>',
    why: '4.35: the nearest wild on the map for Brannoch, Solenne, Lucerna and Corvasse (Solenne and Lucerna had none, so the Free Marches at the far side of the land)' },
];
