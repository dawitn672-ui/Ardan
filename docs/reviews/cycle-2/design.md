# Cycle 2 review: the game as a game (reviewer "design")

**Angle.** Would a creative player of 13 to 23 pick Ardan up, keep playing and tell friends about it? The owner wants four things: less scrolling (expanders), every button working, top-down clarity, and a polished look that leans anime. This review judges both halves of cycle 1:
- which findings from the cycle 1 design and first-hour reviews are now fixed, partly fixed or still open;
- how the new layers read to a new player.

**How this was made.**
- **Build:** `index.html` at commit 89dfb45, copied to `/tmp/ardan/cycle2/design/index.html`. No repo file was changed except this one.
- **Played through the real UI** with Playwright (`/tmp/ardan/cycle2/design/js/player.cjs`). The script steps with the primary stepper button, picks a different choice each time, closes results and dismisses hints. Each life's scene log is `<name>-log.txt`.
  - **n1:** "Be born" at 1366×768. 24 steps, from birth to age 5, 12 scenes (`n1-log.txt`). A first newborn run of 6 steps was overwritten. Its scenes are quoted in B2 and B4 below.
  - **p16:** "Start at 16" at 390×844 with touch. 22 months, 17 scenes (`p16-log.txt`).
  - **st:** the story start "What Took Your Father" at 1366×768. 20 months, 17 scenes (`st-log.txt`).
  - **ru:** a ruler, the Emperor of Aldmark at 26. 10 months (`ru-log.txt`).
  - **so:** a soldier, 22, enlisted in a war. 10 months, four line battles (`so-log.txt`).
  - **Week test:** 16 Week steps in a row as a 20-year-old (`js/week.cjs`).
- **The new layers, one by one** (`js/tour.cjs`, `js/pol.cjs`, `js/death.cjs`): the help modal, Story / Map with zoom, Places, the arms designer, the road modal, a share card (saved as a PNG), the Politics view, the War Room, the death screen with "Keep this life", and the Hall shelf on the title.
- **Every button:** a copy of `tools/deadclicks.mjs` with ten more screens (`js/dc2.mjs`). The extra screens are Story/Map, Places, arms, share, the road, the ruler's Politics, a noble's politics, the soldier's War tab and the War Room. It ran 21 screens and listed 2,348 controls. It clicked the first 70 enabled controls of each screen, each from a fresh state (`dc2.txt`, `dc2.json`).
- **Scroll length:** every tab, for a peasant of 25, a noble of 30, a ruler and a soldier, at 1366×768 and 390×844 (`js/screens.cjs` → `screens-desk.txt`, `screens-phone.txt`).
- **Screenshots** are in `/tmp/ardan/cycle2/design/s/`, written `s/…` below.
- **Load:** the machine was shared with three other reviewers. Load averaged about 9 on 4 cores, so the step timings below are pessimistic.

**The verdict in one paragraph.** Cycle 1 moved Ardan from a deep simulation with a web-app skin to something that plays like a game in its first ten minutes:
- the start is one screen;
- a newborn grows a season at a time;
- the Life tab fits on one screen;
- the scene card is handsome;
- the Story / Map toggle and the War Room look like a strategy game a teenager would screenshot;
- the dead-click scan found one dead button in 2,348 controls, against five last cycle;
- no page errors in any run.

What now holds it back is not missing systems. It is coherence and stakes:
- the same unit has four names on four screens;
- people share names with their mothers and with each other;
- infants still get siege choices;
- the emperor's door is knocked on for the hearth tax;
- the Week step is empty 13 times in 16;
- a story start goes silent for five years;
- the deep new screens (Politics, the road) are long walls of buttons that never say what a choice will do.

The next cycle should make what exists **legible and consistent** before it adds systems. Of the backtests' remaining list, readable stakes and the ring of advisors do that most directly.

---

## Ranked summary

Ranked by impact for effort (impact ÷ size, where S = 1, M = 2, L = 4). Ties go to what a new player meets first.

