// The far beasts' data: node features/992-far-beasts/gen.mjs [--check] [--lore=<dir>]
// Reads canon/lore/beasts.json (140 creatures, CRE-65 to CRE-204) and far-lands.json (lands and regions) and writes
// a-data.core.js (checked in; the lore folder is private and not in the repo). Lore becomes game data and short lines:
// ids, lands, regions, terrain words, sizes, tiers, danger, the release's stat blocks (or stats read from the size when
// the lore gives none), rarity, yield, whether the tale is true, and one short line each for habit, belief and truth.
// Long or canon-referencing lines are rewritten by hand below (LINE). Deterministic; --check fails if the file differs.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const LORE = arg('lore') ? path.resolve(arg('lore')) : path.join(ROOT, 'canon/lore');
const OUT = path.join(HERE, 'a-data.core.js');

// ---- kinds: the scene family and the bestiary's label, by the creature's name
const KINDS = [
  ['legend', null], ['relic', /Gyokar's Bones/], ['dragon', /Dragon/],
  ['sea', /Shark|Moray|Whale|Narwhal|Dugong|Dolphin|Orca|Grief/],
  ['fish', /Pike|Sturgeon|Catfish|Salmon|Whitefish|Eel\b|Shrimp|Oyster/],
  ['small', /Scorpion|Leech|Silkworm|Termite/],
  ['serpent', /Snake|Python|Cobra/],
  ['bird', /Eagle|Vulture|Raven|Crane|Owl|Hornbill|Plume|Murre|Cassowary|Ostrich|Kingfisher|Lammergeier|Flying Fox|Hawk-Bat/],
  ['croc', /Crocodile|Grandmother of the Stairs|Kalunge|Salamander|Lizard|Monitor|Turtle|Tortoise/],
  ['cat', /Tiger|Leopard|Lion|Lynx|Cat\b/],
  ['hound', /Wolf|Dog\b|Hyena|Fox|Wolverine/],
  ['bear', /\bBear\b/],
  ['ape', /Ape|Macaque|Gibbon|Gelada|Forest Man|Forest Giant|Climber|Cuscus|Kangaroo/],
  ['titan', /Elephant|Mammoth|Rhinoceros|Hippopotamus/],
  ['seal', /Otter|Seal\b|Walrus/],
  ['cattle', /Aurochs|Yak|Buffalo|Gaur|Takin|Musk-Ox|Pig\b|Tapir/],
  ['grazer', /Horse|Ass\b|Kiang|Camel|Saiga|Argali|Sheep|Elk|Reindeer|Deer|Oryx|Eland|Okapi|Herds|Marmot|Sable$/],
];
const KIND_LABEL = { dragon: 'Dragon', seal: 'Seal and otter', cat: 'Great cat', hound: 'Hunting beast', bear: 'Bear', ape: 'Ape and climber', titan: 'Giant grazer', cattle: 'Wild cattle and kin',
  grazer: 'Grazer', bird: 'Bird', croc: 'Crocodile and lizard', serpent: 'Serpent', sea: 'Sea beast', fish: 'Fish', small: 'Small creature', relic: 'Relic', legend: 'Legend' };
// what a careful hunter knows of each kind (shown with the truth): fresh lines, the release's "weak" field
const WEAK = { dragon: 'A torn wing grounds it, and on the ground it is only very large.', seal: 'On land it is slow, and knows it.', cat: 'It hunts from behind and will rarely charge a man who faces it.', hound: 'A pack breaks when its leader falls.',
  bear: 'It rises before it charges; that is the moment for the spear.', ape: 'Stand still and it will usually turn away.',
  titan: 'Its eyes are poor; fire and noise turn it.', cattle: 'It charges in a straight line and turns slowly.',
  grazer: 'It runs from anything it does not know.', bird: 'It will not fight what it cannot carry off.',
  croc: 'It is slow away from the water.', serpent: 'It strikes only at what moves.', sea: 'It follows blood in the water for miles.',
  fish: 'It feeds at dusk.', small: 'Shake out your boots.', relic: '–', legend: '–' };

// ---- hand-written lines where the lore line is long or speaks of canon ids (habit, belief, truth)
const LINE = {
  'CRE-69': { truth: 'Real; their fleas carried the Marmot Death of 909 to 913.' },
  'CRE-70': { truth: 'Real: a few hundred on the northern edge of the grass.' },
  'CRE-75': { truth: 'Real; the Old Mare\'s cattle are aurochs crossed with tame stock.' },
  'CRE-81': { truth: 'Invented in the Nine Wells after 744, to keep the silk roads quiet.' },
  'CRE-90': { habit: 'Shy apes of the snowfields, kin of the western snow apes.', truth: 'Real; a few hundred of them.' },
  'CRE-92': { habit: 'Some nine dragons range over the Cloudwall\'s western end, nest by hot springs and hunt yak and blue sheep.',
    belief: 'Gyokar\'s monks call them sky-kings, the oldest reborn souls.', truth: 'Real; the same dragons the west counts.' },
  'CRE-111': { habit: 'Trained for war in Vahra, Pravith, Ayamo, Juvai and the circle kingdoms; wild herds in the Hill Country.',
    belief: 'The elephants are a nation with lords of their own.', truth: 'Real; about 3,500 war elephants are trained in the Far Lands.' },
  'CRE-112': { belief: 'They keep the Sleeper dreaming.', truth: 'Albinos of a closed line; Ranpur\'s Moon-Pearl descends from one led west long ago.' },
  'CRE-132': { belief: 'It carries messages to the upper world.' },
  'CRE-138': { belief: 'An island that swims.' },
  'CRE-147': { belief: 'A guest from the upper world in a bear\'s coat.' },
  'CRE-149': { belief: 'The Reindeer Mother\'s loan, to be paid back.' },
  'CRE-154': { belief: 'Descended from the first mare, who foaled the sun.' },
  'CRE-160': { truth: 'They like caves.' },
  'CRE-164': { belief: 'In the west its tusk is sold as unicorn horn.' },
  'CRE-165': { habit: 'Some 300 woolly mammoths in small herds on the Walrus Strand\'s tundra.', belief: 'The last of the herds that walked north with the giants.', truth: 'Real and rare.' },
  'CRE-171': { belief: 'A guest from the mountain.' },
  'CRE-178': { belief: 'The ancestors\' herds, walking.' },
  'CRE-180': { truth: 'They ride nobody.' },
  'CRE-186': { belief: 'The River Bride\'s servants.' },
  'CRE-189': { belief: 'It carries the rain on its back.' },
  'CRE-195': { truth: 'Real.' },
  'CRE-202': { truth: 'Whirlpools at the spring tide.' },
  'CRE-203': { belief: 'Sea maidens.' },
  'CRE-69b': {},
};
// a belief for creatures the lore gives none: what hunters say of the kind
const PLAIN_BELIEF = { dragon: 'Herders say it can smell a lie.', seal: 'Fishermen say it steals from the nets.', cat: 'Hunters say it is never where you look.', hound: 'Herders say it can count the flock.', bear: 'Hunters do not say its name in the woods.',
  ape: 'Woodsmen say it watches them work.', titan: 'Herders say the ground tells you before it comes.', cattle: 'Herders say a lone bull is the worst of them.',
  grazer: 'Hunters say it is good meat and hard to come near.', bird: 'Fowlers say it knows a net when it sees one.', croc: 'Boatmen say it remembers a face.',
  serpent: 'Mothers say it comes for milk.', sea: 'Fishermen say it follows the boats.', fish: 'Fishermen say the big ones are clever.', small: 'Nobody says much of it.' };
// the tale as told: true (it holds), rumoured (the beast is real, the tale is not), believed (no such beast)
const TRUE = new Set(['CRE-66', 'CRE-69', 'CRE-71', 'CRE-73', 'CRE-75', 'CRE-77', 'CRE-85', 'CRE-94', 'CRE-101', 'CRE-114', 'CRE-115', 'CRE-117', 'CRE-122',
  'CRE-126', 'CRE-130', 'CRE-137', 'CRE-146', 'CRE-164', 'CRE-165', 'CRE-187', 'CRE-194']);
// game and quarry: the plain hunt's words for the beasts one can hunt for the pot or the market
const QUARRY = {
  'CRE-65': 'a wild horse', 'CRE-66': 'a saiga', 'CRE-69': 'a brace of marmots', 'CRE-71': 'a wild camel', 'CRE-72': 'a sand cat', 'CRE-73': 'an argali ram',
  'CRE-76': 'a lake pike', 'CRE-78': 'a wild ass', 'CRE-84': 'an otter', 'CRE-85': 'a monitor lizard', 'CRE-88': 'a kiang', 'CRE-89': 'a blue sheep',
  'CRE-104': 'a sturgeon', 'CRE-105': 'a gully fox', 'CRE-118': 'a lake turtle', 'CRE-119': 'a giant catfish', 'CRE-128': 'a tapir', 'CRE-132': 'a hornbill',
  'CRE-133': 'a plume bird', 'CRE-136': 'a cuscus', 'CRE-140': 'a tree kangaroo', 'CRE-142': 'a bearded pig', 'CRE-145': 'a string of flying foxes',
  'CRE-149': 'a reindeer', 'CRE-151': 'a sable', 'CRE-152': 'a freshwater seal', 'CRE-153': 'a basket of whitefish', 'CRE-154': 'a wild horse',
  'CRE-158': 'a salmon', 'CRE-159': 'a sea otter', 'CRE-161': 'a musk-deer', 'CRE-168': 'an arctic fox', 'CRE-170': 'a sack of murre eggs',
  'CRE-175': 'a string of eels', 'CRE-177': 'a sika stag', 'CRE-178': 'an antelope from the ring herds', 'CRE-186': 'a river catfish', 'CRE-189': 'an eland',
  'CRE-195': 'an oryx', 'CRE-198': 'an ostrich', 'CRE-203': 'a dugong', 'CRE-126': 'a bag of pearl oysters', 'CRE-148': 'an elk', 'CRE-87': 'a wild yak',
};
// what a kill or a catch yields: the word and a value factor (fur, ivory, horn, musk and plumes sell well)
const YIELD = [
  [/Dragon/, 'scales and teeth', 2.5], [/Flying Fox|Hawk-Bat/, 'meat', 0.6], [/Shark|Grief|Moray/, 'teeth and oil', 1.3],
  [/Sable$|Sea Otter|Arctic Fox|Snow Leopard|Lynx/, 'fur', 2.5], [/Elephant|Walrus|Narwhal|Mammoth|Hornbill/, 'ivory', 2.2], [/Rhinoceros/, 'horn', 3],
  [/Musk-Deer/, 'musk', 4], [/Plume|Ostrich/, 'plumes', 2], [/Oyster/, 'pearls', 3], [/Tiger|Leopard|Lion|\bBear\b|Wolf|Fox|Otter|Cat\b|Wolverine|Hyena|Dog\b/, 'pelt', 1.4],
  [/Crocodile|Grandmother|Kalunge|Lizard|Monitor|Python|Snake|Cobra/, 'skin', 1.3], [/Whale|Seal|Dugong|Shark|Orca|Grief|Moray/, 'oil and meat', 1.2],
  [/Pike|Sturgeon|Catfish|Salmon|Whitefish|Eel|Turtle/, 'fish', 0.8], [/Murre/, 'eggs', 0.6],
];
// held in stables or by one family, never hunted or fought
const KEPT = new Set(['CRE-112', 'CRE-191', 'CRE-93']);

const mass = (size, kind) => {
  const s = String(size || '');
  const t = /([\d.]+)\s*tonnes?/.exec(s); if (t) return +t[1] * 1000;
  const k = /([\d.,]+)\s*kg/.exec(s); if (k) return +k[1].replace(/,/g, '');
  const g = /([\d.]+)\s*g\b/.exec(s); if (g) return +g[1] / 1000;
  const m = /([\d.]+)\s*(?:to [\d.]+ )?m\b(?! span)/.exec(s), cm = /([\d.]+)\s*cm/.exec(s), sp = /([\d.]+)\s*m span/.exec(s);
  if (sp) return Math.round(+sp[1] * 2.5);
  if (m) { const L = +m[1]; return Math.round((kind === 'serpent' ? 0.3 : kind === 'fish' ? 3 : kind === 'sea' ? 7 : kind === 'bird' ? 8 : 12) * L * L * L); }
  if (cm) return +(+cm[1] / 100).toFixed(3);
  return 10;
};
// stats from the size, along the release's own blocks (anchors read from them and the lore's 49 blocks)
const ANCH = [[0.01, 3, 2, 1, 0], [1, 10, 10, 3, 0], [5, 20, 25, 8, 0], [20, 35, 58, 12, 1], [45, 45, 72, 13, 1], [90, 60, 125, 17, 2], [180, 85, 190, 23, 2],
  [350, 100, 250, 26, 3], [700, 105, 285, 24, 4], [1200, 120, 330, 26, 5], [2500, 140, 410, 31, 6], [5000, 150, 450, 32, 6], [15000, 170, 520, 34, 7], [40000, 190, 600, 36, 8]];
const SPD = { dragon: 70, seal: 35, cat: 72, hound: 68, bear: 45, ape: 50, titan: 40, cattle: 45, grazer: 62, bird: 75, croc: 38, serpent: 35, sea: 55, fish: 45, small: 30 };
const VERB = { dragon: 'rakes', seal: 'tusks', cat: 'leaps on', hound: 'bites', bear: 'mauls', ape: 'batters', titan: 'tramples', cattle: 'gores', grazer: 'kicks', bird: 'strikes', croc: 'drags',
  serpent: 'strikes', sea: 'bites', fish: 'thrashes', small: 'stings' };
const statsFor = (kg, kind, danger, where, terr) => {
  const lk = Math.log(Math.max(0.01, kg));
  let i = 0; while (i < ANCH.length - 2 && Math.log(ANCH[i + 1][0]) < lk) i++;
  const a = ANCH[i], b = ANCH[i + 1], f = Math.max(0, Math.min(1, (lk - Math.log(a[0])) / (Math.log(b[0]) - Math.log(a[0]))));
  const at = j => a[j] + (b[j] - a[j]) * f, dm = danger >= 3 ? 1.1 : danger === 2 ? 1 : danger === 1 ? 0.8 : 0.6;
  return { str: Math.round(at(1)), spd: SPD[kind] || 50, ins: 45 + 5 * Math.min(3, danger), sta: 54 + 4 * Math.min(3, danger), hp: Math.round(at(2)),
    dmg: Math.max(2, Math.round(at(3) * dm)), pierce: Math.max(1, Math.round(at(3) / 9)), prot: Math.round(at(4)), fame: 3 + 3 * danger,
    terr: terr.slice(), verb: VERB[kind] || 'bites', where };
};
const engineTier = B => (B.hp >= 330 ? 'titan' : B.hp >= 170 ? 'great' : 'animal');

const clean = s => String(s || '').replace(/\s*\((?:canon )?(?:REL|SEC|CRE)-\d+(?: kin)?\)/g, '').replace(/\s+/g, ' ').trim();
const lc = s => s.replace(/^The /, 'the ');

export function generate() {
  const bText = fs.readFileSync(path.join(LORE, 'beasts.json'), 'utf8'), fText = fs.readFileSync(path.join(LORE, 'far-lands.json'), 'utf8');
  const BJ = JSON.parse(bText), FJ = JSON.parse(fText);
  const lands = Object.fromEntries(FJ.lands.map(l => [l.code, l.name]));
  const regions = Object.fromEntries(FJ.regions.map(r => [r.id, r.name]));
  // each region's middle in the game's km, for a region the far map has no province in (the nearest of its land stands in)
  const centres = Object.fromEntries(FJ.regions.map(r => [r.id, [r.centre.x, r.centre.y]]));
  const list = [], report = { kinds: {}, fight: 0, quarry: 0, stats: { lore: 0, size: 0, none: 0 }, tales: {} };
  for (const c of BJ.creatures) {
    const kind = c.tier === 'legend' ? 'legend' : (KINDS.find(k => k[1] && k[1].test(c.name)) || [])[0] || 'grazer';
    const kg = mass(c.size, kind), L = LINE[c.id] || {};
    const regionsOk = c.regions.filter(r => regions[r]);
    const terr = (c.stats && c.stats.terr && c.stats.terr.length ? c.stats.terr : c.terrain).filter(Boolean);
    const sea = kind === 'sea' || (terr.length > 0 && terr.every(t => t === 'sea')) || (kind === 'fish' && terr.includes('sea'));
    const where = c.stats && c.stats.where ? lc(c.stats.where) : lc(regions[regionsOk[0]] || 'the wilds');
    let stats = null, from = 'none';
    if (c.tier !== 'legend' && kind !== 'relic') {
      if (c.stats) { const s = c.stats; stats = { str: s.str, spd: s.spd, ins: s.ins, sta: s.sta, hp: s.hp, dmg: s.dmg, pierce: s.pierce, prot: s.prot, fame: s.fame, terr: terr.filter(t => t !== 'sea'), verb: s.verb, where }; if (s.pack) stats.pack = s.pack; from = 'lore'; }
      else { stats = statsFor(kg, kind, c.danger, where, terr.filter(t => t !== 'sea')); from = 'size'; }
      if (!stats.terr.length) stats.terr = ['plains'];
    }
    report.stats[from]++;
    const tier = c.tier === 'legend' ? 'legend' : null;
    // who you can fight on land: the lore's own fighters and the larger beasts that are a danger, nothing at sea, nothing kept
    const fight = !!stats && !sea && !KEPT.has(c.id) && kind !== 'small' && kind !== 'fish' && kind !== 'bird' && kind !== 'serpent' || (!!stats && from === 'lore' && kind === 'serpent') || (!!stats && c.id === 'CRE-134');
    const fightOk = fight && (from === 'lore' || (c.danger >= 1 && kg >= 20 && ['cat', 'hound', 'bear', 'cattle', 'croc', 'seal'].includes(kind)));
    const fightSea = !!stats && sea && from === 'lore';
    // the tier the duel engine gives a fighter's stats (as 48-fight-ladder holds it); the lore's own tier for the rest
    const tierT = tier || ((from === 'lore' || fightOk || fightSea) ? engineTier(stats) : c.tier);
    const venom = kind === 'small' && c.danger >= 1 || (kind === 'serpent' && from !== 'lore') || c.id === 'CRE-85';
    const quarry = QUARRY[c.id] || null;
    const y = YIELD.find(x => x[0].test(c.name)) || [null, kind === 'bird' ? 'feathers' : 'hide and meat', 1];
    const value = Math.max(1, Math.round((2 + Math.sqrt(Math.min(kg, 6000)) * 0.45 + (stats ? stats.fame : 2) * 0.8) * y[2]));
    const named = c.individuals.length > 0;
    const truthT = clean(L.truth || c.truth);
    const rarity = tierT === 'legend' ? 'legend' : KEPT.has(c.id) || /^(Tasieng|Kalunge|Old Grandmother)/.test(c.name) ? 'unique'
      : /rare\b|few hundred|about 300|there are a few|never seen/i.test(truthT + ' ' + c.behaviour) || tierT === 'titan' && c.danger > 0 ? 'rare'
        : c.danger >= 3 || c.tier === 'great' ? 'uncommon' : 'common';
    const tale = tierT === 'legend' ? 'believed' : !c.belief ? 'none' : TRUE.has(c.id) ? 'true' : 'rumoured';
    report.kinds[kind] = (report.kinds[kind] || 0) + 1; report.tales[tale] = (report.tales[tale] || 0) + 1;
    if (fightOk) report.fight++; if (quarry) report.quarry++;
    const rec = {
      id: c.id, name: c.name, kind, cat: c.tier === 'legend' ? (/no such|Does not exist|Invented|story|Unknown/i.test(c.truth) ? 'Legend (hoax)' : 'Legend (misunderstanding)') : KIND_LABEL[kind],
      tier: tierT, ltier: c.tier, danger: c.danger, lands: c.land_codes.slice(), regions: regionsOk, terr: terr.slice(), sea, kg: +(+kg).toPrecision(3),
      size: c.size || '', rarity, tale, fight: fightOk, fightSea, venom, quarry, yield: stats ? { what: y[1], coin: value } : null,
      habit: clean(L.habit || c.behaviour) || '', belief: clean(L.belief || c.belief) || PLAIN_BELIEF[kind] || '', truth: truthT || 'Real.', weak: WEAK[kind] || '–',
      inds: c.individuals.map(i => ({ name: i.name, note: clean(i.note).replace(/\.$/, '') })),
    };
    if (stats) rec.stats = stats;
    if (named) rec.named = true;
    for (const k of ['habit', 'belief', 'truth']) if (rec[k].length > 150) throw new Error(`${c.id} ${k} is ${rec[k].length} characters: write it shorter in LINE`);
    for (const k of ['habit', 'belief', 'truth']) if (/canon|REL-|SEC-|CRE-/.test(rec[k])) throw new Error(`${c.id} ${k} names canon: ${rec[k]}`);
    list.push(rec);
  }
  const loreHash = crypto.createHash('sha256').update(bText + fText).digest('hex').slice(0, 16);
  const data = { v: 1, loreHash, lands, regions, centres, list };
  const head = '// features/992-far-beasts/a-data.core.js: the far beasts as data, generated by gen.mjs from the private lore. Do not edit by hand:\n' +
    '// run node features/992-far-beasts/gen.mjs. c-beasts.core.js installs them while a game of the Great Continent is open.\n';
  return { text: head + 'A.FB_DATA = ' + JSON.stringify(data) + ';\n', report, n: list.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { text, report, n } = generate();
  if (process.argv.includes('--check')) {
    const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
    if (cur !== text) { console.error('a-data.core.js is not what gen.mjs makes: run node features/992-far-beasts/gen.mjs'); process.exit(1); }
    console.log('a-data.core.js is current'); process.exit(0);
  }
  fs.writeFileSync(OUT, text);
  console.log(`${n} creatures: ${JSON.stringify(report)}; ${(text.length / 1024).toFixed(0)} KB`);
}
