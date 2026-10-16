# Writing a mod for Ardan

A mod is one `.json` file. It adds events to the game, and it can add customs to a realm. It is data only. A mod cannot run code, and nothing in it is shown as markup.

To use one, open **Mods** on the title screen or in the Menu, then press **Load a mod file**. Tick a mod to turn it on. A ticked mod comes into every life you start after that. A life keeps the mods it began with, and its save records them. If you open a save whose mods you have since removed, the game tells you so, and their events stay out of that life until you load them again.

The quickest start is **Save the example as a file** in the same panel. That gives you `example-mod.json`. Change its `id`, then rewrite it.

## The file

```json
{
  "format": "ardan-mod",
  "formatVersion": 1,
  "id": "stones",
  "name": "Stones and Debts",
  "version": "1.0.0",
  "author": "You",
  "about": "One or two sentences for the Mods panel.",
  "words": { "default": { "bounds": "beating of the bounds" }, "CUL-02": { "bounds": "ring-walk" } },
  "events": [ ... ],
  "customs": { "POL-01": [ ... ] }
}
```

| Field | Rule |
| --- | --- |
| `format`, `formatVersion` | Always `"ardan-mod"` and `1`. |
| `id` | 2 to 16 lowercase letters or digits, starting with a letter. Everything your mod names starts with `mod_<id>_`. |
| `name` | Up to 40 characters. |
| `version` | Like `1.0` or `1.2.3`. A save remembers the version it began with. |
| `author`, `about` | Optional. `about` is at most 60 words. |
| `words` | Optional. Your own tokens, with each people's own word for a thing (see Words). |
| `events` | 1 to 200 events. |
| `customs` | Optional. Customs for a realm (see Customs). |

The game checks everything when you load the file. Any error means nothing from the file is added, and the panel lists each problem with where it is, for example `events[2] (mod_stones_loan).choices[0].fx.coin: 5000 is out of range (-1000 to 1000)`. An unknown field is an error too, so a misspelt key never fails quietly.

## An event

```json
{
  "id": "mod_stones_loan",
  "title": "A friend's purse",
  "cond": { "all": [ { "adult": true }, { "prison": false } ] },
  "with": ["friend", "bestfriend"],
  "cool": 12,
  "text": "{them} comes by at dusk and stays past supper. ...",
  "choices": [
    { "t": "Lend the eleven", "r": "{them} counts it twice ...", "fx": { "coin": -11, "them": { "op": 15 }, "flag": "mod_stones_lent" } },
    { "t": "Ask what the debt is for", "r": "You ask.", "fx": { "event": "mod_stones_loan_why" } },
    { "t": "Talk them round", "check": { "s": "persuasion", "s2": "int", "d": 45 },
      "win": { "r": "...", "fx": { "honor": 1 } }, "lose": { "r": "...", "fx": { "happy": -2 } } }
  ]
}
```

| Field | Rule |
| --- | --- |
| `id` | `mod_<your id>_` and then lowercase letters, digits and `_`. |
| `title` | Up to 10 words. |
| `text` | Up to 80 words. A token counts at its usual length: `{realm}` as four words, `{name}` as one. |
| `cond` | When the event can come up (see Conditions). Required, unless the event is `"trigger": true`. |
| `with` | Optional. A relation, or a list: the event is about that person. They must be alive. You may then use `{them}` and the other person tokens, and the `them` effect. |
| `w` | Weight, 0.05 to 5. Default 1. |
| `cool` | Years before it can come again, 1 to 100. Default 6. |
| `once` | `true`: it comes at most once in a life. |
| `trigger` | `true`: it never comes up by chance. Only another event of yours leads to it, with the `event` effect. |
| `choices` | 2 to 4. |

**A choice** has `t`, the label of up to 12 words. Then it has either `r`, the result text of up to 80 words, and an optional `fx`, or a `check` with a `win` and a `lose`, each `{ "r": ..., "fx": ... }`.

- `check` is `{ "s": skill or stat, "s2": optional second one, "d": 5 to 90 }`. 45 is a typical difficulty, and each point is worth about 1.6% of the odds.
- `if` (optional) holds a condition. The choice shows only when it holds. At least two choices must have no `if`.

The game draws your event the way it draws its own. A condition written with `noble`, `ruler`, `poor`, `job`, `soldier` or `child` tells the game who the event is for, as it does for the built-in events. So does text that mentions a tavern, a back alley or "your master". A ruler seldom meets an event about the tavern unless its condition names rulers.

## Conditions

A condition is an object with one key.

