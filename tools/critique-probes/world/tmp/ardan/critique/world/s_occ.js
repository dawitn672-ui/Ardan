const drain = () => { let h, g = 0; while ((h = A.headReady()) && g++ < 400) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); } };
const P = id => A.S.people[id];
const out = { checks: [] };
A.newGame({ seed: 91, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 18 });
const pc = A.pc(); try { A.enlist(pc); } catch (e) {}
const check = (tag) => {
  const S = A.S, res = { tag, year: S.year, councilOcc: 0, councilOccStale: [], polOcc: 0, polOccStale: [], capOcc: 0, capOccStale: 0, capEx: [], seatWordsMulti: [] };
  const short = {}; for (const r of Object.values(S.realms)) short[r.short] = r;
  const polHolders = new Set(); for (const r of Object.values(S.realms)) for (const o of ((r.pol && r.pol.off) || [])) polHolders.add(o.pid);
  const capHolders = new Set();
  for (const r of Object.values(S.realms)) for (const d of ((r.forces && r.forces.divs) || [])) for (const b of (d.bs || [])) for (const s in (b.p || {})) capHolders.add(b.p[s]);
  // divisions may live elsewhere
  try { for (const d of Object.values(A.S.divs || {})) for (const b of (d.bs || [])) for (const s in (b.p || {})) capHolders.add(b.p[s]); } catch (e) {}
  const perSeat = {};
  for (const p of Object.values(S.people)) {
    if (!p.alive || !p.occ) continue;
    const m = /^(Chancellor|Marshal|Treasurer|Spymaster|Chaplain) of (.+)$/.exec(p.occ);
    if (m && short[m[2]]) {
      res.councilOcc++;
      const r = short[m[2]]; const k = m[1].toLowerCase();
      (perSeat[r.id + ':' + k] = perSeat[r.id + ':' + k] || []).push(p);
      if (!r.council || r.council[k] !== p.id) { if (res.councilOccStale.length < 6) res.councilOccStale.push(`${p.id} ${A.fullName(p)} occ "${p.occ}" but the seat is ${r.council && r.council[k] ? A.fullName(P(r.council[k])) : 'empty'}`); res.councilOccStaleN = (res.councilOccStaleN || 0) + 1; }
    }
    if (/^(Governor|Magistrate|Reeve|Collector|Warden|Prefect|Hall-warden|Chief)/.test(p.occ) && / of /.test(p.occ) && !/of the (village|commons|town|market|guild|manor|castle|harbour|bridge)/.test(p.occ)) { res.polOcc++; if (!polHolders.has(p.id)) { res.polOccStaleN = (res.polOccStaleN || 0) + 1; if (res.polOccStale.length < 5) res.polOccStale.push(`${p.id} ${A.fullName(p)} occ "${p.occ}" holds no office`); } }
    if (/^(Senior )?Captain of the /.test(p.occ)) { res.capOcc++; if (capHolders.size && !capHolders.has(p.id)) { res.capOccStale++; if (res.capEx.length < 5) res.capEx.push(`${p.id} ${A.fullName(p)} occ "${p.occ}"`); } }
  }
  for (const [k, ps] of Object.entries(perSeat)) if (ps.length > 1) res.seatWordsMulti.push(`${k}: ${ps.map(p => A.fullName(p)).join(' / ')}`);
  res.capHolders = capHolders.size;
  out.checks.push(res);
};
check('start');
for (let y = 0; y < 15; y++) { for (let m = 0; m < 12; m++) { A.advance(31); drain(); if (!A.pc() || !A.pc().alive) break; } if (!A.pc() || !A.pc().alive) break; if ((y + 1) % 5 === 0) check('y+' + (y + 1)); }
out.pcAlive = A.pc() && A.pc().alive;
return out;
