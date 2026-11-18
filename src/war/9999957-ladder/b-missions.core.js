// D11-3: a branch's own missions (CRITIQUE D11: "half the war cards are the branch's own"; D-123).
//
// The release drew a mission's kind from a list at random (A.newMission). The kind is now the commander's choice for his
// reasons, through A.WHY (kind 'mission'): the branch's own work weighs most (the scouts count the enemy and take a
// prisoner who talks; the engineers dig the sap; the train brings the bread up), then what the war asks (a siege when the
// host is at one, holding when the enemy is on home soil, raiding when it attacks), then the rest of the list. A mission
// of the branch's own work is titled with it ("Count the enemy near Camia"). The draw among close options is keyed by
// the soldier and the day, so the world's random stream is not touched.
(function () {
  const L = A.LADDER, MU = A.MUSTER;
  const r2 = x => Math.round(x * 100) / 100;
  const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  L.missionOptions = function (pc, types, war, enemy) {
    const B = MU.B(MU.branchOf(pc)) || {}, own = new Map();
    for (const [phrase, t] of B.mtypes || []) if (!own.has(t)) own.set(t, phrase);
    const m = pc.mil, d = m && m.div && A.divById ? A.divById(m.div) : null, rid = m ? m.realm || pc.realm : pc.realm;
    const soil = war && A.CALLS && A.CALLS.onSoil ? (A.CALLS.onSoil(rid) || {}).men > 0 : false;
    const att = war && A.warSide ? A.warSide(war, rid) === 'att' : false;
    const out = [];
    for (const t of [...new Set(types)]) {
      const rs = [{ kind: 'want', weight: .2, label: 'there is work of every kind', source: { t: 'list' }, pub: 1 }];
      if (own.has(t)) rs.push({ kind: 'duty', weight: 2.2, label: `it is ${B.short}'s work: ${own.get(t)}`, source: { t: 'branch', id: B.id }, pub: 1 });
      if (t === 'siege' && d && d.sieging) rs.push({ kind: 'want', weight: 1.2, label: 'the host is at a siege', source: { t: 'siege' }, pub: 1 });
      if (t === 'hold' && soil) rs.push({ kind: 'fear', weight: .8, label: 'the enemy is on our soil', source: { t: 'soil' }, pub: 1 });
      if ((t === 'raid' || t === 'nightraid') && att) rs.push({ kind: 'want', weight: .5, label: 'we are the ones attacking', source: { t: 'side' }, pub: 1 });
      out.push({ id: t, reasons: rs, phrase: own.get(t) || null });
    }
    return out;
  };
  // { type, title } or null (then the release's own list)
  L.mission = function (pc, types, war, enemy, place) {
    if (!pc || !pc.mil || !Array.isArray(types) || !types.length || !A.WHY) return null;
    const opts = L.missionOptions(pc, types, war, enemy);
    const who = 'cmd:' + (pc.mil.div || pc.mil.company || pc.id);
    // the band lets other work come now and then (a branch is not given only its own, D-123)
    const rec = A.WHY.decide(who, 'mission', opts, { band: 2.3, at: pc.id, r: pc.mil.realm, log: false, rand: MU.rng('ms:' + pc.id + ':' + (A.absDay ? A.absDay() : 0)) });
    if (!rec) return null;
    const o = opts.find(x => x.id === rec.chose);
    const T = A.MISSION_TYPES[rec.chose];
    if (!T) return null;
    return { type: rec.chose, own: !!(o && o.phrase), title: (o && o.phrase ? cap(o.phrase) : T.name) + (place ? ' near ' + place.name : ''), why: rec.why.slice(0, 2).map(x => x[0]) };
  };
})();
