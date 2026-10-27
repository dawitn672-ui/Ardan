// Target numbers per path (Road to Ten, Balance 1). bench/balance.mjs plays each path with fixed seeds (12 lives each by
// default, engaged and passive, four personalities) and fails the build when a number leaves its band (Balance 3).
//
// Bands are design intent, wide enough for the sample. With 4 lives a path, builds that only changed which random
// numbers were drawn moved the serf's median peak wealth between 11,000 and 153,000 and the merchant's median age at
// death between 29 and 67, so a feature that drew one more number could fail the check without anything being wrong.
// The league now plays 8 lives a path. Four builds that differ only in their random stream (the full build, and the
// build without 37-squad, without 38-orders, and with 39-schemes) all sit inside every band, but the spread is still
// wide: serf median peak wealth 4,500-107,000 (freed serfs get rich, bound ones don't, and the middle of 8 falls on
// either side), royal median age at death 37-73, noble median peak wealth 57,000-461,000. So the bands catch a
// collapse, not a shift.
// Round 5 raised the league from 8 to 12 lives a path: 8 peasant lives once gave a median death age of 26 (five died
// young of falls, kicks and fever) where 24 lives give about 66, so the middle of 8 fell on either side of the band. A note marks where the game sits somewhere the designers may not want; those bands hold the
// current behaviour so that it cannot get worse unnoticed, not to bless it.
export const TARGETS = {
  paths: {
    serf: {
      start: { race: 'human', realm: 'POL-05', status: 'serf', startAge: 16 },
      bands: { medianDeathAge: [20, 85], medianPeakCoin: [100, 150000], medianPeakFame: [0, 80], notableSharePct: [25, 100], freedSharePct: [25, 100] },
      note: 'Before 33-choices every serf was free by 33, most by buying freedom at 21-22 for 40 suns (two years of a serf\'s savings), because the event that sold it had no way to say no. With "Not this year" half stay bound, and their peak wealth fell from about 30,000 to about 1,600; the bands were widened for that (the first drift this check caught). 15 other events free you too.',
    },
    peasant: {
      start: { race: 'human', realm: 'POL-01', status: 'peasant', startAge: 16 },
      bands: { medianDeathAge: [30, 85], medianPeakCoin: [5000, 400000], medianPeakFame: [8, 100], notableSharePct: [50, 100] },
      note: 'A peasant\'s peak wealth (about 220,000 suns) is close to a merchant\'s (about 290,000): worth auditing for a money path. Median peak fame ran 10, 16, 45, 45 and 47 across five builds that differ only in their random stream (most peasants who die young die before anyone has heard of them), so its floor was lowered from 15 to 8.',
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
      note: 'The noisiest path: a royal younger child often dies young (a fight, a hanging, a fever, a wound gone bad), and the 8-life median falls on either side of that. Across five builds that differ only in their random stream, median peak wealth ran 12,000-139,000 and median peak fame 12-63, so the floors were lowered from 20,000 and 30 to 8,000 and 8.',
      bands: { medianDeathAge: [30, 85], medianPeakCoin: [8000, 700000], medianPeakFame: [8, 100], notableSharePct: [60, 100] },
    },
  },
  global: {
    // the scorecard's target is 45-65%; the band holds today's 36% from falling further
    checkWinRate: [30, 70],
    arcTypes: [6, 99],
    pageErrors: [0, 0],
  },
};

