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
**Done in B4 (Nov 12), and where the order met the code:**
- A choice on an event card keeps its tap for the choice (playtest round 1: a tap on a choice chooses), so its odds open through
  an info glyph `ⓘ` kept inside the button (`UI.TT.sweepChoices`), not through the odds text. An activity tile opens a sheet.
  Every other anchor inside a row or card explains itself when pressed, and the rest of the row still acts.
- The roughly 150 descriptive `title=` sites (mostly in the release's minified code) are lifted at run time by `UI.TT.sweepTitles`
  (a text element becomes the trigger, a button gets an info button beside it); feature code writes `data-note="..."`. A short
  title (three words or fewer) stays. The time dock's own hints (Next month and the speeds) are `aria-description` only, since the
  dock is B6's. A disabled control's reason opens through an info button beside it.
- The maps' province cards and the battle field's unit names show on a press, not on a moving pointer.
- Test and lint: `src/ui/99998-click-open/test.mjs` (`clickNoHover`, `clickOpens`, `clickLint`, `clickActSheet`).

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

### D-011 · ~~Art register: detailed anime~~ (superseded by D-015, 2026-11-12 10:46 ET), a designer's hand, deep customisation (2026-11-12 06:49 ET, owner's answer to CRITIQUE decision 1)
**Chosen:** keep the anime look, but far more detailed, as if drawn by a real character designer: grown-up proportions,
real noses, age and scars that show, and many more options for hair, height, facial features and build.
**Why:** the owner's answer. Steers C8a (the plan) and C8b/C8c (the build).

### D-012 · The crown picks the Marshal; feudal armies (Marshal part superseded by D-017, 2026-11-12 10:46 ET; the feudal armies stand) (2026-11-12 06:49 ET, owner's answer to CRITIQUE decision 3)
**Chosen:** the king may make anyone Marshal of the army, over the generals' heads (with real command handed over and
their resentment). Armies are feudal: each noble holds troops in proportion to his rank; the crown has royal knights;
the elite orders are under the crown but recruit from the whole kingdom by prowess; a duchy's knights fight for the
kingdom in war but, forced to choose, side with their duchy. **Why:** the owner's answer. Steers A2, D11 and D12.

### D-013 · One language, many cultures (2026-11-12 06:49 ET, owner's answer to CRITIQUE decision 7)
**Chosen:** most countries speak the same English language, so most realms draw on one large pool of plain English
names; cultures differ in customs, dress, faith and ways. Only a few far or non-human peoples sound different.
**Replaces:** the earlier "names modelled on real-world cultures" order (OWNER_ORDERS rule 8, superseded) and the
24 separately-flavoured pools of `docs/research/c7-name-data.json` as the default. **Why:** the owner's answer. Steers C7.

