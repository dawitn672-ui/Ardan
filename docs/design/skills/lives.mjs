// S1a: the sample lives and the spread run of docs/design/skills.md, played under model.mjs.
//   node docs/design/skills/lives.mjs            prints the lives and the spread as Markdown, writes lives.json
// Each life is a script of what the person does each month; the model decides what it is worth. Nobody's grasp is set
// by hand: the lives were picked from thirty-three names for what their seed gave them (Isolde's concepts all come
// easily, Osric will never see the feint read), and the 400 people of the spread run take what comes.
import fs from 'node:fs';
import { person, month, year, sk, levelName, wordOf, WORDS, describe, cost, value, SKILL, need, conceptsOf } from './model.mjs';

const L = { exp: 16, mas: 21, gm: 26 };   // the first level of a word
function play(p, from, to, script, lines) {
  const out = lines.map(k => ({ k, pts: [] }));
  for (let y = from; y < to; y++) {
    for (let m = 0; m < 12; m++) { const age = y + m / 12, r = script(age, (y - from) * 12 + m, p) || {}; month(p, age, r.acts || [], r.ctx || {}); }
    year(p, y + 1);
    for (const o of out) { const s = sk(p, o.k); o.pts.push({ age: y + 1, lv: s.lv, st: s.st > 0 ? 1 : 0, rust: s.rust > 0 ? 1 : 0 }); }
  }
  return out;
}
const bout = (k, s, m, every, up, why, lose) => (m % every === every - 1 ? [{ skill: k, eu: 1.5, q: 'stretch', d: s.lv + up, failed: lose, why, trigger: lose ? 'defeat' : undefined }] : []);

const LIVES = [];
const add = (name, blurb, p, from, to, script, lines) => { const out = play(p, from, to, script, lines); out.forEach((o, i) => LIVES.push({ name: lines.length > 1 ? `${name}: ${SKILL[o.k].name.split(' ')[0].replace(',', '')}` : name, blurb: Array.isArray(blurb) ? blurb[i] : blurb, skill: o.k, from, pts: o.pts, marks: p.rec.filter(r => r.k === o.k), now: describe(p, o.k, to) })); return p; };

// 1. the prodigy: born to it, concepts come easily, a grandmaster to teach her, a rival, and she never misses a month
add('Isolde, the prodigy', 'talent S, and every concept comes easily; a grandmaster teaches her',
  person({ id: 'isolde', talent: { sword: 'S' } }), 14, 45, (age, m, p) => {
    const s = sk(p, 'sword');
    return { acts: [{ skill: 'sword', eu: 1.4, q: 'drill', teacher: 27, who: 'Master Ilse', why: 'Master Ilse\'s drill' }, ...bout('sword', s, m, 4, 2, m % 8 === 3 ? 'a lost bout at the school' : 'a bout won before the school', m % 8 === 3)],
      ctx: { rival: { skill: 'sword', lv: s.lv + 1 } } };
  }, ['sword']);

// 2. the plodder: an ordinary talent and an ordinary mind, thirty years of steady work
add('Hob, the plodder', 'talent C; a sergeant, then the ranks; steady for forty years',
  person({ id: 'hob', talent: { sword: 'C' } }), 14, 60, (age, m, p) => {
    const s = sk(p, 'sword');
    if (age < 22) return { acts: [{ skill: 'sword', eu: 1, q: 'drill', teacher: 17, who: 'Sergeant Wynn', why: 'Sergeant Wynn\'s drill' }] };
    return { acts: [{ skill: 'sword', eu: 0.6, q: 'work', demand: 14, why: 'the watch' }, { skill: 'sword', eu: 1, q: 'practice', why: 'the yard, alone' }, ...bout('sword', s, m, 12, 1, Math.floor(age) % 2 ? 'a fight lost on the border' : 'a fight won on the border', Math.floor(age) % 2 === 1)] };
  }, ['sword']);

