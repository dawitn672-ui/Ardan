# Retired: 9993-life-chapters (a life in chapters, and what a house carries)

**What it was.** The whole feature folder `src/events/9993-life-chapters/` (its own `README.md` is kept here): a chapter
card (`chp_card`) at each stage of life with three aims, the third chosen from two; aims checked each month with small
rewards; the Book listing every chapter; and the dynasty legacies (`chp_legacy`: three of five perks offered when you go on
as your heir). Its stages `life-chapters.chapter` and `life-chapters.legacy` are taken out of
`src/core/01-stages/manifest.core.js`. `v2-time-tests.retired.mjs` holds the two tests that lived in
`src/core/99992-v2-time/test.mjs` (`v2tChapterPanel`, `v2tChapters`).

**Why retired.** Owner order 54 (the playtest, P3; D-062 addendum): "remove the ambitions feature. the useless decisions
and chapters ... not a single thing should be handed to you without you seeking it out." A chapter's aims and its choice
of a third aim were goals handed to the player.

**What is left.** Guarded readers stay inert (`A.CH` absent): 9994-share-a-picture's book heading, 92-scene-card's test,
99993-v2-stats' faith aim filter, 97's frame list (`chp_card`). Old saves keep `p.chap` and `S.dynasty.legacies`; nothing
reads them, and a legacy already given stays given.

**Last commit that built it:** `c6fb716` (branch `p3-playtest`, from `v2-integration` at `2aaf1ba`).
