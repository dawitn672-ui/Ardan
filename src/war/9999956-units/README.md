# 9999956-units: units that differ (D11-2)

**Aspect:** War, stage D11-2 of `docs/design/war.md` §16 (§14.1, §14.2, §14.3; the owner's order 54: "why should one unit
need aptitude in every single aspect of war? The training system should be dynamic, tailored to each unit's composition,
abilities and tendencies"; and "when in an army it took a year and months to be given my first mission"). **Kind:**
system: four readable core files, one event pack and two data files, with small calls in 9997-companies, 9999952-men,
99997-v2-war, 999911-d9-ground and the release's `18-event-view-a.js` and `23-ui-e.js`. **Design:** D-116 to D-121.
Every decision goes through `A.WHY.decide` (rule 18).

## What it does

**Drills and duties as data.** `data/military/drills.json`: 36 drills in war.md §14.2's eight families (standing,
shock, loose order, shot, fieldcraft, works, the march, the sea). Each drill names the branches it belongs to, the
war-map drill it feeds (60-unit-drill's `GD.DRILLS` key, which gates and strengthens tactics in battle), the ground it
needs (open, forest, wall, river, coast), the skill its teacher must know, the tendency it mends and the task it
prepares. `data/military/duties.json`: ten duties in peace.

**A company is three things** (`a-units.core.js`, pure readings):

1. **Make-up** (`A.UNITS.makeup`): its branch (the troop's, or the support company's), its men, veterans against raw men
   (the record's experience), conscripts, its two sergeants (9997's seeds), its captain's temper.
2. **Abilities** (`A.UNITS.grade`): a grade in each drill of its branch's list, in words (never drilled, half-drilled,
   drilled, hard-drilled). Every company's grade is read from what the war map keeps (the division's drill of that
   family, the record's experience) with its own small difference by its seed; a company the player drills in keeps its
   own grades on its record (`b.dg`).
3. **Tendencies** (`A.UNITS.tend`): what it is like, from its own ledger (`b.td`, three at most, written after every
   fight on the war map: it broke before horse, it held, it chased too far, it lost a quarter of its men; with the
   place and year) and from its captain and men (a bold captain lets it chase; a cautious one, or conscripts, is slow
   to form; a raw company is raw).

**The syllabus** (`b-syllabus.core.js`, war.md §14.2): worked out, not chosen from a list. Its branch's own drills it
lacks or holds low; what its coming task needs (a war, horse among the enemy, a siege, a march); a remedy for a bad
tendency; less what the ground and teachers at hand cannot give (a river for bridging, a wall for ladders, the coast; a
sergeant, or the player, who knows the drill). Four to six offers, each with its reasons. **The month's drill:** a
captain (the player at captain or above, on the War tab) picks one or two; else the company's captain decides through
`A.WHY` (kind `drill`). The drill's grade rises (less each time, faster with a better teacher, faster driven hard), the
others fade, the division's war-map drill gains the company's share, and men driven hard go winded. A soldier's or
sergeant's company drill is a scene he is in (`un_drill`) every fourth session; the release's drill scene for an officer
comes every eighth month of drilling, a count where it was a roll (lint-reasons 42 → 41).

**Support branches have companies of their own** (D-117): a scout, an engineer, a man of the train or of the guard, up to
captain, stands in the support company his branch mans (Outriders, Sappers, Siege train, Quartermasters, Banner guard)
where his host has one; a commander leads a wing of a combat battalion.

**Service** (`c-service.core.js`):
- **Duties in peace:** the company always has work. Its captain chooses a duty for his reasons (kind `duty`: the branch's
  own work, brigands in the province, the tax season, a broken road, the lord's errand, a raw company, the coast, a
  hostile border, the law of the butts; not the one it has just done). It runs three months; its card (`un_duty`) comes
  when it starts; each month in it is practice. A new soldier's company has one in his first month. At war the war
  gives the work.
- **Transfers:** once a year another branch's officer may ask for a soldier or sergeant whose skills fit that branch
  better than his own (the muster-master's reading, by a margin), through A.WHY (kind `transfer`); `un_transfer`.
- **What a role changes on campaign** (D-120), read where each measure lives: the standard-bearer, signaller, cook and
  farrier raise the company's morale at rest (9997's `CO.restVal`/`CO.restOne`, named among its parts); the surgeon's
  mate's battalion keeps more of its wounded; the forager brings in more bread and angers the land less; the train and
  a clerk stretch a day's bread; the provost's man, the clerk and the bearer are holds on the ledger (9999952-men); a
  pathfinder or a scout sees a march further on campaign (99997-v2-war's sight); the carpenter's or an engineer's
  division attacks over a river at less cost (999911-d9-ground).

## What the player sees

The War tab's **Your company** card: its name; its make-up in words; its best drills; what it is like; this season's
syllabus with each offer's reason (a captain picks one or two with 44-point buttons); what is not offered and why; its
duty and the reason. Notes open on a tap. The cards `un_drill`, `un_duty`, `un_transfer`.

## State (all optional; old saves load)

On the player's company record: `b.dg` (its drill grades), `b.sy` (the last drill). On any record that fought: `b.td`
(three tendencies). On the player: `pc.mil.syl` (a captain's picks), `pc.mil.duty` (`{ k, d0, d1, why }`),
`pc.mil.unN` (sessions), `pc.mil.trAsk`. Records in `A.S.why`: kinds `drill`, `duty`, `transfer` (W1-2's caps).

## Measured by

`test.mjs`: `unData`, `unSyllabusArm` (war.md §14.3: no syllabus offers a drill outside its branch's list; every company
of a world), `unSyllabusHistory` (§14.3: two companies of one branch with different histories get different syllabuses
at least 8 times in 10), `unRolesMove` (§14.3: each role moves its measure in a lab), `unFirstDuty` (§14.3: a new
soldier has a duty or task within three months in 19 careers of 20), `unSupport`, `unDrillMonth`, `unTransfer`,
`unView` (375 by 667, words, 44 points, pure), `unOldSaves`, `unDeterministic`.

## Left for D11-3

Each branch's ladder of posts, its missions and pay (rebased, W11); a role's line of promotion; peace service counting
toward promotion (R12: the duty's merit is a start); NPC companies keep derived grades (no stored drill of their own).
