// The manhwa layer · who wears what, and why (owner orders 56, 57, 58). A KIT is plain data: garment, layers, belt,
// mantle, jewellery, headwear, arms, pose, mood, the scene's land and place. kitFor(person) builds one from the
// person's people, station, realm, wealth, sex and their own dice (taste), so a nation is recognisable without its
// people being alike. Every difference has a reason, written beside it; docs/design/c8d-gate1.md sets them out.
//
// A dress FAMILY is a people's grammar of cloth: north (Northfolk: wool, fur, a tunic, a cloak pinned on one shoulder,
// knotwork), desert (Qadiri: loose layered linen and cotton, a wound turban, a sash, star-and-key work), steppe (Wind
// Riders: a lapped felt or silk coat, toggles, fur-brimmed felt hats, cloud scrolls), south (Zanari: strip-woven cloth
// wrapped and draped, bare arms, beads, gold and copper, zigzags). A REALM bends its family (Sabra against Qadir,
// Aldmark against Northreach); a border town mixes two.
import { stream } from '../g.js';
import { chargeFn } from './card.js';

export const FAMILY = { 'CUL-02': 'north', 'CUL-18': 'north', 'CUL-01': 'north', 'CUL-04': 'desert', 'CUL-05': 'desert', 'CUL-07': 'desert', 'CUL-03': 'steppe', 'CUL-12': 'steppe', 'CUL-08': 'south', 'CUL-09': 'south', 'CUL-10': 'south' };
export const LAND_OF = { north: 'north', desert: 'desert', steppe: 'steppe', south: 'south' };
export const STATIONS = ['serf', 'peasant', 'artisan', 'merchant', 'clergy', 'soldier', 'noble', 'royal'];
const PLACE = { serf: 'field', peasant: 'village', artisan: 'workshop', merchant: 'market', clergy: 'shrine', soldier: 'camp', noble: 'hall', royal: 'court' };
export const STATION_TEXT = {
  serf: { label: 'Serf', icon: 'hoe' }, peasant: { label: 'Peasant', icon: 'sheaf' }, artisan: { label: 'Artisan', icon: 'hammer' }, merchant: { label: 'Merchant', icon: 'scales' },
  clergy: { label: 'Clergy', icon: 'flame' }, soldier: { label: 'Soldier', icon: 'shield' }, noble: { label: 'Noble', icon: 'sword' }, royal: { label: 'Royal', icon: 'crown' },
};
// keywords and a motto for each station of each people, in the period voice
const WORDS = {
  north: { serf: [['Bound', 'The lord\'s strips', 'Boon-work'], 'The land holds me, and I hold it up.'], peasant: [['Freeholder', 'Barley', 'The Thing'], 'My own roof, my own word at the Thing.'], artisan: [['Shipwright', 'Oak', 'Iron'], 'A true keel outlives its maker.'], merchant: [['Amber', 'Stockfish', 'Furs'], 'The sea pays those who count twice.'], clergy: [['The Seven Halls', 'Vigil', 'Burial'], 'Seven doors, and I keep the lamps.'], soldier: [['Shield-wall', 'Axe', 'Oath'], 'Hold the line; the rest is weather.'], noble: [['Jarl', 'Ring-giver', 'Hall'], 'What I give in silver returns in spears.'], royal: [['The Ring', 'Law', 'Winter'], 'A king here is the first oar, not the ship.'] },
  desert: { serf: [['Water-debt', 'Date gardens', 'Carrying'], 'The well is theirs. The thirst is mine.'], peasant: [['Olives', 'A share of water', 'Household'], 'One tree for each child, God willing.'], artisan: [['Coppersmith', 'Paper', 'The guild'], 'The hand remembers what the mind forgets.'], merchant: [['Caravan', 'Gold weights', 'Credit'], 'A fair scale is half of faith.'], clergy: [['The Path', 'The Well', 'Judgment'], 'Draw for the stranger before yourself.'], soldier: [['Lancer', 'Mail', 'The Sultan\'s bread'], 'I ate his salt. I ride where he points.'], noble: [['Emir', 'Horse', 'Patronage'], 'A name is kept by open hands.'], royal: [['The Seal', 'Wells', 'Justice'], 'The throne is a shade tree, or it is nothing.'] },
  steppe: { serf: [['Bondsman', 'Another\'s herd', 'Felt'], 'I count sheep that are not mine.'], peasant: [['Herder', 'Own tent', 'Nine mares'], 'Grass, water, and nobody over me.'], artisan: [['Bowyer', 'Horn', 'Sinew'], 'A year to make a bow. A breath to loose it.'], merchant: [['Horse Road', 'Salt', 'Felt'], 'I sell legs to men who have none.'], clergy: [['The Eternal Blue', 'Omens', 'Milk-offering'], 'The sky hears. I only knock.'], soldier: [['Horse archer', 'Ten of a hundred', 'Bow'], 'My bow, my horse, my ten.'], noble: [['Noyan', 'A thousand', 'Clan mark'], 'My brand is on the herd and on the men.'], royal: [['The Compact', 'Nine tribes', 'The Standard'], 'Nine tails on one staff: that is a khan.'] },
  south: { serf: [['House-bound', 'Yam mounds', 'The lord\'s tally'], 'I plant where the stool tells me.'], peasant: [['Compound', 'Millet', 'Kola'], 'Our fathers cleared it. We keep it.'], artisan: [['Caster', 'Bronze', 'Gold'], 'The wax is lost so the face may last.'], merchant: [['Gold', 'Kola', 'The Scale Pact'], 'Weigh it in daylight, before both gods.'], clergy: [['The Thousand Ancestors', 'Libation', 'Naming'], 'I speak for those who are listening.'], soldier: [['Regiment', 'Spear', 'Age-mates'], 'We were boys together. We stand together.'], noble: [['War-lord', 'Leopard right', 'Tribute'], 'Only a keeper of spears may wear the cat.'], royal: [['The Stool', 'Gold', 'The Ancestors'], 'I sit, and a thousand sit with me.'] },
};
const REALM_WORDS = {
  Sabra: { soldier: [['Marine', 'Boarding axe', 'The Emir\'s galleys'], 'A deck is a wall that moves.'], merchant: [['Pearls', 'Dates', 'Lamp oil'], 'The sea keeps no ledger. I do.'] },
  Aldmark: { noble: [['Knight', 'Fief', 'Homage'], 'My hands between his, my lance for his quarrel.'], peasant: [['Tenant', 'Wheat', 'Hearth-mark'], 'Rent at harvest, bread all year.'] },
};
const T = (c, motif, w, c2) => ({ c, motif, w, c2 });
const pickOf = r => a => a[Math.floor(r() * a.length) % a.length];