// 3. the blind spot: gifted, disciplined, well taught, and the feint read is a thing he will never see
add('Sir Osric, one blind spot', 'talent B; a master teaches him all his life; the feint read never comes',
  person({ id: 'osric', talent: { sword: 'B' } }), 14, 60, (age, m, p) => {
    const s = sk(p, 'sword');
    return { acts: [{ skill: 'sword', eu: 1.2, q: 'drill', teacher: 23, who: 'Sir Odo', why: 'Sir Odo\'s drill' }, { skill: 'sword', eu: 0.5, q: 'practice', why: 'the yard, alone' }, ...bout('sword', s, m, 6, 1, m % 12 === 5 ? 'a lost bout at a tourney' : 'a tourney bout won', m % 12 === 5)] };
  }, ['sword']);

// 4. the talented slacker: a rare gift, proud, three months of work a year
add('Corin, the slacker', 'talent A, proud; a master teaches him three months a year',
  person({ id: 'corin', talent: { sword: 'A' }, proud: true }), 14, 60, (age, m, p) => {
    const s = sk(p, 'sword');
    if (m % 12 > 2) return m % 24 === 9 ? { acts: [{ skill: 'sword', eu: 1.5, q: 'stretch', d: s.lv + 1, failed: m % 48 === 9, why: m % 48 === 9 ? 'a duel lost' : 'a duel won', trigger: m % 48 === 9 ? 'defeat' : undefined }] } : {};
    return { acts: [{ skill: 'sword', eu: 1.4, q: 'drill', teacher: 22, who: 'Master Hobb', why: 'Master Hobb\'s drill' }] };
  }, ['sword']);

// 5. the old learner: takes up letters and the sword at forty-five, at a good school
add('Godwin, from forty-five', ['talent C; begins letters at 45, at a school', 'talent C; begins the sword at 45, with the same hours'],
  person({ id: 'godwin', talent: { learning: 'C', sword: 'C' } }), 45, 75, (age, m, p) => ({
    acts: [{ skill: 'learning', eu: 1.2, q: 'drill', teacher: 22, who: 'the school', why: 'the school\'s lessons' }, { skill: 'sword', eu: 1.2, q: 'drill', teacher: 22, who: 'the master-at-arms', why: 'the master-at-arms\'s drill' },
      ...(m % 12 === 6 ? [{ skill: 'learning', eu: 1.5, q: 'stretch', d: sk(p, 'learning').lv + 1, why: 'a disputation carried' }, { skill: 'sword', eu: 1.5, q: 'stretch', d: sk(p, 'sword').lv + 1, why: 'a bout won' }] : [])],
  }), ['learning', 'sword']);

// 6. the village smith: apprenticed, then eleven years of horseshoes, then a city, a master and commissions
add('Wat, the village smith', 'talent B; a village forge to 31, then a city and a master',
  person({ id: 'wat', talent: { craft: 'B' } }), 12, 65, (age, m, p) => {
    const s = sk(p, 'craft');
    if (age < 20) return { acts: [{ skill: 'craft', eu: 1, q: 'drill', teacher: 17, who: 'Master Hobb', why: 'Master Hobb at the forge', spec: 'smithing' }, { skill: 'craft', eu: 0.6, q: 'work', demand: 12, why: 'the forge\'s work' }] };
    if (age < 31) return { acts: [{ skill: 'craft', eu: 1, q: 'work', demand: 12, why: 'horseshoes and plough-irons' }] };
    return { acts: [{ skill: 'craft', eu: 1, q: 'drill', teacher: 24, good: 1, who: 'Master Aldous', why: 'Master Aldous\'s bench' }, { skill: 'craft', eu: 0.6, q: 'work', demand: 20, why: 'the city\'s orders' },
      ...(m % 4 === 2 ? [{ skill: 'craft', eu: 1.5, q: 'stretch', d: s.lv + 1, failed: m % 16 === 6, why: m % 16 === 6 ? 'a commission sent back' : 'a commission judged good', trigger: m % 16 === 6 ? 'defeat' : undefined }] : [])],
      ctx: { fresh: age >= 31 && age < 31.05 ? ['craft'] : [] } };
  }, ['craft']);

