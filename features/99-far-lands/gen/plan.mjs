// The macro plan of the far lands, drawn by hand in km (x east from the Known World's west edge, y south from its
// north edge; the Known World is the box 0-7,000 x 0-4,500 and is never touched). The generator perturbs these
// shapes with noise, so they are the bones, not the coastline: docs/research/world-foundations.md, section 1.3, is the
// brief (the ten Far Lands, their sizes and biomes), and rules G1-G6 decide what goes where.
//
// Coasts are closed curves of control points (smoothed by a spline). Ranges are polylines with a crest height (m)
// and a half-width (km). Plateaus and basins raise or lower the ground inside a curve. Lakes are water. Lands name
// the ten Far Lands by the control point nearest to each province.

export const FRAME = { W: 17000, H: 8900 };

// ---- land
export const LANDS_POLY = {
  // the Great Continent: the Known World's Eastland carried east to the far coast (the seam at x 7,000 runs from
  // y 300 to y 2,900; the curve starts and ends there)
  great: [
    [7000, 300], [7350, 270], [7600, 110], [7820, 90], [7980, 260], [8250, 420], [8480, 560], [8600, 900], [8820, 1020],
    [9050, 900], [9180, 560], [9420, 400], [9650, 330], [9800, 90], [9960, 120], [10050, 420], [10180, 820], [10300, 1000],
    [10420, 780], [10520, 380], [10800, 260], [11050, 70], [11400, 50], [11750, 90], [11950, 330], [12350, 470],
    [12800, 600], [13050, 500], [13300, 330], [13600, 360], [13900, 560], [14250, 430], [14700, 250], [15150, 140],
    [15500, 160], [15950, 330], [16380, 470], [16330, 760],
    [16480, 1060], [16260, 1420], [16020, 1180], [15820, 900], [15480, 870], [15200, 1010], [15080, 1260],
    [15240, 1520], [15120, 1760], [15320, 1890], [15620, 1990], [15820, 2290], [15720, 2690], [15470, 2660],
    [15260, 2300], [15130, 2020], [14790, 1960], [14440, 2060], [14330, 2250], [14560, 2340], [14800, 2440],
    [14530, 2610], [14620, 2900], [14460, 3200], [14210, 3500], [13820, 3790], [13400, 3940], [13110, 4010],
    [13010, 4300], [13320, 4620], [13260, 4960], [12920, 5160], [12720, 4910], [12560, 4860], [12460, 5110],
    [12620, 5500], [12760, 5900], [12560, 5860], [12350, 5420], [12160, 4920], [12000, 4520], [11720, 4320],
    [11420, 4520], [11120, 4220], [10900, 3960], [10500, 3870], [10220, 3960], [10010, 4220], [9720, 4620],
    [9420, 5000], [9160, 5260], [8900, 5000], [8660, 4620], [8420, 4120], [8230, 3820], [7920, 3860],
    [7700, 3600], [7480, 3300], [7260, 3050], [7000, 2900],
  ],
  // the Deep Southland: the Southland carried south past the equator (its seam at y 4,500 runs from x 490 to 5,530)
  deepSouth: [
    [490, 4500], [560, 4800], [800, 5100], [1150, 5420], [1500, 5850], [1900, 6300], [2400, 6700], [2850, 6930],
    [3250, 6820], [3650, 6480], [4050, 6020], [4400, 5520], [4750, 5080], [5150, 4760], [5530, 4500],
  ],
  // islands, each a closed curve
  sunriseN: [[16430, 1610], [16790, 1690], [16760, 1990], [16470, 2060], [16340, 1810]],
  sunriseMain: [[16690, 2110], [16880, 2340], [16640, 2700], [16330, 2950], [15960, 3110], [15850, 2960], [16210, 2760], [16460, 2460], [16560, 2210]],
  sunriseS: [[15820, 3000], [15960, 3240], [15700, 3310], [15600, 3110]],
  tidewater: [[14560, 3560], [14700, 3760], [14600, 3960], [14450, 3760]],           // the Taiwan of the far coast
  greenIsle: [[13430, 4060], [13610, 4100], [13560, 4260], [13400, 4210]],
  tearIsle: [[9330, 5350], [9550, 5400], [9500, 5660], [9300, 5600]],               // below the subcontinent's tip
  longIsle: [[11720, 5160], [12120, 5420], [12560, 5980], [12920, 6360], [12760, 6510], [12300, 6170], [11900, 5760], [11560, 5360]],
  jadeIsle: [[12920, 6500], [13700, 6590], [14400, 6740], [14350, 6860], [13600, 6810], [12960, 6660]],
  greatIsle: [[13150, 5420], [13450, 5150], [13750, 4980], [14050, 5040], [14250, 5250], [14180, 5500], [14360, 5760], [14200, 6000], [13950, 6200], [13650, 6290], [13350, 6240], [13150, 6040], [13260, 5800], [13040, 5640]],
  spiderIsle: [[14610, 5610], [14910, 5510], [15110, 5660], [14910, 5900], [15010, 6300], [14760, 6210], [14660, 5900]],
  northCape: [[14910, 4010], [15210, 4110], [15210, 4610], [14960, 4520], [14860, 4210]],
  southCape: [[15110, 5010], [15510, 5060], [15460, 5410], [15160, 5360]],
  birdIsle: [[15610, 6110], [16300, 6010], [16950, 6310], [16950, 6900], [16500, 7010], [15900, 6720], [15510, 6460]],
  ironIsle: [[9310, 90], [9610, 70], [9910, 210], [9720, 260], [9460, 170]],         // the arctic isles
  frostIsle: [[12000, 60], [12450, 70], [12550, 170], [12150, 210]],
  newIsles: [[14000, 120], [14350, 100], [14420, 220], [14100, 250]],
  emberIsle: [[4560, 6050], [4810, 6100], [4860, 6660], [4560, 6760], [4450, 6340]], // off the Deep Southland
};

