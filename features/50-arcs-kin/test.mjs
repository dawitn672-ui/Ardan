// Kin and blood: thirteen story arcs on the story track of 46-life-arcs (arcs.core.js, arcs.events.js).
// Needs 46-life-arcs in the build: node tools/build.mjs --out=/tmp/x.html --only=life-arcs,arcs-kin
import { BOT } from '../../bench/bot.mjs';
import { TARGETS } from '../../bench/targets.mjs';

// keys that leave something lasting (the brief's list), and the fx.akin effects that do
const STRONG = ['trait', 'untrait', 'epithet', 'wound', 'newRel', 'rel', 'asset', 'claim', 'sworn', 'deed'];
const OPS = ['acknowledge', 'adopt', 'wed', 'unwed', 'wedKin', 'unwedKin', 'house', 'farm', 'mill', 'cottage', 'sell', 'wedMatch', 'fate'];

const SETUP = () => {
  window.AKT = {
    // a grown life fitted to an arc's start: a lover for the secret child, a grown child for the match, a parent
    // lately dead for the will, a living father for the other house, no spouse for the night road
    life(k, seed, sex = 'M', status = 'artisan') {
      A.newGame({ seed, race: 'human', realm: 'POL-01', status, sex, startAge: 30 });
      const pc = A.pc();
      const age = k === 'ak_match' ? 44 : k === 'ak_elope' ? 22 : k === 'ak_second' ? 24 : 36;
      pc.born -= age - A.age(pc);
      pc.prison = null; pc.arcs = {}; pc.ruler = false; pc.mil = null;
      for (const id of (pc.parents || [])) { const q = A.P(id); if (q) q.born = Math.min(q.born, pc.born - 26); }
      if (k === 'ak_elope' && pc.spouse) { const s = A.P(pc.spouse); pc.spouse = null; if (s) s.spouse = null; }
      if (k !== 'ak_elope' && !AKT.spouse(pc)) {
        const s = A.AKIN.mk(pc, { age: A.AKIN.adj(pc) - 2, sex: sex === 'M' ? 'F' : 'M' }); A.marry(pc, s);
      }
      if (k === 'ak_match' && !A.AKIN.kidsOf(pc).some(q => A.AKIN.adj(q) >= 15)) {
        const s = AKT.spouse(pc), kid = A.AKIN.mk(pc, { age: 19, parents: sex === 'M' ? [pc.id, s.id] : [s.id, pc.id], sur: pc.sur, surMode: pc.surMode });
        pc.children.push(kid.id); s.children.push(kid.id); A.link(pc, kid, 'child', 60, sex === 'M' ? 'father' : 'mother');
      }
      if (k === 'ak_will') { const m = A.P(pc.parents[1]) || A.P(pc.parents[0]); if (m && m.alive) A.kill(m, 'old age', true); }
      if (k === 'ak_second') { const f = A.P(pc.parents[0]); if (f && !f.alive) { f.alive = true; f.died = null; } }
      A.S.queue = [];
      return pc;
    },
    spouse: p => (p.spouse && A.P(p.spouse) && A.P(p.spouse).alive ? A.P(p.spouse) : null),
    snap(pc) {
      return { flags: Object.keys(pc.flags).filter(f => f.startsWith('ak_')), traits: pc.traits.join(), ep: pc.epithet || '', wounds: pc.wounds.length,
        assets: pc.assets.map(a => a.k + ':' + a.name).join('|'), kids: pc.children.length, spouse: pc.spouse || '', deeds: pc.deeds.length,
        rel: Object.fromEntries(Object.entries(pc.rel).map(([id, r]) => [id, { t: r.type, op: r.op, sw: !!r.sworn }])) };
    },
    // what the last choice left that lasts, from the state before and after it
    left(a, b) {
      const out = [];
      if (a.traits !== b.traits) out.push('trait');
      if (a.ep !== b.ep) out.push('epithet');
      if (b.wounds > a.wounds) out.push('wound');
      if (a.assets !== b.assets) out.push('property');
      if (a.kids !== b.kids) out.push('child');
      if (a.spouse !== b.spouse) out.push('marriage');
      if (b.deeds > a.deeds) out.push('deed');
      for (const [id, r] of Object.entries(b.rel)) {
        const o = a.rel[id];
        if (!o) { out.push('new tie'); continue; }
        if (o.t !== r.t) out.push('tie ' + r.t);
        if (Math.abs(r.op - o.op) >= 15) out.push(r.op > o.op ? 'bond' : 'grudge');
        if (r.sw && !o.sw) out.push('sworn');
      }
      return { keys: [...new Set(out)], flags: b.flags.filter(f => !a.flags.includes(f)) };
    },
    // play an arc through choosing by rule: 'first' or 'last' visible choice at every stage; checks forced to win
    // on the first path and lose on the second, so both sides of every check are played
    play(k, seed, rule, sex) {
      const pc = AKT.life(k, seed, sex);
      const start = !!A.ARCS.ARC[k].start(pc, A.C);
      let before = null, condFail = [];
      const ch = A.chance; A.chance = rule === 'first' ? () => true : () => false;
      let res;
      try {
        res = A.ARCS.playThrough(pc, k, (stage, v) => {
          const e = A.EV[v && A.S.queue[0] ? A.S.queue[0].ev : ''];
          if (e && e.cond && !e.cond(pc, A.C)) condFail.push(e.id);
          if (stage === A.ARCS.ARC[k].stages.length - 1) before = AKT.snap(pc);
          const vis = v.choices.filter(c => c.i >= 0);
          return (rule === 'first' ? vis[0] : vis[vis.length - 1]).i;
        });
      } finally { A.chance = ch; }
      const after = AKT.snap(pc);
      return { start, seen: res.seen, done: !!res.state.done, gave: !!res.state.gave, stage: res.state.stage, marks: (res.state.m || []).slice(),
        left: before ? AKT.left(before, after) : { keys: [], flags: [] }, condFail };
    },
  };
};