### D-014 · The open critique decisions the owner left to the plan (map look superseded by D-016; X1, X5 and the year by D-018 and D-019, 2026-11-12 10:46 ET) (2026-11-12 06:49 ET)
**Chosen (the critique's recommendations, until the owner says otherwise):** map look (decision 2): keep the
satellite ground and lay roads, rivers and names over it as crisp lines; X1 (decision 4): turn the patched release
into readable source as one step before A2; the built game (decision 5): keep committing `index.html` for now (the
playable file in every commit is how versions are restored), revisit in X5; a year for an adult (decision 6): a year
stops at any card that needs a choice, a war call, an illness, a birth or death in the family, or when the initiative
pool is full. **Why:** the owner said "continue with structure according to plan" without answering these.

### D-015 · Characters: as realistic as possible; anime optional (2026-11-12 10:46 ET, owner's answer to C8a; supersedes D-011)
**Chosen:** leave anime if a realistic hand suits better (the plan's call). People grow up accurately from infant to
elder, with age shown truly in face and body; scars are real and lasting and change the face and body's structure;
armour and clothing are drawn in full detail down to the smallest features, using real art-design skill. The plan's
other defaults stand: veterans' scars are real (rare, with small lasting costs), creation may redraw the player's
family to keep the resemblance, and the two older portrait renderers retire to `archive/` at C8c.

### D-016 · The map: inked, rich in detail; war as a creeping burn, not tiles (2026-11-12 10:46 ET, owner's answer to D9; supersedes D-014's map look)
**Chosen:** an inked map, detailed enough to read rivers, valleys, mountains, trade routes, terrains and notable
habitats. No hexagonal tiles in war: control spreads and recedes like a burn across the land, soft-edged, creeping
with each skirmish, so the map shows momentum and change; small border skirmishes move it a little.

### D-017 · The Marshal: usually vacant; a General leads day to day (2026-11-12 10:46 ET, owner's answer to A2; supersedes D-012's Marshal part)
**Chosen:** the Marshal's seat stays empty until it is truly needed (a great war, more armies than the generals can
hold together). Then it goes to a General, or someone who has proved more capable than the generals, chosen by the
crown. Day to day, General is the highest rank in the army. Feudal armies (D-012) stand.

### D-018 · X1 and X5, the long-term call (2026-11-12 10:46 ET, the owner left them to the session)
**Chosen:** X1 runs before A2: the patched release becomes readable source (one step, nothing to see), because A2
must route ~70 write sites, many inside minified code. X5: after X1, stop committing `index.html` every round; CI
builds it, release branches carry the built file, and `tools/version.mjs get` rebuilds any older version from its
commit (the build is deterministic). Removes the 104 MB of built files from git's growth.

### D-019 · Time: no initiative cap; only notable things stop time (2026-11-12 10:46 ET, owner's answer to B6; refines D-008)
**Chosen:** the initiative pool is removed: the player may do as much as they like in a month or a year when it is
fitting; overtraining has its own consequences (fatigue, injury), and that is on the player. Ordinary conversations
and day-to-day happenings never stop a month or a year; only notable events or problems do (a real decision, a
war call, an illness or wound, a death or birth in the family, coming of age, a deadline).
**C7:** the owner confirmed one common English language (D-013).


### D-020 · Characters: the owner's detailed answers (2026-11-12 10:52 ET; refines D-015)
**Chosen:** the register (anime or realistic) is re-evaluated by the plan, which picks the better one and says why.
The player can customise every feature of the face by hand; customisation comes first, genes and inheritance second
(defaults, NPCs, children). Height and build show. 38 hair styles, realistic and drawn well. Scars come from battles:
mostly looks, with small debuffs only where it makes sense (an eye, a knee, a hand). Clothing is accurate to class,
culture and role by default, and the player can change it. In-depth customisation. **Demos first:** before any
building, the owner sees prototype sheets (faces, ages, scars, builds, hair, outfits) and approves them; that is C8b's
first gate. Family redraw to match the player's face: yes. Retire the two older renderers: yes.

### D-021 · What the coherency net counts, and the day-0 fixes (2026-11-12 10:35 ET, A3a)
**Chosen:** (1) Any `console.error` fails a test, bench, soak or coherency run; the only project-wide exception is the
CSP refusing the security tests' own probes (`tools/lib/page-errors.mjs`), and a test that provokes an error on
purpose names it with `expectError`. (2) Known contradictions are counted per check in `tests/coherency-baseline.json`
and may only shrink; raising a count needs a line here. (3) Land titles are left out of "no child in an adult office":
they pass by blood and a child may hold one as a ward (council seats, shire offices and armies are held to the race's
age of majority; elf lords made at human ages are left to A2 and C6). (4) A rebel faction still at war (`r.isRebel`,
not yet `r.isNew`: the Tessarian pretender's Andros on day 0) needs no council. (5) Day 0 passes every check:
`A.newGame` makes the v2 stores (no seed's world changes; only the key order of `A.S`, so `A.fingerprint`, differs
from older builds), and `RI.fillCouncil` passes over anyone under age (the young keep their draw, but every seed's
world now differs from day 0: the heir of Kesh, aged 2, sat as Chancellor in every world). **Why:** CRITIQUE A3a; "a
new game passes every check on day 0" needed the council rule; (3) and (4) keep the checks to contradictions rather
than to medieval custom.


### D-022 · Character demos built on MakeHuman's CC0 base mesh (2026-11-12 15:52 ET)
**Chosen:** the first-gate demos use MakeHuman's sculpted base mesh and shape targets (github.com/makehumancommunity/
makehuman; each file states "explicitly released as CC0 in september 2020"; the age/sex/build targets from the same
assets as carried in the mpfb2 repository). Only the numbers are used, no AGPL/GPL code. Recorded in
`docs/design/demo/mh-prep.mjs`, the generated data file and the demo page's footer. **Why:** the plan's own blended-
ellipsoid head read as "a lumpy alien bust"; the plan named this fallback. **Status:** the look is still below the
owner's bar (mannequin feel, shell hair, crude cloth, far over the time budget); the owner reviews and chooses the path.

### D-023 · The press gate reports, and does not block, until the engine's share is cut (2026-11-12 16:27 ET)
**Chosen:** the CI `press` job runs `tools/bench/press-gate.mjs index.html --report`. The drawing side of A1 meets its
goals (one full redraw per press, year 50 no slower than year 0); the quiet-month CPU (150 ms) and the 4× throttle
wall time (1 s) are still over, mostly because the engine's own month costs 80–170 ms on this machine. Drop
`--report` once the engine work lands (P12 `A.wsDay` in D12b, the month work in X5), or budget the drawing share only.

### D-024 · Characters: a detailed 2D illustrated style (2026-11-12 17:05 ET, the owner's choice after the demos; supersedes the 3D render path of D-015/D-022)
**Chosen:** option 2 of the demo review: a large library of hand-designed 2D parts (face shapes, eyes, noses, mouths,
ears, hair, beards, scars, garments, armour pieces, heraldry), layered like a character designer's work (in the
manner of layered strategy-game portraits and a detailed graphic novel), drawn as vector art, fast, deterministic, with
deep customisation, accurate ageing, lasting scars and detailed clothing as layers. Everything else D-015 and D-020 set
still holds (realism of growth, scars with small debuffs, changeable clothing, full face customisation first, demos
before building).
**Kept:** `src/people/engine/face.js` (the 39-feature face code, inheritance, distance), reused by the 2D path.
**Superseded:** the 3D render path (`anatomy.js`, `basemesh*.js`, `src/ui/engine/paint/*`, `docs/design/demo/`) moves
to `archive/c8-3d-render/` when the 2D demo replaces it; the MakeHuman base (D-022) leaves with it.

### D-025 · The 2D character plan's own calls (2026-11-12 17:27 ET)
**Chosen (by the plan, docs/design/characters.md of 2026-11-12 17:27 ET):** portraits in one three-quarter view (front
and profile dropped), one standing pose instead of six, part art authored as path data in `assets/parts/*.json` and
packed into `data/parts/`; outside image AI used for reference sheets only (auto-traced faces cannot be masters).
Gates: gate 1 a four-portrait style frame in two finishes for the owner, gate 2 a demo page and ten sheets in
`docs/design/demo-2d/`. Budgets per portrait: 1 ms (small), 4 ms (medium), 16 ms (large), 18 ms (full figure).
### D-026 · B6: how Next month and Next year work (2026-11-12 ET, the plan's reading of D-008 and D-019; refines D-014 decision 6)
**Chosen:**
1. **Two buttons, fixed places, never a stop control.** Next month (N or M) on the left, Next year (Y) beside it, on the
   top bar and in a phone's dock. The year is the main button while the player is a child, the month after. A running
   button keeps its label, disabled, with a progress bar; Esc ends a year at the end of its month. On campaign the pair
   stays Next day and Next week.
