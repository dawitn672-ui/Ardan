// X5, the state diet (docs/IOS_ROADMAP.md §7.7, rule 21: no data that grows forever; D-104 to D-106).
//
// tools/bench/state-size.mjs measured what grows with the years. Two records grew without bound and are read by no
// later reason, so they are compacted here, each year and on load:
//
//   the story log   S.log keeps every line of every year of every life (600 years before its cap), about 2.3 KB a
//                   year. A chapter of the Chronicle (a decade of one life's age) that closed more than KEEP_LOG years
//                   ago keeps the lines the Chronicle's book keeps of it (A.chronicleKeep: the ten weightiest of the
//                   life's own and three of the world's) and every line of the classes "big" and "death"; every other
//                   line becomes 0, a mark that takes its place (so a line's index, which the book's wording is
//                   hashed from, and every count of lines stay as they were). The book reads the same, word for word.
//   former lives    a player character who died keeps the machinery of a life being played (the memory of choices,
//                   counts of scenes seen, the skills' records, the atlas, the advisers, the purse ...): 60 to 120 KB
//                   each. A year after the death (the heir has inherited what passes at A.continueAs, the death's
//                   year-end, endings and hall have read it), DEAD_PC_FIELDS are removed. Every reader of them reads the
//                   living player (A.pc()) or guards a missing field; what the dead are still read for (name, kin,
//                   stats and skills for the person view, renown, deeds, flags, the beliefs he held) is kept.
//
// Nothing here draws from A.rand or reads the clock, and both passes are idempotent and monotone, so compacting a state
// once on load gives the same state as compacting it every year of play (the test dietSameAsPlayed holds this).
// DIET.OFF stops it (the tests compare a life played with and without it).
(function () {
  const D = A.DIET = A.DIET || {};
  D.KEEP_LOG = 40;           // years of story kept whole
  D.DEAD_PC_YEARS = 1;       // years after a former player's death before his record is trimmed
  D.LOG_KEEP_CLS = new Set(['big', 'death']);
  // player-only fields of a life (each read only of A.pc(), or guarded where read of a person p)
  D.DEAD_PC_FIELDS = ['mw', 'evC', 'evN', 'ec', 'npci', 'retry', 'arcs', 'skr', 'skl', 'skm', 'atlas', 'adv', 'deedLog',
    'traitWhy', 'traitLog', 'staffPool', 'riPurse', 'coMem', 'idv'];
  D.stats = { lines: 0, fields: 0 };

  // the story log: a chapter closed long ago keeps what the book keeps of it
  D.log = function (S) {
    const L = S && S.log; if (!Array.isArray(L) || !L.length || !A.chronicleLives || !A.chronicleKeep) return 0;
    const cut = (+S.year || 0) - D.KEEP_LOG, lives = A.chronicleLives(L);
    let n = 0;
    for (let li = 0; li < lives.length; li++) {
      const life = lives[li], ch = life.chapters;
      for (let ci = 0; ci < ch.length; ci++) {
        const [k, es] = ch[ci];
        const closed = ci < ch.length - 1 || li < lives.length - 1;
        if (!closed || !(es[es.length - 1].year <= cut)) continue;
        // a chapter already compacted keeps only kept lines: nothing to do
        const keep = new Set(A.chronicleKeep(life.pc, k, es).map(x => x.e.lines[x.i]));
        for (const e of es) {
          const ls = e.lines; if (!Array.isArray(ls)) continue;
          for (let i = 0; i < ls.length; i++) {
            const l = ls[i];
            if (l === 0 || keep.has(l) || (Array.isArray(l) && D.LOG_KEEP_CLS.has(l[1]))) continue;
            ls[i] = 0; n++;
          }
        }
      }
    }
    return n;
  };

  // former lives: the machinery of play, a year after the death
  D.deadPcs = function (S) {
    const P = S && S.people; if (!P) return 0;
    let n = 0;
    for (const id in P) {
      const p = P[id];
      if (!p || p.alive || p.npc !== false || id === S.pc || p.died == null || (+S.year || 0) - p.died < D.DEAD_PC_YEARS) continue;
      for (const f of D.DEAD_PC_FIELDS) if (f in p) { delete p[f]; n++; }
    }
    return n;
  };

  D.compact = function (S, why) {
    S = S || A.S; if (D.OFF || !S) return null;
    const r = { lines: 0, fields: 0 };
    try { r.lines = D.log(S); } catch (e) { console.error('state diet: log', e); }
    try { r.fields = D.deadPcs(S); } catch (e) { console.error('state diet: former lives', e); }
    D.stats.lines += r.lines; D.stats.fields += r.fields;
    D.last = { why: why || 'year', year: S.year, lines: r.lines, fields: r.fields };
    return r;
  };

  // each year, after the year's other passes (the release's A.deserialize calls it on load, see 03-engine-base.js)
  (A.onYear = A.onYear || []).push(function () { D.compact(A.S, 'year'); });
})();
