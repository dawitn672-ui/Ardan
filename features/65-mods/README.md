# Player mods

**Aspect:** Replay (Road to Ten, Replayability 6) · **Kind:** system (a mod format, its checker and compiler, a library, a Mods panel), 5 events and 1 custom in a built-in example mod, 2 patches

The plan says: "Load events and realms from data files so players can add their own." Its status said: "Developers can add features and events here; players can't."

The game is one HTML page with a strict security policy: no `eval`, no `new Function`, no inline handlers and no network. A built-in event's condition, setup and effects are JavaScript. So a player's mod cannot be code. It is **data**, and the game reads it safely.

**What it does.**

- **A mod is one JSON file** (`"format": "ardan-mod"`, `"formatVersion": 1`). It has an id, a name and a version, then events, and optionally customs and words. [`MODDING.md`](MODDING.md) is the player's guide to the format.
  - **Conditions** are a small declarative language. Each key is one of the engine's `C.*` helpers: `{"all": [{"adult": true}, {"realm": ["POL-01"]}, {"stat": ["str", ">=", 40]}, {"since": ["mod_x_lent", ">=", 2]}]}`. There are 50 keys, plus `all`, `any` and `not`.
  - **Effects** are a whitelist of the engine's own fx keys, each with bounds: the six stats, health, happiness, looks, fame, honour, piety, coin, skill training, flag and unflag, trait and untrait, opinion (`rel`, and `them` for the event's person), and `event` to chain to another event of the same mod.
  - **Text** uses a whitelist of 33 tokens. With `"with": "friend"` (an event about a person) it also gets `{them}` and the pronouns, and with the realm bible built, `{cw1}` to `{cw3}`. A mod's own `words` give each culture its own word for a thing, such as Northfolk "ring-walk" and Tamari "dyke-walk" for the beating of the bounds.
  - Everything a mod writes into the world starts with `mod_<id>_`: its event ids, the flags it sets, its customs. It can read any flag, its own or the game's.
- **The checker is strict.** Unknown fields, bad tokens and values out of range are all errors. So are text over 80 words, labels over 12, a number of choices other than 2 to 4, a check without both win and lose, a chain to a missing event, and a chain that loops. Each error names its place, for example `events[1] (mod_bad_two).choices[0].fx.coin: 5000 is out of range (-1000 to 1000)`. The rules are the event linter's own (`tools/lint-events.mjs`). A mod with any error loads nothing. Angle brackets are taken out of every string on load, with a warning, so a mod's words never hold markup. Everything a mod says is drawn through `UI.esc` as well.
- **The compiler** turns checked data into ordinary event objects, which `A.defEvents` registers like any pack. `cond` and `setup` are closures over the data. `fx` are plain fx objects, so the choice linter and the bot's memory index read them. Each compiled `cond` carries a `toString` written in the helpers it calls, such as `(p,C)=>(C.adult(p)&&(C.poor(p)||C.job(p,"farm")))`. So `A.CX_RX`, `A.evAudience` and `A.evFit` place a mod event exactly where they would place the hand-written event, and `tools/lint-events.mjs` sees its memory flags.
- **Realms.** A mod adds local flavour to existing realms in three ways:
  - events whose condition names realms, cultures, faiths or terrain;
  - its own words for each culture;
  - customs, in a build with the realm bible (47-realm-bible).

  A custom uses the bible's own data model and is limited to the three kinds the bible runs from its month hook: `year`, `rite` and `ward`. It has the same first-meeting scene and log line as the bible's customs, and it shows on the Realm tab's card. The kinds tied to other moments (the wed, mourn, name, levy, law, market and grave customs) are left out. **New realms are out of scope.** A realm is more than data here: `A.initWorld` builds the provinces from the map's geometry, and rulers, houses, armies and borders all hang from them. A new realm would need new provinces on a map the game draws from fixed shapes, and the engine has no clean way in for that.
