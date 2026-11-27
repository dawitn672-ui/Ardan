// The figure library · the wardrobe: what a person wears, from who they are and what they carry. Dress follows the
// estate (the cut), the purse (the cloth and its dye), the realm and the house (their colours and device) and the
// person's own gear. GEAR ON THE FIGURE IS KEYED BY ITEM: every item id the game knows has a row in GEAR_ART that says
// which drawn piece it is and its two measures, make (0 crude, 1 plain, 2 fine, 3 masterwork: the smith's care) and
// rarity (0 basic, 1 rare, 2 epic, 3 legendary: what the thing is; D-200). An item that carries its own make or rarity
// (the coming items of E2, docs/design/economy-and-items.md) is drawn with them; a new item is one registerGear() call.
import { stream, clamp, hsl, fromHsl } from './g.js';
import { DYES } from './palette.js';
import { CUTS } from './cultures.js';

// ---- items by id -----------------------------------------------------------------------------------------------------
// weapons: art is the class of drawn piece (sword, dagger, axe, hammer, spear, staff, bow, crossbow, shield) and form the
// piece itself within it (arms.js: an arming sword, a falchion, a halberd, a targe); st is the people whose smiths made it,
// when the item says so. armour: harness is the set of pieces
export const GEAR_ART = {
  fists: null, staff: { art: 'staff' }, dagger: { art: 'dagger' }, club: { art: 'hammer', form: 'club', q: 0 }, spear: { art: 'spear' }, axe: { art: 'axe' }, mace: { art: 'hammer', form: 'mace' },
  sword: { art: 'sword', q: 1 }, goodsword: { art: 'sword', q: 2 }, shortsword: { art: 'sword', form: 'short', q: 1 }, falchion: { art: 'sword', form: 'falchion', q: 1 }, saber: { art: 'sword', form: 'sabre', q: 1 },
  longsword: { art: 'sword', form: 'long', q: 2, long: 1 }, elfblade: { art: 'sword', form: 'leaf', st: 'elf', q: 3, r: 1 }, dwarfblade: { art: 'sword', form: 'short', st: 'dwarf', q: 2, r: 1 }, chanari: { art: 'sword', form: 'sabre', st: 'desert', q: 2, r: 1 },
  greataxe: { art: 'axe', form: 'great', q: 1 }, cleaver: { art: 'axe', form: 'cleaver', q: 0 }, warhammer: { art: 'hammer', form: 'hammer', q: 1 }, maul: { art: 'hammer', form: 'maul', q: 0 }, flail: { art: 'hammer', form: 'flail' }, morningstar: { art: 'hammer', form: 'star', q: 1 },
  pike: { art: 'spear', form: 'pike' }, lance: { art: 'spear', form: 'lance', q: 1 }, glaive: { art: 'spear', form: 'glaive', q: 1 }, halberd: { art: 'spear', form: 'halberd', q: 1 },
  arming: { art: 'sword', q: 2 }, estoc: { art: 'sword', form: 'estoc', q: 2, long: 1 }, greatsword: { art: 'sword', form: 'great', q: 2, long: 1 }, scimitar: { art: 'sword', form: 'sabre', st: 'desert', q: 2 },
  poleaxe: { art: 'spear', form: 'poleaxe', q: 2 }, boarspear: { art: 'spear', form: 'boar', q: 1 }, partisan: { art: 'spear', form: 'partisan', q: 2 }, bill: { art: 'spear', form: 'bill', q: 0 }, warpick: { art: 'hammer', form: 'pick', q: 1 }, horsemace: { art: 'hammer', form: 'mace', q: 2 },
  // bows and crossbows (the ranged slot)
  selfbow: { art: 'bow', form: 'self', q: 1 }, longbow: { art: 'bow', form: 'long', q: 1 }, compbow: { art: 'bow', form: 'recurve', q: 2 }, elfbow: { art: 'bow', form: 'long', st: 'elf', q: 3, r: 1 }, xbow: { art: 'crossbow', q: 1 },
  horsebow: { art: 'bow', form: 'recurve', q: 2 }, warbow: { art: 'bow', form: 'long', q: 2 }, arbalest: { art: 'crossbow', q: 2 },
  javelins: null, throwaxes: null, knives: null, sling: null,                    // thrown arms: carried in a bag or the belt, not drawn yet
  // armour
  none: null, robes: { harness: 'robes' }, padded: { harness: 'padded', q: 0 }, leather: { harness: 'leather', q: 1 }, hide: { harness: 'leather', q: 0 },
  mail: { harness: 'mail', q: 1 }, dwarfmail: { harness: 'mail', q: 2 }, elfmail: { harness: 'mail', q: 3, r: 1 }, orcmail: { harness: 'mail', q: 0 },
  brigandine: { harness: 'plates', q: 1 }, scale: { harness: 'plates', q: 1 }, lamellar: { harness: 'plates', q: 1 },
  mailplate: { harness: 'cuirass', q: 2 }, plate: { harness: 'plate', q: 2 }, dwarfplate: { harness: 'plate', q: 3, r: 1 },
  gambeson: { harness: 'padded', q: 1 }, jack: { harness: 'padded', q: 1 }, haubergeon: { harness: 'mail', q: 1 }, coatplates: { harness: 'plates', q: 2 }, splinted: { harness: 'plates', q: 1 }, gothic: { harness: 'plate', q: 3 },
  // shields, helms, cloaks
  shield: { art: 'shield', form: 'round', q: 1 }, kite: { art: 'shield', form: 'kite', q: 1 }, heater: { art: 'shield', form: 'heater', q: 2 }, targe: { art: 'shield', form: 'targe', q: 1 }, tower: { art: 'shield', form: 'pavise', q: 1 }, buckler: { art: 'shield', form: 'buckler', q: 1 },
  parrydagger: { art: 'dagger', form: 'parry', q: 2 }, handaxe: { art: 'axe', form: 'hand' }, offsword: { art: 'dagger', q: 1 },
  helm: { helm: 'nasal', q: 1 }, spangen: { helm: 'nasal', q: 1 }, horned: { helm: 'nasal', q: 1 }, kettle: { helm: 'kettle', q: 1 }, coif: { helm: 'coif' }, greathelm: { helm: 'bascinet', q: 2 }, bascinet: { helm: 'bascinet', q: 2 },
  elfhelm: { helm: 'nasal', q: 3, r: 1 }, dwarfhelm: { helm: 'kettle', q: 2, r: 1 }, turban: { helm: 'chaperon' },
  sallet: { helm: 'kettle', q: 2 }, barbute: { helm: 'nasal', q: 2 }, armet: { helm: 'bascinet', q: 3 },
  cloak: { cloak: 'plain' }, furcloak: { cloak: 'fur' }, finecloak: { cloak: 'fine' }, tabard: { cloak: 'tabard' },
};
// a weapon the table does not know is drawn by its kind (GD.GEAR[id].kind)
const KIND_ART = { sword: 'sword', blade: 'sword', dagger: 'dagger', knife: 'dagger', axe: 'axe', mace: 'hammer', hammer: 'hammer', club: 'hammer', flail: 'hammer', spear: 'spear', polearm: 'spear', pike: 'spear', lance: 'spear', staff: 'staff', bow: 'bow', xbow: 'crossbow', crossbow: 'crossbow' };
// whose smiths arm a person: a people's own make, else the culture's (cult.arms), else the common northern one
const RACE_ARMS = { elf: 'elf', dwarf: 'dwarf', orc: 'orc' }, ARMS = new Set(['north', 'solen', 'desert', 'dwarf', 'elf', 'orc']);
export function registerGear(id, art) { if (typeof id === 'string' && id) GEAR_ART[id] = art || null; }
// one carried thing (the sheet gives { id, kind, make, rarity } or null) to { art | harness | helm | cloak, form, st, q, r, long }
export function artOf(it, q0 = 1) {
  if (!it || !it.id) return null;
  const row = Object.prototype.hasOwnProperty.call(GEAR_ART, it.id) ? GEAR_ART[it.id] : KIND_ART[it.kind] ? { art: KIND_ART[it.kind] } : null;
  if (!row) return null;
  const n = v => (Number.isFinite(+v) ? clamp(Math.round(+v), 0, 3) : null);
  return { ...row, q: n(it.make) ?? row.q ?? q0, r: n(it.rarity) ?? row.r ?? 0 };
}

