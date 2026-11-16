// An activity the Life tab offers is one the game will let you do (CI run 91, 81-pacing's pcLives).
//
// The release's A.canAct says yes to "Lend money" at any purse, and A.doActivity then refuses it under 50 suns: the
// stake is 40% of your coin, at most 2,000, and under 20 it answers "You need coin to lend coin." and does nothing.
// The button stood lit, and a player (or the bench bot, which takes the first activity A.canAct allows) spent the
// month on a refusal. In the bot's greedy lives to 30 that was 164 and 204 wasted months with 81's winter initiative
// on, against 3 and 47 with it off, so the extra free days never became actions (4.8 a year either way).
// Now A.canAct gives the same refusal first, with the same words, and the next activity can be taken. Pure; no dice.
(function () {
  const can = A.canAct;
  A.canAct = function (key) {
    const r = can.apply(this, arguments);
    if (!r || !r[0] || key !== 'moneylend') return r;
    const pc = A.pc();
    if (pc && Math.round(Math.min((pc.coin || 0) * 0.4, 2000)) < 20) return [false, 'You need coin to lend coin.'];
    return r;
  };
})();
