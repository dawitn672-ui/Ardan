// Both scales: the reckoning after a war-map fight you were in. The three panels (what you saw, the front, what the
// chronicle will say) are drawn under the text from ctx by scales.core.js; the choice is what you make of it.
(function () {
A.defEvents([
  { id: 'bs_reckoning', title: 'After {place}', trigger: true,
    cond: (p, C) => C.soldier(p) || !!p.mil,
    text: p => 'Three accounts of the same days at {place}: yours, the captains\', and the one the chronicler is already writing. They do not agree.',
    choices: [
      { t: 'Remember it as it was', r: 'You keep your own account, and tell it to nobody who was not there.', fx: { wil: .5 } },
      { t: 'Tell it the way the chronicle does', r: 'In the tavern it grows with every telling, and you let it. Men buy you drinks for it.', fx: { fame: 1, honor: -1 } },
      { t: 'Drink to the ones who did not come back', req: (p, C, ctx) => ctx && ctx.lost > 0, r: 'You say their names at the fire, one after the other, until someone else takes it up.', fx: { happy: 2 } },
    ] },
]);
})();
