// Story arcs about objects, places and mysteries (53-arcs-things): thirteen arcs on the story track of 46-life-arcs.
// Build with the engine: node tools/build.mjs --out=/tmp/x.html --only=life-arcs,arcs-things
import { BOT } from '../../bench/bot.mjs';
import { TARGETS } from '../../bench/targets.mjs';

// effect keys that leave something a life keeps: a mark on the body or the name, a bond, a holding, a standing that
// later events read (flag), a deed in the record
const LASTING = ['trait', 'untrait', 'epithet', 'aoEpithet', 'wound', 'newRel', 'rel', 'asset', 'aoAsset', 'gear', 'aoMount', 'claim',
  'sworn', 'deed', 'flag', 'literate', 'lang', 'job', 'lover'];

const SETUP = () => {
  window.AOT = {
    keys: () => A.ARCS.stories().filter(k => k.startsWith('ao_')),
    // a grown, solvent life with nothing queued, so every choice a scene offers can be shown
    life(seed, o = {}) {
      A.newGame(Object.assign({ seed, race: 'human', realm: 'POL-01', status: 'artisan', sex: seed % 2 ? 'F' : 'M', startAge: 30 }, o));
      const pc = A.pc();
      pc.prison = null; pc.arcs = {}; pc.coin = 5000; pc.literate = true;
      A.S.queue = [];
      return pc;
    },
    // what a life keeps, to see that the last scene changed it
    snap(pc) {
      return JSON.stringify({ deeds: pc.deeds.length, traits: pc.traits.slice().sort(), ep: pc.epithet || '', assets: pc.assets.map(a => a.name),
        gear: pc.gear, gq: pc.gearQ || {}, wounds: pc.wounds.map(w => w.k), lit: !!pc.literate,
        flags: Object.keys(pc.flags).filter(f => f.startsWith('ao_')).sort(),
        rels: Object.entries(pc.rel).map(([id, r]) => id + ':' + r.type).sort() });
    },
  };
};

