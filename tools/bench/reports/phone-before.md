# Phone bench: ../../../../../../tmp/ardan/x7/base.html (Pixel 7), 2026-11-15T01:16

Wait = in-page ms from navigation (what the player waits); CPU = main-thread CPU at rate 1 (throttled CPU is inflated by the throttler).

| | 1x | 4x | 6x |
| --- | ---: | ---: | ---: |
| core ran (the core blob unpacked and run) | 582 | 2356 | 3263 |
| title shown (UI.init: the title screen drawn) | 632 | 2550 | 3543 |
| title painted (the frame that first shows it) | 635 | 2565 | 3563 |
| content ran (the event packs run (ARDAN_CONTENT_READY)) | 2518 | 9302 | 12848 |
| title world (the title's world made and its map drawn) | 4501 | 16125 | 21203 |
| lore unpacked (the lore tables unpacked in the background) | 2575 | 9475 | 13106 |
| idle (the main thread quiet (no task over 50 ms for 500 ms)) | 4506 | 16131 | 21233 |
| continent ready (as run) (the new life's continent built ahead in a worker (X7), which CDP does not slow) | - | - | - |
| continent ready (the same, the worker's build time scaled by the rate (a phone's other cores are slow too)) | - | - | - |
| boot CPU to idle | 3040 | 14600 | 19698 |
| longest task in the boot | 1957 | 7176 | 8547 |
| new life: the creation screen | 19 | 70 | 98 |
| new life: Begin to the first Life screen | 1674 | 5866 | 8625 |
| continents built on the page after Begin | 1 | 1 | 1 |
| **to the first Life screen** (the later of title world and continent ready, + create + begin) | 6048 | 21605 | 29986 |
| Next month, year 0 (median wall) | 307 | 1247 | 2139 |
| Next month, year 0 (quiet, wall) | 295 | 1188 | 1694 |
| Next month, year 50 (median wall) | 309 | 1319 | 1797 |
| Next month, year 50 (quiet, wall) | 175 | 999 | 1075 |
| Next month, year 50: engine share | 104 | 546 | 613 |
| opening the year 50 save (CPU) | 399 | 413 | 420 |

## Where the time goes (rate 1, boot and new life, 7172 ms of samples)

| source | ms |
| --- | ---: |
| core | 4229 |
| (idle) | 862 |
| page | 752 |
| native | 612 |
| (program) | 469 |
| (garbage collector) | 184 |
| packs | 64 |
| loader | 1 |

| function (self time) | ms |
| --- | ---: |
| `(idle) (idle):0` | 862 |
| `erode core:107824` | 603 |
| `(program) (program):0` | 469 |
| `run page:38914` | 396 |
| `VM.build core:114000` | 347 |
| `hg core:107840` | 263 |
| `generateContinent core:107587` | 250 |
| `noise core:107528` | 241 |
| `F page:38888` | 189 |
| `(garbage collector) (garbage collector):0` | 184 |
| `FL.beastIn core:63793` | 165 |
| `grow core:113884` | 161 |
| `appendChild native:0` | 148 |
| `unpack page:38897` | 109 |
| `(anonymous) core:114082` | 108 |
| `EC.sync core:71888` | 108 |
| `FL.tag core:63829` | 106 |
| `fbm core:107539` | 103 |
| `A.allStyles core:16027` | 78 |
| `VM.world core:114186` | 75 |
| `Heap.pop core:113865` | 75 |
| `LOOK.statSparks core:89651` | 59 |
| `A.realmHouses core:27552` | 51 |
| `(anonymous) core:114093` | 51 |
| `pop core:107995` | 41 |
| `NM.fixDeep core:122755` | 37 |
| `blur core:107792` | 34 |
| `candidates core:69367` | 34 |
| `rivers core:108028` | 32 |
| `RegExp: (?:\b(\d{1,2})/\b(two/three/four/five/six/seven/eight/nine/ten/eleven/twelve/several/few/handful/pair/dozen/score)\b/\$\{ctx\.n\}/\{n\})(?: (?:of )?(?:[\w-]+ ){0,2})(men/of them/robbers/bandits/brigands/raiders/outlaws/thugs/toughs/soldiers/guards/riders/deserters/pirates/attackers/boys/lads/brothers/knights/veterans/spearmen/cutthroats/killers/footpads/drunks/sailors/orcs/archers/horsemen/reavers/marauders/warriors/cousins/in-laws/mockers/pursuers/wolves/hounds/dogs/hyenas/boars)\b native:0` | 30 |
| `RegExp: \b(?:(?:a/the/mad/black/yak/wild/old) bulls?/bull (?:elephant/rhino)/aurochs/bison)\b native:0` | 29 |
| `components core:107892` | 29 |
| `FL.convertEvent core:64196` | 28 |
| `pushNb core:113887` | 28 |
| `makeProvinces core:108062` | 26 |
| `quantile core:107788` | 26 |
| `ridged core:107549` | 25 |
| `st core:114097` | 25 |
| `RegExp: \b(?:(?:a/the/an old/old/she-/great/brown/black/white/young/wounded/hungry/dancing/baited/chained/mad) bears?/bears? (?:cub/cubs/growls/rears/charges/attacks/comes/stands/is)/the bear\b(?! guard/ hall)) native:0` | 24 |
| `(anonymous) packs:5` | 23 |
