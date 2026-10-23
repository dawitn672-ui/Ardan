# Overnight report: Oct 23

Asked for: "a play-test ready game with absolutely 0 errors", plus improvements to every aspect, chosen by research into what the best-loved games do.

## Where it stands

- **Errors.**
  - The soak monkey (`tools/soak.mjs`) plays the real screens. It clicks at random, lets time pass, starts lives of every people and rank, and every 40 steps draws every tab, a dozen people and the War Room. It records crashes, `console.error`, failed loads and broken words on screen.
  - Over four long runs (32 lives in all, on seeds 11 to 41) it made 39,398 clicks, played 734 game years and drew 28,022 screens. A first, shorter run on seed 1 is not counted.
  - It found one bug, an event drawn with raw `{tokens}`. That bug is fixed (88-queue-head). The run after the fix found 0.
  - The accessibility audit finds 0 WCAG 2.2 AA violations on 26 screens.
  - CI is green on run 60 (80 features: every test shard and the balance league).
- **Ready to send.** `index.html` is the whole game in one file. It runs offline, because the fonts are inside it. `docs/plan/Playtest kit.md` covers running the five-player test, the ten tasks, what to ask afterwards and how to read the results file.

## What changed tonight, by what a player meets

| Moment | Before | Now | Feature |
| --- | --- | --- | --- |
| Opening the file offline | Fallback serif, failed font loads in the console | The real typefaces, nothing fetched | 77-offline-fonts |
| Loading | 4.5 s (the profile) | 2.4 s | 48-fight-ladder (tagged each choice twice) |
| The title on a laptop | "Begin a new life" below the fold at 1280×800, 1366×768, 1440×900 | In sight | 86-title-fold |
| The first minutes of a life | A newborn waited 2 to 6 minutes of real time for a first event | Seconds: ×10 under 5, ×3 to 10, ×1.5 to 15; the life is unchanged | 82-early-years |
| The top bar | At 1024 px the place and purse vanished; the debt was cut mid-word | Place, purse, Save and Menu wrap together; the purse is never cut | 84-top-bar |
| The log | "This month you got better at…" twelve times a year | Once a season | 31-learn-by-doing |
| A battle | Unit labels printed over each other | Labels keep apart; all drawn after the blocks | 85-battle-labels |
| Death | "M … aster of the hunt" (a drop cap split the word) | Plain letters on the obituary | 83-obituary-caps |
| An event after buying a hovel | Raw `{n}`, `{said}`, `{them}` on screen | Never drawn | 88-queue-head |
| A playtest | The file held 10 task timings | Plus the whole session: controls, events and read time, tabs, stalls, errors, where they stopped | 78-playtest-log |
| Beasts | The Tiger of Ranpur hunted 244 of 306 provinces | Each beast in its canon range; humans who reach 20 die at 61–66 (canon 55–65) | 76-beast-habitats, 79-beast-scenes |
| Memory | 213 flags that nothing read back | 177 callbacks; 2 orphan flags left | 80-callbacks |

Smaller fixes:
- the endings heading's stray gaps;
- the Mods panel's spacing;
- the playtest bar's close button;
- an empty elite-orders tooltip;
- a test that waited on a fixed 30 days;
- a flaky click test, whose cause was found and fixed rather than retried.

## Design calls for you

1. **A first life can end in infancy.** On Hard, 1 newborn in 20 dies before five, as canon intends. With five playtesters, there is about a 1 in 4 chance that one of them meets it.
2. **New players start on Hard**, the release's default. On Story no newborn of 60 died before five.
3. **The world bible bans ranks, tiers and numbered skills** ("a fighter's danger is told in words"). The game runs on them. Bringing it in line would be a redesign.
4. **The world bible is not in the repo.** `canon/` is gitignored because the repo is public. Publishing it is your choice. Two small tables from it, the beast ranges and the province regions, are baked into 76-beast-habitats.

## What is not done

- **Firefox and Safari are untested.** Only Chromium is installed here. The kit asks for Chrome or Edge in the first round.
- **Five real players.** Nothing a machine does replaces them. That is the next step.
