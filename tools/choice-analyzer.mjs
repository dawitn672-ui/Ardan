// The in-page analysis behind tools/lint-choices.mjs, shared with bench/run.mjs and features/33-choices/test.mjs.
// Pass it to page.evaluate with a list of event ids, or null for every event.
export function analyzeChoices(only) {
  // what a player wants more of (+) and less of (-); each skill counts on its own
  const GOOD = ['coin', 'coinPct', 'happy', 'fame', 'honor', 'piety', 'health', 'looks', 'str', 'spd', 'ins', 'sta', 'int', 'wil', 'family',
    'rep', 'merit', 'favor', 'stability', 'treasury', 'legit', 'authority', 'realmStab', 'realmGold'];
  const BAD = ['infamy'];
  const PAIN = ['wound', 'prison', 'punish', 'die'];   // present at all = bad
  const vec = fx => {
    if (fx == null) return {};
    if (typeof fx === 'function') return null;   // can't read it
    const v = {};
    for (const k of GOOD) if (typeof fx[k] === 'number') v[k] = fx[k];
    for (const k of BAD) if (typeof fx[k] === 'number') v[k] = -fx[k];
    for (const k of PAIN) if (fx[k] != null && fx[k] !== false && fx[k] !== 0) v[k] = -1;
    // each skill is its own count: more tactics is not more logistics, so a choice between them is a real one
    if (fx.skill && typeof fx.skill === 'object') for (const [k, x] of Object.entries(fx.skill)) v['skill.' + k] = +x || 0;
    if (fx.them && typeof fx.them === 'object' && typeof fx.them.op === 'number') v.op = fx.them.op;
    // the four needs of 35-moods
    if (fx.need && typeof fx.need === 'object') for (const [k, x] of Object.entries(fx.need)) v['need.' + k] = +x || 0;
    return v;
  };
  const story = fx => fx && typeof fx === 'object' ? ['trait', 'untrait', 'event', 'newRel', 'rel', 'job', 'epithet', 'deed', 'secret', 'lover', 'letter', 'cause', 'mission', 'duel', 'beast', 'asset', 'gear', 'sworn', 'pact', 'claim', 'ally', 'warOn']
    .filter(k => fx[k] != null).map(k => k + ':' + JSON.stringify(fx[k])).sort().join('|') : '';
  const out = { events: 0, compared: 0, unreadable: 0, flagged: [] };
  for (const id in A.EV) {
    if (only && !only.includes(id)) continue;
    const e = A.EV[id], cs = e.choices || [];
    if (cs.length < 2) continue;
    out.events++;
    const sc = [];
    let ok = true;
    for (const c of cs) {
      if (c.group) { ok = false; break; }
      if (c.check) {
        const w = vec((c.win || {}).fx), l = vec((c.lose || {}).fx);
        if (!w || !l) { ok = false; break; }
        // the odds of a typical character (skill 45): each point of difficulty is 1.6%, as in A.checkOdds
        const pw = Math.min(0.96, Math.max(0.04, 0.5 + (45 - (c.check.d || 45)) * 0.016));
        const v = {}; for (const k of new Set([...Object.keys(w), ...Object.keys(l)])) v[k] = pw * (w[k] || 0) + (1 - pw) * (l[k] || 0);
        sc.push({ v, risky: true, story: story((c.win || {}).fx) + '/' + story((c.lose || {}).fx), t: c.t });
      } else {
        const v = vec(c.fx); if (!v) { ok = false; break; }
        sc.push({ v, risky: false, story: story(c.fx), t: c.t });
      }
    }
    if (!ok) { out.unreadable++; continue; }
    // choices that differ in story (flags, traits, follow-ups) are not compared by numbers
    if (new Set(sc.map(x => x.story)).size > 1) continue;
    out.compared++;
    const keys = [...new Set(sc.flatMap(x => Object.keys(x.v)))];
    if (!keys.length) continue;
    const ge = (a, b) => keys.every(k => (a.v[k] || 0) >= (b.v[k] || 0)), gt = (a, b) => keys.some(k => (a.v[k] || 0) > (b.v[k] || 0));
    for (const [i, a] of sc.entries()) {
      const others = sc.filter((_, j) => j !== i);
      if (others.every(b => ge(a, b) && gt(a, b)) && (!a.risky || sc.every(b => b.risky))) {
        const r2 = x => Math.round((x || 0) * 100) / 100;
        out.flagged.push({ id, best: a.t, why: keys.map(k => `${k} ${r2(a.v[k])} vs ${others.map(b => r2(b.v[k])).join('/')}`).join('; ') });
        break;
      }
    }
  }
  return out;
}
