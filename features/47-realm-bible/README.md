# The ways of each realm

**Aspect:** World and lore (Road to Ten, World 1, 2 and 7) · **Kind:** system, data for 34 realms, 1 event, no patches, plus a bench (`bench/customs.mjs`)

The plan says the world "hits 10 when each realm feels like a place with its own wants, and players learn it by living in it, not by reading the Codex." It asks for three things:

- **World 1:** a realm bible for each of the 34 realms, with one want, one fear, three customs and one place that matters, stored as data next to the realm.
- **World 2:** every custom turned into a rule the engine enforces, about 100 in all.
- **World 7:** each culture given two or three of its own words, used in titles and events.

Its gate: "bots show 90% of realms have at least 2 rules a typical life actually runs into".

In the release a realm's ways are paragraphs in its primer. Legal customs exist only for crimes, eight traditions cover 25 realms, and 17 of 468 culture words appear in any event.

**What it does.**

- **A bible for every realm** (`bible.*.data.core.js`): a want, a fear, a place, and three customs, all drawn from the realm's own lore. Some examples:
  - Aldmark's hearth mark, sworn on the iron ring.
  - Tamar's month on the dykes before the flood.
  - The Sand Clans' blood-debt of three camels or a knife at the well.
  - Sylvaran's rule that no iron goes under the old trees.
  - Skyhold's sky burial.
  - Blackreef's Articles, signed at eighteen.
- **Customs are rules of ten kinds**, each tied to a moment most lives pass through:

  | Kind | When | What it can do | Customs |
  | --- | --- | --- | --- |
  | `year` | a set month each year | a tax, a tithe, a fast, a muster | 22 |
  | `rite` | on reaching an age (17 to 30) | a test, an oath, a voyage | 14 |
  | `mourn` | a parent dies | who takes the estate: the eldest, the eldest son, the youngest, daughters, all alike, the temple's tenth first, or the lord | 17 |
  | `wed` | you marry | the dowry doubled, abolished, or turned into a bride price you pay | 8 |
  | `name` | your child is born | named for a grandparent or a parent (the release's naming prompt then offers it) | 7 |
  | `levy` | your realm goes to war | once a war: serve or pay | 6 |
  | `law` | after a punishment | what the custom adds | 8 |
  | `ward` | a standing rule, met when your life fits it (armed, mounted, rich, poor, unwed …) | | 13 |
  | `market` | you sell at home | a cut of the proceeds | 4 |
  | `grave` | your death | how you are buried | 3 |

  A parent's estate is new money: the release never paid one out while you lived. It goes by status, from 4 suns for a serf's to 5,000 for a royal's.
- **The first meeting is a scene** (`rb_custom`). The custom's own words tell you what is done here. You keep it (its effect applies), or you defy it and pay for that (its `defy` effect, and the custom remembers that you did). After that it is simply the custom: applied, and noted in the log as "Aldmark: The hearth mark. The reeve takes the hearth mark from your hald."
- **The Realm tab** gets a card, "The ways of Aldmark". It shows the want, the fear, the place, and each custom with how often you have met it ("met 3×, first in 1105", or "not met yet"), plus the culture's words.
- **Culture words** for all 24 cultures, invented rather than borrowed from Earth languages (the benchmark's W11 complaint). Examples: Northfolk *hald*, *ringsworn*, *folkmoot*; Tamari *hekkeb*, *ommaka*, *urnebu*; Skyfolk *hemmal*, *osselin*, *auralt*. They fill `{w1} {w2} {w3}` in every custom's words, and `{cw1} {cw2} {cw3}` in any event.

**Measured by.**

`test.mjs`:

| Test | Result |
| --- | --- |
| `bibleComplete` | 34 realms, 102 customs, 24 cultures with words; every custom of a known kind |
| `everySceneRenders` | All 99 scenes (grave customs have none) render from a life in their own realm and resolve: no raw token, none over 80 words, every label 12 words or fewer |
| `firstMeetingIsAScene` | The first meeting is a scene; keeping applies the custom, defying applies its cost and is remembered; a year later it is applied with a log line and no scene |
| `everyKindFires` | Each of the ten kinds fires at its moment: a bride price paid (287), a child named for its grandfather, an equal share of a father's estate, the levy once a war, a tenth off a sale |
| `sharesFollowTheLaw` | A middle son of three, estate 250: eldest 0, eldest son 0, youngest 0, daughters 0, equal 83, after the temple's tenth 75, to the lord 0 |
| `cardPureAndEscaped` | The card escapes its words, and drawing it changes neither the state nor the random stream |
| `realLivesMeetCustoms` | In eight realms (human, elf, dwarf, orc and giant), the first life that lasts 30 years meets at least 2 of its customs in all eight |

`node features/47-realm-bible/validate.mjs` checks the data statically: fields, lengths, tokens, and that each realm has at least two customs of the kinds most lives meet.

`bench/customs.mjs` checks the plan's gate. It plays a commoner of each realm's own people from 16, for up to 60 years, and keeps the first three lives that last 30 years. A grave custom is reported but not counted.

| Run | Realms where a median life meets 2 or more customs |
| --- | --- |
| The writers' first draft | 22 of 34 (65%), counting every life; many bot lives ended at 16 (a horse's kick, an ambush) and met nothing |
| Lives of 30 years or more only | 25 of 34 (74%). The misses leaned on customs a typical life never reaches: a grave custom (only at your own death), a cut of home sales (bots rarely sell at home), a rule for the mounted or the rich, and an estate custom among giants and dwarves, whose parents rarely die within sixty years |
| After moving ten customs to moments lives reach | **34 of 34 (100%)**; the plan's bar is 90% |

The customs met, over the 102 counted lives (`reports/customs.json`): year 65, mourn 47, ward 37, rite 35, law 16, levy 12, wed 11, grave 6, name 5. A bot seldom marries or has children, so the wed and name customs are the ones a player meets more often than the bench shows.

**Rules kept.**
- Everything is drawn in the month hook or at the moment itself. The card only reads.
- `pc.rb` (the customs met) is a new field, and a save without it loads.
- The data holds no markup, and every word on the card goes through `UI.esc`.

**Limits.**
- **Customs are the player's.** NPCs do not pay the hearth mark or split their estates by the law. A custom is a rule your life runs into, not a law the world simulates.
- **The want and the fear are words, not AI.** They are on the card and in the bible, but no realm's war choices read them yet.
- **The customs of the realm you belong to.** Travelling abroad does not bring another realm's customs into play.
- **Kinds are a toolkit.** About 100 customs share ten mechanisms, so two realms' taxes differ in month, size, words and what defiance costs, not in machinery.
