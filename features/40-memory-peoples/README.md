# Memory threads: peoples

**Aspect:** Events and story · **Kind:** content

Callback events for flags the release sets but never reads ("orphan memories", listed in /tmp at build time from `bench/bot.mjs` → `memoryIndex().orphan`). Each event reads a flag with `C.flag(p, "...")`, waits years after it was set (`A.S.year - p.flags.x >= N`), recalls the original moment concretely, and poses a new decision with a lasting mark; several set a new flag that a second callback in this file reads later (2-step arcs).

Events: `peoples.events.js`. Tests: `test.mjs` checks every chunk flag is read and the events play. Lint: `node tools/lint-events.mjs --feature=memory-peoples`.

Written by an agent writer; the hostile-editor pass was cut short by a usage limit, so this chunk was edited by spot check only (see docs/reviews/Ardan Road to 100.md, "Round 2").
