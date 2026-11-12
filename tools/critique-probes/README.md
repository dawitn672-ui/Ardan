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
