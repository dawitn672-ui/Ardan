# Content kept as data

JSON files here are put on the page by `tools/build.mjs` as `A.DATA['<path without .json>']` (for example
`data/cultures/names.json` becomes `A.DATA['cultures/names']`), before any feature code runs, so engine and feature
code read content from data instead of carrying it inline. Planned homes (round 2): `cultures/` (real-world cultures
and their names), `military/` (branches, ranks, gear, missions), `items/`.

Events stay as code next to their system (`src/events/NN-*/*.events.js`, and each system's own packs): an event holds
functions (`cond`, `setup`, sometimes `text` and `fx`), so it cannot be plain JSON. See `docs/DECISIONS.md` (D-002).

`skills/` (the skills rebuild, `docs/design/skills-v2.md`): `vocab.json` (ranks D to SSS and G, costs, caps, the words a
skill is written in), `families.json` (the 28 families, from S1's `skills.json`), `ladders/*.json` (the rungs, a file a
group; seeded by `tools/skills2/seed-data.mjs`), `recipes.json` (merges). Validated by `tools/lint-skills.mjs`.

`level.json` (a person's level and its stat points, `src/people/9999975-level`, D-181): the experience curve on the
power ladder, the foes with no sheet, the floor of growing up, points, ceilings, room and costs, and the ways of life a
placement leans to.
