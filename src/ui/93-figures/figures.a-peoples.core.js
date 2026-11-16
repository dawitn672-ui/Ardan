// 93-figures · the peoples: what each culture wears on the head, dyes its cloth, and whose smiths arm it (arms: the
// style of hilt, haft and rim the figure library draws; a culture without one carries the common northern make).
//
// The table was 63-miniature-portraits' (retired to archive/63-miniature-portraits/). C8c moved it into the figure
// library (src/ui/engine/figure/cultures.js), where the wardrobe that draws each people's cut reads it and the dress
// sheets can too; this file is the game's way to it. The library loads after this file, so the table is read when asked.
(function () {
  if (typeof PORTRAIT === 'undefined' || typeof PORTRAIT.svg !== 'function') return;
  const FG = UI.FIG = UI.FIG || {};
  const LIB = () => (A.V2 && A.V2.figure) || null;
  // a culture's dress row
  Object.defineProperty(FG, 'CULT', { get: () => { const L = LIB(); return (L && L.CULTURES) || {}; }, configurable: true });
  FG.cultOf = cid => { const L = LIB(); return L && L.cultureOf ? L.cultureOf(cid) : null; };
})();