// chains of small islands: points along a curve, a blob every so many km
export const CHAINS = [
  { pts: [[16480, 1450], [16620, 1580]], step: 70, r: [14, 26] },                              // between the cape and the north isle
  { pts: [[16260, 1420], [16450, 1560]], step: 60, r: [10, 18] },
  { pts: [[11900, 4700], [11980, 5050]], step: 70, r: [12, 22] },                              // the Andaman analogue
  { pts: [[14420, 6930], [14800, 6980], [15200, 6950], [15550, 6900]], step: 90, r: [18, 36] }, // the lesser chain
  { pts: [[15250, 5700], [15400, 5950], [15450, 6250]], step: 80, r: [16, 30] },               // the spice isles
  { pts: [[14700, 4700], [14850, 4850], [15000, 4950]], step: 70, r: [16, 30] },
  { pts: [[15600, 3350], [15350, 3500], [15000, 3600]], step: 85, r: [10, 20] },               // a southern arc
  { pts: [[10400, 6400], [10600, 6600], [10750, 6900]], step: 110, r: [10, 22] },              // far out in the open sea
  { pts: [[6100, 5000], [6250, 5250], [6350, 5550]], step: 100, r: [10, 20] },
];

// ---- water inside the land
export const LAKES = [
  { name: 'sky', pts: [[11850, 820], [12000, 860], [12250, 1150], [12300, 1270], [12200, 1260], [11950, 980]] },   // the deep lake (Baikal)
  { name: 'reed', pts: [[8380, 1440], [8700, 1430], [8900, 1480], [8880, 1540], [8600, 1540], [8400, 1510]] },     // the steppe lake (Balkhash)
  { name: 'salt', pts: [[9930, 2060], [10060, 2040], [10110, 2120], [9980, 2150]] },                                // the salt marsh of the basin (Lop)
  { name: 'great', pts: [[3700, 5500], [3880, 5480], [3930, 5620], [3820, 5730], [3690, 5690], [3650, 5590]] },     // the great lake of the south
  { name: 'rift', pts: [[3440, 5850], [3500, 5830], [3540, 6230], [3480, 6290], [3430, 6130]] },
  { name: 'lowland', pts: [[13450, 2950], [13650, 2920], [13700, 3020], [13500, 3060]] },                           // the river lake of the south basin
];
// sinks: a river that ends here does not reach the sea (the basin's salt marsh, the steppe lake)
export const SINKS = ['salt', 'reed'];

