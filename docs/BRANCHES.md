# Branches on GitHub

The repo is versions being updated (order 76, D-162): one trunk and one branch per version. No working branches are
pushed. Restore any deleted branch with `git push origin <sha>:refs/heads/<name>` (the tips are in this file's history).

| Branch | Why it is there |
|---|---|
| `main` | The trunk: the default branch, always building and loading old saves |
| `v2-integration` | The old name of the trunk, kept level with `main` until the tools and workflows stop naming it; then the owner deletes it |
| `release/<version>` | One per version, at exactly the commit CI tested green on both tiers (D-134) |
| `release/v2.1-foundations` | A named milestone |
| `work/m1`, `work/m1-design` | The designed continent (M1), not merged: waiting on the owner's map decision (Phase 3) |
| `claude/dreamy-sagan-anwszt` | This cloud session's own branch and the old PR #1 into `main`; delete once the session ends |
| `archive/v2-lanes` | The Nov 1 to 6 lane era, kept as a record |

Deleted by the owner: 35 old `v2-fix`/`v2-wf` branches (2026-11-18) and 20 merged working branches (2026-11-25), every
one checked to be inside `main` first.
