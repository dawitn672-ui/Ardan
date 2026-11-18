# 9999952-men: sworn, enlisted and conscript men (W1-4)

**Aspect:** War, stage W1-4 of `docs/design/war.md` §16 (§10; the owner's order 54, answer 5: "remove levies: there is
conscription, mandatory service when it is needed, but armies are built on honour and those who choose that path").
**Kind:** system: five readable core files and one event pack, with small calls in the release source, 45-economy,
04-world-fixes and 23-ui-e. **Design:** `docs/DECISIONS.md` D-064 points 7 and 8; this stage's choices are D-086 to D-090.
Every decision goes through `A.WHY.decide` (rule 18).

## What it does

**The levy is retired** everywhere it lived: the troop, the yearly tax of men, the law, its events and its words. Retired
code is in `archive/w1-4-levies/` (the release's emergency call-out and its law). The old fields are read as the design
says (`a-convert.core.js`, on load): the pool `r.levy` is the roll `r.roll`; the levy law `r.laws.levy` is the conscription
law `r.laws.conscript`; a house's levy (its full strength) is `h.men`, a vassal's `contract.levy` is `contract.men`; levy
troops (`GD.BN.LV`) are conscript foot. That file is the only one in the game's source that names the old word
(`w4NoLevyLint`).

**Three kinds of men** (`b-men.core.js`, `A.MEN`):

| Kind | Who | How many | Read from |
| --- | --- | --- | --- |
| Sworn | knights, men-at-arms, retinues, the orders and guards | about 1 in 400 of the people, always under arms | `A.MEN.of(r).sworn`; a division of an order, a guard or mostly heavy horse is sworn (`A.MEN.kindOf`) |
| Enlisted | the regiments a treasury pays (the war map's divisions), and **the roll**: volunteers who drill and march when mustered | regiments by the treasury (the release's training rule); the roll fills toward 1 in 100 (`A.MEN.rollCap`), a little faster than the old pool did | `r.army` less any conscripts; `r.roll` |
| Conscripts | men taken by lot for a named need | nothing in peace | divisions with `d.call`, and the men waiting at a call's musters |

Where the release weighed a realm by "its army and a share of its pool" (its strength, a faction's share of the swords, a
campaign's numbers), it reads `A.MEN.reserve(r)`: the roll and the conscripts its own law lets the crown call on its word.

**Conscription by proclamation** (`c-calls.core.js`, `A.CALLS`). A crown at war calls only for a named need
(`A.CALLS.need`): an enemy host on home soil (up to the last call), a stronghold besieged or a host lost (up to the second),
fewer spears than the enemy (the first; the second when the first is out and not enough), or, under the crown's-right law
and a proud, ambitious king, his will (the first, the most resented). The crown decides through `A.WHY` (kind
`conscript`): the need against the fields (heavier at the harvest), the commons' memory of the last call, a shaking
throne, a roll still full, a call beyond the law (the lords must consent), an empty treasury. Three calls, by lot:

| Call | Hearths | Term | Working men taken |
| --- | --- | --- | --- |
| The first | one in 20 | one season (182 days), home by harvest | about 3 in 100 |
| The second | one in 10 | up to a year | about 6 in 100 |
| The last | one in 5 | while the enemy stands on home soil | about 12 in 100 |

**Each lord raises it in his own lands** (`A.CALLS.lands`: every province goes to the command whose seat is nearest, the
crown's capital or a tenant-in-chief's seat; `A.CMD`). Each tenant-in-chief answers through `A.WHY` (kind `raise`): in
full (his oath, the enemy in his own lands), half (the harvest, his tenants, his grievance, the last call remembered) or
late (his grievance, a faction that wants the king weaker). After a month or more of drill by the sworn men the men form
**conscript foot** (`d.call`, at most 16 divisions of 8,000 a call; the rest wait and fill the gaps) in their lord's
contingent (`d.own`), armed from the realm's armoury as far as it goes. They are never trained from the roll, never
refilled from it, and go home (not onto the roll) when disbanded.

**Hands in the fields.** `A.CALLS.fields(rid, month)` is the share of the working men out, twice it in the reaping months
(July to October), at most half: 45-economy's output of every good in the realm is multiplied by it, and the crown loses
half that share of a month's taxes. The dead do not come back: each province's people fall by its share of them.

**The end of a call.** When its need passes or its term is up the crown decides (kind `release`): send them home, home
with a bounty, or hold them (a broken promise, counted against him). At peace every call ends.

**The grievance** (`A.CALLS.weight`): the call's degree, the months held, the dead, a held term; light for the realm's own
doors (×0.5), heavier for a war of the king's (×1), heaviest for his will (×1.5); eased by a bounty (×0.7), a victory
(×0.6) and a term kept (×0.8). It is remembered as `r.callGr` (six, fading by half every three years: a yearly pull on
stability, read by the next council as "the commons remember"), on each province it touched (unrest), on each lord whose
tenants went (`h.callGr`, his opinion of the crown, `A.CMD.grieve` for W1-6, and a lord's anger, an `A.WHY` feeling), and in
the realm's war weariness (the peace faction's want).

**Following, desertion and mutiny** (`d-ledger.core.js`, `A.LEDGER`). Once a month each division in an army of a realm at
war reads its ledger: what holds it (the oath, pay on the day, their own doors, faith, a captain who knows his trade,
victories, years together, deep enemy country, plunder hoped for, the provost) and what pulls at it (hunger from the war
map's supply, pay in arrears, the harvest at home, half the company gone, a defeat, winter, a term served and still held,
home near). Desertion is worked out from the gap, with no dice: about 2 in 100 a month at a gap of one for conscripts,
6 at two, 10 at three; roll men ×0.6, enlisted ×0.35, sworn ×0.03. Each desertion is written with its two heaviest pulls
(`A.S.deserts`); a third of the deserters hang, a third turn brigand, a third creep home. **A mutiny needs three parts**:
a grievance (pay, bread, the harvest, a broken term), a voice (an old soldier or a sergeant, named from the division's id)
and an occasion (a defeat, the term's end, winter quarters, the harvest month, pay day missed). It climbs a rung a month
while all three stand (grumbling, a deputation, refusal, leaving in a body) and falls back when one goes; at the deputation
the commander decides through `A.WHY` (kind `mutiny`): pay, promise, punish the voice (works only if the provost is feared
and loyal men are at hand), give way (the company goes home), or speak (his command).

## What the player sees (`e-player.core.js`, `men.events.js`)

- **A commoner** whose parish a call reaches has his hearth's lot drawn (unmarried men first, never a hearth's only man
  but at the last call, priests, officers, millers and smiths spared): **mn_lot**, four choices: go (into his lord's
  conscript foot), buy a substitute (coin; the parish sees who paid), hide (a check; caught, he goes with a fine), take to
  the roads (no recruiter takes his name again). He may still volunteer and enlist through the army path.
- **A ruler** is asked to proclaim (**mn_proclaim**: no call, or each call the need allows, with what it costs) and at the
  term's end (**mn_release**: home, home with a bounty, held). His choice is written into `A.S.why` as his own.
- **A soldier** sees, on the War tab (`UI.menCard`), his realm's open call and his company's ledger in words: whether it
  holds, what holds it, what pulls at it, any mutiny with its grievance and its voice. Notes open on a tap; no numbers.
- The release's scenes of a man taken for service (`lf_lover_to_war`, `wr_hf_lot`, `ss_rp_muster`) fire only while a call
  is out in the realm; the old heavy-law card `pl_heavy_call` is retired in favour of mn_lot.

## State (all optional; old saves load)

`A.S.calls` (open calls and the last 12 ended, each with at most a realm's provinces), `d.call`, `d.mut`, `d.led`,
`d.lossSeen`, `r.callGr` (six), `r.callAsk`, `r.callNeed`, `r.menAtWar`, `r.arrears`, `h.callGr`, `A.S.deserts`,
`A.S.mutinies` (forty each), `A.S.desertTally`, `pc.mil.call`.

## Measured by

`test.mjs`: `w4NoLevyLint`, `w4ThreeKinds`, `w4CallsAndFields` (no need at peace; the need named; the share each call takes
of the working men; the fields and 45-economy's output), `w4Desertion` (conscripts against sworn men; every desertion with
two reasons; war.md §10.5's lab: unpaid three months, 10 of 10 desert or mutiny; paid, fed and winning, none),
`w4MutinyThree`, `w4OldSaves`, `w4Player` (375 by 667, 44-point targets, no percentages), `w4Deterministic`. The core
suites' `renderRng` and `replayWithRender` hold the views pure.
