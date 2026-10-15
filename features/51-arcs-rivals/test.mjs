// Rivals and ambition: thirteen story arcs on the story track of 46-life-arcs (arcs.core.js, arcs.events.js).
import { BOT } from '../../bench/bot.mjs';
import { TARGETS } from '../../bench/targets.mjs';

const SETUP = () => {
  const words = s => (String(s || '').match(/\S+/g) || []).length;
  const RAW = /\{[A-Za-z0-9_.]+\}/;
  window.ART = {
    words, RAW,
    // a grown life that fits each arc's scenes (playThrough forces the start, but a scene's cond still has to hold)
    FOR: {
      ar_rise: { status: 'peasant', age: 30 }, ar_pupil: { status: 'artisan', job: 'smith', rank: 1, age: 36 },
      ar_patron: { status: 'artisan', job: 'weaver', rank: 0, age: 24 }, ar_false: { status: 'peasant', age: 30 },
      ar_elec: { status: 'artisan', job: 'smith', rank: 2, age: 42 }, ar_hon: { status: 'noble', age: 26 },
      ar_libel: { status: 'merchant', job: 'merchant', rank: 1, age: 36 }, ar_charter: { status: 'peasant', age: 40, asset: 'farm' },
      ar_recipe: { status: 'artisan', job: 'brewer', rank: 1, age: 32 }, ar_bribe: { status: 'artisan', job: 'scribe', rank: 1, age: 30 },
      ar_ven: { status: 'noble', job: 'courtier', rank: 1, age: 34 }, ar_usurp: { status: 'merchant', job: 'merchant', rank: 2, age: 50, asset: 'workshop' },
      ar_debt: { status: 'peasant', age: 30 },
    },
    life(o, seed) {
      A.newGame({ seed, race: 'human', realm: o.realm || 'POL-01', status: o.status, sex: o.sex || (seed % 2 ? 'F' : 'M'), startAge: o.age });
      const pc = A.pc();
      pc.born -= o.age - A.age(pc);
      pc.prison = null; pc.arcs = {}; pc.ruler = false; pc.mil = null;
      if (o.job) pc.job = { c: o.job, r: o.rank || 0, y: 3, perf: 55 }; else pc.job = null;
      if (o.asset) pc.assets.push({ k: o.asset, name: GD.PROPERTY[o.asset].name, y: A.S.year });
      pc.coin = o.coin != null ? o.coin : 400;
      A.S.queue = [];
      return pc;
    },
    // what a scene's ending leaves on the life
    snap(pc) {
      return { traits: pc.traits.slice().sort().join(), epithet: pc.epithet || '', wounds: pc.wounds.length, assets: pc.assets.map(a => a.k).join(),
        deeds: pc.deeds.length, prison: !!pc.prison, flags: Object.keys(pc.flags).filter(f => /^ar_/.test(f)).sort().join(),
        rel: Object.fromEntries(Object.entries(pc.rel).map(([id, r]) => [id, [r.type, r.op, !!r.sworn]])) };
    },
    lasting(a, b) {
      const out = [];
      if (a.traits !== b.traits) out.push('trait');
      if (a.epithet !== b.epithet) out.push('epithet');
      if (b.wounds > a.wounds) out.push('wound');
      if (a.assets !== b.assets) out.push('home');
      if (b.deeds > a.deeds) out.push('deed');
      if (b.prison && !a.prison) out.push('prison');
      if (a.flags !== b.flags) out.push('standing');
      for (const id in b.rel) {
        const x = a.rel[id], y = b.rel[id];
        if (!x) { out.push('newRel'); continue; }
        if (x[0] !== y[0] || Math.abs(y[1] - x[1]) >= 20) out.push('bond');
        if (y[2] && !x[2]) out.push('sworn');
      }
      return [...new Set(out)];
    },
    // play an arc through: pick(stage, view) chooses; win true/false forces every check, null leaves it to chance.
    // Returns the scenes seen, the arc state, who each scene was about, and what the last scene left.
    play(k, seed, pick, win) {
      const D = A.ARCS.ARC[k], pc = ART.life(ART.FOR[k], seed), pids = [];
      let before = null, after = null;
      const ev = A.eventView, ch = A.chance, choose = A.eventChoose;
      A.eventView = function (q) { const v = ev.apply(this, arguments); if (q.ctx && q.ctx.arc && !q._rec) { q._rec = 1; pids.push(q.ctx.pid || null); } return v; };
      A.eventChoose = function () { const last = A.S.queue[0] && A.S.queue[0].ev === D.stages[D.stages.length - 1]; if (last) before = ART.snap(A.pc());
        const r = choose.apply(this, arguments); if (last) after = ART.snap(A.pc()); return r; };
      if (win != null) A.chance = () => win;
      let R;
      try { R = A.ARCS.playThrough(pc, k, pick); } finally { A.eventView = ev; A.chance = ch; A.eventChoose = choose; }
      return { seen: R.seen, state: R.state, pids, left: before && after ? ART.lasting(before, after) : [], who: (R.state.ar && R.state.ar.who) || {} };
    },
    first: (stage, v) => v.choices[0].i,
    last: (stage, v) => v.choices[v.choices.length - 1].i,
  };
};

