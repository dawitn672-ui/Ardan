# Ardan v2.0.0-beta.1: the critique, and the order of work that follows from it

*Round 2, step 1 · stamped 2026-11-12 06:11 ET · written by the lead critic (Fable, maximum effort) from five lens reports (two of
them redone by deciding critics), the map of posts, the first coherency run, and the lead's own checks on the frozen
build and the live code. Sources: `docs/reviews/round-2/`. By the owner's order 11, nothing in section 2 starts until
the owner has read this.*

## 1. Verdict

Ardan has a strong engine behind a face that is slow, crowded and often untrue. The simulation is deterministic,
replayable and flat in cost for 60 years, and it holds more war, court and family machinery than most shipped games.
The owner does not meet the engine, though. He meets:

- a page that redraws itself three to six times a month and, after one hint or one death, restyles every element on
  every insert;
- a world with fourteen separate records of who holds what, so his Marshal story reproduces on every seed;
- one face drawn for every person alive, with no age, class or scar on it;
- a photograph of a continent with no road, ford or pass, where 125 of 306 provinces are "hills";
- a war whose battle choices never change, whatever arm you serve in and whatever ground you stand on;
- screens that show everything to everyone, 520 words at a time, to a newborn who is handed 25 relatives and an Arms page.

Under all of it, 1,112 `try` blocks swallow errors that no test can see, which is how a crash that puts two lords in
one seat shipped. The three worst flaws are the sticky restyle (P1), the missing idea of a post (R1) and the single
face (V1). The best things are the engine's honesty (same seed, same world), the phone event card, the voice of the
writing and the way events remember. Of the 162 flaws below, 3 rate 10 and 15 rate 9. None needs the game torn down.
Most need one source of truth where there are now many, and a test that looks at what the player sees.

**How to read this.** Severity is out of 10: 10 breaks the game or the owner's trust, 1 is polish. Flaw ids carry
their area (P, R, U, T, F, N, V, M, W, E, Q, in the order of section 3). Work items keep the owner's ids (A1 to D12,
B6); the new ones are A0 and X1 to X5. Sources, in brackets: **[eng]** and **[ux]** are the deciding critics, who verified
their rows; **[eng-draft]**, **[ux-draft]**, **[design]**, **[art]** and **[world]** are first drafts; **[posts]** is
the posts map; **[coh]** the coherency run; **[lead]** was checked for this document by reading the live code, running
a probe on the frozen build or looking at the screenshot. The owner's rule 9 ("keep it game-like and simple") arrived
while this was being written; fixes that broke it were dropped (appendix A, 22).

## 2. Order of work

Two lanes can run side by side because they own different folders: an engine lane (Opus) and an interface lane
(Sonnet). The two design documents (Fable) are written beside them. X1 touches every folder and runs alone. A3 lasts
the whole round: A3a builds the net, and every later item adds its own checks to it. Sizes: S a day or less, M a few
days, L about a week, XL longer and split into parts. A playtester agent (Sonnet, default effort) plays each finished step.

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
| 10 | **C8b** Faces and bodies | XL | Opus high | beside 8, once 6 is approved |
| 11 | **X2** Named stages | L | Opus high | after 8 |
| 12 | **D10** War screens only when deployed | M | Sonnet high | beside 11 |
| 13 | **C6** Relationships and households | L | Opus high | after 11 |
| 14 | **X3** Honest cards and clocks | L | Sonnet high (Opus for the preview engine) | after 13 |
| 15 | **C7** Names and cultures | L | Sonnet high | after 8; beside 13 and 14 |
| 16 | **C8c** Dress, class and regalia | L | Opus high | after 13 and 15 |
| 17 | **D9** Map detail, and ground the game can read | XL | Opus high | after 15 |
| 18 | **D12a** Branches and command: one design | M | Fable max | beside 17 (a document) |
| 19 | **D11** Military branches | XL | Opus high | after 17 and 18 |
| 20 | **D12b** War and command depth | XL | Opus high | after 19 |
| 21 | **X4** Balance pass | S | Sonnet high | any time after 14 |
| 22 | **X5** State diet and plumbing | M | Opus high | any quiet moment after 3 |

### 1. A0 · Stop the bleeding
- **Why now.** Three small fixes: about half the cost of every month for anyone who has seen a hint or died (P1);
  a crash that corrupts the court for the rest of a game (R5); and the measuring tools, saved before the container
  is wiped (Q7). **Needs** nothing.
- **Done when.** After a hint, and after a death, adding one empty `<span>` costs under 1 ms of style time (today
  13 to 21), held by a CI probe and a CSS lint on `:has()`. Seed 7's 60-year life never throws in `N.regrant`, and
  `A.V2F.audit()` stays empty. The harness scripts are under `tools/bench/`.
- **Fixes.** P1, P20, R5, E10, Q7.

### 2. A3a · The net
- **Why now.** Every later step changes systems whose errors are swallowed today. Until a failure is loud, each fix
  can break something nobody sees. **Needs** A0.
- **Done when.** Tests, benches and the soak fail on any `console.error`. `08-coherency` is in the default build, and
  8 seeds × 60 years run every night with every audit. A committed baseline of known contradictions may only
  shrink, and is empty when round 2 ends. A new game passes every check on day 0. The test runner survives a
  browser crash, limits each test's time and reports SKIP as its own state.
- **Fixes.** Q1, Q3, Q5, Q8, Q10, P22, part of Q4.

### 3. A1 · Lag
- **Why now.** The owner's first complaint, and the core loop. A year through today's stepper costs 27 to 46
  seconds, so B6 waits on it. **Needs** A0 and A3a.
- **Done when.** The press harness runs in CI on committed saves of year 0 and year 50, on a fresh page and after a
  death, at 1366 px, in CPU time: a quiet month costs at most 150 ms and each card at most 100 ms more (today 294 to
  538 and 358 to 1,001 at year 50); one full refresh and at most 12 forced layouts a press (today 3 and 110); year
  50 costs at most 1.15 times year 0; a quiet month takes at most 1 s at four-times throttle (today 3.0 to 3.9 s);
  starting a life shows a progress line.
- **Fixes.** P2, P5, P7, P11, P21, Q2, T3, part of U7.

### 4. B6 · Next month or Next year
- **Why now.** The owner's newest order (D-008), and the same stepper A1 rewrites: built apart, it is rewritten
  twice. **Needs** A1's stepper.
- **Done when.** Two buttons in fixed places; neither ever becomes a stop control. Twelve month presses and one year
  press end on the same fingerprint. A quiet year costs at most 2 s of CPU (6 s at throttle), with one redraw and
  one digest. A year stops early, saying why in one line, for a card that needs an answer, a battle, an illness or
  wound, a death in the household, coming of age or a deadline. A newborn reaches 12 in at most 25 presses plus its
  cards (today about 155). No initiative is wasted (T5). The spec, the skill and the help all say the same.
- **Fixes.** T1, T2, T5, U18, part of Q6.

### 5. B4 · Click-to-open
- **Why now.** A standing rule broken on every screen. The work is mechanical, low in risk, and in folders the
  engine lane does not touch. **Needs** nothing.
- **Done when.** A test hovers every anchor on every page and nothing opens; click, tap and Enter open, and Esc
  closes. A lint fails any `title=` over three words and any hover handler that opens a tip. A phone reaches every
  description a desktop can. An activity opens a sheet before it commits, and its result is never cut.
- **Fixes.** U1, U9, part of U19 and Q6.

### 6. C8a · Character design: the plan
- **Why now.** High priority for the owner. A document conflicts with nothing, so it is written while the first
  steps are built, and C8b starts the day it is approved. **Needs** the owner's answer on the art register
  (question 1 below).
- **Done when.** The owner has approved `docs/design/characters.md`: face genes and their ranges, inheritance, the
  curves for sex and age, body and build, wounds, expression from temperament, the dress table (class, culture,
  wealth, role), the register with reference sheets, the cost per person in state, and the acceptance sheets for
  C8b and C8c.
- **Fixes.** It plans V1 to V22.

### 7. X1 · Own the release
- **Why now.** A2 must change about 50 functions of the release, and C6, D11 and D12b more. Today each change is an
  exact-string patch on a one-line 1.7 MB blob that nobody can review. The release's own names are intact
  (`const pc=A.pc()`), so one mechanical pass gives readable source. The engineering critic put this after A2; the
  lead puts it before, because every large step after it gets cheaper and safer. It shows the owner nothing, so he
  decides (question 4). **Needs** A3a, A1's gate, and nothing else in flight.
- **Done when.** The default build has no `patches.mjs`; the patched release is formatted source under
  `src/core/release/`; `vendor/` is untouched. Journals of 10, 30 and 60 years replay to the same fingerprints, all
  751 tests pass, and every event's audience class is unchanged. The patch layer is in `archive/` with a note.
- **Fixes.** P4; it prepares P3.

### 8. A2 · One holder per post
- **Why now.** The owner's second complaint, reproduced on every seed. Branches, command, scoped war screens,
  households and titles all need one answer to "who holds this?". **Needs** A3a, X1, and the design in
  `docs/reviews/round-2/posts-map.md` (section 5, phases 1 to 4).
