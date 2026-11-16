const out = {};
const drain = () => { let h, g = 0; while ((h = A.headReady()) && g++ < 300) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); } };
const P = A.P;
const who = id => { const p = P(id); return p ? `${id} ${A.fullName(p)} (${p.alive ? 'alive' : 'DEAD'}, office=${p.office || '-'}, title="${p.title || ''}", mil=${p.mil ? GD.MIL[p.mil.rank].title : '-'})` : id; };
A.newGame({ seed: 41, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 30 });
UI.screen = 'game'; UI.tab = 'life'; UI.render();
const pc = A.pc(), r = A.realm('POL-01');
out.enlist = A.enlist(pc);
out.marshal0 = who(r.council.marshal);
pc.literate = true; pc.fame = 90; for (const k of ['command', 'tactics']) pc.skills[k] = 100;
pc.mil.rank = 8; pc.mil.merit = 99999; pc.mil.battles = 40; pc.mil.armyWins = 9; pc.mil.divWins = 9; pc.mil.rankSince = A.absDay() - 9000;
out.board = A.promoBoard(pc);
let tries = 0; while (pc.mil.rank < 9 && tries++ < 500) A.promoCheck(pc);
out.tries = tries;
out.afterPromo = { rank: GD.MIL[pc.mil.rank].title, milTitle: A.milTitle(pc), pcOffice: pc.office || null, councilMarshal: who(r.council.marshal), oldMarshal: who(out.marshal0.split(' ')[0]), log: A.S.log.length };
// what the UI says about the council
const grab = (tab) => { try { UI.tab = tab; UI.render(); return document.body.innerText; } catch (e) { return 'ERR ' + e.message; } };
const t = grab('realm');
const i = t.indexOf('Marshal');
out.realmTabMarshal = i >= 0 ? t.slice(Math.max(0, i - 300), i + 400) : 'no Marshal on realm tab';
UI.tab = 'life'; UI.render();
// two years on
for (let m = 0; m < 24; m++) { A.advance(30); drain(); if (!A.pc() || !A.pc().alive) break; }
out.twoYearsOn = { alive: pc.alive, rank: pc.mil ? GD.MIL[pc.mil.rank].title : null, councilMarshal: who(r.council.marshal), pcOffice: pc.office || null };
// leave the post
const rs = A.resign();
out.resign = rs;
out.afterResign = { mil: pc.mil ? JSON.stringify({ rank: pc.mil.rank, retired: pc.mil.retired }) : null, councilMarshal: who(r.council.marshal), pcOffice: pc.office || null, milTitle: A.milTitle(pc), title: pc.title };
for (let m = 0; m < 14; m++) { A.advance(30); drain(); if (!A.pc() || !A.pc().alive) break; }
out.yearAfterResign = { mil: pc.mil ? JSON.stringify({ rank: pc.mil.rank, retired: pc.mil.retired }) : null, councilMarshal: who(r.council.marshal), pcOffice: pc.office || null, milTitle: A.milTitle(pc) };
const t2 = grab('realm'); const j = t2.indexOf('Marshal');
out.realmTabMarshalAfter = j >= 0 ? t2.slice(Math.max(0, j - 300), j + 300) : 'no Marshal on realm tab';
out.logTail = A.S.log.slice(-3).map(x => JSON.stringify(x).slice(0, 1500));
return out;
