# Cycle 1 review: the concept as a game (reviewer "design")

**Angle.** Is Ardan a game a creative, adventurous player of 13 to 23 picks up, keeps playing and tells friends about? What do the strongest games near it do that Ardan doesn't yet do?

**How this was made.**
- **Read:** every `features/*/README.md`; `docs/plan/` (the Road to Ten, its status, the overnight reports, the pacing design); `docs/research/player-complaints.md`; `docs/design/` (brief, critique, pacing); the north star.
- **Played:** the built `index.html` through the real menu at 1366×768, with a copy of the cycle harness. The copy picks different choices in turn, clicks through non-event modals and logs every scene as it comes.
  - g1: an orc smith of the Tusk Clans, from 13.
  - g3: a human tenant farmer in the Jade City of Marast (Great Continent), 16 to 18.
  - n1: a newborn in the Abbey of Skyhold, 0 to 4.
  - One forced death, to see the death screen.
- **Evidence:** screenshots and scene logs are in `/tmp/ardan/cycle1/design/`. The scene logs are `g1-events.txt`, `g3-live.txt` and `n1-live.txt`.
- **Code:** read in `.build/` and the feature folders, to check what exists before proposing it.
- **Research:** the precedent games below, with web search and what I know of them. Sources are at the end.

**The verdict in one paragraph.** Ardan's engine is deep, and on the axes the Road to Ten measured it is now honest: memory, NPC initiative, honest odds, arcs, endings, a huge world. It falls short on the axes that make young players come back and talk about a game:
- **Collection across lives:** every new game wipes the endings and the achievements.
- **Anticipation:** nothing on screen says what is coming.
- **Place:** the map sits three clicks deep, travel is a teleport, and "Explore the wilds" draws one of five generic scenes anywhere on a 1,992-province continent.
- **Bonds that grow in visible steps.**
- **Sharing:** no moment can leave the page as a picture.

None of these needs a new simulation. Each is a layer over systems that already exist.

---

## Ranked summary

Ranked by impact for effort (impact ÷ size, where S = 1, M = 2, L = 4; ties go to the one that serves more of the audience).

| # | Improvement | Precedent | Size | Impact |
|---|---|---|---|---|
| 1 | The Hall of Lives: endings, achievements and past lives kept across games, unlocking new starts | BitLife ribbons, Hades, Reigns, Wildermyth legacy | M | 5 |
| 2 | "Coming up": a calendar strip of what the next weeks and months hold | Persona calendar, Stardew | S | 4 |
| 3 | Start stories up front on the creation screen | Stellaris origins, King of Dragon Pass pre-game | S | 4 |
| 4 | Share cards: keep a moment, a life or an ending as a picture | BitLife, Wordle, CK3 screenshot culture | M | 5 |
| 5 | "Explore the wilds" reads the land you are in | Genshin, Kenshi, Dwarf Fortress adventure mode | M | 5 |
| 6 | The map as a first-class surface | 80 Days, Sunless Sea, CK3 | S | 4 |
| 7 | Inner voices: your strongest skill or trait speaks one line in a scene | Disco Elysium | S–M | 4 |
| 8 | People show what they want, not their fighting tier | CK3 character view, Persona | S | 3 |
| 9 | Early years step to the next thing, not the next empty month | BitLife "Age up", Reigns | S | 3 |
| 10 | Confidants: bonds with ranks, and a gift at each rank | Persona social links, Hades | M–L | 5 |
| 11 | The Atlas: places you have seen and heard of, with fog on the rest | Sunless Sea, Genshin waypoints, Dwarf Fortress legends | M | 4 |
| 12 | Chapter cards: each life stage opens with a name and three short aims | Pentiment's acts, BitLife challenges, Reigns objectives | M | 4 |
| 13 | A weekly challenge: one seed, one start, one goal, same for everyone | BitLife weekly challenges, Spelunky daily | S–M | 4 |
| 14 | Make your mark: arms, a motto, named things, a line in your own chronicle | CK3 coat-of-arms designer, Bannerlord banners, Wildermyth | M | 4 |
| 15 | A peer circle in youth that ages with you | Persona classmates, Stardew villagers | M | 4 |
| 16 | Activities grouped by what you want, with four suggested | Persona's evening choice, Reigns' one card | S | 3 |
| 17 | Journeys, not teleports: travel as a route with stops | 80 Days, Sunless Sea, Bannerlord | L | 5 |
| 18 | The web of people: a picture of who loves and hates whom | CK3 relations view, Dwarf Fortress legends | M | 3 |
| 19 | Thoughts you adopt: a belief that ripens into a trait | Disco Elysium's Thought Cabinet | M | 3 |
| 20 | Dynasty legacies: what a house earns, its heirs can spend | CK3 dynasty legacies, Rogue Legacy | M | 3 |
| 21 | Far Lands scenes in their own words: temple, not church | King of Dragon Pass's culture-true text | M | 3 |