| # | Item | Kind | Size | Impact |
|---|---|---|---|---|
| 1 | Your unit has four different names on four screens (War tab, War Room, battle, the oath line) | Bug | S–M | 5 |
| 2 | Choices that hide their stakes: battle moves, bills, oaths, the road | Finding | S | 5 |
| 3 | People share names: two suitors both "Beatrix", who is also your mother; a new boy named like you; father and son both Kettil | Bug | S | 4 |
| 4 | Forced siege scenes still reach infants: "Go out with the night sortie" at age 0 | Bug | S | 4 |
| 5 | The Politics view opens on the Build list; politics starts 1.8 screens down, with no folds | Bug | S | 4 |
| 6 | The phone top bar overlaps: date, initiative and purse print over each other | Bug | S | 4 |
| 7 | The Week step is hollow: 13 of 16 weeks "Nothing new in your story" | Finding | M | 4 |
| 8 | Card pile-up on day one: three or four cards before the first step (ambition, chapter, pup, tax) | Finding | S | 4 |
| 9 | A story start goes silent: the first callback is at least five years away | Finding | S–M | 4 |
| 10 | Realm customs and peasant scenes reach rulers: the Emperor gets "The hearth mark" | Bug | S | 3 |
| 11 | The road modal: 170 destinations, 3.1 screens on desktop and 10.9 on a phone; the chosen mode's label can't be read | Bug + finding | S–M | 3 |
| 12 | Inner voices repeat and miss: "CALLUSES: Look at his hands." five times in 20 months, under scenes with no hands | Finding | S | 3 |
| 13 | Season and place still wrong: "The summer flux" on 2 January, Harvest Home in February | Bug | S | 3 |
| 14 | Coach marks are fixed in wording, but still sit over the Story / Map toggle | Bug | S | 2 |
| 15 | Long tabs with no folds: Codex 6.8 screens, Dynasty 5.0 (7.2 on a phone), Holdings 7.0 on a phone, ruler's Decisions 5.4 | Finding | S | 3 |
| 16 | The death screen still draws the paper doll; the share card labels the scene's subject with your name | Bug | S | 3 |
| 17 | Chapter cards read as one more event, not a title card | Finding | S | 3 |
| 18 | Copy bugs: "Keep the a clay marble", "nephew or niece", "Arecruiting", the skip button's clipped "Nex", "There are no quest lists in Ardan" | Bug | S | 2 |
| 19 | "Pick a story" is the one dead button | Bug | S | 2 |

Then the backtests' remaining list, ranked for this game now (section C), and four better picks (section D).

---

## A. Bugs

### A1. One unit, four names (S–M, impact 5)

**What I saw.** The soldier (seed 80, a peasant of 22 enlisted in the War of Carrness) sees four different units at once:

| Where | What it says | Shot |
|---|---|---|
| Story, the oath line | "Soldier among the heavy infantry of the Second Goldburg Bows" | `s/D-soldier-pathwar-war.png` |
| War tab, "Your place in the army" | 1st Aldmark Line → 2nd Heavy infantry Battalion (Senior Captain Dunstan) → C Company 198 (Captain Merrick of Briarbrook) → 1st Squad (Sergeant Ivo) | `s/D-soldier-pathwar-war.png` |
| War Room, "You serve in" | 2nd Company, 1st Kingsmere Foot · Captain Garth of Kingsmere · senior captain Ingrid of Northmoor · Serjeant Beatrix Shepherd | `s/TD-soldier.png` |
| The line battle, "Your section" | 2nd Company, 1st Goldburg Lances: Captain Kettil Smith, Serjeant Corbin. "Yours is the 6th Aldmark Horse: 2,630 men." | `s/so-ev14.png`, `s/so-ev15.png` |

- One battle panel names your company as Lances and your regiment as Horse.
- The Kettil who is your captain is also a messmate "beside you".
- "Sergeant" and "Serjeant" are both used.

**Why it matters.** "War to the last unit" is the owner's ask, and 9997 built it. A teenager who reads three names for their own company stops believing any of them. Coherence is the whole value of detail.

**Fix.**
- **9997-companies owns the truth.** The War tab's order of battle (release / 37-squad), the oath line (release enlist text) and the line battle's section panel (72-two-scales / 37-squad) should all read `CO.coName`, `CO.bnName` and the captain from `CO.fromSeed`.
- Add a test, `coOneName`: the four strings agree for the player's unit.
- Pick one spelling of serjeant.

### A2. Names collide (S, impact 4)

**What I saw.**
- **st:** your mother is "Beatrix of Saltbridge". At "The last dance at Harvest Home" (`lf_harvest_dance`), both partners are "Beatrix" ("Dance with Beatrix / Dance with Beatrix"). The second is "the reeve's handsome nephew or niece", a token left unresolved (`st-log.txt`, Feb 1106).
- **n1:** in "A new face" there is "a new boy, Emeric", and you are Emeric. "Leave him alone" reads "Someone else befriends Emeric" (`n1-log.txt`, Oct 1109; `s/n1-ev15.png`).
- **Screens peasant:** the father is Kettil and the brother is "Kettil (28)" (`s/D-peasant-chronicle-world.png`).
- **p16:** sister Audra (20), then the teacher is also Audra ("Audra sets you one last task").
- In cycle 1 a newborn Kyipa had a mother Kyipa. The pattern is still there.

**Why it matters.** This is the bug players screenshot to mock a game. It also breaks choices: two buttons with the same label.

**Fix.**
- **One helper** in 97-life-fixes or 02-content-fixes: `A.freshName(p, cult, sex)` re-picks a given name that matches the player, their parents, their siblings, their spouse or anyone else in the same scene's `ctx`. Wrap the name maker that `mk()` and the peer and suitor setups use.
- **`lf_harvest_dance`:** pick `bd` by the person's sex ("nephew" or "niece").
- **A lint rule:** two choices of one event must not render the same label.

### A3. Forced siege scenes reach infants (S, impact 4)

