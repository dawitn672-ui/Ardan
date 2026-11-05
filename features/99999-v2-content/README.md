# 99999-v2-content: text that fits the scene and the character

**Aspect:** v2 playtest 1 (`docs/v2/playtest-1.md`), findings 9, 10, 11, 18 and 19, plus the War Room's numbers and two percentages left in World › Diplomacy and the realm tab · **Kind:** system (6 core files), 7 patches, small edits to `97-life-fixes`, `50-arcs-kin` and `87-echoes`, tests. No new events.

## What it does

### The memory insert is rare and true (`a-weave.core.js`, #9)

67-memory-weave put a memory on about half of all cards, often a wrong one: "In 1106 you tried to walk, and failed. You have not forgotten it, and it makes you slow." on a knife fight at 12. Now a memory is cited only when it bears on the scene:

- **The same person** (67's person rule): only a memory that weighed. That means a change of regard of 8 or more, or something that lasted (hurt, the law, a loss or a gain, shame, a name).
- **The same scene** (the again rule), as before.
- **The same kind of act:** a check of the same skill in the same kind of scene. 67's skill rule allowed any scene.
- **The same kind of place** (the place rule), as before.

Some memories are never cited:

- anything from before 7, so no infancy milestone;
- a deed that does not read as a past deed (`MW.pastDeed`: "you tried to spy while you are there", "before you pay", "every name she says");
- a deed that needed the scene's title in brackets to say what "it" was;
- a deed that names its own person twice;
- a coin sum that cannot be the scene's own (over 2,000 suns).

**At most one memory in 10 cards.** The record counts the cards: `pc.mw.n` is the number of choices made, and `pc.mw.lw` is the card of the last memory. Both are written in `A.eventChoose` and in the event's setup, the engine's own steps, so a replay does the same. An old save has neither field and starts at zero.

Measured in two played lives (`v2cMemoryRare`): about 5% of cards carry a memory, against 45% before.

### Voices and counsel only where they fit (`b-lines.core.js`, #10)

**An inner voice** (9992-identity) speaks only when all of these hold:

- the scene has a check, and you are 14 or older;
- it is the voice of the skill the check tests. A thought you hold speaks only when the check tests what the thought changes. A trait voice speaks only in a fight or a talk.
- a line that names a thing speaks only where the scene has that thing: a fever, a baby, the law, the dice, the grain, his hands (`A.V2C.REF`). A line about "him" needs a him.

The filter wraps `ID.voiceCore`, which the card and `A.eventChoose` both ask, so the line a life "has heard" is the line it was shown.

**Counsel** (9999-advisors) comes only on the big choices that 9999's README promised:

- the scene's condition reads a ruler, a war, an office, a holding, a claim, an oath or a faction (not `!C.ruler(p)`);
- its effects touch war, a claim, a pact, death, prison, a marriage, an asset, a promotion or a post, the treasury, legitimacy, stability, authority, or 9996's bills and offices;
- it costs 100 suns or more, a wound of 20 or more, or a lethal fight;
- or it is a `po_`, `ri_`, `co_` or `cb_` scene.

A once-a-life scene, an ordinary duty (`du_`), or a spar no longer counts as big on that alone. There is no counsel under 15.

**At most one extra line on a card:**

- one counsellor, not two or three;
- no inner voice on a card that has counsel, a memory or 57-world-chronicle's recalled line;
- no recalled line on a card that has counsel or a memory.

### Class gates (`d-gates.core.js`, patches, #11)

- `lfx_du_gd_apprentice` ("Your apprentice has ruined a week's work") needs a master (`minR: 2`), and so do `du_gd_undercut` ("Someone is undercutting you") and `du_gd_caravan` (your own caravan). The first is an edit in 97; the other two are patches `V2C-UNDERCUT-MASTER` and `V2C-CARAVAN-MASTER`.
- **A new audience class, `shop`** (`A.EV_RX.shop`, `A.CX_RX.shop`): a scene whose words say "your shop", "your apprentice", "your customers" or "your caravan" reaches only a life with a shop or a master's rank, unless its condition already asks for one.
  - It does not read a clerk (a general's, a ruler's and a reeve's clerks hid their scenes), words the scene shows only under its own test (`${hasAsset(p,"workshop")?" of your own workshop":""}`), a shop still to come ("you may open your own shop"), or a scene whose condition reads a flag: that scene follows one that put the life there (the dwarf partner's workshop, the smith's apprentice, the royal bowyer). CI run 88 found these hidden from the lives they were written for (`mpeMemory`, `mpfMemory`).
  - `A.evAudience(e).txt.shop` reports the gate's reading, so a lint of the classes an event's text trips sees what the gate does.
- **97's five study scenes have an age, and letters where they read:** the disputation needs 15 and letters (it came at 8, "at the cathedral school"), the chained library 13, the sum in beer at the inn 14, and the map and the window 12.
- **No Latin in Ardan.** The examination (`V2C-NO-LATIN`), 50-arcs-kin's contract and 87-echoes' two scholars say Old Solen, Ardan's learned tongue (`GD.LANG_LIST`).
- **"Laugh, and buy the whole tavern a drink (5 suns)"** needs 16 years as well as the coin (`V2C-TAVERN-ROUND-ADULT`). 9998-stakes draws a locked row only for a requirement it can read, so a penniless 14-year-old no longer sees it.

### Playtest 2, old #11 (patches, `f-roles.core.js`)

- **The runaway** (`lf_teen_runaway`, patch `V2C-RUNAWAY-BETROTHAL`): a boy of 14 ran from "a betrothal to a man twice your age". A boy runs from a betrothal to a widow; the list keeps its length, so the pick draws the same.
- **The tournament's opening line** (`ga_open`, patch `V2C-TOURNEY-LANCE`): the "knight" role goes to any soldier of rank 2 or more, so an orc crossbowman heard "Your horse is groomed and your lance is new". The line is for one who rides with a lance (a knight's post, lance and riding 30, a lord's rung); a soldier comes "in your company's colours, with the weapons you know".
- **A soldier's officer is his captain** (`f-roles.core.js`): 9999-advisors seated a 'superior' as "your master", so a commander's captain said "Your name in the trade is your fortune" on a siege, and one captain read both "YOUR CAPTAIN" and "YOUR MASTER". For a life under arms, a 'master' candidate who is a soldier or a superior becomes the captain (or is not seated twice). The master at work stays a master.
- **Left for the owner:** "Plot for the throne" stays on the court tab for a grown commoner. 49-body-mind keeps it there on purpose (it removes only the court's noble acts), and the release has a commoner's ending, "From the Dust to the Throne", that goes through it.

### What a card says (`c-cards.core.js`, #18 and #19)

- **Who.** 21-npc-initiative's "Why Edith: …" line stood behind "Read more" on about 30 cards a life. It is on the card now, without its number: "Why Edith: thinks well of you; your aunt by marriage; trusting." A cast scene's description keeps its first sentence on the card; the rest stays behind "Read more" as lore.
- **Whose regard, and which way.**
  - "• their regard" names the person: "▼ Edith's regard".
  - "standing" says where: in the ranks, at work, or "your master's regard".
  - An effect written as code shows its direction when the code's numbers all agree: regard, health, honour, renown, piety, spirits, stability, the treasury, standing, coin.
  - What a failed check costs in regard reads ▼. A failure that still raises something ("Fails: ▲ regard", in red) is not listed as a loss; if nothing is lost, the chip says "Nothing lost if it fails".
- **Every choice shows something.** The drill scenes' code effects are read: "▲ the unit's order", "▼ the unit's seasoning", "▲ the unit's marching". A choice with no effect says "Nothing changes". One whose effect stays hidden (a flag, a later scene) says "It will be remembered".
- **No scene with one live choice.** If a scene written with two or more choices has fewer than two the player can take, the engine drops it where it builds the view (`A.headReady`). This is the same way it drops a scene whose tokens cannot be filled. "An old scholar" with no coin was the case the playtest found. That scene now has a second choice for a poor student, working off the rent (patch `V2C-SCHOLAR-WORK`).
- **The creation screen's story blurbs are whole** at phone width. 29-starts clamped them to two lines.

### A card tells the truth about risk (`f-risk.core.js`, playtest 2: new 1, new 2, old 18 and 19)

- **The stake, in words.** `A.V2S.lossOf` (99993-v2-stats) reads what a choice can cost for good, and the chip says it
  first:
  - "Join the plot … If it fails: a treason trial: the gallows or a deep cell", where it said "Nothing lost if it fails";
  - "If it fails: what follows can kill you", for a failure that queues or schedules a scene whose failures kill;
  - "If it fails: hurt that could kill you, near death as you are", where it said "a wound, hurt" to a man near death.
    The health word is the profile's own band.
  - A sure effect says it too: "Death", "Perhaps the gallows", "What follows can bring the law on you".
- **The red/white mark is 9998's.** "Join the plot" still says "can be tried again": 9998-stakes' rule and its test (`stRedMarked`) read only a written death, cell, wound or exile. A failure there ends in a cell or on the gallows, so there is no retry anyway. Making such a check red is left to 9998's owner.
- **A failure's losses read as losses.** "If it fails: honour" said nothing about which way; now it reads "▼ honour".
  A function's "risk of a wound" says what it is: "▼ a wound, perhaps".
- **The content's helpers have a direction** (`c-cards.core.js`):
  - `pay`, `spend` and `hurt` go down; `gain` and `earn` go up;
  - `hp(p, v)` is spirits (9998 had read it as health); `willGrow` is willpower; `bump`, `addOp` and `op2` are regard;
  - `p.honor = cl(p.honor - 3)` is honour down; `coin: -sum(…)` is a cost; `coin: ctx.bribe` is a gain.

  Over every scene staged for a soldier, 28 of 26,017 chips still give no way (0.1%; 1.8% before). Those are effects
  whose code goes both ways.
- **Effects built from parts.** 227 soldier-pack choices are `both({ … }, op2(-30))`: closures whose source shows only
  `applyFx(p, obj, ctx)`. Patch `V2C-FX-PARTS` keeps their parts on the closure (`A.V2C.parts`), and the chips read the
  parts as written. Nothing they do changes.
- **Whose regard.** A second messmate's (`op2`: `ctx.m2`) is named. 9998 had named the first messmate instead. A loop
  over the squad reads "your messmates' regard".
- **Every choice shows a true effect** (old 19):
  - 47's custom scene ("The hearth mark") shows the custom's own effect, "Costs 3 suns", and the defiance's, "Costs 6
    suns · ▲ willpower";
  - 97's ambition scenes ("What you want") show "Your aim: master learning · When it is done: ▲ spirits, ▲ renown", and
    "No aim: you take what comes";
  - the gathering's close ("The last night") shows what you carry home from your role and aim there: "▲ renown,
    ▲ Etiquette", or "Alliance with Varenna: decided tonight".

### Numbers (`e-numbers.core.js`)

- **The War Room's division panel,** for an enemy division a scout can see, gives estimates in 99997-v2-war's commander words ("some 7,500"). That covers:
  - its men;
  - the men of several enemy divisions together;
  - its kills;
  - 9997-companies' battalion and company counts;
  - the other side's men in a fight's row;
  - an enemy army's row.
- **No bar reads above full** (`UI.barRow`): "7,470/7,470", not "7,471/7,470".
- **Restless lords** reads "about half of the swords, angry", not "45% of the swords, discontent 70".
- **The realm tab's army** reads "good quality", not "quality 114%", which the generic pass had turned into "quality more than all".

## Tests (`test.mjs`)

| Test | Checks |
| --- | --- |
| `v2cMemoryRare` | Two played lives: memories on under 1 card in 8, none from before 7, none citing a deed that is not in the past tense. The complaint's lines are rejected. |
| `v2cExtraLinesFit` | Two played lives: never two extra lines on a card; a voice only on a check scene at 14 or older; counsel only on a big scene at 15 or older. The playtest's lines don't fit their scenes ("Mend the roof" on First arrows, "quotes the law" on the bully), and the broken jug and first arrows are not big. |
| `v2cClassGates` | A 13-year-old apprentice smith never draws the apprentice, undercut, commission or election scenes, and the shop scene doesn't fit him. No study scene of the disputation or inn kind comes at 8. No round is offered at 14 with 0 suns. No Latin anywhere. |
| `v2cShopGateReadsRight` | A clerk, a line under the scene's own test, a shop still to come and a scene that follows a flag don't need a shop; the dwarf partner, the smith's apprentice, the royal bowyer, the general's and the ruler's clerks are not hidden. A plain "your customers" still needs one. |
| `v2cPlaytest2Class` | The runaway boy is not betrothed to a man; a soldier with no lance hears no lance at the tournament, a knight does; a soldier's officer sits in the ring as a captain, a smith's master as a master. |
| `v2cWhoOnCard` | The "Why" line is on the card, in words. The story blurbs are whole at 420 px. |
| `v2cEveryChoiceShows` | Over 200 played scenes, every choice has a chip row and no scene is shown with one live choice. "Their regard" always names the person. The fresh levy and the song read the unit's effects. The old scholar with no coin is dropped. |
| `v2cRiskChain` | "Join the plot" says the treason trial. Planted failures that queue or schedule a deadly scene say "what follows can kill you", prison says prison, and a free failure says nothing is lost. Played and failed, the plot sends you to the gallows or a cell. |
| `v2cRiskLethal` | The night watch's failure reads "a wound, hurt" for a hale man. At health 3 it reads "hurt that could kill you, near death as you are", in the profile's word. Played, it leaves him at 0 health. |
| `v2cChipsDirection` | Staged: "Under the ice", "The grand melee", the gift, the mess brawl and the loaded dice give a direction and a name. The dice name the second messmate. Over every scene for a soldier, under 0.4% of chips give no way. |
| `v2cEveryChoiceTrue` | "The hearth mark", "What you want" and "The last night" show a real effect on every choice. None shows only "It will be remembered" or "Nothing changes". |
| `v2cWarRoomNumbers` | With a scout beside it, an enemy division and three of them read as estimates. Your own division never reads above full. Restless lords and the army's quality are in words. |

## Changed elsewhere

- `97-life-fixes/scenes.events.js`: the study scenes' conditions, and the apprentice scene's `minR`.
- `50-arcs-kin`, `87-echoes`: Latin becomes Old Solen.
- The tests of `67-memory-weave`, `9992-identity`, `9998-stakes`, `9999-advisors` and `97-life-fixes` read the old rates or the old chip words. Each change is commented in place and listed in the lane report.
