# Branches on GitHub

What each branch on `origin` is for (D-037). *Last checked against `git ls-remote origin` on 2026-11-19: 39 branches.*
Work lands on `v2-integration` through merges of `work/<item>` branches (order 64, D-133); every version also gets a
`release/<version>` branch (the git proxy refuses tag pushes). Pull requests: #1 (`claude/dreamy-sagan-anwszt` into `main`) is
open; #2 (`v2-integration` into `claude/dreamy-sagan-anwszt`) was merged on 2026-11-16 at v2.1.0-alpha.9.

| Branch | What it is | Keep? |
|---|---|---|
| `main` | The original upload of the shipped release (`1589d44`, 2026-11-01). Nothing since is on it: it waits for PR #1 | Yes: the starting point |
| `claude/dreamy-sagan-anwszt` | The session's base branch; PR #1 (open) merges it into `main`. It holds v2 up to alpha.9 (PR #2's merge); `v2-integration` is 312 commits ahead of it | Yes |
| `v2-integration` | Where all work is merged and CI runs. The branch to start from | Yes |
| `v3-integration` | Not created yet; created when v3 building starts (from v2's last version) | Later |
| `archive/v2-lanes` | One commit whose 9 parents are the tips of the 8 v2 lanes and `v2-wf-repeats` (their unmerged commits kept reachable, order 54) | Yes |
| `release/v2.0.0-beta.1`, `release/v2.1-foundations`, `release/v2.1.0-alpha.1` to `.15` (17) | One per version, at exactly the commit CI tested (D-134): the restorable record (`release/v2.1-foundations` and `.alpha.5` are the same commit) | Yes, always |
| `work/<item>` (and older `x5`, `w1-5` style names) | Working branches, one per agent's task (order 64, D-133): merged whole into `v2-integration`, then listed under **Deletable** below | Delete once listed |

## Active now (not merged; do not delete)
- `work/m1` · `2e3ff2a5` · the designed continent map (M1, orders 71 to 73, D-151 to D-153): 18 commits not yet in `v2-integration`.
- `work/m1-design` · on the integrator's machine only, **not pushed to GitHub** on 2026-11-19; the map's design work (`docs/design/m1/`).
- `work/repo-tidy` · this housekeeping (README, docs index, branch list, test times); pushed, to be merged whole.

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

## Deletable: merged working branches (orders 64 and 54; the owner may delete them; restore one with `git push origin <sha>:refs/heads/<name>`)
Every one of these tips was checked on 2026-11-19 to be an ancestor of `origin/v2-integration` (`git merge-base --is-ancestor`),
so deleting them loses nothing. (Names come from `docs/PROGRESS.md`: W1-5/W1-6 the war's stages, D11 the military
branches, X5 the state diet, `-ci` a round of CI fixes.) 17 branches:

| Branch | Tip | Last commit |
|---|---|---|
| `d11-1` | `fecc5a74` | D11-1 step 3: the history's measurements and tests (H-088) |
| `d11-2` | `0ba92d46` | D11-2 step 3: the syllabus's words; the history (H-092) |
| `d11-3` | `f2ec9302` | D11-3 step 3: records (D-122 to D-127, H-093) |
| `d11-ci` | `544d8526` | d11-ci: the history (H-096) |
| `d11p` | `e648c106` | D11+ step 2: records (D-128 to D-132, H-095) |
| `w1-5` | `21ca5e35` | W1-5 step 4: the records (D-091 to D-096, H-083) |
| `w1-6` | `bb9502cd` | W1-6 step 3: the records (D-097 to D-103, H-085) |
| `w14-ci2` | `cfe8ced3` | CI 148: rebuild index.html |
| `w15-ci` | `c272d87b` | CI 150 after W1-5 (H-085) |
| `w16-ci` | `de7623af` | w16-ci: CI 152's three failures read |
| `w17-ci` | `ff8c416c` | w17-ci: the history (H-094) |
| `work/w18-ci` | `f3998408` | w18-ci: the records (D-146, H-097) |
| `work/w19-ci` | `454c3407` | w19-ci: the history (H-098) |
| `work/x5-ci` | `42964ab8` | X5 CI: the skills sweep finds new people by id; nmTwins (H-100) |
| `x5` | `36247769` | X5 step 4: records (D-104 to D-106, H-087) |
| `x5-build` | `ddef1f94` | Merge origin/v2-integration into x5-build; index.html stays out of git (D-109) |
| `x5-deaths` | `e075480a` | X5 deaths: H-090 notes the run on v2-integration c42b7bb |

**One line to paste into GitHub's branch page** (Code, Branches; or run `git push origin --delete` followed by it):
```
d11-1 d11-2 d11-3 d11-ci d11p w1-5 w1-6 w14-ci2 w15-ci w16-ci w17-ci work/w18-ci work/w19-ci work/x5-ci x5 x5-build x5-deaths
```
(The earlier tips of the same kind are recorded below. Delete a `work/` branch only after it is listed here.)
- `work/repo-tidy` · `62ede552` · merged into `v2-integration`
