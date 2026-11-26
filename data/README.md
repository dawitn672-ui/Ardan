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

`titles/` (titles, `src/people/9999976-titles`, D-183; on the page also as `A.DATA.titles`): `vocab.json` (rarities,
weights and budget, the hidden predicates, the deed kinds and where each is recorded, the cards whose choices are deeds),
`people.json` (the titles a person may earn), `legends.json` (the great beings' titles, named by id from `legends.json`
and `power.json`'s masters), `figures.json` (the ancient demons' and dragons' titles, named by id from `figures/`).
Validated by `tools/lint-titles.mjs`.

`figures/` (the figures registry, `src/world/9999977-figures`, order 96, D-193): one file a category. `vocab.json` (the
words: kinds, groups, fame, traits, temper axes, goal and grudge kinds); **fixed** categories hold hand-written full
profiles (`ancient-demons.json` 33, `ancient-dragons.json` 3, `elder-dragons.json` 9); **link** categories point at
another file's sheets and add only what they lack (`legends.json` groups `legends.json`'s sheets; `race-masters.json`
overlays `power.json`'s masters); **generated** categories (`rulers.json`, `great-houses.json`, `generals.json`,
`order-masters.json`) hold only the rule and the words: their people are computed from the world, never stored.
Validated by `tools/lint-figures.mjs`.
