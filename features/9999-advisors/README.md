# The ring of advisors

**Aspect:** A life that is yours, and a world that answers (backtests #4, "The ring speaks", after King of Dragon Pass) · **Kind:** system (`advisors.core.js`, no blob patch), 6 events (`advisors.events.js`, prefix `adv_`, all `npc: true`), tests

**Why.** Before this, every big choice was made alone. The people around you had opinions, wants and skills (56's court, 999's confidants, 9997's captains), but none of them spoke when it mattered. KoDP's clan ring does the opposite: seven voices comment on each decision, each from their own skill and pet interest, often wrong or self-serving, and the player learns whom to trust.

## What it does

**The ring is real people** (`ADV.candidates`, `ADV.refresh`, every quarter and whenever someone in it dies):

| Your life | Who has your ear (best first) | Size |
| --- | --- | --- |
| A ruler | the five council seats of your realm (56's `r.council`), then your spouse and kin | 6 |
| A councillor of another's realm | your liege, spouse, kin, confidant | 3–4 |
| A lord | spouse, parents, confidant, master or mentor, eldest grown child | 4 |
| A soldier | your company's captain (9997, a person by then), a comrade, spouse, kin | 4 |
| Anyone else | parents (first while you are young), spouse, your master at work (`job.boss`) or a mentor, your closest confidant (999's rank first) | 3 |
| A child of 10–15 | parents | 2 |

- Each one is a person in `A.S.people`. A seat or a captain who has never met you gets a bond with you when they join (opinion 10 each way). Nobody is made up.
- `A.ADV.roles.push(pc => [{ id, role, pri }])` adds candidates.

**Each advisor has three things, and all three change over a life:**

- **Loyalty** is their own opinion of you (`t.rel[pc.id].op`). Heeding them warms them by 1.5. Ignoring them cools them by 1, or by 4 if you promised to listen.
- **Judgement** (`ADV.judge`, 0–100, for each matter: war, money, the court, the faith, work, the body and the road, family) comes from:
  - their skills;
  - their trade (a rank-3 weaver knows work);
  - their council seat;
  - their wits and their years, which rise to 18 points at about 48 and fall after 72.

  It shows as a sentence: "often right about war, seldom right about money".
- **Wants** (`ADV.wantOf`, 13 of them). Councillors and lieges have 56's `RI.aims` want, and their fear adds to it. Everyone else wants what their place calls for. A mother wants you safe until 22, then a match and grandchildren, then your company once she is past 65. A master wants good work. A captain wants glory, unless he is cautious. A friend wants your company, unless they are greedy, zealous or ambitious. When a want changes, the log says so.

**Counsel on the choices that matter.**

- **Which choices count as big** (`ADV.isBig`):
  - any `once` event;
  - any event whose condition reads `C.ruler`, `C.atWar`, `C.office`, `C.holds` or `myRealm`;
  - any whose effects touch war, claims, pacts, duels, death, prison, a lover or spouse, assets, promotion, the treasury, legitimacy, stability, authority, a job, or 9996's bills, offices and votes;
  - any costing 100 suns or more;
  - the `po_`, `ri_`, `co_`, `cb_` and `du_` scenes.

  `e.big` and `A.ADV.big.push(fn)` override this.
- **Who speaks.** Up to three advisors (two in a ring of three or fewer) speak above the choices, under 9992's inner voice. They are picked by:
  - whether their place fits the matter (the Marshal on war, a parent on family);
  - their judgement;
  - a second voice who disagrees, which is worth more than a third who agrees.

  The person the scene is about does not counsel on it.
- **What each favours** (`ADV.pick`, pure). The engine's own odds (`vc.odds`) and the written effects are read as families: coin against your purse, life, freedom, name, faith, bond, kin, spirits, skill, realm and war.
  - **Judgement 60 or more:** they favour the choice that is best for you.
  - **Under 30:** they favour what their want calls for.
  - **Between:** a blend of the two.
  - **Their opinion of you under −25:** they argue for their want and against your good. Whom to trust is learned, as in KoDP.
  - **Unreadable effects** (function effects that call the engine): a check's win counts as good and its loss as bad, so the odds still tell.
  - **No view:** an advisor who sees nothing to choose between the choices stays quiet.
- **What it looks like.** One line each: their name and place, their manner (54-voices: "smiling", "without heat"), a line from their want or from the matter, then "→ 3 Sort them by what will please the crown". The row's tooltip gives their want, their fear, what they are good for, their loyalty in words, and your record with them: "You heeded her 3 of 5 times; it went well twice of those". Lines are picked by hashing the event, the advisor and the year, and never repeat within one counsel.
- **When it is worked out.** Once, when the view is built, stored on it as `v.adv`. Drawing it again reads the same thing.
- **The war declaration** (`UI.warDeclModal`) carries the council's counsel too. The odds come from `A.warPreview`'s strength ratio. Declaring is booked in the engine (`A.diplDo`), so a replay keeps the same memory.

**Memory** (`pc.adv.m[id]`: heard, heeded, heeded and it went well or badly, ignored, ignored and it went badly, the run of ignores, the last matter):

- **What counts as going well.** The check's result if there was one. Otherwise the change in your coin, health, wounds, renown, honour, faith and spirits, weighed as above.
- **Your opinion of them follows.** Good counsel heeded raises it by 2. Bad counsel heeded lowers it by 2.
- **Scenes** come as NPC moves on 21's budget, one waiting at a time:

  | Scene | When |
  | --- | --- |
  | `adv_told_you` | Ignored, it went badly, and they knew the matter (judgement 45 or more) |
  | `adv_unheeded` | Ignored three times running. Ask them to stay and promise to listen, let them go (a ruler unseats a councillor; 56 fills the seat at the next court), or say counsel is given, not obeyed |
  | `adv_due` | Heeded three times and it went well: they ask for something their want wants. Give it (6% of your purse), give half, or refuse |
  | `adv_warning` | You heeded someone who dislikes you and it went badly: the shrewdest loyal voice warns you about them |
  | `adv_quarrel` | Two advisors have disagreed five times: they quarrel at your table, and you take a side |
  | `adv_last_word` | An advisor of 68 or more who has counselled you for five years has a last word. The scene says whether you mostly listened |

**Hooks** (for later lanes):

- `A.ADV.counsel.push(fn)`: `fn({ pc, q, e, v, ring, dom })` returns `[{ id, i, line, role?, why? }]`. It adds a line from a person (in the ring or not) favouring view choice `i`.
- `A.ADV.advise(pc, { key, dom, options: [{ t, fx, odds?, loseFx? }] })` gives counsel on any choice that is not an event, and `A.ADV.html(pc, list, labels)` draws it. 9996's bills or a marriage screen can call it directly.
- `A.ADV.big.push(fn)` and `A.ADV.roles.push(fn)`, as above.
- `A.SIGNATURE.ring = true`.
- The setting "Counsel in scenes" (`UI.set.advisors`) turns it off.

**On screen.** The counsel sits in its own `.adv-ring` block before `.choices`, inserted by wrapping `UI.queueModal`. 92's scene card and 9998's choice rows are not touched. The People tab opens with a card: "Your council", or "Those whose counsel you hear". It lists each person's want, what they are good for, their loyalty, and how often you heeded them.

## Measured by (`test.mjs`)

| Test | What it holds | Last run |
| --- | --- | --- |
| `advRing` | A peasant of 17 hears father and mother (both want her safe). A ruler hears all five seats, each a living person who knows them. The same mother wants `safety` at 17 and `kin` at 30 | pass |
| `advHonest` | 200 real scenes with checks. Judgement 85 favours your best 200/200. Judgement 10 favours their want 200/200. Hostile and skilled steers away from your best 83/83. No dice | pass |
| `advMemory` | Heeding once books it and raises their opinion by 1.5. Three ignores queue `adv_unheeded`. Letting them go takes them out of the ring, and `past` says "sent away" | pass |
| `advPure` | A modal with counsel drawn twice is the same. A name `<img data-pwn>` is escaped. State hash and dice are untouched. The People card shows | pass |
| `advScenes` | All 6 scenes, 18 choices played. No raw token. Longest 53 words | pass |
| `advOldSaveAndWar` | A ruler's save with no `pc.adv` draws every tab, plays a year, and fills the ring (6). The war declaration shows 3 councillors, drawn purely. Declaring books 3 counsels | pass |
| `advLives` | 4 bot lives (peasant, artisan, noble, ruler): the share of big choices with counsel and of once-scenes (each 80% or more), heeded against ignored outcomes, and distinct advisors a life (3 or more) | see Numbers |

`lint-events`: 6 events, 42 checked in the browser, 0 errors, 0 warnings. `lint-choices`: 0 of 4 compared obviously best.

## Numbers

These are bot lives on the full build with this feature (`advLives`, 15 years each, seeds 4141–4444). The bot picks choices at random, so heeding is chance:

| Measure | Value |
| --- | --- |
| Big choices with counsel | 146 / 167 (87%): peasant 38/42, artisan 27/30, noble 55/56, ruler 26/39. The ruler's misses were scenes whose effects are engine calls; read by their odds since, see below |
| `once` scenes with counsel | 20 / 22 (91%) |
| Counsel heeded that went well | 36% (50 / 137) |
| Counsel ignored that went well | 25% (54 / 219) |
| Distinct advisors a life | 6.3 (peasant 8, artisan 4, noble 6, ruler 7) |
| Big choices a year | about 3 for a commoner, about 4 for a noble, many more for a ruler |

An earlier probe, 12 years each, before unskilled advisors spoke only from their wants:

- noble: heeded went well 69% (25 / 36), ignored 42% (28 / 66);
- peasant: heeded 39% (7 / 18), ignored 24% (8 / 34).

Listening helps, and it helps more where the ring knows things.

## Rules kept

- **No blob patch.** The feature wraps `A.eventView`, `A.eventChoose`, `A.applyFx`, `A.diplDo`, `UI.queueModal`, `UI.TAB.people`, `UI.warDeclModal` and `UI.ILLUM.menu`.
- **Determinism.** Counsel draws no dice. Lines and tie-breaks come from FNV hashes of ids. The ring's refresh and the memory write state only in the month hook and in `A.eventChoose`, never while drawing.
- **Old saves.** `pc.adv` is optional and fills at the next month. Every field inside it is optional too.
- **Security.** Every interpolated value goes through `UI.esc`. No inline handlers. The hook's lines have `<>"` stripped before they are stored.
- **The new effect key** `adv` (`{ promise, paid, drop: 1 | 'foe', unseat, side: ±1 }`) is declared in `A.FX_EXTRA`.

## Limits

- **Function effects.** A non-check choice whose effect is a function that calls engine code reads as nothing. Advisors then judge it by their wants alone, or stay quiet.
- **War outcomes.** A war you declare is booked as heeded or not, but how the war ends is not yet judged against the counsel.
- **The bot ignores counsel.** It picks at random, so the "listening helped" numbers compare chance picks. A bot that heeds its best advisor would measure the value of the ring directly.
- **Not built.** 9996's bill card and the marriage screens do not call `A.ADV.advise` yet; lane P and lane L can add it.
- **Pacing.** On a ruler's busiest years the ring speaks on many scenes. 92's scene card could fold counsel after the first line on a phone.