The bugs I met on the way are in their own section after the improvements.

---

## Improvements

### 1. The Hall of Lives (M, impact 5)

**What I saw.**
- `A.newState` builds a fresh `A.S` with `ach: {}`, and 28-endings keeps its collection in `A.S.endings` and `A.S.manners` (`features/28-endings/endings.core.js:88`). A new life from the death screen therefore starts at "Endings found (0/20, and 0/9 ways to go)", and so does every achievement.
- The collection survives only within one dynasty, through heirs. The Dynasty tab at 14 shows 0/20 (`g1-tab-legacy.png`).
- The death screen's only exits are "A new life" and "Title screen" (`death.png`). Nothing says what this life added to anything.

**Why it works for this audience.** BitLife's ribbons are the reason its players start the next life. Exactly one ribbon is given per life, as a verdict, and it goes into a collection the player chases to 100%. Players also set themselves runs ("this time, a pirate"). Hades and Reigns make death the start of progress. Wildermyth sends surviving heroes to a legacy pool for later campaigns. Young players are strongly driven by completion and visible progress. A collection that resets is worse than none, because it teaches them the game doesn't remember them.

**How to build it.** A new feature, `features/NN-hall-of-lives/`.
- **The store.** Keep a per-browser record, like the one 97-life-fixes uses for `UI.set.lfLives` (`f-shield.core.js:72`). It needs try/catch, and the page must work without it. Each entry holds `{name, race, realm, years, ending, manner, epitaph, score, achievements[], seed}`. Write it in a wrapper of `A.pcDeath` after 28 has set `pc.ending`.
- **Where it shows.**
  - The title screen gets a "Your lives" shelf of the last 12 portraits with their epitaphs.
  - The Legacy tab's "Endings found" reads the union of the save and the Hall.
  - The death screen says "New: *Cut Short* (3 of 20)".
- **Unlocks.** Some of 29-starts' 20 stories open only after a given ending: dying "Unremembered" opens "The beggar's heir", say. Pass the unlock into `o` as 97 does with `o.firstLife`, so the journal replays it. The engine never reads the Hall.
- **Rules.** Rendering stays pure. Strings go through `UI.esc`.

### 2. "Coming up": the calendar strip (S, impact 4)

**What I saw.**
- The life is lived a Week or a Month at a time (84-top-bar), but nothing shows what is ahead.
- The engine knows a lot about the future:
  - `A.S.sched` holds scheduled returns, arc stages and debts;
  - 47-realm-bible has customs "in a set month each year" (taxes, fasts, musters, festivals);
  - events promise dates: "The guild will judge your masterpiece at the spring session" (`g1-events.txt`).
- No feature renders `S.sched` (checked by grep in `.build/` and `features/`). Initiative sat at "7.0/7 full" all through g1 and g3 (`g3-tab-path.png`), and nothing said it was going to waste.

**Why it works.** Persona's calendar is its engine of anticipation. You can see the exam, the festival and the friend who is free on Thursdays, and you plan around them. Scarce time with a known future makes every evening a choice. Players build spreadsheets of it.

**How to build it.** Add it to `features/84-top-bar/` or a small new feature.
- **The strip:** under the clock, or as the first line of What now: the next 3 to 5 known things, with their week. "Week 2: tithe due (Marast). Spring: the guild judges your masterpiece. 1108: Hruza promised to repay 7 suns."
- **Sources:**
  - `S.sched` items that carry a public label (add an optional `label` to `A.schedule` calls; unlabelled ones stay hidden);
  - the realm-bible customs for the next two months;
  - an ambition's next step (97 `c-ambition`);
  - "initiative full: it stops filling".
- **Rules.** A read-only view, with no `A.rand`.

### 3. Start stories up front (S, impact 4)

