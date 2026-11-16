// Two of the release's own tables, for the far peoples (990-far-peoples). The release's childhood and village scenes
// name the children's game of a people ("The children are playing {game}: {how}") and the lord a commoner answers to
// ("the bailiff of {lord}", "steal from {lord}'s stores") from tables of the Known World's cultures, with "Captains"
// and "the lord" for anyone else. Patches FARP-GAME and FARP-LORD ask these first; a Known World culture has no entry.
//   t(culture, lord, game, how): how is what the game is, in a few words, as the scene's sentence goes on.
(function () {
  const G = A.FARP_GAME = A.FARP_GAME || {}, L = A.FARP_LORD = A.FARP_LORD || {};
  const t = (c, lord, game, how) => { L[c] = lord; G[c] = [game, how]; };

  // the Twin Rivers
  t('CUL-25', 'the magistrate', 'Dyke and Flood', 'counters raced up a board of dykes, where the flood square sends you back to the plain');
  t('CUL-26', 'the dyke-head', 'Ring Dykes', 'pebbles moved round rings scratched in the mud, each trying to drown the other\'s district');
  t('CUL-27', 'the silk magistrate', 'Reels', 'a race of wound threads on a board of lofts, five moults to the cocoon');
  t('CUL-28', 'the well-lord', 'Derricks', 'bamboo sticks dropped in a heap and lifted one by one without the heap moving');
  t('CUL-29', 'the clan head', 'Weir-Kings', 'a board of tombs where each player\'s king hides and the other must find him');
  t('CUL-30', 'the banner captain', 'Eight Banners', 'a war game of horsemen in eight colours on a cloth board');
  t('CUL-31', 'the valley lord', 'Throw-Sticks', 'four split sticks thrown for moves round a board of fields');
  t('CUL-32', 'the tower-lord', 'Beacons', 'lines of pebbles lit one after another, the first to reach the far tower winning');
  t('CUL-33', 'the lake lord', 'Name-Chains', 'a chanting game where each child adds a syllable and the one who forgets is out');
  t('CUL-34', 'the clan elder', 'Tiger and Goats', 'one tiger stone hunting a herd of goat stones on a ridge drawn in the dirt');
  t('CUL-35', 'the eldest of the fleet', 'Boats', 'shells pushed across a board of channels between two boats that must not touch');
  t('CUL-36', 'the junk-master', 'Ports', 'a race of little junks between ports scratched on a deck plank');
  t('CUL-37', 'the island chief', 'Reef', 'shells hidden under coconut halves, the reef taking whichever is guessed wrong');
  t('CUL-38', 'the gate captain', 'Wall and Raiders', 'a line of defenders and a ring of raiders on a board cut into a gate step');
  t('CUL-39', 'the eldest mother', 'Tea Bricks', 'pressed squares stacked and stolen until the tower falls');
  t('CUL-40', 'the old-fire head', 'Old Fire', 'embers carried in clay cups along a path, the one whose ember dies losing');
  t('CUL-41', 'the lock-master', 'Locks', 'a race of grain counters through a ladder of gates that open on a throw');
  t('CUL-42', 'the elephant lord', 'Elephant and Mahout', 'a big stone and a small one moved together through a forest of sticks');
  // the Long Grass
  t('CUL-43', 'the noyan', 'bones', 'sheep\'s ankle bones flicked across a felt, each face a horse, a camel, a sheep or a goat');
  t('CUL-44', 'the rope-khan', 'Twelve Ropes', 'strings laid in a fixed order and pulled one by one without disturbing the rest');
  t('CUL-45', 'the clan-mother', 'the Walk', 'sixty pebbles walked west across a hide, and the ones that stay counted');
  t('CUL-46', 'the red-mother', 'Both-Hands', 'a guessing game of which hand holds the red stone and which the white');
  t('CUL-47', 'the ferry-captain', 'Salt Camels', 'salt lumps carried across a board of dry lake and water');
  t('CUL-48', 'the boyar', 'Bear and Hunters', 'one bear piece against six hunters on a board of birch squares');
  t('CUL-49', 'the reed-chief', 'Ice Walk', 'stones slid across a board of ice cracks, the one that falls through out');
  t('CUL-50', 'the well-chief', 'Wells', 'pits and stones in the gravel, sowed round and round');
  t('CUL-51', 'the Keeper', 'Hidden Grave', 'one stone buried in the sand and a thousand hoofprints made to hide it');
  t('CUL-52', 'the dawn-chief', 'Sun Door', 'a race to turn a ring of little tent-doors east before the sun piece rises');
  t('CUL-53', 'the innkeeper', 'Reckoning', 'a counting game of horses through a gate, one in a hundred to the town');
  // the Sand Basins
  t('CUL-54', 'the great broker', 'Masks', 'a bargaining game played through go-betweens, sealed by breaking a clay chip');
  t('CUL-55', 'the canal lord', 'Water Shares', 'water poured down a board of channels, each trying to fill their own field');
  t('CUL-56', 'the abbot of the town', 'Two Lamps', 'a race of lamp-pieces along the road, fed with oil at the monasteries');
  t('CUL-57', 'the jade master', 'Moon Stones', 'pale pebbles found by feel in a bowl of sand, eyes shut');
  t('CUL-58', 'the channel-lord', 'Channels', 'a path dug under a heap of sand, the one whose tunnel falls in losing');
  t('CUL-59', 'the scale-master', 'Scales', 'a balance of two cups and a heap of beans, honest weight wins');
  t('CUL-60', 'the broker', 'Nine Wells', 'a hidden-path game where the board\'s far end is never shown');
  t('CUL-61', 'the Purse captain', 'Purses', 'a horse race on a board where every rider must be bought first');
  t('CUL-62', 'the dune-elder', 'Dunes', 'pits in the sand that walk one place each turn');
  t('CUL-68', 'the valley lord', 'Bridges', 'a knot-tying race across two sticks, the last knot crossing first');
  // the High Steppes
  t('CUL-63', 'the fort lord', 'Sheep and Leopard', 'a herd of sheep pieces against one leopard on a board of passes');
  t('CUL-64', 'the lake-chief', 'Salt Sheep', 'a thousand sheep drawn as dots and led down a board of lakes');
  t('CUL-65', 'the tower-lord', 'Towers', 'stone stacks built and knocked down by thrown pebbles, tower against tower');
  t('CUL-66', 'the herd-lord', 'Cairns', 'stones added to a cairn by turns until it falls');
  t('CUL-67', 'the gatebeard', 'Runes', 'a carving race on a slate, the deepest rune winning');
  t('CUL-69', 'the loadmaster', 'Loads', 'baskets of stones carried up a stair of steps cut in a log');
  t('CUL-70', 'the herd lord', 'Yak Bulls', 'two clay bulls pushed head to head on a slab');
  // the Black Pines
  t('CUL-71', 'the prince\'s fur-reeve', 'Forty Skins', 'counting sticks bundled in forties and stolen from each other\'s bundles');
  t('CUL-72', 'the boat-elder', 'Whale on the Shore', 'a stranded whale drawn in the sand and carved up by turns');
  t('CUL-73', 'the feast host', 'the Old Man', 'a game of not saying a word, played in a ring, the one who says it out');
  t('CUL-74', 'the Ice-Speaker', 'Ice Crack', 'a silent game where no one may speak until a stick is snapped');
  t('CUL-75', 'the antler-elder', 'Antlers', 'thrown antler pieces landing on a hide, each tine a reindeer');
  t('CUL-76', 'the woods chief', 'Grandfather', 'one tiger piece and a ring of hunters on a board of trees');
  t('CUL-77', 'the post-chief', 'Salmon Run', 'fish pieces leaping up a ladder of rapids');
  t('CUL-78', 'the khan\'s rider', 'White Mare', 'a horse race round a ring, where nobody may land on the white square');
  t('CUL-79', 'the mine-reeve', 'Seams', 'stones dug from a heap of earth by turns, the one who brings the heap down losing');
  t('CUL-80', 'the line-elder', 'Traplines', 'a race to set snares along a line drawn in the snow');
  // the Rime Coast
  t('CUL-81', 'the drum-elder', 'Seal Holes', 'a stone hidden under one of many holes in the snow, guessed by turns');
  t('CUL-82', 'the eldest of the hall', 'the Mothers', 'a long chanting game where each player must name every Mother before');
  t('CUL-83', 'the count-elder', 'Thirty-One', 'thirty-one pebbles taken one, two or three at a time, the last one losing');
  // the Southern Peninsulas
  t('CUL-88', 'the temple-house lord', 'Wheel and Ledger', 'a race round a wheel of houses, where debts send you down and gifts up');
  t('CUL-89', 'the district head', 'Channels', 'boats of leaves floated down a gutter, the channel moving between turns');
  t('CUL-90', 'the stall-master', 'Stalls', 'a horse race on a board of stalls where every horse is bought first');
  t('CUL-91', 'the temple-field holder', 'the Last Sheaf', 'straw stalks drawn from a bundle, the last one left to the Rice Mother');
  t('CUL-92', 'the stone-lord', 'Stones', 'pebbles planted upright in rows and knocked flat with thrown seeds');
  t('CUL-93', 'the valley lord', 'Temples', 'a race to build the most shrines of stacked bricks');
  t('CUL-94', 'the stair-lord', 'the Mountain', 'pieces climbed up nine steps of a temple drawn in the dust');
  t('CUL-95', 'the town chief', 'the Ring', 'a boxing game of slapped hands, three falls to a bout');
  t('CUL-96', 'the mandarin', 'Exams', 'riddles and answers in turn, the one who fails sweeping the floor');
  t('CUL-97', 'the sea lord', 'Coconut and Areca', 'two sides of nut pieces taking the throne by turns');
  t('CUL-98', 'the mine-chief', 'Tin Pans', 'grit swirled in a bowl until a bright speck shows');
  t('CUL-99', 'the clan elder', 'Twelve Years', 'a village of pieces moved along a ridge every twelfth throw');
  t('CUL-100', 'the well-chief', 'Salt Tubes', 'bamboo tubes rolled down a slope to the plains\' line');
  t('CUL-101', 'the master catcher', 'Silent Forest', 'a hiding game where speaking aloud gets you caught');
  t('CUL-102', 'the whistle-chief', 'Whistles', 'a whistled message passed down a line of children and checked at the end');
  t('CUL-103', 'the harbour lord', 'Two Masters', 'tributes paid to two kings by turns until one side is broke');
  t('CUL-104', 'the dive-master', 'Deep Breath', 'heads under the water and a count, the longest winning');
  // the Thousand Isles
  t('CUL-105', 'the sea lord', 'Passes', 'palm-leaf passes traded for ships, and the ship without one taken');
  t('CUL-106', 'the mother lord', 'Buffaloes', 'two beetles set to push each other off a leaf');
  t('CUL-107', 'the water priest', 'Water Days', 'a calendar board where each player\'s field gets water on its day');
  t('CUL-108', 'the horse-lord', 'Sae Duwa Tigo', 'counting rhymes in birth order, the fifth starting again');
  t('CUL-109', 'the longhouse head', 'Omens', 'a race along the gallery where a bird call sends you home');
  t('CUL-110', 'the river-mouth lord', 'Silent Market', 'goods laid down and taken without a word spoken');
  t('CUL-111', 'the sea chief', 'Gongs', 'a game of how far a beaten pot can be heard');
  t('CUL-112', 'the terrace eldest', 'Terraces', 'walls of mud built up a slope and washed down by a poured cup');
  t('CUL-113', 'the reef captain', 'Prizes', 'a raiding game of shell boats taking each other\'s cargo');
  t('CUL-114', 'the spice planter', 'Cloves', 'seeds hidden in two closed fists, one for each isle');
  t('CUL-115', 'the yard-lord', 'Keels', 'little boats carved and floated, the one that rolls losing');
  t('CUL-116', 'the big man', 'Pigs', 'a giving game where the one who gives most stones away wins');
  t('CUL-117', 'the plume-lord', 'Birds', 'feathers blown across a mat, the farthest winning');
  t('CUL-118', 'the eldest steersman', 'Diving', 'a pebble dropped over the side and fetched from the bottom');
  t('CUL-119', 'the navigator', 'Thirty-Two Stars', 'a chant of stars where each child must name the next rising');
  // the Deep Southland
  t('CUL-120', 'the cattle-lord', 'Herds', 'pebble cattle in pits, sowed round a board and captured by the herd');
  t('CUL-121', 'the drum-lord', 'Drums', 'a rhythm passed round a ring of children, the one who breaks it out');
  t('CUL-122', 'the gate-chief', 'One in Ten', 'fish pieces through a gate where every tenth is taken');
  t('CUL-123', 'the canoe-lord', 'Lamps on the Lake', 'pebbles and candle-stubs set out in rows by night');
  t('CUL-124', 'the highland lord', 'Gebeta', 'stones sowed in two rows of pits on a plank, the old highland way');
  t('CUL-125', 'the harbour elder', 'Monsoon', 'boats held at a line until the call, then raced across the sand');
  t('CUL-126', 'the pit-lord', 'Furnace', 'a quiet game where the first to quarrel spoils the copper and loses');
  t('CUL-127', 'the senior of the age-set', 'Spears', 'sticks thrown through a rolling hoop of bark');
  t('CUL-128', 'the band elder', 'Forest Song', 'a singing game where each child adds a voice and none may stop');
  t('CUL-129', 'the palace chief', 'Plaques', 'scratched pictures of deeds traded and hung on a wall of bark');
  t('CUL-130', 'the stretch-chief', 'River Stretch', 'a tug of war across a stream for the best fishing stone');
  t('CUL-131', 'the drum-chief', 'Salt Slabs', 'clay slabs traded at standard sizes, the cheat losing all');
  t('CUL-132', 'the namesake', 'Eland', 'a dance game where the eland is called down by clapping');
  t('CUL-133', 'the canoe lady', 'the East Canoe', 'a long-name game where each child adds a phrase to their name');
  t('CUL-134', 'the canoe-house master', 'Beaches', 'a race of canoes along a river, paying a toll of beads at each village');
  // the Sunrise Isles
  t('CUL-84', 'the household steward', 'Crests', 'a war of painted shells, each with its lord\'s crest');
  t('CUL-85', 'the shrine elder', 'Fire-Names', 'a naming game round a small fire, each child given a name by the flame\'s colour');
  t('CUL-86', 'the village chief', 'Bear-Owl', 'a hiding game where the owl player may never be tagged');
  t('CUL-87', 'the sea-house head', 'Gifts of the South Wind', 'cargo pieces moved past the inspectors\' line unseen');
})();
