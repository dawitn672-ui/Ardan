# The far beasts: the Great Continent's wilds

**Aspect:** World and lore (the owner's Oct 27 ask: the Great Continent becomes the world, "a bigger version of the world we already had", detail for detail), Power (every beast fight on the ladder at honest odds) · **Kind:** data (generated from the private lore), one system file, one patch, 48 events (32 scenes and 16 that remember them), a fitting tool. Stage 3 of `docs/plan/world-expansion-architecture.md` for beasts; the gap named in `features/99-far-lands/README.md` ("The far lands' own bestiary is stage 3").

## Why

The Known World has 64 creatures: stat blocks for 25 of them, canon ranges (76-beast-habitats), scenes that take the beasts that live there (79-beast-scenes), belief and truth (26-belief-truth) and duel curves (48-fight-ladder, 89-fight-odds). The far lands had none of their own: a far province offered only the ten Known World beasts whose range 99 let run on (`FL.BEAST_LANDS`), and 191 of 1,727 far provinces nothing at all. The lore (`canon/lore/beasts.json`) has 140 creatures for the ten Far Lands, CRE-65 to CRE-204, each with lands, regions, terrain, size, danger, belief and truth, 49 with stat blocks and 25 named individuals.

## What it does

**Data** (`gen.mjs` → `a-data.core.js`, 100 KB, checked in; `--check` fails if it is stale). Each creature becomes a record: id, name, kind (17 kinds: dragon, great cat, bear, hound, grazer, wild cattle, giant grazer, crocodile and lizard, serpent, sea beast, fish, bird, ape, seal and otter, small creature, relic, legend), lands, lore regions, terrain words, mass, size line, **tier** (the duel engine's own rule from the stats, as 48 holds it, for every fighter; the lore's tier for the rest), **danger**, **rarity** (69 common, 40 uncommon, 15 rare, 6 one of a kind, 10 tales), **yield** (what a kill or a catch gives and what it fetches: pelt, fur, ivory, horn, musk, plumes, pearls, skin, oil, fish, scales), **the tale** (21 true, 71 rumoured: the beast is real and the tale is not, 10 believed: no such beast, 38 with nothing told), the stat block (the lore's 49; 80 more read from size and kind along the release's own blocks; none for the 10 legends and the dead dragon of Gyokar), one short line each for habit, belief and truth, and the named individuals with a one-line note. Long lines and lines that name canon ids are rewritten by hand in `gen.mjs` (`LINE`); creatures the lore tells nothing of get a hunter's line by kind; the weak point is a fresh line by kind.

**Who fights** (`fight`): the lore's fighters on land and the larger dangerous beasts read from size (51), plus two sharks at sea (`fightSea`). Grazers, birds, fish, small creatures, the white elephants and the giant tortoise (kept, never hunted) are not offered as fights; 44 are quarry, 5 are a sting in the dark.

**Duel curves** (`fit.mjs` → `b-duel.core.js`): the 53 fighters' `[w50, s, w50 with a party of 8, s]`, fitted by maximum likelihood on 1,100 duels per beast and mode from the duel engine, the way 48 fitted the Known World's (its fighters of tiers 1 to 5 and the raised ones, health 45 to 100, three in four near the first estimate). The method reproduces 48's table: refitting six Known World beasts gives CRE-01 134 (48: 140), CRE-21 67 (67), CRE-25 122 (126), CRE-35 74 (74), CRE-44 null and 133 (null and 134).

**In the game** (`c-beasts.core.js`). Installed with the far lands (`A.FAR.install`, wrapped) and taken out with them, as 99 does for its realms:

| Where | What |
| --- | --- |
| `LORE.creatures` | 140 records in the release's shape (name, cat, habitat as "the Long Grass: the Elder Grass, ...", size, behavior, weak, belief, truth), marked `far` |
| `A.BEASTS` | 129 stat blocks; `GD.BEAST_TIER` 140; `GD.BEAST_FLYER` the Cloudwall's dragon; `GD.BEAST_DUEL` the 53 curves |
| `A.beastsNear` | a far province lists its own fighters, after the Known World beasts 99 lets in; where the far kin of such a beast lives (the lore's "kin": woolly rhino, snow ape, river horse, crocodiles, python, tiger, forest men, hyena) the kin takes its place; a far beast is never near a Known World province |
| `A.startHunt` | the hunt for the pot brings down the land's own game ("a saiga", "a sable", "an eland"); the famous hunt's tall tales are the land's own legends (patch `FB-HOAXES`) |
| `A.duelClose` | a far beast killed yields its pelt, ivory or horn, sold at market (half with a hunting party), with a line in the story; a named one dies (below) |
| `A.onMonth` | sightings (8% a month): "You see a Lion of the High Grass at the edge of the High Grass", which counts as seen in the bestiary; and the wilds come to you: a month with no beast scene for two years has a 3.5% chance to bring one |
| `A.BT.childHeard` | a far child has heard of its own region's creatures, its land's titans, dragons and legends and a few more by family, and of the Known World only its dragons and giants and a few; a Known World child hears of the Cloudwall's dragon |
| `A.BT.pickCreature` | exploring teaches the beasts near home, not those of the same ground a continent away |
| `A.evFit` | a Known World scene that names a fixed beast of its own (51 of them: `beast: { id: "CRE-21" }`, `beastId`, `ctx.beast = "CRE-21"`, read from the scenes' effects once) is not rolled in a far province where that beast does not live: no Evenwood wolves of the hard winter in the Deep Southland. The gate is the roll's weight, so no scene's `cond` is touched (`A.evAudience` reads it as text) |
| `A.C` | `fbFar`, `fbNear(p, id)`, `fbHas(p, family)`, `fbLand(p, ...)` for the scenes |

**Where each lives.** A creature is near a far province whose lore region (99 gives each one) is one of the creature's, and whose ground word fits its terrain, with 76's rule: in a region where no province carries a fitting word, the whole region counts; a sea creature keeps to the coast. Resolved from the far map as generated, never from the live state. A lore region the far map holds no province of (one build of far@2 folded the Southern Strand, B-05, into its neighbours) is stood in for by the nearest region of the same land, by the lore's middles (`FB.standIn`). Every creature has at least one reachable far province (the fewest: one, such as Tasieng's Grief off Tirangga; the median 25).

**The bestiary** (26-belief-truth's codex page). The far creatures are listed with the rest, by what you know of them, and each card carries a creature line in 91-look's type: the id, the name, the land, a rarity chip on 91's rarity ladder (`chip tier t1` to `t6`), and once the truth is known, whether the tale holds and what the beast yields. With the far lands closed the page is drawn exactly as before.

**Scenes** (`beasts.events.js`, 32, all prefixed `fb_`; the follow-ups in `memory.events.js` below). Every one needs a far home and its creature near it (`C.fbFar`, `C.fbNear`, `C.fbHas`).

- **Eight families** for every creature of a kind: *Something at the herds* (a fighter near home: follow it and fight, raise the village's hunt, sit up with the herds, let it be), *Game on the move* (quarry), *Something in the dark* (scorpion, cobra, paddy snake, leech, monitor), *Off the point* (sea beasts and whaling), *What the old ones say* (legends: believe, ask the old women, go and see), *A beast with a name* (the 25 named individuals), *A trader's order* (fur, ivory, horn, musk, plumes), *Tracks* (a child shown the tracks).
- **24 creatures with their own scene:** the Ash Mother of the Cloudwall, Sovarn-Giri, the Hidden Calf, the Masked One, the Old Grandmother of the Stairs, Bapa Lau, Tasieng's Grief, Kalunge's Mother, the Canoe-Breaker of Ruvela, the Grey Matriarch, the Widow-Maker of the Walrus Strand, the bear feast, Grandfather on the trapline (Sable Woods and White Head tigers), the clan tiger gone mad, the Grey Monk of the Ice Stair, Old Black, the Ash Father's Eldest, the Thirty-Cow Lion, the Grey Ten, Smoke-Wing, the dyke-king, the Old Man of Three Steps, the Old Steersman, the Sky-Horse.
- A fight is `fx.beast` (alone, so 89's badge shows its chance); a party hunt hands over to the release's `hunt_beast`. What you learn goes through `A.BT.learn`. Their flags are read again by the memory scenes (below).

**Named beasts** (the lore's 25 individuals: the Ash Mother of the Twin Teeth, Bapa Lau, the Masked One, Old Black, the Grey Ten...). Each lives in `A.S.fbNamed[<id>#<n>]` (`alive`, `seen`, `hunted`, `year`, `by`, `byName`, `gone`), made on first need; without a record (every old save) each stands as the lore leaves it in 1105, so seven are already dead (the Man-Eater of the Nine Ridges, the Thirty-Cow Lion, the Grandfather of Nine...). A notable creature's scene is about its named one (`one(p, ctx, id, 'subject')`) and needs it alive (`C.fbAlive`): taking a choice counts it as seen; a fight with it (`fx.beast` or the hunt it hands over to) is remembered in `A.S.fbPend` until the duel closes, and a win kills it once: `A.news` ("the Masked One is dead, killed by ..."), a deed in your record (the chronicle, and 26's tale as told), fame, the bestiary's "Known by name" line, and its scene never comes again; a loss counts a hunt ("gets away"). Sightings sometimes name it ("and the herders say it is Old Black"). The wilds go on without you: about one living named fighter in fifty a year falls to someone else's hunters, in the news. The Old Man of Three Steps can be carried off to the temple (`FB.gone`).

**Memory** (`memory.events.js`, 16 scenes). Every flag the scenes set is read again (`fbNoOrphanFlags`):

| Flag | Read by |
| --- | --- |
| `fb_spared`, `fb_sp_<id>` (a choice marked `fbSpare`: letting the beast go, six scenes) | *Back again*: the beast you spared returns, fatter |
| `fb_trophy`, `fb_k_<id>` (a far beast killed) | *The trophy*: a boy asks how it was |
| `fb_tracks`, `fb_child_saw` (a child shown the tracks) | *The old hunter*: he teaches the grown child the ground |
| `fb_slew` (a named beast killed) | *As it is told at the fire* |
| `fb_saw_named` | *The same one*: your children want to go and look |
| `fb_dragon_watch` | *The count book* |
| `fb_told_temple`, `fb_sold_calf` | *The white calf* |
| `fb_masked_loss` | *The widow of the honey-gatherer* |
| `fb_bapa_lau_took` | *The steersman's son* (and a fight with Bapa Lau, if he lives) |
| `fb_drum_king`, `fb_drum_cousin` | *The drum island's king* |
| `fb_giant_nod` → `fb_giant_friend` | *The giant on the ridge* → *A gift from Fjorund* |
| `fb_smoke_wing` | *Tegur's rider* |
| `fb_sold_salamander` | *The pool under the Gorge Chain* |
| `fb_steersman_saved` → `fb_keeper` | *Called to the queen's gate* → *The keeper's year* |
| `fb_wild` | the code (the wilds come to you) |

**Fallbacks.** A Known World scene whose beast is only a fallback (`ctx.beast = n.length ? A.pick(n) : "CRE-21"`: the hunters' bounty, "something big crosses the road", 40's `beastNear`) steps aside in a far province where that beast does not live: `A.eventView` is wrapped and the view skipped, as a setup's `ctx.skip` does. The Tiger of Ranpur, which 99 lets run on into the Southern Peninsulas, is not offered there at all (`FB.DROP`); the peninsulas' own tiger (the Twin Delta's, CRE-114) lives in their marshes.

**State.** Flags (26's `bt_*`, the scenes' `fb_*`), `A.S.fbNamed` and `A.S.fbPend`, all optional, so old saves load. A save of the Great Continent installs the beasts again when it loads (through 99's `FL.set`). The far lands' data version is untouched.

## Known World unchanged

With `lands: 'known'` nothing is installed and every hook passes straight through (`FB.on()` is false). `fbKnownWorldSame` derives the build without this feature from the built file (its code and scenes cut, its patch undone) and compares three Known World lives of five years, every tab drawn, and the bestiary: the same state hash, random stream and markup.

## Measured by (`test.mjs`)

| Test | What it holds |
| --- | --- |
| `fbAllResolve` | 140 creatures, each in `LORE.creatures` with a tier and (unless a tale) stats, rarity, tale and yield; every fighter's curve installed; each near at least one reachable far province; no Known World province lists a far beast; `A.beastsNear` never lists one off its ground |
| `fbScenesRender` | every scene in every kind of far province it can fire in (by region, coast and ground word; a child and an adult): no raw token, text at most 80 words, every choice taken without an error; every scene eligible somewhere |
| `fbEncounters` | ten years from three far births (the Khaganate, Vahra, Busimo): beast scenes, sightings, creatures learned of in each life |
| `fbHonestOdds` | 2,400 duels against the 53 far fighters by far-born people (not the fit's pool): the duel screen's number against the result, by bin; the badge on a far fight's choice reads the same curve |
| `fbNoOrphanFlags` | every `fb_*` flag the scenes and the code set is read somewhere (22 flags) |
| `fbNamedPersist` | 25 named beasts, 7 dead before 1105; the Masked One fought from her scene and killed: dead in `A.S`, a deed, the news, her scene gone, the bestiary says so, kept by a save; with no record (an old save) each stands as the lore has it |
| `fbFallbackStep` | the hunters' bounty in 40 far provinces names no beast that does not live there; in Known World provinces it runs as before; no Southern Peninsulas province offers the Tiger of Ranpur |
| `fbKnownWorldSame` | above |
| `fbFixedBeastGate` | the Known World scenes with a fixed beast are found; the wolves of the hard winter weigh 0 in Busimo and as before in Evenglade, in the same game and in a Known World game |
| `fbBestiaryPure` | a far child has heard of her own land's creatures more than of others; the bestiary draws the creature line; drawing it, a scene and a far duel changes neither the state nor the random stream |

`tools/lint-events.mjs` and `tools/lint-choices.mjs` pass. (The linter plays Known World characters only, so it reports the 32 scenes as never eligible; `fbScenesRender` plays them in the far lands.)

## Limits and what is left

- **Fallback scenes step aside rather than retarget.** The hunters' bounty (`wk_hunt_beast`) wants a beast of 200 hp or less and most far fighters are bigger, so in the far lands it nearly always steps aside (39 of 40 provinces sampled). Retargeting it to a far beast would need its setup changed (79's place).
- A titan or a flyer fought from a scene goes through 48's warning first (`bx_titan`, `bx_flyer`); the named fight is remembered across it for a year.
- **The Known World beasts 99 lets run on** (`FL.BEAST_LANDS`) stay where no far kin replaces them (the Green Anaconda and the Old Man of the Trees in the Deep Southland, the World Python in the peninsulas' hills).
- The tiers follow the duel engine: a 45 kg snow leopard the lore calls a great beast is an animal here, as 48 retagged the Roc.
- Size-read stat blocks are for the 80 creatures that are hunted or seen, not fought; only the 53 fighters have fitted curves.
- The named beasts are records, not people: they have no portrait, no age, and no young.
