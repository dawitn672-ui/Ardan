// 99999-v2-renown: renown from the best deeds (weighted by odds beaten and witnesses), never saturating; promotion a
// monthly hazard on the game's own ladders, not a counter; renown and standing in words (V2_SPEC complaint 15;
// playtest 1: "renown at 100 by 38", merit shown as counters).
import { BOT } from '../../bench/bot.mjs';
import { TARGETS } from '../../bench/targets.mjs';

const START = { seed: 7411, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 };
// a clean record (no birth standing, no deeds), so a test measures only what it adds
const prep = pg => pg.evaluate(() => { window.RNT = { wipe: pc => { pc.rn = { d: [], s: [], b: 0, pk: 0, f: pc.fame = 0 }; } }; });

export default {
  // one deed that beat long odds in front of the army outweighs twenty small ones among comrades (v2's test, in the game)
  async rnGreatDeed(pg) {
    await prep(pg);
    const r = await pg.evaluate(S => {
      const RN = A.RN, out = {};
      T.enter(S); let pc = A.pc(); const y0 = A.S.year;
      RNT.wipe(pc);
      for (let i = 0; i < 20; i++) RN.within({ wit: 'comrades', year: y0 - (i % 5), text: 'solid work' }, A.fame, null, [pc, 1]);
      out.smallR = RN.R(pc); out.smallF = pc.fame;
      T.enter(S); pc = A.pc(); RNT.wipe(pc);
      RN.within({ wit: 'army', q: 0.15, year: y0 - 1, text: 'held the ford alone' }, A.fame, null, [pc, 4]);
      out.greatR = RN.R(pc); out.greatF = pc.fame; out.deed = (pc.rn.d[0] || {}).text;
      // the odds count: the same deed at a sure thing is worth less
      T.enter(S); pc = A.pc(); RNT.wipe(pc);
      RN.within({ wit: 'army', year: y0 - 1 }, A.fame, null, [pc, 4]);
      out.sureR = RN.R(pc);
      out.words = [RN.wordsOf({ fame: out.smallF }), RN.wordsOf({ fame: out.greatF })];
      return out;
    }, START);
    const ok = r.greatR > 2 * r.smallR && r.greatF > r.smallF && r.sureR < r.greatR && r.deed === 'held the ford alone';
    return { ok, detail: `twenty small deeds: renown ${r.smallR.toFixed(1)} (${r.words[0]}); one great deed at long odds before the army: ${r.greatR.toFixed(1)} (${r.words[1]}); the same at a sure thing ${r.sureR.toFixed(1)}` };
  },

  // a 60-year life of deeds levels off well short of the top, where the old fame would sit at 100 (a synthetic busy
  // life: 8 small deeds a year, a battle every second year, a great deed at court every fourth), and a real noble
  // life the bot plays (the seed that stood at 99 by 55 before) stays short of saturation too
  async rnNoSaturate(pg) {
    await prep(pg);
    const r = await pg.evaluate(S => {
      const RN = A.RN, out = { by: {}, old: {} };
      T.enter(S); const pc = A.pc(); RNT.wipe(pc);
      const y0 = A.S.year, oldFame = (f, d) => (d > 0 ? Math.min(100, f + d * Math.max(0.08, 1 - f / 105)) : Math.max(0, f + d));
      let old = 0, peak = 0;
      for (let k = 0; k < 60; k++) {
        A.S.year = y0 + k;
        const deeds = [];
        for (let i = 0; i < 8; i++) deeds.push([{ wit: 'comrades' }, 2]);
        if (k % 2 === 0) deeds.push([{ wit: 'army', field: 'war', q: 0.5 }, 4]);
        if (k % 4 === 3) deeds.push([{ wit: 'court', field: 'court' }, 8]);
        for (const [c, d] of deeds) { RN.within(c, A.fame, null, [pc, d]); old = oldFame(old, d); }
        RN.apply(pc); peak = Math.max(peak, pc.fame);
        if (k % 10 === 8) { out.by[18 + k] = Math.round(pc.fame); out.old[18 + k] = Math.round(old); }
      }
      out.peak = peak; out.oldPeak = old; out.words = RN.wordsOf(pc);
      return out;
    }, START);
    // the balance league's first noble life (bench/balance.mjs: seed 7001 + 5 x 31, engaged, careful)
    const life = await pg.evaluate(BOT).then(() => pg.evaluate(o => {
      const L = B.life(o, 'careful', true, 60);
      const S = L.samples || [], at = a => (S.find(s => s.age >= a) || S[S.length - 1] || {}).fame;
      return { peak: Math.max(0, ...S.map(s => s.fame)), at38: at(38), at55: at(55), years: L.years, words: A.RN.wordsOf(A.pc()) };
    }, Object.assign({ seed: 7001 + 5 * 31, sex: 'M' }, TARGETS.paths.noble.start)));
    const ok = r.oldPeak >= 99 && r.peak < 90 && life.peak < 95 && life.at38 < 90;
    return { ok, detail: `busy life, fame by age (new / old): ${Object.keys(r.by).map(a => `${a}: ${r.by[a]} / ${r.old[a]}`).join(', ')}; peak ${r.peak.toFixed(1)} (old ${Math.round(r.oldPeak)}), "${r.words}". Bot noble life (${life.years} years): peak ${life.peak}, at 38 ${life.at38}, at 55 ${life.at55}, "${life.words}"` };
  },

  // promotion through the game's own board (A.promoCheck, quarterly as the game sits it) is irregular: sometimes within
  // a year, sometimes years; the gaps' spread is large (CV > 0.6, as tests/v2 asks of promotionCheck), and a great deed
  // can carry a soldier past a rank. With no deeds and no war, the board rarely raises anyone.
  async rnPromoNonlinear(pg) {
    await prep(pg);
    const r = await pg.evaluate(S => {
      const RN = A.RN, out = { gaps: [], jumps: 0, promos: 0 };
      T.enter(S); const pc = A.pc(); A.enlist(pc);
      if (!pc.mil) return { err: 'no enlistment' };
      const y0 = A.S.year, war0 = A.S.warClock;
      const at = mo => { A.S.year = y0 + Math.floor(mo / 12); A.S.warClock = A.MONTH_START[mo % 12]; };
      for (let run = 0; run < 60; run++) {
        at(0); RNT.wipe(pc); pc.mil.rank = 0; pc.mil.merit = 0; pc.mil.rankSince = A.absDay(); delete pc.flags.bossPush;
        let last = 0;
        for (let mo = 0; mo < 240 && pc.mil.rank < 6; mo++) {
          at(mo);
          if (A.chance(0.03)) RN.within({ wit: 'company', field: 'war', text: 'a deed' }, A.fame, null, [pc, A.chance(0.1) ? 30 : 2]);
          if (mo % 3 === 0) {
            const r0 = pc.mil.rank;
            A._promoBoard = true; try { A.promoCheck(pc); } finally { A._promoBoard = false; }
            if (pc.mil.rank > r0) { out.gaps.push(mo - last); last = mo; out.promos++; if (pc.mil.rank - r0 >= 2) out.jumps++; }
          }
        }
      }
      // the quiet career: a soldier with no deeds, the merit counter far past every bar (it no longer decides)
      at(0); RNT.wipe(pc); pc.mil.rank = 1; pc.mil.merit = 1e6; pc.mil.rankSince = A.absDay() - 9999;
      let quiet = 0;
      for (let q = 0; q < 40; q++) { at(q * 3); const r0 = pc.mil.rank; A._promoBoard = true; try { A.promoCheck(pc); } finally { A._promoBoard = false; } if (pc.mil.rank > r0) { quiet++; pc.mil.rank = 1; } }
      out.quiet = quiet;
      // the board in words: no merit counter
      const b = A.promoBoard(pc) || [];
      out.board = b.map(x => `${x.label}: ${x.have}${x.need !== '' ? ' / ' + x.need : ''}`).join('; ');
      out.counter = b.some(x => x.k === 'merit') || /Merit/.test(UI.promoBoardHtml ? UI.promoBoardHtml(pc) : '');
      A.S.year = y0; A.S.warClock = war0;
      return out;
    }, START);
    if (r.err) return { ok: false, detail: r.err };
    const g = r.gaps, mean = g.reduce((s, x) => s + x, 0) / Math.max(1, g.length);
    const sd = Math.sqrt(g.reduce((s, x) => s + (x - mean) ** 2, 0) / Math.max(1, g.length)), cv = sd / Math.max(1e-9, mean);
    const ok = g.length >= 40 && cv > 0.6 && g.some(x => x <= 12) && g.some(x => x >= 60) && r.jumps > 0 && r.quiet <= 8 && !r.counter;
    return { ok, detail: `${r.promos} promotions in 60 careers, gap mean ${mean.toFixed(1)} months, cv ${cv.toFixed(2)}, shortest ${Math.min(...g)}, longest ${Math.max(...g)}; ranks skipped ${r.jumps}; no deeds over ten years at the board: ${r.quiet} of 40 sittings raised him; board: ${r.board}; merit counter shown ${r.counter}` };
  },

  // a post: the merit counter no longer bars the way; work that stands out (or a patron, or a post falling open) does
  async rnJobBoard(pg) {
    const r = await pg.evaluate(S => {
      T.enter(S); const pc = A.pc();
      const keys = Object.keys(GD.CAREERS).filter(k => GD.CAREERS[k].ranks && GD.CAREERS[k].ranks.length >= 4);
      const c = keys.includes('scribe') ? 'scribe' : keys[0];
      pc.job = { c, r: 0, y: 0, perf: 60, rep: 40, merit: 0, since: A.absDay() - 9999 };
      pc.literate = true;
      const b = A.jobBoard(pc) || [];
      UI.tab = 'path'; UI.render();
      const txt = document.body.innerText;
      return { c, rows: b.map(x => `${x.k}:${x.have}`).join(' '), merit: b.some(x => x.k === 'merit'), deed: !!b.find(x => x.k === 'deed' && x.soft),
        counter: /\bMerit\b[^\n]{0,30}\d+\s*\/\s*\d+/.test(txt), path: /work that stands out/i.test(txt) };
    }, START);
    const ok = !r.merit && r.deed && !r.counter;
    return { ok, detail: `${r.c}: ${r.rows}; merit row ${r.merit}, deed row (soft) ${r.deed}, a counter on the Path tab ${r.counter}, the deed row shown ${r.path}` };
  },

  // the profile, another person's sheet and the year's lines say renown in words (v2's renownWords), never a 0-100
  // number; an old save with no deed record keeps its fame, and a new deed adds to it
  async rnWords(pg) {
    const r = await pg.evaluate(S => {
      const RN = A.RN;
      T.enter(S); const pc = A.pc();
      RN.within({ wit: 'army', field: 'war', q: 0.2 }, A.fame, null, [pc, 6]);
      UI.tab = 'life'; UI.render();
      const words = A.V2.renown.RENOWN_WORDS.map(x => x[1]);
      const txt = document.body.innerText;
      const shown = words.filter(w => txt.includes(w));
      const num = /Renown[\s:·—–-]*\d{1,3}\b/.test(txt);
      // another person: a band, never "Renown 59"
      const t = Object.values(A.S.people).find(p => p.alive && p.id !== pc.id && p.fame > 20);
      let other = null;
      if (t && UI.A.ov) { try { UI.A.ov(t.id); } catch (e) {} UI.render(); const o = document.body.innerText; other = { words: words.some(w => o.includes(w)), num: /Renown[\s:·—–-]*\d{1,3}\b/.test(o) }; UI.ov = null; UI.render(); }
      // an old save: no p.rn, fame 50
      delete pc.rn; pc.fame = 50; A.fame(pc, 1);
      const kept = pc.fame;
      return { mine: RN.wordsOf(pc), shown, num, other, kept };
    }, START);
    const ok = r.shown.length > 0 && !r.num && (!r.other || (r.other.words && !r.other.num)) && r.kept > 50 && r.kept < 52;
    return { ok, detail: `yours: "${r.mine}"; words on the page: ${r.shown.join(', ') || 'none'}; a renown number ${r.num}; another person ${JSON.stringify(r.other)}; an old save at 50 after a small deed: ${r.kept.toFixed(2)}` };
  },
};
