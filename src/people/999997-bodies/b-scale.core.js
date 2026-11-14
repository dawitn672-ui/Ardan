// C9 "Bodies that make sense" (D-040), part 2: a stat's word is its place among the whole grown population of one's own
// people, measured, not a fixed number.
//
// The owner: "why is someone who is clearly trained and can lift twice their body weight rated so low. If this man is
// poor at speed and endurance then what is a child." The old words compared a stat with a fixed share of a typical one
// (statWord: under 0.55 "poor") and the sheet with fixed real units (lift against 130 kg cubed by SPREAD, sprint ranked
// by (m/s / 7.2)^3), so the same man read "fair" on one page and "below most grown men" on the next.
//
// The scale. r = A.stat / (the people's mean potential x 0.78), the stat against an untrained grown person of the same
// people (1 is the middle). VS.STAT_CENTILES holds r at 19 centiles (and the greatest seen) for every grown person (old
// age included) at the start of eight worlds, seeds 11 to 88, 6,064 people of every people, estate and age, before the
// skill floor (a-floor), so it is the population as born and grown, not the court that the world's people list holds
// (src/people/999997-bodies/measure.mjs prints it again). A stat reads by its centile:
//
//   under 2 | 2-10 | 10-30 | 30-70 (average) | 70-90 | 90-98 | 98-99.9 | beyond 99.9: off the chart
//
// so four people in ten are average, one in fifty is at either extreme, and one in a thousand off the chart. A child is
// held to a body of its own age (the people's untrained body grown to that age) and says so: "strong for a child of nine"; a youth (past coming of age, not yet grown) "for a youth of eighteen".
// A person of another people is also read against men (humans are the yardstick the world uses), and beyond the 2nd or
// the 98th centile of men that is off the chart: a giant's strength, and a giant's speed at the other end.
// Rendering only: pure, reads A.stat, draws nothing.
(function () {
  const VS = A.V2S = A.V2S || {}, BD = A.BODIES = A.BODIES || {};
  VS.CENTILE_AT = [0.1, 0.5, 1, 2, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 98, 99, 99.5, 99.9];
  VS.STAT_CENTILES = {
    str: [0.23, 0.329, 0.392, 0.445, 0.549, 0.672, 0.794, 0.885, 0.946, 1.019, 1.099, 1.16, 1.252, 1.404, 1.518, 1.679, 1.801, 1.923, 2.167, 2.503],
    spd: [0.179, 0.305, 0.336, 0.397, 0.519, 0.626, 0.763, 0.855, 0.923, 1.007, 1.068, 1.16, 1.252, 1.389, 1.496, 1.648, 1.77, 1.832, 2.076, 2.198],
    ins: [0.244, 0.366, 0.437, 0.519, 0.641, 0.733, 0.855, 0.946, 1.038, 1.099, 1.183, 1.252, 1.343, 1.496, 1.618, 1.74, 1.832, 1.908, 2.076, 2.302],
    sta: [0.204, 0.305, 0.379, 0.458, 0.549, 0.672, 0.794, 0.885, 0.946, 1.038, 1.099, 1.19, 1.282, 1.404, 1.557, 1.709, 1.923, 2.259, 2.93, 3.886],
    int: [0.321, 0.427, 0.488, 0.549, 0.672, 0.763, 0.885, 0.977, 1.068, 1.129, 1.221, 1.313, 1.391, 1.526, 1.648, 1.77, 1.832, 1.952, 2.076, 2.259],
    wil: [0.305, 0.427, 0.488, 0.58, 0.672, 0.794, 0.916, 1.007, 1.083, 1.16, 1.252, 1.313, 1.435, 1.557, 1.679, 1.816, 1.893, 1.966, 2.198, 2.381],
  };
  VS.BAND_EDGES = [2, 10, 30, 70, 90, 98, 99.9];   // centiles where each word ends
  VS.BAND_WORDS = {
    str: ['feeble', 'weak', 'slight', 'average', 'strong', 'very strong', 'mighty', 'off the chart'],
    spd: ['sluggish', 'slow', 'a little slow', 'average', 'quick', 'very quick', 'swift', 'off the chart'],
    ins: ['dull', 'slow to react', 'a little slow', 'average', 'sharp', 'very sharp', 'lightning-quick', 'off the chart'],
    sta: ['frail', 'soon spent', 'tires early', 'average', 'hardy', 'very hardy', 'tireless', 'off the chart'],
    int: ['simple', 'dull-witted', 'a little slow', 'average', 'bright', 'clever', 'brilliant', 'off the chart'],
    wil: ['weak-willed', 'yielding', 'unsteady', 'average', 'determined', 'resolute', 'iron-willed', 'off the chart'],
  };
  VS.BAND_COUNT = 8;
  VS.BODY_STATS = ['str', 'spd', 'ins', 'sta'];   // read against men too (a mind is not measured across peoples)
  VS.COMP = { str: ['weaker', 'stronger'], spd: ['slower', 'faster'], ins: ['slower', 'quicker'], sta: ['frailer', 'hardier'], int: ['duller', 'sharper'], wil: ['softer', 'firmer'] };
  const mean = (race, s) => 42 + (((GD.RACES[race] || GD.RACES.human).mods || {})[s] || 0);
  // the centile of r on stat s's table, interpolated (0..100)
  VS.centileOf = function (s, r) {
    const T = VS.STAT_CENTILES[s] || VS.STAT_CENTILES.str, P = VS.CENTILE_AT;
    if (!(r > T[0])) return r >= T[0] ? P[0] : P[0] * Math.max(0, r) / T[0];
    for (let i = 1; i < P.length; i++) if (r <= T[i]) return P[i - 1] + (P[i] - P[i - 1]) * (r - T[i - 1]) / Math.max(1e-9, T[i] - T[i - 1]);
    return r <= T[P.length] ? 99.9 + 0.09 * (r - T[P.length - 1]) / Math.max(1e-9, T[P.length] - T[P.length - 1]) : 100;
  };
  VS.bandOfCentile = c => { let b = 0; while (b < VS.BAND_EDGES.length && c >= VS.BAND_EDGES[b]) b++; return b; };
  // an untrained body of this people at this age, on the old scale (the yardstick); a child's grows with the child: the
  // v2 curve the player grows by, or the release's own (A.growTo) the world's children were made by, whichever is more
  VS.typicalStat = function (p, s, age) {
    const R = GD.RACES[p.race] || GD.RACES.human, m = mean(p.race, s);
    if (age >= (R.grown || 20)) return m * 0.78;
    const k = Math.max(0, Math.min(1, age / (R.grown || 20)));
    return m * Math.max(0.78 * (BD.grow ? BD.grow(p, age) : k), 0.08 + 0.62 * Math.pow(k, 1.1));
  };
  // an age in words (no digits beside a stat word: v2sNumbers and v2sNoBareNumbers hold the page to that)
  const ONES = ['nought', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  VS.numWord = n => { n = Math.max(0, Math.round(+n || 0)); if (n < 20) return ONES[n]; if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : ''); return String(n); };
  // "a child of nine" below the people's coming of age, "a youth of eighteen" until grown
  VS.youngOf = function (p, age) { const R = GD.RACES[p.race] || GD.RACES.human; return `${age < (R.adult || 16) ? 'a child' : 'a youth'} of ${VS.numWord(age)}`; };
  const oneIn = c => { const n = 100 / Math.max(0.01, c); return n >= 700 ? 'a thousand' : n >= 70 ? 'a hundred' : n >= 35 ? 'fifty' : n >= 15 ? 'twenty' : n >= 7 ? 'ten' : 'five'; };
  // where v stands: { band, word, centile, child, note, men }
  VS.statBand = function (p, s, v) {
    if (!p || !GD.STATS.includes(s)) return null;
    const age = A.age(p), R = GD.RACES[p.race] || GD.RACES.human;
    if (v == null) v = A.stat(p, s);
    if (age < 4) return { band: -1, word: 'too young to tell', centile: null, child: true, note: 'Too young to tell yet.', men: '' };
    const r = (+v || 0) / Math.max(0.5, VS.typicalStat(p, s, age)), c = VS.centileOf(s, r), band = VS.bandOfCentile(c);
    const child = age < (R.grown || 20);
    const W = VS.BAND_WORDS[s], C = VS.COMP[s];
    const yo = child ? VS.youngOf(p, age) : '', grp = child ? `${yo.startsWith('a child') ? 'children' : 'youths'} of ${VS.numWord(age)} among your people` : 'of your people';
    const where = band === 7 ? `beyond all but one in a thousand ${grp}` : c >= 90 ? `${C[1]} than all but one in ${oneIn(100 - c)} ${grp}`
      : c >= 70 ? `${C[1]} than most ${grp}` : c >= 30 ? `like most ${grp}` : c >= 10 ? `${C[0]} than most ${grp}` : `${C[0]} than all but one in ${oneIn(c)} ${grp}`;
    let word = W[band];
    if (child) word = band === 7 ? `off the chart for ${yo}` : `${word} for ${yo}`;
    // another people against men: the same table, the stat against an untrained grown man
    let men = '';
    if (!child && p.race !== 'human' && GD.RACES.human && VS.BODY_STATS.includes(s)) {
      const cm = VS.centileOf(s, (+v || 0) / (mean('human', s) * 0.78));
      if (cm >= 98) men = `Against men: off the chart, ${C[1]} than nearly any man.`;
      else if (cm < 2) men = `Against men: off the chart at the other end, ${C[0]} than nearly any man.`;
      else { const bm = VS.bandOfCentile(cm); if (bm !== band) men = `Against men: ${W[bm]}.`; }
    }
    return { band, word, centile: c, child, men, note: `${where[0].toUpperCase()}${where.slice(1)}.` };
  };
  VS.statWord = function (p, s, v) { const b = VS.statBand(p, s, v); return b ? b.word : ''; };
  // the line a click opens on a stat: what the word is measured against
  VS.scaleNote = function (p, s) {
    const b = VS.statBand(p, s);
    if (!b || b.band < 0) return 'Too young to tell yet.';
    const yard = b.child ? 'Read against children of the same age among your people' : 'Read against every grown man and woman of your people, young and old';
    return `${b.note} ${yard}: four in ten are average, one in fifty is at either end, one in a thousand off the chart.${b.men ? ' ' + b.men : ''}`;
  };
})();
