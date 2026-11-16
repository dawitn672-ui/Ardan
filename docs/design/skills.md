# Skills with levels and experience (S1a)

*Stamped 2026-11-16 · work item S1a (owner order 63: "im no longer a fan of the proficiencies system its very bland.
systematically remove it and refine a system of skills with levels and expierience. dynamic growth mechanics") · by
Fable 5.2 · design only: no game code changed · stands on `growth.md` (what grows; D-046) and `growth-standard.md`
(how fast; D-067, and its §3.16, D-070: no timetable) · recorded as D-072 · S1b builds it.*

Beside it, in `docs/design/skills/`: `skills.json` (the 28 skills, their 99 specialisms, 252 concepts and kin, written
by `gen-data.mjs`), `model.mjs` (the whole design as a small runnable model), `lives.mjs` (nine sample lives and a
400-person spread run) and `chart.mjs` → `lives.svg`. Every number below comes out of `model.mjs`.

---

## For the owner, on one page

**What goes.** The proficiencies: the 38 numbers from 0 to 100, the "Practice a proficiency" activity, the
Proficiencies list with its bars, the stars and triangles of talent, the perk thresholds at 40, 65 and 85, the three
different ladders of words (Untrained to Legendary on the sheet, Novice to Grandmaster on a fighting style, Untrained
to Legend with "812 hours" on the v2 sheet), the daily drip that fed a skill 380 slivers a year, the two-year rust,
and the word "proficiency" everywhere a player can read it (§1 lists every place).

**What comes.**
- **28 skills in eleven groups** (arms, the body, war, the land, the sea, crafts, trade, letters, faith, court, the
  shadow), each broad, each with three to six **specialisms** (Swordsmanship: the arming sword, the long sword, the
  knife, two blades). The ten small proficiencies folded away earlier (crossbow, lance, siegecraft…) come back as
  specialisms.
- **Levels.** The eight words of the growth design, Beginner to Legend (Myth is for the dead), **each word in five
  steps**: "Swordsmanship: Expert II". Thirty-five levels in all. A level is exactly what a card's check reads; there
  is no second number underneath.
- **Experience.** You earn it by doing: work, practice alone, a teacher's drill, a task above you with something at
  stake, a failure, a fight, a card. A bar fills toward the next step. Each step costs more than the last: the first
  takes a month or two, a Master's step four to eight years of plain drill.
- **A new word is not bought with experience.** Each word has one or two named **concepts** (the measure, the tempo,
  the feint read; the temper; the old grammar; the reserve). You must grasp them to pass into the word. Every month of
  real work is a chance of insight, never a sure step, and how hard each concept is *for this person* is set at birth:
  some come at once, some take ten years, a few never come. Until then the bar stays full and what you earn is stored;
  when the concept comes, the stored experience lands at once as a leap.
- **Breakthroughs.** Now and then a concept comes all at once, tied to a moment that names it: a defeat, a master's
  word, a rival, a near death, a new country, a quiet winter after long work. It goes in your record.
- **From Expert up, the word must be proved**: a commission judged good, a fight won against a man of that word.
- **Growth moves with the life.** Discipline (unbroken months at a skill), a rival, a teacher who himself holds the
  concept, a new land or school, wounds, age, rest, purpose and company, the skills next door (a swordsman's footwork
  helps his dancing), how many things you study at once, and the cost of specialising all change what a month is
  worth, and every one of them is written beside the gain it changed.

**How it feels.** A new skill climbs quickly and you see steps tick by. Then it slows, and one day it stops at the
edge of a word with a full bar and a line that says why: "You have not grasped the bind." You can work on the
reasons (find a teacher who has it, go somewhere new, rest, lose to someone better, stop spreading your hours) but you
cannot buy the outcome. Some edges pass in a month. One may hold you for twenty years, or for life.

**What the model shows** (`lives.svg` below; nobody's grasp was set by hand): Isolde, born to it and with every concept
coming easily, is a Master four years after she first holds a sword. Hob, ordinary and steady, takes twenty-seven.
Sir Osric, gifted and taught by a master all his life, never sees the feint read and dies an Expert. Corin, more
gifted than any of them and idle nine months a year, ends where Osric does. Given the same excellent training, 400
people of ordinary talent reach Master in anything from 8 to 49 years, and 57 of them never do.

**Choices you may want to change** (§11): five steps to a word; how many are never to reach Master (one in seven of
ordinary talent under the best training, now); whether talent stays shown as a letter from the start; whether every
calling has the eight words or only fighting does (your order 36 said combat only; order 63 reads as all skills);
no cap on Grandmasters, only a count (order 36), against the growth standard's "ten and one"; languages left as
they are for now.

![Nine lives under the skill model, and the spread](skills/lives.svg)

---

## 1 · What is removed

Counted on `origin/v2-integration` at `962791e` with `git grep`. Nothing in this list survives as a number the player
cannot see: the level is the only quantity, and a check reads the level.

### 1.1 Data (`src/core/release/core/02-game-data-a.js`, `15-specialisms-and-promotion.js`, `07-duels.js`)

| Today | What happens to it |
|---|---|
| `GD.SKILLS` (38 keys), `GD.SKILL_LIST`, `GD.SKILL_CATS`, `GD.SKILL_CAT_OF`, `GD.SKILL_DESC`, `GD.SKILL_STAT`, `GD.SKILL_PRACTICE`, `GD.SKILL_SYN` | Replaced by `data/skills.json` (28 skills: name, group, kind, governing stats, specialisms, kin, concepts, a description, practice lines). `GD.SKILLS` stays for one stage as a generated map of *every key a check may name* (the 28 and the 10 legacy keys) so that 196 readers keep working, then goes |
| `GD.PROF_TIERS`, `GD.profTier` (Untrained, Novice, Trained, Skilled, Expert, Master, Legendary) | Removed. One ladder: `SK.WORDS` and `SK.levelName` |
| `GD.STYLE_RANKS` (Novice, Student, Adept, Master, Grandmaster), `GD.STYLE_PROF` | Ranks read Beginner, Intermediate, Advanced, Expert, Master; an art's rank needs its weapon skill at that word (1, 15, 35, 55, 72 in place of 5, 20, 40, 62, 82). `styleXp` and the arts themselves are untouched (G4) |
| v2's `SKILL_TIERS`, `skillTier`, `skillInfo`, `SKILL_FAMILY` (`src/people/engine/body.js`) and `VS.tierOf`, `VS.hoursOf`, `VS.fmtH`, `VS.skillRows` (`99993-v2-stats/e-sheet.core.js`): "Journeyman · 812 hours" | Removed. The hours were a second reading of the same number |
| `GD.APT_LEVELS`, `GD.aptName` (Hopeless, Clumsy, Apt, Gifted, Prodigy), `p.apt` multipliers (0.5 to 1.85), `A.rollApt`, `GD.APT_BIAS` | Talent letters F to S per skill (§2.6). `p.apt` is converted once (§9) and deleted; `A.rollApt` rolls letters with the same biases |
| `GD.PERKS` (114 perks at 40, 65 and 85), `A.perksOf`, `A.perkOf`, `A.perkSum`, `A.perkNames` | Kept as **knacks** (§6), earned at the crossings into Advanced, Expert and Master, named in the crossing's record. The "learn" perk's text ("Learn other proficiencies faster") is reworded |
| `GD.SPECS` (105 job specialisms), `job.spec`, `A.specMul` | A job's specialism grants the matching skill specialism (§2.3); `A.specMul`'s hidden ×growth is removed (the specialism's effect is §2.3's, shown) |
| `BM.MERGE` and `LN.MERGE` (49-body-mind, 69-every-number-counts): ten keys folded into six for the player only | Removed as wrappers. The fold is the data's `legacy` field, for everyone, NPCs too |
| `GD.ACTIVITIES.practice` ("Practice a proficiency"), `A.SESSION_ACTS.practice` | Replaced by the activity **Work at a skill** (§3.3) |

### 1.2 Engine

| Today | What happens to it |
|---|---|
| `A.trainSkill(p, k, amt)` (337 calls in 53 files) and its four wrappers (31-learn-by-doing, 49-body-mind, 999997-bodies, the `_growMul`) | One function, `A.gainXp(p, k, eu, cause)`. `A.trainSkill` stays as a shim that turns `amt` into effort (§5.2) with a cause read from where it was called, until the callers are moved; then a lint forbids it |
| `A.skill(p, k)` (349 reads), `A.skillEff`, `A.checkVal`, `A.checkOdds` | Kept, same meaning: `A.skill` returns what the level reads (§4). `p.skills[k]` holds that value for everyone, written only by the engine |
| The daily drip: `A.planDay`'s `A.trainSkill(pc, P.train, 0.105 × pace)` every day; `A.pathMonth`'s 0.3 a month | One effort a month from the plan and one from the post (§3.2) |
| `A.sessionQ`'s skill "breakthrough" roll (6%, ×2.1) and "bad day" | Removed for skills; breakthroughs are §2.5's. The good and bad day stay as a session's mood only |
| `A.growthYear`'s rust (two idle years, 3% a year) and `pc.habit` | The standard's disuse (§2.7); the streak replaces `habit` |
| `A.GROW.USE`, `PRACTICE`, `FAIL` weights, `p.grow`, the season's "+9.0 … 69% of it from doing" line (31-learn-by-doing) | Retired into quality (§3.1) and the ledger (§7); the line is rewritten in words |
| `C.prof(p, k, min)` (252 uses in 18 files), `C.apt(p, k)` (2) | Renamed `C.lvl(p, k, min)` and `C.talent(p, k, letter)`; `min` may stay a number (the value a level reads) or be a word (`"expert"`). A rename over event text: run `tools/release/identity-probe.mjs` before and after |
| fx key `apt` | Becomes `talent` (a judged letter, or a lift of one letter); `apt` is read as an alias for old packs |

### 1.3 What the player reads

| Where | Today | After |
|---|---|---|
| `UI.profBlock`, `UI.topProfs` (`23-ui-b.js`), their wrappers in 49 and `999997-scope` | category lists of name, number, tier, bar by `width:%`, `title=` descriptions | `UI.skillRows` (§8); archived to `archive/s1-proficiencies/` |
| The rail (`23-ui-a.js:1327`) | "Best proficiencies" | "Best skills" |
| The sheet overlay (`23-ui-b.js:1251`, `:1283`) | "Proficiencies … ★ natural talent … ▽ blind spot … Perks unlock at 40, 65 and 85" | the Skills sheet; "blind spot" now means a concept, never a talent |
| Empty state (`23-ui-b.js:630`) | "No proficiencies yet. Practice something." | "Nothing learned yet. Try your hand at something." |
| Profile tab (`999996-profile-tab/profile.b-view.core.js:138`, `profile.a-data.core.js`) | "Proficiencies", tier word, ★ | §8 |
| A decision's requirement (`13-factions-and-decisions.js:1685`) | "A proficiency at 50 (best: …)" | "A skill at Advanced IV (best: …)" |
| `99993-v2-stats` `i-numbers`, `j-numbers`, `g-bands`' `TIER` regex, `f-words` | "A proficiency at Adept", "command Journeyman", "(14)" as a tier, hours | level names; the `TIER` regex loses the retired words |
| `59-descriptions` glossary and wiring, `99998-click-open/sheet.core.js`, `91-visual-style`, `90-collapsible-sections`, `999997-scope` | the word in notes, section titles and CSS hooks (`.profs`, `.prow`) | reworded; class names become `.skills`, `.skrow` |
| Event text | no card says "proficien" today (the 51 hits are UI and comments) | the lint keeps it so |
| `CHANGELOG.md`, `docs/`, the three skills in `.claude/skills/` | describe proficiencies | updated in S1b's last stage; old docs keep their text as history |

### 1.4 Tests and tools

`src/people/49-body-mind/test.mjs` (28 uses), `69-every-number-counts/test.mjs` (15), `999997-bodies/test.mjs` (8),
`99993-v2-stats/test.mjs` (7), `48-event-fight-rules`, `40-memory-practice`, `59-descriptions`, `31-learn-by-doing`,
`75-fair-checks`, `97-first-life-fixes`, `994-careers`, `9998-choice-stakes`, `99999-v2-content`, and `tests/run.mjs`
set `p.skills.x = n` (110 direct writes in 26 files) or read tiers. Each is moved to `SK.set(p, k, level)` or
`A.TEST.skill(p, k, value)`; tests that assert the old tier words, the hours, the merge wrappers or the use-and-practice
share are rewritten against the new model or retired with their feature. `tools/bench/dead-numbers.mjs`,
`tools/bench/balance.mjs` (bands), `docs/design/growth/measure.mjs` read `p.skills` and keep working (the mirror).
Retired code goes to `archive/s1-proficiencies/` with a note (never deleted).

---

## 2 · The model

### 2.1 The skills

Twenty-eight, the same broad skills the player sees today, so that every one of the 5,695 checks and 4,989 effect
grants in the cards names a skill that exists. No new skill is added now: 69-every-number-counts' rule holds (a
skill must change five outcomes in an ordinary life), and Law, Teaching and the tongues are named for later (§11).
What is new is everything inside a skill.

| Group | Skills (kind; governing stats) | Specialisms (legacy key it takes) |
|---|---|---|
| **Arms** | Swordsmanship (movement; Reflexes, Speed) | the arming sword · the long sword · the knife (dagger) · two blades (dualwield) |
| | Spear, axe and mace (movement; Strength, Reflexes) | the spear · the axe (axe) · the mace and hammer · the bill and pike |
| | Shield work (movement; Strength, Endurance) | the buckler · the wall · the great shield |
| | Archery (movement; Strength, Reflexes) | the war bow · the hunting bow · the crossbow (xbow) · the javelin and sling (throwing) |
| | Footwork and close fighting (movement; Reflexes, Speed) | the line · the skirmish · fighting in harness |
| | Riding and the lance (movement; Endurance, Reflexes) | the long road · the lance (lance) · the fight from the saddle (mounted) · breaking and schooling |
| **The body** | Athletics (movement; Endurance, Speed) | the run · the climb · the swim |
| | Wrestling and fists (movement; Strength, Endurance) | wrestling · the fist · the tavern brawl |
| **War** | Command (judgement; Will, Wits) | the company · the garrison · the host |
| | Tactics and siegecraft (judgement; Wits, Reflexes) | the open field · siegecraft (siegecraft) · the ambush and the raid |
| **The land** | Woodcraft and hunting (lore; Endurance, Wits) | the hunt · the snare and the forage · the hard country |
| | Tracking and scouting (lore; Reflexes, Wits) | the trail · the watch · scouting for a host |
| | Farming and herding (movement; Endurance, Strength) | the plough · the herd · horses · vine and orchard |
| **The sea** | Seamanship (movement; Endurance, Strength) | the deck · the helm · the nets · the sea fight |
| **Crafts** | Craft (movement; Strength, Wits) | smithing · armouring · carpentry · masonry · cloth and leather · fine work |
| | Medicine (lore; Wits, Reflexes) | wounds and bones · fevers · herbs · midwifery |
| | Music, song and dance (movement; Wits, Will) | the voice · the harp and strings · the dance · the long lay |
| **Trade** | Trade (lore; Wits, Will) | the market · the long road · the counting house · goods judged |
| | Stewardship and supply (lore; Wits, Will) | the estate · the household · supply (logistics) · the mint and the tax |
| | Gaming and wagers (lore; Wits, Reflexes) | dice · cards and tables · the wager |
| **Letters** | Letters and learning (lore; Wits, Will) | the law · chronicle and history · numbers and stars · the old tongue |
| **Faith** | Faith (lore; Will, Wits) | the rites · scripture · preaching · the care of souls |
| **Court** | Persuasion (judgement; Wits, Will) | the bargain · the speech · the plea |
| | Diplomacy (judgement; Wits, Will) | the embassy · the treaty · the quarrel settled |
| | Courtesy (judgement; Wits, Will) | the court · the feast · courtship |
| | Intimidation (judgement; Will, Strength) | the threat · the question put hard · the presence in arms |
| **The shadow** | Stealth (movement; Speed, Wits) | the quiet road · locks and hands · the disguise |
| | Intrigue and deceit (judgement; Wits, Reflexes) | the plot · the spy's craft · the lie (deception) |

Ids are today's keys (`sword`, `spear`, `bow`, `riding`, `tactics`, `stewardship`, `intrigue`…), so saves and checks
need no renaming. The governing stats are today's `GD.SKILL_STAT` (the six engine stats; G1 redraws them with the
seventeen). "Kind" is the standard's (§3.6 there): it sets the best ages to learn and how long a skill keeps unused.

