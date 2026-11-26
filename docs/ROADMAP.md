# Roadmap

> **Updated 2026-11-25 for order 76** (the owner's answers): phases renumbered (Phase 3 is now magic, races and monsters; the old 3 to 11 are 4 to 12); the order of work is by effect on today's game (master prompt 13.1); Phase 1 now starts with the Emilio findings (`docs/design/emilio-1108-findings.md`). Settled: C1 skills (section 9 replaces S1, D-159), C2 time (Next year below 12, Next month from 12, D-160), C5 export and seed (behind a developer flag, low priority), the magic question (yes, section 17, D-161), the store (game packs), portraits (code-drawn), auto-resume (on), the two unfinished features (dropped). Put to the owner later: the map (C6, C8).

The working copy of the master prompt's section 13 (phases) and 1.3 (the carry-over checklist), with what is already
built mapped onto them (master prompt 0.2 steps 3 and 7, 4.2). The rules are `docs/MASTER_PROMPT.md`; what is happening
today is `docs/STATUS.md`. Plan in rolling waves: the next phase in detail, the later ones in outline. Re-plan after
every phase and every new prompt. *Written 2026-11-25 by the sync (H-108), on `v2-integration` at `0982302`.*

"Main" is GitHub's `main`, the trunk (order 76); `v2-integration` is kept level with it.

Contents: 1 the phases · 2 section 3 re-checked · 3 the old queue on the new phases · 4 conflicts and owner questions ·
5 the carry-over checklist (31 rows).

---

## 0. Now (2026-11-26, after orders 77 to 86)

The order of work, by importance (master prompt 13.1, order 78), and where each stands:

| # | Work | State |
|---|---|---|
| 1 | Keep `main` playable | Green on alpha 16; the skills merge's run under way |
| 2 | Bugs from the owner's lives, the exploits | **Done** (alpha 16): Emilio E1 to E10, breakthroughs, the throne plot, duel foes on demand |
| 3 | **The power scale and bestiary** (section 17's first wave; orders 77, 78, 81 to 85) | A helper building: the level ladder (a commoner 20-30 to the Dragon King about 800), capability profiles, behaviour per species, 150+ species with evolution, legends with character sheets and titles, encounters |
| 3b | **The map redesigned and locked** (section 7; orders 84, 86) | A helper building from M1: a detailed gazetteer, the Dragon Mountains, the sea lord's waters, the Sword Saint's places; plain renders for the owner, then the lock |
| 4 | **The skills rebuild** with titles, a person's level, stat points and training (section 9; orders 76, 79, 80, 82, 83) | Design done (`docs/design/skills-v2.md`); steps 1 to 5 merged (data, engine, adapter, save version 17, the switch: rungs hold the level); step 6 built (effects on through the adapter with the caps, `A.CAPS`, the knacks served from the rungs; nothing a player sees changes until the data review writes effects, D-180); the person's level (§12) built (D-181); steps 7 and 8 built (evolution at Lv 10 by the rung's route with its card, merging of level-10 skills by eight recipes, one advance a life; save version 19; D-182); step 9 (the rest of the 200, the census) next |
| 5 | Professions and pathways (section 18; order 80) | After the skills |
| 6 | Magic, new races, the canon rewrite (section 17) | After professions |
| 7 | Difficulty (the throne for an outsider, A2) and war | Later; stopgaps in place |

## 1. The phases, with what is already done

### Phase 0: skills, sync and protect (now)

| Task (13.3) | State | Evidence |
|---|---|---|
| Skills and tools refinement (16) | **Done, waiting on the owner's yes** to the Keep / Merge / Remove table; nothing switched off yet | H-107, D-157, `docs/TOOLING.md`; `ardan-prompt-intake`, `ardan-dev-process`, `ardan-ui-review` in `.claude/skills/`; `life-sim-systems`' breakthrough line fixed |
| The sync (0.2): STATUS, verdicts | **Done** (this file, `docs/STATUS.md`) | H-108 |
| Carry-over checklist (1.3) | **Done**: every row has a status (section 5 below) | this file |
| Memory files (4.2) | **Done**: `CLAUDE.md`, `HISTORY`, `DECISIONS`, `IDEAS`, `CRITIQUE`, `CHANGELOG`, `TOOLING`, `MASTER_PROMPT`, `prompts/`, `STATUS`, `ROADMAP`, `archive/` (a `NOTE.md` in every folder), `tests/saves/` | `docs/README.md` index, `tools/lint-docs-index.mjs` |
| Tag the current build; protect `main` | Tags: the git proxy refuses tag pushes, so every version is a `release/<v>` branch (D-134; `release/v2.1.0-alpha.15` = `b405db5`). Protection: **owner** (GitHub settings), and **Q3** (which branch is "main") first | `docs/BRANCHES.md` |
| GitHub Actions: tests, coherency, build, size and boot budgets, wrapper and patch counts | **Partly.** `check.yml` (build twice and compare, every lint, quick tier in 8 shards, the press gate), `long.yml` (long tier, balance), `nightly.yml`. Missing: a size and boot-time budget in CI (the bench `tools/bench/phone-load.mjs` exists, not wired), a count of `A.addStage` registrations that may only fall (only the "defined more than once" count is held, `tests/stages-baseline.json`), a count of baked-patch markers | `.github/workflows/`, `tools/check.mjs` |
| Save-compat tests | **Done**: 19 sample saves (`tests/saves/`), one per version, loaded by the save tests; `tools/version.mjs check` holds rows, branches, changelog and samples together | D-134, D-141 |
| Dependabot and secret scanning | **Owner** (repo settings); `.github/dependabot.yml` does not exist; the game has no npm runtime dependencies, Playwright only for tests | — |
| Seed leaks and release export / import, with the seed-leak test | **Not started** (STATUS row 11) | section 2 |
| The two skill-event errors | **Diagnosed** (STATUS row 10); fix not written | section 2 |
| **Added by the sync:** main's red test | **Finish first** (13.1 rule 2; STATUS row 1) | run 44618429139 |
| One batched message to the owner | After this sync | section 4 |

**Exit (unchanged):** the skills cleanup applied and recorded; `main` green; every piece of work with a verdict (done);
every row of 1.3 with a status (done); the seed-leak test passes.

### Phase 1: measure, stabilise, stopgap (next; outline with what exists)
**First (order 76):** the Emilio findings E1 to E10 (`docs/design/emilio-1108-findings.md`), state bugs first (E1, E2, E9), each with a test; then the exploits (breakthroughs, the throne plot, E5 retryable murder, E8 easy authorship); then Next year below 12 and Next month from 12.

- **Balance harness (A1).** Start from what exists: `tools/bench/balance.mjs` (held to `tools/bench/targets.mjs` on the
  long tier), `tools/bench/bot.mjs`, `dominant-strategies.mjs`, `long-life-audit.mjs`. Add the master prompt's strategies
  (duel-farmer, careerist, courtier, mercenary, the owner's winning run), the crown and Master/Legend targets of 8 A1, and
  `docs/BALANCE_BASELINE.md`. Absorbs **X4** and **T14**.
- **Lag, one holder, coherency (4.4).** One holder and coherency are built (rows 19, 20); lag's drawing side is done, the
  engine's share per press is open (**X7 part 2**, **I1-1**, the press part of **Y1**).
- **Stopgaps A0.** Breakthroughs, the throne plot, duel opponents (all three unchanged in the code, section 2). Absorbs the
  first part of **LC**.
- **Interface shell.** Rows 3, 4, 21, 22: places and click-to-open are done; time is "Next month or Next year" (Q6);
  clutter part 3 (the tablet's phone shell, D-055) is left.
- **Phone smoke test.** `tools/bench/phone-load.mjs` measures a Pixel 7 at 1x/4x/6x in Chrome; a real device run is new.
- Side tracks: war architecture doc and war harness (§10 C1, C2: the old **D12b** design in `docs/design/war.md` is input);
  portraits research and a priced plan (6.8, **C8d**'s gate 1 is input; Q5).

### Phase 2: skills (§9)

Starts from S1, not from the alpha 15 numbers (Q7): 28 skills with experience, concepts and breakthroughs, the `A.skill`
mirror, save version 15. Schema and validator, adapter, migration, UI, wiring, the first 150 skills. Absorbs **G**'s
library, **U1**'s link to `attempt()`. Side track: the war harness. Parallel: character appearance data (6.8).

### Phase 3: magic, races, monsters and legendary beings (§17)
Begins when Phase 2's exit is met. A canon pass first (`docs/design/magic-world.md`, with the map decision put to the owner), then data models and validators, then the first wave (elements and spells, ten races, a hundred monsters, three legendary beings), then waves of study, playtest and improvement. Old work to reuse: `archive/990-far-peoples`, `992-far-beasts` (read, not restored whole).

### Phase 4: difficulty and progression (§8 A2 to A4)

Absorbs **LC** (for good), **PA** (parity, the world's growth), the routes of **L1**/**N1** (A2.3). Side track: the new war
core behind a flag (§10 C3).

### Phase 5: war (§10 C4 to C6)

Absorbs **D12b**'s stages: hosts on roads, one engine, reports, the theatre, the press, sieges.

### Phase 6: content, art and depth

Absorbs **M2** (the map in depth, with **E0**'s trade), **R3**, **K1**, **E0**, **E1/E2**, the rest of **Y1**, **C8d**, **L2**,
**D9-2**, the **Gaps**, event pruning (row 29).

### Phases 7 to 12

6 phone readiness (**X7 part 2**'s remainder, **I1-2**'s leftovers), 7 playtesters, 8 accounts and cloud saves,
9 apps (**I1-3**, **I1-4**), 10 store (**I1-5** to **I1-7**), 11 launch. The iPhone route is already researched (`docs/IOS_ROADMAP.md`:
Capacitor 8 and Codemagic, I1-0); the master prompt asks to research and propose it in Phase 8, so it is re-checked then.

---

## 2. Section 3 re-checked against main (0.2 step 3)

Main = `v2-integration` at `0982302` (code unchanged since alpha.15, `b405db5`; everything after it is docs and skills).
Built with `node tools/build.mjs --out=/tmp/ardan/sync/x.html`: "150 features, 0 patches, 310 code files, 87 event
packs, 5,605 KB".

| What | Then (section 3, alpha 15) | Now | Evidence |
|---|---|---|---|
| `A.addStage` wrappers | 130; `A.newGame` 21, `A.applyFx` 37 | **128 call sites in 100 files** (`A.applyFx` 37, `A.newGame` 21, `A.eventChoose` 18, `A.eventView` 13, `UI.render` 9, `UI.renderModal` 8, `UI.refresh` 1, and 21 with a computed name: `'UI.' + k` 14, `'A.' + k` 7); **146 registrations at run time**, 148 stage names in the manifest. Also **346 names defined more than once** (2,357 definitions), the older wrapper form | `grep A.addStage( src`; `node tools/lint-stages.mjs`; `tests/stages-baseline.json` (346, may only fall) |
| Baked patches | 354 | **203 patches (393 replacements), written into the release source by X1** (D-028); **355 `[X1 baked patch …]` comments** mark them in `src/` (the owner's 354 is this marker count). No patch layer runs in the default build ("0 patches"); one `.wip` feature still carries a `patches.mjs` (`82-early-years`, 2 patches, not built) | `src/core/release/PATCHES.md`; `grep -c "X1 baked patch" src` |
| Source modules | 310 (ui 60, people 54, war 51, events 48, nobility 21, core 21, world 17, map 16, diplomacy 11, family 9, economy 2) | **The same 310 code files are built** (the count is `*.core.js` files). 314 on disk with two `.wip` features (events 49, economy 5). 163 feature folders; 70 v2 engine modules in `src/*/engine`; the release source is 55,230 lines of core and 103,421 of content (30 packs) | build output; `find src -name '*.core.js'` |
| Network | `connect-src data: blob:`; no `fetch`, no service worker | **Unchanged**: `default-src 'none'; script-src <hashes> 'strict-dynamic'; … connect-src data: blob:; worker-src blob:`. No `fetch`, XHR, WebSocket, beacon or service worker in `src/` (one function named `TR.fetch` in the `.wip` trade roads is not the network) | `src/core/release/page.html:5` |
| Save storage | IndexedDB `ardan`, four slots, localStorage fallback, gzip, versioned migrations, `.ardan` export and import | **Unchanged in kind**: `SAVES` (`DB "ardan"`, slots `cur`, `bak1` to `bak3`, `localStorage` key `ardan.slot.`, gzip by `CompressionStream`); save version **15** (S1b), format 3; migrations in `A.migrate` and `A.V2SAVE.upgrade`. **Export and import are still player features**: `UI.exportSave`, `UI.importSave` (`core/23-ui-a.js:359-372`; also `:1804`), the Menu's "Export save file" and "Load save file" (`core/23-ui-b.js:1207`, `:1410`); the problem report `.ardanreport` (`core/23-ui-f.js:752`). The tests load `.ardan` files (19 in `tests/saves/`) | `src/core/release/core/22-saves.js`; `src/core/99998-v2-saves/saves.core.js:14` |
| The seed in the interface | "World seed (optional)" box; "Copy the seed" and a seed row on the share card; "seed 48213" on the card; the legacy records; a 32-bit clock seed | **All still there.** Creation box: `core/23-ui-a.js:1125` (`data-c="crSeed"`; hashed at `:1188`). Share card: the line "Ardan · seed N · …" `ui/9994-share-a-picture/share.core.js:49`, the field "World seed: a friend can start in the same world with it" `:220`, the `shCopy` action `:230`. The hall of lives prints "seed N" (`events/995-hall-of-lives/hall.core.js:149`) and stores it (`:47`, `:78`). Default seeds from `Date.now()`: `core/04-realms-and-war-years-a.js:1126`, `core/19-journal-and-replay.js:99`, `core/23-ui-a.js:527, 618, 1134, 1189` | grep for `seed` in `src/ui`, `src/events`, the release core |
| Skills | 38 numeric skills 0–100 with perks at thresholds (`GD.PERKS`) | **Replaced by S1** (order 63, D-072, D-074; H-067, H-069): 28 skills with 99 specialisms (`data/skills.json`), 35 levels named by 7 words (beginner to legend), experience through `A.gainXp`, 252 concepts, proof and breakthroughs at a word's edge, rust as disuse. The 38 old keys live on as `GD.SKILLS` and `p.skills`, a mirror `A.skill(p, k)` still reads (`core/03-engine-base.js:773`; 10 legacy keys fold into the 28). **`GD.PERKS` is still defined** (`core/02-game-data-a.js:3800`) and still granted, as "knacks" when a level crosses its threshold (`people/36-skills/a-model.core.js:80-81`, `b-month.core.js:39`). Not ranked D to S; no rarity, kinds, slots or acquisition routes (§9) | `tools/lint-skills.mjs` |
| `A.breakthrough` | Runs on any won fight with a gap over 8; sparring not excluded; `pot` +70% of the gain up to 200; no limit, no cooldown | **Unchanged** (`core/04-realms-and-war-years-b.js:326-340`, called from `core/07-duels.js:438` when `won && gap > 8`; the spar test there only stops a spar counting as a duel win). A second path, `VS.breakthrough` (`people/99993-v2-stats/a-body.core.js:258`), raises `pot` by 3× its size up to 220 after a surge. S1's concept breakthroughs are a different thing (skills, not the body). Duel opponent choice not re-checked | code read |
| `A.plotThrone` | power ≥ 45; odds clamped 5% to 75%; once a year; "Wait for a better moment" free; only "Strike now" punished | **Unchanged** (`core/10-companies-and-war-staff-a.js:295-330`; once a year at `core/04-realms-and-war-years-b.js:477`). "Wait for a better moment" not only costs nothing, it **gives intrigue experience** (`content/01-ruler.js`, `fx: {skill: {intrigue: 2}}`). The card tells the player "about N in a hundred", a number (`content/01-ruler.js`, `plot_throne` text). The scope hides the activity from soldiers below rank 4 (`ui/999997-scope/a-scope.core.js:65`). NPC coups are reasoned (W1-6, `9999954-realm-peace/d-coups.core.js`); the player's own plot is still the roll | code read |
| Difficulty | Story, Hard, Realism change only dying, information and healing | **The same three**, now only dying and recovery: healing ×1.5/1/0.7, wound length, prison length (`core/42-difficulty`). The information part is off: `A.DIFF.showOdds` returns false on every setting (`people/99993-v2-stats/f-words.core.js:13`). Nothing changes the world's competence. The creation screen shows a score multiplier ("Score ×0.60") | code read |
| `sk_better_hand`, `sk_rival_contest` errors | `reading 'lv'`, `reading 'given'` (seven times) | **Reproduced; they still happen, but only when a caller answers a card the engine dropped.** Forcing the two cards on 8 lives and answering whatever view came back gave 24 `event fx sk_rival_contest … (reading 'given')`; answering only views not marked `skip` gave 0; 6 bot lives of 40 years by the game's own `A.eventAuto` gave 0 console errors. Cause: the setups mark the card `ctx.skip` when they find nothing (no skill at level 6 with a concept open; no rival with a level), and `A.eventChoose` still runs a skipped card's choice (`core/18-event-view-a.js:193-205`), whose `fx` then reads `p.sk[undefined].lv` or `A.P(undefined).given`. The owner's bot (Appendix A) answers skipped views. Also found: **`sk_rival_contest` can never show in play**: the player's rivals have no skills at all (`p.sk` and `p.skills` empty), so its setup always skips (seed 104, two rivals) | `/tmp/ardan/sync` scratch runs; H-108 |
| "Great Continent" mentions | 35 | **41** in `src/` code files (116 counting READMEs and tests; none in `data/` or the lore). **Not in play**: the Far Lands were archived (`archive/99-far-lands`, `990` to `993`; out of the build since `f933c89`, v2.0.0-alpha.2). What is left is comments, guards on `A.FAR` (nothing defines it), the creation screen's "Lands" picker that draws only when `A.FAR` exists (`events/29-starting-stories/starts.core.js:159`) and the `.wip` trade roads. Most in: `ui/86-title-screen-in-view/fold.core.js` 4, `core/release/core/17-careers-and-event-engine-a.js` 4, `economy/9995-trade-roads/b-roads.core.js` 3, `core/09-engine-at-scale/world.core.js` 3 | `grep -rio "great continent" src data` |
| Places (tabs) | (asked: at most five) | **Done**: Life (Now, Decisions; Story on a phone), You (Profile, Path, Holdings, Arms), Family (People, Dynasty), World (Realm, World, The Book, Places, Codex), and War only while you are in a war; read in a built page for a peasant and a noble | `core/99992-v2-time/time.core.js:475-505`; `ui/999997-scope/b-routes.core.js` |
| Time buttons | (asked: Next month only) | **Next month and Next year** (B6; D-008, D-019, D-026; `ui/999995-next-year`); Next week and Next day only in a campaign (`time.core.js:470-472`); no Play, no sim-a-week; a quiet month is a 2-second toast (`time.core.js:19`) | built page |
| **Added: main's CI** | (not in section 3) | The last check of `v2-integration` that ran (`650949f5`) **failed** `w4OldSaves` on the alpha.15 sample (STATUS row 1); everything since is `[skip ci]` | run 44618429139 |

---

## 3. The old queue on the new phases

`docs/PROGRESS.md`'s open items, each with its verdict (STATUS has the one-line table) and its reason.

- **M1** (in flight): Finish, Phase 0/1, after the owner's critique. It decides 1.3 row 2 and 26's ground, and section 7's
  terrain-as-data starts from its version 4 data.
- **M2**: Park to Phase 6. It is the "detail that matters" of section 7 and needs M1. Its places and trade routes should be
  built as data the war core reads (7, 13.1 rule 7).
- **T14**: Redirect into Phase 1's baseline: a scripted read of which alpha.9 survey findings the build now answers.
- **Y1**: Redirect, split: the press's wait is Phase 1 lag; what fills a year is Phase 6 content.
- **PA**: Redirect to Phase 4 (A3, rivals that grow; and the rivals-without-skills finding above). Its "record the trait's say
  in the rulers' log" is a small ride-along.
- **LC**: Redirect: A0 stopgaps now (Phase 1), A2 for good (Phase 4). D-137's "say plainly what the deed is" rides with it.
- **R3, E0, K1**: Park to Phase 6. K1's "a duke forced to kneel" is a wrong card: fix it on sight as a quick fix.
- **U1**: Redirect: its four named sources of upset become §9 effects (blunder and surge) and the duel side of A3.
- **D12b**: Redirect: war is frozen (§10). Its design (`docs/design/war.md` §9 to §16) feeds C1's architecture doc and C3's core.
- **X4**: Redirect to the balance harness (Phase 1). **X5**'s leftovers are done or decided (D-104 point 4).
- **X7 part 2, I1-1**: Redirect to Phase 1 (lag, the smoke test) and Phase 7.
- **I1-2 leftovers, I1-3 to I1-7**: Park (order 70; Phases 7, 9, 10).
- **C8d, L2, D9-2, Gaps**: Park; the art waits for the art route (Q5) and the image key (order 60).
- **R1**: Finish as you go; the count (41) may only fall.
- **v3 (G, E1, E2, L1, N1, V3-X)**: G is §9's library (Phases 2 and 5); E1 and E2 Phase 6; L1 and N1 Phase 4's routes and
  Phase 6.
- **Versions and milestones** (`release/v2.2-interface` …): the milestone list stays as the restore points; the names are
  not used in new docs (conflict 4).

---

## 4. Conflicts between the old orders and the master prompt, and the owner questions

The newest instruction wins (§2 "Precedence"), except where undoing is costly: those are asked first (1.1 step 3).

| # | Conflict | Proposed resolution | Costly to undo? |
|---|---|---|---|
| C1 | **S1 skills (order 63, D-072) vs §9's ranked D–S skills.** S1 is built and in saves (version 15): 28 skills, 35 levels, words, experience, concepts, breakthroughs. §9 asks for named skills with a rank, a level of 1 to 10, rarity, kinds, slots and routes, and treats "the old numeric skills" as the thing to adapt. | Keep S1 as the **engine of growth** (experience, concepts, breakthroughs, rust, teachers) and build §9's ranked skills **on top of it**: each of the 28 becomes a ladder (Basic Swordsmanship C … ), §9's level 1–10 read from S1's progress inside a rank, routes and rarity added as data. `A.skill` keeps working through the existing mirror. **Q7** asks the owner to confirm before Phase 2 | **Yes** (save format, every skill reader) |
| C2 | **Next month or Next year (D-008, D-026) vs "Next month only" (§5).** | Ask (Q6). Default until he answers: keep Next year (it is his order 8 of Nov 12 and D-026; the master prompt's text comes from the Nov 1 spec). If he confirms "Next month only", removing Next year is a small, safe step | No |
| C3 | **`A.addStage`, which `CLAUDE.md` tells new code to use (X2, D-056), vs "no new wrapper layers" (§2, 4.6).** | The master prompt wins (it is newer and not costly): `CLAUDE.md` should say "change the module that owns the function; a stage only with a reason in DECISIONS", and CI should hold the registration count (146) so it may only fall. Done in the next records step, not by this sync (this sync writes only its four files) | No |
| C4 | **Version and round labels** (`v2.1.0-alpha.N`, "round 2", `release/<v>` branches, D-134, orders 22 and 65) vs "no version or round names in docs" (header of the master prompt). | New docs and this file's plans speak in phases and "Done when" lines. Keep `tools/version.mjs`, `docs/VERSIONS.md` and the `release/*` branches as **restore points** (the master prompt's "tag a release at every milestone" asks for the same thing). Do not rename history | No |
| C5 | **`.ardan` export and import, and the seed in the interface** (built features: the share card's "a friend can start in the same world", the creation box) vs §2 (no seed sharing; export only behind a developer flag). | Remove from release builds as §2 says (Phase 0). The `.ardan` format stays for tests, `tools/version.mjs` sample saves and the problem report; the developer flag turns the menu items back on. Q4 confirms the problem report may keep the save | Only if a player's saves depend on export (the backup slots stay) |
| C6 | **The Great Continent (Q1 of §2, "35 mentions").** | The code already answers most of it: the Great Continent left play in v2.0.0-alpha.2; 41 comment and dead-guard mentions remain. Propose: tell the owner it is gone from play; with his yes, sweep the comments and the dead "Lands" picker, and archive `9995-trade-roads` | No |
| C7 | **The old PROGRESS order (M1, M2, T14, Y1, PA, LC, …) vs §13's phases.** | §13 wins (0.2 step 7); half-done steps first reach a safe commit (M1). The mapping is section 3 above. `docs/PROGRESS.md` stays as the record of what was done; new work is planned here | No |
| C8 | **M1's designed continent (orders 72, 73: "one designed map", the owner's picture) vs §7's "made by procedural plates, erosion, climate and rivers".** | The two agree on what matters (one connected continent, sea all round, no land at the frame, rivers and borders as vectors, satellite-like). M1 is authored data plus generated detail. Ask (Q2) whether §7's "procedural" is meant to override his own map orders; default: M1 stands | **Yes** if reversed (the lore pass, 90 changes in 9 files) |
| C9 | **Story difficulty showed numbers** (`src/core/42-difficulty`, Road to Ten) and the plot card says "about N in a hundred" vs "no percentages". | The numbers are already off for every setting; the plot card's number goes with the A0 throne stopgap | No |
| C10 | **The scheduled auto-resume** (order 16) vs order 74's stop and the master prompt's "one batched message". | Leave both check-ins disabled until the owner asks; a session reads `docs/STATUS.md` instead | No |

**Owner questions** (to send in the one batched message of Phase 0, with the master prompt's own four):

- **Q1** (§2 question 1): The Great Continent is already out of play; may the leftover 41 mentions and the dead picker go?
- **Q2**: M1's designed continent (your orders 72 and 73) or a procedural one (§7's wording)? And your critique of M1 with
  the nine questions in `docs/design/m1/map-design.md` §9.
- **Q3**: Make `v2-integration` GitHub's default branch, or merge it into `main` (PR #1 is 328 commits behind)?
- **Q4**: Remove export and import from the player's menu now; keep the problem report's file (it carries the save)?
- **Q5** (§2 question 4): the art route for portraits; the image-model key (order 60).
- **Q6**: Keep "Next year" beside "Next month"?
- **Q7**: Build §9's ranked skills on top of S1 (C1), rather than replacing S1?
- Also from §2: Q (magic?), Q (store items and the simulation), and the request for a save of a run that reached the crown.

---

## 5. The carry-over checklist (master prompt 1.3)

Counts: **Done 18 · Partly 9 · Changed 1 · Not done 3 · In progress 0** (M1 is in progress under row 2, which is met
already by the generated continent).

| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | The kit's 24 tests run and block a release | **Done** | `tests/v2/` (15 files, 165 tests; the kit's in `core.test.js`) run by `tools/check.mjs:23-26` ("a failure blocks a release"); `node tools/build-v2.mjs --check` holds the bundle |
| 2 | One connected generated continent; the Great Continent gone from play | **Done** (cleanup left) | `src/map/99991-v2-map`; Far Lands archived (`archive/99-far-lands/NOTE.md`, out since `f933c89`); 41 mentions left (section 2); M1 redraws it as one designed continent (`work/m1`, D-152 to D-156) |
| 3 | Only Next month; cards one at a time; quiet months a toast; Next day and week only in a campaign; no Play | **Changed** | Next month **or Next year** (D-008, D-019, D-026; `src/ui/999995-next-year`); quiet month toast, week and day in a campaign (`src/core/99992-v2-time/time.core.js:19, 470`); Play removed (v2 step 3; `82-early-years/.wip`). Q6 |
| 4 | At most five places | **Done** | `V2T.groups` (`time.core.js:475-505`), read in a built page (section 2) |
| 5 | Stats in real units, growth by age, races, no universal piety, checks through `attempt()`, fights through `fightingWorth` | **Partly** | v2 body (`src/people/99993-v2-stats`): genes, growth by age, races; piety a pull for the devout only; checks through `A.V2S.roll` (baked `V2S-ROLL`, `18-event-view-a.js`); fights through v2 worth (`c-fight.core.js`). **Changed by the owner**: C9 shows measured words, not body units (D-040). The breakthrough exploit remains |
| 6 | One relation-label resolver; no "rivals but married", no "mutual friend" | **Done** | `A.relLabel` (`src/family/99994-v2-family/a-kin.core.js:168`), `src/family/engine/kin.js`; tests `99994-v2-family/test.mjs`, `tests/v2/core.test.js` |
| 7 | A three-generation family; no birth-position picker; one holder per title | **Done** | `A.V2F.extendFamily`; "no birth-position picker" (`99994-v2-family/b-family.core.js:2, 31`); C6 households (D-057); one holder (row 19) |
| 8 | Noble pyramid caps | **Done** | `src/nobility/99995-v2-nobility/a-court.core.js:6` (3 dukes, 6 marquises, one count a county …) |
| 9 | Diplomacy changes monthly with reasons | **Done** | `src/diplomacy/99996-v2-diplomacy/view.core.js:2` ("Drawing together", "Pulling apart") |
| 10 | Renown and promotion not linear | **Done** | `src/people/99999-v2-renown/a-deeds.core.js`, `b-promo.core.js` |
| 11 | Odds in words, with blunders and surges | **Done** | `A.V2S.roll`; `f-words.core.js` (words only, `showOdds` false); U1 adds named upsets later |
| 12 | Elite orders | **Done** | `src/war/99997-v2-war` (`v2wOrders`: 150–350 members × 14–26; three trials in `A.orderJoin`) |
| 13 | War only when I am in it; play my rank; rumours | **Partly** | D10 and `99997-v2-war/a-gate.core.js` (only your war; rumours late and sometimes wrong); five ranks (W1-1); war undeveloped (D12b not built) |
| 14 | Saves carry new fields and migrate | **Done** | `src/core/99998-v2-saves` (version 15), 19 sample saves; one test red on the alpha.15 sample (STATUS row 1, a test fault) |
| 15 | The playtest loop after every step | **Partly** | `.claude/skills/game-ux-playtest-loop`; run on medium and large steps per HISTORY, not on every step; the step-size table (4.5) now sets it |
| 16 | Repo layout and memory files, archive, tags, sample saves | **Done** | `CLAUDE.md`, `docs/README.md`, `archive/` with notes, `tests/saves/`; tags are `release/*` branches (D-134) |
| 17 | `docs/CRITIQUE.md` | **Done** | 162 flaws rated (PROGRESS Step 1, `f3fca58`) |
| 18 | No lag at year 50 | **Partly** | A1: one redraw a press, drawing at year 50 as year 0 (D-023); the press gate in CI (`tools/bench/press-gate.mjs`); the engine's share per press is open (X7 part 2) |
| 19 | One holder per post; a promotion hands over real command | **Done** | A2 stages 1 and 2 (D-031, D-049, D-053), `src/nobility/999990-posts`; W1-1 to W1-3 commands; coherency counts at 0 |
| 20 | Coherency checks after every update | **Partly** | `src/core/08-coherency-checks` (230 lines), `tools/coherency.mjs` in CI (quick: 4 lives, 16 years) and nightly (60 years); one count left: "family links agree" 3 (nightly). The "100 lives at zero" bar is not measured |
| 21 | Descriptions open on click | **Done** | B4: `src/ui/59-descriptions`, `src/ui/99998-click-open/test.mjs` |
| 22 | Less clutter on every screen | **Partly** | B5 parts 1 and 2 (first view 479 → 171 words; `tools/bench/clutter.mjs`); the tablet's phone shell not done (D-055) |
| 23 | Relationships start small and grow | **Done** | C6 (household at birth, how you met, D-057), R2 access (D-080); R3 (deeper) parked |
| 24 | Diverse names and cultures | **Done** | C7 (D-058), `data/names.json`, `nmTwins` |
| 25 | Distinct, individual characters | **Partly** | C8a to C8c: the 2D figure library draws every portrait, dress by station and culture (D-024, D-035, D-060); the blind reading is 81–83 of 100 against a bar of 85; C8d parked for the image key |
| 26 | Map detail: borders, routes, roads, rivers, fords, passes, forests, marshes, towns | **Partly** | D9 (D-061): roads in two ranks, fords, bridges, passes, woods, marsh, towns on water; roads read as roads only 69–75 of 100 (D9-2); trade routes are M2's |
| 27 | Military branches with ranks, training and missions | **Done** | D11-1 to D11-3, D11+ (D-110 to D-132), `data/military/` |
| 28 | War depth: flanking, stealth, attrition, blockades, encirclement, sieges, supply, ambushes, scouting | **Not done** | Designed (`docs/design/war.md`, D12a, D-064); D12b not built; the old `36-sieges` is part of the frozen stack |
| 29 | Migrate and prune the 3,199 events | **Not done** | 3,199 release events still in `src/core/release/content/`; the built game holds 5,030 events (`A.EV`) |
| 30 | Diplomacy depth: wars move provinces; allies pulled in | **Partly** | W1-5: terms of real things, a province passes (`src/war/9999953-surrender/b-end.core.js:220`); W1-3 the summons, W1-6 alliances and pacts through `A.WHY`; allies drawn in by reasons not checked end to end |
| 31 | Five real new players confirm the feel | **Not done** | Phase 8 |
