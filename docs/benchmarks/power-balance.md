# Power scaling and Balance and difficulty: benchmark

Oct 13, 2026 · build `b593143` plus the 29 fix patches (`features/00-05`), measured in headless Chromium. Strict scores going in (from "Ardan Road to 100"): **Power scaling 4.5, Balance and difficulty 4.5.**

Every number about Ardan below was measured for this doc unless it names a review. Every claim about another game carries a link. Many links are fan wikis or modders reading game files, because studios rarely publish formulas. Those are marked *(community)*. Anything I could not source is marked *unverified* or left out.

## 1. The bar

A 10 in this genre means three things hold at once. First, **one ladder rules every fight.** A duel, a tavern brawl, a hunt and an ambush all resolve from the same strength numbers, so the lore's "an elite takes seven regulars" is something the engine actually does. Second, **the player can read the odds and the odds are true.** That means they are either exact, as in Battle Brothers, or bent on purpose in a documented direction, as in XCOM 2 and Fire Emblem. They are never off by accident. Third, **balance is a measured target, not a feeling.** Slay the Spire's team logged every choice from the prototype on. FTL and Battle Brothers made difficulty change the economy and the enemy's choices, not only the death rate.

## 2. How the best do it

### Kingdom Come: Deliverance (combat skill gating)

