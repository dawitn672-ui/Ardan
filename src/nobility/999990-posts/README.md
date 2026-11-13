# 999990-posts: one holder per post

**Aspect:** Foundations (round 2, work item A2; the owner's rule "one holder per post"). **Kind:** system (one core
file, no patches, no events), with small calls added to the release source and to 56, 994, 9996, 9997, 9999, 99994,
99995. **Design:** `docs/DECISIONS.md` D-031, from `docs/reviews/round-2/posts-map.md` section 5. Placed late in the
build order (`999990`) so its month pass runs after the other features' month work.

## What it does

`A.POSTS` keeps one registry of posts in `A.S.posts.h`, keyed `seat:<realm>:<seat>` (the five council seats),
`office:<realm>:<office id>` (9996's shire offices), `army:<army id>` and `div:<division id>`. Each record holds the
holder, since when, why, who appointed him and the last three holders. The old fields (`r.council`, `pc.office`,
`o.pid`, `a.gen`, `d.cmd`) are its mirrors.

- `A.POSTS.can(key, pid)` says why someone may not hold a post (dead, under age for his people, in prison, foreign,
  a ruler; the Marshal's seat in peace or for anyone below General).
- `A.POSTS.appoint(key, pid, { why, by })` hands over what the appointee must give up (one seat a person, no seat with a
  shire office or a field command except the Marshal's with one army, one field command), moves the man replaced (a
  field command swaps into the one the appointee freed; a seat holder is dismissed with a grudge and loses his style),
  then writes the record and the mirror.
- `A.POSTS.vacate(key, why)` and `A.POSTS.leaveAll(pid, why)`: death, resigning, deserting, prison, the crown.
- `A.POSTS.sync(mode)` runs at the end of every month and after the New Year: it adopts any mirror written by code not
  yet routed through the registry (counted in `A.POSTS.stats.adopted`), applies the rules (a dead, under-age, crowned,
  imprisoned or departed holder leaves; two clashing posts: the higher class, else the newer, is kept), keeps the
  player's grade and the Marshal's seat together, and runs the Marshal rule below. On load (`mode 'load'`) it builds
  the registry of an older save and repairs it the same way, with a line in the log for each repair. No dice.
- **The Marshal (D-017).** The seat is empty in peace. When a realm's war needs one (two armies in the field or two
  enemies at once) the crown names its best General (command, renown, the size of his host); he takes the main host in
  person and its general takes his old army. At peace the Marshal stands down; the player returns to his General's
  grade. The court, the council's offer, the ruler and the promotion board all go through `appoint`, so the player can
  be named Marshal only as a General, only for such a war, and then holds the seat, grade 9, every army and the main
  host. Resigning the commission gives up the seat.
- **Titles follow posts.** `A.mainRole` of anyone but the player is the post he holds (`A.POSTS.title`). A style that
  names a council seat its owner does not hold becomes a past one ("once Chancellor of Varenna"): at once when a seat
  changes hands, and for the whole world on load and at the New Year (`A.POSTS.restyle`).
- A realm born in play with nobody to sit gets a council (56's fill, else four gentry raised by the crown).

## Routed writers (stage 1)

Release: `A.CHOICE_FN.takeSeat`, `A.seatOffers`, `A.nobleAction('office')`, `A.rulerAction('appoint')`,
`promoCheckNow` (rank 9) and both board rows, `A.councilMonth` (dismissal), `A.leaveRolesFor`, `A.resign`,
`A.desert`, `A.imprison`, `A.kill`, `A.makeRuler`, `A.wsAttachPC` (which army a General or Marshal takes),
`A.wsGeneralFor` (no councillor or child as general), `A.makeSuperior` / `A.needsNewSuperior` (a General answers to
the real Marshal, else the crown; no made-up Marshal). Features: 56 `RI.fillCouncil`, `RI.deal`; 994
`CAR.closeCareer`; 9999 the advisors' unseat; 9997 `CO.clearMe` (exported); 9996 `POL.makeFor` and the release's
`A.wsGeneralFor` make long-lived people at adult ages; 99995 marks a title vacant at the death; 99994's invented
"Marshal of the host/levies" offices are Captains.

Still adopted by the month's sync rather than routed (stage 2): 9996 `POL.fillOffices` / `POL.audit` / the player's
office effects, the release's `A.wsNewArmy` / `A.wsDay` / `A.pcDivAttach` / staff slots, content events that write
`r.council` (`pa_court_scandal`, `ct_corrupt`). Not yet posts: 9997's battalion and company slots (only the player's
slot is cleared on leaving), order masters, staff, free companies, house heads and land titles (99994/99995 keep their
own audit).

## Measured by

`test.mjs`: `postsMarshalRepro` (the owner's report, posts-map.md 2.1), `postsHandover`, `postsDeathVacates`,
`postsSaveMigration` (a real alpha.2 save and a state with every old fault), `postsPure`. The coherency check
`one holder per post` (`A.POSTS.audit()`; `audit({ strict: true })` also holds every mirror equal to its record).