- **Done when.** `A.POSTS.audit()` is empty in 10 seeds × 20 years and every night: one holder per post, none dead
  or under age, no forbidden pair, every old field equal to its record. The owner's story is a test: by each of the
  five roads there is one Marshal, he commands the armies, and the old Marshal is moved, named and resentful. Each
  promotion hands the old post to its deputy. Resigning, deserting, prison, capture, death and passing the torch
  leave no post behind, and each has its price. No stored title names a post its owner lacks. Old saves load and
  are repaired with a line each.
- **Fixes.** R1 to R4, R6 to R11, R13 to R18, N8.

### 9. B5 · Declutter
- **Why now.** The owner's fourth complaint. It follows B4 and B6, which decide where descriptions and the time
  controls live. Its second part follows A2, because what a person may see reads the post. **Needs** B4, B6, A1.
- **Done when.** *Part 1, the shell.* A test holds a phone's first view to 120 words and 12 controls, a desktop's
  to 250 and 25, and action pages to 3 screens. At 1366 px the open page gets at least 60% of the width (today 28%).
  A desktop card dims the rest and shows every choice at 768 px. Help names only pages that exist. 200% text clips
  nothing, and tablets get the phone shell. *Part 2, scope.* One `UI.scope(pc)`; six lives (a newborn, a child of 9,
  a squire of 16, a File-Leader at war, a captain in garrison, a councillor) draw every page with no forbidden
  string. One goal stack.
- **Fixes.** U2 to U8, U10 to U17, U20 to U27, V20, P16.

### 10. C8b · Faces and bodies
- **Why now.** High priority, and independent of posts, names and war. **Needs** C8a approved, X1, A1.
- **Done when.** Playtester agents match 20 hair-covered adult faces of one people and sex to their busts at least
  90% of the time (today near chance), sort sex right 95% of the time at 88 px, and name the age band 85% of the
  time. Kin are closer in gene distance than strangers. Every wound writes `p.wounds` with a place and a year and
  shows; veterans start scarred; no newborn does. 150 cm and 195 cm differ in one frame. Feature lines hold 2.5:1 on
  every skin. Genes cost at most 30 bytes a person, and the People page is at most 800 nodes.
- **Fixes.** V1, V3 to V6, V8 to V10, V14, V15, V18, V21, P15.

### 11. X2 · Named stages
- **Why now.** `A.applyFx` has 32 definitions and `A.newGame` 20, and C6 and X3 are about to add to exactly these.
  **Needs** X1, A2.
- **Done when.** `A.applyFx`, `A.eventView`, `A.eventChoose`, `A.newGame`, `UI.render`, `UI.refresh` and
  `UI.renderModal` each have one definition that runs named stages, held by a lint. The count of names defined more
  than once (351) may only fall. Load order comes from a manifest. The muted diplomacy path is gone, or held by a test.
- **Fixes.** P3, P10, P14.

### 12. D10 · War screens only when deployed
- **Why now.** A standing rule, cheap once posts and scope exist, and the rule D11 and D12b must then keep. It does
  not need the map. **Needs** A2 and B5 part 2.
- **Done when.** A persona test: a civilian sees no war screen; a soldier in garrison or at peace sees no War Room;
  a deployed soldier sees his company, his orders and rumours, with enemy numbers as estimates; a captain sees his
  division's front; a general the theatre. Arms appears at 14 or on enlisting, and lists only the orders the
  character has heard of.
- **Fixes.** W4, part of U4 and U19.

### 13. C6 · Relationships and households
- **Why now.** The owner's fifth complaint; X3 and C8c need its people. **Needs** A2, X2, B5 part 2.
- **Done when.** In 42 starts a commoner is born knowing parents and living siblings, and a grandparent only under
  the same roof: at most 8 people, with no uncle, cousin or in-law. A noble adds a nurse, a maid, a tutor from 6 and
  a guard knight: at most 12. Every later entry records how you met. No event names kin who are not in the tree
  (a lint; none minted in 12 worlds × 30 years). One resolver gives a house its head and heir. A parish of named
  commoners is held as seeds until met. Births take nine months. The skill says the same.
- **Fixes.** F1 to F10, P9.

### 14. X3 · Honest cards and clocks
- **Why now.** These were found by playing, and each costs the player's trust in what a card says. It follows C6,
  whose kin rules decide which cards may fire. **Needs** C6, X2.
- **Done when.** A lint fails any choice that can start a fight to the death without saying so. Over 400 replayed
  scenes, every preview equals what was applied. In 12 worlds × 30 years: no adult's decision is asked of a child
  under 6, no dated event fires outside its month, no home-town card reaches a player deployed abroad, no station
  word appears without its gate. A fatal illness is an arc. An ending names the career lived.
- **Fixes.** E1 to E9, E11, E12, T4, T6.

### 15. C7 · Names and cultures
- **Why now.** The owner's sixth complaint, under his rule 9: basic, common names. It follows A2, because titles and
  seats must be read from the registry before they are reworded, and it comes before dress and the map, which are
  keyed by culture. **Needs** A2. The draft name data is in `docs/research/c7-names.json` (not wired in).
- **Done when.** Names are plain and easy to read, and each realm has a flavour of its own. A census of 35 realms
  finds ports and market towns with 15 to 35% of births from trade partners, and border provinces with 20 to 40%
  from the neighbour. In 12 worlds × 30 years no full name is shared in a town, and no given name among siblings
  and first cousins. No fief is named in another people's language. Four realm names fit their governments. The
  renaming hack is deleted and the built page holds none of the old names.
- **Fixes.** N1 to N12, P6, part of M4.

### 16. C8c · Dress, class and regalia
- **Why now.** The second half of character design, keyed by C7's cultures and drawn on C6's commoners.
  **Needs** C8b, C6, C7.
- **Done when.** On a sheet of 8 stations × 4 cultures with the labels hidden, agents name the station 85% of the
  time (today only the nobility). A soldier's bust shows that he is one. Only liveried retainers share a garment.
  Hoods are on at most 10% of indoor portraits and never in lists. Each event's picture matches its scene tag in a
  60-card sample.
- **Fixes.** V2, V7, V11 to V13, V16, V17, V19, V22.

### 17. D9 · Map detail, and ground the game can read
- **Why now.** The owner's eighth complaint, and the floor under war depth: a flank, an ambush or a cut supply line
  needs a wood, a ford and a road to exist first. **Needs** C7 and A1. The engine already has heights, flow and
  river paths.
- **Done when.** The map draws roads in two ranks, a ford or bridge at every crossing, named passes, rivers with
  tributaries, woods and marsh, and names for seas, ranges, rivers and forests; 70% of towns stand on water. Agents
  tell roads from borders in 10 crops of 10. The same data drives play: roads are at least 30% faster, supply
  follows roads and rivers, and an attack across a river or through a pass carries a penalty the report names. In
  10 seeds no oasis lies off arid land, and no terrain word covers more than a third of the provinces (hills cover
  41% today). Neighbouring realms never share a colour. Every map is one component, and it redraws in 50 ms.
- **Fixes.** M1 to M9, P18, part of U5.

### 18. D12a · Branches and command: one design
- **Why now.** What an arm can do is what a commander can order, so one design keeps D11 and D12b from
  contradicting each other. The owner's rule 9 sets its subject: knights, cavalry, infantry and archers; what
  beats what, on what ground, and when. It is written while the map is built. **Needs** D9's data model. The
  draft notes and data are in `docs/research/d11-branches.md` and `.json`.
- **Done when.** The owner has approved `docs/design/war.md`: the table of what beats what; what each kind of
  ground does to each arm; what each rank of each arm decides in each phase, on the march, in camp and at a siege;
  how scouting changes what you know; what each rank's screens show; and the checks for D11 and D12b.
- **Fixes.** It plans W1 to W12.

### 19. D11 · Military branches
- **Why now.** The owner's tenth complaint. **Needs** A2 (posts with echelons), D9 (ground for scouts and engineers
  to act on) and D12a.
- **Done when.** `data/military/branches.json` holds the branches (knights as heavy lancers, mounted men-at-arms
  and dismounted knights; light cavalry; a scout regiment; spears and pikes; men-at-arms on foot; archers;
  crossbows; siege engineers; garrisons; levies; mercenaries; elite orders), each with what it beats and loses to,
  a ladder of registry posts, entry rules, drills, gear, three missions of its own and a way out. Enlisting is a
  muster of two or three scenes that fixes the arm. In 10 bot careers per branch, half the war cards are the
  branch's own. Rank words are plain and the same on every screen. Pay is rebased. Peace service counts.
- **Fixes.** W2, W8, W11, R12, part of V7.

### 20. D12b · War and command depth
- **Why now.** The owner's eleventh complaint. It is last because it stands on everything before it.
  **Needs** D9, D10, D11, D12a.
- **Done when.** Across 20 battles a rank meets at least 12 different sets of choices (today one), and a card says
  in words what your arm beats and fears here. On campaign no three weeks pass without a decision or a skip (today
  21 of 27 are empty). Flank, ambush, encirclement, blockade, siege work, supply and scouting are orders given on
  the map; they read the ground, and the report names the move and the feature. Enemy strength is an estimate that
  scouting sharpens. The field draws the ground, and the soldier's battle has pictures. Choices still move results
  by 15% at every rank (`rankfx`). Far wars cost at most a tenth of an engine month.
