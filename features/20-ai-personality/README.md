# AI personality

**Aspect:** Diplomacy and politics · **Kind:** system (persona model + small engine hooks + UI)

AI rulers used to share one number per realm (`A.AGGRO`) and roll fixed dice. Ruler traits were read nowhere in
`A.aiWarCheck`, `A.diploAI`, `A.interest`, `callToArmsNow` or `A.checkPeace` (checked in the fix-layer build: the
only personality input in all five was `A.AGGRO`). Now every ruler has a temper built from their traits. It weighs
every diplomatic decision the engine makes, each decision is logged with its top three reasons, and the diplomacy
screen shows the numbers the AI actually uses.

## What changes for the player

- **Rulers behave like their traits.** A wrathful, ambitious king goes to war at milder grudges, sooner after the last
  one, and with less of an edge. A kind, content one rarely starts a war at all. Honest and loyal rulers answer calls to
  arms and keep alliances; fickle and deceitful ones break them. Proud rulers will not kneel, hold out in lost wars and
  refuse tribute. Cautious ones submit, sign pacts and make peace early. Greedy rulers demand tribute and hoard their
  subsidies. Gregarious rulers seek allies. Zealous ones care about faith. Forgiving rulers bury old rivalries.
- **Would-be rulers too.** In AI-started succession crises, a claimant with a peaceful temper may kneel rather than
  start a civil war. A refused faction rises or backs down by its leader's temper. Civil wars started by events are
  untouched.
- **"Recent decisions of rulers"** (Realm tab, Diplomacy view; a fold-out under the court view for non-rulers). It
  lists the last 300 decisions, newest first, each with *Because: …* and *Despite: …* reasons, and a note when a ruler
  acted *against their nature* or was *true to form*. You can filter it to decisions touching your realm.
- **Diplomacy card.**
  - *Their ruler:* trait chips, plus what they add up to ("warlike, breaks faith, will not kneel") and the war weight.
  - *Every treaty answer starts from…*: their interest in you, broken into its largest parts (now including their
    ruler's character, and your ruler's reputation for keeping faith), plus your chancellor.
  - *Pulling them each year* replaces the old "Slowly pulling them" list. That list came from `A.realmStanding` and
    fed nothing. The new one shows the real yearly drift the engine applies: the existing terms, the ruler's
    character, and the 3% fade from `A.diplomacyYear`.
  - Proposals with their own formula (demanding tribute, forging claims) show their own reasons.
- **Peace screen.** "Their willingness" is broken into its parts, including the enemy ruler's temper.
- **AI offers to you** end with "Their reasons: …".

## Design

### The persona (`persona.core.js`)

`A.rulerPersona(realmId)` returns
`{ war, warLog, cult, honor, greed, caution, pride, social, zeal, patience, wrath, warmth, traits, parts }`.

- Each of the 40 trait keys (`GD.TRAITS`, including the extended set rulers actually carry: vengeful, forgiving,
  just, arbitrary, paranoid, trusting, reckless, cautious, stoic, temperate, gluttonous, romantic, witty, lazy,
  diligent, honorable) carries a small weight vector (`A.AI_TRAIT_WEIGHTS`). Opposites mirror each other, so a ruler
  who is both brave and craven cancels out.
- `war` is a multiplier on the odds of declaring war: `cult × e^warLog`. Here `warLog` is the summed war weight of
  the traits (wrathful +0.55, ambitious +0.55, impetuous +0.4, cruel +0.4, brave +0.35, proud +0.3, greedy +0.25;
  content −0.6, craven −0.6, kind −0.5, calm −0.45, patient −0.4, humble −0.4, generous −0.25).
- `cult = A.AGGRO[realm]^0.5`. The realm's tradition stays the baseline, but compressed, so a ruler's character can
  outweigh it: the orc Horde at 1.7 becomes 1.3, and the gentlest realm at 0.2 becomes 0.45.
- The other axes are sums clamped to −1..1. `A.personPersona(person)` gives the same model for claimants and rebel
  lords, with no realm tradition.
- The persona is a pure function of the ruler and their traits. It is cached per realm by ruler id + traits, and
  never stored in `A.S`.

### Where it is applied (`patches.mjs`: 9 patches, 55 small edits)

The dice are rolled where the engine already rolled them. The persona changes the odds, thresholds and gates.

