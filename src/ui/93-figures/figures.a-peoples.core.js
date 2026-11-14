// 93-figures · the peoples: what each culture wears on the head, dyes its cloth, and whose smiths arm it (arms: the
// style of hilt, haft and rim the figure library draws; a culture without one carries the common northern make).
//
// The table is 63-miniature-portraits' (retired to archive/63-miniature-portraits/): headwear for men and women and a
// people's own dye. The figure library reads the hat and the dye (UI.FIG.cultOf); the cut, collar and pattern columns
// are kept for the day those cuts are drawn (C8c). The far lands' looks (the ranges of skin, hair and eye a far people
// is drawn in) stayed with the retired 93-anime-portraits in the archive, beside the far lands themselves.
(function () {
  if (typeof PORTRAIT === 'undefined' || typeof PORTRAIT.svg !== 'function') return;
  const FG = UI.FIG = UI.FIG || {};
  const CULT = {
    'CUL-01': { hat: ['cap', 'veil'], cut: 'tunic', band: 1, arms: 'solen' },                                  // Solenfolk
    'CUL-02': { hat: ['hood', 'kerchief'], cut: 'tunic' },                                       // Northfolk
    'CUL-03': { hat: ['cone', 'cone'], cut: 'kaftan', collar: 'fur', dye: '#6a4a2a', arms: 'desert' },           // Wind Riders
    'CUL-04': { hat: ['turban', 'veil'], cut: 'robe', sash: 1, dye: '#3d4f7a', arms: 'desert' },                 // Qadiri
    'CUL-05': { hat: ['wrap', 'veil'], cut: 'robe', dye: '#34416a', arms: 'desert' },                            // Sandfolk
    'CUL-06': { hat: ['fillet', 'fillet'], cut: 'tunic', collar: 'beads', dye: '#e4dcc4', arms: 'desert' },      // Tamari
    'CUL-07': { hat: ['wrap', 'kerchief'], cut: 'robe', sash: 1, dye: '#8a6a3a', arms: 'desert' },               // Sabrans
    'CUL-08': { hat: ['wrap', 'wrap'], cut: 'drape', collar: 'beads', pat: 'zig', dye: '#a8602a' }, // Zanari
    'CUL-09': { hat: [null, 'wrap'], cut: 'drape', collar: 'beads', pat: 'stripe', dye: '#8e3a2a' }, // Abari
    'CUL-10': { hat: ['turban', 'kerchief'], cut: 'drape', sash: 1, dye: '#b0782a' },            // Keshi
    'CUL-11': { hat: ['furhat', 'kerchief'], cut: 'tunic', collar: 'embroidered' },              // Eastfolk
    'CUL-12': { hat: ['furhat', 'furhat'], cut: 'kaftan', sash: 1, dye: '#7a2a24', arms: 'desert' },             // Skyfolk
    'CUL-13': { hat: ['turban', 'veil'], cut: 'drape', dye: '#c08a2a', arms: 'desert' },                         // Ranpuri
    'CUL-14': { hat: ['kerchief', 'kerchief'], cut: 'tunic', collar: 'beads', arms: 'desert' },                  // Amberfolk
    'CUL-15': { hat: ['kerchief', 'kerchief'], cut: 'tunic', sash: 1, ring: 1, arms: 'solen' },                 // Corsairs
    'CUL-16': { hat: ['feathers', 'feathers'], cut: 'drape', dye: '#5a6a3a' },                   // Leaf People
    'CUL-17': { hat: ['feathers', 'fillet'], cut: 'drape', collar: 'beads' },                    // Cloudfolk
    'CUL-18': { hat: ['hood', 'kerchief'], cut: 'tunic' },                                       // Marchfolk
    'CUL-19': { hat: ['leaves', 'leaves'], cut: 'robe', dye: '#4d6a4a', arms: 'elf' },                        // Sylvari
    'CUL-20': { hat: ['fillet', 'fillet'], cut: 'robe', dye: '#3e6a6a', arms: 'elf' },                        // Grovers of the Coast
    'CUL-21': { hat: ['hood', 'kerchief'], cut: 'tunic', apron: 1, arms: 'dwarf' },                             // Holdfolk
    'CUL-22': { hat: [null, null], cut: 'tunic', collar: 'bones', arms: 'orc' },                              // Horde clans
    'CUL-23': { hat: [null, null], cut: 'tunic', collar: 'bones', fur: 1, arms: 'orc' },                      // Tusk clans
    'CUL-24': { hat: [null, 'kerchief'], cut: 'tunic', collar: 'fur', torc: 1 },                 // Hall-giants
  };
  // a culture's dress row
  FG.CULT = CULT;
  FG.cultOf = cid => (typeof cid === 'string' && Object.prototype.hasOwnProperty.call(CULT, cid) ? CULT[cid] : null);
})();
