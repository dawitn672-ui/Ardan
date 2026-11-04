// Life arcs: each path gets a middle-years undertaking and a last-years one, run as scenes years apart whose choices
// carry forward (arcs.core.js, arcs.events.js).
import { BOT } from '../../bench/bot.mjs';
import { TARGETS } from '../../bench/targets.mjs';

const SETUP = () => {
  window.LAT = {
    // a grown life on the given path, at the given age, with nothing queued
    life(path, seed, age = 35) {
      const status = path === 'ruler' ? 'royal' : path === 'noble' ? 'noble' : path === 'merchant' ? 'merchant' : 'artisan';
      A.newGame({ seed, race: 'human', realm: 'POL-01', status, sex: 'M', startAge: age });
      const pc = A.pc();
      pc.born -= age - A.age(pc);   // newGame caps the starting age
      pc.prison = null; pc.arcs = {};
      if (path !== 'ruler') pc.ruler = false;
      if (path !== 'soldier') pc.mil = null;
      const JOB = { merchant: 'merchant', priest: 'clergy', scholar: 'teacher', criminal: 'thief', common: 'farm' };
      if (path === 'soldier') pc.mil = { rank: 2 };
      else if (JOB[path]) pc.job = { c: JOB[path], r: 1, y: 2, perf: 55 };
      else if (path === 'ruler') pc.ruler = true;
      if (path !== 'noble' && path !== 'ruler') { pc.noble = false; if (path !== 'merchant') pc.status = 'artisan'; }
      A.S.queue = [];
      return pc;
    },
    // run the month hook with the start roll forced to succeed. The story track (A.ARCS.story, 50-53) rolls first and
    // would win every forced roll, so it is held off here: these tests are about the work of a life (story: true
    // arcs test their own). withStories keeps it on.
    month(pc, withStories) {
      const ch = A.chance, sm = A.ARCS.storyMonth; A.chance = () => true; if (!withStories) A.ARCS.storyMonth = () => false;
      try { A.ARCS.month(pc); } finally { A.chance = ch; A.ARCS.storyMonth = sm; }
    },
    noStories(f) { const sm = A.ARCS.storyMonth; A.ARCS.storyMonth = () => false; try { return f(); } finally { A.ARCS.storyMonth = sm; } },
    // bring the arc's next stage due and queue it
    due(pc, k) { const a = pc.arcs[k]; A.S.year = Math.max(A.S.year, a.next); LAT.month(pc); return A.S.queue.map(q => q.ev); },
    choose(ev, idx, win) {
      const q = A.S.queue.find(x => x.ev === ev); if (!q) return null;
      A.S.queue = [q].concat(A.S.queue.filter(x => x !== q));
      if (!A.headReady() || A.S.queue[0] !== q) return { dropped: true };
      const v = A.eventView(q); const vi = v.choices.findIndex(c => c.i === idx);
      const ch = A.chance; if (win != null) A.chance = () => win;
      try { A.eventChoose(vi); } finally { A.chance = ch; }
      const t = q.result && q.result.text; A.eventClose(); return { text: t, view: v };
    },
  };
};