**What I saw.**
- **The first newborn run** (overwritten; quoted from its log). On 2 February 1105, at age 0, "Behind the walls of Frosthollow Castle" offered:
  - "Go out with the night sortie" (Stealth, 22%);
  - "Buy smuggled flour, 25 suns";
  - "Speak in the square for terms".
- On 27 February came "They come over the walls", with "Stand in your doorway and stare them down".
- The baby failed "Hide" and lost 15 suns of the family purse.

**Cause.** Cycle 1 changed `cond` in `features/36-sieges/sieges.events.js` to `C.teen(p) || C.adult(p)`. But `sieges.core.js:74` and `:90` queue `sg_walls`, `sg_sacked` and `sg_terms` with `forced: true`, and `A.stillValid` skips `cond` for a forced item (`if(e.cond&&!q.forced)`). So the cycle 1 fix (first-hour B2) never applies to these three.

**Fix (36-sieges).**
- Gate the queue itself: `if (A.stage(pc) !== 'infant' && A.stage(pc) !== 'child')`.
- For a young child, queue a child's version: "The bread is short; your mother gives you her share."
- Add a test that a besieged newborn gets no `sg_` adult choice.

### A4. Politics opens on Build (S, impact 4)

**What I saw.**
- A ruler presses Realm, then **Politics** (now the first button, as 9996 intended; `s/D-ruler-realm-realm.png` shows State selected before the click).
- The view keeps the **Build** list at the top: twenty provinces, then "Drain fields & mills… Build (~3,000)".
- "The Crown" begins at 1,181 px, below the fold of a 655 px panel (`js/pol.cjs` output; `s/TD-ruler.png`, `s/D-pol-a.png`).
- The whole view is 3,309 px, **5.1 screens**, and 5.7 on a phone. It has no folds.
- The great lords' rows repeat "tax High − + · levy High − +" eight times with no words. "Grant: a seat on the council" sits beside "Already High.", which reads as the reason for the seat (`s/D-pol-c.png`).

**Fix (9996-polity `e-view.core.js`).**
- When `UI.realmView === 'pol'`, drop the Build block (it belongs to State or Build).
- Fold every `po-cap` section, using 90-fold, with a one-line summary in each header:
  - "The bill: none before the realm · bring one (1⧗)";
  - "The council: 5 seats, 2 tasks set";
  - "Factions: 1, Liberty at 34% of its demand".
- Open The Crown and The Bill by default.
- Put the oath buttons' reason under the row it belongs to.

### A5. The phone top bar overlaps (S, impact 4)

**What I saw.**
- "2 November 1106 ⧗ 7.023 suns owes 38": the initiative's "7.0" and "23 suns" print on top of each other, and the date's last digit is cut (`s/crop-phone-topbar.png`, `s/p16-99-end.png`, `s/p16-step12.png`).
- Without a debt it still clips: "age 1(" under "7.0 10 suns" (`s/TP-storymap.png`).

**Fix (84-top-bar / 71-phone).**
- On `#game.phone`, give the date, initiative and purse a `flex: 0 1 auto; min-width: 0`, with an ellipsis on the date.
- Show "owes" as a red dot with its amount in the purse's tooltip.
- Extend `tbFits` to 390 px with a debt.

### A6. Realm customs reach the emperor (S, impact 3)

**What I saw.** On 2 January the Emperor of Aldmark gets "The hearth mark":
- "in your village the reeve walks from hald to hald… Yours is the third door he knocks on";
- with "Pay the mark / Bar the door and say you are out";
- and the inner voice "THE CAPTAIN: Bread first, then glory".

The Book then says "He writes your name twice. In spring his men take a pig for it" (`ru-log.txt`, `s/ru-99-end.png`).

**Cause.** `features/47-realm-bible/bible.core.js:43`: `free: pc => A.isAdult(pc) && !unfree(pc)`. Nobles and rulers count as "free".

**Fix (47-realm-bible).**
- Add a `commons` audience (free, not noble, not ruler), and move hearth, tithe and levy customs to it.
- Give rulers the other side: "The hearth mark comes in: 9,500,000 souls, one mark a roof".

### A7. The road modal (S–M, impact 3)

**What I saw.**
- "Travel or move away" (9990) lists 18 nearby places and every capital: 170 buttons, 2,281 px (3.1 screens) on desktop and **9,208 px (10.9 screens)** on a phone (`tour-phone.txt`).
- The selected mode, "Go and come back", is gold text on a gold button and can't be read (`s/TD-travel-go.png`).
- With 10 suns, every destination is clickable. A click answers in a toast in the far corner: "The road there and back costs about 11 suns", then "You think about the road."

**Fix (9990-journeys).**
- Fold "Capitals and far realms" closed by default, with a count.
- Grey out unaffordable rows with the reason on the row ("11 suns; you have 10").
- Use the selected-button token from 91-look for `jr-mode`.
- Best of all, let a click on a place in the Story / Map open "Go there" (see D3).

### A8. Season and place (S, impact 3)

