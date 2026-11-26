# The bestiary's bands by nature (D-191)

Orders 95 and 96 (2026-11-26), and the owner's follow-up to 95. What the owner asked:

- "ancient demons rival elder dragons and make sure there are only 3 ancient dragons under the dragon king"
- "explain the 74 types between 600-800, im worried some usually weak creatures were given high levels to fit the gap"
- "remove the dragon of high roost"
- order 96: 33 ancient demons below the three Primordial Archdemons; few elder dragons; at most 100 dragons in the world

**His worry was right.** D-185 (order 93) stretched the scale by multiplying every older kind's level by about 1.55 so the
anchors would fit, and it took the release's beasts' levels from their duel rows. That put apex *animals* among the
dragons: the Avalanche Ape at 624, the Boar-King and the Striped Shade at 649, the Ironbrow Rhino and the Tusk-Mother at
675, the Mountain Father at 688, the Queen of the Canopy at 725, the Thunder Mammoth at 611, the Stone Troll at 637, the
Troll Grandsire at 725, the Ogre Hetman at 649. Of the 74 kinds between 600 and 800, 34 left it: 32 moved down to where
their nature puts them, and the two dragons of the High Roost were removed.

**The fix: every level is written by nature,** on the owner's anchors, not stretched. The generator
(`tools/powers/gen-bestiary.mjs`) now takes each line's levels on the owner's scale (`lv`) and gives every kind a
**nature** (`tier` in `data/bestiary.json`). The band from 600 to 800 holds **45 kinds**, every one a calamity by
nature; nothing was raised to fill a gap, and the widest hole between neighbours is 25 levels.

## The rules

| Nature | Where it stands | Why |
|---|---|---|
| Plain animals (rats, wolves, cats, bears, boars, deer, snakes, crocodiles, eagles, seals) | up to 200 | an average man is 35 and a soldier 80-180: one wolf (50) is a man's fight, a bear (110-180) a soldier's death but a band's kill |
| Great beasts: the kings and monstrous apex forms of animals | 110 to 340 | a band of soldiers or knights (230-299) can face them: the Boar-King 310, the Mountain Father 340, the Queen of the Canopy 330 |
| Trolls, ogres, ettins | 120 to 380 | soldier to elite (300-420), the owner's words |
| Drakes and wyrms (wyverns, snow drakes, cave wyrms, amber wyrms) | 50 to 480 | cousins of dragons, far below them; the release's own sizes are 20 to 2,000 kilos |
| Giants by kind | fell giant 400, frost-fell 460, mountain giant 540, the first giants 640 | below the King under Jotunhall (700), the strongest of the giants |
| Titans | 600, 690, 775 | primordial giants: calamities |
| Young dragons | hatchlings 300-320, the dragonet 480 | "young dragons are lower" |
| Grown dragons | 690-710 (mean 699) | "an average grown dragon about 700" |
| Elder dragons | 745-765 (mean 755) | few: nine in the world (below) |
| Ancient dragons | three, 772-780; 782-790 with the Old Blood | "only 3 ancient dragons under the dragon king": Ash, Frost and Storm, each one of a kind |
| Lower demons | 300-480 | order 93: 300-500 |
| Great demons | 620-680 (mean 649) | order 93: about 650 |
| Ancient demons | four kinds, 745-765 (mean 754) | order 95: they rival the elder dragons (mean 755); order 96: thirty-three of them |
| Calamities | 600-775 | liches and the deathless king, the leviathans and the elder kraken, the great spirits, the colossi of legend, the hydra-mother, the million-mother, the master of the Grey Hunt, the sky-tyrant, the serpents that girdle the sea |
| Legends | 800 to 1000 | unchanged (order 92); the masters of the races stay 615-700 |

Within an evolution line the lesser forms keep their nature: the Marsh Hydra (420) and the Nine-Headed Hydra (560) are
monsters, and only the Hydra-Mother of the Fens (720), who lies under a whole fen, is a calamity; the same for the hives,
the tempest rocs, the liches and the Grey Hunt.

**The release's beasts.** D-185 read the level of the 25 release beasts (`cre`) from their duel rows. The release's duel
engine saturates near the top of human worth, so its rows read a cave bear (400-600 kg) like the best man of a world (504),
a tiger like a master swordsman (571) and a 250-kilo Great Ash Dragon below every other grown dragon (558). Their levels
are now set by nature like every other kind; what the row measures is kept as `duelT` and still checked against the live
rows (`pwBestiary`). A beast met in the wilds fights with a duel fighter built from its level (`A.POWER.fighter`), so the
odds a player reads and the fight agree; the release's own hunts of its 25 beasts (`A.fighterBeast('CRE-..')`) keep the
release's rows, unchanged in this step.

**Kept as they were.** The legends and their matchups (Sarnavoth 0.41 against the three Archdemons, Cael about even with
each, Cael 0.77 over the Lord of the Sea), the masters (615-700), the curve (`data/power.json` `levelCurve`), the lower
creatures that already sat on the anchors (rats, crows, sprites, the small slimes).

## The counts (order 96)

`data/bestiary.json` gives a kind the canon counts a `world` number (how many live) and a family a `cap`:

