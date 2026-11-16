// One life played by code with the coherency checks run as it goes: shared by tools/coherency.mjs (any number of lives
// and years, the nightly run) and tests/suites/coherency.test.mjs (the quick run CI holds to its baseline).
// The page must be booted with tests/helpers.mjs (window.T). Deterministic: the same build and job give the same
// findings, and the checks themselves are held pure (no change to A.S, no draw from the stream) at every audit.

// every class and the paths the owner plays: born a peasant, a noble who joins the army, a soldier, a royal heir...
export const STARTS = [
  { status: 'peasant', startAge: 0, sex: 'M', realm: 'POL-01' },
  { status: 'noble', startAge: 16, sex: 'M', realm: 'POL-03', enlist: true },
  { status: 'peasant', startAge: 17, sex: 'M', realm: 'POL-06', enlist: true },
  { status: 'noble', startAge: 20, sex: 'F', realm: 'POL-01' },
  { status: 'merchant', startAge: 25, sex: 'M', realm: 'POL-04' },
  { status: 'royal', startAge: 18, sex: 'M', realm: 'POL-02' },
  { status: 'serf', startAge: 20, sex: 'F', realm: 'POL-05' },
  { status: 'artisan', startAge: 30, sex: 'M', realm: 'POL-20', race: 'dwarf' },
];
// the jobs of a run: `seeds` rounds over STARTS, each life its own seed
export const jobsFor = (seeds, starts = STARTS) => {
  const jobs = [];
  for (let s = 0; s < seeds; s++) for (const st of starts) jobs.push({ seed: 7100 + s * 13 + jobs.length, ...st });
  return jobs;
};

// in the page: play the life `years` years, running every check at the start and every `every` years. Returns
// { o, found: [{ year, age, check, owner, n, problems }], impure: [...], end, alive }
export async function runLife(page, j, { years, every, only = null }) {
  return page.evaluate(async ([j, YEARS, EVERY, ONLY]) => {
    const o = { seed: j.seed, race: j.race || 'human', realm: j.realm, status: j.status, sex: j.sex, startAge: j.startAge };
    T.enter(o);
    const found = [], impure = [];
    const check = () => {
      const k0 = A.rngState, h0 = T.hash(A.S);
      const f = A.COHERENCY.run(ONLY);
      if (A.rngState !== k0 || T.hash(A.S) !== h0) impure.push(A.S.year);
      for (const x of f) found.push({ year: A.S.year, age: A.pc() ? A.age(A.pc()) : null, ...x });
    };
    check();
    // a soldier's life: take the enlisting offer when it comes (the bot would refuse it as often as not)
    const enlist = () => { if (!j.enlist || !A.pc() || A.pc().mil) return; const h = A.headReady(); if (!h || h.type !== 'event') return;
      const v = A.eventView(h); const k = v && v.choices ? v.choices.findIndex(c => /enlist|join|take the coin|sign|swear/i.test(c.t || c.label || '')) : -1; if (k >= 0) { A.eventChoose(k); A.eventClose(); } };
    for (let y = 0; y < YEARS; y += EVERY) {
      const r = T.play(Math.min(EVERY, YEARS - y), { each: enlist });
      check();
      if (r === 'dead') break;
    }
    return { o, found, impure, end: A.S.year, alive: !!(A.pc() && A.pc().alive) };
  }, [j, years, every, only]);
}

// findings -> { check: total problems } over a set of lives
export const countsOf = lives => {
  const c = {};
  for (const r of lives) for (const f of r.found || []) c[f.check] = (c[f.check] || 0) + f.n;
  return Object.fromEntries(Object.entries(c).sort());
};

// counts against a baseline section: what rose (a failure), what fell (the baseline can be lowered), what is new
export function compare(counts, base) {
  const rose = [], fell = [];
  for (const k of new Set([...Object.keys(counts), ...Object.keys(base || {})])) {
    const n = counts[k] || 0, b = (base || {})[k] || 0;
    if (n > b) rose.push(`${k}: ${n} (baseline ${b})`);
    else if (n < b) fell.push(`${k}: ${n} (baseline ${b})`);
  }
  return { rose, fell };
}
