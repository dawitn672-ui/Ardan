// Skills rebuild, step 1 (docs/design/skills-v2.md §2, §9.1, §10): seeds data/skills/ from S1's data (data/skills.json)
// and the release's perks (GD.PERKS in src/core/release/core/02-game-data-a.js).
//   node tools/skills2/seed-data.mjs           write data/skills/families.json and data/skills/ladders/*.json
//   node tools/skills2/seed-data.mjs --check   exit 1 if the files on disk differ from what it would write
// It writes the 28 families and their ladders: five rungs a family (D, C, B, A and the family's common S rung, which
// an old save's Grandmaster or Legend lands on, §7; the one-holder summits come with step 9). Each C, B and A rung
// carries, at Lv 1, the release's perk rows at 40, 65 and 85 (S1's knacks at 35, 55, 72) as `perk` effects, so
// A.perkSum stays whole at the switch (§7, §6.2). The rest of every rung's effects are left to the data review and
// to step 6. vocab.json and recipes.json are written by hand; this script does not touch them.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const S1 = JSON.parse(fs.readFileSync(path.join(root, 'data/skills.json'), 'utf8'));
const ctx = { A: {}, console }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'src/core/release/core/02-game-data-a.js'), 'utf8') + ';globalThis.__GD = GD;', ctx);
const PERKS = ctx.__GD.PERKS;