| Dragons | Young | Grown | Elder | Ancient |
|---|---:|---:|---:|---:|
| Ash | hatchling 8, dragonet 7 | great ash 9 | 3 | 1 |
| Frost | hatchling 7 | 9 | 2 | 1 |
| Storm | hatchling 7 | 9 | 2 | 1 |
| Brine | hatchling 7 | 9 | 1 | none |
| The Red Widow | | | 1 | |
| **All** | **36** | **36** | **9** | **3** |

84 dragons of every age and kind, under the family's cap of **100** (Sarnavoth apart, as a legend). **Elder dragons: 9**
(the owner's "few"; the brief allowed 7 to 12). The wyrms and drakes (the "Sand Dragon" is a 20-kilo lizard) are not dragons
and are not counted.

**Ancient demons: 33,** in four kinds: 20 Marquises of the Burning Court (745), 6 Pit-Mothers (750), 3 Ledger-Keepers (755)
and 4 Pit Wyrms (765). Each kind is its own line (no demon of the wilds rises to one), born of Hell (the Hell-Born title,
a ward). The 33 are individuals; their full profiles are for the figures registry to come (order 96).

**The wilds keep the counts.** `A.POWER.room` (in `src/world/9999970-powers/b-wilds.core.js`): a wild monster of a counted
kind is spawned, or rises into the next form, only while the wilds track fewer of that kind than the world holds and fewer
of its family than its cap. It only counts, so it draws nothing and changes no seed's world until a kind is full.
`pwBands` fills the wilds with every counted dragon, spawns 300 times and runs 40 years: no kind past its count, never
more than 100 dragons. The ancient dragons, the Red Widow and the legends are one of a kind and never spawn.

## Removed

The **High Roost Dragon** (738) and the **Dragon Lord of the High Roost** (785 with the Old Blood), new in D-185, are gone
at the owner's word ("remove the dragon of high roost"). They are kept in `archive/bestiary-high-roost/` (the generator's
line and the two species rows). Nothing else named them.

## Every kind from 500 to 800 now

