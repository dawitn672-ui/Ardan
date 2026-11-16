// S1b stage 1: the skill engine (src/people/engine/skills.js) against its reference, docs/design/skills/model.mjs, and
// the design's bars (docs/design/skills.md §12.5): the cost table, value and level round-trip, need is pure, the nine
// sample lives reproduce lives.json, s1Spread, s1Prodigy, s1BlindSpot, s1Rust, s1Dynamic and s1NotLinear in the engine.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as G from '../../src/people/engine/skills.js';

const DATA = JSON.parse(fs.readFileSync(new URL('../../data/skills.json', import.meta.url), 'utf8'));
G.setData(DATA);
const { person, month, year, sk, levelName, wordOf, value, cost, totalTo, levelOfValue, need, conceptsOf, MAX_LV, describe, graspWord } = G;

test('cost table is the design doc\'s (§2.4)', () => {
  const want = { 0: 6, 1: 17, 5: 29, 6: 49, 10: 103, 11: 123, 15: 259, 16: 261, 20: 490, 21: 537, 25: 972, 26: 542, 30: 730, 31: 484 };
  for (const lv in want) assert.equal(cost(+lv), want[lv], `cost(${levelName(+lv)})`);
  assert.ok(Math.abs(totalTo(21) - 3240) <= 10, 'nothing to Master I: about 3,240 (the doc rounds; the sum of rounded steps is ' + totalTo(21) + ')');
  assert.equal(cost(MAX_LV), Infinity);
});

test('value and levelOfValue round-trip; the doc\'s check readings', () => {
  for (let lv = 0; lv <= MAX_LV; lv++) assert.equal(levelOfValue(value(lv)), lv);
  assert.deepEqual([1, 2, 3, 4, 5].map(i => Math.round(value(i))), [1, 4, 7, 9, 12]);
  assert.deepEqual([16, 17, 18, 19, 20].map(i => Math.round(value(i))), [55, 58, 62, 65, 69]);
  assert.equal(value(31), 96); assert.equal(value(35), 100);
  assert.equal(levelOfValue(54.9), 15); assert.equal(levelOfValue(0.5), 0); assert.equal(levelOfValue(100), 35);
  assert.equal(levelName(17), 'Expert II'); assert.equal(levelName(0), 'untried');
});

test('need is pure and the same across two runs', () => {
  const a = person({ id: 'x', seed: 's' }), b = person({ id: 'x', seed: 's' });
  for (const s of DATA.skills) for (const c of s.concepts) assert.equal(need(a, s.id, c), need(b, s.id, c));
  const m = person({ id: 'x', seed: 's' }); m.needMemo = new Map();
  for (const s of DATA.skills) for (const c of s.concepts) { assert.equal(need(m, s.id, c), need(a, s.id, c)); assert.equal(need(m, s.id, c), need(a, s.id, c)); }
});

