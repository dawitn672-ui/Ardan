# Ardan v2 kit

Tested drop-in modules that fix the Ardan complaint list. Plain ES modules, no dependencies, deterministic from a seed.

- `docs/V2_SPEC.md`: each complaint mapped to its fix, module and test, plus the integration plan
- `docs/CLAUDE_CODE_PROMPT.md`: paste this into Claude Code
- `src/`: body, races, odds, kin, succession, nobility, renown, diplomacy, orders, war, events, game loop, map
- `tests/`: `npm test` runs 24 tests
- `tools/`: `node tools/render-map.js <seed> zoom` renders map PNGs; `node tools/build.js` builds the demo; `node tools/playtest.cjs` and `node tools/playtest-war.cjs` run browser playtests
- `dist/ardan-demo.local.html`: the playable demo (open it in a browser)
- `.claude/skills/`: three skills that capture the methods; copy them into the repo's `.claude/skills/`
- `out/`: sample map renders