- **The Mods panel** is on the title screen and in the Menu. It has these parts:
  - **Load a mod file**: an `<input type=file>` read with `FileReader`, with no network.
  - **Save the example as a file**: a template to start from.
  - **The list**: each mod with its version, author, number of events and customs, a tick to turn it on, and Remove. A refused file shows every problem, up to 12 listed.
  - **In a game**: which mods the life began with, and any that are missing.
- **The library** is kept in `localStorage` under `ardan.mods.v1`, next to the settings. It holds the checked, cleaned copy of each mod, never the raw file. A stored mod is checked again against the running build before it is used.
- **A game keeps its mods.** `A.newGame` takes the ticked mods, or `o.mods` when the options give them, and records them (id, version, hash) in `A.S.mods` and in the journal's options. So a replay starts with the same mods. A save brings its mods back. If one is missing from the library, a notice names it, and its events stay out of that life. Ticking a mod affects lives started afterwards.
- **Off means never.** A mod's events stay registered in `A.EV`. While a mod is not in the current game, its events carry the `trigger` mark, which both random rolls skip; 58-event-cut uses the same mark for retired events. So they are never drawn, and they cannot move the random stream. The events of the mods in play go to the end of `A.EV` in a fixed order: mod id, then file order. So the same mods and seed make the same rolls, whatever else has been loaded in this browser and in whatever order.
- **The example mod, "Stones and Debts"** (`example-mod.json`), ships built in and off. It shows each part of the format:
  - a boundary stone that moves (only for the poor, farmers and herders);
  - the neighbour's son who asks about it eight years later (memory, through `since`, with a choice offered only if you lost the ground);
  - a friend's debt (`with`, `{them}` and `{khe}`, and a chain to a trigger-only scene);
  - the money coming back two years on;
  - the culture word `{bounds}`;
  - an Aldmark custom, the May ring-walk.

  `mods.events.js` holds the same data (the test checks that they match). There it compiles the example with the event packs, so `lint-events` and `lint-choices` play-test it like any feature's events.

**Measured by** (`test.mjs`; every test passes on `--only=mods`, on `--only=mods,realm-bible,accessibility` and on the full build of 59 features):

| Test | Result |
| --- | --- |
| `modsExample` | `example-mod.json` is the built-in mod; it checks with 0 errors and compiles to 5 events and 1 custom; it is off by default. A copy under another id loads as a player's mod, and its 5 events are registered once a life starts with it. All 15 choices play for a character who fits them, with no raw token and nothing over the word limits |
| `modsBadMod` | A mod with 18 deliberate mistakes is refused whole. All 18 messages come back with their place (20 errors in all), 0 events are registered, and the library is unchanged. Broken JSON, a newer format, a chain loop (`mod_loop_a -> mod_loop_b -> mod_loop_a`), `__proto__` and `{constructor}` are each refused with their own message |
| `modsXss` | Markup in 19 fields (name, author, about, a word, title, text, labels, results, win and lose, and every field of a custom): it loads with "44 angle brackets were removed". No element is injected in the panel, the event, either result, the custom's scene, the Realm card or any tab. Quotes and `&lt;` show as written. Markup put straight into a compiled event, as if the checker were bypassed, is drawn as text |
| `modsFireInLives` | 6 bot lives each way (`bench/bot.mjs`, from 16 for up to 35 years, same seeds), in three builds. With the mods on, a probe mod's event (any adult, weight 5) came up in 5 of 6 lives in every build. The lives it missed were a child for the whole run or died young. The example's events came up in 3 of 6 lives (`--only=mods` and the full build). Its Aldmark custom came up in 2 of 6 wherever the realm bible is built. With the mods off, mod events, customs or mod flags showed up in 0 lives |
| `modsClassify` | 13 conditions, each beside the hand-written `(p, C) => ...` it stands for, give the same audience under `A.CX_RX` and `A.EV_RX`, the same `A.evFit` for 4 characters (a peasant, a noble, a royal and a child), and the same answer. Every class is met: ruler, high, low, job, mil and child |
| `modsSaveLoad` | The same seed with the same mods gives the same world twice, with another mod loaded (and off) in between. The journal records the mods, and its replay reaches the same world with the mod since turned off in the library. A save records `example 1.0.0 <hash>` and brings it back. A removed mod is reported by name ("This life was begun with a mod not loaded here: Probe 1.0 ..."), and its events stay off. A quoted log line survives the save. An old save without the record loads with no mods |
| `modsRenderPure` | With the example in play, drawing every tab, the Menu and the Mods panel moves neither the random stream, the state, nor the library |
| `modsPanelAxe` | The panel as a player uses it. Open it from the title screen. Load a file through the file chooser (it is listed and ticked). Load a bad file (it lists 13 lines of problems). Tick a mod by its label, remove one, then open the panel from a game's Menu ("This life began with Stones and Debts") and go back. axe-core, WCAG 2.2 AA and best practice, at the title, with errors shown, and in a game: **0 violations** |

