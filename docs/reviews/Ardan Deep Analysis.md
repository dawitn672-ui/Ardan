# Ardan: Deep Analysis

Oct 13, 2026 · build `b593143@2026-10-12` (the one inside `ardan (1).html`)

## What this covers and how it was done

The repo holds three files: a two-line README, the "Road to Ten" plan, and `ardan (1).html`, the shipped game. There is no source, no build script, no test suite and no bots in the repo. Everything below comes from the built file.

The HTML carries three packed blobs (a base-122 style text encoding over zstd). Unpacked they are:

| Blob | Packed | Unpacked | What it is |
| --- | --- | --- | --- |
| `ardan-core` | 669 KB | 2.1 MB | The lore tables (`LORE`), game data (`GD`, 119 tables), engine (`A`, ~920 functions), `MAP`, `SAVES`, `UI` (~340 functions), portraits |
| `ardan-content` | 968 KB | 4.0 MB | 30 event packs, 3,199 events, joined by `\x01ARDAN-PACK\x01` |
| `ardan-lore` | 792 KB | 3.5 MB | Lazy tables: 573 named cast members, 620 families, 180 deep house histories, 265 fighting styles, 34 academies |

Prettified, the code is about 206,000 lines. It was read by hand and by four parallel reviews (engine, world systems, UI and saves, content), and every headline finding below was re-checked. The game was also run headless in Chromium: booted, played by a bot for 16 full lives, saved, loaded, and attacked with a crafted save file.

Line numbers like `core:13529` refer to the prettified core (`prettier --parser babel` on the unpacked `ardan-core`). They are there so a finding can be found again; they do not exist in the repo.

## Status (updated Oct 13, 2026)

Most of these are now fixed in `index.html` by the patches in `tools/patches.mjs` and covered by `tests/run.mjs`. "Ardan Road to 100.md" has the full review that followed.

| Bug | Status | Patch |
| --- | --- | --- |
| Security: crafted save runs script | Fixed | `SEC-CSP`, `SEC-SAVE-CLEAN`, `SEC-LOG-CLASS` |
| 1 Rendering changes the world | Fixed. Two more causes were found: the People tab hired colleagues, and a no-op dice roll in the shop | `ENG-STYLE-RNG`, `ENG-ROSTER-PURE`, `ENG-GEAR-ROLL` |
| 2 Opposite traits inherited | Fixed | `ENG-TRAIT-OPP` |
| 3 NPC burns techniques | Fixed | `ENG-DUEL-TECH` |
| 4 Underdog catch-up | Left: a tuning call for playtests | |
| 5 Training plan never moves on | Fixed | `ENG-PLAN-FOLLOWS-LIFE` |
| 6 Duel ties go to the player | Fixed | `ENG-DUEL-DOUBLE-KO` |
| 7 Mentor promises legacy | Fixed | `TXT-MENTOR-LEGACY` |
| 8 Yearly event roll is dead | Left: delete in the source | |
| 9 Digit tokens print raw | Fixed | `EVT-TOKEN-DIGITS` |
| 10, 11 Two events never or rarely fire | Fixed | `EVT-DELEG-COUSIN`, `EVT-SERV-SECRET` |
| 12 Text diet misses | Fixed | `EVT-TEXT-DIET` |
| 13 Free money | Idle merc pay fixed. Wages from nowhere left: part of the economy rebuild | `WLD-MERC-NO-CONTRACT` |
| 14 Reparations stack | Fixed | `WLD-REPARATIONS-EXCLUSIVE` |
| 15 AI debt never repaid | Fixed | `WLD-AI-DEBT` |
| 16 Stability below 0 | Fixed | `WLD-STABILITY-FLOOR` |
| 17 Diplomacy "why" list | Left: needs a design decision | |
| 18 Faction war skips checks | Fixed | `WLD-FACTION-WAR-CHECKS` |
| 19 Siege resets | Fixed | `WLD-SIEGE-OWNER` |
| 20 Commoner promotion penalty | Left: balance. Not a bug for nobles; commoners get about ×0.2 | |
| 21 Dead war code | Left: delete in the source | |
| 22 Silent autosave failures | Fixed | `SAVE-WARN` |
| 23 Two tabs | Fixed | `SAVE-ONE-TAB` |
| 24 New life pushes the old one out | Fixed: asks first | `SAVE-NEW-LIFE-CONFIRM` |
| 25 Closing the tab loses a year | Fixed: saves on hide; manual save asks for persistent storage | `UI-KEYBOARD`, `SAVE-WARN` |
| 26 Load failures do nothing | Fixed | `SEC-SAVE-CLEAN` (safe load path) |
| 27 Redraw loop | Focus and lost-Enter fixed. The full redraw itself is left for the source | `UI-KEYBOARD` |
| 28 Keyboard reach | Fixed | `UI-KEYBOARD` |
| 29 Some reports can't replay | Fixed | `SAVE-JOURNAL-BASE` |
| 30 Wrong backup message | Fixed | `SAVE-BACKUP-MESSAGE` |
| 31 Smaller ones | Left | |
| New: a newborn can work the court | Fixed | `ENG-NOBLE-AGE` |
| New: buy/sell-back loop prints money | Fixed | `ECO-THIN-MARKET-SPREAD` |

