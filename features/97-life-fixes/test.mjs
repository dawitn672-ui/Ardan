// Tests for features/97-life-fixes. Each fails on a build without the feature (A.LF is missing, or the old behaviour
// shows) and passes with it.
import { BOT } from '../../bench/bot.mjs';

const need = () => (window.A && A.LF ? null : 'A.LF is missing: the feature is not in this build');

export default {
  // 1. Repeats: the share of the scenes a life shows that it had already shown, over everything the player sees
  //    (rolls, duties, flows, NPC moves, a superior's scenes, gatherings, activities), with the feature off and on in
  //    one build, the same lives. And the pace must hold.
  async lfRepeats(pg) {
    await pg.evaluate(BOT);
    const r = await pg.evaluate(() => {
      if (!A.LF) return { err: 'A.LF is missing: the feature is not in this build' };
      const run = (off, o, years) => {
        A.LF.OFF = off;
        try {
          const L = B.life(o, 'random', true, years), pc = A.P(A.S.pc), sh = A.LF.share(pc), cs = A.LF.caseShare(pc);
          const prompts = Object.values(L.items).reduce((a, n) => a + n, 0);
          const m = pc.evN || {};
          return { shown: sh.shown, rep: sh.repeats, crep: cs.repeats, prompts, years: L.years, master: m.fl_st_master || 0, conf: m.du_ch_confession || 0 };
        } finally { A.LF.OFF = false; }
      };
      const lives = [
        { seed: 9701, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'M', startAge: 16 },
        { seed: 9702, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 16 },
        { seed: 9703, race: 'human', realm: 'POL-05', status: 'merchant', sex: 'M', startAge: 16 },
      ];
      const sum = side => lives.map(o => run(side === 'off', o, 40)).reduce((a, x) => ({ shown: a.shown + x.shown, rep: a.rep + x.rep, crep: a.crep + x.crep, prompts: a.prompts + x.prompts, years: a.years + x.years,
        master: Math.max(a.master, x.master), conf: Math.max(a.conf, x.conf) }), { shown: 0, rep: 0, crep: 0, prompts: 0, years: 0, master: 0, conf: 0 });
      const off = sum('off'), on = sum('on');
      const pct = x => Math.round(1000 * x.rep / Math.max(1, x.shown)) / 10, cpct = x => Math.round(1000 * x.crep / Math.max(1, x.shown)) / 10, py = x => Math.round(10 * x.prompts / Math.max(1, x.years)) / 10;
      return { off: Object.assign(off, { pct: pct(off), cpct: cpct(off), perYear: py(off) }), on: Object.assign(on, { pct: pct(on), cpct: cpct(on), perYear: py(on) }) };
    });
    if (r.err) return { ok: false, detail: r.err };
    const ok = r.on.pct <= 15 && r.off.pct >= 20 && r.on.perYear >= 6 && r.on.perYear >= r.off.perYear * 0.9 && r.on.master <= 1 && r.on.conf <= 1;
    return { ok, detail: `seen before this life: off ${r.off.pct}% of ${r.off.shown} scenes, on ${r.on.pct}% of ${r.on.shown} (the same case again: off ${r.off.cpct}%, on ${r.on.cpct}%); prompts a year off ${r.off.perYear}, on ${r.on.perYear}; most "An old scholar" in a life: off ${r.off.master}, on ${r.on.master}; most confessions: off ${r.off.conf}, on ${r.on.conf}` };
  },

  // 1b. The doors themselves: a story scene comes once, a duty twice and twelve years apart, and a held-back slot is
  //     refilled with a scene the life has never seen.
  async lfDoors(pg) {
    const r = await pg.evaluate(() => {
      if (!A.LF) return { err: 'A.LF is missing: the feature is not in this build' };
      const LF = A.LF;
      A.newGame({ seed: 9711, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 24 });
      const pc = A.pc();
      pc.job = { c: 'clergy', r: 1, y: 3, perf: 60 }; pc.literate = true;
      const out = { confession: 0, study: 0, master: 0, refills: 0, freshRefill: true };
      // eighty months of clergy duties and study breakthroughs, the clock moving a month at a time
      for (let i = 0; i < 80; i++) {
        A.S.queue = [];
        A.dutyEvent(pc); A.flowEvent(pc, 'study');
        for (const q of A.S.queue.slice()) {
          if (q.type !== 'event') continue;
          if (q.ev === 'du_ch_confession') out.confession++;
          if (q.ev === 'fl_st_master') out.master++;
          const e = A.EV[q.ev];
          if (e && !e.duty && !e.flow) { out.refills++; if (LF.n(pc, q.ev) > 0) out.freshRefill = false; }
          A.S.queue = [q].concat(A.S.queue.filter(x => x !== q));
          if (A.headReady() === q) { A.eventChoose(0); A.eventClose(); }
          A.S.queue = A.S.queue.filter(x => x !== q);
        }
        const end = A.absDay() + 31;
        for (let g = 0; g < 60 && A.absDay() < end && A.pc().alive; g++) { A.S.queue = []; A.advance(end - A.absDay()); }
        A.S.queue = [];
      }
      // a duty seen twice is held back for the rest of the life; the policy is read straight
      const duty = A.EV.du_ch_tithe, n0 = LF.n(pc, duty.id);
      pc.evN = pc.evN || {}; pc.flags.ev = pc.flags.ev || {};
      pc.evN[duty.id] = 2; pc.flags.ev[duty.id] = A.S.year - 30;
      const held = LF.weight(duty, pc) === 0;
      pc.evN[duty.id] = 1; pc.flags.ev[duty.id] = A.S.year - 5;
      const tooSoon = LF.weight(duty, pc) === 0;
      pc.evN[duty.id] = 1; pc.flags.ev[duty.id] = A.S.year - 13;
      const later = LF.weight(duty, pc) > 0;
      return Object.assign(out, { held, tooSoon, later, n0, stats: A.S.lf && A.S.lf.by });
    });
    if (r.err) return { ok: false, detail: r.err };
    const ok = r.confession <= 1 && r.master <= 1 && r.refills > 0 && r.freshRefill && r.held && r.tooSoon && r.later;
    return { ok, detail: `80 months of clergy duties and study: confession ${r.confession}, "An old scholar" ${r.master}, fresh refills ${r.refills} (all unseen: ${r.freshRefill}); a duty seen twice held: ${r.held}, seen 5 years ago held: ${r.tooSoon}, 13 years ago allowed: ${r.later}; refills by door ${JSON.stringify(r.stats)}` };
  },

  // 1c. The second tellings of NPC moves render with a real person, keep to the diet, and every choice plays
  async lfVariants(pg) {
    const r = await pg.evaluate(() => {
      if (!A.LF) return { err: 'A.LF is missing: the feature is not in this build' };
      const ids = Object.keys(A.EV).filter(id => /^lfx_.*_2$/.test(id));
      const RAW = /\{[A-Za-z0-9_.]+\}/, w = s => (String(s || '').match(/\S+/g) || []).length;
      const rendered = new Set(), problems = [];
      for (const o of [{ seed: 9761, status: 'noble', startAge: 30 }, { seed: 9762, status: 'merchant', startAge: 40 }, { seed: 9763, status: 'peasant', startAge: 25 }]) {
        A.newGame(Object.assign({ race: 'human', realm: 'POL-01', sex: o.seed % 2 ? 'F' : 'M' }, o));
        T.play(4); if (!A.pc().alive) continue;
        const base = A.serialize();
        for (const id of ids) {
          for (let i = 0; i < 4; i++) {
            A.deserialize(JSON.parse(base)); A.S.queue = [];
            const q = { type: 'event', ev: id, ctx: { npcMove: true } }; A.S.queue.push(q);
            let v; try { v = A.eventView(q); } catch (e) { problems.push(id + ': view throws ' + e.message); break; }
            if (v.skip) break;
            if (i === 0) {
              rendered.add(id);
              const all = [v.title, v.text, ...v.choices.map(c => c.t)].join(' | ');
              if (RAW.test(all)) problems.push(id + ': raw token ' + all.match(RAW)[0]);
              if (w(v.text) > 80) problems.push(id + ': ' + w(v.text) + ' words');
              if (/(^|[.!?]\s+)(he|she|his|her|him)\b/.test(v.text)) problems.push(id + ': a sentence starts in lower case');
            }
            const idx = v.choices.findIndex(c => c.i === i); if (idx < 0) continue;
            try { A.eventChoose(idx); A.eventClose(); } catch (e) { problems.push(id + ' choice ' + (i + 1) + ': ' + e.message); }
          }
        }
      }
      // the family: the second telling is what the queue gives once the first has been seen
      A.newGame({ seed: 9764, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 30 });
      const pc = A.pc(); pc.evN = { ni_gift: 1 }; pc.flags.ev = pc.flags.ev || {}; pc.flags.ev.ni_gift = A.S.year - 12; A.S.queue = [];
      A.queue({ type: 'event', ev: 'ni_gift', ctx: { npcMove: true } });
      const second = A.S.queue.length ? A.S.queue[A.S.queue.length - 1].ev : null;
      // and the kind is then done for the life
      pc.evN.lfx_ni_gift_2 = 1; pc.flags.ev.lfx_ni_gift_2 = A.S.year - 11;
      const held = A.LF.held(A.EV.ni_gift, pc);
      return { n: ids.length, rendered: rendered.size, missing: ids.filter(id => !rendered.has(id)), problems, second, held };
    });
    if (r.err) return { ok: false, detail: r.err };
    const ok = r.n >= 15 && r.rendered >= r.n - 2 && !r.problems.length && r.second === 'lfx_ni_gift_2' && r.held;
    return { ok, detail: `${r.n} second tellings, ${r.rendered} rendered with a real person (not: ${r.missing.join(', ') || 'none'}); problems: ${r.problems.slice(0, 4).join('; ') || 'none'}; after one gift the queue gives ${r.second}; after both the kind is held: ${r.held}` };
  },

  // 2. Hints follow the life: a life begun at birth in 1105 sees the adult hints when it comes of age (1121)
  async lfHints(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 9721, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 0 });
      UI.set.hints = true; UI.set.hintsSeen = { whatnow: 1, plan: 1, clock: 1, save: 1 };
      const pc = A.pc();
      // grow her up (the hints read age and the calendar, nothing else)
      A.S.year += 16; A.S.time = 3;
      const H = UI.hintFor('life', pc);
      // a tab's hint the first time the tab is opened, at 16
      const H2 = UI.hintFor('people', pc);
      return { year: A.S.year, age: A.age(pc), id: H && H.id, people: H2 && H2.id, on: UI.hintsOn() };
    });
    const ok = r.on && (r.id === 'initiative' || r.id === 'tips') && r.people === 'people';
    return { ok, detail: `in ${r.year}, aged ${r.age}: hints on ${r.on}, the Life tab's hint "${r.id}", the People tab's "${r.people}"` };
  },

  // 3. Ambitions: chosen at coming of age, kept where C.ambition reads it, shown with a next step; the five orphaned
  //    scenes can fire again
  async lfAmbition(pg) {
    const r = await pg.evaluate(() => {
      if (!A.LF || !A.LF.AMB) return { err: 'no ambitions in this build' };
      const out = {};
      A.newGame({ seed: 9731, race: 'human', realm: 'POL-05', status: 'serf', sex: 'M', startAge: 16 });
      A.S.queue = [];
      A.LF.ambMonth(A.pc());
      const q = A.S.queue.find(x => x.ev === 'lfx_amb_young');
      out.asked = !!q;
      if (q) {
        A.S.queue = [q];
        const v = A.headReady() && A.eventView(q);
        out.offers = v ? v.choices.map(c => c.t) : [];
        const i = v ? v.choices.findIndex(c => /freedom/i.test(c.t)) : -1;
        if (i >= 0) { A.eventChoose(i); A.eventClose(); }
      }
      const pc = A.pc();
      out.amb = pc.amb && pc.amb.k;
      out.cAmbition = A.C.ambition(pc, 'freedom');
      out.card = UI.lfAmbCard(pc);
      // the five scenes the release could never show: each one's condition, for a life it was written for
      const conds = {};
      pc.coin = 70;
      for (const id of ['pa_freedom_buy', 'pa_freedom_kind_master']) conds[id] = !!(A.EV[id] && A.EV[id].cond(pc, A.C));
      // a ruler: the reign's question offers expand, a golden age, a web of alliances
      A.newGame({ seed: 9732, race: 'human', realm: 'POL-02', status: 'royal', sex: 'F', startAge: 30 });
      const k = A.pc(), r0 = Object.values(A.S.realms).find(x => x.alive && A.P(x.ruler) && A.P(x.ruler).alive && x.id === k.realm) || Object.values(A.S.realms).find(x => x.alive);
      k.ruler = r0.id; A.S.queue = [];
      A.LF.ambMonth(k);
      const q2 = A.S.queue.find(x => /^lfx_amb_/.test(x.ev));
      out.reign = q2 ? (q2.ctx || {}).when : null;
      for (const key of ['expand', 'golden', 'web']) {
        A.LF.setAmb(k, key);
        const id = { expand: 'pa_expand_petition', golden: 'pa_golden_harvest', web: 'pa_web_marriage' }[key];
        let c = false; try { c = !!A.EV[id].cond(k, A.C); } catch (e) { c = 'error ' + e.message; }
        conds[id] = c;
      }
      out.conds = conds;
      out.retired = ['pa_freedom_buy', 'pa_freedom_kind_master', 'pa_expand_petition', 'pa_golden_harvest', 'pa_web_marriage'].filter(id => A.EV_RETIRED && A.EV_RETIRED.has && A.EV_RETIRED.has(id));
      return out;
    });
    if (r.err) return { ok: false, detail: r.err };
    const fires = Object.values(r.conds).filter(x => x === true).length;
    const ok = r.asked && r.amb === 'freedom' && r.cAmbition && /Next:/.test(r.card) && r.reign === 'reign' && fires >= 4 && r.conds.pa_freedom_buy === true && !r.retired.length;
    return { ok, detail: `asked at 16: ${r.asked} (${(r.offers || []).join(' / ')}); chose ${r.amb}; C.ambition ${r.cAmbition}; card has a next step: ${/Next:/.test(r.card)}; a new ruler is asked: ${r.reign}; scenes that can fire now: ${JSON.stringify(r.conds)}; retired: ${r.retired.join(',') || 'none'}` };
  },

  // 4. Every disabled control says why: a peasant of 20 and a noble of 30, every tab
  async lfDisabled(pg) {
    const r = await pg.evaluate(() => {
      const res = { disabled: 0, none: 0, kinds: {}, sample: [] };
      for (const o of [{ seed: 9741, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 }, { seed: 9742, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 30 }]) {
        T.enter(o); T.play(1);
        for (const t of T.tabs()) {
          UI.tab = t; UI.render();
          for (const b of document.querySelectorAll('button[disabled],select[disabled],input[disabled]')) {
            res.disabled++;
            const why = (b.getAttribute('title') || '').trim() || b.getAttribute('data-tip') || b.getAttribute('data-tt');
            if (!why) { res.none++; const k = (b.getAttribute('data-a') || '?') + ':' + t; res.kinds[k] = (res.kinds[k] || 0) + 1; }
            else if (res.sample.length < 6 && /mktBuy|decide|orderJoin|applyJob|buyProp/.test(b.getAttribute('data-a') || '')) res.sample.push(b.getAttribute('data-a') + ': ' + why);
          }
        }
      }
      return res;
    });
    return { ok: r.disabled > 20 && r.none === 0, detail: `${r.disabled} disabled controls, ${r.none} without a reason ${JSON.stringify(r.kinds)}; e.g. ${r.sample.join(' | ')}` };
  },

  // 5. Money matters late: a fortune finds big works, each costs, lasts, is a deed and opens a scene
  async lfWorks(pg) {
    const r = await pg.evaluate(() => {
      if (!A.LF || !A.LF.WORKS) return { err: 'no great works in this build' };
      A.newGame({ seed: 9751, race: 'human', realm: 'POL-01', status: 'merchant', sex: 'M', startAge: 40 });
      const pc = A.pc(); pc.coin = 400000; pc.fame = 45; A.S.queue = [];
      const shown = A.decisionsFor(pc).map(d => d.k).filter(k => /^lfx_/.test(k));
      const dearest = A.LF.dearest(pc);
      const piety0 = pc.piety || 0, c0 = pc.coin;
      const a = A.decide('lfx_chantry'), b = A.decide('lfx_ship'), c = A.decide('lfx_patent');
      const spent = c0 - pc.coin;
      const status = pc.status, rung = pc.noble && pc.noble.rung;
      const sched = (A.S.sched || []).map(x => x.item && x.item.ev).filter(Boolean).filter(id => /^lfx_wk_/.test(id));
      const deeds = (pc.deeds || []).map(d => d.t).filter(t => /chantry|ship|patent/i.test(t));
      // a year passes: the chantry's priests, the ship's voyage
      const p1 = pc.piety; A.S.year++; A.LF.worksYear(pc);
      // a poor peasant's tab is not filled with what it cannot afford
      A.newGame({ seed: 9752, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      const poor = A.decisionsFor(A.pc()).map(d => d.k).filter(k => /^lfx_/.test(k));
      return { shown, dearest, ok3: [a.ok, b.ok, c.ok], spent, status, rung, sched, deeds, pietyUp: pc.piety > p1 || p1 >= 100, piety0, poor };
    });
    if (r.err) return { ok: false, detail: r.err };
    const ok = r.shown.length >= 8 && r.dearest >= 50000 && r.ok3.every(Boolean) && r.spent >= 12000 + 30000 + 20000 && r.status === 'gentry' && r.rung === 0 &&
      r.sched.length >= 2 && r.deeds.length === 3 && r.pietyUp && r.poor.length === 0;
    return { ok, detail: `a fortune of 400,000 sees ${r.shown.length} works (dearest ${r.dearest}); chantry, ship, patent: ${r.ok3}, spent ${r.spent}; now ${r.status} (rung ${r.rung}); scenes to come ${r.sched.join(', ')}; deeds ${r.deeds.length}; a year's piety from the chantry: ${r.pietyUp}; a poor peasant sees ${r.poor.length}` };
  },

  // 6. The first life is not lost in the cradle (Story and Hard), later lives and Realism keep canon's odds
  async lfFirstLife(pg) {
    const r = await pg.evaluate(() => {
      if (!A.LF || !A.LF.shielded) return { err: 'no first-life shield in this build' };
      const die5 = (first, n, seed0) => {
        let dead = 0;
        for (let i = 0; i < n; i++) {
          A.newGame({ seed: seed0 + i, race: 'human', realm: 'POL-07', status: 'serf', sex: i % 2 ? 'F' : 'M', startAge: 0, diff: 'hard', firstLife: first });
          const pc = A.pc();
          T.play(5);
          if (!pc.alive) dead++;
        }
        return dead;
      };
      const N = 40;
      const canon = die5(false, N, 97600), first = die5(true, N, 97600);
      // the rules themselves: the year's death chance, and a fever that runs health to nothing
      A.newGame({ seed: 97010, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 0, diff: 'hard', firstLife: true });
      let pc = A.pc(); pc.born = A.S.year - 2;
      const shieldedChance = A.deathChance(pc);
      pc.health = 0; pc.lastHurt = 'a fever';
      const survives = A.mortalCheck(pc, 'a fever') === false && pc.alive && pc.health > 0;
      A.newGame({ seed: 97010, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 0, diff: 'hard' });
      pc = A.pc(); pc.born = A.S.year - 2;
      const canonChance = A.deathChance(pc);
      // a sibling is not shielded
      A.newGame({ seed: 97011, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 0, diff: 'hard', firstLife: true });
      const sib = Object.values(A.S.people).find(p => p.id !== A.S.pc && p.alive && A.age(p) < 5);
      const sibShield = sib ? A.LF.shielded(sib) : false;
      A.newGame({ seed: 97001, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 0, diff: 'realism', firstLife: true });
      const realismShield = !!(A.S.lf && A.S.lf.shield);
      // the creation screen says it once, and not after the first life has begun
      UI.set.lfLives = 0; UI.A.newLife(); UI.step = 3; UI.render();
      const says = /spared the deaths of early childhood/.test(document.body.innerHTML);
      UI.set.lfLives = 1; UI.render();
      const saysLater = /spared the deaths of early childhood/.test(document.body.innerHTML);
      UI.screen = 'title'; UI.render();
      return { N, canon, first, shieldedChance, canonChance, survives, sibShield, realismShield, says, saysLater };
    });
    if (r.err) return { ok: false, detail: r.err };
    const ok = r.first === 0 && r.shieldedChance === 0 && r.canonChance > 0 && r.survives && !r.sibShield && !r.realismShield && r.says && !r.saysLater;
    return { ok, detail: `${r.N} serf newborns on Hard to age 5: ${r.canon} die as before, ${r.first} as a first life; a toddler's yearly death chance ${r.canonChance.toFixed(4)} -> ${r.shieldedChance} shielded; a fever at 0 health: survives ${r.survives}; a sibling shielded: ${r.sibShield}; Realism shields: ${r.realismShield}; the creation screen says so: ${r.says} (and not on a later life: ${!r.saysLater})` };
  },

  // 7. A choice shows its cost and what failing brings; drawing it changes nothing
  async lfStakes(pg) {
    const r = await pg.evaluate(() => {
      if (!A.LF || !A.LF.stake) return { err: 'no stakes in this build' };
      T.enter({ seed: 9771, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
      A.defEvents([{ id: 'lfx_test_stakes', trigger: true, title: 'A test', text: 'A test scene.', choices: [
        { t: 'Pay his rent', r: 'Paid.', fx: { coin: -30 } },
        { t: 'Apologise for the wrong', check: { s: 'persuasion', s2: 'wil', d: 45 }, win: { r: 'Yes.', fx: { happy: 2 } }, lose: { r: 'No.', fx: { health: -10, coin: -5, them: { op: -8 } } } },
        { t: 'Walk away', r: 'Gone.', fx: {} }] }]);
      A.S.queue = [{ type: 'event', ev: 'lfx_test_stakes', forced: true }];
      A.headReady();
      const rng0 = A.rngState, h0 = T.hash(A.S);
      UI.render();
      const html = (document.querySelector('#modal') || document.body).innerHTML;
      const stakes = [...document.querySelectorAll('.lf-stake')].map(x => x.textContent);
      const pure = A.rngState === rng0 && T.hash(A.S) === h0;
      A.S.queue = []; delete A.EV.lfx_test_stakes; UI.render();
      return { stakes, pure, has: html.includes('lf-stake') };
    });
    if (r.err) return { ok: false, detail: r.err };
    const ok = r.pure && r.stakes.some(s => /Costs 30 suns/.test(s)) && r.stakes.some(s => /If it fails: hurt, −5 suns, their regard/.test(s)) && r.stakes.length === 2;
    return { ok, detail: `stake lines: ${JSON.stringify(r.stakes)}; drawing them left the state and the random stream alone: ${r.pure}` };
  },

  // the views this feature adds are pure, and a save from before it plays on
  async lfPureAndOld(pg) {
    const r = await pg.evaluate(() => {
      if (!A.LF) return { err: 'A.LF is missing: the feature is not in this build' };
      T.enter({ seed: 9781, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 30 });
      T.play(3);
      const pc = A.pc(); pc.coin = 90000;
      A.S.queue = [];
      const rng0 = A.rngState, h0 = T.hash(A.S);
      T.renderAll();
      const pure = A.rngState === rng0 && T.hash(A.S) === h0;
      // an old save: no memory, no life record, no ambition, no works
      delete pc.evN; delete A.S.lf; delete pc.amb; delete pc.lfWorks;
      const s = T.play(4);
      return { pure, s, share: A.LF.share(A.pc()).shown };
    });
    if (r.err) return { ok: false, detail: r.err };
    return { ok: r.pure && r.share > 0, detail: `every tab drawn: state and random stream unchanged ${r.pure}; an old save played on (${r.s}), ${r.share} scenes counted since` };
  },
};
