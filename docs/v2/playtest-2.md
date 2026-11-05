# v2 playtest 2 (Nov 5)

**Build:** `v2-integration` at b36018a (playtest 1's fixes and the content round).

**How it was played:** a playtester agent drove the real UI with Playwright, pressing only Next month (plus Next day and Next week on campaign), with reduced motion on. Its notes, card logs and 950 screenshots were in `/tmp/ardan/playtest2/`, which a container restart deletes.

| | Life | Width |
|---|---|---|
| L1 | A human free peasant, 28 years: a copyist, one battle as a levy | 420 px |
| L2 | An orc of a craftsman family, 26 years: levied at 17, commander by 25 | 1366 px (420 px copies) |
| L3 | A human noble enlisted at 16. Three tries died at 18–20; the fourth lived 26 years, Squad Captain to Commander | 1366 px (420 px copies) |

There were no page errors in about 1,300 steps, and no soft-locks.

## Playtest 1's findings, re-played

| # | Finding | Now |
|---|---|---|
| 1 | Queue head freezes the clock | fixed |
| 2 | Stepper dead after a v2 battle | fixed |
| 3 | Tap on a check opens the tooltip | fixed |
| 4 | Exact troop numbers by rank | partly: the levy prompt and battle are exact ("6,541 against 29,646", "Dead so far: 87 of yours"), and a general sees "Varenna 5,079 / 6,335 (morale 59)" |
| 5 | Outsiders see foreign wars | partly: the map and Wars view are fixed; World › Annals and The Book are not (new 3, 4) |
| 6 | "At peace" during a war | fixed |
| 7 | 0–100 numbers | partly: needs, Path (performance, command, morale), the duel, other people's bodies, renown, opinion, "Master fighter (107)" and diplomacy's "MOST FEARED Aldmark 21" remain |
| 8 | Fighting worth too high | fixed (orders 18.8–23.6 levies a member) |
| 9 | Memory insert on half the cards | partly: 18% personal plus 12% chronicle, so 32% carry an extra line; the old "In 1118 you tried…" style remains |
| 10 | Filler cards | partly: counsel that doesn't fit the scene; soldier filler repeats ("Orders: hold and wait" ×7) |
| 11 | Class-inappropriate text | partly: a betrothal to "a man twice your age" for a boy, "Plot for the throne" for a copyist, a lance for an orc crossbowman, a captain called "your master" |
| 12 | Odds against the wrong opponent | partly: captains are fixed; children ("against one Brawler") and tournaments are not |
| 13 | Infants on adult scales | not fixed ("lifts 8 kg … far below a grown man" at 1, "Witless, worse than all but 1 in 400" at 6) |
| 14 | House-law panel | fixed (minor: "Marchioness · Lord of Yewmarch") |
| 15 | Relation labels | partly: friend listed under Acquaintances; "your superior" and "Former superior" at once; messmates "UNDER YOU"; one captain both "YOUR CAPTAIN" and "YOUR MASTER" |
| 16 | Piety for the faithless; chapters | partly: "▲ more piety" on 17 and 45 cards for the non-devout; the chapter frame remains |
| 17 | Contradicting labels | not fixed ("lifts 92 kg — about a grown man; below most grown men", "Elite · about one and a half levies", "Kettil rushs") |
| 18 | Descriptions behind clicks | partly: "Read more" on "An ordinary person"; "• changes regard" names nobody, "• changes coin" gives no direction |
| 19 | No-effect choices | partly: "The last night" has one choice; "The hearth mark" and "What you want" show only "It will be remembered" |
| 20 | Garbled de-percented text | partly ("about a quarter more faster", "+2.3. all of it from doing") |
| 21 | Map labels, Amber Isles | partly: labels readable; the compass covers the Amber Isles label and there are no islands |
| 22 | Diplomacy views | mostly: exact sums remain ("881,788 suns to the Horde") |
| 23 | Campaign top bar overflow | fixed |
| 24 | Pronouns | not fixed ("Hilda … his rent", "Nazga … She … him") |
| 25 | Vacant titles pile up | fixed |

## New findings, most important first

| # | Finding | Complaint | Owner |
|---|---|---|---|
| 1 | "Join the plot … Nothing lost if it fails" failed, and the character was hanged at 20. The chip misses the queued event. | 1, 16 | 99999-v2-content |
| 2 | "If it fails: a wound, hurt" killed at 18 after a lost fight; the card never says it can kill. | 1, 16 | 99999-v2-content, 99993-v2-stats |
| 3 | World › Annals shows every war's true record to anyone. | 10 | 57-world-chronicle via 99997-v2-war |
| 4 | The Book and a belief card give exact foreign battles to a commoner. | 10 | 57 c-view, 64-npc-beliefs via 99997 |
| 5 | Exact counts for the levy and the general; "Drill: the charge 60". | 10 | 72-two-scales, 9997-companies via 99997 |
| 6 | You choose to fight and the battle is skipped (5 of 16 in L2). | 10 | 99997-v2-war |
| 7 | The duel is all numbers, its odds ignore wounds, the card's weapon differs from the duel's. | 11, 16 | 48-fight-ladder, 99993-v2-stats |
| 8 | The strength scale is off: lifts 92 kg at 10, 250 kg for an untrained 17-year-old. | 11, 12 | 99990-v2 body, 99993 |
| 9 | Orc full siblings each belong to a different clan. | 5, 14 | 99994-v2-family |
| 10 | An event invents an uncle who is the player's grandfather. | 5, 14 | 50-arcs-kin via 99994 |
| 11 | Other people's bodies and command shown as 0–100; a watch captain with "No real skills yet". | 11 | 99993-v2-stats |
| 12 | Counsel under the wrong label (a parent's line from "YOUR CAPTAIN"). | 5 | 9999-advisors, 99999-v2-content |
| 13 | Memory and chronicle lines garbled or from the wrong side. | 1 | 99999-v2-content, 55, 57 |
| 14 | Labels cut off ("middlin", "HOOFBREAKE / R", "☀ ..."). | 2 | 99993-v2-stats, 99992-v2-time |
| 15 | The War place opens You › Path. | 2 | 99992-v2-time |
| 16 | Rank words contradict ("Squad Captain", then "You are a sergeant now"). | — | 99997-v2-war |
| 17 | The battle report contradicts its own numbers. | 10 | 99997-v2-war |
| 18 | Death screen text doesn't fit ("The Old Soldier" at 18). | — | 99999-v2-content |
| 19 | Grammar from token fills ("Keep the a slingshot", "of the The Greyfeathers", "A friend of pyt"). | — | 99999-v2-content |
| 20 | The full map at 420 px fills only the top third of the screen. | 4 | 99991-v2-map |

## Verdict by complaint

| Complaint | Verdict |
|---|---|
| 3, 8 | met |
| 13 | mostly met |
| 2, 4, 9, 14, 15 | mostly |
| 1, 5, 7, 10, 11, 12, 16 | partly |
| 6 | not judged |