| Decision | Before | After |
| --- | --- | --- |
| War declaration (`aiWarCheck`) | `A.AGGRO × …`; opinion ≤ −25; weariness ≤ 30; edge 0.7; no-cause ×0.6 | odds `cult·e^(1.6·warLog)` (warlike) or `e^(5·warLog)` (peaceable); opinion bar `−25 + 25·warLog` (−60..0); weariness `30 + 20·warLog`; edge `0.7 + 0.3·caution`; no-cause ×`0.6·e^(−0.6·patience)`; a rest of `2.5·e^(−2·warLog)` years (1..25) after starting a war (`realm.aiLastWar`) |
| Betraying an ally | `AGGRO ≥ 1.15`, 6% | war weight ≥ 1.15, `6%·e^(−1.5·honor)` |
| Forging a claim (justify) | `AGGRO ≥ 0.9`, `30%·AGGRO` | war weight, ×`e^(0.4·patience)` |
| Keeping an alliance | interest < 8 → 35%, threat → 50% | bar `8 − 12·honor`, odds ×`e^(−1.1·honor)` |
| Seeking an alliance | interest ≥ 48 | `48 − 15·social` |
| Defensive pact, NAP, trade, guarantee, subsidy, embargo, naming a rival, submitting as tributary | fixed 12/5/6/15/25/3.5/8/4% | ×`e^(Σ k·axis)` from one table (`W` in the code), which also writes the reasons |
| Burying a rivalry | never | peaceable or forgiving rulers, rivalry ≥ 5 years old, opinion > −60 |
| Answering a call to arms | `0.45 + rel/200 − …` | `+ 0.6·honor − 0.2·caution` (also in `warPreview`, so the war screen's odds match) |
| Joining an ally's attack | 35% | `35%·e^(0.4·honor + 0.9·warLog)` |
| Giving in (`checkPeace`) | 30% / 20% | ×`yield` (caution up; pride and wrath down) |
| White peace | 3% / 2% / 15% | × geometric mean of both rulers' willingness |
| Player's peace offer | `will` | `+ A.aiPeaceWill(enemy)` (±20) |
| Tributary defies its overlord | 25% / 12% / 20% | ×`e^(0.6·pride + 0.3·warLog − 0.5·caution − 0.2·honor)` |
| Overlord marches to collect | 50% | `50%·e^(0.5·wrath + 0.4·pride + 0.4·warLog − 0.4·warmth)`, rolled only when a war is possible |
| Victor takes the loser as a tributary | 50% | `50%·e^(0.8·greed + 0.3·pride − 0.4·warmth)` |
| Demanding tribute of the player | `AGGRO ≥ 1` | `war·e^(0.7·greed) ≥ 1` |
| Player demands tribute | ratio + opinion | `+ 0.1·(caution − pride)`; refusal means war at `25%·spite` |
| Interest (`A.interest`, every treaty's odds) | opinion, threats, rivals, faith, trade, power | `+` sociability, zeal (same or other faith), greed (rich or trading partner), caution (they are strong), pride (nobody's junior), wrath (old rival), warmth, and the other ruler's honor |
| Threat perception (`threatsTo`) | `AGGRO > 1.1`, ratio > 1.25 | war weight > 1.1, ratio > `1.25·(1 − 0.2·caution)` |
| Yearly relation drift (`politicsYear`) | 7 inline terms | `A.aiPullSum` = the same 7 terms + character (social, zeal, wrath, warmth, pride, the other ruler's honor) |
| Claimant presses a claim (AI-started succession wars only) | always | `e^(2·warLog + 0.4·pride − 0.4·caution)`, capped at 1 |
| Ruler yields to a faction / faction leader rises | power and stability / always | `+ 0.12·(caution − pride) − 0.05·wrath` / `0.95·e^(2·warLog + …)` |
| Coalition leader | strongest member | strongest × war weight ("the hawk leads") |

All tuning constants are in `A.AI_TUNE` (at the top of `persona.core.js`). They were chosen on 12 worlds, not only
on the bench's 3.

### The log

`A.S.aiLog` holds entries `{ y, d, k, r, o, who, t, why: [[label, weight] ×≤3], lean }`, newest first, capped at 300.

- It is created on first use, so old saves load and start logging.
- A positive `weight` pushed toward the decision taken; a negative one pushed against it. Weights are on the
  decision's own scale: log-odds for dice, points for interest. The same trait reached through two axes is shown once.
- `lean` is how hard the decider's own traits pushed toward the decision: > 0 in character, < 0 against.
- Labels are stripped of `<>"`. Every value is escaped with `UI.esc` when drawn.
- Logged decisions: war, betrayal, joining an attack, honoring or refusing a call to arms, breaking an alliance,
  alliance / defensive pact / NAP / trade / guarantee / subsidy / embargo / rivalry / submission, burying a rivalry,
  forging a claim, giving in, white peace, defying an overlord, marching to collect or letting go, taking tribute
  after a win, a claimant pressing or kneeling, a ruler yielding to or refusing a faction, a faction rising or
  backing down, leading a coalition, AI answers to the player's proposals and peace terms, and AI offers to the player.

### UI (`view.core.js`)

`UI.aiTemper`, `UI.aiOfferWhy`, `UI.aiWillWhy`, `UI.aiDecisionsView`, plus a wrapper on `UI.TAB.realm`. Actions go
through `data-a` (`aiLogMode`, `aiLogMore`, `aiLogOpen`). The views only read state: they never call `A.rand` or
write to `A.S`, which the tests check.

## Reference games

Below is what each one does well, what we took, and what a full team would add. The descriptions of the other games
come from general knowledge of them; I did not re-check them against sources this session.

| | Ardan before | Ardan now | Crusader Kings III | Europa Universalis IV | Stellaris | With a studio's time |
| --- | --- | --- | --- | --- | --- | --- |
| Where personality comes from | One number per realm | The ruler's traits (40 keys → 10 axes), realm tradition as a compressed baseline | Every trait carries AI values (boldness, compassion, energy, greed, honor, rationality, sociability, vengefulness, zeal) that are summed per character | National ideas plus a ruler's stats; AI "attitudes" toward each country | Empire personality from ethics and government (aggression, trade willingness, bravery) | Traits, plus memories, stress for acting out of character, and goals (CK3 lifestyles, Civ VI agendas) |
| What it drives | War only, via `A.AGGRO` | War, peace timing, alliances and pacts kept or broken, tribute, rivalries, claims, revolts, interest and drift | Nearly every AI decision is weighted by those values | War, alliances, peace acceptance | War, federations, trade | Also schemes, marriages, councils, AI goals over decades |
| Why it is legible | A "why" list that was partly fiction | Real interest and drift parts; per-ruler temperament; every logged decision with top 3 reasons and an in-character mark | Opinion breakdowns and AI acceptance tooltips | The famous acceptance breakdown ("+20 opinion of us, −1000 we are at war…") | Opinion modifiers | A tooltip on every number; a chronicle that cites the decision and its cause; hidden traits revealed by spies |
| Memory of acts | None for AI decisions | `A.S.aiLog` (300 entries) | Memories, story cycles | Histories, opinion modifiers | Opinion modifiers | A searchable chronicle, rumors that spread decisions to other courts |

What we took: CK3's idea that traits are summed into a few AI axes, which weight decisions rather than script them;
EU4's acceptance breakdown made from the same numbers the AI rolls against; Stellaris's realm-level tradition as a
baseline that a ruler shifts. What we did not take yet: stress, hidden traits, AI goals, and memory of individuals.
Those need their own systems.

## How it is measured

| Metric | Before (fix layer) | After |
| --- | --- | --- |
| **Bench `ai` (acceptance): aggressiveToPeacefulRatio**, 3 worlds × 60 years | **0.76** (105 wars) | **2.92** (96 wars) |
| Wars per 100 ruler-trait-years, aggressive traits / peaceful traits (bench) | 1.05 / 1.38 | 1.40 / 0.48 |
| Same ratio pooled over 12 worlds × 60 years (seeds 606, 1212, 2424, 1–5, 7–10) | 0.92 | 2.42 (every world 1.16 or higher) |
| Wars per world in 60 years (12 worlds) | 34.8 | 29.2 |
| Decisions in character when the ruler's traits clearly pushed (\|lean\| ≥ 0.6), 3 worlds × 60 years | n/a | 80.7% (467 of 579) |
| Decisions in character, any trait push (\|lean\| ≥ 0.05) | n/a | 72.6% |
| Bench `perf` ms per simulated day (two runs each) | 1.59, 1.61 | 1.29, 1.35 (probably fewer wars to simulate; the persona itself is cached and cheap) |

Commands:

```sh
node tools/build.mjs --out=/tmp/ardan/ai-personality/x.html --only=ai-personality --unpack=/tmp/ardan/ai-personality/blobs
node bench/run.mjs /tmp/ardan/ai-personality/x.html --label=tmp-ai --only=ai      # then read and delete reports/tmp-ai.json
node tests/run.mjs /tmp/ardan/ai-personality/x.html --features=security,replay,content-fixes,engine-fixes,world-fixes,saves-ui,ai-personality
```

## Tests (`test.mjs`)

- `aiPersonalityMapping`: traits map to the persona. Hawks are more than 2× the baseline and doves less than half of
  it. Ten opposite pairs push the right axes and cancel when combined. `A.AGGRO` stays the baseline (√ ratio).
  Unknown traits are ignored. A rulerless realm and a lone person work.
- `aiPersonalityReasons`: 30 years of play.
  - Every logged entry is well formed: 1–3 reasons, sorted, no markup, newest first.
  - A war's reasons name the ruler's traits.
  - The log is capped at 300.
  - A save without `aiLog` loads and logs again.
- `aiPersonalityWhy`: `A.interest` equals the sum of the parts the screen shows, and `A.aiPullSum` equals the shown
  pulls, for every pair of realms (1,056). The yearly drift runs through `A.aiPullSum`. The card has no fictional list
  and shows the temperament, the reasons and the decisions view.
- `aiPersonalityRenderPure`:
  - The court fold-out and the diplomacy cards for every realm, drawn as a new ruler, leave the random stream alone.
  - Every later draw, `T.renderAll` included, changes neither the stream nor the state.
  - Markup in a log entry is escaped.
- `aiPersonalityLongSim`: four worlds × 50 years with no errors. The log stays bounded. Warlike traits start more wars
  per trait-year than peaceful ones (ratio > 1.5).
  - It was two worlds × 70 years until a later feature that drew one more random number a month moved that ratio from
    5.3 to 1.45 on the same seeds.
  - Four worlds read 2.0 to 5.3 across builds and seed sets, and two builds on the same new seed set read 1.98 and 2.06.
  - The effect is real and about 2 to 3 times; the single-world figures are noise.

The fix layer's `renderRng`, `replayWithRender` and `journalReplay` pass with this feature, so replays stay
deterministic.

## Limits and side effects

- **The bench metric is noisy per world.** Single worlds range from 1.16 to 12.9, because one different war changes
  everything after it. Trust the pooled numbers.
- **Mixed rulers count twice.** The bench counts a ruler with both an aggressive and a peaceful trait (wrathful but
  content) on both sides. The model treats them as near neutral, which caps how high the ratio can go.
- **About 16% fewer wars.** 34.8 → 29.2 per world over 60 years, because gentle rulers no longer start them and
  peaceful claimants sometimes kneel. Warlike rulers are already at war most of the time, so they do not fill the gap.
- **Character is traits only.** It does not yet change with age, stress, memories of individuals, or the ruler's
  opinion of the other ruler as a person. Rulers do not lie about their temper, and every trait is visible.
- **Reason weights are on each decision's own scale** (log-odds, or interest points). They rank reasons within one
  decision; they do not compare across decisions.
- **Some proposals have small fixed bonuses that are not itemized**, such as a defensive pact's +20 for a shared
  threat. The shared line shows interest and the chancellor; those extras appear only in the % shown.
- **`A.realmStanding` still exists**, but the UI no longer reads it.
- **Found while testing, not caused here:** in the base game, the court view's first draw for a brand-new ruler
  consumes `A.rand` (creating house heads). `aiPersonalityRenderPure` works around it by drawing once first. The
  fix layer's `renderRng` does not cover rulers, so it is not caught there.

## Cycle 2: a realm's humour in each world (world review F3)

**Why.** The same history ran in every seed: Zanara fell in 7 worlds of 8, Kethra lost land in 4 of 4, and Vahra always grew. Each realm's appetite for war was its lore's tradition (`A.AGGRO`) and its ruler's traits, and the lore's opening rulers are fixed.

**The humour.** Each realm now draws once, at its first month, a humour for this world: `r.aiMood`, log-even between 0.55 and 1.6, with a median of 1. It is drawn in the month hook, never on a read.

**What it changes.** The persona's tradition baseline is multiplied by the humour, so a realm's war weight, hazard, rest, bar and weariness all follow it. A hungry Vahra and a quiet one are both possible.

68-casus-belli adds learned caution and the shrunken realm's defence (see its README).

**Test.** `moodVaries` shows each realm drawing its humour within the range, two worlds differing for every realm, and the persona's war weight following the humour.
