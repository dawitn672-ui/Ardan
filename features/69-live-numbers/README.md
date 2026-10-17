# Live numbers

**Aspect:** Character and life sim (Road to Ten, Character 7) · **Kind:** system (1 code file), 8 events, no patches, plus a copy of the bench's counter for the tests (`counter.mjs`)

The plan says: "Cut dead numbers. Any stat or skill that changes fewer than 5 outcomes in a typical bot life is cut or merged." Done when, the part bots can measure: "every remaining stat and skill touches at least 5 outcomes per life".

49-body-mind folded nine skills into their families and left six under the line: axe, unarmed, bow, sea, music and gambling. On today's world (65 features, 24 bot lives of `bench/dead-numbers.mjs`) all six were still there: axe 0, bow 0, sea 1, music 1, gambling 1, unarmed 2. The words for them are all over the game: dice in the back room rolled on wits, a shot at a hart rolled on stealth, a pavane danced on persuasion, "Sing along" with no roll at all, a tavern brawl fought with the sword at your hip. This feature gives each of them the places in a life where its words already are. Where one has too few such places, it is merged, as 49 did.

## What it does

**1. Checks whose words name the skill** (`LN.RETAG`, 16 choices). A hand-checked list as data: the event, the choice, the word its label must hold, what to set, and why. A rewritten label is skipped, not mangled. Two rules keep the odds honest:

- When the words also support a stat (wits at dice, an eye at the butts), the stat stays first and the skill goes second (40% of the check). Someone who never learned it loses at most about 15 points; someone who did gains.
- When the old skill was the wrong one (trade for a bet, persuasion for a pavane, survival for a week of firewood), the skill replaces it. For someone who never learned either, nothing changes.

Some of them: dice in the back room (`tavern_dice`), and by the fire in camp (int/ins → int/gambling); "Stay calm and prove it" when you are accused of loaded bones (int/diplomacy → int/gambling); "Take the shot" at the lord's hart (stealth/survival → bow/stealth); "Ask them to dance" when the musicians strike up a pavane (etiquette/persuasion → etiquette/music); "Look into the captain first" before buying a share in a cog (trade/intrigue → trade/sea). A choice that 48-fight-ladder routes through fighting worth is left alone, since its odds come from the weapon in hand.

**2. Choices with no roll whose words are the skill** (`LN.RIDE`, 24 choices; `fx.knack`). After the choice resolves, how good you are at it adds a line and a small effect: at the top of the skill the good line, at the bottom the poor one, in between nothing extra. The effects are bounded (happiness 4, coin 6 or 15% of a purse, fame 1, health 4, an opinion 4). Examples: "Sing along at the top of your lungs" ("Your voice carries the verse, and people turn to see who it is" or "You lose the tune in the second verse and mouth the rest"), "Play for fun, small stakes", "Drink and dice the winter in", "Knock him down", "Teach the grandchild to shoot", "Rock him and sing".

**3. Work and the year** (engine hooks, each in a function the release already runs):

