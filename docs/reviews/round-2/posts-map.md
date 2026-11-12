# Who holds which post in Ardan: a map of every store, the Marshal bug, and one registry to replace them

Build read: `index.html` of `v2-integration` at `d906efc` (unpacked; the release engine is line 1 of `ardan-core`,
features follow it). Nothing in `/home/user/Ardan` was edited. Simulations ran in Chromium against that same file
(scripts and raw JSON: `/tmp/claude-0/-home-user-Ardan/76879393-358c-55c2-b023-d0be520d4c7b/scratchpad/sim/`; `q1/`, `q2/`, `q3/` hold each job's `.js` and `.out.json`).

Conventions: "release `A.x`" means a function of the vendored release (minified, `vendor/ardan-b593143.html`,
blob `ardan-core`). Feature code is named by its file under `src/`. Person ids, army ids and division ids are those of
the runs (seed given each time). A "store" is any field that says, or lets the game decide, that someone holds a
post.

---

## 1. What is wrong, in one page

The game has no notion of a *post*. It has at least **fourteen stores** that each say, in their own way, that
someone commands, sits, holds or leads something, and **nothing ties them together**:

| # | Store | Field | Who can hold it twice / with what |
|---|---|---|---|
| 1 | Army grade (player) | `pc.mil.rank` 0-9 (`GD.MIL`: Soldier ... Marshal) | a number, no slot: any number of Marshals |
| 2 | Army grade (others) | `p.milRank` + `p.occ` "<title> of <realm>" | made up per need, never promoted, never cleared |
| 3 | The man above you | `pc.mil.cmdr` / `pc.job.boss` | a person made up for the role, holds no real post |
| 4 | Council seats | `r.council[seat]` (5 seats) + `pc.office` (player only) | one person can sit in two seats; the seat and `pc.office` disagree |
| 5 | Army command | `A.S.armies[].gen`, `.sub` | the general is whoever was last written; a resigned general keeps it |
| 6 | Division command | `r.forces.divs[].cmd` | written by 4 functions, cleared by 2 |
| 7 | Battalions and companies (9997) | `d.bs[i].p[slot]` (0-3 captains, 4 senior captain), `cs` seeds, `p.coAt` | the displaced captain keeps the title; a seed of the same name takes the slot |
| 8 | Player's staff | `pc.staff[slot]`, `pc.staffD` | writes `a.gen` / `d.cmd` behind every other store's back |
| 9 | Elite orders | `r.orders[id]` (Grand Master) + `d.cmd` of the order's division; `pc.order.rank` 0-3 | 7-8 of the 8 Grand Masters also hold a shire office, every year |
| 10 | Polity offices | `r.pol.off[]` (governor, magistrate, reeve, warden, customs) | two per person; no check against any army post |
| 11 | Free company | `pc.company` | dropping a commission is the only rule |
| 12 | Crown, heir, houses, land | `r.ruler`/`p.ruler`, `r.heir`, `h.headPid`, `p.noble`, `A.S.court` | the one area with an audit (`A.V2F.audit`, `v2nOneHolder`) |
| 13 | Jobs | `pc.job = {c, r}` (`GD.CAREERS[c].ranks`: Guild master, Patriarch, Banker, Great Officer...) | a rank, no slot; "A post falls vacant" is always true |
| 14 | Titles as text | `p.occ`, `p.title` (lore), `famOffice` (v2 family), `flags.cr_*` (994 honours) | never reconciled with any store |

And **command is computed from the grade, not from any post**: `A.cmdRole(pc)` (the War Room's permissions),
`A.V2W.rank` / `.leads` / `.unitWord` (99997-v2-war), `A.mainRole` (the title shown) and `A.superior` each read a
different subset of the stores above.

So the owner's report is not one bug but the meeting of four:

1. **Being named Marshal and being promoted Marshal are different things.** The crown can name you Marshal of the
   council (`r.council.marshal`, `pc.office`) by four roads (release `A.nobleAction('office')`, `takeSeat`, the
   ruler's `appoint`, the content event `pa_court_scandal`) without touching your grade; the army board can make you
   Marshal by grade (`pc.mil.rank = 9`, release `promoCheckNow`) without `pc.office`. Only the grade gives command
   (`A.cmdRole`), and only the seat gives the title (`A.mainRole`).
2. **A promotion never takes command from anyone.** `A.wsAttachPC` gives a new General the *second-largest* army
   (`mine...sort(...)[Math.min(mine.length-1,1)]`) and leaves every other `a.gen` alone; the rank-9 promotion writes
   `r.council.marshal = pc.id` and nothing else. The old Marshal keeps his army; a made-up superior titled
   "Marshal of Aldmark" (`A.makeSuperior`, `milRank 9`), made when you reach High General, is never removed.
3. **Leaving a post leaves the post held.** `A.resign`, `A.desert`, `A.imprison`, `A.travelTo`,
   `A.foundCompany`, `A.foundRealm`, the realm-gone exit of `milYearNow` and the content event `av_merc_desert` set
   `pc.mil = null` and nothing else: the company slot (9997), the division (`d.cmd`), the army (`a.gen`) and the
   council seat all stay yours. `A.leaveRolesFor` (the one cleanup) forgets the 9997 slots and `pc.staff`, and
   resigns the commission when you *take* the Marshal's seat.
4. **Nothing checks two posts against each other.** A person can be Marshal and Chancellor, Treasurer and king of
   the thieves, Grand Master and shire governor, division commander and battalion senior captain, all at once.

The owner's exact sequence reproduces in **every seed tried** (sections 2 and 4), and, without forcing anything, in
2 of 5 plain 20-year noble bot lives (section 4.2): seed 101 was named Marshal at 22 as a Squad Captain and served 17
years as "Marshal of Aldmark" leading a company, then a battalion and a division, never an army; seed 303 was named
Marshal at 36 as a Senior Captain still leading a company. The other 3 nobles were named to other seats, lost their
commission to `A.roleCheck`, and stayed captains of their 9997 companies for 9 to 18 years as councillors.

---

## 2. The owner's bug, reproduced

> "The monarch promoted me to marshal, but I kept only my captain's command and never got the larger army. Another
> character held the title of marshal at the same time. When I left my captain's post, I was marshal in name only,
> with no power."

### 2.1 Road 1, the exact sequence: named Marshal at court while a Captain (release `A.nobleAction('office')`)

`A.nobleAction` case `"office"` picks a random seat (`A.pick(Object.keys(A.COUNCIL))`) and on success writes
`r.council[seat] = pc.id; pc.office = seat` and logs "<ruler> names you Marshal!". It does **not** call
`A.leaveRolesFor`, does not look at `pc.mil`, does not tell the old Marshal. `A.roleCheck` then explicitly allows a
commission next to the Marshal's seat (`pc.office !== "marshal"`). `A.roleBlock(pc, 'army')` allows enlisting while
Marshal for the same reason.

Seed 11, noble of Aldmark (POL-01), at war with its strongest neighbour (`A.startWar`), the dice forced only for the
court roll (`scenA.js`):

| Step | `pc.mil.rank` | `pc.office` / `r.council.marshal` | `A.mainRole` | `A.cmdRole` | Posts held (every store) | First Army of Aldmark (R3, 20 divisions, 104,264 men) |
|---|---|---|---|---|---|---|
| Captain | 4 | none / p2n Garrick Harrow | Captain of the 4th Aldmark Line | officer, 0 armies | `co.captain2:DPOL01-4/b8` | `gen` p2n Garrick Harrow |
| "names you Marshal!" | 4 | marshal / **pbu (you)** | **Marshal of Aldmark** | **officer, 0 armies** | seat marshal + the same company | `gen` **p2n Garrick Harrow** (still) |
| two months on | 4 | same | same | same | same | same |
| deserts (`A.resign` refuses below rank 6 in war) | none | marshal / pbu | Marshal of Aldmark | **none** | seat marshal + **`co.captain2:DPOL01-4/b8` still yours** | Garrick Harrow |
| 40 days on | none | same | same | none; `A.V2W.canRoom` **false**, `inWar` false, `side` null | same | same |

So: a "Marshal of Aldmark" who commands 200 men, then none; whose War Room is shut ("You have no place in this
war") in the war his realm is fighting; while the man he replaced still leads the realm's only army. Seeds 23, 37,
41 and 59 give the same table (Garrick Harrow p2m/p2k/p2l keeps R3 in each; the company slot stays the player's
after desertion in each).

The same road exists in content: `pa_court_scandal` ("Tell the crown", 40%) writes
`r.council[seat] = p.id; p.office = seat` for a random seat, again without `leaveRolesFor`.

### 2.2 Road 2: the army board makes you Marshal (release `promoCheckNow`, rank 9)

`scenB.js`, seed 11, forced dice only for the board's roll:

| Step | Posts held | `pc.office` | `A.mainRole` | `A.cmdRole` | Superior (`A.superior`) | Chain of command shown (`UI.chainOfCommand`) |
|---|---|---|---|---|---|---|
| rank 6 Commander | `div.cmd:DPOL01-4` **and** `co.senior:DPOL01-4/b8` | none | Commander of the 4th Aldmark Line | commander, 1 division | none yet | Garrick Harrow "Marshal of the realm" |
| rank 7 General | `army.gen:R3` (taken from Garrick Harrow without a word) | none | General of the First Army | general, R3 | none yet | same |
| rank 8 + `A.obligationsYear` | `army.gen:R3` | none | High General of the First Army | highgeneral | **psh Anwen of Amberwick, occ "Marshal of Aldmark", `milRank` 9** (made up by `A.makeSuperior`) | **two marshals**: "Garrick Harrow · Marshal of the realm", then "Anwen of Amberwick · Marshal" |
| rank 9 by the board | `council.marshal` + `army.gen:R3` | **none** | **"Marshal of the First Army of Aldmark"** | marshal (all armies) | none | Garrick Harrow is gone from the seat silently; Anwen of Amberwick still "Marshal of Aldmark" |
| resigns | **`council.marshal` + `army.gen:R3` still yours** | none | "" | none (yet `A.V2W.side` is POL-01 and the War Room opens, through `a.gen`) | none | - |

Seeds 23, 37, 41 and 59 give the same, with the made-up Marshals Svala of Amberwick (prk), Dunstan Ashbury (ps5),
Halvard of Carrness (psm) and Bryony Whitbourne (psf); seed 88 in Ashmere (POL-05) the same except no superior was made. A peasant (seed 77)
stops at High General: the board's "birth" row (`A.promoCheck`'s `b.find(x=>x.k==="birth")&&A.chance(.6)`) refuses
the seat even with the dice forced.

Because `promoCheckNow` never sets `pc.office`, the board's Marshal gets no council pay or business
(`A.pathMonth` calls `A.councilMonth` only `if (pc.office)`), cannot propose a bill or pick a council task
(9996 `POL.inCouncil` requires `pc.office`), keeps receiving seat offers, and can then hold **two seats**: taking the
Chancellor's seat afterwards (`takeSeat('chancellor')`) resigns the commission but leaves `r.council.marshal` on him
(section 2.5).

### 2.3 Road 3: the council's offer (`A.seatOffers` -> `takeSeat('marshal')`)

994-careers lets a General of renown 35 and command 50 be offered the seat (`A.seatEligible` wrapper). The handler
`A.CHOICE_FN.takeSeat` calls `A.leaveRolesFor(pc, 'army-marshal')`, whose first clause is
`if (newRole !== "army" && pc.mil && !pc.mil.merc)`: "army-marshal" is not "army", so **accepting the Marshal's seat
resigns your commission**. `scenC.js`, seeds 11, 23, 37, 41, 59: before, `army.gen:R3`, `cmdRole` general; after,
posts `council.marshal` + `office.marshal`, `pc.mil` null, `cmdRole` none, R3's general null, then (30 days on)
a house head chosen by `A.wsGeneralFor` (Halvard Alderley psh in seed 11). The offer's own text warns "You would
give up your present post", which for this seat contradicts `A.roleCheck`.

### 2.4 "Another character held the title of marshal"

Five different things in the build are called Marshal, and at most one of them is the seat:

| Source | Field | Seen in runs |
|---|---|---|
| the council seat | `r.council.marshal` | 34 of 35 realms at start |
| the old holder, after the seat moves | keeps `occ` "Marshal of <realm>" (written by 56's `RI.fillCouncil` when his occ was empty or generic, never cleared) and his army (`a.gen`) | e.g. Garrick Harrow keeps R3 in road 1 |
| a made-up superior | `A.makeSuperior`: `milRank` = your rank + 1, `occ` = `GD.MIL[rk].title + " of " + realm` | "Marshal of Aldmark" made for the player at High General in 8 of 9 forced runs |
| an uncle's family office | 99994 `F.OFFICES`: "Marshal of the host" (royal), "Marshal of the levies" (noble) as `famOffice` and `occ` | Cuthbert Harrow (seed 41), Sewald Reedholm (seed 59), "Marshal of the levies" |
| the lore's cast titles | `LORE.cast[..].title`, copied to `p.title` and `p.occ` | at 1105 (seed 11) Zoran Koren, "Lord Marshal" of POL-25, does not hold that realm's seat (Anton Koren does); Aldmark's lore Marshal, Leofric Stane (CHR-0005), is 58 in 1105 and fails 56's `castAgeOk` (`age < old + 8`) by one year, so "Marshal Stane" of the house notes never sits |
| an order's rank name | `GD.ORDERS.iron_wolf.ranks[3]` "Marshal of the Wolves" (player's `pc.order.rank` 3) | - |

### 2.5 Two seats at once (`scenE.js`, seeds 11 and 23)

`takeSeat` calls `A.leaveRolesFor(pc, "council")`, whose seat clause runs only when the new role is *not*
"council" or "army-marshal": taking a seat never gives up the seat you hold. Treasurer then Chancellor:
`r.council.treasurer = pc` **and** `r.council.chancellor = pc`, `pc.office = "chancellor"`, still so a month later.
Marshal by the board, then Chancellor: `r.council.marshal = pc` **and** `r.council.chancellor = pc`, commission
resigned, `mainRole` "Chancellor of Aldmark". The release's ruler `appoint` action (`A.rulerAction` case `appoint`:
`r.council[seat] = pid`) has no check either, nor does `A.councilCandidates`.

---

## 3. Every store, one by one

For each store: what it is, where it is written and read, whether two people can hold it at once, whether its
holder can hold incompatible posts, and what happens on promotion, death, resignation, desertion, retirement and
capture. "Sweep" means a periodic job that notices a dead or absent holder later. One rule of the release colours
every "death" line below: it ages and buries only rulers and the people the player knows (99995 adds yearly deaths
for court lords), so an NPC holder dies only if he rules, is known to the player, holds a court title, or falls in a
fight or a purge; the others never die or retire, and keep a post until something displaces them.

### 3.1 Army grade of the player: `pc.mil`

`pc.mil = { realm, merc, company, troop, rank, merit, years, battles, kills, squad, unit, missions, warsCommanded,
joined, rankSince, div, army, co, cmdr, stance, curWar, contract, ... }`, `rank` 0-9 against `GD.MIL`
(Soldier, File-Leader, Sergeant, Squad Captain, Captain, Senior Captain, Commander, General, High General, Marshal;
`leads` 1 ... 200,000). 994-careers multiplies the merit bars (`CAR.MERIT_X`).

- **Written.** Created by release `enlistNow` (`A.enlist`; nobles start at 3, royals and barons at 4, the family's
  unit can lift it to 4). Raised by release `promoCheckNow` (via `A.promoCheck`; every 3 months from `A.pathMonth`
  with `A._promoBoard`, and yearly from `milYearNow`, `A.missionClose`, `A.battleClose`, `A.campClose`), by
  99999-v2-renown `b-promo.core.js` `A.promoCheck` wrapper ("raised past a rank", below 7), by content events
  `rk_fm_inherit` (`p.mil.rank` up to 6, "the family office") and `rk_vt_recall` (back to the veteran's rank, at
  most 4), and by release `A.makeRuler` (`rank = max(rank, 9)`, unreachable for the player because
  `leaveRolesFor(p,'ruler')` ran first). Temporarily shimmed by 72-one-battle-two-scales `TS.front` / `TS.reckoning`
  (`pc.mil = { realm }`, deleted after). NPCs: 9996 `POL.makeFor` gives a made officer `p.mil = { rank: 4, xp: 0 }`.
- **Cleared** (`pc.mil = null`): release `A.leaveRolesFor` (any new role but "army"), `A.roleCheck` (a free
  company), `A.resign`, `A.desert`, `A.imprison`, `A.travelTo` (another realm), `A.foundCompany`, `A.foundRealm`,
  `milYearNow` (realm gone); 994 `CAR.closeCareer`; content `av_merc_desert`. Only `A.leaveRolesFor` touches any
  other store (it clears `d.cmd` of `pc.mil.div`, `a.gen` unless the new role is "ruler", `a.sub`); none of them
  clears the 9997 slot, `pc.staff`, the council seat or the made-up superior.
- **Read.** The grade is the only input of command: release `A.cmdRole` (War Room rights: rank 9 = every army and
  the templates, 7-8 the armies where `gen`/`sub` is you, 6 your division, 4-5 your company), `A.wsAttachPC`,
  `A.pcDivAttach`, `A.staffSlots`, `A.wsPCFightStart` (which battle you are asked to lead), `A.pcTacFor`,
  `A.mainRole`, `A.superior`, `A.promoBoard`, `A.seatEligible`, `UI.chainOfCommand`, `UI.armyPathCard`;
  99997-v2-war `W.rank` (0-1 soldier, 2-3 sergeant, 4-6 captain, 7+ commander), `W.leads`, `W.unitWord`, `W.side`;
  9997 `CO.place`; 9996 `POL.estateOf` (rank 4+ is the host's estate), `POL.seekable` (warden needs rank 5);
  994 `CAR.knightable`, `CAR.atTop`; `C.soldier` (any `p.mil`), events' `rk(p)`.
- **Two holders?** It is a grade, not a post: nothing limits how many Marshals or Generals a realm has.
- **Incompatible posts?** `A.roleCheck`/`A.roleBlock` forbid grade + job, grade + free company, grade + a council
  seat *other than* Marshal, grade + crown. Everything else is allowed: the Marshal's seat, a shire office (9996,
  even Warden of the March), an order's grade.
- **Promotion.** `rank++` and `A.wsAttachPC()`; at 9 also `r.council.marshal = pc.id` (no `pc.office`, no word to
  the old holder). The 9997 placement follows (rank 4-5 company slot, 6 battalion slot plus `d.cmd`, 7+ no slot).
- **Death.** `A.kill` does nothing with it; each store sweeps on its own (3.3-3.6). **Resignation / desertion /
  prison / leaving the realm.** `pc.mil = null`, `pc.veteran` (resign only), flags and honour (desert); every post
  stays held (2.1, 2.2, 3.4). **Retirement** ("Pass the torch", release decision `pass_torch`): nothing; the old
  player, now an NPC, keeps `pc.mil` and every post. **Capture** (56's `RI.maybeTaken` -> `ri_taken`): a ransom,
  nothing else; the captive keeps his command.

### 3.2 Army grade of everyone else: `p.milRank` and `p.occ`

- **Written.** Release `A.makeSuperior` (your grade + 1, or + 2 from Squad Captain to Senior Captain; up to 9;
  `occ` "<GD.MIL title> of <realm>"), release `A.staffCands` (candidates for your staff: grades 1-8, `occ` the same),
  9997 `CO.person` (4 or 5, `occ` "Captain of the 2nd Company, ..." / "Senior Captain of the ..."), 9997 `CO.promote`
  (5), content `ranker` (0). The release's generals (`A.wsGeneralFor`) get `occ` "a general" and no grade.
- **Read.** `A.mainRole` (after everything else), `A.superiorTitle`, `A.standing`, `A.needsNewSuperior`,
  `A.staffCands`, `A.oobPath`, `A.famMembers`, 59's tooltips.
- **Two holders?** Unlimited, and never reconciled with any post: in every road-2 run a made-up "Marshal of
  Aldmark" (`milRank` 9) stands next to the council's Marshal.
- **Promotion / leaving.** NPC grades never move except 9997's `CO.promote`; nothing ever clears `milRank` or the
  `occ`, so a displaced captain is still "Captain of the 3rd Company" (scenario D: Corbin of Amberwick ps6 and Garth
  of Copperham ps7, section 4.1).

### 3.3 The man above you: `pc.mil.cmdr`, `pc.job.boss`

- **Written.** Release `A.makeSuperior` from `A.obligationsYear` (yearly, when `A.needsNewSuperior`: none, dead, or
  of a grade at or below yours), `A.jobRankUp`, `A.takeDoor`; content `fx` clears `p.mil.cmdr`.
- **Read.** `A.superior` (grade below 9), `A.superiorTitle`, `UI.chainOfCommand`, `A.roster` ("Above you"),
  `A.findPatron` (first candidate), `A.bossAct`/`A.bossMod`, 21's NPC moves (`bd_boss_*`), 9999-advisors' ring
  ('master'/'superior'), `C.superior`.
- **Two holders?** It is a made-up person per player, with a made-up grade. It is never the real general of your
  army, the real commander of your division, the 9997 senior captain of your battalion or the council's Marshal.
  So a Captain answers to an invented "Senior Captain of Aldmark" while 9997 has a named senior captain of his own
  battalion (`CO.cap(d, b, 4)`), and a High General to an invented "Marshal of Aldmark".
- **Death** (5% a year at war, in `A.obligationsYear`): a new one next year. **Your promotion past him**: a new one
  one grade higher next year; the old one keeps his `occ`.

### 3.4 Council seats: `r.council[seat]` and `pc.office`

Five seats (`A.COUNCIL`: chancellor, marshal, treasurer, spymaster, chaplain). `r.council` maps seat -> person id
in every realm (56 named them for every realm); `pc.office` / `pc.officeSince` exist only for the player.

- **Written (set).** Release `A.CHOICE_FN.takeSeat` (offer from `A.seatOffers`, monthly in `A.pathMonth` when
  `pc.office` is empty), release `A.nobleAction('office')` (random seat), release `A.rulerAction('appoint')`
  (the player ruler), release `promoCheckNow` (rank 9 -> `marshal`, no `pc.office`), 56 `RI.fillCouncil`
  (`court.core.js`: cast, great-house heads and the ruler's kin, best "fit"; at world start, at the yearly
  `RI.session`, at 03's `EF.found` for a new rebel realm, and from 64's `NB.councilYear`), 56 `RI.deal` (a seat for a
  faction's leader), 64 `A.RI.fillCouncil` wrapper (writes temporary `_nb0`... keys into `r.council` during the call
  so believed traitors count as taken), content `pa_court_scandal` (random seat).
- **Written (delete).** Release `A.councilMonth` (ruler's opinion below -40: 15% a month), `A.leaveRolesFor` (only
  when the new role is not "council" or "army-marshal"), `A.rulerYear` (dead councillors, player ruler only);
  56 `RI.fillCouncil` (no candidate), 64 `NB.councilYear` (a believed traitor), 994 `CAR.closeCareer`,
  9999-advisors `applyFx` `adv.unseat`, content `ct_corrupt`.
- **Read.** Release `A.wsGeneralFor` (the council's Marshal is the first choice for a new army's general),
  `A.councilSkill` (14 call sites: justification, diplomacy options, AI offers, the realm tab), `A.rulerYear` (`cs('marshal')` moves
  `r.armyQ`, player ruler), `A.promoBoard` (the rank-9 "slot"), `UI.chainOfCommand` ("Marshal of the realm"),
  `A.roster`, `A.findPatron`, `A.whatNow`, `A.mainRole` (player: `pc.office`); 9996 `POL.runTasks`/`POL.taskFx`
  (the Marshal drills the host +0.02 `armyQ`, speeds the muster, keeps the peace), `POL.appointer` (the Marshal
  appoints wardens), `POL.estState`/`POL.legitParts` (estates in government), `POL.electorsOf`, `POL.candsOf`,
  `POL.inCouncil` (needs `pc.office`); 56 `RI.voices`/`RI.aims`; 9999 `ADV.candidates` (the ring of a ruler is his
  council; the role is copied into `pc.adv.ring` and refreshed quarterly); 64's treason; events through
  `seatHolder(r, seat)` (`ct_council_quarrel`, the war council), `C.office(p, seat)` and the `council: [...]` pools.
- **Two holders?** One id per seat, but **one person can hold two seats**: `takeSeat` keeps the old seat (2.5), and
  `A.rulerAction('appoint')` / `A.councilCandidates` never look at the seats a person already holds (only 56's
  `RI.fillCouncil` and `RI.deal` do). In AI worlds, one person sat on two realms' councils after a split (4.3).
- **Incompatible posts?** 56's candidates exclude rulers, the player and sitting councillors only: a councillor can
  also be an army's general (by design for the Marshal: in AI worlds 2-12 armies a year are led by their realm's
  council Marshal), an order's Grand Master, a governor (9996 refills the governorship at the next New Year), a
  thief (seed 202: the Treasurer of Aldmark rose to "king of the gutter", `job.thief#4`, while seated).
- **Promotion.** The seat does not depend on any grade (court roads) or sets no `pc.office` (board road).
  **Death.** Swept: 56 at the next `RI.session`, the player ruler at his `A.rulerYear`. **Resignation of the
  army** leaves the seat (2.1). **Prison**: `A.pathMonth` returns early for a prisoner, so `A.councilMonth` (the only
  place the player's seat is re-checked) does not run: the seat is kept for the whole sentence. **Leaving the
  realm**: `A.councilMonth` drops `pc.office` but the old realm keeps `r.council[seat] = pc.id` until 56 sees
  `cur.realm !== r.id`. **Dismissal**: `A.councilMonth`, fame -3. **Retirement**: kept. **Capture**: kept.

### 3.5 Army command: `A.S.armies[i].gen`, `.sub`

Armies exist only at war (release `A.wsDemobilize` deletes them at peace).

- **Written.** `gen`: release `A.wsNewArmy` (from `A.wsGeneralFor`: the council Marshal if free and not you, else
  70% a great or military house head, else a new noble "a general"), `A.wsDay` (a dead general is replaced, or set
  to null if he was you; an army with no general gets one unless you, rank 7+, are attached to it), `A.wsAttachPC`
  (rank 7+: your army, else one without a living general, **else the second largest**, displacing its general
  without a word; rank below 7 hands yours back through `A.wsGeneralFor`), `A.staffApply` (monthly, `onMonth`:
  your staff's "General, <army>" slots, rank 8 for the armies you are sub of, 9 for all, or as ruler, write
  `a.gen = <your pick>`), `A.leaveRolesFor` (null, unless you became ruler). `sub`: `A.wsAttachPC` (rank 8+: up to
  two armies without a sub), `A.wsSplit` (rank 8+), `A.leaveRolesFor`.
- **Read.** `A.cmdRole`, `A.wsCanCommand` (`A.wsSetOrder`, `A.wsSplit`, `A.wsMerge`, `A.wsTransferDiv`),
  `A.wsLeadBattle`, `A.divGen`, `A.pcTacFor`, `A.wsPCFightStart`, `A.roster` (ruler), 38's `A.GENERALS` (temper),
  23's reports, 99997 `W.side` (a general is in the war), 9997 `CO.yearMoods`.
- **Two holders?** One id per army; one person per army in AI worlds (`busy` set in `A.wsGeneralFor`), but
  `A.staffApply` can name a general who already leads another army or sits on any council.
- **Incompatible?** No check against council seats (other than the Marshal's), offices, orders, rulers.
- **Promotion.** A new General takes the second-largest army; a High General becomes `sub` of at most two; a
  Marshal changes nothing (other generals stay; `A.cmdRole` lets him order every army in the War Room, but battles
  are offered only for the army whose `gen` he is, and the realm's main army keeps its general).
- **Death.** Swept daily at war by `A.wsDay`. **Resignation / desertion / prison / leaving the realm**: the player
  stays `gen` (scenario B: `army.gen:R3` after `A.resign`, still 30 days on; `A.V2W.side` still counts him in the
  war through `A.S.armies.some(a => a.gen === pc.id)`, so his War Room opens, while `A.cmdRole` gives him nothing to
  order: the army fights on under the AI as "the player's army", which 38's `A.GENERALS.of` treats as steady). **Retirement**: kept. **Capture**: kept.

### 3.6 Division command: `r.forces.divs[i].cmd`

- **Written.** Release `A.newDiv` (null), `A.orderRaise` (the order's Grand Master), `A.pcDivAttach` (rank 6: your
  division, overwriting anyone; any other rank clears yours), `A.staffApply` (rank 7-8 "Commander, <division>"
  slots), `A.leaveRolesFor` (clears yours).
- **Read.** `A.divGen` (else the army's general), `A.pcTacFor`, 99997 `W.cmdsDiv`/`W.leads`/`W.unitWord`
  (a Commander "leads 7,466"), `A.drillShare` wrapper, `A.roster`, `A.oobPath`.
- **Two holders?** One id per division. In AI worlds only the order divisions have a commander (`divsCmd` 7 to 9 a
  year: the 8 orders, less one destroyed, plus the player at rank 6); every other division is led by "its army's
  general" through `A.divGen`.
- **Incompatible?** At rank 6 the player is **both** the division's commander and the 9997 senior captain of a
  battalion inside it (every run, every year of seed 101's life from 1114). A rank-6 player in an order's division
  takes `d.cmd` from the Grand Master (see 4.1, scenario G).
- **Death.** Never swept for the player (`A.pcDivAttach` only clears the *current* player's id). **Resignation /
  prison**: kept (scenario D: `div.cmd:DPOL01-4` 45 days after `A.resign` and after `A.imprison`). **Capture**: kept.

### 3.7 Battalions and companies: 9997 `d.bs[i]`

Every battalion record has five command slots: 0-3 its companies' captains, 4 its senior captain. A slot's holder
is a *seed* (`CO.seedOf`, a pure name and command) unless a person is recorded in `b.p[slot]`; `b.cs[slot]` stores a
replacement seed; `b.vac` marks slot 4 vacant until the New Year. A captain made a person carries `p.coAt`,
`p.milRank` 4/5 and `p.occ`.

- **Written.** 9997 `a-state.core.js`: `CO.place` (the player: rank 4-5 into his company's slot, 6 into slot 4, any
  other rank out; ranks up to 3 and 5 also make the slots above him persons), `clearMe` (only when `CO.place`
  re-places him), `CO.person`, `CO.replaceCap` (death, a captain who leaves, a promotion), `CO.promote` (New Year:
  the best captain by merit takes a vacant slot 4, the player excluded), `CO.reraise`, `CO.build`.
- **Read.** `CO.cap`/`CO.capStat` (morale, every war day), `CO.myCompany`, the order of battle, the line battle's
  units and orders (`A.coOrder` by rank), 9999's ring ('captain'), 72's book.
- **Two holders?** One per slot by construction, but `CO.place` overwrites a person without telling him: he keeps
  `occ`, `milRank` and `coAt`. When the player moves up, the slot falls back to its *seed*, whose name is the same as
  the displaced person's (the person was made from that seed). Result: two "Corbin of Amberwick, Captain of the 3rd
  Company" (one a person with no post, one a seed in the slot).
- **Grade vs slot.** GD.MIL rank 5 is "Senior Captain" (leads 800), but `CO.place` keeps rank 5 in a *company*
  slot; 9997's battalion senior captain stays someone else. `W.leads` says 800, the slot says 200.
- **Death.** Swept monthly (`CO.replaceCap(..., 'died')`). **Resignation / desertion / prison / council seat**: the
  player stays in the slot for good (seed 202: the Treasurer is still captain of `DPOL01-7/b0` 18 years later; seed 11
  roads 1 and D). **Capture**: kept.

### 3.8 The player's staff: `pc.staff[slot]`, `pc.staffD`, `pc.staffPool`

- **Written.** Release `A.staffAppoint`, `A.staffDelegate`, `A.staffResolveDelegates`; slots by grade from
  `A.staffSlots` (file-leaders, sergeants, lieutenant, sergeant-major, company and battalion captains, second,
  quartermaster, chief of staff, quartermaster-general, master of scouts, "Commander, <division>", "General,
  <army>", Captain of the Guard, steward, castellan, factor). `A.staffCands` makes four new people a year per slot
  type (`milRank`, `occ` "<title> of <realm>", `npcTemp`).
- **Applied.** `A.staffApply` (monthly and on appointment) writes `d.cmd` and `a.gen` from it.
- **Two holders / incompatible?** One person per slot of *your* staff (`A.staffAppoint` removes him from your other
  slots); nothing stops your staff general from leading another army, sitting on a council or being foreign (your
  known people are candidates). The staff's company and battalion captains do not exist in 9997.
- **Leaving.** The slots disappear from `A.staffSlots` but `pc.staff` keeps them; what `A.staffApply` wrote stays.

### 3.9 Elite orders: `r.orders[id]`, the order's division, `pc.order`

- **Written.** `r.orders[id]` (the Grand Master, a made noble, `occ` `A.orderLeadTitle`): release `A.orderRaise`
  (from `A.ordersEnsure`, at start and when an order rises again), `A.migrateOrders` (renames; a removed order's
  leader becomes "once ..."). 32-legend-and-master-caps wraps `A.orderRaise` (the Master cap). The order's division `d.cmd` = the
  Grand Master. `pc.order = { id, rank 0-3, since, merit }`: `A.orderJoin` (+ 99997's three trials), `A.orderMonth`
  (rank up to 3, e.g. "Marshal of the Wolves"), `A.orderLeave`, `CAR.closeCareer`, `A.migrateOrders`. Joining also
  sets `pc.mil.div` to the order's division.
- **Two holders?** One Grand Master per order; the player's order rank is per person (no slot).
- **Incompatible?** In every census year 7 or 8 of the 8 Grand Masters also hold a 9996 shire office
  (`polHolderAlsoDivCmd` 7.7 on average, 8 at most): the order's field commander governs a shire.
- **Death of a Grand Master.** Not swept: `r.orders[id]` and `d.cmd` keep the dead id until the division is
  destroyed and raised again (`A.orderRaise` checks `L.alive`). In practice it rarely comes up: a Grand Master is a made
  noble with no court title, whom the release never ages unless the player knows him (see the note at the top of
  section 3); no dead division commander appeared in 200 world-years.

### 3.10 Free company: `pc.company`

Release `A.foundCompany` (a commission is dropped: `pc.mil = null` with "You leave ..."), `A.companyYear`,
`A.leaveRolesFor` (to ruler: the company becomes the royal guard), `A.roleCheck` (commission + company -> the
commission goes). `pc.company.officers` is a list of names. `A.mainRole` "Captain of <company>", `W.rank` "captain".
Only the player has one.

### 3.11 Polity offices: 9996 `r.pol.off[]`

`{ id: 'k:prov', k: gov|mag|reeve|warden|customs, at, pid, by, since, term, pay, g }`, 8-20 a realm.

- **Written.** `a-polity.core.js` `POL.fillOffices` (New Year: new seats made, lost ones dropped, vacancies filled
  from `POL.candidates`; `POL.makeFor` makes a person when nobody fits), `POL.audit` (a grafting governor dismissed:
  `o.pid = null`), `d-player.core.js` `POL.seek` (the player), `POL.pcYear` (a new ruler sweeps the player out, 35%),
  and its `A.applyFx` wrapper (`poOff: 'take'` / `'lose'`, from the event `po_seek_offered`, open to `C.soldier`).
  The holder's `occ` becomes "<office> of <shire>" if it was empty or generic.
- **Two holders / incompatible?** One per office; up to `POL.MAX_HELD` = 2 per person, one great (governor,
  magistrate, warden) and one lesser for the player (`POL.seekable`). Candidates exclude rulers, prisoners and
  councillors, not army generals, order masters, 9997 captains or the player's grade. Seed 202 (peasant): a Senior
  Captain still leading his company was made Warden of the March of shire 5 (`pol.warden@5`) by `po_seek_offered`.
- **Death.** Swept at the next New Year ("a dead holder waits for the New Year"). **Resignation**: no function.
  **Leaving the realm**: `fillOffices` treats `p.realm !== r.id` as vacant at the New Year.

### 3.12 Crown, heir, house heads, land titles

- **Crown** `r.ruler` <-> `p.ruler`: release `A.makeRuler` (the only writer that calls `A.leaveRolesFor`, and only for
  the player), `A.rulerDies`, `A.pickHeirFrom` (temporary), `A.realmFalls`, `A.factionRevolt` (`nr.ruler`, then
  `A.makeRuler`), `A.successionWar` (`nr.ruler = claimant.id` **without** `A.makeRuler`: the claimant keeps every
  other post of the realm he fights), `A.factionConcede`, `A.rulerAction('abdicate')`, `A.rulerYear` (lost crown),
  `pass_torch`; 9996 `POL.seasonYear` and `FW.election`; 70 `FR.split`; 99994 `F.inherit`. Audited by 99994
  `A.V2F.audit()` (one crown per realm). An NPC who becomes ruler keeps his seat, army and order until each sweep.
- **Heir** `r.heir`: `A.pickHeir` (99994 wraps it). In seed 11 at 1105 two realms' heirs are also their council's
  Marshal (POL-07 Saelor Mistwalker, POL-15 Tancred Falcone).
- **House head** `h.headPid`: release `A.kill`, `A.houseHead`, `A.inheritFrom`, `A.famMembers`, `pass_torch`;
  99994 `giveHeadship`; 99995 `A.houseHead` wrapper and `newHolder`; 56's purge; 70 `FR.split`; content
  `realm-blood`. Audited by 99994.
- **Land titles** `p.noble = { rung, realm, holding, court, more, fief }` and `A.S.court` (v2): release
  `A.nobleAction('petition')`, `A.rulerAction` (grant), `punishNow` (forfeit), `A.continueAs`, `A.inheritFrom`;
  994 `CAR.knight`, `CAR.enfeoff`; 99995 `seatHolder`, `N.meet`, `N.grantFief`, the vacant-title regrant; 99994
  `giveLordship`; 9996 `POL.fate`; 97 `e-works` (a patent). This is the one family of posts that already has one holder
  per title (`v2nOneHolder`, `F.audit`), because titles move only in `A.V2F.inherit` and the regrant skips anyone who
  already holds a court title.

### 3.13 Jobs: `pc.job`

`{ c, r, y, perf, rep, merit, since, boss, own, mates }` against `GD.CAREERS[c].ranks` (Guild master, Master of
works, Banker, Great Officer, Patriarch, Steward, ...).

- **Written.** Release `A.applyJob`, `A.jobRankUp` (+ 99999 RN wrapper), `A.quitJob`, `A.pathMonth` ("let go" at
  perf below 15), `A.leaveRolesFor`, `A.roleCheck`, `A.makeRuler`, `enlistNow`, `A.travelTo`, `A.exile`,
  `A.careerYear`, `A.takeDoor`, `A.prepareStart`, `A.ensureMates`, the `promote` fx; 994 `CAR.closeCareer`; 55
  `BD.FX.expose`; 9996 `POL.makeFor`, `POL.electorsOf` (NPC clergy); event effects assign `p.job` 28 times (16 `null`, 12 new jobs; release
  content and two 40-memory packs) and `p.job.r` 4 times, outside every function above.
- **Two holders?** A rank, not a post: the board's "A post falls vacant" row is `ok: true, soft: true` always. The
  player's old boss stays "Guild master" when the player becomes Guild master.
- **Incompatible?** `A.roleBlock(pc, 'job')` checks the army and a free company only: a councillor can take any
  job (seed 202).
- **Honours above the top** (994 `cr_honour`: "Warden of the march", "Master of the guild", "Raised to a see") are
  `p.flags.cr_command|guild|faith` and a deed: titles with no post, beside 9996's real wardens.

### 3.14 Titles as text

`p.occ` has some 40 writers (release `A.makeSuperior`, `A.staffCands`, `A.wsGeneralFor`, `A.orderRaise`,
`A.occSweep`, `A.makeAcquaintance`...; 56 `RI.fillCouncil`; 9996 `POL.fillOffices`, `POL.electorsOf`; 9997
`CO.person`, `CO.promote`; 99994 `F.fixOcc` and the family offices; 50-53 arcs; 70 `FR.split`...). Only
`A.migrateOrders` ever rewrites one when the post is lost ("once ..."). `p.title` holds the lore's titles (and
"Sir"/"Dame" from a petition). These strings are what the person view, `A.mainRole` (last resort), 56's council "fit"
(`SEAT_RX`) and the census of marshals read.

### 3.15 Derived views (each reads a different subset)

| View | Reads | Disagrees with |
|---|---|---|
| `A.mainRole(p)` (title line, People tab) | ruler > `p.office` > `p.order` rank name > `p.mil` rank + army or division name > `p.company` > job rank > `p.milRank` > `p.occ` | the board's Marshal reads "Marshal of the First Army of Aldmark"; a seated NPC reads his `occ` |
| `A.cmdRole(pc)` (every War Room right) | `pc.ruler`, `pc.mil.rank`, `a.gen`/`a.sub` | the council seat (a seated Marshal of rank 4 commands nothing) |
| `A.V2W.rank/leads/unitWord` (99997) | `pc.mil.rank`, `d.cmd`, `pc.company`, `pc.ruler` | rank 6 is "captain" but leads a division |
| `A.V2W.side/canRoom/inWar` | ruler, `pc.mil`, `pc.company`, any `a.gen` | the seat (a Marshal without a commission has "no place in this war") |
| `A.superior`, `UI.chainOfCommand` | made-up `cmdr`, `r.council.marshal` | the army's real general, 9997's senior captain |
| `A.roster`, 9999 `ADV.candidates` | seats, staff, squad, `cmdr`, 9997 captain | cached in `pc.adv.ring` for a quarter |
| `POL.estateOf` | job, cast role, `p.mil` rank 4+, house | - |
| `C.*` helpers | `C.soldier` = any `p.mil`; `C.office` = `p.office`; `C.ruler`; `C.jobRank`; `C.superior` | events gated on `C.office(p,'marshal')` fire for the court-named Marshal, never for the board's |

---

## 4. Simulations

Harness: Playwright + Chromium on `index.html`, one page per worker (`daemon.mjs`), jobs in `/tmp/claude-0/-home-user-Ardan/76879393-358c-55c2-b023-d0be520d4c7b/scratchpad/sim/` (`lib.js`
census helpers; `scenA.js` ... `scenG.js` forced scenarios; `career.js` bot lives; `world2.js` AI worlds). The
forced scenarios force only the one roll they name (`L.forced`, which swaps `A.chance`/`A.pick` for the duration of
one call); everything else is the game's own code. Wars are started with the release's `A.startWar(realm, strongest
neighbour)`. Each person is shown as `id:name`.

### 4.1 Forced scenarios (seeds 11, 23, 37, 41, 59, 77, 88)

| Scenario | What is forced | What the game did (every seed tried) |
|---|---|---|
| A. Named Marshal as a Captain (`A.nobleAction('office')`) | the court's roll and the seat | seat and title yours, grade 4, `cmdRole` officer, no army; old Marshal keeps the main army; after deserting: the seat and **your company slot** still yours, `canRoom` false (2.1). Seeds 11, 23, 37, 41, 59 |
| B. Board's Marshal (`A.promoCheck` at rank 8) | the board's roll | displaces the army's general at rank 7; a made-up "Marshal of Aldmark" superior at rank 8; seat taken silently at 9, no `pc.office`; after `A.resign`: **`council.marshal` and `army.gen:R3` still yours**. Seeds 11, 23, 37, 41, 59; Ashmere seed 88; a peasant (seed 77) is refused at 8 by birth |
| C. Council's offer (`takeSeat('marshal')`) | the offer's gate | **commission resigned on accepting**; seat yours, army to a house head. Seeds 11, 23, 37, 41, 59 |
| D. Up the echelons, then leave (`CO.place`, `A.pcDivAttach`, `A.wsAttachPC`) | none | see table below. Leave by `A.resign`, `A.imprison`, `ri_taken` |
| E. Two seats | none | Treasurer + Chancellor; Marshal (board) + Chancellor. Seeds 11, 23 |
| F. Three armies, General -> Marshal | the board's roll | General given the *second* army R5 (6 divisions), its general Sunniva Brambleworth (psh) displaced; High General = `gen` R5 + `sub` R3 and R6; Marshal: R3, the largest (8 divisions), **still led by the old Marshal Garrick Harrow (p2n)**; `mainRole` "Marshal of the Second Army of Aldmark"; made-up "Marshal of Aldmark" Aldith Saltcote (psl) |
| G. Death, retirement, an order | none | death at rank 6 with an heir: the dead man keeps `div.cmd:DPOL01-4` 40 days on (9997 swept his battalion slot). "Pass the torch" at rank 7: the retired father keeps `army.gen:R3` and his grade 40 days on. A rank-6 player in the Iron Wolf's division (what `A.orderJoin` + `A.orderMonth` write): `d.cmd` of DPOL01-20 passes from the Grand Master Hamo Fernlade (p2f, who is also the shire's reeve **and** its Warden of the March) to the Wolf-Aspirant player, who is also senior captain of a battalion in it |

Scenario D, seed 11 (`co` is the player's company "3rd Company, 1st Amberwick Crossbows", battalion `DPOL01-4/b8`):

| Player | Company slot 2 | Battalion slot 4 (senior captain) | `d.cmd` DPOL01-4 | Army R3 | The displaced |
|---|---|---|---|---|---|
| rank 3 | ps6 Corbin of Amberwick (person) | ps7 Garth of Copperham (person) | none | p2n Garrick Harrow | - |
| rank 4 Captain | **you** | ps7 | none | p2n | ps6 keeps `occ` "Captain of the 3rd Company, 1st Amberwick Crossbows", `milRank` 4, no post |
| rank 5 "Senior Captain" (leads 800 says `W.leads`) | **you** (still a company) | ps7 (also "Senior Captain") | none | p2n | two Senior Captains of one battalion |
| rank 6 Commander | seed "Corbin of Amberwick" (no person: same name as ps6) | **you** | **you** | p2n | ps7 keeps "Senior Captain of the 1st Amberwick Crossbows", no post |
| rank 7 General | seed Corbin | seed "Garth of Copperham" (same name as ps7) | none | **you** (Garrick displaced) | two Corbins, two Garths |
| back to 6, then `A.resign` | seed | **you** | **you** | p2n | 45 days on: a civilian commands the division and the battalion |
| same, `A.imprison` | seed | **you** | **you** | p2n | same |
| same, captured (`ri_taken` queued) | seed | **you** | **you** | p2n | grade 6 and both commands kept |

### 4.2 Bot lives: five seeds, a noble and a peasant soldier each, 20 years (`career.js`)

Each life: Aldmark (POL-01), born 1086, enlists at 19 (`A.enlist`), then `T.play` one year at a time (events answered
by `A.eventAuto`, prompts skipped, so every council offer is declined). The noble also does what a player at court
does once a year: `A.nobleAction('office')` with the game's own dice. Each year every post of the player in every
store is listed and checked.

| Seed | Life | Grade by year (r = `pc.mil.rank`; "/seat" = `pc.office`) | What went wrong |
|---|---|---|---|
| 101 | noble | 1106 r3, **1108 r3/marshal**, 1109 r4/marshal, 1110 r5/marshal, 1114-1125 r6/marshal | the owner's bug, unforced: "Marshal of Aldmark" at 22 as a Squad Captain; 17 years as Marshal leading a company, then a "Senior Captain"'s company, then a division **and** a battalion (`div.cmd:DPOL01-1` + `co.senior:DPOL01-1/b8`, 12 years); never an army; his superior from 1110 is a made-up "General of Aldmark" |
| 303 | noble | 1106 r3, 1114 r4, **1122 r5/marshal** | the owner's bug again: Marshal of Aldmark at 36 while captain of a company (`co.captain1:DPOL01-13/b5`), to the end of the run |
| 202 | noble | 1106 r3, 1107 out/treasurer | named Treasurer at court; `A.roleCheck` resigns the commission, `A.leaveRolesFor` leaves the 9997 slot: **captain of `DPOL01-7/b0` for 18 years as Treasurer**; from 1112 also a thief rising to "king of the gutter" (`job.thief#4`) while seated |
| 505 | noble | 1106 r4, 1108 r5, 1110 out/spymaster | named Spymaster as a Commander: commission resigned, `d.cmd` cleared, **senior captain of `DPOL01-14/b5` for 16 more years** |
| 404 | noble | 1106 r3, 1108 r4, 1110 r5, 1117 out/treasurer | named Treasurer: **captain of `DPOL01-14/b5` for 9 more years** |
| 101 | peasant | r1 1106, r2 1110, r3 1119, r4 1120 | a made-up superior each grade ("Senior Captain of Aldmark") beside 9997's real senior captain of his battalion |
| 202 | peasant | r1 1106 ... r4 1114, r5 1118 | made **Warden of the March** of shire 5 (`po_seek_offered`) while still leading his company: a field command and a great office at once |
| 505 | peasant | r3 1106, r4 1111, r5 1115, r6 1121 | division and battalion at once from 1121 (`div.cmd:DPOL01-30` + `co.senior:DPOL01-30/b8`); `W.rank` "captain" leading 7,294 |
| 303 | peasant | r1 1106, out 1110 | left the army as a File-Leader (no command to leave behind) |
| 404 | peasant | r1 1106, r2 1107, r3 1108, r4 1113, r5 1117, out 1118 | left the army at 32 but stayed **captain of `DPOL01-6/b8`** in 9997 as a sell-sword file-leader, then a trader, until his death in 1124 |

Every noble life was named to a council seat by the court's road alone (between 1107 and 1122), which is how common
the owner's situation is: 2 of 5 as Marshal-without-command, 3 of 5 as a councillor who still holds a company or battalion in
9997's records.

### 4.3 Duplicates in AI worlds

Two sources: the census of every realm at each year's end in the ten bot-life worlds (`L.census`, 200 world-years),
and three worlds with a peasant who never enlists, censused every five years with a second pass that classifies every
person titled Marshal (`L.census2`, seeds 606, 707, 808, 1105-1125).

| Measure | Result |
|---|---|
| Realms with a council Marshal | 34 of 34-38 realms, every year |
| Realms where someone other than the seat's holder is titled Marshal of that realm (AI-only worlds) | 1-2 (seed 606), 2-6 (707), 1-3 (808) of 34-38 realms. Causes: the lore's cast titles (Tancred Falcone, "Marshal of the Steppe March; commands the field army", **is the ruler** of POL-15 while Oriana Sabine holds the seat; Zoran Koren, "Lord Marshal" of POL-25, while Anton Koren holds it; Gebre Tsega, "Marshal of the Northern Host", now a Warden of the March while Tsion Mekonen holds POL-22's seat; Garin Solis; Leofric Stane, "Marshal" of Aldmark, with no post at all) and old holders who keep 56's `occ` (Bolor of the Grey Wind, "Marshal of Ulun", now a reeve; Petar Grell, "Marshal of Tessaria"; Oskan Bay, "Marshal of Morhaven") |
| The same, in the bot-life worlds (any `occ` with "marshal", realm level) | at least one such realm in 157 of 200 world-years; 2.2 realms on average, 6 at most (these include the player's realm and family: "Marshal of the levies") |
| A made-up "Marshal of <realm>" (`milRank` 9) beside the seat | every rank-8 player but one (8 of 9 forced runs; none in Ashmere, seed 88); never for NPCs (`milRank9Others` 0) |
| One person general of two armies | 0 in 200 world-years (`A.wsGeneralFor`'s `busy`); possible only through the player's staff |
| Armies led by their realm's council Marshal | up to 12 in a year, 2.2 on average (by design: he is the first choice) |
| A ruler leading an army | 5 world-years |
| One person in two council seats | 1 (seed 808, 1115-1125: two realms' councils after new realms split off); the player in scenario E |
| Dead councillors still seated at year's end | 39 of 200 world-years, up to 3 (swept at the next yearly session) |
| A councillor who is also a ruler | 3 world-years |
| Grand Masters who also hold a 9996 shire office | 7.7 of 8 on average, every year (Hamo Fernlade of the Iron Wolf: reeve **and** Warden of the March of shire 5) |
| Shire office holders who are also army generals / councillors | 19 / 34 world-years (refilled at the next New Year) |
| People titled "a general" with no army | 4.3 a year on average, 8 at most (armies are disbanded at peace) |
| People with a military grade (`milRank`) and no command | 59 at five years to 151 at twenty, per AI world |
| A company with two claimants (a captain whose `coAt` names a slot someone else holds) | 1 in two of three AI worlds by 1125 (`CO.promote` moves a captain to slot 4 without updating `coAt`); in a player's life, one at every promotion (scenario D) |
| A person in two 9997 slots; a dead 9997 captain; a dead division commander | 0, 0, 0 for NPCs (monthly sweeps work); the dead **player** keeps his division (scenario G) |

---

## 5. Proposed design: one post registry

### 5.1 Principle

Separate three things the build now mixes:

- **Grade** (`pc.mil.rank`, a career rank, an order rank, a noble rung): what you are qualified for and paid. It
  never gives command by itself.
- **Post**: a named place that exactly one person holds (or that is explicitly vacant), with a parent, a deputy,
  an appointer and **powers**. Command, a seat's business and a title come only from posts.
- **Title text**: always derived from the posts held (and from grade only for those who hold none).

Everything else (who commands which army, who answers to whom, what the War Room allows, what the title line says)
is computed from the registry.

What the owner would see under it:

| Complaint | Cause today | Under the registry |
|---|---|---|
| "promoted me to marshal, but I kept only my captain's command" | the seat (`r.council.marshal`) carries no command; command comes from `pc.mil.rank` (`A.cmdRole`) | `seat:<rid>:marshal` carries the command of every army; the appointment hands the company to its deputy and commissions the grade (or the crown cannot name a Captain at all: `can()` refuses below General) |
| "never got the larger army" | `A.wsAttachPC` gives the second-largest army; the main army keeps its general | the Marshal may take command 1, the main army, in person; its general swaps into the Marshal's old command |
| "another character held the title of marshal" | the displaced Marshal's `occ`, `A.makeSuperior`'s made-up "Marshal of Aldmark", family offices, lore titles | one holder per post; the displaced man's title is derived from what he now holds; no made-up superiors; the lore's "Marshal of the Northern Host" is an army command (`army:POL-22:1`), not a second seat |
| "when I left my captain's post, I was marshal in name only" | leaving the army clears `pc.mil` only; the seat stays, without power | the seat needs the commission: resigning it is resigning the seat (with its consequences), and the deputy acts until the crown names a successor |

### 5.2 State

```js
A.S.posts = { v: 1, h: { [key]: { p: pid|null, since: absDay, by: 'crown'|'board'|'court'|'law'|pid,
                                  act: pid?,          // acting holder while p is captive or the post waits
                                  vac: absDay?,       // vacant since (p null)
                                  prev: [[pid, since, until, why]] } } }   // the last 3, for the person view and 57
```

Sparse: a record exists only when a *person* holds or held the post. A 9997 slot held by its seed has no record (its
seed is the holder, as now), so the Great Continent's 30,000 captains cost nothing; empty council seats and offices
have `p: null, vac`. Estimated size: 5 seats and 8-20 offices a realm, armies at war, order masters, the player's
chain and the 9997 persons: a few thousand records, about 100-200 KB on the Great Continent. An index
`pid -> Set(keys)` is rebuilt from it on load and kept by the API (derived, never saved).

### 5.3 Keys and kinds

| Key | Post | Class | Parent | Deputy (acts when the holder is gone) | Appointer | Legacy field kept as a mirror |
|---|---|---|---|---|---|---|
| `crown:<rid>` | ruler | CROWN | - | regent (heir's guardian) | law / election | `r.ruler`, `p.ruler` |
| `seat:<rid>:<seat>` | council seat (5) | SEAT | `crown:<rid>` | none (vacant) | crown | `r.council[seat]`, `pc.office` |
| `group:<rid>:<n>` | High General (army group: up to 3 armies) | FIELD | `seat:<rid>:marshal` | senior army general | the Marshal | `a.sub` of the member armies |
| `army:<rid>:<n>` | General of the realm's n-th army (a command that outlives the war: the army object raised for it carries `a.cmdN = n`) | FIELD | its group, else `seat:<rid>:marshal` | chief of staff, else senior division commander | the Marshal | `a.gen` |
| `div:<did>` | division commander | FIELD | the army command its division is in (the Marshal's seat in peace) | senior battalion captain | army general | `d.cmd` |
| `bn:<did>:<i>` | battalion senior captain | FIELD | `div:<did>` | best company captain (`CO.promote`'s merit) | division commander | `d.bs[i].p[4]` |
| `coy:<did>:<i>:<j>` | company captain | FIELD | `bn:<did>:<i>` | the better sergeant (`CO.sergeants`) | battalion | `d.bs[i].p[j]` |
| `order:<oid>` | Grand Master (also commands the order's division) | FIELD | crown | Marshal of the order (rank 3) | the order's chapter | `r.orders[oid]`, the division's `d.cmd` |
| `office:<rid>:<k>:<prov>` | governor, magistrate, warden, reeve, collector | OFFICE (great or lesser) | appointer's seat | none | 9996 `GD.POL_OFFICES[k].by` | `o.pid` |
| `free:<company>` | captain of a free company | FIELD | none | lieutenant (`officers[0]`) | founder | `pc.company` |
| `staff:<cmdKey>:<role>` | staff of a command (second, quartermaster, chief of staff, scouts, guard...) | STAFF | `<cmdKey>` | none | holder of `<cmdKey>` | `pc.staff` (re-keyed to the command) |
| `house:<hid>` | head of house | HOUSE | - | house law (99994) | law | `h.headPid` |
| `title:<courtKey>` | land title (phase 2: already one holder by 99994/99995) | TITLE | its liege | house law | liege | `p.noble.court/more` |
| `guild:<rid>:<career>:<prov>` | top rank of a guild, a see, a merchant house (phase 3, optional) | GUILD | - | the next master | the guild | `pc.job` at top rank |

`GD.POST_KINDS[kind] = { cls, grade, parent(key), deputy(key), appointer(key), powers, title(key, p),
eligible(p, key) }`.

Two choices in the table matter for the owner's report:

- **Army commands outlive the war.** The release deletes armies at peace (`A.wsDemobilize`) and raises new ones with
  new generals at the next war (`A.wsRaise` -> `A.wsNewArmy(..., A.wsGeneralFor(rid))`, then `A.wsAttachPC` hands the
  player the second-largest again), so every General's command is lost at each peace and re-dealt at each war. With `army:<rid>:<n>` the post stays held through the peace, and `A.wsRaise`/`A.wsMobilize` raise
  army 1 (the main host, most divisions) for command 1, army 2 for command 2, and so on. The Marshal's seat may hold
  command 1 in person: that is "the larger army".
- **A seed is spent when it becomes a person.** 9997 makes a captain a person from his slot's seed (`CO.person`); when
  that person is moved out, the slot must get a fresh seed (`b.cs[slot]`), or the same man exists twice (scenario D:
  two "Corbin of Amberwick", two "Garth of Copperham").

Powers are names the derived views ask for:

| Kind | Powers |
|---|---|
| `crown` | every army and division, templates, forges, recruits, peace, appoint every post |
| `seat:marshal` | orders to every army and division of the realm, templates, ask for recruits, **appoint and relieve generals and group commanders**, the 9996 tasks (drill, muster, peace), appoint wardens; may hold one `army` in person |
| `group` | orders to its armies, appoint their division commanders, take personal command of any of their battles |
| `army` | orders to the army, lead its battles (`wsLead`), appoint its division commanders and staff |
| `div` | orders to the division (move, attack, dig in), the line battle's division unit |
| `bn` / `coy` | the 9997 line battle's orders for the battalion / company (`A.coOrder` by post, not by rank) |

### 5.4 Invariants (`A.POSTS.audit()`)

1. **One holder per post**: by construction (`h[key].p`), and every mirror equals its record (`a.gen`, `d.cmd`,
   `b.p[slot]`, `r.council[seat]`, `r.orders[oid]`, `o.pid`, `r.ruler`, `h.headPid`).
2. **The holder is able**: alive; of the post's realm (a sell-sword only in `free`); not imprisoned; not a ruler
   except `crown` and one `army` in person. A captive holds only with an acting deputy (`act`).
3. **Exclusive classes**: at most one FIELD post (the Grand Master's division counts with his order), one SEAT, one
   great OFFICE and one lesser OFFICE (9996's player rule, applied to everyone), one STAFF post.
4. **Forbidden pairs**: FIELD x SEAT except `seat:marshal` x one `army`/`group` in person; FIELD x great OFFICE; SEAT
   x OFFICE; CROWN x everything but one `army`; SEAT or FIELD x a job (as `A.roleCheck` already says for the grade);
   STAFF x FIELD.
5. **Grade fits the post**: coy 4, bn 5, div 6, army 7, group 8, `seat:marshal` 9 (appointment raises the grade to the
   post's grade if the appointer may: the crown can commission a General as Marshal; nobody can make a Squad
   Captain Marshal).
6. **The chain is real**: `A.superior(p)` is the holder (or acting holder) of the parent post. No invented superior.
7. **Titles follow posts**: no stored `occ` names a post its owner does not hold (`occ` for posts is no longer written;
   the person view and `A.mainRole` read `A.POSTS.title(pid)`).

### 5.5 Appointment is a handover

```js
A.POSTS.appoint(key, pid, { why: 'board'|'court'|'offer'|'ruler'|'law'|'deputy'|'staff', by, quiet })
```

1. `A.POSTS.can(key, pid)` (pure) gives the reason a promotion board, an offer or the ruler's screen shows when it
   refuses ("the seat of Marshal needs a General", "you hold the 4th Line; a governor cannot command").
2. **The appointee's conflicting posts are handed over first**: each post he holds that the new one excludes is
   vacated `why: 'promoted'` and goes to its deputy (a Captain named Marshal gives his company to its best sergeant,
   the 9997 `CO.replaceCap` rule; a Commander made General gives his division to its senior battalion captain).
3. **The holder being replaced is moved, never left holding a phantom**, by the kind's rule:
   - a seat: dismissed by the crown (the release's `takeSeat` costs: opinion -30, a rival); by the board: retires
     with a deed and fame +2;
   - an army command: **swap** (the displaced general takes the command the appointee's promotion freed) or the
     reserve (`A.S.posts.reserve`, first in line for the next command); the log names him;
   - a division, battalion or company: swap with the appointee's freed post when it is one echelon down, else "posted
     elsewhere" (a 9997 seed needs no destination);
   - the Marshal's seat by any road: **the new Marshal may take command 1, the main army, in person**, its general
     swapping into the Marshal's previous command. This is "the larger army" the owner expected.
4. Write the record and the mirrors, raise the grade if the post requires it, `A.emit('post', {key, from, to, why})`
   (log, 57's chronicle, 21's NPC moves for the displaced, 9999's ring refresh, 9996's `offLog`).
5. `A.POSTS.place(pc)` replaces `A.wsAttachPC`/`A.pcDivAttach`/`CO.place`: the player's division, army and company
   (`pc.mil.div`, `pc.mil.army`, `pc.mil.co`) follow the posts he holds, not the other way round.

The board (`promoCheckNow`) chooses a **post**, then appoints: rank 4 -> a company of his battalion (vacant first,
else the weakest captain is posted elsewhere), 5 -> a battalion of his division, 6 -> his division, 7 -> an army
(vacant first, else the weakest general to the reserve), 8 -> a group, 9 -> `seat:marshal`. The board's "slot" row
already computes most of this (`promoBoardNow`'s `R2.slots`); it becomes the vacancy the appointment fills, and a
promotion with no post to fill does not happen.

### 5.6 Leaving has consequences

`A.POSTS.vacate(key, why)` and `A.POSTS.leaveAll(pid, why, filter)`; the deputy acts at once (`act`), the appointer
confirms a successor (AI at once, deterministically; the player's appointments through the existing screens).

| Why | Called from | The post | The person leaving |
|---|---|---|---|
| promoted | `appoint` (conflict) | deputy, confirmed | - |
| replaced | `appoint` (displaced) | the appointee | swap / reserve / dismissal; opinion -10 to -30 toward the appointer and the replacer; a deed "relieved of ..." |
| resigned | `A.resign`, seat resignation, `A.quitJob` | deputy acts, appointer fills within a month | at war: fame -2, the ruler -10, the unit's morale -3 (9997 `CO.sat`); veteran record |
| deserted | `A.desert`, content `av_merc_desert`, `A.travelTo` (another realm) | deputy acts; the company or division loses morale (-5) and 9997's deserters follow | deserter flag, honour -20, the 30% patrol (as now); every post of the realm lost; the superior -40 |
| dismissed | `A.councilMonth`, 9996 `POL.audit`, 64 `NB.councilYear`, 994 `CAR.closeCareer`, 9999 `adv.unseat`, content `ct_corrupt` | appointer fills | fame -3, opinion |
| imprisoned | `A.imprison` | every FIELD, SEAT and OFFICE post lost | as now |
| captured | 56 `RI.maybeTaken` -> `ri_taken` | deputy acts; the captive keeps a claim for 6 months, returns on ransom, else `why: 'lost in captivity'` | ransom (as now) |
| died | `A.kill` | deputy acts at once | - |
| retired | `pass_torch`, old age (NPC holders too: the release never ages people the player does not know, so the registry retires a holder past his race's `old` + 5 at the New Year, chosen by a hash of id and year, no dice) | appointer fills | pension, veteran |
| crowned | `A.makeRuler` (NPCs too, not only the player) | every post but one army in person | as now for the player |
| realm or army gone | `A.realmFalls`, `A.wsDemobilize`, `A.wsMerge`, `A.divRemove`, 70 `FR.split` | the post is removed; its holder goes to the reserve | - |

After any of these, `audit()` holds: nothing of the post stays with the person who left.

### 5.7 Every view reads the registry

- `A.cmdRole(pc)` becomes `A.POSTS.command(pid)` (armies and divisions from the posts held and their children; the
  grade only gates eligibility); `A.wsCanCommand`, `A.wsCanDiv`, `A.wsLeadBattle`, `A.pcTacFor`,
  `A.wsPCFightStart` follow.
- `A.mainRole(p)`: crown > seat > highest FIELD post > great office > order rank > job > grade (veteran) > `occ`.
- `A.superior(pc)` and `UI.chainOfCommand`: the parent chain of real holders. A job's boss: the `guild` post's holder
  where one exists; otherwise the made-up boss stays for jobs only.
- 99997 `W.rank/leads/unitWord/side/canRoom`: from the highest FIELD post (coy, bn: captain with that unit; div:
  commander with the division; army, group, `seat:marshal`: commander). A seated Marshal is in his realm's war.
- `C.office`, `C.soldier`, `C.ruler`, and a new `C.post(p, kind)`; 9996 `POL.estateOf`, `POL.inCouncil`; 56
  `RI.voices`; 9999 `ADV.candidates`; 9997 `CO.cap` (a recorded person wins over the seed only through the registry).

### 5.8 Determinism, saves, tests

- Engine paths only write; choices draw from `A.rand` exactly where the replaced code drew (56's `A.rf` in the fit,
  9997's merit order, 9996's candidate sort). Views read only.
- **Old saves**: build `A.S.posts` on load from the legacy fields in a fixed order (crown, seats, orders, offices,
  armies, divisions, 9997 persons, staff, houses), then repair against the invariants with one log line each
  (a court-named Marshal of grade below 7 loses the seat; a resigned player is taken out of every FIELD post; a
  second seat is dropped; a displaced captain's `occ` becomes "once ..."). The mirrors stay, so untouched readers keep
  working while they are moved over.
- **Tests** (browser): `postsOneHolder` (10 seeds x 20 years, both worlds: `audit()` empty, mirrors equal),
  `postsMarshalRoads` (the five roads to the seat each end with one Marshal, `cmdRole` marshal, the old Marshal
  handled, no other person titled Marshal of the realm), `postsHandover` (Captain -> Commander -> General -> Marshal:
  every lower post with its deputy, the main army taken), `postsLeave` (resign, desert, prison, capture and return,
  death with an heir, pass the torch, leaving the realm: no ghost command, the consequence applied), `postsPure`.
  The census in `/tmp/claude-0/-home-user-Ardan/76879393-358c-55c2-b023-d0be520d4c7b/scratchpad/sim/lib.js` and `lib3.js` is a ready bench for "duplicates = 0".

### 5.9 Every write site that must go through the registry

Release functions are in the vendored engine (`ardan-core`); others by file.

**Council seats (`seat:`)** set: release `A.CHOICE_FN.takeSeat`, `A.nobleAction` ("office"), `A.rulerAction`
("appoint"), `promoCheckNow` (rank 9); 56 `court.core.js` `RI.fillCouncil`, `RI.deal`; 64 `d-world.core.js`
`A.RI.fillCouncil` wrapper (its temporary `_nb` keys become a candidate filter); content `pa_court_scandal`.
Delete: release `A.councilMonth`, `A.leaveRolesFor`, `A.rulerYear`; 56 `RI.fillCouncil`; 64 `NB.councilYear`; 994
`careers.core.js` `CAR.closeCareer`; 9999 `advisors.core.js` `applyFx` (`adv.unseat`); content `ct_corrupt`.
Init only: release `A.realmEnsure`, `A.roster`.

**Army commands and groups (`army:`, `group:`)**: release `A.wsNewArmy` (and its callers `A.wsRaise`,
`A.wsMobilize`, `A.wsSplit`), `A.wsGeneralFor` (becomes the AI appointer's choice), `A.wsDay` (dead or missing
general), `A.wsAttachPC`, `A.staffApply` (army slots), `A.leaveRolesFor`, `A.wsSplit` (sub), `A.wsMerge`,
`A.wsDemobilize`.

**Division commanders (`div:`)**: release `A.newDiv`, `A.orderRaise`, `A.pcDivAttach`, `A.staffApply` (division
slots), `A.leaveRolesFor`, `A.divRemove`.

**Battalions and companies (`bn:`, `coy:`)**: 9997 `a-state.core.js` `CO.place`, `clearMe`, `CO.person`,
`CO.replaceCap`, `CO.promote`, `CO.reraise`, `CO.build`, `CO.leave`, `CO.month` (death sweep), and the 9997
`A.divRemove` wrapper.

**Order masters (`order:`)**: release `A.orderRaise` (via `A.ordersEnsure`; 32-legend-and-master-caps's wrapper), `A.migrateOrders`.
Order membership stays a grade (`pc.order`): release `A.orderJoin` (99997 trials wrapper), `A.orderMonth`,
`A.orderLeave`; 994 `CAR.closeCareer`.

**Polity offices (`office:`)**: 9996 `a-polity.core.js` `POL.fillOffices`, `POL.makeFor`, `POL.audit` (dismissal),
`d-player.core.js` `POL.seek`, `POL.pcYear` (a new ruler's sweep), its `A.applyFx` wrapper (`poOff: 'take'`/`'lose'`,
event `po_seek_offered`).

**Free company (`free:`)**: release `A.foundCompany`, `A.companyYear`, `A.leaveRolesFor`, `A.roleCheck`.

**Staff (`staff:`)**: release `A.staffAppoint`, `A.staffDelegate`, `A.staffResolveDelegates`, `A.staffApply`.

**Crown (`crown:`)**: release `A.makeRuler`, `A.rulerDies`, `A.pickHeirFrom`, `A.realmFalls`, `A.factionRevolt`,
`A.successionWar`, `A.factionConcede`, `A.rulerAction` ("abdicate"), `A.rulerYear`, decision `pass_torch`; 9996
`c-elect.core.js` `POL.seasonYear`, `FW.election`; 70 `fresh.core.js` `FR.split`; 99994 `c-succession.core.js`
`F.inherit`.

**House heads (`house:`)**: release `A.kill`, `A.houseHead`, `A.inheritFrom`, `A.famMembers`, `pass_torch`; 99994
`giveHeadship`; 99995 `a-court.core.js` `A.houseHead` wrapper, `newHolder`; 56 `court.core.js` (the purge after a
failed rebellion); 70 `FR.split`; content `40-memory-realm-blood`.

**Land titles (`title:`, phase 2)**: release `A.nobleAction` ("petition"), `A.rulerAction` (grant), `punishNow`,
`A.continueAs`, `A.inheritFrom`; 994 `CAR.knight`, `CAR.enfeoff`; 99995 `seatHolder`, `N.meet`, `N.grantFief`, the
vacant-title regrant; 99994 `giveLordship`; 9996 `d-player.core.js` `POL.fate`; 97 `e-works.core.js` (the patent).

**The grade and every exit from it** (they must call `A.POSTS.leaveAll` instead of `pc.mil = null`): release
`enlistNow`, `promoCheckNow`, `A.resign`, `A.desert`, `A.imprison`, `A.travelTo`, `A.foundCompany`,
`A.foundRealm`, `milYearNow` (realm gone), `A.roleCheck`, `A.leaveRolesFor`, `A.makeRuler`, `A.kill`; 99999
`b-promo.core.js` `A.promoCheck` wrapper (the skipped rank); 994 `CAR.closeCareer`; 72 `twoscales.core.js`
`TS.front`, `TS.reckoning` (their temporary shim must not look like a commission to the registry); content
`rk_fm_inherit`, `rk_vt_recall`, `av_merc_desert`.

**Superiors** (to be replaced by the parent chain): release `A.makeSuperior` (from `A.obligationsYear`,
`A.jobRankUp`, `A.takeDoor`), content `fx` writing `p.mil.cmdr`.

**Jobs** (phase 3 only for top ranks; the exclusivity checks now): release `A.applyJob`, `A.jobRankUp` (99999 RN
wrapper), `A.quitJob`, `A.pathMonth` (let go), `A.roleCheck`, `A.roleBlock`, `A.leaveRolesFor`, `A.makeRuler`,
`enlistNow`, `A.travelTo`, `A.exile`, `A.careerYear`, `A.takeDoor`, `A.prepareStart`, `A.ensureMates`, the
`promote` fx; 994 `CAR.closeCareer`; 55 `b-secrets.core.js` `BD.FX.expose`; 9996 `POL.makeFor`, `POL.electorsOf`;
event effects that assign `p.job` (28) and `p.job.r` (4), which should become an fx key.

**Post titles written as text** (stop writing; derive): release `A.makeSuperior`, `A.staffCands`, `A.wsGeneralFor`,
`A.orderRaise`, `A.migrateOrders`; 56 `RI.fillCouncil`; 9996 `POL.fillOffices`, `POL.electorsOf`,
`POL.seasonYear`; 9997 `CO.person`, `CO.promote`; 99994 `F.fixOcc` and the family offices (`F.OFFICES`: let them
name real offices or none, never "Marshal of the host" beside a seated Marshal); 70 `FR.split`.

**Readers to move** (no writes, but they decide command): release `A.cmdRole`, `A.wsCanCommand`, `A.wsCanDiv`,
`A.wsCommandable`, `A.wsLeadBattle`, `A.pcTacFor`, `A.wsPCFightStart`, `A.divGen`, `A.mainRole`, `A.superior`,
`A.superiorTitle`, `UI.chainOfCommand`, `A.roster`, `A.councilSkill`, `A.promoBoard`, `A.seatEligible` (994 wrapper),
`A.roleBlock`, `A.staffSlots`; 99997 `a-gate.core.js` `W.side`, `W.rank`, `b-battle.core.js` `W.leads`,
`W.unitWord`, `W.cmdsDiv`; 9997 `CO.cap`, `CO.capStat`, `A.coOrder`; 9996 `POL.inCouncil`, `POL.estateOf`,
`POL.appointer`, `POL.candidates`; 56 `RI.voices`; 9999 `ADV.candidates`; `A.C` helpers (`office`, `soldier`,
`superior`).

### 5.10 Order of work

1. Registry core + audit + mirrors, built from legacy state each load (no behaviour change); the census bench
   reports the violations it already finds (section 4).
2. Field chain (company to Marshal's seat) and the exits from the army: this fixes the owner's report.
3. Council seats and the five roads to them; superiors from the chain; titles derived.
4. Offices, orders, staff, free company, crown and houses (mostly mirrors of already-consistent stores).
5. Land titles (move 99994/99995's audit onto the registry) and, if wanted, guild and church top posts.
