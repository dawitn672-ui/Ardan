# Growth in depth: stats, hidden talent, skills learned by doing, the arts, legendary arms (G)

*Stamped 2026-11-13 11:55 ET · work item G, the first step of v3 (owner order 32, D-034, D-037) · by Fable 5.2 at maximum effort · a design for the owner to steer; nothing is built · supersedes nothing*

*Revised 2026-11-13 18:44 ET for owner order 34 (D-039) · by Opus 5.5 · supersedes the 11:55 draft's skill ladder and grades (§2.2), Ways and higher forms (§2.4), trees (§2.6), talent words and rust (§2.7), style grades and footing (§3.2, §3.6), "skill still decides most fights" (§4) and the eight open choices (§6.5). Each replaced part is marked where it stood and summed up in §7; the full first draft is at commit `f1a556d`.*

The owner's order 32, in short: more stats, each clearly defined; skills passive and active, "100s-1000s", for every route "in extreme depth"; proficiencies merged into "skills with different levels that can then evolve and merge"; each nation's "standard training for each of their regiments as well as tactics"; family styles, "some styles weaker than standard military and others far exceeding it"; a style for each elite order; legendaries with "their own unique design", "far more visually appealing than other weapons".

Order 34 (D-039) sharpens it: fighting styles become **arts**, in the spirit of the murim martial world, for every weapon; eight skill words from **Beginner** to **Myth**, with only a handful of Grandmasters and at most one Legend alive; **no skill trees**, skills born by trying and grown by doing; **hidden talent** by area and by attribute; a top art wins about **7 in 10 or 8 in 10** at equal skill, and the same body applied differently can turn that over; **house arts** for knights and for the blood; **slow, rare decay**; legendaries **far beyond** any other weapon and hard to master.

**The plan in short.**
- **Four things grow:** stats (what you are), talent (how fast you become it, found out in play), skills (what you can do), arts (how you fight).
- **Seventeen stats, each with a job** and a rule sheet on a click, in words against your own people (C9). A master has the body or mind his mastery needs.
- **Talent is hidden.** A grade for each area of life and each attribute, found by trying, by a teacher's eye and by feats; then shown as a letter with a number beneath.
- **One skill system, eight words:** Beginner, Intermediate, Advanced, Expert, Master, Grandmaster, Legend, Myth. A skill is born the first time you try it. It grows by use, teaching and study, fades only rarely, and at the top merges with another into something greater.
- **Few at the top:** one to ten Grandmasters alive in the whole world, at most one Legend; Myth is for the dead and the songs.
- **About 5,400 possible skills, none filler,** found by doing, never shown as a tree.
- **About 600 arts** (265 today): sword arts, spear arts, axe arts, bow arts, fist arts and every weapon's own, with numbered forms, lineages, secret manuals, and the schools, orders and houses that guard them. Graded Lesser to Peerless.
- **Nobody fights alike:** how your body meets your art's demands, and your art meets his, is worth as much as the art's grade.
- **Legendary arms** each have their own art and their own drawing; they are kept under guard, and in a hand that has mastered one they outclass anything else made.
- **Cheap:** other people's talents and skills are worked out when asked for, never saved.
- **Six stages, six choices still open** (§6.5).

Technical detail is under **For the builders**; a busy reader can keep to §1.4, §2.2, §2.6, §3.3, §3.5, §3.6 and §6.5. Counts and timings come from the code and `docs/design/trials/growth-skills.mjs`; counts this revision changed are marked as recounted and are re-run at G3.

## 0 · What the game has now

| | Today, measured | Where it stops |
|---|---|---|
| Stats | Six in the engine, read at 88 places and by about 5,700 event checks; the sheet shows eleven measures over them | Memory, Presence and Cunning are shown and nothing reads them. No stat says what moves it. Bodies read weak; real units are shown (C9 is fixing both in v2 now) |
| Proficiencies | 38; the player sees 28, because two earlier steps folded ten away as dead numbers | A smith and a mason share one number, Craft |
| Skill words | Three ladders: the sheet's (Untrained, Novice, Trained, Skilled, Expert, Master, Legendary; `GD.PROF_TIERS`), the style ranks (Novice, Student, Adept, Master, Grandmaster; `GD.STYLE_RANKS`), v2's body (Untrained to Legend; `SKILL_TIERS`) | Three ladders for one idea; none matches the owner's eight words |
| "A bit better" | 114 perks, 105 specialisms, 3 masteries, 5 arms of service, 4 doctrines, talents, 22 languages, 8 drills | Nine overlapping systems; Road to Ten asked for one |
| Talent | Six words, Hopeless to Prodigy, a multiplier from 0.5 to 1.8 per skill (`GD.APT_LEVELS`), shown from birth; v2's genes hold twelve family aptitudes, 0.5 to 2 | Shown at once, so there is nothing to find out; no talent for a stat; no general gift |
| Fighting styles | 265, written by hand: 93 national, 61 masters' lineages, 111 household; 1,284 techniques, 4 to 6 a style | Of 192 regiments (each realm's kinds of troops) 110 have one. None of the eight elite orders is tied to one. None is rated against another. No style asks anything of the body |
| The top | `GD.LEGEND_CAP` = 5 fighting Legends, lore says "perhaps five alive"; `GD.MASTER_CAP` = 5 order-leader Masters a realm; the census finds 2 Legends and about 6 Masters at the start | The owner wants at most one Legend and one to ten Grandmasters |
| Growth | More from doing than from practice; talent; rust after two idle years; NPCs' skill numbers rolled at birth and saved | Nothing limits how much one person knows; rust comes fast and often |

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
| **Memory** | How fast teaching sticks; how long skills stay sharp unused | Learning by heart, tongues, teaching | Age, drink, fever |
| **Judgment** | Fewer blunders; a truer reading of risk | Years, mistakes survived, office | Fury, drink, exhaustion |
| **Cunning** | Lies, plots, bargains, feints, against the other side's | Court, trade, crime | Long solitude |
| **Will** | Pain, grief, long tasks; the surge that turns a lost fight | Hardship borne, vows kept | Despair, broken vows |
| **Nerve** | Steadiness with danger in front of you: a first battle, a charge, a storm | Only danger faced and come through | A rout, a maiming; long peace |
| **Presence** | Orders obeyed, speeches heard, the heart of your men | Leading, speaking, victories, rank's dress | Shame, public failure |
| **Looks** | Courtship, marriage offers, first meetings | Born; health and dress, a little | Age, scars, pox |
| **Renown** | Opens doors; draws rivals and thieves | Deeds, by odds beaten and witnesses | Time, slowly |
| **Honour** | Whether your word is taken: oaths, loans, parley | Promises kept, debts paid | A broken word, at once |

**Faith** shows only for the faithful, **Authority** only for those who rule or command. Height, weight, build, health, mood and weariness stay as readings.

**In words,** on the Profile tab (P, P2). Every stat is a word read against the grown people of your own kind, the way C9 now writes them: an untrained grown man is about average; a labourer or soldier who lifts twice his weight reads strong; a child reads as a child, against children, with a note of what he will grow into; a giant is off the chart for strength and off the other end for speed. A rarity may follow the word ("shrewd; better than all but 1 in 40"). A click adds whether it is rising or fading, what holds it back ("a strained back, mending by Michaelmas"), what would raise it, and the room left (plenty, some, little, none).

> *Replaced (order 34, D-039 §12):* the first draft kept the body "in real units beside a thing you know" ("lifts 180 kg, about a big hog"). Real-unit readouts are gone entirely; the engine may keep units inside, the player never sees them.

### 1.2 The limits every stat obeys

1. **Your ceiling.** Birth sets how far ordinary training takes each stat: your people, sex, parents, luck and build. Gains shrink as you near it.
2. **Your people's limit.** No training passes it. A breakthrough (a win against long odds with something real at stake) lifts your own ceiling by about an eighth, never past the limit.
3. **Your age.** A child has only the share of a grown body its years allow, and drilling a small child gains little. Each stat fades from its own age; care slows it.
4. **Your month.** The plan's pace (rest, light, steady, hard, brutal) is the dial; extra sessions gain less and add load. Load above what you can carry makes you weary, then costs health, then strains something (B6). Today everyone carries six and sheds four a month; Toughness will set what you carry (four to nine), Endurance and comfort what you shed.
5. **Use.** A trained body slides back toward an untrained one over a few idle years. Minds only age.
6. **Wounds, illness, gear.** A wound cuts the stats of its part while it mends, and may leave a mark. Armour slows you; a reading stone gives old eyes their books; fine dress lends presence.
7. **Skills.** Passive skills raise and lower stats (§2.3), together by no more than one step of a stat's word scale.
8. **Talent** sets the pace of every gain (§1.4). **Mastery** pulls the stats it needs along with it (§1.5).

### 1.3 Peoples and builds

| People | Ceilings lean high | Lean low | Grown at; fading from about |
|---|---|---|---|
| Human | the widest spread of talent | | 20; 43 |
| Elf | Speed, Reflexes, Senses, Memory, Presence | Strength, Toughness | 40; 300 |
| Dwarf | Toughness, Endurance, Hands, Will, Memory | Speed, Presence | 25; 150 |
| Orc | Strength, Toughness, Nerve, Will | Endurance, Memory, Judgment | 16; 38 |
| Giant | Strength and Toughness, far beyond the rest | Reflexes, Speed, Hands, Cunning | 30; 77 |

Half-elves and half-orcs sit between their parents. The eight builds tilt the ceilings a little (slight: quicker, weaker; sturdy: tougher, slower). They are the builds C8 draws: the body you see is the body you have. "Fading from" is when a stat begins to slip, not when a life ends: a well-fed, healthy person who avoids danger lives easily to 50-70 (D-039 §8, C9).

### 1.4 Talent: hidden, found, then known *(new, order 34)*

**What it is.** Talent is how fast you grow at something, and how far ordinary effort carries you. It is set at birth and never changes. It does not make you good; it makes you quick to become good.

