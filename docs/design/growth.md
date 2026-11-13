# Growth in depth: stats with rules, one skill system, hundreds of fighting styles, legendary arms (G)

*Stamped 2026-11-13 11:55 ET · work item G, the first step of v3 (owner order 32, D-034, D-037) · by Fable 5.2 at maximum effort · a design for the owner to steer; nothing is built · supersedes nothing*

The owner's order, in short: more stats, each clearly defined; skills passive and active, "100s-1000s", for every route "in extreme depth"; proficiencies merged into "skills with different levels that can then evolve and merge"; each nation's "standard training for each of their regiments as well as tactics"; family styles, "some styles weaker than standard military and others far exceeding it"; a style for each elite order; legendaries with "their own unique design", "far more visually appealing than other weapons".

**The plan in short.**
- **Three things grow, where nine overlap today:** stats (what you are), skills (what you can do), styles (how you fight).
- **Seventeen stats, each with a job** and a rule sheet on a click. Three measures on today's sheet do nothing in play.
- **One skill system.** The 28 proficiencies become root skills; perks, specialisms, techniques and languages become skills under them, passive and active, levelled in words. A skill at Master can evolve; two can merge.
- **About 4,600 skills, none filler:** each is knowing a real thing of the world, read where that thing is handled. 1,550 exist under other names, 780 come by rule, 2,260 are to be written.
- **Limits without slots:** talent, time, age and rust; six arts ready in a fight.
- **About 550 fighting styles** (265 today): a standard for every regiment of every realm, with its tactics; house and family styles; one for each of the eight orders; all graded against the standard.
- **Legendary arms** each get a signature art and their own drawing.
- **Cheap:** other people's skills are worked out when asked for, never saved.
- **Six stages, eight choices for the owner** (§6.5).

Technical detail is under **For the builders**; a busy reader can keep to §1.1, §2.4, §3.2 and §6.5. Counts and timings come from the code and `docs/design/trials/growth-skills.mjs`.

## 0 · What the game has now

| | Today, measured | Where it stops |
|---|---|---|
| Stats | Six in the engine, read at 88 places and by about 5,700 event checks; the sheet shows eleven measures over them | Memory, Presence and Cunning are shown and nothing reads them. No stat says what moves it |
| Proficiencies | 38; the player sees 28, because two earlier steps folded ten away as dead numbers | A smith and a mason share one number, Craft |
| "A bit better" | 114 perks, 105 specialisms, 3 masteries, 5 arms of service, 4 doctrines, talents, 22 languages, 8 drills | Nine overlapping systems; Road to Ten asked for one |
| Fighting styles | 265, written by hand: 93 national, 61 masters' lineages, 111 household; 1,284 techniques | Of 192 regiments (each realm's kinds of troops) 110 have one. None of the eight elite orders is tied to one. None is rated against another |
| Growth | More from doing than from practice; talent; rust after two idle years; NPCs' skill numbers rolled at birth and saved | Nothing limits how much one person knows |

## 1 · Stats

### 1.1 The set

Seventeen, in four groups: body, mind, spirit, standing. The engine's six stay. Five that the sheet shows but the engine only derives from the six become stats of their own (Toughness, Memory, Judgment, Presence, Cunning). Three are new (Hands, Senses, Nerve). Three that are bars today get rules (Looks, Renown, Honour).

| Stat | What it does | Rises by | Falls by |
|---|---|---|---|
| **Strength** | The weight of a blow; heavy arms and bows; armour without slowing; a labourer's yield | Heavy work, wrestling, the yard | Age, idleness, hunger |
| **Speed** | Who strikes first; flight and chase | Running, swordplay, games | Age (first to go), leg wounds, weight carried |
| **Endurance** | Long fights, marches, long days; how fast weariness lifts | Marching, labour, the oar | Age, lung fevers, idleness |
| **Reflexes** | Parry and counter; reading a blow | Sparring, real fights, the hunt | Age (late), drink, weariness |
| **Toughness** | How bad a wound is; fever, cold, hunger; how much training you can carry | Hard living and blows survived | Age, long illness, starving |
| **Hands** | Fine work: the make of what you forge, surgery, locks, the bowstring, the pen | Fine handwork, begun young | Age, hand wounds, heavy labour |
| **Senses** | Shooting far; watch and scouting; the tell of a lie or a false coin | Mostly born; the watch, the hunt | Age (eyes, then ears) |
| **Wits** | Solving, planning, learning hard things | Study, varied work | Great age, head wounds |
| **Memory** | How fast teaching sticks; how many skills stay sharp | Learning by heart, tongues, teaching | Age, drink, fever |
| **Judgment** | Fewer blunders; a truer reading of risk | Years, mistakes survived, office | Fury, drink, exhaustion |
| **Cunning** | Lies, plots, bargains, feints, against the other side's | Court, trade, crime | Long solitude |
| **Will** | Pain, grief, long tasks; the surge that turns a lost fight | Hardship borne, vows kept | Despair, broken vows |
| **Nerve** | Steadiness with danger in front of you: a first battle, a charge, a storm | Only danger faced and come through | A rout, a maiming; long peace |
| **Presence** | Orders obeyed, speeches heard, the heart of your men | Leading, speaking, victories, rank's dress | Shame, public failure |
| **Looks** | Courtship, marriage offers, first meetings | Born; health and dress, a little | Age, scars, pox |
| **Renown** | Opens doors; draws rivals and thieves | Deeds, by odds beaten and witnesses | Time, slowly |
| **Honour** | Whether your word is taken: oaths, loans, parley | Promises kept, debts paid | A broken word, at once |