- **Fixes.** W1, W3, W5 to W7, W9, W12, P12.

### 21. X4 · Balance pass
- **Why now.** Small, and best done once cards are honest. **Needs** X3.
- **Done when.** The balance bands hold, with new ones: lending is no better than a venture at equal risk; no skill
  goes from Apprentice to Legend in under 20 years; sparring cannot maim; there is one joust model.
- **Fixes.** T7, W10.

### 22. X5 · State diet and plumbing
- **Why now.** Little impact today, more with every year a life lasts. **Needs** A1, and the owner's answer on
  question 5.
- **Done when.** A year-60 save is at most 400 KB (today 847). Named people stay within a target per realm.
  Autosave takes at most 50 ms of the main thread. One store records which events were seen. Retired events leave
  the page. CI publishes the build, if the owner agrees.
- **Fixes.** P8, P13, P17, P19, P23, Q9.

### Decisions the owner should make first

1. **The art register (C8a).** The anime look was the owner's order of 26 October, and it stays. Should it grow up
   (older proportions, real noses, age and scars that show), in the manner of a historical anime rather than a
   gacha banner? The art critic wanted to leave anime; this critique says no (appendix A, 13).
2. **The map's look (D9).** Keep the satellite ground ordered in v2 and lay roads, rivers and names over it as
   crisp lines? The art critic wanted the inked map back; this critique says no (appendix A, 14).
3. **A favourite as Marshal (A2).** May the crown raise a Captain over the generals' heads, so that he gets the
   real command and their resentment, or must the seat go to a General?
4. **X1.** One step with nothing to see, before A2, that turns the patched release into readable source.
5. **The built game in git (X5).** May `index.html` stop being committed every round, with the playable build taken
   from CI or a release branch?
6. **A year for an adult (B6).** Confirm what stops a year, and whether unspent initiative is spent by "Your days"
   or stops the year when it is full.
7. **A flavour per realm (C7).** Eleven realms share two name pools. Should each lean to one plain flavour (Aldmark
   English, Northreach Norse, Greyhaven German, Solenne French, Varenna Italian), all with common names?

## 3. Flaws by area

Each table runs from the most severe down. The last words of each fix name the work item that carries it.

### Performance and engineering

