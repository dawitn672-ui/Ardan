# The living economy and the armoury: markets that run themselves, hundreds of arms, things with a past (E1, E2)

*Stamped 2026-11-13 02:45 ET · work items E1 and E2 (owner orders 28 and 29; placed by D-030) · by Fable 5.2 at maximum effort · a design for the owner to steer; nothing is built · supersedes nothing*

The owner's words: "The game needs a significant increase in the economic system: bigger markets simulating themselves as time goes on. 100s of new swords and other weapons of different qualities, items unique to only one person."

**The plan in short.**
- **One economy instead of three.** Three market systems run on top of each other today. They become one: a market in each of 281 settled provinces, each with its own store, moving every month by itself.
- **Things happen to markets:** weather, seasons, war, raids, plague, guilds, roads. The page says why in a line.
- **Merchants are people.** About 100 trading houses run about 240 caravans and ships on the map's routes. You can trade with them, ride with them, guard, rob or tax them.
- **Money has weight:** loans with pledges, crowns that borrow and default, coin that can be thinned.
- **You meet it at your rank,** in words and tipped scales. No percentages, no screens of numbers.
- **Hundreds of arms:** 110 drawn forms become about 850 kinds of weapon and armour (130 swords), each in five grades.
- **Things with a past:** named one-of-a-kind pieces the world tracks. One holder, never copied.
- **Lords arm their own men** as their purse allows. It shows at the muster and in the fight.
- **Cheaper than today:** a trial month ran in about 1.2 ms where today's layers take about 11. About 55 KB of a save.
- **Eight stages, each a version; eight choices for the owner** (§3.4).

Technical detail is in the sections marked **For the builders**. A busy reader can keep to §1.7, §2.5 and §3.4.

## Part 1 · E1, the economy

### 1.1 What the game has now, and where it stops

Measured by reading the code, the lore data and the features' own READMEs.

| | Today | Where it stops |
|---|---|---|
| Market systems | Three at once (CRITIQUE P10): the release's price drift, with about 700 dice of noise a month; 45-economy's store for each realm; 66-markets' 86 to 88 market towns | A town's store is a share of its realm's. The realm sets the price; the town bends it |
| Goods | 21. One, "Arms & armor", stands for every weapon | A sword's price never asks whether swords can be had |
| What moves prices | One harvest roll a realm each June, war demand, sieges, about 350 caravans a month | No weather: a famine stops at the border. Plague (57) touches stability only |
| Merchants | Lines in a list, crossing the map in a month | No names, no road; nothing to rob, hire or tax. 9995-trade-roads was built for the removed Far Lands and is `.wip` |
| Distance | Four steps from its makers a good costs ×1.06 (grain ×1.01) | Too mild to see |
| Money | Rank-table wages, a noble's flat 250 suns, fixed yields, `pc.debt` growing 12% a year, a lending card that won 36 times in 37 (T7) | Nobody pays anybody. The lore's 27 trading and banking houses, each realm's coin and its debts are names only |
| A ruler's forges | A separate layer (`r.ind`), seven classes of equipment | Reads no market |
| The player | One table of 21 prices | A peasant "does not trade"; a workshop pays about 40 suns whatever happens |
| Cost | About 11 ms a month (45: 6 to 7; 66: about 5); 66 is 8 KB of a gzipped save | |

### 1.2 The idea

Every settled province has a market: 93 cities, 123 towns, and 65 small markets at castles, oases and abbeys. The 25 wild lands have none. Each market holds a real store of each good. Land and workshops fill it. People empty it by their station (the poor eat bread and drink ale; the rich buy wine, spice and silk), and so do armies and workshops. Carters and caravans move it.

**A price is only a reading of how full the store is.** So every price has a cause the game can name.

### 1.3 Goods and crafts

28 goods, where today there are 21:

- **Food and drink:** grain, livestock, fish, salt, ale, wine, oil.
- **Materials:** timber, wool, flax, leather, iron, tin and copper, steel.
- **Made goods:** cloth, tools, arms, bows, harness, horses.
- **Luxuries:** spices, silk, furs, amber, pearls, ivory, dyes.
- **Silver,** for the mints.

New: livestock, ale, leather, tools, silver. "Arms & armor" splits into arms (hand weapons and shields), bows (with arrows and bolts) and harness (mail and plate): the classes armies already draw.

