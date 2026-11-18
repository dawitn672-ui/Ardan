# 9999955-muster: the muster (D11-1)

**Aspect:** War, stage D11-1 of `docs/design/war.md` §16 (§14.1, §14.3; D-012 feudal armies; the owner's order 54: "when
choosing what path you want to go in the military, pay more attention to the weapon under use, the method of combat they
prefer, as well as their aptitude across any skill that could be made use of in context even outside of combat").
**Kind:** system: four readable core files, one event pack and two data files, with small calls in the release source,
9997-companies, 9999952-men, 59-descriptions and 99999-v2-renown. **Design:** `docs/DECISIONS.md` D-064 point 16; this
stage's choices are D-110 to D-115. Every decision goes through `A.WHY.decide` (rule 18).

## What it does

**Branches as data** (`data/military/branches.json`, `A.DATA['military/branches']`, read by `a-branches.core.js`): fifteen
branches of a feudal army: the lances, the light horse, the Scout Regiment, the spears, the men-at-arms on foot, the bows,
the crossbows, the siege engineers, the garrisons, the train, the ships' companies, the household guard (the crown's
royal knights), the elite orders, the hired companies and the conscript foot. Each names its arm of service (the release's
`GD.ARMS`), the war map's troops it fills (`GD.TROOPS`, in order of preference) and the support companies it mans
(`GD.SUP`), the weapon skills it uses, its ways of fighting, the aptitudes a muster-master prizes in it, what it needs
(a horse, mail, a bow, birth, a coast, an oath), what it beats and what beats it, its drill families (war.md §14.2), its
duties in peace, three missions and a way out. **Roles** (`data/military/roles.json`): clerk, forager, pathfinder,
farrier, surgeon's mate, signaller, standard-bearer, provost's man, cook and carpenter, each with its skill, the least a
captain takes, its pay, what it adds to a company, when it is most wanted, its line of promotion and its work.

**The muster** (`b-reading.core.js`). A man goes to the muster of the command whose land he lives in: the crown's, or a
great lord's (the province's nearest seat, as `A.CALLS` raises men), or his own house's when it holds of the crown; a lord
whose command has no host on the map sends recruits to the crown's. A free company keeps its own table. The muster-master
(a seed name of the command) **reads** him:

| He weighs | From |
| --- | --- |
| The weapon | the weapon skills (sword, spear, bow, riding) and what he carries (a horse, mail, a bow or crossbow) |
| The way of fighting | his body (each stat against his own mean) and his temper (`A.WHY.temper`): the shock, the wall, the press, loose order, the shot, stealth, works, steadiness |
| Every useful aptitude | command, stewardship, the sea, tracking and woodcraft, a trade, medicine, letters, horses, music, faith, stealth, trade, siegecraft |
| Birth and people | his station (the lances and the guard take men of birth; a noble is wasted in a file); an elf's bow, a dwarf's mine, a big man's size |
| Who speaks for him | a kinsman or friend holding a company or a wing in the realm (`A.POSTS`) |
| What the command lacks | the men short in its companies, by branch (9997's company records) |

Each branch open at that muster (its troops raised by the realm; a ship's company only where the realm has a coast; the
guard only for birth or a patron there) is an option with those reasons, and the command decides where it would have him:
**one `A.WHY.decide`** (kind `muster`), the decider the command's owner (the king, or the lord through `A.WHY.houseMind`),
whose temper bends the reasons. A draw among close options is a stream keyed by the recruit and the day (`MU.rng`), so a
muster never moves the world's random stream. The **offers** are the chosen branch and those within reach of it (at most
three), each with its two heaviest reasons; one door he will not open is said aloud ("No horse, so not the lances").

