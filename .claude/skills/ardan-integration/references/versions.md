# Versions and milestones (moved from CLAUDE.md, order 102)

## Versions and milestones

Every foundational or significant change is a version (`docs/VERSIONS.md`, `tools/version.mjs`):

- **Major:** the nature of the game changes (D-175, `docs/VERSIONS.md` "The basis"): v2 = the realistic medieval life
  (`docs/V2_SPEC.md`); **v3 = the world of levels and monsters** (the level ladder, bestiary and legends, the locked map,
  skills in levels); **v4 = the high-fantasy world** (magic, new races, the canon rewrite, professions); **v5 = the phone
  release** (the store's 1.0).
- **Minor:** a round, cycle or step that adds or replaces a system. **Patch:** fixes only.
- **Pre-release** (`-alpha.N`, `-beta.N`, `-rc.N`) while a major is being built.
- **How a version is cut (D-134, order 65), one way only.** A version is the commit CI tested green on both tiers
  (`check.yml` and `long.yml`). `node tools/version.mjs new vX.Y.Z "what changed" --at=<that sha>` writes its row in
  `docs/VERSIONS.md`, moves the changelog bullets that came with it under its heading, and saves a sample game in
  `tests/saves/`; push `release/<version>` at exactly that commit, then commit the records on the trunk, `main` (`[skip ci]`
  unless a later batch needs its run). `node tools/version.mjs check` (run by `tools/check.mjs`) fails when the rows,
  release branches, changelog headings and sample saves disagree.
- **Batches.** Merge features in a batch with one `[full ci]` push; the next batch waits on its pushed branches until
  this one is green or every red test is owned by a fix branch (fix branches merge any time). Cut a version from each green
  batch, and tell the owner what the batch holds, not what may land later.
- **Milestones** also get a named release branch, `release/<name>` (for example `release/v2.1-foundations`): this
  session's git proxy refuses tag pushes, so the branch is the restorable record on GitHub.