**How a life's routes are covered.** A soldier lives in Arms, the body and War; a knight adds Riding and Courtesy; a
smith in Craft (smithing, armouring) with Trade beside it; a merchant in Trade, Persuasion and the long road; a priest
in Faith and Letters; a scholar in Letters (the law) and Medicine; a courtier in Court and Intrigue; a sailor in
Seamanship; a farmer, herder and hunter in the land; a thief and a spy in the shadow; a minstrel in Music. Every group
has at least one skill a post trains and cards check.

**Kin.** Each skill names up to five neighbours with a weight (`skills.json`, `kin`): Swordsmanship to Footwork 0.25,
Spear 0.1, Shield 0.1; Footwork to Music, song and dance 0.1; Trade to Stewardship 0.2 and Persuasion 0.2; Tracking to
Woodcraft 0.25 and Stealth 0.15. §3.4 says what kin do.

### 2.2 Levels

| Word | Steps | What a check reads (I, II, III, IV, V) | Who |
|---|---|---|---|
| *(not on your page)* | | 0 (a check falls back on the body and mind, as today) | never tried |
| **Beginner** | I to V | 1, 4, 7, 9, 12 | anyone who has done it badly |
| **Intermediate** | I to V | 15, 19, 23, 27, 31 | can do it on an ordinary day |
| **Advanced** | I to V | 35, 39, 43, 47, 51 | paid work, a trained soldier, a journeyman |
| **Expert** | I to V | 55, 58, 62, 65, 69 | the best in a town |
| **Master** | I to V | 72, 75, 78, 82, 85 | known in the realm |
| **Grandmaster** | I to V | 88, 90, 91, 93, 94 | known across the continent |
| **Legend** | I to V | 96, 97, 98, 99, 100 | there is one, or none |
| **Myth** | | | the dead and the songs (`growth.md` §2.2) |

