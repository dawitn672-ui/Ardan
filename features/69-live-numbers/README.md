# Live numbers

**Aspect:** Character and life sim (Road to Ten, Character 7) · **Kind:** system (1 code file), 8 events, no patches, plus a copy of the bench's counter for the tests (`counter.mjs`)

The plan says: "Cut dead numbers. Any stat or skill that changes fewer than 5 outcomes in a typical bot life is cut or merged." Done when, the part bots can measure: "every remaining stat and skill touches at least 5 outcomes per life".

49-body-mind folded nine skills into their families and left six under the line: axe, unarmed, bow, sea, music and gambling. On today's world (65 features, 23 bot lives of `bench/dead-numbers.mjs`) all six were still there: axe 0, bow 0, sea 1, music 1, gambling 1, unarmed 2. The words for them are all over the game: dice in the back room rolled on wits, a shot at a hart rolled on stealth, a pavane danced on persuasion, "Sing along" with no roll at all, a tavern brawl fought with the sword at your hip. This feature gives each of them the places in a life where its words already are. Where one has too few such places, it is merged, as 49 did.

## What it does

**1. Checks whose words name the skill** (`LN.RETAG`, 16 choices). A hand-checked list as data: the event, the choice, the word its label must hold, what to set, and why. A rewritten label is skipped, not mangled. Two rules keep the odds honest:

- When the words also support a stat (wits at dice, an eye at the butts), the stat stays first and the skill goes second (40% of the check). Someone who never learned it loses at most about 15 points; someone who did gains.
- When the old skill was the wrong one (trade for a bet, persuasion for a pavane, survival for a week of firewood), the skill replaces it. For someone who never learned either, nothing changes.

Some of them: dice in the back room (`tavern_dice`), and by the fire in camp (int/ins → int/gambling); "Stay calm and prove it" when you are accused of loaded bones (int/diplomacy → int/gambling); "Take the shot" at the lord's hart (stealth/survival → bow/stealth); "Ask them to dance" when the musicians strike up a pavane (etiquette/persuasion → etiquette/music); "Look into the captain first" before buying a share in a cog (trade/intrigue → trade/sea). A choice that 48-fight-ladder routes through fighting worth is left alone, since its odds come from the weapon in hand.

**2. Choices with no roll whose words are the skill** (`LN.RIDE`, 26 choices; `fx.knack`). After the choice resolves, how good you are at it adds a line and a small effect: at the top of the skill the good line, at the bottom the poor one, in between nothing extra. The effects are bounded (happiness 4, coin 6 or 15% of a purse, fame 1, health 4, an opinion 4). Examples: "Sing along at the top of your lungs" ("Your voice carries the verse, and people turn to see who it is" or "You lose the tune in the second verse and mouth the rest"), "Play for fun, small stakes", "Drink and dice the winter in", "Just watch" the carters' knucklebones (someone who knows dice sees the weighted bone), "Knock him down", "Teach the grandchild to shoot", "Rock him and sing".

**3. Work and the year** (engine hooks, each in a function the release already runs):

