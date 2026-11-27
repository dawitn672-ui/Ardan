// Tests for W1-6, "the realm's peace" (docs/design/war.md §13, §9.4, §11.3 point 6, §16; order 54, rule 18; D-097 to
// D-103). See README.md.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..', '..');
const SAVES = path.join(ROOT, 'tests', 'saves');

// in the page: helpers to find a realm and its houses for a lab
const SETUP = () => {
  window.PEL = {
    aiRealm(me) {
      return Object.keys(A.S.realms).sort().map(A.realm).find(r => r && r.alive && !r.isRebel && !r.playerRun && r.id !== me && r.ruler != null && A.P(r.ruler) && A.P(r.ruler).alive && A.realmProvs(r.id).length >= 3 && A.realmHouses(r.id).filter(h => h.headPid && A.P(h.headPid) && A.P(h.headPid).alive).length >= 3) || null;
    },
    heads(r) { return A.realmHouses(r.id).filter(h => h.headPid && A.P(h.headPid) && A.P(h.headPid).alive && h.headPid !== A.S.pc); },
    count(kind) { return (A.S.why || []).filter(x => x.k === kind).length; },
  };
};

export const limits = { peUpheavalsReasoned: 900 };

export default {
  // war.md §13.1 and §13.7: stability is the sum of named pressures, each with a source; a house's loyalty the sum of
  // its named terms; the release's random walks are gone from the source (the AI's ±3 of stability a year, the player's
  // ±3, the houses' ±2 and -4..+3)
  async peStabilityReasons(pg) {
    const rel = f => fs.readFileSync(path.join(ROOT, 'src/core/release/core', f), 'utf8');
    const src = rel('04-realms-and-war-years-a.js') + rel('11-armies-divisions-and-council-a.js') + rel('13-factions-and-decisions.js');
    const code = src.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
    const walks = [/r\.stability \+ ds \+ A\.ri\(/, /\(target - r\.stability\) \* 0\.15 \+ A\.ri\(/, /drift \+ A\.ri\(-2, 2\)/, /h\.op != null \? h\.op : 50\) \+ A\.ri\(-4, 3\)/].filter(x => x.test(code)).map(String);
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      T.enter({ seed: 9741, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 18 });
      T.play(2);
      const bad = [], words = {};
      let realms = 0, houses = 0;
      for (const r of Object.values(A.S.realms)) {
        if (!r.alive || r.isRebel) continue;
        realms++;
        const P = A.PAX.press(r), sum = P.reduce((a, x) => a + x.v, 0);
        if (P.some(x => !x.label || !x.src || !x.src.t || !isFinite(x.v))) bad.push(r.id + ': a term without a label or source');
        if (A.PAX.target(r) !== Math.max(3, Math.min(100, Math.round(sum)))) bad.push(r.id + ': target is not the sum');
        if (!P.some(x => x.k === 'custom') || !P.some(x => x.k === 'lords')) bad.push(r.id + ': no custom or lords term');
        const w = A.PAX.word(r.stability); words[w] = (words[w] || 0) + 1;
        for (const h of A.realmHouses(r.id).slice(0, 6)) {
          houses++;
          const T0 = A.PAX.houseTerms(h, r);
          if (!T0.length || T0.some(x => !x.label || !x.src)) bad.push(h.id + ': loyalty terms');
        }
      }
      // a house's loyalty moves a quarter of the way to its terms' sum, with no dice: two passes from the same start agree
      const R = PEL.aiRealm(A.S.pc ? A.pc().realm : null), hs = A.realmHouses(R.id).slice(0, 5);
      const start = hs.map(h => h.op);
      const r0 = A.S.rngState != null ? A.S.rngState : null;
      A.PAX.housesYear(R, hs);
      const one = hs.map(h => h.op);
      hs.forEach((h, i) => { h.op = start[i]; });
      A.PAX.housesYear(R, hs);
      const two = hs.map(h => h.op);
      const moved = hs.every((h, i) => Math.abs(two[i] - (start[i] + (A.PAX.houseTarget(h, R) - start[i]) * .25)) < 1);
      const note = A.PAX.noteText(R);
      return { bad: bad.slice(0, 5), nbad: bad.length, realms, houses, words, same: JSON.stringify(one) === JSON.stringify(two), moved, r0, note, pct: /%|\d+ ?percent/.test(note) };
    });
    const ok = !walks.length && !r.nbad && r.realms > 10 && r.houses > 30 && r.same && r.moved && r.note.length > 40 && !r.pct;
    return { ok, detail: `random walks left in the release: ${walks.length ? walks.join(', ') : 'none'}; ${r.realms} realms and ${r.houses} houses read, ${r.nbad} faults${r.nbad ? ': ' + r.bad.join('; ') : ''}; words ${JSON.stringify(r.words)}; loyalty moves the same twice: ${r.same}, a quarter of the way: ${r.moved}; the note: "${r.note}"` };
  },

  // war.md §13.7: over worlds of twenty years every faction, petition, answer, rising, coup and quarrel recorded has two
  // or more reasons with a source (the coherency check "an unreasoned upheaval" finds none); no league against the crown is raised in a
  // realm firm with every lord content or loyal; the records are bounded; the realm's month costs little.
  // Readings (this build, seeds 9811 to 9813, 20 years, pooled; three runs while tuning): leagues raised 137 to 179,
  // petitions 32 to 68, private complaints 169 to 186, plots and claims pressed 9 to 13. The bars sit well under the
  // lowest: pooled, at least 40 leagues, 15 petitions, 20 complaints and 1 plot or claim; none unreasoned; none against
  // the crown in a firm, content realm.
  async peUpheavalsReasoned(pg) {
    await pg.evaluate(SETUP);
    const per = [];
    for (const seed of [9811, 9812, 9813]) {
      per.push(await pg.evaluate(seed => {
        T.enter({ seed, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 18 });
        const seen = new Set(), k = {}, firm = [];
        const note0 = A.PAX.note;
        A.PAX.note = function (r, e, rec) {
          // a league against the crown (liberty, independence, a claimant): a war party may form in a quiet realm
          if (r && e && e.k === 'faction' && ['liberty', 'independence', 'claimant'].includes(e.fac)) {
            const quiet = (r.stability || 0) >= 70 && A.realmHouses(r.id).every(h => { const s = A.PAX.stance(h).k; return s === 'loyal' || s === 'content'; });
            if (quiet) firm.push(r.id + ' ' + A.S.year);
          }
          return note0.apply(this, arguments);
        };
        let ms = 0, months = 0;
        const m0 = A.PAX.month;
        A.PAX.month = function () { const t = performance.now(); try { return m0.apply(this, arguments); } finally { ms += performance.now() - t; months++; } };
        for (let y = 0; y < 20; y++) {
          if (A.pc()) A.pc().health = 100;
          const res = T.play(1);
          for (const e of A.PAX.log()) { const key = [e.y, e.d, e.r, e.k, e.chose, e.h || e.p || '', e.o || ''].join('|'); if (seen.has(key)) continue; seen.add(key); const kk = e.k + ':' + e.chose; k[kk] = (k[kk] || 0) + 1; }
          if (res === 'dead') break;
        }
        A.PAX.note = note0; A.PAX.month = m0;
        const co = A.COHERENCY.run(['an unreasoned upheaval'])[0];
        return { seed, k, unre: A.PAX.unreasoned(), firm, log: A.PAX.log().length, feuds: A.PAX.feuds().length, plots: A.PAX.plots().length, ms: months ? ms / months : 0, co: co ? co.n : 0, has: A.COHERENCY.checks.some(c => c.name === 'an unreasoned upheaval') };
      }, seed));
    }
    const sum = (re) => per.reduce((a, x) => a + Object.keys(x.k).filter(kk => re.test(kk)).reduce((b, kk) => b + x.k[kk], 0), 0);
    const n = { leagues: sum(/^faction:found/), petitions: sum(/^petition:/), complaints: sum(/^feud:complain/), plots: sum(/^coup:plot|^claim:press/) };
    const unre = per.flatMap(x => x.unre), firm = per.flatMap(x => x.firm);
    const bounded = per.every(x => x.log <= 80 && x.feuds <= 48 && x.plots <= 6);
    const ok = !unre.length && !firm.length && bounded && per.every(x => x.has && !x.co) && n.leagues >= 40 && n.petitions >= 15 && n.complaints >= 20 && n.plots >= 1;
    return { ok, detail: `pooled over seeds ${per.map(x => x.seed).join(', ')}: ${JSON.stringify(n)}; unreasoned ${unre.length}${unre.length ? ': ' + unre.slice(0, 3).join('; ') : ''}; a league in a firm, content realm ${firm.length}${firm.length ? ': ' + firm.slice(0, 3).join('; ') : ''}; bounded ${bounded}; the month ${per.map(x => x.ms.toFixed(2)).join(', ')} ms; kinds ${per.map(x => JSON.stringify(x.k)).join(' | ')}` };
  },

  // war.md §13.3: a league forms only with two houses or more sharing a grievance and a tie, under one with the standing
  // to lead; when the shared grievance is gone it dissolves within a year
  async peFactionLab(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const found = T.trySeeds(T.seedRun(9831, 6), seed => {
        T.enter({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 18 });
        const R = PEL.aiRealm(A.pc().realm);
        if (!R) return null;
        const hs = PEL.heads(R).filter(h => h.great !== false && ['N01', 'N02', 'N03', 'N04'].includes(h.rung));
        // two great houses with a tie (their seats side by side, or a shared liege)
        for (const a of hs) for (const b of hs) if (a !== b && A.PAX.tieOf(a, b)) return { R, a, b };
        return null;
      });
      if (!found.res) return { skip: `no realm with two tied great houses in seeds ${found.tried.join(', ')}` };
      const { R, a, b } = found.res;
      A.S.factions = (A.S.factions || []).filter(f => f.realm !== R.id);
      for (const h of A.realmHouses(R.id)) h.op = 70;
      R.legit = 30; R.stability = 35;   // a doubtful crown: the claimant's want
      a.op = 18; b.op = 18;
      const houses = A.realmHouses(R.id);
      // freeze the loyalty pass for the lab (it would pull them back toward their terms)
      const hy = A.PAX.housesYear; A.PAX.housesYear = () => {};
      let f = null;
      for (let i = 0; i < 3 && !(f && f.members.includes(a.id) && f.members.includes(b.id)); i++) { A.factionsYear(R); f = A.factionsOf(R.id).find(x => x.members.includes(a.id)); }
      const formed = !!(f && f.members.includes(a.id) && f.members.includes(b.id));
      const why = f && f.why;
      // the grievance gone: the crown makes amends
      a.op = 75; b.op = 75; R.legit = 70; R.stability = 70;
      // (D-194: each house's choice to leave is A.WHY's, a draw among close options, about seven in ten each; the world's
      // stream moved and this world's one year drew "stay" twice. Two years are read: a broken rule still keeps them sworn)
      const isGone = () => !A.factionsOf(R.id).some(x => x.members.includes(a.id) || x.members.includes(b.id));
      for (let k = 0; k < 2 && !(k && isGone()); k++) { A.S.year++; A.factionsYear(R); }
      const gone = isGone();
      A.PAX.housesYear = hy;
      // a small house with no tie never leads one alone
      return { seed: found.seed, formed, kind: f && f.kind, why, gone, tie: A.PAX.tieOf(a, b), n: houses.length };
    });
    if (r.skip) return { ok: true, skip: r.skip };
    return { ok: r.formed && r.gone, detail: `seed ${r.seed}: two great houses tied by ${r.tie}, both sore: a league ${r.formed ? 'formed (' + r.kind + ')' : 'did not form'}; its reasons "${r.why || ''}"; the grievance mended: dissolved within two years ${r.gone}` };
  },

  // war.md §13.5: a coup needs an opening, access and a motive; without an opening nobody is asked; every plot is led
  // and joined only by people with access; the night is settled by who holds what
  async peCoupLab(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      T.enter({ seed: 9851, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 18 });
      const R = PEL.aiRealm(A.pc().realm), ru = A.P(R.ruler);
      A.S.plots = [];
      // a firm realm with a healthy king at peace: no opening, so no one is asked
      for (const w of A.atWar(R.id)) A.S.wars = A.S.wars.filter(x => x !== w);
      R.stability = 70; ru.health = 100; if (R.pol) R.pol.lost = [];
      const before = PEL.count('coup');
      const quiet = A.PAX.coupYear(R), asked = PEL.count('coup') - before, opens0 = A.PAX.openings(R).map(o => o.k).join(',');
      // an opening (the king lies ill, the realm shaking) and an ambitious, aggrieved man with access
      ru.health = 20; R.stability = 22;
      const acc = A.PAX.access(R);
      if (!acc.length) return { skip: 'no one with access in seed 9851' };
      const c = acc[0].p;
      c.traits = ['ambitious', 'wrathful', 'proud', 'greedy'];
      c.rel = c.rel || {};
      if (!c.rel[ru.id]) c.rel[ru.id] = { type: 'acquaintance', op: -80 }; else c.rel[ru.id].op = -80;
      delete c.feel;
      let plot = null, tries = 0;
      for (; tries < 20 && !plot; tries++) { delete R.peaceY; plot = A.PAX.coupYear(R); }
      const accIds = new Set(A.PAX.access(R).map(x => x.p.id));
      const memAcc = plot ? plot.m.every(id => accIds.has(id) || id === A.S.pc) : null;
      // run the plot through: approaches, the watch, the night (a month at a time)
      let end = null, months = 0;
      if (plot) { for (; months < 12 && A.PAX.plots().includes(plot); months++) { A.PAX.plotMonth(plot); if (plot.wait) { plot.wait = 0; plot.ask = plot.ask.filter(x => x !== A.S.pc); } plot.d -= 31; } }
      const last = A.PAX.log().find(e => e.plot === (plot && plot.id) || (plot && e.k === 'coup' && e.p === plot.by));
      end = last ? last.k + ':' + last.chose : null;
      const coups = A.PAX.log().filter(e => e.k === 'coup');
      return { quiet: quiet === null, asked, opens0, plot: !!plot, by: plot && plot.role, tries, memAcc, end, months, coupsN: coups.length, n: coups[0] && coups[0].n, why: coups[0] && coups[0].why };
    });
    if (r.skip) return { ok: true, skip: r.skip };
    const ok = r.quiet && r.asked === 0 && (r.opens0 === '' || r.opens0 === 'old') && r.plot && r.memAcc && r.n >= 2 && !!r.end;
    return { ok, detail: `no opening (openings left: ${r.opens0 || 'none'}): no one asked (${r.asked} decisions), quiet ${r.quiet}; with an opening and a hungry man: a plot by ${r.by} after ${r.tries} year(s), members all with access ${r.memAcc}; its reasons (${r.n}): "${r.why}"; it ended ${r.end} after ${r.months} months` };
  },

  // war.md §9.4: a private war begins with two grievances between houses, climbs a ladder of decisions (a complaint, the
  // king's judgment, the loser's answer), and a judgment lost is a grievance on the house
  async pePrivateWar(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const found = T.trySeeds(T.seedRun(9871, 8), seed => {
        T.enter({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 18 });
        for (const R of Object.values(A.S.realms)) {
          if (!R.alive || R.isRebel || R.playerRun || R.id === A.pc().realm || !A.P(R.ruler)) continue;
          const hs = A.CMD.tics(R.id).filter(h => h.headPid && A.P(h.headPid) && A.P(h.headPid).alive);
          for (const a of hs) for (const b of hs) if (a !== b && A.PAX.tieOf(a, b) === 'a shared border') return { R, a, b };
        }
        return null;
      });
      if (!found.res) return { skip: `no two neighbouring great houses in seeds ${found.tried.join(', ')}` };
      const { R, a, b } = found.res, pa = A.P(a.headPid), pb = A.P(b.headPid);
      A.S.feuds = [];
      pa.traits = ['wrathful', 'proud']; delete pa.feel;
      if (!pa.rel[pb.id]) pa.rel[pb.id] = { type: 'rival', op: -60, met: 'over a boundary' }; else { pa.rel[pb.id].type = 'rival'; pa.rel[pb.id].op = -60; }
      const g = A.PAX.between(a, b);
      let F = null;
      for (let i = 0; i < 6 && !F; i++) { A.PAX.feudYear(R); F = A.PAX.feuds().find(x => x.a === a.id && x.b === b.id); }
      if (!F) return { g: g.map(x => x.label), F: null };
      const before = (a.cmGr || []).length + (b.cmGr || []).length;
      A.PAX.feudTurn(F);
      const after = (a.cmGr || []).length + (b.cmGr || []).length;
      const judged = F.judged, rung = F.rung, ended = F.end ? F.how : null;
      const recs = A.PAX.log().filter(e => e.feud === F.id);
      return { seed: found.seed, g: g.map(x => x.label), F: true, why: F.why, judged, rung, ended, grieved: after > before || judged === 'split' || judged === 'ignore', recs: recs.map(e => e.k + ':' + e.chose + ' n' + e.n) };
    });
    if (r.skip) return { ok: true, skip: r.skip };
    const ok = r.g.length >= 2 && r.F && !!r.judged && r.grieved && r.recs.every(x => !/ n[01]$/.test(x));
    return { ok, detail: `seed ${r.seed}: between them: ${r.g.join('; ')}; complaint ${r.F ? 'brought: ' + r.why : 'never brought'}; judged ${r.judged}, then ${r.ended || r.rung}; the loser grieved ${r.grieved}; records ${(r.recs || []).join(', ')}` };
  },

  // war.md §11.3 point 6: a ruler can be made to yield: his lords refusing further service, his council's vote where the
  // law gives it, a coup made to end the war, each a reason in his pan to ask (W1-5's A.WAR)
  async peForcedSurrender(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      T.enter({ seed: 9891, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 18 });
      const me = A.pc().realm;
      const free = id => { const x = A.realm(id); return x && x.alive && !x.isRebel && !x.playerRun && id !== me && !A.atWar(id).length && x.ruler != null && A.realmProvs(id).length >= 3; };
      let a = null, b = null;
      for (const id of Object.keys(A.S.realms).sort()) { if (!free(id)) continue; const o = A.neighbors(id).find(free); if (o) { a = id; b = o; break; } }
      if (!a) return { skip: 'no pair' };
      const w = A.startWar(a, b, 'The Test War', 'conquest', { noAllies: true, silent: true });
      A.WAR.init(w);
      const D = A.realm(b);
      // the council votes: a council realm whose councillors are cautious, losing
      D.gov = 'council';
      for (const k of Object.keys(D.council || {})) { const c = A.P(D.council[k]); if (c) { c.traits = ['craven', 'humble', 'calm']; delete c.feel; } }
      for (const p of A.realmProvs(b)) p.occ = a;
      for (const d of D.forces ? D.forces.divs : []) d.men = Math.round(d.men * .2);
      A.forcesSync && A.forcesSync(D);
      D.exhaustion = 80;
      const f = A.WAR.facts(w, 'def');
      const vote = A.PAX.voteAsk(w, 'def', f);
      // the lords: half the muster took their men home
      const m = A.CMD.musterOf(w.id, b);
      let service = [];
      if (m && m.e.length) { m.e.forEach((e, i) => { if (i % 2 === 0) e.gone = 1; }); service = A.PAX.serviceAsk(w, 'def'); }
      // a coup to end the war
      D.coupPeace = A.S.year;
      const coup = A.PAX.coupAsk(w, 'def');
      const rec = A.WAR.yieldQ(w, 'def', null, { log: false });
      const labels = rec ? rec.why.map(x => x[0]) : [];
      return { vote: vote.map(x => x.label), service: service.map(x => x.label), musterN: m ? m.e.length : 0, coup: coup.map(x => x.label), chose: rec && rec.chose, labels };
    });
    if (r.skip) return { ok: true, skip: r.skip };
    const ok = r.vote.length === 1 && r.coup.length === 1 && (r.musterN === 0 || r.service.length === 1) && r.chose === 'ask';
    return { ok, detail: `vote: ${r.vote.join('; ') || 'none'}; service: ${r.service.join('; ') || (r.musterN ? 'none' : 'no muster')}; coup: ${r.coup.join('; ')}; the crown ${r.chose}s, because: ${r.labels.join('; ')}` };
  },

  // the council's counsel of war, an alliance or a pact is the ruler's decision with reasons (not a roll); a claimant's
  // press, a commons' rising and the release's old rolls are A.WHY records; lint-reasons falls
  async peCounselAndClaims(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      T.enter({ seed: 9901, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 30 });
      const pc = A.pc(), R = A.realm(pc.realm);
      // the player sits on his realm's council
      const seat = 'chancellor';
      if (A.POSTS) A.POSTS.appoint(A.POSTS.seatKey(R.id, seat), pc.id, { why: 'test', by: R.ruler, force: true }); else R.council[seat] = pc.id;
      pc.office = seat;
      const t = A.neighbors(R.id).map(A.realm).find(o => o && o.alive && !o.isRebel && !A.hostile(R.id, o.id));
      const out = {};
      for (const kind of ['war', 'ally', 'nap']) {
        A.S.time = 10; A.S.yearActs = {};
        const n0 = (A.S.why || []).filter(x => x.k === 'counsel').length;
        const res = A.councilPropose(kind, t.id);
        const recs = (A.S.why || []).filter(x => x.k === 'counsel');
        out[kind] = { ok: res.ok, msg: res.msg, rec: recs.length > n0 ? recs[0].chose : null, n: recs[0] ? recs[0].why.length + recs[0].not.length : 0 };
      }
      // a claimant asked at a tottering crown
      const cl = A.PAX.claimantOf(R, A.P(R.heir) || A.P(R.ruler), A.P(R.ruler));
      const cr = cl ? A.PAX.claimQ(R, cl, { old: A.P(R.ruler) }) : null;
      return { out, claim: cr ? { chose: cr.chose, n: cr.why.length + cr.not.length } : null };
    });
    const lint = await import('node:child_process').then(cp => cp.execFileSync('node', [path.join(ROOT, 'tools/lint-reasons.mjs')], { encoding: 'utf8' }));
    const base = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/reasons-baseline.json'), 'utf8'));
    const n = +((lint.match(/(\d+) bare-dice/) || [])[1]);
    const ok = ['war', 'ally', 'nap'].every(k => r.out[k].ok && r.out[k].rec && r.out[k].n >= 1) && (!r.claim || r.claim.n >= 2) && n <= base.bareDice && n <= 45;
    return { ok, detail: `counsel: ${['war', 'ally', 'nap'].map(k => `${k} ${r.out[k].rec} (${r.out[k].n} reasons)`).join(', ')}; a claimant ${r.claim ? r.claim.chose + 's (' + r.claim.n + ' reasons)' : 'none'}; lint-reasons ${n} (baseline ${base.bareDice})` };
  },

  // the player at his rank: approached by plotters (pe_coup) and judging a quarrel as ruler (pe_judge); each card
  // renders at 375 x 667 without a raw token or a number standing for odds, and each answer does what it says
  async pePlayerCards(pg) {
    await pg.setViewportSize({ width: 375, height: 667 });
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const out = {};
      // 1. the coup's approach, to a councillor
      T.enter({ seed: 9921, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 30 });
      const pc = A.pc(), R = A.realm(pc.realm), ru = A.P(R.ruler);
      if (A.POSTS) A.POSTS.appoint(A.POSTS.seatKey(R.id, 'treasurer'), pc.id, { why: 'test', by: R.ruler, force: true });
      const acc = A.PAX.access(R);
      if (!acc.length) return { skip: 'no one with access' };
      ru.health = 20;
      const P = { id: 'Ktest', r: R.id, by: acc[0].p.id, role: acc[0].role, k: ru.id, m: [acc[0].p.id], ask: [pc.id], d: A.absDay(), war: 0 };
      A.S.plots = [P];
      A.S.queue = [];
      A.PAX.plotMonth(P);
      const q = A.S.queue.find(x => x.ev === 'pe_coup');
      out.queued = !!q && P.wait === 1;
      if (q) {
        const v = A.eventView(q);
        out.coupText = v ? (v.text || '') : '';
        out.raw = T.raw.test(out.coupText) || (v && v.choices || []).some(c => T.raw.test(c.t || ''));
        A.S.queue = [q]; A.S.queue.length = 1;
        A.eventChoose(2);   // tell the crown
        out.told = !A.PAX.plots().includes(P) && A.PAX.log().some(e => e.k === 'approach' && e.chose === 'tell');
      }
      // 2. the ruler judges a quarrel
      T.enter({ seed: 9922, race: 'human', realm: 'POL-01', status: 'royal', sex: 'M', startAge: 30 });
      const me = A.pc();
      if (!me.ruler) A.makeRuler(me, me.realm, true);
      const MR = A.realm(me.ruler);
      if (!MR) return Object.assign(out, { skip2: 'not a ruler' });
      const hs = A.realmHouses(MR.id).filter(h => h.headPid && A.P(h.headPid) && A.P(h.headPid).alive).slice(0, 2);
      if (hs.length < 2) return Object.assign(out, { skip2: 'two houses' });
      const F = { id: 'Qtest', k: 'private', r: MR.id, a: hs[0].id, b: hs[1].id, y: A.S.year, rung: 'complaint', why: 'a mill both claim' };
      A.S.feuds = [F]; A.S.queue = [];
      A.PAX.feudTurn(F);
      const j = A.S.queue.find(x => x.ev === 'pe_judge');
      out.judgeQueued = !!j;
      if (j) {
        const v = A.eventView(j);
        out.judgeText = v ? v.text : '';
        out.raw2 = T.raw.test(out.judgeText);
        A.S.queue = [j];
        A.eventChoose(0);
        out.judged = F.judged;
      }
      UI.render();
      out.wide = document.documentElement.scrollWidth > 375 + 1;
      return out;
    });
    if (r.skip) return { ok: true, skip: r.skip };
    const nums = /\d+ ?%|\bpercent/;
    const ok = r.queued && !r.raw && r.told && !nums.test(r.coupText || '') && (r.skip2 || (r.judgeQueued && !r.raw2 && r.judged === 'forA')) && !r.wide;
    return { ok, detail: `pe_coup queued ${r.queued}: "${(r.coupText || '').slice(0, 120)}"; told the crown and the plot ended ${r.told}; pe_judge ${r.skip2 ? 'skipped: ' + r.skip2 : `queued ${r.judgeQueued}, judged ${r.judged}`}; sideways scroll ${r.wide}` };
  },

  // every realm that stands has one living ruler (w18-ci, D-146): a claimant's faction realm (A.successionWar names him its
  // ruler without crowning him) that outlived its war, when he dies or is crowned elsewhere, passes by its succession, or
  // disperses if it holds no land (the nightly coherency run found Sabra's crown on a dead woman, seed 7104)
  async peOneRulerLab(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const out = {};
      const ghost = id => { const R = A.realm(id); return !!(R && R.alive && !(A.P(R.ruler) && A.P(R.ruler).alive)); };
      const faction = (seed, land) => {
        T.enter({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 18 });
        const R = PEL.aiRealm(A.pc().realm), cl = PEL.heads(R).map(h => A.P(h.headPid)).find(p => p && !p.ruler && A.isAdult(p));
        const w = A.successionWar(R, cl), F = A.realm(w.leadA);
        // its war over, the faction realm stands on its own (03-engine-fixes' rebels), with or without land
        A.S.wars = A.S.wars.filter(x => x !== w); F.isRebel = false;
        if (!land) for (const P of A.realmProvs(F.id)) { P.owner = R.id; if (A.scaleLand) A.scaleLand(); }
        return { R, cl, F };
      };
      // 1. he dies: a faction realm with land passes to an heir, one with none disperses
      let x = faction(9961, true);
      A.kill(x.cl, 'a fever');
      out.diesLand = { ghost: ghost(x.F.id), alive: x.F.alive, ruler: x.F.ruler };
      x = faction(9962, false);
      A.kill(x.cl, 'a fever');
      out.diesNoLand = { ghost: ghost(x.F.id), alive: x.F.alive };
      // 2. he is crowned in the realm he claimed: his faction realm does not keep his name
      x = faction(9963, true);
      A.makeRuler(x.cl, x.R.id);
      out.crowned = { stillNamed: x.F.alive && x.F.ruler === x.cl.id, ruler: x.F.alive ? x.F.ruler : null };
      out.co = A.COHERENCY.run(['one ruler per realm']).length;
      return out;
    });
    const ok = !r.diesLand.ghost && !r.diesNoLand.ghost && !r.diesNoLand.alive && !r.crowned.stillNamed && !r.co;
    return { ok, detail: `a faction realm with land, its lord dead: ${r.diesLand.alive ? 'passes to ' + r.diesLand.ruler : 'ends'} (a dead ruler ${r.diesLand.ghost}); without land: ${r.diesNoLand.alive ? 'stands' : 'disperses'} (a dead ruler ${r.diesNoLand.ghost}); its lord crowned elsewhere: still named ${r.crowned.stillNamed}; the check "one ruler per realm" ${r.co ? 'fails' : 'passes'}` };
  },

  // the same seed and the same choices give the same realm's peace
  async peDeterministic(pg) {
    const r = await pg.evaluate(() => {
      const run = () => {
        T.enter({ seed: 9941, race: 'human', realm: 'POL-02', status: 'peasant', sex: 'M', startAge: 16 });
        T.play(6);
        return T.hash({ p: A.PAX.log(), f: A.PAX.feuds(), k: A.PAX.plots(), s: Object.values(A.S.realms).map(r => [r.id, Math.round(r.stability * 10)]), h: Object.values(A.S.houses).slice(0, 200).map(h => h.op) });
      };
      const a = run(), b = run();
      return { a, b, n: A.PAX.log().length };
    });
    return { ok: r.a === r.b && r.n > 0, detail: `two runs of seed 9941: ${r.a} and ${r.b}; ${r.n} records` };
  },

  // old saves load, play a year with the realm's peace, and their houses and realms read with reasons
  async peOldSaves(pg) {
    const files = fs.existsSync(SAVES) ? fs.readdirSync(SAVES).filter(f => f.endsWith('.ardan')).sort() : [];
    const pick = ['v2.1.0-alpha.1-noble.ardan', 'v2.1.0-alpha.9-marshal.ardan', 'v2.1.0-alpha.10-noble.ardan'].filter(f => files.includes(f));
    if (!pick.length) return { ok: true, skip: 'no sample saves' };
    const out = [];
    for (const f of pick) {
      const b64 = fs.readFileSync(path.join(SAVES, f)).toString('base64');
      out.push(Object.assign({ f }, await pg.evaluate(async (b64) => {
        const bin = atob(b64), bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const d = await SAVES.decode(bytes);
        const had = !!d.S.peace;
        const loaded = UI.enterSaveSafe(d);
        const play = T.play(1);
        const r = A.realm(A.pc() && A.pc().realm) || Object.values(A.S.realms).find(x => x.alive);
        return { loaded: loaded !== false, had, play, terms: A.PAX.press(r).length, unre: A.PAX.unreasoned().length, posts: A.POSTS ? A.POSTS.audit().length : 0 };
      }, b64)));
    }
    const ok = out.every(x => x.loaded && !x.had && (x.play === 'ok' || x.play === 'dead') && x.terms >= 3 && !x.unre && !x.posts);
    return { ok, detail: out.map(x => `${x.f}: loaded ${x.loaded}, plays on ${x.play}, ${x.terms} pressures read, unreasoned ${x.unre}, one-holder faults ${x.posts}`).join(' · ') };
  },
};
