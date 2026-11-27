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
- **Skill baselines, not matching stats:** each skill word from Advanced asks a modest baseline of its two governing stats (a Master about an average body or mind for that skill). Below it the skill stalls and works as the lower word ("for show"); past it, any build is fair. Generate NPC masters to clear their baselines; never force the player's stats up.
- **Lifespans:** a healthy, fed, peaceful adult should die of age mostly between 50 and 75; let estate tilt it a little and let violence, plague and war still kill. Test it on the death-odds function alone.
- Minds: score like IQ (mean 100, sd 15), shown as words plus rarity: "sharp: better than all but 1 in 40". Cap the rarity text at "ten thousand". Show "too young to tell" under age 6.
- Current value = race base × sex factor × genes × **maturity(age)** × conditioning × wounds.
  - Height follows WHO/CDC growth curves as a fraction of adult height. A newborn is about 29% of adult height and a 1-year-old about 43%.
  - Strength maturity is about 0.03 at birth, 0.34 at 10, 0.86 at 18 and 1.0 from 25 to 32, then falls to about 0.7 by 60.
  - Stretch the curves per race with `ageScale` (orc 0.78, dwarf 1.65, elf 2.1, giant 1.9).
- Conditioning moves toward a **natural ceiling** (lift ×3.8 for an untrained adult; Earth's record is about ×3.8 too). Gains shrink near the top, and idle months lose a little.
- **Body breakthroughs (past a stat ceiling) are rare, costly and budgeted** (`docs/MASTER_PROMPT.md` §6.2). The
  release's old duel leap (`A.breakthrough`, fired by any win over a foe more than 8 above you) was the exploit; order 95
  retired it and H-164 removed its call from `07-duels.js`. Ardan's breakthroughs now live in two reasoned places: the
  **level walls** (`A.LV`, every hundredth level: points, a skill may jump a rank, a class branch; see the
  `rpg-progression-design` skill) and the **skills' grasp of a concept** (below). Any new body breakthrough must still meet:
  - **A lifetime budget** of a few true breakthroughs, **years apart**.
  - **Never from sparring,** practice, drill or a bout with nothing at stake: only a real-stakes deed against long odds.
  - **A real risk** of crippling injury or death that grows with the gap overcome.
  - **A hard ceiling from the body model:** a little (about an eighth, `docs/design/growth-standard.md` §3.11), never past
    the person's people's limit; no compounding rise in `pot`.
  - Measure it with the balance harness before and after, and record it in `docs/DECISIONS.md`.
- **Skills are rungs with levels, and experience** (S1, D-072, then the skills rebuild: `src/people/37-skills2` over the
  engine `src/people/engine/skills2.js`; design `docs/design/skills-v2.md`). The player reads a rung, a rank and a level
  ("Basic Swordsmanship · C · Lv 3"), printed only by `A.SK2.label` and its kin; S1's seven words ("Beginner I" to
  "Legend V") are gone from everything a player reads (orders 78, 83; `tools/lint-skills.mjs` fails them). Experience moves
  only through `A.gainXp(p, k, effort, cause)` and a level only through `A.SK.set`; never write `p.skills[k]`.
  **A new rank is not bought with experience:** its named concepts must be grasped (a person's need for each is a hash:
  some come at once, some take ten years, a few never), and from rank B a **deed** proves it (a check at the next rank's
  value, succeeded, or a deed through `A.deedDone`). **Concept-grasp breakthroughs** are sudden grasps at named moments (a
  defeat by a better hand, a near death, a rival, a new land, a master's word) that release stored effort; they never raise
  a stat ceiling. Discipline, a rival, a new place, needs, teachers and specialisms move what a month is worth, and every
  one is written in the ledger beside the gain it changed. Other people grow in closed form once a year (`SK.npcGrowYear`): at what their posts work (an NPC's posts are in the
  post registry, never in the player's own fields; `SK.works`) and, a master, at his own best art (D-196).
  Skill kinds (actives, passives, buffs), evolution, merging and arts: `rpg-progression-design`. No percentages, no bare
  numbers on the page.
- **Growth must not be linear, and every change needs a cause** (Ardan's G0 standard, `docs/design/growth-standard.md`, D-067;
  S1 builds it for skills; stats follow in G1/G2). Gain = effort × quality (routine work stops teaching once you can do it; a task above you
  under stakes teaches most) × teacher (by the gap in words, never past one word under him) × talent × age by kind
  (movement young, tongues before 17, judgement from 30) × condition × a steep practice curve (a beginner's month worth
  about thirty of a master's). Plateaus carry a named reason; crossing a high word takes a deed, and stored effort lands
  as a leap. Each stat has its own age curve (speed peaks first, decline quickens after 60); bodies detrain (endurance
  first) and retrain fast; skills rust only after years and return ×5. Measure it with bot lives: R² of a straight line
  through the climbing years, gains by word, flat years (`docs/design/growth/analyze.mjs`).

## 2. Races are different bodies
Humans are the yardstick. Square-cube law: a 5.6 m giant has about 10× human strength, is slow to react (420 ms) and is very tough (×14). Orcs carry about 2.2× human lift and ×1.9 toughness, and mature by 16. Dwarves are dense and tough with long lives; elves are fast and fragile.

**Fighting worth, measured in conscripts** (1 conscript = an untrained spearman in a padded coat):
`worth = 0.662 × might^0.5 × speed^0.5 × toughness^0.6 × skillMult[tier] × gear`, where might = lift/130 and speed = (sprint/7.2) × (250/reaction).
- skillMult by tier: 1, 1.15, 1.35, 1.6, 1.95, 2.4, 3.0, 3.8, 4.8. Gear: none 1, a conscript's spear and padded coat 1.25, mail 1.6, plate 2.0, order panoply 2.2.
- Calibration targets, which the tests enforce:

  | Fighter | Worth (conscripts) |
  |---|---|
  | Conscript | about 1 |
  | Man-at-arms | 2 to 3.2 |
  | Knight | 5 to 7 |
  | Elite order member | 12 to 32 |
  | Ordinary adult giant | 12 to 30 |
  | The great swords of the age (the release's old top fighter tier) | 50 to 80 |

  These tiers are the release's fighting-worth scale (`GD.TIERS`); since order 98 their words ("Master", "Legend") leave
  player text, and "legend" means only the beings of levels 800 to 1000 (`data/legends.json`, `A.POWER`). The person's
  level and the power ladder (log10 of might from the level) are the scale a player reads now (`rpg-progression-design`).
- **What it takes for a human to stand equal to a giant:** the top of the human fighting tiers, lift around 500 kg (at most one body breakthrough, inside the budget of §1), and order-grade gear. Rare by design. (Orcs are no longer a playable people since order 98: demonic creatures; their body numbers above still serve the bestiary.)

## 3. Odds without percentages, and outcomes beyond dice
`attempt()` decides every test from three forces:
1. **Edge** = ln(capability/difficulty) × 2.45, plus standard logistic noise. One tier up (×1.5) wins about 72%.
2. **Blunders.** Chance = 2.5% × e^(−0.7·judgmentZ) × (1 + 1.6·fatigue) × (1 + overconfidence), where overconfidence rises once the edge passes +1. A blunder subtracts 2.5 to 5. Fools and the cocky lose fights they should win.
3. **Surges.** These happen only when losing with stakes above 0.3. Chance = 2.2% × e^(0.7·willZ) × (0.5 + stakes) × (0.6 + desperation). A surge adds 1.5 to 4 and costs strain. Winning by a surge at an edge below −0.8 is a **breakthrough candidate**: it becomes a body breakthrough only within the budget, cooldown, cost and ceiling of §1.

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

## 4b. Every relationship needs a base (who will let you near)
- **Access is the higher man's decision**, through the same `A.WHY.decide` as every other (`A.REACH`, engine `src/people/engine/reach.js`): "let him near" against "keep him at a distance", for each act (know, befriend, audience, favour, court, wed, patron), each asking more of the base.
- **Four parts:** the gap in standing (estate, rank, office, in steps; weighs against, bent by his pride against his warmth); his pride and personality, and **his own birth** (a man risen from below sympathises with one where he stood; one born to gold looks down); **need** (your sword in his war, your skill, your silence, your coin, your voice in council); **circumstance** (you serve him, stood in his line, shared his cell or lessons, saved his life).
- **The scales the player shifts** are reasons of their own with words: knighthood ("a knight of your name is worth an hour"), honour, renown, mastery of anything, wealth, a recent deed, an introduction from someone who knows both, a shared lord, a guild.
- **Near-equals and kin decide nothing**: keep what worked among equals. A door no reason could open is not offered, with a click-to-open note; a door that might open is an attempt he answers with his reason; a refusal stands for a year.
- **NPCs alike:** a patron, a great house's match and a circle's newcomer follow the same pull, so bonds across a wide gap are rare where pride is high.

## 5. Succession: the house law, never a menu
- Laws: male-preference, absolute, agnatic, seniority, and elective (where ability decides).
- Houses also have a fitness rule. Under `unfit-passed-over`, the council may skip someone judged simple (wits under 72 and judgment under 75), branded craven, or sickly. Death and holy vows always remove a person.
- The line is a depth-first walk through the holder's children (sorted by the law), then siblings' lines, then cousins' lines.
- Players never pick heir, bastard or younger child. Birth order comes from the simulation.
- **One resolver gives a house its head and heir** (`A.HOUSE.resolve`: the living head, the heir as the first living person of the head's line under the law; a house whose head died gets its court lord or the dead head's successor). Every reader and the one mover at a death ask it; nothing else picks an "eldest son".
- **There is one holder per title.** When a holder dies, move the titles (`dead.titles = []`). Pass titles of people who start the game dead before play begins. Read the same holder for both the inheritance box and the tree. A test runs 30 seeds × 10 years to check this.
- **Posts are a registry, not loose fields.** Ardan keeps seats, offices and commands in `A.POSTS` (`src/nobility/999990-posts`): appoint, vacate and leaveAll are the only writers, a promotion hands over the old post and moves the man replaced, every exit (death, prison, desertion, resignation, a crown) leaves every post, and titles are read from the posts held. Separate the grade (what you are qualified for) from the post (what you command). A council place that belongs to a post (the senior General's is the crown's first host) is read from that post, never stored as a seat of its own.

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
- **Orders:** keep about 5 in the world, each with 150–350 members worth 14–26 conscripts each, plus `terror`, which deals morale damage. Joining means passing three trials with the odds engine.
- **Battles:** 4 phases (Skirmish, Clash, Press, Decision).
  - Only the frontage fights (open ground about 1,400 men, a pass about 250). Units under 400 men engage almost fully, so elites punch far above their numbers. This is Lanchester's linear law.
  - Losses scale with incoming power ÷ worth^0.75 ÷ the tactic's defence.
  - Morale falls with casualties (×3.2), enemy terror, flanking and shock. A unit routs at 0.18 morale or 25% strength. When the line collapses, shaken units also break.
  - Each side gets random fortune: power × e^N(0, 0.18).
- **Ranks (built, W1-1):** five on every screen: soldier (your place in the line), sergeant (a section of about 12), captain (a company of about 200; its tactic), commander (a wing of 600 to 3,000), General (a host of 3,000 to 12,000: a division of the war map). General is the highest rank; there is no Marshal or High General. One General to each host, so Generals follow army size; under 3,000 is a column under a Commander. An army of two hosts or more is led by its commanding General by the king's written word for that war (a commission, not a rank). The senior General (the crown's first host) sits at council and commands no other General. Old grades keep their eight steps of pay and merit; a second step says so ("Captain (second step)").
  - Soldiers and sergeants are rated against the unit across from them; reaching for the standard is rated against the best troops. Officers are rated on command (tactics skill + judgment) against the enemy commander.
  - Soldiers see enemy numbers only as rough estimates.
  - The test requires the high-value choice to beat the low one at every rank by 4 points or more at sergeant and above.
- **After-action report:** the three biggest signed contributions in words (the ground, tactics, numbers, quality, elites, your part).
- **Not your war?** Then the player gets no view of it, only rumour.
- **Commands and the summons (built, W1-3, D-081 to D-085; `src/war/9999951-commands`):**
  - Every armed man (a division of the war map) is in exactly one command: the crown's (first host, orders, regiments, its share), or a tenant-in-chief's (a duke; a marquis or count with no duke over him), whose first host he leads by right or gives to a General he names. Commands are a reading of the houses; the one field written is `d.own`. Old saves deal the hosts once by `GD.NOBLE_RUNGS`' full strength (largest remainder, ids, no dice). A contingent is kept in one army.
  - The king commands an army of two hosts or more in person (his temper moves it), by a commission (`army:<id>`, for that war), or through a council of war (a day slower, no one temper), chosen through `A.WHY` from his skill, trust, kin, fear of a famous man, the great lords' pride.
  - The summons: six answers (full, part, late, deputy, coin, refusal), each from named reasons (opinion of the crown, its fear and right, feelings, a faction, the enemy or a hostile neighbour at his border, the harvest, his purse, his oath by his honour, what the others did). The muster keeps the excuse given and the true reason. First season at the lord's cost; then the crown pays or he weighs going home each season.
  - A refusal is a grievance; the king's sentence (accept, fine, hostages, strip, forsworn, attaint) reaches only as far as his strength, and an unenforced one costs stability; the lord submits, sulks or seeks a league. A march lord rises for his border unsummoned. `w.kind` on every war; private, army and border disputes have hooks and are W1-6's.
  - The player lord gets the six answers as a card (riding with his men puts him in the war); a General in a great lord's host answers to that lord; the muster's news and the War tab's roll are cut to what his place lets him know.
- **Where the design is going (D-064, `docs/design/war.md` part two; not built yet, so the lines above still describe the code):**
  - No levies (W1-4, built: `src/war/9999952-men`, D-086 to D-090): sworn men (about 1 in 400, `A.MEN.of`), enlisted
    regiments and the roll (`r.roll`, 1 in 100, volunteers), conscripts only by a call (`A.CALLS`): a named need (the
    enemy on home soil, a siege, a host lost, fewer spears, the king's will under a harsh law), a decision through
    `A.WHY`, three calls by lot (1 hearth in 20, 10, 5: 3, 6 and 12 in 100 working men), raised by each lord in his lands,
    a cost in the fields (doubled at the reaping) and a remembered grievance. A company's ledger of holds and pulls works
    out desertion without dice (conscripts most, sworn men least, each with its reasons); a mutiny needs a grievance, a
    voice and an occasion.
  - (W1-2 built the minds, section 9a below.) A war ends only by surrender or defeat (W1-5).
  - You see from where you stand; everything else is a report with a sender, a road, a day and a slant.
  - Stability is the sum of named pressures; a faction needs a shared grievance, a tie and a leader; a coup needs a motive, access and an opening.

## 9a. Minds: one way of deciding (built, W1-2, D-069)
- **Every decider decides the same way** (`A.WHY.decide(who, kind, options, ctx)`, engine `src/people/engine/why.js`): options, each with **reasons** `{ kind, weight, source }`. Weights are log-odds (+1 = e times likelier); the source names the record that made the reason (an insult of a year, a relation, a count of spears, a debt). Never a bare `A.chance(p)` for a structural choice: `tools/lint-reasons.mjs` counts them and its baseline may only fall.
- **The temper bends kinds of reason**, not the outcome: pride doubles an insult, caution raises the count of spears, greed coin, honour a duty or a pact, warmth kin, zeal faith, ambition wants and claims.
- **Feelings are states with a cause and a heat** (wounded pride, anger, grief, fear, greed, shame, loyalty, zeal; at most four a person), lit by real events (an envoy shamed, a raid, a defeat), cooling monthly (slowly in a vengeful man). They add reasons to the options that feed on them, and **heat discounts a hot-headed man's reckoning** (up to 85%); a cold man's never. So the proud king insulted before his court declares the war his Generals said he would lose; the cold one waits, keeps the wrong, and strikes when the count turns.
- **The best option wins.** A seeded draw chooses only among options within a band of the best, weighted by e^score: chance among reasons, never instead of them. A clear choice draws nothing.
- **Every decision leaves a record**: the three heaviest reasons for, the two heaviest against, the rejected options, drawn or not, true to form or against his nature. Keep the log bounded (per kind). Tell the player in words, and only what his place lets him know (a council's count is for its king and councillors).
- **Calibrate against the old pace.** When dice become a decision, put the old odds' factors in as reasons (their logs) and set the weight of "do nothing" so the world's counts hold (W1-2 kept wars per 40 years within the seeds' spread); feelings are the new thing.

## Checklist before shipping a system
- [ ] Does every number come with words or a real unit?
- [ ] Does it change with age, and is it different per race?
- [ ] Can a careless favourite lose, and can a determined underdog win?
- [ ] Do the labels contradict each other anywhere (relation, status, rank phrases)?
- [ ] Is there one source of truth (title holders, heirs)?
- [ ] Does every structural choice go through `A.WHY.decide` with sourced reasons, and leave a bounded record?
- [ ] Is there a test with calibration targets that fails the build if the numbers drift?