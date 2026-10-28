// Playable sieges: the monthly choice moves the real siege counter, from either side of the wall; the camp sickens;
// the fall ends in the sack, the mercy or the terms.
const SETUP = () => {
  window.SGT = {
    // a siege with the player's division outside it
    outside(seed) {
      A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      const pc = A.pc(), enemy = A.neighbors('POL-01')[0];
      A.startWar('POL-01', enemy, null, 'conquest');
      A.enlist(pc); A._idIdx = null;   // the division index is cached
      let d = A.divById(pc.mil && pc.mil.div);
      // a recruit not yet posted joins the realm's first division
      if (!d) { const r = A.realm('POL-01'); d = r.forces.divs[0]; pc.mil.div = d.id; }
      const P = A.S.prov.find(x => x.owner === enemy);
      d.loc = P.id; d.path = []; d.atk = null; d.sieging = true; A._idIdx = null;
      P.sgBy = d.r; P.sgd = 5; P.sgNeed = 40; P.sgSick = 0;
      return { pc, d, P };
    },
    // a siege of the player's home
    inside(seed) {
      A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'F', startAge: 30 });
      const pc = A.pc(), enemy = A.neighbors('POL-01')[0];
      A.startWar('POL-01', enemy, null, 'conquest');
      const P = A.prov(pc.home);
      P.sgBy = enemy; P.sgd = 10; P.sgNeed = 40;
      return { pc, P, enemy };
    },
    month(pc) { A.onMonth.forEach(f => { try { f(pc); } catch (e) {} }); },
    choose(ev, idx, win) {
      const q = A.S.queue.find(x => x.ev === ev); if (!q) return null;
      A.S.queue = [q].concat(A.S.queue.filter(x => x !== q));
      const v = A.eventView(q); const vi = v.choices.findIndex(c => c.i === idx);
      const ch = A.chance; if (win != null) A.chance = () => win;
      try { A.eventChoose(vi); } finally { A.chance = ch; }
      const t = q.result && q.result.text; A.eventClose(); return { text: t, view: v };
    },
  };
};

