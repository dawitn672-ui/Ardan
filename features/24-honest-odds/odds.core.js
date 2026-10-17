// Honest duel odds: what the screen shows is what the duel engine does.
// p(a beats b) = 1 / (1 + e^-(d / scale(m) + seat)), d = fightWorth(a) - fightWorth(b), a in the player's seat, m the two
// fighters' mean worth. scale(m) = scale + slope * (m - mid) / 100, never below 3: a gap of 10 worth decides more between
// two brawlers (worth 50, scale 5.2) than between two masters (worth 110, scale 7.3), because a master's last points of
// worth are mostly skill and speed, which the duel engine values less than the body a lower tier gains.
// Refit (round 7) by maximum likelihood on 14,400 lethal duels, the bench's own setting (bench/run.mjs "duels": a fresh pair
// of A.makeFoe fighters of tiers 1-6 for every duel, worth gap 0-2 tiers, both seats, the player's seat auto-played by
// A.duelAuto) over 16 worlds (seeds 77-92), checked on 16 more (200-215): scale 5.85, slope 3.5, seat -0.22. The player's
// seat is about 5.5 points weaker in an even fight (the first fit, on 2,100 duels, had 6.1 and -0.14; by today's duel
// rules that overstated the player's seat by 1.5-2.6 points in every bench cell).
// Re-fit with: node bench/run.mjs <html> --only=duels (maxShownVsActualErrorPct) after changing duel rules, pooling seeds
// (one seed's 150 duels per cell carry a standard error of 4 points in the even cells).
A.DUEL_ODDS = { scale: 5.85, slope: 3.5, mid: 70, seat: -0.22 };
A.duelScale = function (wa, wb) {
  const O = A.DUEL_ODDS, m = ((+wa || 0) + (+wb || 0)) / 2;
  return Math.max(3, O.scale + (O.slope || 0) * (m - (O.mid || 70)) / 100);
};
A.shownDuelOdds = function (a, b) {
  if (!a || !b) return 50;
  const wa = A.fightWorth(a), wb = A.fightWorth(b);
  return 100 / (1 + Math.exp(-((wa - wb) / A.duelScale(wa, wb) + A.DUEL_ODDS.seat)));
};
