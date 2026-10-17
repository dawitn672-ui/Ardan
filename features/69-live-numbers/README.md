# Live numbers

**Aspect:** Character and life sim (Road to Ten, Character 7) · **Kind:** system (1 code file), 11 events, no patches, plus a copy of the bench's counter for the tests (`counter.mjs`)

The plan says: "Cut dead numbers. Any stat or skill that changes fewer than 5 outcomes in a typical bot life is cut or merged." Done when, the part bots can measure: "every remaining stat and skill touches at least 5 outcomes per life".

49-body-mind folded nine skills into their families and left six under the line: axe, unarmed, bow, sea, music and gambling. On today's world (65 features, 23 bot lives of `bench/dead-numbers.mjs`) all six were still there: axe 0, bow 0, sea 1, music 1, gambling 1, unarmed 2. The words for them are all over the game: dice in the back room rolled on wits, a shot at a hart rolled on stealth, a pavane danced on persuasion, "Sing along" with no roll at all, a tavern brawl fought with the sword at your hip. This feature gives each of them the places in a life where its words already are. Where one has too few such places, it is merged, as 49 did. A second pass did the same for the last three under the line after the first: athletics, craft and husbandry.

## What it does

**1. Checks whose words name the skill** (`LN.RETAG`, 19 choices). A hand-checked list as data: the event, the choice, the word its label must hold, what to set, and why. A rewritten label is skipped, not mangled. Two rules keep the odds honest:

- When the words also support a stat (wits at dice, an eye at the butts), the stat stays first and the skill goes second (40% of the check). Someone who never learned it loses at most about 15 points; someone who did gains.
- When the old skill was the wrong one (trade for a bet, persuasion for a pavane, survival for a week of firewood), the skill replaces it. For someone who never learned either, nothing changes.

Some of them: "Run before they hang it on you" (out the back and over the wall: spd/stealth → spd/athletics); dice in the back room (`tavern_dice`), and by the fire in camp (int/ins → int/gambling); "Stay calm and prove it" when you are accused of loaded bones (int/diplomacy → int/gambling); "Take the shot" at the lord's hart (stealth/survival → bow/stealth); "Ask them to dance" when the musicians strike up a pavane (etiquette/persuasion → etiquette/music); "Look into the captain first" before buying a share in a cog (trade/intrigue → trade/sea). A choice that 48-fight-ladder routes through fighting worth is left alone, since its odds come from the weapon in hand.

**2. Choices with no roll whose words are the skill** (`LN.RIDE`, 37 choices; `fx.knack`). After the choice resolves, how good you are at it adds a line and a small effect: at the top of the skill the good line, at the bottom the poor one, in between nothing extra. The effects are bounded (happiness 4, coin 6 or 15% of a purse, fame 1, health 4, an opinion 4). Examples: "Sing along at the top of your lungs" ("Your voice carries the verse, and people turn to see who it is" or "You lose the tune in the second verse and mouth the rest"), "Play for fun, small stakes", "Drink and dice the winter in", "Just watch" the carters' knucklebones (someone who knows dice sees the weighted bone), "Knock him down", "Teach the grandchild to shoot", "Rock him and sing", "Run for help", "Shrug, repair, and go on", "Mend the roof with your own hands", "Stay with the plough", "Let him think it, and be afraid" (intimidation), and "Lead the villagers against them" (tactics: where you put the flails).

**3. Work and the year** (engine hooks, each in a function the release already runs):