**What I saw.**
- "The summer flux" ("In the hot months, you take the flux") fired on **2 January** (first n1 run).
- "The last dance at Harvest Home" fired in **February** (`st-log.txt`).
- Cycle 1 already reported "The spring crawl" on 2 January (first-hour B6).

**Fix.** Gate seasonal scenes on `A.S.month`. A small lint rule in `tools/` (a proposal; not this reviewer's folder) would flag event text with summer, harvest, spring or winter and no month in `cond`. Owners: 02-content-fixes for the release scenes, 97-life-fixes for `lf_*`.

### A9. The death screen and the share card (S, impact 3)

**What I saw.**
- The death screen still draws the old full-body paper doll in a frame, while every other screen draws 93's bust (`s/D-death.png`). This is cycle 1's bug, still open.
- The share card is handsome and saves as a real 1080×1350 PNG (`s/D-share-card.png`). But it labels the scene's subject (Oddny, the dance partner) "WULFRIC, 25": your name beside her face.
- The interior print for a village dance is a kitchen with a fish.
- After "Save the picture" and Back, the toast "Picture saved (618 KB)" follows the player onto the title screen.

**Fix.**
- 93-anime-portraits: route the obituary portrait through the bust.
- 9994-share: when the bust is the subject, print the subject's name, with yours in the epitaph line.

### A10. Copy and small UI bugs (S, impact 2)

- **"A small grave"** (release content): "Keep the a clay marble" and "Aldred's a clay marble". `ctx.toy` carries its article. 02-content-fixes: strip the article for `{toy}` in labels, or store `toyBare`.
- **Drop caps still split words** in `innerText`: "Arecruiting sergeant", "Amonk", "Aman", "6suns is gone" (`p16-log.txt`, `st-log.txt`). This is first-hour B8, still open (92-scene-card).
- **While a scene is open,** the skip button shows a clipped gold "Nex" next to "Go on" (`s/crop-topbar-event.png`). Two "go" controls, one cut off (84-top-bar `step.core.js`).
- **Decisions still opens with** "There are no quest lists in Ardan", above a game that now has chapter aims and an ambition (`s/D-ruler-life-goals.png`; 97-life-fixes or 9993).
- **The People tab** files a private soldier's messmates under "Under you" (`s/D-soldier-people-people.png`). The superior's want is cut off: "Wants to cross the Gordush on 2 May." (998-people-want).
- **The newborn carries the quirk "Old childhood scar: a fall you do not remember"**, and 93 draws it as a red slash across the baby's face (`s/n1-born.png`). Don't roll that quirk for a start age under 3 (release data; 02-content-fixes).
- **Step dates still land on the 2nd** ("2 February", "2 March"). First-hour B8, still open.

### A11. The one dead button (S, impact 2)

**What I saw.** On the quick start, "Pick a story" does nothing, because the three story cards are already open under it (`dc2.txt`: `DEAD create button data-a=crQuick v=story`).

**Fix (29-starts).** Make it open all 20 ("Show all 20 stories") and scroll to them. Or drop it and let the three cards plus "Show all" carry the choice.

---

## B. Findings: what cycle 1 fixed, and how the new layers read

### B1. Status of cycle 1's design review

| # | Cycle 1 item | Now | Evidence |
|---|---|---|---|
| 1 | Hall of Lives | **Fixed.** The death screen says "New: Unremembered (1 of 22 endings)". The title has "Your lives" with counts and the stories still shut. | `s/D-death.png`, `s/D-title-hall.png` |
| 2 | Coming up | **Fixed.** Full initiative, customs, feasts and the ambition show. It mostly shows feast days; for a child it never says initiative is full. | `s/st-99-end.png`, `s/n1-99-end.png` |
| 3 | Start stories up front | **Fixed.** One quick screen: Lands, Be born / Start at 16 / Pick a story, three story cards, difficulty. The cards have no picture. | `s/d-create0.png` |
| 4 | Share cards | **Fixed** (see A9) | `s/D-share-card.png` |
| 5 | Explore reads the land | Built (997). Not judged this cycle. | — |
| 6 | Map as a first-class surface | **Fixed.** Story / Map in the centre column, inked, veiled, zoomable. The World tab's map is now a duplicate three levels down. | `s/TD-storymap.png` |
| 7 | Inner voices | **Partly.** They speak, but repeat and miss (B5) | `st-log.txt` |
| 8 | People show what they want | **Partly.** The superior shows a want. Messmates still show a tier chip, which is right for soldiers. | `s/D-soldier-people-people.png` |
| 9 | Early years step faster | **Fixed.** A newborn steps by Season, then "Until something happens". Birth to 5 took 24 presses with 12 scenes (cycle 1: 16 presses for the first scene). | `n1-log.txt` |
| 10 | Confidants | Built (999). Not met in 20 months of play. | — |
| 11 | Atlas | **Fixed.** "seen 7 of 1,992 places", heard-of, unknown | `s/TD-storymap-zoom.png` |
| 12 | Chapter cards | **Built, reads weakly** (B6) | `s/n1-ev07.png` |
| 13 | Weekly challenge | **Open.** No "This week" on the title. | `s/D-title-hall.png` |
| 14 | Make your mark | **Fixed.** 8 tinctures, 12 divisions, 54 charges, motto; 1.5 screens (2.3 on a phone) | `s/TD-arms-pick.png` |
| 15 | A peer circle in youth | **Partly.** "A new face" makes a peer, but with your own name (A2). | `n1-log.txt` |
| 16 | Activities grouped, few first | **Partly.** A child sees "Six to start with. The rest are here when you want them". A 16-year-old sees 29 or 30 tiles at once, on desktop and phone. | `s/n1-99-end.png`, `s/TD-storymap.png`, `s/TP-storymap.png` |
| 17 | Journeys | **Built.** Real days and costs; the modal is a wall (A7). | `s/TD-travel-go.png` |
| 18 | Web of people | **Open** | — |
| 19 | Thoughts | **Built.** "You turn a thought over: 'The lord's barn is always full'" | `js/week.cjs` output |
| 20 | Dynasty legacies | Built (9993). Not reached. | — |
| 21 | Far Lands in their own words | **Partly.** Varinj reads well ("every family is named for the underground channel it keeps"). Westland scenes still speak of "the village priest" and "the church crypt" in plain Aldmark lives, which is correct there. | `tour-desk.txt` |
| bug | Endings reset | **Fixed** (Hall) | — |
| bug | Same-name kin | **Open, and wider** (A2) | — |
| bug | Title pitches the old world | **Fixed.** "152 realms and 1,992 provinces" | `s/d-title.png` |
| bug | Death and creation portraits | **Partly.** Creation was not checked; death is still the doll (A9). | `s/D-death.png` |

### B2. Status of cycle 1's first-hour review

| # | Item | Now |
|---|---|---|
| B1 | Coach marks teach the old clock and cover their target | **Partly.** The wording is right: "Press Season (M) to live a season… or Month (W)". On the phone it no longer mentions number keys. The clock hint still covers the Story / Map toggle at 1366 (`s/n1-born.png`, `s/hint-plan.png`). The keys swap by age: for a child M is Season and W is Month, and for an adult M is Month and W is Week. |
| B2 | Adult events reach infants | **Partly.** `cond` was fixed, but forced siege items bypass it (A3). |
| B3 | Title describes the old world | **Fixed** |
| B4 | How to play is a 998-word wall | **Fixed.** It opens with "Your first hour" (122 words visible), the rest folded by subject (`s/TD-help.png`). |
| B5 | Known World silently drops the realm | **Fixed.** Lands is now the first choice. |
| B6 | Seasons and places wrong | **Open** (A8) |
| B7 | Sticky hover on the phone | Not re-checked |
| B8 | Copy bugs | **Partly.** "Costs 1 sun" is fixed. Drop caps and the 2nd-of-month are open (A10). |
| I1 | Newborn: 16 empty Months | **Fixed** (see 9 above) |
| I2 | The Week step is hollow | **Open** (B4) |
| I3 | Creation is 12,500 px on a phone | **Fixed.** One screen. |
| I4 | Phone opens on an empty Now | **Fixed.** It opens on Story (`s/p16-00-start.png`). But Story does not follow the newest line: after 22 months it still shows the 1105 birth text at the top (`s/p16-99-end.png`; the same on desktop in `s/st-99-end.png`). |
| I5 | 31 activities on day one | **Partly** (see 16 above) |
| I6 | Week one punishes hard | **Partly.** No beast hunt in week one, but the infant siege (A3), and most first-year checks are long shots: 10 of the 12 check choices in `p16-log.txt` were "RISKY" or "LONG ODDS", at 20 to 47%. |
| I7 | The ambition looks like any event | **Open, and now doubled** (B3) |
| I8 | Single-choice cards, three clicks per scene | **Open.** "The Summit of Kingsmere" offers only "Very well" (`so-log.txt`). Every scene is still choose, Continue, step. |
| I9 | Unexplained words | **Partly.** "Untrained · 36", "× 2" and "full" are still on screen for a first-hour player. |
| I10 | Echo lines read as non-sequiturs | **Open.** "A widow still lays a place at table for a son who went to the Iron War in 1105", under a herd-master asking a favour (`st-log.txt`, Mar 1106). |

### B3. Day one stacks the cards (S, impact 4)

**What I saw.** Before the first step is over, a 16-year-old meets three or four cards in a row on 2 January:
- **p16:** "The hearth mark", "What you want" (the lifelong ambition), then "Chapter One: The Years of Smoke" (three aims). That is two goal systems back to back.
- **st:** the story's own scene, then "Three nights for a guest", "What you want", "Chapter One: Mending and Making Do", and "A pup at the door" (name the dog). Five cards before the second step.

**Why it matters.** The first minute is the advert. Two goal-setting cards in a row, both asking "what do you want", feel like a form. Reigns gives one card; Hades gives one goal.

**Fix (9993-chapters with 97-life-fixes, 9992-identity).**
- On the first chapter of a life, fold the ambition question into the chapter card: "Chapter One: The Years of Smoke. What do you want from your life?" The ambition's four answers become the card's choices, and the three aims follow from it.
- Hold the pup and naming scenes (`ix_pup`) back for the first 2 months. 81-pacing's first-hour guard is the place for it.
- Hold the realm custom to its second year, or show it as a Coming up line in year one.

### B4. The Week step is hollow (M, impact 4)

**What I saw.**
- Sixteen Week presses as a 20-year-old on the Great Continent brought 5 scenes in 3 of the 16 weeks.
- 11 weeks ended "Nothing new in your story: the days went by as days do" (`js/week.cjs` output).
- As a child, 6 of 9 Month steps ended the same way (`n1-log.txt`, 1110).

**Why it matters.** The owner's rhythm is "a week or a month at a time". Thirteen empty weeks teach the player that Week is a waste, and the step note's stock line says so in words.

**Fix (84-top-bar `step.core.js`, 81-pacing).**
- Draw a quarter of the month's event chance at each week's end (cycle 1's I2; the same expected count).
- Or drop Week from the stepper outside war, travel and sieges, where days matter.
- Retire the stock line. Say one true thing about the week from state the game already keeps:
  - what training moved ("Survival +0.4");
  - who you saw (999 and 55 ledger entries);
  - what Coming up moved nearer ("Lantern Night in 9 days").

### B5. Inner voices repeat and miss (S, impact 3)

**What I saw.** Across 20 months of st:
- "CALLUSES: Look at his hands." came 5 times, under an invitation, the blight, the tide crossing, a favour and a theft. Most of those scenes have no "him".
- The soldier heard "FIELDCRAFT: Smoke in the air, wet wood." 4 times and "The birds went quiet a moment ago." 3 times.
- The emperor's hearth mark drew "THE CAPTAIN: Bread first, then glory."
- In `innerText` the voice name runs into its line ("CALLUSESLook"), so a screen reader reads one word.

**Why it matters.** Disco Elysium's voices work because each line fits the moment. A line that repeats becomes noise, and players learn to skip the box.

**Fix (9992-identity `inner-voice`).**
- A line at most once per life, as cycle 1's proposal said.
- Draw lines by the event's tags, and say nothing when no tag fits.
- Add a visually hidden ": " after the voice name.

### B6. Chapter cards read as one more event (S, impact 3)

**What I saw.** "Chapter One: The Hungry Years" (age 4, `s/n1-ev07.png`) is the scene card with an interior print:
- "For this chapter of your life you mean to: Learn your letters; make a true friend; and either grow in faith: piety 42 or bring farming & herding to 8";
- the choices are "The third aim: Grow in faith: piety 42" and "Rather: Bring Farming & herding to 8".

The result lines then sit in the Book as "So it is written at the head of the chapter. The rest is yours to write." in every life (`s/D-ruler-realm-realm.png`, `s/D-soldier-pathwar-war.png`).

**Why it matters.** Pentiment's act cards and Persona's calendar days are moments. This one is a form with numbers in it. The right panel's chapter line ("Chapter One · Lean Years · 0 of 3 · Next: Learn your letters") is good. The card is the weak part.

**Fix (9993-chapters).**
- Give the card its own frame: the title large and centred, the years, a woodblock sky (94) for the stage, and the aims as a ticked list.
- Word aims in the world's terms: "Be known at the shrine" rather than "piety 42".
- Write the Book line once per life, not per chapter.

### B7. A story start goes silent (S–M, impact 4)

**What I saw.** "What Took Your Father" opens well: "Go up the fells and look for its sign… You find the place, and the tracks, and the size of them. It was not wolves." Then nothing about it came in 20 months. The only callback, `st_what_took_echo`, needs `story(p, 'what_took', 5)`: five years. The card says "a hunter's child", but the life starts as a herdsman.

**Why it matters.** A story start is a promise of a story. A teenager who picked "what took my father" wants the second beat within the session. Five years is about 60 Month presses.

**Fix (29-starts).**
- Give each of the 23 stories (20 plus the Hall's 3) a second beat at 2 to 6 months.
- Show it in Coming up: "Spring: the tracks on the fells again".
- Match the start job to the blurb.

### B8. Long tabs with no folds (S, impact 3)

Scroll length of each main screen (scrollHeight ÷ view height; `screens-desk.txt`, `screens-phone.txt`):

| Screen | 1366×768 | 390×844 | Cycle 1 (Oct 26) |
|---|---|---|---|
| Life · Now | **1.0** (activities scroll inside, 2.6) | 1.4 to 1.7 | 4.7 |
| Life · Decisions | 2.5 (ruler **5.4**) | 2.8 (ruler 5.4) | — |
| People | 1.0 to 1.4 | 1.2 to 2.5 | — |
| Path | 3.0 to 3.9 | 2.3 to 3.7 | 3.7 to 4.5 |
| War | 2.7 (soldier 4.0) | 3.1 (soldier **5.0**) | — |
| Holdings | 3.3 | **7.0** | 7.8 to 8.0 (13 on a phone) |
| Realm | 1.0 (ruler 1.9) | 1.1 (ruler 2.3) | — |
| Realm · Politics (ruler) | **5.1** | **5.7** | new |
| Chronicle · Book | 1.8 to 2.3 | 1.9 to 2.5 | — |
| Chronicle · Places | 1.0 to 1.1 | 1.2 | new |
| Chronicle · Dynasty | **5.0** | **7.2** | — |
| Chronicle · Codex | **6.8** | **7.0** | 8.4 |
| The road (modal) | 3.1 | **10.9** | new |
| How to play (modal) | 1.6 | 1.5 | about 1,000 words |
| Arms designer (modal) | 1.5 | 2.3 | new |
| Death screen | 1.4 | — | — |
| War Room side panel | 1.6 | 2.2 | — |

- **The big wins.** The Life tab went from 4.7 screens to one, and the phone's Holdings from 13 to 7.
- **What is still long.** Codex, Dynasty, Politics and the ruler's Decisions run 5 to 7 screens with no folds. The road modal is nearly 11 screens on a phone.
- **Fix.**
  - Wrap each section of those tabs in 90-fold's fold, with a summary line, the way Life now does.
  - Add complaint #1's proposed test: no tab over 2.0 screens at 1366×768 with folds closed.
  - Owners: 90-fold (the helper), 9996-polity, 22-chronicle (Dynasty), 26-belief-truth or 59-tooltips (Codex), 9990-journeys (the road).

### B9. How the new layers read to a new player

| Layer | First impression | What to change |
|---|---|---|
| **Stepper** (Week / Month / Season / Until) | Clear and fast. "Until something happens" after two quiet steps is the right idea. A Month took 0.6 to 2 s under load. | The key letters change meaning by age (A-B2). Week is hollow (B4). |
| **9990 journeys** | Real distances and days: "Kingsmere 9,868 km · 399 days" feels huge. | A wall of 170 buttons with no map (A7, D3) |
| **9991 atlas, Story / Map** | The best new screen: inked, veiled, "seen 7 of 1,992 places" (`s/TD-storymap.png`). | Seen and unknown land differ only faintly. Make unknown land paler, or hatched. |
| **9992 identity** | The arms designer is a real toy (`s/TD-arms-pick.png`). The dog naming is charming. | Voices (B5). The mark card sits at the foot of Life. A "Design your arms" line in What now would let players find it in hour one. |
| **9993 chapters** | The right panel's chapter line is good. | The card (B6) and the doubled goal cards (B3) |
| **9994 share** | Works and looks good. | Wrong name (A9). Nothing invites the player to press "Keep this". A one-time hint after the first `◆◆ ONCE IN A LIFE` scene would. |
| **996 Coming up** | Useful at once: "Initiative is full", "Next month: The fish tithe". | Add the chapter's next aim and the bill's next count (9996 already feeds one) |
| **9996 polity** | Deep and honest, but a wall (A4). Fourteen bill buttons with no odds or effect. | Readable stakes (C1) and advisors (C2) |
| **9997 War Room** | Looks like a real wargame (`s/TD-soldier.png`). The battle panel ("Your section", "The front", the plan arrow) is a showpiece (`s/so-ev14.png`). | One name per unit (A1). The battle's choices show only "% · SPD + STA", with no cost: "Strip the dead for loot 94%" looks free (C1). |

### B10. Buttons

- **Static pass:** every `data-a` in the page has a handler.
- **Click pass:** 21 screens, 2,348 controls, the first 70 enabled per screen clicked. **One dead button** (A11) and no errors. Cycle 1's two dead What now suggestions are no longer dead.
- **Not covered:** controls past the 70th on long screens: Holdings (447), Path (227), Politics (184), the soldier's War tab (143).
- **Disabled controls:** on the ruler's Politics, 16 disabled "+" buttons each give a reason ("Already High."). The road modal gives none and answers with toasts instead (A7).
- **Unclear rather than dead:**
  - "Pick a story" (A11);
  - the clipped "Nex" skip button during a scene (A10);
  - "medium (obligations)" and "bondage (the commons)" as bill buttons with no explanation on the button;
  - "Let your sergeant decide (auto)" in battle, while the same screen says "Serjeant".

---

## C. The backtests' remaining build list, ranked for this game now

Ranked by what a new player of 13 to 23 would feel in the first two hours, divided by size.

| Rank | Item | Size | Impact now | Why this place |
|---|---|---|---|---|
| 1 | **Readable stakes** (Reigns dots, Slay the Spire intents) | S | 5 | Every deep screen built in cycle 1 lacks it. Battle moves show only a percentage. Bills, oaths and road rows show nothing. Event choices already show "If it fails". Extend that one grammar to battle moves (`mChoose`), bills (`poPropose`), oaths (`poOath`), the road (`jrGo`) and duels. This is the owner's "top-down clarity" in one feature. |
| 2 | **The ring speaks** (advisors) | S–M | 5 | It turns the Politics wall into "Chancellor Harald: bring lighter levies; the lords will pass it". For a soldier, "Serjeant Beatrix: hold, they are breaking". It also replaces the generic inner voice on big scenes with someone you know. It compounds with 9996's council, 37's squad and 999's confidants, all already built. |
| 3 | **Vows and the weekly seed** | S–M | 4 | Hall, share card and seed field all exist. A "This week" button on the title (one seed, one start, three goals) is the cheapest word-of-mouth loop left: friends compare the same world. Do the weekly seed first; vows second. |
| 4 | **White and red checks** | S | 4 | 10 of 12 first-year check choices were 20 to 47%, and fails pile up ("FAILED at 31%", "FAILED at 43%" in `p16-log.txt`). "Again: you are better at this now (+7 since 1112)" gives hope where there is now only loss, and "ONE CHANCE" warns before a lasting cost. Small, on 75-fair-checks. |
| 5 | **Moodlets and stress** | M | 3 | "How you are" (Rest, Company, Purpose, Comfort) is already on the profile. Named reasons ("Supper with Maud +8") would make it readable. Lower than 1 to 4 because it adds a stat surface before the existing ones are clear. |
| 6 | **Chapter focus trees** | M | 2 | A third goal layer on top of ambition and chapter aims, which already crowd day one (B3). Do it only after B3 and B6 merge the first two. |
| 7 | **The inquest** | M | 3 later, 2 now | The most original item, and the best story engine of the list. But it needs a working claims and evidence UI on top of screens that aren't yet legible. Build it after 1 and 2, then give it a share card. |
| 8 | **Located wounds** | M | 2 | War detail that the first hour doesn't reach, and the duel is not yet readable (no intents). Do it after the duel gets readable stakes. |
| 9 | **House legacies beyond 9993** | M | 2 | 9993 already offers five perks at succession. Few players reach a second generation in the first sessions. |

## D. Better picks than the remaining list

These fix coherence and legibility, which is where Ardan now loses a new player. Each is S or M, and none adds a simulation.

### D1. One truth per thing (S–M, impact 5)

A1 and A2 are instances of one disease: two systems describe the same thing differently. Add a "coherence" test suite that renders each screen and checks that the same entity has one name:
- your unit;
- your captain;
- your spouse's name in the Book and on People;
- the ruler's title on Realm and in Story.

It would also catch "Emperor Aldwin Ironside rules Aldmark" printed after the player has become emperor (a setup artifact here, but the same check). Owner: `tests/suites/` (a proposal for the test owner).

### D2. A step that always says something (M, impact 4)

Replace "Nothing new in your story: the days went by as days do" with a one-line digest built from what the step changed:
- training;
- coin;
- a bond's ledger;
- a Coming up item that moved nearer;
- one line of the world record within reach.

It is pure rendering of state that exists, and it makes Week worth pressing (B4). Owner: 84-top-bar's step note.

### D3. Travel from the map (S–M, impact 4)

The best new surface (Story / Map) and the most promising system (journeys) don't meet. Make clicking a province on the Story / Map open a small card:
- what you know of it (9991);
- days and suns by road, and a "Go there / Go and come back" button (9990).

The 170-button modal becomes the fallback list. It is the 80 Days loop: the map is where you choose. Owners: 9991-atlas (the click) and 9990-journeys (the card).

### D4. The ruler's desk (M, impact 4)

A ruler's What now offered "Train in an extra session", "build a family seat" and "Look for love" (`s/ru-99-end.png`), while the realm had a 520,000 debt and 14 bills to bring. The ambition read "229,000 suns of 20,000 suns in the treasury", an aim met before it was set.

Give rulers, lords and officers a short desk at the top of Realm:
- the next council meeting;
- the bill and its count;
- the faction nearest its demand;
- the treasury's month.

Each line should be a one-click action. Also scale the "golden age" aim to the realm's treasury (the ×10 growth noted in the cycle 1 report). Owners: 9996-polity (the desk), 97-life-fixes (`A.whatNow` lines and the ambition's target).

---

## Ten things to do first

1. A1: one name for your unit across War tab, War Room, battle and oath (9997). S–M, 5.
2. C1: readable stakes on battle moves, bills, oaths and the road (92, 9996, 9990, line battle). S, 5.
3. A2: no name collisions with kin or within a scene (97 or 02). S, 4.
4. A3: no forced siege scenes for infants and children (36). S, 4.
5. A4 and B8: Politics opens on politics, and long tabs fold (9996, 90). S, 4.
6. A5: the phone top bar stops overlapping (84, 71). S, 4.
7. B3 and B6: one goal card on day one, and a chapter card that looks like a title card (9993, 97). S, 4.
8. B7: every story start gets a second beat within six months (29). S–M, 4.
9. B4 and D2: Week earns its place, or goes; the step note says something true (84, 81). M, 4.
10. C2 and C3: the ring of advisors, then the weekly seed. S–M, 5 and 4.