**What I saw.**
- The 20 hand-made starts (29-starts), Ardan's best way in, sit behind a closed `<summary>` line on step 1 of the creation screen: "▸ Begin from a story (20 hand-made starts; or build your own below)" (`g2-create1.png`).
- The open part of the screen is a set of sliders: people, realm (a select of 152 realms), rank.

**Why it works.** Stellaris shows its origins as the first, illustrated choice, and each one changes how the game plays. King of Dragon Pass credits its replay to pre-game choices. A 14-year-old picks "the plague orphan" in two seconds. Picking among 152 realms in a dropdown, they freeze.

**How to build it.** In `features/29-starts/starts.core.js`:
- Open the details by default for the first three lives (`UI.set.lfLives`).
- Show three story cards, with picture and one line each, picked by hashing the date. "Show all 20" opens the rest, and "Build your own" stays one click away.
- Unlocked stories from #1 carry a "New" tag.

### 4. Share cards (M, impact 5)

**What I saw.**
- The death screen is a good card already: portrait, years, ending, epitaph and "What became of them" (`death.png`).
- No moment can leave the page as a picture. The only export is 22/57's text file of the Book.
- The death screen still draws the old paper-doll portrait, not 93's anime bust (`death.png`, and the creation screen in `g2-create1.png`).

**Why it works.** Young players share games through images: BitLife lives posted to TikTok and Reddit, Wordle's grid, CK3's family-tree screenshots and "my king did what" posts. A game with no share path gets no word of mouth. Ardan's moments ("married at 13 by the clan-mothers to Urbash of the Bone Hill clan") are exactly the kind people post.

**How to build it.** A new UI feature, `features/NN-keepsakes/`, with no engine change.
- **Three buttons:**
  - "Keep this" on a scene result (92-scene-card);
  - "Keep this life" on the death screen;
  - "Keep this page" on the Book.
