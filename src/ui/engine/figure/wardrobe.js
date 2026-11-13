// The figure library · the wardrobe: what a person wears, from who they are and what they carry. Dress follows the
// estate (the cut), the purse (the cloth and its dye), the realm and the house (their colours and device) and the
// person's own gear. GEAR ON THE FIGURE IS KEYED BY ITEM: every item id the game knows has a row in GEAR_ART that says
// which drawn piece it is and its two measures, make (0 crude, 1 plain, 2 fine, 3 masterwork: the smith's care) and
// rarity (0 common, 1 rare, 2 epic, 3 legendary: what the thing is). An item that carries its own make or rarity
// (the coming items of E2, docs/design/economy-and-items.md) is drawn with them; a new item is one registerGear() call.
import { stream, clamp } from './g.js';

// ---- items by id -----------------------------------------------------------------------------------------------------
// weapons: art is the drawn piece (sword, dagger, axe, hammer, spear, staff); armour: harness is the set of pieces
export const GEAR_ART = {
  fists: null, staff: { art: 'staff' }, dagger: { art: 'dagger' }, club: { art: 'hammer', q: 0 }, spear: { art: 'spear' }, axe: { art: 'axe' }, mace: { art: 'hammer' },
  sword: { art: 'sword', q: 1 }, goodsword: { art: 'sword', q: 2 }, shortsword: { art: 'sword', q: 1 }, falchion: { art: 'sword', q: 1 }, saber: { art: 'sword', q: 1 },
  longsword: { art: 'sword', q: 2, long: 1 }, elfblade: { art: 'sword', q: 3, r: 1 }, dwarfblade: { art: 'sword', q: 2, r: 1 }, chanari: { art: 'sword', q: 2, r: 1 },
  greataxe: { art: 'axe', q: 1 }, cleaver: { art: 'axe', q: 0 }, warhammer: { art: 'hammer', q: 1 }, maul: { art: 'hammer', q: 0 }, flail: { art: 'hammer' }, morningstar: { art: 'hammer', q: 1 },
  pike: { art: 'spear' }, lance: { art: 'spear', q: 1 }, glaive: { art: 'spear', q: 1 }, halberd: { art: 'spear', q: 1 },
  // armour
  none: null, robes: { harness: 'robes' }, padded: { harness: 'padded', q: 0 }, leather: { harness: 'leather', q: 1 }, hide: { harness: 'leather', q: 0 },
  mail: { harness: 'mail', q: 1 }, dwarfmail: { harness: 'mail', q: 2 }, elfmail: { harness: 'mail', q: 3, r: 1 }, orcmail: { harness: 'mail', q: 0 },
  brigandine: { harness: 'plates', q: 1 }, scale: { harness: 'plates', q: 1 }, lamellar: { harness: 'plates', q: 1 },
  mailplate: { harness: 'cuirass', q: 2 }, plate: { harness: 'plate', q: 2 }, dwarfplate: { harness: 'plate', q: 3, r: 1 },
  // shields, helms, cloaks
  shield: { art: 'shield', q: 1 }, kite: { art: 'shield', q: 1 }, heater: { art: 'shield', q: 2 }, targe: { art: 'shield', q: 1 }, tower: { art: 'shield', q: 1 }, buckler: { art: 'shield', q: 1 },
  parrydagger: { art: 'dagger', q: 2 }, handaxe: { art: 'axe' }, offsword: { art: 'dagger', q: 1 },
  helm: { helm: 'nasal', q: 1 }, spangen: { helm: 'nasal', q: 1 }, horned: { helm: 'nasal', q: 1 }, kettle: { helm: 'kettle', q: 1 }, coif: { helm: 'coif' }, greathelm: { helm: 'bascinet', q: 2 }, bascinet: { helm: 'bascinet', q: 2 },
  elfhelm: { helm: 'nasal', q: 3, r: 1 }, dwarfhelm: { helm: 'kettle', q: 2, r: 1 }, turban: { helm: 'chaperon' },
  cloak: { cloak: 'plain' }, furcloak: { cloak: 'fur' }, finecloak: { cloak: 'fine' }, tabard: { cloak: 'tabard' },
};
// a weapon the table does not know is drawn by its kind (GD.GEAR[id].kind)
const KIND_ART = { sword: 'sword', blade: 'sword', dagger: 'dagger', knife: 'dagger', axe: 'axe', mace: 'hammer', hammer: 'hammer', club: 'hammer', flail: 'hammer', spear: 'spear', polearm: 'spear', pike: 'spear', lance: 'spear', staff: 'staff' };
export function registerGear(id, art) { if (typeof id === 'string' && id) GEAR_ART[id] = art || null; }
// one carried thing (the sheet gives { id, kind, make, rarity } or null) to { art | harness | helm | cloak, q, r, long }
export function artOf(it, q0 = 1) {
  if (!it || !it.id) return null;
  const row = Object.prototype.hasOwnProperty.call(GEAR_ART, it.id) ? GEAR_ART[it.id] : KIND_ART[it.kind] ? { art: KIND_ART[it.kind] } : null;
  if (!row) return null;
  const n = v => (Number.isFinite(+v) ? clamp(Math.round(+v), 0, 3) : null);
  return { ...row, q: n(it.make) ?? row.q ?? q0, r: n(it.rarity) ?? row.r ?? 0 };
}