| # | Flaw (concrete evidence) | Severity /10 | How to fix |
|---|---|---|---|
| P1 | **Sticky whole-page restyle.** Four CSS rules hang `:has()` on `body` (`src/events/28-endings/endings.core.js:213`, `src/ui/91-look/look.b-base.core.js:66`). Once a hint box or the dead player's bar has been drawn, every DOM insert restyles about 2,900 elements until the page is reloaded: a year-50 month costs 1,555 ms of CPU, not 633. Every life ends in a death, so every long session ends here. [eng; lead: rules read] | 10 | Delete the four rules (use `#app[inert]` and a class on `#game`); a CSS lint; a CI probe. **A0** |
| P2 | **A month redraws the page three to six times.** At year 50 one press runs `UI.refresh` 2.9 times and 110 forced layouts; the engine is 20 to 70 ms of a 500 ms press; each card adds 173 to 358 ms. At four-times throttle a quiet month takes 3.0 to 3.9 s. [eng, ux, design] | 9 | One owner of redraw: paint only the clock while stepping and only the modal at a card; one refresh at the end; dirty flags per region. **A1** |
| P3 | **Behaviour is a stack of wrappers.** 2,403 definitions for 1,679 names; 351 are defined more than once; `A.applyFx` 32 times, `A.newGame` 20, `UI.render` 18. A function does whatever folder order adds up to. [eng] | 8 | Named stages with one owner each; a lint when a hot function gains a wrapper. **X2** |
| P4 | **The release is patched, not owned.** 196 exact-string patches on a one-line blob; 10 match only text an earlier feature wrote. Its own names are intact, so a formatter makes it readable. [eng; lead] | 8 | Bake the patches in, format into source files, build from those. **X1** |
| P5 | **The story log is rebuilt whole on every refresh and holds 40 years**: 20 elements grow to 1,618. It is the whole effect of age on a desktop (the realm page goes from 79 to 172 ms). [eng] | 7 | Append-only; two years in the page, the rest on demand. **A1** |
| P6 | **Kingdoms are renamed by patching the browser.** `src/world/99999-v2-names/names.core.js:227-239` replaces the setters of `innerHTML`, `textContent` and `title`, and runs about 20 regexes over everything written. A person called Amber or a typed name is rewritten too. [eng; lead: lines read] | 7 | Rename in the data at build time; delete the patches; grep the built page for the old names. **C7** |
| P7 | **The page is fixed after it is drawn.** FOLD, LOOK, MOTION and 71-phone restructure other features' markup and measure as they go (28 to 30 forced layouts a refresh); `VS.sweep` re-walks every text node to turn numbers into words. [eng] | 6 | Words at the source; each component owns its markup; read before writing. **A1** |
| P8 | **State and saves have no ceiling**: in 60 years the state grows from 2.6 to 5.4 MB and the save from 300 to 847 KB. [eng] | 5 | Derive lore from the seed; pack looks as a gene string; cap histories; 400 KB at year 60. **X5** |
| P9 | **Named people only pile up**: 977 become 1,756 in 60 years. [eng] | 5 | A target per realm; people off screen as seeds, as 9997 does for captains. **C6, X5** |
| P10 | **Two models run where one should**: v2 diplomacy beside the release's, whose dice are muted by a hand-kept list of flags; three market layers. [eng, eng-draft] | 5 | Finish each migration and delete the muted path. **X2** |
| P11 | **Starting a life freezes the page** for 1.7 to 3.3 s with no progress shown; 5,004 events are classified by regex at every boot. [eng, eng-draft] | 5 | A progress line; generate in a Worker or in slices; event metadata at build time. **A1** |
| P12 | **The war map runs daily for the whole continent whenever any war exists** (`A.wsDay` is 48.7% of an engine month), and one exists on day 0. [eng; lead: probe] | 4 | Far wars weekly or abstract. **D12b** |
| P13 | **Autosave blocks the year turn** for 71 to 180 ms of the main thread; it reads three slots and rewrites four. [eng] | 4 | Serialise in a Worker; one write. **X5** |
| P14 | **Load order is folder-name order** ("last" means more nines), and features find each other through optional globals (`if (A.WC)`). [eng, eng-draft] | 4 | `after:` in a manifest, checked at build. **X2** |
| P15 | **The People page is 2,100 to 2,300 nodes of inline SVG** for 18 to 20 portraits. [eng] | 4 | Portraits as cached images. **C8b** |
| P16 | **CSS weight**: 56 `<style>` elements, 700 KB, 2,753 rules, 169 `!important`, 62 `:has()`. [eng] | 4 | One generated stylesheet; purge by coverage. **B5** |
| P17 | **The player record is a junk drawer**: 59 keys at birth, 106 at 30; five stores of which events were seen. [eng; lead: probe] | 4 | One life-memory store with a schema. **X5** |
| P18 | **The World page repaints its ground from noise on every draw** (101 to 257 ms). [eng-draft, not re-measured] | 4 | Cache the ground; redraw only the overlays. **D9** |
| P19 | **Monthly work is never skipped**: 69 `onMonth` hooks; every roll evaluates all 5,004 event conditions, 826 of them retired. [eng, eng-draft] | 3 | A cadence per system; index events; drop retired ones. **X5** |
| P20 | **Toasts write `--ts-h` on `:root`**, invalidating the whole document twice a toast. [eng] | 3 | Set it on the toast stack. **A0** |
| P21 | **Garbage churn**: up to 94,000 nodes are held for a 2,900-node page, because MOTION's timers pin replaced trees. Collected, not leaked. [eng] | 3 | Falls with P2 and P5. **A1** |
| P22 | **A new game has no complete initialiser**: `S.v2dip`, `S.v2w` and `S.v2t` appear on the first tick (the coherency run's "no v2dip"). [eng, coh] | 2 | `A.newGame` runs the steps of `A.V2SAVE.upgrade`. **A3a** |
| P23 | 13.4 MB of script text stays in the page; 17 key and click listeners sit outside `UI.A`'s router. [eng, eng-draft] | 2 | Remove scripts after they run; one key map. **X5** |

### Ranks, posts and coherency

| # | Flaw (concrete evidence) | Severity /10 | How to fix |
|---|---|---|---|
| R1 | **The game has no such thing as a post.** Fourteen stores say who commands or sits (`pc.mil.rank`, `r.council`, `armies[].gen`, `divs[].cmd`, 9997's slots, `p.occ` and more); command is worked out from the grade; nothing ties them together. The owner's Marshal report reproduces on every seed, and without forcing in 2 of 5 noble lives (seed 101: Marshal at 22, then 17 years without an army). [posts, design, world, eng] | 10 | One registry, `S.posts`; `A.POSTS.appoint` and `vacate` are the only writers; old fields become mirrors; every view reads it. **A2** |
| R2 | **A promotion does not hand over the command it announces.** "PROMOTED: Senior Captain. You now lead 800" keeps the same company of 200; a Sergeant gets no unit; a new General gets the second-largest army; a Marshal "leads 200,000" in a realm of 104,480 men. [world, posts, design] | 9 | One table of rank, echelon and object. The board picks a post, then appoints; with no post to fill, no promotion. **A2** |
| R3 | **Five roads lead to the Marshal's seat and they disagree.** The court names a Captain Marshal with no command; the board's Marshal gets no council pay or business, and the sitting Marshal loses the seat without a line; accepting the council's offer resigns your commission; a made-up "Marshal of Aldmark" stands beside the real one. [posts, world] | 9 | Every road calls `appoint`; the seat commands the armies; the man displaced is moved, named and resentful. **A2** |
| R4 | **Leaving a post leaves it held.** Resigning, deserting, prison, capture and "Pass the torch" clear `pc.mil` and nothing else: a resigned Marshal keeps the seat and the First Army; a councillor stays captain of a company for 18 years. [posts] | 9 | `A.POSTS.leaveAll` from every exit; the deputy acts at once; each way of leaving has its price. **A2** |
| R5 | **A swallowed crash puts two lords in one seat.** `N.regrant` reads `ohd.noble` where `ohd` is null (`src/nobility/99995-v2-nobility/a-court.core.js:362`). Seed 7: three throws in 1159, each aborting the month's pass (164 titles skipped); from 1160 the game's own audit reports two lords of Rushzag Oasis for good. It is the likely cause of the world sweep's counties "held by dead men for 27 years". [eng; lead: line read; world] | 9 | A null guard; decide first and create last; one `try` per title; a regression test. **A0** |
| R6 | **Death vacates nothing.** Dead councillors sit until the yearly sweep (3 of 8 lives in the coherency run); houses stay headed by the dead for years; a vacant title shows its dead holder for 3 to 12 months. [coh, eng, world, posts] | 8 | `A.kill` calls `leaveAll`; the deputy or heir acts that day; screens say "vacant" or "acting". **A2** |
| R7 | **Titles kept as loose text put two holders on screen.** `p.occ` has about 40 writers and one that clears it ("Chancellor of Lucerna" on two living people); lore styles never move (a "Doge" beside the ruling Doge); the family generator invents "Marshal of the levies" (46 such offices in 48 births). [world, posts] | 8 | Derive the title line from the registry; lore styles become an epithet; relatives get real offices or none. **A2** |
| R8 | **Children hold adult posts.** On day 0 the Chancellors of Kesh, Velgrad, Tamar and Ranpur are 2, 6, 9 and 12 [lead: probe]. Elves run on human clocks: court titles at 25 to 46, when elves come of age at 50. [world] | 7 | An age rule on every appointment; ages from each race's tables; a regent for a child's seat. **A2** |
| R9 | **One person holds posts that cannot go together**: Treasurer and Chancellor at once; a Treasurer who becomes "king of the gutter"; 7.7 of 8 Grand Masters also hold a shire office every year. [posts] | 7 | Exclusive classes and forbidden pairs in `can()`; taking a post hands over what it excludes. **A2** |
| R10 | **A former Marshal starts again as a clerk**: "Without a post", then "start as Copyist · 60 suns/yr". [design] | 7 | Lateral posts by rank, a pension and a style; veterans are offered posts. **A2** |
| R11 | **The chain of command is invented.** Your superior is a person made up for the role, never the real general; your own captain shows as "Former superior" with a "your superior" chip. [posts, world, ux] | 6 | `A.superior` is the holder of the parent post. **A2** |
| R12 | **Peace freezes the ladder**: a Captain sat 79 months "of 16" with every gate met; 4 battles in 20 years of service. [design] | 6 | Peace service counts (garrison command, patrols, a foreign contract); a floor after long service. **D11** |
| R13 | **Splits and conquests strand posts.** A ruler who breaks away keeps titles in the realm he left (11 cases); realms born in play never get a council (8 of 42 had five empty seats at year 60). [world, posts, eng] | 6 | Realm birth, fall and split call the registry in one step. **A2** |
| R14 | **Rank words disagree on one screen**: "Sergeant" in the profile and "Rank 2 of 4, a captain" in the story; a "Squad Captain" who "leads 100" has a squad of 9. [ux, design] | 6 | Every panel reads the post and the unit; one glossary of plain rank words. **A2, D11** |
| R15 | **Phantom and doubled officers.** A division with no commander gets a name hashed on the spot, a man who cannot be met; a slot the player leaves falls back to its seed, so there are two "Corbin of Amberwick, Captain of the 3rd Company". [world, posts] | 5 | A seed is spent when it becomes a person. **A2** |
| R16 | **Every new post reads "Months in your current post 333 / 11"**: a missing start date is read as `absDay − 9999`, so a new squire starts past the tenure gate. [design; lead: code read] | 5 | Set the date at hire; show it in words. **A2** |
| R17 | **Jobs are ranks without places**: "A post falls vacant" is always true, and your old boss stays Guild master when you become one. [posts] | 4 | The top rank of a guild, a see or a merchant house becomes a post. **A2** |
| R18 | **Garbled lines at the moment that matters**: "The board's reason: for ."; "You leave 1st Northmoor Lances after 1 years as Marshal". [world] | 4 | Skip an empty reason; a plural helper; name the post held. **A2** |

### Interface and clutter

| # | Flaw (concrete evidence) | Severity /10 | How to fix |
|---|---|---|---|
| U1 | **Descriptions still open on hover.** `TT.init` listens for `pointerover` (`src/ui/59-tooltips/tt.engine.core.js:240`): 12 of 12 anchors opened on hover. Another 154 `title="` sites hold real descriptions (every activity, traits, skills) that never show on touch. [ux; lead: listener read] | 9 | Delete the hover paths; keep click, tap and Enter; an ⓘ, or the underlined term as a button; a lint and a hover test. **B4** |
| U2 | **Clutter.** A desktop's first view holds a median 520 words and 51 controls, and 360 of the words are the fixed top bar, profile and story. Phone pages run long: Story 8.6 screens, People 5.5, Holdings 5.4 with 109 controls. [ux] | 9 | Budgets held by a test (phone 120 words and 12 controls; desktop 250 and 25; 3 screens); the UX report's first-glance table. **B5** |
| U3 | **The desktop starves the page you opened**: 486 px of 1366 (28% of the screen) beside a 598 px story and a 248 px profile; 26% at 1920. [ux; lead: screenshot] | 8 | A rail of 280 to 300 px and the page; the story becomes Life's feed and a drawer. **B5** |
| U4 | **Screens ignore age, class and rank.** A peasant of 9 has an Arms page with "Ask to join"; a newborn sees "See a physician" and "Looks homely"; a father's card offers "Pick a fight"; a Chancellor is told "Find work"; a child of 12 is offered "Burgle a house". [ux, design] | 8 | One `UI.scope(pc)` read by every page and by `A.canAct`; a persona test. **B5** |
| U5 | **"Five places" hide about 60 surfaces.** World on a phone puts 20 buttons above the map; there are 14 pages, 9 Codex sections and about 15 overlays; the map appears in five places in three renderings. [ux] | 8 | World is one map with a mode menu; the Codex is a linked encyclopedia opened from any term. **B5, D9** |
| U6 | **Help describes an older game**: "Six tabs. Life… People. Path & War…"; "(Work tab)", which does not exist; key hints on phones. [ux; lead: seen in a story] | 7 | Generate help from `UI.GROUPS`; lint any "X tab" not in it. **B5** |
| U7 | **The percent-to-words sweep rewrites the interface itself**: text sizes read "all / more than all / 1.5 times over"; "Show exact odds on choices" is a dead checkbox. [ux] | 7 | Words at the source; delete the sweep; remove the toggle. **A1, B5** |
| U8 | **The desktop card is not focused**: 837 words are visible and 96 are the card's; the lit columns are dead under a transparent layer; with four choices, two fall below a 768 px fold. [ux] | 7 | Dim the rest; every choice visible at 768 px; hints in the card's footer. **B5** |
| U9 | **Activities commit on one tap, explain themselves only on hover and answer with a clipped toast.** An adult's Life page has 29 tiles, "Plot to seize a throne 3⧗" among them. [ux, design] | 7 | A tap opens a sheet (what, cost, odds in words, risk, "Do it"); six suggestions and "More". **B4** |
| U10 | **Creation hides the character**: with "Newborn" chosen the preview is a grown man; "Be born: a human child of Aldmark" never says peasant; faces are text buttons "Shape 1–4". [ux] | 7 | A preview that stays in view and is true to age; face swatches; realm picked on the map; class on the quick-start cards. **B5, C8b** |
| U11 | **A red "!" for unread story lines**, the same mark as war. [ux] | 6 | Red for danger only; a neutral dot for unread. **B5** |
| U12 | **Abbreviations and raw numbers**: "INS up · INT up", "+2 SPD, -2 STR", "Learning 21 of 60", "Your superior thinks poorly of you (-24)", "(You recover 41082 of the 58688 suns.)". [ux, design; lead: screenshot] | 6 | Words first; names spelled out; exact figures and real units one click deeper; one coin formatter. **B5** |
| U13 | **Tablets get the mouse layout**: phone styles stop at 760 px, so at 768×1024 Next month is a 150×32 px button at the top of a touch screen. [ux] | 5 | The phone shell on coarse pointers up to 1024 px. **B5** |
| U14 | **The game's own 200% text setting breaks the phone**: up to 39 clipped labels on a page. [ux] | 5 | Type in rem; bars wrap; a test at 200%. **B5** |
| U15 | **Truncation at 420 px**: "Wants your com…"; a five-line paragraph squeezed beside a heading. [ux] | 5 | Summaries under headers; chips open in full on tap. **B5** |
| U16 | **Coming back to a life**: "Continue" is the third button, in the secondary style; the default difficulty is called "Hard". [ux] | 5 | Continue first, with portrait, name and age; Gentle, Normal, Harsh. **B5** |
| U17 | **The menu is a settings dump**: 31 controls in one scroll, developer items among them. [ux] | 5 | Six menu items; settings in four groups; developer items behind a flag. **B5** |
| U18 | **The phone hides your age**: "January 1109 · ⧗ 7.0 · 4,659 suns". [ux] | 5 | "Age 9 · March 1105" on the time row. **B6** |
| U19 | **Map and War Room chrome is written for a mouse**: "Hover for details" on a phone; a legend that must be studied; unlabelled icons. [ux; lead: screenshot] | 5 | Captions that know the pointer; the legend behind ⓘ; labels. **B4, D10** |
| U20 | **Too many goal systems and no spine**: an ambition, chapters, life arcs, What now, Decisions and achievements. [design] | 5 | One stack: ambition, the chapter's aim, the next step on the Path. **B5** |
| U21 | **Keyboard order**: the open page's first control is stop 32 of 75, and there is no skip link. [ux] | 4 | A skip link; one "Profile" stop. **B5** |
| U22 | **Fixed bars on small phones** take 229 of 640 px. [ux] | 4 | Sub-tabs scroll away; hints become coach marks. **B5** |
| U23 | **Slashed zeros everywhere**: "11Ø5", "Ø suns". [ux] | 4 | Dates, money and ages in Literata. **B5** |
| U24 | **Duplicate surfaces**: "Live the next month" repeats the time button; The Book retells the story. [ux] | 4 | One place per fact. **B5** |
| U25 | **Story colours carry meaning with no legend.** [ux] | 4 | Icons, a legend, filters. **B5** |
| U26 | **Decisions explains the interface** ("There are no quest lists in Ardan…") and holds "Design your arms". [ux] | 4 | Cut the paragraph; show what can be decided now. **B5** |
| U27 | Small things: three "Keep this" actions that never say what keeping does; an unlabelled Save seal; 17.9 px targets on the promotion board; laws change on one tap; "Leave the army" asks no confirmation. [ux] | 3 | Plain labels; 24 px targets; confirm what cannot be undone. **B5** |

### Time and pacing

| # | Flaw (concrete evidence) | Severity /10 | How to fix |
|---|---|---|---|
| T1 | **Time moves only by the month.** A newborn's first 48 months brought 3 cards and 45 empty presses [lead: probe]; a peasant's first twelve years took 155 presses, 129 of them empty [design]. v1's childhood speed-up (`src/events/82-early-years`) went with the Play button. | 9 | Next month and Next year; the year is the main button under 14 and stops for what needs you (D-008). **B6** |
| T2 | **The time button changes meaning.** While a month runs it is a stop button (`src/core/99992-v2-time/time.core.js:327`): N pressed twice ended the month after 7 to 20 days without a word. While a card waits it reads "▷ Go on", under the modal, and cannot be clicked. [ux; lead: code read] | 8 | While busy it keeps its label, disabled, with progress; nothing stops a month; Esc stops a year at the month's end. **B6** |
| T3 | **A year through today's stepper would cost 27 to 46 s on a desktop**; the engine runs it in about 1 s. 84-top-bar still carries `week`, `season` and `until` steps whose actions were deleted. [ux, eng] | 7 | Compute, then paint once; a `year` kind in `UI.stepTarget`. **A1 with B6** |
| T4 | **Death comes without warning.** Marsh fever killed a banker of 41 on 1 January; his health read "hale" before, and on the death screen; no illness card, no treatment, no last scene. [design] | 7 | A fatal illness is an arc that health shows. **X3** |
| T5 | **A year step would waste a year's initiative**: ⧗ caps at 7 and "stops filling until you spend some". [lead: code read] | 6 | "Your days" spends it, or the year stops when it is full. **B6** |
| T6 | **The calendar is not respected**: a feast is `A.pick(GD.FESTIVALS)` in any month, so Spring Equinox comes in August and "The May hiring fair… 1 May" on 24 November. [design; lead: code read] | 6 | A feast only on its date; month windows on dated events; a lint. **X3** |
| T7 | **One button prints money and mastery.** "Lend money at interest" won 36 times in 37; Trade went from Apprentice to "Legend, 50,000 hours" between the ages of 22 and 31. [design] | 6 | Loans run for months with debtors who can default; repeated gains decay. **X4** |

### Relationships and family

| # | Flaw (concrete evidence) | Severity /10 | How to fix |
|---|---|---|---|
| F1 | **A newborn is handed the whole clan**: 10 to 42 relationships at birth, in every class. A peasant (seed 11) has 25: parents, 1 sibling, 4 grandparents, 5 uncles and aunts, 5 in-laws, 8 cousins [lead: probe]. `src/family/99994-v2-family/b-family.core.js:127-184` links every generated relative. The page says "These are the people you have chosen to know". [design, world, ux] | 9 | The tree holds kin you know of; relationships hold people you know: parents and siblings. The rest enter through a scene. **C6** |
| F2 | **A noble child has no household**: in 42 starts no relation is anything but kin; there is no nurse, maid, tutor or guard knight. [design, world; lead: probe] | 8 | Seed the household by station; they are commoners with lives of their own. **C6** |
| F3 | **Events invent family.** `lf_sib_cover` has no sibling check and `sibOf` makes one [lead: code read]: an only child covers for "your sister Sunniva", born with no parents; "Ysolde, who you played with every day" dies unmet. [design, world] | 7 | `known()` never mints kin; a missing relative drops the card; a lint on kin tokens. **C6** |
| F4 | **Impossible relatives where a great house meets the generated family**: an "Aunt · 65" beside a grandfather of 45, who is "Heir" to his own daughter, the "Head of the family"; 12 relatives outside the tree in 16 noble births. [world, design] | 7 | Build the parents inside the house's tree; one resolver for head and heir. **C6** |
| F5 | **The named world is four-fifths noble**: of 998 living named people on day 0, 820 are noble or royal, 142 artisans and 25 peasants; there is no serf or slave at all [lead: probe]. A commoner has nobody to meet. [art] | 7 | A parish of named commoners (priest, reeve, miller, neighbours), held as seeds until met. **C6** |
| F6 | **"Make a friend" is a vending machine**: each click mints a stranger; a child of 4 made three friends of 14. [design] | 6 | "Spend time with…" people you already meet; children meet children. **C6** |
| F7 | **Births have no clock**: married on 31 December, a daughter two days later; all 6 births seen fell on 1 or 2 January. [design] | 6 | Conception, then nine months. **C6** |
| F8 | **The People page repeats and misreads people**: the same kin under "Kin of note" and "Family"; a grandfather "Wants money" from a newborn; the dead hold opinions. [ux, world] | 5 | A Household block with faces; wants by age; the dead under "Remembered". **C6** |
| F9 | **The family tree is not a tree**: rows by generation, no lines, your own row last. [ux-draft] | 5 | Centre it on you, with connectors. **C6** |
| F10 | **The person card leads with combat and lore**: a father's first chip is "less than one levy", and a column rates a fight with him. [ux] | 5 | Lead with relation, age, trade, mood toward you and three actions. **C6** |

### Names, cultures and world

| # | Flaw (concrete evidence) | Severity /10 | How to fix |
|---|---|---|---|
| N1 | **One culture per realm**: 76 of 76 named people in Aldmark are Northfolk [lead: probe]; Corvasse, "a mixed people of every coast", is 24 Corsairs and 1 orc; breakaway realms come out Northfolk. No port or border is mixed. [world] | 8 | Culture by province and person: ports draw 15 to 35% of births from trade partners, borders 20 to 40% from the neighbour. **C7** |
| N2 | **Eleven realms share two name pools.** One Northfolk list (Leofric, Ranulf, Gudrun, Anwen, Isobel) names five realms, jarl-ruled Northreach among them; one Italian list names six, French-named Solenne among them. The owner's European majority has the least variety between realms. [world] | 7 | A plain flavour per realm inside its people's pool (English, Norse, German, French, Italian), all common names (rule 9). **C7** |
| N3 | **Fiefs named in another people's language**: "Viscount of Bramham: Yusuf Jamali"; elves get French syllables and dwarves Mongol ones, from v2's four syllable sets; "Baron of Ashford:  Mentis" has no given name. [world] | 7 | Place names from each people's own list; never an empty name. **C7** |
| N4 | **Thirty names per sex make twins**: every culture has exactly 30 and 30 [lead: probe]; one town has four "Wynn of Kingsmere"; "Sewald Harrow" is both an uncle and a cousin. [world, design] | 6 | Larger pools of plain names with bynames (the draft data has 38 a sex and 40 bynames); no clash in a town or among close kin. **C7** |
| N5 | **Realm names contradict their governments**: the "Kingdom of Ulun" is a Khan over nine tribes; the "Kingdom of Brannoch" has "no king, no lords". [world] | 6 | Khanate of Ulun, League of Brannoch, Free Port of Corvasse, the Ughrak Clans. **C7** |
| N6 | **The noble ladder contradicts the game's own lore**: Sylvaran's lore says "no counts or dukes" and it has 2 dukes and 22 counts; Brannoch ("no king, no lords") has 4 counts. [world] | 5 | Make lore and titles agree, with familiar words only (Jarl, Emir, Khan, Elder); where none fits, keep Count and change the lore line. **C7** |
| N7 | **Mixed peoples that are not mixed**: Corsairs draw only English pet names; Marchfolk lives nowhere; the Codex lists peoples with no place on the map. [world] | 5 | Corsairs draw from the coastal pools; Marchfolk in the marches; hide or place the rest. **C7** |
| N8 | **Style words ignore sex**: women are styled as men 42 times ("Lord of Foxhurst", Hawise Blackthorn); `r.title` stays "Queen" for a king in 57 cases. [world] | 4 | Styles computed from what is held, with gendered forms. **A2** |
| N9 | **The world's scale is not medieval**: "Kingsmere (forest, 1,327,225 people)"; the elf realm is listed as "27,300 humans". [design] | 4 | Towns of 1 to 60 thousand; the province counted apart; each people under its own name. **C7** |
| N10 | **One council for every people**: an orc horde has a "Chaplain of Gorath". [world] | 4 | Rename a seat only where the word is plainly wrong for the people. **C7** |
| N11 | **The lore has islands and the map has none** ("the Corsair Isles", "Three-Isles"); and one given name can belong to a man, a dwarf and a giant (Kettil, Torvald). [world] | 4 | Rewrite the notes for a coast; no name in two peoples' pools. **C7** |
| N12 | Small things: two -havens, two -deeps and two -holds among the realms; Codex entries that read as curiosities ("Leaf People: small forest hunters"); two men with women's names in 11 worlds. [world] | 3 | Rename one of each pair; write peoples, not curiosities; fix the generator that ignores sex. **C7** |

### Characters and art

| # | Flaw (concrete evidence) | Severity /10 | How to fix |
|---|---|---|---|
| V1 | **One face for everyone.** Every bust is the same oval, eyes, nose tick and mouth from 12 to 80; identity is hair, a hood and the frame. With the hair covered, 24 random people cannot be told apart. [art; lead: sheets looked at] | 10 | 15 to 20 face genes with real range, stored on the person and blended from both parents; accepted on a cover-the-hair sheet. **C8b** |
| V2 | **Class is unreadable below the nobility**: slave, serf, peasant, artisan, merchant and gentry wear one crew-neck tunic; the only cues are patches, an apron, a gold frame and ermine. [art; lead: class sheet] | 9 | A dress table by class, culture, wealth and role; accepted on a sheet with the labels hidden. **C8c** |
| V3 | **War leaves no marks.** A battle's "wound to the face" takes 7 health and never writes `pc.wounds` (`src/war/99997-v2-war/b-battle.core.js:256`); of 998 living people on day 0, none has a wound. [art; lead: code read, probe] | 9 | Every wound is stored with a place and a year, and drawn; veterans start with scars. **C8b** |
| V4 | **The stored face genes do almost nothing**: the jaw moves by at most 2.5 units of 100 (`src/ui/93-anime-portraits/anime.core.js:570`), and 16 variants of one man look the same. [art; lead: line read] | 8 | Ranges four to six times wider; shapes, not only widths. **C8b** |
| V5 | **Men read as women**: 12 beardless men and 12 women at 88 px cannot be sorted. [art] | 8 | Differences by sex from the mid-teens: brow, jaw, neck, eyes, shoulders. **C8b** |
| V6 | **Nobody ages between 12 and 60**: a woman at 12 and at 50 is one drawing; an elf at 5 and at 350 the same; a First Minister of 48 is drawn as a girl with a bob. [art; lead: ages sheet, screenshot] | 8 | Age as a continuous change (lids, folds, jowls, hair, bone); infant drawings per people. **C8b** |
| V7 | **Soldiers don't look like soldiers**: a man with mail, helm and shield is a bald man in a striped top. [art; lead: class sheet] | 7 | The bust shows the military layer, and a badge of the arm. **C8c, D11** |
| V8 | **Build, height and weight do not show**: 150 cm and 195 cm fill the same frame. [art] | 7 | Scale inside a fixed frame; build drives shoulders, waist and neck. **C8b** |
| V9 | **Lists of people are walls of clones**: about 20 identical busts in one house tunic. [art] | 7 | Falls with V1, V2 and V16; relation and age on the frame. **C8b, C8c** |
| V10 | **Expression is random, not character**: closed-eye grins sit on a slave father and a royal alike; nothing tells cruel from brave, and the owner asked for personality. [lead: sheets; art] | 6 | Resting expression and bearing from temperament and mood. **C8b** |
| V11 | **Every great moment is announced like a prize**: one tilted band, paint splat and speed lines for VICTORY and for a levy's death. Anime is the owner's order; its register here is child-like and festive for a chronicle of serfs. [art; lead] | 6 | Let the anime grow up; a tone per kind of cut-in. The owner picks the register. **C8a, C8c** |
| V12 | **Five hands in one game**: gold-on-night chrome, child-faced portraits, Japanese-print skies, a satellite map, a vellum Chronicle. [art] | 6 | One art bible: line, palette and labels shared across them. **C8a** |
| V13 | **Hoods hide the one thing that differs**: about 30% of people, indoors and at every age. [art] | 6 | Hoods by context and culture; never in lists. **C8c** |
| V14 | **Muttonchops draw as a muzzle**; 64 people in one world wear them. [art] | 6 | Redraw; an image test. **C8b** |
| V15 | **Dark skin loses the face**: line contrast falls from 3.6:1 to 1.16:1. [art] | 6 | Lighter rim lines; a 2.5:1 test. **C8b** |
| V16 | **Crude regalia and paper-doll figures**: an "O" pendant like a life ring; a duelist in crown and ermine with no sword. [art] | 6 | A jewel by rank; clothes by occasion; real garment shapes. **C8c** |
| V17 | **Event pictures show the wrong subject**: a farming offer shows a forge; a cow in a ditch shows a bedroom. 25 compositions serve every event. [art] | 6 | Tag events with a scene; about 60 compositions. **C8c** |
| V18 | **Eye colours are neon**: 67 of 137 Solenfolk have lime-green eyes. [art] | 5 | The stored colour, barely boosted. **C8b** |
| V19 | **The prints repeat and break scale**: eight interiors share one wall; a pine branch frames the desert; "errand" has a street lamp. [art] | 5 | Interiors by class; framing by biome; a grid for scale. **C8c** |
| V20 | **Cut-ins run over the reading text**, and one fired during a render can be lost. [art] | 5 | Their own band over a scrim, outside `#app`. **B5** |
| V21 | **A "scarred" quirk draws a slash on a newborn's face.** [art; lead: ages sheet] | 4 | Scars are wounds with a year. **C8b** |
| V22 | Small things: the dead are a grey filter; the Chronicle's body is set in the interface's sans; four icons misread. [art] | 3 | A memorial plate; a book face; redraw the four. **C8c** |

### Map

| # | Flaw (concrete evidence) | Severity /10 | How to fix |
|---|---|---|---|
| M1 | **The map has no roads, fords, bridges or passes.** Nothing in `src/map` draws or stores one; the road graph of `src/economy/9995-trade-roads` is `.wip` and ran only on the removed Far Lands [lead: files read]. Borders are dashed double lines that read as roads. [art] | 9 | A road graph in two ranks; a ford or bridge at each crossing; named passes; borders that cannot be taken for roads. **D9** |
| M2 | **Terrain is one word per province, and the word means little.** The war map reads one multiplier and one width per province (hills 0.78, forest 0.85). The battle calls any marsh province "a river ford" and any mountain province "a mountain pass" (`W.TERR`). 125 of 306 provinces are "hills" in each of three seeds, and 5 to 20 are plains [lead: code read, probes]. This is the owner's "the tile map flattens tactics and terrain". [design, art] | 9 | Features inside a province and on each border (woods, marsh, a ridge, a river crossing, a road), read by movement, supply, ambush and battle, and named in reports. **D9** |
| M3 | **Rivers carry no meaning**: towns are seeded at random on land, not on rivers or coasts (`makeProvinces`, `src/map/engine/continent.js`) [lead: code read]; at zoom 6 they are two hairlines with no tributary. The engine does hold flow and river paths. [art] | 7 | Site towns on water; draw tributaries; rivers carry trade and stop armies. **D9** |
| M4 | **Places ignore the ground they stand on**: every seed has 22 "oasis" provinces, and seed 1 has 2 desert ones [lead: probe]; "Vrakhul Oasis" is on taiga; up to 58 provinces are savanna. [art] | 7 | Guarantee the climate bands the realms need; name and type a place from its ground. **D9, C7** |
| M5 | **Realm colours cannot tell realms apart**: 16 colours for 34 realms, each shared by two or three [lead: probe]; all are pastels, at a 28% tint. [art] | 7 | Twelve hues in three steps, so no neighbours share one; fill the realm. **D9** |
| M6 | **The ground blurs when you zoom**, with cloud-white blobs along the coast [lead: screenshot]. The satellite look is the owner's order; the smear is the fault. [art] | 6 | Hillshade at native resolution; crisp vector layers on top. **D9** |
| M7 | **Nothing is named but realms and towns**: no sea, range, forest or river, and no scale bar. [art] | 6 | A label layer; the names exist in `LORE.map`. **D9** |
| M8 | **The War Room's map is crowded**: counters overlap at 420 px, orders are straight white lines, and units carry NATO-style frames. Its painted ground is better than the main map's. [art, ux-draft; lead: screenshot] | 6 | One map component; stacked counters; orders along roads; banners. **D9, D10** |
| M9 | Small things: two map modes lit at once; a dark strip down the canvas's left at zoom 6; the compass rose covers a coast. [art, ux-draft; lead: screenshot] | 3 | Single-select modes; fit the canvas. **D9** |

### War and military

| # | Flaw (concrete evidence) | Severity /10 | How to fix |
|---|---|---|---|
| W1 | **Battle choices ignore the battle.** `W.choices = b => VW.CHOICES[b.rank]` (`src/war/99997-v2-war/b-battle.core.js:205`) is a fixed list per rank. A Squad Captain got "Keep the squad tight / Plug the gap in the line / Pick off stragglers" in all four phases, in a mountain pass against horse and on hills against levies. The engine holds a table of what beats what (`src/war/engine/war.js`), and no choice shows it to the player. [design, ux; lead: code read] | 9 | Choices built from your arm, the ground, the enemy and the phase ("ground the butts and brace"), each saying in words what it beats and fears. **D12b** |
| W2 | **The arm of service is a label.** Enlisting is one click and a toast ("among the spearmen", said to a trained lancer); the arm is chosen a year later and changes nothing. There are 34 troop types [lead: probe], but no arm has its own ranks, training, gear, missions or career. [design] | 8 | Branches as data (drafted in `docs/research/d11-branches.json`); enlisting is a muster that fixes the arm from birth, skill and gear. **D11** |
| W3 | **The campaign between battles is empty clicking**: 21 of 27 weeks had nothing to answer; "Your host sits before enemy walls." came five weeks running. [design] | 8 | Each week is a decision drawn from the army's state, or it is skipped. **D12b** |
| W4 | **War screens ignore rank and deployment**: a File-Leader's War Room shows the whole theatre and enemy stacks marked "7.3k"; a child of 9 reads an elite order's strength. [ux] | 8 | War pages only when deployed; the War Room by post; enemy numbers as estimates. **D10** |
| W5 | **Flank, ambush, siege and supply are numbers, not moves**: a daily pick matched like rock-paper-scissors (`A.WTAC`); a siege is a day counter with a monthly card; supply is a ratio; blockades exist only in the lore [lead: code read]. The owner asked for each as command. | 8 | Orders with a place: cut this road, hold that ford, close the port; scouting sharpens estimates. **D12b** |
| W6 | **The commander's field ignores the ground**: "Forest · rain" is a flat grey plane [lead: screenshot]; heavy cavalry hold a wing on a mountain; enemy blocks read "752" under "about 15,000". [design, art] | 7 | Draw the field from the province's features; frontage and cavalry limits come from them. **D12b** |
| W7 | **The soldier's battle is a text box**, and the story column already reads "your side wins. 1,192 fall." while the dialog asks for your choice. [art, ux] | 7 | A picture per phase; hold the story lines until the dialog closes. **D12b** |
| W8 | **The War Room speaks a modern staff's language**: "Templates", "Industry", "Manpower", "infiltration"; and the ranks are "File-Leader", "Squad Captain", "High General". The owner asked for knights, cavalry, infantry and archers. [lead: screenshot, `GD.MIL` read; world] | 6 | Plain words, and one clear table of what beats what; trim the War Room to what a commander of those arms decides. No historical remodel (rule 9). **D12a, D11** |
| W9 | **Battle marks belong to another age**: yellow starbursts that read as gunpowder; units as boxes with numbers. [art] | 6 | Arrow arcs, dust, falling banners; counters with banner and troop glyph. **D12b** |
| W10 | **Practice maims, and the joust is not one**: sparring ends in "a terrible wound" for a child of 9; the tournament's joust is fought on foot. [design] | 5 | Sparring stops at bruises; one joust model. **X4** |
| W11 | **Army pay dwarfs every other living**: a Squad Captain earns 1,200 suns a year at 16; a pedlar earns 80. [design] | 5 | A soldier's few suns a month; wealth from loot and ransom. **D11** |
| W12 | **The battle field does not fit a phone**, and "Solenne" is printed twice at its corner. [art; lead: screenshot] | 5 | Fit to the width, or one wing at a time; clear the text layer. **D12b** |

### Events and text

| # | Flaw (concrete evidence) | Severity /10 | How to fix |
|---|---|---|---|
| E1 | **Cards hide lethal fights behind mild words.** "Go forward to meet them / Starts a fight / +25 suns" opened an ambush "to the death" and killed a boy of 19; none of 19 such choices mentioned death. The chip has one wording for every fight (`src/events/9998-stakes/stakes.a-read.core.js:220`). [design; lead: code read] | 8 | Build the stake from the fight the choice opens; a lint. **X3** |
| E2 | **The card's promise is not what happens**: "Costs 3 suns" charged 27.4; "blunted steel" became "a good sword drawn"; "(+15898 suns.)" stood beside "▲ +7,949 suns". [design] | 7 | Preview and effect from one `fx` object; a replay test. **X3** |
| E3 | **Infants make adults' decisions**: at 7 months, "Tend the neighbours yourself (Check: Medicine)"; a child of 4 hires on for the hay; "Send your child Tamsin in your place" on the day she is born. [design] | 7 | Age gates on every pool; world arcs worded as the parents' choice. **X3** |
| E4 | **Cards ignore your station**: a captain of 17 is asked for his voice at the council; a farmhand of 14 passes the College's law examination; a pedlar gets "your journeyman". [design] | 6 | Gate with `C.office`, `C.jobRank`, `C.prof`; lint station words. **X3** |
| E5 | **Cards ignore where you are**: a company in Gorath gets cards headed "Yewmarch"; a general at a siege gets "Stolen hours by the river". [design] | 6 | Track the player's place and filter by it. **X3** |
| E6 | **The ending is someone else's**: "Master of the Craft" for a banker and a First Minister; "Survivor" for a boy killed at 19. [ux, design] | 5 | Choose the ending from the career lived. **X3** |
| E7 | **Counsel comes from people who are not there and favours what they did not say** (40 of 465 cards). [design] | 5 | Only someone present counsels; write the line from the choice. **X3** |
| E8 | **Pronoun and identity slips**: "Oriana, a prince of Sahrim, rises unsteadily with his cup"; 75 texts hard-code he or she after `{them}`. [world, design] | 4 | A lint on pronouns and names. **X3** |
| E9 | **Filler glued onto scenes, and lines that repeat**: "Fieldcraft: Rain by nightfall" in a famine; "Short days and long evenings. Nothing of note." two months running. [design, ux; lead: screenshot] | 4 | One extra line at most, on the card's subject; no quiet line twice in a year. **X3** |
| E10 | **Copy bugs in plain sight**: "Would teach you f" (`src/people/998-people-want/want.core.js:17`); "1 armies in the field". [ux, world; lead: line read] | 4 | Fix `skName`; a plural helper. **A0** |
| E11 | **A drugging is a free romance option**: "A love philtre… slip it in her cup", with no risk. [design] | 4 | Cut it, or make it a crime. **X3** |
| E12 | Small things: choices that change nothing; cards with one choice; miles beside kilometres. [design] | 3 | Say what a choice costs; one system of units. **X3** |

### Tests and process

| # | Flaw (concrete evidence) | Severity /10 | How to fix |
|---|---|---|---|
| Q1 | **Errors are swallowed and no test can see them.** The built core has 1,112 `try` blocks (the release had 72), 297 with an empty `catch`. Tests fail on `pageerror` only; `tools/soak.mjs` is in no workflow; the one-holder test plays 10 years where R5 needs 54. [eng] | 9 | Fail on any `console.error`; one `A.guard`; 8 seeds × 60 years every night. **A3a** |
| Q2 | **No performance gate plays the game**: the bench times the engine alone, on the wall clock; nothing presses the button at year 50, shows a hint or dies. [eng] | 8 | The press loop in CI on committed saves, with budgets. **A1** |
| Q3 | **The coherency checks are not in the build** (`src/core/08-coherency` is `.wip`). Its first run found dead councillors in 3 of 8 lives and raised 24 false alarms (P22). The audits that exist would have caught R5, and nothing runs them for long enough. [coh, eng; lead] | 7 | Into the build, with a baseline that may only shrink. **A3a** |
| Q4 | **Playtests cannot see what the owner sees.** Bots step with `A.advance` and answer with `A.eventAuto`; the first critique round measured that way and missed P1. Nothing checks one persona's screen, a hover or a face. The owner found his complaints by playing. [lead] | 7 | The real-press harness; a persona test; picture sheets judged by agents. **A3a, B5, C8b** |
| Q5 | **The test runner dies with the browser**: a crash ends the shard with no summary; no test has a time limit; each of 8 shards rebuilds and relints. [eng] | 6 | Relaunch on a crash; a limit per test; build once. **A3a** |
| Q6 | **The skills and docs teach the old rules**: "One button moves time", "Never hide a description behind a click", a family that walks three generations; the test `v2tNoPlay` asserts one button. [lead: files read] | 6 | Each step updates the skill, the spec and the test it reverses. **B4, B6, C6** |
| Q7 | **The measuring tools are not in the repo**: the press harness, the posts census, the world sweep and the screen measurer live in `/tmp` of a container that is wiped. [lead] | 5 | Commit the scripts (about 600 KB) under `tools/bench/`. **A0** |
| Q8 | **Timing tests on the wall clock**: 9 test files and 22 fixed sleeps; the first critique round made the same mistake. [eng] | 5 | CPU time, on a fresh page. **A3a** |
| Q9 | **The built game is committed every round**: 98 copies of `index.html` are 103.5 MB of a 115 MB pack. [eng] | 5 | CI publishes the build, if the owner agrees. **X5** |
| Q10 | Three tests pass by skipping. [eng] | 2 | A SKIP state. **A3a** |

## 4. Keep

These are good. No step above should tear them down.

- **Determinism.** No `Math.random` in the engine; drawing moves no dice; journals of 10, 30 and 60 years replay to
  the same fingerprint. With it: the journal, `A.replay`, the fingerprint in every save, the four-slot backup ring.
- **The engine's month**: flat for 60 years, at 8.4 to 12.5 s of CPU a decade with a bot answering every card.
- **A reproducible build**, the CSP with script hashes, no inline handlers, `UI.esc` on every value.
- **The v2 engine as plain modules with unit tests**, its audits, 09-scale's CPU timing and `tools/soak.mjs`.
- **9997's captains as seeds**: 30,376 named captains for 673 KB. It is the pattern for sparse posts (A2) and for
  commoners held until met (C6).
- **The continent engine**: one landmass, erosion, flow, river paths to the sea. D9 needs no new generator.
- **The phone event card**: art band, short text, effect chips, odds in words with the tipped scale. It is the best
  screen in the game, and the phone shell around it is nearly as good.
- **The quiet month** as a note and a story line, never a card; the stakes chips; the after-action "What decided it".
- **Events that remember**: the Edda arc (a choice at 17 returns as "What Edda told" and "Back from the hulks");
  thoughts that ripen into traits; "After Urgol", three accounts of one battle side by side.
- **The voice**, above all in childhood: dry, concrete, unsentimental. About 2,400 cards showed no raw token.
- **The merchant cards**, the staged company missions with named men, the Path ladder with its checklist.
- **The raw material of war**: a table of what beats what and five kinds of ground in the v2 battle engine, 34
  troop types, drill that gates tactics, generals with tempers, a real reserve, sieges with a monthly choice.
  D11 and D12b put these in the player's hands; they do not start from nothing.
- **No spectating**: a civilian already sees no war, only rumour that is late and sometimes wrong.
- **The `takeSeat` path**, the one place where a displaced holder becomes a rival: the model for every appointment.
- **`A.V2.kin.relationLabel`** (exact kinship terms), `A.rulerStyle`, and the realm bible's customs and arms.
- **The portrait pipeline's discipline**: pure, cached, about 6 KB a bust, 0.2 to 0.4 ms. C8 changes what is drawn,
  not how it is delivered.
- **The woodblock skies**, the obituary's dusk print, the duel's face-off, the Chronicle's vellum page, the War
  Room's painted ground; Cinzel, Literata and Atkinson together; the night-and-gold palette.
- **The records** (HISTORY, DECISIONS, OWNER_ORDERS, release branches, saves that must keep loading), and verifiers
  that try to reject a fix before it is merged.

## Appendix A. Claims rejected or corrected

| # | Claim | From | Ruling |
|---|---|---|---|
| 1 | "It is not a session leak." | eng-draft | False as a verdict. P1 is a session effect, the largest one; the draft's bot-played session never met it. |
| 2 | "Layout thrashing is the cause" (rated 9). | eng-draft | Layout is 6 to 17% of a press. The forced reads matter because each forces a style recalculation, and in P1's mode that is the whole page. |
| 3 | "A month costs two to three times more late in life." | eng-draft | 1.4 times in the normal mode and 1.7 in the restyle mode, on fresh pages. |
| 4 | "A refresh takes 1.2 to 3.2 s"; "a quiet month takes 1.2 to 9.2 s". | design, ux-draft | Wall-clock times at load 20 to 50. A refresh is 0.07 to 0.14 s of CPU, and a quiet month 0.84 to 2.1 s on an idle desktop. The conclusion stands. |
| 5 | "Autosave costs 146 to 459 ms." | eng-draft | Three operations timed as one. It is 71 to 180 ms. |
| 6 | "Both diplomacy models cost about the same." | eng-draft | v2's costs three times the old one; together they are 9% of an engine month. The fault is the muting by flags. |
| 7 | "The build takes 52 s." | eng-draft | 14.5 s on a calm machine. Dropped. |
| 8 | "The People page goes from 133 to 1,023 ms." | eng-draft | 102 to 176 ms on fresh pages. |
| 9 | "No console.error in 100 simulated years." | eng-draft | One seed. Seed 7 logged three in year 54: R5. |
| 10 | "Both side columns stay live during a card." | ux-draft | They are dead under a transparent layer (U8). |
| 11 | "A median of 572 words and 54 controls." | ux-draft | 520 and 51 over the 165 real pages. |
| 12 | "Axe passes on 13 of 14 screens, so the game is accessible." | ux-draft | Axe cannot see hover-only content, clipped text at 200% or 31 tab stops before the page. |
| 13 | "The anime direction fights the subject; move the faces to a Pentiment or Darkest Dungeon hand." | art | Rejected as a fix. Anime was the owner's order of 26 October ("graphic masterpieces, anime-like"). The flaws are sameness and register (V1, V11), and both can be fixed inside anime. |
| 14 | "Restore the inked map as the main style." | art | Rejected. The satellite ground answered the owner's v2 complaint that the continent "looks drawn". Fix the blur and lay roads, rivers and names over it (M6, M1). |
| 15 | "Rivers start and end in the middle of fields." | art | Partly wrong: the engine's rivers run from source to sea, and the screenshot shows thin upper reaches. The real flaws are in M3. |
| 16 | "Keep the one button and let it run on in childhood." | design | Overtaken by D-008: two buttons. |
| 17 | "Kilograms, metres a second and milliseconds are modern units to remove." | ux, in part | The v2 spec (row 11) asked for real units. They stay, one click deeper (U12). |
| 18 | "513 titles held by the dead." | world | An over-count: a vacant title waits 3 to 12 months by design and still points at its dead holder. The real faults are R5 and R6. |
| 19 | "32 pastels" for the realms; "75% of the world is noble". | art | Both are worse: 16 colours for 34 realms (M5); 82% noble or royal (F5). |
| 20 | "No v2dip: 24 problems in 8 of 8 lives." | coh | A day-0 artefact, not a broken save (P22). |
| 21 | "16 tests pass by skipping"; "311 names redefined"; "122 `!important`". | eng-draft | 3, 351 and 169. |
| 22 | Scholarly fixes: name pools split into Anglo-Norman, Occitan and Byzantine Greek; a Manding pool for Zanara and medieval Sanskrit for Ranpur; names weighted by period frequency; realms named in their own tongue; regnant forms for "Sultana"; rank words such as vintenar and banneret; dyes by period. | world, art | Dropped under the owner's rule 9 ("keep it game-like and simple", 12 November). The flaws they answered stay where a player can see them (N2 to N6, W8, V2), with plain fixes. |

## Appendix B. Evidence, and what was not judged

**In the repo** (`docs/reviews/round-2/`): `final-engineering.md` and `final-ux.md` (the deciding critics: verified
rows, corrections to the first drafts, the specification for the time controls and the first-glance table for every
screen); `draft-design.md`, `draft-art.md` and `draft-world.md` (first drafts whose claims this document used,
checked where marked [lead]); `draft-engineering.md` and `draft-ux.md` (replaced by the finals); `posts-map.md`
(every store of who holds a post, the Marshal bug reproduced by three roads, bot lives, the registry design and its
write sites); `coherency-run-1.txt`; the two briefs. Draft data for C7 and D11 is in `docs/research/`.

**Not in the repo yet** (the 12 November container; see Q7): the scripts, screenshots and raw numbers under
`/tmp/ardan/critique/<lens>/` and `/tmp/ardan/critique/final/`; the posts simulations in the session's scratchpad
(`sim/`); the frozen build `/tmp/ardan/snap/index.html`, which `node tools/version.mjs get v2.0.0-beta.1` rebuilds.

**The lead's own checks** are marked [lead] in the tables. They were code read in the live repo, four probes on the
frozen build (seeds 1, 5, 11 and 42: relationships at birth, classes and wounds of the living, councillors' ages,
realm colours, terrain and place types, names and culture per realm, a newborn's first 48 months) and eight
screenshots looked at (faces, classes, ages, the map at zoom 6, the commander's battle, the War Room, a year-25
desktop page, a newborn's first phone screen).

**Not judged by anyone:** sound and music; diplomacy, the economy and a ruler's reign in any depth; play on a real
phone (the timings are a desktop under CPU throttle); real new players (every playtest so far is a bot or an
agent); mods; saves across versions beyond `tests/saves/`.
