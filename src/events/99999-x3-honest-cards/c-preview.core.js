// X3 part 2 (E2): the preview says what the choice does. 9998-choice-stakes reads an effect and draws it as chips; three things it
// said that the effect then did not do, found by replaying 400 scenes (tests/suites/x3b.test.mjs x3PreviewReplay400):
//   - "▲ piety" for a man who has no faith: 99993-v2-stats gives such a man a pull toward faith and no piety (d-faith.core.js), so the
//     chip is left off for him, the way the engine leaves the gain off;
//   - "Costs 4 suns" for a physician who took four suns and three in a hundred of the purse (a rich man paid 2,380): the share of the
//     purse is now a chip of its own (stakes.a-read.core.js), and a large share is an eighth (the threshold was 20, for a fraction);
//   - "+150 suns" for "Give it all up and go", which also took the house the story was about (arLose): the effect key is a family
//     of its own now, "▼▼ what the story was about", the way the preview of a death or a prison is.
// Pure reading of the player and the effect; nothing here draws or writes.
(function () {
  const ST = A.STAKES;
  if (!ST || !ST.read || !ST.KEY) return;
  // arLose: the thing the story was about (a house, a farm, a workshop), or a fifth of the coin; always a loss, always large
  if (!ST.KEY.arLose) {
    const rec = ['arLose', 'what the story was about', 1, -1, 19];
    ST.KEYS.push(rec);
    ST.KEY.arLose = { k: rec[0], w: rec[1], big: rec[2], sense: rec[3], o: rec[4] };
  }
  const faithless = pc => { try { return !!(pc && A.V2S && A.V2S.hasFaith && !A.V2S.hasFaith(pc)); } catch (e) { return false; } };
  const read0 = ST.read;
  ST.read = function (fx) {
    const R = read0.apply(this, arguments);
    try {
      if (!R || (!R.up.length && !R.down.length && !R.touch.length)) return R;
      const pc = A.pc && A.pc();
      if (!faithless(pc)) return R;
      const no = x => x.k !== 'piety';
      if (R.up.every(no) && R.down.every(no) && R.touch.every(no)) return R;
      return Object.assign({}, R, { up: R.up.filter(no), down: R.down.filter(no), touch: R.touch.filter(no) });
    } catch (e) { return R; }
  };
})();
