// Learn by doing: every gain has a source, use counts for more than practice, a failed check teaches more than a passed
// one, and each month the story log sums it up.
export default {
  async growSources(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 311, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'M', startAge: 20 });
      const pc = A.pc(); A.S.time = 20;
      const t0 = Object.assign({}, (pc.grow || { tot: {} }).tot);
      A.doActivity('practice', 'sword');
      const t1 = Object.assign({}, pc.grow.tot);
      A.trainSkill(pc, 'persuasion', 2);   // outside any training: use
      const t2 = Object.assign({}, pc.grow.tot);
      A.planDay(pc);
      return { practice: (t1.practice || 0) - (t0.practice || 0), useAfter: (t2.use || 0) - (t1.use || 0), practiceUnchanged: t2.practice === t1.practice };
    });
    return { ok: r.practice > 0 && r.useAfter > 0 && r.practiceUnchanged, detail: JSON.stringify(r) };
  },

  async growFailTeaches(pg) {
    const r = await pg.evaluate(() => {
      const once = win => {
        A.newGame({ seed: 312, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'F', startAge: 20 });
        // a check whose outcomes do not themselves train its skill, so only the check's own lesson counts
        const clean = c => c.check && GD.SKILLS[c.check.s] && [c.win, c.lose].every(b => b && typeof b.fx !== 'function' && !JSON.stringify(b.fx || {}).includes('"' + c.check.s + '"'));
        const pc = A.pc(), e = Object.values(A.EV).find(x => !x.trigger && !x.cond && (x.choices || []).some(clean)) || Object.values(A.EV).find(x => !x.trigger && (x.choices || []).some(clean));
        const ci = e.choices.findIndex(clean), s = e.choices[ci].check.s, before = pc.skills[s] || 0;
        A.S.queue = [{ type: 'event', ev: e.id, ctx: {} }];
        const v = A.eventView(A.S.queue[0]), vi = v.choices.findIndex(c => c.i === ci);
        if (vi < 0) return null;
        const chance = A.chance; A.chance = () => win;   // force the roll
        try { A.eventChoose(vi); } finally { A.chance = chance; }
        A.eventClose();
        return (pc.skills[s] || 0) - before;
      };
      return { pass: once(true), fail: once(false) };
    });
    return { ok: r.pass != null && r.fail > r.pass * 1.3, detail: `skill from a passed check +${r.pass && r.pass.toFixed(2)}, from a failed one +${r.fail && r.fail.toFixed(2)}` };
  },

  async growShareAB(pg) {
    const r = await pg.evaluate(() => {
      const D = Object.assign({}, A.GROW);
      // eight lives a side on each of three shifted random streams: the two sides' lives part ways at the first check
      // that goes differently, and on one stream of eight lives the points-a-year ratio ranged 0.93 to 1.28 by stream alone
      const STREAMS = [0, 1, 3], SEEDS = [5, 6, 7, 8, 9, 10, 11, 12];
      const run = (u, p, f) => {
        Object.assign(A.GROW, { USE: u, PRACTICE: p, FAIL: f });
        let share = 0, pts = 0;
        for (const burn of STREAMS) for (const seed of SEEDS) {
          const hook = () => { for (let i = 0; i < burn; i++) A.rand(); };
          A.onMonth.push(hook);
          try {
          A.newGame({ seed, race: 'human', realm: ['POL-01', 'POL-03'][seed % 2], status: ['peasant', 'artisan'][seed % 2], sex: 'M', startAge: 16 });
          const pc = A.pc(), s0 = Object.values(pc.skills).reduce((a, x) => a + x, 0);
          T.play(15);
          share += A.GROW.useShare(pc) || 0; pts += Object.values(pc.skills).reduce((a, x) => a + x, 0) - s0;
          } finally { A.onMonth.splice(A.onMonth.indexOf(hook), 1); }
        }
        const n = STREAMS.length * SEEDS.length;
        return { share: Math.round(100 * share / n), perYear: Math.round(pts / n / 15 * 10) / 10 };
      };
      const out = { release: run(1, 1, 1), now: run(D.USE, D.PRACTICE, D.FAIL) };
      Object.assign(A.GROW, D);
      return out;
    });
    // the share moves with the lives the other features make: 64-70% across this round's builds, so the bar is 60
    const ok = r.now.share >= 60 && r.now.share > r.release.share + 15 && Math.abs(r.now.perYear / r.release.perYear - 1) <= 0.2;
    return { ok, detail: `share of growth from doing ${r.release.share}% -> ${r.now.share}%; skill points a year ${r.release.perYear} -> ${r.now.perYear}` };
  },

  async growSummary(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 313, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'M', startAge: 20 });
      T.play(1);
      const lines = A.S.log.flatMap(e => e.lines || []).filter(l => /^This season you got better at/.test(l[0]));
      return { n: lines.length, sample: lines[0] && lines[0][0], cls: lines[0] && lines[0][1] };
    });
    return { ok: r.n >= 2 && r.n <= 5 && /from doing/.test(r.sample || '') && r.cls === 'muted', detail: `${r.n} seasonal summaries in a year; "${r.sample}"` };
  },
};