// ---- the nine sample lives of docs/design/skills/lives.mjs, played under the engine --------------------------------
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
function lives() {
  const L = [];
  const add = (p, from, to, script, lines) => { for (const o of play(p, from, to, script, lines)) L.push(o.pts); };
  add(person({ id: 'isolde', talent: { sword: 'S' } }), 14, 45, (age, m, p) => { const s = sk(p, 'sword');
    return { acts: [{ skill: 'sword', eu: 1.4, q: 'drill', teacher: 27, who: 'Master Ilse', why: 'Master Ilse\'s drill' }, ...bout('sword', s, m, 4, 2, m % 8 === 3 ? 'a lost bout at the school' : 'a bout won before the school', m % 8 === 3)], ctx: { rival: { skill: 'sword', lv: s.lv + 1 } } }; }, ['sword']);
  add(person({ id: 'hob', talent: { sword: 'C' } }), 14, 60, (age, m, p) => { const s = sk(p, 'sword');
    if (age < 22) return { acts: [{ skill: 'sword', eu: 1, q: 'drill', teacher: 17, who: 'Sergeant Wynn', why: 'Sergeant Wynn\'s drill' }] };
    return { acts: [{ skill: 'sword', eu: 0.6, q: 'work', demand: 14, why: 'the watch' }, { skill: 'sword', eu: 1, q: 'practice', why: 'the yard, alone' }, ...bout('sword', s, m, 12, 1, Math.floor(age) % 2 ? 'a fight lost on the border' : 'a fight won on the border', Math.floor(age) % 2 === 1)] }; }, ['sword']);
  add(person({ id: 'osric', talent: { sword: 'B' } }), 14, 60, (age, m, p) => { const s = sk(p, 'sword');
    return { acts: [{ skill: 'sword', eu: 1.2, q: 'drill', teacher: 23, who: 'Sir Odo', why: 'Sir Odo\'s drill' }, { skill: 'sword', eu: 0.5, q: 'practice', why: 'the yard, alone' }, ...bout('sword', s, m, 6, 1, m % 12 === 5 ? 'a lost bout at a tourney' : 'a tourney bout won', m % 12 === 5)] }; }, ['sword']);
  add(person({ id: 'corin', talent: { sword: 'A' }, proud: true }), 14, 60, (age, m, p) => { const s = sk(p, 'sword');
    if (m % 12 > 2) return m % 24 === 9 ? { acts: [{ skill: 'sword', eu: 1.5, q: 'stretch', d: s.lv + 1, failed: m % 48 === 9, why: m % 48 === 9 ? 'a duel lost' : 'a duel won', trigger: m % 48 === 9 ? 'defeat' : undefined }] } : {};
    return { acts: [{ skill: 'sword', eu: 1.4, q: 'drill', teacher: 22, who: 'Master Hobb', why: 'Master Hobb\'s drill' }] }; }, ['sword']);
  add(person({ id: 'godwin', talent: { learning: 'C', sword: 'C' } }), 45, 75, (age, m, p) => ({
    acts: [{ skill: 'learning', eu: 1.2, q: 'drill', teacher: 22, who: 'the school', why: 'the school\'s lessons' }, { skill: 'sword', eu: 1.2, q: 'drill', teacher: 22, who: 'the master-at-arms', why: 'the master-at-arms\'s drill' },
      ...(m % 12 === 6 ? [{ skill: 'learning', eu: 1.5, q: 'stretch', d: sk(p, 'learning').lv + 1, why: 'a disputation carried' }, { skill: 'sword', eu: 1.5, q: 'stretch', d: sk(p, 'sword').lv + 1, why: 'a bout won' }] : [])] }), ['learning', 'sword']);
  add(person({ id: 'wat', talent: { craft: 'B' } }), 12, 65, (age, m, p) => { const s = sk(p, 'craft');
    if (age < 20) return { acts: [{ skill: 'craft', eu: 1, q: 'drill', teacher: 17, who: 'Master Hobb', why: 'Master Hobb at the forge', spec: 'smithing' }, { skill: 'craft', eu: 0.6, q: 'work', demand: 12, why: 'the forge\'s work' }] };
    if (age < 31) return { acts: [{ skill: 'craft', eu: 1, q: 'work', demand: 12, why: 'horseshoes and plough-irons' }] };
    return { acts: [{ skill: 'craft', eu: 1, q: 'drill', teacher: 24, good: 1, who: 'Master Aldous', why: 'Master Aldous\'s bench' }, { skill: 'craft', eu: 0.6, q: 'work', demand: 20, why: 'the city\'s orders' },
      ...(m % 4 === 2 ? [{ skill: 'craft', eu: 1.5, q: 'stretch', d: s.lv + 1, failed: m % 16 === 6, why: m % 16 === 6 ? 'a commission sent back' : 'a commission judged good', trigger: m % 16 === 6 ? 'defeat' : undefined }] : [])],
      ctx: { fresh: age >= 31 && age < 31.05 ? ['craft'] : [] } }; }, ['craft']);
  add(person({ id: 'aldith', talent: { sword: 'B' } }), 15, 60, (age, m, p) => { const s = sk(p, 'sword'), rival = Math.min(23, 14 + Math.floor((age - 15) / 2)), lose = s.lv < rival;
    return { acts: [{ skill: 'sword', eu: 1, q: 'drill', teacher: 18, who: 'Dame Edrys', why: 'Dame Edrys\'s drill' }, { skill: 'sword', eu: 0.6, q: 'practice', why: 'the yard, alone' },
      ...(m % 12 === 8 ? [{ skill: 'sword', eu: 1.5, q: 'stretch', d: Math.min(21, s.lv + 1), why: 'a fight won on the road' }] : []),
      ...(m % 4 === 1 ? [{ skill: 'sword', eu: 1.5, q: 'stretch', d: rival, failed: lose, why: lose ? 'beaten again by Sir Rauf' : 'beats Sir Rauf before the camp', trigger: lose ? 'defeat' : 'rival' }] : [])],
      ctx: { rival: { skill: 'sword', lv: rival } } }; }, ['sword']);
  add(person({ id: 'garran', talent: { sword: 'A' } }), 14, 70, (age, m, p) => { const s = sk(p, 'sword');
    if (age >= 30 && age < 52) return {};
    return { acts: [{ skill: 'sword', eu: 1.2, q: age < 30 ? 'drill' : 'practice', teacher: age < 30 ? 22 : undefined, who: 'the order\'s master', why: age < 30 ? 'the order\'s drill' : 'the yard again' }, ...bout('sword', s, m, 6, 1, m % 12 === 5 ? 'a fight lost' : 'a fight won', m % 12 === 5)] }; }, ['sword']);
  return L;
}
test('the nine sample lives reproduce docs/design/skills/lives.json', () => {
  const ref = JSON.parse(fs.readFileSync(new URL('../../docs/design/skills/lives.json', import.meta.url), 'utf8'));
  const got = lives();
  assert.equal(got.length, ref.lives.length);
  ref.lives.forEach((l, i) => assert.deepEqual(got[i], l.pts, l.name));
});

