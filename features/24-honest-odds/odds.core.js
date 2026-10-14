// Honest duel odds: what the screen shows is what the duel engine does.
// Calibrated by maximum likelihood on 2,100 lethal duels (3 worlds, fighters of tiers 1-6, the player's seat auto-played
// by A.duelAuto, the same setting bench/run.mjs "duels" uses): p(a beats b) = 1 / (1 + e^-(d/scale + seat)),
// d = fightWorth(a) - fightWorth(b), a in the player's seat. Fit with a fresh pair of fighters per duel: scale 6.1, seat -0.14 (the player's seat is about 3.5 points weaker in an even fight).
// The release showed 1 / (1 + e^-(d/12)), which understated a stronger fighter's real odds by up to 15 points.
// Re-fit with: node bench/run.mjs <html> --only=duels (maxShownVsActualErrorPct) after changing duel rules.
A.DUEL_ODDS = { scale: 6.1, seat: -0.14 };
A.shownDuelOdds = function (a, b) {
  if (!a || !b) return 50;
  const d = A.fightWorth(a) - A.fightWorth(b);
  return 100 / (1 + Math.exp(-(d / A.DUEL_ODDS.scale + A.DUEL_ODDS.seat)));
};