// The Great Continent league (bench/balance.mjs --lands=great): every path born twice in a Great Continent game
// (A.newGame({ lands: 'great' })), once in the Known World as above and once in the Far Lands (name@far), so the far
// realms are held to the same design as the old ones. A Great Continent year costs about four times a Known World one
// (2,033 provinces, 153 realms, every one simulated in full), so this league plays 6 lives a group for at most 25 years
// (to age 41 to 43): 66 lives, about 25 minutes on CI's four workers.
// The death-age median is therefore capped near 41, and the bands are those of the Known World's league, widened where
// 6 lives and 25 years cannot reach them (each widening says why). With most lives still going at the end, the
// league counts a living life at the age it reached (bench/balance.mjs), so the death-age median reads about 42 unless
// half the group dies young: the band is a floor of 30, a collapse check.
// Measured Oct 27 (the full build of round 10, 60 lives): every group inside its bands. Known World births on the Great
// Continent against far births, median peak coin: peasant 9,372 / 18,940, artisan 18,037 / 27,627, merchant 187,113 /
// 149,035, noble 74,529 / 123,088, royal 45,191 / 6,851; check win rate 46%. Two differences are worth a designer's
// look: a royal of the Birch March (a small kingdom) peaks at a seventh of a Known World royal's wealth, and 31% of far
// lives end as outlaws against 10% of Known World ones (outlawSharePct in the report). The far starts spread over the lands: a peasant of Taulen (the Twin Rivers), an artisan of Ozand
// (the Sand Basins), a merchant of the Tide Families (the Twin Rivers' coast), a noble of Vahra (the Southern
// Peninsulas), a royal of the Birch March (the Long Grass).
const far = (realm, base) => Object.assign({}, base, { realm });
export const GREAT = {
  lives: 6,
  years: 25,
  paths: {
    serf: { start: KNOWN_START('serf'), bands: { medianDeathAge: [20, 60], medianPeakCoin: [100, 150000], medianPeakFame: [0, 80], notableSharePct: [15, 100], freedSharePct: [15, 100] },
      note: 'Death age capped by the 25 years played. Notable and freed shares floored at 15% (25% for the Known World league): over 25 years a serf has had less time to be freed or to make a name.' },
    'serf@far': { start: far('POL-91', KNOWN_START('serf')), bands: { medianDeathAge: [20, 60], medianPeakCoin: [100, 150000], medianPeakFame: [0, 80], notableSharePct: [15, 100], freedSharePct: [15, 100] },
      note: 'Born in Vahra (POL-91), where debt bondage makes serfs: 99-far-lands adds 7 serf and 13 slave realms to GD.UNFREE from the lore. Taulen keeps corvée, not bondage.' },
    peasant: { start: KNOWN_START('peasant'), bands: { medianDeathAge: [30, 60], medianPeakCoin: [2000, 400000], medianPeakFame: [5, 100], notableSharePct: [35, 100] },
      note: 'Wealth and fame floors lowered (5,000 to 2,000, 8 to 5, notable 50% to 35%): the Known World league reaches its peaks over up to 70 years, this one over 25.' },
    'peasant@far': { start: far('POL-36', KNOWN_START('peasant')), bands: { medianDeathAge: [30, 60], medianPeakCoin: [2000, 400000], medianPeakFame: [5, 100], notableSharePct: [35, 100] } },
    artisan: { start: KNOWN_START('artisan'), bands: { medianDeathAge: [30, 60], medianPeakCoin: [2000, 300000], medianPeakFame: [3, 80], notableSharePct: [30, 100] },
      note: 'Floors lowered for the 25 years, as the peasant\'s.' },
    'artisan@far': { start: far('POL-70', KNOWN_START('artisan')), bands: { medianDeathAge: [30, 60], medianPeakCoin: [2000, 300000], medianPeakFame: [3, 80], notableSharePct: [30, 100] } },
    merchant: { start: KNOWN_START('merchant'), bands: { medianDeathAge: [30, 60], medianPeakCoin: [20000, 900000], medianPeakFame: [10, 100], notableSharePct: [30, 100] },
      note: 'Floors lowered for the 25 years, as the peasant\'s.' },
    'merchant@far': { start: far('POL-43', KNOWN_START('merchant')), bands: { medianDeathAge: [30, 60], medianPeakCoin: [20000, 900000], medianPeakFame: [10, 100], notableSharePct: [30, 100] } },
    noble: { start: KNOWN_START('noble'), bands: { medianDeathAge: [30, 60], medianPeakCoin: [15000, 700000], medianPeakFame: [25, 100], notableSharePct: [40, 100] },
      note: 'Floors lowered for the 25 years, as the peasant\'s.' },
    'noble@far': { start: far('POL-91', KNOWN_START('noble')), bands: { medianDeathAge: [30, 60], medianPeakCoin: [15000, 700000], medianPeakFame: [25, 100], notableSharePct: [40, 100] } },
    royal: { start: KNOWN_START('royal'), bands: { medianDeathAge: [25, 60], medianPeakCoin: [5000, 700000], medianPeakFame: [5, 100], notableSharePct: [40, 100] },
      note: 'The noisiest path of the Known World league, with 6 lives instead of 12: floors lowered again.' },
    'royal@far': { start: far('POL-63', KNOWN_START('royal')), bands: { medianDeathAge: [25, 60], medianPeakCoin: [5000, 700000], medianPeakFame: [5, 100], notableSharePct: [40, 100] } },
  },
  global: { checkWinRate: [30, 70], arcTypes: [5, 99], pageErrors: [0, 0] },
};
function KNOWN_START(k) { return Object.assign({}, TARGETS.paths[k].start); }
