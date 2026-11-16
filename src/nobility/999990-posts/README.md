# 999990-posts: one holder per post

**Aspect:** Foundations (round 2, work item A2; the owner's rule "one holder per post"). **Kind:** system (one core
file, no patches, no events), with small calls added to the release source and to 56, 64, 70, 994, 9996, 9997, 9999,
99994, 99995. **Design:** `docs/DECISIONS.md` D-031 (stage 1) and D-053 (stage 2), from `docs/reviews/round-2/posts-map.md`
section 5. Placed late in the
build order (`999990`) so its month pass runs after the other features' month work.

## What it does

`A.POSTS` keeps one registry of posts in `A.S.posts.h`. Each record holds the holder, since when, why, who appointed
him and the last three holders; the old fields are its mirrors.

| Key | Post | Class | Mirror |
| --- | --- | --- | --- |
| `seat:<realm>:<seat>` | the four council seats (W1-1: the army's place, `seat:<realm>:general`, is read as the first host's `div:` post and never stored) | SEAT | `r.council[seat]`, `pc.office` |
| `office:<realm>:<office id>` | 9996's shire offices | OFFICE | `o.pid` |
| `army:<army id>` | an army's general | FIELD | `a.gen` |
| `div:<division id>` | a division's commander, a host's General (not an elite order's); the first host's is the senior General | FIELD | `d.cmd`, `r.council.general` |
| `bn:<division>:<i>` | a battalion's head, a wing's Commander, when a person (9997's slot 4) | FIELD | `d.bs[i].p[4]` |
| `coy:<division>:<i>:<j>` | a company's captain, when a person (9997's slots 0-3) | FIELD | `d.bs[i].p[j]` |
| `order:<realm>:<order>` | an elite order's Grand Master, who leads its division | FIELD | `r.orders[oid]`, the order division's `d.cmd` |
| `free:<player>` | the captain of the player's free company | FIELD | `pc.company` |
| `staff:<player>:<place>` | a place on the player's staff (not "Commander, ..." or "General, ...", which are the commands) | STAFF | `pc.staff[place]` (`pc.staffD` when delegated) |
| `house:<house id>` | the head of a house | HOUSE | `h.headPid` |
| `title:<realm>:<title>` | a court title of 99995 (duke, marquis, count) | TITLE | carried on the holder (`p.noble.court`, `.more`) |

A seed captain of 9997 (a name the slot gives itself, not a person) holds no post. HOUSE and TITLE pass by law: they
go with any other post, are never left by `leaveAll` (a death hands them to the heir through the house's or the
realm's law, which writes through the registry), and a child may hold them.

- `A.POSTS.can(key, pid)` says why someone may not hold a post (dead, under age for his people, in prison, foreign,
  a ruler; the first host only for a General or a proven commander; a councillor, a ruler or a prisoner on the staff).
- `A.POSTS.appoint(key, pid, { why, by })` hands over what the appointee must give up (one seat a person, no seat with a
  shire office or a field command, one field command but a division's commander's own battalion, one place on the staff and none for a councillor), moves the man replaced (a field command swaps into
  the nearest one the appointee freed: army, order, division, battalion, company; a seat holder is dismissed with a
  grudge and loses his style; a captain loses his "Captain of the ..." for "once Captain of the ..."), then writes the
  record and the mirror. `A.POSTS.place` is the same, but refuses (writes nothing) when the appointee holds a post of a
  higher class that cannot go with it: what the crown's generals, 9996's offices and the staff's commanders use.
- A person leaving a 9997 slot spends its seed (`CO.slotClear`: the better sergeant's seed, or slot 4 vacant until the
  New Year): the man who left and the slot's next captain never share a name (CRITIQUE R15). An order whose Grand
  Master dies gets another at once (`A.orderMaster`, the draws `A.orderRaise` made). A division or army taken off the
  rolls leaves its posts ('disbanded'); 9997's rebuilt battalions move their captains' posts with them
  (`A.POSTS.rekeyDiv`).
- `A.POSTS.setHead(h, pid, why)` (the release's `A.setHead`) and `A.POSTS.note(titleKey, pid, why)` are the write paths
  of houses and court titles.
- `A.POSTS.vacate(key, why)` and `A.POSTS.leaveAll(pid, why)`: death, resigning, deserting, prison, the crown. An
  army in the field left without a general gets one from the crown at once (`A.wsGeneralFor`, what `A.wsDay` did the
  next day), unless it is the player's own command.
- `A.POSTS.sync(mode)` runs at the end of every month and after the New Year: it adopts any mirror written by code not
  yet routed through the registry (counted in `A.POSTS.stats.adopted`), applies the rules (a dead, under-age, crowned,
  imprisoned or departed holder leaves; two clashing posts: the higher class, else the newer, is kept), and keeps each
  realm's first host and the council's place for the army together (below). On load (`mode 'load'`) it builds
  the registry of an older save and repairs it the same way, with a line in the log for each repair. No dice.
- **No Marshal; the senior General (W1-1, D-064, D-066; replaces D-017, D-049 and D-053's Marshal rule).** A division
  of the war map is a host and its commander a General. The General of the crown's first host (`A.POSTS.firstHost`: the
  realm's oldest standing host, kept in `r.firstHost` while it stands) is the realm's senior General: he sits at the
  council in the old seat's place (`r.council.general` mirrors the post; `seat:<realm>:general` is read as
  `div:<first host>` by `can`, `appoint`, `place`, `vacate` and `holder`), does its yearly task and nothing else (no
  army, no other General under him). The crown names one when the place is empty (`A.POSTS.fillGenerals`, the month's
  engine pass); a ruler may name a General or a proven commander (`A.POSTS.generalFit`); the court and the council's
  offer give it only to a General. The lore's sitting army chiefs (Aldmark's Leofric Stane and four more) start in it
  (56's first filling, on a stream of its own). Resigning the commission gives it up. An old save's Marshal becomes his
  realm's senior General on load (`A.POSTS.migrateMarshal` before the registry is built, `A.POSTS.seatMarshals` after).
- **Titles follow posts.** `A.mainRole` of anyone but the player is the post he holds (`A.POSTS.title`). A style that
  names a council seat its owner does not hold becomes a past one ("once Chancellor of Varenna"): at once when a seat
  changes hands, and for the whole world on load and at the New Year (`A.POSTS.restyle`).
- A realm born in play with nobody to sit gets a council (56's fill, else four gentry raised by the crown).

## Routed writers

Release: `A.CHOICE_FN.takeSeat`, `A.seatOffers`, `A.nobleAction('office')`, `A.rulerAction('appoint')`,
`promoCheckNow` (rank 9) and both board rows, `A.councilMonth` (dismissal), `A.leaveRolesFor`, `A.resign`,
`A.desert`, `A.imprison`, `A.kill`, `A.makeRuler`, `A.wsAttachPC` (which army a General or Marshal takes),
`A.wsGeneralFor` (no councillor or child as general), `A.makeSuperior` / `A.needsNewSuperior` (a General answers to
the real Marshal, else the crown; no made-up Marshal). Features: 56 `RI.fillCouncil`, `RI.deal`; 994
`CAR.closeCareer`; 9999 the advisors' unseat; 9997 `CO.clearMe` (exported); 9996 `POL.makeFor` and the release's
`A.wsGeneralFor` make long-lived people at adult ages; 99995 marks a title vacant at the death; 99994's invented
"Marshal of the host/levies" offices are Captains.

Stage 2: the release's `A.wsNewArmy`, `A.wsDay` (a dead general), `A.wsAttachPC` (both fallbacks), `A.pcDivAttach`,
`A.staffApply`, `A.staffAppoint`, `A.staffResolveDelegates`, `A.orderRaise` / `A.orderMaster`, `A.foundCompany`,
`A.companyYear`, `A.leaveRolesFor` (the royal guard), `A.houseHead`, `A.kill` (the heir), `A.famMembers`, the heir's
New Year (04-b), `pass_torch` (13), `A.councilMonth` (a dead councillor), the content events `pa_court_scandal` (24-pa:
only a seat the player may hold) and `ct_corrupt` (08-ct); through `A.setGen`, `A.setCmd` (10-b) and `A.setHead`
(04-a). Features: 9996 `POL.setHolder` (`fillOffices`, `audit`, `seek`, `pcYear`, the `poOff` effects); 9997
`CO.person`, `CO.replaceCap`, `CO.place`, `clearMe`, `CO.promote`, `CO.reraise`, `CO.build`; 56 `RI.fillCouncil`'s
vacant seats and the purge; 64 the council's sidelining; 70 `FR.split`; 99994 `giveHeadship`; 99995 `newHolder`,
`seatHolder`, the inheritance of titles, `A.houseHead`; 40-memory-realm-blood's family vote.

What the sync still adopts is counted in `A.POSTS.stats.adopted` (see Measured by). Left out: lordships of a county
without a court title (`p.noble.holding`, held to one holder by 99994's `A.V2F.audit`); army commands that outlive a
war (`army:<realm>:<n>`); the posts of jobs (R12, R17).

## Measured by

`test.mjs`: `postsSeniorGeneralCourt` (the owner's report, posts-map.md 2.1, under W1-1), `postsSeniorGeneralFill`,
`postsStage2Kinds` (every new kind handed over and left, nothing adopted), `postsHandover`, `postsDeathVacates`,
`postsSaveMigration` (a real alpha.2 save and a state with every old fault), `postsPure`. The coherency checks
`one holder per post` (`A.POSTS.audit()`; `audit({ strict: true })` also holds every mirror equal to its record, no
court title on two living people, an order's division led by its Grand Master), `one captain per company` and
`one master per order` (08-coherency-checks, read straight from 9997's and the orders' stores).
`node tools/bench/long-life-audit.mjs <html> --seed=7 --years=60` runs the audit every month and prints what the sync
adopted.