## The short verdict

Ardan is in better shape than most one-person projects of this size. It boots clean, runs 16 random lives with zero errors, replays a seed byte for byte, saves with checksums and backups, and its lore is large and internally consistent. The Phase 1 claims in the plan are mostly true.

Where it falls short is where the plan already says it does: people and rulers don't want things, events rarely remember the past, the economy prints money, and the low ranks of war are spectators. On top of that, this review found one real security hole, one bug that quietly breaks the replay system the plan is proud of, and a handful of smaller bugs with one-line fixes.

## Fix first (ranked)

| # | Problem | Why it matters | Fix size |
| --- | --- | --- | --- |
| 1 | **A crafted save file runs script on load** | Players swap `.ardan` files; you open `.ardanreport` files from players | Small |
| 2 | **Showing a fighter's tier rolls dice** | Breaks replays and problem reports for anyone who looks at the People screen | Small |
| 3 | **Tokens with digits print raw** (`{mate2}`, `{h1}`…) in 39 events | Players see broken text | One regex, two places |
| 4 | **Saves vanish silently** (failed autosave, two tabs, new life rotates the old one out) | Lost runs are the fastest way to lose a player | Medium |
| 5 | **Keyboard focus lost every 1.5 s while time runs**, then Enter skips time | Contradicts "full keyboard play"; costs real players time | Medium |
| 6 | **Mercenaries paid with no contract; pay never charged to any treasury** | Free money, and AI realms never feel the cost of armies | Small |
| 7 | **Reparations and Crushing reparations can both be ticked** | Strictly better peace deal by stacking | Small |

Details for each are in the sections below.

## Running it

| Check | Result |
| --- | --- |
| Boot (desktop Chromium, no throttle) | Title at ~1.05 s, all event packs in at ~1.9 s, lore at ~2.0 s, 0 errors, 0 failed requests |
| Event count | 3,199 loaded (matches the plan's Phase 1 figure; the Power section's 3,191 is stale) |
| 16 bot lives, random choices, 8 race/status mixes | 0 errors. Deaths at 30–79 for humans and orcs from heart failure, strokes, wounds gone bad, a bad tooth, a hanging. Elf and dwarf runs hit the bot's 140-year cap still alive |
| Speed | 9–42 s per full life including the world war sim, about 0.25 s per in-game year |
| Same seed twice, 15 years, engine only | Identical state hash: deterministic |
| Same seed, but with fighter tiers shown on screen | Not deterministic (see bug 2) |
| Phone (390 px) | Bottom tab bar, no horizontal scroll |
| Save size | About 1 MB of JSON at birth, 1.4 MB by year 15 (gzipped on disk) |

## Security

**A save file can run script (confirmed in the browser).** `SAVES.decode` checks the format and a checksum, but a checksum anyone can recompute proves nothing. After loading, several save fields go into HTML without escaping. The clearest one is the story log: `UI.renderLogWrap` writes each line's class name straight into the markup.

```js
h += `<div class="ll ${c}">${ds}${UI.esc(t)}</div>`   // core:50561, c comes from the save
```

A save whose log line has a class of `x"><img src=x onerror=...>` runs that code the moment it loads. This was proven with a harmless payload through the real `SAVES.encode` → `UI.loadGame` path: the payload ran and one injected `<img>` appeared in `#logwrap`.

Other unescaped paths from the save: `e.year` and `e.age` in the log, `meta.year` in the save list, person and realm ids inside `data-v` attributes, realm colors inside `style`, and portrait skin colors inside SVG attributes. There is no Content Security Policy.

Who is exposed: anyone who loads a save someone else made, and you, whenever you open a player's problem report.

Fix: after decoding, validate the save's shape (types of ids, years, colors, log classes). Escape or whitelist every value that lands in an attribute, for example log classes against a fixed list and colors against `^#[0-9a-f]{3,8}$`.

