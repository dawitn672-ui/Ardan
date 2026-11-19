# Phone bench: /tmp/ardan/m1/m1.html (Pixel 7), 2026-11-19T14:18

Wait = in-page ms from navigation (what the player waits); CPU = main-thread CPU at rate 1 (throttled CPU is inflated by the throttler).

| | 1x | 4x | 6x |
| --- | ---: | ---: | ---: |
| core ran (the core blob unpacked and run) | 523 | 2568 | 3949 |
| title shown (UI.init: the title screen drawn) | 580 | 2798 | 4302 |
| title painted (the frame that first shows it) | 583 | 2810 | 4708 |
| content ran (the event packs run (ARDAN_CONTENT_READY)) | 2055 | 7504 | 10772 |
| title world (the title's world made and its map drawn) | 2385 | 8692 | 12494 |
| lore unpacked (the lore tables unpacked in the background) | 2122 | 7705 | 11097 |
| idle (the main thread quiet (no task over 50 ms for 500 ms)) | 2391 | 8699 | 12502 |
| continent ready (as run) (the new life's continent built ahead in a worker (X7), which CDP does not slow) | 2530 | 5578 | 7452 |
| continent ready (the same, the worker's build time scaled by the rate (a phone's other cores are slow too)) | 2530 | 9142 | 13373 |
| boot CPU to idle | 1904 | 8798 | 12709 |
| longest task in the boot | 449 | 2113 | 3343 |
| new life: the creation screen | 19 | 62 | 81 |
| new life: Begin to the first Life screen | 475 | 2323 | 3448 |
| continents built on the page after Begin | 0 | 0 | 0 |
| **to the first Life screen** (the later of title world and continent ready, + create + begin) | 3035 | 11828 | 16884 |
| Next month, year 0 (median wall) | - | - | - |
| Next month, year 0 (quiet, wall) | - | - | - |
| Next month, year 50 (median wall) | - | - | - |
| Next month, year 50 (quiet, wall) | - | - | - |
| Next month, year 50: engine share | - | - | - |
| opening the year 50 save (CPU) | 1883 | 2039 | 1821 |