| Hook | Number | Where | What it does |
| --- | --- | --- | --- |
| A brawl is fought with fists | unarmed | `A.startDuel` | A tavern or lane brawl (kind `brawl`, not lethal) used to start with each fighter's own weapon, so a knight brawled with his sword skill. Now both sides fight bare-handed. A brawl the event made lethal ("your victim draws steel") keeps its weapons. |
| The grapple is wrestling | unarmed | `A.situEdges` | The duel's "Close & grapple" ("get inside the reach and wrestle") weighed strength and the weapon skill, never the wrestling. When either fighter grapples, the better wrestler takes up to 2 points of edge. The exchange is 2d6 plus edge, and the edge is named on the duel's line. |
| A trade's second skill | axe, bow, unarmed, gambling, music, sea | `A.careerYear` | The farmer's and the labourer's axe, the carpenter's adze, the corsair's boarding axe, the herder's sling, the hunter's and the bowyer's bow, the innkeeper's fists, the fence's dice, the keeper's chant, the courtier's song, and a port merchant's cargo by sea. Each moves the year's work target from −3 (skill 0) to +6 (skill 60). The trade's description says so. |
| The lament at a wake | music | `A.familyYear` | When someone close dies, someone who can sing the lament gets back up to two fifths of the happiness the release takes (a mother 25: 10 back at music 60). |
| Dice in winter quarters | gambling | `A.milYear` | A soldier's winter: 3% of the purse won or lost, at 42% plus the skill's edge. |
| The winter's wood | axe | `A.careerYear` | A household that does not pay a woodman (rank up to townsfolk, under 400 suns) fells and splits its own. A poor hand risks a foot (1 in 8 below skill 8); a good one has the pile to the eaves. |
| The butts on feast days | bow | `A.careerYear`, 47-realm-bible's `ash_draw` and `ash_butts` | Peoples who keep the bow (Ashmere's men, as the release trains them, the steppe, the elves) shoot on feast days: a few pennies to the best, a penny's fine for an idle bow. Ashmere's two customs now read the bow too ("the reeve notes who still reaches the far one"). |
| The herring boats | sea | `A.careerYear` | A coastal commoner without a sea trade goes out with the boats in the season: a few suns, more for a seaman, and a ducking in a squall less often. |
| The autumn hunt | bow, riding | `A.careerYear` | A lord's year: the arrow that takes the hart is talked about (fame 1, happiness). |
| A crossing by sea | sea | `ga_open` | A gathering abroad that is reached by sea (both coasts, close enough to trade by sea, 45-economy's rule): a poor seaman comes ashore green (health, and a point of standing lost at the gathering); a good one comes ashore fresh (a point gained). |
| The host's hunt | bow, riding | `ga_open` | At a wedding, coronation, summit or tournament the guests ride out with the host: the guest who takes the stag gains a point of standing there and a little fame; a poor rider can come off. |

**4. Axe is merged into spear, for the player: "Hafts: axe, mace & spear"** (`LN.MERGE`). With every hook above, axe still changed 2 outcomes in the median life. Its places are real but narrow: the wood axe, the farmer's and carpenter's year, a commoner's cudgel. The lives the bots lead rise into office, trade and command, and rarely fight. Spear sat at 4 for the same reason. A cudgel, a wood axe, a staff and a spear are the common man's weapons. The release already files the staff under spear and the club under axe, and a bill or a halberd is both at once. So the player's axe is read and trained as the spear's family, with 49-body-mind's own machinery (`A.BM.MERGE`):

- the sheet shows one row;
- an old save folds in the higher number;
- NPCs keep both numbers, so troops, other people's duels and the war layer are unchanged.

**5. Eight scenes** (`live.events.js`, house voice, each a moment most lives pass through):

- **Music:** a song for the bride at a neighbour's wedding.
- **Unarmed:** the wrestling ring at the fair, and hands on your collar in the market (the bailiff's men want someone who looks like you).
- **Bow:** the butts after church.
- **Gambling:** dice on the threshing floor after the harvest (in a lord's hall, tables for silver), and the tables after supper at a gathering of crowns. The second is a scene in the release's gathering pool (`gscene`) and moves the gathering on. Its quiet choice ("Watch, and listen to what the losers say") also reads the dice: reading the players is the gambler's skill.
- **Axe:** the winter's wood (fell the dead oak, or split the windfall).
- **Sea:** the turn of the tide at an estuary crossing (on the coast).

The two bouts in the ring carry their own fight spec for 48-fight-ladder: the fair's champion is a tier-2 fighter and the farm lads tier 1. The ladder's word-reader took "champion" for a knight.

## Measured by

**The dead-numbers bench**: `node bench/dead-numbers.mjs <build> --lives-per=4 --workers=1`, 24 lives of the six balance paths that lasted 25 years or more. Before is the same tree without this feature (`--without=live-numbers`). Outcomes are per life, median:

**The dead-numbers bench**: `node bench/dead-numbers.mjs <build> --lives-per=4 --workers=1`, the bot lives of the six balance paths that lasted 25 years or more. Before is the same tree without this feature (`--without=live-numbers`, 23 lives, median 53 years). After is the full build (24 lives, median 51 years). Each cell is the median outcomes in a life, with how many lives fell under 5:

| Number | Before | After | | Number | Before | After |
| --- | --- | --- | --- | --- | --- | --- |
| persuasion | 715 (0) | 632 (0) | | **unarmed** | **2** (20) | 10 (2) |
| etiquette | 681 (0) | 625 (0) | | stealth | 15 (8) | 10 (9) |
| int | 345 (0) | 257 (0) | | riding | **1** (16) | 9 (8) |
| wil | 84 (0) | 96 (0) | | survival | 10 (8) | 9 (6) |
| sta | 77 (0) | 73 (0) | | **gambling** | **1** (20) | 9 (8) |
| diplomacy | 63 (0) | 65 (1) | | learning | 9 (7) | 8 (8) |
| command | 37 (1) | 40 (4) | | sword | 7 (11) | 7 (12) |
| faith | 39 (5) | 39 (3) | | medicine | 5 (10) | 7 (11) |
| trade | 178 (6) | 35 (6) | | tracking | 7 (10) | 6 (10) |
| intrigue | 49 (1) | 34 (2) | | intimidation | 5 (11) | 6 (8) |
| ins | 31 (0) | 30 (0) | | tactics | **2** (16) | 5 (12) |
| melee | 23 (1) | 20 (1) | | craft | **3** (13) | **4** (17) |
| str | 15 (0) | 19 (0) | | husbandry | **4** (13) | **4** (13) |
| stewardship | 41 (4) | 17 (5) | | athletics | **2** (18) | **3** (17) |
| spd | 15 (0) | 16 (0) | | **axe** | **0** (19) | merged into spear |
| **bow** | **0** (22) | 16 (7) | | | | |
| **sea** | **1** (20) | 15 (4) | | | | |
| spear (Hafts, with axe) | **4** (12) | 13 (6) | | | | |
| **music** | **1** (21) | 12 (4) | | | | |
| shield | 11 (4) | 10 (7) | | | | |

Under the line, before: 12 of 35 (axe, spear, unarmed, bow, riding, athletics, sea, music, tactics, craft, husbandry, gambling). After: 3 of 34 (athletics 3, craft 4, husbandry 4; none of them this feature's). The large numbers (int, trade, persuasion) move with the careers the bots happen to take on a shifted random stream, not with this feature.

**Stability and spread** (the same build before the dice-watching riders, 36 lives, `--lives-per=6`): the bench's medians were bow 16, Hafts 12, music 12, unarmed 11, sea 11, gambling 7. The spread per life, as 10th / 25th / 50th / 75th / 90th percentile, and lives under 5:

| Number | p10 | p25 | p50 | p75 | p90 | Under 5 |
| --- | --- | --- | --- | --- | --- | --- |
| unarmed | 5 | 7 | 10 | 12 | 14 | 3 of 36 |
| bow | 1 | 5 | 15 | 45 | 60 | 8 of 36 |
| sea | 1 | 5 | 11 | 28 | 40 | 7 of 36 |
| music | 4 | 7 | 10 | 25 | 32 | 4 of 36 |
| gambling | 1 | 2 | 7 | 49 | 101 | 13 of 36 |
| Hafts (spear and axe) | 1 | 3 | 8 | 17 | 46 | 11 of 36 |

Split into two halves of 18 lives, the medians were unarmed 8 and 11, bow 15 and 13, music 7 and 12, Hafts 6 and 12, gambling 6 and 7, and sea 15 and 5. Sea and gambling are the fragile two, and both are bimodal:

- **Sea** lives on the coast or travels to gatherings by sea, and an inland homebody meets no boat.
- **Gambling** soldiers and dice players use heavily; others meet only the odd scene.

| Test (`test.mjs`) | Result |
| --- | --- |
| `lnSixLive` | 15 bot lives of up to 45 years (3 a path, all four personalities, counted with the bench's own counter, `counter.mjs`): median axe (→ Hafts) 6, unarmed 11, bow 9, sea 20, music 10, gambling 6. A 10-life league of 40 years put gambling at 3 on one tree and 7 on another, so the test uses 15 or more. |
| `lnHonestOdds` | 16 of 16 retags applied, 26 of 26 riders. Odds for an untrained adult (skills 5, stats 40), before → after, and with the new skill at 50: dice in the back room 35 → 19% (trained 44%); camp dice 38 → 22% (47%); proving the bones honest 27 → 27% (52%); the hart 4 → 4% (28%); the butts 78 → 64% (86%); the pavane 12 → 12% (37%); the bonfire dance 53 → 53% (78%); firewood 19 → 19% (52%). No untrained loss is over 16 points, every trained gain is positive, and every rider is within its bounds. A trade's second skill moves the work target −3 at skill 0 and +6 at 60. |
| `lnBrawlFists` | A brawl: you fight on unarmed (worth skill 10, not your sword 60), the foe too; both weapons back afterwards. A brawl gone to steel: sword against axe. A duel: sword. |
| `lnWorkAndYear` | Each pair is the same seed at skill 0 / 60. A farmer's 8 years: work rating 48 / 60, pay 695 / 722. The lament gives back 0 / 10 of the 25 a mother's death takes. 40 years at the Ashmere butts: −21 / +73 suns, fame 0 / 26. 40 herring seasons: 50 / 195 suns, ducked 1 / 0. 40 autumn hunts: fame 5 / 17. 200 winters of camp dice: won 78 / 130. 200 crossings to a gathering by sea: sick 112 / 0, ashore fresh 0 / 200. |
| `lnScenesPlay` | The seven roll scenes are eligible for a 25-year-old peasant (on the coast for the crossing): 21 choices played, 0 raw tokens, 0 texts over 80 words. The tables after supper played 3 of 3 inside a gathering, and each moved it on to its next scene. |
| `lnRenderPure` | Every tab drawn with a scene up and a job held: `A.S` and the stream unchanged; the farm's description names its second skill (Hafts). |

All 10 tests (the four core suites and these six) pass on the full build. `lnSixLive` and `lnHonestOdds` were run on the final build; the rest were run on the build just before it, which differed only by the two dice-watching riders. The neighbours' tests pass on that build too: 49-body-mind 13 of 13 (including `mergedSkills`, which now counts 10 merged skills), 48-fight-ladder 9 of 9 (`flDuelOdds` mean error 1.7 with the grapple edge in), and 47-realm-bible 7 of 7. `tools/lint-events.mjs` passes (8 events, 0 errors, 0 warnings; the gathering scene declines outside a gathering, so `lnScenesPlay` plays it inside one). `tools/lint-choices.mjs` passes (0 obviously best; it compared none by numbers and could not read the gathering scene's function effects).

## Rules kept

- Every draw is in engine code (A.chance, A.ri, A.rf, A.pick in the year, the wake, the camp, the crossing, the hunt and the scenes' setup). Rendering only reads: the trade descriptions are data set once at load, and `lnRenderPure` draws every tab with a scene up without changing `A.S` or the stream.
- No inline handlers, no markup in state. The new state fields are `g.pc.lnSea` and `g.pc.lnHunt` on a gathering (optional, read as missing on an old save).
- `fx.knack` is declared in `A.FX_EXTRA`.
- No patches. Wrappers call the original: `A.applyFx`, `A.eventChoose`, `A.startDuel`, `A.situEdges`, `A.careerYear`, `A.milYear`, `A.familyYear`, and `A.BIBLE.hit` when 47-realm-bible is present.
- Events use `(p, C) => C.*` conditions, 3 choices each, labels of 12 words or fewer, and text under 80 words. The festival names are the game's own (First Loaf, Lantern Night).

## Limits

- **Character 7 is not done for the whole sheet.** Three numbers that are not this feature's are still under 5 on 24 lives: athletics 3, craft 4, husbandry 4. Tactics sits at 5, and at 3 on 36 lives. 49-body-mind's "6 of 35" was measured on 12 lives; on 23 lives of today's tree, 12 were under before this feature, sword and riding among them.
- **Sea and gambling are fragile** (see the halves above). They are honest about the lives the bots lead: inland lives that never travel by sea, and careful players who never sit down to dice. A careful bot always takes a choice with no roll, so a scene that only offers checks reaches it through riders alone.
- **Axe is merged, not made live.** The war layer still has an axe skill for NPCs and troops (`GD.TROOP_GEAR` AX). Doing it properly, or cutting the skill, needs the source (the plan's step 1). The player's sheet shows "Hafts: axe, mace & spear".
- **The retags and riders are judgement calls.** They are listed as data with a reason each, and `lnHonestOdds` prints every one with its odds. A designer should read the list. An untrained person now does worse at dice for money (35% → 19%), which is the point, but it is a change.
- **Balance not run** (the coordinator runs it). Expected moves, all small:
  - Peak coin: herring boats (+1 to 6 suns a season on a coast), camp dice (±3% of a soldier's purse a winter), a trade's second skill (pay ±4%), the tables at a gathering (±10 to 35), pennies at the butts.
  - Peak fame: the Ashmere butts for a champion archer (up to +26 over 40 years at bow 60; none below 45), a lord's hunts (about +5 to +17 over 40 years), the host's hunt, the wedding song and the ring.
  - Age at death: the winter's wood (1 in 8 a year for a poor hand with an axe, 3 to 7 health), seasickness on a crossing, a fall at a hunt, the ring.
  - Global check win rate: the retags make some checks harder for the untrained and easier for the trained, so it may dip slightly; the band is 30 to 70.
  - Duels: the grapple edge (±2 on a 2d6 exchange) changes a few. 48's `flDuelOdds` stayed at a mean error of 1.7.
- **Eight new scenes** at weight 1.1 to 1.8 add a few events to each life. The tables join the gathering pool of 6 to 9 scenes per role.
- **The words need a human reader**: the eight scenes, the 26 rider lines and the eleven year lines. The duty notes are appended to the trade descriptions in English.
