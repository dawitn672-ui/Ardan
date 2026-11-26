# Ardan docs: the index

Only what reference needs is kept here (order 76, 2026-11-25). Older plans, reviews, lane files, benchmarks and renders
left the tree on that day; git history holds them (the last commit with them is named in `HISTORY.md`, H-110).
`node tools/lint-docs-index.mjs` keeps this list whole.

## The source of truth and the records
| Doc | What |
|---|---|
| [MASTER_PROMPT.md](MASTER_PROMPT.md) | The owner's one living instruction file. The newest instruction wins |
| [prompts/2026-11-25-master-prompt.md](prompts/2026-11-25-master-prompt.md) | The master prompt as the owner gave it, unchanged (every raw prompt is kept in `prompts/`) |
| [prompts/2026-11-25-answers-and-direction.md](prompts/2026-11-25-answers-and-direction.md) | The owner's answers to the Phase 0 questions (order 76), unchanged |
| [prompts/](prompts/) | Every later prompt of the owner's, unchanged, one file each (the power scale, levels and beings, titles, pathways, ...) |
| [OWNER_ORDERS.md](OWNER_ORDERS.md) | Every order of the owner's, dated |
| [STATUS.md](STATUS.md) | Where every piece of work stands now |
| [ROADMAP.md](ROADMAP.md) | The phases and what is in each (the working copy of the master prompt's section 13) |
| [PROGRESS.md](PROGRESS.md) | The older checklist of work items, kept for its records |
| [DECISIONS.md](DECISIONS.md) | Every decision: what, what else was considered, why |
| [HISTORY.md](HISTORY.md) | What was done, step by step, and how to undo it (append only) |
| [VERSIONS.md](VERSIONS.md) | Every version, its commit and its sample save |
| [BALANCE_BASELINE.md](BALANCE_BASELINE.md) | What the bot lives read (age, coin, renown, crowns, best skill levels), so a change that eases or hardens a life shows; no targets |
| [BRANCHES.md](BRANCHES.md) | The branches on GitHub and why each is there |
| [TOOLING.md](TOOLING.md) | Skills, plugins and connectors: what is on, what is off, and why |
| [IDEAS.md](IDEAS.md) | Ideas parked for later, each with why |
| [NAMES.md](NAMES.md) | Old name to new name (the naming pass) |
| [IOS_ROADMAP.md](IOS_ROADMAP.md) | The route to the iPhone App Store |
| [V2_SPEC.md](V2_SPEC.md) | The owner's v2 complaint list and design rules |
| [V3_SPEC.md](V3_SPEC.md) | The v3 designs (economy, armoury, growth in depth), parked |

## Design notes of systems in play
| Doc | What |
|---|---|
| [design/brief.md](design/brief.md) | The look: design tokens and the brief |
| [art/style-guide.md](art/style-guide.md) | The art style guide |
| [design/characters.md](design/characters.md) | Character design |
| [design/reference/README.md](design/reference/README.md) | The owner's reference pictures |
| [design/skills.md](design/skills.md) | The S1 skills design (superseded by skills-v2.md; kept as the reference for experience by doing) |
| [design/skills-v2.md](design/skills-v2.md) | The skills rebuild: ranked skills D to S with levels 1 to 10, evolution, merging, the adapter, migration, the first 200; titles; a person's level, stat points and training |
| [design/growth.md](design/growth.md) | Growth by age and training |
| [design/growth-standard.md](design/growth-standard.md) | The growth standard everyone is held to |
| [design/households.md](design/households.md) | Households and kin |
| [design/names-and-cultures.md](design/names-and-cultures.md) | Names and cultures |
| [design/economy-and-items.md](design/economy-and-items.md) | Economy and items |
| [design/pacing.md](design/pacing.md) | Pacing of a month and a year |
| [design/r1-audit.md](design/r1-audit.md) | The reasons audit (A.WHY) |
| [design/war.md](design/war.md) | War design |
| [design/legendaries/legendaries.md](design/legendaries/legendaries.md) | Legendary figures (a source for the magic phase) |
| [design/emilio-1108-findings.md](design/emilio-1108-findings.md) | What the owner's Emilio life (1105 to 1108) shows: ten findings for Phase 1 |
| [design/playtest-owner-alpha9.md](design/playtest-owner-alpha9.md) | The owner's own playtest of alpha 9: his survey answers, in his words |
| [research/codex/martial-concepts.md](research/codex/martial-concepts.md) | Martial concepts (skills research) |
| [research/codex/reasons-and-cracks.md](research/codex/reasons-and-cracks.md) | Reasons and cracks (the reason rule's research) |

Data and scripts kept beside them: `research/c7-name-data.json` (the name pools' source, read by `tools/c7/`),
`research/d11-military-branches.json`, `research/ios/` (probes), `design/skills/` (read by `tests/v2/skills.test.js`),
`design/demo-2d/` (the figure library, read by `tests/v2/draw.test.js`; its renders are not kept), `design/war/` and
`design/m1/` (the designed map, waiting on the owner's decision).
