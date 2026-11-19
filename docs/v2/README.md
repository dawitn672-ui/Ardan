# Ardan v2 kit

> **Historical (as of 2026-11-19).** This describes the v2 kit as the owner delivered it on Nov 1 (a zip of drop-in modules and a 24-test suite). The kit was integrated step by step and its modules now live in `src/<system>/engine/` (bundled by `tools/build-v2.mjs`; tests in `tests/v2/`); the file paths named below (`src/`, `tests/`, `docs/v2-kit-integration-prompt.md`) are the kit's own, not this repo's. For today's state see [PROGRESS.md](../PROGRESS.md) and `CLAUDE.md` ("The v2 engine"). Kept for the record, not maintained.

Tested drop-in modules that fix the Ardan complaint list. Plain ES modules, no dependencies, deterministic from a seed.

- `docs/V2_SPEC.md`: each complaint mapped to its fix, module and test, plus the integration plan
- `docs/v2-kit-integration-prompt.md`: paste this into Claude Code
- `src/`: body, races, odds, kin, succession, nobility, renown, diplomacy, orders, war, events, game loop, map
- `tests/`: `npm test` runs 24 tests
- `tools/`: `node tools/render-map.js <seed> zoom` renders map PNGs; `node tools/build.js` builds the demo; `node tools/playtest.cjs` and `node tools/playtest-war.cjs` run browser playtests
- `dist/ardan-demo.local.html`: the playable demo (open it in a browser)
- `.claude/skills/`: three skills that capture the methods; copy them into the repo's `.claude/skills/`
- `out/`: sample map renders