| Hook | Number | Where | What it does |
| --- | --- | --- | --- |
| A brawl is fought with fists | unarmed | `A.startDuel` | A tavern or lane brawl (kind `brawl`, not lethal) used to start with each fighter's own weapon, so a knight brawled with his sword skill. Now both sides fight bare-handed. A brawl the event made lethal ("your victim draws steel") keeps its weapons. |
| The grapple is wrestling | unarmed | `A.situEdges` | The duel's "Close & grapple" ("get inside the reach and wrestle") weighed strength and the weapon skill, never the wrestling. When either fighter grapples, the better wrestler takes up to 2 points of edge. The exchange is 2d6 plus edge, and the edge is named on the duel's line. |
| A trade's second skill | axe, bow, unarmed, gambling, music, sea | `A.careerYear` | The farmer's and the labourer's axe, the carpenter's adze, the corsair's boarding axe, the herder's sling, the hunter's and the bowyer's bow, the innkeeper's fists, the fence's dice, the keeper's chant, the courtier's song, and a port merchant's cargo by sea. Each moves the year's work target from −3 (skill 0) to +6 (skill 60). The trade's description says so. |
| The lament at a wake | music | `A.familyYear` | When someone close dies, someone who can sing the lament gets back up to two fifths of the happiness the release takes (a mother 25: 10 back at music 60). |
| Dice in winter quarters | gambling | `A.milYear` | A soldier's winter: 3% of the purse won or lost, at 42% plus the skill's edge. |
| The winter's wood | axe | `A.careerYear` | A household that does not pay a woodman (rank up to townsfolk, under 400 suns) fells and splits its own. A poor hand risks a foot (1 in 8 below skill 8); a good one has the pile to the eaves. |
| The butts on feast days | bow | `A.careerYear`, 47-realm-bible's `ash_draw` and `ash_butts` | Peoples who keep the bow (Ashmere's men, as the release trains them, the steppe, the elves) shoot on feast days: a few pennies to the best, a penny's fine for an idle bow. Ashmere's two customs now read the bow too ("the reeve notes who still reaches the far one"). |
| The herring boats | sea | `A.careerYear` | A coastal commoner without a sea trade goes out with the boats in the season: a few suns, more for a seaman, and a ducking in a squall less often. |
| The autumn hunt | bow, riding | `A.careerYear` | A lord's year: the arrow that takes the hart is talked about (fame 1, happiness). |
| A crossing by sea | sea | `ga_open` | A gathering abroad that is reached by sea (both coasts, close enough to trade by sea, 45-economy's rule): a poor seaman comes ashore green (health, and a point of standing lost at the gathering); a good one comes ashore fresh (a point gained). |
| The host's hunt | bow, riding | `ga_open` | At a wedding, coronation, summit or tournament the guests ride out with the host: the guest who takes the stag gains a point of standing there and a little fame; a poor rider can come off. |

**4. Axe is merged into spear, for the player: "Hafts: axe, mace & spear"** (`LN.MERGE`). With every hook above, axe still changed 2 outcomes in the median life. Its places are real but narrow: the wood axe, the farmer's and carpenter's year, a commoner's cudgel. The lives the bots lead rise into office, trade and command, and rarely fight. Spear sat at 4 for the same reason. A cudgel, a wood axe, a staff and a spear are the common man's weapons. The release already files the staff under spear and the club under axe, and a bill or a halberd is both at once. So the player's axe is read and trained as the spear's family, with 49-body-mind's own machinery (`A.BM.MERGE`):

- the sheet shows one row;
- an old save folds in the higher number;
- NPCs keep both numbers, so troops, other people's duels and the war layer are unchanged.

**5. Eight scenes** (`live.events.js`, house voice, each a moment most lives pass through):

- **Music:** a song for the bride at a neighbour's wedding.
- **Unarmed:** the wrestling ring at the fair, and hands on your collar in the market (the bailiff's men want someone who looks like you).
- **Bow:** the butts after church.
- **Gambling:** dice on the threshing floor after the harvest (in a lord's hall, tables for silver), and the tables after supper at a gathering of crowns. The second is a scene in the release's gathering pool (`gscene`) and moves the gathering on. Its quiet choice ("Watch, and listen to what the losers say") also reads the dice: reading the players is the gambler's skill.
- **Axe:** the winter's wood (fell the dead oak, or split the windfall).
- **Sea:** the turn of the tide at an estuary crossing (on the coast).

The two bouts in the ring carry their own fight spec for 48-fight-ladder: the fair's champion is a tier-2 fighter and the farm lads tier 1. The ladder's word-reader took "champion" for a knight.

## Measured by

**The dead-numbers bench**: `node bench/dead-numbers.mjs <build> --lives-per=4 --workers=1`, 24 lives of the six balance paths that lasted 25 years or more. Before is the same tree without this feature (`--without=live-numbers`). Outcomes are per life, median:

(table filled from the run, below)

## Rules kept

- Every draw is in engine code (A.chance, A.ri, A.rf, A.pick in the year, the wake, the camp, the crossing, the hunt and the scenes' setup). Rendering only reads: the trade descriptions are data set once at load, and `lnRenderPure` draws every tab with a scene up without changing `A.S` or the stream.
- No inline handlers, no markup in state. The new state fields are `g.pc.lnSea` and `g.pc.lnHunt` on a gathering (optional, read as missing on an old save).
- `fx.knack` is declared in `A.FX_EXTRA`.
- No patches. Wrappers call the original: `A.applyFx`, `A.eventChoose`, `A.startDuel`, `A.situEdges`, `A.careerYear`, `A.milYear`, `A.familyYear`, and `A.BIBLE.hit` when 47-realm-bible is present.
- Events use `(p, C) => C.*` conditions, 3 choices each, labels of 12 words or fewer, and text under 80 words. The festival names are the game's own (First Loaf, Lantern Night).

## Limits

(filled below)
