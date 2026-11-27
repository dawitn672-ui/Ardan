# 9999978-standing: the standing military

**Aspect:** the owner's order 95 ("knights are considered powerful and are much smaller units, top 50-3000 within a
kingdom, whilst an elite is usually top ten in a kingdom. a regular soldier numbers in the 10s-100 thousands based on the
kingdom"), with order 13 (feudal armies: nobles hold troops by rank, the crown has royal knights, elite orders) and order
93's level anchors (soldiers 80-180, knights 230-299 and past 300, a kingdom's elite 300-420). **Kind:** system, two
readable core files, `data/military/standing.json`, small guarded calls in the release source, 56-court-and-treasury,
9999970-powers and 99998-v2-saves. **Decision:** D-194.

## What it does

**A realm's regulars by its size, wealth and kind** (`A.MIL.normal`): its people x its kind's rate (an empire 2.5 in 100,
a kingdom 1.8, a church or a merchant city about 1.2, a horde, the tents, a dwarven hold or a pirate port 3), never under
10,000 for a realm of 300,000 people or more, never more than its purse keeps (its income x the kind's pay share / the
release's upkeep of 3.2 suns a man), at most 400,000. At the world's birth the war map's regiments are raised to it
(`A.MIL.seedArmy`, in the release's realm maker), so the release's divisions carry the men; no soldier is an object.

| Kind | At the start (seed independent) |
| --- | --- |
| The great empires and kingdoms | Zanara about 275,000, Varenna 216,000, Aldmark 183,000 (its purse holds it) |
| Kingdoms | 47,000 (Morhaven) to 126,000 (Ranpur) |
| Small kingdoms and cities | 10,000 to 27,000 (Lucerna, Northreach, Kesh, Ostra, Ambrel) |
| Tents and hordes | 21,000 to 42,000 |
| Elves and dwarves | 3,000 (Irondeep) to 12,500 (Sylvaran) |
| A church, a pirate port | about 4,000 and 5,400 (their purses hold them) |
| Giants | 190 and 290, each worth a company |

**The crown's yearly choice** (`A.MIL.want`, one `A.WHY.decide` a year, kind `standing`): raise toward the normal host
(fewer spears than a realm of its size should keep, a war, a rival's larger host across the border, a full treasury),
keep what it has (paid for; a thin treasury; an unquiet realm), or cut regiments (more men than its size and purse bear,
a treasury that cannot pay them). The choice sets the host the release's recruiting fills (`A.forcesAI`, four regiments
a year from the roll at most); an old save's realms grow toward their new hosts that way, year by year. The court's
sellswords (`RI.fitHost`, `RI.hireMercs`) measure against the same normal host. A rebel host keeps the release's rule.

**Knights** (`A.MIL.knights`, `A.MIL.knightsBy`): people / a kind's people-per-knight (about 4,000 for a kingdom) x the
square root of its wealth a head, between 50 and 3,000 (a giant hold 10 to 200), and never fewer than its orders'
brethren and fifty more. Dealt by order 13: the elite orders their members, the crown its royal knights (a share by
kind: 0.3 in a kingdom, 0.5 in a church), the houses by rung (a duke 60, a marquis 35, a count 15, a viscount 6, a baron
3, a banneret 1.5, a knight 1), largest remainder first. Each house's knights ride with the command they belong to (its
own as a tenant-in-chief, its liege's when he is one, else the crown's: 9999951-commands). The reading by command is
kept on the realm at the year's turn, the world's birth and a save's load (`r.kn`), so a battle reads it alike whether a
page is drawn or not.

**Levels** (`A.MIL.levels`, A.POWER's ladder): each band of order 93 by the realm's quality (a base, its troops' quality,
its drill, its wealth a head, its people): soldiers 108 to 173, knights 249 to 294, the elite's best 334 to 412 at the
start. A giant hold's warriors stand in their own bands (420 to 600: a grown giant is worth 12 to 30 conscripts).

**The elite** (`A.MIL.elite`): no set number (the owner's correction to order 97: "an empire can have 30. It can also
have 2. Also 72, despite how incredibly unlikely it is"). The count emerges from how hard the elite's level is to reach in
the realm: `A.MIL.eliteMean` (its people^0.85, its make, its people's bodies and years, its great houses, its wealth a
head, its schools of war, its knightly orders, its veterans), each part a named reason, and `A.MIL.eliteCount`, a seeded
draw around it with a heavy tail and no cap (a Poisson count of the mean times a gamma weight; its own stream from the
world's seed, the realm and the decade). Pooled over 2,000 seeds: Aldmark expects 18 (p5 5, p50 16, p95 37, the most
91), Zanara 29 (the most 133), Northreach 1, Lucerna 0.7. The realm's own people who stand at
the elite's level (an order's Grand Master, a General, the player himself), count first, then champions the realm knows by name,
kept as seeds (a name from the realm's culture by hash, a level spread down from the realm's best, a role: the king's
champion, a captain of the household knights, a hedge knight of great name). No person is made and nothing is stored.

**In battle** (`A.MIL.divFactor`, read by the release's `A.divCombat`): a division's knights are its command's knights
shared over the command's divisions by men, the lances and the guard taking three times a line's share. Its blows and
its break count its men at their worth by A.POWER's host rule, (men - knights + knights x a knight's worth over a
soldier's)^1.35 over men^1.35, its defence the square root of that, at most x1.6: a crown's line division of 7,300 with 40
knights strikes about 1% harder, its lances more. An order's brethren and conscript foot take no share (an order carries
its own above). A host that rides against a legend counts its knights at their worth (`PW.hostOf`).

**What the player reads** (`b-view.core.js`): the realm card's line, "Might: about 216,000 soldiers, some 3,000
knights", as well as he may know it (A.V2DIP.seen: the realm's own ruler round figures, its nobles and other rulers
"about", anyone else "said to keep some 200,000 soldiers and a few thousand knights"; order 97: soldiers, never "men under arms"), and *its best*, a
click-to-open note (44 points): its soldiers by kind (infantry, archers, cavalry: `A.MIL.split`), where its soldiers and knights stand, then its best by name, what each is, his level
and its band's words (by hearsay only the best three). No percentages; no war screen.

## Edits outside this folder (guarded, commented)

- `src/core/release/core/03-engine-base.js` (`A.initWorld`'s realms): `army` from `A.MIL.seedArmy(L)`.
- `src/core/release/core/10-companies-and-war-staff-b.js`: `A.forcesAI`'s host from `A.MIL.want(r)`; `A.forcesYear`
  keeps the year's reading (`A.MIL.year`).
- `src/core/release/core/10-companies-and-war-staff-a.js` `A.divCombat`: the knights' factor (`c.kf`).
- `src/core/release/core/23-ui-a.js` `UI.realmCard`: the might line.
- `src/nobility/56-court-and-treasury/treasury.core.js` `normalHost`: `A.MIL.normal`.
- `src/world/9999970-powers/b-wilds.core.js` `PW.hostOf`: the knights at their worth.
- `src/core/99998-v2-saves/saves.core.js`: save version 23 (the step `standing` is pushed from here).
- What the larger hosts showed elsewhere: `src/core/release/core/11-armies-divisions-and-council-a.js` `A.wsDay` keeps
  each realm's contingents whole every week (`A.CMD.keepWhole`), not only after a muster; `9999951-commands`'s audit
  leaves a division in a fight where it is, as `keepWhole` does; `9999955-muster` reads the bulk of a command's host as a
  reason (`MU.mix`: a realm raised whole often lacks nothing) and says "the muster takes every able man" where nothing
  else speaks for a branch (the same weight on every branch: it moves no choice).

## State (optional; old saves load)

`r.kn = { y, t, o, c, h: { houseId: n } }` (the year, the knights, the orders' brethren, the crown's, each
tenant-in-chief's), written by `A.MIL.year`; a reader without it computes the same reading on the spot. The crown's
choices that move its host go into `A.S.why` (kind `standing`, W1-2's caps).

## Measured by

`test.mjs`: `msSizes` (three worlds: regulars of 10,000 and more for every realm of 300,000 people its purse can pay,
the greatest host 150,000 to 400,000, every host within a division of its normal one, knights within their kind's
bounds and dealt whole, the bands of order 93, the elite in the elite's band, each named, the realm's own first), `msEliteEmerges` (2,000 seeds:
a wide spread with no cap, three or fewer and forty or more both seen for an empire; the make, veterans and wealth move
the mean, and the draw follows; reasons named; deterministic), `msBattle` (factors
1 to 1.6, none for an order or a call, the lances above the line, `divCombat` carries it, the host rule's exponent 1.35),
`msDecides` (under its host and rich it raises, over it and poor it cuts, with a record), `msWords` (round figures,
about, said to keep; no percentage; the card's line and a 44-point note at 375 px), `msOldSaves` (every sample save loads
at version 23 with the reading, and the year's turn keeps it), `msDeterministic`.

## Left for later

Knights do not die as a count of their own (a division's losses fall on its men; the reading is renewed each year); the
elite are not yet met on a card or a duel; the 58-realm map will bring its own kinds (each needs only a row of the data).
