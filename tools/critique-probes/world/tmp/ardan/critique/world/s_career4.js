const drain = () => { let h, g = 0; while ((h = A.headReady()) && g++ < 300) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); } };
const P = id => A.S.people[id];
const CO = A.CO || window.CO;
const out = { coFound: !!CO, steps: [] };
A.newGame({ seed: 31, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 17 });
UI.screen = 'game'; UI.tab = 'life'; UI.render();
const pc = A.pc();
out.enlist = A.enlist(pc);
A.advance(31); drain();
const snap = (tag) => {
  const my = CO && CO.myCompany ? CO.myCompany(pc) : null;
  const d = pc.mil && pc.mil.div ? A.divById(pc.mil.div) : null;
  const rels = Object.entries(pc.rel || {}).filter(([id, r]) => /superior|master|captain|subordinate|comrade|servant/.test(r.type)).map(([id, r]) => `${r.type}: ${A.fullName(P(id))}${P(id).alive ? '' : ' (dead)'} label="${(() => { try { return A.relLabel(P(id), r); } catch (e) { return '?'; } })()}"`);
  return { tag, rank: pc.mil ? GD.MIL[pc.mil.rank].title : null, leads: pc.mil ? GD.MIL[pc.mil.rank].leads : null, unit: pc.mil && pc.mil.unit,
    company: my ? { name: my.name, men: my.men, cap: my.cap ? `${my.cap.name}${my.cap.pc ? ' (YOU)' : ''}` : null, sen: my.sen ? `${my.sen.name}${my.sen.pc ? ' (YOU)' : ''}` : null } : null,
    divCmd: d ? (d.cmd === pc.id ? 'YOU' : d.cmd ? A.fullName(P(d.cmd)) : null) : null, divMen: d ? d.men : null,
    rels, log: (A.S.log[A.S.log.length - 1] && A.S.log[A.S.log.length - 1].lines || []).slice(-3).map(l => String(l[0]).slice(0, 200)) };
};
out.steps.push(snap('enlisted+1m'));
pc.literate = true; pc.fame = 60; pc.skills.command = 100; pc.skills.tactics = 100;
for (let target = 1; target <= 6; target++) {
  let tries = 0;
  while (pc.mil && pc.mil.rank < target && tries++ < 600) {
    const next = GD.MIL[pc.mil.rank + 1];
    pc.mil.merit = Math.max(pc.mil.merit || 0, next.merit + 5); pc.mil.battles = 30; pc.mil.missions = 30; pc.mil.divWins = 5; pc.mil.rankSince = A.absDay() - 4000;
    A.promoCheck(pc);
  }
  out.clock = A.S.clockMode || null; out.steps.push(snap('promoted to ' + target + ' (' + tries + ' tries), same day'));
  A.advance(31); drain();
  if (!pc.alive) break;
  out.steps.push(snap('a month later'));
}
// the War/Arms place text
try { UI.tab = 'war'; UI.render(); const t = document.body.innerText; const i = t.indexOf('Your command'); out.armsText = t.slice(Math.max(0, i - 100), i + 900); } catch (e) { out.armsText = 'ERR ' + e.message; }
return out;
