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
  - 3 to 5 sayings, and 2 to 8 knowledge lines that use its words.

  Some examples:

  | Culture | Lord · ruler · council | The year | Greeting · oath · curse | A saying, a line |
  | --- | --- | --- | --- | --- |
  | Northfolk | *haldern* · *Overhald* · *folkmoot* | the twenty-fifth winter of Aldwin | "Fire on your hearth." · "On the iron, and on the roof over me." · "May your hald pay twice and burn once." | "Pay the mark and keep the pig," the plough-folk say. · Here a word given over ale is talk; a word given on iron is ringsworn. |
  | Tamari | *sepmet* · *Tekkemu* · *sabbeku* | the year of the *n*th flood of the king | "May the water find your field." · "May your field sit above the water." | Every house owes the ommaka, a month on the dykes, whoever the sepmet is. |
  | Abari | *meshen* · *tsenar* · *getteb* | the year of Yared, the tsenar | "Peace on your terrace." | "Wait a year, and ask the other king," the old Rememberers say. |
  | Holdfolk | *harrok* · *Durmakar* · *brakkar* | the ninety-fifth year of Harvald, as the stone has it | "Stone under you." · "May your name be cut shallow." | Here a quarrel ends at a durrik, a line of the Deep Law cut in stone. |
  | Corsairs | *bookman* · *Topman* · *Spread* | the twelfth toll-year of Nell | "Fair water and a fat prize." | Nobody here boards a prize until the nebbet has been thrown. |
  | Skyfolk | *sengar* · *Kyelmo* · *shelna* | the *n*th snow of the Abbot | "Slow breath and sure feet." · "May the birds refuse you." | The dead go up to the auralt, and the birds take them; it is thought a kindness. |

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

**Measured by.** `test.mjs`. Builds: `--only=realm-bible,voices` (the words come from 47-realm-bible), and the full build where noted.

| Test | Result |
| --- | --- |
| `voiceBanks` | 24 of 24 cultures have a bank: 100 sayings and 118 knowledge lines. Every string fills, sayings are 16 words or fewer and lines 18, no line names a creature, and each culture has at least 4 words of its own. 40 of 40 traits have a tag, a beat and a bearing |
| `namingEveryCulture` | 24 of 24 cultures have a `GD.NAMING` rule of a known mode, and 12 names drawn for each come from its own lists with a surname by its rule (Solenfolk *Remo Lavinari*, Wind Riders *Sungkar of the Reed Wind*, Tamari *Djedet the Linen-Maker*) |
| `localEventsUseWords` (W12) | 21 cultures with local events, 1,752 draws (3 lives each). One of the culture's words shows in **0% before and 48% after**: lowest Zanari 32%, highest Amberfolk 56%, and **21 of 21 cultures at 30% or more**. A word or a voice line shows in 67%. Nothing goes over 80 words and no token is left raw. On the full build (all 52 features): 2,415 draws, 46%, lowest 36% |
| `twoVoicesOneEvent` | 8 events, each read with five pairs of traits (shy/proud, kind/cruel, honest/deceitful, calm/wrathful, witty/stoic). 40 of 40 pairs read differently, each in its own trait's manner. *"I have no son," he says, to the floor* against *"I have no son," he says stiffly* |
| `npcLinesHaveManner` | On the full build, 304 events cast a person and 49 of them quote a line. 37 of the 49 (76%) give the line its speaker's manner: 26 beats, 11 tags and 4 greetings. The rest are left alone because the line is ambiguous, already tagged, or somebody else's. Nothing goes over 80 words |
| `tokensFill` | All 14 tokens fill in 7 realms. The year: *the twenty-fifth winter of Aldwin* (Aldmark), *the year of Yared, the tsenar* (Abara), *the ninety-fifth year of Harvald, as the stone has it* (Stonehold), *the eighth grass of Vrag* (the Horde), *the twenty-eighth long dark of Skarvi* (Frostholm), *the 103rd tide-year of Saelith* (Eldergrove), *the twelfth toll-year of Nell* (Blackreef) |
| `voicePureAndEscaped` | The same view decorated twice reads the same, and decorating moves neither `A.S` nor the random stream. The Realm card changes nothing and escapes `<img>`. A drawn line is remembered in `pc.vo` and is not drawn again |
| `sameWorld` | 15 years in Tamar, played with and without voices (27 events voiced on the full build, 13 on the small one): the same random stream and the same people |
| `voicesInLives` | 12 bot lives on the full build, 321 years, 2,353 events. 70 of them are local: 46% show the culture's words, and 76% its words or a voice line. 70 voice lines, 2.2 a decade, and none heard twice within 5 years by the same character. 24 titles use the place's word, and 299 people's lines are in the speaker's manner. Nothing goes over 80 words |