// ---- s1Spread: 400 people of talent C, the same good training ------------------------------------------------------
function spread(n, talentOf, seed = 'spread') {
  const rows = [];
  for (let i = 0; i < n; i++) {
    const p = person({ id: 'p' + i, seed, talent: { sword: talentOf(i) } });
    let mas = null; const path = [];
    for (let y = 14; y < 64; y++) {
      for (let m = 0; m < 12; m++) {
        const s = sk(p, 'sword'), mi = (y - 14) * 12 + m;
        month(p, y + m / 12, [{ skill: 'sword', eu: 1.2, q: 'drill', teacher: 23, who: 'the master', why: 'the master\'s drill' }, { skill: 'sword', eu: 0.5, q: 'practice', why: 'the yard' }, ...bout('sword', s, mi, 6, 1, mi % 12 === 5 ? 'a bout lost' : 'a bout won', mi % 12 === 5)], {});
        if (mas == null && s.lv >= 21) mas = y + m / 12 - 14;
      }
      year(p, y + 1); path.push(sk(p, 'sword').lv);
    }
    rows.push({ mas, path: path.join(','), breaks: p.rec.filter(r => r.kind === 'breakthrough').length });
  }
  return rows;
}
test('s1Spread: the same training, very different lives', () => {
  const rows = spread(400, () => 'C');
  const m = rows.filter(r => r.mas != null).map(r => r.mas).sort((a, b) => a - b);
  const never = rows.length - m.length;
  assert.ok(m[0] < 10, `fastest ${m[0]}`);
  const p90 = [...rows.map(r => (r.mas == null ? Infinity : r.mas))].sort((a, b) => a - b)[Math.floor(0.9 * rows.length)];
  assert.ok(p90 > 20, `90th centile ${p90}`);
  assert.ok(never >= 0.08 * 400 && never <= 0.25 * 400, `never ${never} of 400`);
  for (let i = 1; i < rows.length; i++) assert.notEqual(rows[i].path, rows[i - 1].path, `seeds ${i - 1} and ${i} share a path`);
  // a third with no breakthrough, a third one, a third more (roughly)
  const b0 = rows.filter(r => r.breaks === 0).length;
  assert.ok(b0 > 40 && b0 < 300, `no breakthroughs ${b0}`);
});

test('s1Prodigy: talent S, easy concepts and a Grandmaster\'s drill reach Master in 4 to 7 years', () => {
  const easy = {}; for (const c of DATA.skills.find(s => s.id === 'sword').concepts) easy[c.id] = 'easy';
  const p = person({ id: 'prodigy', talent: { sword: 'S' }, grasp: easy });
  let at = null;
  for (let mi = 0; mi < 12 * 12 && at == null; mi++) {
    const s = sk(p, 'sword');
    month(p, 14 + mi / 12, [{ skill: 'sword', eu: 1.4, q: 'drill', teacher: 27, who: 'Master Ilse', why: 'Master Ilse\'s drill' }, ...bout('sword', s, mi, 4, 2, 'a bout won', false)], {});
    if (s.lv >= 21) at = mi / 12;
  }
  assert.ok(at != null && at >= 4 && at <= 7, `Master after ${at} years`);
});

