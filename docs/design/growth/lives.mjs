// G0: three worked lives under the growth standard (docs/design/growth-standard.md, §3.14).
//
//   node docs/design/growth/lives.mjs            markdown tables of levels by age, and each life's record lines
//   node docs/design/growth/lives.mjs --json     the same as data (chart.mjs reads it)
//
// Each life is a script of what the person does month by month and the few deeds that happen to them, with the reason
// written beside each. The model (model.mjs) decides what that is worth. No chance at all: these are illustrations of
// the rules, so a reader can follow every number to its cause.
import * as M from './model.mjs';

// a month of a life: { acts: [effort...], body: { stat: intensity }, cond } ; deeds: { age: [[skill, why]] }
const LIVES = {
  smith: {
    title: "Wat, a smith's apprentice (artisan's son; Craft talent B, body C)",
    p: M.person({ name: 'Wat', talent: { craft: 'B' }, statTalent: { str: 'B' } }),
    die: 71,
    skills: ['craft', 'trade', 'athletics'], stats: ['str', 'sta', 'int'],
    month(age) {
      const a = [], body = {};
      if (age < 7) { a.push({ skill: 'athletics', eu: 0.3, q: 'practice', why: 'play' }); return { acts: a, body: { sta: 0.2, spd: 0.2 } }; }
      if (age < 12) { a.push({ skill: 'craft', eu: 0.4, q: 'work', demand: 15, why: "fetching and the bellows in his father's forge" }); return { acts: a, body: { str: 0.3, sta: 0.3 } }; }
      if (age < 19) {   // apprenticed to Master Hobb (craft 76)
        a.push({ skill: 'craft', eu: 0.5, q: 'drill', teacher: 76, good: 0.5, why: 'apprenticed to Master Hobb' });
        a.push({ skill: 'craft', eu: 0.8, q: 'work', demand: 35, why: "the shop's daily work" });
        return { acts: a, body: { str: 0.9, sta: 0.7 } };
      }
      if (age < 22) {   // journeyman years, forges of three towns
        a.push({ skill: 'craft', eu: 0.8, q: 'drill', teacher: 62, teacherOnly: false, why: 'journeyman under the masters of three towns' });
        a.push({ skill: 'craft', eu: 0.6, q: 'work', demand: 45, why: 'piecework' });
        a.push({ skill: 'trade', eu: 0.2, q: 'work', demand: 25, why: 'selling on the road' });
        return { acts: a, body: { str: 1, sta: 0.8 } };
      }
      if (age < 30) {   // his own forge in a village: the work asks nothing new
        a.push({ skill: 'craft', eu: 1.0, q: 'work', demand: 45, why: 'village work: shoes, hinges, ploughshares' });
        a.push({ skill: 'trade', eu: 0.3, q: 'work', demand: 30, why: 'his own customers' });
        return { acts: a, body: { str: 0.9, sta: 0.6 } };
      }
      if (age < 47) {   // after the lord's commission: armour and blades for the castle
        a.push({ skill: 'craft', eu: 0.8, q: 'stretch', d: 70, why: "the castle's harness and blades" });
        a.push({ skill: 'craft', eu: 0.3, q: 'work', demand: 45, why: 'the village still needs its hinges' });
        a.push({ skill: 'trade', eu: 0.3, q: 'work', demand: 40, why: 'dealing with the steward' });
        return { acts: a, body: { str: 0.8, sta: 0.5 } };
      }
      if (age < 48) return { acts: [{ skill: 'trade', eu: 0.3, q: 'work', demand: 40, why: 'the shop, run from a stool' }], body: {} };   // the burned hand
      if (age < 62) {
        a.push({ skill: 'craft', eu: 0.7, q: 'stretch', d: 80, why: 'commissions from the duke' });
        a.push({ skill: 'trade', eu: 0.3, q: 'work', demand: 40, why: 'the shop' });
        return { acts: a, body: { str: 0.5, sta: 0.3 } };
      }
      a.push({ skill: 'craft', eu: 0.3, q: 'practice', why: 'teaching two apprentices at the anvil' });
      return { acts: a, body: { str: 0.2 } };
    },
    deeds: { 21: [['craft', "his journeyman's piece, judged by the guild"]], 44: [['craft', "a harness the guild names a masterwork"]] },
    hurts: { 47: ['str', 0.12, 'a burned hand'] },
  },
  knight: {
    title: "Aymer, a knight's son (noble; Swordsmanship talent A, Speed talent B)",
    p: M.person({ name: 'Aymer', talent: { sword: 'A', riding: 'B' }, statTalent: { spd: 'B', ins: 'B' } }),
    die: 63,
    skills: ['sword', 'riding', 'command'], stats: ['str', 'spd', 'ins'],
    month(age) {
      const a = [];
      if (age < 7) return { acts: [{ skill: 'riding', eu: 0.2, q: 'practice', why: 'ponies' }], body: { spd: 0.2 } };
      if (age < 14) {   // a page: the castle's master-at-arms (sword 60)
        a.push({ skill: 'sword', eu: 0.5, q: 'drill', teacher: 60, why: "a page under the master-at-arms" });
        a.push({ skill: 'riding', eu: 0.4, q: 'drill', teacher: 60, why: 'the stables' });
        return { acts: a, body: { str: 0.3, spd: 0.5, ins: 0.5 } };
      }
      if (age < 21) {   // a squire to Sir Odo (sword 75)
        a.push({ skill: 'sword', eu: 1.2, q: 'drill', teacher: 75, good: 0.5, why: 'squire to Sir Odo' });
        a.push({ skill: 'riding', eu: 0.8, q: 'drill', teacher: 70, why: "Sir Odo's horses" });
        if (age >= 17) a.push({ skill: 'sword', eu: 0.3, q: 'stretch', d: 60, why: 'tourneys of the march' });
        return { acts: a, body: { str: 1, spd: 0.8, ins: 0.8, sta: 0.8 } };
      }
      if (age < 29) {   // campaigns, and Sir Rauf, a rival who keeps beating him
        a.push({ skill: 'sword', eu: 0.6, q: 'practice', session: 0, why: 'the yard' });
        a.push({ skill: 'sword', eu: 0.5, q: 'stretch', d: age < 27 ? 72 : 60, failed: age < 26, why: age < 27 ? 'bouts with Sir Rauf, a better blade' : 'the march campaigns' });
        a.push({ skill: 'riding', eu: 0.4, q: 'work', demand: 60, why: 'a season in the saddle' });
        if (age >= 24) a.push({ skill: 'command', eu: 0.5, q: 'stretch', d: 40, why: 'a lance of twenty men' });
        return { acts: a, body: { str: 0.9, spd: 0.8, ins: 0.8, sta: 1 } };
      }
      if (age < 34) {   // garrison peace: no one here can press him
        a.push({ skill: 'sword', eu: 0.9, q: 'work', demand: 55, why: 'garrison drill with weaker men' });
        a.push({ skill: 'command', eu: 0.4, q: 'work', demand: 45, why: 'the garrison' });
        a.push({ skill: 'riding', eu: 0.3, q: 'work', demand: 50, why: 'patrols' });
        return { acts: a, body: { str: 0.6, spd: 0.5, ins: 0.5, sta: 0.5 } };
      }
      if (age < 35) return { acts: [], body: {} };   // abed with the siege wound
      if (age < 46) {   // master of the yard, and the king's wars
        a.push({ skill: 'sword', eu: 0.4, q: 'stretch', d: 74, why: "the king's champions in the yard" });
        a.push({ skill: 'command', eu: 0.6, q: 'stretch', d: 60, why: 'a banner in the field' });
        a.push({ skill: 'riding', eu: 0.3, q: 'work', demand: 60, why: 'campaigns' });
        return { acts: a, body: { str: 0.5, spd: 0.4, ins: 0.5 } };
      }
      a.push({ skill: 'sword', eu: 0.3, q: 'practice', why: 'teaching squires' });
      a.push({ skill: 'command', eu: 0.4, q: 'work', demand: 60, why: 'castellan' });
      return { acts: a, body: { str: 0.3, spd: 0.2 } };
    },
    deeds: { 26: [['sword', 'beats Sir Rauf at last, before the whole camp']] },
    hurts: { 34: ['spd', 0.1, 'a crossbow bolt in the thigh at the siege'] },
  },
  scholar: {
    title: 'Isolde, a scholar (gentry daughter; Letters talent A, Wits talent B)',
    p: M.person({ name: 'Isolde', talent: { learning: 'A', lang: 'B' }, statTalent: { int: 'B' }, memory: 1.3 }),
    die: 78,
    skills: ['learning', 'lang', 'diplomacy'], stats: ['int', 'wil'],
    month(age) {
      const a = [];
      if (age < 5) return { acts: [], body: {} };
      if (age < 8) return { acts: [{ skill: 'learning', eu: 0.4, q: 'drill', teacher: 40, why: 'letters at her mother\'s knee' }], body: { int: 0.3 } };
      if (age < 14) {
        a.push({ skill: 'learning', eu: 0.5, q: 'drill', teacher: 58, good: 0.5, why: 'a tutor, Brother Anselm' });
        a.push({ skill: 'lang', eu: 0.5, q: 'drill', teacher: 58, why: 'the old tongue with Brother Anselm' });
        return { acts: a, body: { int: 0.6, wil: 0.3 } };
      }
      if (age < 22) {   // the cathedral school
        a.push({ skill: 'learning', eu: 1.2, q: 'drill', teacher: 78, why: 'the cathedral school' });
        a.push({ skill: 'lang', eu: 0.4, q: 'drill', teacher: 70, why: 'disputation in the old tongue' });
        if (age >= 18) a.push({ skill: 'learning', eu: 0.3, q: 'stretch', d: 60, why: 'disputations at the school' });
        return { acts: a, body: { int: 0.9, wil: 0.5 } };
      }
      if (age < 30) {   // a clerk in the chancery
        a.push({ skill: 'learning', eu: 1.0, q: 'work', demand: 50, why: 'copying writs in the chancery' });
        a.push({ skill: 'learning', eu: 0.3, q: 'practice', why: 'reading at night' });
        a.push({ skill: 'diplomacy', eu: 0.3, q: 'work', demand: 30, why: 'letters to foreign courts' });
        return { acts: a, body: { int: 0.5 } };
      }
      if (age < 55) {   // the duke's library, then her own pupils and books
        a.push({ skill: 'learning', eu: 0.8, q: 'stretch', d: 82, why: "the duke's library: books no one had read in a century" });
        a.push({ skill: 'diplomacy', eu: 0.4, q: 'stretch', d: 55, why: 'embassies' });
        if (age < 40) a.push({ skill: 'lang', eu: 0.2, q: 'practice', why: 'reading the old tongue' });
        return { acts: a, body: { int: 0.7, wil: 0.4 } };
      }
      if (age < 56) return { acts: [], body: {} };   // the winter fever
      a.push({ skill: 'learning', eu: 0.5, q: 'stretch', d: 85, why: 'her great book' });
      return { acts: a, body: { int: 0.4 } };
    },
    deeds: { 58: [['learning', 'carries a disputation before the royal court, and the world has room for her']] },
    hurts: { 55: ['int', 0.05, 'a winter fever'] },
  },
};

