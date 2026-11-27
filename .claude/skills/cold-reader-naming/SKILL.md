---
name: cold-reader-naming
description: "Name or rename anything a player reads in Ardan (or a similar life-sim, RPG or strategy game) so a newcomer understands it cold: realms, places, people, houses, titles, ranks, classes, skills, items, creatures, demons, dragons, legends, card text. Plain English by default; fantasy buzzwords and archaisms (wyrm, drake, thane, jarl, reeve, liege, fey, X-born, khan, sultan) are cut, while the owner's own words stay; every proper name meets the player with its descriptor ('the Kingdom of Kesh'); names that stand together look different; a rename is done safely (ids kept, old saves converted, event text read as text) and measured with the bundled audit script. Use whenever you add or change a name a player can see, when a name or term confuses the owner or a playtest, in order 100's wave 5 naming pass, for the new map's place names, and when reviewing any data or lore change that adds names."
---

# Cold-reader naming

**One job:** every name a player reads can be understood by someone who has never seen Ardan, without a glossary,
while the world stays deep enough to take a long time to master. The owner's words: "every name understandable to a
newcomer ('Kesh' becomes 'Kingdom of Kesh'; 'the Seventh Gate' carries its plain meaning). Easy to learn, long to
master" (order 97); "cold reader naming needs to far exceed what currently exists in the game, using plain language a
lot of the time instead of random buzz words like wyrm" (2026-11-27). Rules 9 and 11 (`docs/OWNER_ORDERS.md` "Game
rules"): names basic and simple; one common English language, plain English names for most realms; a few far or
non-human peoples may sound different. Order 99: realms are only a **kingdom, empire, principality, merchant
republic or free city**. Order 100 makes every naming call ours.

**Today is far below the bar, not near it** (`references/ardan-offenders.md`): about 2,900 uses of unambiguous
buzzwords and archaisms on the page (4,900 with the words that offend only in some uses), about 1,000
X-born/X-walker/X-breaker compounds, 66 pairs of near-identical names of different kinds, 35 Tolkien, Warcraft and D&D
names and real cities in the name pools. Treat a name you did not check as wrong.

- `references/naming-study.md`: how history, Tolkien, Martin, Le Guin, Dark Souls, the Witcher, the Elder Scrolls,
  Solo Leveling and Overgeared name things, and what memory research says; with sources. Read it once.
- `references/ardan-offenders.md`: the working list for wave 5 (buzzword table with counts and plain words, realms,
  near-duplicates, legends, the dragon ladder, places, people, ranks).
- `scripts/name-audit.mjs`: the measure (buzzwords, compounds, near-duplicates, borrowed names). Read-only.

## The rules

0. **The owner's own words win.** Names and terms the owner chose stay as he wrote them, glossed where a newcomer
   needs it: Noir, Blanc, Red, the Primordials, archdemon, ancient demon, Vaskareth, the Dragon King, the Sword Saint,
   Dragonoid Form, Dragon Slayer, Archmage. No rule below overrides an order; if one seems to, ask or record a decision.
1. **Plain English is the default.** Use the word a reader already knows: dragon, young dragon, demon lord, ghost,
   fairy, earl, lord, headman, steward, castle keeper, chief minister, burial mound, marsh, valley, borderland, post
   station, fortress. An invented or archaic word is the rare exception and must pass the test below.
