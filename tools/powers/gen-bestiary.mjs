// The bestiary generator (powers wave 1, docs/design/powers.md). Writes data/bestiary.json from the families and lines below.
//
//   node tools/powers/gen-bestiary.mjs            write data/bestiary.json and print the counts
//   node tools/powers/gen-bestiary.mjs --check    exit 1 if data/bestiary.json differs from what this would write
//
// A species is one form of an evolution LINE (Puddle Slime -> Bog Slime -> ... -> Thinking Ooze). Each form has a LEVEL on
// the one power scale of data/power.json (level = 10 x log10(might / 0.01); might = conscripts squared for a person), a
// PROFILE of capabilities (two beings of one level fight differently), an INTELLIGENCE class (beast, cunning, speaking,
// wise: only speaking and wise beings reason through A.WHY), habitats on the map's terrain kinds, diet, active seasons,
// what it leaves (future economy), and the step to the next form. The top form of a line is its apex: an individual that
// rises to it takes a name and a mind (speaking at least).
// The release's LORE creatures with duel rows (A.BEASTS) keep their place: their level is derived from their duel worth
// and blood (CRE below, measured on the release's own A.fighterBeast and A.CR, seed 7), never written by hand, so the
// test can check the data against the live rows. Pure: no randomness; jitter comes from a hash of the name.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(root, 'data/bestiary.json');
const POWER = JSON.parse(fs.readFileSync(path.join(root, 'data/power.json'), 'utf8'));

