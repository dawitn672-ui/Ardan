// Learn by doing (Road to Ten, Character 2). The release grew skills mostly from the daily training plan (about 30
// points a year) and barely from using them (1.5 a check). Every gain now has a source, practice or use, and use counts
// for more: a check you fail teaches more than one you pass, and the training plan gives less. Each month the story log
// sums up what you got better at, and from where.
//
// Engine side: A.trainSkill is wrapped; the source comes from what is running (the daily plan and the training
// activities are practice, everything else is use). Pure arithmetic, no draws.
(function () {
  const G = A.GROW = {
    USE: 1.2,        // gains from use (events, work, fights, battles) are worth this much more
    PRACTICE: 0.4,   // and the daily training plan and training activities this much (total growth stays near the release's)
    FAIL: 1.5,       // a failed check teaches more than a passed one (on top of USE)
    src: null,       // 'practice' while a training activity or the daily plan runs
  };
  const PRACTICE = new Set(['practice', 'train_yard', 'run', 'lift', 'study', 'meditate', 'school', 'spar', 'learn_lang']);
  const withSrc = (src, f, self, args) => { const o = G.src; G.src = src; try { return f.apply(self, args); } finally { G.src = o; } };

  const planDay = A.planDay;
  A.planDay = function () { return withSrc('practice', planDay, this, arguments); };
  const doActivity = A.doActivity;
  A.doActivity = function (key) { return withSrc(PRACTICE.has(key) ? 'practice' : 'use', doActivity, this, arguments); };
  const train = A.trainSkill;
  A.trainSkill = function (p, k, amt) {
    const pc = A.S && A.S.pc && p && p.id === A.S.pc;
    if (!pc || !(amt > 0)) return train.apply(this, arguments);
    const src = G.src || 'use';
    const g = train.call(this, p, k, amt * (src === 'practice' ? G.PRACTICE : G.USE));
    if (g > 0) {
      // one summary a season, not a month: twelve lines a year about training buried the year's real story in the log
      // (seen on a playtest pass). An old save's month key simply differs, and its last month is summed up once.
      const S = A.S, key = S.year * 4 + Math.floor((A.today ? A.today() : 0) / 91.25);
      const G2 = p.grow = p.grow && typeof p.grow === 'object' ? p.grow : { m: key, k: {}, tot: { practice: 0, use: 0 } };
      if (G2.m !== key) { G.summary(p, G2); G2.m = key; G2.k = {}; }
      const e = G2.k[k] || (G2.k[k] = { practice: 0, use: 0 });
      e[src] += g; G2.tot[src] = (G2.tot[src] || 0) + g;
    }
    return g;
  };
  // a check trains its skill inside eventChoose, before the result is known; a failed one is topped up here, when the
  // event closes, by the difference between a failed and a passed check
  const close = A.eventClose;
  A.eventClose = function () {
    const q = A.S.queue[0];
    try {
      const pc = A.pc(), e = q && q.type === 'event' && A.EV[q.ev];
      if (pc && e && q.result && q.result.success === false && q._choice != null) {
        const c = e.choices[q._choice]; const s = c && c.check && c.check.s;
        if (s && GD.SKILLS[s]) withSrc('use', () => A.trainSkill(pc, s, 1.5 * (G.FAIL - 1)), null, []);
      }
    } catch (err) { console.error('learn by doing', err); }
    return close.apply(this, arguments);
  };
  // remember which choice was taken, for the failure bonus above
  const choose2 = A.eventChoose;
  A.eventChoose = function (idx) {
    const q = A.S.queue[0];
    const r = choose2.apply(this, arguments);
    try { if (q && q.view && q.view.choices && q.view.choices[idx]) Object.defineProperty(q, '_choice', { value: q.view.choices[idx].i, configurable: true }); } catch (err) {}
    return r;
  };
  for (const k of ['variety']) if (choose2[k]) A.eventChoose[k] = choose2[k];

  // the season's summary: what you got better at, and how much came from doing it
  G.summary = function (p, G2) {
    const rows = Object.entries(G2.k).map(([k, v]) => [k, v.practice + v.use, v.use]).filter(x => x[1] >= 0.3).sort((a, b) => b[1] - a[1]);
    if (!rows.length || p.id !== A.S.pc) return;
    const tot = rows.reduce((a, x) => a + x[1], 0), use = rows.reduce((a, x) => a + x[2], 0);
    const fmt = x => `${GD.SKILLS[x[0]]} +${(Math.round(x[1] * 10) / 10).toFixed(1)}`;
    A.log(`This season you got better at ${rows.slice(0, 3).map(fmt).join(', ')}${rows.length > 3 ? ` and ${rows.length - 3} more` : ''}. ` +
      `${Math.round(100 * use / tot)}% of it from doing, the rest from practice.`, 'muted');
  };
  // the share of all growth that came from use, for the bench and the profile
  G.useShare = p => { const t = p && p.grow && p.grow.tot; return t && (t.use + t.practice) > 0 ? t.use / (t.use + t.practice) : null; };
})();
