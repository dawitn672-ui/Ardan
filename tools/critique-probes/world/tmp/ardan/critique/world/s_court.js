A.newGame({ seed: 77, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
const o = { realms: {} };
const N = A.V2N;
for (const [rid, cr] of Object.entries(A.S.court.realms)) {
  const r = A.S.realms[rid];
  const by = {};
  for (const t of cr.titles || []) by[t.rank] = (by[t.rank] || 0) + 1;
  const counties = (cr.titles || []).filter(t => t.rank === 'count');
  const lows = [];
  for (const c of counties.slice(0, 2)) for (const rank of ['viscount', 'baron', 'lord']) { try { const g = N.lower(rid, c.seat != null ? c.seat : c.provinces[0], rank, 0); lows.push(`${g.title}: ${g.given} ${g.house}`); } catch (e) { lows.push('ERR ' + e.message.slice(0, 60)); } }
  const dukes = (cr.titles || []).filter(t => t.rank === 'duke' || t.rank === 'marquis').slice(0, 3).map(t => { const p = A.P(t.pid); return `${t.name}: ${p ? A.fullName(p) + ' (' + p.race + ', ' + (A.S.year - p.born) + ')' : '-'}`; });
  o.realms[rid] = { name: r.name, race: r.race, gov: r.gov, by, dukes, lows, council: Object.entries(r.council || {}).map(([k, v]) => `${A.COUNCIL[k] ? A.COUNCIL[k].name : k}: ${A.P(v) ? A.fullName(A.P(v)) + ' (' + (A.S.year - A.P(v).born) + ', ' + A.P(v).race + ')' : '-'}`) };
}
o.army01 = { army: A.S.realms['POL-01'].army, levy: A.S.realms['POL-01'].levy, forces: JSON.stringify(A.S.realms['POL-01'].forces || {}).slice(0, 300) };
return o;
