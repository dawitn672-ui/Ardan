# Branches on GitHub

What each branch on `origin` is for (D-037). Work lands on an integration branch through the session's PR; every
version also gets a `release/<version>` branch (the git proxy refuses tag pushes).

| Branch | What it is | Keep? |
|---|---|---|
| `main` | The original upload of the shipped release (`1589d44`, 2026-11-01) | Yes: the starting point |
| `claude/dreamy-sagan-anwszt` | The session's base branch; PR #2 merges `v2-integration` into it | Yes |
| `v2-integration` | Where all v2 work is merged and CI runs (PR #2) | Yes |
| `v3-integration` | Created when v3 building starts (from v2's last version) | Later |
| `release/v2.0.0-beta.1`, `release/v2.1.0-alpha.1` … | One per version: the restorable record | Yes, always |
| `v2-lane-*` (8: diplomacy, family, map, nobility, saves, stats, time, war) | The v2 lanes of Nov 1-4; each holds 4-45 commits not in `v2-integration` (READMEs, tests and small fixes that were superseded during integration) | Kept until looked through |
| `v2-wf-repeats` | One commit not in `v2-integration` (a README line, Nov 6) | Kept until looked through |
| `v2-fix-*` (9), `v2-wf-*` (26) | Working branches of Nov 1-6, **every commit already inside `v2-integration`** | Can go (owner's yes needed; tips listed below so any can be restored) |

## Tips of the fully merged working branches (to restore one: `git push origin <sha>:refs/heads/<name>`)
- `v2-fix-content` · `0584ae3`
- `v2-fix-diplomacy` · `0ae6d25`
- `v2-fix-family` · `62ed3ab`
- `v2-fix-map` · `288d3a2`
- `v2-fix-names` · `9debbc8`
- `v2-fix-nobility` · `ef09a87`
- `v2-fix-stats` · `6526b83`
- `v2-fix-time` · `0a85c6a`
- `v2-fix-war` · `14d13f6`
- `v2-wf-balance` · `f40a250`
- `v2-wf-body` · `f124217`
- `v2-wf-cardrisk` · `b7cd0ab`
- `v2-wf-chronicle` · `4e3842e`
- `v2-wf-ci90a` · `b78988d`
- `v2-wf-ci90b` · `0430b10`
- `v2-wf-ci91` · `711aeed`
- `v2-wf-family` · `43db5df`
- `v2-wf-gates` · `51e3e6b`
- `v2-wf-inktiming` · `c591cbd`
- `v2-wf-layout` · `7590a66`
- `v2-wf-lines` · `dd30081`
- `v2-wf-map` · `7aeea0c`
- `v2-wf-numbers` · `7b3c081`
- `v2-wf-numbers2` · `199129d`
- `v2-wf-observes` · `03a7c9b`
- `v2-wf-phonetap` · `cbdb6ec`
- `v2-wf-renown` · `1ad2e7c`
- `v2-wf-rolls` · `0bcec2d`
- `v2-wf-rollsfallout` · `c355520`
- `v2-wf-round2` · `1eef0bd`
- `v2-wf-sameworld` · `0451bd1`
- `v2-wf-timetest` · `0de7d5f`
- `v2-wf-warbattles` · `555e4dd`
- `v2-wf-warleaks` · `c81e4f4`
- `v2-wf-world` · `a42b0a6`
