# Kin and blood

**Aspect:** Events (Road to Ten, Events 3 and 4) · **Kind:** 13 story arcs in 58 trigger-only scenes, one effect key (`fx.akin`), one wound, no patches. Runs on the story track of `46-life-arcs`, so it needs that feature in the build.

The plan asks for "60 long arcs of 3 to 8 stages over 2 to 20 years: a blood feud, a secret child, a rival's rise…" (Events 3), and that "every arc end with a lasting change: a title, a bond, a wound, a law, or a province on the map" (Events 4). This package is the kin-and-blood share of that: 13 of the 60, alongside the rivals (51), the world (52) and the things (53).

**What it does.** Each arc is a run of scenes years apart. Every choice leaves a mark, and later scenes read it: their text changes, and so do the choices they offer and what follows. The people in an arc are real people in the world, kept on the arc's own state. The cousin who takes the keys in the first scene is the one with the man of law in the third. The child you denied at the door is the one in the lock-up at Amberwick. Sums are sized to the life: "a quarter of all you own" is shown in suns. A price has a floor and then takes a share of what is left, so it means something to a pauper and to a magnate alike, and a purchase you cannot afford is not offered.

| Arc | Scenes, years apart | What happens | How it can end (each ending leaves an `ak_` flag and something below) |
| --- | --- | --- | --- |
| **The feud** | 6, 1-3 | A cousin dead in the mill-race after a quarrel over a mare; the rick-fire; three of them on the market road; the dean's kiss of peace; your young kin and theirs in the tithe barn; the old man's deathbed. If he dies first, his son takes the quarrel. | A peace sworn with his heir; *the Unforgiving* and an heir who is your enemy; the mill-right in writing |
| **A child you did not know** | 5, 1-3 | A letter from an old lover (as a man), or the child you bore and left with the nuns at your door (as a woman); an apprenticeship and whose name goes on it; your spouse works it out; the lock-up; the register. | The child written in as your son or daughter (a bastard, among your heirs); a purse and no name; a grudge |
| **Your uncle's mill** | 4, 1-2 | No will; your cousin nursed him; the housekeeper's sworn word; the manor court. | The mill (a property) and a cousin who will not come to the feast; the mill given away and a cousin who weeps; a handshake at the door; an appeal |
| **The one who came back** | 5, 1-3 | An elder brother or sister sold to the galleys in the famine year; the bailiff from the port; the eldest's share; the marsh fever. | Sworn kin again; a passage paid and a ship round the point; "no blood of yours" |
| **The match** | 4, 1-2 | A rich family's offer for your son or daughter (they are married); the letters stop; a bruise on the stair; the bishop's court. | The marriage undone; kept at home, married or not; sent back with a priest to watch |
| **The bastard of the house** | 4, 1-3 | A claimant with your grandfather's nose and a contract; the blind priest who witnessed it; the family council. | Named kin and sworn to the family; the court's word; paid to ride away |
| **What runs in the blood** | 5, 1-4 | Your aunt's dancing hands; your own at table; a physician writing a book; "hold it out flat and count to a hundred". Whether it is in you is settled, unseen, at the first scene. Looking only decides when you learn it. | A trait for how you meet the years (diligent, gregarious, stoic) and, if it is in you, *the shaking in the hands* (a permanent wound: -4 speed, -2 insight, worse at craft, music, the bow and medicine) |
| **The carter's child** | 5, 2-4 | A five-year-old asleep on your step after the sweating fever; "the carter's leavings"; an uncle with a lawyer's letter; apprentice, soldier or at your side. | Written in the register as your son or daughter (an heir you can play on as); given the carter's name and road; gone by the next spring |
| **The night road** | 4, 1-2 | Unmarried, in love with the reeve's son or daughter, who is promised to a widow or widower with a mill and a cough; the hedge-priest over the hill (you are married); the brothers in the yard. | Home together; a cottage of your own at the next town; parted |
| **The will** | 4, 1-3 | A parent lately dead leaves you the house on two conditions, and a sealed letter for five years on; the companion by the fire; a buyer for the road frontage. | The letter says the house was won with a weighted bone: given back, paid for, or the letter burned |
| **The red cow** | 4, 2-4 | A great-grandfather's unpaid dowry, forty suns and a red cow, now with sixty years' interest; the bailiff; a match to settle it. If the creditor dies, his son has the paper. | Paid and burned; *of the Red Cow*, paid exactly as written; left to your heirs |
| **The old ground** | 4, 1-3 | Your family's name on six stones at another town's church; the grazier's price; old cottager on the low field. | Bought back (a farm, *Crow Hill, the old family ground*) and your name cut beside theirs; left to the cottager's family; sold again; the stones carried home |
| **Your father's other house** | 4, 1-3 | Your father buying ribbon at another town's market; the woman and the half-brother or half-sister (a real person in his family tree); his sickbed or his funeral, both houses there. | Called brother or sister in the street; a gift and distance; no family of yours |