const LASTING_KEYS = ['trait', 'untrait', 'epithet', 'arEpithet', 'wound', 'newRel', 'rel', 'asset', 'arLose', 'claim', 'sworn', 'deed', 'arDeed', 'flag', 'prison'];

export default {
  // 13 arcs of 3 to 8 scenes; every scene trigger-only; every choice (both sides of a check) moves the arc; every ending
  // (the last scene, or a choice that ends the arc early) leaves something that lasts
  async rivalsRegistered(pg) {
    const r = await pg.evaluate((LASTING_KEYS) => {
      const keys = A.ARV.KEYS, bad = [], n = [];
      const lastingFx = fx => !!fx && typeof fx === 'object' && (LASTING_KEYS.some(k => fx[k] != null)
        || (fx.them && (fx.them.type || Math.abs(fx.them.op || 0) >= 20)));
      for (const k of keys) {
        const D = A.ARCS.ARC[k];
        if (!D || !D.story) { bad.push(`${k} not a story arc`); continue; }
        n.push(D.stages.length);
        if (D.stages.length < 3 || D.stages.length > 8) bad.push(`${k}: ${D.stages.length} stages`);
        if (!A.ARCS.LASTING.includes(D.lasting)) bad.push(`${k}: lasting ${D.lasting}`);
        const g = D.gap || A.ARCS.GAP, lo = (D.stages.length - 1) * g[0], hi = (D.stages.length - 1) * g[1];
        if (lo < 2 || hi > 20) bad.push(`${k}: spans ${lo}-${hi} years`);
        D.stages.forEach((id, si) => {
          const e = A.EV[id];
          if (!e) { bad.push(`${id} missing`); return; }
          if (!e.trigger) bad.push(`${id} not trigger-only`);
          if (e.choices.length < 2 || e.choices.length > 4) bad.push(`${id}: ${e.choices.length} choices`);
          e.choices.forEach((c, i) => {
            const fxs = c.check ? [c.win && c.win.fx, c.lose && c.lose.fx] : [c.fx];
            if (fxs.some(f => !f || typeof f !== 'object' || !f.arc)) bad.push(`${id} choice ${i} has no arc`);
            const ends = si === D.stages.length - 1 || fxs.some(f => f && f.arc && (f.arc === 'end' || f.arc.go === 'end'));
            if (ends && fxs.some(f => !lastingFx(f))) bad.push(`${id} choice ${i} ends the arc with nothing lasting`);
          });
        });
      }
      return { arcs: keys.length, n, bad, spans: keys.map(k => { const D = A.ARCS.ARC[k], g = D.gap || A.ARCS.GAP; return `${k} ${D.stages.length}×[${g}]`; }) };
    }, LASTING_KEYS);
    const total = r.n.reduce((a, b) => a + b, 0), five = r.n.filter(x => x >= 5).length;
    const ok = r.arcs === 13 && !r.bad.length && five >= 3 && total / r.arcs >= 4;
    return { ok, detail: `${r.arcs} arcs, ${total} scenes (${(total / r.arcs).toFixed(1)} on average, ${five} of five or more); ${r.bad.length ? r.bad.slice(0, 6).join('; ') : 'every scene trigger-only, every choice carries fx.arc, every ending leaves a lasting effect'}. ${r.spans.join(', ')}` };
  },

  // each arc played through two ways (the first choice with every check won, the last choice with every check lost):
  // both complete, the later scenes read what the earlier ones left, the person is the same from first to last, and
  // the ending leaves something that lasts
  async rivalsPlayThrough(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const out = [];
      A.ARV.KEYS.forEach((k, i) => {
        const seed = 5101 + i * 31;
        const a = ART.play(k, seed, ART.first, true), b = ART.play(k, seed, ART.last, false), a2 = ART.play(k, seed, ART.first, true);
        const n = A.ARCS.ARC[k].stages.length, problems = [];
        for (const [tag, p] of [['A', a], ['B', b]]) {
          if (!p.state.done || p.state.gave) problems.push(`${tag} not completed`);
          if (p.seen.length !== n) problems.push(`${tag} saw ${p.seen.length} of ${n}`);
          for (const s of p.seen) {
            if (s.skip) { problems.push(`${tag} ${s.ev} skipped`); continue; }
            const all = [s.title, s.text, ...s.choices, s.result].join(' | ');
            if (ART.RAW.test(all)) problems.push(`${tag} ${s.ev} raw ${all.match(ART.RAW)[0]}`);
            if (ART.words(s.text) > 80) problems.push(`${tag} ${s.ev} ${ART.words(s.text)} words`);
            if (s.choices.some(c => ART.words(c) > 12)) problems.push(`${tag} ${s.ev} long label`);
          }
          const ids = [...new Set(p.pids.filter(Boolean))];
          if (ids.length > 1) problems.push(`${tag} the person changed: ${ids.join(',')}`);
          if (!p.left.length) problems.push(`${tag} ending left nothing lasting`);
        }
        const differ = a.seen.slice(1).some((s, j) => b.seen[j + 1] && s.text !== b.seen[j + 1].text);
        if (!differ) problems.push('later scenes read the same on both paths');
        const same = JSON.stringify(a.seen) === JSON.stringify(a2.seen);
        if (!same) problems.push('same seed and choices played differently');
        const person = a.pids.find(Boolean) ? A.P(a.pids.find(Boolean)) : null;
        out.push({ k, n, problems, leftA: a.left, leftB: b.left, marksA: a.state.m.join('>'), marksB: b.state.m.join('>'),
          who: person ? `${person.given} (${(A.pc().rel[person.id] || {}).type || '?'})` : '-',
          lastA: (a.seen[n - 1] || {}).text, lastB: (b.seen[n - 1] || {}).text });
      });
      return out;
    });
    const bad = r.filter(x => x.problems.length);
    const ok = r.length === 13 && !bad.length;
    const sample = r.find(x => x.k === 'ar_rise');
    return { ok, detail: `${r.length - bad.length} of ${r.length} arcs complete both ways with later scenes changed by the path. ${bad.length ? 'PROBLEMS: ' + bad.map(x => `${x.k}: ${x.problems.slice(0, 3).join(', ')}`).join('; ') + '. ' : ''}Endings: ${r.map(x => `${x.k} [${x.leftA.join('+')} | ${x.leftB.join('+')}]`).join(', ')}. The rival's rise, first way: ${sample.marksA}; last way: ${sample.marksB}; "${(sample.lastB || '').slice(0, 90)}…"`, data: r };
  },

  // many random paths through every arc on a few kinds of life: no scene dropped, no raw token, no scene over 80 words,
  // every arc finishes, and an existing rival or friend is cast when there is one
  async rivalsEveryPath(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      let s = 7, seen = 0, done = 0, runs = 0, maxW = 0, maxAt = '';
      const rnd = n => { s = (s * 1103515245 + 12345) % 2147483648; return s % n; };
      const problems = [], cast = { old: 0, made: 0 };
      A.ARV.KEYS.forEach((k, ki) => {
        for (let life = 0; life < 2; life++) {
          const o = Object.assign({}, ART.FOR[k], { sex: life ? 'F' : 'M' });
          const pc = ART.life(o, 6301 + ki * 13 + life);
          for (let run = 0; run < 6; run++) {
            for (const f of Object.keys(pc.flags)) if (/^la_ar_/.test(f)) delete pc.flags[f];
            pc.arcs = {}; pc.coin = [0, 120, 400][run % 3]; pc.epithet = '';
            runs++;
            const R = A.ARCS.playThrough(pc, k, (st, v) => v.choices[rnd(v.choices.length)].i);
            if (R.state.done && !R.state.gave) done++;
            const who = R.state.ar && R.state.ar.old ? 'old' : 'made'; cast[who]++;
            for (const x of R.seen) {
              seen++;
              if (x.skip) { problems.push(`${x.ev} skipped`); continue; }
              const all = [x.title, x.text, ...x.choices, x.result].join(' | ');
              if (ART.RAW.test(all)) problems.push(`${x.ev}: ${all.match(ART.RAW)[0]}`);
              const w = ART.words(x.text); if (w > maxW) { maxW = w; maxAt = x.ev; }
              if (w > 80) problems.push(`${x.ev}: ${w} words`);
              if (x.choices.length < 2) problems.push(`${x.ev}: ${x.choices.length} choice`);
            }
          }
        }
      });
      return { runs, done, seen, maxW, maxAt, cast, problems: [...new Set(problems)] };
    });
    const ok = !r.problems.length && r.done === r.runs;
    return { ok, detail: `${r.runs} random runs (${r.seen} scenes): ${r.done} finished; longest scene ${r.maxW} words (${r.maxAt}); the second and later runs in a life cast the person already known ${r.cast.old} times${r.problems.length ? '. PROBLEMS: ' + r.problems.slice(0, 8).join('; ') : ''}` };
  },

  // who can meet which arc: most arcs are open to most grown lives; a ruler has none of these (the crown has its own)
  async rivalsWhoMeetsThem(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const lives = {
        'peasant 30': { status: 'peasant', age: 30, coin: 60 }, 'farmer 45 with a farm': { status: 'peasant', age: 45, job: 'farm', rank: 1, asset: 'farm', coin: 300 },
        'smith 35': { status: 'artisan', job: 'smith', rank: 1, age: 35, coin: 200 }, 'master brewer 50': { status: 'artisan', job: 'brewer', rank: 2, age: 50, coin: 900 },
        'merchant 40': { status: 'merchant', job: 'merchant', rank: 1, age: 40, coin: 3000 }, 'noble 30': { status: 'noble', age: 30, coin: 2000 },
        'courtier 28': { status: 'gentry', job: 'courtier', rank: 1, age: 28, coin: 400 }, 'serf 30': { status: 'serf', age: 30, coin: 10 },
        'soldier 30': { status: 'peasant', age: 30, coin: 100, mil: true }, 'ruler 40': { status: 'royal', age: 40, coin: 5000, ruler: true },
      };
      const out = {}, open = {};
      Object.entries(lives).forEach(([name, o], i) => {
        const pc = ART.life(o, 6601 + i);
        if (o.status === 'serf') pc.flags.unfree = A.S.year - 10;
        if (o.mil) pc.mil = { rank: 2, merit: 0 };
        if (o.ruler) pc.ruler = pc.realm;
        const can = A.ARV.KEYS.filter(k => { try { return A.ARCS.ARC[k].start(pc, A.C) && A.ARCS.fits(pc, A.ARCS.ARC[k].stages[0]); } catch (e) { return false; } });
        out[name] = can;
        for (const k of can) open[k] = (open[k] || 0) + 1;
      });
      return { out, open };
    });
    const counts = Object.fromEntries(Object.entries(r.out).map(([k, v]) => [k, v.length]));
    const commoners = Object.entries(counts).filter(([k]) => !/ruler/.test(k));
    const closed = Object.keys(r.open).length;
    const ok = commoners.every(([, n]) => n >= 3) && counts['ruler 40'] === 0 && closed === 13;
    return { ok, detail: `${Object.entries(counts).map(([k, n]) => `${k}: ${n}`).join(', ')}; every arc open to at least one of these lives: ${closed === 13}` };
  },

  // the arc's person is kept in mind while it runs (the release forgets idle acquaintances); a person who has died
  // drops the scene, which gives the arc up
  async rivalsPeopleKept(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const run = keep => {
        const pc = ART.life(ART.FOR.ar_debt, 6701);
        pc.arcs = { ar_debt: { stage: 0, y: A.S.year, m: [], story: 1, q: A.absDay() } };
        A.queue({ type: 'event', ev: 'ar_debt_1', forced: true, ctx: { arc: 'ar_debt' } });
        A.headReady(); A.eventChoose(0); A.eventClose();
        const id = pc.arcs.ar_debt.ar.who.lender, a = pc.arcs.ar_debt;
        if (!keep) a.done = A.S.year;   // a finished arc no longer holds its people
        for (let y = 0; y < 5; y++) { A.S.year++; for (let m = 0; m < 12; m++) for (const f of A.onMonth) { if (String(f).includes('arcs-rivals') || String(f).includes('a.ar.who')) f(pc); } A.bondsYear(pc); }
        return { kept: !!pc.rel[id], type: pc.rel[id] && pc.rel[id].type };
      };
      const held = run(true), dropped = run(false);
      // a person who died between scenes: the next scene is dropped, and the engine gives the arc up two months on
      const pc = ART.life(ART.FOR.ar_rise, 6702);
      pc.arcs = { ar_rise: { stage: 0, y: A.S.year, m: [], story: 1, q: A.absDay() } };
      A.queue({ type: 'event', ev: 'ar_rise_1', forced: true, ctx: { arc: 'ar_rise' } });
      A.headReady(); A.eventChoose(0); A.eventClose();
      const t = A.P(pc.arcs.ar_rise.ar.who.rival); t.alive = false;
      const a = pc.arcs.ar_rise; A.S.year = a.next;
      const ch = A.chance; A.chance = () => true;
      try { A.ARCS.month(pc); } finally { A.chance = ch; }
      const q = A.S.queue.find(x => x.ev === 'ar_rise_2');
      const shown = !!A.headReady() && A.S.queue[0] === q;
      const ad = A.absDay; A.absDay = () => ad() + 61;
      try { A.ARCS.month(pc); } finally { A.absDay = ad; }
      return { held, dropped, queued: !!q, skipped: !!(q && q.ctx && q.ctx.skip), shown, gave: !!a.gave };
    });
    const ok = r.held.kept && !r.dropped.kept && r.queued && r.skipped && !r.shown && r.gave;
    return { ok, detail: `five idle years: the moneylender of a running arc is still known (${r.held.kept}, ${r.held.type}); once the arc is over the release forgets him (${!r.dropped.kept}). A rival who dies before the second scene: scene queued ${r.queued}, dropped ${r.skipped}, arc given up ${r.gave}` };
  },

  // a save from before this feature (an arc state with no people kept) loads and plays on
  async rivalsOldSave(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      let err = null, view = null;
      try {
        const pc = ART.life(ART.FOR.ar_false, 6801);
        pc.arcs = { ar_false: { stage: 2, y: A.S.year - 3, m: ['ar_false_open'], story: 1, next: A.S.year } };
        pc.flags.la_ar_false_open = A.S.year - 3;
        const raw = A.serialize(); A.deserialize(JSON.parse(raw));
        const ch = A.chance; A.chance = () => true;
        try { A.ARCS.month(A.pc()); } finally { A.chance = ch; }
        const q = A.S.queue.find(x => x.ev === 'ar_false_3');
        view = q ? A.eventView(q) : null;
        UI.TAB.life(A.pc());
      } catch (e) { err = String(e); }
      return { err, shown: view && !view.skip, text: view && view.text };
    });
    return { ok: !r.err && r.shown, detail: r.err || `an arc saved without its people picks one up and shows its third scene: "${(r.text || '').slice(0, 70)}…"` };
  },

  // whole bot lives: these arcs come up in real play, and run to their end
  async rivalsBotLives(pg) {
    await pg.evaluate(BOT);
    const paths = Object.entries(TARGETS.paths);
    const lives = [];
    for (const [name, P] of paths) for (let i = 0; i < 2; i++) {
      const o = Object.assign({ seed: 7301 + i * 7919 + name.length * 17, sex: i % 2 ? 'F' : 'M' }, P.start);
      lives.push(await pg.evaluate(([o, i]) => {
        const L = B.life(o, ['careful', 'greedy'][i], i === 0, 64);
        const pc = A.P(A.S.pc) || {};
        const mine = new Set(A.ARV.KEYS);
        const arcs = Object.entries(pc.arcs || {}).filter(([k]) => mine.has(k)).map(([k, a]) => ({ k, stage: a.stage, done: !!a.done, gave: !!a.gave }));
        return { status: o.status, years: L.years, age: A.age(pc), arcs };
      }, [o, i]));
    }
    const long = lives.filter(l => l.years >= 40);
    const started = lives.filter(l => l.arcs.length).length;
    const all = lives.flatMap(l => l.arcs);
    const finished = all.filter(a => a.done && !a.gave).length, gave = all.filter(a => a.gave).length;
    const scenes = all.reduce((s, a) => s + a.stage, 0);
    const ok = long.length >= 10 && started >= Math.ceil(lives.filter(l => l.years >= 25).length * 0.6) && finished >= 4;
    return { ok, detail: `${lives.length} bot lives (${long.length} of 40+ years): ${started} began one of these arcs; ${all.length} begun, ${scenes} scenes played, ${finished} finished, ${gave} given up. ${lives.map(l => `${l.status} ${l.years}y: ${l.arcs.map(a => `${a.k.slice(3)} ${a.stage}${a.done ? (a.gave ? '×' : '✓') : ''}`).join(' ') || '—'}`).join('; ')}`,
      data: { lives, started, begun: all.length, finished, gave, scenes } };
  },
};
