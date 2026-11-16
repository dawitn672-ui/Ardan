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

### D-057 · C6: the tree knows your kin, relationships know whom you have met; one resolver for a house; nine months (2026-11-15 ET; owner order 7; CRITIQUE F1-F7, P9)
**Chosen** (design: `docs/design/households.md`; code `src/family/999991-households`, README there):
1. **Two stores.** The family tree (`parents`, `children`, `spouse`) keeps every relative the world knows of; `pc.rel` keeps
   the people the player has met. 99994's three generations stay in the tree (its tests and the kin arcs read the tree), but
   are not linked at birth: the `A.newGame` stage `households` (after 99994 and 99995) keeps the household and removes the
   other kin entries with their back links. At birth the player knows the parents, the living siblings and a grandparent only
   under the same roof (from the family's seed: the father's widowed parent 6 in 10, both his parents 3 in 10, else the
   mother's widowed parent 4 in 10; at most two); a noble or royal child of a house adds a wet nurse, a maid and a knight of
   the household guard, and a tutor at six (commoners and a gentry knight, `rel.type` "servant" with `rel.hh` for the word).
   Measured over 42 births: commoners at most 5, nobles at most 8 (caps 8 and 12); no uncle, aunt, cousin or in-law. The
   release's linking of a lesser house's members as "uncle" and "cousin" outside the graph (F4) goes with it. The people
   sweep (`A.gcPeople`) keeps the player's tree to four steps, met or not (the relationships no longer protect it), and drops a
   child who is gone from its parents' lists (the coherency check "family links agree" rose to 27 in the quick run without it).
2. **How you met** is on every new entry: `met: { y, at, by }`, written by `A.link` itself (the one place nearly every link
   goes through), from `A.MEET.as(why)`, the event being played (stages on `A.eventView`/`A.eventChoose`), or the link's
   type; the three direct writers (`A.marry`, 9999's ring, 999990's grudge) stamp it too. Old entries keep no `met` (gentle:
   the person view reads "Known since"). Kin not yet met come by a yearly family gathering (a log line, never a card: owner
   order 17), and by scenes; an older start has had its years of gatherings.
3. **No kin minted.** `A.KIN.take` gives a relative from the tree (met then) or throws an error marked `noKin`, which drops
   the card (A.eventView already skips a throwing setup; it now marks `ctx.noKin`, and the event tests read that drop as by
   design). Edited: pack 15 `known` (and the twin, the grandchild, the knifed cousin, the in-laws through `A.KIN.spouseKin`,
   the grandmother's name, the poor cousin), pack 11 `kinPid` (with `strangerPid` for the claimants), pack 10's `prepF`
   (uncle, aunt and cousin by `A.KIN.nameOf`: none leaves the token unfilled and only scenes that name them drop), packs 4,
   7, 8, 13, 14, the `newRel` effect with a kin word (one of the tree not yet met, or nobody), 50-arcs-kin (no uncle, aunt,
   cousin or son made: `AK.sibOf` answers null), 40-memory-peoples, -realm-blood, -regional-a. A **story's secret** (the
   deathbed's half-brother, the brother sold to the galleys, the child you never knew, your father's other family) is
   written into the tree and flagged `c6revealed`; a **claimant the player recognises** joins the tree as the bastard of a
   real man of the family (`A.KIN.recognize`, flagged `c6recognized`); an impostor accepted is a friend. A last guard in
   `A.link` and `applyFx`'s `them.type` turns a kin word for someone outside the tree into "acquaint" and counts it
   (`A.KIN.strays`). Held by `tools/lint-kin.mjs` (in `tools/check.mjs`) and `c6NoKinMinted`: 12 worlds × 30 years, no stray,
   no blood relative created after the start but by a birth (one secret a story told). Every event keeps its audience
   class (`identity-probe`: 5004 events, 0 differ; lives differ, as every C6 change moves the stream).
4. **One resolver** `A.HOUSE` (in 99994's `c-succession.core.js`, where the law lives): `resolve(hid)` gives head, heir and
   law; `settle(hid)` gives a house whose head died its court lord, else the dead head's successor by law, through
   `A.setHead`, so the `house:` posts of `A.POSTS` stay the one record (A2). The release's `A.kill` no longer picks an
   eldest son when it is on the page (99994's `F.inherit`, the one mover, asks `A.HOUSE.successor`); `A.houseHead`,
   99995's court and `F.headOf` read it. `c6HouseResolver`: record, registry and resolver agree on every head over five
   years in three worlds; nine deaths passed to the named heir.
5. **A parish of seeds.** Each province has 31 seeds (priest, reeve, miller, smith, alewife, midwife, shepherd, twelve
   neighbours, twelve children born every other year around the world's first) derived from the world's seed and the
   province; only the ids of those met are stored (`A.S.parish.met`). The person is made on a stream of its own, the same
   in every world from the seed. `A.makeAcquaintance` asks the parish first for a commoner at home.
6. **Nine months.** `A.familyYear` keeps its draws for whether a child comes and calls `A.conceive` where it gave birth: a
   conception on a day of the year, the birth 262 to 280 days later (`A.S.pregs`), drawn on the family's own stream; "Your
   wife is with child" on the day. lf_childbed ("The birth") fires only in a pregnancy's last weeks and is then the birth (its
   child now has parents). Measured: births in six different months in four marriages over 12 years.
**Considered:** not linking the extended kin at all in 99994 and the release (the release's own links in `A.newGame` sit
inside its definition; a stage that prunes after is one place and leaves 99994's tree tests as they were); cards for a kin
meeting (owner order 17 says talk waits); full people for the parish (P9: named people only pile up); dropping the
secret-kin stories (a revealed half-brother is a story's premise, not a contradiction; they are flagged and counted apart).
**Not done:** the People page's Household block with faces, the tree centred on you with connectors and the person card's
new order (F8 to F10, interface work); "Make a friend" as "Spend time with" (F6) beyond the parish's faces; a target of
named people per realm (P9's other half, X5).

### D-058 · C7: names are data, flavour is a weighting, people come from the neighbour; the realm names are in the source (2026-11-15 ET; D-013; owner rules 9 and 11, order 18; CRITIQUE N1-N5, N11, N12, P6)
**Chosen** (design: `docs/design/names-and-cultures.md`; code `src/world/999981-names-and-cultures`, `src/world/engine/names.js`, `data/names.json`):
1. **One common English pool, nine others.** `data/names.json` (built by `tools/c7/build-names-data.mjs` from
   `docs/research/c7-name-data.json`): 1,979 male and 1,841 female given names, 4,083 family names and 1,275 places in the common
   pool, which names 13 cultures; the Wind Riders, the desert and southern peoples, the two elf, two orc, the dwarf and the giant
   cultures draw from pools of their own. No given name is in two peoples' pools and a name keeps one sex (N11, N12; the two elf
   pools and the two orc ones, one people each, may share). The names of the old realms that are also English words
   ("Highland") stay out of the pools. **Replaces** the 24 culture lists of `LORE.cultures` as the source of new names (they stay
   as the fallback of a build without the feature, and for epithets) and the v2 engine's four syllable sets
   (`archive/c7-syllable-names/`).
2. **Flavour is a weighting, not a language** (D-013). A culture sees a hashed 60% of the common pool, a realm 80% of that, a
   *lean* of twelve plain names per sex (11 realms that share a pool: Aldmark English, Northreach Norse, Greyhaven German,
   Ashmere Welsh, Brannoch Scots, Solenne French, Varenna Italian, Lucerna, Morhaven Spanish, Ostra Dutch, Tessaria Greek) is
   tried first 28 times in 100 and a culture's *accent* 12 in 100. The hash is FNV-1a over `name|id`: no stored lists, the same on
   every machine, the same from the seed. The engine's namer is pure; `A.NAMES` draws through `A.rand`.
3. **People come from the neighbour and from trade** (N1). A person made for a province (the parish's people; households' staff
   keep the player's own culture) is drawn with `A.NAMES.originOf`: in a border province 22 to 38 in 100 come from the neighbour
   across it, in a port or market town inland 17 to 33 from the realm's trade partners (named in its lore's imports and exports,
   allies, neighbours); a port on a border draws 22 to 33 from the neighbours, who are partners too. The person keeps `org` and
   takes that realm's culture and names. A parish's people are of their realm, no longer "made like the player" (which made
   76 of 76 named people in Aldmark Northfolk). Census (`nmCensus`, 35 realms, 1,000 draws a province): 69 ports and market
   towns draw 17-35% (mean 27%) from trade partners, 185 border provinces 20-40% (mean 30%) from the neighbour.
4. **No twins** (N4). `A.NAMES.settle` (every month, and once when a game begins, after the tree is made): no full name twice
   among the living of a town; no given name twice among brothers, sisters and first cousins (the dead of the tree count). The
   later one is renamed from their own view, avoiding the kin (a child's patronymic follows); never the player, a lore figure
   or house member (`castId`, `famRole`), a ruler or an heir. A child is named avoiding its kin at birth, so the pass rarely
   has work. 12 worlds × 30 years: none left (the build before: 21 twins in a town in 3 worlds).
5. **Fiefs** (N3). `A.V2N.v2culture` hands the nobility engine the realm's culture id; a fief's place and its holder's name come
   from that people's pool, never empty (a lore house with no head yet gives the head the lore wrote).
6. **The realm names are in the source; the renaming hack is deleted** (P6). The eight Nov 5 names are written into the lore and
   every string of the source by `tools/c7/rename-realms.mjs` (906 strings, 48 files; the hack's own rules, run once). Of the
   eight, four now fit their governments (N5): **Khanate of Ulun**, **League of Brannoch**, **Free Port of Corvasse**, **Ughrak
   Clans**; Sultanate of Ambrel, Kesh, Sahrim Confederacy and Horde of Gorath stay. The capital Blackreef is Corvasse. The
   hack (`99999-v2-names`: the setters of `innerHTML`, `textContent`, `title`, `setAttribute`, the canvas's `fillText`, and about
   twenty rules) is in `archive/c7-realm-renaming-hack/`, last built at `b87c908`. `nmOldNames` reads every script, the lore,
   every event and a new game for any old name (the data's own "Highland" place and the migration's table, written in pieces,
   included): none.
7. **Old saves** (decided here): a save from before C7 loads and keeps every person's name and the prose of its log and news;
   only the eight realms' own names (and shorts) are renamed by id on load (`A.NAMES.renameState`, a `V2SAVE` step and after
   every `A.deserialize`), and only when they still hold an old name (a realm the life renamed is left). A save has no `nmv` flag, so the
   twin pass marks everyone in it as settled and works only on people made after the load. No format bump.
**Conflicts recorded:** (a) D-013 says one language; the owner's order 18 asks for far more names: the common pool is large, flavour
is a weighting. (b) `A.givenName` is wrapped by 97-first-life-fixes (the player's kin); it still runs, in front of the new
draw. (c) Rendering is pure: `A.NAMES.sees` gives the lists for a pick by hash (`A.oobLeader`). (d) The same seed now makes
different people than before C7 (the draws changed): worlds are deterministic, not identical to earlier builds'.
**Not done:** the lore's authored people keep their names (the cast, the houses' members, e.g. "Teodoro Lantieri"); N6 (the
noble ladder against the lore), N7's Marchfolk, N9 (town scale), N10 (a Chaplain of the Horde), the realm pairs that share a word
(-haven, -deep, -hold), M4's climate bands; the player-facing mixing of dress and faith by origin (C8c).

### D-060 · C8c: dress is by station, people, occasion and place; only a livery is shared; every event has a scene tag; the player changes outfits (2026-11-15 16:30 ET; D-029, D-035, D-045, D-050, D-058; CRITIQUE V2, V7, V9, V13, V16, V17)
**Chosen** (code `src/ui/engine/figure/wardrobe.js`, `cultures.js`, `gear.js`; `src/ui/93-figures`; `src/events/26-scene-tags`; sheets and the
blind readings `docs/design/demo-2d/c8c/`):
1. **One wardrobe, seven inputs.** A person is dressed from their estate, their people (C7's cultures, D-058), the occasion, the
   place, their trade, their post and whose colours they wear. Each estate keeps its own marks in every cut: rope, patches and torn
   sleeves (serf); dyed wool and a leather belt (countryman); the apron and the tool (craft); a long gown, a hat, purse and keys
   (merchant); habit, cord and sun, a stole by rank (clergy); a quilted coat, mail, the realm's coat and a helm (soldier); gold
   trim, a jewel by rank, fur and a cloak, or a harness under their own arms (the high-born); the crown.
2. **Four cuts by people** (`cultures.js`, the table that was 93-figures' and drew only a hat and a dye): tunic, robe, kaftan,
   drape, with each people's headwear, dyes and habits. A dye costs what it costs: nobody wears above their purse.
3. **Only a livery is shared** (V9). Soldiers wear their realm's coat (one pattern a realm); a lord's guard knight and maid wear
   his house's colours and device. Everyone else's clothes are their own (their own two dyes a little off the vat's, a variant
   of the cut, a fit of their own), and a noble house is no longer all in the house's colour (it is in the lining, the cloak
   or the trim). A knight in harness still wears his own arms: the gate 2 figure (D-035) is unchanged.
4. **A soldier's bust shows that he is one** (V7): the quilted collar, the mail collar and the issued helm are above the breast;
   the player's face is never under a helm; a captain is bare-headed in the sash of command.
5. **Hoods are for the road** (V13): raised only out of doors, never in a list, never under a roof.
6. **Occasions and scene tags** (V16, V17). Six occasions (day, best, work, travel, arms, mourning). Every event has a scene tag
   (18 scenes; its own `scene:` line, else read from its words, shape and audience); the print follows the tag and the people
   on the card are dressed for it. The tag is for pictures only: `A.evShape` still guards the roll.
7. **Changeable outfits.** The player picks an occasion and a dye of their station in the Profile's Gear panel; `dress: { w, d }`
   on the person, absent in older saves ("as the day asks"); journalled (`A.setDress`). It changes the picture and nothing else.
**Measured.** Blind reading of the 8 x 4 sheet by fresh Sonnet readers, six readings: 94, 81, 88, 72, 78, 84 in 100 (83 over
all; 81 on the final wardrobe). **The critique's 85 is not held on the final sheet.** Royal, clergy, artisan, noble and soldier
are read 116 times in 120; serf, peasant and merchant 43 in 72, and two readers of one image differ by up to 16 points. By rule
in CI (`fgDressStations`) 191 of 192. Scene tags against a hand-labelled held-out sample: 49 of 59 (83 in 100); the print matches
its tag on every card of a 60-card sample (`stPictures`). No two of 400 adults outside a livery dressed alike in three worlds;
0 raised hoods in lists and indoors; compose 2.3 to 2.9 ms a list portrait (budget 6), as before.
**Conflicts recorded:** (a) The critique asks for about 60 compositions; there are 27 prints (two new: the fields, a market). (b)
The Dress control sits in the Gear panel, not on the card: the card is at B5's count of controls (`pfFits`, 50). (c) The figure
library's streams hash an id with FNV-1a, which takes some pairs of ids for one (two people then stood and dressed as twins); the
wardrobe keys its dice by the id and a second hash, and the faces are untouched (they come from stored codes). (d) The same seed
gives the same world and the same faces as before, and different clothes: dress is drawn, never rolled or stored (but for the
player's choice). (e) Dress has no effect on play yet; whether court dress, mourning or livery should count is the owner's to say
(`docs/IDEAS.md`).
**Not done:** the serf, peasant and merchant boundary (above); interiors by class and framing by biome (V19); a tone per kind of
cut-in (V11, V12, with C8a); the memorial plate, the book face and the four icons (V22); stored jewellery and war paint
(`app.jewel`, `app.paint`); mounts; no event has its own `scene:` line yet; NPCs do not change their own dress but by scene;
mourning is not put on by the game after a death.

### D-059 · X3 part 2: a card is held to the life it is dealt to; a fatal illness has a scene (2026-11-15 ET; D-051's "left for later"; CRITIQUE E2, E3, E4, E5, E7, E8, T4)
**Chosen** (code `src/events/99999-x3-honest-cards` c to g, `tests/suites/x3b.test.mjs`, `tools/lint-cards.mjs`, `tools/lib/card-lint.mjs`):
1. **One last look at the card** (`f-guard.core.js`, an `A.eventView` stage named `x3-honest-cards`, outermost but for the journal): the finished
   card is skipped, as a card with an unfilled token is (`viewSkip`), when it breaks a station rule, names the home town while the player
   stands elsewhere, or is dealt to a child under six whose scene's own condition says no (a `trigger: true` world event skips its condition
   when queued: "Tend the neighbours yourself" at three). It also takes an absent voice off the counsel. The guard is the net; the
   weight (`A.evFit`) keeps most of these scenes from being dealt at all (12 worlds x 30 years: of ~2,800 cards the guard dropped
   a handful), so the draw is not wasted.
2. **Station words** (E4; `d-station.core.js`). Only words that *address the player* by a station are gated ("your men", "my lord," as
   an address, "Master <you>", "Captain <you>", "your journeyman", "you are a journeyman"); other people's titles are not. Each rule has a
   gate over what the code already knows (a noble's rung as 08-ct reads it, `pc.mil.rank`, the company, a post from `UI.scope`, the
   job's rank). A scene whose own text uses a rule gets no weight for a life that fails it. **Conflict recorded:** a noble of rung 2 or
   more commands men and holds land in the release's own conditions (`ct_boundary`), so those words are held for him, not only for a
   knight; the lint (`tools/lint-cards.mjs`) counts the scenes whose condition still admits a life without the station, against
   `tests/cards-baseline.json` (may only fall).
3. **Place** (E5; `e-place.core.js`). `A.X3.whereIs`: the road, else the division's ground, else the home. A scene set in the home town
   ({home}, or the code reads `p.home`, and not news from home) is not dealt while he is away; "Isabella of Aurora" is a name, not a
   place. A soldier posted a province away is away: his old town's market is not where he stands. Decided: a scene is dropped, not
   re-pointed at where he is, because "Smoke over {home}" is news of a place he left.
4. **Counsel** (E7). `A.X3.present`: alive, free, and on the same ground; a prisoner is with prisoners. The advisors' ring is who
   he trusts, not who is in the room; the card's voices are cut to who is, and the ring itself (`ADV.candidates`) seats only people who
   are there (a ruler's council stands at the capital). **Conflict recorded:** the advisors' README promised counsel on every big
   choice and `advLives` held it to 80% with 3 advisors a life, from lives that stayed under one roof; a soldier far from home now hears
   no father, so the bars are 60% and 2.5 (measured 66%, 2.8).
5. **Pronouns** (E8; `tools/lib/card-lint.mjs`). A scene says "he" or "she" in plain words of its `{them}` only where the sex is
   known: tokens (`{theyHe}`, `{theirHis}`, `{themHim}`) elsewhere. 22 scenes were mended; 20 findings of the lint are not slips and are
   listed with a reason (`PRONOUN_ALLOW`); a named figure of the lore (`"CHR-0256"`) has the sex the story gave her. `x3Pronouns` also
   checks the mended scenes are given their person when drawn.
6. **The preview replay** (E2). Over 400 replayed scenes (eight lives, scene k takes choice k mod n), each choice's preview, as
   `A.STAKES.read` reads it, is what the choice did. It found three lies: "▲ piety" for a man with no faith (the engine gives him a
   pull, not piety), "Costs 4 suns" when a physician also took three in a hundred of the purse (2,380 suns from a rich man), and
   "+150 suns" for "Give it all up and go", which also took the house (`arLose`). Each is said or left off now. **Not previewed, and the
   replay does not claim them:** what a story's own next step pays (`fx.arc`), a marriage written into the register (`fx.akin`), a
   skill's knack (`every-number-counts` rides), a treatment's course; a child's purse is the family's.
7. **A fatal illness is an arc** (T4; `g-illness`). onset (`bm_ill`, as before) -> worsening (once, when the body is under a third:
   `x3_ill_worse`: physician now, priest, or tell no one) -> the turn of the fever (once, when a month's toll would take the body to
   nothing: `x3_ill_crisis`: the physician, the priest or the family at the bed, each a check on body and will with a different
   price) -> the fever breaks or he dies of it, named. The engine's silent mortal roll no longer decides it. Adults only: a child's
   sickness is the house's, as before. The hook is one call at the end of `A.bmIllMonth` (`A.X3.illAfter`), not a wrapper.
**Not done:** the place of a *mission* abroad (a mission is not a card; the road and the division are); station words in the
text a feature builds at run time are caught only by the last look; counsel written into a scene's own text ("your steward
advises"); the E9 line of filler beyond part 1's quiet lines.

**D-059 addendum (CI 127, `advLives`):** present-only counsel starved a conscripted peasant (his parents stay at home while his division stands
elsewhere: 0 advisors). Now `A.X3.reaches` seats, and the card keeps, people who are there (`present`) and the household he left (parents,
wife, children, brothers and sisters, alive and free), who answer by letter ("A letter from home: ..."). A brother in prison and a friend across
the realm still advise no one. `advLives` measures 74% and 3.3 advisors a life (peasant 2) against its 60% and 2.5 bars; the illness scene's
family at the bed still needs `present`.

### D-062 · Order 54: nothing without reason; the owner's war answers; no Marshal; the playtest round (2026-11-15 21:13 ET)
**The rule.** "Not a single thing in this world should happen outside of reason." Written, highlighted, at the top of
CLAUDE.md's standing rules and as game rule 18. Every system that decides (AI rulers, nobles, factions, commanders,
NPC moves, courts, juries) must carry a reason it can name: a want, a fear, a grudge, a calculation, an emotion, a debt,
a chance roll *weighted by* those. A random draw is allowed only as the dice within reasons, never instead of them.
**The Marshal question** is answered by the rule, not by (a) or (b): a figure's wants follow his own post, circumstances
and personality. **And the Marshal is removed (answer 10):** General is the highest rank of an army; several Generals
by the army's size; nobles keep their own commands and armies under them, serving the king in a hierarchy that can
breed regional disputes. This supersedes D-017, D-031's Marshal parts, D-049 and A2's Marshal seat; old saves map a
Marshal to the realm's senior General.
**The ten war answers** (docs/design/war.md) are recorded in order 54 and fold into D12a's design (revised as D12a-2)
before D11 and D12b: sight by who you are; stops for anything involving you; stand by rank, role and delegation, with
requests; **no levies, conscription when needed, armies of honour and volunteers**; wars end in surrender or defeat,
moved by personality and emotion; a full report system by rank, relationship and importance; people known by situation;
everything in world history and saves.
**The playtest round (P3), fixed in the game:** (a) "Start a new life" after a save; (b) ambitions, chapters and the
decisions that hand the player goals are retired to archive/ (free will: everything available, nothing handed); (c)
crimes against a ruler have reasoned consequences (attempts are discovered, punished, remembered; forgiveness follows the
ruler's opinion, personality and the crime, never automatic; a murdered monarch is dead and succession runs); (d) a
soldier meets his first mission within months, by reason (his unit's war, his post); (e) army training tailored to each
unit's make-up and tendencies, and the military path chosen by weapon, way of fighting and every useful aptitude
(command, logistics, seamanship...) — with D11; (f) a step stops only for what matters and, once the cards are answered,
**carries on to complete the month or year**; (g) growth made non-linear, researched (with G); (h) hair and (i) dress
variety compounded, appearance matters in play where it fits (C8d); legendary names made mythical, the bow redrawn.
**Nothing is low on the list.** Every known gap (CRITIQUE leftovers, H-entries' "left open", D-058's grammar) is a
tracked item. **Permissions granted:** merge PR #2 (v2-integration) when CI is green; branch deletion is the owner's on
GitHub (the session cannot delete refs), helped by a script.

### D-063 · T1: the push check is the quick tier; the long bot-life tier is nightly and before a version (2026-11-16)
**Decision.** Tests are split in two by a list, `tests/long-tests.json` (threshold 200 s on CI, kept honest by
`tests/run.mjs --check-tiers` in `tools/check.mjs`). Every push and pull request runs the quick tier over 8 shards balanced by measured
time; the long tier runs in `long.yml` nightly, on demand, on `[full ci]` commits, on `release/*`, and a version is not cut
until both are green. **Why.** 42 tests are over half the CPU time and made a run 35 to 45 minutes; a push now gets its answer in
about 15 minutes with setup. **Nothing loses coverage:** every test still runs at least nightly, on the same index.html; the cost is
that a regression only the long tier sees is found up to a day later (or at once with `[full ci]`), so a change to bots, arcs, war or
saves should say `[full ci]`. **Rejected:** dropping or shortening the long tests (they are the only whole-life guard); a
count split (what was there). **Left open:** moving `balance` to the long tier (not measured); the long run commits no times itself (an artifact).

**Addendum (2026-11-16 03:40 ET, CI 131, the first run of both tiers, both green).** Measured: the quick shards took 9 to 19
minutes of tests, the long tier 26 minutes, but the `balance` job took 37 minutes and held every push's answer to 38. It
moves to `long.yml` (nightly, `[full ci]`, `release/*`, before a version), which D-063 had left open. Every shard's measured
time was merged into `tests/test-times.json` (852 timed, none planned blind); 12 tests had crossed 200 s and joined the long
list (54 now). Plan: quick 798 tests, about 11 minutes a shard; long 54, about 22. The wait for runners on CI 131 (12 to 20
minutes) came from both tiers starting at once on a `[full ci]` push; a plain push starts 11 jobs and should not queue.

### D-064 · D12a-2: the war design revised with the owner's ten answers; the gaps filled (2026-11-15 21:35 ET; order 54, D-062; revises D12a; steers W1, D11, D12b)
`docs/design/war.md` keeps D12a's theatre, field, press and one engine (part one) and adds part two (§9 to §16). The
owner's answers are followed as given (§7 sets each beside its question). Where they left room, these were chosen, as
he would from his prior decisions; any of them may be overruled:
1. **Ranks and units.** Five ranks (soldier, sergeant, captain, commander, General) and four units (section about 12,
   company about 200, wing 600 to 3,000, **host** 3,000 to 12,000). One General a host, so Generals follow the army's
   size; under 3,000 is a commander's column. Old grades map by the post held (File-Leader -> sergeant; Squad Captain
   -> captain; Senior Captain -> commander; High General and Marshal -> General). *Why:* answer 10's "regular naming",
   D12a's choice 10a without the Marshal, rule 9 (plain words), R14.
2. **Who commands several hosts.** The king in person; else **one commanding General by the king's written word, for
   that campaign only** (a commission, not a rank, title, pay scale or seat); else a council of war, slower and
   quarrelsome. *Why:* an army needs one will or pays for lacking it; a standing rank above General would be the
   Marshal again.
3. **The senior General** is the General of the crown's first host. He takes the Marshal's council seat (56's fifth
   seat and its yearly task) and nothing else: he does not command other Generals. `seat:<realm>:marshal` is retired.
   *Why:* D-062 ("old saves map a Marshal to the realm's senior General"); the council still needs the army's voice.
4. **Commands.** Every armed man is in one command; a command has one owner. The crown's command (royal knights,
   crown regiments, crown lands, the orders, hired men) is led by Generals the king commissions, by merit. A
   tenant-in-chief (a duke; a marquis or count with no duke over him) has his own, with officers he names, sworn to
   him; he is its General by right or names one. A contingent is kept whole. A march lord may fight for his border
   unsummoned. `GD.NOBLE_RUNGS`' numbers stand as a house's full strength. *Why:* answer 10, D-012.
5. **The summons** has six answers (in full, with part, late, a deputy, coin, refusal), each decided from named reasons;
   the muster records the reason given and the true one. **A lord's men serve the first season at his own cost; then
   the crown pays or he decides again each season.** *Why:* answer 5 removes the forty days, and a campaign still
   needs a clock: it becomes a person's decision.
6. **Four kinds of dispute** (a private war, a refused summons, a quarrel inside the army, a border lord's own war),
   each a ladder of decisions from a recorded grievance. One war record serves all fighting: `w.kind` realm, private,
   border, rebellion or civil, with *commands* as its sides. *Why:* answer 10's "regional disputes within reason".
7. **Men.** Sworn men (about 1 in 400 of the people), enlisted men (regiments by what the treasury pays; the roll,
   about 1 in 100, volunteers who drill and march when mustered) and conscripts. **Conscription** is by proclamation
   naming a real need, by lot, in three calls (one hearth in 20 for a season; in 10 for a year; in 5 while the enemy is
   on home soil), raised by each lord in his lands; it costs hands in the fields (about 3, 6 and 12 in 100 working
   men, double at harvest) and a remembered grievance. `r.army` reads as standing men, `r.levy` as the roll, the levy
   law as the conscription law, levy troops as conscript foot. The numbers are starting points for the balance stage.
8. **Following, desertion and mutiny** come from a company's ledger of what holds it and what pulls at it; mutiny needs
   a grievance, a voice and an occasion.
9. **One way of deciding** for every decider (`A.WHY.decide`, R1's core): options, reasons with kind, weight and
   source, the temper (20's persona), **feelings as states with a cause and a heat that discounts reckoning**, a seeded
   draw only between close options, a record. The owner's proud king and cold king are its two lab tests.
10. **Wars end only by surrender or defeat.** Defeat is a fact (five conditions); surrender a decision from two pans
    (to fight on; to yield), re-read monthly on what the decider has been *told*. Someone always asks first, and
    asking has a price. **A truce is a pause (a year at most), never an end;** a war nobody marches in is still a war.
    Eight pathways; terms only of real things, shaped by the casus. `w.score`, `A.checkPeace`, `A.peaceOdds` are retired
    (W0 had left the score under the screen, D-052).
11. **Sight** is from where your body stands (no one viewpoint; a soldier has no field view). **Stops:** anything whose
    subjects include you, your unit, an order to you, your charges, or someone you know within sight; nothing else.
    **Place:** given by the superior for reasons; chosen within it; requests answered with reasons.
12. **Reports.** Everything not seen arrives as a report with a sender, a road, a day and a slant; timing is distance
    over the carrier's speed, by urgency and by your place on the sender's list (need, then bond, then importance);
    truth is what he knew, bent by what he wants believed, bent by each mouth. The player writes reports upward and can
    be caught shading them. **A battle you were not at is played back as it was told to you** (answer 7), and corrected
    when a truer account arrives.
13. **Answer 8** ("keep it situation based... you know those you choose to get to know") is read as whom you *know*
    (five reasons: serve you, guard you, you report to, thrown together, chosen), not as a drawing rule; for the
    drawing D12a's 8a stands (your company man for man, the rest one figure for about six).
14. **Answer 9** ("everything is properly accounted for in world history and saved in the same way") is read as: one
    history for near and far in one shape, every record carrying reasons that point at records; **and so a war in an
    old save goes on, converted as it stands,** not turned into a truce (D12a's recommendation 9a is dropped: a truce
    nobody chose would be a thing without a reason).
15. **Stability is a reading** of named pressures (the throne's right, each lord, the commons, the towns, the faith, the
    army, the king himself); `r.stability` and `h.op` become sums of terms, old values fading in as "the past".
    **A faction** needs a shared grievance, a tie and a leader; **a coup** a motive, access and an opening;
    `A.factionsYear`'s bare dice go.
16. **The military path** (D11+): a muster-master reads weapon, way of fighting, every useful aptitude, birth, patron
    and the command's need, and makes offers with reasons; roles beside rank; a unit's training syllabus is built
    from its make-up, abilities and tendencies (about forty drills in eight families, each arm its own list); a unit
    always has a duty.
17. **The build** is sixteen stages: W1-1 to W1-6 (no Marshal; minds; commands and the summons; no levies; surrender or
    defeat; the realm's peace), D11-1 to D11-3 (the muster; units that differ; careers), D12b-1 to D12b-7 (hosts on
    roads; the field by your eye; reports; the theatre; the press; sieges; balance). W1 needs no map and starts with
    W1-1. **X7 part 2's gate is D12b-1** (hosts on roads retire `A.wsDay`); W1 and D11 are held to 2.5 ms a month in
    all. An outcome-identical idle-day skip on the old engine (X7 part 2a) is offered but unmeasured.

**Exceptions to record when built:** the war's and politics' own seeded streams (`seed:war`, `seed:politics`), as E1's.
**Not decided here:** the balance numbers (shares of men, call sizes, budgets) beyond starting points; the Dispatches
page's layout; whether "the realm's peace" (W1-6) should be its own work item.

### D-065 · Order 55: every relationship needs a base (2026-11-15 21:34 ET)
Rule 19. A meeting or a bond (getting to know, befriending, courting, asking favours, audiences) is open only where it
has a base: (1) **the gap in standing** between the two (estate, rank, office, wealth, renown); (2) **the higher one's
pride and personality** (proud, humble, kind, cruel, curious; his own origins: a baron risen from commoners sympathises,
a duke born to gold does not); (3) **need** (he wants your skill, your sword, your silence, your coin, your vote); (4)
**circumstance** (you serve him, guard him, saved him, share a road, a battle, a prison). Without a base the person will
not look at you; the action is not offered, or offered as an attempt that a reasoned refusal answers. The player shifts
the scales by knighthood and honour, mastery and renown, fame, wealth and connections (an introduction from someone who
knows both). NPC to NPC bonds follow the same base. Work item **R2**, built with R1 (nothing without reason).


### D-066 · W1-1: the war map's division is a host, its commander a General (2026-11-16)
D-064 point 1 maps the old grades by the post held and sets the units' sizes (wing 600 to 3,000, host 3,000 to 12,000),
but the old engine's units do not match the old grade names: a battalion is about 800 men (a wing) and a division up to
7,470 (a host), while an army holds up to 24 divisions (170,000 men). Chosen, until D12b-1 builds hosts of contingents:
1. **A division of 3,000 men or more is a host, and its commander a General; under 3,000 it is a column under a
   Commander.** So the old Commander grade (6, a division) reads **General**, and a battalion's head (the old Senior
   Captain, 5) **Commander**. One General to each host; a realm's Generals follow what it fields. *Why:* the owner's
   "several Generals by army size" and "no host over 12,000, none without a General" hold on the old engine as it is;
   reading the army as the host would need armies cut to one division each.
2. **A host with no person at its head is led by a name it gives itself** (`A.oobLeader`, pure from ids), as 9997's
   seed captains are. *Why:* about 200 divisions world-wide; making a person for each would cost the save and the month.
3. **An army of two hosts or more is led by its commanding General, by the king's written word for that war:** the
   existing post `army:<id>`, which ends when the army is stood down. With one host its general is that host's. *Why:*
   D-064 point 2 as data at no cost; W1-3 adds the reasons for the choice and the council of war's price.
4. **The eight grades stay as steps** (`GD.MIL`, 0 to 7): every rank comparison in the code holds and careers keep
   their pace; a second grade of one rank reads "(second step)" on ladders and promotions (`A.rankLabel`). *Why:* a
   five-grade ladder is D11-3's (careers rebased), with balance measured.
5. **The senior General is the General of the realm's oldest standing host** (`r.firstHost`, kept while it stands), the
   crown names him when the place is empty, and a General's superior is the crown. *Why:* D-064 point 3; the council
   always has the army's voice (the old seat was mostly empty).
**Not decided here:** unit words on screens ("division", "battalion" still appear outside the order of battle; D11-1's
R14); hosts of contingents (D12b-1).

### D-067 · G0: the growth standard; trials at Expert and Master (2026-11-16; order 54, D-062; refines growth.md, D-039, D-046)
*Numbered D-067, not D-066: another agent may take D-066 in parallel.*
1. **`docs/design/growth-standard.md` is the standard** for how stats and skills grow and decline in G1, G2, D11 and
   D11+: `gain = EU × quality × teacher × talent × age(kind) × condition × R(level) × reach`, with `R(L) = 1.8 e^(−L/21.6)`
   (a beginner's month worth about thirty of a master's), the routine ceiling for work, the teacher's ceiling one word
   under him, sensitive ages by kind, per-stat age curves, detraining, and rust after 5/8/12 years that returns ×5.
   *Why:* order 54, "growth is far too linear"; measured, a main skill climbs in a near-straight line from a daily drip of
   ~380 gains a year (§1 of the doc).
2. **Every change of a skill or stat carries a cause** in a ledger; the season's line and the Records tab read it (rule
   18 applied to growth).
3. **Trials at Expert and Master** (new): crossing into those words takes a deed fit for them (a stretch at that level,
   succeeded); effort past the edge is stored (up to five points) and lands with the deed. growth.md §2.2's proofs for
   Grandmaster and Legend and its census stand. *Why:* plateaus and leaps with a story, not a lottery. **For the owner
   to confirm** (doc §5, item 1).
4. **Kept from growth.md:** talent letters and reach (§1.4, §10), the eight words (§2.2), the body gate (§1.5, C9), disuse
   spans and ×5 return (§2.7), with one change: rust stops at one word down **and** 15 points below the best.
5. **The doc is a new file beside `growth.md`**, not a rewrite of it: growth.md is the owner-settled G design (D-046); the
   standard governs its rates and says where it adds to it.

### D-068 · C8d gate 1: the manhwa card is a second render layer drawn by code; no raster art; dress is a family, an accent and a person (2026-11-16; orders 56, 57, 58; D-024, D-029, D-060)
**Chosen** (code `src/ui/engine/figure/manhwa/`, sheets `docs/design/demo-2d/c8d/`, the owner's note `docs/design/c8d-gate1.md`):
1. **A new layer beside `compose()`, not a restyle of it.** The reference's look (large eyes, flat two-step shading, a
   rim light, locks, a waist-up crop) needs its own head, hair and pen; the old layer's full-figure rig and soft tones
   stay as they are for the game until the owner passes this gate. Both share the dice and the palettes.
2. **Drawn, never painted, and no raster backgrounds.** A card must come from a person's data (thousands of people) and
   the phone's first load matters (X7): a card is 21 KB gzipped with its scene; one painted scene of that size is 40 to
   80 KB. The limit is stated to the owner: this is cel drawing; a painted look needs outside art (order 56's image
   model, when there is a key).
3. **Dress is three layers of reason.** A *family* is a people's grammar (north, desert, steppe, south); a *realm accent*
   bends it across a border (Sabra against Qadir, Aldmark against Northreach); the *person* varies it by wealth and by
   their own dice. A border town takes named pieces from the neighbouring family. Each garment's reason (climate, trade,
   faith, law, wealth) is written beside it in `peoples.js`.
4. **Order 58's rules are the kit's rules:** no two peoples share a crown or a helm; one of four soldiers wears no helm;
   a serf carries his lord's mark and his lord's tools, a peasant his own; no folded arms; no pair of poses repeats in a station.
5. **Proposed, for the owner to change:** banner colours and crests (the lore has map colours only), the keywords and
   mottos, the name and age on the card, the ruler's title in place of "Royal".
**Conflict recorded:** D-029 chose a tone-led finish (soft painted shading); the reference of order 57 is brighter and
flatter. This layer follows order 57 (the later order); D-029's layer is kept, not removed.
**Cost:** see H-063. **Not decided here:** whether it goes into the game (the gate), and how the remaining peoples map to families.

### D-070 · Order 59: growth has no timetable; concepts, grasp, discipline and breakthroughs (2026-11-15 23:12 ET; amends D-067)
The growth standard's fixed timetable (an ordinary talent at Master in about 27 years of full-time drill) is dropped.
Passing a word needs its named **concepts grasped**; each person has a seeded, hidden **grasp** per concept (some come at
once, some never, a lifelong blind spot possible); each month of real effort is a **chance** to grasp, raised by
discipline, quality of effort, a teacher who holds the concept, variety and reflection, lowered by routine, fatigue,
pride and despair; **breakthroughs** are sudden grasps tied to a named moment, leaping the stored effort. Result: with the
same training one man is Master in five years and another stuck for life. Every turn has its cause in the ledger (rule
18). The curve R(level) stays as the pace between turns. `docs/design/growth-standard.md` §3.16 (and rule 2 of its
summary). Builds in G1/G2 and D11+. (D-069 is left to W1-2.)

### D-072 · S1a: proficiencies retired; skills with levels, experience, concepts and breakthroughs (owner order 63, 2026-11-15 23:21 ET; design 2026-11-16; builds on D-046, D-067, D-070)
**Owner:** "im no longer a fan of the proficiencies system its very bland. systematically remove it and refine a system of
skills with levels and expierience. dynamic growth mechanics". **Design:** `docs/design/skills.md`, model `docs/design/skills/`.
1. **One quantity.** A skill has a **level** (0 to 35: the eight words of growth.md §2.2, Beginner to Legend, in five
   steps each; Myth for the dead) and **experience** toward the next step. A check reads the level's value on today's
   0-100 scale at growth.md's word edges; there is no number beneath it. `p.skills[k]` stays as a mirror of that value,
   written only by the engine, so 349 readers and 5,695 checks keep working. *Why:* "nothing may survive as a hidden
   number", and no card's shape changes.
2. **28 broad skills with 99 specialisms**, the keys the player sees today; the ten keys folded earlier (dagger, xbow,
   lance, siegecraft…) are specialisms, for NPCs too. No new skill until it has five readers (69's rule). A specialism
   acts two steps higher inside it, one lower in a sibling, and costs ×0.85 outside it.
3. **Experience is the growth standard's formula as a price:** ten for a month of plain drill; a step costs
   `120 × (e^(b/21.6) − e^(a/21.6))`. The daily drip, the 0.3 a month, the use-and-practice weights, the 6% session
   "breakthrough" and the two-year rust are removed; sources are efforts with a quality and a cause.
4. **No word by experience alone** (D-070 built in): nine named concepts a skill (252, in data); a person's need for
   each is a hash (ease by skill and by concept, talent, a chance of a lifelong blind spot); each worked month is a
   chance of insight; experience at an edge is stored (at half without the concept) and lands as a leap; breakthroughs
   are sudden grasps at named moments, an eighth as likely against a blind spot. The page shows concept states in
   words (dark, dim, clearer, close, grasped), never a number.
5. **Proof from Expert up** (confirms D-067 item 3 as the *name* of the crossing): a succeeded stretch at the next word.
6. **Growth moves with the life:** discipline (unbroken months), a rival, a teacher who holds the concept, a new land,
   wounds, age, rest, purpose, company, comfort, kin skills, hours shared, specialism, pride; each a factor written in
   the ledger with the gain it changed.
7. **Kept from growth.md:** the words, talent letters (per skill, shown, from `p.apt`, until G1), the body's baseline
   (C9), disuse, knacks (the 114 perks, at the crossings into Advanced, Expert, Master), arts and their forms untouched
   (rank words only). **Cut from S1** (G3, G4, E2): narrow skills by rule, marks, fusion, the failed first try, manuals.
8. **Other people:** one number as now, the same rules in closed form once a year, concepts by hash; at most 24 active
   people stepped monthly; a teacher shows only what he grasped.
**Conflicts recorded, and the fix chosen.**
- *The census.* D-043 item 1 (order 36) dropped the caps on Grandmasters and Legends ("no count limit"); D-067 item 3
  said the census of ten and one "stands". **Chosen:** order 36 holds: the census is a **count** the world keeps and
  shows, never a cap; rarity comes from what the top takes, and a long test bounds it (1 to 12 Grandmasters, 0 to 2
  Legends alive over 200 years), tuned by the concepts' needs. For the owner to overrule.
- *Levels outside combat.* D-043 item 6 kept the ranks for fighting and wanted other callings without a grade ladder;
  order 63 (later) asks for "a system of skills with levels". **Chosen:** every skill has the eight words; D-043's ban
  on step-like *career* ladders stands untouched. For the owner to overrule.
- *Hidden numbers.* §3.16's grasp is hidden by design; order 63's removal must leave nothing the player cannot reason
  about. **Chosen:** the need is never shown as a number and is never a stored stat; its state is always on the page
  in words, and a Master's judgement names it.
- *Check odds.* growth.md §2.8 wanted G2 to move no check's odds; levels in steps move some by up to 6.4 in 100
  downward at migration (the remainder goes on the bar). Accepted for a level that is the only number.
- *Event text is read as text:* renaming `C.prof` to `C.lvl` and `C.apt` to `C.talent` in the packs is done with
  `tools/release/identity-probe.mjs` before and after.
**Not decided here:** talent's hiding and budget (G1), languages as skills (G3), the image-model work (order 60).

