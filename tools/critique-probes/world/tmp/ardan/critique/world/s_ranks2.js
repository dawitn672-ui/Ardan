const drain = () => { let h, g = 0; while ((h = A.headReady()) && g++ < 300) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); } };
const P = id => A.S.people[id];
const CO = A.CO;
A.newGame({ seed: 71, race: 'human', realm: 'POL-14', status: 'peasant', sex: 'M', startAge: 18 });
UI.screen = 'game'; UI.tab = 'life'; UI.render();
const pc = A.pc();
const out = { enlist: A.enlist(pc), atWar: A.atWar(pc.realm).length, rows: [] };
A.advance(31); drain();
const my0 = CO.myCompany(pc);
const capPid = my0 && my0.cap && my0.cap.pid;
out.firstCaptain = my0 ? { name: my0.cap.name, pid: capPid, sen: my0.sen && my0.sen.name, senPid: my0.sen && my0.sen.pid } : null;
for (const r of [2, 3, 4, 5, 6, 7]) {
  pc.mil.rank = r;
  try { CO.place(pc); } catch (e) {}
  try { A.wsAttachPC && A.wsAttachPC(); } catch (e) {}
  const my = CO.myCompany(pc), d = pc.mil.div && A.divById(pc.mil.div);
  const old = capPid && P(capPid);
  out.rows.push({ rank: GD.MIL[r].title, promises: GD.MIL[r].leads + ' (' + A.milUnitWord(r) + ')', milTitle: A.milTitle(pc),
    company: my ? `${my.name}: ${my.men} men; captain ${my.cap ? my.cap.name + (my.cap.pc ? ' (YOU)' : '') : '-'}; senior ${my.sen ? my.sen.name + (my.sen.pc ? ' (YOU)' : '') : '-'}` : null,
    division: d ? `${d.name} ${d.men} men, cmd ${d.cmd === pc.id ? 'YOU' : d.cmd ? A.fullName(P(d.cmd)) : 'nobody'}` : null,
    squad: (pc.mil.squad || []).length,
    oldCaptain: old ? `${A.fullName(old)} alive=${old.alive} title="${old.title || ''}" occ="${old.occ || ''}" rel=${pc.rel[old.id] ? pc.rel[old.id].type + '/' + A.relLabel(old, pc.rel[old.id]) : '-'}` : null });
}
// what the Arms place says at Senior Captain
pc.mil.rank = 5; CO.place(pc);
try { UI.tab = 'war'; UI.render(); const t = document.body.innerText; const i = t.search(/Your (command|company)/); out.armsAt5 = i >= 0 ? t.slice(i, i + 700) : t.slice(0, 300); } catch (e) { out.armsAt5 = 'ERR ' + e.message; }
return out;
