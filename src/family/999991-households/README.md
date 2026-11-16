# 999991-households: who you know, how you met, no kin made up, one resolver for a house, the parish, nine months

**Step:** C6 (CRITIQUE §13, rows F1 to F7, P9; owner order 7) · **Decision:** D-057 · **Design:** `docs/design/households.md`
· **Kind:** system (five core files, no events), with edits to the release's source and to the kin scenes of other features.

## What it does

**Two stores** (`b-household.core.js`). The family tree (`p.parents`, `p.children`, `p.spouse`; 99994's three
generations) keeps every relative the world knows of; the player's relationships (`pc.rel`) keep the people the player has
met. At birth (the `A.newGame` stage `households`) that is the household: father, mother, the living brothers and sisters,
and a grandparent only under the same roof (`A.HH.roof`, from the family's seed: the father's widowed parent 6 in 10, both
his parents 3 in 10, else the mother's widowed parent 4 in 10; at most two). A child of a noble or royal house adds a wet
nurse, a maid and a knight of the household guard, and a tutor at six (`A.HH.makeStaff`; commoners and a gentry knight, on
streams of their own; `A.S.household = { pc, staff: { nurse, maid, guard, tutor }, roof, y }`). Everyone else of the tree is
met later: once a year a living relative not yet met (of the parish first, then the realm) comes to a family gathering
(`A.HH.gather`, a log line, never a card), or a scene names them. An older start has had its years of gatherings.

**How you met** (`a-meet.core.js`). `A.link` writes `met: { y, at, by }` on every new entry of the player's
relationships, from `A.metNote`: the reason is a caller's `A.MEET.as(why, fn)`, else the event being played (the
`A.eventView`/`A.eventChoose` stages `households` set `A.MEET.ev`), else the link's type (`birth`, `marriage`, `work`,
`court`...). The three writers that bypass `A.link` (`A.marry`, 9999-advisors' ring, 999990-posts' grudge) stamp it too.
`A.MEET.words(met)`: "Met when the family gathered in Ashford, 1112."

**No kin made up** (`c-kin.core.js`, `tools/lint-kin.mjs`). `A.KIN.take(p, words, o)` gives a living relative of those
kinds from the tree (one already known first, else one met now, the scene as the reason) or throws, which drops the card
(A.eventView skips a throwing setup). `A.KIN.cousinLike`, `A.KIN.nameOf` (a name for a token; none leaves it unfilled and
the scene drops), `A.KIN.spouseKin` (a spouse's parent from the tree, or one written into it as the spouse's parent),
`A.KIN.reveal` (a secret a story tells: the deathbed's half-brother, the brother sold to the galleys, the child you did not
know: written into the tree, flagged `c6revealed`) and `A.KIN.recognize` (a claimant the player acknowledges joins the tree
as a real relative's bastard, flagged `c6recognized`; without one, a friend). The last guard, `A.KIN.guard`, in `A.link` and
in `applyFx`'s `them.type`: a kin word given to someone the tree does not place becomes "acquaint" and is counted in
`A.KIN.strays` (not saved; the tests read it).

**One resolver for a house** (in `src/family/99994-v2-family/c-succession.core.js`, where the law lives): `A.HOUSE.resolve(hid)`
gives `{ head, heir, law }`; `A.HOUSE.settle(hid)` gives a house with a dead head its court lord or the dead head's
successor by law, through `A.setHead` (so `A.POSTS`' `house:<id>` stays the one record). The release's `A.kill` no longer
names an eldest son itself when the resolver is on the page; `F.inherit` (the one mover), `A.houseHead`, 99995's court and
`F.headOf` all read it.

**The parish** (`e-parish.core.js`). Each province has 31 seeds (a priest, a reeve, a miller, a smith, an alewife, a midwife,
a shepherd, twelve neighbours, twelve children born every other year around the world's first), derived from the world's
seed and the province; `A.S.parish.met` keeps only the ids of those met. `A.makeAcquaintance` (the release) asks
`A.PARISH.acquaint` first: a commoner at home meets the parish (a child its children) before any stranger.

**Nine months** (`d-births.core.js`). `A.familyYear` calls `A.conceive` where it gave birth: a conception on a day of the
year, the birth 262 to 280 days later (`A.S.pregs`), told to the household on the day ("Your wife is with child"). A woman
with child does not conceive again; a mother who dies first takes the child with her. lf_childbed ("The birth") comes only in
a pregnancy's last weeks and is then the birth itself.

## Edits outside the folder

- The release (`src/core/release/`): `A.link` (met, the guard), `applyFx` `them.type` (the guard), `A.makeAcquaintance`
  (the parish), `A.familyYear` (conceptions), `A.kill` and `A.houseHead` (the resolver), `A.marry` (met); event packs 04
  (deathbed secrets, fm_father_bastard), 07 (bd cousin), 08 (ct_bastard_claim), 10 (`prepF`'s uncle, aunt and cousin), 11
  (`kinPid`, `strangerPid`, the claimants, hs_blood_price, hs_n_wardship, the nephew), 13 (ss_zn_bloodcattle), 14 (two
  cousins), 15 (`known`, `inlawOf`, the twin, the grandchild, the knifed cousin, the grandmother's name, the poor cousin,
  lf_childbed). Every event keeps its audience class (`tools/release/identity-probe.mjs`).
- 99994-v2-family (the label of a household's people; the resolver), 99995-v2-nobility (the court lord's case goes to the
  resolver), 999990-posts and 9999-advisors (met), 50-arcs-kin (no uncle, cousin, son or aunt made; the sold brother and the
  secret child are revealed), 40-memory-peoples, 40-memory-realm-blood, 40-memory-regional-a (kin from the tree).
- `tools/lint-kin.mjs`, run by `tools/check.mjs`. The manifest names `households` on A.eventView, A.eventChoose and
  A.newGame, and `households.guard` on A.newGame.

## Measured by

| Test | What it checks |
| --- | --- |
| `c6Household42` | 42 births of seven ranks: commoners know at most 8, nobles at most 12; parents and living siblings known; no uncle, cousin, in-law or nephew; a grandparent only under the roof; nurse, maid and guard knight for every noble house, a tutor by seven; every entry says how it was met |
| `c6MetRecorded` | every entry made over 14 years carries a year, a place and a reason; the words read "Met ..., 1112." |
| `c6NoKinMinted` | 12 worlds x 30 years: no kin word for someone outside the tree, no blood relative created after the start except by a birth (secrets a story tells are counted apart) |
| `c6KinFromTree` | a scene's cousin is the tree's, met by the scene; an only child gets no sister; the guard makes a "sister" from nowhere an acquaintance |
| `c6HouseResolver` | the record, the post registry and the resolver name the same head of every house over 5 years; deaths pass to the named heir |
| `c6ParishSeeds` | seeds the same from the seed, nothing stored until met; a peasant child's playmate is of the parish, the same in two worlds from one seed; nobles do not meet it |
| `c6NineMonths` | births in many months, each 262 to 280 days after its conception; no second pregnancy at once |
| `c6OldSave` | a save without household, parish, pregnancies or met loads and plays on |
