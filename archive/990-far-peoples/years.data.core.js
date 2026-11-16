// How the far peoples name the year (990-far-peoples), where the year is reckoned by an era as well as a reign. Each
// entry is a list tried in order; the first whose every token fills is used, then the culture's own voice-bank year,
// then the house's years. Tokens: {n} the ruler's year (an ordinal), {ru} the ruler, {y} the year, {d} the house's year
// (an ordinal), {house} the house, {lc} the Ledger's Long Count (from 640 BR), {lamp} the year of Teshur's lamp, an
// ordinal (from about 190), {wall} the Cold Gate's count from the Sundering (about 2400 BR).
(function () {
  const Y = A.FARP_YEAR = A.FARP_YEAR || {};
  const ledger = ['the {n} year of {ru}, year {lc} of the Long Count', 'year {lc} of the Long Count, the {d} of {house}', 'year {lc} of the Long Count'];
  for (const c of ['CUL-25', 'CUL-26', 'CUL-27', 'CUL-28', 'CUL-29', 'CUL-36', 'CUL-41', 'CUL-96']) Y[c] = ledger;
  Y['CUL-30'] = ['the {n} snow of {ru}, the {d} of {house}', 'the {d} snow of {house}'];
  Y['CUL-38'] = ['the {n} raid-year of {ru}, year {lc} of the Long Count', 'year {lc} of the Long Count'];
  Y['CUL-35'] = ['the {n} year of the Eldest {ru}, by the boats\' count', 'the {d} year since the law of 1003'];
  const lamp = ['the {n} year of {ru}, the {lamp} of the Lamp', 'the {lamp} year of the Lamp'];
  for (const c of ['CUL-54', 'CUL-56', 'CUL-57', 'CUL-58', 'CUL-59', 'CUL-93', 'CUL-95', 'CUL-105']) Y[c] = lamp;
  Y['CUL-53'] = ['the {n} wind of {ru}, the {lamp} of the Lamp', 'the {lamp} wind of the Lamp'];
  Y['CUL-67'] = ['the {n} year of {ru} on the wall, rune {wall} of the Long Count', 'rune {wall} of the Long Count wall'];
  Y['CUL-43'] = ['the {n} grass of {ru}, the {d} of the khaganate', 'the {d} grass of {house}'];
  Y['CUL-44'] = ['the {n} grass of the Wing-Khan {ru}', 'the {d} grass of {house}'];
  Y['CUL-88'] = ['the {n} turn of the Wheel under {ru}, the {d} of {house}', 'the {d} turn of the Wheel under {house}'];
  Y['CUL-90'] = ['the {n} year of the Stall-King {ru}, the {d} of the stables', 'the {d} year of the stables'];
  Y['CUL-94'] = ['the {n} turning of the lake under {ru}', 'the {d} turning under {house}'];
  Y['CUL-84'] = ['the {n} year of {ru} as Marshal, the {d} of {house}', 'the {d} year of {house}'];
  Y['CUL-120'] = ['the {n} year of {ru}, whom no one sees eat, the {d} of the Wall', 'the {d} year of the Wall'];
  Y['CUL-124'] = ['the {n} year of {ru}, the {d} of the Book\'s kings', 'the {d} year of the Book\'s kings'];
})();
// peoples whose lore names no ruler's accession and no house: the year by their own reckoning
(function () {
  const Y = A.FARP_YEAR = A.FARP_YEAR || {};
  Y['CUL-81'] = ['the {n} ice of {ru}', 'the ice of {y}, as the drum elders count it'];
  Y['CUL-86'] = ['the {n} salmon of {ru}', 'the salmon of {y}, as the river villages count it'];
  Y['CUL-127'] = ['the {n} year of {ru}\'s age-set', 'the year {y}, in the senior age-set\'s count'];
})();