2. **Notable or routine** (`A.V2Y.classify`, from an event's definition, never from state): notable = a card that needs
   a real answer (forced, a consequence of the player's own choice, a duty or council or letter of state, a gathering, a
   deadline, a topic id such as marriage, birth, death, sickness, war, the law or an exam, a ruler's or an office's
   business, a choice that can wound, kill, jail, duel or start a war, and for a grown person a post, an oath, a holding,
   a debt or 120 suns and more), plus every battle, duel, campaign and the war room. Routine = talk, errands, play and
   the day's small happenings.
3. **Routine cards never stop a month or a year; they wait for its end** and come one at a time (a year hands back 6 at
   most and a month 3; the rest pass, counted in the digest). **D-019 says "never stop a month or a year"**; the owner's
   earlier V2_SPEC row 1 wants cards shown one at a time; waiting for the step's end keeps both. (The alternative, the
   release's "Quiet living" settling them with the safest choice, was removed in v2 and is not brought back.)
4. **A year ends early** (it does not go on after the card), with a one-line reason, for a notable card, a battle or a
   call to war, an illness or a wound, a death or a birth in the household (parents, brothers and sisters, spouse,
   children), coming of age, or Esc. A month waits at a notable card and goes on, as before.
5. **Initiative removed (D-019), implemented by lifting the pool, not by rewriting forty spend sites:**
   `A.initiativeCap` is 60, the pool is topped up each day, and what was spent becomes *load*. Load drains 4 a month;
   above 6 a body is driven too hard: weariness (35-moods' rest need, which already existed), then health, then a
   "strain" wound that mends in a year. The cost marks (⧗) and the clock's initiative are gone from the page.
   `A.freeTime`, `A.initiativeRate` and the per-activity costs stay (they are the measure of load, and old tests read them).
**Replaces:** D-014 decision 6's "or when the initiative pool is full" (D-019 already removed it); V2_SPEC row 8.

### D-027 · Two bot-life test bars follow the no-pool game (2026-11-13 00:40 ET, CI run 100 after B6)
**Why:** B6 lifted the pool of initiative (owner order D-019). The engaged test bots (`tools/bench/bot.mjs`) used to be
refused when the pool ran dry; now nothing is refused, so they act about twice as often (a 25-year bot life: 9 activities a
year before, 13-17 after). Two tests measure shares that this moves, and CI run 100 failed them on the same seeds:
- `bondsInRealLives` (55-bonds): the yearly pull of memories as a share of *all* opinion change. The bots' own deeds add
  change (121,842 to 137,823 points), so the share fell from 10.5% to 8.1% while the memories' pull itself stayed about
  the same (12.8k to 11.2k points). Bar 10% → 7%.
- `kinBotLives` (50-arcs-kin): long lives that met a kin arc fell from 7 of 12 to 5 of 12. One story arc runs at a time;
  most likely the busier bots now reach other paths' arcs first (not yet measured). Bar half → 40%.
**Not changed:** the bots themselves (the balance league holds with them as they are) and every other bar of both tests.
**Follow-up:** C6 (households and kin) looks at whether kin arcs need their own place beside the path arcs.
**Same push:** B6's cost-mark pass read `document.body.textContent` (the page's 5 MB of script text) after every draw, about
6 times slower a draw; it now walks the drawn parts only (`nyStripSkipsScripts`), and `iconsWired` expects the hourglass only
while an initiative readout is drawn.

### D-028 · X1: the release is readable source; the patch layer is baked in (2026-11-12 22:25 ET, X1; carries out D-018)
**Chosen:**
1. **The build's input is `src/core/release/`**, not `vendor/ardan-b593143.html` (which stays untouched, the original).
   The core is one file per section of the release's own order (`core/01-lore-tables.js` ... `core/23-ui-f.js`), the
   `LORE` table is `core/00-lore.json`, the 30 event packs are `content/NN-xx.js`, the lazy lore tables
   `lore/NN-key.json`, and the page (fonts, style, bootloader) `page.html`. `tools/build.mjs` joins them into the same
   three blobs the page always ran; features apply after them exactly as before.
2. **All 203 patches (393 edits) are baked in**, each marked where it landed by a comment
   `[X1 baked patch <feature> <id>] <why>` (`src/core/release/PATCHES.md` lists them all); the 58 `patches.mjs` files
   went to `archive/x1-patch-layer/`. The two edits that landed in another feature's file
   (`9991` into `62-inked-map/inkmap.core.js`) are written and commented there. The WIP `82-early-years` keeps its two
   patches, refitted to the new text.
3. **The core is de-minified by rule, the content is not.** Core: comma lists become statements, `a && b;` an `if`,
   `a ? b : c;` an if/else, `!0`/`!1` `true`/`false` (`tools/release/transform.mjs`), then prettier. Content: only the
   structure is laid out (statements, event objects, properties, one per line); **every function keeps its exact text**,
   because the game classes events by reading their functions as text (`A.evAudience`, `A.CX_RX`, `A.EV_RX`) and the
   bot and several tests do too. Reformatting an event function is allowed only with the identity probe run.
4. **Identity is proved, not assumed.** `tools/release/verify.mjs` parses the pre-X1 build and the new one and finds
   the same syntax tree (core after the rewrite rules, content as is) with all 13,132 event-pack function texts
   unchanged and the lore byte-identical; `tools/release/identity-probe.mjs` finds the same audience class for all
   5,004 events and the same fingerprint, state hash, random-stream position and journal for nine fixed-seed lives of
   ten years. Both stay as tools for any later change meant to change nothing.
5. **The rule from now on:** change the release by editing `src/core/release/` (with a comment when the reason is not
   obvious). A new system is still a feature folder. No new `patches.mjs` in the default build (the build still applies
   one, for work in flight). `--only=<feature>` now builds every default feature plus the named ones (a WIP feature
   only when named): the baked release calls into about 60 features' code (`UI.paintLog` and others, not all behind a
   guard, as the patches never needed to be), so the old "fix layer plus one feature" build no longer runs. Isolating a
   feature's effect is done by comparing two full builds instead (`--without=`, then check the page boots).