**Faith** shows only for the faithful, **Authority** only for those who rule or command. Height, weight, build, health, mood and weariness stay as readings.

**In words,** on the Profile tab (P). As now, the body in real units beside a thing you know ("lifts 180 kg, about a big hog; better than most soldiers"), the rest as a word and a rarity ("shrewd; better than all but 1 in 40"). A click adds whether it is rising or fading, what holds it back ("a strained back, mending by Michaelmas"), what would raise it, and the room left (plenty, some, little, none).

### 1.2 The limits every stat obeys

1. **Your ceiling.** Birth sets how far ordinary training takes each stat: your people, sex, parents, luck and build. Gains shrink as you near it.
2. **Your people's limit.** No training passes it. A breakthrough (a win against long odds with something real at stake) lifts your own ceiling by about an eighth, never past the limit.
3. **Your age.** A child has only the share of a grown body its years allow, and drilling a small child gains little. Each stat fades from its own age; care slows it.
4. **Your month.** The plan's pace (rest, light, steady, hard, brutal) is the dial; extra sessions gain less and add load. Load above what you can carry makes you weary, then costs health, then strains something (B6). Today everyone carries six and sheds four a month; Toughness will set what you carry (four to nine), Endurance and comfort what you shed.
5. **Use.** A trained body slides back toward an untrained one over a few idle years. Minds only age.
6. **Wounds, illness, gear.** A wound cuts the stats of its part while it mends, and may leave a mark. Armour slows you; a reading stone gives old eyes their books; fine dress lends presence.
7. **Skills.** Passive skills raise and lower stats (§2.3), together by no more than one step of a stat's word scale.

### 1.3 Peoples and builds

| People | Ceilings lean high | Lean low | Grown at; fading from about |
|---|---|---|---|
| Human | the widest spread of talent | | 20; 43 |
| Elf | Speed, Reflexes, Senses, Memory, Presence | Strength, Toughness | 40; 300 |
| Dwarf | Toughness, Endurance, Hands, Will, Memory | Speed, Presence | 25; 150 |
| Orc | Strength, Toughness, Nerve, Will | Endurance, Memory, Judgment | 16; 38 |
| Giant | Strength and Toughness, far beyond the rest | Reflexes, Speed, Hands, Cunning | 30; 77 |

Half-elves and half-orcs sit between their parents. The eight builds tilt the ceilings a little (slight: quicker, weaker; sturdy: tougher, slower). They are the builds C8 draws: the body you see is the body you have.

### 1.4 For the builders

- **Keys.** `str spd ins sta int wil` stay. New: `tgh dex per mem jud cun nrv pre`, through the same `A.stat(p, s)`.
- **Real work without rewriting 5,700 checks.** Each root skill has two governing stats (`GD.SKILL_STAT`), redrawn with the new ones (Craft: Hands and Wits). The pair sets a root's untrained floor in `A.checkVal` (today the mean of all six), its learning speed (today Wits alone) and a gate: no root passes Expert while either is poor, or reaches Master unless one is good (old saves keep what they have). Cunning adds to the difficulty of a check against a named person; Memory sets rust; Nerve is read in a battle's first phase and a duel's first exchange. Checks that name one of the six do not move.
- **Stored as v2's body is:** the player's values saved, an NPC's a pure view (`A.V2S.view`). Passives, wounds, build and gear go into one cached sheet per person, which `A.stat` reads. Event effects (`fx: { str: 1 }`) land as now, inside the same limits.

## 2 · Skills

### 2.1 One system

Everything a person can learn is a **skill**: a name, one line saying what it does, a kind (active or passive), a grade, a level, and the skill it hangs on.

- The 28 proficiencies on the sheet become the 28 **root skills**. Every event check still reads a root, so no card changes.
- The ten folded away (dagger, crossbow, lance, siegecraft…) return as branches with levels of their own.
- The 114 perks become **knacks**: passives a root gives at three points on its ladder.
- Specialisms, masteries, arms of service, doctrines, languages, literacy and drills become skills of the trade or post that grants them.
- The 1,284 techniques become **arts**: active skills used in a fight (§3.3).

### 2.2 Levels and grades

