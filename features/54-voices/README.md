# Voices

**Aspect:** Events and story (Road to Ten, Events 6) and World and lore (World 7) · **Kind:** system and data for 24 cultures and 40 traits, no patches, no new events

The plan asks for two things:

- **Events 6:** "Give each culture its own event voice (word choice, sayings), and let NPC lines match their personality."
- **World 7:** "Give each culture naming rules and 2 or 3 of its own words that show up in titles and events."

Its benchmark (W12, `docs/benchmarks/world-lore-uniqueness.md`): "≥30% of each culture's local events use ≥1 of its words; every culture has a naming generator". In the release 17 of 468 culture words appear in any event, in 41 events (1.3%). 47-realm-bible gave every culture two or three invented words, but no release event used them.

**What it does.**

- **A voice bank for each of the 24 cultures** (`voices.a.data.core.js`, `voices.b.data.core.js`). All of it is invented for Ardan: no real proverb and no real language. Each bank has:
  - its own word for a lord, for its ruler and for its great council;
  - how it names the year;
  - a greeting, an oath and a curse;
  - 3 to 5 sayings, and 2 to 7 knowledge lines that use its words.

  Some examples:

  | Culture | Lord · ruler · council | The year | Greeting · oath · curse | A saying, a line |
  | --- | --- | --- | --- | --- |
  | Northfolk | *haldern* · *Overhald* · *folkmoot* | the twenty-fifth winter of Aldwin | "Fire on your hearth." · "On the iron, and on the roof over me." · "May your hald pay twice and burn once." | "Pay the mark and keep the pig," the reeves say. · Here a word given over ale is talk; a word given on iron is ringsworn. |
  | Tamari | *sepmet* · *Tekkemu* · *sabbeku* | the year of the seventeenth flood of Amenhar | "May the water find your field." · "May your field sit above the water." | Every house owes the ommaka, a month on the dykes, whoever the sepmet is. |
  | Abari | *meshen* · *tsenar* · *getteb* | the year of Yared, the tsenar | "Peace on your terrace." | "Wait a year, and ask the other king," the cattle keepers say. |
  | Holdfolk | *harrok* · *Durmakar* · *brakkar* | | "Stone under you." · "May your name be cut shallow." | Here a quarrel ends at a durrik, a line of the Deep Law cut in stone. |
  | Corsairs | *bookman* · *Topman* · *Spread* | the twelfth toll-year of Nell | "Fair water and a fat prize." | Nobody here boards a prize until the nebbet has been thrown. |
  | Skyfolk | *sengar* · *Kyelmo* · *shelna* | | "Slow breath and sure feet." · "May the birds refuse you." | The dead go up to the auralt, and the birds take them; it is thought a kindness. |

- **Local events speak in the culture's voice.** An event whose `cond` is gated to a realm or a culture (`C.realm`, `C.cult`, `p.realm ===`), or to an elder race, is local. When one is first drawn:
  - it ends with a line of that culture on the event's own subject. The subject is read from the event's words: money, law, an oath, a death, war, kin, faith, land, the sea, a feast, a guest, work, power or the road. A line in the culture's words comes up three times as often as a plain saying. A line a life has heard is not used again within 5 years (`pc.vo`).
  - a plain word the culture has its own word for is swapped for it on its first use: "household" becomes *hald* in Aldmark and *olkosh* in Velgrad, "flood mark" becomes *hekkeb* in Tamar, "blood-debt" becomes *khessur* in the Red Waste.