export const SNAP = [6, 10, 14, 18, 22, 26, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75];

export function run(key) {
  const L = LIVES[key], p = structuredClone(L.p), rows = [];   // a fresh person each run
  for (let m = 0; m < L.die * 12; m++) {
    const age = m / 12, ai = Math.floor(age);
    const mo = L.month(ai);
    if (m % 12 === 0) {
      for (const [k, why] of (L.deeds[ai] || [])) M.deed(p, k, ai, why);
      const h = L.hurts[ai]; if (h) { p.hurt[h[0]] = h[1]; p.ledger.push({ age: ai, key: h[0], amt: -h[1], why: h[2] }); }
      if (h == null) for (const s in p.hurt) p.hurt[s] = Math.max(0, p.hurt[s] - 0.04);   // most of a wound mends in a few years
      M.year(p, ai);
    }
    for (const a of mo.acts) M.effort(p, a, age, 1);
    M.bodyMonth(p, age, mo.body, 1);
    if (m % 12 === 11 || m === L.die * 12 - 1) {
      const row = { age: ai + 1 };
      for (const k of L.skills) {
        const v = p.L[k] || 0, st = M.statAt(p, (k === 'craft' ? 'str' : k === 'sword' ? 'ins' : 'int'), ai + 1);
        row[k] = v; row[k + '_use'] = M.carried(v, st);
        row[k + '_held'] = p.held[k] || 0;
      }
      for (const s of L.stats) row[s] = M.statAt(p, s, ai + 1);
      rows.push(row);
    }
  }
  return { key, title: L.title, skills: L.skills, stats: L.stats, rows, ledger: p.ledger };
}

