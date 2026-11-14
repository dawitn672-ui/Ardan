// A throwaway count behind docs/design/economy-and-items.md §2.2: how many kinds of weapon and armour do the rules
// give? A kind is a form (one drawing) made in a style (a people's way of making it) from a material. It is not game
// code and nothing builds from it; the real tables will be data/items/forms.json, styles.json and materials.json.
//
//   node docs/design/trials/item-kinds.mjs
//
// Result, 2026-11-13: 110 forms (72 weapons, 38 pieces of armour) give 845 kinds: 549 weapons (132 swords) and 296
// pieces of armour; in five grades, 4,225 different pieces.
const human = ['north', 'court', 'highland', 'desert', 'coast', 'savanna'];
// materials by what the thing is made of, poorest first
const MAT = {
  blade: ['iron', 'steel', 'fine steel'],
  head: ['iron', 'steel'],                 // axe, mace and spear heads on a haft; a crossbow's prod and fittings
  wood: ['ash', 'yew'],
  bow: ['ash', 'yew', 'horn and sinew'],
  padded: ['linen', 'wool'],
  leather: ['leather', 'boiled leather'],
  mail: ['iron', 'steel'],
  plate: ['iron', 'steel', 'fine steel'],
  shield: ['lime wood', 'oak and iron'],
};
// the metal only one people makes
const SPECIAL = { desert: 'crucible steel', dwarf: 'dwarf-steel', elf: 'silver-steel' };
// family: [form, what it is made of, the styles that make it]
const F = {
  sword: [['long knife', 'blade', ['north', 'highland', 'coast']], ['short sword', 'blade', [...human, 'dwarf', 'orc']], ['arming sword', 'blade', ['north', 'court', 'highland', 'coast']],
    ['broadsword', 'blade', ['north', 'highland', 'dwarf']], ['falchion', 'blade', ['north', 'court', 'coast']], ['messer', 'blade', ['north', 'highland']],
    ['sabre', 'blade', ['desert', 'savanna', 'coast', 'orc']], ['scimitar', 'blade', ['desert', 'savanna']], ['backsword', 'blade', ['court', 'coast']],
    ['longsword', 'blade', ['north', 'court', 'highland']], ['bastard sword', 'blade', ['north', 'court']], ['estoc', 'blade', ['court']],
    ['greatsword', 'blade', ['north', 'highland', 'court']], ['leaf-blade', 'blade', ['elf']], ['cleaver-sword', 'blade', ['orc']], ['hold-blade', 'blade', ['dwarf']]],
  axe: [['hand axe', 'head', [...human, 'dwarf', 'orc']], ['bearded axe', 'head', ['north', 'highland', 'dwarf']], ['war axe', 'head', ['north', 'court', 'highland', 'coast']],
    ['broad axe', 'head', ['north', 'coast']], ['great axe', 'head', ['north', 'highland', 'dwarf', 'orc']], ['horseman\'s axe', 'head', ['court', 'desert', 'savanna']], ['cleaver', 'head', ['orc']]],
  mace: [['cudgel', 'wood', human], ['studded club', 'head', ['north', 'highland', 'orc', 'savanna']], ['flanged mace', 'head', ['north', 'court', 'desert']], ['morning star', 'head', ['north', 'court', 'highland']],
    ['war hammer', 'head', ['north', 'court', 'dwarf']], ['war pick', 'head', ['court', 'desert', 'highland']], ['flail', 'head', ['north', 'highland', 'court']],
    ['horseman\'s mace', 'head', ['court', 'desert', 'savanna']], ['great hammer', 'head', ['dwarf']], ['trunk-club', 'wood', ['giant']]],
  spear: [['spear', 'head', [...human, 'elf', 'orc']], ['boar spear', 'head', ['north', 'highland', 'court']], ['winged spear', 'head', ['north', 'coast']], ['long spear', 'head', ['north', 'highland', 'desert', 'savanna']],
    ['light lance', 'head', ['desert', 'savanna', 'court']], ['heavy lance', 'head', ['north', 'court']]],
  polearm: [['pike', 'head', ['north', 'highland', 'coast']], ['glaive', 'head', ['north', 'court', 'elf']], ['halberd', 'head', ['north', 'highland', 'court']], ['billhook', 'head', ['north', 'coast']],
    ['poleaxe', 'head', ['north', 'court']], ['partisan', 'head', ['court', 'coast']], ['voulge', 'head', ['north', 'highland']], ['bardiche', 'head', ['north', 'highland', 'orc']], ['war scythe', 'head', ['north', 'highland', 'savanna']]],
  dagger: [['knife', 'blade', human], ['dagger', 'blade', [...human, 'elf', 'dwarf']], ['rondel dagger', 'blade', ['north', 'court']], ['stiletto', 'blade', ['court', 'coast']], ['dirk', 'blade', ['highland', 'coast']], ['curved dagger', 'blade', ['desert', 'savanna']]],
  staff: [['quarterstaff', 'wood', human], ['iron-shod staff', 'wood', ['north', 'court', 'desert']]],
  bow: [['self bow', 'bow', human], ['flat bow', 'bow', ['north', 'savanna', 'coast']], ['longbow', 'bow', ['north', 'highland', 'elf']], ['war bow', 'bow', ['north', 'highland']],
    ['composite bow', 'bow', ['desert', 'savanna', 'orc']], ['horse bow', 'bow', ['desert', 'savanna', 'orc']], ['grove bow', 'bow', ['elf']]],
  crossbow: [['light crossbow', 'head', ['north', 'court', 'coast']], ['crossbow', 'head', ['north', 'court', 'coast', 'dwarf']], ['windlass crossbow', 'head', ['north', 'court', 'dwarf']], ['arbalest', 'head', ['court', 'dwarf']]],
  thrown: [['javelins', 'head', ['north', 'coast', 'savanna', 'desert', 'orc']], ['throwing axes', 'head', ['north', 'highland', 'dwarf']], ['throwing knives', 'blade', ['court', 'coast', 'desert']], ['sling', 'leather', ['highland', 'savanna', 'desert']], ['darts', 'head', ['coast', 'savanna']]],
  body: [['padded jack', 'padded', human], ['gambeson', 'padded', ['north', 'court', 'highland', 'coast']], ['leather jerkin', 'leather', [...human, 'elf', 'orc']], ['hide coat', 'leather', ['highland', 'savanna', 'orc', 'giant']],
    ['scale coat', 'plate', ['desert', 'savanna', 'coast', 'elf']], ['lamellar', 'plate', ['desert', 'savanna', 'orc']], ['mail shirt', 'mail', [...human, 'dwarf']], ['hauberk', 'mail', ['north', 'court', 'highland', 'dwarf']],
    ['brigandine', 'plate', ['north', 'court', 'coast']], ['coat of plates', 'plate', ['north', 'court', 'highland']], ['splinted mail', 'plate', ['north', 'highland', 'desert']], ['mail and plates', 'plate', ['desert', 'savanna', 'court']],
    ['breastplate and mail', 'plate', ['north', 'court', 'dwarf']], ['full harness', 'plate', ['north', 'court']], ['fluted harness', 'plate', ['court']]],
  helm: [['padded cap', 'padded', human], ['leather cap', 'leather', [...human, 'orc']], ['mail coif', 'mail', ['north', 'court', 'highland']], ['nasal helm', 'plate', ['north', 'highland', 'coast']], ['kettle hat', 'plate', ['north', 'court', 'coast']],
    ['spangenhelm', 'plate', ['north', 'highland', 'savanna']], ['turban helm', 'plate', ['desert', 'savanna']], ['great helm', 'plate', ['north', 'court']], ['bascinet', 'plate', ['north', 'court']], ['sallet', 'plate', ['north', 'court', 'coast']],
    ['barbute', 'plate', ['court', 'coast']], ['armet', 'plate', ['court']], ['horned helm', 'plate', ['orc', 'highland']], ['face-helm', 'plate', ['dwarf']], ['leaf helm', 'plate', ['elf']]],
  shield: [['buckler', 'shield', ['north', 'court', 'coast']], ['round shield', 'shield', ['north', 'highland', 'coast', 'savanna', 'orc']], ['kite shield', 'shield', ['north', 'court']], ['heater shield', 'shield', ['north', 'court']],
    ['targe', 'shield', ['highland', 'coast']], ['pavise', 'shield', ['north', 'court', 'coast']], ['tower shield', 'shield', ['north', 'dwarf']], ['wicker shield', 'shield', ['desert', 'savanna']]],
};
const ARMOUR = ['body', 'helm', 'shield'];
const byFamily = {}, forms = { weapons: 0, armour: 0 }, ids = new Set();
for (const fam in F) {
  let n = 0;
  for (const [form, of, styles] of F[fam]) {
    forms[ARMOUR.includes(fam) ? 'armour' : 'weapons']++;
    for (const st of styles) {
      const mats = MAT[of].slice();
      if (['blade', 'plate', 'mail', 'head'].includes(of) && SPECIAL[st]) mats.push(SPECIAL[st]);
      // elves and dwarves do not work the poorest metal
      const use = (st === 'elf' || st === 'dwarf') && mats.length > 2 ? mats.slice(1) : mats;
      for (const m of use) { const id = `${fam}.${form}.${st}.${m}`; if (!ids.has(id)) { ids.add(id); n++; } }
    }
  }
  byFamily[fam] = n;
}
const total = Object.values(byFamily).reduce((a, b) => a + b, 0), armour = ARMOUR.reduce((a, k) => a + byFamily[k], 0);
console.log(JSON.stringify({ forms, byFamily, weapons: total - armour, armour, kinds: total, piecesInFiveGrades: total * 5 }));
