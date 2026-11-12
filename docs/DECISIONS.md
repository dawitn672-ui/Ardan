# Decisions

One short record per important design or engineering choice: what was chosen, what else was considered, and why.
Read before changing anything these touch. To reverse one, add a new record that says so; never edit an old one.

---

### D-001 · Repo layout: features live with their system (2026-11-11 23:43 ET, round 2 step 0)
**Chosen:** every feature folder moved from `features/NN-name/` to `src/<system>/NN-name/` (11 systems: core, map,
world, people, family, nobility, diplomacy, war, economy, events, ui). Features still apply in the order of their
folder names, sorted across all systems exactly as before, so the build is unchanged (verified: the new blobs differ
from the old only in comments). Every tool finds features through `tools/lib/features.mjs`, never by path.
**Considered:** keeping `features/` and adding `src/` only for new code (no navigation gain); renumbering features
per system (would change patch order and break 196 patches that depend on it).
**Why:** the owner asked for a layout split by system; ordering by name keeps the 196 order-dependent patches valid.

### D-002 · Events stay as code, next to their system (2026-11-11 23:43 ET)
**Chosen:** event packs (`*.events.js`) stay in their feature folders. `data/` holds only content that is pure data
(cultures and names, military branches, items), loaded as `A.DATA[...]` by the build.
**Considered:** moving all events to `data/events/` as JSON.
**Why:** an event holds functions (`cond`, `setup`, sometimes `text`, `fx`, check functions), and `A.evAudience` /
`A.CX_RX` classify events by reading those functions' source. JSON would lose them; moving the `.js` files away from
the feature that owns their flags and patches would split one unit of change across two places.

### D-003 · The v2 engine modules live in their systems (2026-11-11 23:43 ET)
**Chosen:** `src/v2/*.js` moved to `src/<system>/engine/` (body, races, odds, renown in people; kin, succession in
family; war, orders in war; ...), entry `src/core/engine/index.js`. The bundle is byte-identical apart from its path
comments. The kit's standalone demo UI went to `archive/v2-kit-demo-ui/` (never part of the game).
**Why:** split by system, as asked; the engine's unit tests (`tests/v2/`) still pass (29 of 29).

### D-004 · Measurement harnesses are tools (2026-11-11 23:43 ET)
**Chosen:** `bench/` moved to `tools/bench/`, its reports to `tools/bench/reports/`.
**Why:** the owner's layout puts build, playtest and check scripts under `tools/`.

### D-005 · Working branch and milestones (2026-11-11 23:43 ET)
**Chosen:** round 2 works on `v2-integration`, so PR #2 runs CI on every push. Milestones get a `release/<name>`
branch (beta.1 is `release/v2.0.0-beta.1`) as well as a row in `docs/VERSIONS.md`.
**Considered:** a new branch and pull request for round 2; git tags.
**Why:** the session's git proxy refuses tag pushes (tried again on Nov 12: the push is cut off), and a new PR would
need its own CI setup; release branches can be pushed and restored like tags.

### D-006 · Tests use the container's Playwright (2026-11-11 23:43 ET)
**Chosen:** `tests/run.mjs` falls back to `/opt/node-tools/node_modules/playwright` when `node_modules/playwright`
is missing; in a fresh container delete the pinned copy after `npm ci`.
**Why:** the pinned Playwright 1.56.1 wants a Chromium build the container does not have; CI installs its own.

### D-007 · Descriptions open on click (2026-11-11 23:43 ET, owner's round 2 order B4)
**Chosen:** hover pop-ups are removed; a button or an info icon opens a description. This replaces V2_SPEC's older
rule "never hide a description behind a click".
**Why:** the owner's order. To be done in step B4; recorded now so nobody re-adds hover tooltips meanwhile.

### D-008 · Time moves by Next month or Next year (2026-11-12 00:07 ET, owner's order)
**Chosen:** two buttons, Next month and Next year. A year runs month by month underneath and stops early when
something needs the player (a real decision, an illness, an exam, a call to war); quiet months pass as feed lines.
Next year is the main button in childhood; an adult chooses. Next day and Next week stay for campaigns.
**Replaces:** V2_SPEC complaint 8's "only Next month" and the game-ux-playtest-loop rule "one button moves time".
**Why:** the owner: "There's no need to go month by month as a child without a reason and there are times simming a
whole year is too much as an adult." To be built as B6 after the owner reviews the critique; the spec and the skill
are updated when it is built.

### D-009 · Which model does which part (2026-11-12 00:07 ET, owner's plan)
**Chosen:** the owner's table, for every agent and every session that works on round 2:

