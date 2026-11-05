// 99999-v2-content, part 6: who a soldier's officer is to him (playtest 2, old #11 and #15).
//
// 9999-advisors puts "your master" in the ring from the rel types mentor, master, patron and superior. A soldier's
// officer is a 'superior' (9999 itself writes that rel for the captain it seats), so an orc commander's captain sat in
// the ring as "YOUR MASTER" and said, on a siege, "Your name in the trade is your fortune." (L2, eleven cards). One
// captain read both "YOUR CAPTAIN" and "YOUR MASTER".
//
// Here a life under arms with no trade of its own hears an officer as a captain: a 'master' candidate who is a
// soldier, or a superior of the ranks, becomes 'captain' (war counsel, a captain's wants). If the ring already has a
// captain, he is not seated twice. A master of a trade (the boss at work, a craft mentor) is left as he is.
// Pure: it reads the candidates 9999 works out; the ring that refresh builds from them is the engine's own step.
(function () {
  const ADV = A.ADV;
  if (!ADV || typeof ADV.candidates !== 'function') return;
  const C2 = A.V2C = A.V2C || {};
  C2.officerNotMaster = function (pc, t) {
    if (!pc || !pc.mil || !t) return false;
    if (pc.job && pc.job.boss === t.id) return false;          // the master at work
    const r = pc.rel && pc.rel[t.id];
    return !!t.mil || !!(r && r.type === 'superior');
  };
  const cand0 = ADV.candidates;
  ADV.candidates = function (pc) {
    const out = cand0.apply(this, arguments);
    try {
      if (!pc || !pc.mil || !Array.isArray(out)) return out;
      let hasCaptain = out.some(c => c.role === 'captain');
      const keep = [];
      for (const c of out) {
        if (c.role === 'master' && C2.officerNotMaster(pc, A.P(c.id))) {
          if (hasCaptain) continue;
          keep.push(Object.assign({}, c, { role: 'captain', pri: Math.max(c.pri, 78) }));
          hasCaptain = true;
        } else keep.push(c);
      }
      return keep.sort((x, y) => y.pri - x.pri || (x.id < y.id ? -1 : 1));
    } catch (e) { console.error('v2 content advisors', e); return out; }
  };
})();