export default {
  // (1) thirteen arcs of 3 to 8 stages; each stage exists, is trigger-only, and every choice (both sides of a check)
  // moves the arc; the last stage ends it, and every way out of the last stage leaves a flag and a lasting effect
  async kinArcsRegistered(pg) {
    const r = await pg.evaluate(([STRONG, OPS]) => {
      const keys = (A.AKIN && A.AKIN.ARCS) || [], bad = [], sizes = [];
      for (const k of keys) {
        const D = A.ARCS.ARC[k];
        if (!D.story) bad.push(`${k} not a story arc`);
        if (!A.ARCS.LASTING.includes(D.lasting)) bad.push(`${k} lasting '${D.lasting}'`);
        if (D.stages.length < 3 || D.stages.length > 8) bad.push(`${k}: ${D.stages.length} stages`);
        sizes.push(D.stages.length);
        D.stages.forEach((id, si) => {
          const e = A.EV[id];
          if (!e) { bad.push(`${id} missing`); return; }
          if (!e.trigger) bad.push(`${id} not trigger-only`);
          if (e.choices.length < 2 || e.choices.length > 4) bad.push(`${id}: ${e.choices.length} choices`);
          e.choices.forEach((c, i) => {
            const fxs = c.check ? [c.win && c.win.fx, c.lose && c.lose.fx] : [c.fx];
            for (const f of fxs) {
              if (!f || typeof f !== 'object' || !f.arc) { bad.push(`${id} choice ${i} has no arc`); continue; }
              const last = si === D.stages.length - 1;
              if (last && f.arc.go !== 'end') bad.push(`${id} choice ${i} does not end the arc`);
              if (last) {
                const ops = [].concat(f.akin || []).filter(o => OPS.includes(o));
                const them = f.them && (Math.abs(f.them.op || 0) >= 20 || f.them.type);
                const strong = STRONG.filter(x => f[x] != null).concat(ops.length ? ['akin:' + ops.join('+')] : [], them ? ['them'] : []);
                if (!(typeof f.flag === 'string' && f.flag.startsWith('ak_'))) bad.push(`${id} choice ${i}: no ak_ flag`);
                if (!strong.length) bad.push(`${id} choice ${i}: nothing lasting`);
              }
            }
          });
        });
      }
      const stages = sizes.reduce((a, b) => a + b, 0);
      return { n: keys.length, stages, five: sizes.filter(s => s >= 5).length, avg: stages / Math.max(1, keys.length), bad, gaps: keys.map(k => `${k} ${A.ARCS.ARC[k].gap.join('-')}y`) };
    }, [STRONG, OPS]);
    const ok = r.n === 13 && r.five >= 3 && r.avg >= 4 && !r.bad.length;
    return { ok, detail: `${r.n} arcs, ${r.stages} stages (average ${r.avg.toFixed(2)}, ${r.five} of 5 or more); ${r.bad.length ? 'BAD: ' + r.bad.slice(0, 6).join('; ') : 'every stage trigger-only, every choice moves its arc, every ending leaves an ak_ flag and a lasting effect'}` };
  },

  // (2) each arc played through on two paths (first choice and checks won; last choice and checks lost): it completes,
  // later scenes read differently by path, nothing raw or over-long is shown, and the last choice leaves a lasting change
  async kinArcsPlayThrough(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const RAW = /\{[A-Za-z0-9_.]+\}/, w = s => (String(s || '').match(/\S+/g) || []).length;
      const out = [], bad = [];
      A.AKIN.ARCS.forEach((k, i) => {
        const a = AKT.play(k, 7100 + i * 31, 'first', i % 2 ? 'F' : 'M'), b = AKT.play(k, 7100 + i * 31, 'last', i % 2 ? 'M' : 'F');
        const n = A.ARCS.ARC[k].stages.length;
        for (const [nm, x] of [['first', a], ['last', b]]) {
          if (!x.start) bad.push(`${k}/${nm}: start() false for a fitted life`);
          if (!x.done || x.gave || x.seen.length !== n || x.seen.some(s => s.skip)) bad.push(`${k}/${nm}: ${x.seen.length}/${n} scenes, done ${x.done}, given up ${x.gave}`);
          if (x.condFail.length) bad.push(`${k}/${nm}: cond false at ${x.condFail.join(',')}`);
          for (const s of x.seen) {
            const all = [s.title, s.text, s.result, ...(s.choices || [])].join(' | ');
            if (RAW.test(all)) bad.push(`${s.ev}/${nm}: raw ${all.match(RAW)[0]}`);
            if (w(s.text) > 80) bad.push(`${s.ev}/${nm}: ${w(s.text)} words`);
            for (const c of s.choices || []) if (w(c) > 12) bad.push(`${s.ev}/${nm}: label of ${w(c)} words`);
          }
          if (!x.left.flags.length || !x.left.keys.length) bad.push(`${k}/${nm}: last choice left ${x.left.keys.join(',') || 'nothing'} (flags ${x.left.flags.join(',') || 'none'})`);
        }
        const differ = a.seen.slice(1).filter((s, j) => b.seen[j + 1] && b.seen[j + 1].text !== s.text).length;
        if (!differ) bad.push(`${k}: later scenes read the same on both paths`);
        out.push({ k, differ, n, a: a.left.keys.join('+') + ' ' + a.left.flags.join(','), b: b.left.keys.join('+') + ' ' + b.left.flags.join(','), ma: a.marks.join('>'), mb: b.marks.join('>') });
      });
      return { out, bad };
    });
    const differs = r.out.reduce((s, x) => s + x.differ, 0), later = r.out.reduce((s, x) => s + x.n - 1, 0);
    return { ok: !r.bad.length, detail: `${r.out.length} arcs × 2 paths; ${differs} of ${later} later scenes read differently by path. ${r.bad.length ? 'BAD: ' + r.bad.slice(0, 6).join('; ') + '. ' : ''}${r.out.map(x => `${x.k}: [${x.a}] / [${x.b}]`).join('; ')}`,
      data: r.out };
  },

  // the effects the release has no key for: a child into the register (and so among the heirs), a marriage made and
  // undone, a house or a farm granted once and sold, the family sickness shown only when it is in you
  async kinEffects(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const pc = AKT.life('ak_secret', 7401), H = A.AKIN, out = {};
      pc.arcs.ak_secret = { stage: 0, m: [], story: 1 };
      const kid = H.mk(pc, { age: 14 });
      A.applyFx(pc, { akin: 'acknowledge' }, { pid: kid.id, arc: 'ak_secret' });
      out.ack = pc.children.includes(kid.id) && !!kid.flags.bastard && pc.rel[kid.id].type === 'child' && A.heirsOf(pc).includes(kid) && kid.parents[pc.sex === 'F' ? 1 : 0] === pc.id;
      const kid2 = H.mk(pc, { age: 12 });
      A.applyFx(pc, { akin: 'adopt' }, { pid: kid2.id, arc: 'ak_adopt' });
      out.adopt = pc.children.includes(kid2.id) && !kid2.flags.bastard && kid2.sur === pc.sur && !!kid2.rel[kid.id];
      // marriage: none while married; made when free; undone
      const lv = H.mk(pc, { age: 30, sex: 'F' });
      A.applyFx(pc, { akin: 'wed' }, { pid: lv.id }); out.noBigamy = pc.spouse !== lv.id;
      const old = A.P(pc.spouse); pc.spouse = null; if (old) old.spouse = null;
      A.applyFx(pc, { akin: 'wed' }, { pid: lv.id }); out.wed = pc.spouse === lv.id && lv.spouse === pc.id;
      A.applyFx(pc, { akin: 'unwed' }, { pid: lv.id }); out.unwed = !pc.spouse && !lv.spouse && pc.rel[lv.id].type === 'ex';
      // property: granted once per arc, named, sold
      pc.arcs.ak_land = { stage: 0, m: [], story: 1 };
      const n0 = pc.assets.length;
      A.applyFx(pc, { akin: 'farm' }, { arc: 'ak_land', ground: 'the Long Acre' }); A.applyFx(pc, { akin: 'farm' }, { arc: 'ak_land', ground: 'the Long Acre' });
      out.farm = pc.assets.length === n0 + 1 && pc.assets[pc.assets.length - 1].k === 'farm' && /Long Acre/.test(pc.assets[pc.assets.length - 1].name);
      A.applyFx(pc, { akin: 'sell' }, { arc: 'ak_land' }); out.sold = pc.assets.length === n0;
      // the sickness: no wound when it is not in you, a wound once when it is
      pc.arcs.ak_blood = { stage: 0, m: [], story: 1, nm: { fate: '0' } };
      const w0 = pc.wounds.length;
      A.applyFx(pc, { akin: 'fate' }, { arc: 'ak_blood' }); out.clear = pc.wounds.length === w0;
      pc.arcs.ak_blood.nm.fate = '1';
      const stat0 = A.stat(pc, 'spd');
      A.applyFx(pc, { akin: 'fate' }, { arc: 'ak_blood' }); A.applyFx(pc, { akin: 'fate' }, { arc: 'ak_blood' });
      out.shows = pc.wounds.filter(x => x.k === 'ak_shaking').length === 1 && A.stat(pc, 'spd') < stat0;
      // a son married off and freed again (the match)
      const pc2 = AKT.life('ak_match', 7402), son = A.AKIN.kidsOf(pc2)[0], mate = H.mk(pc2, { age: 20, sex: son.sex === 'F' ? 'M' : 'F' });
      pc2.arcs.ak_match = { stage: 0, m: [], story: 1, who: { kin: son.id, mate: mate.id } };
      A.applyFx(pc2, { akin: 'wedKin' }, { arc: 'ak_match' }); out.wedKin = son.spouse === mate.id && mate.spouse === son.id;
      A.applyFx(pc2, { akin: 'unwedKin' }, { arc: 'ak_match' }); out.unwedKin = !son.spouse && !mate.spouse;
      return out;
    });
    const ok = Object.values(r).every(Boolean);
    return { ok, detail: Object.entries(r).map(([k, v]) => `${k} ${v ? 'ok' : 'FAILED'}`).join(', ') };
  },

  // who can get each arc: the start conditions, read against lives that should and should not get them
  async kinArcsStart(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const S = k => A.ARCS.ARC[k].start;
      const pc = AKT.life('ak_feud', 7501);
      const yes = A.AKIN.ARCS.filter(k => S(k)(AKT.life(k, 7502), A.C));
      // not for children; no night flight once married; no will while both parents live; no other house without a father
      A.newGame({ seed: 7503, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 10 });
      const child = A.AKIN.ARCS.filter(k => S(k)(A.pc(), A.C));
      const wed = AKT.life('ak_feud', 7504); const elope = S('ak_elope')(wed, A.C);
      const live = AKT.life('ak_feud', 7505); for (const id of live.parents) { const q = A.P(id); if (q) { q.alive = true; q.died = null; } }
      const will = S('ak_will')(live, A.C);
      const orphan = AKT.life('ak_second', 7506); const f = A.P(orphan.parents[0]); if (f) A.kill(f, 'old age', true);
      const second = S('ak_second')(orphan, A.C);
      // the story track: one at a time, chosen by weight among those that can start, none twice
      const pc2 = AKT.life('ak_feud', 7507); pc2.arcs = {};
      const ch = A.chance; A.chance = () => true;
      let first, busy, again;
      try {
        A.ARCS.storyMonth(pc2, pc2.arcs, A.age(pc2)); first = Object.keys(pc2.arcs)[0];
        A.S.queue = []; busy = !A.ARCS.storyMonth(pc2, pc2.arcs, A.age(pc2)) && Object.keys(pc2.arcs).length === 1;
        pc2.arcs[first].done = A.S.year; A.S.queue = [];
        A.ARCS.storyMonth(pc2, pc2.arcs, A.age(pc2)); again = Object.keys(pc2.arcs).filter(k => k === first).length === 1 && Object.keys(pc2.arcs).length === 2;
      } finally { A.chance = ch; }
      void pc;
      return { yes, child, elope, will, second, first, busy, again };
    });
    const ok = r.yes.length === 13 && !r.child.length && !r.elope && !r.will && !r.second && r.busy && r.again && /^ak_/.test(r.first);
    return { ok, detail: `a fitted life can start ${r.yes.length} of 13; a child ${r.child.length}; a married life the night road: ${r.elope}; both parents living, the will: ${r.will}; no father, the other house: ${r.second}. Track: first pick ${r.first}, none while it runs (${r.busy}), a different one after (${r.again})` };
  },

  // old saves: an arc state without the people it keeps, and a life with no arcs at all, play on
  async kinOldSave(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const pc = AKT.life('ak_feud', 7601);
      pc.arcs = { ak_feud: { stage: 2, m: ['akf_law'], story: 1, y: A.S.year - 3, next: A.S.year } };
      let err = null, ev = null, text = '';
      try {
        const ch = A.chance; A.chance = () => true;
        try { A.ARCS.month(pc); } finally { A.chance = ch; }
        const q = A.S.queue[0]; ev = q && q.ev;
        const v = q ? A.eventView(q) : null; text = v ? v.text : '';
        if (q) { A.eventChoose(0); A.eventClose(); }
        delete pc.arcs; A.ARCS.month(pc); UI.TAB.life(pc);
      } catch (e) { err = String(e); }
      return { err, ev, text, who: !!(pc.arcs && true) };
    });
    const ok = !r.err && r.ev === 'ak_feud_3' && !/\{/.test(r.text) && r.text.length > 50;
    return { ok, detail: r.err || `an arc saved without its people brought on ${r.ev} with stand-ins: "${r.text.slice(0, 70)}…"; a life with no arcs field played on` };
  },

  // (3) whole bot lives: the kin arcs come up in real play, run years apart, and finish
  async kinBotLives(pg) {
    await pg.evaluate(BOT);
    const paths = Object.entries(TARGETS.paths);
    const lives = [];
    for (const [name, P] of paths) for (let i = 0; i < 3; i++) {
      const o = Object.assign({ seed: 8101 + i * 7919 + name.length * 131, sex: i % 2 ? 'F' : 'M' }, P.start);
      lives.push(await pg.evaluate(([o, i]) => {
        const L = B.life(o, ['careful', 'greedy', 'random'][i], i === 0, 64);
        const pc = A.P(A.S.pc) || {};
        const arcs = Object.entries(pc.arcs || {}).filter(([k]) => k.startsWith('ak_'))
          .map(([k, a]) => ({ k, stage: a.stage, n: A.ARCS.ARC[k].stages.length, done: !!a.done, gave: !!a.gave, span: (a.done || A.S.year) - (a.y || A.S.year) }));
        return { status: o.status, years: L.years, death: L.deathAge, arcs };
      }, [o, i]));
    }
    const long = lives.filter(l => l.years >= 40);
    const started = lives.reduce((s, l) => s + l.arcs.length, 0);
    const finished = lives.reduce((s, l) => s + l.arcs.filter(a => a.done && !a.gave).length, 0);
    const gave = lives.reduce((s, l) => s + l.arcs.filter(a => a.gave).length, 0);
    const scenes = lives.reduce((s, l) => s + l.arcs.reduce((t, a) => t + a.stage, 0), 0);
    const kinds = new Set(lives.flatMap(l => l.arcs.map(a => a.k)));
    const spans = lives.flatMap(l => l.arcs.filter(a => a.done && !a.gave).map(a => a.span));
    const withArc = long.filter(l => l.arcs.length).length;
    const ok = long.length >= 10 && withArc >= Math.ceil(long.length * 0.8) && finished >= 10 && kinds.size >= 8;
    return { ok, data: { lives, started, finished, gave, scenes, kinds: [...kinds], spans },
      detail: `${lives.length} bot lives, ${long.length} of 40+ years (${withArc} of them met a kin arc). ${started} kin arcs began, ${finished} finished, ${gave} given up; ${scenes} scenes played; ${kinds.size} of 13 kinds; finished arcs spanned ${spans.length ? Math.min(...spans) + '-' + Math.max(...spans) : '-'} years. ` +
        lives.map(l => `${l.status} ${l.years}y: ${l.arcs.map(a => `${a.k.slice(3)} ${a.stage}/${a.n}${a.done ? (a.gave ? '×' : '✓') : ''}`).join(' ') || '—'}`).join('; ') };
  },
};