// 7. the rival's spur: an ordinary gift, and a rival a word ahead who beats her for years
add('Aldith and her rival', 'talent B; a rival a word ahead beats her for years',
  person({ id: 'aldith', talent: { sword: 'B' } }), 15, 60, (age, m, p) => {
    const s = sk(p, 'sword'), rival = Math.min(23, 14 + Math.floor((age - 15) / 2)), lose = s.lv < rival;
    return { acts: [{ skill: 'sword', eu: 1, q: 'drill', teacher: 18, who: 'Dame Edrys', why: 'Dame Edrys\'s drill' }, { skill: 'sword', eu: 0.6, q: 'practice', why: 'the yard, alone' },
      ...(m % 12 === 8 ? [{ skill: 'sword', eu: 1.5, q: 'stretch', d: Math.min(21, s.lv + 1), why: 'a fight won on the road' }] : []),
      ...(m % 4 === 1 ? [{ skill: 'sword', eu: 1.5, q: 'stretch', d: rival, failed: lose, why: lose ? 'beaten again by Sir Rauf' : 'beats Sir Rauf before the camp', trigger: lose ? 'defeat' : 'rival' }] : [])],
      ctx: { rival: { skill: 'sword', lv: rival } } };
  }, ['sword']);

// 8. the veteran: a fine sword at thirty, a wound, twenty-two years away, and a return at fifty-two
add('Garran, the veteran', 'talent A; a wound at 30, away twenty-two years, back at 52',
  person({ id: 'garran', talent: { sword: 'A' } }), 14, 70, (age, m, p) => {
    const s = sk(p, 'sword');
    if (age >= 30 && age < 52) return {};
    return { acts: [{ skill: 'sword', eu: 1.2, q: age < 30 ? 'drill' : 'practice', teacher: age < 30 ? 22 : undefined, who: 'the order\'s master', why: age < 30 ? 'the order\'s drill' : 'the yard again' }, ...bout('sword', s, m, 6, 1, m % 12 === 5 ? 'a fight lost' : 'a fight won', m % 12 === 5)] };
  }, ['sword']);

// ---- the spread: four hundred people, the same good training, only the seed differs -----------------------------------
function spread(n, talentOf) {
  const rows = [];
  for (let i = 0; i < n; i++) {
    const p = person({ id: 'p' + i, seed: 'spread', talent: { sword: talentOf(i) } });
    let exp = null, mas = null;
    for (let y = 14; y < 64; y++) {
      for (let m = 0; m < 12; m++) {
        const s = sk(p, 'sword'), mi = (y - 14) * 12 + m;
        month(p, y + m / 12, [{ skill: 'sword', eu: 1.2, q: 'drill', teacher: 23, who: 'the master', why: 'the master\'s drill' }, { skill: 'sword', eu: 0.5, q: 'practice', why: 'the yard' }, ...bout('sword', s, mi, 6, 1, mi % 12 === 5 ? 'a bout lost' : 'a bout won', mi % 12 === 5)], {});
        if (exp == null && s.lv >= L.exp) exp = y + m / 12 - 14; if (mas == null && s.lv >= L.mas) mas = y + m / 12 - 14;
      }
      year(p, y + 1);
    }
    const s = sk(p, 'sword'), blind = [3, 4].flatMap(w => conceptsOf('sword', w)).filter(c => need(p, 'sword', c) === Infinity).map(c => c.name);
    rows.push({ exp, mas, lv: s.lv, breaks: p.rec.filter(r => r.kind === 'breakthrough').length, blind });
  }
  return rows;
}
const pct = (a, q) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(q * s.length))] : null; };
const sum = rows => { const m = rows.filter(r => r.mas != null).map(r => r.mas); return { n: rows.length, master: m.length, never: rows.length - m.length, fastest: Math.min(...m), p10: pct(m, 0.1), median: pct(m, 0.5), p90: pct(m, 0.9), slowest: Math.max(...m),
  stuckAtExpertEdge: rows.filter(r => r.lv === 20).length, breakthroughs: [0, 1, 2, 3].map(b => rows.filter(r => (b < 3 ? r.breaks === b : r.breaks >= 3)).length), end: WORDS.map((w, i) => rows.filter(r => wordOf(r.lv) === i).length) }; };