Typed input is safe: name fields strip `<>`, and `UI.esc` is used 415 times.

## Bugs, by system

Confidence is high unless marked.

### Engine and life sim

1. **Rendering changes the world.** `UI.tierChip`, `UI.vsYou` and the worth tooltip call `fightWorth` → `styleFighter` → `A.npcStyles` (core:14832). The first call for any NPC rolls `A.chance`/`A.pick` and writes `p.styles` permanently. Computing worth for 30 NPCs moved the random stream 29 times. A journal recorded with tier chips on screen fails replay ("the random stream differs before this command"). Fix: give `npcStyles` its own seeded generator (for example hash of `p.id`), or generate styles when the NPC is created.
2. **Children can inherit opposite traits.** `randomTraits` (core:5016) copies parent traits with no opposite check: 12.4% of children of a brave and a craven parent got both. Traits are also uncapped; bots reached 8–9.
3. **The NPC can burn a technique without using it** (`duelAct`, core:13742). The use is spent before the code notices the base action doesn't match, after the read already named that technique to the player.
4. **The underdog catch-up closes about half the gap, not 95%** (core:13866, medium). The cap is computed after the bonus is applied. `D.hist.length >= 0` is always true.
5. **The default training plan never moves on** (medium). `defaultPlan` only fills an empty plan, so a child's "athletics" stays forever. All bot lives maxed athletics and learning by 30.
6. **Duel ties go to the player.** `b.hp <= 0` is checked before `a.hp`.
7. **The mentor mastery still promises "+1 legacy"**, a system that was removed.
8. **The yearly event roll is dead.** `rollEvents` returns early when `A._yearTurn` is set, which is always true on the normal path. Events come only from `monthEvents`.

### Events and content

9. **Tokens with digits print raw (39 events).** `A.T` replaces `/\{([a-zA-Z_.]+)\}/` (core:5739), and the broken-event guard `viewSkip` (core:35848) uses the same pattern, so `{mate2}`, `{m2him}`, `{h1}`, `{cap2}`, `{age2}`, `{n1}` and friends are neither filled nor caught. Example: `wr_gamble_debt` shows "You owe {mate2} {debt} suns". The values are already in the context. Fix: `[a-zA-Z0-9_.]` in both places.
10. **`st_deleg_cousin` never shows.** It uses `{they}`, which is not a token, so it is always skipped after using up its roll.
11. **`wk_serv_secret` is skipped 1 time in 4.** One of its secrets has a nested `{enemy}` that pack 02 doesn't re-fill.
12. **Text diet, three misses.** Two choices are 13 words (`ct_succession_law`, `tr_serv_royal`), and `rl_sec_calf` renders to about 83 words once lore text is pulled in. A checker that fills tokens with stub values can't see the second kind.

### World, war, politics, economy

13. **Free money.** In `milYearNow` (core:16074–16096) a mercenary with no contract still collects 1.3× pay every year (a rank-6 merc earns 9,100 idle). For regular soldiers and nobles, pay and income are created from nothing; no treasury is charged.
14. **Reparations stack.** Both reparation checkboxes are independent (`UI.C.peaceT`), and `peaceOffer` pays both: 3.5× for a cost of 44 beats the crushing option alone.
15. **AI debt never goes down.** Debt is added (core:7452, 26474) but only the player can pay it off. Meanwhile surplus gold above 3× income is deleted (core:21592) instead of repaying debt.
16. **Stability can still dip below 0 inside a year** (medium). Unclamped drops at core:6713, 7392, 7454, 24712 and 26042. The year-end clamp fixes it later, but readers in between see negatives. The plan lists this as fixed; it is half fixed.
17. **The diplomacy "why" list is partly fiction** (medium-high). The UI shows border, race, kin and rival modifiers from `realmStanding`; none of them feed the actual relation drift or `relBetween`.
18. **A war faction's concession starts a war with no checks** (medium): no truce, pact, war-cap or player-realm check.
19. **Siege progress resets** when an allied division happens to be first in the stack (medium-low).
20. **Commoners are penalised twice for promotion at rank 8+** (medium), and the UI shows that soft requirement as a hard one.
21. **Dead code, about 550 lines.** The whole campaign layer (`startCampaign`, core:18981, never called) and `warYear`/`warFront`, plus two empty stubs that are still called.

### UI, saves, journal

