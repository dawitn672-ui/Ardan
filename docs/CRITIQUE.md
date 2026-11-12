# Ardan v2.0.0-beta.1: the critique, and the order of work that follows from it

*Round 2, step 1 · 12 November 2026 · written by the lead critic (Fable, maximum effort) from five lens reports (two of
them redone by deciding critics), the map of posts, the first coherency run, and the lead's own checks on the frozen
build and the live code. The sources are in `docs/reviews/round-2/`. By the owner's order 11, nothing in section 2
starts until the owner has read this.*

## 1. Verdict

Ardan has a strong engine behind a face that is slow, crowded and often untrue. The simulation is deterministic,
replayable and flat in cost for 60 years, and it holds more war, court and family machinery than most shipped games.
The owner does not meet the engine, though. He meets:

- a page that redraws itself three to six times a month and, after one hint or one death, restyles every element on
  every insert;
- a world that keeps fourteen separate records of who holds what, so his Marshal story reproduces on every seed;
- one face drawn for every person alive, with no age, class or scar on it;
- a photograph of a continent with no road, ford or pass, where 125 of 306 provinces are "hills";
- a war whose battle choices never change, built on a twentieth-century staff model in medieval dress;
- screens that show everything to everyone, 520 words at a time, to a newborn who is handed 25 relatives and an Arms page.

Under all of it, 1,112 `try` blocks swallow errors that no test can see, which is how a crash that puts two lords in
one seat shipped. The three worst flaws are the sticky restyle (P1), the missing idea of a post (R1) and the single
face (V1). The best things are the engine's honesty (same seed, same world), the phone event card, the voice of the
writing and the way events remember. Of the 163 flaws below, 3 rate 10 and 15 rate 9. None needs the game torn down.
Most need one source of truth where there are now many, and a test that looks at what the player sees.

**How to read this.** Severity is out of 10: 10 breaks the game or the owner's trust, 1 is polish. Flaw ids carry
their area: P performance and engineering, R ranks and posts, U interface, T time, F family, N names and world,
V characters and art, M map, W war, E events, Q tests and process. Work items keep the owner's ids (A1 to D12, B6);
the new ones are A0 and X1 to X5. Sources, in brackets: **[eng]** and **[ux]** are the deciding critics, who verified
their rows; **[eng-draft]**, **[ux-draft]**, **[design]**, **[art]** and **[world]** are first drafts; **[posts]** is
the posts map; **[coh]** the coherency run; **[lead]** was checked for this document by reading the live code, running
a probe on the frozen build or looking at the screenshot.

## 2. Order of work

Two lanes can run side by side because they own different folders: an **engine lane** (Opus) and an **interface lane**
(Sonnet). The two design documents (Fable) are written beside them. X1 touches every folder and runs alone. A3 is not
one step: A3a builds the net, and every later item adds its own checks to it. Sizes: S a day or less, M a few days,
L about a week, XL longer and split into parts. A playtester agent (Sonnet, default effort) plays each finished step.

| # | Item | Size | Model | Runs |
|---|---|---|---|---|
| 1 | **A0** Stop the bleeding | S | Opus high | first |
| 2 | **A3a** The net | M | Opus high | after 1 |
| 3 | **A1** Lag | L | Opus high | after 2 |
| 4 | **B6** Next month or Next year | M | Sonnet high, on A1's stepper | with 3 |
| 5 | **B4** Click-to-open | M | Sonnet high | beside 3 and 4 |
| 6 | **C8a** Character design: the plan | M | Fable max | beside 2 to 5 (a document) |
| 7 | **X1** Own the release | M | Opus high | alone, after 3 to 5 |
| 8 | **A2** One holder per post | XL | Opus high | after 7 |
| 9 | **B5** Declutter | XL, two parts | Sonnet high | part 1 beside 8, part 2 after it |
| 10 | **C8b** Faces and bodies | XL | Opus high | beside 8, after 6 is approved |
| 11 | **X2** Named stages | L | Opus high | after 8 |
| 12 | **D10** War screens only when deployed | M | Sonnet high | beside 11 |
| 13 | **C6** Relationships and households | L | Opus high | after 11 |
| 14 | **X3** Honest cards and clocks | L | Sonnet high (Opus for the preview engine) | after 13 |
| 15 | **C7** Names and cultures | L | Sonnet high, with a research agent | after 8; beside 13 and 14 |
| 16 | **C8c** Dress, class and regalia | L | Opus high | after 13 and 15 |
| 17 | **D9** Map detail, and ground the game can read | XL | Opus high | after 15 |
| 18 | **D12a** War, branches and command: one design | M | Fable max | beside 17 (a document) |
| 19 | **D11** Military branches | XL | Opus high | after 17 and 18 |
| 20 | **D12b** War and command depth | XL | Opus high | after 19 |
| 21 | **X4** Balance pass | S | Sonnet high | any time after 14 |
| 22 | **X5** State diet and plumbing | M | Opus high | any quiet moment after 3 |

### 1. A0 · Stop the bleeding
- **Why now.** Three small fixes remove about half the cost of every month for anyone who has seen a hint or died
  (P1), stop a crash that corrupts the court for the rest of a game (R5), and save the tools the later steps are
  measured with (Q7). None depends on anything.
- **Depends on.** Nothing.
- **Done when.** (a) After a hint has been shown, and after a death, adding one empty `<span>` costs under 1 ms of
  style time (today 13 to 21 ms), held by a CI probe; a CSS lint fails the build on `:has()` anchored on `body`,
  `#app` or `#game`, or followed by a bare tag or `:nth-child`. (b) Seed 7, a peasant girl, 60 years: `N.regrant`
  never throws and `A.V2F.audit()` is empty at every five-year check. (c) "Would teach you f" is gone (E10); toasts
  set `--ts-h` on their own stack (P20). (d) The critics' harness scripts are committed under `tools/bench/`.
- **Fixes.** P1, P20, R5, E10, Q7.

### 2. A3a · The net
- **Why now.** Every later step changes systems whose errors are swallowed today. Until a failure is loud, each fix
  can break something nobody sees. This is the first half of the owner's A3; the checks themselves grow with every step.
- **Depends on.** A0.
- **Done when.** (a) `tests/run.mjs`, the benches and the soak fail on any `console.error`; hooks run through one
  `A.guard(name, fn)` that counts failures into the problem report and rethrows in a debug build. (b) `08-coherency`
  is in the default build; `tools/coherency.mjs` plays 8 seeds for 60 years every night and a short round in CI,
  running `A.V2SAVE.check()`, `A.V2F.audit()` and the registry every five years. (c) A committed baseline lists
  today's known contradictions per check, and CI fails when any count rises; round 2 ends with the baseline empty.
  (d) A new game passes every check on day 0. (e) The test runner survives a browser crash, limits each test's time,
  reports SKIP as its own state, and builds and lints once for all shards.
- **Fixes.** Q1, Q3, Q5, Q8, Q10, P22.

### 3. A1 · Lag
- **Why now.** It is the owner's first complaint and the core loop. It also decides whether Next year is possible:
  a year through today's stepper costs 27 to 46 seconds.
- **Depends on.** A0 (so the measurements are not taken in the restyle mode) and A3a (so a redraw bug is loud).
- **Done when.** The press harness runs in CI on two committed saves (year 0 and year 50), each on a fresh page and
  after one death, at 1366 px, in CPU time of the main thread: (a) a quiet month costs at most 150 ms and each card
  adds at most 100 ms (today 294 to 538 ms and 358 to 1,001 ms at year 50); (b) at most one full refresh and 12 forced
  layouts a press (today about 3 and 110); (c) year 50 costs at most 1.15 times year 0, and press 100 of a session at
  most 1.05 times press 1; (d) at four-times CPU throttle a quiet month takes at most 1 s (today 3.0 to 3.9 s);
  (e) starting a life shows a progress line and never freezes a frame for more than half a second.
- **Fixes.** P2, P5, P7, P11, P21, Q2, U7 (the sweep), T3.

### 4. B6 · Next month or Next year
- **Why now.** The owner's newest order (D-008), and the same stepper A1 rewrites. Built together they are one job;
  built apart, the stepper is rewritten twice.
- **Depends on.** A1's compute-then-paint stepper.
- **Done when.** (a) Two buttons in fixed places; on campaign, Next day and Next week as now; the button never turns
  into a stop control, and nothing can cut a month short. (b) With the same seed and the same answers, twelve month
  presses and one year press end on the same fingerprint (a new test; `v2tNoPlay` is replaced). (c) A quiet year
  costs at most 2 s of CPU on a desktop and 6 s at four-times throttle, with one redraw and one digest. (d) A year
  stops early, with one line saying why, for a card that needs an answer, a battle or campaign, an illness or wound,
  a death in the household, coming of age, or a listed deadline. (e) A newborn peasant reaches 12 in at most 25
  presses plus its cards (today about 155 presses, 129 of them empty). (f) A year wastes no initiative (T5).
  (g) The phone shows the age on the time row. (h) `docs/V2_SPEC.md` row 8, the skill `game-ux-playtest-loop` and
  How to play all say the same thing.
- **Fixes.** T1, T2, T3, T5, U18, part of Q6.

### 5. B4 · Click-to-open
- **Why now.** A standing rule that the build breaks on every screen. It is mechanical, low in risk, and lives in
  folders the engine lane does not touch.
- **Depends on.** Nothing (it runs beside A1 and B6).
- **Done when.** (a) A test hovers every anchor (`[data-tt]`, `.tt`, `[title]`, the map canvases) on every page at
  1366 px and no description appears; click, tap and Enter open each one and Esc closes it. (b) A lint fails any
  `title=` over three words in the built page and any hover handler that opens a tip. (c) On a phone, every
  description a desktop can reach is reachable by tap (the same count per page). (d) An activity opens a sheet
  (what it does, cost, odds in words, risk, "Do it") before it commits, and its result is never cut. (e) The skill
  no longer says "never hide a description behind a click".
- **Fixes.** U1, U9, part of U19, part of Q6.

### 6. C8a · Character design: the plan
- **Why now.** The owner marked character design high priority, and the build (C8b) can start as soon as the plan
  is approved. A document conflicts with nothing, so it is written while the first steps are built.
- **Depends on.** The owner's answer on the art register (question 1 below).
- **Done when.** The owner has approved `docs/design/characters.md`: the face genes and their ranges; inheritance
  from both parents; the curves for sex and age; body, height and build; wounds and scars; expression from
  temperament; the dress table by class, culture, wealth and role; the register, with reference sheets; the cost
  in state per person (at most 30 bytes of genes); and the acceptance sheets that C8b and C8c must pass.
- **Fixes.** It plans V1 to V22.

### 7. X1 · Own the release: bake the patches in and format the core
- **Why now.** A2 must change about 45 functions of the release, and C6, D11 and D12b more. Today each change is an
  exact-string patch on a one-line, 1.7 MB blob that nobody can review. The release's own names are intact
  (`const pc=A.pc()`), so one mechanical pass turns it into readable source. The engineering critic put this later;
  the lead puts it before A2 because every large step after it gets cheaper and safer. It is the one step with
  nothing to see, so the owner decides (question 5).
- **Depends on.** A3a and A1's gate (they catch any change in behaviour), and nothing else in flight.
- **Done when.** (a) The default build has no `patches.mjs`; the patched release lives as formatted files under
  `src/core/release/`, and `vendor/ardan-b593143.html` is still untouched. (b) The journals of 10-, 30- and 60-year
  lives replay to the same fingerprints as before, and all 751 browser tests pass. (c) Every event's audience class
  (`A.evAudience`) is unchanged. (d) The patch layer is in `archive/` with a note.
- **Fixes.** P4; it prepares P3.

### 8. A2 · One holder per post (with A3's checks for it)
- **Why now.** The owner's second complaint, reproduced on every seed. Branches (D11), command (D12b), scoped war
  screens (D10), households (C6) and realm-specific titles (C7) all need to ask "who holds this?" and get one answer.
- **Depends on.** A3a (the net), X1 (readable release), and the posts map's design (`docs/reviews/round-2/posts-map.md`
  section 5, phases 1 to 4; phase 5, land titles and guild posts, can follow later).
- **Done when.** (a) `A.POSTS.audit()` is empty in 10 seeds × 20 years and in the nightly run: one holder per post,
  no dead or under-age holder, no forbidden pair, every old field equal to its record. (b) The owner's story is a
  test: by each of the five roads to the Marshal's seat there is exactly one Marshal, he commands the armies and may
  take the main army, and the old Marshal is moved, named in the story and given a reason to resent it.
  (c) Captain to Commander to General to Marshal: each step hands the old post to its deputy, and the new command is
  real (men, orders, War Room rights). (d) Resigning, deserting, prison, capture, death, passing the torch and
  leaving the realm leave no post behind, and each applies its consequence. (e) A census of every stored title
  string against the registry finds none that names a post its owner does not hold; the People page, the Path, the
  War Room and the chain of command read the registry. (f) Old saves load, are repaired with one story line each,
  and stay in `tests/saves/`.
