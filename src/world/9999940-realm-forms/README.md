# 9999940-realm-forms: thirty-four realms of five forms (order 99, D-206)

**Aspect:** the owner's order 99: besides kingdoms and empires the only forms are a **principality**, a **merchant
republic** and a **free city**; no emirates or sultanates (nor khanates, confederacies, leagues, a holy see, an abbey,
halls or a free port). Names and titles in plain words a newcomer reads cold (order 97; the owner's naming rule). **Kind:**
words and a save migration; one rule file, one core file, a test. The rewrite of the source was made once by
`tools/o99/realm-forms.mjs` with these rules.

| Piece | Where |
| --- | --- |
| The rules (old words to new, some only where a string speaks of one realm) | `a-rules.core.js`, `A.REALM_FORMS.fix` |
| `A.realmForm(r)`, the old save's carry-over on load | `b-forms.core.js` |
| The realms' own fields (`name`, `title`, `type`, `form`, `gov`) and their rulers' styles | `src/core/release/core/00-lore.json` |
| A realm's form in state (`r.form`), new realms | `A.newState`, `A.createRealm` (03), `A.foundRealm` (10), the faction breakaway (13), 70's breakaways |
| The ways of rule kept (kinds renamed, same numbers) | `data/military/standing.json`, `src/nobility/9996-polity/a-polity.core.js`, `A.polSeed` (12) |

## The realms

| Realm | Was | Now | Ruler |
| --- | --- | --- | --- |
| POL-02 Solenne | Holy See | Principality | Prince-Bishop, elected for life by the Luminaries (succession: chosen by the clergy) |
| POL-04 Lucerna | Republic, a Doge | Merchant Republic | First Merchant, elected for life by the Great Council |
| POL-09 Frostholm | Halls (giants), a Chieftain | Kingdom (a giants' kingdom, as Hrimfell is) | King, chosen at the Thing (elective) |
| POL-12 Ulun | Khanate | Kingdom | King, raised by the nine chiefs (the kurultai can still force him out) |
| POL-13 Brannoch | League | Merchant Republic | First Speaker, elected for life by the Council of Valleys |
| POL-17 Qadir | Sultanate | Kingdom | King, weighed against the Book of Wells; its great lords are princes |
| POL-19 Sahrim | Confederacy, a Speaker | Kingdom | King, acclaimed for life by the clan chiefs (elective) |
| POL-21 Kesh | Kesh (a league of four towns) | Merchant Republic | the Prince of Kesh, elected by the council of merchant houses (the office keeps its name; "the princedom" is "the prince's chair") |
| POL-24 Sabra | Emirate | Principality | Prince, father to son |
| POL-27 Skyhold | Abbey | Principality | Prince-Abbot of the White Stair (chosen by the clergy) |
| POL-32 Ambrel | Sultanate | Kingdom | King |
| POL-33 Corvasse | Free Port (pirates) | Free City | Captain-General, elected by the Captains' Table |

The other twenty were a kingdom, an empire or a free city already. POL-11 (Horde of Gorath) and POL-34 (Ughrak Clans) are the
orcs' (order 98, another builder's) and are not touched here.

New realms: a breakaway (70-fresh-realms-and-tensions) is a Principality under a Prince, or a Free City under a First Burgher
where towns bought their freedom; lords who break away (a faction) found a Principality; a realm founded small is a
Principality (it was a Lordship), and its Prince may proclaim himself King.

## Saves

`A.REALM_FORMS.carry(S)` runs on every load (it wraps `A.deserialize`, as 999981's renaming does) and changes nothing the
second time: realms' names, titles, kinds and primers; old breakaways and leagues; houses' and people's lore strings. People's
names are never touched (a man may be called Emir: the name pools are not forms), and the prose a life has kept (its log,
news and the world record) keeps its words.

## Test

`test.mjs`: `rfForms` (32 realms of five forms, named by their form, plain titles, customs kept), `rfNoOldWords` (the lore,
the lazy lore, every event and a new game's realms, houses and people hold no old form's words), `rfOldSave` (an old save
carried over on load).