const f1 = x => (Math.round(x * 10) / 10).toFixed(1);
const STATNAME = { str: 'Strength', spd: 'Speed', sta: 'Endurance', ins: 'Reflexes', int: 'Wits', wil: 'Will' };
const SKILLNAME = { craft: 'Smithing', trade: 'Trade', athletics: 'Athletics', sword: 'Swordsmanship', riding: 'Riding', command: 'Command', learning: 'Letters', lang: 'The old tongue', diplomacy: 'Diplomacy' };
export function table(r) {
  const head = ['Age', ...r.skills.map(k => SKILLNAME[k]), ...r.stats.map(s => STATNAME[s])];
  const out = [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`];
  for (const a of SNAP) {
    const row = r.rows.find(x => x.age === a); if (!row) continue;
    const cell = k => {
      const v = row[k], u = row[k + '_use'], h = row[k + '_held'];
      if (v < 0.5) return '-';
      let s = `${M.wordOf(v)} ${Math.round(v)}`;
      if (u < v - 0.5) s += ` (works as ${Math.round(u)})`;
      if (h >= 1) s += ' *';
      return s;
    };
    out.push(`| ${a} | ${r.skills.map(cell).join(' | ')} | ${r.stats.map(s => f1(row[s])).join(' | ')} |`);
  }
  return out.join('\n');
}
// the record: the changes that a player would see as lines (words reached, plateaus, leaps, rust, wounds)
export function record(r) {
  const lines = [], word = {};
  let lastYear = {};
  for (const e of r.ledger) {
    if (/^a deed/.test(e.why)) lines.push(`${Math.floor(e.age)}: ${SKILLNAME[e.key] || e.key} leaps (+${f1(e.amt)}): ${e.why.replace('a deed: ', '')}.`);
    else if (/^unused/.test(e.why)) { if (!lastYear[e.key + 'r']) { lines.push(`${Math.round(e.age)}: ${SKILLNAME[e.key] || e.key} rusting, ${e.why}.`); lastYear[e.key + 'r'] = 1; } }
    else if (STATNAME[e.key]) lines.push(`${e.age}: ${e.why}; ${STATNAME[e.key]} set back.`);
  }
  // first age each word was reached, by skill
  for (const row of r.rows) for (const k of r.skills) { const w = M.wordOf(row[k]); if (w !== '(untried)' && word[k] !== w) { word[k] = w; lines.push(`${row.age}: ${SKILLNAME[k]} reaches ${w}.`); } }
  return lines.sort((a, b) => parseFloat(a) - parseFloat(b));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const all = Object.keys(LIVES).map(run);
  if (process.argv.includes('--json')) console.log(JSON.stringify(all.map(r => ({ key: r.key, title: r.title, skills: r.skills, stats: r.stats, rows: r.rows }))));
  else for (const r of all) { console.log(`### ${r.title}\n\n${table(r)}\n\n${record(r).map(x => '- ' + x).join('\n')}\n`); }
}