const N = 400, sameC = spread(N, () => 'C');
const LET = [['F', 0.02], ['E', 0.1], ['D', 0.3], ['C', 0.7], ['B', 0.88], ['A', 0.97], ['S', 1]];
const { unit } = await import('./model.mjs');
const born = spread(N, i => LET.find(([, c]) => unit('talent|' + i) < c)[0]);

// ---- the print --------------------------------------------------------------------------------------------------------
const f1 = x => (x == null ? 'never' : (Math.round(x * 10) / 10).toFixed(1));
console.log('## The lives\n');
for (const l of LIVES) {
  const at = a => { const q = l.pts.find(x => x.age === a); return q ? levelName(q.lv) + (q.st ? ' *' : '') + (q.rust ? ' (rusty)' : '') : ''; };
  const ages = [16, 20, 25, 30, 40, 50, 60, 70].filter(a => l.pts.some(x => x.age === a));
  console.log(`**${l.name}** (${SKILL[l.skill].name}; ${l.blurb})\n\n| ${ages.join(' | ')} |\n|${ages.map(() => '---').join('|')}|\n| ${ages.map(at).join(' | ')} |\n`);
  for (const r of l.marks.filter(r => r.kind !== 'born' && (r.kind !== 'grasp' || /Expert|Master|Grand|Legend/.test('') || true)).slice(0, 40)) console.log(`- ${r.age}: ${r.text}.`);
  console.log(`- At the end: ${l.now.level}; the bar ${l.now.bar}; ${l.now.discipline}${l.now.concepts.length ? '; ' + l.now.concepts.join(', ') : ''}.\n`);
}
console.log('## The spread: 400 people, the same training from fourteen to sixty-four\n');
for (const [name, rows] of [['all of talent C', sameC], ['talent as born', born]]) {
  const s = sum(rows);
  console.log(`**${name}:** ${s.master} of ${s.n} reach Master (${s.never} never). Years to Master: fastest ${f1(s.fastest)}, one in ten by ${f1(s.p10)}, the middle ${f1(s.median)}, nine in ten by ${f1(s.p90)}, slowest ${f1(s.slowest)}. ` +
    `${s.stuckAtExpertEdge} end at Expert V behind a concept. Breakthroughs in a life: none ${s.breakthroughs[0]}, one ${s.breakthroughs[1]}, two ${s.breakthroughs[2]}, three or more ${s.breakthroughs[3]}. End word: ${WORDS.map((w, i) => `${w} ${s.end[i]}`).filter((x, i) => s.end[i]).join(', ')}.\n`);
}
console.log('## Experience by level\n\n| Level | A check reads | Experience to the next | Months of steady drill, an ordinary adult alone |\n|---|---|---|---|');
for (let lv = 0; lv < 35; lv++) if (lv === 0 || (lv - 1) % 5 === 0 || (lv - 1) % 5 === 4) console.log(`| ${levelName(lv)} | ${Math.round(value(lv))} | ${cost(lv)} | ${f1(cost(lv) / 10)} |`);
fs.writeFileSync(new URL('./lives.json', import.meta.url), JSON.stringify({ lives: LIVES, spread: { sameC: sameC.map(r => r.mas), born: born.map(r => r.mas), sumC: sum(sameC), sumBorn: sum(born) } }) + '\n');
