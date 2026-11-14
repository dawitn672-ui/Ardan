# Assets

Source files for what the game draws or embeds: fonts (`fonts/`, inlined into the page by
`src/ui/77-offline-fonts/patches.mjs`), and in round 2 the portrait parts, map symbols and VFX sheets. The game is one
self-contained HTML file, so every asset here is embedded at build time (as data: URLs or generated SVG); nothing is
fetched at run time.