**Why:** D-018: A2 must route about 70 write sites, many inside minified code; every large step after it gets cheaper
and reviewable. X5 (stop committing `index.html`) can follow.
**Not done here (later, small):** the page's `<style>` is still one minified line; event functions in `content/` stay
minified one-liners; names inside functions stay the release's short ones.

### D-029 · Character art: tone-led, after the look of Pick Me Up's profile cards (2026-11-13 02:00 ET, the owner's verdict on 2D gate 1)
**Owner:** "Tone led. A perfect example of how I want this to look is the character profile cards from the manhwa Pick
Me Up." And on an outside image AI for reference sheets: "yes you can if you think it's necessary."
**Chosen:** gate 1's tone-led finish (form by soft painted shading and light, lines quiet), aimed at a semi-realistic
Korean-webtoon portrait as on that series' character profile cards: a half-body portrait with clean, confident
rendering, rim light and a card that carries the name, rank and words about the person.
**Limits:** the look only. No character, image, logo or card layout of that series is copied or traced; Ardan's people,
cards and frames are its own. Realism rules stay (D-015, D-020): full face customisation first, ageing, scars, clothing.
**Image AI:** used only for reference sheets that the layered parts are then drawn from; its outputs go into the repo
under `docs/design/` with the prompt and the service named. The key comes only through the secure form.
**Refines:** D-024 (2D illustrated) and D-025 (the 2D plan): gate 2 is a tone-led demo in this direction.
**Added 2026-11-13 02:10 ET (owner's reference image):** the owner sent `docs/design/reference/owner-ref-1-lineup.png`
(made with OpenAI's image model): "This holds the core concept of what I'm looking for but should obviously be tailored
to the game." So: full-body figures as well as the card; Korean-webtoon proportions and stylised faces (tall, narrow
faces, sharp jaws, half-lidded eyes); clean thin line work under soft tonal shading; restrained palette with one accent.
This supersedes "as realistic as possible" (D-015) **for the drawing style**; realism still governs ageing, scars,
builds and full face customisation. The modern dress in the image is not wanted: Ardan's dress is medieval.

### D-030 · Where the owner's new orders 27-30 go in the work order (2026-11-13 02:25 ET)
- **27 (the medieval reference)** steers C8 gate 2 now (with D-029).
- **30 (far more face and build options)** is part of C8: gate 2 shows the wider ranges; C8b/C8c build them.
- **28 (E1, the economy) and 29 (E2, weapons and unique items)** are new work items, placed before X4 (the balance pass
  must come after them). Their **design** starts now, in parallel (one design doc, Fable 5.2 at max effort, D-009), so
  the owner can see and steer it before anything is built; building waits its turn. E2 ties into C8 (each item is drawn
  on the figure), D11 (feudal armies arm their men) and E1 (smiths, markets and prices make and sell them).

### D-032 · E1/E2: the owner's answers to the design's eight choices (2026-11-13 06:21 ET)
The owner: "If you need to modify or question anything do so at your own discretion. Keep in mind what would be more
realistic but fun for a user at all times." Each answer, and how the build reads it:
1. **Markets:** "whatever most realistic" → one per settled province (281), in three sizes (city, town, village market).
2. **Goods:** "40+ and not just materials, real goods that would benefit a user" → at least 40: raw stuff (grain, wool,
   ore, timber, salt…) **and** finished goods a person buys and uses (bread, ale, cloth and clothes, boots, tools,
   candles, soap, medicine and herbs, horses and tack, carts, books and parchment, spices, wine, jewellery, arms and
   armour, …), each with a use in play (eating, health, work, standing, travel, war).
3. **Merchants:** "not just anybody can meet them and get treated the same" → access by standing. A great house answers a
   duke's summons in days, a baron's in weeks, a knight or rich burgher must go to them; a nameless commoner cannot seek
   one out (meets traffic only by chance at a market). Fame, rank, wealth, past dealings and debts move it.
4. **Income:** "only in direct correlation" → no realm-wide multiplier on pay. Your income moves only through what you
   actually make, buy and sell (your crop's price at your market, your shop's custom, your estate's rents and tolls,
   your lord's ability to pay). A bad year elsewhere reaches you only through those links, so it may or may not.
5. **Money:** "as deep as necessary to bring out realism" → the deepest option: loans with pledges, crowns that borrow
   and default and break lenders, coin a crown can thin; built last so a stage can stop if it adds no play.
6. **Grades:** "common, rare, epic, legendary, each with their own quality level" → **two separate measures**: *rarity*
   (common, rare, epic, legendary: how exceptional the piece is: its material, design, features and story) and
   *quality of make* (crude, plain, good, fine, masterwork: the smith's skill on the day). Rare material in plain hands
   can still make an epic that is not masterwork; a master smith can make a masterwork from common steel. A smith's
   skill, the material, the forge, time and the dice decide the result (the idea of craft results the owner cites
   from the manhwa *Overgeared*; the idea only, nothing of its content).
7. **Armour on the figure:** "as detailed as possible, every single element" → separate pieces: helm, gorget, pauldrons,
   rerebraces, couters, vambraces, gauntlets, breastplate and backplate or coat, faulds and tassets, cuisses, poleyns,
   greaves, sabatons, mail, padding, plus clothing layers, belts, cloak, jewellery and shield; each a layer keyed by item
   and quality (C8 draws them).
8. **Named things:** "can be destroyed but shouldn't be because of their high durability; all legendary blades of good
   quality; family heirlooms and national treasures; they overpower any form of equipment" → legendaries are always fine
   or masterwork, near-indestructible (destroyed only by extraordinary events), held as heirlooms and crown treasures.
   **Discretion used (realistic but fun):** they outclass all other gear, but skill still decides most fights (a
   legendary sword in an untrained hand loses to a veteran), and owning one draws attention: thieves, claimants and
   kings want it, and a lost treasure is a reason for quests and wars.
**Changes to the design doc:** recorded in its new section "Part 4 · The owner's answers"; the builders follow Part 4
where it differs from Parts 1-3.

### D-034 · Growth in depth: more stats, thousands of skills, hundreds of styles (owner order 32, 2026-11-13 07:18 ET)
**Owner:** "Add more stats and clearly define what they do, how to increase them, clear constraints and limitations.
Skills should be passive and active, that change how your character grows or give a stat boost or negative; there
should be 100s-1000s of skills. Fighting styles are great ways to differ between people. Each nation's military has
their own standard training for each of their regiments as well as tactics, whilst certain great families or knight
families might have their own taught fighting style; there should be hundreds of these as well, some styles weaker
than standard military and others far exceeding it. Elite orders should have their own style. There should be skills
for every route a player might go in extreme depth. Merge proficiencies into skills with different levels that can
then evolve and merge where necessary. Legendaries should also have their own unique design, far more visually
appealing than other weapons."
**Replaces:** my advice of 2026-11-13 to keep six stats (the owner chose more). Builds on what exists: the six stats,
about 40 skills, proficiencies, fighting styles with ranks (Novice..Grandmaster) and techniques (07-duels), realm and
house styles, 31-learn-by-doing, 32-legend-and-master-caps, 99993-v2-stats.
**How:** a design first (work item G, Fable 5.2 at max effort): the stat set with definitions, growth, caps and decay;
one skill system (proficiencies merged in) with levels, passive and active skills, evolutions and merges, generated
from rules plus hand-written entries so there are thousands without filler; styles by nation and regiment, house,
knightly family and elite order, ranked against each nation's standard; weapon arts; legendaries' signature arts and
their own drawn designs (C8 and E2). The owner sees it before it is built.
**Also settles:** weapon arts and legendaries' signature arts (asked on 2026-11-13): yes.

### D-035 · Gate 2 approved: code-drawn characters, refined; a Profile tab (owner order 33, 2026-11-13 07:19 ET)
**Owner:** "I am extremely impressed with the profile cards and such; there should be a whole tab for a game-like
profile and stats, titles etc. Keep on refining the character designs, but this looks amazing, especially the blonde
knight in the middle."
**Chosen:** the gate 2 library (code-drawn, `docs/design/demo-2d/gate2/`) is the way forward (option A of 2026-11-13; the
image-AI hybrid stays possible later if the owner adds a key). Ser Edric Vale's card is the bar for every figure.
**Next:** C8b moves the library into the game (portraits and figures wherever people are shown, the face and build
maker at character creation, deterministic looks for every NPC from the seed) and keeps refining (faces at full size,
hands, cloth folds, metal, line weight, a slight turn), within the draw budget (light and depth passes on large
portraits only). **Profile tab (work item P):** a game-like page of your character: the full card and figure, titles
and posts, stats, skills and styles, renown, gear and heirlooms, in words, folded detail on click. Built after B5's
declutter (same screens) with today's stats, and grown when G lands.

### D-037 · v3 is the living world; the repo's order on GitHub (owner, 2026-11-13 07:21 ET)
**Owner:** "You can reorganize the GitHub ordering of this project where you think necessary, and the big project I
just added would probably fall under a v3, right?"
**Chosen:** yes. By the version rules (CLAUDE.md: a major is a new design the owner set), orders 28-33 (the economy,
the armoury, growth in depth) are **v3**, written up in `docs/V3_SPEC.md`. **v2** stays the Nov 12 complaint list and
closes with X4 and X5 (`release/v2.5`). The character art (C8b, C8c) and the Profile tab (P) are v2 work (round 2 item
C8, and P is a page over what exists), grown in v3. v3 is designed now and built after v2's last item on a
`v3-integration` branch, versions `v3.0.0-alpha.N`. `docs/PROGRESS.md` is split into a v2 and a v3 section.
**GitHub:** `docs/BRANCHES.md` lists every branch and what it is for. 35 old working branches (`v2-fix-*`, `v2-wf-*`)
are fully inside `v2-integration`; deleting them waits for the owner's yes (the permissions rule), with each tip
recorded so any can be restored. The 9 branches with unmerged commits (`v2-lane-*`, `v2-wf-repeats`) stay until
looked through. PR #2's title and text are brought up to date.
### D-033 · B5 part 1: the open page gets the width; budgets are a ratchet (2026-11-13 ET, B5 declutter)
- **Context.** The owner's clutter complaint; CRITIQUE U2 and U3 asked for 120 words and 12 controls on a phone, 250 and 25 on a
  desktop, and for the open page to have 60% of a 1366 px screen (it had 36% after the 91 grid, 28% before).
- **Decisions.**
  1. **The story is a drawer at 1100 to 1599 px** (`src/ui/9992-story-drawer`): the grid is the rail (232 px) and the page
     (about 81%); a Story button in the top bar opens the story over the page's right edge; the Life page carries the newest two
     lines. At 1600 px and up the story is a column after the page (the page about half the window; before, the page was the
     narrow third column, 24% at 1920). 761 to 1099 px keeps 91's strip over the story. The scene card docks over the page's
     column from 1100 px.
  2. **Budgets are held by a test, as a ratchet, not as the critique's targets.** The fixed bars, rail and tab bars alone are
     about 13 controls on a phone and 27 on a desktop, so 12 and 25 for a whole screen cannot be met without removing
     navigation. The test (`b5Budget`) holds the numbers reached: desktop 270 words and 50 controls in view (230 words and 40
     controls in the page's own zone), phone 200 and 40 (150 and 30 in the page), no page over three screens. They may only
     fall.
  3. **One mechanism for "six and More".** 97's six suggested activities and "More activities" (first lives only) now serve every
     life; no second mechanism was added.
  4. **Tablet shell not done.** The 760 px phone shell is written into about 35 stylesheet blocks; moving it to coarse pointers
     up to 1024 px is its own step. A tablet keeps the desktop layout with 44 px top-bar buttons.
- **Conflicts with orders:** none. Descriptions still open on click only; no percentages; rendering stays pure.
- **Undo:** delete `src/ui/9992-story-drawer` and the "B5 (U3)" block of `look.c-layout.core.js`, then `git revert` the folds.
### D-036 · C8b: how the figure library lives in the game (2026-11-13 11:45 ET, the builder's calls where gate 2 left questions open)
**Chosen:**
1. **Place.** The gate 2 library is a v2 engine module, `src/ui/engine/figure/` (on the page as `A.V2.figure`), pure
   functions from a look to one SVG; the game's side is the feature `src/ui/93-figures`. `PORTRAIT.svg` keeps its
   name and its callers; the release source hands it over in place (D-028).
2. **The face code does not grow; a second code is added.** `p.app.g` stays the game's 23-character code (39
   features, `face.js`, D-024 "kept"). The eleven features the drawn head added and the seven measures of the build
   go in a second code of 11 characters, `p.app.g2` (gate 2's question 6). Only a face made by hand stores `g2`;
   everyone else's comes from their id, so the state grows by 23 characters a person and no more.
3. **Faces are stored at birth, not derived at draw.** A child takes after its parents' codes, and parents leave the
   state; a derived face would change the day they did. `A.genAppearance` asks `A.LOOKS.born`; older saves are filled
   on load in birth order, leaning by the appearance fields they hold. No save version is bumped (a bump would drop a
   loaded life's journal); a face has its own seeded stream, so the world's dice and every seed's world are unchanged.
   This is the exception to "engine code uses only A.rand" that the plan foresaw (characters.md §4, §12).
4. **The page holds a frame, not a figure.** Portraits are made off the press by a queue (compose, a canvas, one PNG
   kept by look) and shown through a small frame with a stand-in until ready. Reason, measured: sixty inline figures
   cost about a third of a second of the page's time at every redraw, a frame costs nothing. This is characters.md
   §12's delivery ("one image, a queue, a stand-in"), with the SVG as the drawing step in place of a canvas display
   list.
5. **Sizes.** Under 120 px a square; from 120 px two by three, cut like a profile card (to the hands and the belt)
   rather than the whole small figure, because the owner's praise was for the cards. The whole standing figure is
   `opts.figure`, for the Profile tab (P). Light and depth passes on large pictures only (gate 2's question 10).
6. **Gear by item.** One table row per item id (`GEAR_ART`): the drawn piece, its make and its rarity; an item that
   carries its own measures is drawn with them; `registerGear` adds one (E2). D-032 items 6 to 8 stand.
7. **Retired to `archive/`:** `93-anime-portraits` and `63-miniature-portraits` (D-015, D-020: "retire the two older
   renderers: yes"), last built at `f574229`. The release's paper doll stays as what a build without the feature
   draws. Gate 1's engine (`src/ui/engine/draw`, `assets/parts/`) and the 3D path (D-024) were never in the game and
   are left for a clean-up of their own, since the demo build scripts still read them.
**Refines:** D-025 (budgets: compose under 6 ms and paint within 16 ms hold for list portraits; a large portrait is
measured, made once and kept).

### D-038 · The Profile page lives first in the You place (work item P, owner order 33, D-035; 2026-11-13 ET)
- **Context.** The owner asked for "a whole tab for a game-like profile and stats, titles". V2_SPEC complaint 2 allows five places at most (Life, You, Family, World, War at war), and the phone's bottom bar already holds four to five, so a sixth place was not available without breaking a rule the owner set.
- **Chosen.** The page is the **first page of the You place** (`UI.TAB.profile`, tab key `profile`, label "Profile"; the You place is now Profile, Path, Holdings, Arms). It is the one page of the game that is about the player's person, which is what "You" already means. On a phone the old You page (the rail's sheet) stays as the second page, renamed "Glance"; its key `you` and its tests are unchanged. The feature is `src/ui/999996-profile-tab`; it adds the page to `A.V2T.groups` from outside (99992-v2-time is not edited).
- **Entry points.** The rail's "Full profile" button now opens the page (release source `23-ui-a.js`, guarded so a build without the feature keeps the overlay; 91's rail row also takes the new button). `UI.ov = { type: 'profile' }` and `UI.A.ov('profile')` still draw the old overlay: nothing was retired.
- **Layout rules.** A container query on the page (not the window) picks the layout: three columns (figure, card, sheet) from 920 px of page, two from 600, a phone stack below. The whole standing figure is `PORTRAIT.svg(p, size, { figure: true })` (D-036 item 5). Secondary detail is eight folded sections whose bodies are drawn only when opened, so a redraw costs the hero and eight header lines. The section's state is the player's, kept in the browser (`ardan_pf_v1`), never in the save.
- **Stats in words, built to grow.** The six stats are rows on a scale of seven words (poor to legendary, `A.V2S.statWord`) with the potential as an open mark; the real units (kg, m/s, ms) sit in the "Measured" section (99993's sheet, unchanged). G adds rows with `UI.PF.addStat` and sections with `UI.PF.addSection`.
- **Past posts.** The game keeps only the post held now, so a month hook records posts held and left in `pc.pf` (`{ cur, past }`; old saves start their record the next month and say "since" only for posts first seen at the start of a life). It writes no dice.
- **Budgets (D-033).** The page is held by the B5 ratchet like every page (`tools/lib/clutter.mjs` lists it): at 1366 x 768 about 186 words and 50 controls in view (the ratchet's 270 and 50), 1.02 screens; a phone 70 words, 25 controls, 1.7 screens, no sideways scroll at 420 or 360. Trait chips moved into a section so the page stays on the controls ratchet.
- **Conflicts with orders:** none. Descriptions open on click (every measure, row, skill and number is a trigger of 59-descriptions); no percentages; rendering is pure.
- **Undo:** delete `src/ui/999996-profile-tab`, restore the `.row > button[data-a="ov"]` selector in `look.d-dom.core.js` and the button in `23-ui-a.js`, drop the `profile` row of `tools/lib/clutter.mjs`.

### D-031 · A2 stage 1: one registry of posts; the Marshal's seat in peace (2026-11-13 ET, A2; carries out D-017)
**Chosen:**
1. **One registry, `A.S.posts`** (`src/nobility/999990-posts`): council seats, the polity's shire offices, army and
   division commands. Its record is the source of truth; `r.council`, `pc.office`, `o.pid`, `a.gen` and `d.cmd` are
   mirrors written by `A.POSTS.appoint` / `vacate` / `leaveAll`. The roads to a seat, every exit from the army, death,
   prison and the crown go through it (README lists them). Code not yet routed may still write a mirror; the month's
   `A.POSTS.sync` adopts the write (counted) and holds it to the same rules, so the rules hold at every month's end
   while the routing finishes (stage 2).
2. **The rules:** one holder; alive, of age for his people, free, of the realm, not a ruler (a ruler may lead an army);
   one seat a person; no seat with a shire office or a field command, except the Marshal with one army in person; one
   field command a person. On a clash found by the sync, the higher class (seat, office, command) is kept, else the
   newer post (on load: the first in a fixed order). No dice anywhere in the registry.
3. **The Marshal (D-017):** the seat is empty in peace; it is filled when the realm's war needs one (two armies in the
   field, or two enemies at once), by the crown's best General (command, renown, size of his host; no dice), who takes
   the main host in person while its general takes his old army; at peace he stands down. The player can be named
   Marshal only as a General and only for such a war, by the court, the council's offer, the ruler or the board; he
   then holds the seat, grade 9, every army and the main host; resigning the commission gives up the seat. A grade 9
   without the seat (older saves) becomes the seat when the war needs one, else High General. A General answers to the
   real Marshal, else the crown (no made-up superior above a General).
4. **Titles follow posts:** others' title line is the post they hold; a stored style naming a council seat its owner
   lacks becomes "once ..."; the coherency check `one office, one styled holder` no longer counts a past style or a
   kinsman's ("sister of Chancellor Edmund Hale"), which name no post held.
**Why:** the owner's rule and report (CRITIQUE A2, posts-map.md). The world's random stream moves (56 no longer draws
for the Marshal's seat), so every seed's world differs from alpha.2's; the balance league holds its bands.
**Not done here (stage 2+):** 9997's battalion and company slots as posts, order masters, staff, free companies, house
heads and land titles in the registry; army commands that outlive a war (`army:<realm>:<n>`); routing 9996's office
writers, `A.wsNewArmy`/`A.wsDay`, staff slots and the content events that write seats; consequences of leaving beyond
resignation at war and desertion; peace service and the posts of jobs (R12, R17).
### D-039 · Owner order 34: arts, talent, real bodies, a cleaner profile, war as a board (2026-11-13 18:37 ET)
The owner's answers replace the G design's open choices (`docs/design/growth.md` §6.5) where they differ, and add work:
1. **Arts, not styles.** "Fighting styles" become **arts**, in the murim martial world's spirit: a weapon family's arts
   (sword arts, spear arts, axe arts, bow arts, fist arts, lance arts, shield arts, dagger arts, mace and hammer arts,
   crossbow arts, polearm arts) each with a proper name, numbered forms, masters and lineages, manuals kept secret,
   orders, houses and schools that guard them. The *structure* of the genre, in Ardan's own English and medieval dress:
   no names, sects or texts of any existing work.
2. **Skill words (8):** Beginner, Intermediate, Advanced, Expert, Master, Grandmaster, Legend, Myth. The living world
   holds about 1-10 Grandmasters and at most 1 Legend at a time; Myth is for the dead and the songs.
3. **No trees; learning by doing.** A skill is born the first time it is tried: the try either teaches nothing (too bad
   to learn from) or gives Beginner. Skills rise with use, teaching and study, and at high levels merge with others.
4. **Talent:** a grade per area and per single attribute (a body gifted all over grows every physical skill and stat
   fast; one may be gifted only in speed or senses), many steps from no aptitude to one of a kind. **Chosen:** hidden at
   birth; the player learns it through what happens (a first try, a teacher's judgement, a feat) and then sees it as a
   letter grade with a number beneath, so finding your talents is part of the game.
5. **Arts in a fight:** at equal skill a top art wins about 7-3 or 8-2, and can be far more or less; top arts are harder
   to learn and worth it; nobody fights exactly alike: the same numbers, applied differently, let a standard art beat a
   great one now and then (stats stay equal; how they are used differs).
6. **House arts:** a high military house may teach its knights one art and keep another for its direct line; houses may
   have both, one or neither.
7. **Disuse:** an unused skill or art fades, rarely, slowly at first, and comes back quickly with use.
8. **Longer lives (v2, now):** a well-fed, healthy person who avoids conflict lives easily to 50-70 barring outside causes.
9. **Legendary weapons:** any wielder can use one, but they are far harder to master than ordinary arms; they are kept
   under guard; and they are far beyond any other weapon. **Replaces** D-032 §8's discretion ("skill still decides most
   fights"): the gap is large, and mastering the piece is the price.
10. **Profile page (v2, now, P2):** clean and focused. The past (posts held before, deeds, the record of a life) moves to a
    separate Records area for retracing one's steps; the sections are fewer, not crowded, opened when wanted.
11. **Phone speed (v2, now, X7):** first load and each press on a phone measured and cut.
12. **Bodies that make sense (v2, now, C9):** stat words read against the whole population of one's people (an untrained
    grown man is about average; a labourer or soldier who lifts twice his weight reads strong; a child reads as a child;
    a giant is off the chart for strength and off the other end for speed). The real-unit readouts ("66 kg, lifts
    120 kg", "reactions 170 ms") are removed (**replaces** that part of V2_SPEC's stats rule). Masters have the body or
    mind their mastery needs: NPCs are generated coherent, and training a skill trains its governing stats.
13. **War (v2):** the war score and the army templates are removed (D10/D12); war becomes a **game board**: a readable
    board of the map with pieces, fronts that burn (D-016) and tactics down to small detail, still simulated. The board's
    design is D12a.
**Branches:** the 35 merged branches could not be deleted from this session (its git connection refuses ref deletions);
the owner can delete them on GitHub, and `docs/BRANCHES.md` keeps every tip.

### D-040 · C9: bodies that make sense, a skill's baseline, longer lives (2026-11-14 ET; carries out D-039 items 8 and 12)
Owner order 34 and the owner's later word on masters ("if they don't it'll hold them back from becoming masters ... once
you get past a certain baseline it's cleanly up to you"). `src/people/999997-bodies`.
1. **The word scale is measured, not fixed.** A stat reads by its centile among the whole grown population of one's own
   people (old age included), measured at the start of eight worlds before any skill floor (6,064 people; table
   `VS.STAT_CENTILES`, re-measured by `measure.mjs`): under 2, 2-10, 10-30, **30-70 average**, 70-90, 90-98, 98-99.9,
   beyond 99.9 off the chart. A child is held to its own age and says so ("for a child of nine"). The body's four stats of
   another people are also read against men; past men's 2nd or 98th centile that is off the chart. **Replaces** the old
   ratio words (poor ... legendary) and V2_SPEC's real-unit body rows.
2. **No real units for a body** on any page or in any person's description (kg, cm, m/s, km a day, ms): words only. The
   engine (`A.V2.body`) and the tests keep their units. Lore keeps the measures of things and beasts.
3. **A skill's baseline, not a match.** Each word of a skill from Journeyman asks its first governing stat (`GD.SKILL_STAT`)
   for 0.65, 0.78, 0.88, 1.00, 1.08, 1.15 of an untrained grown body of one's people (Journeyman ... Legend; 1.00 is the
   people's middle) and its second for 0.9 of that. Below it a skill stalls and works at the top of the word the stats
   carry ("for show"); past it nothing more is asked, so any build is fair. The world's NPCs are held at least at their
   skills' baselines (and a soldier's drill and a labourer's work above the middle in Strength and Stamina); the player
   is never lifted, and training a skill trains its stats a little (5% and 3% of the gain, `A.train`'s own limits).
   **Replaces** the first C9 brief's "governing stats follow mastery".
4. **The giant's speed** potential is 18 (was 28): the typical giant is off the chart against men for strength, and at
   the other end for speed, as D-039 item 12 asks.
5. **Lifespan targets.** A healthy, fed, peaceful grown person (merchant, artisan, noble) dies of age mostly between 50
   and 75: on `A.deathChance` alone at least nine in ten reach 50, at least six in ten of those die by 75, under one in
   five passes 80 (test `bodiesLifespan`). Peasants a little earlier (×1.1, serfs ×1.2, slaves ×1.35; the well fed ×0.9),
   the prime years at 0.6 of the release's odds, and an ordinary fever or flux far less often fatal to a grown body not
   yet old (+0.25 on the survival roll). Children's odds, plague, wounds, beasts and war are unchanged.
