# Versions

Every foundational or significant change to Ardan is a version: an annotated git tag (`vX.Y.Z`) on a commit that
holds the built game (`index.html`). Any version can be played exactly as it was:

```sh
node tools/version.mjs list                         # every version
node tools/version.mjs get v1.5.0                   # writes versions/ardan-v1.5.0.html (ignored by git); open it in a browser
node tools/version.mjs new v2.0.0-beta.1 "Title"    # tag the current clean commit and add its row below
git push origin --tags                              # publish the tags
```

**What gets a version** (also in CLAUDE.md):

| Part | When it changes | Examples |
|---|---|---|
| Major | A new design the owner set | v1 is the shipped release and the rounds built on it; v2 is the owner's v2 spec (`docs/v2/V2_SPEC.md`) |
| Minor | A round, cycle or step that adds or replaces a system | |
| Patch | Fixes only | |
| Pre-release (`-alpha.N`, `-beta.N`, `-rc.N`) | While a major is being built | One alpha for each v2 step; a beta once the playtest loop finds nothing structural |

Tag a commit whose CI is green, or the end of a step the owner asked for. Say in its title what changed for the player.

| Version | Date | Commit | What changed |
|---|---|---|---|
| v1.0.0 | 2026-10-12 | `876aac4` | The shipped release (b593143), as uploaded |
| v1.1.0 | 2026-10-13 | `9740bca` | The build system: the release untouched in `vendor/`, features that patch it, the fix layer |
| v1.2.0 | 2026-10-16 | `918d01d` | Road to Ten round 6: 61 features (AI, chronicle, honest odds, sieges, squads, schemes, arcs, realm bibles) |
| v1.3.0 | 2026-10-17 | `984c01b` | Road to Ten round 7: 69 features, 383 tests, every balance band held |
| v1.4.0 | 2026-10-27 | `bd1fb3e` | Redesign and the Great Continent: folds, Woodblock & Light, anime portraits, 2,033 provinces, world scaling |
| v1.5.0 | 2026-10-29 | `89dfb45` | Cycle 1: journeys, atlas, identity, chapters, share cards, trade roads, the Polity, war to the last company (CI run 80 green) |
| v1.6.0 | 2026-11-01 | `dd737d8` | Cycle 2: stakes, advisors and fixes from four reviews (closed for the owner's test) |
| v2.0.0-alpha.1 | 2026-11-01 | `437efa6` | v2 step 1: the v2 engine in the build, its tests in the release check |
| v2.0.0-alpha.2 | 2026-11-04 | `f933c89` | v2 step 2: one generated continent; the Far Lands out of the build |
| v2.0.0-alpha.3 | 2026-11-04 | `b179bad` | v2 step 3: Next month only; cards one at a time; five places |
| v2.0.0-alpha.4 | 2026-11-04 | `c526d79` | v2 step 4: bodies in real units; checks through `attempt()`; words, not percentages |
| v2.0.0-alpha.5 | 2026-11-04 | `98926ec` | v2 step 5: three generations of kin; no birth picker; one relation resolver; house law |
| v2.0.0-alpha.6 | 2026-11-04 | `4a0a889` | v2 step 6: courts from `buildHierarchy` (with the border-seat fix) |
| v2.0.0-alpha.7 | 2026-11-04 | `6bdd16f` | v2 step 7: diplomacy as named reasons ticked monthly |
| v2.0.0-alpha.8 | 2026-11-04 | `db821a1` | v2 step 8: no spectating; you play your rank; elite orders |
| v2.0.0-alpha.9 | 2026-11-04 | `a42fbbd` | v2 step 9: v2 state in the versioned save, one migration |
| v2.0.0-alpha.10 | 2026-11-05 | `2ccd001` | v2 playtest 1, fixes round 1: soft-locks, spectating leaks, words for numbers, labels, regrants, blocs, map labels |
<!-- versions:end -->

v1.0.0 is the release file as uploaded; from v1.1.0 on, every version's `index.html` is built from that commit's
`features/` by `tools/build.mjs` (CI checks the committed file matches its build).