Sorted by level. *Old* is D-185's level, *New* this one's (the ancient dragons with the Old Blood's ten). 56 kinds: 11
from 500 to 599 and the 45 calamities from 600 up.

| Kind | Family | Nature | Old | New | Why |
|---|---|---|---:|---:|---|
| Barrow Sorcerer | The restless dead | undead | 598 | 500 | liches and the deathless king are calamities; the barrow sorcerer is on his way to it |
| Mountain Heart | Spirits and elementals | spirit | 491 | 500 | the mountain heart is a strong spirit, a champion's match |
| White Lord | Spirits and elementals | spirit | 504 | 500 | the white lord is a strong spirit, a champion's match |
| Grey Huntsman | The fey | fey | 649 | 520 | the huntsman is fey; only the master of the Grey Hunt is a calamity |
| Hive Empress | Spiders and great insects | monster | 675 | 520 | the hives are monsters; only the million-mother that eats a province bare is a calamity |
| Gate Colossus | Constructs | construct | 675 | 540 | a rune guardian and the gate colossus, strong guardians, not calamities |
| Mountain Giant | Wild giants and trolls | giant | 675 | 540 | giants by kind: a fell giant modest, a mountain giant higher, the first giants below the giant king (700) |
| Bone Sovereign | The restless dead | undead | 700 | 560 | the restless dead and their lords; the bone sovereign is a champion's fight, not a calamity |
| Nine-Headed Hydra | Serpents and great lizards | monster | 700 | 560 | hydras are monsters of the fens; only the mother under a whole fen is a calamity |
| Thunder-Wing | Harpies, griffons and great birds | monster | 688 | 560 | the tempest rocs are monsters; only the sky-tyrant the storms follow is a calamity |
| Grey Leviathan | Monsters of the sea and the deep | monster | 649 | 580 | the leviathans are whales of 50 tonnes and more: the grey one a monster, the black maw and the abyss leviathan calamities |
| Heart of Fire | Spirits and elementals | calamity | 675 | 600 | spirits by kind; only the heart of fire is a great spirit, a calamity |
| Hill Titan | Wild giants and trolls | calamity | 624 | 600 | the titans are primordial giants: calamities |
| Trench Serpent | Monsters of the sea and the deep | calamity | 662 | 600 | the serpents that girdle the sea: calamities |
| Sky-Breaker | Spirits and elementals | calamity | 649 | 610 | spirits by kind; only the sky-breaker is a great spirit, a calamity |
| Caldera Spirit | Spirits and elementals | calamity | 637 | 620 | great spirits, the fire under the mountain: calamities |
| Frost Leviathan | Monsters of the sea and the deep | calamity | 688 | 620 | a leviathan of the ice, a calamity of the northern sea |
| Gate Horror | Demons | great demon | 611 | 620 | great demons, about 650 |
| War Colossus | Constructs | calamity | 688 | 620 | the colossi of legend: calamities |
| Gate Duke | Demons | great demon | 637 | 640 | great demons, about 650 |
| Giant of the First Snows | Wild giants and trolls | giant | 775 | 640 | giants by kind: a fell giant modest, a mountain giant higher, the first giants below the giant king (700) |
| Lich of the Long Night | The restless dead | calamity | 688 | 640 | liches and the deathless king are calamities; the barrow sorcerer is on his way to it |
| Pit Prince | Demons | great demon | 637 | 640 | lower demons 300-500; the pit prince is a great demon, about 650 |
| Sky-Tyrant | Harpies, griffons and great birds | calamity | 762 | 640 | the tempest rocs are monsters; only the sky-tyrant the storms follow is a calamity |
| The Black Maw | Monsters of the sea and the deep | calamity | 713 | 650 | the leviathans are whales of 50 tonnes and more: the grey one a monster, the black maw and the abyss leviathan calamities |
| Master of the Grey Hunt | The fey | calamity | 750 | 660 | the huntsman is fey; only the master of the Grey Hunt is a calamity |
| The Million-Mother | Spiders and great insects | calamity | 750 | 660 | the hives are monsters; only the million-mother that eats a province bare is a calamity |
| Gate Tyrant | Demons | great demon | 675 | 665 | great demons, about 650 |
| Duke of Cinders | Demons | great demon | 675 | 680 | great demons, about 650 |
| Brine Dragon | Dragons | grown dragon | 688 | 690 | young dragons lower, the grown about 700, the elder few |
| Elder Kraken | Monsters of the sea and the deep | calamity | 725 | 690 | the kraken of the release is 500 kilos: a monster; only the elder kraken is a calamity |
| Fleet-Breaker | Monsters of the sea and the deep | calamity | 738 | 690 | the serpents that girdle the sea: calamities |
| Storm Titan | Wild giants and trolls | calamity | 713 | 690 | the titans are primordial giants: calamities |
| Frost Dragon | Dragons | grown dragon | 700 | 695 | young dragons lower, the grown about 700, the elder few |
| Great Ash Dragon | Dragons | grown dragon | 558 | 700 | the grown ash dragon: its duel row put it at 558, below the other grown dragons; a grown dragon is about 700 |
| Mountain Wrath | Spirits and elementals | calamity | 725 | 700 | great spirits, the fire under the mountain: calamities |
| Storm Dragon | Dragons | grown dragon | 713 | 710 | young dragons lower, the grown about 700, the elder few |
| Hydra-Mother of the Fens | Serpents and great lizards | calamity | 775 | 720 | hydras are monsters of the fens; only the mother under a whole fen is a calamity |
| Elder Brine Dragon | Dragons | elder dragon | 750 | 745 | young dragons lower, the grown about 700, the elder few |
| Marquis of the Burning Court | Demons | ancient demon | new | 745 | new (order 95, 96): an ancient demon, about the elder dragons; twenty of the thirty-three |
| Elder Ash Dragon | Dragons | elder dragon | 750 | 750 | young dragons lower, the grown about 700, the elder few |
| Pit-Mother | Demons | ancient demon | new | 750 | new (order 95, 96): an ancient demon, about the elder dragons; six of the thirty-three |
| Elder Frost Dragon | Dragons | elder dragon | 750 | 755 | young dragons lower, the grown about 700, the elder few |
| Ledger-Keeper | Demons | ancient demon | new | 755 | new (order 95, 96): an ancient demon, about the elder dragons; three of the thirty-three |
| The Red Widow | Dragons | elder dragon | 750 | 760 | the largest great ash dragon on record, one of a kind: an elder |
| Abyss Leviathan | Monsters of the sea and the deep | calamity | 787 | 765 | the leviathans are whales of 50 tonnes and more: the grey one a monster, the black maw and the abyss leviathan calamities |
| Elder Storm Dragon | Dragons | elder dragon | 762 | 765 | young dragons lower, the grown about 700, the elder few |
| Heart of the Burning Deep | Spirits and elementals | calamity | 775 | 765 | great spirits, the fire under the mountain: calamities |
| Pit Wyrm | Demons | ancient demon | new | 765 | new (order 95, 96): an ancient demon, about the elder dragons; four of the thirty-three |
| Colossus of the First Forge | Constructs | calamity | 787 | 770 | the colossi of legend: calamities |
| Deathless King | The restless dead | calamity | 787 | 770 | liches and the deathless king are calamities; the barrow sorcerer is on his way to it |
| Sea-Girdler | Monsters of the sea and the deep | calamity | 787 | 770 | the serpents that girdle the sea: calamities |
| Titan of the First Mountains | Wild giants and trolls | calamity | 787 | 775 | the titans are primordial giants: calamities |
| Ancient Ash Dragon | Dragons | ancient dragon | 785 | 782 | one of the three ancient dragons under the King, one of a kind, its own line (no dragon rises to it) |
| Ancient Frost Dragon | Dragons | ancient dragon | 785 | 786 | one of the three ancient dragons under the King, one of a kind, its own line (no dragon rises to it) |
| Ancient Storm Dragon | Dragons | ancient dragon | 797 | 790 | one of the three ancient dragons under the King, one of a kind, its own line (no dragon rises to it) |

## Every kind that moved below 500

Every other kind whose level changed, by family and line. The release's beasts note what their duel row read.

| Kind | Family | Nature | Old | New | Why |
|---|---|---|---:|---:|---|
| Warren King | Vermin | animal | 122 | 60 | a rat king is a nuisance with a swarm, not a soldier's match |
| Crow Mother | Vermin | animal | 57 | 40 | a crow, however old, is a bird |
| Dusk Bat | Vermin | animal | 57 | 30 | bats are vermin; the shroud is a swarm of them |
| Night Shroud | Vermin | animal | 185 | 70 | bats are vermin; the shroud is a swarm of them |
| Grey Owl of the Barrows | Vermin | animal | 90 | 40 | an owl of the barrows is still an owl |
| Hill Wolf | Wolves and hounds | animal | 73 | 50 | a wolf is an animal: one man with a spear can face one; the long winter's elder is a monstrous apex beast, a knight's fight |
| Pack Wolf | Wolves and hounds | animal | 185 | 75 | a wolf is an animal: one man with a spear can face one; the long winter's elder is a monstrous apex beast, a knight's fight |
| The Evenwood Wolf | Wolves and hounds | animal | 350 | 110 | a wolf is an animal: one man with a spear can face one; the long winter's elder is a monstrous apex beast, a knight's fight |
| Moonhowl Wolf | Wolves and hounds | great beast | 436 | 170 | a wolf is an animal: one man with a spear can face one; the long winter's elder is a monstrous apex beast, a knight's fight |
| Frostmane Wolf | Wolves and hounds | great beast | 531 | 240 | a wolf is an animal: one man with a spear can face one; the long winter's elder is a monstrous apex beast, a knight's fight |
| Elder of the Long Winter | Wolves and hounds | great beast | 637 | 330 | a wolf is an animal: one man with a spear can face one; the long winter's elder is a monstrous apex beast, a knight's fight |
| Hael Hounds | Wolves and hounds | animal | 292 | 90 | hounds hunt in packs a few soldiers can hold; the pyre hound is their worst, a knight's fight |
| Ash Hound | Wolves and hounds | animal | 408 | 170 | hounds hunt in packs a few soldiers can hold; the pyre hound is their worst, a knight's fight |
| Pyre Hound | Wolves and hounds | great beast | 518 | 260 | hounds hunt in packs a few soldiers can hold; the pyre hound is their worst, a knight's fight |
| Cave Hyena | Wolves and hounds | animal | 350 | 90 | a hyena is a scavenger; the bone-cracker is its biggest, a band of soldiers' quarry |
| Bone-Crack Hyena | Wolves and hounds | great beast | 450 | 180 | a hyena is a scavenger; the bone-cracker is its biggest, a band of soldiers' quarry |
| Lynx | Great cats | animal | 57 | 50 | a mountain cat stays below a soldier with a spear; the ghost cat is a hunter's legend, not a knight's |
| Mountain Lion | Great cats | animal | 201 | 100 | a mountain cat stays below a soldier with a spear; the ghost cat is a hunter's legend, not a knight's |
| Ghost Cat | Great cats | great beast | 336 | 180 | a mountain cat stays below a soldier with a spear; the ghost cat is a hunter's legend, not a knight's |
| Jungle Leopard | Great cats | animal | 307 | 90 | a tiger is a soldier's death but a band of them kills it; the shade and the queen are apex beasts, knights' work |
| Tiger of Ranpur | Great cats | animal | 571 | 160 | its duel row read 571; a tiger is an animal |
| Striped Shade | Great cats | great beast | 649 | 240 | a tiger is a soldier's death but a band of them kills it; the shade and the queen are apex beasts, knights' work |
| Queen of the Canopy | Great cats | great beast | 725 | 330 | a tiger is a soldier's death but a band of them kills it; the shade and the queen are apex beasts, knights' work |
| Sand Panther | Great cats | animal | 170 | 95 | a desert cat; Sunfang is its king, a band of soldiers' fight |
| Sunfang | Great cats | great beast | 379 | 200 | a desert cat; Sunfang is its king, a band of soldiers' fight |
| Black Bear | Bears and apes | animal | 232 | 110 | a bear kills a soldier, a band kills the bear; the mountain father is the king of bears, a knight's fight |
| Cave Bear | Bears and apes | animal | 504 | 180 | its duel row read 504 (the release's duel engine reads a bear like a world's best man); a bear is an animal |
| Ironhide Bear | Bears and apes | great beast | 598 | 250 | a bear kills a soldier, a band kills the bear; the mountain father is the king of bears, a knight's fight |
| Mountain Father | Bears and apes | great beast | 688 | 340 | a bear kills a soldier, a band kills the bear; the mountain father is the king of bears, a knight's fight |
| Rock Ape | Bears and apes | animal | 216 | 80 | a great ape is an animal; the avalanche ape is its monstrous apex, knights' work, nowhere near a dragon |
| Snow Ape | Bears and apes | animal | 504 | 160 | its duel row read 504; an ape is an animal |
| Avalanche Ape | Bears and apes | great beast | 624 | 280 | a great ape is an animal; the avalanche ape is its monstrous apex, knights' work, nowhere near a dragon |
| Forest Men | Bears and apes | animal | 504 | 120 | its duel row read 504; a band of great apes |
| Old Silverback | Bears and apes | great beast | 585 | 220 | a band of great apes; the silverback leads them |
| Wild Boar | Boars and great hooved beasts | animal | 106 | 80 | a boar is a soldier's match; the boar-king is the monstrous apex of the forest, knights' work |
| Tusker | Boars and great hooved beasts | animal | 262 | 120 | a boar is a soldier's match; the boar-king is the monstrous apex of the forest, knights' work |
| Hell Boar | Boars and great hooved beasts | animal | 477 | 170 | a boar is a soldier's match; the boar-king is the monstrous apex of the forest, knights' work |
| Thornback Boar | Boars and great hooved beasts | great beast | 558 | 230 | a boar is a soldier's match; the boar-king is the monstrous apex of the forest, knights' work |
| Boar-King | Boars and great hooved beasts | great beast | 649 | 310 | a boar is a soldier's match; the boar-king is the monstrous apex of the forest, knights' work |
| Wild Ox | Boars and great hooved beasts | animal | 138 | 85 | cattle of the wild; the storm-horn bull is their king |
| Aurochs | Boars and great hooved beasts | animal | 477 | 140 | cattle of the wild; the storm-horn bull is their king |
| Stormhorn Bull | Boars and great hooved beasts | great beast | 585 | 240 | cattle of the wild; the storm-horn bull is their king |
| The Grey Stag | Boars and great hooved beasts | animal | 531 | 130 | a stag of the old woods; the antlered lord speaks, but is a beast a knight can face |
| Antlered Lord | Boars and great hooved beasts | great beast | 637 | 280 | a stag of the old woods; the antlered lord speaks, but is a beast a knight can face |
| Steppe Mammoth | Boars and great hooved beasts | animal | 408 | 160 | a mammoth is a great animal a steppe host hunts; the Thunder Mammoth is the herd's old king |
| The Thunder Mammoth | Boars and great hooved beasts | great beast | 611 | 280 | a mammoth is a great animal a steppe host hunts; the Thunder Mammoth is the herd's old king |
| Steppe Rhino | Boars and great hooved beasts | animal | 379 | 130 | a rhinoceros is armour and weight, an animal; the ironbrow is its apex, a knight's fight |
| Woolly Rhino | Boars and great hooved beasts | animal | 598 | 180 | its duel row read 598; a rhinoceros is an animal |
| Ironbrow Rhino | Boars and great hooved beasts | great beast | 675 | 280 | a rhinoceros is armour and weight, an animal; the ironbrow is its apex, a knight's fight |
| Mud Wallower | Boars and great hooved beasts | animal | 262 | 90 | a river horse is a dangerous animal, not a monster |
| River Horse | Boars and great hooved beasts | great beast | 545 | 160 | a river horse is a dangerous animal, not a monster |
| White Elephant | Boars and great hooved beasts | animal | 571 | 200 | its duel row read 571; an elephant is an animal |
| Tusk-Mother | Boars and great hooved beasts | great beast | 675 | 300 | an elephant is the greatest of animals; the tusk-mother leads the herd, a knight's fight at most |
| Spear-Horn Oryx | Boars and great hooved beasts | animal | 232 | 70 | an antelope |
| Ash Viper | Serpents and great lizards | animal | 185 | 100 | a snake kills with one bite but dies to one blow; the viper queen is its apex |
| Viper Queen | Serpents and great lizards | great beast | 321 | 180 | a snake kills with one bite but dies to one blow; the viper queen is its apex |
| Rock Python | Serpents and great lizards | animal | 185 | 80 | a great snake; the coil-mother is its monstrous apex |
| Green Anaconda | Serpents and great lizards | animal | 336 | 110 | a great snake; the coil-mother is its monstrous apex |
| World Python | Serpents and great lizards | animal | 350 | 150 | a great snake; the coil-mother is its monstrous apex |
| Coil-Mother | Serpents and great lizards | great beast | 545 | 260 | a great snake; the coil-mother is its monstrous apex |
| Basilisk | Serpents and great lizards | monster | 307 | 160 | a gaze that kills: a monster, an elite's fight at its worst |
| Stone-Eye | Serpents and great lizards | monster | 477 | 300 | a gaze that kills: a monster, an elite's fight at its worst |
| Marsh Crocodile | Serpents and great lizards | animal | 292 | 100 | a crocodile takes cattle at the fords; the mire tyrant is its apex, knights' work |
| Great Crocodile | Serpents and great lizards | animal | 598 | 170 | its duel row read 598; a crocodile is an animal |
| Mire Tyrant | Serpents and great lizards | great beast | 700 | 300 | a crocodile takes cattle at the fords; the mire tyrant is its apex, knights' work |
| Marsh Hydra | Serpents and great lizards | monster | 611 | 420 | hydras are monsters of the fens; only the mother under a whole fen is a calamity |
| Cave Wyrmling | Wyrms and drakes | drake | 138 | 60 | a blind cave wyrm is a drake, not a dragon |
| White Wyrm | Wyrms and drakes | drake | 307 | 120 | a blind cave wyrm is a drake, not a dragon |
| Pale Wyrm | Wyrms and drakes | drake | 463 | 220 | a blind cave wyrm is a drake, not a dragon |
| Deep Wyrm | Wyrms and drakes | drake | 611 | 360 | a blind cave wyrm is a drake, not a dragon |
| Ice Drakeling | Wyrms and drakes | drake | 170 | 50 | a snow drake is a 30-kilo flier: a drake, far below a dragon |
| Snow Drake | Wyrms and drakes | drake | 336 | 110 | a snow drake is a 30-kilo flier: a drake, far below a dragon |
| Rime Drake | Wyrms and drakes | drake | 491 | 240 | a snow drake is a 30-kilo flier: a drake, far below a dragon |
| Sunwall Wyvern | Wyrms and drakes | drake | 408 | 150 | a wyvern is a venomous flier a few knights can bring down |
| Crag Wyvern | Wyrms and drakes | drake | 518 | 230 | a wyvern is a venomous flier a few knights can bring down |
| Storm Wyvern | Wyrms and drakes | drake | 624 | 340 | a wyvern is a venomous flier a few knights can bring down |
| Amber Crawler | Wyrms and drakes | drake | 379 | 160 | the amber wyrms are drakes; the elder speaks and is a champion's fight, not a calamity |
| Amber Wyrm | Wyrms and drakes | drake | 624 | 300 | the amber wyrms are drakes; the elder speaks and is a champion's fight, not a calamity |
| Amber Elder | Wyrms and drakes | drake | 738 | 480 | the amber wyrms are drakes; the elder speaks and is a champion's fight, not a calamity |
| Sea Drake | Wyrms and drakes | drake | 436 | 170 | a sea drake is a drake of the coast |
| Tide Drake | Wyrms and drakes | drake | 571 | 290 | a sea drake is a drake of the coast |
| Sand Dragon | Wyrms and drakes | drake | 232 | 60 | the "sand dragon" is a 20-kilo lizard (the release's own size): a drake, not a dragon |
| Dune Drake | Wyrms and drakes | drake | 379 | 150 | the "sand dragon" is a 20-kilo lizard (the release's own size): a drake, not a dragon |
| Ash Hatchling | Dragons | young dragon | 350 | 300 | young dragons lower, the grown about 700, the elder few |
| Ash Dragonet | Dragons | young dragon | 463 | 480 | young dragons lower, the grown about 700, the elder few |
| Frost Hatchling | Dragons | young dragon | 379 | 310 | young dragons lower, the grown about 700, the elder few |
| Storm Hatchling | Dragons | young dragon | 408 | 320 | young dragons lower, the grown about 700, the elder few |
| Brine Hatchling | Dragons | young dragon | 365 | 300 | young dragons lower, the grown about 700, the elder few |
| Bog Troll | Wild giants and trolls | monster | 350 | 130 | trolls sit at soldier to elite levels; the grandsire is the oldest, an elite's fight |
| Hill Troll | Wild giants and trolls | monster | 450 | 180 | trolls sit at soldier to elite levels; the grandsire is the oldest, an elite's fight |
| Cave Troll | Wild giants and trolls | monster | 545 | 240 | trolls sit at soldier to elite levels; the grandsire is the oldest, an elite's fight |
| Stone Troll | Wild giants and trolls | monster | 637 | 300 | trolls sit at soldier to elite levels; the grandsire is the oldest, an elite's fight |
| Troll Grandsire | Wild giants and trolls | monster | 725 | 380 | trolls sit at soldier to elite levels; the grandsire is the oldest, an elite's fight |
| Fell Giant | Wild giants and trolls | giant | 463 | 400 | giants by kind: a fell giant modest, a mountain giant higher, the first giants below the giant king (700) |
| Frost-Fell Giant | Wild giants and trolls | giant | 571 | 460 | giants by kind: a fell giant modest, a mountain giant higher, the first giants below the giant king (700) |
| Ettin | Wild giants and trolls | monster | 518 | 260 | an ettin is a two-headed brute, a knight's to an elite's fight |
| Ettin Chieftain | Wild giants and trolls | monster | 611 | 360 | an ettin is a two-headed brute, a knight's to an elite's fight |
| Ogre | Ogres | monster | 379 | 120 | ogres sit at soldier to elite levels; the hetman leads a war-band |
| Ogre Brute | Ogres | monster | 477 | 180 | ogres sit at soldier to elite levels; the hetman leads a war-band |
| Ogre Glutton | Ogres | monster | 571 | 250 | ogres sit at soldier to elite levels; the hetman leads a war-band |
| Ogre Hetman | Ogres | monster | 649 | 330 | ogres sit at soldier to elite levels; the hetman leads a war-band |
| Marsh Ogre | Ogres | monster | 408 | 140 | a marsh ogre with herb-craft, an elite's fight at most |
| Ogre Hedge-Witch | Ogres | monster | 598 | 300 | a marsh ogre with herb-craft, an elite's fight at most |
| Harpy | Harpies, griffons and great birds | monster | 201 | 60 | harpies are a flock of shrieking monsters, soldiers' work |
| Shrieking Harpy | Harpies, griffons and great birds | monster | 307 | 110 | harpies are a flock of shrieking monsters, soldiers' work |
| Harpy Matriarch | Harpies, griffons and great birds | monster | 436 | 200 | harpies are a flock of shrieking monsters, soldiers' work |
| Griffon | Harpies, griffons and great birds | monster | 463 | 200 | a griffon is a monstrous beast; the high aeries' is its king, an elite's fight |
| Royal Griffon | Harpies, griffons and great birds | monster | 571 | 280 | a griffon is a monstrous beast; the high aeries' is its king, an elite's fight |
| Griffon of the High Aeries | Harpies, griffons and great birds | monster | 675 | 360 | a griffon is a monstrous beast; the high aeries' is its king, an elite's fight |
| Sky Eagle | Harpies, griffons and great birds | animal | 201 | 50 | an eagle |
| Thunderbird of Great Amber | Harpies, griffons and great birds | animal | 262 | 90 | the thunderbird is a 65-kilo terror bird and the roc a 3-metre one (the release's sizes); the storm roc is their monstrous kin |
| The Roc | Harpies, griffons and great birds | great beast | 491 | 260 | the thunderbird is a 65-kilo terror bird and the roc a 3-metre one (the release's sizes); the storm roc is their monstrous kin |
| Storm Roc | Harpies, griffons and great birds | monster | 624 | 380 | the thunderbird is a 65-kilo terror bird and the roc a 3-metre one (the release's sizes); the storm roc is their monstrous kin |
| Tempest Roc | Harpies, griffons and great birds | monster | 598 | 480 | the tempest rocs are monsters; only the sky-tyrant the storms follow is a calamity |
| Tunnel Spider | Spiders and great insects | animal | 73 | 50 | a giant spider is an animal; the hollow queen is its monstrous apex |
| Giant Spider | Spiders and great insects | animal | 232 | 130 | a giant spider is an animal; the hollow queen is its monstrous apex |
| Web Matron | Spiders and great insects | great beast | 379 | 220 | a giant spider is an animal; the hollow queen is its monstrous apex |
| Hollow Queen | Spiders and great insects | great beast | 545 | 320 | a giant spider is an animal; the hollow queen is its monstrous apex |
| Dune Scorpion | Spiders and great insects | animal | 170 | 90 | a scorpion; the sand emperor is its apex |
| Sand Emperor | Spiders and great insects | great beast | 408 | 220 | a scorpion; the sand emperor is its apex |
| Plated Beetle | Spiders and great insects | animal | 106 | 60 | a beetle, however plated |
| Siege Beetle | Spiders and great insects | great beast | 350 | 180 | a beetle, however plated |
| Devouring Swarm | Spiders and great insects | animal | 262 | 120 | a locust swarm ruins harvests; the grey hunger is the worst of them |
| The Grey Hunger | Spiders and great insects | great beast | 491 | 300 | a locust swarm ruins harvests; the grey hunger is the worst of them |
| Moon-Moth Queen | Spiders and great insects | great beast | 216 | 120 | moths; the queen leads a cloud of them |
| Thousand-Leg | Spiders and great insects | great beast | 201 | 110 | a crawler of the rocks |
| Hive Queen | Spiders and great insects | monster | 585 | 380 | the hives are monsters; only the million-mother that eats a province bare is a calamity |
| Restless Dead | The restless dead | undead | 73 | 60 | the restless dead and their lords; the bone sovereign is a champion's fight, not a calamity |
| Barrow Wight | The restless dead | undead | 292 | 200 | the restless dead and their lords; the bone sovereign is a champion's fight, not a calamity |
| Grave Lord | The restless dead | undead | 518 | 380 | the restless dead and their lords; the bone sovereign is a champion's fight, not a calamity |
| Ghoul | The restless dead | undead | 138 | 80 | ghouls follow plague and battle, soldiers' work |
| Charnel Ghoul | The restless dead | undead | 277 | 150 | ghouls follow plague and battle, soldiers' work |
| Ghoul Elder | The restless dead | undead | 408 | 250 | ghouls follow plague and battle, soldiers' work |
| Revenant | The restless dead | undead | 336 | 220 | a revenant walks for one wrong, a knight's fight |
| Wrath Revenant | The restless dead | undead | 477 | 340 | a revenant walks for one wrong, a knight's fight |
| Shade | The restless dead | undead | 185 | 120 | a wraith is an elite's fight at its worst |
| Wraith | The restless dead | undead | 379 | 250 | a wraith is an elite's fight at its worst |
| Night Wraith | The restless dead | undead | 545 | 400 | a wraith is an elite's fight at its worst |
| Flame Spirit | Spirits and elementals | spirit | 232 | 160 | spirits by kind; only the heart of fire is a great spirit, a calamity |
| Blaze Lord | Spirits and elementals | spirit | 477 | 360 | spirits by kind; only the heart of fire is a great spirit, a calamity |
| River Spirit | Spirits and elementals | spirit | 216 | 150 | a flood lord drowns a valley but is not a calamity of the continent |
| Flood Lord | Spirits and elementals | spirit | 463 | 480 | a flood lord drowns a valley but is not a calamity of the continent |
| Gale Spirit | Spirits and elementals | spirit | 201 | 140 | spirits by kind; only the sky-breaker is a great spirit, a calamity |
| Storm Lord | Spirits and elementals | spirit | 450 | 360 | spirits by kind; only the sky-breaker is a great spirit, a calamity |
| Stone Spirit | Spirits and elementals | spirit | 247 | 170 | the mountain heart is a strong spirit, a champion's match |
| Winter Spirit | Spirits and elementals | spirit | 262 | 180 | the white lord is a strong spirit, a champion's match |
| Leaf Spirit | Spirits and elementals | spirit | 138 | 100 | a leaf spirit of the groves |
| Imp | Demons | lower demon | 307 | 300 | lower demons 300-500; the pit prince is a great demon, about 650 |
| Fiend | Demons | lower demon | 365 | 360 | lower demons 300-500; the pit prince is a great demon, about 650 |
| Greater Fiend | Demons | lower demon | 436 | 450 | lower demons 300-500; the pit prince is a great demon, about 650 |
| Cinder Hound | Demons | lower demon | 321 | 310 | lower demons 300-500 |
| Brimstone Hound | Demons | lower demon | 408 | 400 | lower demons 300-500 |
| Whisperer | Demons | lower demon | 336 | 330 | lower demons 300-500 |
| Soul Broker | Demons | lower demon | 477 | 480 | lower demons 300-500 |
| Reef Crusher | Monsters of the sea and the deep | animal | 232 | 80 | a crab |
| Wolves of the Sea | Monsters of the sea and the deep | animal | 463 | 160 | a pack of whales that hunt, animals; the deep hunter is their apex |
| Deep Hunter | Monsters of the sea and the deep | great beast | 598 | 260 | a pack of whales that hunt, animals; the deep hunter is their apex |
| Middle Sea Serpent | Monsters of the sea and the deep | monster | 379 | 180 | a sea serpent of 200 kilos (the release's size) is a monster, not a calamity |
| Deep Serpent | Monsters of the sea and the deep | monster | 571 | 340 | a sea serpent of 200 kilos (the release's size) is a monster, not a calamity |
| Giant Squid | Monsters of the sea and the deep | animal | 262 | 150 | the kraken of the release is 500 kilos: a monster; only the elder kraken is a calamity |
| Kraken | Monsters of the sea and the deep | monster | 545 | 350 | its duel row read 545; the release's kraken is a 500-kilo squid: a monster |
| Isle-Turtle | Monsters of the sea and the deep | great beast | 571 | 220 | the isle-turtle is a 3-tonne turtle (the release's size); the island-back is a monster, not a calamity |
| Island-Back | Monsters of the sea and the deep | monster | 700 | 480 | the isle-turtle is a 3-tonne turtle (the release's size); the island-back is a monster, not a calamity |
| Old Whiskers | Monsters of the sea and the deep | great beast | 262 | 120 | a great catfish |
| Glamour Fox | The fey | fey | 106 | 80 | a fox of the fey, a trickster |
| Thousand-Wile Fox | The fey | fey | 350 | 200 | a fox of the fey, a trickster |
| Barrow Fey | The fey | fey | 262 | 150 | the fey of the hills; a countess holds a court of them |
| Fey Countess | The fey | fey | 518 | 360 | the fey of the hills; a countess holds a court of them |
| Kelpie | The fey | fey | 321 | 180 | a kelpie drowns riders, a knight's fight |
| Drowning Steed | The fey | fey | 491 | 300 | a kelpie drowns riders, a knight's fight |
| Bark Walker | The fey | fey | 262 | 140 | the old man of the trees and his father, strong but no calamity |
| Old Man of the Trees | The fey | fey | 518 | 260 | the old man of the trees and his father, strong but no calamity |
| Grove Father | The fey | fey | 675 | 450 | the old man of the trees and his father, strong but no calamity |
| Changeling | The fey | fey | 138 | 80 | a changeling and the lord of a hollow hill |
| Hollow Hill Lord | The fey | fey | 477 | 380 | a changeling and the lord of a hollow hill |
| Gulping Ooze | Slimes and oozes | monster | 170 | 100 | slimes and oozes; the thinking ooze is a champion's fight (Ommul, the legend, is the ooze of the world) |
| Lake-Eater | Slimes and oozes | monster | 321 | 200 | slimes and oozes; the thinking ooze is a champion's fight (Ommul, the legend, is the ooze of the world) |
| Grey Tide | Slimes and oozes | monster | 463 | 320 | slimes and oozes; the thinking ooze is a champion's fight (Ommul, the legend, is the ooze of the world) |
| Thinking Ooze | Slimes and oozes | monster | 598 | 450 | slimes and oozes; the thinking ooze is a champion's fight (Ommul, the legend, is the ooze of the world) |
| Stone-Eater Ooze | Slimes and oozes | monster | 138 | 90 | an ooze of the caves |
| Deep Ooze | Slimes and oozes | monster | 307 | 180 | an ooze of the caves |
| Magma Ooze | Slimes and oozes | monster | 185 | 120 | an ooze of the fire-rock |
| Molten Heart | Slimes and oozes | monster | 422 | 260 | an ooze of the fire-rock |
| Glacier Ooze | Slimes and oozes | monster | 154 | 100 | an ooze of the ice |
| Plague Ooze | Slimes and oozes | monster | 201 | 120 | a poison that moves |
| Rot Tide | Slimes and oozes | monster | 408 | 260 | a poison that moves |
| Hoard Mimic | Slimes and oozes | monster | 232 | 130 | a mimic |
| Clay Servant | Constructs | construct | 106 | 80 | a made guardian; the iron colossus is an elite's to a champion's fight |
| Stone Warden | Constructs | construct | 321 | 220 | a made guardian; the iron colossus is an elite's to a champion's fight |
| Iron Colossus | Constructs | construct | 571 | 400 | a made guardian; the iron colossus is an elite's to a champion's fight |
| Bone Golem | Constructs | construct | 307 | 200 | a bone golem, a knight's fight |
| Brass Hound | Constructs | construct | 185 | 120 | a brass guardian |
| Brass Sentinel | Constructs | construct | 408 | 260 | a brass guardian |
| Rune Guardian | Constructs | construct | 491 | 380 | a rune guardian and the gate colossus, strong guardians, not calamities |

## How to change a level

Edit the line's `lv` (and `tier`, `world`) in `tools/powers/gen-bestiary.mjs`, run `node tools/powers/gen-bestiary.mjs`,
then the powers tests (`pwLadder`, `pwStretched`, `pwBands`, `pwBestiary`). `gen-bestiary --check` fails a hand edit of
`data/bestiary.json`.