// ---- relief. h in m, w (half-width) in km
export const RANGES = [
  { id: 'wall', name: 'the Great Wall of the World', h: 6600, w: 170, pts: [[7300, 2900], [7900, 3150], [8600, 3330], [9500, 3420], [10300, 3480], [11000, 3420], [11550, 3250], [11800, 3020]] },
  { id: 'kunlun', name: 'the Jade Rim', h: 5200, w: 130, pts: [[7500, 2350], [8200, 2470], [9000, 2560], [9800, 2570], [10600, 2520], [11300, 2560]] },
  { id: 'tian', name: 'the Heavenward Range', h: 4800, w: 120, pts: [[7250, 1980], [7800, 1860], [8400, 1760], [9100, 1720], [9800, 1740], [10500, 1840]] },
  { id: 'pamir', name: 'the Knot', h: 5600, w: 140, pts: [[7000, 2280], [7250, 2150], [7400, 2350], [7350, 2650], [7300, 2900]] },
  { id: 'altai', name: 'the Golden Hills', h: 3600, w: 120, pts: [[9900, 1380], [10500, 1240], [11100, 1120], [11700, 980]] },
  { id: 'sayan', name: 'the Shield Range', h: 2800, w: 110, pts: [[11000, 900], [11500, 800], [12000, 720], [12500, 760]] },
  { id: 'khingan', name: 'the Long Ridge', h: 1900, w: 110, pts: [[13050, 820], [13250, 1250], [13200, 1700], [13000, 2050]] },
  { id: 'verkh', name: 'the Cold Teeth', h: 2300, w: 120, pts: [[13600, 450], [14200, 620], [14800, 760], [15300, 900]] },
  { id: 'kamch', name: 'the Fire Cape', h: 3000, w: 70, pts: [[16300, 650], [16350, 950], [16250, 1300]] },
  { id: 'ural', name: 'the Worn Range', h: 1500, w: 90, pts: [[8150, 300], [8250, 650], [8200, 1000], [8300, 1300]] },
  { id: 'qinling', name: 'the Divide', h: 2800, w: 90, pts: [[11700, 2700], [12200, 2680], [12800, 2660], [13200, 2700]] },
  { id: 'taihang', name: 'the Loess Wall', h: 1800, w: 80, pts: [[12900, 1900], [13050, 2200], [13100, 2500]] },
  { id: 'nanling', name: 'the South Hills', h: 1700, w: 100, pts: [[12000, 3550], [12700, 3600], [13400, 3650]] },
  { id: 'arakan', name: 'the Comb', h: 2600, w: 80, pts: [[11500, 3400], [11450, 3800], [11350, 4250]] },
  { id: 'annam', name: 'the Spine of the South', h: 2400, w: 80, pts: [[12400, 3500], [12700, 3900], [12950, 4350], [12900, 4800]] },
  { id: 'shan', name: 'the Hill Fans', h: 2200, w: 100, pts: [[11800, 3450], [11900, 3900], [12000, 4400]] },
  { id: 'ghats', name: 'the Western Steps', h: 1500, w: 70, pts: [[8250, 3900], [8500, 4300], [8750, 4800], [8950, 5100]] },
  { id: 'vindhya', name: 'the Middle Hills', h: 1100, w: 90, pts: [[8300, 3900], [8900, 3980], [9500, 4050]] },
  { id: 'sunrise', name: 'the Burning Backbone', h: 3000, w: 55, pts: [[16500, 1700], [16650, 2000], [16700, 2300], [16450, 2600], [16050, 3000]] },
  { id: 'longisle', name: 'the Smoke Mountains', h: 3200, w: 55, pts: [[11650, 5250], [12100, 5650], [12600, 6100], [12850, 6400]] },
  { id: 'jade', name: 'the Lantern Peaks', h: 3000, w: 45, pts: [[13000, 6600], [13700, 6680], [14300, 6790]] },
  { id: 'greatisle', name: 'the Heart Hills', h: 2400, w: 90, pts: [[13300, 5450], [13700, 5700], [13900, 6000]] },
  { id: 'bird', name: 'the Cloud Wall', h: 4200, w: 80, pts: [[15700, 6400], [16200, 6350], [16850, 6550]] },
  { id: 'rift', name: 'the Rift Shoulders', h: 2900, w: 110, pts: [[4100, 4800], [4250, 5300], [4150, 5800], [3850, 6250], [3450, 6550]] },
  { id: 'southcape', name: 'the Dragon Steps', h: 2000, w: 80, pts: [[2450, 6600], [2850, 6750], [3250, 6600]] },
  { id: 'westsouth', name: 'the Iron Plateau Edge', h: 1300, w: 110, pts: [[1300, 5400], [1650, 5800], [2000, 6200]] },
];

