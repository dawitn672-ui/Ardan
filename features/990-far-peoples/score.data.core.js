// The far peoples' music (990-far-peoples), in 73-score's own table (features/73-score/modes.core.js): six new
// families for the lands the Known World's fourteen do not cover, and every one of the 110 far cultures mapped to a
// family with its own retuning (tonic, tempo, lead), so each people has its own sound. A composer's table, like 73's.
// Families must keep 73's rules: a war colour of the same length as the mode and darker than it.
(function () {
  const SC = UI.SCORE;
  if (!SC || !SC.FAMILIES || !SC.CULTURES || !SC.MODES) return;   // built without 73-score
  const M = SC.MODES, TABOR = [1, 0, 0, 0, 2, 0, 0, 0];
  M.kokin = M.kokin || [0, 1, 5, 7, 8];   // a dark five-note colour for the Sunrise Isles at war
  Object.assign(SC.FAMILIES, {
    ledger: { name: 'The Twin Rivers: a bamboo flute, a plucked zither and a pear lute in the major pentatonic, a temple bell', mode: M.majPent, warMode: M.kumoi, tonic: 62, bpm: 54,
              lead: { flute: 3, harp: 2, lute: 2 }, fill: 'harp', drone: ['none', [], -12], droneMove: null, parallel: 0,
              rhythm: [1, 1, 2, 0.5, 0.5, 1.5, 3], pulse: null, warPulse: [1, 0, 0, 0, 1, 0, 2, 0], bells: 2, wet: 0.34 },
    hills:  { name: 'The hill clans of the south: a gourd pipe and a mouth-harp lute over a drum', mode: M.majPent, warMode: M.kumoi, tonic: 64, bpm: 66,
              lead: { flute: 3, lute: 2 }, fill: 'lute', drone: ['bowed', [0, 7], -24], droneMove: null, parallel: 0,
              rhythm: [1, 0.5, 0.5, 1, 2, 3], pulse: [1, 0, 0, 2, 0, 0, 1, 0], warPulse: [1, 0, 2, 0, 1, 0, 2, 0], bells: 0, wet: 0.24 },
    silk:   { name: 'The Silk Road oases: a long-necked lute and a fiddle in a mode with the augmented second, a frame drum', mode: M.hijaz, warMode: M.phrygian, tonic: 62, bpm: 62,
              lead: { lute: 3, vielle: 2, flute: 1 }, fill: 'lute', drone: ['bowed', [0, 7], -24], droneMove: 3, parallel: 0,
              rhythm: [1, 0.5, 0.5, 1, 2, 1.5, 0.5, 3], pulse: [1, 0, 2, 0, 1, 0, 2, 0], warPulse: [1, 0, 2, 1, 1, 0, 2, 0], bells: 0, wet: 0.28 },
    felt:   { name: 'The Long Grass: a horsehead fiddle over an open fifth, a long flute, a camp drum', mode: M.majPent, warMode: M.kumoi, tonic: 55, bpm: 58,
              lead: { vielle: 3, flute: 2 }, fill: 'lute', drone: ['bowed', [0, 7], -24], droneMove: null, parallel: 0,
              rhythm: [2, 1, 1, 3, 0.5, 0.5, 4], pulse: null, warPulse: [1, 0, 1, 0, 2, 0, 1, 0], bells: 0, wet: 0.14 },
    taiga:  { name: 'The Black Pines: a frame drum that walks, a bone flute, a fiddle in the minor pentatonic', mode: M.minPent, warMode: M.inSen, tonic: 57, bpm: 50,
              lead: { flute: 3, vielle: 2 }, fill: 'harp', drone: ['bowed', [0, 7], -12], droneMove: null, parallel: 0,
              rhythm: [2, 1, 1, 2, 3], pulse: [1, 0, 0, 0, 1, 0, 0, 0], warPulse: [1, 0, 1, 0, 1, 0, 2, 0], bells: 0, wet: 0.42 },
    ember:  { name: 'The Sunrise Isles: a shrine flute and a plucked board zither in the in scale, a shrine bell', mode: M.inSen, warMode: M.kokin, tonic: 64, bpm: 52,
              lead: { flute: 3, harp: 3 }, fill: 'harp', drone: ['none', [], -12], droneMove: null, parallel: 0,
              rhythm: [2, 1, 1, 0.5, 0.5, 3], pulse: null, warPulse: [1, 0, 0, 0, 2, 0, 0, 0], bells: 1, wet: 0.36 },
  });
  // each far culture: [family, its own retuning]
  const T = {
    // the Twin Rivers
    'CUL-25': ['ledger', {}], 'CUL-26': ['ledger', { tonic: 60, bpm: 52, lead: { flute: 3, harp: 3 } }], 'CUL-27': ['ledger', { tonic: 64, lead: { harp: 3, flute: 2 }, wet: 0.4 }],
    'CUL-28': ['ledger', { tonic: 59, bpm: 58, lead: { lute: 3, flute: 2 } }], 'CUL-29': ['ledger', { tonic: 57, bpm: 50, bells: 1, drone: ['bowed', [0, 7], -24] }],
    'CUL-30': ['felt', { tonic: 57, bpm: 60, pulse: [1, 0, 0, 0, 2, 0, 0, 0] }], 'CUL-31': ['ledger', { tonic: 63, bpm: 56, lead: { flute: 2, harp: 3 }, bells: 1 }],
    'CUL-32': ['silk', { mode: M.dorian, warMode: M.aeolian, tonic: 60, bells: 2 }], 'CUL-33': ['ledger', { tonic: 61, bpm: 50, lead: { flute: 3, vielle: 1 } }],
    'CUL-34': ['hills', {}], 'CUL-35': ['ledger', { tonic: 65, bpm: 60, bells: 0, lead: { flute: 2, lute: 3 } }], 'CUL-36': ['ledger', { tonic: 62, bpm: 60, bells: 1, lead: { lute: 3, flute: 2 } }],
    'CUL-37': ['isles', { tonic: 65, bpm: 64 }], 'CUL-38': ['felt', { tonic: 59, lead: { vielle: 2, flute: 3 } }], 'CUL-39': ['hills', { tonic: 66, bpm: 62, lead: { flute: 2, lute: 3 } }],
    'CUL-40': ['hills', { mode: M.minPent, warMode: M.inSen, tonic: 60, bpm: 54, bells: 1 }], 'CUL-41': ['ledger', { tonic: 63, bpm: 62, bells: 0 }], 'CUL-42': ['hills', { tonic: 62, bpm: 58, pulse: [1, 0, 0, 0, 0, 0, 2, 0] }],
    // the Long Grass
    'CUL-43': ['felt', {}], 'CUL-44': ['felt', { tonic: 57, bpm: 62 }], 'CUL-45': ['orc', { tonic: 50, bpm: 56, pulse: [1, 0, 0, 0, 0, 0, 0, 0] }], 'CUL-46': ['orc', { tonic: 53, bpm: 64 }],
    'CUL-47': ['silk', { tonic: 60, bpm: 58, pulse: null }], 'CUL-48': ['north', { mode: M.aeolian, warMode: M.phrygian, tonic: 59, bpm: 60 }], 'CUL-49': ['felt', { tonic: 54, bpm: 54, wet: 0.24 }],
    'CUL-50': ['felt', { tonic: 52, bpm: 56, lead: { flute: 3, vielle: 2 } }], 'CUL-51': ['felt', { tonic: 50, bpm: 46, bells: 1, wet: 0.3 }], 'CUL-52': ['felt', { tonic: 58, bpm: 60, lead: { flute: 3, vielle: 2 } }],
    'CUL-53': ['silk', { tonic: 59, bpm: 66 }],
    // the Sand Basins
    'CUL-54': ['silk', {}], 'CUL-55': ['silk', { tonic: 60, bpm: 58, bells: 1 }], 'CUL-56': ['silk', { mode: M.dorian, warMode: M.aeolian, tonic: 62, bpm: 60, lead: { lute: 3, harp: 2 }, bells: 2 }],
    'CUL-57': ['silk', { tonic: 64, bpm: 60 }], 'CUL-58': ['silk', { tonic: 57, bpm: 56, wet: 0.4 }], 'CUL-59': ['silk', { tonic: 63, bpm: 64 }], 'CUL-60': ['silk', { tonic: 58, bpm: 52, pulse: null }],
    'CUL-61': ['silk', { tonic: 56, bpm: 64, warPulse: TABOR }], 'CUL-62': ['silk', { tonic: 61, bpm: 54, lead: { flute: 3, lute: 1 } }], 'CUL-68': ['roof', { tonic: 64, bpm: 54 }],
    // the High Steppes
    'CUL-63': ['roof', {}], 'CUL-64': ['roof', { tonic: 60, bpm: 46 }], 'CUL-65': ['roof', { tonic: 59, bpm: 56, bells: 0, pulse: [1, 0, 0, 0, 1, 0, 0, 0] }], 'CUL-66': ['roof', { tonic: 57, bpm: 46, bells: 1 }],
    'CUL-67': ['dwarf', { tonic: 53, bpm: 50 }], 'CUL-69': ['roof', { tonic: 63, bpm: 52, lead: { flute: 2, vielle: 2 } }], 'CUL-70': ['roof', { tonic: 61, bpm: 50, bells: 0 }],
    // the Black Pines
    'CUL-71': ['taiga', {}], 'CUL-72': ['taiga', { tonic: 55, bpm: 48, wet: 0.3 }], 'CUL-73': ['taiga', { tonic: 54, bpm: 46 }], 'CUL-74': ['taiga', { tonic: 59, bpm: 44, wet: 0.5, pulse: null }],
    'CUL-75': ['taiga', { tonic: 56, bpm: 52, pulse: [1, 0, 1, 0, 1, 0, 0, 0] }], 'CUL-76': ['felt', { mode: M.minPent, warMode: M.inSen, tonic: 58, bpm: 56, pulse: [1, 0, 0, 0, 2, 0, 0, 0] }],
    'CUL-77': ['taiga', { tonic: 60, bpm: 54, lead: { flute: 3, harp: 2 } }], 'CUL-78': ['felt', { tonic: 52, bpm: 54, wet: 0.2 }], 'CUL-79': ['north', { mode: M.aeolian, warMode: M.phrygian, tonic: 55, bpm: 56, bells: 1 }],
    'CUL-80': ['taiga', { tonic: 57, bpm: 56, lead: { flute: 2, vielle: 3 } }],
    // the Rime Coast
    'CUL-81': ['taiga', { tonic: 52, bpm: 44, lead: { flute: 3 }, wet: 0.2 }], 'CUL-82': ['giant', { tonic: 47, bpm: 44 }], 'CUL-83': ['taiga', { tonic: 55, bpm: 46, pulse: null, wet: 0.3 }],
    // the Southern Peninsulas
    'CUL-88': ['monsoon', { tonic: 61, bells: 2 }], 'CUL-89': ['monsoon', { tonic: 63, bpm: 60 }], 'CUL-90': ['monsoon', { tonic: 58, bpm: 64, warPulse: TABOR }], 'CUL-91': ['monsoon', { tonic: 60, bpm: 56 }],
    'CUL-92': ['hills', { tonic: 60, bpm: 60, wet: 0.36 }], 'CUL-93': ['isles', { tonic: 65, bpm: 56, bells: 2 }], 'CUL-94': ['isles', { tonic: 63, bpm: 54, bells: 2 }], 'CUL-95': ['isles', { tonic: 66, bpm: 64, pulse: [1, 0, 2, 0, 1, 0, 0, 0] }],
    'CUL-96': ['ledger', { tonic: 60, bpm: 56, bells: 1 }], 'CUL-97': ['isles', { tonic: 68, bpm: 60 }], 'CUL-98': ['isles', { tonic: 64, bpm: 62, bells: 0 }], 'CUL-99': ['hills', { tonic: 65, bpm: 64 }],
    'CUL-100': ['hills', { tonic: 63, bpm: 60, pulse: null }], 'CUL-101': ['hills', { tonic: 61, bpm: 56, lead: { flute: 3, vielle: 1 } }], 'CUL-102': ['hills', { tonic: 70, bpm: 62, lead: { flute: 3 }, pulse: null }],
    'CUL-103': ['monsoon', { tonic: 62, bpm: 60, bells: 1 }], 'CUL-104': ['monsoon', { tonic: 64, bpm: 56, wet: 0.36 }],
    // the Thousand Isles
    'CUL-105': ['isles', { tonic: 66, bpm: 62 }], 'CUL-106': ['isles', { tonic: 64, bpm: 58, pulse: [1, 0, 0, 0, 2, 0, 0, 0] }], 'CUL-107': ['isles', { tonic: 67, bpm: 66, bells: 2 }],
    'CUL-108': ['isles', { tonic: 62, bpm: 66, pulse: [1, 0, 2, 0, 0, 0, 2, 0] }], 'CUL-109': ['isles', { tonic: 65, bpm: 56, lead: { flute: 3, harp: 1 } }], 'CUL-110': ['isles', { tonic: 69, bpm: 60 }],
    'CUL-111': ['isles', { tonic: 63, bpm: 64, bells: 2 }], 'CUL-112': ['isles', { tonic: 61, bpm: 52 }], 'CUL-113': ['isles', { tonic: 60, bpm: 68, warPulse: TABOR }], 'CUL-114': ['isles', { tonic: 68, bpm: 58 }],
    'CUL-115': ['isles', { tonic: 66, bpm: 54, bells: 0, wet: 0.4 }], 'CUL-116': ['savanna', { tonic: 62, bpm: 64, ostinato: false }], 'CUL-117': ['isles', { tonic: 70, bpm: 62, bells: 0 }],
    'CUL-118': ['isles', { tonic: 67, bpm: 58, bells: 0, wet: 0.2 }], 'CUL-119': ['isles', { tonic: 64, bpm: 52, lead: { flute: 3 }, bells: 0 }],
    // the Deep Southland
    'CUL-120': ['savanna', { tonic: 60, bpm: 66 }], 'CUL-121': ['savanna', { tonic: 63, bpm: 68, pulse: [1, 0, 2, 0, 1, 0, 2, 0] }], 'CUL-122': ['savanna', { tonic: 64, bpm: 66 }], 'CUL-123': ['savanna', { tonic: 66, bpm: 70 }],
    'CUL-124': ['east', { mode: M.dorian, warMode: M.phrygian, tonic: 60, bpm: 52, bells: 2 }], 'CUL-125': ['south', { tonic: 62, bpm: 62, bells: 1 }], 'CUL-126': ['savanna', { tonic: 59, bpm: 64 }],
    'CUL-127': ['savanna', { tonic: 57, bpm: 60, ostinato: false, lead: { flute: 3, lute: 1 } }], 'CUL-128': ['savanna', { tonic: 67, bpm: 58, lead: { flute: 3, harp: 2 } }], 'CUL-129': ['savanna', { tonic: 62, bpm: 70 }],
    'CUL-130': ['savanna', { tonic: 64, bpm: 62 }], 'CUL-131': ['south', { tonic: 60, bpm: 58, lead: { lute: 3, flute: 2 } }], 'CUL-132': ['savanna', { tonic: 69, bpm: 54, ostinato: false, pulse: null }],
    'CUL-133': ['isles', { tonic: 63, bpm: 58 }], 'CUL-134': ['savanna', { tonic: 61, bpm: 66 }],
    // the Sunrise Isles
    'CUL-84': ['ember', {}], 'CUL-85': ['ember', { tonic: 62, bpm: 48, bells: 2 }], 'CUL-86': ['taiga', { tonic: 59, bpm: 52 }], 'CUL-87': ['ember', { tonic: 66, bpm: 58, lead: { flute: 2, lute: 3 } }],
  };
  // an over, even an empty one, gives the culture a style of its own (73 seeds a piece by the style), so no two
  // peoples compose the same piece for the same place and date
  for (const id in T) SC.CULTURES[id] = { fam: T[id][0], over: Object.assign({}, T[id][1]) };
})();
