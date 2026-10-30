# What players complain about in games like Ardan, and where Ardan stands

Oct 26, 2026 · checked against a fresh build of `main` (`/tmp/ardan/complaints/x.html`: 83 features, 121 patches, 4,260 KB)

## How this was made

**The complaints.** Gathered from Steam discussions, review sites, forums and store reviews of BitLife, Crusader Kings III, Mount & Blade II: Bannerlord, Kenshi, RimWorld, Dwarf Fortress, King of Dragon Pass, Six Ages, Reigns, Alter Ego, InstLife, Life is Feudal, Battle Brothers, Darkest Dungeon, Wildermyth, Stellaris, Victoria 3, Banished, Kingdom Come: Deliverance and Fallen London. Each category below gives two or three sourced examples. They are players' words, often from older versions of those games, and say nothing about how common a complaint is.

**A caveat on the links.** Steam and some forum pages could not be fetched from this machine (`steamcommunity.com` does not resolve here). Their quotes come from search-engine extracts of those pages. When a search returned several threads on the same complaint, the link goes to one of those threads, and it may not be the exact post quoted. Check a quote on its page before using it in public.

**Ardan's side.** Each category was checked against the game itself, not against the plan:

- **Six bot lives from birth** (seeds 101 to 606, peasant, noble and merchant, Hard). They ran headless with `T.play` (random choices) and recorded 2,240 scenes, 336 game years in all, plus time per game year, the cost of drawing each tab, the save size and the time to encode a save.
- **Screens.** 22 screens at 1366×768 and 390×844 (a peasant of 20 and a noble of 30, every tab, an open event). For each one the probe recorded the height of each scrolling region against its view, the visible controls, the disabled controls with and without a stated reason, the words on screen and the tooltip targets.
- **A dead-click scan.** `tools/deadclicks.mjs` on eight screens, plus its static check for any `data-a` action that has no handler.
- **The code**, read from the unpacked build, and the repo's own reports: `reports/scorecard.md`, `reports/balance.json`, `reports/dominance.json`, `docs/plan/*`, and `docs/design/critique.md` (Oct 26).

The probe scripts are not in the repo. They are small, and the numbers can be reproduced from the description above.

**Severity** means "how likely a 13-to-23-year-old new player is to quit or grumble over this in Ardan today", not how bad the problem is in the other games.

## Summary

| # | Complaint | Severity for Ardan | One-line verdict |
| --- | --- | --- | --- |
| 1 | UI clutter and too much scrolling | **High** | The Life tab is 4.7 screens tall and Holdings 8 (13 on a phone). There are three scrolling columns at once. |
| 2 | Repetitive events | **High** | 37.5% of the scenes a life shows are ones it has already seen, and after 35 more than half are. |
| 3 | Late-game boredom | **High** | Repeats peak in the last decades, and fortunes of 100,000 to 600,000 suns have nothing to buy that costs more than 3,500. |
| 4 | Not knowing what to do next | Medium | "What now" is good, but the adult hints never show in a life started at birth (a calendar bug). |
| 5 | Lack of goals | Medium | "There are no quest lists in Ardan." The release's ambition system is gone and its 5 events can never fire. |
| 6 | Unclear consequences | Medium | Odds are honest and shown on 70% of scenes, but costs and the price of failing are not on the buttons. |
| 7 | Deaths that feel cheap | Medium | 1 newborn in 20 dies before 5 on the default difficulty, before making any choice. Adult deaths read as earned. |
| 8 | Saves lost | Medium | Saving is robust: 4 rotating slots, autosave and export. There is one life slot, no "last saved" chip, and `persist()` only on a manual save. |
| 9 | Phone layout | Medium | Well built: no sideways scroll, 44 px targets. Holdings is 13 screens long, and no real phone or iOS Safari has been tried. |
| 10 | Buttons that do nothing or don't say why | **Medium-high** | Two of What now's three suggestions are dead clicks. 57 of 91 disabled controls on Holdings, and the order's "Ask to join", give no reason. |
| 11 | Performance | Medium-low | Loads in 2.5 s. The World tab takes 300 to 570 ms to draw, and the yearly autosave blocks the page for 200 to 390 ms. |
| 12 | Tooltip hell | Low-medium | Holdings has 300 tooltip targets on one screen, and tips nest six deep. |
| 13 | AI stupidity | Low-medium | Rulers act on their traits and the reasons are logged. Nobody has yet judged whether it looks smart. |
| 14 | Text walls | Low | Scene text: median 49 words, never over 80. The walls are whole screens (about 1,000 words on the Life tab). |
| 15 | RNG feeling unfair | Low | Shown odds are within 2 points of the real ones, and checks are won 51 to 58% of the time. The roll is never shown afterwards. |
| 16 | Slow early game | Low | Fixed by 82 and 81: 6.0 to 6.8 prompts a game year, and the first stop comes within seconds. |
| 17 | Grind | Low | Time runs itself. The dominance report that flagged a dominant strategy is from Oct 15 and should be re-run. |
| 18 | Economy exploits | Low | The buy-and-sell-back loop is 0 and famines triple bread. What is left is wealth that piles up late, covered in 3. |

---

## 1. UI clutter and too much scrolling: **High**

