// The score's tuning table (73-score): which family of music each culture hears, and how that family is built.
// This file is data, for a composer to retune. music.core.js reads it; nothing else does.
//
// A family:
//   name     what it is meant to recall (a note for the composer, never shown)
//   mode     the scale, in semitones above the tonic (fractions are allowed: the isles are tuned off the piano)
//   warMode  the same scale in its war colour (same length): a minor or darker shade, used while your realm is at war
//   tonic    the melody's tonic as a MIDI note (60 = middle C)
//   bpm      a slow beat; winter plays 10% slower, summer 4% quicker
//   lead     the melody instruments and how often each leads a section: lute, harp, vielle, flute
//   fill     the instrument that plucks the accompaniment (summer plays it all, spring and autumn half, winter none)
//   drone    [instrument, semitones above the drone root..., octave of the root below the tonic]
//            bowed: a vielle or hurdy-gurdy drone that swells in; pluck: a tanpura-like plucked drone; none
//   droneMove  in the B section the drone steps to this scale degree (0-based), then back; null keeps it on the tonic
//   parallel the melody doubled a fixed interval away (semitones): -7 a fifth below (organum), +5 a fourth above
//   rhythm   the note lengths a motif is cut from, in beats
//   pulse    a drum pattern in peace, in half beats (1 the low thump, 2 the rim), or null; it plays in the fuller seasons
//   warPulse the tabor in war, in half beats
//   bells    0 none, 1 a bell at the opening, 2 a bell at each section (temples always ring one when a scene is of faith)
//   wet      how much room (reverb): open steppe 0.15, a stone hall 0.5
//   ostinato true: the fill is a repeating harp figure (a kora) instead of chords under long notes
(function () {
  const SC = UI.SCORE = UI.SCORE || {};
  const M = SC.MODES = {
    ionian:     [0, 2, 4, 5, 7, 9, 11],
    dorian:     [0, 2, 3, 5, 7, 9, 10],
    phrygian:   [0, 1, 3, 5, 7, 8, 10],
    lydian:     [0, 2, 4, 6, 7, 9, 11],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    aeolian:    [0, 2, 3, 5, 7, 8, 10],
    hijaz:      [0, 1, 4, 5, 7, 8, 10],      // Phrygian with a raised third: the augmented second of the desert
    majPent:    [0, 2, 4, 7, 9],
    minPent:    [0, 3, 5, 7, 10],
    fourths:    [0, 2, 5, 7, 10],            // a suspended pentatonic: stacked fourths, no third at all
    inSen:      [0, 1, 5, 7, 10],            // the fourths with a half step on top: their war colour
    kumoi:      [0, 2, 3, 7, 9],             // the major pentatonic with its third lowered
    bhairavi5:  [0, 1, 4, 7, 8],             // a dark five-note raga colour
    slendro:    [0, 2.4, 4.8, 7.2, 9.6],     // five near-equal steps (gamelan-like), off the twelve keys
    pelog5:     [0, 1.2, 3.8, 7, 8.2],       // an uneven five-note scale for the isles at war
  };
  const PEACE_NONE = null, TABOR = [1, 0, 0, 0, 2, 0, 0, 0];
  SC.FAMILIES = {
    north:   { name: 'Northfolk: fiddle, lute and pipe over a fiddle drone', mode: M.dorian, warMode: M.aeolian, tonic: 62, bpm: 64,
               lead: { lute: 3, vielle: 2, flute: 2 }, fill: 'lute', drone: ['bowed', [0, 7], -24], droneMove: 3, parallel: 0,
               rhythm: [1, 1, 1, 2, 0.5, 0.5, 1.5, 3], pulse: PEACE_NONE, warPulse: TABOR, bells: 0, wet: 0.28 },
    solen:   { name: 'Solenfolk: plainchant on a vielle, temple bells, an organ-like drone', mode: M.mixolydian, warMode: M.dorian, tonic: 55, bpm: 56,
               lead: { vielle: 3, flute: 2 }, fill: 'harp', drone: ['bowed', [0, 7, 12], -12], droneMove: null, parallel: 0,
               rhythm: [1, 1, 2, 2, 1, 3], pulse: PEACE_NONE, warPulse: TABOR, bells: 2, wet: 0.45 },
    east:    { name: 'Eastfolk: a lake-country fiddle in the minor, the Dawn Church bell', mode: M.aeolian, warMode: M.phrygian, tonic: 57, bpm: 58,
               lead: { vielle: 3, flute: 1, lute: 1 }, fill: 'harp', drone: ['bowed', [0, 7], -12], droneMove: 5, parallel: 0,
               rhythm: [1, 1, 2, 1.5, 0.5, 3], pulse: PEACE_NONE, warPulse: TABOR, bells: 2, wet: 0.35 },
    giant:   { name: 'Hall-giants: a very low fiddle and a great bell under the ice', mode: M.mixolydian, warMode: M.aeolian, tonic: 48, bpm: 46,
               lead: { vielle: 3, flute: 1 }, fill: 'harp', drone: ['bowed', [0, 7], -12], droneMove: 3, parallel: 0,
               rhythm: [2, 1, 1, 2, 3], pulse: PEACE_NONE, warPulse: [1, 0, 0, 0, 0, 0, 0, 0], bells: 1, wet: 0.5 },
    south:   { name: 'The desert coasts: an oud-like lute and a reed flute over a drone, a soft frame drum', mode: M.hijaz, warMode: M.phrygian, tonic: 64, bpm: 66,
               lead: { lute: 3, flute: 3, vielle: 1 }, fill: 'lute', drone: ['bowed', [0, 7], -24], droneMove: null, parallel: 0,
               rhythm: [1, 0.5, 0.5, 1, 2, 1.5, 0.5, 3], pulse: [1, 0, 0, 2, 0, 0, 2, 0], warPulse: [1, 0, 0, 2, 1, 0, 2, 0], bells: 0, wet: 0.26 },
    steppe:  { name: 'The Salt Steppe: a long flute and a horsehead fiddle over an open fifth', mode: M.majPent, warMode: M.kumoi, tonic: 57, bpm: 60,
               lead: { flute: 3, vielle: 2, lute: 1 }, fill: 'lute', drone: ['bowed', [0, 7], -12], droneMove: null, parallel: 0,
               rhythm: [2, 1, 1, 3, 0.5, 0.5, 4], pulse: PEACE_NONE, warPulse: [1, 0, 1, 0, 2, 0, 0, 0], bells: 0, wet: 0.15 },
    roof:    { name: 'The Roof: a monk\'s flute in thin air, a low bowl-bell', mode: M.minPent, warMode: M.inSen, tonic: 62, bpm: 48,
               lead: { flute: 3, vielle: 1 }, fill: 'harp', drone: ['bowed', [0, 7], -24], droneMove: null, parallel: 0,
               rhythm: [2, 1, 1, 2, 3], pulse: PEACE_NONE, warPulse: [1, 0, 0, 0, 0, 0, 0, 0], bells: 2, wet: 0.4 },
    savanna: { name: 'The Golden Plains and the Highveld: a harp figure (a kora) and a voice-like flute', mode: M.majPent, warMode: M.kumoi, tonic: 65, bpm: 70,
               lead: { flute: 2, harp: 2, lute: 1 }, fill: 'harp', ostinato: true, drone: ['none', [], -12], droneMove: null, parallel: 0,
               rhythm: [1, 1, 0.5, 0.5, 2, 1.5, 3], pulse: [1, 0, 0, 0, 2, 0, 0, 0], warPulse: [1, 0, 2, 0, 1, 0, 2, 0], bells: 0, wet: 0.2 },
    monsoon: { name: 'The spice and monsoon coasts: a plucked drone that cycles, a lute and a bamboo flute', mode: M.majPent, warMode: M.bhairavi5, tonic: 60, bpm: 58,
               lead: { lute: 3, flute: 2, vielle: 1 }, fill: 'harp', drone: ['pluck', [7, 12, 12, 0], -12], droneMove: null, parallel: 0,
               rhythm: [1, 1, 2, 0.5, 0.5, 1.5, 3], pulse: PEACE_NONE, warPulse: [1, 0, 0, 2, 0, 0, 1, 0], bells: 0, wet: 0.3 },
    isles:   { name: 'The isles and the green wilds: harp and flute in a five-step tuning off the keys, a gong-bell', mode: M.slendro, warMode: M.pelog5, tonic: 67, bpm: 62,
               lead: { harp: 3, flute: 2 }, fill: 'harp', drone: ['none', [], -12], droneMove: null, parallel: 0,
               rhythm: [1, 1, 2, 0.5, 0.5, 3], pulse: PEACE_NONE, warPulse: [1, 0, 0, 0, 2, 0, 2, 0], bells: 1, wet: 0.32 },
    coast:   { name: 'The Corsair Isles: a sailor\'s lute and pipe, a deck drum', mode: M.mixolydian, warMode: M.dorian, tonic: 57, bpm: 68,
               lead: { lute: 3, flute: 2 }, fill: 'lute', drone: ['bowed', [0, 7], -12], droneMove: 3, parallel: 0,
               rhythm: [1, 1, 0.5, 0.5, 2, 1.5, 3], pulse: [1, 0, 0, 0, 0, 0, 2, 0], warPulse: TABOR, bells: 0, wet: 0.22 },
    elf:     { name: 'The elves: harp and flute in the bright Lydian, slow, in a long room', mode: M.lydian, warMode: M.dorian, tonic: 65, bpm: 52,
               lead: { harp: 3, flute: 3 }, fill: 'harp', drone: ['bowed', [0, 7], -24], droneMove: null, parallel: 0,
               rhythm: [1, 1, 2, 2, 1, 3], pulse: PEACE_NONE, warPulse: [1, 0, 0, 0, 0, 0, 2, 0], bells: 0, wet: 0.48 },
    dwarf:   { name: 'The holds: low drones, the melody doubled a fifth below, a bell in the stone', mode: M.aeolian, warMode: M.phrygian, tonic: 55, bpm: 54,
               lead: { vielle: 3, flute: 1, lute: 1 }, fill: 'lute', drone: ['bowed', [0, 7, 12], -12], droneMove: null, parallel: -7,
               rhythm: [1, 1, 2, 2, 3], pulse: PEACE_NONE, warPulse: [1, 0, 0, 0, 1, 0, 0, 0], bells: 1, wet: 0.5 },
    orc:     { name: 'The clans: raw fourths over a drone of fourths, a drum on the grass', mode: M.fourths, warMode: M.inSen, tonic: 52, bpm: 62,
               lead: { vielle: 2, flute: 2 }, fill: 'lute', drone: ['bowed', [0, 5, 12], -12], droneMove: null, parallel: 5,
               rhythm: [1, 1, 2, 0.5, 0.5, 3], pulse: [1, 0, 0, 0, 1, 0, 0, 0], warPulse: [1, 0, 0, 2, 1, 0, 2, 0], bells: 0, wet: 0.2 },
  };
  // each of the 24 cultures (LORE.cultures) and the family it hears; `over` retunes one culture inside its family
  SC.CULTURES = {
    'CUL-01': { fam: 'solen' },                                                   // Solenfolk: the Temple, the noon bell
    'CUL-02': { fam: 'north' },                                                   // Northfolk (Aldmark and the Seven Halls)
    'CUL-03': { fam: 'steppe' },                                                  // Wind Riders
    'CUL-04': { fam: 'south' },                                                   // Qadiri: the garden coast
    'CUL-05': { fam: 'south', over: { bpm: 60, lead: { flute: 3, lute: 2 } } },   // Sandfolk: the Red Waste
    'CUL-06': { fam: 'south', over: { mode: M.phrygian, warMode: M.phrygian, bells: 1, wet: 0.38 } }, // Tamari: the river kings, the dead
    'CUL-07': { fam: 'south', over: { tonic: 62 } },                              // Sabrans: the pearl gulf
    'CUL-08': { fam: 'savanna' },                                                 // Zanari
    'CUL-09': { fam: 'savanna', over: { tonic: 62, bpm: 64 } },                   // Abari: the Highveld
    'CUL-10': { fam: 'monsoon', over: { tonic: 62 } },                            // Keshi: the pepper coast
    'CUL-11': { fam: 'east' },                                                    // Eastfolk
    'CUL-12': { fam: 'roof' },                                                    // Skyfolk
    'CUL-13': { fam: 'monsoon' },                                                 // Ranpuri
    'CUL-14': { fam: 'isles' },                                                   // Amberfolk
    'CUL-15': { fam: 'coast' },                                                   // Corsairs
    'CUL-16': { fam: 'isles', over: { lead: { flute: 3 }, fill: 'harp', bells: 0, tonic: 69, wet: 0.24 } }, // Leaf People: a flute in the Deep Green
    'CUL-17': { fam: 'isles', over: { mode: M.majPent, warMode: M.kumoi, tonic: 64 } }, // Cloudfolk: the ridge mist
    'CUL-18': { fam: 'north', over: { mode: M.mixolydian, warMode: M.dorian, bpm: 68 } }, // Marchfolk
    'CUL-19': { fam: 'elf' },                                                     // Sylvari: the Evenwood
    'CUL-20': { fam: 'elf', over: { mode: M.ionian, warMode: M.aeolian, tonic: 64, wet: 0.4 } }, // Grovers of the Coast
    'CUL-21': { fam: 'dwarf' },                                                   // Holdfolk
    'CUL-22': { fam: 'orc' },                                                     // Horde clans: drums
    'CUL-23': { fam: 'orc', over: { pulse: null, tonic: 50 } },                   // Tusk clans: no holy chiefs, no drum in peace
    'CUL-24': { fam: 'giant' },                                                   // Hall-giants
  };
  SC.DEFAULT_CULT = 'CUL-02';   // a culture not in the table (a mod's, a new realm's) hears the Northfolk
  SC.TITLE_CULT = 'CUL-02';     // the title screen
})();