**Enlisting as scenes** (`c-enlist.core.js`, `md.events.js`). The War activities *Enlist in the army* and *Join a
mercenary company* go to a muster (`A.MUSTER.go`): **md_muster** reads the man in words and offers the branches, each with
its reason, and a way home. His choice calls the release's `A.enlist(pc, merc, { branch, cmd, company })`. When a scene of
the release swears him in with no branch (a sergeant at the tavern, a host marching by), the muster-master writes him down
by his own decision and the same card follows, so he may ask for another of the offers (`A.MUSTER.assign`: his troop, arm
and company change, and his old company's post is left). **The lot makes no offers:** a man taken by lot is conscript foot
(9999952-men's `CA.pcGo` passes the branch). The branch fixes:

- his **troop** on the war map (the first of the branch's troops his realm raises; an elf's bows are elven, a giant's
  foot are giants), and the arms it carries;
- his **arm of service** (`pc.mil.arm`), so the release's old card that asked a sergeant a year on "where he belongs" is
  not asked (CRITIQUE W2);
- his **command** (`pc.mil.cmd`) and a host of it for his troop nearest his home (`A.MUSTER.seat`), in which 9997 places
  him in a company.

**Roles.** His captain (a person when the company's captain is one, else the company's seed) decides through `A.WHY`
(kind `role`) whether to offer him a role: at the muster, and every six months in service for a soldier or sergeant. The
reasons: his skill against the role's least; the company's own holder (a seed man, by hash; the player is offered it
only when better); a war for the forager, surgeon, pathfinder and signaller, peace for the clerk and carpenter; the
branch's work for it (a farrier for the horse, a carpenter for the engineers); against, the line wants every man, a
sergeant has his section, a new man. **md_role** offers it; a role pays its suns each month and teaches its skill
(`A.gainXp`, practice); **md_role_duty** is its work in service (do it properly, a check; let it pass; give it up). An
officer (captain and above) hands the role on, and so does a man moved to another company. One holder a role a company.

**One glossary of rank and unit words** (R14, `A.MUSTER.post`): every panel that says what the player leads (the Path
card, the chain of command, the rank's description, the War tab) reads one function: the rank's word (W1-1), the rank's
unit (a section, a company, a wing, a host, an army) and the men of the post he holds (his company's, his wing's, his
host's, his army's), else the unit's usual size. `A.milUnitWord` says those units (the release said "file", "hundred",
"regiment", "battle"); a promotion's line says "You now lead a company of about 200" (`A.milUnitPhrase`); and
9997-companies' places follow the five ranks (grades 3 and 4 hold a company, 5 and 6 a battalion's wing).

## What the player sees

- **md_muster** at the muster or the company's table: where, who reads him, three things he sees, a door he will not
  open, what the command lacks; two or three offers, each "The bows: you can draw a bow"; *Thank him, and walk home*.
- **The War tab** (`UI.placeCard`): "Captain: a company of 196, the bows"; the branch and its command; a tap on *what they
  are* opens the branch's description, on *in the field* what it beats and what beats it; its work in peace; his role
  and the road on from it. Notes open on a tap (44 points); no percentages.
- **md_role** and **md_role_duty** in service.

## State (all optional; old saves load)

`pc.mil.branch`, `pc.mil.arm` (set at the muster), `pc.mil.cmd` (the muster's command id), `pc.mil.mustered`,
`pc.mil.role` (`{ k, co, y }`), `pc.mil.rlAsk` (the day a captain last weighed a role), `pc.flags.md_walked`. An old save's
soldier reads his branch from his troop (`A.MUSTER.branchOf`; written at the first month). The muster's records go into
`A.S.why` (kinds `muster` and `role`, W1-2's caps).

## Measured by

`test.mjs`: `mdData` (every troop, support company, arm, skill and way the data names exists; no retired word),
`mdSpread` (war.md §14.3: 200 musters of varied recruits in coastal and landlocked realms: no branch offered first to more
than a third, every offer with its reasons, the first offer moved by the weapon; a recruit who knows the sea offered a
ship's company where his realm has a coast and never where it has none), `mdLabs` (the bowman, the rider of birth, the
tracker, the craftsman, the steward each offered his branch), `mdPlayerMuster` (375 by 667, 44-point targets, no
percentages, at most 80 words; the choice fixes branch, troop, arm and command; no arm card; the War tab; walking home),
`mdSceneAndLot` (a scene's enlistment decided through `A.WHY`, the card after it, a change of branch; the lot's conscript
foot), `mdRoles`, `mdWordsAgree` (R14 at grades 0 to 6 on the Path card, the chain of command and the War tab),
`mdOldSaves` (every sample save loads, its soldier reads a branch, plays a year), `mdDeterministic`.

## Left for D11-2 and D11-3

Companies of the support branches (a scout or engineer stands on the roll of a battalion of his troop until then, D-113);
what a role moves on campaign (straggling, wounds, bridging); transfers offered in service; the syllabus and duties in
peace (D11-2); each branch's ladder, missions and pay (D11-3); the orders' trials and the free companies stay their own
features' doors.