// ---- the four families --------------------------------------------------------------------------------------------------
// each returns a kit for (station, ctx): ctx = { male, w (wealth 0 poor, 1 middling, 2 well-off), r, pick, realm, age }
const north = {
  motif: 'knots', land: 'north',
  hairM: ['mid', 'long', 'tail', 'short', 'plaits'], hairF: ['braids', 'braid', 'long', 'bun'], beards: ['full', 'braided', 'short', 'forked', 'stubble'],
  serf: ({ male, w, pick }) => ({ hair: male ? 'short' : 'wild', beard: 'stubble', mood: 'meek', poseL: 'hold', poseR: 'down',
    // undyed hemp, patched: dye costs money a bound household does not have; the thong at the neck instead of a brooch
    garment: { c: 'undyed', neck: 'key', lace: '#5a4a34', patches: [[26, 78], [-30, 50]], patchC: '#9c8e74' }, sleeves: { patch: '#8a7c64' },
    belt: { kind: 'rope', hang: [{ k: 'tally', x: 26, seal: '#8a2a22' }] },                       // the lord's tally of boon-days owed, sealed with his wax
    mantle: male ? null : { kind: 'shawl', c: 'hemp', knot: 1 }, hat: male ? { kind: 'rag', c: 'hemp' } : null,
    neck: [{ kind: 'cord', d: 22, pend: { k: 'tag', m: 'iron' } }],                                  // a lead tag with the manor's mark
    heldL: { kind: 'sheaf' }, back: [{ k: 'pole', kind: 'fork', side: 1, dx: 6, top: 64 }] }),      // the lord's barley and the lord's fork
  peasant: ({ male, w, pick }) => ({ hair: male ? pick(['mid', 'short']) : 'braids', beard: pick(['short', 'full']), mood: 'warm', poseL: 'hip', poseR: w ? 'hold' : 'down',
    // dyed wool (woad grows in the north), a leather belt with a buckle, their own knife: the marks of a free household
    garment: { c: pick(['woad', 'russet', 'forest']), neck: 'round', trim: w ? T('cream', 'knots', 5, '#8e4a2c') : null, under: 'linen' },
    belt: { kind: 'leather', c: 'brown', buckle: w > 1 ? 'bronze' : 'iron', hang: [{ k: 'knife', x: -30, m: 'iron' }, ...(w ? [{ k: 'purse', x: 30, c: 'tan' }] : [])] },
    mantle: { kind: 'hood', c: pick(['russet', 'walnut', 'grey']), d: 30, dag: 1, trim: w > 1 ? T('mustard', 'dots', 3.4) : null },
    hat: male ? null : { kind: 'kerchief', c: 'linen', trim: w ? T('woad', 'bars', 4) : null },
    neck: w ? [{ kind: 'beads', c: ['#d8922a', '#f0b040'], d: 20, r: 2.2 }] : [],                  // amber from their own shore
    heldR: w ? { kind: 'sickle' } : null }),
  artisan: ({ male, w, pick }) => ({ hair: male ? 'tail' : 'bun', beard: pick(['short', 'full']), mood: w > 1 ? 'proud' : 'calm', poseL: 'hip', poseR: 'hold', place: 'workshop',
    // a shipwright or smith. Wealth shows in the order a craftsman buys things: first dye, then a good apron and silver at
    // the wrist, last a master's cap, a trimmed tunic and the guild's token (a journeyman wears his master's cast-offs, patched)
    garment: { c: w === 0 ? 'hemp' : w === 1 ? pick(['grey', 'walnut', 'russet']) : 'woad', neck: 'round', under: 'linen', patches: w === 0 ? [[-30, 40]] : null, patchC: '#b3a58d', trim: w > 1 ? T('cream', 'knots', 5, '#46648a') : null }, sleeves: { kind: 'rolled' },
    over: { kind: 'smith', c: w === 0 ? 'tan' : 'dark', pocket: w > 0, trim: w > 1 ? T('mustard', 'dots', 4) : null }, belt: w === 0 ? { kind: 'rope' } : { kind: w > 1 ? 'studs' : 'leather', c: 'dark', buckle: w > 1 ? 'bronze' : 'iron' },
    hat: w > 1 ? { kind: 'cap', c: 'woad', up: 6, trim: T('cream', 'knots', 4), feather: 'white' } : w === 0 ? { kind: 'rag', c: 'hemp' } : null,
    bands: w ? { L: { m: metalOf('silver'), wrist: 1, n: w } } : null, heldR: { kind: 'hammer' },
    neck: w > 1 ? [{ kind: 'chain', m: 'bronze', d: 26, t: 2, pend: { k: 'disc', m: 'bronze', r: 5.5 } }] : [] }),
  merchant: ({ male, w, pick }) => ({ hair: male ? 'mid' : 'braid', beard: 'forked', mood: 'proud', poseL: 'offer', poseR: 'belt', place: 'market',
    // a long coat lined and edged with fur: the north's wealth is fur, amber and walrus ivory, and a merchant wears his stock
    garment: { c: 'forest', neck: 'round', trim: T('mustard', 'knots', 5), under: 'linen', front: { k: 'studs', c: '#c9a24a', n: 5 } },
    over: { kind: 'coat', c: 'murrey', fleece: 'fox', gap: 16 }, coatSleeves: 1, sleeves: { trim: T('mustard', 'knots', 5) },
    belt: { kind: 'studs', c: 'brown', buckle: 'bronze', hang: [{ k: 'purse', x: 30, c: 'red', clasp: '#c9a24a', fat: 1 }, { k: 'keys', x: -32 }] },
    hat: { kind: 'furhat', c: 'murrey', fur: 'fox', up: 7 }, neck: [{ kind: 'beads', c: ['#d8922a', '#f0b040', '#b86a1c'], d: 30, r: 2.6, big: 4 }],
    heldL: { kind: 'scales', m: 'bronze' } }),
  clergy: ({ male, w }) => ({ hair: male ? 'crop' : 'bun', beard: 'full', mood: 'calm', poseL: 'raise', poseR: 'heart', place: 'shrine',
    // the Seven Halls: undyed white wool, seven bars on the stole, a lamp-keeper's staff; a cowl against the cold of a vigil
    garment: { c: 'cream', neck: 'round', under: 'white' }, sleeves: { kind: 'wide' },
    mantle: { kind: 'stole', c: 'grey', motif: 'bars', c2: '#f0f0f4', w: 11, step: 9 }, mantle2: male ? { kind: 'hood', c: 'grey', d: 24 } : null,
    hat: male ? null : { kind: 'wimple', c: 'white' }, belt: { kind: 'rope', c: 'white', side: 12 },
    neck: [{ kind: 'chain', m: 'silver', d: 34, t: 1.6, pend: { k: 'wheel', m: 'silver' } }], pole: { hand: -1, kind: 'staff', top: 44, wood: '#d8d0c0' } }),
  soldier: ({ male, w, realm, pick }) => ({ hair: 'mid', beard: pick(['full', 'braided']), mood: 'stern', poseL: 'raise', poseR: 'down', place: 'camp',
    // mail over a padded coat, the riveted helm with its nose-bar, a round linden shield in the realm's colours, a bearded axe:
    // iron is cheap in the north, horses are not, so its soldiers are heavy foot
    garment: { c: 'walnut', neck: 'round' }, over: { kind: 'mail', metal: 'iron', collar: 'walnut' }, sleeves: { kind: 'long' },
    belt: { kind: 'leather', c: 'dark', buckle: 'iron', hang: [{ k: 'knife', x: 30, m: 'iron', cap: 1 }] },
    hat: { kind: 'spangen', m: 'iron', frame: 'bronze' }, shield: { kind: 'round', c: realm.field || 'woad', c2: realm.field2 || 'cream', parts: 'quarter', rim: 'iron', side: 1, device: realm.charge },
    bands: w ? { L: { m: metalOf('silver'), n: w } } : null,                                        // a ring for each season served: the north's rank and its pay
    pole: { hand: -1, kind: 'axe', top: 40 } }),
  noble: ({ male, w, realm, pick }) => ({ hair: male ? 'plaits' : 'braids', beard: 'braided', mood: male ? 'stern' : 'proud', poseL: 'pommel', poseR: male ? 'hip' : 'heart', place: 'hall',
    // a jarl: fine mail, a wolf's pelt on the sword shoulder, the cloak pinned with a ring brooch, silver rings to give away
    garment: { c: 'navy', neck: 'round', trim: T('grey', 'knots', 5, '#e4e3e2') }, over: male ? { kind: 'mail', metal: 'steel', collar: 'navy' } : null, sleeves: { trim: T('grey', 'knots', 5, '#e4e3e2') },
    belt: { kind: 'plaques', c: 'dark', buckle: 'silver' }, hilt: { kind: 'lobed', fit: 'silver', scab: 'red', gem: '#d8922a' },
    mantle: { kind: 'cloak', c: 'woad', pin: 1, trim: T('grey', 'knots', 5, '#e4e3e2'), brooch: { k: 'ring', m: 'silver', r: 7 } }, mantle2: { kind: 'pelt', fur: 'wolf', side: -1, paw: 1 },
    neck: [{ kind: 'torc', m: 'silver' }], bands: { R: { m: metalOf('silver'), n: 2 } }, hat: male ? null : { kind: 'circlet', m: 'silver', w: 3.4, gem: '#d8922a' },
    earrings: male ? null : [{ c: '#b8bcc4' }, { c: '#b8bcc4' }] }),
  royal: ({ male, realm }) => ({ hair: 'mid', beard: 'full', mood: 'stern', poseL: 'pommel', poseR: 'belt', place: 'court', yaw: .12,
    // heavy furs and dark metal (order 58): a crown of black iron with gold only at the rivets, a bear's skin, blued scale,
    // and the Ring itself on a chain: the king of Northreach rules with the Ring of jarls, and wears what binds him
    garment: { c: 'charcoal', neck: 'round', trim: T('navy', 'knots', 6, '#b8bcc4') }, over: { kind: 'scale', metal: 'blued', collar: 'charcoal' }, sleeves: { trim: T('navy', 'knots', 6, '#b8bcc4') },
    belt: { kind: 'plaques', c: 'black', buckle: 'silver', w: 9 }, hilt: { kind: 'lobed', fit: 'gold', scab: 'black', gem: '#9c1f2c', m: 'black' },
    mantle: { kind: 'cloak', c: 'navy', g: 10, lining: 'crimson', fur: 'bear', brooch: null }, mantle2: { kind: 'fur', fur: 'sable', d: 34, amp: 4.6 },
    neck: [{ kind: 'chain', m: 'silver', d: 46, t: 3.2, w: 30, pend: { k: 'wheel', m: 'silver' } }], hat: { kind: 'ironcrown', m: 'black', g: 'gold', fur: 'sable', gem: '#9c1f2c' }, bands: { both: { m: metalOf('silver'), wrist: 1, n: 2 } } }),
};
const desert = {
  motif: 'diamonds', land: 'desert',
  hairM: ['crop', 'swept'], hairF: ['long', 'braid', 'wavy'], beards: ['pointed', 'short', 'moustache', 'goatee', 'full'],
  serf: ({ male, pick }) => ({ hair: male ? 'crop' : 'long', beard: 'stubble', mood: 'meek', poseL: 'down', poseR: 'hold',
    // unbleached cotton, a rope for a girdle, the allotted headcloth held by one cord; the well-warden's copper tally at the
    // neck says how much water the household still owes
    garment: { c: 'undyed', neck: 'v', patches: [[-24, 84]], patchC: '#c9bca6' }, sleeves: { kind: 'rolled' },
    belt: { kind: 'rope', side: 14 }, hat: male ? { kind: 'headcloth', c: 'hemp', cord: 'walnut' } : { kind: 'veil', c: 'hemp' },
    neck: [{ kind: 'cord', d: 30, pend: { k: 'tag', m: 'bronze' } }], heldR: { kind: 'basket', fill: '#7a3a1c' } }),
  peasant: ({ male, w, pick }) => ({ hair: male ? 'crop' : 'braid', beard: pick(['short', 'moustache']), mood: 'warm', poseL: 'down', poseR: 'mid',
    // a striped robe (their own weaving), a dyed sash, and the curved knife in it: a free man's mark, forbidden to the bound
    garment: { c: 'cream', neck: 'v', under: 'white', pat: 'stripes', patC: pick(['woad', 'teal', 'russet']), patW: 13, patW2: 3, trim: w ? T('woad', 'diamonds', 4.4, '#e4dccb') : null },
    belt: { kind: 'sash', c: pick(['teal', 'madder', 'woad']), w: 15, fringe: w > 1 ? 'mustard' : null }, khanjar: { fit: w > 1 ? 'silver' : 'bronze', scab: 'brown', x: 12 },
    mantle: { kind: 'scarf', c: pick(['woad', 'ochre']) }, hat: male ? { kind: 'headcloth', c: 'white', cord: 'black', cord2: 1, stripe: w ? 'woad' : null } : { kind: 'veil', c: 'woad', trim: w ? T('cream', 'dots', 3.6) : null, coins: w > 1 ? 'bronze' : null },
    pole: { hand: 1, kind: 'crook', top: 70 } }),
  artisan: ({ male, w, pick }) => ({ hair: 'crop', beard: 'short', mood: 'warm', poseL: 'hip', poseR: 'offer', place: 'workshop',
    // a worked skullcap (a guild's colours on its band), sleeves rolled, a pocketed apron; copper is Qadir's own metal
    garment: { c: 'cream', neck: 'v', under: 'white' }, sleeves: { kind: 'rolled' }, over: { kind: 'apron', c: 'tan', pocket: 1, trim: w ? T('teal', 'diamonds', 4) : null },
    belt: { kind: 'sash', c: 'teal', w: 12, tails: false }, hat: { kind: 'skullcap', c: 'white', trim: T('teal', 'diamonds', 5, '#e4dccb') },
    heldR: { kind: 'cup', m: 'bronze', over: 1 }, neck: w ? [{ kind: 'cord', d: 24, pend: { k: 'amulet', m: 'bronze', c: '#2f6a6a' } }] : [] }),
  merchant: ({ male, w, pick }) => ({ hair: male ? 'crop' : 'long', beard: 'goatee', mood: 'proud', poseL: 'chest', poseR: 'belt', place: 'market',
    // layers of fine cloth in a hot land show wealth better than weight: a brocade coat over a striped robe, a large turban
    // with its end left hanging, prayer beads, a silver-hilted dagger
    garment: { c: 'cream', neck: 'v', under: 'white', pat: 'stripes', patC: 'mustard', patW: 9, patW2: 2, front: { k: 'buttons', c: '#c9a24a', n: 6, r: 1.6 } },
    over: { kind: 'coat', c: 'teal', pat: 'stars', patC: 'mustard', patOp: .7, trim: T('mustard', 'diamonds', 5.4, '#215a5e'), gap: 15 }, coatSleeves: 1, sleeves: { kind: 'wide', trim: T('mustard', 'diamonds', 5.4, '#215a5e') },
    belt: { kind: 'sash', c: 'mustard', w: 16, fringe: 'crimson' }, khanjar: { fit: 'silver', scab: 'crimson', gem: '#2f5fa8' },
    hat: male ? { kind: 'turban', c: 'woad', size: 1.12, tail: -1, kulah: 'crimson', stripe: 'mustard' } : { kind: 'veil', c: 'teal', trim: T('mustard', 'dots', 4), coins: 'gold', long: 1 },
    heldL: { kind: 'ledger', over: 1 }, neck: male ? [] : [{ kind: 'chain', m: 'gold', d: 30, pend: { k: 'crescent', m: 'gold' } }] }),
  clergy: ({ male }) => ({ hair: 'crop', beard: 'full', mood: 'warm', poseL: 'down', poseR: 'chest', place: 'shrine',
    // the Path of the Well: plain white (the faith distrusts display), a white turban with a long tail to veil the face in
    // prayer, a sky-blue stole for water, beads to count the stations of the Path
    garment: { c: 'white', neck: 'v', under: 'white' }, sleeves: { kind: 'wide' }, mantle: { kind: 'stole', c: '#6aa0c8', motif: 'waves', c2: '#ffffff', w: 10, step: 12 },
    belt: { kind: 'sash', c: 'white', w: 12, tails: false, hang: [{ k: 'beads', x: 26, c: '#2f6a8a', c2: '#c9a24a' }] }, hat: { kind: 'turban', c: 'white', size: 1.05, tail: 1 },
    heldR: { kind: 'book', c: 'teal', over: 1 }, back: [{ k: 'pole', kind: 'crescentstaff', side: -1, dx: 8, top: 56, wood: '#5a4028', m: 'silver' }] }),
  soldier: ({ male, w, realm }) => ({ hair: 'crop', beard: 'moustache', mood: 'stern', poseL: 'pommel', poseR: 'raise', place: 'camp',
    // a lancer of the Sultan's household: mail under a cotton coat (bare steel cooks a man), a pointed helm wound with cloth
    // and hung with mail, a small steel shield, a sabre; the sash in the Sultan's colour is his livery and his rank
    garment: { c: 'cream', neck: 'v', under: 'white' }, over: { kind: 'mail', metal: 'steel', collar: 'cream' }, over2: { kind: 'tabard', c: 'cream', narrow: 1, trim: T(realm.field || 'teal', 'diamonds', 4.4, '#e4dccb') },
    belt: { kind: 'sash', c: realm.field || 'teal', w: 15, fringe: w ? 'mustard' : null }, hilt: { kind: 'sabre', fit: 'bronze', scab: 'brown', tassel: w ? 'crimson' : null },
    hat: { kind: 'turbanhelm', m: 'steel', c: 'cream', inlay: w > 1 ? 'diamonds' : null }, back: [{ k: 'shield', kind: 'buckler', side: -1, inlay: 1, r: 32 }],
    pole: { hand: 1, kind: 'lance', top: 34, pennon: realm.field || 'teal', device: realm.charge } }),
  noble: ({ male, w, realm }) => ({ hair: male ? 'swept' : 'long', beard: 'pointed', mood: 'proud', poseL: 'pommel', poseR: 'chest', place: 'hall',
    // an emir: a breastplate chased with gold key-work under an open coat of figured silk, a jewelled turban with one
    // heron plume (two are the Sultan's alone), a hawk-pommelled sabre
    garment: { c: 'white', neck: 'high', trim: T('mustard', 'diamonds', 4) }, over: { kind: 'cuirass', metal: 'steel', edge: 'gold', engrave: 'key', collar: 'white' },
    over2: { kind: 'coat', c: 'ochre', pat: 'brocade', patC: 'crimson', patOp: .6, trim: T('crimson', 'key', 6, '#f0d890'), gap: 30 }, coatSleeves: 1, sleeves: { kind: 'wide', trim: T('crimson', 'key', 6, '#f0d890') },
    belt: { kind: 'sash', c: 'crimson', w: 16, fringe: 'mustard' }, khanjar: { fit: 'gold', scab: 'navy', gem: '#9c1f2c', x: 10 }, hilt: { kind: 'sabre', fit: 'gold', scab: 'navy', tassel: 'mustard' },
    hat: male ? { kind: 'turban', c: 'navy', size: 1.15, gem: '#9c1f2c', plume: { n: 1, len: 26, c: 'white' }, stripe: 'mustard', goldband: 'dots' } : { kind: 'veil', c: 'crimson', trim: T('mustard', 'diamonds', 4.4), coins: 'gold', long: 1 },
    neck: [{ kind: 'chain', m: 'gold', d: 30, pend: { k: 'gem', gem: '#2f5fa8', m: 'gold' } }] }),
  royal: ({ male }) => ({ hair: 'crop', beard: 'full', mood: 'calm', poseL: 'heart', poseR: 'belt', place: 'court', yaw: -.12,
    // desert silks, a layered turban, geometric goldwork (order 58): no crown and no fur. The Sultan's turban is the largest
    // in the realm, banded with gold, two plumes; a white silk robe under a midnight mantle edged with the key pattern of the Seal
    garment: { c: 'white', neck: 'high', pat: 'diaper', patC: 'mustard', patOp: .55, trim: T('mustard', 'diamonds', 5), front: { k: 'frogs', c: '#c9a24a', n: 5 } },
    over: { kind: 'coat', c: 'navy', pat: 'stars', patC: 'mustard', patOp: .8, trim: T('mustard', 'key', 8, '#1c2848'), gap: 26, g: 5 }, coatSleeves: 1, sleeves: { kind: 'wide', trim: T('mustard', 'key', 8, '#1c2848') },
    belt: { kind: 'sash', c: 'mustard', w: 18, pat: 'diaper', patC: 'crimson', fringe: 'crimson' }, khanjar: { fit: 'gold', scab: 'crimson', gem: '#2f8f6a', x: 6 },
    hat: { kind: 'sultan', c: 'white', gem: '#2f8f6a', plume: { n: 2, len: 30, c: 'white' }, goldband: 'diamonds', kulah: 'crimson' },
    neck: [{ kind: 'collar', c: ['#c9a24a', '#f4efe2', '#c9a24a'], rows: 3, d: 20, m: 'gold', pend: { k: 'gem', gem: '#2f8f6a', m: 'gold' } }], heldR: null }),
};
const steppe = {
  motif: 'scroll', land: 'steppe',
  hairM: ['plaits', 'tail', 'knot'], hairF: ['braids', 'braid'], beards: ['long-moustache', 'goatee', 'moustache', 'none'],
  serf: ({ male, pick }) => ({ hair: male ? 'crop' : 'braid', beard: 'none', mood: 'meek', poseL: 'down', poseR: 'hold',
    // a bondsman herds another man's animals: a patched coat of undyed felt closed with wooden toggles, a rope girdle, a felt
    // cap with no fur to it (fur is a free rider's), and his owner's brand burned on a leather tag
    garment: { c: 'hemp', neck: 'crossR', toggles: '#6a4a2a', patches: [[-34, 70]], patchC: '#b3a58d', under: 'undyed' }, sleeves: { patch: '#b3a58d', patchSide: 1 },
    belt: { kind: 'rope' }, hat: male ? { kind: 'cone', c: 'undyed', fur: false, brim: 'hemp' } : { kind: 'kerchief', c: 'undyed' },
    neck: [{ kind: 'cord', d: 26, pend: { k: 'amulet', m: 'iron', c: '#5a3a22' } }], heldR: { kind: 'lasso' } }),
  peasant: ({ male, w, pick, r }) => { const pose = pick([['belt', 'hip'], ['hip', 'hold'], ['down', 'belt'], ['hold', 'down'], ['heart', 'hip']]), hatM = pick([{ kind: 'cone', c: pick(['russet', 'walnut', 'teal']), fur: pick(['fox', 'hare', 'wolf']), tip: '#c9a24a' }, { kind: 'furhat', c: pick(['madder', 'ochre']), fur: 'wolf', up: 9 }, { kind: 'band', c: 'crimson', motif: 'dots', w: 5, c2: '#e8d9a8' }]), vest = r() < .65;
    return { hair: male ? pick(['plaits', 'tail', 'knot']) : pick(['braids', 'braid']), beard: pick(['long-moustache', 'none', 'goatee']), mood: pick(['warm', 'calm', 'proud']), poseL: pose[0], poseR: pose[1],
    // a free herder: a dyed coat with a scrolled edge, a sheepskin vest against the wind, a fur-brimmed hat, and on the belt
    // everything a rider needs within reach: knife, cup, fire-steel. The cut is the people's; dye, hat and hair are his own
    garment: { c: pick(['russet', 'madder', 'teal', 'ochre', 'woad']), neck: 'crossR', toggles: '#c9a24a', trim: T(pick(['ochre', 'cream', 'walnut']), 'scroll', 5, '#6a4a2a'), under: 'cream' }, sleeves: { trim: w ? T('ochre', 'scroll', 5, '#6a4a2a') : null, kind: w === 0 && r() < .5 ? 'rolled' : 'long' },
    over: vest ? { kind: 'vest', c: pick(['tan', 'brown']), fleece: 'hare', gap: 30 } : null, mantle: vest ? null : (r() < .5 ? { kind: 'scarf', c: pick(['cream', 'woad', 'madder']), tail: 1 } : null),
    belt: { kind: w > 1 ? 'plaques' : 'leather', c: 'brown', buckle: 'bronze', hang: [{ k: 'knife', x: -32, m: 'iron', grip: '#d8caa6' }, ...(w ? [{ k: 'cup', x: 30 }] : []), ...(w > 1 ? [{ k: 'horn', x: 14 }] : [])] },
    hat: male ? hatM : { kind: 'furhat', c: pick(['madder', 'teal']), fur: 'hare', up: 10 }, hairTie: pick(['#b8322a', '#2f8f9a', '#c9a24a']),
    heldL: pose[0] === 'hold' ? { kind: 'lasso' } : null, heldR: pose[1] === 'hold' ? { kind: 'lasso' } : null,
    neck: w ? [{ kind: 'beads', c: ['#2f8f9a', '#b8322a'], d: 18, r: 2 }] : [] }; },
  artisan: ({ male, w, pick }) => ({ hair: 'tail', beard: 'goatee', mood: 'calm', poseL: 'hold', poseR: 'down', place: 'workshop',
    // a bowyer: the coat's right sleeve slipped off and tied at the waist to free the working arm (a steppe habit), a horn
    // thumb-ring on a cord, a bow in the making
    garment: { c: 'ochre', neck: 'crossR', toggles: '#3a2a1c', trim: T('walnut', 'scroll', 4.4, '#c7a03a'), under: 'cream' }, sleeves: { kind: 'rolled' },
    over: { kind: 'harness', c: 'brown', one: 1, w: 6 }, belt: { kind: 'leather', c: 'dark', buckle: 'bronze', hang: [{ k: 'knife', x: 28, m: 'iron' }] },
    hat: { kind: 'cap', c: 'walnut', up: 7, seams: 1, button: '#b8322a', brim: 'brown' }, heldL: { kind: 'awl' }, back: [{ k: 'bow', kind: 'recurve', side: 1 }],
    neck: [{ kind: 'cord', d: 22, pend: { k: 'disc', m: 'bronze', r: 3.4 } }] }),
  merchant: ({ male, w, pick }) => ({ hair: male ? 'plaits' : 'braids', beard: 'long-moustache', mood: 'proud', poseL: 'offer', poseR: 'hip', place: 'market',
    // a horse-trader of the Horse Road: silk got in trade, worn in the steppe cut; a belt of bronze plaques (each one a
    // good year); coral and turquoise in the hair of a woman because wealth here must be able to ride away
    garment: { c: 'purple', neck: 'crossR', toggles: '#c9a24a', pat: 'clouds', patC: 'mustard', patOp: .6, trim: T('mustard', 'scroll', 6, '#4c2a64'), under: 'cream' }, sleeves: { trim: T('mustard', 'scroll', 6, '#4c2a64') },
    belt: { kind: 'plaques', c: 'red', buckle: 'bronze', hang: [{ k: 'purse', x: 30, c: 'red', clasp: '#c9a24a', fat: 1 }, { k: 'horn', x: -34 }] },
    mantle: { kind: 'fur', fur: 'fox', d: 22, amp: 3 }, hat: male ? { kind: 'cone', c: 'purple', fur: 'fox', tip: '#c9a24a', tassel: '#b8322a' } : { kind: 'band', c: 'crimson', motif: 'dots', w: 6, c2: '#2f8f9a' },
    hairTie: '#2f8f9a', neck: [{ kind: 'beads', c: ['#b8322a', '#2f8f9a', '#f4efe2'], d: 26, r: 2.4, big: 5 }], heldL: { kind: 'coins' }, earrings: male ? null : [{ c: '#c9a24a', drop: '#2f8f9a' }, { c: '#c9a24a', drop: '#2f8f9a' }] }),
  clergy: ({ male }) => ({ hair: 'long', beard: 'none', mood: 'calm', poseL: 'raise', poseR: 'down', place: 'shrine',
    // a sky-priest of the Eternal Blue: the sky's own colour, a cap hung with ribbons that veil the eyes when the spirit
    // comes, a bronze mirror on the breast to turn harm back, a staff with a white horse's tail
    garment: { c: '#3f78b8', neck: 'crossR', toggles: '#f4efe2', trim: T('white', 'waves', 5, '#3f78b8'), under: 'white' }, sleeves: { kind: 'wide', trim: T('white', 'waves', 5, '#3f78b8') },
    belt: { kind: 'sash', c: 'white', w: 13, side: 30 }, hat: { kind: 'shaman', c: '#2f5f9a', band: 'crimson' },
    neck: [{ kind: 'beads', c: ['#f4efe2', '#8a6a44'], d: 22, r: 2 }, { kind: 'cord', d: 40, pend: { k: 'disc', m: 'bronze', r: 7.5 } }], pole: { hand: -1, kind: 'spiritstaff', top: 46 } }),
  soldier: ({ male, w, realm }) => ({ hair: 'plaits', beard: 'long-moustache', mood: 'stern', poseL: 'belt', poseR: 'down', place: 'camp',
    // a horse archer wears no helm on the march (order 58): a fox-brimmed hat, a lamellar vest laced in his clan's colour
    // over the riding coat, the horn bow and a full quiver; his rank is the count of plaques on his belt
    garment: { c: 'russet', neck: 'crossR', toggles: '#3a2a1c', trim: T('ochre', 'scroll', 4.4, '#6a4a2a'), under: 'cream' }, over: { kind: 'lamellar', metal: 'iron', lace: realm.lace || '#b8322a' },
    belt: { kind: 'plaques', c: 'dark', buckle: 'bronze' }, hilt: { kind: 'sabre', fit: 'bronze', scab: 'dark', side: -1 },
    hat: { kind: 'cone', c: 'walnut', fur: 'fox', tip: realm.lace || '#b8322a' }, back: [{ k: 'bow', kind: 'recurve', side: 1 }, { k: 'quiver', side: -1, c: 'brown', fletch: 'white', motif: 'scroll', trim: 'ochre' }] }),
  noble: ({ male, w, realm }) => ({ hair: 'plaits', beard: 'goatee', mood: 'proud', poseL: 'hip', poseR: 'mid', place: 'hall',
    // a noyan, lord of a thousand: gilded lamellar, the plumed helm, a snow-leopard collar, and the mace of command
    garment: { c: 'crimson', neck: 'crossR', toggles: '#c9a24a', pat: 'clouds', patC: 'mustard', patOp: .5, trim: T('mustard', 'scroll', 6, '#861d2a'), under: 'cream' }, sleeves: { trim: T('mustard', 'scroll', 6, '#861d2a') },
    over: { kind: 'lamellar', metal: 'bronze', lace: '#1c2848' }, belt: { kind: 'plaques', c: 'red', buckle: 'gold', w: 8 }, hilt: { kind: 'sabre', fit: 'gold', scab: 'red', tassel: 'mustard' },
    mantle: { kind: 'fur', fur: 'hare', d: 20, amp: 3.4, spots: '#3a3038' }, hat: { kind: 'steppehelm', m: 'bronze', lace: '#1c2848', tail: '#f4efe2' },
    pole: { hand: 1, kind: 'mace', above: 64, below: 44, m: 'gold', tuft: 'crimson' }, neck: [{ kind: 'chain', m: 'gold', d: 34, t: 2, pend: { k: 'disc', m: 'gold', r: 5.5 } }] }),
  royal: ({ male }) => ({ hair: 'plaits', beard: 'long-moustache', mood: 'stern', poseL: 'belt', poseR: 'hip', place: 'court', yaw: .14,
    // steppe regalia, leather and clan insignia (order 58): no crown. The Khan's hat is the crown: sable brim, a tall crown
    // with the gold plaque of the Compact, hawk plumes; the sky's blue silk, a belt of gold plaques, a harness with the nine
    // tribes' boss, and behind him the standard of nine horse-tails
    garment: { c: '#2f6ab0', neck: 'crossR', toggles: '#c9a24a', pat: 'clouds', patC: 'mustard', patOp: .75, trim: T('mustard', 'scroll', 8, '#1c2848'), under: 'cream' }, sleeves: { trim: T('mustard', 'scroll', 8, '#1c2848') },
    over: { kind: 'harness', c: 'red', w: 8, motif: 'dots', c2: '#f0d890', boss: 'gold' }, belt: { kind: 'plaques', c: 'red', buckle: 'gold', w: 10, hang: [{ k: 'knife', x: 34, m: 'gold', grip: '#f4efe2', cap: 1, c: 'red' }] },
    mantle: { kind: 'fur', fur: 'sable', d: 22, amp: 4, tails: '#f4efe2' }, hat: { kind: 'khanhat', c: '#2f6ab0', fur: 'sable', plaque: '#9c1f2c', plumes: 3, plume: '#6a5240', flap: 'crimson' },
    neck: [{ kind: 'beads', c: ['#b8322a', '#2f8f9a', '#c9a24a'], d: 34, r: 2.6, big: 3 }], back: [{ k: 'pole', kind: 'standard', side: 1, dx: 26, top: 60 }], bands: { both: { m: metalOf('gold'), wrist: 1 } } }),
};
const south = {
  motif: 'zig', land: 'south',
  hairM: ['coils', 'crop', 'locs', 'coilsfull'], hairF: ['coilsfull', 'locs', 'coils'], beards: ['none', 'short', 'goatee', 'stubble'],
  serf: ({ male, pick }) => ({ hair: 'crop', beard: 'none', mood: 'meek', poseL: 'down', poseR: 'mid',
    // house-bound to a lord's stool: plain undyed cloth, no pattern (patterns belong to lineages that own themselves), an iron
    // ring on the arm stamped with the house's mark, the lord's hoe, the day's kola for his store
    garment: male ? { cut: 'wrap', c: 'undyed' } : { cut: 'drape', c: 'undyed', side: -1 }, bands: { L: { m: metalOf('iron'), at: 30 } },
    neck: [{ kind: 'cord', d: 24, pend: { k: 'tag', m: 'iron' } }], hat: male ? null : { kind: 'rag', c: 'undyed' },
    pole: { hand: 1, kind: 'hoe', top: 66 } }),
  peasant: ({ male, w, pick }) => ({ hair: male ? pick(['coils', 'locs']) : 'coilsfull', beard: pick(['none', 'short']), mood: 'warm', poseL: 'hold', poseR: 'hip',
    // a free compound: strip-woven cloth in the family's own pattern, clay and seed beads, a copper bracelet, their own hoe
    garment: { cut: 'drape', c: pick(['ochre', 'russet', 'mustard']), side: -1, pat: 'bands', patC: pick(['woad', 'navy', 'madder']), patC2: 'cream', patW: 22, trim: w ? T('cream', 'zig', 5, '#1c2848') : null },
    hat: male ? (w ? { kind: 'cap', c: 'madder', up: 4, trim: T('cream', 'zig', 4, '#1c2848') } : null) : { kind: 'wrap', c: pick(['madder', 'woad']), up: 12, flare: 6, trim: w ? T('cream', 'zig', 4) : null },
    neck: [{ kind: 'beads', c: ['#b0452a', '#f2ead6', '#3a2a1c'], d: 18, r: 2.1 }, ...(w ? [{ kind: 'beads', c: ['#c7a03a', '#b0452a'], d: 28, r: 2.3 }] : [])],
    wrist: { L: { m: 'bronze', r: 8, n: w ? 2 : 1 } }, heldL: { kind: 'basket', fill: '#c98a2a' }, earrings: male ? null : [{ c: '#b9853a' }, { c: '#b9853a' }] }),
  artisan: ({ male, w, pick }) => ({ hair: 'locs', beard: 'short', mood: 'calm', poseL: 'hold', poseR: 'hip', place: 'workshop', hairCuffs: '#b9853a',
    // a bronze-caster of the royal quarter: a hide apron over the wrap, copper rings up the forearm (a caster wears a sample of
    // his alloys), the crucible in the tongs
    garment: { cut: 'wrap', c: 'mustard', pat: 'bands', patC: 'madder', patC2: 'navy', patW: 24 }, over: { kind: 'smith', c: 'brown' },
    bands: { R: { m: metalOf('bronze'), at: 30, n: 2 } }, wrist: { R: { m: 'bronze', r: 8, n: 3 } }, heldL: { kind: 'tongs' },
    neck: [{ kind: 'beads', c: ['#c7a03a', '#3a2a1c'], d: 16, r: 2.2 }], hat: w > 1 ? { kind: 'cap', c: 'madder', up: 3, trim: T('mustard', 'zig', 4) } : null }),
  merchant: ({ male, w, pick }) => ({ hair: male ? 'coils' : 'coilsfull', beard: 'short', mood: 'proud', poseL: 'hip', poseR: 'offer', place: 'market',
    // gold and kola: the richest cloth is the most strips and the most colours; trade beads from four coasts in the collar;
    // gold in the ears; the headwrap stands as high as the purse allows
    garment: { cut: 'drape', c: 'madder', side: -1, pat: 'zig', patC: 'mustard', patC2: 'navy', patW: 20, trim: T('mustard', 'diamonds', 6, '#861d2a') },
    over: null, hat: { kind: 'wrap', c: 'mustard', up: 22, flare: 13, pat: null, trim: T('madder', 'zig', 4.4, '#f0e6c8'), knot: 1 },
    neck: [{ kind: 'collar', c: ['#b8322a', '#2a447e', '#f2ead6', '#c7a03a'], rows: 4, d: 14 }], bands: { R: { m: metalOf('gold'), at: 28, n: 2 } }, wrist: { L: { m: 'gold', r: 8, n: 2 } },
    earrings: [{ c: '#d0a23a', r: 3.4 }, { c: '#d0a23a', r: 3.4 }], heldR: { kind: 'scales', m: 'gold' } }),
  clergy: ({ male }) => ({ hair: 'crop', beard: 'none', mood: 'calm', poseL: 'down', poseR: 'raise', place: 'shrine',
    // a speaker for the Thousand Ancestors: white for the dead, chalk on the brow and cheeks so the dead can find the face,
    // cowries (the ancestors' coin), a calabash staff
    garment: { cut: 'drape', c: 'white', side: -1, trim: T('cream', 'bars', 5, '#8a7a5a') }, hat: { kind: 'feathers', c: 'white', n: 3, band: 'white', motif: 'dots' },
    neck: [{ kind: 'beads', c: ['#f2ead6'], d: 18, r: 2.6, k: '#5a4a34' }, { kind: 'cord', d: 34, pend: { k: 'amulet', m: 'bronze', c: '#5a3a22' } }], wrist: { R: { m: 'bronze', r: 8 } },
    pole: { hand: 1, kind: 'gourdstaff', top: 60 }, paint: (s, Hd, sk) => { const y = Hd.y0; let d = ''; for (const dx of [-12, -6, 0, 6, 12]) { const p = Hd.hp(dx, -17); d += `M${p[0] - 1.6} ${p[1]}a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0Z`; } for (const sg of [-1, 1]) for (const k of [0, 1, 2]) { const p = Hd.hp(sg * (17 + k * 3.4), 13 + k * .6); d += `M${p[0] - .9} ${p[1] - 3.4}h1.8v6.8h-1.8Z`; } s.fill(d, '#f6f1e6', .92); } }),
  soldier: ({ male, w, realm }) => ({ hair: 'crop', beard: 'none', mood: 'stern', poseL: 'down', poseR: 'mid', place: 'camp',
    // a spearman of an age-regiment: quilted cotton (mail rusts and stifles in the forest), a hide cap sewn with cowries and
    // crested in the regiment's colour, the tall painted shield, the broad-bladed spear; rank is a string of beads
    garment: null, over: { kind: 'quilt', c: realm.field || 'madder', diamond: 1, ties: '#f2ead6', trim: T('cream', 'zig', 4.4, '#1c2848') },
    belt: { kind: 'sash', c: 'cream', w: 12, pat: 'bands', patC: 'navy', patC2: 'madder', patW: 9, patW2: 3, patRot: 90, tails: false }, hilt: w > 1 ? { kind: 'leaf', fit: 'bronze', scab: 'brown' } : null,
    hat: { kind: 'hidecap', c: 'tan', crest: realm.field || 'scarlet' }, shield: { kind: 'tall', c: realm.field || 'madder', c2: 'cream', c3: 'black', side: -1 },
    bands: { both: { m: metalOf('bronze'), at: 34 } }, neck: [{ kind: 'beads', c: w ? ['#f2ead6', '#b8322a'] : ['#f2ead6'], d: 12, r: 2 }], pole: { hand: 1, kind: 'broadspear', top: 62, tuft: realm.field || 'scarlet' }, bareArms: 1 }),
  noble: ({ male, w, realm }) => ({ hair: 'coils', beard: 'short', mood: 'proud', poseL: 'hip', poseR: 'pommel', place: 'hall',
    // a keeper of spears: a cast bronze breastplate with the sun-boss, the leopard's skin that only war-lords may wear,
    // gold on both arms, the leaf-bladed sword of office
    garment: { cut: 'wrap', c: 'purple', pat: 'zig', patC: 'mustard', patC2: 'cream', patW: 20 }, over: { kind: 'cuirass', metal: 'bronze', edge: 'gold', boss: 1, rivets: 1 },
    belt: { kind: 'sash', c: 'madder', w: 14, pat: 'bands', patC: 'mustard', patC2: 'navy', patW: 9, patW2: 3, patRot: 90, tails: false }, hilt: { kind: 'leaf', fit: 'gold', scab: 'red', side: 1 },
    mantle: { kind: 'pelt', fur: '#d8a850', side: -1, paw: 1, spots: '#2a1c14' }, hat: { kind: 'fillet', m: 'gold', w: 4.4, gem: '#9c1f2c', drops: '#f2ead6' },
    bands: { both: { m: metalOf('gold'), at: 30, n: 2 } }, wrist: { R: { m: 'gold', r: 8.6, n: 2 } }, neck: [{ kind: 'beads', c: ['#c7a03a', '#b8322a'], d: 10, r: 2.4 }], earrings: [{ c: '#d0a23a' }, { c: '#d0a23a' }] }),
  royal: ({ male }) => ({ hair: 'coils', beard: 'short', mood: 'calm', poseL: 'heart', poseR: 'mid', place: 'court', yaw: -.14,
    // elaborate woven textiles, distinctive jewellery, ceremonial armour (order 58): the bead crown whose fringe hides the
    // face of the one who sits for the ancestors; royal strip-cloth of every lineage's colour; a gold collar of four rows,
    // a cast gold breast-disc, the fly-whisk of judgment
    garment: { cut: 'drape', c: 'mustard', side: -1, pat: 'zig', patC: 'crimson', patC2: 'navy', patW: 18, trim: T('crimson', 'diamonds', 7, '#f0d890') },
    over: { kind: 'harness', c: 'red', one: 1, w: 7, motif: 'dots', c2: '#f0d890', boss: 'gold' }, hat: { kind: 'beadcrown' },
    neck: [{ kind: 'collar', c: ['#d0a23a', '#b8322a', '#d0a23a', '#2a447e'], rows: 4, d: 12, m: 'gold', pend: { k: 'sun', m: 'gold', r: 6 } }], bands: { both: { m: metalOf('gold'), at: 26, n: 3 } }, wrist: { both: { m: 'gold', r: 8.6, n: 3 }, R: { m: 'gold', r: 8.6, n: 3 }, L: { m: 'gold', r: 8.6, n: 3 } },
    earrings: [{ c: '#d0a23a', r: 3.6 }, { c: '#d0a23a', r: 3.6 }], pole: { hand: 1, kind: 'whisk', above: 14, below: 40 } }),
};
import { metal } from '../palette.js';
function metalOf(name) { return metal(name); }
export const FAMILIES = { north, desert, steppe, south };

