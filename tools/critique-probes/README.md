# Critique probes (stamped 2026-11-12 06:15 ET)

The Playwright and Node scripts the round 2 critics wrote to measure and reproduce what `docs/CRITIQUE.md` reports
(the lag over 50 years, the marshal bug, relationships at birth, hover anchors, words per screen, portraits, map
probes, the 12-world consistency sweep). They are the starting point for the regression tests of A1, A2, C6 and B5.
They were written against the frozen beta.1 copy at `/tmp/ardan/snap` and may hard-code `/tmp/ardan/...` paths:
point them at `index.html` before reuse. Raw outputs (screenshots, JSON, logs) were not kept.

| Folder | Lens |
|---|---|
| `design/`, `engineering/`, `ux/`, `art/`, `world/` | First-round critics (Opus) |
| `tmp/ardan/critique/final/` | Deciding critics (Fable) |
| `posts-sim/` | The post-map simulations (`docs/reviews/round-2/posts-map.md`) |
| `lead/` | The lead critic's probes |

## Moved to tools/bench (round 2 A0, Q7; stamped 2026-11-12 12:30 ET)

The harnesses step A1 builds on now live in `tools/bench/`, cleaned to take a built page's path (`git log --follow`
keeps their history):

| Was | Now | What |
|---|---|---|
| `engineering/.../final/press.cjs` | `tools/bench/press.mjs` | real Next month presses in CPU time; `--death` plays on as an heir after a death |
| `engineering/.../final/gen.cjs` and `regrant.cjs` | `tools/bench/life.mjs` | a long bot life with the monthly one-holder audit, error and regrant counts, state dumps every 10 years |
| `engineering/.../final/hasprobe.cjs`, `stick.cjs`, `death.cjs`, `hasbisect.cjs` | `tools/bench/style-probe.mjs` | the one-`<span>` style probe in every state, and `--bisect` over the `:has()` rules |

The four style probes are left here as they were; they read `press.cjs`'s `INSTALL` from their own folder, so to run
one again point it at `tools/bench/press.mjs` (which exports `INSTALL`) or use `style-probe.mjs`.
