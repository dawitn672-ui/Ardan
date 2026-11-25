# 9999960-play-fixes: what the owner's own lives showed (Phase 1)

Tests for the fixes of `docs/design/emilio-1108-findings.md` (order 76). The fixes live in the modules that own the code
(`src/core/release/`); this folder holds only their tests, one per finding.

- **E1** `A.exile` empties the cell: a condemned prisoner who breaks free at the gallows, or bribes the hangman, is no
  longer in prison (cell cards stopped following him abroad).
- **E2** the training injury comes only from training, never in a cell.
- **E3** a card's own result line is logged before the lines its effects write.