// ---- a realm bends its family ---------------------------------------------------------------------------------------------
// Small differences across one border (order 56): the same grammar, another accent. Each entry edits a finished kit.
export const REALM_ACCENT = {
  // Sabra, Qadir's rival across the Gulf: a pearling, seafaring emirate. Belts with a buckle (a sash tail fouls rigging),
  // a flat striped turban with no hanging end (wind), russet and ochre for Qadir's indigo and teal, waves for stars, pearls
  // for gold; its soldiers are marines: no mail (a man in mail drowns), a quilted coat, a boarding axe, a hide target
  Sabra: (kit, station, ctx) => {
    const sw = { teal: 'russet', woad: 'ochre', navy: 'russet', mustard: 'cream', cream: 'cream', crimson: 'teal' }, re = c => sw[c] || c;
    for (const part of [kit.garment, kit.over, kit.over2, kit.mantle]) if (part) { if (part.c) part.c = re(part.c); if (part.patC) part.patC = re(part.patC); if (part.pat === 'stars') part.pat = 'dots'; if (part.trim) { part.trim = { ...part.trim, c: re(part.trim.c), motif: part.trim.motif === 'none' ? 'none' : 'waves' }; } }
    if (kit.sleeves && kit.sleeves.trim) kit.sleeves.trim = { ...kit.sleeves.trim, c: re(kit.sleeves.trim.c), motif: 'waves' };
    if (kit.belt && kit.belt.kind === 'sash') kit.belt = { kind: 'leather', c: 'tan', buckle: 'bronze', w: 8, hang: [{ k: 'knife', x: -28, m: 'bronze', grip: '#f2ead6', cap: 1 }, ...(station === 'merchant' ? [{ k: 'purse', x: 30, c: 'tan', clasp: '#f2ead6', fat: 1 }] : [])] };
    kit.khanjar = null;
    if (kit.hat && kit.hat.kind === 'turban') kit.hat = { kind: 'turban', c: 'cream', size: .82, stripe: 'russet' };
    if (station === 'merchant') { kit.neck = [{ kind: 'beads', c: ['#f6f2ea'], d: 24, r: 2.4, k: '#8a8478' }, { kind: 'beads', c: ['#f6f2ea'], d: 34, r: 2.4, k: '#8a8478' }]; kit.heldL = { kind: 'ledger' }; }
    if (station === 'soldier') { kit.over = { kind: 'quilt', c: 'russet', trim: { c: 'cream', motif: 'waves', w: 4.4 } }; kit.over2 = null; kit.hat = { kind: 'turban', c: 'cream', size: .8, stripe: 'russet', tail: -1 }; kit.back = [{ k: 'shield', kind: 'round', side: -1, c: 'tan', c2: 'russet', r: 36, rim: 'bronze' }]; kit.pole = { ...kit.pole, kind: 'halberd', top: 40 }; kit.hilt = { kind: 'sabre', fit: 'bronze', scab: 'tan' }; kit.belt = { kind: 'leather', c: 'tan', buckle: 'bronze', w: 8 }; }
    return kit; },
  // Aldmark, the empire south of Northreach, same folk: richer ploughland, heavier lords. A cloak clasped at the throat with
  // a chain (the shoulder pin is a seaman's), straw and madder for fur and woad, the eagle for the wolf; its knights ride,
  // so a kite shield and a cross-hilted sword for the round shield and the lobed hilt, and a coat of arms over the mail
  Aldmark: (kit, station, ctx) => {
    if (station === 'peasant') { kit.hat = ctx.male ? { kind: 'straw', band: 'madder' } : { kind: 'kerchief', c: 'white', trim: { c: 'madder', motif: 'bars', w: 4 } }; kit.garment.c = 'madder'; if (kit.garment.trim) kit.garment.trim = { c: 'cream', motif: 'bars', w: 5, c2: '#a13b2f' }; kit.mantle = null; kit.neck = []; kit.belt.buckle = 'iron'; kit.over = { kind: 'apron', c: 'linen' }; }
    if (station === 'noble') { kit.over2 = { kind: 'tabard', c: ctx.realm.field || 'madder', c2: ctx.realm.field2, trim: { c: 'mustard', motif: 'none', w: 3.6 }, charge: ctx.realm.charge }; kit.mantle = { kind: 'cloak', c: 'madder', lining: 'cream', chain: 'gold', brooch: { k: 'disc', m: 'gold', gem: '#2f5fa8', r: 5 } }; kit.mantle2 = null; kit.hilt = { kind: 'arming', fit: 'gold', scab: 'red', gem: '#2f5fa8' }; kit.neck = []; kit.bands = null; kit.hair = 'short'; kit.beard = 'short'; kit.back = [{ k: 'shield', kind: 'kite', side: 1, c: ctx.realm.field || 'madder', c2: ctx.realm.field2, device: ctx.realm.charge }]; kit.garment.trim = null; kit.sleeves = {}; }
    return kit; },
};