// ---- dyes by station ----------------------------------------------------------------------------------------------
// what a station's cloth is dyed with, and what a dye costs (0 undyed .. 4 the purple): nobody wears above their purse
const DYE = {
  poor: ['undyed', 'hemp', 'undyed', 'cream', 'brown', 'hemp'],
  peasant: ['russet', 'brown', 'sage', 'woad', 'ochre', 'walnut', 'forest', 'grey', 'madder', 'hemp'],
  artisan: ['woad', 'madder', 'forest', 'teal', 'russet', 'mustard', 'brown', 'grey', 'blue', 'green'],
  merchant: ['teal', 'murrey', 'crimson', 'navy', 'forest', 'blue', 'purple', 'mustard'],
  gentry: ['blue', 'crimson', 'forest', 'murrey', 'teal', 'mustard', 'scarlet', 'green'],
  noble: ['navy', 'crimson', 'forest', 'murrey', 'purple', 'blue', 'black', 'scarlet', 'teal'],
  hood: ['forest', 'walnut', 'brown', 'woad', 'grey', 'russet'],
};
const COST = { undyed: 0, hemp: 0, linen: 0, cream: 0, brown: 1, walnut: 1, russet: 1, grey: 1, sage: 1, ochre: 1, woad: 1, madder: 1, forest: 1, charcoal: 1, green: 2, mustard: 2, teal: 2, blue: 2, rose: 2, white: 2,
  navy: 3, murrey: 3, crimson: 3, scarlet: 3, black: 3, purple: 4 };
const PLAIN = new Set(['linen', 'white', 'black', 'charcoal']);       // the ramps set by hand (palette.js): worn as they are
const GRADE = { slave: 0, prisoner: 0, serf: 0, peasant: 1, artisan: 2, merchant: 3, gentry: 4, noble: 5, royal: 6, priest: 2 };
const CLASS = ['poor', 'peasant', 'artisan', 'merchant', 'gentry', 'noble', 'noble'];
const HEXOK = /^#[0-9a-fA-F]{6}$/;
const set = (o, ...ids) => ids.map(id => ({ id, ...o }));
const hashOf = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const T = o => ({ id: 'tunic', ...o });
const hash2 = s => { let h = 5381; s = String(s); for (let i = 0; i < s.length; i++) h = (Math.imul(h, 33) + s.charCodeAt(i) * (i + 7)) | 0; return (h >>> 0).toString(36); };

// the occasions a person dresses for (C8c: the player picks one, an event's scene picks one for everybody in it)
export const WEARS = ['day', 'best', 'work', 'travel', 'arms', 'mourning'];
// the dyes a station may pick its everyday cloth from (the game's dress chooser), cheapest first
export function dyesFor(estate, cult) {
  const g = GRADE[estate] ?? 1, tier = [0, 1, 2, 3, 3, 4, 4][g], seen = new Set(), out = [];
  for (const d of [...DYE[CLASS[g]], ...((cult && cult.dyes) || [])]) if (DYES[d] && COST[d] <= tier && !seen.has(d)) { seen.add(d); out.push(d); }
  return out.sort((a, b) => COST[a] - COST[b]);
}
// the pattern of a realm's livery: every soldier of a realm wears the same coat (from the realm's colour, not the person)
export function liveryOf(realm) { const h = hashOf(realm); return { style: ['pale', 'plain', 'party'][h % 3], pale: ['ochre', 'cream', 'white', 'charcoal'][(h >>> 3) % 4] }; }