**Mechanism.** You fight with your own hands, but the character's numbers set how wide your timing windows are. The master strike window depends on the gap between your weapon skill and your opponent's. Against a much better fighter it is "almost impossible" ([KCD wiki, Master Strike](https://kingdomcomedeliverance.wiki.gg/wiki/Master_Strike), *community*). Another page on the same wiki words it as absolute skill instead ([KCD wiki, Combat](https://kingdomcomedeliverance.wiki.gg/wiki/Combat)), so the exact formula is unverified. A perfect block has a visible cue (a green shield) and costs no stamina ([Perfect Block](https://kingdom-come-deliverance.fandom.com/wiki/Perfect_Block), *community*).

**Growth.** Skills grow only by use. You get better with a weapon by fighting with it, and Strength rises from melee ([PowerPyx, KCD2 skills](https://www.powerpyx.com/kingdom-come-deliverance-2-how-to-level-up-all-stats-skills/)). Skills cap at 20, and a perk opens after every third level ([KCD wiki, Skills](https://kingdom-come-deliverance.fandom.com/wiki/Skills_(KCD))). Combos are taught by a trainer, Captain Bernard ([Bernard](https://kingdomcomedeliverance.wiki.gg/wiki/Bernard), [False Edge](https://kingdomcomedeliverance.wiki.gg/wiki/False_Edge)). One guide says a top sword combo needs sword level 5 ([TrueAchievements](https://www.trueachievements.com/a247591/fighter-achievement), *community*).

**Difficulty.** KCD2's Hardcore mode (patch 1.2.4, April 2025) removes the HUD and the compass. It limits saving and makes you pick at least three permanent negative perks ([PowerPyx, Hardcore](https://www.powerpyx.com/kingdom-come-deliverance-2-hardcore-mode-guide/), [ITC](https://itc.ua/en/news/kingdom-come-deliverance-2-will-get-a-hardcore-mode-without-interface-compass-and-autosave)). Hard mode takes information away; it does not just add damage.

**Lesson for Ardan.** In KCD the skill gap is something you *feel*: a window that opens or shuts. Ardan resolves duels from numbers, so it can't lean on hand skill. It has to make the gap readable through text and odds, and those must be true. KCD's growth-by-use is also the model Ardan's Character section already cites. Today Ardan inverts it: training gives about 31 skill points a year, doing gives 1.5 per check (Road to 100).

### Mount & Blade II: Bannerlord (troop tiers, autoresolve math)

**Mechanism.** Troops climb tiers 1 to 6. When you "send troops", a simulation picks fighters from each side and trades hits by a power ratio. The official API exposes `CombatSimulationModel.SimulateHit(striker, struck, …, strikerAdvantage)` ([Bannerlord API docs](https://apidoc.bannerlord.com/v/1.2.7/class_tale_worlds_1_1_campaign_system_1_1_component_interfaces_1_1_combat_simulation_model.html)). Modders who decompiled it report these details *(community)*:

- Power comes from troop tier, with heroes +50% and mounted troops +20% ([Simulations Fix](https://www.nexusmods.com/mountandblade2bannerlord/mods/1151)).
- In 1.3.x a hit does roughly `(0.5 + 0.5·rand) × 40 × (attacker power / defender power)^0.7 × advantage`, before perks and morale ([Fixed Simulations](https://www.nexusmods.com/mountandblade2bannerlord/mods/12593), [round structure gist](https://gist.github.com/jzebedee/be076d28f162c8d05fd7d2d72109a46f)).
- The spread between tiers is small. One mod puts tier 1 at 74% and tier 5 at 126% of base power, about 1.7× end to end, and blames that for high-tier troops dying to low-tier ones ([Better Auto Calc](https://www.nexusmods.com/mountandblade2bannerlord/mods/673)).

**What goes wrong.** The `^0.7` squashes power gaps, so a 2× stronger troop deals only about 1.6× the damage. Autoresolve and the hand-fought battle then disagree. Modders call the vanilla tier gap small enough that high-tier troops often die to low-tier ones ([Better Auto Calc](https://www.nexusmods.com/mountandblade2bannerlord/mods/673)). At least four popular mods exist only to rework autoresolve ([1151](https://www.nexusmods.com/mountandblade2bannerlord/mods/1151), [12593](https://www.nexusmods.com/mountandblade2bannerlord/mods/12593), [673](https://www.nexusmods.com/mountandblade2bannerlord/mods/673), [Auto Resolve Rebalanced](https://www.nexusmods.com/mountandblade2bannerlord/mods/3453)). Players also argue about when to fight by hand instead ([Steam discussion](https://steamcommunity.com/app/261550/discussions/0/3596716230234308872/), *community*).

**Lesson for Ardan.** Two maths for one fight teach players to distrust both. Ardan has four: the duel, the group resolver, the plain skill check, and the war sim. Its tier curve sits at the opposite extreme from Bannerlord's. `GD.STR_CURVE` makes an Elite worth 8.2 Trained men and a Master 23. That fits the lore, but it means the duel at two tiers up is a wall, at 98.5% (section 3).

### Battle Brothers (tiered enemies, transparent odds)

**Mechanism.** Hit chance is plain arithmetic: attacker skill minus defender defense, with any defense above 50 counting half. High ground is worth ±10, and weapon skills add flat bonuses such as spear Thrust +20 ([BB wiki, Hit Chance](https://battlebrothers.fandom.com/wiki/Hit_Chance), [Combat Mechanics](https://battlebrothers.fandom.com/wiki/Combat_Mechanics), *community*). Modders say there are no hidden streak modifiers. The only bend is a flat +5 for the player and −5 for enemies on Beginner ([Steam](https://steamcommunity.com/app/365360/discussions/0/3194747223958428022/), [BB wiki, Game Mechanics](https://battlebrothers.fandom.com/wiki/Game_Mechanics), *community*). Even so, not every modifier shows in the main tooltip. A spear's +20 appears only on the skill ([Steam](https://steamcommunity.com/app/365360/discussions/0/3153060475180161988), *community*).

**Tiers are written relative to each other.** The developers place each new enemy against an old one. Nomad Cutthroats and Outlaws are "roughly equivalent" to Brigand Thugs and Raiders, and a Nomad Leader to a Brigand Leader ([Dev Blog #143](https://www.gamebanshee.com/3drdx)). Barbarian Reavers compare to raiders; Champions beat any brigand except perhaps a leader and are "mid to late game opponents" ([Dev Blog #118](https://gamebanshee.com/k4cpp)).

**Difficulty is split into separate axes.** Combat difficulty and economic difficulty are chosen apart, plus starting funds and Ironman. Higher combat difficulty brings harder enemy groups sooner. Each economic step cuts contract pay by 10%. Beginner and Ironman each delay the late-game crisis by 5 days ([BB wiki, Game Mechanics](https://battlebrothers.fandom.com/wiki/Game_Mechanics), [official forum](https://battlebrothersgame.com/forums/topic/difficulty-differences/), *community*). That crisis is gated by time on purpose, so you can build a company first, and it arrives in two phases with warning signs ([Dev Blog #92](https://www.moddb.com/news/dev-blog-92-late-game-crises)).

**Lesson for Ardan.** `GD.TIERS` already writes tiers relative to each other ("beats a brawler three times in four", "worth two or three regulars"). That is the right instinct. What Ardan lacks is the half that makes Battle Brothers trusted: the shown number is the rolled number, and every claim holds when you test it.

### Slay the Spire (data-driven balance, Ascension)

**Mechanism.** Mega Crit balanced from data from the start. Their GDC 2019 talk covers taking a metrics-driven approach early and using it throughout Early Access ([GDC Vault](https://gdcvault.com/play/1025731), [GDC news](https://gdconf.com/news/learn-slay-spires-successful-metrics-driven-approach-game-balancing-gdc-2019), [video](https://www.youtube.com/watch?v=7rqfbvnO_H0)). They built a metric server that logged every decision from the prototype on. The key numbers were how often a card is picked when offered, what it is picked over, and how often it appears in winning decks. A card picked too rarely is "basically not a card in our game" ([Game Developer](https://www.gamedeveloper.com/design/how-i-slay-the-spire-i-s-devs-use-data-to-balance-their-roguelike-deck-builder)).

**Numbers.** Mega Crit's May 2026 dispatch, as reported by Gamegeeker, gives these figures ([Gamegeeker](https://gamegeeker.com/fr/news/slay-the-spire-2-may-neows-news-update?market=FR)):

- Slay the Spire 2 has 240 million runs at a 25% overall win rate.
- Its five characters sit between 17% and 24%.
- In the original game, Ascension 0 was won 9% of the time and Ascension 20 3%.

A community sample of 1.1 million Slay the Spire 2 runs puts the five characters between 16.9% and 18.2% ([Gamer of Passion](https://gamerofpassion.com/slay-the-spire-2-card-win-rates/), *community*).

**Ascension.** After a win you can climb 20 stacked levels, each one named rule harsher. Level 1 adds more elites; levels 2 to 4 make normal enemies, elites and bosses hit harder; level 5 heals less after bosses; level 6 starts you hurt; levels 7 to 9 add enemy HP; level 20 adds a second final boss ([TrueAchievements guide](https://i1.trueachievements.com/game/Slay-The-Spire/walkthrough/2)).

**Lesson for Ardan.** Balance is a dashboard, not a debate. Paths ("characters") are held within a few points of each other on one outcome measure. Difficulty climbs one named rule at a time, and each rule's effect can be measured. Ardan has no targets on file, no league in the repo, and three difficulty modes that change only mortality.

### FTL: Faster Than Light (difficulty curve)

**Mechanism.** A run is 8 sectors of about 20 beacons. Each jump costs fuel, and a rebel fleet advances behind you, so you can't grind ([Wikipedia](https://en.wikipedia.org/wiki/FTL:_Faster_Than_Light)). The developers gave a GDC 2013 postmortem ([GDC Vault](https://gdcvault.com/play/1019036)); I could not retrieve what it says about difficulty.

**Difficulty changes the economy and the enemy's mind** *(community)*:

- Starting scrap is 30 on Easy, 10 on Normal and 0 on Hard.
- Easy earns roughly 20 to 30% more scrap. Normal delays the scrap-reward curve by one sector and Hard by two.
- Hard gives the enemy smarter system targeting and faster scaling.
- The flagship's shields drop from 4 to 3 on Easy.

Sources: [Games Finder](https://gameslikefinder.com/article/ftl-difficulty/), [Steam guide "Calculated FTL"](https://steamcommunity.com/sharedfiles/filedetails/?id=2127539536), [GOG forum](https://www.gog.com/forum/ftl_advanced_edition/difficulty_differences), [Subset forum](https://subsetgames.com/forum/viewtopic.php?t=3940). A claim that Easy was added late and Normal was tuned for about a 10% win rate is *unverified*.

**Lesson for Ardan.** FTL's clock is the fleet. Ardan's clock is aging, and it is already a good one. FTL's difficulty moves income and enemy intelligence, which changes what you decide. Ardan's Story, Hard and Realism modes move only six mortality and score multipliers.

### XCOM 2 (displayed vs true hit chance)

**Mechanism.** XCOM 2 bends its odds on purpose, toward the player, and only where players misjudge them. Jake Solomon: "If you see an 85 percent chance to hit, you're not looking at that as a 15 percent chance of missing." He says the shown number is tilted in the player's favor on the lower difficulties ([Game Developer](https://www.gamedeveloper.com/design/jake-solomon-explains-the-careful-use-of-randomness-in-i-xcom-2-i-)).

**Numbers** *(community, from the game's config)*. The assist applies only to shots at 50% or more and is capped at 95%. Per difficulty, the config gives:

- Rookie: aim ×1.2, +10 after a miss streak, +15 after losing soldiers.
- Veteran: aim ×1.1, +10 after a miss streak, +10 after losing soldiers.
- Commander: aim ×1.0, +15 after a miss streak.
- Legend: no assist at all.

Sources: [Steam](https://steamcommunity.com/app/268500/discussions/0/1474221865182585226/), [Steam](https://steamcommunity.com/app/268500/discussions/0/2944746708998250511), [Commander+ guide](https://steamcommunity.com/sharedfiles/filedetails/?id=659299888). A mod exists just to show the hidden bonus ([Nexus](https://www.nexusmods.com/xcom2/mods/212)).

**Two more data points on shown odds.**

- **Fire Emblem 6 to 13** roll two numbers and average them, so a shown 70% hits 82.3% of the time ([Fire Emblem Wiki](https://fireemblemwiki.org/wiki/True_hit), [LT-maker docs](https://lt-maker.readthedocs.io/en/latest/source/appendix/Difficulty-Mode-Options.html)).
- **Sid Meier's GDC 2010 keynote.** Civilization Revolution testers hated losing a 3-to-1 battle about one time in four, yet credited their own skill when they won a 1-to-3. The team also saved battle results in the save file, so reloading gave the same outcome ([Kotaku](https://kotaku.com/civilization-creator-explains-why-everything-game-devs-5492078), [Game Developer](https://gamedeveloper.com/pc/gdc-sid-meier-s-lessons-on-gamer-psychology), [Museum of Play](https://www.museumofplay.org/blog/gdc-2010-game-psychology-101/)).

**Lesson for Ardan.** Bending the shown odds can be good design, but only on purpose, in the player's favor, and switched off at the top difficulty. Ardan bends them by accident, and the wrong way.

- In the lab, with both fighters at full health and armed, the screen overstates the underdog by up to 8 points and understates the favorite by up to 9.
- Read from the NPC's side, the error reaches 12 points.
- In real lives it is far worse. Fights the profile calls even (mean 49%) were won 9% of the time, because the number ignores the weapon the foe is handed at the duel's start and your own health (section 3).

Ardan's 2d6-against-2d6 exchanges over many rounds are Fire Emblem's averaging trick without the intent: small per-round edges compound into a much steeper curve than the logistic on screen. The save point already matches Civilization Revolution: the seeded random stream and the journal make a reload give the same result.

## 3. Backtest

### What I measured, and how

The test build was made with `node tools/build.mjs --out=<scratch> --unpack` (fix layer only, 29 patches). The scripts lived in a private scratch folder; nothing in the repo was changed except this file. The appendix has the procedure so it can be ported into `bench/`. Six studies:

1. **Duel calibration.** 400 fighters came from `A.makeFoe` (tiers 1 to 5). 2,496 random pairs each fought 5 duels under the rules events use (`fx.duel`: lethal, foe may yield). Side effects were stubbed with `A.duelConsequences = () => []`. The five duels:
   - the fighter in the player seat, driven by the game's own auto-play (`A.duelAuto`);
   - the same, with a pilot that never yields;
   - the fighter in the NPC seat, against the auto-play;
   - the same AI on both seats, once in each order (two duels).

   The shown odds are `UI.vsYou`, `1/(1+e^(−gap/12))` on the fighting-worth gap. The same study ran on the untouched release.
2. **Mirror duels.** A fighter fought an exact clone of itself, 1,500 times per rule set and pilot, so any edge belongs to the seat.
3. **Beasts.** Generated fighters of each tier fought every beast of each tier alone, 400 fights per cell.
4. **Group resolver.** `A.groupOddsSides` was run on the matchups the tier texts describe.
5. **Event audit.** All 3,199 events and 9,635 choices were read in the page: which outcomes kill or maim, and what decides them.
6. **Bot lives.** 24 lives, 4 for each of 6 starts, played by random choice. I logged the odds of every check the life was actually offered, plus the death age and state at 40.

### Key results

**Duel odds by tier gap (patched build, event-duel rules)**

| Tier gap (fighter − other) | Pairs | Shown on screen | Real, same AI both seats | Real, fighter in player seat (game auto-play) | Real, player seat that never yields | Real, same fighter in the NPC seat |
| --- | --- | --- | --- | --- | --- | --- |
| −2 | 299 | 10.5% | 3.2% | 4.3% | 5.0% | 2.7% |
| −1 | 440 | 26.0% | 20.7% | 21.6% | 22.0% | 15.0% |
| 0 | 512 | 50.1% | 50.1% | 54.5% | 53.3% | 47.5% |
| +1 | 450 | 74.3% | 79.6% | 79.6% | 84.9% | 77.6% |
| +2 | 329 | 89.8% | 98.5% | 98.5% | 99.1% | 97.3% |

- **The real curve is steeper than the screen.** Over 11 worth-gap bins it fits a logistic with scale **8.7** (RMSE 2.5 points). The screen uses **12** (RMSE 5.7).
- **Size of the error.** The mean absolute error is 5.7 points with the same AI on both seats. For a fighter in the NPC seat it reaches 6.2 points, with a worst bin of 12.1 points: at a gap of −20 to −12 the screen gives the weaker side 21%, and the real figure is 9%.
- **Two tiers up is a wall.** It wins 98.5%, while the plan's target is 92%.
- **The release build** had a mean error of 5.9 to 7.2 points and a worst bin of 15.1.

**In real lives the shown odds are much worse.** In the 24 bot lives below, the player met 71 duels and brawls with a person. The profile's odds against what happened:

| Profile said (player's chance) | Fights | Mean shown | Player won |
| --- | --- | --- | --- |
| Under 35% | 22 | 20% | **0%** |
| 35 to 65% | 23 | 49% | **9%** |
| 65% and up | 26 | 83% | 65% |
| All | 71 | 52% | 27% |

The samples are small, but the causes are confirmed in code and measured directly:

- **The foe is handed a weapon after you look.** 92% of the adult NPCs in a cast are stored with no weapon. `A.startDuel` arms them at the start of a fight with `A.armFor` (a sword for a noble, a cudgel for a farmer). That raises their worth by a median 24 points (75th percentile 30) and lifts 83% of them at least one tier. The tier chip and the profile read the unarmed worth. In a 25-duel probe, 11 foes were armed this way.
- **Your health is ignored.** `A.fightWorth` always assumes full HP. In the duel, `A.fighterFrom` scales your HP by health, down to a floor of 30%: at health 60 you start with 59% HP. In the probe, 6 of 25 duels began with the player below 90% HP.

**Mirror duels: the edge that belongs to the seat**

| Rule set | Pilot | Release: seat A wins | Patched: seat A wins | Patched: seat A loses |
| --- | --- | --- | --- | --- |
| Event duel (lethal, foe may yield at 30% HP) | game auto-play (yields 18.7% of the time) | 56.7% | 48.3% | 50.4% |
| Event duel | never yields | 61.8% | 55.1% | 43.5% |
| Event duel | same AI as foe | 60.3% | 53.5% | 45.7% |
| Plain lethal duel | same AI as foe | 50.5% | 47.1% | 50.3% |
| Non-lethal brawl | same AI as foe | 50.0% | 43.5% | 53.3% |

- The review's "player seat wins about 72% of even fights" does not reproduce in this harness. In the release, the player seat won 57 to 62% of mirror event duels. After `ENG-DUEL-DOUBLE-KO` it wins 48 to 55%. The seat still "refuses to fall" in 6 to 9% of lethal duels.
- In non-lethal brawls the player seat now wins only 43.5% and loses 53.3% against an identical foe. With 1,500 fights, that gap is well outside noise (about ±2.5 at 95%). The seat edge changes sign with the rule set, and nothing on screen says so.
- The game's own auto-play gives up 18.7% of event duels (it yields under 20% HP), which costs it about 7 points against a pilot that never yields.

**Do the tier texts hold?**

| Claim in the game or plan | Engine result | Verdict |
| --- | --- | --- |
| `GD.TIERS` Trained "beats a brawler three times in four" | One tier up wins 79.6% (all adjacent tier pairs) | Holds |
| `GD.TIERS` Brawler: "two or three make one soldier" | 1 Trained vs 2 Brawlers 50.1%, vs 3: 40.1% | Holds |
| `GD.TIERS` Veteran: "worth two or three regulars" | 1 Veteran vs 2 Trained 54.6%, vs 3: 44.5% | Holds |
| `GD.TIERS` Elite: "7–10 regulars or about 4 veterans" | vs 7 Trained 54.0%, vs 10: 45.2%, vs 4 Veterans 46.1% | Holds |
| `GD.TIERS` Master: "20–30 regulars" | vs 20 Trained 53.8%, vs 30: 29.8% | Holds at 20, weak at 30 |
| Plan, Power step 3: "3 Trained beat 1 Elite about two times in three" | 3 Trained win **26.7%** | **Clash** (the plan contradicts the game's own ladder) |
| Plan, Power step 6: "one tier up wins about 73%, two tiers about 92%" | 79.6% and 98.5% | **Clash** (73/92 is the screen's formula, not the duel) |
| `TIER_INFO.animal`: "One trained fighter can kill it" | Trained alone vs animal-tier beasts wins **25.5%**; Elite 73 to 81%; Master 90% | **Clash** |
| `BEAST_TIER` tags The Roc (HP 200) and Forest Men (HP 170) "animal" | The engine's own fallback rule makes HP ≥ 170 "great". Trained vs The Roc wins 0% | **Clash** |
| `TIER_INFO.great`: "Alone, even a master usually dies" | Master alone vs great beasts wins 2.5 to 3.3% | Holds |
| `GD.TIERS` Legend: "perhaps five alive"; `GD.LEGEND_CAP = 5` | The plan says about 12 | **Clash** (plan vs game) |
| `GD.TIERS` Master: "one or two in a realm"; generated order heads are Masters | The plan says about 5 per realm | **Clash** (plan vs game) |
| Plan, Power step 4: "a lost hand drops your sword tier by 2" | A lost hand costs a swordsman a median 14 worth (about 1 tier). A spearman loses 3 (0.2 tier): `lost_hand.skillPen` has no spear, axe or mace entry | Half |

**What decides the deadly outcomes in events?**

| Count | Value |
| --- | --- |
| Events, choices | 3,199, 9,635 |
| Choices that start a duel or beast fight (`fx.duel`, `fx.beast`) | 261 |
| Choices using the group resolver (`group:`) | **6** |
| Outcomes that maim or cost 20+ health | 484, of which **466 sit behind a plain skill check** |
| In events whose text describes a fight (346 events): injuries decided by a plain check vs. by a resolver | 76 vs 76 |
| Outcomes that kill outright (`die`) | 8, 7 behind plain checks (mostly executions, e.g. `gallows`) |

Plain checks in fight events often use skills that have nothing to do with fighting. Two examples: `wr_hired_knife` rolls intrigue/insight and `wr_hf_raiders` rolls command/insight. Fighting worth never enters them. A Master and a farmer face the same knife at the same odds if their insight matches.

**Pre-fight line vs tier chip.** The only fight percentage in the game sits on the person profile (`UI.personModal` calls `UI.vsYou`). The duel screen shows no number. It opens with `A.weighText`, a word band read from the CR gap without gear, while the chip and the profile read fighting worth with gear. In 7.6% of fights where the worth gap is 6 or more, the two disagree on who is ahead.

**Event check odds by life stage**

| Age | Median odds of all 4,521 checks, freshly generated character of that age | Share at the 4% floor |
| --- | --- | --- |
| 10 | 4% | 77% |
| 16 | 4% | 60% |
| 25 | 6% | 46% |
| 40 | 9% | 42% |

These are the checks as written. Event conditions filter what a life actually meets, and those numbers are in the life baseline below. Event checks are honest: `A.eventChoose` rolls exactly `A.checkOdds`, the number on screen. So is the group resolver. **Only the duel lies.**

**Difficulty.** Story, Hard and Realism change six multipliers, all mortality or score:

- yearly death chance;
- child death;
- death in childbirth;
- surviving at 0 health;
- death after losing a duel;
- the score multiplier (×0.6 / ×1 / ×1.35).

Odds shown, recovery speed, check difficulty, AI aggression and income are all identical across modes.

**Life baseline (24 random-bot lives, human, 4 per start, real consequences, Hard)**

| Start | Death ages | Median | Reached 40 | Net worth at 40 (median of those who did) | Best tier reached | Fights met / won |
| --- | --- | --- | --- | --- | --- | --- |
| Serf | 10, 45, 50, 75 | 47.5 | 3 of 4 | 8 | Veteran, Trained, Untrained ×2 | 11 / 4 |
| Peasant | 1, 21, 22, 50 | 21.5 | 1 of 4 | 19,323 | Brawler ×3, Untrained | 9 / 0 |
| Artisan | 30, 65, 68, 72 | 66.5 | 3 of 4 | 6 | Trained ×2, Brawler ×2 | 15 / 3 |
| Merchant | 19, 50, 71, 77 | 60.5 | 3 of 4 | 5 | Veteran, Trained, Brawler, Untrained | 21 / 4 |
| Gentry | 5, 29, 32, 66 | 30.5 | 1 of 4 | 1 | Trained ×2, Brawler, Untrained | 6 / 0 |
| Noble | 29, 71, 72, 77 | 71.5 | 3 of 4 | 1,841 | Veteran ×3, Trained | 31 / 8 |

- **Deaths.** The median death age is 50. None of the 24 died in a fight. They died of fevers, coughs, hearts, strokes and falls, plus one hanging.
- **Fights.** The lives met 93 fights, about 4 each, and won 19 of 71 against people. They won **0 of 22 against beasts** (12 great, 9 animal, 1 titan). The random bot walks into fights it cannot win, and the game lets it.
- **Noise.** Four lives per start give median death ages from 21.5 to 71.5. That is noise, not signal. An earlier run of 24 lives, with duel consequences accidentally switched off, gave medians of 53.5 to 71.5 for the same starts. Nobody can set or check a path target on samples this small. That is the case for item 6 in section 5.

**Checks the lives actually met**

| Age | Checks met | Median of each life's median odds (range) | Share at the 4% floor |
| --- | --- | --- | --- |
| 0 to 12 | 612 | 36% (31 to 42) | 1% |
| 13 to 17 | 653 | 30% (21 to 43) | 14% |
| 18 to 29 | 1,515 | **19%** (12 to 36) | **19%** |
| 30 to 49 | 1,884 | 27.5% (18 to 51) | 12% |
| 50 and up | 1,335 | 31% (19 to 72) | 12% |

Event conditions filter the cruelest checks away from the young. Even so, the young adult (18 to 29) loses four checks in five, and one check in five is at the floor. These are a random bot's lives. A careful player picks easier checks, which only a league with personalities can measure.

### The backtest table

| Metric | Reference game value or practice | Ardan today | Target for a 10 | How to measure in Ardan |
| --- | --- | --- | --- | --- |
| **P1. Shown vs real duel odds** | Battle Brothers: shown = rolled. XCOM 2: bent only on purpose, toward the player, off on Legend | Lab: mean error 5.7 pts, worst bin 12.1; screen scale 12, real 8.7. Real lives: fights shown as even won 9%, all fights shown at 52% won 27%. 92% of NPCs are stored unarmed and gain a median 24 worth when armed; health ignored | Lab: every bin of ≥50 pairs within 3 pts, both seats. Real lives: every shown-odds band within 5 pts of results over 100+ lives | Bot: calibration study in CI (2,500 pairs × both seats) plus a 100-life league logging every fight's shown odds |
| **P2. One- and two-tier win rates** | Battle Brothers writes tiers relative to each other; Bannerlord's tiers are too close (1.7× from T1 to T5) and elites die to looters | +1 tier 79.6%, +2 tiers 98.5% (same AI) | Declared in data (e.g. 78% / 93%) and met within ±3; the plan and `GD.TIERS` agree | Bot: same study, grouped by tier gap |
| **P3. Seat edge in a mirror duel** | Battle Brothers: only Beginner gets a flat +5, and it's documented | Player seat wins 48 to 55% of mirror event duels (release 57 to 62%), 47% of plain lethal duels, 43.5% of brawls; refuse-to-fall in 6 to 9% of lethal duels; none of it shown | 50 ± 3 in every rule set, or the edge shown in the odds | Bot: mirror test, 1,500 fights per rule set |
| **P4. One explanation per fight** | Battle Brothers' tooltip lists the factors that make the number | Pre-fight line and tier chip disagree in 7.6% of fights with gap ≥ 6 | 0% | Bot: compare `weighText` band with `vsYou` band on 2,000 pairs |
| **P5. Fights that go through a resolver** | Bannerlord: autoresolve vs hand battle disagree, and players notice | 6 group choices; 466 injury outcomes behind plain checks; 76 vs 76 in fight events | 100% of combat injuries and deaths through duel or group; 0 combat injuries behind non-combat skills | Static analysis: event linter rule, fails the build |
| **P6. Tier claims that hold** | Battle Brothers dev blogs place each new enemy against an old one | 6 of 13 claims hold and 1 half-holds. 6 clash: 2 inside the game's own data, 4 between plan and game | 13 of 13, each one a test | Bot: claims test (duel + group + beast) |
| **P7. Tier width spread** | No fixed reference; Battle Brothers' defense above 50 counts half, a documented cliff | Widths 10, 13, 14, 14, then 27 (Master to Legend) | Equal widths, or the cliff named in the tier text | Static analysis on `GD.TIERS` |
| **P8. Wounds move worth** | KCD: injuries cut stats and the combat you can do (wiki) | Lost hand: swordsman −14 worth, spearman −3; limp −2 | Every permanent wound moves worth by its stated amount for every weapon kind | Bot: wound test per weapon kind |
| **P9. Who can read the stronger fighter** | Battle Brothers and KCD let you read armor and stats at a glance | Unmeasured | 9 of 10 picks right from the screen alone, 12 players | Human playtest |
| **B1. Path targets on record** | Slay the Spire's characters land within a few points (17 to 24% official; 16.9 to 18.2% in a 1.1M-run sample) | None. No targets file, no league in the repo. 4-life samples per start give median death ages from 21.5 to 71.5 | 7 paths × 4 measures as data; every path within 10% of target for 3 builds | Bot league in CI |
| **B2. League size** | Slay the Spire logged every decision from the prototype | 0 in the repo; this doc ran 48 lives (24 of them valid) at 15 to 25 s each | 1,000 lives per path × 4 personalities, nightly | Bot |
| **B9. Fights the game starts that the player can't win** | Battle Brothers shows contract danger before you sign; FTL lets you jump away | Random-bot lives won 0 of 22 beast fights and 9% of "even" duels; nothing warned them | Every forced fight shows its true odds and an exit (flee, pay, yield) before the first blow | Bot lives + browser test on the duel screen |
| **B3. Difficulty axes beyond death** | FTL: scrap, AI targeting, scaling speed, boss design. Battle Brothers: separate combat and economic settings. XCOM 2: assist by difficulty. Slay the Spire: 20 named stacked rules | 0 (mortality and score only) | ≥3 named axes (information, recovery, AI pressure), each moving a measured outcome ≥15% | Bot A/B per mode; browser test for the information axis |
| **B4. Check odds a life meets** | Fire Emblem and XCOM 2 bend high odds up because people misjudge them | Met checks: median 30% at 13 to 17, 19% at 18 to 29 (19% at the floor), 27.5% at 30 to 49. As written, 60% of checks sit at the floor for a 16-year-old | Median 35 to 65% at every life stage; under 10% at the floor | Bot lives (100+), per personality |
| **B5. Hidden balance multipliers** | Battle Brothers players had to mod in a tooltip for every hit factor; that is the cost of hiding | At least 4: commoner promotion ×0.2 (shown as a hard requirement), duel seat rules, underdog catch-up (closes half the gap, not 95%), refuse-to-fall | 0 not shown in a tooltip | Static analysis: grep for multipliers on outcome paths, each mapped to a tooltip |
| **B6. Dominant strategies** | Slay the Spire watches pick rates; a card nobody picks gets fixed | Unmeasured (the plan's "careful soldier reached Marshal in 9 of 20" was found late) | No action in >50% of the top decile of runs | Bot league with 4 personalities |
| **B7. Opt-in challenge ladder** | Ascension: 20 levels, A0 won 9%, A20 3% | None | 10 named levels with published bot win rates | Bot |
| **B8. Human balance** | Mega Crit used community feedback across a year of Early Access | 0 recorded runs | 20 recorded runs per phase; no quits in the first 30 min; no dominant strategy | Human playtest |

## 4. North star

With unlimited time, money and people, Ardan's power and balance look like this.

**One law of strength, everywhere.** A single worth-to-strength curve (`GD.STR_CURVE`, tuned once) drives everything:

- the duel and the skirmish resolver (2 to 40 a side);
- the war sim's unit quality;
- beast tiers;
- every event fight.

A consistency suite proves they agree. A duel-simulated 3-on-1 lands within 5 points of the group resolver. A Trained man alone beats animal-tier beasts at the rate the bestiary says. There are no plain skill checks for violence, so a knife in a dark alley rolls fighting worth plus perception, not intrigue.

**The Measure, on every fight screen.** Two columns show body, skill and gear for each side, plus tier chips and the three biggest edges (reach, armor, fatigue, ground) with their sizes. One honest line reads: "Men like you beat men like him about 31 times in 100." After the fight, "Why it went that way" names the three causes, taken from the duel log's real modifiers.

**Belief and truth.** On Realism the number is a rumor until you have seen him fight: "they say he killed four at Varn bridge." Once you have seen him, it becomes the true figure. This ties power to the game's signature system.

**A census that matches the lore.** The world keeps about 5 Legends and 1 or 2 Masters per realm, as the game's text says. Elite orders hold their stated size. The "Living Blades" screen in the Chronicle lists the 30 best fighters in Ardan with tiers, deeds and who killed whom. World generation and aging hold those numbers, and a test checks every 10 years of a 200-year sim.

**Balance as a dashboard.** `balance/targets.json` holds 7 paths (soldier, merchant, noble, priest, scholar, criminal, ruler). Each has a median death age, wealth at 40, rank at 40 and a top-seat rate. A nightly league of 28,000 lives (7 paths × 4 personalities × 1,000) takes about 117 CPU-hours at the measured 15 to 25 seconds a life, or about 4 hours on 32 cores. It publishes a dashboard and fails the build on drift over 10%. Opted-in players send anonymous run summaries, like Slay the Spire's metric server. Any event choice taken under 5% or over 80% of the time is flagged for a rewrite.

**Difficulty that changes decisions.**

- **Story:** exact odds, faster recovery, gentler AI rulers.
- **Hard:** odds as words.
- **Realism:** odds only as body language, slow healing, and the AI presses every advantage.

On top sits **Trials**, an Ascension-style ladder of 10 named rules unlocked by finishing a life ("The Lean Years: harvests yield a fifth less"). Each Trial's bot win rate is published.

**People, every phase.** 20 recorded human runs, a 12-player test of reading the stronger fighter from the screen, and a balance designer who owns the dashboard.

## 5. What to build now

Ranked by score gain per unit of effort. "Here" means it can be built in this repo as a feature folder (`patches.mjs`, `*.core.js`, `*.events.js`, `test.mjs`) per CLAUDE.md.

| # | Feature | Aspect | Effort | Built here? | Gain | Acceptance test (must be able to fail) |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | **Make the shown duel odds true.** (a) Give every NPC their everyday weapon when they are created or reach adulthood, so `A.armFor` stops changing fighters after you look. It must be seeded from the person's id, as `ENG-STYLE-RNG` did, because rendering must not draw random numbers. (b) Make worth and odds read current health. (c) Replace `UI.vsYou`'s `/12` with a curve fitted from simulation per worth gap and seat; scale 8.7 fits within 2.5 pts RMSE. (d) Show the same % on the duel screen. | Power | M | Yes: patch + `*.core.js` | +1.5 | Lab test: 2,500 pairs, both seats; every bin with n ≥ 50 within 3 pts of shown. Life test: 100 bot lives; each shown-odds band (under 35, 35 to 65, 65 up) within 5 pts of results. Both fail the build otherwise. Today the life test fails by 40 pts in the middle band |
| 2 | **One pre-fight explanation.** `A.weighText` reads the same worth gap (with gear) and the same % as the chip. | Power | S | Yes: patch | +0.3 | 2,000 random pairs: 0 disagreements between the weighText band and the vsYou band |
| 3 | **Tier-claims test.** Encode every sentence in `GD.TIERS` and `GD.TIER_INFO` as an assertion against the duel, group and beast resolvers. Fix the 6 clashes: retag The Roc and Forest Men as great; either give animal hunts a party by default or change "one trained fighter can kill it" to the measured 1 in 4; fix the plan's 3-vs-Elite, 73/92, Legend and Master counts to match the game. | Power | M | Yes: patch + test | +1.0 | Test fails if any claim is off by >10 pts; today 6 of 13 fail and a 7th half-fails |
| 4 | **Fight-resolver lint, then routing.** Add a linter rule that flags any choice in a fight event whose lose branch wounds or costs ≥20 health without `duel`, `beast` or `group`. Convert the 76 combat-injury checks to `group:` or `duel:`, starting with the most-fired. | Power | M | Yes: `*.events.js` overrides + linter rule (needs a `tools/` owner's sign-off) | +1.0 | Linter count of flagged choices goes from 76 to 0; a bot life shows group or duel odds on every fight it meets |
| 5 | **Seat rules made explicit.** Pick the player-seat rules (refuse-to-fall yes or no, NPC yield threshold, brawl asymmetry) and either remove the edge or fold it into the shown odds. Tooltip on the duel screen. | Power, Balance | S | Yes: patch + test | +0.5 | Mirror test: seat A wins 50 ± 3 in every rule set, or within 3 pts of the odds shown for that rule set |
| 6 | **Path targets and the bot league.** `bench/balance-league.mjs`: 6 starts × 4 personalities (careful, greedy, reckless, random) × N lives, writing `reports/balance.json` against `balance/targets.json`. Start with the measures in this doc's life baseline. | Balance | M | Yes: code (bench/ owner) | +1.0 | Two runs on the same build give identical numbers; changing one constant (e.g. the promotion gate) moves a target by >10% and the gate fails |
| 7 | **Difficulty that changes decisions.** Story shows exact odds; Hard shows words (`risk` already exists in `eventView`); Realism hides digits and slows healing. Each axis has a named line on the setup screen. | Balance | M | Yes: patch + `*.core.js` | +1.0 | Browser test: same seed and event, Story shows "NN%", Realism shows no digit. Bot test: days from health 30 to 80 differ ≥30% between Story and Realism |
| 8 | **Age-fair checks.** A life-stage offset on `d` (children −15, teens −8, under-30 −5), or age-aware difficulties in the events young lives meet. | Balance | S | Yes: patch | +0.5 | 100 bot lives: median odds of checks met at 13 to 17 and at 18 to 29 both between 35 and 65%, under 10% at the floor. Today: 30% and 19%, with 14% and 19% at the floor |
| 9 | **Show hidden multipliers.** Tooltips for commoner promotion (×0.2 at rank 8+), the underdog catch-up, refuse-to-fall, and the NPC yield. Fix or remove the catch-up cap (it closes half the gap, not 95%). | Balance | S | Yes: patch | +0.4 | Static check: each named multiplier's source line maps to a tooltip id; browser test opens each tooltip |
| 10 | **Wounds by weapon kind.** Add spear, axe, mace and polearm penalties to `lost_hand` and `lost_fingers`; state the tier cost on the profile. | Power | S | Yes: patch | +0.3 | Test: a lost hand costs ≥1 tier for every melee weapon kind |
| 11 | **Trials ladder.** 10 named, stacked rules unlocked by finishing a life, each with a score multiplier and a published bot win rate. | Balance | M | Yes: `*.core.js` | +0.5 | Each Trial moves its bot measure in the stated direction by ≥5% over 200 lives |
| 12 | **20 recorded human runs and the 12-player readability test.** | Both | L | Needs people | +1.0 | 9 of 10 picks right from the screen; 0 quits in the first 30 min |
| 13 | **Opt-in run summaries.** A local "share my run" export first (here); a server to collect them later. | Balance | L | Export: yes (code). Server: needs people | +0.5 | An export replays to the same death age and wealth at 40 |

With 1 to 11 built and their tests green, I expect Power to reach about 8 and Balance about 7. The rest needs the people in rows 12 and 13: no game earns a 10 for readable power or for balance until real players have shown it.

## 6. Sources

**Kingdom Come: Deliverance**
- Master Strike: https://kingdomcomedeliverance.wiki.gg/wiki/Master_Strike
- Combat: https://kingdomcomedeliverance.wiki.gg/wiki/Combat
- Perfect Block: https://kingdom-come-deliverance.fandom.com/wiki/Perfect_Block
- Skills (KCD): https://kingdom-come-deliverance.fandom.com/wiki/Skills_(KCD)
- Bernard: https://kingdomcomedeliverance.wiki.gg/wiki/Bernard
- False Edge: https://kingdomcomedeliverance.wiki.gg/wiki/False_Edge
- KCD2 skills: https://www.powerpyx.com/kingdom-come-deliverance-2-how-to-level-up-all-stats-skills/
- KCD2 Hardcore mode: https://www.powerpyx.com/kingdom-come-deliverance-2-hardcore-mode-guide/
- KCD2 Hardcore mode news: https://itc.ua/en/news/kingdom-come-deliverance-2-will-get-a-hardcore-mode-without-interface-compass-and-autosave
- Fighter achievement guide: https://www.trueachievements.com/a247591/fighter-achievement

**Mount & Blade II: Bannerlord**
- CombatSimulationModel API: https://apidoc.bannerlord.com/v/1.2.7/class_tale_worlds_1_1_campaign_system_1_1_component_interfaces_1_1_combat_simulation_model.html
- Combat simulation gist: https://gist.github.com/jzebedee/be076d28f162c8d05fd7d2d72109a46f
- Simulations Fix: https://www.nexusmods.com/mountandblade2bannerlord/mods/1151
- Fixed Simulations: https://www.nexusmods.com/mountandblade2bannerlord/mods/12593
- Better Auto Calc: https://www.nexusmods.com/mountandblade2bannerlord/mods/673
- Auto Resolve Rebalanced: https://www.nexusmods.com/mountandblade2bannerlord/mods/3453
- Autoresolve discussion: https://steamcommunity.com/app/261550/discussions/0/3596716230234308872/

**Battle Brothers**
- Hit Chance: https://battlebrothers.fandom.com/wiki/Hit_Chance
- Combat Mechanics: https://battlebrothers.fandom.com/wiki/Combat_Mechanics
- Game Mechanics: https://battlebrothers.fandom.com/wiki/Game_Mechanics
- Difficulty differences (official forum): https://battlebrothersgame.com/forums/topic/difficulty-differences/
- Hit percentage discussion: https://steamcommunity.com/app/365360/discussions/0/3194747223958428022/
- Spear modifier discussion: https://steamcommunity.com/app/365360/discussions/0/3153060475180161988
- Dev Blog #143, Nomads: https://www.gamebanshee.com/3drdx
- Dev Blog #118, Barbarians Part II: https://gamebanshee.com/k4cpp
- Dev Blog #92, Late Game Crises: https://www.moddb.com/news/dev-blog-92-late-game-crises

**Slay the Spire**
- GDC 2019 talk (GDC Vault): https://gdcvault.com/play/1025731
- GDC 2019 talk announcement: https://gdconf.com/news/learn-slay-spires-successful-metrics-driven-approach-game-balancing-gdc-2019
- GDC 2019 talk video: https://www.youtube.com/watch?v=7rqfbvnO_H0
- How Mega Crit uses data: https://www.gamedeveloper.com/design/how-i-slay-the-spire-i-s-devs-use-data-to-balance-their-roguelike-deck-builder
- Ascension levels: https://i1.trueachievements.com/game/Slay-The-Spire/walkthrough/2
- Mega Crit's May 2026 dispatch, as reported: https://gamegeeker.com/fr/news/slay-the-spire-2-may-neows-news-update?market=FR
- 1.1M-run community sample: https://gamerofpassion.com/slay-the-spire-2-card-win-rates/

**FTL: Faster Than Light**
- Wikipedia: https://en.wikipedia.org/wiki/FTL:_Faster_Than_Light
- GDC 2013 postmortem: https://gdcvault.com/play/1019036
- Difficulty guide: https://gameslikefinder.com/article/ftl-difficulty/
- Steam guide "Calculated FTL": https://steamcommunity.com/sharedfiles/filedetails/?id=2127539536
- GOG forum: https://www.gog.com/forum/ftl_advanced_edition/difficulty_differences
- Subset forum: https://subsetgames.com/forum/viewtopic.php?t=3940

**XCOM 2**
- Jake Solomon on randomness: https://www.gamedeveloper.com/design/jake-solomon-explains-the-careful-use-of-randomness-in-i-xcom-2-i-
- Hidden aim bonus discussion: https://steamcommunity.com/app/268500/discussions/0/1474221865182585226/
- Aim assist discussion: https://steamcommunity.com/app/268500/discussions/0/2944746708998250511
- Commander+ guide: https://steamcommunity.com/sharedfiles/filedetails/?id=659299888
- Enhanced Hit Chance Displays mod: https://www.nexusmods.com/xcom2/mods/212

**Fire Emblem**
- True hit: https://fireemblemwiki.org/wiki/True_hit
- LT-maker difficulty options: https://lt-maker.readthedocs.io/en/latest/source/appendix/Difficulty-Mode-Options.html

**Sid Meier, GDC 2010**
- Kotaku: https://kotaku.com/civilization-creator-explains-why-everything-game-devs-5492078
- Game Developer: https://gamedeveloper.com/pc/gdc-sid-meier-s-lessons-on-gamer-psychology
- Museum of Play: https://www.museumofplay.org/blog/gdc-2010-game-psychology-101/

**Ardan**
- `docs/plan/Ardan The Road to Ten.md`
- `docs/reviews/Ardan Road to 100.md`
- `docs/reviews/Ardan Deep Analysis.md`
- Engine functions: `A.fightWorth`, `A.CR`, `UI.vsYou`, `A.weighText`, `A.duelAct`, `A.duelCheckEnd`, `A.duelAuto`, `A.groupOddsSides`, `A.strengthOf`, `A.checkOdds`, `A.eventChoose`, `A.mortalCheck`, `GD.TIERS`, `GD.TIER_INFO`, `GD.BEAST_TIER`, `GD.WOUNDS` (read with `node tools/show.mjs`)

Note on sourcing: this session's network blocked direct page fetches, so the pages above were read through a search index's summaries of them. Before quoting any of them in public, open the page itself.

## Appendix: how to reproduce the duel calibration

Port this into `bench/power-calibration.mjs` (it runs inside the page after `ARDAN_CONTENT_READY`):

```js
A.newGame({ seed: 5151, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 24 });
A.duelConsequences = () => [];                       // no wounds, deaths or fame from test duels
const pool = [...Array(400)].map((_, i) => { const p = A.makeFoe({ realm: 'POL-01', tier: 1 + i % 5 });
  p.npcTemp = false; A.S.people[p.id] ||= p; return { id: p.id, w: A.fightWorth(p) }; });
function duel(aId, bId) {                            // a sits in the player seat
  A.S.pc = aId; A.S.queue = [];
  const D = A.startDuel(A.P(aId), A.P(bId), { kind: 'duel', lethal: true, toYield: true, forceSolo: true });
  A.duelAuto(D); A.S.queue = [];
  return D.result === 'win' ? 1 : 0;                 // 'lose' and 'yield' are losses for seat a
}
// for each random pair (x, y): shown = 1/(1+exp(-(x.w-y.w)/12)); real = (duel(x,y) + 1 - duel(y,x)) / 2
// bin by worth gap; fail if any bin with n >= 50 is more than 3 points from shown
```
