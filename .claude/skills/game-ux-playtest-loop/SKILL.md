---
name: "game-ux-playtest-loop"
description: "Simplify and judge a game's UI/UX for immersion (life-sims, strategy, RPGs), and run a playtest loop where agents play the build against the designer's complaint list before shipping."
---

# Game UX for immersion, plus the playtest loop

## The core loop (taken from BitLife and adapted)
- **Two buttons move time: Next month and Next year** (owner's order, `docs/DECISIONS.md` D-008 and D-019; round 2 B6). They sit in fixed places, the largest controls, in the thumb zone above the tab bar (month on the left, year beside it; the year is the main button while the player is a child). There is no play/pause/speed and no "sim a week".
  - **Neither ever becomes a stop control.** While time passes the running button keeps its label, disabled, with a thin progress bar; Esc ends a year at the end of its month. A control that changes meaning mid-press gets mis-pressed.
  - **A year runs month by month and ends with one redraw and one digest** of its quiet happenings. It stops early, and says why in one line, only for what is notable: a card that needs a real answer, a battle or a call to war, an illness or a wound, a death or a birth in the household, coming of age, a deadline. Talk, errands and the day's small happenings never stop it; they wait for the end of the step and come one at a time.
  - **No initiative pool or cap** (D-019): let the player do as much as fits; overtraining has its own consequences (weariness, health, a strain), and that is on the player.
- Each press brings the happenings back as **cards shown one at a time**: a notable card when it falls, small ones at the end of the step. A quiet month brings none.
  - Quiet months pass with a 2-second toast and a feed line, never a card you must dismiss. In Ardan's first playtest, 70% of cards were filler and players hated it.
- Vary the busyness: 0, 1, 2 or 3 events with season weights, plus family births and deaths, news that reached you, and promotions.
- When the player's own action makes time richer (a campaign, a journey), open the month into **days and weeks the player steps through**, with standing orders. A battle stops the clock and runs phase by phase.

## Information design
- **Descriptions open on click, never on hover** (owner's round 2 order B4, `docs/DECISIONS.md` D-007; this replaces the older "never hide a description behind a click"). A button or an info icon (ⓘ, 16 px glyph, 44 px hit area on touch) opens a description on a click, a tap or Enter; a second press, Esc or a press elsewhere closes it; nothing opens when a pointer merely rests on something, and no description lives in a `title=` (a phone never shows one). Keep a short label (three words or fewer) in `aria-label`. A choice or an activity tile keeps its tap for the action: an activity opens a sheet (what it is, cost, how it may go, "Do it") before it commits, and a choice's odds open through its info glyph. Everything needed to decide is still on the card, with odds in words and a tipped-scale icon; lore can sit behind "read more". Playtest it with a mouse that only moves and a finger that only taps: both must reach every description (`src/ui/99998-click-open/test.mjs`).
- **Show less at once** (Ardan round 2 B5, `docs/DECISIONS.md` D-033). The open page owns the screen: at laptop widths (1100 to 1599 px) the story is a drawer behind a Story button (about 80% of the width for the page), not a third column. Secondary detail is a fold that opens on click (the market, the second list of people, the elite orders, Laws); an action page suggests six things and says "More"; what cannot be done yet waits under "Not yet possible". Measure it (`tools/bench/clutter.mjs`: words, controls, elements, screens of scroll, width share, sideways scroll, for a peasant, a noble and a ruler at 1366x768 and 420x900) and hold it with a test whose numbers only fall (`src/ui/9992-story-drawer/test.mjs`). Red is for danger only: new story lines are a neutral dot. An info button beside an action in a grid or a column of flex must be out of the flow (position absolute), or it adds a cell.
- Use five places at most (for example Life, You, Family, World, and War only while at war). Text limits: events of 80 words or fewer, choices of 12 words or fewer.
- Words over numbers: real units plus comparisons, not "22/100". Use percentages nowhere in play. They are fine in tests and AI.
- What you see depends on who you are:
  - You see no war you are not in, only rumour.
  - A soldier sees enemy numbers as estimates ("about 3,500").
  - Other realms' relations are known only through reasons you've heard.
- Show cause and effect afterwards: a verdict ("A surge of will", "Overconfidence"), an after-action report with the 3 biggest causes, and what changed for good ("a limit of yours has risen").
- Use one source of truth per fact. If two panels can disagree (heir box vs tree, realm status vs reasons), they eventually will. Derive both from the same function.
- Keep labels consistent across scales. A comparison phrase and a rank phrase must not contradict each other ("runs like a child · like most grown men").
- Make text fit the character: commoners don't have "the estate" or "court". Use correct pronouns. Never print the return value of a helper (`push()` printed "1").

## Visual system
- Use colour tokens with light and dark sets, and semantic colours kept apart from the accent. Ardan uses washi paper by day, a Prussian-blue night, gold for anything interactive, and vermilion for seals and danger.
- Pair a display face, used with restraint (Cinzel), with a readable body face (Literata) and a hyperlegible UI face.
- Motion:
  - Cards rise in 260 ms with cubic-bezier(.2, .8, .2, 1). Bars and tactic changes use 250–400 ms eases.
  - Ambient motion is slow and cheap, such as cloud shadows drifting over 90 s.
  - Make every animation optional under reduced motion.
- Touch targets are 44 px or larger, and the bottom bar respects safe areas. Add `[hidden]{display:none!important}` yourself; a `display:grid` overlay that ignores `hidden` silently blocks every click.

## The playtest loop (learn → build → ship → test on people → repeat, harder)
1. Turn every complaint from the designer into a numbered requirement.
2. Build the smallest version that answers each one, with a unit test per requirement and calibration targets.
3. Build a single-file demo. Run a scripted Playwright pass (launch, 100+ months, every tab, one war) that records console errors and takes 420 px screenshots. Look at them yourself.
4. Send a **playtester agent** with the requirement list, the demo path and the source path. Tell it to play 2 lives of 25+ years in different classes plus one war, and to report violations ranked by importance, with exact on-screen text and the function responsible. It must not edit files.
5. Fix the ranked list. Add a regression test for each structural bug (for example a 30-seed consistency test for single title holders), then rebuild and repeat.
6. Bots check the numbers; only people judge fun. Before calling it a 10, run 5 real players through timed tasks.

**Common findings to check first:**
- filler cards
- odds rated against the wrong opponent
- choices with no follow-up (a betrothal with no wedding)
- duplicated titles
- labels that contradict each other
- infants rated on adult scales
- class-inappropriate text
- map labels unreadable at phone width