**Two kinds.**
- **Areas of life,** sixteen: the **Body** (every physical stat and every physical skill), the **Mind** (every mental stat and every learned skill), and fourteen callings: Arms, the Bow, the Horse, Command, Craft, Trade, Speech, Letters, Faith, Healing, Stealth, the Sea, Music, the Land.
- **Single attributes,** fourteen: one for each stat that grows (Strength, Speed, Endurance, Reflexes, Toughness, Hands, Senses, Wits, Memory, Judgment, Cunning, Will, Nerve, Presence). Someone can be gifted only in speed, or only in the eyes.

A body gifted all over (a high Body talent) grows every physical stat and every physical skill fast. A girl with plain Body talent but a gift for Senses grows into a fine archer slowly in the arm and quickly in the eye. Gifts cluster a little (some people are quick at everything) and run in families, but most people have one or two things they are better at than the rest of them, and one or two they will never be good at.

**The grades.** A letter, and a number beneath it from 1 to 99. The number gives the many steps; the letter gives the reading.

| Letter | Number | In plain words | How fast it grows (against an ordinary C) | How far ordinary effort carries it | Among people |
|---|---|---|---|---|---|
| **F** | 1-14 | No aptitude at all | about a third | Intermediate | very few |
| **E** | 15-29 | Poor | about half | Advanced | some |
| **D** | 30-44 | Below the run | about three quarters | Expert | many |
| **C** | 45-59 | Ordinary | as written | Master, rarely | most |
| **B** | 60-72 | Gifted | half again | Master | some |
| **A** | 73-84 | Rare gift | twice | Grandmaster, if the world has room | few |
| **S** | 85-96 | Born to it | two and a quarter to three times | Legend, if the world has room | a handful in a realm |
| **SS** | 97-99 | One of a kind | three times and more | Legend | perhaps one living in each area |

"How far ordinary effort carries it" is not a wall: past it, every gain comes at a quarter of the pace, so a D who gives his whole life to the sword can still die a Master, and the world will talk about it.

**How growth follows talent.**
- A **stat** grows at its attribute's talent, lifted or held back by the Body (or Mind) talent.
- A **skill** grows at its area's talent, nudged by the talents of its two governing stats and by the Body or Mind.
- A **first try** (§2.6) succeeds more often with talent: an F learns nothing from most first tries; an S almost never fails one.
- **Breakthroughs** (§1.2) come a little more readily to the gifted.

**Hidden at birth, found in play.** The Profile tab shows a question mark for every talent at first. You find them out:
- **A first try** gives a hint either way: "It comes oddly easily" or "Your hands will not learn this". The hint is a range ("C or better"), and it can mislead once in a while.
- **A teacher's judgement.** Someone who is Expert or better in the area can judge you: an Expert names a letter and can be one off; a Master names the letter truly; a Grandmaster names the number as well. Teachers say it in their own voice ("You will never be a swordsman. You might be a good soldier").
- **Feats.** A result far beyond your level, or a pace of growth that outruns everyone around you, narrows the range by itself.
- **Time.** Three years of steady work in one area shows the letter; ten show the number.

Once known, a talent shows as its letter with the number small beneath. You can judge other people's talent the same way, once you are a Master yourself: a master looking for a pupil worth taking is a story the game can tell.

### 1.5 A body and mind that match the mastery *(new, order 34; C9 does the first half in v2 now)*

The owner: "a master swordsman trained his body; a master trader or diplomat has wits." Two rules make it so.

- **Training a skill trains its governing stats.** Every skill names two governing stats (Swordsmanship: Speed and Reflexes, with Strength behind; Trade: Wits and Cunning; Smithing: Strength and Hands). Part of every gain in the skill lands on them, inside their ceilings. A boy who spends ten years in the yard comes out strong and quick whether he meant to or not.
- **A word asks for its body.** To stand at Expert both governing stats must be at least ordinary for your people; Master asks one of them good and the other ordinary; Grandmaster asks both good and one very good. If age or a wound brings a stat below what the word asks, you keep the word and the knowledge, and you fight or work at the word your body allows ("he knows more than his arm can show now"). An old master can still teach everything he knows.

**Other people are made the same way.** Every NPC's stats are drawn after his life: a captain of the guard has a soldier's body, a guild master a sharp head, a giant who wrestles for a living is off the chart for strength. C9 builds this for today's six stats now; G extends it to the seventeen and to talent (a Master's talent in his area is rarely below C).

### 1.6 For the builders