// ---------------------------------------------------------------- the release's beasts: worth (A.CR at round 5 plus the
// weapon and hide terms, as A.fightWorth adds them) and blood (A.fighterBeast's maxHp), measured 2026-11-25
const CRE = {
  'CRE-01': [103.8, 235], 'CRE-03': [86.6, 110], 'CRE-05': [109, 420], 'CRE-06': [79.7, 70], 'CRE-19': [98.4, 235],
  'CRE-20': [89.1, 255], 'CRE-21': [81.6, 70], 'CRE-23': [90.7, 235], 'CRE-25': [93.5, 255], 'CRE-26': [74.7, 80],
  'CRE-31': [95.2, 235], 'CRE-33': [107.2, 450], 'CRE-34': [104.3, 420], 'CRE-35': [78.8, 95], 'CRE-38': [72.2, 90],
  'CRE-43': [69.4, 40], 'CRE-44': [105.9, 360], 'CRE-45': [97.5, 380], 'CRE-47': [72.8, 150], 'CRE-49': [105.3, 235],
  'CRE-51': [73.8, 150], 'CRE-53': [93.2, 235], 'CRE-55': [94, 235], 'CRE-56': [76.5, 55], 'CRE-24': [95, 320],
};
const F = POWER.people;   // the human fit: ln(conscripts) = a + b x worth (656 humans, seed 7)
export const creMight = (w, hp) => { const c = Math.exp(F.lnA + F.lnB * w) * Math.sqrt(hp / 100); return c * c; };
// t: the even log scale the lines are written in (t = 10 x log10(might / 0.01)); level: the owner's level, read from the might
// on data/power.json's levelCurve (straight lines between the anchors)
export const levelOf = m => Math.round(10 * Math.log10(m / 0.01));
export const mightOf = t => 0.01 * Math.pow(10, t / 10);
const CV = POWER.levelCurve, gOf = L => CV.a + CV.b * L + CV.c * L * L, X20 = gOf(CV.low.from);
// the level from the might: the root of a + bL + cL^2 = log10(might) above level 20, fifteen levels a decade below
export const curveLevel = m => { const x = Math.log10(m); if (x < X20) return Math.max(1, Math.round(CV.low.from + (x - X20) * CV.low.perDecade)); return Math.min(POWER.levels.max, Math.round((-CV.b + Math.sqrt(CV.b * CV.b + 4 * CV.c * (x - CV.a))) / (2 * CV.c))); };
const hash = s => { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

// ---------------------------------------------------------------- capabilities (0-10 each; data/power.json describes them)
// str strength, spd speed, hide armour and hide, venom, flight, regen regeneration, ward magic resistance, swarm numbers,
// cunning, magic (breath, spells, the elements)
const P = (str, spd, hide, venom, flight, regen, ward, swarm, cunning, magic) => ({ str, spd, hide, venom, flight, regen, ward, swarm, cunning, magic });

// ---------------------------------------------------------------- families and lines
// line: { k, forms: [name | { n, cre, int }], levels: [..] (or start/step), terr, coast, diet, seasons, int, apexInt, prof, drops }
const ALL = ['spring', 'summer', 'autumn', 'winter'];
// a title some kinds are born with (titles are data with buffs; the owner, 2026-11-25): the oldest dragons are born of the old blood
const OLD = { n: 'Old Blood', honour: 20, buffs: { level: 10, ward: 1 }, born: true, req: 'born' };
const FAMILIES = {
  vermin: { n: 'Vermin', diet: 'carrion', seasons: ALL, int: 'beast', drops: ['pelt', 'meat'], prof: P(1, 5, 1, 0, 0, 1, 0, 7, 3, 0), lines: [
    { k: 'rat', forms: ['Cellar Rat', 'Plague Rat', 'Rat Matron', 'Warren King'], levels: [5, 10, 15, 21], terr: ['plains', 'marsh', 'hills', 'forest', 'steppe'], drops: ['pelt', 'tail'], prof: { venom: 3 } },
    { k: 'crow', forms: ['Carrion Crow', 'Gallows Crow', 'Crow Mother'], levels: [4, 10, 17], terr: ['plains', 'steppe', 'hills', 'forest'], prof: { flight: 8, str: 0 }, drops: ['feather'] },
    { k: 'bat', forms: ['Cave Bat', 'Blood Bat', 'Dusk Bat', 'Night Shroud'], levels: [3, 10, 17, 25], terr: ['mountains', 'hills', 'forest'], diet: 'blood', prof: { flight: 8 }, drops: ['wing', 'fang'] },
    { k: 'weasel', forms: ['Hedge Weasel', 'Barrow Stoat'], levels: [6, 12], terr: ['plains', 'forest', 'hills'], diet: 'hunter', prof: { swarm: 2, spd: 7 } },
    { k: 'owl', forms: [{ n: 'Steppe Eagle Owls', cre: 'CRE-59' }, 'Grey Owl of the Barrows'], levels: [9, 19], terr: ['steppe', 'plains'], diet: 'hunter', prof: { flight: 8, swarm: 1, cunning: 4 }, drops: ['feather', 'talon'] },
  ] },
  hounds: { n: 'Wolves and hounds', diet: 'hunter', seasons: ALL, int: 'beast', drops: ['hide', 'fang'], prof: P(4, 7, 2, 0, 0, 2, 0, 6, 5, 0), lines: [
    { k: 'wolf', forms: ['Hill Wolf', 'Pack Wolf', { n: 'The Evenwood Wolf', cre: 'CRE-21' }, { n: 'Moonhowl Wolf', int: 'cunning' }, { n: 'Frostmane Wolf', int: 'cunning' }, 'Elder of the Long Winter'], levels: [18, 25, 0, 42, 49, 57], terr: ['forest', 'hills', 'steppe', 'mountains'], seasons: ALL },
    { k: 'hound', forms: ['Feral Dog', { n: 'Hael Hounds', cre: 'CRE-56' }, 'Ash Hound', 'Pyre Hound'], levels: [12, 0, 40, 48], terr: ['mountains', 'hills', 'plains'], prof: { magic: 2 } },
    { k: 'hyena', forms: ['Jackal', { n: 'Cave Hyena', cre: 'CRE-35' }, 'Bone-Crack Hyena'], levels: [10, 0, 43], terr: ['steppe', 'plains', 'desert'], diet: 'carrion' },
  ] },
  cats: { n: 'Great cats', diet: 'hunter', seasons: ALL, int: 'beast', drops: ['pelt', 'claw'], prof: P(5, 8, 2, 0, 0, 2, 0, 0, 7, 0), lines: [
    { k: 'lynx', forms: ['Lynx', 'Mountain Lion', 'Ghost Cat'], levels: [17, 26, 35], terr: ['mountains', 'hills', 'forest'] },
    { k: 'tiger', forms: ['Jungle Leopard', { n: 'Tiger of Ranpur', cre: 'CRE-49' }, { n: 'Striped Shade', int: 'cunning' }, 'Queen of the Canopy'], levels: [33, 0, 58, 64], terr: ['forest', 'marsh'] },
    { k: 'sandcat', forms: ['Dune Cat', 'Sand Panther', 'Sunfang'], levels: [9, 24, 38], terr: ['desert', 'steppe'], seasons: ['spring', 'summer', 'autumn'] },
  ] },
  bears: { n: 'Bears and apes', diet: 'omnivore', seasons: ['spring', 'summer', 'autumn'], int: 'beast', drops: ['hide', 'fat', 'claw'], prof: P(8, 4, 5, 0, 0, 4, 1, 0, 3, 0), lines: [
    { k: 'bear', forms: ['Black Bear', { n: 'Cave Bear', cre: 'CRE-25' }, 'Ironhide Bear', 'Mountain Father'], levels: [28, 0, 54, 61], terr: ['forest', 'mountains', 'hills'] },
    { k: 'ape', forms: ['Rock Ape', { n: 'Snow Ape', cre: 'CRE-31' }, 'Avalanche Ape'], levels: [27, 0, 56], terr: ['mountains'], seasons: ALL, prof: { cunning: 5 } },
    { k: 'forestmen', forms: [{ n: 'Forest Men', cre: 'CRE-55' }, { n: 'Old Silverback', int: 'cunning' }], levels: [0, 53], terr: ['forest', 'marsh'], seasons: ALL, prof: { cunning: 6, swarm: 3 } },
  ] },
  hooved: { n: 'Boars and great hooved beasts', diet: 'grazer', seasons: ALL, int: 'beast', drops: ['hide', 'horn', 'meat'], prof: P(7, 5, 4, 0, 0, 2, 0, 2, 1, 0), lines: [
    { k: 'boar', forms: ['Wild Boar', 'Tusker', { n: 'Hell Boar', cre: 'CRE-23' }, 'Thornback Boar', 'Boar-King'], levels: [20, 30, 0, 51, 58], terr: ['forest', 'hills', 'marsh'], diet: 'omnivore', drops: ['hide', 'tusk', 'meat'] },
    { k: 'ox', forms: ['Wild Ox', { n: 'Aurochs', cre: 'CRE-20' }, 'Stormhorn Bull'], levels: [22, 0, 53], terr: ['forest', 'plains', 'steppe'] },
    { k: 'stag', forms: ['Red Deer', { n: 'The Grey Stag', cre: 'CRE-19' }, { n: 'Antlered Lord', int: 'speaking' }], levels: [8, 0, 57], terr: ['forest'], prof: { spd: 7, ward: 3 } },
    { k: 'mammoth', forms: ['Steppe Mammoth', { n: 'The Thunder Mammoth', cre: 'CRE-33' }], levels: [40, 0], terr: ['steppe', 'plains'], prof: { str: 10, hide: 6 } },
    { k: 'rhino', forms: ['Steppe Rhino', { n: 'Woolly Rhino', cre: 'CRE-34' }, 'Ironbrow Rhino'], levels: [38, 0, 60], terr: ['steppe', 'plains'], prof: { str: 9, hide: 8 } },
    { k: 'riverhorse', forms: ['Mud Wallower', { n: 'River Horse', cre: 'CRE-45' }], levels: [30, 0], terr: ['marsh'], prof: { str: 9, hide: 6 } },
    { k: 'elephant', forms: [{ n: 'White Elephant', cre: 'CRE-50' }, { n: 'Tusk-Mother', int: 'cunning' }], levels: [52, 60], terr: ['forest', 'marsh'], prof: { str: 10, hide: 6, cunning: 4 }, drops: ['ivory', 'hide'] },
    { k: 'oryx', forms: [{ n: 'White Oryx', cre: 'CRE-41' }, 'Spear-Horn Oryx'], levels: [15, 28], terr: ['desert', 'steppe'], prof: { spd: 7 } },
  ] },
  serpents: { n: 'Serpents and great lizards', diet: 'hunter', seasons: ['spring', 'summer', 'autumn'], int: 'beast', drops: ['skin', 'venom'], prof: P(4, 5, 4, 7, 0, 3, 1, 0, 4, 0), lines: [
    { k: 'adder', forms: ['Grass Adder', 'Pit Viper', 'Ash Viper', 'Viper Queen'], levels: [7, 16, 25, 34], terr: ['plains', 'steppe', 'hills', 'desert'], prof: { venom: 9, str: 1 } },
    { k: 'constrictor', forms: ['Rock Python', { n: 'Green Anaconda', cre: 'CRE-47' }, { n: 'World Python', cre: 'CRE-51' }, 'Coil-Mother'], levels: [25, 0, 0, 50], terr: ['marsh', 'forest'], prof: { venom: 0, str: 8 } },
    { k: 'basilisk', forms: ['Sand Lizard', { n: 'Basilisk', cre: 'CRE-38' }, { n: 'Stone-Eye', int: 'cunning' }], levels: [8, 0, 45], terr: ['desert', 'hills'], prof: { magic: 6, ward: 4 } },
    { k: 'croc', forms: ['Marsh Crocodile', { n: 'Great Crocodile', cre: 'CRE-44' }, { n: 'Mire Tyrant', int: 'cunning' }], levels: [32, 0, 62], terr: ['marsh'], coast: true, prof: { str: 8, hide: 8, venom: 0 } },
  ] },
  wyrms: { n: 'Wyrms and drakes', diet: 'hunter', seasons: ALL, int: 'cunning', drops: ['scale', 'blood'], prof: P(6, 6, 6, 3, 4, 4, 4, 0, 5, 4), lines: [
    { k: 'whitewyrm', forms: ['Cave Wyrmling', { n: 'White Wyrm', cre: 'CRE-26' }, 'Pale Wyrm', 'Deep Wyrm'], levels: [22, 0, 44, 55], terr: ['mountains', 'hills'], prof: { flight: 0 } },
    { k: 'snowdrake', forms: ['Ice Drakeling', { n: 'Snow Drake', cre: 'CRE-06' }, 'Rime Drake'], levels: [24, 0, 46], terr: ['mountains'], seasons: ['autumn', 'winter', 'spring'], prof: { flight: 8, magic: 5 } },
    { k: 'wyvern', forms: [{ n: 'Sunwall Wyvern', cre: 'CRE-03' }, 'Crag Wyvern', 'Storm Wyvern'], levels: [0, 48, 56], terr: ['mountains', 'hills', 'desert'], prof: { flight: 9, venom: 7 } },
    { k: 'amber', forms: ['Amber Crawler', { n: 'Amber Wyrm', cre: 'CRE-05' }, { n: 'Amber Elder', int: 'speaking' }], levels: [38, 0, 65], terr: ['forest', 'marsh'], prof: { flight: 0, str: 9, hide: 8 } },
    { k: 'seadrake', forms: [{ n: 'Sea Drake', cre: 'CRE-04' }, 'Tide Drake'], levels: [42, 52], terr: ['hills', 'plains'], coast: true, prof: { flight: 8, magic: 5 } },
    { k: 'sanddragon', forms: [{ n: 'Sand Dragon', cre: 'CRE-43' }, 'Dune Drake'], levels: [0, 38], terr: ['desert'], int: 'beast', prof: { flight: 0, spd: 7 } },
  ] },
  dragons: { n: 'Dragons', diet: 'hunter', seasons: ALL, int: 'speaking', apexInt: 'wise', drops: ['dragon scale', 'dragon heart'], prof: P(9, 7, 9, 2, 9, 6, 7, 0, 7, 9), lines: [
    { k: 'ashdragon', forms: [{ n: 'Ash Hatchling', int: 'cunning' }, { n: 'Ash Dragonet', int: 'cunning' }, { n: 'Great Ash Dragon', cre: 'CRE-01' }, 'Elder Ash Dragon', { n: 'Ancient Ash Dragon', born: OLD }], levels: [36, 44, 0, 69, 74], terr: ['mountains', 'hills'], places: ['the Dragon Mountains'] },
    { k: 'frostdragon', forms: [{ n: 'Frost Hatchling', int: 'cunning' }, 'Frost Dragon', 'Elder Frost Dragon', { n: 'Ancient Frost Dragon', born: OLD }], levels: [38, 60, 69, 75], terr: ['mountains'], places: ['the Dragon Mountains'], seasons: ['autumn', 'winter', 'spring'] },
    { k: 'stormdragon', forms: [{ n: 'Storm Hatchling', int: 'cunning' }, 'Storm Dragon', 'Elder Storm Dragon', { n: 'Ancient Storm Dragon', born: OLD }], levels: [40, 62, 71, 77], terr: ['mountains', 'hills', 'steppe'], places: ['the Dragon Mountains'] },
    { k: 'brinedragon', forms: [{ n: 'Brine Hatchling', int: 'cunning' }, 'Brine Dragon', 'Elder Brine Dragon'], levels: [37, 60, 69], terr: ['hills', 'marsh'], coast: true, places: ['the Dragon Mountains', 'the coasts below them'] },
    { k: 'redwidow', forms: [{ n: 'The Red Widow', cre: 'CRE-02' }], levels: [66], terr: ['mountains'], unique: true, places: ['the Dragon Mountains'] },
  ] },
  giants: { n: 'Wild giants and trolls', diet: 'omnivore', seasons: ALL, int: 'cunning', apexInt: 'speaking', drops: ['bone', 'tooth', 'hide'], prof: P(9, 3, 5, 0, 0, 6, 2, 1, 3, 0), lines: [
    { k: 'troll', forms: ['Bog Troll', 'Hill Troll', 'Cave Troll', 'Stone Troll', 'Troll Grandsire'], levels: [36, 43, 50, 57, 64], terr: ['marsh', 'hills', 'mountains', 'forest'], prof: { regen: 9 } },
    { k: 'fellgiant', forms: [{ n: 'Fell Giant', int: 'speaking' }, { n: 'Frost-Fell Giant', int: 'speaking' }, { n: 'Mountain Giant', int: 'speaking' }, 'Giant of the First Snows'], levels: [44, 52, 60, 68], terr: ['mountains', 'hills'], apexInt: 'wise', prof: { str: 10, hide: 6, cunning: 5 } },
    { k: 'ettin', forms: ['Ettin', { n: 'Ettin Chieftain', int: 'speaking' }], levels: [48, 55], terr: ['hills', 'forest'], prof: { str: 9 } },
  ] },
  ogres: { n: 'Ogres', diet: 'omnivore', seasons: ALL, int: 'speaking', drops: ['hide', 'tusk'], prof: P(8, 4, 4, 0, 0, 3, 2, 2, 4, 0), lines: [
    { k: 'ogre', forms: ['Ogre', 'Ogre Brute', 'Ogre Glutton', 'Ogre Hetman'], levels: [38, 45, 52, 58], terr: ['hills', 'forest', 'mountains'] },
    { k: 'marshogre', forms: ['Marsh Ogre', 'Ogre Hedge-Witch'], levels: [40, 54], terr: ['marsh'], apexInt: 'wise', prof: { magic: 6 } },
  ] },
  skyborne: { n: 'Harpies, griffons and great birds', diet: 'hunter', seasons: ALL, int: 'beast', drops: ['feather', 'talon'], prof: P(4, 8, 2, 0, 9, 2, 1, 3, 4, 0), lines: [
    { k: 'harpy', forms: [{ n: 'Harpy', int: 'cunning' }, { n: 'Shrieking Harpy', int: 'cunning' }, { n: 'Harpy Matriarch', int: 'speaking' }], levels: [26, 33, 42], terr: ['mountains', 'hills'], coast: true, prof: { swarm: 6 } },
    { k: 'griffon', forms: ['Griffon', 'Royal Griffon', 'Griffon of the High Aeries'], levels: [44, 52, 60], terr: ['mountains', 'hills', 'steppe'], prof: { str: 7, cunning: 5 } },
    { k: 'eagle', forms: [{ n: 'Bone-breaker', cre: 'CRE-32' }, { n: 'Crown Eagle', cre: 'CRE-29' }, 'Sky Eagle'], levels: [11, 15, 26], terr: ['mountains', 'hills'] },
    { k: 'roc', forms: [{ n: 'Thunderbird of Great Amber', cre: 'CRE-52' }, { n: 'The Roc', cre: 'CRE-53' }, 'Storm Roc'], levels: [30, 0, 56], terr: ['forest', 'hills', 'mountains'], prof: { str: 7, magic: 2 } },
  ] },
  crawlers: { n: 'Spiders and great insects', diet: 'hunter', seasons: ['spring', 'summer', 'autumn'], int: 'beast', drops: ['silk', 'venom', 'shell'], prof: P(3, 6, 5, 7, 0, 2, 1, 5, 4, 0), lines: [
    { k: 'spider', forms: [{ n: 'Deepweaver', cre: 'CRE-27' }, 'Tunnel Spider', 'Giant Spider', { n: 'Web Matron', int: 'cunning' }, 'Hollow Queen'], levels: [6, 18, 28, 38, 50], terr: ['forest', 'mountains', 'hills', 'marsh'], seasons: ALL },
    { k: 'scorpion', forms: [{ n: 'Deathstalker', cre: 'CRE-40' }, 'Dune Scorpion', 'Sand Emperor'], levels: [9, 24, 40], terr: ['desert'], seasons: ALL, prof: { venom: 9, hide: 7 } },
    { k: 'beetle', forms: ['Midden Beetle', 'Plated Beetle', 'Siege Beetle'], levels: [4, 20, 36], terr: ['plains', 'forest', 'steppe', 'desert'], diet: 'carrion', prof: { hide: 9, venom: 0 } },
    { k: 'swarm', forms: ['Locust Cloud', 'Devouring Swarm', 'The Grey Hunger'], levels: [14, 30, 46], terr: ['plains', 'steppe', 'desert'], diet: 'grazer', seasons: ['summer', 'autumn'], prof: { swarm: 10, flight: 6, hide: 0, venom: 1 } },
    { k: 'moth', forms: [{ n: 'Moon Moths', cre: 'CRE-64' }, 'Dream Moth', 'Moon-Moth Queen'], levels: [3, 15, 27], terr: ['forest'], diet: 'mana', seasons: ['summer'], prof: { flight: 7, magic: 5, swarm: 6, str: 0 } },
    { k: 'crawler', forms: ['Rock Crawler', 'Thousand-Leg'], levels: [12, 26], terr: ['mountains', 'hills'], prof: { venom: 6 } },
  ] },
  undead: { n: 'The restless dead', diet: 'souls', seasons: ['autumn', 'winter'], int: 'beast', apexInt: 'wise', drops: ['grave dust', 'bone'], prof: P(5, 3, 3, 2, 0, 5, 6, 4, 3, 4), lines: [
    { k: 'dead', forms: ['Restless Dead', { n: 'Barrow Wight', int: 'speaking' }, { n: 'Grave Lord', int: 'speaking' }, 'Bone Sovereign'], levels: [18, 32, 48, 62], terr: ['hills', 'plains', 'marsh', 'steppe'] },
    { k: 'ghoul', forms: ['Ghoul', 'Charnel Ghoul', { n: 'Ghoul Elder', int: 'cunning' }], levels: [22, 31, 40], terr: ['plains', 'marsh', 'forest'], diet: 'carrion', prof: { venom: 5, swarm: 6 } },
    { k: 'revenant', forms: [{ n: 'Revenant', int: 'speaking' }, { n: 'Wrath Revenant', int: 'speaking' }], levels: [35, 45], terr: ['plains', 'hills', 'steppe'], prof: { regen: 8, str: 7 } },
    { k: 'wraith', forms: ['Shade', { n: 'Wraith', int: 'cunning' }, { n: 'Night Wraith', int: 'speaking' }], levels: [25, 38, 50], terr: ['marsh', 'forest', 'mountains'], prof: { flight: 5, ward: 8, str: 2, magic: 6 } },
  ] },
  spirits: { n: 'Spirits and elementals', diet: 'mana', seasons: ALL, int: 'beast', apexInt: 'wise', drops: ['spirit core'], prof: P(4, 6, 2, 0, 4, 7, 8, 2, 4, 7), lines: [
    { k: 'fire', forms: ['Ember Sprite', { n: 'Flame Spirit', int: 'speaking' }, { n: 'Blaze Lord', int: 'speaking' }, 'Heart of Fire'], levels: [12, 28, 45, 60], terr: ['desert', 'mountains'], seasons: ['summer', 'autumn'], prof: { magic: 9 } },
    { k: 'water', forms: ['Tide Sprite', { n: 'River Spirit', int: 'speaking' }, 'Flood Lord'], levels: [11, 27, 44], terr: ['marsh', 'plains'], coast: true, seasons: ['spring', 'summer'] },
    { k: 'wind', forms: ['Breeze Sprite', { n: 'Gale Spirit', int: 'speaking' }, { n: 'Storm Lord', int: 'speaking' }, 'Sky-Breaker'], levels: [10, 26, 43, 58], terr: ['steppe', 'mountains', 'hills'], prof: { flight: 9, spd: 9 } },
    { k: 'earth', forms: ['Pebble Sprite', { n: 'Stone Spirit', int: 'speaking' }, 'Mountain Heart'], levels: [13, 29, 46], terr: ['mountains', 'hills'], prof: { hide: 9, str: 8, flight: 0, spd: 2 } },
    { k: 'frost', forms: ['Frost Sprite', { n: 'Winter Spirit', int: 'speaking' }, 'White Lord'], levels: [12, 30, 47], terr: ['mountains', 'steppe', 'forest'], seasons: ['winter'] },
    { k: 'grove', forms: ['Grove Sprite', { n: 'Leaf Spirit', int: 'speaking' }], levels: [9, 22], terr: ['forest'], seasons: ['spring', 'summer'] },
  ] },
  demons: { n: 'Demons', diet: 'souls', seasons: ALL, int: 'speaking', apexInt: 'wise', drops: ['horn', 'brimstone core'], prof: P(6, 6, 5, 3, 3, 5, 7, 2, 8, 7), lines: [
    { k: 'imp', forms: [{ n: 'Imp', int: 'cunning' }, 'Fiend', 'Greater Fiend', { n: 'Pit Prince', born: { n: 'Pit-Born', honour: 0, buffs: { ward: 1 }, born: true, req: 'born' } }], levels: [16, 30, 44, 58], terr: ['desert', 'mountains', 'marsh'] },
    { k: 'cinderhound', forms: [{ n: 'Cinder Hound', int: 'beast' }, { n: 'Brimstone Hound', int: 'cunning' }], levels: [28, 38], terr: ['desert', 'hills', 'mountains'], prof: { spd: 8, swarm: 5, magic: 5 } },
    { k: 'tempter', forms: ['Whisperer', 'Soul Broker'], levels: [24, 42], terr: ['plains', 'forest', 'hills'], prof: { str: 2, cunning: 10, magic: 8 } },
    { k: 'horror', forms: [{ n: 'Gate Horror', int: 'cunning' }, { n: 'Gate Tyrant', born: { n: 'Gate-Born', honour: 0, buffs: { str: 1, ward: 1 }, born: true, req: 'born' } }], levels: [52, 66], terr: ['desert', 'mountains'], prof: { str: 9, hide: 8 } },
  ] },
  deep: { n: 'Monsters of the sea and the deep', diet: 'hunter', seasons: ALL, int: 'beast', drops: ['oil', 'bone', 'shell'], prof: P(7, 5, 6, 1, 0, 4, 2, 2, 3, 1), lines: [
    { k: 'crab', forms: [{ n: 'Giant Spider Crab', cre: 'CRE-15' }, 'Reef Crusher'], levels: [14, 28], terr: [], coast: true, prof: { hide: 9 } },
    { k: 'seal', forms: [{ n: 'Salt Sea Seals', cre: 'CRE-63' }, 'Bull Seal'], levels: [8, 16], terr: [], coast: true },
    { k: 'orca', forms: [{ n: 'Wolves of the Sea', cre: 'CRE-18' }, { n: 'Deep Hunter', int: 'cunning' }], levels: [44, 54], terr: [], coast: true, prof: { swarm: 6, cunning: 7, spd: 8 } },
    { k: 'seaserpent', forms: ['Reef Eel', { n: 'Middle Sea Serpent', cre: 'CRE-11' }, 'Deep Serpent'], levels: [16, 38, 52], terr: [], coast: true, prof: { venom: 4 } },
    { k: 'kraken', forms: ['Giant Squid', { n: 'Kraken', cre: 'CRE-10' }, { n: 'Elder Kraken', int: 'cunning' }], levels: [30, 50, 64], terr: [], coast: true, prof: { str: 9, cunning: 6 } },
    { k: 'leviathan', forms: [{ n: 'Grey Leviathan', cre: 'CRE-09' }, { n: 'The Black Maw', cre: 'CRE-14' }, 'Abyss Leviathan'], levels: [58, 63, 70], terr: [], coast: true, prof: { str: 10, hide: 8 } },
    { k: 'frostleviathan', forms: [{ n: 'Frost Leviathan', cre: 'CRE-61' }], levels: [61], terr: [], coast: true, prof: { str: 10, hide: 8, magic: 3 } },
    { k: 'turtle', forms: [{ n: 'Isle-Turtle', cre: 'CRE-12' }, 'Island-Back'], levels: [52, 62], terr: [], coast: true, prof: { hide: 10, spd: 1, regen: 6 } },
    { k: 'catfish', forms: ['River Catfish', { n: 'Old Whiskers', cre: 'CRE-13' }], levels: [12, 30], terr: ['marsh'], prof: { hide: 3 } },
  ] },
  fey: { n: 'The fey', diet: 'mana', seasons: ['spring', 'summer', 'autumn'], int: 'speaking', apexInt: 'wise', drops: ['fey dust', 'glamour core'], prof: P(2, 8, 1, 2, 4, 5, 9, 3, 9, 8), lines: [
    { k: 'fox', forms: [{ n: 'Red Fox', int: 'beast' }, { n: 'Glamour Fox', int: 'cunning' }, 'Thousand-Wile Fox'], levels: [6, 20, 36], terr: ['forest', 'hills', 'plains'], seasons: ALL, prof: { flight: 0 } },
    { k: 'pixie', forms: [{ n: 'Pixie', int: 'cunning' }, 'Thorn Sprite', 'Barrow Fey', 'Fey Countess'], levels: [6, 15, 30, 48], terr: ['forest', 'hills'] },
    { k: 'kelpie', forms: [{ n: 'Kelpie', int: 'cunning' }, 'Drowning Steed'], levels: [34, 46], terr: ['marsh'], coast: true, seasons: ALL, prof: { str: 6, flight: 0 } },
    { k: 'grove', forms: [{ n: 'Bark Walker', int: 'beast' }, { n: 'Old Man of the Trees', cre: 'CRE-24', int: 'cunning' }, 'Grove Father'], levels: [30, 0, 60], terr: ['forest'], prof: { str: 8, hide: 7, spd: 2, flight: 0 } },
    { k: 'changeling', forms: ['Changeling', 'Hollow Hill Lord'], levels: [22, 45], terr: ['hills', 'forest'], seasons: ALL },
  ] },
  oozes: { n: 'Slimes and oozes', diet: 'anything', seasons: ALL, int: 'beast', drops: ['slime core', 'gel'], prof: P(3, 2, 1, 4, 0, 9, 5, 2, 1, 2), lines: [
    { k: 'slime', forms: ['Puddle Slime', 'Bog Slime', 'Acid Ooze', 'Gulping Ooze', 'Lake-Eater', 'Grey Tide', 'Thinking Ooze'], levels: [2, 8, 16, 24, 34, 44, 54], terr: ['marsh', 'forest', 'plains', 'hills'], apexInt: 'wise', prof: { venom: 6 } },
    { k: 'caveslime', forms: ['Drip Slime', 'Cave Jelly', 'Stone-Eater Ooze', 'Deep Ooze'], levels: [3, 11, 22, 33], terr: ['mountains', 'hills'], prof: { hide: 4 } },
    { k: 'emberooze', forms: ['Ember Slime', 'Magma Ooze', 'Molten Heart'], levels: [9, 25, 41], terr: ['mountains', 'desert'], prof: { magic: 7, ward: 6 } },
    { k: 'frostjelly', forms: ['Frost Jelly', 'Glacier Ooze'], levels: [7, 23], terr: ['mountains', 'steppe'], seasons: ['autumn', 'winter'] },
    { k: 'venomslime', forms: ['Venom Slime', 'Plague Ooze', 'Rot Tide'], levels: [10, 26, 40], terr: ['marsh', 'forest'], prof: { venom: 10 } },
    { k: 'mimic', forms: [{ n: 'Lurking Ooze', int: 'cunning' }, { n: 'Hoard Mimic', int: 'cunning' }], levels: [14, 28], terr: ['hills', 'mountains', 'forest'], prof: { cunning: 8 } },
  ] },
  constructs: { n: 'Constructs', diet: 'none', seasons: ALL, int: 'beast', apexInt: 'speaking', drops: ['rune core', 'iron'], prof: P(8, 2, 9, 0, 0, 0, 6, 0, 1, 2), lines: [
    { k: 'clay', forms: ['Clay Servant', 'Stone Warden', 'Iron Colossus'], levels: [20, 34, 52], terr: ['hills', 'mountains', 'desert'] },
    { k: 'bone', forms: ['Bone Puppet', 'Bone Golem'], levels: [15, 33], terr: ['marsh', 'hills', 'plains'], prof: { hide: 5, regen: 3 } },
    { k: 'brass', forms: ['Brass Hound', 'Brass Sentinel'], levels: [25, 40], terr: ['desert', 'hills'], prof: { spd: 6 } },
    { k: 'rune', forms: ['Rune Guardian', 'Gate Colossus'], levels: [46, 60], terr: ['mountains'], prof: { ward: 10, magic: 5 } },
  ] },
};

// ---------------------------------------------------------------- behaviour (the owner, 2026-11-25: "more depth and variety,
// personalised to each creature"). Each family has its ways; each line overrides what makes it its own. Fields:
//   drives    what moves it, strongest first (hunger, territory, mating, fear, curiosity, hoarding, young, devotion, play, wander)
//   social    solitary, pair, pack, herd, swarm, court, host     hunt  ambush, chase, graze, lure, scavenge, crush, drain
//   time      day, night, dusk, any                              mating the season it breeds (and is worst-tempered)
//   migrates  moves with the seasons                             guards what it defends to the death
//   provoked  what turns it on you        calmed  what turns it away (the card's choices read both)
//   people    how it treats people: hunts, avoids, ignores, curious, bargains, hates, tolerates
//   stock     livestock: raids, ignores, follows                others  how it treats other kinds
//   day / year  its daily and seasonal habit, in words          where  how its kind differs by ground
const BEH_FAM = {
  vermin: { drives: ['hunger', 'fear'], social: 'swarm', hunt: 'scavenge', time: 'night', mating: 'spring', guards: 'nest', provoked: ['cornered', 'nest disturbed'], calmed: ['light', 'noise', 'food thrown'], people: 'avoids', stock: 'raids', others: 'food for everything larger', day: 'hides by day, swarms the middens by night', year: 'breeds in spring, starves in winter and grows bold' },
  hounds: { drives: ['hunger', 'territory', 'young'], social: 'pack', hunt: 'chase', time: 'dusk', mating: 'winter', guards: 'den', provoked: ['running', 'den entered', 'a wounded packmate'], calmed: ['fire', 'standing your ground', 'meat thrown'], people: 'avoids', stock: 'raids', others: 'drives off lone rivals; fears bears', day: 'lies up by day, hunts at dusk and dawn', year: 'follows the herds; comes down to the villages in a hungry winter' },
  cats: { drives: ['hunger', 'territory'], social: 'solitary', hunt: 'ambush', time: 'night', mating: 'spring', guards: 'den', provoked: ['turning your back', 'its kill approached', 'cubs'], calmed: ['facing it', 'noise', 'height'], people: 'avoids', stock: 'raids', others: 'kills smaller hunters on its ground', day: 'sleeps through the day in a high place', year: 'keeps one range all year; the young roam in autumn' },
  bears: { drives: ['hunger', 'young', 'territory'], social: 'solitary', hunt: 'crush', time: 'day', mating: 'summer', guards: 'young', provoked: ['cubs', 'its food', 'surprise at close range'], calmed: ['stillness', 'backing away slowly', 'food left'], people: 'tolerates', stock: 'raids', others: 'takes kills from wolves and cats', day: 'forages by day along streams and slopes', year: 'fattens in autumn, sleeps the winter in a den, wakes starving' },
  hooved: { drives: ['hunger', 'fear', 'mating'], social: 'herd', hunt: 'graze', time: 'day', mating: 'autumn', guards: 'young', provoked: ['the rut', 'calves', 'cornered'], calmed: ['distance', 'stillness', 'open ground to flee'], people: 'avoids', stock: 'follows', others: 'prey for wolves and cats, a danger to them when cornered', day: 'grazes at dawn and dusk', year: 'the males fight in the autumn rut; herds move to winter pasture' },
  serpents: { drives: ['hunger', 'fear'], social: 'solitary', hunt: 'ambush', time: 'day', mating: 'spring', guards: 'eggs', provoked: ['a foot on it', 'eggs', 'cornered'], calmed: ['stillness', 'cold', 'a clear path away'], people: 'avoids', stock: 'raids', others: 'eats rats and birds; eaten by eagles', day: 'basks in the morning, hunts in the warm hours', year: 'sleeps through the cold months in a den with others' },
  wyrms: { drives: ['hunger', 'territory', 'hoarding'], social: 'solitary', hunt: 'ambush', time: 'any', mating: 'summer', guards: 'lair', provoked: ['its lair', 'its hoard', 'a wound'], calmed: ['an offering', 'retreat', 'cold'], people: 'hunts', stock: 'raids', others: 'drives off every rival from its ground', day: 'sleeps long after feeding', year: 'hunts hard before the cold; lays up in a deep place' },
  dragons: { drives: ['hoarding', 'territory', 'hunger', 'pride'], social: 'solitary', hunt: 'chase', time: 'any', mating: 'summer', guards: 'hoard', provoked: ['its hoard touched', 'its name mocked', 'its lair entered'], calmed: ['tribute', 'courtesy', 'a riddle'], people: 'bargains', stock: 'raids', others: 'tolerates no other dragon on its ground', day: 'sleeps for days after feeding, then flies its bounds', year: 'hunts in spring and autumn; sleeps on the hoard in winter' },
  giants: { drives: ['hunger', 'territory'], social: 'pair', hunt: 'crush', time: 'night', mating: 'autumn', guards: 'lair', provoked: ['its bridge or cave', 'mockery', 'fire'], calmed: ['food', 'a riddle', 'sunrise'], people: 'hunts', stock: 'raids', others: 'eats what it catches, bears included', day: 'sleeps under stone by day', year: 'comes down to the farms in the hungry months' },
  ogres: { drives: ['hunger', 'greed'], social: 'pack', hunt: 'crush', time: 'dusk', mating: 'spring', guards: 'hoard', provoked: ['its food', 'insult', 'a weak-looking man'], calmed: ['food and drink', 'coin', 'a stronger foe'], people: 'bargains', stock: 'raids', others: 'bullies goblin-sized things, avoids trolls', day: 'drinks, sleeps, raids at dusk', year: 'gathers in war-bands in late summer' },
  skyborne: { drives: ['hunger', 'territory', 'young'], social: 'pair', hunt: 'chase', time: 'day', mating: 'spring', guards: 'nest', provoked: ['its nest', 'a lamb it has marked', 'climbing near'], calmed: ['cover', 'a lure', 'distance'], people: 'avoids', stock: 'raids', others: 'takes lambs, goats and smaller fliers', day: 'rides the warm air at midday', year: 'nests on the heights in spring; follows the herds in autumn' },
  crawlers: { drives: ['hunger', 'young'], social: 'solitary', hunt: 'ambush', time: 'night', mating: 'summer', guards: 'eggs', provoked: ['its web', 'its brood', 'vibration'], calmed: ['fire', 'smoke', 'cold'], people: 'hunts', stock: 'raids', others: 'eats anything caught in reach', day: 'waits in the dark for something to touch the threads', year: 'swarms in the warm months, sleeps in the cold' },
  undead: { drives: ['devotion', 'hunger'], social: 'host', hunt: 'drain', time: 'night', mating: 'none', guards: 'mound', provoked: ['its grave disturbed', 'its name spoken', 'the living'], calmed: ['holy rites', 'salt and iron', 'dawn'], people: 'hates', stock: 'ignores', others: 'beasts flee it; dogs howl', day: 'lies in the earth by day', year: 'walks on the long nights of autumn and winter' },
  spirits: { drives: ['curiosity', 'territory'], social: 'solitary', hunt: 'drain', time: 'any', mating: 'none', guards: 'place', provoked: ['its place defiled', 'iron', 'disrespect'], calmed: ['an offering', 'courtesy', 'leaving its place'], people: 'curious', stock: 'ignores', others: 'feeds on the strength of its element', day: 'is its element: the flame, the stream, the wind', year: 'strongest in its season, weak out of it' },
  demons: { drives: ['ambition', 'hunger', 'cruelty'], social: 'court', hunt: 'lure', time: 'night', mating: 'none', guards: 'bargains', provoked: ['holy things', 'refusal', 'a broken bargain'], calmed: ['a bargain', 'holy ground', 'its true name'], people: 'bargains', stock: 'ignores', others: 'binds lesser things to serve it', day: 'hides in plain sight', year: 'strongest in the dark of the year' },
  deep: { drives: ['hunger', 'wander'], social: 'solitary', hunt: 'ambush', time: 'any', mating: 'spring', guards: 'young', provoked: ['nets and hooks', 'blood in the water', 'its young'], calmed: ['deep water', 'distance', 'stillness'], people: 'ignores', stock: 'ignores', others: 'eats seals, fish and boats alike', day: 'rises at night to the warm water', year: 'follows the shoals' },
  fey: { drives: ['play', 'curiosity', 'territory'], social: 'court', hunt: 'lure', time: 'dusk', mating: 'midsummer', guards: 'place', provoked: ['iron', 'rudeness', 'a bargain broken', 'thanks spoken'], calmed: ['courtesy', 'milk and bread left out', 'a gift'], people: 'curious', stock: 'raids', others: 'rides deer, steals foals', day: 'dances at dusk, vanishes at dawn', year: 'strongest at midsummer and the turn of the year' },
  oozes: { drives: ['hunger', 'growth'], social: 'solitary', hunt: 'drain', time: 'any', mating: 'none', guards: 'none', provoked: ['touch', 'heat', 'food nearby'], calmed: ['fire', 'salt', 'nothing to eat'], people: 'ignores', stock: 'raids', others: 'eats everything that stays still', day: 'creeps toward warmth and food', year: 'grows in the warm months, thickens in the cold' },
  constructs: { drives: ['duty'], social: 'solitary', hunt: 'crush', time: 'any', mating: 'none', guards: 'post', provoked: ['crossing its post', 'its maker named falsely'], calmed: ['the password', 'leaving its post', 'the maker\'s seal'], people: 'tolerates', stock: 'ignores', others: 'ignores what does not cross its line', day: 'stands without moving', year: 'the same in every season' },
};
const BEH_LINE = {
  'vermin.rat': { where: { marsh: 'swims and nests in reed-rafts', hills: 'lives in the mine-spoil and grain stores' }, people: 'avoids', provoked: ['cornered', 'a child alone'] },
  'vermin.crow': { social: 'swarm', hunt: 'scavenge', time: 'day', people: 'ignores', others: 'follows wolves and armies to the kill', calmed: ['scarecrows', 'stones'], where: { steppe: 'follows the herds and the hosts' } },
  'vermin.bat': { hunt: 'drain', provoked: ['torchlight in the roost'], others: 'feeds on sleeping cattle', where: { forest: 'roosts in hollow oaks' } },
  'vermin.weasel': { social: 'solitary', hunt: 'chase', time: 'any', stock: 'raids', provoked: ['its kill taken'], others: 'kills hens for the pleasure of it' },
  'vermin.owl': { social: 'pair', hunt: 'ambush', time: 'night', others: 'takes hares and rats; mobbed by crows', calmed: ['daylight'] },
  'hounds.wolf': { where: { steppe: 'runs in great packs after the herds', forest: 'small packs, silent, ambush at fords', mountains: 'grey and heavy, hunts goats on the scree' }, provoked: ['running', 'its cubs', 'a hungry winter'] },
  'hounds.hound': { social: 'pack', time: 'night', people: 'hunts', drives: ['hunger', 'cruelty'], provoked: ['the scent of blood', 'fear'], calmed: ['fire', 'running water'], where: { mountains: 'bays from the ridges so the valley hears' } },
  'hounds.hyena': { hunt: 'scavenge', social: 'pack', people: 'avoids', provoked: ['a wounded man', 'its kill taken'], calmed: ['shouting', 'a crowd'], others: 'steals kills from cats; laughs at the lone' },
  'cats.lynx': { hunt: 'ambush', provoked: ['a dog', 'its kittens'], others: 'kills foxes on sight' },
  'cats.tiger': { drives: ['territory', 'hunger'], people: 'hunts', provoked: ['crossing its range', 'its kill'], calmed: ['a mask on the back of the head', 'fire'], where: { marsh: 'hunts from the water like a crocodile', forest: 'takes woodcutters on the paths' } },
  'cats.sandcat': { time: 'dusk', provoked: ['its water'], where: { desert: 'lies in the dune-shade by the wells' } },
  'bears.ape': { social: 'pack', drives: ['territory', 'hunger'], provoked: ['staring', 'noise in its valley'], calmed: ['looking away', 'retreat downhill'], others: 'throws stones at intruders', where: { mountains: 'lives above the tree-line in the snow' } },
  'bears.forestmen': { social: 'pack', people: 'tolerates', provoked: ['a threat to the young', 'a stare'], calmed: ['bowing low', 'fruit left out'], others: 'drives off leopards together' },
  'hooved.boar': { social: 'pack', provoked: ['the sounder\'s piglets', 'a spear that does not kill'], calmed: ['climbing a tree'], others: 'roots up graves and fields', people: 'tolerates', where: { marsh: 'wallows and charges out of the reeds' } },
  'hooved.stag': { drives: ['fear', 'mating', 'devotion'], people: 'avoids', provoked: ['the rut'], calmed: ['a bowed head', 'a forest left uncut'], others: 'the forest spirits ride it, or so the woodsmen say' },
  'hooved.mammoth': { drives: ['mating', 'fear', 'young'], provoked: ['the calves', 'fire'], others: 'the steppe peoples follow its herds' },
  'hooved.elephant': { drives: ['young', 'memory'], social: 'herd', people: 'tolerates', provoked: ['a calf threatened', 'an old wrong remembered'], calmed: ['patience', 'distance'], others: 'remembers every poacher' },
  'serpents.constrictor': { time: 'night', provoked: ['a child near the water'], others: 'swallows pigs and deer whole', where: { marsh: 'waits under the surface at the drinking places' } },
  'serpents.basilisk': { drives: ['territory', 'fear'], provoked: ['meeting its eye'], calmed: ['a mirror', 'looking away'], people: 'hunts', others: 'leaves a ring of dead grass around its burrow' },
  'serpents.croc': { social: 'solitary', hunt: 'ambush', people: 'hunts', provoked: ['the water\'s edge', 'its nest'], calmed: ['staying from the bank'], others: 'takes cattle and children at the fords' },
  'wyrms.whitewyrm': { time: 'night', people: 'avoids', where: { mountains: 'blind, it hunts the deep mines by the sound of picks' } },
  'wyrms.snowdrake': { social: 'pair', hunt: 'chase', provoked: ['the nest', 'a fire on its peak'], others: 'hunts goats and eagles' },
  'wyrms.wyvern': { drives: ['hunger', 'territory'], hunt: 'chase', people: 'hunts', provoked: ['flocks on its ground', 'archers'], calmed: ['a carcass left out'], others: 'poisons a cow and returns for it days later' },
  'wyrms.amber': { drives: ['hoarding', 'hunger'], guards: 'amber', time: 'day', people: 'avoids', provoked: ['amber taken'], calmed: ['amber left'], others: 'basks on its amber like a dragon on gold' },
  'wyrms.seadrake': { hunt: 'chase', provoked: ['ships near its rock'], others: 'fishes the shoals; takes gulls and sailors alike' },
  'wyrms.sanddragon': { social: 'pack', time: 'day', people: 'avoids', provoked: ['its burrow'], calmed: ['shade'], others: 'eats scorpions and lizards' },
  'dragons.frostdragon': { calmed: ['silence', 'tribute of meat'], provoked: ['fire', 'its peak climbed'], where: { mountains: 'nests in glacier-caves' } },
  'dragons.stormdragon': { drives: ['territory', 'pride', 'hunger'], time: 'day', provoked: ['bells', 'a tower on its ridge'], calmed: ['a storm passing', 'courtesy'], others: 'fights other dragons for the sky' },
  'dragons.brinedragon': { drives: ['hunger', 'hoarding'], guards: 'wrecks', provoked: ['salvage taken from its wrecks'], calmed: ['a ship\'s share thrown over'], others: 'gathers wrecks like a hoard' },
  'dragons.redwidow': { drives: ['grief', 'territory'], provoked: ['anyone near her mate\'s bones'], calmed: ['leaving at once'], people: 'hates', others: 'killed her own mate, the songs say, or mourns him' },
  'giants.troll': { provoked: ['crossing its bridge', 'sunlight on it'], calmed: ['a toll paid', 'dawn'], where: { marsh: 'grey-green, sleeps under the water', mountains: 'stone-skinned, sleeps in the scree' } },
  'giants.fellgiant': { social: 'pair', people: 'bargains', drives: ['territory', 'pride'], provoked: ['its goats', 'a lie'], calmed: ['a fair trade', 'a contest won'], others: 'hunts bears for their fur' },
  'giants.ettin': { drives: ['hunger', 'quarrel'], people: 'hunts', provoked: ['either head insulted'], calmed: ['setting its heads to argue'], others: 'its two heads disagree about everything' },
  'ogres.marshogre': { drives: ['hunger', 'curiosity'], hunt: 'lure', provoked: ['its herbs taken'], calmed: ['gossip', 'a cooking pot'], others: 'brews from what it catches' },
  'skyborne.harpy': { social: 'swarm', people: 'hates', hunt: 'chase', provoked: ['a ship near its cliffs', 'singing'], calmed: ['silence', 'meat thrown off a cliff'], others: 'steals from eagles and fishermen' },
  'skyborne.griffon': { drives: ['territory', 'young', 'hoarding'], guards: 'gold-lined nest', people: 'avoids', provoked: ['horses near its nest', 'its gold'], calmed: ['horsemeat left', 'distance'], others: 'hunts horses above everything' },
  'skyborne.eagle': { social: 'solitary', people: 'ignores', provoked: ['its eyrie'], others: 'drops tortoises and bones on the rocks' },
  'skyborne.roc': { drives: ['hunger', 'young'], people: 'ignores', provoked: ['its egg'], others: 'carries off cattle and small elephants' },
  'crawlers.scorpion': { time: 'night', people: 'avoids', provoked: ['a boot', 'a blanket it sleeps in'], calmed: ['shaking out your boots'], others: 'hunts beetles and its own kind' },
  'crawlers.beetle': { drives: ['hunger'], social: 'swarm', hunt: 'scavenge', time: 'day', people: 'ignores', provoked: ['its carrion'], calmed: ['moving away'], others: 'cleans battlefields to the bone in a week' },
  'crawlers.swarm': { drives: ['hunger', 'wander'], migrates: true, people: 'ignores', stock: 'raids', provoked: [], calmed: ['smoke', 'cold', 'nothing left to eat'], others: 'eats the grass the herds need; a famine follows it' },
  'crawlers.moth': { drives: ['curiosity', 'mating'], social: 'swarm', hunt: 'drain', people: 'curious', provoked: ['a lamp put out'], calmed: ['moonlight'], others: 'drinks the dreams of sleepers, the old wives say' },
  'undead.ghoul': { hunt: 'scavenge', people: 'hunts', provoked: ['fresh graves guarded'], others: 'follows plague and battle' },
  'undead.revenant': { drives: ['vengeance'], social: 'solitary', people: 'hates', provoked: ['the one who wronged it', 'his kin'], calmed: ['its wrong righted'], others: 'walks straight through anything between it and its killer' },
  'undead.wraith': { hunt: 'drain', people: 'hates', provoked: ['warmth', 'laughter'], calmed: ['silver', 'dawn'] },
  'spirits.fire': { provoked: ['water thrown', 'its fire smothered'], calmed: ['fuel offered', 'a hearth kept'], people: 'curious', others: 'grows with every fire it feeds' },
  'spirits.water': { provoked: ['a dam', 'a poisoned well'], calmed: ['a coin in the spring', 'the water kept clean'], people: 'tolerates' },
  'spirits.wind': { drives: ['play', 'wander'], migrates: true, provoked: ['a closed door in its path'], calmed: ['a song', 'an open window'] },
  'spirits.earth': { drives: ['territory'], provoked: ['a mine', 'a quarry'], calmed: ['an offering of salt', 'the hole filled'], people: 'tolerates' },
  'spirits.frost': { provoked: ['a fire lit in its valley'], calmed: ['the fire put out'], people: 'avoids' },
  'spirits.grove': { drives: ['play', 'territory'], provoked: ['an axe', 'a broken branch'], calmed: ['planting a tree', 'singing'] },
  'demons.cinderhound': { social: 'pack', hunt: 'chase', people: 'hunts', drives: ['hunger', 'cruelty'], calmed: ['holy water', 'its master called'], others: 'hunts for whoever summoned it' },
  'demons.tempter': { drives: ['ambition', 'curiosity'], social: 'solitary', hunt: 'lure', people: 'bargains', provoked: ['a bargain refused rudely'], calmed: ['a counter-offer', 'prayer'], others: 'buys the souls of lesser things too' },
  'demons.horror': { drives: ['hunger', 'cruelty'], people: 'hates', hunt: 'crush', provoked: ['anything alive'], calmed: ['the gate closed'], others: 'eats demons too' },
  'deep.crab': { social: 'swarm', hunt: 'scavenge', people: 'ignores', provoked: ['a hand in its rocks'], calmed: ['bait thrown'] },
  'deep.seal': { social: 'herd', people: 'curious', hunt: 'chase', provoked: ['its pup'], calmed: ['stillness'], others: 'eaten by the wolves of the sea' },
  'deep.orca': { social: 'pack', drives: ['hunger', 'play'], people: 'curious', provoked: ['a harpoon'], calmed: ['fish thrown'], others: 'hunts whales together; plays with seals before eating them' },
  'deep.kraken': { drives: ['hunger', 'curiosity'], provoked: ['lamplight on the water'], calmed: ['darkness', 'a ship\'s cargo thrown over'] },
  'deep.turtle': { drives: ['wander'], migrates: true, people: 'ignores', provoked: ['a fire lit on its back'], calmed: ['nothing: it does not notice you'], others: 'carries a forest on its shell' },
  'deep.catfish': { social: 'solitary', hunt: 'ambush', people: 'ignores', provoked: ['its pool'], calmed: ['bread thrown'], others: 'swallows ducks and the dogs that chase them' },
  'fey.fox': { drives: ['play', 'hunger'], social: 'solitary', people: 'curious', provoked: ['a trap'], calmed: ['a riddle', 'a hen left'], others: 'leads hunters in circles' },
  'fey.kelpie': { drives: ['hunger'], hunt: 'lure', people: 'hunts', provoked: ['touching its mane'], calmed: ['a bridle of iron'], others: 'drowns riders and eats them under the water' },
  'fey.grove': { drives: ['territory', 'young'], social: 'solitary', hunt: 'crush', time: 'day', people: 'tolerates', provoked: ['an axe', 'fire'], calmed: ['a seedling planted', 'leaving'], others: 'shelters every beast of its wood' },
  'fey.changeling': { drives: ['curiosity', 'hunger'], people: 'curious', provoked: ['being found out'], calmed: ['milk', 'its own name'] },
  'oozes.caveslime': { time: 'any', provoked: ['a lamp'], calmed: ['darkness'], others: 'eats the bones the cave bears leave' },
  'oozes.emberooze': { drives: ['hunger', 'warmth'], provoked: ['water'], calmed: ['fuel thrown'], others: 'eats coal and the men who mine it' },
  'oozes.frostjelly': { provoked: ['warmth'], calmed: ['fire'], others: 'freezes what it touches and eats it in the spring' },
  'oozes.venomslime': { drives: ['hunger'], provoked: ['anything warm'], calmed: ['salt'], others: 'poisons the wells it lies in' },
  'oozes.mimic': { drives: ['hunger', 'cunning'], hunt: 'lure', guards: 'a chest it pretends to be', provoked: ['greedy hands'], calmed: ['leaving the treasure'], people: 'hunts', others: 'wears the shape of what men want' },
  'constructs.bone': { drives: ['duty', 'hunger'], people: 'hates', provoked: ['the living'], calmed: ['its binder\'s word'] },
  'constructs.brass': { drives: ['duty'], social: 'pack', hunt: 'chase', provoked: ['a thief'], calmed: ['the house\'s token'] },
};
// Natures (the owner, 2026-11-25: "some are simply bloodthirsty ... that is itself their specified nature"): a kind with a
// nature acts from it, not from a reason of the moment, and nothing soothes it (calmed is empty: the card offers no calming
// choice); the spec says how it acts, so rule 18 holds through its nature. `limit` is the one thing that ends it, if any.
const NATURE = {
  'hounds.hound': { k: 'bloodthirsty', spec: 'kills past hunger and leaves the meat; cannot be bargained with or turned; the pack runs until the quarry or the pack is dead', limit: 'running water' },
  'demons.cinderhound': { k: 'bloodthirsty', spec: 'bred to the hunt by whatever summoned it; tracks one scent across a realm; stops only when its master calls or it dies', limit: null },
  'demons.horror': { k: 'cruel', spec: 'kills slowly, for the pleasure of it; plays with what it catches; nothing it wants can be given', limit: null },
  'undead.dead': { k: 'relentless', spec: 'walks toward the living without rest, hunger or fear; does not tire, does not flee, does not hear words', limit: 'dawn' },
  'undead.ghoul': { k: 'hungry', spec: 'hungry beyond reason: eats until it bursts and eats again; flees only fire', limit: 'fire' },
  'crawlers.swarm': { k: 'mindless', spec: 'a hunger with a million mouths; it does not see you, only what you stand in; it ends when the grass ends or the frost comes', limit: 'frost' },
  'oozes.slime': { k: 'mindless', spec: 'flows toward warmth and eats what stays still; no fear, no wish, no memory until the last forms of its line', limit: 'fire' },
  'oozes.venomslime': { k: 'mindless', spec: 'a poison that moves; it eats by rotting what it touches and knows nothing else', limit: 'salt' },
  'constructs.bone': { k: 'relentless', spec: 'bound to one order by whoever raised it; carries it out until it is broken to pieces', limit: null },
};
const behOf = (fk, lk, apex, int) => {
  const b = Object.assign({ migrates: false, where: {} }, BEH_FAM[fk], BEH_LINE[lk] || {});
  const N = NATURE[lk];
  if (N && !(apex && (int === 'speaking' || int === 'wise'))) { b.nature = N; b.calmed = []; }
  if (apex && int !== 'beast') b.drives = [...new Set(b.drives.concat(int === 'wise' ? ['ambition', 'memory'] : ['pride']))].slice(0, 5);
  if (int === 'speaking' || int === 'wise') { if (b.people === 'avoids' || b.people === 'ignores') b.people = 'bargains'; }
  return b;
};

const INT = ['beast', 'cunning', 'speaking', 'wise'];
const slug = s => s.toLowerCase().replace(/^the /, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

export function generate() {
  const species = [], fam = {}, lines = {};
  for (const [fk, Fm] of Object.entries(FAMILIES)) {
    fam[fk] = { n: Fm.n, lines: [] };
    for (const L of Fm.lines) {
      const lk = `${fk}.${L.k}`;
      const ids = [];
      L.forms.forEach((f0, i) => {
        const f = typeof f0 === 'string' ? { n: f0 } : f0;
        let level = L.levels[i];
        if (f.cre && CRE[f.cre]) level = levelOf(creMight(...CRE[f.cre]));
        if (!(level > 0)) throw new Error(`${lk} ${f.n}: no level`);
        const apex = i === L.forms.length - 1 && L.forms.length > 1;
        let int = f.int || L.int || Fm.int;
        if (apex) { const want = L.apexInt || Fm.apexInt || 'speaking'; if (INT.indexOf(want) > INT.indexOf(int)) int = want; }
        if (L.unique) int = 'wise';
        // the profile: family base, line overrides, and growth along the line (a later form is stronger, tougher, mends faster)
        const prof = Object.assign({}, Fm.prof, L.prof || {});
        const n = L.forms.length, g = n > 1 ? i / (n - 1) : 0;
        for (const k of ['str', 'hide', 'regen', 'ward']) if (prof[k] > 0) prof[k] = clamp(Math.round(prof[k] + 2 * g - 1), 0, 10);
        if (int !== 'beast') prof.cunning = clamp(Math.max(prof.cunning, 4 + INT.indexOf(int) * 2), 0, 10);
        if (prof.magic > 0 && g > 0.5) prof.magic = clamp(prof.magic + 1, 0, 10);
        const id = slug(f.n), worth = Math.round(2 * Math.pow(10, level / 25));
        const sp = {
          id, n: f.n, fam: fk, line: lk, form: i, t: level, level: curveLevel(mightOf(level)), might: +mightOf(level).toPrecision(3), int,
          prof, terr: L.terr.slice(), coast: !!L.coast, diet: L.diet || Fm.diet, seasons: (L.seasons || Fm.seasons).slice(),
          drops: (L.drops || Fm.drops).map((k, j) => ({ k, worth: Math.max(1, Math.round(worth / (j + 1))) })),
          next: null, apex: apex || !!L.unique, beh: behOf(fk, lk, apex || !!L.unique, int),
        };
        if (f.cre) sp.cre = f.cre;
        if (L.places) sp.places = L.places.slice();   // named places, so the final map can place them in one pass
        if (f.born) sp.titles = [f.born];
        if (L.unique) sp.unique = true;
        // the step up: feed this many seasons, win this many fights, live this many years at this form (higher forms ask more)
        if (i < L.forms.length - 1) sp.evolve = { feeds: 2 + Math.floor(level / 12), wins: 1 + Math.floor(level / 18), years: 1 + Math.floor(level / 15) };
        ids.push(id);
        species.push(sp);
      });
      for (let i = 0; i < ids.length - 1; i++) species.find(s => s.id === ids[i]).next = ids[i + 1];
      lines[lk] = ids;
      fam[fk].lines.push(lk);
    }
  }
  return { species, fam, lines };
}

export function validate(B) {
  const errs = [], ids = new Set(), terrs = new Set(POWER.terrains);
  for (const s of B.species) {
    if (ids.has(s.id)) errs.push(`duplicate id ${s.id}`);
    ids.add(s.id);
    if (!INT.includes(s.int)) errs.push(`${s.id}: intelligence ${s.int}`);
    for (const t of s.terr) if (!terrs.has(t)) errs.push(`${s.id}: terrain ${t}`);
    if (!s.terr.length && !s.coast) errs.push(`${s.id}: no habitat`);
    if (s.level < 1 || s.level > POWER.levels.max) errs.push(`${s.id}: level ${s.level}`);
    for (const k of POWER.capabilities.map(c => c.k)) if (!(s.prof[k] >= 0 && s.prof[k] <= 10)) errs.push(`${s.id}: capability ${k}`);
  }
  for (const [lk, ids2] of Object.entries(B.lines)) for (let i = 1; i < ids2.length; i++) {
    const a = B.species.find(s => s.id === ids2[i - 1]), b = B.species.find(s => s.id === ids2[i]);
    if (!(b.t > a.t)) errs.push(`${lk}: ${b.id} (${b.level}) is not above ${a.id} (${a.level})`);
  }
  return errs;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const g = generate();
  const errs = validate(g);
  if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
  const out = {
    about: 'Generated by tools/powers/gen-bestiary.mjs (powers wave 1, docs/design/powers.md). Do not edit by hand: edit the generator and run it.',
    families: g.fam, lines: g.lines, species: g.species,
  };
  const text = JSON.stringify(out, null, 0).replace(/\{"id":/g, '\n{"id":') + '\n';
  if (process.argv.includes('--check')) {
    const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
    if (cur !== text) { console.error('data/bestiary.json is not what tools/powers/gen-bestiary.mjs writes: run it'); process.exit(1); }
    console.log('data/bestiary.json is current');
  } else {
    fs.writeFileSync(OUT, text);
    const apex = g.species.filter(s => s.apex).length, cre = g.species.filter(s => s.cre).length;
    const byInt = {}; for (const s of g.species) byInt[s.int] = (byInt[s.int] || 0) + 1;
    console.log(`${g.species.length} species, ${Object.keys(g.fam).length} families, ${Object.keys(g.lines).length} lines ` +
      `(${Object.values(g.lines).filter(l => l.length > 1).length} with evolution), ${apex} apex forms, ${cre} from LORE; ` +
      `levels ${Math.min(...g.species.map(s => s.level))}-${Math.max(...g.species.map(s => s.level))}; ${JSON.stringify(byInt)}`);
    for (const s of g.species.filter(s => s.cre && CRE[s.cre])) console.log(`  ${s.cre} ${s.n}: t ${s.t}, level ${s.level}`);
  }
}
