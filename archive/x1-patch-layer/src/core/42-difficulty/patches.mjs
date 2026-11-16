// Difficulty that changes information and recovery: the year's healing reads A.healMul, a choice's odds read
// A.DIFF.showOdds, and the creation screen says what each setting does (difficulty.core.js).
export default [
  {
    id: 'DIFF-HEAL',
    blob: 'ardan-core',
    why: 'The year\'s healing was the same on every setting. It now scales with the setting (Story ×1.5, Realism ×0.7, A.healMul).',
    edits: [[
      'pc.health=A.clamp(pc.health+30+A.stat(pc,"sta")/5+A.perkSum(pc,"heal"),0,mh)',
      'pc.health=A.clamp(pc.health+(30+A.stat(pc,"sta")/5+A.perkSum(pc,"heal"))*(A.healMul?A.healMul():1),0,mh)',
    ]],
  },
  {
    id: 'DIFF-ODDS',
    blob: 'ardan-core',
    why: 'A choice showed its odds as a number only if the player turned that on. Story now always shows the number, Realism ' +
      'only the words ("risky", "likely"), and Hard keeps the player\'s setting (A.DIFF.showOdds).',
    edits: [[
      'c.odds!=null&&UI.set.odds?',
      'c.odds!=null&&(A.DIFF?A.DIFF.showOdds():UI.set.odds)?',
    ]],
  },
  {
    id: 'DIFF-SAYS',
    blob: 'ardan-core',
    why: 'The creation screen described each setting by its deaths alone. It now says what it does to the odds you see and to recovery.',
    edits: [[
      '["story","Story","Childhood is safe; fewer deaths in fights. (×0.6)"],["hard","Hard","The world is dangerous, but not cruel to children. (×1.0)"],["realism","Realism","Historical mortality. Two in five children die. (×1.35)"]',
      '["story","Story","Childhood is safe; fewer deaths in fights. Every choice shows its odds; wounds, illness and prison pass quickly. (×0.6)"],["hard","Hard","The world is dangerous, but not cruel to children. Odds as you set them; ordinary recovery. (×1.0)"],["realism","Realism","Historical mortality. Two in five children die. Odds only in words; wounds linger and sentences run long. (×1.35)"]',
    ]],
  },
];