// ground raised (or lowered) inside a curve, with a soft edge of `edge` km
export const PLATEAUS = [
  { id: 'roof', name: 'the High Steppes', h: 4300, edge: 220, pts: [[7450, 2550], [8300, 2620], [9300, 2700], [10300, 2700], [11100, 2780], [11400, 3000], [11000, 3250], [10000, 3280], [9000, 3200], [8100, 3050], [7550, 2850]] },
  { id: 'basin', name: 'the Sand Basin', h: -150, edge: 160, pts: [[7700, 1950], [8500, 1900], [9300, 1880], [10200, 1950], [10500, 2150], [10200, 2350], [9300, 2380], [8400, 2330], [7750, 2200]] },
  { id: 'mongol', name: 'the Windy Plateau', h: 1000, edge: 300, pts: [[10300, 1450], [11500, 1250], [12600, 1250], [12900, 1650], [12500, 2050], [11200, 2150], [10500, 1950]] },
  { id: 'deccan', name: 'the Old Tableland', h: 500, edge: 250, pts: [[8500, 4100], [9600, 4100], [9700, 4500], [9200, 5000], [8800, 4700]] },
  { id: 'highveld', name: 'the Southern Highlands', h: 1100, edge: 280, pts: [[3500, 4900], [4400, 4900], [4200, 5900], [3600, 6300], [3200, 5700]] },
  { id: 'ironplateau', name: 'the Iron Plateau', h: 700, edge: 320, pts: [[1500, 5400], [2600, 5500], [2900, 6200], [2400, 6500], [1800, 6100]] },
  { id: 'siberia', name: 'the Wet Lowland', h: -300, edge: 300, pts: [[7300, 500], [8600, 600], [9500, 900], [9700, 1200], [8800, 1300], [7600, 1100]] },
  { id: 'ganges', name: 'the River Plain', h: -250, edge: 200, pts: [[7800, 3500], [9000, 3600], [10300, 3720], [10400, 3900], [9200, 3880], [7900, 3750]] },
  { id: 'northplain', name: 'the Yellow Plain', h: -300, edge: 200, pts: [[13100, 1950], [14300, 2050], [14450, 2550], [13400, 2600], [13150, 2300]] },
  { id: 'southbasin', name: 'the Green Basin', h: -200, edge: 220, pts: [[12100, 2800], [13000, 2780], [14300, 2850], [14350, 3200], [13300, 3250], [12200, 3150]] },
  { id: 'manchu', name: 'the Black Earth', h: -150, edge: 250, pts: [[13600, 1000], [14700, 1050], [14900, 1600], [13900, 1700]] },
];

// ---- the ten Far Lands (docs/research/world-foundations.md, 1.3), each a code and anchor points; a province takes
// the land of its nearest anchor (after the biome has had its say for the cold north and the high plateau)
export const LANDS = {
  T: { name: 'the Black Pines', anchors: [[7600, 700], [8800, 700], [10200, 650], [11600, 550], [12800, 700], [14000, 600], [15200, 600], [16100, 700]] },
  N: { name: 'the Rime Coast', anchors: [[9600, 150], [11300, 120], [9600, 900]] },
  F: { name: 'the Long Grass', anchors: [[7500, 1400], [8500, 1350], [9500, 1500], [10500, 1550], [11600, 1650], [12500, 1750]] },
  B: { name: 'the Sand Basins', anchors: [[8200, 2100], [9200, 2100], [10000, 2150], [10900, 2300]] },
  H: { name: 'the High Steppes', anchors: [[7900, 2750], [8800, 2900], [9800, 2950], [10800, 2950]] },
  R: { name: 'the Twin Rivers', anchors: [[12300, 2300], [13400, 2250], [14000, 2600], [12600, 3000], [13600, 3050], [13200, 3600], [13700, 1300], [14600, 1300], [15500, 2300]] },
  M: { name: 'the Southern Peninsulas', anchors: [[8200, 3600], [9200, 3750], [10200, 3800], [8800, 4400], [9300, 4900], [11300, 3900], [12000, 4200], [12700, 4400], [12500, 5500]] },
  A: { name: 'the Thousand Isles', anchors: [[12200, 5800], [13600, 5700], [13600, 6700], [14800, 5900], [15000, 4300], [15300, 5200], [16200, 6500], [9400, 5500]] },
  I: { name: 'the Sunrise Isles', anchors: [[16600, 1850], [16500, 2500], [16000, 3050], [16300, 1100]] },
  D: { name: 'the Deep Southland', anchors: [[1200, 5000], [2600, 5000], [4200, 5000], [1800, 5800], [2800, 5900], [3800, 5800], [2800, 6600], [4650, 6400]] },
};
// how crowded each land is against its ground (the lopsidedness of rule 1.4: two hearths and thin lands between)
export const CROWD = { T: 0.55, N: 0.45, F: 0.8, B: 1, H: 0.8, R: 1.7, M: 1.25, A: 0.85, I: 1.3, D: 0.4 };

// the hand plan in the shape the generator takes (loreplan.mjs makes the same shape from the lore)
export function handPlan() {
  return { lore: false, frame: { x0: 0, y0: 0, W: FRAME.W, H: FRAME.H }, coasts: Object.values(LANDS_POLY).map(pts => ({ pts })), chains: CHAINS, lakes: LAKES,
    ranges: RANGES, plateaus: PLATEAUS, keep: [], water: [], rivers: [], regions: null, edgeSea: 90 };
}
