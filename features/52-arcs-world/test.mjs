// The world and its disasters: thirteen story arcs on the story track (arcs.core.js, arcs.events.js). Needs 46-life-arcs
// in the build (the story track): node tools/build.mjs --out=/tmp/x.html --only=life-arcs,arcs-world
import { BOT } from '../../bench/bot.mjs';
import { TARGETS } from '../../bench/targets.mjs';

const SETUP = () => {
  window.AWT = {
    keys: () => (A.ARCS && A.ARCS.stories ? A.ARCS.stories().filter(k => A.ARCS.ARC[k].aw) : []),
    // what an ending may leave that lasts
    LASTING: ['trait', 'untrait', 'epithet', 'wound', 'newRel', 'rel', 'them', 'sworn', 'asset', 'claim', 'deed', 'flag', 'awWho', 'awMove', 'awProv', 'job'],
    words: s => (String(s || '').match(/\S+/g) || []).length,
    // every mark (la_aw_*) and flag these scenes read back, from their own source: M(p, 'x') and C.flag(p, 'x')
    readFlags() {
      if (this._rf) return this._rf;
      const fn = v => (typeof v === 'function' ? v.toString() : v && typeof v === 'object' ? Object.values(v).map(fn).join(' ') : '');
      let src = '';
      for (const k of this.keys()) for (const id of A.ARCS.ARC[k].stages) {
        const e = A.EV[id]; if (!e) continue;
        src += ' ' + fn(e.cond) + ' ' + fn(e._mwWrapped ? e._mwOwnSetup : e.setup) + ' ' + fn(e.text) + ' ' + (e.choices || []).map(fn).join(' ');
      }
      const out = new Set();
      for (const m of src.matchAll(/\bM\(\s*\w+\s*,\s*["']([A-Za-z0-9_]+)["']/g)) out.add('la_' + m[1]);
      for (const m of src.matchAll(/C\.flag\(\s*\w+\s*,\s*["']([A-Za-z0-9_]+)["']/g)) out.add(m[1]);
      return (this._rf = out);
    },
    raw: /\{[A-Za-z0-9_.]+\}/,
    // a grown commoner with savings and letters, at home, nothing queued
    life(seed, o = {}) {
      A.newGame(Object.assign({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: seed % 2 ? 'F' : 'M', startAge: 30 }, o));
      const pc = A.pc();
      pc.born -= 30 - A.age(pc);
      pc.prison = null; pc.arcs = {}; pc.mil = null; pc.ruler = null; pc.coin = 400; pc.literate = true;
      A.S.queue = [];
      return pc;
    },
    // a neighbouring realm, and a war with it (so {other} is a real realm)
    neighbour(pc) {
      for (const P of A.S.prov) if (P.owner === pc.realm) for (const j of P.adj) { const o = A.S.prov[j].owner; if (o && o !== pc.realm && A.realm(o) && A.realm(o).alive) return o; }
      return null;
    },
    war(pc, foe) {
      A.S.wars = A.S.wars.filter(w => !w.att.includes(pc.realm) && !w.def.includes(pc.realm));
      A.S.wars.push({ id: 'Waw', name: 'The test war', att: [pc.realm], def: [foe], leadA: pc.realm, leadD: foe, start: A.S.year, score: 0, cb: 'conquest', battles: [], kills: { att: 0, def: 0 } });
    },
    lastingIn: fx => !!fx && typeof fx === 'object' && AWT.LASTING.some(k => fx[k] != null),
  };
};

export default {
  // thirteen arcs of 3 to 8 trigger-only stages; every choice moves the arc; every ending leaves something lasting
  async worldArcsShape(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const bad = [], lens = [], spans = [];
      let checked = 0;
      const keys = AWT.keys();
      for (const k of keys) {
        const D = A.ARCS.ARC[k], n = D.stages.length;
        lens.push(n);
        if (n < 3 || n > 8) bad.push(`${k}: ${n} stages`);
        if (!A.ARCS.LASTING.includes(D.lasting)) bad.push(`${k}: lasting ${D.lasting}`);
        if (typeof D.start !== 'function') bad.push(`${k}: no start`);
        const g = D.gaps || [];
        if (g.length !== n - 1) bad.push(`${k}: ${g.length} gaps for ${n} stages`);
        const lo = g.reduce((a, x) => a + x[0], 0), hi = g.reduce((a, x) => a + x[1], 0);
        spans.push(`${k.slice(3)} ${lo}-${hi}`);
        if (lo < 2 || hi > 20) bad.push(`${k}: spans ${lo}-${hi} years`);
        D.stages.forEach((id, si) => {
          const e = A.EV[id];
          if (!e) { bad.push(`${id} missing`); return; }
          if (!e.trigger) bad.push(`${id} not trigger-only`);
          const last = si === n - 1;
          if (e.choices.length < 2 || e.choices.length > 4) bad.push(`${id}: ${e.choices.length} choices`);
          // whatever the scenes before left (every path of marks through them), at least two choices are on offer to
          // someone with savings and letters
          const marksOf = sid => { const out = new Set(); for (const c of A.EV[sid].choices) for (const f of c.check ? [c.win && c.win.fx, c.lose && c.lose.fx] : [c.fx]) if (f && f.arc && f.arc.mark) out.add(f.arc.mark); return [...out]; };
          let paths = [[]];
          for (let j = 0; j < si; j++) paths = paths.flatMap(pa => marksOf(D.stages[j]).map(m => pa.concat([m])));
          const pc = AWT.life(5150 + si);
          for (const pa of paths) {
            for (const f of Object.keys(pc.flags)) if (f.startsWith('la_aw_')) delete pc.flags[f];
            for (const m of pa) pc.flags['la_' + m] = A.S.year;
            const n = e.choices.filter(c => { try { return !c.req || !!c.req(pc, A.C, { arc: k }); } catch (err) { return false; } }).length;
            if (n < 2) { bad.push(`${id}: after ${pa.join(' → ')}, ${n} choice(s) on offer`); break; }
          }
          checked += paths.length;
          e.choices.forEach((c, i) => {
            const fxs = c.check ? [c.win && c.win.fx, c.lose && c.lose.fx] : [c.fx];
            for (const f of fxs) {
              if (!f || typeof f !== 'object' || !f.arc) { bad.push(`${id} choice ${i} has no arc`); continue; }
              const end = typeof f.arc === 'object' && f.arc.go === 'end';
              if (!last && !f.arc.mark) bad.push(`${id} choice ${i} leaves no mark`);
              if (last && f.arc.mark) bad.push(`${id} choice ${i} leaves a mark no later scene can read`);
              if (last && !end) bad.push(`${id} choice ${i} does not end the arc`);
              if (!last && end) bad.push(`${id} choice ${i} ends the arc early`);
              if (last && !AWT.lastingIn(f)) bad.push(`${id} choice ${i} leaves nothing lasting`);
              if (f.flag && !AWT.readFlags().has(f.flag)) bad.push(`${id} choice ${i} sets ${f.flag}, which no scene reads`);
              if (f.arc.mark && !AWT.readFlags().has('la_' + f.arc.mark)) bad.push(`${id} choice ${i} marks ${f.arc.mark}, which no scene reads`);
            }
          });
        });
      }
      return { n: keys.length, lens, stages: lens.reduce((a, b) => a + b, 0), five: lens.filter(x => x >= 5).length, bad, spans, checked };
    });
    const avg = r.stages / Math.max(1, r.n);
    const ok = r.n === 13 && !r.bad.length && avg >= 4 && r.five >= 3;
    return { ok, detail: `${r.n} arcs, ${r.stages} stages (average ${avg.toFixed(2)}, ${r.five} of 5 or more); years between first and last scene: ${r.spans.join(', ')}. ${r.bad.length ? 'BAD: ' + r.bad.slice(0, 6).join('; ') : `Every stage is trigger-only; every choice on both sides of a check carries fx.arc with a mark; every ending choice ends the arc with a lasting effect; every mark and flag set is read by a later scene; on all ${r.checked} paths of marks into a scene, it offers at least two choices`}` };
  },

  // each arc played through on two paths (first offered choice, last offered choice): it completes, later scenes read the
  // earlier marks, nothing renders a raw token or runs over the diet, and the ending leaves its flag
  async worldArcsPlayThrough(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const out = [], bad = [];
      AWT.keys().forEach((k, ki) => {
        const D = A.ARCS.ARC[k], runs = [];
        for (const [pi, how] of [[0, 'first'], [1, 'last']]) {
          const pc = AWT.life(5201 + ki * 17 + pi, { status: k === 'aw_famine' && pi ? 'serf' : 'peasant' });
          if (k === 'aw_siege' || k === 'aw_refugees') { const foe = AWT.neighbour(pc); if (foe) AWT.war(pc, foe); }
          const flags0 = new Set(Object.keys(pc.flags));
          const res = A.ARCS.playThrough(pc, k, (st, v) => (how === 'first' ? v.choices[0].i : v.choices[v.choices.length - 1].i));
          const fin = Object.keys(pc.flags).filter(f => f.startsWith('aw_') && !flags0.has(f));
          for (const s of res.seen) {
            if (s.skip) { bad.push(`${k} ${how}: ${s.ev} dropped`); continue; }
            const all = [s.title, s.text, ...s.choices, s.result].join(' | ');
            if (AWT.raw.test(all)) bad.push(`${s.ev} ${how}: raw ${all.match(AWT.raw)[0]}`);
            if (AWT.words(s.text) > 80) bad.push(`${s.ev} ${how}: ${AWT.words(s.text)} words`);
            for (const c of s.choices) if (AWT.words(c) > 12) bad.push(`${s.ev} ${how}: label "${c}"`);
          }
          const done = !!res.state.done && !res.state.gave && res.state.stage === D.stages.length;
          if (!done) bad.push(`${k} ${how}: did not complete (stage ${res.state.stage})`);
          if ((res.state.m || []).length !== D.stages.length - 1) bad.push(`${k} ${how}: ${(res.state.m || []).length} marks over ${D.stages.length} scenes`);
          runs.push({ texts: res.seen.map(s => s.text || ''), marks: (res.state.m || []).slice(), fin, years: A.S.year - res.state.y, last: (res.seen[res.seen.length - 1] || {}).result || '' });
        }
        const differ = runs[0].texts.slice(1).filter((t, i) => t !== runs[1].texts[i + 1]).length;
        if (!differ) bad.push(`${k}: later scenes read the same on both paths`);
        out.push({ k, differ, of: D.stages.length - 1, a: runs[0], b: runs[1] });
      });
      return { out, bad };
    });
    const ok = r.out.length === 13 && !r.bad.length;
    const line = o => `${o.k.slice(3)}: ${o.differ}/${o.of} later scenes differ; ${o.a.marks.slice(-1)[0]}${o.a.fin.length ? ' → ' + o.a.fin.join(',') : ''} | ${o.b.marks.slice(-1)[0]}${o.b.fin.length ? ' → ' + o.b.fin.join(',') : ''}`;
    return { ok, detail: `${r.out.map(line).join('; ')}${r.bad.length ? '. BAD: ' + r.bad.slice(0, 8).join('; ') : ''}`, data: r.out.map(o => ({ k: o.k, differ: o.differ, endA: o.a.last, endB: o.b.last })) };
  },

  // who can meet which arc follows the world: the coast, the war next door, the harvest, the town, the season
  async worldArcsStartFromWorld(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const S = k => { const D = A.ARCS.ARC[k]; try { return !!D.start(A.pc(), A.C); } catch (e) { return 'throws ' + e.message; } };
      const pc = AWT.life(5301);
      const own = A.S.prov.filter(P => P.owner === pc.realm);
      const coast = own.find(P => P.coast), inland = own.find(P => !P.coast && P.town < 3000);
      const big = own.find(P => P.town >= 3000), out = {};
      if (coast) { pc.home = coast.id; out.wreckCoast = S('aw_wreck'); }
      if (inland) { pc.home = inland.id; out.wreckInland = S('aw_wreck'); out.fireVillage = S('aw_fire'); }
      if (big) { pc.home = big.id; out.fireTown = S('aw_fire'); }
      // war: none, then a war with a neighbour
      const wars = A.S.wars; A.S.wars = [];
      out.siegePeace = S('aw_siege'); out.refugeesPeace = S('aw_refugees');
      const foe = AWT.neighbour(pc); AWT.war(pc, foe);
      out.siegeWar = S('aw_siege'); out.refugeesWar = S('aw_refugees');
      A.S.wars = wars;
      // the harvest (45-economy), or country folk without it
      if (A.ECON) {
        const m = A.mkt(pc.realm), hv = m.hv;
        m.hv = { f: 1, y: A.S.year, t: 'an ordinary harvest' }; out.famineOrdinary = S('aw_famine');
        m.hv = { f: 0.4, y: A.S.year, t: 'the harvest failed' }; out.famineFailed = S('aw_famine');
        m.hv = hv;
      } else { if (inland) pc.home = inland.id; out.famineCountry = S('aw_famine'); }
      // the long winter begins with the first snow
      const mo = A.monthOf; A.monthOf = () => ({ m: 4 }); out.winterMay = S('aw_winter'); A.monthOf = () => ({ m: 10 }); out.winterNov = S('aw_winter'); A.monthOf = mo;
      // nobody's story while ruling, soldiering, in prison or a child
      const all = () => AWT.keys().filter(k => S(k) === true);
      out.open = all().length;
      pc.ruler = 'POL-01'; out.ruler = all().length; pc.ruler = null;
      pc.mil = { rank: 1, merit: 0 }; out.soldier = all().length; pc.mil = null;
      pc.prison = { y: A.S.year, why: 'test' }; out.prison = all().length; pc.prison = null;
      const kid = AWT.life(5302, { startAge: 9 }); kid.born = A.S.year - 9; out.child = all().length;
      return out;
    });
    const want = { wreckCoast: true, wreckInland: false, fireVillage: false, fireTown: true, siegePeace: false, refugeesPeace: false, siegeWar: true, refugeesWar: true,
      famineOrdinary: false, famineFailed: true, famineCountry: true, winterMay: false, winterNov: true, ruler: 0, soldier: 0, prison: 0, child: 0 };
    const wrong = Object.keys(want).filter(k => k in r && r[k] !== want[k]);
    const ok = !wrong.length && r.open >= 4;
    return { ok, detail: `${Object.entries(r).map(([k, v]) => `${k} ${v}`).join(', ')}${wrong.length ? '. WRONG: ' + wrong.join(', ') : ''}` };
  },

  // the effect keys change the world and keep what an arc is about: the plague empties the town, the new walls show on
  // the map, the flood moves you uphill, the refugee is of the warring realm's people, city air frees a serf; each
  // stage comes on its own clock
  async worldArcsChangeTheWorld(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const out = {};
      const pick = idx => (st, v) => { const want = idx[st]; const c = v.choices.find(x => x.i === want); return c ? c.i : v.choices[0].i; };
      // the plague: stage 1 to 2 in the same year, stage 4 takes a sixth of the people
      let pc = AWT.life(5401);
      let P = A.prov(pc.home), pop0 = P.pop, y0 = A.S.year;
      const ch = A.chance; A.chance = () => true;
      let res;
      try { res = A.ARCS.playThrough(pc, 'aw_plague', pick([1, 1, 2, 2, 0])); } finally { A.chance = ch; }
      out.plaguePop = Math.round(100 * (1 - P.pop / pop0));
      out.plagueYears = A.S.year - y0;
      out.ward = Object.values(pc.rel).filter(x => x.type === 'ward').length;
      out.wardAge = (() => { const id = Object.keys(pc.rel).find(i => pc.rel[i].type === 'ward'); return id ? A.age(A.P(id)) : -1; })();
      // the siege: the realm at war is the same in the last scene; the new walls raise the fort level
      pc = AWT.life(5402); const foe = AWT.neighbour(pc); AWT.war(pc, foe);
      P = A.prov(pc.home); const fort0 = P.fort;
      res = A.ARCS.playThrough(pc, 'aw_siege', pick([0, 2, 2, 3, 0]));
      out.siegeRid = pc.arcs.aw_siege.rid === foe;
      out.siegeOther = res.seen.every(s => !/the enemy/.test(s.text)) && res.seen.some(s => s.text.includes(A.realmShort(foe)));
      out.fort = P.fort - fort0;
      // the flood: move uphill where there is higher ground next door
      pc = AWT.life(5403);
      const own = A.S.prov.filter(Q => Q.owner === pc.realm);
      const low = own.find(Q => Q.adj.some(j => A.S.prov[j].owner === pc.realm && A.S.prov[j].elev > Q.elev + 40));
      if (low) {
        pc.home = low.id; const up = A.AW.moveTo(pc, 'high');
        A.ARCS.playThrough(pc, 'aw_flood', pick([1, 1, 1]));
        out.movedUp = pc.home === up.id && up.elev > low.elev;
      }
      // the refugees: the woman from the road is of the warring realm's people and comes back in later scenes
      pc = AWT.life(5404); const foe2 = AWT.neighbour(pc); AWT.war(pc, foe2);
      res = A.ARCS.playThrough(pc, 'aw_refugees', pick([0, 1, 0, 0]));
      const who = A.P(pc.arcs.aw_refugees.who);
      out.refugeeCult = !!who && who.cult === A.realm(foe2).cult;
      out.refugeeNamed = !!who && res.seen.slice(1).filter(s => s.text.includes(who.given)).length;
      out.refugeeSworn = !!who && !!pc.rel[who.id] && !!pc.rel[who.id].sworn;
      // the hungry year: a serf who walks to the capital and stays is free
      pc = AWT.life(5405, { status: 'serf' }); pc.flags.unfree = A.S.year - 10;
      const cap = A.realm(pc.realm).capitalProv;
      if (pc.home === cap) pc.home = A.S.prov.find(Q => Q.owner === pc.realm && Q.id !== cap).id;
      A.ARCS.playThrough(pc, 'aw_famine', pick([0, 0, 1, 3]));
      out.serfFreed = !pc.flags.unfree && pc.home === cap && pc.status === 'peasant';
      return out;
    });
    const ok = r.plaguePop >= 12 && r.plaguePop <= 18 && r.plagueYears >= 2 && r.plagueYears <= 5 && r.ward === 1 && r.wardAge >= 5 && r.wardAge <= 11
      && r.siegeRid && r.siegeOther && r.fort === 1 && r.movedUp !== false && r.refugeeCult && r.refugeeNamed >= 2 && r.refugeeSworn && r.serfFreed;
    return { ok, detail: `plague: ${r.plaguePop}% of the home province's people gone, the arc took ${r.plagueYears} years, a ward of ${r.wardAge} taken in; siege: the same enemy in every scene ${r.siegeRid && r.siegeOther}, walls +${r.fort}; flood: moved to higher ground ${r.movedUp}; refugees: of the warring realm's people ${r.refugeeCult}, named in ${r.refugeeNamed} later scenes, sworn as godparent ${r.refugeeSworn}; hungry year: a serf who stays in the capital is free ${r.serfFreed}` };
  },

  // whole bot lives: the world's arcs come up in real play and run to their end
  async worldArcsInBotLives(pg) {
    await pg.evaluate(BOT);
    await pg.evaluate(SETUP);
    const lives = [];
    const paths = Object.entries(TARGETS.paths);
    for (let round = 0; round < 4 && lives.filter(l => l.years >= 40).length < 12; round++) {
      for (const [name, P] of paths) {
        const o = Object.assign({ seed: 5501 + round * 7919 + name.length * 131, sex: round % 2 ? 'F' : 'M' }, P.start);
        lives.push(await pg.evaluate(([o, i]) => {
          const L = B.life(o, ['careful', 'greedy', 'random', 'reckless'][i % 4], i % 2 === 0, 60);
          const pc = A.P(A.S.pc) || {};
          const arcs = Object.entries(pc.arcs || {}).filter(([k]) => AWT.keys().includes(k)).map(([k, a]) => ({ k, stage: a.stage, n: A.ARCS.ARC[k].stages.length, done: !!a.done, gave: !!a.gave, y: a.y }));
          const story = Object.keys(pc.arcs || {}).filter(k => A.ARCS.ARC[k] && A.ARCS.ARC[k].story).length;
          return { status: o.status, years: L.years, death: L.deathAge, arcs, story };
        }, [o, round]));
      }
    }
    const long = lives.filter(l => l.years >= 40);
    const all = lives.flatMap(l => l.arcs);
    const started = all.length, finished = all.filter(a => a.done && !a.gave).length, gave = all.filter(a => a.gave).length;
    const scenes = all.reduce((s, a) => s + a.stage, 0), kinds = new Set(all.map(a => a.k)).size;
    const longWith = long.filter(l => l.arcs.length).length;
    // the story track is shared: where other features add story arcs (50, 51, 53 in the full build), these get a share
    // of the starts by weight, so the bar is the share's
    const share = await pg.evaluate(() => { const w = k => A.ARCS.ARC[k].w || 1, all = A.ARCS.stories(); return AWT.keys().reduce((a, k) => a + w(k), 0) / Math.max(1, all.reduce((a, k) => a + w(k), 0)); });
    const anyStory = lives.reduce((a, l) => a + l.story, 0);
    // (how long bot lives last is other features' business in a full build: there, only the arcs are held to a bar)
    const ok = share > 0.9 ? long.length >= 10 && longWith >= Math.ceil(long.length * 0.6) && finished >= 5 && kinds >= 5 : started >= 6 && finished >= 3 && kinds >= 4;
    return { ok, detail: `these arcs hold ${Math.round(share * 100)}% of the story track's weight; ${anyStory} story arcs of any feature started. ${lives.length} bot lives (${long.length} of 40+ years; ${longWith} of those met one of these arcs): ${started} started, ${scenes} scenes played, ${finished} finished, ${gave} given up, ${kinds} different arcs. ${lives.map(l => `${l.status} ${l.years}y: ${l.arcs.map(a => `${a.k.slice(3)} ${a.stage}/${a.n}${a.done ? (a.gave ? '×' : '✓') : ''}`).join(' ') || '—'}`).join('; ')}`,
      data: { lives: lives.length, long: long.length, longWith, started, finished, gave, scenes, kinds, share, anyStory } };
  },
};
