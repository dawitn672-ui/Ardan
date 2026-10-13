# Ardan

*Bloodlines & Banners* — a life simulation and grand strategy game in the world of Ardan, 1105 AR. One HTML file, no server.

**Play:** open `index.html` in a recent Chrome, Edge, Firefox or Safari.

## What is in this repo

| Path | What it is |
| --- | --- |
| `index.html` | The game to play and ship: the release build plus every patch in `tools/patches.mjs` |
| `vendor/ardan-b593143.html` | The release build `b593143@2026-10-12`, untouched |
| `tools/patches.mjs` | Every fix made to that build, as exact find/replace edits with a reason each |
| `tools/build.mjs` | Builds `index.html` from the vendored build and the patches |
| `tools/pack.mjs` | Reads and writes the packed code blobs inside the page (base-122 text over zstd) |
| `tools/show.mjs` | Prints the source of named functions from the unpacked build |
| `tests/run.mjs` | Browser tests (Playwright + Chromium) |
| `Ardan The Road to Ten.md` | The plan |
| `Ardan Road to 100.md` | A hard review of the plan and the game, aspect by aspect, with what a 10 really takes |
| `Ardan Deep Analysis.md` | The first full review of the build |

The game's real source, build step and test suite are not in this repo. Until they are, fixes live as patches on the built file. **Every patch has to be ported to the source**, or the next release from the source will bring the bugs back. Each patch's `id` and `why` say what to port.

## Working on it

Needs Node 22.15 or newer (for built-in zstd).

```sh
npm install                      # acorn and playwright
npx playwright install chromium  # once
npm run build                    # vendor/ + tools/patches.mjs -> index.html
npm test                         # test index.html
npm run test:original            # the same tests against the untouched release (13 of 16 fail)
npm run unpack                   # also writes the readable blobs to .build/
node tools/show.mjs A.fightWorth # print a function from .build/
```

A patch must match its target exactly as many times as it says, so a patch that no longer fits fails the build instead of silently doing nothing. Patches edit minified code. Do not reformat the blobs: the game reads some of its own functions as text (`e.cond.toString()`), so reformatting changes behaviour.