22. **Failed autosaves are silent.** All autosaves pass the silent flag; only a manual save shows the error. Nothing on screen says when the game last saved.
23. **Two tabs destroy each other's saves.** One `cur` slot, no lock, no `BroadcastChannel`. Within about 3 autosaves one life is gone.
24. **A new life pushes the old one out.** "Start a new life" and "Random life" don't ask, and 3 autosaves later the old life's backups have rotated away. There is one save per browser.
25. **Closing the tab loses up to a year.** No save on `pagehide`/`visibilitychange`, and no `navigator.storage.persist()` (Safari wipes site data after 7 days away).
26. **Some load failures do nothing visible** (medium-high). `enterSave` sits outside the `try` in `loadGame` and `continueGame`, so a save that decodes but is malformed throws an unhandled rejection.
27. **The redraw loop.** While time runs, the whole tab body is rebuilt with `innerHTML` at least every 1.5 s. Keyboard focus drops to `<body>`, open tooltips are orphaned, and a click that straddles a redraw is lost. Then Enter on `<body>` skips time, so the "Enter aged you a year" fix only covers half the cases.
28. **49 of 50 clickable non-buttons can't be reached by keyboard**: people cards, realm rows, war-room rows and every character-creation option. axe-core doesn't test click handlers on `div`s, which is why it reported 0.
29. **Some reports can't be replayed** (medium-high). A journal without a starting `o` (restarted, imported, legacy) that goes through a save and reload is sent with the wrong base.
30. **Loading an older backup on purpose says "The newest save was damaged".**
31. **Smaller ones:** a save from a newer build loads silently as v13; the localStorage fallback deletes backups to free space and then fails to rewrite them; the map canvases ignore `devicePixelRatio` (blurry on phones); portraits are rebuilt on every redraw; `coatSheen` is a duplicated SVG id; 13 caught errors go only to the console and never into the problem report.

## Checking the plan's claims

### Phase 1 results

| Claim | Verdict |
| --- | --- |
| Page under 3 MB, three loading stages | True: 2.79 MB; core, then packs, then lore |
| No patch-on-patch, "each defined once, no wrappers" | Mostly. 14 `xNow` / `A.x` pairs where the wrapper adds behaviour, 8 repeats of `A.onMonth = A.onMonth \|\| []`, parallel `careerYear`/`careerYear2`, `schoolYear`/`schoolYear2`, `rollEvents`/`rollEventsN` |
| IndexedDB, versioned, checksums, 3 backups in one step, import/export | True |
| Saves exact, save-during-save fixed, RNG restored on load | True |
| Replayable runs, reports replay exactly | True for the engine alone; broken once fighter tiers are shown (bug 1), and for journals without a start (bug 29) |
| Speed fixes | The caches are present and consistent. Part of the gain comes from armies thinking every 3rd day, which slows AI reactions |
| Six tabs, old links work | True (only one alias, `work → path`) |
| Nested tooltips | Two levels, five kinds (worth, its three parts, stats). The plan already says this is unfinished |
| What now, 12 hints, Playtest mode | True. Hints are tied to the world year (before 1115), so an heir in a later year never sees them. Playtest click counts skip misclicks, taps and keys |
| Text diet: 0 over | Three misses (bug 12) |
| Full keyboard play, labels on every control | Not true (bug 28) |
| Fallen realm removed from alliances | True |
| Stability below 0 fixed | Half fixed (bug 16) |
| 11 realms flagged for hoarding | Can't be checked; the audit isn't in the repo. The code caps AI treasuries at about 3× income by deleting the excess |
| Body font Source Serif 4 | Not loaded. The fonts are Alegreya, Cinzel and Cinzel Decorative, and the body is Alegreya |

### Aspect scores

The current scores in the plan look fair. A few notes that change the picture:

