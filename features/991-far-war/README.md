# War in the Far Lands

**Aspect:** War (round 10, lane 4: the Great Continent as deep in war as the Known World) · **Kind:** system, a generator and its data, no patches, no events.

99-far-lands gave every far realm an army borrowed from a Known World realm on the same ground, and nothing else of war: no styles, no orders, no Legends, no Masters. The lore (`canon/lore/war-and-legends.json`, `far-lands.json`) has all of it. This feature turns it into game data and puts it where the release, 32, 38, 48 and 68 already read.

## How it is added

Like the far lands themselves: everything is put in place when a game of the Great Continent opens (`A.FAR.install`, wrapped) and taken out again for any other game (`A.FAR.uninstall`). Every wrapper passes straight through while `A.FW.on` is false, so a Known World game is exactly what it was (`fwKnownSame`).

| Put in place | Where the game reads it |
| --- | --- |
| 118 far realms' doctrine slots, from their troop codes | `GD.DOCTRINE` (recruits, missions, the war room's troop list) |
| shares of men by troop code, from the lore composition | `A.compShares` (wrapped), so `A.tplDefaults` and `A.forcesInit` build each realm's divisions from its own army |
| division names by template ("Thousand of Horse", "Registered Division", "Banner", "Elephant Line", "Age-Set Regiment") | `A.tplDefaults` (wrapped) |
| two troop types the release lacks: **Scouts** (`SC`, from light horse) and **Engineers** (`EN`, from garrison troops) | `GD.TROOPS`, `GD.BN`, `GD.TROOP_SKILL`, `GD.TROOP_GEAR` |
| 44 battle tactics from the 23 templates (gate, pass and ford holding, the ring hunt, backward shot, howdah archery, the crossbow line behind a stream, ski and sledge raids, fire ships, boarding, beach landings…), each for the realms of its template; and copies of the release's realm-locked tactics (the bull's horns, the drum storm) for the far realms whose template names them | `GD.BATTLE_TACTICS` (`T.realms`) |
| 303 fighting styles (87 national, 188 chain, 28 household) with 1,250 techniques and 108 maneuvers | `LORE.styles`, and `GD.BATTLE_TACTICS['mv_' + id]` |
| 103 field orders | `GD.ORDERS`, companies built by the release's own `A.orderBuildCompanies` |
| 6 wants from the conflicts (one per pressing realm) | `A.CASUS.WANT` (68-casus-belli's table) |
| `GD.LEGEND_CAP` + 40 (the far lands' Legends) | 32-ladder, `A.orderRaise` |

**State** (far games only, optional): `S.fw = { v, p: { loreId: personId }, heads, cf }` and, on a Legend or a Master, `p.fw` (lore id, group, weakness, whereabouts). A save of the Great Continent loads them back (`fwSaveLoad`). No world data changes: the far map, realms and houses are `far@1` as 99 wrote them.

## 1. Armies

Each far realm's army is its lore army. The 20 codes the lore uses (SP XB GA HI MR LC AR EN MC HA HC SC LI EL OR CM PK SL AX GI) all have a troop type: 18 are the release's own, scouts and engineers are new. A war elephant counts 2.5 times its men on the rolls in the shares, a giant 40 times, so a realm with 120 elephants has an elephant line.

- **Doctrine slots** (heavy horse, light horse, elephants, heavy foot, spear, missile, other): the most numerous code of each class in the realm's composition. Taulen: MC LC – HI SP XB GA. The Khaganate: HC HA – – – – SC.
- **Divisions** from the release's builder on those shares, renamed by template. In a test world: 118 realms, 691 divisions; horse archers, crossbows, elephants, camels, marines, heavy horse, orc relay bands, giants, scouts and engineers all in the field. Taulen fields `Registered Division: HI MR SP SP SP SP XB XB XB`; the Khaganate `Thousand of Horse: HC LC HA HA HA HA`; Vahra a `Spear Host` and an `Elephant Line: EL EL EL HI SP SP SP`.
- **Doctrine** (`GD.DOCTRINES`): a far general who has chosen none fights by his template's (`A.doctrineOf`, wrapped; the player's stays a choice). Shock for the steppe, banner, elephant, bought and household templates; shield for river empires, highlands, holds, oases, monasteries and walled cities; supply for fleets, taiga, sea-hunters and the desert.
- **Tactics**: each template's lore tactics, offered to its realms in battle (`A.tacticsFor` reads `T.realms`).

## 2. Fighting styles

The 303 styles have the release's `LORE.styles` shape, so every system that reads styles reads them: `A.schoolList` (the national and chain styles' 275 schools, each seat a place on the map, entry rules `soldier`, `gentry`, `any`, `race:orc|halforc`), `A.npcStyles` (a far soldier is taught his realm's national style), `A.styleYear`, `A.learnStyle`, `A.setMainStyle`, `A.foundStyle`, `A.styleFighter` and so 48-fight-ladder's duels. Household styles are kept by a far house of their realm (the royal house first). A style's origin line is the game's own ("The way Taulen drills its soldiers, taught at the Ninefold Yard of Venshai."); its philosophy, strengths, weakness and technique lines are the lore's one-liners. There are no "style families" in the release beyond the three kinds and the weapon a style is for; those are kept.

## 3. Orders

The lore's 121 orders are 103 field orders and 18 organisations.

- **Field orders** (elite companies, sworn orders, guards, scout and ski companies, age-set regiments, canoe brotherhoods…) are `GD.ORDERS` entries: raised as a division of their realm by `A.ordersEnsure`, led, refilled and destroyed as the release's eight are, and joinable with `A.orderJoin` through `A.orderReqs`. Their size is the lore's (the Ninefold Crossbows are 6,000, six companies of 1,000), their troop is the lore's code, their ranks are their style's first four ("Spanner of the Ninefold Crossbows"), their kind the release's (order, guard, corps). What it takes: worth 77 for an order or a guard, 63 for a corps (50 for scouts), the troop's skill, birth for royal and sworn orders, an invitation for royal guards, the realm's faith for temple and monastic orders, the realm's people for orc, dwarf and giant orders.
- **Organisations** (spy services, a war council, schools, a judges' order, a secret society) have a seat, a head and ranks, and take no one who asks: they are not in `GD.ORDERS`.
- Every order has a **reputation group**, one of the lore's nine (the Khagan's Hands, the Three Walls, the Bought Blades, the Still Ones, the Old Bloods…).
- **Heads.** 70 field orders are led by the Master or Legend the lore names as their head; the rest get a leader from the release, trimmed by 32-ladder's cap.

## 4. Legends and Masters

The 40 Legends and 160 Masters are people on 1 January 1105, seeded once in a new far game before the orders are raised: their names and epithets, race, sex, birth year (so their age is the lore's), realm, the style they are known for (rank 5 for a Legend, 4 or 5 for a Master), arms for that style, and a home in the place the lore says they are (`Tsaidou`, `Khasgen`, `the Fish Quay of Lamhou`: the province of that name, else their realm's capital). Their body and skill are brought to their tier's worth a step at a time, with no dice: Legends 123 to 134, Masters 96 to 105.

- **Weaknesses** cost what they say: an eye costs instinct, a knee or gout speed, a shoulder strength, age stamina, drink will; "proud" and "reckless" become traits. The cost is taken first and is not trained back, so a Legend with a bad eye is a Legend with a slow left side.
- **The census** (32-ladder) counts them: in a test world 40 of 40 Legends are Legends and 158 of 160 Masters are Masters. Two realms (Hesh, Vahra) have six lore Masters; the sixth is trimmed to Elite by the same rule 32 uses, and is called "a Master by name, past the height of it". No realm holds more than 5 Masters. The world-wide Legend cap becomes 45 (the Known World's 5 and the far lands' 40).
- **Seek them out, train under them, duel them.** Their person card says who they are counted among, how they fight, their weakness, the price on their head and where they are, with three buttons: *Seek them out* (`A.travelTo`), *Ask to train under them* (in the same place, grown, free, the fee; a Master takes most who pay, a Legend whom it pleases, by renown and skill), and *Challenge to a duel* (the release's `A.interact` duel). A student is linked as the Master's pupil (so `A.teacherFor` finds him), learns the style, and gains a school year's style experience each year while they live in the same place. The Codex's power page names the far Legends by reputation group.

## 5. Generals, conflicts, sieges

- **Tempers** (38-orders): a far general with no temper of his own (no traits, or a tie) takes his template's lean: cunning for the steppe, fleets, taiga, forest and desert; cautious for river empires, highlands, holds, oases and walled cities; bold for banners, elephants, bought horse, households, age-sets, relay clans, outriggers and canoes. Far rulers in a test world: 44 bold, 38 cunning, 36 cautious, none steady.
- **Conflicts** (68-casus-belli): of the lore's ten, three start as wars on 1 January 1105 (Taulen against the Black Lamp, Vahra against Kethra over the Upper Plain, Busimo against Nkara over the lake islands), each with a casus belli that cites the want ("Taulen's old want: to burn out the Black Lamp before it burns another census roll. Also: the cause given, a holy war."). Six start as a want with a plan behind it (`r.csPlan`, `A.CASUS.WANT`): the Right Wing on the felt, Hesh on the Sau, Kemodari on the Strait, Thinsak on Pravith's throne, the South Chain on the Spear-Marshal's staff, Taulen on Ozand's silk. The Basins' boys is a grudge both ways and nothing more, because it is a secret. Every pair's relations fall (35 for a war or a want, 20 for the grudge) and each names the other a rival.
- **Sieges** (36): a far city's walls and size make its siege longer. A far capital's walls follow its template (walled river cities, oases, holds and canal cities keep walls 3; tent capitals and boat beaches at most 1). The siege counter of a far province moves 1/k of a day a day, k = 1 + the template's walls (capital only) + 0.3 × log2(people / 450,000), divided by 1 + 0.12 a battalion of engineers among the besiegers (up to 1.5). Venshai: k 1.74, 120 days against 69.

## Measured by (`test.mjs`)

| Test | Result |
| --- | --- |
| `fwArmies` | 118 far realms, 691 divisions from 23 templates; every doctrine slot, share and battalion names a troop type; HA XB EL CM MR HC OR GI SC EN in the field; scouts and engineers gone in a Known World game. |
| `fwStyles` | 303 of 303 styles resolve; 28 household styles in far houses; 108 of 108 maneuvers are tactics; 275 schools listed, 8 in Taulen; a far style learned, made main and fought with; a style founded; a Known World game has none of them. |
| `fwOrders` | 103 field orders raised and led (70 by their lore heads), 18 organisations, all with a seat and a group; a soldier of Taulen joins the Ninefold Crossbows as a Spanner. |
| `fwPeople` | 40 of 40 Legends at Legend worth, 158 Masters at Master worth and 2 trimmed; realms, styles, ages, homes and weaknesses as the lore; at most 5 Masters a realm; the person card; training under a Master. |
| `fwConflicts` | 10 conflicts: 3 wars, each casus belli citing its want; 6 plans and wants. |
| `fwFarPlays` | tempers; Venshai's siege 1.74 times as long; a duel with a Legend fought out; a year of war with battles in far wars; rendering changes neither the state nor the random stream. |
| `fwSaveLoad` | a far save loads back the same after a Known World game, with its Legends and orders. |
| `fwKnownSame` | 3 Known World lives of 3 years: the same state and stream without this feature, and after a far game in the same page. |

## Cost

A new far game takes about 0.6 s more (1.3 s in all on the shared machine). Raising 103 orders read 32-ladder's census once per order (4.5 s); while the far orders are raised at once, the census is kept up to date by hand (`A.ladderCensus` returns that copy for the batch). The page grows by about 600 KB (`a-data.core.js`).

## The data

`gen.mjs` reads the lore and writes `a-data.core.js`; `--check` fails when the checked-in file is not what the lore makes. It keeps ids, names, numbers, troop codes, ranks, schools and the one-line texts (a style's philosophy, strengths and weakness, a technique's line, an order's deed, a Legend's weakness and whereabouts). The prose (a style's origin, a Legend's deeds, mind and teaching, an order's history) stays in the lore.

## Limits

- **People per far realm are few.** A far realm has few named people besides its court, so a national style is carried by few people at the start; most far fighters met in the world are made as they are needed.
- **The lore's conflicts are read by hand** (`FW.CONFLICTS`): who presses whom, and whether it starts as a war, a want or a grudge. A new conflict in the lore needs a line there.
- **Organisations do nothing yet.** The 18 non-field orders have a seat, a head and a group, but no events, missions or way in.
- **A Master's school seat** moves a student to the province of that name when he enrols; the release takes the first province of that name in the realm, which is the right one for every far seat today.
- **Tempers are a lean, not a rule.** A far general's own traits still decide when they give a temper; the template only breaks a tie or fills an empty one.