export default {
  // every stage named by an arc is a trigger-only event, and every choice in it moves the arc on
  async everyChoiceMovesTheArc(pg) {
    const r = await pg.evaluate(() => {
      const bad = [], ids = [];
      for (const [k, a] of Object.entries(A.ARCS.ARC).filter(([, x]) => !x.story)) for (const id of a.stages) {   // the work of a life; story arcs (50-53) test their own
        ids.push(id);
        const e = A.EV[id];
        if (!e) { bad.push(`${k}: ${id} missing`); continue; }
        if (!e.trigger) bad.push(`${id} not trigger-only`);
        e.choices.forEach((c, i) => {
          const fxs = c.check ? [c.win && c.win.fx, c.lose && c.lose.fx] : [c.fx];
          if (fxs.some(f => !f || typeof f !== 'object' || !f.arc)) bad.push(`${id} choice ${i} has no arc`);
        });
      }
      const paths = Object.values(A.ARCS.PATHS).flatMap(p => [p.mid, p.late]).filter(k => !A.ARCS.ARC[k]);
      return { n: ids.length, bad: bad.concat(paths.map(k => `path arc ${k} missing`)) };
    });
    return { ok: r.n === 40 && !r.bad.length, detail: `${r.n} stages; ${r.bad.length ? r.bad.slice(0, 5).join('; ') : 'each is trigger-only and every choice carries fx.arc'}` };
  },

  // each of the eight paths starts its middle-years arc once established, and its last-years arc from 55
  async arcsStartPerPath(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const out = {};
      Object.entries(A.ARCS.PATHS).forEach(([path, P], i) => {
        let pc = LAT.life(path, 4601 + i, 35);
        const seen = A.ARCS.path(pc);
        LAT.month(pc);
        const mid = A.S.queue.map(q => q.ev)[0] || '-';
        pc = LAT.life(path, 4601 + i, 58);
        LAT.month(pc);
        const late = A.S.queue.map(q => q.ev)[0] || '-';
        out[path] = { seen, mid, late, wantMid: A.ARCS.ARC[P.mid].stages[0], wantLate: A.ARCS.ARC[P.late].stages[0] };
      });
      // not yet established: a soldier in the ranks, a clerk on the first rung
      let pc = LAT.life('soldier', 4690, 35); pc.mil.rank = 0; LAT.month(pc); const ranks = A.S.queue.length;
      pc = LAT.life('priest', 4691, 35); pc.job.r = 0; LAT.month(pc); const novice = A.S.queue.length;
      pc = LAT.life('common', 4694, 35); pc.flags.unfree = 1100; LAT.month(pc); const serf = A.S.queue.length;
      // too young
      pc = LAT.life('noble', 4692, 22); LAT.month(pc); const young = A.S.queue.length;
      // the roll: about one month in 24
      pc = LAT.life('noble', 4693, 35); let n = 0; LAT.noStories(() => { for (let m = 0; m < 2400; m++) { A.S.queue = []; pc.arcs = {}; A.ARCS.month(pc); if (A.S.queue.length) n++; } });
      // a story arc running alongside does not hold the work of a life back, and the work of a life does not hold a
      // story back: with both rolls forced, a story arc in progress still lets the middle years' arc start
      const sk = A.ARCS.stories()[0];
      pc = LAT.life('noble', 4696, 35); pc.arcs = sk ? { [sk]: { stage: 1, m: [], next: A.S.year + 5, story: 1 } } : {}; LAT.month(pc, true);
      const alongside = A.S.queue.map(q => q.ev).join();
      pc = LAT.life('noble', 4697, 35); pc.arcs = { estate: { stage: 1, m: [], next: A.S.year + 5 } }; LAT.month(pc, true);
      const storyBeside = A.S.queue.map(q => q.ctx && q.ctx.arc).filter(Boolean).filter(k => A.ARCS.ARC[k] && A.ARCS.ARC[k].story).length;
      // one at a time, two in the middle years, one legacy
      pc = LAT.life('noble', 4695, 60);
      pc.arcs = { estate: { stage: 1, m: [], next: A.S.year + 5 } }; LAT.month(pc); const busy = A.S.queue.length;
      pc.arcs = { estate: { stage: 3, m: [], done: 1100 }, house: { stage: 3, m: [], done: 1101 } }; pc.born = A.S.year - 40; LAT.month(pc); const twoMid = A.S.queue.length;
      pc.arcs = { elder: { stage: 2, m: [], done: 1100 } }; pc.born = A.S.year - 60; LAT.month(pc); const oneLate = A.S.queue.map(q => q.ev).join();
      return { out, ranks, novice, young, serf, rate: n / 2400, busy, twoMid, oneLate, sk, alongside, storyBeside };
    });
    const wrong = Object.entries(r.out).filter(([p, o]) => o.seen !== p || o.mid !== o.wantMid || o.late !== o.wantLate);
    const ok = !wrong.length && r.ranks === 0 && r.novice === 0 && r.young === 0 && r.serf === 0 && r.busy === 0 && r.twoMid === 0 && r.oneLate === 'la_estate_1' && r.rate > 0.025 && r.rate < 0.06
      && (!r.sk || r.alongside === 'la_estate_1' && r.storyBeside === 1);
    return { ok, detail: `${Object.entries(r.out).map(([p, o]) => `${p}: ${o.mid} at 35, ${o.late} at 58`).join('; ')}. Nothing for a soldier in the ranks (${r.ranks}), a novice (${r.novice}), a serf (${r.serf}) or at 22 (${r.young}); the start roll fires ${(r.rate * 100).toFixed(1)}% of months. Limits: none while one runs (${r.busy}), none after two in the middle years (${r.twoMid}), after a legacy only the middle years' (${r.oneLate}). Beside the story track: with ${r.sk || 'no story arc'} running the estate still starts (${r.alongside || '-'}), and with the estate running a story arc still starts (${r.storyBeside})${wrong.length ? `. WRONG: ${wrong.map(w => w[0]).join(', ')}` : ''}` };
  },

  // a choice leaves a mark; the next stage comes one to three years later and its text and outcome follow the mark
  async choicesCarryForward(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const run = (seed, first, holdWins) => {
        const pc = LAT.life('soldier', seed, 35);
        LAT.month(pc);
        const y0 = A.S.year;
        LAT.choose('la_command_1', first);
        const a = pc.arcs.command, gap = a.next - y0, stage1 = a.stage;
        const q2 = LAT.due(pc, 'command');
        const s2 = LAT.choose('la_command_2', 0, holdWins);
        const q3 = LAT.due(pc, 'command');
        const s3 = LAT.choose('la_command_3', 2);
        return { gap, stage1, q2, q3, t2: s2.view.text, t3: s3.view.text, marks: a.m.slice(), done: a.done, stage: a.stage,
          flag: !!pc.flags.la_cmd_held, card: A.ARCS.lines(pc).map(l => l.text) };
      };
      return { hard: run(4701, 0, true), names: run(4702, 1, false) };
    });
    const h = r.hard, n = r.names;
    const ok = h.stage1 === 1 && h.gap >= 1 && h.gap <= 3 && h.q2[0] === 'la_command_2' && h.q3[0] === 'la_command_3'
      && /drilled them for this/.test(h.t2) && /know which of them/.test(n.t2)
      && /your ford/.test(h.t3) && /ford that broke/.test(n.t3)
      && h.marks.join() === 'cmd_hard,cmd_held,cmd_stayed' && n.marks.join() === 'cmd_names,cmd_broke,cmd_stayed'
      && h.flag && h.done && h.stage === 3 && /A command of your own: done/.test(h.card[0]);
    return { ok, detail: `stage 2 came ${h.gap} year(s) after stage 1. Drilled hard and held the ford: marks ${h.marks.join(' → ')}, last scene "${h.t3.slice(0, 50)}…". Learned their names and lost it: ${n.marks.join(' → ')}, "${n.t3.slice(0, 50)}…". Card: "${h.card[0]}"` };
  },

  // a stage whose scene no longer fits the life (the soldier has left the army) gives the arc up instead of stalling it
  async givenUpNotStuck(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const pc = LAT.life('soldier', 4801, 35);
      LAT.month(pc); LAT.choose('la_command_1', 2);
      pc.mil = null;
      const queued = LAT.due(pc, 'command'), a = pc.arcs.command;
      const first = { done: a.done, gave: a.gave, card: A.ARCS.lines(pc).map(l => l.text) };
      // and a stage that was queued but dropped before it was shown (a setup that skips) is given up two months on
      const pc2 = LAT.life('noble', 4802, 35);
      LAT.month(pc2); LAT.choose('la_estate_1', 0);
      LAT.due(pc2, 'estate'); A.S.queue = [];
      const ad = A.absDay; A.absDay = () => ad() + 61;
      try { A.ARCS.month(pc2); } finally { A.absDay = ad; }
      return { queued, first, second: { done: pc2.arcs.estate.done, gave: pc2.arcs.estate.gave } };
    });
    const ok = !r.queued.includes('la_command_2') && !!r.first.done && r.first.gave === 1 && /given up/.test(r.first.card[0]) && !!r.second.done && r.second.gave === 1;
    return { ok, detail: `left the army before the ford: ${r.queued.length ? `queued ${r.queued.join(',')} instead` : 'nothing queued'}, "${r.first.card[0]}"; a stage dropped unseen: given up after two months (${!!r.second.gave})` };
  },

  // the Life tab card: drawn from state, escaped, and drawing it changes nothing
  async lifeCardPure(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const pc = LAT.life('ruler', 4901, 40);
      pc.arcs = { monument: { stage: 1, m: ['mon_x'], next: A.S.year + 1 }, crown: { stage: 2, m: [], done: A.S.year }, '<img src=x>': { stage: 0, m: [] } };
      UI.TAB.life(pc);   // the release's tab makes pc.plan on its first draw; compare from the second
      const s0 = JSON.stringify(A.S), r0 = JSON.stringify(A.rngState);
      const h = UI.TAB.life(pc);
      const same = JSON.stringify(A.S) === s0 && JSON.stringify(A.rngState) === r0;
      const card = (h.match(/<div class="card small arcs"[\s\S]*?<\/div><\/div>/) || [''])[0];
      return { same, card: card.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(), img: /<img src=x>/.test(h) };
    });
    const ok = r.same && /A monument: 1 of 3/.test(r.card) && /The crown, at the end: done/.test(r.card) && !r.img;
    return { ok, detail: `"${r.card}"; drawing changed nothing: ${r.same}; a bad key from a save is left out: ${!r.img}` };
  },

  // old saves: a life without arcs loads and plays on
  async oldSaveTolerated(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const pc = LAT.life('noble', 4951, 40);
      delete pc.arcs;
      let err = null;
      try { LAT.month(pc); UI.TAB.life(pc); } catch (e) { err = String(e); }
      return { err, started: Object.keys(pc.arcs || {}) };
    });
    return { ok: !r.err && r.started.join() === 'estate', detail: r.err || `a life with no arcs field started ${r.started.join(',')}` };
  },

  // whole bot lives: the arcs come up in real play, and run to their end. A middle-years arc starts 10 to 15 years
  // into a life begun at 16 and ends by year 19 (measured on the full world), so each life is played 20 years, not 70:
  // the same ten lives in less than half the time. The bar counts the work of a life only (story arcs, 50-53, are
  // counted beside it, not toward it, and have their own bot tests)
  async botLivesReachArcs(pg) {
    await pg.evaluate(BOT);
    const paths = Object.entries(TARGETS.paths).filter(([k]) => k !== 'serf');
    const lives = [];
    for (const [name, P] of paths) for (let i = 0; i < 2; i++) {
      const o = Object.assign({ seed: 5101 + i * 7919 + name.length * 13, sex: i % 2 ? 'F' : 'M' }, P.start);
      lives.push(await pg.evaluate(([o, i]) => {
        const L = B.life(o, ['careful', 'greedy'][i], i === 0, 20);
        const pc = A.P(A.S.pc) || {};
        const arcs = Object.entries(pc.arcs || {}).map(([k, a]) => ({ k, stage: a.stage, done: !!a.done, gave: !!a.gave, story: !!(A.ARCS.ARC[k] && A.ARCS.ARC[k].story) }));
        return { status: o.status, years: L.years, death: L.deathAge, arcs };
      }, [o, i]));
    }
    const own = l => l.arcs.filter(a => !a.story);
    const started = lives.filter(l => own(l).length).length;
    const stages = lives.reduce((s, l) => s + own(l).reduce((t, a) => t + a.stage, 0), 0);
    const finished = lives.reduce((s, l) => s + own(l).filter(a => a.done && !a.gave).length, 0);
    const stories = lives.reduce((s, l) => s + l.arcs.filter(a => a.story).length, 0);
    const lived = lives.filter(l => l.years >= 15).length;
    const ok = started >= Math.ceil(lived * 0.6) && finished >= 2;
    return { ok, detail: `${lives.length} bot lives of up to 20 years (${lived} of 15+ years): ${started} began the work of their life, ${stages} of its scenes played, ${finished} finished (and ${stories} story arcs beside them, marked *). ${lives.map(l => `${l.status} ${l.years}y: ${l.arcs.map(a => `${a.k}${a.story ? '*' : ''} ${a.stage}${a.done ? (a.gave ? '×' : '✓') : ''}`).join(' ') || '—'}`).join('; ')}` };
  },
};
