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
   Carries out D-042 (owner order 35); **replaces** the first C9 brief's "governing stats follow mastery".
4. **The giant's speed** potential is 18 (was 28): the typical giant is off the chart against men for strength, and at
   the other end for speed, as D-039 item 12 asks.
5. **Lifespan targets.** A healthy, fed, peaceful grown person (merchant, artisan, noble) dies of age mostly between 50
   and 75: on `A.deathChance` alone at least nine in ten reach 50, at least six in ten of those die by 75, under one in
   five passes 80 (test `bodiesLifespan`). Peasants a little earlier (×1.1, serfs ×1.2, slaves ×1.35; the well fed ×0.9),
   the prime years at 0.6 of the release's odds, and an ordinary fever or flux far less often fatal to a grown body not
   yet old (+0.25 on the survival roll). Children's odds, plague, wounds, beasts and war are unchanged.
6. **Honest odds include blunders and surges.** `A.checkOdds` returns attempt()'s own chance of success for this person
   and stakes (`A.V2S.trueChance`, exact over the noise, a blunder's depth and a surge's lift); the roll's first draw is
   `A.chance` of that number and attempt() then tells the story from the old chain's chance that gives it. What is shown
   is what happens (48's flHonest: a 3.6 shown had come up 7.5 in 100). The odds popover names the share ("Blunders and
   surges"). 75's and 81's rule tests read the old chain beneath it.
### D-042 · Baselines, then any build (owner order 35, 2026-11-13 18:54 ET)
**Replaces** D-039 item 12's "masters have the body or mind their mastery needs" and growth.md's "each word needs a
body to match": a skill's governing stats set a **baseline** for each skill word. Below it the skill cannot rise past
that word and, in use, performs as if lower ("only for show"). The baselines are modest (enough "to keep up to a small
extent"), so most grown, healthy people clear the lower words. Above the baseline nothing is forced: which stats and
skills matter is the player's choice, and every build is valid; stats past the baseline add only through how they are
applied (growth.md's "application"). The game is to hold thousands of different builds and ways to play. NPCs: a master
clears his skill's baseline, and beyond it the world keeps wide variety. Training a skill may train its governing stats
a little, never forced up to match. C9 builds the baseline for today's skills; G carries it for the new ones.
### D-041 · The Profile page is clean; the past lives in Records (work item P2, owner order 34, D-039 item 10; 2026-11-13 ET)
- **Context.** The owner: "far too much writing and clutter on that page. Remove it so that all this prior information is accessible but is kept in a different area where one doesn't need to go unless they're intentionally trying to retrace their actions. Make the main page clean and focused on the most important things. Too many different buttons... Make them selectable only when opened or use the new space... Game like character profiles with stats titles and all."
- **Chosen.**
  1. **Records is a second view of the Profile page**, not a sixth page, a new tab button or an overlay: `UI.PF.view = 'records'` while `UI.tab` stays `profile` (D-038's five places and the You place's four pages are unchanged; the phone's bottom bar is untouched). One small link, "Records ›", ends the tab row on the profile; "‹ Back to profile" is the first thing in Records. Pressing Profile in the sub-bar, the rail's Full profile button, or leaving the page puts the view back on the profile (state is in memory, never in the save). Records is one column of folded sections; the posts and deeds start open (that is the retracing), the rest folded. Everything the old page held is there: titles, posts and offices with the posts held before; skills (all) and fighting style; renown, honour, what made the name and every deed set down (12 shown); house, blazon, kin and the tree; gear, named things and heirlooms; years, health, wounds and scars, birth; the measured sheet (as C9 leaves it); traits, people, faith, tongues, looks, blood.
  2. **The eight stacked section buttons are gone from the profile.** In their place, four tabs (Skills, Gear, Family, Traits) show one small panel at a time in the freed space, the chosen one remembered in the browser (`ardan_pf_tab`). Skills shows the arts and the best five; Gear only what is carried; Family the house, its motto and up to six kin; Traits the chips. `UI.PF.addPanel` adds a tab; `addSection` now adds to Records (G's and E2's hooks keep working).
  3. **The card is the gate 2 card's heir:** a parchment ground and gilt frame, the posts held now (beyond the title line) as small rows, the about line, four measures (Faith moved to Records), a larger standing figure. A skill on the page is one control, not two; health, mood and looks are one plain line (no longer three controls); the scale legend is a note on the first heading rather than a printed sentence.
  4. **Budgets (a new, tighter ratchet for this page):** 1366 x 768: 150 words and 50 controls on the whole screen (100 and 30 in the page), one screen; phone: 110 and 35 (70 and 22), two screens at 360 (1.4 at 420); Records, all open, six screens at most; no sideways scroll at 420 or 360. Held by `pfFits` and `pfLean`. B5's page budgets (D-033) stay for every other page.
  5. **Not touched:** how stats are computed or worded (C9 owns `99993-v2-stats`; the page shows what `A.V2S` gives, including the "Measured" section, which C9 may empty or remove with the real-unit readouts).
- **Conflicts with orders:** none. Descriptions open on click; no percentages; rendering is pure; the state is the player's, not the save's.
- **Undo:** `git revert` the P2 commits; `src/ui/999996-profile-tab` returns to D-038's eight folded sections.

### D-043 · Owner order 36: combat ranks, talents at birth, arts that stay, lives without ladders, legendaries (2026-11-13 19:23 ET)
**Replaces** where they differ: D-039 items 2-4, 7 and 9; D-042's baseline sizes; growth.md §§1.4, 2.2, 2.4, 3.2, 4.
1. **Combat ranks without caps.** Beginner … Myth stay the combat words; no count limit; today no one alive stands
   above Grandmaster except the rare Legend, and none is Myth. A Legend can face four Grandmasters and live, if the body
   keeps up. `GD.LEGEND_CAP` and the "proofs and room" rules of growth.md §2.2 are dropped.
2. **Fusion by choice.** Skills never merge on their own. At high levels the player may fuse two or more into a stronger,
   tidier skill; the screen shows in plain words what is gained and lost, and warns that it cannot be undone.
3. **Talents at birth.** At creation the player picks up to seven talents and their grades; the rest are rolled hidden
   as before (D-039 item 4 for everything not picked). Talents are broad or narrow: **Physique** (all physical stats),
   or one attribute (speed, senses), or a calling (trade, command, a weapon family…), sorted into a few categories with
   subcategories so the picker stays short. Letters **F, E, D, C, B, A, S, SSS** with a number under each; SSS is near
   impossible by birth roll and only certain by the player's pick. Letters set the ceiling and the growth rate; long
   training creeps slowly past a ceiling. Balance at creation: a point budget so seven SSS talents are not free (cost
   rises steeply with the letter; worked out in G1).
4. **Art grades:** Lesser, Basic, Great, Renowned, Legendary (growth.md's Lesser/Standard/Strong/Great/Peerless and the
   "Myth" art are replaced; the lost twelfth art becomes a Legendary art).
5. **Arts stay.** A fighter uses the art he learned until he chooses to replace it; only the basic moves (slash, thrust,
   block, shove) are common to all. Higher arts are coveted; houses with secret arts hold a military edge.
6. **Combat only.** The combat ranks and arts belong to fighting. Other walks of life progress their own way, with less
   detail and no grade ladder: a merchant is measured by fame, influence and deeds (wealth above all). **No step-like
   job ladders:** rank in a career comes from performance and relations, not from a fixed rung list. The game keeps the
   paths worth playing (soldier, knight, commander, merchant, noble, ruler, priest, scholar, spy, outlaw and the like)
   and drops dull ones as goals. **Nobility in full:** gatherings, feasts and balls, courtship and romance, disputes,
   succession fights. New v3 work items L1 (lives without ladders) and N1 (noble life), designed before built.
7. **Legendaries without levels.** A mastered legendary outclasses ordinary arms outright: in a clash the lesser blade
   suffers. It must still land: speed and strength enough to slip it and close the gap make its quality irrelevant, and
   higher skill parries and deflects any blade far more easily. Replaces "about one word of skill".
8. **Baselines** rise with the skill's or art's difficulty but stay minor (D-042 stands).
9. **Pause:** after the ten legendary designs are shown, no new step starts until the owner says go (order 11 note).

### D-044 · Talents by budget, no count limit (owner order 37, 2026-11-13 19:37 ET)
**Replaces** D-043 item 3's "up to seven talents". At creation the player has a point budget. Every talent has its own
price by how much it can change a life (a broad talent such as Physique costs more than a narrow one such as Senses);
each letter above the default costs more, steeply but not wildly. Lowering a talent below the default gives points back
(a weakness chosen on purpose). No limit on how many talents are taken; the budget is the only limit. SSS stays costly
and near impossible by birth roll. Talents not touched are rolled hidden as before. Prices are set in G1 against bot
lives so no build is free power ("nothing too insane").

### D-045 · Legendaries look like the owner's example and live in the portrait (owner order 45, 2026-11-13 20:04 ET)
The owner's example (`docs/design/reference/owner-ref-3-legendary-blade.png`) sets the bar for a legendary's look:
patterned dark steel with bright edges, gold inlay, a sculpted guard around a gem, a fine grip and pommel; legend by craft,
not glow. Every legendary is drawn twice from one design: large, for its plate, and at portrait scale on the figure (held,
sheathed or slung), in the same hand and light as the character art, so it reads as part of the person. Names are
Ardan's own (the example's names are not used).
**Added 2026-11-13 20:06 ET (owner order 46):** the example blade becomes **Aldmark's signature legendary sword**, with an Aldmark
name, maker, age, keeping place, history and art. Every other legendary comes from a different realm or people of Ardan
with its own visible craft tradition (metals, motifs, shapes, ornament, construction) and its own history and keeper,
rooted in that realm's lore; no two share a look.

### D-046 · Stats, "Swordsmanship", one art at a time (owner order 48, 2026-11-13 20:52 ET); growth.md §6.5 closed
1. **17 stats or more, sorted into what can be trained and what cannot.** Trainable (by work, practice, study,
   hardship): Strength, Speed, Endurance, Reflexes, Toughness, Hands, Wits, Memory, Judgment, Cunning, Will, Nerve,
   Presence. **Not trained** (born, earned or lost, never drilled): Senses (born; age and wounds dull them), Looks
   (born; health, dress, age and scars move it), Renown (earned by deeds), Honour (kept or broken by deeds). The sheet
   shows the two kinds apart, and the training plan offers only the trainable ones.
2. **"Blades" is renamed "Swordsmanship"** wherever a player reads it (skill, talent, arts, sheet).
3. **One art at a time.** Besides the basic moves of your weapon, you fight with the one art you hold, using the forms of
   it you have learned (no loadout to pick). Replacing it is a choice (D-043 item 5). This closes growth.md §6.5's
   "ready forms" question.
4. **Arts change in a lifetime** as already ordered: an unused art fades rarely and slowly and comes back easily (order 34);
   arts are founded, kept secret, stolen and lost (orders 32, 34, 36). This closes §6.5's last question.
All of growth.md §6.5's decisions are now settled (stats here; the rest by orders 34-36 and 45-47).

### D-047 · War is a visual simulation with a close tactical view; quality over speed; Fable freely (owner order 49, 2026-11-13 21:01 ET)
1. **War** (replaces D-039 item 13's "game board"): a well-built **visual simulation** of the war, seen from above as
   fronts and armies moving on the inked map (D-016's burn), with the player able to **zoom into an engagement for a
   close, tactical view** (formations, terrain, the clash, the arts of the men in it, down to small details). Still
   no war score and no army templates; still only at the player's rank when deployed (D-010's rule). D12a designs it.
2. **Quality over speed.** No item is rushed for a date; each is finished cleanly (tests, coherency, a playtest pass)
   before the next, and the plan adjusts where needed. Small changes that also speed the work are made without asking.
3. **Models:** Fable 5.2 may be used wherever it makes the game better (design, art, the hardest systems, critique and
   playtests of feel), not only for "the big designs" (refines D-009/D-010); Opus 5.5 and Sonnet 5.5 where they serve as
   well.

### D-048 · Markets where players are, 100+ goods, balance with care, Fable for design quality (owner order 50, 2026-11-13 21:05 ET)
1. **Markets (replaces D-032 item 1's 281).** Players live in a few places at a time: their home town, their lord's seat,
   the capital, a road between, a campaign. So the economy keeps **full markets in the cities and great ports, about
   60-90** (one per city of any size, read from the map's settlements at world build), each with its stores, prices and
   merchants; **towns and villages are fed by their nearest market** and show a small stall view (a few goods, prices
   from the hub plus distance and local harvest); **fairs** add a short-lived full market in a town in season. Detail
   follows the player: the markets near them run every month in full; the far ones tick lighter. The exact count is set
   at E1a from the map and the speed budget.
2. **Goods: more than a hundred** (replaces "40 or more"), raw and finished, each with a use a person feels. Not all at
   all times: by season (fresh fish, fruit, wool after shearing), by region (salt, amber, silk, spice only where made or
   brought), by event (war raises arms and horses, famine strips grain), and rare goods by caravan or fair only.
3. **Balance with care.** Every stage is tuned against many bot lives and long world runs before it ships (the balance
   league, the coherency checks, and new economy and growth gates); a stage waits until its numbers hold.
4. **Models (refines D-047 item 3):** Fable 5.2 only where it raises design quality (art, the core designs, feel);
   otherwise the efficient plan of D-009/D-010 (Opus 5.5 for systems, Sonnet 5.5 for interface and data, Sonnet for
   playtesters).

### D-049 · The Marshal's seat is optional (owner order 51, 2026-11-13 21:19 ET; refines D-017 and A2's D-031)
The seat never has to be filled, and nothing forces it empty: a ruler may name a Marshal at any time, in war or peace
(peacetime Marshals are rare and a ruler's own choice), and may leave it empty for life. The crown's own pick in a war
that needs one (A2) stays. Aldmark's sitting Marshal in the lore (Leofric Stane) is valid, and Winter Wheat is borne by
him. **To change (A2 stage 2, after the pause):** `A.POSTS.can` refuses the Marshal's seat in peace today; it should allow
a ruler's appointment then (still only to a General or a proven better commander, D-017), and the world should seed
Marshals where the lore names them.

### D-050 · Names worth saying; ordinary arms with craft; a new bow (owner order 52, 2026-11-14 00:13 ET)
**Names.** Every legendary, every legendary art, every example art (growth.md §3.3) and the naming rules for arts and
weapons are redone so they sound like legends: evocative, short (one to three words), rooted in the realm's culture and
the weapon's character, never mundane or comic ("Winter Wheat", "The Latch", "Grandfather", "Paymaster" go), never taken
from an existing work. The owner's example sets the register: **Winter Wheat → Winter Storm, its art → Snowfall.**
Arts are named for what they do in a fight (a motion, a weather, a beast, an oath), their forms numbered and named.
**Ordinary arms** (the non-legendary weapons of every class, drawn by the figure library) get real design: proper
proportions, fittings, fullers, guards, grips and wear by make and region, so a plain sword is still a made thing.
**The bow legendary** is redesigned and much improved (a long, thin piece must still read as a legend).

### D-051 · X3: how the initiative words, the calendar and the units were settled (2026-11-14)
1. **Initiative.** D-019 lifted the pool; X3 removes what a player could still read of it. Where a cost mark stood, nothing stands
   (an activity's cost is told in time: "a few days", "a good part of a month", as the activity sheet already said); a refusal that
   named the pool says "You cannot spare the time for that today" (it cannot fire while the pool is lifted, and says something true if
   it ever does); the Activities line says weariness in words (`A.weariness`, from B6's load). `A.initiativeCap` and `S.time` stay as
   the engine's lifted pool (B6); the test `x3NoInitiativeOnPage` and `x3NoInitiativeInSource` fail if a word or a ⧗ comes back.
2. **The calendar is read from the scene, not re-authored.** GD.FESTIVALS already says each feast's month. A scene whose title or first
   words name a date or a feast gets no weight in another month (`A.X3.datedMonths`, via `A.evFit`); a pick of a feast gives this
   month's, with the dice drawn as before. Scenes queued by name (chains, scheduled promises) are not held back.
3. **Kilometres in prose.** The map, the journeys and the UI use km; the stories said miles. The stories now say kilometres
   (numbers in words scaled by 1.6, "a mile" -> "a kilometre"); `x3OneUnit` fails on a mile.
4. **Left for later in X3** (honestly open): E3/E4/E5/E7/E8 as lints over every pool, and the full 400-scene replay.

### D-052 · W0 and D10: no war score, no army templates; war screens by post (owner orders 5, 34, 49; 2026-11-14 ET)
**W0 (owner order 34, D-039 item 13, D-047: "remove war score and army templates; I no longer am a fan of the HOI4 war
system within this game").** Nothing the player sees or does shows a war score or a template any more; the new war
(D12a's visual simulation) is designed separately and is not built here.
- **The war score leaves the screen, not the engine.** `w.score` still moves with battles and occupation and still
  decides the AI's peace (`A.checkPeace`), the terms a foe accepts (`A.peaceTerms`, `A.peaceOdds`), whether "Demand
  what you hold" is offered (25), the crushing peace (90), events that move it, 09-engine-at-scale's far-war cap and 68's
  forced-surrender mark. Every place that showed it (the World's Wars view, the War tab, the War Room's Wars tab, the
  peace table, the diplomacy card, the release's campaign header, 20-ai-personality's reasons, the click-open note) now
  shows **facts** instead (`A.warFactsText`: the provinces each side holds of the other's, the great battles each won)
  or names a reason by what moves the score ("the land each side holds and the battles won"). Facts are counts of
  things, not a score in disguise.
- **Templates stay the engine's recipe for a division** (`r.forces.tpl`, `A.tplDefaults`, 56's yearly recut,
  `A.tplEdit`, 9997-companies' battalions). The player no longer designs, edits, retires or reorganises by template, and
  no longer picks an army doctrine (it sat in the Templates tab; `r.forces.doc` stays readable for old saves). The
  Manpower tab still trains a division by the realm's own kinds (Line Division, Horse Division...). The word
  "template" is gone from every player-facing text.
- Retired code: `archive/w0-war-score-and-templates/` (last commit with it: `39ee589`).

**D10 (owner order 5, docs/CRITIQUE.md D10 and W4): war screens only at your rank, when deployed, on a mission, or when
the situation allows.** 99997-v2-war already shut every war that is not yours; D10 narrows your own war to your post:
- **The War Room by post** (`A.V2W.canRoom`): the crown and the Marshal (who run the host) in peace and war; in a war
  of yours a commander (rank 7 and up, an army's general) or a captain in the field (ranks 4-6 whose division marches
  with an army, a free company under contract); never a soldier or a sergeant, whose war is his company, his orders, the
  battle at his rank and rumour. Before, any enlisted man opened it, in garrison and in peace.
- **The map within reach** (`A.V2W.scope`): a commander sees the theatre; a captain two provinces round his division; a
  soldier or sergeant the province he stands in and the next. His own division always shows.
- **Enemy numbers below a commander are estimates**: a War Room counter reads "~7k", not "7.3k".
- **No Wars mode on the map** for a life in no war; **Arms** (the War tab in peace) from 14 or on enlisting; the War
  tab lists only the elite orders the character has heard of (his realm's, his own, those of the realms in his wars,
  and the strongest, talked of everywhere); no War Room button or "Open the War Room" hint for a rank without one.
- **Held by** `v2wByPost` (14 lives: child, peasant, noble, soldier, sergeant, captain in the field and left behind,
  general, ruler, in peace and in a war of theirs).
- **Found, not fixed here:** the release's staff card (`UI.staffCard` -> `A.staffCands`) draws a year's candidates with
  `A.rand` the first time it is drawn for an officer or a ruler, so the War tab's first draw is not pure. Moving the
  draw to the month's turn changes the random stream of every officer's and ruler's life (a balance-league change),
  so it is left to its own step.
- Engine behaviour is unchanged (no draw moved, no AI rule changed), so the balance league was not re-run.

### D-053 · A2 stage 2: an optional Marshal; eleven kinds of post; every writer through the registry (2026-11-14 ET; carries out D-049, finishes D-031's "not done")
**Chosen:**
1. **The Marshal's seat is optional (D-049, owner order 51).** Nothing forces it filled or empty, and the audit no
   longer counts a Marshal in peace. The crown's own pick for a war that needs one (two armies or two enemies, D-031)
   stays, and that Marshal, named for the war, stands down at peace (the crown's choice, not a law). A ruler may name a
   Marshal by his own choice in peace or war (`A.rulerAction('appoint')`, record `own`), but only a General or a proven
   commander (D-017): an NPC who leads an army, holds a General's grade, or commands at least as well as the realm's
   best general (as well as a seasoned one, 45, when no army is raised); that Marshal keeps the seat in peace. The
   court's roll, the council's offer and the board still open the seat only for a war that needs one: they serve the
   war, and a peacetime Marshal stays the ruler's own, rare choice. The lore's sitting Marshals (Aldmark's Leofric
   Stane; Varenna, Zanara, Velgrad, Drevna) start in their seats at the first council filling, made on a stream of
   their own so the world's stream does not move. A General no longer takes the army a sitting Marshal leads in person.
2. **Seven more kinds of post** (999990-posts README has the table): a battalion's senior captain and a company's
   captain when a person holds the place (9997's slots), an elite order's Grand Master (with its division), a place on
   the player's staff, the captain of the player's free company, the head of a house, a court title. Rules: a house and
   a court title go with any post, pass by the house's or the realm's law (never left by `leaveAll`) and may be held by
   a child; one place on the staff a person and none for a councillor, a ruler or a prisoner; the staff goes with a
   field command and an office (posts-map 5.4 forbade STAFF with FIELD; not taken, because the staff's company and
   battalion captains are the very men 9997 seats); one field command a person, except that a division's commander
   leads one battalion of his own division (9997's line puts a Commander at the head of his battalion). A 9997 seed is
   not a person and holds nothing; a person leaving a slot spends its seed, so he and the slot's next captain never
   share a name (R15). A free company waits for its captain in prison. An order whose Grand Master dies gets another
   at once. Rank 5 stays a company's captain, as 9997's battle has it (R2's "Senior Captain leads 800" is D11's).
3. **Every writer goes through the registry** (README "Routed writers"). Writers that pick their own man (the crown's
   generals, 9996's offices, the staff's commanders) use `A.POSTS.place`: it refuses a man who holds a post of a higher
   class that cannot go with it, the rule the stage-1 sync applied a month later (a councillor is not made a shire
   officer or a general behind the council's back). Houses and court titles keep their own law's code
   (`A.setHead`, `A.POSTS.note`). Measured on the seed-7 60-year bot life (`long-life-audit`): the month's sync adopted
   1,626 writes before (office 1,427, army 198, division 1) and none after; the audit was empty every month.
4. **Coherency:** `one holder per post` covers the new kinds (no court title on two living people, an order's division
   led by its Grand Master); two new checks read the stores directly, `one captain per company` and `one master per
   order`.
**Why:** the owner's rule (one holder per post) and orders 5 and 51; CRITIQUE A2 (R1-R4, R6, R9, R15).
**Not done:** army commands that outlive a war (`army:<realm>:<n>`); a county's lordship without a court title stays
with 99994's audit; the posts of jobs (R12, R17); rank 5 as a battalion's captain (D11).

### D-054 · X7 part 1: phone speed at load; a worker builds the new life's continent; the clock's seed drawn ahead (2026-11-15 ET; owner order 34)
**Measured first** (`tools/bench/phone-load.mjs`, a Pixel 7 profile, CPU slowed 4x and 6x for a mid-range phone; the
reports are `tools/bench/reports/phone-before.md` and `phone-after.md`). Of the 5.6 s (full speed) to a first Life
screen, the generated continent was built twice (1.9 s: the title's seed-7 world and the new life's), the event packs'
setup took 0.8 s (0.6 s of it the fight ladder tagging every choice), the scripts' compile and unpacking about 1 s.
**Chosen:**
1. **The title's world is made without the continent** (`UI.makeTitleWorld`): the title draws no map and the creation
   screen reads only `LORE`; the life begun from it makes its own world from its own seed. Nothing a life sees changes.
2. **A Web Worker builds the new life's continent ahead** (99991-v2-map `e-ahead.core.js`). The build is pure, so the
   worker runs the game's own code from its source (`A.V2_MAKE`, `A.V2MAP.define`) and the world it returns is the
   page's to the bit (`v2mapAhead`). The page's policy gains `worker-src blob:` (a Blob made by the page's own code;
   scripts stay hash-only). The page builds whatever it does not find, as before: a refused or failed worker changes
   nothing but the wait.
3. **The clock's seed is drawn ahead.** A life begun with no seed typed takes a seed drawn from the clock when the title
   is shown (`UI.lifeSeed`, `UI.autoSeed`), not at the press of Begin: both are arbitrary moments, and only the earlier
   one lets the worker know which world to build. A typed seed is unchanged (hashed the same way) and starts its own build.
4. **Same answers, less work:** the fight ladder's beast lookup tries each list as one alternation first; the event cut
   marks each pack's own events; the ladder census weighs one realm. `tools/release/identity-probe.mjs`: IDENTICAL
   (9 lives, 10 years); the same event pool, and the same life for a given seed through the creation screen.
5. **The loader paints the title before the event packs start** (the next frame, or 100 ms on a hidden page).
**Not done:** each Next month press on a phone (1.2 to 1.5 s at 4x) is half the engine's month (the war sim's
`A.wsDay` at year 0), left to D12b/X5 as D-023 says; no CI budget for phone load (CDP throttling is wall time on a
shared runner that varies by a quarter, and a worker cannot be throttled: `phone-load.mjs` scales its time instead).

### D-055 · B5 part 2: one `UI.scope(pc)`, hidden is not refused; one goal stack (2026-11-15 ET; CRITIQUE U4, U20; carries out the owner's "one holder per post" into what a screen offers)
**Chosen:**
1. **One reader.** `UI.scope(pc)` (`src/ui/999997-scope`) is a pure function of state (age and stage, class, the posts from
   `A.POSTS.held`, the war rank and deployment from `A.V2W`, Arms from `A.V2T.armsShown`, the household) that answers four
   questions: `sees(thing)`, `page(key)`, `act(key)`, `social(target, options)`. D10's war rules stay in 99997-v2-war and
   99992-v2-time; the scope calls them (`s.war`) and does not copy them. The class gates of `A.canAct` (`GD.ACT_GATE`) and
   49-body-mind's stages stay where they are and are read through `A.canAct`; the scope adds what no gate said.
2. **Hidden is not refused.** An activity, an aim, a road or a page that no life like his is ever offered is not listed (it
   used to be a disabled line with a reason: "Enlist in Aldmark's army: Not in your position", "Govern the realm: Only a ruler
   governs", "Plan your freedom: You are free."). What is refused only today (a thin purse, "once a year") stays `A.canAct`'s and
   stays listed. The reasons that mean "never" are one list, `UI.SCOPE.HIDDEN` (it was the Life page's own).
3. **What the scope decides** (`UI.SCOPE.SEES`, `PAGES`, `ACT_RULES`, all data):
   - an infant (under three, scaled to his people) does nothing: no activities, no "See a physician", no looks line, no
     proficiency list, no "Get to know", and his card offers "Spend time together" only;
   - a minor has no crime, dice, lending, trade ventures, plots, duels or free companies; no courting, plotting or duel on a
     card; Decisions, Path (before ten), Holdings (before twelve, with no purse), Realm and Arms (before fourteen) are not in his
     places, and a page opened by hand says so in one line;
   - a dependent (a minor, or a youth under his parents' roof: to adult plus 30%) does not pick a fight with, insult, duel,
     murder or plot against a parent or grandparent; nobody picks a fight or duels with a child;
   - "Find work" is not told to a squire, a lord, a councillor or anyone with a post; a squire (a youth of class four or more)
     is no footpad; a councillor or a ruler does not throw dice; a sworn soldier or a councillor does not enrol in a school;
     a soldier below captain does not plot for a throne; none funds a trade venture while the host is in the field.
4. **One goal stack** (`src/ui/999998-goal-stack`): each system keeps its data; `UI.GOALS.stack(pc)` reads What now (its own
   scores), the ambition (61), the chapter's next aim (52) and Coming up's dated items (a promise 72/88, a custom 68/80, a
   holy day 60, a feast 20) and orders them by score, five at most. It is the Life page's one goals card (`UI.whatNowCard`,
   class `whatnow` kept so the hints and folds find it); the chapter's own card, with its choice of a third aim, stays folded
   and follows it; the Coming up strip and the ambition card are no longer drawn on their own. `UI.GOALS.source` adds a source.
**Why:** the owner's fourth complaint (clutter) and CRITIQUE U4, U20: gates written where each bug was found, so each new page
forgot them; five goal systems competing for the top of one page.
**Held by:** `scopeShape`, `scopeActs`, `scopeSixLives` (a newborn, a child of 9, a squire of 16, a File-Leader at war, a captain
in garrison, a councillor draw every page at two widths, five overlays and three cards with none of the strings each life's
data forbids; 41 leaks on the build before), `gsOneCard`, `gsSources`, `b5Tablet` (44 px time buttons, no sideways scroll at 768 and 1024 px); `b5Budget` unchanged (78 screens within budget).
**Not done:** the tablet shell (CRITIQUE U13): at 768 to 1024 px on a coarse pointer the top-bar buttons are 44 px (part 1) but
the page keeps the desktop layout, because 23 `min-width:761px` blocks and 40 `max-width:760px` blocks (and `UI.isPhone`) would all
have to move together; `U6`/`U10`/`U12`/`U17`/`U21` and the 200% text test remain as listed in H-020. The scope reads the
card's Path next step only through What now and the chapter's aim.

### D-056 · X2: named stages for the seven hot functions; a manifest orders them; the muted diplomacy path held (2026-11-15 ET; CRITIQUE P3, P10, P14)
**Chosen:**
1. **One definition, named stages.** `A.applyFx`, `A.eventView`, `A.eventChoose`, `A.newGame`, `UI.render`, `UI.refresh`
   and `UI.renderModal` keep the release's definition as their base, and features add to them with
   `A.addStage(key, name, spec)` (`src/core/01-stages`, a fix-layer feature, so it is in every build). A spec is an around
   stage `next => function (...) {...}` (it may change the arguments, call `next` conditionally or return early), or
   `{ before }` / `{ after }`. The API is `A.addStage`, `A.FN_STAGES`, `A.FN_STAGE_ORDER`: `A.stage` (49-body-mind's life
   stage) and `A.STAGES` (the battle stages) were taken.
2. **A manifest orders them** (`src/core/01-stages/manifest.core.js`, `A.FN_STAGE_ORDER`): per function, the stage names
   innermost first. It was written from the order the folder names gave, read off a booted page, and it now decides: a stage
   registered out of its place recomposes the function from the base. The names are the feature's folder name without its
   number, plus `.part` when a feature has more than one stage on a function. The release has one, `journal`
   (`A.journalStart` wraps the recorded commands at `UI.init`, outermost; it now does so through `A.addStage`).
3. **Exactly the old program.** Every wrapper (137, counting the loops over several draws, the helpers such as 97's `during`,
   999999's `counted` and 99992's `watch`, and the journal's) became an around stage with its body unchanged; where the
   captured original was also used outside the wrapper, the capture stays and the stage's parameter shadows it (the same
   function in the manifest's order). The composed function is assigned back to its owner, so `A.applyFx` stays a plain
   function (no extra call), reading it mid-load gives the stages so far, and in the default build every stage registers
   in manifest order and wraps the one before, each made once in load order. A stage on a function that is not staged
   (`UI.refreshTab`, `A.deserialize`, ...) wraps it in place, in load order, as a wrapper did. Proven by
   `tools/release/identity-probe.mjs` before/after: IDENTICAL (5004 event classes, nine fixed-seed lives). `verify.mjs`
   cannot judge two built pages' cores (it reports DIFFERENT for a build against itself: its de-minifying rewrite is for
   the vendor file); it finds the content, lore and page the same.
4. **Held by** `tools/lint-stages.mjs` (in `tools/check.mjs`): a staged function assigned anywhere but its release
   definition (direct, in a loop over a list naming it, in `Object.assign`), a stage name missing from the manifest, not
   starting with its feature's name or used twice, a manifest name nobody registers; and the census of P3, names defined
   more than once, held by `tests/stages-baseline.json` (may only fall): **364 before, 357 after**; definitions 2,487 to
   2,358. At run time a missing name, a duplicate and a reassignment are `console.error` (the net fails them);
   `stagesOneDefinition` and `stagesApi` test the runner.
5. **The muted diplomacy path is held, not removed** (P10). The release's `A.diploAI` still runs for the lesser pacts; the
   five dice v2 decides in its place (`aiBreakAlly`, `aiAllyBar`, `aiBetrayP`, `aiRivalW`, `aiMendRival`) and the turn's
   `A.aiWarCheck` answer fixed values while v2 is on. They are one named list, `A.V2DIP.MUTED`, counted as asked
   (`A.V2DIP.muted`, not saved), and `v2DipMutedPath` holds it: each muted die is still called by the release's AI (else it
   leaves the list), the turn still asks `aiWarCheck`, and over 20 years nothing is decided inside the release's AI (no
   alliance formed or broken, no rivalry named or buried, no war).
**Considered:** before/after constraints on each stage instead of a manifest (the order would still be implicit wherever no
constraint is written, and a constraint naming a feature left out by `--without` needs a rule of its own); a runner that
composes on every call (an extra frame on the hottest functions, and captured references would change meaning); rewriting
the simple wrappers as `before`/`after` stages now (more legible, but 137 rewrites of behaviour that is proven identical only
as it stands; new stages should use them); removing the muted path (the muted `A.chance(0.08 * 0)` and `A.chance(0)` still
draw from the random stream, so removing them changes every fixed-seed world: a step of its own, with a new baseline).
**Why:** the owner's engineering complaint (P3): `A.applyFx` had 32 definitions and `A.newGame` 22, C6 and X3 were about to
add more, and a function did whatever the folder order added up to (P14).
**Not done:** the rest of the 357 names defined more than once (`A.deserialize` 13, `UI.refreshTab` 13, `UI.TAB.realm` 11,
`UI.eventModal` 10, ...) are still wrappers; staging one is adding it to the manifest and converting its wrappers the same
way, and the baseline then falls. Load order for everything else is still folder order (P14 is done for the seven only);
features still find each other through optional globals.

### D-057 · C6: the tree knows your kin, relationships know whom you have met; one resolver for a house; nine months (2026-11-15 ET; owner order 7; CRITIQUE F1-F10, P9)
**Chosen** (design: `docs/design/households.md`; code `src/family/999991-households`):
1. **Two stores.** The family tree (`parents`, `children`, `spouse`) keeps every relative the world knows of; `pc.rel` keeps
   the people the player has met. 99994's three generations stay in the tree (its tests and the kin arcs read the tree), but
   are no longer linked at birth. At birth the player knows the parents, the living siblings and a grandparent only under the
   same roof (from the family's seed, at most two); a noble or royal child of a house adds a nurse, a maid and a guard knight,
   and a tutor at six. Commoner at most 8, noble at most 12, no uncle, aunt, cousin or in-law. The release's linking of a
   lesser house's members as "uncle" and "cousin" outside the graph (F4) is gone with it.
2. **How you met** is on every new entry: `met: { y, at, by }`, written by `A.link` itself (the one place every link goes
   through), from `A.MEET.as(why)`, the event being played, or the link's type. Old entries keep no `met` (gentle: the view
   reads `since`).
3. **No kin minted.** A kin helper takes a relative from the tree, meeting them then, or the card drops (its setup throws,
   which the engine already treats as a skip). Release event functions edited for this (pack 15 `known` and three setups,
   pack 11 `kinPid` and two claims, pack 8 `ct_bastard_claim`, 40-memory-peoples) keep their audience classes
   (`identity-probe`: classes IDENTICAL; lives differ, as every C6 change moves the stream). A claimed cousin who is an
   impostor or a stranger is an acquaintance, not a cousin. Kin met later come by a yearly family gathering (a log line,
   never a card: owner order 17) and by scenes.
4. **One resolver** `A.HOUSE.resolve(hid)` for a house's head and heir, read by the release's `A.kill` and `A.houseHead`,
   99994's `F.inherit` and `F.headOf`; every write still goes through `A.setHead`, so the `house:` posts of `A.POSTS` stay
   the one record (A2).
5. **A parish of seeds.** Each home province has about twenty named commoners derived from the seed and the province; nothing
   is stored until one is met (`A.S.parish`). A commoner's acquaintances at home come from it first.
6. **Nine months.** `A.familyYear` no longer gives birth on New Year's day: it sets a conception day in the year and the birth
   comes 270 days later (`A.S.pregs`). The release's draws for whether a child comes are unchanged; the day is drawn on the
   family's own stream.
**Considered:** pruning `pc.rel` after the family is made, instead of not linking (kept only for the release's own links
in `A.newGame`, which a stage cannot reach without editing the release; the stage removes them with their back links);
cards for a kin meeting (owner order 17 says talk waits); full people for the parish (P9: named people only pile up).
**Not done:** the People page's Household block with faces, the tree drawn centred on you and the person card's new order
(F8 to F10, interface work for B5's successors); "Make a friend" as "Spend time with" (F6) beyond the parish's faces.
