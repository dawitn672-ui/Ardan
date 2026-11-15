// The figure library · the peoples' dress (C8c, D-060). Data only: one row per culture of the game (GD.CULTURES ids,
// C7's cultures, D-058). The wardrobe reads a row as the person's `cult`:
//   cut     the family of garment a people cuts its cloth to (wardrobe.js draws each estate in each):
//             tunic   the northern and western tunic, hose and kirtle
//             robe    the long loose robe of the desert and of the elves, girdled with a sash
//             kaftan  the steppe's coat that crosses over the breast, over loose breeches and boots
//             drape   the south's length of cloth over one shoulder, on a sleeveless shift
//   hat     what is worn on the head, [men, women]: cap, veil, hood, kerchief, cone, turban, wrap, fillet, furhat,
//           feathers, leaves, or null (bare-headed)
//   dye     a people's own dye (worn by some, not all)       dyes  the dyes its cloth leans to
//   sash    a cloth girdle in place of a belt                collar  beads, bones, fur, embroidered (a worked yoke)
//   pat     a border on the hem: zig, stripe                 torc, band, fur, apron: small habits of a people
//   arms    whose smiths arm it (arms.js)
// The table was 63-miniature-portraits' and then 93-figures' (which drew only the hat and the dye); a culture the table
// does not know is dressed in the common northern cut.
export const CULTURES = {
  'CUL-01': { name: 'Solenfolk', cut: 'tunic', hat: ['cap', 'veil'], band: 1, dyes: ['blue', 'madder', 'mustard', 'teal'], arms: 'solen' },
  'CUL-02': { name: 'Northfolk', cut: 'tunic', hat: ['hood', 'kerchief'], dyes: ['woad', 'russet', 'forest', 'grey'], fur: 1 },
  'CUL-03': { name: 'Wind Riders', cut: 'kaftan', hat: ['cone', 'cone'], collar: 'fur', dye: '#6a4a2a', dyes: ['russet', 'ochre', 'teal', 'madder'], arms: 'desert' },
  'CUL-04': { name: 'Qadiri', cut: 'robe', hat: ['turban', 'veil'], sash: 1, dye: '#3d4f7a', dyes: ['woad', 'cream', 'teal', 'ochre'], arms: 'desert' },
  'CUL-05': { name: 'Sandfolk', cut: 'robe', hat: ['wrap', 'veil'], sash: 1, dye: '#34416a', dyes: ['navy', 'cream', 'undyed', 'woad'], arms: 'desert' },
  'CUL-06': { name: 'Tamari', cut: 'drape', hat: ['fillet', 'fillet'], collar: 'beads', dye: '#e4dcc4', dyes: ['linen', 'cream', 'white', 'teal'], arms: 'desert' },
  'CUL-07': { name: 'Sabrans', cut: 'robe', hat: ['wrap', 'kerchief'], sash: 1, dye: '#8a6a3a', dyes: ['ochre', 'russet', 'cream', 'madder'], arms: 'desert' },
  'CUL-08': { name: 'Zanari', cut: 'drape', hat: ['wrap', 'wrap'], collar: 'beads', pat: 'zig', dye: '#a8602a', dyes: ['ochre', 'russet', 'madder', 'mustard'] },
  'CUL-09': { name: 'Abari', cut: 'drape', hat: [null, 'wrap'], collar: 'beads', pat: 'stripe', dye: '#8e3a2a', dyes: ['madder', 'scarlet', 'ochre', 'walnut'] },
  'CUL-10': { name: 'Keshi', cut: 'drape', hat: ['turban', 'kerchief'], sash: 1, dye: '#b0782a', dyes: ['mustard', 'ochre', 'rose', 'green'] },
  'CUL-11': { name: 'Eastfolk', cut: 'tunic', hat: ['furhat', 'kerchief'], collar: 'embroidered', sash: 1, dyes: ['madder', 'cream', 'green', 'blue'] },
  'CUL-12': { name: 'Skyfolk', cut: 'kaftan', hat: ['furhat', 'furhat'], sash: 1, dye: '#7a2a24', dyes: ['crimson', 'madder', 'navy', 'mustard'], arms: 'desert' },
  'CUL-13': { name: 'Ranpuri', cut: 'drape', hat: ['turban', 'veil'], dye: '#c08a2a', dyes: ['mustard', 'rose', 'scarlet', 'teal'], pat: 'stripe', arms: 'desert' },
  'CUL-14': { name: 'Amberfolk', cut: 'tunic', hat: ['kerchief', 'kerchief'], collar: 'beads', dyes: ['ochre', 'mustard', 'woad', 'sage'], arms: 'desert' },
  'CUL-15': { name: 'Corsairs', cut: 'tunic', hat: ['kerchief', 'kerchief'], sash: 1, torc: 1, dyes: ['scarlet', 'navy', 'cream', 'black'], arms: 'solen' },
  'CUL-16': { name: 'Leaf People', cut: 'drape', hat: ['feathers', 'feathers'], dye: '#5a6a3a', dyes: ['sage', 'green', 'forest', 'ochre'] },
  'CUL-17': { name: 'Cloudfolk', cut: 'drape', hat: ['feathers', 'fillet'], collar: 'beads', pat: 'zig', dyes: ['madder', 'woad', 'cream', 'mustard'] },
  'CUL-18': { name: 'Marchfolk', cut: 'tunic', hat: ['hood', 'kerchief'], dyes: ['forest', 'russet', 'grey', 'walnut'] },
  'CUL-19': { name: 'Sylvari', cut: 'robe', hat: ['leaves', 'leaves'], dye: '#4d6a4a', dyes: ['sage', 'forest', 'green', 'cream'], arms: 'elf' },
  'CUL-20': { name: 'Grovers of the Coast', cut: 'robe', hat: ['fillet', 'fillet'], dye: '#3e6a6a', dyes: ['teal', 'sage', 'linen', 'woad'], arms: 'elf' },
  'CUL-21': { name: 'Holdfolk', cut: 'tunic', hat: ['hood', 'kerchief'], apron: 1, dyes: ['russet', 'walnut', 'ochre', 'grey'], arms: 'dwarf' },
  'CUL-22': { name: 'Horde clans', cut: 'tunic', hat: [null, null], collar: 'bones', fur: 1, dyes: ['walnut', 'brown', 'madder', 'hemp'], arms: 'orc' },
  'CUL-23': { name: 'Tusk clans', cut: 'tunic', hat: [null, null], collar: 'bones', fur: 1, dyes: ['brown', 'hemp', 'russet', 'charcoal'], arms: 'orc' },
  'CUL-24': { name: 'Hall-giants', cut: 'tunic', hat: [null, 'kerchief'], collar: 'fur', torc: 1, dyes: ['grey', 'woad', 'walnut', 'russet'] },
};
export const CUTS = ['tunic', 'robe', 'kaftan', 'drape'];
export const cultureOf = id => (typeof id === 'string' && Object.prototype.hasOwnProperty.call(CULTURES, id) ? CULTURES[id] : null);