// the group of a family, as a category's first part (the skills screen's tabs, §8)
const GROUP = { 'Arms': 'arms', 'The body': 'body', 'War': 'war', 'The land': 'land', 'The sea': 'sea', 'Crafts': 'crafts', 'Trade': 'trade', 'Letters': 'letters', 'Faith': 'faith', 'Court': 'court', 'The shadow': 'shadow' };
// the rungs, D -> C -> B -> A (§9.1's table, first drafts for the data review), and each family's common S rung
const LADDER = {
  sword: ['Stick and Lath', 'Basic Swordsmanship', 'Measured Blade', 'Master of the Long Edge', 'Edge Beyond Teaching'],
  spear: ['Haft and Head', 'Basic Polearm', 'Line-Breaker', 'Master of the Haft', 'Haft of the Age'],
  shield: ['Shield Arm', 'Shield Work', 'Iron Door', 'Living Wall', 'The Shield That Holds'],
  bow: ['Hedge Archer', 'Basic Archery', 'Steady Draw', 'Master Bowman', 'Arrow Unerring'],
  melee: ['Beginner Footwork', 'Footwork', 'Fleet Fighter', 'Dancer in Harness', 'Feet Like Wind'],
  riding: ['Saddle-Sore', 'Horsemanship', "Knight's Seat", 'Born in the Saddle', 'Horse and Rider One'],
  unarmed: ['Scrapper', 'Wrestler', 'Iron Grip', 'Bone-Breaker', 'Hands of Iron'],
  athletics: ['Hardy Legs', 'Athlete', 'Tireless', 'Untiring Stride', 'Body Unwearied'],
  command: ["Corporal's Voice", 'Steady Command', "Captain's Eye", "General's Grasp", 'Commander of Hosts'],
  tactics: ['Lay of the Land', 'Field Tactics', 'Siege and Sally', 'Strategist', 'The Field Seen Whole'],
  survival: ['Forager', 'Woodcraft', "Hunter's Patience", 'Master of the Hard Country', 'Child of the Wilds'],
  tracking: ['Sharp Eyes', 'Tracker', 'Pathfinder', 'The Unlost', 'Reader of All Ground'],
  husbandry: ['Field Hand', 'Husbandry', 'Herd and Furrow', 'Valley-Maker', 'Keeper of Living Things'],
  sea: ['Deckhand', 'Seamanship', 'Helmsman', 'Master of the Sea Road', 'Sea-Born'],
  craft: ["Apprentice's Hands", 'Journeyman Craft', 'Mastercraft', 'The Hand That Stops', 'Hand of the Age'],
  medicine: ['Bandager', 'Leechcraft', 'Physician', 'Master of Bones and Fevers', 'Healer of Kings'],
  music: ['Tavern Voice', 'Minstrelsy', 'Court Singer', 'Keeper of the Long Lay', 'Voice of the Age'],
  trade: ['Haggler', 'Trader', "Merchant's Eye", 'Master of the Counting House', 'Gold-Reader'],
  stewardship: ['Tally-Keeper', 'Stewardship', 'Estate-Keeper', 'Master Steward', 'Keeper of Realms'],
  gambling: ['Dice-Thrower', 'Gamester', 'Card-Sharp', "Fortune's Reader", "Luck's Own Hand"],
  learning: ['Letters', 'Scholar', 'Lettered Mind', 'Master of the Old Books', 'Sage of the Age'],
  faith: ['Pious Habit', 'Devout', 'Preacher of the Word', 'Keeper of Souls', "The Soul's Lantern"],
  persuasion: ['Smooth Talk', 'Persuasion', 'Silver Speech', 'Voice That Moves Halls', 'Tongue of Gold'],
  diplomacy: ["Peacemaker's Patience", 'Diplomacy', 'Envoy', 'Treaty-Maker', 'Peace-Weaver'],
  etiquette: ['Manners', 'Courtesy', 'Courtier', 'Grace of Halls', 'Mirror of Courts'],
  intimidation: ['Hard Stare', 'Intimidation', 'Dread Presence', 'Iron Presence', 'Terror of Halls'],
  stealth: ['Sneak', 'Stealth', 'Shadow-Walker', 'Unseen', 'Shadow Itself'],
  intrigue: ['Gossip', 'Intrigue', 'Plotter', 'Web-Spinner', 'The Hidden Hand'],
};
// ids the design already wrote (§9.2) keep their spelling; the rest are the name in snake case
// (a rung renamed after saves held it keeps its old id: "General's Grasp" was "Marshal's Grasp", w1 retired the word)
const ID = { 'Master of the Long Edge': 'long_edge_master', "General's Grasp": 'marshals_grasp' };
const idOf = n => ID[n] || n.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const RANKS = ['D', 'C', 'B', 'A', 'S'];
const RARITY = { D: 'common', C: 'common', B: 'uncommon', A: 'rare', S: 'rare' };
const PERK_AT = { C: 40, B: 65, A: 85 };   // the release's thresholds (S1 read them at 35, 55, 72)
const TEXT = {
  D: n => `The first habits of ${n}: what to do, if not yet when.`,
  C: n => `${n[0].toUpperCase() + n.slice(1)} as a trade: you do it as well as most who live by it.`,
  B: n => `Past where most ever reach in ${n}. Others come to you to learn it.`,
  A: n => `Few in a realm match you at ${n}. Your name travels with it.`,
  S: n => `As far as ${n} goes in a human life. A handful on the continent stand here.`,
};
// §15.6 with the owner's word of 2026-11-25: skills have no range (they are used in combat or training); a rare skill
// may carry a `reach` note where it truly matters
const SPEC = () => ({ cooldown: null, cost: null, effect: null, duration: null, conditions: [] });
// the rank (and level, for a gate) a concept opens, in place of S1's word: no measure word survives in this data
const OPENS = { intermediate: { rank: 'D', lv: 6 }, advanced: { rank: 'C', lv: 1 }, expert: { rank: 'B', lv: 1 }, master: { rank: 'A', lv: 1 }, grandmaster: { rank: 'S', lv: 1 }, legend: { rank: 'S', lv: 6 } };
const conceptsOf = (s, word) => s.concepts.filter(c => c.word === word).map(c => `${s.id}:${c.id}`);

