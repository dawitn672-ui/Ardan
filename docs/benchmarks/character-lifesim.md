# Character and life sim: benchmark

Oct 13, 2026 · build `b593143` plus the 29 fix patches (`features/00-05`), measured in headless Chromium. Strict score going in (from "Ardan Road to 100"): **5**.

Every number about Ardan below was measured for this doc unless it names a review. Every claim about another game carries a link. Two caveats on those links:

- The sandbox could not open web pages directly (its proxy refused the wiki and forum hosts). Every claim about another game comes from search-engine excerpts of the linked page. Where only one excerpt gave a number, it says *(one source)*.
- Studios rarely publish formulas, so many links are fan wikis or forums. Those are marked *(community)*. Anything I could not source is marked *unverified* or left out.

## 1. The bar

A 10 means a player can say in one sentence how their character got better, and the sentence is true: "I fought, so I got better at fighting." Every number on the sheet changes things the player meets in a normal life, and the game can say why each number moved. The inner life (mood, stress, will, personality) has thresholds that make things happen, as RimWorld's breaks and CK3's stress do, instead of bars that drift with no effect. Each life stage plays differently, so the person at 70 is not the person at 30 with lower strength. And the character changes over the run in a way the player can read back, the way Wildermyth writes every change into a hero's history.

## 2. How the best do it

### Kingdom Come: Deliverance: learn by doing, with teachers and books as boosters

**Mechanism.** Skills and the four stats rise from use. The guides list:

- Strength from melee fighting and from walking while overloaded.
- Vitality from running, climbing and surviving fights.
- Agility from stealth and dodging.
- Speech from each new line of dialogue and from winning speech checks.