Lasting change, by the plan's words: a **bond** (sworn ties, kin written into the register, marriages made and undone, strong opinion either way), a **wound** (the shaking), a **title** or **name** (*the Unforgiving*, *of the Red Cow*), a **law** or standing (a court's word on the family name; a dowry burned or passed down; flags later scenes read), and a **home** or **property** (the mill, the farm on the old ground, a parent's house, a cottage). A province changing hands on the map is not among them: these are family stories.

**How it runs.**

- **Starting.** `46-life-arcs` runs one story arc at a time. When none is running, one starts with a chance of 1 in 48 a month, chosen by weight from those whose `start` holds. Most kin arcs are open to most grown lives. Some only start in a window: the night road needs you unmarried and 17 to 34, the other house a living father, the match a son or daughter (or, with your father dead, a younger sibling) of 15 to 30, and the will a parent dead within three years. The match weighs 2 and the will 4, so they come up while their window is open.
- **The people.** `A.AKIN.get` keeps each person on `pc.arcs[key].who`, and `A.AKIN.name` keeps made-up names and places on `.nm`. A real relative is used where one fits: your cousin for the mill, your lover for the night road, your dead parent for the will, your living father for the other house. Otherwise someone is made to fit. Names in an arc do not repeat.
- **`fx.akin`** covers what the release has no key for: write a child into the register (`acknowledge`, `adopt`: into `pc.children`, so among the heirs), marry or part (`wed`, `unwed`), marry off or free a son or daughter (`wedKin`, `unwedKin`, `wedMatch`), grant or sell the arc's property (`house`, `farm`, `mill`, `sell`; granted once per arc, named), and the sickness (`fate`).
- **Memory across arcs.** If you have told your family about the shaking, the match's offer says the other family has heard and asks anyway. With a bastard of your own in the register, the claimant's scene says it is harder to sneer. A half-sibling from the other house is remembered when your own secret child arrives.

**Measured by.**

`test.mjs`, on `--only=life-arcs,arcs-kin`:

| Test | Result |
| --- | --- |
| `kinArcsRegistered` | 13 arcs, 58 stages (average 4.46; 5 arcs of 5 or more). Every stage is trigger-only, every choice (both sides of a check) carries `fx.arc`, the last stage ends the arc, and every way out of it carries an `ak_` flag plus a lasting key (trait, epithet, wound, rel, asset, sworn, deed, a register or marriage effect, or an opinion move of 20 or more) |
| `kinArcsPlayThrough` | Every arc played to its end on two paths: first choice, checks won, 2,000 suns; and last choice, checks lost, 20 suns. All 26 runs complete. No raw token, no text over 80 words, no label over 12, never fewer than 2 choices shown. 45 of 45 later scenes read differently by path. The last choice changed the state every time, e.g. the secret child: *child + tie + bond* / *grudge*; the brother: *sworn* / *enemy* |
| `kinEffects` | Acknowledging puts the child in `pc.children` as a bastard and among `A.heirsOf`. Adopting gives your name and siblings. No bigamy. A marriage made and undone. A farm granted once, named, then sold. The sickness gives no wound when it is not in you, and one wound (lower speed) when it is. A son married off and freed |
| `kinArcsStart` | A life fitted to each arc can start all 13. A child can start none. A married life gets no night road, both parents living no will, no father no other house. On the track, one runs at a time and a finished one does not come again |
| `kinOldSave` | An arc state saved without its people brings on its next scene with stand-ins; a life with no `arcs` field plays on |
| `kinBotLives` | see below |

`kinBotLives`: 18 bot lives, 3 per start (serf, peasant, artisan, merchant, noble, royal), up to 64 years, one engaged bot per start.

BOTRESULTS

Lint: `tools/lint-events.mjs` passes (58 events, 406 renders, 0 errors, 0 warnings). `tools/lint-choices.mjs` finds 0 obviously best choices (21 events compared by numbers; the rest differ in what they change). Both pass on the private build and on the full world.

BALANCE

**Rules kept.**

- Everything random (who is made, a name, the fate in the blood) is drawn in a scene's setup or its effect, which the engine runs once per queued scene. The Life tab card is `46-life-arcs`'s and only reads.
- `pc.arcs[k].who` and `.nm` are new fields; a save without them gets stand-ins. Names are plain words.
- No patches. `A.applyFx` is wrapped, calling the original first. The one data addition is `GD.WOUNDS.ak_shaking`; every engine read of a wound already tolerates an unknown key.
- Event text that has an empty variant is tidied of double spaces by a wrapper that hands the original source to `A.evAudience` and the bot's memory index.

**Limits.**

- **Needs `46-life-arcs`.** Built with `--only=arcs-kin` alone, the scenes exist but nothing starts them. Build with `--only=life-arcs,arcs-kin`.
- **It shares one track.** In the full world, the 51-53 arcs compete for the same one-at-a-time track, so a life meets fewer kin arcs than the numbers above. The test asks only for what holds in both builds.
- **`46-life-arcs`'s own test counts every arc's stages.** `everyChoiceMovesTheArc` expects exactly 40 stages and will read 40 plus every story arc's. That test needs to count only the life arcs (`!a.story`). The fix is in a folder this package does not own.
- **Families, not the map.** No arc moves a border. The plan's "province on the map" is for the world arcs (52).
- **Some consequences are words.** The will's two conditions are kept by the story, not enforced by the engine. Selling the house breaks them only in honour. A NPC son or daughter married off does not set up a household the economy sees. The secret child's other parent, if made up, has no life before the letter. The sickness is a fixed wound, not a disease that progresses.
- **The writing is one writer's.** Each scene was read on both paths before it shipped, but no human playtester has retold one of these stories yet.
