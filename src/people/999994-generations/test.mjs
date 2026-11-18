// 999994-generations: the unknown die by their bodies and their years, the houses marry and bear children, the
// people stay about as many as the world began with, no one outlives his people's greatest age, posts and titles pass
// with one holder, the game's stream is untouched, and a death in the household goes to the year's digest, not a card.
export default {
  // a life of 60 years: deaths of the unknown, marriages and births in the houses, no one past his span, one holder per
  // post and title, people within bounds read from measured lives
  async genGenerations(pg) {
    const r = await pg.evaluate(() => {
      const res = T.trySeeds([7, 11, 31], seed => {
        T.enter({ seed, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 20 });
        const n0 = Object.values(A.S.people).filter(p => p.alive).length, d0 = A.MORT.stats.died, w0 = A.HOUSES_GO_ON.stats.wed, b0 = A.HOUSES_GO_ON.stats.births;
        const pts = [];
        for (let k = 0; k < 3; k++) {
          if (T.play(20) === 'dead') {
            const pc = A.pc(), h = ((pc && pc.children) || []).map(A.P).filter(q => q && q.alive)[0] || Object.values(A.S.people).find(q => q.alive && A.age(q) >= 16 && A.age(q) <= 30);
            if (!h) return null;
            A.continueAs(h.id); UI.ov = null;
          }
          const past = (A.COHERENCY.checks.find(c => c.name === 'alive past the greatest age') || { fn: () => ['no check'] }).fn();
          pts.push({ year: A.S.year, alive: Object.values(A.S.people).filter(p => p.alive).length, past: past.length, pastEx: past[0] || '',
            posts: A.POSTS && A.POSTS.audit ? A.POSTS.audit({ strict: true }).length : 0, titles: A.V2F && A.V2F.audit ? A.V2F.audit().length : 0 });
        }
        return { n0, pts, died: A.MORT.stats.died - d0, wed: A.HOUSES_GO_ON.stats.wed - w0, births: A.HOUSES_GO_ON.stats.births - b0 };
      });
      return res;
    });
    if (!r.res) return { ok: false, detail: `no line lasted 60 years in worlds ${r.tried.join(', ')}` };
    const x = r.res, last = x.pts[x.pts.length - 1];
    // measured (seeds 7, 11, 31; 60 years): the living rise from about 1,000 to 1,600-1,750 in the first decades as the
    // houses' unmarried marry and bear children, then hold (1,700 to 1,830 at years 100 to 200, seed 7). Before (no deaths):
    // 1,250 at year 50 and 1,770 at 100, still rising, a third of them past their span.
    const ok = x.pts.every(p => !p.past && !p.posts && !p.titles) && x.died >= 200 && x.wed >= 100 && x.births >= 100 && last.alive <= 2.4 * x.n0 && last.alive >= 0.8 * x.n0;
    return { ok, detail: `seed ${r.seed}: ${x.n0} living at the start; ` + x.pts.map(p => `${p.year}: ${p.alive} living, ${p.past} past their span${p.pastEx ? ' (' + p.pastEx + ')' : ''}, post faults ${p.posts}, title faults ${p.titles}`).join('; ') +
      `; ${x.died} of the unknown died, ${x.wed} marriages, ${x.births} births` };
  },

  // the passes draw nothing from the game's stream; the same seed gives the same deaths, marriages and births
  async genPure(pg) {
    const r = await pg.evaluate(() => {
      const run = () => {
        T.enter({ seed: 4411, race: 'human', realm: 'POL-02', status: 'noble', sex: 'F', startAge: 20 });
        T.play(6);
        const k0 = A.rngState, d = A.MORT.year(), h = A.HOUSES_GO_ON.year();
        return { pure: A.rngState === k0, d: d.join(','), h: JSON.stringify(h), fp: A.fingerprint() };
      };
      const a = run(), b = run();
      return { pure: a.pure && b.pure, same: a.fp === b.fp && a.d === b.d && a.h === b.h, n: a.d.split(',').filter(Boolean).length, h: a.h };
    });
    return { ok: r.pure && r.same && r.n > 0, detail: `stream untouched ${r.pure}; the same twice ${r.same}; ${r.n} died in the extra pass, houses ${r.h}` };
  },

  // a parent who reaches his people's greatest age dies at the year's turn, through A.kill; the year's digest says "A death
  // in the household", and the pass queues no card the release's own way to a parent's death (A.kill, as A.familyYear
  // kills) does not (a custom of mourning may ask about the estate, either way); an unmet grandparent's death is told
  async genHouseholdDeath(pg) {
    const r = await pg.evaluate(() => {
      const res = T.trySeeds(T.seedRun(9523, 6), seed => {
        const set = () => {
          T.enter({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 9 });
          if (T.play(1) === 'dead') return null;   // a year after the world's opening (its elders have a grace, a-deaths)
          const pc = A.pc(), f = A.P((pc.parents || [])[0]);
          if (!f || !f.alive) return null;
          f.born = A.S.year - GD.RACES[f.race].maxLife - 1;   // past his span at once
          return A.MORT.pastSpan(f) ? { pc, f, q0: A.S.queue.length } : null;
        };
        // the release's way: A.kill
        const a = set(); if (!a) return null;
        A.kill(a.f, 'old age');
        const viaKill = A.S.queue.slice(a.q0).filter(q => q.type === 'event').map(q => q.ev).sort().join(',');
        // the pass
        const b = set(); if (!b) return null;
        const pc = b.pc, f = b.f;
        const snap = { wounds: (pc.wounds || []).length, ill: !!pc.ill, adult: !!(A.isAdult && A.isAdult(pc)), war: !!(A.V2T.atWar && A.V2T.atWar(pc)), kin: A.V2Y.household(pc), pc: pc.id };
        A.MORT.year();
        const viaPass = A.S.queue.slice(b.q0).filter(q => q.type === 'event').map(q => q.ev).sort().join(',');
        // an unmet blood kinsman two steps away (a grandparent, an uncle) told in the story
        let told = null;
        const kin = (A.HH && A.HH.kinAround ? A.HH.kinAround(pc, 2) : []).filter(q => q.alive && !pc.rel[q.id] && q.id !== f.id);
        if (kin.length) {
          const g = kin[0]; g.born = A.S.year - GD.RACES[g.race].maxLife - 1; A.MORT.year();
          const L = A.S.log[A.S.log.length - 1].lines.map(l => (l && l[0]) || '');
          told = { dead: !g.alive, line: L.find(t => /^Word comes that your/.test(t)) || '' };
        }
        return { dead: !f.alive, cause: f.cause, changed: A.V2Y.changed ? A.V2Y.changed(pc, snap) : 'n/a', viaKill, viaPass, told };
      });
      return res;
    });
    if (!r.res) return { ok: false, detail: `no life with a living father in worlds ${r.tried.join(', ')}` };
    const x = r.res;
    const ok = x.dead && /death in the household/i.test(x.changed) && x.viaPass === x.viaKill && (!x.told || (x.told.dead && !!x.told.line));
    return { ok, detail: `seed ${r.seed}: the father died (${x.cause}); the digest reads "${x.changed}"; cards queued by the pass [${x.viaPass}], by A.kill [${x.viaKill}]; ` +
      (x.told ? `an unmet kinsman: dead ${x.told.dead}, "${x.told.line}"` : 'no unmet kinsman within two steps in this world') };
  },
};
