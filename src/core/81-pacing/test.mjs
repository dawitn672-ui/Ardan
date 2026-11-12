// Tests for src/core/81-pacing: the quiet-season floor (no stretch past a stage's limit without a prompt, drawn from the
// game's own pool, not in prison or before the first birthday), winter's free days (twice the rate in the dark months,
// not in prison, said in the popover), the one scale for every stat (the rule, what it leaves alone, purity, the roll
// using the number shown, the popover adding up), and bot lives with the feature on and off.
import { BOT } from '../../../tools/bench/bot.mjs';

// a scripted life: answer every prompt as the bot does (first choice, careful odds), log each prompt's day and age
const DRIVE = () => {
  window.PCT = {
    start(o) { A.newGame(Object.assign({ seed: 8101, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F' }, o)); A.S.queue = []; return A.pc(); },
    // play `days` days, answering prompts; returns the absolute days of each prompt and the age at each
    play(days, eng) {
      const out = [], end = A.absDay() + days;
      for (let g = 0; g < 50000 && A.absDay() < end; g++) {
        const pc = A.pc(); if (!pc || !pc.alive) break;
        if (eng) { const k = ['practice', 'pray', 'study', 'make_friend', 'play', 'chores', 'rest'].find(a => GD.ACTIVITIES[a] && A.canAct(a)[0]); if (k) try { A.doActivity(k); } catch (e) {} }
        const r = A.advance(Math.min(31, end - A.absDay()));
        let h, n = 0;
        while ((h = A.headReady()) && n++ < 200) {
          out.push([A.absDay(), A.age(A.pc()), h.type]);
          if (h.type === 'event') { A.eventChoose(0); A.eventClose(); }
          else if (h.type === 'choice') A.choiceChoose(0);
          else if (h.type === 'duel') { A.duelAuto(h.d); A.duelClose(); }
          else if (h.type === 'mission') { A.missionAuto(h.m); if (A.S.queue[0] === h) A.missionClose ? A.missionClose() : A.S.queue.shift(); }
          else if (h.type === 'battle') { A.battleAuto(h.b); if (A.S.queue[0] === h) A.battleClose ? A.battleClose() : A.S.queue.shift(); }
          else A.skipPrompt();
        }
        if (r.why === 'dead') break;
      }
      return out;
    },
    gaps(log, from) { const g = []; let last = from; for (const [d] of log) { g.push(d - last); last = d; } return g; },
  };
};

export default {
  // v2 (99992-v2-time): pcFloor dropped. The quiet-season floor is off (A.PACE.FLOOR_OFF): a scene forced after a quiet stretch is the filler v2 removes; the month's director (0 to 3 with season weights) is v2tBusyMonths.
  // v2 (99992-v2-time): pcFloorLimits dropped. It tested the floor's limits; the floor is off and A.monthEvents is 99992's director (prison and infants are kept there: v2tBusyMonths).
  async pcWinter(pg) {
    await pg.evaluate(DRIVE);
    const r = await pg.evaluate(() => {
      const pc = PCT.start({ startAge: 30 }), S = A.S, rate = d => { S.warClock = d; return A.initiativeRate(pc); };
      const jan = rate(10), jul = rate(190), dec = rate(340), nov = rate(310);
      // a whole year of accrual, adding up the days
      let year = 0; for (let d = 0; d < 365; d++) year += rate(d);
      pc.prison = { y: S.year, until: S.year + 3 }; const prisonJan = rate(10); delete pc.prison;
      // the popover says why
      S.warClock = 10; const tip = UI.TIPS && UI.TIPS.initiative ? UI.TIPS.initiative() : '';
      S.warClock = 190; const tipJul = UI.TIPS && UI.TIPS.initiative ? UI.TIPS.initiative() : '';
      // an infant still has no free days
      const baby = PCT.start({ startAge: 1 }); A.S.warClock = 10; const babyJan = A.initiativeRate(baby);
      return { jan, jul, dec, nov, year, free: A.freeTime(pc), prisonJan, tipWinter: /Winter: the fields sleep/.test(tip), tipSummer: /Winter/.test(tipJul), babyJan };
    });
    const close = (a, b) => Math.abs(a - b) < 1e-9;
    const ok = close(r.jan, 2 * r.jul) && close(r.dec, r.jan) && close(r.nov, r.jul) && r.year > r.free * 1.25 && r.year < r.free * 1.32 &&
      close(r.prisonJan, 2 / 365) && r.tipWinter && !r.tipSummer && r.babyJan === 0;
    return { ok, detail: `free days a year ${r.free}, accrued over a year ${r.year.toFixed(2)}; a day in January ${(r.jan * 365).toFixed(2)}/365, July ${(r.jul * 365).toFixed(2)}/365; prison January ${(r.prisonJan * 365).toFixed(2)}/365; popover winter ${r.tipWinter}, summer ${r.tipSummer}; infant ${r.babyJan}` };
  },

  async pcScale(pg) {
    await pg.evaluate(DRIVE);
    const r = await pg.evaluate(() => {
      const pc = PCT.start({ startAge: 44 }), SC = A.SCALE;
      const odds = (ck, off) => { SC.OFF = !!off; try { return A.checkOdds(pc, ck); } finally { SC.OFF = false; } };
      const cks = { spdSta: { s: 'spd', s2: 'sta', d: 45 }, persWil: { s: 'persuasion', s2: 'wil', d: 45 }, intrigueInt: { s: 'intrigue', s2: 'int', d: 45 }, wilIns: { s: 'wil', s2: 'ins', d: 50 }, noD: { s: 'str', s2: 'int' } };
      const out = {};
      const s0 = JSON.stringify(A.S); let draws = 0; const rand = A.rand; A.rand = function () { draws++; return rand.apply(this, arguments); };
      try { for (const [k, ck] of Object.entries(cks)) out[k] = { shift: Math.round(SC.shift(ck) * 100) / 100, on: odds(ck), off: odds(ck, true), d: ck.d, hasD: 'd' in ck }; }
      finally { A.rand = rand; }
      const same = JSON.stringify(A.S) === s0;
      const fight = { s: 'sword', s2: 'str', d: 50, fight: { scale: 'one', tier: 2, rule: 'yield' } };
      const fightShift = SC.shift(fight), fOn = A.checkOdds(pc, fight), fOff = odds(fight, true);
      return { out, same, draws, fightShift, fOn, fOff };
    });
    const o = r.out, R = { str: 36, spd: 30, ins: 38, sta: 31, int: 33, wil: 56 };
    // each stat side: its weight times the typical seasoned adult's shortfall from 45; a skill side, nothing
    const gap = k => (R[k] != null ? Math.max(0, 45 - R[k]) : 0), sh = (a, b) => 0.6 * gap(a) + 0.4 * gap(b);
    // speed and stamina 14.6, persuasion and will 0, intrigue and intellect 4.8, will and insight 2.8, strength and intellect 10.2
    const want = { spdSta: sh('spd', 'sta'), persWil: sh('persuasion', 'wil'), intrigueInt: sh('intrigue', 'int'), wilIns: sh('wil', 'ins'), noD: sh('str', 'int') };
    const bad = Object.keys(want).filter(k => Math.abs(o[k].shift - want[k]) > 0.01 || o[k].on < o[k].off || (want[k] === 0 && o[k].on !== o[k].off) || (want[k] > 2 && o[k].on <= o[k].off));
    const ok = !bad.length && o.spdSta.d === 45 && !o.noD.hasD && r.same && r.draws === 0 && r.fightShift === 0 && r.fOn === r.fOff;
    return { ok, detail: Object.entries(o).map(([k, v]) => `${k}: shift ${v.shift}, ${v.off}% -> ${v.on}%`).join('; ') + `; written d back ${o.spdSta.d === 45 && !o.noD.hasD}; state unchanged ${r.same}, draws ${r.draws}; fight ${r.fOff}->${r.fOn}` + (bad.length ? ' BAD ' + bad.join(',') : '') };
  },

  async pcScaleRolled(pg) {
    // an event check on a stat the scale eases: the number shown is the number rolled, and the popover adds up to it
    await pg.evaluate(DRIVE);
    const r = await pg.evaluate(() => {
      const pc = PCT.start({ startAge: 40 });
      const pickable = c => c.check && !c.check.fight && !c.req && !c.check.dctx && A.SCALE.shift(c.check) >= 4;
      const evs = Object.values(A.EV).filter(x => !(A.EV_RETIRED && A.EV_RETIRED.has(x.id)) && !x.trigger && (x.choices || []).some(pickable));
      for (const e of evs) {
        const i = e.choices.findIndex(pickable), q = { type: 'event', ev: e.id, ctx: {} };
        A.S.queue = [q];
        let v; try { v = A.eventView(q); } catch (err) { continue; }
        if (!v || v.skip) continue;
        const vi = v.choices.findIndex(c => c.i === i); if (vi < 0 || v.choices[vi].odds == null) continue;
        const shown = v.choices[vi].odds;
        A.SCALE.OFF = true; const off = A.checkOdds(pc, e.choices[i].check); A.SCALE.OFF = false;
        if (shown <= off || shown >= 96) continue;
        let tip = null;
        if (UI.TT && UI.TT.checkParts) { const S = UI.TT.checkParts(pc, e.choices[i].check, q.ctx, shown, q.ev);
          tip = { sum: S.parts.reduce((a, x) => a + Math.round(x[1]), 0), row: (S.parts.find(x => /^One scale for every stat/.test(x[0])) || [''])[0], other: S.parts.some(x => /Other things in play/.test(x[0])) }; }
        const asked = []; const chance = A.chance; A.chance = function (p) { asked.push(p); return chance.apply(this, arguments); };
        try { A.eventChoose(vi); } finally { A.chance = chance; }
        A.S.queue = [];
        return { id: e.id, shown, off, asked, tip, n: evs.length };
      }
      return { none: true, n: evs.length };
    });
    if (r.none) return { ok: false, detail: `no event to try among ${r.n}` };
    const first = r.asked.length ? r.asked[0] : null;
    const tipOk = !r.tip || (Math.abs(r.tip.sum - r.shown) <= 1 && !!r.tip.row && !r.tip.other);
    const ok = first != null && Math.abs(first * 100 - r.shown) < 1e-6 && tipOk;
    return { ok, detail: `${r.id} (one of ${r.n} events with a stat side the scale eases): shown ${r.shown}% (${r.off}% without), rolled at ${first == null ? '-' : Math.round(first * 1000) / 10}%; popover ${r.tip ? `adds to ${r.tip.sum}, row "${r.tip.row}", other ${r.tip.other}` : 'absent'}` };
  },

  async pcLives(pg) {
    // the bot's own lives (tools/bench/bot.mjs), engaged and passive, the feature off and on: prompts a year, initiative
    // actions a year (engaged) and checks won, as tools/bench/run.mjs counts them
    await pg.evaluate(BOT);
    const r = await pg.evaluate(() => {
      const STARTS = [['human', 'POL-01', 'peasant'], ['human', 'POL-05', 'merchant'], ['orc', 'POL-11', 'peasant'], ['human', 'POL-02', 'royal']];
      const PERS = ['reckless', 'random', 'greedy', 'careful'];
      const run = off => {
        A.PACE.OFF = off; A.SCALE.OFF = off;
        let items = 0, years = 0, acts = 0, eyears = 0, c = 0, w = 0;
        try {
          // 16 lives, not 8 (CI run 91). Each world re-rolled with v2's slower war pace, and the first 8 lives' prompts
          // fell 6.72 -> 6.11 a year with the feature on, past the 0.3 bar below; lives 8-15 rose 6.12 -> 6.32 and
          // 16-23 went 6.50 -> 6.36. Over 16 lives 6.42 -> 6.21, over 24 6.45 -> 6.26: one life that dies at 21 in
          // one set and not the other moves 8 lives' rate by half a prompt. Actions rose by 1.1 to 1.3 a year in every
          // block of 8 once 03-engine-fixes stopped "Lend money" standing lit with no coin to lend. The bars are unchanged
          for (let i = 0; i < 16; i++) {
            const [race, realm, status] = STARTS[i % 4];
            const L = B.life({ seed: 8150 + i * 7919, sex: i % 2 ? 'F' : 'M', race, realm, status }, PERS[i % 4], i % 2 === 0, 30);
            items += Object.values(L.items).reduce((a, n) => a + n, 0); years += L.years; c += L.checks; w += L.wins;
            if (L.engaged) { acts += L.actions; eyears += L.years; }
          }
        } finally { A.PACE.OFF = false; A.SCALE.OFF = false; }
        return { prompts: Math.round(10 * items / years) / 10, acts: Math.round(10 * acts / eyears) / 10, rate: Math.round(1000 * w / Math.max(1, c)) / 10, checks: c };
      };
      return { off: run(true), on: run(false) };
    });
    // the win rate compares two sets of lives (on and off play out differently), about 900 checks each over 16 lives: its standard
    // error is about 2.4 points (it is computed below from the counts), so 'on' must be no worse than 'off' beyond twice that (cycle 2: 43.1% against 44.4%,
    // after 43.6% against 41.0% on the build before), and never past 70
    const se = Math.sqrt(r.on.rate * (100 - r.on.rate) / Math.max(1, r.on.checks) + r.off.rate * (100 - r.off.rate) / Math.max(1, r.off.checks));
    // v2 (99992-v2-time): with the floor off, 81 no longer adds prompts (the month's director sets them), so prompts
    // need only not fall; the winter rule's actions and the check scale still must rise
    const ok = r.on.prompts >= r.off.prompts - 0.3 && r.on.acts > r.off.acts && r.on.rate >= r.off.rate - 2 * se && r.on.rate <= 70;
    return { ok, detail: `16 lives, birth to 30. Off: ${r.off.prompts} prompts a year, ${r.off.acts} actions a year (engaged), ${r.off.rate}% of ${r.off.checks} checks; on: ${r.on.prompts}, ${r.on.acts}, ${r.on.rate}% of ${r.on.checks}` };
  },
  // cycle 1 (lives I9): 23 scenes in a noble's first adult year at 17. The world's own scenes stop at 8 in the first
  // adult year, NPC moves at 4; consequences, asked-for and forced scenes are never cut
  async pcFirstYearCap(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 8191, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 17 });
      const ids = Object.keys(A.EV).filter(id => !/^(fp_|lfx_amb_|ga_|cr_)/.test(id)).slice(0, 30);
      const n0 = A.S.queue.length;
      for (const id of ids) A.queue({ type: 'event', ev: id, ctx: {} });
      const world = A.S.queue.length - n0;
      A.queue({ type: 'event', ev: ids[0], forced: true, ctx: {} });
      const forced = A.S.queue.length - n0 - world;
      // a year on, the ceiling is gone
      A.S.pace.fy.d0 -= 400;
      const m = A.S.queue.length; A.queue({ type: 'event', ev: ids[1], ctx: {} });
      const later = A.S.queue.length - m;
      return { world, forced, later, cut: A.S.pace.fy.cut };
    });
    return { ok: r.world === 8 && r.forced === 1 && r.later === 1, detail: `30 world scenes queued in the first adult year: ${r.world} kept (${r.cut} cut); a forced one kept: ${r.forced === 1}; after the year: ${r.later === 1 ? 'kept' : 'cut'}` };
  },
};
