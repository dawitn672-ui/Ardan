// C7: data/names.json from docs/research/c7-name-data.json (the prepared pools), plus the per-realm leans.
//   node tools/c7/build-names-data.mjs          write data/names.json
//   node tools/c7/build-names-data.mjs --check  exit 1 if the checked-in file is stale
// What it does to the research file (D-058):
//  - keeps only what the game draws: given names by sex, family names, place names (and the common pool's trades,
//    epithets and bynames for a surname of a craft or a nickname), the cultures' pool key and accent names;
//  - no name sits in two peoples' pools (N11): a name in the common pool leaves every other pool, then a name in an
//    earlier pool of PRIORITY leaves the later ones; no name is both male and female inside a pool (N12), and across
//    the common pool and the others a given name keeps one sex;
//  - adds `lean`: a few plain names a realm leans to, so the realms that share the common pool (Aldmark English,
//    Northreach Norse, Greyhaven German, Solenne French, Varenna Italian...) sound a little different (CRITIQUE N2).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const src = JSON.parse(fs.readFileSync(path.join(root, 'docs/research/c7-name-data.json'), 'utf8'));
const out = path.join(root, 'data/names.json');

const LEAN = {
  // CUL-02 Northfolk realms
  'POL-01': { // Aldmark: English
    male: 'Edmund Edward Harold Alfred Godwin Osric Wilfred Aldric Leofric Walter Hugh Ranulf', female: 'Edith Eleanor Maud Alice Agnes Matilda Hilda Ethel Rowena Winifred Emma Joan',
    family: 'Fletcher Thatcher Harrow Brewer Marsh Wheeler Cooper Hollis Ashdown Wickham' },
  'POL-08': { // Northreach: Norse
    male: 'Ragnar Bjorn Einar Gunnar Halvard Ivar Knut Leif Magnus Olaf Sven Ulf', female: 'Astrid Freya Gudrun Helga Ingrid Sigrid Solveig Thora Ragna Ylva Brenna Liv',
    family: 'Eriksson Olsen Haraldsson Bergstrom Halvorsen Thorsen Lindqvist Stormsen Ravnsson Skarsgard' },
  'POL-14': { // Greyhaven: German
    male: 'Konrad Hans Otto Friedrich Heinrich Dieter Gerhard Ludwig Wolfram Rudolf Karl Jorg', female: 'Greta Hilda Liesl Ilse Brigitte Elke Frieda Mathilde Ursula Anneliese Hedwig Gerda',
    family: 'Schmidt Brandt Weber Hartmann Vogel Becker Keller Wagner Hoffman Lindner' },
  'POL-05': { // Ashmere: Welsh
    male: 'Owen Rhys Gareth Dai Evan Emrys Gwyn Llewellyn Idris Bran Iolo Madoc', female: 'Anwen Branwen Gwen Megan Rhiannon Eira Nia Olwen Carys Bronwen Mair Seren',
    family: 'Jones Griffiths Rees Pryce Morgan Powell Bevan Vaughan Lloyd Howell' },
  'POL-13': { // Brannoch: Scots
    male: 'Angus Duncan Fergus Malcolm Ewan Hamish Callum Donald Gregor Lachlan Rory Alasdair', female: 'Isla Morag Fiona Ailsa Mairi Elspeth Kirsty Eilidh Catriona Una Sheena Mhairi',
    family: 'MacLeod Campbell Fraser Ross Gordon Stewart Murray Cameron Graham Munro' },
  // CUL-01 Solenfolk realms
  'POL-02': { // Solenne: French
    male: 'Louis Henri Jean Pierre Claude Etienne Guy Rene Remy Gaston Armand Luc', female: 'Giselle Marie Colette Adele Celine Isabeau Odette Margot Yvonne Jeanne Aimee Camille',
    family: 'Dubois Laurent Moreau Fontaine Rousseau Beaumont Lefevre Garnier Chevalier Marchand' },
  'POL-03': { // Varenna: Italian
    male: 'Marco Luca Paolo Matteo Dario Enzo Fabio Gino Lorenzo Nico Tullio Vito', female: 'Chiara Giulia Lucia Bianca Sofia Livia Paola Rosa Gina Elena Nina Tessa',
    family: 'Rossi Bianchi Conti Ferrari Marino Greco Fontana Moretti Ricci Bruno' },
  'POL-04': { // Lucerna: a merchant republic
    male: 'Andrea Bruno Carlo Dino Emilio Franco Giorgio Leo Marino Piero Sandro Vittorio', female: 'Anna Carla Donata Emilia Flavia Marta Silvia Teresa Vera Viola Bella Paulina',
    family: 'Gallo Lombardi Marini Vitale Zanetti Donati Sartori Barbieri Mercanti Soldani' },
  'POL-15': { // Morhaven: Spanish
    male: 'Diego Carlos Alonso Pedro Rafael Hugo Mateo Felipe Tomas Juan Luis Pablo', female: 'Maria Carmen Elena Isabel Lucia Rosa Ines Marta Pilar Sofia Teresa Alba',
    family: 'Garcia Lopez Mendez Navarro Romero Castillo Ortega Vega Moreno Salazar' },
  'POL-16': { // Ostra: Dutch
    male: 'Jan Pieter Willem Dirk Hendrik Joost Maarten Cornelis Gerrit Jacob Floris Bram', female: 'Anneke Greta Hanna Marijke Femke Lotte Sanne Trijn Wilma Ida Mieke Annelies',
    family: 'Visser Bakker Jansen Smit Mulder Dekker Brouwer Vermeer Hoek Veldman' },
  'POL-31': { // Tessaria: old imperial
    male: 'Alexios Nikos Stefan Theo Dimitri Leon Basil Manuel Andreas Petros Kosta Yannis', female: 'Helena Irene Zoe Theodora Anna Sophia Daphne Eudora Phoebe Thea Ione Calla',
    family: 'Stathis Pappas Kostas Dimas Nikolas Andros Lascar Doukas Palaios Argyros' },
};
// first match wins: the earlier pool keeps a name the later one also holds
const PRIORITY = ['steppe', 'desert', 'south', 'giant', 'dwarf', 'elf-wood', 'elf-sea', 'orc-horde', 'orc-tusk'];
const ok = s => /^[A-Za-z][A-Za-z'-]{1,23}$/.test(s);
const lc = s => s.toLowerCase();
const words = s => s.split(/\s+/).filter(Boolean);

function build() {
  const C = src.common;
  const taken = { male: new Set(), female: new Set(), any: new Set() };
  const uniq = a => { const s = new Set(); return a.filter(x => ok(x) && !s.has(lc(x)) && s.add(lc(x))); };
  const common = { male: uniq(C.male), female: uniq(C.female).filter(x => !C.male.some(m => lc(m) === lc(x))),
    family: uniq(C.family), places: uniq(C.places), trades: uniq(C.trades), epithets: uniq(C.epithets), bynames: uniq(C.bynames) };
  const usedGiven = new Map(); // name -> sex and race, over every pool so far
  for (const sx of ['male', 'female']) for (const n of common[sx]) usedGiven.set(lc(n), { sx, race: 'common' });
  const usedFam = new Set(common.family.map(lc)), usedPlace = new Set(common.places.map(lc));
  const pools = {};
  for (const key of PRIORITY) {
    const P = src.pools[key];
    // the two elf pools are one people's, and so are the two orc ones, and may share a name; no other two peoples do
    const grp = key.startsWith('elf') ? 'elf' : key.startsWith('orc') ? 'orc' : key;
    const clash = (n, sx) => { const u = usedGiven.get(lc(n)); return u && (u.race !== grp || u.sx !== sx); };
    const male = uniq(P.male).filter(n => !clash(n, 'male'));
    const female = uniq(P.female).filter(n => !clash(n, 'female') && !male.some(m => lc(m) === lc(n)));
    for (const n of male) usedGiven.set(lc(n), { sx: 'male', race: grp });
    for (const n of female) usedGiven.set(lc(n), { sx: 'female', race: grp });
    // a family name or a place is one of this people's own: none repeats a common one
    const family = uniq(P.family).filter(n => !usedFam.has(lc(n)));
    const places = uniq(P.places).filter(n => !usedPlace.has(lc(n)));
    pools[key] = { male, female, family, places };
  }
  const cultures = {};
  for (const [id, c] of Object.entries(src.cultures)) {
    cultures[id] = { uses: c.uses };
    if (c.accent) cultures[id].accent = { male: c.accent.male.filter(ok), female: c.accent.female.filter(ok), family: c.accent.family.filter(ok) };
  }
  const lean = {};
  for (const [id, L] of Object.entries(LEAN)) lean[id] = { male: words(L.male), female: words(L.female), family: words(L.family) };
  return { _about: 'C7 (D-058): the common English pool, the pools of the far and non-human peoples, the cultures\' pool and accent names, and the leans of realms that share a pool. Built by tools/c7/build-names-data.mjs from docs/research/c7-name-data.json.', common, pools, cultures, lean };
}
const json = JSON.stringify(build());
if (process.argv.includes('--check')) {
  const cur = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '';
  if (cur !== json + '\n') { console.error('data/names.json is stale: run node tools/c7/build-names-data.mjs'); process.exit(1); }
  console.log('data/names.json up to date');
} else {
  fs.writeFileSync(out, json + '\n');
  const d = JSON.parse(json);
  console.log('common', Object.fromEntries(Object.entries(d.common).map(([k, v]) => [k, v.length])));
  for (const [k, v] of Object.entries(d.pools)) console.log(k, v.male.length, v.female.length, v.family.length, v.places.length);
  console.log((json.length / 1024).toFixed(0) + ' KB');
}