| Hook | Number | Where | What it does |
| --- | --- | --- | --- |
| A brawl is fought with fists | unarmed | `A.startDuel` | A tavern or lane brawl (kind `brawl`, not lethal) used to start with each fighter's own weapon, so a knight brawled with his sword skill. Now both sides fight bare-handed. A brawl the event made lethal ("your victim draws steel") keeps its weapons. |
| The grapple is wrestling | unarmed | `A.situEdges` | The duel's "Close & grapple" ("get inside the reach and wrestle") weighed strength and the weapon skill, never the wrestling. When either fighter grapples, the better wrestler takes up to 2 points of edge. The exchange is 2d6 plus edge, and the edge is named on the duel's line. |
| A trade's second skill | axe, athletics, bow, unarmed, gambling, music, sea | `A.careerYear` | The farmer's axe, the carpenter's adze, the corsair's boarding axe, the porter's load, the sailor's rigging, the mason's scaffold, the miner's ladders, the fisher's swimming, the herder's sling, the hunter's and the bowyer's bow, the innkeeper's fists, the fence's dice, the keeper's chant, the courtier's song, and a port merchant's cargo by sea. Each moves the year's work target from −3 (skill 0) to +6 (skill 60). The trade's description says so. |
| The lament at a wake | music | `A.familyYear` | When someone close dies, someone who can sing the lament gets back up to two fifths of the happiness the release takes (a mother 25: 10 back at music 60). |
| Dice in winter quarters | gambling | `A.milYear` | A soldier's winter: 3% of the purse won or lost, at 42% plus the skill's edge. |
| The winter's wood | axe | `A.careerYear` | A household that does not pay a woodman (rank up to townsfolk, under 400 suns) fells and splits its own. A poor hand risks a foot (1 in 8 below skill 8); a good one has the pile to the eaves. |
| The butts on feast days | bow | `A.careerYear`, 47-realm-bible's `ash_draw` and `ash_butts` | Peoples who keep the bow (Ashmere's men, as the release trains them, the steppe, the elves) shoot on feast days: a few pennies to the best, a penny's fine for an idle bow. Ashmere's two customs now read the bow too ("the reeve notes who still reaches the far one"). |
| The herring boats | sea | `A.careerYear` | A coastal commoner without a sea trade goes out with the boats in the season: a few suns, more for a seaman, and a ducking in a squall less often. |
| The autumn hunt | bow, riding | `A.careerYear` | A lord's year: the arrow that takes the hart is talked about (fame 1, happiness). |
| A crossing by sea | sea | `ga_open` | A gathering abroad that is reached by sea (both coasts, close enough to trade by sea, 45-economy's rule): a poor seaman comes ashore green (health, and a point of standing lost at the gathering); a good one comes ashore fresh (a point gained). |
| The road to a gathering | riding, athletics | `ga_open` | The same journey abroad, when it is not by sea: a guest of rank rides (a poor rider arrives stiff; a good one rides in fresh and gains a point of standing), and a guard or servant without a horse walks. |
| Holdings worked by their owner | husbandry, craft, sea | `A.moneyYear` | A cottage's garden plot and a freehold farm yield by farming, a workshop (and 45-economy's forge, armory and weaving shed) by craft, a fishing boat or barge by the sea: −15% to +25% of the year's income, with skill 25 at the release's figure. |
| Repairs | craft, athletics | `A.moneyYear` | A household that mends its own (townsfolk and below, under 2,000 suns) saves up to two fifths of the upkeep of a hovel, cottage, farm, workshop or town house, or pays a fifth more for a botched job; a poor climber can come off the ladder. A richer owner who knows the work is not cheated by his builders (up to a fifth off any building's upkeep, a tenth more if he cannot tell good mortar from bad). |
| A horse's keep | husbandry | `A.moneyYear` | A farrier's bill of up to 6 suns a year, nothing for someone who knows horses. |
| The season's marches | athletics | `A.milYear` | A foot soldier (up to squad captain) is footsore with poor legs (1 in 7) or first up the bank and noted by the sergeants (merit 2). |
| A flight from a fight | athletics | `A.groupFightPC`, `A.battleFinish`, `A.duelAct` | Up to a fifth of a lost group fight's harm back for someone who gets clear over a wall; in a lost battle a foot soldier is ridden down less often; fleeing a duel ("Speed decides") gains up to 15 points of the chance to break away, read only when you run. |
| The host's hunt | bow, riding | `ga_open` | At a wedding, coronation, summit or tournament the guests ride out with the host: the guest who takes the stag gains a point of standing there and a little fame; a poor rider can come off. |

**4. Axe is merged into spear, for the player: "Hafts: axe, mace & spear"** (`LN.MERGE`). With every hook above, axe still changed 2 outcomes in the median life. Its places are real but narrow: the wood axe, the farmer's and carpenter's year, a commoner's cudgel. The lives the bots lead rise into office, trade and command, and rarely fight. Spear sat at 4 for the same reason. A cudgel, a wood axe, a staff and a spear are the common man's weapons. The release already files the staff under spear and the club under axe, and a bill or a halberd is both at once. So the player's axe is read and trained as the spear's family, with 49-body-mind's own machinery (`A.BM.MERGE`):

- the sheet shows one row;
- an old save folds in the higher number;
- NPCs keep both numbers, so troops, other people's duels and the war layer are unchanged.

**5. Eleven scenes** (`live.events.js`, house voice, each a moment most lives pass through):

- **Music:** a song for the bride at a neighbour's wedding.
- **Unarmed:** the wrestling ring at the fair, and hands on your collar in the market (the bailiff's men want someone who looks like you).
- **Bow:** the butts after church.
- **Gambling:** dice on the threshing floor after the harvest (in a lord's hall, tables for silver), and the tables after supper at a gathering of crowns. The second is a scene in the release's gathering pool (`gscene`) and moves the gathering on. Its quiet choice ("Watch, and listen to what the losers say") also reads the dice: reading the players is the gambler's skill.
- **Axe:** the winter's wood (fell the dead oak, or split the windfall).
- **Sea:** the turn of the tide at an estuary crossing (on the coast).
- **Husbandry:** a hard lambing next door before dawn (rural, not noble).
- **Craft:** the gale that takes the thatch (climb up and patch it: craft and athletics).
- **Athletics:** the greasy pole and the footrace at the fair.

The two bouts in the ring carry their own fight spec for 48-fight-ladder: the fair's champion is a tier-2 fighter and the farm lads tier 1. The ladder's word-reader took "champion" for a knight.

## Measured by

**The dead-numbers bench**: `node bench/dead-numbers.mjs <build> --lives-per=4 --workers=1`, the bot lives of the six balance paths that lasted 25 years or more. Before is the same tree without this feature (`--without=live-numbers`, 23 lives, median 54 years). After is the full build with both passes (24 lives, median 53 years). The world under it has grown to 68 features while this was written, so these replace the first pass's figures. Each cell is the median outcomes in a life, with how many lives fell under 5:

| Number | Before | After | | Number | Before | After |
| --- | --- | --- | --- | --- | --- | --- |
| persuasion | 725 (0) | 741 (0) | | **unarmed** | **2** (17) | 10 (0) |
| etiquette | 680 (0) | 704 (0) | | survival | 12 (4) | 10 (8) |
| int | 364 (0) | 239 (0) | | stealth | 13 (5) | 9 (10) |
| wil | 112 (0) | 112 (0) | | **sea** | **1** (21) | 9 (9) |
| trade | 47 (5) | 99 (6) | | **music** | **0** (20) | 9 (2) |
| sta | 77 (0) | 85 (0) | | learning | 11 (7) | 9 (10) |
| diplomacy | 86 (1) | 56 (2) | | intimidation | 5 (11) | 8 (5) |
| **husbandry** | **3** (13) | 52 (3) | | riding | **2** (15) | 6 (12) |
| **craft** | **2** (15) | 49 (2) | | **athletics** | **3** (18) | 6 (9) |
| intrigue | 49 (2) | 43 (3) | | sword | 6 (11) | 5 (11) |
| command | 38 (2) | 33 (3) | | **gambling** | **1** (16) | 5 (11) |
| faith | 48 (4) | 32 (6) | | tracking | 8 (9) | **4** (14) |
| ins | 31 (0) | 29 (0) | | tactics | **3** (13) | **3** (14) |
| stewardship | 30 (4) | 29 (7) | | medicine | 8 (9) | **2** (14) |
| melee | 18 (2) | 17 (2) | | **axe** | **0** (22) | merged into spear |
| **bow** | **1** (22) | 16 (9) | | | | |
| spear (Hafts, with axe) | **3** (13) | 15 (5) | | | | |
| str | 15 (0) | 14 (0) | | | | |
| spd | 16 (1) | 14 (0) | | | | |
| shield | 9 (4) | 10 (4) | | | | |

- **Before:** 12 of 35 numbers under the line (axe, spear, unarmed, bow, riding, athletics, sea, music, tactics, craft, husbandry, gambling).
- **After, 24 lives:** 3 of 34 (tracking 4, tactics 3, medicine 2).
- **After, 36 lives:** 1 of 34 (`--lives-per=6`, the same build). Only tactics is under, at 4; medicine is 5 and tracking 6.

None of the 24-life three is a number this feature touches. Medicine went 7, 8, 6, 2 and 5 across five runs of this feature's builds as the tree and the stream moved, and tracking went 6, 8, 5, 4 and 6. They sit on the line, and 24 lives decide which side.

**Stability and spread** (36 lives, the final build). Percentiles per life, lives under 5, and the medians of two halves of 18 lives:

| Number | p10 | p25 | p50 | p75 | p90 | Under 5 | Halves |
| --- | --- | --- | --- | --- | --- | --- | --- |
| unarmed | 6 | 7 | 10 | 14 | 18 | 0 of 36 | 10, 9 |
| music | 5 | 6 | 9 | 14 | 43 | 3 of 36 | 9, 8 |
| Hafts (spear and axe) | 1 | 4 | 15 | 21 | 50 | 9 of 36 | 12, 16 |
| bow | 1 | 2 | 19 | 41 | 56 | 11 of 36 | 6, 21 |
| sea | 0 | 2 | 14 | 27 | 54 | 13 of 36 | 7, 17 |
| gambling | 1 | 2 | 8 | 75 | 97 | 14 of 36 | 3, 33 |
| athletics | 2 | 3 | 7 | 10 | 15 | 11 of 36 | 5, 7 |
| craft | 6 | 18 | 37 | 55 | 640 | 3 of 36 | 34, 43 |
| husbandry | 2 | 31 | 52 | 78 | 176 | 5 of 36 | 45, 55 |
| tactics (not touched) | 0 | 1 | 4 | 19 | 858 | 19 of 36 | 2, 13 |

- **Steady:** unarmed, music, craft and husbandry.
- **Bimodal:** bow, sea and gambling. Gambling's halves read 3 and 33: soldiers and dice players use it heavily, careful homebodies hardly at all, so 18 lives can fall either way. Bow and sea split the same way between lives with an archery custom, a coast or gatherings abroad and lives with none.
- **On the line:** athletics, which is steady near its 7.

| Test (`test.mjs`) | Result |
| --- | --- |
| `lnNineLive` | 16 bot lives of up to 45 years (3 a path, all four personalities, counted with the bench's own counter, `counter.mjs`). Median, with range and lives under 5: axe (→ Hafts) 14 (1-74, 5), unarmed 12 (5-28, 0), bow 11 (1-63, 7), sea 7 (0-1097, 4), music 8 (2-43, 3), gambling 5 (1-128, 7), athletics 11 (0-50, 4), craft 41 (1-1209, 2), husbandry 44 (2-382, 2). A 10-life league of 40 years put gambling at 3 on one tree and 7 on another, so the test uses 15 lives or more; it takes about 11 minutes. |
| `lnHonestOdds` | 19 of 19 retags applied, 37 of 37 riders. Odds for an untrained adult (skills 5, stats 40), before → after, and with the new skill at 50: dice in the back room 35 → 19% (trained 44%); camp dice 38 → 22% (47%); proving the bones honest 27 → 27% (52%); the hart 4 → 4% (28%); the butts 78 → 64% (86%); the pavane 12 → 12% (37%); firewood 19 → 19% (52%); the three athletics retags lose an untrained adult at most 15 points. No untrained loss is over 16 points, every trained gain is positive, and every rider is within its bounds. A trade's second skill moves the work target −3 at skill 0 and +6 at 60. |
| `lnBrawlFists` | A brawl: you fight on unarmed (worth skill 10, not your sword 60), the foe too; both weapons back afterwards. A brawl gone to steel: sword against axe. A duel: sword. |
| `lnWorkAndYear` | Each pair is the same seed at skill 0 / 60. A farmer's 8 years: work rating 48 / 60, pay 695 / 722. The lament gives back 0 / 10 of the 25 a mother's death takes. 40 years at the Ashmere butts: −21 / +73 suns, fame 0 / 26. 40 herring seasons: 50 / 195 suns, ducked 1 / 0. 40 autumn hunts: fame 5 / 17. 200 winters of camp dice: won 78 / 130. 20 years of a farm: −120 / +240 suns against the release; of a workshop −160 / +260; a cottage mended 0 / +20; a horse kept −120 / 0. 200 seasons of marches: footsore 36 / 0, noted by the sergeants 0 / 114. 200 crossings to a gathering by sea: sick 112 / 0, ashore fresh 0 / 200. |
| `lnScenesPlay` | The ten roll scenes are eligible for a 25-year-old peasant (on the coast for the crossing): 30 choices played, 0 raw tokens, 0 texts over 80 words. The tables after supper played 3 of 3 inside a gathering, and each moved it on to its next scene. |
| `lnRenderPure` | Every tab drawn with a scene up and a job held: `A.S` and the stream unchanged; the farm's description names its second skill (Hafts). |

All 58 tests pass on the final build (`--features=live-numbers,body-mind,fight-ladder,realm-bible,economy,markets`): the four core suites, these six, 49-body-mind 13 of 13 (`mergedSkills` now counts 10 merged skills), 48-fight-ladder 9 of 9 (`flDuelOdds` mean error 1.7 with the grapple edge in), 47-realm-bible 7 of 7, and 45-economy and 66-markets together 19 of 19. Those last two share `A.moneyYear` and the holdings with this feature. `tools/lint-events.mjs` passes (11 events, 0 errors, 0 warnings; the gathering scene declines outside a gathering, so `lnScenesPlay` plays it inside one). `tools/lint-choices.mjs` passes, with 0 obviously best, but it compared none of the 11 by numbers and could not read the gathering scene's function effects, so it checked little.

## Rules kept

- Every draw is in engine code (A.chance, A.ri, A.rf, A.pick in the year, the wake, the camp, the crossing, the hunt and the scenes' setup). Rendering only reads: the trade descriptions are data set once at load, and `lnRenderPure` draws every tab with a scene up without changing `A.S` or the stream.
- No inline handlers, no markup in state. The new state fields are `g.pc.lnSea` and `g.pc.lnHunt` on a gathering (optional, read as missing on an old save).
- `fx.knack` is declared in `A.FX_EXTRA`.
- No patches. Wrappers call the original: `A.applyFx`, `A.eventChoose`, `A.startDuel`, `A.situEdges`, `A.careerYear`, `A.milYear`, `A.familyYear`, `A.moneyYear`, `A.groupFightPC`, `A.battleFinish`, `A.duelAct`, and `A.BIBLE.hit` when 47-realm-bible is present.
- Events use `(p, C) => C.*` conditions, 3 choices each, labels of 12 words or fewer, and text under 80 words. The festival names are the game's own (First Loaf, Lantern Night).

## Limits

- **Character 7 is close, not done.** On 36 lives only tactics is under, at 4. On 24 lives, tracking 4, tactics 3 and medicine 2 are under. Tactics is a general's number (the war room and missions read it), and a life that never commands meets it in a handful of scenes; this feature does not touch it beyond one rider. Medicine and tracking move either side of 5 between runs. Part of medicine is invisible to the bench: 49-body-mind reads it in every month of every illness, from a monthly hook the bench does not count.
- **Bow, sea and gambling are bimodal** (see the halves above). They are honest about the lives the bots lead: inland lives that never travel by sea or hunt, and careful players who never sit down to dice. A careful bot always takes a choice with no roll, so a scene that only offers checks reaches it through riders alone.
- **Axe is merged, not made live.** The war layer still has an axe skill for NPCs and troops (`GD.TROOP_GEAR` AX). Doing it properly, or cutting the skill, needs the source (the plan's step 1). The player's sheet shows "Hafts: axe, mace & spear".
- **The retags and riders are judgement calls.** They are listed as data with a reason each, and `lnHonestOdds` prints every one with its odds. A designer should read the list. An untrained person now does worse at dice for money (35% → 19%), which is the point, but it is a change.
- **The second pass touches money and hurt.** It changes holdings' yields and upkeep (−15% to +25% of income, up to two fifths of upkeep), adds a horse's keep (up to 6 suns a year) and adds small hurts: a fall from the ladder (1 in 25 a year at worst), the march, a rout, the ladder in the thatch scene.
- **Balance not run** (the coordinator runs it). Expected moves, all small:
  - Peak coin: herring boats (+1 to 6 suns a season on a coast), camp dice (±3% of a soldier's purse a winter), a trade's second skill (pay ±4%), the tables at a gathering (±10 to 35), pennies at the butts; and from the second pass, holdings' yields and upkeep by skill (a farm −6 to +12 a year, a workshop −8 to +13), a horse's keep (up to −6 a year).
  - Peak fame: the Ashmere butts for a champion archer (up to +26 over 40 years at bow 60; none below 45), a lord's hunts (about +5 to +17 over 40 years), the host's hunt, the wedding song and the ring.
  - Age at death: the winter's wood (1 in 8 a year for a poor hand with an axe, 3 to 7 health), seasickness on a crossing, a fall at a hunt, the ring; and from the second pass, the ladder, the march, the rout, a stiff ride to a gathering. A lost group fight now hurts a good runner less.
  - Global check win rate: the retags make some checks harder for the untrained and easier for the trained, so it may dip slightly; the band is 30 to 70.
  - Duels: the grapple edge (±2 on a 2d6 exchange) changes a few. 48's `flDuelOdds` stayed at a mean error of 1.7.
- **Eleven new scenes** at weight 1.1 to 1.8 add a few events to each life. The tables join the gathering pool of 6 to 9 scenes per role.
- **The words need a human reader**: the eleven scenes, the 37 rider lines and the year lines. The duty notes are appended to the trade descriptions in English.
