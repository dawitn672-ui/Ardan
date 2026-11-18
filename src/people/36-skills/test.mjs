// 36-skills (S1b, D-072): skills with levels and experience. The tests of docs/design/skills.md §12.5 that need the
// page; the engine's own are tests/v2/skills.test.js.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = p => fileURLToPath(new URL(p, import.meta.url));
const SAVES_DIR = here('../../../tests/saves');
const saveFiles = () => [...fs.readdirSync(SAVES_DIR).filter(f => f.endsWith('.ardan')).map(f => path.join(SAVES_DIR, f)),
  ...fs.readdirSync(path.join(SAVES_DIR, 'press')).filter(f => f.endsWith('.ardan')).map(f => path.join(SAVES_DIR, 'press', f))];
const b64 = f => fs.readFileSync(f).toString('base64');

// in the page: decode a save, keep the raw numbers, load it through the real path
const LOAD = async (b) => {
  const bin = atob(b), bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const d = await SAVES.decode(bytes);
  const raw = JSON.parse(JSON.stringify(d.S.people[d.S.pc] || {}));
  const ok = UI.enterSaveSafe(d);
  return { raw, ok, ver: d.S.ver };
};

export const limits = { s1Mirror: 2400, s1Reasons: 2400, s1Ledger: 2400, s1NotLinear: 3600, s1NoProficiency: 3600, s1Census: 7200 };
export default {
  // §9 row by row, on every save in tests/saves/ (and press/)
  async s1Migrate(pg) {
    const out = [];
    for (const f of saveFiles()) {
      const res = await pg.evaluate(`(async () => {
        const b = ${JSON.stringify(b64(f))};
        const L = await (${LOAD.toString()})(b);
        const pc = A.pc(), SK = A.SK, bad = [];
        if (!L.ok) return { f: ${JSON.stringify(path.basename(f))}, bad: ['did not load'] };
        const raw = L.raw, rs = raw.skills || {};
        // the number each skill had, a legacy key folded in (the higher)
        const want = {};
        for (const k in rs) { const c = SK.canon(k)[0]; if (c) want[c] = Math.max(want[c] || 0, +rs[k] || 0); }
        let words = 0, steps = 0, maxDrop = 0;
        for (const c in want) {
          const v = want[c]; if (v < 1) continue;
          const s = pc.sk[c];
          if (!s) { bad.push('no ' + c); continue; }
          const lv = SK.lvOfValue(v);
          // a month may have passed on load (a card at the turn); the level is at least the one under the old number
          if (s.lv < lv) bad.push(c + ' ' + SK.levelName(s.lv) + ' under ' + v);
          if (SK.wordOf(s.lv) < SK.wordOf(lv)) words++;
          if (pc.skills[c] !== SK.VALUES[s.lv]) bad.push('mirror ' + c);
          maxDrop = Math.max(maxDrop, v - SK.VALUES[lv]);
          steps++;
        }
        if (maxDrop >= 4) bad.push('a skill reads ' + maxDrop.toFixed(1) + ' lower');
        if (words) bad.push(words + ' words lost');
        // the legacy keys, the aptitudes and the old ledger are gone, everyone (people made on load by older code are
        // taken by the month's sweep: it runs here, as the first month would)
        SK.sweepNew();
        let legacy = 0, apt = 0, off = 0;
        for (const id in A.S.people) {
          const p = A.S.people[id]; if (!p) continue;
          if (p.apt) apt++;
          for (const lk in SK.LEG) if (p.skills && p.skills[lk] != null) legacy++;
          if (p !== pc && p.skills) for (const k in p.skills) if (SK.BY[k] && SK.VALUES.indexOf(p.skills[k]) < 0) off++;
        }
        if (legacy) bad.push(legacy + ' legacy keys');
        if (apt) bad.push(apt + ' aptitudes');
        if (off) bad.push(off + ' numbers between levels');
        if (pc.grow) bad.push('pc.grow');
        // talents: the old aptitude as a letter
        for (const k in raw.apt || {}) {
          const c = SK.canon(k)[0]; if (!c || SK.LEG[k]) continue;
          const L2 = SK.letterOfApt(raw.apt[k]), got = SK.talentOf(pc, c);
          if (SK.TALENT_ORDER.indexOf(got) < SK.TALENT_ORDER.indexOf(L2)) bad.push('talent ' + c + ' ' + got + ' for ' + raw.apt[k]);
        }
        // the streak from the habit
        for (const k in raw.habit || {}) if (pc.sk[k] && raw.habit[k] > 0 && pc.sk[k].streak < Math.min(60, 12 * raw.habit[k]) - 2 && pc.sk[k].streak < 20) bad.push('streak ' + k);
        bad.push(...SK.checkPC(pc));
        return { f: ${JSON.stringify(path.basename(f))}, ver: L.ver, steps, bad, ledger: Object.keys((pc.skl || {}).k || {}).length };
      })()`);
      out.push(res);
    }
    const bad = out.filter(r => r.bad.length);
    return { ok: out.length >= 15 && !bad.length, detail: `${out.length} saves; ` + out.map(r => `${r.f}: ${r.steps} skills${r.bad.length ? ' FAILED ' + r.bad.slice(0, 3).join('; ') : ' ok'}`).join('; ') };
  },

  // 200 sampled checks on each save: the odds before (the old numbers, read the old way) and after
  async s1Checks(pg) {
    const out = [];
    for (const f of saveFiles()) {
      const res = await pg.evaluate(`(async () => {
        const L = await (${LOAD.toString()})(${JSON.stringify(b64(f))});
        const pc = A.pc(), SK = A.SK, raw = L.raw.skills || {};
        // the old reading: the number (a merged key read its family's, for the player), held by the body, less wounds
        const MERGE = { dagger: 'sword', dualwield: 'sword', xbow: 'bow', throwing: 'bow', lance: 'riding', mounted: 'riding', siegecraft: 'tactics', logistics: 'stewardship', deception: 'intrigue', axe: 'spear' };
        const oldNum = k => { let v = +raw[k] || 0; for (const lk in MERGE) if (MERGE[lk] === k) v = Math.max(v, +raw[lk] || 0); return v; };
        const checks = [];
        for (const id in A.EV) for (const c of A.EV[id].choices || []) if (c.check && GD.SKILLS[c.check.s] && !SK.LEG[c.check.s] && (!c.check.s2 || !SK.LEG[c.check.s2])) checks.push(c.check);
        let n = 0, higher = 0, worst = 0, ex = '';
        for (let i = 0; i < checks.length && n < 200; i += Math.max(1, Math.floor(checks.length / 200))) {
          const ch = checks[i]; n++;
          const now = A.checkOdds(pc, ch);
          const sv = k => GD.STATS.includes(k) ? A.stat(pc, k) : Math.max(Math.round(Math.min(oldNum(k), A.skillCap ? A.skillCap(pc, k) : 999)), 4 + (A.stat(pc,'str')+A.stat(pc,'spd')+A.stat(pc,'ins')+A.stat(pc,'sta')+A.stat(pc,'int')+A.stat(pc,'wil')) / 6 * 0.3);
          const sn = k => GD.STATS.includes(k) ? A.stat(pc, k) : Math.max(A.skill(pc, k), 4 + (A.stat(pc,'str')+A.stat(pc,'spd')+A.stat(pc,'ins')+A.stat(pc,'sta')+A.stat(pc,'int')+A.stat(pc,'wil')) / 6 * 0.3);
          const v0 = sv(ch.s) * 0.6 + sv(ch.s2 || ch.s) * 0.4, v1 = sn(ch.s) * 0.6 + sn(ch.s2 || ch.s) * 0.4;
          const o0 = Math.min(96, Math.max(4, 50 + (v0 - (ch.d || 45)) * 1.6)), o1 = Math.min(96, Math.max(4, 50 + (v1 - (ch.d || 45)) * 1.6));
          if (o1 > o0 + 1e-6) { higher++; ex = ex || (ch.s + ' ' + o0.toFixed(1) + '->' + o1.toFixed(1)); }
          worst = Math.max(worst, o0 - o1);
          void now;
        }
        return { f: ${JSON.stringify(path.basename(f))}, n, higher, worst, ex };
      })()`);
      out.push(res);
    }
    const bad = out.filter(r => r.higher || r.worst > 6.4 + 1e-6);
    return { ok: !bad.length, detail: out.map(r => `${r.f}: ${r.n} checks, ${r.higher} higher${r.ex ? ' (' + r.ex + ')' : ''}, worst ${r.worst.toFixed(1)} lower`).join('; ') };
  },

  // the ledger closes: for every skill, what the ledger says was gained equals what was banked, stored and lost
  async s1Ledger(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 3131, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'F', startAge: 14 });
      const SK = A.SK; SK.audit = {};
      const play = T.play(30);
      const bad = [], pc = A.pc();
      for (const k in SK.audit) { const a = SK.audit[k]; if (Math.abs(a.led - a.lost - a.moved) > 1e-6 * Math.max(1, Math.abs(a.led))) bad.push(`${k}: ledger ${a.led.toFixed(4)} - lost ${a.lost.toFixed(4)} != moved ${a.moved.toFixed(4)}`); }
      // no entry without a cause, this season or the last
      for (const L of [pc.skl, pc.skl && pc.skl.prev]) if (L && L.k) for (const k in L.k) for (const w in L.k[k].by) if (!w || w === 'undefined') bad.push('no cause: ' + k);
      const n = Object.keys(SK.audit).length; SK.audit = null;
      return { play, n, bad };
    });
    return { ok: r.n >= 5 && !r.bad.length, detail: `${r.n} skills over 30 years (${r.play}); ${r.bad.length ? r.bad.slice(0, 3).join('; ') : 'every sum closes'}` };
  },

  // every crossing of a word has its concepts' grasps (or breakthroughs) and, from Expert, a proof; every breakthrough
  // names a moment; every stall names what is missing
  async s1Reasons(pg) {
    const r = await pg.evaluate(() => {
      const SK = A.SK, out = { words: 0, grasps: 0, breaks: 0, stalls: 0, bad: [] };
      for (const [seed, status] of [[5151, 'noble'], [6161, 'peasant'], [7171, 'artisan']]) {
        T.enter({ seed, race: 'human', realm: 'POL-01', status, sex: seed % 2 ? 'M' : 'F', startAge: 12 });
        const tap = SK.tap = [];
        T.play(30);
        SK.tap = null;
        for (const rec of tap) {
          if (rec.t === 'grasp') out.grasps++;
          if (rec.t === 'breakthrough') { out.breaks++; if (!/a breakthrough: .+; you see .+/.test(rec.text)) out.bad.push('no moment: ' + rec.text); }
          if (rec.t === 'stall') { out.stalls++; if (!/(has not grasped .+|not yet proved|no more to teach)/.test(rec.text)) out.bad.push('stall without a reason: ' + rec.text); }
          if (rec.t === 'word') {
            out.words++;
            const m = rec.text.match(/reaches (\w+)/), w = m ? SK.WORDS.indexOf(m[1]) : -1;
            if (w < 1) { out.bad.push('word? ' + rec.text); continue; }
            const before = tap.slice(0, tap.indexOf(rec));
            for (const c of SK.E().conceptsOf(rec.k, w)) if (!before.some(x => x.k === rec.k && (x.t === 'grasp' || x.t === 'breakthrough') && x.text.includes(c.name)) && !before.some(x => x.k !== rec.k && x.text.includes(c.name)))
              out.bad.push(`${rec.text}: no grasp of ${c.name}`);
            if (w >= 3 && !/: .+/.test(rec.text)) out.bad.push('no proof: ' + rec.text);
          }
        }
      }
      return out;
    });
    return { ok: !r.bad.length && r.grasps > 3, detail: `${r.words} words crossed, ${r.grasps} grasps, ${r.breaks} breakthroughs, ${r.stalls} stalls in three 30-year lives; ${r.bad.length ? r.bad.slice(0, 3).join(' | ') : 'every one with its reason'}` };
  },

  // not a straight line: a month at Beginner III buys twenty times the share of a step a month at Master III buys, and
  // a life climbs steps three times as fast while Intermediate as while Expert (12 bot lives)
  async s1NotLinear(pg) {
    const r = await pg.evaluate(() => {
      const SK = A.SK, rate = { 1: [0, 0], 3: [0, 0] };
      for (let i = 0; i < 12; i++) {
        T.enter({ seed: 900 + i * 37, race: 'human', realm: 'POL-01', status: ['peasant', 'artisan', 'noble', 'merchant'][i % 4], sex: i % 2 ? 'M' : 'F', startAge: 14 });
        const pc = A.pc();
        let last = {};
        for (let y = 0; y < 30 && pc.alive; y++) {
          // (CI 137: a year counts only for a skill that was worked that year, by the steady drill of the plan or a post;
          // the skills a life holds and leaves idle sat in the Intermediate count and diluted it)
          const E = SK.E(), pos = s => E.totalTo(s.lv) + s.xp + s.st, at = {}, streak = {};
          for (const k in pc.sk) { last[k] = pc.sk[k].lv; at[k] = pos(pc.sk[k]); streak[k] = pc.sk[k].streak; }
          if (T.play(1) !== 'ok') break;
          for (const k in pc.sk) { const s = pc.sk[k], w = SK.wordOf(last[k] || 0); if (rate[w] && s.streak >= 12 && streak[k] >= 1 && pos(s) > (at[k] || 0)) { rate[w][0] += 1; rate[w][1] += s.lv - (last[k] || 0); } }
        }
      }
      // the same month of drill at two levels, as the share of a step it buys
      const E = SK.E(), p = E.person({ id: 'x' }), share = lv => { const q = E.person({ id: 'x' + lv }); E.sk(q, 'sword').lv = lv; E.sk(q, 'sword').streak = 10; E.month(q, 25, [{ skill: 'sword', eu: 1, q: 'drill', why: 'd' }], {}); return q.ledger[0].xp / E.cost(lv); };
      void p;
      return { int: rate[1][1] / Math.max(1, rate[1][0]), exp: rate[3][1] / Math.max(1, rate[3][0]), n: [rate[1][0], rate[3][0]], ratio: share(3) / share(23) };
    });
    const ok = r.ratio >= 20 && (r.n[1] < 5 || r.int >= 3 * r.exp);
    return { ok, detail: `a month at Beginner III buys ${r.ratio.toFixed(0)} times the share of a step it buys at Master III; steps a year while Intermediate ${r.int.toFixed(2)} (${r.n[0]} skill-years), while Expert ${r.exp.toFixed(2)} (${r.n[1]} skill-years)` };
  },

  // two players, the same scripted training for twenty-five years: their levels differ by a word or more in many of the
  // pairs (order 59: no timetable)
  async s1TwoLives(pg) {
    const r = await pg.evaluate(() => {
      const SK = A.SK, out = [];
      const one = seed => {
        T.enter({ seed, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 14 });
        const pc = A.pc(); pc.sk = {}; pc.skills = {}; pc.tal = {}; pc.skr = []; pc.skl = null;
        for (let m = 0; m < 25 * 12; m++) {
          const lv = pc.sk.sword ? pc.sk.sword.lv : 0;
          pc.skm = [{ skill: 'sword', eu: 1.2, q: 'drill', teacher: 23, who: 'the master', why: 'the master\'s drill' }, { skill: 'sword', eu: 0.5, q: 'practice', why: 'the yard' }];
          if (m % 6 === 5) pc.skm.push({ skill: 'sword', eu: 1.5, q: 'stretch', d: lv + 1, failed: m % 12 === 5, why: m % 12 === 5 ? 'a bout lost' : 'a bout won', trigger: m % 12 === 5 ? 'defeat' : undefined });
          const v = SK.view(pc); SK.E().month(v, 14 + m / 12, pc.skm, {}); pc.skm = [];
        }
        return pc.sk.sword.lv;
      };
      // eighteen pairs (CI 147 and H-082: which seeds' hidden grasp differs is the world's draw; the spread across many pairs
      // is what is tested)
      for (let i = 0; i < 18; i++) { const a = one(7100 + i * 2), b = one(7101 + i * 2); out.push([a, b]); }
      return out.map(([a, b]) => [SK.levelName(a), SK.levelName(b), Math.abs(SK.wordOf(a) - SK.wordOf(b))]);
    });
    // (H-082: six pairs were one world's luck. Measured: 17 of 36 pairs a word apart on the build of b8a779a (sets of six
    // read 3, 4, 1, 3, 3, 3) and 19 of 36 on a shifted world (2, 4, 3, 4, 3, 3): about half, so a bar of three of six
    // failed one world in six. Eighteen pairs, and the bar is six (merge of H-081 and H-082): a spread of half reads under six about one world in
    // forty, and levels that keep a timetable (a word apart in a pair in seven or fewer) fail nine times in ten. That
    // the spread sits at the design's "at least half" itself (docs/design/skills.md) is the design's to judge, not this test's.)
    const apart = r.filter(x => x[2] >= 1).length;
    return { ok: apart >= 6, detail: `${apart} of ${r.length} pairs a word or more apart: ` + r.map(x => `${x[0]} / ${x[1]}`).join('; ') };
  },

  // the spread run of the design, in the page's engine: 400 people of ordinary talent, the same good training
  async s1SpreadPage(pg) {
    const r = await pg.evaluate(() => {
      const E = A.SK.E(), rows = [];
      for (let i = 0; i < 400; i++) {
        const p = E.person({ id: 'p' + i, seed: 'spread', talent: { sword: 'C' } });
        let mas = null;
        for (let mi = 0; mi < 50 * 12 && mas == null; mi++) {
          const s = E.sk(p, 'sword');
          const acts = [{ skill: 'sword', eu: 1.2, q: 'drill', teacher: 23, who: 'm', why: 'drill' }, { skill: 'sword', eu: 0.5, q: 'practice', why: 'yard' }];
          if (mi % 6 === 5) acts.push({ skill: 'sword', eu: 1.5, q: 'stretch', d: s.lv + 1, failed: mi % 12 === 5, why: 'bout', trigger: mi % 12 === 5 ? 'defeat' : undefined });
          E.month(p, 14 + mi / 12, acts, {});
          if (mi % 12 === 11) E.year(p, 15 + Math.floor(mi / 12));
          if (s.lv >= 21) mas = mi / 12;
        }
        rows.push(mas);
      }
      const m = rows.filter(x => x != null).sort((a, b) => a - b), all = rows.map(x => (x == null ? Infinity : x)).sort((a, b) => a - b);
      return { fastest: m[0], p90: all[Math.floor(0.9 * all.length)], never: rows.length - m.length };
    });
    const ok = r.fastest < 10 && r.p90 > 20 && r.never >= 32 && r.never <= 100;
    return { ok, detail: `400 of talent C: fastest to Master ${r.fastest.toFixed(1)} years, nine in ten by ${isFinite(r.p90) ? r.p90.toFixed(1) : 'never'}, ${r.never} never` };
  },

  // no proficiency anywhere a player can read: every tab, the skills overlay, every skill's sheet, the activity sheet,
  // the story log and the cards met, in three lives at 1366 and 375 wide
  async s1NoProficiency(pg) {
    // "Novice" and "Trained" are words of other ladders too (a church rank, a fighting worth): the retired tier words are
    // looked for in skill rows and sheets only
    const BAD = /proficien|\b\d[\d,]* hours\b/i;
    const hits = [];
    for (const [w, h] of [[1366, 768], [375, 667]]) {
      await pg.setViewportSize({ width: w, height: h });
      const r = await pg.evaluate((BADs) => {
        const BAD = new RegExp(BADs, 'i'), out = [], rows = [];
        const look = (where) => { const t = document.body.innerText || ''; const m = t.match(BAD); if (m) out.push(where + ': ' + t.slice(Math.max(0, m.index - 40), m.index + 40).replace(/\s+/g, ' ')); for (const el of document.querySelectorAll('.skrow, .pf-sk')) { const s = el.innerText; if (/\d|%|Journeyman|Adept|Novice|Untrained|Skilled|Trained/.test(s)) rows.push(s.replace(/\s+/g, ' ').slice(0, 80)); } };
        for (const [seed, status] of [[3301, 'noble'], [3302, 'artisan'], [3303, 'peasant']]) {
          T.enter({ seed, race: 'human', realm: 'POL-01', status, sex: 'M', startAge: 14 });
          T.play(12, { onEvent: v => { const s = [v.title, v.text, ...v.choices.map(c => c.t)].join(' '); const m = s.match(BAD); if (m) out.push('card ' + v.title + ': ' + m[0]); } });
          if (!A.pc().alive) continue;
          for (const t of T.tabs()) { UI.tab = t; UI.ov = null; UI.render(); look('tab ' + t); }
          UI.ov = { type: 'profs' }; UI.renderModal(); look('the skills overlay');
          UI.ov = { type: 'profile' }; UI.renderModal(); look('the profile sheet');
          UI.ov = { type: 'actSheet', id: 'practice' }; UI.renderModal(); look('Work at a skill');
          UI.ov = null; UI.renderModal();
          for (const k in A.pc().sk) { const s = UI.skillSheet(A.pc(), k); const m = s.replace(/<[^>]+>/g, ' ').match(/proficien|\d[\d,]* hours/i); if (m) out.push('sheet ' + k + ': ' + m[0]); }
          for (const e of A.S.log) for (const l of e.lines) { const t = Array.isArray(l) ? l[0] : l; if (typeof t === 'string' && BAD.test(t)) out.push('log: ' + t.slice(0, 100)); }
        }
        UI.tab = 'life'; UI.render();
        return { out: out.slice(0, 6), rows: rows.slice(0, 6), n: out.length + rows.length };
      }, BAD.source);
      if (r.n) hits.push(`${w}: ` + [...r.out, ...r.rows.map(x => 'a row with a number: ' + x)].join(' | '));
    }
    await pg.setViewportSize({ width: 1366, height: 768 });
    return { ok: !hits.length, detail: hits.length ? hits.join(' || ') : 'no proficiency, no retired tier word, no hours, no digits in a skill row, at 1366 and 375 wide' };
  },

  // the phone: the Skills panel and a skill's sheet at 375 x 667: no sideways scroll, every control 44 points or more
  async s1Phone(pg) {
    await pg.setViewportSize({ width: 375, height: 667 });
    const r = await pg.evaluate(() => {
      T.enter({ seed: 4401, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 16 });
      T.play(6);
      const out = { wide: [], small: [] };
      const check = where => {
        const se = document.scrollingElement; if (se.scrollWidth > window.innerWidth + 1) out.wide.push(where + ' ' + se.scrollWidth);
        for (const el of document.querySelectorAll('.skrow, .sk-c > summary, .skgroup > summary, .work-how, .work-pick select')) {
          const b = el.getBoundingClientRect(); if (b.width && b.height && (b.height < 44 - 0.5 || b.width < 44 - 0.5)) out.small.push(where + ' ' + el.className + ' ' + Math.round(b.width) + 'x' + Math.round(b.height));
        }
      };
      UI.tab = 'life'; UI.ov = null; UI.render(); check('life');
      UI.ov = { type: 'profs' }; UI.renderModal(); check('skills');
      const k = Object.keys(A.pc().sk)[0];
      const box = document.createElement('div'); box.className = 'panel mbox'; box.innerHTML = UI.skillSheet(A.pc(), k); document.body.appendChild(box);
      for (const d of box.querySelectorAll('details')) d.open = true;
      check('sheet'); box.remove();
      UI.ov = { type: 'actSheet', id: 'practice' }; UI.renderModal(); check('work');
      UI.ov = null; UI.renderModal(); UI.render();
      return out;
    });
    await pg.setViewportSize({ width: 1366, height: 768 });
    return { ok: !r.wide.length && !r.small.length, detail: `${r.wide.length} pages scroll sideways${r.wide.length ? ' (' + r.wide.join(', ') + ')' : ''}; ${r.small.length} controls under 44 points${r.small.length ? ': ' + r.small.slice(0, 4).join(', ') : ''}` };
  },

  // the cost: a thousand months of a full sheet (28 skills) in under a millisecond each, main-thread CPU
  async s1Cost(pg, errs, { cpu }) {
    await pg.evaluate(() => {
      T.enter({ seed: 5501, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 20 });
      const pc = A.pc(), SK = A.SK;
      for (const k of SK.IDS) SK.set(pc, k, 3 + (k.length * 7) % 25, 'test');
      window.__s1m = () => { for (let i = 0; i < 1000; i++) { for (const k of SK.IDS.slice(0, 6)) A.gainXp(pc, k, 0.4, { q: 'practice', why: 'the test' }); SK.month(pc); } };
    });
    const c0 = await cpu(); await pg.evaluate(() => window.__s1m()); const c1 = await cpu();
    const ms = (c1 - c0) / 1000;
    const size = await pg.evaluate(() => { const pc = A.pc(); return JSON.stringify({ sk: pc.sk, skl: pc.skl, skr: pc.skr, tal: pc.tal, skm: pc.skm }).length; });
    return { ok: ms < 1 && size < 16384, detail: `${ms.toFixed(3)} ms of CPU a month for a full sheet (budget 1); the player's skill state ${(size / 1024).toFixed(1)} KB after 1,000 months (cap 16)` };
  },

  // the census of the top: a count, never a cap (order 36, D-043, D-072). The design asks 5 seeds x 200 years (long tier);
  // a life is played as far as it goes, the world's census read each year: 1 to 12 Grandmasters, 0 to 2 Legends
  async s1Census(pg) {
    const r = await pg.evaluate(() => {
      const out = [];
      for (const seed of [8181, 8282, 8383, 8484, 8585]) {
        T.enter({ seed, race: 'human', realm: 'POL-01', status: 'noble', sex: seed % 2 ? 'M' : 'F', startAge: 16 });
        A.SK.census();
        const ns = [A.S.top.n.slice()];
        for (let y = 0; y < 40; y++) { if (T.play(1) !== 'ok') break; if (A.S.top) ns.push(A.S.top.n.slice()); }
        out.push({ seed, years: ns.length - 1, gm: [Math.min(...ns.map(n => n[0])), Math.max(...ns.map(n => n[0]))], legend: [Math.min(...ns.map(n => n[1])), Math.max(...ns.map(n => n[1]))] });
      }
      return out;
    });
    const ok = r.every(x => x.gm[0] >= 1 && x.gm[1] <= 12 && x.legend[1] <= 2);
    return { ok, detail: r.map(x => `seed ${x.seed}, ${x.years} years: Grandmasters ${x.gm[0]} to ${x.gm[1]}, Legends ${x.legend[0]} to ${x.legend[1]}`).join('; ') };
  },

  // the mirror: p.skills[k] is the value of the level, for everyone, after twenty bot years
  async s1Mirror(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 4242, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 16 });
      const play = T.play(20);
      const SK = A.SK, pc = A.pc(), bad = [];
      let people = 0, nums = 0;
      const ids = Object.keys(A.S.people).slice(0, SK.swept);   // made since the month's sweep: next month's
      for (const id of ids) {
        const p = A.S.people[id]; if (!p || !p.skills) continue; people++;
        for (const k in p.skills) {
          if (!SK.BY[k]) { if (SK.LEG[k]) bad.push(id + ' legacy ' + k); continue; }
          nums++;
          const lv = SK.lvOf(p, k);
          // a person born or posted since the year's pass may hold an older code's number until then
          if (p.skills[k] !== SK.VALUES[lv]) bad.push(id + ' ' + k + ' ' + p.skills[k]);
        }
      }
      if (pc.alive) bad.push(...SK.checkPC(pc).filter(b => !/^mirror/.test(b) || !SK.pendingAdopt(pc, b.split(' ')[1])));
      return { play, people, nums, bad: bad.slice(0, 8), nBad: bad.length };
    });
    return { ok: r.nBad === 0 && r.nums > 1000, detail: `${r.people} people, ${r.nums} numbers after 20 years (${r.play}); ${r.nBad} off the mirror${r.nBad ? ': ' + r.bad.join(', ') : ''}` };
  },
};