Crafts turn one good into another: wool into cloth; iron and timber into steel; steel into arms and tools; steel and leather into harness; timber and flax into bows; livestock into leather; grain into ale.

### 1.4 What moves a market by itself

| Force | What it does | How you hear of it |
|---|---|---|
| Harvest and weather | Nine weather lands, each with its year: fair, ordinary, wet, dry or hard. Neighbours tend to share it, so a drought crosses borders | June: "The summer is dry in the east." |
| Seasons | Grain comes in from June to December, wool at shearing, fish and salt in summer. Passes shut in winter | Spring bread is dearer than autumn bread |
| War | Armies eat where they stand. A mustering lord buys arms, harness and horses. A siege cuts a market off. The front (D-016's burn) spoils fields. A lost battle floods the nearest market with used iron | "Swords are cheap in Stagley since the battle." |
| Raids | Every route is safe, watched, risky or lawless, by unrest, war and patrols. Raiders take real cargo from real caravans | "Two trains lost on the Northmoor road." |
| Plague | 57's sickness now costs hands and mouths. A lord may shut the gates: dear inside, a glut outside. Afterwards hands are few and wages rise | "Chalk on the doors. The market is shut." |
| Guilds | A town's guilds are its workshops: how much, how well, and a master (a post, one holder). The trade law (9996) bends them: charters make less and better, open markets more and plainer | "The armourers take no orders till spring." |
| Luck of the land | Once or twice a decade in a realm: a vein found, a mine worked out, a new fair | The Annals (57) |

### 1.5 Merchants, caravans and routes

- **Carters** work between neighbouring markets every month, wherever the price gap pays for the cart. They have no names. They are why prices spread and why distance matters: grain goes a few steps, spices cross the continent.
- **Trading houses.** About 100: the lore's 22 merchant and 5 banking houses (Lunetti, Doravelli, Pell and the rest), and a lesser house, made by seed, for each city without one. A house has a home, a purse, a head (a post; an heir or partner follows) and one to four caravans, barges or cogs: about 240 in all. It weighs only the dozen markets its people know. A caravan is always somewhere: in a market, or so many days along a route. It takes the route's real time, pays tolls to the lords it passes, and carries news.
- **One route graph** serves journeys (9990), caravans, armies' supply (D12) and the drawn map (D9). Until D9 lands it is province borders and sea links, as journeys use now.
- **With a caravan you can:** trade with it in town; send goods with it; take a share in its venture; ride with it; guard it for pay (peace work for D11's branches); rob it (the cargo is real, and the house remembers); as a lord, toll it or patrol its road.

### 1.6 Booms, busts, coin and debt

- **The store in a word:** none, scarce, short, enough, plenty, glut.
- **The market's mood:** booming, busy, steady, slack, depressed. Trade and peace raise it. Famine, sack, plague, a shut road, heavy tolls and a failed lender lower it. A thriving market gains workshops, buyers of fine things and, slowly, people. Over decades a village market becomes a town and a sacked city dwindles: "simulating themselves as time goes on".
- **Debt.** A loan has a lender, a borrower, a term, a price in words (light, fair, steep, ruinous) and a pledge: a field, a shop, a toll, a sword. You can borrow and lend. A debtor pays from what he really earns, by his character; a default hands over the pledge or goes before the magistrate (the fix for T7). Lords and crowns borrow from the houses the same way: 20 of the lore's 34 realms start in debt to a named creditor.
- **Bust.** A crown that defaults can break its lender. A broken house calls in what it is owed, its caravans stop, its city slumps.
- **Coin.** Most realms strike their own (the lore names them). A crown short of money may thin it: good, clipped, thin, base. Prices there climb for a few years, wages follow late, lenders trust the realm less. Every sum is still shown in suns.

### 1.7 How you meet it at your rank

- **You see what your station would know.** A peasant sees his market and hears rumour; a merchant sees prices where his house has eyes; a lord his estate; a crown its realm. The war rule (D10), applied to money.
- **Words, a tipped scale, and the reason on a click.** A price reads "dear and rising". Pressing it says "two months of bread in store where six is usual; the eastern harvest failed". Coin, sacks and loads are numbers, as a person counts them. No percentages: interest is "eleven back for every ten", a tax "one sack in ten".
- **No new place.** The market is a sheet under your town, six lines at most; what you own is one card under You.
- **At most three money decisions a year.** Market news is a feed line; only a real stake stops a year (D-026). The cards are ordinary events, held to the event rules: 80 words, two to four choices, none obviously best.

| You are | What comes to you | What you decide |
|---|---|---|
| A peasant or serf | A **Bread** word on the Life page: plenty, enough, tight, hunger. Each autumn the harvest card: what the barn holds after the lord's share, and what is over | Sell now while every barn sells; hold for the hungry spring; carry it to the market town; keep seed. In a bad year: borrow from the miller, eat the seed, send a child into service |
| An artisan | Your shop earns the gap between what you buy and sell. Orders come as cards: forty spearheads by Michaelmas; a knight wants a sword | Take the order; buy iron ahead while it is cheap; the grade of your work (§2.7); guild business: prices, a rival, the master's seat |
| A merchant | Your house's page, the one place with a ledger: warehouse, carts and ships, and five openings in words ("Wool: cheap at Northmoor, dear at Venina, a fortnight by a risky road") | Send a caravan or go yourself; contracts (supply an army, buy a harvest ahead); lend; rivals to join or ruin. Your income is your trade, not a wage |
| A lord | Each autumn the steward's account in three lines: rents and harvest, mill and tolls, what arming the levy cost | Rents in a bad year; a charter or fair; tolls; patrols; a mill or granary; open the granary in a famine or sell dear; arm your men (§2.6); borrow |
| A crown, or its treasurer | The treasury card: demesne, taxes, tolls and mint in; court, host and debts out | The tax law (56); keep the coin good or thin it; borrow, from whom, on what pledge; forbid grain to leave in a famine; pay or default |

A peasant's October:

> **The barn.** The reeve counts out the lord's share and goes. What is left feeds five mouths till next harvest, with eleven sacks over. Grain is cheap: every barn in the valley is selling.
>
> *Sell the eleven sacks now · Keep them for the hungry spring · Carry them to Northmoor yourself · Sow the far strip with them*

### 1.8 For the builders: the model, the budget and the saves

**The model.** A plain engine module, `src/economy/engine/` (`market.js`, `routes.js`, `houses.js`, `money.js`), unit-tested in node. One feature binds it to the game and replaces `45-economy` and `66-markets` (to `archive/`, with 9995, whose venture scenes are ported); the release's `A.mktMonth` hook comes out. Content is data: `data/economy/goods.json`, `needs.json` (four classes of people by 28 goods), `crafts.json`, `houses.json`, `weather.json`.

- **Store:** integers, hundredths of a load; 281 × 28 = 7,868 cells. Need, the season's normal store and the price are worked out each month, never saved: `price = base × clamp(√(normal ÷ store), 0.6, 4) × the realm's price level` (45's curve, which its tests already hold). Whatever feeds the state uses only + − × ÷ and √, so every browser agrees.
- **The month, in fixed order:** make (land × season × weather × hands × harm); use (people, armies, workshops); carters on every open route, from the month's opening prices, applied together; caravans arrive, sell, plan, leave; lords and crowns buy; spoilage. **The year:** weather, moods and sizes, the houses' books, loans, the price level.
- **Dice:** its own seeded stream (`seed:eco`, position saved), as the map has, so tuning it does not move the world's dice. CLAUDE.md names only `A.rand`: record the exception (game rule 10).

```
S.eco = { v, r,                                        // version; the economy's own dice
  w:  [a year's weather for each of the 9 lands],
  st: [281 markets x 28 stores],                       // hundredths of a load
  md: [281 x [mood, hands, size]],                     // small integers
  H:  [[home, coin, headPid, known markets]],          // about 100 houses
  C:  [[house, kind, at, to, daysLeft, cargo]],        // about 240 caravans
  L:  [[lender, borrower, sum, price, due, pledge]],   // loans, 400 at most
  px: { realmId: price level } }
```

**The budget.** The A1 gate (`tools/bench/press-gate.mjs`) allows a quiet month 150 ms of CPU, and the engine alone takes 80 to 170 (D-023). The economy must get cheaper.

| | Today | Budget | Evidence |
|---|---|---|---|
| A month (one Next month) | about 11 ms | 6 ms median, 10 at worst | A throwaway trial on typed arrays, `docs/design/trials/economy-month.mjs` (281 markets, 28 goods, 744 routes from the lore map's borders, 240 caravans each weighing 12 known markets): 1.1 to 1.4 ms median in node here; about 2.5 ms with 40 goods and 480 caravans |
| A year (one Next year) | about 0.13 s | 0.1 s: twelve months and a 30 ms year step | a quiet year costs 1.3 to 1.55 s in all today |
| Year 50 against year 0 | | ×1.1 | fixed-size arrays, capped logs |
| Drawing | a 21-row table | no full redraw of its own; 2 layouts; only when open | `999999-one-redraw` |
| Save | 8 KB gzipped (66), plus 45's tables | 35 KB gzipped, flat for ever | the trial's stores: 15 KB; houses, caravans and loans about 10 |

Kept in memory, never saved, rebuilt from the map: the route graph, shortest paths (on demand), each province's yearly output, each market's needs. Nothing is cached by what the player does (45 once keyed a cache by initiative, and leaked). `tools/bench/economy.mjs` runs centuries and trader bots without a browser; the press gate prints the economy's share.

**Old saves.** `A.SAVE_VER` goes up by one; a step "economy" joins `A.V2SAVE.upgrade` and draws no world dice. A realm's old store is shared among its markets by need, so its totals do not change. New goods start at a normal store; old arms split 5 : 2 : 3 into arms, bows and harness. `pc.debt` becomes one loan from "the moneylenders", `r.debt` one from the realm's lore creditor (and stays readable as a sum). Then `r.mkt`, `S.mt` and `S.eco` go. Every sample save in `tests/saves/` must load and pass the new checks.

Kept for the 50 places that call `A.mkt` and the 51 that read `GD.GOODS`: `A.mkt(rid)` as a read-only view of the capital's market, `A.buyPrice`, `A.sellPrice`, and `A.MT.byRealm()` (9996's shires stay a realm's one to four chief towns).

## Part 2 · E2, weapons, armour and one-of-a-kind things

### 2.1 What the game has now

- **103 kinds of gear in seven slots:** 35 hand weapons (13 swords), 12 bows, crossbows and thrown, 21 body armours, 13 helms, 9 shields and off-hand pieces, 8 mounts, 4 cloaks.
- **Four grades** (crude, common, fine, masterwork), as multipliers. Masterwork is sold in 9 realms.
- **A person has a kind and a grade in each slot** (`p.gear`, `p.gearQ`). No piece is itself: no maker, age, wear or past. The armourer has everything, always.
- **The one famous sword,** Kestrel (53-arcs-things), is an epithet and a grade. Nothing tracks it.
- **Armies issue a fixed kit** by troop type (`GD.TROOP_GEAR`). A lord's wealth changes nothing.

### 2.2 The library: hundreds from a few rules

A kind of thing is a **form**, made in a **style**, from a **material**.

- **110 forms,** one drawing each: 16 swords (long knife, short sword, arming sword, falchion, messer, sabre, longsword, estoc, greatsword and more), 7 axes, 10 maces and hammers, 6 spears and lances, 9 polearms, 6 daggers, 7 bows, 4 crossbows, 5 thrown, 2 staves; 15 body armours, 15 helms, 8 shields.
- **10 styles,** the families of dress (C8): North, Court, Highland, Desert, Coast, Savanna, elf, dwarf, orc, giant. A style is a few words, a hilt or a rim, and a small lean.
- **Materials:** iron, steel, fine steel; ash, yew, horn; linen, leather; and three that one people makes: crucible steel (the desert), dwarf-steel, silver-steel (the elves). Today's Chanari, dwarven and elven blades become these.

A trial run of the rules (`docs/design/trials/item-kinds.mjs`) gave **845 kinds: 549 weapons (132 swords) and 296 pieces of armour.** In five grades that is over 4,000 different pieces to meet. About 60 more are written by hand: oddities, and each unique's own pattern.

**For the builders.** Seven files in `data/items/`, about 15 KB on the page; `A.ITEMS.build()` expands them at boot.

```
forms.json      { "id": "sword.arming", "name": "Arming sword", "slot": "weapon", "skill": "sword", "hands": 1,
                  "dmg": 11, "spd": 1, "reach": 1, "pierce": 3, "base": 35, "of": "blade",
                  "styles": ["north", "court", "highland", "coast"], "legacy": "arming" }
styles.json     { "id": "north", "word": "Northern", "mark": "hilt.north", "lean": { "pierce": 1 } }
materials.json  { "id": "fine-steel", "of": "blade", "ramp": "steel.bright", "price": 1.6, "pierce": 1, "wear": 0.7 }
grades.json     { "id": "fine", "dmg": 1.1, "prot": 1.12, "price": 2.6, "pierce": 1, "finish": "g3", "maker": "expert" }
uniques.json    name, kind, grade, maker, year, mark, past, first holder
also            handmade.json (whole kinds), names.json (words for pieces named in play)
a kind's id     sword.arming.north.steel
```

The fight numbers are today's, so `A.fighterFrom` does not change. `legacy` is the old `GD.GEAR` key a form stands for. `tools/items/lint.mjs` holds: ids unique, every form in the parts list, numbers inside their family's band, every old key covered.

### 2.3 Grade, material, maker, age and wear

| Grade | In words | Made by | In play |
|---|---|---|---|
| Crude | bad iron, uneven temper | apprentices, village smiths | cheap; wears fast; may fail you |
| Plain | honest work | any journeyman | today's "common" |
| Good | sound and well fitted | a good shop | the new step |
| Fine | true steel, careful hands | an expert | bites deeper |
| Masterwork | a named master's best, a handful a year | a master | quicker, bites deeper, wears slowly |

The four old grades keep their numbers, so today's fights do not move.

- **Maker.** A fine or better piece carries its maker (a smith who exists, or a town's guild) and its year. A master's mark raises the price; a dead master's work grows dearer.
- **A town sells what its makers can make.** The grades on offer follow the guild's standing. Today's nine master guilds are the start.
- **Wear:** sound, worn, battered, broken. Fights and campaigns wear a piece; rust takes a neglected one. A smith mends it for coin; a masterwork needs a master, or comes back merely fine. A broken blade can be reforged and keeps its name. Wear changes only when something happens: no monthly pass over items.
- **Age** adds worth ("your grandfather's sword"), never strength.

### 2.4 How quality shows

- **In a fight.** Grade and material move the same numbers as today; odds stay words and a scale. The card says it: "Your blade: fine steel, sound. His: a crude chopper." A battered piece can fail, and the report names it. In levies (`VS.gearMult`) grade joins the armour's kind, held to the skill's table: a levy about 1, a knight 5 to 7.
- **In the price.** Form × material × grade × condition × maker × what arms cost in this market this month. When a duke is arming, a plain sword is dear and the stall is thin.
- **In words,** never bare numbers: "Quick, a fair reach, bites through mail," with a scale against what you carry.
- **On the figure** (C8). One drawing a form; the rest is layers.

| Layer | Key | What it shows |
|---|---|---|
| Form | `look` (`sword.arming`) | the silhouette, and where it hangs: hip, back or hand |
| Material | `mat` | grey iron, bright steel, dark dwarf-steel, pale silver-steel |
| Grade | `g0` to `g4` | crude: an uneven edge, hammer marks. Good: clean lines. Fine: a fuller, a wire grip, brass. Masterwork: engraving, gilt, a stone in the pommel |
| Style | `st` | the people's hilt, haft or rim |
| Wear | `w0` to `w3` | nicks, rust, dents, patched mail |
| Owner | `coat` | the owner's heraldry on shield and surcoat |
| Unique | `u:<id>` | its own hand-drawn mark |

At 46 px: silhouette, colour, one glint for fine and better. On cards: the fittings. At full figure: engraving and wear. The key joins the portrait's cache key; drawing stays pure. New art: about 72 weapon forms, 8 carriers (scabbards, quivers), 10 style sets, 5 finishes, 4 wear sets; the armour forms are in C8's dress count already.

### 2.5 One-of-a-kind things

A unique is a piece with a name, a mark and a written past. For example:

> **Kestrel.** An arming sword of the North, masterwork, a kestrel's head on the pommel. Forged at Kingsmere in 1041. Carried by Captain Marrok at the ford, 1067. Pawned, 1102.

- **Where they come from.** About 100 at the start, written by hand: each crown's regalia (a claimant who holds them sits firmer), the great houses' ancestral arms, the orders' blades, a dozen lost in barrows. Then a few a year: a master's best work, and a plain blade that earns a name by a deed many saw. Your masterworks as a smith count.
- **One holder.** A unique is in exactly one place: a hand, a house's hall, a stall, a lender's chest, a grave, or lost somewhere. Each move writes a line: forged, named, given, inherited, bought, won, looted, stolen, pawned, lost, found, reforged.
- **Never copied.** An event grants a unique by its id. If it is elsewhere the grant is refused, and the event must offer a copy, which has no name. Kestrel's own arc already ends that way.
- **How they pass.** By the house law at a death. As gifts: a wedding, a lord's reward. As loot: the victor may take a named foe's arms (your choice; by temper for others). By theft. As pledges. By burial and, generations on, by finding.
- **They are known.** A famous blade is recognised. Its old owners' kin may want it back; a stolen one is hard to sell near home.
- **Famous, not magic.** A name gives renown and unease, never more than a grade is worth.
- **Yours are never lost by a silent roll.** Always a card.

### 2.6 Armies armed by their lord's purse (D11)

- **Whoever arms men keeps an armoury:** the crown for its royal knights, each great house, each order, each company. A noble owes men by his rank (D-012); his armoury is four measures (arms, bows, harness, horses) of how well he can outfit them.
- **A lord spends part of his estate's income (E1) at his own market each year.** So arms run short and dear when many muster. A rich wool county's levy has helmets and jacks; a poor hill barony's carries bills and no mail.
- **Each contingent has a kit word:** ragged, plain, well-armed, fine, splendid. Ragged men fight about a fifth worse, splendid ones about a quarter better, so ground, arms and tactics still decide. The muster says it: "The Duke came with 600 where 900 were owed, half of them without helmets."
- **No horses, no knights.** A branch cannot be raised without its class of kit.
- **A soldier is issued from his lord's armoury,** may bring his own, and hands issued kit back when he leaves the post (A2). Named men carry their own tracked pieces; common soldiers are counted, never tracked.
- **The crown's forges** (`r.ind.stock`) become the crown's armoury and buy their iron at market.

### 2.7 Smiths, stalls and the market (E1)

- **Smiths** turn steel into the bulk goods (arms, bows, harness) and, from the best of it, a trickle of fine pieces.
- **The stall.** A market's smiths' row shows 4 to 12 pieces. Plain and good ones come by rule from the town's style, its guild's standing and how much arms it holds this month: the same town in the same month shows the same stall, and nothing is saved. With them stand the tracked pieces that are really there: a caravan's foreign blades, a dead knight's harness, a forfeited pledge.
- **A commission.** Ask a named smith for a form he knows, in a material the market has ("no good steel this year"). Wait one to six months; a year for a masterwork. His craft decides the grade (`attempt()`). As a smith yourself, the same roll is yours.

### 2.8 For the builders: state, tracking, old code and saves

```
S.items = { n, r,                                       // next id; the items' own dice (seed:items)
  I:  { id: [kind, grade, wear, made, makerId, at] },   // tracked pieces: about 400, capped at 600
  U:  { id: [name, mark, [[year, how, who, where], ...]] },   // uniques: capped at 300, 12 lines of past each
  nm: { personId: name },                               // names in the pasts (the dead are pruned after 30 years)
  ar: { ownerId: [arms, bows, harness, horses] } }      // armouries, 0 to 100 each
p.it = { weapon: itemId }                               // only tracked slots
```

- **Tracked:** all the player owns (what is worn, and a chest of 12), and a named person's fine-or-better pieces. Everything else stays a kind and a grade, as now.
- **The same every time.** Ids are given in order, never reused. A piece moves only through `A.ITEMS.move`, in engine code: a death, a duel's or battle's end, a default, and a yearly pass that draws a few moves between other people (a wedding gift, a pawn, a theft) from the items' dice. Drawing a screen moves nothing.
- **Old code keeps working.** About 200 places read `p.gear` or `GD.GEAR`: `p.gear` and `p.gearQ` stay as a mirror, written whenever a piece moves. The 45 or so places that write gear directly, and the 75 events that grant it by its old key, go through one function (`A.ITEMS.set`); a lint forbids new direct writes. New code asks `A.ITEMS.of(p, slot)`. A new effect key, `fx.item`, is declared in `A.FX_EXTRA`; `fx.masterwork` makes a real piece.
- **Cost and saves.** Nothing by the month; a yearly pass over at most 300 uniques; 20 KB gzipped at year 60, capped. Old saves: each slot becomes a piece of the kind its old key names, at its old grade; a life that finished Kestrel's arc gets the real Kestrel.

## Part 3 · Building it

### 3.1 Stages: each a version, with its tests and checks

Order: E1a, E1b, E2a, E1c, E2b, E1d, E2c, E2d. Items arrive early; the deepest money comes last, so it can be cut. Each stage ends as every step does: tests, the coherency run, a playtest pass (asked "why is bread dear here?", a playtester answers from the screen 8 times in 10), the records, a pre-release version with its release branch and a sample save. The last is the milestone `release/v2.5-economy`. Sizes as in CRITIQUE §2 (L about a week, XL longer). Engines: Opus 5.5. Data, cards and screens: Sonnet 5.5. A Fable 5.2 review before E1d.

| Stage | The player gets | Leans on | New tests | New coherency checks |
|---|---|---|---|---|
| **E1a** One market model (L) | Nothing new to see: 281 markets under today's goods and screens; the old layers retired | nothing | In node: the goods ledger holds for 200 years on 20 seeds. In the page: 45's and 66's tests ported (famine triples grain, siege bread); a bulk good four steps out costs ×1.15 or more; a greedy trader ends under ×1.3 of an estate; month cost; save size; old saves; the same world looked at or not | one market a settled province; no store below zero; the goods ledger balances; no price out of bounds |
| **E1b** Weather, war, plague, raids; 28 goods; the peasant's year (L) | The Bread word, the harvest card, the market sheet with reasons | nothing | a drought crosses a border; a cut route widens the gap by 30% in 6 months; a shock halves in 6 to 18 months; no percent sign or bare number in any economy view; the peasant's band | every weather land has its year; a shut market trades nothing |
| **E2a** The library and tracked pieces (L) | Stalls, five grades, wear and repair, your chest | E1a (drawings at E2d) | 500 weapons and 100 swords or more; the lint; old grades' numbers unchanged; the skill's worth table; old saves keep their gear | every worn piece is a known kind; `p.gear` mirrors the pieces |
| **E1c** Houses and caravans; orders; the merchant's page (XL) | Caravans on the map, to trade with, guard, rob and toll | D9's routes (or borders) | a caravan never jumps; tolls paid equal tolls received; robbed cargo is somewhere; merchant bot against estate; merchant and artisan bands | a caravan is in one place; a house has one living head |
| **E2b** Uniques (L) | Heirlooms, loot, recognition; Kestrel made real | A2's registry (or its own check) | 200 years on 5 seeds: none in two places, none made twice; an heirloom follows the house law; replay identical | one place per unique; the dead hold nothing; no pledge pledged twice |
| **E1d** Coin, credit, estates, treasuries, moods (XL) | Loans, the steward's and treasury cards, booms and busts | X2's single `applyFx` | the money ledger over 60 years: coin appears and vanishes only on logged lines; the price level stays in bounds for 200 years; lending no better than a venture at equal risk; noble and royal bands | the money ledger balances; every loan has a living lender and borrower, or their heirs |
| **E2c** Armouries and the muster (L) | Kit words, muster lines, issued kit, loot gluts | D11 | the richer lord's levy is better armed in 9 seeds of 10; choices still move a battle by 15% at every rank (`rankfx`) | an armoury has one living owner; issued kit is counted once |
| **E2d** On the figure (L) | Every piece drawn, by grade and wear | C8c | every form draws at three sizes; agents order five grades of one sword at 240 px, 8 times in 10; `renderRng` | |

### 3.2 Risks

- **Every purse moves.** E1a changes no rule of income. Each later stage holds the balance league, or re-centres a band with its reason in `targets.mjs`.
- **Runaway worlds** (a famine that never ends). Bounded curves; the world makes a little more than it uses (45's rule); 200-year runs nightly, in node.
- **Too much to learn.** Words, three decisions a year, the "why is it dear" playtest. Cut depth before adding a screen.
- **A wide reach into old code:** about 250 gear sites, 100 market sites, 75 gear events. Mirrors and views first; one function for every write.
- **It leans on D9, D11, C8c, A2 and X2.** Each has a stand-in above. Nothing blocks E1a, E1b or E2a.
- **The world's dice move once,** when the release's price noise goes. Record it, as D-021 did.
- **Art:** about 100 new drawings inside C8's 600 KB.

### 3.3 What to cut first, if it is too much

1. Thinned coin and the price level (loans stay).
2. Crowns that borrow and bust (personal loans stay).
3. Markets that change size.
4. Named caravans (carters stay; caravans become news lines).
5. Uniques named by deeds (written ones and masterworks stay).
6. Wear and repair.
7. An armoury for each house (one a realm; lords differ by seed).
8. The seven new goods (the arms split stays).

Not to be cut: one market model, the node engine and its long runs, one place per unique, screens in words.

### 3.4 Decisions for the owner

1. **How many markets?** (a) One in every settled province, 281, in three sizes. (b) Only the 93 cities, the country priced from the nearest. (c) Stay near today's 86. *Recommended: (a).* It is the "bigger" you asked for, and the trial says it is cheap.
2. **How many goods?** (a) Stay at 21. (b) 28, as §1.3. (c) 40 or more. *Recommended: (b).* Enough for arms, bows and harness to matter; few enough to know by heart.
3. **Merchants you can meet?** (a) Named houses and caravans on the roads, to trade with, guard, rob and tax. (b) Unseen traffic, as now. *Recommended: (a).*
4. **Should your income follow the economy?** (a) Yes: a peasant's year hangs on the harvest, a merchant earns from trade, a lord from his land. (b) Keep fixed pay, with the economy as colour. *Recommended: (a),* one rank at a time. Without it the economy is scenery.
5. **How deep should money go?** (a) Loans only. (b) Also crowns that borrow, default and break their lenders. (c) Also coin a crown can thin. *Recommended: (c), built last,* so it can be dropped.
6. **How many grades?** (a) Four, as now. (b) Five: crude, plain, good, fine, masterwork. (c) Seven. *Recommended: (b).*
7. **Armour on the figure.** (a) One body armour, a helm and a shield, with arms and legs drawn as part of the body piece. (b) Separate arm and leg pieces to buy and lose. *Recommended: (a).* The figure is fully dressed either way (order 27).
8. **Named things: famous or magic?** (a) Famous only, and never destroyed: only lost and found again. (b) Small magics. (c) They can be destroyed. *Recommended: (a).* It keeps 53's rule that nothing is magic.

If items matter more to you than markets, say so: E2a can come straight after E1a.

### 3.5 Records to add when this is approved

- **DECISIONS:** this plan with the owner's answers; the economy's and the items' own dice; the world's dice moving once; 45, 66 and 9995 to `archive/` at E1a.
- **CLAUDE.md** (`data/economy/`, `data/items/`, `fx.item`, the bench), **the `life-sim-systems` skill** (markets and items, once the numbers are proven) and **PROGRESS** (the eight stages).


## Part 4 · The owner's answers (2026-11-13 06:21 ET, D-032)
Where this part differs from Parts 1-3, this part wins.
- **Markets:** 281 (choice 1a).
- **Goods:** at least **40**, raw and finished, every one with a use a player feels (food and drink, clothes, tools,
  light and soap, medicine, horses and carts, books, luxuries, arms and armour). Part 1's list of 28 grows by finished
  goods; the budget holds because goods are data and the month's work grows with markets × goods (re-measure at E1a).
- **Merchants by standing:** a house's answer to a summons depends on the asker: duke (days), count or baron (weeks),
  knight or rich burgher (go to them), commoner (cannot seek them; chance meetings at markets only). Rank, fame, wealth,
  past dealings and debts move the wait and the terms. Words, never numbers ("The Vell house will send a factor before
  the month is out").
- **Income in direct correlation only:** no realm-wide pay multiplier; income moves through the player's own goods,
  custom, rents, tolls and the purse of whoever pays them.
- **Money:** all of it (5c), built last.
- **Rarity and make:** two measures on every item: rarity (common, rare, epic, legendary) and make (crude, plain, good,
  fine, masterwork). A forging takes the smith's skill, the material's grade, the forge and time, and rolls both:
  material and design mostly set rarity, skill mostly sets make, and either can surprise. Legendaries are only fine or
  masterwork. The item library keeps both on each item; prices, fights and the figure read both.
- **Armour:** every piece separate (D-032 item 7); C8's figure draws each as its own layer.
- **Legendaries:** near-indestructible, heirlooms and national treasures; they outclass all ordinary gear, but skill
  still decides most fights, and owning one draws thieves, claimants and kings.
