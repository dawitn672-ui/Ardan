const play = (years) => {
  const end = A.S.year + years;
  for (let guard = 0; guard < 5000 && A.S.year < end; guard++) {
    const r = A.advance(400);
    let h, g = 0;
    while ((h = A.headReady()) && g++ < 500) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); }
    if (r.why === 'dead' || !A.pc() || !A.pc().alive) return 'dead';
  }
  return 'ok';
};
A.newGame({ seed: 21, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 16 });
UI.screen = 'game'; UI.tab = 'life'; UI.render();
const t0 = performance.now();
const res = play(10);
const S = A.S, P = S.people;
const o = { res, ms: performance.now() - t0, year: S.year, n: Object.keys(P).length };
o.armies = (S.armies || []).slice(0, 3).map(a => JSON.stringify(a).slice(0, 600));
o.nArmies = (S.armies || []).length;
const r1 = S.realms['POL-01'];
o.realmKeys = Object.keys(r1);
o.council = r1.council;
o.court = S.court ? Object.keys(S.court) : null;
o.courtSample = S.court ? JSON.stringify(S.court).slice(0, 1500) : null;
o.houseSample = S.houses ? JSON.stringify(Object.values(S.houses)[0]).slice(0, 800) : null;
o.nHouses = S.houses ? Object.keys(S.houses).length : 0;
const withMil = Object.values(P).filter(p => p.mil);
o.nMil = withMil.length;
o.milSample = withMil.slice(0, 5).map(p => ({ id: p.id, alive: p.alive, realm: p.realm, mil: JSON.stringify(p.mil).slice(0, 300), title: p.title, occ: p.occ, company: p.company && JSON.stringify(p.company).slice(0, 200) }));
const withOffice = Object.values(P).filter(p => p.office);
o.offices = withOffice.slice(0, 10).map(p => ({ id: p.id, alive: p.alive, realm: p.realm, office: p.office, title: p.title }));
const withNoble = Object.values(P).filter(p => p.noble);
o.nNoble = withNoble.length;
o.nobleSample = withNoble.slice(0, 4).map(p => ({ id: p.id, alive: p.alive, noble: JSON.stringify(p.noble).slice(0, 300), title: p.title }));
o.jobSample = Object.values(P).filter(p => p.job).slice(0, 5).map(p => ({ id: p.id, job: JSON.stringify(p.job).slice(0, 200) }));
o.pc = { mil: JSON.stringify(A.pc().mil), job: JSON.stringify(A.pc().job), title: A.pc().title, office: A.pc().office, company: JSON.stringify(A.pc().company || null).slice(0, 300), alive: A.pc().alive };
o.companies = S.companies ? JSON.stringify(S.companies).slice(0, 800) : Object.keys(S).filter(k => /comp/i.test(k));
o.sKeys = Object.keys(S);
return o;