- **The card.** Each one renders a 1080×1350 PNG on a canvas:
  - the anime bust (93's SVG, drawn to an image);
  - the woodblock sky (94);
  - the title;
  - one result line;
  - the epitaph;
  - "Ardan · seed 48213 · Jade City of Marast · 1105".
- **The file.** Offer it as a download or through the Web Share API where there is one. CSP allows blob and data URLs; check `00-security`.
- **The same fix.** Use the anime bust on the death and creation screens.
- **Rules.** Pure render, with picks by id hash.

### 5. "Explore the wilds" reads the land (M, impact 5)

**What I saw.** The activity is `explore(pc){return A.queue({type:"event",ev:A.pick(["explore_ruin","explore_cave","explore_road","explore_lair","explore_battlefield"])})…}` (`.build/ardan-core.js`). On a continent of 1,992 provinces, 110 cultures and 140 beasts, exploring anywhere draws one of the same five scenes. 97-life-fixes then rations them as a family.

**Why it works.** Genshin is built on "what's that on the ridge?": each region has its own landmarks, puzzles and secrets. Kenshi and Dwarf Fortress adventure mode make the world's real history the thing you stumble on. Creative, adventurous players want the world to be different where they go. Ardan has the data to do it, and the activity ignores it.

**How to build it.** A new feature, `features/NN-wild-places/`.
- **Generate a site.** A generator gives each province zero to two sites, seeded from the province id:
  - the province's terrain and coast;
  - beasts from 76-beast-habitats / 992-far-beasts `A.beastsNear`;
  - places named in the realm atlas (ruins, groves, battlefields from `A.S.history` and 57's world record);
  - a local legend from 26-belief-truth (what folk say, and what is true).
- **One scene, filled in.** Write a parametrised event pack, about 12 shapes such as "a ruin of {who}" and "a lair of {beast}", that takes `ctx` from the site. Each shape has its own checks and its own result.
- **The record.** A found site goes into `pc.sites` (tolerating its absence). It writes a line in the Chronicle and feeds #11.
- **The patch.** One wrap of `UI.A`'s `explore` action.

### 6. The map as a first-class surface (S, impact 4)

**What I saw.** The map lives under Chronicle → World → Map, the first of eight sub-buttons, in a box about 460 px wide (`g1-tab-world.png`). It is the third level of navigation in a game whose owner made a continent "the size of Asia" its default world.

**Why it works.** In 80 Days and Sunless Sea the map is the game's home screen. Every choice is a line drawn on it, and your progress is the lit part. CK3 opens on the map. A huge world that is never in view feels like a list.

**How to build it.**
- Add a "Map" toggle to the story column header ("Story | Map"), so the map can take the centre column while the right panel stays.
- Centre it on the player's home with the ring, and show the year's news pins (57's world record) on it.
- Clicking a province opens "What you know of it" (#11).
- The phone keeps 71's own layout, with the map as a sub-tab of Story.
- Owner: 62-inked-map (its hooks), plus a small UI patch in `UI.GROUPS`.

### 7. Inner voices (S–M, impact 4)

**What I saw.** A scene card shows the text, the choices and the odds (`g1-ev2.png`). The skill numbers are there, but the character has no voice of its own. 54-voices gives NPCs voices by culture and trait. The player gets none.

**Why it works.** Disco Elysium's skills speak as characters ("skills would often chime in during conversations to analyze, advise, and comment"). Each one is a hint, a joke and a mirror of who you built. Players quote those lines and share them. It turns a stat into a personality.

**How to build it.** In 92-scene-card's render, or as a new feature `features/NN-inner-voice/`.
- **The line.** Above the choices, one muted line, at most 14 words, from the player's strongest relevant skill or most marked trait. Example: "*Farming & herding:* The rust is in the third field already. Burn it."
- **The data.** About 15 voices (the skill families of `GD.SKILLS` plus six traits), each with 8 to 12 lines keyed by event tags. The tags (`A.EV_RX`, `A.CX_RX` classes, check skill) already exist.
- **The pick.** Hash the event id and the person id, as `A.npcStyles` does. No `A.rand`.
- **Rules.** A line shows at most once per event per life. A setting turns it off.

### 8. People show what they want (S, impact 3)

**What I saw.** On the People tab, every face carries a fighting tier chip, "Untrained", and an opinion word (`g3-tab-people.png`). The farmer's colleagues, his superior and his family are all "Untrained". Meanwhile 21-npc-initiative gives 573 written cast members wants and fears, and 30-get-to-know reveals personality. None of it shows in the list.

**Why it works.** CK3's character card leads with traits and goals, which makes every face a story hook. For a teenager, "wants land of her own; fears the lord's bailiff" makes a person interesting at a glance. "Untrained" makes them a stat block.

**How to build it.** In the People list renderer, through 59-tooltips and a small UI wrap:
- Replace the tier chip with the person's want once known (after get-to-know, or from `rel.hist`), and a "?" before that.
- Keep the tier for soldiers and rivals, or inside the profile.

### 9. Early years: step to the next thing (S, impact 3)

**What I saw.** In n1, 48 presses of "Month" took the newborn to age 4 and brought 6 scenes (`n1-live.txt`, `n1-tab-life.png`). 42 presses brought nothing to decide. 82-early-years runs the continuous clock ×10 in childhood, but the primary button is still "Month".

**Why it works.** BitLife's "Age +1" moves a year a tap, and childhood is a minute. Reigns never shows an empty card. Pressing an empty month 42 times is where a 13-year-old closes the tab.

**How to build it.** In `features/84-top-bar/step.core.js`:
- Below the age when an activity first opens (`A.isAdult`, or 49-body-mind's stage), the primary step becomes "Next season" (three months).
- After two empty steps in a row, offer "Until something happens" as the primary step.
- Same world, same seed: a step is only a span of days.

### 10. Confidants: bonds with ranks (M–L, impact 5)

**What I saw.** 55-bonds keeps a weighted ledger per bond, and 21 and 64 make NPCs act. A bond still shows as an opinion bar and a word ("Friendly", "Close", `n1-tab-people.png`). Nothing marks how far a friendship has come, or what it gives.

**Why it works.** Persona's social links are its heart. Each confidant has ranks 1 to 10, each rank is a scene, and each gives a concrete ability: a cheaper shop, an extra action, a new fusion. The last rank closes a personal arc. Hades does the same with gifts and keepsakes. Bonds become goals you can name and steps you can count. Young players remember these characters for years.

**How to build it.** A new feature, `features/NN-confidants/`, on top of 55's ledger.
- **Ranks.**
  - A bond whose ledger weight crosses 15, 30, 45, 60 or 75 offers its next rank as a scene, through the 21 NPC-move budget.
  - The scenes are drawn per role: friend, mentor, lover, rival, sworn brother, superior. That is 6 roles × 5 ranks = 30 scenes, written with `{them}` and `C.hasRel`.
- **Gifts.** Each rank grants one effect:
  - a friend smith repairs gear at half price;
  - a mentor adds 31-learn-by-doing growth in her skill;
  - a rival raises duel experience;
  - a lover lifts the "company" need of 35-moods.
- **The last rank.** It opens one arc stage of 50-arcs-kin or 51-arcs-rivals.
- **On screen.** Show rank pips on the People list and in the profile.

### 11. The Atlas (M, impact 4)

**What I saw.** Nothing records where the player has been. There is no `visited` or `seen` field in the engine or the features (grep). `A.travelTo` moves `pc.home` and writes one log line. The Great Continent's 1,992 provinces are all drawn as known from birth, and so is its edge, though 26-belief-truth's line is "what you know depends on how you came by it".

**Why it works.**
- In Sunless Sea, "you start in London with an empty map and have to find your way to all the ports, islands and wrecks". The map filling in is your progress.
- Genshin's waypoints and statues light up a region you have earned.
- For a collection-minded player, "places seen: 14 of 1,992" is a reason to travel.
- It is also the signature line made visible: far lands you only heard of are drawn from rumour.

**How to build it.** A new feature, `features/NN-atlas/`.
- **What you know.** `pc.seen[provId] = year` is set when you live there, travel through, fight there or find a site (#5). `pc.heard[provId]` is set from news and tales (57, 26).
- **The map.** 62-inked-map draws unseen land in faded ink and heard-of land with its rumoured name. The drawing reads state only.
- **The count.** The profile shows "Lands you have seen: 3 realms, 14 places". The Hall (#1) keeps the life's widest reach.
- **Old saves.** They start with home and the provinces next to it as seen.

### 12. Chapter cards (M, impact 4)

**What I saw.**
- 97-life-fixes restored ambitions, asked at coming of age and at 35, and they work. In g1 the Life tab showed "Raise a full house · Next: find someone to marry".
- Between those two questions are 19 years with one long-range aim. 22-chronicle has chapters only looking back ("one chapter per decade").
- The Decisions tab still opens with "There are no quest lists in Ardan" (`g3-tab-goals.png`).

**Why it works.** Pentiment's acts jump years, and each act has its own question. Reigns gives a few objectives per reign that unlock new cards. BitLife's challenges are 4 or 5 short aims. Short aims fit a session of 20 to 40 minutes. A lifelong ambition doesn't.

**How to build it.** Extend `features/97-life-fixes/c-ambition.core.js`, or add `features/NN-chapters/`.
- **The card.** At each life stage (49-body-mind's stages) and on big turns (a marriage, a move, a war), show a title card: "Chapter Three: The Hungry Years". The name comes from the situation, by id hash.
- **Three aims for about five years**, from the situation and the realm, such as "Get your own plough", "Win Vijaena's trust", "See the sea".
- **On screen.** The aims go under Ambition, with ticks. A finished one writes a deed and gives a small reward.
- **Looking back.** The Book uses the same chapter names.

### 13. A weekly challenge (S–M, impact 4)

**What I saw.** The world is deterministic from a seed, and 43-varied-worlds and 29-starts make a seed plus a start a reproducible life. Nothing offers a shared run.

**Why it works.** BitLife's weekly challenges "add a fun competitive twist, encouraging players to experiment". Spelunky's daily run gives a whole community one world to compare. It is a reason to come back weekly, and a conversation ("how did you get the ship?").

**How to build it.**
- **The title screen** gets a "This week" button:
  - the seed is the ISO week number, hashed;
  - one of the 20 starts;
  - three goals checked by the engine (ambition keys, achievements, endings);
  - "beat your best score" (73's score).
- **Determinism.** The seed is an input, so the life replays. Store the best in the Hall (#1).
- **Where it goes.** In 29-starts, plus a small title-screen patch.

### 14. Make your mark (M, impact 4)

**What I saw.**
- "Found a house of your own" takes a house name in a text box (`g3-tab-goals.png`), and that is the only place the player writes anything.
- There are no arms, no motto, no naming of a horse or sword, and no note of one's own. 53-arcs-things gives things histories, but the player doesn't name them.

**Why it works.** CK3's coat-of-arms designer and Bannerlord's banner editor are among the most used toys in either game. Wildermyth lets players rename and write their heroes. Creative young players want to put something of their own in. A sigil they made is also the best thing to share (#4).

**How to build it.** A new feature, `features/NN-my-mark/`.
- **Arms.** A small arms maker of field, ordinary, charge and two tinctures, using 95-icons charges. It opens when you found a house or are knighted, and is stored as ids, not markup.
- **Names.** Name your horse, your blade or your ship when you get one. The name goes through `SAVES.clean`, with letters only.
- **A line in your chronicle.** Once a year, an optional sentence that 22's Book prints in italics as "your own words". It counts as prose: check how `SAVES.clean` treats prose fields.
- **On screen.** Arms show on the profile, the death card and the map ring.

### 15. A peer circle in youth (M, impact 4)

**What I saw.** At 18, the farmer's People tab holds his superior, two colleagues (one sentence each) and his family. No one is his own age and his own choosing (`g3-tab-people.png`). At 4, it holds only family (`n1-tab-people.png`). "Play with other children" and "Run with the young bloods" are activities, but they leave no lasting names.

**Why it works.** Persona's cast is your classmates. You grow up beside them, and the calendar gives them days. Stardew's villagers are the same few people every season. Young players care most about people their own age. A rival or a friend from age 8 who is still there at 40 is what a life sim's best stories are made of.

**How to build it.** Extend 41-circles.
- **The circle.** The first "Play with other children" or "Run with the young bloods" makes three or four named peers of the player's age, in the home province, as one circle (41 already models circles).
- **The roles.** One of them is marked the "rival of your youth" for 51-arcs-rivals, and one the "first friend" for 40-memory-childhood's callbacks.
- **What it does.** Peers age with you, and 21 gives them moves at each stage.

### 16. Activities grouped by what you want (S, impact 3)

**What I saw.** An adult orc of 13 faces 29 activity tiles in one grid (`g1-start.png`): work under a master, pick pockets, enter a tournament, lend money, smuggle goods, and more.

**Why it works.** Persona gives one evening and a handful of places. Reigns gives one card. Choice overload makes new players pick nothing, or the first tile. A grid of 29 also hides the tiles that make a life distinctive.

**How to build it.** In 90-fold and 91-look's tile grid:
- Group the tiles into four intents: get better, meet people, make money, take a risk.
- Show 4 suggested tiles first, from the ambition (#12), the moods (35) and What now, with the rest under "More (25)".

### 17. Journeys, not teleports (L, impact 5)

**What I saw.** "Travel or move away" lists the 18 nearest provinces and one per realm. `A.travelTo` subtracts a fare, sets `pc.home` to the destination and logs "You travel 1,240 km to …". Past 300 km, 45% of journeys queue one road scene. A journey of a thousand kilometres is one click, and you live there afterwards. There is no trip out and back.

**Why it works.** 80 Days is a game of routes. "Routes take different amounts of time and have different costs", and each stop is a story chosen for that city. Sunless Sea makes the voyage itself the tension, with light, fuel and terror. Bannerlord's travel across the map is where you meet everyone. For an adventurous player, the road is the adventure.

**How to build it.** A new feature, `features/NN-journeys/`, after #5 and #11.
- **The route.** Plot it over the road graph 66-markets already prices.
- **The stops.** Make it a sequence of `A.schedule` stops, about one each 150 to 250 km. At each stop, offer one scene from that province's culture, terrain, sites (#5) or market (45 and 66).
- **The choices.** Go on, stay a season, turn back. A separate "go there and come back" keeps your home.
- **Companions.** Bonds (#10) can come along.
- **The record.** It fills the Atlas (#11).
- **Rules.** Every draw goes through `A.rand`. The patch is a wrap of `A.travelTo` and its modal.

### 18. The web of people (M, impact 3)

**What I saw.** The north star asks for "a web view of who loves and hates whom". 41-circles and 55-bonds hold the data, but the People tab is a list.

**Why it works.** CK3's relation lines and Dwarf Fortress's legends let players see the drama and screenshot it. A web makes "my friend is my enemy's lover" visible at once.

**How to build it.** An SVG view on the People tab, "Web". Nodes are the people you know, with their portraits. Edges are opinions above +40 or below −40 among them, and the circles are hulls. Lay it out by seeding from ids, never `A.rand`. Draw it in 62's ink style.

### 19. Thoughts you adopt (M, impact 3)

**What I saw.** Choices set flags (`pc.flags`) and 67-memory-weave cites them, but a repeated stance never becomes part of who you are. Hiding grain three hungry winters running doesn't make you anyone.

**Why it works.** Disco Elysium's Thought Cabinet lets you "install opinions, ruminate on them, and let them modify future perception". Each one has a cost and a payoff, and it marks the build as yours. It is identity play, which is central at 13 to 23.

**How to build it.** A new feature, `features/NN-thoughts/`.
- **When it opens.** When 67's memory records the same kind of deed three times, or after certain scenes, the player is offered a "thought" such as "The lord's barn is always full". Holding it for a year ripens it into a trait with a gain and a cost, using the existing trait system and `fx.trait`.
- **What it touches.** It changes some later checks and voices (#7).
- **Size of the set.** About 20 thoughts.

### 20. Dynasty legacies (M, impact 3)

**What I saw.** The heir choice exists (`UI.A.contAs`), and 74-old-age hands on blades and tools. A house earns nothing as a house. "Dynasty" is an achievement for playing three generations.

**Why it works.** CK3's dynasty legacies and Rogue Legacy's manor turn many lives into one climb. The second and third generation are where life sims lose players ("redundant as you age"). A house perk to choose at each succession gives the next life a new shape.

**How to build it.**
- Dynasty renown is the sum of the members' scores (73) and deeds.
- At each `A.continueAs`, offer one of three legacy perks from five tracks: blood, blade, coin, word, faith. Examples: "children start with +1 in the family craft", "the house name opens doors at court".
- Store them in `S.dynasty.legacies`.

### 21. Far Lands scenes in their own words (M, impact 3)

**What I saw.** In the Jade City of Marast (g3, `g3-live.txt`), generic scenes spoke of "the village priest … after vespers", hiding grain "in the church crypt" and "the lord's barn". Marast's own scenes (the moonlight jade line, the Seven Flames of Khozinj) were vivid beside them.

**Why it works.** King of Dragon Pass is remembered because every line is in its culture's voice. When the default world is the Great Continent, western words in eastern lands break the adventure of being somewhere else.

**How to build it.**
- Add place-words to the token set: `{temple}`, `{priest}`, `{service}`, `{lord}`, `{crypt}`. Fill them per faith and culture from 990-far-peoples' faith data, through 54-voices' culture terms.
- Have a lint rule in `tools/lint-events.mjs` flag "church", "vespers" and "priest" in events with no culture or faith condition. The tools are not this reviewer's to change, so this is a proposal.
- Re-word the about 40 commonest generic scenes to use the tokens.

---

## Bugs met on the way

| Bug | Where seen | Fix | Size | Impact |
|---|---|---|---|---|
| Endings and achievements reset on every new game. A.S.ach and S.endings live in the state `A.newState` rebuilds. | Code; `g1-tab-legacy.png` | #1 above. At least, carry `S.endings`, `S.manners` and `S.ach` through `UI.A.newLife` as a browser record. | M | 5 |
| A memory citation pastes the choice label and loses its object: "The last time you were at market, in 1106, you tried to cut it, and failed". It came two scenes running ("Strangers in the market", "A tooth on a cord"). | `g3-live.txt`, 1107 | `features/67-memory-weave/a-record.core.js:97-98` builds `d` from the label's first words. Skip labels whose verb takes a pronoun object ("it", "them", "him", "her") unless the scene supplies a noun. Don't cite the same memory in two scenes within a year. | S | 3 |
| A festival line repeats its name: "The Long Night of Lamps. The Long Night of Lamps. Every Lamp monastery…" | `g3-live.txt`, Dec 1105 | `features/990-far-peoples/faiths.data.core.js:28`: the description begins with the name, and the scene adds the name again. Strip a leading copy of the name in the scene's setup. | S | 2 |
| A bestiary line ends with two full stops: "Guards the Tea Mother trees..". | `n1-tab-life.png` | The "So that is what they call it" line (26-belief-truth) appends "." to a lore line that has one. Trim the trailing punctuation before adding. | S | 1 |
| The newborn Kyipa's mother is also named Kyipa. | `n1-tab-people.png` | The naming for single-name cultures (Skyfolk) doesn't exclude the parents' names. Re-pick when it matches a parent or sibling. | S | 2 |
| The title screen still pitches the old world: "Thirty-four realms, a hundred million souls", over the Known World map. The default is the Great Continent (152 realms, 1,992 provinces). | `g2-title.png`, `g2-create4.png` | 86-title-fold or 99-far-lands: the text and map should follow the default lands. | S | 2 |
| The death and creation screens draw the old paper-doll portrait, while the game draws 93's anime bust. | `death.png`, `g2-create1.png` | 93-anime-portraits: route those two renderers through the same portrait call. | S | 3 |

---

## Sources

- BitLife ribbons and challenges: [Destructoid](https://www.destructoid.com/how-to-earn-every-ribbon-in-bitlife/), [DroidGamers](https://www.droidgamers.com/guides/bitlife-ribbons-guide-a-list-of-all-30-ribbons-and-how-to-get-them/), [Newsweek](https://www.newsweek.com/entertainment/video-games/bitlife-ribbons-how-get-all-complete-list-cheats-guide-tips-become-lawyer-1317399).
- Reigns, death as progress: [Inverse interview](https://inverse.com/gaming/23117-reigns-francois-alliot-nerial-developer-interview), [Birth.Movies.Death](https://birthmoviesdeath.com/2016/09/02/reigns-review-swipe-right-to-fight-the-devil.html).
- CK3, stories players remember: [Dev Diary 0, The Vision](https://admin-forum.paradoxplaza.com/forum/developer-diary/ck3-dev-diary-0-the-vision.1265472), [Steam discussion](https://steamcommunity.com/app/1158310/discussions/0/4038102936185359084).
- Persona's calendar and social links: [P4 calendar guide](https://lbas.lboro.ac.uk/calendar/persona-4-calendar.html), [P3 Reload calendar guide](https://lbas.lboro.ac.uk/calendar/persona-3-reload-calendar-guide.html).
- 80 Days: [Emily Short on 80 Days](https://emshort.blog/2014/08/05/80-days-meg-jayanth-inkle/), [IF50](https://if50.substack.com/p/2014-80-days), [narrative design talk](https://mqw.at/en/institutions/q21/program/2015/10/subotron-arcademy-the-narrative-design-of-80-days).
- Sunless Sea: [PC Gamer](https://pcgamer.com/sunless-sea-alpha-review), [Hardcore Gaming 101](https://www.hardcoregaming101.net/sunless-sea-windows-macintosh-2015/), [Game Wisdom](https://game-wisdom.com/analysis/sunless-sea-crazy-cruise).
- Disco Elysium: [Archania](https://archania.org/p/the-symbolic-world/symbolic-works/video-games/disco-elysium), [The Fandomentals](https://www.thefandomentals.com/disco-elysium-redefines-stories-rpgs/), [Post45](https://post45.org/2024/04/therapy-simulator-2019/).
- Pentiment: [TrueAchievements interview](https://www.trueachievements.com/n51803/pentiment-interview), [GameSpot](https://www.gamespot.com/reviews/pentiment-review/1900-6417998/).
- Wildermyth legacy: [GamingOnLinux](https://www.gamingonlinux.com/2020/06/papercraft-styled-tactical-rpg-wildermyth-adds-legacy-campaigns/), [GameBanshee](https://www.gamebanshee.com/9pdkp).
- King of Dragon Pass: [A Sharp overview](https://a-sharp.com/kodp/overview.html).
- Stellaris origins: [HighGround Gaming](https://www.highgroundgaming.com/stellaris-best-origin/), [Dev Diary 1](https://www.moddb.com/games/stellaris/features/dev-diary-1-the-vision).
- RimWorld storytellers: [RimWorld wiki](https://rimworldwiki.com/wiki/AI_storyteller), [Wikipedia](https://en.wikipedia.org/wiki/RimWorld).
- Dwarf Fortress and emergent story: [Game Informer](https://gameinformer.com/b/features/archive/2016/11/25/letting-players-tell-the-story-simulation-games-as-narrative-machines), [Tarn Adams, Characterization and Emergent Narrative](https://wileywiggins.com//documents/dorf/Adams%20-%20Characterization%20and%20Emergent%20Narrative%20in%20Dwarf%20F.pdf).
- Genshin, exploration density (an informal analysis): [Cyberpost](https://cyberpost.co/?p=29797).
- Alter Ego, the vignette structure: [The Making of Alter Ego](https://sockmonsters.com/TheMakingOfAlterEgo.html).
- Motivation by age: [PC Gamer on Quantic Foundry's study](https://pcgamer.com/study-analyses-gaming-tastes-as-we-age).
