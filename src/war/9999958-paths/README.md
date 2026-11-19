# 9999958-paths: the military path (D11+)

**Aspect:** War, work item D11+ (`docs/PROGRESS.md`; `docs/design/war.md` §14.1, §14.2; the owner's order 54 on the
military path: "pay more attention to the weapon under use, the method of combat they prefer, as well as their aptitude
across any skill that could be made use of in context"; orders 59 and 63: growth is not a timetable). **Kind:** system:
two readable core files, one event pack and `data/military/paths.json`, with small calls in the release
(`08-soldiering.js`, `23-ui-e.js`), 9999955-muster (a role offered by a rung) and 9999957-ladder (the board reads the
road). **Design:** D-128 to D-132. Built on A.MUSTER (the branch, the reading's way of fighting), A.UNITS, A.LADDER and
S1's skills (`A.SK`: `A.gainXp`, talents, specialisms, concepts and proofs).

## What it does

Each branch has a **road** through the five ranks (`data/military/paths.json`, `A.PATHS`). At each rung it names:

| | For example |
| --- | --- |
| What the rung trains (shares of a month's effort) | a lancer: riding, a sword, then command and tactics; a sapper: timber and stone, then works; an archer: the bow; a scout: tracking, woodcraft, stealth |
| The trial that proves a man at it | "the butts before the company: twelve in the clout at two hundred paces"; "a bridge of boats laid before the master"; "a sentry taken without a sound" |
| What the board weighs for the next rung | an archer's captaincy: command and the bow; a sapper's command: tactics and craft; the train's: stewardship |
| The role it opens | the scout's road the pathfinder's work; the train's the clerk's, then the forager's |

and the **specialisms** the road leads a man to by his way of fighting (the reading at the muster): the war bow for a man
of the shot, the bill and pike for a man of the wall, the lance for a man of the shock, carpentry or masonry for a
sapper.

- **Training on the road** (`A.PATHS.month`): half a month's effort, split by the rung's shares and bent by his
  talents (a gifted hand gets more of it, a slow one less), through `A.gainXp` as practice, with the road named as the
  cause. The release's year in the ranks (`A.milYear`) drills the rung's first skill, not the troop's weapon.
- **The trial** (`pa_trial`): when he stands at the edge of a word in the rung's trial skill, its concepts grasped and
  wanting a proof (S1's `C.ready`), the card sets the trial; standing it is S1's proof (the `proof` key) and is recorded
  (`pc.mil.trials`), and the board weighs it.
- **The specialism** (`pa_spec`): when the road's skill has room for one (Advanced and up) and he has none of the
  road's, the card offers his way's (and the road's own, when it differs), or to keep to no one way.
- **The role** a rung opens is offered once at that rung by his captain (A.WHY kind `role`, `only` that role).
- **The board** (`A.LADDER.mod`) weighs the road's next rung's wants and the trials stood at this rung.

## What the player sees

The War tab's **Your road** card: the road's name; what this rung trains, in words, with his aptitude for each ("tracking
and scouting (gifted)"); what proves a man here; what the next rung wants and, on a tap, where he stands in each (the
level's word and his gift); his way with the road's skill, or where the road leads a man of his way; the role this rung
opens. No numbers, no talent letters. The cards `pa_trial` and `pa_spec`.

## State (all optional; old saves load)

`pc.mil.trials` (`[skill, year, rung]`, eight at most), `pc.mil.paTr`, `pc.mil.paSp` (the day of the last trial and
specialism card), `pc.mil.paOpen` (the rung whose role was offered).

## Measured by

`test.mjs`: `paData`, `paRoadsDiffer` (a lancer, an archer, a sapper and a scout, the same man in the same world, two
years at peace: each road grows its own key skill more than any other road grows it; the plan follows the talent),
`paTrial`, `paSpec`, `paBoardAndRole`, `paView` (375 by 667, words only, 44 points, pure), `paOldSaves`, `paDeterministic`.