test('s1BlindSpot: forty years of the best training stop at step V; the page says it does not come; a forced moment breaks it', () => {
  const sword = DATA.skills.find(s => s.id === 'sword'), measure = sword.concepts.find(c => c.id === 'the-measure');
  const grasp = {}; for (const c of sword.concepts) grasp[c.id] = 'easy'; grasp[measure.id] = 'blind';
  const p = person({ id: 'blind', talent: { sword: 'B' }, grasp });
  for (let mi = 0; mi < 40 * 12; mi++) {
    const s = sk(p, 'sword');
    // no defeats, so no breakthrough moment: only the work (a blind spot breaks rarely even then)
    month(p, 14 + mi / 12, [{ skill: 'sword', eu: 1.2, q: 'drill', teacher: 27, holds: false, who: 'the master', why: 'the drill' }, ...bout('sword', s, mi, 6, 1, 'a bout won', false)], {});
    if (mi % 12 === 11) year(p, 15 + Math.floor(mi / 12));
  }
  const s = sk(p, 'sword');
  assert.equal(s.lv, 15, `stops at Advanced V, not ${levelName(s.lv)}`);
  assert.ok(s.st > 0, 'experience is stored at the edge');
  const d = describe(p, 'sword', 54);
  assert.ok(d.concepts.some(x => x === 'the measure: it does not come'), d.concepts.join('; '));
  assert.equal(graspWord(0, Infinity, 2), 'dark');
  // a forced moment (a card with sure: true) still breaks it, and what was stored lands
  month(p, 54.1, [{ skill: 'sword', eu: 1, q: 'stretch', d: 16, why: 'the old master\'s blow', trigger: 'sure' }], {});
  assert.ok(sk(p, 'sword').got[measure.id] != null, 'grasped');
  assert.ok(sk(p, 'sword').lv > 15, 'over the edge at last');
  assert.ok(p.rec.some(r => r.kind === 'breakthrough' && /the old master/.test(r.text)), 'the breakthrough names its moment');
});

test('s1Rust: an Expert skill unused through its grace is unchanged, then falls, never more than a word or 15 points, and returns x5', () => {
  const p = person({ id: 'rust', talent: { sword: 'C' } });
  const s = sk(p, 'sword'); s.lv = 18; s.best = 18; s.used = 30; s.xp = 0;   // Expert III, a motor skill: 8 x 1.5 = 12 years of grace
  const v0 = G.reads(p, 'sword');
  for (let a = 31; a <= 42; a++) year(p, a);
  assert.equal(G.reads(p, 'sword'), v0, 'unchanged through the grace');
  for (let a = 43; a <= 80; a++) year(p, a);
  const v1 = G.reads(p, 'sword');
  assert.ok(v1 < v0, 'falls after');
  assert.ok(v0 - v1 <= 15 + 1e-9, `never more than 15 points (${v0 - v1})`);
  assert.ok(v1 >= G.EDGE[2] - 1e-9, 'never more than one word down');
  assert.ok(p.rec.some(r => r.kind === 'rust'));
  // coming back: one month of practice returns five times what the same experience would earn
  const rust0 = s.rust, L = G.reads(p, 'sword');
  month(p, 80.1, [{ skill: 'sword', eu: 1, q: 'practice', why: 'the yard again' }], {});
  const x = 10 * 1 * 0.8 * G.learnAge('sword', 80.1) * 0.9;   // fitful
  assert.ok(Math.abs((rust0 - s.rust) - Math.min(rust0, x / 10 * 1.8 * Math.exp(-L / 21.6) * 5)) < 1e-9);
});

