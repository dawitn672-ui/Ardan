const log = [];
const snap = (pc, tag) => {
  const r = A.realm(pc.mil ? pc.mil.realm : pc.realm) || A.realm(pc.realm);
  const P = A.P;
  const d = pc.mil && pc.mil.div && A.divById ? A.divById(pc.mil.div) : null;
  const armies = (A.S.armies || []).filter(a => a.realm === r.id || a.rid === r.id || a.owner === r.id);
  const myArmies = (A.S.armies || []).filter(a => a.gen === pc.id).map(a => a.name + ' (' + (a.divs || []).length + ' divs, ' + (A.armyMen ? A.armyMen(a) : '?') + ' men)');
  const marshalId = r.council && r.council.marshal;
  const others = Object.values(A.S.people).filter(p => p.alive && p.id !== pc.id && (p.office === 'marshal' || /marshal/i.test(p.title || '')) && (p.realm === r.id)).map(p => ({ id: p.id, name: A.fullName(p), office: p.office, title: p.title }));
  return {
    tag, year: A.S.year, rank: pc.mil ? pc.mil.rank : null, rankTitle: pc.mil ? GD.MIL[pc.mil.rank].title : null, milTitle: A.milTitle ? A.milTitle(pc) : null,
    unit: pc.mil && pc.mil.unit, div: d ? { id: d.id, name: d.name, cmd: d.cmd, men: d.men || (d.str ? JSON.stringify(d.str).slice(0, 60) : null) } : null,
    army: pc.mil && pc.mil.army, myArmies, nArmiesRealm: armies.length, squad: pc.mil && pc.mil.squad ? pc.mil.squad.length : null,
    company: pc.company ? pc.company.name : null, office: pc.office || null, pcTitle: pc.title,
    councilMarshal: marshalId ? (marshalId === pc.id ? 'PC' : marshalId + ' ' + A.fullName(P(marshalId)) + ' office=' + (P(marshalId) || {}).office + ' alive=' + (P(marshalId) || {}).alive) : null,
    otherMarshals: others,
    lastLog: (A.S.log || []).slice(-4).map(l => (typeof l === 'string' ? l : (l.t || l.text || JSON.stringify(l))).slice(0, 220)),
  };
};
const out = { runs: [] };
for (const [seed, war] of [[31, false], [32, true]]) {
  A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 17 });
  UI.screen = 'game'; UI.tab = 'life'; UI.render();
  const pc = A.pc();
  const run = { seed, war, steps: [] };
  const en = A.enlist(pc);
  run.enlist = en && (en.msg || en.ok);
  run.marshalBefore = A.realm('POL-01').council.marshal;
  const oldM = A.P(run.marshalBefore);
  run.oldMarshal = oldM ? { id: oldM.id, name: A.fullName(oldM), office: oldM.office, title: oldM.title } : null;
  if (war) {
    try { const w = A.declareWar ? A.declareWar('POL-01', 'POL-11', {}) : null; run.warStart = w ? (w.ok === false ? w.msg : 'ok') : 'none'; } catch (e) { run.warStart = 'ERR ' + e.message; }
    run.atWar = A.atWar('POL-01').length;
    A.advance(20);
    let h, g = 0; while ((h = A.headReady()) && g++ < 50) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); }
  }
  run.steps.push(snap(pc, 'enlisted'));
  pc.literate = true; pc.fame = 90;
  pc.skills = pc.skills || {};
  for (let target = 1; target <= 9; target++) {
    let tries = 0;
    while (pc.mil && pc.mil.rank < target && tries++ < 400) {
      const next = GD.MIL[pc.mil.rank + 1];
      pc.mil.merit = Math.max(pc.mil.merit || 0, next.merit + 5);
      pc.mil.battles = 30; pc.mil.missions = 30; pc.mil.divWins = 5; pc.mil.armyWins = 5; pc.mil.wins = 30;
      for (const k of ['command', 'tactics', 'leadership', 'strategy']) { if (GD.SKILLS[k]) pc.skills[k] = 100; }
      pc.mil.rankSince = (A.absDay ? A.absDay() : 0) - 4000;
      A.promoCheck(pc);
    }
    run.steps.push(snap(pc, 'target ' + target + ' after ' + tries + ' tries'));
    if (tries >= 400) { run.board = JSON.stringify(A.promoBoard(pc)).slice(0, 800); break; }
  }
  // the War screen as the owner sees it
  try { UI.tab = 'war'; UI.render(); run.warText = document.body.innerText.slice(0, 1500); } catch (e) { run.warText = 'ERR ' + e.message; }
  try { UI.tab = 'life'; UI.render(); } catch (e) {}
  // leave the post
  const rs = A.resign ? A.resign() : null;
  run.resign = rs && (rs.msg || rs.ok);
  run.steps.push(snap(pc, 'after resign'));
  // a year later
  A.advance(365); { let h, g = 0; while ((h = A.headReady()) && g++ < 200) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); } }
  if (A.pc() && A.pc().alive) run.steps.push(snap(A.pc(), 'a year after resign'));
  out.runs.push(run);
}
return out;
