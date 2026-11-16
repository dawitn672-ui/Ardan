# 9999905-five-ranks: no Marshal, five ranks (W1-1)

**Aspect:** War, stage W1-1 of `docs/design/war.md` §16 (the owner's order 54, answer 10: "remove the Marshal now;
General is the highest rank, several Generals by army size"). **Kind:** one core file (`hosts.core.js`, a pure reading),
with the change itself made in the release source, `src/nobility/999990-posts` and the features that named the seat.
**Design:** `docs/DECISIONS.md` D-064 points 1 to 3, D-066 (the war map's division is a host).

## What it does

**Five ranks** on every screen: soldier, sergeant, captain, commander, General. `GD.MIL` keeps its eight grades as
steps of pay and merit, so every rank comparison in the code still holds; a grade's word is its rank, and the second
grade of a rank says "(second step)" where a ladder or a promotion is shown (`A.rankLabel`). There is no High General
and no Marshal: General is the highest rank. The old words map by the post held:

| Old grade (index) | Post held | Rank now | Unit |
| --- | --- | --- | --- |
| File-Leader (1), Sergeant (2) | a file, a section | Sergeant (first, second step) | section, about 12 |
| Squad Captain (3), Captain (4) | half a company, a company | Captain (first, second step) | company, about 200 |
| Senior Captain (5) | a battalion (about 800) | Commander | wing, 600 to 3,000 |
| Commander (6) | a division (up to 7,470) | General | host, 3,000 to 12,000 |
| General (7) | an army | General (second step); the army by the king's commission | army: one host or several |
| High General (8), Marshal (9) | gone | General (7) in an old save | |

**One General to each host** (`A.HOSTS`). A division of the war map of 3,000 men or more is a host, and its leader a
General; under 3,000 it is a column under a Commander. So a realm's Generals follow what it fields. A host's General is
a person when one holds it (the division's post), else the army's general when the army is that one host, else a name
the host gives itself (`A.oobLeader`, a pure function of ids, as 9997's seed captains are): no person is made for it.
An army of two hosts or more is led by its commanding General, **by the king's written word for that war**: the post
`army:<id>`, which ends when the army is stood down (a commission, not a rank). With nobody named it is a council of war
(`A.HOSTS.army(a).as`). W1-3 builds the commission's reasons and the council of war's cost (§9.1, §9.3).

**The senior General** is the General of the crown's first host (`A.POSTS.firstHost`: the realm's oldest standing host,
kept while it stands). He sits at the council in the Marshal's old place (`r.council.general`, a mirror of the first
host's post; `seat:<realm>:general` is read as `div:<first host>`, and no seat record is ever written for it), does its
yearly task (9996's `POL.TASKS.general`, 56's stances, the council's drill) and nothing else: he commands no army and
no other General, and a General's superior is the crown. The crown keeps the place filled (`A.POSTS.fillGenerals`, the
month's engine pass: its best General at hand, else a great house's head, else a man raised for it); a player ruler
names his own. The lore's sitting army chiefs (D-049: Aldmark's Leofric Stane and four more) start as their realms'
senior Generals.

**Old saves** (`A.POSTS.migrateMarshal`, `A.POSTS.seatMarshals`, on load before and after the registry is built): the
seat's records and `r.council.marshal` go; grades 8 and 9 fall to 7; each man who sat becomes his realm's senior General
(the General who led that host takes the army the new one leaves, or waits; nobody is aggrieved); a player who was
Marshal is a General holding the first host and the council's place; the old words in stored styles become the five
ranks' (`A.POSTS.oldWords`); the achievement, the advisors' ring and the polity's council task are renamed.

## Measured by

`test.mjs`: `w1NoMarshalLint` (every string of `src/` and `data/` read by acorn: no "Marshal", "High General",
"File-Leader", "Squad Captain" or "Senior Captain"), `w1NoMarshalWorld` (30 years: no seat, grade, style or saved
field of a Marshal; no host over 12,000 or without a General; the senior Generals at council; the one-holder audit;
every tab drawn and read), `w1GeneralsFollowHosts`, `w1SeniorGeneral`, `w1OldSaveMarshal`
(`tests/saves/v2.1.0-alpha.9-marshal.ardan`, made from the last build with the seat). The posts registry's audit holds
"no Marshal's seat" and "the council's General is the first host's" (strict).