W12, culture by culture (`localEventsUseWords`, three lives each, the share of its local events that show one of its words):

| Culture | Local events | Before | After | Word or voice line |
| --- | --- | --- | --- | --- |
| Solenfolk | 48 | 0% | **51%** | 72% |
| Northfolk | 48 | 0% | **46%** | 62% |
| Wind Riders | 37 | 0% | **51%** | 69% |
| Qadiri | 28 | 0% | **43%** | 57% |
| Sandfolk | 29 | 0% | **55%** | 70% |
| Tamari | 30 | 0% | **52%** | 69% |
| Sabrans | 29 | 0% | **52%** | 78% |
| Zanari | 23 | 0% | **32%** | 55% |
| Abari | 27 | 0% | **35%** | 73% |
| Keshi | 27 | 0% | **41%** | 78% |
| Eastfolk | 28 | 0% | **48%** | 57% |
| Skyfolk | 26 | 0% | **51%** | 67% |
| Ranpuri | 28 | 0% | **54%** | 71% |
| Amberfolk | 12 | 0% | **56%** | 75% |
| Corsairs | 31 | 0% | **46%** | 71% |
| Sylvari | 20 | 0% | **37%** | 55% |
| Grovers of the Coast | 17 | 0% | **49%** | 61% |
| Holdfolk | 28 | 0% | **55%** | 64% |
| Horde clans | 22 | 0% | **39%** | 68% |
| Tusk clans | 24 | 0% | **53%** | 69% |
| Hall-giants | 22 | 0% | **55%** | 61% |

The words counted are the culture's realm-bible words plus its own words for a lord, the ruler and the council. In the release none of them appear in any event, so "before" is 0 everywhere. (The benchmark's own baseline, 17 of 468 lexicon words in 41 events, counts the release's word lists, which W11 finds are mostly real Earth languages.) Shares are of the events as each life draws them: a line comes 75% of the time, by a hash of the life and the event, and only where it fits the 80-word limit and the culture has a line on the event's subject.

**Rules kept.**
- Every choice is a hash of ids (FNV-1a over the life, the event and the person), never a draw from `A.rand`. The decoration is a pure function (`A.VOICE.decorate`). The one state it keeps is `pc.vo`, the years a life last heard each line. It is written when the engine first draws a view in `A.headReady`, the same moment the release runs an event's `setup`. A save without `pc.vo` loads.
- `sameWorld`: a life played with and without voices reaches the same random stream and the same people.
- Nothing is added that would take an event past 80 words. A line that cannot fill every token is dropped.
- The Realm card escapes everything it shows.
- The data holds no markup.
- No voice line names a creature, so 26-belief-truth's "you hear of it" never fires on a proverb.

**Limits.**
- **A line is appended, not woven in.** The voice line is its own short paragraph at the end of the event: a knowledge line, not a rewrite. The swaps change one word. The release's own sentences still speak plain English.
- **Topic matching is by keyword.** A grave scene can get a saying about debts if it talks about money more than about the dead. I read the fits by eye on samples of about 40 draws, so the fit is not measured. Most were apt, and some were only near.
- **The banks are small.** 5 to 12 lines a culture, so a long life hears each one several times, five years apart. A writers' pass could double them. The benchmark's quality gate, a blind panel matching texts to their culture, needs people.
- **Attributing a quoted line is a heuristic.** A line is given to the person of the event only when they are named as the one acting in the sentence of the line or the one before. On the full build 12 of 49 quoted lines (24%) are left alone this way. A wrong attribution is possible when two people of the same sex speak close together.
- **Three cultures have no local events.** The Leaf People and the Cloudfolk have no realm, and the Marchfolk have two events gated to the unclaimed lands. Their banks are used only by their people as NPCs: greetings and `{themSaying}`. W12 is measured over the 21 cultures that have local events.
- **The words of the ruler and the lord are per culture.** One word serves all five Northfolk realms (*Overhald*), and some realms might deserve their own.