| Part | Model | Effort |
|---|---|---|
| Step 0: restructure, history files | Opus 5.5 | High |
| Step 1: harsh critique and work order | Fable (5.2 or the newest Fable available) | Max |
| A1: lag | Opus 5.5 | High |
| A2–A3: rank and title consistency, coherency checks | Opus 5.5 | High |
| B4–B5: click-to-open descriptions, declutter | Sonnet 5.5 | High |
| B6: Next month or Next year (added Nov 12; not in the owner's table: treated like B4–B5) | Sonnet 5.5 | High |
| C6: relationships (households, servants, guards) | Opus 5.5 | High |
| C7: names and cultures | Sonnet 5.5 | High |
| C8: character design | Fable to plan, then Opus 5.5 to build | High |
| D9: map detail | Opus 5.5 | High |
| D10: war only when deployed | Sonnet 5.5 | High |
| D11: military branches | Opus 5.5 | High |
| D12: war and command depth | Fable to design, then Opus 5.5 to build | High |
| Playtester agents | Sonnet 5.5 | Default |

**How:** work is delegated to agents with that model and effort; the orchestrating session integrates, tests and
records. The first critique round of Nov 12 ran on the session's own model (Opus) before this plan arrived: its
reports are kept as evidence, and Fable at max effort writes the critique and the work order from them and its own play.

### D-010 · Token efficiency first; model and effort at the session's discretion (2026-11-12 00:44 ET, owner's order)
**Chosen:** the owner gave full discretion over model and effort and asked for token efficiency "by any means
necessary" with the game's goals in mind. D-009's table stays as the default guide. Practice:
- **Match the model to the work:** Haiku for searches and mechanical edits, Sonnet for interface, data and
  playtesting, Opus for systems, Fable only for judgment that steers many steps (the critique's final merge, the C8
  and D12 designs). Max effort only for those judgments.
- **No duplicate rounds.** The critique's first round (Opus) is evidence; one Fable lead merges it (the two Fable lens
  critics already started finish; the other three lenses go straight to the lead).
- **Tight briefs:** point agents at files and evidence instead of pasting; cap report length; reuse scripts in
  `tools/` and earlier evidence; grep with context instead of reading big files or minified blobs.
- **Few, targeted test runs:** run the tests a change touches locally; one full CI run per finished step.
- **Don't overload the 4-core machine:** at most 3 browser-driving agents at once.
- Browser AI is allowed (owner, Nov 12). This session has web search and a web-reading agent (used for research and references, on a small model); no other browser-AI tool is connected.
**Why:** the owner's order; it also keeps the 5-hour usage window from stopping the work.

### D-011 · Art register: detailed anime, a designer's hand, deep customisation (2026-11-12 06:49 ET, owner's answer to CRITIQUE decision 1)
**Chosen:** keep the anime look, but far more detailed, as if drawn by a real character designer: grown-up proportions,
real noses, age and scars that show, and many more options for hair, height, facial features and build.
**Why:** the owner's answer. Steers C8a (the plan) and C8b/C8c (the build).

### D-012 · The crown picks the Marshal; feudal armies (2026-11-12 06:49 ET, owner's answer to CRITIQUE decision 3)
**Chosen:** the king may make anyone Marshal of the army, over the generals' heads (with real command handed over and
their resentment). Armies are feudal: each noble holds troops in proportion to his rank; the crown has royal knights;
the elite orders are under the crown but recruit from the whole kingdom by prowess; a duchy's knights fight for the
kingdom in war but, forced to choose, side with their duchy. **Why:** the owner's answer. Steers A2, D11 and D12.

### D-013 · One language, many cultures (2026-11-12 06:49 ET, owner's answer to CRITIQUE decision 7)
**Chosen:** most countries speak the same English language, so most realms draw on one large pool of plain English
names; cultures differ in customs, dress, faith and ways. Only a few far or non-human peoples sound different.
**Replaces:** the earlier "names modelled on real-world cultures" order (OWNER_ORDERS rule 8, superseded) and the
24 separately-flavoured pools of `docs/research/c7-names.json` as the default. **Why:** the owner's answer. Steers C7.

### D-014 · The open critique decisions the owner left to the plan (2026-11-12 06:49 ET)
**Chosen (the critique's recommendations, until the owner says otherwise):** map look (decision 2): keep the
satellite ground and lay roads, rivers and names over it as crisp lines; X1 (decision 4): turn the patched release
into readable source as one step before A2; the built game (decision 5): keep committing `index.html` for now (the
playable file in every commit is how versions are restored), revisit in X5; a year for an adult (decision 6): a year
stops at any card that needs a choice, a war call, an illness, a birth or death in the family, or when the initiative
pool is full. **Why:** the owner said "continue with structure according to plan" without answering these.

