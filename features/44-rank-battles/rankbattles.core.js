// Every rank's battle moves the war (Road to Ten, War 1: "every rank has battle choices that move the result 10-20%").
//
// When the player's division fights on the war map, the release asks him to take part by rank: a soldier fights the
// line battle (four choices: deploy, the arrows, the clash, the break), an officer fights a full tactical battle
// (wings, tactics, the reserve), a general takes the map fight itself. But the first two only nudged the map fight by
// a fixed amount (enemy order -12%, ours +8%; a failure cost our order 5-15%), whatever happened. Measured over 30
// real fights frozen at their start, none of those nudges changed a single result: the side won 73% of the time with
// or without them.
//
// Measured on the same fights, what does move a map fight is the order (organisation) of the divisions in it:
// enemy order -30% wins 80%, ours -30% wins 60%. So now the result of the player's part is a performance from -1 to +1
// (the line battle's grade; the tactical battle's winner and its exchange of dead), and each layer turns it into order
// for both sides, sized so that a layer's best against its worst moves the map fight by about 10-20 points.
//
// Engine side: A.missionClose (patched) and A.BATTLE_END.wsPart call A.RANKFX.apply. The log line only reports.
(function () {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const RB = A.RANKFX = {
    // share of each division's full order moved per unit of performance: up (+) to theirs and ours, down (-) to ours.
    // The section's were raised by 30% for the integrated world: pooled over 300 fights it moved 9 points, now 13.
    // Round 7 raised them 20% more: 38-orders' bold generals stand longer in a fight, and the section read 8-9 on 100.
    LAYERS: {
      line: { name: 'your section', theirs: 0.31, ours: 0.11, fall: 0.35 },
      part: { name: 'your company', theirs: 0.36, ours: 0.13, fall: 0.33 },
    },
    GRADE: { triumph: 1, success: 0.5, mixed: 0, failure: -0.8 },
  };
  // a line battle's performance: its grade
  RB.perfLine = m => (m && RB.GRADE[m.result] != null ? RB.GRADE[m.result] : 0);
  // a tactical battle's performance: who won, and by how much in dead
  RB.perfBattle = function (B) {
    if (!B || !B.sides) return 0;
    const me = B.pcSide, foe = me === 'A' ? 'B' : 'A';
    const live = k => (B.sides[k].units || []).reduce((a, u) => a + (u.status === 'gone' ? 0 : u.men || 0), 0);
    const lostMe = Math.max(0, B.sides[me].men0 - live(me)), lostFoe = Math.max(0, B.sides[foe].men0 - live(foe));
    const edge = 0.25 * Math.log2((lostFoe + 50) / (lostMe + 50));
    if (B.winner === me) return clamp(0.5 + edge, 0.25, 1);
    if (B.winner === 'draw' || !B.winner) return clamp(edge, -0.4, 0.4);
    return clamp(-0.5 + edge, -1, -0.25);
  };
  // turn a performance into order for both sides of the map fight
  RB.apply = function (key, layer, perf) {
    const S = A.S, pc = A.pc(), L = RB.LAYERS[layer];
    if (!L || !pc || !pc.mil || typeof perf !== 'number') return null;
    const pid = +String(key).replace(/^F/, ''), F = (S.fights || {})[pid];
    if (!F) return null;
    const myR = pc.mil.realm, p = clamp(perf, -1, 1);
    for (const id of F.aIds.concat(F.dIds)) {
      const d = A.divById(id); if (!d) continue;
      const mo = A.divMaxOrg(d), ours = !A.hostile(d.r, myR);
      if (p > 0) d.org = ours ? Math.min(mo, d.org + mo * L.ours * p) : Math.max(0, d.org - mo * L.theirs * p);
      else if (p < 0 && ours) d.org = Math.max(0, d.org - mo * L.fall * -p);
    }
    F.rank = { layer, perf: Math.round(p * 100) / 100 };
    const P = S.prov[pid], at = P ? ` at ${P.name}` : '';
    if (p >= 0.25) A.log(`What ${L.name} did${at} reached the whole fight: their line wavered${p >= 0.75 ? ' and gave' : ''}.`, 'good');
    else if (p <= -0.25) A.log(`What happened to ${L.name}${at} reached the whole fight: your side's line sagged where it gave.`, 'bad');
    return F.rank;
  };
  // the officer's tactical battle
  A.BATTLE_END = A.BATTLE_END || {};
  A.BATTLE_END.wsPart = function (B, key) { RB.apply(key, 'part', RB.perfBattle(B)); };
  // the soldier's line battle (called from A.missionClose)
  A.rankResult = function (key, layer, m) { return RB.apply(key, layer, RB.perfLine(m)); };
})();