2. **No buzzwords or archaisms.** Not wyrm, wyrmling, drake, drakeling, dragonet, thane, jarl, hird, reeve, liege,
   castellan, seneschal, fey, eldritch, barrow, wight, revenant, lich, ettin, fiend, imp, khan, khatun,
   sultan, emir, vizier, nome, yam, caravanserai, kremlin, veld, ere, nay, aye, unto; not the stock compounds
   fused into one word or hyphen (X-born, X-sworn, X-kin, X-bane, X-slayer, X-walker, X-caller, X-breaker, X-weaver,
   X-singer, X-fang, X-hide, X-mane: "Wyrmslayer", "Storm-born") as titles or epithets. Two plain words naming a deed
   are fine and preferred: "Dragon Slayer" (the owner's own choice), "Born in Hell". The plain word for each is in `references/ardan-offenders.md` §1. Real flavour comes
   from people's names and customs (rule 11), never from untranslated office words.
3. **Descriptor + name at first sight.** A proper name a player has not met carries what it is: "the Kingdom of Kesh",
   "Ashmere, the lake kingdom", "Morvane, a demon lord", "Noon Hall, the sword school of Varenna", "the Thing, the free
   men's assembly". Lists, map labels, headings, card titles and log lines count as first sight. Later on the same
   card the bare name is fine. Where a screen has no room, the gloss goes in a click-to-open note
   (`data-note="..."`, never `title=`, never hover).
4. **A name carries its meaning.** Places say what or where they are (Saltbridge, Northmoor, the Burning Waste, the
   Wall); a numbered or ranked thing says of what ("Prince of Hell's Seventh Gate", not "Prince of the Seventh Gate");
   a title says rank + domain ("Duke of Harrow", "Captain of the Iron Guard", "Keeper of the Dragon Gate"), never a
   job word alone ("the Ledger-Keeper"). A name must not say the opposite of the thing (a sea kingdom named Eldergrove).
5. **One invented word per name, three new names per screen.** "Vaskareth, the Storm Dragon" has one; "the Hrimfell
   Jotunhall Thing" has three. A card or screen introduces at most three names the player has not met (the "five
   finger" rule); a fourth waits for the next card.
6. **Neighbours look different.** Names that can appear together (the realms; one realm's houses, places and
   people; the demons; the dragons; the legends; a menu's items) differ in first letter or in shape and ending, and no
   two are within one letter of each other (Corvasse / Corvane / Morvane, Kesh / Vesh, Abara / Sabra fail). A house is
   not named like a realm plus a letter (Brannoch / House Brannoc), a demon not like a house, a capital not like its
   realm plus a letter (Qadir / Qadira). Spread names over the alphabet.
7. **One word, one meaning.** Order 98: "Legend" means the level 800-1000 legends only. Likewise one word per rank on
   a ladder (the dragon ladder: {kind} hatchling, young {kind} dragon, {kind} dragon, elder {kind} dragon, ancient
   {kind} dragon), one word per office (not Warden for a class, a rung and a legend), and the rarity ladder of order
   98 (basic, rare, epic, legendary, mythical) only for rarity.
8. **Far and non-human peoples may sound different, with a plain gloss.** Orc, giant, dwarf and elf names and the far
   peoples' pools keep their sound (rule 11), but each such word is glossed at first sight and the humans have a
   plain English name for the thing ("Kharsa, the Wind Riders' tent city"). The owner's own invented names
   (Noir, Blanc, Red; Vaskareth) stay, glossed: "Noir, First Demon of Shadow".
9. **Epithets are plain words about a deed or a look.** One per person: the Conqueror, Longshanks, Lackland, the
   Lawgiver, Six-Fingers. Not stacked compounds ("Grakka Ironhide the Bloodfist"), not a sentence ("Who Bled
   Laughing"), not a cliché (Skullcrusher, Deathbringer). A title won in play says the deed: "Dragon Slayer", "Born in
   Hell", "Sworn to Noir".
10. **Nothing borrowed.** No names from other works (Galadriel, Durin, Oakenshield, Ironforge, Gruumsh, Hammerfell,
    Stormbringer) and no real cities (Samarkand, Basra, Madurai). Real given names are fine; that is the common pool.
11. **Depth is a second layer, never the label.** The plain name is on the button; the old name, the people's own word
    and the history live in the description, the codex and the lore (Tolkien's Mount Doom on the map, Orodruin in the
    appendix). A player who digs finds more; a player who does not still understands.
12. **Ids never change.** A rename changes what is shown (`name`, `short`, `title`, `n`, text), never an id
    (`POL-21`, `FAM-024`, an event id, a title, skill, class or bestiary id): saves, code and tests key on ids.

## The test an invented or archaic word must pass

Keep it only if **all** hold: (a) the thing is unique to this world and no plain English word or two-word phrase says
it; (b) it belongs to a people rule 11 lets sound different, or the owner chose it; (c) it is short, sayable on first
reading, and unlike every name it stands beside (rule 6); (d) the player will meet it often enough to learn it, and
it is glossed the first time. Otherwise, write the plain words. When unsure, plain wins.

## Checklist for each name

- [ ] Would a newcomer know what kind of thing this is from the name and its first-sight descriptor alone?
- [ ] Plain English, or does it pass the four-part test? No word from rule 2's list?
- [ ] At most one invented word? Three or fewer new names on the screen where it first appears?
- [ ] Unlike its neighbours (first letter, shape, no one-letter twins)? Run `name-audit.mjs --near`.
- [ ] A title or rank: rank + domain, in words that order themselves (baron < count < duke)?
- [ ] A realm: one of order 99's five forms, written "<Form> of <Name>" or with its descriptor?
- [ ] Borrowed from another work or a real city? (`--borrowed`)
- [ ] Says nothing false about the thing (a sea realm named for a grove)?
- [ ] The id unchanged; old saves still show the new name (below)?

## Renaming safely in this repo

**Find every place the name lives.** `grep -rn "Old Name" src data docs/design` (and its short form, plural,
possessive and demonym), plus `tools/show.mjs --where A.someFunction` for release code. Names live in:

| Kind | Source of truth | Its check |
| --- | --- | --- |
| Realms (name, short, ruler's title, type), cultures, faiths, houses, schools, ladders, figures, wars, provinces | `src/core/release/core/00-lore.json`, `src/core/release/lore/*.json`, and prose in `src/core/release/core/*.js` and `content/*.js` | `nmRealms`, `nmOldNames` (`src/world/999981-names-and-cultures/test.mjs`) |
| Realm customs, voices, starting stories, memory events | `src/world/47-realm-customs/`, `src/events/*/` | `tools/lint-events.mjs` |
| People's name pools | `docs/research/c7-name-data.json` -> `node tools/c7/build-names-data.mjs` -> `data/names.json` (never edit the output) | `node tools/c7/build-names-data.mjs --check`, `node --test tests/v2/names.test.js` |
| Legends, ancient demons, dragons, masters | `data/legends.json`, `data/figures/*.json` | `node tools/lint-figures.mjs` |
| Titles | `data/titles/*.json` | `node tools/lint-titles.mjs` |
| Creatures | `data/bestiary.json` (and `lore.creatures`) | `node tools/lint-figures.mjs` (kinds and counts) |
| Classes, skills | `data/classes.json`, `data/skills.json`, `data/skills/` | `node tools/lint-skills.mjs` |
| Feature folders, file names, docs and tools paths (not in-game names) | `tools/rename-map.json` -> `node tools/rename-pass.mjs [--dry]` | it refuses a rename that changes the build order; writes `docs/NAMES.md` |

**Which tool.** `tools/rename-pass.mjs` (with `tools/rename-map.json` and its lookup `docs/NAMES.md`) is the naming
pass for **paths**: folders, files, docs, tools. Use it for those, adding a row to the map and running it again (it
skips renames already done, rewrites every reference, keeps records of the past frozen). It does not touch in-game
names. For **in-game names** the precedent is `tools/c7/rename-realms.mjs`: it rewrites only string and template
literals in `src/` JavaScript and string values in JSON, refuses an edit that breaks the parse, and lists the regular
expressions that name a realm for you to read by hand. For a handful of names, edit by hand from the grep. For wave 5's
hundreds, make a general game-name rename tool from rename-realms (a map of old -> new display strings, with the
verb-agreement and article fixes it carries) as a step of its own, owned by whoever owns `tools/`, and add its map to
`docs/NAMES.md`.

**Keep these safe:**

- **Saves.** A save keeps copies of some names: `S.realms[id].name` and `.short`, province names in `S.prov`, people's
  names, and the log's prose. Old saves must show the new realm and place names: extend the old-name table and
  `N.renameState` in `src/world/999981-names-and-cultures/names.core.js` (spell old names in pieces with `J(...)` so the
  page holds none of them) and the `OLD_NAMES` pattern of its `nmOldNames` test. The log keeps the words it was written
  in, like a real chronicle. Run `savesStillLoad` (`tests/suites/saves.test.mjs`).
- **Event functions are read as text** (CLAUDE.md). `A.evAudience` matches `A.EV_RX` against an event's text and
  `A.CX_RX` against its `cond`, so a new word can move a card to another audience (tavern, street, master, a lord's
  favour); in `src/core/release/content/` each function keeps its exact one-line text, so change only the words inside
  strings. Run `node tools/release/identity-probe.mjs before.html after.html` and check that every event's audience
  class and fit are unchanged; the fixed lives' fingerprints will differ, because names are state.
- **Grammar around a name.** A realm's name and short form are dropped into prose by `A.realmName` / `A.realmShort`
  and the tokens `{realm}`, `{realmShort}`: a plural ("the Ughrak Clans are") or a form that takes "the" changes the
  sentence around it. Read the hits of `"the {realm}"`, `{realmShort}'s` and the realm's adjective (Keshi, Qadiri).
- **Regular expressions** in code that match a name (rename-realms lists them): grep `src` for `/...Old.../`.
- **Determinism.** Changing a name pool changes which names every world draws and, through the twin check, can rename
  people: tests must be world-robust (CLAUDE.md, H-082), never pinned to one world's names.
- **Parallel work.** Wave 5 touches every system's text. Split it by owner (one builder per system's folders or data
  files, one for `src/core/release/`), per `.claude/skills/ardan-integration`.
- **Records.** A rename table goes in `docs/NAMES.md`; the choice of a name or a rule in `docs/DECISIONS.md`; the step
  in `docs/HISTORY.md`; the player-facing change in `CHANGELOG.md` ("Realms now read Kingdom of..., dragons are
  dragons"). Follow `.claude/skills/ardan-dev-process` for the step.

## Test it

```sh
node tools/build.mjs --out=/tmp/ardan/<me>/x.html --unpack=/tmp/ardan/<me>/blobs      # a private build
node .claude/skills/cold-reader-naming/scripts/name-audit.mjs --blobs=/tmp/ardan/<me>/blobs --near --borrowed \
     --json=/tmp/ardan/<me>/names.json                                                # buzzwords, compounds, twins, borrowed
grep -o "Old Name" /tmp/ardan/<me>/blobs/*.js | wc -l                                  # the old name is gone (0)
node tests/run.mjs /tmp/ardan/<me>/x.html --only=nmOldNames,nmRealms,savesStillLoad   # names, realms, old saves
node tools/lint-events.mjs --feature=<feature> --html=/tmp/ardan/<me>/x.html           # each feature whose text changed
node tools/lint-figures.mjs && node tools/lint-titles.mjs && node tools/lint-skills.mjs && node tools/lint-kin.mjs
node tools/c7/build-names-data.mjs --check && node --test tests/v2/names.test.js
```

Record the audit's counts before and after in the step's HISTORY entry; they may only fall (wave 5's targets are in
`references/ardan-offenders.md` §10). Then the **cold reader pass**: give a fresh agent (Sonnet, default effort, no
repo context) the first screens and the first ten cards of three lives (a peasant, a noble, a soldier; screenshots or
`document.body.innerText`) and ask it to list every word or name it cannot explain or that it confused with another.
Every item it lists is a finding; fix them and run it again (the `game-ux-playtest-loop` skill's loop).

## Examples

- "Wyrm-Slayer" -> "Dragon Slayer" (order 98). "Cave Wyrmling" -> "young cave dragon". "Snow Drake" -> "snow dragon".
- "Kesh" on the realm list -> "Merchant Republic of Kesh" (its government is a council of merchant houses).
- "Prince of the Seventh Gate" -> "Prince of Hell's Seventh Gate". "the Scorched March" -> "the Scorched March, the
  burnt borderland two demon lords fight over" at first sight.
- "Jarl Halvard Stagg brings the cook to the Thing" -> "Earl Halvard Stagg brings the cook before the Assembly".
- "Otbash Yam" -> "Otbash Post Station". "Lubevo Kremlin" -> "Lubevo Fortress". "the Western Veld" -> "the Western
  Grasslands".
- "Marquis of the Burning Court" (a demon kind) -> "fire demon lord"; "Ember-Sworn" -> "Sworn to Red".
- Keep: "Kingsmere", "Saltbridge", "the Burning Waste", "Bone-Crack Hyena", "Soulmarket", "the Lawgiver": plain parts,
  a clear meaning, the model for everything else.
