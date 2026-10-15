// Target numbers per path (Road to Ten, Balance 1). bench/balance.mjs plays each path with fixed seeds (4 lives each by
// default, engaged and passive, four personalities) and fails the build when a number leaves its band (Balance 3).
//
// Bands are design intent, wide enough for a 4-life sample. Builds that only change which random numbers are drawn
// moved the serf path's median age at death between 26 and 54 (three of four serfs once died at 22-26, of a roc, a fever
// and a wound gone bad), so age bands only catch a collapse, not a shift of a few years. A note marks where the game sits somewhere the designers may not want; those bands
// hold the current behaviour so that it cannot get worse unnoticed, not to bless it.
export const TARGETS = {
  paths: {
    serf: {
      start: { race: 'human', realm: 'POL-05', status: 'serf', startAge: 16 },
      bands: { medianDeathAge: [20, 85], medianPeakCoin: [100, 150000], medianPeakFame: [0, 80], notableSharePct: [25, 100], freedSharePct: [25, 100] },
      note: 'Before 33-choices every serf was free by 33, most by buying freedom at 21-22 for 40 suns (two years of a serf\'s savings), because the event that sold it had no way to say no. With "Not this year" half stay bound, and their peak wealth fell from about 30,000 to about 1,600; the bands were widened for that (the first drift this check caught). 15 other events free you too.',
    },
    peasant: {
      start: { race: 'human', realm: 'POL-01', status: 'peasant', startAge: 16 },
      bands: { medianDeathAge: [30, 85], medianPeakCoin: [5000, 400000], medianPeakFame: [15, 100], notableSharePct: [50, 100] },
      note: 'A peasant\'s peak wealth (about 220,000 suns) is close to a merchant\'s (about 290,000): worth auditing for a money path.',
    },
    artisan: {
      start: { race: 'human', realm: 'POL-03', status: 'artisan', startAge: 16 },
      bands: { medianDeathAge: [30, 85], medianPeakCoin: [5000, 300000], medianPeakFame: [5, 80], notableSharePct: [40, 100] },
      note: 'The median age at death read 42 in one run and 61 in another: the noisiest path.',
    },
    merchant: {
      start: { race: 'human', realm: 'POL-04', status: 'merchant', startAge: 18 },
      bands: { medianDeathAge: [30, 85], medianPeakCoin: [50000, 900000], medianPeakFame: [20, 100], notableSharePct: [40, 100] },
    },
    noble: {
      start: { race: 'human', realm: 'POL-01', status: 'noble', startAge: 16 },
      bands: { medianDeathAge: [30, 85], medianPeakCoin: [30000, 700000], medianPeakFame: [40, 100], notableSharePct: [60, 100] },
    },
    royal: {
      start: { race: 'human', realm: 'POL-02', status: 'royal', startAge: 16 },
      bands: { medianDeathAge: [30, 85], medianPeakCoin: [20000, 700000], medianPeakFame: [30, 100], notableSharePct: [60, 100] },
    },
  },
  global: {
    // the scorecard's target is 45-65%; the band holds today's 36% from falling further
    checkWinRate: [30, 70],
    arcTypes: [6, 99],
    pageErrors: [0, 0],
  },
};