- A level is an integer from 0 to 35 (`lv`); its name is the word and a Roman step, "Expert II". The value a check
  reads is the start of the word plus a fifth of the word for each step (`value(lv)`), on the same 0 to 100 scale the
  cards' difficulties are written against, at the same word edges as `growth.md` §2.2. **That value is not a second
  number:** it is the level, and it changes only when the level does.
- Five steps, because a word must be felt to move (the first three words pass in a year or two each) and a phone row
  has room for "Expert II" and a bar, not for a number and a tier and hours.

### 2.3 Specialisms, and what they cost

- At **Advanced** a skill may take one specialism; at **Master** a second. It is offered when the life gives it: the
  post's own (a job's `spec` today), a teacher's, the weapon in your hand for a season, a card. It is a choice, shown
  with its gain and cost before you take it, and it can be changed by a year of work in another (the old one lapses).
- **Inside your specialism you act two steps higher** (a check tagged with it, or naming its legacy key: a `dagger`
  check for one who holds *the knife*). **Inside another specialism of the same skill you act one step lower** (a
  long-sword man with a knife). Untagged checks read the plain level. A check tells you which it was.
- **Experience earned outside your specialism counts for less** (×0.85): narrowing is the price. One who holds no
  specialism pays nothing and gains nothing.
- The ten legacy keys (`dagger`, `dualwield`, `axe`, `xbow`, `throwing`, `lance`, `mounted`, `siegecraft`,
  `logistics`, `deception`) are specialisms now: a check or effect on one reads or feeds its skill, with the
  specialism's tag. This holds for NPCs too (today only the player was folded).

### 2.4 Experience

- **Ten experience is one month of steady, purposeful drill** by an ordinary grown person alone. What an effort earns
  is §3. What a level costs is the standard's practice curve, unchanged, written as a price:
  `cost(lv) = 120 × (e^(value(lv+1)/21.6) − e^(value(lv)/21.6))`, rounded.

