# Careers after the top

**Aspect:** Events and story, Balance (cycle 1 review `docs/reviews/cycle-1/lives.md`, findings B1, I1, B7, I10) · **Kind:** system (one core file), four patches, six events, tests

## Why

Bot lives on the Great Continent showed careers that topped out by 30 and then went nowhere for 40 years, and one gamble with no cost:

- A peasant enlisted at 18 led 12,800 men at 29 and held that rank to 73. No title, land, order or council seat came after it. With fame 100 and 273,000 suns, `pc.noble.rung` stayed -1 in every life.
- A General of 44 tried a coup, lost the civil war it started ("the crown of Aldmark crushes the claimant"), and the next month read "You now answer to Audra of Brookcliff, High General". He served the crown he had tried to overthrow for 39 more years. He held the "Usurper" achievement from the day of the attempt.
- His bandit hunt logged "Enemy dead: 5,141. Your losses: 0", because a mission's size was the men his rank leads.

## What it does

- **A failed claim costs something** (`careers.core.js` wraps `A.endWar`).
  - When the war for the throne ends with the claimant crushed and the claimant is you, you lose what the coup was made from: the commission, the council seat, the titles, a court post and an order. Your honour falls and the crown's regard drops by 60.
  - Then a scene, *The claim is lost* (`cr_coup_fate`), offers three ways out:
    - ride for the border (a check; you live in exile with a price on your head, and a bounty hunter finds you one to three years on, `cr_coup_bounty`);
    - plead for your life (a check; the crown takes 60% of your fortune and gives you three to six years in a cell);
    - die holding the last keep.
    A check that fails is a trial for treason (`punish: 'treason'`: the scaffold or a deep cell).
  - A claim settled by a bargain ("the claimant kneels") comes with terms (`cr_coup_pardon`): kneel, give up every post and 40% of your fortune and live watched; or refuse and go abroad.
  - "Usurper" is awarded when the claimant actually wins the throne (patch `CAR-USURPER`), not for the attempt.
- **Raised for merit.**
  - Once a year, a commoner who has made a name may be knighted by the crown (`cr_knighted`). That means a captain's rank (5) and renown 30, or renown 55 on any path. You can kneel (rung 2, Knight, 300 suns a year, gentry, the crown's regard) or decline (renown, and a cooler crown).
  - A knighthood is what the Iron Wolf's lore asks of a commoner ("Gentle birth or a knighthood"), so a knighted soldier can now be asked to the order.
  - A knight of 33 or more, with renown 55 and a high command, a council seat or renown 65, is then offered a fief (`cr_fief`, rung 4, Baron). You can take it with its levies, ask for a pension instead (a check), or decline.
- **Something above the top.**
  - At the top of a ladder (General or above, or the last rank of a trade), an honour comes every seven years or so (`cr_honour`): the wardenship of the march, the guild's chain, a see. Each can be accepted, bargained for or declined.
  - `A.seatEligible` lets a General of renown 35 and command 50 be named Marshal. The release asked rank 8 (High General, one a realm), so no General ever sat on the council. A merchant prince with 50,000 suns can be named Treasurer.
- **A Legend.** A fighter past the Legend line (worth 118, 48's t6) is named one while the world has room (`GD.LEGEND_CAP`): renown +15, a deed, and the challengers start coming (`cr_legend`: fight one in the yard, take him as a pupil, or send them all away). A life reached Knife fighting 100 and stayed at renown 24 before.
- **Promotion is slower above Senior Captain.** Merit bars are ×1.5 for ranks 5 and 6 and ×2 from General up, so General is 2,000 merit (1,000 before).
- **Numbers that fit.** A bandit hunt is 20 to 300 men, and a mission away from any war is at most 400 (`A.missionSize`, patch `CAR-MISSION-SIZE`). A mission in a war keeps the rank's numbers.
- **A quieter log.**
  - Levies called out log one line per realm a month (`A.levyLog`, patch `CAR-LEVY-LOG`), not one per division.
  - "The X is held without you" is logged only for gatherings that had a place for you (patch `CAR-HELD-WITHOUT`).

Other folders carry the rest of the late-game work: 97-life-fixes (ambitions after the top, What now, great works scaled to the fortune, gathering caps), 32-ladder (order entry by merit), 56-realm-inside (`ri_taken` and the council's pushes) and 81-pacing (the first-year ceiling).

## Measured by (`test.mjs`)

- `carCoupCrushed`: a General claimant whose war ends "crushes the claimant" loses his commission, gets the fate scene (three ways, two checks) and no "Usurper". `plot_throne` no longer awards it for a half-success. A bargain brings the terms.
- `carNotTakenByOwnCause`: 200 lost battles against the player's own faction never take him captive (before: about one in seven).
- `carRaised`: a peasant captain of renown 40 is asked, knighted (rung 2) and then passes the Iron Wolf's birth line. A fief follows, a General of renown qualifies for Marshal, and General's merit bar is 2,000.
- `carMissionSize`: a General's bandit hunt is 300 men (12,800 before).

## Limits

- Known World games change too: the merit bars, the coup's fate, knighting and the mission size apply in both worlds.
- The eight orders in `GD.ORDERS` are all Known World orders. A Far Lands soldier has no order to join, knighted or not. That gap is in the content, not the rules.
- The bot never opens the council or Decisions, so knighting and fiefs show in bot lives only through the scenes this feature queues.