- **Roots** keep the ladder the sheet shows: Untrained, Novice, Apprentice, Journeyman, Adept, Expert, Master. Grandmaster and Legend are reached only on a **Way** (§2.4).
- **Every other skill** has four levels in the same words: Novice, Journeyman, Adept, Master.
- **The parent rule:** no skill stands higher than the skill it hangs on. You cannot be a Master of tempering while a Journeyman smith.
- **Grade** says how a skill is got, in the words items use. *Common:* by doing. *Rare:* from a teacher, school, post or book. *Epic:* by proof (a higher form, a merge, a house's or order's inner teaching). *Legendary:* one holder or one line at a time.

### 2.3 Active and passive

**Active skills are used:** as a **move** in a duel (an art) or an **order** in a battle (a tactic); as a **work** begun where the place allows (forge a blade, treat a patient, hold a rite, speak before the moot); or as a **choice on a card** about that thing: "Set the bone yourself" is offered only to one who knows bonesetting.

**Passive skills are always on:**
- **Knowing a thing:** better odds wherever it is handled, and sometimes the right to try at all (speak the tongue, make the pattern, wear plate without tiring).
- **Knacks:** small standing gains from a root's level.
- **Marks of a life:** what years of one life do to body and mind. They change how you grow, and each has a cost.

> **Ploughman's back.** Six years at the plough before twenty. Strength and Endurance grow faster from work; Hands grow slower; a little speed is gone for good.

Marks come from what you did for years, never from a list. A few are plain flaws (a flinch after a maiming) and can be worked off. A life gathers about a dozen.

### 2.4 Evolving and merging

- **A root at Master evolves down one of three Ways,** each opened by a proof. Blades: *the Duellist* (seven real duels won), *the Battle Sword* (the front rank of three battles), *the Sword-teacher* (three pupils raised to Journeyman). A Way gives a lasting passive and a top art, and alone opens Grandmaster and Legend. One Way a root.
- **A narrow skill at Master evolves into its higher form** where one is written: *Tempering*, proved on three fine blades, becomes *the Blue Temper*, a grade higher. About 120 exist; other skills stop at Master.
- **Two skills merge** when both are Adept and one deed has used both. *Riding the courser* and *the horse bow*, after a shot from the saddle in a real fight, become *Horse archery*. The merged skill takes its parents' places on the sheet, keeps what they did, adds its own effect and rusts as one. About 150, all written by hand.

### 2.5 Thousands, without filler

**A skill is knowing a real thing of the world, and it is read at the one place that thing is handled.** The billhook's skill is read when you fight with a billhook; wool's, when you trade wool; the boar's, when you hunt one. The code will have about thirty such places, one for each kind of thing, so a new skill needs no new code and cannot be a dead number.

| Source | Count | What |
|---|---|---|
| Exists today, re-housed | 1,553 | 28 roots, 10 branches, 114 knacks, 117 specialisms and the like, 1,284 arts |
| **Rules:** one skill for each real thing, from lists the game has or E1 and E2 will add | 784 | 72 weapon forms to handle; 110 patterns to make; 40 goods to judge; 35 realms' markets; 28 tongues and scripts; 64 beasts; 141 tactics; 19 faiths' four rites; 37 posts; and twelve smaller lists (armours, mounts, roads and waters, crops, stock, illnesses, drills, ground, arms to lead, ships, songs, law) |
| **Templates:** a fixed shape, a short row written by hand | 541 | 196 craft operations (28 trades); 45 herbs, operations and nursing; 40 locks, disguises, forgeries, poisons, ciphers; 24 speeches; field, estate, siege and sea works; woodcraft; feats of the body |
| **Signature:** written whole | 1,721 | 84 Ways, 120 higher forms, 150 merges, 200 marks, 28 gifts of a people, 100 family and masters' secrets, 210 common and weapon-form arts, 729 arts of the new styles, 100 arts of legendary arms |
| **All** | **4,599** | 1,698 passive, 2,901 active |

A lint holds every skill to a unique name, a parent, a place where it is read, a bounded effect and a way to learn it.

### 2.6 A tree for every route

A route is a view over the trees: the roots it stands on (a soldier on Melee, Hafts, Shield and Athletics; a merchant on Trade and Persuasion), the skills its ranks expect, its higher forms and merges. "Own skills" counts rule and template skills only, before arts, Ways, merges and marks.

| Route | Own skills | One thread of depth |
|---|---|---|
| Soldier | 103 | the billhook → *Hook and pull* → *File-closer* |
| Archer | 38 | the war bow → *the clout shot* → *the Far Hand* |
| Knight | 109, and a house or order style | the destrier → *Couch late* → *the Couched Charge* |
| Commander | 231 | *Shield wall* as an order → *the Unbroken Wall* |
| Smith and every craft | 354 | *Tempering* → *the Blue Temper* |
| Merchant | 156 | *Knows wool* + the Aldmark markets → *Wool factor* |
| Farmer | 62 | wheat → marling → *Good heart* |
| Herder, horsemaster | 130 | horses: keep, breed, doctor → *the Quiet Hand* |
| Priest | 118 | the burial rite → *the Good Death* |
| Scholar | 64 | law + rhetoric → *Advocate* |
| Physician | 57 | *Bonesetting* + horse-doctoring → *Farrier-surgeon* |
| Thief | 46 | the warded lock → *the Quiet Key* |
| Spy | 76 | cipher + forgery → *the False Seal* |
| Courtier, diplomat | 149 | each court's ways and tongues |
| Ruler, steward | 76 | the manor court → the mint → *the King's Peace* |
| Sailor | 57 | the cog: hand, then pilot |
| Hunter | 114 | the boar → *Boar-stander* |
| Minstrel | 64 | a known lay → a lay of your own |
| Outlaw | 107 | the forest roads → the ambush → ransom |