| From | To the next step | In months of plain drill, alone |
|---|---|---|
| first try | 6 | under one |
| Beginner I / V | 17 / 29 | 2 / 3 |
| Intermediate I / V | 49 / 103 | 5 / 10 |
| Advanced I / V | 123 / 259 | 12 / 26 |
| Expert I / V | 261 / 490 | 26 / 49 |
| Master I / V | 537 / 972 | 54 / 97 |
| Grandmaster I / V | 542 / 730 | 54 / 73 |
| Legend I | 484 | 48 |

  (The last step of a word is the long one because it carries you over the gap to the next word; Grandmaster's and
  Legend's steps are short on the scale but each is years.) From nothing to Master I is 3,240 experience: twenty-seven
  years of plain drill alone, as the standard measured. Nobody trains that way, and nobody is promised it (§2.5).
- Within a word a full bar is a new step at once. The player sees the bar and words for it ("about half way"); the
  numbers are in the save and the tests.

### 2.5 Crossing into a word: concepts, proof, breakthroughs

**Concepts.** Every skill has nine, named, in `skills.json`: one for Intermediate, one for Advanced, two each for
Expert, Master and Grandmaster, one for Legend. Swordsmanship: *the guard*; *the line*; *the measure* and *the bind*;
*the tempo* and *the feint read*; *the single time* and *the stillness*; *the sword forgotten*. Craft: *the edge kept*;
*the true line*; *the material's will* and *the jig*; *the temper* and *the hidden fault*; *the form that serves* and
*the hand that stops*; *the work that outlasts*. Twelve of the names come from the old Codex's styles
(`docs/research/codex/martial-concepts.md`, which also gives a "never grasped" line for each: "taken in by every
feint"). Nine concepts are shared between two skills (*the measure*: sword, spear, wrestling; *the reserve*: command,
tactics; *the silence*: music, faith): grasping one in a skill puts you half way to it in the other.

**Grasp is the person's.** `need(person, skill, concept)` is how many months of insight this concept takes this
person: a hash of the world's seed, the person and the concept, so it is the same every time and costs no save data.
- An ordinary mind needs 2, 4, 10, 18, 28, 40 months of insight for a concept of Intermediate … Legend.
- People differ by `2^(1.5 z)`: one in seven needs three times as long, one in forty-four eight times; half of `z` is the
  person's ease in that whole skill (so there are people to whom a whole art comes easily: the prodigy) and half is
  the single concept's. Talent divides the need (an S needs a little over half).
- **A blind spot:** with a chance of 5 in 100 for an ordinary talent at an Expert concept (F 20, E 12, D 8, C 5, B 3.5,
  A 2, S 1 in 100; a fifth of that at Intermediate, two fifths at Advanced, a fifth more at Master, half as much again
  at Grandmaster, double at Legend) the concept never comes by ordinary work. About one ordinary person in four has
  one somewhere below Master in a given skill.
- A need of 1 is "it came at once".

**A month of work is a chance of insight, not a step.** For each concept of the next word, once a month in which the
skill was really worked: chance = 0.18 × discipline (fitful 0.6, steady 1, disciplined 1.3, devoted 1.6) × the best
effort of the month (work 0.4, work that asks nothing new 0.15, practice 0.8, drill 1, a stretch 1.4, a failed stretch
1.8) × a teacher who holds the concept and shows it (1.6; 1.15 for a proud pupil) × a new place this year (1.5) × a
quiet season (1.5) or a rested mind (1.2) × weary (0.7) × despair (0.5) × overtrained (0.5), never above 0.85. A proud
person gets little from a failure (×0.55 of its 1.8). A success adds one month of insight; the concept is grasped when
insight reaches the need ("a slow dawn").

**What the page says, never a number:** dark, dim, clearer, close, grasped. A blind spot reads "dark", and after five
years at the edge "it does not come"; only late in life or from a Master's judgement does the page say what it is
("Master Ilse says some men never see it. She does not say you are one"). A teacher who is a Master or better can tell
you which concept you lack and how near it is.

**Stored experience.** At step V of a word with the bar full and a concept missing, experience is **stored at half**
(effort without the grasp piles up, slowly), up to the whole next word. Ready but not yet proved, it is stored in full.
The page shows it as hollow ticks. When the way opens it **lands at once**: a leap of one to five steps in a single
month, with its cause.

**Proof.** Into Intermediate and Advanced you pass the month the concepts are grasped. Into **Expert, Master,
Grandmaster and Legend** you also need a **proving moment** while you stand at the edge: a stretch at the next word's
level, succeeded (a check whose difficulty is at least the next word's value, a duel or bout won against a person of
that word, a commission or masterwork judged, a battle commanded and won, a case or disputation carried, or a card
that says so with `fx: { deed: "sword" }`). The crossing is recorded with that moment: "Craft reaches Expert: a
commission judged good". This is D-067's trial, kept, and made the *name* of the crossing rather than a third wall.

**Breakthroughs** (order 61's word). Certain moments are each a chance, while a concept is open: a defeat by a better
hand and a near death (0.025 × 1.5), a win far above you and a bout with your rival (× 1.2), the first season in a new
land or school (× 0.8), watching a better hand (× 0.6), a quiet season after two years' unbroken work (× 0.5), and
every month with a teacher who holds the concept, "a master's word" (× 0.12); × √talent; × 0.6 for the proud. The
concept nearest to coming is the one that breaks. It is grasped at once, a step's worth of experience comes with it,
whatever was stored lands, and one time in five the other concept at that edge comes half way too. **Against a blind
spot the chance is an eighth as large:** a lifelong stall is possible and never certain. The record keeps the moment:
"At Harl's Ford, flat on your back under his blade, you saw the measure." In the spread run a third of lives have
none, a third one, a third more.

**So the same training gives very different lives** (order 59), and each difference has a cause the page can state.

### 2.6 Talent

`growth.md` §10's letters, as growth and reach: F ×0.5 (ordinary effort carries to Advanced I), E ×0.7 (Expert I),
D ×0.85 (Master I), C ×1 (Master III), B ×1.15 (Grandmaster I), A ×1.35 (Legend), S ×1.8, SSS ×3. Past the reach
experience is quartered, and the ledger says so ("past where your talent carries you"). Talent also divides a
concept's need and shifts the odds of a blind spot (§2.5). In S1 a talent is per skill, converted from `p.apt`
(§9) and shown as its letter on the skill's sheet; G1 replaces the source with `growth.md`'s areas, budget and
discovery without changing this model.

### 2.7 Decay and rust (the standard's §3.10, unchanged)

- Nothing fades for 5 idle years below Expert, 8 at Expert, 12 at Master (×1.5 for movement and judgement skills, ×0.8
  for tongues, up to ×1.5 for a good Memory); a Grandmaster's or Legend's never by disuse.
- Then 1, 2, 3 points a year come off what the level reads, shown as "Rusty" on the row and "acts as Expert IV" on the
  sheet: never more than one word down, never more than 15 points under the best held.
- While rusty, all experience goes to the rust first, **five times as fast**. A fifth of each year's rust is lost for
  good: it comes off the experience and can cost a step.
- A long gap also breaks the streak (§3.5).
- The body's gate is C9's, as now: a level acts no higher than its governing stats carry ("your arm cannot carry what
  your hand knows"), and the sheet says both ("Master II; acts as Expert V").

---

## 3 · Earning experience, and what makes it move

`experience = 10 × effort × quality × teacher × talent × age × condition × the life`, then the reach. The first six
terms are the growth standard's (§3.2 there), unchanged; "the life" is §3.4 to §3.6.

### 3.1 Quality (the standard's §3.4)

| Kind | Example | Worth | Its limit |
|---|---|---|---|
| **Work** | the post's day: horseshoes, writs, a watch | 0.5 | past what the post asks, 0.08: "the village work asks nothing new of you". Each career rank names its demand as a level |
| **Practice** | alone, no one to correct you | 0.8 | talent's reach |
| **Drill** | a teacher, a regiment's drill, a school | 1.0 | the teacher's ceiling: the top of the word under his |
| **Stretch** | a task above you with something at stake | 1.0 + 0.04 a point the task stands above you, to 1.8; failed, a third more | none; it is also the proof (§2.5) |

Teacher ×1.15, ×1.4, ×1.6 by the gap in words (a good one a fifth more); age by kind; condition (weary 0.85, low
spirits 0.88, good heart 1.06, hurt 0.6 to 1, overtrained 0.5): all as the standard has them.

### 3.2 Sources (replaces the standard's §3.12 column "under the standard", in experience)

| Source | Effort | Kind | Cause in the ledger |
|---|---|---|---|
| The training plan, once a month | pace: rest 0.15, light 0.5, steady 1, hard 1.4, brutal 1.7 | drill if a teacher is present and above you, else practice | "Sir Odo's drill" / "the yard, alone" |
| A post (`A.pathMonth`) | 0.6 | work, against the rank's demand | "the forge" |
| "Work at a skill" (the activity) | 1; a second session in a month 0.7, then 0.45, 0.25 | as chosen (§3.3) | the practice line |
| A card's check on a skill | 0.3 | stretch by `d` against your level; a failure a third more | the card's title |
| `fx: { skill: { k: n } }` | n × 0.2 | stretch if the choice had a check or stakes, else practice | the card's title |
| A duel, a bout, a battle, a hunt, a mission | 1 to 3 | stretch against the opponent's or the task's level | "the bout with Sir Rauf" |
| School, a regiment, an order | 0.8 to 1.2 a month | drill, the master as teacher | "the school's lessons" |
| Watching a better hand | 0.2 | stretch | "watching Master Ilse" |
| Teaching | 0.2 a month in what you teach | practice; and ×1.2 to your own insight that month | "teaching your pupils" |
| `fx: { deed: "k" }` | 1.5 | a succeeded stretch at the next word: a proof | the card's title |

So a typical `skill: { trade: 2 }` on a card is 4 experience (5 to 7 on a hard check): a quarter of a Beginner's step,
a hundredth of a Master's. The cards keep their relative sizes and stop being the main road for anyone past Advanced.

### 3.3 The activity: Work at a skill

Replaces "Practice a proficiency". One sheet (it opens first, as B4 has it): pick a skill you hold or one this place
lets you try, then **how**:
- **Practise alone** (practice);
- **Take a lesson** from a named teacher in reach (drill; a fee, a bond or your post decides if he will);
- **Seek a harder test** (a stretch: a bout with someone better, a harder commission; it has stakes, as a card);
- **Think it over** (no experience; a quiet month's insight, ×1.5; needs rest and a concept in reach).
The sheet says in words what each is worth to you now and why ("a lesson: Sergeant Wynn has no more to teach you").

### 3.4 Neighbouring skills

- When a skill earns experience, each kin skill **that you hold and that stands lower** gets a share (the weight: a
  tenth to a quarter), with the cause "carried over from Swordsmanship". It stops at the edge of a word (it never
  stores, and never grasps a concept for you). At most four kin a gain.
- A first try at a skill whose kin you hold at Advanced or better starts at Beginner III.
- Shared concepts (§2.5) come half way.

### 3.5 Discipline

Each skill counts **unbroken months** in which it was really worked (practice, drill, work, a stretch; kin spill does
not count): fitful (under 6), steady (under 24), disciplined (under 60), devoted. Experience ×0.9, 1, 1.1, 1.2; insight
×0.6, 1, 1.3, 1.6. Three months away halves the count ("your discipline slipped: a season away"); rust zeroes it. A
strong Will and a diligent temper forgive a month in six; a lazy one loses the streak in two months. The word is on
the skill's sheet.

### 3.6 The life

| What | Effect on experience | Effect on insight and breakthroughs | The ledger says |
|---|---|---|---|
| **A rival** (a person in your `rel` as rival, alive, met in the last three years, holding the skill) | in your word ×1.15; a word or more ahead ×1.25; behind you, nothing | every bout is a stretch; losing is a breakthrough moment, beating one who was ahead is a proof | "a rival ahead" |
| **A master's word** | the teacher's pace (§3.1) | holds the concept: ×1.6 and a breakthrough chance each month; can name what you lack. A teacher cannot show a concept he never grasped himself | "Master Ilse showed it" |
| **A new land, school, master or post** | ×1.1 for a year | ×1.5 for a year; the first season is a breakthrough moment | "a new place: they do it differently here" |
| **Wounds and illness** | condition ×0.6 to 1; a mending wound on a part the skill uses ×0.3 for that skill | a near death is a breakthrough moment; months abed count as quiet for lore and judgement skills | "a broken arm" |
| **Age** | the standard's table by kind | none | "your hands learn slower than they did" |
| **Rest** (35-moods) | under 30: ×0.8 | under 30: ×0.7; 70 or more: ×1.2 | "short of rest" |
| **Purpose** | above 70: ×1.08; under 30: ×0.85 | under 30 the streak slips after two months | "no purpose in it" |
| **Company** | court skills only: above 60 ×1.1, under 25 ×0.85 | | "alone too long" |
| **Comfort** | under 25: ×0.9 | | "cold and hungry" |
| **Mood** | low spirits ×0.88, good heart ×1.06 (as now) | despair ×0.5 | |
| **Hours shared** | deliberate practice in two skills a month ×0.85 each, three ×0.7, four or more ×0.55 | | "hours shared between three studies" |
| **Specialism** | outside it ×0.85 | | "outside your specialism" |
| **Pride** (a proud or arrogant trait, until humbled by a public defeat) | | hears a teacher at ×1.15 not ×1.6; learns little from failure; breakthroughs ×0.6 | "too proud to be shown" |

Every row is a factor the player can act on, and none is hidden: the skill's sheet lists the ones in force this season.

---

## 4 · How checks read a skill

Nothing in a card changes. `check: { s, s2, d }` keeps its shape and its arithmetic:
`A.checkVal = 0.6 × v(s) + 0.4 × v(s2 or s)`, odds `50 + (value − d) × 1.6`, held between 4 and 96, then v2's attempt
resolver, as today.

- For a stat key, `v` is the stat, as today.
- For a skill key, `v = max(what the level reads, the untried floor)`, where the floor is today's `4 + 0.3 × mean of
  the six stats` and "what the level reads" is `value(lv)` − rust, held to what the body carries (C9), less a wound's
  penalty, plus the specialism's two steps up or one down (§2.3), plus knacks (§6), plus the largest kin reading
  (`GD.SKILL_SYN`'s job, now from the data's kin: a kin skill at its weight × 2, at most half).
- **The mapping for old keys:** `SK.canon(key)` → `[skill, specialism or none]` from the data's `legacy` fields. A check
  on `xbow` reads Archery with *the crossbow*; on `logistics`, Stewardship with *supply*.
- **`d` is a level.** A check is even odds for someone whose skill reads `d`. So `d` 45 is an Advanced III task and
  `d` 55 an Expert task. The cards hold 2,555 checks in the forties, 2,123 in the fifties, 161 in the sixties and 5 in
  the seventies, so cards can prove Expert freely and almost never Master: a Master's proof comes from duels,
  masterworks, commands and `deed`.
- **What the player sees** is what he sees now: the words and the tipped scale of 24-honest-duel-odds and
  99993-v2-stats. The chip on a choice names the skill and its level ("Swordsmanship, Expert II"), and the specialism
  when it bore on it ("the knife: two steps up").
- After migration (§9) a skill reads under 4 points below its old number (the step beneath it), so no check's odds
  fall by more than 6.4 in 100 and none rise; the remainder is on the bar.

## 5 · How effects grant experience

- `fx: { skill: { k: n } }` → `A.gainXp(pc, canon(k), n × 0.2, { kind, what: the card })`, a stretch when the choice
  had a check, a `group` fight or a named stake, else practice (§3.2). Negative `n` (rare) takes experience, never a
  word.
- A check trains its skill: 0.3 effort as a stretch against `d`, a third more on a failure (31-learn-by-doing's
  top-up at `eventClose` becomes one call at the choice).
- New effect keys, declared in `A.FX_EXTRA`: `deed: "k"` (a proof and its experience), `grasp: "k"` (a breakthrough
  moment for skill `k`: the card is the named moment, the chance is the engine's unless the card says `sure: true`),
  `talent` (replaces `apt`), `specialism: { k: id }`. `C.lvl(p, k, min)`, `C.talent(p, k, letter)`,
  `C.ready(p, k)` (at an edge, concepts grasped, wanting a proof: for cards that offer the deed) and
  `C.stuck(p, k)` (at an edge behind a concept: for cards that are the master, the rival, the defeat).
- 5.2 for the shim: `A.trainSkill(p, k, amt)` = `A.gainXp(p, k, amt × 0.2, cause)` with the cause from `A.GROW.src`,
  the running activity or the open card, until each of the 337 callers passes its own.

## 6 · Passive and active, knacks and techniques: kept and cut

| From `growth.md` | In S1 |
|---|---|
| The eight words (§2.2) | **Kept**, with five steps each |
| Talent letters (§1.4, §10) | **Kept** as letters per skill, shown; areas, the budget at birth and discovery are G1's |
| The body's baseline (§1.5, §8; C9) | **Kept** unchanged |
| Disuse (§2.7) | **Kept** (§2.7 here) |
| Knacks, from the 114 perks (§2.1, §2.3) | **Kept**: three a skill, earned at the crossings into Advanced, Expert and Master (today 40, 65, 85), named in the crossing's record and listed on the skill's sheet with what they do. Their numbers are today's |
| Specialisms (§2.1) | **Kept**, re-made as §2.3 |
| Active skills: a choice on a card only one who knows it is offered (§2.3) | **Kept**: `C.lvl` and a specialism test in `cond` and on a choice (`need: { lvl: ["medicine", "advanced"] }`) |
| Arts, forms and techniques (§3; 07-duels' styles, `p.styles`, `p.techs`, `styleXp`) | **Kept as they are**; only their rank words change (§1.1). An art still never stands above its weapon skill. G4 gives arts concepts of their own |
| A proof for the top words (§2.2), trials at Expert and Master (standard §3.9) | **Kept** as the proving moment (§2.5) |
| Born by trying, no trees (§2.6) | **Kept, simply**: a skill is on your page from its first experience; "Things to try here" lists what this place offers. The failed first try and its talent hint wait for G1 |
| The census of the top (§2.2) | **Kept as a count, not a cap** (order 36, D-043): §10 |
| Thousands of narrow skills by rule (§2.5), marks of a life (§2.3), merging and fusion (§2.4, D-043), "heard of", manuals (§2.7), stolen forms | **Cut from S1**; they are G3, G4 and E2, and stand on this model unchanged |
| The 6% session "breakthrough", hours, three ladders, the use-and-practice share | **Removed** (§1) |

## 7 · The ledger: every change with its reason

- **One door.** `A.gainXp(p, k, effort, cause)` is the only way experience moves, and `SK.set` the only way a level
  does. `cause = { kind: 'work'|'practice'|'drill'|'stretch'|'card'|'kin'|'breakthrough'|'rust'|'migrate'|…, who, what }`.
- **The season's ledger** (the player only), kept for the current season and the last:
  `pc.skl = { s: seasonKey, k: { sword: { x: 31.2, by: { "drill:Sir Odo": 22.0, "stretch:the bout with Sir Rauf": 9.2 }, tags: 0b0101, held: 4.1 } } }`.
  `by` holds at most four causes a skill (the rest sum into `other`); `tags` is a bit set of §3.6's rows in force;
  `held` is what went into the store, and what the half rate cost is its own line (`lost`), so the sums close.
- **Turning points** go to the record (`pc.skr`, at most 80, the oldest folded into one line a decade):
  `{ y, k, t: 'born'|'step'|'word'|'grasp'|'breakthrough'|'stall'|'leap'|'rust'|'slip'|'ceiling'|'knack', text }`. A step
  is recorded only as the last of its season; words, grasps, breakthroughs, stalls and rust always.
- **The season's line** (31-learn-by-doing's, rewritten): "This season Swordsmanship rose a step, chiefly from Sir
  Odo's drill and the bout with Sir Rauf. Craft held: the village work asks nothing new of you." Two causes at most, one
  stall named, no numbers.
- **The test of it** (`s1Reason`): over a thirty-year bot life, for every skill, the ledger's sum equals the experience
  gained, stored and lost, and no entry lacks a cause.

## 8 · What the player sees

No percentages and no bare numbers. Descriptions open on a tap, nothing on hover, every target at least 44 points.

**The Profile page's Skills panel** (best five; "All skills ›" opens the whole list by group):

```
┌──────────────────────────────────────────────┐   375 wide; a row is one control, 52 points tall
│ Swordsmanship                     Expert II  │   name left, level right, both 16 px
│ ▰▰▰▰▰▰▰▱▱▱▱▱▱▱   steady · a rival ahead       │   the bar (aria: "about half way to Expert III"), then two words of state
├──────────────────────────────────────────────┤
│ Riding and the lance            Advanced V   │
│ ▰▰▰▰▰▰▰▰▰▰▰▰▰▰ ▫▫  held: the gallop's balance  │   full bar, hollow ticks = stored steps, the reason in five words
├──────────────────────────────────────────────┤
│ Letters and learning    Rusty · Advanced II  │
│ ▰▰▱▱▱▱▱▱▱▱▱▱▱▱   unread nine years            │
└──────────────────────────────────────────────┘
```

**A skill's sheet** (a tap on the row; a full-screen sheet on a phone with a 44-point close, one column, scrolls):
1. The name, the level in words ("Expert, the second step of five"), one line of what the skill is.
2. **The way to the next step:** the bar, "about half way", and the pace in a word with its reason: coming quickly,
   steadily, slowly, hardly at all, held ("slowly: you are past forty and no one here can teach you").
3. **The next word:** its concepts, each a row that opens its own description: "The tempo: clearer" · "The feint read:
   dark". Then what is wanted: "and a proof: a fight won against a Master, a work judged."
4. **This season:** the two largest causes and every factor of §3.6 in force, as words.
5. Discipline ("disciplined: three years unbroken"), talent ("B: gifted"), specialism (and "Choose a specialism" when
   one is offered), knacks, kin ("helps: Footwork, Spear"), rust, the body's hold if any, your teacher and his ceiling.
6. "Its story ›": the skill's turning points from the record.

**Elsewhere:** the rail's "Best skills" (three rows, name and level); the choice chip on a card (§4); the plan picker
(skill, level, and one word of what the month would be worth); the season's line; Records' Skills section (all skills,
all turning points). A level-up on a word, a grasp, a breakthrough, a stall of a year and rust each write one line in
the log; a breakthrough and a new word from Expert up are notable (they may stop a Next year, as a coming of age does).

**On a phone** (rule 21): the panel is one column at 375 × 667 with 16-point gutters; the bar is a `<i>` scaled by
`transform: scaleX()` (no width animation); all skills is a list of at most 28 rows in 11 folded groups, drawn only
when opened; nothing depends on hover, a long press or a key.

## 9 · Migration

One step, `skills`, in `A.V2SAVE.upgrade`; `A.SAVE_VER` goes up by one. It draws no dice and is the same on every load.

| Old | New |
|---|---|
| `p.skills[k]` = v (0 to 100), a broad key | `lv` = the highest level whose value is ≤ v; `xp` = the share of the way from that level's value to the next, as that share of `cost(lv)`; `best = lv`. Nobody reads as much as 4 points lower than before, and the difference is on the bar. `p.skills[k]` is rewritten to `value(lv)` |
| `p.skills[legacy]` (dagger, xbow, lance…; NPCs still hold them apart) | the skill takes the higher of the two numbers; if the legacy number is at least 35 and within 5 of it, the person gets that specialism (at most two, the highest first); the legacy key is deleted |
| The player's skill above what a word's proof would ask (any v ≥ 55) | kept; proofs are deemed given for every word already held |
| `p.apt[k]`: ≤ 0.5 / ≤ 0.75 / 1 / ≥ 1.2 / ≥ 1.45 / ≥ 1.8 | talent F / D / C / B / A / S (`growth.md` §5's table), in `p.tal[k]`; a legacy key's talent goes to its skill if higher; `p.apt` deleted |
| Perks | knacks, read from the level. The crossings (35, 55, 72) are lower than the old thresholds (40, 65, 85), so everyone keeps what they had and some gain a knack early; nothing is stored |
| `job.spec` | the matching skill specialism, by a table in `data/skills.json` (`jobSpec`) written in S1b from `GD.SPECS`' 105 rows |
| `p.styles[*].rank` 1 to 5 | unchanged numbers, new words |
| `pc.habit[k]` years | streak = 12 × years, at most 60 |
| `p.used[k]` | the disuse clock, unchanged; rust starts at 0 (nobody is rusted by loading) |
| `pc.grow` (31's ledger) | dropped; the new ledger starts with one `migrate` entry a skill |
| v2 hours | none were stored |

**Grasp tables for people who already exist.** The need is a hash, so there is nothing to seed. What is seeded is what
has been grasped: **every concept of every word a person already holds is grasped** (nobody loses a word), stamped
with the year of loading and the cause `migrate`. For the next word, insight starts at `need × (step − 1) / 5 × 0.6`,
rounded down, so someone deep in a word is part of the way to its concepts and nobody is handed one; a blind spot
stays blind. NPCs get no stored grasp at all (§10).

Every save in `tests/saves/` (thirteen, and `press/`) must load, convert and pass the new coherency checks; a test
loads each and asserts the table above row by row.

## 10 · Other people

- **One number, as now.** An NPC keeps `p.skills[k]`: the value his level reads (so it only ever holds one of the 35
  values after migration). No bar, no ledger, no stored grasp. `SK.lvOf(p, k)` reads it.
- **The same rules, in closed form, once a year** (`SK.npcYear`, for the people the world already steps yearly): from
  his post's effort and demand, his teacher if he has one, his talent, his age and the years, the expected experience
  of the year is worked out by the same formula and added to a per-person carry held in the level's fraction (one byte
  a skill, `p.skx`, only for skills that are moving). At an edge the hash says whether his concepts have come by this
  age: `graspedBy(person, skill, concept, effortYears)` compares the need with the insight his years of work would have
  given at the expected rate, and a per-person hash decides the breakthroughs he has had (at most three). So an NPC
  master is a person whose concepts came; an NPC stuck at Expert V for twenty years has a concept that did not, and
  his card can say which. Pure, no dice from the world's stream.
- **The few who matter month by month** (at most 24: your teacher, rivals, pupils, household, companions, your
  officers) get the player's monthly step for their three best skills only, at the player's cost.
- **Teachers.** A teacher teaches up to the word under his own, and **shows only concepts he has grasped**; his own
  blind spot is the thing he cannot teach (the Codex's masters each have one). "Who here can teach me the tempo?" is a
  question the page can answer.
- **The census.** `S.top = { gm: [ids], legend: [ids] }`, rebuilt yearly: everyone whose best skill reads 88 or more,
  96 or more. **A count, not a cap** (order 36, D-043 item 1: "no count limit"); the Codex's "living ladder" page
  reads it. Rarity is kept by what the top takes: two Grandmaster concepts with needs of 28 months each for an ordinary
  mind and blind spots half again as common, a talent of B or better to reach it at all, a proof against a Master,
  and no teacher below Legend who can show them. The test bounds it: over 200 years on five seeds the world holds 1
  to 12 Grandmasters and 0 to 2 Legends alive at any time; if it does not, the needs are tuned, never a cap added.

## 11 · Choices the owner may want to change

1. **Five steps to a word** (35 levels). Three would be plainer; ten would tick more often and mean less.
2. **How hard the walls are.** Under the best training one ordinary talent in seven never reaches Master and one in
   ten takes over twenty-six years; with ordinary training far more never do. `NEED` and `BLIND` in `model.mjs` are the
   two dials.
3. **Stored at half.** Work at an edge without the concept is banked at half. At full, a stalled person's leap is
   twice as big; at nothing, a stall is pure loss.
4. **Proofs at Expert and Master** (D-067 asked you to confirm): kept here as the moment that names the crossing.
5. **Talent shown as a letter** from the start in S1 (as stars are today). Your order 34 wants talent hidden and found;
   that is G1's and would hide the letter here too.
6. **Every calling has the eight words.** Order 36 kept the ranks for combat and wanted other lives measured by fame
   and deeds; order 63 asks for skills with levels, and this reads it as all 28. Career *rungs* stay gone either way.
7. **A count of Grandmasters, not a cap** (order 36), where the growth standard still said ten and one.
8. **Languages and literacy stay as they are** in S1 (`pc.langs`, `literate`); they become skills with G3.
9. **No new skills yet** (Law, Teaching, Tongues are specialisms or later).
10. **The 114 perks stay** as knacks at the word crossings. They could instead be cut with the proficiencies.

---

## 12 · For the builders (S1b)

### 12.1 Where it lives

- **The model:** a new plain module `src/people/engine/skills.js`, a port of `docs/design/skills/model.mjs` (levels,
  `value`, `cost`, `need`, `graspWord`, the month for one person, the year's disuse, the NPC closed form), with the
  standard's pieces it imports (`R`, quality, teacher, learn-age, grace) ported beside it as
  `src/people/engine/growth.js`. No DOM, no `A`: it takes a person record, the data and a `rand` function, returns
  what changed and the ledger entries. Unit tests `tests/v2/skills.test.js`. Bundled by `tools/build-v2.mjs` (`A.V2.skills`).
- **The data:** `data/skills.json` (from `docs/design/skills/skills.json`, plus a description and a "never grasped"
  line a concept, practice lines, each career rank's demand, `jobSpec`), on the page as `A.DATA.skills`. About 60 KB
  raw; it belongs in the lazy payload if X7's budget asks.
- **The feature:** `src/people/36-skills/` (after 35-moods, before everything that wraps skills today):
  `a-model.core.js` (`A.SK`: `lvOf`, `set`, `canon`, `A.gainXp`, the monthly and yearly passes, the census),
  `b-fx.core.js` (the stages), `c-migrate.core.js`, `d-view.core.js` (`UI.skillRows`, the sheet, the activity's sheet),
  `skills.events.js` (twelve to twenty cards that are the moments: a master's word, the rival, the defeat, the deed
  offered), `test.mjs`, `README.md`.
- **Plugging in.** `A.onMonth.push(pc => A.SK.month(pc))` runs the player's and the 24 active people's month after the
  month's efforts have been queued (efforts during the month call `A.gainXp`, which only adds to a per-skill month
  buffer; the monthly pass applies the life's factors, rolls insight and breakthroughs in skill-id order, settles
  levels, writes the ledger). `A.addStage('A.applyFx', 'skills', …)` handles `skill`, `deed`, `grasp`, `talent`,
  `specialism` and passes the card as the cause; `A.addStage('A.eventChoose', 'skills', …)` replaces 31's
  `learn-by-doing` stage (the check's effort, with failure known); `A.addStage('A.newGame', 'skills', …)` builds the
  player's table; all four names go into `src/core/01-stages/manifest.core.js`. Chance uses only `A.rand`, always one
  draw per open concept and one per moment in a fixed order, so a replay matches.

### 12.2 Files and functions, in order

| # | File / function | Change |
|---|---|---|
| 1 | `src/people/engine/growth.js`, `skills.js`, `tests/v2/skills.test.js`, `tools/build-v2.mjs` entry | the model, ported and unit-tested |
| 2 | `data/skills.json` | the list; descriptions and "never grasped" lines written (Sonnet, in two lots, by lint) |
| 3 | `src/people/36-skills/a-model.core.js` | `A.SK`, `A.gainXp`; `p.skills` becomes the mirror |
| 4 | `03-engine-base.js` `A.skill`, `A.skillEff`, `A.trainSkill`, `A.perksOf…`, `A.rollApt` | `A.skill` reads the mirror, adds specialism; `A.trainSkill` becomes the shim; perks read word crossings; talents as letters |
| 5 | `18-event-view-a.js` `A.checkVal`, `eventChoose`'s check training, `applyFx`'s `skill` and `apt` cases; `17-careers-and-event-engine-b.js` `C.prof`, `C.apt`, `C.skill` | §4, §5; `C.lvl`, `C.talent`, `C.ready`, `C.stuck` |
| 6 | `16-classes-roles-and-paths.js` `A.planDay`, `A.planMonth`, `A.trainTargets`; `17-…-a.js` `A.pathMonth`; `06-…` `A.schoolYear`; `15-…` `A.sessionQ`, `A.growthYear`, `A.SESSION_ACTS`, `A.specMul` | the monthly effort, work against demand, school as drill, condition for every effort, the standard's disuse; the drip and the old rust removed |
| 7 | `07-duels.js`, `08-soldiering.js`, `09-…`, `10-…`, `11-…`, `12-…`, `13-…`, `04-…-b.js` and the content packs' 190 direct `A.trainSkill` calls | pass a cause; fights as stretches against the opponent; `GD.STYLE_RANKS`, `GD.STYLE_PROF` |
| 8 | `c-migrate.core.js`, `src/core/99998-v2-saves` | §9 |
| 9 | Retire into `archive/s1-proficiencies/`: 31-learn-by-doing's wrappers (its season line moves), 49-body-mind `numbers.core.js`, 69's `LN.MERGE` block, `999997-bodies`' `trainSkill` wrapper (its stall becomes a ledger reason in `A.gainXp`; `A.skillCap` stays), `99993-v2-stats`' `tierOf`/`hoursOf`/`skillRows` and the tier words in `i-`/`j-numbers`, `g-bands`; `engine/body.js` `SKILL_TIERS` | one definition of a skill, not five wrappers (X2's count of names defined twice falls) |
| 10 | `d-view.core.js`; `23-ui-a.js`, `23-ui-b.js`, `23-ui-e.js`; `999996-profile-tab`; `59-descriptions`; `91-visual-style`; `90-collapsible-sections`; `999997-scope`; `99998-click-open`; `13-factions-and-decisions.js:1685` | §8 and §1.3 |
| 11 | `SK.npcYear`, the active 24, the census, `32-legend-and-master-caps`' page | §10 |
| 12 | `tools/lint-skills.mjs`, `tools/check.mjs`, tests, `tools/bench/targets.mjs`, docs, CLAUDE.md's helper and effect lists, the `life-sim-systems` skill | §12.5, §12.6 |

### 12.3 Data per person (rule 21: bounded)

| | Shape | Bound |
|---|---|---|
| The player, a skill | `pc.sk[k] = { lv, xp, st, pv (proved), b (best), r (rust), u (year used), s (streak), g (gap), f (fresh until), i: { conceptId: insight } (≤ 3), got (a 9-bit mask), sp: [≤ 2] }` | ≤ 28 skills × about 90 bytes = **2.5 KB** |
| The player's ledger | two seasons × ≤ 28 skills × ≤ 5 causes | **≤ 3 KB** |
| The player's record | ≤ 80 turning points × about 90 bytes, the oldest folded | **≤ 7.5 KB** |
| The player's talents | `pc.tal`, ≤ 28 letters | 0.3 KB |
| An active person (≤ 24) | ≤ 3 skills of the player's shape, no ledger | ≤ 0.3 KB each, **7 KB** in all |
| Any other person | `p.skills` as today (fewer keys: the ten legacy keys go), `p.skx` one byte a moving skill, `p.tal` only where it is not C | **smaller than today** |
| The world | `S.top` | ≤ 0.5 KB |

Hard cap for the player's skill state: 16 KB; a test saves a 70-year bot life and measures it. Nothing grows with
years played. Look-ups are by id in plain objects built once; the monthly pass makes no objects when nothing changed.

### 12.4 Cost

Budget: **under 1 ms a month** for the player and the 24 active people together, on the A1 gate's machine; under 4 ms
with the CPU slowed four times. The player's month is at most 28 skills × (a dozen multiplications + up to three
draws); the active people 72 skills; `need()` is two hashes, memoised per person and concept for the session (a
`Map`, at most 28 × 9 entries a person, dropped with the person). The yearly NPC pass is closed-form arithmetic over
skills that are moving, about 5 µs a person. The daily drip's 365 calls a year go, so a year gets cheaper. Held by a
test (`s1Cost`: 1,000 months for a full sheet with the runner's `cpu()`) and by `tools/bench/press-gate.mjs` unchanged.

### 12.5 Tests

| Test | What it proves | Bar |
|---|---|---|
| `skills.test.js` (unit) | `value`, `cost`, `levelOfValue` round-trip; the cost table equals this doc's; `need` is pure and equal across two runs | exact |
| `s1NotLinear` (unit + 12 bot lives) | experience for the same month at Beginner III and Master III; yearly steps gained while Intermediate against while Expert | ≥ 20 to 1; ≥ 3 to 1 |
| `s1Spread` (unit, the model's spread run in the engine) | 400 seeded people of talent C, identical training: years to Master | the fastest under 10, the 90th centile over 20, between 8 and 25 in 100 never, and no two adjacent seeds share a path |
| `s1TwoLives` (browser, 2 × 6 seeds) | two players with the same scripted training for 25 years | end levels differ by a word or more in at least half the pairs |
| `s1Reasons` (30-year bot life) | every crossing of a word has a grasp or breakthrough record for each concept and, from Expert, a proof; every breakthrough names a moment; every stall of a year names what is missing | none missing |
| `s1Ledger` | the ledger's sum equals experience gained + stored + lost, a skill; no entry without a cause | 1e-6 |
| `s1BlindSpot` (unit) | a person with a blind concept, 40 years of the best training | stays at step V; the page says "it does not come" after five years; a forced moment can still break it |
| `s1Prodigy` (unit) | talent S, easy needs, a Grandmaster's drill | Master in 4 to 7 years |
| `s1Dynamic` (unit, one factor at a time) | streak, rival, new land, rest, purpose, hours shared, specialism, kin each move experience or insight by the stated factor and write their tag | exact |
| `s1Rust` | the standard's `g0Decay` in levels | exact |
| `s1Checks` | 200 sampled checks on each sample save: odds before and after migration | none higher, none more than 6.4 lower |
| `s1Migrate` | every save in `tests/saves/` loads; §9's table row by row; no word lost; `p.apt`, legacy keys, `pc.grow` gone | exact |
| `s1Mirror` | `p.skills[k] === value(lvOf)` for everyone, after 20 bot years; nothing but `A.SK` wrote it | exact |
| `s1NoProficiency` (browser) | every page, sheet, overlay, popover, log line and card of three 30-year lives, at 1366 and 375 wide | no "proficien", "Untrained", "Journeyman", "Adept", "Novice", "Skilled", "Trained" as a skill word, "hours" after a level, digits or "%" in a skill row |
| `s1Phone` | the Skills panel and a skill's sheet at 375 × 667 | no sideways scroll; every control ≥ 44 × 44; nothing on hover (99998-click-open's lint) |
| `s1Census` (5 seeds × 200 years, long tier) | living Grandmasters and Legends | 1 to 12; 0 to 2 |
| `s1Cost`, `s1Size` | §12.4, §12.3 | as stated |
| existing | `renderRng`, `replayWithRender`, the save tests, the balance league, coherency (new checks: no level without its concepts; no teacher teaching above his ceiling; mirror) | green; a band widened only with a reason |

### 12.6 Lints (`tools/lint-skills.mjs`, run by `tools/check.mjs`)

- No `proficien` in any string literal, template, `data-note`, README-for-players or data file under `src/` and `data/`
  (comments in `archive/` and docs excepted); none of the retired tier words beside a skill.
- No write to `.skills[` or `.skills.x =` and no read of `.apt` outside `src/people/36-skills/` and `archive/`.
- No `A.trainSkill(` outside the shim once stage 5 is done; no `C.prof(` or `C.apt(` at all.
- `data/skills.json`: unique ids; nine concepts a skill in the 1-1-2-2-2-1 shape; every kin and legacy key resolves;
  every concept has a description and a "never grasped" line of at most 14 words; every skill has a reader (a check, a
  post or a hook names it: the dead-numbers rule).
- `tools/lint-events.mjs` learns the new keys and helpers; a check's `s` must be a stat, a skill or a legacy key.
- `tools/lint-stages.mjs`' baseline falls (the four wrappers of `A.trainSkill` and three of `A.skill` become one).

### 12.7 Stages, each a commit with its "done when"

| Stage | Work | Done when |
|---|---|---|
| **1 Engine** | `growth.js`, `skills.js`, `data/skills.json` (names only), unit tests | `node --test tests/v2/skills.test.js` green: cost table, `s1Spread`, `s1Prodigy`, `s1BlindSpot`, `s1Rust`, `s1Dynamic` in the engine; the model's nine lives reproduce `lives.json` |
| **2 The store and the mirror** | `36-skills/a-model`, migration, `A.skill` reading the mirror, `A.trainSkill` as the shim; nothing visible changes but the tier a row shows | all thirteen saves load (`s1Migrate`); `s1Checks`, `s1Mirror` green; the whole quick tier green; `identity-probe` shows the same event classes |
| **3 Sources** | the monthly plan, posts against demand, checks and effects as effort, fights as stretches, school as drill, the standard's disuse; the drip and old rust removed; the ledger | `s1NotLinear`, `s1Ledger`, `s1Reasons` green; the balance league in its bands or a band widened with a reason; `press-gate` no slower |
| **4 Concepts and the life** | insight, proof, breakthroughs, stored experience and leaps; discipline, rival, new place, needs, kin, hours, specialisms; the moment cards; `C.ready`, `C.stuck`, `deed`, `grasp` | `s1TwoLives`, `s1Spread` in the browser, `s1Reasons` with breakthroughs; `lint-events` and `lint-choices` pass for `skills.events.js`; a playtest pass answers "why has my sword stopped?" from the screen eight times in ten |
| **5 The page and the words** | `UI.skillRows`, the sheet, "Work at a skill", the season's line, Records; every string of §1.3; the old wrappers and views to `archive/` | `s1NoProficiency`, `s1Phone`, `renderRng`, 99998's lint green; the clutter bench no worse on the Profile page |
| **6 Other people and the top** | `SK.npcYear`, the active 24, teachers who hold concepts, the census page, `C.prof` and `A.trainSkill` callers moved, the lints on, docs, CLAUDE.md, the `life-sim-systems` skill, CHANGELOG, a sample save | `s1Census` (long tier), `s1Cost`, `s1Size`; `tools/lint-skills.mjs` in `check.mjs`; both tiers green; a version |

Opus 5.5 for stages 1 to 4 and 6, Sonnet 5.5 for the data lots and stage 5's strings, a Fable 5.2 review of the
concept names and their "never grasped" lines before stage 4.

### 12.8 Risks

- **Every purse and fight moves** when the drip goes and levels quantise. Stage 2 changes no odds by more than 6.4;
  stage 3 is where the balance league must be watched, one source at a time.
- **A stall that reads as a bug.** A full bar that does not move must always say why, on the row itself; the playtest
  question in stage 4 is the guard.
- **The top too thin or too crowded.** Tuned by `NEED` and `BLIND` against `s1Census`, never by a cap.
- **Chance in the month's pass** changes what a seed gives compared with today. That is a new version, not a replay
  break: replays of the same build still match (`replayWithRender`).
- **G1 and G3 arrive later.** Talent's source, the seventeen stats, the first-try roll, narrow skills and fusion all
  attach to `A.SK` without changing the store: talents through `SK.talent(p, k)`, governing stats through the data.