**Pooled** (`bench/bot.mjs`, 24 lives of the full game, from 18 for up to 40 years, 574 life-years; peasants and artisans of Aldmark, Ashmere, Varenna, Greyhaven and the Horde): with the example on, its events came up in **13 of 24 lives**: the friend's purse in 13, the money coming back in 6, the boundary stone in 4, the neighbour's son in 2. The ring-walk was met in all 8 Aldmark lives. The same 24 lives with the stone and the purse at weight 1 met the example in 3, all through the purse. A mod event of weight 1 is one among some 4,000, so the example raises those two to 3, and MODDING.md tells modders about weight.

`tools/lint-events.mjs --feature=mods`: 5 events, 17 renders checked in the browser, 0 errors. One warning: the friend's purse needs a living friend, which none of the linter's eight new characters has; `modsExample` plays it with one. `tools/lint-choices.mjs --feature=mods`: 0 obviously best choices.

**Rules kept.**

- No `eval`, no `new Function`, no inline handlers. A mod is parsed with `JSON.parse` and only read as data. The file input is created in code, and its handler is a property, as the release's own save import does it.
- Every value a mod gives is escaped when drawn. Its strings also lose any `<` or `>` on load, and its tokens come only from the known lists. `SAVES.clean` therefore leaves mod text in the log unchanged, and quotes survive because the log is prose.
- Determinism: conditions and setup draw nothing from the random stream. The tokens that do (`{town}`, `{season}`, `{festival}`, `{npcM}`, `{npcF}`, `{god}`) are not offered. The person an event is about is the closest living one of the named relations, chosen by opinion and then id. Off mods' events are never drawn, and the order of the mods in play is fixed.
- Rendering is pure. The panel reads the library and `A.S`, and changes only the UI.
- State: `A.S.mods` is a new field. A save without it loads with no mods, and a non-list value is reset. Nothing else of a mod enters the save.

**Limits.**

- **The language is small on purpose.** A mod cannot compute: it cannot compare two people, pick at random in its setup, schedule an event for years later (it uses `since` on a flag instead), or add a new effect, item, person or realm. It cannot change or remove an event that ships with the game.
- **A mod comes in at the start of a life.** Ticking one in the middle of a life affects the next life, not this one. The panel says so.
- **A problem report** (Menu, Report a problem) carries the save, and so the list of mods, but not the mod files. Whoever replays it needs the same files.
- **Two mods cannot share an id.** Loading a mod whose id is already in the library replaces it, as an update. The new version's hash is recorded for new lives, and a save that began with the old version says that the version differs.
- **Writing quality is the modder's.** The checker enforces length and shape, not voice. `lint-choices` is a developer tool and does not run on players' mods, so MODDING.md asks modders to give every choice a reason.
- **The example's custom needs the realm bible.** In a build without 47-realm-bible, the panel notes that the customs stay unused, and the five events run as usual.
