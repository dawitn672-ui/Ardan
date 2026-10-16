# The world record

**Aspect:** World and lore (Road to Ten, World 5), Replayability (Replayability 5), Uniqueness (signature 1, the Chronicle) · **Kind:** system, 13 events, no patches

The plan asks for two things here:

- **World 5:** "Keep a living world chronicle: wars, deaths, foundings and famines, with dates. NPCs and events refer back to it ('since the burning of Tessaria…')."
- **Replayability 5:** "When a dynasty ends, export a readable history of the family and the world, like Dwarf Fortress legends." The Chronicle (22) already exports every life. It had no world legends.

The benchmark bars (`docs/benchmarks/world-lore-uniqueness.md`):

- **W5:** "A dated record of the whole run, ≥10 kinds, nothing dropped, with place and people on each entry."
- **W6:** "≥15% of a life's events cite a dated entry from this run or canon, and the entry is possible in that place and time."

In the release the world remembers two kinds of thing (`S.history`: war ends and realm falls, about 30 lines in 60 years) and 220 lines of news. At year 60 that news reaches back only three years. No event reads `S.history`.

**What it does.**

1. **The record** (`a-record.core.js`, `S.wrec`). It keeps a dated entry for each of **18 kinds**:
   - war begun; war ended, with the victor and the provinces ceded;
   - a field battle of 24,000 men, or of 9,000 fighting five days or more;
   - a siege laid to a walled town, and how it ended (fell or lifted, after so many days);
   - a walled town taken: on terms, by storm, sacked (a capital, or a town of 150,000), or burned (sacked by another race, or by another faith in a holy war);
   - a province changing hands;
   - a ruler's death, with the cause, the age and the successor;
   - a throne taken without a death;
   - a realm fallen; a realm founded (by grant, out of the free lands, or by a rising that won its war);
   - a rebellion (a claimant or a league of lords);
   - famine (45-economy's failed harvest);
   - an epidemic;
   - a royal marriage; an alliance; tribute bound or thrown off;
   - an elite order destroyed; the death of a Legend (32-ladder's top tier).

   Each entry is `[kind, year, day, province, realm, other realm, [people], number, extra]`. People are ids, and their names go into a table when the entry is made, because the release prunes the dead from `S.people` after 30 years. Nothing is ever removed. Wars already being fought when the world opens are entered with their real start (the Tessarian Civil War, 1061).
2. **It observes; it does not act.** Every hook calls the original first. It draws no random numbers, and it changes no realm, person or province. The exception is the **epidemic**, because the release simulates no sickness in the world. Each month each realm rolls for one: 3.5% a year, plus 5 points after a failed harvest, 2 points under siege and 1 point for a large realm, capped at 10%. A sickness takes 4 stability, adds unrest where it strikes, spreads to up to three neighbouring provinces, and makes the news. If it reaches the player's town it brings a scene, "Chalk on the doors". `A.WC.EPIDEMIC = false` turns it off for a later world-events feature that brings its own.
3. **Events cite it** (`b-cite.core.js`) in three ways:
   - **Recalled lines.** About one scene in three whose subject touches the record gets one line, under its text. Bread, prices and markets recall a famine. Soldiers and camps recall a battle or a siege. A court recalls a dead ruler. A temple recalls the plague. Taverns recall Legends and sacks. Examples:
     - *"Bread has not been cheap in the Horde since the harvest failed there in 1114."*
     - *"They still talk about the siege of Stagley in 1105: 23 days, and the dogs eaten by the end."*
     - *"An old servant compares everything to the days of Queen Ithrien, dead since 1107."*

     The line is chosen when the scene is first drawn up (`A.eventView` builds it once). The scene, the choice and the saved game therefore all see the same line. The same entry is not recalled again within two years. The kinds recalled lately count for less, and each kind's lines come round in turn.
   - **Tokens any event can use.** `{since_event}` ("since the sack of Northmoor in 1105"), `{last_war}`, `{last_peace}`, `{last_battle}`, `{last_siege}`, `{last_fall}`, `{last_famine}`, `{last_plague}`, `{last_ruler}`, `{last_revolt}`, `{last_wedding}`, `{last_legend}`, `{last_founding}`, `{last_realm_fall}`, each with a `_year` twin. A token is a lazy getter on the event's tokens, so nothing is looked up unless the text uses it. The chosen entry is kept on the event's context, so its text and its result name the same one. With nothing to cite, the token stays unfilled and the engine drops the scene.
   - **13 scenes** (`chronicle.events.js`), written around entries: an old soldier at the well, the price of a loaf since the famine, bells for a dead ruler, children playing at a siege, refugees of a sacked town, a song about a battle, a sergeant's war, a Legend's grave, a coin of a fallen realm, a lord's table, a monk writing the annals, the burnt end of a town, and the sickness at the door. Each one's `cond` and `setup` share `C.chron(p, kinds, mode)`, so a scene that is eligible always finds its entry.

   An entry is citable only where and when the character could know it: in their realm, the realm that holds their home, the realm they serve, or a neighbour of these; dated after their birth; and at least 60 days old. Before the run has anything to cite, the realm's **canon** stands in (174 entries):
   - rulers who died in office (`LORE.rulerHistory`);
   - wars since 950 (`LORE.wars`);
   - chronicle entries since 1000 whose title names a thing, such as "the burning at Fenny Ford" (not "The Gashmar ferry burned").

   Canon entries are tied to realms by the names they contain. A recalled line takes canon only within 40 years of the character's birth.
4. **On the page** (`c-view.core.js`):
   - **The Annals.** A new view in the World tab lists every entry in prose, newest first, 40 to a page. It can filter by kind (wars, battles and sieges, lands, thrones, hunger and sickness, marriages and alliances) and by place ("near you").
   - **"The world in your time"** closes the Chronicle, on the Book page and in its text export. It wraps 22-chronicle's `A.chronicleText` and `UI.TAB.book`, so 22 is unchanged. The run's great entries are written in prose by decade:
     - every war, with how it ended and what passed;
     - every realm fallen or founded, every rising, and every Legend's death;
     - the rulers, famines, plagues, marriages and treaties of the realms the lives lived among;
     - the two largest battles of each decade, and any the lives were part of;
     - the sacked towns;
     - each decade's sums ("the harvest failed eleven times across Ardan").

**Measured by** (`test.mjs`, on the full build of 52 features).

| Test | Result |
| --- | --- |
| `wcRecordWhole` (W5) | 60 years (1105 to 1165): **1,580 entries of 16 kinds**. By kind: battle 763, siege 222, fall 102, famine 97, cede 80, wedding 65, ruler 63, plague 62, alliance 35, war 28, peace 28, trib 26, order 4, revolt 3, fallen 1, founded 1. The two kinds that did not occur in this run (a Legend's death, a throne taken without a death) are rare by nature. The first entry (1061) and the first 200 as they stood in 1115 are unchanged at the end, and the count never shrank. 0 entries without a place, 0 without a named person, 0 undated, 0 lines that do not read. The record is **113 KB of JSON** in a 2,776 KB state. Beside it, the news reaches back only to 1162 and the release's history has 30 lines |
| `wcObservesOnly` | 12 years from the same seed with the record (495 entries) and without it (the epidemic and the pack held back in both): the same realms, people, provinces and random stream |
| `wcCitesShare` (W6) | 8 lives from 16 (human, elf, dwarf, orc; peasant, merchant, noble, serf, artisan), up to 60 years each: **663 of 3,124 scenes (21.2%) cite a dated entry**. Lives range from 16.1% to 25.5%, median 20.0%. By source: a recalled line 602, a scene of the pack 61, canon 6. Every citation was checked against the character's realms, home and birth year at the moment it was shown; see Limits for the first run's 9 misses |
| `wcTokens` | With nothing to cite (an empty world, no canon), a scene using `{since_event}` is dropped. After 25 years it reads "Nothing has been the same since the famine of 1129 in Greyhaven. The old men talk of the end of the Varenna–Horde War in 1129". Both entries are near the character, and the text and the result name the same war |
| `wcAnnalsPage` | The World tab has an Annals button; 1,059 entries at 40 a page; page 2 differs from page 1; the hunger-and-sickness filter shows only those kinds; "near you" works; a hostile name is escaped; drawing changes neither the state nor the random stream |
| `wcExportLegends` (Replayability 5) | A life of 50 years exports the book (1,251 words) plus **"The world in your time": 2,764 words over 5 decades**. No raw tokens, no broken words. The section is on the Book page, and drawing it is pure |
| `wcExportDownload` | The real button downloads a file that contains the section |
| `wcOldSave` | A save with the record removed loads and plays on, with 85 entries in the next 4 years. A save with the record round-trips exactly |
| `wcEpidemic` | 40 years: 49 epidemics (0.72 per realm per 20 years) and 68 famines (1.0) across 34 realms. Struck at home, the scene comes |
| `wcScenesRender` | Every scene of the pack, from lives 30 years into a run: no raw token, none over 80 words, labels of 12 words or fewer, and every choice resolves |

**Before and after.** Measured with the same bot loop: 3 lives of up to 40 years on the build without this feature, and 8 lives on the build with it.

| | Release plus every other feature | With the world record |
| --- | --- | --- |
| Scenes that cite an entry of the world's record | **0** of 792 (there is no record; no scene quotes `S.history`) | **21.2%** |
| Scenes whose text holds any past year | 13.8% (10.1 to 16.5%). Almost all are 21-npc-initiative's "You both remember 1105" between two people, plus a few canon secrets. None is a world event | (adds the recalled lines) |
| How far back the world is kept at year 60 | news: 3 years; history: 30 lines of 2 kinds | 1,580 entries of 16 kinds, all of them |

**Rules kept.**
- The record observes. `wcObservesOnly` shows it does not change the world. The epidemic is the one new piece of simulation, and it draws from `A.rand` like any engine code.
- Citations pick by hashing ids and dates, never `A.rand`. They are made when a scene's view is first built; the modal only draws them. The Annals, the Book section and the export only read.
- All text goes through `UI.esc`, and the stored names carry no `<`, `>` or `"`. There are no inline handlers: the Annals use `data-a` actions.
- `S.wrec` is new. A save without it starts a record where it is. 22-chronicle's files are untouched (its functions are wrapped), and no other feature's files were edited.
- New fields on game objects: `P.burnt` (the year a town burned) and `P.plague` on provinces, and `w.wcCede` on a war while it lasts.

**Limits.**
- **Size.** Battles are about half the record: 763 of 1,580 entries in 60 years. The record grows by about 2 KB of JSON a year and is never trimmed. A 300-year dynasty would carry about 560 KB of JSON (gzipped, perhaps a fifth of that). If that is too much, raise `WC.BATTLE_MEN`.
- **One record, one truth.** The Annals show what happened. The far news is still hearsay (26-belief-truth), but the record does not keep conflicting accounts (W10). The monk's scene gestures at it, nothing more.
- **Lines are templates.** 1 to 4 lines a kind (35 in all) and 13 scenes, so a long life hears the same frame with different places and years. More lines per kind, and per culture, is writing work.
- **Subjects are guessed from words.** A recalled line is matched to a scene by regex on its id, title and text. A scene about a lady's wedding can get the old ruler's death, which fits but is not chosen with care.
- **Kinds that seldom happen.** Realm foundings, falls and Legend deaths are rare in this simulation (1, 1 and 0 in the 60-year test world). The record keeps them when they happen. It does not make them happen.
- **The epidemic is light.** It takes stability and adds unrest. It kills nobody in the world simulation and does not reduce population, so as not to move the economy.
- **The first W6 run** flagged 9 citations as out of time. All were the sickness scene, citing an epidemic dated the same day as the scene (it is happening now). The check now accepts the same day. That scene now names the player's town rather than the province where the sickness began.
