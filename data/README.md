# Content kept as data

JSON files here are put on the page by `tools/build.mjs` as `A.DATA['<path without .json>']` (for example
`data/cultures/names.json` becomes `A.DATA['cultures/names']`), before any feature code runs, so engine and feature
code read content from data instead of carrying it inline. Planned homes (round 2): `cultures/` (real-world cultures
and their names), `military/` (branches, ranks, gear, missions), `items/`.

Events stay as code next to their system (`src/events/NN-*/*.events.js`, and each system's own packs): an event holds
functions (`cond`, `setup`, sometimes `text` and `fx`), so it cannot be plain JSON. See `docs/DECISIONS.md` (D-002).
