# Phone bench: /tmp/ardan/m1/before.html (Pixel 7), 2026-11-19T14:04

Wait = in-page ms from navigation (what the player waits); CPU = main-thread CPU at rate 1 (throttled CPU is inflated by the throttler).

| | 1x | 4x | 6x |
| --- | ---: | ---: | ---: |
| core ran (the core blob unpacked and run) | 616 | 2615 | 3947 |
| title shown (UI.init: the title screen drawn) | 670 | 2833 | 4323 |
| title painted (the frame that first shows it) | 672 | 2848 | 4347 |
| content ran (the event packs run (ARDAN_CONTENT_READY)) | 2219 | 8080 | 11061 |
| title world (the title's world made and its map drawn) | 2611 | 9414 | 13125 |
| lore unpacked (the lore tables unpacked in the background) | 2299 | 8263 | 11361 |
| idle (the main thread quiet (no task over 50 ms for 500 ms)) | 2615 | 9422 | 13133 |
| continent ready (as run) (the new life's continent built ahead in a worker (X7), which CDP does not slow) | 2706 | 6116 | 7434 |
| continent ready (the same, the worker's build time scaled by the rate (a phone's other cores are slow too)) | 2706 | 10112 | 13428 |
| boot CPU to idle | 2090 | 9168 | 13401 |
| longest task in the boot | 541 | 2263 | 3246 |
| new life: the creation screen | 16 | 65 | 93 |
| new life: Begin to the first Life screen | 535 | 2640 | 3834 |
| continents built on the page after Begin | 0 | 0 | 0 |
| **to the first Life screen** (the later of title world and continent ready, + create + begin) | 3310 | 12817 | 17464 |
| Next month, year 0 (median wall) | - | - | - |
| Next month, year 0 (quiet, wall) | - | - | - |
| Next month, year 50 (median wall) | - | - | - |
| Next month, year 50 (quiet, wall) | - | - | - |
| Next month, year 50: engine share | - | - | - |
| opening the year 50 save (CPU) | 1960 | 2058 | 1898 |
