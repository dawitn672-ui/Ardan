# Branches on GitHub

What each branch on `origin` is for (D-037). Work lands on an integration branch through the session's PR; every
version also gets a `release/<version>` branch (the git proxy refuses tag pushes).

| Branch | What it is | Keep? |
|---|---|---|
| `main` | The original upload of the shipped release (`1589d44`, 2026-11-01) | Yes: the starting point |
| `claude/dreamy-sagan-anwszt` | The session's base branch; PR #2 merges `v2-integration` into it | Yes |
| `v2-integration` | Where all v2 work is merged and CI runs (PR #2) | Yes |
| `v3-integration` | Created when v3 building starts (from v2's last version) | Later |
| `archive/v2-lanes` | One commit whose 9 parents are the tips of the 8 v2 lanes and `v2-wf-repeats` (their unmerged commits kept reachable, order 54) | Yes |
| `release/v2.0.0-beta.1`, `release/v2.1.0-alpha.1` … | One per version: the restorable record | Yes, always |
| `v2-lane-*` (8: diplomacy, family, map, nobility, saves, stats, time, war) | The v2 lanes of Nov 1-4; each holds 4-45 commits not in `v2-integration` (READMEs, tests and small fixes that were superseded during integration) | Kept until looked through |
| `v2-wf-repeats` | One commit not in `v2-integration` (a README line, Nov 6) | Kept until looked through |
| `work/<item>` | Working branches from 2026-11-19 on (order 64, D-133): one per agent's task, merged whole into `v2-integration`, then listed under **Deletable** below | Delete once listed |
| `v2-fix-*` (9), `v2-wf-*` (26) | Working branches of Nov 1-6, **every commit already inside `v2-integration`** | Deleted by the owner, 2026-11-18 (tips below restore any) |

## Tips of the fully merged working branches, deleted by the owner on 2026-11-18 (to restore one: `git push origin <sha>:refs/heads/<name>`)
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


**Order 54 (2026-11-16):** the owner asked for help deleting the old branches. All 44 working branches can go: 35 are inside
`v2-integration`; the other 9 are kept by `archive/v2-lanes`. The session's git proxy refuses ref deletion, so the owner runs
`docs/tools/delete-old-branches.sh` (or deletes them on GitHub: Code → Branches → the bin icon).

**Done (2026-11-16):** the owner deleted the 44 old branches. GitHub now holds 15: `main`, `claude/dreamy-sagan-anwszt`,
`v2-integration`, `archive/v2-lanes` and the 11 `release/*` branches.

## Deletable: merged working branches of 2026-11-18 (order 64; the owner may delete them; restore one with `git push origin <sha>:refs/heads/<name>`)
Every commit of these is inside `v2-integration`. (Their names come from `docs/PROGRESS.md`: W1-5/W1-6 the war's stages,
D11 the military branches, X5 the state diet, `-ci` a round of CI fixes.)
- `w1-5` · `21ca5e3` · merged into `v2-integration`
- `w14-ci2` · `cfe8ced` · merged into `v2-integration`
- `w15-ci` · `c272d87` · merged into `v2-integration`
- `w1-6` · `bb9502c` · merged into `v2-integration`
- `w16-ci` · `de7623a` · merged into `v2-integration`
- `d11-1` · `fecc5a7` · merged into `v2-integration`
- `x5` · `3624776` · merged into `v2-integration`
- `d11-2` · `0ba92d4` · merged into `v2-integration`
- `d11-3` · `f2ec930` · merged into `v2-integration`
- `d11p` · `e648c10` · merged into `v2-integration`
