---
name: "life-sim-systems"
description: "Design or fix systems for a deep life-sim or medieval/fantasy RPG: stats, growth by age, races, odds without percentages, kinship and succession, nobility, renown, diplomacy, elite units and war at every rank."
---

# Life-sim systems that feel like living a life

Use this when building or reviewing character, family, politics or war systems for a life simulation (BitLife × Crusader Kings × Mount & Blade style). Every rule below came from real player complaints and was proven with tests in the Ardan v2 modules (`src/body.js, odds.js, kin.js, succession.js, nobility.js, renown.js, diplomacy.js, war.js`).

## 1. Stats: words measured against the people, not "22/100" and not kilograms
- Players hated both bare numbers and real-unit readouts ("66 kg, lifts 120 kg", "reactions 170 ms"). Show each stat as a word for its **measured centile among the whole grown population of the person's own people** (Ardan, D-040: under 2, 2-10, 10-30, 30-70 average, 70-90, 90-98, 98-99.9, beyond: off the chart). Measure the table from generated worlds, not from fixed thresholds, and say on click what it is read against.
- A child is held to bodies of its own age and says so ("strong for a child of nine"). Another people is also read against the yardstick people (a giant's strength off the chart against men, its speed off the other end).
- Keep real units inside the engine and tests only; the page and every person's description use words.
- **Skill baselines, not matching stats:** each skill word from Journeyman asks a modest baseline of its two governing stats (a Master about an average body or mind for that skill). Below it the skill stalls and works as the lower word ("for show"); past it, any build is fair. Generate NPC masters to clear their baselines; never force the player's stats up.
- **Lifespans:** a healthy, fed, peaceful adult should die of age mostly between 50 and 75; let estate tilt it a little and let violence, plague and war still kill. Test it on the death-odds function alone.
- Minds: score like IQ (mean 100, sd 15), shown as words plus rarity: "sharp: better than all but 1 in 40". Cap the rarity text at "ten thousand". Show "too young to tell" under age 6.
- Current value = race base × sex factor × genes × **maturity(age)** × conditioning × wounds.
  - Height follows WHO/CDC growth curves as a fraction of adult height. A newborn is about 29% of adult height and a 1-year-old about 43%.
  - Strength maturity is about 0.03 at birth, 0.34 at 10, 0.86 at 18 and 1.0 from 25 to 32, then falls to about 0.7 by 60.
  - Stretch the curves per race with `ageScale` (orc 0.78, dwarf 1.65, elf 2.1, giant 1.9).
- Conditioning moves toward a **natural ceiling** (lift ×3.8 for an untrained adult; Earth's record is about ×3.8 too). Gains shrink near the top, and idle months lose a little.
- **Breakthroughs** are the only way past a ceiling: winning a real-stakes attempt by a surge of will against long odds raises the ceiling by about 12% for each unit of magnitude. This is how a human climbs to giant-class.
- Learn by doing: skills are hours practised × talent × age factor (children fast, elders slow) × wits. Tiers are Untrained 0, Novice 30, Apprentice 200, Journeyman 800, Adept 2,500, Expert 6,000, Master 12,000, Grandmaster 25,000 and Legend 50,000 hours.
- **Growth must not be linear, and every change needs a cause** (Ardan's G0 standard, `docs/design/growth-standard.md`, D-067;
  a design, not yet built). Gain = effort × quality (routine work stops teaching once you can do it; a task above you
  under stakes teaches most) × teacher (by the gap in words, never past one word under him) × talent × age by kind
  (movement young, tongues before 17, judgement from 30) × condition × a steep practice curve (a beginner's month worth
  about thirty of a master's). Plateaus carry a named reason; crossing a high word takes a deed, and stored effort lands
  as a leap. Each stat has its own age curve (speed peaks first, decline quickens after 60); bodies detrain (endurance
  first) and retrain fast; skills rust only after years and return ×5. Measure it with bot lives: R² of a straight line
  through the climbing years, gains by word, flat years (`docs/design/growth/analyze.mjs`).

## 2. Races are different bodies
Humans are the yardstick. Square-cube law: a 5.6 m giant has about 10× human strength, is slow to react (420 ms) and is very tough (×14). Orcs carry about 2.2× human lift and ×1.9 toughness, and mature by 16. Dwarves are dense and tough with long lives; elves are fast and fragile.

**Fighting worth, measured in levies** (1 levy = an untrained spearman in a padded coat):
`worth = 0.662 × might^0.5 × speed^0.5 × toughness^0.6 × skillMult[tier] × gear`, where might = lift/130 and speed = (sprint/7.2) × (250/reaction).
- skillMult by tier: 1, 1.15, 1.35, 1.6, 1.95, 2.4, 3.0, 3.8, 4.8. Gear: none 1, levy 1.25, mail 1.6, plate 2.0, order panoply 2.2.
- Calibration targets, which the tests enforce:

  | Fighter | Worth (levies) |
  |---|---|
  | Levy | about 1 |
  | Man-at-arms | 2 to 3.2 |
  | Knight | 5 to 7 |
  | Elite order member | 12 to 32 |
  | Ordinary adult giant | 12 to 30 |
  | Legend | 50 to 80 |

- **What it takes for a human to stand equal to a giant:** Master tier, lift around 500 kg (one breakthrough), and order-grade gear.

## 3. Odds without percentages, and outcomes beyond dice
`attempt()` decides every test from three forces:
1. **Edge** = ln(capability/difficulty) × 2.45, plus standard logistic noise. One tier up (×1.5) wins about 72%.
2. **Blunders.** Chance = 2.5% × e^(−0.7·judgmentZ) × (1 + 1.6·fatigue) × (1 + overconfidence), where overconfidence rises once the edge passes +1. A blunder subtracts 2.5 to 5. Fools and the cocky lose fights they should win.
3. **Surges.** These happen only when losing with stakes above 0.3. Chance = 2.2% × e^(0.7·willZ) × (0.5 + stakes) × (0.6 + desperation). A surge adds 1.5 to 4 and costs strain. Winning by a surge at an edge below −0.8 is a **breakthrough**.

Show odds as words plus a tipped balance icon. The words, from best to worst: a certainty, heavily in your favour, in your favour, evenly matched, against you, long odds, hopeless. Never show a %. Afterwards, show why it happened ("overconfidence", "a surge of will", "outmatched").

## 4. Kinship and relation labels
- Compute blood terms from the lowest common ancestor distances (da, db): parent/child, siblings (count shared parents to find half-siblings), uncle/aunt, nephew/niece, and nth cousin m times removed. Then add in-laws and step-relations through exactly one marriage.
- **There is one label resolver, with strict priority: spouse > blood > in-law > liege/vassal > personal bond.** A bond is added as a qualifier ("your father (your dearest friend)") and never replaces kinship. Never call kin or a spouse a "mutual friend". `canCallMutualFriend()` guards this.
- **Notable kin** walks the family graph up and down 3 generations. Within degree 4 it keeps close kin, plus anyone with a title, an office, an heir-to claim, or an age within ±3 of yours.

## 4a. Households: the tree knows your kin, relationships know whom you have met
- **Keep two stores.** The family tree (parents, children, spouse) holds every relative the world knows of, living or dead; the relationships hold only the people the character has met, each with **how they met** (`met: { year, place, reason }`, written by the one link function). Labels always come from the tree.
- **At birth a commoner knows the parents, the living brothers and sisters, and a grandparent only under the same roof** (decided from the family's seed, at most two): at most 8 people, never an uncle, a cousin or an in-law. **A noble child adds the household**: a wet nurse, a maid and a guard knight, and a tutor from age 6 (commoners with lives of their own): at most 12. Ardan tests this over 42 births (`src/family/999991-households`).
- **Others enter through what happens**: a yearly family gathering (a log line, not a card) meets one relative not yet met, the parish's people first; a scene that names a relative takes one from the tree and meets them then.
- **No event mints kin.** A kin helper takes a relative from the tree or the scene drops (a missing relative is a skipped card, never a new person). A secret a story tells (a deathbed's half-brother, a child you never knew) is written into the tree and marked as such; a claimant the player recognises joins the tree as a real relative's bastard. Hold it with a lint over the event sources (no maker linked under a blood word; no "your cousin {x}" without a kin source) and a run check (12 worlds × 30 years: no kin word given to someone outside the tree, no blood relative created after the start except by a birth).
- **Keep the common folk as seeds.** A parish (priest, reeve, miller, smith, neighbours, their children) is a few numbers per person derived from the world seed and the place; a full person is made, deterministically on its own stream, only when met. Acquaintances at home come from the parish before strangers.
- **Births take nine months.** A conception is a date and the birth comes 262–280 days later, in any month; a woman with child does not conceive again, and a mother who dies first takes the child with her.

## 5. Succession: the house law, never a menu
- Laws: male-preference, absolute, agnatic, seniority, and elective (where ability decides).
- Houses also have a fitness rule. Under `unfit-passed-over`, the council may skip someone judged simple (wits under 72 and judgment under 75), branded craven, or sickly. Death and holy vows always remove a person.
- The line is a depth-first walk through the holder's children (sorted by the law), then siblings' lines, then cousins' lines.
- Players never pick heir, bastard or younger child. Birth order comes from the simulation.
- **One resolver gives a house its head and heir** (`A.HOUSE.resolve`: the living head, the heir as the first living person of the head's line under the law; a house whose head died gets its court lord or the dead head's successor). Every reader and the one mover at a death ask it; nothing else picks an "eldest son".
- **There is one holder per title.** When a holder dies, move the titles (`dead.titles = []`). Pass titles of people who start the game dead before play begins. Read the same holder for both the inheritance box and the tree. A test runs 30 seeds × 10 years to check this.
- **Posts are a registry, not loose fields.** Ardan keeps seats, offices and commands in `A.POSTS` (`src/nobility/999990-posts`): appoint, vacate and leaveAll are the only writers, a promotion hands over the old post and moves the man replaced, every exit (death, prison, desertion, resignation, a crown) leaves every post, and titles are read from the posts held. Separate the grade (what you are qualified for) from the post (what you command). A seat needed only in war (the Marshal) stays empty in peace.

## 6. Nobility pyramid
Each realm has: king > dukes (at most 3; ≥24 counties → 3, ≥14 → 2, ≥7 → 1) > marquises (at most 6, 2–3 per duke, placed on **border** counties and created before the duchies) > one count per county > 2–3 viscounts per count > 2–4 barons per viscount > 3–6 landed lords per baron. Create only dukes, marquises and counts as full records. Generate lower nobles on demand from a deterministic seed. A 30-county realm has about 1,000+ nobles and costs almost nothing to save.

## 7. Renown and promotion are non-linear
- **Deed weight** = e^(0.9·max(0, −edge)), × 1.6 for a triumph, × the witnesses (alone 0.3, comrades 1, company 1.6, army 3, court 4, realm 6).
- **Renown** sorts deeds by faded weight (0.88 per year) and sums w/(1 + 0.6·i), so a lifetime of small deeds levels off.
- **Promotion** is a monthly chance: 0.004 + vacancy × (0.02 × steadiness + 0.35 × merit²), where merit = best deed in the last 18 months ÷ (2.5 × 2.1^rank). A merit above 3 can skip a rank. The test requires the spacing between promotions to vary a lot (coefficient of variation above 0.6).

## 8. Diplomacy is a sum of named reasons
- Each relation is a map of named factors, each with a value, a decay and a text. Status is derived from all factors together:
  - marriage + feud = "uneasy marriage alliance"
  - alliance + old grudge = "allied, but old wounds remain"
- Monthly drivers: border friction, a common threat (skip it if either realm is allied to the threat), incidents (decaying negatives), favours, marriages (rare, at most one per 12 years per pair), and ruler deaths that bring new temperaments.
  - Alliances form at a score of 22 or more.
  - They break below 8 (below −5 if a ruler is honourable).
  - Wars need hostility, a shared border and ambition (or a score of −45 or lower).
- Show the reasons as "Drawing together: …" and "Pulling apart: …", deduplicated.
- Outsiders hear news only about 35% of the time, about 25% of that is garbled, and it is phrased as rumour.

## 9. Elite orders and war
- **Orders:** keep about 5 in the world, each with 150–350 members worth 14–26 levies each, plus `terror`, which deals morale damage. Joining means passing three trials with the odds engine.
- **Battles:** 4 phases (Skirmish, Clash, Press, Decision).
  - Only the frontage fights (open ground about 1,400 men, a pass about 250). Units under 400 men engage almost fully, so elites punch far above their numbers. This is Lanchester's linear law.
  - Losses scale with incoming power ÷ worth^0.75 ÷ the tactic's defence.
  - Morale falls with casualties (×3.2), enemy terror, flanking and shock. A unit routs at 0.18 morale or 25% strength. When the line collapses, shaken units also break.
  - Each side gets random fortune: power × e^N(0, 0.18).
- **Ranks:** soldier (your place in the line), sergeant (your squad), captain (your company's tactic), commander (army tactic and reserves).
  - Soldiers and sergeants are rated against the unit across from them; reaching for the standard is rated against the best troops. Officers are rated on command (tactics skill + judgment) against the enemy commander.
  - Soldiers see enemy numbers only as rough estimates.
  - The test requires the high-value choice to beat the low one at every rank by 4 points or more at sergeant and above.
- **After-action report:** the three biggest signed contributions in words (the ground, tactics, numbers, quality, elites, your part).
- **Not your war?** Then the player gets no view of it, only rumour.
- **Where the design is going (D-064, `docs/design/war.md` part two; not built yet, so the lines above still describe the code):**
  - Five ranks (soldier, sergeant, captain, commander, General) and no Marshal; a host is 3,000 to 12,000 men under one General; the king, or one General by his word for one campaign, commands several.
  - Every armed man is in one command (the crown's, or a great lord's own under officers he names); the king summons and each lord answers from named reasons; contingents are kept whole. Private wars, refused summonses and border lords' wars follow from it.
  - No levies: sworn men, enlisted men and the roll; conscription by proclamation in real need, with a cost in fields and a remembered grievance.
  - Every decider weighs named reasons, bent by temper and by feelings that have a cause and cool; dice only choose between close options. A war ends only by surrender or defeat.
  - You see from where you stand; everything else is a report with a sender, a road, a day and a slant.
  - Stability is the sum of named pressures; a faction needs a shared grievance, a tie and a leader; a coup needs a motive, access and an opening.

## Checklist before shipping a system
- [ ] Does every number come with words or a real unit?
- [ ] Does it change with age, and is it different per race?
- [ ] Can a careless favourite lose, and can a determined underdog win?
- [ ] Do the labels contradict each other anywhere (relation, status, rank phrases)?
- [ ] Is there one source of truth (title holders, heirs)?
- [ ] Is there a test with calibration targets that fails the build if the numbers drift?