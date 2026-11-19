# 9999957-ladder: careers (D11-3)

**Aspect:** War, stage D11-3 of `docs/design/war.md` §16 (§14.1; CRITIQUE W11, R12 and item 19's list; the owner's
order 54: "a fine swordsman with no voice stays a fine swordsman", and the world is not built around the player).
**Kind:** system: three readable core files and data in `data/military/branches.json`, with small calls in the
release (`02-game-data-a.js`, `09-missions-and-line-battles.js`), 99999-v2-renown, 9999955-muster, 9999956-units and
9997-companies. **Design:** D-122 to D-127. Decisions go through `A.WHY.decide` (rule 18).

## What it does

- **Each branch's ladder** (`ladder` in the branches' data): what each of the five ranks does in it ("calls the volley
  for a section", "leads a company that holds a ford or a pass"). The rank and unit words stay the glossary's (R14).
  The War tab's place card says what you do now and, on a tap, the whole ladder.
- **A promotion weighs the post** (`A.LADDER.mod`): the board's hazard (99999-v2-renown's `RN.milRoll`) is scaled by the
  branch's key skill (`key`: riding for the lances, tracking for the scouts, stewardship for the train) and, from
  sergeant up, by command; each a factor between 0.6 and 1.5. The place card says in words what the next board weighs.
- **Peace service counts** (R12, `A.LADDER.service`, `A.LADDER.dutyDone`): a duty seen through (9999956-units) is a deed
  of service the board reads (half of what the next rank asks when done well, a quarter when done); each duty done at a
  rank adds to the hazard (×1.12, up to four); long, clean service at one rank (3, 4, 5, 6, 8 years by rank) is a floor
  (×1.6). A promotion's log says what the board weighed besides the deed.
- **A branch's own missions** (`mtypes`, `A.LADDER.mission`): the commander chooses a mission's kind through A.WHY (kind
  `mission`): the branch's own work first, then what the war asks (a siege, the enemy on our soil, an attack); other work
  comes now and then (the band of the draw). A mission of the branch's own work is titled with it ("Count the enemy
  near Camia"). The draw is keyed by the soldier and the day.
- **A role's line** (`line` in the roles' data): after two years in a role and grown skill, the captain may raise its
  holder (kind `role`; against: the battalion's own holder of the post above, a seed man by hash): clerk to
  quartermaster to master of the train; pay rises with the rung; a quartermaster keeps the post as a captain, a master
  of the train as a commander.
- **Pay rebased** (W11, `GD.MIL[].pay`): a soldier 100 a year (a farmhand 60, a yeoman 220), a sergeant 140 and 180, a
  captain 400 and 800, a commander 2,000, a General 5,000 and 9,000 (the officers' pay restored toward the release's by
  D-144). Wealth in arms is also loot and ransom.
- **The world's companies, not only the player's** (D-126, `c-world.core.js`): every company's seed role-holders (one in
  three companies for each role) and every battalion's own drill work in aggregate: morale at rest, the wounded kept, a
  foraging party's bread and the land's anger, a day's bread (Quartermasters, clerks), holds on the desertion ledger, an
  attack over a river (Sappers, carpenters), a battalion's drill in morale and the line battle. A bitmask a company,
  worked out from ids and kept beside the record (a WeakMap, never saved). `A.LADDER.T.npc = false` turns it off.

## State (all optional; old saves load)

`pc.mil.svc` (`{ r, n }`: duties done at a rank), `pc.mil.duty.q` and `.done`, `pc.mil.role.lv`. Nothing for the
world's companies.

## Measured by

`test.mjs`: `lcData`, `lcMissions` (CRITIQUE's "half the war cards are the branch's own": every branch entered at a
muster, as a soldier and a captain at war, 30 missions each), `lcBoard`, `lcPeaceService` (two years at peace),
`lcRoleLine`, `lcPay`, `lcWorldRoles` (a third of the world's companies hold each role; a battalion with surgeon's mates
keeps more wounded; the world's part off restores D11-2), `lcView`, `lcOldSaves`, `lcDeterministic`.
