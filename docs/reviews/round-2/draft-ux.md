# Ardan v2.0.0-beta.1: UI/UX critique, by a lead UI/UX designer for strategy and life-sim games

**How I tested.** I drove the real build (`/tmp/ardan/snap/index.html`) with Playwright at 420×900 and 1366×768 (deviceScaleFactor 1, reduced motion). The lives were a peasant child of 9, an adult noble (a Dame and councillor, 26), and a soldier at war (File-Leader, then Sergeant in a battle). I added a ruler, a merchant and two newborns. I took about 700 screenshots and made 436 screen measurements, plus axe-core and timing runs, and looked at the screenshots myself.

- Files are in `/tmp/ardan/critique/ux/`: `shots/` (`p-` = phone, `d-` = desktop), `scripts/`, `metrics.jsonl`.
- Code citations refer to the unpacked blobs in `ux/blobs/` and to `features/`.

## Key numbers

| Measure | Phone 420 | Desktop 1366 |
|---|---|---|
| Median words in the first view (172 / 178 screens) | 167 | **572** |
| Median controls in the first view | 33 | **54** |
| Worst first views | event moment 411 words | profile overlay 907 words; War Room 888; event moment 833, of which the card is about 150 |
| Longest pages | Codex › Schools 10.2 screens; Power & scale 9.4 (4,897 words); World › Realms 6.9; People 5.6; Holdings 5.4 | (inner scroll) |
| Hover-only `title=` texts on one screen | up to 73 (creation step 3) | up to 103 (Proficiencies), 88 (Full profile) |
| Space given to the selected page | — | **486×615 px = 28% of the screen**; the story log takes 40% and the profile 17% |
| One quiet "Next month" press | — | **1.2–4.3 s** at year 0; **2.3–9.2 s** 25 years in (4.6 MB state, 1,503 people) |
| axe (WCAG 2.2 AA), 14 screens | 13 clean | 13 clean (the Path board fails) |

For comparison, BitLife's home is about 50 words and 10 controls, and Reigns shows about 30 words and 2 choices.

## Flaws, most severe first

