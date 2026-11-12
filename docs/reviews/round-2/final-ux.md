# Ardan v2.0.0-beta.1: UI/UX, the deciding critique

**Lens.** Lead UI/UX designer for strategy and life-sim games: hierarchy, clutter, navigation, hover against click, readability, phone and desktop layout, feedback, the time controls (including the owner's new "Next month or Next year" order), onboarding and accessibility.

**How I checked.** I drove `/tmp/ardan/snap/index.html` with Playwright at 420×900 (touch) and 1366×768 (mouse), plus five other sizes from 360×640 to 1920×1080. I went through the title and "Be born" by real taps, pressed the real Next month button for a newborn and for an adult noble at year 0 and year 25, and read the code where a cause mattered. My timings were taken on an idle box (wall time equal to CPU time); the first draft's at load 20 to 50. I looked at my own screenshots and at ten of the first draft's.

- My evidence: `/tmp/ardan/critique/final/ux/` (`scripts/`, `shots/`, `*.log`). First-draft evidence: `/tmp/ardan/critique/ux/`.
- Source marks: **[v]** I verified it (live, in code, or in a screenshot I looked at); **[d]** taken from the first draft unverified.

## Key numbers (re-measured)

| Measure | Phone | Desktop 1366×768 |
|---|---|---|
| Words and controls at first glance, median page | 146 and 31 (171 pages, first draft's file) | 520 and 51 (165 pages); my recount of six pages: 404 to 594 words |
| Share of those words that belong to the page you opened | all | 8% to 38%. The rest is fixed: top bar 15 words, profile 86, story 259 (`zones-1366.log`) |
| Screen area given to the open page | 64% at 360×640 (229 px of fixed bars) | 28% (486×615 px). 30% at 1280, 26% at 1920, 46% at 768×1024 |
| Longest pages, adult four years in | Story 8.6 screens, People 5.5, Holdings 5.4 (109 controls), Decisions 3.9 | inner scroll |
| One quiet Next month, year 0, then year 25 | median 3.0 s, then 3.9 s (worst 8.2 s) with the CPU slowed four times | 0.84 to 1.04 s, then 1.5 to 2.1 s |
| One whole year, cards answered instantly | not run | 26.8 s, then 46.1 s through today's stepper; 2.2 s, then 1.6 s for the engine plus one redraw (`year.log`) |
| Descriptions on hover | a tap opens them | 12 of 12 anchors opened on hover alone; 52 anchors and 42 long `title=` texts on an adult's Life page |
| Tab presses before the open page gets focus | n/a | 31 of 75 stops |

## Flaws, most severe first

| # | Flaw | Sev | How to fix |
|---|---|---|---|
| 1 | **Descriptions still open on hover** (complaint 3, now a standing rule) **[v]**. `TT.init` in `59-tooltips/tt.engine.core.js` listens for `pointerover`; every anchor I hovered opened a popover within 250 ms. Separately, 154 `title="` sites in the built core put real descriptions in native tooltips (every activity tile, traits, skills, price reasons). These never show on touch: the phone Life page carries 29 of them. Map canvases use `onmousemove` tips **[d]**. | 9 | Delete the `pointerover` listener and the `how:'hover'` paths; keep click, tap and Enter. One affordance everywhere: an ⓘ (16 px glyph, 44 px hit area) or the underlined term as a button. Move each descriptive `title` into `data-tt` or a visible second line. Lint: a `title=` over 3 words fails the build. Test: hover every anchor, assert no `.tt-pop`. Maps: tap selects and opens a detail card. |
| 2 | **Time moves only by the month** (complaint 12) **[v]**. A newborn's first 14 presses each brought "A month of milk and sleep." A year step does not exist, and on today's stepper it would take 27 to 46 s on a desktop, because the page is redrawn between slices of work (1,604 forced layouts in one year). The engine alone runs the same year in about 2 s. | 9 | See "Time controls" below: two buttons, the year computed first and painted once. |
| 3 | **Clutter** (complaint 4) **[v]**. Numbers above. The fixed top bar, profile and story put 360 words on every desktop screen before the page says anything. On a phone the first view is acceptable, but pages are long, and the game patches over that with "On this page" chip menus (12 chips on Life) and "Open every section" on 9 of 14 pages. | 9 | Budgets enforced by a test using `scripts/lib.cjs` `measure()`: phone first view at most 120 words and 12 controls; desktop 250 and 25; no action page over 3 screens. Apply the first-glance table below. Remove the permanent story and profile columns (row 4). |
| 4 | **The desktop layout starves the page you opened** **[v]**. Profile 248 px, story 598 px, page 486 px at 1366. At 1920 the page gets 598 px beside an 804 px story and 96 px of empty margin. The market's six columns sit in 462 px and the world map draws at about 460×290 **[d]**. | 8 | Two zones: a 280 to 300 px rail (portrait, name, age, four vitals in words, the time buttons, the three newest story lines) and a main area for the open page. The story becomes Life's feed and a drawer. From 1600 px a third column holds only the selected person or realm. |
| 5 | **Screens ignore rank, age and class** (complaints 5, 9, 10) **[v]**. A File-Leader's War Room shows the whole theatre, every friendly stack and enemy stacks marked "7.3k" (`d-soldier-ov-warroom.png`). A 9-year-old peasant's Arms page lists the elite orders ("200 of 200 members · fights like ~4,720 line soldiers"), six failed requirements and an "Ask to join" button. A newborn's screen shows "⧗ 0.0", "0 suns", "Looks homely · Renown unknown · Honor decent" and "See a physician 1⧗". **[d]**: a child's Court page; a father's card offering "Insult" and "Pick a fight"; a Chancellor told "Find work". | 8 | One `UI.scope(pc)` (life stage, station, rank, deployed or not) read by `UI.GROUPS` and by every page section. Arms appears at 14 or on enlisting. War Room by rank: soldier sees his company and rumours; captain his division's front; general the theatre; enemy numbers as estimates. A test draws each page for six personas and fails on forbidden strings. |
| 6 | **People floods from birth** (complaint 5) **[v]**. A newborn peasant has 15 to 16 bonds. The page lists "Kin of note 10" and then "Family (12)", each row with a mood and a want ("Wants money" from a grandfather; "Wants work don…" from a sister of 2), under "These are the people you have chosen to know." | 8 | A Household block with faces: parents and siblings; nobles add nurse, tutor and guard. "People you have met" grows from events. Extended kin live only in the tree. No wants shown to a child under 6. |
| 7 | **The time button changes meaning** **[v]**. While a month runs it becomes a stop button reading "The month passes" (`data-a="stepStop"`, aria-label "Stop here", `99992-v2-time/time.core.js:327`; the N key does the same at line 421). Pressing N twice 200 ms apart ended the month after 7, 11, 15 and 20 days; the date still read "February 1105" and nothing said the month was cut. While a card waits it reads "▷ Go on" in full gold, but it lies under the full-screen `#modal` layer and cannot be clicked on either size. | 8 | While busy the button keeps its label, is disabled and shows progress. No stop action on the same control or key; Esc stops a year at the month's end, never a month. Hide the time control while a card is open. |
| 8 | **Slow from the player's seat** (complaint 1) **[v]**. Timings above. A month with one to three cards costs 3.5 to 10 s of machine time on a desktop before any reading. | 8 | Compute, then paint once. CI budgets at year 25: quiet month 300 ms on a desktop and 1 s at four-times throttle; quiet year 2 s and 6 s. Engineering owns the method. |
| 9 | **"Five places" hide about 60 surfaces.** World on a phone puts 20 buttons above the map: 5 sub-tabs, 8 views and 7 map modes, with "Diplomacy", "Realms" and "Wars" in both rows **[v]**. There are 14 pages, 9 Codex sections, 5 realm views, War Room tabs and about 15 overlays; the map appears in five places in three renderings **[d]**. | 8 | World becomes one map with a mode menu, plus Realms and Chronicle. The Codex becomes a searchable, linked encyclopedia opened from any term. Places folds into the map. |
| 10 | **Help describes an older game** **[v]**. How to play opens with "Six tabs. Life… People. Path & War… Holdings… Realm… Chronicle… On a phone the six tabs sit at the bottom." The game has Life, You, Family, World and War. Built text says "War tab" 11 times (at peace the page is "Arms") and names a "Work tab" and a "Chronicle tab" that do not exist. Phone hints cite keys: "Press Next month (N)", "Keys 1 to 6 choose too". | 7 | Generate help and cross-references from `UI.GROUPS`. Lint: any "X tab" not in GROUPS fails. Key hints only with a fine pointer. |
| 11 | **The percent-to-words sweep rewrites the interface itself** **[v]**. Text size options read "all / more than all / 1.5 times over / 2 times over" 0.9 s after the menu opens. "Show exact odds on choices" is a dead checkbox: `A.DIFF.showOdds = () => false`. **[d]**: a faction with "about two in five of the power" above a Power bar reading "none". | 7 | Write words at the source and delete the sweep; until then, sweep only nodes marked `data-prose`. Label sizes Normal, Large, Larger, Largest. Remove the odds toggle or honour it. |
| 12 | **The desktop card is not focused** **[v]**. It docks in the middle column while the profile and the page stay fully lit: 837 words visible, 96 of them the card's. The lit columns ignore clicks, because a transparent layer covers them. A hint banner sits above the card. With four choices the last two fall below a 768 px fold **[d]**. | 7 | Dim the rest, as the battle dialog already does. Cap the art at 120 px. Every choice visible at 768 px. The hint goes in the card's footer, once. |
| 13 | **Activities commit on one tap; their descriptions are hover-only; their result is a clipped toast** **[v]**. `UI.A.act` calls `A.doActivity` at once and shows `r.msg.slice(0,137)+"…"`. An adult's Life page has 29 tiles, among them "Plot to seize a throne 3⧗". | 7 | A tap opens a sheet: what it does, cost, odds in words, risk, "Do it". The result is a card or a story line, never cut. Show six suggestions and "More". |
| 14 | **Creation hides the character.** With "Newborn" chosen the preview is a grown man headed "(A NAME FROM YOUR PEOPLE)"; realm is a select reading "Empire of Aldmark — 9,234,000 humans"; "Be born: a human child of Aldmark" never says peasant **[v]**. On a phone the preview is at the bottom of a three-screen page; faces are text buttons "Shape 1–4"; step 2 has 70 targets under 44 px **[d]**. | 7 | A sticky preview (the top 40% on a phone), thumbnail swatches, a figure true to the chosen age, realm picked on the map with a one-line pitch, class and face on the quick-start cards. |
| 15 | **A red "!" for unread story lines** **[v]**. `71-phone` `UI.tabBadge` returns "new lines in your story", drawn as the red "!" that also marks war **[d]**; Life and Story wear it in nearly every phone screenshot. | 6 | Red for danger only. Unread story gets a small neutral dot. |
| 16 | **Rank words disagree on one screen.** The profile says "Sergeant of the 2nd Solenne Horse" while the story says "Rank 2 of 4, a captain" **[v]**. "File-Leader Edda of Goldburg [you] [your superior]" in one row; two commanders for the 10th Aldmark Line **[d]**. | 6 | Every panel reads `holderOf(post)` and `commanderOf(unit)`; the posts work in the design lens supplies them. |
| 17 | **Numbers, abbreviations and modern units** against "words over numbers". "TREASURY 3.8M suns · ARMY 104k", "INS up · INT up", "7.0 /7", "armor 8" **[v]**; "Reflexes 232 ms", "Speed 8.3 m/s", "+2 SPD, -2 STR" **[d]**. | 6 | Words first; exact figures one click deeper; stat names spelled out. |
| 18 | **Tablets get the mouse layout** **[v]**. Phone styles stop at 760 px. At 768×1024 the top bar wraps to two rows, the name clips to "SVALA RA…", the story is a 304 px column, and Next month is a 150×32 px button at the top of a touch screen. | 5 | Use the phone shell on coarse pointers up to 1024 px, with a two-column page. |
| 19 | **The game's own 200% text setting breaks the phone** **[v]**. The date clips to "Janu…", "DECISIONS" is cut, the "!" covers "STORY" and "Life", hint text does not scale, and up to 39 labels clip on a page (`shots/x200-life.png`). | 5 | All type in rem. The top bar wraps at large sizes; sub-tabs scroll. A test at 200% asserts no clipped label. |
| 20 | **Truncation and cramped headers at 420 px** **[v]**. "Wants your com…"; a five-line paragraph squeezed beside the heading "THE ELITE OF ARDAN"; "in the Path   tab". On a desktop: "Nothing presses. The month runs on and…", "7.0 initia…". | 5 | Summary under the header. Chips get a maximum width and show the full text on tap. |
| 21 | **Coming back to a life** **[v]**. With a save, "Continue" is the third button in the secondary style and How to play falls below the fold. The default difficulty is called "Hard" and shows "Score ×1.00". | 5 | Continue is primary, with portrait, name and age. Rename the levels Gentle, Normal, Harsh. Move Mods into Settings. |
| 22 | **The menu is a settings dump** **[v]**. 31 controls in one scroll mix Save and Load with art toggles and developer items ("Playtest mode", "Classic event pool… 826 small one-off events are retired"). Two portrait switches. The "Moment cut-ins" box sits on its own line above its label. | 5 | Menu: Resume, Save, Load, Settings, Help, Quit. Settings grouped as Display, Sound, Gameplay, Access. Developer items behind a URL flag. |
| 23 | **The battle is a text box, and its outcome shows behind it** **[v]**. The dialog offers "Keep the squad tight: a certainty" while the story column already reads "Battle of Nahin (4 days): your side wins. 1,192 fall." (`d-battle-1.png`; cause not traced). No picture of the lines, the ground or losses. | 5 | Hold the battle's story lines until the dialog closes. Add a phase strip and a schematic of the two lines and the ground. |
| 24 | **The phone hides your age** **[v]**. The top bar reads "January 1109 · ⧗ 7.0 · 4,659 suns"; the age is inside the date popover. | 5 | Put the age on the time row (see below). |
| 25 | **Map and War Room chrome written for a mouse.** "Hover for details, click to select a realm." on a phone **[v]**. The legend "EDGE… STRIP… BARS… Banner = realm (3-letter code above the number)" must be studied **[v]**. On a phone, Next day and Next week shrink to unlabelled icons **[d]**. | 5 | Captions that know the pointer. The legend behind ⓘ. Labels on the buttons. |
| 26 | **The family tree is not a tree**: rows by generation, no lines, your own row last **[d]**. | 5 | Centre it on you, with connectors; cousins collapsed under their parent. |
| 27 | **The person card leads with combat and lore**: first chip "less than one levy" (the same chip sits under my courtier's own name **[v]**); a fight rating against your father **[d]**. | 5 | Lead with relation, age, trade, mood toward you, what they want and three actions. Fight data only for soldiers and rivals. |
| 28 | **The death screen describes another life** ("Master of the Craft" for a First Minister); buttons below the desktop fold **[d]**. | 5 | Choose the ending from the career. Pin the buttons. |
| 29 | **Keyboard order** **[v]**. The first control of the open page is stop 32: 6 top-bar stops, 19 in the profile, 3 in the story and 2 in the navigation come first. No skip link. | 4 | A skip link to the page. One "Profile" stop in place of 19. Arrow keys inside tile grids. |
| 30 | **Fixed bars on small phones** **[v]**. At 360×640 the top bar, sub-tabs, time dock and navigation take 229 px, and a profile card and a hint banner come before any content. | 4 | Sub-tabs scroll away with the page. Hints become one-time coach marks. |
| 31 | **Slashed zeros everywhere** **[v]**: "11Ø5", "Ø suns", "2Ø hand-made beginnings". | 4 | Set dates, money and ages in Literata with old-style figures. |
| 32 | **Duplicate surfaces.** What now's "Live the next month" repeats the time button **[v]**; The Book retells the story; Holdings repeats last year's table **[d]**. | 4 | One place per fact. |
| 33 | **Story colours carry meaning with no legend** (green, red, amber, grey, italic) **[v]**. | 4 | Icons and a legend; filters Mine, Family, Realm, Rumour. |
| 34 | **Decisions explains the interface** ("There are no quest lists in Ardan…") and also holds "Design your arms" and "Name your blade" **[v]**. | 4 | Cut the paragraph. Move heraldry to Dynasty. Show what can be decided now; the rest under "Later". |
| 35 | **Copy bugs.** "Would teach you f": `998-people-want/want.core.js:17` reads `GD.SKILLS[k][0]`, the first letter of a string **[v]**. Two quiet toasts stack ("You sleep, eat and grow." over "A month of milk and sleep.") **[v]**. "1 armies in the field" **[d]**. | 4 | `GD.SKILLS[k]` is the name. One toast per step. A plural helper. |
| 36 | "Keep this", "Keep this page", "Keep this life": three actions, none says what keeping does **[d]**. | 3 | "Add to your chronicle"; "Add to the Hall of Lives". |
| 37 | The top-bar Save is an unlabelled seal glyph in a game that autosaves every year **[v]**. | 3 | Move Save into the menu. |
| 38 | The Path promotion board fails axe: four targets 17.9 px tall and a button with no name **[v, first draft's log]**. | 3 | Targets at least 24 px; add aria-labels. |
| 39 | Laws change on one tap; "Leave the army" has no confirm **[d]**. | 3 | Preview, then confirm, any step that cannot be undone. |

## Time controls: Next month and Next year

This is the owner's newest order and the centre of the game, so it gets a specification.

- **Two buttons in one row, in fixed places.** The left reads "Next month", the right "Next year". On a phone they share the dock, 56 px high. Under them, one line: "Age 9 · March 1105".
- **Emphasis follows the life.** Under 14 the year is gold and the month outlined; from 14 the month is gold. Both always work. The buttons never swap places.
- **What a year does.** It runs twelve months from today. It pauses at each card and goes on when the card is answered. It ends early, and says why in one line ("Stopped in May: your father is ill"), for a battle or campaign, an illness or wound, a death in the household, coming of age, or a deadline listed under Coming up.
- **No toasts inside a year.** At the end comes one digest of three to five lines (the "1109 in review" block already exists) and one story block.
- **While running.** Both buttons are disabled and show twelve pips. Esc, or a small text button "Stop at month's end", halts the year. Nothing stops a month.
- **On campaign** Next day and Next week replace both, as now.
- **Keys.** M or N for the month, Y for the year.
- **Build notes.** `84-top-bar/step.core.js` still has an "until" step that ends at the year turn, and it guarantees the same days in the same order; `UI.stepStart('until')` worked when I called it. Add a `year` kind to `UI.stepTarget`. The work is in drawing: run `A.dayTick` without `UI.clkLight` between slices, and call `UI.refresh` once at the end or when a card appears. The test `v2tNoPlay` asserts one button and must change.

## What each screen should show

| Screen | At first glance (seven things at most) | One click deeper |
|---|---|---|
| Title | Continue (portrait, name, age, year); New life | Load a file, Settings, How to play |
| New life | Three ways to begin, each with a face and a class; difficulty; Begin | The 20 stories; Customise |
| Customise | A preview that stays in view; one choice group at a time | Talents, traits, the score multiplier |
| Life › Now | Portrait, age, four vitals in words, the two time buttons, What now (three at most), Coming up (two), the five newest story lines | Activities (six suggested, then all), ambition, chapter, year in review |
| Story | This year's lines, newest first; a filter | Earlier years, each one collapsed line; the map of places seen |
| Decisions | What you can decide now, with its requirement chips | Later decisions; what each needs |
| Event card | Art band, title, at most 80 words, every choice with effect chips and odds in words; the rest dimmed | ⓘ on odds for the reasons; the people involved |
| Result card | What happened, what changed, one button | The roll's causes |
| You | Age, build in words, top three traits with their meaning, three best skills by tier | Units (kg, m/s, hours), all proficiencies, wounds |
| Path | Your post, the ladder, the checklist for the next rung | Other careers, offers, schools |
| Holdings | Purse, net this year, the three biggest lines | Ledger, market, gear, property |
| Arms (peace, from 14) | Whether your realm is at peace; how to enlist | Elite orders: only those you have heard of |
| War (deployed) | Your unit, your commander, your orders, the next fight, morale and supply in words | War Room at your rank |
| War Room | Soldier: company and rumours. Captain: the division's front. General: the theatre | Forces, other wars, the legend |
| Battle | A schematic of the lines and ground, the phase, two to four choices | After-action causes |
| People | Household with faces and one mood word; people met (twelve at most), grouped by how you met | Tree, extended kin, counsel, history of a bond |
| Person | Face, relation, age, trade, mood toward you, what they want, three actions | Body and fighting worth, lore, history |
| Family tree | You in the centre, parents above, children below, lines between | Cousins and in-laws, expanded per branch |
| Dynasty | House, heir, the law in one sentence | Arms, chronicle of lives, endings, achievements |
| Realm | Commoner: ruler, the realm's state in a word, war or peace, one rumour. Noble: plus your rung and the factions. Ruler: four figures and alerts | Council, laws, lords, politics, building |
| World | One map with a mode menu; three things you heard lately | Realms, wars, history, annals |
| The Book | The current chapter | Earlier chapters; export |
| Places | Folded into the map: places you have seen, marked | A place's card |
| Codex | Search; terms met lately | Articles, linked to each other |
| Menu | Resume, Save, Load, Settings, Help, Quit | Settings in four groups |
| Death | Name, years, how they died, a fitting epitaph, Continue as heir | What became of them; score; Hall of Lives |

## Against the best

- **BitLife:** the age is on the button that moves time, and an activity opens a sheet before it commits. Ardan needs both.
- **Football Manager:** one Continue button whose label says how far it will go, and which stops only for what needs an answer. That is the year button's rule. Its scouts see ranges, not truth: the rule for the War Room by rank.
- **Reigns and Battle Brothers:** the event owns the screen. Ardan's phone card already does; its desktop card does not.
- **Crusader Kings 3:** terms nest and look the same everywhere, and the character window leads with a portrait and a few facts. Take the nesting, not the hover.
- **Pentiment:** an underlined word, when pressed, opens its gloss in the margin: click-to-open in period dress.
- **Mount & Blade:** a linked encyclopedia, and a party screen that holds only your party.

## What the first draft got wrong

1. **Timings.** They were wall-clock times on a box at load 20 to 50. On an idle desktop a quiet month takes 0.84 to 1.04 s at year 0 and 1.5 to 2.1 s at year 25, not 1.2 to 4.3 s and 2.3 to 9.2 s. The conclusion survives, because a phone four times slower lands at 3 to 8 s. Rating kept at 8.
2. **"Both side columns stay live" during a desktop card.** They are inert under a transparent layer. Its 833 words are what is visible; only 96 words and 3 controls can be used. Rating kept at 7, for a different reason: the screen looks live and is not.
3. **"Go on does nothing."** True, but the cause is larger: the button is covered and cannot be clicked on either size.
4. **The median of 572 words and 54 controls.** Its own file gives 563 and 53 over 215 rows, 50 of them overlays counted together with the page behind. The 165 real pages give 520 and 51. Its `measure()` counts words under dialogs; mine hit-tests each word.
5. **It measured clutter but missed where it comes from:** 360 of about 520 words are the fixed top bar, profile and story.
6. **Ratings I changed.** Desktop layout 9 to 8 (it is the cause of row 3, not a second 9). Rank-word contradictions 8 to 6 in this lens; scoping by rank stays 8. Red "!" 7 to 6. Copy bugs 6 to 4. Slashed zero 6 to 4. Hidden age 6 to 5.
7. **Missing.** The year step and what it would cost; the silent mid-month stop, measured; tablets; the 200% text setting; keyboard order; the falling page share at 1920; activity results as clipped toasts; the battle outcome showing behind its dialog; key hints on phones.
8. **"Axe clean on 13 of 14" read as accessible.** Axe cannot see hover-only content, clipped text at 200%, 31 tab stops before the page, or a 32 px primary button on a tablet.
9. **Left unverified.** I did not re-run the rows marked [d]; the counts of 16 `.title=` and 20 dynamic sites could not be reproduced by a plain search (31 `.title=` matches, many of them event titles).

## Keep

- The phone event card: art band, short text, effect chips, odds in words with the scale. It is the best screen in the game.
- The phone shell: the time button in the thumb zone, four places in the bottom bar, 56 px targets. A newborn's first phone screen is 144 words and 16 controls.
- Tap and Enter already open descriptions; popovers nest and close on Esc.
- The quiet month as a two-second note and a story line, never a card.
- The stepper's promise that a step runs the same days in the same order; the year step reuses it.
- The quick-start page: three ways to begin and 20 stories.
- The Path ladder with its checklist; the after-action "What decided it" **[d]**.
- The battle dialog's dimmed backdrop.
- Focus rings on every stop; axe clean on 13 of 14 dark pages (first draft's log) and on the four light pages I ran.
- Cinzel, Literata and Atkinson together; the night-and-gold palette; the War Room's map drawing.

## Order of work for this lens

1. **Time controls** (rows 2, 7, 8). The owner's newest order and the core loop. Rewrite the stepper once, for month and year together, to compute and then paint; add the CI budgets. Risk: determinism tests and `v2tNoPlay`. Engineering's redraw work is the same job, so do it together.
2. **Click-only descriptions** (row 1). One listener to delete, then a mechanical pass over 154 `title=` sites, held in place by a lint and a hover test. Low risk; it can run beside step 1.
3. **The shell** (rows 3, 4, 12, 18, 29, 30). The two-zone desktop, a focused card, the phone shell for tablets, and the word and control budgets as a test. Do this before pruning pages, or each page is pruned twice.
4. **Scope by who you are** (rows 5, 6, 9, 13). `UI.scope`, the Household block, the War Room by rank, World as one map. The gating can ship first; true rank and household data come from the design and family lenses.
5. **Truth in text** (rows 10, 11, 16, 17, 35). Navigation names generated from `UI.GROUPS`, words at the source, copy fixes. Cheap, lint-backed, any time.
6. **Page by page** with the first-glance table (rows 14, 20 to 28, 31 to 39), creation and the return path first, because they are the first thing a new or returning player sees.
7. **Access checks** (rows 19, 29, 38) ride with the shell: a 200% test, a tab-order test, target sizes.
