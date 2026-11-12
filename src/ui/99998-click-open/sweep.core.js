// Round 2 B4 (D-007): the last word on a drawn page. 59-tooltips lifts every long title into a click-to-open
// description (TT.sweepAll) after a redraw and, through a MutationObserver, after any change a feature makes by itself.
// Features that load later than 59-tooltips (the activity tiles of 49 and 91, the v2 stats, the badges of 99993) draw
// into the page after that first pass, so this feature, which loads late, runs the same pass once more when a view or a
// dialog has been drawn. It changes the page only: A.S and the random stream are never touched.
(function () {
  const TT = UI.TT;
  if (!TT || typeof TT.sweepAll !== 'function') return;
  for (const k of ['render', 'refresh', 'refreshTab', 'renderModal']) {
    const f = UI[k];
    if (typeof f !== 'function') continue;
    UI[k] = function () {
      const r = f.apply(this, arguments);
      try { if (typeof document !== 'undefined' && document.body) TT.sweepAll(document.body); } catch (e) { console.error('click-open sweep', e); }
      return r;
    };
  }
})();