| Kind | Keys | Example |
| --- | --- | --- |
| Combine | `all`, `any` (a list), `not` | `{ "all": [ {"adult": true}, {"not": {"married": true}} ] }` |
| Yes or no | `adult` `child` `teen` `young` `old` `noble` `rich` `poor` `unfree` `soldier` `atWar` `ruler` `married` `hasKids` `male` `female` `prison` `literate` `coast` `town` `family` `famHead` `parentsAlive` `sworn` `owes` `letter` `superior` `office` `faction` `ambition` | `{ "soldier": true }`, `{ "prison": false }` |
| A number | `age` `ageAdj` `fame` `rep` `favors` `allies` | `{ "age": [">=", 30] }` |
| One of a list | `realm` (POL-01 ..), `race`, `cult` (CUL-01 ..), `faith` (REL-01 ..), `terr` | `{ "realm": ["POL-01", "POL-14"] }` |
| A stat or skill | `stat`, `skill` | `{ "stat": ["str", ">=", 40] }`, `{ "skill": ["trade", ">", 30] }` |
| Memory | `flag` (any flag, yours or the game's), `since` (years since a flag was set) | `{ "since": ["mod_stones_lent", ">=", 2] }` |
| Others | `trait`, `hasRel` (a relation or a list), `job` (`true`, `false` or a career), `jobRank` (at least this rung), `apt` (a natural talent) | `{ "job": "smith" }` |

The comparisons are `>=`, `<=`, `>`, `<`, `==` and `!=`. `ageAdj` is age on a human scale, so 16 means grown for any race.

## Effects (`fx`)

| Key | Value |
| --- | --- |
| `str` `spd` `ins` `sta` `int` `wil` | Training, -2 to 3 |
| `health` | -30 to 30 |
| `happy` | -20 to 20 |
| `looks` | -5 to 5 |
| `fame` | -10 to 10 |
| `honor`, `piety` | -20 to 20 |
| `coin` | -1000 to 1000 |
| `skill` | `{ "persuasion": 2 }`: train up to 3 skills, 0.5 to 5 each |
| `flag`, `unflag` | A flag name. A flag you set must start with `mod_<id>_`. |
| `trait`, `untrait` | A trait, like `brave` or `greedy` |
| `rel` | `{ "who": "friend", "op": 10 }`: the opinion of your first friend, -30 to 30 |
| `them` | `{ "op": 15 }`: the opinion of the event's person (needs `with`), -40 to 40 |
| `event` | The id of another event in your mod, which follows straight away. Chains may not loop. |

A flag holds the year it was set. That is how an event remembers an earlier one: set `mod_stones_lent`, then ask `{ "since": ["mod_stones_lent", ">=", 2] }` two years on.

## Tokens

You can use `{name}` `{full}` `{sur}` `{home}` `{realm}` `{realmShort}` `{capital}` `{ruler}` `{rulerTitle}` `{coinName}` `{people}` `{race}` `{he}` `{his}` `{year}` `{age}` `{manwoman}` `{enemy}` `{rival}` `{friend}` `{father}` `{mother}` `{spouse}` `{faith}` `{family}` `{familySeat}` `{familyHead}` `{liege}` `{weapon}` `{rank}` `{boss}` `{bossFull}` `{bossTitle}` in any title, text, label or result.

With `with`, you can also use `{them}` `{themFull}` `{themAge}` `{themRace}` `{themOcc}` and the pronouns `{khe}` `{khim}` `{khis}` (or `{theyHe}` `{themHim}` `{theirHis}`).

In a game that has the realm bible, `{cw1}` `{cw2}` `{cw3}` are the three words of the player's realm's culture.

A word at the start of a sentence is capitalised for you, so write `{khe} says` and it shows as "She says". An unknown token is an error. A `{` or `}` that is not part of a token is an error too.

## Words

`words` gives each people its own word for something your events mention. Every token needs a `default`. Name a culture (CUL-01 .. CUL-24) only where its word differs. The word follows the player's own people.

```json
"words": { "default": { "bounds": "beating of the bounds" }, "CUL-02": { "bounds": "ring-walk" }, "CUL-06": { "bounds": "dyke-walk" } }
```

Then `since the last {bounds}` reads "since the last ring-walk" for a Northfolk player.

## Customs

In a game with the realm bible, a mod can add up to three customs to a realm. A custom is a rule that a life in that realm runs into. The first time, it is a scene: the player keeps the custom or defies it. After that it is applied and noted in the log. A mod can add three kinds:

| Kind | When | Its own fields |
| --- | --- | --- |
| `year` | a set month each year | `m`, the month (0 for January, 4 for May); optional `who` |
| `rite` | on reaching an age | `age` (12 to 60); optional `who` |
| `ward` | a standing rule, met every few years while it fits | `when`; optional `every` (1 to 10 years) |

`who` is one of `all` `adult` `free` `commoner` `unfree` `noble` `rich` `poor` `male` `female` `married` `parent`. `when` is one of `armed` `mounted` `rich` `poor` `unwed` `childless` `old` `sick` `foreignFaith` `soldier` `landed` `any`.

Every custom has `id` (`mod_<id>_...`), `name` (up to 6 words), `kind`, `rule` (one line for the Realm tab), `text` (the scene), `fx` (what keeping it does), `keepT` and `keep` (the label and result of keeping it), `defy` (`{ "t", "r", "fx" }`) and `log` (the line for later years). Its words may also use `{w1}` `{w2}` `{w3}`, the realm's culture words. Its effects are those of an event, except `them` and `event`.

## Limits

- A mod cannot add a realm, a person, an item or a new kind of effect. It cannot change an event that comes with the game.
- Angle brackets are removed from a mod's words when it is loaded. Everything a mod says is shown as plain text.
- A file is at most 512 KB.
- Before you share a mod, give every choice a reason to pick it. If one choice is better on every count and no riskier, it is not a choice.

## Places and peoples

Realms: POL-01 Aldmark, POL-02 Solenne, POL-03 Varenna, POL-04 Lucerna, POL-05 Ashmere, POL-06 Sylvaran, POL-07 Eldergrove, POL-08 Northreach, POL-09 Frostholm, POL-10 Irondeep, POL-11 the Horde, POL-12 Nine Winds, POL-13 Highland, POL-14 Greyhaven, POL-15 Morhaven, POL-16 Ostra, POL-17 Qadir, POL-18 Tamar, POL-19 Sand Clans, POL-20 Zanara, POL-21 Kesh, POL-22 Abara, POL-23 Hrimfell, POL-24 Sabra, POL-25 Velgrad, POL-26 Drevna, POL-27 Skyhold, POL-28 Stonehold, POL-29 Emberdeep, POL-30 Ranpur, POL-31 Tessaria, POL-32 Amber Isles, POL-33 Blackreef, POL-34 Tusk Clans.

Cultures: CUL-01 Solenfolk, CUL-02 Northfolk, CUL-03 Wind Riders, CUL-04 Qadiri, CUL-05 Sandfolk, CUL-06 Tamari, CUL-07 Sabrans, CUL-08 Zanari, CUL-09 Abari, CUL-10 Keshi, CUL-11 Eastfolk, CUL-12 Skyfolk, CUL-13 Ranpuri, CUL-14 Amberfolk, CUL-15 Corsairs, CUL-16 Leaf People, CUL-17 Cloudfolk, CUL-18 Marchfolk, CUL-19 Sylvari, CUL-20 Grovers of the Coast, CUL-21 Holdfolk, CUL-22 Horde clans, CUL-23 Tusk clans, CUL-24 Hall-giants.

Faiths: REL-01 Temple of the Returning Sun, REL-02 Dawn Church, REL-03 The Seven Halls, REL-04 The Green Covenant, REL-05 The Deep Law, REL-06 The Way of the Open Sky, REL-07 The Path of the Well, REL-08 The Flood Mother, REL-09 The Thousand Ancestors, REL-10 The Thousand Names, REL-11 The Storm and the Mare, REL-12 The Mother Under the Ice, REL-13 The Drowned Queen, REL-14 The Eternal Blue, REL-15 The Ashen, REL-16 The Forest Spirits, REL-17 The Marchland Saints, REL-18 The Hearth Folk, REL-19 Luck-gods of the Corsairs.

Races: `human` `elf` `dwarf` `orc` `giant` `halfelf` `halforc`. Terrain: `plains` `forest` `steppe` `hills` `marsh` `desert` `mountains` `tundra`.

Relations: `friend` `bestfriend` `rival` `enemy` `lover` `spouse` `betrothed` `sibling` `father` `mother` `child` `cousin` `grandparent` `grandchild` `inlaw` `mentor` `student` `patron` `lord` `superior` `subordinate` `councillor` `ex` `acquaint`.

Skills: melee sword axe spear dagger dualwield shield unarmed lance mounted bow xbow throwing riding athletics stealth survival tracking sea persuasion diplomacy etiquette deception intimidation intrigue music command tactics logistics siegecraft stewardship learning medicine faith trade craft husbandry gambling.

Traits: brave craven ambitious content cruel kind honest deceitful zealous cynical greedy generous wrathful calm gregarious shy patient impetuous loyal fickle curious stubborn humble proud diligent lazy trusting paranoid vengeful forgiving temperate gluttonous just arbitrary reckless cautious romantic stoic witty honorable.

Careers: farm herd fish labor servant smith mason weaver bowyer carpenter brewer merchant scribe healer clergy sailor pirate thief hunter minstrel miner courtier mercenary lawyer spy bounty knight explorer artist cook teacher horsemaster envoy engineer pitfighter steward.