const families = [], ladders = {};
for (const s of S1.skills) {
  const names = LADDER[s.id]; if (!names) throw new Error('no ladder for ' + s.id);
  const group = GROUP[s.group]; if (!group) throw new Error('no group for ' + s.group);
  families.push({
    id: s.id, name: s.name, group, kind: s.kind, gov: s.gov, legacy: s.legacy || [],
    focuses: s.specialisms.map(sp => (sp.legacy ? { id: sp.id, name: sp.name, legacy: sp.legacy } : { id: sp.id, name: sp.name })),
    kin: s.kin || {}, concepts: s.concepts.map(c => ({ id: c.id, name: c.name, opens: OPENS[c.word], desc: c.desc, never: c.never })), checkTags: [s.id, ...(s.legacy || [])], desc: s.desc,
  });
  const noun = s.name.toLowerCase();
  const ids = names.map(idOf);
  const rungs = RANKS.map((rank, i) => {
    const effects = [];
    if (PERK_AT[rank]) for (const key of [s.id, ...(s.legacy || [])]) for (const row of PERKS[key] || []) if (row[0] === PERK_AT[rank]) {
      effects.push({ type: 'perk', key, name: row[1], text: row[2], fx: row[3], legacy: `perk:${key}:${row[0]}` });
    }
    const r = {
      id: ids[i], name: names[i], rank, rarity: RARITY[rank], kind: 'passive', category: `${group}.${s.id}`,
      family: s.id, reads: [s.id],
      levels: [{ at: 1, effects }],
      gates: rank === 'D' ? [{ at: 6, needs: { concept: conceptsOf(s, 'intermediate') } }] : rank === 'S' ? [{ at: 6, needs: { concept: conceptsOf(s, 'legend') } }] : [],
      acquire: rank === 'D'
        ? [{ via: 'practice', needs: { age: [4, 120] } }, { via: 'teacher', needs: { teacher: { reads: s.id, rank: 'D' } } }]
        : [{ via: 'evolve', from: ids[i - 1], needs: Object.assign(
          { concept: conceptsOf(s, { C: 'advanced', B: 'expert', A: 'master', S: 'grandmaster' }[rank]) },
          rank === 'B' || rank === 'A' ? { deed: { kind: 'proved', rank, n: 1 } } : {},
          rank === 'S' ? { deed: { kind: 'renowned_deed', n: 1 }, age: [30, 120] } : {}) }],
      evolvesTo: i < RANKS.length - 1 ? [{ id: ids[i + 1] }] : [],
      transfer: { teach: 'any', inherit: false, steal: false, sell: false, lose: [] },
      slot: false, census: 'count', spec: SPEC(),
      text: TEXT[rank](noun),
    };
    return r;
  });
  (ladders[group] = ladders[group] || []).push(...rungs);
}

const out = {
  'data/skills/families.json': {
    about: 'Skills rebuild (docs/design/skills-v2.md §2.1): the 28 families, from S1\'s data/skills.json (its skills, specialisms as focuses, kin, the 252 concepts, the legacy keys a check may name). Seeded by tools/skills2/seed-data.mjs.',
    families, sharedConcepts: S1.sharedConcepts || {}, jobSpec: S1.jobSpec || {},
  },
};
for (const g of Object.keys(ladders)) out[`data/skills/ladders/${g}.json`] = {
  about: `Skills rebuild (docs/design/skills-v2.md §9.1): the ladders of the ${g} group, D, C, B, A and the family's common S rung. Seeded by tools/skills2/seed-data.mjs; the data review renames and fills them.`,
  skills: ladders[g],
};
// one field a line inside each listed object (a skill, a family): readable in review, small in a diff
const fmtObj = (o, pad) => '{\n' + Object.entries(o).map(([k, v]) => `${pad}  ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n') + `\n${pad}}`;
const fmt = v => '{\n' + Object.entries(v).map(([k, x]) => `  ${JSON.stringify(k)}: ` + (Array.isArray(x) && x.length && typeof x[0] === 'object'
  ? '[\n' + x.map(o => '    ' + fmtObj(o, '    ')).join(',\n') + '\n  ]' : JSON.stringify(x))).join(',\n') + '\n}\n';
const check = process.argv.includes('--check');
let stale = 0;
for (const [f, v] of Object.entries(out)) {
  const p = path.join(root, f), js = fmt(v);
  if (check) { if (!fs.existsSync(p) || fs.readFileSync(p, 'utf8') !== js) { console.error('stale: ' + f); stale++; } continue; }
  fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, js);
}
if (check) { if (stale) process.exit(1); console.log('skills2 seed data up to date'); }
else console.log(`wrote ${families.length} families and ${Object.values(ladders).flat().length} rungs in ${Object.keys(ladders).length} ladder files`);
