const drain = () => { let h, g = 0; while ((h = A.headReady()) && g++ < 300) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); } };
const P = id => A.S.people[id];
A.newGame({ seed: 71, race: 'human', realm: 'POL-14', status: 'peasant', sex: 'M', startAge: 18 });
const pc = A.pc(); A.enlist(pc); A.advance(31); drain();
const my = A.CO.myCompany(pc);
const sup = A.superior(pc);
const out = {
  cmdr: sup ? `${sup.id} ${A.fullName(sup)} milRank=${sup.milRank} (${GD.MIL[sup.milRank] ? GD.MIL[sup.milRank].title : '?'}) occ="${sup.occ || ''}"` : null,
  superiorTitle: A.superiorTitle ? A.superiorTitle(pc) : null,
  companyCaptain: my && my.cap ? `${my.cap.pid || '(seed)'} ${my.cap.name}` : null,
  senior: my && my.sen ? `${my.sen.pid || '(seed)'} ${my.sen.name}` : null,
  rels: Object.entries(pc.rel).filter(([id, r]) => !['father', 'mother', 'sibling', 'grandparent', 'uncle', 'inlaw', 'cousin'].includes(r.type)).map(([id, r]) => `${id} ${A.fullName(P(id))}: ${r.type} -> "${A.relLabel(P(id), r)}" occ="${P(id).occ || ''}"`),
};
UI.screen = 'game'; UI.tab = 'people'; UI.render();
const t = document.body.innerText; const i = t.indexOf('Former superior'); out.peopleText = i >= 0 ? t.slice(Math.max(0, i - 200), i + 100) : 'no "Former superior" on People';
return out;