These come from KCD2 guides ([PowerPyx](https://www.powerpyx.com/kingdom-come-deliverance-2-how-to-level-up-all-stats-skills/), [GamingBolt](https://gamingbolt.com/kingdom-come-deliverance-2-guide-heres-how-to-level-up-all-player-skills-and-statistics), *community*). The first game's wiki calls it a classless system where skills grow "organically through use" ([KCD wiki, Skills](https://kingdomcomedeliverance.wiki.gg/wiki/Skills), *community*).

**Numbers.**

- **Caps and perks.** KCD1 caps every skill at 20. KCD2 caps at 30 and gives a perk point every two levels from level 6, so 13 per skill ([gamepressure](https://www.gamepressure.com/kingdom-come-deliverance-2/skill-trainers/z2117cf), [Ludo guide](https://www.ludo.guide/guide/kingdom-come-deliverance-ii/getting-started/gameplay/earning-and-spending-perk-points), *community*).
- **Trainers.** KCD2 trainers sell experience in four tiers: 100, 500, 1,500 and 5,000 groschen ([gamepressure](https://www.gamepressure.com/kingdom-come-deliverance-2/skill-trainers/z2117cf), *community*).
- **Gated skills.** Reading and pickpocketing must be taught before use can raise them ([Fextralife, Skills](https://kingdomcomedeliverance.wiki.fextralife.com/Skills), *community*).
- **Books.** A skill book pays its experience out over in-game reading time, with a daily limit. You can read faster, but the total is fixed. A first read of a lore book, recipe or map gives a flat 30 Reading XP ([KCD wiki, Reading](https://kingdomcomedeliverance.wiki.gg/wiki/Reading), *community*).

**Needs.** Nourishment is a 0 to 100 meter.

- Below 50, Henry is hungry and loses stamina.
- At 0 he loses about 2 health an hour.
- Above 100, overeating cuts maximum stamina.

Sources: [Fextralife, Nourishment](https://kingdomcomedeliverance.wiki.fextralife.com/Nourishment), [KCD wiki, Overeating](https://kingdomcomedeliverance.wiki.gg/wiki/Overeating), *community*.

**Lesson for Ardan.** In KCD, use is the engine. Teachers, books and money are boosters, and each one has a cost or a cap. Ardan does it the other way round. **Half of all skill points (50%) come from a daily training plan that runs by itself** (section 3). If the player never sets it, the game picks the target from their job. Ardan already has KCD's boosters: a teacher can add up to +50% to a training session, a habit up to +20%, and skills over 30 rust when unused (`A.sessionQ`, `A.growthYear`). What is wrong is the weights, not the parts.

### Crusader Kings III: lifestyles, and stress from acting against your nature

**Lifestyles.** There are five lifestyles with three perk trees each. You pick a focus, experience builds, and you unlock "a new perk every few years" ([Dev Diary #09](https://forum.paradoxplaza.com/forum/developer-diary/ck3-dev-diary-09-lifestyles.1308005/)). The Learning diary says one tree takes about 25 years to finish without bonuses ([Dev Diary #13](https://forum.paradoxplaza.com/forum/developer-diary/ck3-dev-diary-13-the-learning-lifestyle.1326963/), *one source*). Finishing a tree grants a trait ([PCGamesN](https://www.pcgamesn.com/crusader-kings-3/lifestyle-system), [GameWatcher](https://www.gamewatcher.com/news/crusader-kings-3-lifestyle-and-perks), *community*). The Wandering lifestyle (Wandering Nobles) has 27 perks across 3 trees. The team wanted it to "require engagement": fewer passive bonuses, with most gains coming from travel and activities ([Dev Diary #158](https://admin-forum.paradoxplaza.com/forum/developer-diary/dev-diary-158-wandering-nobles.1710648), [#159](https://steamcommunity.com/games/1158310/announcements/detail/4517765223386176015)).

**Stress.** Acting against your personality is the main way to gain stress. A Compassionate ruler gains stress for executing prisoners, even traitors ([Dev Diary #31](https://forum.paradoxplaza.com/forum/developer-diary/ck3-dev-diary-31-a-stressful-situation.1399764/?prdxDevPosts=1)).

- **Stress balances traits.** Strong traits like Ambitious and Compassionate cost stress more often (same diary).
- **Levels.** Stress builds through three levels of about 100 points each ([Game Rant](https://gamerant.com/ck3-crusader-kings-3-how-check-reduce-stress-levels/), [FandomSpot](https://www.fandomspot.com/ck3-reduce-stress/), *community*). Each level hurts health and fertility more, and level 3 "can lead your character to an early grave" (Dev Diary #31).
- **Mental breaks.** Each new level brings a mental break: an event where the character does something drastic for relief. A break often grants a coping trait such as Rakish, Drunkard, Flagellant or Comfort Eater. Each coping trait comes with its own decision to relieve stress. The developers expect most rulers to gain only one or two coping traits in a lifetime (Dev Diary #31).

**Childhood.** A child's childhood trait suits some educations and not others. A guardian adds to the chance of a good education, and the education trait is fixed at 16 ([GameWatcher](https://www.gamewatcher.com/crusader-kings-3-traits), [Paradox forum](https://forum.paradoxplaza.com/forum/threads/how-to-educate-your-children-in-desirable-direction.1421223/), *community*).

**Lesson for Ardan.**

- **Traits should cost something.** CK3 traits matter because they push back on your choices. **In Ardan, 15 of 40 personality traits are never read anywhere by name.** Only 20 event conditions or choice requirements read a trait at all, across 3,199 events. Ardan already tags behaviour in its choices (cruel, kind, cautious and so on, through `fx.trait`). A "this goes against your nature" cost on those choices is cheap to add.
- **One plan, not four layers.** CK3's lifestyle is one choice that pays out slowly. Ardan's "Your days" panel stacks a training target (44 options), an intensity (5), free hours (13 aims) and initiative (28 or more activities).

### The Sims 4: needs, moodlets, emotions, and identity from behaviour

**Needs to moodlets.** Each of the six needs makes a timed moodlet with a weight when it runs low ([Sims Wiki, Motive](https://sims.fandom.com/wiki/Motive), *community*):

- Hungry: +1 Uncomfortable for 24 hours. Ravenous: +40.
- Lonely: +1 or +2 Sad for 24 hours.
- Tired: +1 Uncomfortable for 3 hours.

The Sim's emotion is the emotion with the highest total moodlet weight ([Sims Wiki, Emotion](https://sims.fandom.com/wiki/Emotion), *community*). Emotion changes how fast skills grow: the skill's ideal emotion gives about +20% over Happy, and Tense slows every skill ([Carl's guide](https://www.carls-sims-4-guide.com/skills/skill-emotion.php), *community*).

**Identity from behaviour.**

- **Lifestyles** (Snowy Escape) come from repeated behaviour. You need 100 points at up to about 20 a day, so about five days, and they decay about 5 a day. Workaholic, for example, comes from working hard and skipping days off, and it changes how the Sim acts ([Carl's guide, Lifestyles](https://www.carls-sims-4-guide.com/expansionpacks/snowyescape/lifestyles.php), [Game Rant](https://gamerant.com/the-sims-4-snowy-escape-lifestyles-guide/), *community*).
- **Character values** (Parenthood) are five meters: Manners, Responsibility, Empathy, Conflict Resolution and Emotional Control. A child's own actions and the parents' praise move them. At age-up they lock into permanent adult traits such as Good Manners or Rude ([SimsCommunity](https://simscommunity.info/2017/05/23/learn-about-character-values-the-sims-4-parenthood-blog-post/), [GGRecon](https://www.ggrecon.com/guides/sims4-character-value-cheats/), *community*).

**Stages.** On normal lifespan, the stages last (in Sim days) child 14, teen 21, young adult 28, adult 42 and elder 14, per the 2023 table ([SimsCommunity](https://simscommunity.info/2023/03/15/the-sims-4-life-span-update-sim-age/), *community*). Children have their own skills that go to level 10 ([EA help, child skills](https://help.ea.com/fi/articles/the-sims/the-sims-4/child-skills/)).

**The warning.** A modder's critique says base-game emotions "flip about on four hour timers" with nothing affecting mood for long ([Emotional Inertia mod](https://roburky.itch.io/sims4-emotional-inertia), *community*).

**Lesson for Ardan.** **Ardan's happiness is one number with no reasons. 1,774 events write it; 0 events read it.** The engine reads it in only two places: job performance (±10 at the extremes) and training quality (×0.88 below 30, ×1.06 above 75). The portrait's mouth also uses it. The Sims names every reason and gives it a timer. It also turns repeated behaviour into identity, so a Workaholic is a Workaholic because they worked. The warning applies too. Ardan runs in months and years, so its "thoughts" should last months, not hours.

### RimWorld: needs, thoughts, thresholds, breaks, inspirations

**Mood and breaks.** Mood is the sum of "thoughts", each with a cause and a duration ([Thoughts](https://rimworldwiki.com/wiki/Thoughts), *community*). The base break threshold is 35% mood, with major breaks at 20% and extreme ones at 5%. The mean time to a break is about 10 days, 3 days and 0.7 days below each threshold. Traits move the threshold: Iron-willed −18%, Steadfast −9%, Nervous +8% ([RimWorld wiki, Mental break](https://rimworldwiki.com/wiki/Mental_break), [Mental Break Threshold](https://rimworldwiki.com/wiki/Mental_Break_Threshold), *community*).

**Recovery and highs.**

- **Catharsis.** After a break, a pawn gets a +40 "Catharsis" thought for about 3 days, which usually stops a spiral of breaks (Mental break page, *community*).
- **Inspiration.** Above 49% mood a pawn can be inspired. The mean time between inspirations falls from 210 days at 50% mood to 10 days at 100% ([Mental inspiration](https://rimworldwiki.com/wiki/Mental_inspiration), *community*).

**Needs.** Food, rest, recreation, comfort, beauty and outdoors. An unmet recreation need costs −5 to −20 mood ([Needs](https://rimworldwiki.com/wiki/Needs), *community*).

**Skills.**

- **Passion.** None learns at 35% speed. Minor learns at 100% and gives +8 mood while doing that work. Major learns at 150% and gives +14 ([Passion](https://rimworldwiki.com/wiki/Passion), *community*).
- **A daily cap.** Above 4,000 XP a day in one skill, further gains are cut to 20%.
- **Decay.** Skills above level 10 decay ([Skills](https://rimworldwiki.com/wiki/Skills), *community*).

**Design intent.** Tynan Sylvester's GDC 2017 talk frames RimWorld as a story generator, where "the mechanics must include loss and recovery" ([GDC Vault](https://www.gdcvault.com/play/1024232/-RimWorld-Contrarian-Ridiculous-and), [slides](https://media.gdcvault.com/gdc2017/Presentations/Sylvester_Tynan_RimWorld_Contrarian_Ridiculous.pdf)).

**Lesson for Ardan.** **In 30 of 48 bot lives, happiness stayed under 30 for 12 months or more in a row, and nothing happened. The longest stretch was 250 months, nearly 21 years.** RimWorld would have turned the first month of that into a story (a break), then a recovery (catharsis). Ardan's skill rust already matches RimWorld's decay; keep it. If use becomes Ardan's main source of growth, it also needs RimWorld's daily cap, or grinding becomes the best play.

### BitLife: four bars, one tap a year, and stages that gate what you can do

**Mechanism.** The sheet is four bars from 0 to 100: Happiness, Health, Smarts and Looks. Fame and Approval bars arrived in later updates ([BitLife wiki, Stats](https://bitlife-life-simulator.fandom.com/wiki/Stats), *community*). Activities stay greyed out until the minimum age, and many open at 18 ([BitLife wiki, Activities](https://bitlife-life-simulator.fandom.com/wiki/Activities), *community*). Hidden stats change outcomes without being shown:

- Discipline affects school and work performance and the risk of addiction ([Prima Games](https://primagames.com/tips/what-does-discipline-mean-in-bitlife-answered), *community*).
- Karma and willpower are hidden too ([LevelWinner](https://www.levelwinner.com/?p=32943), *community*).

A 2018 forum thread says the gym and library pay out once a year or once every five years, and that going more often only gives happiness ([AppleVis](https://www.applevis.com/comment/93350), *community, may be out of date*).

**Lesson for Ardan.**

- **Fewer numbers.** BitLife shows a whole life sim can read from 4 bars. **Ardan's Life tab, for a new 25-year-old on a 1,500 px screen, renders 919 words, 114 numbers and 59 controls.** The training menu alone lists 44 targets.
- **Gate by stage.** BitLife hides what a child can't do. Ardan's activity list has only two actions limited to childhood (play until 13, chores until 15) and **none limited to old age**.
- **No cliff at 16.** BitLife ages you through stages. Ardan drops you off a cliff on your 16th birthday: the median odds of the checks you are offered fall **from 35% at 15 to 17% at 16** (section 3).

### The Elder Scrolls: use-based skills, and how they go wrong

**Skyrim.**

- **Character level.** Skills rise from use. Each skill level gained adds that many points to character experience, and a level costs 75 + 25 × the current level ([UESP, Leveling](https://en.uesp.net/wiki/Skyrim:Leveling)).
- **Perks.** Each character level gives one perk point. There are 180 perks, or 251 counting ranks ([UESP, Skill Books](https://pt.uesp.net/wiki/Skyrim:Skill_Books)).
- **Trainers.** You can train 5 times per character level, and trainers stop at skill 90 ([UESP, Trainers](https://En.UESP.net/wiki/Skyrim:Trainers)).
- **Books.** Each of the 90 skill books gives +1 to its skill on the first read (UESP, Skill Books).
- **Cutting attributes.** Lead designer Bruce Nesmith on cutting attributes: "We got rid of attributes in Skyrim and you know who complained? Almost nobody" ([PC Gamer](https://www.pcgamer.com/games/the-elder-scrolls/bethesda-veteran-says-less-rpg-complexity-in-the-elder-scrolls-series-is-good-actually-we-got-rid-of-attributes-in-skyrim-and-you-know-who-complained-almost-nobody/)).

**Oblivion shows the failure modes.**

- **Grinding.** Athletics rose 0.03 points a second while running and 0.04 while swimming, so players auto-ran into walls ([UESP, Athletics talk](https://content1.uesp.net/wiki/Oblivion_talk:Athletics)).
- **Min-maxing.** Attribute bonuses depended on counting skill increases between level-ups (10 increases for +5), so players planned their skill use around the counter ([UESP, Efficient Leveling](https://en.uesp.net/wiki/Oblivion:Efficient_Leveling)).
- **The fix.** The 2025 remaster moved to Skyrim-style leveling ([UESP, Remastered Leveling](https://app.uesp.net/wiki/Oblivion:Remastered_Leveling)).

**Lesson for Ardan.**

- **Use alone invites grinding.** Every boost needs a cap: Skyrim allows 5 trainings per level, KCD's books have a daily limit, and RimWorld cuts gains to 20% after 4,000 XP a day.
- **Cutting systems costs little.** Skyrim cut a whole system and almost nobody missed it.

Ardan's daily plan can't be ground today because it runs on its own. Once use drives growth, the caps must come with it.

### Wildermyth: characters that change over a campaign, with the history written down

**Mechanism.**

- **History.** Each hero starts with three history lines (origin, anecdote, motivation) that set stats and seed "hooks". Later events add lines that can change aspects, stats and hooks ([Wildermyth wiki, History](https://wildermyth.com/wiki/History)).
- **Personality.** Event choices raise personality stats. In one event, one option raises Loner while the other raises Romantic and Healer ([Neoseeker, Hostile Site Events](https://www.neoseeker.com/wildermyth/Hostile_Site_Events), *community*). The top personality values decide a hero's role and voice in events ([Steam discussion](https://steamcommunity.com/app/763890/discussions/0/4241812037674029611/), *community*).
- **Transformations.** Heroes can be transformed, such as Wolftouched or Crystalline ([Wolftouched](https://wildermyth.com/wiki/Wolftouched), [Crystalline](https://wildermyth.com/wiki/Crystalline)).
- **Aging and legacy.** Heroes age between chapters and retire. One review puts the base retirement age at 45 ([PressReader](https://www.pressreader.com/usa/arkansas-democrat-gazette/20210823/282857964001559), *one source*). Retired heroes enter a legacy and can return in later campaigns; higher legacy tiers bring back more abilities ([Wildermyth wiki, Legacy](https://wildermyth.com/wiki/Legacy)).

**Design intent.** Nate Austin's GDC 2022 talk is about getting players invested in procedural characters. It covers avoiding a "breach of trust" and characters "acting out of character". Its slides say a good ensemble character has a memorable name, cares about something, and has personality and quirks ([GDC Vault](https://www.gdcvault.com/play/1027614/Independent-Games-Summit-Session-Getting), [slides](https://media.gdcvault.com/GDC+2022/Speaker+Slides/GettingPlayersEmotionally_Austin_Nate.pdf)).

**Lesson for Ardan.** **Ardan changes the player's personality traits 4.7 times per life on average, and silently.** The effect code for `trait` adds the trait and prints nothing, and the opposite trait is dropped without a word. **By the end, the median life holds 6 traits; one held 13.** Wildermyth would have written each change into the hero's history, with its cause.

### Two shorter references

- **Darkest Dungeon.** At 100 stress a hero gets an affliction, or a virtue with a 25% base chance. At 200 the hero has a heart attack ([Darkest Dungeon wiki, Virtue](https://darkestdungeon.wiki.gg/wiki/Virtue), *community*). **Lesson:** resolve can go either way. Ardan's will can only go up: in 39 lives of 20+ years, it fell more than 3 points below its peak once.
- **Kenshi.** Toughness trains by getting hurt and losing fights. Dexterity XP is scaled by how much stronger the opponent is ([Kenshi wiki, Toughness](https://kenshi.fandom.com/wiki/Toughness), [Dexterity](https://kenshi.fandom.com/wiki/Dexterity), *community*). **Lesson:** Ardan's duel pays a flat +5 to your weapon skill whoever you fight. It does already have Kenshi's spirit in two places. Losing grows will, and beating a foe with a big edge over you (a gap over 8) gives a stat "breakthrough".

## 3. Backtest

### What I measured, and how

The test build was made with `node tools/build.mjs --out=<scratch> --unpack=<scratch>`, using the fix layer only. All scripts lived in a private scratch folder. Nothing in the repo changed except this file. The appendix has the procedure so it can be ported into `bench/`.

1. **Instrumented bot lives.** 48 lives: 8 starts (peasant, noble, merchant, serf, orc peasant, dwarf artisan, royal, artisan) × 4 personalities (careful, reckless, greedy, random) × engaged or passive. The pick rules are the same as `bench/bot.mjs`. Every life starts at birth and runs to death or 90 years. I wrapped five functions:
   - `A.trainSkill`, `A.train` and `A.willGrow`, logging each point the player gained and which function called it;
   - `A.addTrait` and `A.addWound`.

   A monthly hook sampled happiness and health. Every check offered was logged with age, shown odds, stat or skill and difficulty. None of the wrappers draws a random number.
2. **Static reads.** For all 3,199 events: which ones read or write happiness, traits, wounds, will, lifestyle and looks, and how many check choices use each stat and skill. For the engine: where traits and happiness are read.
3. **Screen density.** The text, numbers and controls on each tab for a new 25-year-old peasant at 1,500 px.
4. **A prototype of the fix.** The same 48 seeds with growth reweighted and a young-adult check offset, to see whether the targets in section 5 are reachable (results below).

### Key results

**Where skill points come from (48 lives, 21,537 skill points)**

| Source | All lives | Engaged | Passive |
| --- | --- | --- | --- |
| Training plan, daily and automatic (`A.planDay`, aim days and breakthroughs) | **50.3%** | 44.7% | 55.8% |
| Deliberate training (practice and study sessions, specs, drill) | 5.5% | 6.8% | 4.3% |
| Event outcome grants (`fx: { skill }`) | 11.8% | 10.3% | 13.2% |
| Doing: fighting (duels, group fights, missions) | 10.0% | 13.7% | 6.4% |
| Doing: practice from event checks (+1.5 per check) | 9.8% | 9.1% | 10.5% |
| Doing: job and work (`careerYear`, `pathMonth`) | 7.8% | 6.8% | 8.7% |
| Doing: chores, trade, crime, hunting | 4.8% | 8.5% | 1.1% |

- **Learning by doing is about a third.** Use (the four "doing" rows) supplies 32% of skill points. Training supplies 56%, and 50 of those points come from a plan that runs by itself every day. In stats, the automatic plan supplies 53.5%.
- **Per life**, training's median share is 60% (p10 41%, p90 78%).
- **What you grow is not what you are tested on.** I compared each life's 3 most-gained skills with the 3 skills its events asked about most. The median overlap is **1 of 3**, and **14 of 30 lives share none**.
- **Growth stops at 50.** For humans and orcs, the total of all skill levels runs 254 at 16, 387 at 25, 537 at 45, 561 at 55, and is flat after that, because rust balances new gains.

**Check odds by age (all check choices offered, 48 lives)**

| Age | Median odds shown | At the 4% floor | Median difficulty `d` |
| --- | --- | --- | --- |
| 12 | 40% | 6% | 24 |
| 13 to 15 | 34 to 41% | 9 to 15% | 28 to 35 |
| **16** | **17%** | **22%** | 42 |
| 17 to 19 | 16 to 19% | 19 to 25% | 42 to 43 |
| 20 to 29 | 25% | 17% | 43 |
| 30 to 44 | 30% | 13% | 45 |
| 45 to 59 | 36% | 12% | 45 |

- **A cliff on the 16th birthday.** Child events use child difficulties (median `d` 30), but at 16 the adult events arrive at 45 and the odds halve overnight. That year the player has the least skill and gets the most tests.
- **Comparison with the reviews.** The Deep Analysis reported a 4 to 8% median for 16-year-olds on the release build, counting a different set of checks. Both are far below the Road to 100 gate of 35 to 65%.

**Mood, will and personality (48 lives, 24,647 monthly samples)**

| Measure | Result |
| --- | --- |
| Events whose condition reads happiness | **0** (1,774 events write it) |
| Engine reads of happiness | 2: job performance ±10, training ×0.88/×1.06 (plus the portrait's mouth) |
| Months with happiness under 30 | 20.7% |
| Lives with 12+ consecutive months under 30 | **30 of 48**; longest run 250 months |
| Median happiness by decade of age | 58 (0s), 49 (10s), **32 (20s)**, 41 (30s), 46 (40s), 50 (50s), 43 (60s) |
| Will, median at 10 / 16 / 25 / 40 / 55 / 70 | 19 / 31 / 40 / 59 / 66 / **79** |
| Lives (20+ years) where will ever fell >3 below its peak | **1 of 39** |
| Where will came from | events 58%, defeats 19%, grief 5%, near-death 4%, prison 3% |
| Will's weight in checks | 910 check choices use it, more than any other stat or skill (intelligence 845, persuasion 755). A life is offered a median 89 will checks |
| Trait gains per life | mean 4.7, median 4, max 11; **0 shown with a reason** |
| Traits held at death | median 6, max 13; 32 of 48 lives end with 6 or more |
| Personality traits never read by name in engine or events | **15 of 40** (content, zealous, cynical, generous, loyal, fickle, humble, trusting, vengeful, forgiving, arbitrary, cautious, romantic, witty, honorable) |
| Traits with any stat effect | 11 of 40 (±1 to ±4), plus diligent and lazy (training ±15%) |

That last-but-one row comes from searching by name, so a trait read through a computed list could be missed. Note too that "cautious" is written by 40 events and read by none.

**Body and health**

| Measure | Result |
| --- | --- |
| Health, % of maximum, monthly | median 97%; under 50% in 11.7% of months |
| Max health with age (humans and orcs) | 100 through 45, then 94 at 55, 82 at 65, 70 at 75 |
| Stats with age (median, 25 → 65) | strength 32 → 18, speed 27 → 14, stamina 29 → 15, instinct flat at 35 to 38; intelligence peaks at 41 (45 to 55) and is 29 at 75 |
| Wounds per life | median 5, max 17 |
| Events that write a wound / read one | **380 / 1** |
| Diseases | 7, each a single damage roll in `A.bodyYear`; no treatment choice |
| Lifestyle tiers (food, comfort) / events that read lifestyle | 5 / **0** |

Aging stat by stat is the strongest part of this aspect. It is believable, it differs by race (`GD.RACES` old ages from 45 for orcs to 350 for elves), and it is visible on the sheet.

**Dead numbers: check choices offered per 40+-year life (23 lives, median)**

| Offered | Stats and skills |
| --- | --- |
| 50 or more | persuasion 97, wil 89, int 88, diplomacy 59 |
| 5 to 49 | intrigue 38, ins 36, sta 33, stealth 33, trade 32, learning 28, spd 27, craft 19, str 18, deception 16, survival 15, etiquette 14, command 13, intimidation 12, athletics 11, tracking 9, faith 8, medicine 6, husbandry 6, music 5 |
| **Under 5 (20 of 44)** | melee 4, unarmed 4, sea 3, tactics 3, stewardship 3, gambling 3, bow 1, riding 1, and **0** for sword, axe, spear, dagger, dual wield, shield, lance, mounted, crossbow, throwing, logistics, siegecraft |

The 12 weapon skills do decide duels (a median 5 per life, 7 when the bot seeks fights). Logistics and siegecraft feed the war and holdings layers, which most lives never reach. Even so, the plan's own gate ("every stat and skill touches at least 5 outcomes per life") fails for 20 of 44.

**Life stages**

| Stage | Events per year (median) | Actions only this stage has |
| --- | --- | --- |
| Infant | 0.5 | 0 |
| Child | 2.6 | 2 (play, chores) |
| Teen | 4.7 | 0 |
| Adult | 5.5 | 0 |
| Old | 5.5 | **0** |

Static counts: 146 events require child or teen, and 41 require old age (`bench` counts 217 and 41 with its own patterns).

**Screen density (new 25-year-old peasant, desktop)**

| Tab | Words | Numbers | Controls |
| --- | --- | --- | --- |
| Life (the character) | 919 | 114 | 59 |
| Life → Decisions | 782 | 92 | 30 |

The Life tab holds 6 condition bars, 6 stats and the 5 best skills. Below them sit a training target picker with 44 options, 5 intensities, 13 "free hours" aims and 28 activities. Its first "What now" item is "Choose what to train", so the game's top advice feeds the system that crowds out learning by doing.

### Prototype: can the targets be reached without breaking the curve?

PROTOTYPE_RESULTS

### The backtest table

| Metric | Reference game value or practice | Ardan today | Target for a 10 | How to measure in Ardan |
| --- | --- | --- | --- | --- |
| Share of skill growth from use | KCD: all stats and skills grow by use; trainers and books are paid, capped boosters. Skyrim: use, plus 5 trainings per level | **32%** use, 12% event grants, **56%** training (50% from the automatic daily plan) | ≥ 60% from use; automatic training ≤ 20% | Bot: wrap `A.trainSkill`, sort by source (this doc's method) |
| What you grow matches what you do | KCD: you level the weapon you swing. RimWorld: passion speeds the work you do | Top-3 gained vs top-3 tested skills: median **1 of 3**, 14 of 30 lives **0** | median ≥ 2 of 3 | Bot |
| Where a gain came from is shown | Wildermyth writes each change as a history line. Ardan's own training sessions already list their modifiers ("taught by X +30%") | Yearly recap shows the top 3 skill changes, but no sources | Every gain ≥ 2 points in a year shows its source | Browser test on the recap, plus a bot coverage check |
| Anti-grind caps | RimWorld: ×0.2 past 4,000 XP/day/skill. Skyrim: 5 trainings per level. KCD: book XP has a daily limit | None needed today (the plan is automatic). None in place for use | A per-skill monthly cap once use leads | Bot: a "grinder" personality must not beat the careful bot's skills at 40 by more than 15% |
| Check odds across life stages | Sims 4 gives children their own skills. CK3 sets education at 16 after a childhood of trait-building | **35% at 15 → 17% at 16**; 22% at the floor at 16; 25% median in the 20s | Median 35 to 65% at every age band; no drop over 10 points between ages | Bot (check log by age) |
| Mood has thresholds that cause events | RimWorld: breaks at 35/20/5% mood, mean time 10/3/0.7 days. CK3: a mental break at each stress level | **0** events read happiness. 30 of 48 lives spent 12+ months under 30 with no effect | Every 12-month stretch under 30 triggers ≥ 1 break event; ≥ 20 events read mood | Bot and static analysis |
| Mood carries reasons | Sims 4 moodlets and RimWorld thoughts: each names its cause and lasts a set time | One number, written by 1,774 events, no record of why | 100% of mood changes ≥ 3 points show as a named thought with an end date | Static analysis plus a browser test |
| Highs pay off | RimWorld: inspirations from 50% mood (mean 210 days to 10 days). Sims 4: ideal emotion +20% skill speed | Happiness over 75 gives training ×1.06; 11% of months are over 75 | High mood unlocks 1 to 3 inspiration events per life | Bot |
| Personality changes with reasons | Wildermyth writes each change into the hero's history. Sims 4 Lifestyles come from 100 points of repeated behaviour | 4.7 trait changes per life, **0** explained; median 6 traits at death, max 13 | 100% of changes logged with their cause; cap 5 traits | Bot and a browser test |
| Traits have weight | CK3: acting against a trait costs stress, the main stress source; coping traits come from breaks | **15 of 40** traits never read; 20 trait reads across 3,199 events | 0 dead traits; every trait read in ≥ 3 places | Static analysis |
| Will (resolve) can go both ways | Darkest Dungeon: at 100 stress, an affliction or a 25% virtue | Rises 31 → 79 from 16 to 70; fell in 1 of 39 lives | Falls ≥ 5 below peak in ≥ 30% of 40-year lives | Bot |
| Every number matters | Skyrim cut attributes and "almost nobody complained" | **20 of 44** stats and skills under 5 checks per life (12 weapon skills at 0 to 1, though they drive about 5 duels) | 0 under 5 outcomes per 40-year life, counting checks, duels and work | Bot (count outcomes, not checks only) |
| Number of growth systems | CK3: one lifestyle focus. KCD: use, trainers, books, perks | About 12 (Road to 100). The Life tab shows 114 numbers and 59 controls | 4 visible systems; ≤ 40 numbers on the character page | Browser test (text, numbers and controls on the Life tab) |
| Stage-specific play | BitLife greys out actions by age. Sims 4 has distinct stages with set lengths | Exclusive actions: child 2, teen 0, adult 0, old **0**. 41 old-age events | ≥ 2 exclusive actions per stage; ≥ 150 old-age events | Static analysis and bot |
| Needs drive stories | Sims 4: 6 needs → moodlets. RimWorld: needs → thoughts. KCD: hunger at 50 costs stamina, at 0 costs health | Lifestyle tier set once; **0** events read it | 4 needs, each read by ≥ 3 events and firing in ≥ 50% of lives | Static analysis and bot |
| Health is a body | KCD: hunger, overeating and poisoning each with its own cure | 20 wound types and 7 diseases. Wounds: 380 events write, **1** reads. Disease is one damage roll | ≥ 30 events read wounds; every illness offers a treatment choice | Static analysis and bot |
| Aging changes the body stat by stat | Wildermyth: age brackets and retirement | Strong: strength −44%, speed −48% from 25 to 65; intelligence peaks at 45 to 55; race-specific | Keep it; show the curve on the profile | Bot (exists) |
| Skill rust | RimWorld: decay above level 10 | Present: unused skills over 30 lose 3% of the excess a year | Keep it; show it in the recap (it already logs "getting rusty") | Bot |
| Players understand their character | Plan gate: new players explain how they get better in one sentence | **Unmeasured** (0 playtests) | 8 of 10 new players right; "I understood my character" ≥ 8/10 | Human playtest |

## 4. North star

With unlimited time, money and people, Ardan's character becomes **"the ledger of a life"**. Every point you gain, every scar and every change of heart is recorded with its cause, and the record is what you play.

**One character page, four blocks, at most 40 numbers.**

1. **Body.** An inked figure, not bars. Six stats sit on it (arm for strength, legs for speed, chest for stamina, eyes for instinct, brow for intellect, heart for will). Twelve body parts carry wounds and chronic conditions. A small age curve shows each stat's past and expected decline, so the player sees "your speed peaked at 27".
2. **Skills.** 24 skills in 6 families instead of 38. The weapons become 4 families: blades, axes and maces, spears and polearms, missiles. Each skill has a ring showing where its points came from: use, teachers, books, training. Hovering a skill lists the last five gains with dates ("+2, held the gate at Millrun, March 1112").
3. **Abilities.** One 5-node tree per skill family (30 nodes in all). Nodes unlock from use milestones ("win 10 fights with a spear"), not points. Perks, specs, masteries, styles and techniques fold into it. The 265 fighting styles become the content of the blade, axe and spear trees, learned from named masters.
4. **Condition.** Mood made of up to 8 named thoughts, each with a cause and an end date (months, not hours). Four needs: food, rest, company, faith. A stress track that fills when you act against your traits.

**Growth.** About 70% of growth comes from use, scaled by how hard the test was: beating a stronger foe teaches more, as in Kenshi. Each skill has a monthly cap (RimWorld's 4,000-a-day rule, on Ardan's monthly clock). Training multiplies use for a few months instead of granting points: a master's lessons give +30 to 50% to that skill's use gains for a season. Books give a fixed amount over time with a daily limit, as in KCD. The yearly recap reads like a chronicle paragraph: "This year you got better with the spear (from the siege, mostly) and worse at letters (unused since 1109)."

**Personality.** Three traits at birth, and up to two more earned by acts, five at most. Six virtue axes fill from choices, the way Sims 4 character values and Lifestyles do: cruel or kind, brave or craven, honest or deceitful, greedy or generous, pious or cynical, wrathful or calm. Crossing a threshold changes a trait, and the profile shows the receipts ("Kind: spared the thief, 1112; fed the Tidehollow orphans, 1114"). Acting against a trait adds stress, as in CK3. Each of the three stress levels brings a break event, and breaks can leave a coping trait (drink, devotion, cruelty, solitude). Will rises through hardship and falls through grief, defeat and age. At will 100 under stress, a Darkest Dungeon-style resolve test can make a hero or break one.

**Stages, each with its own play.**

- **Childhood (0 to 12).** Child skills (play, chores, letters, mischief) and three formative choices that each set one trait.
- **Youth (13 to 20).** An apprenticeship with a named master who can be kind or cruel, and difficulty that starts low and ramps up to adult over five years.
- **Prime (21 to the race's old age).** The current game.
- **Decline.** Teach an apprentice who can surpass you. Write memoirs that become chronicle chapters. Settle the inheritance. Make a last pilgrimage. Choose where to die.

Each stage has 3 actions no other stage has, and old age gets 200 events instead of 41.

**Health.** Illness is a 2- to 6-month chain with a treatment choice:

- a physician (coin; good against wounds, bad against fevers),
- herbs (cheap, seasonal, needs medicine skill),
- prayer (piety; it helps mood more than the body),
- rest (time).

Chronic conditions (bad lungs, gout, a limp) change which events find you.

**Numbers that define done.**

- 8 of 10 new players explain how they got better in one sentence, and the explanation matches the ledger.
- Use is 60 to 75% of growth.
- Every stat and skill decides 5 or more outcomes in a 40-year life.
- Median check odds stay between 35 and 65% at every age.
- 1 to 3 breaks and 1 to 3 inspirations per life.
- 0 silent trait changes.
- 150 or more events for each life stage.

**What it takes.** Two systems designers for a year (the merge to 4 needs the source, not patches). Two writers for a year: about 800 events covering breaks, inspirations, needs, wounds, illness, and childhood and old age. One UI designer for the four-block page. One illustrator for the body figure and age-true portraits, the same hire the Visual art plan needs. Three rounds of 12-player tests.

## 5. What to build now

Ranked by score gain per unit of effort. "Here" means it can be built in this repo as a feature folder (`patches.mjs`, `*.core.js`, `*.events.js`, `test.mjs`) per CLAUDE.md. The gains don't add up in a straight line. With rows 1 to 10 built and green, I expect Character and life sim to reach about 7.5. A 10 needs the merge (row 11), which needs the source, and real players (row 12).

| # | Feature | Effort | Built here? | Gain | Acceptance test (must be able to fail) |
| --- | --- | --- | --- | --- | --- |
| 1 | **Gain ledger and "why" in the recap.** A `*.core.js` wraps the callers of `A.trainSkill`/`A.train` (`planDay`, `eventChoose`, `applyFx`, `careerYear`, `duelConsequences`, `doActivity` and the others) with a source tag on a stack. It records `pc.gains[year][skill][source]`, which tolerates old saves. `A.recapMake` prints one source line per skill that rose ≥ 2. No RNG; render stays pure. | S | Yes: `*.core.js` + 1 patch in `recapMake` | +0.5 | 48-life bot run: ≥ 98% of skill points carry a named source (not "other"). Browser test: the recap for a year with a ≥ 2 gain shows a "from …" line. Both determinism tests still pass |
| 2 | **Invert growth: use leads, training boosts.** Cut the plan's daily rate (`.105` in `A.planDay`) to about a third. Raise check practice from 1.5, work gains (`careerYear`) and fight gains, and scale fight gains by the foe's worth gap (Kenshi). Add a monthly cap per skill. The prototype above tests these weights | M | Yes: patches + `*.core.js` | +1.0 | Same 48 seeds: use ≥ 60% of skill points; automatic plan ≤ 20%; median total skills at 40 within ±15% of today; top-3 overlap median ≥ 2 of 3. A "grinder" bot (same activity every month) ends ≤ 15% above the careful bot at 40 |
| 3 | **No cliff at 16.** A youth offset in `A.checkOdds`: difficulty lowered by 3 × (years left to adult+6), fading to 0 at 22. Show it in the odds tooltip ("young: −9"). Same work as power-balance item 8; build once | S | Yes: patch | +0.5 | Bot: median offered odds at each age from 12 to 30 between 35 and 65%; no year-to-year drop > 10 points; under 12% at the floor at 16 to 19. Today: 35% → 17% at 16, 22% at the floor |
| 4 | **Thoughts and breaks.** Happiness becomes the sum of named thoughts (`pc.thoughts: [{k, v, until, why}]`), plus a baseline. Event `fx.happy` makes a thought titled after the event. Below 30 for 6+ months: a break event (drink, rage, withdraw, lose faith), which may add a coping trait. Then catharsis +15 for 6 months. Above 75: an inspiration event (a training season ×1.5, a masterwork, a bold offer). 12 break + 8 inspiration events | M | Yes: `*.core.js` + `*.events.js` + 1 patch | +1.0 | Bot: ≥ 90% of 12-month stretches under 30 end in a break; median 1 to 3 breaks or inspirations per life, none above 6. Static: ≥ 20 events read mood. Browser: the happiness tooltip lists thoughts with causes |
| 5 | **Personality with receipts.** Every `fx.trait`/`untrait` writes a history line with the event title and year. Traits capped at 5: an earned trait replaces the weakest-held innate one, with a line saying so. Virtue counters (`pc.virtue.kind += 1` from choices already tagged by trait fx) flip a trait at a threshold of 3 acts in 10 years | M | Yes: `*.core.js` + patch in `applyFx` | +0.7 | Bot: 100% of trait changes have a history line; max traits ≤ 5 in all 48 lives (today 13); median 1 to 4 changes per life. Browser: the trait chip tooltip shows its reasons |
| 6 | **Give the 15 dead traits a job, or cut them.** Each gets ≥ 3 reads: an event weight (vengeful raises revenge events, which can read the 287 orphan flags), a check bonus (+5 when the trait fits the choice), or stress when a choice goes against it | M | Yes: `*.core.js` (weights and bonuses) + `*.events.js` | +0.4 | Static: 0 traits with fewer than 3 reads. Bot: each trait changes at least 1 outcome in ≥ 20% of lives that hold it |
| 7 | **Will that can break.** Lower will on grief, maiming, long misery (12+ months under 30) and age past `old`. Cap at the potential + 10 instead of + 25, and the ceiling at 120 instead of 160 | S | Yes: patch on `A.willGrow` + `*.core.js` hook | +0.3 | Bot: will falls ≥ 5 below its peak in ≥ 30% of 40-year lives; median will at 70 ≤ 1.1 × median at 40 (today 79 vs 59, 1.34×) |
| 8 | **Four needs that drive events.** Food (from lifestyle tier, famine, campaign), rest (intensity, initiative spent, war), company (friends, spouse, tavern, festival) and faith (prayer, piety). Each is a 0 to 100 monthly meter on the sheet that makes thoughts. 4 × 4 events read them | L | Yes: `*.core.js` + `*.events.js` | +0.6 | Static: each need read by ≥ 3 event conditions. Bot: each need fires an event in ≥ 50% of 40-year lives; a careful bot keeps every need off the floor for 80% of months |
| 9 | **Old age and youth get their own play.** Teach an apprentice (a named NPC who gains your skill and can pass you), write memoirs (feeds the chronicle), settle the inheritance, last pilgrimage. Youth gets apprenticeship with a named master. 3 stage-exclusive activities each, plus 110 old-age events (to 150) | L | Yes: `*.core.js` (activities) + `*.events.js` | +0.6 | Static: `GD.ACTIVITIES` has ≥ 2 actions per stage gated by `A.stage`; ≥ 150 old-age events (bench counter). Bot: engaged lives use ≥ 1 stage action in every stage they reach |
| 10 | **Illness and wounds you can treat.** Disease onset queues an event with physician, herbs, prayer and rest choices, with different odds by disease. 30 events read specific wounds (a lost hand at the forge, a limp on the march, bad lungs in winter) | M | Yes: patch in `A.bodyYear` + `*.events.js` | +0.4 | Bot: ≥ 80% of disease onsets offer a treatment choice. Static: ≥ 30 events read a wound. Bot: treatment choice moves recovery time by ≥ 20% |
| 11 | **Merge to 4 systems.** Body, skills, abilities and condition, as the plan says. Fold plan, intensity, aims and activities into one "your days"; fold perks, specs, masteries and styles into one tree per skill family; cut 38 skills to 24 | XL | **Needs source**: deleting systems by patching minified code is unsafe | +1.0 | Browser: the Life tab shows ≤ 40 numbers (today 114). Bot: every stat and skill decides ≥ 5 outcomes per 40-year life (today 20 of 44 fail) |
| 12 | **The one-sentence test.** 10 new players play 45 minutes, then answer "how does your character get better?" and "why did your mood change last?" | S per round | **Needs people** | +0.5 (and gates the 10) | 8 of 10 answer the first correctly; 7 of 10 the second. The answers are checked against the gain ledger from row 1 |
| 13 | **Bench and rubric lines for this aspect.** Add to `bench/run.mjs` a `character` module (this doc's method): use share, top-3 overlap, odds by age, months under 30 without a break, silent trait changes, dead numbers. Add them to `bench/rubric.mjs` | S | Yes: code (needs the `bench/` owner) | keeps 1 to 10 honest | On today's build the new rubric lines fail: use 32%, 16-year-old odds 17%, 30 of 48 lives with unbroken misery, 4.7 silent trait changes per life |

## 6. Sources

**Kingdom Come: Deliverance (1 and 2)**
- KCD wiki, Skills: https://kingdomcomedeliverance.wiki.gg/wiki/Skills
- KCD wiki (Fandom), Skills: https://kingdom-come-deliverance.fandom.com/wiki/Skills_(KCD)
- Fextralife, Skills: https://kingdomcomedeliverance.wiki.fextralife.com/Skills
- KCD wiki, Reading: https://kingdomcomedeliverance.wiki.gg/wiki/Reading
- Fextralife, Nourishment: https://kingdomcomedeliverance.wiki.fextralife.com/Nourishment
- KCD wiki, Overeating: https://kingdomcomedeliverance.wiki.gg/wiki/Overeating
- PowerPyx, KCD2 stats and skills: https://www.powerpyx.com/kingdom-come-deliverance-2-how-to-level-up-all-stats-skills/
- GamingBolt, KCD2 leveling: https://gamingbolt.com/kingdom-come-deliverance-2-guide-heres-how-to-level-up-all-player-skills-and-statistics
- gamepressure, KCD2 trainers: https://www.gamepressure.com/kingdom-come-deliverance-2/skill-trainers/z2117cf
- Ludo guide, KCD2 perk points: https://www.ludo.guide/guide/kingdom-come-deliverance-ii/getting-started/gameplay/earning-and-spending-perk-points

**Crusader Kings III**
- Dev Diary #09, Lifestyles: https://forum.paradoxplaza.com/forum/developer-diary/ck3-dev-diary-09-lifestyles.1308005/
- Dev Diary #13, The Learning Lifestyle: https://forum.paradoxplaza.com/forum/developer-diary/ck3-dev-diary-13-the-learning-lifestyle.1326963/
- Dev Diary #31, A Stressful Situation: https://forum.paradoxplaza.com/forum/developer-diary/ck3-dev-diary-31-a-stressful-situation.1399764/?prdxDevPosts=1
- Dev Diary #158, Wandering Nobles: https://admin-forum.paradoxplaza.com/forum/developer-diary/dev-diary-158-wandering-nobles.1710648
- Dev Diary #159 (Steam): https://steamcommunity.com/games/1158310/announcements/detail/4517765223386176015
- PCGamesN, lifestyle system: https://www.pcgamesn.com/crusader-kings-3/lifestyle-system
- GameWatcher, lifestyle and perks: https://www.gamewatcher.com/news/crusader-kings-3-lifestyle-and-perks
- Game Rant, stress levels: https://gamerant.com/ck3-crusader-kings-3-how-check-reduce-stress-levels/
- FandomSpot, reduce stress: https://www.fandomspot.com/ck3-reduce-stress/
- GameWatcher, traits: https://www.gamewatcher.com/crusader-kings-3-traits
- Paradox forum, education: https://forum.paradoxplaza.com/forum/threads/how-to-educate-your-children-in-desirable-direction.1421223/

**The Sims 4**
- Sims Wiki, Motive: https://sims.fandom.com/wiki/Motive
- Sims Wiki, Emotion: https://sims.fandom.com/wiki/Emotion
- Carl's guide, skills and emotions: https://www.carls-sims-4-guide.com/skills/skill-emotion.php
- Carl's guide, Lifestyles: https://www.carls-sims-4-guide.com/expansionpacks/snowyescape/lifestyles.php
- Game Rant, Lifestyles: https://gamerant.com/the-sims-4-snowy-escape-lifestyles-guide/
- SimsCommunity, character values: https://simscommunity.info/2017/05/23/learn-about-character-values-the-sims-4-parenthood-blog-post/
- GGRecon, character values: https://www.ggrecon.com/guides/sims4-character-value-cheats/
- SimsCommunity, lifespan update: https://simscommunity.info/2023/03/15/the-sims-4-life-span-update-sim-age/
- EA help, child skills: https://help.ea.com/fi/articles/the-sims/the-sims-4/child-skills/
- Emotional Inertia mod: https://roburky.itch.io/sims4-emotional-inertia

**RimWorld**
- Thoughts: https://rimworldwiki.com/wiki/Thoughts
- Mental break: https://rimworldwiki.com/wiki/Mental_break
- Mental Break Threshold: https://rimworldwiki.com/wiki/Mental_Break_Threshold
- Mental inspiration: https://rimworldwiki.com/wiki/Mental_inspiration
- Needs: https://rimworldwiki.com/wiki/Needs
- Passion: https://rimworldwiki.com/wiki/Passion
- Skills: https://rimworldwiki.com/wiki/Skills
- GDC 2017, Contrarian, Ridiculous, and Impossible Game Design Methods: https://www.gdcvault.com/play/1024232/-RimWorld-Contrarian-Ridiculous-and
- Slides: https://media.gdcvault.com/gdc2017/Presentations/Sylvester_Tynan_RimWorld_Contrarian_Ridiculous.pdf

**BitLife**
- BitLife wiki, Stats: https://bitlife-life-simulator.fandom.com/wiki/Stats
- BitLife wiki, Activities: https://bitlife-life-simulator.fandom.com/wiki/Activities
- Prima Games, discipline: https://primagames.com/tips/what-does-discipline-mean-in-bitlife-answered
- LevelWinner, hidden stats: https://www.levelwinner.com/?p=32943
- AppleVis forum (2018): https://www.applevis.com/comment/93350

**The Elder Scrolls**
- UESP, Skyrim Leveling: https://en.uesp.net/wiki/Skyrim:Leveling
- UESP, Skyrim Trainers: https://En.UESP.net/wiki/Skyrim:Trainers
- UESP, Skyrim Skill Books: https://pt.uesp.net/wiki/Skyrim:Skill_Books
- PC Gamer, Nesmith on attributes: https://www.pcgamer.com/games/the-elder-scrolls/bethesda-veteran-says-less-rpg-complexity-in-the-elder-scrolls-series-is-good-actually-we-got-rid-of-attributes-in-skyrim-and-you-know-who-complained-almost-nobody/
- UESP, Oblivion Athletics talk: https://content1.uesp.net/wiki/Oblivion_talk:Athletics
- UESP, Oblivion Efficient Leveling: https://en.uesp.net/wiki/Oblivion:Efficient_Leveling
- UESP, Oblivion Remastered Leveling: https://app.uesp.net/wiki/Oblivion:Remastered_Leveling

**Wildermyth**
- Wildermyth wiki, History: https://wildermyth.com/wiki/History
- Wildermyth wiki, Legacy: https://wildermyth.com/wiki/Legacy
- Wildermyth wiki, Wolftouched: https://wildermyth.com/wiki/Wolftouched
- Wildermyth wiki, Crystalline: https://wildermyth.com/wiki/Crystalline
- Neoseeker, Hostile Site Events: https://www.neoseeker.com/wildermyth/Hostile_Site_Events
- Steam discussion, personality stats: https://steamcommunity.com/app/763890/discussions/0/4241812037674029611/
- PressReader review (retirement age): https://www.pressreader.com/usa/arkansas-democrat-gazette/20210823/282857964001559
- GDC 2022, Getting Players Emotionally Invested in Procedural Characters: https://www.gdcvault.com/play/1027614/Independent-Games-Summit-Session-Getting
- Slides: https://media.gdcvault.com/GDC+2022/Speaker+Slides/GettingPlayersEmotionally_Austin_Nate.pdf

**Others**
- Darkest Dungeon wiki, Virtue: https://darkestdungeon.wiki.gg/wiki/Virtue
- Kenshi wiki, Toughness: https://kenshi.fandom.com/wiki/Toughness
- Kenshi wiki, Dexterity: https://kenshi.fandom.com/wiki/Dexterity

**Ardan (this repo)**
- `docs/plan/Ardan The Road to Ten.md`, Character and life sim section
- `docs/reviews/Ardan Road to 100.md` and `docs/reviews/Ardan Deep Analysis.md`
- Functions read: `A.planDay`, `A.trainSkill`, `A.train`, `A.willGrow`, `A.sessionQ`, `A.growthYear`, `A.yearGrowth`, `A.ageFactor`, `A.bodyYear`, `A.checkOdds`, `A.checkVal`, `A.applyFx` (`trait` case), `A.duelConsequences`, `A.recapMake`, `GD.ACTIVITIES`, `GD.TRAITS`, `A.LIFESTYLE`

## Appendix: how to reproduce

1. **Build privately.** `node tools/build.mjs --out=/tmp/ardan/char/x.html --unpack=/tmp/ardan/char/blobs`
2. **Load the page.** Use Playwright with `bench/bot.mjs` installed, as `bench/run.mjs` does.
3. **Install the wrappers before `A.newGame`.**
   - **Gains.** Wrap `A.trainSkill(p,k,amt)` and `A.train(p,s,amt)`. Compare `p.skills[k]` (or `p.st[s]`) before and after, and key the difference by the first three frames of `new Error().stack` above the wrapper. Stack frames carry V8's inferred names, such as `A.planDay` and `A.eventChoose`. None of this draws a random number.
   - **Will and traits.** Wrap `A.willGrow` and key its gain by the `why` argument. Wrap `A.addTrait` and `A.addWound`.
   - **Monthly samples.** Push a hook onto `A.onMonth` that samples `pc.happy` and `pc.health / A.maxHealth(pc)`.
4. **Log checks in the life loop.** For each event, read `A.eventView(h)`. Log every choice whose source choice has `check`, with `[age, odds, s, s2, d]`.
5. **Run the lives.** 48 lives: index `i` gives engaged = `i % 2 == 0`, start `STARTS[floor(i/2) % 8]`, personality `PERS[floor(i/16) % 4]`, seed `4242 + 7919·i`, 90-year cap. Three parallel processes took about 12 minutes.
6. **Sort sources into categories.**
   - `planDay`, an aim's `day`, or `flowEvent` under `planDay`: automatic plan.
   - Practice and study sessions, specs, drill: deliberate training.
   - `eventChoose` on top: check practice.
   - `applyFx`: event grant.
   - `careerYear` or `pathMonth`: work.
   - Duel, group fight, mission or battle: fighting.
   - Anything else: activities.
7. **Run the prototype.** Wrap the same calls. Scale the amount by frame: plan ×0.35, check practice ×2.5, work ×2, fighting and other use ×1.5. Wrap `A.checkOdds` to lower `d` by 3 × (adult + 6 − age) between `adult` and `adult + 6`.
