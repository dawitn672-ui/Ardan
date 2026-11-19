# Phone bench: /tmp/ardan/m1/m1.html (Pixel 7), 2026-11-19T14:20

Wait = in-page ms from navigation (what the player waits); CPU = main-thread CPU at rate 1 (throttled CPU is inflated by the throttler).

| | 1x | 4x | 6x |
| --- | ---: | ---: | ---: |
| core ran (the core blob unpacked and run) | 370 | 1549 | 2622 |
| title shown (UI.init: the title screen drawn) | 388 | 1628 | 2755 |
| title painted (the frame that first shows it) | 390 | 1634 | 2764 |
| content ran (the event packs run (ARDAN_CONTENT_READY)) | 1661 | 5298 | 8318 |
| title world (the title's world made and its map drawn) | 1913 | 6644 | 9967 |
| lore unpacked (the lore tables unpacked in the background) | 1713 | 5592 | 8579 |
| idle (the main thread quiet (no task over 50 ms for 500 ms)) | 1918 | 6650 | 9980 |
| continent ready (as run) (the new life's continent built ahead in a worker (X7), which CDP does not slow) | 752 | 2374 | 3797 |
| continent ready (the same, the worker's build time scaled by the rate (a phone's other cores are slow too)) | 752 | 2374 | 3797 |
| boot CPU to idle | 1426 | 6814 | 10210 |
| longest task in the boot | 250 | 1135 | 1724 |
| new life: the creation screen | 19 | 57 | 100 |
| new life: Begin to the first Life screen | 491 | 2122 | 3329 |
| continents built on the page after Begin | 0 | 0 | 0 |
| **to the first Life screen** (the later of title world and continent ready, + create + begin) | 2401 | 8834 | 13396 |
| Next month, year 0 (median wall) | - | - | - |
| Next month, year 0 (quiet, wall) | - | - | - |
| Next month, year 50 (median wall) | - | - | - |
| Next month, year 50 (quiet, wall) | - | - | - |
| Next month, year 50: engine share | - | - | - |
| opening the year 50 save (CPU) | 1850 | 1812 | 1887 |