// what the person wears and how they stand. o: { male, age, id }
// sh adds for C8c: wear (an occasion of WEARS), where ('list', 'in', 'out'), dye (the person's chosen dye), job (a career
// key), role (a household post), mil ({ rank, troop }), livery ({ field, charge, device }: a lord's colours on a retainer)
export function kit(sh, o) {
  // the dress has dice of its own, keyed by the id and a second hash of it: two ids the streams' own hash takes for one
  // (FNV-1a does, for some pairs that differ in their last two characters) would else be dressed as twins
  const { male, age } = o, id = o.id + '~' + hash2(o.id), r = stream(id, 'kit'), pick = a => a[Math.floor(r() * a.length) % a.length], ch = p => r() < p;
  const est = sh.estate || 'peasant', C = sh.colors || {}, cult = sh.cult || {}, G = sh.gear || {};
  const cut = CUTS.includes(cult.cut) ? cult.cut : 'tunic';
  const wear = WEARS.includes(sh.wear) ? sh.wear : 'day', where = sh.where === 'list' || sh.where === 'out' ? sh.where : 'in';
  const fine = wear === 'best', work = wear === 'work', road = wear === 'travel', mourn = wear === 'mourning';
  const realm = HEXOK.test(C.realm) ? C.realm : 'crimson', field = HEXOK.test(C.field) ? C.field : realm, chargeC = HEXOK.test(C.charge) ? C.charge : 'ochre';
  const device = C.device || null, grown = age >= 15, kid = age < 12;
  const liv = sh.livery && HEXOK.test(sh.livery.field) ? { field: sh.livery.field, charge: HEXOK.test(sh.livery.charge) ? sh.livery.charge : 'ochre', device: sh.livery.device || null } : null;
  const royal = est === 'royal' || !!sh.ruler, g = royal ? 6 : GRADE[est] ?? 1, tier = [0, 1, 2, 3, 3, 4, 4][g], job = typeof sh.job === 'string' ? sh.job : '', role = typeof sh.role === 'string' ? sh.role : '';
  const rank = sh.mil ? Math.max(0, +sh.mil.rank || 0) : sh.officer ? 6 : null;
  // a dye, a little off the vat's: no two bolts take the colour alike (and no two people wear quite the same cloth)
  const shade = c => { const a = Math.floor(r() * 5) - 2, b = Math.floor(r() * 5) - 2, hex = DYES[c] || (HEXOK.test(c) ? c : null); if (!hex || PLAIN.has(c) || (!a && !b)) return c; const [h, s, l] = hsl(hex); return fromHsl(h + a * 5, clamp(s * (1 + b * .05)), clamp(l + b * .022, .06, .9)); };
  const cultDyes = Array.isArray(cult.dyes) ? cult.dyes.filter(d => DYES[d] && COST[d] <= tier) : [];
  const dyeOf = (k = CLASS[g]) => { const x = r(), own = DYE[k] || DYE.peasant; return shade(g >= 1 && HEXOK.test(cult.dye) && x < .22 ? cult.dye : cultDyes.length && x < .6 ? cultDyes[Math.floor(r() * cultDyes.length) % cultDyes.length] : pick(own)); };
  const chosen = typeof sh.dye === 'string' && DYES[sh.dye] && COST[sh.dye] <= tier ? sh.dye : null;
  // the person's own two colours are drawn first and always, so a change of outfit does not change the person's taste
  const m0 = dyeOf(), s0 = dyeOf(), s1 = shade(pick(DYE[CLASS[g]])), mk = Math.floor(r() * 3);
  const main = mourn ? (g >= 3 ? ['black', 'black', 'charcoal'] : ['charcoal', 'walnut', 'grey'])[mk] : chosen || m0;
  const second = mourn ? (main === 'charcoal' ? 'walnut' : 'charcoal') : s0 === main ? s1 : s0;
  const rh = stream(id, 'kit-hat'), hch = p => rh() < p, clean = fine || mourn;                       // the head has its own dice, for the same reason
  const station = sh.ruler ? 3 : est === 'royal' ? 3 : est === 'noble' ? 3 : sh.officer ? 2 : est === 'gentry' ? 2 : 1;       // the make a person of this standing would own
  // a serving soldier with no armour of his own (or a robe for one) stands in a padded coat
  const worn = grown ? artOf(G.armor, station) : null, armour = worn && worn.harness && worn.harness !== 'robes' ? worn : sh.mil && grown ? { harness: 'padded', q: 0, r: 0 } : worn, weapon0 = grown ? artOf(G.weapon, station) : null, shield0 = grown ? artOf(G.shield, station) : null;
  const helm = grown ? artOf(G.helm, station) : null, cloak = age >= 12 ? artOf(G.cloak, station) : null, ranged0 = grown ? artOf(G.ranged, station) : null;
  const arms = RACE_ARMS[sh.race] || (ARMS.has(cult.arms) ? cult.arms : 'north');
  let gear = [], headwear = 'none', headwearOpts = {}, poses, staff = null;
  const harness0 = armour && armour.harness && armour.harness !== 'robes' ? armour.harness : null;
  // a harness is worn to war, on the road and day by day by those who own one; it is put off for a feast, for mourning,
  // and for work by anyone whose work is not war
  const harness = harness0 && !(fine || mourn || (work && !sh.mil)) ? harness0 : null, civil = !harness && !!harness0;
  // out of harness a sword or a dagger stays at the belt of those who may wear one; the rest is left at home
  const side = w => w && (w.art === 'sword' || w.art === 'dagger') && (g >= 4 || !!sh.mil || role === 'guard');
  const weapon = civil || fine || mourn ? (side(weapon0) ? weapon0 : null) : weapon0, shield = civil || fine || mourn ? null : shield0, ranged = civil || fine || mourn ? null : ranged0;
  const sword = weapon && weapon.art === 'sword';
  const gem = () => pick(['#2f5fa8', '#9c1f2c', '#2f7a4a', '#6a3a8c']);
  // a retainer in a lord's colours: the coat is the house's, not the person's (the one garment people share)
  const badge = liv ? { id: 'badge', field: liv.field, pale: liv.charge, device: liv.device, trim: g >= 4 ? 'gold' : 'bronze' } : null;

  if (age < 3) {                                    // an infant: a linen smock, bare feet
    gear = [{ id: 'barelegs', from: .12 }, { id: 'shoes', kind: 'bare' }, T({ dye: pick(['linen', 'cream', 'undyed']), len: .6, ease: 14, neck: 'round', sleeves: 'long', flare: 30 })];
    poses = ['ease'];
  } else if (harness) {
    // under arms: the pieces follow the armour worn; the coat over them is the realm's (the rank and file), the house's
    // (a lord's guard) or the bearer's own arms
    const q = armour.q, rr = armour.r, own = !liv && device && (est === 'noble' || royal), lv = liveryOf(liv ? liv.field : realm);
    const tab = own ? { id: 'tabard', field, pale: chargeC, trim: q > 1 ? 'gold' : 'bronze', device }
      : liv ? { id: 'tabard', field: liv.field, pale: liv.charge, trim: 'bronze', device: liv.device, plain: liv.device ? 1 : 0 }
        : { id: 'tabard', field: realm, pale: lv.pale, trim: q > 1 ? 'gold' : 'bronze', device: null, plain: lv.style === 'plain' ? 1 : 0, party: lv.style === 'party' ? 1 : 0 };
    const legs = [{ id: 'hose', dye: pick(['charcoal', 'walnut', 'brown']) }, { id: 'shoes', kind: 'boot', leather: 'dark', high: 1 }];
    const pad = { id: 'padding', dye: pick(['cream', 'undyed', 'hemp']), quilt: 2 };
    if (harness === 'padded') gear = [...legs, { ...pad, len: .4 }, ...(rank >= 1 ? [{ id: 'mailcollar' }] : []), { ...tab, len: .3, point: 0 }, { id: 'belt', leather: 'dark', w: 28, metal: 'iron' }, ...(rank >= 2 ? [{ id: 'baldric', leather: 'brown', from: 0, metal: 'iron' }] : [])];
    else if (harness === 'leather') gear = [{ id: 'hose', dye: pick(['forest', 'walnut', 'brown']), loose: 1 }, { id: 'shoes', kind: 'boot', leather: 'brown', high: 1 }, sh.mil || liv ? { id: 'padding', dye: liv ? liv.field : realm, quilt: 2, len: .22, ease: 9 } : T({ dye: dyeOf('peasant'), len: .22, ease: 9, neck: 'slit', sleeves: 'long' }), T({ dye: pick(['brown', 'dark', 'tan']), len: .16, ease: 11, neck: 'v', sleeves: 'none' }), { id: 'belt', leather: 'dark', w: 30, metal: 'bronze' }, { id: 'baldric', leather: 'dark', from: 0, metal: 'bronze', studs: 1 }, { id: 'bracers', leather: 'dark', studs: q > 0 ? 1 : 0 }];
    else if (harness === 'mail') gear = [...legs, ...set({ q: Math.min(q, 1) }, 'greaves', 'poleyns'), pad, { id: 'mail' }, { id: 'mailcollar' }, { ...tab, len: .32, point: 0 }, { id: 'belt', leather: 'dark', w: 30, metal: q > 1 ? 'bronze' : 'iron' }, ...(rank !== null && rank < 3 && !liv ? [{ id: 'bracers', leather: 'dark' }] : set({ q, r: rr }, 'vambraces', 'couters')), { id: 'gloves', leather: 'dark' }];        // plate on the arm is a sergeant's and a knight's, not the file's (the blind reading took it for a knight)
    else if (harness === 'plates') gear = [...legs, ...set({ q, r: rr }, 'greaves', 'poleyns'), T({ dye: own ? field : liv ? liv.field : realm, len: .3, ease: 9, fitted: 1, neck: 'high', sleeves: 'long', quilt: 1, trimHem: 'dark', trim: 'dark' }), T({ dye: 'dark', len: .12, ease: 11, neck: 'v', sleeves: 'none' }), { id: 'mailcollar' }, { id: 'belt', leather: 'dark', w: 30, metal: 'bronze' }, { id: 'baldric', leather: 'brown', from: 0, metal: 'bronze' }, { id: 'bracers', leather: 'brown', studs: 1, metal: 'bronze' }, { id: 'pauldrons', q, r: rr, z: 1.35 }];
    else if (harness === 'cuirass') gear = [...legs, ...set({ q, r: rr }, 'cuisses', 'greaves', 'poleyns'), { id: 'mail', sleeves: 'long', len: .3 }, { id: 'mailcollar' }, ...set({ q, r: rr }, 'breastplate', 'fauld'), { id: 'belt', leather: 'dark', w: 30, metal: 'bronze' }, ...set({ q, r: rr }, 'rerebraces', 'vambraces', 'couters', 'gauntlets', 'besagews', 'pauldrons', 'gorget')];
    else {                                          // full plate: every piece of the harness
      gear = [{ id: 'hose', dye: 'charcoal' }, { id: 'shoes', kind: 'turn', leather: 'dark' }, { id: 'padding', dye: own ? field : 'navy', trim: 'ochre' }, { id: 'mail' },
        ...set({ q, r: rr }, 'cuisses', 'greaves', 'poleyns', 'sabatons', ...(station > 2 ? ['spurs'] : []), 'breastplate', 'fauld', 'tassets', 'rerebraces', 'vambraces', 'couters', 'gauntlets'),
        ...(own || liv || sh.officer ? [{ ...tab, len: .62 }] : []), { id: 'belt', leather: 'brown', w: 34, metal: q > 2 ? 'gold' : 'bronze', plaques: q > 1 ? 1 : 0 }, ...set({ q, r: rr }, 'besagews', 'pauldrons', 'gorget')];
    }
    // rank shows: a captain's sash of command in the realm's second colour, a commander's cloak
    if (rank >= 4 && !own && harness !== 'padded') { const at = gear.findIndex(x => x.id === 'belt'); if (at >= 0) gear.splice(at, 1, { id: 'sash', dye: lv.pale === 'charcoal' ? 'crimson' : lv.pale, w: 40, fringe: rank >= 6 ? 'mustard' : null }); }
    if ((sh.officer || own || rank >= 5 || (liv && role === 'guard')) && !cloak && harness !== 'padded' && harness !== 'leather') gear.splice(gear.findIndex(x => x.id === 'tabard' || x.id === 'belt' || x.id === 'sash'), 0, { id: 'cloak', dye: own ? field : liv ? liv.field : realm, lining: 'navy', trim: q > 1 ? 'gold' : null, len: .84, q, clasp: q > 1 ? 'gold' : 'bronze', mantle: .46 });
    if (royal) gear.push({ id: 'furcollar', fur: 'ermine', z: .2 });
    // the rank and file stand with the shield and the spear shown (a man-at-arms with a hand on his sword read as a knight)
    poses = shield0 && rank !== null && rank < 4 ? ['ease'] : sword ? ['pommel', 'pommel', 'belt', 'ease', 'folded'] : ['ease', 'belt', 'folded', 'hip'];
  } else if (kid) {
    const rich = g >= 3 && est !== 'priest', kc = cut === 'kaftan' ? { wrap: 1, neck: 'v', trim: second } : cut === 'drape' ? { sleeves: 'short' } : {};
    if (rich && male) gear = [{ id: 'hose', dye: pick(['navy', 'charcoal', 'walnut']) }, { id: 'shoes', kind: 'ankle', leather: 'brown' }, T({ dye: main, len: cut === 'robe' ? .7 : .22, ease: 8, neck: 'high', sleeves: 'long', trim: 'cream', buttons: 'bronze', fitted: 1, ...kc }), cut === 'tunic' ? { id: 'belt', leather: 'dark', w: 20, metal: 'bronze' } : { id: 'sash', dye: second, w: 30, hang: .6 }];
    else if (rich) gear = [{ id: 'shoes', kind: 'turn', leather: 'red' }, T({ dye: main, len: .96, ease: 6, fitted: 1, neck: 'round', sleeves: 'long', trim: 'mustard', flare: 50, folds: 7, ...kc }), cut === 'tunic' ? { id: 'belt', leather: 'red', w: 14, metal: 'bronze' } : { id: 'sash', dye: second, w: 28, hang: .6 }];
    else gear = [{ id: 'barelegs', from: .12 }, { id: 'shoes', kind: g === 0 || ch(.4) ? 'bare' : 'turn', leather: 'brown' }, T({ dye: g === 0 ? dyeOf('poor') : main, len: male ? .42 : .6, ease: 12, neck: 'round', sleeves: 'long', patch: ch(.5) ? 'undyed' : null, flare: 34, ...kc })];
    poses = ['ease', 'behind', 'hip', 'ease'];
  } else if (est === 'priest') {
    // the clergy: the habit, the cord and the sun are the same in every land; rank is in the white, the stole and the cap
    const high = sh.rung >= 3, mid = sh.rung === 2 || (!high && fine), d = high ? pick(['white', 'cream']) : mourn ? 'charcoal' : pick(['walnut', 'charcoal', 'brown', 'undyed', 'grey']);
    gear = [{ id: 'shoes', kind: 'turn', leather: 'tan' }, T({ dye: d, len: .96, ease: 18, neck: 'round', sleeves: 'wide', flare: 30, folds: 6, trimHem: high ? 'mustard' : null }), { id: 'belt', rope: 1, leather: 'linen', w: 15 },
      ...(high || mid ? [{ id: 'stole', dye: high ? pick(['crimson', 'purple', 'mustard']) : pick(['white', 'cream', 'sage']), trim: high ? 'mustard' : 'walnut', len: high ? .34 : .2 }] : []),
      ...(cut === 'tunic' || !high ? [{ id: 'hood', dye: d, cape: high ? .4 : .5 }] : []), { id: 'amulet', metal: high ? 'gold' : 'bronze', device: 'sun' }];
    if (high) headwear = 'mitre'; else if (!male) { headwear = 'veil'; headwearOpts = { dye: 'white' }; }       // a woman of the cloth is veiled
    poses = ['sleeves', 'sleeves', 'clasped', ...(age > 60 ? ['staff'] : [])]; staff = high ? 'crozier' : 'staff';
  } else if (role === 'tutor' || ((job === 'scribe' || job === 'healer') && g <= 4 && !work)) {
    // the learned: a long dark gown and a round cap, whatever the land
    const d = mourn ? 'black' : pick(['black', 'walnut', 'navy', 'charcoal', 'murrey']);
    gear = [{ id: 'shoes', kind: 'turn', leather: 'dark' }, T({ dye: d, len: .95, ease: 15, neck: 'high', sleeves: 'wide', flare: 34, folds: 7, trim: ch(.5) ? 'cream' : null, buttons: ch(.4) ? 'bronze' : null }), { id: 'belt', leather: 'dark', w: 20, metal: 'bronze' }, { id: 'pouch', side: -1, leather: 'dark' }, ...(badge ? [badge] : [])];
    headwear = ch(.7) ? 'cap' : 'none'; headwearOpts = { dye: ch(.6) ? d : 'black' };
    poses = ['clasped', 'sleeves', 'behind', 'ease'];
  } else if (cut === 'robe') {
    // the long robe: its cloth and its length tell the station; a sash girds it
    const len = g === 0 ? (male ? .62 : .9) : .95, sashD = liv ? liv.charge : second;
    const base = T({ dye: liv ? liv.field : main, len, ease: g >= 5 ? 12 : 14, neck: g >= 4 ? 'round' : 'slit', sleeves: g >= 3 ? 'wide' : g === 2 && !fine ? 'rolled' : 'long', flare: 34, folds: 7 });
    const feet = { id: 'shoes', kind: g === 0 ? 'bare' : 'turn', leather: g >= 5 ? 'red' : 'tan' };
    if (g === 0) gear = [feet, { ...base, dye: dyeOf('poor'), wave: 15, patch: 'walnut', patch2: 'brown', sleeves: ch(.6) ? 'short' : 'rolled' }, { id: 'belt', rope: 1, leather: 'hemp', w: 15 }];
    else if (g === 1) gear = [feet, { ...base, trim: fine || ch(.4) ? second : null }, { id: 'sash', dye: liv ? sashD : pick(['hemp', 'undyed', second]), w: 26, hang: .45 }, ...(work || ch(.3) ? [] : [{ id: 'neckcloth', dye: shade(pick(DYE.peasant)) }]), ...(ch(.4) ? [{ id: 'pouch', side: 1 }] : [])];
    else if (g === 2) gear = [feet, { ...base, len: male ? .8 : .95 }, ...(clean ? [] : [{ id: 'apron', leather: ['smith', 'mason', 'carpenter', 'bowyer', 'miner'].includes(job) ? pick(['brown', 'dark']) : pick(['linen', 'tan', 'brown']), len: .55 }]), { id: 'sash', dye: sashD, w: 36, hang: .5 }, { id: 'tool', kind: ['smith', 'mason', 'carpenter'].includes(job) || ch(.5) ? 'hammer' : 'knife', side: 1 }];
    else if (g === 3) gear = [feet, { ...base, open: ch(.5) ? 'cream' : 'linen', stripes: ch(.6) ? shade(pick(['cream', 'ochre', 'mustard'])) : null, trim: 'ochre', trimHem: 'ochre' }, { id: 'sash', dye: sashD, w: 44, stripe: 'ochre', fringe: 'ochre' }, { id: 'pouch', side: 1, z: 1.25, keys: 1, leather: 'red' }, ...(fine ? [{ id: 'chain', metal: 'silver' }] : [])];
    else if (g === 4) gear = [feet, { ...base, yoke: pick(['ochre', 'cream', 'mustard']), trimHem: second, hemPat: fine ? 'cream' : null }, { id: 'sash', dye: sashD, w: 42, fringe: 'cream' }, ...(sword ? [] : [{ id: 'tool', kind: 'knife', side: 1 }]), { id: 'brooch', metal: 'silver', throat: 1 }];
    else gear = [feet, { ...base, open: 'white', trim: 'mustard', yoke: 'mustard', trimHem: 'mustard', hemPat: 'mustard', trimW: 20 }, { id: 'sash', dye: sashD, w: 46, stripe: 'mustard', fringe: 'mustard' },
      ...(royal ? [{ id: 'cloak', dye: realm, lining: 'white', trim: 'gold', len: 1.0, q: 3, clasp: 'gold', mantle: .5, spread: .07 }, { id: 'beads', metal: 'gold', gem: '#9c1f2c' }] : male ? [{ id: 'chain', metal: 'gold', gem: sh.rung >= 5 || fine ? gem() : null }] : [{ id: 'beads', metal: 'gold', gem: sh.rung >= 5 || fine ? gem() : null }])];
    poses = g <= 1 ? (male ? ['ease', 'behind', 'belt', 'hip'] : ['clasped', 'ease', 'hip']) : g === 2 ? ['folded', 'hip', 'ease', 'belt'] : male ? ['clasped', 'belt', 'sleeves', 'ease'] : ['clasped', 'sleeves', 'ease'];
  } else if (cut === 'kaftan') {
    // the coat that crosses over the breast, over loose breeches and boots; fur and gold as the purse allows
    const long = g >= 3 || !male, len = long ? (g >= 3 ? .84 : .88) : g === 0 ? .4 : .52, tr = g === 0 ? null : g >= 5 ? 'mustard' : g >= 3 ? 'ochre' : liv ? liv.charge : second;
    const base = T({ dye: liv ? liv.field : g === 0 ? dyeOf('poor') : main, len, ease: 11, neck: 'v', wrap: 1, sleeves: g === 2 && !fine ? 'rolled' : 'long', flare: 30, folds: long ? 7 : 5, trim: tr });
    const legs = g === 0 ? [{ id: 'barelegs', from: .12 }, { id: 'wraps', dye: 'hemp' }, { id: 'shoes', kind: 'turn', leather: 'dark' }] : [{ id: 'hose', dye: pick(['walnut', 'brown', 'charcoal', 'hemp']), loose: 1 }, { id: 'shoes', kind: 'boot', leather: g >= 4 ? 'red' : 'brown', high: 1, ...(g >= 3 ? { cuff: 'bear' } : {}) }];
    if (g === 0) gear = [...legs, { ...base, wave: 15, patch: 'walnut', patch2: 'brown', sleeves: ch(.6) ? 'short' : 'rolled' }, { id: 'belt', rope: 1, leather: 'hemp', w: 15 }];
    else if (g === 1) gear = [...legs, base, ch(.6) ? { id: 'sash', dye: liv ? liv.charge : second, w: 28, hang: .45 } : { id: 'belt', leather: 'brown', w: 26 }, ...(ch(.4) ? [{ id: 'pouch', side: 1 }] : [])];
    else if (g === 2) gear = [...legs, base, ...(clean ? [] : [{ id: 'apron', leather: pick(['brown', 'tan', 'dark']), len: .5 }]), { id: 'belt', leather: 'dark', w: 30, metal: 'iron' }, { id: 'tool', kind: ch(.5) ? 'hammer' : 'knife', side: 1 }];
    else if (g === 3) gear = [...legs, { ...base, trimHem: pick(['fox', 'bear', 'hare']), trimW: 28 }, { id: 'belt', leather: 'red', w: 28, metal: 'bronze', plaques: 1 }, { id: 'pouch', side: -1, z: 1.4, keys: 1, leather: 'red' }, ...(fine ? [{ id: 'furcollar', fur: pick(['fox', 'hare', 'bear']), z: .16 }] : [])];
    else if (g === 4) gear = [...legs, { ...base, trimHem: second, hemPat: 'cream' }, { id: 'belt', leather: 'dark', w: 28, metal: 'bronze', plaques: 1 }, ...(sword ? [] : [{ id: 'tool', kind: 'knife', side: 1 }]), { id: 'brooch', metal: 'silver', at: 1 }];
    else gear = [...legs, { ...base, trimHem: 'mustard', hemPat: 'mustard', trimW: 20, yoke: null }, { id: 'belt', leather: 'red', w: 30, metal: 'gold', plaques: 1 },
      ...(royal ? [{ id: 'cloak', dye: realm, lining: 'sable', trim: 'gold', len: 1.0, q: 3, clasp: 'gold', mantle: .5, spread: .07 }] : []), { id: 'furcollar', fur: royal ? 'ermine' : pick(['sable', 'fox', 'wolf']), z: royal ? .3 : .2 }, male && !royal ? { id: 'torc', metal: 'gold' } : { id: 'chain', metal: 'gold', gem: royal || sh.rung >= 5 || fine ? gem() : null }];
    poses = g <= 1 ? (male ? ['ease', 'hip', 'belt', 'folded', 'behind'] : ['clasped', 'hip', 'ease']) : g === 2 ? ['folded', 'belt', 'hip', 'ease'] : male ? (sword ? ['pommel', 'belt', 'hip'] : ['belt', 'hip', 'ease', 'clasped']) : ['clasped', 'ease', 'sleeves'];
  } else if (cut === 'drape') {
    // a pale shift, and over it a length of dyed cloth from one shoulder to the far hip: the cloth is the wealth
    const long = !male || g >= 3, len = long ? .93 : g === 0 ? .36 : .46, pale = () => pick(['undyed', 'cream', 'linen']), edge = g >= 5 ? 'mustard' : g >= 3 ? 'ochre' : liv ? liv.charge : second;
    const shift = T({ dye: g === 0 ? dyeOf('poor') : g === 2 ? (liv ? liv.field : main) : g >= 5 ? 'white' : pale(), len, ease: 8, neck: 'round', sleeves: g >= 3 && ch(.5) ? 'short' : 'none', flare: long ? 44 : 30, folds: long ? 7 : 5,
      ...(g >= 3 ? { trimHem: edge, hemPat: g >= 4 ? 'cream' : null, hemKind: cult.pat === 'stripe' ? 'stripe' : 'zig' } : {}) });
    const wrap = { id: 'wrapcloth', dye: liv ? liv.field : main, from: ch(.5) ? 0 : 1, edge: g >= 2 || liv ? edge : ch(.5) ? second : null, edgeW: g >= 5 ? 40 : 30, pat: g >= 3 ? (cult.pat === 'stripe' ? 'stripe' : 'zig') : g === 1 && cult.pat ? 'dots' : null, patDye: g >= 5 ? 'crimson' : 'cream', knot: g >= 5 ? 'gold' : g >= 4 ? 'bronze' : null };
    const legs = long ? [{ id: 'shoes', kind: g === 0 ? 'bare' : 'turn', leather: g >= 5 ? 'red' : 'tan' }] : [{ id: 'barelegs', from: .12 }, { id: 'shoes', kind: g <= 1 && ch(.6) ? 'bare' : 'turn', leather: 'tan' }];
    // beads of clay, bone and wood for the commons (ochre beads on a countryman read as gold), glass and coral for the rich
    const bd = n => ({ id: 'beads', rows: n, dyes: g <= 2 ? [pick(['cream', 'walnut', 'madder']), pick(['walnut', 'cream', 'brown']), 'cream'] : [pick(['ochre', 'madder', 'white']), pick(['teal', 'cream', 'scarlet']), 'white'] });
    if (g === 0) gear = [...legs, { ...shift, wave: 15, patch: 'walnut', patch2: 'brown' }, { id: 'belt', rope: 1, leather: 'hemp', w: 15 }];
    else if (g === 1) gear = [...legs, shift, ...(work ? [] : [wrap]), { id: 'belt', leather: pick(['tan', 'brown']), w: 20 }, ...(ch(.3) ? [bd(1)] : [])];
    else if (g === 2) gear = [...legs, shift, ...(clean ? [wrap] : [{ id: 'apron', leather: pick(['brown', 'tan', 'linen']), len: .5 }]), { id: 'belt', leather: 'dark', w: 28, metal: 'iron' }, { id: 'tool', kind: ch(.5) ? 'hammer' : 'knife', side: 1 }, bd(1)];
    else if (g === 3) gear = [...legs, shift, wrap, { id: 'sash', dye: second, w: 42, stripe: 'ochre', fringe: 'ochre' }, { id: 'pouch', side: wrap.from ? -1 : 1, z: 1.25, keys: 1, leather: 'red' }, bd(3)];
    else if (g === 4) gear = [...legs, shift, wrap, { id: 'sash', dye: second, w: 40, fringe: 'cream' }, ...(sword ? [] : [{ id: 'tool', kind: 'knife', side: wrap.from ? -1 : 1 }]), bd(2)];
    else gear = [...legs, shift, wrap, { id: 'sash', dye: second, w: 44, stripe: 'mustard', fringe: 'mustard' }, ...(royal ? [{ id: 'cloak', dye: realm, lining: 'white', trim: 'gold', len: 1.0, q: 3, clasp: 'gold', mantle: .5, spread: .07 }] : []), { id: 'beads', metal: 'gold', gem: royal || sh.rung >= 5 || fine ? gem() : null }];
    poses = g <= 1 ? (male ? ['ease', 'hip', 'behind', 'folded'] : ['clasped', 'hip', 'ease']) : g === 2 ? ['folded', 'hip', 'ease', 'belt'] : male ? ['clasped', 'belt', 'hip', 'ease'] : ['clasped', 'ease', 'hip'];
  } else if (g === 0) {
    const bare = est !== 'serf';
    if (male) gear = [{ id: 'barelegs', from: .12 }, ...(bare ? [] : [{ id: 'wraps', dye: 'hemp' }]), { id: 'shoes', kind: bare ? 'bare' : 'turn', leather: 'dark' }, T({ dye: dyeOf('poor'), len: .34, ease: 14, neck: 'slit', sleeves: ch(.7) ? 'short' : 'rolled', patch: 'walnut', patch2: 'brown', wave: 15 }), ...(est === 'prisoner' ? [] : [{ id: 'belt', rope: 1, leather: 'hemp', w: 16 }])];
    else gear = [{ id: 'shoes', kind: bare ? 'bare' : 'turn', leather: 'dark' }, T({ dye: dyeOf('poor'), len: .9, ease: 10, neck: 'round', sleeves: ch(.6) ? 'short' : 'rolled', patch: 'walnut', patch2: 'brown', flare: 40, folds: 6, wave: 14 }), { id: 'belt', rope: 1, leather: 'hemp', w: 14 }, ...(est === 'serf' && ch(.4) ? [{ id: 'apron', leather: 'undyed', len: .6 }] : [])];
    if (est === 'serf' && (work || where === 'out' ? ch(.6) : ch(.25))) headwear = male ? pick(['strawhat', 'coif']) : 'kerchief'; headwearOpts = { dye: 'undyed' };
    poses = male ? ['ease', 'behind', 'belt', 'hip'] : ['clasped', 'ease', 'hip'];
  } else if (royal) {
    const robe = shade(pick(field === realm ? ['crimson', 'purple', 'blue', 'murrey'] : [field, field, 'crimson', 'purple']));
    if (male) gear = [{ id: 'shoes', kind: 'poulaine', leather: 'red' }, T({ dye: mourn ? 'black' : robe, len: .97, ease: 15, neck: 'round', sleeves: 'bell', trim: 'mustard', trimHem: 'mustard', trimW: 22, flare: 40, folds: 7, buttons: 'gold' }), { id: 'belt', leather: 'dark', w: 30, metal: 'gold', plaques: 1 }, { id: 'cloak', dye: realm, lining: 'ermine', trim: 'gold', len: 1.0, q: 3, clasp: 'gold', mantle: .5, spread: .075 }, { id: 'furcollar', fur: 'ermine', z: .34 }, { id: 'chain', metal: 'gold', gem: gem() }];
    else gear = [{ id: 'shoes', kind: 'poulaine', leather: 'red' }, T({ dye: mourn ? 'black' : robe, len: 1.0, ease: 4, fitted: 1, neck: 'wide', sleeves: 'wide', trim: 'mustard', trimHem: 'mustard', flare: 70, folds: 9 }), { id: 'belt', leather: 'red', w: 20, metal: 'gold', plaques: 1, hang: 240, at: .5 }, { id: 'cloak', dye: realm, lining: 'ermine', trim: 'gold', len: .98, q: 3, clasp: 'gold', mantle: .5, spread: .07 }, { id: 'furcollar', fur: 'ermine', z: .26 }, { id: 'chain', metal: 'gold', gem: gem() }];
    poses = male ? (sword ? ['sword', 'pommel', 'belt'] : ['belt', 'ease', 'behind']) : ['clasped', 'ease', 'sleeves'];
  } else if (g === 5) {
    // the high-born: the cloth is their own choice, the house's colour is in the lining, the cloak or the trim (a
    // family in one colour was a row of clones); the jewel is by rank
    const jewel = sh.rung >= 5 || fine ? { id: 'chain', metal: 'gold', gem: gem() } : { id: 'brooch', metal: 'gold', throat: 1, gem: gem() }, hc = mourn ? 'charcoal' : field, v = Math.floor(r() * 3);
    if (work && male) gear = [{ id: 'hose', dye: pick(['forest', 'walnut', 'brown']), loose: 1 }, { id: 'shoes', kind: 'boot', leather: 'brown', high: 1 }, T({ dye: main, len: .26, ease: 9, neck: 'slit', sleeves: 'long', trim: 'ochre' }), T({ dye: pick(['brown', 'tan', 'dark']), len: .2, ease: 11, neck: 'v', sleeves: 'none' }), { id: 'belt', leather: 'dark', w: 30, metal: 'bronze', plaques: 1 }, { id: 'bracers', leather: 'brown', studs: 1, metal: 'bronze' }];
    else if (male && v === 1) gear = [{ id: 'shoes', kind: 'poulaine', leather: 'dark' }, T({ dye: main, len: .9, ease: 14, neck: 'high', sleeves: 'bell', trim: 'mustard', trimHem: pick(['sable', 'fox', 'mustard']), trimW: 22, flare: 40, folds: 7, buttons: 'gold' }), { id: 'belt', leather: 'dark', w: 28, metal: 'gold', plaques: 1 }, { id: 'chain', metal: 'gold', gem: sh.rung >= 5 || fine ? gem() : null }, ...(fine || ch(.4) ? [{ id: 'furcollar', fur: pick(['sable', 'wolf', 'fox']), z: .2 }] : [])];
    else if (male) gear = [{ id: 'hose', dye: v ? hc : pick(['charcoal', 'navy', 'walnut']) }, { id: 'shoes', kind: 'boot', leather: 'dark', high: 1 }, T({ dye: main, len: .34, ease: 8, fitted: 1, neck: 'high', sleeves: 'long', trim: 'mustard', trimHem: 'mustard', trimW: 14, buttons: 'gold', flare: 30 }), { id: 'belt', leather: 'dark', w: 30, metal: 'gold', plaques: 1 },
      ...(fine || road || ch(.6) ? [{ id: 'cloak', dye: v ? shade(pick(DYE.noble)) : hc, lining: v ? hc : 'charcoal', trim: 'gold', len: v ? .5 : .78, q: 2, clasp: 'gold', mantle: .46 }, ...(v ? [] : [{ id: 'furcollar', fur: pick(['sable', 'wolf', 'fox']), z: .22 }]), ...(fine ? [jewel] : [])] : [jewel])];
    else gear = [{ id: 'shoes', kind: 'poulaine', leather: 'red' }, T({ dye: v === 1 ? second : main, len: 1.0, ease: 4, fitted: 1, neck: 'wide', sleeves: v === 2 ? 'bell' : 'wide', trim: 'mustard', trimHem: 'mustard', flare: 70, folds: 9 }),
      ...(v === 1 ? [T({ dye: main, len: .98, ease: 9, neck: 'v', sleeves: 'none', trim: 'mustard', trimHem: pick(['ermine', 'sable', 'mustard']), flare: 66, folds: 8 })] : []), { id: 'belt', leather: 'red', w: 20, metal: 'gold', plaques: 1, hang: 240, at: .5 }, jewel, ...(!mourn && !work ? [{ id: 'furcollar', fur: pick(['ermine', 'sable', 'fox']), z: .17 }] : []),
      ...(fine && v !== 1 ? [{ id: 'cloak', dye: hc, lining: 'charcoal', trim: 'gold', len: .9, q: 2, clasp: 'gold', mantle: .44 }] : [])];
    headwear = work ? 'none' : !male ? (ch(.7) ? 'circlet' : 'veil') : sh.rung >= 5 && ch(.5) ? 'circlet' : v === 1 && ch(.5) ? 'cap' : 'none';
    headwearOpts = headwear === 'veil' ? { fillet: 1, dye: mourn ? 'black' : 'white' } : headwear === 'cap' ? { dye: second, badge: 'gold', feather: ch(.5) ? 'white' : null } : {};
    poses = male ? (sword ? ['pommel', 'pommel', 'belt', 'hip'] : ['belt', 'hip', 'behind', 'ease']) : ['clasped', 'ease', 'hip', 'sleeves'];
  } else if (g === 4) {
    const lc = liv ? liv.field : main;
    if (male) gear = [{ id: 'hose', dye: liv ? liv.charge : pick(['navy', 'charcoal', 'walnut', 'forest']) }, { id: 'shoes', kind: ch(.5) ? 'boot' : 'ankle', leather: 'brown', high: 1 }, T({ dye: lc, len: ch(.5) ? .24 : .32, ease: 7, neck: 'high', sleeves: 'long', trim: liv ? liv.charge : 'cream', trimHem: ch(.4) ? 'cream' : null, buttons: 'bronze', fitted: 1 }), { id: 'belt', leather: 'dark', w: 26, metal: 'bronze', plaques: fine ? 1 : 0 }, ...(sword ? [] : [{ id: 'tool', kind: 'knife', side: 1 }]),
      ...(fine || road || ch(.3) ? [{ id: 'cloak', dye: shade(pick(DYE.gentry)), len: .5, q: 1, clasp: 'bronze', mantle: .42 }] : [{ id: 'brooch', metal: 'silver', throat: 1 }])];
    else gear = [{ id: 'shoes', kind: 'turn', leather: 'red' }, T({ dye: lc, len: 1.0, ease: 5, fitted: 1, neck: 'wide', sleeves: 'long', trim: 'cream', trimHem: 'cream', flare: 60, folds: 8 }), { id: 'belt', leather: 'tan', w: 18, metal: 'bronze', hang: 160, at: .5 }, { id: 'brooch', metal: 'silver', throat: 1, gem: fine ? gem() : null }, ...(ch(.3) ? [{ id: 'shawl', dye: second, cape: .6, edge: 'cream' }] : [])];
    if (badge) gear.push(badge);
    headwear = male ? (ch(.4) ? 'cap' : 'none') : sh.married && ch(.5) ? 'veil' : 'none'; headwearOpts = male ? { dye: shade(pick(DYE.gentry)), feather: ch(.6) ? pick(['white', 'cream', 'russet']) : null, badge: 'bronze' } : { dye: mourn ? 'black' : 'white' };
    poses = male ? (sword ? ['pommel', 'belt', 'hip'] : ['belt', 'hip', 'ease', 'behind']) : ['clasped', 'ease', 'hip'];
  } else if (g === 3) {
    const d = main;
    if (male) gear = [{ id: 'shoes', kind: 'turn', leather: 'dark' }, T({ dye: d, len: .93, ease: 16, neck: 'v', sleeves: 'bell', trim: 'ochre', trimHem: pick(['bear', 'fox', 'sable']), trimW: 30, flare: 44, folds: 7, buttons: 'bronze' }), { id: 'belt', leather: 'red', w: 26, metal: 'bronze', plaques: 1 }, { id: 'pouch', side: -1, z: 1.4, keys: 1, leather: 'red' }, ...(fine ? [{ id: 'furcollar', fur: pick(['bear', 'fox', 'wolf']), z: .2 }, { id: 'chain', metal: 'silver' }] : [])];
    else gear = [{ id: 'shoes', kind: 'turn', leather: 'dark' }, T({ dye: d, len: .97, ease: 8, fitted: 1, neck: 'round', sleeves: 'bell', trim: 'ochre', trimHem: 'ochre', flare: 56, folds: 8 }), { id: 'belt', leather: 'red', w: 20, metal: 'bronze', plaques: 1 }, { id: 'pouch', side: -1, z: 1.3, keys: 1, leather: 'red' }, ...(fine ? [{ id: 'furcollar', fur: pick(['bear', 'fox']), z: .16 }, { id: 'chain', metal: 'silver' }] : [])];
    headwear = male ? pick(['chaperon', 'chaperon', 'cap']) : ch(.6) ? 'veil' : 'none'; headwearOpts = male ? { dye: shade(pick(DYE.merchant)), badge: headwear === 'cap' ? 'bronze' : 1 } : { dye: mourn ? 'black' : 'white' };
    poses = male ? ['clasped', 'belt', 'folded', 'ease'] : ['clasped', 'ease', 'sleeves'];
  } else if (g === 2) {
    // the crafts: the apron and the tool of the trade, sleeves rolled; on a feast day a clean coat and a cap
    const heavy = ['smith', 'mason', 'carpenter', 'bowyer', 'miner'].includes(job), lc = liv ? liv.field : main;
    if (male) gear = [{ id: 'hose', dye: pick(['walnut', 'brown', 'charcoal']) }, { id: 'shoes', kind: 'boot', leather: 'dark' }, T({ dye: !liv && !fine && ch(.4) && !chosen ? shade('cream') : lc, len: .28, ease: 9, neck: 'slit', sleeves: fine ? 'long' : ch(.6) ? 'rolled' : 'long', trim: fine ? second : null }),
      ...(clean ? [] : heavy || ch(.75) ? [{ id: 'apron', leather: heavy ? pick(['brown', 'dark']) : pick(['brown', 'tan', 'dark', 'linen']), len: .5 }] : []), { id: 'belt', leather: 'dark', w: 32, metal: 'iron' }, { id: 'tool', kind: heavy || ch(.5) ? 'hammer' : 'knife', side: 1 }, ...(ch(.5) ? [{ id: 'pouch', side: -1 }] : [])];
    else gear = [{ id: 'shoes', kind: 'turn', leather: 'brown' }, T({ dye: lc, len: .97, ease: 5, fitted: 1, neck: 'laced', sleeves: fine ? 'long' : ch(.4) ? 'rolled' : 'long', flare: 60, folds: 8, trimHem: fine ? second : null }), ...(clean ? [] : [{ id: 'apron', leather: pick(['linen', 'linen', 'cream', 'tan']), len: .7 }]), { id: 'belt', leather: 'tan', w: 18 }, { id: 'pouch', side: -1 }, ...(ch(.4) ? [{ id: 'tool', kind: 'knife', side: 1 }] : [])];
    if (badge) gear.push(badge);
    headwear = male ? (ch(.5) ? pick(['coif', 'cap', 'cap']) : 'none') : ch(.6) ? pick(['kerchief', 'coif']) : 'none'; headwearOpts = { dye: male ? shade(pick(DYE.artisan)) : pick(['linen', 'white', 'cream']) };
    poses = male ? ['folded', 'belt', 'hip', 'ease'] : ['clasped', 'hip', 'ease', 'folded'];
  } else {                                          // the free commons
    const lc = liv ? liv.field : main, v = Math.floor(r() * 4), maid = role === 'maid' || role === 'nurse' || job === 'servant';
    if (male) gear = [{ id: 'hose', dye: liv ? liv.charge : pick(['brown', 'walnut', 'grey', 'hemp']) }, { id: 'shoes', kind: job === 'hunter' || job === 'herd' ? 'boot' : 'ankle', leather: 'dark' }, T({ dye: lc, len: .36, ease: 12, neck: ch(.5) ? 'round' : 'slit', sleeves: work && ch(.6) ? 'rolled' : 'long', trim: liv ? liv.charge : fine || ch(.4) ? second : null }),
      ...(liv ? [] : job === 'hunter' || v === 1 ? [T({ dye: job === 'hunter' ? pick(['brown', 'tan', 'dark']) : second, len: .3, ease: 14, neck: 'v', sleeves: 'none' })] : []), { id: 'belt', leather: 'brown', w: 26 }, ...(ch(.5) ? [{ id: 'pouch', side: -1 }] : []),
      ...(job === 'sailor' || job === 'pirate' || job === 'fish' || v === 2 ? [{ id: 'neckcloth', dye: shade(pick(['madder', 'woad', 'ochre', 'cream'])) }] : v === 3 && ch(.4) ? [{ id: 'hood', dye: shade(pick(DYE.hood)) }] : [])];
    else gear = [{ id: 'shoes', kind: 'turn', leather: 'brown' }, T({ dye: lc, len: .97, ease: 5, fitted: 1, neck: ch(.6) ? 'laced' : 'round', sleeves: work && ch(.5) ? 'rolled' : 'long', flare: 60, folds: 8, trimHem: fine ? second : null }), ...(!clean && (maid || work || ch(.5)) ? [{ id: 'apron', leather: 'linen', len: .7 }] : []), { id: 'belt', leather: 'tan', w: 18 },
      ...(!maid && v >= 2 ? [{ id: 'shawl', dye: second, cape: .62, fringe: ch(.5) ? 1 : 0 }] : [])];
    if (badge) gear.push(badge);
    headwear = male ? (job === 'farm' || job === 'herd' || work || where === 'out' ? (ch(.4) ? 'strawhat' : 'none') : ch(.12) ? 'coif' : job === 'minstrel' || ch(.12) ? 'cap' : 'none') : role === 'nurse' ? 'veil' : maid ? pick(['coif', 'kerchief']) : (sh.married || age > 40) && ch(.5) ? 'kerchief' : ch(.12) ? 'coif' : 'none';
    headwearOpts = { dye: male ? shade(pick(DYE.peasant)) : pick(['linen', 'white', 'cream', 'undyed']), ...(job === 'minstrel' ? { feather: 'madder' } : {}) };
    poses = male ? ['ease', 'hip', 'belt', 'folded', 'behind'] : ['clasped', 'hip', 'ease', 'folded'];
  }
  const civilDress = age >= 3 && !harness && !kid && est !== 'priest';
  // a people's habits, on any cut: beads or bones at the neck, a torc, a worked yoke, fur, a border on the hem
  if (civilDress && !royal && grown) {
    const has = k => gear.some(x => x.id === k), mainT = gear.find(x => x.id === 'tunic');
    if ((cult.collar === 'beads' || cult.collar === 'bones') && !has('beads') && !has('chain') && g >= 1 && ch(cult.collar === 'bones' ? .7 : .5)) gear.push({ id: 'beads', rows: g >= 3 ? 2 : 1, fangs: cult.collar === 'bones' ? 1 : 0, dyes: cult.collar === 'bones' ? ['walnut', 'cream'] : g <= 2 ? [pick(['cream', 'walnut', 'madder']), 'walnut'] : [pick(['ochre', 'madder', 'white']), 'teal'] });
    if (cult.torc && g >= 2 && !has('torc') && !has('chain') && !has('beads') && ch(.6)) gear.push({ id: 'torc', metal: g >= 5 ? 'gold' : g >= 4 ? 'silver' : 'bronze' });
    if (cult.collar === 'embroidered' && mainT && !mainT.yoke && g >= 1 && g <= 4 && ch(.7)) mainT.yoke = pick(['madder', 'cream', 'woad']);
    if ((cult.collar === 'fur' || cult.fur) && !has('furcollar') && !has('cloak') && !has('shawl') && !has('hood') && g === 4 && ch(cult.collar === 'fur' ? .5 : .25)) gear.push({ id: 'furcollar', fur: pick(['wolf', 'bear', 'hare']), z: .15 });
    if (cult.sash && cut === 'tunic' && g >= 1 && g <= 4 && ch(.7)) { const at = gear.findIndex(x => x.id === 'belt' && !x.rope); if (at >= 0 && !gear.some(x => x.id === 'tool' || x.id === 'pouch')) gear.splice(at, 1, { id: 'sash', dye: second, w: 36, hang: .6 }); }
    if (cult.pat && cut === 'tunic' && mainT && g >= 1 && !mainT.hemPat && mainT.len > .2 && ch(.5)) { mainT.hemPat = pick(['cream', 'ochre']); mainT.hemKind = cult.pat === 'stripe' ? 'stripe' : 'zig'; }
    if (cult.band && mainT && !mainT.trim && g >= 1 && ch(.6)) mainT.trim = second;
    if (cult.apron && g === 1 && male && !has('apron') && !fine && ch(.5)) gear.splice(gear.findIndex(x => x.id === 'belt'), 0, { id: 'apron', leather: pick(['brown', 'tan']), len: .45 });
  }
  // the road: a cloak over whatever is worn
  if (road && civilDress && !gear.some(x => x.id === 'cloak') && !cloak) { const at = Math.max(0, gear.findIndex(x => x.id === 'belt' || x.id === 'sash')); gear = gear.filter(x => x.id !== 'shawl' && x.id !== 'hood' && x.id !== 'furcollar'); gear.splice(Math.min(at, gear.length), 0, { id: 'cloak', dye: g >= 4 ? shade(pick(DYE.gentry)) : pick(['charcoal', 'walnut', 'forest', 'grey', 'brown']), len: .8, q: g >= 4 ? 2 : 1, clasp: g >= 4 ? 'silver' : 'bronze', mantle: .46 }); }
  // the old lean on a staff
  if (age > 68 && !harness && !royal && ch(.45)) { poses = ['staff']; staff = staff || 'staff'; }

  // what is carried, by item: only what an item says of itself is written on it (its form, and whose make it is)
  const own = it => ({ ...(it.form ? { form: it.form } : {}), ...(it.st ? { st: it.st } : {}) });
  if (weapon && grown) {
    const two = weapon.form === 'great' || weapon.form === 'maul';
    if (weapon.art === 'sword') gear.push({ id: 'sword', q: weapon.q, r: weapon.r, long: weapon.long, ...own(weapon) });
    else if (weapon.art === 'dagger') gear.push({ id: 'dagger', q: weapon.q, r: weapon.r, ...own(weapon) });
    else if ((weapon.art === 'axe' || weapon.art === 'hammer') && !two) gear.push({ id: 'sidearm', q: weapon.q, r: weapon.r, form: weapon.form || (weapon.art === 'axe' ? 'axe' : 'mace'), ...(weapon.st ? { st: weapon.st } : {}) });
    else if (weapon.art === 'spear' || two) { poses = ['staff']; staff = { kind: 'pole', form: weapon.form || 'spear', q: weapon.q, r: weapon.r, ...(weapon.st ? { st: weapon.st } : {}), ...(weapon.form === 'lance' ? { pennon: realm } : {}) }; }
    else if (weapon.art === 'staff') { poses = ['staff']; staff = 'staff'; }
  }
  if (ranged && ranged.art === 'bow') gear.push({ id: 'bow', q: ranged.q, r: ranged.r, form: ranged.form || 'long', ...(ranged.st ? { st: ranged.st } : {}) }, { id: 'quiver', q: ranged.q, r: ranged.r });
  else if (ranged && ranged.art === 'crossbow') gear.push({ id: 'crossbow', q: ranged.q, r: ranged.r }, { id: 'quiver', q: ranged.q, r: ranged.r, bolts: 1 });
  const sf = liv ? liv.field : device ? field : realm, sp = liv ? liv.charge : device ? chargeC : 'ochre', sd = liv ? liv.device : device;
  if (shield && shield.art === 'shield') gear.push({ id: 'shield', q: shield.q, r: shield.r, ...own(shield), field: sf, pale: sp, device: sd || null });
  else if (shield && shield.art === 'dagger') gear.push({ id: 'dagger', q: shield.q, r: shield.r, ...own(shield) });
  if (cloak && cloak.cloak && !mourn) {
    gear = gear.filter(x => x.id !== 'cloak');
    const at = Math.max(0, gear.findIndex(x => x.id === 'tabard' || x.id === 'belt' || x.id === 'sash'));
    if (cloak.cloak === 'tabard') { if (!gear.some(x => x.id === 'tabard')) gear.splice(at, 0, { id: 'tabard', field: liv ? liv.field : field, pale: liv ? liv.charge : chargeC, trim: 'bronze', len: .5, device: liv ? liv.device : device }); }
    else {
      gear = gear.filter(x => x.id !== 'shawl' && x.id !== 'hood');
      gear.splice(at, 0, { id: 'cloak', dye: cloak.cloak === 'fine' ? shade(pick(DYE.noble)) : pick(['charcoal', 'walnut', 'forest', 'navy', 'grey']), lining: cloak.cloak === 'fine' ? 'charcoal' : null, trim: cloak.cloak === 'fine' ? 'gold' : null, len: .82, q: cloak.q, clasp: cloak.cloak === 'fine' ? 'gold' : 'bronze', mantle: .46 });
      if (cloak.cloak === 'fur' && !gear.some(x => x.id === 'furcollar')) gear.push({ id: 'furcollar', fur: pick(['wolf', 'bear', 'fox']), z: .26 });
    }
  }
  const hpick = a => a[Math.floor(rh() * a.length) % a.length];
  // ---- the head ------------------------------------------------------------------------------------------------------
  if (royal && age >= 3) { headwear = sh.ruler ? 'crown' : 'circlet'; headwearOpts = {}; }
  // a helm is worn by the rank and file under arms (an arming cap or a mail coif by the rest of them); those whose face
  // is their name, and captains, go bare-headed in a portrait
  const file = harness && !sh.ruler && !sh.pc && est !== 'noble' && !royal && !sh.officer && !(rank >= 4);
  if (file && helm && helm.helm && helm.helm !== 'bascinet' && hch(.85)) { headwear = helm.helm; headwearOpts = { q: helm.q, r: helm.r, dye: 'grey' }; }
  else if (file && (harness === 'padded' || harness === 'mail') && hch(.6)) { headwear = harness === 'mail' ? 'mailcoif' : 'armingcap'; headwearOpts = {}; }
  // a people's own headwear. A raised hood is for the road and the weather: never in a list, never under a roof
  const hatWord = Array.isArray(cult.hat) ? cult.hat[male ? 0 : 1] : null;
  if (headwear === 'none' && civilDress && grown && !royal && hatWord && !(role === 'tutor')) {
    const rich = g >= 5, p = g === 0 ? (!male && (hatWord === 'kerchief' || hatWord === 'veil') ? .35 : 0) : hatWord === 'hood' ? (where === 'out' && g <= 2 ? (road ? .5 : .3) : 0) : hatWord === 'turban' || hatWord === 'wrap' ? .62 : hatWord === 'veil' ? (sh.married || age > 34 ? .6 : .3) : hatWord === 'fillet' || hatWord === 'leaves' || hatWord === 'feathers' ? .5 : g === 0 ? .2 : .45;
    const hd = mourn ? 'charcoal' : null;
    if (hch(p)) {
      if (hatWord === 'hood') { headwear = 'hood'; headwearOpts = { dye: (gear.find(x => x.id === 'cloak') || {}).dye || shade(hpick(DYE.hood)) }; }
      else if (hatWord === 'turban') { headwear = 'turban'; headwearOpts = { dye: hd || (g <= 2 ? hpick(['undyed', 'hemp', 'cream', second]) : rich ? hpick(['white', 'cream', second]) : hpick(['white', 'cream', 'linen', second])), big: g >= 3 ? 1 : 0, tail: g <= 2 ? 1 : 0, band: g === 3 || g === 4 ? 'ochre' : null, jewel: rich ? gem() : null }; }
      else if (hatWord === 'wrap') { headwear = 'headwrap'; headwearOpts = { dye: hd || (g <= 1 ? hpick(['undyed', 'hemp', second]) : second), tall: g >= 3 ? 1 : 0, band: g >= 3 ? (rich ? 'mustard' : 'ochre') : null }; }
      else if (hatWord === 'kerchief') { headwear = 'kerchief'; headwearOpts = { dye: hd || (g === 0 ? 'undyed' : hpick(['linen', 'white', 'cream', second])), band: g >= 2 ? second : null }; }
      else if (hatWord === 'veil' && g === 0) { headwear = 'kerchief'; headwearOpts = { dye: 'undyed' }; }
      else if (hatWord === 'veil') { headwear = 'veil'; headwearOpts = { dye: hd || (g >= 3 ? 'white' : hpick(['linen', 'cream', 'undyed'])), fillet: g >= 5 ? 1 : 0 }; }
      else if (hatWord === 'cone') { headwear = 'conehat'; headwearOpts = { dye: hd || (g === 0 ? 'hemp' : hpick(['walnut', 'grey', 'brown', second])), fur: g >= 3 ? hpick(['fox', 'bear', 'sable']) : null, band: g >= 1 ? second : null }; }
      else if (hatWord === 'furhat') { headwear = 'furhat'; headwearOpts = { dye: hd || (g === 0 ? 'hemp' : g >= 3 ? main : second), fur: g >= 5 ? 'sable' : g >= 3 ? 'fox' : hpick(['bear', 'wolf', 'hare']) }; }
      else if (hatWord === 'cap') { headwear = 'cap'; headwearOpts = { dye: hd || second, badge: g >= 4 ? 'bronze' : null, feather: g >= 4 && hch(.5) ? 'white' : null }; }
      else if (hatWord === 'fillet' || hatWord === 'leaves' || hatWord === 'feathers') { headwear = rich ? 'circlet' : 'fillet'; headwearOpts = rich ? {} : { dye: hd || second, ...(hatWord === 'leaves' ? { leaves: 'sage' } : hatWord === 'feathers' ? { feathers: hpick(['white', 'madder', 'teal']) } : {}) }; }
    }
  }
  // the road in the north: a hood up against the weather, out of doors only
  if (headwear === 'none' && road && where === 'out' && civilDress && g <= 3 && cut === 'tunic' && hch(.35)) { headwear = 'hood'; headwearOpts = { dye: (gear.find(x => x.id === 'cloak') || {}).dye || 'walnut' }; }
  if (where !== 'out' && headwear === 'hood') { headwear = 'none'; headwearOpts = {}; }
  if (where === 'list' && headwear === 'strawhat' && !work) { headwear = 'none'; headwearOpts = {}; }
  if (mourn && headwear === 'veil') headwearOpts = { ...headwearOpts, dye: 'black' };
  // the fit: no two coats hang quite alike (a hand's breadth in the hem, a finger in the ease). A livery is cut to one pattern.
  if (!liv) { const rf = stream(id, 'kit-fit'), t = gear.find(x => x.id === 'tunic' || x.id === 'padding'); if (t && typeof (t.len ?? .36) === 'number') { t.len = Math.round(((t.len ?? .36) + (Math.floor(rf() * 9) - 4) * .006) * 1000) / 1000; t.ease = (t.ease ?? 10) + Math.floor(rf() * 5) - 2; t.flare = (t.flare ?? 26) + Math.floor(rf() * 7) * 2 - 6; } }
  let pose = poses[Math.floor(stream(o.id, 'pose')() * poses.length) % poses.length];
  if ((pose === 'pommel' || pose === 'sword') && !gear.some(x => x.id === 'sword')) pose = 'belt';
  if ((pose === 'belt') && gear.some(x => x.id === 'sash') && !gear.some(x => x.id === 'belt')) pose = 'hip';
  return { gear: gear.filter(Boolean), headwear, headwearOpts, pose, staff, arms, wear, cut, grade: g, livery: !!liv || (!!harness && !(device && (est === 'noble' || royal))) };
}