- **Keys.** `str spd ins sta int wil` stay. New: `tgh dex per mem jud cun nrv pre`, through the same `A.stat(p, s)`.
- **Real work without rewriting 5,700 checks.** Each broad skill has two governing stats (`GD.SKILL_STAT`), redrawn with the new ones (Craft: Hands and Wits). The pair sets a skill's untrained floor in `A.checkVal` (today the mean of all six), its learning speed (today Wits alone) and the word gate of §1.5 (old saves keep what they have). Cunning adds to the difficulty of a check against a named person; Memory sets disuse (§2.7); Nerve is read in a battle's first phase and a duel's first exchange. Checks that name one of the six do not move.
- **Stored as v2's body is:** the player's values saved, an NPC's a pure view (`A.V2S.view`). Passives, wounds, build and gear go into one cached sheet per person, which `A.stat` reads. Event effects (`fx: { str: 1 }`) land as now, inside the same limits. Words come from C9's population tables (`A.statWord`), never real units.
- **Talent is a pure function,** never saved for NPCs: `A.talent(p, key)` returns 1-99. It is `50 + 15 × z`, where `z` blends a general gift (`hash(seed, pid, "gift")`, weight 0.35), the key's own draw (`hash(seed, pid, key)`, 0.65), the mid-parent's talent when both parents are known (half weight, regressing to the mean, as v2's genes do), and the people's lean (`GD.APT_BIAS`, about +6). Growth multiplier `m(n) = 2^((n − 50) / 30)` (F about 0.35, E 0.5, D 0.75, C 1.0, B 1.4, A 2.0, S 2.2-2.9, SS 3.0-3.1). A skill's rate is `m(area) × m(bodyOrMind)^0.5 × (m(gov1) × m(gov2))^0.25`, clamped to ×0.25..×4; a stat's is `m(attr) × m(bodyOrMind)^0.5`, same clamp. Past the grade's reach the rate is quartered.
- **Discovery** is the player's only talent state: `pc.tal = { key: [lo, hi, how] }`, a known range of numbers (1-99 at birth), narrowed by the sources of §1.4. Display takes the letters of the range ("?" for the full range, "C-A", "B", then "B / 62"). A teacher's misjudgement is a deliberate offset drawn from the teacher's hash (26-belief-versus-truth). About 60 bytes in a save.
- **Coherence.** Each month's skill gain adds a share (`GD.SKILL_STAT_SHARE`, about 0.15 of a stat step per word gained) to the governing stats, inside ceilings. The word gate is a clamp in `A.skillWord`, not in the stored number. NPC generation draws stats with floors from the kit's words (C9's rule, widened).

## 2 · Skills

### 2.1 One system

Everything a person can learn is a **skill**: a name, one line saying what it does, a kind (active or passive), a word (§2.2) and a number beneath it, and the skills it is **kin** to.

- The 28 proficiencies on the sheet become the 28 **broad skills**. Every event check still reads one, so no card changes.
- The ten folded away (dagger, crossbow, lance, siegecraft…) return as skills of their own.
- The 114 perks become **knacks**: passives a broad skill gives at three points on its way up.
- Specialisms, masteries, arms of service, doctrines, languages, literacy and drills become skills of the trade or post that teaches them.
- The 265 fighting styles become **arts**, and their 1,284 techniques become the arts' **forms** (§3). An art is a skill too, with a word of its own.

> *Replaced (order 34):* the first draft hung every skill on a root in a tree and called the techniques "arts". There are no trees now (§2.6), "art" means the whole fighting art, and a technique is a **form**.

### 2.2 The eight words, and the few at the top *(replaces the first draft's §2.2)*

Every skill, every art and every craft speaks the same eight words.

| Word | What it means | Number beneath (0-100, what checks read) | How many |
|---|---|---|---|
| *(not on your page)* | Never tried, or tried and nothing learned | 0 | |
| **Beginner** | You have done it, badly, and know how it should go | 1-14 | anyone |
| **Intermediate** | You can do it on an ordinary day | 15-34 | most who use it |
| **Advanced** | Paid work, a trained soldier, a journeyman | 35-54 | many |
| **Expert** | The best in a town; a veteran; a sergeant-at-arms; a guild's master | 55-71 | few |
| **Master** | Known in the realm; others come to learn | 72-87 | one or two a realm in arms; a few dozen in a trade across the world |
| **Grandmaster** | Known across the continent | 88-95 | **one to ten alive in the whole world** |
| **Legend** | There is one, or none | 96-100 | **at most one alive** |
| **Myth** | The dead, and the songs | | never the living |

The words are shown with a short bar of ticks for how far into the word you are; never a percentage. The bands sit where today's sheet's sit (its Novice at 15, Trained at 35, Skilled at 55, Expert at 70, Master at 85, Legendary at 96), so G2 moves no check's odds.

**Myth.** Nobody living is a Myth. When a Legend dies, the record and the songs make him one; a Grandmaster's name may grow into Myth over generations if the songs keep it. An art whose last holder was a Legend becomes a Myth art: its top forms are lost to song until a manual or a ruin gives them back (§3.7). The end of a life may read: "passed into Myth".

**How the few are kept few.** By what it takes, not by a lottery:
1. **Only a merged skill passes Master** (§2.4). A single narrow skill tops out at 87, however long you work.
2. **A proof.** Grandmaster asks a deed before witnesses that only a grandmaster could do in that field: a duel won against a Master in his own art, a masterwork judged by the guild, a law argued before a king's court and carried. Legend asks a deed beyond the odds that the whole continent hears of.
3. **Room in the world.** The world counts its living Grandmasters, one count across every skill (a person counts once). While there are ten, nobody new rises: a proved Master waits, and the page says so ("The world has ten. One must die or be surpassed."). While there is a Legend, there is no other.
4. **Surpassing.** A waiting Master may beat a living Grandmaster in his own field, fairly and before witnesses. The loser steps back to Master and the winner takes the name. That is the only way down, apart from death.
5. **The world starts with three to six Grandmasters and none or one Legend,** set from the seed, and the yearly pass keeps the count honest.

> *Replaced (order 34):* the first draft's ladder (Untrained, Novice, Apprentice, Journeyman, Adept, Expert, Master on the broad skills; four levels on the others; Grandmaster and Legend only through a Way) and its skill **grades** in the item words (common, rare, epic, legendary: how a skill is got). Grades now belong to arts only (§3.5). `GD.LEGEND_CAP` falls from 5 to 1; the lore's "perhaps five alive in all of Ardan" is rewritten to one (the owner's word wins; recorded in DECISIONS when this is approved).

### 2.3 Active and passive

**Active skills are used:** as a **form** in a duel (from an art) or an **order** in a battle (a tactic); as a **work** begun where the place allows (forge a blade, treat a patient, hold a rite, speak before the moot); or as a **choice on a card** about that thing: "Set the bone yourself" is offered only to one who knows bonesetting.

**Passive skills are always on:**
- **Knowing a thing:** better odds wherever it is handled, and sometimes the right to try at all (speak the tongue, make the pattern, wear plate without tiring).
- **Knacks:** small standing gains as a broad skill rises.
- **Marks of a life:** what years of one life do to body and mind. They change how you grow, and each has a cost.

> **Ploughman's back.** Six years at the plough before twenty. Strength and Endurance grow faster from work; Hands grow slower; a little speed is gone for good.

Marks come from what you did for years, never from a list. A few are plain flaws (a flinch after a maiming) and can be worked off. A life gathers about a dozen.

### 2.4 Merging at the top *(replaces the first draft's "evolving and merging": Ways and higher forms)*

At the top, skills stop growing apart and grow together. Two skills merge when:
- **both stand at Expert or higher,** and
- **one deed used both under real stakes** (a shot from the saddle in a real fight; a blade forged and tempered for a named lord; a treaty won by knowing both tongues and the law).

The merged skill starts at the lower of the two, takes their places on your page, keeps everything they did, adds its own effect, and grows and fades as one. It can merge again. Only a merged skill can pass Master, so every Grandmaster is someone whose skills have become one thing.

Three kinds:
- **The art made one's own:** a weapon skill and an art, both at Master, after you have won with it against an Expert or better. *Swordsmanship* and *the Hours of the Sword* become *the Sword of the Hours*, yours alone, the only road to a Grandmaster of the sword. One for every art, by rule.
- **Kindred skills,** written by hand: *Riding the courser* + *the horse bow* = *Horse archery*; *Tempering* + *judging steel* = *the Smith's Eye*; *Bonesetting* + *horse-doctoring* = *Farrier-surgeon*; *cipher* + *forgery* = *the False Seal*.
- **A life's work,** written by hand for each calling's summit: *Smithing* + *the Smith's Eye* + *Armouring* = *the Whole Forge*; *Command* + *Tactics* + *Logistics* = *the Marshal's Art*. These absorb what the first draft called Ways and higher forms.

The page grows shorter as a life deepens: a master's sheet holds a few great lines where a journeyman's held many small ones.

### 2.5 Thousands, without filler *(counts recounted for order 34)*

**A skill is knowing a real thing of the world, and it is read at the one place that thing is handled.** The billhook's skill is read when you fight with a billhook; wool's, when you trade wool; the boar's, when you hunt one. The code will have about thirty such places, one for each kind of thing, so a new skill needs no new code and cannot be a dead number.

| Source | Count | What |
|---|---|---|
| Exists today, re-housed | 1,818 | 28 broad skills, 10 returned, 114 knacks, 117 specialisms and the like, 265 arts, 1,284 forms |
| **Rules:** one skill for each real thing, from lists the game has or E1 and E2 will add | 784 | 72 weapon forms to handle; 110 patterns to make; 40 goods to judge; 35 realms' markets; 28 tongues and scripts; 64 beasts; 141 tactics; 19 faiths' four rites; 37 posts; and twelve smaller lists (armours, mounts, roads and waters, crops, stock, illnesses, drills, ground, arms to lead, ships, songs, law) |
| **Rules: the art made one's own** | about 700 | one merge for each art (§2.4), written by rule from the art |
| **Templates:** a fixed shape, a short row written by hand | 541 | 196 craft operations (28 trades); 45 herbs, operations and nursing; 40 locks, disguises, forgeries, poisons, ciphers; 24 speeches; field, estate, siege and sea works; woodcraft; feats of the body |
| **Signature:** written whole | about 2,300 | about 350 merges (what were 84 Ways, 120 higher forms and 150 merges), 200 marks, 28 gifts of a people, 100 family and masters' secrets, 210 common forms of the weapon families, about 340 new arts and their 1,100 forms, 100 legendary arts (§4) |
| **All** | **about 6,100** | of which about 5,400 can be learned in one world (some arts and merges belong to one house or one piece) |

A lint holds every skill to a unique name, a place where it is read, a bounded effect and a way to learn it. Nobody ever sees the whole list.

### 2.6 Born by trying, found by doing *(replaces the first draft's "a tree for every route")*

There are no trees, and no menu of skills to unlock. **A skill is born the first time you try it.**

**The first try.** Anything you can do where you are, you can try: pick up an axe in a fight, take the reins of a cart, sit at the loom while your aunt is out, haggle for a horse, sing at a wake. The first try goes one of two ways:
- **too badly to learn from:** nothing goes on your page (and you get a hint about your talent, §1.4); you may try again another day, with the same odds;
- **or a Beginner's grip:** the skill appears on your page at Beginner.

What tips the odds: your talent in its area and its stats; a kindred skill you already hold (a swordsman trying an axe, a tanner trying the saddler's bench); someone showing you as you try; your age (children pick up bodies and tongues fast; the old, slowly). A try is a real moment in the right place: in the month's summary when your plan made it ("You spent a week with the charcoal-burners. You can stack a clamp now, after a fashion."), on a card when it matters.

**Growing.** After that a skill rises by **use** (the main road, as today), by a **teacher** (fastest), and by **study** (a book or manual, §3.7). Using a narrow skill also trains its broad kin a little, and the broad skill gives a narrow one a head start, but no skill holds another back. The one exception is fighting: an art never stands above the weapon skill it is fought with.

**What you see** on the Profile tab (P2):
- **Your skills,** grouped by kin, broad first, merged ones at the top.
- **Things to try here:** what this place offers you today (the smithy next door, the ferry, a priest who will let you read). It changes as you move; it is not a list of the world.
- **Heard of:** skills and arts you know exist, by name only: an art you fought, a craft you saw done, a merge your teacher spoke of.

**Every route has depth, found by doing.** The first draft's tree counts become the number of skills a life on that route will find if it goes looking; the threads show how they grow and merge. "Own skills" counts rule and template skills only, before arts, merges and marks.

| Route | Own skills | One thread of depth |
|---|---|---|
| Soldier | 103 | the billhook, first tried in a levy → *the Marcher's Bill* → bill + the art = *the Bill Made One's Own* |
| Archer | 38 | the war bow → *the Lark's Ascent* → + far sight = *the Far Hand* |
| Knight | 109, and a house's or order's art | the destrier → *the Two-Wave Lance* → + *Saddle Without Hands* = *the Couched Charge* |
| Commander | 231 | *Shield wall* as an order → + Command + Tactics = *the Unbroken Wall* |
| Smith and every craft | 354 | first heat at the forge → *Tempering* → + judging steel = *the Smith's Eye* |
| Merchant | 156 | *Knows wool* + the Aldmark markets = *Wool factor* |
| Farmer | 62 | wheat → marling → *Good heart* |
| Herder, horsemaster | 130 | horses: keep, breed, doctor = *the Quiet Hand* |
| Priest | 118 | the burial rite → + Will = *the Good Death* |
| Scholar | 64 | law + rhetoric = *Advocate* |
| Physician | 57 | *Bonesetting* + horse-doctoring = *Farrier-surgeon* |
| Thief | 46 | the warded lock → *the Quiet Key* |
| Spy | 76 | cipher + forgery = *the False Seal* |
| Courtier, diplomat | 149 | each court's ways and tongues |
| Ruler, steward | 76 | the manor court → the mint = *the King's Peace* |
| Sailor | 57 | the cog: hand, then pilot |
| Hunter | 114 | the boar → *Boar-stander* |
| Minstrel | 64 | a known lay → a lay of your own |
| Outlaw | 107 | the forest roads → the ambush → ransom |

> *Replaced (order 34 §"no skill trees"):* the first draft's "one tree in full" (Craft → Smithing → operations, patterns, judging, knacks, marks, higher forms, merges, Ways), the parent rule (no skill above its parent) and "within reach" lists. The same skills exist; they are found by trying and doing, and show up on your page only when you have them or have heard of them.

### 2.7 Learning, keeping, letting go

**How you learn.**
- **Doing:** still the main road.
- **A teacher:** a named person who has the skill and is willing (a bond, a fee, your post, your blood). The fastest road; a teacher takes you to one word under their own, and a good one tells you your talent (§1.4).
- **A school, guild, regiment, order or house** teaches its own to its own people; **blood** passes a house's line art and a family's trade secret (§3.4).
- **A manual or a book:** an item (E2) that teaches one skill or one art's forms up to a word, slower than a teacher, to a reader (§3.7).
- **Watching:** a form seen in a duel can be stolen today; so can a craft watched at the bench, by Senses and Wits. Stolen skills start rough.

**What limits you.** Four things, and no slots.
- **Talent** sets the pace and how far ordinary effort carries you (§1.4).
- **Time.** The plan holds three studies in place of one, sharing the same hours. All else grows only by doing; pushing harder is load.
- **Age.** The young learn fast, the old slowly. A skill that asks a strong body can fade out of reach; an old master can still teach it.
- **Disuse,** below.

A slot limit would be a menu to tend, and would break the owner's rule of no cap, only consequences (D-019). The one exception is a fight, where nobody holds twenty drilled answers ready: you go in with **six forms** ready, chosen beforehand (§3.8; still open, §6.5).

**Disuse** *(replaces the first draft's rust, order 34 §7).* An unused skill fades, but rarely, slowly to begin, and comes back easily.
- **Rare:** nothing happens for years. A skill below Expert is safe for five idle years, Expert for eight, Master for twelve; a Grandmaster's or Legend's never fades by disuse (only the body ages). A good Memory stretches every span by up to half.
- **Slow to begin:** past the span it slips a little the first year, a little more the next, never more than one word in all, never below Beginner.
- **Quick to return:** while below its best, a skill comes back at five times its usual pace. A season with a sword in hand brings back what ten idle years took.
- The page says it plainly: "Rusty: Swordsmanship, not drawn in nine years".

**Other people.** An NPC's skills are not rolled and not saved. Every trade rank, post, regiment, house and order has a **kit**: what a person of that life would know, with its words. A hash of the world's seed, the person and the skill picks which optional ones this person has and how well, held to their talent and to the census of the top (§2.2). It is worked out when something asks (a duel, a person's card, "who here can teach me?"), in about ten microseconds, the same every time. Only what an NPC gains in play is stored.

### 2.8 For the builders

- **Engine:** a plain module, `src/people/engine/skills.js`, unit-tested in node. `A.skill`, `A.trainSkill`, `C.prof` and `GD.SKILLS` keep their meaning; the 38 old keys stay as numbers in `p.skills`. The four wrappers on `A.skill` and `A.trainSkill` (31, 49) become one definition. `A.skillWord(p, id)` returns the word after the body gate (§1.5); `GD.SKILL_WORDS = [[1,'Beginner'],[15,'Intermediate'],[35,'Advanced'],[55,'Expert'],[72,'Master'],[88,'Grandmaster'],[96,'Legend']]` replaces `GD.PROF_TIERS`, `GD.STYLE_RANKS` (as mechanics; a school's own rank titles stay as titles, §3.1) and v2's `SKILL_TIERS`. The fighting-worth ladder (`g-bands`, 32-legend-and-master-caps) renames its tiers so "Master" and "Legend" mean one thing only.
- **First try:** `A.tryFirst(p, id, ctx)` → `'nothing' | 'beginner'`, odds by the area's talent letter (F 0.15, E 0.3, D 0.45, C 0.55, B 0.7, A 0.8, S 0.9, SS 0.95), then a kindred skill held (+0.2), a teacher present (+0.25), the governing stats (±0.1), age (±0.1), held within 0.05 and 0.98. The player rolls with `A.rand` at the moment of the try, as the engine already rolls at a check; an NPC's tries are inside its kit hash. A born skill starts at 1 to 5 by talent.
- **Merges:** `p.merged = { id: [from...] }`; `A.skill(p, a)` returns the higher of `a` and any merged skill holding `a`, so every hook and check that read a parent reads the merge. Merges are proposed when both parents are ≥ 55 and a hook reports a deed using both (`ctx.used = [a, b]`).
- **The census:** `S.top = { gm: [pid…], legend: pid|null, waiting: [pid…] }`, rebuilt in the yearly pass (one scan of the people with a stored number ≥ 88 plus the NPC views that ask for it, in a fixed hash order). `A.trainSkill` clamps a non-merged skill at 87, a merged one at 87 without a proof and room, at 95 without the Legend's seat. NPC views clamp the same way, and world generation seeds 3-6 seats by hash. Surpassing is an effect key `surpass`.
- **Disuse:** `p.used[id]` (exists) and `p.best[id]` (new, the high mark). Once a year: past the span (5/8/12 years × `1 + 0.5 × memWord`), lose 1, 2, then 3 points a year, floored one word under `best` and at 1; gains while under `best` × 5.
- **Effects, bounded.** A narrow skill adds 4, 8, 12 or 16 points to a check at its own hook. Knacks keep the perks' numbers and, in G2, their thresholds (40, 65, 85), so no odds move; the v3 balance pass moves them to the word edges (55, 72, 88). Passives on one stat sum to within ±12; growth changes to within ×0.5 and ×1.5, talent apart.
- **Hooks by kind:** `A.fighterFrom` (weapon form, armour, mount, arts); forging; trades; journeys; hunts; the harvest; illness and wound care; `A.tacticsFor`; `A.drillDay`; sieges; rites; gatherings; crimes; a post's year; trials; and `A.checkVal` for cards tagged `about: ["good:wool"]`.
- **For events:** `C.has(p, id, word)`, `C.talent(p, key, letter)` (true talent, for setup only; text must not reveal it unless the card is a judgement); effect keys `learn`, `mark`, `unlearn`, `judge` (reveal a talent), `surpass`, declared in `A.FX_EXTRA`.

## 3 · The arts *(order 34: "fighting styles" become arts, in the murim spirit)*

### 3.1 What an art is

An **art** is a way of fighting with one kind of weapon, taught as a set of **numbered forms**, kept by a **line of masters**, written (sometimes) in a **manual**, and guarded by a **school, regiment, house or order**. The structure is the murim martial world's; the dress and the words are Ardan's own medieval English. Nothing in it is magic: no inner force, no glowing blade. An art is drill, timing, a body shaped by years and a mind that has seen every answer before.

- **Forms.** Each art has from three forms (a levy drill) to twelve (a peerless art). They are learned in order and called by number and name: "the Fifth Form, Iron Under Silk". The last forms of a great art are rarely seen outside its hall.
- **Lines.** Every art has a holder, the head of its line (a post, one holder at a time, A2), with a named heir. "Sir Ranulf Swanley, ninth holder of the Two-Wave Lance."
- **Manuals.** Some arts are written down, some never. A manual may be whole, may stop short of the last forms, or may hold a copyist's error. Houses keep theirs locked; orders burn theirs rather than see them taken.
- **Keepers.** Who may be taught: a realm's men (the standard), a house's sworn knights (a knights' art), a house's own blood (a line art), an order's brothers (an outer art) or its masters (an inner art), a school's paying pupils, or a master's chosen few.
- **Titles.** A school's or house's own rank names stay as titles of standing within it ("Iron Knight", "Captain of the Second Wave"); the art's mechanics use the eight words.

### 3.2 Every weapon its own arts

| Family | Read from | What its arts are about |
|---|---|---|
| **Sword arts** | Swordsmanship | the cut, the thrust, the bind, the half-sword in armour |
| **Spear arts** | Spear | reach, the hedge, the thrust from behind a shield |
| **Polearm arts** | Spear & polearm (split) | the bill, the halberd, the poleaxe: hook, pull, beat, reap |
| **Axe arts** | Axe | the hooked beard, the shield-breaker, the two-handed felling stroke |
| **Mace and hammer arts** | Axe & mace (split) | the blow through plate, the beak, the stunning toll |
| **Dagger arts** | Knife fighting | the rondel's point into the gaps, the grapple and the knife together |
| **Fist arts** | Wrestling & fists | holds, throws, strikes; the fight after the weapon is gone |
| **Shield arts** | Shield work | the wall, the rim, the boss, the cover for another man |
| **Dual-blade arts** | Dual wield | sword and knife, two short swords, the buckler as a second blade |
| **Lance arts** | Lance | the couch, the ride, the timing of the charge |
| **Horse arts** | Mounted combat, riding | fighting from the saddle with anything: knees, turns, the low lean |
| **Bow arts** | Bowmanship | the draw, the clout and the mark, the plunging shower, the fast loose |
| **Crossbow arts** | Crossbow | spanning under cover, the patient shot, the pavise drill |
| **Throwing arts** | Throwing | javelins, axes, stones: the cast and the follow |

Some arts serve two families (a sword-and-buckler art is a sword art and a shield art; a horse art carries a lance or a bow). Stealth, siegecraft and command keep the few "styles" they have today as **ways** of their own (the night way, the siege way); they are not weapon arts and use the same rules.

### 3.3 Some arts, to show the voice

Examples, not yet lore. Grades are §3.5's.

| Art | Family · keepers | Grade | Forms |
|---|---|---|---|
| **The Hedge Drill** | Spear · every realm's levy standard | Lesser | Three: *Plant*, *Lean*, *Push*. Taught in a fortnight; enough to stand. |
| **Seven Strokes of the Felling Axe** | Axe · a folk art of woodsmen and the forest roads | Lesser | Seven, named as a woodsman fells: the First Stroke, *the Notch*, to the Seventh, *Timber*. Brutal, slow to recover. |
| **Millstone Hands** | Fist · millers' and porters' folk art | Lesser | Three: *the Upper Stone*, *the Nether Stone*, *the Grind*. A hold that ends a tavern brawl. |
| **The Two-Wave Lance** | Lance · Aldmark's standard for its heavy horse (exists) | Standard | Six: *Knee to Knee*, *Knight Afoot*, *Walk, Trot, Canter*, *the First Wave*, *Through the Gap*, *Two Waves*. |
| **The Marcher's Bill** | Polearm · standard of the march billmen | Standard | Five: *Hook the Rein*, *Pull Down*, *the Ditch Thrust*, *Beat the Point*, *the Long Reap*. |
| **The Moving Wall** | Shield · a realm's standard for shield infantry | Standard | Four: *Lock Rims*, *Turn the Point*, *the Rim Blow*, *the Wall Walks*. |
| **Hail of the Fells** | Throwing · the hill-folk's skirmishers' standard | Standard | Four casts: *the High Cast*, *the Flat Cast*, *Two in the Air*, *the Cast at the Horse*. |
| **The Ironside Anvil** | Sword · House Ironside's **knights' art**, taught to its Iron Knights (exists) | Strong | Five, from *Ring-Bearer's Guard* to *the Emperor's Anvil*; heavy, armoured, patient. |
| **The Patient Bolt** | Crossbow · the Crossbow Yard of Dorata | Strong | Five: *Span Behind the Pavise*, *Count Three*, *the Window Shot*, *the Low Bolt*, *the Last Bolt*. |
| **The Lark's Ascent** | Bow · an elvish school of the far shot | Strong | Six, from *Nock in the Wind* to *the Second Arrow Before the First Lands*. |
| **The Two Brothers** | Dual blades · a masters' lineage of sword and long knife | Strong | Six; the Sixth, *the Younger Brother Speaks*, is the knife arriving after the sword is parried. |
| **Saddle Without Hands** | Horse · a steppe riders' school | Strong | Five: *Knees Only*, *the Low Lean*, *Turn on the Hock*, *the Empty Saddle*, *the Rider Beneath*. |
| **The Wolf's Winter** | Lance and sword · the Knights of the Iron Wolf's **outer art**, for every sworn brother | Strong | Seven, from *Snowed In* to *Out on Foot*, after the order's founding night on the Glenwash. |
| **The Closed Ring** | Sword · House Ironside's **line art**, for the blood only | Great | Nine. *The Ring Laid Down* opens it; the Fifth, *Iron Under Silk*, hides a heavy blow in a light one; the Ninth, *the Ring Closes*, has not been shown outside the hall in living memory. |
| **The Bell-Founder's Hammer** | Mace and hammer · an order's **inner art** | Great | Nine tolls, the First Toll to the Ninth; the Ninth, they say, was struck once, at a king's death. |
| **The Mercy-Knife's Five Doors** | Dagger · a masters' lineage of men-at-arms | Great | Five doors into armour: *the Visor's Slit*, *the Arm's Pit*, *the Palm*, *the Knee's Back*, *the Door No One Guards*. |
| **Eleven Wolves** | Lance and sword · the Iron Wolf's **inner art**, for its grand master and his chosen | Peerless | Eleven, the First Wolf to the Eleventh, one for each wolf of the founding night. The Eleventh needs a Grandmaster. |
| **The Hours of the Sword** | Sword · a masters' lineage begun by a hermit-knight; one holder, two pupils at most | Peerless | Eight, by the hours of the office: *Matins* (the cut before the light), *Lauds*, *Prime*, *Terce*, *Sext*, *None*, *Vespers*, and *Compline*, which ends it and needs a Grandmaster. |
| **The Ninth Night** | Sword · the art of the Iron Wolf's grand masters' sword, bound to the piece (§4) | Bound to a legendary | Three: *the Snow*, *the Pack*, and *the Ninth Night*: once a fight, when you are losing, you strike as if you were not, and the men behind you do not waver. |
| **The Unwritten Twelfth** | Sword · a Myth art; its last holder was a Legend, two hundred years dead | Peerless, lost | Eleven forms survive in a half-burned manual. The Twelfth was never written; the songs say what it did. |

### 3.4 Who keeps the arts

| Kind | Today | Planned | How it is made |
|---|---|---|---|
| **The standard:** a realm's art for one kind of regiment (levies, spears, men-at-arms, archers, crossbows, light horse, knights…) | 93, covering 110 of 192 regiments | about 225: one for each realm and each branch it fields (D11) | The 93 are named the standard of their regiment. About 130 more come from 15 drill books (eight forms a branch) and three accent forms a realm |
| **House arts:** a **knights' art** for a house's sworn knights, men-at-arms and wards; a **line art** for its direct blood | 111 household styles: 64 of 180 great houses, 47 of 350 lesser noble and knightly families | about 220 (recounted): each of the 111 read as a knights' or a line art by its lore; 40 new line arts for the great martial houses that keep both; 40 more written for great houses; 30 lesser families with their arm's standard plus one family form | See the split below |
| **Order arts:** an **outer art** for every brother, an **inner art** for the order's masters | 0 | 16 (8 orders × 2) | Written whole from each order's lore |
| **Companies, watches, folk arts** (the dockside knife, the poacher's bow, the felling axe) | 0 | 80 | 60 written, 20 from the drill books. They give sailors, hunters and outlaws an art |
| **Masters' lineages** | 61 | 61, and those founded in play | Kept; a lineage takes pupils by its holder's choice or a school's fee |
| **Bound to a legendary** | 0 | 100 | One for each piece (§4) |

About 600 arts in the world and 100 bound to legendary pieces, with about 2,600 forms.

**House arts split (order 34).** A house may keep both arts, one, or neither:
- **Both** (about 40 great martial houses): the knights' art makes its men a match for any realm's knights; the line art makes its blood something more. Ironside: *the Ironside Anvil* for the Iron Knights, *the Closed Ring* for the blood.
- **A knights' art only** (about 60): blood and sworn men learn the same; the house's pride is its men.
- **A line art only** (about 30): a family secret; its knights learn the realm's standard.
- **Neither** (the rest): the realm's standard for everyone.

"The direct blood" is the head's children and grandchildren and the heir's line; a cadet branch keeps the line art one generation, then teaches it only if the head allows. A bastard, a ward or a son-in-law is taught the line art only by a choice of the head's, which is itself a card (and a thing other houses notice).

**Each standard carries its tactics:** three to five battle formations its men are drilled in, its own manoeuvre, and a floor its drills never fall below. Aldmark's heavy horse learn the Two-Wave Lance: the couched lance, the flanking charge, the rally and the Two-Wave Charge itself; weak in forest and against stakes.

### 3.5 Grades, and what an art is worth *(replaces the first draft's §3.2 table and its "skill outweighs style" rule)*

Every art has a grade, shown in words against your own realm's standard for the same arm.

| Grade | Who | At equal skill and equal application, against the standard | Forms | Years of teaching to its last form |
|---|---|---|---|---|
| **Lesser** | Folk arts, levy drill, a quarter of house arts (old, proud, out of date) | Loses 6 in 10 | 3-4 | 3 |
| **Standard** | Line regiments; a third of house arts (equal, but different) | Even | 4-6 | 4 |
| **Strong** | Knights' and guards' arts, good houses, most masters, orders' outer arts | Wins 6 in 10 | 5-7 | 8 |
| **Great** | The famous houses' line arts, the best masters, some orders' inner arts | Wins about 7 in 10 | 7-10 | 12 |
| **Peerless** | Two or three orders' inner arts; a legend's own art; a few hidden lineages | Wins about 8 in 10 | 8-12 | 15, with trials, and a Grandmaster for the last form |

The owner's rule: **at equal skill a top art wins about 7-3 or 8-2, and can be far more or less.** It is "far more or less" because of **application** (§3.6): a peerless art well applied against a standard one badly applied wins nine fights in ten and more; a peerless art that sits ill on its bearer, against a standard one that fits its man and counters the peerless one's line, can lose more often than it wins.

**Harder to learn, and worth it.** A great art takes three times the drill of the standard, asks a teacher who will take you, and opens its last forms only at Master or Grandmaster. An art gives its grade's worth in proportion to the forms you hold: half a peerless art is about a strong one.

**Skill and art together.** One word of the weapon's skill is worth about as much as the whole gap from a lesser art to a peerless one. A Master with the levy drill beats an Expert with a great house's secrets more often than not; an Expert with a peerless art, well applied, can stand with a Master. Two words cannot be made up by any art; only a legendary piece in a hand that has mastered it comes close (§4).

Each art also has two **strengths** and one or two **weaknesses**, from fourteen situations (open ground, the close press, against reach, mounted, a long fight, the dark, a ship's deck…). Today these are prose; they become rules.

### 3.6 Application: why nobody fights alike *(new, order 34)*

Two men with the same numbers do not fight the same. **Application** is how a fighter's body and habits meet his art's demands, and how his art meets the other man's. It is worth as much as an art's grade, and it is what lets a standard art overpower a great one.

It has four parts:
1. **Fit: what the art asks of the body, and what this body has.** Every art asks for some stats more than others. *The Hours of the Sword* asks for Speed and Reflexes, then Wits. *The Bell-Founder's Hammer* asks for Strength and Toughness, then Nerve. *The Marcher's Bill* asks for Strength and Senses. Fit is not how strong you are, but whether your strengths are where your art asks for them. The same body fits one art well and another badly.
2. **The match: your art against his.** Reach against close work, patience against haste, the press against the guard, and the fourteen situations. A spear art that keeps a sword art out on open ground; a dagger art that lives inside a lance's reach.
3. **Your hand: how you have made the art your own.** Everyone favours two forms and leans one way (quick or patient, high or low, the strike or the counter). The player's hand comes from what he drills and what he uses in real fights; an NPC's is drawn from the seed. When your favourite forms answer the other man's lean, you have an edge; when they play into it, he does.
4. **The read: having seen it before.** Having fought an art, or studied it, you read its forms sooner (as two pupils of one school already do), more with good Senses and Wits.

**An example, the owner's case.** Two knights, the same numbers: strong, sturdy, ordinary speed. One fights in *the Hours of the Sword* (peerless), which wants speed he lacks and close work; the other in his realm's standard spear art, which wants strength and keeps men at reach. The first knight's art sits ill on him and is answered by the reach; the second's fits him and counters the first. On open ground the standard art wins most of their bouts. Put them in a narrow stair, give the first knight two years of drilling the Hours' patient forms, and it turns back.

**In words, never numbers.** Before a duel the scale tips and the reasons are named: "Your art wants a quick hand; yours is a strong one. It sits ill." "Their spears keep you out; the Hours want close work." "You have fought the Moving Wall before." Choosing an art that suits your body becomes a real choice, and a teacher may tell you that the art you want is not the art for you.

### 3.7 Learned, taught, written, stolen, lost, founded

- **Learned by serving.** The muster (D11) sets your arm; you are taught its standard and rise by drill and by battles.
- **Taught by blood and oath.** A house teaches its children the line art from boyhood, and its sworn knights the knights' art. An order teaches its outer art to the sworn and its inner art to those it raises. A lineage's holder takes the pupils he chooses.
- **Bought** at a master's school, with a grading bout for each word, as now.
- **Written.** A manual is an item (E2): an art's forms, whole or to a point, in a hand that may be wrong. Read alone, it teaches at half a teacher's pace, to a reader at Advanced or better in the weapon, and a form learned wrong plays a word lower until a holder corrects it. Manuals are kept in strongrooms and chapter houses; stolen, copied, burned, buried, found.
- **Stolen.** After a duel, as now; and by sparring, by spying on a yard, from a captured manual or a defector. A stolen form stays at Beginner until its art is learned properly. A house that sees its line art in a stranger's hands answers with a challenge, a marriage offer or a feud.
- **Kept by one holder.** The art's holder is a post (A2) with a named heir. If both die untaught the art is **lost**: old hands teach the forms they hold; the top forms wait for a manual and a Master of the weapon. An art lost with a Legend becomes a Myth art.
- **Founded.** The player can found an art today (a weapon at Master, twelve real wins). Founders choose its strengths from what they have really done and its demands from their own body; it starts no higher than Strong, and forms are added by deeds. Now and then a great fighter elsewhere founds one.

### 3.8 In a duel, in a battle, in words

- **A duel** offers your six ready forms beside the five base moves (strike, guard, feint, press, grapple); strengths and weaknesses apply when the situation holds; application tips the scale from the first exchange.
- **A battle** gives you, at your rank, the choices of your regiment's standard for this ground, enemy and phase, on the war board (D12a, D12b). The report says what drill was worth: "Their lances were Hide-Knights; yours had the levy drill."
- **On a person's card:** "Fights in the Two-Wave Lance, Aldmark's standard for its heavy horse (Knight of the First Wave). Also taught the Ironside Anvil. Favours the First Wave; patient." An art's page gives its grade, what it asks of the body, where it is strong and where it fails, its holder and his line, who teaches it, whether a manual is known, and the forms you hold.

### 3.9 For the builders

- The 265 styles in `LORE.styles` stay as the arts they are; grade, family, demands, tempo, range, lean, strengths, weaknesses, keepers (`standard | knights | line | outer | inner | lineage | school | folk | bound`) and manual state sit beside them in `data/arts/`, with the new arts as compact rows. Techniques are read as forms in order; `rank` becomes the word that opens the form. `A.npcStyles` gains the regiment's standard, the house's knights' or line art by the person's tie to the house, the order's outer or inner art, and a trade's folk art.
- **The step model** sets the calibration, the duel engine (`07-duels`) stays the fight. Odds against an edge of `x` steps ≈ `1 / (1 + e^(−0.4x))`: 1 step about 6-4, 2 about 7-3, 3 about 8-2, 5 about 9-1. **Skill:** one step per 4 points, so a word is about 4 steps. **Grade:** Lesser −1, Standard 0, Strong +1, Great +2, Peerless +3, times `sqrt(formsHeld / forms)`. **Application:** fit −1.5..+1.5, match −1..+1, hand −0.5..+0.5, read 0..+0.5. **Gear:** E2's make and rarity (masterwork about +1.5; a legendary §4). In the engine these become the existing `edge` and footing terms; `GD.STYLE_XP` is multiplied by 0.75, 1, 2, 3 or 3.75 by grade.
- **Fit:** an art's `demands` are 2-4 stats with weights summing to 1. With `z_s` each stat's standing among the fighter's own people (C9's tables), `fit = clamp(1.5 × (Σ d_s z_s − mean(z over str spd ins sta tgh dex per nrv)), −1.5, 1.5)`. It is relative, so equal numbers give different fits in different arts.
- **Hand:** `p.hand = { fav: [formId, formId], lean: 'quick'|'patient', line: 'high'|'low' }`; the player's from drill and use, an NPC's from `hash(seed, pid, artId)`. **Match:** a table of tempo × range × lean, plus the fourteen situations.
- **Calibration, held by tests:** the grade table's win rates over 1,000 duels a pairing at zero application; with application drawn as the world draws it, peerless against standard spreads from below 5 in 10 to above 9 in 10; one word of skill beats any grade gap at zero application; fighting worth stays on the skill's table (a levy about 1, a knight 5 to 7, an order member 12 to 32).
- **State:** `S.sty.keep = { artId: [holderPid, heirPid, state] }`; `S.manuals = { artId: [[itemId, uptoForm, flaw]...] }` (E2 items); the player's `ready` (six form ids) and `met` (arts fought before).

## 4 · Legendary arms *(revised for order 34 §"legendary weapons")*

E2 plans about 100 pieces that exist once: by the owner's answer (D-032), of legendary rarity, fine or masterwork, almost unbreakable, held as heirlooms and treasures.

**What the owner asked:** any wielder can use one; they are far harder to master than ordinary arms; they are kept tightly safe; and they are far beyond any other weapon.

- **Any hand can use one.** Pick it up and it is at once the best blade you have held: it fights like a masterwork, and does not break.
- **Mastering it is its own skill.** Each piece has a **command** skill of its own (Beginner to Master) and its own **bound art** of three to five forms, the last its signature. Command grows only by carrying and using the piece, or by the teaching of its rightful line or order, and it grows slowly: a piece is long, heavy or balanced like nothing else, and its forms ask for a fighter who already stands at Expert or better in its weapon.
- **Far beyond.** As command rises, the piece's worth rises from a masterwork's to about **one whole word of skill**, before its bound art. A Master of the sword who has mastered the Iron Wolf's blade fights like a Grandmaster with anything else. No ordinary piece, however fine, comes near; two legendaries in one fight is the stuff of songs.
- **Kept under guard.** A legendary lives in a strongroom, a chapter house, a king's hand or a grave. Its keeper is a post; its passing is always a card; its theft is a crime the whole realm hears of. Carried openly, it changes the room: presence for its bearer, heart for those behind, and the notice of thieves, claimants and kings.

> *Replaced (order 34, D-039 §9):* "An unpractised holder has the blade's numbers and not its art, so skill still decides most fights" (from D-032 §8). The gap is now large; mastering the piece is the price. Also replaced: "a holder can use its art at Adept after carrying the piece a year"; the bound art is learned like any art, through command.

> An example, not yet lore: the sword of the Iron Wolf's grand masters. Black steel with a pale edge, a wolf's head in black iron for a pommel, grey pelt at the scabbard's throat. Its bound art, *the Ninth Night* (§3.3): *the Snow*, *the Pack*, and *the Ninth Night* itself, once a fight, when you are losing, you strike as if you were not, and the men behind you do not waver.

**Each has its own drawing.** The demo draws a legendary sword by rule: one sun-steel blade for all. Instead every legendary is designed as itself:
- **its own outline:** blade or head, guard, grip, pommel, and its own scabbard, quiver or strap;
- **its own metal,** from eight legendary finishes (watered steel, black iron, blued, pale silver-steel, sun-gilt, old bronze, bone and horn, red gold), the watering drawn from the piece's id so it never changes;
- **its own mark:** an inlay or a line of writing, and the scar its story gave it;
- **one accent colour and a second line of light,** which no ordinary piece has. Light, never a magic glow.

At 46 px its outline, accent and one glint say it is no common sword; on a card its fittings show; at full size and on its own **plate** (a card for the thing: name, past, bound art, keeper), everything. On the figure it hangs in its own scabbard, hilt showing.

**For the builders: what the piece and the art layer need.**
- **Command:** `p.cmd = { itemId: number }`, grown by months carried and fights used (× talent in its weapon's area, × 0.3 against an ordinary art's pace), taught by the rightful line at ×2. Its worth in steps is `1.5 + 2.5 × cmd/72` (Master's 72 gives the full 4 steps, one word); the bound art's grade is Peerless and needs command ≥ its form's word.
- **A record for each piece** beside the figure library's gear rows (the gate 2 library, D-035): outline nodes by part, finishes, inlay paths, accent, wear. About 1 KB packed; 100 within 120 KB, in the lazy lore payload.
- **Four record-drawing functions** beside the rule-drawn `swordArt` (blades, hafted arms, bows, plate pieces), a watering pattern, inlay, and the second light pass.
- **Budgets:** 12 shapes at 46 px, 60 on a card, 220 at full size (about four times an ordinary piece); inside D-025's 18 ms for a figure, and 8 ms for a plate.
- **Method:** C8's. A design sheet for each piece from its lore, drawn as data, judged by a second agent against the owner's bar (Ser Edric Vale's card). The owner sees the first twelve (the eight orders' arms and four crowns' swords) before the rest are drawn in lots of twenty. Until then a legendary shows its form in its own finish and accent.
- **Tests:** a lint (every unique has a drawing, a mark, a bound art and a keeper); agents pick the legendary out of nine swords of its form at 46 px, 9 times in 10, and tell any two apart at 96 px; a mastered legendary wins at least 8 in 10 against the same fighter with a masterwork; an untried hand gains no more than a masterwork gives.

## 5 · Data, speed and saves (for the builders)

**Files.** Content is data; the engine expands it.

```
data/growth/stats.json      { "id": "tgh", "name": "Toughness", "group": "body", "fadeFrom": 0.85, "people": { "orc": 1.9, "giant": 14 }, "build": { "sturdy": 2 } }
data/growth/talents.json    { "id": "body", "kind": "area", "covers": { "stats": ["str","spd","ins","sta","tgh"], "skills": "physical" } }
                            { "id": "spd", "kind": "attr" }   … 16 areas, 14 attributes, the letter bands, the people's leans
data/growth/skills.json     { "id": "craft", "gov": ["dex", "int"], "area": "craft", "legacy": ["craft"] }   the 38 broad skills
data/growth/rules.json      { "id": "make", "of": "items.forms", "ops": ["pattern"], "kind": "active", "kin": "trade:{trade}", "hook": "forge" }
                            { "id": "own-art", "of": "arts", "from": ["{art.prof}", "{art.id}"], "at": 72, "proof": "a win against an Expert or better" }
data/growth/skills/*.json   { "id": "smith.temper", "name": "Tempering", "kin": ["trade:smith"], "hook": "forge", "fx": { "make": [1, 2, 3, 4] } }
                            { "id": "merge.horse-archery", "from": ["mount:courser:ride", "shoot:horse-bow"], "at": 55, "proof": "a shot from the saddle in a real fight" }
                            { "id": "mark.ploughmans-back", "from": { "career": "farm", "years": 6, "before": 20 }, "fx": { "grow": { "str": 1.2, "dex": 0.85 } } }
data/growth/kits.json       { "id": "smith.journeyman", "has": [["smith.draw", "advanced"], ["smith.weld", "intermediate"]], "maybe": ["make:knife", "make:spearhead"] }
data/arts/standards.json    { "id": "std.POL-07.archers", "family": "bow", "book": "archers", "accent": "POL-07.2", "grade": 0, "keepers": "standard",
                              "demands": { "str": 0.4, "per": 0.4, "sta": 0.2 }, "tempo": "patient", "range": "long",
                              "tactics": ["skirmish", "massvolley", "stakes"], "strong": ["from cover"], "weak": ["against horse"] }
data/arts/houses.json       { "house": "FAM-001", "knights": "ST01-08", "line": "art.ironside.closed-ring" }
data/arts/*.json            new arts and their forms, in the technique format 07-duels reads, plus grade, demands and keepers
data/arts/books.json        the 15 drill books
data/items/legend-arts.json { "item": "u:kestrel", "art": { "forms": [ … ] }, "bearing": { "pre": 4 }, "keeper": "post:…" }
```

**The same every time.** Expanding the rules draws no dice and reads no clock; ids are words (`make:sword.arming`, `good:wool`), so a new sword renumbers nothing. Talent, an NPC's skills, his hand in an art and the world's first Grandmasters are hashes of seed, person and key, as `A.npcStyles` is. The player's progress is arithmetic; chance enters only where the engine already rolls (a check, a first try, a theft after a duel, a forging). The census is rebuilt in a fixed order. Drawing a page reads and writes nothing, and a test hashes the index and 1,000 views across two builds.

**The budget.** The A1 gate (`tools/bench/press-gate.mjs`) allows a quiet month 150 ms, and the engine already takes 80 to 170 (D-023). Growth must cost almost nothing; the gate will print its share. X7 (phone speed) applies: nothing here may load before it is needed.

| | Budget | Evidence |
|---|---|---|
| Building the index, at first use | 10 ms, once | the trial: 4,599 entries in 3 to 6 ms; re-run for about 6,100 at G3 |
| The player's month | 0.5 ms | arithmetic over the skills used that month; disuse once a year |
| `A.stat` with passives | no new work | reads the cached sheet (rebuilt on a change, 0.3 ms) |
| A talent | 0.002 ms, no state | two hashes and a blend; cached per person for the page |
| An NPC | nothing a month; 0.05 ms for a view when asked, then cached | not stored, not stepped; the trial: 0.01 ms for 27 skills |
| A duel's application | 0.02 ms a fighter | fit is a weighted sum over eight stats; the match a table look-up |
| The year: holders of 700 arts, the census of the top, a founding, a loss | 3 ms | one pass over two short tables |
| The save, at year 60 | 25 KB gzipped, capped | the trial: a player's 180 skills 1.6 KB (allow twice for real ids), 700 holders 3.5 KB, talent ranges 0.1 KB, census 0.1 KB; founded arts up to 12 KB, NPCs' gains up to 6 KB |
| The page | about 230 KB compressed, in the lazy payload | about 700 KB raw: 2,850 rows of 120 bytes, about 340 written arts at today's 2.7 KB less their shared books |

**Old saves.** `A.SAVE_VER` goes up by one at each stage that adds state; a step "growth" joins `A.V2SAVE.upgrade` and draws no world dice. Every sample save in `tests/saves/` must load and pass the new checks.

| Old | New |
|---|---|
| The six stats and their potentials | Unchanged, moved by nothing. The eight new stats are worked out once from v2's genes (judgment, presence, cunning, memory and toughness are there already), the potentials, quirks and wounds |
| `p.skills`, 38 numbers | The broad skills' numbers, unchanged; their words from the new bands. The player's ten folded keys open as skills at their broad skill's number. A number of 88 or more on a non-merged skill, or more Grandmasters than ten, is kept as it is in the save and listed by the census as "of the old age" (no one loses what they had); new rises obey the caps |
| Perks; `job.spec`, `mil.arm`, `mil.doctrine` | Knacks, by the same rule; held skills, with the old fields kept as mirrors |
| `langs`, `literate` | Tongue and script skills, levelled by years spoken |
| `p.styles` (`rank` 1-5), `styleMain`, `p.techs` | Arts, with the rank read as a word (1 Beginner, 2 Intermediate, 3 Advanced, 4 Expert, 5 Master); techniques as forms; a stolen technique is a form at Beginner |
| `p.apt` (Hopeless … Prodigy) | Talent known to the player: Hopeless F, Clumsy D, plain C, Apt B, Gifted A, Prodigy S, as a judged letter (the old game showed them), the number hidden |
| `p.used` | The disuse clock; `p.best` starts at today's numbers |
| `LORE.styles`, `S.styles` | Unchanged; grades, demands, keepers and holders added beside them |

## 6 · Building it

### 6.1 Stages: each a version, with its tests and checks

G opens v3 (D-037): built after v2's last item, on `v3-integration`, as versions `v3.0.0-alpha.N`. Posts (A2), named stages (X2), households (C6), branches (D11), the war board and command depth (D12a, D12b), bodies that make sense (C9), the Profile tab and its clean page (P, P2) and phone speed (X7) exist by then; the economy and the armoury do not. Each stage ends as every step does: tests, the coherency run, a playtest pass ("how do I get better at this?", answered from the screen 8 times in 10; "what is my talent?", found out in play within the first twenty years in 8 lives of 10), the records, a version with its release branch and a sample save. Engines: Opus 5.5. Rows and screens: Sonnet 5.5, in lots. Fable 5.2 reviews before G4 and directs the art names and the legendary designs.

| Stage | The player gets | New tests | New coherency checks |
|---|---|---|---|
| **G1** Stats, talent, coherent bodies (L) | Seventeen stats explained on a click, in C9's words; the three idle ones at work; load by Toughness; hidden talents, found by tries, teachers and feats, then shown as a letter and number | each stat changes 5 or more outcomes in 10 bot lives; nobody above a people's limit; the old six move by 0 in old saves; talent pure and equal across builds; letters spread as §1.4 says over 10,000 people; growth rates by letter within a tenth of the table; a teacher's judgement right or one off; the fighting-worth table and balance bands hold | every stat inside its limits; no Expert or better with a governing stat below its word's floor (age and wounds excepted) |
| **G2** One skill system, eight words (XL) | Proficiencies, perks and specialisms as skills on one page, in the eight words; first tries; disuse; three studies; the census of the top | the same odds on 200 sampled checks; first tries succeed by letter as §2.8 says; no skill from Intermediate to Master in under 15 years at C; disuse: no loss before its span, never more than a word, regained at five times the pace; 200 years on 5 seeds keep 1-10 Grandmasters and 0-1 Legend alive; an NPC's view pure and equal across builds; the gate's share; save size | no unmerged skill above 87; the census matches the people; one Legend at most |
| **G3** Skills for every route; merges (XL, four lots) | Rule skills from today's lists; templates, marks, merges (kindred, a life's work, the art made one's own); teachers and watching; "things to try here" and "heard of" | the lint; `tools/bench/route-depth.mjs`: in 10 bot careers a route, 20 route skills found by 40, each used 5 times or more; at least one merge in half the lives that reach Master; balance in bands | a teacher has what he teaches; every merged skill's parents are gone from the page |
| **G4** The arts (XL) | Arts by weapon family with numbered forms; grades in words; application on the scale before a fight; a standard for every regiment; house knights' and line arts; the eight orders' outer and inner arts; folk arts; manuals; six ready forms; stolen, lost and founded arts | one standard for each realm and branch; 16 of 16 order arts; the grade table; the spread of application (§3.9); one word beats any grade gap; two fighters with equal numbers in different arts differ in 9 duels of 10 in their moves; 200 years on 5 seeds keep 500 to 750 living arts | one holder an art; a line art held only by its blood, those the head chose, or marked stolen |
| **G5** Battles read the standard (L) | Battle choices on the war board from your regiment's training; the report names the drill | 12 different sets of choices in 20 battles; choices still move a battle by 15% at every rank (`rankfx`) | every unit has a standard |
| **G6** Legendary arms (L, and art lots) | Command of a piece, its bound art, its drawing and its plate; legendaries under guard | §4's tests; the bound art is its holder's alone | every legendary has one bound art, one drawing and one keeper |

G1 to G5 close the milestone `release/v3.0-growth`. G6 is built inside E2 (with E2b and E2d), when the unique pieces exist.

### 6.2 Ties

- **C9 (v2, now).** Population-relative stat words, no real units, coherent NPC bodies, longer healthy lives. G1 builds on C9's tables and must not undo them; C9 should store its tables where G1 can widen them to seventeen stats.
- **P and P2 (v2, now).** The Profile tab shows stats, talents, skills and arts; P2's clean page means G's screens show few lines (your skills by kin, merges on top), with the past in Records and details on a click.
- **E2 and E1, which follow.** A smith's Craft, the pattern, a form's operations and his Hands feed E2's forging roll: skill mostly sets the make, material and design the rarity; only *the Whole Forge* may sign masterwork. Kits say which forms a town's smiths know, so E2's stalls need no new state. Manuals and legendary pieces are E2 items; about 60 rule skills (new forms and goods) arrive with E1 and E2.
- **D11 and D12, which come before.** A branch is a regiment's kind: the muster teaches you its standard. The 141 tactics are a commander's active skills. The war board (D12a) should leave room for §3.8's choices.
- **A2, C6, C8.** An art's or a guild's holder is a post. A noble child's tutor and master-at-arms are the people who teach, and the first to judge a talent. Builds, scars and marks are the same facts on the figure and the Profile tab.

### 6.3 Risks

- **Every fight and every purse moves.** G2 changes no odds: it re-houses and renames. Later stages add only bounded effects and hold the balance league.
- **Dead numbers by the thousand:** Road to Ten's seventh rule, and why 49 and 69 folded ten proficiencies away. The answer is hooks by kind and the bench applied to each route.
- **Hidden talent that frustrates.** A player who never learns his talents plays blind. The first tries, teachers and the three-year rule make sure most are known by thirty; the test in §6.1 holds it.
- **A world too full at the top.** If the old saves' and today's NPCs' numbers put many above 88, the census is crowded at once. G2 measures it first; an old save keeps its people "of the old age" and the cap applies to new rises.
- **The player locked out.** With ten Grandmasters alive, a player may wait. Surpassing (§2.2) gives him a way through by his own hand, never a dice roll.
- **Application too opaque or too strong.** It is worth as much as a grade; if players cannot see why they lost, the scale's named reasons are the fix, and the test bounds its spread.
- **Too much to read, or one best build.** You see only what you have, what is here to try and what you have heard of; marks carry costs, passives are capped, a merge closes the parents' separate paths.
- **The writing:** about 2,850 rows and about 340 arts, a little more than the style lore that exists. In lots, by lint and critic; names checked against the rule of no names, sects or texts from any existing work.
- **Built before the economy.** G3 must not invent a second market or item model while it waits for E1 and E2.

### 6.4 What to cut first, if it is too much

In this order: arts founded or lost in play; the read (having fought an art before); manuals as items (teachers only); the hand in an art (keep fit and match); kindred merges beyond the first fifty (the art made one's own stays); companies and folk arts; Senses or Nerve; a skill for each weapon form; legendary drawings beyond the first twelve.

Not to be cut: one skill system with the proficiencies inside it, in the eight words; first tries; hidden talent found in play; the census of the top; a rule sheet for every stat and bodies that match the mastery; no skill without a reader; arts with numbered forms for every weapon family; a standard for every regiment, house knights' and line arts, and both arts for every order; application's fit and match; a bound art and command for every legendary.

### 6.5 What the owner has settled, and what is still open

**Settled by order 34 (D-039).** The first draft's eight choices, answered:

| First draft's choice | Now |
|---|---|
| 1. How many stats | Still open (below) |
| 2. What limits how much one knows | Talent, time, age and disuse; no slots (D-019, D-039 §3-4, §7). Six ready forms in a fight is still open (below) |
| 3. The words | The eight words, Beginner to Myth (D-039 §2). Skill grades in the item words are dropped |
| 4. How much of the skill world you see | No trees: what you have, what is here to try, what you have heard of (D-039 §3) |
| 5. How far an art may outdo the standard | 7-3 or 8-2 at equal skill, far more or less by application (D-039 §5) |
| 6. House secrets | A knights' art and a line art; both, one or neither (D-039 §6). Theft is still open (below, with 4) |
| 7. Should the world's arts change in a lifetime | Still open (below, 4) |
| 8. Legendary arms | Any wielder; hard to master; under guard; far beyond (D-039 §9). Drawings still open (below) |

**Still open, each with a recommendation.**
1. **How many stats?** (a) Seventeen, as §1.1. (b) Twelve: drop Hands, Senses, Nerve, Looks and Honour. *Recommended: (a).* Order 34 names speed and senses as attributes a person can be gifted in, and C9's words need a body measured in more than six numbers.
2. **Whom does the Grandmaster count cover?** (a) One count for the whole world, every skill together, one to ten alive, as the owner worded it. (b) One to ten in each great field (arms, command, craft, trade, learning, faith, speech), so up to seventy. *Recommended: (a),* kept by proofs and room rather than slots, with surpassing so a player is never locked out; (b) only if playtests show the trades starved by the fighters.
3. **Six ready forms in a fight, or all you know?** (a) Six, chosen before (a duel stays readable on a phone). (b) Every form you hold. *Recommended: (a).*
4. **Do arts move in a lifetime?** Founded, lost and stolen arts, line arts included. (a) Yes, slowly: a founding or a loss now and then, theft possible and answered by the house. (b) Fixed, and line arts never leave the blood. *Recommended: (a),* and still the first thing to cut.
5. **How far beyond is a mastered legendary?** (a) About one word of skill, plus its bound art. (b) Two words. (c) Half a word. *Recommended: (a):* "far superior" to any other weapon, while a Grandmaster with plain steel can still beat a Master with a mastered piece.
6. **Legendary drawings.** (a) Each designed by hand, the first twelve for your eye. (b) Made by rule. *Recommended: (a).*

Two small choices are taken here and can be changed by a word: talent letters are **F to S, and SS** for one of a kind, with the number beneath; and an art's grades are named **Lesser, Standard, Strong, Great, Peerless** (not "fine", which items use for make).

### 6.6 Records to add when this is approved

**DECISIONS** (this plan and the owner's answers; the conflict with Road to Ten's rule on dead numbers and the fix chosen; the lore's five Legends cut to one; the fighting-worth ladder renamed so Master and Legend mean one thing; knacks at the word edges), **V3_SPEC** (rules 8-12 read through this design), **PROGRESS** (the G line's stage names), **CLAUDE.md**, **the `life-sim-systems` skill** and **docs/README.md**.

## 7 · What order 34 replaced, for the record

The first draft (commit `f1a556d`, 2026-11-13 11:55 ET) is kept whole in git. In this revision these parts were replaced, not dropped:

| First draft | Replaced by | Why |
|---|---|---|
| §1.1 the body "in real units beside a thing you know" | §1.1 words against your own people | D-039 §12: real-unit readouts removed |
| §2.2 the ladder Untrained … Master on roots, four levels on other skills, Grandmaster and Legend only on a Way | §2.2 eight words for every skill and art; Grandmaster and Legend through merges, proofs and room | D-039 §2 |
| §2.2 skill grades (common, rare, epic, legendary: how a skill is got) | Dropped for skills; arts have grades (§3.5) | Order 34 gives the words; item words on skills would be a second ladder |
| §2.2 the parent rule (no skill above its parent) | Kin, with no gate, except that an art never stands above its weapon skill | D-039 §3: no trees |
| §2.4 Ways (three a root, one chosen, opening Grandmaster and Legend) and higher forms (about 120) | §2.4 merges at the top (the art made one's own, kindred skills, a life's work) | D-039 §3: skills merge at high levels |
| §2.6 a tree for every route, the smithing tree in full, "within reach" | §2.6 born by trying; the route table kept as what a life finds by doing | D-039 §3 |
| §2.7 talent as six words, Hopeless to Prodigy, on trees | §1.4 hidden talent by area and attribute, letter and number | D-039 §4 |
| §2.7 rust after three years, a level lost for good after ten | §2.7 disuse: rare, slow to begin, quick to return | D-039 §7 |
| §2.7 "six arts ready in a fight" | Six ready forms (open, §6.5) | "Art" now means the whole art |
| §3 "fighting styles" and their "arts" (techniques) | §3 arts and their numbered forms | D-039 §1 |
| §3.2 grades Weaker to Beyond compare, 6-10 to 8-10, "skill outweighs style: two levels outweigh any style" | §3.5 grades Lesser to Peerless; §3.6 application; one word of skill worth about the whole grade range | D-039 §5 |
| §3.4 "outer teaching for sworn knights; the top arts for blood" | §3.4 a knights' art and a line art, both, one or neither | D-039 §6 |
| §3.6 footing: rank × (0.6 + 0.4 × grade) | §3.9 the step model | Needed to carry application |
| §4 signature art usable at Adept after a year; "skill still decides most fights" | §4 command of the piece, a bound art, far beyond any other weapon, under guard | D-039 §9, replacing D-032 §8's discretion |
| §6.5 eight decisions | §6.5 what is settled, and six still open | D-039 |


## 8 · Owner order 35 (2026-11-13 18:54 ET, D-042): baselines, then any build
Where this section differs from §1.5 and elsewhere, it wins. A skill's governing stats set a modest **baseline** for each
word: below it the skill stalls at that word and performs as if lower in use ("only for show"). Above it, nothing is
forced: stats beyond the baseline add only through application, every build is valid, and the game must hold thousands
of different builds and ways to play. "Each word needs a body to match" (§1.5) is replaced by this baseline rule.


## 9 · Owner order 36 (2026-11-13 19:23 ET, D-043)
Where this section differs from anything above, it wins: no caps on Grandmasters or Legends (drop §2.2's caps and
`GD.LEGEND_CAP`); fusion only when the player chooses, never automatic, explained in plain words; up to seven talents
picked at birth with their grades (F, E, D, C, B, A, S, SSS; SSS near impossible unpicked; a point budget at creation),
talents broad (Physique) or narrow (Speed) in a short categorised picker; letters set ceiling and growth, long training
creeps past; art grades Lesser, Basic, Great, Renowned, Legendary (no Myth art); arts stay with their holder until
replaced, only basic moves are shared; the combat ladder is for combat only, other callings progress by fame,
influence, deeds and relations without grades or rung lists (L1), nobility lived in full (N1); legendaries outclass
ordinary arms outright but must land, and speed, strength and skill can make them miss; baselines rise with difficulty
but stay minor.

**Order 37 (2026-11-13 19:37 ET, D-044):** no limit on how many talents are picked; a point budget only. Each talent is priced by how much
it can change a life; lowering one below the default refunds points; prices stay moderate.

## 10 · The talent budget, first scope (owner order 38, 2026-11-13 19:40 ET; numbers to be tuned in G1 against bot lives)
**Letters, growth and ceiling.** F ×0.5 (a low ceiling) · E ×0.7 · D ×0.85 · **C ×1.0 (average, the default)** · B ×1.15
· A ×1.35 · S ×1.6 · SSS ×2.0 (and a ceiling past the people's usual limit). Long training creeps past any ceiling, slowly.
**Cost to raise a talent from C** (cumulative): B 2 · A 5 · S 10 · SSS 20 points. **Refund to lower it from C:** D +1 ·
E +2 · F +3 (a refund is always smaller than the matching cost, so tanking one thing never pays for a free top talent).
**Weight by reach** (multiplies both cost and refund): narrow ×1 (one attribute, one weapon family, one craft) ·
group ×2 (a few attributes together, or a whole calling) · broad ×3 (all of body, all of mind, all of presence).
**Budget:** 20 points. So: Physique A costs 15; Senses S costs 10; Speed SSS costs the whole 20; a broad SSS (60) cannot
be bought even by lowering everything else; lowering Intellect to E gives back 6.
**The picker** (categories, then subcategories; each opens on click, so the list never sprawls):
- **Body:** Physique (broad) › Might (strength and toughness, group) · Agility (speed and reflexes, group) · single:
  Strength, Speed, Reflexes, Toughness, Endurance, Senses, Hands.
- **Mind:** Intellect (broad) › Learning (memory and wits, group) · single: Wits, Memory, Judgement, Cunning.
- **Spirit and presence:** Presence (broad) › single: Will, Nerve, Bearing, Looks.
- **Arms** (each a group): Blades, Polearms and spears, Axes and maces, Bows and crossbows, Bare hands, Riding and the
  lance, Command.
- **Callings** (each a group): Trade, Court and diplomacy, Crafts, Faith, Healing, Stealth and intrigue, The land.
Talents left untouched are rolled hidden at birth (mostly C, sometimes higher or lower) and found in play.
