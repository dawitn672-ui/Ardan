# Phone bench: ../../../../../../tmp/ardan/x7/after.html (Pixel 7), 2026-11-15T01:24

Wait = in-page ms from navigation (what the player waits); CPU = main-thread CPU at rate 1 (throttled CPU is inflated by the throttler).

| | 1x | 4x | 6x |
| --- | ---: | ---: | ---: |
| core ran (the core blob unpacked and run) | 471 | 2303 | 3194 |
| title shown (UI.init: the title screen drawn) | 514 | 2501 | 3504 |
| title painted (the frame that first shows it) | 517 | 2515 | 3552 |
| content ran (the event packs run (ARDAN_CONTENT_READY)) | 1848 | 6104 | 8627 |
| title world (the title's world made and its map drawn) | 2172 | 7289 | 10148 |
| lore unpacked (the lore tables unpacked in the background) | 1903 | 6262 | 8869 |
| idle (the main thread quiet (no task over 50 ms for 500 ms)) | 2178 | 7296 | 10165 |
| continent ready (as run) (the new life's continent built ahead in a worker (X7), which CDP does not slow) | - | - | - |
| continent ready (the same, the worker's build time scaled by the rate (a phone's other cores are slow too)) | - | - | - |
| boot CPU to idle | 1637 | 7358 | 10299 |
| longest task in the boot | 383 | 1883 | 2604 |
| new life: the creation screen | 17 | 81 | 96 |
| new life: Begin to the first Life screen | 1393 | 5701 | 8004 |
| continents built on the page after Begin | 1 | 1 | 1 |
| **to the first Life screen** (the later of title world and continent ready, + create + begin) | 3697 | 13159 | 17993 |
| Next month, year 0 (median wall) | 744 | 2944 | 3726 |
| Next month, year 0 (quiet, wall) | 223 | 696 | 1218 |
| Next month, year 50 (median wall) | 279 | 1145 | 1434 |
| Next month, year 50 (quiet, wall) | 279 | 1145 | 1434 |
| Next month, year 50: engine share | 173 | 781 | 826 |
| opening the year 50 save (CPU) | 379 | 428 | 365 |
