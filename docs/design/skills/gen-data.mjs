// S1a: writes skills.json, the skill list of docs/design/skills.md as data (S1b moves it to data/skills.json).
// One row a skill: id | name | group | kind | governing stats | legacy keys folded in | specialisms (name=legacy key) |
// kin (id:weight) | concepts: Intermediate; Advanced; Expert a, b; Master a, b; Grandmaster a, b; Legend
// Twelve concept names are the old Codex's (docs/research/codex/martial-concepts.md: the measure, the feint read, the
// grounded butt, the two waves, the line that is still a line, the forearm remembers, the belt, his strength, the count
// is wrong, the ten who trust one another, the wall is a sum, the gap held); that file also gives each its "never grasped" line.
//   node docs/design/skills/gen-data.mjs
import fs from 'node:fs';
const ROWS = `
sword|Swordsmanship|Arms|motor|ins,spd|dagger,dualwield|the arming sword;the long sword;the knife=dagger;two blades=dualwield|melee:.25,spear:.1,shield:.1|the guard;the line;the measure,the bind;the tempo,the feint read;the single time,the stillness;the sword forgotten
spear|Spear, axe and mace|Arms|motor|str,ins|axe|the spear;the axe=axe;the mace and hammer;the bill and pike|melee:.25,sword:.1,bow:.05|the grip;the point's line;the measure,the grounded butt;the hook and the pull,the rank's rhythm;the long tempo,the yielding haft;the reach forgotten
shield|Shield work|Arms|motor|str,sta||the buckler;the wall;the great shield|melee:.2,unarmed:.1|the cover;the edge;the angle,the press;the gap held,the wall's breath;the shield that strikes,the weight borrowed;the door that is not there
bow|Archery|Arms|motor|str,ins|xbow,throwing|the war bow;the hunting bow;the crossbow=xbow;the javelin and sling=throwing|tracking:.1,survival:.1|the anchor;the loose;the wind,the range by eye;the moving mark,the breath between;the forearm remembers,the far cast;the mark that comes to you
melee|Footwork and close fighting|Arms|motor|ins,spd||the line;the skirmish;fighting in harness|sword:.15,spear:.15,unarmed:.15,athletics:.15,music:.1|the stance;the footing;the press,the second man;the gap,the turn of the line;the whole field in the eye,the calm;the crowd made slow
riding|Riding and the lance|Arms|motor|sta,ins|lance,mounted|the long road;the lance=lance;the fight from the saddle=mounted;breaking and schooling|husbandry:.15,melee:.1|the seat;the hands;the horse's mind,the gallop's balance;the couched point,the two waves;one body,the line that is still a line;the horse that knows
athletics|Athletics|The body|motor|sta,spd||the run;the climb;the swim|unarmed:.15,melee:.1,stealth:.1,survival:.1|the breath;the pace;the fall,the second wind;the long day,the economy;the body listened to,the pain set aside;the tirelessness
unarmed|Wrestling and fists|The body|motor|str,sta||wrestling;the fist;the tavern brawl|melee:.2,athletics:.15|the base;the belt;the measure,his strength;the lock,the weight borrowed;the touch that reads,the soft answer;the fight ended before
command|Command|War|judgement|wil,int||the company;the garrison;the host|tactics:.25,intimidation:.1,persuasion:.1|the voice;the order understood;the men's mood,the example;the reserve,the count is wrong;the army's breath,the ten who trust one another;the banner alone
tactics|Tactics and siegecraft|War|judgement|int,ins|siegecraft|the open field;siegecraft=siegecraft;the ambush and the raid|command:.25,stewardship:.1,craft:.05|the map;the ground;the flank,the supply;the reserve,the enemy's mind;the battle refused,the wall is a sum;the war in the first move
survival|Woodcraft and hunting|The land|lore|sta,int||the hunt;the snare and the forage;the hard country|tracking:.25,husbandry:.1,medicine:.1|the fire;the water;the weather read,the beast's habit;the lean season,the stand;the country as larder,the stillness;the wild at home
tracking|Tracking and scouting|The land|lore|ins,int||the trail;the watch;scouting for a host|survival:.25,stealth:.15|the sign;the age of a trail;the broken pattern,the wind;the mind of the quarry,the ground ahead;the trail unseen,the country in the head;the hunter not there
husbandry|Farming and herding|The land|motor|sta,str||the plough;the herd;horses;vine and orchard|survival:.1,stewardship:.1,riding:.1|the seasons;the soil;the beast's health,the fallow;the breeding line,the bad year stored against;the land's heart,the eye for stock;the valley made rich
sea|Seamanship|The sea|motor|sta,str||the deck;the helm;the nets;the sea fight|survival:.1,athletics:.1,trade:.05|the knots;the wind's eye;the tide,the lead and the line;the weather a day off,the ship's voice;the dead reckoning,the lee shore;the sea's temper
craft|Craft|Crafts|motor|str,int||smithing;armouring;carpentry;masonry;cloth and leather;fine work|trade:.1,stewardship:.05|the edge kept;the true line;the material's will,the jig;the temper,the hidden fault;the form that serves,the hand that stops;the work that outlasts
medicine|Medicine|Crafts|lore|int,ins||wounds and bones;fevers;herbs;midwifery|learning:.2,survival:.1|the clean hand;the pulse;the signs,the dose;the fever's course,the knife's limit;the patient and not the wound,the thing not done;the death put off
music|Music, song and dance|Crafts|motor|int,wil||the voice;the harp and strings;the dance;the long lay|persuasion:.1,etiquette:.1,melee:.05|the pitch;the time;the phrase,the room;the silence,the borrowed tune made new;the song that is yours,the listeners held;the song that stays
trade|Trade|Trade|lore|int,wil||the market;the long road;the counting house;goods judged|stewardship:.2,persuasion:.2,gambling:.05|the count;the price;the other man's need,the weight and the measure;the credit,the season ahead;the market made,the loss taken early;the name that is coin
stewardship|Stewardship and supply|Trade|lore|int,wil|logistics|the estate;the household;supply=logistics;the mint and the tax|trade:.2,learning:.1,tactics:.1|the tally;the store;the yield,the honest reeve;the lean year,the many hands;the estate as one thing,the tax that holds;the house that feeds a realm
gambling|Gaming and wagers|Trade|lore|int,ins||dice;cards and tables;the wager|intrigue:.1,trade:.1|the odds;the stake;the tell,the run that is not there;the table read,the walk away;the game behind the game,the calm;the luck made
learning|Letters and learning|Letters|lore|int,wil||the law;chronicle and history;numbers and stars;the old tongue|faith:.2,medicine:.1,diplomacy:.1|the letters;the argument;the old grammar,the source weighed;the argument from authority,the doubt;the question no one asked,the plain word;the book that will be read
faith|Faith|Faith|lore|wil,int||the rites;scripture;preaching;the care of souls|learning:.2,persuasion:.1|the prayers;the rite;the text and the gloss,the listening;the doubt borne,the sermon's turn;the silence,the care of the unlovely;the peace given
persuasion|Persuasion|Court|judgement|int,wil||the bargain;the speech;the plea|diplomacy:.2,trade:.1,intrigue:.1,etiquette:.1|the opening;the listener;the other man's want,the pause;the objection welcomed,the crowd's one mind;the plain truth told well,the word unsaid;the voice men follow
diplomacy|Diplomacy|Court|judgement|int,wil||the embassy;the treaty;the quarrel settled|persuasion:.2,etiquette:.2,intrigue:.1|the forms;the interest;the thing neither can say,the patience;the door left open,the third party;the peace both can sell,the long memory;the word that binds kings
etiquette|Courtesy|Court|judgement|int,wil||the court;the feast;courtship|diplomacy:.2,music:.1|the address;the precedence;the room read,the gift;the slight unseen,the fashion led;the ease,the rule broken rightly;the court in a glance
intimidation|Intimidation|Court|judgement|wil,str||the threat;the question put hard;the presence in arms|command:.1,persuasion:.1|the stare;the quiet;the threat unsaid,the man's fear found;the one example,the mercy that frightens;the name that goes before,the calm hand;the dread
stealth|Stealth|The shadow|motor|spd,int||the quiet road;locks and hands;the disguise|intrigue:.15,tracking:.15,athletics:.1|the quiet foot;the shadow;the waiting,the other man's eye;the plain sight,the lock's logic;the absence,the crowd as cloak;the one never there
intrigue|Intrigue and deceit|The shadow|judgement|int,ins|deception|the plot;the spy's craft;the lie=deception|stealth:.1,diplomacy:.1,persuasion:.1|the listening;the debt;the lie that is mostly true,the second purpose;the web,the long game;the hand unseen,the enemy's friend;the realm as a board
`.trim().split('\n');
const WORDS = ['intermediate', 'advanced', 'expert', 'master', 'grandmaster', 'legend'];
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const skills = ROWS.map(r => {
  const [id, name, group, kind, gov, legacy, specs, kin, conc] = r.split('|');
  const concepts = [];
  conc.split(';').forEach((cell, w) => cell.split(',').forEach(n => concepts.push({ id: slug(n.trim()), name: n.trim(), word: WORDS[w] })));
  return { id, name, group, kind, gov: gov.split(','), legacy: legacy ? legacy.split(',') : [],
    specialisms: specs.split(';').map(s => { const [n, k] = s.split('='); return k ? { id: slug(n), name: n, legacy: k } : { id: slug(n), name: n }; }),
    kin: Object.fromEntries(kin.split(',').map(x => { const [k, w] = x.split(':'); return [k, +w]; })), concepts };
});
// checks: every kin is a skill, every legacy key is claimed once, nine concepts a skill, concept ids unique within a skill
const ids = new Set(skills.map(s => s.id)), seen = new Set();
for (const s of skills) {
  for (const k in s.kin) if (!ids.has(k)) throw new Error(s.id + ' kin ' + k);
  for (const k of s.legacy) { if (seen.has(k) || ids.has(k)) throw new Error('legacy twice ' + k); seen.add(k); }
  if (s.concepts.length !== 9 || new Set(s.concepts.map(c => c.id)).size !== 9) throw new Error(s.id + ' concepts');
  for (const sp of s.specialisms) if (sp.legacy && !s.legacy.includes(sp.legacy)) throw new Error(s.id + ' specialism ' + sp.id);
}
const shared = {}; for (const s of skills) for (const c of s.concepts) (shared[c.id] = shared[c.id] || []).push(s.id);
const out = { note: 'S1a design data (docs/design/skills.md). 28 skills; the 10 legacy keys they fold are read through them.',
  groups: [...new Set(skills.map(s => s.group))], words: ['beginner', ...WORDS], skills,
  sharedConcepts: Object.fromEntries(Object.entries(shared).filter(([, v]) => v.length > 1)) };
fs.writeFileSync(new URL('./skills.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
console.log(skills.length, 'skills,', skills.reduce((a, s) => a + s.specialisms.length, 0), 'specialisms,', skills.reduce((a, s) => a + s.concepts.length, 0), 'concepts,',
  seen.size, 'legacy keys folded; shared concepts:', Object.entries(out.sharedConcepts).map(([k, v]) => k + ' (' + v.join(', ') + ')').join('; '));
