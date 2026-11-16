# Scene tags: where an event happens

**Aspect:** event pictures (work item C8c; CRITIQUE V17; D-060) · **Kind:** readable core code, no events, no patches, no state.

The critique found event pictures showing the wrong subject ("a farming offer shows a forge; a cow in a ditch shows a
bedroom"): the print was chosen by the event's *shape* (25-variety-guard's `A.evShape`, made to keep two like events from
following each other), and "work" was always an anvil. Every event now has a **scene tag**, and the picture follows it.

## The tags

`court, home, church, market, field, workshop, road, sea, wild, war, fight, tavern, street, sickbed, school, prison, grave, feast` (`A.SCENE.TAGS`).

- **An event may say its own:** `scene: "field"` on the event. A feature that queues a card may set `ctx.scene`.
- **The rest are read once** from the event itself (`A.SCENE.tagOf(e)`, kept in a WeakMap): the words of its title
  (counted twice) and text that name a place (`A.SCENE.WORDS`; a `{token}` is not a word), its shape (a little less than
  one word), and who it is for, read from its condition as `A.CX_RX` reads it (a soldier's event leans to the camp, a
  ruler's to the court, a smith's to the workshop; what a condition rules out, `!C.soldier(p)`, is not who it is for).
  The highest count wins; a tie goes to the rarer place (`A.SCENE.ORDER`).
- The tag is **for pictures only**. It changes no weight, no roll and no state; `A.evShape` guards the roll as before.

## What follows the tag

- **The print** (`A.SCENE.shapeFor(e, tag)`; `UI.WOODCUT.shapeOf` in 61-illuminated-chronicle asks it): the event keeps
  its own shape's print when that shape can stand in the scene (`A.SCENE.FITS`: a letter at home, a storm on the road),
  else it takes the scene's own (`A.SCENE.PRINT`). Two prints were drawn for it in 94-woodblock-skies: **the fields**
  (stooks of corn, a plough and its ox by a thatched barn) and **a market** (three stalls under striped awnings); a scene
  tagged the sea is always at sea and one tagged the road never is. The print says its scene (`data-shape`, `data-scene`).
  With the colour prints turned off, 61's ink woodcut has no field or market block and draws its ornament for them.
- **Dress** (`A.SCENE.wearFor(tag)`, read by 93-figures): the people on the card are dressed for the scene: their best at
  court, in church and at a feast, mourning at a graveside, a cloak on the road, at sea and in the wild, their harness in
  a camp of war and in a fight, working clothes in the fields and the workshop, everyday dress elsewhere. A hood is raised
  only under the sky (`A.SCENE.outdoors`).

## Measured by (`test.mjs`)

| Test | What it holds |
| --- | --- |
| `stTags` | A held-out sample of 59 events labelled by hand (the scenes a reader would accept): 49 tagged as a reader would, 83 in 100 (floor 80). All 5,004 events have a tag; no tag holds two fifths of them (home 1,130, war 569, court 474, church 320, market 312, sea 308, field 297, road 292, workshop 231, street 200, wild 185, tavern 160, sickbed 138, school 123, feast 95, grave 78, fight 75, prison 17). An event's own `scene` and a card's `ctx.scene` come first; a hostile one is ignored. Reading is pure and the same twice |
| `stPictures` | A 60-card sample drawn as the game draws it: every print is the tag's own or one that fits it and says its scene; the player's bust on each card is dressed for the scene; no hood indoors; a farming offer and a cow in a ditch both show the fields |

## Limits

- **The reader is right about five times in six, not always.** Two samples of 60 were used to write the word lists (they
  read 78 and 77 in 100 before, 57 and 53 of 60 after); the third, in the test, was not. What it gets wrong is mostly an
  event whose words name another place in passing ("polite as a priest", "held the line", a "merchant train" over a
  pass). The remedy for an event that matters is its own `scene:` line; none of the 5,004 has one yet.
- **Eighteen scenes, twenty-seven prints.** The critique asked for about sixty compositions. A prison shows the dark
  archway, the wild shows eyes in the forest, the sea is the road's print with its ship. Interiors by class and framing
  by biome (V19) are not done.