One tree in full:

```
Craft (root)                         Untrained … Master, then a Way
└ Smithing (a trade)                 never above Craft
   ├ operations   Drawing out · Upsetting · Forge-welding · Tempering · Grinding · Fullering · Riveting
   ├ patterns     Knife · Spearhead · Arming sword · Bascinet · …   one for each form a smith can make
   ├ judging      Iron · Steel · Charcoal
   ├ knacks       Reads the heat (Adept) · Wastes no iron (Expert) · A hammer that sings (Master)
   ├ marks        Smith's arm: Strength grows faster, Hands slower · Forge eyes: heat read by colour, far sight fading sooner
   ├ higher forms Tempering → the Blue Temper · Forge-welding → the Hidden Seam
   ├ merges       Tempering + judging steel → the Smith's Eye · Smithing + keeping horses → Farrier
   └ Ways         the Master's Mark (may sign masterwork) · the Armourer (fits plate to one body) · the Guild Father (teaches twice as fast)
```

### 2.7 Finding, learning, keeping

**What you see,** on the Profile tab: the skills you have; the skills **within reach**, each with who or what can teach it here and what it asks; skills you have **heard of**, by name only. The rest are not on your page: a peasant's is short, and grows as the life widens.

**How you learn.**
- **Doing:** still the main road. Handling a thing often enough finds you its common skill.
- **A master:** a named person who has the skill and is willing (a bond, a fee, your post, your blood). The fastest road; a teacher takes you to one level under their own.
- **A school, guild, regiment, order or house** teaches its own list to its own people; **blood** passes a house's style and a family's trade secret.
- **A manual:** a book is an item (E2) that teaches one skill up to a level, to a reader who has the root.
- **Watching:** a move seen in a duel can be stolen today; so can a craft watched at the bench, by Senses and Wits. Stolen skills start rough.

**What limits you.** Four things, and no slots.
- **Talent.** The six words that exist (Hopeless to Prodigy) set how fast a tree grows and how high. A hopeless hand stops short of Expert.
- **Time.** The plan holds three studies in place of one, sharing the same hours. All else grows only by doing; pushing harder is load.
- **Age.** The young learn fast, the old slowly. A skill that asks a strong body can fade out of reach; an old master can still teach it.
- **Rust.** A narrow skill unused for three years is rusty: it works a level lower and comes back in a season. Unused for ten, it drops a level for good, never below Novice. Roots keep today's rule. Memory stretches these spans.

A slot limit would be a menu to tend, and would break the owner's rule of no cap, only consequences (D-019). The one exception is a fight, where nobody holds twenty drilled answers ready: you go in with **six arts**, chosen beforehand.