- **Fixes.** R1 to R4, R6 to R11, R13 to R18, N10.

### 9. B5 · Declutter
- **Why now.** The owner's fourth complaint. It comes after B4 and B6 because they decide where descriptions and the
  time controls live; its second part comes after A2 because "what this person may see" reads the post.
- **Depends on.** B4, B6, A1 (the story stops being a permanent column); part 2 on A2.
- **Done when.** *Part 1, the shell.* (a) A test with the hit-testing `measure()` holds a phone's first view to 120
  words and 12 controls, a desktop's to 250 and 25, and every action page to 3 screens. (b) At 1366 px the open page
  gets at least 60% of the width (today 28%). (c) A desktop card dims everything else and shows every choice at
  768 px. (d) Every "X tab" named in text exists in `UI.GROUPS` (a lint). (e) The 200% text setting clips no label;
  the open page's first control is within 5 tab stops (today 32); coarse pointers up to 1024 px get the phone shell.
  *Part 2, scope.* (f) One `UI.scope(pc)`; six lives (a newborn, a child of 9, a squire of 16, a File-Leader at war,
  a captain in garrison, a councillor) draw every page with no forbidden string. (g) One goal stack on Life.
- **Fixes.** U2 to U8, U10 to U17, U20 to U27, V20, P16.

### 10. C8b · Faces and bodies
- **Why now.** High priority for the owner, and independent of posts, names and war. It starts as soon as C8a is
  approved and X1 has landed.
- **Depends on.** C8a; X1; A1 (portraits become cached images).
- **Done when.** (a) Cover-the-hair sheet: playtester agents match 20 masked adult faces of one people and sex to
  their unmasked busts at least 90% of the time (today near chance). (b) Sex is sorted right at least 95% of the
  time at 88 px; the age band (child, youth, grown, old) at least 85%. (c) Siblings, and parents and children, are
  closer in gene distance than strangers by the margin C8a sets. (d) Every wound from a battle, a duel or an accident
  writes `p.wounds` with a place and a year and shows on the bust; soldiers with ten years' service at world start
  carry scars at the rate C8a sets; no newborn has one. (e) A person of 150 cm and one of 195 cm differ visibly in
  one frame. (f) Feature lines keep 2.5:1 contrast on every skin tone. (g) Genes cost at most 30 bytes a person,
  old saves get theirs from the seed and the id, and the People page is at most 800 DOM nodes.
- **Fixes.** V1, V3 to V6, V8 to V10, V14, V15, V18, V21, P15.

### 11. X2 · Named stages for the hot functions
- **Why now.** `A.applyFx` has 32 definitions and `A.newGame` 20. C6 and X3 are about to add more to exactly these.
  Folding them once, right after the registry has removed the promotion wrappers, stops the pile growing.
- **Depends on.** X1, A2.
- **Done when.** (a) `A.applyFx`, `A.eventView`, `A.eventChoose`, `A.newGame`, `UI.render`, `UI.refresh` and
  `UI.renderModal` each have one definition that runs named stages; a lint fails when one gains a wrapper. (b) The
  count of names defined more than once (351 today) may only fall, held in CI. (c) Load order comes from `after:`
  lines in a feature manifest. (d) The muted old diplomacy path is deleted, or a test holds every muted function.
- **Fixes.** P3, P10, P14.

### 12. D10 · War screens only when deployed
- **Why now.** A standing rule, cheap once posts (A2) and scope (B5) exist, and it sets the rule D11 and D12b must
  keep. It does not need the map.
- **Depends on.** A2, B5 part 2.
- **Done when.** A persona test: (a) a civilian sees no war screen (as today); (b) a soldier in garrison or at peace
  sees no War Room; (c) a deployed soldier sees his company, his orders and rumours, with enemy numbers only as
  estimates; a captain sees his division's front; a general the theatre; (d) the Arms page appears at 14 or on
  enlisting and lists only the orders the character has heard of.
- **Fixes.** W5, part of U4 and U19.

### 13. C6 · Relationships and households
- **Why now.** The owner's fifth complaint. It needs the registry for household roles and X2 for a clean start-of-life
  pipeline, and X3 and C8c need its people.
- **Depends on.** A2, X2, B5 part 2.
- **Done when.** (a) In 42 starts (7 classes × 2 ages × 3 seeds) a commoner's relationships at birth are parents
  and living siblings, and a grandparent only under the same roof: at most 8, with no uncle, cousin or in-law.
  A noble adds a wet-nurse or nurse, a maid, a tutor from 6 and a guard knight: at most 12. (b) Every later entry
  records how and when you met. (c) No event names a relative who is not in the tree: a lint on kin tokens, and no
  minted kin in 12 worlds × 30 years. (d) One resolver gives a house its head and heir: no contradiction in 48 noble
  births. (e) A commoner's parish has named commoners to meet, held as seeds until met, and the named population
  grows no faster than today. (f) Births follow a nine-month clock. (g) People opens on the Household, the tree is
  a tree, and the skill `life-sim-systems` says the same.
- **Fixes.** F1 to F10, P9.

### 14. X3 · Honest cards and clocks
- **Why now.** After C6, because the kin rules decide which cards may fire. These flaws were found by playing, and
  each one costs the player's trust in what a card says.
- **Depends on.** C6, X2.
- **Done when.** (a) A lint fails any choice that can start a fight to the death without saying so. (b) A replay
  test over 400 scenes finds every choice's preview equal to what was applied (the sign of each effect; coin within
  rounding). (c) In 12 worlds × 30 years: no card asks a child under 6 for an adult's decision; no dated event fires
  outside its month; no home-town card reaches a player deployed abroad; no station word appears without its gate.
  (d) A fatal illness is an arc with an onset and a choice. (e) Six lives each get an ending that names their career.
- **Fixes.** E1 to E9, E11, E12, T4, T6.

### 15. C7 · Names and cultures
- **Why now.** The owner's sixth complaint. It follows A2 because titles and seats must be read from the registry
  before they can be worded per realm, and it comes before dress (C8c) and the map (D9), which are keyed by culture.
- **Depends on.** A2. The name research can start at any time (order 14 allows outside tools); its results go to
  `data/names/` and `docs/research/`.
- **Done when.** (a) Culture belongs to the person and the province: a census of 35 realms at year 0 and year 30
  finds ports and market towns with 15 to 35% of births from trade partners and border provinces with 20 to 40% from
  the neighbour. (b) Every culture has at least 80 given names per sex, with sources; Europe's realms use at least
  eight pools (today three). (c) No two living people in a town share a full name; no living siblings or first
  cousins share a given name. (d) A court census finds no fief named in another people's language; rank words and
  council seats come from each realm's own list. (e) The four realm names fit their governments. (f) The renaming
  hack on the browser's prototypes is deleted and the built page holds none of the old names.
- **Fixes.** N1 to N13, P6, part of M4.

### 16. C8c · Dress, class and regalia
- **Why now.** The second half of character design. It needs C7's cultures as keys and C6's commoners as subjects.
- **Depends on.** C8a, C8b, C6, C7.
- **Done when.** (a) On a sheet of 8 stations × 4 cultures with the labels hidden, agents name the station at least
  85% of the time (today only the nobility can be named). (b) A soldier's bust shows that he is one; D11 adds the
  badge of his arm. (c) Nobody in a house wears another's garment except liveried retainers. (d) Hoods appear on at
  most 10% of indoor portraits and never in lists or the tree. (e) Each event carries a scene tag and the picture
  matches it in a 60-card sample.
- **Fixes.** V2, V7, V11 to V13, V16, V17, V19, V22.

### 17. D9 · Map detail, and ground the game can read
- **Why now.** The owner's eighth complaint, and the floor under war depth: a flank, an ambush or a cut supply line
  needs a wood, a ford and a road to exist first.
