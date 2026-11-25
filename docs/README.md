# Docs

Every document in `docs/`, one line each. Start with the first group; the rest is background and history.
A name that is no longer here was renamed in the naming pass: look it up in [NAMES.md](NAMES.md).
A doc marked *historical* at its top describes an earlier era and is kept for the record, not maintained.
`node tools/lint-docs-index.mjs` (run by `tools/check.mjs`) fails when a doc under `docs/` is not listed here or a link here is dead:
add a line when you add a doc. (Working files inside the subfolders of `design/` are named by the doc that uses them.)

## Read first, every session

| Doc | What it is |
| --- | --- |
| [MASTER_PROMPT.md](MASTER_PROMPT.md) | The owner's one living instruction file (order 75): every new prompt is merged into it; the source of truth |
| [prompts/2026-11-25-master-prompt.md](prompts/2026-11-25-master-prompt.md) | The master prompt as the owner gave it, unchanged (every raw prompt is kept in `prompts/`) |
| [STATUS.md](STATUS.md) | What is in progress right now: one row per piece of work with its branch, modules touched, section and verdict (Finish, Redirect, Park, Drop); updated every session |
| [ROADMAP.md](ROADMAP.md) | The plan: the master prompt's phases with what is done mapped on them, section 3 re-checked against the code, the old queue placed, the conflicts and owner questions, the carry-over checklist with a status for every row |
| [TOOLING.md](TOOLING.md) | Skills, plugins, agents and connectors: the inventory, the Keep / Merge / Remove verdicts, risks, clashes, how to switch each off and on, counts before and after (master prompt section 16) |
| [OWNER_ORDERS.md](OWNER_ORDERS.md) | Every standing order of the owner's, with the date and time it was given |
| [PROGRESS.md](PROGRESS.md) | The checklist of every work item (v2, then v3): done, in progress, next, milestones |
| [HISTORY.md](HISTORY.md) | What was done, step by step, and how to undo each step (append only) |
| [DECISIONS.md](DECISIONS.md) | Every decision with what was chosen, what was considered and why (do not undo one without a new record) |
| [V2_SPEC.md](V2_SPEC.md) | The owner's v2 design rules: each complaint and its fix |
| [V3_SPEC.md](V3_SPEC.md) | The owner's v3 design: the living world (economy, armoury, growth in depth) |
| [BRANCHES.md](BRANCHES.md) | Every branch on GitHub and what it is for, the active ones, and the merged ones the owner may delete (with each tip, to restore one) |
| [CRITIQUE.md](CRITIQUE.md) | The round 2 critique of v2.0.0-beta.1 and the order of work that follows from it |
| [VERSIONS.md](VERSIONS.md) | Every version of the game, its commit, and how to play any of them |
| [NAMES.md](NAMES.md) | Old names and new names from the naming pass, so old notes can be followed |
| [IDEAS.md](IDEAS.md) | Ideas, cut features and things for later |
| [IOS_ROADMAP.md](IOS_ROADMAP.md) | The end goal (order 62): the route to the iPhone App Store (Capacitor 8, Codemagic, TestFlight), the owner's facts re-checked, what only the owner can do, and the code audited against the build rules |

## v2 (`v2/`)

| Doc | What it is |
| --- | --- |
| [v2/STATUS.md](v2/STATUS.md) | *Historical.* Where the v2 integration stood on Nov 5 (now: PROGRESS.md) |
| [v2/LANES.md](v2/LANES.md) | *Historical.* The v2 integration lanes of Nov 1 to 6: who worked on what, in parallel |
| [v2/README.md](v2/README.md) | *Historical.* The v2 kit as the owner delivered it on Nov 1: tested drop-in modules |
| [v2/v2-kit-integration-prompt.md](v2/v2-kit-integration-prompt.md) | *Historical.* The prompt that came with the v2 kit, for starting its integration (done) |
| [v2/playtest-1.md](v2/playtest-1.md) | v2 playtest 1 (Nov 4) |
| [v2/playtest-2.md](v2/playtest-2.md) | v2 playtest 2 (Nov 5) |
| [v2/playtest-owner-alpha9.md](v2/playtest-owner-alpha9.md) | The owner's own playtest of v2.1.0-alpha.9: his survey answers, in his words (Nov 18) |
| [v2/demo.html](v2/demo.html) | The v2 kit's standalone demo page |
| [v2/maps/](v2/maps/) | Renders of the generated continent and its realms |

## Design (`design/`, `art/`, `north-star/`)

