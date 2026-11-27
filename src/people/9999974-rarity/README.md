# 9999974-rarity: one rarity ladder

**Aspect:** orders 97 and 98 (D-200) · **Kind:** system, one readable core file, data (`data/rarity.json`), a test.

## What it does

- **One ladder for everything:** basic, rare, epic, legendary, mythical, for skills (`data/skills/`), titles
  (`data/titles/`), classes (`data/classes.json` and its generator) and the items of the great beings' sheets
  (`data/legends.json`, `data/power.json`, `data/figures/`). Levels are a separate system beside it (order 97).
- **The words live in one file,** `data/rarity.json`; each system keeps only its own figures by those words (a title's
  caps and budget, `data/titles/vocab.json`; a skill's budget bonus, `data/skills/vocab.json`; a class's gifts,
  `data/classes.json` generator) and the validators (`tools/lint-skills.mjs`, `tools/lint-titles.mjs`,
  `tools/lint-figures.mjs`) read the ladder from there. The engine's title caps (`E.CAP_BOOST`) name the five words.
- **Older words:** common and uncommon read as basic (the owner's answer 1, `A.RARITY.of`). "Unique" is no rarity:
  one holder at a time is a flag apart from it (a title's `unique`, a skill's census `one`, and every legendary and
  mythical class: one living holder, never advanced; D-201). No save holds a rarity word (titles, classes and skills
  are stored by id), so nothing is migrated for the ladder itself.
- **Make apart from rarity:** a made thing's make (crude, plain, fine, masterwork) is the smith's care, not its rarity.
  An item of a sheet says `rarity` and may say `make`; a screen prints the make and the rarity above basic ("a
  masterwork sabre", "a legendary relic"). The release's gear keeps its make (`GD.QUAL`: "Common" reads "Plain"); the
  look (`91-visual-style`) tints a masterwork piece rare.
- **A great being's own arts are one set** of one rarity (`A.RARITY.setOf`): the rarest title it holds, at least its
  category's figure (`data/rarity.json` beings).

## API (`A.RARITY`)

`LADDER`, `of(word)` (a word read as the ladder's, or null), `rank(word)`, `word(word)` (what a player reads),
`rarest(list)`, `oneHolder(word)`, `setOf(sheet, category)`, `itemWords(item)`. Pure: no draw, no write.

## Tests

`rarityOneLadder`: every skill, title, class and item of the build on the ladder and no other word; older words mapped;
the screens that print a rarity (titles' cards, the profile, classes' notes, items, gear chips) print no retired word.