- **Depends on.** C7 (place names, cultures by province), A1 (the map's ground is cached). The engine already has
  heights, flow and river paths.
- **Done when.** (a) The map draws roads in two ranks, a ford or bridge at every river crossing, named passes,
  rivers with tributaries from source to sea, woods and marsh as features, and names for seas, ranges, rivers and
  forests; at least 70% of towns stand on a river, a confluence or the coast. (b) Shown 10 crops, agents tell roads
  from borders every time. (c) The same data drives play: travel by road is at least 30% faster; supply reaches
  further along roads and rivers; an attack across a river with no bridge, or through a pass, carries a penalty that
  the battle report names. (d) Terrain comes from the generated ground: in 10 seeds no oasis lies outside arid land,
  every realm sits on its own kind of country, and no terrain word covers more than a third of the provinces (today
  "hills" covers 41%). (e) Neighbouring realms never share a colour. (f) After its first frame the map redraws in at
  most 50 ms. (g) Every map in the game is one component.
- **Fixes.** M1 to M9, P18, part of U5.

### 18. D12a · War, branches and command: one design
- **Why now.** Branches and command depth are one system seen from two sides: what an arm can do is what a
  commander can order. One design, written while the map is built, keeps D11 and D12b from contradicting each other.
- **Depends on.** D9's data model (features and crossings); the owner's answer on war words and structure (question 3).
- **Done when.** The owner has approved `docs/design/war.md`: the host in period terms; each branch with its ladder
  of posts, training, gear, missions and exits; what each rank decides on the march, in camp, at a siege and in
  battle; how ground and scouting enter each decision; what the screens show at each rank; and the checks for D11
  and D12b.
- **Fixes.** It plans W1 to W12.

### 19. D11 · Military branches
- **Why now.** The owner's tenth complaint. It needs posts with echelons (A2), per-realm rank words (C7), ground for
  scouts and engineers to act on (D9) and the design (D12a).
- **Depends on.** A2, C7, D9, D12a.
- **Done when.** (a) `data/military/branches.json` holds at least ten branches (heavy lancers, mounted men-at-arms,
  dismounted knights, scouts, foot, archers, crossbows, siege engineers, garrisons, levies, mercenaries, elite
  orders), each with its own ladder of registry posts, entry rules, drills, gear, at least three missions of its own
  and a way out. (b) Enlisting is a muster of two or three scenes that fixes the arm from birth, skill and gear.
  (c) In 10 bot careers per branch at least half of the war cards are the branch's own. (d) Rank words are period
  words, per realm. (e) Pay is rebased: an officer's wealth comes from loot, ransom and grants. (f) Peace service
  counts toward promotion.
- **Fixes.** W2, W4, W11, R12, V7.

### 20. D12b · War and command depth
- **Why now.** The owner's eleventh complaint, and the last step because it stands on everything before it.
- **Depends on.** D9, D10, D11, D12a.
- **Done when.** (a) Across 20 battles a rank meets at least 12 different sets of choices (today one), built from
  arm, ground, enemy, phase and weather. (b) On campaign no three weeks in a row pass without a decision or a skip
  (today 21 of 27 weeks are empty). (c) Flank, ambush, encirclement, blockade, siege work, supply and scouting are
  orders given on the map, they read the ground, and the after-action report names the move and the feature.
  (d) Enemy strength is an estimate whose error shrinks with scouting. (e) The commander's field draws the ground;
  the soldier's battle has a picture for each phase. (f) The bench `rankfx` still shows the player's choices moving
  results by at least 15% at every rank. (g) Far wars cost at most a tenth of an engine month (today `A.wsDay` is
  about half).
- **Fixes.** W1, W3, W6 to W9, W12, P12.

### 21. X4 · Balance pass
- **Why now.** Small, and best done once cards are honest. **Depends on.** X3.
- **Done when.** `tools/bench/balance.mjs` holds, with new bands: lending is no better than a trade venture at equal
  risk; no skill goes from Apprentice to Legend in under 20 years of play; sparring cannot maim; one joust model.
- **Fixes.** T7, W10.

### 22. X5 · State diet and plumbing
- **Why now.** Low impact on the owner today, rising with every year a life lasts. It fits any quiet moment after A1.
- **Depends on.** A1; the owner's answer on question 6.
- **Done when.** A year-60 save is at most 400 KB (today 847); named living people stay within a target per realm;
  an autosave takes at most 50 ms of the main thread; one store records which events were seen; retired events are
  out of the built page; and, if the owner agrees, CI publishes the build instead of git holding every copy.
- **Fixes.** P8, P13, P17, P19, P23, Q9.

### Decisions the owner should make first

1. **The art register (C8a).** The anime look was the owner's order of 26 October and stays. Should it grow up:
   older proportions, real noses, age and scars that show, in the manner of a historical anime rather than a gacha
   banner? The art critic wanted to leave anime altogether; this critique says no (appendix A, 13).
2. **The map's look (D9).** Keep the satellite ground ordered in v2 and lay a cartographer's vector layer over it
   (roads, rivers, names)? The art critic wanted the inked map back; this critique says no (appendix A, 14).
3. **War words and structure (D11).** Replace divisions, battalions, templates, industry and manpower with a
   medieval host, or only rename them?
4. **A favourite as Marshal (A2).** May the crown raise a Captain over the generals' heads, so that he gets the real
   command and their resentment, or must the seat go to a General?
5. **X1.** One step with nothing to see, before A2, that turns the patched release into readable source.
6. **The built game in git (X5).** May `index.html` stop being committed every round, with the playable build taken
   from CI or a release branch instead?
7. **A year for an adult (B6).** Confirm what stops a year, and whether unspent initiative is spent by "Your days"
   or stops the year when it is full.

## 3. Flaws by area

Each table runs from the most severe down. The last words of each fix name the work item that carries it.

### Performance and engineering

| # | Flaw (concrete evidence) | Severity /10 | How to fix |
|---|---|---|---|
| P1 | **Sticky whole-page restyle.** Four CSS rules hang `:has()` on `body` (`src/events/28-endings/endings.core.js:213-215`, `src/ui/91-look/look.b-base.core.js:66-68`); two more end in a bare position after `:has()`. Once a hint box or the dead player's bar has been drawn, every DOM insert restyles about 2,900 elements until the page is reloaded: a year-50 month costs 1,555 ms of CPU, not 633, and one empty `<span>` costs 13 to 21 ms of style, not 0.01. Deleting the four rules cut 16 identical presses by 41%. Every life ends in a death, so every long session ends here. [eng; lead: rules read in the live repo] | 10 | Delete the four rules (`#app[inert] .hint{display:none}`, and a class on `#game` set in `UI.renderModal`); give the two right-hand sides a class; a CSS lint and a CI probe. **A0** |
| P2 | **A month redraws the page three to six times.** Per press at year 50: `UI.refresh` 2.9 times, `refreshTab` 3.3, `renderModal` 3.8, 110 forced layouts, 121 style recalculations. The engine is 20 to 70 ms of a 500 ms press; each card adds 173 ms at year 0 and 358 ms at year 50. `UI.clkLight` redraws on wall time, so a slow phone redraws more. At four-times throttle a quiet month takes 3.0 to 3.9 s. [eng, ux, design] | 9 | One owner of redraw: while stepping, paint only the clock; at a card, open the modal and nothing else; one refresh at the end; dirty flags per region. **A1** |
| P3 | **Behaviour is a stack of wrappers.** 2,403 definitions for 1,679 names on `A`, `UI`, `MAP` and `SAVES`; 351 names defined more than once; `A.applyFx` 32 times in 27 features, `A.newGame` 20, `A.eventChoose` 19, `UI.render` 18. What a function does is the sum of folder order; P1 is six features' CSS meeting by accident; promotion code sits in 14 folders. [eng] | 8 | Named stages with one owner each (`A.FX.stages`, `UI.passes`, `A.onNewGame`); a lint that fails when a hot function gains a wrapper. **X2**; each step folds what it touches. |
| P4 | **The release is patched, not owned.** 196 exact-string patches on a one-line blob; 10 match only text an earlier feature wrote; the built core is 6.56 MB against the release's 2.13. [eng] The release's own names are intact, so a formatter makes it readable. [lead] | 8 | Bake the patches in once, format the result into source files, build from those, archive the patch layer. **X1** |
| P5 | **The story log is rebuilt whole on every refresh and holds 40 years** (`UI.renderLogWrap`, `S.log.slice(-40)`): 20 elements grow to 1,618. It is the whole effect of age on a desktop: every page draw doubles (realm 79 to 172 ms, atlas 30 to 139). [eng] | 7 | An append-only log; two years in the page, older years on demand. **A1** |
| P6 | **Kingdoms are renamed by patching the browser.** `src/world/99999-v2-names/names.core.js:227-239` replaces the setters of `innerHTML`, `textContent`, `title`, plus `insertAdjacentHTML`, `setAttribute` and the canvas's text calls, and runs about 20 regexes over everything written. Any text that matches is rewritten (a person called Amber, a typed name, a mod). [eng; lead: lines read] | 7 | Rename in the data at build time; delete the prototype patches; a test greps the built page for the old names. **C7** |
| P7 | **The page is fixed after it is drawn.** FOLD, LOOK, MOTION, 71-phone and 27-accessibility restructure other features' markup and measure as they go (28 to 30 forced layouts a refresh); `VS.sweep` and a `MutationObserver` on `body` re-walk every inserted text node to turn numbers into words (19 ms of a 109 ms refresh). [eng] | 6 | Words at the source (`fmtStat`, `oddsWords`); each component owns its markup; fold by card kind, not measured height; read before writing. **A1** |
| P8 | **State and saves have no ceiling.** `A.S` grows from 2.60 to 5.40 MB in 60 years and the save from 300 to 847 KB; 653 KB of house lore is copied into the state on day 0; looks grow from 170 to 306 KB; the world record from 0 to 220 KB. [eng] | 5 | Derive lore from the seed; pack looks as a short gene string; cap each realm's histories; aim for 400 KB at year 60. **X5** |
| P9 | **Named people only pile up**: 977 become 1,756 in 60 years, and every per-person system grows with them. [eng] | 5 | A target per realm; people off screen as seeds, as 9997 already does for 30,376 captains. **C6, X5** |
| P10 | **Two models run where one should.** v2 diplomacy runs beside the release's, whose dice are muted by flag-wrapped return values, a list that must follow the release's code by hand; three market layers tick; old 0 to 100 stats are derived from the v2 body. [eng, eng-draft] | 5 | Finish each migration and delete the muted path; until then a test asserts each muted function runs only under its flag. **X2** |
| P11 | **Starting a life freezes the page** for 1.7 to 3.3 s in one task with no progress shown; a world is built for the title screen and thrown away; 5,004 events are classified by regex at every boot. [eng, eng-draft] | 5 | A progress line; generate after the player confirms, in a Worker or in slices; event metadata at build time. **A1** |
| P12 | **The war map runs daily for the whole continent whenever any war exists** (`A.wsDay` is 48.7% of an engine month, `A.armyThink` 15.3%), and a war exists on day 0 in both seeds probed. [eng; lead] | 4 | Far wars weekly or abstract; daily only near the player. **D12b** |
| P13 | **Autosave blocks the year turn**: 71 ms of the main thread at year 0, 180 at year 60; `SAVES.put` reads three slots and rewrites four (3.4 MB a save). [eng] | 4 | Serialise in a Worker; a ring index and one write. **X5** |
| P14 | **Load order is folder-name order**, so "last" means more nines (`9990`, `99990`, three `99999-` folders), and features find each other through optional globals (`if (A.WC)`, `A.FAR` for the removed Far Lands). [eng, eng-draft] | 4 | `after:` in a feature manifest, checked at build. **X2** |
| P15 | **The People page is 2,100 to 2,300 nodes of inline SVG from day 0**: 147 to 162 KB of HTML for 18 to 20 portraits, 102 to 176 ms a draw. [eng] | 4 | Portraits as cached `blob:` images by person and age band. **C8b** |
| P16 | **CSS weight**: 56 `<style>` elements, 700 KB, 2,753 rules, 169 `!important`, 62 `:has()` selectors. [eng] | 4 | One generated stylesheet with tokens; purge by coverage. **B5** |
| P17 | **The player record is a junk drawer**: 59 keys at birth [lead], 106 keys and 72 KB at 30; five stores of which events were seen. [eng] | 4 | One life-memory store with a schema; migrate and delete. **X5** |
| P18 | **The World page repaints its ground from noise on every draw** (101 to 257 ms). [eng-draft, not re-measured] | 4 | Cache the ground as an `ImageBitmap` per seed and zoom; redraw only the overlays. **D9** |
| P19 | **Monthly work that is never skipped**: 69 `onMonth` hooks; each roll evaluates all 5,004 event conditions, 826 of them retired. [eng, eng-draft] | 3 | A scheduler with a cadence per system; index events by class and age; drop retired events from the page. **X5** |
| P20 | **Toasts write `--ts-h` on `:root`** (`src/ui/96-moments/toasts.core.js:32,39`): twice a toast the whole document's style is invalidated, and every quiet month ends with one. [eng] | 3 | Set it on the toast stack. **A0** |
| P21 | **Garbage churn**: between presses the browser holds 13,000 to 94,000 nodes for a 2,900-node page, because MOTION's timers pin replaced trees for about a second. It is collected, not leaked. [eng] | 3 | Falls with P2 and P5. **A1** |
| P22 | **A new game has no complete initialiser**: `S.v2dip`, `S.v2w` and `S.v2t` appear on the first day tick, which is the coherency run's "no v2dip" in 8 of 8 lives. [eng, coh] | 2 | `A.newGame` runs the same steps as `A.V2SAVE.upgrade`. **A3a** |
| P23 | 13.4 MB of script text stays in the page (116 `<script>` elements); 9 `keydown` and 8 `click` listeners sit outside `UI.A`'s router. [eng, eng-draft] | 2 | Remove script elements after they run; one key map. **X5** |

### Ranks, posts and coherency

| # | Flaw (concrete evidence) | Severity /10 | How to fix |
|---|---|---|---|
| R1 | **The game has no such thing as a post.** Fourteen stores each say who commands or sits (`pc.mil.rank`, `r.council` with `pc.office`, `armies[].gen`, `divs[].cmd`, 9997's slots, `r.pol.off`, `r.orders`, `S.court`, `p.occ`, `p.title` and more); command is worked out from the grade; nothing ties them together. The owner's Marshal report reproduces on every seed tried, and without forcing in 2 of 5 twenty-year noble lives (seed 101: "Marshal of Aldmark" at 22 as a Squad Captain, then 17 years without an army). [posts, design, world, eng] | 10 | One registry, `S.posts`, with `A.POSTS.appoint` and `vacate` as the only writers; old fields become mirrors; every view reads it (posts map, section 5). **A2** |
| R2 | **A promotion does not hand over the command it announces.** "PROMOTED: Senior Captain. You now lead 800" keeps the same company of 200; a Sergeant (40) and a Squad Captain (100) get no unit, and the squad shrinks from 9 to 6; a Commander holds a battalion and its division at once; a new General gets the second-largest army, and in peace nothing; a Marshal "leads 200,000" in a realm of 104,480 men. [world, posts, design] | 9 | One table of rank, echelon and object, read by the log line, the placement and the War Room. The board picks a post, then appoints; with no post to fill, no promotion. **A2** |
| R3 | **Five roads lead to the Marshal's seat and they disagree.** The court can name a Captain Marshal with no command; the board's Marshal gets the seat but no `pc.office` (no council pay or business), and the sitting Marshal, Garrick Harrow, loses it without a line; accepting the council's offer resigns your commission; a made-up "Marshal of Aldmark" superior stands beside the real one. [posts, world] | 9 | Every road calls `appoint`. The seat carries command of the armies and may take the main army in person. The man displaced is moved, named and resentful, as `takeSeat` already does. **A2** |
| R4 | **Leaving a post leaves it held.** `A.resign`, `A.desert`, `A.imprison`, `A.travelTo`, capture and "Pass the torch" clear `pc.mil` and nothing else: a resigned Marshal keeps the seat and the First Army; a councillor stays captain of a company for 18 years; a civilian commands a division 45 days after resigning. [posts] | 9 | `A.POSTS.leaveAll(pid, why)` from every exit; the deputy acts at once; each way of leaving has its price (honour, regard, the unit's morale; in war, desertion at any rank). **A2** |
| R5 | **A swallowed crash puts two lords in one seat.** `N.regrant` reads `ohd.noble` where `ohd` is null for a house with no head (`src/nobility/99995-v2-nobility/a-court.core.js:362`). Seed 7: three throws in late 1159, each after a house and two or three people had been made, each aborting the month's pass (164 titles skipped); from 1160 the game's own audit reports two lords of Rushzag Oasis for good. Only `console.error` saw it. It is the likely cause of the world sweep's counties "held by dead men for 27 years". [eng; lead: line read; world] | 9 | `ohd && ohd.noble`; decide first and create last; one `try` per title; a regression test from the year-50 state. **A0** |
| R6 | **Death vacates nothing.** Dead councillors sit until the yearly sweep (3 of 8 lives in the coherency run; 39 of 200 world-years); houses stay headed by the dead for years (the Emperor's own, a year on); shire offices wait for New Year; a vacant title points at its dead holder for 3 to 12 months and is shown as held; a dead player keeps his division. [coh, eng, world, posts] | 8 | `A.kill` calls `leaveAll`; the deputy or heir acts the same day; screens say "vacant" or "acting". A check: no post held by the dead. **A2** |
| R7 | **Titles kept as loose text put two holders on screen.** `p.occ` has about 40 writers and one that ever clears it: "Chancellor of Lucerna" sat on two living people, and 15 council and shire titles on people who had lost them, in 3 years of one world. Lore styles never move (a "Doge" beside the ruling Doge; 97 stray "Heir"; a "Lord Marshal" beside the council's Marshal). The family generator invents "Marshal of the levies": 46 such offices in 48 births. [world, posts] | 8 | Stop writing post titles as text; derive the title line from the registry; lore styles become an epithet; relatives get real offices or none. **A2** |
| R8 | **Children hold adult posts.** On day 0 the Chancellors of Kesh, Velgrad, Tamar and Ranpur are 2, 6, 9 and 12 [lead: probe, seed 11]. Elves run on human clocks: court titles at 25 to 46 when elves come of age at 50, and parents "at 20". [world] | 7 | An age rule on every appointment (adult for the race; 24 for a seat, as the player already needs); ages from each race's own tables; a child's seat gets a regent. **A2** |
| R9 | **One person holds posts that cannot go together**: Treasurer and Chancellor at once; Marshal and Chancellor; a Treasurer who rises to "king of the gutter" while seated; 7.7 of 8 Grand Masters also hold a shire office in every year; a Commander is also senior captain of a battalion inside his own division. [posts] | 7 | Exclusive classes and forbidden pairs in the registry's `can()`; taking a post hands over the ones it excludes. **A2** |
| R10 | **A former Marshal starts again as a clerk.** After resigning, the Path reads "Without a post" and offers "Bounty hunter: Old sergeants make good thief-takers" and "start as Copyist · 60 suns/yr". [design] | 7 | Lateral posts by rank (councillor, castellan, an order's commander; watch captain, master-at-arms), a pension and a style. Veterans are offered posts; they do not pick from a menu. **A2** |
| R11 | **The chain of command is invented.** Your superior is a person made up for the role (`A.makeSuperior`), never the real general, division commander or senior captain; your own captain shows as "Former superior" with a "your superior" chip on the same card; the chain shows two marshals. [posts, world, ux] | 6 | `A.superior` is the holder of the parent post; no invented superiors. **A2** |
| R12 | **Peace freezes the ladder.** A Captain sat 79 months "of 16" with every gate met; 4 battles in 20 years of service; nothing pointed him to a war elsewhere, an order or a transfer. [design] | 6 | Peace service counts (garrison command, patrols, war games, a foreign contract); a floor on the board's chance after long service. **D11** |
| R13 | **Splits and conquests strand posts.** A ruler who breaks away keeps titles in the realm he left (11 cases); one person sat on two realms' councils for ten years; realms born in play never get a council (8 of 42 realms had five empty seats at year 60). [world, posts, eng] | 6 | Realm birth, fall and split call the registry in one step: re-home or abolish the titles, fill the new council. **A2** |
| R14 | **Rank words disagree on one screen.** The profile says "Sergeant" while the story says "Rank 2 of 4, a captain"; a "Squad Captain" who "leads 100" has a squad of 9; a Commander who "leads 3,200" is told "take your regiment (400)"; a bride is "Sunniva Harrow, a lord". [ux, design] | 6 | Every panel reads `holderOf(post)` and the unit itself; one glossary per realm with gendered forms. **A2, D11** |
| R15 | **Phantom and doubled officers.** A division with no commander gets a name hashed on the spot (`A.oobLeader`): he cannot be met and never dies. When the player leaves a slot it falls back to its seed, so there are two "Corbin of Amberwick, Captain of the 3rd Company". [world, posts] | 5 | A seed is spent when it becomes a person; every command shown has a stored person. **A2** |
| R16 | **Every new post reads "Months in your current post 333 / 11"**: a post with no start date is read as `absDay − 9999` [lead: default read in code], so a new squire or farmhand starts past the tenure gate. [design] | 5 | Set the date at hire; show it in words ("since spring 1105"). **A2** |
| R17 | **Jobs are ranks without places.** "A post falls vacant" is always true; when you become Guild master your old boss stays Guild master; honours such as "Warden of the march" are flags beside 9996's real wardens. [posts] | 4 | The top rank of a guild, a see or a merchant house becomes a post (the registry's later phase); the rest stay grades. **A2** |
| R18 | **Garbled lines at the moment that matters**: "The board's reason: for ." prints an empty deed; "You leave 1st Northmoor Lances after 1 years as Marshal" names a Marshal's unit as his first company. [world] | 4 | Skip an empty reason; a plural helper; name the post actually held. **A2** |

### Interface and clutter

| # | Flaw (concrete evidence) | Severity /10 | How to fix |
|---|---|---|---|
| U1 | **Descriptions still open on hover.** `TT.init` listens for `pointerover` (`src/ui/59-tooltips/tt.engine.core.js:240`): 12 of 12 anchors opened on hover within 250 ms. Another 154 `title="` sites hold real descriptions (every activity, traits, skills, price reasons) that never show on touch; an adult's Life page has 52 anchors and 42 long titles; the map canvases use mouse-move tips. [ux; lead: listener read] | 9 | Delete the hover paths; keep click, tap and Enter. One affordance everywhere: an ⓘ with a 44 px hit area, or the underlined term as a button. Move each descriptive `title` into it. A lint and a hover test. On maps a tap selects and opens a card. **B4** |
| U2 | **Clutter.** A desktop's first view holds a median 520 words and 51 controls (165 pages), and 360 of the words are the fixed top bar, profile and story: 8 to 38% belong to the page you opened. A phone's first view is fair (146 words, 31 controls) but pages run long: Story 8.6 screens, People 5.5, Holdings 5.4 with 109 controls. "On this page" chip menus (12 on Life) and "Open every section" on 9 of 14 pages patch over it. [ux] | 9 | Budgets held by a test: phone first view at most 120 words and 12 controls, desktop 250 and 25, no action page over 3 screens. The UX report's first-glance table says what each screen keeps. **B5** |
| U3 | **The desktop starves the page you opened**: profile 248 px, story 598 px, page 486 px at 1366 (28% of the screen); at 1920 the page gets 598 px beside an 804 px story; the market's six columns sit in 462 px. [ux; lead: screenshot] | 8 | Two zones: a rail of 280 to 300 px (portrait, name, age, four vitals, the time buttons, the three newest lines) and the page. The story becomes Life's feed and a drawer; a third column only from 1600 px. **B5** |
| U4 | **Screens ignore age, class and rank.** A peasant of 9 has an Arms page listing the elite orders with "Ask to join"; a newborn sees "See a physician", "Looks homely · Honor decent" and "0 suns"; a father's card offers "Insult" and "Pick a fight"; a Chancellor is told "Find work"; a Captain of 200 is offered "Hire out for a season"; a child of 12 gets "Burgle a house" on the first screen of tiles. [ux, design] | 8 | One `UI.scope(pc)` (stage of life, station, post, deployed or not), read by `UI.GROUPS`, every page section and `A.canAct`; a persona test with forbidden strings. **B5** |
| U5 | **"Five places" hide about 60 surfaces.** World on a phone puts 20 buttons above the map (5 sub-tabs, 8 views, 7 map modes, with "Diplomacy", "Realms" and "Wars" in two rows meaning two things). There are 14 pages, 9 Codex sections, 5 realm views, the War Room's tabs and about 15 overlays; the map appears in five places in three renderings. [ux] | 8 | World is one map with a mode menu, plus Realms and Chronicle; Places folds into the map; the Codex becomes a searchable, linked encyclopedia opened from any term. **B5, D9** |
| U6 | **Help describes an older game.** How to play opens "Six tabs. Life… People. Path & War… Holdings… Realm… Chronicle"; text says "War tab" 11 times (at peace the page is "Arms") and "(Work tab)", which does not exist; phone hints cite keys ("Press Next month (N)"). [ux; lead: "(Work tab)" seen in a year-25 story] | 7 | Generate help and cross-references from `UI.GROUPS`; lint any "X tab" not in it; key hints only where there is a keyboard. **B5** |
| U7 | **The percent-to-words sweep rewrites the interface itself.** Text size options read "all / more than all / 1.5 times over / 2 times over"; "Show exact odds on choices" is a dead checkbox (`A.DIFF.showOdds = () => false`); a faction has "about two in five of the power" above a Power bar that reads "none". [ux] | 7 | Write words at the source and delete the sweep (P7); label the sizes Normal to Largest; remove the odds toggle. **A1, B5** |
| U8 | **The desktop card is not focused.** It docks in the middle column while the profile and the page stay lit: 837 words are visible and 96 are the card's; the lit columns are dead under a transparent layer; a hint banner sits above the card; with four choices the last two fall below a 768 px fold. [ux] | 7 | Dim the rest, as the battle dialog already does; cap the art at 120 px; show every choice at 768 px; put hints in the card's footer. **B5** |
| U9 | **Activities commit on one tap, explain themselves only on hover, and answer with a clipped toast** (`r.msg.slice(0,137)+"…"`). An adult's Life page has 29 tiles, "Plot to seize a throne 3⧗" among them; "Fund a trade venture" spends 2⧗ to say "Your market and the trade roads are on the Holdings tab." [ux, design] | 7 | A tap opens a sheet (what it does, cost, odds in words, risk, "Do it"); the result is a card or a story line, never cut; six suggestions and "More"; a tile that only points somewhere is free. **B4** |
| U10 | **Creation hides the character.** With "Newborn" chosen the preview is a grown man headed "(A NAME FROM YOUR PEOPLE)"; realm is a select reading "Empire of Aldmark — 9,234,000 humans"; "Be born: a human child of Aldmark" never says peasant; faces are text buttons "Shape 1–4"; on a phone the preview sits under a three-screen page; step 2 has 70 targets under 44 px. [ux] | 7 | A preview that stays in view and is true to the chosen age; swatches with faces; realm picked on the map with a one-line pitch; class and face on the quick-start cards. **B5, C8b** |
| U11 | **A red "!" for unread story lines**, the same mark as war (`UI.tabBadge` in 71-phone); Life and Story wear it nearly every month. [ux] | 6 | Red for danger only; unread story gets a small neutral dot. **B5** |
| U12 | **Abbreviations and raw numbers** against "words over numbers": "TREASURY 3.8M suns · ARMY 104k", "INS up · INT up", "+2 SPD, -2 STR", "7.0 /7", "armor 8", "Learning 21 of 60", "Needs Bows 40 (you have 0)", "Your superior thinks poorly of you (-24)", "(You recover 41082 of the 58688 suns.)". [ux, design; lead: screenshot] | 6 | Words first; stat names spelled out; exact figures, and the v2 spec's real units, one click deeper; one coin formatter. **B5** |
| U13 | **Tablets get the mouse layout.** Phone styles stop at 760 px: at 768×1024 the top bar wraps, the name clips to "SVALA RA…", and Next month is a 150×32 px button at the top of a touch screen. [ux] | 5 | The phone shell on coarse pointers up to 1024 px, with a two-column page. **B5** |
| U14 | **The game's own 200% text setting breaks the phone**: the date clips to "Janu…", up to 39 labels clip on one page, and hint text does not scale. [ux] | 5 | All type in rem; bars wrap; a test at 200% that finds no clipped label. **B5** |
| U15 | **Truncation and cramped headers at 420 px**: "Wants your com…"; a five-line paragraph squeezed beside "THE ELITE OF ARDAN"; on a desktop "7.0 initia…". [ux] | 5 | Summaries under headers; chips with a maximum width that open in full on tap. **B5** |
| U16 | **Coming back to a life**: with a save, "Continue" is the third button, in the secondary style; the default difficulty is called "Hard" and shows "Score ×1.00"; Mods sits on the title screen. [ux] | 5 | Continue first, with portrait, name and age; levels named Gentle, Normal, Harsh; Mods into Settings. **B5** |
| U17 | **The menu is a settings dump**: 31 controls in one scroll mix Save and Load with art toggles and developer items ("Playtest mode", "Classic event pool… 826 small one-off events are retired"); there are two portrait switches. [ux] | 5 | Menu: Resume, Save, Load, Settings, Help, Quit; settings in four groups; developer items behind a URL flag. **B5** |
| U18 | **The phone hides your age**: the top bar reads "January 1109 · ⧗ 7.0 · 4,659 suns". [ux] | 5 | "Age 9 · March 1105" on the time row. **B6** |
| U19 | **Map and War Room chrome is written for a mouse**: "Hover for details, click to select a realm." on a phone; a legend that must be studied ("EDGE… STRIP… BARS… Banner = realm (3-letter code above the number)"); Next day and Next week shrink to icons with no label. [ux; lead: legend seen] | 5 | Captions that know the pointer; the legend behind ⓘ; labelled buttons. **B4, D10** |
| U20 | **Too many goal systems and no spine**: an ambition, chapters (three aims every eight years), life arcs, What now, Decisions and achievements; a soldier's ambition, "master learning", closed at 18; a peasant child's chapter is "The Long Muster". [design] | 5 | One stack: the life's ambition, the chapter's aim, the next concrete step on the Path; arcs fold into chapters. **B5** |
| U21 | **Keyboard order**: the first control of the open page is stop 32 of 75, and there is no skip link. [ux] | 4 | A skip link; one "Profile" stop in place of 19; arrow keys inside tile grids. **B5** |
| U22 | **Fixed bars on small phones**: at 360×640 the bars take 229 px, and a profile card and a hint come before any content. [ux] | 4 | Sub-tabs scroll away with the page; hints become one-time coach marks. **B5** |
| U23 | **Slashed zeros everywhere**: "11Ø5", "Ø suns". [ux] | 4 | Dates, money and ages in Literata with old-style figures. **B5** |
| U24 | **Duplicate surfaces**: What now's "Live the next month" repeats the time button; The Book retells the story; Holdings repeats last year's table. [ux] | 4 | One place per fact. **B5** |
| U25 | **Story colours carry meaning with no legend** (green, red, amber, grey, italic). [ux] | 4 | Icons, a legend, and filters (Mine, Family, Realm, Rumour). **B5** |
| U26 | **Decisions explains the interface** ("There are no quest lists in Ardan…") and also holds "Design your arms" and "Name your blade"; "Decide" shows when a requirement is unmet. [ux] | 4 | Cut the paragraph; heraldry moves to Dynasty; show what can be decided now. **B5** |
| U27 | Small things: "Keep this", "Keep this page" and "Keep this life" never say what keeping does; the top bar's Save is an unlabelled seal in a game that saves itself; the Path's promotion board fails axe (four targets 17.9 px tall, a button with no name); laws change on one tap and "Leave the army" asks no confirmation. [ux] | 3 | "Add to your chronicle"; Save into the menu; 24 px targets with labels; preview, then confirm, whatever cannot be undone. **B5** |

### Time and pacing

| # | Flaw (concrete evidence) | Severity /10 | How to fix |
|---|---|---|---|
| T1 | **Time moves only by the month.** A newborn's first 48 months brought 3 cards and 45 empty presses (seed 5) [lead: probe]. A peasant's first twelve years took 155 presses, 129 of them empty, with "A month of milk and sleep." for two years [design]. v1 had a childhood speed-up (`src/events/82-early-years`), dropped when the Play button went. | 9 | Two buttons, Next month and Next year; the year is the gold one under 14; it stops for what needs you (D-008 and the UX report's specification). **B6** |
| T2 | **The time button changes meaning.** While a month runs it turns into a stop button that reads "The month passes" (`data-a="stepStop"`, `src/core/99992-v2-time/time.core.js:327`; the N key at line 421). Pressing N twice, 200 ms apart, ended the month after 7, 11, 15 and 20 days with no word said. While a card waits it reads "▷ Go on", lies under the modal and cannot be clicked. [ux; lead: code read] | 8 | While busy the button keeps its label, is disabled and shows progress; nothing stops a month; Esc stops a year at the month's end; the control hides while a card is open. **B6** |
| T3 | **A year through today's stepper would cost 27 to 46 s on a desktop** (1,604 forced layouts), and about 19 s of CPU in P1's mode; the engine runs the same year in 0.75 to 1.3 s. 84-top-bar still carries `week`, `season` and `until` steps whose actions 99992 deleted. [ux, eng] | 7 | Compute, then paint once: run the days without `UI.clkLight`, with one refresh at the end or at a card; add a `year` kind to `UI.stepTarget`. **A1 with B6** |
| T4 | **Death comes without warning.** Marsh fever killed a banker of 41 on 1 January; his health read "hale" the January before and still reads "hale" on the death screen; no illness card, no treatment, no last scene, though 49-body-mind promises them. [design] | 7 | A fatal illness is an arc (onset, worsening, treatment, last wishes) that health shows. **X3** |
| T5 | **A year step would waste a year's initiative**: ⧗ caps at 7 and "stops filling until you spend some" (`src/ui/996-coming-up/coming.core.js:120`). [lead: code read] | 6 | "Your days" spends it during a year, or the year stops when it is full; the owner chooses. **B6** |
| T6 | **The calendar is not respected.** A feast is `A.pick(GD.FESTIVALS)` in any month [lead: code read]: "You go to Spring Equinox" in August; "The May hiring fair… 1 May" on 24 November; "on the shortest night" in April; harvest wages on 17 May. [design] | 6 | Offer a feast only on its date (Coming up already knows it); a month window in the `cond` of dated events; a lint. **X3** |
| T7 | **One button prints money and mastery.** "Lend money at interest" (1⧗) stakes 40% of the purse and pays 1.08 to 1.25 times at once: 36 wins in 37. Trade went from Apprentice to "Legend, 50,000 hours" between the ages of 22 and 31, at +2 a click; a peasant of 18 is "Expert, 8,291 hours" in Letters. [design] | 6 | Loans run for months with named debtors who can default; returns match risk; repeated gains decay. **X4** |

### Relationships and family

| # | Flaw (concrete evidence) | Severity /10 | How to fix |
|---|---|---|---|
| F1 | **A newborn is handed the whole clan.** Relationships at birth hold 15 to 42 people in every class. A peasant (seed 11) has 25: father, mother, 1 sibling, 4 grandparents, 5 uncles and aunts, 5 in-laws, 8 cousins; a noble (seeds 1 and 42) has 26, with 10 uncles and aunts [lead: probes]. Of 893 links in 48 births, 84% are extended kin [world]. `src/family/99994-v2-family/b-family.core.js:127-184` links every generated relative, and the skill `life-sim-systems` tells it to. The page says "These are the people you have chosen to know". | 9 | The tree holds kin you know of; relationships hold people you know: parents and siblings, and a grandparent only under the same roof. The rest enter through a scene (a visit, a funeral, a wedding, fostering). Fix the skill. **C6** |
| F2 | **A noble child has no household.** In 42 starts (7 classes × 2 ages × 3 seeds) no relation is anything but kin: no wet-nurse, nurse, maid, tutor or guard knight for any noble or royal. [design, world; lead: probes] | 8 | Seed the household by station: a wet-nurse and nurse, a maid, a tutor from 6, a guard knight, a chaplain; a royal adds household officers. They are commoners with lives of their own. **C6** |
| F3 | **Events invent family.** `lf_sib_cover` has no sibling check and `sibOf` makes one (`known(p,["sibling"],…)`) [lead: code read]. An only child of 9 covers for "your sister Sunniva", born with no parents; a man with no siblings gets "your brother Hamo Carrholt", with another house's surname; "Ysolde, who you played with every day" dies unmet; a royal gets a peasant "Sister". [design, world] | 7 | `known()` fetches kin and never mints them; a missing relative drops the card; a lint: a kin token needs its helper in `cond`. **C6** |
| F4 | **Impossible relatives where a great house meets the generated family.** "Gudrun Ambersley — Aunt · 65" beside a grandfather of 45, who is himself "Heir" to "Elfa Ambersley — Aunt · 42 · Head of the family": a grandfather heir to his own daughter. 12 relatives stand outside the tree in 16 noble births; "Male-preference primogeniture" with an aunt as head while the father is "Heir". [world, design] | 7 | Build the player's parents inside the house's existing tree; one resolver for head and heir; a house member outside the tree reads "of your house", never "Aunt"; validate at generation. **C6** |
| F5 | **The named world is four-fifths noble.** Of 998 living named people on day 0, 731 are noble and 89 royal; there are 142 artisans, 25 peasants, 11 gentry, and no serf, slave, priest or soldier [lead: probe, seed 11]. A commoner has almost no commoners to meet, so "people enter through what you do" has nobody to draw on. [art] | 7 | A parish of named commoners around the player (priest, reeve, miller, smith, midwife, the neighbours' children), held as seeds until met. **C6** |
| F6 | **"Make a friend" is a vending machine.** Each click mints a stranger and flips a coin for friend or acquaintance; a child of 4 made three friends aged 14. [design] | 6 | "Spend time with…" people you already meet through work, school, temple and the lane; children meet children; a stranger arrives through a scene. **C6** |
| F7 | **Births have no clock.** Married to a stranger on 31 December, a daughter two days later; all 6 births seen fell on 1 or 2 January. [design] | 6 | Conception, then nine months; a child conceived out of wedlock is its own secret. **C6** |
| F8 | **The People page repeats and misreads people.** The same kin sit under "Kin of note 10" and "Family (12)"; a grandfather "Wants money" from a newborn; "Kettil — Brother · 2 · Infant — Wants respect"; a father is only "Friendly" while an uncle of 18 is "Close"; dead grandparents hold an opinion of 74. [ux, world] | 5 | A Household block with faces and one mood word; wants by age, and none shown to a child under 6; parents start close; the dead go under "Remembered". **C6** |
| F9 | **The family tree is not a tree**: rows by generation, no lines, your own row last. [ux-draft] | 5 | Centre it on you, with connectors; cousins collapsed under their parent. **C6** |
| F10 | **The person card leads with combat and lore.** The first chip under a father, and under a courtier's own name, is "less than one levy"; a column rates a fight with your father. [ux] | 5 | Lead with relation, age, trade, mood toward you, what they want and three actions; fight data only for soldiers and rivals. **C6** |

### Names, cultures and world

| # | Flaw (concrete evidence) | Severity /10 | How to fix |
|---|---|---|---|
| N1 | **One culture per realm.** `A.cultureFor(race, realm)` returns one culture for a whole realm: 76 of 76 named people in Aldmark are Northfolk and 55 of 55 in Varenna Solenfolk [lead: probe]. Corvasse, "a mixed people of every coast", is 24 Corsairs and 1 orc; breakaway realms come out Northfolk whatever they left. No port, trade city or border is mixed. [world] | 8 | Culture by province and by person: ports and market towns draw 15 to 35% of births from trade partners, borders 20 to 40% from the neighbour; marches use Marchfolk; a person's origin sets the style of name and surname. **C7** |
| N2 | **Three name pools serve Europe.** Northfolk (Leofric, Ranulf, Gudrun, Anwen and Isobel in one list) names five realms, among them jarl-ruled Northreach and Gaelic-named Brannoch; the Italian Solenfolk list names six, among them French-named Solenne and English-named Morhaven. The owner's "mostly European" majority is the thinnest part of the name data. [world] | 7 | Split Northfolk into Anglo-Norman, Norse, Gaelic and Low German; Solenfolk into Italian, Occitan-French and Byzantine Greek; add the pools the map then needs. **C7** |
| N3 | **One European ladder for every people**, against the game's own realm bible. Sylvaran's lore says "no counts or dukes" and it has 2 dukes, 4 marquises and 22 counts; Brannoch ("no king, no lords") has a marquis and 4 counts; the merchant republics get counts and viscounts. [world] | 7 | Rank words and the shape of each pyramid from `LORE.titlesByRealm.forms` (jarl and thane; emir; chief of a Wind; eldest of a hall; great families for the republics). **C7, on A2** |
| N4 | **Fiefs named in another people's language**: "Viscount of Bramham: Yusuf Jamali" (Qadir); "Viscountess of Ashford: Wema Pwanari" (Kesh). Elves get French syllables and dwarves Mongol ones; "Valcieux" names two fiefs in one realm; "Baron of Ashford:  Mentis" has no given name. [world] | 7 | Name fiefs with each realm's own place-name maker, unique within the realm; never fall back to an empty name. **C7** |
| N5 | **Thirty names per sex make twins.** Each of the 24 cultures has exactly 30 male and 30 female given names [lead: probe]. One town of 48 named people has four "Wynn of Kingsmere"; 5 of 48 newborn families hold two living relatives with one full name; "Sewald Harrow" is both an uncle and a cousin. [world, design] | 6 | 80 to 150 names per sex, weighted by how common they were, plus bynames, patronymics and trade names; no clash within a town or among siblings and first cousins. **C7** |
| N6 | **Realm names contradict their governments.** The "Kingdom of Ulun" is a Khan over nine tribes; the "Kingdom of Brannoch" has "no king, no lords"; the "Principality of Corvasse" elects a Captain-General; the "Ughrak Dominion" is a league of 31 clans. [world] | 6 | Khanate of Ulun, League of Brannoch, Free Port of Corvasse, the Ughrak Clans; or change the governments. **C7** |
| N7 | **One council for 34 peoples.** Every realm has a Chancellor, Marshal, Treasurer, Spymaster and Chaplain ("Chaplain of Gorath", "Spymaster of Frostholm"), though `LORE.titlesByRealm.command` names each realm's own (Hirdmaster, Fleet-Warden, First War-Captain). [world] | 5 | Seat names per realm from that field. **C7, on A2** |
| N8 | **Mixed peoples that are not mixed.** The Corsairs draw only English pet names (Hob, Moll, Peg); Marchfolk, the one culture written for mixing, lives nowhere; the Codex lists Leaf People and Cloudfolk who have no place on the map. [world] | 5 | Corsairs draw from the four coastal cultures plus nicknames; Marchfolk in the marches; hide or place the rest. **C7** |
| N9 | **Two pools outside Europe are careless.** The Zanari mix Swahili, Akan, Yoruba, Igbo, Shona, Zulu, Kikuyu and Ethiopian names for an empire modelled on Mali; the Ranpuri have twentieth-century given names (Manoj, Sanjay, Sunita) and caste-trade surnames on nobles. [world] | 5 | A Manding and Soninke pool for Zanara; medieval Sanskrit and Prakrit names, with clan names for Ranpur's nobility. **C7** |
| N10 | **Style words ignore sex and office.** Women are styled as men 42 times ("Lord of Foxhurst", Hawise Blackthorn); reigning women get consorts' words (Sultana, Dogaressa, Khatun); `r.title` stays "Queen" for a king in 57 cases; "Garrick Harrow, Lord of the Southern March" holds the County of Copperham (82 such mismatches). [world] | 4 | Styles computed from what is held, with regnant and gendered forms. **A2, C7** |
| N11 | **The world's scale is not medieval**: "Kingsmere (forest, 1,327,225 people)"; "Larkton Tower (steppe, 225,737 people)"; the elf realm is listed as "27,300 humans". [design] | 4 | Towns of 1 to 60 thousand; show the province's people apart from the town's; count each people under its own name. **C7** |
| N12 | **The lore has islands and the map has none** ("the Corsair Isles", "Three-Isles", "island spice growers"), and three peoples share Old Norse names (Kettil is Northfolk and dwarf; Torvald is dwarf and giant). [world] | 4 | Rewrite the notes for a coast; give dwarves and giants their own sound. **C7** |
| N13 | Small things: invented culture words clash with the real-language names beside them; house names are raw nouns ("Siput", snail; "Mnazi", coconut palm); 11 of 34 realm names are English compounds, with two -havens, two -deeps and two -holds; Codex stereotypes ("Leaf People: small forest hunters… they avoid outsiders"; an orc called "Bolg"); two men carry women's names in 11 worlds. [world] | 3 | One language per people for words and names; lineage names; each realm's own name with an English gloss; write peoples, not curiosities; fix the generator that ignores sex. **C7** |

### Characters and art

| # | Flaw (concrete evidence) | Severity /10 | How to fix |
|---|---|---|---|
| V1 | **One face for everyone.** Every bust is the same oval with the same eyes, nose tick and mouth stroke from 12 to 80; identity is hair colour, a hood and the frame. Cover the hair and 24 random people cannot be told apart; a slave father of 58 and a noble father of 56 from different worlds are one drawing in two tunics. [art; lead: sheets looked at] | 10 | Faces from 15 to 20 continuous genes with real range (jaw, cheekbone, chin, eye spacing, tilt and lid, brow ridge, nose length, bridge and tip, lips, ears, face length), stored on the person and blended from both parents. Accepted on a cover-the-hair sheet. **C8a, C8b** |
| V2 | **Class is unreadable below the nobility.** Slave, serf, peasant, artisan, merchant and gentry wear one crew-neck tunic in a hashed colour: no collar, rags, coif, guild hood, chaperon, purse, fur or signet. The only cues to class in the game are patches, an apron, a gold frame and ermine. [art; lead: class sheet] | 9 | A dress table by class, culture, wealth and role: undyed cloth for the unfree, tools for artisans, dyed wool and fur for merchants, strong dyes only from the gentry up. Accepted on a class sheet with the labels hidden. **C8c** |
| V3 | **War leaves no marks.** The v2 battle's "you take a wound to the face" takes 7 health and logs a line; it never writes `pc.wounds` (`src/war/99997-v2-war/b-battle.core.js:256`) [lead: code read]. Of 998 living people on day 0, none has a wound [lead: probe]: every veteran, knight and old marshal has a clean face. [art] | 9 | Wounds from battles, duels and accidents write `p.wounds` with a place and a year; soldiers and knights start with scars by years served. **C8b** |
| V4 | **The stored face genes do almost nothing.** The jaw moves by `[0,-1.5,1.5,-2.5]` units of 100 (`src/ui/93-anime-portraits/anime.core.js:570`), the mouth by 0.9 to 1.1 times, the nose by 0.82 to 1.2; 16 variants of one man look the same at 120 px. A person has 14 appearance keys, most of them hair, beard and paint. [art; lead: line and keys read] | 8 | Widen every range four to six times and add shapes, not only widths: hooked, snub, broad and broken noses; lid types; lip shapes. **C8b** |
| V5 | **Men read as women.** 12 beardless men and 12 women mixed at 88 px cannot be sorted; "Cuthbert… he is suing you" shows a long-haired, green-eyed girl. [art] | 8 | Differences by sex from the mid-teens: brow ridge, jaw, neck, eye size, lashes, shoulders. **C8b** |
| V6 | **Nobody ages between 12 and 60.** A woman at 12 and at 50 is one drawing; a man changes only by his beard; at 60 grey hair and two creases arrive but the child's eyes stay; an elf at 5 and at 350 is the same; a First Minister of 48 is drawn as a girl with a bob; every race's baby is the human bundle recoloured. [art; lead: the ages sheet and a year-25 screenshot] | 8 | Age as a continuous change: eyes shrink and lids drop from 25, folds from 30, jowls at 45, thin hair after 50, bone at 70; three infant drawings per people. **C8b** |
| V7 | **Soldiers don't look like soldiers.** After enlisting, a man with mail, helm and shield is a bald man in a striped top; a knight in plate and greathelm reads as a long-haired civilian. [art; lead: class sheet] | 7 | The bust shows the military layer (gambeson, coif, kettle hat pushed back, the charge on the chest) and a badge for the arm of service. **C8c, D11** |
| V8 | **Build, height and weight do not show.** Slight, muscular, heavy and stout give nearly one mannequin; 150 cm and 195 cm fill the same frame. [art] | 7 | Scale the figure inside a fixed frame; build drives shoulders, waist, neck and limbs (width 1.0 to 1.6); fat shows in the face. **C8b** |
| V9 | **Lists of people are walls of clones.** The family overlay is about 20 identical busts in identical gold frames and one house tunic. [art] | 7 | Falls with V1, V2 and V16; add the relation on the frame and the age in its tone. **C8b, C8c** |
| V10 | **Expression is random, not character.** Closed-eye grins sit on a slave father of 58 and a royal alike; nothing in a face tells a cruel person from a brave one, and the owner asked for personality. [lead: sheets; art] | 6 | Resting expression and bearing from temperament and mood (the set of the brow, the line of the mouth, gaze, tilt of the head); no default grin on the unfree, the grieving or the old. **C8b** |
| V11 | **Every great moment is announced like a prize.** Cut-ins use one tilted band, paint splat and speed lines for VICTORY, a birth and a levy's death. The anime look is the owner's own order; the fault is its register, child-like and festive for a chronicle of serfs and succession. [art; lead] | 6 | Keep anime and let it grow up (older proportions, real noses, weight in the line); a tone per kind of cut-in: a seal for a victory, a tolling bell for a death. The owner picks the register in C8a. **C8a, C8c** |
| V12 | **Five hands in one game**: night-blue and gold chrome, child-faced portraits, Japanese-print skies, a satellite map, a vellum Chronicle. With the text blurred, only the chrome says "Ardan". [art] | 6 | One art bible: line weight, palette and label style shared by portraits, map overlays, the battle field and the prints. The anime look and the satellite ground both stay. **C8a** |
| V13 | **Hoods hide the one thing that differs.** 4 of 10 card people are hooded, and about 30% of the class sheet, indoors and at every age, a child of 5 included. [art] | 6 | Hoods by context (outdoors, weather, travel, clergy) and by culture; never in lists or the tree; hair shows under a coif. **C8c** |
| V14 | **Muttonchops draw as a muzzle** across the mouth and jaw; 64 people in one world wear them. [art] | 6 | Two cheek masses that stop above the corners of the mouth; an image test. **C8b** |
| V15 | **Dark skin loses the face.** Feature lines are the skin mixed towards the ink, so their contrast falls from 3.6:1 on the lightest skin to 1.16:1 on the darkest; nose, mouth and creases vanish. [art] | 6 | Lighter rim lines on dark skin; a test that holds feature lines at 2.5:1 or more. **C8b** |
| V16 | **Crude regalia and paper-doll figures.** A royal collar carries an "O" pendant like a life ring; a whole noble family wears one olive tunic; a duelist stands in crown and ermine with no sword drawn; a greathelm sits at a knight's feet like a bucket; a court squire wears mail and a kettle helm; stick limbs fill a third of the frame. [art] | 6 | Livery for retainers only; a jewel by rank; arming clothes for a duel and court clothes at court; real garment shapes that fill 60% of the frame. **C8c** |
| V17 | **Event pictures show the wrong subject.** A farming offer shows a forge; a cow in a ditch shows a bedroom; a tax collector at the door shows a lone pine. 25 compositions serve the whole event set. [art] | 6 | Tag events with a scene and a prop; about 60 compositions for the common verbs (field, market, church door, steward, road, green). **C8c** |
| V18 | **Eye colours are neon.** Stored colours are pushed to 0.7 to 0.78 saturation: olive draws as lime, and 67 of 137 Solenfolk have lime-green eyes. [art] | 5 | The stored colour with at most 15% more saturation and a darker ring; vivid irises for elves only. **C8b** |
| V19 | **The prints repeat and break scale.** Eight interiors share one wall, one window and one faceless cone figure; a pine branch frames the desert and the jungle; the castle is the size of a tree; "errand" has a street lamp. [art] | 5 | Interiors by class; a silhouette of the real role; a grid for scale; framing by biome. **C8c** |
| V20 | **Cut-ins run over the reading text** with only a light dim, and one fired during a render can be lost. [art] | 5 | Their own band over a 50% scrim, mounted outside `#app`. **B5** |
| V21 | **A "scarred" quirk draws a slash across a newborn's face.** [art; lead: ages sheet] | 4 | Scars are wounds with a year. **C8b** |
| V22 | Small things: the dead are a grey filter and a "+"; a forced death's obituary reads "of unknown causes"; the Chronicle's body is set in the interface's sans; four icons misread (the mirror as ♀, the broken coin as a B, the road as a pylon, the stock "users" glyph). [art] | 3 | An ink-wash memorial plate; Literata or a book face on the vellum page; redraw the four. **C8c** |

### Map

| # | Flaw (concrete evidence) | Severity /10 | How to fix |
|---|---|---|---|
| M1 | **The map has no roads, fords, bridges or passes.** Nothing in `src/map/99991-v2-map`, `src/map/62-inked-map` or `src/map/engine` draws or stores one; the road graph of `src/economy/9995-trade-roads` is `.wip` and ran only on the removed Far Lands [lead: files read]. Province borders are double dashed lines that read as roads. [art] | 9 | A road graph (least-cost paths between towns over slope and water, in two ranks); a ford or a bridge at each river crossing; a named pass where a road crosses a ridge; trade routes as their own line; borders drawn so they cannot be taken for roads. **D9** |
| M2 | **Terrain is one word per province, and the word means little.** The war reads one attack multiplier and one width per province (hills 0.78, forest 0.85, marsh 0.65, mountains 0.55) [lead: table read]. 125 of 306 provinces are "hills" in each of three seeds, 85 to 100 are forest and 5 to 20 plains [lead: probes]. Rivers, fords and passes do not exist for movement, supply or battle. This is the owner's "the tile map flattens tactics and terrain". [design, art] | 9 | Ground as data the game reads: features inside a province (woods, marsh, a ridge, a river line, walls) and on each border (the road's rank, the river crossing, the pass). Movement, supply, ambush, frontage and battle read them, and the report names them. **D9** |
| M3 | **Rivers carry no meaning.** Towns are seeded at random on land under a spacing rule (`makeProvinces`, `src/map/engine/continent.js`), not on rivers, confluences or coasts [lead: code read]. At zoom 6 two hairlines cross a realm with no tributary, lake or delta. The engine does hold flow and river paths to the sea, so the data is there. [art] | 7 | Site towns on rivers, confluences, fords and harbours; draw tributaries, wider downstream; rivers carry trade and stop armies. **D9** |
| M4 | **Places ignore the ground they stand on.** Every seed has 22 "oasis" provinces and 6 caravanserais; seed 1 has 2 desert provinces [lead: probe]. "Gorur Caravanserai" is on tundra and "Vrakhul Oasis" on taiga; 10 to 13 provinces are tropical rainforest and 47 to 58 savanna, on a continent meant to feel like medieval Europe. [art] | 7 | Guarantee the climate bands the realms need (a cold north, a steppe, an arid south) and seat each realm on its own kind of land; name and type a place from its ground. **D9, C7** |
| M5 | **Realm colours cannot tell realms apart.** The realm records hold 16 colours for 34 realms, each shared by two or three (Aldmark's `#b5c99a` is also POL-23's and POL-33's) [lead: probe]. All are pastels, and a 28% tint over the ground vanishes in the middle of a realm. [art] | 7 | Twelve hues in three steps of lightness, assigned so that no neighbours share one; fill the whole realm in Realms mode; arms at each capital. **D9** |
| M6 | **The ground blurs when you zoom**, with cloud-white blobs along the coast at zoom 6 [lead: screenshot]. The satellite look is the owner's v2 order; the smear is the fault. [art] | 6 | Hillshade at native resolution for close tiles; drop the surf blobs; crisp vector layers on top. **D9** |
| M7 | **Nothing is named but realms and towns**: no sea, gulf, range, forest, river or region, and no scale bar. [art] | 6 | A label layer: curved text along rivers and ranges, spaced capitals for seas, a scale in leagues. The names exist in `LORE.map`. **D9** |
| M8 | **The War Room is crowded and wears modern marks.** Counters overlap counters and town names at 420 px; orders are straight white lines from centre to centre, like cables; units carry NATO-style frames. Its painted ground is better than the main map's. [art, ux-draft; lead: screenshot] | 6 | One map component for every map; counters stack under a badge; orders follow roads; banners instead of frames. **D9, D10** |
| M9 | Small things: two mode buttons lit at once ("Realms" and "Faiths"); a dark strip down the left of the canvas at zoom 6; the compass rose covers the south-east coast. [art, ux-draft; lead: screenshot] | 3 | A single-select group of modes; fit the canvas; move the rose out to sea. **D9** |

### War and military

| # | Flaw (concrete evidence) | Severity /10 | How to fix |
|---|---|---|---|
| W1 | **Battle choices ignore the battle.** `W.choices = b => VW.CHOICES[b.rank]` (`src/war/99997-v2-war/b-battle.core.js:205`) [lead: line read]. A Squad Captain got "Keep the squad tight / Plug the gap in the line / Pick off stragglers" in Skirmish, Clash, Press and Decision alike, in a mountain pass against horse and on hills against levies; each phase reports "Your side loses a handful, theirs a handful"; one choice was "a certainty". [design, ux] | 9 | Three choices a phase, built from arm, ground, enemy, phase and weather (spears against horse: "ground the butts and brace"; archers in rain: "keep the strings dry"); the fixed list only as a fallback. **D12b** |
| W2 | **The arm of service is a label.** Enlisting is one click and a toast ("Squad Captain among the spearmen", said to a trained lancer of 16); "Choose your arm of service" comes a year and two battles later and changes nothing. The data has 34 troop types and battalion kinds [lead: probe], but no arm has its own ranks, training, gear, missions or career, and there is no scout's, engineer's, garrison's or levy's life at all. [design] | 8 | Branches as data, each with a ladder of posts, entry rules, drills, gear, missions and exits; enlisting is a muster of two or three scenes that fixes the arm from birth, skill and gear. **D11** |
| W3 | **The campaign between battles is empty clicking.** 21 of 27 campaign weeks had nothing to answer; "A week passes. Your host sits before enemy walls." came five weeks running. Supply, scouting and foraging live in a War Room the loop never prompts. [design] | 8 | Each campaign week is a decision drawn from the army's state (forage or press on, scout the ford, send for the carts, assault or starve), or it is skipped. **D12b** |
| W4 | **The war is a twentieth-century model in medieval dress.** Divisions of battalions, "Templates", "Industry", "Manpower", bars for organisation and strength, "infiltration". Ten grades, each "leading" two to four times the last, up to 200,000 for the Marshal of a realm with 104,480 men. "File-Leader", "Squad Captain", "Senior Captain", "High General"; "section", "wing", "regiment". [lead: the War Room's tabs and `GD.MIL` read; world] | 8 | D12a sets out the host in period terms (household and retinues, banners, companies, the three battles, levy and indenture) and maps today's units onto it; rank words per realm. **D12a, D11** |
| W5 | **War screens ignore rank and deployment.** A File-Leader's War Room shows the whole theatre, every friendly stack, and enemy stacks marked "7.3k"; any enlisted man at peace may "plan your own forces"; a child of 9 reads "200 of 200 members · fights like ~4,720 line soldiers". [ux] | 8 | War pages exist only when deployed or on a mission. The War Room by post: a soldier his company and rumours, a captain his division's front, a general the theatre; enemy numbers as estimates. **D10** |
| W6 | **Flank, ambush, siege and supply are numbers, not moves.** Flanking march, feigned retreat and night attack are one daily pick, matched like rock-paper-scissors (`A.WTAC`); a siege is a day counter with a monthly card of four choices; supply is a ratio per province; blockades exist only in the lore; a general's scouts only help him guess the enemy's daily pick. [lead: code and the War Room's text read] The owner asked for each of these as command. | 8 | On D9's ground they become orders with a place: cut this road, hold that ford, lie up in those woods, close the port. Estimates sharpen with scouting; a host with its supply cut wastes away. **D12b** |
| W7 | **The commander's field ignores the ground.** "Battle of Carrness · Forest · rain" is a flat grey plane with three lanes [lead: screenshot]; 694 heavy cavalry hold a wing on a mountain; enemy blocks read "752" and "7.2k" under "about 15,000". [design, art] | 7 | Draw the field from the province's features (woods that hide, a crest, a ford, walls); frontage and cavalry limits come from them; enemy blocks are estimates. **D12b** |
| W8 | **The soldier's battle is a text box.** It has no picture of the line, the ground, the foe or the losses, while a cow in a ditch gets a full print. And the story column already reads "Battle of Nahin (4 days): your side wins. 1,192 fall." while the dialog still asks for your choice. [art, ux] | 7 | A strip of phases and a picture for each; a schematic of the two lines and the ground; hold the battle's story lines until the dialog closes. **D12b** |
| W9 | **Battle marks belong to another age.** Every hit is a yellow starburst that reads as gunpowder; DEFEAT is a small red word on a white label; at the general's view units are tan and olive boxes with numbers. [art] | 6 | Arrow arcs, dust behind horse, a line that buckles, falling banners; counters with banner, troop glyph, ranks and facing; a proper plate for the end. **D12b** |
| W10 | **Practice maims, and the joust is not one.** Sparring "not to the death" ends in "a terrible wound" for a child of 9; "Ingrid… is far beyond you" when both are Untrained; "Enter a tournament (the joust)" is fought on foot. [design] | 5 | Sparring stops at bruises and pride; one joust model (aim, seat, horse); the words of the measure from the same numbers. **X4** |
| W11 | **Army pay dwarfs every other living.** A Squad Captain earns 1,200 suns a year at 16 and a Captain 2,400 at 18; a pedlar earns 80 and a trader 250. [design] | 5 | A soldier's few suns a month; an officer's wealth from loot, ransom and grants. **D11** |
| W12 | **The battle field does not fit a phone**: cropped at 420 px under "Drag the field sideways to see all of it"; and "Solenne" is printed twice, offset, at the top left. [art; lead: screenshot] | 5 | Fit the field to the width, or show one wing at a time; clear the text layer before each redraw. **D12b** |

### Events and text

| # | Flaw (concrete evidence) | Severity /10 | How to fix |
|---|---|---|---|
| E1 | **Cards hide lethal fights behind mild words.** "Go forward to meet them / Starts a fight / +25 suns" opened "Ambush… to the death" against a veteran. The same card killed a boy of 19 and came up in all three lives played; none of 19 "Starts a fight" choices mentioned death. The chip has one wording for every fight (`src/events/9998-stakes/stakes.a-read.core.js:220`). [design; lead: code read] | 8 | Build the stake from the fight the choice opens ("to the death, against a veteran: could kill you"); a lint fails a lethal fight that does not say so. **X3** |
| E2 | **The card's promise is not what happens.** "Costs 3 suns" charged 27.4; "▼ your father's regard" cost 2 suns; "blunted steel" became "a good sword drawn"; "(+15898 suns.)" stood beside "▲ +7,949 suns". [design] | 7 | Preview and effect from one `fx` object; round coin; a replay test that compares each preview with what was applied. **X3** |
| E3 | **Infants and children make adults' decisions.** At 7 months: "Tend the neighbours yourself (Check: Medicine)" or "Leave for the country (costs 8 suns)". A child of 4 hires on for "three weeks of other men's hay". "Send your child Tamsin in your place" is offered on the day she is born. [design] | 7 | An age gate on every pool that is not childhood's; world arcs worded as the parents' choice for a small child; minimum ages on hostage and marriage options. **X3** |
| E4 | **Cards ignore your station.** A company captain of 17 is asked for "your voice" at the council; a division's Commander takes a caravan-guard job at 25 suns a month; a farmhand of 14 passes the College's examination in law; a pedlar gets "your journeyman". [design] | 6 | Gate with `C.office`, `C.jobRank` and `C.prof`; lint station words that have no gate. **X3** |
| E5 | **Cards ignore where you are.** A company holding an oasis in Gorath gets cards headed "Yewmarch"; a captain on campaign jousts at a tournament abroad; a general besieging walls gets "Stolen hours by the river"; a father gives counsel at roll call after a battle. [design] | 6 | Track where the player is (home, camp, march, siege) and filter the pools by it; a gathering needs leave. **X3** |
| E6 | **The ending is someone else's.** "Master of the Craft… a door still hangs true" for a banker and for a First Minister; "Survivor" for a boy killed at 19; on a desktop the buttons sit below the fold. [ux, design] | 5 | Choose the ending from the career lived; pin the buttons. **X3** |
| E7 | **Counsel comes from people who are not there and favours what they did not say**: 40 of 465 cards. "Take it. Fortune likes a bold hand." favours "Tell him you will speak against it". [design] | 5 | Only someone present gives counsel; write the line from the choice it favours; drop it when nobody fits. **X3** |
| E8 | **Pronoun and identity slips.** "Oriana, a prince of Sahrim, rises unsteadily with his cup" (she is a woman of Varenna); 75 event texts hard-code he or she after `{them}`; one card swaps its two names. Rare in about 2,400 cards, and each one breaks belief. [world, design] | 4 | A lint: a pronoun in a sentence that names `{them}` must be a token; the names on a card must match its `ctx`. **X3** |
| E9 | **Filler glued onto scenes, and lines that repeat.** "Since 1105, part of every tax here goes to Aldmark" inside Aldmark; "Fieldcraft: Rain by nightfall" in a famine scene; "Short days and long evenings. Nothing of note." two months running [lead: screenshot]; two quiet toasts stacked. [design, ux] | 4 | At most one extra line, and only if it names the card's place, person or subject; never the same quiet line twice in a year; one toast a step. **X3** |
| E10 | **Copy bugs in plain sight.** "Would teach you f" (`src/people/998-people-want/want.core.js:17` reads the first letter of a string) [lead: line read]; "1 armies in the field"; "after 1 years"; "( 1/37 )". [ux, world] | 4 | Fix `skName`; a plural helper. **A0** |
| E11 | **A drugging is a free romance option**: "A love philtre: Buy it and slip it in her cup / ▲▲ much more Mirella's regard", with no risk and no consequence. [design] | 4 | Cut it, or make it a crime that can be found out. **X3** |
| E12 | Small things: choices that change nothing ("Go / Nothing changes, Send regrets / Nothing changes"); cards with one choice; "eleven miles home" against "six kilometers a day". [design] | 3 | Say what going costs and offers; fold a one-choice beat into the card before it; one system of units. **X3** |

### Tests and process

| # | Flaw (concrete evidence) | Severity /10 | How to fix |
|---|---|---|---|
| Q1 | **Errors are swallowed and no test can see them.** The built core has 1,112 `try` blocks (the release had 72): 297 with an empty `catch` and 436 that only log; an event condition that throws is read as "not eligible". Tests fail on `pageerror` and CSP only. `tools/soak.mjs`, the one tool that records `console.error`, is in no workflow. `v2nOneHolder` plays 10 years where R5 needs 54. [eng] | 9 | Tests and benches fail on any `console.error`; one `A.guard(name, fn)` that counts failures and rethrows in a debug build; a nightly run of 8 seeds × 60 years with every audit. **A3a** |
| Q2 | **No performance gate plays the game.** The bench times the engine's first years on the wall clock. Nothing presses the button, draws a year-50 page, shows a hint or dies, so P1 and P5 shipped. [eng] | 8 | The press loop in CI on two committed saves (year 0 and year 50), fresh and after a death, with budgets on CPU per month, redraws per press, the insert probe and save size. **A1** |
| Q3 | **The coherency checks are not in the build.** `src/core/08-coherency` is `.wip`. Its first run found dead councillors in 3 of 8 lives and raised 24 false alarms from P22. The audits that do exist (`A.V2F.audit`, `A.V2SAVE.check`) caught R5 the moment anything ran them for long enough, and nothing does. [coh, eng; lead] | 7 | Into the default build, with a ratchet: a committed list of known contradictions that may only shrink; every step adds its own checks. **A3a** |
| Q4 | **Playtests cannot see what the owner sees.** Bots answer cards through `A.eventAuto` and step with `A.advance`; the first critique round measured that way and missed P1. No test checks one persona's screen, a hover, or what a face looks like. The owner found the lag, the Marshal and the hover by playing. [lead, from the reports' own corrections] | 7 | Three standing instruments: the real-press harness (Q2); a persona test that draws every page for six lives and fails on forbidden strings; picture sheets (faces, classes, map crops) judged by playtester agents at each step. **A3a, B5, C8b** |
| Q5 | **The test runner dies with the browser.** One browser serves 751 tests, and a crash ends the shard with no summary (`cutRollSkips` ran 1,192 s, then "Target page, context or browser has been closed"). No test has a time limit; each of 8 shards rebuilds and relints; every test boots the 5 MB page. [eng] | 6 | Relaunch on a crash and mark the test; a limit per test; build and lint once and hand the page to the shards; reset with `A.newGame` where a test allows. **A3a** |
| Q6 | **The skills and docs teach the old rules.** `game-ux-playtest-loop` says "One button moves time" and "Never hide a description behind a click"; `life-sim-systems` has the family walk three generations; `docs/V2_SPEC.md` rows 1 and 8 are reversed by D-007 and D-008; the test `v2tNoPlay` asserts one button. The next agent that follows them rebuilds the flaws. [lead: files read] | 6 | Each step updates the skill, the spec row and the test it reverses, in the same commit; "done" includes it. **B4, B6, C6** |
| Q7 | **The measuring tools are not in the repo.** The press harness, the posts census, the world sweep and the screen measurer behind this critique live in `/tmp` of a container that is wiped; only the reports were committed. They are the regression tests for A1, A2, C6 and B5. [lead] | 5 | Commit the scripts (about 600 KB, without the screenshots) under `tools/bench/` before the session ends; wire them into CI step by step. **A0** |
| Q8 | **Timing tests on the wall clock.** 9 test files read `performance.now` or `Date.now`, with comments that record re-timings under load; 22 fixed sleeps. The first critique round made the same mistake on a loaded machine. [eng] | 5 | CPU time of the main thread (09-scale already does this) or counts of work, measured on a fresh page. **A3a** |
| Q9 | **The built game is committed every round.** 98 versions of `index.html` are 103.5 MB of a 115 MB pack, hence the `git gc` ritual. [eng] | 5 | CI publishes the build; release branches keep the tagged ones. It needs the owner's yes, since he plays from the file. **X5** |
| Q10 | Three tests pass by skipping when a dependency is absent (57 twice, 60). [eng] | 2 | A SKIP state, counted in CI. **A3a** |

## 4. Keep

These are good. No step above should tear them down.

**The engine**
- **Determinism.** No `Math.random` in engine code; drawing every page moves no dice; journals of 10, 30 and 60 years,
  and of 36 months played through the real interface, replay to the same fingerprint.
- **The command journal, `A.replay`, the fingerprint in every save**, the four-slot backup ring and the second-tab guard.
- **The engine's month**: flat for 60 years, at 8.4 to 12.5 s of CPU a decade with a bot answering every card.
- **A reproducible build**, the CSP with script hashes, no inline handlers, `UI.esc` on every value.
- **The v2 engine as plain modules with unit tests**, and its audits (`A.V2F.audit`, `A.V2SAVE.check`).
- **09-scale's CPU timing and `tools/soak.mjs`**: the right tools, waiting to be wired in.
- **9997's captains as seeds**: 30,376 named captains for 673 KB. It is the pattern for sparse posts (A2) and for
  commoners held until met (C6).
- **The continent engine**: one landmass, erosion, flow and river paths to the sea. D9 needs no new generator.

**The play**
- **The phone event card**: art band, short text, effect chips, odds in words with the tipped scale. It is the best
  screen in the game. The phone shell around it (the time button under the thumb, four places, 56 px targets) is
  nearly as good: a newborn's first phone screen is 144 words and 16 controls.
- **The quiet month** as a two-second note and a story line, never a card.
- **Stakes chips on choices** (9998-stakes) and the after-action "What decided it".
- **Events that remember**: the Edda arc (a choice at 17 comes back as "What Edda told" and "Back from the hulks");
  thoughts that ripen into traits; "After Urgol", three accounts of one battle side by side.
- **The merchant cards**, which are real trade-offs with readable odds; the staged company missions with named men.
- **The voice**, above all in childhood: dry, concrete, unsentimental. In about 2,400 cards no raw token was seen.
- **The Path ladder with its checklist**, and Decisions' requirement chips.
- **The commander's battle rules**: wing tactics gated by drill ("Never drilled, so not offered"), a real reserve.
- **The raw material of war**: 34 troop types, drill that gates tactics, generals with tempers, sieges with a choice
  each month, squad missions. D11 and D12b reshape these; they do not start from nothing.
- **No spectating**: a civilian already sees no war, only rumour that is late and sometimes wrong.

**The world**
- **The `takeSeat` path**: the one place where a displaced holder becomes a rival. It is the model for every appointment.
- **`A.V2.kin.relationLabel`** (exact kinship terms) and `A.rulerStyle` (a ruler's style by sex).
- **The name pools outside Europe that were researched**: Tibetan Skyfolk, Amharic Abari, Bedouin Sandfolk, Egyptian
  Tamari, Kazakh and Mongol Wind Riders, Swahili Keshi.
- **The realm bible**: customs, house words and arms give the realms texture. C7 should make the game obey it.

**The look**
- **The portrait pipeline's discipline**: pure, cached, about 6 KB a bust, 0.2 to 0.4 ms. C8 changes what is drawn,
  not how it is delivered.
- **The woodblock skies** (the table of hours, graded skies, interior light), the obituary's dusk print with candle
  and crow, the duel's face-off, the captain's view with soldier sprites, the Chronicle's vellum page.
- **Cinzel, Literata and Atkinson together**; the night-and-gold palette; the War Room's painted ground; one icon
  set of even weight; focus rings on every stop.

**The process**
- **The records**: HISTORY, DECISIONS, OWNER_ORDERS, release branches, sample saves that must keep loading.
- **Verifiers that try to reject a fix** before it is merged, as in v2's round 2.

## Appendix A. Claims rejected or corrected

1. **"It is not a session leak."** [eng-draft] False as a verdict. Nodes and listeners do not leak, but P1 is a
   session effect and the largest one. The draft's session was played by a bot between checkpoints and never met it.
2. **"Layout thrashing is the cause", rated 9.** [eng-draft] Layout is 6 to 17% of a press. The forced reads matter
   because each forces a style recalculation, and in P1's mode each of those is the whole page.
3. **"A month costs two to three times more late in life."** [eng-draft] 1.4 times in the normal mode and 1.7 in the
   restyle mode, on fresh pages with 30 presses each.
4. **"A refresh takes 1.2 to 3.2 s"; "a quiet month takes 1.2 to 9.2 s".** [design, ux-draft] Wall-clock times on a
   machine at load 20 to 50. On an idle desktop a refresh costs 0.07 to 0.14 s of CPU and a quiet month 0.84 to
   2.1 s. The conclusion stands; the numbers do not.
5. **"Autosave costs 146 to 459 ms."** [eng-draft] Three operations were timed as one. An autosave is 71 to 180 ms.
6. **"Both diplomacy models cost about the same."** [eng-draft] v2's costs three times the old one; together they
   are 9% of an engine month. The fault is the muting by flags.
7. **"The build takes 52 s."** [eng-draft] 14.5 s on a calm machine. Dropped.
8. **"The People page goes from 133 to 1,023 ms."** [eng-draft] 102 to 176 ms on fresh pages; it is as heavy on day 0.
9. **"No console.error in 100 simulated years."** [eng-draft] One seed. Seed 7 logged three in year 54, and they were R5.
10. **"Both side columns stay live during a card."** [ux-draft] They are dead under a transparent layer. The flaw is
    that the screen looks live and is not (U8).
11. **"A median of 572 words and 54 controls."** [ux-draft] 520 and 51 over the 165 real pages; overlays had been
    counted together with the page behind them.
12. **"Axe passes on 13 of 14 screens, so the game is accessible."** [ux-draft] Axe cannot see hover-only content,
    clipped text at 200%, 31 tab stops before the page, or a 32 px primary button on a tablet.
13. **"The anime direction fights the subject; move the faces to a Pentiment or Darkest Dungeon hand."** [art]
    Rejected as a fix. Anime was the owner's order of 26 October ("graphic masterpieces, anime-like"). The flaws are
    sameness and register (V1, V11), and both can be fixed inside anime. The register is the owner's to choose.
14. **"Restore the inked map as the main style."** [art] Rejected. The satellite ground answered the owner's v2
    complaint that the continent "looks drawn". Fix the blur and lay cartography over it (M6, M1).
15. **"Rivers start and end in the middle of fields."** [art] Partly wrong. The engine's rivers run from source to
    sea; the screenshot shows thin upper reaches fading out. The real flaws are that rivers mean nothing and towns
    are not on them (M3).
16. **"Keep the one button and let it run on to the next card in childhood."** [design] Overtaken by D-008: two buttons.
17. **"Kilograms, metres a second and milliseconds are modern units to remove."** [ux, in part] The v2 spec (row 11)
    asked for real units. Keep them, one click deeper (U12).
18. **"513 titles held by the dead."** [world] An over-count as bugs. A vacant title waits 3 to 12 months by design
    and still points at its dead holder. The real faults are that it is shown as held (R6) and that a crashed pass
    can leave it so for good (R5).
19. **"32 pastels" for the realm palette.** [art] Worse than stated: the records hold 16 colours for 34 realms (M5).
20. **"75% of the world is noble."** [art] 82% noble or royal in the lead's probe (F5).
21. **"No v2dip: 24 problems in 8 of 8 lives."** [coh] A day-0 artefact, not a broken save (P22).
22. **"16 tests pass by skipping"; "311 names redefined"; "122 `!important`".** [eng-draft] 3, 351 and 169.

## Appendix B. Evidence, and what was not judged

**In the repo** (`docs/reviews/round-2/`):

| File | What it holds |
|---|---|
| `final-engineering.md`, `final-ux.md` | The deciding critics' reports: verified rows, corrections to the first drafts, and (in the UX report) the specification for the time controls and the first-glance table for every screen |
| `draft-design.md`, `draft-art.md`, `draft-world.md` | First-draft lens reports whose claims this document used, checked where marked [lead] |
| `draft-engineering.md`, `draft-ux.md` | The first drafts the deciding critics replaced |
| `posts-map.md` | Every store of who holds a post, the Marshal bug reproduced by three roads, bot lives, and the registry design with its write sites |
| `coherency-run-1.txt` | The first coherency run |
| `BRIEF.md`, `FINAL-BRIEF.md` | The critics' briefs, with the owner's twelve complaints |

**Not in the repo yet** (the Nov 12 container; see Q7): the scripts, screenshots and raw numbers under
`/tmp/ardan/critique/<lens>/` and `/tmp/ardan/critique/final/`; the posts simulations in the session's scratchpad
(`sim/`); the frozen build at `/tmp/ardan/snap/index.html`, which is v2.0.0-beta.1 and can be rebuilt with
`node tools/version.mjs get v2.0.0-beta.1`.

**The lead's own checks** for this document:
- *Code read in the live repo:* the `:has()` rules; `N.regrant`; the tooltip listener; the stepper's stop action;
  `W.choices`; the wound line of the v2 battle; the portrait's jaw range; `skName`; the family links at birth; the
  prototype patches of the renaming; `makeProvinces` and the river code; the stakes chip; the `.wip` markers; the
  skills.
- *Probes on the frozen build* (seeds 1, 5, 11 and 42): relationships at birth; classes and wounds of the living;
  ages of councillors; realm colours; terrain and place types per seed; names per culture; culture per realm; the
  cards of a newborn's first 48 months.
- *Screenshots looked at:* 24 random faces, the class sheet, the ages sheet, the map at zoom 6, the commander's
  battle, the War Room, a year-25 desktop Life page and a newborn's first phone screen.

**Not judged by anyone:** sound and music; play on a real phone (the timings are a desktop under CPU throttle); real
new players (every playtest so far is a bot or an agent); mods; saves across versions beyond the samples in
`tests/saves/`.