- **Titles in the place's words.** A title that names a lord or the realm's ruler uses the place's word: "The lord's days" becomes "The haldern's days" in Aldmark, and in Lucerna "The Doge weds the sea" becomes "The Corrimar weds the sea". The Realm tab gets a card, "How the Northfolk speak". It gives the ruler's local name next to the ruler ("Emperor Aldwin Ironside is the *Overhald* here"), the three words with their meanings, the year, the greeting, the oath, the curse and the sayings.
- **People speak in their own manner.** Each of the 40 traits has its manner (`voices.traits.data.core.js`):
  - a tag after the speaking verb: shy "quietly", proud ", chin up", cruel ", smiling";
  - a beat after an untagged line: "She says it to the floor." "He smiles while he says it.";
  - for a move made toward you with no line quoted (21-npc-initiative), a greeting in the person's own culture's words, said in their manner: *Aldwin comes by after dark and does not sit down. "Fire on your hearth," he says stiffly.*

  The line is taken to be theirs only when they are named as the one acting, in the line's sentence or the one before it. A line the writer already tagged ("she says quietly"), or one given to somebody else ("the reeve says"), is left alone.
- **Tokens for writers.**
  - For the player: `{saying}`, `{oath}`, `{greet}` and `{curse}` in the player's culture, and `{lordWord}`, `{rulerWord}`, `{councilWord}` and `{yearName}` in the place's.
  - For the person of the event (`ctx.pid`): `{themSaying}`, `{themOath}`, `{themGreet}`, `{themCurse}`, and `{theySay}` (also `{they_say}`), which is "says" plus their trait's manner.
- **Naming.** The release already gives every culture a naming rule (`GD.NAMING`: place, house, clan, trade, tribe, hall, patron, deed, crew, band, line or single). The test below holds all 24 to it.

**Measured by.** `test.mjs`, on `--only=realm-bible,voices` and on the full build:

| Test | Result |
| --- | --- |
| `voiceBanks` | RESULT |
| `namingEveryCulture` | RESULT |
| `localEventsUseWords` (W12) | RESULT |
| `twoVoicesOneEvent` | RESULT |
| `npcLinesHaveManner` | RESULT |
| `tokensFill` | RESULT |
| `voicePureAndEscaped` | RESULT |
| `sameWorld` | RESULT |
| `voicesInLives` | RESULT |

W12, culture by culture (`localEventsUseWords`, three lives each, the share of its local events that show one of its words):

TABLE

**Rules kept.**
- Every choice is a hash of ids (FNV-1a over the life, the event and the person), never a draw from `A.rand`. The decoration is a pure function (`A.VOICE.decorate`). The one state it keeps is `pc.vo`, the years a life last heard each line. It is written when the engine first draws a view in `A.headReady`, the same moment the release runs an event's `setup`. A save without `pc.vo` loads.
- `sameWorld`: a life played with and without voices reaches the same random stream and the same people.
- Nothing is added that would take an event past 80 words. A line that cannot fill every token is dropped.
- The Realm card escapes everything it shows.
- The data holds no markup.
- No voice line names a creature, so 26-belief-truth's "you hear of it" never fires on a proverb.

**Limits.**
- **A line is appended, not woven in.** The voice line is its own short paragraph at the end of the event: a knowledge line, not a rewrite. The swaps change one word. The release's own sentences still speak plain English.
- **Topic matching is by keyword.** A grave scene can get a saying about debts if it talks about money more than about the dead. Most fits are apt; some are only near.
- **The banks are small.** 4 to 11 lines a culture, so a long life hears each one several times, five years apart. A writers' pass could double them. The benchmark's quality gate, a blind panel matching texts to their culture, needs people.
- **Attributing a quoted line is a heuristic.** A line is given to the person of the event only when they are named as the one acting in the sentence of the line or the one before. In about one quoted event in six it is ambiguous and is left alone. A wrong attribution is possible when two people of the same sex speak close together.
- **Three cultures have no local events.** The Leaf People and the Cloudfolk have no realm, and the Marchfolk have two events gated to the unclaimed lands. Their banks are used by their people as NPCs (greetings, `{themSaying}`) and on the Realm card. W12 is measured over the 21 cultures that have local events.
- **The words of the ruler and the lord are per culture.** One word serves all five Northfolk realms (*Overhald*), and some realms might deserve their own.
