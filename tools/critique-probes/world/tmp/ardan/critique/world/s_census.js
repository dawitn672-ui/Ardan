const P = id => A.S.people[id];
const res = { byStatus: {}, dupFull: 0, dupGivenWithPc: 0, starts: 0, famOffices: [], unplaced: [], staff: 0, impossible: [], exDup: [], realOfficeMatch: 0, kinTypes: {} };
const statuses = ['peasant', 'serf', 'artisan', 'merchant', 'noble', 'royal'];
const realms = ['POL-01', 'POL-03', 'POL-05', 'POL-12', 'POL-17', 'POL-20', 'POL-25', 'POL-30'];
let seed = 500;
for (const st of statuses) for (const rid of realms) {
  seed++;
  try { A.newGame({ seed, race: 'human', realm: rid, status: st, sex: seed % 2 ? 'M' : 'F', startAge: 0 }); } catch (e) { continue; }
  const pc = A.pc(); res.starts++;
  const ids = Object.keys(pc.rel || {});
  const b = res.byStatus[st] = res.byStatus[st] || { n: 0, sum: 0, min: 999, max: 0, alive: 0 };
  b.n++; b.sum += ids.length; b.min = Math.min(b.min, ids.length); b.max = Math.max(b.max, ids.length); b.alive += ids.filter(i => P(i) && P(i).alive).length;
  for (const i of ids) { const t = pc.rel[i].type; res.kinTypes[t] = (res.kinTypes[t] || 0) + 1; if (/servant|nurse|maid|tutor|guard|wet/.test(t)) res.staff++; }
  const full = {}; let dupF = false, dupG = false;
  for (const i of ids) { const q = P(i); if (!q || !q.alive) continue; const f = A.fullName(q); if (full[f]) { dupF = true; if (res.exDup.length < 8) res.exDup.push(`${st}/${rid}: two living kin named ${f}`); } full[f] = 1; if (q.given === pc.given) dupG = true; }
  if (dupF) res.dupFull++; if (dupG) res.dupGivenWithPc++;
  const r = A.S.realms[rid];
  const realHolders = new Set([...Object.values(r.council || {}), ...((r.pol && r.pol.off) || []).map(o => o.pid)]);
  for (const i of ids) { const q = P(i); if (q && q.famOffice) { res.famOffices.push(`${st}/${rid}: ${A.fullName(q)} (${pc.rel[i].type}, ${A.S.year - q.born}) "${q.famOffice}"; council marshal is ${r.council && r.council.marshal ? A.fullName(P(r.council.marshal)) : '-'}`); if (realHolders.has(q.id)) res.realOfficeMatch++; } }
  // unplaced kin and impossible ages
  const gps = ids.filter(i => pc.rel[i].type === 'grandparent').map(P).filter(Boolean);
  const oldestGp = gps.length ? Math.min(...gps.map(g => g.born)) : null;
  for (const i of ids) {
    const q = P(i); if (!q) continue; let k = null; try { k = A.V2F.kinOf(pc, q); } catch (e) {}
    const lab = (() => { try { return A.relLabel(q, pc.rel[i]); } catch (e) { return '?'; } })();
    if (!k && ['uncle', 'cousin', 'grandparent', 'sibling', 'father', 'mother'].includes(pc.rel[i].type)) res.unplaced.push(`${st}/${rid}: ${A.fullName(q)} (${A.S.year - q.born}) stored ${pc.rel[i].type}, shown "${lab}", title "${q.title || ''}"`);
    if (pc.rel[i].type === 'uncle' && oldestGp != null && q.born < oldestGp - 5) res.impossible.push(`${st}/${rid}: "${lab}" ${A.fullName(q)} is ${A.S.year - q.born}, the oldest grandparent ${A.S.year - oldestGp}`);
  }
}
for (const b of Object.values(res.byStatus)) b.mean = +(b.sum / b.n).toFixed(1);
res.famOfficeCount = res.famOffices.length; res.famOffices = res.famOffices.slice(0, 25);
res.unplacedCount = res.unplaced.length; res.unplaced = res.unplaced.slice(0, 15);
return res;
