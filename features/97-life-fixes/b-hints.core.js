// 97-life-fixes, part 2: hints follow the life, not the calendar.
//
// The release switched every hint off ten game years after 1105 (UI.hintsOn: A.S.year < 1105 + UI.HINT_YEARS). A life
// begun at birth comes of age in 1121, so the two adult hints ("You have initiative to spend", "Hover or tap your
// fighting worth") could never show, nor any hint for a tab first opened after the age of ten. Each hint already shows
// once per browser (UI.set.hintsSeen) and only when its own condition holds (its `when`). So:
// - UI.hintsOn no longer reads the year: hints are on unless the player turned them off (Menu, the setting).
// - A hint shows at its first encounter: the first time its tab is open and its condition holds, at whatever age.
//   The adult ones come on coming of age; a tab's hint comes the first time the tab is opened.
// - The one hint tied to a date ("The game saves itself every year", from 1107) is tied to the life instead: two
//   years after it began (A.S.lf.start, set at the start of a game; a save without it falls back to the old date).
(function () {
  const LF = A.LF = A.LF || {};
  UI.hintsOn = () => UI.set.hints !== false && !!A.S;
  const newGame = A.newGame;
  A.newGame = function () {
    const r = newGame.apply(this, arguments);
    try { const S = A.S; if (!S.lf || typeof S.lf !== 'object') S.lf = {}; S.lf.start = S.year; } catch (e) { console.error('hints start', e); }
    return r;
  };
  LF.lifeYears = () => { const S = A.S; return S && S.lf && typeof S.lf.start === 'number' ? S.year - S.lf.start : S ? S.year - 1105 : 0; };
  for (const H of UI.HINTS || []) if (H.id === 'save') H.when = () => LF.lifeYears() >= 2;
})();
