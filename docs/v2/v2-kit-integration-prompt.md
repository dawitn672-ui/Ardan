Paste this into your Claude Code session that has the Ardan repo open, after unzipping `ardan-v2-kit.zip` into the repo root (it creates `ardan-v2/`).

---

I've added `ardan-v2/`, a set of tested drop-in modules that fix my list of complaints about Ardan. Read `ardan-v2/docs/V2_SPEC.md` first: it maps each complaint to a module and a test, and ends with a 10-step integration plan. Also read the three skills in `ardan-v2/.claude/skills/` and copy them into this repo's `.claude/skills/` so you use them from now on.

Then do the integration plan in order, one step per commit, on a new branch `v2-integration`:

1. Run `cd ardan-v2 && npm i && npm test` and confirm all 24 tests pass. Then move the modules into our build (`src/v2/`) and add the tests to our release test runner, so a failing test blocks a release.
2. Map: replace our map with `generateContinent`/`renderMap`, and delete the Great Continent / Far Lands layer from play completely. Keep our realm identities, but let the generated continent set the borders. It must be one connected continent.
3. Time: remove the Play button, speed controls and "sim a week". Use `nextMonth()` with cards shown one at a time, quiet months as a toast, and Next day/Next week only during a campaign.
4. Stats: migrate the old 0–100 stats to the body model (real units, growth by age, races, breakthroughs). Remove piety as a universal stat. Route every event check through `attempt()` and every fight through `fightingWorth`.
5. Family: use `createPlayerFamily`, delete the birth-position picker, compute all relation text with `relationLabel`, and keep one holder per title.
6. Nobility: build courts from `buildHierarchy` (at most 3 dukes and 6 marquises per realm, with realistic counts below).
7. Diplomacy: replace the treaty dice with `monthTick`. Show the reasons as "Drawing together / Pulling apart".
8. War: remove spectating. Wars I'm not in produce only rumours. When I'm in one, I play my rank (soldier, sergeant, captain, commander). Keep our division simulator for the commander layer.
9. Saves: add the new fields to our versioned IndexedDB save, with a migration.
10. After each step, follow the `game-ux-playtest-loop` skill: a scripted Playwright pass, then a playtester subagent checking against the complaint list in V2_SPEC.md, then fix what it finds and add a regression test.

Rules: don't bring back any popup that hides a description behind a click, and don't add percentages to the player-facing UI. Keep every system deterministic from the seed. If a step conflicts with how our code works, tell me the conflict and your proposed fix before doing it.
