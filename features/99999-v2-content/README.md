# 99999-v2-content: text that fits the scene and the character

**Aspect:** v2 playtest 1 (`docs/v2/playtest-1.md`), findings 9, 10, 11, 18 and 19, plus the War Room's numbers and two percentages left in World › Diplomacy and the realm tab · **Kind:** system (5 core files), 4 patches, small edits to `97-life-fixes`, `50-arcs-kin` and `87-echoes`, tests. No new events.

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
- no inner voice on a card that has counsel or a memory.

### Class gates (`d-gates.core.js`, patches, #11)

- `lfx_du_gd_apprentice` ("Your apprentice has ruined a week's work") needs a master (`minR: 2`), and so do `du_gd_undercut` ("Someone is undercutting you") and `du_gd_caravan` (your own caravan). The first is an edit in 97; the other two are patches `V2C-UNDERCUT-MASTER` and `V2C-CARAVAN-MASTER`.
- **A new audience class, `shop`** (`A.EV_RX.shop`, `A.CX_RX.shop`): a scene whose words say "your shop", "your apprentice", "your customers" or "your caravan" reaches only a life with a shop or a master's rank, unless its condition already asks for one.
- **97's five study scenes have an age, and letters where they read:** the disputation needs 15 and letters (it came at 8, "at the cathedral school"), the chained library 13, the sum in beer at the inn 14, and the map and the window 12.
- **No Latin in Ardan.** The examination (`V2C-NO-LATIN`), 50-arcs-kin's contract and 87-echoes' two scholars say Old Solen, Ardan's learned tongue (`GD.LANG_LIST`).
- **"Laugh, and buy the whole tavern a drink (5 suns)"** needs 16 years as well as the coin (`V2C-TAVERN-ROUND-ADULT`). 9998-stakes draws a locked row only for a requirement it can read, so a penniless 14-year-old no longer sees it.

### What a card says (`c-cards.core.js`, #18 and #19)

- **Who.** 21-npc-initiative's "Why Edith: …" line stood behind "Read more" on about 30 cards a life. It is on the card now, without its number: "Why Edith: thinks well of you; your aunt by marriage; trusting." A cast scene's description keeps its first sentence on the card; the rest stays behind "Read more" as lore.
- **Whose regard, and which way.**
  - "• their regard" names the person: "▼ Edith's regard".
  - "standing" says where: in the ranks, at work, or "your master's regard".
  - An effect written as code shows its direction when the code's numbers all agree: regard, health, honour, renown, piety, spirits, stability, the treasury, standing, coin.
  - What a failed check costs in regard reads ▼.
- **Every choice shows something.** The drill scenes' code effects are read: "▲ the unit's order", "▼ the unit's seasoning", "▲ the unit's marching". A choice with no effect says "Nothing changes". One whose effect stays hidden (a flag, a later scene) says "It will be remembered".
- **No scene with one live choice.** If a scene written with two or more choices has fewer than two the player can take, the engine drops it where it builds the view (`A.headReady`). This is the same way it drops a scene whose tokens cannot be filled. "An old scholar" with no coin was the case the playtest found.
- **The creation screen's story blurbs are whole** at phone width. 29-starts clamped them to two lines.

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
| `v2cWhoOnCard` | The "Why" line is on the card, in words. The story blurbs are whole at 420 px. |
| `v2cEveryChoiceShows` | Over 200 played scenes, every choice has a chip row and no scene is shown with one live choice. "Their regard" always names the person. The fresh levy and the song read the unit's effects. The old scholar with no coin is dropped. |
| `v2cWarRoomNumbers` | With a scout beside it, an enemy division and three of them read as estimates. Your own division never reads above full. Restless lords and the army's quality are in words. |

## Changed elsewhere

- `97-life-fixes/scenes.events.js`: the study scenes' conditions, and the apprentice scene's `minR`.
- `50-arcs-kin`, `87-echoes`: Latin becomes Old Solen.
- `67-memory-weave/test.mjs` and `9999-advisors/test.mjs`: their tests read the old rates. Each change is commented and listed in the lane report.
