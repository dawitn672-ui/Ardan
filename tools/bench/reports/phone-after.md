# Phone bench: ../../../../../../tmp/ardan/x7/after.html (Pixel 7), 2026-11-15T01:21

Wait = in-page ms from navigation (what the player waits); CPU = main-thread CPU at rate 1 (throttled CPU is inflated by the throttler).

| | 1x | 4x | 6x |
| --- | ---: | ---: | ---: |
| core ran (the core blob unpacked and run) | 512 | 2300 | 3142 |
| title shown (UI.init: the title screen drawn) | 554 | 2543 | 3438 |
| title painted (the frame that first shows it) | 557 | 2561 | 3456 |
| content ran (the event packs run (ARDAN_CONTENT_READY)) | 2186 | 8153 | 11320 |
| title world (the title's world made and its map drawn) | 2741 | 9551 | 13688 |
| lore unpacked (the lore tables unpacked in the background) | 2306 | 8339 | 11635 |
| idle (the main thread quiet (no task over 50 ms for 500 ms)) | 2746 | 9579 | 13712 |
| continent ready (as run) (the new life's continent built ahead in a worker (X7), which CDP does not slow) | 2723 | 5397 | 6902 |
| continent ready (the same, the worker's build time scaled by the rate (a phone's other cores are slow too)) | 2723 | 9299 | 15563 |
| boot CPU to idle | 1723 | 8404 | 12568 |
| longest task in the boot | 423 | 1881 | 2536 |
| new life: the creation screen | 18 | 60 | 161 |
| new life: Begin to the first Life screen | 395 | 1863 | 2942 |
| continents built on the page after Begin | 0 | 0 | 0 |
| **to the first Life screen** (the later of title world and continent ready, + create + begin) | 3169 | 11834 | 18420 |
| Next month, year 0 (median wall) | 297 | 1321 | 2655 |
| Next month, year 0 (quiet, wall) | 224 | 968 | 1974 |
| Next month, year 50 (median wall) | 353 | 1479 | 2154 |
| Next month, year 50 (quiet, wall) | 182 | 811 | 1440 |
| Next month, year 50: engine share | 112 | 522 | 818 |
| opening the year 50 save (CPU) | 418 | 421 | 365 |

## Where the time goes (rate 1, boot and new life, 3779 ms of samples)

| source | ms |
| --- | ---: |
| core | 1146 |
| (idle) | 893 |
| page | 753 |
| native | 479 |
| (program) | 342 |
| (garbage collector) | 114 |
| packs | 52 |
| loader | 0 |

| function (self time) | ms |
| --- | ---: |
| `(idle) (idle):0` | 893 |
| `run page:39072` | 405 |
| `(program) (program):0` | 342 |
| `F page:39046` | 172 |
| `unpack page:39055` | 122 |
| `appendChild native:0` | 116 |
| `(garbage collector) (garbage collector):0` | 114 |
| `FL.tag core:63868` | 84 |
| `RegExp: (?:\b(?:pack of wolves/wolves/wolf/she-wolf)\b)/(?:\b(?:war ?dogs?/hounds?/dogs/mad dog/curs?/mastiffs?)\b)/(?:\b(?:boars?/wild pigs?/tusker)\b)/(?:\bhyenas?\b)/(?:\b(?:(?:a/the/an old/old/she-/great/brown/black/white/young/wounded/hungry/dancing/baited/chained/mad) bears?/bears? (?:cub/cubs/growls/rears/charges/attacks/comes/stands/is)/the bear\b(?! guard/ hall)))/(?:\b(?:lions?/lioness/tigers?/leopards?/panthers?/big cats?)\b)/(?:\b(?:(?:a/the/mad/black/yak/wild/old) bulls?/bull (?:elephant/rhino)/aurochs/bison)\b)/(?:\b(?:rhinos?/rhinoceros)\b)/(?:\b(?:elephants?)\b)/(?:\b(?:crocodiles?/crocs?)\b)/(?:\b(?:snakes?/vipers?/adders?)\b)/(?:\b(?:pythons?/anacondas?/coils)\b)/(?:\b(?:apes?)\b)/(?:\b(?:wyverns?/drakes?)\b)/(?:\b(?:dragons?)\b)/(?:\b(?:wyrms?)\b)/(?:\b(?:man-?eater/great wolf)\b) native:0` | 65 |
| `A.realmHouses core:27552` | 62 |
| `NM.fixDeep core:122917` | 44 |
| `LOOK.statSparks core:89704` | 39 |
| `RegExp: thunderbird of great amber/old man of the trees/middle sea serpent/giant spider crab/wolves of the sea/steppe eagle owls/great ash dragon/thunder mammoth/great crocodile/tiger of ranpur/frost leviathan/sunwall wyvern/grey leviathan/green anaconda/white elephant/salt sea seals/evenwood wolf/old whiskers/bone-breaker/woolly rhino/deathstalker/world python/isle-turtle/crown eagle/sand dragon/river horse/hael hounds/amber wyrm/snow drake/white wyrm/deepweaver/cave hyena/white oryx/forest men/moon moths/red widow/sea drake/black maw/grey stag/hell boar/cave bear/snow ape/basilisk/aurochs/kraken native:0` | 34 |
| `candidates core:69406` | 34 |
| `RegExp: \b(hunting party/hunt is called/the hunt/ivory party/a party of/beaters/hounds? (?:have/bay)/the court/the whole village/expedition)\b native:0` | 32 |
| `FL.convertEvent core:64235` | 30 |
| `(anonymous) packs:5` | 29 |
| `A.statFloor core:125526` | 26 |
| `RegExp: (?:\b(\d{1,2})/\b(two/three/four/five/six/seven/eight/nine/ten/eleven/twelve/several/few/handful/pair/dozen/score)\b/\$\{ctx\.n\}/\{n\})(?: (?:of )?(?:[\w-]+ ){0,2})(men/of them/robbers/bandits/brigands/raiders/outlaws/thugs/toughs/soldiers/guards/riders/deserters/pirates/attackers/boys/lads/brothers/knights/veterans/spearmen/cutthroats/killers/footpads/drunks/sailors/orcs/archers/horsemen/reavers/marauders/warriors/cousins/in-laws/mockers/pursuers/wolves/hounds/dogs/hyenas/boars)\b native:0` | 26 |
| `FL.beastIn core:63832` | 21 |
| `RegExp: \b(joust/tilt/tourney/tournament/the lists/ring/wrestling/wrestle for/bout/bouts/spar/sparring/practi[cs]e/lessons?/drill/training/for a purse/for the purse/the prize/exhibition/mock fight/blunted/wooden swords?/first blood/the pit/pit fight/chalk circle/the circle/feast/gathering/the title/games?)\b native:0` | 19 |
| `RegExp: \b(knights?/elite/champions?/order (?:brothers?/knights?)/master-at-arms/paladins?/templars?/the best (?:blade/sword/fighter)/bear guard/quickened)\b native:0` | 19 |
| `A.allStyles core:16027` | 18 |
| `N.buildRealm core:118732` | 17 |
| `RegExp: \b(cut (?:him/her/them/it/you/down/your/his)/kill/kills/killed/slay/slain/dead/blood/bloody/blade/sword/knife/stab\w*/wound\w*/blow/blows/punch\w*/fist/fists/wrestl\w*/throat/bleed\w*/beaten/beat (?:him/them/you/her)/knock\w*/struck/strike/hack\w*/gut/spear/arrow/bolt/cudgel/club/bite/bit/claws?/maul\w*/gore\w*/tusks?/fangs?/jaws/teeth/horn/broken (?:nose/arm/ribs/jaw/leg)/cracked/smash\w*/throws? (?:you/him/her)/thrown/floored/the ground/lance/pike)\b native:0` | 16 |
| `get core:23` | 16 |
| `RegExp: \b((?:at/to) (?:his/her/their/\{\w+\}) (?:shoulder/side)/your men/your squad/your file/your company/your lance/your riders/your crew/the crew/your friends?/your companions?/your brothers?/your sons?/the hunters/hunters with you/with the hunters/the villagers/the village/the guards with you/beside (?:you/\{\w+\})/at your side/together/your band/your party/your mates/your shield-?mates/your comrades/your fellows/the others/your cousins/your kin/with two others/three friends/with (?:them/\{\w+\}/tarn/him)/join/the beaters/the barge master/the court/the party/in the party/herders?/shepherds)\b native:0` | 16 |
| `A.initWorld core:7586` | 15 |
| `make core:109361` | 15 |
| `T page:39046` | 14 |
| `A.newPerson core:6307` | 13 |
| `RegExp: Amber/Spice Coast/Blackreef/Sand Clan/Nine Winds/Tusk/Highland/Horde/[Kk]hanate/\b[Tt]he\s+(?:<[^<>]*>)*(?:Kesh/Sahrim/Ulun/Ughrak/Ambrel/Corvasse/Brannoch/Gorath)\b/\b[Aa]\s+(?:<[^<>]*>)*(?:Ulun/Ughrak/Ambrel)\b native:0` | 13 |
| `SAVES.encode core:44958` | 13 |
| `RegExp: \b(soldiers?/guards?/guardsm[ae]n/watchm[ae]n/the watch/men-at-arms/man-at-arms/spearm[ae]n/pikem[ae]n/deserters?/raiders?/pirates?/brigands?/outlaws?/squires?/riders?/horsem[ae]n/archers?/crossbowm[ae]n/marauders?/warriors?/orcs?/bandits?/smugglers?/slavers?/highwaym[ae]n/poachers?/marines/lances)\b native:0` | 12 |
| `A.genNoble core:7846` | 12 |
| `A.buildRoyalFamily core:7904` | 12 |
| `FL.words core:63738` | 11 |
| `(anonymous) core:118735` | 10 |
| `snap core:109297` | 10 |
| `SAVES.gzip core:44921` | 10 |
