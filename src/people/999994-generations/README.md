# Generations: the unknown die, the houses go on

**Aspect:** the world's people, owner's rule 1 (nothing without reason), rule 21 (no data that grows forever) ·
**Kind:** engine, no interface but a line in the story · **Decisions:** D-107, D-108 · **History:** H-090

**What was wrong** (X5 found it, D-106). An NPC died of his years only if he ruled a realm (`A.worldYear`), the player
knew him (`A.familyYear`) or he held a title (`A.V2N.yearOfDeaths`). Everyone else aged for ever: at year 100 of seed
7, 1,023 of 1,669 living people were past their people's greatest age, the oldest human 185, and the people grew
without end. And no one but the player's own family married or had children: ten of 983 people were married at the
start.

**`a-deaths.core.js`, the unknown die.** Each New Year (`A.onYear`, after the release's and the court's passes) every
living NPC those passes do not weigh meets the release's own odds for his body (`A.deathChance`: age against his
people's span, health, a blood that shortens life), raised by the year just past where the game knows it: an epidemic
in his home province (`MORT.PLAGUE` 1.8), a failed harvest in his realm (`MORT.FAMINE`: 1.4 for the poor, 1.2 the middle,
1.05 the great; read from the realm's market, a yield of 0.4 or less, as 57's record reads a famine, never from the record
itself, which only observes: M1). Anyone but the player who has passed his people's greatest age (`GD.RACES[race].maxLife`) dies of it,
covered or not; the lore's elders of 1105 (Queen Ithrien at 587, an elf's span 520) keep the release's odds and the
body's end ten years on. The death goes through `A.kill`: posts are left (`A.POSTS.leaveAll`), a widow is a widow, a
ruler's realm passes, titles and the headship pass by the house's law (`A.V2F.inherit`), the tree keeps the dead. A blood
relative within two steps whom the player never met is told as a line of the story ("Word comes that your grandmother
... has died"); a death in the household is caught by 999995-next-year's digest ("A death in the household") and stops
nothing (a custom of mourning may still ask about the estate, as it does on any parent's death).

**`b-houses.core.js`, the houses go on.** The heir of a line (the eldest living son of his father, by the father's id;
a man with no father on record is the first of his line) takes a wife at `WED` 0.2 a year, a younger son at a twentieth
of that (the church, the army and the road took most younger sons): a free woman of his realm, estate (within one step)
and people, of an age with him, of no blood within three steps by the tree; or, when the realm has none, a wife from
outside (as `A.familyYear` marries the player's children). A married couple who can have children (`A.fertilePair`)
has one at odds that fall with the children it has living (`WANT` 0.26, 0.20, 0.09, 0.03, 0.01; times `A.pairFert`): a
house wants an heir and a spare. The child is `A.birth`'s (house, name, blood, the mother's risk). The player's own family
keeps `A.familyYear`.

**Seeding.** Every draw comes from a stream seeded by the year and the person (`A.V2F.rng`, as `V2N.yearOfDeaths`), and
every death, marriage and birth runs in `A.V2F.sandbox`: the game's stream does not move and the order of the people
does not matter. `A.MORT.OFF` and `A.HOUSES_GO_ON.OFF` turn them off.

**Measured** (`tools/bench/state-size.mjs`, seed 7 noble; living people, packed state KB): before, 983 / 1,839 at year 0,
1,219 / 4,046 at 50, 1,766 / 4,781 at 100, 1,930 at 134 (still rising, a third past their span); after, 983 / 1,839,
1,639 / 4,826 at 50, 1,687 / 5,281 at 100, none past his span, the oldest human 83 (an earlier cut of the same rules to
200 years: 1,796 at 150, 1,825 at 200: the living hold; what grows is the world record and the journal). Seeds 11 and 31 at
year 100: 1,452 and 1,740 living. The passes cost 4 to 20 ms a New Year at year 100. Fixes found on the shifted world, in
other features: every house the dead headed passes (99994-v2-family), a child taken in has parents (04-fm), a lore
style beside the seat is retired (999990-posts); a house met late makes its lore members past their span already dead
(the release's `A.famMembers`). See H-090.

**Tests** (`test.mjs`): `genGenerations` (60 years: deaths, marriages, births; no one past his span; one holder per post
and title; the living within bounds), `genPure` (the game's stream untouched; the same twice), `genHouseholdDeath` (a
parent past his span dies at the turn, the digest says so, the pass queues nothing `A.kill` would not; an unmet
grandparent told).