export default {
  // (1) every arc registered with 3 to 8 stages over 2 to 20 years; each stage a trigger-only event; every choice (both
  // sides of a check) carries fx.arc; the last stage ends the arc and every one of its choices leaves something lasting
  async aoArcsRegistered(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate((LASTING) => {
      const bad = [], arcs = [];
      for (const k of AOT.keys()) {
        const D = A.ARCS.ARC[k], n = D.stages.length, gap = D.gap || A.ARCS.GAP;
        arcs.push({ k, n, span: [(n - 1) * gap[0], (n - 1) * gap[1]], lasting: D.lasting });
        if (n < 3 || n > 8) bad.push(`${k}: ${n} stages`);
        if ((n - 1) * gap[0] < 2 || (n - 1) * gap[1] > 20) bad.push(`${k}: spans ${(n - 1) * gap[0]}-${(n - 1) * gap[1]} years`);
        if (!A.ARCS.LASTING.includes(D.lasting)) bad.push(`${k}: lasting '${D.lasting}'`);
        if (typeof D.start !== 'function') bad.push(`${k}: no start`);
        D.stages.forEach((id, si) => {
          const e = A.EV[id], last = si === n - 1;
          if (!e) { bad.push(`${k}: ${id} missing`); return; }
          if (!e.trigger) bad.push(`${id} not trigger-only`);
          if (!e.choices || e.choices.length < 2 || e.choices.length > 4) bad.push(`${id}: ${(e.choices || []).length} choices`);
          e.choices.forEach((c, i) => {
            const fxs = c.check ? [c.win && c.win.fx, c.lose && c.lose.fx] : [c.fx];
            for (const f of fxs) {
              if (!f || typeof f !== 'object' || !f.arc) { bad.push(`${id} choice ${i} has no arc`); continue; }
              const go = typeof f.arc === 'string' ? f.arc : f.arc.go || 'next';
              if (last && go !== 'end') bad.push(`${id} choice ${i}: last stage does not end the arc`);
              if (!last && go === 'end') bad.push(`${id} choice ${i}: ends the arc early`);
              if (typeof f.arc !== 'object' || !f.arc.mark || !f.arc.mark.startsWith('ao_')) bad.push(`${id} choice ${i}: no ao_ mark`);
              if (last && !Object.keys(f).some(x => LASTING.includes(x) || (x === 'them' && f.them && f.them.type))) bad.push(`${id} choice ${i}: nothing lasting`);
            }
          });
        });
      }
      return { arcs, bad };
    }, LASTING);
    const n = r.arcs.length, stages = r.arcs.reduce((s, a) => s + a.n, 0), long = r.arcs.filter(a => a.n >= 5).length;
    const ok = n === 13 && !r.bad.length && stages / n >= 4 && long >= 3;
    return { ok, detail: `${n} arcs, ${stages} stages (${(stages / n).toFixed(1)} a arc, ${long} of 5 or more): ${r.arcs.map(a => `${a.k.slice(3)} ${a.n} (${a.span[0]}-${a.span[1]}y, ${a.lasting})`).join(', ')}${r.bad.length ? `. BAD: ${r.bad.slice(0, 8).join('; ')}` : '. Every choice carries fx.arc; every last choice leaves something lasting'}` };
  },

  // (2) each arc played through twice, taking the first choice with every check won, then the last choice with every
  // check lost: both complete, the later scenes say different things on the two paths, nothing shows a raw token or runs
  // past 80 words, and the last scene changes what the life keeps
  async aoArcsPlayThrough(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const RAW = /\{[A-Za-z0-9_.]+\}/, words = s => (String(s || '').match(/\S+/g) || []).length;
      const out = {};
      const run = (k, seed, path, poor) => {
        const pc = AOT.life(seed), D = A.ARCS.ARC[k], tpl = [], pids = [], few = [];
        if (poor) { pc.coin = 0; pc.literate = false; }
        const y0 = A.S.year;
        let before = null;
        const ch = A.chance; A.chance = () => path === 'first';
        let res;
        try {
          res = A.ARCS.playThrough(pc, k, (stage, v) => {
            const q = A.S.queue[0], e = A.EV[q.ev];
            // the scene as written, before names are filled in, so two lives compare by what the marks changed
            tpl[stage] = typeof e.text === 'function' ? e.text(pc, q.ctx) : e.text;
            pids[stage] = q.ctx.pid || null;
            if (stage === D.stages.length - 1) before = AOT.snap(pc);
            const vis = v.choices.filter(c => c.i >= 0);
            if (vis.length < 2) few.push(q.ev);
            if (poor) pc.coin = 0;
            return (path === 'first' ? vis[0] : vis[vis.length - 1]).i;
          });
        } finally { A.chance = ch; }
        const st = res.state, probs = [];
        for (const s of res.seen) {
          if (s.skip) { probs.push(`${s.ev} skipped`); continue; }
          const all = [s.title, s.text, ...s.choices, s.result].join(' | ');
          if (RAW.test(all)) probs.push(`${s.ev}: raw ${all.match(RAW)[0]}`);
          if (words(s.text) > 80) probs.push(`${s.ev}: ${words(s.text)} words`);
          for (const c of s.choices) if (words(c) > 12) probs.push(`${s.ev}: label of ${words(c)} words`);
        }
        const after = AOT.snap(pc);
        return { done: !!st.done && !st.gave && st.stage === D.stages.length, marks: st.m.slice(), years: (st.done || A.S.year) - y0,
          tpl, pids, few, lasting: before != null && before !== after, probs, last: res.seen.length ? res.seen[res.seen.length - 1].result : '' };
      };
      AOT.keys().forEach((k, i) => {
        const a = run(k, 5301 + i * 17, 'first'), b = run(k, 5301 + i * 17, 'last');
        // a life with no money and no letters still has a choice at every stage
        const pa = run(k, 5301 + i * 17, 'first', true), pb = run(k, 5301 + i * 17, 'last', true);
        const differ = a.tpl.slice(1).some((t, j) => t !== b.tpl[j + 1]);
        out[k] = { a, b, differ, few: [...new Set(a.few.concat(b.few, pa.few, pb.few))], poorDone: pa.done && pb.done };
      });
      // the arc's person is the same one from stage to stage
      const same = (k, from) => { const p = out[k].a.pids.slice(from).filter(Boolean); return p.length > 1 && p.every(x => x === p[0]); };
      return { out, samePerson: { sword: same('ao_sword', 1), horse: same('ao_horse', 1), song: same('ao_song', 0), mill: same('ao_mill', 2) } };
    });
    const bad = [];
    for (const [k, o] of Object.entries(r.out)) {
      if (!o.a.done || !o.b.done) bad.push(`${k} did not complete (${o.a.marks.join(',')} / ${o.b.marks.join(',')})`);
      if (!o.differ) bad.push(`${k}: later scenes read the same on both paths`);
      if (!o.a.lasting || !o.b.lasting) bad.push(`${k}: last scene left nothing lasting (${o.a.lasting}/${o.b.lasting})`);
      for (const p of o.a.probs.concat(o.b.probs)) bad.push(p);
      if (o.few.length) bad.push(`${k}: one choice only at ${o.few.join(',')}`);
      if (!o.poorDone) bad.push(`${k}: a penniless life does not complete it`);
    }
    const sp = Object.entries(r.samePerson).filter(([, v]) => !v).map(([k]) => k);
    const ok = !bad.length && !sp.length;
    const ex = r.out.ao_sword;
    return { ok, detail: `13 arcs × 2 paths complete, and again for a penniless, unlettered life with 2+ choices at every stage; later scenes differ by path in ${Object.values(r.out).filter(o => o.differ).length} of 13; the last scene changes what the life keeps on both paths in ${Object.values(r.out).filter(o => o.a.lasting && o.b.lasting).length}; the same person returns across stages (sword, horse, song, mill): ${!sp.length}. Kestrel: ${ex.a.marks.join(' → ')} over ${ex.a.years} years ("${ex.a.last.slice(0, 70)}…") vs ${ex.b.marks.join(' → ')} ("${ex.b.last.slice(0, 70)}…")${bad.length ? `. BAD: ${bad.slice(0, 8).join('; ')}` : ''}${sp.length ? `. Person changed: ${sp.join(',')}` : ''}` };
  },

  // every branch: each arc played forty times with a choice drawn at random at every stage and checks left to the
  // dice, rich lives and poor ones, nobles and serfs: every path completes, and no scene breaks the word diet or shows
  // a raw token
  async aoArcsEveryBranch(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const RAW = /\{[A-Za-z0-9_.]+\}/, words = s => (String(s || '').match(/\S+/g) || []).length;
      const out = {}, bad = new Set();
      const kinds = [{ status: 'artisan' }, { status: 'noble' }, { status: 'serf', realm: 'POL-05' }, { status: 'merchant', realm: 'POL-04' }];
      AOT.keys().forEach((k, ki) => {
        const ends = new Set(), marks = new Set();
        let runs = 0, done = 0, longest = 0;
        for (let i = 0; i < 40; i++) {
          const pc = AOT.life(5700 + ki * 101 + i, kinds[i % 4]);
          if (i % 3 === 1) pc.coin = A.ri(0, 60);
          if (i % 2) pc.literate = false;
          const res = A.ARCS.playThrough(pc, k, (stage, v) => A.pick(v.choices.filter(c => c.i >= 0)).i);
          runs++;
          if (res.state.done && !res.state.gave && res.state.stage === A.ARCS.ARC[k].stages.length) done++;
          for (const m of res.state.m) marks.add(m);
          ends.add(res.state.m[res.state.m.length - 1]);
          for (const s of res.seen) {
            if (s.skip) { bad.add(`${s.ev} skipped`); continue; }
            const all = [s.title, s.text, ...s.choices, s.result].join(' | ');
            if (RAW.test(all)) bad.add(`${s.ev}: raw ${all.match(RAW)[0]}`);
            const w = words(s.text); longest = Math.max(longest, w);
            if (w > 80) bad.add(`${s.ev}: ${w} words`);
            if (s.choices.length < 2) bad.add(`${s.ev}: ${s.choices.length} choice`);
          }
        }
        out[k] = { runs, done, ends: ends.size, marks: marks.size, longest };
      });
      return { out, bad: [...bad] };
    });
    const all = Object.values(r.out), runs = all.reduce((s, o) => s + o.runs, 0), done = all.reduce((s, o) => s + o.done, 0);
    const ok = !r.bad.length && done === runs;
    return { ok, detail: `${runs} random play-throughs, ${done} complete; endings reached and marks seen per arc: ${Object.entries(r.out).map(([k, o]) => `${k.slice(3)} ${o.ends}/${o.marks}`).join(', ')}; longest scene ${Math.max(...all.map(o => o.longest))} words${r.bad.length ? `. BAD: ${r.bad.slice(0, 10).join('; ')}` : ''}` };
  },

  // the new effects: a named property, a gear quality, a death, a horse returned, a song's name
  async aoEffects(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const pc = AOT.life(5401);
      pc.arcs = { ao_horse: { stage: 3, m: [], w: { mk: 'palfrey' } }, ao_song: { stage: 2, m: [], w: { ep: 'Goose-Runner' } } };
      const t = A.makeAcquaintance(pc, 'acquaint'); A.link(pc, t, 'acquaint', 0, 'acquaint');
      const n0 = pc.assets.length; pc.epithet = '';
      const txt = A.applyFx(pc, { aoAsset: { k: 'workshop', name: 'The mill below {home}' }, aoQual: { weapon: 'master' }, gear: { weapon: 'goodsword' } }, {});
      A.applyFx(pc, { aoKill: 'hanged for horse theft', aoMount: 1 }, { pid: t.id, arc: 'ao_horse' });
      A.applyFx(pc, { aoEpithet: 1 }, { arc: 'ao_song' });
      const a = pc.assets[pc.assets.length - 1];
      return { added: pc.assets.length - n0, name: a.name, k: a.k, txt, q: pc.gearQ.weapon, w: pc.gear.weapon, dead: !t.alive, cause: t.cause, mount: pc.gear.mount, ep: pc.epithet };
    });
    const ok = r.added === 1 && /^The mill below \w/.test(r.name) && r.k === 'workshop' && r.q === 'master' && r.w === 'goodsword' && r.dead && r.mount === 'palfrey' && r.ep === 'Goose-Runner';
    return { ok, detail: `asset "${r.name}" (${r.k}), "${r.txt}"; weapon ${r.w} of ${r.q} quality; the thief ${r.dead ? 'is dead: ' + r.cause : 'lives'}; mount back: ${r.mount}; epithet: ${r.ep}` };
  },

  // who can meet these arcs: most are open to most grown lives
  async aoArcsOpen(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const lives = [['human', 'POL-01', 'peasant'], ['human', 'POL-05', 'serf'], ['human', 'POL-03', 'artisan'], ['human', 'POL-04', 'merchant'],
        ['human', 'POL-01', 'noble'], ['dwarf', 'POL-20', 'artisan'], ['orc', 'POL-11', 'peasant'], ['elf', 'POL-03', 'gentry']];
      return lives.map(([race, realm, status], i) => {
        A.newGame({ seed: 5501 + i, race, realm, status, sex: i % 2 ? 'F' : 'M', startAge: race === 'elf' ? 120 : race === 'dwarf' ? 60 : 30 });
        const pc = A.pc(); pc.ruler = null;
        const open = AOT.keys().filter(k => { try { return A.ARCS.ARC[k].start(pc, A.C); } catch (e) { return false; } });
        return { who: `${race} ${status}`, n: open.length, shut: AOT.keys().filter(k => !open.includes(k)).map(k => k.slice(3)) };
      });
    });
    const ok = r.every(x => x.n >= 10);
    return { ok, detail: r.map(x => `${x.who}: ${x.n} of 13${x.shut.length ? ` (not ${x.shut.join(', ')})` : ''}`).join('; ') };
  },

  // (3) whole bot lives across the six starts: these arcs come up in real play, and some run to their end
  async aoBotLives(pg) {
    await pg.evaluate(BOT);
    // the six starts in turn, two personalities, until ten lives have lasted forty years (at most 24 lives)
    const paths = Object.entries(TARGETS.paths);
    const lives = [];
    for (let n = 0; n < 24 && lives.filter(l => l.years >= 40).length < 10; n++) {
      const [name, P] = paths[n % paths.length], i = Math.floor(n / paths.length) % 2;
      const o = Object.assign({ seed: 5601 + n * 7919 + name.length * 31, sex: n % 2 ? 'F' : 'M' }, P.start);
      lives.push(await pg.evaluate(([o, i, name]) => {
        const L = B.life(o, ['careful', 'greedy'][i], i === 0, 60);
        const pc = A.P(A.S.pc) || {};
        const arcs = Object.entries(pc.arcs || {}).filter(([k]) => k.startsWith('ao_'))
          .map(([k, a]) => ({ k, stage: a.stage, n: A.ARCS.ARC[k].stages.length, done: !!a.done, gave: !!a.gave, y: a.y, end: a.done || null }));
        const other = Object.keys(pc.arcs || {}).filter(k => !k.startsWith('ao_') && A.ARCS.ARC[k] && A.ARCS.ARC[k].story).length;
        return { name, years: L.years, death: L.deathAge, arcs, other };
      }, [o, i, name]));
    }
    const lived = lives.filter(l => l.years >= 40);
    const started = lives.reduce((s, l) => s + l.arcs.length, 0), withOne = lives.filter(l => l.arcs.length).length;
    const finished = lives.reduce((s, l) => s + l.arcs.filter(a => a.done && !a.gave).length, 0);
    const gave = lives.reduce((s, l) => s + l.arcs.filter(a => a.gave).length, 0);
    const scenes = lives.reduce((s, l) => s + l.arcs.reduce((t, a) => t + a.stage, 0), 0);
    const kinds = new Set(lives.flatMap(l => l.arcs.map(a => a.k)));
    const ok = lived.length >= 10 && lived.filter(l => l.arcs.length).length >= Math.ceil(lived.length * 0.5) && finished >= 2;
    return { ok, detail: `${lives.length} bot lives (${lived.length} of 40+ years): ${withOne} began one of these arcs; ${started} begun, ${scenes} scenes played, ${finished} finished, ${gave} given up; ${kinds.size} different arcs. ${lives.map(l => `${l.name} ${l.years}y: ${l.arcs.map(a => `${a.k.slice(3)} ${a.stage}/${a.n}${a.done ? (a.gave ? '×' : '✓') : ''}`).join(' ') || '—'}${l.other ? ` (+${l.other} other)` : ''}`).join('; ')}` };
  },
};