export default {
  async siegeOutside(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const out = {};
      for (const [k, idx, win] of [['mine', 0, true], ['storm', 1, true], ['ring', 2, null], ['latrines', 3, null]]) {
        const { pc, P } = SGT.outside(61);
        P.sgSick = 30;
        SGT.month(pc);
        const queued = A.S.queue.some(q => q.ev === 'sg_camp');
        const d0 = P.sgd, s0 = P.sgSick;
        const res = SGT.choose('sg_camp', idx, win);
        out[k] = { queued, moved: Math.round((P.sgd - d0) * 10) / 10, sick: P.sgSick - s0, text: res && res.view.text };
      }
      return out;
    });
    const ok = r.mine.queued && r.mine.moved >= 7 && r.storm.moved >= 11 && r.ring.moved > 0 && r.ring.moved < r.mine.moved && r.latrines.sick < 0 && !/\{/.test(r.mine.text);
    return { ok, detail: `days of a 40-day siege brought nearer: mine ${r.mine.moved}, storm ${r.storm.moved}, ring ${r.ring.moved}; latrines sickness ${r.latrines.sick}. "${r.mine.text}"` };
  },

  async siegeInside(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const out = {};
      for (const [k, idx, win] of [['ration', 0, null], ['sortie', 1, true], ['terms', 3, true]]) {
        const { pc, P, enemy } = SGT.inside(62);
        SGT.month(pc);
        const queued = A.S.queue.some(q => q.ev === 'sg_walls');
        const d0 = P.sgd; SGT.choose('sg_walls', idx, win);
        out[k] = { queued, moved: Math.round((P.sgd - d0) * 10) / 10, terms: P.sgTerms };
        if (k === 'terms') { A.occupy(P, enemy); out.fell = A.S.queue.map(q => q.ev).filter(e => /^sg_/.test(e)); }
      }
      // a fall by storm, with no terms
      const { P, enemy } = SGT.inside(63); A.occupy(P, enemy); out.storm = A.S.queue.map(q => q.ev).filter(e => /^sg_/.test(e));
      return out;
    });
    const ok = r.ration.queued && r.ration.moved < 0 && r.sortie.moved <= -7 && r.terms.moved >= 11 && r.terms.terms === 1 && r.fell.includes('sg_terms') && r.storm.includes('sg_sacked');
    return { ok, detail: `days added to the defence: ration ${-r.ration.moved}, sortie ${-r.sortie.moved}; terms bring the fall ${r.terms.moved} days nearer; the fall on terms queues ${r.fell.join(', ')}, by storm ${r.storm.join(', ')}` };
  },

  async siegeSickness(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const { pc, d, P } = SGT.outside(64);
      const men0 = d.men;
      for (let i = 0; i < 6; i++) { A.S.queue = []; A.S.sgAsked = null; SGT.month(pc); }
      return { sick: P.sgSick, lost: men0 - d.men, men0 };
    });
    return { ok: r.sick >= 30 && r.lost > 0, detail: `six months of siege: camp sickness ${r.sick}, the division lost ${r.lost} of ${r.men0} men to it` };
  },

  async siegeEveryMonth(pg) {
    // the choice comes back the next month in the same siege, through the real queue
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const { pc, P } = SGT.outside(69);
      const seen = [];
      for (let m = 0; m < 3; m++) {
        A.S.queue = []; A.S.sgAsked = null; SGT.month(pc);
        const h = A.headReady(); seen.push(h && h.type === 'event' ? h.ev : null);
        if (h && h.ev === 'sg_camp') { A.eventChoose(0); A.eventClose(); }
        A.S.time = (A.S.time || 0) + 31;
      }
      P.sgBy = null; A.S.queue = []; A.S.sgAsked = null;
      A.queue({ type: 'event', ev: 'sg_camp', forced: true, ctx: { loc: P.id, siege: 1 } });
      const after = A.headReady();
      return { seen, after: after && after.ev };
    });
    const ok = r.seen.every(e => e === 'sg_camp') && r.after !== 'sg_camp';
    return { ok, detail: `three months of one siege show: ${r.seen.join(', ')}; once the siege lifts: ${r.after || 'nothing'}` };
  },

  async siegeTaken(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const { pc, d, P } = SGT.outside(65);
      A.occupy(P, d.r);
      const q = A.S.queue.find(x => x.ev === 'sg_taken'), v = q && A.eventView(q);
      return { queued: !!q, text: v && v.text, choices: v && v.choices.length };
    });
    return { ok: r.queued && r.choices === 3 && !/\{/.test(r.text), detail: `the town taken: "${r.text}"` };
  },

  async siegeInARealWar(pg) {
    // a soldier in a real war meets a siege scene within a few years. Across seeds 66-73 a soldier's division is at a
    // siege in about 1 war month in 7 (34 of 240 after cycle 1, 35 of 240 before), so three seeds alone could miss
    const r = await pg.evaluate(() => {
      let seen = null, months = 0;
      for (const seed of [66, 67, 68, 69, 70, 71, 72, 73]) {
        A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 19 });
        A.startWar('POL-01', A.neighbors('POL-01')[0], null, 'conquest'); A.enlist(A.pc());
        for (let m = 0; m < 30 && A.pc().alive && !seen; m++) {
          A.advance(30); months++;
          let g = 0, h;
          while ((h = A.headReady()) && g++ < 300) {
            if (h.type === 'event' && /^sg_/.test(h.ev)) { seen = h.ev; break; }
            if (h.type === 'event') A.eventAuto(); else if (h.type === 'choice') A.choiceChoose(0); else if (h.type === 'battle') A.battleClose();
            else if (h.type === 'duel') { A.duelAuto(h.d); A.duelClose(); } else A.S.queue.shift();
          }
        }
        if (seen) break;
      }
      return { seen, months };
    });
    return { ok: !!r.seen, detail: r.seen ? `${r.seen} after ${r.months} months of war` : `no siege scene in ${r.months} months of war` };
  },
  // cycle 1: !C.child(p) is true for infants (the stage below "child"), so adult siege and chronicle scenes reached
  // babies ("Tend the neighbours yourself" at age 0). They now ask for a teen or an adult; no events file keeps a bare
  // !C.child(p), which tools/lint-events.mjs now warns on.
  async sgNoInfants(pg) {
    const fs = await import('node:fs'), path = await import('node:path'), url = await import('node:url');
    const root = path.join(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');
    const bare = [];
    for (const d of fs.readdirSync(path.join(root, 'features'))) {
      const dir = path.join(root, 'features', d); if (!fs.statSync(dir).isDirectory()) continue;
      for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.events.js'))) {
        for (const line of fs.readFileSync(path.join(dir, f), 'utf8').split('\n'))
          if (/cond:.*!\s*C\.child\(\s*p\s*\)/.test(line) && !/C\.(adult|teen|old|age|ageAdj)\(/.test(line)) bare.push(d + '/' + f);
      }
    }
    const r = await pg.evaluate(() => {
      const ids = ['sg_walls', 'sg_sacked', 'sg_terms', 'wc_bread_since', 'wc_bells_for_ruler', 'wc_sickness_comes', 'wc_old_coin', 'md_lonely_dog'];
      const at = age => { A.newGame({ seed: 3600 + age, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: age }); const pc = A.pc();
        // the stub stands in for the chronicle and mood gates, so only the age is tested
        const C = Object.assign({}, A.C, { chron: () => true, mood: () => true });
        return ids.filter(id => A.EV[id]).map(id => [id, !!A.EV[id].cond(pc, C), A.stage(pc)]); };
      return { baby: at(0), toddler: at(2), teen: at(15), adult: at(30), missing: ids.filter(id => !A.EV[id]) };
    });
    const leak = r.baby.concat(r.toddler).filter(x => x[1]).map(x => x[0]);
    const shut = r.adult.filter(x => !x[1]).map(x => x[0]);
    return { ok: !leak.length && !shut.length && r.teen.filter(x => x[1]).length >= 7 && !bare.length && !r.missing.length,
      detail: `infants (age 0 and 2, stage ${r.baby[0] && r.baby[0][2]}) offered ${leak.join(', ') || 'none'} of ${r.baby.length}; a teen ${r.teen.filter(x => x[1]).length}, an adult ${r.adult.filter(x => x[1]).length}; events files with a bare !C.child(p): ${bare.join(', ') || 'none'}` };
  },
};