**Other people.** An NPC's skills are not rolled and not saved. Every trade rank, post, regiment, house and order has a **kit**: what a person of that life would know. A hash of the world's seed, the person and the skill picks which optional ones this person has and how well, capped by the roots they carry. It is worked out when something asks (a duel, a person's card, "who here can teach me?"), in about ten microseconds, the same every time. Only what an NPC gains in play is stored.

### 2.8 For the builders

- **Engine:** a plain module, `src/people/engine/skills.js`, unit-tested in node. `A.skill`, `A.trainSkill`, `C.prof` and `GD.SKILLS` keep their meaning; the 38 old keys stay as numbers in `p.skills`. The four wrappers on `A.skill` and `A.trainSkill` (31, 49) become one definition.
- **Effects, bounded.** A narrow skill adds 4, 8, 12 or 16 points to a check at its own hook. Knacks keep the perks' numbers and, in G2, their thresholds (40, 65, 85), so no odds move; the v3 balance pass moves them to the level edges (45, 60, 75: Adept, Expert, Master). Passives on one stat sum to within ±12; growth changes to within ×0.5 and ×1.5.
- **Hooks by kind:** `A.fighterFrom` (weapon form, armour, mount, arts); forging; trades; journeys; hunts; the harvest; illness and wound care; `A.tacticsFor`; `A.drillDay`; sieges; rites; gatherings; crimes; a post's year; trials; and `A.checkVal` for cards tagged `about: ["good:wool"]`.
- **For events:** `C.has(p, id, level)`; effect keys `learn`, `mark`, `unlearn`, declared in `A.FX_EXTRA`.
- **Legends are few.** 32's census widens from fighters to every root: a handful alive in each.

## 3 · Fighting styles

### 3.1 Five kinds

| Kind | Today | Planned | How it is made |
|---|---|---|---|
| **The standard:** a realm's training for one kind of regiment (levies, spears, men-at-arms, archers, crossbows, light horse, knights…) | 93, covering 110 of 192 regiments | about 225: one for each realm and each branch it fields (D11) | The 93 are named the standard of their regiment. About 130 more come from 15 drill books (eight arts a branch) and three accent arts a realm |
| **House and family styles** | 111: 64 of 180 great houses, 47 of 350 lesser noble and knightly families | about 180 | 40 written for great houses; 30 lesser families get their arm's standard with one family art and one changed weakness |
| **Order styles** | 0 | 8 | Written whole, eight arts each, from each order's lore |
| **Companies, watches, folk ways** (the dockside knife, the poacher's bow) | 0 | 80 | 60 written, 20 from the drill books. They give sailors, hunters and outlaws a style |
| **Masters' lineages** | 61 | 61, and those founded in play | Kept |

About 550 styles and 2,300 arts.

**Each standard carries its tactics:** three to five battle formations its men are drilled in, its own manoeuvre, and a floor its drills never fall below. Aldmark's heavy horse learn the Two-Wave Lance: the couched lance, the flanking charge, the rally and the Two-Wave Charge itself; weak in forest and against stakes.

### 3.2 Graded against the standard

Every style has a grade, shown in words against your own realm's standard for the same arm.

| Grade | Who | At equal body, skill and gear | Years of teaching to its top rank |
|---|---|---|---|
| **Weaker** | Folk ways, levy drill, a quarter of family styles (old, proud, out of date) | Loses 6 fights in 10 to the standard | 3 |
| **The standard** | Line regiments; a third of families (equal, but different) | Even | 4 |
| **Stronger** | Knights' and guards' drill, good houses, most masters | Wins 6 in 10 | 8 |
| **Far stronger** | The famous houses, the best masters, most orders | Wins 7 in 10 | 12 |
| **Beyond compare** | Two or three orders; a legend's own style | Wins 8 in 10 | 15, with trials |

Two rules keep it fair. **Skill outweighs style:** one level of the weapon's root is worth about as much as the step from the standard to a far stronger style, and two levels outweigh any style, so a veteran with the levy drill still beats a boy with a great house's secrets. **A weak style has its uses:** quick to learn, taught to anyone, often with one dirty trick.

Each style also has two **strengths** and one or two **weaknesses**, from fourteen situations (open ground, the close press, against reach, mounted, a long fight, the dark, a ship's deck…). Today these are prose; they become rules.

### 3.3 Arts

An art is an active skill with a base move (strike, guard, feint, press, grapple), a cost in breath, uses a fight and an effect: 07-duels' techniques, unchanged. Arts come from your **style**, by rank; your **weapon family** (about 100 common arts: half-swording, the shield bash); your **weapon's form** (110 arts only one form allows: the bill's hook, the estoc's thrust through mail); and a **legendary piece** (§4).

An art has the four levels, never above your rank in its style: rough at Novice (half again the breath), as written at Journeyman, one more use at Adept, a truer read at Master.

### 3.4 Learned, taught, stolen, lost, founded

- **Learned by serving.** The muster (D11) sets your arm; you are taught its standard and rise by drill and by battles.
- **Taught by blood and oath.** A house teaches its children from boyhood, as now. Sworn knights and wards get three ranks of outer teaching; the top arts are for blood. An order teaches only the sworn.
- **Bought** at a master's school, with a grading bout for each rank, as now.
- **Stolen.** After a duel, as now; and by sparring, by spying on a yard, from a captured manual or a defector. A stolen art stays at Novice until its style is learned. A house that sees its secret in a stranger's hands answers with a challenge, a marriage offer or a feud.
- **Kept by one master.** The mastership is a post (A2) with a named heir. If both die untaught the style is **lost**: old hands teach the ranks they hold; the top arts wait for a manual and a Master of the weapon.
- **Founded.** The player can found a style today (a weapon at Master, twelve real wins). Founders will choose its strengths from what they have really done; it starts no higher than "stronger". Now and then a great fighter elsewhere founds one.

### 3.5 In a duel, in a battle, in words

- **A duel** offers your six ready arts beside the five base moves; strengths and weaknesses apply when the situation holds. Having fought a style before, you read it better (as two fighters of one school already do).
- **A battle** gives you, at your rank, the choices of your regiment's standard for this ground, enemy and phase (D12b). The report says what drill was worth: "Their lances were Hide-Knights; yours had the levy drill."
- **On a person's card:** "Fights in the Two-Wave Lance, Aldmark's standard for its heavy horse (Knight of the First Wave). Also taught the Ironside Anvil." A style's page gives its grade, where it is strong and where it fails, who teaches it, and the arts you know.

### 3.6 For the builders

- The 265 styles in `LORE.styles` stay; grade, strengths, weaknesses, secrecy and keepers sit beside them in `data/styles/`, with the new styles as compact rows. `A.npcStyles` gains the regiment's standard, the order's style and a trade's folk way.
- **Footing:** fighting in a style adds rank × (0.6 + 0.4 × grade) points to the weapon skill (grade −1 to 3); its arts are held to a power budget by grade; `GD.STYLE_XP` is multiplied by 0.75, 1, 2, 3 or 3.75, which gives the table's years.
- **Calibration, held by tests:** the table's win rates over 1,000 duels a pairing; two root levels beat any grade gap; fighting worth stays on the skill's table (a levy about 1, a knight 5 to 7, an order member 12 to 32).
- **State:** `S.sty.keep = { styleId: [masterPid, heirPid, state] }`; the player's `ready` (six art ids) and `met` (styles fought before).

## 4 · Legendary arms

E2 plans about 100 pieces that exist once: by the owner's answer (D-032), of legendary rarity, fine or masterwork, almost unbreakable, held as heirlooms and treasures.

**Each has a signature art:** one art only that piece allows, written with its story, about the weight of the top art of a far stronger style, once a fight. A holder can use it at Adept in its form, after carrying the piece a year; its rightful line or order needs no year. An unpractised holder has the blade's numbers and not its art, so skill still decides most fights. Carried openly, a legendary changes the room: presence for its bearer, heart for those behind, and the notice of thieves, claimants and kings.

> An example, not yet lore: the sword of the Iron Wolf's grand masters. Black steel with a pale edge, a wolf's head in black iron for a pommel, grey pelt at the scabbard's throat. Its art, *the Ninth Night*: once a fight, when you are losing, you strike as if you were not, and the men behind you do not waver.

**Each has its own drawing.** The demo draws a legendary sword by rule: one sun-steel blade for all. Instead every legendary is designed as itself:
- **its own outline:** blade or head, guard, grip, pommel, and its own scabbard, quiver or strap;
- **its own metal,** from eight legendary finishes (watered steel, black iron, blued, pale silver-steel, sun-gilt, old bronze, bone and horn, red gold), the watering drawn from the piece's id so it never changes;
- **its own mark:** an inlay or a line of writing, and the scar its story gave it;
- **one accent colour and a second line of light,** which no ordinary piece has. Light, never a magic glow.

At 46 px its outline, accent and one glint say it is no common sword; on a card its fittings show; at full size and on its own **plate** (a card for the thing: name, past, art), everything. On the figure it hangs in its own scabbard, hilt showing.

**For the builders: what the art layer needs.**
- **A record for each piece** beside the figure library's gear rows (the gate 2 library, D-035): outline nodes by part, finishes, inlay paths, accent, wear. About 1 KB packed; 100 within 120 KB, in the lazy lore payload.
- **Four record-drawing functions** beside the rule-drawn `swordArt` (blades, hafted arms, bows, plate pieces), a watering pattern, inlay, and the second light pass.
- **Budgets:** 12 shapes at 46 px, 60 on a card, 220 at full size (about four times an ordinary piece); inside D-025's 18 ms for a figure, and 8 ms for a plate.
- **Method:** C8's. A design sheet for each piece from its lore, drawn as data, judged by a second agent against the owner's bar (Ser Edric Vale's card). The owner sees the first twelve (the eight orders' arms and four crowns' swords) before the rest are drawn in lots of twenty. Until then a legendary shows its form in its own finish and accent.
- **Tests:** a lint (every unique has a drawing, a mark and an art); agents pick the legendary out of nine swords of its form at 46 px, 9 times in 10, and tell any two apart at 96 px.

## 5 · Data, speed and saves (for the builders)

**Files.** Content is data; the engine expands it.

```
data/growth/stats.json      { "id": "tgh", "name": "Toughness", "group": "body", "fadeFrom": 0.85, "people": { "orc": 1.9, "giant": 14 }, "build": { "sturdy": 2 } }
data/growth/roots.json      { "id": "craft", "pair": ["dex", "int"], "legacy": ["craft"], "ways": ["craft.mark", "craft.armourer", "craft.guild-father"] }
data/growth/rules.json      { "id": "make", "of": "items.forms", "ops": ["pattern"], "kind": "active", "parent": "trade:{trade}", "hook": "forge", "grade": "rare" }
data/growth/skills/*.json   { "id": "smith.temper", "name": "Tempering", "parent": "trade:smith", "hook": "forge", "fx": { "make": [1, 2, 3, 4] },
                              "evolves": { "to": "smith.blue-temper", "proof": "three fine blades" } }
                            { "id": "merge.horse-archery", "from": ["mount:courser:ride", "shoot:horse-bow"], "proof": "a shot from the saddle in a real fight" }
                            { "id": "mark.ploughmans-back", "from": { "career": "farm", "years": 6, "before": 20 }, "fx": { "grow": { "str": 1.2, "dex": 0.85 } } }
data/growth/kits.json       { "id": "smith.journeyman", "has": ["smith.draw", "smith.weld"], "maybe": ["make:knife", "make:spearhead"], "level": "journeyman" }
data/styles/standards.json  { "id": "std.POL-07.archers", "branch": "archers", "book": "archers", "accent": "POL-07.2", "grade": 0,
                              "tactics": ["skirmish", "massvolley", "stakes"], "strong": ["from cover"], "weak": ["against horse"] }
data/styles/books.json      the 15 drill books, in the technique format 07-duels reads
data/items/legend-arts.json { "item": "u:kestrel", "art": { … }, "bearing": { "pre": 4 }, "knownBy": { "form": "adept", "years": 1 } }
```

**The same every time.** Expanding the rules draws no dice and reads no clock; ids are words (`make:sword.arming`, `good:wool`), so a new sword renumbers nothing. An NPC's view is a hash of seed, person and skill, as `A.npcStyles` is. The player's progress is arithmetic; chance enters only where the engine already rolls (a check, a theft after a duel, a forging). Drawing a page reads and writes nothing, and a test hashes the index and 1,000 views across two builds.

**The budget.** The A1 gate (`tools/bench/press-gate.mjs`) allows a quiet month 150 ms, and the engine already takes 80 to 170 (D-023). Growth must cost almost nothing; the gate will print its share.

| | Budget | Evidence |
|---|---|---|
| Building the index, at first use | 8 ms, once | the trial: 4,599 entries in 3 to 6 ms |
| The player's month | 0.5 ms | arithmetic over the skills used that month; rust once a year |
| `A.stat` with passives | no new work | reads the cached sheet (rebuilt on a change, 0.3 ms) |
| An NPC | nothing a month; 0.05 ms for a view when asked, then cached | not stored, not stepped; the trial: 0.01 ms for 27 skills |
| The year: keepers of 550 styles, a founding, a loss | 3 ms | one pass over a short table |
| The save, at year 60 | 25 KB gzipped, capped | the trial: a player's 180 skills 1.6 KB (allow twice for real ids), 600 keepers 3 KB; founded styles up to 12 KB, NPCs' gains up to 6 KB |
| The page | about 200 KB compressed, in the lazy payload | 620 KB raw: 2,260 rows of 120 bytes, 108 written styles at today's 2.7 KB, 180 compact ones |

**Old saves.** `A.SAVE_VER` goes up by one at each stage that adds state; a step "growth" joins `A.V2SAVE.upgrade` and draws no world dice. Every sample save in `tests/saves/` must load and pass the new checks.

| Old | New |
|---|---|
| The six stats and their potentials | Unchanged, moved by nothing. The eight new stats are worked out once from v2's genes (judgment, presence, cunning, memory and toughness are there already), the potentials, quirks and wounds |
| `p.skills`, 38 numbers | The roots' levels, unchanged. The player's ten folded keys open as branches at their root's level |
| Perks; `job.spec`, `mil.arm`, `mil.doctrine` | Knacks, by the same rule; held skills, with the old fields kept as mirrors |
| `langs`, `literate` | Tongue and script skills, levelled by years spoken |
| `p.styles`, `styleMain`, `p.techs` | Unchanged; a stolen technique is an art at Novice |
| `p.apt`, `p.used` | Talent by root; the rust clock |
| `LORE.styles`, `S.styles` | Unchanged; grades, tags and keepers added beside them |

## 6 · Building it

### 6.1 Stages: each a version, with its tests and checks

G opens v3 (D-037): built after v2's last item, on `v3-integration`, as versions `v3.0.0-alpha.N`. Posts (A2), named stages (X2), households (C6), branches (D11), command depth (D12b) and the Profile tab (P) exist by then; the economy and the armoury do not. Each stage ends as every step does: tests, the coherency run, a playtest pass ("how do I get better at this?", answered from the screen 8 times in 10), the records, a version with its release branch and a sample save. Engines: Opus 5.5. Rows and screens: Sonnet 5.5, in lots. Fable 5.2 reviews before G4 and directs the legendary designs.

| Stage | The player gets | New tests | New coherency checks |
|---|---|---|---|
| **G1** Stats with rules (M) | Seventeen stats explained on a click; the three idle ones at work; load by Toughness | each stat changes 5 or more outcomes in 10 bot lives; nobody above a people's limit; the old six move by 0 in old saves; the fighting-worth table and the balance bands hold | every stat inside its limits |
| **G2** One skill system (XL) | Proficiencies, perks and specialisms as skills on one page; three studies | the same odds on 200 sampled checks; no root from Apprentice to Legend in under 20 years; an NPC's view pure and equal across builds; the gate's share; save size | no skill above its parent; every held skill exists |
| **G3** Skills for every route (XL, four lots) | Rule skills from today's lists; templates, marks, Ways, merges; masters and watching; "within reach" | the lint; `tools/bench/route-depth.mjs`: in 10 bot careers a route, 20 route skills held by 40, each used 5 times or more; balance in bands | a teacher has what he teaches |
| **G4** Styles (XL) | Grades in words; a standard for every regiment; the eight order styles; folk ways; six ready arts; stolen, lost and founded styles | one standard for each realm and branch; 8 of 8 orders; the win-rate table; skill beats style; 200 years on 5 seeds keep 450 to 650 living styles | one master a style; a secret is held by the sworn or marked stolen |
| **G5** Battles read the standard (L) | Battle choices from your regiment's training; the report names the drill | 12 different sets of choices in 20 battles; choices still move a battle by 15% at every rank (`rankfx`) | every unit has a standard |
| **G6** Legendary arts and designs (L, and art lots) | A signature art, a drawing and a plate for each legendary | §4's tests; the art is its holder's alone | every legendary has one art and one drawing |

G1 to G5 close the milestone `release/v3.0-growth`. G6 is built inside E2 (with E2b and E2d), when the unique pieces exist.

### 6.2 Ties

- **E2 and E1, which follow.** A smith's Craft, the pattern, a form's operations and his Hands feed E2's forging roll: skill mostly sets the make, material and design the rarity; only the Master's Mark may sign masterwork. Kits say which forms a town's smiths know, so E2's stalls need no new state. About 60 rule skills (new forms and goods), the manuals and the legendary arts arrive with E1 and E2.
- **D11 and D12, which come before.** A branch is a regiment's kind: the muster teaches you its standard. The 141 tactics are a commander's active skills. `docs/design/war.md` (D12a) should leave room for §3.
- **A2, C6, C8.** A style's or a guild's mastership is a post. A noble child's tutor and master-at-arms are the people who teach. Builds, scars and marks are the same facts on the figure and the Profile tab.

### 6.3 Risks

- **Every fight and every purse moves.** G2 changes no odds: it re-houses. Later stages add only bounded effects and hold the balance league.
- **Dead numbers by the thousand:** Road to Ten's seventh rule, and why 49 and 69 folded ten proficiencies away. The answer is hooks by kind and the bench applied to each route.
- **Too much to read, or one best build.** You see only what you have, can reach or have heard of; marks carry costs, passives are capped, Ways shut each other out.
- **The writing:** about 2,260 rows, the size of the style lore that exists. In lots, by lint and critic.
- **Built before the economy.** G3 must not invent a second market or item model while it waits for E1 and E2.

### 6.4 What to cut first, if it is too much

In this order: styles founded or lost in play; levels on arts; reading a style you have fought before; manuals; higher forms of narrow skills (the Ways stay); companies and folk ways; Senses or Nerve; a skill for each weapon form; legendary drawings beyond the first twelve.

Not to be cut: one skill system with proficiencies inside it; a rule sheet for every stat; no skill without a reader; a standard for every regiment and a style for every order; a signature art for every legendary.

### 6.5 Decisions for the owner

1. **How many stats?** (a) Seventeen, as §1.1. (b) Twelve: drop Hands, Senses, Nerve, Looks and Honour. (c) Twenty-four or more. *Recommended: (a):* the size of today's sheet, every row with a job.
2. **What limits how much one person knows?** (a) Talent, time, age and rust (§2.7), with six arts ready in a fight. (b) A fixed number of slots. (c) No limit, and nothing forgotten. *Recommended: (a).*
3. **The words.** Levels: (a) the craft words the sheet uses (Novice, Journeyman, Adept, Master); (b) letter ranks, F to S; (c) numbers. Grades: the item words (common, rare, epic, legendary), meaning how a skill is got, or none. *Recommended: (a), with the grades.*
4. **How much of the skill world do you see?** (a) What you have, can reach or have heard of. (b) Whole trees, greyed out. *Recommended: (a).*
5. **How far may a style outdo the standard?** (a) As §3.2: up to 8 fights in 10 at equal skill, and skill still outweighs style. (b) Mostly colour. (c) Overwhelming. *Recommended: (a).*
6. **House secrets.** (a) Outer teaching for sworn knights and wards, top arts for blood, theft possible and answered. (b) Blood only. (c) Anyone who pays. *Recommended: (a).*
7. **Should the world's styles change in a lifetime?** (a) Slowly: one founded or lost now and then. (b) Fixed. *Recommended: (a),* and the first thing to cut.
8. **Legendary arms.** Drawings: (a) each designed by hand, twelve first for your eye; (b) made by rule. Arts: (a) any holder who has learned the weapon and carried the piece a year; (b) only its rightful line or order. *Recommended: (a) and (a).*

If you would rather see styles before skills, say so: G4 can follow G1 directly, with levels on arts added when G2 lands.

### 6.6 Records to add when this is approved

**DECISIONS** (this plan and the owner's answers; the conflict with Road to Ten's rule on dead numbers and the fix chosen; knacks at the level edges), **V3_SPEC**, **PROGRESS**, **CLAUDE.md**, **the `life-sim-systems` skill** and **docs/README.md**.