- **Power scaling.** "One tier up wins about 73%, two tiers about 92%" is what the screen shows (a logistic on the worth gap), not what duels do. Simulated duels with the same AI on both sides: one tier up wins 82–92%, two tiers 98–100%. With auto-play the player's seat wins about 72% of even fights, because the player wins ties, refuses to fall once, and the NPC can yield. Tier widths are uneven (10, 13, 14, 14, then 27 for Master). The in-game text says "perhaps five" Legends alive; the plan targets about 12.
- **Character.** The plan counts about 9 overlapping progression systems. There are about 12: plan, intensity, 13 aims, 39 activities, 114 perks, aptitudes, 35 specs plus arms and doctrines, 3 masteries, 265 styles with 1,284 techniques, two school systems, masters, drill. Training gives about 31 skill points a year; learning by doing gives 1.5 per check. Will only rises (to 160) and never declines. There is one `happy` value and one health bar: no needs, no body parts.
- **Checks.** Median difficulty 45, each point worth 1.6%, floor 4%. A 16-year-old has a median 4–8% chance on event checks, and 42–53% of their checks sit at the floor. By 60 the median is still only 18–23%. Most young lives fail most rolls.
- **Events.** The recipe claim holds. 82% have exactly 3 choices; 53% of choices have no check; median effects are tiny (happy 3, fame 2, skill 2). Only 95 events (3%) read a flag set by another event, 9 queue a follow-up, and **287 of 450 flags are set and never read** (`ch_first_love`, `fm_affair`, `wr_traitor`…). Those are memories already being recorded with nothing listening. Wiring them up is the cheapest route to the 40% target. Old age has only 35 events (about 1%).
- **Relationships.** One opinion number plus a type per pair; the other side moves 0.8× as much. Nothing NPC-initiated. But the lazy lore already has 573 cast members with written `wants` and `fears`, which is exactly the raw material Relationships step 1 needs.
- **Diplomacy.** Ruler traits are read nowhere in `diploAI`, `aiWarCheck`, `interest`, `callToArmsNow` or `checkPeace`. Personality is `A.AGGRO`, one fixed number for 19 realms. 152 constant-probability dice calls in that code.
- **War.** Rank 7+ can turn a whole province fight into one wing battle that decides it. Ranks 4–6 get a fixed −12% / +8% organisation nudge, ranks 1–3 a mission with a similar nudge. So "15%+ at every rank" is met only at the top. Sieges are a pure day counter. No after-action report.
- **Economy.** One market per realm, prices from lore keywords, 20% monthly pull back to target. Buying and selling the same load at home is profitable in small markets (simulated about 570 gold per 20 click pairs for pearls). Export runs give 50–60% gross before tolls and risk, at the cost of initiative only. AI buildings cost no gold.
- **World and lore.** Consistency is strong: every realm, culture, faith, creature and secret id used by events resolves. The Europe-mirror note is broader than the plan says. Ardan maps onto Earth: Old Solen is Latin, Northfolk Old English, Qadiri Arabic, Tamari Egyptian, Abari Ge'ez, Ranpuri Sanskrit, Skyfolk Tibetan; Lucerna is Venice, Solenne the Papal States, Nine Winds the Mongols. Gaps: 3 capitals (Lucerna, Wolfhaven, Qadira) and 81 of 180 house seats aren't on the map; 9 of 20 "ally" pairs aren't alliances in the relations table; no realm has `want`/`fear`/`customs` yet. Local events already exceed the plan's target (623 realm-gated events, 13–36 per realm), though coverage is lopsided (Ostra named 61 times, Frostholm 7).

## Code health

- **No source in the repo.** The single biggest risk. The plan describes a build, a test runner with 28 steps, bots, goldens, a lint step and an event checker, and none of it is here. If the machine holding them dies, the game can only be patched by hand-editing a minified, compressed blob. Commit the source, the build and the tests.
- **The file name.** `ardan (1).html` is a browser's duplicate-download name. Ship it as `index.html` (or `ardan.html`) so the repo can be served directly with GitHub Pages.
- **Big functions.** `applyFx` about 430 lines handling 75 effect keys, `queueAiOffer` 410, `diploAI` 285, `diplOptions` 290, `rulerAction` 290, `armyThink` 235, `fightDay` 230.
- **Silent `try {} catch {}`** around `growthYear`, `makeSuperior` and two more; errors there disappear.
- **Magic numbers everywhere**, for example 0.0042 in `wingClash`, 0.11/12 for war declarations, 386 gold a month for trade lines, 1.6% per check point, a 240-day repeat window.
- **A full `innerHTML` redraw** is the root of most UI bugs (focus, tooltips, lost clicks, portrait cost). Redrawing only what changed, or skipping the tab body while it has focus, removes a whole class of them.
- **The good stuff is real**: one seeded RNG, a journal that records RNG state per command, checksummed saves with atomic rotation, escaping used everywhere typed text appears, a well-structured lore database with ids that resolve.

## Suggested order

1. This week: bugs 1, 2 (security, replay), 9 (token regex), 13 and 14 (free money), 22–25 (save safety). All small and all high value.
2. Commit the source and the tests. Without them nobody else can help, and you can't safely refactor.
3. Run the 5-player test the plan already calls for. Playtest mode is ready; it's the only thing gating Phase 1.
4. For Phase 2, start with what already exists: wire the 287 unread flags into events (the cheapest step toward 40% memory), feed ruler traits into `diploAI` and `aiWarCheck`, and give the 573 cast members' written wants and fears to the monthly NPC action loop.