// ---- dyes by station ----------------------------------------------------------------------------------------------
const DYE = {
  poor: ['undyed', 'hemp', 'undyed', 'cream', 'brown'],
  peasant: ['russet', 'brown', 'sage', 'woad', 'ochre', 'walnut', 'forest', 'grey', 'madder', 'hemp'],
  artisan: ['woad', 'madder', 'forest', 'teal', 'russet', 'mustard', 'brown', 'grey', 'blue'],
  merchant: ['teal', 'murrey', 'crimson', 'navy', 'forest', 'blue', 'purple'],
  gentry: ['blue', 'crimson', 'forest', 'murrey', 'teal', 'mustard', 'scarlet'],
  noble: ['navy', 'crimson', 'forest', 'murrey', 'purple', 'blue', 'black'],
  hood: ['forest', 'walnut', 'brown', 'woad', 'grey', 'russet'],
};
const HEXOK = /^#[0-9a-fA-F]{6}$/;
const set = (o, ...ids) => ids.map(id => ({ id, ...o }));

// what the person wears and how they stand. o: { male, age, id }
export function kit(sh, o) {
  const { male, age, id } = o, r = stream(id, 'kit'), pick = a => a[Math.floor(r() * a.length) % a.length], ch = p => r() < p;
  const est = sh.estate || 'peasant', C = sh.colors || {}, cult = sh.cult || {}, G = sh.gear || {};
  const realm = HEXOK.test(C.realm) ? C.realm : 'crimson', field = HEXOK.test(C.field) ? C.field : realm, chargeC = HEXOK.test(C.charge) ? C.charge : 'ochre';
  const device = C.device || null, grown = age >= 15, kid = age < 12;
  const cultDye = HEXOK.test(cult.dye) && ch(.45) ? cult.dye : null;
  const dye = k => cultDye || pick(DYE[k] || DYE.peasant);
  const station = sh.ruler ? 3 : est === 'royal' ? 3 : est === 'noble' ? 3 : sh.officer ? 2 : est === 'gentry' ? 2 : 1;       // the make a person of this standing would own
  const armour = grown ? artOf(G.armor, station) : null, weapon = grown ? artOf(G.weapon, station) : null, shield = grown ? artOf(G.shield, station) : null;
  const helm = grown ? artOf(G.helm, station) : null, cloak = age >= 12 ? artOf(G.cloak, station) : null;
  let gear = [], headwear = 'none', headwearOpts = {}, poses, staff = null;
  const sword = weapon && weapon.art === 'sword';
  const harness = armour && armour.harness && armour.harness !== 'robes' ? armour.harness : null;

  if (age < 3) {                                    // an infant: a linen smock, bare feet
    gear = [{ id: 'barelegs', from: .12 }, { id: 'shoes', kind: 'bare' }, { id: 'tunic', dye: pick(['linen', 'cream', 'undyed']), len: .6, ease: 14, neck: 'round', sleeves: 'long', flare: 30 }];
    poses = ['ease'];
  } else if (harness) {
    // under arms: the pieces follow the armour worn, the colours the realm (a levy) or the house (those who bear arms of their own)
    const q = armour.q, rr = armour.r, own = device && (est === 'noble' || est === 'royal' || sh.ruler), tab = { id: 'tabard', field: own ? field : realm, pale: own ? chargeC : pick(['ochre', 'cream', 'white', 'charcoal']), trim: q > 1 ? 'gold' : 'bronze', device: own ? device : null };
    const legs = [{ id: 'hose', dye: pick(['charcoal', 'walnut', 'brown']) }, { id: 'shoes', kind: 'boot', leather: 'dark', high: 1 }];
    if (harness === 'padded') gear = [...legs, { id: 'padding', dye: pick(['cream', 'undyed', 'hemp']) }, { ...tab, len: .3, point: 0 }, { id: 'belt', leather: 'dark', w: 28, metal: 'iron' }];
    else if (harness === 'leather') gear = [{ id: 'hose', dye: pick(['forest', 'walnut', 'brown']), loose: 1 }, { id: 'shoes', kind: 'boot', leather: 'brown', high: 1 }, { id: 'tunic', dye: dye('peasant'), len: .22, ease: 9, neck: 'slit', sleeves: 'long' }, { id: 'tunic', dye: pick(['brown', 'dark', 'tan']), len: .16, ease: 11, neck: 'v', sleeves: 'none' }, { id: 'belt', leather: 'dark', w: 30, metal: 'bronze' }, { id: 'bracers', leather: 'dark', studs: q > 0 ? 1 : 0 }];
    else if (harness === 'mail') gear = [...legs, ...set({ q: Math.min(q, 1) }, 'greaves', 'poleyns'), { id: 'padding' }, { id: 'mail' }, { id: 'mailcollar' }, { ...tab, len: .32, point: 0 }, { id: 'belt', leather: 'dark', w: 30, metal: q > 1 ? 'bronze' : 'iron' }, ...set({ q, r: rr }, 'vambraces', 'couters'), { id: 'gloves', leather: 'dark' }];
    else if (harness === 'plates') gear = [...legs, ...set({ q, r: rr }, 'greaves', 'poleyns'), { id: 'tunic', dye: own ? field : realm, len: .3, ease: 9, fitted: 1, neck: 'high', sleeves: 'long', quilt: 1, trimHem: 'dark', trim: 'dark' }, { id: 'tunic', dye: 'dark', len: .12, ease: 11, neck: 'v', sleeves: 'none' }, { id: 'belt', leather: 'dark', w: 30, metal: 'bronze' }, { id: 'baldric', leather: 'brown', from: 0, metal: 'bronze' }, { id: 'bracers', leather: 'brown', studs: 1, metal: 'bronze' }, { id: 'pauldrons', q, r: rr, z: 1.35 }];
    else if (harness === 'cuirass') gear = [...legs, ...set({ q, r: rr }, 'cuisses', 'greaves', 'poleyns'), { id: 'mail', sleeves: 'long', len: .3 }, { id: 'mailcollar' }, ...set({ q, r: rr }, 'breastplate', 'fauld'), { id: 'belt', leather: 'dark', w: 30, metal: 'bronze' }, ...set({ q, r: rr }, 'rerebraces', 'vambraces', 'couters', 'gauntlets', 'besagews', 'pauldrons', 'gorget')];
    else {                                          // full plate: every piece of the harness
      gear = [{ id: 'hose', dye: 'charcoal' }, { id: 'shoes', kind: 'turn', leather: 'dark' }, { id: 'padding', dye: own ? field : 'navy', trim: 'ochre' }, { id: 'mail' },
        ...set({ q, r: rr }, 'cuisses', 'greaves', 'poleyns', 'sabatons', ...(station > 2 ? ['spurs'] : []), 'breastplate', 'fauld', 'tassets', 'rerebraces', 'vambraces', 'couters', 'gauntlets'),
        ...(own || sh.officer ? [{ ...tab, len: .62 }] : []), { id: 'belt', leather: 'brown', w: 34, metal: q > 2 ? 'gold' : 'bronze', plaques: q > 1 ? 1 : 0 }, ...set({ q, r: rr }, 'besagews', 'pauldrons', 'gorget')];
    }
    if ((sh.officer || own) && !cloak && harness !== 'padded' && harness !== 'leather') gear.splice(gear.findIndex(g => g.id === 'tabard' || g.id === 'belt'), 0, { id: 'cloak', dye: own ? field : realm, lining: 'navy', trim: q > 1 ? 'gold' : null, len: .84, q, clasp: q > 1 ? 'gold' : 'bronze', mantle: .46 });
    if (sh.ruler || est === 'royal') gear.push({ id: 'furcollar', fur: 'ermine', z: .2 });
    poses = sword ? ['pommel', 'pommel', 'belt', 'ease', 'folded'] : ['ease', 'belt', 'folded', 'hip'];
  } else if (kid) {
    const fine = ['noble', 'royal', 'gentry', 'merchant'].includes(est);
    if (fine && male) gear = [{ id: 'hose', dye: pick(['navy', 'charcoal', 'walnut']) }, { id: 'shoes', kind: 'ankle', leather: 'brown' }, { id: 'tunic', dye: est === 'gentry' || est === 'merchant' ? dye(est) : field, len: .22, ease: 8, neck: 'high', sleeves: 'long', trim: 'cream', buttons: 'bronze', fitted: 1 }, { id: 'belt', leather: 'dark', w: 20, metal: 'bronze' }];
    else if (fine) gear = [{ id: 'shoes', kind: 'turn', leather: 'red' }, { id: 'tunic', dye: est === 'gentry' || est === 'merchant' ? dye(est) : field, len: .96, ease: 6, fitted: 1, neck: 'round', sleeves: 'long', trim: 'mustard', flare: 50, folds: 7 }, { id: 'belt', leather: 'red', w: 14, metal: 'bronze' }];
    else gear = [{ id: 'barelegs', from: .12 }, { id: 'shoes', kind: est === 'slave' || est === 'serf' || ch(.4) ? 'bare' : 'turn', leather: 'brown' }, { id: 'tunic', dye: dye(est === 'slave' || est === 'serf' ? 'poor' : 'peasant'), len: male ? .42 : .6, ease: 12, neck: 'round', sleeves: 'long', patch: ch(.5) ? 'undyed' : null, flare: 34 }];
    poses = ['ease', 'behind', 'hip', 'ease'];
  } else if (est === 'slave' || est === 'prisoner' || est === 'serf') {
    const bare = est !== 'serf';
    if (male) gear = [{ id: 'barelegs', from: .12 }, ...(bare ? [] : [{ id: 'wraps', dye: 'hemp' }]), { id: 'shoes', kind: bare ? 'bare' : 'turn', leather: 'dark' }, { id: 'tunic', dye: dye('poor'), len: .34, ease: 14, neck: 'slit', sleeves: 'long', patch: 'hemp' }, { id: 'belt', rope: 1, leather: 'hemp', w: 16 }];
    else gear = [{ id: 'shoes', kind: bare ? 'bare' : 'turn', leather: 'dark' }, { id: 'tunic', dye: dye('poor'), len: .9, ease: 10, neck: 'round', sleeves: 'long', patch: 'hemp', flare: 40, folds: 6 }, { id: 'belt', rope: 1, leather: 'hemp', w: 14 }];
    if (est === 'serf' && ch(.3)) headwear = male ? pick(['strawhat', 'coif']) : 'veil';
    poses = male ? ['ease', 'behind', 'belt', 'hip'] : ['clasped', 'ease', 'hip'];
  } else if (est === 'priest') {
    const high = sh.rung >= 3, d = high ? pick(['white', 'cream']) : pick(['walnut', 'charcoal', 'brown', 'undyed']);
    gear = [{ id: 'shoes', kind: 'turn', leather: 'tan' }, { id: 'tunic', dye: d, len: .96, ease: 18, neck: 'round', sleeves: 'wide', flare: 30, folds: 6, trimHem: high ? 'mustard' : null }, { id: 'belt', rope: 1, leather: 'linen', w: 15 }, { id: 'hood', dye: d, cape: .5 }, { id: 'amulet', metal: high ? 'gold' : 'bronze', device: 'sun' }];
    if (high) headwear = 'mitre';
    poses = ['sleeves', 'sleeves', 'clasped', ...(age > 60 ? ['staff'] : [])]; staff = high ? 'crozier' : 'staff';
  } else if (est === 'royal' || sh.ruler) {
    if (male) gear = [{ id: 'shoes', kind: 'poulaine', leather: 'red' }, { id: 'tunic', dye: field === realm ? 'crimson' : field, len: .97, ease: 15, neck: 'round', sleeves: 'bell', trim: 'mustard', trimHem: 'mustard', trimW: 22, flare: 40, folds: 7, buttons: 'gold' }, { id: 'belt', leather: 'dark', w: 30, metal: 'gold', plaques: 1 }, { id: 'cloak', dye: realm, lining: 'ermine', trim: 'gold', len: 1.0, q: 3, clasp: 'gold', mantle: .5, spread: .075 }, { id: 'furcollar', fur: 'ermine', z: .34 }, { id: 'chain', metal: 'gold' }];
    else gear = [{ id: 'shoes', kind: 'poulaine', leather: 'red' }, { id: 'tunic', dye: field === realm ? 'crimson' : field, len: 1.0, ease: 4, fitted: 1, neck: 'wide', sleeves: 'wide', trim: 'mustard', trimHem: 'mustard', flare: 70, folds: 9 }, { id: 'belt', leather: 'red', w: 20, metal: 'gold', plaques: 1, hang: 240, at: .5 }, { id: 'cloak', dye: realm, lining: 'ermine', trim: 'gold', len: .98, q: 3, clasp: 'gold', mantle: .5, spread: .07 }, { id: 'furcollar', fur: 'ermine', z: .26 }, { id: 'chain', metal: 'gold', gem: '#9c1f2c' }];
    headwear = sh.ruler ? 'crown' : 'circlet';
    poses = male ? (sword ? ['sword', 'pommel', 'belt'] : ['belt', 'ease', 'behind']) : ['clasped', 'ease', 'sleeves'];
  } else if (est === 'noble') {
    if (male) gear = [{ id: 'hose', dye: pick(['charcoal', 'navy', 'walnut']) }, { id: 'shoes', kind: 'boot', leather: 'dark', high: 1 }, { id: 'tunic', dye: field, len: .34, ease: 8, fitted: 1, neck: 'high', sleeves: 'long', trim: 'mustard', trimHem: 'mustard', trimW: 14, buttons: 'gold', flare: 30 }, { id: 'belt', leather: 'dark', w: 30, metal: 'gold', plaques: 1 }, ...(ch(.6) ? [{ id: 'cloak', dye: pick(DYE.noble), lining: 'charcoal', trim: 'gold', len: .78, q: 2, clasp: 'gold', mantle: .46 }, { id: 'furcollar', fur: pick(['sable', 'wolf', 'fox']), z: .22 }] : [{ id: 'chain', metal: 'gold' }])];
    else gear = [{ id: 'shoes', kind: 'poulaine', leather: 'red' }, { id: 'tunic', dye: field, len: 1.0, ease: 4, fitted: 1, neck: 'wide', sleeves: 'wide', trim: 'mustard', trimHem: 'mustard', flare: 70, folds: 9 }, { id: 'belt', leather: 'red', w: 20, metal: 'gold', plaques: 1, hang: 240, at: .5 }, { id: 'chain', metal: 'gold', gem: pick(['#2f5fa8', '#9c1f2c', '#2f7a4a']) }];
    headwear = !male ? (ch(.5) ? 'circlet' : sh.married && ch(.4) ? 'veil' : 'none') : sh.rung >= 5 && ch(.5) ? 'circlet' : 'none';
    poses = male ? (sword ? ['pommel', 'pommel', 'belt', 'hip'] : ['belt', 'hip', 'behind', 'ease']) : ['clasped', 'ease', 'hip', 'sleeves'];
  } else if (est === 'gentry') {
    if (male) gear = [{ id: 'hose', dye: pick(['navy', 'charcoal', 'walnut', 'forest']) }, { id: 'shoes', kind: ch(.5) ? 'boot' : 'ankle', leather: 'brown', high: 1 }, { id: 'tunic', dye: dye('gentry'), len: .24, ease: 7, neck: 'high', sleeves: 'long', trim: 'cream', buttons: 'bronze', fitted: 1 }, { id: 'belt', leather: 'dark', w: 26, metal: 'bronze' }, ...(sword ? [] : [{ id: 'tool', kind: 'knife', side: 1 }])];
    else gear = [{ id: 'shoes', kind: 'turn', leather: 'red' }, { id: 'tunic', dye: dye('gentry'), len: 1.0, ease: 5, fitted: 1, neck: 'wide', sleeves: 'long', trim: 'cream', trimHem: 'cream', flare: 60, folds: 8 }, { id: 'belt', leather: 'tan', w: 18, metal: 'bronze', hang: 160, at: .5 }];
    headwear = male ? (ch(.3) ? 'chaperon' : 'none') : sh.married && ch(.5) ? 'veil' : 'none'; headwearOpts = { dye: pick(DYE.gentry) };
    poses = male ? (sword ? ['pommel', 'belt', 'hip'] : ['belt', 'hip', 'ease', 'behind']) : ['clasped', 'ease', 'hip'];
  } else if (est === 'merchant') {
    const d = dye('merchant');
    if (male) gear = [{ id: 'shoes', kind: 'turn', leather: 'dark' }, { id: 'tunic', dye: d, len: .93, ease: 16, neck: 'v', sleeves: 'bell', trim: 'ochre', trimHem: pick(['bear', 'fox', 'sable']), trimW: 30, flare: 44, folds: 7, buttons: 'bronze' }, { id: 'belt', leather: 'red', w: 26, metal: 'bronze', plaques: 1 }, { id: 'pouch', side: -1, z: 1.25, keys: 1, leather: 'red' }, { id: 'furcollar', fur: pick(['bear', 'fox', 'wolf']), z: .2 }];
    else gear = [{ id: 'shoes', kind: 'turn', leather: 'dark' }, { id: 'tunic', dye: d, len: .97, ease: 8, fitted: 1, neck: 'round', sleeves: 'bell', trim: 'ochre', trimHem: 'ochre', flare: 56, folds: 8 }, { id: 'belt', leather: 'red', w: 20, metal: 'bronze', plaques: 1 }, { id: 'pouch', side: -1, z: 1.1, keys: 1, leather: 'red' }, { id: 'furcollar', fur: pick(['bear', 'fox']), z: .16 }];
    headwear = male ? (ch(.6) ? 'chaperon' : 'none') : ch(.6) ? 'veil' : 'none'; headwearOpts = { dye: pick(DYE.merchant) };
    poses = male ? ['clasped', 'belt', 'folded', 'ease'] : ['clasped', 'ease', 'sleeves'];
  } else if (est === 'artisan') {
    if (male) gear = [{ id: 'hose', dye: pick(['walnut', 'brown', 'charcoal']) }, { id: 'shoes', kind: 'boot', leather: 'dark' }, { id: 'tunic', dye: ch(.5) ? 'cream' : dye('artisan'), len: .28, ease: 9, neck: 'slit', sleeves: ch(.5) ? 'rolled' : 'long' }, ...(ch(.6) ? [{ id: 'apron', leather: pick(['brown', 'tan', 'dark']), len: .5 }] : []), { id: 'belt', leather: 'dark', w: 32, metal: 'iron' }, { id: ch(.5) ? 'tool' : 'pouch', kind: pick(['hammer', 'knife']), side: 1 }];
    else gear = [{ id: 'shoes', kind: 'turn', leather: 'brown' }, { id: 'tunic', dye: dye('artisan'), len: .97, ease: 5, fitted: 1, neck: 'laced', sleeves: 'long', flare: 60, folds: 8 }, { id: 'apron', leather: 'linen', len: .7 }, { id: 'belt', leather: 'tan', w: 18 }, { id: 'pouch', side: -1 }];
    headwear = male ? (ch(.35) ? pick(['coif', 'chaperon']) : 'none') : ch(.5) ? pick(['veil', 'coif']) : 'none'; headwearOpts = { dye: pick(DYE.artisan) };
    poses = male ? ['folded', 'belt', 'hip', 'ease'] : ['clasped', 'hip', 'ease', 'folded'];
  } else {                                          // the free commons
    if (male) gear = [{ id: 'hose', dye: pick(['brown', 'walnut', 'grey', 'hemp']) }, { id: 'shoes', kind: 'ankle', leather: 'dark' }, { id: 'tunic', dye: dye('peasant'), len: .36, ease: 12, neck: ch(.5) ? 'round' : 'slit', sleeves: 'long', trim: ch(.4) ? 'ochre' : null }, { id: 'belt', leather: 'brown', w: 26 }, ...(ch(.5) ? [{ id: 'pouch', side: -1 }] : []), ...(ch(.45) ? [{ id: 'hood', dye: pick(DYE.hood) }] : [])];
    else gear = [{ id: 'shoes', kind: 'turn', leather: 'brown' }, { id: 'tunic', dye: dye('peasant'), len: .97, ease: 5, fitted: 1, neck: ch(.6) ? 'laced' : 'round', sleeves: 'long', flare: 60, folds: 8 }, ...(ch(.6) ? [{ id: 'apron', leather: 'linen', len: .7 }] : []), { id: 'belt', leather: 'tan', w: 18 }];
    headwear = male ? (ch(.12) ? 'strawhat' : ch(.12) ? 'coif' : 'none') : (sh.married || age > 40) && ch(.45) ? 'veil' : ch(.1) ? 'coif' : 'none';
    poses = male ? ['ease', 'hip', 'belt', 'folded', 'behind'] : ['clasped', 'hip', 'ease', 'folded'];
  }
  // the old lean on a staff
  if (age > 68 && !harness && est !== 'royal' && !sh.ruler && ch(.45)) { poses = ['staff']; staff = staff || 'staff'; }

  // what is carried, by item
  if (weapon && grown) {
    if (weapon.art === 'sword') gear.push({ id: 'sword', q: weapon.q, r: weapon.r, long: weapon.long });
    else if (weapon.art === 'dagger') gear.push({ id: 'dagger', q: weapon.q, r: weapon.r });
    else if (weapon.art === 'axe') gear.push({ id: 'tool', kind: 'axe', side: -1 });
    else if (weapon.art === 'hammer') gear.push({ id: 'tool', kind: 'hammer', side: -1 });
    else if (weapon.art === 'spear') { poses = ['staff']; staff = 'spear'; }
    else if (weapon.art === 'staff') { poses = ['staff']; staff = 'staff'; }
  }
  if (shield && shield.art === 'shield') gear.push({ id: 'shield', q: shield.q, r: shield.r, field: device ? field : realm, pale: device ? chargeC : 'ochre', device: device || null });
  else if (shield && shield.art === 'dagger') gear.push({ id: 'dagger', q: shield.q, r: shield.r });
  if (cloak && cloak.cloak) {
    gear = gear.filter(g => g.id !== 'cloak');
    const at = Math.max(0, gear.findIndex(g => g.id === 'tabard' || g.id === 'belt'));
    if (cloak.cloak === 'tabard') { if (!gear.some(g => g.id === 'tabard')) gear.splice(at, 0, { id: 'tabard', field, pale: chargeC, trim: 'bronze', len: .5, device }); }
    else {
      gear.splice(at, 0, { id: 'cloak', dye: cloak.cloak === 'fine' ? pick(DYE.noble) : pick(['charcoal', 'walnut', 'forest', 'navy', 'grey']), lining: cloak.cloak === 'fine' ? 'charcoal' : null, trim: cloak.cloak === 'fine' ? 'gold' : null, len: .82, q: cloak.q, clasp: cloak.cloak === 'fine' ? 'gold' : 'bronze', mantle: .46 });
      if (cloak.cloak === 'fur' && !gear.some(g => g.id === 'furcollar')) gear.push({ id: 'furcollar', fur: pick(['wolf', 'bear', 'fox']), z: .26 });
    }
  }
  // a helm is worn by the rank and file under arms; those whose face is their name go bare-headed in a portrait
  if (helm && helm.helm && harness && !sh.ruler && !sh.pc && est !== 'noble' && est !== 'royal' && !sh.officer && helm.helm !== 'bascinet' && ch(.7)) { headwear = helm.helm; headwearOpts = { q: helm.q, r: helm.r, dye: 'grey' }; }
  // a people's own headwear, where the library draws it
  if (headwear === 'none' && !harness && grown && cult.hat && est !== 'royal' && !sh.ruler && ch(.3)) {
    const h = cult.hat[male ? 0 : 1], map = { hood: null, kerchief: 'coif', cap: 'coif', veil: 'veil', turban: 'chaperon', wrap: 'chaperon', furhat: 'chaperon', cone: 'chaperon', fillet: null };
    if (map[h]) { headwear = map[h]; headwearOpts = { dye: HEXOK.test(cult.dye) ? cult.dye : pick(DYE.artisan) }; }
  }
  let pose = poses[Math.floor(stream(id, 'pose')() * poses.length) % poses.length];
  if ((pose === 'pommel' || pose === 'sword') && !gear.some(g => g.id === 'sword')) pose = 'belt';
  return { gear, headwear, headwearOpts, pose, staff };
}