| Doc | What it is |
| --- | --- |
| [design/brief.md](design/brief.md) | The design system brief, "Woodblock & Light" |
| [design/brief-audit.md](design/brief-audit.md) | The brief checked against the built game |
| [design/characters.md](design/characters.md) | Character design: faces, bodies and dress (C8a) |
| [design/c8d-gate1.md](design/c8d-gate1.md) | C8d gate 1, for the owner: profile cards in his manhwa reference style (orders 56 to 58, D-068): what is shown, the choices, order 58 checked against the sheet, the cost, how it would go in. Sheets and their generator: `design/demo-2d/c8d/` |
| [design/war.md](design/war.md) | D12a, revised as D12a-2: war as a visual simulation (theatre, field, press); command without a Marshal, the lords' own armies, conscription, why wars start and end, reports, upheavals, the military path, the sixteen build stages (D-064) |
| [design/r1-audit.md](design/r1-audit.md) | R1 (W1-2, D-069): the decisions now made through `A.WHY` and the bare-dice decisions left, with file, line and the reasons each should use (`tools/lint-reasons.mjs` counts them) |
| [design/growth.md](design/growth.md) | G design: 17 stats, thousands of skills, hundreds of fighting styles, legendary arts |
| [design/growth-standard.md](design/growth-standard.md) | G0: the growth standard (order 54, "growth is far too linear"): today's growth measured over nine bot lives, the research, and the rules G and D11+ build on (the practice curve, quality of effort, teachers, age, plateaus and trials, disuse, the body by age, a reason for every change); scripts and `curves.svg` in `design/growth/` |
| [design/skills.md](design/skills.md) | S1a: skills with levels and experience (order 63, D-072): what is removed with the proficiencies, the 28 skills and their specialisms, 35 levels, experience, concepts, proof and breakthroughs, what moves growth with the life, checks and effects, the page, migration, and S1b's files, budgets, tests, lints and stages. Its model, data and chart are in `design/skills/` (`model.mjs`, `lives.mjs`, `chart.mjs`, `skills.json`, `lives.svg`) |
| [design/households.md](design/households.md) | C6: households and relationships: who is in a life at the start (commoner and noble), how the others enter, kin from the tree (order 7, D-057) |
| [design/names-and-cultures.md](design/names-and-cultures.md) | C7: names and cultures: one common English pool, a lean per realm, people from neighbours and trade partners (D-058) |
| [design/economy-and-items.md](design/economy-and-items.md) | E1 and E2 design: markets that run themselves, hundreds of weapons, unique items |
| [design/legendaries/legendaries.md](design/legendaries/legendaries.md) | Ten legendary arms, one from each of ten realms (orders 36 and 52): the page and its plates, how pieces, arts and forms are named, the redrawn bow; and `ordinary.png`, the game's ordinary arms before and after order 52 |
| [design/reference/](design/reference/README.md) | The owner's reference pictures for character art (D-029) |
| [design/demo-2d/c8c/README.md](design/demo-2d/c8c/README.md) | C8c: dress by station, people and occasion: the sheet generator and the blind readings that test it (D-060) |
| [design/demo-2d/gate2.md](design/demo-2d/gate2.md) | C8 2D gate 2, approved by the owner (D-035): the tone-led figure demo (`gate1.html`, `gate2.html` beside it) |
| [design/demo/](design/demo/characters.html) | The first character demo, a working draft below the bar (C8b gate 1): sheets and the live face maker |
| [design/map/](design/map/d9/sheet.png) | D9: the map's roads against borders, three trials with their prompts |
| [design/critique.md](design/critique.md) | Design critique of the game screen (Oct 26) |
| [design/pacing.md](design/pacing.md) | Pacing: a life lived a week or a month at a time |
| [design/research.md](design/research.md) | Design research behind the redesign |
| [art/style-guide.md](art/style-guide.md) | The one-page illuminated-manuscript style guide |
| [north-star/README.md](north-star/README.md) | Ardan at 100: what it looks like with unlimited time and resources |

## Research (`research/`)

| Doc | What it is |
| --- | --- |
| [research/backtests.md](research/backtests.md) | What the best-designed games do, and what Ardan should take |
| [research/player-complaints.md](research/player-complaints.md) | What players complain about in games like Ardan, and where Ardan stands |
| [research/world-foundations.md](research/world-foundations.md) | Building an Asia-sized Ardan from the ground up |
| [research/c7-name-data.md](research/c7-name-data.md) | Name data for the cultures (work item C7), with its data in `c7-name-data.json` |
| [research/ios/](research/ios/) | The iPhone audit's probes: `tap-probe.mjs` (44-point targets at 375×667, Chromium or WebKit) and `webkit-boot.mjs` (the one-file page in WebKit: CSP, blob worker, a save) |
| [research/d11-military-branches.md](research/d11-military-branches.md) | Military branches and battlefield strategy (work item D11), with its data in `d11-military-branches.json` |
| [research/ardan-codex-old.html](research/ardan-codex-old.html) | The old Ardan Codex (the Far Lands, 1105), kept as it was; read it through codex-review.md |
| [research/codex-review.md](research/codex-review.md) | Review of the old Ardan Codex (the Far Lands, 1105; kept as `research/ardan-codex-old.html`): what it holds, what is outdated, what is useful for R1, D11+, G, E1 (H-066) |
| [research/codex/reasons-and-cracks.md](research/codex/reasons-and-cracks.md) | From the Codex: how great powers hold together and crack, a catalogue of reasons for war (for R1 and W1-6) |
| [research/codex/martial-concepts.md](research/codex/martial-concepts.md) | From the Codex: named martial concepts per skill, with blind spots (for growth-standard §3.16 and D11+) |