**What players say.**
- Victoria 3's launch reviews list "Bad UI Design" as a con. Key information is "buried under layers of text, mostly in tips", behind "a cascade of menus" ([eXputer](https://exputer.com/reviews/victoria-3/)). A Steam player lists too many click-throughs and windows, and overlapping panels that cause misclicks ([Steam](https://steamcommunity.com/app/529340/discussions/0/3782499798638364851)).
- Kenshi's "archaic, cumbersome UI" becomes punishing once a squad passes 15 to 20 people ([Select Button](https://selectbutton.com/reviews/kenshi-early-access-review)). In Dwarf Fortress, "a good part of what made the old versions hard to learn was the UI"; the game "hides every detail behind some tab" ([Steam](https://steamcommunity.com/app/975370/discussions/0/3416557114751453595)).
- CK3 on console: "the sheer volume of data" makes couch play hard ([Empire](https://empireonline.com/gaming/reviews/crusader-kings-iii-console-edition)). The side panels can leave "only a sliver of the map" ([TheSixthAxis](https://thesixthaxis.com/2022/03/29/crusader-kings-3-console-review)).

**Ardan today** (probe, 1366×768):

| Screen | Scroll height / visible | Screens | Visible controls | Words on screen |
| --- | --- | --- | --- | --- |
| Life (peasant 20) | 2,640 / 559 px | **4.7** | 93 | 960 |
| Life (noble 30) | 2,574 / 559 px | 4.6 | 93 | 1,080 |
| Holdings | 4,779 to 4,917 / 613 px | **7.8 to 8.0** | 236 to 246 | 1,251 to 1,408 |
| Path | 2,042 to 2,518 / 559 px | 3.7 to 4.5 | 115 to 128 | 689 to 896 |
| Codex | 4,684 / 559 px | 8.4 | 56 | 2,007 |
| Profile column (every tab) | 1,275 to 1,295 / 674 px | 1.9 | n/a | n/a |

- On most tabs, two or three regions scroll at once: the tab body, the profile column and, for a noble, the log.
- This agrees with `docs/design/critique.md`, which rates the Life tab 🔴 Critical.
- Every section of the Life tab is open at once: What now, the year in review, Your days, every stat and skill, the stage's actions and the activities.
- The What now card, the most useful thing on the tab, sits at the top of a column that is five screens long.

**Fix.**
1. Collapsible sections with a one-line summary in each header, remembered per section. Open by default: What now, plus the stage's actions.
2. Split Holdings into sub-tabs (Market, Gear, Property, Money book). No tab should be more than about 2 screens tall at 1366×768.
3. A compact profile: a small portrait beside the name, the stats in a two-column grid, and proficiencies collapsed.
4. Gate it with a test that measures `scrollHeight / clientHeight` per tab and fails above 2.0 (the probe's method).

## 2. Repetitive events: **High**

**What players say.**
- CK3: "a small set of events that keep recycling" through a reign. Players ask for the same event never to fire twice in a row ([Steam](https://steamcommunity.com/app/1158310/discussions/0/3838801919839423509)). Travel and activity events are called "repetitive, tedious, and spammy with pop-ups" ([Vaporlens summary of Tours & Tournaments](https://vaporlens.app/app/2311920/crusader_kings_iii_tours_tournaments.md)).
- Reigns: despite 500+ cards, "the same dilemmas kept coming up" ([TechRaptor](https://techraptor.net/content/reigns-review-addicted-death)). Critics "said that it became repetitive over time" ([Wikipedia](https://en.wikipedia.org/wiki/Reigns_(video_game))).
- Wildermyth: "after just 4 playthroughs, the random story events are already starting to repeat themselves" ([Xbox Tavern](https://www.xboxtavern.com/wildermyth-review/)). "A few that repeat fairly often between campaigns or even chapters" ([Gaming Trend](https://gamingtrend.com/reviews/wildermyth-review-dnd-for-the-lonely/)). Six Ages 2 players name "repetitive loops and events" in long games ([Vaporlens](https://vaporlens.app/app/2278010/six_ages_2_lights_going_out)).

**Ardan today.**
- 25-variety-guard reports **0%** of rolled events seen again within 10 years. That is true, and it is the wrong denominator.
- Over the 2,240 scenes the six probe lives actually showed:

| Stage | Scenes | Already seen this life |
| --- | --- | --- |
| 0 to 15 | 618 | 17% |
| 16 to 34 | 731 | 37% |
| 35 to 54 | 611 | **52%** |
| 55+ | 280 | **53%** |
| **All** | 2,240 | **37.5%** (about 22% within 10 years) |

- The repeats come through the side doors the variety guard's README names, not through the roll. By prefix: job duties `du_` 189 repeats, NPC moves `ni_` 125, gatherings `ga_` 80, `nb_` 61, `bd_` 61, path flows `fl_` 56.
- The worst offenders are scenes written as one-off moments:
  - **"An old scholar"** (`fl_st_master`, the study flow) came 6 to 11 times in *every* life. Its text is "an old scholar with a famous name and no money, offers to teach you". Its result is "You will never think the same way again".
  - **"Something said in confession"** came 12 times in one noble life: the same frightened man, paid to poison the same well.
  - "Someone is undercutting you" came 14 times in one life, and a gathering invitation (`ga_invite`) 30 times.

**Fix.**
1. Give scenes that tell a specific story about one person `once: true` or a lifetime cap of 2, starting with `fl_st_master` and `du_ch_confession`.
2. Turn the best duty scenes into templates whose parts vary (the village, the sum, who is asking, what they want), so a returning duty is a new case.
3. Make `A.evRecency` remember the whole life, not 10 years, for pool events with a fixed story. Let the pool refill from new writing rather than from repeats.
4. Add a scorecard metric, the share of shown scenes already seen this life, with a target of 15% or less. Measure it in `bench/bot.mjs` over the whole sequence the player sees.

## 3. Late-game boredom: **High**

**What players say.**
- CK3: "if you are the greatest power without an actual threatening enemy, then the game becomes boring" ([Steam](https://steamcommunity.com/app/1158310/discussions/0/5764050278021830091)). The late game is "nearly always a genetic super dynasty in charge of a super empire with ridiculous modifiers" ([Paradox forum](https://admin-forum.paradoxplaza.com/forum/threads/the-gameplay-focus-on-stacking-stats-and-modifiers-runs-counter-to-the-core-design-philosophy-of-crusader-kings-3.1735002)).
- Bannerlord: "so repetitive, regardless of what kind of army you build" ([Tom's Guide](https://www.tomsguide.com/opinion/i-hate-to-say-it-but-bannerlord-hasnt-fulfilled-its-potential-not-even-close)). Burnout once the game becomes "sieging every castle on the map" ([RPGHQ](https://rpghq.org/forums/viewtopic.php?p=385012)).
- Banished: once a colony is self-sufficient, "the vanilla game starts to coast… you're mostly maintaining a machine that already works" ([GameGeeker](https://gamegeeker.com/games/banished-242920); see also [PC Gamer](https://www.pcgamer.com/banished-review)). Battle Brothers: good "for the first 15-20 hours", then burnout ([GOG reviews](https://www.gog.com/en/game/battle_brothers?page=10)).

**Ardan today.**
- **Content for the late years exists.** 46-life-arcs gives each path a legacy from 55. 74-old-age adds 119 events and the deathbed. 28-endings and the heir (`A.continueAs`) carry on after death.
- **But the late years are where repetition peaks:** 52 to 53% of the scenes after 35 are repeats (see 2).
- **Money stops mattering.**
  - In probe life 505 (a noble) coin went 33,540 → 69,862 → 258,972 over its last three decades.
  - In the balance league, peak coin reaches 505,525 for a peasant and 614,099 for a serf (`reports/balance.json`).
  - The largest purchases on the Decisions tab cost 3,500 (a family seat) and 2,500 (a great work).
  - This is CK3's "too much gold" complaint (section 18), and it arrives in the same part of a life.
- A life arc starts with a chance of 1 in 24 a month, so it often comes years after a life levels off. 46-life-arcs' own README says that before it, an established life got "more of the same until you die".

**Fix.**
1. Fix 2 first. It is the larger part of this problem.
2. Big sinks with stakes for rich lives:
   - buy a title or a lordship;
   - fund a claimant (56 has backed claimants: let a commoner pay for one);
   - a ransom;
   - a dowry war;
   - a monastery or university that names you.

   Each should open a new arc, not just take the coin.
3. Make the legacy and old-age arcs start the year they become possible, not on a 1-in-24 monthly roll.
4. A "nothing new for N years" detector: when a life has seen only repeats for two years, queue an arc stage or an NPC move with a new kind.

## 4. Not knowing what to do next: **Medium**

**What players say.**
- CK3: experienced players advise that "the tutorial isn't actually that great compared to watching YouTube videos" ([Pure Xbox](https://purexbox.com/news/2022/04/xbox-players-are-getting-stuck-at-the-tutorial-in-crusader-kings-3)). New-player threads open with "where do I start" ([Steam](https://steamcommunity.com/app/1158310/discussions/0/3949154699983983753)).
- Fallen London became "super complex and opaque after a certain point", and rerunning the tutorial didn't help ([MetaFilter](https://www.metafilter.com/159501/Welcome-Delicious-friend)).
- Victoria 3: "Learn to Play" helps, but the UI "can overwhelm new players" ([GameCritics](https://gamecritics.com/mitch-zehe/victoria-3-review/)). One player could not find the decisions menu, a sub-menu of the journal tab ([Steam](https://steamcommunity.com/app/529340/discussions/0/3549427890070729105)).

**Ardan today.**
- **Strong base.**
  - `A.whatNow` ranks about 25 situations: health, treasury, an heir, angry factions, a war being won or lost, career choices, work offers, a grading bout, an unhappy superior, training, initiative, favours, love. It shows the top three, each one click away. At age 20 a peasant's card read "Underworld: choose your path · Look at a work offer · Train in an extra session".
  - 12 hints teach by doing, the title screen has "How to play", and the Decisions tab explains itself.
- **A bug.** Hints switch off by calendar, not by life:
  - `UI.hintsOn = … A.S.year < 1105 + UI.HINT_YEARS`, with `UI.HINT_YEARS = 10`.
  - The default life starts at birth in 1105 (`startAge: 0`), and a human comes of age at 16, in 1121.
  - The two adult hints, "You have initiative to spend" and "Hover or tap your fighting worth", are conditioned on `A.isAdult` and can therefore **never appear** in a default life. Neither can any hint for a tab first opened after age 10.
  - Road to 100 noted "hints are tied to the calendar"; it is still true.
- **Two of What now's three suggestions do nothing when pressed:** "Choose what to train" and "Spend your initiative" (dead-click scan, see 10).
- What now is at the top of a 4.7-screen column, and nothing on screen points to it after the Play button (critique: "after Play there is no second step").
- No human has played it: the five-player playtest (`docs/plan/Playtest kit.md`) has not been run.

**Fix.**
1. Tie hints to the life: on for a hint's first applicable moment, for example on coming of age. Keep a setting to turn them off.
2. Keep What now in sight. On desktop, pin it above the scroll. On the phone, put it in the play dock.
3. Run the playtest kit, and treat any task that two players give up on as a top bug.

## 5. Lack of goals: **Medium**

**What players say.**
- BitLife: "like most life simulators, there is no point other than to simulate life" ([GameLuster](https://gameluster.com/?p=32010)). On r/BitLifeApp, lives "feel the same over and over" and the game "gets redundant as you age"; players invent their own challenges ([Reddit mirror](https://lr.us.psf.lt/r/BitLifeApp/comments/1g1ox0v/tips_to_make_bitlife_more_fun)).
- Bannerlord: too little to do between wars; "stale after 30 hours without mods" ([Steam](https://steamcommunity.com/app/261550/discussions/0/3421060714399923355)).
- Banished: the tension "thins out" with nothing left to aim for ([PC Gamer](https://www.pcgamer.com/banished-review)).

**Ardan today.**
- **The Decisions tab begins:** "There are no quest lists in Ardan. What you aim for is set on the Life tab… and climbed on the Path tab."
- **The release's ambitions are gone, and their content is dead.**
  - `A.migrateV10` deletes `p.amb` from every person, and nothing in the build sets it.
  - `C.ambition` therefore always returns false.
  - Five events can never fire: `pa_freedom_buy`, `pa_freedom_kind_master`, `pa_expand_petition`, `pa_golden_harvest`, `pa_web_marriage`.
  - `65-mods` still offers `ambition` to mod authors as a condition.
- **What gives a life a shape:**
  - career ladders with "doors" (Path tab);
  - 46-life-arcs (one undertaking for the middle years, one legacy);
  - 20 named endings with a collection (28-endings);
  - 20 hand-made starts (29).

  All of them arrive or show up afterwards. None is something the player picks and tracks from the start.

**Fix.**
1. **A chosen ambition** at coming of age (and again at 35): two to four offered from the life's situation and the endings list ("Buy your freedom", "Die a master of your craft", "Sit on the council"). It shows on the Life tab with its next step and a progress line.
2. Store it in `p.amb = { k }`, so `C.ambition` and the five orphaned events come back to life.
3. When an ambition is fulfilled, mark it on the endings collection, so a goal pays off in the meta layer.

## 6. Unclear consequences: **Medium**

**What players say.**
- CK3 players ask for a mod "that tells you event outcome, to save me from save scumming" ([Steam workshop](https://steamcommunity.com/workshop/filedetails/discussion/2216659254/599641632829143500)). A Victoria 3 player says the game "doesn't explain events", and a debuff appears only as a small icon in one of many menus ([Steam](https://steamcommunity.com/app/529340/discussions/0/3549427890070729105)).
- King of Dragon Pass is "demanding and sometimes cheerfully obtuse" ([Pocket Gamer](https://www.pocketgamer.com/king-of-dragon-pass/review/)), a game where "a foolish mistake can have lasting consequences" ([Prima](https://primagames.com/gaming/king-of-dragon-pass-steam-version-review)).

**Ardan today.**
- **Odds are visible and honest.**
  - 70% of the scenes the probe met had at least one choice with an odds badge.
  - Shown duel odds are within 2 points of the real ones (scorecard).
  - 89-fight-odds badges beast fights.
  - On Story, odds are always shown as a number.
- **Costs and stakes are not on the buttons.**
  - "Pay his rent" costs 30 suns (`fx: {coin: -30}`) and the label does not say so.
  - "Pay a champion to stand for you" shows no price.
  - "Apologise for the wrong · 49% · risky" does not say what failing costs.
  - The odds tooltip breaks down the *chance*, not the *stakes*.
- Delayed consequences, such as memories (67) and callbacks (40, 80, 87), are a strength, but nothing tells the player a choice will be remembered.

**Fix.**
1. A cost chip on each choice, read from `fx` and `req`: coin, initiative, and "needs 30 suns" when the choice is greyed out.
2. On a check, a short "if it fails:" line from `lose.fx`: wound, prison, opinion, coin.
3. A quiet "they will remember this" mark on choices that set a flag a later scene reads (the memory index already knows which ones).

## 7. Deaths that feel cheap: **Medium**

**What players say.**
- CK3: when a healthy, careful ruler "suddenly gets an event with a very high chance of death, it feels unfun and way too random" ([Steam](https://steamcommunity.com/app/1158310/discussions/0/3839927720689373230)). "RNG in a game where one does not have control over that kind of thing is frustrating" ([Steam](https://steamcommunity.com/app/1158310/discussions/0/3806154232473755761)).
- Darkest Dungeon: a hero levelled over 15 to 20 hours "died in 3 minutes" ([Steam](https://steamcommunity.com/app/262060/discussions/0/1727575977522815607)).
- Kenshi: "repeated, demoralizing deaths" in a brutal opening drive newcomers to quit ([Select Button](https://selectbutton.com/reviews/kenshi-early-access-review)).

**Ardan today.**
- **Adult deaths read as earned.**
  - The six probe lives died at 38 to 73: a stroke (twice), a winter cough (twice), a failing heart, and a wound gone bad.
  - The release's misnamed causes are fixed (03, ENG-DEATH-CAUSE). 76-beast-habitats cut beast deaths before 50 from 19 to 8.
  - 49-body-mind refuses risky activities below 50 health, and 74-old-age gives a death screen that remembers the life.
- **The first minute can kill.**
  - New players start on **Hard**, the release's default. On Hard, 1 newborn in 20 dies before age five, before making any choice.
  - The overnight report puts the chance that one of five playtesters meets this at about 1 in 4.
  - On Story, no newborn of 60 died before five.
- 57% of league lives used to die before 55, as two humps (round 7). The beasts fix moved the human median for those who reach 20 to 61.5, so this is now mostly the infant hump.

**Fix.**
1. Protect the **first life** through childhood, or default the first life to Story and say so on the create screen. This is the owner's design call in the overnight report. The data argues for it.
2. Tag a choice that can kill ("· could kill you") from its `fx.die` and the fight ladder.
3. Offer "continue as your heir" on the death screen even when the life was short, so a death is a turn of the story, not a game over.

## 8. Saves lost: **Medium**

**What players say.**
- BitLife saves only on the device: users who reinstalled "lost their save game", and support says lost data "cannot be retrieved" ([Droidwin](https://droidwin.com/bitlife-crashing-when-opening-menu-how-to-fix/), [DigiStatement](https://digistatement.com/how-to-get-bitlife-progress-back/)).
- Browser games: clearing site data, incognito mode, and Safari evicting storage from sites not visited in about 7 days all wipe saves ([itch.io](https://itch.io/t/5464689/web-browser-game-randomly-losing-localstorage-data), [Bugnet](https://bugnet.io/blog/how-to-fix-web-game-save-lost-when-browser-clears-storage)).
- Kingdom Come: Deliverance's Saviour Schnapps saves cost players 45 minutes to an hour after an ambush ([Steam](https://steamcommunity.com/app/379430/discussions/0/1736634553084206755), [PCWorld](https://www.pcworld.com/article/407893/kingdom-come-deliverance-save-system-mod.html)). One KCD2 player lost 28 hours to a cloud sync ([Steam](https://steamcommunity.com/app/1771300/discussions/0/601896014188707590)).

**Ardan today.**
- **Robust by design.**
  - Saves go to IndexedDB with a localStorage fallback, in four slots that rotate (`cur`, `bak1` to `bak3`).
  - It autosaves every game year (about 90 s at the default speed) and whenever the tab is hidden.
  - Menu → Export and Load write and read a `.ardan` file.
  - A failed save warns (05). Only one tab saves at a time (a Web Lock).
  - No corrupted saves in the bench's save/load cycles.
- **Gaps.**
  - **One life at a time.** Starting a new life warns: "autosaves will push the old one out… use Menu → Export first."
  - `navigator.storage.persist()` is asked only on a *manual* save (`!silent`). A player who relies on autosave never asks the browser to keep the data.
  - No "last saved" mark on screen. `SAVES.lastSaveAt` is read only by playtest mode. Road to 100 listed this as work, and it is not done.
  - Saves live in the browser and the origin that opened the file. A copy opened from another folder or another browser starts empty (Playtest kit). Firefox and Safari are untested, and Firefox's per-file origins for `file://` may make this worse (unverified).
  - A save is 556 to 653 KB compressed, from 3.4 to 4.0 MB of state, after 38 to 73 years.

**Fix.**
1. Ask `persist()` on the first autosave.
2. A "Saved · 1 min ago" chip by the Save button.
3. Three named life slots.
4. Every ten game years, a gentle "Export a copy?" toast.
5. Host the game at one https address for players, so saves do not depend on where a file was downloaded.

## 9. Phone layout and text size: **Medium**

**What players say.**
- CK3 on Steam Deck: one buyer nearly returned it because "the text was either too small or I couldn't declare war"; Valve rates it only "Playable" for text size ([TouchArcade](https://toucharcade.com/2024/05/08/paradox-games-on-steam-deck-2024-crusader-kings-iii-europa-universalis-4-hearts-of-iron-stellaris-cities-skylines-2-victoria-3-rome/)).
- CK3 on console has no text-size option; info panes are hard to read from a couch ([GGRecon](https://ggrecon.com/reviews/crusader-kings-3-ps5-review)).
- BitLife players with VoiceOver say they "spend more time trying to find items", with long lists to scroll ([AppleVis](https://applevis.com/comment/97892)).

**Ardan today.**
- **71-phone is a real phone design:** a bottom tab bar, a play dock, events as sheets, 44 px targets and no text under 14 px. Text size is a setting (a playtest task).
- In the probe at 390×844 no screen scrolled sideways.
- **The pages are long:**

| Tab (phone) | Height | Screens |
| --- | --- | --- |
| Holdings | 10,870 to 11,118 px | **12.9 to 13.2** |
| Codex | 5,824 px | 6.9 |
| Legacy | 4,755 px | 5.6 |
| Life | 3,931 to 4,156 px | 4.7 to 4.9 |

- The event sheet puts the "⚑" report control *first* in its choice order on the phone ("⚑, Pay the mark, Bar the door"). It is the first thing a thumb or a screen reader meets.
- No real phone and no iOS Safari has been tried (status: "Real phones and iOS Safari need players").

**Fix.**
1. Collapse sections and split Holdings, as in 1. It helps the phone most.
2. Move "⚑" after the choices in the DOM and into the sheet's corner.
3. Test once on a real iPhone (Safari) and a cheap Android before the playtest.

## 10. Buttons that do nothing, or don't say why: **Medium-high**

**What players say.**
- CK3 players are puzzled when an option is "simply not in the menu at all" rather than greyed out, or "simply gone for one ruler but present for others" ([Steam](https://steamcommunity.com/app/1158310/discussions/0/6348431004277057923)).
- Victoria 3: the decisions menu turned out to be a sub-menu of the journal tab ([Steam](https://steamcommunity.com/app/529340/discussions/0/3549427890070729105)).
- Dwarf Fortress menus use inconsistent controls: "sometimes you use the numberpad, sometimes -+" ([Steam](https://steamcommunity.com/app/975370/discussions/0/3416557114751453595)).

**Ardan today.**
- **No orphan actions.** Every `data-a` name in the page's code has a handler in `UI.A` (deadclicks' static pass: none missing).
- **Most refusals explain themselves.**
  - The Decisions cards list each requirement with ✓ and ✗ ("✗ Renown 25 · ✗ 1,500 suns").
  - A gear "Buy" says "Not enough coin", and an owned item says "You have it".
- **Some don't.**
  - On a peasant's Holdings tab, **91 controls are disabled and 57 give no reason**. They are the market's "+1 / +5" buttons (`mktBuy`), with no title and no text.
  - The elite orders' "Ask to join" on the War tab is disabled without a reason.
- **The dead-click scan.** `tools/deadclicks.mjs` clicked the first 80 controls on each of eight screens (1,166 controls listed in all). It found **5 dead clicks**:
  - **Two of What now's three suggestions do nothing.** "Choose what to train" and "Spend your initiative" both send `["tab","life"]`, and the player is already on the Life tab. They are found on the Life screen and again behind an open event. These are the buttons a lost new player is told to press.
  - On the Realm tab, a "3⧗" cost badge looks clickable and does nothing.
- `docs/design/critique.md` rates dead controls 🔴 Critical: "a button that does nothing teaches the player that buttons cannot be trusted."

**Fix.**
1. Make What now's actions *do* the thing:
   - "Choose what to train" scrolls to the plan's training picker, opens it and focuses it.
   - "Spend your initiative" scrolls to the actions and highlights them.

   No suggestion should ever point to the tab the player is already on.
2. Every disabled control carries a reason, both in `title` and as visible small text where it fits ("no cart", "no coin", "orders take knights only"), or it is not drawn.
3. Make `tools/deadclicks.mjs` part of `tools/check.mjs`, with a test that every disabled control has a reason.

## 11. Performance: **Medium-low**

**What players say.**
- Stellaris: late-game lag from pops and ships; "something processing on a daily basis" slows the tick, and on large maps "they all lagged" even on fast CPUs ([Steam](https://steamcommunity.com/app/281990/discussions/0/2251181585652104208), [Steam](https://steamcommunity.com/app/281990/discussions/0/3825286438457734441)).
- Players ask whether a patch helped performance at all ([Paradox forum](https://admin-forum.paradoxplaza.com/forum/threads/has-anyone-seen-a-performance-increase-with-the-new-update.1839422)). Even 50 years in, "fleet battles cause the game to slow to a crawl" ([Steam](https://steamcommunity.com/app/281990/discussions/0/6761669877512899400)).

**Ardan today** (desktop Chromium, so a cheap Chromebook will be 3 to 4 times slower):
- **Loading.** 2.5 s to ready for a 4.26 MB page (it was 4.5 s before 48's fix).
- **The simulation.** 443 to 1,312 ms of computing per game year without drawing, about 1.2 to 3.6 ms a day. That is inside the scorecard's 5 ms bar, and it does not grow with age in the probe.
- **Drawing a tab** at the end of a life:

| Tab | Time to draw |
| --- | --- |
| **World** | **304 to 567 ms** |
| Holdings | 56 to 232 ms |
| Realm | 40 to 195 ms |
| Life | 30 to 170 ms |
| Others | 27 to 112 ms |

- **Saving.** Encoding a save takes 205 to 391 ms on the main thread, and it runs on every yearly autosave, so the page stalls briefly once every in-game year (about 90 s of play).
- **Frames.** The longest frame in 8 s of running clock was 217 ms.
- **State size.** 3.4 to 4.0 MB of JSON per life.

**Fix.**
1. Cache the World tab's drawing between days and draw only what changed.
2. Encode saves off the main thread (a worker with `CompressionStream`).
3. Trim the state of the long dead, such as people of extinct lines with no living bond.
4. Add a CI measure under 4× CPU throttling (Chrome DevTools Protocol), with bars of 100 ms for a tab draw and 100 ms for a save stall.

## 12. Tooltip hell: **Low-medium**

**What players say.**
- Victoria 3: information is "buried under layers of text, mostly in tips" ([eXputer](https://exputer.com/reviews/victoria-3/)).
- CK3 players ask for mods that hide, disable or delay the map tooltip ("would be a godsend") and for the old "less intrusive tooltips" option ([Steam workshop](https://steamcommunity.com/sharedfiles/filedetails/comments/2216876966)). Translated button text that only fits in the tooltip is another complaint ([Steam workshop](https://steamcommunity.com/sharedfiles/filedetails/comments/3140405364?l=danish)).

**Ardan today.**
- 59-tooltips explains 97 to 100% of the numbers on each screen, through about 140 entries that nest six deep. Esc closes the top one, and a tap opens a breakdown without taking the choice. This is CK3's model, done well.
- **Density.** Holdings has 300 to 307 tooltip targets on one screen, and Path 140 to 151.
- One known bug, since fixed: a hover tip covered the next odds badge (the `ttNested2` flake, Oct 23).
- Nobody has measured whether players read tooltips or drown in them ("Reading speed needs players").

**Fix.**
1. Mark a tooltip only where the number feeds a decision. Leave tooltips on lists (prices, stocks) to a single tip per row or column header.
2. A short open delay and a quieter underline.
3. In the playtest log, count tooltip opens per screen (78 already logs controls).

## 13. AI stupidity: **Low-medium**

**What players say.**
- Bannerlord: armies "wander between settlements rather than attacking", and the AI seemed "lobotomized" to stop snowballing ([Steam](https://steamcommunity.com/app/261550/discussions/0/4783413655228866890)). New kingdoms see war declared on them by most of the map ([Steam](https://steamcommunity.com/app/261550/discussions/0/3198117312273853876/?l=latam)).
- CK3: the AI never fabricates claims and rarely rejects a finished seduction ([Steam](https://steamcommunity.com/app/1158310/discussions/0/4629232489537310885)). Paradox made ruthless AI opt-in, through the "Conqueror" trait ([SI](https://videogames.si.com/news/crusader-kings-3-conqueror-npc-trait)).

**Ardan today.**
- **Done.**
  - 20-ai-personality makes ruler traits drive war, alliances, peace and tribute. Warlike rulers declare about 2.4 times as many wars as peaceful ones (pooled over 12 worlds).
  - Every AI decision is logged with its reasons, and the AI card's reasons add up.
  - 68 makes every war name its reason, and grudges wait for the right moment.
  - AI debt is repaid (8.27 million suns), and a crown sunk in interest repudiates its debts.
  - 38-orders gives generals a temper. 39-schemes and 21 give NPCs plots and moves against you (9.7 moves a decade).
- **Not measured:** whether the AI *looks* foolish to a player. The audit has never looked for idle armies, wars declared at bad odds, or allies who never come.

**Fix.**
1. A bot audit of "AI blunders" per 100 years, run nightly with the league: wars declared at under 30% expected strength, armies idle while at war, treasuries left unspent with debts unpaid.
2. Show one line of a rival ruler's reasoning in the war news ("Drevna attacks: an old grudge, and your army is in the south").

## 14. Text walls: **Low**

**What players say.**
- "Long texts tire people's eyes and prevent them from reading"; break them into short steps ([itch.io](https://itch.io/post/3131177)).
- Battle Brothers players say "you quickly train yourself to ignore the flavor text" ([RPG Codex](https://rpgcodex.net/article.php?id=10629)). Victoria 3's information sits under "layers of text" ([eXputer](https://exputer.com/reviews/victoria-3/)).

**Ardan today.**
- **Scenes are short.** Over 2,240 scenes the rendered text had a median of 49 words, a p90 of 66, a p99 of 78 and a maximum of 80. None was over the 80-word diet the linter enforces. An event sheet holds 56 to 86 words with its choices.
- **The walls are whole screens:**
  - the Life tab shows about 960 to 1,080 words;
  - the Codex about 2,000;
  - Holdings 1,250 to 1,400.

**Fix.** Keep the diet. Treat screen density as part of 1. If the playtest log's read times show events read in under 3 s, the choices are too plain, not the text too long.

## 15. RNG feeling unfair: **Low**

**What players say.**
- Battle Brothers: a Steam thread titled "RNG of this game is rigged" ([Steam](https://steamcommunity.com/app/365360/discussions/0/3002172678252225663/?ctp=4)). Players call the RNG "unbalanced, rigged, and poorly implemented" ([Vaporlens](https://vaporlens.app/app/365360/battle_brothers)), and some events "punish you simply for bad rng" ([GOG](https://www.gog.com/en/game/battle_brothers?page=43)).
- RimWorld's own wiki warns that Randy "will sometimes send extremely difficult or unfair groups of events" ([RimWorld Wiki](https://rimworldwiki.com/wiki/AI_storytellers)).
- Darkest Dungeon: "3 heroes getting diseased, critted, and ultimately slowed in one turn" ([Steam](https://steamcommunity.com/app/262060/discussions/0/5251727781302807127)).

**Ardan today.**
- **The odds are honest.**
  - 24-honest-odds fits the duel odds shown on screen to 2,100 real duels (largest gap 2 points).
  - 75-fair-checks fits a scene's odds to the stage of life.
  - 81 puts all six stats on one scale for checks.
  - Checks are won 51.6% of the time (scorecard) to 58% (81's league), inside the 45 to 65% band.
  - 23-after-action names a battle's three biggest causes.
- **The roll is invisible.** After a check the player sees only the result text, never "needed 49, rolled 61". Nothing softens a run of bad luck, so three failures in a row at 60% (6% of the time) read as rigged.

**Fix.**
1. Show the roll in the result line (or its tooltip).
2. On Story, a gentle pity rule: after two failed checks in a row at 50% or better, the next is +10.

## 16. Slow early game: **Low** (fixed)

**What players say.**
- Bannerlord: slow levelling is "the game's biggest problem" ([Goonhammer](https://goonhammer.com/video-game-review-mount-and-blade-ii-bannerlord)). The early game is tedious when your party is too slow to catch anything ([Steam](https://steamcommunity.com/app/261550/discussions/0/2968397584554821610)).
- Kenshi's opening is punishing by design, and its developer says so ([Select Button](https://selectbutton.com/reviews/kenshi-early-access-review)).

**Ardan today.**
- **Before 82**, a newborn waited 400 to 1,500 game days, 2 to 6 minutes of real time, for a first event.
- **82-early-years** runs the clock ×10 under 5, ×3 to age 10 and ×1.5 to 15. The first stop now comes in 9 to 26 s.
- **81-pacing** draws a quiet scene after 3 to 5 empty months.
- **The probe** read 6.0 to 6.8 prompts a game year in every life (target 6). Before 81, childhood had 2.3.
- **Left over:** childhood is about a quarter of a 60-year life, with little control. Whether players aged 13 to 23 enjoy it is for the playtest to show.

**Fix.** Put "Start at 16" on the create screen as a plain option beside "From birth". The engine already takes `startAge`. Watch for stalls in the playtest log.

## 17. Grind: **Low**

**What players say.**
- Life is Feudal, scored 30/100: "the absolute worst kind of grind", where every action is a menu and a loading bar ([bit-tech](https://bit-tech.net/reviews/gaming/life-is-feudal-review/2/)).
- Fallen London "never stopped being grindy" ([MetaFilter](https://www.metafilter.com/159501/Welcome-Delicious-friend)). Its wiki calls one goal "a fairly intense grind" ([Fallen London Wiki](https://fallenlondon.wiki/wiki/Advancing_the_Liberation_of_Night_(Guide))).
- Battle Brothers: "just grinding for XP, items and money over and over and over again" ([GOG](https://www.gog.com/en/game/battle_brothers?page=31)).

**Ardan today.**
- **Time does most of the work.** A training plan grows every day. 31-learn-by-doing teaches more by use than by drilling. What now offers the next action.
- **Possible spots:**
  - The market's "+1 / +5" buttons make cart trading click-heavy, at one good at a time.
  - `reports/dominance.json` (Oct 15, 6 lives × 30 years) flagged `learn_lang` as a dominant whole-life strategy. It also put "run" at 135,099 coin against a median of 19,377.
  - That report predates about 20 features, and its own flag says it should be re-checked.

**Fix.**
1. Re-run `bench/dominance.mjs` on the current build. Its nightly run already exists; read its artifact.
2. A "fill the cart" control.

## 18. Economy exploits: **Low**

**What players say.**
- Bannerlord smithing: a sword "costing about 1,163 denars in materials sold for about 13,263", and gifting weapons to family parties for 130k a day ([Steam](https://steamcommunity.com/app/261550/discussions/0/3803904729134348703), [Steam](https://steamcommunity.com/app/261550/discussions/0/3112521013652055041)).
- CK3: "there's way too much gold floating around"; a modder measured 123% more late-game gold in circulation ([Steam](https://steamcommunity.com/app/1158310/discussions/0/3812911758584020824), [Steam workshop](https://steamcommunity.com/workshop/filedetails/discussion/2222896774/2943622078753275443)).

**Ardan today.**
- **Exploits are hunted.**
  - The best buy-then-sell-back loop went from 293 suns to 0.
  - The median price spread across markets is 2.2×.
  - A famine with closed roads triples bread (×3.16).
  - The best trade loop no longer beats a farm (45).
  - Exploit and dominance hunts run nightly.
- **What is left** is the late pile-up of wealth in 3, which is the same complaint as CK3's.

**Fix.** Sinks with stakes (see 3). Add a "peak coin ÷ largest purchase available" metric to the league.

---

## The top 20 fixes, in order

Ranked by how many new players each would reach, times its severity, divided by the cost to build it.

1. **Stop scene repeats from the side doors.**
   - Give one-off stories a lifetime cap: `fl_st_master` (6 to 11 times a life) and `du_ch_confession` (12).
   - Life-long recency for duty, flow and gathering pools.
   - A scorecard metric, "scenes already seen this life", at 15% or less (today 37.5%, and 52% after 35).
2. **Make What now's dead suggestions work.** "Choose what to train" and "Spend your initiative" do nothing on the Life tab. It is a one-line fix to the card a lost player is sent to.
3. **Fix the hint calendar bug.** Tie hints to life stage, not to `year < 1115`, so the adult hints show in a life started at birth.
4. **Collapse the Life tab and compact the profile.** No tab body over 2 screens at 1366×768 (today Life is 4.7), with What now always in sight.
5. **Split Holdings into sub-tabs.** It is 8 screens on desktop and 13 on a phone, with 236 to 246 controls.
6. **Protect the first life's childhood**, or start the first life on Story. Today 1 newborn in 20 dies before 5 on Hard, the default.
7. **A chosen ambition** at 16 and at 35, shown with its next step. It also brings back `C.ambition` and the 5 events that cannot fire.
8. **Give every disabled control a reason** or hide it (57 of 91 on Holdings have none, and so does "Ask to join"). Put `tools/deadclicks.mjs` in `tools/check.mjs`.
9. **Show costs and stakes on choices.** A cost chip from `fx` and `req`, and an "if it fails" line from `lose.fx`.
10. **Run the five-player playtest** (`docs/plan/Playtest kit.md`) once 1 to 4 are in. Every UI severity above is a guess until someone has played.
11. **Big sinks with stakes for rich lives** (a title, a claimant, a foundation), each opening an arc. Fortunes reach 100,000 to 600,000 against a top purchase of 3,500.
12. **Ask `persist()` on the first autosave, and show "Saved · 1 min ago".**
13. **Start late-life arcs when they become possible**, plus a "nothing new for 2 years" detector that queues something new.
14. **Encode saves in a worker.** The yearly autosave blocks the page for 205 to 391 ms.
15. **Cache the World tab** (304 to 567 ms a draw), and gate tab draws at 100 ms under 4× CPU throttling.
16. **Three named life slots, and an export reminder** every ten game years.
17. **Show the roll after a check** ("needed 49, rolled 61"), with an optional bad-luck softener on Story.
18. **Move "⚑ Report" out of the first slot** in the phone event sheet, and test on a real iPhone and a cheap Android.
19. **Thin the tooltip targets on dense screens** (Holdings has 300): one tip per header for list columns, and a short open delay. Re-run the dominance hunt on the current build (the last report, from Oct 15, flagged `learn_lang`).
20. **A nightly "AI blunders" audit** (idle armies at war, wars declared at bad odds, unspent treasuries with debts), plus one line of a rival's reasoning in the war news.

## Not applicable to Ardan

BitLife's most frequent complaints are ads after a no-ads purchase and paywalled features ([ComplaintsBoard](https://www.complaintsboard.com/bitlife-life-simulator-b150146), [TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/BitLife)). Ardan has neither. It should stay that way: for a 13-to-23 audience, monetisation complaints swamp everything else in that game's reviews.