// ---- s1Dynamic: one factor at a time ---------------------------------------------------------------------------------
function oneMonth(setup, act, ctx = {}) {
  const p = person({ id: 'dyn', talent: { sword: 'C', melee: 'C' } });
  const s = sk(p, 'sword'); s.lv = 8; s.best = 8; s.streak = 10; s.used = 25;
  if (setup) setup(p, s);
  month(p, 25, [Object.assign({ skill: 'sword', eu: 1, q: 'practice', why: 'the yard' }, act)].concat(ctx.more || []), ctx);
  return p.ledger.find(l => l.k === 'sword' && !l.tags.includes('lost'));
}
test('s1Dynamic: each factor moves experience by its stated amount and writes its tag', () => {
  const base = oneMonth().xp;
  const cases = [
    ['streak', (p, s) => { s.streak = 30; }, {}, {}, 1.1, 'disciplined'],
    ['fitful', (p, s) => { s.streak = 2; }, {}, {}, 0.9, 'fitful'],
    ['rival ahead', null, {}, { rival: { skill: 'sword', lv: 20 } }, 1.25, 'a rival ahead'],
    ['rival', null, {}, { rival: { skill: 'sword', lv: 9 } }, 1.15, 'a rival'],
    ['new land', null, {}, { fresh: ['sword'] }, 1.1, 'a new place'],
    ['rest', null, {}, { needs: { rest: 20 } }, 0.8, 'short of rest'],
    ['purpose', null, {}, { needs: { purpose: 80 } }, 1.08, 'a purpose'],
    ['no purpose', null, {}, { needs: { purpose: 10 } }, 0.85, 'no purpose'],
    ['hours shared', null, {}, { more: [{ skill: 'melee', eu: 1, q: 'practice', why: 'footwork' }] }, 0.85, 'hours shared'],
    ['specialism', (p, s) => { s.sp = ['the-long-sword']; }, { spec: 'the-knife' }, {}, 0.85, 'outside your specialism'],
  ];
  for (const [name, setup, act, ctx, f, tag] of cases) {
    const l = oneMonth(setup, act, ctx);
    assert.ok(Math.abs(l.xp / base - f) < 0.01, `${name}: x${(l.xp / base).toFixed(3)} for ${f}`);
    assert.ok(l.tags.includes(tag), `${name}: tag ${tag} in ${l.tags}`);
  }
  // kin: Swordsmanship carries a quarter to Footwork when Footwork is held and lower
  const p = person({ id: 'kin' }); const s = sk(p, 'sword'); s.lv = 10; s.streak = 10; const f = sk(p, 'melee'); f.lv = 4; f.xp = 0;
  month(p, 25, [{ skill: 'sword', eu: 1, q: 'practice', why: 'the yard' }], {});
  const own = p.ledger.find(l => l.k === 'sword').xp, kin = p.ledger.find(l => l.k === 'melee');
  assert.ok(kin && kin.tags.includes('kin') && Math.abs(kin.xp / own - 0.25) < 0.01, 'kin spill a quarter');
  // insight: a teacher who holds the concept raises the month's chance by 1.6 (seen in the breakthrough of a master's word)
  assert.equal(G.INSIGHT.teacherHolds, 1.6);
});

test('s1NotLinear: a Beginner\'s month is worth twenty of a Master\'s; steps a year fall from Intermediate to Expert', () => {
  const at = lv => { const p = person({ id: 'nl' }); const s = sk(p, 'sword'); s.lv = lv; s.streak = 10; month(p, 25, [{ skill: 'sword', eu: 1, q: 'drill', why: 'drill' }], {}); return p.ledger[0].xp / cost(lv); };
  // the same month buys this share of a step: at Beginner III against Master III
  assert.ok(at(3) / at(23) >= 20, `${(at(3) / at(23)).toFixed(1)} to 1`);
  // steps a year: one ordinary person, the same drill, while Intermediate against while Expert
  const easy = {}; for (const c of DATA.skills.find(s => s.id === 'sword').concepts) easy[c.id] = 'easy';
  const p = person({ id: 'nl2', grasp: easy }); const byWord = {};
  for (let mi = 0; mi < 50 * 12; mi++) {
    const s = sk(p, 'sword'), w0 = wordOf(s.lv), lv0 = s.lv;
    month(p, 16 + mi / 12, [{ skill: 'sword', eu: 1.2, q: 'drill', teacher: 27, who: 'm', why: 'drill' }, ...bout('sword', s, mi, 6, 1, 'a bout won', false)], {});
    const b = byWord[w0] || (byWord[w0] = { months: 0, steps: 0 }); b.months++; b.steps += s.lv - lv0;
  }
  const rate = w => byWord[w].steps / byWord[w].months * 12;
  assert.ok(rate(1) / rate(3) >= 3, `Intermediate ${rate(1).toFixed(2)} a year, Expert ${rate(3).toFixed(2)}`);
});

test('the closed form for other people: graspedBy is pure; npcGain stops at an edge whose concepts have not come', () => {
  const p = person({ id: 'npc1', seed: 'w' });
  const c = conceptsOf('sword', 3)[0];
  assert.equal(G.graspedBy(p, 'sword', c, 10), G.graspedBy(p, 'sword', c, 10));
  const r = G.npcGain(p, 'sword', 15, 0, 5000, 0, false);
  assert.equal(r.lv, 15, 'no years of work: the Expert concepts have not come');
  const r2 = G.npcGain(p, 'sword', 15, 0, 300, 200, false);
  assert.ok(r2.lv >= 15);
});