## Benchmarks (`benchmarks/`)

| Doc | What it is |
| --- | --- |
| [benchmarks/README.md](benchmarks/README.md) | Ardan against the best-designed games, aspect by aspect: the summary table |
| [benchmarks/character-lifesim.md](benchmarks/character-lifesim.md) | Character and life sim |
| [benchmarks/relationships.md](benchmarks/relationships.md) | Relationships and people |
| [benchmarks/events-story.md](benchmarks/events-story.md) | Events and story |
| [benchmarks/power-balance.md](benchmarks/power-balance.md) | Power scaling, balance and difficulty |
| [benchmarks/war.md](benchmarks/war.md) | War |
| [benchmarks/diplomacy-economy.md](benchmarks/diplomacy-economy.md) | Diplomacy, politics and economy |
| [benchmarks/world-lore-uniqueness.md](benchmarks/world-lore-uniqueness.md) | World and lore, and uniqueness |
| [benchmarks/replayability-pacing.md](benchmarks/replayability-pacing.md) | Replayability, pacing and the core loop |

## v1 plans and reports (`plan/`)

| Doc | What it is |
| --- | --- |
| [plan/road-to-ten.md](plan/road-to-ten.md) | The Road to Ten: the v1 plan, aspect by aspect |
| [plan/road-to-ten-status.md](plan/road-to-ten-status.md) | The status of every Road to Ten step |
| [plan/compounding.md](plan/compounding.md) | How each cycle makes Ardan greater: the fix and grow halves |
| [plan/overnight-report-2026-10-23.md](plan/overnight-report-2026-10-23.md) | Overnight report, Oct 23 |
| [plan/overnight-report-2026-10-26.md](plan/overnight-report-2026-10-26.md) | Overnight report, Oct 26 |
| [plan/cycle-1-report-2026-10-28.md](plan/cycle-1-report-2026-10-28.md) | Cycle 1 report, Oct 28 |
| [plan/cycle-2-plan-2026-10-29.md](plan/cycle-2-plan-2026-10-29.md) | Cycle 2 plan, Oct 29 |
| [plan/playtest-kit.md](plan/playtest-kit.md) | The playtest kit: how agents play a build against the complaint list |
| [plan/world-expansion-architecture.md](plan/world-expansion-architecture.md) | How the world is built, and how to make it much larger |

## Reviews (`reviews/`)

| Doc | What it is |
| --- | --- |
| [reviews/deep-analysis.md](reviews/deep-analysis.md) | The deep analysis of the shipped game |
| [reviews/road-to-100.md](reviews/road-to-100.md) | The Road to 100 review |
| [reviews/cycle-1/](reviews/cycle-1/) | Cycle 1 reviewers: design, first hour, lives, visual, world |
| [reviews/cycle-2/](reviews/cycle-2/) | Cycle 2 reviewers: design, lives, visual, world |
| [reviews/round-2/README.md](reviews/round-2/README.md) | Round 2 critique: the reports behind CRITIQUE.md |
| [reviews/round-2/BRIEF.md](reviews/round-2/BRIEF.md) | The critics' shared brief |
| [reviews/round-2/FINAL-BRIEF.md](reviews/round-2/FINAL-BRIEF.md) | The brief for the deciding critics |
| [reviews/round-2/draft-art.md](reviews/round-2/draft-art.md) | Draft critique: art, characters, VFX and cartography |
| [reviews/round-2/draft-design.md](reviews/round-2/draft-design.md) | Draft critique: systems, core loop, pacing and progression |
| [reviews/round-2/draft-engineering.md](reviews/round-2/draft-engineering.md) | Draft critique: engine and performance |
| [reviews/round-2/draft-ux.md](reviews/round-2/draft-ux.md) | Draft critique: UI and UX |
| [reviews/round-2/draft-world.md](reviews/round-2/draft-world.md) | Draft critique: narrative, world and consistency |
| [reviews/round-2/final-engineering.md](reviews/round-2/final-engineering.md) | Final critique: engine and performance |
| [reviews/round-2/final-ux.md](reviews/round-2/final-ux.md) | Final critique: UI and UX |
| [reviews/round-2/posts-map.md](reviews/round-2/posts-map.md) | Who holds which post: every store, the Marshal bug, and one registry to replace them |
| [reviews/round-2/coherency-run-1.txt](reviews/round-2/coherency-run-1.txt) | The output of the first coherency run |
| [reviews/round-2/b5/numbers.md](reviews/round-2/b5/numbers.md) | B5, declutter the shell: words, controls and elements per page, before and after |

## Tools (`tools/`)

| Doc | What it is |
| --- | --- |
| [tools/delete-old-branches.sh](tools/delete-old-branches.sh) | The script that deleted the 44 old working branches (order 54, done 2026-11-16); kept for the record |
