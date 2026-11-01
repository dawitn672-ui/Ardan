# Cycle 1 review: the first hour

**Reviewer:** first-hour · **Build:** `index.html` as of 27 Oct, 10:03 (98 features) · **Angle:** a curious 15-year-old opening Ardan for the first time.

## How I played

- **Screens:** 1366×768 (mouse) and 390×844 (touch, `isMobile`), through the real menu: title, the four creation steps, "Be born", then Week and Month steps. Playwright scripts are in `/tmp/ardan/cycle1/first-hour/*.cjs` and screenshots in `/tmp/ardan/cycle1/first-hour/s/`.
- **Lives:**
  - Newborn, Great Continent, Aldmark. I ran this twice: 8 steps, then 2 weeks and 22 months.
  - Coming of age (16), Great Continent, City of Varinj (POL-80): 6 weeks and 10 months.
  - Grown (22), Great Continent, Kingdom of Thinsak (POL-100): 4 weeks and a month, plus three activities.
  - Grown, phone, Known World only, and Coming of age, phone, Known World.
  - Newborn, phone, Great Continent.
  - The story start "Clanless": 2 weeks and 4 months.
- **What I clicked:** the first choice of every event, "Continue", and in one life the activities Look for love, Make a friend and Drink at the tavern. I opened How to play from the title.
- **Errors:** no page errors in any run.

**Timings (desktop, Great Continent):**

| What | Time |
| --- | --- |
| Content ready | 2.8 s |
| "Be born" to a drawn life | about 2 s |
| A Week step | 0.25 to 0.4 s |
| A Month step | 0.5 to 1.9 s |

On the Known World only, a month takes about 0.2 s on the phone emulation. Nothing froze. Speed is not the first-hour problem; emptiness and guidance are.

---

## Bugs (ranked)

### B1. The coach marks still teach the old clock, and they cover what they point at. Size S, impact 5

**What I saw:**
- At 1 Jan, every start shows the hint "Not sure what to do? **What now** lists the three things most worth doing." It is drawn on top of the What now list, so items 1 and 2 are hidden under it. Only item 3 shows below (`s/t3-start-noskip.png`, `s/nb-born.png`, `s/coa-born.png`).
- In the 16-year-old life it was still there in December, eleven months on, because nothing dismisses it but "Skip" (`s/coa-step15.png`).
- After one Skip, the next hint takes its place: "Your plan decides…". Then comes "Time is paused. Press **Play** at the top (or Space) and the days run until something needs you. **Next** jumps ahead." That one appears while an event card is open and the clock shows "Go on" (`s/t3-w0-ev0.png`). Play is no longer the main control, Week and Month are, and Space is not what the player was taught.
- The hint box intercepts clicks. Playwright could not click "Look for love" because `<div role="note" class="hint">` lay over it (t3 run log).
- On the phone, the event tip says "Number keys 1–6 choose too", and the tip box covers the top of the scene (`s/ph2-d-event0.png`).
- What now's "Let time run" (`A.whatNow`) also says "Play, and stop when something needs you" and points at `clkPlay`.

**Why it matters:** these are the only teaching a new player gets. They hide the list they describe, and they name a control the game has demoted. At 15 you skim the hint, see Play, press it, and never find the Week and Month rhythm the game is built around.

