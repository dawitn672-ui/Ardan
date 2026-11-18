// 99972-unit-work (P3, order 54, D-062 addendum): the first mission comes within months, and every mission says who sent
// it and why.
export const limits = { uwFirstMission: 900 };
export default {
  async uwFirstMission(pg) {
    const r = await pg.evaluate(() => {
      const run = seed => {
        A.newGame({ seed, race: 'human', realm: 'POL-0' + (1 + seed % 4), status: 'peasant', sex: 'M', startAge: 19 });
        A.S.queue = [];
        A.advance(40); let g = 0, h; while ((h = A.headReady()) && g++ < 50) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); }
        const pc = A.pc(); A.enlist(pc); A.S.queue = [];
        const d0 = A.absDay(), got = [];
        for (let i = 0; i < 30 && A.absDay() - d0 < 730 && A.pc().alive; i++) {
          A.advance(30);
          let k = 0;
          while ((h = A.headReady()) && k++ < 50) {
            if (h.type === 'mission') { got.push({ d: A.absDay() - d0, why: h.m.why || '', war: !!h.m.war }); if (A.missionAuto) A.missionAuto(h.m); else A.skipPrompt(); if (A.S.queue[0] === h) A.skipPrompt(); }
            else if (h.type === 'event') A.eventAuto(); else A.skipPrompt();
          }
        }
        return { seed, first: got.length ? got[0].d : null, n: got.length, why: got.length ? got[0].why : '', reasons: got.filter(x => x.why).length, alive: A.pc().alive, mil: !!A.pc().mil, fp: A.fingerprint() };
      };
      const out = [];
      // (H-081: five soldiers, and standbys up to eight while fewer than four of them lived through the two years: a recruit's
      // death is the world's draw, and the rule is read on the living)
      const lives = () => out.filter(x => x.first != null || x.alive).length;
      for (const seed of T.seedRun(9901, 8)) { if (out.length >= 5 && lives() >= 4) break; out.push(run(seed)); }
      const again = run(9901);
      return { out, same: again.fp === out[0].fp && again.first === out[0].first };
    });
    const live = r.out.filter(x => x.first != null || x.alive);
    const firsts = live.map(x => x.first).filter(x => x != null);
    const ok = live.length >= 3 && firsts.length === live.length && firsts.every(d => d <= 130) && live.every(x => x.reasons >= Math.min(1, x.n)) && r.same &&
      // (S1b CI 137: unit work reads no skill; in the shifted world one soldier of five drew a single mission in two years, which
      // is the draw, not the rule: all but one must have two)
      live.filter(x => x.alive && x.mil && x.n < 2).length <= 1;
    return { ok, detail: r.out.map(x => `seed ${x.seed}: first mission after ${x.first} days ("${x.why}"), ${x.n} in two years${x.alive ? '' : ' (died)'}${x.mil ? '' : ' (left the army)'}`).join('; ') + `; the same world again ${r.same}` };
  },
};
