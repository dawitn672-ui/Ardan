// Tests for features/75-fair-checks: the rule (a typical person of every stage meets a scene as a seasoned adult does,
// never above even from the rule alone), what it leaves alone (seasoned adults, fights, the written difficulty), purity,
// the roll using the number shown, and bot lives: the same lives with the rule on and off.
import { BOT } from '../../bench/bot.mjs';

const SETUP = () => {
  window.FCT = {
    // a person set to the typical values of a band (FC.TYP), at the middle of the band's years
    typical(b, opts) {
      A.newGame({ seed: 7501, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
      A.S.queue = [];
      const pc = A.pc(), T = A.FC.TYP[b], R = GD.RACES.human;
      const age = { child: 9, teen: 14, adult1: 16 + (R.old - 16) / 6, adult2: 16 + (R.old - 16) / 2, adult3: 16 + 5 * (R.old - 16) / 6, old: R.old + 8 }[b];
      pc.born = A.S.year - Math.round(age);
      pc.traits = []; pc.wounds = []; pc.flags.weary = 0;
      if (pc.app) pc.app.build = null;
      // set the base stats so that A.stat (age, traits, wounds, build) reads the typical value
      for (const s of GD.STATS) { pc.st[s] = T[s]; const got = A.stat(pc, s); if (got) pc.st[s] = T[s] * T[s] / got; }
      for (const k in pc.skills) pc.skills[k] = 0;
      if (opts && opts.skill) pc.skills[opts.skill] = opts.level != null ? opts.level : T.skill;
      return pc;
    },
  };
};

export default {
  async fcRule(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const out = [], FC = A.FC;
      for (const b of FC.BANDS) for (const ck of [{ s: 'persuasion', s2: 'wil', d: 45 }, { s: 'str', s2: 'sta', d: 50 }, { s: 'trade', s2: 'int', d: 40 }]) {
        const pc = FCT.typical(b, { skill: ck.s });
        const band = FC.band(pc), on = A.checkOdds(pc, ck);
        FC.OFF = true; const off = A.checkOdds(pc, ck); FC.OFF = false;
        const ref = FCT.typical(FC.REF, { skill: ck.s }), refOdds = A.checkOdds(ref, ck);
        out.push({ b, band, s: ck.s, d: ck.d, on, off, refOdds, ex: FC.explain(FCT.typical(b, { skill: ck.s }), ck) });
      }
      return out;
    });
    // each band reads as its own. By the rule, a typical person of the band meets the check as a typical seasoned
    // adult does (the reference person's own odds), or at even where the gap would take the scene below their typical
    // value; where their typical value is at or above the seasoned adult's, or the scene asks no more than it, nothing moves
    const want = x => (x.ex.tv >= x.ex.ref || x.d <= x.ex.tv ? x.off : x.d - (x.ex.ref - x.ex.tv) >= x.ex.tv ? x.refOdds : 50);
    const bad = r.filter(x => x.band !== x.b || Math.abs(x.on - want(x)) > 2 || x.on < x.off || (x.b === 'adult3' && x.on !== x.off));
    const eased = r.filter(x => x.on > x.off).length;
    return { ok: r.length === 18 && !bad.length && eased >= 8,
      detail: `${eased} of ${r.length} band x check pairs eased; ` + r.map(x => `${x.b} ${x.s} d${x.d}: ${x.off}->${x.on} (seasoned ${x.refOdds})`).join(', ') + (bad.length ? ' BAD ' + JSON.stringify(bad.slice(0, 2)) : '') };
  },

  async fcLeavesAlone(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const pc = FCT.typical('adult1');
      // the written difficulty is back after the call (also when it was absent), and nothing in the state moved
      const c1 = { s: 'persuasion', s2: 'wil', d: 50 }, c2 = { s: 'diplomacy', s2: 'int' };
      const s0 = JSON.stringify(A.S), r0 = A.S.rng;
      let draws = 0; const rand = A.rand; A.rand = function () { draws++; return rand.apply(this, arguments); };
      let o1, o2;
      try { o1 = A.checkOdds(pc, c1); o2 = A.checkOdds(pc, c2); A.FC.explain(pc, c1); } finally { A.rand = rand; }
      const same = JSON.stringify(A.S) === s0;
      // fights roll on fighting worth: a fight spec is not touched
      const fight = { s: 'sword', s2: 'str', d: 50, fight: { scale: 'one', tier: 2, rule: 'yield' } };
      const fOn = A.checkOdds(pc, fight); A.FC.OFF = true; const fOff = A.checkOdds(pc, fight); A.FC.OFF = false;
      // a person far below the typical of their stage (an untrained young adult with weak stats) still meets long odds
      for (const s of GD.STATS) pc.st[s] = 16;
      const hard = A.checkOdds(pc, { s: 'medicine', s2: 'int', d: 55 });
      return { o1, o2, d1: c1.d, hasD2: 'd' in c2, same, draws, fOn, fOff, hard, r0: r0 === A.S.rng };
    });
    const ok = r.d1 === 50 && !r.hasD2 && r.same && r.draws === 0 && r.fOn === r.fOff && r.hard < 15 && r.o1 > 4;
    return { ok, detail: `odds ${r.o1}, ${r.o2}; difficulty restored ${r.d1 === 50 && !r.hasD2}; state unchanged ${r.same}; draws ${r.draws}; fight ${r.fOff}->${r.fOn}; far below typical: ${r.hard}%` };
  },

  async fcRolled(pg) {
    // the roll uses the number on the button, with the rule easing it
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const pc = FCT.typical('adult1', { skill: 'persuasion' });
      const e = Object.values(A.EV).find(x => !(A.EV_RETIRED && A.EV_RETIRED.has(x.id)) && (x.choices || []).some(c => c.check && !c.check.fight && c.check.s === 'persuasion' && !c.req && !c.check.dctx));
      const i = e.choices.findIndex(c => c.check && !c.check.fight && c.check.s === 'persuasion' && !c.req && !c.check.dctx);
      const q = { type: 'event', ev: e.id, ctx: {} };
      A.S.queue = [q];
      const v = A.eventView(q); if (v.skip) return { skip: true, id: e.id };
      const vi = v.choices.findIndex(c => c.i === i), shown = v.choices[vi].odds;
      A.FC.OFF = true; const off = A.checkOdds(pc, e.choices[i].check); A.FC.OFF = false;
      const asked = []; const chance = A.chance; A.chance = function (p) { asked.push(p); return chance.apply(this, arguments); };
      try { A.eventChoose(vi); } finally { A.chance = chance; }
      A.S.queue = [];
      return { id: e.id, shown, off, asked };
    });
    if (r.skip) return { ok: false, detail: `event ${r.id} skipped itself` };
    // the first draw of the choice is the check (other draws come after, from its effects)
    const first = r.asked.length ? r.asked[0] : null;
    const ok = first != null && Math.abs(first * 100 - r.shown) < 1e-6 && r.shown > r.off;
    return { ok, detail: `${r.id}: shown ${r.shown}% (${r.off}% without the rule), rolled at ${first == null ? '-' : Math.round(first * 1000) / 10}% (draws: ${r.asked.map(x => Math.round(x * 1000) / 10).join(', ')})` };
  },

  async fcLives(pg) {
    // the same bot lives (bench/bot.mjs, reckless and random: the personalities that take checks), from 16 for 15 years,
    // with the rule on and off; checks are the bot's own count
    await pg.evaluate(BOT);
    const r = await pg.evaluate(() => {
      const STARTS = [['human', 'POL-01', 'peasant'], ['human', 'POL-01', 'noble'], ['human', 'POL-05', 'merchant'], ['orc', 'POL-11', 'peasant']];
      const run = off => {
        A.FC.OFF = off; let c = 0, w = 0, hard = 0;
        const ch0 = A.eventChoose;
        A.eventChoose = function (idx) { try { const q = A.S.queue[0], v = q && q.type === 'event' && !q.result ? A.eventView(q) : null, vc = v && v.choices[idx]; if (vc && vc.odds != null && vc.odds < 15) hard++; } catch (e) {} return ch0.apply(this, arguments); };
        try {
          for (let i = 0; i < 8; i++) {
            const [race, realm, status] = STARTS[i % 4];
            const L = B.life({ seed: 7510 + i * 7919, sex: i % 2 ? 'F' : 'M', race, realm, status, startAge: 16 }, i < 4 ? 'reckless' : 'random', i % 2 === 0, 15);
            c += L.checks; w += L.wins;
          }
        } finally { A.eventChoose = ch0; A.FC.OFF = false; }
        return { c, w, rate: Math.round(1000 * w / Math.max(1, c)) / 10, hardPct: Math.round(1000 * hard / Math.max(1, c)) / 10 };
      };
      return { off: run(true), on: run(false) };
    });
    const ok = r.on.c >= 150 && r.off.c >= 150 && r.on.rate - r.off.rate >= 5 && r.on.rate <= 70 && r.on.hardPct >= 2;
    return { ok, detail: `rule off: ${r.off.w}/${r.off.c} checks won (${r.off.rate}%), ${r.off.hardPct}% under 15; on: ${r.on.w}/${r.on.c} (${r.on.rate}%), ${r.on.hardPct}% under 15` };
  },
};
