// Retired by S1b (D-072): 69-every-number-counts' Hafts merge, from src/people/69-every-number-counts/live.core.js.
// The axe is a specialism of spear in data/skills.json, for everyone.
// ---- 4. axe and spear are one number for the player: Hafts ------------------------------------------------------------
// Measured (README): with every hook above, axe still changes 2 outcomes in the median bot life. Its places are real but
// narrow (the wood axe, the farmer's and carpenter's year, a commoner's cudgel), and the lives the bots lead, which rise
// into office, trade and command, rarely fight. Spear sits at 4 for the same reason. A cudgel, a wood axe, a staff and a
// spear are the common man's weapons, and the release already files the staff under spear and the club under axe; a
// bill or a halberd is both at once. So, as 49-body-mind did for the blades and the bows, the player's axe is read and
// trained as the spear's family, shown as one row, and an old save's higher number folds in. NPCs keep both numbers, so
// troops, duels between other people and the war layer are as they were.
LN.MERGE = { axe: 'spear' };
LN.merge = function () {
  const BM = A.BM;
  if (!BM || !BM.MERGE) return false;
  Object.assign(BM.MERGE, LN.MERGE);
  if (BM.MERGED_NAME) BM.MERGED_NAME.spear = 'Hafts: axe, mace & spear';
  if (BM.MERGED_DESC) BM.MERGED_DESC.spear = 'Axes, maces, cudgels, spears, staves and bills: anything swung or thrust on a haft.';
  GD.SKILLS.spear = 'Hafts: axe, mace & spear';
  if (GD.SKILL_DESC) GD.SKILL_DESC.spear = 'Axes, maces, cudgels, spears, staves and bills: anything swung or thrust on a haft.';
  return true;
};
LN.merged = LN.merge();

