# The far beasts: the Great Continent's wilds

**Aspect:** World and lore (the owner's Oct 27 ask: the Great Continent becomes the world, "a bigger version of the world we already had", detail for detail), Power (every beast fight on the ladder at honest odds) · **Kind:** data (generated from the private lore), one system file, one patch, 32 events, a fitting tool. Stage 3 of `docs/plan/world-expansion-architecture.md` for beasts; the gap named in `features/99-far-lands/README.md` ("The far lands' own bestiary is stage 3").

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
| `A.duelClose` | a far beast killed yields its pelt, ivory or horn, sold at market (half with a hunting party), with a line in the story |
| `A.onMonth` | sightings (8% a month): "You see a Lion of the High Grass at the edge of the High Grass", which counts as seen in the bestiary; and the wilds come to you: a month with no beast scene for two years has a 3.5% chance to bring one |
| `A.BT.childHeard` | a far child has heard of its own region's creatures, its land's titans, dragons and legends and a few more by family, and of the Known World only its dragons and giants and a few; a Known World child hears of the Cloudwall's dragon |
| `A.BT.pickCreature` | exploring teaches the beasts near home, not those of the same ground a continent away |
| `A.evFit` | a Known World scene that names a fixed beast of its own (58 of them: `beast: { id: "CRE-21" }`, `beastId`, `ctx.beast = "CRE-21"`, read from the scenes' effects once) is not rolled in a far province where that beast does not live: no Evenwood wolves of the hard winter in the Deep Southland. The gate is the roll's weight, so no scene's `cond` is touched (`A.evAudience` reads it as text) |
| `A.C` | `fbFar`, `fbNear(p, id)`, `fbHas(p, family)`, `fbLand(p, ...)` for the scenes |

**Where each lives.** A creature is near a far province whose lore region (99 gives each one) is one of the creature's, and whose ground word fits its terrain, with 76's rule: in a region where no province carries a fitting word, the whole region counts; a sea creature keeps to the coast. Resolved from the far map as generated, never from the live state. Every creature has at least one far province (the fewest: one, for Tasieng's Grief off Tirangga, the Strait Kraken and the Thirst Woods Eland; the median 13).

**The bestiary** (26-belief-truth's codex page). The far creatures are listed with the rest, by what you know of them, and each card carries a creature line in 91-look's type: the id, the name, the land, a rarity chip on 91's rarity ladder (`chip tier t1` to `t6`), and once the truth is known, whether the tale holds and what the beast yields. With the far lands closed the page is drawn exactly as before.

**Scenes** (`beasts.events.js`, 32, all prefixed `fb_`). Every one needs a far home and its creature near it (`C.fbFar`, `C.fbNear`, `C.fbHas`).

- **Eight families** for every creature of a kind: *Something at the herds* (a fighter near home: follow it and fight, raise the village's hunt, sit up with the herds, let it be), *Game on the move* (quarry), *Something in the dark* (scorpion, cobra, paddy snake, leech, monitor), *Off the point* (sea beasts and whaling), *What the old ones say* (legends: believe, ask the old women, go and see), *A beast with a name* (the 25 named individuals), *A trader's order* (fur, ivory, horn, musk, plumes), *Tracks* (a child shown the tracks).
- **24 creatures with their own scene:** the Ash Mother of the Cloudwall, Sovarn-Giri, the Hidden Calf, the Masked One, the Old Grandmother of the Stairs, Bapa Lau, Tasieng's Grief, Kalunge's Mother, the Canoe-Breaker of Ruvela, the Grey Matriarch, the Widow-Maker of the Walrus Strand, the bear feast, Grandfather on the trapline (Sable Woods and White Head tigers), the clan tiger gone mad, the Grey Monk of the Ice Stair, Old Black, the Ash Father's Eldest, the Thirty-Cow Lion, the Grey Ten, Smoke-Wing, the dyke-king, the Old Man of Three Steps, the Old Steersman, the Sky-Horse.
- A fight is `fx.beast` (alone, so 89's badge shows its chance); a party hunt hands over to the release's `hunt_beast`. What you learn goes through `A.BT.learn`. Flags: `fb_dragon_watch`, `fb_told_temple`, `fb_sold_calf`, `fb_masked_loss`, `fb_bapa_lau_took`, `fb_drum_king`, `fb_drum_cousin`, `fb_giant_nod`, `fb_smoke_wing`, `fb_sold_salamander`, `fb_steersman_saved`, `fb_saw_named`, `fb_child_saw`, `fb_k_<id>` (killed), `fb_sight`, `fb_wild`; nothing reads them yet.

**State.** Flags only (26's `bt_*`, the scenes' `fb_*`), so old saves load. A save of the Great Continent installs the beasts again when it loads (through 99's `FL.set`). The far lands' data version is untouched.

## Known World unchanged

With `lands: 'known'` nothing is installed and every hook passes straight through (`FB.on()` is false). `fbKnownWorldSame` derives the build without this feature from the built file (its code and scenes cut, its patch undone) and compares three Known World lives of five years, every tab drawn, and the bestiary: the same state hash, random stream and markup.

## Measured by (`test.mjs`)

| Test | What it holds |
| --- | --- |
| `fbAllResolve` | 140 creatures, each in `LORE.creatures` with a tier and (unless a tale) stats, rarity, tale and yield; every fighter's curve installed; each near at least one reachable far province; no Known World province lists a far beast; `A.beastsNear` never lists one off its ground |
| `fbScenesRender` | every scene in every kind of far province it can fire in (by region, coast and ground word; a child and an adult): no raw token, text at most 80 words, every choice taken without an error; every scene eligible somewhere |
| `fbEncounters` | ten years from three far births (the Khaganate, Vahra, Busimo): beast scenes, sightings, creatures learned of in each life |
| `fbHonestOdds` | 2,400 duels against the 53 far fighters by far-born people (not the fit's pool): the duel screen's number against the result, by bin; the badge on a far fight's choice reads the same curve |
| `fbKnownWorldSame` | above |
| `fbFixedBeastGate` | the Known World scenes with a fixed beast are found; the wolves of the hard winter weigh 0 in Busimo and as before in Evenglade, in the same game and in a Known World game |
| `fbBestiaryPure` | a far child has heard of her own land's creatures more than of others; the bestiary draws the creature line; drawing it, a scene and a far duel changes neither the state nor the random stream |

`tools/lint-events.mjs` and `tools/lint-choices.mjs` pass. (The linter plays Known World characters only, so it reports the 32 scenes as never eligible; `fbScenesRender` plays them in the far lands.)

## Limits and what is left

- **Fallbacks inside Known World scenes** (`ctx.beast = n.length ? A.pick(n) : "CRE-21"`, `wk_hunt_beast`'s size cap) still name an Evenwood wolf when nothing near fits; in the far lands that is rare, since most far provinces have fighters of their own (the gate above covers the scenes whose beast is fixed). Scenes queued by other code (triggers) are not gated.
- **The Known World beasts 99 lets run on** (`FL.BEAST_LANDS`) stay where no far kin replaces them (the Tiger of Ranpur in the Southern Peninsulas' hills, the Green Anaconda and the Old Man of the Trees in the Deep Southland).
- The tiers follow the duel engine: a 45 kg snow leopard the lore calls a great beast is an animal here, as 48 retagged the Roc.
- Size-read stat blocks are for the 80 creatures that are hunted or seen, not fought; only the 53 fighters have fitted curves.
- Nothing reads the scenes' flags yet; the named individuals are lines in the data, not people of their own (no `S` record of the Ash Mother's death).