| # | Flaw (concrete) | Sev | How to fix |
|---|---|---|---|
| 1 | **Descriptions still open on hover (owner complaint 3 not met).** `59-tooltips/tt.engine.core.js:240` registers `window.addEventListener('pointerover', TT.onOver)`. Hovering the date or "in your favour" opens a popover (`d-tt-open.png`, `d-noble-card1-hover.png`). Many descriptions live **only** in native `title=` tooltips: 154 literal sites plus 20 dynamic ones in core. They hold trait and quirk text ("Brave → Fear comes late to you, if at all."), skills, every activity ("Coups begin in whispers."), careers and market-price reasons. On touch these never appear; on desktop they show after a delay. | 9 | Remove hover-open from `TT.onOver` and keep click, tap and Enter. Put an ⓘ (16 px glyph, 44 px hit area) after every term that has a description. Move descriptive `title`s into click popovers or a visible second line. Lint: a `title=` over 4 words fails the build. |
| 2 | **The desktop layout starves the page you opened.** At 1366 the active tab is a 486 px column (28% of the screen) beside a 598 px story log and a 248 px profile that are always shown (`layout.cjs`). The market's 6 columns fit in 462 px. The world map renders at 460×290 next to an empty log (`d-child-world-world.png`). | 9 | Use two zones: a 300 px rail (portrait, age, 4 vitals, the time button) and a main area. The story becomes the Life page's feed, or a drawer. At 1920 a third column holds only the selected person or realm. |
| 3 | **Clutter, by the numbers (complaint 4).** See the table above. The game patches over its length with "On this page" chip menus (12 chips on an adult's Life tab) and "Open every section" on every tab. | 9 | Enforce budgets in a test (my `scripts/lib.cjs` `measure()` already counts them). Phone first view: ≤150 words and ≤12 controls. Desktop: ≤300 and ≤25. No page longer than 3 screens. Everything else goes one click deeper (table below). |
| 4 | **The one button is slow and changes meaning.** Months take 1–9 s (above) and get slower with age. While a month runs the button becomes "The month passes", whose aria-label is "Stop here" (`data-a=stepStop`, 99992 `time.core.js`), so an impatient second tap halts the month. While a card waits, the top bar shows "▷ Go on", which does nothing (`start()` returns on `settle()`; `d-noble-card1.png`). | 8 | Compute the month first and paint once, with a 300 ms page-turn instead of repaints between slices. The button never stops time; it is disabled with progress while busy. CI budget: ≤500 ms a month at year 25. |
| 5 | **"Five places" hides about 60 surfaces.** There are 15 sub-tabs. World alone puts **20 buttons above the map**: 8 views plus 7 map modes, and both rows contain "Diplomacy", "Realms" and "Wars" with different meanings (`p-child-world-world.png`). Add 9 Codex sections, 5 realm views, 3–6 War Room tabs and about 15 overlays. The map appears in five places (Story/Map toggle, World › Map, Full map, Places › Open the map, War Room) in three renderings. | 8 | World becomes one map with a mode dropdown, plus Realms and Chronicle. Make the Codex a searchable, hyperlinked encyclopedia (Bannerlord-style) that opens from any underlined term. Fold Places into the map. |
| 6 | **The war UI ignores rank and contradicts itself (complaints 2, 9, 10).** A File-Leader's War Room shows the whole theatre, enemy stacks labelled "7.3k" (`d-soldier-ov-warroom.png`). Order of battle: "3rd Squad 39 · File-Leader Edda of Goldburg [you] [your superior]", one row that is both. The story says "You now answer to Edda of Goldburg, File-Leader", then "PROMOTED: File-Leader. You now lead 20." On People, Garrick Harrow "commands the 10th Aldmark Line"; on the War tab, "10th Aldmark Line 7,392 · Commander Osmund of Copperton Tower". In battle the profile says "Sergeant" and the story says "Rank 2 of 4, a captain". | 8 | One `holderOf(post)` and `commanderOf(unit)` source for every panel. Scope the War Room by rank: a soldier sees squad, captain and rumours; an officer sees the division's front; a general sees the theatre. |
| 7 | **Surfaces ignore age and class.** A 9-year-old peasant gets: You › Arms with all 8 elite orders and "Ask to join" (1,927 words, `p-child-you-war.png`); a Court page with "836 nobles hold land" and "Show the politics of Aldmark"; "Design your arms" and "Pick pockets" on Life. His father's card offers "Insult", "Pick a fight" and "Ask for money", and leads with "less than one levy … He would almost surely beat you (a certainty)" (`d-child-ov-person.png`). A Dame Chancellor's What now #1 reads "Find work — No trade, no wage." | 8 | Gate places and sections by stage and station: Arms from 14 or when enlisted; a commoner's Court shows the ruler, the realm's state in one word and one rumour. What now must read the job and office. |
| 8 | **People floods and repeats itself (complaint 5).** A peasant newborn already has 15 bonds and 22 rows, each with a want ("Friendly · Wants money — Roland, Grandfather"; "Wants work done well — Hilda, 2") (`p-people-peasant-newborn-full.png`). A noble newborn has 18 bonds and no nurse or tutor. The 9-year-old's page lists the same kin twice ("Kin of note 10", then "Family (10)"): 20 links for 12 people. The header claims "These are the people you have chosen to know." | 8 | Put a Household block at the top with faces: parents and siblings, plus nurse, tutor and guard for nobles. "People you've met" grows from events. Extended kin live only in the tree. |
| 9 | **Help and cross-references describe a game that no longer exists.** How to play says: "Six tabs. *Life* … *People*. *Path & War* … *Holdings* … *Realm* … *Chronicle* … On a phone the six tabs sit at the bottom". There are four places plus War. Text says "Realm tab" 25 times, though the sub-tab reads "Court" or "Your realm"; "War tab" 9 times, though at peace it reads "Arms"; and the story prints "Work: 2 offers came your way this year. (Work tab)", a tab that does not exist. The menu still says "Hints for new players (the first ten years)". | 7 | Generate help text and links from `UI.GROUPS`. Add a lint that fails on any "X tab" not in GROUPS. |
| 10 | **Character creation hides the character.** On a phone the preview sits at the bottom of a 3-screen page, so hair and face changes are invisible (`p-03-create-step2-bottom.png`). Faces are chosen from text buttons ("Shape 1–4 / Brow 1–3 / Mouth 1–3"). With "Newborn" selected the preview shows a grown man, and its heading reads "(A NAME FROM YOUR PEOPLE)" (`d-03-create-step1.png`). Realm is a 34-entry select with counts ("Kingdom of Irondeep — 5,000 humans"); talents are two 38-option selects; every option carries a score factor ("×0.85"). Step 2 has 70 targets under 44 px. The quick start "Be born — A human child of Aldmark" never says peasant or noble. | 7 | Use a CK3-style sticky preview (on a phone, the top 40% of the screen), thumbnail swatches and an age-true figure. Pick the realm on the map with a one-line pitch. Show the class and a face on the quick-start cards. |
| 11 | **A global percent-to-words regex rewrites UI chrome.** `VS.fracWords` (`99993-v2-stats/f-words.core.js:36`) turns Text size into "all / more than all / 1.5 times over / 2 times over" (`p-menu-textsize2.png`). A faction card reads "A faction with about two in five of the power, once it is angry, makes its demand." above a Power bar reading "none" (`d-ruler-realm-realmView-court.png`). The same file forces `A.DIFF.showOdds = () => false`, so the menu's "Show exact odds on choices" is a dead checkbox. | 7 | Run dePct only on prose nodes marked `data-prose`. Label text sizes "Normal / Large / Larger / Largest". Remove the odds toggle or honour it. |
| 12 | **The red "!" means two things.** 71-phone's `UI.tabBadge` uses the same red "!" for "new lines in your story" as for "at war", so Life and Story carry a red badge almost every month (`p-child-life-life.png`). | 7 | Keep red for danger only. Mark unread story with a small neutral dot or a count. |
| 13 | **The desktop event moment is not focused.** The card docks in the middle column while both side columns stay live: 833 words on screen, about 150 of them the card's. A hint banner sits above it. At 1366×768, choices 3 and 4 fall below the card's fold ("Call in a favour owed…" is cut off, `d-noble-card1.png`). | 7 | Make it a true modal with the rest dimmed, an art band of at most 120 px, and every choice visible without scrolling. Hints go in the card footer. |
| 14 | **Numbers, abbreviations and modern units** break "words over numbers" and the period voice. Examples: "INS fair", "Persuasion Adept +WIL", "+2 SPD, -2 STR", "STAB.", "⧗ 6.6 /7 · next in 23d", "Chancellor 63 · Spymaster 81", realm opinions "-44 / +77", "Reflexes 232 ms", "Speed 8.3 m/s", "113 hours", "Score ×1.00", and "1.1M suns" directly above "1,127,527 suns". | 6 | Words first everywhere (tier words, "quick as a hare"), exact figures one click deeper, stat names spelled out. |
| 15 | **Every digit looks like terminal output.** Atkinson Hyperlegible's slashed zero renders "11Ø5", "Ø suns" and "×1.ØØ" on every date and amount. | 6 | Set dates, money and ages in Literata with old-style figures. Keep Atkinson for labels. |
| 16 | **Activities commit on one tap and are described only on hover.** `UI.A.act` calls `A.doActivity` immediately. The only description is the tile's `title` ("Plot to seize a throne 3⧗" → "Coups begin in whispers."). An adult sees 12 filter chips and 29 tiles (`p-noble-life-life-full.png`). | 6 | A tap opens a bottom sheet: what it does, cost, odds, risk, and a "Do it" button. Show 6 suggestions plus "More". |
| 17 | **Truncation and cramped headers at 420 px.** Chips read "Wants your com…"; "Has a venture in mind" is clipped by the screen edge (`p-noble-family-people.png`). Holdings amounts wrap ("+2,491 / suns"). Fold headers squeeze a 5-line paragraph beside the heading ("THE ELITE OF ARDAN", "AROUND YOU"). "in the Path   tab" has a gap. On desktop: "Living as it c…", "4.0 initiat…". | 6 | Put the summary under the header. Don't let amounts wrap. Give chips a max-width and show the full text on tap. |
| 18 | **Visible copy bugs.** "Would teach you f" on People: `998-people-want/want.core.js:17` `skName` reads `GD.SKILLS[k][0]`, the first letter of a string. Also "1 armies in the field", "1 years · 0 battles", quiet-month lines printed twice in a row ("A cold month. You keep near the fire." twice), and "( 1/37 )". | 6 | Fix `skName`; add a plural helper; write each quiet line once. |
| 19 | **The phone hides your age.** The phone top bar shows the date, ⧗ and coin; the Now card shows name, health and happiness. The age is a tap away, in the date popover. BitLife puts the age on its one button. | 6 | Put "Age 9 · Jan 1105" in the phone top bar. |
| 20 | **Map details.** Captions are written for a mouse on every device ("Hover for details, click to select a realm."; "Drag to pan, wheel or buttons to zoom."). The compass rose covers the south-east coast. War Room place names are unreadable at 420 px. Units wear modern NATO frames (XXXX, XX, ⊠) on a medieval map. | 6 | One map component. Captions that know about touch. Heraldic banners for units. Move the compass off the land. |
| 21 | **Title and first run.** With a save present, "Continue" is the third button and styled as secondary (`p-title-with-save.png`). "Mods" sits at title level. The phone subtitle orphans "1105". The default difficulty is named "Hard". | 5 | Make Continue the primary button, with portrait, name and age. Rename difficulties "Gentle / Normal / Harsh". Move Mods into Settings. |
| 22 | **The menu is a settings dump.** 31 controls in one 1.9-screen scroll mix Save, Load and Report with 15 art and audio toggles and developer items ("Playtest mode"; "Classic event pool … Off: 826 small one-off events are retired…"). There are two portrait switches ("Painted miniatures", "Anime portraits (off: woodcut miniatures)"), and the "Moment cut-ins" checkbox sits on its own line above its label. | 5 | Menu: Resume, Save, Load, Settings, Help, Quit. Group Settings into Display, Sound, Gameplay and Access. Developer items go behind a URL flag. |
| 23 | **The battle is a text box.** "Battle of Nahin" offers the same three tactics in Skirmish, Clash and Press, one of them "a certainty" (`d-battle-1.png`). There is no picture of the line, the ground (the mountain pass exists only in words), losses or morale. | 5 | Add a phase strip and a schematic (your line, theirs, the ground). Tactics change by phase and are never "a certainty". |
| 24 | **The War Room on a phone.** Next day and Next week shrink to an unlabelled sun and calendar. The legend ("EDGE… STRIP… BARS… Banner = realm (3-letter code above the number)") has to be studied. | 5 | Label the buttons. Put the legend behind ⓘ. Scope by rank (#6). |
| 25 | **The family tree is not a tree.** It is rows by generation, with no lines and no parent-child grouping. Your own row comes last, below the fold: 16 cards for a 23-year-old (`d-soldier-ov-tree.png`). | 5 | Centre it on you, with connectors and cousins under their parent, collapsed by default (as in CK3). |
| 26 | **The person card leads with combat and lore.** The father's first chip is "less than one levy"; a column rates a fight with him; he "says": "Of the Dragon of Corvasse…". His opinion shows "warm" and "Close" at once. | 5 | Lead with relationship, age, trade, mood toward you, what they want, and 3 actions. Show fight data only for soldiers and rivals. |
| 27 | **The death screen describes another life.** "Dame, First Minister… THE ENDING: Master of the Craft — Made things that will outlast the maker." Then: "carves your initials into the bench outside the alehouse, where you used to sit". On desktop the buttons are below the fold, and "Keep this life" doesn't say what it does (`d-death-1.png`). | 5 | Choose the ending from the career. Pin the buttons. Rename it "Add to the Hall of Lives". |
| 28 | **Duplicate surfaces.** The Book retells the story log in the next column. What now's "Live the next month" duplicates the time button. Holdings repeats a whole table for "The year before". | 4 | One place per fact. |
| 29 | **The story log's colours** (green, red, amber, white, grey, italic) carry meaning with no legend: meaning by colour alone. | 4 | Add icons and a legend, and filters (Mine / Family / Realm / Rumour). |
| 30 | **The Decisions tab explains the interface instead of the world:** "There are no quest lists in Ardan. What you aim for is set on the Life tab…". "Decide" still shows when a requirement is unmet. | 4 | Cut the paragraph. Show decisions you can take now; collapse the rest under "Later". |
| 31 | "Keep this" (result card), "Keep this page" and "Keep this life" are three bookmark actions, and none says what keeping does. | 3 | "Add to your chronicle". |
| 32 | **The top-bar Save is a seal glyph**, the icon 95-icons' own README flags as needing a test, in a game that autosaves every year. | 3 | Label it, or move it to the Menu. |
| 33 | **The Path promotion board fails axe:** 4 targets 17.9 px tall, and `b[data-v="job\|open"]` has no name. | 3 | Make targets at least 24 px and add aria-labels. |
| 34 | **Laws change on one tap** ("Crown authority Low…Absolute", "Taxes… Crushing"), with the effects only in a sentence below. "Leave the army" has no confirm, though Desert and Abdicate do. | 3 | Preview, then confirm, irreversible steps. |

## Hover pop-ups and tooltips: inventory

1. **59-tooltips engine.** `UI.TIPS` has 160 entries, opened from `data-tt` and the release's `data-tip`: 45 and 8 literal markup sites, plus string-insertion wrappers in `tt.wire.core.js` and `tt.wire2.core.js` across about 25 screens.
   - It opens on **hover** (`pointerover`; closes 320 ms after leaving), pins on click or tap, opens on Enter or Space, and nests up to 6 deep.
   - Link-words inside popovers carry the `.tt` class (18 sites).
2. **Native `title=` tooltips** (hover only, never on touch): 154 `title="` sites, 16 `.title=` and 4 `setAttribute('title')`.
   - They carry real content: `GD.TRAITS[t].desc`, `GD.QUIRKS[q].desc`, `GD.SKILL_DESC`, `A.ACTIONS[k].desc` (every activity), `A.ECON.why` (market prices), `ADV.whoTip` (counsel), `VS.oddsOf(pct).line`, "Opinion N", division "Organization N/M", and career blurbs.
   - On-screen counts: Proficiencies 103, Full profile 88, creation step 3: 73, Holdings 64–72, Path 61, adult Life 45.
3. **Map hover tips:** `MAP` canvas `onmousemove` → `.maptip` (the World map), the big map's `cv.onmousemove`, and the War Room's `cv.onpointermove` → `UI.wrTip`.
4. **The release's own engine** (`document mouseover` → `UI.tipShow`, tip1/tip2) is still in the blob; 59 replaces it.
5. **CSS:** 65 `:hover` rules, styling only (one reveals a button's `::after`).

## What each screen should show

| Screen | At first glance (≤ about 7 things) | One click deeper |
|---|---|---|
| Title | **Continue** (portrait, name, age, year), New life | Load, Mods, Settings, How to play |
| New life | Three start cards with face and class (born a peasant / noble heir / a story), difficulty "Normal", Begin | Customise in 4 steps with a sticky preview |
| Life (home) | Portrait, age, 4 vitals in words, the time button, What now (≤3), Coming up (≤2), the last 5 story lines | Activities (6 suggested, then all), plan, chapter, year in review |
| Event card | Art band, title, ≤80 words, every choice with effect chips and odds words; nothing else on screen | ⓘ: odds breakdown; the people involved |
| You | Age, build in words, top 3 traits with their meaning, 3 best skills by tier | kg, m/s and hours; all proficiencies; wounds |
| Path | Post, ladder, the next requirement checklist (already right) | Other careers, offers, schools |
| Holdings | Purse, net this year, the 3 biggest lines | Full ledger, market, gear, property |
| People | Household with faces and one mood word; people met (≤12), grouped by how you met | Tree, extended kin, counsel, bond history |
| Dynasty | House, heir, the law in one sentence | Chronicle, endings, achievements |
| Realm/Court | Commoner: ruler, the realm in a word, war or peace, one rumour. Noble: plus your rung and factions. Ruler: 4 key figures plus alerts | Council, laws, lords, politics, build |
| World | One map (mode dropdown), 3 recent things you heard | Realms, wars, history, annals |
| Codex | Search; terms recently met | Articles |
| War (when deployed) | Your unit, your commander, orders, next fight, morale and supply in words | War Room scoped to rank |
| Battle | Schematic of the lines, the phase, 2–4 choices | After-action causes |
| Person | Face, relation, age, trade, mood toward you, what they want, 3 actions | Body and fight, lore, history |
| Menu | Resume, Save, Load, Settings, Help, Quit | Grouped settings |
| Death | Name, years, how they died, an epitaph that fits, **Continue as heir** | What became of them, score |

## What to take from the best

- **BitLife:** one column, the age on the one button, faces and one bar per relationship, and an activity opens a sheet before you commit.
- **Reigns:** the card owns the screen. Ardan's "Works: ▲ … · Fails: ▼ …" chips already match its icon preview.
- **Crusader Kings 3:** the character window leads with a portrait and five facts, and only terms carry tooltips, styled one way. Take the click-pinning, not the hover.
- **Football Manager:** dense but scoped. A scout sees ranges, not truth, which is Ardan's rank-scoped war in one rule.
- **Dwarf Fortress (premium):** icons and the mouse made it playable; its legends are still a wall. Keep lore out of action tabs.
- **Battle Brothers:** the event screen is art, text and choices, nothing else. Parties appear on the map only once scouted.
- **Mount & Blade II:** a hyperlinked encyclopedia, a party screen that holds only your party, and orders by formation.

## Keep

- The phone event card: art, short text, effect chips and odds words with the tipped scale (`p-noble-card1.png`).
- The Path ladder and promotion checklist.
- The after-action "What decided it".
- Decisions' requirement chips.
- Toasts for quiet months.
- The thumb-zone Next month button and the bottom bar.
- Axe-clean on 13 of 14 screens, with reduced motion honoured.
- The Cinzel, Literata and Atkinson trio for text.
- The death screen's art.

## Top 5 to do first

1. **Descriptions on click only.** Delete hover-open in `TT.onOver`. Move every descriptive `title=` to tap popovers or ⓘ buttons, and lint it (#1, #16).
2. **Re-lay out the desktop and focus the event.** Two zones, a modal card, and word and control budgets enforced by a test using `metrics.jsonl`'s measure (#2, #3, #13).
3. **Show only what this person can reach.** Gate tabs and sections by age, class and rank. People starts with the household. The War Room is scoped by rank (#6, #7, #8).
4. **One source of truth for names and labels.** `holderOf` and `commanderOf` everywhere; navigation names generated from `UI.GROUPS`; dePct limited to prose; a plural helper; fix "Would teach you f" (#6, #9, #11, #18).
5. **A fast button with one meaning, and age on the phone.** ≤500 ms a month; it never stops time and never shows a dead "Go on"; "Age 9 · Jan 1105" in the phone bar (#4, #19).