**Fix:**
- In `UI.tipsInit` (the tips feature, 84-top-bar's round): rewrite the `clock` tip as "Press **Month** (M) to live the next month; **Week** (W) for a shorter step. Events stop the step." Drop "Number keys" under `pointer: coarse`.
- Place the tip box *above* or *beside* its target, never over it, and give it `pointer-events: none` except on its own buttons.
- Retire a tip once its action has been taken: What now clicked, a step taken.
- Change `A.whatNow`'s "Let time run" to "Live the next month" with action `stepStart('month')`.

### B2. Adult-only events reach infants. Size S, impact 4

**What I saw:**
- At age 0, "Chalk on the doors" offered "Tend the neighbours yourself (Medicine check)" and "Leave for the country, costs 8 suns" with 0 suns (`s/nb2-step8.png`).
- At age 1, "The price of a loaf" had the baby haggle with the baker's girl and "carry a sack home on your shoulder" (nb2 run).

**Cause:** `C.child(p)` is `A.stage(p) === "child"`, and the stage below it is `"infant"` (under 3.2 years for a human). So `!C.child(p)` means "infant, teen, adult or old". Seven events use exactly `cond: (p, C) => !C.child(p)…`:
- 36-sieges: `sg_walls`, `sg_sacked`, `sg_terms`;
- 57-world-chronicle: `wc_bread_since`, `wc_bells_for_ruler`, `wc_sickness_comes`, `wc_old_coin`.

**Why it matters:** the first event a newborn player ever sees can be an adult's choice in a baby's life, which reads as broken.

**Fix:**
- Replace `!C.child(p)` with `!C.young(p) && C.age(p) >= 3` in those seven, or with `C.adult(p)` where the text is plainly adult.
- Teach `tools/lint-events.mjs` to warn on a bare `!C.child(p)`.

### B3. The title screen describes the old world. Size S, impact 3

**What I saw:** the title says "Thirty-four realms, a hundred million souls" and shows only the Known World map (`s/d-01-title.png`, `s/ph-01-title.png`). The default lands are the Great Continent: "152 realms · 1,992 provinces" on step 4 (`s/d-cr3-full.png`).

**Why it matters:** the biggest thing the game has is undersold on its first screen.

**Fix:** in `UI.renderTitle` (99-far-lands or 86-title-fold), read the count from the default lands ("A hundred and fifty realms…") and use the Great Continent strip when it is the default.

### B4. How to play is out of date and runs to 998 words. Size S, impact 3

**What I saw:** the help modal (`s/t3-help.png`) teaches "Press Play (or Space)… speeds 1–5… Next runs until something needs you". It never mentions Week or Month. It is one scrolling wall of 998 words: tabs, the War Room, treaties, coronations.

**Fix (`UI.A.help`):**
- Put a five-line "Your first hour" block at the top: Month, read, choose, spend initiative on an activity, look at What now.
- Fold the rest under headed `<details>`.

### B5. Choosing "The Known World only" silently throws away the realm you picked. Size S, impact 3

**What I saw:** I picked City of Varinj on step 1, then clicked "The Known World only" on step 4. The realm became Empire of Aldmark, and the life began there. Nothing said so (t4 run, `s/t4-kwonly.png`).

**Why it matters:** the order of the steps invites this. Lands come last, but the realm list on step 1 already holds all 152 realms.

**Fix (99-far-lands, `A.FAR.creationField` and `realmOptions`):**
- Move Lands to step 1, above Realm of birth, and filter the list by it.
- Or keep the choice, grey out "Known World only" when a far realm is chosen, and say why.

### B6. Seasons and places are wrong in the first events of far lives. Size M, impact 3

**What I saw:**
- "The spring crawl" ("Spring, and your family's channel must be cleaned") fired on **2 January** in Varinj (`s/coa-ev1.png`; 990-far-peoples, `bible.b.data.core.js`).
- In a broker-run free city, the next months brought "The village meets in the church", "Take it to the manor court", "the reeve", "the lord's harvest gangs" and "the raising of her new barn" (coa run). The far realms fall back on Westland village events.
- "December, and the Long Night of Lamps. The Long Night of Lamps." The festival name is printed twice (990-far-peoples feast event).
- The 57-world-chronicle echo line (`b-cite.core.js:279`) gave, in one year of one life:
  - "Since 1105, part of every tax here goes to **Phelkar**";
  - then "…goes to **Khaganate**", a type word used as a name;
  - "Since 1105" means this very year, followed by "Nobody forgets it".

**Fix:**
- Gate seasonal far-peoples events on month, the way `wc_*` feast events read `A.S` dates.
- Tag village-and-manor events `town:false`/`terr` so that city-type realms (`Free City`, `City of`) skip them.
- Dedupe the festival token.
- Use the overlord's full name, and require `x.y < year - 2` for the "since" echo.

### B7. Sticky hover on the phone makes two peoples look chosen. Size S, impact 2

**What I saw:** on the phone's first creation screen, Human (selected) and Dwarf (not selected) both carry the gold border (`s/ph-cr0.png`). Dwarf sits where the "Begin a new life" tap landed, so it holds `:hover`.

**Fix:** wrap the card hover border in `@media (hover: hover)` (71-phone).

### B8. Smaller copy bugs seen in the first hour. Size S, impact 1 or 2

- "Costs 1 suns" (`s/nb2` run, `wc_bread_since` preview). Pluralise in the choice-preview formatter (24-honest-odds or 33-choices).
- The drop cap makes the text read "Abig drunk", "T hree shepherds" to `innerText` and screen readers (92-scene-card). Mark the drop-cap letter `aria-hidden` and keep the full word in the text.
- "Pay the mark" costs 2 suns but shows no cost chip, while other choices show "Costs N suns" (`s/ph2-d-event0.png`; 47-realm-bible's `req: p => p.coin >= 2` choice has `fx.coin` and still no chip).
- The Codex line "You see a **Bactrian** Wild Camel" puts a real-world place name in Ardan (`s/coa-step15.png`; 992-far-beasts).
- A Month step ends on the **2nd** ("2 February", "2 March"). Players will read that as "the month skipped a day". Show the 1st, or label the step "February begins".

---

## Improvements (ranked)

### I1. The newborn start is 16 Month clicks of nothing. Size M, impact 5

**What I saw:**
- In one newborn life the first event came after 2 weeks and **16 Months**, at 2 May 1106 (nb2 run). In the other, after 7 Months, and it was the infant-plague bug above.
- Each empty Month shows the same screen: "Let time run" and two greyed tiles, "See a physician" and "Rest and recover", at 0.0 initiative (`s/ph3-month-running.png`, `s/nb-step7.png`).
- 82-early-years speeds up only the Play clock ("early years ×10"). The Week and Month steps the owner chose still pass one month per click. The "early years ×10" label sits next to Week and Month as if it applied to them.
- Newborn is the **default** start.

**Comparison:** BitLife's baby years are one tap per year with a line of text each. CK3 skips childhood to a few choices.

**Fix (82-early-years or 84-top-bar's `step.core.js`):**
- While the player is under 3, relabel Month as "Next season" (three months), or offer "Grow up a year".
- Guarantee one small infant scene (a parent, a sibling, the house) every second step.
- Or make Coming of age the default start on a first life. That was already the owner question in 82's README.

### I2. The Week step is hollow. Size M, impact 4

**What I saw:**
- 16-year-old, Great Continent: weeks 2 to 6 held **0** events. Every Month held exactly **1** (coa run).
- Phone, Known World: weeks 2 to 4 held 0 events.
- A week also gives about 0.25 initiative (4.0 to 4.3 to 4.5 to 4.8, t3 run).
- The rolled events are drawn at the month's turn, so in practice Week means "skip 7 days and see nothing".

**Why it matters:** the owner's rhythm is "a week or a month at a time, with events and actions inside". The Week half of it is never felt.

**Fix (`step.core.js`, plus the event roll in the core):**
- Roll a quarter of the monthly event chance at each week's end. The same expected count keeps balance.
- Or end a Week with a two-line "this week" note: what training moved, coin in and out, who you saw.
- Hide or demote Week where nothing can happen (an infant, a quiet month).

### I3. Creation is about 12,500 px of scrolling on a phone, and the big choice comes last. Size M, impact 4

**What I saw:**
- The four steps are 3,232, 2,909, 4,038 and 2,384 px tall on 390×844. That is some fifteen screens before birth.
- The choice that most shapes the first hour, age at start (Newborn / Child / 16 / Grown), and the Lands choice sit on the **last** step, after skin swatches, "Shape 1 to 4 / Brow 1 to 3 / Mouth 1 to 3", 40 traits and two 40-skill drop-downs (`s/d-cr1-full.png`, `s/ph-cr3.png`).
- "Score multiplier ×0.85" is shown on every card and never explained.

**Comparison:**
- Hades and Slay the Spire put you in a run within a minute and teach systems later.
- Reigns has no setup at all.
- BitLife is one screen: name, sex, country, Go.

**Fix (`UI.renderCreate`, 29-starts):**
- Open with one screen: three big buttons ("Be born", "Start at 16", "Pick a story") with Lands and Difficulty underneath, and "Customise everything" leading to today's steps.
- Show "Begin from a story" open, with two or three suggested stories as cards. Today it is a collapsed one-line `<summary>`.
- Explain the score multiplier once, in a tooltip.

### I4. The phone life opens on an empty tab, and the birth story is hidden. Size S, impact 3

**What I saw:** on the phone, "Be born" lands on Life → **Now**. The page of "You are born in Amberwick… your father is Hesketh, a shepherd…" sits under the **Story** sub-tab, which nothing points to (`s/ph2-a-start.png` vs `s/ph3-story.png`). A newborn sees a near-empty Now (`s/ph3-month-running.png`).

**Fix (71-phone):** open the first screen of a life on Story. Badge Story when new lines arrive after a step, the way the Path tab already shows a dot.

### I5. Thirty-one activities on day one, with no sense of which matter. Size M, impact 4

**What I saw:**
- A 22-year-old trapper starts with 31 tiles, 7 initiative and about 1 more a month.
- The tiles include "Plot to seize a throne 3⧗", "Found your own company", "Burgle a house" and "Lend money at interest" (`s/t3-start-noskip.png`).
- On the phone they fill three screens under a hint box (`s/phg-born.png`).
- "Make a friend" spent 1⧗ and only added a log line in another column. The click gave no feedback where the player was looking (`s/t3-act-Make_a_friend.png`).

**Comparison:**
- BitLife's Activities is a menu of about 10 that opens on demand.
- Slay the Spire's first floor gives three choices.

**Fix (`UI.renderActs`, 41-circles' filters):**
- On a first life, show the 6 most fitting activities (`A.whatNow` already scores them) and "More…".
- Answer each activity *in place*: a toast or result card where the player clicked.
- Hide ruler-only and criminal-heavy tiles until a flag, a skill or an ambition points that way.

### I6. The first week's events punish hard and can contradict the story. Size S, impact 3

**What I saw:**
- In two of three grown or 16 starts, the first event was "Something is taking shepherds". In "Clanless" the check showed 16% "LONG ODDS"; the hunt failed and left a permanent limp (−9 SPD) in week one (st run).
- The Clanless opening ends with you exiled to dig latrines for a strange clan. The very next card says "The village offers everything it has" to you.
- A grown start's first card was the same beast hunt.

**Why it matters:** first-hour losses should be recoverable (Hades) or clearly the player's own gamble.

**Fix:**
- Hold the beast-hunt trigger back for the first 3 months of a life (`firstHour` guard in 79-beast-scenes or 76-beast-habitats).
- Let a story's opening (29-starts) suppress unrelated triggered events for 2 weeks.

### I7. "What you want", the life's ambition, looks like any other event. Size S, impact 3

**What I saw:** the ambition pick comes as the second card of week one, in the same frame as the bread and tax cards (`s/ph2-f-after0.png`). Its result ("Realms seen: 0 of 8") is the first sign it is a goal tracked for the whole life.

**Fix (46-life-arcs or the ambition event):**
- Give it a distinct frame and a line under each option saying what it will track ("Master your trade: rank 1 of 4 in your trade").
- Afterwards pin the ambition's next step at the top of Now. It already shows on desktop under Ambition; make it larger on a first life.

### I8. Single-choice and dead-end cards in the first hour. Size S, impact 2

**What I saw:**
- "The spring crawl" offered one choice, "Crawl your stretch" (`s/coa-ev1.png`).
- Cards with one button are a click-through, the opposite of Reigns' two-way swipe.
- Every card also needs "Continue" after the result. That is three clicks per event: choose, Continue, then Month.

**Fix:**
- For one-option cards, show the result straight away under the text, with one "Go on".
- Let the next Month press also close a result card. Today Week and Month are `aria-disabled` while a result is open.

### I9. Unexplained words on the first screen. Size S, impact 2

**What I saw:**
- "Untrained · 33" under the name (fighting worth).
- "×2" and "early years ×10" next to Week and Month.
- "7.0 /7 full", "⧗", "training is fair" and "Push for advan…" (cut off).
- "Score multiplier".

Several have tooltips on hover (59-tooltips), but none on the phone without a long press. "Push for advancement" is cut at 1366 px (`s/coa-born.png`).

**Fix (59-tooltips, 84-top-bar):**
- On the phone, make each of these tap to explain.
- Hide the speed (×2) and early-years notes unless Play is running. They describe a mode the first-hour player isn't in.

### I10. Event echo lines read as non-sequiturs. Size S, impact 2

**What I saw:** story openings and ordinary cards gain an unrelated last line:
- "A widow still lays a place at table for a son who went to the Tusk War in 1062" under the Clanless exile;
- "Since 1105, part of every tax here goes to…" under the reeve's job offer (coa, st runs).

On a 50 to 90 word card, the extra line is the one a 15-year-old skips, and it dilutes the story's own opening.

**Fix:** in 57-world-chronicle `b-cite.core.js` and 87-echoes, never append an echo to an opening (`once` or `S.story` events), and only when the echo's subject appears in the card (realm, war, place).

---

## What would make them keep playing

What worked:
- **Stakes in the cards.** The early cards have real hooks: a bandit ambush, the scribe writing your love letters, a feud over a dead cow, a beast taking shepherds.
- **Honest odds.** The odds chips ("26% LONG ODDS", "Medicine 5 +STA") are clear.
- **Fair results.** Results show exact deltas.
- **Rhythm.** For a 16+ start, Month then one card then Continue is a good Reigns-like beat.

What would turn that into a habit:
1. Something every step, whatever the age (I1, I2).
2. A visible thread: an ambition with a next step, a person who comes back. 30-get-to-know and 55-bonds have these; surface one by month 3.
3. Teaching that matches the controls (B1, B4).

## Comparison in one line each

| Game | What it does in minute one | Ardan today |
| --- | --- | --- |
| BitLife | One-screen setup; age a year per tap; an event every tap | Four long steps; a newborn can wait 16 Months |
| Reigns | One card, two choices, instant result | 2 to 4 choices, then Continue, then Month: three clicks per card |
| CK3 tutorial | Guided objectives that point at the button | Coach marks cover their targets and name the old Play control |
| Hades | Fail forward, and the first death teaches | A week-one failed check can leave a permanent limp |
| Slay the Spire | Three choices at a time; the rest unlocks later | 31 activities on day one |

## Top 10

1. **B1:** Coach marks hide What now, block clicks and teach Play/Space/Next instead of Week/Month (`UI.tipsInit`, `A.whatNow`). S, impact 5.
2. **I1:** A newborn (the default start) waits up to 16 empty Months for a first event. Step faster under 3, or default to 16 (82-early-years, `step.core.js`). M, impact 5.
3. **B2:** `!C.child(p)` lets 7 adult events reach infants (36-sieges, 57-world-chronicle); add a lint rule. S, impact 4.
4. **I2:** The Week step almost never holds an event. Roll events weekly or give a week summary (`step.core.js`). M, impact 4.
5. **I3:** Creation is about 12,500 px on a phone, with age and Lands on the last step. Add a one-screen quick start (`UI.renderCreate`, 29-starts). M, impact 4.
6. **I5:** 31 activities on day one with off-screen feedback. Show 6, answer in place (`UI.renderActs`). M, impact 4.
7. **B5 + B3:** Lands sits after Realm, so picking the Known World silently drops a far realm, and the title still says "Thirty-four realms" (99-far-lands, `UI.renderTitle`). S, impact 3.
8. **B6:** Far lives get "spring" on 2 January, churches and manor courts in a broker city, a doubled festival name, and "tax goes to Khaganate" (990-far-peoples, 57 `b-cite.core.js`). M, impact 3.
9. **I4:** On the phone the life opens on an empty Now, and the birth story is hidden under Story (71-phone). S, impact 3.
10. **B4 + I6:** How to play is a 998-word wall that never names Week or Month, and week one can cripple you with a beast hunt that contradicts your story start (help, 79-beast-scenes, 29-starts). S, impact 3.