// ---- wealth inside one station, and a person's own taste --------------------------------------------------------------------
function taste(kit, ctx) {
  const { r, fam, male } = ctx;
  if (!kit.hair) kit.hair = pickOf(r)(male ? fam.hairM : fam.hairF);
  if (!male) kit.beard = 'none';
  return kit;
}

export function personOf(p) { return p; }
// the kit of a person. p: { id, sex, age, station, cult | dress, realm: { name, short, color, field, field2, device, charge },
//   wealth 0..2, border: { dress, share } (a border town: pieces of a second family), kitEdit(kit) }
export function kitFor(p) {
  const famKey = p.dress || FAMILY[p.cult] || 'north', fam = FAMILIES[famKey] || north, station = STATIONS.includes(p.station) ? p.station : 'peasant', r = stream(p.id || 'x', 'kit'), male = p.sex !== 'F';
  const realm = { ...(p.realm || {}) }; if (realm.device && !realm.chargeFn) realm.charge = chargeFn(realm.device, realm.chargeC || '#f0d890'); else realm.charge = realm.chargeFn;
  const ctx = { male, w: p.wealth ?? 1, r, pick: pickOf(stream(p.id || 'x', 'taste')), realm, age: p.age ?? 30, fam };
  let kit = fam[station](ctx);
  kit.land = p.land || fam.land; kit.place = kit.place || PLACE[station];
  kit = taste(kit, ctx);
  const acc = REALM_ACCENT[realm.short]; if (acc) kit = acc(kit, station, ctx);
  if (p.border && FAMILIES[p.border.dress]) {
    // a border town: take the listed pieces from the neighbour's kit for the same station (cloth, hat, arms, jewellery)
    const other = taste(FAMILIES[p.border.dress][p.border.station || station]({ ...ctx, fam: FAMILIES[p.border.dress] }), { ...ctx, fam: FAMILIES[p.border.dress] });
    for (const k of p.border.take || []) kit[k] = other[k];
    if (p.border.cloth) { const g = [kit.over2, kit.over].find(x => x && x.kind === 'coat') || kit.garment || kit.over, og = other.garment || {}; if (g) { g.pat = og.pat; g.patC = og.patC; g.patC2 = og.patC2; g.patW = og.patW; if (p.border.cloth === 'all') g.c = og.c; } }
    kit.mixLand = FAMILIES[p.border.dress].land;
  }
  const W = (REALM_WORDS[realm.short] || {})[station] || WORDS[famKey][station]; kit.text = { keys: W[0], motto: W[1], ...(station === 'royal' && realm.title ? { label: realm.title } : {}), ...(kit.text || {}) };
  if (p.kitEdit) kit = p.kitEdit(kit, ctx) || kit;
  return kit;
}
